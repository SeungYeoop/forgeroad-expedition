// 루트홀로우 몬스터 12종 (오른쪽을 본다) — 모스바크 거목 아래 뿌리 굴, 빛나는 균사 숲, 심장 뿌리
//   윗층(뿌리 얽힘): 뿌리 손 · 노움 도둑 · 뿌리 벌레 떼 · [정예] 뿌리 갑옷 곰
//   가운데(균사 숲): 발광 버섯 꼬마 · 포자 풍선 · 균사 사슴 · [정예] 버섯 왕
//   아랫층(심장 뿌리): 흙덩이 정령 · 썩은 뿌리 망령 · 돌껍질 달팽이 · [정예] 고대 뿌리 심장
//   작은 몬스터 = 부위 명암 손그림(kit board), 정예(큰 몬스터) = 높이 지도 조각(px3 sculpt)
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const ROOT = ramp(0x6a4a30), ROOTF = rampF(0x5a3e28), SOIL = ramp(0x5a4030), GLOWG = rampGlow(0x7af0a0), SPORE = ramp(0x9a7ab0);
const fadeY = (C, y0, y1) => { for (let y = 0; y < C.H; y++) { const t = (y - y0) / Math.max(1, y1 - y0); if (t <= 0) continue; for (let x = 0; x < C.W; x++) { const i = y * C.W + x; if (C.d[i] < 0) continue; if (((x * 7 + y * 13) % 8) / 8 < t) C.d[i] = -1; } } };

// ════ 뿌리 손 ════ 땅에서 손처럼 솟는 뿌리 다발. 붙잡아 끌어당긴다 (움직이지 않음)
//   p: rise(0~1) · grab 손가락 오므림 · reach 앞으로 뻗기 · hurt
const done3 = (C, p) => (p.hurt ? flash(C) : C);
function glint3(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
const R_ROOT = mat(ramp(0x6a4a30), { tex: "wood", amp: 1.2, dir: 1.57 }), R_ROOTF = mat(rampF(0x4e3624), { tex: "wood", amp: 1.1, dir: 1.57 }), R_SOIL = mat(ramp(0x5a4434), { tex: "clay", amp: 1.3 });
const R_MYC = mat(rampGlow(0x7ae8d0)), R_VD = mat(ramp(0x0c0a08));
const R_toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
function rootHandFrame(p = {}) {
  const W = 56, H = 66, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const rs = p.rise ?? 1, gb = p.grab ?? 0, rc = p.reach ?? 0, cx = 24;
  S.add(U(ellR(cx, G - 2, 18, 4.6), ellR(cx - 8, G - 4, 7, 4)), R_SOIL, { z: -1, h: 3 });
  for (let k = 0; k < 5; k++) S.add(ellR(cx - 14 + k * 7, G - 3 - (k % 2) * 2, 2, 1.4), mat(ramp(0x7a6a5a), { tex: "stone" }), { z: -0.9, lift: 0.4, h: 0.8 });
  if (rs > 0.05) {
    const wr = [cx + rc * 6, G - 4 - rs * 26], base = [cx, G - 3];
    S.add(U(capF(base, lerp(base, wr, 0.5), 7, 5.4), capF(lerp(base, wr, 0.5), wr, 5.4, 6)), R_ROOT, { z: 0, h: 5 });
    for (let k = 0; k < 4; k++) S.carve(capF(lerp(base, wr, 0.1 + k * 0.2), [lerp(base, wr, 0.1 + k * 0.2)[0] + 5, lerp(base, wr, 0.1 + k * 0.2)[1] - 3], 0.5), 0.8);
    S.add(capF(lerp(base, wr, 0.3), lerp(base, wr, 0.7), 0.8), R_MYC, { on: 1, lift: 0.3, h: 0.2 });
    // 손가락 다섯 (마디 뿌리)
    for (let k = 0; k < 5; k++) { const a0 = -Math.PI / 2 + (k - 2) * 0.42 + rc * 0.5; let q = pol(wr, a0, 4), a = a0; const segs = []; for (let j = 0; j < 3; j++) { a += gb * 0.55 * (k < 2 ? -1 : 1) * (k === 2 ? 0 : 1) + (k === 2 ? gb * 0.4 : 0); const n2 = pol(q, a, (k === 2 ? 7 : 6) * rs); segs.push(capF(q, n2, 2.2 - j * 0.5, 1.8 - j * 0.5)); q = n2; } S.add(U(...segs), k % 2 ? R_ROOTF : R_ROOT, { z: 1 + (k === 4 ? 1 : 0), h: 1.6 }); }
    S.add(ellR(wr[0], wr[1], 7, 6), R_ROOT, { z: 1.4, h: 4 });
    for (const [x, y] of [[-2, -1], [3, 2]]) S.add(ellR(wr[0] + x, wr[1] + y, 1.2, 1), R_MYC, { on: 1, lift: 0.3, h: 0.2 });
  } else for (let k = 0; k < 4; k++) S.add(capF([cx - 9 + k * 6, G - 4], [cx - 8 + k * 6, G - 8 - (k % 2) * 2], 1.2, 0.5), R_ROOT, { z: 0, h: 0.8 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxRootHand = spec(40, 48, 16, 28,
  { hide: [1, 1], rise: [4, 12, !1], idle: [4, 6], move: [4, 6], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "hide") return { rise: 0 };
    if (nm === "rise") return { rise: t };
    if (nm === "wind") return { reach: -0.3 * t, grab: 0 };
    if (nm === "atk") return { reach: [0.6, 1, 1][f], grab: [0, 0.5, 1][f] };
    if (nm === "rec") return { reach: 1 - t, grab: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, reach: -0.3, grab: 0.4 };
    return { reach: Math.sin(ph) * 0.15, grab: 0.2 + 0.2 * Math.sin(ph) };
  }, rootHandFrame);

// ════ 노움 도둑 ════ 뾰족 빨간 모자 · 흰 수염 · 등에 자루. 몰래 다가와 재료를 훔쳐 달아난다
//   p: bob · legs · sack 자루 부풂 · grab · hurt
const GNM = ramp(0xe8b890), HAT = ramp(0xc8402a), BEARD = ramp(0xf0ece4), SACK = ramp(0x9a7a50);
function gnomeFrame(p = {}) {
  const W = 48, H = 52, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 22 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sk = p.sack ?? 0, gb = p.grab ?? 0, cx = 20;
  const SKN = mat(ramp(0xd8a888), { tex: "skin", amp: 0.8 }), CLT = mat(ramp(0x5a6a3a), { tex: "cloth", amp: 1.1 }), HAT = mat(ramp(0xb83a2a), { tex: "cloth", amp: 1 }), BRD = mat(ramp(0xe8e4d8), { tex: "fur", amp: 1.3, dir: 1.57 }), SACK = mat(ramp(0xa8906a), { tex: "cloth", amp: 1.3 });
  // 자루 (등)
  S.add(U(ellR(cx - 8, 30 + b - sk * 2, 8 + sk * 3, 9 + sk * 3)), SACK, { z: -1, h: 6 });
  S.add(capF([cx - 6, 21 + b - sk * 4], [cx - 2, 26 + b], 1.4), mat(ramp(0x6a5030), { tex: "cloth" }), { z: -0.8, h: 0.8 });
  for (const [x, y] of [[-10, 26], [-5, 33]]) S.carve(capF([cx + x - 2, y + b], [cx + x + 2, y + 2 + b], 0.4), 0.6);
  for (const [o, far, d] of [[g.f, 1, -2], [g.n, 0, 2]]) { const hp = [cx + d, 38 + b], ft = [cx + d + o[0], G - 1 - o[1]]; S.add(capF(hp, ft, 2.4, 2), far ? mat(rampF(0x4a3a2a), { tex: "cloth" }) : mat(ramp(0x5a4a3a), { tex: "cloth" }), { z: far ? -2 : 3, h: 1.6 }); S.add(ellR(ft[0] + 2, ft[1] - 0.6, 3.6, 1.6), mat(ramp(0x3a2a20), { tex: "leather" }), { z: far ? -1.9 : 3.1, h: 1 }); }
  S.add(U(ellR(cx, 33 + b, 7, 8)), CLT, { z: 1, h: 5 });
  S.add(capF([cx - 6, 37 + b], [cx + 6, 37 + b], 1), mat(ramp(0x3a2a20), { tex: "leather" }), { z: 1.4, h: 0.6 });
  // 머리 (큰 코 · 수염 · 뾰족 모자)
  const hx = cx + 2, hy = 21 + b;
  S.add(ellR(hx, hy, 5.4, 5.4), SKN, { z: 3, h: 4 });
  S.add(ellR(hx + 5, hy + 1, 2.4, 2), SKN, { z: 3.4, h: 1.6 });
  S.add(polyF([[hx - 3, hy + 2], [hx + 6, hy + 3], [hx + 4, hy + 14], [hx, hy + 11], [hx - 3, hy + 8]]), BRD, { z: 3.6, h: 2 });
  S.add(U(polyF([[hx - 7, hy - 2], [hx + 6, hy - 2], [hx - 6, hy - 18], [hx - 9, hy - 16]])), HAT, { z: 3.8, h: 4 });
  S.add(capF([hx - 7, hy - 2], [hx + 6, hy - 2], 1.2), mat(ramp(0x8a2a20), { tex: "cloth" }), { z: 4, h: 0.6 });
  !p.hurt && S.decal(hx + 2.6, hy - 0.6, 0x101010);
  // 손 (훔치기)
  const sh = [cx + 4, 29 + b], hd = [cx + 8 + gb * 8, 33 + b - gb * 2];
  S.add(capF(sh, hd, 1.8, 1.4), CLT, { z: 5, h: 1.2 });
  S.add(ellR(hd[0], hd[1], 1.8, 1.6), SKN, { z: 5.2, h: 1 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxGnome = spec(35, 37, 12, 18,
  { idle: [4, 6], move: [8, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], flee: [8, 18] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move" || nm === "flee") { const g = gait2(f, n, 3.5, 2.5); return { legs: g, bob: g.bob, sack: nm === "flee" ? 1 : 0 }; }
    if (nm === "wind") return { grab: -0.3 * t };
    if (nm === "atk") return { grab: [0.6, 1, 1][f] };
    if (nm === "rec") return { grab: 1 - t, sack: t };
    if (nm === "hurt") return { hurt: f === 0 };
    return { bob: Math.sin(ph) * 0.4 };
  }, gnomeFrame);

// ════ 뿌리 벌레 떼 ════ 하얀 굼벵이 넷이 뿌리 속에서 꿈틀꿈틀 기어 나와 문다
//   p: wave · bite · hurt
const GRUB = ramp(0xe8dcc0), GRUBH = ramp(0x8a5a3a);
function grubsFrame(p = {}) {
  const W = 64, H = 26, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 32 });
  const wv = p.wave ?? 0, bt = p.bite ?? 0;
  const GR = mat(ramp(0xe8e0d0), { tex: "skin", amp: 0.6, spec: 0.6 }), GRF = mat(ramp(0xd0c8b4), { tex: "skin", amp: 0.5, spec: 0.4 }), HD = mat(ramp(0xb87a3a), { spec: 0.6 });
  [[-20, 1], [10, 1], [-6, 0], [20, 0]].forEach(([dx, far], k) => {
    const x0 = 32 + dx, z = far ? -1 + k * 0.2 : 2 + k * 0.2, M = far ? GRF : GR;
    const segs = [];
    for (let j = 0; j < 5; j++) { const x = x0 - 8 + j * 3.4, y = G - 3 - far * 2 - Math.sin(wv + j * 0.9 + k) * 1.2 - (j === 4 ? bt * 2 : 0); segs.push([x, y]); }
    S.add(U(...segs.map(([x, y], j) => ellR(x, y, 2.8, 2.8 + Math.sin((j / 4) * Math.PI) * 0.6))), M, { z, h: 2.4 });
    for (let j = 1; j < 5; j++) S.carve(capF([segs[j][0] - 1.7, segs[j][1] - 3], [segs[j][0] - 1.6, segs[j][1] + 3], 0.3), 0.6);
    const hd = segs[4];
    S.add(ellR(hd[0] + 2.6, hd[1], 2, 2), HD, { z: z + 0.2, h: 1.4 });
    S.add(U(capF([hd[0] + 4, hd[1] - 0.6], [hd[0] + 5.6, hd[1] - 1.4 - bt], 0.5, 0.2), capF([hd[0] + 4, hd[1] + 0.6], [hd[0] + 5.6, hd[1] + 1.4 + bt], 0.5, 0.2)), mat(ramp(0x3a2010)), { z: z + 0.3, h: 0.3 });
  });
  return done3(S.render({ rim: !0 }), p);
}
export const pxGrubs = spec(46, 19, 26, 8,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { wave: ph * 2 };
    if (nm === "atk") return { bite: f % 2, wave: ph };
    if (nm === "hurt") return { hurt: f === 0, wave: 2 };
    return { wave: Math.sin(ph) * 0.6 };
  }, grubsFrame);

// ════ 발광 버섯 꼬마 ════ 빛나는 갓을 쓴 꼬마 버섯. 아장아장 걸으며 빛 포자를 퍼뜨리고, 붙으면 도망친다
//   p: bob · legs · puff 포자 뿜기 · glow · hurt
const CAPG = rampGlow(0x5ad8c0), STEM = ramp(0xe0d8c0);
function shroomFrame(p = {}) {
  const W = 46, H = 46, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 23 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pf = p.puff ?? 0, cx = 22;
  const STM = mat(ramp(0xe0d8c8), { tex: "wood", amp: 0.7, dir: 1.57 }), CAP = mat(rampGlow(0x5ad8c0)), CAPD = mat(ramp(0x2a8a7a), { tex: "skin", amp: 0.8, spec: 0.5 }), GIL = mat(ramp(0xc8e8e0), { tex: "cloth" });
  // 뿌리 다리
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) { const hp = [cx + d, 34 + b], ft = [cx + d * 1.6 + o[0], G - 1 - o[1]]; S.add(U(capF(hp, ft, 2, 1.4), capF(ft, [ft[0] + 2.6, ft[1]], 0.8)), far ? mat(rampF(0xb0a898), { tex: "wood" }) : STM, { z: far ? -2 : 3, h: 1.2 }); }
  // 자루 몸 (주름 · 얼굴 구멍)
  S.add(U(ellR(cx, 30 + b, 6.4, 8)), STM, { z: 1, h: 5 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 5, 26 + k * 3 + b], [cx + 5, 26.6 + k * 3 + b], 0.3), 0.5);
  S.add(ellR(cx + 2.4, 28 + b, 1.2, 1.4), R_VD, { z: 1.4, lift: 0.1, h: 0.2 }).add(ellR(cx + 5, 28 + b, 1, 1.2), R_VD, { z: 1.4, lift: 0.1, h: 0.2 });
  !p.hurt && S.decal(cx + 2.4, 27.6 + b, 0xa8fff0).decal(cx + 5, 27.6 + b, 0xa8fff0);
  // 갓 (빛나는 · 점)
  S.add(minus(ellR(cx, 22 + b, 13, 10), (x, y) => y > 22.4 + b), CAPD, { z: 2, h: 7 });
  S.add(capF([cx - 12, 22.2 + b], [cx + 12, 22.2 + b], 1.4), GIL, { z: 2.2, h: 0.6 });
  for (const [x, y, r] of [[-6, -6, 2.4], [1, -9, 2], [7, -5, 2.4], [-10, -2, 1.4], [10, -1, 1.2]]) S.add(ellR(cx + x, 22 + y + b, r, r * 0.8), CAP, { on: 1, lift: 0.4, h: 0.4 });
  const C = S.render({ rim: !0 });
  if (pf > 0.3) { const Q = R_toPx(W, H, 0.72, 23); for (let k = 0; k < 10 + pf * 6; k++) { const a = -Math.PI + k * 0.4, q = Q(cx + Math.cos(a) * (8 + pf * 6 + (k % 3) * 2), 14 + b + Math.sin(a) * (4 + pf * 3)); C.px(q[0], q[1], k % 2 ? 0x9af8e8 : 0xd8fff8); } }
  return done3(C, p);
}
export const pxShroomKid = spec(33, 33, 12, 18,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") { const g = gait2(f, n, 2.5, 2); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { puff: -0.5 * t, bob: t };
    if (nm === "atk") return { puff: [1.6, 1, 0.4][f] };
    if (nm === "hurt") return { hurt: f === 0, puff: 0.6 };
    return { bob: Math.sin(ph) * 0.4 };
  }, shroomFrame);

// ════ 포자 풍선 ════ 부푼 보랏빛 포자 주머니. 둥둥 떠다니다 다가와 터지며 독 구름을 남긴다
//   p: swell · wob · burst · hurt
function balloonFrame(p = {}) {
  const W = 48, H = 56, S = sculpt(W, H, { k: 0.72, ax: 24 });
  const sw = p.swell ?? 0, wb = p.wob ?? 0, br = p.burst ?? 0, cx = 24, cy = 24;
  const SAC = mat(ramp(0x8a5ab0, { hi: 0.6 }), { tex: "skin", amp: 0.9, spec: 0.8 }), SACD = mat(ramp(0x6a3a8a), { tex: "skin", amp: 0.8 });
  if (!br) {
    S.add(ellR(cx, cy, 13 + sw * 4 + wb * 0.6, 14 + sw * 3 - wb * 0.6), SAC, { z: 1, h: 11 });
    for (let k = 0; k < 5; k++) S.carve(capF([cx - 10 + k * 5, cy - 12], [cx - 11 + k * 5.4, cy + 12], 0.4), 0.5);
    for (const [x, y, r] of [[-5, -6, 2.4], [4, -2, 2], [-2, 6, 1.8], [7, 7, 1.4]]) S.add(ellR(cx + x, cy + y, r + sw, r + sw), mat(ramp(0xc8a0e8), { spec: 0.6 }), { on: 1, lift: 0.4, h: 0.6 });
    S.add(ellR(cx - 5, cy - 8, 3, 2), mat(ramp(0xf0e0ff), { spec: 1 }), { on: 1, lift: 0.5, h: 0.3 });
    // 매달린 균사 실
    for (let k = 0; k < 4; k++) { let q = [cx - 6 + k * 4, cy + 12], a = Math.PI / 2; const tl = []; for (let j = 0; j < 4; j++) { a += Math.sin(wb + j + k) * 0.2; const n2 = pol(q, a, 3.4); tl.push(capF(q, n2, 0.6, 0.4)); q = n2; } S.add(U(...tl), SACD, { z: 0.5, h: 0.3 }); }
    S.add(ellR(cx + 4, cy + 2, 1.4, 1.6), R_VD, { on: 1, lift: 0.3, h: 0.2 }).add(ellR(cx + 9, cy + 2, 1.2, 1.4), R_VD, { on: 1, lift: 0.3, h: 0.2 });
  } else S.add(U(...[0, 1, 2, 3, 4, 5].map((k) => polyF([[cx, cy], pol([cx, cy], k * 1.05, 14), pol([cx, cy], k * 1.05 + 0.4, 10)]))), SACD, { z: 1, h: 1 });
  const C = S.render({ rim: !0 });
  if (br) { const Q = R_toPx(W, H, 0.72, 24); for (let k = 0; k < 24; k++) { const a = k * 0.5, r = 6 + (k % 5) * 4; const q = Q(cx + Math.cos(a) * r, cy + Math.sin(a) * r); C.px(q[0], q[1], k % 2 ? 0xb88ad8 : 0xe0c8f8); } }
  return done3(C, p);
}
export const pxBalloon = spec(35, 40, 16, 20,
  { idle: [6, 6], move: [6, 8], wind: [4, 10, !1], atk: [2, 12, !1], rec: [2, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { swell: t, wob: Math.sin(t * 9) };
    if (nm === "atk") return { swell: 1.2, burst: 1 };
    if (nm === "hurt") return { hurt: f === 0, wob: 1.5 };
    return { wob: Math.sin(ph) * 1.2 };
  }, balloonFrame, { flying: !0 });

// ════ 균사 사슴 ════ 균에 뒤덮인 사슴. 뿔은 버섯이 핀 가지, 몸엔 하얀 균사가 덮였다. 뿔을 낮추고 돌진, 포자를 털어낸다
//   p: legs · bob · head · shake · hurt
const DEER = ramp(0x8a6a50), DEERF = rampF(0x7a5c44), MYC = ramp(0xe0e0d0);
function deerFrame(p = {}) {
  const W = 88, H = 72, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 42 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd = p.head ?? 0, sk = p.shake ?? 0, cx = 38, cy = 40 + b;
  const FUR = mat(ramp(0x8a6a50), { tex: "fur", amp: 1.1, dir: 0.3 }), FURF = mat(rampF(0x6a503c), { tex: "fur", dir: 0.3 }), MYC = mat(ramp(0xe8e4d8), { tex: "fur", amp: 1.4, dir: 1.2 }), CAPM = mat(ramp(0xd86a3a), { tex: "skin", spec: 0.4 });
  const legD = (x, o, far, front) => { const hp = [x, cy + 6], kn = [x + (front ? 2 : -3), cy + 18], ft = [x + o[0], G - 1 - o[1]]; S.add(U(capF(hp, kn, 3.6, 2.2), capF(kn, ft, 1.8, 1.4)), far ? FURF : FUR, { z: far ? -3 : 5, h: 1.8 }); S.add(polyF([[ft[0] - 1.4, ft[1] - 2.4], [ft[0] + 2.4, ft[1] - 2.4], [ft[0] + 2.6, ft[1]], [ft[0] - 1.4, ft[1]]]), mat(ramp(0x2a2420), { spec: 0.4 }), { z: far ? -2.9 : 5.1, h: 0.6 }); };
  legD(cx + 14, lg.ff, 1, 1), legD(cx - 16, lg.bf, 1, 0);
  S.add(U(ellR(cx, cy, 20, 10), ellR(cx + 12, cy - 3, 10, 10)), FUR, { z: 1, h: 9 });
  // 균사 덮개 (등)
  S.add(U(ellR(cx - 4, cy - 7, 16, 4.6), ellR(cx + 8, cy - 9, 8, 4)), MYC, { lift: 0.8, h: 2 });
  for (let k = 0; k < 6; k++) S.add(capF([cx - 16 + k * 5, cy - 6], [cx - 17 + k * 5.4, cy + 2 + (k % 2) * 3], 0.8, 0.4), MYC, { z: 2, h: 0.4 });
  for (const [x, y] of [[-10, -10], [2, -12], [10, -11]]) S.add(U(capF([cx + x, cy + y + 2], [cx + x, cy + y - 1], 0.8), minus(ellR(cx + x, cy + y - 1.4, 3, 2.2), (X, Y) => Y > cy + y - 1.2)), CAPM, { lift: 1, h: 1 });
  // 목 + 머리 + 버섯 뿔
  const nk = [cx + 16, cy - 6], hp = lerp([cx + 26, cy - 22], [cx + 30, cy - 2], hd), ha = L(0.4, 1.2, hd) + sk * 0.1;
  S.add(capF(nk, hp, 5, 3.6), FUR, { z: 2, h: 4 });
  S.add(U(ellR(hp[0], hp[1], 4.6, 4), capF(hp, pol(hp, ha, 9), 3.4, 2)), FUR, { z: 3, h: 3.4 });
  S.add(ellR(hp[0] - 3, hp[1] - 3, 1.8, 3, 0.4), FURF, { z: 2.8, h: 1 });
  S.add(ellR(...pol(hp, ha, 8.6), 1.4, 1.2), mat(ramp(0x2a2020)), { z: 3.2, h: 0.4 });
  !p.hurt && S.decal(...pol(pol(hp, ha, 2), ha - 1.57, 1.6), 0xa8fff0);
  for (const [d, z] of [[-1, 2.4], [1, 3.6]]) { let q = pol(hp, ha - 2, 3 + d), a = ha - 2.3 - d * 0.15 + sk * 0.15; for (let k = 0; k < 4; k++) { const n2 = pol(q, a, 5); S.add(capF(q, n2, 1.2 - k * 0.15), mat(ramp(0xb0a890), { tex: "wood" }), { z, h: 0.8 }); if (k % 2) { S.add(U(capF(n2, pol(n2, a + 1, 3), 0.6), minus(ellR(...pol(n2, a + 1, 3.6), 2.6, 1.8), (X, Y) => Y > pol(n2, a + 1, 3.6)[1] + 0.2)), k === 1 ? CAPM : R_MYC, { z: z + 0.1, h: 0.8 }); } q = n2; a += 0.3; } }
  legD(cx + 18, lg.fn, 0, 1), legD(cx - 12, lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  if (Math.abs(sk) > 0.5) { const Q = R_toPx(W, H, 0.72, 42); for (let k = 0; k < 14; k++) { const q = Q(cx + Math.cos(k * 1.1) * (18 + (k % 3) * 6), cy - 10 + Math.sin(k * 1.7) * 10); C.px(q[0], q[1], k % 2 ? 0xe8e4d8 : 0x9af8e8); } }
  return done3(C, p);
}
export const pxMycoDeer = spec(63, 52, 30, 26,
  { idle: [4, 5], move: [6, 12], wind: [4, 10, !1], atk: [6, 18], rec: [3, 10, !1], hurt: [2, 10, !1], shake: [4, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, head: f === 2 ? 0.3 : 0 };
    if (nm === "move") { const g = gait4(f, n, 5, 3); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { head: 0.9 * t, bob: t };
    if (nm === "atk") { const g = gait4(f, n, 7, 3.5); return { legs: g, head: 1, bob: g.bob + 1 }; }
    if (nm === "shake") return { shake: f % 2 ? 1.5 : -1.5, head: 0.2 };
    if (nm === "rec") return { head: 1 - t };
    return { hurt: f === 0, head: -0.4 };
  }, deerFrame);

// ════ 흙덩이 정령 ════ 축축한 흙과 돌이 뭉친 덩어리. 둘이 만나면 합쳐져 커진다. 흙 주먹을 휘두른다
//   p: big 크기(0~1) · bob · arm · hurt
const CLOD = ramp(0x6a5038);
function clodFrame(p = {}) {
  const W = 62, H = 56, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const bg = p.big ?? 0, b = p.bob ?? 0, ar = p.arm ?? 0, cx = 28, sc = 1 + bg * 0.25;
  const DIRT = mat(ramp(0x6a5038), { tex: "clay", amp: 1.4, spec: 0.3 }), DIRTF = mat(rampF(0x4e3a28), { tex: "clay", amp: 1.2 }), STN = mat(ramp(0x8a8478), { tex: "stone", amp: 1.2 });
  S.add(U(ellR(cx, G - 13 * sc + b, 14 * sc, 13 * sc), ellR(cx - 6 * sc, G - 6, 8 * sc, 6), ellR(cx + 6 * sc, G - 6, 8 * sc, 6)), DIRT, { z: 1, h: 11 });
  for (const [x, y, r] of [[-8, -18, 3], [6, -22, 2.4], [9, -10, 2.6], [-4, -8, 2], [-11, -10, 1.8]]) S.add(ellR(cx + x * sc, G + y * sc + b, r * sc, r * 0.8 * sc), STN, { lift: 0.6, h: r * 0.6 });
  for (const [x, a] of [[-6, -1.9], [4, -1.3]]) { const r = [cx + x * sc, G - 25 * sc + b]; S.add(capF(r, pol(r, a, 7), 0.6, 0.3), R_ROOT, { z: 2, h: 0.4 }); S.add(ellR(...pol(r, a, 7.4), 2, 1.2, a), mat(ramp(0x6a9a44), { tex: "leaf" }), { z: 2.1, h: 0.6 }); }
  for (const x of [cx + 3 * sc, cx + 8 * sc]) { S.add(ellR(x, G - 16 * sc + b, 1.6, 1.4), R_VD, { z: 1.6, lift: 0.1, h: 0.3 }); !p.hurt && S.decal(x, G - 16.4 * sc + b, 0xe8c060); }
  // 흙 주먹
  const sh = [cx + 10 * sc, G - 16 * sc + b], fist = ar <= 1 ? [sh[0] + 4 - ar * 6, sh[1] + 10 - ar * 24] : [sh[0] + 10, sh[1] + 12];
  S.add(capF(sh, fist, 4 * sc, 3.6 * sc), DIRT, { z: 5, h: 3 });
  S.add(ellR(fist[0], fist[1], 5.6 * sc, 5 * sc), DIRTF, { z: 5.4, h: 4 });
  S.add(ellR(fist[0] - 1, fist[1] - 2, 1.8, 1.4), STN, { lift: 0.4, h: 0.6 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxClod = spec(45, 40, 18, 18,
  { idle: [4, 5], move: [6, 8], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], grow: [4, 8, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { bob: -Math.abs(Math.sin(ph)) * 1.2 };
    if (nm === "wind") return { arm: t };
    if (nm === "atk") return { arm: 2, bob: 1 };
    if (nm === "rec") return { arm: 2 - 2 * t };
    if (nm === "grow") return { big: t };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 0.5 };
  }, clodFrame);

// ════ 썩은 뿌리 망령 ════ 시든 뿌리에 깃든 원한. 뿌리가 엉킨 몸에 빈 눈구멍, 아래는 흩어진다. 뿌리 사이로 순간이동해 뒤에서 할퀸다
//   p: bob · claw · fade · hurt
const WRT = ramp(0x5a4a5a, { warm: 0xd8c8f0 });
function wraithFrame(p = {}) {
  const W = 62, H = 68, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const b = p.bob ?? 0, cl = p.claw ?? 0, cx = 28;
  const RT = mat(ramp(0x5a4a3a), { tex: "wood", amp: 1.3, dir: 1.57 }), RTF = mat(rampF(0x3e3228), { tex: "wood", dir: 1.57 }), GH = mat(ramp(0x7a9a8a, { hi: 0.5 }), { tex: "cloth", amp: 0.6 });
  // 흩어지는 아랫몸 (뿌리 가닥)
  for (let k = 0; k < 6; k++) S.add(capF([cx - 6 + k * 2.4, 40 + b], [cx - 10 + k * 4 + Math.sin(b + k) * 2, 64 + b - (k % 2) * 4], 1.6, 0.4), k % 2 ? RTF : RT, { z: 0.5, h: 1 });
  S.add(polyF([[cx - 9, 26 + b], [cx + 10, 26 + b], [cx + 6, 46 + b], [cx - 6, 46 + b]]), GH, { z: 0.8, h: 4 });
  // 뿌리 엉킨 몸
  for (let k = 0; k < 7; k++) { const a = -0.4 + k * 0.5, r0 = [cx + Math.cos(a) * 3, 30 + b + k * 2], r1 = [cx + Math.cos(a + 2) * 9, 24 + b + k * 3.4]; S.add(capF(r0, r1, 2.4, 1.4), k % 2 ? RT : RTF, { z: 1 + k * 0.1, h: 1.6 }); }
  S.add(ellR(cx, 32 + b, 7, 9), RT, { z: 1, h: 6 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 6, 28 + k * 4 + b], [cx + 6, 27 + k * 4.4 + b], 0.4), 0.7);
  S.add(capF([cx - 2, 28 + b], [cx + 2, 40 + b], 0.8), R_MYC, { on: 1, lift: 0.3, h: 0.2 });
  // 머리 (빈 눈구멍 · 뒤틀린 뿔뿌리)
  const hx = cx + 2, hy = 16 + b;
  S.add(U(ellR(hx, hy, 7, 8), polyF([[hx - 5, hy + 4], [hx + 6, hy + 4], [hx + 3, hy + 12]])), RT, { z: 3, h: 5 });
  for (const x of [hx + 1, hx + 5]) { S.add(ellR(x, hy, 1.8, 2.2), R_VD, { z: 3.4, h: 0.4 }); !p.hurt && S.decal(x, hy, 0x9af8c8); }
  S.add(ellR(hx + 3, hy + 6, 2, 1.4), R_VD, { z: 3.4, h: 0.3 });
  for (const [d, z] of [[-1, 2.8], [1, 3.4]]) { let q = [hx - 2 + d * 3, hy - 6], a = -1.9 + d * 0.5; for (let k = 0; k < 3; k++) { const n2 = pol(q, a, 4.4); S.add(capF(q, n2, 1.4 - k * 0.3, 1 - k * 0.3), RTF, { z, h: 0.8 }); q = n2; a += d * 0.5; } }
  // 발톱 팔 (뿌리)
  const sh = [cx + 6, 28 + b], hd = pol(sh, 0.9 - cl * 1.3, 12 + cl * 4);
  S.add(capF(sh, hd, 2.6, 1.8), RT, { z: 6, h: 1.6 });
  for (const e of [-0.5, 0, 0.5]) S.add(capF(hd, pol(hd, 0.9 - cl * 1.3 + e, 6), 1, 0.3), RTF, { z: 6.2, h: 0.5 });
  const C = S.render({ rim: !0 });
  fadeY(C, 44 + b, 68);
  (p.fade ?? 0) > 0 && fadeY(C, 0, 68 / (p.fade + 0.01));
  return p.hurt ? flash(C) : C;
}
export const pxWraith = spec(45, 49, 14, 28,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], fade: [4, 12, !1], appear: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { claw: -0.4 * t, bob: -0.5 };
    if (nm === "atk") return { claw: [0.6, 1, 1][f] };
    if (nm === "rec") return { claw: 1 - t };
    if (nm === "fade") return { fade: 0.3 + t * 2.2 };
    if (nm === "appear") return { fade: 2.5 - t * 2.4 };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 1.2 };
  }, wraithFrame, { flying: !0 });

// ════ 돌껍질 달팽이 ════ 돌 같은 나선 껍질 · 축축한 몸 · 눈자루. 산성 점액을 뱉고, 지나간 자리는 미끄럽다
//   p: stretch · eyes 눈자루 · spit · hide 껍질에 숨기 · hurt
const SNL = ramp(0x9a8a6a), SHELLS = ramp(0x7a7468);
function snailFrame(p = {}) {
  const W = 66, H = 46, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 32 });
  const stv = p.stretch ?? 0, ey = p.eyes ?? 0, sp = p.spit ?? 0, hd = p.hide ?? 0, cx = 28;
  const BOD = mat(ramp(0x8a8a6a), { tex: "skin", amp: 0.9, spec: 0.8 }), BODF = mat(rampF(0x6a6a50), { tex: "skin" }), SHL = mat(ramp(0x7a746a), { tex: "stone", amp: 1.3, spec: 0.2 }), SHLD = mat(ramp(0x5a5448), { tex: "stone", amp: 1.2 });
  // 몸 (발)
  if (hd < 0.8) {
    S.add(U(capF([cx - 16, G - 3], [cx + 18 + stv * 6, G - 3], 3.4, 3), ellR(cx + 18 + stv * 6, G - 7, 5, 6)), BOD, { z: 0, h: 3 });
    S.add(capF([cx - 16, G - 1], [cx + 18 + stv * 6, G - 1], 1), mat(ramp(0xa8b8a0), { spec: 1 }), { on: 1, lift: 0.3, h: 0.2 });
    const hx = cx + 18 + stv * 6, hy = G - 9;
    for (const [d, z] of [[-1, -0.5], [1, 0.6]]) { const tip = [hx + 3 + d * 1.4 + ey * 2, hy - 10 + Math.abs(ey) * 1.4]; S.add(capF([hx + d, hy - 2], tip, 1, 0.8), d < 0 ? BODF : BOD, { z, h: 0.6 }); S.add(ellR(tip[0], tip[1], 1.6, 1.6), d < 0 ? BODF : BOD, { z: z + 0.1, h: 1 }); !p.hurt && S.decal(tip[0] + 0.4, tip[1], 0x101010); }
    sp > 0 && S.add(ellR(hx + 6, hy + 2, 2.4, 2), mat(ramp(0xb8e050), { spec: 0.8 }), { z: 1.2, h: 1 });
  }
  // 돌 나선 껍질
  const sc0 = [cx - 2, G - 15 + hd * 2];
  S.add(ellR(sc0[0], sc0[1], 15, 14), SHL, { z: 1, h: 11 });
  for (let k = 0; k < 36; k++) { const a = k * 0.35, r = 13 - k * 0.32; S.carve(ellR(sc0[0] + Math.cos(a) * r, sc0[1] + Math.sin(a) * r, 1, 1), 0.8); }
  S.add(ellR(sc0[0] + 1, sc0[1] + 1, 4, 4), SHLD, { lift: 0.4, h: 1.4 });
  for (const [x, y] of [[-8, -6], [6, 8], [-10, 6]]) S.add(ellR(sc0[0] + x, sc0[1] + y, 2.4, 1.6), mat(ramp(0x6a9a44), { tex: "leaf" }), { lift: 0.6, h: 0.6 });
  const C = S.render({ rim: !0 });
  if (sp > 0) { const Q = R_toPx(W, H, 0.72, 32); for (let k = 0; k < 6; k++) { const q = Q(cx + 26 + stv * 6 + k * 3, G - 8 - k * 0.6); C.px(q[0], q[1], k % 2 ? 0xb8e050 : 0xe8f8a0); } }
  return done3(C, p);
}
export const pxSnail = spec(48, 33, 24, 16,
  { idle: [4, 5], move: [6, 8], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1], hide: [2, 4] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { stretch: Math.max(0, Math.sin(ph)), eyes: Math.sin(ph) };
    if (nm === "wind") return { stretch: -0.5 * t, eyes: t };
    if (nm === "atk") return { spit: 1, stretch: 0.6 };
    if (nm === "hide") return { hide: 1 };
    if (nm === "hurt") return { hurt: f === 0, hide: 0.4 };
    return { eyes: Math.sin(ph) * 0.5 };
  }, snailFrame);

// ════════════ 정예 (큰 몬스터 조각 도구) ════════════
// ════ [정예] 뿌리 갑옷 곰 ════ 굵은 뿌리가 갑옷처럼 몸을 감은 거대한 곰. 이끼 등 · 빛나는 균사 상처. 앞발 연타 · 일어서서 내려찍기 · 포효
//   p: bob · legs · stand 일어섬(0~1) · paw 앞발(0~1 휘두름) · roar · hurt
const BRK = 0.7;
const BFUR = mat(ramp(0x5a4030), { tex: "fur", amp: 1, dir: 1.2 }), BFURF = mat(rampF(0x5a4030), { tex: "fur", amp: 0.8, dir: 1.2 });
const BROOT = mat(ramp(0x7a5a38), { tex: "wood", amp: 1, dir: 0.3 }), BMOSS = mat(ramp(0x4e7a34), { tex: "fur", amp: 1, dir: 1.5 });
const BCLAW = mat(ramp(0xd8ccb0), { spec: 0.4 }), BNOSE = mat(ramp(0x2a2020), { spec: 0.5 });
function bearFrame(p = {}) {
  const W = 110, H = 96, G = H - 1, S = sculpt(W, H, { k: p.k ?? BRK, ax: 54 }), b = p.bob ?? 0, sd = p.stand ?? 0, pw = p.paw ?? 0;
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = rot([40, 70], -sd * 0.9), P = (x, y) => R([x, y + b]);
  // 뒷다리 (서면 그대로 땅)
  for (const [x, o, far] of [[30, lg.bf, 1], [36, lg.bn, 0]]) { const hip = [x, 68 + b], ft = [x + o[0] + 2, G - 3 - o[1]]; S.add(capF(hip, ft, 9, 7), far ? BFURF : BFUR, { z: far ? -4 : 2, h: 7 }); S.add(ellR(ft[0] + 3, ft[1] + 1, 7, 3.4), far ? BFURF : BFUR, { z: far ? -4 : 3, h: 2.4 }); for (let k = 0; k < 3; k++) S.add(capF([ft[0] + 7, ft[1] - 1 + k * 1.4], [ft[0] + 10, ft[1] + k * 1.4], 0.8, 0.4), BCLAW, { z: far ? -3 : 4, h: 0.8 }); }
  // 몸통 (서면 세워짐)
  S.add(ellR(...P(50, 58), 26, 18, -sd * 0.9), BFUR, { z: 0, h: 16 });
  S.add(ellR(...P(64, 48), 15, 14), BFUR, { blend: 5, h: 7 }); // 어깨 혹
  // 뿌리 갑옷 (몸을 감고 도는 굵은 뿌리)
  for (const [x0, y0, x1, y1, r] of [[30, 48, 62, 70, 3.2], [40, 42, 70, 62, 2.8], [52, 40, 76, 54, 2.6], [28, 62, 50, 76, 2.4]]) S.add(capF(P(x0, y0), P(x1, y1), r, r * 0.8), BROOT, { on: 1, h: 2.6, lift: 1.2 });
  S.add(polyF([P(40, 38), P(64, 36), P(70, 44), P(44, 46)]), BMOSS, { on: 1, h: 1.8 }); // 등 이끼
  for (const [x, y] of [[46, 56], [58, 64], [36, 60]]) S.carve(capF(P(x, y), P(x + 4, y + 3), 0.9), 1.6, !1), S.decal(...P(x + 2, y + 1.5), 0x9affd0);
  // 머리 (서면 위로)
  const hc = P(80, 40);
  S.add(ellR(hc[0], hc[1], 13, 11.5), BFUR, { h: 11 });
  S.add(ellR(hc[0] + 9, hc[1] + 4, 7.5, 6), BFUR, { blend: 3, h: 4 }); // 주둥이
  S.add(ellR(hc[0] + 15, hc[1] + 2, 3, 2.4), BNOSE, { h: 2, lift: 4 });
  S.add(U(ellR(hc[0] - 6, hc[1] - 10, 4, 3.6), ellR(hc[0] + 3, hc[1] - 11, 3.6, 3.2)), BFUR, { h: 3, lift: 2 }); // 귀
  S.add(capF([hc[0] - 4, hc[1] - 12], [hc[0] - 10, hc[1] - 20], 2, 0.8), BROOT, { h: 1.6, lift: 4 }); // 머리 위 뿌리 가지
  const ro = p.roar ?? 0;
  S.carve(capF([hc[0] + 7, hc[1] + 8 + ro], [hc[0] + 15, hc[1] + 7 + ro], 0.8 + ro * 2), 2.4, !1);
  if (!p.block) {
    for (let x = hc[0] + 8; x < hc[0] + 15; x++) for (let yy = 0; yy <= ro * 4; yy++) S.decal(x, hc[1] + 7.5 + yy, yy > 0 && yy < ro * 4 ? 0x5a1418 : 0x1a0c0c);
    ro > 0.3 && (S.decal(hc[0] + 9, hc[1] + 7, 0xf0ead8), S.decal(hc[0] + 13, hc[1] + 7, 0xf0ead8));
    p.hurt || (S.decal(hc[0] + 4, hc[1] - 2, 0x9affd0).decal(hc[0] + 5, hc[1] - 2, 0x9affd0).decal(hc[0] + 4, hc[1] - 3, 0xffffff));
  }
  // 앞다리 둘 (휘두르면 앞으로 크게)
  for (const far of [1, 0]) {
    const sh = P(66 + far * -6, 54), a = sd > 0.5 ? -0.6 + pw * 1.8 : 1.4 - pw * 1.2, el = pol(sh, a, 14), ft = sd > 0.5 ? pol(el, a + 0.4, 12) : [sh[0] + 4 + (far ? lg.ff[0] : lg.fn[0]), G - 3 - (far ? lg.ff[1] : lg.fn[1])];
    S.add(U(capF(sh, el, 8, 6.5), capF(el, ft, 6.5, 5.5)), far ? BFURF : BFUR, { z: far ? -2 : 10, h: 6 });
    S.add(capF(lerp(sh, el, 0.3), lerp(el, ft, 0.6), 3, 2.6), BROOT, { on: 1, h: 1.6 });
    for (let k = 0; k < 3; k++) S.add(capF([ft[0] + 3, ft[1] - 1 + k * 1.6], [ft[0] + 7.5, ft[1] + 0.5 + k * 1.6], 0.9, 0.4), BCLAW, { z: far ? 0 : 12, h: 0.9 });
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxRootBear = {
  fw: Math.round(110 * BRK), fh: Math.round(96 * BRK), w: 40, h: 40,
  anims: { idle: [4, 5], move: [6, 8], wind: [4, 10, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], stand: [4, 8, !1], slam: [3, 12, !1], roar: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait4(f, n, 6, 3); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { paw: -0.3 * t, bob: t };
    if (nm === "atk") P = { paw: [0.6, 1, 0.6, 1][f], bob: -1 };
    if (nm === "stand") P = { stand: t, paw: 0, roar: t * 0.4 };
    if (nm === "slam") P = { stand: [0.8, 0.3, 0][f], paw: 1, bob: f * 1.5 };
    if (nm === "roar") P = { roar: [0.4, 1, 1, 0.6][f], stand: 0.3 };
    if (nm === "rec") P = { paw: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, roar: 0.4, bob: 1 };
    return bearFrame(P);
  },
};

// ════ [정예] 버섯 왕 ════ 왕관처럼 둘레가 말린 거대한 빛나는 갓 · 굵은 자루 몸통 · 균사 망토 · 버섯 지팡이.
//   버섯 꼬마를 불러내고 포자 비를 뿌리며, 갓으로 내려찍는다
//   p: bob · step · cap 갓 숙이기 · staff 지팡이 들기 · glow · spores · hurt
const KK = 0.72;
const KCAP = mat(rampGlow(0x48c8b0), { tex: "skin", amp: 0.25, spec: 0.2 }), KSPOT = mat(ramp(0xe8fff4), { tex: "skin", amp: 0.1 });
const KSTEM = mat(ramp(0xe0d4b8), { tex: "skin", amp: 0.3 }), KGILL = mat(ramp(0xb8a890), { tex: "wood", amp: 0.6, dir: 1.57 });
const KCLOAK = mat(ramp(0xd8d8c8), { tex: "cloth", amp: 0.6 }), KSTAFF = mat(ramp(0x6a4a30), { tex: "wood", amp: 0.8, dir: 1.5 });
function mushKingFrame(p = {}) {
  const W = 100, H = 104, G = H - 1, S = sculpt(W, H, { k: p.k ?? KK, ax: 50 }), b = p.bob ?? 0, st = p.step ?? 0, cp = p.cap ?? 0;
  // 지팡이 (먼 손) + 작은 버섯 머리
  const sh = p.staff ?? 0, hand = [28, 64 + b - sh * 16], top = [24, 34 + b - sh * 22];
  S.add(capF([30, G - 2], top, 1.8, 1.6), KSTAFF, { z: -4, h: 1.8 });
  S.add(ellR(top[0], top[1] - 2, 7, 4.6), KCAP, { z: -2, h: 4 });
  // 다리 (뿌리 발)
  for (const [x, far, s] of [[42, 1, -st], [58, 0, st]]) S.add(U(capF([x, 76 + b], [x + s, G - 4], 6, 5), ellR(x + s + 2, G - 2, 8, 3)), far ? mat(rampF(0xe0d4b8)) : KSTEM, { z: far ? -2 : 3, h: 5 });
  // 균사 망토 몸 (자루)
  S.add(polyF([[36, 46 + b], [64, 46 + b], [68, 80 + b], [60, 84 + b], [50, 80 + b], [40, 84 + b], [32, 80 + b]]), KCLOAK, { z: 0, h: 12, prof: "flat" });
  for (const [x0, x1] of [[40, 38], [50, 50], [60, 62]]) S.carve(capF([x0, 50 + b], [x1, 80 + b], 0.8), 1.4);
  S.add(ellR(50, 56 + b, 10, 8), KSTEM, { blend: 3, h: 4 }); // 가슴
  // 얼굴 (갓 아래 자루 윗부분)
  S.add(ellR(52, 40 + b, 11, 9), KSTEM, { h: 9 });
  if (!p.block) {
    S.carve(ellR(48, 40 + b, 2, 2.4), 2.4, !1).carve(ellR(57, 40 + b, 2, 2.4), 2.4, !1);
    const ec = p.hurt ? 0x203030 : 0x9affe0;
    S.decal(48, 40 + b, ec).decal(57, 40 + b, ec).decal(48, 39 + b, 0xffffff).decal(57, 39 + b, 0xffffff);
    S.carve(capF([49, 46 + b], [56, 46 + b], 0.7), 1.6, !1);
  }
  // 거대한 갓 (숙이면 앞으로 기울어 내려옴) + 주름 + 반점 + 말린 테
  const cr = rot([50, 30 + b], cp * 0.35), Q = (x, y) => cr([x, y + b]);
  S.add(polyF([Q(16, 32), Q(84, 32), Q(78, 36), Q(22, 36)]), KGILL, { z: 4, h: 3 });
  S.add(U(ellR(...Q(50, 24), 36, 16, cp * 0.35)), KCAP, { z: 6, h: 14 });
  for (let k = 0; k < 8; k++) { const x = 18 + k * 9.2; S.add(ellR(...Q(x, 34 - Math.sin((k / 7) * Math.PI) * 1.5), 4, 2.4), KCAP, { blend: 1.5, h: 1.2 }); } // 말린 테 (왕관처럼)
  for (const [x, y, r] of [[34, 18, 4], [52, 12, 5], [68, 18, 3.6], [44, 26, 2.6], [62, 27, 2.4], [26, 25, 2.2]]) S.add(ellR(...Q(x, y), r, r * 0.75), KSPOT, { blend: 1.2, h: 1.2 });
  // 포자 (뿌릴 때)
  if ((p.spores ?? 0) > 0) for (let k = 0; k < 12; k++) S.add(ellR(14 + k * 6.4, 6 + ((k * 13) % 9) - p.spores * 4, 1.2, 1.2), KSPOT, { z: 16, h: 0.8 });
  // 가까운 팔 (망토 소매)
  const sN = [62, 50 + b], hN = sh > 0.5 ? [68, 30 + b] : [70, 66 + b];
  S.add(capF(sN, hN, 4.6, 3.6), KCLOAK, { z: 8, h: 4 });
  S.add(ellR(hN[0], hN[1], 3.6, 3.4), KSTEM, { z: 9, h: 3 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMushKing = {
  fw: Math.round(100 * KK), fh: Math.round(104 * KK), w: 34, h: 54,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], call: [4, 8, !1], rain: [6, 10] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.4 };
    if (nm === "wind") P = { cap: -0.4 * t, bob: -t * 2 };
    if (nm === "atk") P = { cap: [0.6, 1, 1][f], bob: 2 };
    if (nm === "rec") P = { cap: 1 - t, bob: 2 * (1 - t) };
    if (nm === "call") P = { staff: [0.5, 1, 1, 0.6][f], bob: -1 };
    if (nm === "rain") P = { spores: f / n + 0.2, staff: 0.6, cap: -0.15 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, cap: -0.2 };
    return mushKingFrame(P);
  },
};

// ════ [정예] 고대 뿌리 심장 ════ 거목 뿌리가 얽혀 만든 거대한 심장. 뿌리 혈관이 땅으로 뻗고, 가운데 균열에서 초록 빛이 맥박친다.
//   움직이지 않는다. 뿌리 촉수를 사방에서 솟구치게 하고, 맥박 충격파를 낸다
//   p: beat 맥박(0~1) · open 균열 벌어짐 · hurt
const HK = 0.72;
const HROOT = mat(ramp(0x6a3a2a), { tex: "wood", amp: 1.1, dir: 0.8 }), HROOTD = mat(ramp(0x4a2a20), { tex: "wood", amp: 1, dir: 1.2 });
const HFLESH = mat(ramp(0x8a3a3a), { tex: "skin", amp: 0.4 }), HCORE = mat(rampGlow(0x6af0a0), { tex: "skin", amp: 0.15 });
function heartFrame(p = {}) {
  const W = 100, H = 96, G = H - 1, S = sculpt(W, H, { k: p.k ?? HK, ax: 50 }), bt = p.beat ?? 0, op = p.open ?? 0;
  // 땅으로 뻗은 뿌리 혈관 (뒤)
  for (const [x0, y0, x1, y1, r] of [[30, 64, 6, G, 4], [70, 64, 94, G, 4], [40, 70, 24, G, 3.4], [60, 70, 78, G, 3.4], [50, 72, 50, G, 4.4]]) S.add(capF([x0, y0], [x1, y1], r, r * 0.6), HROOTD, { z: -4, h: 3 });
  // 심장 몸 (맥박에 따라 부풂)
  const s = 1 + bt * 0.06;
  S.add(U(ellR(42, 46, 22 * s, 24 * s, 0.3), ellR(60, 46, 20 * s, 23 * s, -0.3), polyF([[30, 60], [70, 60], [50, 80 + bt * 2]])), HFLESH, { z: 0, h: 18 });
  // 감은 뿌리 (몸을 휘감음)
  for (const [x0, y0, x1, y1, r] of [[24, 30, 70, 74, 3.4], [76, 28, 34, 72, 3.2], [30, 22, 74, 40, 2.8], [38, 64, 66, 62, 2.6], [50, 20, 50, 46, 2.4]]) S.add(capF([x0, y0], [x1, y1], r, r * 0.8), HROOT, { on: 1, h: 3, lift: 1.4 });
  // 위로 솟은 굵은 뿌리 동맥 둘
  S.add(capF([40, 26], [34, 4], 6, 4.4), HROOT, { z: 2, h: 5 });
  S.add(capF([60, 24], [68, 6], 5, 3.6), HROOT, { z: 2, h: 4.4 });
  // 가운데 균열 → 빛나는 핵
  S.carve(polyF([[48, 32], [54, 34], [56, 50], [52, 62], [46, 56], [44, 42]]), 3 + op * 3, !0);
  S.add(polyF([[49, 36], [53, 37], [54, 50], [51, 58], [47, 53], [46, 43]]), HCORE, { z: 8 + op * 3, h: 3 + bt * 2 });
  !p.block && (S.decal(50, 44, 0xffffff), S.decal(51, 48, 0xd8ffe8));
  // 이끼·균사 반점
  for (const [x, y] of [[32, 40], [68, 50], [40, 66], [62, 34]]) S.add(ellR(x, y, 3, 2), mat(ramp(0x5a8a3a), { tex: "fur", amp: 1 }), { on: 1, h: 1 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxRootHeart = {
  fw: Math.round(100 * HK), fh: Math.round(96 * HK), w: 50, h: 54,
  anims: { idle: [6, 6], move: [6, 6], wind: [4, 10, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], pulse: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle" || nm === "move") P = { beat: Math.max(0, Math.sin(ph * 2)) };
    if (nm === "wind") P = { beat: t, open: t };
    if (nm === "atk") P = { beat: 1, open: [1, 1.4, 1][f] };
    if (nm === "pulse") P = { beat: [1, 0.2, 1, 0.2][f], open: 0.6 };
    if (nm === "rec") P = { beat: 1 - t, open: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, beat: 0.5, open: 0.4 };
    return heartFrame(P);
  },
};
