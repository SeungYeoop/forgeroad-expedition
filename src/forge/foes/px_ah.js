// 앰버홀드 몬스터 12종 (조각 도구, 오른쪽을 본다) — 해질녘 메사 위 호박빛 기사 성채
//   아래 섬 줄: 성채 경비견 · 미늘창병 · 수지 덩어리 · [정예] 텅 빈 갑주 거인
//   가운데 줄: 석궁병 · 호박 왕잠자리 · 깃발 기수 · [정예] 기마 창기사
//   위 줄: 태엽 매 · 날개 투구 · 망령 전령 · [정예] 전투 그리폰
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const STEEL = mat(ramp(0x8a8c90), { tex: "metal", amp: 0.9, spec: 0.55 }), STEELF = mat(rampF(0x6c6e72), { tex: "metal", amp: 0.8, spec: 0.3 });
const GOLD = mat(ramp(0xc8a048), { tex: "metal", amp: 0.7, spec: 0.6 }), GOLDF = mat(rampF(0xa08038), { tex: "metal", amp: 0.6 });
const MAIL = mat(ramp(0x76787c), { tex: "scale", amp: 1.2, spec: 0.4 }), MAILF = mat(rampF(0x5e6064), { tex: "scale", amp: 1 });
const RED = mat(ramp(0x9a2a24), { tex: "cloth", amp: 0.9 }), REDF = mat(rampF(0x7a2220), { tex: "cloth", amp: 0.8 });
const GAMB = mat(ramp(0xb89a70), { tex: "cloth", amp: 1 }), GAMBF = mat(rampF(0x967a58), { tex: "cloth", amp: 0.9 });
const LEATH = mat(ramp(0x6a4a30), { tex: "leather", amp: 0.9 }), LEATHF = mat(rampF(0x52382a), { tex: "leather", amp: 0.8 });
const WOOD = mat(ramp(0x7a5a3a), { tex: "wood", amp: 0.9 }), WOODF = mat(rampF(0x5e442c), { tex: "wood", amp: 0.8 });
const AMB = mat(ramp(0xe8901c, { hi: 0.6 }), { tex: "glass", amp: 0.3, spec: 0.9 }), AMBD = mat(ramp(0x7a3a10), { tex: "glass", amp: 0.5 }), AMBL = mat(ramp(0xf4c060), { tex: "glass", amp: 0.4 });
const AMBG = mat(rampGlow(0xffa840)), AMBY = mat(rampGlow(0xffe090));
const SKIN = mat(ramp(0xb88a6a), { tex: "skin", amp: 0.7 }), BEARD = mat(ramp(0x4a3426), { tex: "fur", amp: 0.9, dir: 1.57 }), DARK = mat(ramp(0x1e1614));
const BONE = mat(ramp(0xd8ccb0), { spec: 0.3 }), BRASS = mat(ramp(0xb08a40), { tex: "metal", amp: 0.8, spec: 0.6 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];

// 황금 태양 문장 (원판 + 빛살 여덟)
function sun(S, c, r, o = {}) {
  S.add(ellR(c[0], c[1], r * 0.48, r * 0.48), o.M ?? GOLD, { on: o.on ?? 1, lift: 0.5, h: 0.6, z: o.z });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * T2 + 0.2; S.add(polyF([pol(c, a + 0.28, r * 0.42), pol(c, a, r), pol(c, a - 0.28, r * 0.42)]), o.M ?? GOLD, { on: o.on ?? 1, lift: 0.4, h: 0.4, z: o.z }); }
}
// 갑옷 다리: 넓적다리(사슬) · 판금 정강이 · 무릎 컵 · 철 신발 — 무릎 위치를 돌려준다
function leg(S, hp, ft, far, o = {}) {
  const w = o.w ?? 1, m = lerp(hp, ft, 0.5), kn = [m[0] + (o.bend ?? 2) * w, m[1]];
  S.add(capF(hp, kn, 4.6 * w, 4 * w), far ? (o.thighF ?? MAILF) : (o.thigh ?? MAIL), { z: far ? -3 : 3, h: 4 * w });
  S.add(capF(kn, [ft[0], ft[1] - 3 * w], 3.9 * w, 3.4 * w), far ? STEELF : STEEL, { z: far ? -2.5 : 3.5, h: 3.6 * w });
  S.add(ellR(kn[0] + w, kn[1], 3.4 * w, 3 * w), far ? STEELF : STEEL, { z: far ? -2 : 4, h: 2.6 * w });
  S.add(U(ellR(ft[0] + 2.6 * w, ft[1] - 1.8 * w, 5.6 * w, 2.4 * w), capF([ft[0] - 2 * w, ft[1] - 3.6 * w], [ft[0] + w, ft[1] - 3 * w], 3 * w)), far ? (o.bootF ?? STEELF) : (o.boot ?? STEEL), { z: far ? -2 : 4.5, h: 2.4 * w });
  return kn;
}
// 병사 몸 (다리 · 갑옷 몸통 · 겉옷 · 허리띠 · 머리와 투구). Y = 가슴 높이. 어깨 두 곳과 머리 위치를 돌려준다
function soldier(S, o) {
  const { cx, Y, G } = o, b = o.b ?? 0, g = o.legs ?? { n: [0, 0], f: [0, 0] }, hipY = Y + 20 + b;
  leg(S, [cx - 3, hipY], [cx - 4 + g.f[0], G - 1 - g.f[1]], 1, o.legO);
  o.back?.();
  const body = o.body ?? MAIL;
  S.add(U(ellR(cx, Y + 6 + b, 11, 12), polyF([[cx - 10, Y + 6 + b], [cx + 10, Y + 6 + b], [cx + 9, Y + 22 + b], [cx - 9, Y + 22 + b]])), body, { z: 1, h: 9 });
  if (body === GAMB) for (let y = Y - 2; y < Y + 22; y += 4) S.carve(capF([cx - 9, y + b], [cx + 9, y + 0.6 + b], 0.4), 0.6);
  if (o.tabard !== !1) {
    S.add(polyF([[cx - 7, Y - 3 + b], [cx + 9, Y - 3 + b], [cx + 10, Y + 27 + b], [cx + 4, Y + 25 + b], [cx - 2, Y + 28 + b], [cx - 8, Y + 25 + b]]), o.tabard ?? RED, { z: 2, h: 8 });
    for (const dx of [-4, 1, 6]) S.carve(capF([cx + dx, Y + 14 + b], [cx + dx + 0.6, Y + 26 + b], 0.4), 0.6);
    sun(S, [cx + 2, Y + 6 + b], 4);
  }
  S.add(capF([cx - 10, Y + 17 + b], [cx + 10, Y + 17 + b], 1.6), LEATH, { z: 3, h: 1.6 });
  S.add(ellR(cx + 6, Y + 17 + b, 1.6, 1.6), GOLD, { z: 3.5, h: 1 });
  leg(S, [cx + 3, hipY], [cx + 4 + g.n[0], G - 1 - g.n[1]], 0, o.legO);
  // 머리 (사슬 두건 + 투구)
  const hx = cx + 3, hy = Y - 9 + b;
  S.add(U(ellR(hx, hy + 1.6, 6.4, 6.8), polyF([[hx - 7, hy + 4], [hx + 6, hy + 4], [hx + 9, hy + 11], [hx - 9, hy + 11]])), MAIL, { z: 3, h: 5 });
  if (o.helm === "kettle") {
    S.add(ellR(hx + 3, hy + 1.6, 3.8, 4.4), SKIN, { z: 4, h: 3 });
    S.add(ellR(hx + 3.6, hy + 5, 3, 1.8), BEARD, { z: 4.2, h: 1.2 });
    !o.hurt && S.decal(hx + 5, hy + 0.6, 0x1a1210).decal(hx + 2.4, hy + 0.6, 0x1a1210);
    S.add(minus(ellR(hx, hy - 0.6, 7, 7), (x, y) => y > hy - 1), STEEL, { z: 5, h: 5 });
    S.add(capF([hx - 10, hy - 1], [hx + 11, hy - 0.4], 1.5, 1.3), STEEL, { z: 5.5, h: 1.4 });
    S.add(capF([hx, hy - 7.4], [hx, hy - 1.4], 0.6), STEELF, { on: 1, lift: 0.4, h: 0.4 });
  } else if (o.helm === "sallet") {
    S.add(U(minus(ellR(hx, hy, 7.4, 7.6), (x, y) => y > hy + 3), polyF([[hx - 5, hy - 1], [hx - 14, hy + 6], [hx - 12, hy + 7.4], [hx - 4, hy + 3]])), STEEL, { z: 5, h: 5 });
    S.carve(capF([hx + 1, hy - 0.6], [hx + 8, hy - 0.4], 0.7), 2, !1);
    S.add(ellR(hx + 3.6, hy + 4.6, 4.6, 3.4), STEELF, { z: 5.5, h: 3 });
    !o.hurt && S.decal(hx + 5, hy - 0.6, 0xffd080);
  } else {
    // 돼지주둥이 바시넷 (뾰족한 정수리 · 앞으로 튀어나온 면갑 · 숨구멍)
    S.add(polyF([[hx - 7, hy + 3], [hx - 6, hy - 5], [hx - 1, hy - 10], [hx + 5, hy - 5], [hx + 7, hy + 3]]), STEEL, { z: 5, h: 5 });
    S.add(polyF([[hx + 1, hy - 4], [hx + 12, hy + 1], [hx + 2, hy + 6]]), STEEL, { z: 6, h: 3, prof: "sharp" });
    S.carve(capF([hx + 2, hy - 1.2], [hx + 8, hy - 0.2], 0.6), 2, !1);
    for (const [x, y] of [[hx + 6, hy + 2], [hx + 8, hy + 2.4], [hx + 7, hy + 3.6]]) S.decal(x, y, 0x1a1414);
    !o.hurt && S.decal(hx + 5, hy - 0.8, 0xffd080);
    S.add(polyF([[hx - 8, hy + 3], [hx + 6, hy + 4], [hx + 9, hy + 10], [hx - 10, hy + 10]]), MAIL, { z: 4.6, h: 3 });
  }
  return { S0: [cx + 5, Y - 1 + b], S1: [cx - 5, Y - 1 + b], hx, hy };
}
// 팔 (어깨 → 팔꿈치 → 손), 판금 또는 천 소매 + 장갑
function arm(S, sh, hd, far, o = {}) {
  const el = ik(sh, hd, o.l ?? 9, o.l ?? 9, o.bend ?? 1), M = far ? (o.MF ?? STEELF) : (o.M ?? STEEL), z = o.z ?? (far ? -2 : 8);
  S.add(U(capF(sh, el, 3.4, 3), capF(el, hd, 3, 2.6)), M, { z, h: 2.6 });
  S.add(ellR(el[0], el[1], 2.6, 2.4), far ? STEELF : STEEL, { z: z + 0.1, h: 1.8 });
  S.add(ellR(hd[0], hd[1], 2.8, 2.5), far ? LEATHF : LEATH, { z: z + 0.2, h: 2 });
  return el;
}

// ════ 성채 경비견 ════ 황갈색 짧은 털의 육중한 마스티프 · 검은 주둥이와 늘어진 볼살 · 가죽 마갑(붉은 테 · 쇠 징) ·
//   가시 목걸이 · 이마의 쇠 판
//   p: legs · bob · crouch · leap · jaw · head · hurt
const MFK = 0.72;
const MFUR = mat(ramp(0x9a7448), { tex: "fur", amp: 0.9, dir: 0.2 }), MFURF = mat(rampF(0x7a5a38), { tex: "fur", amp: 0.8, dir: 0.2 }), MUZ = mat(ramp(0x3a2c24), { tex: "skin", amp: 0.6 });
function mastiffFrame(p = {}) {
  const W = 90, H = 60, G = H - 1, S = sculpt(W, H, { k: MFK, ax: 42 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 4, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, lp = p.leap ?? 0, jw = p.jaw ?? 0, cx = 40;
  const lgf = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 3 : -2), G - 1.5 - o[1] - lp * 6], kn = ik(sh, ft, 13, 13, front ? -1 : 1), M0 = far ? MFURF : MFUR;
    S.add(U(capF(sh, kn, far ? 4.6 : 5.2, 3.6), capF(kn, ft, 3.4, 2.8)), M0, { z: far ? -3 : 5, h: 3.6 });
    S.add(ellR(ft[0] + 2, ft[1] + 0.2, 4, 2.2), M0, { z: far ? -2 : 5.5, h: 1.8 });
    for (const d of [0.4, 2, 3.6]) S.carve(capF([ft[0] + 1 + d, ft[1] - 1], [ft[0] + 1.4 + d, ft[1] + 1.6], 0.3), 0.6);
  };
  lgf([cx + 14, 34 + b], lg.ff, 1, 1), lgf([cx - 13, 33 + b], lg.bf, 1, 0);
  S.add(U(capF([cx - 22, 26 + b], [cx - 29, 22 + b], 2.8, 2.2), capF([cx - 29, 22 + b], [cx - 31, 15 + b], 2.2, 1.2)), MFUR, { z: 0, h: 2 });
  S.add(U(ellR(cx + 8, 30 + b, 15, 12.4), ellR(cx - 12, 29 + b, 12, 9.6), capF([cx - 6, 28 + b], [cx + 4, 30 + b], 9)), MFUR, { z: 1, h: 10 });
  // 가죽 마갑
  S.add(polyF([[cx - 21, 22 + b], [cx - 4, 18.6 + b], [cx + 15, 19 + b], [cx + 19, 30 + b], [cx + 10, 34 + b], [cx - 14, 34 + b], [cx - 22, 30 + b]]), LEATH, { lift: 1.4, h: 3 });
  S.add(polyF([[cx - 22, 31 + b], [cx + 18, 31 + b], [cx + 10, 35.4 + b], [cx - 14, 35.4 + b]]), RED, { lift: 1.8, h: 1.2 });
  for (let k = 0; k < 6; k++) S.add(ellR(cx - 16 + k * 6.4, 24 + b - Math.sin((k / 5) * Math.PI) * 2, 1, 1), STEEL, { lift: 2.4, h: 0.8 });
  S.carve(capF([cx - 4, 19 + b], [cx - 3, 33 + b], 0.4), 0.7);
  // 목 + 가시 목걸이
  const hx = cx + 27, hy = 21 + b - lp * 3, ha = (p.head ?? 0) * 0.4;
  S.add(capF([cx + 16, 27 + b], [hx - 3, hy + 3], 8.4, 7.4), MFUR, { z: 3, h: 6 });
  S.add(capF([cx + 18, 19 + b], [cx + 20, 33 + b], 2.8), LEATH, { z: 6, h: 2.4 });
  for (const d of [-5, -2, 1, 4]) S.add(polyF([[cx + 20, 26 + b + d - 1], [cx + 24.4, 26 + b + d], [cx + 20, 26 + b + d + 1]]), STEEL, { z: 7, h: 0.9, prof: "sharp" });
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  S.add(ellR(...R(hx, hy), 8.4, 7.4), MFUR, { z: 6, h: 6 });
  S.add(polyF([R(hx - 3, hy - 6), R(hx - 9, hy - 2), R(hx - 4, hy + 2)]), MUZ, { z: 6.6, h: 1.4 });
  S.add(capF(R(hx + 4, hy + 1), R(hx + 11, hy + 2), 5, 4.4), MUZ, { z: 7, h: 4 });
  S.add(ellR(...R(hx + 8, hy + 6 + jw * 2), 4.4, 3.2), MUZ, { z: 6.8, h: 2.6 });
  if (jw > 0.2) {
    S.add(polyF([R(hx + 5, hy + 4), R(hx + 14, hy + 3.4), R(hx + 13, hy + 5 + jw * 4), R(hx + 5, hy + 6)]), mat(ramp(0x6a2a2a)), { z: 7.2, h: 0.6 });
    for (const x of [hx + 8, hx + 11.6]) S.add(polyF([R(x - 0.7, hy + 3.6), R(x + 0.7, hy + 3.6), R(x, hy + 5.6)]), BONE, { z: 7.5, h: 0.5 });
  }
  S.add(ellR(...R(hx + 13, hy + 0.6), 1.7, 1.4), DARK, { lift: 1, h: 0.8 });
  for (const y of [-3.4, -1.8]) S.carve(capF(R(hx - 1, hy + y), R(hx + 3, hy + y - 0.6), 0.4), 0.7);
  S.add(polyF([R(hx - 4, hy - 7), R(hx + 5, hy - 6.2), R(hx + 11, hy - 2.6), R(hx + 10, hy - 0.8), R(hx + 4, hy - 3.6), R(hx - 2, hy - 3.8)]), STEEL, { lift: 1.2, h: 1.4 });
  S.add(ellR(...R(hx + 2, hy - 5.4), 1, 1), GOLD, { lift: 2, h: 0.6 });
  !p.hurt && S.decal(...R(hx + 3.4, hy - 1.4), 0x1a1210).decal(...R(hx + 3.8, hy - 2), 0xffc060);
  lgf([cx + 16, 35 + b], lg.fn, 0, 1), lgf([cx - 11, 34 + b], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxMastiff = {
  fw: Math.round(90 * MFK), fh: Math.round(60 * MFK), w: 28, h: 20,
  anims: { idle: [4, 6], move: [6, 13], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], bark: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, jaw: 0.15 + Math.sin(ph) * 0.1 };
    if (nm === "move") P = { legs: gait4(f, n, 6, 3), bob: Math.cos(ph * 2) * 0.8, jaw: 0.3 };
    if (nm === "wind") P = { crouch: t, head: 0.3 * t, jaw: 0.5 * t };
    if (nm === "atk") P = { leap: [0.6, 1, 0.5][f], jaw: [1.2, 0.2, 0][f], head: -0.3, legs: { fn: [6, 3], ff: [6, 3], bn: [-6, 0], bf: [-6, 0] } };
    if (nm === "rec") P = { crouch: 0.4 * (1 - t), jaw: 0.3 };
    if (nm === "bark") P = { head: -0.6, jaw: [0.2, 1.2, 0.3, 1.2][f], crouch: 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, head: 0.4, jaw: 1, crouch: 0.4 };
    return mastiffFrame(P);
  },
};

// ════ 미늘창병 ════ 챙 넓은 철모 · 사슬 갑옷 위 붉은 겉옷(황금 태양) · 수염 난 얼굴 · 두 손으로 쥔 미늘창(도끼날 · 뒷갈고리 · 창끝)
//   p: legs · bob · sw(0 들고 섬 · 1 치켜듦 · 2 내려찍음) · hurt
const FMK = 0.72;
function halberd(S, P0, an, z) {
  const T = pol(P0, an, 32), n = an + Math.PI / 2;
  S.add(capF(pol(P0, an, -22), T, 1, 0.9), WOOD, { z, h: 1 });
  S.add(capF(pol(T, an, -8), pol(T, an, -15), 1.1), STEEL, { z: z + 0.1, h: 1 });
  S.add(polyF([pol(T, an, -1), pol(pol(T, an, 1.5), n, 8), pol(pol(T, an, -3), n, 10.4), pol(pol(T, an, -9), n, 9.4), pol(pol(T, an, -12), n, 6), pol(T, an, -9)]), STEEL, { z: z + 0.2, h: 1.6, prof: "sharp" });
  S.add(capF(pol(pol(T, an, 0.6), n, 7.6), pol(pol(T, an, -10), n, 8.8), 0.6), mat(ramp(0xd8dce0), { spec: 0.8 }), { on: 1, lift: 0.4, h: 0.3 });
  S.add(polyF([pol(T, an, -3), pol(pol(T, an, -6), n, -7), pol(T, an, -7)]), STEEL, { z: z + 0.2, h: 1, prof: "sharp" });
  S.add(polyF([pol(T, n, 1.3), pol(T, an, 10), pol(T, n, -1.3)]), STEEL, { z: z + 0.2, h: 1, prof: "sharp" });
  return T;
}
function footmanFrame(p = {}) {
  const W = 110, H = 90, G = H - 1, S = sculpt(W, H, { k: FMK, ax: 36 });
  const b = p.bob ?? 0, sw = p.sw ?? 0, cx = 34;
  const an = sw <= 1 ? L(-1.25, -2.0, sw) : L(-2.0, 0.25, Math.min(1, sw - 1));
  const aa = sw <= 1 ? L(1.1, -0.6, sw) : L(-0.6, 0.3, Math.min(1, sw - 1));
  const sol = soldier(S, { cx, Y: 46, G, b, legs: p.legs, helm: "kettle", hurt: p.hurt });
  const P0 = pol(sol.S0, aa, 11), hN = pol(P0, an, 3), hF = pol(P0, an, -9);
  arm(S, sol.S1, hF, 1, { z: 5, bend: 1 });
  halberd(S, P0, an, 6);
  S.add(ellR(sol.S0[0], sol.S0[1] + 1, 6, 4.6, 0.3), STEEL, { z: 7, h: 3.4 });
  arm(S, sol.S0, hN, 0, { bend: 1 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxFootman = {
  fw: Math.round(110 * FMK), fh: Math.round(90 * FMK), w: 16, h: 30,
  anims: { idle: [4, 5], move: [6, 9], wind: [4, 8, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 4, 2); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { sw: t, bob: -0.5 * t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 1 };
    if (nm === "rec") P = { sw: 2 + t, bob: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, sw: 0.2 };
    return footmanFrame(P);
  },
};

// ════ 수지 덩어리 ════ 반투명한 호박 진액 덩어리 · 속에 갇힌 딱정벌레와 작은 해골 · 기포 · 젖은 광택 · 바닥에 흘러내린 진액
//   p: squish(-1 길쭉 ~ 1 납작) · lean · drip · hurt
const OZK = 0.72;
function oozeFrame(p = {}) {
  const W = 62, H = 48, G = H - 1, S = sculpt(W, H, { k: OZK, ax: 30 });
  const sq = p.squish ?? 0, ln = p.lean ?? 0, cx = 29 + ln * 4, rx = 16 + sq * 4, ry = 14 - sq * 4.6, cy = G - ry;
  S.add(U(ellR(cx, cy, rx, ry), ellR(cx - ln * 2, G - 3, rx + 6, 3.4), ellR(cx + ln * 6, cy - ry * 0.4, rx * 0.6, ry * 0.7)), AMB, { z: 1, h: ry * 0.9 });
  S.add(minus(ellR(cx, cy, rx, ry), ellR(cx - 1, cy - 1.4, rx - 2.4, ry - 2.4)), AMBD, { on: 1, lift: 0.1, h: 0.3 });
  S.add(ellR(cx - 1, cy + ry * 0.25, rx * 0.62, ry * 0.5), AMBL, { on: 1, lift: 0.1, h: 0.4 });
  // 갇힌 딱정벌레 · 해골
  const bt = [cx - 6, cy + 1];
  S.add(ellR(bt[0], bt[1], 3.6, 2.4, -0.4), AMBD, { on: 1, h: 0.3 });
  S.add(ellR(bt[0] + 3.4, bt[1] - 1.4, 1.4, 1.2), AMBD, { on: 1, h: 0.3 });
  for (const d of [-1.6, 0, 1.6]) S.add(capF([bt[0] + d, bt[1] + 1.4], [bt[0] + d - 1.6, bt[1] + 3.6], 0.35), AMBD, { on: 1, h: 0.2 });
  const sk = [cx + 6, cy + 3];
  S.add(U(ellR(sk[0], sk[1], 3.4, 3), ellR(sk[0] + 1, sk[1] + 2.6, 2.2, 1.5)), mat(ramp(0xd8b880)), { on: 1, lift: 0.2, h: 0.4 });
  S.add(ellR(sk[0] + 1.4, sk[1] - 0.2, 1, 1.1), DARK, { on: 1, lift: 0.3, h: 0.2 }).add(ellR(sk[0] - 1.2, sk[1] - 0.2, 1, 1.1), DARK, { on: 1, lift: 0.3, h: 0.2 });
  S.add(capF([sk[0] - 0.4, sk[1] + 3.2], [sk[0] + 2.4, sk[1] + 3.2], 0.3), DARK, { on: 1, lift: 0.3, h: 0.2 });
  for (const [x, y, r] of [[cx + 3, cy - 6, 1.4], [cx - 9, cy - 3, 1], [cx + 10, cy - 2, 0.9], [cx - 2, cy - 9, 0.8]]) S.add(minus(ellR(x, y, r, r), ellR(x, y, r * 0.5, r * 0.5)), AMBL, { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(cx - rx * 0.4, cy - ry * 0.55, 4.4, 1.8, -0.5), mat(ramp(0xfff8e0)), { on: 1, lift: 0.7, h: 0.3 });
  S.add(capF([cx - rx * 0.78, cy - ry * 0.1], [cx - rx * 0.6, cy + ry * 0.4], 0.8), mat(ramp(0xffe0a0)), { on: 1, lift: 0.7, h: 0.3 });
  S.add(ellR(cx + rx * 0.35, cy - ry * 0.7, 1.4, 0.8), mat(ramp(0xfff4d0)), { on: 1, lift: 0.7, h: 0.3 });
  const dp = p.drip ?? 0;
  for (const [x, l] of [[cx + rx * 0.75, 4 + dp * 3], [cx - rx * 0.6, 3 + dp * 2]]) S.add(U(capF([x, cy + ry * 0.4], [x + 0.4, cy + ry * 0.4 + l], 1.2, 0.9), ellR(x + 0.4, cy + ry * 0.4 + l, 1.3, 1.5)), AMB, { z: 2, h: 1 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxOoze = {
  fw: Math.round(62 * OZK), fh: Math.round(48 * OZK), w: 22, h: 18,
  anims: { idle: [4, 5], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { squish: Math.sin(ph) * 0.15, drip: (f % 4) / 3 };
    if (nm === "move") P = { squish: Math.sin(ph) * 0.4, lean: Math.cos(ph) * 0.4 + 0.3, drip: t };
    if (nm === "wind") P = { squish: -0.7 * t, lean: -0.3 * t };
    if (nm === "atk") P = { squish: [0.9, 0.6, 0.3][f], lean: 1 };
    if (nm === "rec") P = { squish: 0.3 * (1 - t), lean: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, squish: 0.5 };
    return oozeFrame(P);
  },
};

// ════ [정예] 텅 빈 갑주 거인 ════ 속이 빈 거대한 판금 갑옷 · 투구 눈틈과 관절 틈마다 호박빛이 새어 나오고 진액이 흐른다 ·
//   찢긴 붉은 깃털 장식 · 너덜한 겉옷 자락 · 태양 문장의 탑 방패 · 대검
//   p: step · bob · crouch · swing(0 내림 · 1 치켜듦 · 2 내려찍음) · guard · hurt
const BWK = 0.72;
function bulwarkFrame(p = {}) {
  const W = 156, H = 126, G = H - 1, S = sculpt(W, H, { k: BWK, ax: 60 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 5, st = p.step ?? 0, sw = p.swing ?? 0, gd = p.guard ?? 0, cx = 60;
  const ooze = (q, r = 1) => { S.add(ellR(q[0], q[1], 2.6 * r, 2 * r), AMBG, { lift: 0.6, h: 0.8 }); S.add(capF([q[0] + r, q[1] + 1], [q[0] + r * 1.4, q[1] + 4 + r * 2], 0.9 * r, 0.6 * r), AMB, { lift: 0.8, h: 0.6 }); };
  // 방패 (먼 팔) — 막을 때는 앞으로
  const shX = L(cx - 18, cx + 30, gd), shY = 74 + b, shZ = gd > 0.5 ? 14 : -6;
  const shield = () => {
    S.add(U(polyF([[shX - 10, shY - 26], [shX + 10, shY - 26], [shX + 10, shY + 18], [shX, shY + 26], [shX - 10, shY + 18]]), ellR(shX, shY - 26, 10, 3)), RED, { z: shZ, h: 4, prof: "flat" });
    S.add(minus(U(polyF([[shX - 10, shY - 26], [shX + 10, shY - 26], [shX + 10, shY + 18], [shX, shY + 26], [shX - 10, shY + 18]]), ellR(shX, shY - 26, 10, 3)), U(polyF([[shX - 8, shY - 24], [shX + 8, shY - 24], [shX + 8, shY + 17], [shX, shY + 23], [shX - 8, shY + 17]]), ellR(shX, shY - 24, 8, 2.6))), GOLDF, { z: shZ + 0.1, lift: 0.4, h: 1.4 });
    sun(S, [shX, shY - 4], 7, { z: shZ + 0.2 });
    S.add(ellR(shX, shY - 4, 2.6, 2.6), AMBG, { z: shZ + 0.3, lift: 0.8, h: 0.8 });
    S.carve(capF([shX - 4, shY + 6], [shX - 1, shY + 16], 0.5), 1);
  };
  gd <= 0.5 && shield();
  // 다리
  const kF = leg(S, [cx - 10, 86 + b], [cx - 12 - st, G - 1], 1, { w: 1.7, thigh: STEEL, thighF: STEELF });
  ooze([kF[0] + 4, kF[1] - 4], 0.8);
  // 너덜한 겉옷 자락 + 허리 판금(층층) + 흉갑
  S.add(polyF([[cx - 16, 76 + b], [cx + 18, 76 + b], [cx + 20, 104 + b], [cx + 14, 100 + b], [cx + 10, 108 + b], [cx + 4, 101 + b], [cx - 2, 106 + b], [cx - 8, 99 + b], [cx - 14, 104 + b]]), RED, { z: 1, h: 6 });
  for (const dx of [-8, 0, 8, 14]) S.carve(capF([cx + dx, 84 + b], [cx + dx + 1, 102 + b], 0.5), 0.8);
  for (let k = 0; k < 3; k++) { const y = 74 + k * 5 + b; S.add(polyF([[cx - 20 + k, y], [cx + 20 - k, y], [cx + 19 - k, y + 6], [cx - 19 + k, y + 6]]), k % 2 ? STEELF : STEEL, { z: 2 + k * 0.1, h: 4 }); }
  S.add(U(ellR(cx, 58 + b, 22, 20), polyF([[cx - 20, 60 + b], [cx + 20, 60 + b], [cx + 18, 76 + b], [cx - 18, 76 + b]])), STEEL, { z: 2.5, h: 16 });
  S.carve(capF([cx + 4, 42 + b], [cx + 5, 74 + b], 0.6), 0.8);
  S.add(capF([cx - 19, 44 + b], [cx + 21, 44 + b], 0.8), GOLD, { on: 1, lift: 0.4, h: 0.4 });
  S.add(capF([cx - 17, 74 + b], [cx + 18, 74 + b], 0.8), GOLD, { on: 1, lift: 0.4, h: 0.4 });
  sun(S, [cx + 6, 58 + b], 7);
  for (const [x, y] of [[cx - 12, 70 + b], [cx + 12, 64 + b]]) S.carve(capF([x, y], [x + 4, y + 2], 0.5), 0.8);
  // 목 틈 (속이 비어 호박빛) + 먼 어깨
  S.add(ellR(cx + 2, 40 + b, 10, 4), DARK, { z: 2.8, h: 2 });
  S.add(ellR(cx + 3, 40 + b, 6, 2.2), AMBG, { z: 2.9, h: 1 });
  S.add(U(ellR(cx - 16, 44 + b, 12, 8, -0.3), ellR(cx - 18, 51 + b, 10, 5, -0.4)), STEELF, { z: 1.5, h: 6 });
  // 통투구 (평평한 정수리 · 눈틈 · 숨구멍 · 황금 십자 · 찢긴 깃털)
  const hx = cx + 4, hy = 26 + b;
  for (let k = 0; k < 5; k++) S.add(capF([hx - 2, hy - 12], [hx - 14 - k * 3, hy - 8 + k * 4 + Math.sin(k) * 2], 2.2 - k * 0.2, 0.8), k % 2 ? REDF : RED, { z: 3, h: 1.6 });
  S.add(U(polyF([[hx - 10, hy - 10], [hx + 10, hy - 10], [hx + 11, hy + 11], [hx - 10, hy + 11]]), ellR(hx, hy - 10, 10, 3.6)), STEEL, { z: 4, h: 10 });
  S.add(capF([hx + 6, hy - 12], [hx + 7, hy + 10], 1.2), GOLD, { on: 1, lift: 0.5, h: 0.6 });
  S.add(capF([hx - 2, hy - 2.4], [hx + 11, hy - 2.4], 1), GOLD, { on: 1, lift: 0.5, h: 0.6 });
  S.carve(capF([hx - 1, hy - 0.4], [hx + 11, hy - 0.4], 1), 2, !1);
  if (!p.hurt) for (let x = hx; x <= hx + 10; x += 1.4) S.decal(x, hy - 0.4, x % 3 < 1.4 ? 0xffe090 : 0xffa840);
  for (const [x, y] of [[hx + 8, hy + 4], [hx + 8, hy + 6.6], [hx + 5.6, hy + 5.2], [hx + 5.6, hy + 7.8]]) S.decal(x, y, 0xffa840);
  // 다리 (가까운 쪽)
  const kN = leg(S, [cx + 10, 86 + b], [cx + 12 + st, G - 1], 0, { w: 1.7, thigh: STEEL, thighF: STEELF });
  ooze([kN[0] + 3, kN[1] - 4]);
  // 대검 + 가까운 팔
  const sh = [cx + 20, 50 + b];
  const hd = sw <= 1 ? lerp(pol(sh, 1.2, 22), pol(sh, -1.8, 20), sw) : lerp(pol(sh, -1.8, 20), [cx + 34, 80 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.35, -2.5, sw) : L(-2.5, 0.62, Math.min(1, sw - 1));
  const tip = pol(hd, ba, 48), gq = pol(hd, ba, 4);
  S.add(polyF([pol(gq, ba + 1.57, 2.4), pol(tip, ba + 1.57, 0.8), pol(tip, ba, 3), pol(tip, ba - 1.57, 0.8), pol(gq, ba - 1.57, 2.4)]), STEEL, { z: 11, h: 1.8, prof: "sharp" });
  S.add(capF(pol(gq, ba, 2), pol(gq, ba, 34), 0.5), STEELF, { on: 1, lift: 0.3, h: 0.3 });
  S.add(capF(pol(gq, ba + 1.57, 7), pol(gq, ba - 1.57, 7), 1.4, 1.4), GOLD, { z: 11.2, h: 1.4 });
  S.add(capF(hd, pol(hd, ba, -8), 1.4), LEATH, { z: 11.1, h: 1.2 });
  S.add(ellR(...pol(hd, ba, -9), 2.2, 2.2), GOLD, { z: 11.2, h: 1.6 });
  const el = ik(sh, hd, 13, 13, 1);
  S.add(U(ellR(sh[0], sh[1], 13, 9, 0.3), ellR(sh[0] + 2, sh[1] + 7, 11, 5, 0.4)), STEEL, { z: 9, h: 7 });
  S.add(capF([sh[0] - 8, sh[1] - 4], [sh[0] + 8, sh[1] - 2], 0.8), GOLD, { on: 1, lift: 0.4, h: 0.4 });
  S.add(U(capF(sh, el, 6, 5.4), capF(el, hd, 5.4, 5)), STEEL, { z: 10, h: 5 });
  ooze([el[0], el[1]], 0.9);
  S.add(ellR(hd[0], hd[1], 5.4, 5), STEEL, { z: 12, h: 4 });
  gd > 0.5 && shield();
  return fin(S.render({ rim: !0 }), p);
}
export const pxBulwark = {
  fw: Math.round(156 * BWK), fh: Math.round(126 * BWK), w: 34, h: 58,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], guard: [2, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.7 };
    if (nm === "move") P = { step: Math.sin(ph) * 6, bob: -Math.abs(Math.sin(ph)) * 2 };
    if (nm === "wind") P = { swing: t, crouch: -0.2 * t };
    if (nm === "atk") P = { swing: [1.5, 2, 2][f], crouch: [0.3, 0.8, 0.8][f] };
    if (nm === "rec") P = { swing: 2, crouch: 0.8 * (1 - t) };
    if (nm === "guard") P = { guard: 1, crouch: 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.4 };
    return bulwarkFrame(P);
  },
};

// ════ 석궁병 ════ 꼬리 달린 샐릿 투구 + 턱 가리개 · 누빈 솜옷과 붉은 띠 · 등에 진 태양 문장 방패(파비스) · 허리의 화살통 · 무거운 석궁
//   p: legs · bob · aim(각도) · loaded · kick · hurt
const XBK = 0.72;
function xbowFrame(p = {}) {
  const W = 90, H = 90, G = H - 1, S = sculpt(W, H, { k: XBK, ax: 36 });
  const b = p.bob ?? 0, am = p.aim ?? 0, kk = p.kick ?? 0, cx = 34;
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, helm: "sallet", body: GAMB, tabard: !1, hurt: p.hurt,
    back: () => {
      // 등에 진 파비스 방패
      const px0 = cx - 12, py = 44 + b;
      S.add(polyF([[px0 - 8, py - 18], [px0 + 6, py - 20], [px0 + 8, py + 18], [px0 - 6, py + 20]]), WOOD, { z: -4, h: 3, prof: "flat" });
      S.add(polyF([[px0 - 6, py - 16], [px0 + 4, py - 17.6], [px0 + 6, py + 16], [px0 - 4, py + 17.6]]), RED, { z: -3.9, lift: 0.3, h: 1 });
      sun(S, [px0, py], 5, { z: -3.8 });
    },
  });
  // 붉은 띠 · 화살통
  S.add(capF([cx - 9, 41 + b], [cx + 9, 57 + b], 1.6), RED, { z: 3.2, h: 1.2 });
  S.add(polyF([[cx + 8, 60 + b], [cx + 13, 60 + b], [cx + 12, 72 + b], [cx + 8, 72 + b]]), LEATH, { z: 4.6, h: 2 });
  for (const d of [0, 1.6, 3.2]) S.add(polyF([[cx + 8.6 + d, 60 + b], [cx + 9.6 + d, 55 + b], [cx + 10.6 + d, 60 + b]]), mat(ramp(0xd8d0c0)), { z: 4.5, h: 0.6 });
  // 석궁 (개머리 · 활대 · 시위 · 볼트)
  const back = [cx + 4 - kk * 3, 41 + b], front = pol(back, am, 24), n = am + Math.PI / 2;
  arm(S, sol.S1, pol(back, am, 16), 1, { z: 5, bend: 1, M: GAMB, MF: GAMBF });
  S.add(capF(back, front, 1.8, 1.5), WOOD, { z: 6, h: 1.6 });
  S.add(capF(pol(back, am, 6), pol(back, am, 9), 1.2), STEEL, { z: 6.2, h: 0.8 });
  const t1 = pol(pol(front, am, -3), n, -9), t2 = pol(pol(front, am, -3), n, 9);
  S.add(U(capF(t1, front, 1.2, 1.4), capF(front, t2, 1.4, 1.2)), STEEL, { z: 6.4, h: 1.2 });
  const nut = p.loaded ? pol(back, am, 9) : pol(front, am, -2.6);
  S.add(capF(t1, nut, 0.35), mat(ramp(0xd8d0b8)), { z: 6.5, h: 0.3 }).add(capF(nut, t2, 0.35), mat(ramp(0xd8d0b8)), { z: 6.5, h: 0.3 });
  if (p.loaded) { S.add(capF(pol(back, am, 9), pol(front, am, 4), 0.7), WOOD, { z: 6.6, h: 0.6 }); S.add(polyF([pol(pol(front, am, 4), n, 1.2), pol(front, am, 8), pol(pol(front, am, 4), n, -1.2)]), STEEL, { z: 6.7, h: 0.6, prof: "sharp" }); }
  S.add(ellR(sol.S0[0], sol.S0[1] + 1, 5, 4, 0.3), GAMB, { z: 7, h: 3 });
  arm(S, sol.S0, pol(back, am, 7), 0, { bend: -1, M: GAMB, MF: GAMBF });
  return fin(S.render({ rim: !0 }), p);
}
export const pxCrossbow = {
  fw: Math.round(90 * XBK), fh: Math.round(90 * XBK), w: 16, h: 30,
  anims: { idle: [4, 5], move: [6, 9], wind: [3, 8, !1], atk: [3, 14, !1], rec: [4, 6, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, aim: 0.5, loaded: 1 };
    if (nm === "move") { const g = gait2(f, n, 4, 2); P = { legs: g, bob: g.bob, aim: 0.55, loaded: 1 }; }
    if (nm === "wind") P = { aim: L(0.5, -0.05, t), loaded: 1 };
    if (nm === "atk") P = { aim: -0.12, kick: [1, 0.6, 0.2][f], loaded: 0 };
    if (nm === "rec") P = { aim: 1, loaded: f >= 3 ? 1 : 0, bob: [1, 1.6, 1.6, 0.6][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, aim: 0.8, loaded: 1 };
    return xbowFrame(P);
  },
};

// ════ 호박 왕잠자리 ════ 호박 속에 갇혔다 깨어난 듯한 거대 잠자리 · 마디진 긴 배(호박색과 검은 마디) · 머리를 감싼 큰 겹눈 ·
//   수평으로 편 두 쌍의 긴 유리 날개(날개맥 · 끝의 호박 반점) · 앞으로 모은 바구니 다리
//   p: flap(-1~1, 앞뒤 날개가 엇갈림) · tilt · curl(배 말기) · hurt
const WSK = 0.72;
const CHB = mat(ramp(0x2e2622), { tex: "metal", amp: 0.5, spec: 0.6 }), CHA = mat(ramp(0xd8902c), { tex: "metal", amp: 0.5, spec: 0.6 }), CHA2 = mat(ramp(0xb87420), { tex: "metal", amp: 0.5, spec: 0.6 });
const WNG = mat(ramp(0xa8a490, { hi: 0.6 }), { tex: "glass", amp: 0.5, spec: 0.7 }), WNGF = mat(rampF(0x8a8676), { tex: "glass", amp: 0.4 });
function dragonflyFrame(p = {}) {
  const W = 84, H = 50, S = sculpt(W, H, { k: WSK, ax: 40 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cu = p.curl ?? 0, cx = 46, cy = 24;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (root, a, l, w, back) => {
    const c = pol(root, a, l / 2), z = back ? -4 : 7;
    S.add(ellR(c[0], c[1], l / 2, w, a), back ? WNGF : WNG, { z, h: 0.8, prof: "flat" });
    S.add(capF(pol(root, a, 1), pol(root, a, l - 2), 0.4), CHB, { z: z + 0.1, h: 0.3 });
    for (const q of [0.3, 0.5, 0.7]) S.add(capF(pol(root, a, l * q), pol(pol(root, a, l * (q + 0.12)), a - 1.57, w * 0.85), 0.25), CHB, { z: z + 0.1, h: 0.2 });
    S.add(ellR(...pol(pol(root, a, l - 4), a + 1.57, w * 0.35), 2, 1, a), mat(ramp(0xc86a18)), { z: z + 0.15, h: 0.3 });
  };
  const fa = -Math.PI / 2 - 1.05 - fl * 0.35, ba = -Math.PI / 2 - 1.3 + fl * 0.35;
  wing(R(cx - 1, cy - 3), ba, 30, 3, 1), wing(R(cx + 2, cy - 3), fa, 30, 3.2, 1);
  // 긴 배 (마디 열 개, 끝이 살짝 위로 · curl이면 앞아래로 말림)
  let q = R(cx - 6, cy + 1), a = Math.PI + 0.05;
  for (let k = 0; k < 10; k++) {
    a -= (0.03 - cu * 0.17) * (k > 4 ? 1.6 : 0.6);
    const n2 = pol(q, a, 3.6), w = 2.4 - k * 0.1;
    S.add(capF(q, n2, w, w - 0.1), k % 2 ? CHA : CHA2, { z: 1, h: 2 });
    S.add(capF(pol(q, a, 2.9), pol(q, a, 3.6), w + 0.1), CHB, { z: 1.1, h: 2 });
    q = n2;
  }
  for (const d of [-0.5, 0.5]) S.add(capF(q, pol(q, a + d, 3.4), 0.6, 0.3), CHB, { z: 1.2, h: 0.5 });
  // 다리 (앞으로 모은 바구니)
  for (let k = 0; k < 3; k++) { const r0 = R(cx - 2 + k * 2.6, cy + 3), kn = R(cx + 1 + k * 3, cy + 8), ft = R(cx + 5 + k * 2, cy + 10.4); S.add(U(capF(r0, kn, 0.8), capF(kn, ft, 0.7, 0.4)), CHB, { z: 3, h: 0.6 }); }
  // 가슴 (줄무늬) + 머리 (큰 겹눈)
  S.add(ellR(...R(cx, cy), 7, 5.6, -0.3), CHA, { z: 2, h: 5 });
  for (const d of [-2.4, 1]) S.add(capF(R(cx + d, cy - 4.4), R(cx + d - 2.6, cy + 4), 0.8), CHB, { on: 1, lift: 0.3, h: 0.4 });
  const hd = R(cx + 8.4, cy - 1);
  S.add(ellR(hd[0], hd[1], 4.4, 4.2), CHB, { z: 3, h: 3.6 });
  S.add(ellR(hd[0] + 0.6, hd[1] - 0.8, 4.2, 4.4), mat(ramp(0xb04818, { hi: 0.5 }), { tex: "scale", amp: 0.8, spec: 0.8 }), { z: 3.5, h: 3.6 });
  S.add(ellR(hd[0] + 3.4, hd[1] + 2.4, 1.6, 1.2), CHA, { z: 3.6, h: 1 });
  !p.hurt && S.decal(hd[0] - 0.6, hd[1] - 2.6, 0xffe0b0).decal(hd[0] + 0.2, hd[1] - 2.8, 0xffffff);
  wing(R(cx - 1, cy - 3), ba + 0.2, 32, 3.4, 0), wing(R(cx + 2, cy - 3), fa + 0.2, 32, 3.6, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxDragonfly = {
  fw: Math.round(84 * WSK), fh: Math.round(50 * WSK), w: 22, h: 12, flying: !0,
  anims: { idle: [4, 16], move: [4, 18], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, -0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.2 };
    if (nm === "wind") P = { flap: fl, tilt: -0.3 * t, curl: 0.5 * t };
    if (nm === "atk") P = { flap: fl, tilt: 0.5, curl: 1 };
    if (nm === "rec") P = { flap: fl, curl: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return dragonflyFrame(P);
  },
};

// ════ 깃발 기수 ════ 돼지주둥이 바시넷 · 사슬 갑옷 · 붉은 겉옷 · 창끝 달린 긴 깃대 · 제비꼬리 붉은 깃발에 황금 태양
//   p: legs · bob · ph(펄럭임) · tilt(깃대 앞으로) · raise · hurt
const BRK = 0.72;
function bearerFrame(p = {}) {
  const W = 150, H = 122, G = H - 1, S = sculpt(W, H, { k: BRK, ax: 40 });
  const b = p.bob ?? 0, ph = p.ph ?? 0, tl = p.tilt ?? 0, rs = p.raise ?? 0, cx = 40;
  const sol = soldier(S, { cx, Y: 78, G, b, legs: p.legs, helm: "bascinet", hurt: p.hurt });
  // 깃대 (가까운 손이 쥔 점을 축으로 기운다)
  const hN = [cx + 12, 80 + b - rs * 8], a = -Math.PI / 2 + tl * 1.1, R = (q) => { const dx = q[0] - hN[0], dy = q[1] - hN[1], c = Math.cos(tl * 1.1), s = Math.sin(tl * 1.1); return [hN[0] + dx * c - dy * s, hN[1] + dx * s + dy * c]; };
  const top = pol(hN, a, 66), bot = pol(hN, a, -24);
  arm(S, sol.S1, pol(hN, a, -12), 1, { z: 5, bend: 1 });
  // 깃발 천 (가로대에 매달려 뒤로 펄럭)
  const fy = hN[1] - 62, fx = hN[0];
  const pts = [];
  for (let k = 0; k <= 6; k++) { const x = fx - 2 - k * 5, w = Math.sin(ph + k * 0.9) * (1 + k * 0.4); pts.push([x, fy + w * 0.5]); }
  const bt = [];
  for (let k = 6; k >= 0; k--) { const x = fx - 2 - k * 5, w = Math.sin(ph + k * 0.9) * (1 + k * 0.4); bt.push([x, fy + 34 - (k === 6 ? 8 : k === 5 ? 0 : 0) + w]); }
  bt.splice(1, 0, [fx - 2 - 5.5 * 5, fy + 26 + Math.sin(ph + 5.5 * 0.9) * 3]);
  const cloth = polyF([...pts, ...bt].map(R));
  S.add(cloth, RED, { z: 2, h: 3, prof: "flat" });
  for (let k = 1; k < 6; k++) { const x = fx - 2 - k * 5; S.carve(capF(R([x, fy + 2]), R([x + Math.sin(ph + k) * 1.4, fy + 30]), 0.5), Math.cos(ph + k * 0.9) > 0 ? 0.9 : 0.3); }
  S.add(capF(R([fx - 2, fy + 1]), R([fx - 32, fy + 1 + Math.sin(ph + 6 * 0.9) * 1.7]), 1), GOLD, { on: 1, lift: 0.4, h: 0.5 });
  sun(S, R([fx - 15, fy + 15 + Math.sin(ph + 2.6) * 1.4]), 7);
  S.add(capF(bot, top, 1.1, 1), WOOD, { z: 6, h: 1 });
  S.add(capF(R([fx - 33, fy]), R([fx + 1, fy]), 0.8), WOOD, { z: 6.1, h: 0.8 });
  S.add(polyF([pol(top, a + 1.57, 1.6), pol(top, a, 9), pol(top, a - 1.57, 1.6)]), STEEL, { z: 6.2, h: 1, prof: "sharp" });
  S.add(ellR(top[0], top[1], 1.8, 1.4), GOLD, { z: 6.3, h: 1 });
  S.add(ellR(sol.S0[0], sol.S0[1] + 1, 6, 4.6, 0.3), STEEL, { z: 7, h: 3.4 });
  arm(S, sol.S0, hN, 0, { bend: 1 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxBearer = {
  fw: Math.round(150 * BRK), fh: Math.round(122 * BRK), w: 16, h: 30,
  anims: { idle: [6, 6], move: [6, 9], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], rally: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") { const g = gait2(f, n, 4, 2); P = { legs: g, bob: g.bob, ph: ph * 1.5 }; }
    if (nm === "wind") P = { tilt: -0.2 * t, ph, raise: 0.5 * t };
    if (nm === "atk") P = { tilt: [0.7, 1.05, 1][f], ph, bob: 1 };
    if (nm === "rec") P = { tilt: 1 - t, ph };
    if (nm === "rally") P = { raise: 1, tilt: [-0.15, 0.15, -0.15, 0.1][f], ph: ph * 2 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, tilt: -0.15, ph };
    return bearerFrame(P);
  },
};

// ════ [정예] 기마 창기사 ════ 붉은 마의(황금 테 · 태양 문장)를 두른 갈색 군마 · 쇠 얼굴 판 · 갈기와 꼬리 ·
//   통투구에 붉은 깃털 장식을 단 기사 · 태양 방패 · 깃발 달린 긴 창
//   p: legs(gait4) · bob · lance(각도) · lunge · hurt
const LCK = 0.7;
const HRS = mat(ramp(0x6a4632), { tex: "fur", amp: 0.8, dir: 0.1 }), HRSF = mat(rampF(0x52362a), { tex: "fur", amp: 0.7, dir: 0.1 }), MANE = mat(ramp(0x2a1e18), { tex: "fur", amp: 1.1, dir: 1.3 });
function lancerFrame(p = {}) {
  const W = 166, H = 128, G = H - 1, S = sculpt(W, H, { k: LCK, ax: 66 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, la = p.lance ?? -0.6, lu = p.lunge ?? 0, cx = 64;
  const hleg = (hp, o, far, front) => {
    const ft = [hp[0] + o[0] + (front ? 2 : -1), G - 1.5 - o[1]], kn = ik(hp, ft, 22, 22, front ? -1 : 1), M0 = far ? HRSF : HRS;
    S.add(U(capF(hp, kn, front ? 5.4 : 6.4, 3.4), capF(kn, ft, 3, 2.4)), M0, { z: far ? -4 : 6, h: 3.4 });
    S.add(ellR(kn[0], kn[1], 3.4, 3), M0, { z: far ? -3.9 : 6.1, h: 2 });
    S.add(polyF([[ft[0] - 3, ft[1] - 5], [ft[0] + 3, ft[1] - 5], [ft[0] + 5, ft[1] + 1], [ft[0] - 3.4, ft[1] + 1]]), far ? mat(rampF(0x2a2420)) : mat(ramp(0x3a322c), { spec: 0.3 }), { z: far ? -3.8 : 6.2, h: 1.6 });
    S.add(capF([ft[0] - 3, ft[1] - 6], [ft[0] + 3.4, ft[1] - 6], 1.6, 1.4), far ? mat(rampF(0xb8a890), { tex: "fur" }) : mat(ramp(0xd8ccb0), { tex: "fur", amp: 1 }), { z: far ? -3.7 : 6.3, h: 1 });
  };
  hleg([cx + 20, 84 + b], lg.ff, 1, 1), hleg([cx - 30, 82 + b], lg.bf, 1, 0);
  // 꼬리
  for (let k = 0; k < 4; k++) S.add(capF([cx - 42, 66 + b], [cx - 52 - k * 2 + Math.sin(k + (p.ph ?? 0)) * 2, 98 + b + k * 3], 2.6 - k * 0.3, 0.8), MANE, { z: -1 + k * 0.1, h: 1.4 });
  // 몸 (엉덩이 · 통 · 가슴) + 목 + 머리
  S.add(U(ellR(cx - 30, 72 + b, 15, 15), ellR(cx - 6, 76 + b, 30, 15), ellR(cx + 20, 72 + b, 13, 15)), HRS, { z: 1, h: 14 });
  const hd0 = [cx + 36 + lu * 4, 40 + b + lu * 3], hd1 = [cx + 47 + lu * 6, 57 + b + lu * 2];
  S.add(U(capF([cx + 22, 66 + b], [hd0[0] - 2, hd0[1] + 4], 11, 7.4)), HRS, { z: 2, h: 8 });
  for (let k = 0; k < 6; k++) { const q = lerp([cx + 18, 60 + b], [hd0[0] - 4, hd0[1] - 2], k / 5); S.add(capF(q, [q[0] - 5, q[1] + 5 + (k % 2) * 2], 1.8, 0.8), MANE, { lift: 1.6, h: 1.2 }); }
  S.add(U(capF(hd0, hd1, 6.4, 4.4)), HRS, { z: 3, h: 6 });
  S.add(polyF([[hd0[0] - 2, hd0[1] - 4], [hd0[0] - 1, hd0[1] - 11], [hd0[0] + 2, hd0[1] - 5]]), HRS, { z: 3.2, h: 1.6 });
  // 쇠 얼굴 판 + 고삐
  S.add(polyF([[hd0[0] - 1, hd0[1] - 4], [hd0[0] + 6, hd0[1] - 3], [hd1[0] + 3, hd1[1] - 3], [hd1[0] - 1, hd1[1] - 1], [hd0[0] + 1, hd0[1] + 3]]), STEEL, { lift: 1, h: 1.6 });
  S.add(ellR(hd0[0] + 4, hd0[1] + 3, 1.6, 1.6), GOLD, { lift: 2, h: 0.8 });
  !p.hurt && S.decal(hd0[0] + 3, hd0[1] + 5, 0x120c0a).decal(hd0[0] + 3.4, hd0[1] + 4.4, 0xd8c8a8);
  S.add(ellR(hd1[0] + 1, hd1[1] + 1, 2, 1.6), DARK, { lift: 0.6, h: 0.6 });
  S.add(capF([hd1[0] - 2, hd1[1]], [cx + 12, 52 + b], 0.5), LEATH, { z: 8, h: 0.4 });
  // 마의 (몸통을 덮는 붉은 천 · 물결 아래단 · 황금 테 · 태양)
  const sc = [];
  for (let k = 0; k <= 10; k++) { const x = cx + 30 - k * 8; sc.push([x, 96 + b + (k % 2 ? 3 : 0)]); }
  const drape = polyF([[cx - 44, 64 + b], [cx - 20, 58 + b], [cx + 16, 58 + b], [cx + 30, 62 + b], ...sc]);
  S.add(drape, RED, { lift: 1.6, h: 5 });
  for (let k = 0; k < 9; k++) S.carve(capF([cx + 24 - k * 8, 70 + b], [cx + 25 - k * 8, 94 + b], 0.6), 0.9);
  S.add(U(...sc.slice(0, -1).map((q, k) => capF(q, sc[k + 1], 1.4))), GOLD, { lift: 2, h: 0.8 });
  sun(S, [cx - 18, 80 + b], 8), sun(S, [cx + 14, 80 + b], 6);
  // 기사: 먼 팔 방패 · 안장 · 몸통 · 겉옷 · 투구
  S.add(U(polyF([[cx + 2, 30 + b], [cx + 18, 30 + b], [cx + 18, 42 + b], [cx + 10, 52 + b], [cx + 2, 42 + b]])), RED, { z: 1.5, lift: 0, h: 3, prof: "flat" });
  S.add(polyF([[cx + 10, 30 + b], [cx + 18, 30 + b], [cx + 18, 42 + b], [cx + 10, 52 + b]]), GOLDF, { on: 1, lift: 0.2, h: 0.4 });
  S.add(polyF([[cx - 20, 58 + b], [cx - 16, 52 + b], [cx + 6, 54 + b], [cx + 10, 50 + b], [cx + 12, 58 + b]]), LEATH, { z: 8, h: 3 });
  const rY = 32 + b;
  S.add(U(ellR(cx - 4, rY + 6, 10, 12), polyF([[cx - 12, rY + 8], [cx + 6, rY + 8], [cx + 8, rY + 22], [cx - 12, rY + 22]])), STEEL, { z: 8.5, h: 9 });
  S.add(polyF([[cx - 12, rY + 14], [cx + 7, rY + 14], [cx + 12, rY + 30], [cx + 4, rY + 28], [cx - 4, rY + 31], [cx - 14, rY + 27]]), RED, { z: 8.8, h: 5 });
  sun(S, [cx - 2, rY + 6], 5);
  // 가까운 다리 (등자)
  S.add(U(capF([cx - 2, rY + 22], [cx + 8, rY + 30], 4.4, 3.8), capF([cx + 8, rY + 30], [cx + 5, rY + 44], 3.6, 3.2)), STEEL, { z: 9.2, h: 3.4 });
  S.add(ellR(cx + 7, rY + 46, 5, 2.2), STEEL, { z: 9.3, h: 1.6 });
  S.add(capF([cx + 2, rY + 26], [cx + 5, rY + 47], 0.4), LEATH, { z: 9.25, h: 0.3 });
  // 통투구 + 깃털
  const hx = cx - 2, hy = rY - 12;
  for (let k = 0; k < 5; k++) S.add(capF([hx - 2, hy - 9], [hx - 12 - k * 3 - lu * 4, hy - 6 + k * 3.4], 2.2 - k * 0.2, 0.8), k % 2 ? REDF : RED, { z: 8.6, h: 1.6 });
  S.add(U(polyF([[hx - 7, hy - 7], [hx + 7, hy - 7], [hx + 8, hy + 8], [hx - 7, hy + 8]]), ellR(hx, hy - 7, 7, 2.6)), STEEL, { z: 9, h: 7 });
  S.add(capF([hx + 4, hy - 8], [hx + 5, hy + 7], 0.9), GOLD, { on: 1, lift: 0.5, h: 0.5 });
  S.carve(capF([hx - 1, hy - 0.6], [hx + 8, hy - 0.6], 0.7), 2, !1);
  for (const [x, y] of [[hx + 6, hy + 3], [hx + 6, hy + 5]]) S.decal(x, y, 0x1a1414);
  // 창 (겨드랑이에 끼운다) + 가까운 팔
  const sh = [cx + 2, rY - 1], hand = [cx + 10, rY + 10], tip = pol(hand, la, 64), butt = pol(hand, la, -22);
  S.add(capF(butt, tip, 1.8, 0.7), WOOD, { z: 10, h: 1.4 });
  for (let k = 0; k < 4; k++) S.carve(capF(pol(hand, la, 10 + k * 12), pol(hand, la, 12 + k * 12), 0.5), 0.5);
  S.add(polyF([pol(pol(hand, la, 4), la + 1.57, 1.8), pol(pol(hand, la, 4), la - 1.57, 1.8), pol(pol(hand, la, 12), la - 1.57, 6), pol(pol(hand, la, 12), la + 1.57, 6)]), STEEL, { z: 10.4, h: 2 });
  S.add(polyF([pol(tip, la + 1.57, 1.4), pol(tip, la, 8), pol(tip, la - 1.57, 1.4)]), STEEL, { z: 10.2, h: 1, prof: "sharp" });
  const pn = pol(tip, la, -8);
  S.add(polyF([pn, pol(pn, la, -12), pol(pol(pn, la, -14), la + 1.57, 7), pol(pol(pn, la, -8), la + 1.57, 4.4), pol(pol(pn, la, -4), la + 1.57, 8)]), RED, { z: 10.1, h: 1, prof: "flat" });
  const el = ik(sh, hand, 9, 9, 1);
  S.add(ellR(sh[0], sh[1], 6.4, 4.6, 0.3), STEEL, { z: 10.5, h: 3.4 });
  S.add(U(capF(sh, el, 3.4, 3), capF(el, hand, 3, 2.8)), STEEL, { z: 10.6, h: 2.6 });
  S.add(ellR(hand[0], hand[1], 3, 2.8), LEATH, { z: 10.8, h: 2 });
  hleg([cx + 22, 85 + b], lg.fn, 0, 1), hleg([cx - 28, 83 + b], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxLancer = {
  fw: Math.round(166 * LCK), fh: Math.round(128 * LCK), w: 56, h: 60,
  anims: { idle: [4, 4], move: [6, 12], wind: [4, 8, !1], atk: [4, 14], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6, ph };
    if (nm === "move") P = { legs: gait4(f, n, 10, 6), bob: Math.cos(ph * 2) * 1.4, ph, lance: -0.55 };
    if (nm === "wind") P = { lance: L(-0.6, -0.85, t), lunge: -0.4 * t, ph };
    if (nm === "atk") P = { legs: gait4(f, n, 13, 8), lance: 0.04, lunge: 1, bob: Math.cos(ph * 2) * 1.6, ph: ph * 2 };
    if (nm === "rec") P = { lance: L(0.04, -0.6, t), lunge: 1 - t, ph };
    if (nm === "hurt") P = { hurt: f === 0, lunge: -0.4, lance: -0.7, ph };
    return lancerFrame(P);
  },
};

// ════ 태엽 매 ════ 성채 장인이 만든 놋쇠 태엽 매 · 겹겹의 놋쇠 깃 판(리벳) · 강철 날개 칼깃 · 가슴 속 톱니가 보이는 틈 ·
//   호박 렌즈 눈 · 등에 꽂힌 태엽 열쇠가 돈다 · 강철 발톱
//   p: flap · tilt · talon · key(태엽 각) · hurt
const FCK = 0.72;
const FCB = mat(ramp(0xb08a44), { tex: "metal", amp: 0.8, spec: 0.6 }), FCBF = mat(rampF(0x8a6a34), { tex: "metal", amp: 0.7, spec: 0.4 }), FCS = mat(ramp(0x9a9ca0), { tex: "metal", amp: 0.7, spec: 0.7 }), FCSF = mat(rampF(0x6e7074), { tex: "metal", amp: 0.6 });
function falconFrame(p = {}) {
  const W = 72, H = 56, S = sculpt(W, H, { k: FCK, ax: 34 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, tn = p.talon ?? 0, ky = p.key ?? 0, cx = 34, cy = 28;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 - (back ? 3 : 0), cy - 3), a = -Math.PI / 2 - 0.55 + (1 - up) * 1.0;
    S.add(ellR(...pol(root, a + 0.2, 9), 11, 5.4, a), back ? FCBF : FCB, { z: back ? -5 : 7, h: 2.4 });
    for (let k = 0; k < 7; k++) {
      const ak = a - 0.12 * k - 0.1, tip = pol(root, ak, 30 - k * 2.4), r0 = pol(root, ak, 12);
      S.add(polyF([pol(r0, ak + 1.57, 1.8), pol(tip, ak + 1.57, 0.6), tip, pol(r0, ak - 1.57, 1.2)]), back ? FCSF : FCS, { z: back ? -4.9 : 7.1 + k * 0.01, h: 1, prof: "sharp" });
      !back && S.add(capF(pol(root, ak, 13), pol(root, ak, 22 - k * 2), 0.4), FCB, { on: 1, lift: 0.3, h: 0.3 });
    }
    if (!back) for (const d of [6, 11]) S.add(ellR(...pol(root, a + 0.2, d), 0.8, 0.8), mat(ramp(0xe0c070), { spec: 0.8 }), { on: 1, lift: 0.5, h: 0.4 });
  };
  wing(1);
  // 꼬리 (놋쇠 판 부채)
  for (const d of [-0.2, 0, 0.2]) S.add(polyF([R(cx - 8, cy), R(cx - 21, cy + 1 + d * 12), R(cx - 22, cy + 3 + d * 12), R(cx - 8, cy + 3)]), d ? FCBF : FCB, { z: d ? -0.2 : 0, h: 1.2 });
  // 몸 (놋쇠 깃 판 겹 · 가슴 톱니 틈)
  S.add(ellR(...R(cx, cy + 1), 11, 7), FCB, { z: 2, h: 6 });
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const q = R(cx - 7 + k * 4 + r * 2, cy - 2 + r * 3.4); S.carve(minus(ellR(q[0], q[1] + 1, 2.4, 1.8), ellR(q[0], q[1] - 0.4, 2.4, 1.8)), 0.6); }
  const gc = R(cx + 4, cy + 4);
  S.add(ellR(gc[0], gc[1], 4.6, 3.4), DARK, { on: 1, lift: 0.1, h: 0.2 });
  for (const [dx, dy, r] of [[-1.4, 0, 2.2], [2, 0.6, 1.4]]) { const g = [gc[0] + dx, gc[1] + dy]; S.add(ellR(g[0], g[1], r, r), mat(ramp(0xd0a850), { spec: 0.8 }), { on: 1, lift: 0.4, h: 0.4 }); S.add(ellR(g[0], g[1], r * 0.35, r * 0.35), DARK, { on: 1, lift: 0.5, h: 0.2 }); }
  // 태엽 열쇠 (등)
  const k0 = R(cx - 2, cy - 6), k1 = R(cx - 3, cy - 11), kw = Math.cos(ky) * 4;
  S.add(capF(k0, k1, 0.8), FCS, { z: 1, h: 0.8 });
  S.add(U(ellR(k1[0] - kw * 0.5 - 1.6, k1[1] - 1.4, Math.abs(kw) * 0.4 + 0.8, 1.8), ellR(k1[0] + kw * 0.5 + 1.6, k1[1] - 1.4, Math.abs(kw) * 0.4 + 0.8, 1.8)), FCB, { z: 1.1, h: 1 });
  // 다리 (강철 · 발톱)
  for (const d of [-2, 2]) {
    const hp = R(cx + d + 2, cy + 6), ft = R(cx + d + 3 + tn * 6, cy + 12 + tn * 3);
    S.add(capF(hp, ft, 1.8, 1.4), FCS, { z: 3 + d * 0.1, h: 1.4 });
    for (const e of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 1 + e - tn * 0.6, 3.4), 0.7, 0.3), DARK, { z: 3.5, h: 0.5 });
  }
  // 머리 (놋쇠 · 강철 부리 · 호박 렌즈 눈)
  const hd = R(cx + 12, cy - 5);
  S.add(ellR(hd[0], hd[1], 5.6, 5), FCB, { z: 4, h: 4.6 });
  S.carve(capF([hd[0] - 3, hd[1] + 2.6], [hd[0] + 3, hd[1] + 3], 0.4), 0.7);
  S.add(polyF([[hd[0] + 3.4, hd[1] - 1.6], [hd[0] + 9, hd[1] - 0.2], [hd[0] + 8.6, hd[1] + 2.6], [hd[0] + 6.6, hd[1] + 2], [hd[0] + 3.4, hd[1] + 1.6]]), FCS, { z: 5, h: 1.6 });
  S.add(ellR(hd[0] + 1.6, hd[1] - 1.4, 2, 2), FCS, { z: 5, h: 1.2 });
  S.add(ellR(hd[0] + 1.8, hd[1] - 1.4, 1.3, 1.3), AMBG, { z: 5.2, h: 0.8 });
  !p.hurt && S.decal(hd[0] + 1.4, hd[1] - 2, 0xfff0c0);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxClockFalcon = {
  fw: Math.round(72 * FCK), fh: Math.round(56 * FCK), w: 20, h: 14, flying: !0,
  anims: { idle: [4, 8], move: [4, 11], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4], ky = (f / n) * T2;
    let P = { flap: fl, key: ky };
    if (nm === "move") P = { flap: fl, tilt: 0.15, key: ky };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, talon: 0.5 * t, key: ky * 2 };
    if (nm === "atk") P = { flap: -0.9, tilt: 0.7, talon: 1, key: ky };
    if (nm === "rec") P = { flap: fl, talon: 1 - t, key: ky };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return falconFrame(P);
  },
};

// ════ 날개 투구 ════ 주인 잃은 통투구가 흰 독수리 날개로 난다 · 눈틈과 숨구멍에서 호박빛 · 찢긴 붉은 깃털 장식 · 아래로 늘어진 사슬 자락
//   p: flap · tilt · hurt
const HMK = 0.72;
const WHT = mat(ramp(0xdcd2bc), { tex: "feather", amp: 0.9, dir: 0.4 }), WHTF = mat(rampF(0xb8ae98), { tex: "feather", amp: 0.8, dir: 0.4 });
function helmFrame(p = {}) {
  const W = 74, H = 60, S = sculpt(W, H, { k: HMK, ax: 36 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, ph = p.ph ?? 0, cx = 37, cy = 28;
  const R = (x, y) => { const c = Math.cos(tl * 0.6), s = Math.sin(tl * 0.6), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx - 6 - (back ? 2 : 0), cy - 2), a = -Math.PI / 2 - 0.7 + (1 - up) * 1.0;
    S.add(ellR(...pol(root, a + 0.2, 9), 12, 6, a), back ? WHTF : WHT, { z: back ? -5 : 7, h: 2.4 });
    for (let k = 0; k < 7; k++) { const ak = a - 0.13 * k - 0.1, tip = pol(root, ak, 31 - k * 2.2); S.add(capF(pol(root, ak, 10), tip, 2.4, 0.8), back ? WHTF : mat(ramp(k < 2 ? 0xc8a060 : 0xe0d8c4), { tex: "feather", amp: 1, dir: ak }), { z: back ? -4.9 : 7.1 + k * 0.01, h: 1 }); }
  };
  wing(1);
  // 사슬 자락
  const mp = [];
  for (let k = 0; k <= 6; k++) mp.push(R(cx - 9 + k * 3, cy + 15 + (k % 2) * 2 + Math.sin(ph + k) * 0.8));
  S.add(polyF([R(cx - 10, cy + 8), R(cx + 10, cy + 8), ...mp.reverse()]), MAIL, { z: 0, h: 3 });
  // 깃털 장식
  for (let k = 0; k < 5; k++) S.add(capF(R(cx - 2, cy - 12), R(cx - 12 - k * 2.6, cy - 10 + k * 3 + Math.sin(ph + k) * 1.4), 2 - k * 0.2, 0.7), k % 2 ? REDF : RED, { z: 1, h: 1.4 });
  S.add(U(polyF([R(cx - 10, cy - 8), R(cx + 10, cy - 8), R(cx + 11, cy + 12), R(cx - 10, cy + 12)]), ellR(...R(cx, cy - 8), 10, 3.8)), STEEL, { z: 2, h: 10 });
  S.add(capF(R(cx + 6, cy - 10), R(cx + 7, cy + 11), 1.2), GOLD, { on: 1, lift: 0.5, h: 0.6 });
  S.add(capF(R(cx - 3, cy - 1), R(cx + 11, cy - 1), 1), GOLD, { on: 1, lift: 0.5, h: 0.6 });
  S.add(capF(R(cx - 10, cy + 11), R(cx + 11, cy + 11), 0.9), GOLD, { on: 1, lift: 0.5, h: 0.5 });
  S.carve(capF(R(cx - 1, cy + 1.4), R(cx + 11, cy + 1.4), 1), 2, !1);
  if (!p.hurt) for (let x = 0; x <= 10; x += 1.4) S.decal(...R(cx + x, cy + 1.4), x % 3 < 1.4 ? 0xffe090 : 0xffa840);
  for (const [x, y] of [[cx + 8, cy + 5], [cx + 8, cy + 7.6], [cx + 5.6, cy + 6.2], [cx + 5.6, cy + 8.8]]) S.decal(...R(x, y), 0xffa840);
  S.carve(capF(R(cx - 6, cy + 4), R(cx - 2, cy + 8), 0.5), 0.8);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxWingHelm = {
  fw: Math.round(74 * HMK), fh: Math.round(60 * HMK), w: 18, h: 18, flying: !0,
  anims: { idle: [4, 8], move: [4, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4], ph = (f / n) * T2;
    let P = { flap: fl, ph };
    if (nm === "move") P = { flap: fl, tilt: 0.15, ph };
    if (nm === "wind") P = { flap: 1, tilt: -0.5 * t, ph };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.7, ph };
    if (nm === "rec") P = { flap: fl, tilt: 0.3 * (1 - t), ph };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, ph };
    return helmFrame(P);
  },
};

// ════ 망령 전령 ════ 바랜 붉은 겉옷과 두건 모자(긴 꼬리)를 걸친 반투명 망령 · 아래는 연기처럼 흩어진다 · 텅 빈 얼굴에 호박빛 눈 ·
//   깃발 늘어진 긴 놋쇠 나팔
//   p: ph · blow(0~1) · raise · hurt
const HRK = 0.72;
const GHOST = mat(ramp(0xd0e0c8, { hi: 0.6 }), { tex: "glass", amp: 0.4, spec: 0.5 }), GHOSTF = mat(ramp(0xa8c0b0, { hi: 0.5 }), { tex: "glass", amp: 0.4 });
const FRED = mat(ramp(0x8a5450), { tex: "cloth", amp: 0.9 }), FREDF = mat(rampF(0x6a4442), { tex: "cloth", amp: 0.8 });
function heraldFrame(p = {}) {
  const W = 104, H = 92, S = sculpt(W, H, { k: HRK, ax: 32 });
  const ph = p.ph ?? 0, bl = p.blow ?? 0, rs = p.raise ?? 0, cx = 30, Y = 40 + Math.sin(ph) * 1.5;
  // 연기 꼬리
  const tl = [];
  for (let k = 0; k <= 5; k++) tl.push([cx - 2 + Math.sin(ph + k * 0.9) * (2 + k) - k * 1.6, Y + 22 + k * 7]);
  S.add(U(...tl.slice(0, -1).map((q, k) => capF(q, tl[k + 1], 9 - k * 1.5, 8 - k * 1.5))), GHOSTF, { z: -1, h: 3 });
  for (let k = 1; k < 5; k++) S.add(capF(tl[k], [tl[k][0] + 6 - k, tl[k][1] + 4], 1.2, 0.4), GHOST, { z: -0.9, h: 0.6 });
  // 먼 팔 (나팔 가운데를 받침)
  const mouth = [cx + 9, Y - 13], ta = -0.12 - rs * 0.3, bell = pol(mouth, ta, 36);
  const hF = pol(mouth, ta, 14);
  S.add(U(capF([cx - 4, Y - 2], [cx + 2, Y + 8], 3, 2.6), capF([cx + 2, Y + 8], hF, 2.6, 2.2)), FREDF, { z: -2, h: 2 });
  S.add(ellR(hF[0], hF[1] + 1, 2.4, 2.2), GHOSTF, { z: -1.8, h: 1.6 });
  // 몸 (겉옷)
  S.add(U(ellR(cx, Y + 4, 11, 13), polyF([[cx - 10, Y + 4], [cx + 10, Y + 4], [cx + 11, Y + 26], [cx + 5, Y + 23], [cx - 1, Y + 27], [cx - 7, Y + 23], [cx - 12, Y + 26]])), FRED, { z: 1, h: 9 });
  for (const dx of [-6, 0, 6]) S.carve(capF([cx + dx, Y + 12], [cx + dx + 0.6, Y + 24], 0.5), 0.7);
  sun(S, [cx + 2, Y + 6], 5, { M: mat(ramp(0xa8904c), { tex: "metal", amp: 0.6 }) });
  // 머리 (텅 빈 얼굴) + 두건 모자 (긴 꼬리)
  const hx = cx + 2, hy = Y - 14;
  S.add(ellR(hx + 2.4, hy + 1.4, 5.6, 6.4), GHOST, { z: 3, h: 4 });
  S.add(polyF([[hx - 2, hy + 4], [hx + 6, hy + 4], [hx + 4, hy + 12], [hx + 1, hy + 9], [hx - 1, hy + 12]]), GHOST, { z: 2.9, h: 2 });
  S.add(ellR(hx + 3.6, hy - 0.4, 1.4, 1.8), DARK, { on: 1, lift: 0.2, h: 0.2 }).add(ellR(hx + 6, hy - 0.4, 1.2, 1.6), DARK, { on: 1, lift: 0.2, h: 0.2 });
  !p.hurt && S.decal(hx + 3.6, hy - 0.2, 0xffb048).decal(hx + 6, hy - 0.2, 0xffb048).decal(hx + 3.6, hy + 0.6, 0xffe090).decal(hx + 6, hy + 0.6, 0xffe090);
  S.add(ellR(hx + 4.6, hy + 4.4, 1.6, 1.2), DARK, { on: 1, lift: 0.2, h: 0.2 });
  const lp = [hx - 6, hy - 5], ltip = [hx - 16 + Math.sin(ph) * 2, hy + 12 + Math.cos(ph) * 2];
  S.add(U(capF(lp, lerp(lp, ltip, 0.5), 2.6, 2), capF(lerp(lp, ltip, 0.5), ltip, 2, 1.2)), FREDF, { z: 2, h: 1.6 });
  S.add(U(ellR(hx, hy - 4, 8, 4.4), polyF([[hx - 8, hy - 4], [hx - 6, hy + 4], [hx - 3, hy - 1]])), FRED, { z: 4, h: 4 });
  S.add(capF([hx - 7, hy - 1.4], [hx + 7, hy - 2.4], 1.6), FREDF, { z: 4.2, h: 1.6 });
  // 나팔 + 늘어진 깃발
  S.add(capF(mouth, bell, 1, 1), BRASS, { z: 6, h: 1 });
  S.add(polyF([pol(bell, ta + 1.57, 1), pol(pol(bell, ta, 7), ta + 1.57, 4.6 + bl), pol(pol(bell, ta, 7), ta - 1.57, 4.6 + bl), pol(bell, ta - 1.57, 1)]), BRASS, { z: 6.2, h: 2 });
  S.add(ellR(...pol(bell, ta, 7), 1.2, 4.4 + bl, ta), bl > 0.4 ? AMBY : mat(ramp(0x6a5020)), { z: 6.3, h: 0.6 });
  for (const q of [0.3, 0.6]) S.add(ellR(...pol(mouth, ta, 36 * q), 1.4, 1.4), BRASS, { z: 6.1, h: 1 });
  const f0 = pol(mouth, ta, 12), f1 = pol(mouth, ta, 26);
  const w = Math.sin(ph) * 1.5;
  S.add(polyF([f0, f1, [f1[0] + w, f1[1] + 14], [lerp(f0, f1, 0.5)[0] + w, lerp(f0, f1, 0.5)[1] + 10], [f0[0] + w, f0[1] + 14]]), FRED, { z: 6.4, h: 1, prof: "flat" });
  sun(S, [lerp(f0, f1, 0.5)[0] + w * 0.5, lerp(f0, f1, 0.5)[1] + 5], 3.4, { M: mat(ramp(0xa8904c), { tex: "metal", amp: 0.6 }) });
  // 가까운 팔 (입에 댄 나팔을 쥠)
  const hN = pol(mouth, ta, 5);
  S.add(U(capF([cx + 4, Y - 2], [cx + 6, Y + 6], 3, 2.6), capF([cx + 6, Y + 6], hN, 2.6, 2.2)), FRED, { z: 7, h: 2 });
  S.add(ellR(hN[0], hN[1] + 1, 2.4, 2.2), GHOST, { z: 7.2, h: 1.6 });
  const C = S.render({ rim: !0 });
  if (bl > 0.4) { const P = toPx(W, H, HRK, 32); for (let k = 0; k < 3; k++) for (let j = -2; j <= 2; j++) { const q = P(...pol(pol(bell, ta, 12 + k * 5), ta + 1.57, j * (2 + k))); C.px(q[0], q[1], 0xffe8b0); } }
  return fin(C, p);
}
export const pxHerald = {
  fw: Math.round(104 * HRK), fh: Math.round(92 * HRK), w: 16, h: 30, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [3, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, raise: t };
    if (nm === "atk") P = { ph, raise: 0.6, blow: 1 };
    if (nm === "rec") P = { ph, raise: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return heraldFrame(P);
  },
};

// ════ [정예] 전투 그리폰 ════ 기사를 잃고 혼자 남은 기사단 군용 그리폰 · 가슴 판금 · 붉은 안장 천과 빈 안장 · 머리 판금과 깃털 장식 ·
//   독수리 앞몸(흰 머리 · 갈고리 부리 · 호박빛 눈 · 귀깃 · 황금빛 가슴 깃) + 사자 뒷몸(황갈색 털 · 꼬리 술) ·
//   층층이 겹친 큰 날개 · 노란 비늘 다리와 검은 발톱
//   p: flap · tilt · talon · jaw · hurt
const GFK = 0.7;
const GFE = mat(ramp(0x8a6038), { tex: "feather", amp: 1, dir: 0.3, spec: 0.25 }), GFEF = mat(rampF(0x6a4a2c), { tex: "feather", amp: 0.9, dir: 0.3 }), GFG = mat(ramp(0xc89a58), { tex: "feather", amp: 0.9, dir: 1.2 });
const LION = mat(ramp(0xc09a60), { tex: "fur", amp: 0.9, dir: 0.2 }), LIONF = mat(rampF(0x9a7a48), { tex: "fur", amp: 0.8, dir: 0.2 });
function griffonFrame(p = {}) {
  const W = 140, H = 112, S = sculpt(W, H, { k: GFK, ax: 66 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, tn = p.talon ?? 0, jw = p.jaw ?? 0, cx = 66, cy = 60;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 - (back ? 4 : 0), cy - 8), a = -Math.PI / 2 - 0.5 + (1 - up) * 1.0, M0 = back ? GFEF : GFE;
    // 덮깃 (안쪽 층) → 첫째날개깃 (긴 깃 여덟)
    for (let k = 0; k < 9; k++) { const ak = a - 0.1 * k - 0.05, tip = pol(root, ak, 48 - k * 3.4); S.add(capF(pol(root, ak, 20), tip, 3.4, 1), back ? GFEF : mat(ramp(k % 3 === 0 ? 0x5a3e26 : 0x7a5434), { tex: "feather", amp: 1, dir: ak }), { z: back ? -6 : 9 + k * 0.01, h: 1.2 }); }
    S.add(ellR(...pol(root, a + 0.1, 14), 17, 8, a), M0, { z: back ? -5.8 : 9.2, h: 3 });
    for (let k = 0; k < 6; k++) { const q = pol(pol(root, a + 0.1, 8 + k * 3.6), a + 1.57, 3); S.add(ellR(q[0], q[1], 3.4, 2.4, a), back ? GFEF : GFG, { z: back ? -5.7 : 9.3, lift: 0.4, h: 1 }); }
  };
  wing(1);
  // 사자 꼬리 (술)
  const t0 = R(cx - 32, cy + 2), t1 = R(cx - 46, cy + 10), t2 = R(cx - 56, cy + 4 + Math.sin(fl) * 3);
  S.add(U(capF(t0, t1, 2.4, 1.8), capF(t1, t2, 1.8, 1.4)), LION, { z: 0, h: 1.6 });
  S.add(ellR(t2[0] - 2, t2[1], 4, 3, 0.4), mat(ramp(0x5a3a22), { tex: "fur", amp: 1.1 }), { z: 0.1, h: 2 });
  // 사자 뒷다리 (먼 쪽)
  const hindL = (far) => { const hp = R(cx - 22 + (far ? -2 : 2), cy + 8), hk = R(cx - 30 + (far ? -2 : 0), cy + 22), pw = R(cx - 24 + (far ? -3 : 0), cy + 32); S.add(U(capF(hp, hk, far ? 6 : 7, 3.4), capF(hk, pw, 3, 2.6)), far ? LIONF : LION, { z: far ? -3 : 6, h: 3 }); S.add(ellR(pw[0] + 2, pw[1], 4, 2.6), far ? LIONF : LION, { z: far ? -2.9 : 6.1, h: 2 }); };
  hindL(1);
  // 몸 (사자 엉덩이 → 독수리 가슴)
  S.add(U(ellR(...R(cx - 20, cy + 4), 17, 13), ellR(...R(cx + 4, cy), 18, 15)), LION, { z: 1, h: 13 });
  S.add(ellR(...R(cx + 8, cy - 2), 15, 15), GFG, { z: 1.5, h: 13 });
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const q = R(cx + 2 + k * 4.4 + (r % 2) * 2, cy - 8 + r * 5); S.carve(minus(ellR(q[0], q[1] + 1, 2.6, 2), ellR(q[0], q[1] - 0.4, 2.6, 2)), 0.5); }
  // 마갑: 가슴 판금 · 붉은 안장 천(황금 테) · 빈 안장과 늘어진 등자
  S.add(polyF([R(cx + 4, cy - 9), R(cx + 17, cy - 12), R(cx + 22, cy + 1), R(cx + 15, cy + 11), R(cx + 5, cy + 8)]), STEEL, { lift: 1.4, h: 3 });
  S.add(capF(R(cx + 5, cy - 1), R(cx + 21, cy - 4), 0.8), GOLD, { on: 1, lift: 0.5, h: 0.4 });
  sun(S, R(cx + 13, cy + 3), 4);
  const cl = [R(cx - 32, cy + 4), R(cx - 26, cy + 12), R(cx - 16, cy + 9), R(cx - 6, cy + 12), R(cx + 2, cy + 6)];
  S.add(polyF([R(cx - 30, cy - 8), R(cx - 2, cy - 12), ...cl.slice().reverse()]), RED, { lift: 1.2, h: 2.4 });
  S.add(U(...cl.slice(0, -1).map((q, k) => capF(q, cl[k + 1], 1))), GOLD, { lift: 1.8, h: 0.6 });
  S.add(U(ellR(...R(cx - 13, cy - 11), 9, 3.4), ellR(...R(cx - 21, cy - 13), 2.4, 3.2), ellR(...R(cx - 5, cy - 13), 2, 3.6)), LEATH, { lift: 2.2, h: 3 });
  S.add(capF(R(cx - 12, cy - 8), R(cx - 11, cy + 15), 0.45), LEATH, { lift: 3, h: 0.3 });
  S.add(minus(ellR(...R(cx - 11, cy + 17), 2.2, 2.2), ellR(...R(cx - 11, cy + 17), 1.1, 1.1)), STEEL, { lift: 3, h: 0.6 });
  // 독수리 앞다리 (노란 비늘 · 검은 발톱)
  const foreL = (far) => {
    const hp = R(cx + 10 + (far ? -3 : 0), cy + 10), ft = R(cx + 16 + tn * 14 + (far ? -3 : 0), cy + 26 - tn * 6);
    S.add(capF(hp, lerp(hp, ft, 0.45), far ? 5 : 5.6, 3.4), far ? GFEF : GFG, { z: far ? -2 : 7, h: 3 });
    S.add(capF(lerp(hp, ft, 0.4), ft, 2.2, 1.8), far ? mat(rampF(0xb08a30), { tex: "scale" }) : mat(ramp(0xd8a840), { tex: "scale", amp: 1 }), { z: far ? -1.9 : 7.1, h: 1.6 });
    for (const e of [-0.6, 0, 0.6]) { const c0 = pol(ft, 0.6 + e - tn * 0.6, 4.4); S.add(U(capF(ft, c0, 1, 0.7), capF(c0, pol(c0, 1.5 + e - tn * 0.5, 3), 0.7, 0.2)), DARK, { z: far ? -1.8 : 7.2, h: 0.6 }); }
  };
  foreL(1);
  // 목 + 머리 (흰 깃 · 귀깃 · 부리 · 호박 눈 · 눈썹 뼈)
  const hd = R(cx + 24, cy - 20);
  S.add(capF(R(cx + 10, cy - 8), hd, 10, 8), mat(ramp(0xe0d4b8), { tex: "feather", amp: 0.9, dir: 1.4 }), { z: 3, h: 8 });
  for (const [a, l, z] of [[-2.6, 10, 3.4], [-2.35, 8, 5.4]]) S.add(U(capF([hd[0] - 4, hd[1] - 5], pol([hd[0] - 4, hd[1] - 5], a, l), 2, 0.6)), mat(ramp(0xc8b890), { tex: "feather" }), { z, h: 1.4 });
  S.add(ellR(hd[0], hd[1], 9, 8), mat(ramp(0xece4d0), { tex: "feather", amp: 0.8, dir: 0.8 }), { z: 5, h: 7 });
  const bk = mat(ramp(0xd8a840), { spec: 0.5 });
  S.add(polyF([[hd[0] + 5, hd[1] - 3.4], [hd[0] + 15, hd[1] - 1.6], [hd[0] + 17, hd[1] + 2.6], [hd[0] + 14.6, hd[1] + 5.6], [hd[0] + 13, hd[1] + 2.4], [hd[0] + 5, hd[1] + 2]]), bk, { z: 6, h: 2.6 });
  S.add(polyF([[hd[0] + 5, hd[1] + 2.6 + jw], [hd[0] + 12, hd[1] + 3 + jw * 3], [hd[0] + 6, hd[1] + 5 + jw * 2]]), mat(ramp(0xb88a30)), { z: 5.8, h: 1.4 });
  jw > 0.3 && S.add(polyF([[hd[0] + 5, hd[1] + 2], [hd[0] + 12, hd[1] + 2.4], [hd[0] + 12, hd[1] + 3 + jw * 3]]), mat(ramp(0x6a2a2a)), { z: 5.9, h: 0.4 });
  S.add(capF([hd[0] - 1, hd[1] - 4.4], [hd[0] + 5, hd[1] - 3.6], 1.4, 1), mat(ramp(0xc8bca0), { tex: "feather" }), { z: 6.2, h: 1.4 });
  S.add(polyF([[hd[0] - 7, hd[1] - 5], [hd[0] + 3, hd[1] - 7.4], [hd[0] + 9, hd[1] - 3.6], [hd[0] + 4, hd[1] - 3.6], [hd[0] - 5, hd[1] - 1.6]]), STEEL, { z: 6.4, h: 1.6 });
  S.add(capF([hd[0] - 5, hd[1] - 5], [hd[0] + 7, hd[1] - 4.4], 0.5), GOLD, { on: 1, lift: 0.4, h: 0.3 });
  for (let k = 0; k < 4; k++) S.add(capF([hd[0] - 3, hd[1] - 7], [hd[0] - 12 - k * 2.4, hd[1] - 9 + k * 2.6], 1.6 - k * 0.2, 0.6), k % 2 ? REDF : RED, { z: 6.3, h: 1.2 });
  !p.hurt && S.decal(hd[0] + 2.6, hd[1] - 2, 0x120c08).decal(hd[0] + 2, hd[1] - 2.4, 0xffb040).decal(hd[0] + 3.2, hd[1] - 1.6, 0xffb040);
  hindL(0), foreL(0);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxGriffon = {
  fw: Math.round(140 * GFK), fh: Math.round(112 * GFK), w: 40, h: 34, flying: !0,
  anims: { idle: [4, 7], move: [4, 9], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1], gust: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, talon: 0.4 * t, jaw: 0.6 * t };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.55, talon: 1, jaw: 1 };
    if (nm === "rec") P = { flap: fl, talon: 1 - t };
    if (nm === "gust") P = { flap: [1, -1, 1, -1][f], tilt: -0.2, jaw: 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, jaw: 1 };
    return griffonFrame(P);
  },
};
