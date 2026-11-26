// 고블린 정찰병 (초안 v4) — 정통 RPG 고블린, 2D 픽셀 손그림
//   그리는 법: 부위마다 모양 → 거리장으로 둥근 높이 → 빛(왼쪽 위)에 따라 6단 명암(그림자는 푸르게, 빛은 누렇게)
//   겹치는 테두리는 안쪽 선, 바깥 외곽선은 그 부위의 가장 어두운 색. 발바닥 = 맨 아래 줄
import { canvas } from "./px2d.js";

//            0 외곽   1 그늘    2 어둠    3 중간    4 기본    5 밝음    6 반짝
const SK = [0x0e161a, 0x1c3026, 0x2c4a2a, 0x44682e, 0x5f8a38, 0x86ae4a, 0xb6d070];
const SKF = [0x0c1214, 0x152420, 0x1c3026, 0x24402a, 0x2e522e, 0x3a6232, 0x3a6232];
const LE = [0x120a08, 0x22140e, 0x362216, 0x50331c, 0x6c4826, 0x8c6234, 0xae8048];
const CL = [0x100e10, 0x1e1a1c, 0x302826, 0x463a34, 0x5e5044, 0x7a6a58, 0x968470];
const ST = [0x0e1016, 0x1e222a, 0x343a46, 0x525a68, 0x76808e, 0xa2aab6, 0xd8dee8];
const BO = [0x221c12, 0x403828, 0x625840, 0x86795c, 0xaa9c7c, 0xcabd9c, 0xece2c4];
const HURT = [0x2a2e24, 0x6a7860, 0x9aa88a, 0xc4d0b0, 0xe4ecd4, 0xf6faec, 0xffffff];
const RUST = [0x5e2e16, 0x84441e, 0xa85e2a];
const EYE = 0xc89a30, EYEH = 0xfff0a8, MOUTH = 0x1a080a, TOOTH = 0xd8cca8, TOOTHD = 0x9a8c6a;

// ── 모양 ──
export const ellR = (cx, cy, rx, ry, a = 0) => {
  const c = Math.cos(a), s = Math.sin(a);
  return (x, y) => {
    const dx = x - cx, dy = y - cy, u = dx * c + dy * s, v = -dx * s + dy * c;
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
  };
};
export const capF = (a, b, ra, rb = ra) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  return (x, y) => {
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2));
    return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) <= ra + (rb - ra) * t;
  };
};
export const polyF = (pts) => (x, y) => {
  let c = !1;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi && (c = !c);
  }
  return c;
};
export const U = (...f) => (x, y) => f.some((g) => g(x, y));
export const minus = (a, b) => (x, y) => a(x, y) && !b(x, y);
export const pol = (p, ang, d) => [p[0] + Math.cos(ang) * d, p[1] + Math.sin(ang) * d];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const BAY = [0, 2, 3, 1];
// ── 거점 화풍 붓 결 (재질마다 다른 결 · 2px 붓 뭉치 · 큰 얼룩) — 픽셀 좌표 기준 ──
const hs = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnz = (x, y, s = 0) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hs(ix, iy, s), b = hs(ix + 1, iy, s), c = hs(ix, iy + 1, s), d = hs(ix + 1, iy + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
export const BRUSH = {
  // 살·가죽: 부드러운 얼룩 + 드문 2px 점
  skin: (x, y) => (vnz(x / 4, y / 4, 1) - 0.5) * 0.2 + (hs(x >> 1, y >> 1, 2) - 0.5) * 0.12,
  // 털: 아래로 흐르는 짧은 털 결 (세로로 긴 뭉치)
  fur: (x, y) => (vnz(x / 1.6, y / 5, 3) - 0.5) * 0.34 + (hs(x, y >> 2, 4) > 0.82 ? 0.14 : 0) + (hs(x, y >> 2, 5) < 0.12 ? -0.14 : 0),
  // 쇠·놋쇠: 가로 긁힘 + 얼룩(녹·때)
  metal: (x, y) => (hs(x >> 2, y, 6) - 0.5) * 0.14 + (vnz(x / 6, y / 6, 7) - 0.5) * 0.22 + (hs(x, y, 8) > 0.96 ? -0.22 : 0),
  // 나무: 세로 나뭇결 (굽이침)
  wood: (x, y) => Math.sin(x * 1.1 + vnz(x / 6, y / 14, 9) * 6) * 0.11 + (hs(x, y >> 2, 10) > 0.9 ? -0.16 : 0),
  // 돌: 큰 얼룩 + 2px 점 + 금
  stone: (x, y) => (vnz(x / 5, y / 5, 11) - 0.5) * 0.3 + (hs(x >> 1, y >> 1, 12) - 0.5) * 0.16,
  // 천: 짠 결 (엇갈린 2px)
  cloth: (x, y) => ((((x >> 1) + (y >> 1)) & 1) ? 0.05 : -0.05) + (vnz(x / 5, y / 7, 13) - 0.5) * 0.2,
  // 잎·풀: 잎 덩이 얼룩
  leaf: (x, y) => (vnz(x / 3, y / 3, 14) - 0.5) * 0.32 + (hs(x >> 1, y >> 1, 15) - 0.5) * 0.14,
  // 유리·수정: 비스듬한 반사 줄 + 매끈
  glass: (x, y) => (((x + y * 2) % 11 === 0) ? 0.22 : 0) + (vnz(x / 7, y / 7, 16) - 0.5) * 0.12,
  // 껍질·비늘: 작은 비늘 무늬
  scale: (x, y) => { const u = x / 3 + ((y >> 1) & 1) * 0.5, f = u - Math.floor(u); return (f < 0.25 ? -0.14 : f > 0.75 ? 0.08 : 0) + (hs(x >> 1, y >> 1, 17) - 0.5) * 0.1; },
  // 깃털: 비스듬히 겹친 깃 결
  feather: (x, y) => { const u = (x + y * 0.6) / 3.2, f = u - Math.floor(u); return (f < 0.22 ? -0.16 : 0.04) + (vnz(x / 4, y / 4, 18) - 0.5) * 0.14; },
};
const LX = -0.55, LY = -0.68, LZ = 0.48, LN = Math.hypot(LX, LY, LZ);

// 그림판 + 부위별 외곽색 기록
// DW×DH 설계 좌표로 그리고, k배 크기의 픽셀 칸에 직접 찍는다 (발밑 가운데 기준). 늘리고 줄인 그림이 아니라 작은 칸에 다시 그림
export function board(DW, DH, k = 1) {
  const W = Math.round(DW * k), H = Math.round(DH * k);
  const C = canvas(W, H), oc = new Int32Array(W * H).fill(-1);
  const DX = (x) => DW / 2 + (x - W / 2) / k, DY = (y) => DH + (y - H) / k;
  const PX = (x) => W / 2 + (x - DW / 2) * k, PY = (y) => H + (y - DH) * k;
  const px0 = C.px, over0 = C.over;
  C.px = (x, y, c) => (px0(PX(x + 0.5) - 0.5, PY(y + 0.5) - 0.5, c), C);
  C.over = (x, y, c) => (over0(PX(x + 0.5) - 0.5, PY(y + 0.5) - 0.5, c), C);
  // 부위 칠하기. o: shine 반짝 허용 · flat 둥근 정도(작을수록 납작) · sep 겹침 선(기본 켬) · lv 밝기 보정
  C.part = (f, R, o = {}) => {
    const n = W * H, m = new Uint8Array(n), dist = new Float32Array(n);
    let any = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f(DX(x + 0.5), DY(y + 0.5)) && ((m[y * W + x] = 1), (any = 1));
    if (!any) return C;
    for (let i = 0; i < n; i++) dist[i] = m[i] ? 1e9 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dist[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!m[i]) continue; dist[i] = Math.min(dist[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414); }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!m[i]) continue; dist[i] = Math.min(dist[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414); }
    let R0 = 0;
    for (let i = 0; i < n; i++) m[i] && dist[i] > R0 && (R0 = dist[i]);
    const r = Math.max(1, R0), fl = o.flat ?? 1;
    const h = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H || !m[y * W + x]) return 0;
      const d = Math.min(dist[y * W + x], r) / r;
      return Math.sqrt(1 - (1 - d) * (1 - d)) * r * fl;
    };
    const und = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !m[y * W + x] && C.d[y * W + x] >= 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!m[i]) continue;
        const gx = h(x + 1, y) - h(x - 1, y), gy = h(x, y + 1) - h(x, y - 1);
        const nx = -gx * 0.6, ny = -gy * 0.6, nl = Math.hypot(nx, ny, 1);
        let v = (nx * LX + ny * LY + LZ) / (nl * LN) + (o.lv ?? 0);
        v += (BAY[(x & 1) + (y & 1) * 2] - 1.5) * 0.02;
        // 재질 결 (o.tex = 0 이면 끔) — 기본은 살결
        const tf = o.tex === 0 ? null : BRUSH[o.tex ?? "skin"];
        tf && (v += tf(x, y) * (o.amp ?? 1));
        let k = v < -0.05 ? 1 : v < 0.28 ? 2 : v < 0.52 ? 3 : v < 0.7 ? 4 : v < 0.86 ? 5 : o.shine ? 6 : 5;
        if (o.sep !== !1 && k <= 3 && (und(x + 1, y) || und(x, y + 1) || und(x - 1, y) || und(x, y - 1))) k = 0;
        // 빛 쪽(왼쪽 위) 바깥 가장자리: 한 단 밝은 테 (거점 캐릭터처럼 윤곽이 빛을 받는다)
        else if (o.rim !== !1 && k >= 2 && k < 6 && ((y > 0 && !m[i - W] && C.d[i - W] < 0) || (x > 0 && !m[i - 1] && C.d[i - 1] < 0))) k = Math.min(o.shine ? 6 : 5, k + 1);
        C.d[i] = R[k];
        oc[i] = R[0];
      }
    return C;
  };
  C.selout = () => {
    const add = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (C.d[y * W + x] >= 0) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X >= 0 && Y >= 0 && X < W && Y < H && C.d[Y * W + X] >= 0) { add.push([y * W + x, oc[Y * W + X] >= 0 ? oc[Y * W + X] : 0x100c10]); break; }
        }
      }
    for (const [i, c] of add) C.d[i] = c;
    return C;
  };
  return C;
}
export function ik(a, b, l1, l2, bend) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const t = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  return pol(a, Math.atan2(dy, dx) - t * bend, l1);
}

// p: bob · lean(-1~1) · fL/bL [발 x, 들림] · fa/ba [윗팔, 아래팔] 각도(0 = 아래로, + 앞으로) · blade 칼 각도
//    jaw 입 벌림(0~2) · ear 귀 각도 · hurt · blink
//   정통 RPG 고블린: 키 ≈ 42px(귀 포함, 플레이어보다 조금 큼) · 약 3.5등신 · 살짝 굽은 등 · 똥배 · 휜 다리
//   크고 뾰족한 귀(뒤 위로) · 큰 매부리코 · 심술궂게 찡그린 눈썹 아래 노란 눈 · 히죽 웃는 입과 송곳니
//   가죽 조끼 + 어깨판 · 허리띠·주머니 · 해진 반바지 · 천 감은 발 · 단검
export const GK = 0.76; // 크기 (설계 64×56 → 실제 49×43)
export function goblinFrame(p = {}) {
  const W = 64, H = 56, G = H - 1, C = board(W, H, GK);
  const b = p.bob ?? 0, ln = p.lean ?? 0, jw = p.jaw ?? 0, ea = p.ear ?? 0;
  const S = p.hurt ? HURT : SK, SF = p.hurt ? HURT : SKF;
  const hip = [29 + ln * 2, 42 + b];
  const sh = [33 + ln * 4.5, 31 + b + ln * 1.5];
  const hd = [38 + ln * 6, 23.5 + b + ln * 2.5];
  const fL = p.fL ?? [5, 0], bL = p.bL ?? [-5, 0];
  const LEF = [LE[0], LE[0], LE[1], LE[1], LE[2], LE[2], LE[2]];

  // ── 다리 (짧고 살짝 휜) ──
  const leg = (foot, far) => {
    const R = far ? SF : S, hp = [hip[0] + (far ? -2.5 : 1.5), hip[1]];
    const an = [hip[0] + foot[0], G - 2.5 - foot[1]];
    const kn = ik(hp, an, 7, 6.6, 1);
    C.part(capF(hp, kn, 3.2, 2.4), R);
    C.part(capF(kn, an, 2.4, 1.9), R);
    // 천 감은 발
    const fx = an[0], fy = G;
    C.part(polyF([[fx - 2.6, fy - 3.6], [fx + 1.5, fy - 3.4], [fx + 4.6, fy - 1.6], [fx + 5.4, fy + 1], [fx - 3, fy + 1]]), far ? LEF : LE);
    !far && C.over(fx - 1, fy - 2.4, LE[2]).over(fx + 1, fy - 2.2, LE[2]).over(fx + 2.6, fy - 1.2, LE[2]);
    return kn;
  };
  const armPts = (a, far) => {
    const s = far ? [sh[0] - 5, sh[1] + 0.5] : [sh[0] + 0.5, sh[1] + 1];
    const e = pol(s, Math.PI / 2 - a[0], 6.6), w = pol(e, Math.PI / 2 - a[0] - a[1], 6);
    return { s, e, w, ang: Math.PI / 2 - a[0] - a[1] };
  };
  const arm = (A, far) => {
    const R = far ? SF : S, { s, e, w } = A;
    C.part(capF(s, e, 2.4, 2), R);
    C.part(capF(e, w, 2.1, 1.7), R);
    !far && C.part(capF(lerp(e, w, 0.4), lerp(e, w, 0.85), 2.2, 2), LE); // 가죽 팔목 보호대
  };
  const hand = (A, far) => {
    const R = far ? SF : S, hc = pol(A.w, A.ang, 1.6);
    C.part(ellR(hc[0], hc[1], 2.4, 2.2, A.ang), R, { shine: !far });
    return hc;
  };

  // ════ 뒤에서 앞으로 ════
  const B = armPts(p.ba ?? [0.35, 0.5], !0), F = armPts(p.fa ?? [0.5, 0.9], !1);
  arm(B, !0);
  const bhc = hand(B, !0);
  // 뒷손에 쥔 돌 (던지기)
  p.stone && C.part(ellR(bhc[0] + 0.4, bhc[1] - 1.6, 2, 1.8), [0x1c1a18, 0x34302c, 0x4e4a42, 0x6a655a, 0x8a8476, 0xaaa496, 0xcac4b6], { shine: 1, sep: !1 });
  leg(bL, !0);
  // ── 몸통: 살짝 굽은 등 + 똥배 ──
  const sa = Math.atan2(sh[1] - hip[1], sh[0] - hip[0]);
  C.part(U(ellR(sh[0] - 2, sh[1] + 3.5, 6, 5.4, sa), ellR(hip[0] + 2, hip[1] - 4, 5.8, 5.2, 0)), S, { shine: 1 });
  // 배꼽 · 배 주름
  C.over(hip[0] + 5, hip[1] - 3.5, S[2]).over(hip[0] + 4, hip[1] - 1, S[3]).over(hip[0] + 5, hip[1] - 1.2, S[3]);
  // 가죽 조끼: 등·어깨를 덮고 앞은 벌어져 배가 보인다
  C.part(minus(ellR(sh[0] - 1.8, sh[1] + 3.4, 6.4, 5.6, sa), (x, y) => x > sh[0] + 2.2 - (y - sh[1]) * 0.25 || y > sh[1] + 8), LE, { shine: 1, lv: -0.08 });
  C.over(sh[0] - 5, sh[1] + 1, LE[2]).over(sh[0] - 4.5, sh[1] + 4, LE[2]); // 꿰맨 자국
  C.over(sh[0] + 1.6, sh[1] + 2, BO[5]).over(sh[0] + 0.8, sh[1] + 5, BO[5]); // 조끼 끈 고리
  // 반바지 (해진 끝단)
  C.part(polyF([[hip[0] - 5.5, hip[1] - 2], [hip[0] + 6.5, hip[1] - 2], [hip[0] + 6, hip[1] + 4], [hip[0] + 3.5, hip[1] + 5.4], [hip[0] + 2, hip[1] + 4], [hip[0], hip[1] + 5.6], [hip[0] - 2.5, hip[1] + 4.4], [hip[0] - 5, hip[1] + 5.2], [hip[0] - 6, hip[1] + 2]]), CL);
  leg(fL, !1);
  // 허리띠 + 버클 + 주머니
  C.part(capF([hip[0] - 6, hip[1] - 2.4], [hip[0] + 6.5, hip[1] - 2.8], 1.2), LE, { sep: !1 });
  C.part(ellR(hip[0] + 3, hip[1] - 2.6, 1.4, 1.5), [RUST[0], RUST[0], RUST[0], RUST[1], RUST[2], RUST[2], 0xd8a060], { sep: !1, shine: 1 });
  C.part(ellR(hip[0] - 4.5, hip[1] + 0.6, 2.2, 2.4), LE, { shine: 1 });
  // ── 머리 ──
  {
    const [hx, hy] = hd, t = ea;
    // 목
    C.part(capF([sh[0] - 2, sh[1] + 1.5], [hx - 1.5, hy + 3], 2.8, 2.4), S);
    // 먼 귀 (뒤 위로, 그늘)
    C.part(capF([hx - 2, hy - 3], [hx - 11, hy - 7.5 - t * 2.5], 2.4, 0.5), SF);
    // 머리통 + 턱
    const skull = ellR(hx - 0.5, hy - 0.8, 6.2, 5.6, 0);
    const jaw = polyF([[hx - 3, hy + 1], [hx + 5, hy + 1], [hx + 6.6, hy + 2.6 + jw * 0.3], [hx + 5.4, hy + 5.4 + jw], [hx + 1, hy + 6 + jw], [hx - 3, hy + 4]]);
    C.part(U(skull, jaw), S, { shine: 1, lv: 0.12, sep: !1 });
    // 큰 매부리코 (끝이 뭉툭)
    C.part(U(capF([hx + 3.6, hy - 1.6], [hx + 8, hy + 1.4], 1.8, 1.4), ellR(hx + 8, hy + 1.8, 1.8, 1.6)), S, { shine: 1, sep: !1 });
    C.over(hx + 7.6, hy + 2.8, S[1]);
    // 눈: 찡그린 눈썹 + 노란 눈 + 검은 눈동자
    if (p.hurt || p.blink) C.over(hx + 1, hy - 1, S[1]).over(hx + 2, hy - 0.8, S[1]).over(hx + 3, hy - 0.8, S[1]);
    else {
      C.over(hx + 1, hy - 1, 0xf0d860).over(hx + 2, hy - 1, 0xfff4b0).over(hx + 3, hy - 1, 0x1a0c0c);
      C.over(hx + 1, hy - 0.1, 0xc8a040).over(hx + 2, hy, 0xe8c858).over(hx + 3, hy, 0x1a0c0c);
    }
    C.over(hx - 0.2, hy - 2.6, S[0]).over(hx + 1, hy - 2.6, S[0]).over(hx + 2, hy - 2.2, S[0]).over(hx + 3, hy - 1.8, S[0]).over(hx + 4, hy - 1.4, S[0]); // 눈썹 (코 쪽으로 내려감)
    C.over(hx + 0.2, hy - 3.5, S[5]).over(hx + 1.4, hy - 3.4, S[5]);
    // 입: 히죽 웃는 입 + 윗니 + 아래 송곳니
    const m = [[hx + 0.5, hy + 3.4], [hx + 2, hy + 3.9], [hx + 3, hy + 4], [hx + 4, hy + 3.8], [hx + 5, hy + 3.3], [hx + 5.8, hy + 2.6]];
    for (const [x, y] of m) C.over(x, y, MOUTH), jw > 0.5 && C.over(x, y + 1, MOUTH), jw > 1.4 && C.over(x, y + 2, 0x5a1a20);
    C.over(hx + 2, hy + 3, TOOTH).over(hx + 3.2, hy + 3.1, TOOTH).over(hx + 4.4, hy + 2.9, TOOTHD);
    C.over(hx + 5, hy + 2.4 + jw * 0.1, TOOTH).over(hx + 5, hy + 1.6, TOOTH); // 아래 송곳니 (위로 삐죽)
    C.over(hx - 0.4, hy + 3, S[2]); // 입꼬리
    C.over(hx + 6, hy + 2, S[2]).over(hx + 4, hy + 1.6, S[2]); // 볼 주름
    // 가까운 귀: 크고 뾰족, 뒤 위로 + 안쪽 + 쇠 귀고리
    const e0 = [hx - 3, hy - 1.5], e1 = [hx - 13.5, hy - 5.5 - t * 3];
    C.part(capF(e0, e1, 3.2, 0.5), S, { shine: 1 });
    for (let k = 0.15; k < 0.7; k += 0.1) { const q = lerp(e0, e1, k); C.over(q[0] + 0.5, q[1] + 0.8, 0x6a3a38); }
    const r = lerp(e0, e1, 0.35);
    C.px(r[0] + 0.5, r[1] + 3.2, ST[5]).px(r[0] + 1.3, r[1] + 3.8, ST[4]);
    // 머리 위 몇 가닥
    for (const [x0, y0, x1, y1] of [[-2, -6, -6, -6.5], [0, -6.2, -3, -7.6]]) for (let k = 0; k <= 4; k++) C.px(hx + x0 + ((x1 - x0) * k) / 4, hy + y0 + ((y1 - y0) * k) / 4, 0x1a1a14);
  }
  // ── 앞 팔 + 어깨판 + 단검 ──
  arm(F, !1);
  C.part(ellR(sh[0] - 0.3, sh[1] + 0.3, 3.4, 2.7, 0.3), ST, { shine: 1, flat: 0.7 });
  C.over(sh[0] - 1.5, sh[1] + 1.6, RUST[1]).over(sh[0] + 1, sh[1] + 1.4, RUST[0]); // 녹슨 쇠 어깨판 // 어깨판 징
  const hc = hand(F, !1);
  {
    const ang = p.blade ?? -0.35, P = (d, o) => [hc[0] + Math.cos(ang) * d - Math.sin(ang) * o, hc[1] + Math.sin(ang) * d + Math.cos(ang) * o];
    C.part(capF(P(-2.5, 0), P(1, 0), 1), LE, { sep: !1 });
    C.part(capF(P(1.4, -2.2), P(1.4, 2.2), 0.9), ST, { sep: !1 });
    C.part(polyF([P(2, -1.4), P(8, -1.6), P(12, 0), P(8, 1.6), P(2, 1.4)]), ST, { shine: 1, sep: !1, flat: 0.5 });
    C.line(...P(2.5, -0.4), ...P(10, -0.2), ST[5]);
    C.over(...P(5, 0.8), RUST[1]).over(...P(7, -0.8), RUST[0]);
  }
  C.part(ellR(hc[0] + 0.3, hc[1] - 0.3, 1.7, 1.5), S, { sep: !1 });
  C.selout();
  return C;
}

// ── 동작 → 자세 ── (프레임 넉넉히 + 빠른 재생)
//   idle 숨쉬기(귀 쫑긋·눈 깜빡) · walk 어슬렁 · move 달리기 · alert 알아챔(펄쩍) · wind 칼 젖히기 · atk 찌르기(돌진)
//   wind2/atk2 내려베기 · rec 회복 · throw 돌 던지기 · hop 뒤로 깡충 · hurt 맞음 · laugh 낄낄 비웃기
const T2 = Math.PI * 2;
const run = (f, n, A, lift, lean) => {
  const ph = (f / n) * T2, sn = Math.sin(ph), cs = Math.cos(ph);
  return {
    fL: [1.5 + A * sn, lift * Math.max(0, cs)], bL: [-1.5 - A * sn, lift * Math.max(0, -cs)],
    bob: 1.1 * Math.abs(sn) - 0.5, lean, fa: [0.55 - 0.55 * sn, 0.85], ba: [0.35 + 0.6 * sn, 0.5], ear: 0.35 * Math.cos(ph * 2),
  };
};
const L = (a, b, t) => a + (b - a) * t;
export const pxGoblin = {
  fw: Math.round(64 * GK), fh: Math.round(56 * GK), w: 13, h: 22,
  anims: {
    idle: [8, 10], walk: [8, 10], move: [8, 15], alert: [5, 12, !1], wind: [4, 14, !1], atk: [4, 20, !1],
    wind2: [3, 14, !1], atk2: [4, 20, !1], rec: [3, 12, !1], throw: [6, 15, !1], hop: [4, 12, !1], hurt: [3, 14, !1], laugh: [6, 11],
  },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.7, fa: [0.5 + Math.sin(ph) * 0.06, 0.9], ba: [0.35 - Math.sin(ph) * 0.05, 0.5], blink: f === 3, ear: f === 5 ? 0.5 : f === 6 ? 0.2 : 0, lean: Math.sin(ph) * 0.04 };
    if (nm === "walk") P = run(f, n, 4.5, 2, 0.15);
    if (nm === "move") P = run(f, n, 7.5, 3.5, 0.38);
    if (nm === "alert") P = [
      { bob: 1, lean: 0.2, ear: 0.2, jaw: 1 }, { bob: -2, lean: -0.4, ear: 1, jaw: 2, fL: [5, 2.5], bL: [-5, 2.5], fa: [0.2, 1.2], ba: [0.1, 0.8] },
      { bob: -1, lean: -0.3, ear: 0.8, jaw: 2, fL: [5, 1], bL: [-5, 1] }, { bob: 1, lean: 0.25, ear: 0.2, jaw: 1 }, { lean: 0.1, jaw: 0.5 }][f];
    if (nm === "wind") P = { lean: L(0, -0.35, t), fa: [L(0.5, -1.5, t), L(0.9, -0.2, t)], blade: L(-0.35, -2.4, t), fL: [L(5, 7, t), 0], bL: [-6, 0], jaw: t > 0.5 ? 1 : 0, ear: t * 0.5 };
    if (nm === "atk") P = [
      { lean: 0.45, fa: [1.1, 0.35], blade: -0.2, fL: [9, 0], bL: [-7, 0], jaw: 2 }, { lean: 0.75, fa: [1.5, 0.08], blade: 0, fL: [11, 0], bL: [-9, 0], jaw: 2, ear: -0.3 },
      { lean: 0.75, fa: [1.52, 0.05], blade: 0.02, fL: [11, 0], bL: [-9, 0], jaw: 2, ear: -0.4 }, { lean: 0.5, fa: [1.2, 0.35], blade: -0.1, fL: [9, 0], bL: [-7, 0], jaw: 1 }][f];
    if (nm === "wind2") P = { lean: L(-0.1, -0.4, t), fa: [L(-0.6, -2.5, t), L(0, -0.3, t)], blade: L(-1.2, -2.1, t), fL: [7, 0], bL: [-7, 0], jaw: 1, ear: 0.6 };
    if (nm === "atk2") P = [
      { lean: 0.2, fa: [-0.6, 0.3], blade: -0.4, fL: [9, 0], bL: [-7, 0], jaw: 2 }, { lean: 0.55, fa: [0.9, 0.25], blade: 1, fL: [10, 0], bL: [-8, 0], jaw: 2, ear: -0.3 },
      { lean: 0.6, fa: [0.6, 0.6], blade: 1.5, fL: [10, 0], bL: [-8, 0], jaw: 1 }, { lean: 0.45, fa: [0.5, 0.8], blade: 0.6, fL: [8, 0], bL: [-7, 0] }][f];
    if (nm === "rec") P = { lean: L(0.35, 0, t), fa: [L(1, 0.5, t), 0.9], fL: [L(8, 5, t), 0], bL: [-6, 0], jaw: 1 - t };
    if (nm === "throw") P = [
      { lean: -0.1, ba: [-0.8, -0.4], stone: 1, fL: [6, 0], bL: [-6, 0] }, { lean: -0.3, ba: [-2.2, -0.6], stone: 1, fL: [7, 0], bL: [-7, 0], jaw: 1, ear: 0.4 },
      { lean: -0.35, ba: [-2.6, -0.8], stone: 1, fL: [7, 0], bL: [-7, 0], jaw: 1, ear: 0.6 }, { lean: 0.4, ba: [1.4, 0.2], fL: [9, 0], bL: [-7, 0], jaw: 2, ear: -0.2 },
      { lean: 0.5, ba: [1.7, 0.1], fL: [9, 0], bL: [-7, 0], jaw: 2 }, { lean: 0.2, ba: [0.8, 0.4], fL: [7, 0], bL: [-6, 0], jaw: 1 }][f];
    if (nm === "hop") P = [
      { bob: 1.5, lean: 0.1, fL: [5, 0], bL: [-5, 0], ear: 0.2 }, { bob: -1, lean: -0.35, fL: [3, 3.5], bL: [-4, 3], ear: 1, jaw: 1, fa: [0.2, 1.2] },
      { bob: -0.5, lean: -0.25, fL: [4, 2.5], bL: [-5, 2], ear: 0.8, jaw: 1 }, { bob: 1.5, lean: 0.25, fL: [6, 0], bL: [-6, 0], ear: 0 }][f];
    if (nm === "hurt") P = [
      { hurt: 1, lean: -0.55, jaw: 1, fa: [-0.3, 0.5], ba: [-0.6, 0.4], fL: [5, 0], bL: [-7, 0], ear: 1 }, { lean: -0.45, jaw: 1, blink: 1, fa: [-0.1, 0.6], ba: [-0.4, 0.4], fL: [5, 0], bL: [-7, 0], ear: 0.8 },
      { lean: -0.15, jaw: 0.5, fa: [0.3, 0.8], fL: [5, 0], bL: [-6, 0], ear: 0.3 }][f];
    if (nm === "laugh") P = { lean: -0.3 + (f % 2) * 0.12, bob: (f % 2) * 1, jaw: f % 2 ? 1 : 2, ear: 0.4 + (f % 2) * 0.4, fa: [0.2 + (f % 2) * 0.15, 1.3], ba: [0.6, 1.2], blink: f % 3 === 1 };
    return goblinFrame(P);
  },
};
