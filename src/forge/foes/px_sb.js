// 스톤브리지 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 하늘에 뜬 고대 석조 유적과 돌다리
//   아래 섬 줄: 돌 도마뱀 · 이끼 석상 · 다리 장인 인형 · [정예] 석조 수문장
//   가운데 줄: 바위 원숭이 · 항아리 미믹 · 칼날 제비 · [정예] 그리폰
//   위 줄: 룬 부유석 · 가고일 · 옛 병사 망령 · [정예] 번개 와이번
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const STONE = ramp(0xb0a690), STONEF = rampF(0x9a907a), STONED = ramp(0x857c6c), MOSS = ramp(0x6a9a44), MOSSD = ramp(0x4e7a36);
const RUNE = rampGlow(0x6ae0ff), BRONZE = ramp(0xb08446), BRONZEF = rampF(0x9a7038), WOODP = ramp(0x9a6a40), CLOTH = ramp(0x8a5040);
const mossy = (C, pts, r = 1.4) => pts.forEach(([x, y, s = 1]) => C.part(ellR(x, y, r * s * 1.4, r * s), MOSS, { sep: !1, shine: 1 }));
// 바닥 쪽을 점점 비우기 (망령 꼬리)
const fade = (C, y0, y1) => { for (let y = 0; y < C.H; y++) { const t = (y - y0) / Math.max(1, y1 - y0); if (t <= 0) continue; for (let x = 0; x < C.W; x++) { const i = y * C.W + x; if (C.d[i] < 0) continue; const k = ((x * 7 + y * 13) % 8) / 8; if (k < t) C.d[i] = -1; } } };

// ════ 돌 도마뱀 ════ 납작한 몸 · 넓게 벌린 네 다리 · 긴 꼬리 · 돌비늘 혹 · 이끼 얼룩
//   p: legs · bob · head 고개 · jaw · tail 꼬리 흔들기 · noTail 꼬리 끊김 · hurt
const LZ = ramp(0x8c8a76), LZF = rampF(0x7a786a), LZB = ramp(0xc4bca0);
const done3 = (C, p) => (p.hurt ? flash(C) : C);
function glint3(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
const S_STN = mat(ramp(0xb0a690), { tex: "stone", amp: 1.1, spec: 0.2 }), S_STNF = mat(rampF(0x9a907a), { tex: "stone", amp: 1 }), S_STND = mat(ramp(0x857c6c), { tex: "stone", amp: 1.2 });
const S_MOSS = mat(ramp(0x6a9a44), { tex: "leaf", amp: 1.2 }), S_RUNE = mat(rampGlow(0x6ae0ff)), S_RUNEW = mat(rampGlow(0xe0fcff)), S_VD = mat(ramp(0x101418));
const S_BRZ = mat(ramp(0xb08446), { tex: "metal", amp: 0.9, spec: 0.7 }), S_BRZF = mat(rampF(0x9a7038), { tex: "metal", amp: 0.8 }), S_WOOD = mat(ramp(0x9a6a40), { tex: "wood", amp: 1 });
const S_toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
const S_moss = (S, pts) => pts.forEach(([x, y, r]) => S.add(U(ellR(x, y, r * 1.4, r), ellR(x + r * 0.8, y + r * 0.4, r * 0.8, r * 0.7)), S_MOSS, { lift: 0.6, h: r * 0.6 }));
function lizardFrame(p = {}) {
  const W = 84, H = 40, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 40 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, tw = p.tail ?? 0, hd = p.head ?? 0, jw = p.jaw ?? 0, cx = 38;
  const LZ = mat(ramp(0x8c8a76), { tex: "scale", amp: 1, spec: 0.3 }), LZF = mat(rampF(0x7a786a), { tex: "scale", amp: 0.9 });
  const leg = (sh, o, far, front) => { const ft = [sh[0] + o[0] + (front ? 5 : -5), G - 1 - o[1]], kn = [L(sh[0], ft[0], 0.5) + (front ? 3 : -3), sh[1] - 4]; S.add(U(capF(sh, kn, far ? 2.6 : 3.2, 2.4), capF(kn, ft, 2.4, 1.8)), far ? LZF : LZ, { z: far ? -3 : 5, h: 2 }); for (const d of [-2.2, 0, 2.2]) S.add(capF(ft, [ft[0] + d + (front ? 2.4 : -2.4), ft[1] + 0.6], 0.8, 0.4), far ? LZF : LZ, { z: far ? -2.9 : 5.1, h: 0.4 }); };
  leg([cx + 14, 28 + b], lg.ff, 1, 1), leg([cx - 12, 28 + b], lg.bf, 1, 0);
  // 꼬리
  if (!p.noTail) { const tl = []; let q = [cx - 20, 27 + b], a = Math.PI - 0.1; for (let k = 0; k < 8; k++) { const n2 = pol(q, a, 3.8), w = 4.4 - k * 0.5; tl.push(capF(q, n2, w, w - 0.4)); q = n2; a -= 0.08 + tw * 0.05 * (k / 7); } S.add(U(...tl), LZ, { z: 0.5, h: 3 }); }
  else S.add(ellR(cx - 20, 27 + b, 3.6, 3.4), mat(ramp(0xa06050), { tex: "skin" }), { z: 0.5, h: 2 });
  // 몸 + 배 + 등 돌비늘 혹
  S.add(U(ellR(cx, 25 + b, 20, 7.4), ellR(cx - 16, 26 + b, 6, 5.4)), LZ, { z: 1, h: 7 });
  S.add(capF([cx - 16, 30 + b], [cx + 16, 30 + b], 2.4), mat(ramp(0xc4bca0), { tex: "scale" }), { on: 1, lift: 0.3, h: 0.4 });
  for (let k = 0; k < 8; k++) { const x = cx - 18 + k * 5, y = 19 + b - Math.sin((k / 7) * Math.PI) * 2; S.add(U(ellR(x, y, 2.6, 2), polyF([[x - 1.6, y], [x, y - 3 - (k % 2)], [x + 1.6, y]])), k % 3 ? S_STN : S_STND, { lift: 1, h: 1.8 }); }
  S_moss(S, [[cx - 8, 18 + b, 1.8], [cx + 8, 18.4 + b, 1.6]]);
  // 머리 (납작 삼각)
  const hp = [cx + 20, 24 + b], ha = -hd * 0.4;
  S.add(U(ellR(hp[0], hp[1], 6, 4.6), capF(hp, pol(hp, ha, 12), 4.2, 2.2)), LZ, { z: 2.4, h: 4 });
  S.add(capF(pol(pol(hp, ha, 2), ha + 1.57, 3), pol(pol(pol(hp, ha, 12), ha + 1.57, 2), ha + 1.57, jw * 2.6), 1.8, 1), mat(rampF(0x6a6858), { tex: "scale" }), { z: 2.2, h: 1 });
  jw > 0.2 && S.add(polyF([pol(pol(hp, ha, 3), ha + 1.57, 2.4), pol(pol(hp, ha, 11), ha + 1.57, 2.4 + jw), pol(pol(hp, ha, 3), ha + 1.57, 3.6 + jw)]), mat(ramp(0x9a3a3a)), { z: 2.3, h: 0.3 });
  S.add(ellR(...pol(pol(hp, ha, 3), ha - 1.57, 2.2), 1.6, 1.4), mat(ramp(0xe8a020), { spec: 1 }), { z: 2.8, h: 0.8 });
  !p.hurt && S.decal(...pol(pol(hp, ha, 3.4), ha - 1.57, 2.2), 0x140808);
  leg([cx + 16, 29 + b], lg.fn, 0, 1), leg([cx - 10, 29 + b], lg.bn, 0, 0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxLizard = spec(60, 29, 26, 12,
  { idle: [4, 6], move: [6, 16], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], flee: [6, 20] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, tail: Math.sin(ph) * 0.6, head: f === 2 ? 0.3 : 0 };
    if (nm === "move" || nm === "flee") { const g = gait4(f, n, 5, 2); return { legs: g, tail: Math.sin((f / n) * T2 * 2) * 1.2, noTail: nm === "flee" }; }
    if (nm === "wind") return { head: 0.5 * t, jaw: t, bob: 1 * t, legs: { fn: [-2 * t, 0], ff: [-2 * t, 0], bn: [2, 0], bf: [2, 0] } };
    if (nm === "atk") return { head: -0.2, jaw: 1.4, bob: -0.5, legs: { fn: [5, 1], ff: [5, 1], bn: [-3, 0], bf: [-3, 0] } };
    if (nm === "rec") return { jaw: 1 - t };
    return { hurt: f === 0, head: -0.3, jaw: 0.5 };
  }, lizardFrame);

// ════ 이끼 석상 ════ 유적에 서 있던 석상. 각진 몸 · 이끼 덮인 어깨 · 깨어나면 눈과 가슴 룬이 빛난다
//   p: awake(0~1) · bob · arm 주먹 들기(0 내림 ~ 1 머리 위) · step 걸음 · lean · hurt
function statueFrame(p = {}) {
  const W = 64, H = 74, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 32 });
  const b = p.bob ?? 0, aw = p.awake ?? 1, st = p.step ?? 0, ln = p.lean ?? 0, ar = p.arm ?? 0, cx = 30, lift = aw < 0.5 ? -7 : 0;
  aw < 0.5 && S.add(polyF([[cx - 20, G - 7], [cx + 20, G - 7], [cx + 22, G], [cx - 22, G]]), S_STND, { z: -2, h: 4, prof: "flat" });
  // 다리 (굵은 기둥)
  for (const [x, far, s] of [[cx - 7, 1, -st], [cx + 7, 0, st]]) S.add(polyF([[x - 6, 50 + b + lift], [x + 6, 50 + b + lift], [x + 6.6 + s, G - 0.5 + lift - Math.max(0, s)], [x - 6.6 + s, G - 0.5 + lift - Math.max(0, s)]]), far ? S_STNF : S_STN, { z: far ? -2 : 3, h: 6, prof: "flat" });
  // 먼 팔
  S.add(U(polyF([[cx - 20 + ln * 2, 26 + b + lift], [cx - 12, 26 + b + lift], [cx - 13, 46 + b + lift], [cx - 21 + ln, 46 + b + lift]]), ellR(cx - 17, 48 + b + lift, 5.6, 5)), S_STNF, { z: -1, h: 5, prof: "flat" });
  // 몸통 + 가슴 룬
  const tl = [cx - 17 + ln * 4, 23 + b + lift], tr = [cx + 17 + ln * 4, 23 + b + lift];
  S.add(polyF([tl, tr, [cx + 13 + ln, 52 + b + lift], [cx - 13 + ln, 52 + b + lift]]), S_STN, { z: 1, h: 11, prof: "flat" });
  S.carve(capF([cx - 13 + ln, 38 + b + lift], [cx + 13 + ln, 38 + b + lift], 0.6), 1, !1).carve(capF([cx + ln * 3, 24 + b + lift], [cx + ln, 52 + b + lift], 0.6), 1, !1);
  S.carve(capF([cx - 8, 28 + b + lift], [cx - 3, 34 + b + lift], 0.4), 0.8);
  const RM = aw > 0.5 ? S_RUNE : S_STND;
  for (const [a, c] of [[[-4, 29], [4, 29]], [[0, 26], [0, 35]], [[-3.4, 33], [3.4, 33]]]) S.add(capF([cx + a[0] + ln * 3, a[1] + b + lift], [cx + c[0] + ln * 3, c[1] + b + lift], 0.9), RM, { on: 1, lift: 0.3, h: 0.3 });
  // 머리 (네모 투구)
  const hx = cx + ln * 5, hy = 13 + b + lift;
  S.add(polyF([[hx - 8, hy - 8], [hx + 8, hy - 8], [hx + 9, hy + 8], [hx - 8, hy + 8]]), S_STN, { z: 3, h: 7, prof: "flat" });
  S.carve(capF([hx - 7, hy + 1.6], [hx + 8.6, hy + 1.6], 0.5), 1, !1).carve(capF([hx - 4, hy - 8], [hx - 1, hy - 1], 0.4), 0.9);
  for (const x of [hx + 3, hx + 6.4]) { S.add(ellR(x, hy - 1, 1.4, 1), aw > 0.5 ? S_RUNEW : S_STND, { z: 3.4, lift: 0.1, h: 0.3 }); }
  S_moss(S, [[hx - 4, hy - 8.4, 2], [hx + 3, hy - 8.6, 1.4], [tl[0] + 2, tl[1], 1.8], [tr[0] - 2, tr[1] + 0.4, 1.6]]);
  // 가까운 팔 (주먹)
  const sh = [cx + 15 + ln * 4, 27 + b + lift], fist = ar > 0 ? [sh[0] + 4 - ar * 6, sh[1] + 14 - ar * 30] : [sh[0] + 2, sh[1] + 20];
  S.add(capF(sh, fist, 5.6, 5), S_STN, { z: 6, h: 5, prof: "flat" });
  S.add(ellR(fist[0], fist[1], 6.4, 6), S_STN, { z: 6.4, h: 5 });
  S.carve(capF([fist[0] - 3, fist[1] - 1.6], [fist[0] + 3, fist[1] - 1.6], 0.4), 0.7);
  const C = S.render({ rim: !0 });
  aw > 0.5 && !p.hurt && glint3(C, S_toPx(W, H, 0.72, 32), cx + ln * 3, 30 + b + lift, 1);
  return done3(C, p);
}
export const pxStatue = spec(46, 53, 18, 30,
  { dormant: [1, 1], wake: [5, 10, !1], idle: [4, 5], move: [6, 8], wind: [4, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "dormant") return { awake: 0 };
    if (nm === "wake") return { awake: t, bob: Math.sin(t * 9) * 0.6 * (1 - t) };
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3 };
    if (nm === "move") return { step: Math.sin(ph) * 3, bob: -Math.abs(Math.sin(ph)) * 1, lean: 0.1 };
    if (nm === "wind") return { arm: t, lean: -0.2 * t };
    if (nm === "atk") return { arm: [-0.2, -0.5, -0.5][f] * 0 - 0.6, lean: 0.4, bob: 1 };
    if (nm === "rec") return { arm: -0.6 * (1 - t), lean: 0.4 * (1 - t) };
    return { hurt: f === 0, lean: -0.3 };
  }, statueFrame);

// ════ 다리 장인 인형 ════ 돌다리를 고치던 청동 관절 인형. 둥근 머리통 · 앞치마 · 큰 망치 · 태엽 열쇠
//   p: bob · ham 망치 각(0 어깨에 메기 ~ 1 머리 위 ~ 2 내려침) · legs · key 태엽 돌기 · hurt
function masonFrame(p = {}) {
  const W = 66, H = 60, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, hm = p.ham ?? 0, kr = p.key ?? 0, cx = 28;
  const CLOTH = mat(ramp(0x8a5040), { tex: "cloth", amp: 1.1 }), LENS = mat(ramp(0x30383e), { spec: 1 });
  const hip = [cx, 42 + b];
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const h0 = [hip[0] + (far ? -3 : 3), hip[1]], ft = [h0[0] + o[0], G - 3 - o[1]], K = ik(h0, ft, 8, 8, 1); S.add(U(capF(h0, K, 2.2, 1.8), capF(K, ft, 1.8, 1.6)), far ? S_BRZF : S_BRZ, { z: far ? -2 : 3, h: 1.6 }); S.add(ellR(K[0], K[1], 2.4, 2.4), far ? S_BRZF : S_BRZ, { z: far ? -1.9 : 3.1, h: 1.6 }); S.add(polyF([[ft[0] - 3.6, ft[1] - 1], [ft[0] + 5, ft[1] - 1], [ft[0] + 5, ft[1] + 2.6], [ft[0] - 3.6, ft[1] + 2.6]]), S_WOOD, { z: far ? -1.8 : 3.2, h: 1.4, prof: "flat" }); }
  // 태엽 열쇠 (등)
  S.add(capF([cx - 10, 31 + b], [cx - 16, 31 + b], 1.3), S_BRZF, { z: -1, h: 1 });
  S.add(U(ellR(cx - 17, 27.6 + b + Math.sin(kr) * 1.4, 2.8, 3.6), ellR(cx - 17, 34.4 + b - Math.sin(kr) * 1.4, 2.8, 3.6)), S_BRZ, { z: -0.8, h: 1.6 });
  // 몸통 (둥근 통 · 리벳 · 앞치마)
  S.add(ellR(cx, 32 + b, 10.4, 12), S_BRZ, { z: 1, h: 9 });
  for (const [x, y] of [[-6, 24], [6, 24], [-9, 32], [9, 32]]) S.add(ellR(cx + x, y + b, 0.9, 0.9), mat(ramp(0xe8c890), { spec: 1 }), { on: 1, lift: 0.4, h: 0.4 });
  S.add(polyF([[cx - 7, 29 + b], [cx + 7, 29 + b], [cx + 8.6, 44 + b], [cx - 8.6, 44 + b]]), CLOTH, { z: 2, h: 3, prof: "flat" });
  S.add(ellR(cx + 1, 37 + b, 3.6, 2.4), mat(ramp(0x6a4030), { tex: "leather" }), { on: 1, lift: 0.4, h: 0.6 });
  S.add(capF([cx - 7, 29 + b], [cx + 7, 29 + b], 0.8), mat(ramp(0x6a3a2a), { tex: "leather" }), { z: 2.2, h: 0.4 });
  // 머리 (둥근 통 · 렌즈 눈 · 입 격자 · 돌가루 모자)
  const hx = cx + 3, hy = 13 + b;
  S.add(ellR(hx, hy, 9, 8.4), S_BRZ, { z: 3, h: 7 });
  S.add(ellR(hx + 4.4, hy - 0.6, 3.6, 3.6), S_BRZF, { z: 3.4, h: 1.4 });
  S.add(ellR(hx + 4.6, hy - 0.6, 2.6, 2.6), LENS, { z: 3.6, h: 1.2 });
  !p.hurt && S.decal(hx + 4.6, hy - 0.6, 0xffc860).decal(hx + 5.6, hy - 1.6, 0xffffff);
  S.add(capF([hx - 1, hy + 5], [hx + 7, hy + 5], 1.4), S_BRZF, { z: 3.4, h: 0.8 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx + k * 2, hy + 4], [hx + k * 2, hy + 6], 0.3), 0.6);
  S.add(ellR(hx, hy - 8, 5, 2.4), S_STND, { z: 3.6, h: 1.6 });
  // 망치 (앞 팔)
  const sh = [cx + 6, 27 + b], a = -2.2 + hm * 1.6, hand = pol(sh, a + 0.7, 10), tip = pol(hand, a, 20), ha = a + Math.PI / 2;
  S.add(U(capF(sh, hand, 2.6, 2.2)), S_BRZ, { z: 6, h: 2 });
  S.add(capF(pol(hand, a, -4), tip, 1.4), S_WOOD, { z: 6.4, h: 1 });
  S.add(polyF([pol(pol(tip, ha, 6), a, 3.6), pol(pol(tip, ha, -6), a, 3.6), pol(pol(tip, ha, -6), a, -3.6), pol(pol(tip, ha, 6), a, -3.6)]), S_STND, { z: 6.6, h: 3, prof: "flat" });
  S.add(ellR(hand[0], hand[1], 2.6, 2.6), S_BRZ, { z: 6.8, h: 1.6 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxMason = spec(48, 43, 14, 24,
  { idle: [4, 6], move: [8, 12], wind: [4, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], pound: [6, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, key: ph, ham: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 3, 2); return { legs: g, bob: g.bob, key: ph * 2, ham: 0.15 }; }
    if (nm === "wind") return { ham: 0.2 + 0.9 * t, bob: -0.5 * t, key: t * 6 };
    if (nm === "atk") return { ham: [1.6, 2, 2.1][f], bob: 1 };
    if (nm === "rec") return { ham: 2 - 1.8 * t };
    if (nm === "pound") return { ham: f % 2 ? 2.1 : 1, bob: f % 2 ? 1 : 0, key: f };
    return { hurt: f === 0, ham: 0.4, bob: 0.5 };
  }, masonFrame);

// ════ [정예] 석조 수문장 ════ (큰 몬스터 조각 도구) 거대한 돌 기사. 탑 방패(룬) · 돌 철퇴 · 투구 틈으로 빛나는 눈 · 이끼 망토
//   p: bob · step · shield 방패 내밀기(0~1) · mace 철퇴(0 내림 ~ 1 위 ~ 2 내려침) · crouch · hurt
const WDK = 0.7;
const WD_ST = mat(ramp(0xb4aa96), { tex: "stone", amp: 0.7 }), WD_STF = mat(rampF(0x9a907c), { tex: "stone", amp: 0.6 }), WD_STD = mat(ramp(0x8a8070), { tex: "stone", amp: 0.8 });
const WD_MOSS = mat(ramp(0x5a8a3a), { tex: "fur", amp: 1, dir: 1.5 }), WD_BR = mat(ramp(0xb08446), { spec: 0.5 }), WD_RUNE = mat(rampGlow(0x6ae0ff));
function wardenFrame(p = {}) {
  const W = 106, H = 100, G = H - 1, S = sculpt(W, H, { k: p.k ?? WDK, ax: 50 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 5, st = p.step ?? 0, sd = p.shield ?? 0, mc = p.mace ?? 0;
  // 이끼 망토 (등 뒤로 늘어짐, 끝단 너덜)
  S.add(polyF([[30, 30 + b], [52, 28 + b], [50, 80 + b], [46, 84 + b], [42, 80 + b], [37, 86 + b], [33, 80 + b], [24, 74 + b]]), WD_MOSS, { z: -6, h: 4 });
  // 먼 팔 + 돌 철퇴 (가시 여섯)
  const shB = [36, 36 + b], ma = -2.6 + mc * 1.5, elB = pol(shB, ma + 0.9, 14), mt = pol(elB, ma, 30);
  S.add(capF(shB, elB, 6, 5), WD_STF, { z: -4, h: 5 });
  S.add(capF(elB, mt, 2.2, 2.2), WD_BR, { z: -3, h: 2 });
  S.add(ellR(mt[0], mt[1], 8.5, 8.5), WD_STD, { z: -2, h: 8 });
  for (let k = 0; k < 6; k++) { const a = k * 1.047 + mc; S.add(capF(pol(mt, a, 7), pol(mt, a, 13), 2.2, 0.6), WD_STD, { z: -1, h: 2 }); }
  // 다리: 두꺼운 돌기둥 + 무릎 판 + 발판
  for (const [x, far, sg] of [[42, 1, -st], [60, 0, st]]) {
    const top = [x, 64 + b], ft = [x + sg, G - 4 - Math.max(0, sg) * 0.8], M0 = far ? WD_STF : WD_ST, M1 = far ? WD_STF : WD_STD;
    S.add(capF(top, ft, 9, 8), M0, { z: far ? -2 : 3, h: 8, prof: "flat" });
    S.add(ellR(x + sg * 0.5, 77 + b, 6, 4.5), M1, { z: far ? -1 : 5, h: 3 });
    S.add(polyF([[ft[0] - 9, ft[1] - 3], [ft[0] + 11, ft[1] - 3], [ft[0] + 12, G + 0.5], [ft[0] - 9, G + 0.5]]), M1, { z: far ? -1 : 5, h: 3 });
  }
  // 몸통: 갑옷 판 · 가슴 판 볼록 · 판 이음 홈 · 놋쇠 리벳 · 허리띠와 룬 버클
  S.add(polyF([[34, 28 + b], [68, 28 + b], [66, 66 + b], [36, 66 + b]]), WD_ST, { z: 0, h: 15, prof: "flat" });
  S.add(ellR(51, 40 + b, 13, 9), WD_ST, { blend: 4, h: 4 });
  S.carve(capF([37, 50 + b], [65, 50 + b], 0.8), 1.4).carve(capF([51, 30 + b], [51, 60 + b], 0.7), 1.1);
  for (const [x, y] of [[40, 34], [62, 34], [40, 56], [62, 56]]) S.add(ellR(x, y + b, 1.3, 1.3), WD_BR, { on: 1, h: 0.9 });
  S.add(polyF([[35, 60 + b], [67, 60 + b], [67, 65 + b], [35, 65 + b]]), WD_BR, { on: 1, h: 1.6, lift: 1 });
  S.add(ellR(51, 62.5 + b, 3, 2.6), WD_RUNE, { on: 1, h: 1.2, lift: 1 });
  // 어깨판 둘 + 이끼
  S.add(ellR(36, 30 + b, 9, 7), WD_STD, { lift: 4, h: 6 });
  S.add(ellR(66, 31 + b, 8, 6.5), WD_STD, { lift: 3, h: 5 });
  S.add(ellR(35, 25 + b, 6, 2.6), WD_MOSS, { on: 1, h: 1.4 });
  // 투구: 네모 투구 · 이끼 볏 · 눈 틈(빛나는 두 눈) · 턱 이음
  S.add(polyF([[42, 6 + b], [62, 6 + b], [64, 26 + b], [40, 26 + b]]), WD_ST, { lift: 3, h: 11, prof: "flat" });
  S.add(capF([52, 1 + b], [52, 10 + b], 3, 2.6), WD_MOSS, { h: 3, lift: 6 });
  S.carve(capF([47, 15 + b], [63, 15 + b], 1.1), 3, !1);
  if (!p.block && !p.hurt) for (const x of [55, 56, 59, 60]) S.decal(x, 15 + b, x % 2 ? 0x7af0ff : 0xd0faff);
  S.carve(capF([44, 21 + b], [62, 21 + b], 0.5), 1);
  // 탑 방패 (가까운 손, 내밀면 앞으로): 테두리 단 · 놋쇠 판 · 룬 십자 · 방패 쥔 주먹
  const sx = 66 + sd * 10;
  S.add(polyF([[sx, 24 + b], [sx + 16, 27 + b], [sx + 16, 70 + b], [sx + 8, 78 + b], [sx, 70 + b]]), WD_ST, { z: 14, h: 6, prof: "flat" });
  S.add(polyF([[sx + 2, 29 + b], [sx + 14, 31 + b], [sx + 14, 68 + b], [sx + 8, 74 + b], [sx + 2, 68 + b]]), WD_ST, { blend: 2, h: 1.6 });
  S.add(polyF([[sx + 5, 40 + b], [sx + 12, 41 + b], [sx + 12, 56 + b], [sx + 5, 56 + b]]), WD_BR, { on: 1, h: 1.2 });
  S.add(capF([sx + 8.5, 42 + b], [sx + 8.5, 54 + b], 0.9), WD_RUNE, { on: 1, h: 1, lift: 0.8 });
  S.add(capF([sx + 6, 47 + b], [sx + 11, 47 + b], 0.9), WD_RUNE, { on: 1, h: 1, lift: 0.8 });
  S.add(ellR(sx + 1, 46 + b, 3.4, 3.4), WD_ST, { z: 16, h: 3 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxWarden = {
  fw: Math.round(106 * WDK), fh: Math.round(100 * WDK), w: 30, h: 46,
  anims: { idle: [4, 5], move: [6, 7], guard: [2, 6], bash: [3, 14, !1], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], jump: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, shield: 0.1 };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.4, shield: 0.2 };
    if (nm === "guard") P = { shield: 0.6, crouch: 0.3 };
    if (nm === "bash") P = { shield: [0.2, 1.2, 1][f], step: 3, crouch: 0.2 };
    if (nm === "wind") P = { mace: 1.1 * t, crouch: 0.6 * t, shield: 0.2 };
    if (nm === "jump") P = { mace: 1.1, crouch: -0.3, step: 2 };
    if (nm === "atk") P = { mace: [1.6, 2, 2.1][f], crouch: 0.7, shield: 0.3 };
    if (nm === "rec") P = { mace: 2 - 1.8 * t, crouch: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.2 };
    return wardenFrame(P);
  },
};

// ════ 바위 원숭이 ════ 회색 털 · 돌처럼 굳은 손 · 긴 꼬리. 턱을 뛰어다니며 바위를 던진다
//   p: bob · legs · arm 던지는 팔(0~1) · rock 손에 돌 · crouch · tail · jaw · hurt
const MK = ramp(0x8a8478), MKF = rampF(0x76706a), MKS = ramp(0xd0a890);
function monkeyFrame(p = {}) {
  const W = 66, H = 60, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 4, g = p.legs ?? { n: [0, 0], f: [0, 0] }, ar = p.arm ?? 0, tw = p.tail ?? 0, cx = 30;
  const MK = mat(ramp(0x8a8478), { tex: "fur", amp: 1.2, dir: 1.2 }), MKF = mat(rampF(0x76706a), { tex: "fur", amp: 1.1, dir: 1.2 }), MKS = mat(ramp(0xd0a890), { tex: "skin", amp: 0.7 });
  // 꼬리 (말려 올라감)
  const tl = [], tp = [[cx - 10, 40 + b], [cx - 20, 36 + b - tw * 3], [cx - 24, 26 + b - tw * 4], [cx - 18, 19 + b - tw * 3], [cx - 13, 22 + b - tw * 2]];
  for (let k = 0; k < tp.length - 1; k++) tl.push(capF(tp[k], tp[k + 1], 2.6 - k * 0.4, 2.2 - k * 0.4));
  S.add(U(...tl), MK, { z: -1, h: 2 });
  // 뒷다리
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const hp = [cx - 6 + (far ? -2 : 2), 42 + b], ft = [hp[0] + o[0] + 4, G - 2 - o[1]], kn = ik(hp, ft, 9, 9, -1); S.add(U(capF(hp, kn, 4.4, 3.4), capF(kn, ft, 3, 2.4)), far ? MKF : MK, { z: far ? -3 : 4, h: 3 }); S.add(ellR(ft[0] + 2, ft[1] + 0.6, 4, 2), far ? S_STNF : S_STND, { z: far ? -2.9 : 4.1, h: 1.4 }); }
  // 먼 팔 (주먹 짚기)
  S.add(capF([cx + 6, 30 + b], [cx + 10, G - 3], 3, 2.6), MKF, { z: -2, h: 2.4 });
  S.add(ellR(cx + 10.6, G - 2, 3.4, 2.6), S_STNF, { z: -1.9, h: 2 });
  // 몸 (구부정)
  S.add(U(ellR(cx, 34 + b, 12, 11), ellR(cx + 8, 26 + b, 9, 8.4)), MK, { z: 1, h: 10 });
  S.add(ellR(cx + 4, 35 + b, 5.6, 7), MKS, { on: 1, lift: 0.3, h: 1 });
  // 머리
  const hx = cx + 16, hy = 17 + b;
  S.add(ellR(hx, hy, 8.6, 8.4), MK, { z: 3, h: 7 });
  for (let k = 0; k < 4; k++) S.add(capF([hx - 5 + k * 2.6, hy - 7.6], [hx - 6 + k * 2.6, hy - 10.4], 0.8, 0.3), MK, { z: 3.1, h: 0.4 });
  S.add(ellR(hx + 3, hy + 1.4, 5.4, 5.6), MKS, { z: 3.4, h: 3 });
  S.add(ellR(hx - 7, hy - 0.6, 2.6, 3.4), MKS, { z: 2.8, h: 1.4 });
  S.add(ellR(hx + 3, hy - 1.6, 4.6, 1.4), mat(ramp(0xb08870), { tex: "skin" }), { on: 1, lift: 0.4, h: 0.6 });
  S.add(capF([hx + 3, hy + 4 + (p.jaw ?? 0)], [hx + 7, hy + 3.6 + (p.jaw ?? 0)], 0.6), mat(ramp(0x4a1a1a)), { z: 3.8, h: 0.3 });
  !p.hurt && S.decal(hx + 2.6, hy - 0.4, 0x2a1810).decal(hx + 5.6, hy - 0.4, 0x2a1810).decal(hx + 3, hy - 1.4, 0xffffff);
  // 가까운 팔 (던지기)
  const sh = [cx + 10, 27 + b], hand = ar > 0.5 ? pol(sh, -2.4 + (ar - 0.5) * 4, 15) : pol(sh, 1.2 - ar * 2, 14), el = ik(sh, hand, 8, 8, ar > 0.5 ? -1 : 1);
  S.add(U(capF(sh, el, 3.2, 2.8), capF(el, hand, 2.8, 2.6)), MK, { z: 6, h: 2.4 });
  S.add(ellR(hand[0], hand[1], 3.8, 3.4), S_STND, { z: 6.4, h: 2.4 });
  p.rock && S.add(ellR(hand[0], hand[1] - 4.4, 4.6, 4), S_STN, { z: 6.6, h: 3.4 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxMonkey = spec(48, 43, 16, 22,
  { idle: [6, 8], move: [6, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], throw: [5, 14, !1], leap: [4, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, tail: Math.sin(ph), jaw: f === 3 ? 1 : 0 };
    if (nm === "move") { const g = gait2(f, n, 4, 2.5); return { legs: g, bob: g.bob, tail: Math.sin(ph) * 1.5, arm: 0.2 }; }
    if (nm === "wind") return { crouch: t, arm: 0.1, jaw: 1 };
    if (nm === "atk") return { arm: 0.25 + f * 0.1, bob: -1, jaw: 1.2, legs: { n: [4, 1], f: [-2, 0] } };
    if (nm === "rec") return { crouch: 1 - t };
    if (nm === "throw") return [{ arm: 0.6, rock: 1, crouch: 0.3 }, { arm: 0.8, rock: 1, crouch: 0.5, jaw: 1 }, { arm: 0.9, rock: 1, crouch: 0.4 }, { arm: 1.2, jaw: 1.2 }, { arm: 0.4 }][f];
    if (nm === "leap") return [{ crouch: 1 }, { bob: -2, tail: 2, legs: { n: [3, 4], f: [-3, 4] } }, { bob: -1, tail: 2, legs: { n: [3, 3], f: [-2, 3] } }, { crouch: 0.6 }][f];
    return { hurt: f === 0, crouch: 0.4, jaw: 1 };
  }, monkeyFrame);

// ════ 항아리 미믹 ════ 깨진 항아리인 척. 깨어나면 금 간 틈이 입이 되어 이빨과 혀가 드러나고, 아래로 작은 다리가 나온다
//   p: open 입 벌림(0~1.4) · legs 다리(0 숨김 ~ 1) · tilt 기울기 · hop 뜀 · hurt
const CLAY = ramp(0xb87650), CLAYD = ramp(0x8a5236);
function jarFrame(p = {}) {
  const W = 54, H = 58, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 27 });
  const op = p.open ?? 0, lgs = p.legs ?? 0, hp = (p.hop ?? 0) * 6, tl = p.tilt ?? 0, cx = 27, piv = [cx, 38];
  const R = (x, y) => { const dx = x - piv[0], dy = y - hp - piv[1], c = Math.cos(tl), s = Math.sin(tl); return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c]; };
  const CLAY = mat(ramp(0xb87650), { tex: "clay", amp: 1.2, spec: 0.3 }), CLAYD = mat(ramp(0x8a5236), { tex: "clay", amp: 1.2 });
  if (lgs > 0) for (const [x, far] of [[cx - 7, 1], [cx + 7, 0]]) S.add(capF(R(x, 46), R(x + 1.4, 46 + lgs * 9), 2, 1.6), far ? mat(rampF(0x6a4a3a), { tex: "skin" }) : mat(ramp(0x6a4a3a), { tex: "skin", amp: 1 }), { z: far ? -2 : 2, h: 1.4 });
  const base = lgs > 0 ? 0 : 9, T = (x, y) => R(x, y + base);
  // 아랫몸
  S.add(U(ellR(...T(cx, 31), 15.6, 14), polyF([T(cx - 8, 42), T(cx + 8, 42), T(cx + 6, 47), T(cx - 6, 47)])), CLAY, { z: 1, h: 12 });
  for (const y of [28, 34]) S.carve(capF(T(cx - 15, y), T(cx + 15, y), 0.6), 0.8);
  for (let k = 0; k < 4; k++) S.add(ellR(...T(cx - 9 + k * 6, 31), 1.2, 1.2), CLAYD, { on: 1, lift: 0.3, h: 0.4 });
  // 입 (벌어짐) + 이빨 + 혀
  if (op > 0.1) {
    S.add(polyF([T(cx - 13, 21), T(cx + 13, 21), T(cx + 12, 21 + op * 6), T(cx - 12, 21 + op * 6)]), mat(ramp(0x4a1418)), { z: 1.4, h: 0.6 });
    for (let k = 0; k < 6; k++) { S.add(polyF([T(cx - 11 + k * 4.2, 21), T(cx - 9 + k * 4.2, 21), T(cx - 10 + k * 4.2, 24.6)]), mat(ramp(0xf0e8d0), { spec: 0.6 }), { z: 1.6, h: 0.4, prof: "sharp" }); }
    S.add(capF(T(cx - 1, 25 + op * 4), T(cx + 8 + op * 4, 24 + op * 4), 2.2, 1.6), mat(ramp(0xd8607a), { tex: "skin", spec: 0.6 }), { z: 1.7, h: 0.8 });
  }
  // 윗몸 + 목 + 뚜껑 (젖혀짐)
  const rp = T(cx - 13, 20), rl = -op * 0.7, Q = (x, y) => { const q = T(x, y), dx = q[0] - rp[0], dy = q[1] - rp[1], c = Math.cos(rl), s = Math.sin(rl); return [rp[0] + dx * c - dy * s, rp[1] + dx * s + dy * c]; };
  S.add(U(ellR(...Q(cx, 17), 13.6, 6.4), polyF([Q(cx - 7, 13), Q(cx + 7, 13), Q(cx + 6, 6), Q(cx - 6, 6)])), CLAY, { z: 2, h: 7 });
  S.add(ellR(...Q(cx, 5), 8, 2.6), CLAYD, { z: 2.4, h: 2 });
  S.carve(capF(Q(cx - 4, 8), Q(cx - 1, 14), 0.5), 1).carve(capF(Q(cx - 1, 14), Q(cx - 3, 18.4), 0.5), 1);
  op > 0.1 && !p.hurt && S.decal(...Q(cx - 6, 18), 0xffd040).decal(...Q(cx + 4, 18), 0xffd040);
  return done3(S.render({ rim: !0 }), p);
}
export const pxJar = spec(39, 42, 18, 24,
  { hide: [1, 1], wake: [4, 12, !1], idle: [4, 8], move: [6, 12], wind: [3, 12, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    if (nm === "hide") return {};
    if (nm === "wake") return { legs: t, open: t * 0.8, tilt: Math.sin(t * 9) * 0.15 };
    if (nm === "idle") return { legs: 1, open: 0.4 + 0.2 * Math.sin((f / n) * T2), tilt: Math.sin((f / n) * T2) * 0.06 };
    if (nm === "move") return { legs: 1, open: 0.5, hop: Math.abs(Math.sin((f / n) * Math.PI)), tilt: 0.1 };
    if (nm === "wind") return { legs: 1, open: 0.2, tilt: -0.25 * t };
    if (nm === "atk") return { legs: 1, open: [1, 1.4, 1.3][f], tilt: 0.25, hop: f === 1 ? 0.6 : 0.2 };
    if (nm === "rec") return { legs: 1, open: 1.2 - t * 0.7 };
    return { hurt: f === 0, legs: 1, open: 0.8, tilt: -0.2 };
  }, jarFrame);

// ════ 칼날 제비 ════ 강철빛 날개 끝이 칼날처럼 날카로운 제비. 날개를 접고 일직선으로 꿰뚫는다
//   p: flap(-1~1) · tuck 접기(0~1) · tilt · hurt
const SW = ramp(0x3a4a6a), SWB = ramp(0xe8e0d0), BLADE = ramp(0xb8c8d8), SWR = ramp(0xc84030);
function swallowFrame(p = {}) {
  const W = 66, H = 46, S = sculpt(W, H, { k: 0.72, ax: 33 });
  const fl = p.flap ?? 0, tk = p.tuck ?? 0, tl = p.tilt ?? 0, piv = [32, 23];
  const P = (x, y) => { const dx = x - piv[0], dy = y - piv[1], c = Math.cos(tl), s = Math.sin(tl); return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c]; };
  const SWM = mat(ramp(0x3a4a6a), { tex: "feather", amp: 1, dir: 0.2, spec: 0.5 }), SWMF = mat(rampF(0x2e3a54), { tex: "feather", amp: 0.9, dir: 0.2 }), BLD = mat(ramp(0xc8d8e8), { tex: "metal", spec: 1 });
  const wing = (far) => { const root = P(32, 20), a = -2.0 - fl * 0.7 * (1 - tk) + tk * 0.9 + (far ? -0.25 : 0), len = 26 - tk * 9, tip = pol(root, a, len), mid = pol(root, a + 0.25, len * 0.55); S.add(polyF([root, mid, tip, pol(root, a - 0.15, len * 0.5)]), far ? SWMF : SWM, { z: far ? -2 : 5, h: 1.6 }); S.add(capF(lerp(root, tip, 0.5), tip, 1.4, 0.3), BLD, { z: far ? -1.8 : 5.2, h: 0.6 }); for (let k = 0; k < 3; k++) S.carve(capF(lerp(root, mid, 0.4 + k * 0.2), lerp(root, tip, 0.5 + k * 0.15), 0.3), 0.5); };
  wing(1);
  S.add(U(capF(P(20, 23), P(6, 19), 2.2, 0.5), capF(P(20, 24), P(7, 29), 2.2, 0.5)), SWM, { z: 0, h: 1 });
  S.add(ellR(...P(32, 23), 13, 6, tl), SWM, { z: 1, h: 6 });
  S.add(ellR(...P(33, 25.6), 10, 3.4, tl), mat(ramp(0xe8e0d0), { tex: "feather", dir: 0.2 }), { on: 1, lift: 0.4, h: 0.6 });
  S.add(ellR(...P(44, 20), 6, 5.4), SWM, { z: 2, h: 4 });
  S.add(ellR(...P(46, 24), 3.4, 2.2), mat(ramp(0xc84030), { tex: "feather" }), { z: 2.4, h: 1 });
  S.add(polyF([P(49, 18.6), P(56, 20.4), P(49, 21.6)]), BLD, { z: 2.6, h: 1, prof: "sharp" });
  !p.hurt && S.decal(...P(46.4, 18.4), 0x101010).decal(...P(47, 17.6), 0xffffff);
  wing(0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxSwallow = spec(48, 33, 18, 12,
  { idle: [4, 20], move: [4, 22], wind: [3, 12, !1], atk: [2, 16], rec: [3, 10, !1], hurt: [2, 12, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tuck: t * 0.5, tilt: -0.15 * t };
    if (nm === "atk") return { tuck: 1, tilt: 0.1 };
    if (nm === "rec") return { flap: fl, tuck: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, tilt: -0.3 };
    return { flap: fl };
  }, swallowFrame, { flying: !0 });

// ════ [정예] 그리폰 ════ (큰 몬스터 조각 도구) 독수리 머리·앞발 + 사자 몸 · 큰 날개. 낚아채 높이 올라갔다 떨어뜨린다
//   p: flap · tilt · claw 앞발 뻗기(0~1) · beak 부리 벌림 · hurt
const GRK = 0.72;
const GR_FE = mat(ramp(0xe0d4b8), { tex: "fur", amp: 0.6, dir: 1.5 }), GR_FED = mat(ramp(0x8a6a40), { tex: "fur", amp: 0.8, dir: 0.5 }), GR_FEF = mat(rampF(0x8a6a40), { tex: "fur", amp: 0.7, dir: 0.5 });
const GR_LI = mat(ramp(0xc89a50), { tex: "fur", amp: 0.6, dir: 0.2 }), GR_LIF = mat(rampF(0xb08440), { tex: "fur", amp: 0.5, dir: 0.2 });
const GR_BK = mat(ramp(0xf0b830), { spec: 0.5 }), GR_BKF = mat(rampF(0xf0b830)), GR_TL = mat(ramp(0x3a2a20), { spec: 0.3 });
function griffinFrame(p = {}) {
  const W = 122, H = 100, S = sculpt(W, H, { k: p.k ?? GRK, ax: 60 });
  const fl = p.flap ?? 0, R = rot([60, 52], p.tilt ?? 0), P = (x, y) => R([x, y]), cl = p.claw ?? 0;
  // 날개: 어깨 → 손목 → 칼깃 일곱 (먼 쪽 먼저)
  const wing = (far) => {
    const root = P(54, 38), a = -1.95 - fl * 0.85 + (far ? -0.3 : 0), M0 = far ? GR_FEF : GR_FED;
    const wr = pol(root, a + 0.4, 22), tip = pol(root, a, 50);
    S.add(U(capF(root, wr, 7, 5), capF(wr, tip, 5, 2.4)), M0, { z: far ? -8 : 10, h: 4 });
    for (let k = 0; k < 7; k++) { const q = lerp(wr, tip, k / 7), fa = a + 1.65 - k * 0.06; S.add(capF(q, pol(q, fa, 19 - k * 1.3), 2.8, 0.9), k % 2 ? M0 : far ? GR_FEF : GR_FE, { z: far ? -9 : 9, h: 1.6 }); }
    S.add(capF(lerp(root, wr, 0.3), lerp(wr, tip, 0.35), 4, 3), far ? GR_FEF : GR_FE, { blend: 2, h: 1.2 });
  };
  wing(!0);
  // 사자 꼬리 (끝에 털뭉치)
  S.add(U(capF(P(30, 60), P(16, 66), 2.6, 2), capF(P(16, 66), P(10, 74), 2, 1.6)), GR_LI, { z: -2, h: 2 });
  S.add(ellR(...P(9, 76), 4, 4), GR_FED, { z: -2, h: 3 });
  // 뒷다리 (사자)
  for (const [x, far] of [[40, 1], [46, 0]]) { const h0 = P(x, 62), kn = P(x - 6, 70), ft = P(x - 2, 80); S.add(U(capF(h0, kn, far ? 6 : 7, 4.6), capF(kn, ft, 4.6, 3.4)), far ? GR_LIF : GR_LI, { z: far ? -4 : 4, h: 4 }); S.add(ellR(...P(x + 1, 81), 4.6, 2.6), far ? GR_LIF : GR_LI, { z: far ? -3 : 5, h: 2 }); }
  // 몸통 (사자) + 엉덩이 근육 + 배 홈
  S.add(ellR(...P(52, 58), 22, 13, -0.1), GR_LI, { z: 0, h: 12 });
  S.add(ellR(...P(40, 58), 10, 10), GR_LI, { blend: 4, h: 4 });
  S.carve(capF(P(44, 66), P(60, 67), 0.9), 1);
  // 깃털 가슴 (겹친 깃 줄)
  S.add(ellR(...P(70, 50), 12, 13), GR_FE, { blend: 5, h: 7 });
  for (let k = 0; k < 5; k++) S.carve(capF(P(64 + k * 2, 44 + k * 3), P(72 + k * 2, 46 + k * 3), 0.5), 0.7);
  // 머리 (독수리): 둥근 머리 · 귀깃 · 갈고리 부리 · 매서운 눈
  const hc = P(80, 34);
  S.add(ellR(hc[0], hc[1], 10, 9.5), GR_FE, { h: 9 });
  S.add(U(capF(P(72, 27), P(64, 20), 2.6, 0.8), capF(P(74, 26), P(68, 17), 2.2, 0.7)), GR_FED, { h: 2, lift: 3 });
  const bk = p.beak ?? 0;
  S.add(polyF([P(87, 30), P(99, 33), P(97, 38), P(88, 37)]), GR_BK, { h: 3.5, lift: 3 });
  S.add(polyF([P(97, 33), P(101, 36), P(97, 38)]), GR_TL, { h: 2, lift: 4 });
  bk > 0.2 && S.add(polyF([P(88, 38), P(96, 39 + bk * 3), P(89, 41 + bk)]), GR_BK, { h: 2, lift: 3 });
  if (!p.block && !p.hurt) { const e0 = P(84, 31); S.decal(e0[0], e0[1], 0xffc020).decal(e0[0] + 1, e0[1], 0x101010).decal(e0[0], e0[1] - 1, 0xffffff); }
  S.tone(capF(P(82, 28), P(88, 29), 1.2), -0.15);
  // 앞발 (독수리 발톱): 뻗으면 앞으로
  for (const [x, far] of [[64, 1], [72, 0]]) {
    const sh = P(x, 58), ft = cl > 0 ? P(x + 12 + cl * 8, 70 - cl * 6) : P(x + 2, 78);
    S.add(capF(sh, ft, far ? 3.4 : 4, 2.6), far ? GR_BKF : GR_BK, { z: far ? -2 : 8, h: 2.6 });
    for (const d of [-0.6, 0, 0.6]) S.add(capF(ft, pol(ft, 1.1 + d - cl * 0.7, 5), 1.3, 0.4), GR_TL, { z: far ? -1 : 9, h: 1.2 });
  }
  wing(!1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxGriffin = {
  fw: Math.round(122 * GRK), fh: Math.round(100 * GRK), w: 34, h: 30, flying: !0,
  anims: { idle: [4, 14], move: [4, 16], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], carry: [4, 16], gust: [5, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.1 };
    if (nm === "wind") P = { flap: fl * 0.5, tilt: -0.2 * t, beak: t };
    if (nm === "atk") P = { flap: -1, tilt: 0.35, claw: 1, beak: 1 };
    if (nm === "carry") P = { flap: fl, claw: 0.6, tilt: -0.1 };
    if (nm === "gust") P = { flap: [1, 1, -1, -1, 0][f], tilt: -0.15, beak: 0.6 };
    if (nm === "rec") P = { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.25, beak: 1 };
    return griffinFrame(P);
  },
};

// ════ 룬 부유석 ════ 공중에 뜬 오벨리스크 조각. 가운데 룬이 빛나고 둘레를 작은 돌이 돈다. 쏠 때마다 룬이 번쩍
//   p: glow(0~1.5) · spin 주변 돌 위상 · crack 금 · hurt
function runeFrame(p = {}) {
  const W = 52, H = 62, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const gl = p.glow ?? 0.6, sp = p.spin ?? 0, cx = 26, cy = 31;
  const orbit = (front) => { for (let k = 0; k < 3; k++) { const a = sp + k * 2.09, s = Math.sin(a); if (front ? s < 0 : s >= 0) continue; S.add(polyF([[cx + Math.cos(a) * 20 - 3, cy + s * 6], [cx + Math.cos(a) * 20, cy + s * 6 - 3.4], [cx + Math.cos(a) * 20 + 3.2, cy + s * 6 + 0.4], [cx + Math.cos(a) * 20 + 0.6, cy + s * 6 + 3]]), front ? S_STN : S_STNF, { z: front ? 4 : -2, h: 2.4 }); } };
  orbit(0);
  S.add(polyF([[cx - 7, 6], [cx + 7, 6], [cx + 11, 15], [cx + 10, 44], [cx + 4, 53], [cx - 4, 53], [cx - 9, 44], [cx - 10, 15]]), S_STN, { z: 1, h: 9, prof: "flat" });
  S.carve(capF([cx - 7, 7], [cx - 9, 44], 0.5), 0.8).carve(capF([cx + 7, 7], [cx + 10, 44], 0.5), 0.8);
  p.crack && S.carve(capF([cx + 3, 12], [cx - 2, 24], 0.6), 1.4, !1).carve(capF([cx - 2, 24], [cx + 3, 36], 0.6), 1.4, !1);
  S_moss(S, [[cx - 5, 7, 2], [cx + 6, 50, 1.6]]);
  const RM = gl > 1 ? S_RUNEW : gl > 0.3 ? S_RUNE : S_STND;
  for (const [a, c] of [[[0, 16], [0, 42]], [[-5, 22], [5, 22]], [[-4.6, 32], [0, 37]], [[4.6, 32], [0, 37]], [[-4.6, 42], [4.6, 42]]]) S.add(capF([cx + a[0], a[1]], [cx + c[0], c[1]], 1), RM, { on: 1, lift: 0.3, h: 0.3 });
  orbit(1);
  const C = S.render({ rim: !0 });
  gl > 0.8 && glint3(C, S_toPx(W, H, 0.72, 26), cx, 16, gl > 1.2 ? 3 : 2);
  return done3(C, p);
}
export const pxRune = spec(37, 45, 16, 30,
  { idle: [6, 10], move: [6, 12], wind: [4, 12, !1], atk: [2, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { glow: 0.6 + t * 0.9, spin: ph * 2 };
    if (nm === "atk") return { glow: 1.6, spin: ph };
    if (nm === "rec") return { glow: 1.2 - t * 0.6, spin: ph };
    if (nm === "hurt") return { hurt: f === 0, crack: 1, glow: 0.3 };
    return { glow: 0.5 + 0.2 * Math.sin(ph), spin: ph };
  }, runeFrame, { flying: !0 });

// ════ 가고일 ════ 석상처럼 웅크리고 앉아 있다가 날개를 펴고 덮친다. 뿔 · 송곳니 · 박쥐 날개 · 돌 발톱
//   p: perch(0~1 석상) · flap · claw · jaw · tilt · hurt
const GG = ramp(0x8a8a90), GGF = rampF(0x76767c);
function gargoyleFrame(p = {}) {
  const W = 76, H = 68, S = sculpt(W, H, { k: 0.72, ax: 38 });
  const pc = p.perch ?? 0, fl = p.flap ?? 0, tl = p.tilt ?? 0, piv = [36, 36];
  const P = (x, y) => { const dx = x - piv[0], dy = y - piv[1], c = Math.cos(tl), s = Math.sin(tl); return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c]; };
  const GG = mat(ramp(0x8a8a90), { tex: "stone", amp: 1.1, spec: 0.2 }), GGF = mat(rampF(0x76767c), { tex: "stone", amp: 1 });
  const wing = (far) => { const root = P(30, 25), a = pc > 0.5 ? -2.6 : -2.1 - fl * 0.8 + (far ? -0.3 : 0), len = pc > 0.5 ? 17 : 31, tip = pol(root, a, len), m1 = pol(root, a + 0.7, len * 0.8), m2 = pol(root, a + 1.3, len * 0.6); S.add(polyF([root, tip, lerp(tip, m1, 0.5), m1, lerp(m1, m2, 0.5), m2, P(36, 31)]), far ? GGF : GG, { z: far ? -2 : 7, h: 2 }); S.add(U(capF(root, tip, 2, 0.8), capF(root, m1, 1, 0.5), capF(root, m2, 1, 0.5)), far ? GGF : GG, { z: far ? -1.8 : 7.2, h: 1 }); };
  wing(1);
  S.add(U(capF(P(22, 42), P(9, 47), 2.6, 1.6), polyF([P(8, 45), P(3, 49), P(9, 50)])), GG, { z: 0, h: 2 });
  for (const [x, far] of [[28, 1], [34, 0]]) { S.add(ellR(...P(x, 45), 6, 7), far ? GGF : GG, { z: far ? -1 : 3, h: 5 }); S.add(polyF([P(x - 3, 52), P(x + 7, 52), P(x + 8, 55), P(x - 3, 55)]), far ? GGF : GG, { z: far ? -0.9 : 3.1, h: 1.4 }); for (const d of [0, 3, 6]) S.add(capF(P(x + d + 1, 54), P(x + d + 3, 56), 0.6, 0.3), S_STND, { z: far ? -0.8 : 3.2, h: 0.3 }); }
  S.add(ellR(...P(34, 34), 11, 12.6), GG, { z: 1, h: 9 });
  for (let k = 0; k < 3; k++) S.carve(capF(P(28, 30 + k * 4), P(39, 30 + k * 4), 0.4), 0.7);
  const hx = 44, hy = 19, jw = p.jaw ?? 0;
  S.add(U(ellR(...P(hx, hy), 8.4, 7.8), polyF([P(hx + 3, hy + 1), P(hx + 11, hy + 3), P(hx + 10, hy + 7 + jw * 1.4), P(hx + 1, hy + 7)])), GG, { z: 3, h: 6 });
  S.carve(capF(P(hx - 4, hy - 4), P(hx + 4, hy - 4), 0.4), 0.8);
  S.add(U(capF(P(hx - 3, hy - 6), P(hx - 9, hy - 14), 2.2, 0.5), capF(P(hx + 1, hy - 7), P(hx + 1, hy - 15), 2, 0.5)), GGF, { z: 3.4, h: 1.2 });
  for (const x of [hx + 5.6, hx + 8.4]) S.add(polyF([P(x - 0.8, hy + 5.4), P(x, hy + 8), P(x + 0.8, hy + 5.4)]), mat(ramp(0xe8e0d0), { spec: 0.6 }), { z: 3.6, h: 0.3, prof: "sharp" });
  for (const x of [hx + 4, hx + 7]) { S.add(ellR(...P(x, hy - 0.4), 1.2, 1), S_VD, { z: 3.6, h: 0.3 }); pc < 0.5 && !p.hurt && S.decal(...P(x, hy - 0.6), 0xff5030); }
  const cl = p.claw ?? 0, s = P(40, 28), hnd = pc > 0.5 ? P(42, 44) : pol(s, 1.2 - cl * 1.6, 13);
  S.add(capF(s, hnd, 3, 2.4), GG, { z: 6, h: 2 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(hnd, pol(hnd, 0.6 - cl * 1.2 + d, 4.6), 1.1, 0.3), S_STND, { z: 6.2, h: 0.5 });
  wing(0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxGargoyle = spec(55, 49, 22, 24,
  { perch: [1, 1], wake: [4, 10, !1], idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "perch") return { perch: 1 };
    if (nm === "wake") return { perch: 1 - t, flap: t > 0.5 ? 1 : 0, jaw: t };
    if (nm === "wind") return { flap: fl * 0.5, claw: -0.4 * t, tilt: -0.15 * t, jaw: t };
    if (nm === "atk") return { flap: -1, claw: 1, tilt: 0.35, jaw: 1 };
    if (nm === "rec") return { flap: fl, claw: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6, tilt: -0.25 };
    return { flap: fl };
  }, gargoyleFrame, { flying: !0 });

// ════ 옛 병사 망령 ════ 녹슨 투구와 갑옷 조각만 남은 유령 병사. 다리 대신 흩어지는 안개 꼬리, 녹슨 창
//   p: bob · spear 창 각(0 세움 ~ 1 겨눔 ~ 1.3 찌름) · thrust 앞으로 · fade 흐려짐 · hurt
const GHO = ramp(0x9ac8e0, { warm: 0xe8fff8 }), RUST = ramp(0x8a5a3a), IRONG = ramp(0x7a8a90);
function ghostFrame(p = {}) {
  const W = 70, H = 74, S = sculpt(W, H, { k: 0.72, ax: 35 });
  const b = p.bob ?? 0, sp = p.spear ?? 0, th = (p.thrust ?? 0) * 8, cx = 34 + th;
  const GHO = mat(ramp(0x9ac8e0, { hi: 0.6 }), { tex: "cloth", amp: 0.6, spec: 0.3 }), IRG = mat(ramp(0x7a8a90), { tex: "metal", amp: 1.2, spec: 0.5 }), RUST = mat(ramp(0x8a5a3a), { tex: "metal", amp: 1.3 });
  const hand = [cx + 2, 37 + b], a = -Math.PI / 2 + sp * 1.57, tip = pol(hand, a, 34), butt = pol(hand, a + Math.PI, 16);
  S.add(capF(butt, tip, 1.4), mat(ramp(0x6a4a30), { tex: "wood" }), { z: -1, h: 1 });
  S.add(polyF([pol(tip, a + 1.57, 3), pol(tip, a, 9), pol(tip, a - 1.57, 3)]), RUST, { z: -0.9, h: 1.2, prof: "sharp" });
  S.add(polyF([[cx - 10, 34 + b], [cx + 10, 34 + b], [cx + 8, 50 + b], [cx + 4, 64 + b], [cx - 3, 71 + b], [cx - 6, 58 + b], [cx - 12, 50 + b]]), GHO, { z: 1, h: 7 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 6 + k * 4, 44 + b], [cx - 4 + k * 3, 66 + b], 0.5), 0.8);
  S.add(polyF([[cx - 9, 31 + b], [cx + 9, 31 + b], [cx + 8, 44 + b], [cx - 8, 44 + b]]), IRG, { z: 2, h: 5, prof: "flat" });
  for (const [x, y] of [[-4, 35], [3, 40]]) S.add(ellR(cx + x, y + b, 1.6, 1.2), RUST, { on: 1, lift: 0.3, h: 0.4 });
  for (const d of [-1, 1]) S.add(ellR(cx + d * 9, 32 + b, 4.4, 3.4), IRG, { z: 2.4, h: 3 });
  const hx = cx, hy = 20 + b;
  S.add(U(ellR(hx, hy, 8.4, 9), polyF([[hx - 8.4, hy], [hx + 8.4, hy], [hx + 9.4, hy + 8.4], [hx - 7, hy + 8.4]])), IRG, { z: 3, h: 7 });
  S.add(polyF([[hx + 1.4, hy - 1.4], [hx + 9.6, hy - 1.4], [hx + 9.6, hy + 2.8], [hx + 1.4, hy + 2.8]]), mat(ramp(0x0e1a22)), { z: 3.4, h: 0.4 });
  !p.hurt && S.decal(hx + 4, hy, 0xa0f8ff).decal(hx + 7.6, hy, 0xa0f8ff);
  S.add(U(capF([hx - 1.4, hy - 9], [hx - 10, hy - 13], 2.2, 0.8), capF([hx - 4, hy - 10], [hx - 12, hy - 9], 1.6, 0.6)), mat(ramp(0xa04040), { tex: "feather" }), { z: 3.6, h: 1 });
  S.add(ellR(hx - 2.6, hy + 4, 1.8, 1.4), RUST, { on: 1, lift: 0.3, h: 0.3 });
  const s = [hx + 3, hy + 14], w = pol(s, 0.6 - sp * 0.6, 11);
  S.add(capF(s, w, 3, 2.4), GHO, { z: 6, h: 2 });
  S.add(ellR(w[0], w[1], 3, 2.8), IRG, { z: 6.4, h: 2 });
  const C = S.render({ rim: !0 });
  fade(C, 42 + b, 74);
  (p.fade ?? 0) > 0 && fade(C, 0, 74 / (p.fade + 0.01));
  return p.hurt ? flash(C) : C;
}
export const pxGhost = spec(50, 53, 16, 30,
  { idle: [6, 8], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], fade: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 1.2, spear: 0.05 };
    if (nm === "move") return { bob: Math.sin(ph) * 1, spear: 0.4 };
    if (nm === "wind") return { spear: 0.4 + 0.6 * t, thrust: -0.5 * t, bob: -0.5 };
    if (nm === "atk") return { spear: 1, thrust: [0.8, 1.4, 1.3][f] };
    if (nm === "rec") return { spear: 1 - 0.6 * t, thrust: 1 - t };
    if (nm === "fade") return { fade: 0.3 + t * 2, bob: 1 };
    return { hurt: f === 0, bob: 1, spear: 0.2 };
  }, ghostFrame, { flying: !0 });

// ════ [정예] 번개 와이번 ════ (큰 몬스터 조각 도구) 청회색 비늘 · 날개가 곧 앞발 · 노란 번개 줄무늬 · 꼬리 가시. 번개 숨결을 내뿜는다
//   p: flap · tilt · jaw · breath 숨결 빛 · tail 꼬리 휘두르기 · hurt
const WVK = 0.72;
const WV_SC = mat(ramp(0x5a6a88), { tex: "skin", amp: 0.5 }), WV_SCF = mat(rampF(0x4e5a76), { tex: "skin", amp: 0.4 });
const WV_MEM = mat(ramp(0x7a8aa8), { tex: "skin", amp: 0.3 }), WV_MEMF = mat(rampF(0x6a7a98), { tex: "skin", amp: 0.3 });
const WV_BEL = mat(ramp(0xc8c0a0), { tex: "stone", amp: 0.3 }), WV_BOLT = mat(rampGlow(0xffe040)), WV_HORN = mat(ramp(0xd8d0b8), { spec: 0.4 });
function wyvernFrame(p = {}) {
  const W = 130, H = 114, S = sculpt(W, H, { k: p.k ?? WVK, ax: 62 });
  const fl = p.flap ?? 0, R = rot([62, 64], p.tilt ?? 0), P = (x, y) => R([x, y + 14]);
  // 날개 = 앞발: 어깨 → 팔꿈치 → 손목(갈고리) → 손가락 뼈 셋, 그 사이 막
  const wing = (far) => {
    const root = P(58, 40), a = -2.0 - fl * 0.9 + (far ? -0.3 : 0), MB = far ? WV_SCF : WV_SC, MM = far ? WV_MEMF : WV_MEM;
    const el = pol(root, a + 0.4, 19), wr = pol(el, a - 0.2, 17), f1 = pol(wr, a + 0.1, 26), f2 = pol(wr, a + 0.75, 22), f3 = pol(wr, a + 1.35, 17);
    S.add(polyF([root, el, wr, f1, lerp(f1, f2, 0.5), f2, lerp(f2, f3, 0.5), f3, P(66, 50)]), MM, { z: far ? -9 : 9, h: 1.4, prof: "flat" });
    S.add(U(capF(root, el, 4.4, 3.4), capF(el, wr, 3.4, 2.6)), MB, { z: far ? -8 : 10, h: 3 });
    for (const q of [f1, f2, f3]) S.add(capF(wr, q, 1.8, 0.7), MB, { z: far ? -8 : 10, h: 1.6 });
    S.add(capF(wr, pol(wr, a - 1.4, 5), 1.4, 0.4), WV_HORN, { z: far ? -7 : 11, h: 1.2 });
    !far && S.add(capF(lerp(root, el, 0.4), lerp(el, wr, 0.6), 1, 0.8), WV_BOLT, { on: 1, h: 0.8 });
  };
  wing(!0);
  // 꼬리 + 번개 가시
  const tw = p.tail ?? 0, t0 = P(40, 56), t1 = P(22, 62 + tw * 6), t2 = P(8, 56 + tw * 14);
  S.add(U(capF(t0, t1, 6, 3.8), capF(t1, t2, 3.8, 1.4)), WV_SC, { z: -2, h: 4 });
  S.add(polyF([pol(t2, 2.7, 4), pol(t2, 3.5, 10), pol(t2, 4.3, 4)]), WV_BOLT, { z: -1, h: 2 });
  // 뒷다리 + 발톱
  for (const [x, far] of [[48, 1], [54, 0]]) { const h0 = P(x, 58), kn = P(x + 6, 68), ft = P(x + 2, 78); S.add(U(capF(h0, kn, far ? 5 : 6, 4), capF(kn, ft, 4, 2.6)), far ? WV_SCF : WV_SC, { z: far ? -4 : 4, h: 3.6 }); for (const d of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 0.3 + d, 4.4), 1.1, 0.4), WV_HORN, { z: far ? -3 : 5, h: 1 }); }
  // 몸통 + 배 비늘 판
  S.add(ellR(...P(58, 52), 20, 12, -0.2), WV_SC, { z: 0, h: 12 });
  S.add(ellR(...P(60, 58), 15, 6, -0.2), WV_BEL, { on: 1, h: 2, lift: 0.6 });
  for (let k = 0; k < 5; k++) S.carve(capF(P(50 + k * 4.5, 55), P(51 + k * 4.5, 62), 0.5), 0.9);
  // 등 번개 줄무늬 (지그재그)
  for (const [x0, y0, x1, y1] of [[44, 46, 50, 43], [50, 43, 48, 48], [48, 48, 56, 44], [60, 42, 66, 40]]) S.add(capF(P(x0, y0), P(x1, y1), 0.9), WV_BOLT, { on: 1, h: 0.8, lift: 0.4 });
  // 목 + 머리 + 뿔 + 턱
  S.add(capF(P(70, 46), P(84, 30), 6.5, 5.2), WV_SC, { blend: 2, h: 5 });
  const hc = P(90, 26), jw = p.jaw ?? 0;
  S.add(U(ellR(hc[0], hc[1], 8, 6.4), polyF([P(90, 20), P(106, 24), P(105, 29), P(92, 31)])), WV_SC, { h: 7 });
  S.add(polyF([P(92, 31), P(104, 30 + jw * 3), P(101, 35 + jw * 4), P(91, 34)]), WV_SC, { h: 4, lift: 1 });
  jw > 0.3 && !p.block && (S.decal(...P(98, 31 + jw * 1.5), 0x6a1a2a), S.decal(...P(99, 32 + jw * 2), 0x6a1a2a));
  S.add(U(capF(P(86, 19), P(76, 8), 2, 0.5), capF(P(90, 18), P(84, 5), 1.8, 0.5)), WV_HORN, { h: 2, lift: 4 });
  S.carve(capF(P(94, 23), P(100, 24), 0.6), 1.4, !1);
  if (!p.block && !p.hurt) { const e0 = P(93, 22); S.decal(e0[0], e0[1], 0xfff060).decal(e0[0] + 1, e0[1], 0xffffff).decal(e0[0], e0[1] + 1, 0xc8a020); }
  (p.breath ?? 0) > 0 && S.add(ellR(...P(108, 30 + jw * 2), 4 * p.breath, 3 * p.breath), WV_BOLT, { z: 20, h: 2 });
  wing(!1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxWyvern = {
  fw: Math.round(130 * WVK), fh: Math.round(114 * WVK), w: 38, h: 30, flying: !0,
  anims: { idle: [4, 12], move: [4, 14], wind: [4, 10, !1], breath: [4, 16], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], tail: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.12 };
    if (nm === "wind") P = { flap: fl * 0.5, tilt: -0.25 * t, jaw: 0.4 * t, breath: t * 0.8 };
    if (nm === "breath") P = { flap: fl * 0.4, tilt: 0.1, jaw: 1.2, breath: 1.4 + (f % 2) * 0.3 };
    if (nm === "atk") P = { flap: -1, tilt: 0.45, jaw: 1 };
    if (nm === "tail") P = { flap: fl, tail: [0, 1, 2, 1][f], tilt: -0.15 };
    if (nm === "rec") P = { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.25, jaw: 1 };
    return wyvernFrame(P);
  },
};
