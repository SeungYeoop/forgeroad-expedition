// 미러딥 몬스터 12종 (조각 도구, 오른쪽을 본다) — 거울 수정 벽 · 서로 비추는 빛 기둥 · 차가운 푸른 보랏빛
//   위 줄: 거울 도마뱀붙이 · 거울 방패병 · 프리즘 투구게 · [정예] 거울 마녀
//   가운데 줄: 수정뿔 엘크 · 반딧불 하늘오징어 · 렌즈 술사 · [정예] 수정 갈기 사자
//   아래 줄: 은거울 코브라 · 프리즘 점액 · 눈가린 수도사 · [정예] 수정 용거북
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm, leg } from "./px_ah.js";

const MIR = mat(ramp(0xc0d0e8, { hi: 0.7 }), { tex: "glass", amp: 1.2, spec: 1 }), MIRF = mat(rampF(0x8a9ab8), { tex: "glass", amp: 1 });
const CRY = mat(ramp(0x9ab8e8, { hi: 0.6 }), { tex: "crystal", amp: 0.8, spec: 0.9 }), CRYF = mat(rampF(0x6a88b8), { tex: "crystal", amp: 0.7 });
const LAV = mat(ramp(0xb8a0e8, { hi: 0.6 }), { tex: "crystal", amp: 0.8, spec: 0.9 }), LAVF = mat(rampF(0x8a70b8), { tex: "crystal", amp: 0.7 });
const LGT = mat(rampGlow(0xb8e0ff)), LGTW = mat(rampGlow(0xf0faff)), SILV = mat(ramp(0xa8b0c0), { tex: "metal", amp: 0.8, spec: 0.8 }), SILVF = mat(rampF(0x7a8294), { tex: "metal", amp: 0.7 });
const VD = mat(ramp(0x0c1020)), ROBE = mat(ramp(0x3a4a6a), { tex: "cloth", amp: 1.1 }), ROBEF = mat(rampF(0x2a3650), { tex: "cloth", amp: 1 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 반짝 (렌더 뒤: 십자 빛)
function glint(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
// 결정 하나 (뿌리 r 에서 a 방향 · 길이 l · 굵기 w)
function shard(S, r, a, l, w, M, z, o = {}) { const n = a + Math.PI / 2; S.add(polyF([pol(r, n, w), pol(pol(r, a, l * 0.78), n, w * 0.8), pol(r, a, l), pol(pol(r, a, l * 0.78), n, -w * 0.8), pol(r, n, -w)]), M, { z, h: o.h ?? w * 0.8, prof: "sharp", ...o }); }

// ════ 거울 도마뱀붙이 ════ 비늘 한 장 한 장이 거울처럼 매끈한 도마뱀붙이 · 동그란 큰 눈 · 넓적한 발가락 · 말린 꼬리 · 등 비늘로 빛을 모아 번쩍인다
//   p: legs · bob · flash · bite · hurt
const GKK = 0.72;
function geckoFrame(p = {}) {
  const W = 92, H = 44, G = H - 1, S = sculpt(W, H, { k: GKK, ax: 44 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, fl = p.flash ?? 0, cx = 42;
  const SK = mat(ramp(0x9aa8c8, { hi: 0.7 }), { tex: "scale", amp: 0.9, spec: 0.9 }), SKF = mat(rampF(0x6a7898), { tex: "scale", amp: 0.8 });
  const lgf = (sh, o, far, front) => { const el = [sh[0] + (front ? 4 : -4), sh[1] - 2], ft = [sh[0] + o[0] + (front ? 6 : -4), G - 1 - o[1]]; S.add(U(capF(sh, el, 2.2, 1.8), capF(el, ft, 1.8, 1.4)), far ? SKF : SK, { z: far ? -3 : 5, h: 1.4 }); for (const e of [-0.6, -0.1, 0.4, 0.9]) S.add(U(capF(ft, pol(ft, e + (front ? 0 : Math.PI * 0.6), 3), 0.5), ellR(...pol(ft, e + (front ? 0 : Math.PI * 0.6), 3), 0.9, 0.9)), far ? SKF : SK, { z: far ? -2.9 : 5.1, h: 0.4 }); };
  lgf([cx + 12, 34 + b], lg.ff, 1, 1), lgf([cx - 10, 34 + b], lg.bf, 1, 0);
  // 꼬리 (말림)
  let q = [cx - 18, 34 + b], a = Math.PI + 0.1;
  const tl = [];
  for (let k = 0; k < 9; k++) { const n2 = pol(q, a, 3.6), w = 3.4 - k * 0.3; tl.push(capF(q, n2, w, w - 0.3)); q = n2; a += k > 4 ? -0.5 : -0.08; }
  S.add(U(...tl), SK, { z: 0.5, h: 2.4 });
  // 몸 + 거울 비늘판
  S.add(U(ellR(cx, 32 + b, 18, 6.4), ellR(cx + 14, 32 + b, 7, 5.4)), SK, { z: 1, h: 6 });
  for (let k = 0; k < 7; k++) S.add(polyF([[cx - 14 + k * 4.4, 27 + b], [cx - 12 + k * 4.4, 24.4 + b - fl * 1.6], [cx - 10 + k * 4.4, 27 + b], [cx - 12 + k * 4.4, 29 + b]]), k % 2 ? MIR : mat(ramp(0xd8e8ff, { hi: 0.8 }), { tex: "glass", spec: 1 }), { lift: 0.6, h: 1, prof: "sharp" });
  S.add(capF([cx - 16, 36 + b], [cx + 14, 36 + b], 1.6), mat(ramp(0xd8d8e0), { tex: "scale" }), { on: 1, lift: 0.3, h: 0.4 });
  // 머리 (넓적 · 큰 눈)
  const hx = cx + 22, hy = 31 + b, jo = (p.bite ?? 0) * 2;
  S.add(U(ellR(hx, hy, 7, 5.4), capF([hx + 2, hy + 1], [hx + 9, hy + 2], 3.6, 2.4)), SK, { z: 2.4, h: 4 });
  S.add(capF([hx + 2, hy + 3 + jo * 0.3], [hx + 9, hy + 3 + jo], 1.6, 1.2), SKF, { z: 2.2, h: 1 });
  S.add(ellR(hx + 1, hy - 2.6, 3, 2.8), mat(ramp(0xd8c060), { spec: 1 }), { z: 3, h: 2 });
  S.add(capF([hx + 1, hy - 4.6], [hx + 1, hy - 0.6], 0.5), VD, { z: 3.1, lift: 0.1, h: 0.2 });
  lgf([cx + 14, 35 + b], lg.fn, 0, 1), lgf([cx - 8, 35 + b], lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  if (fl > 0.3) { const P = toPx(W, H, GKK, 44); for (let k = 0; k < 4; k++) glint(C, P, cx - 12 + k * 8, 24 + b, 1 + Math.round(fl * 2)); }
  return fin(C, p);
}
export const pxGecko = {
  fw: Math.round(92 * GKK), fh: Math.round(44 * GKK), w: 26, h: 12,
  anims: { idle: [4, 5], move: [6, 14], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], flash: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { legs: gait4(f, n, 5, 1.8), bob: Math.cos(ph * 2) * 0.4 };
    if (nm === "wind") P = { bite: -0.3, bob: 1 };
    if (nm === "atk") P = { bite: [1, 0.8, 0.2][f], bob: -1 };
    if (nm === "rec") P = { bite: 0 };
    if (nm === "flash") P = { flash: [0.4, 1, 1, 0.5][f] };
    if (nm === "hurt") P = { hurt: f === 0, flash: 0.2 };
    return geckoFrame(P);
  },
};

// ════ 거울 방패병 ════ 은빛 비늘 갑옷의 동굴 수비병 · 몸을 거의 가리는 둥근 거울 방패 · 앞에서 오는 공격과 빛을 되튕긴다 · 짧은 칼
//   p: legs · bob · bash · sw · hurt
const SBK = 0.72;
function shieldFrame(p = {}) {
  const W = 104, H = 96, G = H - 1, S = sculpt(W, H, { k: SBK, ax: 40 });
  const b = p.bob ?? 0, bs = p.bash ?? 0, sw = p.sw ?? 0, cx = 36;
  const sol = soldier(S, { cx, Y: 46, G, b, legs: p.legs, tabard: mat(ramp(0x3a4a7a), { tex: "cloth", amp: 1 }), hurt: p.hurt, helm: "sallet" });
  // 먼 팔 + 짧은 칼 (방패 뒤에서 찌름)
  const hF = sw > 0 ? lerp([cx + 2, 58 + b], [cx + 30, 52 + b], Math.min(1, sw)) : [cx - 2, 60 + b];
  arm(S, sol.S1, hF, 1, { z: -2 });
  if (sw > 0) S.add(polyF([pol(hF, 1.57, 1.2), pol(hF, 0, 18), pol(hF, -1.57, 1.2)]), SILV, { z: -1.8, h: 0.8, prof: "sharp" });
  else S.add(polyF([pol(hF, 1.57 + 0.3, 1.2), pol(hF, 0.3 + 1.2, 16), pol(hF, 0.3 - 1.57 + 1.2, 1.2)]), SILV, { z: -1.8, h: 0.8, prof: "sharp" });
  // 가까운 팔 + 거울 방패
  const sh = sol.S0, hd = [cx + 12 + bs * 10, 56 + b - bs * 2];
  arm(S, sh, hd, 0, {});
  const sc = [hd[0] + 3, hd[1] - 4];
  S.add(ellR(sc[0], sc[1], 8, 19), SILVF, { z: 10, h: 4 });
  S.add(ellR(sc[0] + 1, sc[1], 6.4, 17), MIR, { z: 10.4, h: 4 });
  S.add(capF([sc[0] - 1, sc[1] - 12], [sc[0] + 3, sc[1] - 4], 1.2), mat(ramp(0xffffff), { spec: 1 }), { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(sc[0] + 1.6, sc[1], 1.8, 2.4), SILV, { z: 10.8, h: 1.4 });
  const C = S.render({ rim: !0 });
  (bs > 0.5 || p.gleam) && glint(C, toPx(W, H, SBK, 40), sc[0] + 2, sc[1] - 8, 3);
  return fin(C, p);
}
export const pxShieldbearer = {
  fw: Math.round(104 * SBK), fh: Math.round(96 * SBK), w: 18, h: 32,
  anims: { idle: [4, 4], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], bash: [3, 12, !1], guard: [4, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 4, 2); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { sw: 0.01, bob: 1 };
    if (nm === "atk") P = { sw: [0.6, 1, 1][f] };
    if (nm === "rec") P = { sw: 1 - t };
    if (nm === "bash") P = { bash: [0.5, 1, 0.6][f], bob: -1 };
    if (nm === "guard") P = { bash: 0.15, gleam: f === 1, bob: 1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return shieldFrame(P);
  },
};

// ════ 프리즘 투구게 ════ 거울처럼 매끈한 반달 등딱지 · 등딱지 결 따라 무지갯빛 · 길게 뻗은 꼬리 가시 · 뒤집히면 버둥대는 작은 다리
//   p: ph · walk · tail · hurt
const HCK = 0.72;
function horseshoeFrame(p = {}) {
  const W = 92, H = 38, G = H - 1, S = sculpt(W, H, { k: HCK, ax: 46 });
  const ph = p.ph ?? 0, wk = p.walk ?? 0, tl = p.tail ?? 0, cx = 46;
  for (let k = 0; k < 5; k++) { const x = cx - 8 + k * 5, s = Math.sin(ph * 3 + k * 1.3) * wk; S.add(capF([x, G - 4], [x + 1 + s * 2, G - 0.5], 0.8, 0.5), mat(rampF(0x6a5a5a)), { z: -1, h: 0.4 }); }
  // 꼬리 가시
  const t0 = [cx - 8, G - 5], ta = Math.PI + 0.1 - tl * 0.7;
  S.add(capF(t0, pol(t0, ta, 22 + tl * 4), 1.6, 0.4), SILV, { z: 0.5, h: 1 });
  // 등딱지 (앞 반달 + 뒤 육각)
  S.add(minus(ellR(cx + 6, G - 3, 16, 12), (x, y) => y > G - 3), MIR, { z: 1, h: 9 });
  S.add(minus(polyF([[cx - 8, G - 3], [cx - 9, G - 10], [cx - 4, G - 13], [cx + 2, G - 12], [cx + 2, G - 3]]), () => !1), MIRF, { z: 0.8, h: 6 });
  for (const x of [-7, -4, -1]) S.add(polyF([[cx + x, G - 9], [cx + x - 2, G - 15 + (x === -4 ? 1 : 0)], [cx + x + 1, G - 9]]), LAV, { z: 1.2, h: 0.8, prof: "sharp" });
  S.carve(capF([cx - 2, G - 12], [cx + 18, G - 8], 0.5), 0.9);
  S.carve(capF([cx + 2, G - 14], [cx + 2, G - 4], 0.4), 0.8);
  S.tone((x, y) => Math.hypot(x - cx - 2, y - G + 12) < 5, 0.12);
  S.paint((x, y) => Math.abs(x - cx - 6 - (y - G) * 0.6) < 1.2 && y < G - 4, mat(ramp(0xc8b0f0, { hi: 0.7 }), { tex: "glass", spec: 1 }));
  for (const x of [cx + 8, cx + 14]) { S.add(ellR(x, G - 10, 1.2, 0.9), VD, { z: 1.4, lift: 0.1, h: 0.2 }); !p.hurt && S.decal(x, G - 10.4, 0xd8f0ff); }
  const C = S.render({ rim: !0 });
  p.gleam && glint(C, toPx(W, H, HCK, 46), cx + 4, G - 12, 2);
  return fin(C, p);
}
export const pxHorseshoe = {
  fw: Math.round(92 * HCK), fh: Math.round(38 * HCK), w: 26, h: 10,
  anims: { idle: [4, 4], move: [6, 10], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, gleam: f === 2 };
    if (nm === "move") P = { ph, walk: 1 };
    if (nm === "wind") P = { ph, tail: -0.4 * t, gleam: 1 };
    if (nm === "atk") P = { ph, tail: [1, 1.4, 1][f] };
    if (nm === "rec") P = { ph, tail: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return horseshoeFrame(P);
  },
};

// ════ [정예] 거울 마녀 ════ 거울 조각을 꿰어 지은 드레스 · 머리 뒤로 떠 있는 거울 조각 후광 · 은빛 눈동자 · 손거울을 들어 빛을 쏘고
//   거울 속으로 사라졌다 다른 거울에서 나온다 · 자기 모습의 거울상을 불러낸다
//   p: ph · cast · fade · hurt
const WTK = 0.66;
function witchFrame(p = {}) {
  const W = 150, H = 150, S = sculpt(W, H, { k: WTK, ax: 70 });
  const ph = p.ph ?? 0, cs = p.cast ?? 0, cx = 66, Y = 40 + Math.sin(ph) * 2;
  const SKN = mat(ramp(0xd8d0e0), { tex: "skin", amp: 0.6 }), HAIR = mat(ramp(0xd8e0f0), { tex: "fur", amp: 1, dir: 1.7 });
  // 거울 조각 후광 (뒤)
  for (let k = 0; k < 9; k++) { const a = -Math.PI * 0.95 + (k / 8) * Math.PI * 0.9 + Math.sin(ph + k) * 0.04, r0 = pol([cx + 2, Y - 2], a, 20 + (k % 2) * 4); shard(S, r0, a, 12 + (k % 3) * 3, 2.4, k % 2 ? MIR : LAV, -3); }
  // 머리카락 (길게 흘러내림)
  S.add(polyF([[cx - 6, Y - 10], [cx + 6, Y - 12], [cx + 2, Y + 30], [cx - 14, Y + 40], [cx - 12, Y + 6]]), HAIR, { z: -1, h: 4 });
  // 드레스 (거울 조각 비늘 · 바닥 없이 흩어짐)
  const hem = [];
  for (let k = 0; k <= 8; k++) hem.push([cx - 26 + k * 6.6 + Math.sin(ph + k) * 2, Y + 90 + Math.sin(ph * 2 + k * 1.4) * 3 + (k % 2) * 6]);
  S.add(polyF([[cx - 9, Y + 18], [cx + 10, Y + 18], ...hem.slice().reverse()]), ROBE, { z: 1, h: 10 });
  for (let r = 0; r < 5; r++) for (let k = 0; k < 5 + r; k++) { const x = cx - 10 - r * 3 + k * 5.4, y = Y + 34 + r * 11; S.add(polyF([[x - 2, y], [x, y - 3], [x + 2, y], [x, y + 3]]), (k + r) % 3 ? MIR : LAV, { on: 1, lift: 0.6, h: 0.8, prof: "sharp" }); }
  // 몸 (코르셋)
  S.add(U(ellR(cx, Y + 14, 8, 10), ellR(cx, Y + 24, 7, 5)), SILV, { z: 2, h: 7 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 6, Y + 10 + k * 4], [cx + 6, Y + 11 + k * 4], 0.3), 0.5);
  // 먼 팔
  S.add(U(capF([cx - 6, Y + 8], [cx - 10, Y + 24], 2, 1.6), capF([cx - 10, Y + 24], [cx - 4 + cs * 2, Y + 32], 1.6, 1.4)), mat(rampF(0xa8a0b8), { tex: "skin" }), { z: 0.5, h: 1.2 });
  // 머리 (창백 · 은빛 눈 · 거울 관)
  const hx = cx + 3, hy = Y - 4;
  S.add(ellR(hx, hy, 6.4, 7.6), SKN, { z: 3, h: 5 });
  S.add(ellR(hx + 5, hy + 4, 1.2, 0.6), mat(ramp(0x6a3a6a)), { z: 3.2, lift: 0.1, h: 0.2 });
  !p.hurt && S.decal(hx + 4, hy - 0.6, 0xe0f0ff).decal(hx + 4.6, hy - 0.6, 0xa0c8ff);
  S.add(capF([hx - 6, hy - 6], [hx + 6, hy - 8], 2.6, 2), HAIR, { z: 3.4, h: 2 });
  for (let k = 0; k < 5; k++) shard(S, [hx - 4 + k * 2.6, hy - 8.4], -1.57 + (k - 2) * 0.2, 5 + (k === 2 ? 4 : k % 2 ? 1 : 2), 1, k % 2 ? LAV : MIR, 3.6);
  // 가까운 팔 + 손거울
  const sh = [cx + 6, Y + 8], hd = lerp([cx + 12, Y + 28], [cx + 22, Y + 8], cs);
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 2, 1.6), capF(lerp(sh, hd, 0.5), hd, 1.6, 1.4)), SKN, { z: 6, h: 1.2 });
  S.add(capF(hd, [hd[0] + 2, hd[1] - 6], 1), SILV, { z: 6.4, h: 0.8 });
  const mr = [hd[0] + 4, hd[1] - 12];
  S.add(ellR(mr[0], mr[1], 5, 6.4), SILV, { z: 6.6, h: 2 });
  S.add(ellR(mr[0] + 0.6, mr[1], 3.8, 5.2), cs > 0.5 ? LGTW : MIR, { z: 7, h: 2 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, WTK, 70);
  cs > 0.5 && glint(C, P, mr[0] + 1, mr[1] - 1, 4);
  for (let k = 0; k < 6; k++) { const a = ph * 1.2 + k * 1.05, q = [cx + Math.cos(a) * 34, Y + 40 + Math.sin(a) * 12]; glint(C, P, q[0], q[1], 1, k % 2 ? 0xe0d0ff : 0xffffff); }
  if (p.fade) { const { d } = C; for (let i = 0; i < d.length; i++) d[i] >= 0 && ((i * 7 + Math.floor(i / C.W)) % 4 < p.fade * 4) && (d[i] = -1); }
  return fin(C, p);
}
export const pxWitch = {
  fw: Math.round(150 * WTK), fh: Math.round(150 * WTK), w: 26, h: 60, flying: !0,
  anims: { idle: [6, 5], move: [6, 6], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], fade: [4, 10, !1], appear: [4, 10, !1], summon: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, cast: t };
    if (nm === "atk") P = { ph, cast: 1 };
    if (nm === "rec") P = { ph, cast: 1 - t };
    if (nm === "fade") P = { ph, fade: (f + 1) / 4.5 };
    if (nm === "appear") P = { ph, fade: 1 - (f + 1) / 4.5 };
    if (nm === "summon") P = { ph: ph * 2, cast: [0.6, 1, 1, 0.6][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return witchFrame(P);
  },
};

// ════ 수정뿔 엘크 ════ 덥수룩한 은회색 목털의 큰사슴 · 머리 위로 가지를 친 푸른 수정 뿔 · 뿔 끝마다 빛이 맺힌다 · 발굽으로 땅을 차고 뿔로 들이받는다
//   p: legs · bob · head(0 듦 · 1 숙임) · rear · hurt
const ELK = 0.62;
function elkFrame(p = {}) {
  const W = 140, H = 110, G = H - 1, S = sculpt(W, H, { k: ELK, ax: 66 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd = p.head ?? 0, rr = p.rear ?? 0, cx = 60, cy = 62 + b;
  const FUR = mat(ramp(0x7a7a84), { tex: "fur", amp: 1.1, dir: 1.4 }), FURF = mat(rampF(0x5a5a64), { tex: "fur", amp: 1, dir: 1.4 }), MANE = mat(ramp(0xb8bcc8), { tex: "fur", amp: 1.3, dir: 1.6 });
  const legE = (x, o, far, front) => { const hp = [x, cy + 8 - (front ? rr * 10 : 0)], kn = [x + (front ? 2 : -3), cy + 26 - (front ? rr * 14 : 0)], ft = [x + o[0] + (front ? rr * 6 : 0), G - 1 - o[1] - (front ? rr * 18 : 0)]; S.add(U(capF(hp, kn, 4.4, 3), capF(kn, ft, 2.4, 2)), far ? FURF : FUR, { z: far ? -3 : 5, h: 2.6 }); S.add(polyF([[ft[0] - 2, ft[1] - 3], [ft[0] + 3, ft[1] - 3], [ft[0] + 3.4, ft[1]], [ft[0] - 2, ft[1]]]), far ? SILVF : SILV, { z: far ? -2.9 : 5.1, h: 1 }); };
  legE(cx + 18, lg.ff, 1, 1), legE(cx - 22, lg.bf, 1, 0);
  // 몸
  S.add(U(ellR(cx, cy - rr * 4, 28, 14), ellR(cx + 18, cy - 4 - rr * 8, 14, 15)), FUR, { z: 1, h: 12 });
  S.add(polyF([[cx - 30, cy - 4], [cx - 34, cy + 2], [cx - 28, cy + 4]]), FURF, { z: 0.8, h: 2 });
  // 목 + 목털
  const nk = [cx + 26, cy - 10 - rr * 10], hp = lerp([cx + 40, cy - 30 - rr * 10], [cx + 44, cy - 4], hd);
  S.add(capF(nk, hp, 8, 6), FUR, { z: 2, h: 6 });
  S.add(polyF([[nk[0] - 6, nk[1] - 4], [hp[0] - 2, hp[1] + 4], [hp[0] + 2, hp[1] + 14], [nk[0] + 6, nk[1] + 16], [nk[0] - 2, nk[1] + 18]]), MANE, { z: 2.6, h: 4 });
  for (let k = 0; k < 5; k++) S.carve(capF([nk[0] - 2 + k * 2, nk[1] + 2], [nk[0] + k * 2.4, nk[1] + 16], 0.4), 0.7);
  // 머리 (긴 코)
  const ha = L(0.5, 1.4, hd);
  S.add(U(ellR(hp[0], hp[1], 6, 5.4), capF(hp, pol(hp, ha, 12), 4.4, 3.2)), FUR, { z: 3, h: 4 });
  S.add(ellR(...pol(hp, ha, 11), 3, 2.4), mat(ramp(0x3a3a44), { tex: "skin" }), { z: 3.2, lift: 0.4, h: 1 });
  S.add(ellR(hp[0] - 3, hp[1] - 3, 2.4, 3.4), FURF, { z: 2.8, h: 1.4 });
  !p.hurt && S.decal(...pol(pol(hp, ha, 3), ha - 1.57, 2), 0xb8e0ff);
  // 수정 뿔 (가지)
  for (const [d, z, M] of [[-1, 2.4, CRYF], [1, 4, CRY]]) {
    const r = pol(hp, ha - 1.9, 3 + d), base = ha - 2.2 - d * 0.2;
    let q = r, a = base;
    for (let k = 0; k < 4; k++) { const n2 = pol(q, a, 7); S.add(capF(q, n2, 1.8 - k * 0.25, 1.4 - k * 0.25), M, { z, h: 1.2 }); shard(S, n2, a + 0.9 - k * 0.1, 7 - k, 1.2, M, z + 0.1); q = n2; a -= 0.35; }
    shard(S, q, a, 8, 1.4, M, z + 0.1);
  }
  legE(cx + 22, lg.fn, 0, 1), legE(cx - 18, lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  if (p.glow) { const P = toPx(W, H, ELK, 66); glint(C, P, hp[0] - 10, hp[1] - 30, 3); glint(C, P, hp[0] + 4, hp[1] - 26, 2); }
  return fin(C, p);
}
export const pxElk = {
  fw: Math.round(140 * ELK), fh: Math.round(110 * ELK), w: 40, h: 36,
  anims: { idle: [4, 3], move: [6, 10], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], rear: [4, 9, !1], stomp: [3, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5, head: 0.1 };
    if (nm === "move") P = { legs: gait4(f, n, 7, 3), bob: Math.cos(ph * 2) * 1, head: 0.2 };
    if (nm === "wind") P = { head: 0.2 + t * 0.8, bob: 1 };
    if (nm === "atk") P = { head: 1, bob: [0, -1, 0][f] };
    if (nm === "rec") P = { head: 1 - t };
    if (nm === "rear") P = { rear: t, head: 0, glow: t > 0.5 };
    if (nm === "stomp") P = { rear: [0.4, 0, 0][f], bob: [0, 2, 1][f], glow: 1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, head: 0.4 };
    return elkFrame(P);
  },
};

// ════ 반딧불 하늘오징어 ════ 공중을 헤엄치는 반투명 오징어 · 몸에 박힌 푸른 발광점 · 지느러미를 물결치고 다리를 끌며 난다 · 빛 먹물을 뿜는다
//   p: ph · pulse · squirt · hurt
const SQK = 0.72;
function squidFrame(p = {}) {
  const W = 72, H = 64, S = sculpt(W, H, { k: SQK, ax: 36 });
  const ph = p.ph ?? 0, pu = p.pulse ?? 0, sq = p.squirt ?? 0, cx = 30, cy = 28;
  const BODY = mat(ramp(0x8aa0c8, { hi: 0.6 }), { tex: "glass", amp: 0.8, spec: 0.8 }), BODYF = mat(rampF(0x6a7aa0), { tex: "glass" });
  // 다리 (뒤로 끌림)
  for (let k = 0; k < 6; k++) { let q = [cx - 10, cy + 2 + (k - 2.5) * 1.4], a = Math.PI + (k - 2.5) * 0.14; for (let j = 0; j < 6; j++) { a += Math.sin(ph * 2 + j * 0.7 + k) * 0.12 * (1 - pu * 0.5); const n2 = pol(q, a, 3.2 - pu); S.add(capF(q, n2, 1 - j * 0.12), k % 2 ? BODYF : BODY, { z: k % 2 ? -1 : 2, h: 0.6 }); q = n2; } }
  // 몸통 (앞쪽이 머리 방향 = 오른쪽 · 몸은 뒤쪽 원뿔)
  S.add(U(ellR(cx + 6, cy, 14 - pu * 2, 6 + pu), polyF([[cx + 18, cy - 4], [cx + 30, cy], [cx + 18, cy + 4]])), BODY, { z: 1, h: 6 });
  // 지느러미
  S.add(polyF([[cx + 20, cy - 2], [cx + 26 + Math.sin(ph * 2) * 2, cy - 9], [cx + 30, cy - 1]]), BODYF, { z: 1.2, h: 1 });
  // 머리 + 눈
  S.add(ellR(cx - 6, cy, 6, 5.4), BODY, { z: 1.4, h: 4 });
  S.add(ellR(cx - 6, cy - 1, 2.4, 2.4), VD, { z: 1.8, lift: 0.2, h: 0.6 });
  !p.hurt && S.decal(cx - 6.6, cy - 1.6, 0xd8f0ff);
  for (const [x, y] of [[0, -2], [6, 2], [12, -1], [16, 2], [-2, 3], [8, -4]]) S.add(ellR(cx + x, cy + y, 1, 1), LGT, { on: 1, lift: 0.6, h: 0.4 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, SQK, 36);
  if (sq > 0) for (let k = 0; k < 10; k++) { const q = P(cx - 12 - k * 2 - sq * 6, cy + Math.sin(k * 1.7) * (2 + k * 0.6)); C.px(q[0], q[1], k % 2 ? 0xb8e0ff : 0xf0faff); }
  return fin(C, p);
}
export const pxSquid = {
  fw: Math.round(72 * SQK), fh: Math.round(64 * SQK), w: 20, h: 14, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, pulse: Math.max(0, Math.sin(ph)) * 0.4 };
    if (nm === "move") P = { ph: ph * 2, pulse: Math.max(0, Math.sin(ph)) };
    if (nm === "wind") P = { ph, pulse: t };
    if (nm === "atk") P = { ph, pulse: 0, squirt: [0.5, 1, 1][f] };
    if (nm === "rec") P = { ph, pulse: 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3, pulse: 0.8 };
    return squidFrame(P);
  },
};

// ════ 렌즈 술사 ════ 렌즈를 연구하는 동굴 학자 · 겹겹이 낀 놋쇠 안경 · 별무늬 남색 외투 · 큰 렌즈를 단 지팡이로 빛을 모아 쏜다
//   p: legs · bob · cast · hurt
const LMK = 0.72;
function lensFrame(p = {}) {
  const W = 100, H = 100, G = H - 1, S = sculpt(W, H, { k: LMK, ax: 40 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cs = p.cast ?? 0, cx = 38;
  const BRASS = mat(ramp(0xc8a050), { tex: "metal", amp: 0.8, spec: 0.8 }), SKN = mat(ramp(0xc8a890), { tex: "skin", amp: 0.7 });
  // 외투 + 다리
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 4]]) { const hp = [cx + d, 70 + b], ft = [cx + d + o[0], G - 2 - o[1]]; S.add(capF(hp, ft, 3, 2.6), far ? ROBEF : mat(ramp(0x4a4a5a), { tex: "cloth" }), { z: far ? -2 : 2, h: 2 }); S.add(ellR(ft[0] + 2, ft[1], 4, 1.8), far ? mat(rampF(0x3a2a20)) : mat(ramp(0x4a3628), { tex: "leather" }), { z: far ? -1.9 : 2.1, h: 1.2 }); }
  S.add(polyF([[cx - 9, 40 + b], [cx + 10, 40 + b], [cx + 14, 82 + b], [cx + 4, 80 + b], [cx - 4, 84 + b], [cx - 14, 80 + b]]), ROBE, { z: 1, h: 8 });
  for (const [x, y] of [[-6, 56], [4, 64], [-8, 74], [8, 76], [0, 50]]) S.add(ellR(cx + x, y + b, 1, 1), BRASS, { on: 1, lift: 0.3, h: 0.3 });
  S.add(capF([cx - 9, 58 + b], [cx + 10, 58 + b], 1.6), mat(ramp(0x4a3628), { tex: "leather" }), { z: 1.5, h: 1 });
  for (const x of [-4, 2, 7]) S.add(ellR(cx + x, 61 + b, 1.6, 2), BRASS, { z: 1.7, h: 1 });
  // 먼 팔 + 지팡이 (렌즈)
  const st0 = [cx - 12, G - 1], st1 = lerp([cx - 8, 24 + b], [cx + 6, 22 + b], cs);
  S.add(capF(st0, st1, 1.1, 1), mat(ramp(0x4a3a2a), { tex: "wood" }), { z: -1, h: 1 });
  S.add(capF([cx - 6, 42 + b], lerp(st0, st1, 0.7), 2.4, 2), ROBEF, { z: -0.5, h: 2 });
  S.add(ellR(st1[0], st1[1] - 4, 6, 7), BRASS, { z: -0.6, h: 2 });
  S.add(ellR(st1[0], st1[1] - 4, 4.6, 5.6), cs > 0.4 ? LGTW : CRY, { z: -0.2, h: 2.4 });
  // 몸 + 머리
  S.add(ellR(cx, 44 + b, 9.4, 8), ROBE, { z: 2, h: 6 });
  const hx = cx + 3, hy = 30 + b;
  S.add(ellR(hx, hy, 6.4, 7), SKN, { z: 3, h: 4 });
  S.add(polyF([[hx - 3, hy + 4], [hx + 6, hy + 4], [hx + 4, hy + 13], [hx, hy + 10]]), mat(ramp(0xb8b0a8), { tex: "fur", dir: 1.57 }), { z: 3.3, h: 1.6 });
  S.add(U(ellR(hx - 1, hy - 6, 7, 3.6), capF([hx - 7, hy - 4], [hx - 8, hy + 4], 2.2, 1.6)), mat(ramp(0x8a8a90), { tex: "fur" }), { z: 3.4, h: 2 });
  for (const [x, r] of [[3.6, 2.4], [7, 1.8]]) { S.add(ellR(hx + x, hy - 1, r, r), BRASS, { z: 3.8, h: 1 }); S.add(ellR(hx + x, hy - 1, r - 0.8, r - 0.8), CRY, { z: 4, h: 0.6 }); }
  S.add(capF([hx + 6, hy - 1], [hx + 12, hy - 1 + Math.sin(cs * 3)], 0.5), BRASS, { z: 4, h: 0.4 });
  S.add(ellR(hx + 12.4, hy - 0.4, 1.4, 1.4), CRY, { z: 4.1, h: 0.6 });
  // 가까운 팔 (손짓)
  const sh = [cx + 6, 40 + b], hd = [cx + 14 + cs * 4, 54 + b - cs * 12];
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 3, 2.6), capF(lerp(sh, hd, 0.5), hd, 2.6, 2.8)), ROBE, { z: 6, h: 2.2 });
  S.add(ellR(hd[0], hd[1], 2, 1.8), SKN, { z: 6.2, h: 1.2 });
  const C = S.render({ rim: !0 });
  cs > 0.4 && glint(C, toPx(W, H, LMK, 40), st1[0], st1[1] - 4, 3 + Math.round(cs * 2));
  return fin(C, p);
}
export const pxLensMage = {
  fw: Math.round(100 * LMK), fh: Math.round(100 * LMK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 4, 1.4); P = { legs: g, bob: g.bob * 0.5 }; }
    if (nm === "wind") P = { cast: t };
    if (nm === "atk") P = { cast: 1, bob: -0.5 };
    if (nm === "rec") P = { cast: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return lensFrame(P);
  },
};

// ════ [정예] 수정 갈기 사자 ════ 은빛 털의 거대한 동굴 사자 · 목을 두른 갈기가 전부 푸른 수정 가시 · 꼬리 끝 수정 술 · 빛을 머금은 눈 ·
//   포효하면 갈기에서 빛이 터진다
//   p: legs · bob · pounce · roar · hurt
const LNK = 0.66;
function lionFrame(p = {}) {
  const W = 200, H = 128, G = H - 1, S = sculpt(W, H, { k: LNK, ax: 92 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, pc = p.pounce ?? 0, ro = p.roar ?? 0, cx = 84, cy = 80 + b - pc * 10;
  const FUR = mat(ramp(0xa8a8b0), { tex: "fur", amp: 1, dir: 0.2 }), FURF = mat(rampF(0x7a7a84), { tex: "fur", amp: 0.9, dir: 0.2 });
  const legL = (x, o, far, front) => { const hp = [x, cy + 6], ft = [x + o[0] + (front ? pc * 20 : -pc * 10), G - 1 - o[1] - (front ? pc * 20 : 0)], kn = [L(hp[0], ft[0], 0.5) + (front ? -3 : 5), L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 12, 9), capF(kn, ft, 7, 6)), far ? FURF : FUR, { z: far ? -4 : 6, h: 6 }); S.add(ellR(ft[0] + 3, ft[1] - 2, 7, 3.4), far ? FURF : FUR, { z: far ? -3.9 : 6.1, h: 2 }); for (const d of [0, 3, 6]) S.add(capF([ft[0] + 5 + d * 0.6, ft[1] - 1], [ft[0] + 8 + d * 0.6, ft[1] + 0.5], 0.8, 0.3), CRYF, { z: far ? -3.8 : 6.2, h: 0.4 }); };
  legL(cx + 30, lg.ff, 1, 1), legL(cx - 34, lg.bf, 1, 0);
  // 꼬리
  let q = [cx - 44, cy - 6], a = Math.PI + 0.6;
  const tl = [];
  for (let k = 0; k < 10; k++) { const n2 = pol(q, a, 4.4); tl.push(capF(q, n2, 2.8 - k * 0.12, 2.6 - k * 0.12)); q = n2; a -= 0.18 - Math.sin((p.ph ?? 0) + k * 0.5) * 0.06; }
  S.add(U(...tl), FUR, { z: 0.5, h: 2 });
  for (let k = 0; k < 4; k++) shard(S, q, a + (k - 1.5) * 0.4, 9, 1.6, k % 2 ? CRY : LAV, 0.6);
  // 몸
  S.add(U(ellR(cx - 6, cy, 42, 24), ellR(cx + 24, cy - 6, 26, 26), ellR(cx - 34, cy + 2, 18, 20)), FUR, { z: 1, h: 18 });
  for (let k = 0; k < 5; k++) S.carve(capF([cx - 30 + k * 8, cy - 10], [cx - 34 + k * 8, cy + 10], 0.5), 0.8);
  // 머리 + 수정 갈기
  const hx = cx + 50, hy = cy - 18 + pc * 6;
  for (let k = 0; k < 16; k++) { const a2 = -Math.PI * 0.95 + (k / 15) * Math.PI * 1.7, r = pol([hx - 6, hy + 2], a2, 10 + ro * 3); shard(S, r, a2, 16 + (k % 3) * 5 + ro * 6, 3, k % 3 === 1 ? LAV : k % 3 ? CRY : CRYF, 3 + (Math.sin(a2) > 0 ? 0.6 : 0)); }
  S.add(ellR(hx - 6, hy + 2, 15, 16), CRYF, { z: 3.2, h: 6 });
  S.add(U(ellR(hx, hy, 11, 11), capF([hx + 4, hy + 2], [hx + 14, hy + 4 + ro * 2], 7, 5)), FUR, { z: 4, h: 8 });
  S.add(ellR(hx + 14, hy + 1, 2.6, 2), mat(ramp(0x3a3a48)), { z: 4.4, lift: 0.4, h: 0.6 });
  if (ro > 0) { S.add(ellR(hx + 10, hy + 8 + ro * 2, 5, 2 + ro * 3), VD, { z: 4.3, h: 0.6 }); for (const x of [8, 13]) S.add(polyF([[hx + x, hy + 6], [hx + x + 1, hy + 9 + ro], [hx + x + 2, hy + 6]]), mat(ramp(0xf0f0f0), { spec: 1 }), { z: 4.6, h: 0.4, prof: "sharp" }); }
  S.add(ellR(hx + 6, hy - 3, 2.6, 1.8), VD, { z: 4.5, lift: 0.1, h: 0.3 });
  !p.hurt && S.decal(hx + 6.6, hy - 3.2, 0xd8f4ff).decal(hx + 5.6, hy - 3.2, 0x7ab8f0);
  legL(cx + 34, lg.fn, 0, 1), legL(cx - 30, lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, LNK, 92);
  if (ro > 0.4) for (let k = 0; k < 8; k++) glint(C, P, hx - 6 + Math.cos(k * 0.8) * 34, hy + 2 + Math.sin(k * 0.8) * 30, 2 + (k % 2));
  return fin(C, p);
}
export const pxLion = {
  fw: Math.round(200 * LNK), fh: Math.round(128 * LNK), w: 64, h: 50,
  anims: { idle: [4, 4], move: [6, 10], wind: [3, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], roar: [4, 8, !1], pounce: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph };
    if (nm === "move") P = { legs: gait4(f, n, 9, 4), bob: Math.cos(ph * 2) * 1.4, ph };
    if (nm === "wind") P = { bob: 3 * t, ph, roar: 0.2 };
    if (nm === "atk") P = { pounce: [0.6, 1, 0.6][f], roar: 0.6, ph };
    if (nm === "rec") P = { pounce: 0.4 * (1 - t), ph };
    if (nm === "roar") P = { roar: [0.4, 1, 1, 0.6][f], bob: -1, ph };
    if (nm === "pounce") P = { pounce: [0.4, 1, 1][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return lionFrame(P);
  },
};

// ════ 은거울 코브라 ════ 거울처럼 빛나는 넓은 목 두건 · 두건 안쪽의 눈 무늬 · 똬리 튼 은빛 몸 · 두건을 펴 빛을 비춰 눈을 멀게 하고 독니로 문다
//   p: ph · hood · strike · hurt
const CBK = 0.72;
function cobraFrame(p = {}) {
  const W = 84, H = 66, G = H - 1, S = sculpt(W, H, { k: CBK, ax: 38 });
  const ph = p.ph ?? 0, hd = p.hood ?? 0, st = p.strike ?? 0, cx = 34;
  const SC = mat(ramp(0x8a90a0), { tex: "scale", amp: 1, spec: 0.8 }), SCF = mat(rampF(0x5e6474), { tex: "scale", amp: 0.9 });
  // 똬리
  for (let k = 0; k < 14; k++) { const a = (k / 14) * T2 * 1.3 + ph * 0.3, r = 14 - k * 0.5, q = [cx - 2 + Math.cos(a) * r, G - 5 + Math.sin(a) * r * 0.3]; S.add(ellR(q[0], q[1], 5 - k * 0.1, 4), Math.sin(a) > 0 ? SC : SCF, { z: Math.sin(a) > 0 ? 2 : 0, h: 3 }); }
  // 세운 목 (곡선)
  const pts = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([cx + 4 + Math.sin(t * 2.2) * 6 + st * t * t * 22, G - 8 - t * (34 - st * 10) + Math.sin(ph + t * 3) * 1.4]); }
  for (let k = 0; k < 8; k++) S.add(capF(pts[k], pts[k + 1], 4.4 - k * 0.2, 4.2 - k * 0.2), k % 2 ? SC : SCF, { z: 3 + k * 0.05, h: 3 });
  S.add(U(...pts.slice(1, 8).map((q, k) => capF(q, pts[k + 2], 1.4))), mat(ramp(0xd8d0c0), { tex: "scale" }), { z: 3.6, h: 0.4 });
  // 두건 (거울)
  const hc = pts[6], hw = 6 + hd * 6;
  S.add(ellR(hc[0] - 2, hc[1] + 1, hw, 13), MIR, { z: 3.8, h: 3 });
  S.add(ellR(hc[0] - 2, hc[1] + 1, hw - 1.8, 11), MIRF, { z: 3.9, lift: 0.2, h: 0.6 });
  S.add(capF([hc[0] - 2, hc[1] - 10], [hc[0] - 2, hc[1] + 12], 1.2), mat(ramp(0xd8d0c0), { tex: "scale" }), { z: 4, h: 0.4 });
  for (const d of [-1, 1]) if (hd > 0.3) { S.add(ellR(hc[0] - 1 + d * hw * 0.5, hc[1] + 1, 1.8, 2.2), LAV, { z: 4, lift: 0.3, h: 0.4 }); }
  // 머리
  const hp = pts[8], ha = -0.3 + st * 0.6;
  S.add(U(ellR(hp[0], hp[1], 4.4, 3.6), capF(hp, pol(hp, ha, 6), 3.4, 2.4)), SC, { z: 4.4, h: 2.6 });
  if (st > 0.4) { S.add(capF(pol(hp, ha, 2), pol(pol(hp, ha, 7), ha + 1.57, 4), 1.4, 0.6), VD, { z: 4.2, h: 0.4 }); for (const d of [0, 4]) S.add(polyF([pol(pol(hp, ha, 3 + d * 0.6), ha + 1.57, 1), pol(pol(hp, ha, 3.6 + d * 0.6), ha + 1.57, 3), pol(pol(hp, ha, 4 + d * 0.6), ha + 1.57, 1)]), mat(ramp(0xf0f0f0), { spec: 1 }), { z: 4.5, h: 0.3, prof: "sharp" }); }
  !p.hurt && S.decal(...pol(pol(hp, ha, 2), ha - 1.57, 1.4), 0xb8e0ff);
  const C = S.render({ rim: !0 });
  hd > 0.7 && glint(C, toPx(W, H, CBK, 38), hc[0], hc[1] - 3, 3);
  return fin(C, p);
}
export const pxCobra = {
  fw: Math.round(84 * CBK), fh: Math.round(66 * CBK), w: 22, h: 22,
  anims: { idle: [6, 5], move: [6, 8], wind: [3, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], hood: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, hood: 0.3 };
    if (nm === "move") P = { ph: ph * 2, hood: 0 };
    if (nm === "wind") P = { ph, hood: 0.6, strike: -0.3 * t };
    if (nm === "atk") P = { ph, hood: 0.4, strike: [0.7, 1, 0.8][f] };
    if (nm === "rec") P = { ph, strike: 0.8 * (1 - t), hood: 0.3 };
    if (nm === "hood") P = { ph, hood: [0.5, 1, 1, 0.7][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph, hood: 1 };
    return cobraFrame(P);
  },
};

// ════ 프리즘 점액 ════ 깎은 보석처럼 면이 진 투명한 점액 · 속에서 빛이 갈라져 무지개 띠가 돈다 · 한가운데 삼각 프리즘 핵
//   p: ph · sq · beam · hurt
const PSK = 0.72;
function prismFrame(p = {}) {
  const W = 66, H = 54, G = H - 1, S = sculpt(W, H, { k: PSK, ax: 33 });
  const ph = p.ph ?? 0, sq = p.sq ?? 0, bm = p.beam ?? 0, cx = 33, ry = 16 - sq * 3, rx = 20 + sq * 3, cy = G - ry;
  const GEL = mat(ramp(0xb8c8f0, { hi: 0.7 }), { tex: "crystal", amp: 1, spec: 1 });
  S.add(U(ellR(cx, cy, rx, ry), ellR(cx, G - 2, rx + 3, 3)), GEL, { z: 1, h: 13, prof: "sharp" });
  for (let k = 0; k < 6; k++) S.carve(capF(pol([cx, cy], k * 1.05 + ph * 0.2, 4), pol([cx, cy], k * 1.05 + ph * 0.2, rx), 0.4), 0.8, !1);
  const bands = [0xf0a0a0, 0xf0d890, 0xa8e8a0, 0x98c8f0, 0xc0a0f0];
  bands.forEach((c, k) => S.paint((x, y) => { const d = Math.hypot(x - cx, (y - cy) * 1.2), a = Math.atan2(y - cy, x - cx); return d > 6 + k * 2 && d < 8 + k * 2 && Math.sin(a * 2 + ph * 2) > 0.3; }, mat(ramp(c, { hi: 0.7 }), { tex: "glass", spec: 1 })));
  S.add(polyF([[cx - 4, cy + 4], [cx, cy - 5 - bm * 2], [cx + 4, cy + 4]]), LGTW, { z: 2, lift: 1, h: 2, prof: "sharp" });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, PSK, 33);
  glint(C, P, cx - 8, cy - ry * 0.5, 1 + (bm > 0.5 ? 2 : 0));
  if (bm > 0.4) for (let k = 0; k < 5; k++) { const q = P(cx + Math.cos(-1.2 + k * 0.6) * (rx + 4), cy + Math.sin(-1.2 + k * 0.6) * (ry + 4)); C.px(q[0], q[1], bands[k]); }
  return fin(C, p);
}
export const pxPrismSlime = {
  fw: Math.round(66 * PSK), fh: Math.round(54 * PSK), w: 24, h: 18,
  anims: { idle: [6, 6], move: [6, 8], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, sq: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { ph, sq: Math.sin(ph) };
    if (nm === "wind") P = { ph: ph * 2, sq: -0.4 * t, beam: t };
    if (nm === "atk") P = { ph, beam: 1, sq: 0.2 };
    if (nm === "rec") P = { ph, beam: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, sq: 0.8 };
    return prismFrame(P);
  },
};

// ════ 눈가린 수도사 ════ 빛에 눈이 멀지 않으려 두 눈을 천으로 동여맨 수도사 · 맨발 · 감아올린 남색 도복 · 붕대 감은 주먹 · 굵은 염주 ·
//   소리를 듣고 싸운다 (빛에 홀리지 않는다)
//   p: legs · bob · punch(0~2) · kick · hurt
const MKK = 0.72;
function monkFrame(p = {}) {
  const W = 104, H = 96, G = H - 1, S = sculpt(W, H, { k: MKK, ax: 40 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pu = p.punch ?? 0, kk = p.kick ?? 0, cx = 38;
  const SKN = mat(ramp(0xb89070), { tex: "skin", amp: 0.8, spec: 0.2 }), SKNF = mat(rampF(0x8a6a50), { tex: "skin" }), GI = mat(ramp(0x3a4a7a), { tex: "cloth", amp: 1 }), GIF = mat(rampF(0x2a3658), { tex: "cloth" }), WRAP = mat(ramp(0xd8d0c0), { tex: "cloth", amp: 0.8 });
  // 다리 (넓게 선 자세 · 발차기)
  const legM = (hp, ft, far) => { const kn = [L(hp[0], ft[0], 0.5) + 3, L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 4.4, 3.6), capF(kn, [ft[0], ft[1] - 3], 3.6, 3)), far ? GIF : GI, { z: far ? -3 : 3, h: 3 }); S.add(capF([ft[0] - 1, ft[1] - 4], [ft[0] - 1, ft[1] - 7], 3), WRAP, { z: far ? -2.9 : 3.1, h: 1.6 }); S.add(U(ellR(ft[0] + 2, ft[1] - 1.4, 4.4, 1.8)), far ? SKNF : SKN, { z: far ? -2.8 : 3.2, h: 1.2 }); };
  legM([cx - 3, 64 + b], [cx - 10 + g.f[0], G - 1 - g.f[1]], 1);
  // 몸 (도복 · 띠)
  S.add(U(ellR(cx, 50 + b, 11, 13), polyF([[cx - 10, 54 + b], [cx + 10, 54 + b], [cx + 11, 68 + b], [cx - 11, 68 + b]])), GI, { z: 1, h: 9 });
  S.add(polyF([[cx - 2, 38 + b], [cx + 6, 38 + b], [cx + 2, 54 + b]]), SKN, { z: 1.4, h: 2 });
  S.add(capF([cx - 10, 60 + b], [cx + 10, 60 + b], 1.8), mat(ramp(0x1a1a22), { tex: "cloth" }), { z: 2, h: 1.2 });
  S.add(capF([cx + 8, 60 + b], [cx + 12, 70 + b], 1, 0.6), mat(ramp(0x1a1a22), { tex: "cloth" }), { z: 2.1, h: 0.6 });
  // 염주
  for (let k = 0; k < 9; k++) { const a = -0.4 + k * 0.4, q = [cx + 2 + Math.cos(a) * 8, 42 + b + Math.sin(a) * 6 + k * 0.6]; S.add(ellR(q[0], q[1], 1.4, 1.4), mat(ramp(0x6a3a2a), { spec: 0.6 }), { z: 2.4, h: 1 }); }
  // 먼 팔 (주먹 막기)
  const shF = [cx - 6, 42 + b], hF = pu > 1 ? [cx + 4, 48 + b] : lerp([cx + 14, 44 + b], [cx + 30, 42 + b], Math.max(0, pu - 0) * (pu <= 1 ? 1 : 0));
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 3, 2.6), capF(lerp(shF, hF, 0.5), hF, 2.6, 2.4)), SKNF, { z: -1, h: 2 });
  S.add(ellR(hF[0], hF[1], 2.8, 2.6), WRAP, { z: -0.8, h: 1.8 });
  // 머리 (민머리 · 눈가리개)
  const hx = cx + 4, hy = 30 + b;
  S.add(ellR(hx, hy, 6.4, 7), SKN, { z: 3, h: 5 });
  S.add(capF([hx - 6, hy - 1.4], [hx + 7, hy - 1], 2), WRAP, { z: 3.6, h: 1 });
  S.add(capF([hx - 6, hy - 1.4], [hx - 12, hy + 4 + Math.sin(p.ph ?? 0) * 1.4], 1.2, 0.6), WRAP, { z: 2.8, h: 0.6 });
  S.add(capF([hx - 6, hy - 1], [hx - 11, hy + 8], 1, 0.6), WRAP, { z: 2.7, h: 0.6 });
  S.add(ellR(hx + 6, hy + 2, 1.4, 1.6), SKN, { z: 3.2, h: 0.8 });
  S.add(capF([hx + 2, hy + 4.6], [hx + 5, hy + 4.6], 0.4), mat(ramp(0x5a3a2a)), { z: 3.3, lift: 0.1, h: 0.2 });
  // 가까운 다리 (발차기)
  legM([cx + 3, 64 + b], kk > 0 ? lerp([cx + 8 + g.n[0], G - 1 - g.n[1]], [cx + 34, 54 + b], kk) : [cx + 8 + g.n[0], G - 1 - g.n[1]], 0);
  // 가까운 팔 (주먹)
  const sh = [cx + 6, 42 + b], hd = pu <= 1 ? lerp([cx + 12, 50 + b], [cx + 8, 46 + b], pu) : lerp([cx + 8, 46 + b], [cx + 32, 42 + b], Math.min(1, pu - 1));
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 3.4, 2.8), capF(lerp(sh, hd, 0.5), hd, 2.8, 2.6)), SKN, { z: 6, h: 2.2 });
  S.add(capF(lerp(sh, hd, 0.7), hd, 2.8), WRAP, { z: 6.2, h: 1.6 });
  S.add(ellR(hd[0] + 1, hd[1], 3, 2.8), WRAP, { z: 6.4, h: 2 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxMonk = {
  fw: Math.round(104 * MKK), fh: Math.round(96 * MKK), w: 16, h: 32,
  anims: { idle: [4, 5], move: [6, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], kick: [3, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8 + 1, ph };
    if (nm === "move") { const g = gait2(f, n, 6, 2.6); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { punch: t, bob: 1.6, ph };
    if (nm === "atk") P = { punch: [1.6, 2, 2][f], ph };
    if (nm === "rec") P = { punch: 2 * (1 - t), ph };
    if (nm === "kick") P = { kick: [0.5, 1, 0.8][f], bob: -1, ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return monkFrame(P);
  },
};

// ════ [정예] 수정 용거북 ════ 언덕만 한 등딱지에 푸른 수정 첨탑이 숲처럼 솟은 늙은 용거북 · 비늘 덮인 용머리와 수염 · 굵은 발톱 ·
//   첨탑이 빛을 모아 하늘로 쏘아 올리면 빛줄기가 쏟아진다
//   p: legs · bob · head · glow · hurt
const TTK = 0.64;
function turtleFrame(p = {}) {
  const W = 210, H = 140, G = H - 1, S = sculpt(W, H, { k: TTK, ax: 100 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd = p.head ?? 0, gl = p.glow ?? 0, cx = 92, cy = 108 + b;
  const SKN = mat(ramp(0x5a6a78), { tex: "scale", amp: 1.1, spec: 0.5 }), SKNF = mat(rampF(0x445260), { tex: "scale", amp: 1 }), SHL = mat(ramp(0x4a5468), { tex: "stone", amp: 1.3, spec: 0.3 });
  const legT = (x, o, far) => { const hp = [x, cy], ft = [x + o[0] + 4, G - 1 - o[1]]; S.add(U(capF(hp, ft, 14, 11), ellR(ft[0], ft[1] - 3, 13, 5)), far ? mat(rampF(0x445260), { tex: "skin", amp: 1.2 }) : mat(ramp(0x5a6a78), { tex: "skin", amp: 1.3, spec: 0.3 }), { z: far ? -4 : 7, h: 7 }); for (let k = 0; k < 3; k++) S.carve(capF([hp[0] - 12, hp[1] + 6 + k * 8], [hp[0] + 12, hp[1] + 4 + k * 8], 0.5), 0.8); for (const d of [-5, 0, 5]) S.add(polyF([[ft[0] + d + 2, ft[1] - 3], [ft[0] + d + 7, ft[1]], [ft[0] + d + 2, ft[1]]]), CRYF, { z: far ? -3.9 : 7.1, h: 0.8, prof: "sharp" }); };
  legT(cx + 40, lg.ff, 1), legT(cx - 40, lg.bf, 1);
  // 꼬리
  S.add(capF([cx - 56, cy - 4], [cx - 78, cy + 8], 7, 2), SKN, { z: 0.5, h: 4 });
  // 등딱지 (돔 · 판)
  S.add(minus(ellR(cx, cy - 4, 66, 46), (x, y) => y > cy + 8), SHL, { z: 1, h: 28 });
  S.add(capF([cx - 62, cy + 4], [cx + 62, cy + 4], 4), mat(ramp(0x6a7480), { tex: "stone" }), { z: 1.6, h: 2 });
  for (const [x, y, r] of [[-30, -18, 12], [0, -30, 13], [30, -18, 12], [-44, -2, 9], [44, -2, 9], [-14, -6, 10], [16, -6, 10]]) S.carve(minus(ellR(cx + x, cy + y, r, r * 0.7), ellR(cx + x, cy + y, r - 1.4, r * 0.7 - 1.4)), 0.9);
  // 수정 첨탑 숲
  const spires = [[-40, -14, 22, -0.25], [-24, -28, 34, -0.12], [-8, -38, 46, -0.03], [8, -36, 40, 0.05], [24, -28, 30, 0.14], [40, -16, 22, 0.24], [-14, -24, 20, -0.2], [16, -22, 18, 0.2], [-52, -2, 12, -0.5], [52, -2, 12, 0.5]];
  spires.forEach(([x, y, l, a], k) => { shard(S, [cx + x, cy + y], -Math.PI / 2 + a, l, 4 + l * 0.08, k % 3 === 1 ? LAV : gl > 0.5 && k < 6 ? LGTW : CRY, 6 + (k > 5 ? 0.4 : 0)); k < 6 && shard(S, [cx + x + 3, cy + y + 2], -Math.PI / 2 + a + 0.4, l * 0.45, 2.4, CRYF, 6.2); });
  // 머리 (용 · 수염)
  const nk = [cx + 56, cy - 4], hp = lerp([cx + 84, cy - 22], [cx + 88, cy + 2], hd);
  S.add(capF(nk, hp, 10, 8), SKN, { z: 3, h: 7 });
  for (let k = 0; k < 4; k++) S.carve(capF(lerp(nk, hp, 0.2 + k * 0.2), [lerp(nk, hp, 0.2 + k * 0.2)[0] + 2, lerp(nk, hp, 0.2 + k * 0.2)[1] + 8], 0.5), 0.7);
  S.add(U(ellR(hp[0], hp[1], 10, 8.4), capF([hp[0] + 4, hp[1] + 1], [hp[0] + 18, hp[1] + 3], 6, 4)), SKN, { z: 4, h: 6 });
  S.add(capF([hp[0] + 6, hp[1] + 5 + (p.open ?? 0) * 4], [hp[0] + 17, hp[1] + 6 + (p.open ?? 0) * 6], 3, 2), SKNF, { z: 3.8, h: 2 });
  for (const d of [-1, 1]) S.add(capF([hp[0] - 2, hp[1] - 6], [hp[0] - 14, hp[1] - 12 + d * 3], 2, 0.6), CRY, { z: 4.2 + d * 0.1, h: 1 });
  S.add(capF([hp[0] + 12, hp[1] + 6], [hp[0] + 6 + Math.sin(p.ph ?? 0) * 2, hp[1] + 22], 1.2, 0.4), mat(ramp(0xc8d0d8), { tex: "fur" }), { z: 4.6, h: 0.6 });
  S.add(capF([hp[0] + 16, hp[1] + 2], [hp[0] + 24, hp[1] + 12 + Math.sin(p.ph ?? 0) * 2], 0.8, 0.3), mat(ramp(0xc8d0d8), { tex: "fur" }), { z: 4.6, h: 0.4 });
  S.add(ellR(hp[0] + 4, hp[1] - 3, 2.6, 2), VD, { z: 4.4, lift: 0.1, h: 0.3 });
  !p.hurt && S.decal(hp[0] + 4.6, hp[1] - 3.2, 0xd8f4ff);
  legT(cx + 46, lg.fn, 0), legT(cx - 34, lg.bn, 0);
  const C = S.render({ rim: !0 });
  if (gl > 0.3) { const P = toPx(W, H, TTK, 100); for (const [x, y, l] of spires.slice(0, 6)) glint(C, P, cx + x, cy + y - l + 2, 2 + Math.round(gl * 2)); }
  return fin(C, p);
}
export const pxTurtle = {
  fw: Math.round(210 * TTK), fh: Math.round(140 * TTK), w: 80, h: 50,
  anims: { idle: [4, 3], move: [6, 5], wind: [4, 6, !1], atk: [3, 12, !1], rec: [3, 6, !1], hurt: [2, 10, !1], glow: [4, 6, !1], stomp: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6, ph };
    if (nm === "move") P = { legs: gait4(f, n, 6, 3), bob: Math.cos(ph * 2) * 1, ph };
    if (nm === "wind") P = { head: -0.3 * t, open: t * 0.5, ph };
    if (nm === "atk") P = { head: [0.6, 1, 0.8][f], open: 1, ph };
    if (nm === "rec") P = { head: 0.8 * (1 - t), ph };
    if (nm === "glow") P = { glow: [0.4, 0.8, 1, 1][f], ph, head: -0.4 };
    if (nm === "stomp") P = { bob: [-3, 3, 1][f], ph, legs: { fn: [0, [4, 0, 0][f]], ff: [0, [4, 0, 0][f]] } };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return turtleFrame(P);
  },
};
