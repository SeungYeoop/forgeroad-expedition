// 리프크라운 몬스터 12종 (오른쪽을 본다) — 하늘에 뜬 거목 수관, 새 둥지 섬, 줄기 속 굴
//   아래(가지 층): 실 타는 애벌레 · 잎 카멜레온 · 가시 고슴도치 · [정예] 수관 거미
//   가운데(둥지 섬): 까치 도둑 · 최면 나비 · 아기새 떼 · [정예] 거대 어미새
//   위(나무 꼭대기): 호박 정령 · 나뭇잎 요정 궁수 · 딱따구리 기사 · [정예] 고목 수호 정령
//   작은 몬스터 = 부위 명암 손그림(kit board), 정예(큰 몬스터) = 높이 지도 조각(px3 sculpt)
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const LEAF = ramp(0x58b038), LEAFD = ramp(0x3e8a2a), BARK = ramp(0x7a5434), BARKF = rampF(0x6a4a2e), SILK = ramp(0xe8eef0);
const fadeD = (C, a) => { if (a <= 0) return; for (let i = 0; i < C.d.length; i++) if (C.d[i] >= 0 && ((i * 7 + Math.floor(i / C.W) * 3) % 10) / 10 < a) C.d[i] = -1; };

// ════ 실 타는 애벌레 ════ 통통한 연두 애벌레(마디·발·노란 점). 가지에 건 실을 타고 내려와 물고 다시 올라간다
//   p: thread 실 길이(위로) · curl 몸 말기 · bite · wave · hurt
const CAT = ramp(0x8ad040), CATB = ramp(0xe8e070);
const done3 = (C, p) => (p.hurt ? flash(C) : C);
function glint3(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
const C_LEAF = mat(ramp(0x58b038), { tex: "leaf", amp: 1.2 }), C_LEAFD = mat(ramp(0x3e8a2a), { tex: "leaf", amp: 1.2 }), C_BARK = mat(ramp(0x7a5434), { tex: "wood", amp: 1.1, dir: 1.57 });
const C_VD = mat(ramp(0x100c08));
const C_toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
function larvaFrame(p = {}) {
  const W = 42, H = 62, S = sculpt(W, H, { k: 0.72, ax: 21 });
  const th = p.thread ?? 14, cu = p.curl ?? 0, wv = p.wave ?? 0, cx = 21, top = (30 - th) * 1.4;
  const CT = mat(ramp(0x8ad040), { tex: "skin", amp: 0.8, spec: 0.5 }), CTF = mat(rampF(0x6aa830), { tex: "skin" }), CTY = mat(ramp(0xe8e070), { spec: 0.4 });
  const pts = [];
  for (let k = 0; k <= 6; k++) { const a = Math.PI / 2 + Math.sin(wv + k) * 0.25 + cu * k * 0.35; pts.push(k ? pol(pts[k - 1], a, 4.6) : [cx, top + 4]); }
  for (let k = 0; k <= 6; k++) { const w = 5.4 - (k === 6 ? 0.6 : 0) - (k === 0 ? 0.8 : 0); S.add(ellR(pts[k][0], pts[k][1], w, 4.4), k % 2 ? CT : CTF, { z: 1 + k * 0.1, h: 3.6 }); k < 6 && S.add(ellR(pts[k][0] + 2.6, pts[k][1], 1.2, 1.2), CTY, { z: 1.2 + k * 0.1, h: 0.6 }); k < 6 && S.add(capF([pts[k][0] - 4.4, pts[k][1] + 1], [pts[k][0] - 6, pts[k][1] + 2.4], 0.8, 0.5), CTF, { z: 0.8, h: 0.4 }); }
  const hd = pts[6];
  S.add(ellR(hd[0], hd[1] + 3.4, 4.6, 4), mat(ramp(0x6a9a30), { tex: "skin", spec: 0.5 }), { z: 2, h: 3 });
  (p.bite ?? 0) > 0 && S.add(ellR(hd[0], hd[1] + 7, 2.2, 1.4 + p.bite), mat(ramp(0x4a1a10)), { z: 2.2, h: 0.3 });
  S.add(U(capF([hd[0] - 1.4, hd[1] + 5.6], [hd[0] - 4, hd[1] + 8.6], 0.6, 0.3), capF([hd[0] + 1.4, hd[1] + 5.6], [hd[0] + 4, hd[1] + 8.6], 0.6, 0.3)), mat(ramp(0x2a3010)), { z: 2.3, h: 0.3 });
  !p.hurt && S.decal(hd[0] - 1.4, hd[1] + 2.8, 0x101008).decal(hd[0] + 1.8, hd[1] + 2.8, 0x101008);
  const C = S.render({ rim: !0 });
  const Q = C_toPx(W, H, 0.72, 21);
  for (let y = 0; y <= top + 3; y += 0.8) { const q = Q(cx, y); C.px(q[0], q[1], 0xe8eef0); }
  return done3(C, p);
}
export const pxLarva = spec(30, 45, 12, 20,
  { idle: [4, 6], move: [4, 8], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], drop: [3, 12, !1], climb: [4, 10] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "drop") return { thread: 14 + t * 18, wave: ph };
    if (nm === "climb") return { thread: 32 - t * 18, wave: ph * 2, curl: 0.2 };
    if (nm === "wind") return { thread: 30, curl: t * 0.6 };
    if (nm === "atk") return { thread: 32, curl: -0.3, bite: 1 };
    if (nm === "rec") return { thread: 30, curl: 0.3 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, thread: 28, curl: 0.8 };
    return { thread: nm === "move" ? 24 : 14, wave: ph };
  }, larvaFrame, { flying: !0 });

// ════ 잎 카멜레온 ════ 말린 꼬리 · 빙글 도는 눈 · 볏. 몸을 투명하게 감췄다가 긴 혀로 낚아챈다
//   p: legs · hide 투명(0~1) · tongue · eye 눈 돌림 · hurt
const CHA = ramp(0x6ac048), CHAB = ramp(0xd8e890);
function chameleonFrame(p = {}) {
  const W = 92, H = 42, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 46 });
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, tg = p.tongue ?? 0, ey = p.eye ?? 0, cx = 36;
  const CH = mat(ramp(0x6ac048), { tex: "scale", amp: 1, spec: 0.4 }), CHF = mat(rampF(0x52a038), { tex: "scale" }), CHB = mat(ramp(0xd8e890), { tex: "scale", amp: 0.6 });
  const leg = (sh, o, far, front) => { const kn = [sh[0] + (front ? 2 : -2), sh[1] + 4], ft = [sh[0] + o[0] + (front ? 3 : -3), G - 1 - o[1]]; S.add(U(capF(sh, kn, 2, 1.6), capF(kn, ft, 1.6, 1.2)), far ? CHF : CH, { z: far ? -3 : 5, h: 1.2 }); S.add(U(capF(ft, [ft[0] + 2, ft[1]], 0.8), capF(ft, [ft[0] - 2, ft[1]], 0.8)), far ? CHF : CH, { z: far ? -2.9 : 5.1, h: 0.4 }); };
  leg([cx + 10, 26], lg.ff, 1, 1), leg([cx - 10, 26], lg.bf, 1, 0);
  // 말린 꼬리
  const tl = []; let q = [cx - 15, 24], a = Math.PI + 0.3;
  for (let k = 0; k < 10; k++) { const n2 = pol(q, a, 3), w = 3.4 - k * 0.28; tl.push(capF(q, n2, w, w - 0.25)); q = n2; a += k < 3 ? 0.1 : 0.62; }
  S.add(U(...tl), CH, { z: 0.5, h: 2 });
  // 몸 (옆으로 납작 · 등 볏)
  S.add(U(ellR(cx, 20, 16, 8.4)), CH, { z: 1, h: 7 });
  S.add(capF([cx - 12, 25], [cx + 12, 25], 2.4), CHB, { on: 1, lift: 0.3, h: 0.4 });
  for (let k = 0; k < 8; k++) S.add(polyF([[cx - 13 + k * 3.6, 13 - Math.sin((k / 7) * Math.PI) * 1.4], [cx - 12 + k * 3.6, 9.6 - Math.sin((k / 7) * Math.PI) * 2], [cx - 11 + k * 3.6, 13 - Math.sin((k / 7) * Math.PI) * 1.4]]), CHF, { lift: 0.6, h: 0.8, prof: "sharp" });
  for (const [x, y] of [[-8, 18], [0, 16], [7, 20]]) S.add(ellR(cx + x, y, 2.4, 1.4), mat(ramp(0xb8d860), { tex: "scale" }), { on: 1, lift: 0.3, h: 0.3 });
  // 머리 (투구 볏 · 돌출 눈)
  const hx = cx + 20, hy = 19;
  S.add(U(ellR(hx, hy, 7, 6), polyF([[hx - 6, hy - 3], [hx - 2, hy - 11], [hx + 3, hy - 5]]), capF([hx + 2, hy + 1], [hx + 9, hy + 2], 3.6, 2)), CH, { z: 2, h: 5 });
  S.add(capF([hx + 1, hy + 3.4], [hx + 9, hy + 3], 0.4), mat(ramp(0x2a5020)), { on: 1, lift: 0.3, h: 0.2 });
  S.add(ellR(hx + 2, hy - 1.4, 3.4, 3.4), CHF, { z: 2.6, h: 2.4 });
  !p.hurt && S.decal(hx + 2.4 + Math.cos(ey * 2) * 1.2, hy - 1.4 + Math.sin(ey * 2) * 1.2, 0x101010);
  // 혀
  if (tg > 0) { const t0 = [hx + 9, hy + 2], t1 = [hx + 9 + tg * 26, hy + 2 - tg * 2]; S.add(capF(t0, t1, 0.9, 0.9), mat(ramp(0xe86a8a), { tex: "skin", spec: 0.6 }), { z: 2.4, h: 0.6 }); S.add(ellR(t1[0], t1[1], 2.4, 2.4), mat(ramp(0xe86a8a), { tex: "skin", spec: 0.7 }), { z: 2.5, h: 1.6 }); }
  leg([cx + 12, 27], lg.fn, 0, 1), leg([cx - 8, 27], lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  fadeD(C, (p.hide ?? 0) * 0.85);
  return done3(C, p);
}
export const pxChameleon = spec(66, 30, 22, 12,
  { hide: [2, 4], idle: [4, 4], move: [6, 8], wind: [3, 10, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "hide") return { hide: 1, eye: f ? 1 : -1 };
    if (nm === "move") return { legs: gait4(f, n, 3, 1.5), eye: 1 };
    if (nm === "wind") return { eye: 1, hide: 0.3 * (1 - t) };
    if (nm === "atk") return { tongue: [0.5, 1, 1, 0.4][f] };
    if (nm === "rec") return { tongue: 0 };
    if (nm === "hurt") return { hurt: f === 0 };
    return { eye: Math.sin(ph) };
  }, chameleonFrame);

// ════ 가시 고슴도치 ════ 갈색 가시 망토 · 뾰족 주둥이. 몸을 말아 가시를 사방으로 쏘고, 공처럼 굴러 다닌다
//   p: curl(0~1) · roll · bristle 가시 세움 · legs · hurt
const HOG = ramp(0x8a6a4a), QUILL = ramp(0x5a4030), HOGF = ramp(0xd8b890);
function hedgehogFrame(p = {}) {
  const W = 58, H = 40, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 29 });
  const cu = p.curl ?? 0, rl = p.roll ?? 0, br = p.bristle ?? 0, lp = p.legs ?? 0, cx = 28;
  const QL = mat(ramp(0x5a4030), { tex: "fur", amp: 1.4, dir: 0.6 }), QLT = mat(ramp(0xd8c8a8), { spec: 0.4 }), HG = mat(ramp(0xd8b890), { tex: "fur", amp: 0.9 }), HGD = mat(ramp(0x8a6a4a), { tex: "fur", amp: 1 });
  const c = cu > 0.5 ? [cx, G - 12] : [cx - 3, G - 10], r = cu > 0.5 ? 12 : 13;
  if (cu <= 0.5) for (let k = 0; k < 4; k++) { const x = cx - 8 + k * 6, s = Math.sin(lp + k * 1.7); S.add(capF([x, G - 5], [x + s * 2, G - 0.6], 1.4, 1), HGD, { z: k % 2 ? -1 : 3, h: 0.8 }); }
  // 가시 (뒤)
  const sp = (front) => { for (let k = 0; k < 20; k++) { const a = (cu > 0.5 ? -Math.PI : -Math.PI * 0.98) + (k / 19) * (cu > 0.5 ? T2 : Math.PI * 1.05) + rl, s = Math.sin(a * 2.3 + k); if (front ? s < 0 : s >= 0) continue; if (cu <= 0.5 && Math.sin(a) > 0.3) continue; const r0 = pol(c, a, r - 3), tip = pol(c, a + 0.25, r + 4 + br * 4 + (k % 3)); S.add(capF(r0, tip, 1.2, 0.3), QL, { z: front ? 3 : -0.5, h: 0.8 }); front && S.add(ellR(tip[0], tip[1], 0.6, 0.6), QLT, { z: 3.1, h: 0.3 }); } };
  sp(0);
  S.add(cu > 0.5 ? ellR(c[0], c[1], r, r) : minus(ellR(c[0], c[1], r, r * 0.8), (x, y) => y > G - 3), QL, { z: 1, h: 9 });
  if (cu <= 0.5) {
    S.add(U(ellR(cx + 10, G - 7, 6, 5), polyF([[cx + 13, G - 9], [cx + 20, G - 6], [cx + 14, G - 4]])), HG, { z: 2, h: 4 });
    S.add(ellR(cx + 20, G - 6, 1.2, 1), C_VD, { z: 2.4, h: 0.4 });
    S.add(ellR(cx + 9, G - 11, 1.8, 1.6), HGD, { z: 2.2, h: 1 });
    !p.hurt && S.decal(cx + 14, G - 9, 0x101010);
  } else S.add(ellR(c[0] + Math.cos(rl) * 3, c[1] + Math.sin(rl) * 3, 4, 3.4), HG, { z: 1.4, h: 2 });
  sp(1);
  return done3(S.render({ rim: !0 }), p);
}
export const pxHedgehog = spec(42, 29, 18, 14,
  { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1], roll: [4, 20] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2 };
    if (nm === "wind") return { curl: t, bristle: t };
    if (nm === "atk") return { curl: 1, bristle: [1.6, 1, 0.6][f] };
    if (nm === "roll") return { curl: 1, roll: ph, bristle: 0.4 };
    if (nm === "rec") return { curl: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, bristle: 1 };
    return { bristle: Math.max(0, Math.sin(ph)) * 0.3 };
  }, hedgehogFrame);

// ════ 까치 도둑 ════ 검은 머리와 흰 배, 푸른 윤기 꼬리. 반짝이는 것을 노려 낚아채고 달아난다
//   p: flap · loot 부리에 문 반짝이 · tilt · hurt
const MAG = ramp(0x202430), MAGW = ramp(0xf0f0ec), MAGB = ramp(0x3a5aa8);
function magpieFrame(p = {}) {
  const W = 72, H = 50, S = sculpt(W, H, { k: 0.72, ax: 36 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, piv = [36, 24];
  const P = (x, y) => { const dx = x - piv[0], dy = y - piv[1], c = Math.cos(tl), s = Math.sin(tl); return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c]; };
  const BK = mat(ramp(0x202430), { tex: "feather", amp: 0.9, dir: 0.2, spec: 0.6 }), BKF = mat(rampF(0x181a24), { tex: "feather", dir: 0.2 }), WH = mat(ramp(0xf0f0ec), { tex: "feather", amp: 0.6 }), BL = mat(ramp(0x3a5aa8), { tex: "feather", amp: 0.8, spec: 0.8 });
  const wing = (far) => { const r = P(34, 20), a = -2.1 - fl * 0.8 + (far ? -0.25 : 0), tip = pol(r, a, 25), m = pol(r, a + 0.5, 17); S.add(polyF([r, m, lerp(m, tip, 0.5), tip, pol(r, a - 0.2, 13), P(30, 26)]), far ? BKF : BK, { z: far ? -2 : 6, h: 1.6 }); !far && S.add(capF(lerp(r, m, 0.3), lerp(r, tip, 0.55), 1.6, 1), WH, { on: 1, lift: 0.3, h: 0.3 }); !far && S.add(capF(lerp(r, tip, 0.6), tip, 1.2, 0.4), BL, { on: 1, lift: 0.3, h: 0.3 }); };
  wing(1);
  S.add(polyF([P(24, 23), P(4, 20), P(3, 25), P(24, 27)]), BL, { z: 0, h: 1.4 });
  S.carve(capF(P(22, 25), P(5, 22.6), 0.3), 0.5);
  S.add(ellR(...P(34, 24), 12, 6.4, tl), BK, { z: 1, h: 5 });
  S.add(ellR(...P(36, 27), 8, 3.4, tl), WH, { on: 1, lift: 0.3, h: 0.6 });
  S.add(ellR(...P(46, 19), 5.6, 5), BK, { z: 2, h: 4 });
  S.add(polyF([P(50, 17.6), P(57, 19), P(50, 21)]), mat(ramp(0x1a1a20), { spec: 0.8 }), { z: 2.4, h: 1, prof: "sharp" });
  !p.hurt && S.decal(...P(48, 17.6), 0xe8e8e8);
  if (p.loot) S.add(ellR(...P(57, 20.4), 2.2, 2.2), mat(ramp(0xf0c040), { spec: 1 }), { z: 2.6, h: 1.4 });
  wing(0);
  const C = S.render({ rim: !0 });
  p.loot && glint3(C, C_toPx(W, H, 0.72, 36), ...P(57, 19), 2, 0xfff0a0);
  return done3(C, p);
}
export const pxMagpie = spec(52, 36, 18, 12,
  { idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], flee: [4, 18] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tilt: -0.2 * t };
    if (nm === "atk") return { flap: -1, tilt: 0.45 };
    if (nm === "flee") return { flap: fl, loot: 1, tilt: -0.15 };
    if (nm === "rec") return { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.5, tilt: -0.3 };
    return { flap: fl };
  }, magpieFrame, { flying: !0 });

// ════ 최면 나비 ════ 커다란 눈알 무늬 날개(보라·청록). 날개 가루를 뿌리면 잠깐 좌우가 헷갈린다
//   p: flap(0 접음 ~ 1 활짝) · dust · hurt
const BWG = ramp(0x8a5ad8), BWG2 = ramp(0x40c8c0);
function butterflyFrame(p = {}) {
  const W = 66, H = 58, S = sculpt(W, H, { k: 0.72, ax: 33 });
  const fl = p.flap ?? 0, cx = 33, cy = 29, sq = 0.3 + fl * 0.7;
  const W1 = mat(ramp(0x8a5ad8, { hi: 0.5 }), { tex: "feather", amp: 0.5, spec: 0.4 }), W2 = mat(ramp(0x40c8c0), { tex: "feather", amp: 0.5, spec: 0.4 }), BD = mat(ramp(0x2a2234), { tex: "fur", amp: 1.2, dir: 1.57 });
  for (const d of [-1, 1]) {
    const X = (x) => cx + (x - cx) * sq;
    S.add(U(ellR(X(cx + d * 15), cy - 9, 14 * sq + 1, 11, d * 0.3)), d < 0 ? mat(rampF(0x6a44b0), { tex: "feather" }) : W1, { z: d < 0 ? -1 : 2, h: 1.4 });
    S.add(U(ellR(X(cx + d * 11), cy + 8, 9 * sq + 1, 8.6, -d * 0.4)), d < 0 ? mat(rampF(0x30a8a0), { tex: "feather" }) : W2, { z: d < 0 ? -1.2 : 1.8, h: 1.2 });
    if (sq > 0.5) { const ec = [X(cx + d * 16), cy - 9]; S.add(ellR(ec[0], ec[1], 5 * sq, 4.4), mat(ramp(0xf8d860), { spec: 0.4 }), { on: 1, lift: 0.3, h: 0.3 }); S.add(ellR(ec[0], ec[1], 3 * sq, 2.8), mat(ramp(0x1a1030)), { on: 1, lift: 0.4, h: 0.2 }); S.add(ellR(ec[0] - sq, ec[1] - 1, 0.9 * sq, 0.8), mat(ramp(0xffffff)), { on: 1, lift: 0.5, h: 0.2 }); }
  }
  S.add(U(ellR(cx, cy, 2.6, 11), ellR(cx, cy - 12, 2.8, 2.6)), BD, { z: 3, h: 2.4 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 2, cy + k * 2.6], [cx + 2, cy + k * 2.6], 0.3), 0.5);
  for (const d of [-1, 1]) S.add(U(capF([cx + d, cy - 14], [cx + d * 6, cy - 22], 0.5, 0.3), ellR(cx + d * 6.4, cy - 22.6, 1, 1)), BD, { z: 3.2, h: 0.3 });
  const C = S.render({ rim: !0 });
  if (p.dust) { const Q = C_toPx(W, H, 0.72, 33); for (let k = 0; k < 14; k++) { const q = Q(cx + Math.cos(k * 1.3) * (14 + (k % 4) * 5), cy + 10 + Math.sin(k * 2.1) * 8 + k); C.px(q[0], q[1], k % 2 ? 0xe0c8ff : 0xa8f0e8); } }
  return done3(C, p);
}
export const pxButterfly = spec(48, 42, 20, 18,
  { idle: [4, 10], move: [4, 12], wind: [3, 10, !1], atk: [4, 12, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.5, 0, 0.5][f % 4];
    if (nm === "wind") return { flap: 1 - t * 0.6 };
    if (nm === "atk") return { flap: [0, 1, 0, 1][f], dust: 1 };
    if (nm === "rec") return { flap: fl };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.3 };
    return { flap: fl };
  }, butterflyFrame, { flying: !0 });

// ════ 아기새 떼 ════ 둥지에서 뛰쳐나온 솜털 아기새 셋. 우르르 몰려와 쪼아 댄다
//   p: hop 위상 · peck · hurt
const CHK = ramp(0xf8d050), CHKD = ramp(0xe8a038);
function chicksFrame(p = {}) {
  const W = 66, H = 34, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 33 });
  const hp = p.hop ?? 0, pk = p.peck ?? 0;
  const CK = mat(ramp(0xd8b050), { tex: "fur", amp: 1.3, dir: 1.2 }), CKD = mat(ramp(0xa87a38), { tex: "fur", amp: 1.2 }), BK = mat(ramp(0xe8a038), { spec: 0.5 });
  [[-16, 1], [14, 1], [0, 0]].forEach(([dx, far], k) => {
    const c = [33 + dx, G - 8 - Math.max(0, Math.sin(hp + k * 2)) * 4 - far * 2], z = far ? -1 + k : 3, pkk = k === 2 ? pk : 0;
    for (const d of [-1.6, 1.6]) S.add(capF([c[0] + d, c[1] + 5], [c[0] + d + 1, G - 0.6 - far * 2], 0.6, 0.4), BK, { z: z - 0.2, h: 0.3 });
    S.add(ellR(c[0], c[1], 7, 6.4), CK, { z, h: 5 });
    S.add(polyF([[c[0] - 5, c[1] - 1], [c[0] - 10, c[1] - 4], [c[0] - 7, c[1] + 2]]), CKD, { z: z + 0.1, h: 1 });
    S.add(ellR(c[0] - 1, c[1] + 1, 3.6, 3), CKD, { z: z + 0.2, h: 1.4 });
    for (let k2 = 0; k2 < 3; k2++) S.add(capF([c[0] - 1 + k2 * 1.6, c[1] - 6], [c[0] - 2 + k2 * 2, c[1] - 9], 0.5, 0.2), CK, { z: z + 0.1, h: 0.3 });
    const bk = [c[0] + 6 + pkk * 2, c[1] - 1 + pkk * 3];
    S.add(U(polyF([[bk[0] - 1, bk[1] - 2], [bk[0] + 4, bk[1]], [bk[0] - 1, bk[1] + 1.6]])), BK, { z: z + 0.3, h: 0.6, prof: "sharp" });
    !p.hurt && S.decal(c[0] + 3, c[1] - 2, 0x101010);
  });
  return done3(S.render({ rim: !0 }), p);
}
export const pxChicks = spec(48, 24, 26, 12,
  { idle: [4, 8], move: [4, 12], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { hop: ph };
    if (nm === "wind") return { hop: 0, peck: -0.5 * t };
    if (nm === "atk") return { peck: [1, 0, 1][f], hop: f };
    if (nm === "hurt") return { hurt: f === 0 };
    return { hop: Math.sin(ph) * 0.4 };
  }, chicksFrame);

// ════ 호박 정령 ════ 굳은 수액(호박) 몸 속에 잎과 작은 벌레가 갇혀 있다. 끈적한 수액 덩이를 던져 굳힌다
//   p: wob · drip · throw 팔 · hurt
const AMB = rampGlow(0xf0a028), AMBD = ramp(0xc87818);
function amberFrame(p = {}) {
  const W = 52, H = 60, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const wb = p.wob ?? 0, dr = p.drip ?? 0, tw = p.throw ?? 0, cx = 26;
  const AM = mat(ramp(0xf0a028, { hi: 0.7 }), { tex: "glass", amp: 1.1, spec: 1 }), AMD = mat(ramp(0xc87818), { tex: "glass", amp: 1 });
  S.add(U(ellR(cx, 30, 13 + wb, 15 - wb), ellR(cx - 2, 16, 8, 7)), AM, { z: 1, h: 11 });
  for (let k = 0; k < 3; k++) S.add(capF([cx - 8 + k * 7, 42 - k], [cx - 8 + k * 7 + Math.sin(k + wb) * 1, 48 + dr * 4 + k * 2], 1.6 - k * 0.2, 0.8), AMD, { z: 0.8, h: 1 });
  // 갇힌 잎 · 벌레
  S.add(polyF([[cx - 6, 30], [cx + 2, 26], [cx + 4, 33], [cx - 3, 36]]), mat(ramp(0x6a8a30), { tex: "leaf" }), { on: 1, lift: -1.2, h: 0.3 });
  S.add(U(ellR(cx + 5, 37, 2.4, 1.4), ellR(cx + 7.6, 37, 1.4, 1.2)), mat(ramp(0x3a2010)), { on: 1, lift: -1.2, h: 0.3 });
  S.add(ellR(cx - 6, 22, 3, 5), mat(ramp(0xfff0c0), { spec: 1 }), { on: 1, lift: 0.4, h: 0.3 });
  for (const x of [cx + 1, cx + 6]) S.add(ellR(x, 16, 1.4, 1.8), mat(ramp(0x4a2008)), { z: 1.6, lift: 0.1, h: 0.2 });
  // 팔 (던지기)
  const sh = [cx + 10, 26], hd = tw > 0 ? pol(sh, -2 + tw * 1.8, 12) : [cx + 16, 36];
  S.add(capF(sh, hd, 3, 2.6), AM, { z: 4, h: 2 });
  tw > 0 && tw < 1.3 && S.add(ellR(hd[0], hd[1], 3.6, 3.4), AMD, { z: 4.4, h: 2.4 });
  const C = S.render({ rim: !0 });
  glint3(C, C_toPx(W, H, 0.72, 26), cx - 6, 20, 1, 0xfff8d8);
  return done3(C, p);
}
export const pxAmber = spec(37, 43, 16, 22,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { throw: 0.4 + t * 0.4, wob: t };
    if (nm === "atk") return { throw: [0.8, 1.2, 1.4][f] };
    if (nm === "rec") return { throw: 0, wob: Math.sin(t * 5) * 0.5 };
    if (nm === "hurt") return { hurt: f === 0, wob: 1 };
    return { wob: Math.sin(ph) * 0.7, drip: (f % 3) / 2 };
  }, amberFrame, { flying: !0 });

// ════ 나뭇잎 요정 궁수 ════ 잎사귀 망토와 두건을 쓴 작은 요정. 덩굴 활을 당겨 쏘고 뒤로 물러난다
//   p: bob · legs · draw 시위 당김(0~1) · hurt
const FSK = ramp(0xf0d0b0), CLOAK = ramp(0x4a9a3a), BOWW = ramp(0x8a5a30);
function archerFrame(p = {}) {
  const W = 58, H = 58, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, dw = p.draw ?? 0, cx = 24;
  const SKN = mat(ramp(0xf0d0b0), { tex: "skin", amp: 0.6 }), CLK = mat(ramp(0x4a9a3a), { tex: "leaf", amp: 1.1 }), CLKF = mat(rampF(0x3a7a2e), { tex: "leaf" }), BOW = mat(ramp(0x8a5a30), { tex: "wood", amp: 1 });
  for (const [o, far, d] of [[g.f, 1, -2], [g.n, 0, 3]]) { const hp = [cx + d, 40 + b], ft = [cx + d + o[0], G - 1 - o[1]]; S.add(capF(hp, ft, 2, 1.6), far ? mat(rampF(0x5a4030), { tex: "leather" }) : mat(ramp(0x6a4a30), { tex: "leather" }), { z: far ? -2 : 3, h: 1.4 }); S.add(ellR(ft[0] + 1.4, ft[1] - 0.6, 2.6, 1.2), mat(ramp(0x4a3020), { tex: "leather" }), { z: far ? -1.9 : 3.1, h: 0.8 }); }
  // 잎 망토 (등)
  S.add(polyF([[cx - 6, 24 + b], [cx + 4, 24 + b], [cx - 2, 44 + b], [cx - 12, 46 + b], [cx - 10, 36 + b]]), CLKF, { z: -1, h: 3 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 5 + k * 2, 26 + b], [cx - 10 + k * 2.4, 44 + b], 0.4), 0.6);
  S.add(U(ellR(cx, 33 + b, 6, 8)), CLK, { z: 1, h: 5 });
  S.add(capF([cx - 5, 37 + b], [cx + 5, 37 + b], 1), mat(ramp(0x6a4a30), { tex: "leather" }), { z: 1.4, h: 0.6 });
  // 머리 + 잎 두건 · 뾰족 귀
  const hx = cx + 2, hy = 21 + b;
  S.add(ellR(hx, hy, 4.6, 5), SKN, { z: 3, h: 3.6 });
  S.add(polyF([[hx - 3, hy - 1], [hx - 9, hy - 4], [hx - 3, hy + 2]]), SKN, { z: 2.8, h: 1 });
  S.add(U(minus(ellR(hx - 1, hy - 2, 6, 5.4), (x, y) => x > hx + 2 && y > hy - 2), polyF([[hx - 4, hy - 6], [hx - 10, hy - 12], [hx - 2, hy - 7]])), CLK, { z: 3.4, h: 3 });
  !p.hurt && S.decal(hx + 2.6, hy, 0x205020);
  // 활 (덩굴) + 팔
  const bc = [cx + 12, 30 + b];
  S.add(U(capF([bc[0] - 2, bc[1] - 13], [bc[0] + 2, bc[1]], 1, 0.9), capF([bc[0] + 2, bc[1]], [bc[0] - 2, bc[1] + 13], 0.9, 1)), BOW, { z: 5, h: 0.8 });
  for (const y of [-8, 7]) S.add(ellR(bc[0] + 0.6, bc[1] + y, 1.6, 1), C_LEAF, { z: 5.1, h: 0.4 });
  const str = [bc[0] - 4 - dw * 9, bc[1]];
  S.add(capF(sh0(cx), [bc[0] + 1, bc[1]], 1.4), SKN, { z: 5.2, h: 1 });
  S.add(capF([cx + 3, 28 + b], str, 1.4), SKN, { z: 5.4, h: 1 });
  dw > 0.2 && S.add(capF(str, [str[0] + 18, str[1]], 0.5), mat(ramp(0xc8b080), { tex: "wood" }), { z: 5.6, h: 0.3 }).add(polyF([[str[0] + 18, str[1] - 1.4], [str[0] + 22, str[1]], [str[0] + 18, str[1] + 1.4]]), mat(ramp(0xc8c8c0), { spec: 0.6 }), { z: 5.7, h: 0.3, prof: "sharp" });
  const C = S.render({ rim: !0 });
  const Q = C_toPx(W, H, 0.72, 26);
  for (const [a, b2] of [[[bc[0] - 2, bc[1] - 13], str], [str, [bc[0] - 2, bc[1] + 13]]]) for (let t = 0; t <= 1; t += 0.08) { const q = Q(L(a[0], b2[0], t), L(a[1], b2[1], t) + b); C.px(q[0], q[1], 0xe8e0c8); }
  return done3(C, p);
  function sh0(x) { return [x + 4, 27 + b]; }
}
export const pxArcher = spec(42, 42, 12, 20,
  { idle: [4, 6], move: [6, 12], wind: [4, 10, !1], atk: [2, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") { const g = gait2(f, n, 3, 2); return { legs: g, bob: g.bob }; }
    if (nm === "wind") return { draw: t };
    if (nm === "atk") return { draw: f === 0 ? 1 : 0 };
    if (nm === "hurt") return { hurt: f === 0 };
    return { bob: Math.sin(ph) * 0.5, draw: 0.1 };
  }, archerFrame);

// ════ 딱따구리 기사 ════ 붉은 볏 투구 · 나무껍질 흉갑 · 송곳 같은 부리. 부리로 쉴 새 없이 쪼는 연타
//   p: bob · legs · peck 쪼기(0~1) · lean · hurt
const WPK = ramp(0x2a2a34), WPKW = ramp(0xf0f0e8), CREST2 = ramp(0xd83a2a);
function woodpeckerFrame(p = {}) {
  const W = 66, H = 66, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 28 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pk = p.peck ?? 0, ln = p.lean ?? 0, cx = 26;
  const BK = mat(ramp(0x2a2a34), { tex: "feather", amp: 0.9, dir: 0.4, spec: 0.5 }), WH = mat(ramp(0xf0f0e8), { tex: "feather", amp: 0.6 }), CR = mat(ramp(0xd83a2a), { tex: "feather", amp: 0.8 }), BRK = mat(ramp(0x8a6a44), { tex: "wood", amp: 1.2, dir: 1.57 }), BKF = mat(rampF(0x6a5034), { tex: "wood", dir: 1.57 });
  // 다리 (새 다리 · 갈고리 발)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) { const hp = [cx + d, 44 + b], kn = [cx + d - 3, 50 + b], ft = [cx + d + o[0], G - 1 - o[1]]; S.add(U(capF(hp, kn, 2.6, 2), capF(kn, ft, 1.4, 1.2)), far ? mat(rampF(0x5a5a64)) : mat(ramp(0x6a6a74), { tex: "skin" }), { z: far ? -2 : 3, h: 1.2 }); for (const e of [-0.2, 0.3, Math.PI - 0.2]) S.add(capF(ft, pol(ft, e, 3.4), 0.6, 0.3), mat(ramp(0x3a3a40)), { z: far ? -1.9 : 3.1, h: 0.3 }); }
  // 꼬리 깃 (지탱)
  S.add(polyF([[cx - 6, 38 + b], [cx - 14, G - 4], [cx - 9, G - 2], [cx - 2, 40 + b]]), BK, { z: -1, h: 1.4 });
  // 몸 + 나무껍질 흉갑
  const lx = ln * 6;
  S.add(U(ellR(cx + lx * 0.5, 34 + b, 9, 12)), BK, { z: 1, h: 7 });
  S.add(polyF([[cx - 5 + lx * 0.5, 26 + b], [cx + 8 + lx * 0.5, 26 + b], [cx + 9 + lx * 0.5, 42 + b], [cx - 4 + lx * 0.5, 44 + b]]), BRK, { z: 2, h: 3, prof: "flat" });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 4 + lx * 0.5, 30 + k * 5 + b], [cx + 8 + lx * 0.5, 30 + k * 5 + b], 0.4), 0.7);
  S.add(polyF([[cx - 6 + lx * 0.3, 26 + b], [cx - 12, 36 + b], [cx - 6, 40 + b]]), mat(ramp(0x202028), { tex: "feather", dir: 1 }), { z: 2.4, h: 1.4 });
  for (let k = 0; k < 3; k++) S.add(capF([cx - 9 + k * 1.2, 30 + k * 3 + b], [cx - 6 + k * 1.2, 30 + k * 3 + b], 0.5), WH, { z: 2.6, h: 0.3 });
  // 머리 (볏 투구) + 송곳 부리
  const hx = cx + 6 + lx, hy = 18 + b;
  S.add(ellR(hx, hy, 6.4, 6), BK, { z: 3, h: 5 });
  S.add(capF([hx - 4, hy + 2.4], [hx + 4, hy + 3], 1.6), WH, { on: 1, lift: 0.3, h: 0.4 });
  S.add(U(minus(ellR(hx - 1, hy - 2, 7, 6), (x, y) => y > hy - 1), polyF([[hx - 6, hy - 6], [hx - 12, hy - 4], [hx - 6, hy - 2]])), CR, { z: 3.4, h: 3 });
  S.add(capF([hx - 7, hy - 1.2], [hx + 7, hy - 1.2], 0.8), mat(ramp(0xa89060), { tex: "metal", spec: 0.6 }), { z: 3.6, h: 0.5 });
  const ba = -0.05 + pk * 0.25;
  S.add(polyF([pol([hx + 5, hy], ba - 1.57, 1.6), pol([hx + 5, hy], ba, 14 + pk * 2), pol([hx + 5, hy], ba + 1.57, 1.6)]), mat(ramp(0x3a3a40), { tex: "metal", spec: 0.9 }), { z: 3.8, h: 1, prof: "sharp" });
  !p.hurt && S.decal(hx + 2.4, hy - 0.4, 0xffffff).decal(hx + 2.8, hy - 0.4, 0x101010);
  // 날개 팔 (방패처럼 접힘)
  S.add(U(ellR(cx + 3 + lx * 0.5, 34 + b, 5, 9, 0.2)), mat(ramp(0x24242c), { tex: "feather", amp: 1, dir: 1.3 }), { z: 4, h: 3 });
  for (let k = 0; k < 3; k++) S.add(capF([cx + 1 + lx * 0.5, 30 + k * 4 + b], [cx + 6 + lx * 0.5, 32 + k * 4 + b], 0.5), WH, { z: 4.2, h: 0.3 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxWoodpecker = spec(48, 48, 14, 26,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 22], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") { const g = gait2(f, n, 2.5, 2.5); return { legs: g, bob: g.bob - 0.5, lean: 0.1 }; }
    if (nm === "wind") return { peck: -0.4 * t, lean: -0.2 * t };
    if (nm === "atk") return { peck: f % 2 ? 1 : 0.2, lean: 0.4 };
    if (nm === "rec") return { peck: 0, lean: 0.3 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, lean: -0.3 };
    return { bob: Math.sin(ph) * 0.4 };
  }, woodpeckerFrame);

// ════════════ 정예 (큰 몬스터 조각 도구) ════════════
// 재질: 7단 색 묶음 + 질감
const TEXM = (c, o = {}) => mat(ramp(c, o), o);

// ════ [정예] 수관 거미 ════ 잎 무늬 배를 가진 커다란 숲 거미. 여덟 다리 · 독 송곳니 · 눈 여덟(둘은 크게).
//   가지 사이에 거미줄 덫을 놓고, 실을 타고 내려와 문다
//   p: bob · legs 위상 · fang 송곳니 벌림 · rear 앞다리 치켜들기 · spin 실 뽑기(배 들기) · hang 실 길이(위로) · hurt
const SPK = 0.72; // 설계 96×74 → 69×53
const SPB = mat(ramp(0x3a4a2a), { tex: "fur", amp: 0.5, dir: 1.2 }), SPBF = mat(rampF(0x3a4a2a), { tex: "fur", amp: 0.4, dir: 1.2 });
const SPA = mat(ramp(0x5a7a34), { tex: "skin", amp: 0.2 }), SPAL = mat(ramp(0x9ad050), { tex: "skin", amp: 0.1 });
const SPLEG = mat(ramp(0x2e3a22), { tex: "fur", amp: 0.6, dir: 1.6 }), SPLEGF = mat(rampF(0x2e3a22), { tex: "fur", amp: 0.5, dir: 1.6 });
const FANG = mat(ramp(0xd8d0b0), { spec: 0.4 });
function spiderFrame(p = {}) {
  const W = 96, H = 74, G = H - 1, S = sculpt(W, H, { k: p.k ?? SPK, ax: 46 }), b = p.bob ?? 0;
  const lp = p.legs ?? 0, rr = p.rear ?? 0, sp = p.spin ?? 0, hg = p.hang ?? 0;
  const cy = 60 + b - hg * 14;
  // 실 (매달렸을 때)
  hg > 0 && S.add(capF([52, 0], [52, cy - 10], 0.5), mat(ramp(0xe8f0f4)), { h: 0.5, z: -6 });
  // 다리 여덟: 몸 둘레에서 위로 꺾였다 땅으로. 뒤쪽(먼) 넷 먼저
  const leg = (sx, sy, dir, k, far) => {
    const ph = lp + k * 1.3 + (far ? 1.6 : 0), lift = Math.max(0, Math.sin(ph)) * 3;
    const front = k >= 2, up = front && !far && rr > 0 ? rr : 0;
    // 무릎은 몸보다 높이 솟고(아치), 발은 몸에서 멀리 벌어진다. 뒷다리 둘은 배 너머 뒤로
    const reach = dir < 0 ? 30 + (k % 2) * 14 : 26 + (k % 2) * 12;
    const kn = [sx + dir * reach * 0.45, sy - 22 - (k % 2) * 5 - lift - up * 8];
    const ft = up > 0 ? [sx + dir * 28, sy - 26 - up * 6] : [sx + dir * reach + Math.cos(ph) * 2, (hg ? sy + 10 : G) - lift * 0.6];
    const m = far ? SPLEGF : SPLEG;
    S.add(capF([sx, sy], kn, 2.4, 1.9), m, { z: far ? -4 : 2, h: 2.2 });
    S.add(capF(kn, ft, 1.9, 0.8), m, { z: far ? -4 : 2, h: 1.8 });
    S.add(ellR(kn[0], kn[1], 2.3, 2.3), m, { blend: 1, h: 0.8 });
    return kn;
  };
  for (let k = 0; k < 4; k++) leg(48 + (k < 2 ? -2 : 2), cy - 3, k < 2 ? -1 : 1, k, !0);
  // 배 (뒤, 크고 둥근) + 잎맥 무늬
  const ab = [26, cy - 8 - sp * 6];
  S.add(ellR(ab[0], ab[1], 20, 15, -0.2 - sp * 0.3), SPA, { h: 14 });
  S.paint((x, y) => {
    const u = (x - ab[0]) / 20, v = (y - ab[1]) / 15;
    return u * u + v * v < 1 && (Math.abs(v + u * 0.2) < 0.08 || Math.abs(Math.abs(v) - Math.abs(u + 0.3) * 0.7) < 0.07);
  }, SPAL);
  for (const [dx, dy] of [[-6, -6], [4, -8], [-10, 2]]) S.add(ellR(ab[0] + dx, ab[1] + dy, 2.6, 1.8), SPAL, { blend: 1.5, h: 1.2 });
  S.tone(ellR(ab[0] + 6, ab[1] + 9, 14, 6), -0.12);
  S.add(capF([ab[0] - 18, ab[1] + 6], [ab[0] - 22, ab[1] + 9], 1.6, 1), SPB, { h: 1.4 }); // 실샘
  // 머리가슴 (앞)
  const hc = [56, cy - 8];
  S.add(ellR(hc[0], hc[1], 12, 9.5), SPB, { h: 9 });
  S.add(ellR(hc[0] + 7, hc[1] - 3, 6.5, 5.5), SPB, { blend: 3, h: 3 });
  S.carve(capF([hc[0] - 4, hc[1] - 7], [hc[0] + 1, hc[1] + 3], 0.7), 1);
  // 송곳니 (아래로, 벌리면 바깥으로)
  const fg = p.fang ?? 0;
  for (const s of [-1, 1]) { const r0 = [hc[0] + 11, hc[1] + 3 + s * 1.5], r1 = [r0[0] + 3 + fg * 2, r0[1] + 6 + s * fg * 2]; S.add(capF(r0, r1, 2, 0.6), FANG, { h: 1.6, lift: 4 }); }
  S.add(capF([hc[0] + 10, hc[1] + 1], [hc[0] + 13, hc[1] + 3], 2.2, 1.6), SPB, { h: 2, lift: 3 }); // 더듬이 수염
  // 앞다리 넷 (가까운)
  for (let k = 0; k < 4; k++) leg(52 + (k < 2 ? -2 : 2), cy - 1, k < 2 ? -1 : 1, k, !1);
  // 눈 여덟 (큰 둘 + 작은 여섯)
  if (!p.block) {
    const ec = p.hurt ? 0x3a3a2a : 0xd8f040;
    for (const [x, y, big] of [[64.5, cy - 13, 1], [61.5, cy - 13.5, 1], [66, cy - 16, 0], [63, cy - 16.5, 0], [60, cy - 16, 0], [67, cy - 11, 0]]) {
      S.decal(x, y, ec);
      big && (S.decal(x + 1, y, ec), S.decal(x, y - 1, 0xffffff));
    }
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxSpider = {
  fw: Math.round(96 * SPK), fh: Math.round(74 * SPK), w: 36, h: 24,
  anims: { idle: [4, 6], move: [6, 12], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], web: [4, 10, !1], hang: [4, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, legs: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { legs: ph * 2, bob: -Math.abs(Math.sin(ph * 2)) * 0.8 };
    if (nm === "wind") P = { rear: t, fang: t, bob: t };
    if (nm === "atk") P = { rear: 0.3, fang: [1, 1.4, 1][f], bob: -1, legs: 1 };
    if (nm === "rec") P = { rear: 0.4 * (1 - t), fang: 1 - t };
    if (nm === "web") P = { spin: [0.4, 1, 1, 0.5][f], fang: 0.3 };
    if (nm === "hang") P = { hang: 1, legs: Math.sin(ph) * 0.5, bob: Math.sin(ph) };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.2, fang: 0.8 };
    return spiderFrame(P);
  },
};

// ════ [정예] 거대 어미새 ════ 둥지를 지키는 큰 숲새. 주홍 가슴 털 · 금빛 볏 · 넓은 날개. 깃털 탄막 · 돌풍 · 아기새를 부른다
//   p: flap(-1~1) · tilt · beak 부리 벌림 · fluff 가슴털 부풀림 · talon 발톱 · hurt
const MBK = 0.72;
const MB_BACK = mat(ramp(0x6a4a2e), { tex: "fur", amp: 0.7, dir: 0.4 }), MB_BACKF = mat(rampF(0x6a4a2e), { tex: "fur", amp: 0.6, dir: 0.4 });
const MB_CH = mat(ramp(0xe0702e), { tex: "fur", amp: 0.8, dir: 1.5 }), MB_CR = mat(ramp(0xf0c040), { tex: "fur", amp: 0.5, dir: -1.2 });
const MB_BEAK = mat(ramp(0xe8b830), { spec: 0.4 }), MB_TAL = mat(ramp(0x4a3a30), { spec: 0.3 }), MB_WHITE = mat(ramp(0xf0ead8), { tex: "fur", amp: 0.4, dir: 1.5 });
function motherFrame(p = {}) {
  const W = 112, H = 92, S = sculpt(W, H, { k: p.k ?? MBK, ax: 56 });
  const fl = p.flap ?? 0, R = rot([56, 48], p.tilt ?? 0), P = (x, y) => R([x, y]), fz = p.fluff ?? 0;
  // 날개 (먼 쪽 먼저): 어깨 → 손목 → 깃 끝. 깃은 칸칸이
  const wing = (far) => {
    const root = P(50, 36), a = -2.1 - fl * 0.85 + (far ? -0.3 : 0), len = 46, m = far ? MB_BACKF : MB_BACK;
    const wr = pol(root, a + 0.35, len * 0.45), tip = pol(root, a, len);
    S.add(U(capF(root, wr, 6, 4.6), capF(wr, tip, 4.6, 2.4)), m, { z: far ? -6 : 8, h: 4 });
    for (let k = 0; k < 7; k++) { const q = lerp(wr, tip, k / 7), fa = a + 1.6 + k * 0.05; S.add(capF(q, pol(q, fa, 16 - k * 1.1), 2.6, 1), k % 2 ? m : far ? MB_BACKF : MB_WHITE, { z: far ? -7 : 7, h: 1.6 }); }
    S.add(capF(lerp(root, wr, 0.2), lerp(wr, tip, 0.4), 4, 3), m, { blend: 2, h: 1.2 });
  };
  wing(!0);
  // 꼬리깃 (부채)
  for (let k = -2; k <= 2; k++) S.add(capF(P(30, 54), P(12, 56 + k * 4), 3.4, 1.8), k % 2 ? MB_BACK : MB_BACKF, { z: -2, h: 2 });
  // 몸통 + 주홍 가슴 (부풀면 크게)
  S.add(ellR(...P(52, 50), 22, 15, -0.15), MB_BACK, { z: 0, h: 13 });
  S.add(ellR(...P(64, 52), 13 + fz * 3, 13 + fz * 2), MB_CH, { blend: 5, h: 7 + fz * 2 });
  for (let k = 0; k < 5; k++) S.carve(capF(P(58 + k * 2.5, 44 + k * 3), P(66 + k * 2, 46 + k * 3), 0.5), 0.8);
  // 발 (발톱)
  const tl = p.talon ?? 0;
  for (const [x, far] of [[50, 1], [58, 0]]) { const s = P(x, 62), ft = P(x + tl * 8, 72 + tl * 3); S.add(capF(s, ft, 2.2, 1.6), MB_TAL, { z: far ? -2 : 4, h: 1.6 }); for (const d of [-0.6, 0, 0.6]) S.add(capF(ft, pol(ft, 1.2 + d - tl * 0.8, 4.6), 1.1, 0.4), MB_TAL, { z: far ? -2 : 5, h: 1 }); }
  // 머리 + 금빛 볏 + 부리
  const hc = P(76, 30);
  S.add(capF(P(66, 40), hc, 9, 8), MB_BACK, { blend: 3, h: 6 });
  S.add(ellR(hc[0], hc[1], 10, 9), MB_BACK, { h: 9 });
  S.add(ellR(hc[0] + 3, hc[1] + 5, 6, 4.5), MB_CH, { blend: 2, h: 2 });
  for (let k = 0; k < 4; k++) S.add(capF(P(72 - k * 3, 22 - k * 0.5), P(66 - k * 4, 10 + k * 1.5), 2.2, 0.7), MB_CR, { h: 2, lift: 3 });
  const bk = p.beak ?? 0;
  S.add(polyF([P(84, 27), P(97, 31), P(85, 34)]), MB_BEAK, { h: 3, lift: 3 });
  bk > 0.2 && S.add(polyF([P(84, 34), P(95, 34 + bk * 4), P(85, 37 + bk)]), MB_BEAK, { h: 2, lift: 3 });
  if (!p.block && !p.hurt) { const e0 = P(81, 27); S.decal(e0[0], e0[1], 0x1a0c08).decal(e0[0] + 1, e0[1], 0x1a0c08).decal(e0[0], e0[1] - 1, 0xffe880).decal(e0[0] + 1, e0[1] - 1, 0xffffff); }
  wing(!1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMother = {
  fw: Math.round(112 * MBK), fh: Math.round(92 * MBK), w: 38, h: 30, flying: !0,
  anims: { idle: [4, 12], move: [4, 14], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], volley: [4, 12, !1], gust: [5, 12, !1], call: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "wind") P = { flap: fl * 0.5, tilt: -0.2 * t, fluff: t, beak: t * 0.5 };
    if (nm === "atk") P = { flap: -1, tilt: 0.45, talon: 1, beak: 1 };
    if (nm === "volley") P = { flap: [1, 1, -1, -1][f], fluff: 1, tilt: -0.1, beak: 0.6 };
    if (nm === "gust") P = { flap: [1, 1, -1, -1, 0][f], tilt: -0.2 };
    if (nm === "call") P = { flap: fl, beak: f % 2 ? 1.2 : 0.4, fluff: 0.6, tilt: -0.15 };
    if (nm === "rec") P = { flap: fl, tilt: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.3, beak: 1 };
    return motherFrame(P);
  },
};

// ════ [정예] 고목 수호 정령 ════ 오래된 나무에 깃든 정령. 갈라진 나무껍질 몸통 · 옹이 구멍에서 빛나는 눈 · 이끼 수염 ·
//   가지 팔 · 뿌리 다리 · 머리에 잎 왕관. 가지 채찍 · 땅에서 뿌리 솟구치기 · 잎 폭풍
//   p: bob · step · arm 가지 팔(0 내림 ~ 1 휘두르기 위 ~ 2 내려침) · glow 눈 빛 · storm 잎 · hurt
const GK = 0.72;
const GBARK = mat(ramp(0x6a4a30), { tex: "wood", amp: 1.1, dir: 1.5 }), GBARKF = mat(rampF(0x6a4a30), { tex: "wood", amp: 0.9, dir: 1.5 });
const GLEAF = mat(ramp(0x4a9a34), { tex: "fur", amp: 0.9, dir: 0.8 }), GLEAFL = mat(ramp(0x8ad050), { tex: "fur", amp: 0.6, dir: 0.8 });
const GMOSS = mat(ramp(0x5a8a3a), { tex: "fur", amp: 1, dir: 1.55 }), GROOT = mat(ramp(0x5a3e28), { tex: "wood", amp: 1, dir: 1.2 });
function guardianFrame(p = {}) {
  const W = 104, H = 104, G = H - 1, S = sculpt(W, H, { k: p.k ?? GK, ax: 50 }), b = p.bob ?? 0, st = p.step ?? 0, ar = p.arm ?? 0;
  // 먼 가지 팔
  const sF = [36, 44 + b], eF = [26, 60 + b], hF = [22, 74 + b];
  S.add(U(capF(sF, eF, 5, 4), capF(eF, hF, 4, 2.4)), GBARKF, { z: -4, h: 4 });
  S.add(capF(hF, [16, 80 + b], 1.6, 0.6), GBARKF, { z: -4, h: 1.4 });
  // 뿌리 다리 (뒤 → 앞)
  for (const [x, far, s] of [[40, 1, -st], [58, 0, st]]) {
    const top = [x, 70 + b], ft = [x + s, G - 3];
    S.add(capF(top, ft, 8, 6), far ? GBARKF : GBARK, { z: far ? -2 : 4, h: 6 });
    for (const d of [-1, 1]) S.add(capF([ft[0], ft[1]], [ft[0] + d * 10, G], 3, 1.2), GROOT, { z: far ? -2 : 5, h: 2 });
  }
  // 몸통 (굵은 줄기) + 갈라진 껍질 홈 + 이끼
  S.add(polyF([[34, 32 + b], [66, 30 + b], [70, 50 + b], [64, 74 + b], [36, 74 + b], [30, 52 + b]]), GBARK, { z: 0, h: 14, prof: "flat" });
  for (const [x0, y0, x1, y1] of [[40, 36, 38, 70], [48, 34, 47, 72], [56, 33, 58, 70], [63, 40, 61, 66]]) S.carve(capF([x0, y0 + b], [x1, y1 + b], 0.8), 1.6);
  S.add(ellR(50, 62 + b, 6, 4.5), GBARK, { blend: 2, h: 2 }); // 옹이
  S.carve(ellR(50, 62 + b, 2.4, 1.8), 2.5, !1);
  S.add(polyF([[38, 48 + b], [62, 48 + b], [60, 58 + b], [54, 56 + b], [50, 62 + b], [46, 56 + b], [40, 58 + b]]), GMOSS, { on: 1, h: 1.6 }); // 이끼 수염
  // 얼굴: 옹이 구멍 두 눈 + 입 구멍
  if (!p.block) {
    S.carve(ellR(44, 42 + b, 3.2, 2.6), 3, !1).carve(ellR(57, 41 + b, 3.2, 2.6), 3, !1).carve(capF([46, 50 + b], [55, 49.5 + b], 1.2), 2.4, !1);
    const ec = p.hurt ? 0x2a3010 : mixc(0x6a9a30, 0xe8ff90, Math.min(1, p.glow ?? 0.6));
    for (const [x, y] of [[44, 42], [57, 41]]) S.decal(x, y + b, ec).decal(x + 1, y + b, ec).decal(x, y - 1 + b, 0xffffff);
  }
  // 잎 왕관 (머리 위 덩이들)
  for (const [x, y, rx, ry, m] of [[38, 26, 12, 8, GLEAF], [62, 24, 13, 9, GLEAF], [50, 18, 14, 10, GLEAFL], [30, 32, 8, 6, GLEAF], [70, 32, 8, 6, GLEAF]]) S.add(ellR(x, y + b, rx, ry), m, { z: 6, h: 7 });
  for (let k = 0; k < 6; k++) S.add(ellR(36 + k * 5.6, 16 + b + (k % 2) * 4, 2.4, 1.8), GLEAFL, { blend: 1.5, h: 1.4 });
  // 가까운 가지 팔 (휘두르기)
  const sN = [64, 44 + b], a = ar > 1 ? 0.6 + (ar - 1) * 0.8 : 1.3 - ar * 2.9, eN = pol(sN, a, 16), hN = pol(eN, a + (ar > 0.5 && ar <= 1 ? -0.5 : 0.4), 14);
  S.add(U(capF(sN, eN, 5.6, 4.4), capF(eN, hN, 4.4, 2.6)), GBARK, { z: 8, h: 4.5 });
  for (const d of [-0.7, 0, 0.7]) S.add(capF(hN, pol(hN, a + d, 7), 1.6, 0.5), GBARK, { z: 9, h: 1.4 }); // 가지 손가락
  S.add(ellR(...lerp(sN, eN, 0.6), 4, 2.6), GLEAF, { z: 10, h: 2 }); // 팔에 돋은 잎
  // 잎 폭풍 (흩날리는 잎)
  if ((p.storm ?? 0) > 0) for (let k = 0; k < 10; k++) { const ang = k * 0.63 + (p.storm * 3), r = 30 + (k % 3) * 8; S.add(ellR(50 + Math.cos(ang) * r, 50 + b + Math.sin(ang) * r * 0.6, 2.4, 1.4, ang), GLEAFL, { z: 14, h: 1 }); }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxGuardian = {
  fw: Math.round(104 * GK), fh: Math.round(104 * GK), w: 30, h: 52,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], roots: [4, 8, !1], storm: [6, 12] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6, glow: 0.6 + 0.2 * Math.sin(ph) };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.4 };
    if (nm === "wind") P = { arm: t, glow: 0.8, bob: -t };
    if (nm === "atk") P = { arm: [1.4, 2, 2][f], bob: 1.5, glow: 1 };
    if (nm === "rec") P = { arm: 2 - 2 * t, bob: 1.5 * (1 - t) };
    if (nm === "roots") P = { arm: 0.4, bob: [0, 2, 2, 1][f], glow: 1.2 };
    if (nm === "storm") P = { storm: f / n, arm: 0.6, glow: 1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return guardianFrame(P);
  },
};
