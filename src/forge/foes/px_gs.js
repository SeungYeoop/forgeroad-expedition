// 그린스텝 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 거점 위 하늘 입문, 풀로 덮인 계단 섬
//   아래 섬 줄: 솜털 구름양 · 풀섬 토끼 · 새싹 정령 · [정예] 숫양 대장
//   가운데 줄: 참새 떼 · 꽃 해파리 · 민들레 기사 · [정예] 거대 무당벌레
//   위 줄: 하늘 매 · 비구름 정령 · 바람개비 요정 · [정예] 구름 고래 새끼
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const FLUFF = ramp(0xf0ecf4, { cool: 0x5a6a9a, hi: 0.2 }), FLUFFD = ramp(0xc8c4d8, { cool: 0x4a5a8a }), GRASS = ramp(0x78c850), GRASSD = ramp(0x5aa83e);
const puff = (C, cx, cy, rx, ry, R, n = 7, seed = 0) => {
  const fs = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * T2 + seed, r = 0.62 + ((k * 37) % 7) / 20; fs.push(ellR(cx + Math.cos(a) * rx * 0.62, cy + Math.sin(a) * ry * 0.6, rx * 0.5 * r + 1, ry * 0.5 * r + 1)); }
  C.part(U(ellR(cx, cy, rx * 0.8, ry * 0.8), ...fs), R, { shine: 1 });
};

// ════ 솜털 구름양 ════ 구름 같은 솜털 덩어리에 까만 얼굴과 짧은 다리. 솜털을 부풀렸다 들이받아 민다
//   p: legs · bob · fluff 부풀림 · head 숙임 · hurt
const SHEEPF = ramp(0x2a2630), SHEEPFF = rampF(0x2a2630);
const done3 = (C, p) => (p.hurt ? flash(C) : C);
function glint3(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
const G_WOOL = mat(ramp(0xf0ecf4, { hi: 0.3 }), { tex: "fur", amp: 1.3, dir: 0.6 }), G_WOOLF = mat(rampF(0xc8c4d8), { tex: "fur", amp: 1.2, dir: 0.6 });
const G_GRASS = mat(ramp(0x78c850), { tex: "leaf", amp: 1.2 }), G_GRASSD = mat(ramp(0x5aa83e), { tex: "leaf", amp: 1.2 }), G_VD = mat(ramp(0x141018));
const G_toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 솜털 덩이 (작은 덩이 여럿을 녹여 쌓는다)
const G_puff = (S, cx, cy, rx, ry, M, n, o = {}) => { const fs = []; for (let k = 0; k < n; k++) { const a = (k / n) * T2 + (o.seed ?? 0), r = 0.62 + ((k * 37) % 7) / 20; fs.push(ellR(cx + Math.cos(a) * rx * 0.6, cy + Math.sin(a) * ry * 0.58, rx * 0.52 * r + 1.4, ry * 0.52 * r + 1.4)); } fs.push(ellR(cx, cy, rx * 0.7, ry * 0.7)); S.add(U(...fs), M, { z: o.z ?? 1, h: o.h ?? ry * 0.9 }); for (let k = 0; k < n; k++) { const a = (k / n) * T2 + (o.seed ?? 0) + 0.4; S.carve(capF([cx + Math.cos(a) * rx * 0.3, cy + Math.sin(a) * ry * 0.3], [cx + Math.cos(a) * rx * 0.75, cy + Math.sin(a) * ry * 0.72], 0.5), 0.7); } };
function sheepFrame(p = {}) {
  const W = 66, H = 50, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 31 });
  const b = p.bob ?? 0, fz = p.fluff ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd = p.head ?? 0, cx = 30;
  const LEG = mat(ramp(0x3a3438), { tex: "skin", amp: 0.6 }), LEGF = mat(rampF(0x2a2630), { tex: "skin" }), FACE = mat(ramp(0x3a3438), { tex: "skin", amp: 0.9, spec: 0.2 });
  const leg = (x, o, far) => { const hp = [x, 32 + b], ft = [x + o[0], G - 1 - o[1]]; S.add(capF(hp, ft, 2.2, 1.8), far ? LEGF : LEG, { z: far ? -3 : 5, h: 1.6 }); S.add(ellR(ft[0] + 0.6, ft[1] - 0.6, 2.2, 1.4), mat(ramp(0x1a1418), { spec: 0.6 }), { z: far ? -2.9 : 5.1, h: 0.8 }); };
  leg(cx + 9, lg.ff, 1), leg(cx - 9, lg.bf, 1);
  G_puff(S, cx - 2, 24 + b, 21 + fz * 4, 15 + fz * 3, G_WOOL, 9, { seed: 0.3, h: 12 });
  S.add(capF([cx - 16, 33 + b], [cx + 12, 33 + b], 3), G_WOOLF, { on: 1, lift: 0.2, h: 0.6 });
  // 머리 (까만 얼굴 · 귀 · 작은 말린 뿔 · 앞머리 솜털)
  const hx = cx + 18 + hd * 3, hy = 22 + b + hd * 6;
  S.add(U(ellR(hx, hy, 5, 5.6), capF([hx, hy + 1], [hx + 7, hy + 4], 3.6, 2.6)), FACE, { z: 3, h: 4 });
  S.add(ellR(hx - 5, hy, 3.6, 1.6, 0.4), FACE, { z: 2.8, h: 1 });
  S.add(U(capF([hx - 2, hy - 3], [hx - 6, hy - 1], 1.4, 1.2), capF([hx - 6, hy - 1], [hx - 5, hy + 3], 1.2, 0.8)), mat(ramp(0xb8a080), { tex: "wood", amp: 0.8 }), { z: 3.2, h: 1 });
  G_puff(S, hx - 1, hy - 5, 5.6, 3.4, G_WOOL, 5, { seed: 1, z: 3.4, h: 3 });
  S.add(ellR(hx + 6.6, hy + 3.6, 0.8, 0.6), mat(ramp(0x0a0808)), { z: 3.4, lift: 0.1, h: 0.2 });
  !p.hurt && S.decal(hx + 2.4, hy, 0xd8c060).decal(hx + 2.4, hy - 0.4, 0x101010);
  leg(cx + 12, lg.fn, 0), leg(cx - 6, lg.bn, 0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxSheep = spec(48, 36, 22, 18,
  { idle: [4, 5], move: [6, 12], wind: [4, 10, !1], atk: [4, 16], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, fluff: Math.max(0, Math.sin(ph)) * 0.2 };
    if (nm === "move") { const g = gait4(f, n, 3.5, 2); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { fluff: t, head: t * 0.8, bob: t };
    if (nm === "atk") { const g = gait4(f, n, 5, 2.5); return { legs: g, head: 0.9, fluff: 0.6 }; }
    if (nm === "rec") return { fluff: 0.6 * (1 - t), head: 0.9 * (1 - t) };
    return { hurt: f === 0, fluff: 0.8, head: -0.3 };
  }, sheepFrame);

// ════ 풀섬 토끼 ════ 긴 귀 · 흰 솜꼬리 · 강한 뒷다리. 깡충깡충 다가와 뒷발로 걷어찬다
//   p: bob · crouch · ears 귀 젖힘 · kick 뒷발차기(0~1) · air · hurt
const RAB = ramp(0xc8a87a), RABF = rampF(0xb0906a), RABB = ramp(0xf4ecdc);
function rabbitFrame(p = {}) {
  const W = 56, H = 50, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 4, ea = p.ears ?? 0, kk = p.kick ?? 0, air = p.air ?? 0, cx = 24;
  const RB = mat(ramp(0xb89870), { tex: "fur", amp: 1.2, dir: 0.3 }), RBF = mat(rampF(0x9a7e5c), { tex: "fur", amp: 1.1, dir: 0.3 }), RBW = mat(ramp(0xf4ecdc), { tex: "fur", amp: 0.9 });
  // 뒷다리 (차기 · 공중)
  const hip = [cx - 6, 32 + b], ft = kk > 0 ? [hip[0] - 14 - kk * 6, hip[1] + 2] : [hip[0] + 6 - air * 6, G - 1 - air * 4];
  const kn = kk > 0 ? lerp(hip, ft, 0.5) : [hip[0] + 4, hip[1] + 5];
  S.add(ellR(hip[0], hip[1] - 1, 8, 7.4), RBF, { z: -1, h: 6 });
  S.add(U(capF(hip, kn, 4.4, 3), capF(kn, ft, 2.4, 2)), RBF, { z: -0.8, h: 2 });
  S.add(ellR(ft[0] + (kk > 0 ? -2 : 2), ft[1], 5, 1.8, kk > 0 ? 0.3 : 0), RBF, { z: -0.7, h: 1.2 });
  // 몸 + 솜꼬리
  S.add(U(ellR(cx - 2, 30 + b, 12, 9.4), ellR(cx + 7, 24 + b, 7.4, 8)), RB, { z: 1, h: 9 });
  S.add(ellR(cx + 6, 30 + b, 4.6, 5.4), RBW, { on: 1, lift: 0.3, h: 0.8 });
  S.add(ellR(cx - 14, 27 + b, 4, 3.6), RBW, { z: 1.4, h: 3 });
  // 가까운 뒷다리 (큰 허벅지)
  S.add(ellR(hip[0] + 2, hip[1], 8, 7), RB, { z: 2, h: 6 });
  S.add(U(capF([hip[0] + 2, hip[1] + 2], kk > 0 ? kn : [kn[0] + 2, kn[1]], 3.6, 2.4), capF(kk > 0 ? kn : [kn[0] + 2, kn[1]], [ft[0] + 2, ft[1]], 2.2, 1.8)), RB, { z: 2.2, h: 2 });
  S.add(ellR(ft[0] + (kk > 0 ? -1 : 4), ft[1], 5.4, 1.8, kk > 0 ? 0.3 : 0), RB, { z: 2.3, h: 1.2 });
  // 머리 + 귀
  const hx = cx + 12, hy = 16 + b;
  S.add(U(ellR(hx, hy, 6.4, 6), capF([hx + 2, hy + 1], [hx + 8, hy + 3], 3.6, 2.4)), RB, { z: 3, h: 5 });
  for (const [d, z, M] of [[-1, 2.8, RBF], [1, 3.4, RB]]) { const r = [hx - 2 + d, hy - 4], a = -1.7 - ea * 0.9 + d * 0.12, e = pol(r, a, 15 - ea * 2); S.add(U(capF(r, lerp(r, e, 0.5), 2.2, 2.6), capF(lerp(r, e, 0.5), e, 2.6, 1)), M, { z, h: 1.4 }); d > 0 && S.add(capF(pol(r, a, 2), pol(r, a, 12 - ea * 2), 0.9), mat(ramp(0xd8a098), { tex: "skin" }), { on: 1, lift: 0.2, h: 0.2 }); }
  S.add(ellR(hx + 8.6, hy + 2.6, 0.9, 0.7), mat(ramp(0x6a3a3a)), { z: 3.4, lift: 0.1, h: 0.2 });
  S.add(ellR(hx + 2.4, hy - 1, 1.8, 1.8), mat(ramp(0x1a1010), { spec: 1 }), { z: 3.4, h: 0.6 });
  !p.hurt && S.decal(hx + 2, hy - 1.6, 0xffffff);
  // 앞발
  S.add(capF([cx + 8, 28 + b], [cx + 10 + air * 3, G - 1 - air * 6], 1.8, 1.4), RB, { z: 4, h: 1.2 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxRabbit = spec(40, 36, 14, 16,
  { idle: [6, 8], move: [4, 12], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], hop: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, ears: f === 3 ? 0.4 : 0 };
    if (nm === "move" || nm === "hop") return [{ crouch: 1 }, { air: 1, ears: 0.6, bob: -3 }, { air: 0.6, ears: 0.4, bob: -2 }, { crouch: 0.6 }][f];
    if (nm === "wind") return { crouch: t, ears: 0.6 * t };
    if (nm === "atk") return { kick: [0.6, 1, 1][f], ears: 0.8, bob: -1 };
    if (nm === "rec") return { kick: 1 - t, ears: 0.4 };
    return { hurt: f === 0, ears: 1, crouch: 0.5 };
  }, rabbitFrame);

// ════ 새싹 정령 ════ 땅에 뿌리박은 작은 새싹 요정. 큰 떡잎 두 장 · 꽃봉오리 머리. 씨앗을 세 발씩 쏜다
//   p: sway · open 꽃봉오리 벌림 · recoil · hurt
const SPR = ramp(0x8ad858), SPRD = ramp(0x5ab03e), BLOOM = ramp(0xffb0c8);
function sproutFrame(p = {}) {
  const W = 46, H = 50, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 23 });
  const sw = p.sway ?? 0, op = p.open ?? 0, rc = p.recoil ?? 0, cx = 23;
  const STEM = mat(ramp(0x6ab048), { tex: "wood", amp: 0.8, dir: 1.57 }), LEAF = mat(ramp(0x8ad858), { tex: "leaf", amp: 1.1, spec: 0.3 }), LEAFF = mat(rampF(0x5ab03e), { tex: "leaf" }), BUD = mat(ramp(0x7aa04a), { tex: "leaf", amp: 1 }), PET = mat(ramp(0xffb0c8), { tex: "skin", amp: 0.6, spec: 0.3 });
  // 흙 둔덕 + 뿌리
  S.add(ellR(cx, G - 1, 14, 3.6), mat(ramp(0x6a4a30), { tex: "clay", amp: 1.3 }), { z: -1, h: 2 });
  for (const d of [-1, 1]) S.add(capF([cx + d * 2, G - 3], [cx + d * 12, G], 1.2, 0.4), mat(ramp(0xb89870), { tex: "wood" }), { z: -0.5, h: 0.6 });
  const top = [cx + sw * 3 - rc * 3, 16];
  S.add(U(capF([cx, G - 2], [cx + sw, 32], 2.6, 2.2), capF([cx + sw, 32], top, 2.2, 1.8)), STEM, { z: 0, h: 1.8 });
  // 떡잎 둘
  for (const [d, M, z] of [[-1, LEAFF, -0.5], [1, LEAF, 2]]) { const r = [cx + sw * 0.6, 30], tip = [r[0] + d * 16, 24 - Math.sin((p.sway ?? 0) * d) * 3]; S.add(polyF([r, lerp(r, tip, 0.3).map((v, i) => v + (i ? -5 : 0)), tip, lerp(r, tip, 0.6).map((v, i) => v + (i ? 4 : 0))]), M, { z, h: 2.4 }); S.carve(capF(r, lerp(r, tip, 0.9), 0.35), 0.6); }
  // 머리 (봉오리 · 얼굴 홈)
  S.add(U(ellR(top[0], top[1], 7, 7.4), polyF([[top[0] - 5, top[1] - 4], [top[0], top[1] - 13], [top[0] + 5, top[1] - 4]])), BUD, { z: 3, h: 6 });
  for (let k = 0; k < 4; k++) S.carve(capF([top[0] - 4 + k * 2.6, top[1] - 10 + k], [top[0] - 4 + k * 2.6, top[1] + 6], 0.4), 0.6);
  if (op > 0.1) for (let k = 0; k < 3; k++) S.add(polyF([[top[0] - 3 + k * 3, top[1] - 9], [top[0] - 4 + k * 3 + (k - 1) * op * 3, top[1] - 13 - op * 5], [top[0] - 1 + k * 3, top[1] - 9]]), PET, { z: 3.4, h: 1.4 });
  S.add(ellR(top[0] + 3, top[1] + 1, 1.2, 1.4), G_VD, { z: 3.4, lift: 0.1, h: 0.2 }).add(ellR(top[0] - 1.4, top[1] + 1, 1.2, 1.4), G_VD, { z: 3.4, lift: 0.1, h: 0.2 });
  !p.hurt && S.decal(top[0] + 3, top[1] + 0.6, 0xe8f8c0).decal(top[0] - 1.4, top[1] + 0.6, 0xe8f8c0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxSprout = spec(33, 36, 14, 20,
  { idle: [6, 6], move: [4, 6], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { open: t, recoil: -0.5 * t };
    if (nm === "atk") return { open: 1, recoil: [1, 0.6, 0.3][f] };
    if (nm === "rec") return { open: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, sway: -1.5 };
    return { sway: Math.sin(ph) * 0.8, open: 0.2 };
  }, sproutFrame);

// ════ [정예] 숫양 대장 ════ (큰 몬스터 조각 도구) 회갈색 거구 양 · 크게 말린 두 뿔(마디 홈) · 목 갈기 · 대장의 붉은 목수건. 앞발을 구르다 길게 돌진, 뿔로 걷어 올린다
//   p: legs · bob · head 숙임(+)/들기(-) · rear 앞발 들기 · hurt
const RMK = 0.7;
const RM_W = mat(ramp(0xe2d8c6), { tex: "fur", amp: 0.7, dir: 0.4 }), RM_WF = mat(ramp(0xc4b8a4, { cool: 0x1c2a40 }), { tex: "fur", amp: 0.6, dir: 0.4 });
const RM_FACE = mat(ramp(0x6a5a50), { tex: "skin", amp: 0.4 }), RM_LEG = mat(ramp(0x5e504a), { tex: "skin", amp: 0.3 }), RM_LEGF = mat(ramp(0x4a3e3a, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.3 });
const RM_HORN = mat(ramp(0xb89868), { tex: "wood", amp: 0.5 }), RM_HORNF = mat(ramp(0x957a52, { cool: 0x1c2a40 }), { tex: "wood", amp: 0.4 }), RM_HOOF = mat(ramp(0x3a3034), { spec: 0.4 }), RM_SCARF = mat(ramp(0xc83a30), { tex: "cloth", amp: 0.4 });
function ramFrame(p = {}) {
  const W = 106, H = 80, G = H - 1, S = sculpt(W, H, { k: p.k ?? RMK, ax: 48 });
  const b = p.bob ?? 0, hd = p.head ?? 0, rr = p.rear ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) };
  const R = rot([30, 54], -rr * 0.28), P = (x, y) => R([x, y + b]);
  // 다리: 털 아래 가는 다리 + 무릎 마디 + 발굽 (앞발 들면 접힘)
  const leg = (x, o, far, front) => {
    const s = P(x, 54), up = front && rr > 0, ft = up ? P(x + 9, 64) : [s[0] + o[0], G - 4 - o[1]], kn = up ? P(x + 2, 64) : lerp(s, ft, 0.5);
    S.add(U(capF(s, kn, far ? 3.4 : 4, 3), capF(kn, ft, 3, 2.4), ellR(kn[0], kn[1], 3.2, 3)), far ? RM_LEGF : RM_LEG, { z: far ? -4 : 6, h: 3 });
    S.add(polyF([[ft[0] - 2.8, ft[1]], [ft[0] + 2.8, ft[1]], [ft[0] + 3.4, ft[1] + 4], [ft[0] - 3, ft[1] + 4]]), RM_HOOF, { z: far ? -3.5 : 6.5, h: 2 });
  };
  leg(64, lg.ff, !0, !0), leg(28, lg.bf, !0, !1);
  // 꼬리 (털 뭉치)
  S.add(ellR(...P(16, 40), 5.4, 5), RM_W, { z: -1, h: 4 });
  // 몸통: 털 덩어리 (가장자리 몽실몽실)
  S.add(ellR(...P(46, 44), 30, 16), RM_W, { z: 0, h: 16 });
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * T2, q = P(46 + Math.cos(a) * 27, 44 + Math.sin(a) * 14);
    S.add(ellR(q[0], q[1], 6.2, 5.6), RM_W, { blend: 2.2, h: 3 });
  }
  for (const [x, y] of [[30, 38], [42, 34], [54, 38], [38, 48], [52, 50], [24, 46]]) S.carve(capF(P(x - 3, y), P(x + 3, y + 1), 0.6), 0.7);
  // 목 갈기 (털결 아래로) + 대장 목수건 (매듭 · 펄럭이는 끝)
  S.add(U(ellR(...P(70, 38), 11, 13), ellR(...P(66, 48), 9, 8)), mat(RM_W.ramp, { tex: "fur", amp: 0.8, dir: 1.4 }), { z: 2, h: 10 });
  S.add(capF(P(64, 46), P(80, 40), 3, 2.6), RM_SCARF, { z: 4, h: 3 });
  S.add(U(polyF([P(66, 45), P(54, 49 + Math.sin(b) * 0.5), P(56, 53)]), polyF([P(67, 47), P(58, 56), P(62, 57)])), RM_SCARF, { z: 3.6, h: 1.6 });
  S.add(ellR(...P(66, 46.5), 2.6, 2.4), RM_SCARF, { z: 4.4, h: 2.6 });
  // 머리 (숙이면 뿔이 앞으로)
  const Hr = rot(P(76, 32), hd * 0.7), Q = (x, y) => Hr(P(x, y));
  S.add(polyF([Q(79, 30), Q(70, 34), Q(77, 35)]), RM_FACE, { z: 4, h: 2 });
  S.add(U(ellR(...Q(82, 30), 7.6, 7.2), polyF([Q(84, 24.5), Q(96, 30), Q(95.5, 37), Q(84, 38)])), RM_FACE, { z: 5, h: 7 });
  S.add(capF(Q(86, 27.5), Q(94, 30.5), 1.6, 1.2), RM_FACE, { blend: 1, h: 1 });
  S.add(ellR(...Q(80, 23.6), 6.4, 4), RM_W, { lift: 2, h: 2.4 });
  S.carve(ellR(...Q(94.6, 32.4), 0.9, 0.7), 0.9, !1).carve(capF(Q(89, 36), Q(95, 35.4), 0.5), 0.8, !1);
  if (!p.block && !p.hurt) { const e0 = Q(85, 28.4); S.decal(e0[0], e0[1], 0xe8c040).decal(e0[0] + 1, e0[1], 0x1a1008).decal(e0[0] - 1, e0[1], 0x1a1008); }
  // 큰 뿔 (나선 · 마디 홈) — 먼 뿔은 살짝 뒤
  const horn = (dx, dy, far) => {
    let q = Q(80 + dx, 22 + dy);
    const pts = [q], rs = [4.6];
    for (let k = 1; k <= 10; k++) { q = pol(q, -1.45 - k * 0.6, 4.6 - k * 0.24); pts.push(q), rs.push(4.6 - k * 0.34); }
    const M0 = far ? RM_HORNF : RM_HORN;
    for (let k = 1; k < pts.length; k++) S.add(capF(pts[k - 1], pts[k], rs[k - 1], rs[k]), M0, { z: (far ? 1 : 8) + k * 0.05, h: rs[k] * 0.8 });
    if (!far) for (let k = 1; k < pts.length - 1; k++) { const a = Math.atan2(pts[k + 1][1] - pts[k - 1][1], pts[k + 1][0] - pts[k - 1][0]); S.carve(capF(pol(pts[k], a + 1.57, rs[k] * 0.9), pol(pts[k], a - 1.57, rs[k] * 0.9), 0.4), 0.6); }
  };
  horn(4, -1.4, 1);
  horn(0, 0, 0);
  leg(60, lg.fn, !1, !0), leg(24, lg.bn, !1, !1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxRam = {
  fw: Math.round(106 * RMK), fh: Math.round(80 * RMK), w: 34, h: 32,
  anims: { idle: [4, 5], move: [6, 10], wind: [6, 12, !1], atk: [6, 18], rec: [3, 10, !1], hurt: [2, 10, !1], toss: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait4(f, n, 5, 3); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { rear: f % 2 ? 1 : 0.4, head: 0.4 };
    if (nm === "atk") { const g = gait4(f, n, 7, 3.5); P = { legs: g, head: 1, bob: g.bob + 1 }; }
    if (nm === "toss") P = { head: [1, -0.6, -0.4][f], rear: f === 1 ? 0.6 : 0 };
    if (nm === "rec") P = { head: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.4 };
    return ramFrame(P);
  },
};

// ════ 참새 떼 ════ 통통한 참새 넷이 우르르. 번갈아 쪼고 흩어진다
//   p: flap · spread · ph · peck · hurt
const SPAR = ramp(0x8a6a4a), SPARB = ramp(0xe8dcc0);
function sparrowFrame(p = {}) {
  const W = 66, H = 50, S = sculpt(W, H, { k: 0.72, ax: 33 });
  const fl = p.flap ?? 0, sp = p.spread ?? 0.7, ph = p.ph ?? 0, pk = p.peck ?? 0;
  const BR = mat(ramp(0x8a6a4a), { tex: "feather", amp: 1.1, dir: 0.2 }), BRD = mat(ramp(0x5a4030), { tex: "feather", amp: 1 }), BW = mat(ramp(0xe8dcc0), { tex: "feather", amp: 0.8 });
  const birds = [[-18, -9], [12, -13], [-6, 12], [19, 8]];
  const CHEEK = mat(ramp(0xb8b4aa), { tex: "feather", amp: 0.6 }), CROWN = mat(ramp(0x7a4a2a), { tex: "feather", amp: 0.8 }), BIB = mat(ramp(0x1e1a18));
  birds.forEach(([dx, dy], k) => {
    const c = [33 + dx * sp + Math.sin(ph * 2 + k * 1.7) * 2, 25 + dy * sp + Math.cos(ph * 2 + k) * 2 + (pk && k === 3 ? 4 : 0)], z = k * 2, f2 = k % 2 ? -fl : fl;
    S.add(polyF([[c[0] - 1, c[1] - 1], pol([c[0] - 1, c[1] - 1], -2.3 - f2 * 0.8, 9), pol([c[0] - 1, c[1] - 1], -1.7 - f2 * 0.8, 7)]), mat(rampF(0x4a3424), { tex: "feather" }), { z: z - 0.5, h: 0.6 });
    S.add(polyF([[c[0] - 5, c[1]], [c[0] - 12, c[1] - 1.4], [c[0] - 12, c[1] + 2], [c[0] - 5, c[1] + 2]]), BRD, { z: z - 0.4, h: 0.6 });
    S.add(ellR(c[0], c[1] + 0.4, 6, 4.4), mat(ramp(0xd8ccb0), { tex: "feather", amp: 0.7 }), { z, h: 3.4 });
    S.add(ellR(c[0] + 5, c[1] - 2, 3.4, 3.2), CHEEK, { z: z + 0.2, h: 2.6 });
    S.add(minus(ellR(c[0] + 4.6, c[1] - 2.6, 3.4, 3), (x, y) => y > c[1] - 2.8), CROWN, { z: z + 0.4, h: 2.6 });
    S.add(ellR(c[0] + 6.4, c[1] + 0.4, 1.6, 1.4), BIB, { z: z + 0.4, h: 0.6 });
    S.add(polyF([[c[0] + 8, c[1] - 2.4], [c[0] + 11 + (pk && k === 3 ? 1 : 0), c[1] - 1.4], [c[0] + 8, c[1] - 0.6]]), mat(ramp(0x3a3028), { spec: 0.6 }), { z: z + 0.5, h: 0.4, prof: "sharp" });
    const wr = [c[0] - 1, c[1] - 1.6];
    S.add(polyF([wr, pol(wr, -2.1 + f2 * 0.9, 9), pol(wr, -2.7 + f2 * 0.9, 7), [c[0] - 5, c[1]]]), BR, { z: z + 0.8, h: 0.8 });
    S.add(capF(pol(wr, -2.1 + f2 * 0.9, 3), pol(wr, -2.6 + f2 * 0.9, 3), 0.6), mat(ramp(0xf0ece0)), { z: z + 0.9, h: 0.2 });
    !p.hurt && S.decal(c[0] + 6, c[1] - 2.6, 0x101010);
  });
  return done3(S.render({ rim: !0 }), p);
}
export const pxSparrows = spec(48, 36, 22, 16,
  { idle: [4, 16], move: [4, 18], wind: [3, 12, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2, fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, spread: 0.6 - t * 0.5, ph };
    if (nm === "atk") return { flap: fl, spread: 0.1, peck: 1, ph };
    if (nm === "rec") return { flap: fl, spread: t, ph };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, spread: 1.2, ph };
    return { flap: fl, spread: 0.7, ph: ph * 0.5 };
  }, sparrowFrame, { flying: !0 });

// ════ 꽃 해파리 ════ 꽃잎 갓이 펄럭이는 하늘 해파리. 촉수 끝 꽃가루 침을 흩뿌린다 (맞으면 중독)
//   p: pulse 갓 오므림(0~1) · glow · hurt
const PET = ramp(0xf0a0c8, { cool: 0x8a5a9a }), PETD = ramp(0xd078a8, { cool: 0x6a4a8a }), JEL = ramp(0xd8f0ff);
function jellyFrame(p = {}) {
  const W = 54, H = 64, S = sculpt(W, H, { k: 0.72, ax: 27 });
  const pu = p.pulse ?? 0, cx = 27, cy = 20;
  const PET = mat(ramp(0xf0a0c8, { hi: 0.6 }), { tex: "skin", amp: 0.7, spec: 0.5 }), PETD = mat(ramp(0xd078a8), { tex: "skin", amp: 0.7 }), JEL = mat(ramp(0xd8f0ff, { hi: 0.7 }), { tex: "glass", amp: 1, spec: 1 });
  // 촉수 (꽃가루 맺힌 끝)
  for (let k = 0; k < 7; k++) { let q = [cx - 9 + k * 3, cy + 6 - pu * 2], a = Math.PI / 2 + (k - 3) * 0.08; const tl = []; for (let j = 0; j < 6; j++) { a += Math.sin(pu * 3 + j * 0.8 + k) * 0.15; const n2 = pol(q, a, 4 + pu * 0.6); tl.push(capF(q, n2, 0.8 - j * 0.08)); q = n2; } S.add(U(...tl), k % 2 ? JEL : PETD, { z: k % 2 ? -1 : 2, h: 0.4 }); S.add(ellR(q[0], q[1], 1.2, 1.2), mat(ramp(0xf8d040), { spec: 0.6 }), { z: 2.2, h: 0.6 }); }
  // 갓 (속 투명 · 겉 꽃잎 여섯)
  S.add(minus(ellR(cx, cy + 4, 14 - pu * 3, 12 + pu * 2), (x, y) => y > cy + 7), JEL, { z: 1, h: 7 });
  for (let k = 0; k < 6; k++) { const a = -Math.PI + 0.2 + k * 0.55, r0 = pol([cx, cy + 6], a, 6), tip = pol([cx, cy + 6], a + Math.sin(pu * 2 + k) * 0.05, 17 - pu * 3); S.add(polyF([pol(r0, a + 1.57, 3), tip, pol(r0, a - 1.57, 3)]), k % 2 ? PET : PETD, { z: 2 + (k > 2 && k < 4 ? 0.4 : 0), h: 1.6 }); S.carve(capF(r0, lerp(r0, tip, 0.8), 0.3), 0.6); }
  S.add(ellR(cx, cy + 2, 4, 3.6), mat(rampGlow(0xffd8f0)), { z: 3, h: 1.4 });
  const C = S.render({ rim: !0 });
  glint3(C, G_toPx(W, H, 0.72, 27), cx - 5, cy - 4, 1);
  return done3(C, p);
}
export const pxJelly = spec(39, 46, 16, 24,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { pulse: t };
    if (nm === "atk") return { pulse: [1, 0.2, 0][f] };
    if (nm === "rec") return { pulse: 0.3 * Math.sin(t * 6) };
    if (nm === "hurt") return { hurt: f === 0, pulse: 0.8 };
    return { pulse: (Math.sin(ph) + 1) * 0.35 };
  }, jellyFrame, { flying: !0 });

// ════ 민들레 기사 ════ 꽃받침 투구를 쓴 작은 풀 요정 기사. 민들레 창을 겨누고 찌르고, 홀씨를 타고 날아올랐다 내려찍는다
//   p: bob · legs · lance 창(0 세움 ~ 1 겨눔 ~ 1.3 찌름) · float 홀씨 날기 · hurt
const KNT = ramp(0x6ab848), KNTF = rampF(0x5aa03e), PUFFW = ramp(0xf8f8f0), YEL = ramp(0xf8d040);
function knightFrame(p = {}) {
  const W = 64, H = 64, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 28 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, ln = p.lance ?? 0, flt = p.float ?? 0, cx = 26, fy = flt ? -8 : 0;
  const KN = mat(ramp(0x6ab848), { tex: "leaf", amp: 1, spec: 0.4 }), KNF = mat(rampF(0x5aa03e), { tex: "leaf" }), SKN = mat(ramp(0xc8d898), { tex: "skin", amp: 0.6 }), YEL = mat(ramp(0xf8d040), { tex: "fur", amp: 1.2 });
  // 홀씨 날개 (떠 있을 때)
  if (flt) { const c = [cx - 2, 8 + b]; for (let k = 0; k < 9; k++) { const a = -Math.PI + k * 0.39, e = pol(c, a, 12); S.add(capF(c, e, 0.3), mat(ramp(0xf8f8f0)), { z: -2, h: 0.2 }); S.add(ellR(e[0], e[1], 1.6, 1.6), mat(ramp(0xf8f8f0), { tex: "fur", amp: 1 }), { z: -1.9, h: 0.6 }); } S.add(capF(c, [cx - 2, 24 + b + fy], 0.6), mat(ramp(0x8ab060)), { z: -2, h: 0.3 }); }
  // 다리 (풀잎 각반)
  for (const [o, far, d] of [[g.f, 1, -2], [g.n, 0, 3]]) { const hp = [cx + d, 44 + b + fy], ft = [cx + d + o[0], G - 1 - o[1] + fy]; S.add(capF(hp, ft, 2.2, 1.8), far ? KNF : KN, { z: far ? -2 : 3, h: 1.6 }); S.add(ellR(ft[0] + 1.4, ft[1] - 0.6, 3, 1.4), mat(ramp(0x6a4a30), { tex: "leather" }), { z: far ? -1.9 : 3.1, h: 1 }); }
  // 몸 (잎 갑옷 · 꽃받침 치마)
  S.add(U(ellR(cx, 36 + b + fy, 7, 8)), KN, { z: 1, h: 6 });
  for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + (k - 2.5) * 0.4; S.add(polyF([[cx - 1 + (k - 2.5) * 2.4, 40 + b + fy], pol([cx + (k - 2.5) * 2, 42 + b + fy], a, 6), [cx + 1 + (k - 2.5) * 2.4, 40 + b + fy]]), k % 2 ? KN : KNF, { z: 1.4, h: 1 }); }
  S.add(capF([cx - 6, 34 + b + fy], [cx + 6, 34 + b + fy], 1), mat(ramp(0x6a4a30), { tex: "leather" }), { z: 1.6, h: 0.6 });
  // 머리 (꽃받침 투구 · 노란 꽃 깃)
  const hx = cx + 2, hy = 24 + b + fy;
  S.add(ellR(hx, hy, 5, 5.4), SKN, { z: 3, h: 4 });
  S.add(minus(U(ellR(hx, hy - 1.6, 6, 5)), (x, y) => y > hy - 0.6), KN, { z: 3.4, h: 4 });
  for (let k = 0; k < 5; k++) S.add(polyF([[hx - 5 + k * 2.4, hy - 1], [hx - 5.4 + k * 2.4, hy + 2 + (k % 2)], [hx - 4 + k * 2.4, hy - 1]]), KNF, { z: 3.6, h: 0.6 });
  S.add(U(ellR(hx - 1, hy - 8, 4, 2.4), ellR(hx - 3, hy - 9.6, 2.4, 2)), YEL, { z: 3.8, h: 1.6 });
  !p.hurt && S.decal(hx + 3, hy + 0.4, 0x203010);
  // 먼 팔
  S.add(capF([cx - 4, 32 + b + fy], [cx - 2 + ln * 2, 40 + b + fy], 1.6), KNF, { z: -1, h: 1.2 });
  // 가까운 팔 + 민들레 창
  const sh = [cx + 4, 31 + b + fy], hd = [cx + 8 + ln * 6, 38 + b + fy - (ln < 1 ? ln * 4 : 4)], a = -Math.PI / 2 + Math.min(1.3, ln) * 1.2;
  S.add(capF(sh, hd, 1.8, 1.6), KN, { z: 5, h: 1.2 });
  const t0 = pol(hd, a, -10), t1 = pol(hd, a, 24);
  S.add(capF(t0, t1, 0.8, 0.6), mat(ramp(0x8ab060), { tex: "wood" }), { z: 5.4, h: 0.6 });
  S.add(polyF([pol(t1, a + 1.57, 2), pol(t1, a, 7), pol(t1, a - 1.57, 2)]), mat(ramp(0xc8d8c0), { tex: "metal", spec: 0.8 }), { z: 5.6, h: 0.8, prof: "sharp" });
  for (let k = 0; k < 6; k++) { const q = pol(pol(t1, a, -3), a + Math.PI / 2 + (k - 2.5) * 0.5, 3); S.add(ellR(q[0], q[1], 1, 1), YEL, { z: 5.5, h: 0.4 }); }
  return done3(S.render({ rim: !0 }), p);
}
export const pxKnight = spec(46, 46, 12, 22,
  { idle: [4, 6], move: [8, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], float: [4, 8] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, lance: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 3, 2); return { legs: g, bob: g.bob, lance: 0.5 }; }
    if (nm === "wind") return { lance: 0.5 + 0.5 * t, bob: t };
    if (nm === "atk") return { lance: [1.2, 1.3, 1.3][f], legs: { n: [4, 0], f: [-3, 0] } };
    if (nm === "float") return { float: 1, lance: 1, bob: Math.sin(ph) * 1 };
    if (nm === "rec") return { lance: 1.2 - t };
    return { hurt: f === 0, lance: 0.3 };
  }, knightFrame);

// ════ [정예] 거대 무당벌레 ════ (큰 몬스터 조각 도구) 반들반들 빨간 딱지에 까만 점 일곱 · 흰 무늬 앞가슴 · 곤봉 더듬이. 딱지를 펴고 날아올라 박치기, 움츠려 막고 굴러 돌진
//   p: legs 다리 위상 · wings 딱지 펴기(0~1) · flap 속날개 · guard 움츠림 · bob · hurt
const LBG = 0.7;
const LB_R = mat(ramp(0xdc3a2a), { spec: 0.9 }), LB_RD = mat(ramp(0x9a2a22), { spec: 0.5 }), LB_K = mat(ramp(0x2a2630), { spec: 0.6 }), LB_KF = mat(ramp(0x1c1a22, { cool: 0x1c2a40 }), { spec: 0.3 });
const LB_WH = mat(ramp(0xf0ece0), { spec: 0.4 }), LB_MEM = mat(ramp(0xc8d6e4), { tex: "skin", amp: 0.15, spec: 0.5 });
function ladybugFrame(p = {}) {
  const W = 92, H = 66, G = H - 1, S = sculpt(W, H, { k: p.k ?? LBG, ax: 46 });
  const gd = p.guard ?? 0, b = (p.bob ?? 0) + gd * 4, wg = p.wings ?? 0, lp = p.legs ?? 0, fl = p.flap ?? 0;
  // 다리 여섯 (마디 셋 · 갈고리 발끝) — 움츠리면 숨김
  const leg = (k, far) => {
    const s = [32 + k * 12 + (far ? 3 : 0), 50 + b], sw = Math.sin(lp + k * 2.1 + far * 3) * 3.4;
    const kn = [s[0] + (k - 1) * 3 + sw * 0.5, 55 + b], ft = [s[0] + (k - 1) * 6 + sw, G - 1 - Math.max(0, Math.cos(lp + k * 2.1 + far * 3)) * 1.6];
    S.add(U(capF(s, kn, 1.8, 1.5), capF(kn, ft, 1.5, 1)), far ? LB_KF : LB_K, { z: far ? -4 : 8, h: 1.4 });
    S.add(capF(ft, [ft[0] + 2, ft[1] + 0.4], 0.8, 0.4), far ? LB_KF : LB_K, { z: far ? -3.8 : 8.2, h: 0.6 });
  };
  if (gd < 0.6) for (let k = 0; k < 3; k++) leg(k, 1);
  // 속날개 (투명한 막 · 맥) — 딱지 아래에서 뒤로 펼침
  if (wg > 0.05) for (const [da, M0] of [[-0.25, LB_MEM], [0.15, LB_MEM]]) {
    const h0 = [58, 32 + b], a = Math.PI + 0.35 + da - fl * 0.5, tip = pol(h0, a, 44 * wg), mid = pol(h0, a + 0.12, 26 * wg);
    S.add(polyF([h0, pol(mid, a - 1.5, 6), pol(tip, a - 1.2, 3), tip, pol(tip, a + 1.6, 4), pol(mid, a + 1.6, 3)]), M0, { z: da < 0 ? -2 : 9, h: 0.8, prof: "flat" });
    S.carve(capF(h0, tip, 0.35), 0.4).carve(capF(mid, pol(mid, a - 1.1, 5), 0.3), 0.4);
  }
  // 몸 아래 (검정) + 딱지 (펴면 뒤끝이 들림) + 점 일곱 + 가운데 이음선
  S.add(ellR(46, 48 + b, 24, 6), LB_K, { z: 0, h: 5 });
  const Lf = rot([62, 30 + b], -wg * 0.55), D = (x, y) => Lf([x, y + b]);
  const dome = (x, y) => ((x - 42) / 27) ** 2 + ((y - 40 - b) / 19) ** 2 <= 1 && y < 49 + b;
  const shell = (x, y) => { const q = rot([62, 30 + b], wg * 0.55)([x, y]); return dome(q[0], q[1]); };
  S.add(shell, LB_R, { z: 2, h: 16, prof: "round" });
  S.add((x, y) => shell(x, y) && !dome(x, y + 2.2) && dome(x, y), LB_RD, { on: 1, h: 0.3 });
  for (const [x, y, r] of [[28, 31, 3.6], [44, 27, 3.8], [53, 37, 3.4], [37, 42, 3.6], [21, 41, 3], [58, 28, 2.8], [46, 45, 2.6]]) S.add(ellR(...D(x, y), r, r * 0.92), LB_K, { on: 1, h: 0.5 });
  S.carve(capF(D(62, 24), D(60, 46), 0.45), 0.6);
  // 앞가슴 (검정 + 흰 무늬) · 머리 (흰 볼 · 곤봉 더듬이)
  const hx = 70 - gd * 6, hy = 42 + b;
  S.add(ellR(64, 38 + b, 8.6, 10.6), LB_K, { z: 5, h: 9 });
  S.add(U(ellR(66, 33 + b, 3.4, 3), ellR(68, 43 + b, 2.6, 3.2)), LB_WH, { on: 1, h: 0.5 });
  S.add(ellR(hx + 4, hy + 2, 6.4, 5.8), LB_K, { z: 6, h: 6 });
  S.add(U(ellR(hx + 2, hy - 0.6, 1.9, 1.6), ellR(hx + 7.4, hy + 0.4, 1.6, 1.4)), LB_WH, { on: 1, h: 0.4 });
  if (gd < 0.6) for (const [dx, ex, ey] of [[0, 84, 30], [2, 88, 33]]) { const a0 = [hx + 5 + dx, hy - 3]; S.add(capF(a0, [ex - gd, ey + b], 0.7, 0.6), dx ? LB_KF : LB_K, { z: dx ? 5 : 7, h: 0.6 }); S.add(ellR(ex - gd, ey + b, 1.6, 1.3), dx ? LB_KF : LB_K, { z: dx ? 5 : 7, h: 1.2 }); }
  if (!p.block && !p.hurt) S.decal(hx + 8, hy + 2.4, 0xffffff).decal(hx + 8.6, hy + 1.6, 0xffe060);
  if (gd < 0.6) for (let k = 0; k < 3; k++) leg(k, 0);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxLadybug = {
  fw: Math.round(92 * LBG), fh: Math.round(66 * LBG), w: 34, h: 24,
  anims: { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 18], rec: [3, 10, !1], hurt: [2, 10, !1], guard: [2, 4], fly: [4, 20] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.3, legs: Math.sin(ph) * 0.2 };
    if (nm === "move") P = { legs: ph * 2 };
    if (nm === "wind") P = { wings: t * 0.6, bob: t };
    if (nm === "atk" || nm === "fly") P = { wings: 1, flap: Math.sin(ph * 2), legs: 0.4, bob: -2 };
    if (nm === "guard") P = { guard: 1, bob: f * 0.4 };
    if (nm === "rec") P = { wings: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, wings: 0.15 };
    return ladybugFrame(P);
  },
};

// ════ 하늘 매 ════ 갈색 등 · 하얀 가슴 · 노란 부리와 발톱. 높이 맴돌다 날카롭게 내리꽂힌다
//   p: flap · tuck 접고 내리꽂기 · talon · tilt · hurt
const HAWK = ramp(0x8a5a32), HAWKF = rampF(0x7a4e2c), HAWKB = ramp(0xf0e4cc);
function hawkFrame(p = {}) {
  const W = 74, H = 54, S = sculpt(W, H, { k: 0.72, ax: 37 });
  const fl = p.flap ?? 0, tk = p.tuck ?? 0, tl = p.tilt ?? 0, piv = [36, 26];
  const P = (x, y) => { const dx = x - piv[0], dy = y - piv[1], c = Math.cos(tl), s = Math.sin(tl); return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c]; };
  const HK = mat(ramp(0x8a5a32), { tex: "feather", amp: 1.1, dir: 0.2 }), HKF = mat(rampF(0x6a4426), { tex: "feather", amp: 1, dir: 0.2 }), HW = mat(ramp(0xf0e4cc), { tex: "feather", amp: 0.8 }), YL = mat(ramp(0xe8c040), { spec: 0.6 });
  const wing = (far) => { const root = P(34, 21), a = -2.1 - fl * 0.8 * (1 - tk) + tk * 1 + (far ? -0.25 : 0), len = 30 - tk * 12, tip = pol(root, a, len), m = pol(root, a + 0.55, len * 0.7); S.add(polyF([root, m, lerp(m, tip, 0.5), tip, pol(root, a - 0.2, len * 0.55), P(30, 28)]), far ? HKF : HK, { z: far ? -2 : 6, h: 2 }); for (let k = 0; k < 4; k++) S.carve(capF(lerp(root, m, 0.5 + k * 0.12), lerp(root, tip, 0.6 + k * 0.1), 0.35), 0.6); };
  wing(1);
  S.add(polyF([P(22, 24), P(8, 20), P(7, 28), P(22, 28)]), HKF, { z: 0, h: 1.4 });
  for (let k = 0; k < 3; k++) S.carve(capF(P(21, 25 + k * 1.2), P(9, 22 + k * 2.6), 0.3), 0.5);
  S.add(ellR(...P(34, 26), 14, 7.4, tl), HK, { z: 1, h: 6 });
  S.add(ellR(...P(36, 29), 10, 4.2, tl), HW, { on: 1, lift: 0.3, h: 0.6 });
  for (let k = 0; k < 4; k++) S.add(capF(P(30 + k * 3, 28), P(31 + k * 3, 30), 0.5), HKF, { on: 1, lift: 0.4, h: 0.2 });
  S.add(ellR(...P(48, 21), 6, 5.4), HK, { z: 2, h: 4 });
  S.add(ellR(...P(49, 24), 4, 2.6), HW, { on: 1, lift: 0.3, h: 0.4 });
  S.add(U(polyF([P(52, 19), P(58, 21), P(56, 24), P(52, 23)])), YL, { z: 2.4, h: 1 });
  S.add(polyF([P(56, 23), P(57, 25.4), P(55, 24)]), mat(ramp(0x2a2420)), { z: 2.5, h: 0.4 });
  !p.hurt && S.decal(...P(50, 19.6), 0x101010).decal(...P(50.4, 19), 0xffd060);
  const tn = p.talon ?? 0;
  for (const d of [-1, 1]) { const r = P(36 + d * 2, 31), e = pol(r, Math.PI / 2 - tn * 0.8 + tl, 5 + tn * 4); S.add(capF(r, e, 1, 0.8), YL, { z: 3 + d * 0.1, h: 0.6 }); for (const e2 of [-0.5, 0, 0.5]) S.add(capF(e, pol(e, Math.PI / 2 - tn * 0.6 + e2 + tl, 2.4), 0.5, 0.2), mat(ramp(0x2a2420), { spec: 0.6 }), { z: 3.1, h: 0.3 }); }
  wing(0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxHawk = spec(53, 39, 22, 14,
  { idle: [4, 12], move: [4, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tuck: 0.4 * t, tilt: -0.2 * t };
    if (nm === "atk") return { tuck: 1, talon: 1, tilt: 0.6 };
    if (nm === "rec") return { flap: fl, tuck: 1 - t, tilt: 0.3 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, tilt: -0.3 };
    return { flap: fl };
  }, hawkFrame, { flying: !0 });

// ════ 비구름 정령 ════ 회색 비구름에 졸린 얼굴. 머리 위로 따라와 비를 뿌리고(젖으면 느려짐), 가끔 작은 번개
//   p: rain 빗줄기 · puffy 부풂 · spark 번개 · hurt
const CLOUD = ramp(0xb8c0d0, { cool: 0x3a4a7a, hi: 0.15 });
function rainFrame(p = {}) {
  const W = 66, H = 58, S = sculpt(W, H, { k: 0.72, ax: 33 });
  const rn = p.rain ?? 0, pf = p.puffy ?? 0, spk = p.spark ?? 0, cx = 33, cy = 22;
  const CL = mat(ramp(0xb8c0d0, { hi: 0.3 }), { tex: "fur", amp: 1.1, dir: 0 }), CLD = mat(ramp(0x6a7488), { tex: "fur", amp: 1.1, dir: 0 });
  G_puff(S, cx, cy, 22 + pf * 3, 12 + pf * 2, CL, 9, { seed: 0.7, h: 10 });
  S.add(U(ellR(cx - 10, cy + 7, 10, 4.6), ellR(cx + 6, cy + 8, 12, 4.6), ellR(cx + 16, cy + 6, 6, 4)), CLD, { z: 1.6, h: 3 });
  S.add(ellR(cx + 4, cy + 1, 7, 3.6), mat(ramp(0x8a94a8), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.6 });
  for (const x of [cx + 1, cx + 7]) S.add(capF([x - 1.6, cy], [x + 1.6, cy + 0.4], 0.7), G_VD, { on: 1, lift: 0.3, h: 0.2 });
  const C = S.render({ rim: !0 });
  const Q = G_toPx(W, H, 0.72, 33);
  if (rn > 0) for (let k = 0; k < 10; k++) { const x = cx - 18 + k * 4, y0 = cy + 12 + ((k * 5) % 7) * rn; for (let j = 0; j < 4; j++) { const q = Q(x - j * 0.4, y0 + j * 2.4 + rn * 6); C.px(q[0], q[1], j % 2 ? 0x8ab8e8 : 0xc8e0ff); } }
  if (spk) { let q = [cx + 4, cy + 10]; for (let k = 0; k < 6; k++) { const n2 = [q[0] + (k % 2 ? 3 : -3), q[1] + 4]; const a = Q(...q), b2 = Q(...n2); for (let t = 0; t <= 1; t += 0.2) C.px(Math.round(L(a[0], b2[0], t)), Math.round(L(a[1], b2[1], t)), t > 0.5 ? 0xffffff : 0xfff080); q = n2; } }
  return done3(C, p);
}
export const pxRainCloud = spec(48, 42, 24, 16,
  { idle: [4, 6], move: [4, 8], wind: [3, 10, !1], atk: [4, 12], rec: [3, 10, !1], hurt: [2, 10, !1], zap: [3, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { puffy: t };
    if (nm === "atk") return { rain: f % 2 ? 1 : 0.5, puffy: 0.6 };
    if (nm === "zap") return { spark: f === 1 ? 1 : 0, puffy: 1 };
    if (nm === "rec") return { puffy: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, puffy: -0.5 };
    return { puffy: Math.sin(ph) * 0.3 };
  }, rainFrame, { flying: !0 });

// ════ 바람개비 요정 ════ 바람개비를 든 작은 요정. 날개는 투명, 바람개비를 힘껏 돌려 돌풍을 일으킨다
//   p: spin 바람개비 각 · flap · blow 볼 부풀림 · hurt
const FAE = ramp(0xf0d8c0), FAEH = ramp(0x8ad0f0);
function pinwheelFrame(p = {}) {
  const W = 58, H = 58, S = sculpt(W, H, { k: 0.72, ax: 29 });
  const spn = p.spin ?? 0, fl = p.flap ?? 0, bl = p.blow ?? 0, cx = 26, cy = 30;
  const SKN = mat(ramp(0xf0d8c0), { tex: "skin", amp: 0.6 }), HAIR = mat(ramp(0x8ad0f0), { tex: "fur", amp: 1.2, dir: 1.2 }), DRS = mat(ramp(0x6a9ac8), { tex: "cloth", amp: 1 }), WNG = mat(ramp(0xd8f0ff, { hi: 0.7 }), { tex: "glass", amp: 1.2, spec: 1 });
  for (const [far, z] of [[1, -2], [0, 6]]) { const r = [cx - 3, cy - 6], a = -2.4 + fl * 0.5 + far * 0.3; S.add(U(ellR(...pol(r, a, 8), 9, 4.4, a), ellR(...pol(r, a + 0.9, 6), 6, 3, a + 0.9)), WNG, { z, h: 0.8 }); S.carve(capF(r, pol(r, a, 14), 0.3), 0.5); }
  // 몸 (옷) + 다리
  S.add(polyF([[cx - 4, cy - 4], [cx + 4, cy - 4], [cx + 7, cy + 10], [cx - 6, cy + 10]]), DRS, { z: 1, h: 4 });
  for (const d of [-2, 2]) S.add(capF([cx + d, cy + 10], [cx + d - 1, cy + 18], 1.2, 1), SKN, { z: d > 0 ? 2 : 0, h: 1 });
  // 머리
  const hx = cx + 1, hy = cy - 10;
  S.add(ellR(hx, hy, 5.6, 6), SKN, { z: 3, h: 4 });
  S.add(U(ellR(hx - 2, hy - 3, 6, 4.4), capF([hx - 5, hy - 2], [hx - 8, hy + 6], 2, 1)), HAIR, { z: 3.4, h: 2 });
  S.add(capF([hx - 1, hy - 6], [hx - 3, hy - 11], 0.5), mat(ramp(0x6a8aa8)), { z: 3.5, h: 0.3 });
  S.add(ellR(hx + 4.4, hy + 2.4, 1.2 + bl * 1.4, 1 + bl * 1.2), mat(ramp(0xf0b0a8), { tex: "skin" }), { z: 3.6, h: 0.6 });
  !p.hurt && S.decal(hx + 3, hy - 0.6, 0x203048);
  // 팔 + 바람개비
  const hd = [cx + 8, cy - 2];
  S.add(capF([cx + 3, cy - 3], hd, 1.4, 1.2), SKN, { z: 5, h: 1 });
  S.add(capF(hd, [hd[0] + 2, hd[1] - 14], 0.7), mat(ramp(0x8a6a4a), { tex: "wood" }), { z: 5.2, h: 0.6 });
  const pc = [hd[0] + 2, hd[1] - 15], cols = [0xf05a5a, 0xf8d040, 0x5ab0f0, 0x78c850];
  for (let k = 0; k < 4; k++) { const a = spn + k * 1.57; S.add(polyF([pc, pol(pc, a, 8), pol(pc, a + 0.9, 5)]), mat(ramp(cols[k]), { tex: "cloth", amp: 0.6, spec: 0.3 }), { z: 5.6 + k * 0.05, h: 0.6 }); }
  S.add(ellR(pc[0], pc[1], 1, 1), mat(ramp(0xe8e0d0)), { z: 6, h: 0.6 });
  const C = S.render({ rim: !0 });
  if (bl > 0.3) { const Q = G_toPx(W, H, 0.72, 29); for (let k = 0; k < 8; k++) { const q = Q(hx + 8 + k * 2.4, hy + 2 + Math.sin(k + spn) * 2); C.px(q[0], q[1], k % 2 ? 0xd8f0ff : 0xa8d0f0); } }
  return done3(C, p);
}
export const pxPinwheel = spec(42, 42, 14, 18,
  { idle: [4, 12], move: [4, 14], wind: [4, 14, !1], atk: [4, 20], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2, fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { spin: ph * 2, flap: fl, blow: t };
    if (nm === "atk") return { spin: ph * 3, flap: fl, blow: 1 };
    if (nm === "rec") return { spin: ph, flap: fl, blow: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5 };
    return { spin: ph * 0.5, flap: fl };
  }, pinwheelFrame, { flying: !0 });

// ════ [정예] 구름 고래 새끼 ════ (큰 몬스터 조각 도구) 하늘을 헤엄치는 아기 고래. 하늘색 등과 흰 주근깨 · 구름처럼 하얀 배와 주름 · 등에 실린 작은 구름. 숨구멍 물줄기 · 꼬리 내리치기
//   p: swim 꼬리 위상 · spout 물줄기 · tail 꼬리 내리침 · tilt · mouth · hurt
const WHK = 0.7;
const WH_B = mat(ramp(0x6aa8e0), { tex: "skin", amp: 0.25, spec: 0.45 }), WH_BF = mat(ramp(0x5a92c8, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.2 });
const WH_W = mat(ramp(0xf0f4fa, { cool: 0x5a6a9a }), { tex: "skin", amp: 0.15 }), WH_CL = mat(ramp(0xffffff, { cool: 0x8a9ac8 }), { tex: "fur", amp: 0.3 });
const WH_SP = mat(rampGlow(0x90d8f8)), WH_MOUTH = mat(ramp(0xc85a6e)), WH_BLUSH = mat(ramp(0xf4a8b8)), WH_EYE = mat(ramp(0x1a2a40), { spec: 0.8 });
function whaleFrame(p = {}) {
  const W = 136, H = 86, S = sculpt(W, H, { k: p.k ?? WHK, ax: 66 });
  const sw = p.swim ?? 0, R = rot([66, 52], p.tilt ?? 0), P = (x, y) => R([x, y]), tl = p.tail ?? 0, mo = p.mouth ?? 0;
  // 먼 가슴지느러미
  S.add(ellR(...P(84, 64), 8, 3.2, 0.5 + Math.sin(sw) * 0.2), WH_BF, { z: -3, h: 2.4 });
  // 꼬리자루 + 꼬리지느러미 (V자 두 잎)
  const ta = Math.sin(sw) * 0.3 + tl * 0.8, t0 = P(38, 54), t1 = pol(t0, Math.PI - ta, 18);
  S.add(capF(t0, t1, 10, 4.6), WH_B, { z: -1, h: 6 });
  for (const s of [-1, 1]) S.add(ellR(...pol(t1, Math.PI - ta + s * 0.85, 6.6), 9.6, 3.6, Math.PI - ta + s * 0.85), WH_B, { z: s > 0 ? -2 : 0.5, h: 3 });
  // 몸 (둥근 방추, 머리가 크다) + 하얀 배 + 배 주름
  S.add(U(ellR(...P(72, 50), 38, 21), ellR(...P(98, 46), 20, 20)), WH_B, { z: 0, h: 20 });
  S.add(U(ellR(...P(80, 61), 32, 10), ellR(...P(104, 55), 13, 8)), WH_W, { on: 1, h: 1.2 });
  for (let k = 0; k < 3; k++) S.carve(capF(P(70 + k * 2, 59 + k * 3), P(110 - k * 4, 54 + k * 3.6), 0.45), 0.7);
  // 숨구멍 · 흰 주근깨 · 등 구름
  S.carve(ellR(...P(82, 28), 2, 0.9), 1);
  if (!p.block) for (const [x, y] of [[90, 32], [94, 30], [98, 33], [86, 35], [102, 36]]) S.decal(...P(x, y), 0xe4f2ff);
  S.add(U(ellR(...P(56, 30), 8, 4.6), ellR(...P(64, 27), 7, 5.4), ellR(...P(71, 30), 6, 4), ellR(...P(48, 32), 5, 3.4)), WH_CL, { lift: 2, h: 4 });
  // 눈 (큰 검은 눈 + 반짝) · 볼 홍조 · 웃는 입
  S.add(ellR(...P(102, 44), 2.4, 2.9), WH_EYE, { on: 1, h: 0.6 });
  if (!p.block && !p.hurt) { const e0 = P(102, 43); S.decal(e0[0] + 0.6, e0[1] - 0.4, 0xffffff).decal(e0[0] - 0.6, e0[1] + 1.4, 0x6a8ab0); }
  S.add(ellR(...P(104, 50), 3.2, 1.7), WH_BLUSH, { on: 1, h: 0.4 });
  if (mo > 0.3) S.add(polyF([P(96, 53), P(117, 49), P(115, 51 + mo * 4), P(100, 56 + mo * 2)]), WH_MOUTH, { on: 1, h: 0.4 });
  else S.carve(U(capF(P(96, 53), P(108, 53.5), 0.5), capF(P(108, 53.5), P(116, 49.6), 0.5)), 0.9, !1);
  // 가까운 가슴지느러미
  S.add(ellR(...P(86, 64), 9.4, 3.6, 0.7 + Math.sin(sw) * 0.25), WH_B, { z: 8, h: 2.6 });
  // 숨구멍 물줄기 (방울이 위로 솟아 퍼진다)
  const sp = p.spout ?? 0;
  if (sp > 0) {
    const s0 = P(82, 26);
    for (let k = 0; k < 7; k++) { const y = s0[1] - k * 3.4 * sp, dx = (k % 2 ? 1.6 : -1.6) * (1 + k * 0.15); S.add(ellR(s0[0] + dx, y, 2.6 - k * 0.12, 2.2), WH_SP, { z: 20, h: 1.6 }); }
    sp > 0.7 && [-6, -3, 3, 6].forEach((dx, k) => S.add(ellR(s0[0] + dx, s0[1] - 22 * sp + Math.abs(dx) * 0.6, 1.6, 1.4), WH_SP, { z: 20, h: 1 }));
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxWhale = {
  fw: Math.round(136 * WHK), fh: Math.round(86 * WHK), w: 46, h: 28, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 14], rec: [3, 10, !1], hurt: [2, 10, !1], spout: [4, 10, !1], tail: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { swim: ph };
    if (nm === "wind") P = { swim: ph, tilt: -0.15 * t, mouth: t * 0.6 };
    if (nm === "atk") P = { swim: ph * 2, tilt: 0.25, mouth: 1 };
    if (nm === "spout") P = { swim: ph, spout: [0.4, 1, 1, 0.6][f], tilt: -0.1 };
    if (nm === "tail") P = { tail: [0, 1, 1.4, 0.5][f], tilt: 0.1 };
    if (nm === "rec") P = { swim: ph, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, tilt: -0.2, mouth: 0.6 };
    return whaleFrame(P);
  },
};
