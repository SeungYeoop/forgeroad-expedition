// 보그플로트 몬스터 12종 (조각 도구, 오른쪽을 본다) — 늪 안개 하늘 · 뿌리 늘어진 진흙섬 · 썩은 고목 · 갈대
//   아래 섬 줄: 늪 왜가리 · 갈대 인형 · 이탄 미라 · [정예] 늪 하마
//   가운데 줄: 흡혈 모기 · 안개 아귀 · 늪 검은고니 · [정예] 늪 히드라
//   위 줄: 안개 소금쟁이 · 안개 칠성장어 · 독 연꽃 · [정예] 닭발 오두막
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const MUD = mat(ramp(0x5a4a34), { tex: "clay", amp: 1 }), MUDF = mat(rampF(0x463a2a), { tex: "clay", amp: 0.9 }), PEAT = mat(ramp(0x3a2e24), { tex: "clay", amp: 1.1 });
const MOSS = mat(ramp(0x5a7040), { tex: "leaf", amp: 1 }), MOSSF = mat(rampF(0x46583a), { tex: "leaf", amp: 0.9 }), REED = mat(ramp(0xb0a060), { tex: "wood", amp: 1 }), REEDF = mat(rampF(0x8a7c48), { tex: "wood", amp: 0.9 });
const WOOD = mat(ramp(0x6a5a44), { tex: "wood", amp: 1 }), WOODF = mat(rampF(0x52463a), { tex: "wood", amp: 0.9 }), BONE = mat(ramp(0xd8ccb0), { spec: 0.3 });
const GLW = mat(rampGlow(0xd8f0a0)), GLWY = mat(rampGlow(0xf0e890)), DARK = mat(ramp(0x1a1612)), BLOOD = mat(ramp(0x8a2a2a), { spec: 0.4 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];

// ════ 늪 왜가리 ════ 청회색 깃 · 검은 머리깃(뒤로 두 가닥) · 긴 S자 목 · 단검 같은 노란 부리 · 가늘고 긴 다리 · 가슴의 늘어진 깃
//   p: legs · bob · coil(목 웅크림) · strike · hurt
const HRK = 0.72;
const HER = mat(ramp(0x8a98a4), { tex: "feather", amp: 0.9, dir: 0.3 }), HERF = mat(rampF(0x6e7a86), { tex: "feather", amp: 0.8, dir: 0.3 }), HERW = mat(ramp(0xe4e4dc), { tex: "feather", amp: 0.7, dir: 1.4 });
const YEL = mat(ramp(0xd8b040), { spec: 0.5 });
function heronFrame(p = {}) {
  const W = 92, H = 88, G = H - 1, S = sculpt(W, H, { k: HRK, ax: 36 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, co = p.coil ?? 0, sk = p.strike ?? 0, cx = 32;
  // 다리 (먼 쪽 · 가까운 쪽) — 뒤로 굽는 발목
  const lg = (o, far, d) => { const hp = [cx + d, 50 + b], ft = [cx + d + 2 + o[0], G - 1 - o[1]], kn = [cx + d - 3 + o[0] * 0.5, 66 + b * 0.5]; S.add(U(capF(hp, kn, 1, 0.7), capF(kn, ft, 0.7, 0.6)), far ? mat(rampF(0x8a7a50)) : mat(ramp(0xa89060)), { z: far ? -2 : 4, h: 0.7 }); S.add(ellR(kn[0], kn[1], 1, 1), far ? mat(rampF(0x8a7a50)) : mat(ramp(0xa89060)), { z: far ? -1.9 : 4.1, h: 0.6 }); for (const a of [0, 0.4, 3.0]) S.add(capF(ft, pol(ft, a, a > 2 ? 3 : 5), 0.5, 0.3), far ? mat(rampF(0xa08a40)) : YEL, { z: far ? -1.9 : 4.1, h: 0.4 }); };
  lg(g.f, 1, -2);
  // 몸 (물방울 모양 · 꼬리깃 아래로) + 날개 접힘
  S.add(U(ellR(cx, 42 + b, 13, 9, -0.3), polyF([[cx - 10, 44 + b], [cx - 22, 54 + b], [cx - 18, 46 + b]])), HER, { z: 1, h: 8 });
  S.add(ellR(cx - 3, 40 + b, 11, 6.4, -0.25), HERF, { lift: 1, h: 2 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 6 + k * 2, 42 + b], [cx - 18 + k * 1.4, 49 + b + k], 1.2, 0.5), mat(ramp(0x4a525c), { tex: "feather" }), { lift: 1.6, h: 0.6 });
  // 목 (S자 · 웅크리면 접히고 찌르면 쭉) + 가슴 늘어진 깃
  const n0 = [cx + 8, 36 + b], n1 = [cx + 14 - co * 6 + sk * 8, 26 + b + co * 4 - sk * 2], n2 = [cx + 8 - co * 4 + sk * 18, 16 + b + co * 8 + sk * 8];
  S.add(U(capF(n0, n1, 4.4, 3), capF(n1, n2, 3, 2.6)), HERW, { z: 2, h: 3 });
  for (let k = 0; k < 4; k++) S.add(capF(lerp(n0, n1, 0.2 + k * 0.2), [lerp(n0, n1, 0.2 + k * 0.2)[0] + 1, lerp(n0, n1, 0.2 + k * 0.2)[1] + 8 + k], 0.8, 0.4), HERW, { z: 2.2, h: 0.6 });
  S.add(capF(lerp(n0, n1, 0.1), lerp(n1, n2, 0.8), 0.5), mat(ramp(0x3a3e48)), { on: 1, lift: 0.3, h: 0.2 });
  // 머리 + 부리 + 머리깃
  const ha = sk > 0.3 ? 0.35 : 0.1 - co * 0.2, hd = n2;
  S.add(ellR(hd[0], hd[1], 3.6, 3), HERW, { z: 3, h: 2.6 });
  S.add(capF([hd[0] - 1, hd[1] - 2.4], [hd[0] + 2.6, hd[1] - 2], 1.4), mat(ramp(0x2a2e36)), { z: 3.2, h: 1 });
  for (const d of [0, 1.6]) S.add(capF([hd[0] - 2, hd[1] - 1.6], [hd[0] - 12, hd[1] + 2 + d], 0.6, 0.3), mat(ramp(0x2a2e36)), { z: 2.9, h: 0.4 });
  S.add(polyF([pol([hd[0] + 2, hd[1]], ha - 1.57, 1.4), pol([hd[0] + 2, hd[1]], ha, 15), pol([hd[0] + 2, hd[1]], ha + 1.57, 1.2)]), YEL, { z: 3.4, h: 1.2, prof: "sharp" });
  !p.hurt && S.decal(hd[0] + 1, hd[1] - 0.8, 0xe8d040).decal(hd[0] + 1.4, hd[1] - 0.8, 0x101010);
  lg(g.n, 0, 2);
  return fin(S.render({ rim: !0 }), p);
}
export const pxHeron = {
  fw: Math.round(92 * HRK), fh: Math.round(88 * HRK), w: 14, h: 34,
  anims: { idle: [4, 3], move: [6, 8], wind: [3, 9, !1], atk: [3, 18, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.3 };
    if (nm === "move") { const g = gait2(f, n, 5, 3); P = { legs: g, bob: g.bob, coil: 0.2 }; }
    if (nm === "wind") P = { coil: t, bob: 0.5 * t };
    if (nm === "atk") P = { strike: [0.7, 1, 0.9][f], bob: 1 };
    if (nm === "rec") P = { strike: 0.9 * (1 - t), coil: 0.3 * t };
    if (nm === "hurt") P = { hurt: f === 0, coil: 0.6 };
    return heronFrame(P);
  },
};

// ════ 갈대 인형 ════ 엮은 갈대로 만든 키 큰 형체 · 틈 사이로 새는 창백한 늪빛 · 뿔 달린 사슴 머리뼈 · 진흙과 이끼 덩이 ·
//   줄에 매단 뼈와 깃털 부적 · 갈대 손톱
//   p: legs · bob · sw(휘두르기 0~2) · wail · hurt
const EFK = 0.72;
function effigyFrame(p = {}) {
  const W = 96, H = 106, G = H - 1, S = sculpt(W, H, { k: EFK, ax: 40 });
  const b = (p.bob ?? 0) + 6, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, wl = p.wail ?? 0, cx = 38;
  const wick = (a, c, w0, w1, far, z) => { S.add(capF(a, c, w0, w1), far ? REEDF : REED, { z, h: w0 * 0.9 }); const n = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 3); for (let k = 1; k < n; k++) S.carve(capF(lerp(a, c, k / n), pol(lerp(a, c, k / n), Math.atan2(c[1] - a[1], c[0] - a[0]) + 1.2, w0), 0.3), 0.6); };
  // 다리
  for (const [o, far, d] of [[g.f, 1, -4], [g.n, 0, 4]]) { const hp = [cx + d * 0.6, 62 + b], ft = [cx + d + o[0], G - 1 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 2, L(hp[1], ft[1], 0.5)]; wick(hp, kn, 3, 2.6, far, far ? -2 : 3); wick(kn, ft, 2.6, 2, far, far ? -2 : 3); S.add(ellR(ft[0] + 2, ft[1] - 1, 4, 1.8), far ? MUDF : MUD, { z: far ? -1.9 : 3.1, h: 1.4 }); }
  // 먼 팔
  const shF = [cx - 6, 36 + b], hF = sw > 0 ? pol(shF, L(1.2, -0.2, Math.min(1, sw / 2)), 26) : [cx - 12, 62 + b];
  wick(shF, hF, 2.4, 1.8, 1, -3);
  for (const d of [-0.4, 0, 0.4]) S.add(capF(hF, pol(hF, Math.atan2(hF[1] - shF[1], hF[0] - shF[0]) + d, 6), 0.7, 0.2), REEDF, { z: -2.9, h: 0.5 });
  // 몸통 (엮은 바구니 · 속 늪빛) + 진흙 덩이
  const tor = U(ellR(cx, 46 + b, 11, 16), ellR(cx, 34 + b, 13, 8));
  S.add(tor, REED, { z: 1, h: 9 });
  for (let k = 0; k < 9; k++) S.carve(capF([cx - 12, 24 + k * 4.4 + b], [cx + 12, 28 + k * 4.4 + b], 0.4), 0.9).carve(capF([cx - 12, 30 + k * 4.4 + b], [cx + 12, 26 + k * 4.4 + b], 0.4), 0.9);
  for (const [x, y] of [[cx - 2, 40], [cx + 4, 48], [cx - 4, 52]]) S.add(ellR(x, y + b, 2.4, 1.4), GLW, { on: 1, lift: -0.4, h: 0.3 });
  S.add(ellR(cx + 5, 54 + b, 6, 5), MUD, { lift: 1, h: 3 });
  S.add(ellR(cx - 7, 32 + b, 5, 4), MOSS, { lift: 1.2, h: 2 });
  // 목 + 사슴 머리뼈 + 뿔
  const hx = cx + 4, hy = 20 + b;
  wick([cx + 1, 28 + b], [hx - 1, hy + 4], 2.4, 2, 0, 2);
  for (const [d, z] of [[-1, 2.5], [1, 6]]) {
    let q = [hx - 1 + d * 2, hy - 4];
    for (const [a, l] of [[-1.75 - d * 0.35, 9], [-1.5 - d * 0.6, 8], [-1.95 - d * 0.5, 7]]) { const n2 = pol(q, a, l); S.add(capF(q, n2, 1.4, 0.9), BONE, { z, h: 0.9 }); S.add(U(capF(lerp(q, n2, 0.5), pol(lerp(q, n2, 0.5), a + 0.8 * d, 5), 0.8, 0.4), capF(lerp(q, n2, 0.8), pol(lerp(q, n2, 0.8), a - 0.7 * d, 4), 0.7, 0.3)), BONE, { z, h: 0.6 }); q = n2; }
  }
  S.add(U(ellR(hx, hy, 6, 5.4), capF([hx + 3, hy + 1], [hx + 10, hy + 9], 3.6, 2)), BONE, { z: 4, h: 3.6 });
  S.add(ellR(hx + 2.6, hy - 0.4, 2.4, 2.4), DARK, { z: 4.2, lift: 0.1, h: 0.3 });
  S.add(polyF([[hx + 7, hy + 5], [hx + 9, hy + 7], [hx + 7.4, hy + 8]]), DARK, { z: 4.2, lift: 0.1, h: 0.3 });
  for (let k = 0; k < 3; k++) S.add(polyF([[hx + 4 + k * 1.8, hy + 6 + k * 1.4], [hx + 5.4 + k * 1.8, hy + 6.6 + k * 1.4], [hx + 4.2 + k * 1.8, hy + 8 + k * 1.4]]), mat(ramp(0xb8a880)), { z: 4.3, h: 0.3 });
  S.carve(capF([hx - 3, hy - 3], [hx + 1, hy - 4], 0.4), 0.6);
  !p.hurt && S.decal(hx + 2.8, hy - 0.2, wl ? 0xffffd0 : 0xd8f0a0);
  // 부적 줄 (뼈 · 깃털)
  const cord = [[cx - 10, 30 + b], [cx + 10, 32 + b]];
  S.add(capF(cord[0], cord[1], 0.4), LEATHc(), { lift: 2, h: 0.3 });
  for (const [t, kind] of [[0.2, 0], [0.5, 1], [0.8, 0]]) { const q = lerp(...cord, t); S.add(capF(q, [q[0], q[1] + 6], 0.3), LEATHc(), { lift: 2.2, h: 0.3 }); kind ? S.add(polyF([[q[0] - 1.4, q[1] + 6], [q[0] + 1.4, q[1] + 6], [q[0], q[1] + 13]]), mat(ramp(0x3a3a3a), { tex: "feather" }), { lift: 2.3, h: 0.4 }) : S.add(capF([q[0], q[1] + 6], [q[0], q[1] + 10], 1, 0.8), BONE, { lift: 2.3, h: 0.6 }); }
  // 가까운 팔
  const sh = [cx + 8, 34 + b], hN = sw <= 1 ? lerp([cx + 14, 60 + b], pol(sh, -2, 24), sw) : lerp(pol(sh, -2, 24), pol(sh, 0.5, 28), Math.min(1, sw - 1));
  wick(sh, hN, 2.6, 2, 0, 7);
  const ha = Math.atan2(hN[1] - sh[1], hN[0] - sh[0]);
  for (const d of [-0.45, 0, 0.45]) S.add(U(capF(hN, pol(hN, ha + d, 6), 0.8, 0.4), capF(pol(hN, ha + d, 6), pol(pol(hN, ha + d, 6), ha + d + 0.6, 3), 0.4, 0.2)), REED, { z: 7.1, h: 0.5 });
  const C = S.render({ rim: !0 });
  if (wl) { const P = toPx(W, H, EFK, 40); for (let k = 0; k < 10; k++) { const q = P(hx + 12 + k * 2, hy + 8 + Math.sin(k) * 3); C.px(q[0], q[1], 0xd8f0a0); } }
  return fin(C, p);
}
function LEATHc() { return LEATHM; }
const LEATHM = mat(ramp(0x5a4030), { tex: "leather", amp: 0.8 });
export const pxEffigy = {
  fw: Math.round(96 * EFK), fh: Math.round(106 * EFK), w: 16, h: 36,
  anims: { idle: [4, 4], move: [6, 7], wind: [3, 8, !1], atk: [4, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], wail: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5 };
    if (nm === "move") { const g = gait2(f, n, 5, 2); P = { legs: g, bob: g.bob + Math.sin(ph * 2) * 0.8 }; }
    if (nm === "wind") P = { sw: t };
    if (nm === "atk") P = { sw: [1.5, 2, 1.2, 2][f], bob: 1 };
    if (nm === "rec") P = { sw: 2 * (1 - t) };
    if (nm === "wail") P = { wail: f % 2 ? 1 : 0, bob: [0, -1, 0, -1][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return effigyFrame(P);
  },
};

// ════ 이탄 미라 ════ 늪에 잠겨 있던 시신이 일어났다 · 검게 무두질된 가죽 피부와 드러난 갈비 · 움푹한 얼굴과 누런 이 ·
//   목의 밧줄 올가미 · 너덜한 모직 망토 · 진흙이 뚝뚝
//   p: legs · bob · reach(팔 뻗기) · spit · hurt
const MMK = 0.72;
const HIDE = mat(ramp(0x5a3e2a), { tex: "leather", amp: 1.1, spec: 0.3 }), HIDEF = mat(rampF(0x46301e), { tex: "leather", amp: 1 }), WOOL = mat(ramp(0x6a6450), { tex: "cloth", amp: 1.1 }), WOOLF = mat(rampF(0x524c3c), { tex: "cloth", amp: 1 }), ROPE = mat(ramp(0x9a8a60), { tex: "wood", amp: 1 });
function mummyFrame(p = {}) {
  const W = 92, H = 88, G = H - 1, S = sculpt(W, H, { k: MMK, ax: 34 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, rc = p.reach ?? 0, cx = 32;
  // 다리 (가는 뼈다리 · 굽은 무릎)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) { const hp = [cx + d, 56 + b], ft = [cx + d + 2 + o[0], G - 1 - o[1]], kn = [cx + d + 5 + o[0] * 0.5, 70 + b]; S.add(U(capF(hp, kn, 3, 2.4), capF(kn, ft, 2.4, 2)), far ? HIDEF : HIDE, { z: far ? -2 : 3, h: 2.4 }); S.add(ellR(kn[0], kn[1], 2.4, 2.2), far ? HIDEF : HIDE, { z: far ? -1.9 : 3.1, h: 1.6 }); S.add(ellR(ft[0] + 2, ft[1] - 1, 4, 1.8), far ? HIDEF : HIDE, { z: far ? -1.8 : 3.2, h: 1.4 }); }
  // 망토 (뒤로 늘어진 너덜한 자락)
  S.add(polyF([[cx - 8, 30 + b], [cx + 2, 30 + b], [cx - 4, 66 + b], [cx - 10, 62 + b], [cx - 14, 70 + b], [cx - 18, 60 + b]]), WOOLF, { z: -1, h: 5 });
  for (const dx of [-12, -8]) S.carve(capF([cx + dx + 4, 36 + b], [cx + dx, 64 + b], 0.5), 0.8);
  // 먼 팔 (앞으로 뻗음)
  const shF = [cx - 2, 34 + b], hF = pol(shF, L(1.2, 0.05, rc), 22);
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 2.6, 2.2), capF(lerp(shF, hF, 0.5), hF, 2.2, 1.6)), HIDEF, { z: -2, h: 2 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(hF, pol(hF, L(1.2, 0.05, rc) + d, 4.4), 0.6, 0.3), HIDEF, { z: -1.9, h: 0.4 });
  // 굽은 몸통 + 갈비 + 진흙
  S.add(U(ellR(cx + 2, 40 + b, 10, 11, 0.35), ellR(cx, 52 + b, 7, 7)), HIDE, { z: 1, h: 7 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 2, 36 + k * 3.4 + b], [cx + 9, 38 + k * 3.4 + b], 0.45), 0.9);
  S.carve(capF([cx - 3, 50 + b], [cx + 3, 56 + b], 0.6), 0.7);
  for (const [x, y, r] of [[cx - 4, 46, 3], [cx + 6, 54, 2.4], [cx + 2, 32, 2]]) S.add(ellR(x, y + b, r, r * 0.7), PEAT, { lift: 0.8, h: 1.4 });
  S.add(polyF([[cx - 6, 52 + b], [cx + 8, 52 + b], [cx + 9, 60 + b], [cx + 3, 58 + b], [cx - 1, 62 + b], [cx - 7, 58 + b]]), WOOL, { z: 1.5, h: 3 });
  // 머리 (앞으로 숙임) + 밧줄 올가미
  const hx = cx + 12, hy = 26 + b;
  S.add(capF([cx + 6, 32 + b], [hx - 2, hy + 3], 3.4, 2.6), HIDE, { z: 2, h: 2.6 });
  S.add(U(capF([cx + 4, 31 + b], [cx + 10, 30 + b], 1.6)), ROPE, { z: 3, h: 1.4 });
  S.add(U(capF([cx + 4, 31 + b], [cx - 4, 22 + b], 1, 0.8), capF([cx - 4, 22 + b], [cx - 8, 26 + b], 0.8)), ROPE, { z: 0.5, h: 0.8 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx + 5 + k * 1.8, 29.6 + b], [cx + 5.8 + k * 1.8, 32.4 + b], 0.25), 0.6);
  S.add(ellR(hx, hy, 6, 6.4), HIDE, { z: 4, h: 5 });
  S.add(ellR(hx - 2, hy - 4, 5, 3), mat(ramp(0x3a2a22), { tex: "fur", amp: 1.2, dir: 1.6 }), { z: 4.2, h: 2 });
  S.add(ellR(hx + 3, hy - 0.4, 2, 1.8), DARK, { on: 1, lift: 0.1, h: 0.2 });
  S.add(capF([hx + 4, hy + 0.4], [hx + 7, hy + 1.6], 1.2, 0.8), HIDE, { z: 4.4, h: 1 });
  S.add(polyF([[hx + 2, hy + 3], [hx + 7, hy + 3.4 + rc], [hx + 6, hy + 5.6 + rc * 2], [hx + 2, hy + 5]]), DARK, { z: 4.3, h: 0.3 });
  for (let k = 0; k < 3; k++) S.add(polyF([[hx + 2.6 + k * 1.4, hy + 3.2], [hx + 3.6 + k * 1.4, hy + 3.2], [hx + 3.1 + k * 1.4, hy + 4.6]]), mat(ramp(0xb8a070)), { z: 4.5, h: 0.3 });
  !p.hurt && S.decal(hx + 3.2, hy - 0.4, 0xd8f0a0);
  // 가까운 팔
  const sh = [cx + 6, 34 + b], hN = pol(sh, L(1.1, 0.1, rc), 24);
  S.add(U(capF(sh, lerp(sh, hN, 0.5), 2.8, 2.4), capF(lerp(sh, hN, 0.5), hN, 2.4, 1.8)), HIDE, { z: 6, h: 2.2 });
  S.add(ellR(sh[0], sh[1], 3.4, 3), WOOL, { z: 6.1, h: 2 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(hN, pol(hN, L(1.1, 0.1, rc) + d, 5), 0.6, 0.3), HIDE, { z: 6.2, h: 0.4 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, MMK, 34);
  for (let k = 0; k < 4; k++) { const q = P(cx - 4 + k * 5, 60 + b + ((k * 7 + (p.ph ?? 0) * 4) % 20)); C.px(q[0], q[1], 0x3a2e24); }
  if (p.spit) for (let k = 0; k < 6; k++) { const q = P(hx + 8 + k * 2, hy + 5 + k * 0.6); C.px(q[0], q[1], k % 2 ? 0x5a4a34 : 0x3a2e24); }
  return fin(C, p);
}
export const pxMummy = {
  fw: Math.round(92 * MMK), fh: Math.round(88 * MMK), w: 14, h: 30,
  anims: { idle: [4, 4], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], spit: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5, reach: 0.2, ph };
    if (nm === "move") { const g = gait2(f, n, 4, 1.5); P = { legs: g, bob: g.bob + 1, reach: 0.5, ph }; }
    if (nm === "wind") P = { reach: 0.3 + 0.7 * t, bob: 1, ph };
    if (nm === "atk") P = { reach: 1, bob: [1.5, 2, 2][f], ph };
    if (nm === "rec") P = { reach: 1 - t * 0.8, ph };
    if (nm === "spit") P = { spit: f >= 1 && f <= 2, reach: 0.3, bob: [0, 1, 1, 0][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1.5, ph };
    return mummyFrame(P);
  },
};

// ════ [정예] 늪 하마 ════ 진흙이 말라붙은 회갈색 거구 · 등에 자란 갈대와 풀, 쪼아먹는 작은 새 · 머리 위 작은 눈과 귀 ·
//   크게 벌어지는 입과 엄니 · 짧고 굵은 다리
//   p: legs · bob · gape · lunge · hurt
const HPK = 0.72;
const HIP = mat(ramp(0x7a6a62), { tex: "skin", amp: 0.9, spec: 0.3 }), HIPF = mat(rampF(0x62544e), { tex: "skin", amp: 0.8 }), HIPP = mat(ramp(0xc88a80), { tex: "skin", amp: 0.6 });
function hippoFrame(p = {}) {
  const W = 168, H = 100, G = H - 1, S = sculpt(W, H, { k: HPK, ax: 74 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, gp = p.gape ?? 0, lu = p.lunge ?? 0, cx = 68;
  const lgf = (sh, o, far) => { const ft = [sh[0] + o[0], G - 1 - o[1]]; S.add(U(capF(sh, ft, 9, 8)), far ? HIPF : HIP, { z: far ? -3 : 6, h: 6 }); S.add(ellR(ft[0] + 2, ft[1] - 2, 9, 3), far ? HIPF : HIP, { z: far ? -2.9 : 6.1, h: 2 }); for (const d of [-4, 0, 4]) S.add(ellR(ft[0] + 4 + d, ft[1] - 1, 1.6, 1.2), mat(ramp(0x4a4038)), { z: far ? -2.8 : 6.2, h: 0.6 }); };
  lgf([cx + 22, 72 + b], lg.ff, 1), lgf([cx - 34, 72 + b], lg.bf, 1);
  // 몸통 (통 · 엉덩이) + 꼬리
  S.add(capF([cx - 56, 60 + b], [cx - 62, 66 + b], 2, 1.2), HIP, { z: 0, h: 1.4 });
  S.add(U(ellR(cx - 6, 60 + b, 52, 26), ellR(cx - 40, 58 + b, 20, 24)), HIP, { z: 1, h: 20 });
  S.add(ellR(cx - 6, 80 + b, 46, 5), HIPF, { on: 1, h: 0.6 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 44 + k * 14, 42 + b], [cx - 46 + k * 14, 70 + b], 0.6), 0.6);
  // 등의 말라붙은 진흙 + 갈대 + 작은 새
  S.add(U(ellR(cx - 14, 38 + b, 34, 8), ellR(cx + 10, 40 + b, 14, 6)), MUD, { lift: 1.4, h: 4 });
  for (const [x, y] of [[cx - 30, 40], [cx - 10, 36], [cx + 8, 37], [cx - 22, 42]]) S.carve(capF([x, y + b], [x + 6, y + 2 + b], 0.5), 0.8);
  for (let k = 0; k < 8; k++) { const x = cx - 36 + k * 6, h = 8 + ((k * 5) % 7); S.add(capF([x, 37 + b], [x + Math.sin(k) * 3, 37 + b - h], 0.7, 0.4), k % 3 ? MOSS : REED, { lift: 2, h: 0.6 }); }
  const bd = [cx + 4, 30 + b];
  S.add(ellR(bd[0], bd[1], 3.4, 2.4), mat(ramp(0x6a5a44), { tex: "feather" }), { lift: 3, h: 2 });
  S.add(ellR(bd[0] + 3, bd[1] - 1.6, 1.8, 1.6), mat(ramp(0x6a5a44), { tex: "feather" }), { lift: 3.2, h: 1.4 });
  S.add(polyF([[bd[0] + 4.4, bd[1] - 2], [bd[0] + 7, bd[1] - 1], [bd[0] + 4.4, bd[1] - 0.6]]), mat(ramp(0xd8a040)), { lift: 3.3, h: 0.4 });
  // 머리 (거대한 주둥이 · 위턱이 들린다)
  const hx = cx + 46 + lu * 8, hy = 54 + b;
  S.add(ellR(hx - 6, hy - 4, 16, 16), HIP, { z: 2, h: 12 });
  const ja = -gp * 0.9, J = (x, y) => { const c = Math.cos(ja), s = Math.sin(ja), dx = x - (hx - 2), dy = y - (hy - 2); return [hx - 2 + dx * c - dy * s, hy - 2 + dx * s + dy * c]; };
  if (gp > 0.15) {
    S.add(polyF([J(hx - 2, hy), [hx - 2, hy + 4], [hx + 26, hy + 6], J(hx + 26, hy + 2)]), HIPP, { z: 2.5, h: 1 });
    for (const x of [hx + 6, hx + 20]) S.add(polyF([[x - 1.4, hy + 6], [x + 1.4, hy + 6], [x, hy - 4 * gp]]), BONE, { z: 3.6, h: 1.2, prof: "sharp" });
    for (const x of [hx + 10, hx + 22]) S.add(polyF([J(x - 1.2, hy + 1), J(x + 1.2, hy + 1), J(x, hy + 6)]), BONE, { z: 3.6, h: 1 });
  }
  S.add(U(capF([hx - 4, hy + 6], [hx + 24, hy + 8], 9, 7)), HIPF, { z: 3, h: 7 });
  S.add(U(ellR(...J(hx + 4, hy - 4), 14, 10), capF(J(hx + 6, hy - 4), J(hx + 26, hy - 2), 10, 9)), HIP, { z: 3.4, h: 9 });
  S.add(ellR(...J(hx + 28, hy - 6), 3, 2), mat(ramp(0x3a2e2a)), { z: 3.6, lift: 0.5, h: 0.8 });
  S.add(ellR(...J(hx - 2, hy - 18), 4, 3.4), HIP, { z: 3.8, h: 3 });
  S.add(polyF([J(hx - 12, hy - 16), J(hx - 10, hy - 24), J(hx - 7, hy - 17)]), HIP, { z: 3.7, h: 1.6 });
  for (let k = 0; k < 4; k++) S.add(ellR(...J(hx + 16 + k * 3, hy + 2), 0.8, 0.8), mat(ramp(0x4a3a34)), { on: 1, lift: 0.2, h: 0.2 });
  !p.hurt && S.decal(...J(hx, hy - 19), 0x120c0a).decal(...J(hx + 0.6, hy - 19.6), 0xe8c060);
  lgf([cx + 24, 74 + b], lg.fn, 0), lgf([cx - 32, 74 + b], lg.bn, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxHippo = {
  fw: Math.round(168 * HPK), fh: Math.round(100 * HPK), w: 60, h: 40,
  anims: { idle: [4, 3], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], charge: [4, 12] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8 };
    if (nm === "move") P = { legs: gait4(f, n, 6, 2.4), bob: Math.cos(ph * 2) * 1.2 };
    if (nm === "charge") P = { legs: gait4(f, n, 10, 4), bob: Math.cos(ph * 2) * 2, lunge: 0.6, gape: 0.3 };
    if (nm === "wind") P = { gape: t * 1.1, lunge: -0.4 * t };
    if (nm === "atk") P = { gape: [1.1, 0.2, 0][f], lunge: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { lunge: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, gape: 0.6, lunge: -0.4 };
    return hippoFrame(P);
  },
};

// ════ 흡혈 모기 ════ 털 난 갈색 가슴 · 흰 띠 가는 배(피를 빨면 붉게 부푼다) · 긴 주둥이 바늘 · 늘어진 긴 다리 여섯 · 좁은 날개
//   p: flap · tilt · fed(0~1) · stab · hurt
const MQK = 0.72;
const MQ = mat(ramp(0x4a3a30), { tex: "fur", amp: 0.8 }), MQF = mat(rampF(0x3a2e26), { tex: "fur", amp: 0.7 }), MQW = mat(ramp(0xb0b0a0, { hi: 0.5 }), { tex: "glass", amp: 0.5, spec: 0.6 });
function mosquitoFrame(p = {}) {
  const W = 76, H = 64, S = sculpt(W, H, { k: MQK, ax: 36 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, fd = p.fed ?? 0, sb = p.stab ?? 0, cx = 36, cy = 24;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => { const root = R(cx - 1, cy - 3), a = -Math.PI / 2 - 1.2 + (1 - fl) * 0.6 + (back ? 0.2 : 0), c = pol(root, a, 10); S.add(ellR(c[0], c[1], 10, 2.4, a), back ? mat(rampF(0x8a8a7c), { tex: "glass" }) : MQW, { z: back ? -4 : 7, h: 0.6, prof: "flat" }); S.add(capF(root, pol(root, a, 18), 0.3), MQF, { z: back ? -3.9 : 7.1, h: 0.2 }); };
  wing(1);
  // 다리 여섯 (길게 늘어짐 · 흰 마디)
  for (let k = 0; k < 6; k++) { const far = k < 3, r0 = R(cx - 1 + (k % 3) * 2.6, cy + 3), kn = R(cx - 8 + (k % 3) * 9 + (far ? -2 : 0), cy + 10 + Math.sin(fl + k) * 1.4), ft = R(cx - 14 + (k % 3) * 14 + (far ? -2 : 0), cy + 30 + (k % 2) * 3); S.add(U(capF(r0, kn, 0.6), capF(kn, ft, 0.5, 0.3)), far ? MQF : MQ, { z: far ? -2 : 5, h: 0.4 }); S.add(ellR(kn[0], kn[1], 0.7, 0.7), BONE, { z: far ? -1.9 : 5.1, h: 0.3 }); }
  // 배 (가늘고 길게 · 피를 빨면 붉게 부풂)
  const A0 = R(cx - 6, cy + 1), Ac = R(cx - 16, cy + 5), ar = 4 + fd * 4;
  S.add(U(capF(A0, Ac, 2.4, ar), capF(Ac, R(cx - 26, cy + 8), ar, 1.4)), fd > 0.4 ? mat(ramp(0x7a3a34), { tex: "skin", spec: 0.5 }) : MQ, { z: 1, h: 3 + fd * 2 });
  for (let k = 0; k < 4; k++) { const q = lerp(A0, R(cx - 26, cy + 8), 0.2 + k * 0.2); S.add(capF(pol(q, 1.2, -ar), pol(q, 1.2, ar), 0.5), mat(ramp(0xd8d0c0)), { on: 1, lift: 0.3, h: 0.3 }); }
  if (fd > 0.4) S.add(ellR(...R(cx - 16, cy + 4), ar * 0.6, ar * 0.5), BLOOD, { on: 1, lift: 0.4, h: 0.4 });
  // 가슴 + 머리 + 주둥이 바늘
  S.add(ellR(...R(cx, cy), 6, 5.4), MQ, { z: 2, h: 4.6 });
  for (const d of [-2, 1]) S.add(capF(R(cx + d, cy - 4), R(cx + d - 2, cy + 3), 0.6), mat(ramp(0x8a7a60), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  const hd = R(cx + 7, cy + 1);
  S.add(ellR(hd[0], hd[1], 3, 2.8), MQ, { z: 3, h: 2.6 });
  S.add(ellR(hd[0] + 0.6, hd[1] - 0.4, 2.2, 2.2), mat(ramp(0x3a2a2a), { tex: "scale", spec: 0.7 }), { z: 3.2, h: 1.6 });
  const pa = 0.5 + sb * 0.4;
  S.add(capF(pol(hd, pa, 2), pol(hd, pa, 14 + sb * 4), 0.6, 0.25), MQF, { z: 3.3, h: 0.4 });
  for (const d of [-0.5, 0.5]) S.add(capF(pol(hd, -0.6 + d * 0.3, 2), pol(hd, -0.6 + d * 0.6, 9), 0.35), MQF, { z: 3.1, h: 0.3 });
  !p.hurt && S.decal(hd[0] + 1, hd[1] - 1, 0xd8f0a0);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxMosquito = {
  fw: Math.round(76 * MQK), fh: Math.round(64 * MQK), w: 18, h: 14, flying: !0,
  anims: { idle: [4, 18], move: [4, 20], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], fed: [4, 18] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, -0.6, 0.6, -1][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.2 };
    if (nm === "wind") P = { flap: fl, tilt: -0.3 * t };
    if (nm === "atk") P = { flap: fl, tilt: 0.6, stab: 1 };
    if (nm === "rec") P = { flap: fl, stab: 1 - t, fed: 0.5 * t };
    if (nm === "fed") P = { flap: fl, fed: 1 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.4, tilt: -0.4 };
    return mosquitoFrame(P);
  },
};

// ════ 안개 아귀 ════ 안개 속을 헤엄치는 검푸른 아귀 · 얼룩진 울퉁불퉁 가죽 · 바늘 이빨 가득한 큰 턱 · 이마의 낚싯대 끝 누런 등불 ·
//   작은 지느러미로 노를 젓는다
//   p: ph · jaw · lure · lunge · hurt
const ANK = 0.72;
const ANG = mat(ramp(0x3e4a4a), { tex: "skin", amp: 1.1, spec: 0.4 }), ANGF = mat(rampF(0x2e3838), { tex: "skin", amp: 1 }), ANGB = mat(ramp(0x6a7468), { tex: "skin", amp: 0.8 });
function anglerFrame(p = {}) {
  const W = 84, H = 62, S = sculpt(W, H, { k: ANK, ax: 40 });
  const ph = p.ph ?? 0, jw = p.jaw ?? 0, lr = p.lure ?? 0, lu = p.lunge ?? 0, cx = 38 + lu * 4, cy = 34;
  // 꼬리 · 등지느러미
  S.add(polyF([[cx - 16, cy - 2], [cx - 30, cy - 10 + Math.sin(ph) * 3], [cx - 27, cy + Math.sin(ph) * 2], [cx - 30, cy + 9 + Math.sin(ph) * 3], [cx - 16, cy + 4]]), ANGF, { z: 0, h: 1.4, prof: "flat" });
  for (let k = 0; k < 3; k++) S.add(capF([cx - 10 + k * 5, cy - 12], [cx - 14 + k * 5, cy - 17 + Math.sin(ph + k) * 1.5], 0.6, 0.3), ANGF, { z: 0.5, h: 0.4 });
  // 몸 (둥근 머리가 큰 몸)
  S.add(U(ellR(cx + 2, cy, 18, 14), ellR(cx - 10, cy + 1, 10, 8)), ANG, { z: 1, h: 12 });
  S.add(ellR(cx + 2, cy + 8, 15, 5), ANGB, { on: 1, h: 0.6 });
  for (const [x, y, r] of [[cx - 6, cy - 6, 2], [cx + 4, cy - 9, 1.6], [cx - 2, cy + 2, 1.8], [cx + 10, cy - 4, 1.4], [cx - 12, cy - 2, 1.4]]) S.add(ellR(x, y, r, r * 0.8), mat(ramp(0x5a6a5e), { tex: "skin" }), { lift: 0.6, h: 0.8 });
  // 가슴지느러미 (노 젓기)
  S.add(polyF([[cx - 2, cy + 4], [cx - 10 + Math.sin(ph * 2) * 3, cy + 14], [cx - 4 + Math.sin(ph * 2) * 3, cy + 16], [cx + 2, cy + 8]]), ANGF, { z: 4, h: 0.8, prof: "flat" });
  // 턱 (아래턱이 크게 · 바늘 이빨)
  const jy = cy + 4 + jw * 8;
  S.add(polyF([[cx + 6, cy + 2], [cx + 22, cy - 2], [cx + 24, cy + 2 + jw * 4], [cx + 18, jy + 4], [cx + 6, cy + 10]]), mat(ramp(0x1a1418)), { z: 4.4, h: 1 });
  S.add(U(capF([cx + 4, cy + 10 + jw * 2], [cx + 24, jy + 2], 3.4, 2.6)), ANG, { z: 4.6, h: 3 });
  for (let k = 0; k < 6; k++) { const x = cx + 8 + k * 2.6; S.add(polyF([[x - 0.6, cy + 1 - k * 0.5], [x + 0.6, cy + 1 - k * 0.5], [x, cy + 5 - k * 0.3]]), BONE, { z: 4.7, h: 0.4 }); S.add(polyF([[x - 0.6, jy + (k / 5) * 0 - 1 + (6 - k) * 0.5], [x + 0.6, jy - 1 + (6 - k) * 0.5], [x, jy - 5 + (6 - k) * 0.5]]), BONE, { z: 4.8, h: 0.4 }); }
  !p.hurt && S.decal(cx + 10, cy - 6, 0xd8f0a0).decal(cx + 10.6, cy - 6, 0x101010);
  // 낚싯대 + 등불
  const r0 = [cx + 8, cy - 12], r1 = [cx + 16, cy - 24 - lr * 2], r2 = [cx + 26 + lr * 2, cy - 18 + Math.sin(ph) * 2];
  S.add(U(capF(r0, r1, 0.9, 0.7), capF(r1, r2, 0.7, 0.5)), ANGF, { z: 2, h: 0.6 });
  S.add(ellR(r2[0], r2[1] + 2, 2.6 + lr * 1.4, 3 + lr * 1.4), GLWY, { z: 2.2, h: 1.6 });
  const C = S.render({ rim: !0 });
  if (lr > 0.4) { const P = toPx(W, H, ANK, 40); for (let k = 0; k < 10; k++) { const q = P(...pol([r2[0], r2[1] + 2], k * 0.63, 6 + lr * 2)); C.px(q[0], q[1], 0xf0e890); } }
  return fin(C, p);
}
export const pxAngler = {
  fw: Math.round(84 * ANK), fh: Math.round(62 * ANK), w: 24, h: 20, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], lure: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, jaw: 0.15 };
    if (nm === "wind") P = { ph, jaw: t * 1.1, lunge: -0.4 * t };
    if (nm === "atk") P = { ph, jaw: [1.2, 0.1, 0][f], lunge: [1, 1.4, 1][f] };
    if (nm === "rec") P = { ph, lunge: 1 - t };
    if (nm === "lure") P = { ph: ph * 2, lure: [0.5, 1, 1, 0.5][f], jaw: 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, ph, jaw: 0.8 };
    return anglerFrame(P);
  },
};

// ════ 늪 검은고니 ════ 윤기 나는 검은 깃 · 흰 띠 두른 붉은 부리 · 성나서 아치처럼 치켜세운 날개깃 · 긴 S자 목
//   p: flap · tilt · neck · hiss · hurt
const SWK = 0.72;
const SWN = mat(ramp(0x2e2c30), { tex: "feather", amp: 1, dir: 0.4, spec: 0.5 }), SWNF = mat(rampF(0x222024), { tex: "feather", amp: 0.9, dir: 0.4 });
function swanFrame(p = {}) {
  const W = 84, H = 70, S = sculpt(W, H, { k: SWK, ax: 40 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, nk = p.neck ?? 0, cx = 36, cy = 40;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 - (back ? 3 : 0), cy - 4), a = -Math.PI / 2 - 0.6 + (1 - up) * 1.0;
    S.add(ellR(...pol(root, a + 0.15, 10), 13, 6, a), back ? SWNF : SWN, { z: back ? -5 : 7, h: 2.6 });
    for (let k = 0; k < 7; k++) { const ak = a - 0.11 * k - 0.05, tip = pol(root, ak, 32 - k * 2.4); S.add(capF(pol(root, ak, 13), tip, 2.6, 0.8), back ? SWNF : SWN, { z: back ? -4.9 : 7.1 + k * 0.01, h: 1 }); }
    // 성난 곱슬 깃 (등 위로)
    !back && [0, 1, 2].forEach((k) => S.add(polyF([pol(root, a + 0.5, 4 + k * 3), pol(pol(root, a + 0.5, 6 + k * 3), a + 1.9, 4), pol(root, a + 0.5, 7 + k * 3)]), SWN, { z: 7.3, h: 0.8 }));
  };
  wing(1);
  S.add(polyF([R(cx - 12, cy), R(cx - 22, cy - 5), R(cx - 20, cy + 3)]), SWNF, { z: 0, h: 1.4 });
  S.add(ellR(...R(cx, cy + 1), 15, 8), SWN, { z: 1, h: 7 });
  for (let k = 0; k < 5; k++) S.carve(minus(ellR(...R(cx - 8 + k * 4, cy + 2), 2.4, 1.8), ellR(...R(cx - 8 + k * 4, cy + 0.6), 2.4, 1.8)), 0.5);
  // 목 (S자 · 앞으로 뻗으면 쉿)
  const n0 = R(cx + 10, cy - 3), n1 = R(cx + 18 + nk * 4, cy - 16 + nk * 8), n2 = R(cx + 14 + nk * 16, cy - 28 + nk * 18);
  S.add(U(capF(n0, n1, 4, 2.8), capF(n1, n2, 2.8, 2.4)), SWN, { z: 3, h: 2.6 });
  const hd = n2, ba = nk > 0.4 ? 0.4 : 0.15;
  S.add(ellR(hd[0], hd[1], 3.4, 3), SWN, { z: 4, h: 2.6 });
  S.add(polyF([pol([hd[0] + 2, hd[1]], ba - 1.4, 1.6), pol([hd[0] + 2, hd[1]], ba, 9), pol([hd[0] + 2, hd[1]], ba + 1.4, 1.4)]), mat(ramp(0xb02a2a), { spec: 0.5 }), { z: 4.2, h: 1.2 });
  S.add(capF(pol([hd[0] + 2, hd[1]], ba, 5), pol(pol([hd[0] + 2, hd[1]], ba, 5), ba + 1.57, 1.4), 0.5), mat(ramp(0xe8e4dc)), { z: 4.3, h: 0.3 });
  p.hiss && S.add(polyF([pol([hd[0] + 2, hd[1]], ba + 0.4, 3), pol([hd[0] + 2, hd[1]], ba + 0.25, 9), pol([hd[0] + 2, hd[1]], ba + 0.6, 7)]), mat(ramp(0x5a1a1a)), { z: 4.1, h: 0.3 });
  !p.hurt && S.decal(hd[0] + 0.6, hd[1] - 1, 0xd83030);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxSwan = {
  fw: Math.round(84 * SWK), fh: Math.round(70 * SWK), w: 22, h: 16, flying: !0,
  anims: { idle: [4, 7], move: [4, 9], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], hiss: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, neck: -0.3 * t };
    if (nm === "atk") P = { flap: -0.7, tilt: 0.5, neck: 1 };
    if (nm === "rec") P = { flap: fl, neck: 1 - t };
    if (nm === "hiss") P = { flap: [1, 1, 0.6, 1][f], neck: 0.6, hiss: 1 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return swanFrame(P);
  },
};

// ════ [정예] 늪 히드라 ════ 진흙 둔덕에 반쯤 잠긴 몸통에서 뻗은 목 셋 · 검푸른 비늘과 누런 배 · 머리마다 지느러미 볏 · 독이 흐르는 이빨
//   p: ph · a(머리 0 · 1 · 2 공격 0~1 배열) · jaw · hurt
const HYK = 0.7;
const HYD = mat(ramp(0x3a5040), { tex: "scale", amp: 1.1, spec: 0.4 }), HYDF = mat(rampF(0x2c3e32), { tex: "scale", amp: 1 }), HYDB = mat(ramp(0xb0a070), { tex: "scale", amp: 0.6 }), FRL = mat(ramp(0x7a4a5a), { tex: "skin", amp: 0.6 });
function hydraFrame(p = {}) {
  const W = 170, H = 124, G = H - 1, S = sculpt(W, H, { k: HYK, ax: 72 });
  const ph = p.ph ?? 0, at = p.a ?? [0, 0, 0], jw = p.jaw ?? [0.2, 0.2, 0.2], cx = 66;
  // 머리 하나 그리기 (목 뿌리 r · 기본 머리 위치 h · 공격 정도 a)
  const head = (k, r, h0, a, far) => {
    const hp = [h0[0] + a * 34, h0[1] + a * 20 + Math.sin(ph + k * 2) * 3], m1 = [r[0] + (hp[0] - r[0]) * 0.25 - 8, r[1] - (r[1] - hp[1]) * 0.45], m2 = [hp[0] - 12 + a * 6, hp[1] + 4 - a * 2];
    const M0 = far ? HYDF : HYD, z = far ? -2 + k * 0.1 : 4 + k * 0.4;
    S.add(U(capF(r, m1, 9, 7.4), capF(m1, m2, 7.4, 6), capF(m2, hp, 6, 5.4)), M0, { z, h: 6 });
    S.add(U(capF(lerp(r, m1, 0.3), m1, 3.6, 3), capF(m1, m2, 3, 2.6)), HYDB, { z: z + 0.05, lift: 0.3, h: 0.6 });
    for (let q = 0; q < 5; q++) { const c = lerp(r, m2, q / 5); S.add(polyF([pol(c, -2.3, 6), pol(c, -2.1, 10), pol(c, -1.7, 6.4)]), FRL, { z: z - 0.1, h: 0.8, prof: "flat" }); }
    const na = a * 0.5 + 0.08, jj = jw[k] ?? 0.2;
    S.add(U(ellR(hp[0], hp[1], 7.6, 6.4), capF(hp, pol(hp, na, 15), 5.4, 3.2)), M0, { z: z + 0.1, h: 5 });
    S.add(capF(pol(hp, na + 1.2, 3.4), pol(pol(hp, na + 1.2, 3.4), na + jj * 0.9, 13), 3, 1.6), far ? HYDF : HYDB, { z: z + 0.08, h: 2.4 });
    if (jj > 0.3) S.add(polyF([pol(hp, na + 0.5, 3), pol(hp, na + 0.1, 16), pol(pol(hp, na + 1.2, 3.4), na + jj * 0.9, 13)]), mat(ramp(0x6a2a3a)), { z: z + 0.07, h: 0.4 });
    for (let q = 0; q < 4; q++) { const t0 = pol(pol(hp, na + 0.3, 1), na, 5 + q * 3); S.add(polyF([pol(t0, na, -0.7), pol(t0, na, 0.7), pol(t0, na + 1.57, 2.2)]), BONE, { z: z + 0.12, h: 0.4 }); }
    for (let q = 0; q < 4; q++) S.add(polyF([pol(hp, na + 2.4 + q * 0.28, 5), pol(hp, na + 2.6 + q * 0.28, 14 - q * 1.6), pol(hp, na + 2.8 + q * 0.28, 5)]), FRL, { z: z - 0.05, h: 0.8, prof: "flat" });
    S.add(capF(pol(hp, na - 1.3, 4), pol(hp, na - 0.3, 7), 1.2), M0, { z: z + 0.15, h: 1.2 });
    !p.hurt && S.decal(...pol(hp, na - 0.75, 4.4), 0xe8d040).decal(...pol(hp, na - 0.7, 4.6), 0x101010);
  };
  head(0, [cx - 12, 80], [cx - 18, 26], at[0], 1);
  // 진흙 둔덕 + 몸통 (반쯤 잠김)
  S.add(U(ellR(cx - 4, G - 8, 60, 12), ellR(cx - 30, G - 4, 26, 6)), MUD, { z: 1, h: 6 });
  for (let k = 0; k < 7; k++) S.carve(capF([cx - 56 + k * 16, G - 12], [cx - 50 + k * 16, G - 6], 0.6), 0.8);
  S.add(ellR(cx - 4, G - 20, 34, 16), HYD, { z: 2, h: 13 });
  for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) S.add(polyF([[cx - 30 + k * 9 + r * 4, G - 32 + r * 6], [cx - 27 + k * 9 + r * 4, G - 38 + r * 6], [cx - 24 + k * 9 + r * 4, G - 32 + r * 6]]), HYDF, { lift: 0.6, h: 1, prof: "sharp" });
  S.add(U(capF([cx - 40, G - 16], [cx - 64, G - 10], 6, 3)), HYD, { z: 1.5, h: 4 });
  for (const [x, y] of [[cx - 50, G - 12], [cx + 30, G - 10], [cx + 20, G - 6]]) S.add(capF([x, y], [x + 2, y - 12], 0.6, 0.4), REED, { z: 2.5, h: 0.6 });
  head(1, [cx + 2, 82], [cx + 18, 20], at[1], 0);
  head(2, [cx + 12, 88], [cx + 38, 46], at[2], 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxHydra = {
  fw: Math.round(170 * HYK), fh: Math.round(124 * HYK), w: 60, h: 44,
  anims: { idle: [6, 5], move: [6, 6], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], bite1: [3, 14, !1], bite2: [3, 14, !1], spit: [4, 10, !1], triple: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, a: [0, 0, 0], jaw: [0.2, 0.3, 0.2] };
    if (nm === "wind") P = { ph, a: [-0.3 * t, -0.3 * t, -0.3 * t], jaw: [0.6 * t, 0.6 * t, 0.6 * t] };
    if (nm === "atk") P = { ph, a: [0, 0, [0.8, 1, 0.8][f]], jaw: [0.3, 0.3, [1, 0.2, 0][f]] };
    if (nm === "bite1") P = { ph, a: [0, [0.8, 1, 0.8][f], 0], jaw: [0.3, [1, 0.2, 0][f], 0.3] };
    if (nm === "bite2") P = { ph, a: [[0.6, 0.9, 0.6][f], 0, 0], jaw: [[1, 0.2, 0][f], 0.3, 0.3] };
    if (nm === "spit") P = { ph, a: [0, [-0.3, 0.3, 0.4, 0.1][f], 0], jaw: [0.3, [0.4, 1.2, 1.2, 0.5][f], 0.3] };
    if (nm === "triple") P = { ph, a: [[0, 0.9, 0.3, 0][f], [0.9, 0.3, 0, 0][f], [0.3, 0, 0.9, 0][f]], jaw: [1, 1, 1] };
    if (nm === "rec") P = { ph, a: [0, 0, 0], jaw: [0.2, 0.2, 0.2] };
    if (nm === "hurt") P = { hurt: f === 0, ph, a: [-0.3, -0.3, -0.3], jaw: [1, 1, 1] };
    return hydraFrame(P);
  },
};

// ════ 안개 소금쟁이 ════ 안개 위를 미끄러지는 거대 소금쟁이 · 가늘고 검은 몸 · 사방으로 뻗은 긴 다리 넷과 짧은 앞다리 · 찌르는 주둥이 ·
//   발끝마다 안개 물결
//   p: ph · lean · stab · hurt
const STK = 0.72;
const STR = mat(ramp(0x3a3830), { tex: "metal", amp: 0.6, spec: 0.5 }), STRF = mat(rampF(0x2a2822), { tex: "metal", amp: 0.5 });
function striderFrame(p = {}) {
  const W = 108, H = 50, S = sculpt(W, H, { k: STK, ax: 52 });
  const ph = p.ph ?? 0, ln = p.lean ?? 0, sb = p.stab ?? 0, cx = 52, cy = 26 + ln * 2, fy = 42;
  const leg = (r, kn, ft, far) => { S.add(U(capF(r, kn, 0.9, 0.7), capF(kn, ft, 0.7, 0.4)), far ? STRF : STR, { z: far ? -2 : 4, h: 0.6 }); S.add(minus(ellR(ft[0], fy + 1, 4, 1.2), ellR(ft[0], fy + 1, 2.6, 0.7)), mat(ramp(0xd8e8d8)), { z: far ? -1.9 : 4.1, h: 0.2 }); };
  for (const [d, far] of [[-1, 1], [1, 0]]) {
    leg([cx + 2, cy + 2], [cx + 14 + d * 2, cy - 8 - d], [cx + 40 + d * 4 + Math.sin(ph) * 2, fy], far);
    leg([cx - 2, cy + 2], [cx - 16 + d * 2, cy - 10 - d], [cx - 46 + d * 4 - Math.sin(ph) * 2, fy], far);
  }
  // 몸 (길쭉) + 앞다리 + 주둥이
  S.add(U(capF([cx - 16, cy + 1], [cx + 10, cy], 3.4, 4), ellR(cx + 12, cy - 1, 3.4, 3)), STR, { z: 1, h: 3.4 });
  S.carve(capF([cx - 14, cy - 1], [cx + 8, cy - 2], 0.4), 0.6);
  for (const d of [-1, 1]) S.add(U(capF([cx + 8, cy + 2], [cx + 14 + sb * 4, cy + 6], 0.8), capF([cx + 14 + sb * 4, cy + 6], [cx + 18 + sb * 6, cy + 4 + d], 0.6, 0.4)), d < 0 ? STRF : STR, { z: d < 0 ? 0.5 : 3, h: 0.5 });
  S.add(capF([cx + 14, cy], [cx + 22 + sb * 6, cy + 3 + sb * 2], 0.7, 0.3), STRF, { z: 2, h: 0.4 });
  S.add(ellR(cx + 13, cy - 2.4, 1.6, 1.6), mat(ramp(0x6a2a2a), { spec: 0.7 }), { z: 2.2, h: 1 });
  for (const d of [0, 2]) S.add(capF([cx + 14, cy - 3], [cx + 22 + d, cy - 7 - d], 0.35), STR, { z: 1.5, h: 0.3 });
  !p.hurt && S.decal(cx + 13.6, cy - 2.8, 0xd8f0a0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxStrider = {
  fw: Math.round(108 * STK), fh: Math.round(50 * STK), w: 26, h: 12, flying: !0,
  anims: { idle: [4, 4], move: [4, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { ph: ph, lean: 0.4 };
    if (nm === "wind") P = { lean: -1 * t };
    if (nm === "atk") P = { lean: 0.8, stab: [0.8, 1, 0.8][f] };
    if (nm === "rec") P = { stab: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, lean: -1 };
    return striderFrame(P);
  },
};

// ════ 안개 칠성장어 ════ 공중을 물결치며 헤엄치는 회갈색 장어 · 아가미 구멍 일곱 · 둥근 빨판 입(겹겹 이빨이 보이게 벌어진다) · 등지느러미
//   p: ph · mouth · lunge · hurt
const LMK = 0.72;
const LMP = mat(ramp(0x6a6458), { tex: "skin", amp: 0.8, spec: 0.5 }), LMPF = mat(rampF(0x524c42), { tex: "skin", amp: 0.7 }), LMPB = mat(ramp(0xa09a88), { tex: "skin", amp: 0.5 });
function lampreyFrame(p = {}) {
  const W = 104, H = 50, S = sculpt(W, H, { k: LMK, ax: 50 });
  const ph = p.ph ?? 0, mo = p.mouth ?? 0, lu = p.lunge ?? 0, cx = 50 + lu * 6, cy = 25;
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push([cx - 40 + i * 4.8, cy + Math.sin(ph - i * 0.55) * (4.6 - i * 0.28)]);
  for (let i = 0; i < 12; i++) S.add(capF(pts[i], pts[i + 1], 1.2 + i * 0.36, 1.2 + (i + 1) * 0.36), i % 2 ? LMP : LMPF, { z: i * 0.04, h: 3.6 });
  for (let i = 0; i < 12; i++) S.add(capF([pts[i][0], pts[i][1] + 1.4 + i * 0.12], [pts[i + 1][0], pts[i + 1][1] + 1.4 + i * 0.12], 0.5), LMPB, { on: 1, lift: 0.1, h: 0.2 });
  S.add(polyF([[pts[1][0], pts[1][1] - 1], [pts[3][0], pts[3][1] - 4], [pts[6][0], pts[6][1] - 3], [pts[7][0], pts[7][1] - 2]]), LMPF, { z: -0.5, h: 0.6, prof: "flat" });
  for (let k = 0; k < 7; k++) { const q = lerp(pts[9], pts[11], k / 6); S.add(ellR(q[0], q[1] - 0.6, 0.6, 0.6), DARK, { on: 1, lift: 0.2, h: 0.2 }); }
  // 빨판 입 (앞쪽을 향한 둥근 원판)
  const hd = pts[12], m = [hd[0] + 3, hd[1]];
  S.add(ellR(m[0], m[1], 3.2 + mo * 1.6, 5.4 + mo * 1.8), LMP, { z: 1, h: 3.4 });
  if (mo > 0.2) { S.add(ellR(m[0] + 0.8, m[1], 1.8 + mo, 3.4 + mo * 1.2), mat(ramp(0x6a3438)), { z: 1.1, h: 0.4 }); for (let k = 0; k < 8; k++) { const q = [m[0] + 0.8 + Math.cos((k / 8) * T2) * (1.2 + mo * 0.6), m[1] + Math.sin((k / 8) * T2) * (2.4 + mo)]; S.add(ellR(q[0], q[1], 0.5, 0.5), mat(ramp(0xe8d888)), { z: 1.2, h: 0.3 }); } S.add(ellR(m[0] + 1, m[1], 0.8, 1.4), DARK, { z: 1.3, h: 0.2 }); }
  !p.hurt && S.decal(hd[0] - 2.4, hd[1] - 1.6, 0xd8f0a0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxLamprey = {
  fw: Math.round(104 * LMK), fh: Math.round(50 * LMK), w: 26, h: 12, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], latch: [4, 10] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, mouth: 0.2 };
    if (nm === "move") P = { ph: ph * 1.4, mouth: 0.1 };
    if (nm === "wind") P = { ph, mouth: t, lunge: -0.5 * t };
    if (nm === "atk") P = { ph, mouth: 1, lunge: [1, 1.4, 1.2][f] };
    if (nm === "rec") P = { ph, mouth: 1 - t, lunge: 1 - t };
    if (nm === "latch") P = { ph: ph * 2, mouth: 0.8, lunge: 1 };
    if (nm === "hurt") P = { hurt: f === 0, ph, mouth: 1 };
    return lampreyFrame(P);
  },
};

// ════ 독 연꽃 ════ 공중에 뜬 큰 연잎(잎맥 · 갈라진 홈 · 아래로 늘어진 뿌리) 위 검보랏빛 독 연꽃 · 가운데 구멍 난 씨방에서 독 씨앗을 쏜다
//   p: open(꽃잎 벌림) · ph · hurt
const LTK = 0.72;
const PAD = mat(ramp(0x4a6a3a), { tex: "leaf", amp: 0.8, spec: 0.3 }), PADF = mat(rampF(0x3a5430), { tex: "leaf", amp: 0.7 }), PET = mat(ramp(0x8a4a8a), { tex: "leaf", amp: 0.6, spec: 0.3 }), PETF = mat(rampF(0x6a3a6a), { tex: "leaf", amp: 0.5 }), POD = mat(ramp(0xa0a050), { tex: "clay", amp: 0.6 });
function lotusFrame(p = {}) {
  const W = 66, H = 70, S = sculpt(W, H, { k: LTK, ax: 33 });
  const op = p.open ?? 0.3, ph = p.ph ?? 0, cx = 33, cy = 40;
  // 늘어진 뿌리
  for (let k = 0; k < 5; k++) { let q = [cx - 10 + k * 5, cy + 4]; for (let j = 0; j < 4; j++) { const n2 = [q[0] + Math.sin(ph + k + j) * 1.6, q[1] + 5]; S.add(capF(q, n2, 0.7 - j * 0.12), mat(ramp(0x6a5a44), { tex: "wood" }), { z: -2, h: 0.4 }); q = n2; } }
  // 연잎 (비스듬히 본 원판 · 갈라진 홈 · 잎맥)
  S.add(minus(ellR(cx, cy, 24, 7), polyF([[cx, cy], [cx + 26, cy + 2], [cx + 26, cy + 8]])), PAD, { z: 0, h: 2, prof: "flat" });
  S.add(minus(minus(ellR(cx, cy, 24, 7), ellR(cx, cy - 0.8, 22, 5.6)), polyF([[cx, cy], [cx + 26, cy + 2], [cx + 26, cy + 8]])), mat(ramp(0x7a9a5a), { tex: "leaf" }), { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(cx, cy + 2, 24, 6), PADF, { z: -0.5, h: 1.6 });
  for (let k = 0; k < 9; k++) { const a = (k / 9) * T2 + 0.3; S.carve(capF([cx, cy], [cx + Math.cos(a) * 21, cy + Math.sin(a) * 6], 0.3), 0.4); }
  // 꽃잎 (뒤 → 앞) + 씨방
  const petal = (a, l, w, far) => { const base = [cx + Math.cos(a) * 4, cy - 3], ang = -Math.PI / 2 + Math.cos(a) * (0.4 + op * 0.75), tip = pol(base, ang, l), m = lerp(base, tip, 0.45); S.add(polyF([base, pol(m, ang + 1.57, w), pol(lerp(base, tip, 0.8), ang + 1.57, w * 0.6), tip, pol(lerp(base, tip, 0.8), ang - 1.57, w * 0.6), pol(m, ang - 1.57, w)]), far ? PETF : PET, { z: far ? 0.5 : 3 + Math.sin(a), h: 2, prof: "round" }); S.add(capF(lerp(base, tip, 0.2), lerp(base, tip, 0.85), 0.4), mat(ramp(0xd8a8d8)), { on: 1, lift: 0.2, h: 0.2 }); S.add(ellR(...lerp(base, tip, 0.92), 1, 1.4, ang), mat(ramp(0x3a1a3a)), { on: 1, lift: 0.3, h: 0.2 }); };
  for (let k = 0; k < 6; k++) { const a = (k / 6) * T2; Math.sin(a) < 0 && petal(a, 14, 4, 1); }
  S.add(U(ellR(cx, cy - 8, 5.4, 2.4), polyF([[cx - 5, cy - 8], [cx + 5, cy - 8], [cx + 3, cy - 3], [cx - 3, cy - 3]])), POD, { z: 2, h: 3 });
  for (const [u, v] of [[-2.6, -0.4], [0, -1], [2.6, -0.4], [-1.3, 0.6], [1.3, 0.6]]) S.add(ellR(cx + u, cy - 8 + v, 0.7, 0.5), DARK, { on: 1, lift: 0.3, h: 0.2 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * T2; Math.sin(a) >= 0 && petal(a, 15, 4.4, 0); }
  !p.hurt && S.decal(cx, cy - 8, 0xd8f0a0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxLotus = {
  fw: Math.round(66 * LTK), fh: Math.round(70 * LTK), w: 24, h: 16, flying: !0,
  anims: { idle: [6, 4], move: [6, 6], wind: [3, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, open: 0.3 + Math.sin(ph) * 0.05 };
    if (nm === "wind") P = { ph, open: 0.3 - 0.3 * t };
    if (nm === "atk") P = { ph, open: [1, 1, 0.8][f] };
    if (nm === "rec") P = { ph, open: 0.8 - 0.5 * t };
    if (nm === "hurt") P = { hurt: f === 0, ph, open: 0 };
    return lotusFrame(P);
  },
};

// ════ [정예] 닭발 오두막 ════ 비늘 덮인 거대한 닭발 둘 위에 올라선 늪 마녀의 오두막 · 이끼 낀 초가지붕과 굽은 굴뚝(연기) ·
//   이빨 같은 판자 문이 입처럼 열리고 두 창문이 눈처럼 빛난다 · 매달린 뼈와 병 부적 · 앞 툇마루
//   p: step · bob · door(입 벌림) · kick · smoke · hurt
const HTK = 0.7;
const SCLY = mat(ramp(0xc8a050), { tex: "scale", amp: 1.1 }), SCLYF = mat(rampF(0xa08040), { tex: "scale", amp: 1 }), THAT = mat(ramp(0x8a7a48), { tex: "fur", amp: 1.2, dir: 1.2 }), THATF = mat(rampF(0x6a5e38), { tex: "fur", amp: 1.1, dir: 1.2 });
function hutFrame(p = {}) {
  const W = 160, H = 150, G = H - 1, S = sculpt(W, H, { k: HTK, ax: 70 });
  const st = p.step ?? 0, b = p.bob ?? 0, dr = p.door ?? 0, kk = p.kick ?? 0, cx = 68;
  // 닭발 (먼 · 가까운): 깃털 넓적다리 → 뒤로 굽은 발목 → 비늘 정강이 → 발가락 넷 + 발톱
  const chick = (hp, o, far, kick) => {
    const ft = kick ? [hp[0] + 34, hp[1] + 22] : [hp[0] + o[0], G - 2 - o[1]], kn = [L(hp[0], ft[0], 0.4) - 12, L(hp[1], ft[1], 0.5) - 2], M0 = far ? SCLYF : SCLY;
    S.add(U(ellR(hp[0], hp[1] + 4, 12, 10)), far ? mat(rampF(0x5a4a3a), { tex: "feather" }) : mat(ramp(0x6a5844), { tex: "feather", amp: 1.1 }), { z: far ? -4 : 6, h: 8 });
    S.add(U(capF([hp[0], hp[1] + 8], kn, 6, 4.4), capF(kn, ft, 4.4, 3.6)), M0, { z: far ? -3.8 : 6.2, h: 4 });
    for (let k = 1; k < 6; k++) S.carve(capF(lerp(kn, ft, k / 6), pol(lerp(kn, ft, k / 6), 0.3, 4), 0.4), 0.6);
    const ta = kick ? -0.4 : 0;
    for (const [a, l] of [[ta - 0.15, 14], [ta + 0.25, 12], [ta + 0.65, 10], [ta + Math.PI - 0.3, 8]]) { const c0 = pol(ft, a, l); S.add(U(capF(ft, c0, 2.6, 1.8), capF(c0, pol(c0, a + 0.9, 4), 1.4, 0.4)), M0, { z: far ? -3.7 : 6.3, h: 1.6 }); S.add(capF(c0, pol(c0, a + 0.9, 4), 1, 0.3), mat(ramp(0x2a2420)), { z: far ? -3.6 : 6.4, h: 0.6 }); }
  };
  chick([cx - 10, 84 + b], [-st, 0], 1, 0);
  // 오두막 (통나무 벽 · 판자 · 이끼)
  const hx0 = cx - 34, hx1 = cx + 30, hy0 = 40 + b, hy1 = 88 + b;
  S.add(polyF([[hx0, hy0], [hx1, hy0 - 2], [hx1 + 2, hy1], [hx0 - 2, hy1 + 2]]), WOOD, { z: 1, h: 12, prof: "flat" });
  for (let k = 0; k < 7; k++) { const y = hy0 + 4 + k * 7; S.carve(capF([hx0, y], [hx1, y - 0.6], 0.6), 1); S.add(ellR(hx0 - 1, y + 3, 2.4, 3), WOODF, { z: 1.2, h: 2 }); }
  S.add(polyF([[hx0, hy1 - 8], [hx0 + 16, hy1 - 6], [hx0 + 12, hy1 + 2], [hx0 - 2, hy1 + 2]]), MOSS, { lift: 0.6, h: 1.4 });
  // 툇마루 + 기둥
  S.add(polyF([[hx0 - 8, hy1], [hx1 + 10, hy1 - 2], [hx1 + 10, hy1 + 3], [hx0 - 8, hy1 + 5]]), WOODF, { z: 3, h: 3 });
  // 창문 두 개 (눈) + 문 (입)
  const win = (x, y) => { S.add(polyF([[x - 6, y - 6], [x + 6, y - 6], [x + 6, y + 6], [x - 6, y + 6]]), DARK, { z: 2, h: 1 }); S.add(ellR(x, y, 4.4, 4.4), p.hurt ? DARK : GLWY, { z: 2.1, h: 1.2 }); S.add(capF([x - 6, y], [x + 6, y], 0.7), WOODF, { z: 2.2, h: 0.8 }).add(capF([x, y - 6], [x, y + 6], 0.7), WOODF, { z: 2.2, h: 0.8 }); S.add(capF([x - 8, y - 7], [x + 8, y - 8.4], 1.6), WOOD, { z: 2.3, h: 1.4 }); };
  win(cx - 18, hy0 + 14), win(cx + 14, hy0 + 13);
  const dx0 = cx - 6, dy0 = hy0 + 26;
  S.add(polyF([[dx0 - 8, dy0], [dx0 + 8, dy0], [dx0 + 8, hy1], [dx0 - 8, hy1]]), DARK, { z: 2, h: 1 });
  if (dr > 0.1) { for (let k = 0; k < 4; k++) S.add(polyF([[dx0 - 7 + k * 4, dy0], [dx0 - 4 + k * 4, dy0], [dx0 - 5.5 + k * 4, dy0 + 5]]), BONE, { z: 2.4, h: 0.6 }); for (let k = 0; k < 4; k++) S.add(polyF([[dx0 - 7 + k * 4, hy1], [dx0 - 4 + k * 4, hy1], [dx0 - 5.5 + k * 4, hy1 - 5]]), BONE, { z: 2.4, h: 0.6 }); S.add(ellR(dx0, (dy0 + hy1) / 2 + 2, 5, 6 * dr), mat(rampGlow(0xff8a3a)), { z: 2.3, h: 0.6 }); }
  S.add(polyF([[dx0 - 8 + dr * 13, dy0 - 1], [dx0 + 8, dy0 - 1], [dx0 + 8, hy1 + 1], [dx0 - 8 + dr * 13, hy1 + 1]]), WOODF, { z: 2.5, h: 2, prof: "flat" });
  for (let k = 0; k < 3; k++) S.carve(capF([dx0 - 6 + dr * 13 + k * 4.4 * (1 - dr * 0.7), dy0 + 1], [dx0 - 6 + dr * 13 + k * 4.4 * (1 - dr * 0.7), hy1 - 1], 0.4), 0.8);
  // 초가지붕 (이끼 · 늘어진 짚) + 굽은 굴뚝
  S.add(polyF([[hx0 - 12, hy0 + 4], [cx - 6, hy0 - 30], [hx1 + 14, hy0 + 2], [hx1 + 8, hy0 + 8], [cx, hy0 + 4], [hx0 - 6, hy0 + 10]]), THAT, { z: 4, h: 10 });
  for (let k = 0; k < 10; k++) { const x = hx0 - 10 + k * 8; S.add(capF([x, hy0 + 4 - Math.abs(x - cx) * 0.02], [x + Math.sin(k) * 2, hy0 + 12 + (k % 3) * 2], 1.2, 0.6), THATF, { z: 4.1, h: 1 }); }
  for (const [x, y, r] of [[cx - 20, hy0 - 6, 6], [cx + 8, hy0 - 12, 5], [cx + 22, hy0 - 2, 4]]) S.add(ellR(x, y, r, r * 0.6), MOSS, { lift: 1, h: 2 });
  const ch0 = [cx + 14, hy0 - 16];
  S.add(U(capF(ch0, [ch0[0] + 3, ch0[1] - 14], 3.6, 3.2), capF([ch0[0] + 3, ch0[1] - 14], [ch0[0] - 2, ch0[1] - 22], 3.2, 3)), mat(ramp(0x6a5a50), { tex: "stone", amp: 1 }), { z: 3.8, h: 3 });
  // 매달린 부적 (뼈 · 병)
  for (const [x, l, kind] of [[hx0 - 6, 12, 0], [hx1 + 8, 10, 1], [hx1 + 2, 16, 0]]) { const y0 = hy0 + 6; S.add(capF([x, y0], [x, y0 + l], 0.3), LEATHM, { z: 4.6, h: 0.3 }); kind ? S.add(ellR(x, y0 + l + 2.4, 2, 2.6), mat(ramp(0x6a9a7a, { hi: 0.5 }), { tex: "glass", spec: 0.8 }), { z: 4.7, h: 1.4 }) : S.add(U(capF([x - 2, y0 + l], [x + 2, y0 + l + 4], 0.9), ellR(x - 2, y0 + l, 1.2, 1.2), ellR(x + 2, y0 + l + 4, 1.2, 1.2)), BONE, { z: 4.7, h: 0.8 }); }
  chick([cx + 12, 86 + b], [st, 0], 0, kk > 0.5);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, HTK, 70);
  for (let k = 0; k < 7; k++) { const q = P(ch0[0] - 2 + Math.sin(k * 1.3 + (p.ph ?? 0)) * 3 - k * 1.5, ch0[1] - 26 - k * 3.4); C.px(q[0], q[1], k % 2 ? 0x9aa890 : 0x7a8a72); C.px(q[0] + 1, q[1], 0x9aa890); }
  return fin(C, p);
}
export const pxHut = {
  fw: Math.round(160 * HTK), fh: Math.round(150 * HTK), w: 50, h: 70,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], kick: [3, 14, !1], spew: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph };
    if (nm === "move") P = { step: Math.sin(ph) * 10, bob: -Math.abs(Math.sin(ph)) * 4, ph };
    if (nm === "wind") P = { bob: -4 * t, ph };
    if (nm === "atk") P = { bob: [2, 6, 6][f], ph };
    if (nm === "rec") P = { bob: 6 * (1 - t), ph };
    if (nm === "kick") P = { kick: f >= 1 ? 1 : 0, bob: -2, ph };
    if (nm === "spew") P = { door: [0.4, 1, 1, 0.5][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, door: 0.4, ph };
    return hutFrame(P);
  },
};
