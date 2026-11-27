// 웹크로프트 몬스터 12종 (조각 도구, 오른쪽을 본다) — 공동을 덮은 거미줄 · 매달린 고치 · 이슬 빛 · 잿빛 푸른 어둠
//   위 줄: 깡충거미 · 고치 망자 · 매달린 번데기 · [정예] 드라이더 기사
//   가운데 줄: 실 채집꾼 · 통거미 · 거미알 주머니 · [정예] 실에 감긴 거인
//   아래 줄: 은빛 좀벌레 · 문짝거미 · 거미 무녀 · [정예] 알 품은 타란툴라
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm } from "./px_ah.js";

const SILK = mat(ramp(0xe4e4ec), { tex: "cloth", amp: 0.7, spec: 0.3 }), SILKF = mat(rampF(0xb8b8c4), { tex: "cloth", amp: 0.6 });
const CHIT = mat(ramp(0x34303c), { tex: "metal", amp: 0.6, spec: 0.8 }), CHITF = mat(rampF(0x26222c), { tex: "metal", amp: 0.5 });
const HAIR = mat(ramp(0x4a4038), { tex: "fur", amp: 1.3, dir: 1.2 }), HAIRF = mat(rampF(0x362e28), { tex: "fur", amp: 1.1, dir: 1.2 });
const VD = mat(ramp(0x0e0c12)), DEW = mat(rampGlow(0xb8e8ff)), DEWW = mat(rampGlow(0xf0faff)), FANG = mat(ramp(0x2a1c1c), { spec: 0.8 });
const EYE = mat(ramp(0x18141e), { spec: 1 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 거미줄 가닥 (렌더 뒤) a → b, 살짝 늘어짐
function thread(C, P, a, b, sag = 2, c0 = 0xd8d8e4, c1 = 0x9a9aa8) { const n = Math.max(4, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.2)); for (let k = 0; k <= n; k++) { const t = k / n, q = P(L(a[0], b[0], t), L(a[1], b[1], t) + Math.sin(t * Math.PI) * sag); C.px(q[0], q[1], k % 4 ? c0 : c1); } }
// 거미 다리 (뿌리 → 무릎(위로) → 발끝) · 마디 세 개
function sLeg(S, root, foot, up, M, z, w = 1.6, o = {}) {
  const kn = [L(root[0], foot[0], 0.42), Math.min(root[1], foot[1]) - up], an = [L(kn[0], foot[0], 0.55), L(kn[1], foot[1], 0.4)];
  S.add(U(capF(root, kn, w, w * 0.85), capF(kn, an, w * 0.85, w * 0.7), capF(an, foot, w * 0.7, w * 0.35)), M, { z, h: w * 0.8 });
  S.add(ellR(kn[0], kn[1], w * 0.9, w * 0.9), M, { z: z + 0.05, h: w * 0.7 });
  o.band && S.add(U(capF(lerp(kn, an, 0.4), lerp(kn, an, 0.6), w * 0.9), capF(lerp(root, kn, 0.6), lerp(root, kn, 0.75), w)), o.band, { z: z + 0.1, h: w * 0.6 });
  o.hair && S.add(U(...[0.2, 0.45, 0.7].map((t) => { const q = lerp(root, kn, t); return capF(q, [q[0] + 0.6, q[1] - w * 1.4], 0.3); })), M, { z: z + 0.1, h: 0.3 });
  return kn;
}
// 거미 눈 무리 (앞을 보는 큰 눈 둘 + 작은 눈)
function eyes(S, c, s, z, glow, hurt) {
  for (const [dx, dy, r] of [[2, 0, 1.6], [-0.6, 0.4, 1.4], [0.4, -2.4, 0.8], [-2.6, -2, 0.7], [-3, 1.6, 0.6]]) {
    S.add(ellR(c[0] + dx * s, c[1] + dy * s, r * s, r * s), EYE, { z, h: r * s * 0.7 });
    !hurt && S.decal(c[0] + dx * s - r * s * 0.3, c[1] + dy * s - r * s * 0.4, glow ?? 0xc8d8e8);
  }
}

// ════ 깡충거미 ════ 손바닥만 한 털복숭이 깡충거미 · 앞을 보는 커다란 두 눈이 반짝 · 검은 털에 흰 줄 · 초록빛 금속 송곳니 · 웅크렸다 훌쩍 뛴다
//   p: legs(ph) · crouch · leap · hurt
const JPK = 0.72;
function jumperFrame(p = {}) {
  const W = 80, H = 52, G = H - 1, S = sculpt(W, H, { k: JPK, ax: 38 });
  const ph = p.ph ?? 0, cr = p.crouch ?? 0, lp = p.leap ?? 0, cx = 36, by = G - 12 + cr * 4 - lp * 6;
  const legs = [[16, 0.9], [8, 0.3], [-2, -0.3], [-12, -0.9]];
  // 먼 다리
  legs.forEach(([dx, s], k) => { const r = [cx + dx * 0.3, by - 1], f = [cx + dx + s * 4 + Math.sin(ph + k) * (p.walk ? 3 : 0) + lp * (k < 2 ? 8 : -8), G - 1 - lp * 6]; sLeg(S, r, f, 6 - cr * 3, HAIRF, -2 - k * 0.1, 1.6); });
  // 배 (뒤)
  S.add(ellR(cx - 10, by - 1, 10, 7.4), HAIR, { z: 1, h: 7 });
  for (const [x, y] of [[-14, -4], [-8, -5], [-12, 1]]) S.add(ellR(cx + x, by + y, 2.2, 1.2), mat(ramp(0xe0d8d0), { tex: "fur" }), { on: 1, lift: 0.4, h: 0.4 });
  S.add(capF([cx - 18, by - 1], [cx - 4, by - 2], 0.8), mat(ramp(0xc8c0b8), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  // 머리가슴 (각진 상자 · 앞 눈)
  S.add(U(ellR(cx + 6, by - 3, 9, 7.4), polyF([[cx + 6, by - 10], [cx + 15, by - 8], [cx + 15, by + 3], [cx + 6, by + 4]])), HAIR, { z: 2, h: 7 });
  S.add(capF([cx + 2, by - 9], [cx + 12, by - 9], 1), mat(ramp(0xe0d8d0), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  eyes(S, [cx + 14, by - 4], 1.4, 3, 0xe0f0ff, p.hurt);
  // 송곳니 (초록 금속)
  S.add(U(capF([cx + 13, by + 1], [cx + 15, by + 5 + (p.bite ?? 0) * 2], 1.6, 1)), mat(ramp(0x3a7a6a), { tex: "metal", spec: 1 }), { z: 3.4, h: 1.2 });
  // 더듬이 다리 (촉지)
  S.add(capF([cx + 13, by + 2], [cx + 18, by + 5 - (p.bite ?? 0) * 3], 1, 0.8), HAIR, { z: 3.6, h: 0.8 });
  // 가까운 다리
  legs.forEach(([dx, s], k) => { const r = [cx + dx * 0.3 + 2, by + 1], f = [cx + dx + 2 + s * 6 + Math.sin(ph + k + 2) * (p.walk ? 3 : 0) + lp * (k < 2 ? 10 : -10), G - 1 - lp * 6]; sLeg(S, r, f, 7 - cr * 3, HAIR, 4 + k * 0.1, 1.9, { band: mat(ramp(0xc8c0b8), { tex: "fur" }) }); });
  return fin(S.render({ rim: !0 }), p);
}
export const pxJumper = {
  fw: Math.round(80 * JPK), fh: Math.round(52 * JPK), w: 20, h: 14,
  anims: { idle: [4, 5], move: [6, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, crouch: Math.sin(ph) * 0.2 };
    if (nm === "move") P = { ph: ph * 2, walk: 1 };
    if (nm === "wind") P = { ph, crouch: t };
    if (nm === "atk") P = { ph, leap: [1, 0.8, 0.3][f], bite: [0, 1, 1][f] };
    if (nm === "rec") P = { ph, crouch: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, crouch: 0.6 };
    return jumperFrame(P);
  },
};

// ════ 고치 망자 ════ 거미줄에 감겨 말라 죽은 탐험가가 일어나 걷는다 · 온몸을 감은 실 · 한쪽 팔만 뼈가 드러났다 · 끌리는 실 자락 · 고치 틈으로 보이는 눈빛
//   p: legs · bob · sw · spit · hurt
const HKK = 0.72;
function huskFrame(p = {}) {
  const W = 90, H = 92, G = H - 1, S = sculpt(W, H, { k: HKK, ax: 38 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 36;
  const BONE = mat(ramp(0xc8bca0), { tex: "stone", amp: 0.5 });
  // 다리 (실로 감긴 · 끌림)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 4]]) { const hp = [cx + d, 62 + b], ft = [cx + d + o[0], G - 2 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 2, L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 4.4, 3.8), capF(kn, ft, 3.8, 3)), far ? SILKF : SILK, { z: far ? -2 : 3, h: 3 }); for (let k = 0; k < 4; k++) S.carve(capF(lerp(hp, ft, 0.15 + k * 0.22), [lerp(hp, ft, 0.15 + k * 0.22)[0] + 5, lerp(hp, ft, 0.15 + k * 0.22)[1] - 2], 0.4), 0.7); S.add(ellR(ft[0] + 2, ft[1], 4.4, 1.8), far ? SILKF : SILK, { z: far ? -1.9 : 3.1, h: 1.4 }); }
  // 먼 팔 (실에 묶여 몸에 붙음)
  S.add(capF([cx - 7, 38 + b], [cx - 6, 58 + b], 3.6, 3), SILKF, { z: -1, h: 2.4 });
  // 몸 (고치 · 감긴 결)
  S.add(U(ellR(cx, 46 + b, 11, 16), ellR(cx - 1, 60 + b, 9, 6)), SILK, { z: 1, h: 10 });
  for (let k = 0; k < 8; k++) S.carve(capF([cx - 11, 34 + k * 4 + b], [cx + 11, 31 + k * 4.4 + b], 0.45), 0.8);
  S.add(ellR(cx + 4, 46 + b, 3, 4), mat(ramp(0x6a5a48), { tex: "leather" }), { on: 1, lift: 0.3, h: 0.6 });
  S.add(capF([cx - 9, 50 + b], [cx + 10, 46 + b], 1.2), mat(ramp(0x5a4030), { tex: "leather" }), { on: 1, lift: 0.4, h: 0.6 });
  // 끌리는 실 자락
  S.add(polyF([[cx - 8, 56 + b], [cx - 22, G - 1], [cx - 14, G - 1], [cx - 4, 64 + b]]), SILKF, { z: 0.5, h: 2 });
  // 머리 (실 감긴 · 눈 틈)
  const hx = cx + 4, hy = 26 + b;
  S.add(U(ellR(hx, hy, 8, 8.4), ellR(hx - 3, hy - 4, 6, 5)), SILK, { z: 3, h: 6 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx - 8, hy - 6 + k * 4], [hx + 8, hy - 8 + k * 4.6], 0.4), 0.8);
  S.add(capF([hx + 2, hy - 1], [hx + 8, hy - 1.6], 1.2), VD, { z: 3.4, lift: 0.1, h: 0.3 });
  !p.hurt && S.decal(hx + 5, hy - 1.4, 0xb8e8ff).decal(hx + 3, hy - 1.2, 0x6a9ab8);
  S.add(ellR(hx + 6, hy + 5 + (p.spit ?? 0) * 1.6, 2, 1 + (p.spit ?? 0) * 1.4), VD, { z: 3.4, lift: 0.1, h: 0.3 });
  // 가까운 팔 (드러난 뼈 · 갈고리 손)
  const sh = [cx + 7, 38 + b], hd = sw <= 1 ? lerp([cx + 12, 60 + b], pol(sh, -1.6, 18), sw) : lerp(pol(sh, -1.6, 18), [cx + 26, 52 + b], Math.min(1, sw - 1));
  const el = ik(sh, hd, 10, 10, 1);
  S.add(capF(sh, lerp(sh, el, 0.8), 3.6, 3), SILK, { z: 6, h: 2.4 });
  S.add(U(capF(el, hd, 1.4, 1.2), ellR(el[0], el[1], 1.8, 1.8)), BONE, { z: 6.2, h: 1 });
  for (const e of [-0.5, 0, 0.5]) S.add(capF(hd, pol(hd, (sw > 1 ? 0.6 : 1.3) + e, 4.4), 0.6, 0.3), BONE, { z: 6.4, h: 0.4 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, HKK, 38);
  thread(C, P, [cx - 6, 36 + b], [cx - 30, 10], 4), thread(C, P, [hx - 4, hy - 6], [hx - 14, 0], 2);
  return fin(C, p);
}
export const pxHusk = {
  fw: Math.round(90 * HKK), fh: Math.round(92 * HKK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], spit: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait2(f, n, 4, 1.2); P = { legs: g, bob: g.bob + Math.sin(ph) * 1 }; }
    if (nm === "wind") P = { sw: t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { sw: 2 * (1 - t) };
    if (nm === "spit") P = { spit: [0.4, 1, 0.6][f], bob: -1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return huskFrame(P);
  },
};

// ════ 매달린 번데기 ════ 천장에서 실 한 가닥에 매달린 거대 번데기 · 갈라진 껍질 틈으로 나온 굶주린 유충 머리 · 집게턱 · 껍질에 맺힌 이슬
//   p: ph · open · drop · hurt
const PPK = 0.72;
function pupaFrame(p = {}) {
  const W = 60, H = 84, S = sculpt(W, H, { k: PPK, ax: 30 });
  const ph = p.ph ?? 0, op = p.open ?? 0, sw = Math.sin(ph) * 2, cx = 30 + sw, cy = 56;
  const SHELL = mat(ramp(0x8a7a68), { tex: "leather", amp: 1.1, spec: 0.4 }), SHELLF = mat(rampF(0x6a5c4e), { tex: "leather", amp: 1 });
  // 고치 몸 (마디 · 껍질)
  S.add(U(ellR(cx, cy, 11, 18), ellR(cx, cy + 14, 7, 9), capF([cx, cy + 20], [cx - 1, cy + 27], 3, 1)), SHELL, { z: 1, h: 10 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 11, cy - 10 + k * 6], [cx + 11, cy - 9 + k * 6.4], 0.5), 0.9);
  // 갈라진 틈 (가운데) + 유충 머리
  S.add(polyF([[cx + 2, cy - 14 - op * 4], [cx + 9 + op * 4, cy - 6], [cx + 8, cy + 6], [cx + 1, cy + 2]]), VD, { z: 1.2, lift: 0.3, h: 0.6 });
  const gh = [cx + 6 + op * 6, cy - 4 + op * 2];
  S.add(ellR(gh[0], gh[1], 5 + op, 5.4 + op), mat(ramp(0xd8c8a0), { tex: "skin", amp: 0.8, spec: 0.5 }), { z: 2, h: 4 });
  S.carve(capF([gh[0] - 4, gh[1] - 1], [gh[0] + 4, gh[1] - 2], 0.4), 0.6);
  for (const d of [-1, 1]) S.add(capF([gh[0] + 3, gh[1] + 2 + d * 1.4], pol([gh[0] + 3, gh[1] + 2 + d * 1.4], 0.3 + d * (0.4 + op * 0.4), 5), 1.2, 0.4), FANG, { z: 2.4 + d * 0.1, h: 0.6 });
  !p.hurt && S.decal(gh[0] + 1.4, gh[1] - 2, 0x101010).decal(gh[0] + 3, gh[1] - 2.4, 0x101010);
  // 이슬
  for (const [x, y] of [[-6, -6], [-8, 6], [-3, 16]]) S.add(ellR(cx + x, cy + y, 1.4, 1.6), DEW, { on: 1, lift: 0.6, h: 0.8 });
  // 실을 문 꼭지
  S.add(capF([cx, cy - 18], [cx, cy - 22], 2, 1), SHELLF, { z: 1.1, h: 1 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, PPK, 30);
  thread(C, P, [cx, cy - 22], [30, 0], 0, 0xe8e8f0, 0xc0c0cc);
  for (let k = 0; k < 3; k++) { const q = P(cx - 4 + k * 4, cy + 30 + ((ph * 5 + k * 4) % 12)); C.px(q[0], q[1], 0xb8e8ff); }
  return fin(C, p);
}
export const pxPupa = {
  fw: Math.round(60 * PPK), fh: Math.round(84 * PPK), w: 16, h: 30, flying: !0,
  anims: { idle: [6, 4], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, open: 0.2 };
    if (nm === "wind") P = { ph: ph * 2, open: t };
    if (nm === "atk") P = { ph, open: [1, 1, 0.7][f] };
    if (nm === "rec") P = { ph, open: 1 - t * 0.8 };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3, open: 0.6 };
    return pupaFrame(P);
  },
};

// ════ [정예] 드라이더 기사 ════ 허리 아래는 거대한 검은 거미, 위는 갑주 입은 기사 · 실 감은 창 · 거미 눈 박힌 투구 · 배에 이슬 맺힌 은빛 무늬 ·
//   창으로 꿰뚫고, 거미줄을 쏘고, 뒤로 높이 뛴다
//   p: ph · walk · sw(창) · rear · hurt
const DRK = 0.66;
function driderFrame(p = {}) {
  const W = 214, H = 150, G = H - 1, S = sculpt(W, H, { k: DRK, ax: 90 });
  const ph = p.ph ?? 0, wk = p.walk ?? 0, sw = p.sw ?? 0, rr = p.rear ?? 0, cx = 76, by = G - 30 - rr * 6;
  const legs = [[70, 1], [36, 0.5], [-30, -0.2], [-66, -0.9]];
  const legStep = (k, far) => { const s = Math.sin(ph * 2 + k * 1.6 + far * Math.PI); return [wk * s * 8, wk * Math.max(0, -s) * 6]; };
  legs.forEach(([dx, s], k) => { const st = legStep(k, 1); sLeg(S, [cx + dx * 0.12, by - 4], [cx + dx * 0.85 + st[0] + (k === 0 ? rr * 14 : 0), G - 1 - st[1] - (k === 0 ? rr * 24 : 0)], 36, CHITF, -4 - k * 0.1, 3.6); });
  // 배 (뒤 · 은빛 무늬)
  const ab = [cx - 36, by - 10];
  S.add(ellR(ab[0], ab[1], 28, 22), CHIT, { z: 1, h: 18 });
  for (let k = 0; k < 4; k++) S.add(polyF([[ab[0] - 16 + k * 8, ab[1] - 8], [ab[0] - 12 + k * 8, ab[1] - 2], [ab[0] - 16 + k * 8, ab[1] + 4], [ab[0] - 20 + k * 8, ab[1] - 2]]), mat(ramp(0xc8d0d8), { spec: 0.8 }), { on: 1, lift: 0.5, h: 0.6 });
  for (const [x, y] of [[-10, -14], [6, -12], [-2, 8]]) S.add(ellR(ab[0] + x, ab[1] + y, 1.6, 1.8), DEW, { on: 1, lift: 0.8, h: 1 });
  S.add(capF([ab[0] - 26, ab[1] + 4], [ab[0] - 32, ab[1] + 10], 2.4, 1), CHITF, { z: 0.8, h: 1.4 });
  // 거미 몸통 (머리가슴)
  S.add(ellR(cx + 4, by - 6, 18, 13), CHIT, { z: 2, h: 11 });
  // 사람 상반신 (갑주)
  const tx = cx + 14, ty = by - 50 - rr * 8;
  S.add(U(ellR(tx, ty + 8, 13, 15), polyF([[tx - 10, ty + 16], [tx + 10, ty + 16], [tx + 9, ty + 34], [tx - 9, ty + 34]])), CHIT, { z: 9.5, h: 9 });
  S.add(polyF([[tx - 11, ty + 26], [tx + 11, ty + 26], [tx + 13, ty + 40], [tx - 13, ty + 40]]), mat(ramp(0x4a4654), { tex: "metal", spec: 0.6 }), { z: 9.6, h: 3 });
  for (let k = 0; k < 4; k++) S.carve(capF([tx - 9, ty + 12 + k * 4], [tx + 9, ty + 11 + k * 4], 0.4), 0.7);
  S.add(ellR(tx, ty + 2, 12, 6), mat(ramp(0x4a4654), { tex: "metal", spec: 0.7 }), { z: 9.8, h: 3 });
  // 실 망토
  S.add(polyF([[tx - 8, ty], [tx - 2, ty], [tx - 14, ty + 40], [tx - 28, ty + 36]]), SILK, { z: 9.2, h: 3 });
  for (let k = 0; k < 3; k++) S.carve(capF([tx - 6 - k * 2, ty + 4], [tx - 16 - k * 4, ty + 30], 0.4), 0.7);
  // 먼 팔 (방패 대신 실 감은 손)
  const shF = [tx - 8, ty + 4];
  S.add(U(capF(shF, [tx - 4, ty + 18], 3.4, 3), capF([tx - 4, ty + 18], [tx + 6, ty + 22], 3, 2.6)), CHITF, { z: 9, h: 2.4 });
  // 투구 (거미 눈 · 뿔 장식)
  const hx = tx + 3, hy = ty - 10;
  S.add(U(ellR(hx, hy, 8, 8.6), polyF([[hx - 8, hy + 2], [hx + 8, hy + 2], [hx + 7, hy + 10], [hx - 7, hy + 10]])), CHIT, { z: 10, h: 6 });
  for (const [d, z] of [[-1, 9.8], [1, 10.4]]) S.add(capF([hx - 2 + d * 2, hy - 6], [hx - 8 + d * 3, hy - 18], 1.6, 0.4), CHITF, { z, h: 1 });
  for (const [x, y, r] of [[5, -1, 1.4], [3, 2, 1.2], [6.6, 2.2, 0.9], [1, -2, 0.8]]) { S.add(ellR(hx + x, hy + y, r, r), EYE, { z: 10.6, h: 0.6 }); !p.hurt && S.decal(hx + x - 0.3, hy + y - 0.3, 0xd8f0ff); }
  // 가까운 다리
  legs.forEach(([dx, s], k) => { const st = legStep(k, 0); sLeg(S, [cx + dx * 0.12 + 4, by - 2], [cx + dx + 6 + st[0] + (k === 0 ? rr * 16 : 0), G - 1 - st[1] - (k === 0 ? rr * 28 : 0)], 40, CHIT, 8 + k * 0.1, 4, { band: mat(ramp(0x8a8898), { tex: "metal", spec: 0.6 }) }); });
  // 가까운 팔 + 창
  const sh = [tx + 8, ty + 4], hd = sw <= 1 ? lerp([tx + 14, ty + 20], [tx + 2, ty + 10], sw) : lerp([tx + 2, ty + 10], [tx + 32, ty + 14], Math.min(1, sw - 1));
  const sa = sw <= 1 ? L(0.25, 0.05, sw) : L(0.05, 0.08, sw - 1);
  arm(S, sh, hd, 0, { M: CHIT, MF: CHITF, l: 12, z: 12 });
  const t0 = pol(hd, sa, -36), t1 = pol(hd, sa, 50);
  S.add(capF(t0, t1, 1.4, 1.2), mat(ramp(0x3a3040), { tex: "wood" }), { z: 12.6, h: 1 });
  for (let k = 0; k < 5; k++) S.add(capF(pol(hd, sa, 6 + k * 4), pol(hd, sa, 8 + k * 4), 1.8), SILK, { z: 12.7, h: 1 });
  S.add(polyF([pol(t1, sa + 1.57, 2.6), pol(t1, sa, 16), pol(t1, sa - 1.57, 2.6), pol(t1, sa, -2)]), mat(ramp(0xb8c0d0), { tex: "metal", spec: 0.9 }), { z: 12.8, h: 1.4, prof: "sharp" });
  return fin(S.render({ rim: !0 }), p);
}
export const pxDrider = {
  fw: Math.round(214 * DRK), fh: Math.round(150 * DRK), w: 60, h: 64,
  anims: { idle: [4, 4], move: [6, 8], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], rear: [4, 8, !1], web: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, walk: 1 };
    if (nm === "wind") P = { ph, sw: t };
    if (nm === "atk") P = { ph, sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { ph, sw: 2 * (1 - t) };
    if (nm === "rear") P = { ph, rear: t, sw: 0.5 * t };
    if (nm === "web") P = { ph, rear: [0.6, 0.2, 0][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph, rear: 0.3 };
    return driderFrame(P);
  },
};

// ════ 실 채집꾼 ════ 거미줄을 거둬 파는 동굴 사람 · 실로 겹겹이 감싼 옷 · 이슬 맺힌 둥근 안경 · 등에 커다란 실 감개 · 갈고리 장대
//   p: legs · bob · sw · hook · hurt
const HVK = 0.72;
function harvesterFrame(p = {}) {
  const W = 120, H = 96, G = H - 1, S = sculpt(W, H, { k: HVK, ax: 42 });
  const b = p.bob ?? 0, sw = p.sw ?? 0, hk = p.hook ?? 0, cx = 38;
  const CL = mat(ramp(0x8a8a90), { tex: "cloth", amp: 1.1 }), CLF = mat(rampF(0x6a6a72), { tex: "cloth", amp: 1 });
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: CL, hurt: p.hurt,
    legO: { thigh: CL, thighF: CLF, shin: SILK, shinF: SILKF, boot: mat(ramp(0x4a3a30), { tex: "leather" }), bootF: mat(rampF(0x3a2e26), { tex: "leather" }), knee: !1 },
    back: () => {
      // 실 감개 (등)
      const sp = [cx - 14, 40 + b];
      S.add(capF([sp[0], sp[1] - 14], [sp[0], sp[1] + 14], 2), mat(ramp(0x5a4030), { tex: "wood" }), { z: -1, h: 1.4 });
      S.add(U(ellR(sp[0], sp[1], 9, 12)), SILK, { z: -0.6, h: 7 });
      for (let k = 0; k < 6; k++) S.carve(capF([sp[0] - 9, sp[1] - 10 + k * 4], [sp[0] + 9, sp[1] - 9 + k * 4], 0.35), 0.6);
      for (const y of [-14, 14]) S.add(ellR(sp[0], sp[1] + y, 7, 2), mat(ramp(0x5a4030), { tex: "wood" }), { z: 0, h: 1.4 });
    },
    head: (hx, hy) => {
      S.add(U(ellR(hx, hy + 1, 7, 7.4)), SILK, { z: 4, h: 5 });
      for (let k = 0; k < 4; k++) S.carve(capF([hx - 7, hy - 4 + k * 3.4], [hx + 7, hy - 5 + k * 3.6], 0.35), 0.6);
      S.add(capF([hx - 5, hy - 0.6], [hx + 6, hy - 0.6], 1), mat(ramp(0x4a3a30), { tex: "leather" }), { z: 4.6, h: 0.6 });
      for (const x of [hx + 3, hx + 6.4]) { S.add(ellR(x, hy - 0.6, 2, 2), mat(ramp(0x8a6a3a), { tex: "metal", spec: 0.8 }), { z: 4.8, h: 1 }); S.add(ellR(x, hy - 0.6, 1.3, 1.3), DEW, { z: 5, h: 0.6 }); }
    },
  });
  arm(S, sol.S1, [cx - 2 + sw * 3, 60 + b], 1, { M: CLF, MF: CLF, z: -2 });
  // 허리 낫
  S.add(capF([cx - 6, 64 + b], [cx - 2, 72 + b], 0.8), mat(ramp(0x5a4030), { tex: "wood" }), { z: 3.5, h: 0.6 });
  // 가까운 팔 + 갈고리 장대
  const sh = sol.S0, hd = sw <= 1 ? lerp([cx + 12, 56 + b], [cx + 4, 38 + b], sw) : lerp([cx + 4, 38 + b], [cx + 22, 56 + b], Math.min(1, sw - 1)), hdX = hk ? lerp([cx + 12, 56 + b], [cx + 22, 48 + b], hk) : hd;
  const pa = hk ? L(-0.6, -0.15, hk) : sw <= 1 ? L(-0.9, -2.2, sw) : L(-2.2, 0.2, Math.min(1, sw - 1));
  const t0 = pol(hdX, pa, -16), t1 = pol(hdX, pa, 44);
  S.add(capF(t0, t1, 1, 0.9), mat(ramp(0x6a5040), { tex: "wood" }), { z: 7.6, h: 0.8 });
  const hn = pa + Math.PI / 2;
  S.add(U(capF(t1, pol(t1, pa, 4), 1), capF(pol(t1, pa, 4), pol(pol(t1, pa, 4), hn, 6), 1, 0.7), capF(pol(pol(t1, pa, 4), hn, 6), pol(pol(t1, pa, 0), hn, 8), 0.7, 0.3)), mat(ramp(0x8a8a90), { tex: "metal", spec: 0.7 }), { z: 7.7, h: 0.8 });
  for (let k = 0; k < 3; k++) S.add(capF(pol(t1, pa, -4 - k * 5), pol(pol(t1, pa, -6 - k * 5), hn, -2), 0.6), SILK, { z: 7.8, h: 0.4 });
  arm(S, sh, hdX, 0, { M: CL, MF: CLF });
  return fin(S.render({ rim: !0 }), p);
}
export const pxHarvester = {
  fw: Math.round(120 * HVK), fh: Math.round(96 * HVK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 9], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], hook: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 5, 2.2); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { sw: t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { sw: 2 * (1 - t) };
    if (nm === "hook") P = { hook: [0.3, 1, 1, 0.4][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return harvesterFrame(P);
  },
};

// ════ 통거미 ════ 콩알만 한 둥근 몸이 높이 걸린 장님거미 · 실처럼 가늘고 긴 여덟 다리 · 높은 무릎 · 몸 가운데 솟은 눈 둔덕 · 다리 하나를 들어 찌른다
//   p: ph · walk · stab · hurt
const HMK = 0.72;
function harvestmanFrame(p = {}) {
  const W = 110, H = 86, G = H - 1, S = sculpt(W, H, { k: HMK, ax: 55 });
  const ph = p.ph ?? 0, wk = p.walk ?? 0, st = p.stab ?? 0, cx = 55, by = 30 + Math.sin(ph * 2) * 1.4 * (wk ? 1 : 0.4) - st * 4;
  const LG = mat(ramp(0x6a5a48), { tex: "skin", amp: 0.6, spec: 0.3 }), LGF = mat(rampF(0x4a3e32), { tex: "skin" });
  const ft = [[-44, 0], [-26, 1], [24, 2], [44, 3]];
  for (const far of [1, 0]) ft.forEach(([dx, k]) => {
    const s = Math.sin(ph * 2 + k * 1.7 + far * Math.PI), f = [cx + dx * (far ? 0.8 : 1) + wk * s * 6, G - 1 - wk * Math.max(0, -s) * 5];
    if (!far && k === 3 && st > 0) { f[0] = cx + 30 + st * 12, f[1] = by + 10 - st * 10; }
    const r = [cx + (dx > 0 ? 2 : -2), by + 1], kn = [L(r[0], f[0], 0.35), by - 22 - Math.abs(dx) * 0.1];
    S.add(U(capF(r, kn, 1, 0.8), capF(kn, f, 0.8, 0.5)), far ? LGF : LG, { z: far ? -2 : 4, h: 0.6 });
    S.add(ellR(kn[0], kn[1], 1.2, 1.2), far ? LGF : LG, { z: far ? -1.9 : 4.1, h: 0.6 });
  });
  S.add(ellR(cx, by, 8, 6), mat(ramp(0x8a6a48), { tex: "leather", amp: 1, spec: 0.5 }), { z: 1, h: 6 });
  S.add(ellR(cx - 2, by + 1, 5, 3), mat(ramp(0x5a4030), { tex: "leather" }), { on: 1, lift: 0.3, h: 0.6 });
  S.add(ellR(cx + 3, by - 5, 2, 2), mat(ramp(0x3a2a20)), { z: 2, h: 1.6 });
  !p.hurt && S.decal(cx + 4, by - 5.6, 0xe8f0f0).decal(cx + 2, by - 5.6, 0xe8f0f0);
  S.add(U(capF([cx + 6, by + 2], [cx + 10, by + 6], 1, 0.6), capF([cx + 6, by + 3], [cx + 9, by + 8], 0.8, 0.5)), LG, { z: 2.2, h: 0.6 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxHarvestman = {
  fw: Math.round(110 * HMK), fh: Math.round(86 * HMK), w: 20, h: 30,
  anims: { idle: [6, 4], move: [6, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, walk: 1 };
    if (nm === "wind") P = { ph, stab: -0.3 * t };
    if (nm === "atk") P = { ph, stab: [0.7, 1, 1][f] };
    if (nm === "rec") P = { ph, stab: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return harvestmanFrame(P);
  },
};

// ════ 거미알 주머니 ════ 바위에 실로 붙들어 맨 커다란 알 주머니 · 비치는 알마다 희미한 빛 · 겉을 기어 다니는 새끼 거미 · 숨 쉬듯 부풀었다 꺼진다
//   p: ph · swell · burst · hurt
const ESK = 0.72;
function eggsacFrame(p = {}) {
  const W = 66, H = 64, G = H - 1, S = sculpt(W, H, { k: ESK, ax: 33 });
  const ph = p.ph ?? 0, sl = p.swell ?? 0, bs = p.burst ?? 0, cx = 33, r = 18 + Math.sin(ph) * 0.8 + sl * 3, cy = G - r - 2;
  S.add(ellR(cx, G - 2, 20, 3), mat(ramp(0x4a4a56), { tex: "stone", amp: 1.2 }), { z: -1, h: 2 });
  S.add(ellR(cx, cy, r, r * 0.96), SILK, { z: 1, h: r * 0.8 });
  for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = r * (0.35 + ((k * 5) % 6) / 10), q = [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]; S.add(ellR(q[0], q[1], 2.4 + sl * 0.4, 2.2 + sl * 0.4), k % 3 ? mat(ramp(0xd8d0b8), { spec: 0.6 }) : DEW, { on: 1, lift: 0.8, h: 1.2 }); }
  for (let k = 0; k < 5; k++) S.carve(capF(pol([cx, cy], k * 1.25, 4), pol([cx, cy], k * 1.25 + 0.4, r), 0.4), 0.5);
  if (bs > 0) S.add(polyF([[cx + 2, cy - 8], [cx + 10 + bs * 4, cy - 2], [cx + 6, cy + 8], [cx - 2, cy + 2]]), VD, { on: 1, lift: 0.2, h: 0.6 });
  // 새끼 거미 (겉에서 기어다님)
  for (let k = 0; k < 3; k++) { const a = ph * (k % 2 ? 1 : -1) + k * 2.1, q = [cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1) * 0.9]; S.add(ellR(q[0], q[1], 1.6, 1.3), CHIT, { z: 5, h: 0.8 }); for (const d of [-1, 1]) S.add(capF(q, [q[0] + d * 2.4, q[1] + 1.4], 0.35), CHIT, { z: 5, h: 0.3 }); }
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, ESK, 33);
  for (const [a, b2] of [[[cx - r * 0.7, cy - r * 0.6], [cx - 30, 4]], [[cx + r * 0.6, cy - r * 0.7], [cx + 30, 2]], [[cx - r, cy + 4], [cx - 33, G - 6]], [[cx + r, cy + 2], [cx + 33, G - 10]]]) thread(C, P, a, b2, 1.4);
  return fin(C, p);
}
export const pxEggsac = {
  fw: Math.round(66 * ESK), fh: Math.round(64 * ESK), w: 26, h: 26,
  anims: { idle: [6, 4], move: [6, 4], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph: ph * 2, swell: t };
    if (nm === "atk") P = { ph, swell: 1 - t * 0.6, burst: [0.4, 1, 0.8][f] };
    if (nm === "rec") P = { ph, swell: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, swell: -0.4 };
    return eggsacFrame(P);
  },
};

// ════ [정예] 실에 감긴 거인 ════ 거미 떼에게 산 채로 감겨 꼭두각시가 된 동굴 거인 · 머리부터 발끝까지 두꺼운 실 · 실 틈으로 드러난 잿빛 살과 한쪽 눈 ·
//   등을 뚫고 나온 기생 거미 다리 넷 · 실 덩이가 된 주먹
//   p: legs · bob · sw · stab · hurt
const BGK = 0.66;
function boundFrame(p = {}) {
  const W = 180, H = 146, G = H - 1, S = sculpt(W, H, { k: BGK, ax: 76 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, stb = p.stab ?? 0, cx = 72;
  const SKN = mat(ramp(0x8a8a88), { tex: "skin", amp: 1 });
  // 등의 기생 거미 다리 (뒤쪽 둘)
  const backLeg = (k, far) => { const r = [cx - 10 + k * 6, 46 + b], a = -2.3 + k * 0.35 + Math.sin((p.ph ?? 0) + k) * 0.06 + stb * (k > 1 ? 1.3 : 0.4), kn = pol(r, a, 26), tp = pol(kn, a + (stb && k > 1 ? 0.2 : 1.4), 28); S.add(U(capF(r, kn, 3, 2.6), capF(kn, tp, 2.6, 0.6)), far ? CHITF : CHIT, { z: far ? -3 : 0.5, h: 2 }); S.add(ellR(kn[0], kn[1], 3, 3), far ? CHITF : CHIT, { z: far ? -2.9 : 0.6, h: 2 }); };
  backLeg(0, 1), backLeg(1, 1);
  // 다리
  for (const [o, far, d] of [[g.f, 1, -12], [g.n, 0, 12]]) { const hp = [cx + d * 0.6, 94 + b], ft = [cx + d + o[0], G - 4 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 4, L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 12, 10), capF(kn, ft, 10, 8)), far ? SILKF : SILK, { z: far ? -3 : 3, h: 8 }); for (let k = 0; k < 5; k++) { const q = lerp(hp, ft, 0.1 + k * 0.2); S.carve(capF([q[0] - 10, q[1] + 2], [q[0] + 10, q[1] - 3], 0.5), 0.8); } S.add(ellR(ft[0] + 4, ft[1] + 1, 12, 4), far ? SILKF : SILK, { z: far ? -2.9 : 3.1, h: 3 }); }
  // 먼 팔
  const shF = [cx - 20, 50 + b], hF = [cx - 22 + Math.sin(sw) * 4, 92 + b];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 10, 9), capF(lerp(shF, hF, 0.5), hF, 9, 10)), SILKF, { z: -2, h: 7 });
  // 몸 (구부정 · 실 결)
  S.add(U(ellR(cx, 66 + b, 30, 30), ellR(cx - 6, 46 + b, 26, 18)), SILK, { z: 1, h: 22 });
  for (let k = 0; k < 10; k++) S.carve(capF([cx - 30, 40 + k * 6 + b], [cx + 30, 34 + k * 6.6 + b], 0.55), 0.9);
  // 드러난 살 (찢긴 틈)
  S.add(polyF([[cx + 6, 54 + b], [cx + 22, 58 + b], [cx + 18, 76 + b], [cx + 4, 70 + b]]), SKN, { on: 1, lift: -0.6, h: 0.6 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx + 8, 60 + k * 5 + b], [cx + 18, 62 + k * 5 + b], 0.4), 0.5);
  for (const [x, y] of [[-14, 52], [-4, 82], [16, 88], [-20, 70]]) S.add(ellR(cx + x, y + b, 1.6, 1.8), DEW, { on: 1, lift: 0.8, h: 0.8 });
  // 머리 (앞으로 숙임 · 실 감긴 · 한쪽 눈)
  const hx = cx + 24, hy = 34 + b;
  S.add(U(ellR(hx, hy, 14, 13), ellR(hx + 6, hy + 8, 9, 6)), SILK, { z: 3, h: 9 });
  for (let k = 0; k < 6; k++) S.carve(capF([hx - 14, hy - 10 + k * 4.4], [hx + 14, hy - 13 + k * 4.8], 0.45), 0.8);
  S.add(ellR(hx + 7, hy - 1, 5, 4), SKN, { z: 3.4, lift: 0.2, h: 1 });
  S.add(ellR(hx + 8, hy - 1, 2.4, 2), mat(ramp(0xd8d0b0), { spec: 0.7 }), { z: 3.6, h: 0.8 });
  !p.hurt && S.decal(hx + 9, hy - 1, 0x3a2a20);
  // 정수리의 기생 거미 (조종자)
  const sp = [hx - 4, hy - 13];
  S.add(ellR(sp[0], sp[1], 6, 4.4), CHIT, { z: 4, h: 4 });
  S.add(ellR(sp[0] + 6, sp[1], 3.6, 3), CHIT, { z: 4.2, h: 3 });
  for (const d of [-3, -1, 1, 3]) S.add(capF([sp[0] + d, sp[1] + 2], [sp[0] + d * 2.4, sp[1] + 8], 0.7, 0.4), CHITF, { z: 3.9, h: 0.5 });
  !p.hurt && S.decal(sp[0] + 8, sp[1] - 1, 0xd8f0ff).decal(sp[0] + 7, sp[1] - 2, 0xd8f0ff);
  // 앞쪽 기생 다리 둘
  backLeg(2, 0), backLeg(3, 0);
  // 가까운 팔 (실 덩이 주먹)
  const sh = [cx + 16, 50 + b], hd = sw <= 1 ? lerp([cx + 28, 90 + b], pol(sh, -1.7, 30), sw) : lerp(pol(sh, -1.7, 30), [cx + 52, 100 + b], Math.min(1, sw - 1));
  const el = ik(sh, hd, 22, 22, 1);
  S.add(ellR(sh[0], sh[1], 12, 11), SILK, { z: 6, h: 8 });
  S.add(U(capF(sh, el, 10, 9), capF(el, hd, 9, 8)), SILK, { z: 7, h: 7 });
  S.add(ellR(hd[0], hd[1], 13, 12), SILK, { z: 7.4, h: 10 });
  for (let k = 0; k < 4; k++) S.carve(capF([hd[0] - 12, hd[1] - 8 + k * 5], [hd[0] + 12, hd[1] - 10 + k * 5.4], 0.5), 0.8);
  S.add(ellR(hd[0] + 5, hd[1] + 3, 3, 2.4), SKN, { on: 1, lift: 0.2, h: 0.4 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, BGK, 76);
  thread(C, P, [hx - 4, hy - 16], [hx - 20, 0], 3), thread(C, P, [cx - 24, 40 + b], [cx - 44, 0], 4), thread(C, P, [hd[0], hd[1] - 10], [hd[0] + 10, 0], 3);
  return fin(C, p);
}
export const pxBound = {
  fw: Math.round(180 * BGK), fh: Math.round(146 * BGK), w: 40, h: 66,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], stab: [3, 14, !1], grab: [4, 9, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph };
    if (nm === "move") { const g = gait2(f, n, 6, 2); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 2, ph };
    if (nm === "rec") P = { sw: 2 * (1 - t), bob: 2 * (1 - t), ph };
    if (nm === "stab") P = { stab: [0.5, 1, 1][f], ph };
    if (nm === "grab") P = { sw: [0.3, 1.2, 1.6, 1.4][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return boundFrame(P);
  },
};

// ════ 은빛 좀벌레 ════ 팔뚝만 한 좀벌레 · 납작하고 끝이 가는 몸에 은빛 비늘 · 앞의 긴 더듬이 둘 · 꽁무니의 꼬리털 셋 · 물고기처럼 꿈틀대며 내달린다
//   p: ph · run · bite · hurt
const SFK = 0.72;
const SILV = mat(ramp(0xa8b0b8, { hi: 0.6 }), { tex: "scale", amp: 0.8, spec: 0.9 }), SILVF = mat(rampF(0x7a828a), { tex: "scale", amp: 0.7 });
function silverfishFrame(p = {}) {
  const W = 92, H = 30, G = H - 1, S = sculpt(W, H, { k: SFK, ax: 44 });
  const ph = p.ph ?? 0, rn = p.run ?? 0, bt = p.bite ?? 0, cx = 40;
  // 꼬리털
  for (const [d, z] of [[-0.25, -1], [0, 0], [0.25, -0.5]]) S.add(capF([cx - 20, G - 6], pol([cx - 20, G - 6], Math.PI + d + Math.sin(ph * 2) * 0.1, 14), 0.6, 0.2), SILVF, { z, h: 0.4 });
  // 다리 (작은)
  for (let k = 0; k < 3; k++) for (const far of [1, 0]) { const r = [cx + 2 + k * 6, G - 5], s = Math.sin(ph * 3 + k * 2 + far * 3) * rn; S.add(capF(r, [r[0] + 2 + s * 3, G - 0.5], 0.7, 0.4), far ? SILVF : SILV, { z: far ? -1 : 3, h: 0.4 }); }
  // 몸 (마디)
  for (let k = 0; k < 9; k++) { const t = k / 8, w = 2 + Math.sin(t * Math.PI * 0.8 + 0.4) * 4, x = cx - 18 + k * 4.6, y = G - 5 - w * 0.4 + Math.sin(ph * 2 - k * 0.7) * rn * 0.8; S.add(ellR(x, y, 3.2, w), k % 2 ? SILV : mat(ramp(0x98a0a8), { tex: "scale", spec: 0.8 }), { z: 1 + k * 0.08, h: w * 0.6 }); }
  const hx = cx + 22, hy = G - 6;
  S.add(ellR(hx, hy, 3.6, 3), SILV, { z: 2, h: 2 });
  !p.hurt && S.decal(hx + 1, hy - 1.4, 0x101418);
  for (const [d, z] of [[-0.35, 1.8], [-0.15, 2.2]]) { let q = [hx + 2, hy - 1], a = d - bt * 0.3; for (let k = 0; k < 5; k++) { const n2 = pol(q, a, 3.6); S.add(capF(q, n2, 0.5, 0.35), SILVF, { z, h: 0.3 }); q = n2; a += 0.08 + Math.sin(ph * 2 + k) * 0.05; } }
  S.add(capF([hx + 3, hy + 1], [hx + 5 + bt * 2, hy + 2], 0.6, 0.3), FANG, { z: 2.4, h: 0.3 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxSilverfish = {
  fw: Math.round(92 * SFK), fh: Math.round(30 * SFK), w: 24, h: 8,
  anims: { idle: [4, 6], move: [6, 18], wind: [3, 12, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, run: 1 };
    if (nm === "wind") P = { ph, bite: -0.5 };
    if (nm === "atk") P = { ph, run: 1, bite: [1, 1, 0.5][f] };
    if (nm === "rec") P = { ph };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return silverfishFrame(P);
  },
};

// ════ 문짝거미 ════ 흙 뚜껑을 덮은 굴에 숨는 거미 · 숨으면 뚜껑 틈으로 다리 끝과 눈빛만 보인다 · 뚜껑을 젖히고 튀어나와 문다 ·
//   반들반들한 검붉은 등딱지 · 굵은 송곳니
//   p: ph · out(0 숨음 · 1 나옴) · bite · hurt
const TDK = 0.72;
const TDC = mat(ramp(0x5a2e28), { tex: "metal", amp: 0.6, spec: 0.9 }), TDCF = mat(rampF(0x40201c), { tex: "metal", amp: 0.5 }), SOIL = mat(ramp(0x4a4250), { tex: "clay", amp: 1.3 });
function trapdoorFrame(p = {}) {
  const W = 92, H = 54, G = H - 1, S = sculpt(W, H, { k: TDK, ax: 44 });
  const ph = p.ph ?? 0, out = p.out ?? 1, bt = p.bite ?? 0, cx = 40, by = G - 10 + (1 - out) * 14;
  // 굴 둔덕
  S.add(U(ellR(cx - 4, G - 2, 24, 5)), SOIL, { z: -2, h: 3 });
  S.add(ellR(cx - 4, G - 3, 14, 2.6), VD, { z: -1.9, h: 0.4 });
  if (out > 0.05) {
    const legs = [[14, 1], [6, 0.4], [-4, -0.3], [-12, -1]];
    legs.forEach(([dx, s], k) => sLeg(S, [cx + dx * 0.3, by], [cx + dx + s * 5 + bt * (k < 2 ? 6 : 0) + Math.sin(ph + k) * (p.walk ? 3 : 0), G - 1], 6 * out, TDCF, -1 - k * 0.1, 2));
    S.add(ellR(cx - 12, by, 12, 9), mat(ramp(0x4a3a34), { tex: "fur", amp: 1 }), { z: 1, h: 8 });
    for (let k = 0; k < 4; k++) S.carve(capF([cx - 20 + k * 4, by - 8], [cx - 22 + k * 4, by + 8], 0.4), 0.6);
    S.add(ellR(cx + 4, by - 2, 10, 7), TDC, { z: 2, h: 7 });
    S.carve(capF([cx - 2, by - 6], [cx + 10, by - 6], 0.4), 0.6);
    eyes(S, [cx + 12, by - 5], 1, 2.8, 0xffd0a0, p.hurt);
    for (const d of [-1, 1]) S.add(capF([cx + 12, by + 1 + d], pol([cx + 12, by + 1 + d], 1.2 - bt * 1.1 + d * 0.15, 6 + bt * 2), 2, 0.6), FANG, { z: 3 + d * 0.1, h: 1.2 });
    legs.forEach(([dx, s], k) => sLeg(S, [cx + dx * 0.3 + 2, by + 1], [cx + dx + 2 + s * 7 + bt * (k < 2 ? 8 : 0) + Math.sin(ph + k + 2) * (p.walk ? 3 : 0), G - 1], 7 * out, TDC, 4 + k * 0.1, 2.3));
  } else {
    // 숨음: 뚜껑 틈의 다리 끝과 눈빛
    for (const d of [-8, -2, 6]) S.add(capF([cx + d, G - 4], [cx + d + 2, G - 7], 0.8, 0.4), TDC, { z: 0, h: 0.6 });
  }
  // 뚜껑 (경첩 = 왼쪽 끝)
  const hg = [cx - 20, G - 4], la = -out * 1.3 - Math.sin(ph) * 0.04 * (1 - out);
  const lidT = pol(hg, la, 30);
  S.add(U(capF(hg, lidT, 2.6, 2.2)), SOIL, { z: out > 0.5 ? -1.5 : 3, h: 2.4 });
  for (let k = 0; k < 4; k++) S.add(ellR(...lerp(hg, lidT, 0.2 + k * 0.2), 1.4, 1), k % 2 ? mat(ramp(0x6a7a5a), { tex: "leaf" }) : SILKF, { z: out > 0.5 ? -1.4 : 3.1, h: 0.6 });
  const C = S.render({ rim: !0 });
  if (out < 0.05 && !p.hurt) { const P = toPx(W, H, TDK, 44); for (const x of [cx + 2, cx + 4]) { const q = P(x, G - 5); C.px(q[0], q[1], 0xffd0a0); } }
  return fin(C, p);
}
export const pxTrapdoor = {
  fw: Math.round(92 * TDK), fh: Math.round(54 * TDK), w: 24, h: 14,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], hide: [4, 3], pop: [3, 14, !1], sink: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 2, walk: 1 };
    if (nm === "wind") P = { ph, bite: -0.4 };
    if (nm === "atk") P = { ph, bite: [1, 1, 0.5][f] };
    if (nm === "rec") P = { ph };
    if (nm === "hide") P = { ph, out: 0 };
    if (nm === "pop") P = { ph, out: [0.4, 0.9, 1][f], bite: [0, 1, 1][f] };
    if (nm === "sink") P = { ph, out: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return trapdoorFrame(P);
  },
};

// ════ 거미 무녀 ════ 거미를 섬기는 동굴 무녀 · 거미줄을 짠 검은 베일과 긴 옷자락 · 이마에 그린 여섯 눈 · 등 뒤로 솟은 가는 거미 팔 한 쌍 ·
//   손가락 사이로 실을 걸어 그물을 짓는다
//   p: legs · bob · cast · hurt
const PRK = 0.72;
function priestessFrame(p = {}) {
  const W = 96, H = 104, G = H - 1, S = sculpt(W, H, { k: PRK, ax: 40 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cs = p.cast ?? 0, ph = p.ph ?? 0, cx = 38;
  const GOWN = mat(ramp(0x2e2a38), { tex: "cloth", amp: 1.1, spec: 0.3 }), GOWNF = mat(rampF(0x221e2a), { tex: "cloth" }), PSK = mat(ramp(0xb8b0b8), { tex: "skin", amp: 0.7 });
  // 등의 거미 팔 (뒤)
  for (const [k, z] of [[0, -3], [1, -2.6]]) { const r = [cx - 4, 40 + b], a = -2.4 + k * 0.5 - cs * 0.3, kn = pol(r, a, 18), tp = pol(kn, a + 1.6 - cs * 0.4 + Math.sin(ph + k) * 0.1, 18); S.add(U(capF(r, kn, 1.4, 1.1), capF(kn, tp, 1.1, 0.4)), CHIT, { z, h: 0.8 }); S.add(ellR(kn[0], kn[1], 1.4, 1.4), CHIT, { z: z + 0.1, h: 0.8 }); }
  // 옷자락 (땅에 끌림 · 거미줄 무늬)
  const hem = [];
  for (let k = 0; k <= 7; k++) hem.push([cx - 18 + k * 5.4 + (k === 7 ? g.n[0] * 0.3 : 0), G - 1 - (k % 2) * 2]);
  S.add(polyF([[cx - 8, 46 + b], [cx + 9, 46 + b], ...hem.slice().reverse()]), GOWN, { z: 1, h: 9 });
  for (let k = 0; k < 5; k++) S.carve(capF([cx - 6 + k * 3, 52 + b], [cx - 16 + k * 7, G - 3], 0.5), 0.8);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const a0 = -Math.PI * 0.95 + k * 0.38, q0 = [cx + Math.cos(a0) * (8 + r * 7), G + Math.sin(a0) * (8 + r * 7)]; k < 5 && S.add(capF(q0, [cx + Math.cos(a0 + 0.38) * (8 + r * 7), G + Math.sin(a0 + 0.38) * (8 + r * 7)], 0.3), SILK, { on: 1, lift: 0.3, h: 0.2 }); }
  // 몸 + 허리
  S.add(U(ellR(cx, 42 + b, 9, 10)), GOWN, { z: 2, h: 7 });
  S.add(capF([cx - 8, 50 + b], [cx + 8, 50 + b], 1.4), SILK, { z: 2.4, h: 1 });
  // 머리 + 베일 + 이마 눈
  const hx = cx + 3, hy = 26 + b;
  S.add(ellR(hx + 1, hy + 1, 5.4, 6.4), PSK, { z: 3, h: 4 });
  S.add(ellR(hx + 5.6, hy + 4.6, 1.2, 0.6), mat(ramp(0x3a1a2a)), { z: 3.2, lift: 0.1, h: 0.2 });
  for (const [x, y] of [[3.4, -2.6], [5.4, -2.2], [2, -4], [4.6, -4.2], [3.6, 0.6], [5.6, 0.6]]) !p.hurt && S.decal(hx + x, hy + y, y > 0 ? 0xc8e8ff : 0x6a3a6a);
  S.add(U(ellR(hx - 1, hy - 2, 8, 8), polyF([[hx - 9, hy], [hx - 12, hy + 22], [hx + 2, hy + 14], [hx + 4, hy + 2]])), GOWNF, { z: 2.8, h: 5 });
  S.add(polyF([[hx - 4, hy - 9], [hx + 7, hy - 7], [hx + 9, hy + 10], [hx + 2, hy + 14]]), mat(ramp(0x6a6878), { tex: "cloth", amp: 1.4 }), { z: 3.6, h: 1 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx - 3 + k * 3, hy - 8], [hx - 1 + k * 3.4, hy + 12], 0.3), 0.6);
  // 팔 (실 그물을 짓는 두 손)
  const hdA = [cx + 14 + cs * 6, 44 + b - cs * 8], hdB = [cx + 12 + cs * 4, 52 + b - cs * 2];
  for (const [sh, hd, z] of [[[cx - 2, 38 + b], hdB, 1.5], [[cx + 6, 38 + b], hdA, 6]]) { S.add(U(capF(sh, lerp(sh, hd, 0.5), 2.6, 2.2), capF(lerp(sh, hd, 0.5), hd, 2.2, 2.6)), z > 3 ? GOWN : GOWNF, { z, h: 1.8 }); S.add(ellR(hd[0], hd[1], 1.6, 1.4), PSK, { z: z + 0.2, h: 1 }); }
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, PRK, 40);
  if (cs > 0.2) { for (let k = 0; k < 5; k++) thread(C, P, [hdA[0], hdA[1] - k * 0.6], [hdB[0] + 1, hdB[1] - k * 0.4], 0.6, 0xe0f0ff, 0xa0c8e8); const c0 = [hdA[0] + 8, (hdA[1] + hdB[1]) / 2]; for (let k = 0; k < 12; k++) { const q = P(c0[0] + Math.cos(k * 0.52) * 6 * cs, c0[1] + Math.sin(k * 0.52) * 6 * cs); C.px(q[0], q[1], k % 2 ? 0xd8f0ff : 0xa0c8e8); } }
  return fin(C, p);
}
export const pxPriestess = {
  fw: Math.round(96 * PRK), fh: Math.round(104 * PRK), w: 16, h: 34,
  anims: { idle: [6, 5], move: [6, 6], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], summon: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6, ph };
    if (nm === "move") { const g = gait2(f, n, 3, 0.5); P = { legs: g, bob: g.bob * 0.4, ph }; }
    if (nm === "wind") P = { cast: t, ph };
    if (nm === "atk") P = { cast: [1, 0.8, 0.5][f], ph };
    if (nm === "rec") P = { cast: 0.5 * (1 - t), ph };
    if (nm === "summon") P = { cast: [0.6, 1, 1, 0.6][f], bob: -1, ph: ph * 2 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, ph };
    return priestessFrame(P);
  },
};

// ════ [정예] 알 품은 타란툴라 ════ 수레만 한 털복숭이 타란툴라 · 다리마다 주황 띠 · 배 밑에 품은 하얀 알 주머니 · 앞다리를 쳐들어 송곳니를 드러낸다 ·
//   배의 가시털을 비벼 날린다
//   p: ph · walk · rear · bite · hurt
const TRK = 0.66;
function tarantulaFrame(p = {}) {
  const W = 200, H = 124, G = H - 1, S = sculpt(W, H, { k: TRK, ax: 94 });
  const ph = p.ph ?? 0, wk = p.walk ?? 0, rr = p.rear ?? 0, bt = p.bite ?? 0, cx = 90, by = G - 30 - rr * 4;
  const BAND = mat(ramp(0xc8783a), { tex: "fur", amp: 1.2, dir: 1.2 });
  const legs = [[84, 1.2], [44, 0.5], [-36, -0.2], [-78, -1]];
  const step = (k, far) => { const s = Math.sin(ph * 2 + k * 1.6 + far * Math.PI); return [wk * s * 9, wk * Math.max(0, -s) * 7]; };
  legs.forEach(([dx, s], k) => { const st = step(k, 1); sLeg(S, [cx + dx * 0.12, by - 6], [cx + dx * 0.85 + st[0], G - 1 - st[1] - (k === 0 ? rr * 30 : 0)], 38 + (k === 0 ? rr * 10 : 0), HAIRF, -4 - k * 0.1, 5, { band: mat(rampF(0x9a5a2a), { tex: "fur" }), hair: 1 }); });
  // 배 (털 · 가시털 · 알 주머니)
  const ab = [cx - 40, by - 10];
  S.add(ellR(ab[0], ab[1], 34, 26), HAIR, { z: 1, h: 22 });
  S.add(ellR(ab[0] + 2, ab[1] - 6, 16, 10), mat(ramp(0x6a4a34), { tex: "fur", amp: 1.4, dir: 1.6 }), { on: 1, lift: 0.4, h: 1 });
  for (let k = 0; k < 8; k++) S.carve(capF(pol(ab, -2.6 + k * 0.4, 14), pol(ab, -2.6 + k * 0.4, 32), 0.5), 0.8);
  S.add(ellR(ab[0] + 8, by + 14, 18, 12), SILK, { z: 2.6, h: 8 });
  for (let k = 0; k < 7; k++) S.add(ellR(ab[0] - 2 + (k % 4) * 7, by + 10 + Math.floor(k / 4) * 7, 2.6, 2.4), mat(ramp(0xe8e0c8), { spec: 0.6 }), { on: 1, lift: 0.6, h: 1 });
  // 머리가슴
  S.add(ellR(cx + 6, by - 10, 24, 18), HAIR, { z: 2, h: 15 });
  S.add(ellR(cx + 6, by - 16, 12, 6), mat(ramp(0x6a5040), { tex: "fur", amp: 1.2 }), { on: 1, lift: 0.4, h: 0.8 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx + 6, by - 14], pol([cx + 6, by - 14], k * 0.52 + 0.3, 14), 0.4), 0.5);
  eyes(S, [cx + 22, by - 18], 1.4, 3, 0xffe0a0, p.hurt);
  // 송곳니 + 촉지
  for (const d of [-1, 1]) S.add(U(ellR(cx + 28, by - 6 + d * 3, 5, 4.4), capF([cx + 30, by - 4 + d * 3], pol([cx + 30, by - 4 + d * 3], 1.4 - bt * 1 + rr * -0.6, 8 + bt * 2), 2.4, 0.6)), d > 0 ? HAIR : FANG, { z: 3 + d * 0.2, h: 2 });
  for (const d of [-1, 1]) { const r = [cx + 26, by - 2 + d * 2], tp = [cx + 38 + rr * 4, by + 6 - rr * 18 + d * 2]; S.add(capF(r, tp, 2.6, 2.2), d > 0 ? HAIR : HAIRF, { z: d > 0 ? 6 : 1.5, h: 1.6 }); }
  legs.forEach(([dx, s], k) => { const st = step(k, 0); sLeg(S, [cx + dx * 0.12 + 4, by - 4], [cx + dx + 6 + st[0] + (k === 0 ? rr * 10 : 0), G - 1 - st[1] - (k === 0 ? rr * 40 : 0)], 42 + (k === 0 ? rr * 14 : 0), HAIR, 8 + k * 0.1, 5.6, { band: BAND, hair: 1 }); });
  const C = S.render({ rim: !0 });
  if (p.hairs) { const P = toPx(W, H, TRK, 94); for (let k = 0; k < 26; k++) { const q = P(ab[0] - 20 + ((k * 13) % 50), ab[1] - 30 - ((k * 7 + p.hairs * 20) % 30)); C.px(q[0], q[1], k % 3 ? 0xc8a070 : 0xf0d8a0); } }
  return fin(C, p);
}
export const pxTarantula = {
  fw: Math.round(200 * TRK), fh: Math.round(124 * TRK), w: 70, h: 46,
  anims: { idle: [4, 4], move: [6, 8], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], rear: [4, 8, !1], flick: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, walk: 1 };
    if (nm === "wind") P = { ph, rear: t * 0.5, bite: -0.3 };
    if (nm === "atk") P = { ph, bite: [1, 1, 0.6][f], rear: 0.2 };
    if (nm === "rec") P = { ph, bite: 0.6 * (1 - t) };
    if (nm === "rear") P = { ph, rear: t };
    if (nm === "flick") P = { ph: ph * 2, hairs: f + 1, walk: 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, ph, rear: 0.3 };
    return tarantulaFrame(P);
  },
};
