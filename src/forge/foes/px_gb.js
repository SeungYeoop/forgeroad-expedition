// 글래스블룸 몬스터 12종 (조각 도구 = 높이 지도 → 빛·그림자·틈새 어둠·재질 결, 오른쪽을 본다) — 하늘에 뜬 수정 온실 군도
//   아래 섬 줄: 수정껍질 달팽이 · 정원 자동인형 · 가시 화분 · [정예] 온실 유리 골렘
//   가운데 줄: 수정 날개 나방 · 유리 벌 · 유리 덩굴 · [정예] 거대 파리지옥
//   위 줄: 프리즘 정령 · 벌새 떼 · 파편 정령 · [정예] 수정 공작
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, glass, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

// ── 재질 ──
const BRASS = mat(ramp(0xb08a4a), { tex: "metal", amp: 0.9, spec: 0.4 }), BRASSF = mat(rampF(0x9a7840), { tex: "metal", amp: 0.8 });
const COPPER = mat(ramp(0x6a9a90), { tex: "metal", amp: 1, spec: 0.3 }), STEEL = mat(ramp(0xb8bcc0), { tex: "metal", amp: 0.6, spec: 0.6 });
const GLS = mat(ramp(0xa8ccd2, { hi: 0.5 }), { tex: "glass", amp: 1, spec: 0.6 }), GLSF = mat(rampF(0x90b4bc), { tex: "glass", amp: 0.8 });
const CRY = mat(ramp(0xb2a2d6, { hi: 0.45 }), { tex: "crystal", amp: 0.9, spec: 0.55 }), CRYF = mat(rampF(0x9888bc), { tex: "crystal", amp: 0.8 });
const GLOW = mat(rampGlow(0xe8d8ff)), GLOWW = mat(rampGlow(0xfff0b0)), GLOWT = mat(rampGlow(0x9af0e0));
const LEAF = mat(ramp(0x5e8c4e), { tex: "leaf", amp: 1 }), LEAFF = mat(rampF(0x4e7a42), { tex: "leaf", amp: 0.9 }), LEAFP = mat(ramp(mixc(0x5e8c4e, 0xa8ccd2, 0.4)), { tex: "leaf", amp: 0.7 });
const STEM = mat(ramp(0x6a8a4c), { tex: "skin", amp: 0.7 }), STEMF = mat(rampF(0x5a7840), { tex: "skin", amp: 0.6 });
const CLAY = mat(ramp(0xa4664a), { tex: "clay", amp: 1 }), CLAYF = mat(rampF(0x8a5640), { tex: "clay", amp: 0.9 }), SOIL = mat(ramp(0x5a4232), { tex: "clay", amp: 1.2 });
const SLUG = mat(ramp(0x9aa48c), { tex: "skin", amp: 0.8, spec: 0.35 }), SLUGF = mat(rampF(0x86907a), { tex: "skin", amp: 0.7 }), SLUGB = mat(ramp(0xc4c8a8), { tex: "skin", amp: 0.5 });
const APRON = mat(ramp(0x6e6a4c), { tex: "cloth", amp: 0.9 }), WOODH = mat(ramp(0x7a5434), { tex: "wood", amp: 0.8, dir: 0.3 });
const FUR = mat(ramp(0xa496b4), { tex: "fur", amp: 1, dir: 1.57 }), FURD = mat(ramp(0x3a3438), { tex: "fur", amp: 1, dir: 1.57 }), FURF = mat(rampF(0x8a7c9a), { tex: "fur", amp: 0.8, dir: 1.57 });
const AMB = mat(ramp(0xd09a46, { hi: 0.5 }), { tex: "glass", amp: 0.7, spec: 0.5 }), RED = mat(ramp(0xa8443e), { tex: "skin", amp: 0.6, spec: 0.3 });
const CACT = mat(ramp(0x6a9a70), { tex: "skin", amp: 0.8 }), PEA = mat(ramp(0x48589c), { tex: "feather", amp: 1, dir: 0.4 }), PEAF = mat(rampF(0x3c4a86), { tex: "feather", amp: 0.9, dir: 0.4 });
const TEAL = mat(ramp(0x3e8a86), { tex: "feather", amp: 0.9, dir: 1.2 }), LEG = mat(ramp(0x8a827a), { tex: "scale", amp: 0.8 }), LEGF = mat(rampF(0x726a64), { tex: "scale", amp: 0.7 });
const BEAK = mat(ramp(0xc8b88a), { spec: 0.4 }), IRID = (c) => mat(ramp(c, { hi: 0.5 }), { tex: "feather", amp: 0.9, dir: 0.3, spec: 0.35 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
// 수정 결정 하나: 밑 a → 끝 b, 폭 w (각진 모양, 두 면이 다르게 빛을 받는다)
function crys(S, a, b, w, M = CRY, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], Ln = Math.hypot(dx, dy) || 1, nx = -dy / Ln, ny = dx / Ln, m = lerp(a, b, 0.7);
  S.add(polyF([[a[0] + nx * w, a[1] + ny * w], [m[0] + nx * w * 0.85, m[1] + ny * w * 0.85], b, [m[0] - nx * w * 0.85, m[1] - ny * w * 0.85], [a[0] - nx * w, a[1] - ny * w]]), M, { prof: "sharp", h: o.h ?? w * 1.3, z: o.z, lift: o.lift, on: o.on });
  return S;
}

// ════ 수정껍질 달팽이 ════ 젖은 회녹색 몸 · 눈자루 · 나선 껍질에 수정 결정이 돋고, 껍질 틈에 새싹이 자란다
//   p: bob · stretch · hide(0~1) · spike(0~1.2) · eye · hurt
const SNK = 0.74;
function snailFrame(p = {}) {
  const W = 66, H = 50, G = H - 1, S = sculpt(W, H, { k: SNK, ax: 32 });
  const b = p.bob ?? 0, st = p.stretch ?? 0, hd = p.hide ?? 0, sp = p.spike ?? 0;
  const sx = 28, sy = G - 19 + b * 0.5;
  // 몸 (발 · 목 · 머리)
  if (hd < 1) {
    const tx0 = 8 - st * 2, hx = 52 + st * 4 - hd * 18;
    S.add(U(polyF([[tx0, G - 0.5], [hx + 3, G - 0.5], [hx + 4, G - 7 + b], [tx0 + 6, G - 6 + b]]), ellR(tx0 + 4, G - 3, 5, 3)), SLUG, { z: 0, h: 5 });
    S.add(ellR(L(tx0, hx, 0.55), G - 2, (hx - tx0) * 0.45, 2), SLUGB, { on: 1, h: 0.6 });
    for (let k = 0; k < 6; k++) S.carve(capF([tx0 + 8 + k * 6, G - 6 + b], [tx0 + 9 + k * 6, G - 1], 0.5), 0.6);
    S.add(U(ellR(hx, G - 9 + b, 7 - hd * 2.4, 6.4 - hd * 2.4), capF([hx - 8, G - 6 + b], [hx, G - 9 + b], 5)), SLUG, { z: 6, h: 6 });
    S.carve(capF([hx + 2, G - 5 + b], [hx + 7, G - 6 + b], 0.6), 0.8, !1);
    if (hd < 0.5) {
      const e = p.eye ?? 0;
      for (const [d, M0, z] of [[-2.4, SLUGF, 4], [1.8, SLUG, 9]]) {
        const s0 = [hx + d, G - 13 + b], s1 = [hx + d + 3 + e * 2.5, G - 25 + b + Math.abs(e)];
        S.add(capF(s0, s1, 1.6, 1.1), M0, { z, h: 1.6 });
        S.add(ellR(s1[0], s1[1], 2.4, 2.4), M0, { z: z + 1, h: 2.4 });
        z > 5 && !p.hurt && S.decal(s1[0] + 0.8, s1[1], 0x1a1410).decal(s1[0], s1[1] - 0.8, 0xffffff);
      }
    }
  }
  // 껍질 (나선 홈 · 면 결) + 새싹
  S.add(ellR(sx, sy, 17, 16), CRY, { z: 4, h: 15 });
  for (let i = 0; i < 26; i++) { const a0 = i * 0.42, r0 = 14 - i * 0.48, a1 = (i + 1) * 0.42, r1 = 14 - (i + 1) * 0.48; r1 > 1 && S.carve(capF([sx + Math.cos(a0) * r0, sy + Math.sin(a0) * r0 * 0.94], [sx + Math.cos(a1) * r1, sy + Math.sin(a1) * r1 * 0.94], 0.7), 1.1); }
  S.add(ellR(sx - 2, sy - 2, 4, 3.5), GLOW, { lift: 0.5, h: 1.5 });
  // 결정 가시 (등을 따라, 내밀면 길어짐)
  for (const [a, len, w] of [[-2.5, 8, 2.6], [-2.0, 11, 3], [-1.5, 12, 3.2], [-1.0, 10, 2.8], [-0.55, 7, 2.4]]) {
    const base = pol([sx, sy], a, 13.5), tip = pol([sx, sy], a, 13.5 + len * (0.65 + sp * 0.55));
    crys(S, base, tip, w, a < -1.6 ? CRYF : CRY, { lift: 2 });
  }
  S.add(capF([sx + 9, sy - 11], [sx + 11, sy - 17], 0.8, 0.6), STEM, { lift: 2, h: 0.8 });
  S.add(ellR(sx + 9, sy - 18, 2.6, 1.4, -0.5), LEAF, { lift: 2.5, h: 1.2 }).add(ellR(sx + 13, sy - 18.5, 2.6, 1.4, 0.5), LEAF, { lift: 2.5, h: 1.2 });
  return fin(S.render({ rim: !0 }), p);
}
const SNAIL_P = (nm, f, n) => {
  const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
  if (nm === "idle") return { bob: Math.sin(ph) * 0.5, eye: Math.sin(ph) * 0.4 };
  if (nm === "move") return { stretch: (Math.sin(ph) + 1) * 0.6, bob: Math.cos(ph) * 0.3 };
  if (nm === "hide") return { hide: 1 };
  if (nm === "wind") return { hide: 0.6 * t, spike: 0.3 * t, bob: t };
  if (nm === "atk") return { hide: 0.2, spike: 1.2, stretch: 1.4, bob: -0.5 };
  if (nm === "rec") return { spike: 1 - t, stretch: 1 - t };
  return { hurt: f === 0, eye: -0.6, hide: 0.4 };
};
export const pxSnail = { fw: Math.round(66 * SNK), fh: Math.round(50 * SNK), w: 22, h: 16, anims: { idle: [4, 5], move: [6, 8], hide: [2, 6], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] }, px: (nm, f, n) => snailFrame(SNAIL_P(nm, f, n)) };

// ════ 정원 자동인형 ════ 녹청 낀 놋쇠 몸통 · 배에 압력계 · 캔버스 앞치마(모종삽) · 등에 물탱크 · 새싹이 자라는 유리 머리 ·
//   한 팔은 강철 전지가위, 한 팔은 구리 물뿌리개
//   p: bob · legs · shear(0~1.2) · open · can · lean · hurt
const GDK = 0.7;
function gardenerFrame(p = {}) {
  const W = 64, H = 68, G = H - 1, S = sculpt(W, H, { k: GDK, ax: 30 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, ln = p.lean ?? 0, cx = 30 + ln;
  // 등 물탱크 (뒤)
  S.add(U(ellR(cx - 11, 30 + b, 6, 10), ellR(cx - 11, 20 + b, 6, 2.4)), COPPER, { z: -4, h: 5 });
  for (const y of [24, 32, 38]) S.carve(capF([cx - 17, y + b], [cx - 5, y + b], 0.5), 0.6);
  S.add(capF([cx - 11, 18 + b], [cx - 13, 12 + b], 1.2), BRASSF, { z: -3, h: 1.2 });
  // 다리 (먼 쪽부터): 관절 볼트 + 둥근 장화
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) {
    const hp = [cx - 3 + (far ? -3 : 3), 46 + b], ft = [hp[0] + o[0] + 1, G - 2 - o[1]], kn = ik(hp, ft, 10, 10, 1), M0 = far ? BRASSF : BRASS;
    S.add(U(capF(hp, kn, 2.4, 2), capF(kn, ft, 2, 1.8)), M0, { z: far ? -2 : 4, h: 2.2 });
    S.add(ellR(kn[0], kn[1], 2.6, 2.6), M0, { z: far ? -1 : 5, h: 2.6 });
    S.add(U(ellR(ft[0] + 1.5, ft[1] - 0.5, 4.6, 2.8), capF([ft[0] - 1, ft[1] - 3], [ft[0] + 1, ft[1] - 1], 2)), far ? mat(rampF(0x4a3a2c), { tex: "leather" }) : mat(ramp(0x5a4632), { tex: "leather", amp: 0.8 }), { z: far ? 0 : 6, h: 2.6 });
  }
  // 먼 팔: 구리 물뿌리개
  const can = p.can ?? 0, sh0 = [cx - 7, 28 + b], hd0 = [cx - 12, 38 + b];
  S.add(capF(sh0, hd0, 2, 1.7), BRASSF, { z: -1, h: 2 });
  const R0 = (q) => { const c = Math.cos(-can * 0.9), s = Math.sin(-can * 0.9), dx = q[0] - hd0[0], dy = q[1] - hd0[1]; return [hd0[0] + dx * c - dy * s, hd0[1] + dx * s + dy * c]; };
  S.add(polyF([R0([cx - 24, 37 + b]), R0([cx - 13, 37 + b]), R0([cx - 13, 47 + b]), R0([cx - 24, 47 + b])]), COPPER, { z: 0, h: 5, prof: "flat" });
  S.add(capF(R0([cx - 24, 40 + b]), R0([cx - 31, 33 + b]), 1.4, 1.8), COPPER, { z: 0.5, h: 1.6 });
  S.add(ellR(...R0([cx - 32, 32 + b]), 2.4, 2.4), BRASSF, { z: 1, h: 1.6 });
  S.carve(capF(R0([cx - 24, 42 + b]), R0([cx - 13, 42 + b]), 0.5), 0.7);
  can > 0.5 && [[cx - 33, 36], [cx - 34, 39], [cx - 32, 41], [cx - 35, 43]].forEach(([x, y]) => S.decal(x, y + b, 0xb8e0f0));
  // 몸통: 놋쇠 통 + 이음 띠 + 리벳 + 압력계 + 녹청 얼룩
  S.add(ellR(cx, 34 + b, 11.5, 12.5), BRASS, { z: 2, h: 11 });
  S.carve(capF([cx - 11, 34 + b], [cx + 11, 34 + b], 0.6), 0.9);
  for (const [x, y] of [[-8, -8], [8, -8], [-10, 0], [10, 0], [-8, 7], [8, 7]]) S.add(ellR(cx + x, 34 + y + b, 0.9, 0.9), BRASS, { on: 1, h: 0.8 });
  S.add(ellR(cx + 4, 30 + b, 3.6, 3.6), BRASS, { on: 1, lift: 0.6, h: 1 });
  S.add(ellR(cx + 4, 30 + b, 2.6, 2.6), mat(ramp(0xe8e0c8), { spec: 0.6 }), { on: 1, lift: 0.4, h: 0.5 });
  S.decal(cx + 4, 30 + b, 0x2a2018).decal(cx + 5, 29 + b, 0xa83020);
  S.add(ellR(cx - 5, 39 + b, 3.4, 2.2), COPPER, { on: 1, h: 0.3 });
  // 캔버스 앞치마 + 주머니 + 모종삽 손잡이
  S.add(polyF([[cx - 5, 37 + b], [cx + 9, 36 + b], [cx + 10, 50 + b], [cx - 6, 50 + b]]), APRON, { on: 1, lift: 1.2, h: 1.2 });
  S.add(polyF([[cx - 2, 42 + b], [cx + 6, 42 + b], [cx + 6, 47 + b], [cx - 2, 47 + b]]), APRON, { on: 1, lift: 0.6, h: 0.6 });
  S.add(capF([cx + 1, 41 + b], [cx + 1.5, 36 + b], 0.9), WOODH, { lift: 1.5, h: 1 });
  S.carve(capF([cx - 5, 37 + b], [cx - 6, 50 + b], 0.4), 0.5);
  // 어깨 덮개
  S.add(ellR(cx + 7, 25 + b, 4.6, 3.6), BRASS, { z: 7, h: 3.4 });
  // 머리: 놋쇠 목테(눈 등 둘) + 유리 돔 + 안의 흙과 새싹
  const hx = cx + 2 + ln * 0.6, hy = 15 + b;
  S.add(ellR(hx, hy + 6, 8.6, 2.8), BRASS, { z: 9, h: 2.6 });
  S.add(ellR(hx, hy - 1, 8, 7.4), GLS, { z: 9, h: 7, prof: "round" });
  S.add(ellR(hx, hy + 3.5, 6.6, 1.8), SOIL, { on: 1, lift: 0.5, h: 0.8 });
  S.add(capF([hx - 0.5, hy + 3], [hx, hy - 3.5], 0.7, 0.5), LEAFP, { on: 1, lift: 0.6, h: 0.6 });
  S.add(ellR(hx - 2.6, hy - 3, 2.6, 1.4, -0.5), LEAFP, { on: 1, lift: 0.7, h: 0.6 }).add(ellR(hx + 2.6, hy - 4, 2.8, 1.4, 0.5), LEAFP, { on: 1, lift: 0.7, h: 0.6 });
  if (!p.hurt) for (const x of [hx + 3, hx + 6.5]) S.decal(x, hy + 6, 0x9af0e0).decal(x + 0.5, hy + 5.5, 0xffffff);
  S.decal(hx - 4, hy - 4, 0xffffff).decal(hx - 3, hy - 5, 0xffffff).decal(hx - 5, hy - 2, 0xe8f4f8);
  // 가까운 팔: 강철 전지가위 (두 날 · 나무 손잡이 · 가운데 나사)
  const sr = p.shear ?? 0, op = p.open ?? 0.2, sh1 = [cx + 8, 26 + b];
  const hand = sr > 0.6 ? pol(sh1, -1.7 + (sr - 0.6) * 2.4, 11) : pol(sh1, 0.6 - sr * 2, 11);
  S.add(capF(sh1, hand, 2.3, 2), BRASS, { z: 10, h: 2.2 });
  const ang = Math.atan2(hand[1] - sh1[1], hand[0] - sh1[0]) + (sr > 0.6 ? 0.3 : -0.2);
  for (const sgn of [-1, 1]) {
    const a = ang + sgn * op * 0.5, tip = pol(hand, a, 15), back = pol(hand, a + Math.PI, 4);
    S.add(capF(back, hand, 1.4, 1.2), WOODH, { z: 11 + sgn * 0.2, h: 1.3 });
    S.add(polyF([pol(hand, a + Math.PI / 2, 1.8), tip, pol(hand, a - Math.PI / 2, 0.8)]), STEEL, { z: 11.5 + sgn * 0.3, h: 1.6, prof: "sharp" });
  }
  S.add(ellR(hand[0], hand[1], 1.6, 1.6), BRASS, { z: 12.5, h: 1.2 });
  return fin(S.render({ rim: !0 }), p);
}
const GARD_P = (nm, f, n) => {
  const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
  if (nm === "idle") return { bob: Math.sin(ph) * 0.5, open: 0.15 + (f === 2 ? 0.4 : 0) };
  if (nm === "move") { const g = gait2(f, n, 4, 2.5); return { legs: g, bob: g.bob, open: 0.1 }; }
  if (nm === "wind") return { shear: 1.2 * t, open: 0.9 * t, lean: -2 * t };
  if (nm === "atk") return { shear: [0.9, 0.3, 0.9, 0.2][f], open: [0.9, 0, 0.9, 0][f], lean: 2.5 };
  if (nm === "spray") return { can: [0.3, 0.8, 1, 0.6][f], lean: -0.8 };
  if (nm === "rec") return { shear: 0.4 * (1 - t), lean: 1 - t };
  return { hurt: f === 0, lean: -2, open: 0.6 };
};
export const pxGardener = { fw: Math.round(64 * GDK), fh: Math.round(68 * GDK), w: 16, h: 28, anims: { idle: [4, 5], move: [6, 9], wind: [3, 9, !1], atk: [4, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], spray: [4, 8, !1] }, px: (nm, f, n) => gardenerFrame(GARD_P(nm, f, n)) };

// ════ 가시 화분 ════ 띠 무늬 테라코타 화분 · 이가 빠진 테두리 · 골이 진 선인장 몸에 수정 가시 · 꼭대기 수정 꽃 · 화분 속 두 눈
//   p: puff · flare · sway · duck · hurt
const PTK = 0.72;
function potFrame(p = {}) {
  const W = 50, H = 56, G = H - 1, S = sculpt(W, H, { k: PTK, ax: 25 });
  const pf = p.puff ?? 0, fl = p.flare ?? 0, sw = p.sway ?? 0, dk = p.duck ?? 0, cx = 25;
  // 선인장 (화분 뒤로 먼저: 화분이 앞)
  const top = G - 21 + dk * 14, bw = 8.4 + pf * 2;
  const body = U(ellR(cx + sw, top - 9, bw, 11 + pf), ellR(cx + sw * 1.6, top - 21 - pf, bw * 0.68, 7 + pf * 0.5));
  S.add(body, CACT, { z: 0, h: bw });
  for (const dx of [-5, 0, 5]) S.carve(capF([cx + sw * 1.3 + dx * 0.7, top - 26 - pf], [cx + sw + dx, top + 1], 0.6), 1);
  for (let k = 0; k < 12; k++) {
    const a = -Math.PI + (k / 11) * Math.PI, rr = k % 2 ? bw - 0.5 : bw * 0.7, base = [cx + sw + Math.cos(a) * rr, top - 9 + Math.sin(a) * (11 + pf) * (k % 2 ? 1 : 1.6)];
    base[1] < G - 21 && crys(S, base, pol(base, a, 3 + fl * 5), 1, CRY, { lift: 1 });
  }
  for (const d of [-0.9, -0.3, 0.3, 0.9]) crys(S, [cx + sw * 1.6, top - 27 - pf], pol([cx + sw * 1.6, top - 27 - pf], -Math.PI / 2 + d, 5 + fl * 2), 1.8, CRY, { lift: 2 });
  S.add(ellR(cx + sw * 1.6, top - 27 - pf, 2.2, 2.2), GLOWW, { lift: 3, h: 1.5 });
  // 흙
  S.add(ellR(cx, G - 21, 12, 2.6), SOIL, { z: 1, h: 1.5 });
  // 화분 몸 + 테두리 + 띠 무늬 + 금
  S.add(polyF([[cx - 12.5, G - 18], [cx + 12.5, G - 18], [cx + 10, G - 0.5], [cx - 10, G - 0.5]]), CLAY, { z: 3, h: 7, prof: "round" });
  S.add(U(polyF([[cx - 14.5, G - 23], [cx + 14.5, G - 23], [cx + 14.5, G - 17.5], [cx - 14.5, G - 17.5]])), CLAY, { z: 4, h: 4, prof: "flat" });
  S.carve(polyF([[cx + 8, G - 23.5], [cx + 11, G - 23.5], [cx + 10, G - 21]]), 1.5, !1);
  S.carve(capF([cx - 11, G - 11], [cx + 11, G - 11], 0.5), 0.6).carve(capF([cx - 10.5, G - 7], [cx + 10.5, G - 7], 0.5), 0.6);
  for (let k = 0; k < 6; k++) S.add(polyF([[cx - 9 + k * 3.6, G - 10.5], [cx - 7.2 + k * 3.6, G - 7.5], [cx - 5.4 + k * 3.6, G - 10.5]]), CLAYF, { on: 1, h: 0.5 });
  S.carve(capF([cx - 6, G - 17], [cx - 8, G - 12], 0.45), 1).carve(capF([cx - 8, G - 12], [cx - 6.5, G - 9], 0.45), 1);
  // 두 눈 (테두리 바로 밑, 화분 속 그늘에서 빛남)
  if (!p.hurt) for (const x of [cx + 2, cx + 7]) S.decal(x, G - 15, 0xffd060).decal(x + 0.5, G - 15.5, 0xffffff);
  return fin(S.render({ rim: !0 }), p);
}
const POT_P = (nm, f, n) => {
  const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
  if (nm === "idle" || nm === "move") return { sway: Math.sin(ph) * 0.8 };
  if (nm === "wind") return { puff: t, flare: 0.3 * t };
  if (nm === "atk") return { puff: 0.6, flare: [1, 1.3, 1.1][f] };
  if (nm === "rec") return { puff: 0.6 * (1 - t), flare: 1 - t };
  if (nm === "duck") return { duck: 0.85 };
  return { hurt: f === 0, sway: -1, duck: 0.3 };
};
export const pxPot = { fw: Math.round(50 * PTK), fh: Math.round(56 * PTK), w: 16, h: 24, anims: { idle: [4, 5], wind: [3, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], duck: [2, 8], move: [4, 5] }, px: (nm, f, n) => potFrame(POT_P(nm, f, n)) };

// ════ [정예] 온실 유리 골렘 ════ 이끼 낀 막돌 화분 다리 · 놋쇠 갈비뼈로 엮은 둥근 유리 온실 몸통(속에 덩굴·꽃·작은 나무) ·
//   지붕 꼭대기 등불 머리(외눈) · 어깨는 수정이 자라는 큰 화분 · 팔은 덩굴 감긴 수정 덩어리
//   p: bob · step · arm(0~1.4) · crouch · crack · throw · hurt
const GLK = 0.72;
function golemFrame(p = {}) {
  const W = 124, H = 112, G = H - 1, S = sculpt(W, H, { k: GLK, ax: 60 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 6, st = p.step ?? 0, ar = p.arm ?? 0, cr = p.crack ?? 0, cx = 60;
  // 다리: 막돌 화분 기둥 (먼 쪽 먼저)
  for (const [x, far, s] of [[cx - 12, 1, -st], [cx + 12, 0, st]]) {
    const M0 = far ? CLAYF : CLAY, top = 80 + b, lift = Math.max(0, s) * 0.8;
    S.add(polyF([[x - 9, top], [x + 9, top], [x + 10 + s, G - 0.5 - lift], [x - 10 + s, G - 0.5 - lift]]), M0, { z: far ? -3 : 4, h: 7, prof: "round" });
    S.add(polyF([[x - 11 + s * 0.6, G - 9 - lift], [x + 11 + s * 0.6, G - 9 - lift], [x + 11 + s, G - 0.5 - lift], [x - 11 + s, G - 0.5 - lift]]), M0, { z: far ? -2 : 5, h: 5, prof: "flat" });
    S.carve(capF([x - 8 + s * 0.3, 90 + b * 0.5], [x + 8 + s * 0.3, 90 + b * 0.5], 0.6), 0.8);
    S.add(ellR(x - 3 + s * 0.3, top + 2, 6, 2.4), LEAF, { on: 1, h: 0.8 });
    for (const d of [-5, 2, 6]) S.add(capF([x + d + s * 0.5, G - 9 - lift], [x + d - 1 + s * 0.6, G - 3 - lift], 0.9, 0.5), mat(ramp(0x6a5038), { tex: "wood" }), { on: 1, h: 0.6 });
  }
  // 먼 팔
  const shF = [cx - 22, 48 + b], hF = ar > 0.7 ? [cx - 30, 20 + b - (ar - 0.7) * 12] : [cx - 32 + ar * 2, 76 + b - ar * 40];
  S.add(capF(shF, hF, 6, 5), mat(rampF(0x7a7464), { tex: "stone", amp: 0.8 }), { z: -4, h: 5 });
  for (const d of [0.3, 0.6]) S.add(capF(lerp(shF, hF, d - 0.1), lerp(shF, hF, d + 0.1), 6.4, 6.4), LEAFF, { on: 1, h: 0.8 });
  crys(S, hF, pol(hF, ar > 0.7 ? -1.9 : 1.7, 14), 6, CRYF, { z: -3 }), crys(S, hF, pol(hF, ar > 0.7 ? -2.5 : 2.3, 10), 4.5, CRYF, { z: -3 });
  // 어깨 화분 (먼 쪽)
  S.add(polyF([[cx - 32, 40 + b], [cx - 16, 40 + b], [cx - 18, 52 + b], [cx - 30, 52 + b]]), CLAYF, { z: -2, h: 5 });
  crys(S, [cx - 26, 41 + b], [cx - 30, 28 + b], 3.4, CRYF, { z: -1 }), crys(S, [cx - 22, 41 + b], [cx - 21, 31 + b], 2.6, CRYF, { z: -1 });
  // 몸통: 둥근 유리 온실 (속 식물을 먼저 쌓고 유리를 위에 얇게 씌운다)
  const by0 = 30 + b, by1 = 82 + b, dome = U(ellR(cx, by0 + 16, 22, 20), polyF([[cx - 22, by0 + 16], [cx + 22, by0 + 16], [cx + 21, by1], [cx - 21, by1]]));
  S.add(dome, GLS, { z: 2, h: 14 });
  for (const [x, y, r, M0] of [[cx - 10, by1 - 9, 7, LEAFP], [cx + 6, by1 - 13, 8, LEAFP], [cx + 14, by1 - 7, 5, LEAFP], [cx - 4, by1 - 24, 6, LEAFP], [cx + 10, by1 - 28, 5, LEAFP]]) S.add(ellR(x, y, r, r * 0.8), M0, { on: 1, lift: 0.3, h: 1.4 });
  S.add(capF([cx - 2, by1 - 4], [cx - 1, by1 - 26], 1.4, 0.9), mat(ramp(mixc(0x6a5038, 0xa8ccd2, 0.4)), { tex: "wood" }), { on: 1, lift: 0.4, h: 0.8 });
  for (const [x, y] of [[cx - 8, by1 - 14], [cx + 4, by1 - 18], [cx + 12, by1 - 10], [cx - 5, by1 - 28], [cx + 8, by1 - 32]]) S.add(ellR(x, y, 1.4, 1.4), mat(ramp(mixc(0xd87aa0, 0xa8ccd2, 0.3))), { on: 1, lift: 0.6, h: 0.6 });
  // 놋쇠 갈비뼈 (세로 넷 + 가로 둘) · 바닥 테
  for (const dx of [-14, -5, 5, 14]) S.add(capF([cx + dx * 0.55, by0 - 2], [cx + dx * 1.45, by1], 1.1), BRASS, { on: 1, lift: 0.8, h: 1 });
  for (const y of [by0 + 18, by0 + 36]) S.add(capF([cx - 21, y], [cx + 21, y], 1), BRASS, { on: 1, lift: 0.8, h: 1 });
  S.add(polyF([[cx - 23, by1 - 4], [cx + 23, by1 - 4], [cx + 22, by1 + 1], [cx - 22, by1 + 1]]), BRASS, { z: 6, h: 2.5, prof: "flat" });
  for (let k = 0; k < 7; k++) S.add(ellR(cx - 18 + k * 6, by1 - 1.5, 0.9, 0.9), BRASS, { on: 1, h: 0.6 });
  if (cr > 0) S.carve(capF([cx + 12, by0 + 8], [cx + 8, by0 + 16], 0.5), 1.2, !1).carve(capF([cx + 8, by0 + 16], [cx + 13, by0 + 22], 0.5), 1.2, !1);
  // 머리: 꼭대기 등불 (놋쇠 갓 + 빛나는 외눈 + 꼭지)
  const hx = cx + 2, hy = by0 - 6;
  S.add(ellR(hx, hy + 3, 7, 3), BRASS, { z: 8, h: 3 });
  S.add(ellR(hx, hy - 2, 5.4, 5), BRASS, { z: 8, h: 5 });
  S.add(ellR(hx + 2, hy - 2, 3.2, 3), p.hurt ? BRASS : GLOWW, { lift: 1, h: 1.5 });
  S.add(capF([hx, hy - 7], [hx, hy - 11], 1, 0.6), BRASS, { lift: 1, h: 1 });
  !p.hurt && S.decal(hx + 2.5, hy - 2, 0x5a3a20);
  // 어깨 화분 (가까운 쪽) + 수정
  S.add(polyF([[cx + 16, 40 + b], [cx + 32, 40 + b], [cx + 30, 52 + b], [cx + 18, 52 + b]]), CLAY, { z: 9, h: 5 });
  S.carve(capF([cx + 17, 45 + b], [cx + 31, 45 + b], 0.5), 0.6);
  crys(S, [cx + 22, 41 + b], [cx + 19, 26 + b], 3.6, CRY, { z: 10 }), crys(S, [cx + 27, 41 + b], [cx + 31, 30 + b], 2.8, CRY, { z: 10 });
  S.add(ellR(cx + 24, 40.5 + b, 6, 1.6), LEAF, { z: 10.5, h: 1 });
  // 가까운 팔
  const shN = [cx + 24, 50 + b], tN = p.throw ?? 0;
  const hN = tN > 0 ? pol(shN, -2.6 + tN * 2.4, 28) : ar > 0.7 ? [cx + 32, 18 + b - (ar - 0.7) * 12] : [cx + 34 + ar * 2, 76 + b - ar * 40];
  S.add(capF(shN, hN, 6.4, 5.4), mat(ramp(0x8a8474), { tex: "stone", amp: 0.8 }), { z: 11, h: 5.5 });
  for (const d of [0.3, 0.6]) S.add(capF(lerp(shN, hN, d - 0.12), lerp(shN, hN, d + 0.12), 6.8, 6.8), LEAF, { on: 1, h: 0.9 });
  const ga = tN > 0 ? -0.6 : ar > 0.7 ? -1.3 : 1.5;
  crys(S, hN, pol(hN, ga, 15), 6.4, CRY, { z: 12 }), crys(S, hN, pol(hN, ga + 0.7, 10), 4.4, CRY, { z: 12 }), crys(S, hN, pol(hN, ga - 0.7, 9), 4, CRY, { z: 12 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxGolem = {
  fw: Math.round(124 * GLK), fh: Math.round(112 * GLK), w: 32, h: 50,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], throw: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.7 };
    if (nm === "move") P = { step: Math.sin(ph) * 5, bob: -Math.abs(Math.sin(ph)) * 2 };
    if (nm === "wind") P = { arm: 1.4 * t, crouch: -0.2 * t };
    if (nm === "atk") P = { arm: [0.6, 0.1, 0][f], crouch: 0.8 };
    if (nm === "rec") P = { arm: 0.2 * (1 - t), crouch: 0.6 * (1 - t) };
    if (nm === "throw") P = { throw: [0.05, 0.4, 1, 1.2][f], crouch: 0.2 };
    if (nm === "hurt") P = { hurt: f === 0, crack: 1, crouch: 0.3 };
    return golemFrame(P);
  },
};

// ════ 수정 날개 나방 ════ 보송한 연보라 털 몸 · 큰 겹눈 · 깃털 더듬이 · 잎맥 무늬 수정 날개(빛나는 눈알 무늬)
//   p: flap(-1~1) · tilt · dust · hurt
const MOK = 0.7;
function mothFrame(p = {}) {
  const W = 66, H = 56, S = sculpt(W, H, { k: MOK, ax: 32 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cx = 30, cy = 32;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 날개: 앞날개는 뿌리에서 끝으로 넓어지는 둥근 잎꼴(타원 둘), 뒷날개는 작은 둥근 부채. up 1 = 위로, -1 = 아래로
  const wing = (back) => {
    const up = fl * (back ? 0.8 : 1) + (back ? 0.15 : 0), dx = back ? -4 : 0, M0 = back ? CRYF : CRY;
    const root = R(cx + 1 + dx, cy - 2), ang = -Math.PI / 2 - 0.55 + (1 - up) * 0.75, tip = pol(root, ang, 21), mid = lerp(root, tip, 0.6);
    S.add(U(ellR(mid[0], mid[1], 12, 7.4, ang), ellR(...lerp(root, tip, 0.3), 7, 5, ang)), M0, { z: back ? -4 : 6, h: 3, prof: "flat" });
    const ang2 = ang - 0.9, hm = pol(root, ang2 + Math.PI * 0.1, 8);
    S.add(ellR(hm[0] - 2, hm[1] + 3, 8, 5.4, ang2), back ? CRYF : mat(ramp(0x9a8ac4), { tex: "crystal", amp: 0.7 }), { z: back ? -5 : 5, h: 2.5, prof: "flat" });
    if (!back) {
      for (const q of [-0.45, 0, 0.45]) S.carve(capF(root, pol(root, ang + q * 0.5, 17), 0.45), 0.7);
      const e = pol(root, ang - 0.15, 13);
      S.add(ellR(e[0], e[1], 3.4, 3), GLOW, { on: 1, lift: 0.4, h: 0.8 });
      S.decal(e[0], e[1], 0x3a2a50).decal(e[0] - 1, e[1] - 1, 0xffffff);
      S.add(ellR(...pol(root, ang, 19.5), 2.6, 1.6, ang), mat(ramp(0x6a5a8a)), { on: 1, h: 0.4 });
    }
  };
  wing(1);
  // 몸 (털 마디 셋 · 배 줄무늬)
  S.add(U(ellR(...R(cx + 4, cy), 6.4, 6), ellR(...R(cx - 4, cy + 2), 7.4, 4.8), ellR(...R(cx - 12, cy + 3.5), 4.6, 3.4)), FUR, { z: 2, h: 5 });
  for (const d of [-9, -5, -1]) S.carve(capF(R(cx + d, cy - 2), R(cx + d - 0.5, cy + 6), 0.5), 0.6);
  for (const d of [0, 4]) S.add(capF(R(cx + d, cy + 5), R(cx + d + 1.5, cy + 10), 0.6), FURF, { z: 1, h: 0.6 });
  // 머리 + 겹눈 + 깃털 더듬이
  const hd = R(cx + 12, cy - 1);
  S.add(ellR(hd[0], hd[1], 4.8, 4.6), FUR, { z: 4, h: 4.4 });
  S.add(ellR(hd[0] + 2.2, hd[1] - 0.2, 2.4, 2.6), mat(ramp(0x3a2c4a), { spec: 0.6 }), { lift: 1, h: 1.6 });
  for (const s2 of [0, 1]) {
    const a0 = [hd[0] + 1.5, hd[1] - 3.5], a1 = [hd[0] + 7 + s2 * 3, hd[1] - 13 + s2 * 1.5];
    S.add(capF(a0, a1, 0.6, 0.4), FURF, { z: 3 + s2, h: 0.6 });
    for (let k = 1; k < 5; k++) { const q = lerp(a0, a1, k / 5); S.add(capF(q, [q[0] + 2, q[1] + 1.5], 0.45, 0.3), FURF, { z: 3 + s2, h: 0.4 }); }
  }
  !p.hurt && S.decal(hd[0] + 1.6, hd[1] - 1, 0xffffff);
  wing(0);
  const C = S.render({ rim: !0 });
  p.dust && [[cx - 8, cy + 14], [cx - 2, cy + 17], [cx + 3, cy + 14], [cx - 12, cy + 18], [cx + 6, cy + 19], [cx - 5, cy + 21]].forEach(([x, y]) => C.px(Math.round(W * MOK / 2 + (x - 32) * MOK), Math.round(y * MOK), 0xf0e0ff));
  return fin(C, p);
}
export const pxMoth = {
  fw: Math.round(66 * MOK), fh: Math.round(56 * MOK), w: 18, h: 16, flying: !0,
  anims: { idle: [4, 12], move: [4, 14], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.3, -1, 0.3][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t };
    if (nm === "atk") P = { flap: [-1, 1, -1][f], dust: 1, tilt: 0.2 };
    if (nm === "rec") P = { flap: fl, dust: f < 1 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return mothFrame(P);
  },
};

// ════ 유리 벌 ════ 털 난 검은 가슴 · 호박빛 꿀이 비치는 유리 배(검은 띠) · 큰 겹눈 · 수정 침 · 반투명 날개
//   p: flap · tilt · sting · hurt
const BEK = 0.7;
function beeFrame(p = {}) {
  const W = 58, H = 50, S = sculpt(W, H, { k: BEK, ax: 29 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cx = 30, cy = 27, sg = p.sting ?? 0;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 배 (꿀 유리 + 띠) + 침
  crys(S, R(cx - 18, cy + 4), R(cx - 25 - sg * 5, cy + 8 + sg * 4), 1.8, CRY, { z: 0 });
  S.add(ellR(...R(cx - 9, cy + 3), 11, 7.4), AMB, { z: 1, h: 7 });
  for (const d of [-14, -9, -4]) S.add(capF(R(cx + d, cy - 4), R(cx + d - 1, cy + 10), 1.1), FURD, { on: 1, h: 0.6 });
  S.add(ellR(...R(cx - 7, cy - 1), 3, 1.6), mat(rampGlow(0xffd890)), { on: 1, lift: 0.5, h: 0.5 });
  // 다리
  for (const d of [-2, 2, 5]) S.add(capF(R(cx + d, cy + 5), R(cx + d - 1, cy + 11), 0.7, 0.5), FURD, { z: 0.5, h: 0.6 });
  // 가슴 (털) + 머리 + 겹눈 + 더듬이
  S.add(ellR(...R(cx + 3, cy), 6.4, 6), FURD, { z: 3, h: 5.5 });
  S.add(ellR(...R(cx + 3, cy - 3.5), 4.6, 2.4), mat(ramp(0xc89a50), { tex: "fur", amp: 1, dir: 1.57 }), { on: 1, h: 0.8 });
  const hd = R(cx + 11, cy + 1);
  S.add(ellR(hd[0], hd[1], 4.8, 4.6), FURD, { z: 4, h: 4.4 });
  S.add(ellR(hd[0] + 1.6, hd[1] - 0.6, 2.8, 3.4), mat(ramp(0x6a4a2a), { spec: 0.6 }), { lift: 1, h: 1.6 });
  for (const s2 of [0, 1]) S.add(capF([hd[0] + 2, hd[1] - 4], [hd[0] + 5 + s2 * 2, hd[1] - 10 + s2], 0.5), FURD, { z: 3 + s2, h: 0.5 });
  const C = S.render({ rim: !0 });
  // 날개 (반투명)
  const PX = (x, y) => [W * BEK / 2 + (x - 29) * BEK, H * BEK + (y - H) * BEK];
  for (const [dx, back] of [[-3, 1], [1, 0]]) {
    const c0 = PX(...R(cx + dx, cy - 11 - fl * 4));
    glass(C, ellR(c0[0], c0[1], 7.4, 3.4, -0.4 - fl * 0.4), back ? 0.3 : 0.05, !!back);
  }
  !p.hurt && C.px(Math.round(PX(...hd)[0] + 1), Math.round(PX(...hd)[1] - 1), 0xffffff);
  return fin(C, p);
}
export const pxBee = {
  fw: Math.round(58 * BEK), fh: Math.round(50 * BEK), w: 16, h: 14, flying: !0,
  anims: { idle: [4, 18], move: [4, 20], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, -0.6, 1, -0.6][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.2 };
    if (nm === "wind") P = { flap: fl, tilt: -0.5 * t, sting: 0.3 * t };
    if (nm === "atk") P = { flap: fl, tilt: 0.6, sting: 1 };
    if (nm === "rec") P = { flap: fl, sting: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.5 };
    return beeFrame(P);
  },
};

// ════ 유리 덩굴 ════ 흙 속 덩이줄기에서 마디진 덩굴이 솟는다. 마디마다 잎과 유리 가시, 끝에 빛나는 수정 꽃봉오리
//   p: rise(0~1) · lash(-1~1.4) · hurt
const VNK = 0.72;
function vineFrame(p = {}) {
  const W = 58, H = 66, G = H - 1, S = sculpt(W, H, { k: VNK, ax: 26 });
  const rs = p.rise ?? 1, ls = p.lash ?? 0, cx = 22;
  // 흙 둔덕 + 덩이줄기
  S.add(ellR(cx, G - 1, 14, 3.6), SOIL, { z: 0, h: 2 });
  S.add(ellR(cx, G - 3, 8, 4), mat(ramp(0x8a6a48), { tex: "skin", amp: 0.8 }), { z: 1, h: 3.5 });
  if (rs > 0.1) {
    let pt = [cx, G - 5], a = -Math.PI / 2;
    const pts = [pt];
    for (let k = 0; k < 7; k++) { a += (ls * 0.3 + (ls < 0 ? -0.05 : 0.02)) * (k / 3 + 0.4); pt = pol(pt, a, 7.4 * rs); pts.push(pt); }
    for (let k = 0; k < 7; k++) S.add(capF(pts[k], pts[k + 1], 3.8 - k * 0.38, 3.4 - k * 0.38), k % 2 ? STEM : mat(ramp(0x7a9c5c), { tex: "skin", amp: 0.7 }), { z: 2 + k * 0.3, h: 3 - k * 0.3 });
    for (let k = 1; k < 7; k++) { const q = pts[k]; S.add(ellR(q[0], q[1], 4 - k * 0.3, 1.6, a), STEM, { blend: 1, h: 0.6 }); }
    for (let k = 1; k < 7; k += 2) { const q = pts[k]; crys(S, q, pol(q, a - 1.4 + k * 0.08, 4.5), 1.2, CRY, { lift: 1 }); S.add(ellR(...pol(q, a + 1.6, 4), 4, 1.8, a + 1.2), LEAF, { lift: 1.5, h: 1.2 }); }
    const tip = pts[7];
    for (const d of [-0.8, -0.25, 0.3, 0.85]) crys(S, tip, pol(tip, a + d, 7), 2, d < 0 ? CRYF : CRY, { lift: 2 });
    S.add(ellR(tip[0], tip[1], 2.8, 2.8), GLOW, { lift: 3, h: 1.6 });
  }
  // 바닥 잎
  for (const [x, an, M0] of [[cx - 10, -2.6, LEAFF], [cx - 6, -2.1, LEAF], [cx + 6, -1.0, LEAF], [cx + 10, -0.5, LEAFF]]) S.add(ellR(...pol([x, G - 4], an, 4), 5.4, 2, an), M0, { lift: 2, h: 1.4 });
  return fin(S.render({ rim: !0 }), p);
}
const VINE_P = (nm, f, n) => {
  const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
  if (nm === "idle" || nm === "move") return { rise: 1, lash: Math.sin(ph) * 0.25 };
  if (nm === "hide") return { rise: 0 };
  if (nm === "rise") return { rise: 0.3 + 0.7 * t, lash: -0.3 * (1 - t) };
  if (nm === "wind") return { lash: -1 * t };
  if (nm === "atk") return { lash: [0.6, 1.3, 1.4][f] };
  if (nm === "rec") return { lash: 1.2 * (1 - t) };
  return { hurt: f === 0, lash: -0.5 };
};
export const pxVine = { fw: Math.round(58 * VNK), fh: Math.round(66 * VNK), w: 14, h: 22, anims: { idle: [4, 6], hide: [2, 5], rise: [3, 12, !1], wind: [3, 9, !1], atk: [3, 18, !1], rec: [3, 9, !1], hurt: [2, 10, !1], move: [4, 6] }, px: (nm, f, n) => vineFrame(VINE_P(nm, f, n)) };

// ════ [정예] 거대 파리지옥 ════ 뿌리가 드러난 흙 둔덕 · 넓은 잎 받침 · 골이 꼬인 굵은 줄기 ·
//   두 장의 턱(겉은 잎맥 초록, 속은 붉은 살과 점, 가장자리 수정 이빨) · 옆에 작은 덫 봉오리
//   p: open(0~1.2) · lunge · sway · spit · hurt
const FTK = 0.72;
function flytrapFrame(p = {}) {
  const W = 126, H = 104, G = H - 1, S = sculpt(W, H, { k: FTK, ax: 56 });
  const op = p.open ?? 0.2, lg = p.lunge ?? 0, sw = p.sway ?? 0, cx = 52;
  // 흙 둔덕 + 드러난 뿌리
  S.add(ellR(cx, G - 2, 30, 6), SOIL, { z: 0, h: 4 });
  for (const [x, d] of [[cx - 22, -1], [cx - 12, -0.5], [cx + 14, 0.5], [cx + 24, 1]]) S.add(capF([x, G - 5], [x + d * 8, G - 1], 1.6, 0.8), mat(ramp(0x7a5a40), { tex: "wood" }), { z: 3, h: 1.4 });
  // 뒤 잎 받침
  for (const [x, an, s] of [[cx - 16, -2.7, 1], [cx + 18, -0.45, 1]]) { const c0 = pol([x, G - 6], an, 10 * s); S.add(ellR(c0[0], c0[1], 13 * s, 4.6 * s, an), LEAFF, { z: 1, h: 3 }); S.carve(capF(pol(c0, an, -10), pol(c0, an, 10), 0.5), 0.7); }
  // 작은 덫 봉오리 (옆)
  const bb = [cx - 26, G - 26];
  S.add(capF([cx - 18, G - 6], bb, 2.4, 2), STEMF, { z: 1, h: 2 });
  S.add(ellR(bb[0], bb[1] - 3, 5, 6, -0.3), mat(ramp(0x7aa064), { tex: "leaf" }), { z: 2, h: 4 });
  S.carve(capF([bb[0] - 1, bb[1] - 9], [bb[0] + 1, bb[1] + 2], 0.5), 1, !1);
  // 줄기 (S자 · 꼬인 골)
  const s0 = [cx, G - 7], s1 = [cx - 3 + sw + lg * 8, G - 34], s2 = [cx + 6 + sw * 1.4 + lg * 22, G - 56 + lg * 6];
  S.add(U(capF(s0, s1, 7, 6), capF(s1, s2, 6, 5)), STEM, { z: 3, h: 6 });
  for (let k = 0; k < 7; k++) { const q = k < 4 ? lerp(s0, s1, k / 4 + 0.1) : lerp(s1, s2, (k - 4) / 3 + 0.1); S.carve(capF([q[0] - 5, q[1] - 2], [q[0] + 5, q[1] + 3], 0.5), 0.8); }
  // 앞 잎 받침
  for (const [x, an, s] of [[cx - 8, -2.2, 0.9], [cx + 10, -0.9, 0.95]]) { const c0 = pol([x, G - 6], an, 9 * s); S.add(ellR(c0[0], c0[1], 12 * s, 4.2 * s, an), LEAF, { z: 5, h: 3 }); S.carve(capF(pol(c0, an, -9), pol(c0, an, 9), 0.5), 0.7); }
  // 턱 (아래 → 위)
  const hx = s2[0], hy = s2[1], A = 0.2 + lg * 0.2;
  const jaw = (up) => {
    const a = A + (up ? -op * 0.55 : op * 0.45), c = Math.cos(a), s = Math.sin(a), Q = (x, y) => { const yy = up ? -y : y; return [hx + x * c - yy * s, hy + x * s + yy * c]; };
    S.add(polyF([Q(0, 0), Q(8, 11), Q(22, 13.5), Q(35, 9), Q(41, 2), Q(40, 0)]), mat(ramp(up ? 0x78a45e : 0x689250), { tex: "leaf", amp: 0.8 }), { z: up ? 8 : 6, h: 6 });
    for (const q of [0.3, 0.55, 0.8]) S.carve(capF(Q(4, 2), Q(40 * q, 11 * (1 - Math.abs(q - 0.5))), 0.5), 0.6);
    S.add(polyF([Q(4, 1.4), Q(11, 8), Q(22, 10), Q(33, 6), Q(38, 1.4)]), RED, { on: 1, lift: up ? 0.6 : 0.2, h: 1 });
    for (const [x, y] of [[14, 5], [21, 6], [27, 4.6], [17, 3]]) S.add(ellR(...Q(x, y), 1, 0.8), mat(ramp(0xe0a0a0)), { on: 1, h: 0.3 });
    for (let k = 0; k < 9; k++) crys(S, Q(5 + k * 4, 0.8), Q(6 + k * 4, -4.6 + (k % 2) * 1.2), 0.9, CRY, { z: up ? 9 : 7 });
  };
  jaw(0), jaw(1);
  S.add(ellR(hx, hy, 5.4, 5.4), STEM, { z: 10, h: 4.4 });
  const C = S.render({ rim: !0 });
  p.spit && [[hx + 40, hy - 4], [hx + 45, hy - 7], [hx + 43, hy - 1]].forEach(([x, y]) => C.px(Math.round(W * FTK / 2 + (x - 56) * FTK), Math.round(H * FTK + (y - H) * FTK), 0xd8c890));
  return fin(C, p);
}
export const pxFlytrap = {
  fw: Math.round(126 * FTK), fh: Math.round(104 * FTK), w: 30, h: 42,
  anims: { idle: [4, 5], move: [4, 5], wind: [3, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], spit: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle" || nm === "move") P = { open: 0.25 + Math.sin(ph) * 0.1, sway: Math.sin(ph) * 1.5 };
    if (nm === "wind") P = { open: 1.2 * t, sway: -3 * t };
    if (nm === "atk") P = { open: [0.6, 0, 0][f], lunge: [0.8, 1, 0.9][f] };
    if (nm === "rec") P = { open: 0.25 * t, lunge: 0.8 * (1 - t) };
    if (nm === "spit") P = { open: [0.5, 1, 0.3, 0.3][f], lunge: [0, 0.4, 0.2, 0][f], spit: f === 2 };
    if (nm === "hurt") P = { hurt: f === 0, open: 0.8, sway: -3 };
    return flytrapFrame(P);
  },
};

// ════ 프리즘 정령 ════ 깎은 세모 기둥 결정 · 속에 갇힌 따뜻한 빛(두 눈 틈) · 둘레를 도는 작은 결정 셋 · 아래로 흩어지는 빛 알갱이
//   p: glow · spin · tilt · hurt
const PRK = 0.72;
function prismFrame(p = {}) {
  const W = 50, H = 62, S = sculpt(W, H, { k: PRK, ax: 25 });
  const gl = p.glow ?? 0.5, sp = p.spin ?? 0, cx = 25, cy = 30, tl = p.tilt ?? 0;
  const R = (x, y) => { const c = Math.cos(tl * 0.3), s = Math.sin(tl * 0.3), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const orb = (front) => { for (let k = 0; k < 3; k++) { const a = sp + k * 2.09, x = cx + Math.cos(a) * 18, y = cy + 4 + Math.sin(a) * 5; (Math.sin(a) >= 0) === front && crys(S, [x, y + 4], [x, y - 4], 2, front ? CRY : CRYF, { z: front ? 12 : -4 }); } };
  orb(!1);
  // 세 면 (각진 결정, 위 뾰족 · 아래 짧게 뾰족)
  S.add(polyF([R(cx, cy - 24), R(cx - 11, cy + 10), R(cx - 2, cy + 20), R(cx + 9, cy + 14), R(cx + 12, cy + 6)]), CRY, { z: 2, h: 8, prof: "sharp" });
  S.carve(capF(R(cx, cy - 23), R(cx - 2, cy + 19), 0.5), 1, !1).carve(capF(R(cx, cy - 23), R(cx + 9, cy + 13), 0.4), 0.7, !1);
  S.add(ellR(...R(cx - 1, cy + 2), 3 + gl * 1.4, 4.6 + gl * 1.6), GLOWW, { on: 1, lift: 0.3, h: 1 });
  if (!p.hurt) for (const dx of [-3, 2]) S.decal(...R(cx + dx, cy + 1), 0x5a3a7a);
  orb(!0);
  const C = S.render({ rim: !0 });
  gl > 0.9 && [[cx - 11, cy + 10], [cx + 9, cy + 14]].forEach(([x, y], i) => C.px(Math.round(W * PRK / 2 + (x - 25) * PRK), Math.round(H * PRK + (y - H) * PRK), i ? 0xa0ffc0 : 0xffa0a0));
  [[cx - 3, cy + 26], [cx + 2, cy + 29], [cx - 1, cy + 33]].forEach(([x, y], i) => ((Math.floor(sp * 2) + i) % 3) && C.px(Math.round(W * PRK / 2 + (x - 25) * PRK), Math.round(H * PRK + (y - H) * PRK), 0xf0e0ff));
  return fin(C, p);
}
export const pxPrism = {
  fw: Math.round(50 * PRK), fh: Math.round(62 * PRK), w: 16, h: 26, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [4, 8, !1], atk: [2, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), sp = (f / n) * T2;
    let P = { spin: sp, glow: 0.5 + Math.sin(sp) * 0.2 };
    if (nm === "move") P.tilt = 0.3;
    if (nm === "wind") P = { spin: sp * 2, glow: 0.6 + t * 0.5, tilt: -0.2 };
    if (nm === "atk") P = { spin: sp, glow: 1.2 };
    if (nm === "rec") P = { spin: sp, glow: 1 - t * 0.5 };
    if (nm === "hurt") P = { hurt: f === 0, glow: 0.2, tilt: 0.5 };
    return prismFrame(P);
  },
};

// ════ 벌새 떼 ════ 무지갯빛(초록·청·자주) 깃 · 붉은 목 · 바늘 부리 · 흐릿한 날개 잔상 — 셋이 함께 다닌다
//   p: ph · spread · dash · hurt
const HMK = 0.72;
function hummerFrame(p = {}) {
  const W = 62, H = 44, S = sculpt(W, H, { k: HMK, ax: 31 });
  const sp = p.spread ?? 1, ds = p.dash ?? 0, birds = [[18 - sp * 3, 16 - sp * 4, 0x3a8a6a, -2], [44 + sp * 3, 14 - sp, 0x4a6aa8, -1], [31, 27 + sp * 3, 0x7a4a9a, 2]];
  const wings = [];
  for (const [x, y, c, z] of birds) {
    const a = ds * 0.5, R = (u, v) => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)], M0 = IRID(c);
    S.add(U(ellR(...R(0, 0), 5, 3.4), capF(R(-4, 0.8), R(-10, 3.4), 2, 0.8)), M0, { z, h: 3 });
    S.add(ellR(...R(4.5, -1.6), 3, 2.8), M0, { z: z + 1, h: 2.6 });
    S.add(ellR(...R(2, 1.6), 2.6, 1.4), mat(ramp(0xc83a52), { spec: 0.5 }), { on: 1, h: 0.5 });
    S.add(capF(R(6.6, -1.4), R(13, -0.6 + ds), 0.5, 0.3), mat(ramp(0x2a2024)), { z: z + 1, h: 0.4 });
    !p.hurt && S.decal(...R(5, -2.4), 0x101010);
    wings.push([...R(-1, -4), z]);
  }
  const C = S.render({ rim: !0 });
  for (const [wx, wy, z] of wings) { const fl = Math.sin((p.ph ?? 0) * T2 + wx), PX = [W * HMK / 2 + (wx - 31) * HMK, H * HMK + (wy - H) * HMK]; glass(C, ellR(PX[0], PX[1] - fl * 1.6, 4, 1.6, -0.4 - fl * 0.5), z < 0 ? 0.3 : 0.05, z < 0); }
  return fin(C, p);
}
export const pxHummer = {
  fw: Math.round(62 * HMK), fh: Math.round(44 * HMK), w: 22, h: 12, flying: !0,
  anims: { idle: [4, 20], move: [4, 22], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1);
    let P = { ph: f / n, spread: 1 + Math.sin((f / n) * T2) * 0.3 };
    if (nm === "wind") P = { ph: f / n, spread: 1.4 * (1 - t) + 0.2, dash: -0.3 * t };
    if (nm === "atk") P = { ph: f / n, spread: 0.2, dash: 0.5 };
    if (nm === "rec") P = { ph: f / n, spread: 0.2 + t };
    if (nm === "hurt") P = { hurt: f === 0, ph: 0.25, spread: 1.6 };
    return hummerFrame(P);
  },
};

// ════ 파편 정령 ════ 빛나는 핵 둘레를 깨진 유리·수정 조각이 돈다. 모이면 단단해지고, 흩어지며 조각을 쏜다
//   p: spin · burst · glow · hurt
const SHK = 0.72;
function shardFrame(p = {}) {
  const W = 54, H = 56, S = sculpt(W, H, { k: SHK, ax: 27 });
  const sp = p.spin ?? 0, bs = p.burst ?? 0, gl = p.glow ?? 0.6, cx = 27, cy = 28;
  for (let k = 0; k < 9; k++) {
    const a = sp + (k / 9) * T2, r = 11 + (k % 3) * 2 + bs * 8, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.85;
    if (Math.sin(a) >= 0) continue;
    const dir = a + 1.2 + (k % 2) * 0.8, len = 6 + (k % 3) * 1.5;
    crys(S, pol([x, y], dir, -len / 2), pol([x, y], dir, len / 2), 1.8 + (k % 2) * 0.6, k % 2 ? GLSF : CRYF, { z: -3 });
  }
  S.add(ellR(cx, cy, 5 + gl, 5 + gl), GLOW, { z: 2, h: 4 });
  S.add(ellR(cx - 1.5, cy - 1.5, 2, 2), GLOWW, { lift: 1, h: 1 });
  for (let k = 0; k < 9; k++) {
    const a = sp + (k / 9) * T2, r = 11 + (k % 3) * 2 + bs * 8, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.85;
    if (Math.sin(a) < 0) continue;
    const dir = a + 1.2 + (k % 2) * 0.8, len = 6 + (k % 3) * 1.5;
    crys(S, pol([x, y], dir, -len / 2), pol([x, y], dir, len / 2), 1.8 + (k % 2) * 0.6, k % 2 ? GLS : CRY, { z: 8 });
  }
  return fin(S.render({ rim: !0 }), p);
}
export const pxShard = {
  fw: Math.round(54 * SHK), fh: Math.round(56 * SHK), w: 16, h: 18, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), sp = (f / n) * T2;
    let P = { spin: sp, glow: 0.6 + Math.sin(sp) * 0.2 };
    if (nm === "wind") P = { spin: sp * 1.5, burst: -0.4 * t, glow: 1 };
    if (nm === "atk") P = { spin: sp, burst: [0.6, 1.2, 1.4][f], glow: 1.2 };
    if (nm === "rec") P = { spin: sp, burst: 1.2 * (1 - t), glow: 0.8 };
    if (nm === "hurt") P = { hurt: f === 0, burst: 0.4, glow: 0.2 };
    return shardFrame(P);
  },
};

// ════ [정예] 수정 공작 ════ 깃털 결이 보이는 청보라 몸 · 비늘 진 청록 긴 목 · 흰 눈 무늬 · 끝이 수정인 볏 셋 ·
//   꼬리깃(깃대 + 깃 + 끝의 수정 눈알): 접으면 뒤로 길게 끌리고, 펴면 몸 뒤로 큰 부채
//   p: fan(0~1) · neck · legs · bob · wing · hurt
const PCK = 0.7;
function peacockFrame(p = {}) {
  const W = 132, H = 112, G = H - 1, S = sculpt(W, H, { k: PCK, ax: 60 });
  const fn = p.fan ?? 0, nk = p.neck ?? 0, b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, wg = p.wing ?? 0;
  // 꼬리깃
  const tb = [50, 68 + b], N = 11;
  for (let k = 0; k < N; k++) {
    const u = k / (N - 1), a = fn > 0.3 ? -Math.PI * (0.18 + u * 0.82 * fn) - (1 - fn) * 0.12 : Math.PI - 0.32 + u * 0.38, len = fn > 0.3 ? 34 + Math.sin(u * Math.PI) * 14 : 30 + Math.sin(u * Math.PI) * 18 + u * 6;
    const tip = pol(tb, a, len), mid = pol(tb, a, len * 0.55), z = fn > 0.3 ? -8 + Math.abs(u - 0.5) : -6 + u;
    S.add(U(ellR(...lerp(tb, tip, 0.56), fn > 0.3 ? 4.2 : 3.4, len * 0.46, a + Math.PI / 2), ellR(...tip, 4.8, 5.4, a + Math.PI / 2)), k % 2 ? PEAF : mat(ramp(0x3e7a70), { tex: "feather", amp: 0.9, dir: a }), { z: z + 0.5, h: 2 });
    crys(S, pol(tip, a, -3), pol(tip, a, 4), 2.4, k % 2 ? CRYF : CRY, { z: z + 1.5 });
    S.add(ellR(...pol(tip, a, -0.5), 1.6, 1.6), GLOW, { z: z + 2.5, h: 1 });
  }
  // 다리 (비늘)
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) {
    const hp = [62 + (far ? -4 : 3), 80 + b], ft = [hp[0] + o[0] + 3, G - 2 - o[1]], kn = ik(hp, ft, 12, 12, -1), M0 = far ? LEGF : LEG;
    S.add(U(capF(hp, kn, 2.4, 1.8), capF(kn, ft, 1.8, 1.5)), M0, { z: far ? -2 : 6, h: 2 });
    for (const d of [[5, 0], [3, 1.4], [-3, 0.6]]) S.add(capF(ft, [ft[0] + d[0], ft[1] + d[1]], 0.9, 0.5), M0, { z: far ? -1.5 : 6.5, h: 0.8 });
  }
  // 몸통 + 날개
  S.add(ellR(64, 70 + b, 18, 13), PEA, { z: 2, h: 11 });
  S.add(ellR(58 - wg * 3, 67 + b - wg * 8, 15, 8.4, -0.2 - wg * 0.6), mat(ramp(0x5a6a9a), { tex: "feather", amp: 1, dir: -0.3 }), { z: 6, h: 4 });
  for (let k = 0; k < 5; k++) S.carve(capF([50 - wg * 3 + k * 4, 68 + b - wg * 7], [47 - wg * 3 + k * 4, 74 + b - wg * 6], 0.5), 0.7);
  // 목 + 머리 + 볏
  const n0 = [74, 62 + b], n1 = [80 + nk * 10, 44 + b + nk * 5], hd = [84 + nk * 16, 30 + b + nk * 10];
  S.add(U(capF(n0, n1, 6, 4.6), capF(n1, hd, 4.6, 4)), mat(ramp(0x3e8a86), { tex: "scale", amp: 0.9 }), { z: 7, h: 4.6 });
  S.add(ellR(hd[0], hd[1], 5.8, 5), TEAL, { z: 8, h: 5 });
  for (const d of [-1.25, -0.7, -0.15]) { const q = pol(hd, -Math.PI / 2 + d, 9); S.add(capF([hd[0] - 1, hd[1] - 4], q, 0.6, 0.4), TEAL, { z: 7.5, h: 0.6 }); crys(S, [q[0], q[1] + 2], [q[0], q[1] - 3], 1.6, CRY, { z: 8 }); }
  S.add(polyF([[hd[0] + 4.6, hd[1] - 1.4], [hd[0] + 12 + nk * 2, hd[1] + 1], [hd[0] + 4.6, hd[1] + 2]]), BEAK, { z: 9, h: 1.4, prof: "sharp" });
  S.add(capF([hd[0] - 3, hd[1] + 0.6], [hd[0] + 2, hd[1] + 1.4], 0.7), mat(ramp(0xf0ece0)), { on: 1, h: 0.4 });
  S.add(capF([hd[0] - 2, hd[1] - 2.2], [hd[0] + 2.4, hd[1] - 2], 0.6), mat(ramp(0xf0ece0)), { on: 1, h: 0.4 });
  !p.hurt && S.decal(hd[0] + 2, hd[1] - 0.6, 0x101010).decal(hd[0] + 1.6, hd[1] - 1.2, 0xffffff);
  return fin(S.render({ rim: !0 }), p);
}
export const pxPeacock = {
  fw: Math.round(132 * PCK), fh: Math.round(112 * PCK), w: 30, h: 42,
  anims: { idle: [4, 5], move: [6, 9], wind: [3, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], fan: [4, 8, !1], gust: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6, neck: Math.sin(ph) * 0.1 };
    if (nm === "move") { const g = gait2(f, n, 5, 3); P = { legs: g, bob: g.bob, neck: 0.2 }; }
    if (nm === "wind") P = { neck: -0.5 * t, bob: 2 * t };
    if (nm === "atk") P = { neck: [0.8, 1.2, 1][f], bob: -0.5 };
    if (nm === "rec") P = { neck: 0.8 * (1 - t) };
    if (nm === "fan") P = { fan: [0.4, 0.8, 1, 1][f], neck: -0.2 };
    if (nm === "gust") P = { fan: 0.2, wing: [0.3, 1, 0.2, 1][f], neck: -0.2 };
    if (nm === "hurt") P = { hurt: f === 0, neck: -0.6, fan: 0.2 };
    return peacockFrame(P);
  },
};
