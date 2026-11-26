// 블랙펜 몬스터 12종 (조각 도구, 오른쪽을 본다) — 검은 늪 달밤 · 비틀린 거대 고목 · 달빛 비친 검은 물 · 겹 안개 · 도깨비불
//   지상 줄: 교수목 버드나무 · 쥐왕 · 검은 고양이 · [정예] 늪 늑대인간
//   하늘 줄: 늪 하피 · 해골 등롱 · 안개 구렁이 · [정예] 흡혈 대박쥐
//   지하 줄: 익사자 · 늪 오소리 · 늪지 어인 · [정예] 늪 메기 왕
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const BARK = mat(ramp(0x4a4038), { tex: "wood", amp: 1.1 }), BARKF = mat(rampF(0x3a322c), { tex: "wood", amp: 1 }), LEAF = mat(ramp(0x4a6a44), { tex: "leaf", amp: 0.9 }), LEAFF = mat(rampF(0x38523a), { tex: "leaf", amp: 0.8 });
const WISP = mat(rampGlow(0x90ffb0)), MOON = mat(rampGlow(0xd8e8ff)), FIRE = mat(rampGlow(0xffb050)), DARK = mat(ramp(0x121010));
const BONE = mat(ramp(0xd8ccb0), { tex: "stone", amp: 0.5, spec: 0.3 }), BONEF = mat(rampF(0xb0a48a), { tex: "stone", amp: 0.5 }), ROPE = mat(ramp(0x8a7a58), { tex: "wood", amp: 1 });
const RUST = mat(ramp(0x6a4a3a), { tex: "metal", amp: 1.1, spec: 0.3 }), MUD = mat(ramp(0x3a3428), { tex: "clay", amp: 1 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
function haze(C, amt, ph = 0) {
  if (!(amt > 0)) return C;
  const { W, H, d } = C, row = new Int32Array(W);
  for (let y = 0; y < H; y++) { const sh = Math.round(Math.sin(y * 0.6 + ph) * amt); if (!sh) continue; for (let x = 0; x < W; x++) row[x] = d[y * W + x]; for (let x = 0; x < W; x++) { const sx = x - sh; d[y * W + x] = sx >= 0 && sx < W ? row[sx] : -1; } }
  return C;
}

// ════ 교수목 버드나무 ════ 비틀린 검은 줄기에 파인 얼굴(빈 눈에 늪빛) · 아래로 늘어진 버들가지 장막 · 가지에 걸린 해진 올가미 ·
//   뿌리 다리로 끌듯이 걷는다
//   p: step · bob · lash(가지 휘두르기) · ph · hurt
const WLK = 0.7;
function willowFrame(p = {}) {
  const W = 120, H = 120, G = H - 1, S = sculpt(W, H, { k: WLK, ax: 52 });
  const st = p.step ?? 0, b = p.bob ?? 0, ls = p.lash ?? 0, ph = p.ph ?? 0, cx = 50;
  // 늘어진 버들가지 (뒤 장막)
  const strand = (x0, y0, l, far, sw) => { let q = [x0, y0]; for (let j = 0; j < 6; j++) { const n2 = [q[0] + Math.sin(ph + x0 * 0.3 + j) * 1.2 + sw * j * 1.6, q[1] + l / 6]; S.add(capF(q, n2, 1.6 - j * 0.12, 1.4 - j * 0.12), far ? LEAFF : LEAF, { z: far ? -4 : 6, h: 0.8 }); q = n2; } };
  for (let k = 0; k < 9; k++) strand(cx - 30 + k * 7, 26 + b + Math.abs(k - 4) * 2, 46 + (k % 3) * 8, 1, 0);
  // 뿌리 다리
  for (const [d, far, s] of [[-10, 1, -st], [4, 1, st], [-4, 0, st], [12, 0, -st]]) { const top = [cx + d * 0.6, 84 + b], ft = [cx + d * 1.4 + s, G - 2]; S.add(U(capF(top, lerp(top, ft, 0.5), 6, 4.4), capF(lerp(top, ft, 0.5), ft, 4.4, 2.4)), far ? BARKF : BARK, { z: far ? -3 : 4, h: 4 }); for (const a of [-0.6, 0.1, 0.7]) S.add(capF(ft, [ft[0] + Math.sin(a) * 8, G - 0.5], 1.6, 0.5), far ? BARKF : BARK, { z: far ? -2.9 : 4.1, h: 0.8 }); }
  // 줄기 (비틀림 · 결) + 얼굴
  S.add(U(polyF([[cx - 14, 30 + b], [cx + 12, 30 + b], [cx + 16, 88 + b], [cx - 16, 88 + b]]), ellR(cx, 30 + b, 14, 8)), BARK, { z: 1, h: 13 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 12 + k * 5, 32 + b], [cx - 14 + k * 5 + Math.sin(k) * 4, 86 + b], 0.6), 0.9);
  const fy = 52 + b;
  S.add(ellR(cx + 4, fy, 3.4, 4.4), DARK, { on: 1, lift: 0.1, h: 0.3 }).add(ellR(cx + 13, fy + 1, 2.6, 3.6), DARK, { on: 1, lift: 0.1, h: 0.3 });
  S.add(U(ellR(cx + 8, fy + 14, 5.4, 3.4 + ls * 2)), DARK, { on: 1, lift: 0.1, h: 0.3 });
  S.add(capF([cx, fy - 6], [cx + 16, fy - 4], 1.6), BARKF, { lift: 0.8, h: 1.2 });
  !p.hurt && S.decal(cx + 4, fy, 0x90ffb0).decal(cx + 13, fy + 1, 0x90ffb0);
  // 가지 둘 (위로 굽었다 늘어짐) + 올가미
  const br = (sh, far) => { const el = [sh[0] + (far ? -16 : 18) + ls * (far ? 0 : 14), sh[1] - 16 + ls * 10], tip = [el[0] + (far ? -8 : 12) + ls * 16, el[1] + 8 + ls * 6]; S.add(U(capF(sh, el, 4, 3), capF(el, tip, 3, 1.4)), far ? BARKF : BARK, { z: far ? -2 : 7, h: 2.6 }); for (let k = 0; k < 4; k++) strand(L(el[0], tip[0], k / 3), L(el[1], tip[1], k / 3), 24 + k * 4, far, ls * (far ? 0 : 0.6)); return el; };
  br([cx - 8, 36 + b], 1);
  const elN = br([cx + 8, 36 + b], 0);
  const n0 = [elN[0] - 4, elN[1] + 2], n1 = [n0[0] + Math.sin(ph) * 2, n0[1] + 20];
  S.add(capF(n0, n1, 0.6), ROPE, { z: 7.5, h: 0.5 });
  S.add(minus(ellR(n1[0], n1[1] + 4, 3.4, 4.4), ellR(n1[0], n1[1] + 4, 2.2, 3.2)), ROPE, { z: 7.6, h: 0.8 });
  // 앞쪽 버들가지 몇 가닥
  for (let k = 0; k < 4; k++) strand(cx - 18 + k * 12, 28 + b + (k % 2) * 4, 30 + k * 4, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxWillow = {
  fw: Math.round(120 * WLK), fh: Math.round(120 * WLK), w: 30, h: 56,
  anims: { idle: [6, 4], move: [6, 5], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6, ph };
    if (nm === "move") P = { step: Math.sin(ph) * 5, bob: -Math.abs(Math.sin(ph)) * 2, ph };
    if (nm === "wind") P = { lash: -0.4 * t, ph };
    if (nm === "atk") P = { lash: [0.6, 1, 1][f], ph };
    if (nm === "rec") P = { lash: 1 - t, ph };
    if (nm === "hurt") P = { hurt: f === 0, lash: -0.3, ph };
    return willowFrame(P);
  },
};

// ════ 쥐왕 ════ 꼬리가 한 덩어리로 엉켜 붙은 시궁쥐 일곱 마리 · 사방을 향한 붉은 눈 · 흙빛 털 · 꿈틀대며 함께 움직인다
//   p: ph · lunge · hurt
const RKK = 0.72;
const RAT = mat(ramp(0x5a4a40), { tex: "fur", amp: 1.1, dir: 0.2 }), RATF = mat(rampF(0x463a32), { tex: "fur", amp: 1, dir: 0.2 }), RATP = mat(ramp(0xb88a80), { tex: "skin", amp: 0.6 });
function ratKingFrame(p = {}) {
  const W = 104, H = 62, G = H - 1, S = sculpt(W, H, { k: RKK, ax: 50 });
  const ph = p.ph ?? 0, lu = p.lunge ?? 0, cx = 50, cy = G - 15;
  const rats = [];
  for (let k = 0; k < 7; k++) { const a = -Math.PI + (k / 6) * Math.PI + Math.sin(ph + k) * 0.12, far = k % 2 === 0; rats.push({ a: a + (k === 6 ? lu * 0.2 : 0), far, k }); }
  // 엉킨 꼬리 덩어리
  S.add(ellR(cx, cy + 2, 8, 5.4), RATP, { z: 0, h: 4 });
  for (let k = 0; k < 6; k++) S.carve(capF(pol([cx, cy + 2], k, 1), pol([cx, cy + 2], k + 1.2, 5), 0.4), 0.6);
  const rat = ({ a, far, k }) => {
    const reach = 20 + (k === 6 ? lu * 10 : 0), b0 = pol([cx, cy + 2], a, 5), c = pol([cx, cy + 2], a, reach * 0.6), hd = pol([cx, cy + 2], a, reach);
    const z = far ? -1 + k * 0.05 : 2 + k * 0.05, M0 = far ? RATF : RAT;
    S.add(capF(b0, c, 1, 3.6), RATP, { z: z - 0.1, h: 1 });
    S.add(U(ellR(c[0], c[1], 7.4, 5.4, a)), M0, { z, h: 5 });
    S.add(U(capF(c, hd, 4.8, 3), capF(hd, pol(hd, a, 5.4), 3, 1.3)), M0, { z: z + 0.1, h: 4 });
    S.add(ellR(...pol(hd, a, 5.8), 1.2, 1.2), RATP, { z: z + 0.2, h: 0.8 });
    S.add(ellR(...pol(pol(hd, a, -1.4), a - 1.57, 3.2), 2.2, 2.2), RATP, { z: z + 0.15, h: 1.2 });
    for (const s2 of [-1, 1]) S.add(capF(pol(hd, a, 5), pol(pol(hd, a, 5), a + s2 * 0.6, 5), 0.25), mat(ramp(0xd8d0c0)), { z: z + 0.25, h: 0.2 });
    !p.hurt && S.decal(...pol(pol(hd, a, 1.8), a - 1.57, 1.6), 0xff3030);
    for (const s of [-1, 1]) S.add(capF(pol(c, a + s * 1.57, 4), pol(pol(c, a + s * 1.57, 6), Math.PI / 2, 5), 0.8, 0.5), RATP, { z: z - 0.05, h: 0.5 });
  };
  rats.filter((r) => r.far).forEach(rat);
  rats.filter((r) => !r.far).forEach(rat);
  return fin(S.render({ rim: !0 }), p);
}
export const pxRatKing = {
  fw: Math.round(104 * RKK), fh: Math.round(62 * RKK), w: 32, h: 20,
  anims: { idle: [6, 8], move: [6, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 2 };
    if (nm === "wind") P = { ph, lunge: -0.5 * t };
    if (nm === "atk") P = { ph: ph * 2, lunge: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { ph, lunge: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return ratKingFrame(P);
  },
};

// ════ 검은 고양이 ════ 마른 들고양이 · 칠흑 털에 달빛 테두리 · 찢어진 귀 · 초록으로 빛나는 눈 · 긴 꼬리 · 성나면 등을 활처럼 세운다
//   p: legs · bob · arch · leap · hiss · hurt
const CTK = 0.72;
const CAT = mat(ramp(0x24222a), { tex: "fur", amp: 1, dir: 0.3, spec: 0.3 }), CATF = mat(rampF(0x1a181e), { tex: "fur", amp: 0.9, dir: 0.3 });
function catFrame(p = {}) {
  const W = 80, H = 54, G = H - 1, S = sculpt(W, H, { k: CTK, ax: 38 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, ar = p.arch ?? 0, lp = p.leap ?? 0, cx = 36;
  const lgf = (sh, o, far, front) => { const ft = [sh[0] + o[0] + (front ? 2 : -2), G - 1.5 - o[1] - lp * 5], kn = ik(sh, ft, 10, 10, front ? -1 : 1), M0 = far ? CATF : CAT; S.add(U(capF(sh, kn, far ? 2.4 : 2.8, 1.8), capF(kn, ft, 1.6, 1.4)), M0, { z: far ? -3 : 5, h: 2 }); S.add(ellR(ft[0] + 1.4, ft[1], 2.2, 1.2), M0, { z: far ? -2.9 : 5.1, h: 1 }); };
  lgf([cx + 10, 34 + b - ar * 4], lg.ff, 1, 1), lgf([cx - 10, 34 + b - ar * 4], lg.bf, 1, 0);
  // 꼬리 (위로 휘거나 부풀린)
  let q = [cx - 14, 28 + b - ar * 6];
  for (let k = 0; k < 6; k++) { const n2 = [q[0] - 2.6 + k * 0.4, q[1] - 2.4 - ar * 0.8 + Math.sin((p.ph ?? 0) + k) * 0.6]; S.add(capF(q, n2, 1.8 + ar * 1.2, 1.6 + ar * 1.2), CAT, { z: 0, h: 1.4 }); q = n2; }
  // 몸 (등이 활처럼)
  S.add(U(ellR(cx + 4, 29 + b - ar * 6, 11, 6.4), ellR(cx - 8, 29 + b - ar * 6, 9, 6), capF([cx - 4, 27 + b - ar * 10], [cx + 4, 27 + b - ar * 9], 6)), CAT, { z: 1, h: 6 });
  if (ar > 0.3) for (let k = 0; k < 8; k++) { const x = cx - 12 + k * 3.4; S.add(capF([x, 23 + b - ar * 10 - Math.sin((k / 7) * Math.PI) * ar * 3], [x - 1, 20 + b - ar * 12 - Math.sin((k / 7) * Math.PI) * ar * 4], 0.6, 0.3), CAT, { lift: 0.4, h: 0.4 }); }
  S.add(capF([cx - 14, 25 + b - ar * 8], [cx + 12, 24 + b - ar * 7], 0.6), mat(ramp(0x6a7088), { tex: "fur" }), { on: 1, lift: 0.4, h: 0.2 });
  // 머리 (찢어진 귀 · 초록 눈 · 쉿)
  const hx = cx + 16, hy = 22 + b - lp * 2 + ar * 2;
  S.add(capF([cx + 10, 27 + b - ar * 4], [hx - 2, hy + 2], 4, 3.4), CAT, { z: 2, h: 3 });
  S.add(polyF([[hx - 4, hy - 3], [hx - 4, hy - 11], [hx + 1, hy - 4]]), CATF, { z: 2.5, h: 1.2 });
  S.add(ellR(hx, hy, 5, 4.4), CAT, { z: 3, h: 4 });
  S.add(capF([hx + 3, hy + 1], [hx + 8, hy + 2], 2.4, 1.6), CAT, { z: 3.2, h: 2 });
  S.add(polyF([[hx - 1, hy - 3], [hx + 1, hy - 12], [hx + 2.6, hy - 9], [hx + 3.4, hy - 10], [hx + 4, hy - 3]]), CAT, { z: 3.4, h: 1.4 });
  p.hiss && S.add(polyF([[hx + 4, hy + 2.4], [hx + 9, hy + 2], [hx + 8, hy + 5], [hx + 4, hy + 4]]), mat(ramp(0x8a3a4a)), { z: 3.3, h: 0.3 });
  p.hiss && S.add(polyF([[hx + 5, hy + 2.4], [hx + 6, hy + 2.4], [hx + 5.5, hy + 4]]), BONE, { z: 3.35, h: 0.3 });
  !p.hurt && S.decal(hx + 2.4, hy - 1, 0x90ff80).decal(hx + 2.8, hy - 1, 0x101010);
  lgf([cx + 12, 35 + b - ar * 4], lg.fn, 0, 1), lgf([cx - 8, 35 + b - ar * 4], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxCat = {
  fw: Math.round(80 * CTK), fh: Math.round(54 * CTK), w: 22, h: 14,
  anims: { idle: [4, 5], move: [6, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], hiss: [3, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") P = { legs: gait4(f, n, 5, 3), bob: Math.cos(ph * 2) * 0.6, ph };
    if (nm === "wind") P = { arch: -0.2 * t, ph };
    if (nm === "atk") P = { leap: [0.6, 1, 0.4][f], legs: { fn: [5, 3], ff: [5, 3], bn: [-5, 0], bf: [-5, 0] }, ph };
    if (nm === "rec") P = { ph };
    if (nm === "hiss") P = { arch: 1, hiss: 1, ph };
    if (nm === "hurt") P = { hurt: f === 0, arch: 0.5, hiss: 1, ph };
    return catFrame(P);
  },
};

// ════ [정예] 늪 늑대인간 ════ 구부정한 거구 · 회갈색 털에 달빛 은빛 테두리 · 길게 늘어진 팔과 갈고리 발톱 · 짐승 다리 · 찢어진 바지 자락 ·
//   으르렁대는 늑대 머리
//   p: legs · bob · sw(할퀴기 0~2) · howl · crouch · hurt
const WWK = 0.72;
const WFR = mat(ramp(0x5a5048), { tex: "fur", amp: 1.1, dir: 1.2 }), WFRF = mat(rampF(0x463e38), { tex: "fur", amp: 1, dir: 1.2 }), WFRL = mat(ramp(0x8a8278), { tex: "fur", amp: 0.9, dir: 1.2 }), TROU = mat(ramp(0x4a4050), { tex: "cloth", amp: 1.1 });
function werewolfFrame(p = {}) {
  const W = 140, H = 126, G = H - 1, S = sculpt(W, H, { k: WWK, ax: 56 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 6, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, hw = p.howl ?? 0, cx = 52;
  // 짐승 다리 (넓적다리 → 뒤로 굽은 발목 → 발)
  const lgf = (o, far, d) => { const hp = [cx + d, 78 + b], kn = [cx + d + 8 + o[0] * 0.3, 92 + b * 0.5], hk = [cx + d - 4 + o[0] * 0.6, 108], ft = [cx + d + 2 + o[0], G - 2 - o[1]], M0 = far ? WFRF : WFR; S.add(U(capF(hp, kn, 8, 6), capF(kn, hk, 5, 3.6), capF(hk, ft, 3.6, 3)), M0, { z: far ? -3 : 4, h: 5 }); S.add(ellR(ft[0] + 4, ft[1] - 1, 6, 2.4), M0, { z: far ? -2.9 : 4.1, h: 1.6 }); for (const e of [0, 2, 4]) S.add(capF([ft[0] + 7 + e * 0.6, ft[1] - 1], [ft[0] + 10 + e * 0.6, ft[1] + 0.4], 0.6, 0.3), DARK, { z: far ? -2.8 : 4.2, h: 0.4 }); S.add(polyF([[hp[0] - 7, hp[1] - 2], [hp[0] + 8, hp[1] - 2], [kn[0] + 4, kn[1] - 2], [kn[0] - 2, kn[1] + 4], [kn[0] - 6, kn[1]]]), TROU, { z: far ? -2.95 : 4.05, h: 4 }); };
  lgf(g.f, 1, -8);
  // 먼 팔 (길게 늘어짐 · 발톱)
  const shF = [cx - 8, 46 + b], hF = sw > 0 ? pol(shF, L(1.4, 0.2, Math.min(1, sw / 2)), 40) : [cx - 4, 86 + b];
  const elF = ik(shF, hF, 20, 20, 1);
  S.add(U(capF(shF, elF, 6, 5), capF(elF, hF, 5, 4)), WFRF, { z: -3, h: 4 });
  for (const d of [-0.5, 0, 0.5]) S.add(U(capF(hF, pol(hF, Math.atan2(hF[1] - elF[1], hF[0] - elF[0]) + d, 7), 1.2, 0.6), capF(pol(hF, Math.atan2(hF[1] - elF[1], hF[0] - elF[0]) + d, 7), pol(pol(hF, Math.atan2(hF[1] - elF[1], hF[0] - elF[0]) + d, 7), 1.57, 3), 0.6, 0.2)), DARK, { z: -2.9, h: 0.6 });
  // 굽은 몸통 (넓은 가슴 · 갈비 · 등 갈기)
  S.add(U(ellR(cx + 2, 56 + b, 20, 18, 0.3), ellR(cx - 2, 74 + b, 13, 10)), WFR, { z: 1, h: 15 });
  S.add(ellR(cx + 8, 62 + b, 10, 12), WFRL, { on: 1, lift: 0.4, h: 1 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx + 2, 60 + b + k * 4], [cx + 14, 62 + b + k * 4], 0.5), 0.7);
  for (let k = 0; k < 8; k++) { const x = cx - 16 + k * 4, y = 42 + b - Math.sin((k / 7) * Math.PI) * 6 + (k > 5 ? 2 : 0); S.add(polyF([[x - 2, y + 3], [x - 2.4, y - 5], [x + 2, y + 3]]), WFRF, { lift: 1, h: 1.4, prof: "sharp" }); }
  // 늑대 머리 (울부짖으면 위로)
  const hx = cx + 24, hy = 36 + b - hw * 6, ha = -hw * 0.9;
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  S.add(capF([cx + 14, 46 + b], [hx - 2, hy + 3], 9, 7.4), WFR, { z: 3, h: 7 });
  S.add(polyF([R(hx - 4, hy - 4), R(hx - 7, hy - 15), R(hx - 1, hy - 6)]), WFRF, { z: 3.2, h: 1.6 });
  S.add(ellR(...R(hx, hy), 8, 7), WFR, { z: 5, h: 6 });
  S.add(capF(R(hx + 4, hy - 0.4), R(hx + 17, hy + 2), 4.4, 3), WFR, { z: 6, h: 3.4 });
  const jw = 0.4 + hw * 0.8 + (sw > 1 ? 0.6 : 0);
  S.add(capF(R(hx + 4, hy + 4 + jw), R(hx + 15, hy + 5 + jw * 4), 2.8, 1.8), WFRF, { z: 5.8, h: 2 });
  S.add(polyF([R(hx + 5, hy + 2.4), R(hx + 17, hy + 2), R(hx + 15, hy + 4 + jw * 4), R(hx + 5, hy + 5)]), mat(ramp(0x6a2a2a)), { z: 5.9, h: 0.4 });
  for (const x of [hx + 8, hx + 12, hx + 15]) { S.add(polyF([R(x - 0.7, hy + 2.4), R(x + 0.7, hy + 2.4), R(x, hy + 4.4)]), BONE, { z: 6.1, h: 0.4 }); S.add(polyF([R(x - 0.6, hy + 4 + jw * 3.6), R(x + 0.6, hy + 4 + jw * 3.6), R(x, hy + 2.4 + jw * 3.6)]), BONE, { z: 6.1, h: 0.4 }); }
  S.add(ellR(...R(hx + 17, hy + 1), 1.6, 1.4), DARK, { lift: 0.8, h: 0.6 });
  S.add(polyF([R(hx, hy - 5), R(hx + 1, hy - 16), R(hx + 5, hy - 6)]), WFR, { z: 6.4, h: 1.8 });
  !p.hurt && S.decal(...R(hx + 4, hy - 2), 0xffd040).decal(...R(hx + 4.6, hy - 2.4), 0x101010);
  lgf(g.n, 0, 8);
  // 가까운 팔 (발톱 휘두르기)
  const sh = [cx + 12, 48 + b], hd = sw <= 1 ? lerp([cx + 18, 88 + b], pol(sh, -1.7, 30), sw) : lerp(pol(sh, -1.7, 30), pol(sh, 0.6, 38), Math.min(1, sw - 1));
  const el = ik(sh, hd, 20, 20, 1), ca = Math.atan2(hd[1] - el[1], hd[0] - el[0]);
  S.add(ellR(sh[0], sh[1], 9, 8), WFR, { z: 7, h: 6 });
  S.add(U(capF(sh, el, 7, 5.4), capF(el, hd, 5.4, 4.4)), WFR, { z: 7.2, h: 5 });
  S.add(ellR(hd[0], hd[1], 5, 4.4), WFR, { z: 7.4, h: 3 });
  for (const d of [-0.5, 0, 0.5]) { const c0 = pol(hd, ca + d, 7); S.add(U(capF(hd, c0, 1.4, 0.8), capF(c0, pol(c0, ca + d + 0.9, 4), 0.8, 0.2)), DARK, { z: 7.6, h: 0.6 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxWerewolf = {
  fw: Math.round(140 * WWK), fh: Math.round(126 * WWK), w: 32, h: 58,
  anims: { idle: [4, 4], move: [6, 10], wind: [3, 9, !1], atk: [4, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], howl: [4, 6, !1], leap: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, crouch: 0.2 };
    if (nm === "move") { const g = gait2(f, n, 8, 3); P = { legs: g, bob: g.bob * 2, crouch: 0.4 }; }
    if (nm === "wind") P = { sw: t, crouch: 0.4 * t };
    if (nm === "atk") P = { sw: [1.5, 2, 1.2, 2][f], crouch: 0.5 };
    if (nm === "rec") P = { sw: 2 * (1 - t), crouch: 0.4 };
    if (nm === "howl") P = { howl: [0.5, 1, 1, 0.6][f], crouch: -0.3 };
    if (nm === "leap") P = { crouch: [1, -0.4, 0][f], sw: [0, 1, 1.6][f], legs: { n: [6, 6], f: [-6, 4] } };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.6, howl: 0.3 };
    return werewolfFrame(P);
  },
};

// ════ 늪 하피 ════ 앙상하게 마른 잿빛 여인의 상반신 · 헝클어진 검은 머리 · 팔 대신 너덜한 검은 날개 · 새 다리와 갈고리 발톱 · 찢어지는 비명
//   p: flap · tilt · talon · scream · hurt
const HPK = 0.72;
const HSK = mat(ramp(0x8a8a84), { tex: "skin", amp: 0.8 }), HSKF = mat(rampF(0x6e6e68), { tex: "skin", amp: 0.7 }), HFE = mat(ramp(0x2e2a2e), { tex: "feather", amp: 1.1, dir: 0.4 }), HFEF = mat(rampF(0x221e22), { tex: "feather", amp: 1, dir: 0.4 }), HAIR = mat(ramp(0x1a1818), { tex: "fur", amp: 1.1, dir: 1.6 });
function harpyFrame(p = {}) {
  const W = 92, H = 80, S = sculpt(W, H, { k: HPK, ax: 44 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, tn = p.talon ?? 0, sc = p.scream ?? 0, cx = 42, cy = 36;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 1 - (back ? 3 : 0), cy - 8), a = -Math.PI / 2 - 0.55 + (1 - up) * 1.0;
    for (let k = 0; k < 7; k++) { if ((k * 5) % 7 === 3) continue; const ak = a - 0.12 * k, tip = pol(root, ak, 32 - k * 2.4); S.add(capF(pol(root, ak, 12), tip, 2.6, 0.6), back ? HFEF : HFE, { z: back ? -5 : 7, h: 1 }); }
    S.add(U(capF(root, pol(root, a + 0.2, 14), 2.6, 1.8), ellR(...pol(root, a + 0.2, 8), 9, 4, a)), back ? HFEF : HFE, { z: back ? -4.8 : 7.2, h: 2 });
    S.add(capF(pol(root, a + 0.2, 13), pol(pol(root, a + 0.2, 13), a - 0.6, 5), 0.6, 0.3), back ? HSKF : HSK, { z: back ? -4.7 : 7.3, h: 0.5 });
  };
  wing(1);
  // 깃 치마 (허리 아래) + 새 다리
  S.add(polyF([R(cx - 8, cy + 4), R(cx + 6, cy + 4), R(cx + 8, cy + 18), R(cx + 2, cy + 15), R(cx - 2, cy + 20), R(cx - 6, cy + 15), R(cx - 11, cy + 18)]), HFE, { z: 0, h: 3 });
  for (const d of [-3, 3]) { const hp = R(cx + d, cy + 14), ft = R(cx + d + 2 + tn * 7, cy + 24 + tn * 2); S.add(capF(hp, ft, 1.6, 1.2), mat(ramp(0x6a6458), { tex: "scale" }), { z: 1 + d * 0.1, h: 1 }); for (const e of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 1 + e - tn * 0.6, 4), 0.6, 0.2), DARK, { z: 1.2, h: 0.4 }); }
  // 마른 상반신 (갈비 · 쇄골)
  S.add(U(ellR(...R(cx, cy - 4), 7, 10), ellR(...R(cx, cy + 4), 5.4, 4)), HSK, { z: 1, h: 6 });
  for (let k = 0; k < 4; k++) S.carve(capF(R(cx - 4, cy - 6 + k * 2.6), R(cx + 5, cy - 5 + k * 2.6), 0.35), 0.6);
  S.carve(capF(R(cx - 4, cy - 12), R(cx + 5, cy - 11), 0.35), 0.6);
  // 머리 + 헝클어진 머리칼 + 비명
  const hd = R(cx + 3, cy - 20);
  for (let k = 0; k < 7; k++) S.add(capF([hd[0] - 2, hd[1] - 3], [hd[0] - 10 - k * 1.6 + Math.sin(k + fl) * 2, hd[1] + 4 + k * 2.2], 1.6, 0.6), HAIR, { z: 1.5, h: 1 });
  S.add(ellR(hd[0], hd[1], 5, 5.6), HSK, { z: 3, h: 4 });
  S.add(ellR(hd[0] - 1, hd[1] - 3, 5, 3.4), HAIR, { z: 3.2, h: 2 });
  S.add(ellR(hd[0] + 2.6, hd[1] - 0.6, 1.4, 1.4), DARK, { on: 1, lift: 0.1, h: 0.2 });
  S.add(ellR(hd[0] + 3, hd[1] + 3, 1.2 + sc * 0.6, 0.6 + sc * 1.6), DARK, { on: 1, lift: 0.1, h: 0.2 });
  S.add(capF([hd[0] + 4, hd[1] - 1], [hd[0] + 5.6, hd[1] + 1.6], 0.8, 0.5), HSK, { z: 3.3, h: 0.8 });
  !p.hurt && S.decal(hd[0] + 2.8, hd[1] - 0.6, 0xffe080);
  wing(0);
  const C = S.render({ rim: !0 });
  if (sc > 0.5) { const P = toPx(W, H, HPK, 44); for (let k = 0; k < 3; k++) for (let j = -2; j <= 2; j++) { const q = P(hd[0] + 8 + k * 4, hd[1] + 3 + j * (1.4 + k)); C.px(q[0], q[1], 0xd8e8ff); } }
  return fin(C, p);
}
export const pxHarpy = {
  fw: Math.round(92 * HPK), fh: Math.round(80 * HPK), w: 18, h: 24, flying: !0,
  anims: { idle: [4, 7], move: [4, 9], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], scream: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, talon: 0.5 * t };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.6, talon: 1, scream: 0.5 };
    if (nm === "rec") P = { flap: fl, talon: 1 - t };
    if (nm === "scream") P = { flap: [1, 0.6, 1, 0.6][f], scream: f > 0 ? 1 : 0.4, tilt: -0.2 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, scream: 1 };
    return harpyFrame(P);
  },
};

// ════ 해골 등롱 ════ 녹슨 사슬에 매달렸던 커다란 해골 · 정수리에 녹아 흘러내린 촛농과 꽂힌 초 · 눈구멍과 이 사이로 불빛 · 끊어진 사슬이 흔들린다
//   p: ph · flare · jaw · hurt
const SLK = 0.72;
function skullLampFrame(p = {}) {
  const W = 56, H = 72, S = sculpt(W, H, { k: SLK, ax: 28 });
  const ph = p.ph ?? 0, fl = p.flare ?? 0, jw = p.jaw ?? 0, cx = 28, cy = 40;
  // 끊어진 사슬
  for (let k = 0; k < 4; k++) { const q = [cx - 2 + Math.sin(ph + k * 0.6) * 1.4, cy - 30 + k * 4.4]; S.add(minus(ellR(q[0], q[1], 1.6, 2.4), ellR(q[0], q[1], 0.7, 1.4)), RUST, { z: -1, h: 0.8 }); }
  // 두개골 + 턱
  S.add(U(ellR(cx, cy - 4, 12, 11), ellR(cx + 5, cy + 5, 7, 5)), BONE, { z: 1, h: 9 });
  S.add(U(capF([cx - 2, cy + 8 + jw * 3], [cx + 10, cy + 9 + jw * 4], 3, 2.4)), BONEF, { z: 0.8, h: 2 });
  for (let k = 0; k < 5; k++) { S.add(capF([cx + 1 + k * 2, cy + 6], [cx + 1 + k * 2, cy + 8], 0.7), BONE, { z: 1.2, h: 0.6 }); S.add(capF([cx + 1 + k * 2, cy + 8.6 + jw * 3.4], [cx + 1 + k * 2, cy + 10 + jw * 3.6], 0.7), BONE, { z: 1.2, h: 0.6 }); }
  jw > 0.2 && S.add(ellR(cx + 5, cy + 8.4 + jw * 1.6, 4, 0.8 + jw * 1.6), FIRE, { z: 1.1, h: 0.4 });
  S.add(ellR(cx + 3, cy - 3, 3.4, 3.6), DARK, { z: 1.3, lift: 0.1, h: 0.3 }).add(ellR(cx + 10, cy - 2, 2.4, 3), DARK, { z: 1.3, lift: 0.1, h: 0.3 });
  S.add(ellR(cx + 3, cy - 2.6, 1.8 + fl, 2 + fl), FIRE, { z: 1.4, h: 0.5 }).add(ellR(cx + 10, cy - 1.6, 1.2 + fl * 0.6, 1.6 + fl * 0.6), FIRE, { z: 1.4, h: 0.5 });
  S.add(polyF([[cx + 8, cy + 1], [cx + 10, cy + 4], [cx + 7, cy + 4]]), DARK, { z: 1.3, lift: 0.1, h: 0.3 });
  for (const [a, b] of [[[cx - 6, cy - 12], [cx - 2, cy - 6]], [[cx - 9, cy - 2], [cx - 5, cy + 2]]]) S.carve(capF(a, b, 0.4), 0.8);
  // 촛농 + 초 + 불꽃
  S.add(U(ellR(cx - 2, cy - 14, 7, 2.6), capF([cx - 7, cy - 14], [cx - 8, cy - 6], 1.2, 0.8), capF([cx + 3, cy - 14], [cx + 4, cy - 9], 1.2, 0.8)), mat(ramp(0xe8e0c8), { spec: 0.4 }), { lift: 1, h: 1.4 });
  S.add(capF([cx - 2, cy - 14], [cx - 2, cy - 22], 2, 1.8), mat(ramp(0xe0d8c0), { spec: 0.3 }), { z: 2, h: 1.6 });
  const fh = 6 + fl * 5 + Math.sin(ph * 2) * 1;
  S.add(polyF([[cx - 4, cy - 22], [cx - 2 + Math.sin(ph) * 1, cy - 22 - fh], [cx, cy - 22]]), FIRE, { z: 2.2, h: 1 });
  S.add(ellR(cx - 2, cy - 24, 1.4, 2), mat(rampGlow(0xfff0c0)), { z: 2.3, h: 0.6 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxSkullLamp = {
  fw: Math.round(56 * SLK), fh: Math.round(72 * SLK), w: 18, h: 18, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [3, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, jaw: 0.1 };
    if (nm === "wind") P = { ph, flare: t, jaw: 0.3 * t };
    if (nm === "atk") P = { ph, flare: 1, jaw: [1, 0.8, 0.4][f] };
    if (nm === "rec") P = { ph, flare: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, jaw: 0.6 };
    return skullLampFrame(P);
  },
};

// ════ 안개 구렁이 ════ 안개가 뭉쳐 만든 반투명한 흰 뱀 · 희미한 비늘 무늬 · 창백하게 빛나는 눈 · 꼬리는 연기처럼 흩어진다
//   p: ph · coil · jaw · breath · hurt
const FSK = 0.72;
const FOG = mat(ramp(0xc8d0d8, { hi: 0.6 }), { tex: "glass", amp: 0.5, spec: 0.5 }), FOGF = mat(ramp(0x9aa4b0, { hi: 0.5 }), { tex: "glass", amp: 0.4 });
function fogSnakeFrame(p = {}) {
  const W = 108, H = 60, S = sculpt(W, H, { k: FSK, ax: 52 });
  const ph = p.ph ?? 0, co = p.coil ?? 0, jw = p.jaw ?? 0, cx = 52, cy = 30;
  const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([cx - 44 + i * 6.4 - co * Math.sin(t * Math.PI) * 10, cy + Math.sin(ph - i * 0.6) * (7 - t * 4) + co * Math.sin(t * T2) * 6]); }
  for (let i = 0; i < 14; i++) S.add(capF(pts[i], pts[i + 1], 1.2 + i * 0.46, 1.2 + (i + 1) * 0.46), i % 2 ? FOG : FOGF, { z: i * 0.04, h: 4 });
  for (let i = 3; i < 14; i += 2) S.add(ellR(pts[i][0], pts[i][1] - 1, 1.6 + i * 0.1, 1.2), mat(ramp(0xe8f0f8)), { on: 1, lift: 0.3, h: 0.2 });
  for (const i of [4, 7, 10]) S.add(polyF([[pts[i][0], pts[i][1] - 2], [pts[i][0] - 4, pts[i][1] - 7 - Math.sin(ph + i)], [pts[i][0] + 3, pts[i][1] - 3]]), FOGF, { z: -0.5, h: 0.4, prof: "flat" });
  // 머리
  const hd = pts[14], na = Math.atan2(hd[1] - pts[12][1], hd[0] - pts[12][0]);
  S.add(U(ellR(...pol(hd, na, 2), 8, 6, na), capF(pol(hd, na, 2), pol(hd, na, 12), 4.6, 3)), FOG, { z: 1, h: 4 });
  S.add(capF(pol(pol(hd, na, 2), na + 1.57, 2.4), pol(pol(pol(hd, na, 2), na + 1.57, 2.4), na + jw * 0.7, 8), 2, 1.2), FOGF, { z: 0.9, h: 1.6 });
  if (jw > 0.3) for (const d of [3, 6]) S.add(polyF([pol(pol(hd, na, d), na + 1.57, 1), pol(pol(hd, na, d + 1), na + 1.57, 1), pol(pol(hd, na, d + 0.5), na + 1.57, 3)]), BONE, { z: 1.2, h: 0.3 });
  !p.hurt && S.decal(...pol(pol(hd, na, 3), na - 1.57, 1.4), 0xe8f8ff).decal(...pol(pol(hd, na, 3.6), na - 1.57, 1.4), 0xa0d0ff);
  const C = haze(S.render({ rim: !0 }), 0.6, ph);
  if (p.breath) { const P = toPx(W, H, FSK, 52); for (let k = 0; k < 14; k++) { const q = P(...pol(pol(hd, na, 12 + k * 2.4), na + 1.57, Math.sin(k * 1.7) * (1 + k * 0.4))); C.px(q[0], q[1], k % 2 ? 0xe8f0f8 : 0xb0c8e0); } }
  return fin(C, p);
}
export const pxFogSnake = {
  fw: Math.round(108 * FSK), fh: Math.round(60 * FSK), w: 26, h: 14, flying: !0,
  anims: { idle: [6, 7], move: [6, 9], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], breath: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 1.4 };
    if (nm === "wind") P = { ph, coil: t, jaw: 0.5 * t };
    if (nm === "atk") P = { ph, coil: [0.4, -0.4, -0.2][f], jaw: [1.2, 0.4, 0][f] };
    if (nm === "rec") P = { ph, coil: 0 };
    if (nm === "breath") P = { ph, jaw: 1, breath: f > 0 ? 1 : 0 };
    if (nm === "hurt") P = { hurt: f === 0, ph, coil: 0.6, jaw: 0.8 };
    return fogSnakeFrame(P);
  },
};

// ════ [정예] 흡혈 대박쥐 ════ 고목 구멍에 사는 거대한 흡혈박쥐 · 손가락뼈가 비치는 가죽 날개막 · 털 난 몸 · 큰 귀와 코잎 · 드러난 송곳니
//   p: flap · tilt · jaw · screech · hurt
const BBK = 0.7;
const BAT = mat(ramp(0x4a3a3a), { tex: "fur", amp: 1, dir: 1.2 }), BATF = mat(rampF(0x3a2e2e), { tex: "fur", amp: 0.9, dir: 1.2 }), MEM = mat(ramp(0x5a4446), { tex: "skin", amp: 0.8, spec: 0.3 }), MEMF = mat(rampF(0x463436), { tex: "skin", amp: 0.7 });
function bigBatFrame(p = {}) {
  const W = 168, H = 108, S = sculpt(W, H, { k: BBK, ax: 80 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, jw = p.jaw ?? 0, cx = 80, cy = 54;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const d = back ? -1 : 1, root = R(cx + d * 6, cy - 6), up = fl * (back ? 0.8 : 1), el = R(cx + d * 22, cy - 18 - up * 16), wr = R(cx + d * 38, cy - 10 - up * 24);
    const fingers = [[-0.9, 30], [-0.4, 34], [0.1, 30], [0.6, 24]].map(([a, l]) => pol(wr, (d > 0 ? 0 : Math.PI) + d * a - up * 0.4 * d, l));
    S.add(polyF([root, el, wr, ...fingers, R(cx + d * 10, cy + 10)]), back ? MEMF : MEM, { z: back ? -6 : 8, h: 1.6, prof: "flat" });
    for (let k = 0; k < 4; k++) S.carve(capF(lerp(wr, fingers[k], 0.7), lerp(fingers[k], k < 3 ? fingers[k + 1] : R(cx + d * 10, cy + 10), 0.5), 0.6), 1, !1);
    S.add(U(capF(root, el, 3.4, 2.6), capF(el, wr, 2.6, 2)), back ? BATF : BAT, { z: back ? -5.8 : 8.2, h: 2.4 });
    for (const f0 of fingers) S.add(capF(wr, f0, 1.2, 0.6), back ? MEMF : mat(ramp(0x6a5254), { tex: "skin" }), { z: back ? -5.7 : 8.3, h: 0.8 });
    S.add(polyF([wr, pol(wr, -Math.PI / 2 - d * 0.3, 6), pol(wr, -Math.PI / 2 + d * 0.3, 2)]), BONE, { z: back ? -5.6 : 8.4, h: 0.6, prof: "sharp" });
  };
  wing(1);
  // 몸 (털) + 다리
  S.add(U(ellR(...R(cx, cy + 4), 12, 16)), BAT, { z: 2, h: 11 });
  for (const d of [-4, 4]) S.add(U(capF(R(cx + d, cy + 18), R(cx + d * 1.4, cy + 28), 2, 1.4)), BATF, { z: 2.2, h: 1.2 });
  // 머리 (큰 귀 · 코잎 · 송곳니)
  const hd = R(cx + 2, cy - 14);
  for (const [d, z] of [[-1, 1.8], [1, 3.2]]) S.add(polyF([[hd[0] - 3 + d * 3, hd[1] - 4], [hd[0] - 6 + d * 5, hd[1] - 20], [hd[0] + 2 + d * 4, hd[1] - 6]]), d < 0 ? MEMF : MEM, { z, h: 1.6 });
  S.add(ellR(hd[0], hd[1], 8, 7), BAT, { z: 3, h: 6 });
  S.add(U(ellR(hd[0] + 4, hd[1] + 1, 4, 3.4), polyF([[hd[0] + 3, hd[1] - 2], [hd[0] + 5, hd[1] - 7], [hd[0] + 7, hd[1] - 2]])), mat(ramp(0x8a6a68), { tex: "skin" }), { z: 3.4, h: 2 });
  S.add(ellR(hd[0] + 5, hd[1] + 5 + jw * 2, 3.6, 1 + jw * 2.4), mat(ramp(0x6a2a2a)), { z: 3.3, h: 0.4 });
  for (const d of [-1.6, 1.6]) S.add(polyF([[hd[0] + 5 + d - 0.7, hd[1] + 4], [hd[0] + 5 + d + 0.7, hd[1] + 4], [hd[0] + 5 + d, hd[1] + 8 + jw]]), BONE, { z: 3.5, h: 0.5 });
  !p.hurt && S.decal(hd[0] + 1, hd[1] - 2, 0xff4040).decal(hd[0] + 6, hd[1] - 1.6, 0xff4040);
  wing(0);
  const C = S.render({ rim: !0 });
  if (p.screech) { const P = toPx(W, H, BBK, 80); for (let r = 0; r < 3; r++) for (let k = 0; k < 10; k++) { const q = P(...pol([hd[0] + 6, hd[1] + 6], -0.8 + k * 0.16, 12 + r * 7)); C.px(q[0], q[1], 0xd8c8e8); } }
  return fin(C, p);
}
export const pxBigBat = {
  fw: Math.round(168 * BBK), fh: Math.round(108 * BBK), w: 40, h: 34, flying: !0,
  anims: { idle: [4, 8], move: [4, 10], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1], screech: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, jaw: 0.6 * t };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.55, jaw: 1 };
    if (nm === "rec") P = { flap: fl, jaw: 0.3 };
    if (nm === "screech") P = { flap: [1, 1, 0.8, 1][f], jaw: 1, screech: f > 0 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, jaw: 1 };
    return bigBatFrame(P);
  },
};

// ════ 익사자 ════ 물에 불은 창백한 청록 시신 · 해진 선원 옷 · 몸에 걸친 수초와 갈대 · 발목에 감긴 닻사슬을 끈다 · 물이 뚝뚝 · 물을 토한다
//   p: legs · bob · reach · vomit · hurt
const DRK = 0.72;
const DSK = mat(ramp(0x8aa09a), { tex: "skin", amp: 0.8, spec: 0.4 }), DSKF = mat(rampF(0x6e8480), { tex: "skin", amp: 0.7 }), SAIL = mat(ramp(0x5a6070), { tex: "cloth", amp: 1.1 }), WEED = mat(ramp(0x3a5a3a), { tex: "leaf", amp: 1 });
function drownedFrame(p = {}) {
  const W = 98, H = 92, G = H - 1, S = sculpt(W, H, { k: DRK, ax: 38 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, rc = p.reach ?? 0, cx = 36;
  // 닻사슬 (발목 → 뒤 바닥)
  for (let k = 0; k < 6; k++) { const q = [cx - 4 - k * 4.4, G - 3 + Math.sin(k) * 0.6]; S.add(minus(ellR(q[0], q[1], 2.4, 1.6), ellR(q[0], q[1], 1.2, 0.6)), RUST, { z: -2, h: 0.8 }); }
  // 다리 (불은 · 찢긴 바지)
  for (const [o, far, d] of [[g.f, 1, -4], [g.n, 0, 4]]) { const hp = [cx + d * 0.6, 60 + b], ft = [cx + d + o[0], G - 2 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 2, L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 4.4, 3.8), capF(kn, ft, 3.6, 3)), far ? DSKF : DSK, { z: far ? -2 : 3, h: 3 }); S.add(capF(hp, [kn[0], kn[1] + 3], 5, 4.4), far ? mat(rampF(0x4a505e), { tex: "cloth" }) : SAIL, { z: far ? -1.9 : 3.1, h: 3.4 }); S.add(ellR(ft[0] + 2, ft[1] - 1, 4, 2), far ? DSKF : DSK, { z: far ? -1.8 : 3.2, h: 1.4 }); }
  // 먼 팔
  const shF = [cx - 4, 36 + b], hF = pol(shF, L(1.3, 0.1, rc), 24);
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 3.6, 3.2), capF(lerp(shF, hF, 0.5), hF, 3.2, 2.6)), DSKF, { z: -2, h: 2.6 });
  // 몸 (불은 배) + 선원 옷 + 수초
  S.add(U(ellR(cx + 1, 46 + b, 13, 15), ellR(cx + 2, 54 + b, 12, 9)), DSK, { z: 1, h: 11 });
  S.add(polyF([[cx - 12, 34 + b], [cx + 12, 34 + b], [cx + 13, 58 + b], [cx + 6, 55 + b], [cx, 60 + b], [cx - 8, 55 + b], [cx - 13, 58 + b]]), SAIL, { z: 1.4, h: 9 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 10, 38 + b + k * 5], [cx + 10, 38 + b + k * 5], 0.9), mat(ramp(0xd8d8d0), { tex: "cloth" }), { on: 1, lift: 0.3, h: 0.3 });
  S.carve(capF([cx + 2, 42 + b], [cx + 6, 52 + b], 1.6), 1.2);
  for (const [x0, y0, l] of [[cx - 8, 34, 20], [cx + 6, 36, 16], [cx - 2, 33, 24]]) { let q = [x0, y0 + b]; for (let j = 0; j < 4; j++) { const n2 = [q[0] + Math.sin(j + x0) * 2, q[1] + l / 4]; S.add(capF(q, n2, 1.2, 0.8), WEED, { lift: 1.2, h: 0.6 }); q = n2; } }
  // 머리 (불은 얼굴 · 흐린 눈 · 벌어진 입) + 젖은 머리칼
  const hx = cx + 5, hy = 24 + b;
  S.add(capF([cx + 2, 32 + b], [hx, hy + 4], 4, 3.4), DSK, { z: 2, h: 3 });
  S.add(ellR(hx, hy, 7, 7.4), DSK, { z: 3, h: 6 });
  S.add(minus(ellR(hx - 2.4, hy - 3, 5.6, 4.6), (x, y) => x > hx + 1 && y > hy - 5), mat(ramp(0x3a4440), { tex: "fur", dir: 1.6 }), { z: 3.3, h: 1.4 });
  for (let k = 0; k < 5; k++) S.add(capF([hx - 6 + k * 1.4, hy - 4], [hx - 8 + k * 1.2, hy + 6 + (k % 3) * 2], 1, 0.5), mat(ramp(0x2a3030), { tex: "fur", dir: 1.6 }), { z: 3.4, h: 0.8 });
  S.add(capF([hx + 2, hy - 3], [hx + 6, hy - 2.6], 0.8), mat(ramp(0x6e8480)), { z: 3.5, h: 0.6 });
  S.add(ellR(hx + 3.6, hy - 0.6, 1.8, 1.6), mat(ramp(0xd8e0d8)), { z: 3.6, lift: 0.2, h: 0.4 });
  S.add(ellR(hx + 4, hy + 4 + p.vomit * 1, 2, 1.4 + (p.vomit ?? 0) * 1.4), DARK, { z: 3.6, lift: 0.1, h: 0.2 });
  !p.hurt && S.decal(hx + 3.8, hy - 0.6, 0x90ffb0);
  // 가까운 팔
  const sh = [cx + 6, 37 + b], hN = pol(sh, L(1.2, 0.05, rc), 25);
  S.add(U(capF(sh, lerp(sh, hN, 0.5), 3.8, 3.4), capF(lerp(sh, hN, 0.5), hN, 3.4, 2.8)), DSK, { z: 6, h: 2.8 });
  S.add(ellR(sh[0], sh[1], 4.4, 4), SAIL, { z: 6.1, h: 2.4 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(hN, pol(hN, L(1.2, 0.05, rc) + d, 5), 0.8, 0.5), DSK, { z: 6.2, h: 0.6 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, DRK, 38);
  for (let k = 0; k < 5; k++) { const q = P(cx - 8 + k * 5, 62 + b + ((k * 9 + (p.ph ?? 0) * 6) % 24)); C.px(q[0], q[1], 0x9ac0d0); }
  if (p.vomit > 0.5) for (let k = 0; k < 10; k++) { const q = P(hx + 7 + k * 2.4, hy + 5 + k * 1.2 + Math.sin(k) * 1.4); C.px(q[0], q[1], k % 2 ? 0x5a8a7a : 0x3a6a5a); C.px(q[0], q[1] + 1, 0x3a6a5a); }
  return fin(C, p);
}
export const pxDrowned = {
  fw: Math.round(98 * DRK), fh: Math.round(92 * DRK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], vomit: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6, reach: 0.2, ph, vomit: 0 };
    if (nm === "move") { const g = gait2(f, n, 4, 1.4); P = { legs: g, bob: g.bob + 1, reach: 0.4, ph, vomit: 0 }; }
    if (nm === "wind") P = { reach: 0.3 + 0.7 * t, ph, vomit: 0 };
    if (nm === "atk") P = { reach: 1, bob: [1.5, 2, 2][f], ph, vomit: 0 };
    if (nm === "rec") P = { reach: 1 - t * 0.8, ph, vomit: 0 };
    if (nm === "vomit") P = { vomit: [0.3, 1, 1, 0.4][f], bob: [0, 1, 1, 0][f], ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1.5, ph, vomit: 0.3 };
    return drownedFrame(P);
  },
};

// ════ 늪 오소리 ════ 땅딸막하고 단단한 몸 · 흰 줄 두 개가 지나는 검은 얼굴 · 회색 거친 털 · 굵은 앞발톱 · 성나면 마구 할퀸다
//   p: legs · bob · swipe · rear · hurt
const BDK = 0.72;
const BDG = mat(ramp(0x7a7470), { tex: "fur", amp: 1.1, dir: 0.3 }), BDGF = mat(rampF(0x625c58), { tex: "fur", amp: 1, dir: 0.3 }), BDGD = mat(ramp(0x2a2624), { tex: "fur", amp: 0.9 }), BDGW = mat(ramp(0xe8e4dc), { tex: "fur", amp: 0.7 });
function badgerFrame(p = {}) {
  const W = 86, H = 52, G = H - 1, S = sculpt(W, H, { k: BDK, ax: 40 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, swp = p.swipe ?? 0, rr = p.rear ?? 0, cx = 38;
  const lgf = (sh, o, far, front, sw) => { const ft = sw != null ? pol(sh, sw, 12) : [sh[0] + o[0] + (front ? 3 : -1), G - 1.5 - o[1]], M0 = far ? BDGF : BDG; S.add(U(capF(sh, ft, far ? 3.6 : 4.2, 3)), BDGD, { z: far ? -3 : 5, h: 3 }); S.add(ellR(ft[0] + 1.4, ft[1], 3, 1.8), BDGD, { z: far ? -2.9 : 5.1, h: 1.2 }); for (const e of [-0.4, 0, 0.4]) S.add(capF([ft[0] + 2.4, ft[1]], pol([ft[0] + 2.4, ft[1]], 0.6 + e + (sw ?? 0), 3.4), 0.5, 0.2), BONE, { z: far ? -2.8 : 5.2, h: 0.3 }); };
  lgf([cx + 12, 36 + b - rr * 6], lg.ff, 1, 1, swp > 0 ? -0.6 + swp * 1.2 : null), lgf([cx - 14, 36 + b], lg.bf, 1, 0);
  S.add(U(ellR(cx - 2, 32 + b - rr * 3, 22, 10, -rr * 0.3)), BDG, { z: 1, h: 9 });
  for (let k = 0; k < 10; k++) S.carve(capF([cx - 20 + k * 4.2, 24 + b], [cx - 21 + k * 4.2, 30 + b], 0.4), 0.5);
  S.add(ellR(cx - 2, 39 + b - rr * 3, 18, 3), BDGD, { on: 1, h: 0.4 });
  // 머리 (흰 두 줄 · 검은 바탕)
  const hx = cx + 20, hy = 30 + b - rr * 8;
  S.add(U(ellR(hx, hy, 7, 6), capF([hx + 3, hy + 1], [hx + 11, hy + 3], 3.6, 1.8)), BDGD, { z: 3, h: 5 });
  for (const d of [-2.2, 2.2]) S.add(capF([hx - 6, hy - 2 + d], [hx + 10, hy + 2.6 + d * 0.3], 1.2, 0.7), BDGW, { on: 1, lift: 0.3, h: 0.4 });
  S.add(ellR(hx - 4, hy - 5, 2, 1.6), BDGW, { z: 3.2, h: 1 });
  S.add(ellR(hx + 11, hy + 2.6, 1.2, 1), DARK, { lift: 0.6, h: 0.4 });
  !p.hurt && S.decal(hx + 3, hy + 0.2, 0x101010).decal(hx + 3.4, hy - 0.2, 0xff6040);
  lgf([cx + 14, 37 + b - rr * 6], lg.fn, 0, 1, swp > 0 ? -1 + swp * 1.6 : null), lgf([cx - 12, 37 + b], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxBadger = {
  fw: Math.round(86 * BDK), fh: Math.round(52 * BDK), w: 26, h: 16,
  anims: { idle: [4, 5], move: [6, 11], wind: [3, 9, !1], atk: [4, 18, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { legs: gait4(f, n, 5, 2.4), bob: Math.cos(ph * 2) * 0.6 };
    if (nm === "wind") P = { rear: t };
    if (nm === "atk") P = { rear: 0.8, swipe: [0, 1, 0.2, 1][f] };
    if (nm === "rec") P = { rear: 0.8 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.4 };
    return badgerFrame(P);
  },
};

// ════ 늪지 어인 ════ 구부정한 물고기·개구리 인간 · 넓게 찢어진 입과 바늘 이빨 · 툭 튀어나온 눈 · 아가미 · 등지느러미 · 물갈퀴 손 ·
//   뼈 작살과 젖은 그물
//   p: legs · bob · thrust · net · hurt
const FFK = 0.72;
const FSH = mat(ramp(0x5a7468), { tex: "scale", amp: 0.9, spec: 0.5 }), FSHF = mat(rampF(0x465c52), { tex: "scale", amp: 0.8 }), FSHB = mat(ramp(0xb0b8a0), { tex: "skin", amp: 0.6 }), FIN = mat(ramp(0x7a6a8a, { hi: 0.5 }), { tex: "glass", amp: 0.4 });
function fishfolkFrame(p = {}) {
  const W = 108, H = 92, G = H - 1, S = sculpt(W, H, { k: FFK, ax: 40 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, th = p.thrust ?? 0, nt = p.net ?? 0, cx = 38;
  // 다리 (굽은 개구리 다리 · 물갈퀴 발)
  for (const [o, far, d] of [[g.f, 1, -5], [g.n, 0, 5]]) { const hp = [cx + d * 0.6, 62 + b], kn = [cx + d + 8 + o[0] * 0.3, 72 + b * 0.5], ft = [cx + d + o[0], G - 2 - o[1]]; S.add(U(capF(hp, kn, 5, 4), capF(kn, ft, 4, 3)), far ? FSHF : FSH, { z: far ? -2 : 3, h: 3.4 }); S.add(polyF([[ft[0] - 2, ft[1] - 2], [ft[0] + 9, ft[1] - 1], [ft[0] + 10, ft[1] + 1], [ft[0] - 2, ft[1] + 1]]), far ? FSHF : FSH, { z: far ? -1.9 : 3.1, h: 1 }); }
  // 먼 팔 (그물)
  const shF = [cx - 4, 40 + b], hF = nt > 0 ? pol(shF, L(1.2, -0.4, nt), 22) : [cx - 6, 62 + b];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 3.4, 3), capF(lerp(shF, hF, 0.5), hF, 3, 2.4)), FSHF, { z: -2, h: 2.4 });
  const nc = nt > 0.5 ? [hF[0] + 16, hF[1] - 4] : [hF[0] - 2, hF[1] + 10];
  S.add(minus(ellR(nc[0], nc[1], 7 + nt * 5, 6 + nt * 4), ellR(nc[0], nc[1], 5 + nt * 5, 4 + nt * 4)), ROPE, { z: -1.8, h: 0.6 });
  for (let k = 0; k < 4; k++) { S.add(capF([nc[0] - 6 - nt * 4, nc[1] - 4 + k * 2.6], [nc[0] + 6 + nt * 4, nc[1] - 4 + k * 2.6], 0.3), ROPE, { z: -1.7, h: 0.3 }); S.add(capF([nc[0] - 5 + k * 3.4, nc[1] - 5 - nt * 3], [nc[0] - 5 + k * 3.4, nc[1] + 5 + nt * 3], 0.3), ROPE, { z: -1.7, h: 0.3 }); }
  // 구부정한 몸 + 배 + 등지느러미
  S.add(polyF([[cx - 6, 34 + b], [cx - 14, 30 + b], [cx - 18, 40 + b], [cx - 14, 52 + b], [cx - 8, 50 + b]]), FIN, { z: 0, h: 1, prof: "flat" });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 8, 36 + b + k * 4], [cx - 16 + k, 32 + b + k * 5.4], 0.4), FSHF, { z: 0.1, h: 0.3 });
  S.add(U(ellR(cx + 1, 48 + b, 12, 14, 0.25), ellR(cx, 60 + b, 9, 6)), FSH, { z: 1, h: 10 });
  S.add(ellR(cx + 6, 52 + b, 6, 9), FSHB, { on: 1, lift: 0.3, h: 0.6 });
  S.add(polyF([[cx - 8, 58 + b], [cx + 8, 58 + b], [cx + 9, 66 + b], [cx + 2, 63 + b], [cx - 3, 67 + b], [cx - 9, 64 + b]]), mat(ramp(0x5a4a3a), { tex: "cloth", amp: 1.2 }), { z: 1.5, h: 3 });
  // 머리 (넓은 입 · 튀어나온 눈 · 아가미)
  const hx = cx + 12, hy = 32 + b;
  S.add(U(ellR(hx, hy, 9, 7.4), capF([hx + 2, hy + 2], [hx + 12, hy + 3], 5, 3.4)), FSH, { z: 3, h: 6 });
  S.add(capF([hx + 1, hy + 5], [hx + 13, hy + 4.4], 0.8), DARK, { on: 1, lift: 0.2, h: 0.2 });
  for (let k = 0; k < 5; k++) S.add(polyF([[hx + 3 + k * 2.2, hy + 4.4], [hx + 4.2 + k * 2.2, hy + 4.4], [hx + 3.6 + k * 2.2, hy + 6.4]]), BONE, { z: 3.4, h: 0.3 });
  for (let k = 0; k < 3; k++) S.carve(capF([hx - 6 + k * 1.8, hy + 1], [hx - 5 + k * 1.8, hy + 6], 0.4), 0.8);
  S.add(ellR(hx + 3, hy - 6, 3.4, 3.2), FSH, { z: 3.6, h: 2.6 });
  S.add(ellR(hx + 3.6, hy - 6, 2.4, 2.4), mat(ramp(0xd8c040), { spec: 0.8 }), { z: 3.8, h: 1.4 });
  !p.hurt && S.decal(hx + 4, hy - 6, 0x101010);
  // 가까운 팔 + 뼈 작살
  const sh = [cx + 8, 40 + b], hN = pol(sh, L(0.9, 0.05, th), 16 + th * 6), sa = L(-0.4, 0, th);
  S.add(U(capF(sh, lerp(sh, hN, 0.5), 3.4, 3), capF(lerp(sh, hN, 0.5), hN, 3, 2.4)), FSH, { z: 6, h: 2.4 });
  const s0 = pol(hN, sa, -22), s1 = pol(hN, sa, 26);
  S.add(capF(s0, s1, 1, 0.9), mat(ramp(0x8a7a5a), { tex: "wood" }), { z: 6.4, h: 0.9 });
  S.add(U(polyF([pol(s1, sa + 1.57, 1.8), pol(s1, sa, 8), pol(s1, sa - 1.57, 1.8)]), polyF([pol(pol(s1, sa, 2), sa - 1.57, 1), pol(pol(s1, sa, -3), sa - 1.57, 4), pol(s1, sa - 1.57, 1)])), BONE, { z: 6.5, h: 1, prof: "sharp" });
  S.add(polyF([[hN[0] - 2, hN[1] - 2], [hN[0] + 3, hN[1] - 3], [hN[0] + 3, hN[1] + 2]]), FIN, { z: 6.6, h: 0.4 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxFishfolk = {
  fw: Math.round(108 * FFK), fh: Math.round(92 * FFK), w: 16, h: 30,
  anims: { idle: [4, 5], move: [6, 9], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], net: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5 };
    if (nm === "move") { const g = gait2(f, n, 5, 2.4); P = { legs: g, bob: g.bob + Math.sin(ph * 2) }; }
    if (nm === "wind") P = { thrust: -0.4 * t };
    if (nm === "atk") P = { thrust: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { thrust: 1 - t };
    if (nm === "net") P = { net: [0.3, 1, 1, 0.4][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return fishfolkFrame(P);
  },
};

// ════ [정예] 늪 메기 왕 ════ 진흙 바닥을 기는 거대 메기 · 넓적한 머리와 작은 눈 · 길게 늘어진 수염 넷 · 쩍 벌어지는 큰 입 · 얼룩진 미끈한 가죽 ·
//   가슴지느러미로 몸을 끈다
//   p: ph · gape · lunge · lash · bur · hurt
const CFK = 0.72;
const CAF = mat(ramp(0x4a4a3a), { tex: "skin", amp: 0.9, spec: 0.6 }), CAFF = mat(rampF(0x3a3a2e), { tex: "skin", amp: 0.8 }), CAFB = mat(ramp(0xa8a088), { tex: "skin", amp: 0.6 });
function catfishFrame(p = {}) {
  const W = 184, H = 92, G = H - 1, S = sculpt(W, H, { k: CFK, ax: 82 });
  const ph = p.ph ?? 0, gp = p.gape ?? 0, lu = p.lunge ?? 0, ls = p.lash ?? 0, bur = p.bur ?? 0, cx = 76 + lu * 8, by = G - 20 + bur * 10;
  // 꼬리 + 몸 (머리 쪽이 크다)
  S.add(polyF([[cx - 56, by - 2], [cx - 80, by - 14 + Math.sin(ph) * 4], [cx - 74, by + Math.sin(ph) * 2], [cx - 82, by + 12 + Math.sin(ph) * 4], [cx - 56, by + 8]]), CAFF, { z: 0, h: 2, prof: "flat" });
  S.add(U(ellR(cx - 30, by + 2, 30, 11), ellR(cx + 4, by, 28, 17)), CAF, { z: 1, h: 13 });
  S.add(ellR(cx - 10, by + 12, 40, 4), CAFB, { on: 1, h: 0.6 });
  for (const [x, y, r] of [[cx - 40, by - 4, 3], [cx - 24, by - 8, 3.4], [cx - 8, by - 10, 4], [cx + 8, by - 6, 3], [cx - 30, by + 4, 2.4], [cx - 14, by - 2, 2.6]]) S.add(ellR(x, y, r, r * 0.7), CAFF, { on: 1, lift: 0.2, h: 0.3 });
  S.add(polyF([[cx - 30, by - 9], [cx - 22, by - 22 + Math.sin(ph) * 2], [cx - 14, by - 13]]), CAFF, { z: 0.8, h: 1.4, prof: "flat" });
  // 가슴지느러미 (몸을 끈다)
  S.add(polyF([[cx + 2, by + 8], [cx - 8 + Math.sin(ph * 2) * 4, by + 20], [cx + 6 + Math.sin(ph * 2) * 4, by + 19], [cx + 10, by + 10]]), CAFF, { z: 4, h: 1, prof: "flat" });
  // 넓적한 머리 + 큰 입 (위턱 들림)
  const hx = cx + 28, hy = by - 2;
  if (gp > 0.15) { S.add(polyF([[hx - 2, hy - 2 - gp * 10], [hx + 22, hy - 4 - gp * 14], [hx + 24, hy + 8 + gp * 6], [hx - 2, hy + 8]]), mat(ramp(0x6a3a3a)), { z: 2.5, h: 1 }); for (let k = 0; k < 8; k++) S.add(ellR(hx + 2 + k * 2.8, hy + 7 + gp * 5 - k * 0.2, 0.7, 0.7), BONE, { z: 2.6, h: 0.3 }); }
  S.add(U(capF([hx - 6, hy + 6], [hx + 22, hy + 8 + gp * 6], 6, 4)), CAFB, { z: 3, h: 4 });
  S.add(U(ellR(hx, hy - 2 - gp * 4, 14, 9), capF([hx + 4, hy - 2 - gp * 6], [hx + 24, hy - 1 - gp * 12], 9, 6)), CAF, { z: 3.4, h: 8 });
  // 수염 넷 (늘어짐 · 휘두르면 앞으로)
  for (const [d, l, z] of [[-1, 40, 2], [1, 44, 6], [-0.4, 22, 2.5], [0.4, 26, 5.6]]) { const r0 = [hx + 22, hy - 1 - gp * 10 + (d > 0 ? 2 : 0)]; let q = r0; for (let j = 0; j < 6; j++) { const a = (0.35 + j * 0.2 + Math.abs(d) * 0.25) * (1 - ls) + ls * (-0.1 + j * 0.05) + Math.sin(ph + j * 0.8 + d) * 0.15, n2 = pol(q, a, l / 6); S.add(capF(q, n2, 1.4 - j * 0.18, 1.2 - j * 0.18), CAFF, { z, h: 0.6 }); q = n2; } }
  !p.hurt && S.decal(hx + 8, hy - 7 - gp * 6, 0xd8c060).decal(hx + 8.4, hy - 7 - gp * 6, 0x101010);
  if (bur > 0.05) { S.add(U(ellR(cx - 10, G - 1, 70 * Math.min(1, bur * 1.3), 2 + bur * 7)), MUD, { z: 8, h: 4 }); for (let k = 0; k < 9; k++) S.carve(capF([cx - 70 + k * 16, G - 3 - bur * 5], [cx - 64 + k * 16, G - 2], 0.5), 0.7); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxCatfish = {
  fw: Math.round(184 * CFK), fh: Math.round(92 * CFK), w: 66, h: 30,
  anims: { idle: [6, 4], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], lash: [4, 12, !1], hide: [3, 6, !1], rise: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, gape: 0.05 };
    if (nm === "move") P = { ph: ph * 1.6, gape: 0.1 };
    if (nm === "wind") P = { ph, gape: t * 1.1, lunge: -0.4 * t };
    if (nm === "atk") P = { ph, gape: [1.2, 0.2, 0][f], lunge: [1, 1.4, 1][f] };
    if (nm === "rec") P = { ph, lunge: 1 - t };
    if (nm === "lash") P = { ph: ph * 2, lash: [0.3, 1, 1, 0.3][f] };
    if (nm === "hide") P = { ph, bur: t };
    if (nm === "rise") P = { ph, bur: 1 - t, gape: t };
    if (nm === "hurt") P = { hurt: f === 0, ph, gape: 0.6, lunge: -0.3 };
    return catfishFrame(P);
  },
};
