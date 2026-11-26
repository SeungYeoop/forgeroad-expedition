// 샌드글래스 몬스터 12종 (조각 도구, 오른쪽을 본다) — 천장 틈에서 쏟아지는 모래 폭포 · 모래 더미 · 먼지 빛 · 묻힌 옛 무덤
//   위 줄: 모래 진드기 · 미라 익룡 · 사암 가면 · [정예] 모래폭포 거인
//   가운데 줄: 모래 상어 · 천산갑 · 토용 병사 · [정예] 토용 장군
//   아래 줄: 화석 덩이 · 살아난 암모나이트 · 모래 입 · [정예] 화석 폭군
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm, leg } from "./px_ah.js";

const SAND = mat(ramp(0xd8b880), { tex: "stone", amp: 0.9 }), SANDF = mat(rampF(0xb89a68), { tex: "stone", amp: 0.8 }), SANDD = mat(ramp(0x9a7a50), { tex: "stone", amp: 1 });
const SST = mat(ramp(0xc89a68), { tex: "stone", amp: 1 }), SSTF = mat(rampF(0xa07a50), { tex: "stone", amp: 0.9 });
const CLAY = mat(ramp(0xb0704a), { tex: "clay", amp: 1 }), CLAYF = mat(rampF(0x8e5a3c), { tex: "clay", amp: 0.9 }), CLAYD = mat(ramp(0x7a4a32), { tex: "clay", amp: 1 });
const FOS = mat(ramp(0x8a7c68), { tex: "stone", amp: 1.1, spec: 0.3 }), FOSF = mat(rampF(0x6e6252), { tex: "stone", amp: 1 }), BONE = mat(ramp(0xd8ccb0), { tex: "stone", amp: 0.5, spec: 0.3 });
const TURQ = mat(ramp(0x3aa0a0), { spec: 0.5 }), TURQG = mat(rampGlow(0x50e0d0)), AMBG = mat(rampGlow(0xffb040)), DARK = mat(ramp(0x1a1612)), LINEN = mat(ramp(0xc8b890), { tex: "cloth", amp: 1.1 }), LINENF = mat(rampF(0xa49470), { tex: "cloth", amp: 1 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 흘러내리는 모래 줄기 (렌더 뒤 픽셀)
function sandFall(C, P, x, y0, y1, ph, w = 2) { for (let y = y0; y < y1; y += 1.4) for (let j = 0; j < w; j++) { const q = P(x + j + Math.sin(y * 0.4 + ph * 3) * 0.6, y); C.px(q[0], q[1], (Math.floor(y + ph * 6) + j) % 3 ? 0xd8b880 : 0xf0d8a0); } }

// ════ 모래 진드기 ════ 피를 빨아 부푼 가죽 몸통 · 앞쪽 검은 등판 · 작은 머리와 뾰족한 입틀 · 다리 여덟 · 천장에서 툭 떨어져 덮친다
//   p: ph · fat · leap · hurt
const TKK = 0.72;
const TCK = mat(ramp(0x9a7a5a), { tex: "leather", amp: 0.9, spec: 0.4 }), TCKF = mat(rampF(0x7a5e44), { tex: "leather", amp: 0.8 }), TSH = mat(ramp(0x3a2a22), { tex: "metal", amp: 0.6, spec: 0.6 });
function tickFrame(p = {}) {
  const W = 68, H = 52, G = H - 1, S = sculpt(W, H, { k: TKK, ax: 32 });
  const ph = p.ph ?? 0, ft = p.fat ?? 0, lp = p.leap ?? 0, cx = 30, by = G - 12 - lp * 8;
  const legs = (far) => { for (let k = 0; k < 4; k++) { const r0 = [cx + 2 + k * 2.6, by + 2], a = Math.sin(ph + k * 1.6 + (far ? 3 : 0)) * 3, kn = [cx - 8 + k * 8 + a, by - 6 - lp * 4], f0 = [cx - 14 + k * 11 + a * 1.4, G - 0.5 - lp * 6]; S.add(U(capF(r0, kn, 1.1, 0.9), capF(kn, f0, 0.9, 0.4)), far ? TCKF : TSH, { z: far ? -2 : 5, h: 0.7 }); } };
  legs(1);
  S.add(ellR(cx - 4, by - 2, 14 + ft * 3, 10 + ft * 3), TCK, { z: 1, h: 10 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 14 + k * 6, by - 10], [cx - 15 + k * 6, by + 6], 0.4), 0.5);
  for (const [x, y] of [[cx - 10, by - 6], [cx - 2, by - 8], [cx - 6, by + 2]]) S.add(ellR(x, y, 1.6, 1.2), TCKF, { on: 1, lift: 0.2, h: 0.3 });
  S.add(ellR(cx + 7, by - 3, 6, 5), TSH, { z: 2, h: 4 });
  S.add(ellR(cx + 13, by - 1, 3, 2.6), TSH, { z: 2.4, h: 2 });
  S.add(polyF([[cx + 15, by - 2], [cx + 20, by], [cx + 15, by + 1]]), mat(ramp(0x6a4a3a)), { z: 2.5, h: 0.6, prof: "sharp" });
  !p.hurt && S.decal(cx + 12, by - 2, 0xd8f0a0);
  legs(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxTick = {
  fw: Math.round(68 * TKK), fh: Math.round(52 * TKK), w: 22, h: 16,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1], fed: [4, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { ph };
    if (nm === "wind") P = { leap: -0.3 * t };
    if (nm === "atk") P = { leap: [0.8, 1, 0.5][f] };
    if (nm === "rec") P = { leap: 0 };
    if (nm === "fed") P = { fat: 1, ph: Math.sin(ph) * 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, leap: 0.2 };
    return tickFrame(P);
  },
};

// ════ 미라 익룡 ════ 무덤에 함께 묻혔던 고대 익룡 · 아마포 붕대로 감긴 몸 · 해진 가죽 날개막과 비치는 날개뼈 · 볏 달린 긴 부리 두개골 · 빛나는 눈
//   p: flap · tilt · jaw · hurt
const PTK = 0.7;
const PWM = mat(ramp(0x7a5a44), { tex: "skin", amp: 0.9 }), PWMF = mat(rampF(0x5e4434), { tex: "skin", amp: 0.8 });
function pteroFrame(p = {}) {
  const W = 128, H = 72, S = sculpt(W, H, { k: PTK, ax: 60 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, jw = p.jaw ?? 0, cx = 58, cy = 36;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const d = back ? -1 : 1, up = fl * (back ? 0.85 : 1), root = R(cx + 2, cy - 2), el = R(cx - 6, cy - 14 - up * 12), wr = R(cx - 20, cy - 10 - up * 22), tip = R(cx - 52, cy - 4 - up * 26);
    S.add(polyF([root, el, wr, tip, R(cx - 40, cy + 2 - up * 10), R(cx - 24, cy + 4 - up * 4), R(cx - 10, cy + 4)]), back ? PWMF : PWM, { z: back ? -5 : 7, h: 1.4, prof: "flat" });
    for (const [a, b] of [[R(cx - 34, cy - 2 - up * 14), R(cx - 28, cy + 2 - up * 8)], [R(cx - 16, cy + 2), R(cx - 20, cy - 4 - up * 8)]]) S.carve(capF(a, b, 0.8), 1.2, !1);
    S.add(U(capF(root, el, 2, 1.6), capF(el, wr, 1.6, 1.2), capF(wr, tip, 1.2, 0.5)), back ? mat(rampF(0xa89a80)) : BONE, { z: back ? -4.8 : 7.2, h: 1 });
    for (const q of [0.3, 0.6]) S.add(capF(lerp(root, el, q), pol(lerp(root, el, q), 1.2, 3), 1.6, 1), back ? LINENF : LINEN, { z: back ? -4.7 : 7.3, h: 0.8 });
  };
  wing(1);
  // 꼬리 (짧은 · 붕대)
  S.add(capF(R(cx - 10, cy + 2), R(cx - 22, cy + 6), 2, 1), LINENF, { z: 0, h: 1 });
  // 몸 (붕대 감긴) + 다리
  S.add(ellR(...R(cx, cy + 1), 12, 6.4), LINEN, { z: 2, h: 5 });
  for (let k = 0; k < 6; k++) S.carve(capF(R(cx - 10 + k * 4, cy - 5), R(cx - 13 + k * 4, cy + 6), 0.4), 0.7);
  for (const d of [-2, 3]) S.add(U(capF(R(cx + d, cy + 5), R(cx + d - 4, cy + 14), 1.2, 0.8)), LINENF, { z: 2.4, h: 0.8 });
  // 목 + 머리 (볏 · 긴 부리)
  const hd = R(cx + 18, cy - 8);
  S.add(capF(R(cx + 8, cy - 2), hd, 3.6, 2.6), LINEN, { z: 3, h: 2.4 });
  for (let k = 0; k < 3; k++) S.carve(capF(lerp(R(cx + 8, cy - 2), hd, 0.2 + k * 0.25), pol(lerp(R(cx + 8, cy - 2), hd, 0.2 + k * 0.25), 2, 3), 0.4), 0.6);
  S.add(ellR(hd[0], hd[1], 5, 4), BONE, { z: 4, h: 3 });
  S.add(polyF([[hd[0] - 2, hd[1] - 2], [hd[0] - 18, hd[1] - 10], [hd[0] - 14, hd[1] - 6], [hd[0] + 2, hd[1] - 3]]), BONE, { z: 3.8, h: 1.4 });
  S.add(polyF([[hd[0] + 3, hd[1] - 2], [hd[0] + 26, hd[1] + 1], [hd[0] + 3, hd[1] + 1]]), BONE, { z: 4.2, h: 1.2, prof: "sharp" });
  S.add(polyF([[hd[0] + 3, hd[1] + 1.4 + jw], [hd[0] + 24, hd[1] + 2 + jw * 5], [hd[0] + 3, hd[1] + 3 + jw]]), mat(ramp(0xb8ac90)), { z: 4.1, h: 1, prof: "sharp" });
  S.add(ellR(hd[0] + 1, hd[1] - 0.6, 2, 1.8), DARK, { z: 4.3, lift: 0.1, h: 0.3 });
  S.add(capF([hd[0] - 3, hd[1] + 2], [hd[0] + 4, hd[1] + 3], 1.6, 1), LINENF, { z: 4.4, h: 0.8 });
  !p.hurt && S.decal(hd[0] + 1, hd[1] - 0.6, 0x50e0d0);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxPtero = {
  fw: Math.round(128 * PTK), fh: Math.round(72 * PTK), w: 30, h: 16, flying: !0,
  anims: { idle: [4, 6], move: [4, 8], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], shriek: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, jaw: 0.5 * t };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.6, jaw: [1, 0.3, 0][f] };
    if (nm === "rec") P = { flap: fl, jaw: 0 };
    if (nm === "shriek") P = { flap: [1, 0.6, 1, 0.6][f], jaw: 1, tilt: -0.2 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, jaw: 1 };
    return pteroFrame(P);
  },
};

// ════ 사암 가면 ════ 무덤 문에 걸려 있던 사암 의식 가면 · 엄한 얼굴 새김 · 청록 상감 눈 · 갈라진 틈에서 모래가 샌다 · 둘레를 도는 돌 조각
//   p: ph · glare · tilt · hurt
const MKK = 0.72;
function maskFrame(p = {}) {
  const W = 60, H = 70, S = sculpt(W, H, { k: MKK, ax: 30 });
  const ph = p.ph ?? 0, gl = p.glare ?? 0, tl = p.tilt ?? 0, cx = 30, cy = 32;
  const R = (x, y) => { const c = Math.cos(tl * 0.3), s = Math.sin(tl * 0.3), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  for (let k = 0; k < 4; k++) { const a = ph + k * 1.57, q = R(cx + Math.cos(a) * 20, cy + Math.sin(a) * 8); if (Math.sin(a) < 0) S.add(ellR(q[0], q[1], 2.6, 2), SSTF, { z: -2, h: 1.4 }); }
  // 가면 판 (볼록한 타원 · 머리 장식 테)
  S.add(U(ellR(...R(cx, cy), 15, 20)), SST, { z: 1, h: 8 });
  S.add(polyF([R(cx - 16, cy - 14), R(cx - 10, cy - 26), R(cx, cy - 30), R(cx + 10, cy - 26), R(cx + 16, cy - 14)]), SST, { z: 1.2, h: 4 });
  for (let k = 0; k < 5; k++) S.add(capF(R(cx - 13 + k * 6.4, cy - 22 + Math.abs(k - 2) * 2), R(cx - 13 + k * 6.4, cy - 15), 1), TURQ, { on: 1, lift: 0.3, h: 0.3 });
  // 얼굴 새김: 눈썹 · 눈 · 코 · 입
  for (const d of [-1, 1]) { S.carve(capF(R(cx + d * 3, cy - 7), R(cx + d * 11, cy - 8), 0.7), 1); S.add(ellR(...R(cx + d * 6.6, cy - 3), 3.4, 2, 0.15 * d), gl ? TURQG : TURQ, { on: 1, lift: 0.4, h: 0.4 }); }
  S.add(polyF([R(cx - 1.6, cy - 4), R(cx + 1.6, cy - 4), R(cx + 2.6, cy + 6), R(cx - 2.6, cy + 6)]), SST, { lift: 1, h: 1.4 });
  S.carve(capF(R(cx - 6, cy + 11), R(cx + 6, cy + 11), 0.8), 1.2);
  S.add(capF(R(cx - 4, cy + 15), R(cx + 4, cy + 15), 1.4), SSTF, { lift: 0.4, h: 0.6 });
  // 갈라진 틈
  for (const [a, b] of [[R(cx + 8, cy - 18), R(cx + 5, cy - 9)], [R(cx + 5, cy - 9), R(cx + 9, cy + 2)], [R(cx - 10, cy + 6), R(cx - 6, cy + 16)]]) S.carve(capF(a, b, 0.5), 1.2);
  !p.hurt && S.decal(...R(cx + 7, cy - 3.2), gl ? 0xffffff : 0xa0fff0).decal(...R(cx - 6, cy - 3.2), gl ? 0xffffff : 0xa0fff0);
  for (let k = 0; k < 4; k++) { const a = ph + k * 1.57, q = R(cx + Math.cos(a) * 20, cy + Math.sin(a) * 8); if (Math.sin(a) >= 0) S.add(ellR(q[0], q[1], 2.6, 2), SST, { z: 3, h: 1.4 }); }
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, MKK, 30);
  sandFall(C, P, R(cx + 9, cy + 2)[0], R(cx + 9, cy + 2)[1], H - 2, ph, 1);
  if (gl) for (let k = 0; k < 8; k++) { const q = P(cx + 10 + k * 3, cy - 3 + k * 0.4); C.px(q[0], q[1], 0xa0fff0); }
  return fin(C, p);
}
export const pxMask = {
  fw: Math.round(60 * MKK), fh: Math.round(70 * MKK), w: 20, h: 26, flying: !0,
  anims: { idle: [6, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, tilt: Math.sin(ph) * 0.1 };
    if (nm === "move") P = { ph, tilt: 0.2 };
    if (nm === "wind") P = { ph: ph * 2, tilt: -0.3 * t, glare: f > 1 ? 1 : 0 };
    if (nm === "atk") P = { ph, glare: 1, tilt: 0.1 };
    if (nm === "rec") P = { ph, tilt: 0 };
    if (nm === "hurt") P = { hurt: f === 0, ph, tilt: -0.4 };
    return maskFrame(P);
  },
};

// ════ [정예] 모래폭포 거인 ════ 천장에서 쏟아지는 모래가 뭉쳐 선 거인 · 다져진 모래 몸에 박힌 사암 판 · 바위 머리의 빛나는 눈틈 ·
//   바위 주먹 · 어깨와 머리에서 끊임없이 모래가 흘러내리고 다리는 모래 더미로 녹아든다
//   p: bob · sw(내려치기) · breath · ph · hurt
const SCK = 0.7;
function colossusFrame(p = {}) {
  const W = 156, H = 140, G = H - 1, S = sculpt(W, H, { k: SCK, ax: 66 });
  const b = p.bob ?? 0, sw = p.sw ?? 0, ph = p.ph ?? 0, cx = 64;
  // 아래 모래 더미 (다리가 녹아든다)
  S.add(U(ellR(cx, G - 6, 44, 10), ellR(cx - 18, G - 14, 18, 14), ellR(cx + 18, G - 14, 18, 14)), SAND, { z: -1, h: 8 });
  for (let k = 0; k < 8; k++) S.carve(capF([cx - 40 + k * 11, G - 20], [cx - 36 + k * 11, G - 4], 0.5), 0.6);
  // 먼 팔
  const shF = [cx - 22, 52 + b], hF = sw > 0 ? lerp([cx - 30, 96 + b], [cx - 10, 30 + b], Math.min(1, sw)) : [cx - 30, 96 + b];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 10, 9), capF(lerp(shF, hF, 0.5), hF, 9, 8)), SANDF, { z: -2, h: 7 });
  S.add(ellR(hF[0], hF[1], 11, 10), SSTF, { z: -1.9, h: 8 });
  // 몸통 (모래 + 사암 판)
  S.add(U(ellR(cx, 66 + b, 30, 28), ellR(cx, 98 + b, 22, 18)), SAND, { z: 1, h: 20 });
  for (const [x, y, w, h, a] of [[cx - 10, 54, 12, 9, -0.2], [cx + 10, 62, 10, 8, 0.3], [cx - 4, 80, 11, 7, 0.1], [cx + 14, 88, 8, 6, -0.3]]) S.add(ellR(x, y + b, w, h, a), SST, { lift: 1.6, h: 3 });
  for (let k = 0; k < 7; k++) S.carve(capF([cx - 24 + k * 8, 44 + b], [cx - 28 + k * 8, 110 + b], 0.6), 0.7);
  // 바위 머리 (눈틈)
  const hx = cx + 6, hy = 30 + b;
  S.add(U(ellR(hx, hy, 15, 13), polyF([[hx - 14, hy], [hx + 14, hy - 4], [hx + 16, hy + 10], [hx - 12, hy + 12]])), SST, { z: 3, h: 10 });
  S.carve(capF([hx - 2, hy - 1], [hx + 14, hy - 3], 1.6), 2);
  S.add(capF([hx, hy - 1.4], [hx + 13, hy - 3], 0.8), AMBG, { z: 3.2, h: 0.4 });
  S.carve(capF([hx + 2, hy + 7], [hx + 14, hy + 6], 1.2), 1.4);
  // 가까운 팔 (바위 주먹)
  const sh = [cx + 22, 52 + b], hd = sw <= 1 ? lerp([cx + 34, 94 + b], [cx + 26, 20 + b], sw) : lerp([cx + 26, 20 + b], [cx + 56, G - 18], Math.min(1, sw - 1));
  S.add(ellR(sh[0], sh[1], 14, 12), SST, { z: 6, h: 8 });
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 11, 10), capF(lerp(sh, hd, 0.5), hd, 10, 9)), SAND, { z: 7, h: 8 });
  S.add(U(ellR(hd[0], hd[1], 13, 12)), SST, { z: 8, h: 10 });
  for (const d of [-4, 1, 6]) S.carve(capF([hd[0] + d, hd[1] - 6], [hd[0] + d + 1, hd[1] + 2], 0.6), 0.8);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, SCK, 66);
  for (const [x, y] of [[sh[0] - 6, sh[1] - 10], [shF[0] + 4, shF[1] - 8], [hx - 8, hy - 12], [cx + 8, 110 + b]]) sandFall(C, P, x, y, G - 6, ph + x, 2);
  if (p.breath) for (let k = 0; k < 16; k++) { const q = P(hx + 16 + k * 3, hy + 6 + k * 1.4 + Math.sin(k) * 2); C.px(q[0], q[1], k % 2 ? 0xd8b880 : 0xf0d8a0); C.px(q[0], q[1] + 1, 0xb89a68); }
  return fin(C, p);
}
export const pxColossus = {
  fw: Math.round(156 * SCK), fh: Math.round(140 * SCK), w: 44, h: 70,
  anims: { idle: [6, 4], move: [6, 4], wind: [4, 7, !1], atk: [3, 12, !1], rec: [3, 7, !1], hurt: [2, 10, !1], breath: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 1, ph };
    if (nm === "move") P = { bob: Math.sin(ph * 2) * 1.6, ph };
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], ph, bob: 2 };
    if (nm === "rec") P = { sw: 2 * (1 - t) + (t > 0.5 ? 0 : 0), ph };
    if (nm === "breath") P = { breath: f > 0, ph: ph * 2 };
    if (nm === "hurt") P = { hurt: f === 0, ph, bob: 2 };
    return colossusFrame(P);
  },
};

// ════ 모래 상어 ════ 모래 속을 헤엄치는 사막빛 상어 · 모래 위엔 등지느러미와 물결 자국만 · 덮칠 때 튀어 올라 이빨 가득한 턱을 드러낸다
//   p: sub(0 몸 전체 ~ 1 지느러미만) · jaw · ph · hurt
const SHK = 0.72;
const SHR = mat(ramp(0xa8987c), { tex: "skin", amp: 0.7, spec: 0.5 }), SHRF = mat(rampF(0x887a62), { tex: "skin", amp: 0.6 }), SHRB = mat(ramp(0xe0d8c4), { tex: "skin", amp: 0.5 });
function sharkFrame(p = {}) {
  const W = 128, H = 66, G = H - 1, S = sculpt(W, H, { k: SHK, ax: 60 });
  const sub = p.sub ?? 1, jw = p.jaw ?? 0, ph = p.ph ?? 0, cx = 58, cy = G - 16 + sub * 18 - (1 - sub) * 8, tl = (1 - sub) * -0.25;
  const R = (x, y) => { const c = Math.cos(tl), s = Math.sin(tl), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 꼬리 · 몸 · 배 · 지느러미
  S.add(polyF([R(cx - 34, cy), R(cx - 52, cy - 14 + Math.sin(ph) * 3), R(cx - 46, cy), R(cx - 50, cy + 10 + Math.sin(ph) * 2)]), SHRF, { z: 0, h: 1.4, prof: "flat" });
  S.add(U(ellR(...R(cx - 4, cy), 34, 10), capF(R(cx + 20, cy), R(cx + 36, cy + 2), 9, 5)), SHR, { z: 1, h: 9 });
  S.add(ellR(...R(cx, cy + 5), 30, 4), SHRB, { on: 1, h: 0.6 });
  for (const [x, y] of [[cx - 20, cy - 4], [cx - 8, cy - 6], [cx + 6, cy - 5]]) S.add(ellR(...R(x, y), 3, 1.6), SHRF, { on: 1, lift: 0.2, h: 0.3 });
  S.add(polyF([R(cx - 6, cy - 8), R(cx - 14, cy - 26), R(cx + 6, cy - 9)]), SHR, { z: 1.5, h: 2, prof: "flat" });
  S.add(polyF([R(cx + 8, cy + 6), R(cx - 2, cy + 18), R(cx + 14, cy + 8)]), SHRF, { z: 2, h: 1, prof: "flat" });
  for (let k = 0; k < 4; k++) S.carve(capF(R(cx + 18 + k * 2, cy - 4), R(cx + 17 + k * 2, cy + 3), 0.4), 0.8);
  // 턱
  if (jw > 0.1) { S.add(polyF([R(cx + 26, cy + 2), R(cx + 42, cy - 2), R(cx + 40, cy + 4 + jw * 10), R(cx + 26, cy + 6)]), mat(ramp(0x7a3a3a)), { z: 2.2, h: 0.6 }); for (let k = 0; k < 5; k++) { const x = cx + 28 + k * 3; S.add(polyF([R(x - 0.8, cy + 1), R(x + 0.8, cy + 1), R(x, cy + 3.4)]), BONE, { z: 2.4, h: 0.3 }); S.add(polyF([R(x - 0.8, cy + 5 + jw * 8 - k), R(x + 0.8, cy + 5 + jw * 8 - k), R(x, cy + 2.6 + jw * 8 - k)]), BONE, { z: 2.4, h: 0.3 }); } }
  !p.hurt && S.decal(...R(cx + 30, cy - 3), 0x101010);
  // 모래 표면 (sub 만큼 몸을 가린다)
  if (sub > 0.05) {
    S.add(U(polyF([[0, G - 8 + (1 - sub) * 20], [W, G - 8 + (1 - sub) * 20], [W, G], [0, G]])), SAND, { z: 6, h: 2, prof: "flat" });
    for (let k = 0; k < 6; k++) S.add(ellR(cx - 40 + k * 14 + Math.sin(ph + k) * 2, G - 8 + (1 - sub) * 20, 6, 2), SANDF, { z: 6.1, h: 1.6 });
  }
  return fin(S.render({ rim: !0 }), p);
}
export const pxShark = {
  fw: Math.round(128 * SHK), fh: Math.round(66 * SHK), w: 40, h: 14,
  anims: { idle: [6, 6], move: [6, 9], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { sub: 1, ph };
    if (nm === "move") P = { sub: 1, ph: ph * 1.5 };
    if (nm === "wind") P = { sub: 1 - t * 0.3, ph };
    if (nm === "atk") P = { sub: [0.3, 0, 0.1][f], jaw: [1, 1.2, 0.3][f], ph };
    if (nm === "rec") P = { sub: 0.3 + t * 0.7, ph };
    if (nm === "hurt") P = { hurt: f === 0, sub: 0.4, jaw: 0.6, ph };
    return sharkFrame(P);
  },
};

// ════ 천산갑 ════ 겹겹의 각질 비늘 갑옷 · 작고 뾰족한 머리 · 긴 꼬리 · 굵은 앞발톱 · 몸을 말아 공처럼 굴러 들이받는다
//   p: legs · bob · roll(0~1) · rot · hurt
const PGK = 0.72;
const PSC = mat(ramp(0x8a6a48), { tex: "scale", amp: 1.2, spec: 0.4 }), PSCF = mat(rampF(0x6e5238), { tex: "scale", amp: 1.1 }), PSK = mat(ramp(0xc8a888), { tex: "skin", amp: 0.6 });
function pangolinFrame(p = {}) {
  const W = 90, H = 54, G = H - 1, S = sculpt(W, H, { k: PGK, ax: 42 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, rl = p.roll ?? 0, rot = p.rot ?? 0, cx = 42;
  if (rl > 0.6) {
    // 공 (겹 비늘 고리가 돈다)
    const c = [cx, G - 15];
    S.add(ellR(c[0], c[1], 15, 15), PSC, { z: 1, h: 13 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 7 + r * 2; k++) { const a = rot + (k / (7 + r * 2)) * T2 + r * 0.3, q = pol(c, a, 4 + r * 4.4); S.carve(minus(ellR(q[0], q[1], 2.8, 2, a), ellR(...pol(q, a, -1), 2.8, 2, a)), 0.6); }
    return fin(S.render({ rim: !0 }), p);
  }
  const lgf = (sh, o, far, front) => { const ft = [sh[0] + o[0] + (front ? 2 : -1), G - 1.5 - o[1]]; S.add(capF(sh, ft, far ? 2.8 : 3.2, 2.4), far ? mat(rampF(0x9a8068), { tex: "skin" }) : PSK, { z: far ? -3 : 5, h: 2 }); for (const e of [-0.3, 0.2, 0.6]) S.add(capF([ft[0] + 1, ft[1]], pol([ft[0] + 1, ft[1]], e, front ? 4.4 : 3), 0.6, 0.2), DARK, { z: far ? -2.9 : 5.1, h: 0.4 }); };
  lgf([cx + 12, 38 + b], lg.ff, 1, 1), lgf([cx - 12, 38 + b], lg.bf, 1, 0);
  // 꼬리 (비늘 · 땅에 끌림)
  for (let k = 0; k < 6; k++) { const q = [cx - 20 - k * 4.4, 36 + b + k * 1.6], w = 6 - k * 0.8; S.add(ellR(q[0], q[1], w * 0.9, w * 0.7), k % 2 ? PSC : PSCF, { z: 0.5 - k * 0.05, h: w * 0.6 }); }
  // 몸 (겹 비늘)
  S.add(ellR(cx - 2, 32 + b - rl * 3, 22 - rl * 6, 11 + rl * 4), PSC, { z: 1, h: 10 });
  for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) { const q = [cx - 18 + k * 5.6 + (r % 2) * 2.8, 24 + b + r * 4.4 - rl * 3]; S.carve(minus(ellR(q[0], q[1] + 1.4, 3, 2.2), ellR(q[0], q[1] - 0.2, 3, 2.2)), 0.7); }
  // 머리 (작고 뾰족)
  const hx = cx + 22 - rl * 8, hy = 34 + b + rl * 2;
  S.add(U(ellR(hx, hy, 5, 4.4), capF([hx + 2, hy + 1], [hx + 11, hy + 3], 3, 1.2)), PSK, { z: 3, h: 3 });
  S.add(ellR(hx - 2, hy - 3, 5, 3), PSC, { z: 3.2, h: 2 });
  !p.hurt && S.decal(hx + 2, hy - 0.4, 0x101010);
  lgf([cx + 14, 39 + b], lg.fn, 0, 1), lgf([cx - 10, 39 + b], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxPangolin = {
  fw: Math.round(90 * PGK), fh: Math.round(54 * PGK), w: 24, h: 18,
  anims: { idle: [4, 5], move: [6, 10], wind: [3, 9, !1], atk: [4, 18], rec: [3, 9, !1], hurt: [2, 10, !1], swipe: [3, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { legs: gait4(f, n, 4, 2), bob: Math.cos(ph * 2) * 0.5 };
    if (nm === "wind") P = { roll: t * 0.9 };
    if (nm === "atk") P = { roll: 1, rot: ph };
    if (nm === "rec") P = { roll: 0.9 * (1 - t) };
    if (nm === "swipe") P = { legs: { fn: [6, 4], ff: [4, 2], bn: [0, 0], bf: [0, 0] }, bob: -1 };
    if (nm === "hurt") P = { hurt: f === 0, roll: 0.5 };
    return pangolinFrame(P);
  },
};

// ════ 토용 병사 ════ 무덤을 지키던 흙 인형 병사가 깨어났다 · 붉은 흙빛 미늘 갑옷 · 틀어 올린 상투 · 굳은 흙 얼굴 · 갈라진 틈에서 먼지 · 긴 창(극)
//   p: legs · bob · thrust · hurt
const TSK = 0.72;
function soldierClayFrame(p = {}) {
  const W = 108, H = 92, G = H - 1, S = sculpt(W, H, { k: TSK, ax: 36 });
  const b = p.bob ?? 0, th = p.thrust ?? 0, cx = 34;
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: CLAY, hurt: p.hurt,
    legO: { thigh: CLAY, thighF: CLAYF, shin: CLAYD, shinF: CLAYF, boot: CLAYD, bootF: CLAYF, knee: !1 },
    head: (hx, hy) => {
      S.add(ellR(hx + 1, hy + 1, 6, 6.6), CLAY, { z: 4, h: 5 });
      S.add(U(ellR(hx - 2, hy - 4, 5.4, 3.4), ellR(hx - 2, hy - 8, 2.6, 2.4)), CLAYD, { z: 4.4, h: 2.4 });
      S.add(capF([hx - 4, hy - 7], [hx, hy - 9], 0.6), mat(ramp(0x5a3a2a)), { z: 4.6, h: 0.4 });
      S.carve(capF([hx + 2, hy - 0.6], [hx + 6, hy - 0.4], 0.4), 0.8).carve(capF([hx + 3, hy + 4], [hx + 6, hy + 4], 0.4), 0.8);
      S.add(capF([hx + 5.6, hy - 0.4], [hx + 7, hy + 2], 0.8), CLAY, { z: 4.6, h: 0.8 });
      S.carve(capF([hx - 3, hy - 2], [hx - 1, hy + 5], 0.4), 1);
      !p.hurt && S.decal(hx + 4, hy - 0.6, 0x3a2418);
    },
  });
  // 미늘 갑옷 줄 · 어깨 미늘
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) S.add(polyF([[cx - 9 + k * 4 + (r % 2) * 2, 40 + b + r * 4.4], [cx - 6 + k * 4 + (r % 2) * 2, 40 + b + r * 4.4], [cx - 7.5 + k * 4 + (r % 2) * 2, 43.6 + b + r * 4.4]]), CLAYD, { on: 1, lift: 0.4, h: 0.4 });
  S.carve(capF([cx + 6, 40 + b], [cx + 3, 50 + b], 0.5), 1).carve(capF([cx - 6, 52 + b], [cx - 2, 60 + b], 0.5), 1);
  // 창(극) + 팔
  const hN = [cx + 10 + th * 8, 48 + b], hF = [cx + 2 + th * 6, 50 + b], sa = L(-0.25, 0, th);
  arm(S, sol.S1, hF, 1, { z: 5, M: CLAY, MF: CLAYF });
  const s0 = pol(hN, sa, -26), s1 = pol(hN, sa, 30);
  S.add(capF(s0, s1, 0.9, 0.8), mat(ramp(0x6a4a30), { tex: "wood" }), { z: 6.4, h: 0.9 });
  S.add(U(polyF([pol(s1, sa + 1.57, 1.6), pol(s1, sa, 8), pol(s1, sa - 1.57, 1.6)]), polyF([pol(s1, sa - 1.57, 1), pol(pol(s1, sa, -2), sa - 1.57, 7), pol(pol(s1, sa, -5), sa - 1.57, 1)])), mat(ramp(0x6a7a6a), { tex: "metal", spec: 0.5 }), { z: 6.5, h: 1, prof: "sharp" });
  S.add(ellR(sol.S0[0], sol.S0[1] + 1, 5.4, 4.2, 0.3), CLAYD, { z: 7, h: 3 });
  arm(S, sol.S0, hN, 0, { M: CLAY, MF: CLAYF });
  return fin(S.render({ rim: !0 }), p);
}
export const pxClaySoldier = {
  fw: Math.round(108 * TSK), fh: Math.round(92 * TSK), w: 16, h: 30,
  anims: { idle: [4, 3], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: 0 };
    if (nm === "move") { const g = gait2(f, n, 3, 1.4); P = { legs: g, bob: g.bob * 0.5 }; }
    if (nm === "wind") P = { thrust: -0.5 * t };
    if (nm === "atk") P = { thrust: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { thrust: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return soldierClayFrame(P);
  },
};

// ════ [정예] 토용 장군 ════ 크게 빚은 흙 장군 · 겹겹의 미늘 갑옷과 어깨 판 · 관모와 긴 턱수염 · 금 간 틈마다 호박빛 · 긴 칼(검)
//   p: legs · bob · sw(0~2) · hurt
const TGK = 0.72;
function generalFrame(p = {}) {
  const W = 156, H = 128, G = H - 1, S = sculpt(W, H, { k: TGK, ax: 58 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 56;
  const glowCrack = (pts) => { for (let k = 0; k + 1 < pts.length; k++) S.add(capF(pts[k], pts[k + 1], 0.6), AMBG, { on: 1, lift: 0.2, h: 0.3 }); };
  // 다리
  leg(S, [cx - 8, 86 + b], [cx - 10 + g.f[0], G - 1 - g.f[1]], 1, { w: 1.6, thigh: CLAY, thighF: CLAYF, shin: CLAYD, shinF: CLAYF, boot: CLAYD, bootF: CLAYF, knee: !1 });
  // 먼 팔
  const shF = [cx - 14, 52 + b], hF = [cx - 18 + sw * 6, 82 + b - sw * 10];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 6, 5.4), capF(lerp(shF, hF, 0.5), hF, 5.4, 5)), CLAYF, { z: -3, h: 5 });
  // 갑옷 치마 + 몸통 미늘
  S.add(polyF([[cx - 20, 78 + b], [cx + 20, 78 + b], [cx + 24, 102 + b], [cx - 24, 102 + b]]), CLAYD, { z: 1, h: 8 });
  for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) S.add(polyF([[cx - 22 + k * 6 + (r % 2) * 3, 82 + b + r * 6.6], [cx - 17 + k * 6 + (r % 2) * 3, 82 + b + r * 6.6], [cx - 19.5 + k * 6 + (r % 2) * 3, 87 + b + r * 6.6]]), CLAY, { on: 1, lift: 0.4, h: 0.5 });
  S.add(U(ellR(cx, 62 + b, 22, 20), polyF([[cx - 20, 64 + b], [cx + 20, 64 + b], [cx + 18, 82 + b], [cx - 18, 82 + b]])), CLAY, { z: 2, h: 15 });
  for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) S.add(polyF([[cx - 18 + k * 6 + (r % 2) * 3, 48 + b + r * 6.4], [cx - 13 + k * 6 + (r % 2) * 3, 48 + b + r * 6.4], [cx - 15.5 + k * 6 + (r % 2) * 3, 53 + b + r * 6.4]]), CLAYD, { on: 1, lift: 0.4, h: 0.5 });
  S.add(capF([cx - 20, 80 + b], [cx + 20, 80 + b], 2.4), mat(ramp(0x5a3a2a), { tex: "leather" }), { z: 3, h: 2 });
  glowCrack([[cx + 8, 50 + b], [cx + 4, 62 + b], [cx + 9, 72 + b]]);
  glowCrack([[cx - 12, 66 + b], [cx - 6, 76 + b]]);
  // 머리 (관모 · 긴 수염)
  const hx = cx + 6, hy = 34 + b;
  S.add(ellR(hx, hy, 9, 10), CLAY, { z: 4, h: 7 });
  S.add(U(capF([hx + 4, hy + 6], [hx + 7, hy + 24], 3, 1.4)), CLAYD, { z: 4.4, h: 2 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx + 3 + k * 0.6, hy + 9 + k * 3.4], [hx + 7.4, hy + 9 + k * 3.4], 0.3), 0.6);
  S.add(capF([hx + 4, hy + 4], [hx + 9, hy + 3.4], 0.8), CLAYD, { z: 4.5, h: 0.8 });
  S.carve(capF([hx + 3, hy - 1], [hx + 8, hy - 1.4], 0.5), 1);
  S.add(capF([hx + 7.6, hy - 1], [hx + 9.4, hy + 2.6], 1), CLAY, { z: 4.6, h: 1 });
  !p.hurt && S.decal(hx + 5.6, hy - 1.2, 0xffb040);
  S.add(U(polyF([[hx - 9, hy - 6], [hx + 7, hy - 8], [hx + 8, hy - 14], [hx - 6, hy - 16]]), capF([hx - 8, hy - 16], [hx + 8, hy - 18], 1.4)), CLAYD, { z: 4.8, h: 3 });
  S.add(capF([hx - 10, hy - 6], [hx + 8, hy - 7], 1.4), mat(ramp(0x5a3a2a)), { z: 4.9, h: 1 });
  glowCrack([[hx - 4, hy - 4], [hx - 2, hy + 4]]);
  leg(S, [cx + 8, 86 + b], [cx + 10 + g.n[0], G - 1 - g.n[1]], 0, { w: 1.6, thigh: CLAY, thighF: CLAYF, shin: CLAYD, shinF: CLAYF, boot: CLAYD, bootF: CLAYF, knee: !1 });
  // 어깨 판 + 가까운 팔 + 긴 칼
  const sh = [cx + 18, 52 + b];
  S.add(U(ellR(sh[0], sh[1], 12, 8, 0.3), ellR(sh[0] + 2, sh[1] + 6, 10, 5, 0.4)), CLAYD, { z: 8, h: 6 });
  const hd = sw <= 1 ? lerp(pol(sh, 1.2, 22), pol(sh, -1.8, 20), sw) : lerp(pol(sh, -1.8, 20), [cx + 36, 84 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.35, -2.5, sw) : L(-2.5, 0.62, Math.min(1, sw - 1));
  const el = ik(sh, hd, 13, 13, 1);
  S.add(U(capF(sh, el, 6, 5.4), capF(el, hd, 5.4, 5)), CLAY, { z: 9, h: 5 });
  const tip = pol(hd, ba, 46), gq = pol(hd, ba, 4);
  S.add(polyF([pol(gq, ba + 1.57, 2), pol(tip, ba + 1.57, 1.2), pol(tip, ba, 2), pol(tip, ba - 1.57, 1.2), pol(gq, ba - 1.57, 2)]), mat(ramp(0x6a7a6a), { tex: "metal", amp: 1, spec: 0.5 }), { z: 10, h: 1.6, prof: "sharp" });
  S.add(capF(pol(gq, ba + 1.57, 5), pol(gq, ba - 1.57, 5), 1.2), mat(ramp(0x9a7a3a), { tex: "metal" }), { z: 10.2, h: 1.2 });
  S.add(capF(hd, pol(hd, ba, -9), 1.4), mat(ramp(0x5a3a2a)), { z: 10.1, h: 1.2 });
  S.add(ellR(hd[0], hd[1], 5, 4.6), CLAY, { z: 10.4, h: 3.4 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxGeneral = {
  fw: Math.round(156 * TGK), fh: Math.round(128 * TGK), w: 30, h: 60,
  anims: { idle: [4, 3], move: [6, 5], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], call: [4, 6, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 5, 2); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { sw: t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 2 };
    if (nm === "rec") P = { sw: 2 + t * 0, bob: 2 * (1 - t) };
    if (nm === "call") P = { sw: [0.5, 1, 1, 0.5][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2 };
    return generalFrame(P);
  },
};

// ════ 화석 덩이 ════ 화석이 박힌 바위 덩어리가 뭉툭한 돌다리로 걷는다 · 박힌 뼈·암모나이트·삼엽충 · 앞에 박힌 짐승 두개골의 눈이 빛난다
//   p: legs · bob · slam · hurt
const FCK = 0.72;
function fossilFrame(p = {}) {
  const W = 76, H = 64, G = H - 1, S = sculpt(W, H, { k: FCK, ax: 36 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sl = p.slam ?? 0, cx = 36;
  for (const [o, far, d] of [[g.f, 1, -8], [g.n, 0, 8]]) { const top = [cx + d, 44 + b], ft = [cx + d + o[0], G - 2 - o[1]]; S.add(capF(top, ft, 6, 5), far ? FOSF : FOS, { z: far ? -2 : 3, h: 4 }); S.add(ellR(ft[0] + 1, ft[1], 7, 2.4), far ? FOSF : FOS, { z: far ? -1.9 : 3.1, h: 1.4 }); }
  S.add(U(ellR(cx, 32 + b - sl * 4, 22, 17), ellR(cx + 6, 22 + b - sl * 6, 12, 9)), FOS, { z: 1, h: 14 });
  for (const [a, bq] of [[[cx - 18, 24], [cx - 8, 40]], [[cx + 10, 40], [cx + 18, 30]]]) S.carve(capF([a[0], a[1] + b], [bq[0], bq[1] + b], 0.6), 0.9);
  // 박힌 화석: 등뼈 · 갈비 · 암모나이트 · 삼엽충
  for (let k = 0; k < 5; k++) S.add(ellR(cx - 16 + k * 4, 30 + b + k * 1.4, 1.6, 1.3), BONE, { on: 1, lift: 0.4, h: 0.6 });
  for (let k = 0; k < 3; k++) S.add(capF([cx - 12 + k * 4, 31 + b + k], [cx - 14 + k * 4, 38 + b + k], 0.6), BONE, { on: 1, lift: 0.4, h: 0.4 });
  const am = [cx - 6, 20 + b];
  S.add(ellR(am[0], am[1], 5, 5), mat(ramp(0xb8a888), { tex: "stone" }), { on: 1, lift: 0.5, h: 1 });
  for (let k = 0; k < 14; k++) { const a = k * 0.5, r = 1 + k * 0.28; S.add(ellR(...pol(am, a, r), 0.5, 0.5), FOSF, { on: 1, lift: 0.7, h: 0.3 }); }
  S.add(ellR(cx + 4, 42 + b, 3.4, 2.4), mat(ramp(0x9a8a70)), { on: 1, lift: 0.4, h: 0.4 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx + 1.6, 41 + b + k * 1.2], [cx + 6.4, 41 + b + k * 1.2], 0.25), 0.5);
  // 앞의 짐승 두개골 (눈이 빛난다)
  const sk = [cx + 16, 26 + b - sl * 4];
  S.add(U(ellR(sk[0], sk[1], 6, 5), capF([sk[0] + 2, sk[1] + 1], [sk[0] + 10, sk[1] + 3], 3, 1.6)), BONE, { lift: 1.4, h: 2.4 });
  S.add(ellR(sk[0] + 1, sk[1] - 0.6, 1.8, 1.8), DARK, { on: 1, lift: 0.2, h: 0.3 });
  for (let k = 0; k < 3; k++) S.add(polyF([[sk[0] + 5 + k * 1.8, sk[1] + 3.6], [sk[0] + 6 + k * 1.8, sk[1] + 3.6], [sk[0] + 5.5 + k * 1.8, sk[1] + 5.4]]), BONE, { lift: 1.6, h: 0.3 });
  !p.hurt && S.decal(sk[0] + 1.2, sk[1] - 0.6, 0xffb040);
  return fin(S.render({ rim: !0 }), p);
}
export const pxFossil = {
  fw: Math.round(76 * FCK), fh: Math.round(64 * FCK), w: 24, h: 22,
  anims: { idle: [4, 3], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 3, 1.6); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { slam: t };
    if (nm === "atk") P = { slam: [-0.4, -0.6, -0.4][f], bob: 2 };
    if (nm === "rec") P = { slam: 0 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return fossilFrame(P);
  },
};

// ════ 살아난 암모나이트 ════ 주름 골이 진 나선 껍데기(진주빛 광택) · 껍데기 입구에서 뻗은 오징어 같은 촉수 · 큰 눈 · 물 대신 모래를 뿜어 나아간다
//   p: ph · reach · jet · hurt
const AMK = 0.72;
const SHL = mat(ramp(0xc8b090, { hi: 0.55 }), { tex: "stone", amp: 0.6, spec: 0.7 }), SHLF = mat(rampF(0xa08a6a), { tex: "stone", amp: 0.5 }), TNT = mat(ramp(0x9a6a6a), { tex: "skin", amp: 0.7, spec: 0.4 }), TNTF = mat(rampF(0x7a5050), { tex: "skin", amp: 0.6 });
function ammoniteFrame(p = {}) {
  const W = 86, H = 60, S = sculpt(W, H, { k: AMK, ax: 40 });
  const ph = p.ph ?? 0, rc = p.reach ?? 0, jt = p.jet ?? 0, cx = 32, cy = 30;
  // 뒤 촉수
  for (let k = 0; k < 4; k++) { let q = [cx + 14, cy + 2 + k * 2]; for (let j = 0; j < 5; j++) { const n2 = [q[0] + 4 + rc * 2, q[1] + Math.sin(ph + j + k) * 1.6 + (k - 1.5) * 0.8]; S.add(capF(q, n2, 1.6 - j * 0.25, 1.4 - j * 0.25), TNTF, { z: -1, h: 0.8 }); q = n2; } }
  // 나선 껍데기 (갈비 골)
  S.add(ellR(cx, cy, 17, 17), SHL, { z: 1, h: 12 });
  for (let k = 0; k < 30; k++) { const a = -k * 0.36, r = 16 - k * 0.48; if (r < 2) break; S.carve(capF(pol([cx, cy], a, r - 3.6), pol([cx, cy], a, r), 0.45), 0.7); }
  for (let k = 0; k < 40; k++) { const a = -k * 0.18, r = 15 - k * 0.3; if (r < 2) break; S.add(ellR(...pol([cx, cy], a, r), 0.6, 0.6), SHLF, { on: 1, lift: 0.3, h: 0.2 }); }
  S.add(ellR(cx - 5, cy - 7, 5, 2.4, -0.6), mat(ramp(0xf0e8e0)), { on: 1, lift: 0.8, h: 0.2 });
  // 머리 + 눈 + 앞 촉수
  S.add(ellR(cx + 15, cy + 2, 6, 7), TNT, { z: 2, h: 5 });
  S.add(ellR(cx + 16, cy - 1, 2.4, 2.4), mat(ramp(0xe8d8a0)), { z: 2.4, h: 1.4 });
  !p.hurt && S.decal(cx + 16.6, cy - 1, 0x101010);
  for (let k = 0; k < 4; k++) { let q = [cx + 18, cy + 3 + k * 1.6]; for (let j = 0; j < 6; j++) { const n2 = [q[0] + 4 + rc * 3, q[1] + Math.sin(ph * 1.3 + j * 0.9 + k) * 1.8 + (k - 1.5) * 1.2 + rc * (k - 1.5) * 0.6]; S.add(capF(q, n2, 1.8 - j * 0.26, 1.6 - j * 0.26), TNT, { z: 3 + k * 0.05, h: 1 }); q = n2; } }
  const C = S.render({ rim: !0 });
  if (jt) { const P = toPx(W, H, AMK, 40); for (let k = 0; k < 10; k++) { const q = P(cx - 18 - k * 2.4, cy + 4 + Math.sin(k * 1.7) * 3); C.px(q[0], q[1], k % 2 ? 0xd8b880 : 0xf0d8a0); } }
  return fin(C, p);
}
export const pxAmmonite = {
  fw: Math.round(86 * AMK), fh: Math.round(60 * AMK), w: 26, h: 24, flying: !0,
  anims: { idle: [6, 5], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], jet: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 1.4, jet: f % 2 };
    if (nm === "wind") P = { ph, reach: -0.5 * t };
    if (nm === "atk") P = { ph, reach: [1, 1.4, 1][f] };
    if (nm === "rec") P = { ph, reach: 1 - t };
    if (nm === "jet") P = { ph, jet: 1, reach: -0.6 };
    if (nm === "hurt") P = { hurt: f === 0, ph, reach: -0.6 };
    return ammoniteFrame(P);
  },
};

// ════ 모래 입 ════ 유사 속에 숨은 거대한 둥근 입 · 닫혀 있을 땐 모래 소용돌이에 이빨 끝만 보인다 · 열리면 겹겹 이빨 고리와 목구멍
//   p: open(0~1) · ph · hurt
const MWK = 0.72;
function mawFrame(p = {}) {
  const W = 110, H = 54, G = H - 1, S = sculpt(W, H, { k: MWK, ax: 55 });
  const op = p.open ?? 0, ph = p.ph ?? 0, cx = 55, cy = G - 8 - op * 8;
  // 모래 둔덕 (소용돌이)
  S.add(U(ellR(cx, G - 4, 46, 8), ellR(cx, G - 2, 52, 4)), SAND, { z: 0, h: 5 });
  for (let k = 0; k < 10; k++) { const a = ph + k * 0.63; S.carve(capF(pol([cx, G - 5], a, 14 * 1.6), pol([cx, G - 5], a + 0.6, 40), 0.5), 0.5); }
  // 입 (위로 솟은 둥근 고리)
  S.add(ellR(cx, cy, 20 + op * 6, 6 + op * 8), mat(ramp(0x8a6a58), { tex: "skin", amp: 0.8, spec: 0.4 }), { z: 1, h: 4 });
  if (op > 0.1) {
    S.add(ellR(cx, cy + 1, 16 + op * 5, 4 + op * 6), mat(ramp(0x4a2224)), { z: 1.2, h: 0.6 });
    S.add(ellR(cx, cy + 2, 7 + op * 2, 2 + op * 3), DARK, { z: 1.3, h: 0.3 });
    for (let r = 0; r < 2; r++) for (let k = 0; k < 12; k++) { const a = (k / 12) * T2 + r * 0.26, rx = (16 + op * 5) * (1 - r * 0.3), ry = (4 + op * 6) * (1 - r * 0.3), q = [cx + Math.cos(a) * rx, cy + 1 + Math.sin(a) * ry], tip = [cx + Math.cos(a) * rx * 0.72, cy + 1 + Math.sin(a) * ry * 0.72]; S.add(polyF([[q[0] - 1, q[1]], [q[0] + 1, q[1]], tip]), BONE, { z: 1.4 + r * 0.1, h: 0.6 }); }
  } else for (let k = 0; k < 8; k++) { const a = (k / 8) * T2 + ph, q = [cx + Math.cos(a) * 18, cy + Math.sin(a) * 4]; S.add(polyF([[q[0] - 1, q[1]], [q[0] + 1, q[1]], [q[0], q[1] - 3]]), BONE, { z: 1.4, h: 0.4 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxMaw = {
  fw: Math.round(110 * MWK), fh: Math.round(54 * MWK), w: 40, h: 14,
  anims: { idle: [6, 4], move: [6, 6], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, open: 0 };
    if (nm === "move") P = { ph: ph * 2, open: 0 };
    if (nm === "wind") P = { ph, open: t * 0.6 };
    if (nm === "atk") P = { ph, open: [1, 1, 0.3][f] };
    if (nm === "rec") P = { ph, open: 0.3 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, open: 0.5 };
    return mawFrame(P);
  },
};

// ════ [정예] 화석 폭군 ════ 깨어난 거대 육식 공룡 화석 · 돌로 굳은 짙은 뼈와 붙은 암석 덩이 · 이빨 가득한 큰 두개골 · 짧은 앞발 · 긴 꼬리뼈 ·
//   눈구멍에 호박빛
//   p: legs · bob · jaw · head · tail · hurt
const TRK = 0.7;
const TBN = mat(ramp(0x7a6a58), { tex: "stone", amp: 1, spec: 0.3 }), TBNF = mat(rampF(0x5e5244), { tex: "stone", amp: 0.9 });
function tyrantFrame(p = {}) {
  const W = 190, H = 132, G = H - 1, S = sculpt(W, H, { k: TRK, ax: 84 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, jw = p.jaw ?? 0, hd0 = p.head ?? 0, tl = p.tail ?? 0, cx = 80;
  const bone = (a, c, w, far, z) => { S.add(capF(a, c, w, w * 0.8), far ? TBNF : TBN, { z, h: w }); S.add(ellR(c[0], c[1], w * 1.15, w * 1.05), far ? TBNF : TBN, { z: z + 0.05, h: w }); };
  // 다리 (굵은 넓적다리 → 정강이 → 발허리 → 발가락)
  const lgf = (o, far, d) => { const hp = [cx + d, 72 + b], kn = [cx + d + 12 + o[0] * 0.3, 92 + b * 0.5], an = [cx + d + 2 + o[0] * 0.7, 114], ft = [cx + d + 8 + o[0], G - 2 - o[1]]; bone(hp, kn, 6, far, far ? -3 : 4); bone(kn, an, 4, far, far ? -3 : 4); bone(an, ft, 3, far, far ? -3 : 4); for (const e of [-0.2, 0.15, 0.5]) S.add(capF(ft, pol(ft, e, 8), 1.6, 0.5), far ? TBNF : TBN, { z: far ? -2.9 : 4.1, h: 1 }); };
  lgf(g.f, 1, -10);
  // 꼬리뼈 (척추 마디)
  let q = [cx - 20, 60 + b];
  for (let k = 0; k < 12; k++) { const n2 = [q[0] - 6.4, q[1] + 1.6 - tl * (k * 0.8) + Math.sin(k * 0.5) * 0.6]; bone(q, n2, 3.8 - k * 0.26, 0, 0.2); k % 2 === 0 && S.add(capF(q, [q[0] - 1, q[1] - 5 + k * 0.2], 1, 0.5), TBN, { z: 0.15, h: 0.6 }); q = n2; }
  // 골반 + 갈비 + 척추
  S.add(U(ellR(cx - 12, 64 + b, 12, 9)), TBN, { z: 1, h: 6 });
  S.carve(ellR(cx - 12, 66 + b, 5, 3.4), 1.4);
  for (let k = 0; k < 8; k++) S.add(ellR(cx - 16 + k * 6, 52 + b - k * 2, 2.6, 2.4), TBN, { z: 1.2, h: 2 });
  for (let k = 0; k < 6; k++) { const r0 = [cx - 6 + k * 6, 50 + b - k * 2], r1 = [cx - 4 + k * 6, 64 + b - k * 1.6], r2 = [cx - 8 + k * 6, 74 + b - k]; S.add(U(capF(r0, r1, 1.4, 1.2), capF(r1, r2, 1.2, 0.8)), k % 2 ? TBNF : TBN, { z: 1.4 + k * 0.01, h: 1.2 }); }
  for (const [x, y, r] of [[cx - 4, 70, 4], [cx + 18, 64, 3.4], [cx - 18, 56, 3]]) S.add(ellR(x, y + b, r, r * 0.8), SSTF, { z: 1.3, h: 2 });
  // 짧은 앞발
  bone([cx + 26, 60 + b], [cx + 32, 68 + b], 1.8, 0, 3);
  bone([cx + 32, 68 + b], [cx + 36, 66 + b], 1.4, 0, 3);
  // 목뼈 + 큰 두개골
  const n0 = [cx + 30, 46 + b], hx = cx + 48 + hd0 * 6, hy = 34 + b + hd0 * 10, ha = hd0 * 0.4;
  for (let k = 0; k < 4; k++) S.add(ellR(...lerp(n0, [hx - 10, hy + 2], k / 4), 3.4, 3), TBN, { z: 2, h: 2.6 });
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  S.add(U(ellR(...R(hx, hy), 13, 11), capF(R(hx + 4, hy - 2), R(hx + 30, hy + 2), 9, 6)), TBN, { z: 3, h: 9 });
  const J = (x, y) => { const c = Math.cos(ha + jw * 0.5), s = Math.sin(ha + jw * 0.5), dx = x - (hx - 6), dy = y - (hy + 6); return [hx - 6 + dx * c - dy * s, hy + 6 + dx * s + dy * c]; };
  S.add(U(capF(J(hx - 6, hy + 8), J(hx + 26, hy + 12), 5, 3.4)), TBNF, { z: 2.8, h: 4 });
  for (let k = 0; k < 7; k++) { const x = hx + 4 + k * 3.6; S.add(polyF([R(x - 1, hy + 6), R(x + 1, hy + 6), R(x, hy + 10)]), BONE, { z: 3.4, h: 0.6 }); S.add(polyF([J(x - 1, hy + 9), J(x + 1, hy + 9), J(x, hy + 5)]), BONE, { z: 3.3, h: 0.6 }); }
  S.add(ellR(...R(hx - 2, hy - 2), 4.4, 4.4), DARK, { z: 3.6, lift: 0.1, h: 0.4 });
  S.add(ellR(...R(hx + 10, hy + 1), 3, 4), DARK, { z: 3.6, lift: 0.1, h: 0.4 });
  S.add(ellR(...R(hx + 26, hy - 1), 1.6, 1.2), DARK, { z: 3.6, lift: 0.1, h: 0.3 });
  !p.hurt && S.decal(...R(hx - 1.6, hy - 2), 0xffb040).decal(...R(hx - 1, hy - 2.6), 0xffe090);
  S.add(ellR(...R(hx + 6, hy - 8), 5, 2.6), SSTF, { z: 3.7, lift: 0.6, h: 1.4 });
  lgf(g.n, 0, 6);
  return fin(S.render({ rim: !0 }), p);
}
export const pxTyrant = {
  fw: Math.round(190 * TRK), fh: Math.round(132 * TRK), w: 50, h: 62,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], roar: [4, 8, !1], tail: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 1, jaw: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 10, 5); P = { legs: g, bob: g.bob * 2, jaw: 0.2 }; }
    if (nm === "wind") P = { head: -0.4 * t, jaw: 0.8 * t };
    if (nm === "atk") P = { head: [0.6, 1, 0.8][f], jaw: [1.2, 0, 0][f] };
    if (nm === "rec") P = { head: 0.8 * (1 - t) };
    if (nm === "roar") P = { head: -0.6, jaw: 1.2, bob: [0, -2, 0, -2][f] };
    if (nm === "tail") P = { tail: [0.4, 1, 0.6, 0][f], head: 0.2 };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.3, jaw: 1 };
    return tyrantFrame(P);
  },
};
