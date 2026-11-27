// 아이언베인 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 거점 아래 지하 입문, 옛 갱도와 철 광맥
//   윗층(옛 갱도): 광석 쥐 떼 · 곡괭이 코볼트 · 램프 나방 · [정예] 코볼트 십장
//   가운데(광맥 굴): 쇠껍질 공벌레 · 녹 먹는 벌레 · 꼬마 광석 골렘 · [정예] 증기 굴착 기계
//   아랫층(깊은 광맥): 폭발 가스 버섯 · 유령 광부 · 수정 전갈 · [정예] 광산 웜
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const IRON = ramp(0x7a8088), IRONF = rampF(0x6a7078), RUST = ramp(0xb8642e), BRASS = ramp(0xc89a40), BRASSF = rampF(0xb08834);
const ORE = ramp(0x6a6460), LAMP = rampGlow(0xffc850), CRYS = rampGlow(0xb07aff), CRYC = rampGlow(0x6ae0f0);
const fade = (C, y0, y1) => { for (let y = 0; y < C.H; y++) { const t = (y - y0) / Math.max(1, y1 - y0); if (t <= 0) continue; for (let x = 0; x < C.W; x++) { const i = y * C.W + x; if (C.d[i] < 0) continue; if (((x * 7 + y * 13) % 8) / 8 < t) C.d[i] = -1; } } };

// ════ 광석 쥐 떼 ════ 등에 광석 부스러기가 박힌 쥐 셋. 떼로 몰려와 갉는다
//   p: run 위상 · spread · bite · hurt
const RAT = ramp(0x6a5a5a), RATF = rampF(0x5a4c4c), RATP = ramp(0xd88a8a);
const done3 = (C, p) => (p.hurt ? flash(C) : C);
function glint3(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
const I_IRON = mat(ramp(0x7a8088), { tex: "metal", amp: 1, spec: 0.6 }), I_IRONF = mat(rampF(0x6a7078), { tex: "metal", amp: 0.9 }), I_RUST = mat(ramp(0xb8642e), { tex: "metal", amp: 1.3 });
const I_BRASS = mat(ramp(0xc89a40), { tex: "metal", amp: 0.8, spec: 0.8 }), I_ORE = mat(ramp(0x6a6460), { tex: "stone", amp: 1.3 }), I_LAMP = mat(rampGlow(0xffc850)), I_CRYS = mat(rampGlow(0xb07aff), { tex: "crystal" }), I_CRYC = mat(rampGlow(0x6ae0f0));
const I_CU = mat(ramp(0xc87a40), { tex: "metal", spec: 0.7 }), I_VD = mat(ramp(0x100c0c));
const I_toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
function ratsFrame(p = {}) {
  const W = 70, H = 32, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 35 });
  const rn = p.run ?? 0, sp = p.spread ?? 0.5, bt = p.bite ?? 0;
  const RT = mat(ramp(0x6a5a5a), { tex: "fur", amp: 1.2, dir: 0.2 }), RTF = mat(rampF(0x5a4c4c), { tex: "fur", amp: 1.1, dir: 0.2 }), PNK = mat(ramp(0xd88a8a), { tex: "skin", amp: 0.6 });
  [[-16, 1, 1], [14, 0, 1], [-1, 0, 0]].forEach(([dx, far, k], i) => {
    const x = 35 + dx * (0.7 + sp * 0.6), y = G - 6 - far * 4 - (i === 1 ? 1 : 0), M = far ? RTF : RT, z = far ? -2 : 2 + i, s = Math.sin(rn + i * 2);
    S.add(capF([x - 8, y], [x - 18, y + 2 - s], 0.9, 0.4), PNK, { z: z - 0.2, h: 0.4 });
    for (const [lx, ph2] of [[-5, 0], [4, Math.PI]]) S.add(capF([x + lx, y + 2], [x + lx + Math.sin(rn + ph2 + i) * 2.4, G - far * 3], 1, 0.7), PNK, { z: z - 0.1, h: 0.4 });
    S.add(U(ellR(x, y, 9, 5.4), ellR(x + 8, y - 0.6, 5, 4)), M, { z, h: 4 });
    for (let k2 = 0; k2 < 3; k2++) S.add(polyF([[x - 5 + k2 * 4, y - 4], [x - 4 + k2 * 4, y - 7 - (k2 % 2)], [x - 2.4 + k2 * 4, y - 4]]), k2 === 1 ? I_CU : I_ORE, { z: z + 0.1, lift: 0.4, h: 1, prof: "sharp" });
    S.add(capF([x + 11, y + 0.4], [x + 15 + bt * 1.6, y + 1 + bt], 1.6, 0.8), M, { z: z + 0.1, h: 1 });
    S.add(ellR(x + 6, y - 4.4, 1.6, 2), PNK, { z: z + 0.2, h: 0.8 });
    S.add(ellR(x + 15.4 + bt * 1.6, y + 1 + bt, 0.8, 0.7), mat(ramp(0x3a2020)), { z: z + 0.3, h: 0.3 });
    !p.hurt && S.decal(x + 10, y - 1.4, 0xff3030);
  });
  return done3(S.render({ rim: !0 }), p);
}
export const pxRats = spec(50, 23, 26, 10,
  { idle: [4, 8], move: [6, 18], wind: [3, 12, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { run: ph * 2, spread: 0.5 };
    if (nm === "wind") return { spread: 0.5 - t * 0.5, run: t };
    if (nm === "atk") return { bite: 1, run: ph * 3, spread: 0 };
    if (nm === "rec") return { spread: t, bite: 0 };
    if (nm === "hurt") return { hurt: f === 0, spread: 1.4 };
    return { run: Math.sin(ph) * 0.3, spread: 0.5 };
  }, ratsFrame);

// ════ 곡괭이 코볼트 ════ 개 얼굴 비늘 코볼트. 광부 헬멧 등불 · 곡괭이. 휘두르고, 멀면 광석 덩이를 던진다
//   p: bob · legs · pick 곡괭이(0 메기 ~ 1 위 ~ 2 내려침) · ore 손에 광석 · hurt
const KOB = ramp(0xa85a3a), KOBF = rampF(0x904c30), HELM = ramp(0xc8a040);
function koboldFrame(p = {}) {
  const W = 66, H = 58, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 28 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pk = p.pick ?? 0, cx = 26;
  const KB = mat(ramp(0xa85a3a), { tex: "scale", amp: 1, spec: 0.3 }), KBF = mat(rampF(0x904c30), { tex: "scale", amp: 0.9 }), LTH = mat(ramp(0x6a4a30), { tex: "leather", amp: 1 }), HELM = mat(ramp(0xc8a040), { tex: "metal", spec: 0.7 });
  // 꼬리
  S.add(U(capF([cx - 6, 40 + b], [cx - 16, 46 + b], 3, 1.6), capF([cx - 16, 46 + b], [cx - 20, 52], 1.6, 0.6)), KB, { z: -1, h: 1.6 });
  // 다리 (짐승 다리)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) { const hp = [cx + d, 40 + b], kn = [cx + d + 3, 47 + b], ft = [cx + d + o[0], G - 1 - o[1]]; S.add(U(capF(hp, kn, 3.4, 2.6), capF(kn, ft, 2.4, 1.8)), far ? KBF : KB, { z: far ? -2 : 3, h: 2 }); S.add(ellR(ft[0] + 2, ft[1] - 0.6, 3.4, 1.4), far ? KBF : KB, { z: far ? -1.9 : 3.1, h: 1 }); }
  // 몸 (가죽 조끼)
  S.add(U(ellR(cx, 34 + b, 8.4, 9.4)), KB, { z: 1, h: 7 });
  S.add(polyF([[cx - 7, 28 + b], [cx + 7, 28 + b], [cx + 8, 42 + b], [cx - 8, 42 + b]]), LTH, { z: 1.6, h: 3, prof: "flat" });
  S.add(capF([cx - 8, 40 + b], [cx + 8, 40 + b], 1.2), mat(ramp(0x3a2a1e), { tex: "leather" }), { z: 1.8, h: 0.8 });
  S.add(ellR(cx + 5, 40 + b, 1.4, 1.4), I_BRASS, { z: 2, h: 0.6 });
  // 머리 (개 주둥이 · 귀 지느러미 · 광부 헬멧 등불)
  const hx = cx + 4, hy = 20 + b;
  S.add(U(ellR(hx, hy, 6.4, 6), capF([hx + 2, hy + 1.6], [hx + 10, hy + 3], 3.6, 2.4)), KB, { z: 3, h: 5 });
  S.add(capF([hx + 4, hy + 4.6], [hx + 10, hy + 5], 1, 0.8), KBF, { z: 2.8, h: 0.6 });
  for (const x of [hx + 6, hx + 8]) S.add(polyF([[x - 0.6, hy + 4], [x, hy + 5.6], [x + 0.6, hy + 4]]), mat(ramp(0xe8e0d0)), { z: 3.4, h: 0.3, prof: "sharp" });
  S.add(polyF([[hx - 5, hy - 1], [hx - 12, hy - 5], [hx - 6, hy + 3]]), KBF, { z: 2.6, h: 1 });
  S.add(minus(ellR(hx, hy - 3, 7, 5.4), (x, y) => y > hy - 2), HELM, { z: 3.6, h: 4 });
  S.add(capF([hx - 7, hy - 2.4], [hx + 8, hy - 2.4], 1), HELM, { z: 3.8, h: 0.8 });
  S.add(ellR(hx + 5, hy - 5, 2.2, 2.2), I_LAMP, { z: 4, h: 1.4 });
  S.add(ellR(hx + 10, hy + 2, 1, 0.8), mat(ramp(0x2a1a14)), { z: 3.4, h: 0.3 });
  !p.hurt && S.decal(hx + 3, hy - 0.6, 0xffd050);
  // 곡괭이 / 광석
  const sh = [cx + 5, 30 + b], a = -2.2 + pk * 1.6, hand = pol(sh, a + 0.7, 9), tip = pol(hand, a, 17), ha = a + Math.PI / 2;
  S.add(U(capF(sh, hand, 2.2, 1.8)), KB, { z: 6, h: 1.6 });
  if (p.ore) S.add(ellR(cx + 10, 22 + b, 4.4, 4), I_ORE, { z: 6.6, h: 3 }).add(ellR(cx + 11, 21 + b, 1.6, 1.4), I_CU, { z: 6.8, h: 0.8 });
  else { S.add(capF(pol(hand, a, -4), tip, 1.1), mat(ramp(0x7a5a3a), { tex: "wood" }), { z: 6.4, h: 0.8 }); S.add(U(capF(tip, pol(pol(tip, ha, 9), a, -3), 1.8, 0.4), capF(tip, pol(pol(tip, ha, -7), a, -3), 1.6, 0.4)), I_IRON, { z: 6.6, h: 1.2 }); }
  S.add(ellR(hand[0], hand[1], 2.2, 2), KB, { z: 6.8, h: 1.4 });
  const C = S.render({ rim: !0 });
  const Q = I_toPx(W, H, 0.72, 28);
  for (let k = 0; k < 3; k++) { const q = Q(hx + 8 + k * 3, hy - 6 + k * 0.4); C.px(q[0], q[1], k ? 0xffe8a0 : 0xffc850); }
  return done3(C, p);
}
export const pxKobold = spec(48, 42, 14, 22,
  { idle: [4, 6], move: [8, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], throw: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, pick: 0.1 };
    if (nm === "move") { const g = gait2(f, n, 3.5, 2); return { legs: g, bob: g.bob, pick: 0.2 }; }
    if (nm === "wind") return { pick: 0.2 + 0.8 * t };
    if (nm === "atk") return { pick: [1.6, 2, 2.1][f], bob: 1 };
    if (nm === "rec") return { pick: 2 - 1.8 * t };
    if (nm === "throw") return { ore: f < 2 ? 1 : 0, pick: 0.1, bob: f === 2 ? 1 : 0 };
    return { hurt: f === 0, pick: 0.4 };
  }, koboldFrame);

// ════ 램프 나방 ════ 등불 빛에 몰려드는 나방. 날개 무늬가 불꽃 같고, 몸으로 부딪치면 불이 붙는다
//   p: flap · glow 몸에 붙은 불씨 · hurt
const LMOTH = ramp(0x8a6a4a), FLAMEW = ramp(0xe88a3a);
function lampMothFrame(p = {}) {
  const W = 58, H = 50, S = sculpt(W, H, { k: 0.72, ax: 29 });
  const fl = p.flap ?? 0, gl = p.glow ?? 0, cx = 29, cy = 25, sq = 0.55 + (fl + 1) * 0.25;
  const MB = mat(ramp(0x8a6a4a), { tex: "fur", amp: 1.3, dir: 1.57 }), WG = mat(ramp(0xb08050), { tex: "feather", amp: 0.7, dir: 0 }), WGF = mat(rampF(0x9a7044), { tex: "feather", dir: 0 }), FLM = mat(ramp(0xe88a3a), { spec: 0.4 });
  // 날개 넷 (등에서 본 모습 · 날갯짓 = 세로로 접힘)
  for (const d of [-1, 1]) {
    const M = d < 0 ? WGF : WG, Y = (y) => cy + (y - cy) * sq;
    S.add(polyF([[cx + d * 2, Y(cy - 3)], [cx + d * 20, Y(cy - 16)], [cx + d * 25, Y(cy - 8)], [cx + d * 18, Y(cy + 2)], [cx + d * 2, Y(cy + 2)]]), M, { z: 1, h: 1.4 });
    S.add(polyF([[cx + d * 2, Y(cy + 2)], [cx + d * 16, Y(cy + 4)], [cx + d * 15, Y(cy + 14)], [cx + d * 6, Y(cy + 15)], [cx + d * 2, Y(cy + 8)]]), M, { z: 0.8, h: 1.2 });
    S.add(ellR(cx + d * 14, Y(cy - 7), 3.6, 2.8 * sq), FLM, { on: 1, lift: 0.3, h: 0.4 });
    S.add(ellR(cx + d * 14, Y(cy - 7), 1.6, 1.2 * sq), mat(ramp(0x3a2418)), { on: 1, lift: 0.4, h: 0.2 });
    S.add(capF([cx + d * 4, Y(cy - 3)], [cx + d * 23, Y(cy - 9)], 0.4), mat(ramp(0xf0d8a0)), { on: 1, lift: 0.3, h: 0.2 });
    for (let k = 0; k < 3; k++) S.carve(capF([cx + d * 3, Y(cy + 3)], [cx + d * (8 + k * 3), Y(cy + 13)], 0.3), 0.5);
  }
  // 몸 (털 많은 가슴 · 마디 배) + 머리 + 깃털 더듬이
  S.add(U(ellR(cx, cy - 2, 3.6, 4.4), ellR(cx, cy + 7, 2.8, 6)), MB, { z: 2, h: 3 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 2.6, cy + 4 + k * 2.4], [cx + 2.6, cy + 4 + k * 2.4], 0.3), 0.5);
  S.add(ellR(cx, cy - 8, 3, 2.6), MB, { z: 2.4, h: 2 });
  for (const d of [-1, 1]) { const r0 = [cx + d, cy - 10], e = [cx + d * 7, cy - 19]; S.add(U(capF(r0, e, 0.6, 0.3), ...[0.3, 0.5, 0.7, 0.9].map((t) => capF(lerp(r0, e, t), [lerp(r0, e, t)[0] + d * 1.8, lerp(r0, e, t)[1] + 1.2], 0.3))), MB, { z: 2.6, h: 0.3 }); }
  !p.hurt && S.decal(cx - 1.6, cy - 8.6, 0x1a1010).decal(cx + 1.6, cy - 8.6, 0x1a1010);
  gl > 0 && S.add(ellR(cx, cy + 12, 2.4 + gl * 2, 2.4 + gl * 2), I_LAMP, { z: 3, h: 1 });
  const C = S.render({ rim: !0 });
  if (gl > 0.3) { const Q = I_toPx(W, H, 0.72, 29); for (let k = 0; k < 5; k++) { const q = Q(cx + Math.sin(k * 2) * 4, cy + 16 + k * 2); C.px(q[0], q[1], k % 2 ? 0xffc850 : 0xfff0c0); } }
  return done3(C, p);
}
export const pxLampMoth = spec(42, 36, 16, 14,
  { idle: [4, 16], move: [4, 18], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, glow: t };
    if (nm === "atk") return { flap: -1, glow: 1 };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6 };
    return { flap: fl };
  }, lampMothFrame, { flying: !0 });

// ════ [정예] 코볼트 십장 ════ (큰 몬스터 조각 도구) 덩치 큰 코볼트 감독. 비늘 개 얼굴과 목 지느러미 · 등불 달린 광부 헬멧 · 가죽 앞치마와 멜빵 · 굵은 가죽 채찍 · 놋쇠 호루라기 · 등에 다이너마이트 꾸러미
//   p: bob · legs · whip 채찍(-1 뒤로 ~ 1 앞으로) · whistle · dyn 다이너마이트 들기 · hurt
const FMK = 0.7;
const FM_SC = mat(ramp(0x9a5234), { tex: "skin", amp: 0.6 }), FM_SCF = mat(ramp(0x7c422c, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.5 }), FM_BEL = mat(ramp(0xd0a878), { tex: "skin", amp: 0.3 });
const FM_LTH = mat(ramp(0x8a6038), { tex: "leather", amp: 0.6 }), FM_STRAP = mat(ramp(0x4a3424), { tex: "leather", amp: 0.4 }), FM_HELM = mat(ramp(0xd0a440), { spec: 0.6 }), FM_LAMP = mat(rampGlow(0xffd060));
const FM_DYN = mat(ramp(0xc8402a), { tex: "cloth", amp: 0.3 }), FM_ROPE = mat(ramp(0xc8b080), { tex: "fur", amp: 0.5 }), FM_BRASS = mat(ramp(0xd8aa48), { spec: 0.8 }), FM_WHIP = ramp(0x5a3a24);
const FM_BOOT = mat(ramp(0x4a3a30), { tex: "leather", amp: 0.4 }), FM_HORN = mat(ramp(0xe0d0b0), { spec: 0.3 }), FM_FUSE = mat(ramp(0x2a2420));
function foremanFrame(p = {}) {
  const W = 112, H = 84, G = H - 1, S = sculpt(W, H, { k: p.k ?? FMK, ax: 48 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, wp = p.whip ?? 0, dy = p.dyn ?? 0;
  // 다리: 짐승 다리(무릎 앞 · 발목 뒤) + 가죽 장화
  const leg = (o, far) => {
    const hip = [far ? 42 : 46, 62 + b], ft = [hip[0] + 2 + o[0], G - 3 - o[1]], kn = ik(hip, ft, 11, 12, -1), M0 = far ? FM_SCF : FM_SC;
    S.add(U(capF(hip, kn, far ? 5.6 : 6.4, 4.6), capF(kn, ft, 4.6, 4)), M0, { z: far ? -3 : 5, h: 5 });
    S.add(U(ellR(ft[0] + 2, ft[1] + 0.4, 6.6, 3), capF([ft[0] - 1, ft[1] - 6], [ft[0], ft[1]], 4.4)), FM_BOOT, { z: far ? -2.6 : 5.4, h: 3.4 });
    S.add(capF([ft[0] - 4, ft[1] - 5.5], [ft[0] + 4, ft[1] - 5.5], 1), FM_STRAP, { z: far ? -2.5 : 5.6, h: 1.2 });
  };
  leg(g.f, 1);
  // 꼬리 (비늘 · 끝으로 가늘게)
  S.add(U(capF([34, 62 + b], [16, 70 + b], 6.4, 3.8), capF([16, 70 + b], [4, 77 + b], 3.8, 1.2)), FM_SC, { z: -2, h: 4 });
  for (const x of [28, 22, 15]) S.carve(capF([x, 63 + b + (34 - x) * 0.4], [x - 1, 70 + b + (34 - x) * 0.4], 0.45), 0.5);
  // 등 다이너마이트 꾸러미 (빨간 막대 넷 · 밧줄 두 줄 · 심지)
  for (let k = 0; k < 4; k++) S.add(capF([21 + k * 3.4, 30 + b], [22 + k * 3.4, 50 + b], 1.9), FM_DYN, { z: -1.5, h: 2 });
  for (const y of [35, 45]) S.add(capF([19, y + b], [34, y + b], 1.1), FM_ROPE, { z: -1, h: 2.6 });
  S.add(U(capF([27, 30 + b], [25, 24 + b], 0.6), capF([25, 24 + b], [27, 20 + b], 0.6)), FM_FUSE, { z: -1, h: 0.6 });
  // 먼 팔: 허리에 손 / 다이너마이트 치켜들기 (불붙은 심지)
  const sF = [50, 32 + b], hF = dy ? [44, 8 + b] : [40, 48 + b], eF = ik(sF, hF, 10, 11, dy ? 1 : -1);
  S.add(U(capF(sF, eF, 4.2, 3.6), capF(eF, hF, 3.6, 3.2)), FM_SCF, { z: -2, h: 4 });
  if (dy) {
    S.add(capF([hF[0] - 1, hF[1] - 6], [hF[0] + 1, hF[1] + 5], 2.2), FM_DYN, { z: -1.4, h: 2.4 });
    S.add(capF([hF[0] - 1, hF[1] - 6], [hF[0] + 1, hF[1] - 10], 0.6), FM_FUSE, { z: -1.2, h: 0.6 });
    p.block || [[0, 0, 0xfff4a0], [1, -1, 0xffa030], [-1, -1, 0xffd060], [0, -2, 0xffffff]].forEach(([dx, dd, c]) => S.decal(hF[0] + 1 + dx, hF[1] - 11 + dd, c));
  }
  S.add(ellR(hF[0], hF[1], 3.6, 3.4), FM_SCF, { z: -1, h: 3 });
  // 몸 (불룩한 배) + 배 비늘 + 가죽 앞치마(주머니) + 멜빵
  S.add(U(ellR(46, 52 + b, 16, 14), ellR(50, 38 + b, 13, 10)), FM_SC, { z: 0, h: 14 });
  S.add(ellR(53, 50 + b, 9, 11), FM_BEL, { on: 1, h: 0.8 });
  for (const y of [42, 47, 52, 57]) S.carve(capF([47, y + b], [59, y + b], 0.4), 0.4);
  S.add(polyF([[40, 46 + b], [60, 45 + b], [63, 65 + b], [40, 66 + b]]), FM_LTH, { lift: 1, h: 1.6 });
  S.carve(U(capF([49, 53 + b], [57, 53 + b], 0.4), capF([49, 53 + b], [49, 59 + b], 0.4), capF([57, 53 + b], [57, 59 + b], 0.4)), 0.6);
  S.add(capF([52, 52 + b], [52, 47 + b], 0.9), FM_BRASS, { lift: 1.6, h: 1 });
  for (const x of [45, 57]) S.add(capF([x - 1, 29 + b], [x, 47 + b], 1.4), FM_STRAP, { lift: 0.8, h: 1.2 });
  for (const x of [45, 57]) S.add(ellR(x, 46.5 + b, 1.4, 1.2), FM_BRASS, { lift: 1.8, h: 1 });
  // 머리: 목 지느러미 · 작은 뿔 · 비늘 주둥이 · 송곳니 · 노란 눈(세로 동공) · 광부 헬멧과 등불
  const hx = 64, hy = 22 + b;
  S.add(polyF([[hx - 6, hy - 2], [hx - 16, hy - 7], [hx - 12, hy], [hx - 15, hy + 5], [hx - 6, hy + 5]]), FM_SC, { z: 3, h: 2.4 });
  S.add(capF([hx - 5, hy - 6], [hx - 13, hy - 11], 1.7, 0.6), FM_HORN, { z: 3.4, h: 1.6 });
  S.add(ellR(hx, hy, 9.4, 8.6), FM_SC, { z: 4, h: 8 });
  S.add(polyF([[hx + 3, hy - 2.6], [hx + 18, hy + 0.8], [hx + 18, hy + 4.6], [hx + 4, hy + 4.8]]), FM_SC, { z: 5, h: 6 });
  S.add(polyF([[hx + 2, hy + 4.4], [hx + 16, hy + 4.4], [hx + 14, hy + 8], [hx + 4, hy + 9.4]]), FM_BEL, { z: 5.4, h: 4 });
  S.add(capF([hx + 1, hy - 4.6], [hx + 9, hy - 3.6], 1.4, 1), FM_SC, { blend: 1, h: 1.3 });
  S.carve(ellR(hx + 17, hy + 1.6, 0.8, 0.6), 0.9, !1).carve(capF([hx + 4, hy + 4.6], [hx + 17.4, hy + 4.4], 0.5), 1, !1);
  S.add(polyF([[hx + 12, hy + 4.6], [hx + 14, hy + 4.6], [hx + 13, hy + 7.2]]), FM_HORN, { z: 6, h: 0.8 });
  if (!p.block && !p.hurt) { for (const [x, y] of [[5, -2], [6, -2], [5, -1], [6, -1]]) S.decal(hx + x, hy + y, 0xffe060); S.decal(hx + 5.6, hy - 2, 0x1a1008).decal(hx + 5.6, hy - 1, 0x1a1008); }
  S.add(polyF([[hx - 9, hy - 6], [hx - 8, hy - 13], [hx - 2, hy - 16.5], [hx + 6, hy - 15.5], [hx + 9.5, hy - 10], [hx + 10, hy - 6]]), FM_HELM, { lift: 3, h: 4 });
  S.add(capF([hx - 11, hy - 6], [hx + 12, hy - 5.6], 1.3), FM_HELM, { lift: 3.4, h: 1.4 });
  S.add(ellR(hx + 9, hy - 12, 3.4, 3.4), FM_BRASS, { lift: 4, h: 2.6 });
  S.add(ellR(hx + 9.6, hy - 12, 2.2, 2.2), FM_LAMP, { lift: 5, h: 1.6 });
  // 호루라기: 불 때는 입에, 아니면 가슴에 끈으로
  if ((p.whistle ?? 0) > 0) S.add(capF([hx + 15, hy + 4], [hx + 21, hy + 2.6], 1.4, 1.8), FM_BRASS, { z: 9, h: 1.8 });
  else (S.add(capF([hx - 3, hy + 6], [hx - 1, hy + 14], 0.4), FM_STRAP, { lift: 1, h: 0.4 }), S.add(capF([hx - 1.6, hy + 14.6], [hx + 1.6, hy + 14], 1.2, 1.4), FM_BRASS, { lift: 1.4, h: 1.2 }));
  leg(g.n, 0);
  // 가까운 팔 + 채찍 (손잡이 · 놋쇠 꼭지 · 마디 채찍끈)
  const s0 = [56, 34 + b], hd = pol(s0, 0.6 - wp * 0.9, 13), e0 = ik(s0, hd, 7, 7, 1);
  S.add(U(capF(s0, e0, 4.6, 3.8), capF(e0, hd, 3.8, 3.4)), FM_SC, { z: 8, h: 4.4 });
  const ba = wp >= 0 ? L(1.2, -0.4, wp) : L(1.2, -2.5, -wp), hdl = pol(hd, ba, 5);
  S.add(capF(pol(hd, ba + Math.PI, 1.6), hdl, 1.5, 1.3), FM_STRAP, { z: 9, h: 1.4 });
  S.add(ellR(...pol(hd, ba + Math.PI, 2), 1.4, 1.4), FM_BRASS, { z: 9.2, h: 1.4 });
  const pts = [hdl];
  for (let k = 1; k <= 8; k++) {
    const hang = 1.3 + Math.sin(k * 0.9) * 0.4, a = wp >= 0 ? L(hang, -0.25 + k * 0.1, wp) : L(hang, -2.3 - k * 0.14, -wp);
    pts.push(pol(pts[k - 1], a, wp > 0.5 ? 3.6 : 3.3));
  }
  const WM0 = mat(FM_WHIP, { tex: "leather", amp: 0.3 });
  for (let k = 1; k < pts.length; k++) S.add(capF(pts[k - 1], pts[k], 1.2 - k * 0.09, 1.1 - k * 0.09), WM0, { z: 9.4, h: 1 });
  S.add(ellR(hd[0], hd[1], 3.6, 3.4), FM_SC, { z: 9.6, h: 3 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxForeman = {
  fw: Math.round(112 * FMK), fh: Math.round(84 * FMK), w: 22, h: 34,
  anims: { idle: [4, 6], move: [8, 10], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], whistle: [4, 10, !1], dyn: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4, whip: -0.1 };
    if (nm === "move") { const g = gait2(f, n, 4, 2.5); P = { legs: g, bob: g.bob, whip: -0.2 }; }
    if (nm === "wind") P = { whip: -t };
    if (nm === "atk") P = { whip: [0.4, 1, 1][f], bob: 1 };
    if (nm === "rec") P = { whip: 1 - t * 1.1 };
    if (nm === "whistle") P = { whistle: 1, bob: f % 2 ? 1 : 0 };
    if (nm === "dyn") P = { dyn: f < 3 ? 1 : 0, whip: -0.2 };
    if (nm === "hurt") P = { hurt: f === 0, whip: -0.4 };
    return foremanFrame(P);
  },
};

// ════ 쇠껍질 공벌레 ════ 쇠판 마디를 두른 커다란 공벌레. 몸을 말아 쇠공처럼 굴러 돌진 (말린 동안 단단함)
//   p: curl 말기(0~1) · roll 굴림 각 · legs · hurt
const PILL = ramp(0x6a7480), PILLF = rampF(0x5a6470);
function pillbugFrame(p = {}) {
  const W = 62, H = 42, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 31 });
  const cu = p.curl ?? 0, rl = p.roll ?? 0, lp = p.legs ?? 0, cx = 30;
  const PL = mat(ramp(0x6a7480), { tex: "metal", amp: 0.9, spec: 0.7 }), PLF = mat(rampF(0x5a6470), { tex: "metal" });
  if (cu > 0.6) {
    const c = [cx, G - 15], r = 15;
    S.add(ellR(c[0], c[1], r, r), PL, { z: 1, h: 12 });
    for (let k = 0; k < 7; k++) { const a = rl + k * 0.9; S.carve(capF(pol(c, a, 3), pol(c, a, r), 0.6), 1, !1); }
    for (let k = 0; k < 7; k++) { const a = rl + k * 0.9 + 0.45; S.add(ellR(...pol(c, a, r - 2), 1, 1), I_RUST, { on: 1, lift: 0.3, h: 0.3 }); }
    S.add(ellR(c[0] - 4, c[1] - 6, 4, 2.4), mat(ramp(0xd8e0e8), { spec: 1 }), { on: 1, lift: 0.4, h: 0.3 });
  } else {
    for (let k = 0; k < 7; k++) for (const far of [1, 0]) { const x = cx - 12 + k * 4, s = Math.sin(lp + k * 1.1 + far * 3); S.add(capF([x, G - 6], [x + s * 2 + 1, G - 0.6], 0.8, 0.5), far ? PLF : PL, { z: far ? -1 : 0.5, h: 0.4 }); }
    const segs = 7;
    for (let k = 0; k < segs; k++) { const t = k / (segs - 1), x = cx - 16 + k * 5.4, h2 = 10 + Math.sin(t * Math.PI) * 4 - cu * 4; S.add(minus(ellR(x, G - 5, 4, h2), (X, Y) => Y > G - 4), k % 2 ? PL : PLF, { z: 1 + k * 0.08, h: 6 }); S.add(capF([x - 3.4, G - 5 - h2 + 2], [x - 3, G - 5], 0.4), I_RUST, { on: 1, lift: 0.3, h: 0.2 }); }
    S.add(ellR(cx + 20, G - 6, 4.4, 4.4), PLF, { z: 2, h: 3 });
    for (const d of [-1, 1]) S.add(capF([cx + 23, G - 8], [cx + 29, G - 12 + d * 3], 0.6, 0.3), PLF, { z: 2.1, h: 0.3 });
    !p.hurt && S.decal(cx + 22, G - 7, 0xd8e8f0);
  }
  return done3(S.render({ rim: !0 }), p);
}
export const pxPillbug = spec(45, 30, 24, 16,
  { idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [6, 24], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2 };
    if (nm === "wind") return { curl: t };
    if (nm === "atk") return { curl: 1, roll: ph };
    if (nm === "rec") return { curl: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, curl: 0.3 };
    return { legs: Math.sin(ph) * 0.3 };
  }, pillbugFrame);

// ════ 녹 먹는 벌레 ════ 녹빛 껍질의 납작한 벌레. 더듬이를 흔들며 달라붙어 갑옷을 갉는다 (방어가 잠깐 깎임)
//   p: legs · ant 더듬이 · bite · hurt
function rustbugFrame(p = {}) {
  const W = 52, H = 30, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const lp = p.legs ?? 0, an = p.ant ?? 0, bt = p.bite ?? 0, cx = 24;
  const RB = mat(ramp(0xb8642e), { tex: "metal", amp: 1.4, spec: 0.5 }), RBF = mat(rampF(0x8a4a22), { tex: "metal", amp: 1.2 });
  for (let k = 0; k < 3; k++) for (const far of [1, 0]) { const s = [cx - 6 + k * 6, G - 5], a = 1.5 + Math.sin(lp + k * 2 + far * 3) * 0.4 + (k - 1) * 0.3, e = pol(s, a - 0.5, 4), ft = pol(e, a + 0.5, 3.6); S.add(U(capF(s, e, 0.9, 0.7), capF(e, ft, 0.7, 0.4)), far ? RBF : RB, { z: far ? -1.5 : 3, h: 0.5 }); }
  S.add(ellR(cx, G - 7, 14, 5.4), RB, { z: 1, h: 5 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 10 + k * 6, G - 12], [cx - 10 + k * 6, G - 3], 0.4), 0.7);
  for (const [x, y] of [[-6, -9], [2, -10], [7, -8]]) S.add(ellR(cx + x, G + y, 1.8, 1.2), mat(ramp(0xd88a40), { tex: "metal" }), { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(cx + 15, G - 6, 4, 3.4), RBF, { z: 2, h: 2.4 });
  S.add(U(capF([cx + 18, G - 4.6], [cx + 21 + bt * 1.4, G - 3 + bt], 0.8, 0.3), capF([cx + 18, G - 5.6], [cx + 21 + bt * 1.4, G - 7 - bt], 0.8, 0.3)), mat(ramp(0x3a2010), { spec: 0.6 }), { z: 2.4, h: 0.4 });
  for (const d of [-1, 1]) { let q = [cx + 17, G - 8], a = -0.6 + d * 0.3 - an * 0.4; const tl = []; for (let k = 0; k < 4; k++) { const n2 = pol(q, a, 3); tl.push(capF(q, n2, 0.4, 0.3)); q = n2; a += 0.25 * an * d; } S.add(U(...tl), RBF, { z: 2.2 + d * 0.1, h: 0.2 }); }
  !p.hurt && S.decal(cx + 17, G - 7, 0xffd040);
  return done3(S.render({ rim: !0 }), p);
}
export const pxRustbug = spec(37, 22, 18, 8,
  { idle: [4, 8], move: [6, 16], wind: [3, 12, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2, ant: Math.sin(ph * 2) };
    if (nm === "wind") return { ant: t, bite: t * 0.5 };
    if (nm === "atk") return { bite: f % 2, legs: ph };
    if (nm === "rec") return { bite: 0, ant: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, ant: 1 };
    return { ant: Math.sin(ph) };
  }, rustbugFrame);

// ════ 꼬마 광석 골렘 ════ 바위 몸 여기저기 광석(구리·쇠·수정)이 박힌 작은 골렘. 커다란 주먹으로 내려친다
//   p: bob · step · arm 주먹(0 내림 ~ 1 듦 ~ 2 내려침) · hurt
function oreGolemFrame(p = {}) {
  const W = 64, H = 60, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const b = p.bob ?? 0, st = p.step ?? 0, ar = p.arm ?? 0, cx = 28;
  const RK = mat(ramp(0x7a7470), { tex: "stone", amp: 1.3, spec: 0.2 }), RKF = mat(rampF(0x625c58), { tex: "stone", amp: 1.2 });
  for (const [x, far, s] of [[cx - 6, 1, -st], [cx + 6, 0, st]]) S.add(U(ellR(x + s, G - 5, 5.6, 5), ellR(x + s * 0.5, G - 11, 5, 5)), far ? RKF : RK, { z: far ? -2 : 3, h: 4 });
  S.add(U(capF([cx - 12, 26 + b], [cx - 16, 44 + b], 4.6, 4)), RKF, { z: -1, h: 3 });
  S.add(ellR(cx - 16, 46 + b, 5.6, 5), RKF, { z: -0.9, h: 4 });
  S.add(U(ellR(cx, 32 + b, 14, 13), ellR(cx + 2, 20 + b, 10, 7)), RK, { z: 1, h: 11 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 10 + k * 6, 22 + b], [cx - 12 + k * 7, 44 + b], 0.5), 0.9);
  for (const [x, y, M, r] of [[-6, 28, I_CU, 3], [4, 36, I_IRON, 3.4], [7, 24, I_CRYC, 2.4], [-3, 40, I_CRYS, 2]]) S.add(U(polyF([[cx + x - r, y + b + r * 0.4], [cx + x, y + b - r], [cx + x + r, y + b], [cx + x + r * 0.4, y + b + r]])), M, { lift: 0.8, h: r * 0.6, prof: "sharp" });
  const hx = cx + 4, hy = 13 + b;
  S.add(ellR(hx, hy, 6.6, 5.4), RK, { z: 2.4, h: 4 });
  S.carve(capF([hx - 4, hy - 0.6], [hx + 6, hy - 0.6], 0.5), 1, !1);
  for (const x of [hx + 1, hx + 4.4]) { S.add(ellR(x, hy - 0.4, 1, 0.8), I_LAMP, { z: 2.6, h: 0.3 }); }
  const sh = [cx + 10, 25 + b], fist = ar <= 1 ? [sh[0] + 4 - ar * 6, sh[1] + 16 - ar * 30] : [sh[0] + 10, sh[1] + 18];
  S.add(capF(sh, fist, 5, 4.4), RK, { z: 6, h: 4 });
  S.add(ellR(fist[0], fist[1], 7, 6.4), RK, { z: 6.4, h: 5 });
  S.add(polyF([[fist[0] - 2, fist[1] - 4], [fist[0] + 1, fist[1] - 7], [fist[0] + 3, fist[1] - 3]]), I_IRON, { lift: 0.6, h: 1, prof: "sharp" });
  return done3(S.render({ rim: !0 }), p);
}
export const pxOreGolem = spec(46, 43, 20, 26,
  { idle: [4, 5], move: [6, 8], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { step: Math.sin(ph) * 3, bob: -Math.abs(Math.sin(ph)) * 1 };
    if (nm === "wind") return { arm: t, bob: -t };
    if (nm === "atk") return { arm: 2, bob: 1.5 };
    if (nm === "rec") return { arm: 2 - 2 * t };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 0.4 };
  }, oreGolemFrame);

// ════ [정예] 증기 굴착 기계 ════ (큰 몬스터 조각 도구) 버려진 광산의 놋쇠 굴착기. 리벳 박힌 보일러 · 압력계 · 굴뚝 증기 · 붉게 빛나는 둥근 창 · 나선 홈 드릴 · 무한궤도
//   p: spin 드릴 위상 · steam 증기 · lunge 앞으로 · burrow 땅속(0~1) · hurt
const DRK = 0.7;
const DR_BR = mat(ramp(0xc89a40), { spec: 0.75 }), DR_BRD = mat(ramp(0x9a7430), { spec: 0.5 }), DR_IR = mat(ramp(0x8a9098), { spec: 0.7 }), DR_IRD = mat(ramp(0x4a4e56), { spec: 0.4 });
const DR_TR = mat(ramp(0x3a3a40), { tex: "leather", amp: 0.3 }), DR_GL = mat(rampGlow(0xff6a30)), DR_GAUGE = mat(ramp(0xf0ead8)), DR_DIRT = mat(ramp(0x6a5040), { tex: "stone", amp: 0.9 });
const DR_ST = mat(ramp(0xf0f0f0, { cool: 0x8a9ab8 }), { tex: "fur", amp: 0.3 }), DR_RUST = mat(ramp(0xa85a2e), { tex: "stone", amp: 0.6 });
function drillFrame(p = {}) {
  const W = 124, H = 80, G = H - 1, S = sculpt(W, H, { k: p.k ?? DRK, ax: 56 });
  const sp = p.spin ?? 0, ln = (p.lunge ?? 0) * 5, bu = p.burrow ?? 0, sk = bu * 46, gl = G - 1.5;
  const cl = (f) => (bu > 0.02 ? (x, y) => f(x, y) && y < gl : f), X = (x) => x + ln, Y = (y) => y + sk;
  // 증기 (굴뚝 위로 뭉게뭉게)
  const st = p.steam ?? 0;
  if (st > 0) for (let k = 0; k < 4; k++) S.add(ellR(X(33 + (k % 2 ? 3 : -2) + k), Y(13 - k * 5), 3.4 + k * 1.1, 2.8 + k * 0.9), DR_ST, { z: 20, h: 3 });
  // 무한궤도 (바퀴 넷 · 궤도 마디가 굴러간다)
  S.add(cl(U(ellR(X(28), Y(G - 8), 8, 7.6), ellR(X(72), Y(G - 8), 8, 7.6), polyF([[X(28), Y(G - 15.6)], [X(72), Y(G - 15.6)], [X(72), Y(G - 0.4)], [X(28), Y(G - 0.4)]]))), DR_TR, { z: 2, h: 6 });
  for (const x of [28, 43, 57, 72]) { S.add(cl(ellR(X(x), Y(G - 8), 5, 5)), DR_IRD, { z: 3, h: 6.6 }); S.add(cl(ellR(X(x), Y(G - 8), 1.8, 1.8)), DR_IR, { z: 3.4, h: 7 }); }
  for (let k = 0; k < 8; k++) { const x = X(26 + k * 6.4 + ((sp / T2) * 6.4) % 6.4); S.carve(cl(capF([x, Y(G - 15.4)], [x + 1, Y(G - 14)], 0.5)), 0.8); }
  // 보일러 (놋쇠 · 띠 셋 · 리벳 · 녹 얼룩) + 증기 돔 + 굴뚝
  S.add(cl(U(ellR(X(50), Y(46), 26, 13), polyF([[X(24), Y(40)], [X(76), Y(40)], [X(76), Y(60)], [X(24), Y(60)]]))), DR_BR, { z: 0, h: 14 });
  for (const x of [34, 50, 66]) S.add(cl(capF([X(x), Y(34)], [X(x), Y(60)], 1.6)), DR_BRD, { lift: 0.6, h: 1.2 });
  if (!p.block) for (const x of [34, 50, 66]) for (const y of [38, 44, 50, 56]) bu < 0.3 && S.decal(X(x), Y(y), 0xf8e0a0);
  S.add(cl(U(ellR(X(42), Y(54), 4, 2.6), ellR(X(30), Y(48), 3, 4))), DR_RUST, { on: 1, h: 0.5 });
  S.add(cl(ellR(X(56), Y(33), 6, 4)), DR_BR, { z: 1, h: 6 });
  S.add(cl(U(polyF([[X(29), Y(18)], [X(38), Y(18)], [X(37), Y(36)], [X(30), Y(36)]]), ellR(X(33.5), Y(18), 6.4, 2.4))), DR_IR, { z: 1.4, h: 5 });
  S.add(cl(capF([X(29), Y(25)], [X(38), Y(25)], 1)), DR_IRD, { lift: 0.5, h: 1 });
  // 압력계 (바늘이 흔들림) · 관 · 둥근 창 (붉은 빛)
  S.add(cl(ellR(X(42), Y(46), 4.4, 4.4)), DR_BRD, { lift: 1, h: 2 });
  S.add(cl(ellR(X(42), Y(46), 3.2, 3.2)), DR_GAUGE, { lift: 1.6, h: 1.6 });
  if (!p.block && bu < 0.3) { const na = -2.2 + st * 1.8 + Math.sin(sp) * 0.2, n0 = [X(42), Y(46)]; for (let r = 0; r < 3; r++) S.decal(...pol(n0, na, r), 0x2a1a10); }
  S.add(cl(U(capF([X(24), Y(44)], [X(18), Y(44)], 1.6), capF([X(18), Y(44)], [X(18), Y(56)], 1.6))), DR_IRD, { z: -1, h: 2 });
  S.add(cl(ellR(X(64), Y(45), 5.6, 5.6)), DR_IRD, { lift: 1, h: 2.6 });
  S.add(cl(ellR(X(64), Y(45), 3.8, 3.8)), p.hurt ? DR_IRD : DR_GL, { lift: 1.4, h: 2 });
  // 드릴 (깃 + 나선 홈 원뿔 · 돌면 홈이 앞으로 흐른다)
  const dx = X(78), cy = Y(52), r0 = 12, Ln = 34, rr = (x) => r0 * (1 - (x - dx) / Ln);
  S.add(cl(ellR(dx - 1, cy, 4, 13.6)), DR_IRD, { z: 4, h: 8 });
  S.add(cl(polyF([[dx, cy - r0], [dx, cy + r0], [dx + Ln, cy]])), DR_IR, { z: 5, h: 10, prof: "round" });
  for (let k = 0; k < 6; k++) { const x = dx + 2 + k * 6 + ((sp / T2) * 6) % 6; x < dx + Ln - 3 && S.carve(cl(capF([x, cy - rr(x) + 0.6], [x + 4.6, cy + rr(x + 4.6) - 0.6], 0.55)), 1.2); }
  // 땅속: 흙 둔덕과 튀는 돌
  if (bu > 0.02) {
    const m = Math.min(1, bu * 1.6);
    S.add(U(ellR(X(52), G - 1, 34 * m, 5.6 * m), ellR(X(38), G - 3, 10 * m, 4.4 * m), ellR(X(66), G - 3, 11 * m, 4.6 * m)), DR_DIRT, { z: 25, h: 4 });
    for (const [x, y, r] of [[30, -7, 2], [74, -6, 1.6], [56, -8, 1.8]]) S.add(ellR(X(x), G + y * m, r * m, r * 0.8 * m), DR_DIRT, { z: 26, h: 2 });
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxDrill = {
  fw: Math.round(124 * DRK), fh: Math.round(80 * DRK), w: 40, h: 30,
  anims: { idle: [4, 6], move: [6, 12], wind: [4, 14, !1], atk: [4, 24], rec: [3, 10, !1], hurt: [2, 10, !1], steam: [4, 12, !1], burrow: [5, 12, !1], under: [2, 8], rise: [5, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { spin: ph * 0.3, steam: f % 2 ? 0.4 : 0 };
    if (nm === "move") P = { spin: ph, steam: 0.3 };
    if (nm === "wind") P = { spin: ph * 3, steam: 1, lunge: -0.5 * t };
    if (nm === "atk") P = { spin: ph * 4, lunge: 1, steam: 1 };
    if (nm === "steam") P = { steam: 1, spin: ph };
    if (nm === "burrow") P = { burrow: t, spin: ph * 3 };
    if (nm === "under") P = { burrow: 1, spin: ph, steam: 0.6 };
    if (nm === "rise") P = { burrow: 1 - t, spin: ph * 3, lunge: t };
    if (nm === "rec") P = { spin: ph * (1 - t), lunge: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, spin: ph * 0.2, steam: 1 };
    return drillFrame(P);
  },
};

// ════ 폭발 가스 버섯 ════ 노란 점박이 버섯. 갓 아래 주머니가 부풀었다 펑 터지며 가스를 뿜는다 (불이 닿으면 크게 폭발)
//   p: swell 부풀기(0~1.4) · burst 터짐 · hurt
const SHRM = ramp(0xc8a840), GILL = ramp(0xe8d8b0);
function gasShroomFrame(p = {}) {
  const W = 52, H = 52, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 26 });
  const sw = p.swell ?? 0, br = p.burst ?? 0, cx = 26;
  const CAP = mat(ramp(0xc8a840), { tex: "skin", amp: 0.9, spec: 0.4 }), STM = mat(ramp(0xe8dcc0), { tex: "wood", amp: 0.6, dir: 1.57 }), GIL = mat(ramp(0xe8d8b0), { tex: "cloth" }), SAC = mat(ramp(0xd8c060, { hi: 0.6 }), { tex: "skin", amp: 0.8, spec: 0.7 });
  S.add(ellR(cx, G - 1, 12, 2.6), mat(ramp(0x5a4a3a), { tex: "clay" }), { z: -1, h: 1.4 });
  S.add(U(capF([cx, G - 2], [cx + 1, G - 20], 4.4, 3.6)), STM, { z: 0, h: 3 });
  S.add(ellR(cx + 1, G - 17, 6, 2), mat(ramp(0xd8c8a8), { tex: "cloth" }), { z: 0.4, h: 1 });
  // 주머니 (갓 아래 부풂)
  if (!br) S.add(ellR(cx + 1, G - 24 + sw, 7 + sw * 4, 4 + sw * 3), SAC, { z: 0.6, h: 3 + sw * 2 });
  S.add(minus(ellR(cx, G - 26, 17, 12), (x, y) => y > G - 24), CAP, { z: 1, h: 9 });
  S.add(capF([cx - 16, G - 24.4], [cx + 16, G - 24.4], 1.2), GIL, { z: 1.2, h: 0.6 });
  for (const [x, y, r] of [[-9, -30, 2.4], [-1, -34, 2], [8, -31, 2.6], [12, -27, 1.6], [-13, -26, 1.6]]) S.add(ellR(cx + x, G + y, r, r * 0.8), mat(ramp(0x8a4a2a), { tex: "skin" }), { on: 1, lift: 0.4, h: 0.4 });
  for (const x of [cx + 3, cx + 7]) { S.add(ellR(x, G - 14, 1, 1.2), I_VD, { z: 0.8, lift: 0.1, h: 0.2 }); }
  const C = S.render({ rim: !0 });
  if (br) { const Q = I_toPx(W, H, 0.72, 26); for (let k = 0; k < 18; k++) { const a = k * 0.35, r = 10 + (k % 4) * 4; const q = Q(cx + Math.cos(a) * r, G - 22 + Math.sin(a) * r * 0.6); C.px(q[0], q[1], k % 3 ? 0xc8d860 : 0xe8f0a0); } }
  return done3(C, p);
}
export const pxGasShroom = spec(37, 37, 18, 20,
  { idle: [4, 5], move: [4, 6], wind: [5, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { swell: t * 1.4 };
    if (nm === "atk") return { swell: [1.4, 0.2, 0][f], burst: 1 };
    if (nm === "rec") return { swell: 0 };
    if (nm === "hurt") return { hurt: f === 0, swell: 0.5 };
    return { swell: Math.max(0, Math.sin(ph)) * 0.3 };
  }, gasShroomFrame);

// ════ 유령 광부 ════ 무너진 갱도에 갇힌 광부의 혼. 헬멧 등불은 아직 켜져 있고, 곡괭이를 내려찍고는 벽 속으로 사라진다
//   p: bob · pick 곡괭이 · fade · hurt
const GMIN = ramp(0x8ab0c8, { warm: 0xe8f8ff });
function ghostMinerFrame(p = {}) {
  const W = 60, H = 66, S = sculpt(W, H, { k: 0.72, ax: 28 });
  const b = p.bob ?? 0, pk = p.pick ?? 0, cx = 26;
  const GH = mat(ramp(0x8ab0c8, { hi: 0.6 }), { tex: "cloth", amp: 0.6, spec: 0.3 }), GHF = mat(rampF(0x6a8aa0), { tex: "cloth" }), HELM = mat(ramp(0xa89060), { tex: "metal", spec: 0.5 });
  S.add(polyF([[cx - 9, 30 + b], [cx + 9, 30 + b], [cx + 7, 46 + b], [cx + 2, 60 + b], [cx - 3, 64 + b], [cx - 6, 52 + b], [cx - 11, 44 + b]]), GH, { z: 1, h: 6 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 5 + k * 4, 38 + b], [cx - 4 + k * 3, 60 + b], 0.5), 0.8);
  S.add(capF([cx - 8, 40 + b], [cx + 8, 40 + b], 1.2), mat(ramp(0x6a5a4a), { tex: "leather" }), { z: 1.6, h: 0.8 });
  S.add(capF([cx - 6, 32 + b], [cx + 2, 44 + b], 0.8), mat(ramp(0x6a5a4a), { tex: "leather" }), { z: 1.7, h: 0.4 });
  S.add(capF([cx - 6, 30 + b], [cx - 8, 40 + b], 2.6, 2), GHF, { z: -0.5, h: 1.6 });
  const hx = cx + 2, hy = 20 + b;
  S.add(ellR(hx, hy, 6.4, 7), GH, { z: 3, h: 5 });
  S.add(polyF([[hx - 2, hy + 3], [hx + 7, hy + 3], [hx + 5, hy + 12], [hx, hy + 9]]), mat(ramp(0xb8d0e0), { tex: "fur", dir: 1.57 }), { z: 3.3, h: 1.4 });
  S.add(ellR(hx + 3, hy - 1, 3.4, 1.8), mat(ramp(0x0e1a22)), { z: 3.4, lift: 0.1, h: 0.3 });
  !p.hurt && S.decal(hx + 2, hy - 1, 0xa0f8ff).decal(hx + 5, hy - 1, 0xa0f8ff);
  S.add(minus(ellR(hx, hy - 3, 7.4, 6), (x, y) => y > hy - 3), HELM, { z: 3.8, h: 4 });
  S.add(capF([hx - 8, hy - 3], [hx + 9, hy - 3], 1), HELM, { z: 4, h: 0.6 });
  S.add(ellR(hx + 5, hy - 6, 2.4, 2.4), I_LAMP, { z: 4.2, h: 1.4 });
  const sh = [cx + 6, 32 + b], a = -2.2 + pk * 1.6, hand = pol(sh, a + 0.7, 10), tip = pol(hand, a, 18), ha = a + Math.PI / 2;
  S.add(capF(sh, hand, 2.6, 2.2), GH, { z: 6, h: 1.6 });
  S.add(capF(pol(hand, a, -4), tip, 1.1), mat(ramp(0x6a7a88), { tex: "wood" }), { z: 6.4, h: 0.8 });
  S.add(U(capF(tip, pol(pol(tip, ha, 9), a, -3), 1.8, 0.4), capF(tip, pol(pol(tip, ha, -7), a, -3), 1.6, 0.4)), mat(ramp(0x8aa0b0), { tex: "metal", spec: 0.6 }), { z: 6.6, h: 1.2 });
  const C = S.render({ rim: !0 });
  const Q = I_toPx(W, H, 0.72, 28);
  for (let k = 0; k < 3; k++) { const q = Q(hx + 9 + k * 3, hy - 7 + k * 0.4); C.px(q[0], q[1], k ? 0xffe8a0 : 0xffc850); }
  fade(C, 44 + b, 66);
  (p.fade ?? 0) > 0 && fade(C, 0, 66 / (p.fade + 0.01));
  return p.hurt ? flash(C) : C;
}
export const pxGhostMiner = spec(43, 48, 14, 28,
  { idle: [6, 8], move: [6, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], fade: [4, 10, !1], appear: [4, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { pick: t, bob: -0.5 };
    if (nm === "atk") return { pick: [1.6, 2, 2.1][f], bob: 1 };
    if (nm === "rec") return { pick: 2 - 1.8 * t };
    if (nm === "fade") return { fade: 0.3 + t * 2.2 };
    if (nm === "appear") return { fade: 2.5 - t * 2.4 };
    if (nm === "hurt") return { hurt: f === 0, bob: 1 };
    return { bob: Math.sin(ph) * 1.2, pick: 0.2 };
  }, ghostMinerFrame, { flying: !0 });

// ════ 수정 전갈 ════ 보랏빛 수정이 돋은 전갈. 수정 꼬리로 찌르고 집게로 붙잡는다
//   p: legs · tail 꼬리 찌르기(0~1) · claw · hurt
const SCOR = ramp(0x4a3a5a), SCORF = rampF(0x3e3050);
function crystalScorpFrame(p = {}) {
  const W = 80, H = 48, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 38 });
  const lp = p.legs ?? 0, tl = p.tail ?? 0, cl = p.claw ?? 0, cx = 34;
  const SC = mat(ramp(0x4a3a5a), { tex: "metal", amp: 0.7, spec: 0.8 }), SCF = mat(rampF(0x3e3050), { tex: "metal" });
  for (let k = 0; k < 4; k++) for (const far of [1, 0]) { const s = [cx - 4 + k * 5, G - 9], a = 1.3 + Math.sin(lp + k * 1.6 + far * 3) * 0.35 + (k - 1.5) * 0.25, e = pol(s, a - 0.9, 6), ft = pol(e, a + 0.6, 6); S.add(U(capF(s, e, 1.1, 0.9), capF(e, ft, 0.9, 0.4)), far ? SCF : SC, { z: far ? -2 : 3, h: 0.7 }); }
  // 꼬리 (위로 말린 마디 + 수정 침)
  let q = [cx - 10, G - 12], a = Math.PI + 0.5;
  for (let k = 0; k < 6; k++) { const n2 = pol(q, a, 5.2), w = 3.6 - k * 0.3; S.add(ellR(...lerp(q, n2, 0.5), w, w * 0.9), k % 2 ? SC : SCF, { z: 1.4 + k * 0.1, h: w * 0.8 }); q = n2; a += 0.42 + tl * 0.22; }
  S.add(polyF([pol(q, a + 1.57, 2.4), pol(q, a, 8 + tl * 2), pol(q, a - 1.57, 2.4)]), I_CRYS, { z: 2.2, h: 1.6, prof: "sharp" });
  // 몸 + 수정 돌기
  S.add(U(ellR(cx, G - 11, 12, 5.6), ellR(cx + 10, G - 12, 6.4, 5)), SC, { z: 1, h: 5 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 8 + k * 5, G - 16], [cx - 8 + k * 5, G - 6], 0.4), 0.6);
  for (const [x, l] of [[-6, 5], [0, 7], [6, 5]]) S.add(polyF([[cx + x - 1.6, G - 15], [cx + x, G - 15 - l], [cx + x + 1.6, G - 15]]), I_CRYS, { lift: 0.8, h: 1, prof: "sharp" });
  !p.hurt && S.decal(cx + 14, G - 14, 0xb07aff).decal(cx + 12.6, G - 14.4, 0xb07aff);
  // 집게
  for (const far of [1, 0]) { const r = [cx + 14, G - 10 + far], e = [cx + 22 + cl * 4, G - 14 - far * 2], o = cl * 0.6; S.add(capF(r, e, 1.8, 1.6), far ? SCF : SC, { z: far ? -1 : 4, h: 1.2 }); S.add(U(ellR(e[0] + 2, e[1], 3.4, 2.6), polyF([[e[0] + 3, e[1] - 1], [e[0] + 9, e[1] - 3 - o * 3], [e[0] + 5, e[1] - 0.4]]), polyF([[e[0] + 3, e[1] + 1], [e[0] + 8, e[1] + 2 + o * 3], [e[0] + 5, e[1] + 0.4]])), far ? SCF : SC, { z: far ? -0.9 : 4.1, h: 1.6 }); }
  return done3(S.render({ rim: !0 }), p);
}
export const pxCrystalScorp = spec(58, 35, 28, 14,
  { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], pinch: [3, 16, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "move") return { legs: ph * 2, claw: 0.2 };
    if (nm === "wind") return { tail: -0.5 * t, claw: 0.3 };
    if (nm === "atk") return { tail: [0.6, 1.2, 1][f] };
    if (nm === "pinch") return { claw: [0, 1, 1][f] };
    if (nm === "rec") return { tail: 1 - t, claw: 0.2 };
    if (nm === "hurt") return { hurt: f === 0, tail: -0.3 };
    return { legs: Math.sin(ph) * 0.3, claw: 0.2 + 0.1 * Math.sin(ph) };
  }, crystalScorpFrame);

// ════ [정예] 광산 웜 ════ (큰 몬스터 조각 도구) 땅을 헤엄치는 거대한 웜. 마디 주름 몸 · 몸에 박힌 광석(쇠·구리·수정) · 겹겹이 이빨 난 둥근 입. 땅속을 헤엄치다 솟구친다
//   p: wave · rise 솟음(0 땅속 ~ 1 전부) · mouth · hurt
const WMK = 0.7;
const WM_SK = mat(ramp(0xa06e5c), { tex: "skin", amp: 0.5, spec: 0.3 }), WM_BEL = mat(ramp(0xd4a48c), { tex: "skin", amp: 0.3 }), WM_LIP = mat(ramp(0xc88a7a), { tex: "skin", amp: 0.3, spec: 0.3 });
const WM_IN = mat(ramp(0x4a0e18)), WM_DIRT = mat(ramp(0x6a5040), { tex: "stone", amp: 0.9 }), WM_IRON = mat(ramp(0x8a8a92), { spec: 0.6 }), WM_CU = mat(ramp(0xc87a40), { spec: 0.6 }), WM_CRY = mat(rampGlow(0xb07aff), { spec: 0.8 });
function wormFrame(p = {}) {
  const W = 128, H = 92, G = H - 1, S = sculpt(W, H, { k: p.k ?? WMK, ax: 58 });
  const wv = p.wave ?? 0, rs = p.rise ?? 1, mo = p.mouth ?? 0, gl = G - 2;
  const up = (f) => (x, y) => f(x, y) && y < gl;
  if (rs > 0.04) {
    const N = 10, pts = [];
    for (let k = 0; k <= N; k++) { const t = k / N; pts.push([54 + Math.sin(wv + k * 0.6) * 5 * (1 - t * 0.5) + t * t * 26 * rs, gl + 4 - t * 74 * rs]); }
    const rad = (k) => 12.6 - k * 0.3, ang = (k) => { const a = pts[Math.min(N, k + 1)], c = pts[Math.max(0, k - 1)]; return Math.atan2(a[1] - c[1], a[0] - c[0]); };
    const off = (k, d) => pol(pts[k], ang(k) + Math.PI / 2, d);
    // 몸 마디 (아래 → 위) + 앞쪽 연한 배 + 마디 주름
    for (let k = 1; k <= N; k++) S.add(up(capF(pts[k - 1], pts[k], rad(k - 1), rad(k))), WM_SK, { z: k * 0.4, h: rad(k) * 0.9 });
    for (let k = 1; k <= N; k++) S.add(up(capF(off(k - 1, -rad(k - 1) * 0.5), off(k, -rad(k) * 0.5), rad(k - 1) * 0.36, rad(k) * 0.36)), WM_BEL, { on: 1, h: 0.5 });
    for (let k = 1; k < N; k++) { const a = ang(k), r = rad(k); S.carve(up(capF(pol(pts[k], a + 1.57, r * 0.98), pol(pts[k], a - 1.57, r * 0.98), 0.6)), 1.1); }
    // 박힌 광석 (등 쪽)
    for (const [k, M0, s] of [[2, WM_IRON, 1], [4, WM_CU, 0.9], [6, WM_CRY, 1], [8, WM_IRON, 0.8], [5, WM_CRY, 0.7]]) {
      if (k > N) continue;
      const q = off(k, rad(k) * 0.55), a = ang(k) + Math.PI / 2;
      S.add(up(M0 === WM_CRY ? polyF([pol(q, a - 1.6, 2.4 * s), pol(q, a + 1.6, 2.4 * s), pol(q, a, 6 * s)]) : U(ellR(q[0], q[1], 3.2 * s, 2.6 * s, a), ellR(...pol(q, a, 2 * s), 2.2 * s, 1.8 * s))), M0, { lift: 1.6, h: 2.4 * s });
    }
    // 머리: 입술 고리 · 입 속 · 이빨 두 겹
    const hd = pts[N], a = ang(N), c = pol(hd, a, 3);
    S.add(up(ellR(c[0], c[1], 6.4, 12.4, a)), WM_LIP, { z: N * 0.4 + 1, h: 6 });
    const mr = 0.55 + Math.min(1.4, mo) * 0.32, ic = pol(c, a, 1.6);
    S.add(up(ellR(ic[0], ic[1], 3.8 * mr, 8.6 * mr, a)), WM_IN, { on: 1, h: 0.4 });
    if (!p.block) {
      for (let k = 0; k < 12; k++) { const u = (k / 12) * T2, q = [ic[0] + Math.cos(u) * 3.8 * mr * Math.cos(a) - Math.sin(u) * 8.6 * mr * Math.sin(a), ic[1] + Math.cos(u) * 3.8 * mr * Math.sin(a) + Math.sin(u) * 8.6 * mr * Math.cos(a)]; S.decal(q[0], q[1], 0xf4ecd8); }
      mo > 0.5 && [0, 1, 2, 3, 4, 5].forEach((k) => { const u = (k / 6) * T2 + 0.4, q = [ic[0] + Math.cos(u) * 2 * mr * Math.cos(a) - Math.sin(u) * 4.6 * mr * Math.sin(a), ic[1] + Math.cos(u) * 2 * mr * Math.sin(a) + Math.sin(u) * 4.6 * mr * Math.cos(a)]; S.decal(q[0], q[1], 0xe0d0b8); });
    }
  }
  // 흙 둔덕 (나오는 자리) + 흩어진 돌
  const m = rs > 0.04 ? 1 : 0.8;
  S.add(U(ellR(54, G - 1, 26 * m, 6), ellR(38, G - 3.4, 10 * m, 5), ellR(70, G - 3.4, 11 * m, 5)), WM_DIRT, { z: 30, h: 5 });
  for (const [x, y, r] of [[30, -6, 2.2], [78, -5, 1.8], [46, -8, 1.6], [64, -7.5, 2]]) S.add(ellR(x, G + y, r, r * 0.8), WM_DIRT, { z: 31, h: 2 });
  rs <= 0.04 && S.carve(U(capF([46, G - 7], [54, G - 4], 0.6), capF([54, G - 4], [62, G - 7.4], 0.6)), 1);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMineWorm = {
  fw: Math.round(128 * WMK), fh: Math.round(92 * WMK), w: 30, h: 40,
  anims: { idle: [4, 6], move: [6, 10], wind: [4, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], dive: [5, 12, !1], under: [4, 10], rise: [5, 14, !1], spit: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { wave: ph, rise: nm === "move" ? 0.6 : 1, mouth: 0.2 };
    if (nm === "wind") P = { wave: ph, mouth: t, rise: 1 };
    if (nm === "atk") P = { mouth: 1.2, rise: 1, wave: 0.5 };
    if (nm === "spit") P = { mouth: [0.6, 1.4, 1][f], rise: 1 };
    if (nm === "dive") P = { rise: 1 - t, wave: ph };
    if (nm === "under") P = { rise: 0 };
    if (nm === "rise") P = { rise: t, mouth: t, wave: ph };
    if (nm === "rec") P = { mouth: 1 - t, rise: 1 };
    if (nm === "hurt") P = { hurt: f === 0, rise: 0.9, mouth: 0.8 };
    return wormFrame(P);
  },
};
