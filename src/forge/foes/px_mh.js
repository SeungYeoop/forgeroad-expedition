// 미스트혼 몬스터 12종 (조각 도구, 오른쪽을 본다) — 동굴 속 죽은 숲 · 겹겹의 짙은 안개 띠 · 잿빛 초록 고목 · 드문 등불 빛
//   위 줄: 등불 허수아비 · 흰 족제비 · 덫사냥꾼 · [정예] 목 없는 기사
//   가운데 줄: 입 벌린 그루터기 · 통곡하는 드라이어드 · 대벌레 · [정예] 웬디고
//   아래 줄: 낙엽 덩이 · 미친 나무꾼 · 회색 너구리 · [정예] 외눈 거인
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm } from "./px_ah.js";

const BARK = mat(ramp(0x5a5448), { tex: "wood", amp: 1.2, dir: 1.57 }), BARKF = mat(rampF(0x423e34), { tex: "wood", amp: 1.1, dir: 1.57 });
const DEAD = mat(ramp(0x6a6a60), { tex: "wood", amp: 1, dir: 1.57 }), MOSS = mat(ramp(0x5a6a4a), { tex: "leaf", amp: 1.2 }), MOSSL = mat(ramp(0x8a9a78), { tex: "fur", amp: 1.2, dir: 1.57 });
const LAMP = mat(rampGlow(0xffc060)), LAMPW = mat(rampGlow(0xfff0c0)), VD = mat(ramp(0x0e1210)), IRON = mat(ramp(0x5a5c5a), { tex: "metal", amp: 0.9, spec: 0.5 }), IRONF = mat(rampF(0x444644), { tex: "metal", amp: 0.8 });
const BONE = mat(ramp(0xd0c8b4), { tex: "stone", amp: 0.5, spec: 0.3 }), LEATH = mat(ramp(0x5a4232), { tex: "leather", amp: 1 }), LEATHF = mat(rampF(0x40302a), { tex: "leather", amp: 0.9 });
const FURG = mat(ramp(0x7a766a), { tex: "fur", amp: 1.2, dir: 1.4 }), FURGF = mat(rampF(0x5a564c), { tex: "fur", amp: 1.1, dir: 1.4 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 안개 자락 (렌더 뒤: 바닥 가까이 흐르는 옅은 점)
function mist(C, P, x0, x1, y, ph, n = 14) { for (let k = 0; k < n; k++) { const t = (k / n + ph * 0.05) % 1, q = P(L(x0, x1, t), y + Math.sin(k * 2.1 + ph) * 2); C.px(q[0], q[1], k % 3 ? 0x9aaaa8 : 0xc8d8d8); } }
// 마른 가지 (뿌리 r 에서 a 방향 · 갈래)
function twig(S, r, a, l, w, M, z, depth = 2, seed = 0) {
  const e = pol(r, a, l);
  S.add(capF(r, e, w, w * 0.6), M, { z, h: w * 0.7 });
  if (depth > 0) for (const d of [-0.55, 0.5]) twig(S, pol(r, a, l * (0.55 + ((seed + d * 10) % 3) * 0.08)), a + d + Math.sin(seed + d) * 0.15, l * 0.55, w * 0.6, M, z, depth - 1, seed + 1);
  return e;
}

// ════ 등불 허수아비 ════ 죽은 숲 한가운데 박힌 허수아비 · 삼베 자루 머리에 칼로 판 얼굴, 그 속에서 등불이 탄다 · 누더기 외투 · 삐져나온 짚 ·
//   한 팔은 녹슨 낫 · 기둥째 깡충깡충 다가온다
//   p: hop · sw · glow · hurt
const SCK = 0.72;
const SACK = mat(ramp(0xa8906a), { tex: "cloth", amp: 1.3 }), STRAW = mat(ramp(0xc8b070), { tex: "fur", amp: 1.4, dir: 1.57 }), COAT = mat(ramp(0x4a4a44), { tex: "cloth", amp: 1.2 }), COATF = mat(rampF(0x363630), { tex: "cloth", amp: 1 });
function scarecrowFrame(p = {}) {
  const W = 104, H = 108, G = H - 1, S = sculpt(W, H, { k: SCK, ax: 44 });
  const hp = p.hop ?? 0, sw = p.sw ?? 0, gl = p.glow ?? 0, cx = 42, Y = 36 - hp * 8;
  // 기둥
  S.add(capF([cx, G - 1 - hp * 8], [cx, Y - 8], 2.6, 2.2), BARK, { z: 0, h: 2 });
  for (let k = 0; k < 3; k++) S.add(capF([cx - 2, G - 2 - k * 3 - hp * 8], [cx + 2 + k, G - 6 - k * 3 - hp * 8], 0.6), STRAW, { z: 0.2, h: 0.4 });
  // 가로대 + 먼 팔 소매
  S.add(capF([cx - 22, Y + 8], [cx + 20, Y + 6], 2, 1.8), BARKF, { z: -0.5, h: 1.6 });
  S.add(U(capF([cx - 6, Y + 8], [cx - 22, Y + 10], 4.4, 3.6)), COATF, { z: -0.3, h: 3 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 24, Y + 8 + k * 1.4], [cx - 30 + Math.sin(k) * 2, Y + 12 + k * 2], 0.7, 0.3), STRAW, { z: -0.2, h: 0.4 });
  // 외투 (누더기)
  const hem = [];
  for (let k = 0; k <= 6; k++) hem.push([cx - 14 + k * 4.6 + Math.sin((p.ph ?? 0) + k) * 1, Y + 44 + (k % 2) * 5]);
  S.add(polyF([[cx - 10, Y + 4], [cx + 10, Y + 4], ...hem.slice().reverse()]), COAT, { z: 1, h: 7 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 8 + k * 5, Y + 10], [cx - 10 + k * 6, Y + 46], 0.5), 0.8);
  for (const [x, y] of [[-6, 20], [4, 30], [-2, 38]]) S.add(polyF([[cx + x - 3, Y + y], [cx + x + 3, Y + y], [cx + x + 3, Y + y + 5], [cx + x - 3, Y + y + 5]]), SACK, { on: 1, lift: 0.4, h: 0.5 });
  S.add(capF([cx - 10, Y + 24], [cx + 10, Y + 24], 1.2), mat(ramp(0x8a7a50), { tex: "cloth" }), { z: 1.6, h: 0.8 });
  for (let k = 0; k < 5; k++) S.add(capF([cx - 8 + k * 4, Y + 46 + (k % 2) * 5], [cx - 9 + k * 4.4, Y + 52 + (k % 2) * 5], 0.6, 0.3), STRAW, { z: 1.2, h: 0.4 });
  // 머리 (삼베 자루 · 묶은 목 · 판 얼굴 · 낡은 모자)
  const hx = cx + 2, hy = Y - 8;
  S.add(U(ellR(hx, hy, 9, 9.4), ellR(hx + 1, hy - 4, 8, 6)), SACK, { z: 3, h: 7 });
  S.add(capF([hx - 5, hy + 8], [hx + 6, hy + 8], 1.2), mat(ramp(0x6a5a3a), { tex: "cloth" }), { z: 3.4, h: 0.8 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx - 8, hy - 6 + k * 4], [hx + 8, hy - 5 + k * 4], 0.3), 0.5);
  const face = gl > 0.5 ? LAMPW : LAMP;
  S.add(polyF([[hx + 2, hy - 3], [hx + 5, hy - 5], [hx + 6, hy - 1]]), face, { z: 3.5, lift: 0.2, h: 0.3 });
  S.add(polyF([[hx + 6.4, hy - 3.6], [hx + 8.4, hy - 4.6], [hx + 8.6, hy - 1]]), face, { z: 3.5, lift: 0.2, h: 0.3 });
  S.add(polyF([[hx + 1, hy + 3], [hx + 3, hy + 2], [hx + 5, hy + 4], [hx + 7, hy + 2], [hx + 8.6, hy + 3], [hx + 6, hy + 6], [hx + 3, hy + 6]]), face, { z: 3.5, lift: 0.2, h: 0.3 });
  S.add(U(ellR(hx - 1, hy - 10, 9, 3), polyF([[hx - 6, hy - 10], [hx - 3, hy - 20], [hx + 4, hy - 17], [hx + 5, hy - 10]])), mat(ramp(0x3a3830), { tex: "cloth", amp: 1.2 }), { z: 3.8, h: 3 });
  S.add(capF([hx - 14, hy - 9], [hx + 12, hy - 10], 1.6, 1.2), mat(ramp(0x3a3830), { tex: "cloth" }), { z: 3.9, h: 1 });
  // 가까운 팔 (소매 · 짚 손 · 녹슨 낫)
  const sh = [cx + 8, Y + 6], hd = sw <= 1 ? lerp([cx + 22, Y + 6], [cx + 16, Y - 8], sw) : lerp([cx + 16, Y - 8], [cx + 30, Y + 22], Math.min(1, sw - 1));
  S.add(U(capF(sh, hd, 4.4, 3.6)), COAT, { z: 5, h: 3 });
  for (let k = 0; k < 4; k++) S.add(capF(hd, pol(hd, 0.2 + k * 0.4, 4), 0.7, 0.3), STRAW, { z: 5.2, h: 0.4 });
  const ba = sw <= 1 ? L(-1.3, -2.4, sw) : L(-2.4, 0.1, Math.min(1, sw - 1)), top = pol(hd, ba, 16);
  S.add(capF(pol(hd, ba, -4), top, 1, 0.9), mat(ramp(0x4a3a2a), { tex: "wood" }), { z: 5.6, h: 0.8 });
  const bl = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6; bl.push(pol(pol(top, ba, -1 - Math.sin(t * Math.PI) * 4), ba + Math.PI / 2, t * 18)); }
  const bl2 = bl.map((q, k) => pol(q, ba, -(0.8 + Math.sin((k / 6) * Math.PI) * 3)));
  S.add(polyF([...bl, ...bl2.reverse()]), mat(ramp(0x7a5a40), { tex: "metal", amp: 1.3, spec: 0.3 }), { z: 5.8, h: 1, prof: "sharp" });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, SCK, 44);
  if (gl > 0.3) for (let k = 0; k < 6; k++) { const q = P(hx + 4 + Math.cos(k) * 10, hy - Math.abs(Math.sin(k * 1.7)) * 10); C.px(q[0], q[1], k % 2 ? 0xffc060 : 0xfff0c0); }
  mist(C, P, cx - 24, cx + 24, G - 2, p.ph ?? 0);
  return fin(C, p);
}
export const pxScarecrow = {
  fw: Math.round(104 * SCK), fh: Math.round(108 * SCK), w: 18, h: 36,
  anims: { idle: [6, 4], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], glow: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, glow: 0.2 + Math.sin(ph) * 0.2 };
    if (nm === "move") P = { ph, hop: Math.max(0, Math.sin(ph)) };
    if (nm === "wind") P = { ph, sw: t };
    if (nm === "atk") P = { ph, sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { ph, sw: 2 * (1 - t) };
    if (nm === "glow") P = { ph: ph * 2, glow: [0.6, 1, 1, 0.6][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return scarecrowFrame(P);
  },
};

// ════ 흰 족제비 ════ 눈처럼 흰 겨울털의 큰 족제비 · 길고 낭창한 몸 · 꼬리 끝만 새까맣다 · 작은 둥근 귀 · 안개 속을 물결치듯 달린다
//   p: ph · run · bite · rear · hurt
const STK = 0.72;
const ERM = mat(ramp(0xe0ddd4), { tex: "fur", amp: 1, dir: 0.1 }), ERMF = mat(rampF(0xb0ada4), { tex: "fur", amp: 0.9, dir: 0.1 });
function stoatFrame(p = {}) {
  const W = 90, H = 44, G = H - 1, S = sculpt(W, H, { k: STK, ax: 44 });
  const ph = p.ph ?? 0, rn = p.run ?? 0, bt = p.bite ?? 0, rr = p.rear ?? 0, cx = 42;
  const arch = (x) => Math.sin(((x - cx + 22) / 44) * Math.PI) * rn * 5 * Math.sin(ph * 2);
  const paw = (x, far, ph2) => { const s = Math.sin(ph * 2 + ph2) * rn; const r = [x, G - 9 - arch(x)], f = [x + s * 5, G - 1 - Math.max(0, -s) * 3]; S.add(capF(r, f, 1.8, 1.2), far ? ERMF : ERM, { z: far ? -2 : 4, h: 1.2 }); S.add(ellR(f[0] + 1, f[1], 1.8, 1), far ? ERMF : ERM, { z: far ? -1.9 : 4.1, h: 0.6 }); };
  paw(cx + 12, 1, 0), paw(cx - 12, 1, Math.PI);
  // 꼬리 (검은 끝)
  const t0 = [cx - 20, G - 10 - arch(cx - 20)], t1 = [cx - 34, G - 14 + Math.sin(ph * 2) * 2], t2 = [cx - 40, G - 18 + Math.sin(ph * 2 + 1) * 2];
  S.add(U(capF(t0, t1, 2.4, 2)), ERM, { z: 0.5, h: 1.6 });
  S.add(U(capF(t1, t2, 2.2, 1.4)), mat(ramp(0x2a2622), { tex: "fur" }), { z: 0.5, h: 1.4 });
  // 몸 (긴 · 물결)
  const body = [];
  for (let k = 0; k <= 6; k++) { const x = cx - 20 + k * 6.4; body.push(ellR(x, G - 11 - arch(x) - (k > 4 ? rr * (k - 4) * 4 : 0), 5, 5)); }
  S.add(U(...body), ERM, { z: 1, h: 4.4 });
  S.add(capF([cx - 18, G - 7], [cx + 16, G - 7], 1.4), mat(ramp(0xf0ece0), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  // 머리
  const hx = cx + 24, hy = G - 14 - arch(cx + 18) - rr * 10;
  S.add(U(ellR(hx, hy, 5, 4.4), capF([hx + 2, hy + 1], [hx + 8, hy + 2 + bt], 3, 1.6)), ERM, { z: 2, h: 3.4 });
  S.add(ellR(hx - 2, hy - 4, 1.8, 1.6), ERMF, { z: 2.2, h: 1 });
  S.add(ellR(hx + 8.4, hy + 1.6 + bt, 0.9, 0.8), mat(ramp(0x2a2020)), { z: 2.4, h: 0.4 });
  if (bt > 0.3) S.add(capF([hx + 4, hy + 3.4], [hx + 8, hy + 4 + bt * 2], 0.6), mat(ramp(0x6a2a2a)), { z: 1.9, h: 0.3 });
  !p.hurt && S.decal(hx + 2.4, hy - 1.4, 0x101010);
  paw(cx + 14, 0, Math.PI), paw(cx - 10, 0, 0);
  const C = S.render({ rim: !0 });
  mist(C, toPx(W, H, STK, 44), cx - 30, cx + 30, G - 1, ph, 8);
  return fin(C, p);
}
export const pxStoat = {
  fw: Math.round(90 * STK), fh: Math.round(44 * STK), w: 26, h: 12,
  anims: { idle: [4, 5], move: [6, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], rear: [4, 6, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, rear: Math.max(0, Math.sin(ph)) * 0.3 };
    if (nm === "move") P = { ph, run: 1 };
    if (nm === "wind") P = { ph, rear: 0.6, bite: 0 };
    if (nm === "atk") P = { ph, run: 0.6, bite: [1, 1, 0.4][f] };
    if (nm === "rec") P = { ph, bite: 0 };
    if (nm === "rear") P = { ph, rear: [0.5, 1, 1, 0.5][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return stoatFrame(P);
  },
};

// ════ 덫사냥꾼 ════ 안개 숲에서 짐승을 잡는 사냥꾼 · 늑대 털가죽 두건 · 허리에 주렁주렁 단 쇠 덫 · 낡은 석궁 · 숨결이 하얗게 번진다
//   p: legs · bob · aim · throw · hurt
const TPK = 0.72;
function trapperFrame(p = {}) {
  const W = 112, H = 96, G = H - 1, S = sculpt(W, H, { k: TPK, ax: 40 });
  const b = p.bob ?? 0, am = p.aim ?? 0, th = p.throw ?? 0, cx = 38;
  const CL = mat(ramp(0x5a5a4a), { tex: "cloth", amp: 1.1 }), CLF = mat(rampF(0x44443a), { tex: "cloth" }), SKN = mat(ramp(0xb08a70), { tex: "skin", amp: 0.8 });
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: CL, hurt: p.hurt,
    legO: { thigh: CL, thighF: CLF, shin: LEATH, shinF: LEATHF, boot: LEATH, bootF: LEATHF, knee: !1 },
    back: () => S.add(polyF([[cx - 10, 36 + b], [cx + 6, 36 + b], [cx - 2, 74 + b], [cx - 16, 70 + b]]), FURG, { z: -1, h: 5 }),
    head: (hx, hy) => {
      S.add(ellR(hx + 1, hy + 1, 5.6, 6.4), SKN, { z: 4, h: 4 });
      S.add(polyF([[hx + 1, hy + 3], [hx + 7, hy + 3], [hx + 5, hy + 10], [hx + 1, hy + 8]]), mat(ramp(0x5a4a3a), { tex: "fur", dir: 1.57 }), { z: 4.3, h: 1.4 });
      !p.hurt && S.decal(hx + 4.4, hy, 0x1a1410);
      // 늑대 가죽 두건 (주둥이 · 귀)
      S.add(U(ellR(hx - 1, hy - 3, 8, 6.4), polyF([[hx - 8, hy - 2], [hx - 12, hy + 14], [hx - 2, hy + 8]])), FURG, { z: 4.6, h: 4 });
      S.add(capF([hx + 2, hy - 7], [hx + 10, hy - 5], 3, 1.8), FURG, { z: 4.8, h: 2 });
      S.add(ellR(hx + 10.4, hy - 5, 1, 0.8), mat(ramp(0x1a1a1a)), { z: 5, h: 0.4 });
      for (const d of [-3, 1]) S.add(polyF([[hx + d - 2, hy - 8], [hx + d, hy - 14], [hx + d + 2, hy - 8]]), FURGF, { z: 4.7, h: 1, prof: "sharp" });
    },
  });
  // 허리 덫
  for (const [x, y] of [[cx - 9, 66], [cx + 7, 68]]) { S.add(minus(ellR(x, y + b, 4.6, 3), ellR(x, y + b, 3, 1.6)), IRON, { z: 3.6, h: 1 }); for (let k = 0; k < 4; k++) S.add(polyF([[x - 3 + k * 2, y - 1.4 + b], [x - 2 + k * 2, y - 3.4 + b], [x - 1 + k * 2, y - 1.4 + b]]), IRON, { z: 3.7, h: 0.4, prof: "sharp" }); }
  // 석궁 (두 손)
  const hd = th > 0 ? lerp([cx + 12, 52 + b], [cx + 26, 46 + b], th) : lerp([cx + 12, 58 + b], [cx + 18, 46 + b], am);
  arm(S, sol.S1, [hd[0] - 6, hd[1] + 2], 1, { M: CLF, MF: CLF, z: -1 });
  if (th === 0) {
    const ca = L(0.5, 0, am), c0 = pol(hd, ca, -10), c1 = pol(hd, ca, 14), n = ca + Math.PI / 2;
    S.add(capF(c0, c1, 1.6, 1.2), mat(ramp(0x4a3a2a), { tex: "wood" }), { z: 7.6, h: 1 });
    S.add(U(capF(pol(c1, n, -9), c1, 1, 0.8), capF(c1, pol(c1, n, 9), 0.8, 1)), mat(ramp(0x3a2e24), { tex: "wood" }), { z: 7.7, h: 0.8 });
    S.add(capF(pol(pol(c1, n, -9), ca, -6), pol(pol(c1, n, 9), ca, -6), 0.3), mat(ramp(0xd8d0c0)), { z: 7.5, h: 0.2 });
    am > 0.3 && S.add(capF(pol(hd, ca, -2), pol(hd, ca, 16), 0.5), BONE, { z: 7.8, h: 0.3 });
  } else S.add(minus(ellR(hd[0] + 4, hd[1], 5, 3.4), ellR(hd[0] + 4, hd[1], 3.4, 2)), IRON, { z: 8, h: 1 });
  arm(S, sol.S0, hd, 0, { M: CL, MF: CLF });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, TPK, 40);
  for (let k = 0; k < 4; k++) { const q = P(cx + 14 + k * 2 + Math.sin((p.ph ?? 0) + k), 34 + b - k * 1.4); C.px(q[0], q[1], 0xd8e0e0); }
  return fin(C, p);
}
export const pxTrapper = {
  fw: Math.round(112 * TPK), fh: Math.round(96 * TPK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 9], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], throw: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") { const g = gait2(f, n, 5, 2.2); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { aim: t, ph };
    if (nm === "atk") P = { aim: 1, bob: [-1, 0, 0][f], ph };
    if (nm === "rec") P = { aim: 1 - t, ph };
    if (nm === "throw") P = { throw: [0.3, 1, 1][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, ph };
    return trapperFrame(P);
  },
};

// ════ [정예] 목 없는 기사 ════ 갈비뼈 드러난 죽은 흑마를 탄 머리 없는 기사 · 녹슨 판금 · 찢긴 망토 · 옆구리에 낀 제 머리(등불처럼 빛나는 눈) ·
//   쇠사슬 철퇴 · 말갈기와 꼬리는 안개로 흩어진다
//   p: legs(ph) · run · sw · rear · hurt
const DLK = 0.62;
function dullahanFrame(p = {}) {
  const W = 220, H = 160, G = H - 1, S = sculpt(W, H, { k: DLK, ax: 100 });
  const ph = p.ph ?? 0, rn = p.run ?? 0, sw = p.sw ?? 0, rr = p.rear ?? 0, cx = 94, by = 92 - rr * 10;
  const HRS = mat(ramp(0x3a3a3a), { tex: "skin", amp: 1, spec: 0.3 }), HRSF = mat(rampF(0x2a2a2a), { tex: "skin" }), ARM = mat(ramp(0x6a6a66), { tex: "metal", amp: 1.1, spec: 0.5 }), ARMF = mat(rampF(0x4e4e4a), { tex: "metal" });
  const leg = (x, far, front, k) => { const s = Math.sin(ph * 2 + k * 1.57) * rn, hp = [x, by + 10 - (front ? rr * 10 : 0)], kn = [x + s * 8 + (front ? 4 + rr * 10 : -4), by + 30 - (front ? rr * 16 : 0) - Math.max(0, s) * 4], ft = [x + s * 14 + (front ? rr * 14 : 0), G - 1 - Math.max(0, -s) * 6 - (front ? rr * 30 : 0)]; S.add(U(capF(hp, kn, 6, 3.4), capF(kn, ft, 2.6, 2.2)), far ? HRSF : HRS, { z: far ? -4 : 6, h: 3 }); S.add(U(ellR(ft[0] + 1, ft[1] - 2, 3.6, 2.6)), far ? IRONF : IRON, { z: far ? -3.9 : 6.1, h: 1.4 }); };
  leg(cx + 30, 1, 1, 0), leg(cx - 32, 1, 0, 2);
  // 꼬리 (안개)
  S.add(U(...[0, 1, 2, 3, 4].map((k) => capF([cx - 42, by - 8], [cx - 50 - k * 1.6 + Math.sin(ph * 2 + k) * 2, by + 14 + k * 3], 2.4 - k * 0.2, 0.6))), mat(ramp(0x9aaaa8), { tex: "fur", amp: 1.4, dir: 1.57 }), { z: 0, h: 1.4 });
  // 말 몸 (마른 · 갈비)
  S.add(U(ellR(cx, by - rr * 4, 44, 18), ellR(cx + 32, by - 8 - rr * 8, 16, 18)), HRS, { z: 1, h: 14 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 4 + k * 5, by - 8], [cx - 6 + k * 5, by + 12], 0.6), 1);
  // 안장 + 마갑 천
  S.add(polyF([[cx - 18, by - 16], [cx + 18, by - 16], [cx + 22, by + 8], [cx - 22, by + 8]]), mat(ramp(0x3a2a34), { tex: "cloth", amp: 1.2 }), { z: 2, h: 3 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 16 + k * 10, by - 10], [cx - 18 + k * 11, by + 8], 0.5), 0.7);
  // 말 목 + 머리 (해골이 비치는)
  const nk = [cx + 34, by - 10 - rr * 10], hh = [cx + 58, by - 30 - rr * 16];
  S.add(capF(nk, hh, 13, 7), HRS, { z: 3, h: 8 });
  for (let k = 0; k < 6; k++) S.add(capF(lerp(nk, hh, k / 6), [lerp(nk, hh, k / 6)[0] - 6 - Math.sin(ph * 2 + k) * 3, lerp(nk, hh, k / 6)[1] - 4], 1.6, 0.4), mat(ramp(0xa8b8b8), { tex: "fur", dir: 1.57 }), { z: 3.2, h: 0.8 });
  S.add(U(ellR(hh[0], hh[1], 7, 6), capF(hh, [hh[0] + 14, hh[1] + 8], 5, 3.4)), HRS, { z: 4, h: 5 });
  S.add(capF([hh[0] + 2, hh[1] + 3], [hh[0] + 12, hh[1] + 9], 2, 1), BONE, { on: 1, lift: 0.2, h: 0.4 });
  S.add(ellR(hh[0] + 1, hh[1] - 1, 2, 1.8), VD, { z: 4.4, h: 0.3 });
  !p.hurt && S.decal(hh[0] + 1.6, hh[1] - 1.4, 0x8af0c8);
  // 기수 (먼 팔: 제 머리를 끼고)
  const rx = cx + 4, ry = by - 30;
  S.add(U(capF([rx - 6, ry + 4], [rx - 2, ry + 18], 3.4, 3), capF([rx - 2, ry + 18], [rx + 8, ry + 20], 3, 2.6)), ARMF, { z: -0.5, h: 2.4 });
  const head = [rx + 10, ry + 18];
  S.add(ellR(head[0], head[1], 5.4, 6), mat(ramp(0x8a8a80), { tex: "skin" }), { z: -0.4, h: 4 });
  S.add(capF([head[0] - 4, head[1] - 4], [head[0] - 8, head[1] + 6], 2, 1), mat(ramp(0x3a3a34), { tex: "fur" }), { z: -0.3, h: 1 });
  !p.hurt && S.decal(head[0] + 2.4, head[1] - 1, 0x8af0c8).decal(head[0] + 4, head[1] - 1, 0x8af0c8);
  // 다리 (기수) + 몸통 판금 + 목 없는 어깨
  S.add(U(capF([rx + 2, ry + 18], [rx + 10, ry + 30], 4.4, 4), capF([rx + 10, ry + 30], [rx + 8, ry + 42], 3.6, 3.4)), ARM, { z: 7, h: 3 });
  S.add(U(ellR(rx, ry, 11, 13), polyF([[rx - 9, ry + 6], [rx + 9, ry + 6], [rx + 8, ry + 20], [rx - 8, ry + 20]])), ARM, { z: 5, h: 9 });
  for (let k = 0; k < 3; k++) S.carve(capF([rx - 9, ry + 10 + k * 4], [rx + 9, ry + 9 + k * 4], 0.4), 0.7);
  S.add(ellR(rx + 1, ry - 12, 6, 2.4), VD, { z: 5.4, h: 0.6 });
  for (let k = 0; k < 6; k++) { const q = P0(rx + 1 + Math.sin(ph * 2 + k) * 3, ry - 14 - k * 3); S.add(ellR(q[0], q[1], 1.6 - k * 0.2, 1.2), mat(ramp(0xa8c8c0), { tex: "fur" }), { z: 5.6, h: 0.4 }); }
  for (const d of [-1, 1]) S.add(ellR(rx + d * 9, ry - 8, 6, 5), ARM, { z: 5.6 + d * 0.2, h: 3 });
  // 망토
  const hem = [];
  for (let k = 0; k <= 5; k++) hem.push([rx - 12 - k * 6, ry + 20 + k * 3 + Math.sin(ph * 2 + k) * 3]);
  S.add(polyF([[rx - 8, ry - 8], [rx - 4, ry - 4], ...hem]), mat(ramp(0x2a2a30), { tex: "cloth", amp: 1.2 }), { z: 4, h: 2 });
  // 가까운 팔 + 쇠사슬 철퇴
  const sh = [rx + 9, ry - 6], hd = sw <= 1 ? lerp([rx + 20, ry + 8], [rx + 12, ry - 22], sw) : lerp([rx + 12, ry - 22], [rx + 34, ry + 6], Math.min(1, sw - 1));
  arm(S, sh, hd, 0, { M: ARM, MF: ARMF, l: 12, z: 9 });
  const ca = sw <= 1 ? L(1.4, -1.6 + Math.sin(ph * 3) * 0.6, sw) : L(-1.6, 0.6, Math.min(1, sw - 1)), cl = sw > 0.2 ? 30 : 16;
  for (let k = 1; k <= 7; k++) { const q = pol(hd, ca + Math.sin(k * 0.6 + ph) * 0.1, (k / 7) * cl); S.add(minus(ellR(q[0], q[1], 1.6, 1.2), ellR(q[0], q[1], 0.6, 0.4)), IRON, { z: 9.6, h: 0.6 }); }
  const ball = pol(hd, ca, cl + 4);
  S.add(ellR(ball[0], ball[1], 6, 6), IRON, { z: 9.8, h: 5 });
  for (let k = 0; k < 8; k++) S.add(polyF([pol(ball, k * 0.785 - 0.3, 5), pol(ball, k * 0.785, 9), pol(ball, k * 0.785 + 0.3, 5)]), IRONF, { z: 9.7, h: 0.8, prof: "sharp" });
  leg(cx + 36, 0, 1, 1), leg(cx - 26, 0, 0, 3);
  const C = S.render({ rim: !0 });
  mist(C, toPx(W, H, DLK, 100), cx - 60, cx + 60, G - 2, ph, 20);
  return fin(C, p);
  function P0(x, y) { return [x, y]; }
}
export const pxDullahan = {
  fw: Math.round(220 * DLK), fh: Math.round(160 * DLK), w: 60, h: 66,
  anims: { idle: [4, 4], move: [6, 10], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], rear: [4, 8, !1], gallop: [6, 14] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, sw: 0.1 };
    if (nm === "move") P = { ph, run: 0.5, sw: 0.1 };
    if (nm === "gallop") P = { ph, run: 1, sw: 0.3 };
    if (nm === "wind") P = { ph: ph * 2, sw: t };
    if (nm === "atk") P = { ph, sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { ph, sw: 2 * (1 - t) };
    if (nm === "rear") P = { ph, rear: t, sw: 0.5 };
    if (nm === "hurt") P = { hurt: f === 0, ph, rear: 0.2 };
    return dullahanFrame(P);
  },
};

// ════ 입 벌린 그루터기 ════ 이끼 덮인 썩은 그루터기 · 갈라진 몸통이 이빨 박힌 입이 된다 · 나이테 위 눈 둘 · 뿌리를 다리 삼아 엉금엉금
//   p: ph · walk · bite · hide · hurt
const SMK = 0.72;
function stumpFrame(p = {}) {
  const W = 80, H = 64, G = H - 1, S = sculpt(W, H, { k: SMK, ax: 40 });
  const ph = p.ph ?? 0, wk = p.walk ?? 0, bt = p.bite ?? 0, hd = p.hide ?? 0, cx = 38, top = G - 34 + hd * 4;
  // 뿌리 다리
  for (const [d, far] of [[-1, 1], [1, 1], [-1, 0], [1, 0]]) { const s = Math.sin(ph * 2 + (d + far * 2)) * wk, r = [cx + d * 8, G - 8], f = [cx + d * 18 + s * 4, G - 1 - Math.max(0, -s) * 3]; S.add(U(capF(r, [L(r[0], f[0], 0.5), r[1] - 1], 3, 2.4), capF([L(r[0], f[0], 0.5), r[1] - 1], f, 2.4, 0.8)), far ? BARKF : BARK, { z: far ? -2 : 4, h: 1.8 }); }
  // 몸통 (턱 아래 · 위)
  const jaw = bt * 8;
  S.add(U(polyF([[cx - 14, G - 4], [cx + 14, G - 4], [cx + 13, G - 16], [cx - 13, G - 16]])), BARK, { z: 1, h: 10 });
  S.add(U(polyF([[cx - 13, G - 16 - jaw], [cx + 14, G - 16 - jaw], [cx + 12, top - jaw], [cx - 12, top - jaw]])), BARK, { z: 1.2, h: 10 });
  for (let k = 0; k < 5; k++) S.carve(capF([cx - 10 + k * 5, G - 4], [cx - 9 + k * 5, top - jaw + 2], 0.5), 0.9);
  // 입 안 + 이빨
  S.add(polyF([[cx + 2, G - 16], [cx + 15, G - 16], [cx + 15, G - 16 - jaw - 1], [cx + 2, G - 16 - jaw - 1]]), VD, { z: 1.3, h: 0.5 });
  for (let k = 0; k < 4; k++) { S.add(polyF([[cx + 4 + k * 3, G - 16 - jaw], [cx + 5 + k * 3, G - 13 - jaw], [cx + 6 + k * 3, G - 16 - jaw]]), BONE, { z: 1.5, h: 0.5, prof: "sharp" }); S.add(polyF([[cx + 4 + k * 3, G - 16], [cx + 5 + k * 3, G - 19], [cx + 6 + k * 3, G - 16]]), BONE, { z: 1.5, h: 0.5, prof: "sharp" }); }
  // 윗면 (나이테 · 이끼)
  S.add(ellR(cx, top - jaw, 13, 3.4), mat(ramp(0x8a7a5a), { tex: "wood", amp: 0.6 }), { z: 1.6, h: 1 });
  for (const r of [4, 8, 11]) S.carve(minus(ellR(cx, top - jaw, r, r * 0.26), ellR(cx, top - jaw, r - 0.6, r * 0.26 - 0.4)), 0.5);
  S.add(U(ellR(cx - 8, top - jaw + 1, 6, 2.6), ellR(cx + 4, top - jaw + 6, 5, 3)), MOSS, { z: 1.8, h: 1.4 });
  twig(S, [cx - 8, top - jaw + 2], -2, 12, 1.6, DEAD, 1.4, 1, 3);
  // 눈
  if (hd < 0.5) for (const x of [cx + 6, cx + 11]) { S.add(ellR(x, top - jaw + 8, 1.6, 1.4), VD, { z: 1.7, h: 0.3 }); !p.hurt && S.decal(x, top - jaw + 7.6, 0xffc060); }
  const C = S.render({ rim: !0 });
  mist(C, toPx(W, H, SMK, 40), cx - 26, cx + 26, G - 1, ph, 10);
  return fin(C, p);
}
export const pxStump = {
  fw: Math.round(80 * SMK), fh: Math.round(64 * SMK), w: 26, h: 24,
  anims: { idle: [4, 4], move: [6, 8], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], hide: [4, 2] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, bite: 0.1 };
    if (nm === "move") P = { ph, walk: 1, bite: 0.1 };
    if (nm === "wind") P = { ph, bite: t };
    if (nm === "atk") P = { ph, bite: [1, 0, 0.3][f] };
    if (nm === "rec") P = { ph, bite: 0.3 * (1 - t) };
    if (nm === "hide") P = { ph, hide: 1 };
    if (nm === "hurt") P = { hurt: f === 0, ph, bite: 0.6 };
    return stumpFrame(P);
  },
};

// ════ 통곡하는 드라이어드 ════ 숲이 죽자 미쳐 버린 나무 요정 · 갈라진 나무껍질 살갗 · 늘어진 이끼 머리카락 · 크게 벌린 입으로 울부짖는다 ·
//   잔가지 손가락 · 발은 땅속 뿌리로 이어진다
//   p: ph · wail · reach · hurt
const DYK = 0.72;
function dryadFrame(p = {}) {
  const W = 100, H = 108, G = H - 1, S = sculpt(W, H, { k: DYK, ax: 42 });
  const ph = p.ph ?? 0, wl = p.wail ?? 0, rc = p.reach ?? 0, cx = 40, sway = Math.sin(ph) * 1.4;
  // 뿌리 발
  for (let k = 0; k < 5; k++) S.add(capF([cx - 2 + k, G - 22], [cx - 16 + k * 8, G - 1], 2.4 - k * 0.2, 0.6), BARKF, { z: -1 + k * 0.4, h: 1.2 });
  // 이끼 머리카락 (뒤)
  const hx = cx + 4 + sway, hy = 30;
  for (let k = 0; k < 8; k++) { const r = [hx - 6 + k * 1.6, hy - 6], e = [hx - 14 + k * 2 + Math.sin(ph + k) * 2, hy + 28 + (k % 3) * 8]; S.add(capF(r, e, 2, 0.6), k % 2 ? MOSSL : MOSS, { z: -1, h: 1 }); }
  // 몸 (가는 나무 줄기 · 갈비처럼 갈라진 껍질)
  S.add(U(capF([cx, G - 20], [cx + 2 + sway, hy + 12], 6, 7), ellR(cx + 2 + sway, hy + 18, 9, 10)), BARK, { z: 1, h: 7 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 5 + k * 2, hy + 12], [cx - 4 + k * 1.6, G - 22], 0.5), 0.9);
  S.add(polyF([[cx - 4 + sway, hy + 20], [cx + 6 + sway, hy + 20], [cx + 2, hy + 34]]), MOSS, { z: 1.4, h: 1.4 });
  // 먼 팔 (가지)
  twig(S, [cx - 4 + sway, hy + 12], -2.6 + rc * 0.6 + Math.sin(ph) * 0.1, 18, 2, BARKF, -0.5, 2, 5);
  // 머리 (나무 얼굴 · 벌린 입)
  S.add(U(ellR(hx, hy, 8, 10), capF([hx + 2, hy + 4], [hx + 4, hy + 12 + wl * 4], 4, 3)), BARK, { z: 3, h: 6 });
  S.carve(capF([hx - 2, hy - 8], [hx - 1, hy + 10], 0.4), 0.7);
  S.add(ellR(hx + 3.6, hy + 6 + wl * 2, 2 + wl * 0.6, 2.4 + wl * 3), VD, { z: 3.4, h: 0.4 });
  for (const x of [hx + 2, hx + 6.4]) { S.add(ellR(x, hy - 2, 1.6, 2), VD, { z: 3.4, h: 0.3 }); !p.hurt && S.decal(x, hy - 2.4, 0xd8f0d0); }
  // 머리 위 잔가지 관
  for (let k = 0; k < 4; k++) twig(S, [hx - 4 + k * 3, hy - 8], -1.57 + (k - 1.5) * 0.4, 8 + (k % 2) * 4, 1.2, DEAD, 3.2, 1, k);
  // 가까운 팔 (손가락 잔가지 · 뻗기)
  const sh = [cx + 8 + sway, hy + 12], hd = lerp([cx + 16, hy + 30], [cx + 30, hy + 4], rc);
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 2.4, 2), capF(lerp(sh, hd, 0.5), hd, 2, 1.6)), BARK, { z: 6, h: 1.6 });
  for (let k = 0; k < 4; k++) twig(S, hd, Math.atan2(hd[1] - sh[1], hd[0] - sh[0]) + (k - 1.5) * 0.35, 7, 0.9, DEAD, 6.2, 1, k + 7);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, DYK, 42);
  if (wl > 0.3) for (let r = 0; r < 3; r++) for (let k = 0; k < 10; k++) { const a = -0.9 + k * 0.18, q = P(hx + 6 + Math.cos(a) * (12 + r * 8 + wl * 4), hy + 8 + Math.sin(a) * (12 + r * 8 + wl * 4)); C.px(q[0], q[1], r % 2 ? 0x9aaaa8 : 0xd8e8e8); }
  mist(C, P, cx - 26, cx + 26, G - 2, ph, 12);
  return fin(C, p);
}
export const pxDryad = {
  fw: Math.round(100 * DYK), fh: Math.round(108 * DYK), w: 18, h: 36,
  anims: { idle: [6, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], wail: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, wail: 0.1 };
    if (nm === "move") P = { ph: ph * 2, wail: 0.1 };
    if (nm === "wind") P = { ph, reach: t * 0.4, wail: 0.3 };
    if (nm === "atk") P = { ph, reach: [0.8, 1, 0.9][f], wail: 0.4 };
    if (nm === "rec") P = { ph, reach: 1 - t };
    if (nm === "wail") P = { ph: ph * 2, wail: [0.5, 1, 1, 0.8][f], reach: 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, ph, wail: 0.6 };
    return dryadFrame(P);
  },
};

// ════ 대벌레 ════ 마른 가지와 똑같이 생긴 거대 대벌레 · 마디진 가는 몸 · 길고 가는 여섯 다리 · 짧은 더듬이 · 가만히 있으면 나뭇가지로 보인다 ·
//   앞다리를 낫처럼 접었다 내리친다
//   p: ph · walk · strike · hurt
const SIK = 0.72;
function stickFrame(p = {}) {
  const W = 120, H = 54, G = H - 1, S = sculpt(W, H, { k: SIK, ax: 58 });
  const ph = p.ph ?? 0, wk = p.walk ?? 0, st = p.strike ?? 0, cx = 56, by = G - 18 + Math.sin(ph * 2) * wk * 1;
  const STK2 = mat(ramp(0x7a6a50), { tex: "wood", amp: 1.1 }), STK2F = mat(rampF(0x5a4e3c), { tex: "wood" });
  const legS = (x, far, k) => { const s = Math.sin(ph * 2 + k * 2.1 + far * Math.PI) * wk, r = [x, by + 1], kn = [x + (k - 1) * 8 + s * 4, by - 10], f = [x + (k - 1) * 16 + s * 8, G - 1 - Math.max(0, -s) * 3]; S.add(U(capF(r, kn, 0.9, 0.7), capF(kn, f, 0.7, 0.4)), far ? STK2F : STK2, { z: far ? -2 : 3, h: 0.5 }); S.add(ellR(kn[0], kn[1], 1, 1), far ? STK2F : STK2, { z: far ? -1.9 : 3.1, h: 0.5 }); };
  for (let k = 0; k < 3; k++) legS(cx - 10 + k * 12, 1, k);
  // 몸 (가지 · 마디 · 잔가지 돌기)
  S.add(U(capF([cx - 44, by + 2], [cx + 20, by], 1.8, 2.4)), STK2, { z: 1, h: 1.6 });
  for (let k = 0; k < 6; k++) S.add(ellR(cx - 34 + k * 10, by + 1 - k * 0.2, 2.4, 2.6), STK2, { z: 1.1, h: 1.4 });
  for (const [x, a] of [[-24, -2.2], [-4, -1.2], [10, -2]]) twig(S, [cx + x, by - 1], a, 6, 0.6, STK2F, 1.2, 0, x);
  S.add(capF([cx - 44, by + 2], [cx - 50, by + 6], 1.2, 0.4), STK2F, { z: 0.9, h: 0.6 });
  // 머리 + 더듬이
  const hx = cx + 24, hy = by - 1;
  S.add(ellR(hx, hy, 3.6, 2.6), STK2, { z: 1.4, h: 1.8 });
  for (const d of [-1, 1]) S.add(capF([hx + 2, hy - 1], [hx + 12, hy - 6 + d * 2], 0.4, 0.2), STK2F, { z: 1.5 + d * 0.1, h: 0.2 });
  !p.hurt && S.decal(hx + 1.6, hy - 1, 0xd8c060);
  // 앞다리 (낫처럼 접힘 → 내리침)
  const fl = [cx + 18, by + 1], fk = pol(fl, L(-0.9, -0.2, st), 12), ff = pol(fk, L(1.9, 0.5, st), 14);
  S.add(U(capF(fl, fk, 1, 0.8), capF(fk, ff, 0.8, 0.4)), STK2, { z: 3.4, h: 0.6 });
  for (let k = 0; k < 3; k++) legS(cx - 14 + k * 12, 0, k + 0.3);
  const C = S.render({ rim: !0 });
  mist(C, toPx(W, H, SIK, 58), cx - 40, cx + 30, G - 1, ph, 12);
  return fin(C, p);
}
export const pxStick = {
  fw: Math.round(120 * SIK), fh: Math.round(54 * SIK), w: 34, h: 14,
  anims: { idle: [4, 2], move: [6, 8], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: ph * 0.3 };
    if (nm === "move") P = { ph, walk: 1 };
    if (nm === "wind") P = { ph, strike: -0.3 * t };
    if (nm === "atk") P = { ph, strike: [0.6, 1, 1][f] };
    if (nm === "rec") P = { ph, strike: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return stickFrame(P);
  },
};

// ════ [정예] 웬디고 ════ 굶주림이 빚은 숲의 괴물 · 뼈만 남은 키 큰 몸 · 거죽 아래 드러난 갈비 · 사슴 두개골 머리에 거대한 가지 뿔 ·
//   바닥까지 닿는 긴 팔과 갈고리 손톱 · 하얗게 서린 입김
//   p: legs · bob · claw · howl · hurt
const WDK = 0.6;
function wendigoFrame(p = {}) {
  const W = 180, H = 168, G = H - 1, S = sculpt(W, H, { k: WDK, ax: 80 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cl = p.claw ?? 0, hw = p.howl ?? 0, cx = 74;
  const HIDE = mat(ramp(0x8a8478), { tex: "skin", amp: 1.1, spec: 0.2 }), HIDEF = mat(rampF(0x66625a), { tex: "skin" }), DFUR = mat(ramp(0x3a3630), { tex: "fur", amp: 1.3, dir: 1.57 });
  // 다리 (짐승 다리 · 발굽)
  for (const [o, far, d] of [[g.f, 1, -8], [g.n, 0, 8]]) { const hp = [cx + d * 0.6, 100 + b], kn = [cx + d + 8, 122 + b * 0.5], an = [cx + d - 2 + o[0] * 0.6, G - 14], ft = [cx + d + o[0], G - 1 - o[1]]; S.add(U(capF(hp, kn, 6, 3.6), capF(kn, an, 3, 2.4), capF(an, ft, 2.4, 2.2)), far ? HIDEF : HIDE, { z: far ? -3 : 3, h: 3 }); S.add(polyF([[ft[0] - 3, ft[1] - 3], [ft[0] + 4, ft[1] - 3], [ft[0] + 5, ft[1]], [ft[0] - 3, ft[1]]]), far ? mat(rampF(0x2a2622)) : mat(ramp(0x3a342e), { spec: 0.4 }), { z: far ? -2.9 : 3.1, h: 1 }); }
  // 먼 팔 (긴)
  const shF = [cx - 8, 50 + b], hF = cl > 0 ? lerp([cx - 6, 116 + b], [cx + 30, 70 + b], Math.min(1, cl)) : [cx - 12 + Math.sin((p.ph ?? 0)) * 2, 118 + b];
  const elF = ik(shF, hF, 34, 34, 1);
  S.add(U(capF(shF, elF, 3.6, 2.6), capF(elF, hF, 2.6, 2)), HIDEF, { z: -2, h: 2 });
  for (const e of [-0.4, 0, 0.4]) S.add(capF(hF, pol(hF, 1.3 - cl + e, 10), 1, 0.3), mat(rampF(0x2a2620), { spec: 0.4 }), { z: -1.8, h: 0.5 });
  // 몸 (말라붙은 · 갈비 · 등 털)
  S.add(U(ellR(cx, 66 + b, 14, 22), ellR(cx - 2, 92 + b, 10, 10)), HIDE, { z: 1, h: 10 });
  for (let k = 0; k < 6; k++) S.add(capF([cx - 10, 54 + k * 5 + b], [cx + 12, 52 + k * 5.4 + b], 1, 0.8), HIDE, { z: 1.2, lift: 0.6, h: 1 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 10, 56.4 + k * 5 + b], [cx + 12, 54.4 + k * 5.4 + b], 0.5), 0.9);
  S.add(polyF([[cx - 16, 44 + b], [cx - 4, 42 + b], [cx - 10, 80 + b], [cx - 18, 70 + b]]), DFUR, { z: 1.4, h: 3 });
  S.add(polyF([[cx - 8, 96 + b], [cx + 8, 96 + b], [cx + 6, 108 + b], [cx - 2, 104 + b], [cx - 8, 108 + b]]), DFUR, { z: 1.5, h: 2 });
  // 목 + 사슴 두개골
  const hx = cx + 10, hy = 34 + b - hw * 4;
  S.add(capF([cx + 2, 48 + b], [hx - 2, hy + 6], 4.4, 3.4), HIDE, { z: 2, h: 3 });
  const ha = 0.7 - hw * 0.5;
  S.add(U(ellR(hx, hy, 7.4, 7), capF([hx, hy], pol([hx, hy], ha, 16), 5.4, 2.6)), BONE, { z: 3, h: 5 });
  S.add(capF(pol([hx, hy], ha + 0.4, 4), pol(pol([hx, hy], ha + 0.4, 4), ha + hw * 0.6, 12), 2, 1.2), mat(rampF(0xa8a090), { tex: "stone" }), { z: 2.8, h: 1.4 });
  for (let k = 0; k < 4; k++) S.add(polyF([pol(pol([hx, hy], ha, 6 + k * 2.4), ha + 1.57, 2), pol(pol([hx, hy], ha, 6.8 + k * 2.4), ha + 1.57, 4.4), pol(pol([hx, hy], ha, 7.6 + k * 2.4), ha + 1.57, 2)]), BONE, { z: 3.2, h: 0.4, prof: "sharp" });
  S.add(ellR(...pol([hx, hy], ha - 0.9, 2.4), 2.4, 2.2), VD, { z: 3.4, h: 0.3 });
  !p.hurt && S.decal(...pol([hx, hy], ha - 0.9, 2.4), 0xd8f0ff);
  // 거대 가지 뿔
  for (const [d, z, M] of [[-1, 2.6, mat(rampF(0x8a8070), { tex: "wood" })], [1, 3.6, mat(ramp(0xb0a690), { tex: "wood", amp: 0.8 })]]) {
    let q = [hx - 2 + d * 2, hy - 5], a = -1.9 - d * 0.25;
    for (let k = 0; k < 5; k++) { const n2 = pol(q, a, 9); S.add(capF(q, n2, 2.4 - k * 0.35, 2 - k * 0.35), M, { z, h: 1.4 }); twig(S, n2, a + 0.9 * (k % 2 ? 1 : -1), 9 - k, 1.4 - k * 0.15, M, z, 1, k + d); q = n2; a += 0.3 * (k < 2 ? -d : d * 0.5); }
  }
  // 가까운 팔 (갈고리 손톱)
  const sh = [cx + 8, 50 + b], hd = cl <= 1 ? lerp([cx + 14, 118 + b], [cx + 26, 30 + b], cl) : lerp([cx + 26, 30 + b], [cx + 60, 104 + b], Math.min(1, cl - 1));
  const el = ik(sh, hd, 34, 34, cl > 0.5 && cl < 1.5 ? -1 : 1), ca = Math.atan2(hd[1] - el[1], hd[0] - el[0]);
  S.add(U(capF(sh, el, 4, 3), capF(el, hd, 3, 2.4)), HIDE, { z: 6, h: 2.4 });
  S.add(ellR(hd[0], hd[1], 3.4, 3), HIDE, { z: 6.2, h: 2 });
  for (const e of [-0.45, 0, 0.45]) { const c0 = pol(hd, ca + e, 2.4), c1 = pol(c0, ca + e + 0.5, 12); S.add(capF(c0, c1, 1.2, 0.3), mat(ramp(0x2a2620), { spec: 0.6 }), { z: 6.4, h: 0.6 }); }
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, WDK, 80);
  for (let k = 0; k < 8; k++) { const q = P(...pol(pol([hx, hy], ha, 16), ha - 0.2 + Math.sin(k) * 0.3, 2 + k * 2 + hw * 6)); C.px(q[0], q[1], k % 2 ? 0xd8e8e8 : 0x9aaaa8); }
  mist(C, P, cx - 40, cx + 40, G - 2, p.ph ?? 0, 16);
  return fin(C, p);
}
export const pxWendigo = {
  fw: Math.round(180 * WDK), fh: Math.round(168 * WDK), w: 30, h: 70,
  anims: { idle: [6, 4], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], howl: [4, 8, !1], leap: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 1, ph };
    if (nm === "move") { const g = gait2(f, n, 9, 4); P = { legs: g, bob: g.bob * 1.4, ph }; }
    if (nm === "wind") P = { claw: t, ph, bob: 2 };
    if (nm === "atk") P = { claw: [1.5, 2, 2][f], ph };
    if (nm === "rec") P = { claw: 2 * (1 - t), ph };
    if (nm === "howl") P = { howl: [0.5, 1, 1, 0.6][f], bob: -2, ph };
    if (nm === "leap") P = { claw: [0.6, 1, 1.2][f], bob: -4, ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return wendigoFrame(P);
  },
};

// ════ 낙엽 덩이 ════ 바람도 없는데 뭉쳐 굴러다니는 낙엽 더미 · 잎 사이로 엿보는 두 눈 · 덮치면 잎이 소용돌이친다
//   p: ph · swirl · hide · hurt
const LVK = 0.72;
const LEAFS = [mat(ramp(0x8a6a3a), { tex: "leaf", amp: 1.2 }), mat(ramp(0x6a5a3a), { tex: "leaf", amp: 1.2 }), mat(ramp(0xa07a40), { tex: "leaf", amp: 1.1 }), mat(ramp(0x5a5444), { tex: "leaf", amp: 1.2 })];
function leavesFrame(p = {}) {
  const W = 70, H = 50, G = H - 1, S = sculpt(W, H, { k: LVK, ax: 35 });
  const ph = p.ph ?? 0, sw = p.swirl ?? 0, hd = p.hide ?? 0, cx = 35, cy = G - 10 + hd * 3;
  S.add(U(ellR(cx, cy, 18 - hd * 2, 10 - hd * 3), ellR(cx, G - 3, 22, 4)), LEAFS[1], { z: 1, h: 7 });
  for (let k = 0; k < 22; k++) { const a = k * 2.4 + ph * (0.3 + sw), r = 4 + ((k * 7) % 14) * (1 + sw * 0.6), q = [cx + Math.cos(a) * r, cy - 2 + Math.sin(a) * r * 0.5 - sw * ((k % 5) * 3)]; const la = a + 1.2; S.add(polyF([pol(q, la, 3), pol(q, la + 1.57, 1.4), pol(q, la + Math.PI, 3), pol(q, la - 1.57, 1.4)]), LEAFS[k % 4], { z: 2 + (k % 3) * 0.2, h: 0.6 }); }
  twig(S, [cx - 6, cy - 6], -1.9, 8, 0.8, DEAD, 2.8, 1, 2);
  if (hd < 0.7) for (const x of [cx + 4, cx + 9]) { S.add(ellR(x, cy - 2, 1.4, 1.2), VD, { z: 3, h: 0.3 }); !p.hurt && S.decal(x, cy - 2.2, 0xffd070); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxLeaves = {
  fw: Math.round(70 * LVK), fh: Math.round(50 * LVK), w: 24, h: 14,
  anims: { idle: [6, 4], move: [6, 8], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], hide: [4, 2] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 2, swirl: 0.3 };
    if (nm === "wind") P = { ph: ph * 2, swirl: t * 0.6 };
    if (nm === "atk") P = { ph: ph * 3, swirl: 1 };
    if (nm === "rec") P = { ph, swirl: 1 - t };
    if (nm === "hide") P = { ph: ph * 0.2, hide: 1 };
    if (nm === "hurt") P = { hurt: f === 0, ph, swirl: 0.5 };
    return leavesFrame(P);
  },
};

// ════ 미친 나무꾼 ════ 안개 숲에서 길을 잃고 미쳐 버린 나무꾼 · 헝클어진 머리와 수염 · 찢긴 체크 셔츠 · 핏발 선 눈 · 이 빠진 큰 도끼
//   p: legs · bob · sw · hurt
const WCK = 0.72;
function woodcutterFrame(p = {}) {
  const W = 120, H = 96, G = H - 1, S = sculpt(W, H, { k: WCK, ax: 42 });
  const b = p.bob ?? 0, sw = p.sw ?? 0, cx = 38;
  const SHIRT = mat(ramp(0x7a3a32), { tex: "cloth", amp: 1.2 }), SHIRTF = mat(rampF(0x5a2a26), { tex: "cloth" }), PANT = mat(ramp(0x4a4a50), { tex: "cloth" }), PANTF = mat(rampF(0x363640), { tex: "cloth" }), SKN = mat(ramp(0xb08a70), { tex: "skin", amp: 0.9 });
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: SHIRT, hurt: p.hurt,
    legO: { thigh: PANT, thighF: PANTF, shin: PANT, shinF: PANTF, boot: LEATH, bootF: LEATHF, knee: !1 },
    head: (hx, hy) => {
      S.add(ellR(hx + 1, hy + 1, 6, 6.6), SKN, { z: 4, h: 4 });
      S.add(polyF([[hx - 2, hy + 3], [hx + 8, hy + 2], [hx + 7, hy + 12], [hx + 2, hy + 14], [hx - 1, hy + 9]]), mat(ramp(0x5a3a26), { tex: "fur", amp: 1.4, dir: 1.57 }), { z: 4.4, h: 2 });
      S.add(U(ellR(hx - 1, hy - 4, 7.4, 5), polyF([[hx - 8, hy - 4], [hx - 11, hy + 6], [hx - 4, hy + 2]])), mat(ramp(0x4a3020), { tex: "fur", amp: 1.5, dir: 0.8 }), { z: 4.6, h: 3 });
      for (let k = 0; k < 5; k++) S.add(capF([hx - 6 + k * 3, hy - 7], [hx - 8 + k * 3.4, hy - 12 + (k % 2) * 2], 0.8, 0.3), mat(ramp(0x4a3020), { tex: "fur" }), { z: 4.7, h: 0.4 });
      S.add(ellR(hx + 4.4, hy - 0.6, 1.6, 1.2), mat(ramp(0xe8d8c8)), { z: 4.5, lift: 0.1, h: 0.3 });
      !p.hurt && S.decal(hx + 5, hy - 0.6, 0x8a1a1a);
    },
  });
  // 체크 무늬 + 찢긴 자락
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 10, 42 + k * 5 + b], [cx + 10, 42 + k * 5 + b], 0.4), 0.5).carve(capF([cx - 8 + k * 5, 36 + b], [cx - 8 + k * 5, 62 + b], 0.4), 0.5);
  S.add(polyF([[cx - 10, 62 + b], [cx + 10, 62 + b], [cx + 8, 70 + b], [cx + 3, 66 + b], [cx - 2, 72 + b], [cx - 8, 66 + b]]), SHIRTF, { z: 2, h: 2 });
  S.add(capF([cx - 10, 64 + b], [cx + 10, 64 + b], 1.4), LEATH, { z: 2.2, h: 1 });
  // 도끼 (두 손으로)
  const hd = sw <= 1 ? lerp([cx + 12, 60 + b], [cx - 2, 30 + b], sw) : lerp([cx - 2, 30 + b], [cx + 26, 64 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(-0.6, -2.3, sw) : L(-2.3, 0.7, Math.min(1, sw - 1));
  arm(S, sol.S1, pol(hd, ba, -6), 1, { M: SKN, MF: mat(rampF(0x8a6a54), { tex: "skin" }), z: -1, l: 10 });
  const top = pol(hd, ba, 30), bot = pol(hd, ba, -10), n = ba + Math.PI / 2;
  S.add(capF(bot, top, 1.4, 1.2), mat(ramp(0x6a4a30), { tex: "wood" }), { z: 7.6, h: 1 });
  S.add(polyF([pol(top, ba, 2), pol(pol(top, ba, 4), n, 10), pol(pol(top, ba, -1), n, 13), pol(pol(top, ba, -8), n, 11), pol(top, ba, -8)]), IRON, { z: 7.8, h: 1.6, prof: "sharp" });
  S.add(polyF([pol(pol(top, ba, 0), n, 12), pol(pol(top, ba, -2), n, 14), pol(pol(top, ba, -4), n, 12.4)]), mat(ramp(0x8a8c88)), { z: 7.9, h: 0.4 });
  S.add(ellR(...pol(pol(top, ba, -3), n, 7), 2, 1.6), mat(ramp(0x5a1a16)), { on: 1, lift: 0.3, h: 0.3 });
  arm(S, sol.S0, hd, 0, { M: SKN, MF: SKN, l: 10 });
  S.add(capF(lerp(sol.S0, hd, 0.2), lerp(sol.S0, hd, 0.4), 3.4), SHIRT, { z: 8.2, h: 2 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxWoodcutter = {
  fw: Math.round(120 * WCK), fh: Math.round(96 * WCK), w: 16, h: 32,
  anims: { idle: [4, 5], move: [6, 10], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph * 2) * 0.8 };
    if (nm === "move") { const g = gait2(f, n, 6, 2.6); P = { legs: g, bob: g.bob, sw: 0.2 }; }
    if (nm === "wind") P = { sw: t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 1 };
    if (nm === "rec") P = { sw: 2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return woodcutterFrame(P);
  },
};

// ════ 회색 너구리 ════ 눈가에 검은 가면 무늬 · 줄무늬 꼬리 · 훔친 물건 가득한 자루를 둘러멨다 · 앞발로 도토리와 돌을 던진다
//   p: legs · bob · throw · hurt
const RCK = 0.72;
function raccoonFrame(p = {}) {
  const W = 84, H = 54, G = H - 1, S = sculpt(W, H, { k: RCK, ax: 40 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, th = p.throw ?? 0, cx = 38, up = th > 0 ? 6 : 0;
  const RF = mat(ramp(0x8a8680), { tex: "fur", amp: 1.2, dir: 0.4 }), RFF = mat(rampF(0x66625c), { tex: "fur", amp: 1.1, dir: 0.4 });
  const paw = (sh, o, far) => { const ft = [sh[0] + o[0], G - 1 - o[1]]; S.add(capF(sh, ft, 2.6, 1.8), far ? RFF : mat(ramp(0x3a3632), { tex: "fur" }), { z: far ? -3 : 5, h: 1.6 }); };
  paw([cx + 10, 38 + b], lg.ff, 1), paw([cx - 10, 38 + b], lg.bf, 1);
  // 꼬리 (고리 무늬)
  for (let k = 0; k < 6; k++) { const q = [cx - 16 - k * 3.6, 34 + b - k * 1.6 + Math.sin((p.ph ?? 0) + k * 0.6) * 1.4]; S.add(ellR(q[0], q[1], 3.4 - k * 0.2, 3.6 - k * 0.2), k % 2 ? mat(ramp(0x2e2a26), { tex: "fur" }) : RF, { z: 0.5 - k * 0.02, h: 2.6 }); }
  // 몸
  S.add(U(ellR(cx, 36 + b - up * 0.5, 15, 9), ellR(cx + 10, 34 + b - up, 8, 8)), RF, { z: 1, h: 7 });
  // 훔친 자루
  S.add(U(ellR(cx - 6, 26 + b, 8, 7), capF([cx - 6, 20 + b], [cx - 2, 16 + b], 2, 1)), mat(ramp(0x9a8460), { tex: "cloth", amp: 1.3 }), { z: 2, h: 5 });
  S.add(capF([cx - 2, 20 + b], [cx + 10, 30 + b], 0.8), mat(ramp(0x6a5a3a)), { z: 2.4, h: 0.4 });
  S.add(ellR(cx - 3, 20 + b, 1.6, 1.2), mat(ramp(0xd8b040), { spec: 1 }), { z: 2.6, h: 0.6 });
  // 머리 (가면 무늬)
  const hx = cx + 18, hy = 30 + b - up;
  S.add(U(ellR(hx, hy, 6.4, 5.6), capF([hx + 2, hy + 1], [hx + 9, hy + 2], 3, 1.4)), RF, { z: 3, h: 4 });
  S.add(capF([hx - 3, hy - 1], [hx + 6, hy - 0.6], 2.2, 1.6), mat(ramp(0x24201e), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.4 });
  S.add(capF([hx - 2, hy - 4], [hx + 6, hy - 3], 1.2, 0.8), mat(ramp(0xe0dcd4), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  S.add(capF([hx + 1, hy + 3], [hx + 7, hy + 3], 1, 0.6), mat(ramp(0xe0dcd4), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  for (const d of [-4, 1]) S.add(ellR(hx + d, hy - 6, 2, 2.2), RFF, { z: 2.8, h: 1 });
  S.add(ellR(hx + 9.4, hy + 1.6, 1, 0.9), mat(ramp(0x1a1a1a)), { z: 3.2, h: 0.4 });
  !p.hurt && S.decal(hx + 3.4, hy - 1, 0xffe0a0);
  // 앞발 (던지기)
  const sh = [cx + 12, 36 + b - up], hd = th > 0 ? lerp([cx + 10, 22 + b], [cx + 26, 30 + b], Math.min(1, th)) : [cx + 14 + lg.fn[0], G - 1 - lg.fn[1]];
  S.add(capF(sh, hd, 2.4, 1.8), mat(ramp(0x3a3632), { tex: "fur" }), { z: 5, h: 1.6 });
  th > 0 && th < 0.8 && S.add(ellR(hd[0], hd[1] - 2, 2.2, 2.6), mat(ramp(0x8a6a3a), { tex: "wood" }), { z: 5.2, h: 1.4 });
  th === 0 && paw([cx - 8, 39 + b], lg.bn, 0);
  th > 0 && paw([cx - 8, 39 + b], [0, 0], 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxRaccoon = {
  fw: Math.round(84 * RCK), fh: Math.round(54 * RCK), w: 24, h: 16,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], throw: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") P = { legs: gait4(f, n, 5, 2), bob: Math.cos(ph * 2) * 0.6, ph };
    if (nm === "wind") P = { bob: 1, ph };
    if (nm === "atk") P = { legs: { fn: [6, 3] }, bob: -1, ph };
    if (nm === "rec") P = { ph };
    if (nm === "throw") P = { throw: [0.3, 1, 1][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, ph };
    return raccoonFrame(P);
  },
};

// ════ [정예] 외눈 거인 ════ 안개 숲 깊은 곳의 외눈 거인 · 이마 한가운데 커다란 눈 하나 · 덥수룩한 머리와 수염 · 털가죽 허리옷 ·
//   뿌리째 뽑은 고사목 몽둥이 · 맨발로 땅을 울린다
//   p: legs · bob · sw · blink · hurt
const CYK = 0.62;
function cyclopsFrame(p = {}) {
  const W = 190, H = 164, G = H - 1, S = sculpt(W, H, { k: CYK, ax: 80 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 74;
  const SKN = mat(ramp(0x9a8a74), { tex: "skin", amp: 1, spec: 0.2 }), SKNF = mat(rampF(0x7a6c5a), { tex: "skin" }), HAIR = mat(ramp(0x4a3a2a), { tex: "fur", amp: 1.4, dir: 1.57 });
  // 다리 (맨발)
  for (const [o, far, d] of [[g.f, 1, -12], [g.n, 0, 12]]) { const hp = [cx + d * 0.6, 104 + b], ft = [cx + d + o[0], G - 4 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 4, L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 11, 9), capF(kn, ft, 9, 7)), far ? SKNF : SKN, { z: far ? -3 : 3, h: 7 }); S.add(U(ellR(ft[0] + 5, ft[1] + 1, 11, 4)), far ? SKNF : SKN, { z: far ? -2.9 : 3.1, h: 3 }); for (const dd of [6, 10, 14]) S.carve(capF([ft[0] + dd, ft[1] - 1], [ft[0] + dd, ft[1] + 3], 0.4), 0.6); }
  // 먼 팔
  const shF = [cx - 20, 54 + b], hF = [cx - 24 + Math.sin(sw) * 4, 100 + b];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 10, 9), capF(lerp(shF, hF, 0.5), hF, 9, 8)), SKNF, { z: -2, h: 7 });
  S.add(ellR(hF[0], hF[1] + 2, 8, 7), SKNF, { z: -1.9, h: 5 });
  // 몸 (불룩한 배 · 털 허리옷)
  S.add(U(ellR(cx, 72 + b, 30, 30), ellR(cx - 2, 50 + b, 26, 16)), SKN, { z: 1, h: 22 });
  S.carve(capF([cx + 6, 52 + b], [cx + 8, 96 + b], 0.6), 0.6);
  S.add(ellR(cx + 8, 84 + b, 1.4, 1), mat(ramp(0x5a4a3a)), { z: 1.2, lift: 0.1, h: 0.2 });
  for (let k = 0; k < 8; k++) S.add(capF([cx - 14 + k * 4, 46 + b + (k % 2) * 2], [cx - 15 + k * 4, 52 + b + (k % 2) * 3], 0.6, 0.3), HAIR, { on: 1, lift: 0.3, h: 0.3 });
  const hem = [];
  for (let k = 0; k <= 8; k++) hem.push([cx - 30 + k * 7.6, 112 + b + (k % 2) * 5]);
  S.add(polyF([[cx - 30, 92 + b], [cx + 30, 92 + b], ...hem.slice().reverse()]), FURG, { z: 2, h: 5 });
  S.add(capF([cx - 30, 94 + b], [cx + 30, 94 + b], 2.4), LEATH, { z: 2.4, h: 1.6 });
  S.add(ellR(cx + 8, 94 + b, 3, 3), BONE, { z: 2.8, h: 1.6 });
  // 머리 (외눈 · 덥수룩)
  const hx = cx + 10, hy = 30 + b;
  S.add(U(ellR(hx, hy, 15, 15), polyF([[hx - 12, hy], [hx + 12, hy + 2], [hx + 8, hy + 14], [hx - 10, hy + 14]])), SKN, { z: 3, h: 10 });
  S.add(U(ellR(hx - 4, hy - 10, 15, 9), polyF([[hx - 16, hy - 8], [hx - 20, hy + 22], [hx - 8, hy + 8]])), HAIR, { z: 3.4, h: 6 });
  S.add(polyF([[hx - 2, hy + 10], [hx + 16, hy + 9], [hx + 12, hy + 22], [hx + 5, hy + 26], [hx - 3, hy + 20]]), HAIR, { z: 3.6, h: 4 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx + k * 3, hy + 12], [hx + k * 3 - 1, hy + 24], 0.5), 0.8);
  S.add(capF([hx + 6, hy + 9], [hx + 13, hy + 8], 1.2), mat(ramp(0x5a3a30)), { z: 3.7, h: 0.4 });
  const bl = p.blink ?? 0;
  S.add(ellR(hx + 7, hy - 1, 7.4, 6.6), mat(ramp(0xe8e0d0), { spec: 0.7 }), { z: 3.8, h: 2.4 });
  if (bl < 0.5) { S.add(ellR(hx + 9, hy - 0.6, 3.8, 3.8), mat(ramp(0x6a8a3a), { spec: 0.8 }), { z: 4.2, h: 0.8 }); S.add(ellR(hx + 9.4, hy - 0.6, 1.8, 1.8), VD, { z: 4.4, h: 0.3 }); !p.hurt && S.decal(hx + 8, hy - 2.4, 0xffffff); }
  else S.add(ellR(hx + 7, hy - 1, 7.8, 7), SKN, { z: 4.3, h: 2.6 });
  S.add(capF([hx + 1, hy - 7], [hx + 13, hy - 6], 1.6), HAIR, { z: 4.4, h: 1 });
  S.add(ellR(hx + 14, hy + 4, 2.6, 3), SKN, { z: 3.9, h: 2 });
  // 가까운 팔 + 고사목 몽둥이
  const sh = [cx + 18, 54 + b], hd = sw <= 1 ? lerp([cx + 30, 98 + b], pol(sh, -1.9, 32), sw) : lerp(pol(sh, -1.9, 32), [cx + 58, 104 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.2, -2.3, sw) : L(-2.3, 0.6, Math.min(1, sw - 1)), el = ik(sh, hd, 22, 22, 1);
  S.add(ellR(sh[0], sh[1], 11, 10), SKN, { z: 6, h: 8 });
  S.add(U(capF(sh, el, 10, 9), capF(el, hd, 9, 8)), SKN, { z: 7, h: 7 });
  const top = pol(hd, ba, 60), bot = pol(hd, ba, -14);
  S.add(U(capF(bot, top, 4.4, 8), ellR(...pol(top, ba, 2), 9, 8)), BARK, { z: 8, h: 6 });
  S.carve(capF(pol(hd, ba, 4), pol(hd, ba, 56), 0.6), 0.8);
  for (const [t, d] of [[0.5, 1], [0.75, -1], [0.95, 1]]) twig(S, pol(hd, ba, 60 * t), ba + d * 0.9, 10, 1.6, BARKF, 7.9, 1, t * 10);
  for (let k = 0; k < 4; k++) S.add(capF(pol(bot, ba, 0), pol(pol(bot, ba, -4), ba + 2.4 + k * 0.4, 8), 1.4, 0.4), BARKF, { z: 7.8, h: 0.8 });
  S.add(ellR(hd[0], hd[1], 8, 7), SKN, { z: 8.4, h: 5 });
  const C = S.render({ rim: !0 });
  mist(C, toPx(W, H, CYK, 80), cx - 50, cx + 50, G - 2, p.ph ?? 0, 20);
  return fin(C, p);
}
export const pxCyclops = {
  fw: Math.round(190 * CYK), fh: Math.round(164 * CYK), w: 40, h: 70,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], stomp: [3, 12, !1], throw: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 1, ph, blink: f === 3 ? 1 : 0 };
    if (nm === "move") { const g = gait2(f, n, 8, 3); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 2, ph };
    if (nm === "rec") P = { sw: 2 * (1 - t), bob: 2 * (1 - t), ph };
    if (nm === "stomp") P = { legs: { n: [4, [10, 0, 0][f]], f: [0, 0] }, bob: [-2, 3, 1][f], ph };
    if (nm === "throw") P = { sw: [1, 1.6, 2][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph, blink: 1 };
    return cyclopsFrame(P);
  },
};
