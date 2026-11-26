// 자연 지형 그림 — 밀도장(4px 격자)을 픽셀마다 보간해 윤곽 그대로 그린다.
// 칸 단위 사각형·삼각형을 칠하지 않는다. 충돌(finephys)과 같은 식·같은 계산 순서로 바위/공기를 정하므로
// 보이는 윤곽과 밟는 윤곽이 1px까지 같다.
//
// - 둥근 돌 무늬(세계 좌표) + 공기와의 거리로 안쪽 어둠
// - 위를 향한 면: 윤곽을 따라 풀·이끼·눈·모래 덮개(두께가 바뀌고 아래로 흘러내림) + 그 밑 흙층
// - 옆면·밑면: 바깥 방향(장의 기울기)으로 왼쪽 위 빛 → 밝은 테두리 / 그늘, 밑면엔 매달린 돌·뿌리
// - 지층이 있는 지역은 가로 결(층)과 납작한 돌
// - 장식(풀·버섯·수정·종유석·덩굴)은 실제 윤곽 픽셀에 붙는다
import { H, sh, mix, pack, CAP, ramp, BIOMES, lvq } from "./terrpal.js";
import { paintProp } from "./natprops.js";

const T = 16, COLS = 32, PW = COLS * T;
export const FMARG = 8; // 좌우 여유 (격자 칸) = 32px
const MP = FMARG * 4;

// 조각 하나의 격자(좌우 여유 포함)를 잘라 낸다 — 작업 스레드로 보낸다
// band: 세로 띠 번호 (BANDH px씩). 위아래 BMARG px 여유를 붙여 잘라 낸다 (그늘·테두리가 띠 경계에서 끊기지 않게)
export const BANDH = 768, BMARG = 64;
export function fineSlice(ch, band = -1) {
  const f = ch.fine, F = f.F, LW = F.LW, LHf = F.LH, HPf = (LHf - 1) * 4;
  const n = PW / 4 + 2 * FMARG + 1, i0 = f.x0 / 4 - FMARG;
  let y0 = 0, y1 = HPf, cropTop = 0, cropH = HPf;
  if (band >= 0) {
    const a = band * BANDH, b = Math.min(HPf, a + BANDH);
    y0 = Math.max(0, a - BMARG);
    y1 = Math.min(HPf, b + BMARG);
    cropTop = a - y0;
    cropH = b - a;
  }
  const j0 = y0 / 4, LH = (y1 - y0) / 4 + 1;
  const d = new Float32Array(n * LH);
  for (let j = 0; j < LH; j++) {
    const o = (j0 + j) * LW, p = j * n;
    for (let k = 0; k < n; k++) {
      let i = i0 + k;
      i = i < 0 ? 0 : i > LW - 1 ? LW - 1 : i;
      d[p + k] = F.d[o + i];
    }
  }
  return { d, LW: n, LH, y0, cropTop, cropH, render: f.render, kind: f.kind, pkey: f.pkey, mats: f.mats, walls: f.walls, spec: f.spec, props: f.props, ox: f.ox };
}
// 그린 결과에서 띠 부분만 (여유 줄 빼기)
export function cropBand(res, top, h) {
  const { img, front, wall } = res;
  const W = img.width;
  if (top === 0 && h === img.height) return res;
  const o = top * W * 4, m = h * W * 4;
  const im = mkImage(W, h);
  im.data.set(img.data.subarray(o, o + m));
  return { img: im, front: front.slice(o, o + m), wall: wall.slice(o, o + m) };
}

const mkImage = (w, h) => (typeof ImageData !== "undefined" ? new ImageData(w, h) : { data: new Uint8ClampedArray(w * h * 4), width: w, height: h });

export function* pixFine(ch, base, region, S) {
  const { d, LW, LH } = S;
  const PH = (LH - 1) * 4, EW = (LW - 1) * 4;
  const P = region.pal ?? { rock: 0x9a8a7a, soil: 0x8a6a50, soilDark: 0x4a3428, top: 0x7cc04a, topHi: 0xc4f070, accent: 0xffe060 };
  const th = region.theme ?? "plains";
  const cap = CAP[th] ?? "grass";
  const rh = S.render ?? { stone: 14, strata: 0.3, soil: 8, pebble: 0.3 };
  const img = mkImage(PW, PH);
  const buf = new Uint32Array(img.data.buffer);
  const ug = ch.ug ?? { top: LH, biome: null };
  const BI = ug.biome ? BIOMES[ug.biome] : null;
  const isUG = (r) => r >= ug.top;
  const put = (x, y, c) => x >= 0 && y >= 0 && x < PW && y < PH && (buf[y * PW + x] = pack(c));
  const empty = (x, y) => x >= 0 && y >= 0 && x < PW && y < PH && buf[y * PW + x] === 0;
  const X0 = base * T; // 조각 왼쪽 끝의 세계 x
  const OY = S.y0 ?? 0; // 이 조각(띠) 맨 위의 세계 y

  // ── 1) 바위/공기 (충돌과 같은 식) ──
  const M = new Uint8Array(EW * PH);
  for (let j = 0; j < LH - 1; j++) {
    for (let i = 0; i < LW - 1; i++) {
      const k = j * LW + i;
      const a = d[k], b = d[k + 1], c = d[k + LW], e = d[k + LW + 1];
      const x0 = i * 4, y0 = j * 4;
      if (a > 0 && b > 0 && c > 0 && e > 0) {
        for (let yy = 0; yy < 4; yy++) {
          const o = (y0 + yy) * EW + x0;
          M[o] = M[o + 1] = M[o + 2] = M[o + 3] = 1;
        }
      } else if (a > 0 || b > 0 || c > 0 || e > 0) {
        for (let xx = 0; xx < 4; xx++) {
          const fu = (xx + 0.5) / 4;
          const A = a + (b - a) * fu, B = c + (e - c) * fu;
          for (let yy = 0; yy < 4; yy++) {
            const fv = (yy + 0.5) / 4;
            M[(y0 + yy) * EW + x0 + xx] = A + (B - A) * fv > 0 ? 1 : 0;
          }
        }
      }
    }
  }
  yield;
  // ── 2) 거리 (모따기 3·4): 바위 안 → 공기까지, 공기 → 바위까지 ──
  const D = new Uint8Array(EW * PH), DA = new Uint8Array(EW * PH);
  for (let k = 0; k < D.length; k++) M[k] ? ((D[k] = 255), (DA[k] = 0)) : ((D[k] = 0), (DA[k] = 255));
  const chamfer = (A, on) => {
    for (let y = 0; y < PH; y++)
      for (let x = 0, k = y * EW; x < EW; x++, k++) {
        if (M[k] !== on) continue;
        let v = A[k];
        if (x > 0 && A[k - 1] + 3 < v) v = A[k - 1] + 3;
        if (y > 0) {
          if (A[k - EW] + 3 < v) v = A[k - EW] + 3;
          if (x > 0 && A[k - EW - 1] + 4 < v) v = A[k - EW - 1] + 4;
          if (x < EW - 1 && A[k - EW + 1] + 4 < v) v = A[k - EW + 1] + 4;
        }
        A[k] = v;
      }
    for (let y = PH - 1; y >= 0; y--)
      for (let x = EW - 1, k = y * EW + EW - 1; x >= 0; x--, k--) {
        if (M[k] !== on) continue;
        let v = A[k];
        if (x < EW - 1 && A[k + 1] + 3 < v) v = A[k + 1] + 3;
        if (y < PH - 1) {
          if (A[k + EW] + 3 < v) v = A[k + EW] + 3;
          if (x < EW - 1 && A[k + EW + 1] + 4 < v) v = A[k + EW + 1] + 4;
          if (x > 0 && A[k + EW - 1] + 4 < v) v = A[k + EW - 1] + 4;
        }
        A[k] = v;
      }
  };
  chamfer(D, 1);
  yield;
  chamfer(DA, 0);
  yield;
  // ── 3) 세로줄마다 바위 구간 [시작, 끝) ──
  const runOff = new Int32Array(EW + 1), runA = [];
  for (let x = 0; x < EW; x++) {
    runOff[x] = runA.length;
    let s = -1;
    for (let y = 0; y < PH; y++) {
      const m = M[y * EW + x];
      if (m && s < 0) s = y;
      else if (!m && s >= 0) (runA.push(s, y), (s = -1));
    }
    s >= 0 && runA.push(s, PH);
  }
  runOff[EW] = runA.length;
  const RUN = Int32Array.from(runA);
  // 옆 줄에서 y0와 가장 가까운 윗면 (없으면 -1)
  const topNear = (x, y0, lim = 18) => {
    if (x < 0 || x >= EW) return -1;
    let best = -1, bd = lim + 1;
    for (let q = runOff[x]; q < runOff[x + 1]; q += 2) {
      const s = RUN[q];
      if (s <= 0) continue;
      const dd = Math.abs(s - y0);
      dd < bd && ((bd = dd), (best = s));
    }
    return best;
  };
  // 장의 기울기 → 바깥(공기) 방향
  const normal = (ex, y) => {
    const u = (ex + 0.5) / 4, v = (y + 0.5) / 4;
    const i = Math.min(LW - 2, u | 0), j = Math.min(LH - 2, v | 0), fu = u - i, fv = v - j, k = j * LW + i;
    const gx = (d[k + 1] - d[k]) * (1 - fv) + (d[k + LW + 1] - d[k + LW]) * fv;
    const gy = (d[k + LW] - d[k]) * (1 - fu) + (d[k + LW + 1] - d[k + 1]) * fu;
    const L = Math.sqrt(gx * gx + gy * gy);
    return L < 1e-4 ? null : [-gx / L, -gy / L];
  };

  // ── 재질 ──
  const RAMP = {};
  const rampOf = (b) => (RAMP[b] = RAMP[b] ?? ramp(b));
  const regionBase = {
    plains: mix(P.rock, P.soil, 0.3), forest: mix(mix(P.rock, 0x4a6a44, 0.3), P.soil, 0.2), cave: mix(P.rock, P.soil, 0.45),
    desert: mix(P.soil, P.rock, 0.35), snow: mix(P.rock, 0xa8d0f0, 0.45), fortress: mix(P.rock, 0x8a5a48, 0.25),
    kingdom: mix(P.rock, 0xf0ecf4, 0.4), abyss: P.rock,
  }[th] ?? mix(P.rock, P.soil, 0.3);
  // 그린스텝: 붉은 사암 탁상 고원 — 가로 지층(크림·연어·녹·황토), 세로로 갈라진 결, 두꺼운 풀 덮개, 흘러내린 이끼 줄
  const STEP = region.look === "greenstep";
  const SANDS = STEP ? [0xe6c49a, 0xd89a76, 0xc07a58, 0xd8aa6a, 0xead2b2, 0xb86a4e, 0xcc8c64].map((c) => rampOf(mix(c, P.rock, 0.45))) : null;
  const MOSSR = STEP ? rampOf(mix(P.top, 0x2e5a22, 0.45)) : null;
  // 지역 팔레트가 땅속 바위·뒷벽 색을 정하면 생물군계 색보다 먼저 (동굴 구역마다 다른 바위색)
  const ugBase = P.ugRock ?? (BI ? BI.rock : mix(regionBase, 0x3a3448, 0.35));
  // 종유석 끝 색: 지역 바위색을 따른다 (석회 동굴은 하얗게)
  const DRIP = P.ugRock ? [mix(ugBase, 0xffffff, 0.5), mix(ugBase, 0x101418, 0.45), mix(ugBase, 0xffffff, 0.15)] : [0xd8b088, 0x6a4a30, 0xa8845e];
  const SOIL = rampOf(mix(P.soilDark ?? sh(P.soil, -0.4), P.soil, 0.55));
  const G = rh.stone ?? 14;
  const strata = rh.strata ?? 0.3;
  const soilT = rh.soil ?? 8;
  // 값 잡음 (부드러운 2D)
  const vn2 = (x, y, s) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = H(i, j, s), b = H(i + 1, j, s), c = H(i, j + 1, s), e = H(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
  };
  const vn1 = (x, s) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return H(i, s, 5) * (1 - u) + H(i + 1, s, 5) * u;
  };
  // 지표 높이 (4px마다, 지상 구역만)
  const SP = ug.surfPx;
  const surfAt = (x) => {
    if (!SP) return ug.top <= 0 ? -1e9 : 1e9;
    const u = (x + 0.5) / 4, i = Math.max(0, Math.min(SP.length - 2, u | 0)), f = Math.max(0, Math.min(1, u - i));
    return SP[i] + (SP[i + 1] - SP[i]) * f;
  };
  // 땅속 암석이 시작하는 깊이: 지표를 따라가며 들쭉날쭉 (한 줄로 곧게 바뀌지 않는다)
  const ugTopPx = ug.top * T;
  const matY = new Float32Array(PW + 32);
  for (let x = -16; x < PW + 16; x++) {
    const wx = X0 + x;
    const base0 = SP ? Math.max(ugTopPx - 40, surfAt(x) + 88) : ugTopPx;
    matY[x + 16] = base0 + (vn1(wx / 70, 61) - 0.5) * 48 + (vn1(wx / 17, 62) - 0.5) * 12;
  }
  const isUGp = (x, y) => (ug.top <= 0 ? !0 : ug.top * T >= OY + PH ? !1 : y + OY >= matY[Math.max(0, Math.min(PW + 31, x + 16))]);
  // 지층 띠 (세계 좌표, 완만하게 휜다)
  const bandWarp = (wx) => (vn1(wx / 64, 77) * 14 + vn1(wx / 256, 78) * 10);
  const BH = 22;
  // 돌 무늬: 큰 돌·보통 돌·작은 돌이 섞이고, 돌 틈이 모두 같은 굵기의 선이 되지 않게
  const stoneL = (wx, y, ugc, layered) => {
    const G0 = ugc && BI ? 15 : G;
    const sel = vn2(wx / 96, y / 72, 63) + (H(wx >> 1, y >> 1, 64) - 0.5) * 0.12;
    const Gs = sel > 0.64 ? Math.round(G0 * 1.6) : sel < 0.3 ? Math.max(7, Math.round(G0 * 0.62)) : G0;
    const sx = layered ? 0.82 : 1;
    let L = lvq(wx * sx + (Gs * 97) % 1000, y, Gs);
    if (L === 5 && H(wx >> 2, y >> 2, 95) < 0.3) L = 4;
    return L;
  };

  // ── 재질 구역 (나무줄기·잎·벽돌·버섯): 세계 좌표 사각형 → 이 조각의 픽셀 지도 ──
  const MATC = { wood: 1, leaf: 2, brick: 3, stem: 4, cap: 5, rock: 6, ice: 7, jelly: 8, trim: 9, bough: 10 };
  let MM = null;
  const MX = S.ox ?? X0; // 재질·뒷벽 사각형은 구역 기준 좌표
  if (S.mats && S.mats.length) {
    MM = new Uint8Array(PW * PH);
    for (const r of S.mats) {
      const c = MATC[r.m] ?? 0;
      const x0 = Math.max(0, Math.floor(r.x0 - MX)), x1 = Math.min(PW, Math.ceil(r.x1 - MX));
      const y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      for (let y = y0; y < y1; y++) MM.fill(c, y * PW + x0, Math.max(y * PW + x0, y * PW + x1));
    }
  }
  // 지붕 있는 섬 속(정해진 뒷벽 구역): 바닥에 풀 대신 바위 가장자리 (계단 단마다 풀이 돋아 계단처럼 보이지 않게)
  let IW = null;
  if (S.walls && S.walls.length) {
    IW = new Uint8Array(PW * PH);
    for (const r of S.walls) {
      if (r.m === "stem") continue;
      const x0 = Math.max(0, Math.floor(r.x0 - MX)), x1 = Math.min(PW, Math.ceil(r.x1 - MX));
      const y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY) + 4);
      for (let y = y0; y < y1; y++) x1 > x0 && IW.fill(1, y * PW + x0, y * PW + x1);
    }
  }
  // 잎 무늬: 6px 격자마다 비스듬한 잎사귀 하나 — 가장 가까운 잎의 안쪽 거리 d(<1 = 잎), 잎 안 위치(빛 방향)
  const leafPat = (wx, yw) => {
    const g = 6, gx = Math.floor(wx / g), gy = Math.floor(yw / g);
    let best = 9, bu = 0, bv = 0, bh = 0;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        const ix = gx + di, iy = gy + dj, cx = (ix + H(ix, iy, 201)) * g, cy = (iy + H(ix, iy, 202)) * g, a = H(ix, iy, 203) * 3.1416;
        const dx = wx - cx, dy = yw - cy, ca = Math.cos(a), sa = Math.sin(a), u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
        const d = (u / 4.6) ** 2 + (v / 2.5) ** 2;
        d < best && ((best = d), (bu = dx), (bv = dy), (bh = H(ix, iy, 204)));
      }
    return { d: best, lit: -(bu + bv) / 5, h: bh };
  };
  // 잎 덩어리 (거점 화풍): 11px 격자마다 잎 뭉치 하나 — 아래(앞) 뭉치가 위를 덮고, 뭉치마다 왼쪽 위 밝고 밑면 그늘, 사이 틈은 짙게, 잎 점 질감
  const leafL = (wx, yw) => {
    const g = 11, gx = Math.floor(wx / g), gy = Math.floor(yw / g);
    let hit = null;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        const ix = gx + di, iy = gy + dj, cx = (ix + 0.2 + H(ix, iy, 201) * 0.6) * g, cy = (iy + 0.2 + H(ix, iy, 202) * 0.6) * g, r = g * (0.6 + H(ix, iy, 203) * 0.32);
        const ang = Math.atan2(yw - cy, wx - cx), re = r * (1 + (H(Math.round(((ang + 3.1416) * r) / 3), ix * 31 + iy, 204) - 0.5) * 0.24);
        const d = Math.hypot(wx - cx, (yw - cy) * 1.1) / re;
        if (d < 1 && (!hit || cy > hit[1])) hit = [cx, cy, re, d];
      }
    if (!hit) return 4;
    const [cx, cy, r, d] = hit, nx = (wx - cx) / r, ny = (yw - cy) / r, lam = -nx * 0.5 - ny * 0.8 + Math.sqrt(Math.max(0, 1 - d * d)) * 0.35;
    let L = lam > 0.45 ? 1 : lam > 0.05 ? 2 : 3;
    if (ny > 0.4 && d > 0.7) L = 4;
    const hb = H(wx >> 1, yw >> 1, 205);
    if (hb > 0.93) L = Math.max(0, L - 1);
    else if (hb < 0.05) L = Math.min(4, L + 1);
    const cl = vn2(wx / 34, yw / 26, 205);
    if (cl > 0.7) L = Math.max(0, L - 1);
    else if (cl < 0.25) L = Math.min(4, L + 1);
    return L;
  };
  // 나무껍질 (거점 화풍): 크게 굽이치는 골과 폭이 다른 껍질 판, 골 깊이가 길이 따라 달라지고, 판 안에 짧은 가로 금 · 붓 얼룩 — rot = 가로 결 (가지)
  const barkL = (wx, yw, rot) => {
    const a = rot ? yw : wx, b = rot ? wx : yw;
    const u = a + vn1(b / 23, 41) * 9 + vn1(b / 7, 43) * 2 + vn1(b / 90, 44) * 10, id = Math.floor(u / 7), f = u - id * 7;
    const gw = 1 + H(id, Math.floor(b / 34), 211) * 1.4;
    if (f < gw) return 4;
    let L = f < gw + 1.3 ? 1 : f < 4.8 ? 2 : 3;
    ((b + Math.floor(H(id, 7, 206) * 40)) % (17 + (id % 7))) < 1 && f > gw + 0.5 && f < 6 && (L = 4);
    H(id, Math.floor(b / 24), 207) > 0.78 && L > 1 && L < 4 && L--;
    const hb = H(a >> 1, b >> 1, 209);
    if (hb > 0.92 && L > 0 && L < 4) L += H(a, b, 210) > 0.5 ? 1 : -1;
    return L;
  };
  const inIW = (x, y) => IW !== null && x >= 0 && x < PW && y >= 0 && y < PH && IW[y * PW + x] === 1;
  const BARK = rampOf(mix(0x6a4428, P.soil, 0.2)), LEAF = rampOf(mix(P.top, 0x2e6a30, 0.3)), BRICK = rampOf(mix(P.rock, 0xc0b098, 0.45));
  // 다듬은 돌 (아치 테·처마 띠·교각 머리): 어두운 회청색 큰 석재
  const TRIM = rampOf(mix(mix(P.rock, 0x6a7488, 0.5), 0xd8d4cc, 0.15));
  const STEM = rampOf(0xe0d4b8), CAPR = rampOf(mix(P.accent ?? 0xd04040, 0xc83838, 0.55));
  const ICE = rampOf(0xa8dcf4), JELLY = rampOf(0xe070c0);
  const matCol = (m, x, y, wx, yw, dd, ex) => {
    let L, R6;
    if (m === 1) {
      // 나무껍질: 세로 결 + 옹이
      R6 = BARK;
      L = barkL(wx, yw, 0);
      // 옹이는 드물게, 결을 따라 길쭉하게
      if (H(wx >> 2, yw >> 4, 42) > 0.985) L = 3;
    } else if (m === 2) {
      // 잎: 뭉친 덩어리 (돌 무늬를 잎 크기로)
      R6 = LEAF;
      L = leafL(wx, yw);
    } else if (m === 3) {
      R6 = BRICK;
      const row = Math.floor(yw / 8), off = row & 1 ? 8 : 0, bx = (((wx + off) % 16) + 16) % 16, by = ((yw % 8) + 8) % 8, bid = Math.floor((wx + off) / 16);
      const bv = H(bid, row, 44), chip = H(bid, row, 46) > 0.75 && ((bx < 2 && by < 2) || (bx > 13 && by > 5));
      if (by === 7 || bx === 15 || chip) L = 4;
      else {
        L = bv > 0.75 ? 1 : bv < 0.25 ? 3 : 2;
        if (by === 0 || bx === 0) L = Math.max(0, L - 1);
        else if (by === 6 || bx === 14) L = Math.min(4, L + 1);
        const hb = H(wx >> 1, yw >> 1, 45);
        if (hb > 0.9) L = Math.min(4, L + 1);
        else if (hb < 0.06) L = Math.max(0, L - 1);
        if (vn2(wx / 40, yw / 30, 47) > 0.72) L = Math.min(4, L + 1);
      }
    } else if (m === 10) {
      R6 = BARK;
      L = barkL(wx, yw, 1);
    } else if (m === 9) {
      // 다듬은 돌: 24×12 큰 석재, 위·왼 모 밝게, 줄눈 어둡게, 돌마다 밝기
      R6 = TRIM;
      const row = Math.floor(yw / 12), off = row & 1 ? 12 : 0, bx = (((wx + off) % 24) + 24) % 24, by = ((yw % 12) + 12) % 12;
      L = by === 11 || bx === 23 ? 4 : by === 0 || bx === 0 ? 1 : H(Math.floor((wx + off) / 24), row, 51) > 0.75 ? 3 : 2;
    } else if (m === 4) {
      R6 = STEM;
      L = (wx % 5 === 0 ? 2 : 1) + (H(wx, yw >> 2, 46) > 0.9 ? 1 : 0);
    } else if (m === 5) {
      R6 = CAPR;
      L = H(wx >> 3, yw >> 3, 47) > 0.9 && (wx & 7) > 1 && (yw & 7) > 1 ? -1 : 1 + ((wx >> 2) % 3 === 0 ? 1 : 0);
      if (L < 0) return 0xfff4e0;
    } else if (m === 7) {
      // 얼음: 밝은 하늘색, 비스듬한 반짝임 줄
      R6 = ICE;
      L = (wx - yw * 2) % 23 === 0 || (wx - yw * 2) % 23 === 1 ? 0 : H(wx >> 2, yw >> 2, 48) > 0.8 ? 2 : 1;
    } else if (m === 8) {
      // 튕김 버섯(젤리): 분홍, 점무늬, 윗줄 밝게
      R6 = JELLY;
      L = H(wx >> 2, yw >> 2, 49) > 0.82 ? 0 : (yw & 7) < 2 ? 1 : 2;
    } else return null;
    // 테두리·빛
    if (dd <= 3) L = 5;
    else if (dd <= 7) {
      const n = normal(ex, y);
      if (n) {
        const lit = n[0] * -0.6 + n[1] * -0.8;
        lit > 0.4 ? (L = Math.max(0, L - 1)) : lit < -0.3 && (L = Math.min(4, L + 1));
      }
    }
    return R6[L];
  };

  // ── 4) 바위 칠하기 ──
  for (let x = 0; x < PW; x++) {
    if ((x & 15) === 0) yield;
    const ex = x + MP, wx = X0 + x;
    const bw = strata > 0 ? bandWarp(wx) : 0;
    // 땅 위(하늘섬·지표) 바위: 띠가 크게 휘고 기운다 (곧은 줄무늬가 네모나 보이지 않게)
    const bws = strata > 0 ? vn1(wx / 120, 79) * 56 + vn1(wx / 40, 80) * 12 + vn1(wx / 400, 81) * 40 : 0;
    for (let q = runOff[ex]; q < runOff[ex + 1]; q += 2) {
      const s = RUN[q], e = RUN[q + 1];
      const realTop = s > 0;
      // 윗면 기울기 (양옆 3px 줄의 윗면 높이로)
      let up = 0;
      if (realTop) {
        const l = topNear(ex - 3, s), r = topNear(ex + 3, s);
        const sl = l >= 0 && r >= 0 ? (r - l) / 6 : l >= 0 ? (s - l) / 3 : r >= 0 ? (r - s) / 3 : 0;
        up = 1 / Math.sqrt(1 + sl * sl);
      }
      const ugTop = isUGp(x, s);
      const capT = ugTop ? (BI?.cap ? "moss" : "rock") : inIW(x, s - 2) ? "rock" : cap;
      const cTop = capT === "moss" ? BI.cap[0] : capT === "snow" ? 0xeef6ff : capT === "sand" ? P.topHi : P.top;
      const cHi = capT === "moss" ? BI.cap[1] : capT === "snow" ? 0xffffff : capT === "sand" ? 0xfff6d0 : P.topHi;
      const CR = rampOf(cTop);
      const soft = capT === "grass" || capT === "moss" || capT === "snow" || capT === "sand";
      const sw = s + OY;
      const capN = soft ? (capT === "snow" ? 6 : capT === "sand" ? 4 : 5) + Math.floor(H(wx >> 1, sw, 11) * 3) - (up < 0.75 ? 1 : 0) + (STEP ? 3 : 0) : 3;
      const drip = soft ? Math.floor(H(wx >> 1, sw >> 2, 12) * 3) + (H(wx >> 2, sw >> 2, 13) > 0.82 ? 3 : 0) : 0;
      const hasCap = realTop && up > (soft ? 0.5 : 0.42);
      const soilN = hasCap && soft && !ugTop && soilT > 0 ? soilT + Math.floor((vn1(wx / 40, 14) - 0.5) * 10) : 0;
      const RT = rampOf(ugTop ? ugBase : regionBase);
      for (let y = s; y < e; y++) {
        const k = y * EW + ex, dd = D[k], yw = y + OY;
        if (MM && MM[y * PW + x]) {
          const mc = matCol(MM[y * PW + x], x, y, wx, yw, dd, ex);
          if (mc !== null) {
            put(x, y, mc);
            continue;
          }
        }
        const ugc = isUGp(x, y);
        const R5 = ugc ? rampOf(ugBase) : rampOf(regionBase);
        const dt = realTop ? y - s : 9999;
        let col;
        if (hasCap && dt < capN + drip) {
          // 덮개 (윤곽을 따라)
          if (soft) {
            if (dt === 0) col = CR[5];
            else if (dt === 1) col = cHi;
            else if (dt < 3) col = H(wx >> 1, yw >> 1, 15) > 0.55 ? cHi : mix(cHi, cTop, 0.45);
            else if (dt < capN - 1) col = H(wx >> 1, yw >> 1, 16) > 0.8 ? mix(cTop, cHi, 0.35) : H(wx >> 1, yw >> 1, 17) < 0.12 ? CR[3] : cTop;
            else if (dt < capN) col = CR[3];
            else col = dt === capN + drip - 1 ? CR[5] : CR[4];
            // 덮개 옆(낭떠러지 끝)은 테두리
            dd <= 3 && dt > 0 && (col = CR[5]);
          } else col = dt === 0 ? RT[5] : dt === 1 ? RT[1] : RT[2];
          put(x, y, col);
          continue;
        }
        let L, ramp5 = R5;
        if (hasCap && dt < capN + drip + soilN) {
          // 흙층 (거점 땅 단면처럼): 4px 가로 결 띠 + 2px 붓 뭉치 + 드문드문 박힌 둥근 돌, 위쪽은 풀뿌리 그늘
          ramp5 = SOIL;
          const band = Math.floor((yw + vn1(wx / 50, 15) * 4) / 4), bv = H(band, wx >> 4, 16), sd = (dt - capN - drip) / Math.max(1, soilN);
          L = 2 + (bv > 0.72 ? -1 : bv < 0.2 ? 1 : 0) + (sd > 0.65 ? 1 : 0);
          const hb = H(wx >> 1, yw >> 1, 17);
          hb > 0.88 ? L-- : hb < 0.08 && L++;
          if (H(Math.floor(wx / 9), Math.floor(yw / 9), 19) > 0.66) { const sL = lvq(wx * 1.1 + 500, yw * 1.1, 9); sL < 5 && ((ramp5 = R5), (L = Math.min(4, sL + 1))); }
          dt < capN + drip + 2 && (L = Math.min(4, L + 1));
          L = Math.max(0, Math.min(4, L));
        } else if (STEP && !ugc) {
          // 사암 지층: 띠마다 색이 다르고, 띠 안은 가로로 긴 얼룩, 띠 사이 금, 세로 골
          // 띠 두께 16~34px (띠마다 다르게), 띠 안은 거의 한 톤 (가끔 가로로 긴 밝은·어두운 결)
          const warp = vn1(wx / 110, 83) * 12 + vn1(wx / 37, 84) * 3;
          const yy = yw + warp, f0 = Math.floor(yy / 26), th = 16 + Math.floor(H(f0, 3, 85) * 18), band = f0 * 2 + (yy - f0 * 26 < th * 0.6 ? 0 : 1), fr = ((yy % 26) + 26) % 26 / 26;
          ramp5 = SANDS[Math.floor(H(band, 7, 85) * SANDS.length)];
          L = 2 + (vn2(wx / 60, yw / 7, 86) > 0.74 ? -1 : vn2(wx / 48, yw / 6, 87) < 0.2 ? 1 : 0);
          H(wx >> 1, yw >> 1, 88) > 0.985 && (L = Math.min(4, L + 1));
          fr < 0.05 && H(wx >> 4, band, 89) < 0.85 && (L = Math.min(4, L + 1));
          const gx = wx + Math.floor(vn1(yw / 40, 90) * 8), per = 54 + Math.floor(H(Math.floor(gx / 70), 1, 91) * 30);
          gx % per < 2 && H(Math.floor(gx / per), Math.floor(yw / 60), 92) < 0.7 && (L = 4);
          // 윗면 풀에서 흘러내린 이끼 줄
          if (hasCap && dt < capN + drip + soilN + 40 && H(wx >> 1, 3, 93) > 0.86 && dt < capN + drip + soilN + 8 + H(wx >> 1, 4, 94) * 34) ((ramp5 = MOSSR), (L = Math.min(4, Math.max(1, L))));
        } else {
          // 바위: 지층 지역은 결 따라 납작해지고 층 사이 금이 간다
          const layered = strata > 0 && !(ugc && BI);
          const bwv = ugc ? bw : bws;
          L = stoneL(wx, yw, ugc, layered && H(Math.floor((yw + bwv) / BH), 91) < strata * 0.55);
          if (layered && L < 5) {
            // 층 사이 금은 군데군데 끊기고, 띠 밝기는 일부만 다르다 (벽돌 줄처럼 보이지 않게)
            const f = (yw + bwv) / BH, band = Math.floor(f), fr = f - band;
            if (fr < 1 / BH && H(wx >> 3, band, 92) < strata * (ugc ? 0.6 : 0.35)) L = Math.min(4, L + 2);
            else if (H(band + (ugc ? 0 : Math.floor(wx / 150) * 131), 93) < strata * 0.35) L = Math.max(0, L - 1);
          }
        }
        // 안쪽일수록 어둡게 (띠가 생기지 않게 점점이 섞이며 넘어간다)
        const dpx = dd / 3;
        if (L < 5 && dpx > 10) {
          const t = (dpx - 10) / 30, hv = H(wx >> 1, yw >> 1, 97) * 0.35 + vn2(wx / 7, yw / 7, 98) * 0.65;
          L = Math.min(4, L + (hv < t ? 1 : 0) + (hv < t - 0.55 ? 1 : 0));
        }
        // 테두리 + 바깥 방향에 따른 빛(왼쪽 위)과 그늘
        if (dd <= 3) L = 5;
        else if (dd <= 9) {
          const n = normal(ex, y);
          if (n) {
            const lit = n[0] * -0.6 + n[1] * -0.8, near = dd <= 6;
            const hi = ugc ? 1 : near ? 2 : 1;
            if (lit > 0.5) L = Math.max(0, L - hi);
            else if (lit > 0.2 && near) L = Math.max(0, L - 1);
            else if (lit < -0.45) L = Math.min(4, L + (near ? 2 : 1));
            else if (lit < -0.1 && near) L = Math.min(4, L + 1);
          }
        }
        col = ramp5[L];
        // 용암 지대: 틈새가 빛난다
        // 쇠맥 광산: 바위 속에 녹슨 쇠맥·광석 알갱이
        if (BI && ugc && ug.biome === "mine" && L >= 2 && dd > 2) {
          const v = H(wx >> 2, yw >> 2, 61);
          if (v > 0.986) col = v > 0.997 ? 0xffc070 : H(wx, yw, 62) > 0.5 ? 0xb05a2a : 0x7a3a1e;
        }
        if (BI && ugc && ug.biome === "magma" && L === 5 && dd > 3 && H(wx >> 3, yw >> 3, 51) > 0.7) col = mix(0xff6a20, 0xffd060, H(wx, yw, 52) * 0.5);
        put(x, y, col);
      }
    }
  }
  // 매달린 것(뿌리·덩굴 장식, 사다리·밧줄·덩굴 장치 …)이 칠한 픽셀: 입체 앞면 그림에서 뺀다
  const HANG = new Uint8Array(PW * PH), hang = (x, y, c) => (put(x, y, c), x >= 0 && y >= 0 && x < PW && y < PH && (HANG[y * PW + x] = 1));
  // ── 5) 밑면에 매달린 돌·뿌리·덩굴·고드름 ──
  for (let ex = MP - 4; ex < MP + PW + 4; ex++) {
    if ((ex & 15) === 0) yield;
    const x = ex - MP, wx = X0 + x;
    for (let q = runOff[ex]; q < runOff[ex + 1]; q += 2) {
      const e = RUN[q + 1];
      if (e >= PH) continue;
      // 재질 구역(나무·벽돌 등) 밑면엔 돌 고드름이 없다
      if (MM && x >= 0 && x < PW && e > 0 && MM[(e - 1) * PW + x]) continue;
      const ew = e + OY, r = ew >> 4, ugc = isUGp(x, e);
      const R5 = ugc ? rampOf(ugBase) : rampOf(regionBase);
      const hv = H(wx >> 2, ew >> 2, 9);
      if (hv > 0.62) {
        const L = Math.floor(H(wx >> 2, ew >> 2, 10) * 6) + 2 - Math.abs((wx & 3) - 1.5) * 1.6;
        for (let k = 0; k < L; k++) {
          if (!empty(x, e + k)) break;
          const edge = k >= Math.floor(L) - 1 || (wx & 3) === 0;
          put(x, e + k, edge ? R5[5] : (wx & 3) === 1 ? R5[3] : R5[4]);
        }
      }
      if (!ugc && H(wx, r, 61) > 0.93) {
        // 섬 밑동의 뿌리
        const L2 = 8 + Math.floor(H(wx, r, 62) * 26);
        for (let k = 0; k < L2; k++) {
          const xx = ((k >> 2) + (wx & 1)) % 3 === 0 ? 1 : 0;
          empty(x + xx, e + k) && hang(x + xx, e + k, k % 6 === 5 ? 0x7ab04a : k % 2 ? 0x5a3a22 : 0x6e4a2c);
        }
      } else if (!ugc && (th === "forest" || th === "kingdom") && H(wx, r, 31) > 0.88) {
        const L2 = 6 + Math.floor(H(wx, r, 32) * 22);
        for (let k = 0; k < L2; k++) {
          const xx = x + ((k >> 2) & 1 ? 1 : 0) - ((k >> 3) & 1 ? 1 : 0);
          empty(xx, e + k) && hang(xx, e + k, k % 5 === 4 ? sh(P.top, 0.2) : sh(P.top, -0.35 + (k % 2) * 0.1));
        }
      } else if (!ugc && th === "snow" && H(wx >> 1, r, 33) > 0.72) {
        const L2 = 3 + Math.floor(H(wx >> 1, r, 34) * 10) - Math.abs((wx & 1) - 0.5) * 2;
        for (let k = 0; k < L2; k++) empty(x, e + k) && put(x, e + k, k < 2 ? 0xffffff : mix(0xc8ecff, 0x7ab8e8, k / L2));
      }
    }
  }
  // ── 5b) 특수 블럭: 나무판·구름(한쪽만 막는 발판), 물(반투명) ──
  if (S.spec && S.spec.length) {
    const MX2 = S.ox ?? X0;
    const PL = rampOf(mix(0x9a6c40, P.soil, 0.2)), CL = [0xfffaf0, 0xf6efe2, 0xdfe4ea, 0xb8c6d6, 0x8c9cb4, 0x6a7890], WA = mix(mix(0x2e6a78, P.sky ? P.sky[0] ?? 0x3a8ad8 : 0x3a8ad8, 0.3), 0x3a5a4a, 0.25);
    const LAD = rampOf(mix(0x9a6a3a, P.soil, 0.15)), ROPE = rampOf(0xc8a870), VIN = rampOf(mix(P.top ?? 0x4a9a3a, 0x2e7a30, 0.4)), RAIL = rampOf(0x8a8c96);
    const ap = (k, c, al) => (buf[k] = ((al << 24) | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0);
    // 매달리는 장치(사다리·밧줄·덩굴·짚라인·바람·승강기·나룻 줄)가 칠한 픽셀: 입체 앞면 그림에서는 뺀다 (지형처럼 여러 겹 복제되지 않게)
    const putH = (x, y, c) => (put(x, y, c), x >= 0 && y >= 0 && x < PW && y < PH && (HANG[y * PW + x] = 1));
    const apH = (k, c, al) => (ap(k, c, al), (HANG[k] = 1));
    for (const r of S.spec) {
      if (r.t >= 6 && r.t !== 11 && r.t !== 12) {
        const x0 = Math.max(0, Math.floor(r.x0 - MX2)), x1 = Math.min(PW, Math.ceil(r.x1 - MX2));
        const y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
        if (x0 >= x1 || y0 >= y1) continue;
        const cx = (r.x0 + r.x1) / 2;
        for (let x = x0; x < x1; x++) {
          const wx = MX2 + x, dx = wx - r.x0, dr = r.x1 - 1 - wx;
          if (r.t === 9) {
            // 짚라인: 줄 (어두운 줄 + 위 밝은 줄), 양 끝 쇠고리
            if (r.ax == null) continue;
            const lo = Math.min(r.ax, r.bx), hi = Math.max(r.ax, r.bx);
            if (wx < lo - 4 || wx > hi + 4) continue;
            const ly = Math.round(hi > lo ? r.ay + ((r.by - r.ay) * (Math.min(hi, Math.max(lo, wx)) - r.ax)) / (r.bx - r.ax) : r.ay) - OY;
            if (wx >= lo && wx <= hi) {
              ly - 1 >= 0 && ly - 1 < PH && putH(x, ly - 1, RAIL[1]);
              ly >= 0 && ly < PH && putH(x, ly, RAIL[3]);
            }
            if (Math.abs(wx - lo) <= 3 || Math.abs(wx - hi) <= 3) for (let yy = ly - 4; yy <= ly + 3; yy++) yy >= 0 && yy < PH && putH(x, yy, RAIL[(yy - ly + 4) % 3 === 0 ? 4 : 2]);
            continue;
          }
          for (let y = y0; y < y1; y++) {
            const yw = OY + y, dy = yw - r.y0, k = y * PW + x;
            if (r.t === 6) {
              // 사다리: 양옆 기둥 + 8px마다 가로대
              // 둥근 통나무 기둥(바깥 밝고 안쪽 그늘) + 가로대 + 이음매를 묶은 끈
              const rail = dx <= 2 || dr <= 2, rr = dx <= 2 ? dx : 2 - dr;
              if (rail) putH(x, y, LAD[rr === 0 ? 1 : rr === 1 ? 2 : 4]);
              else if (dy % 8 === 2) putH(x, y, LAD[H(wx >> 1, Math.floor(dy / 8), 81) > 0.8 ? 0 : 1]);
              else if (dy % 8 === 3) putH(x, y, LAD[4]);
              if ((dx === 3 || dr === 3) && (dy % 8 === 1 || dy % 8 === 3)) putH(x, y, ROPE[2]);
            } else if (r.t === 7) {
              // 밧줄: 꼬인 줄 3px, 24px마다 매듭
              const off = Math.abs(wx - Math.round(cx)), knot = dy % 24 < 3;
              if (off <= (knot ? 2 : 1)) putH(x, y, ROPE[knot ? (off === 2 ? 4 : 2) : (yw + wx) % 4 < 2 ? 1 : 3]);
            } else if (r.t === 8) {
              // 덩굴: 구불구불한 줄기 여러 가닥 + 잎
              const sx = Math.round(Math.sin(yw * 0.09 + Math.floor(wx / 7) * 1.7) * 1.5);
              const stem = (wx + sx) % 7 === 0, leaf = !stem && H(wx >> 1, yw >> 2, 91) > 0.82 && (wx + sx) % 7 <= 2;
              if (stem) putH(x, y, VIN[3]);
              else if (leaf) putH(x, y, VIN[H(wx, yw, 92) > 0.5 ? 0 : 1]);
            } else if (r.t === 10) {
              // 바람: 옅은 흰 결 (위로 부는 기둥은 세로, 옆으로 부는 바람 길은 가로)
              if (r.dx) {
                if (yw % 9 === 0 && (wx + yw * 3) % 30 < 11) apH(k, 0xf4fbff, 34);
                else if (yw % 9 === 4 && (wx + yw * 7) % 38 < 7) apH(k, 0xffffff, 22);
              } else if (wx % 11 === 0 && (yw + wx * 3) % 26 < 9) apH(k, 0xf4fbff, 38);
              else if (wx % 11 === 5 && (yw + wx * 5) % 34 < 6) apH(k, 0xffffff, 24);
            } else if (r.t === 15) {
              // 승강기 길: 양옆 쇠 레일 + 64px마다 버팀목
              if (dx <= 2 || dr <= 2) putH(x, y, RAIL[dx === 0 || dr === 0 ? 4 : dx === 1 || dr === 1 ? 2 : 1]);
              else if (dy % 64 < 4 && dy > 8) putH(x, y, LAD[dy % 64 === 0 ? 1 : 3]);
            } else if (r.t === 20) {
              // 나룻 줄: 위 2px 꼰 줄, 양 끝 나무 기둥
              if (dy <= 1) putH(x, y, ROPE[dy ? 3 : (wx & 3) < 2 ? 1 : 2]);
              else if (dx <= 2 || dr <= 2) putH(x, y, LAD[dx === 0 || dr === 0 ? 3 : 1]);
            } else if (r.t === 17) {
              // 간헐천 구멍: 바닥 가운데 광물 테
              const off = Math.abs(wx - cx);
              if (r.y1 - yw <= 3 && off < 14) putH(x, y, off < 6 ? 0x2a3a48 : mix(0xd8e0c0, 0xa8b890, off / 14));
            }
          }
        }
        continue;
      }
      const x0 = Math.max(0, Math.floor(r.x0 - MX2)), x1 = Math.min(PW, Math.ceil(r.x1 - MX2));
      const y0 = Math.max(0, Math.floor(r.y0 - OY) - (r.t === 2 ? 6 : 0)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      if (x0 >= x1 || y0 >= y1) continue;
      for (let x = x0; x < x1; x++) {
        const wx = MX2 + x;
        for (let y = y0; y < y1; y++) {
          const yw = OY + y, dy = yw - r.y0, dx = wx - r.x0, dr = r.x1 - 1 - wx;
          if (r.t === 1) {
            // 나무판 (거점 화풍): 판마다 길이·밝기 다르고 물결 나뭇결, 이음매 옆 못, 윗면 빛 · 아랫줄 그늘, 끝은 마구리
            const hh = r.y1 - r.y0, bl = 14 + Math.floor(H(Math.floor((wx - r.x0) / 18), r.y0, 73) * 10), bi = Math.floor((wx - r.x0) / bl), bx2 = (wx - r.x0) % bl;
            let L = 2 + (H(bi, r.y0, 74) > 0.7 ? -1 : H(bi, r.y0, 74) < 0.2 ? 1 : 0);
            if ((dy + Math.round(vn1((wx + bi * 37) / 9, 75) * 2)) % 4 === 0 && dy > 1) L = Math.min(4, L + 1);
            if (H(wx >> 1, yw, 76) > 0.92 && L > 0) L += H(wx, yw, 77) > 0.5 ? 1 : -1;
            if (bx2 === bl - 1) L = 5;
            else if (bx2 === 0) L = Math.max(0, L - 1);
            if ((bx2 === 2 || bx2 === bl - 3) && dy === 2) L = 0;
            if (dy === 0) L = 0;
            else if (dy === 1) L = Math.min(L, 1);
            else if (dy === hh - 1) L = 5;
            else if (dy === hh - 2) L = Math.min(5, L + 1);
            if (dx === 0 || dr === 0) L = 5;
            put(x, y, PL[Math.max(0, Math.min(5, L))]);
          } else if (r.t === 2) {
            // 구름: 위로 볼록한 뭉게 (8px마다 높이가 다른 혹), 아래는 평평
            const bump = 2 + Math.floor(H(wx >> 3, r.y0, 71) * 5);
            if (dy < -bump) continue;
            // 붓 구름: 혹마다 위가 크림빛, 아래로 갈수록 하늘빛 그늘, 가장자리는 짙은 선 대신 한 단 그늘, 붓 뭉치
            const edge = dy === -bump || dx === 0 || dr === 0 || dy === r.y1 - r.y0 - 1, hb = H(wx >> 1, yw >> 1, 78);
            let L = dy < -bump + 2 ? 0 : dy < 2 ? 1 : dy > 9 ? 3 : 2;
            if (hb > 0.88) L = Math.max(0, L - 1);
            else if (hb < 0.1) L = Math.min(4, L + 1);
            if (edge) L = Math.max(L, dy < 0 ? 2 : 4);
            put(x, y, CL[L]);
          } else if (r.t === 3 || r.t === 11 || r.t === 12) {
            // 물: 반투명 파랑, 수면은 밝은 줄
            const k = y * PW + x;
            if (buf[k] && dy > 0) continue;
            // 깊을수록 짙은 파랑, 수면 밝은 줄(물결 따라 굵기 다름), 물속 빛무늬(겹친 물결), 반짝임
            // 물 (거점 화풍): 짙은 청록 → 깊을수록 어둡게, 수면 밝은 줄 한 겹 + 그 아래 옅은 띠, 물속엔 짧은 가로 물결 빛과 비친 하늘 얼룩
            const depth = Math.min(1, dy / Math.max(10, r.y1 - r.y0)), base = mix(WA, 0x0e1e24, depth * 0.7);
            const wave = Math.sin(wx * 0.19 + r.y0) * 0.8 + Math.sin(wx * 0.07 + 2.1) * 0.6;
            let c = base;
            if (dy < 1 + (wave > 0.9 ? 1 : 0)) c = mix(WA, 0xf4f0e0, 0.62);
            else if (dy < 3 + (wave > 0.3 ? 1 : 0)) c = mix(WA, 0xe8f0e8, 0.22);
            else {
              const rip = H(Math.floor((wx + dy * 3) / 7), yw, 79);
              if (rip > 0.86 && dy % 3 === 0) c = mix(c, 0xd8e8e0, 0.32 * (1 - depth * 0.7));
              if (vn2(wx / 26, yw / 9, 80) > 0.72) c = mix(c, 0x5a8a90, 0.25 * (1 - depth));
              if (H(wx >> 2, yw >> 1, 72) > 0.985) c = mix(c, 0xffffff, 0.28);
            }
            // 물살: 흐르는 쪽으로 기운 밝은 결
            if (r.t !== 3 && dy > 4 && (wx - (r.t === 12 ? 1 : -1) * Math.floor(dy / 3) * 2 + 400) % 22 < 6 && dy % 7 === 3) c = mix(c, 0xe8f8ff, 0.4);
            const al = dy < 2 ? 235 : Math.round(150 + depth * 70);
            buf[k] = ((al << 24) | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0;
          }
        }
      }
    }
  }
  // 입체 레이어용: 밟을 수 있는 것만 담은 그림
  const front = new Uint8ClampedArray(img.data);
  for (let k = 0; k < HANG.length; k++) HANG[k] && (front[k * 4 + 3] = 0);
  const wall = new Uint8ClampedArray(img.data.length);
  const wallBuf = new Uint32Array(wall.buffer);
  yield;
  // ── 6) 지하 뒷벽: 지표 아래, 위가 바위로 덮인 공기에만 (바위 가까이는 더 어둡게) ──
  if (ug.top * T < OY + PH) {
    const wallBase = P.ugWall ?? (BI ? BI.wall : mix(regionBase, 0x0e0a14, 0.7));
    const WR = rampOf(sh(wallBase, 0.08));
    for (let x = 0; x < PW; x++) {
      if ((x & 31) === 0) yield;
      const ex = x + MP, wx = X0 + x;
      const wallTop = SP ? surfAt(x) + 2 - OY : -1;
      // 지표에서 이만큼 아래는 땅속 (굴 입구처럼 위가 뚫려 있어도 뒷벽이 보인다)
      const deep = SP ? surfAt(x) + 26 - OY : -1;
      let prevEnd = -1;
      const n = runOff[ex + 1];
      for (let q = runOff[ex]; q <= n; q += 2) {
        const a = prevEnd, b = q < n ? RUN[q] : PH;
        // 공기 구간 [a, b): 위가 바위로 덮였거나 지표보다 충분히 깊은 곳만 (하늘이 뚫린 곳은 배경이 보인다)
        // 띠 맨 위부터 공기인 동굴(지표 없음)은 위가 바위로 덮여 있다고 본다
        const y0 = a > 0 ? Math.max(a, Math.ceil(wallTop)) : SP ? Math.max(0, Math.ceil(deep)) : OY > 0 && ug.top <= 0 ? 0 : PH;
        if (y0 < b)
          for (let y = y0; y < b && (a <= 0 || y - a < 960 || S.kind === "cave"); y++) {
            // 뒷벽 (거점 화풍): 돌 면은 2~3단으로 낮은 대비, 틈은 4단(검은 선 대신), 큰 얼룩은 부드럽게, 붓 뭉치
            const L0 = lvq(wx * 0.8 + 3000, (y + OY) * 0.8, 18);
            let L = L0 === 5 ? 4 : L0 <= 1 ? 2 : 3;
            const hb = H((wx >> 1) + 9, (y + OY) >> 1, 145);
            if (hb > 0.9 && L > 2) L--;
            else if (hb < 0.08 && L < 4) L++;
            vn2(wx / 100, (y + OY) / 80, 143) > 0.7 && L < 4 && (L = Math.min(4, L + 1));
            // 흘러내린 석회 줄무늬 (가늘고 긴 세로 띠)
            const fl = vn2(wx / 4.5, (y + OY) / 170, 151);
            fl > 0.74 && L > 2 && L < 5 && (L -= 1);
            fl < 0.16 && L < 5 && (L += 1);
            const da = DA[y * EW + ex];
            da <= 9 ? (L = 5) : da <= 18 && (L = Math.min(5, L + 1));
            wallBuf[y * PW + x] = pack(WR[L]);
          }
        prevEnd = q < n ? RUN[q + 1] : PH;
      }
    }
  }
  // ── 6b) 정해진 뒷벽 구역: 공기에만 ──
  if (S.walls && S.walls.length) {
    const WC = {
      wood: rampOf(mix(0x3a2416, P.soil, 0.2)),
      brick: rampOf(mix(mix(P.rock, 0xc0b098, 0.45), 0x1a1420, 0.6)),
      rock: rampOf(mix(regionBase, 0x2a2430, 0.45)),
      stem: rampOf(0xd8ccb0),
      leaf: rampOf(mix(P.top ?? 0x4a8a3a, 0x1a3a1e, 0.34)),
      inwood: rampOf(mix(0x4a2c18, P.soil, 0.15)),
    };
    // 잎 뒷벽 덮인 자리 (가장자리 판별용)
    const LM = new Uint8Array(PW * PH);
    for (const r of S.walls) {
      if (r.m !== "leaf") continue;
      const x0 = Math.max(0, Math.floor(r.x0 - MX)), x1 = Math.min(PW, Math.ceil(r.x1 - MX)), y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      for (let y = y0; y < y1; y++) x1 > x0 && LM.fill(1, y * PW + x0, y * PW + x1);
    }
    const lmAt = (x, y) => (x < 0 || y < 0 || x >= PW || y >= PH ? 1 : LM[y * PW + x]);
    // 그린스텝: 바위 뒷벽도 사암 지층 (그늘진 색)
    const SW = STEP ? [0xe6c49a, 0xd89a76, 0xc07a58, 0xd8aa6a, 0xead2b2, 0xb86a4e, 0xcc8c64].map((c) => rampOf(mix(mix(c, P.rock, 0.4), 0x2a1a20, 0.52))) : null;
    const wdef = new Uint8Array(PW * PH);
    for (const r of S.walls) {
      const R6 = WC[r.m] ?? WC.rock;
      let RR = R6;
      const x0 = Math.max(0, Math.floor(r.x0 - MX)), x1 = Math.min(PW, Math.ceil(r.x1 - MX));
      const y0 = Math.max(0, Math.floor(r.y0 - OY)), y1 = Math.min(PH, Math.ceil(r.y1 - OY));
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const ex = x + MP;
          if (M[y * EW + ex] || wdef[y * PW + x]) continue;
          wdef[y * PW + x] = 1;
          const wx = X0 + x, yw = y + OY;
          let L;
          if (r.m === "stem") L = wx % 5 === 0 ? 2 : 1;
          else if (r.m === "wood") {
            // 세로 판자 (폭 10) + 96px마다 가로 들보, 결·이음매·못
            // 좁은 판자 (폭 6~7) + 96px마다 들보(밑에 그늘), 판마다 밝기, 물결 나뭇결, 붓 얼룩, 못
            const pw = 6, px = ((wx % pw) + pw) % pw, pid = Math.floor(wx / pw), bm = ((yw % 96) + 96) % 96;
            if (bm < 8) L = bm === 0 ? 1 : bm >= 6 ? 4 : 2;
            else if (px === pw - 1) L = 5;
            else {
              const pv = H(pid, 5, 3);
              L = pv < 0.3 ? 2 : pv > 0.8 ? 4 : 3;
              if (px === 0) L = Math.max(1, L - 1);
              if (bm < 14) L = Math.min(5, L + 1);
              if ((yw + Math.floor(vn1(pid * 7.3 + yw / 37, 41) * 9)) % 11 === 0 && px > 0 && px < pw - 2) L = Math.min(4, L + 1);
              if (H(wx >> 1, yw >> 1, 212) > 0.93 && L < 5) L += H(wx, yw, 213) > 0.5 ? 1 : -1;
              if ((bm === 11 || bm === 90) && px === 2) L = 0;
            }
          } else if (r.m === "brick") {
            // 벽돌 16×8: 줄눈, 위·왼 모서리 빛, 아래·오른 모서리 그늘, 벽돌마다 밝기 다름, 흠집, 큰 얼룩
            const row = Math.floor(yw / 8), off = row & 1 ? 8 : 0, bx = (((wx + off) % 16) + 16) % 16, by = ((yw % 8) + 8) % 8, bid = Math.floor((wx + off) / 16) * 31 + row * 17;
            if (by === 7 || bx === 15) L = 5;
            else {
              const bv = H(bid, 7, 2);
              L = bv < 0.18 ? 2 : bv > 0.86 ? 4 : 3;
              if (by === 0 || bx === 0) L = Math.max(1, L - 1);
              else if (by === 6 || bx === 14) L = Math.min(5, L + 1);
              H(wx, yw, 9) > 0.965 && (L = Math.min(5, L + 1));
            }
            vn2(wx / 60, yw / 48, 141) > 0.74 && L < 5 && (L = Math.min(4, L + 1));
          } else if (r.m === "leaf") {
            // 잎: 잎사귀가 겹친 무늬, 가장자리(4px 안에 잎이 없는 쪽)에선 잎 틈을 비워 들쭉날쭉한 윤곽
            const q = leafPat(wx, yw), edge = !lmAt(x - 4, y) || !lmAt(x + 4, y) || !lmAt(x, y - 4) || !lmAt(x, y + 4);
            if (edge && q.d > 0.8) {
              wdef[y * PW + x] = 0;
              continue;
            }
            L = leafL(wx, yw);
            edge && L > 0 && L--;
          } else if (r.m === "inwood") {
            // 나무 속 (파낸 줄기 안): 어두운 세로 결 + 나이테 줄
            L = barkL(wx, yw, 0) >= 4 ? 4 : (((Math.hypot(wx % 64 - 32, yw % 96 - 48) | 0) % 5) === 0 ? 3 : 2);
          } else if (SW && r.m === "rock") {
            // 사암 지층 띠 (완만히 휜다) + 띠 사이 어두운 줄 + 드문 세로 금
            const yb = yw + bandWarp(wx) * 0.7, b = Math.floor(yb / 9);
            RR = SW[((b % SW.length) + SW.length) % SW.length];
            const n = vn2(wx / 15, yw / 5, 143);
            L = n < 0.3 ? 2 : n > 0.74 ? 4 : 3;
            ((yb % 9) + 9) % 9 < 1 && (L = Math.min(5, L + 1));
            H(Math.floor(wx / 3), Math.floor(yw / 40), 144) > 0.994 && ((yw % 40) + 40) % 40 < 14 && (L = Math.min(5, L + 1));
          } else {
            const L0 = lvq(wx * 0.8 + 3000, yw * 0.8, 18);
            L = L0 === 5 ? 4 : L0 <= 1 ? 2 : 3;
            const hb = H((wx >> 1) + 9, yw >> 1, 146);
            if (hb > 0.9 && L > 2) L--;
            else if (hb < 0.08 && L < 4) L++;
            vn2(wx / 90, yw / 70, 142) > 0.7 && L < 4 && (L = Math.min(4, L + 1));
          }
          const da = DA[y * EW + ex];
          da <= 9 && (L = Math.min(5, L + 1));
          wallBuf[y * PW + x] = pack(RR[L]);
        }
    }
  }
  // ── 7) 장식 (실제 윤곽에) ──
  const onBrick = (x, y) => MM && x >= 0 && x < PW && y >= 0 && y < PH && (MM[y * PW + x] === 3 || MM[y * PW + x] === 9);
  const decoFloor = (x, y, wx, r) => {
    if (onBrick(x, y) || inIW(x, y - 2)) return;
    const h = H(wx, r, 21);
    if (isUGp(x, y) && BI) {
      switch (ug.biome) {
        case "lush":
          if (h > 0.93) {
            const L = 4 + Math.floor(H(wx, 71) * 6);
            for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, 0x3a7a2a);
            for (let dx = -3; dx <= 3; dx++) empty(x + dx, y - L - 1) && put(x + dx, y - L - 1, Math.abs(dx) === 3 ? 0x2a5a1e : 0x6ac040);
            for (let dx = -2; dx <= 2; dx++) empty(x + dx, y - L - 2) && put(x + dx, y - L - 2, 0x9ae060);
          } else if (h > 0.88) {
            for (let dy = 1; dy <= 4; dy++) for (let dx = -3; dx <= 3; dx++) Math.abs(dx) + dy < 6 && empty(x + dx, y - dy) && put(x + dx, y - dy, H(wx + dx, dy, 72) > 0.75 ? 0xf080c0 : dy > 2 ? 0x4a8a34 : 0x3a6a2a);
          } else if (h > 0.5) {
            const L = 1 + Math.floor(H(wx, 22) * 3);
            for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, k === L ? 0xa8e070 : 0x5a9a3a);
          }
          break;
        case "drip":
          if (h > 0.92) {
            const L = 4 + Math.floor(H(wx, 73) * 12), w = 1 + Math.floor(L / 6);
            for (let k = 1; k <= L; k++) {
              const ww = Math.max(0, Math.round(w * (1 - k / L)));
              for (let dx = -ww; dx <= ww; dx++) empty(x + dx, y - k) && put(x + dx, y - k, dx < 0 ? DRIP[0] : dx > 0 ? DRIP[1] : DRIP[2]);
            }
          }
          break;
        case "geode":
          if (h > 0.92) {
            const L = 3 + Math.floor(H(wx, 74) * 8);
            for (let k = 1; k <= L; k++) for (const dx of [-1, 0, 1]) (dx === 0 || k < L - 1) && empty(x + dx, y - k) && put(x + dx, y - k, dx < 0 ? 0xe0b0ff : dx > 0 ? 0x5a2a90 : 0x9a5ae0);
            empty(x, y - L - 1) && put(x, y - L - 1, 0xffffff);
          } else if (h > 0.84) for (let dx = -1; dx <= 1; dx++) empty(x + dx, y - 1) && put(x + dx, y - 1, 0xf0f0f8);
          break;
        case "mine":
          // 바닥: 떨어진 광석 부스러기 · 쇠 알갱이
          if (h > 0.9) {
            const w = 2 + Math.floor(H(wx, 77) * 3);
            for (let dx = 0; dx < w; dx++) empty(x + dx, y - 1) && put(x + dx, y - 1, dx === 1 && h > 0.96 ? 0xffb060 : H(wx + dx, 78) > 0.5 ? 0x8a4a26 : 0x5a5058);
            h > 0.97 && empty(x + 1, y - 2) && put(x + 1, y - 2, 0x6a5e66);
          }
          break;
        case "deep":
          if (h > 0.72) {
            const w = 2 + Math.floor(H(wx, 75) * 4);
            for (let dx = 0; dx < w; dx++) put(x + dx, y, H(wx + dx, 76) > 0.6 ? 0x40fff0 : 0x0e6a6a);
            h > 0.95 && (put(x, y - 1, 0x0e6a6a), put(x, y - 2, 0x40fff0), put(x - 1, y - 2, 0x0e6a6a), put(x + 1, y - 2, 0x0e6a6a));
          }
          break;
        case "magma":
          if (h > 0.86) {
            put(x, y, 0xff8030);
            empty(x, y - 1) && put(x, y - 1, 0xffd060);
          }
          break;
      }
      return;
    }
    if (th === "forest" && h > 0.985) {
      const red = H(wx, 41) > 0.5;
      for (let k = 1; k <= 3; k++) empty(x, y - k) && put(x, y - k, 0xe8dcc0);
      for (const dx of [-2, -1, 0, 1, 2]) empty(x + dx, y - 4) && put(x + dx, y - 4, red ? 0xd8323a : 0xe0a040);
      for (const dx of [-1, 0, 1]) empty(x + dx, y - 5) && put(x + dx, y - 5, red ? 0xff6a5a : 0xffd070);
      empty(x, y - 4) && put(x, y - 4, 0xffffff);
    } else if ((th === "cave" || th === "kingdom") && h > 0.975) {
      const L = 3 + Math.floor(H(wx, 42) * 5);
      for (let k = 1; k <= L; k++) for (const dx of [0, 1]) empty(x + dx, y - k) && put(x + dx, y - k, dx ? mix(P.accent, 0x000000, 0.25) : mix(P.accent, 0xffffff, 0.35));
      empty(x, y - L - 1) && put(x, y - L - 1, 0xffffff);
    } else if (th === "desert" && h > 0.985) {
      for (let k = 1; k <= 5; k++) empty(x, y - k) && put(x, y - k, 0x5a9a3a);
      empty(x - 1, y - 3) && put(x - 1, y - 3, 0x5a9a3a);
      empty(x + 1, y - 4) && put(x + 1, y - 4, 0x5a9a3a);
    } else if (cap === "grass" && h > 0.55) {
      // 풀포기 (거점 화풍): 두세 가닥이 서로 다르게 기울어 자라고, 끝이 밝고 밑동이 짙다. 군데군데 흙빛으로 누른 들꽃
      const GR = [mix(P.topHi, P.top, 0.25), P.top, sh(P.top, -0.22), sh(P.top, -0.42)], n = 1 + Math.floor(H(wx, 23) * 3);
      let tip = 0;
      for (let b = 0; b < n; b++) {
        const L = 2 + Math.floor(H(wx + b * 7, r, 22) * 5), lean = (H(wx, b, 24) - 0.5) * 1.1, dx0 = b - (n >> 1);
        for (let k = 1; k <= L; k++) { const xx = x + dx0 + Math.round(lean * k * 0.6); empty(xx, y - k) && put(xx, y - k, k === L ? GR[0] : k > L * 0.55 ? GR[1] : k > 1 ? GR[2] : GR[3]); }
        tip = Math.max(tip, L);
      }
      if (h > 0.972) {
        const FL = [0xece4d0, 0xe0b850, 0xc87a90, 0x9a86c8, mix(P.accent, 0x8a7a5a, 0.3)], fc = FL[Math.floor(H(wx, 25) * FL.length)];
        empty(x, y - tip - 1) && put(x, y - tip - 1, fc), empty(x + 1, y - tip - 1) && put(x + 1, y - tip - 1, sh(fc, -0.25)), empty(x, y - tip - 2) && put(x, y - tip - 2, sh(fc, 0.2));
      }
    } else if (cap === "snow" && h > 0.9) empty(x, y - 1) && put(x, y - 1, 0xffffff);
  };
  const decoCeil = (x, y, wx, r) => {
    if (!(isUGp(x, y) && BI) || onBrick(x, y - 1)) return;
    const h = H(wx, r, 81);
    switch (ug.biome) {
      case "lush":
        if (h > 0.9) {
          const L = 8 + Math.floor(H(wx, r, 82) * 40);
          for (let k = 0; k < L; k++) {
            const xx = x + (((k >> 2) + wx) & 1 ? 1 : 0) - (((k >> 3) + wx) & 1 ? 1 : 0);
            if (!empty(xx, y + k)) break;
            put(xx, y + k, k % 2 ? 0x3a7a2a : 0x4e9a34);
            k % 7 === 5 && (put(xx + 1, y + k, 0xffb040), put(xx + 1, y + k + 1, 0xffe080));
          }
        } else if (h > 0.86) {
          for (const [dx, dy] of [[0, 0], [-1, 1], [1, 1], [0, 1], [-2, 2], [2, 2], [0, 2]]) empty(x + dx, y + dy) && put(x + dx, y + dy, dy === 2 ? 0xff70b0 : 0x6a9a3a);
        }
        break;
      case "drip":
      case "geode":
        if (h > 0.84) {
          const L = 5 + Math.floor(H(wx, r, 83) * 18), w = 1 + Math.floor(L / 7);
          const geo = ug.biome === "geode";
          for (let k = 0; k < L; k++) {
            const ww = Math.max(0, Math.round(w * (1 - k / L)));
            for (let dx = -ww; dx <= ww; dx++) empty(x + dx, y + k) && put(x + dx, y + k, geo ? (dx < 0 ? 0xe0b0ff : dx > 0 ? 0x5a2a90 : 0x9a5ae0) : dx < 0 ? DRIP[0] : dx > 0 ? DRIP[1] : DRIP[2]);
          }
        }
        break;
      case "mine":
        // 천장: 녹물 흘러내린 자국 + 짧은 쇠 고드름
        if (h > 0.88) {
          const L = 2 + Math.floor(H(wx, r, 84) * 6);
          for (let k = 0; k < L; k++) empty(x, y + k) && put(x, y + k, k === L - 1 ? 0xd07a3a : k > L / 2 ? 0x8a4a26 : 0x4a3a3e);
        }
        break;
      case "deep":
        h > 0.9 && [0, 1, 2].forEach((k) => empty(x, y + k) && put(x, y + k, k === 2 ? 0x40fff0 : 0x0e3a3a));
        break;
      case "magma":
        h > 0.9 && [0, 1, 2, 3].forEach((k) => empty(x, y + k) && put(x, y + k, k > 1 ? 0xff8030 : 0x3a1a10));
        break;
    }
  };
  for (let ex = MP - 6; ex < MP + PW + 6; ex++) {
    if ((ex & 15) === 0) yield;
    const x = ex - MP, wx = X0 + x;
    for (let q = runOff[ex]; q < runOff[ex + 1]; q += 2) {
      const s = RUN[q], e = RUN[q + 1];
      if (s > 0) {
        const l = topNear(ex - 3, s), r = topNear(ex + 3, s);
        const sl = l >= 0 && r >= 0 ? (r - l) / 6 : 9;
        // 완만한 윗면에만 (가파른 비탈·벼랑 끝엔 안 자란다)
        Math.abs(sl) < 1.1 && decoFloor(x, s, wx, (s + OY) >> 4);
      }
      e < PH && decoCeil(x, e, wx, (e + OY) >> 4);
    }
  }
  // ── 8) 소품 (3D 픽셀 그림, 설계도 구역): 아무것도 안 그려진 공기 칸에만 ──
  const PP = { top: P.top, rock: P.rock, acc: P.accent ?? 0xffe060 };
  const propSprite = (p) => paintProp(p.k, p.s, p.v, p.acc != null ? { ...PP, acc: p.acc } : PP, p.sc ?? 1, p.g ?? 0, p.ext ? { h: p.s, w: p.v } : null);
  if (S.props && S.props.length) {
    let nP = 0;
    // 앞 소품 먼저, 뒤 장식은 남은 빈 칸에 (앞 소품 뒤에 보인다)
    const order = S.props.filter((p) => !p.bg).concat(S.props.filter((p) => p.bg));
    for (const p of order) {
      (++nP & 7) === 0 && (yield);
      const D = propSprite(p);
      const bx = Math.round(p.x - MX - D.ax), by = Math.round(p.y - OY - D.ay);
      if (bx + D.w < 0 || bx >= PW || by + D.h < 0 || by >= PH) continue;
      for (let j = 0; j < D.h; j++) {
        const y = by + j;
        if (y < 0 || y >= PH) continue;
        for (let i = 0; i < D.w; i++) {
          const x = bx + i, s4 = (j * D.w + i) * 4;
          if (x < 0 || x >= PW || !D.data[s4 + 3]) continue;
          if (p.bg) {
            // 뒤 장식: 뒷벽이 있는 곳에만, 조금 어둡게 (깊이감) — 뒷벽 층에 그려 뒷벽과 같은 깊이로 움직인다
            if (!wallBuf[y * PW + x]) continue;
            wallBuf[y * PW + x] = pack(mix((D.data[s4] << 16) | (D.data[s4 + 1] << 8) | D.data[s4 + 2], 0x140c1e, p.dim ?? 0.22));
            continue;
          }
          if (buf[y * PW + x] !== 0) continue;
          put(x, y, (D.data[s4] << 16) | (D.data[s4 + 1] << 8) | D.data[s4 + 2]);
        }
      }
    }
  }
  // ── 9) 빛 웅덩이: 횃불·화로·초·수정·버섯·창 둘레의 뒷벽과 바위를 은은하게 (단계를 점점이 섞는다) ──
  if (S.props && S.props.length) {
    const LIT = { p_torch: [100, 0xffa848, 0.5], p_brazier: [130, 0xff9a40, 0.55], p_candles: [64, 0xffc070, 0.36], p_chand: [120, 0xffc070, 0.45], p_altar: [80, 0xffc070, 0.36], p_niche: [56, 0xffc070, 0.32], p_crystal: [90, 0, 0.36], p_shroom: [70, 0, 0.3], p_window: [110, 0xc8e8ff, 0.3] };
    const unpack = (v) => ((v & 255) << 16) | (v & 0xff00) | ((v >> 16) & 255);
    const lit = (v, tint, q) => pack(sh(mix(unpack(v), tint, q * 0.5), q * 0.45));
    let nL = 0;
    for (const p of S.props) {
      const Lp = LIT[p.k];
      if (!Lp) continue;
      (++nL & 3) === 0 && (yield);
      const D = propSprite(p), sc = p.sc ?? 1, r = Lp[0] * Math.sqrt(sc), tint = Lp[1] || (p.acc ?? 0x80d0ff);
      const cx = p.x - MX - D.ax + D.w / 2, cy = (p.hang ? p.y + D.h * 0.7 : p.y - D.h * 0.65) - OY;
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(PW - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(PH - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (d2 > r * r) continue;
          const t = 1 - Math.sqrt(d2) / r, q = Math.round((Lp[2] * t * t + (H(x + X0, y + OY, 131) - 0.5) * 0.08) * 8) / 8;
          if (q <= 0) continue;
          const k = y * PW + x;
          if (wallBuf[k]) wallBuf[k] = lit(wallBuf[k], tint, q);
          else if (buf[k]) buf[k] = lit(buf[k], tint, q * 0.55);
        }
    }
  }
  return { img, front, wall };
}
