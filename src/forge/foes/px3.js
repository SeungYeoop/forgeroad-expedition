// 큰 몬스터용 조각 도구 (60px 이상) — 부위마다 따로 명암을 주지 않고, 그림 전체를 한 장의 "높이 지도"로 조각한다
//   add    : 모양을 높이로 쌓는다. blend 를 주면 아래 덩어리에 부드럽게 녹아든다 (근육·배·혹). 안 주면 앞에 놓인 별개 부위
//   carve  : 높이를 파낸다 → 근육 경계·주름·흉터가 빛에 따라 저절로 음각으로 보인다
//   paint  : 높이는 그대로 재질만 바꾼다 (줄무늬·점무늬)
//   decal  : 마지막에 정한 색 그대로 찍는다 (눈·이빨)
//   render : 높이 지도 → 법선 → 빛(왼쪽 위) + 다른 부위가 드리우는 그림자 + 틈새 어두움(AO) + 땅 반사광 + 재질 질감
//            → 재질 색 묶음 7단으로 나누고 → 외톨이 픽셀 정리 → 앞 부위 경계 선 → 바깥 외곽선(재질의 가장 어두운 색)
import { canvas } from "./px2d.js";
export { ellR, capF, polyF, U, minus, pol, lerp, ik } from "./pgob.js";

const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x, y, s = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
// 재질: ramp = [외곽, 그늘, 어둠, 중간, 기본, 밝음, 반짝] · tex 질감 · amp 질감 세기 · dir 결 방향(라디안) · spec 반짝임(쇠·젖은 것)
export const mat = (ramp, o = {}) => ({ ramp, tex: null, amp: 0.1, dir: 0, spec: 0, ...o });
const TEX = {
  skin: (x, y) => (vnoise(x * 0.45, y * 0.45, 3) - 0.5) * 0.9 + (hash(x, y, 9) > 0.965 ? -0.9 : 0),
  fur: (x, y, m) => {
    const c = Math.cos(m.dir), s = Math.sin(m.dir), u = x * c + y * s, w = -x * s + y * c;
    return (vnoise(u * 0.28, w * 1.1, 5) - 0.5) * 2 + (vnoise(u * 0.6, w * 2.2, 6) - 0.5);
  },
  wood: (x, y, m) => {
    const c = Math.cos(m.dir), s = Math.sin(m.dir), u = x * c + y * s, w = -x * s + y * c;
    return Math.sin(w * 1.4 + vnoise(u * 0.12, w * 0.25, 7) * 5) * 0.8 + (hash(Math.round(u * 0.3), Math.round(w), 2) > 0.92 ? -0.8 : 0);
  },
  leather: (x, y) => (vnoise(x * 0.6, y * 0.6, 11) - 0.5) * 1.2 + (hash(x, y, 4) > 0.97 ? 0.8 : 0),
  cloth: (x, y) => ((x + y) & 1 ? 0.25 : -0.25) + (vnoise(x * 0.3, y * 0.3, 13) - 0.5),
  stone: (x, y) => (vnoise(x * 0.35, y * 0.35, 17) - 0.5) * 1.6 + (hash(x, y, 8) > 0.9 ? -0.6 : 0),
  // 쇠·놋쇠: 결 방향 긁힘 + 녹·때 얼룩 + 드문 흠
  metal: (x, y, m) => { const c = Math.cos(m.dir), s = Math.sin(m.dir), u = x * c + y * s, w = -x * s + y * c; return (hash(Math.round(u * 0.25), Math.round(w), 19) - 0.5) * 0.8 + (vnoise(x * 0.18, y * 0.18, 20) - 0.5) * 1.4 + (hash(x, y, 21) > 0.97 ? -1 : 0); },
  // 유리: 비스듬한 반사 띠 + 매끈한 굴절 얼룩
  glass: (x, y) => ((((x + y * 1.6) % 13) + 13) % 13 < 1.2 ? 1.4 : 0) + (vnoise(x * 0.15, y * 0.15, 22) - 0.5) * 0.8,
  // 수정: 결정 면 띠 (비스듬한 평행 면) + 속 반짝
  crystal: (x, y, m) => { const c = Math.cos(m.dir + 0.7), s = Math.sin(m.dir + 0.7), u = (x * c + y * s) / 3.5; return (Math.floor(u) % 2 ? 0.6 : -0.4) + (hash(x, y, 23) > 0.96 ? 1.2 : 0); },
  // 깃털: 깃 끝이 겹친 비늘 무늬 (결 방향으로 흐름)
  feather: (x, y, m) => { const c = Math.cos(m.dir), s = Math.sin(m.dir), u = (x * c + y * s) / 3.2, w = (-x * s + y * c) / 2.4, fu = u - Math.floor(u + (Math.floor(w) & 1) * 0.5); return (fu < 0.25 ? -1 : 0.25) + (vnoise(x * 0.3, y * 0.3, 24) - 0.5) * 0.6; },
  // 비늘: 엇갈린 작은 반달
  scale: (x, y) => { const v = y / 2.6, row = Math.floor(v), u = x / 3 + (row & 1) * 0.5, fu = u - Math.floor(u), fv = v - row; return (Math.hypot(fu - 0.5, fv * 0.8) > 0.48 ? -0.9 : 0.2) + (hash(x, y, 25) - 0.5) * 0.3; },
  // 잎: 잎 덩이 얼룩 + 잎맥
  leaf: (x, y) => (vnoise(x * 0.3, y * 0.3, 26) - 0.5) * 1.6 + (hash(x >> 1, y >> 1, 27) - 0.5) * 0.6,
  // 테라코타·흙: 거친 얼룩 + 점
  clay: (x, y) => (vnoise(x * 0.25, y * 0.25, 28) - 0.5) * 1.2 + (hash(x, y, 29) > 0.93 ? -0.7 : hash(x, y, 30) > 0.95 ? 0.6 : 0),
};
const mixc = (a, b, t) => { const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (g(16) << 16) | (g(8) << 8) | g(0); };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);

// opt.k: 크기 배율. 설계 좌표(DW×DH)로 그리고 k배 픽셀 칸에 직접 다시 그린다 (발밑 가운데 기준)
export function sculpt(DW, DH, opt = {}) {
  const k0 = opt.k ?? 1, W = Math.round(DW * k0), H = Math.round(DH * k0);
  const AX = opt.ax ?? DW / 2; // 이 설계 x 가 그림 가운데 (몸통 중심 = 판정 중심)
  const DX = (x) => AX + (x - W / 2) / k0, DY = (y) => DH + (y - H) / k0;
  const PX = (x) => W / 2 + (x - AX) * k0, PY = (y) => H + (y - DH) * k0;
  const N = W * H, E = -1e9;
  const CV = new Float32Array(N), Z = new Float32Array(N).fill(E), M = new Int16Array(N).fill(-1), Gp = new Int32Array(N).fill(-1), SH = new Float32Array(N), FX = new Int8Array(N);
  const mats = [], deco = [], ONG = new Set();
  let gid = 0;
  const mid = (m) => {
    let i = mats.indexOf(m);
    i < 0 && (mats.push(m), (i = mats.length - 1));
    return i;
  };
  const maskOf = (f) => {
    const m = new Uint8Array(N);
    let any = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f(DX(x + 0.5), DY(y + 0.5)) && ((m[y * W + x] = 1), (any = 1));
    return any ? m : null;
  };
  const distOf = (m) => {
    const d = new Float32Array(N);
    for (let i = 0; i < N; i++) d[i] = m[i] ? 1e9 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; m[i] && (d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414)); }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; m[i] && (d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414)); }
    return d;
  };
  const S = { W, H, Z, M };
  // 모양 쌓기. o: h 높이(기본 반지름×0.85) · prof "round"(둥근) | "flat"(넓게 평평, 가장자리만 꺾임) | "sharp"(각진)
  //   z 바탕 높이(기본: 아래 덩어리 평균 + lift) · on 아래 표면을 그대로 따라감(띠·천) · blend 부드럽게 녹아드는 폭
  S.add = (f, m, o = {}) => {
    const mk = maskOf(f);
    if (!mk) return S;
    const d = distOf(mk);
    let r = 0, zs = 0, zn = 0;
    for (let i = 0; i < N; i++) if (mk[i]) (d[i] > r && (r = d[i]), Z[i] > E && ((zs += Z[i]), zn++));
    r = Math.max(1, o.r != null ? o.r * k0 : r);
    const h = o.h != null ? o.h * k0 : r * 0.85, k = o.blend ?? 0, mi = mid(m), g = ++gid;
    const base = o.z != null ? o.z * k0 : (zn ? zs / zn : 0) + (o.lift ?? 1) * k0;
    // 녹아드는 덩어리는 아래 덩어리와 같은 부위로 친다 (경계 선·그림자가 생기지 않게)
    let bg = g;
    if (k > 0) { const cnt = new Map(); for (let i = 0; i < N; i++) mk[i] && Gp[i] >= 0 && cnt.set(Gp[i], (cnt.get(Gp[i]) ?? 0) + 1); let best = 0; for (const [q, c] of cnt) c > best && ((best = c), (bg = q)); }
    for (let i = 0; i < N; i++) {
      if (!mk[i]) continue;
      const t = Math.min(d[i], r) / r;
      const pf = o.prof ?? (k > 0 ? "soft" : "round");
      const hp = (pf === "flat" ? 1 - (1 - Math.min(1, t * 1.7)) ** 3 : pf === "sharp" ? t : pf === "soft" ? t * t * (3 - 2 * t) : Math.sqrt(1 - (1 - t) * (1 - t))) * h;
      if (k > 0) {
        // 녹아드는 덩어리: 아래 표면 위로 부드럽게 솟는다 (경계 선 없음)
        Z[i] = (Z[i] > E ? Z[i] : base) + hp;
        o.keepMat || (M[i] = mi);
        Gp[i] = bg;
        continue;
      }
      Z[i] = (o.on ? (Z[i] > E ? Z[i] : base) + (o.lift ?? 0.5) * k0 : base) + hp;
      M[i] = mi, Gp[i] = g;
      o.on && ONG.add(g);
    }
    return S;
  };
  // 파내기 (음수면 돋우기). soft: 가장자리로 갈수록 얕게
  S.carve = (f, amt = 1.5, soft = !0) => {
    const mk = maskOf(f);
    if (!mk) return S;
    const d = soft ? distOf(mk) : null;
    let r = 1;
    if (d) for (let i = 0; i < N; i++) mk[i] && d[i] > r && (r = d[i]);
    for (let i = 0; i < N; i++) mk[i] && Z[i] > E && (CV[i] += amt * k0 * (d ? Math.min(1, d[i] / r + 0.35) : 1));
    return S;
  };
  S.paint = (f, m) => {
    const mi = mid(m);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; Z[i] > E && f(DX(x + 0.5), DY(y + 0.5)) && (M[i] = mi); }
    return S;
  };
  // 밝기 보정 (반사광·때·얼룩): dv > 0 밝게
  S.tone = (f, dv) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; Z[i] > E && f(DX(x + 0.5), DY(y + 0.5)) && (SH[i] += dv); }
    return S;
  };
  // 정한 색 그대로 (렌더 뒤, 외곽선 앞)
  S.decal = (x, y, c) => (deco.push([PX(x + 0.5) - 0.5, PY(y + 0.5) - 0.5, c]), S);
  S.render = (ro = {}) => {
    {
      const T = new Float32Array(N), passes = ro.smooth ?? 8;
      for (let ps = 0; ps < passes; ps++) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (Z[i] <= E) { T[i] = E; continue; }
          let sm = 0, n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (Z[j] > E && Gp[j] === Gp[i]) { const w = dx && dy ? 1 : 2; sm += Z[j] * w; n += w; } }
          T[i] = sm / n;
        }
        Z.set(T);
      }
      for (let i = 0; i < N; i++) Z[i] > E && (Z[i] -= CV[i]);
    }
    const C = canvas(W, H), d = C.d, LV = new Int8Array(N).fill(-1), DBG = new Int32Array(N).fill(-1);
    const L = [-0.5, -0.72, 0.62], Ln = Math.hypot(...L), lx = L[0] / Ln, ly = L[1] / Ln, lz = L[2] / Ln;
    const zAt = (x, y, i0) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return Z[i0] - 2.5;
      const i = y * W + x;
      if (Z[i] <= E) return Z[i0] - 2.5; // 빈칸: 둥글게 넘어가는 가장자리
      if (Gp[i] !== Gp[i0] && Math.abs(Z[i] - Z[i0]) > 2) return Z[i0]; // 다른 부위: 이어지지 않음
      return Z[i];
    };
    // AO: 주변보다 낮은 곳(틈새)일수록 어둡게
    const AO = new Float32Array(N);
    const R = 4;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (Z[i] <= E) continue;
        let s = 0, n = 0;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; Z[j] > E && ((s += Gp[j] < Gp[i] ? Z[i] : Gp[j] === Gp[i] ? Z[i] + (Math.min(Z[j], Z[i] + 6) - Z[i]) * 0.45 : Math.min(Z[j], Z[i] + 6)), n++); }
        AO[i] = Math.max(0, Math.min(1, (s / n - Z[i]) / 4.5));
      }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (Z[i] <= E) continue;
        const m = mats[M[i]];
        // 법선 (소벨)
        const z = (dx, dy) => zAt(x + dx, y + dy, i);
        const gx = (z(1, -1) + 2 * z(1, 0) + z(1, 1) - z(-1, -1) - 2 * z(-1, 0) - z(-1, 1)) / 8;
        const gy = (z(-1, 1) + 2 * z(0, 1) + z(1, 1) - z(-1, -1) - 2 * z(0, -1) - z(1, -1)) / 8;
        const nx = -gx, ny = -gy, nz = 1, nl = Math.hypot(nx, ny, nz);
        const dif = (nx * lx + ny * ly + nz * lz) / nl;
        let v = 0.12 + 0.88 * Math.max(0, dif);
        // 다른 부위가 드리우는 그림자 (빛 쪽으로 높이 지도를 따라가 본다)
        let sh = 0;
        for (let t = 1.5; t < 9; t += 1) {
          const X = Math.round(x + lx * t * 1.6), Y = Math.round(y + ly * t * 1.6);
          if (X < 0 || Y < 0 || X >= W || Y >= H) break;
          const j = Y * W + X;
          if (Z[j] > Z[i] + lz * t * 1.25 + 1.2 && Gp[j] > Gp[i] && !ONG.has(Gp[j])) { sh = 1; break; }
        }
        sh && (v = v * 0.74 - 0.02);
        v -= AO[i] * 0.38;
        // 땅 반사광: 아래를 향한 그늘 면을 살짝 밝게
        ny / nl > 0.38 && dif < 0.35 && (v += 0.1);
        // 재질 질감
        m.tex && TEX[m.tex] && (v += TEX[m.tex](x, y, m) * m.amp * 0.18);
        v += SH[i] + (m.lv ?? 0);
        v += BAY[(x & 3) + (y & 3) * 4] * 0.05;
        let lv = v < 0.2 ? 1 : v < 0.34 ? 2 : v < 0.48 ? 3 : v < 0.67 ? 4 : v < 0.84 ? 5 : m.shine === !1 ? 5 : 6;
        // 반짝임 (쇠·뼈·눈)
        if (m.spec) {
          const hx = lx, hy = ly, hz = lz + 1, hl = Math.hypot(hx, hy, hz), sp = ((nx * hx + ny * hy + nz * hz) / (nl * hl)) ** 24;
          sp > 1 - m.spec * 0.5 && (lv = 6);
        }
        if (ro.rim !== !1 && dif < 0.4 && y < H - 2) {
          const emp = (X, Y) => X < 0 || Y < 0 || X >= W || Y >= H || Z[Y * W + X] <= E;
          (emp(x + 1, y) || emp(x + 1, y + 1)) && !emp(x - 1, y) && (lv = Math.min(4, Math.max(lv + 1, 3)));
        }
        LV[i] = lv;
        if (ro.debug) { const g = Math.max(0, Math.min(255, Math.round((ro.debug === "ao" ? 1 - AO[i] : ro.debug === "sh" ? 1 - sh : ro.debug === "dif" ? Math.max(0, dif) : v) * 255))); DBG[i] = (g << 16) | (g << 8) | g; }
      }
    // 외톨이 픽셀 정리 (같은 재질 이웃 셋 이상이 같은 단계면 맞춘다)
    for (let pass = 0; pass < 1; pass++)
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (LV[i] < 0 || LV[i] === 6) continue;
          const nb = [i - 1, i + 1, i - W, i + W].filter((j) => M[j] === M[i] && LV[j] >= 0);
          if (nb.length < 4) continue;
          const cnt = {};
          for (const j of nb) cnt[LV[j]] = (cnt[LV[j]] ?? 0) + 1;
          const [best, c] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
          c >= 3 && !(LV[i] in cnt) && (LV[i] = +best);
        }
    // 앞 부위 경계: 뒤에 있는 쪽 픽셀을 어둡게 (빛 쪽 경계는 약하게)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (LV[i] < 0) continue;
        let front = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const j = Y * W + X;
          LV[j] >= 0 && Gp[j] > Gp[i] && Z[j] > Z[i] - 1 && (front = (dy < 0 || dx < 0) && !ONG.has(Gp[j]) ? 2 : Math.max(front, 1)); // 앞 부위의 오른쪽·아래(그늘 쪽)는 진하게, 왼쪽·위는 한 단계만
        }
        front === 2 && (LV[i] = Math.min(LV[i], 1)), front === 1 && (LV[i] = Math.max(1, Math.min(LV[i], LV[i] - 1)));
      }
    if (ro.debug) { d.set(DBG); return C; }
    if (ro.block) {
      // 구조도: 부위(그룹)마다 단색 → 무엇이 어디인지 확인
      const PAL = [0xe06060, 0x60b0e0, 0xe0c050, 0x70d070, 0xc070e0, 0xe09050, 0x50d0c0, 0xd0d0d0, 0x9080f0, 0xf080b0, 0xa0c040, 0x40a0a0];
      for (let i = 0; i < N; i++) LV[i] >= 0 && (d[i] = PAL[(Gp[i] * 7) % PAL.length]);
      return C;
    }
    for (let i = 0; i < N; i++) LV[i] >= 0 && (d[i] = mats[M[i]].ramp[LV[i]]);
    for (const [x, y, c] of deco) C.px(x, y, c);
    // 바깥 외곽선: 맞닿은 재질의 가장 어두운 색
    const add = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (d[i] >= 0) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const j = Y * W + X;
          if (d[j] >= 0) {
            const rp = M[j] >= 0 ? mats[M[j]].ramp : null, lit = dx > 0 || dy > 0; // 빈칸이 부위의 위·왼쪽에 있음
            add.push([i, rp ? (lit && LV[j] >= 4 ? mixc(rp[0], rp[2], 0.55) : rp[0]) : 0x100c10]);
            break;
          }
        }
      }
    for (const [i, c] of add) d[i] = c;
    return C;
  };
  return S;
}
