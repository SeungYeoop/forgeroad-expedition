// 스포어캡 몬스터 12종 (조각 도구, 오른쪽을 본다) — 보랏빛 밤하늘에 떠오른 거대 버섯 갓 섬
//   아래 섬 줄: 퍼프볼 · 포자 민달팽이 · 갓 꼬마병사 · [정예] 거대 버섯 어미
//   가운데 줄: 갓 딱정벌레 · 포자 정령 · 독버섯 개구리 · [정예] 버섯 마녀
//   위 줄: 하늘 가오리 · 포자 해파리 · 균사 도깨비불 · [정예] 균사 거미 여왕
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, glass, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const CAP = mat(ramp(0x9a5a8a), { tex: "skin", amp: 0.9, spec: 0.3 }), CAPF = mat(rampF(0x824a74), { tex: "skin", amp: 0.8 }), CAPR = mat(ramp(0xb04a4a), { tex: "skin", amp: 0.8, spec: 0.3 });
const CAPT = mat(ramp(0x4a8a8a), { tex: "skin", amp: 0.8, spec: 0.3 }), CAPTF = mat(rampF(0x3c7474), { tex: "skin", amp: 0.7 });
const STEM = mat(ramp(0xe0d4c0), { tex: "skin", amp: 0.6 }), STEMF = mat(rampF(0xc4b8a4), { tex: "skin", amp: 0.5 }), GILL = mat(ramp(0xc8b0b8), { tex: "cloth", amp: 0.6 });
const GILLD = mat(rampF(0xa08890), { tex: "cloth", amp: 0.7 }), DARK = mat(ramp(0x2e2028));
const SPOT = mat(ramp(0xf4eee0)), GLT = mat(rampGlow(0x8af0d0)), GLP = mat(rampGlow(0xf0a0e0)), GLY = mat(rampGlow(0xe8f090));
const SLUG = mat(ramp(0x7a6a9a), { tex: "skin", amp: 0.7, spec: 0.45 }), SLUGF = mat(rampF(0x665886), { tex: "skin", amp: 0.6 });
const PUFF = mat(ramp(0xd8ccb0), { tex: "skin", amp: 0.9 }), PUFFF = mat(rampF(0xb8ac94), { tex: "skin", amp: 0.8 });
const CHIT = mat(ramp(0x3a3048), { tex: "metal", amp: 0.6, spec: 0.5 }), CHITF = mat(rampF(0x2e2640), { tex: "metal", amp: 0.5 });
const FROG = mat(ramp(0x5a8a5a), { tex: "skin", amp: 0.8, spec: 0.4 }), FROGF = mat(rampF(0x4a784a), { tex: "skin", amp: 0.7 }), FROGB = mat(ramp(0xd8d0a0), { tex: "skin", amp: 0.5 });
const ROBE = mat(ramp(0x4a3a5a), { tex: "cloth", amp: 0.9 }), ROBEF = mat(rampF(0x3c2e4a), { tex: "cloth", amp: 0.8 }), SKINO = mat(ramp(0x9aa88a), { tex: "skin", amp: 0.8 });
const WOOD = mat(ramp(0x6a4a34), { tex: "wood", amp: 0.9 }), RAY = mat(ramp(0x6a5a8a), { tex: "skin", amp: 0.8, spec: 0.3 }), RAYF = mat(rampF(0x564874), { tex: "skin", amp: 0.7 }), RAYB = mat(ramp(0xc8b8d0), { tex: "skin", amp: 0.5 });
const JEL = mat(ramp(0xc89ad8, { hi: 0.5 }), { tex: "glass", amp: 0.8, spec: 0.5 }), MYC = mat(ramp(0xe8e0d0), { tex: "fur", amp: 0.8, dir: 1.57 }), MYCF = mat(rampF(0xc8bcac), { tex: "fur", amp: 0.7, dir: 1.57 });
const SPID = mat(ramp(0x4a3a40), { tex: "fur", amp: 1, dir: 1.2 }), SPIDF = mat(rampF(0x3a2c32), { tex: "fur", amp: 0.9, dir: 1.2 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K) => (x, y) => [W * K / 2 + (x - W / 2) * K, H * K + (y - H) * K];
// 버섯 갓 (가운데 c, 반폭 rx, 높이 ry): 둥근 갓 + 아래 주름 띠 + 흰 점
function cap(S, c, rx, ry, M, o = {}) {
  const yb = c[1] + ry * 0.35;
  o.gill !== !1 && S.add(ellR(c[0], yb, rx * 0.86, ry * 0.22), GILLD, { z: (o.z ?? 0) - 0.3, lift: o.lift, h: ry * 0.3 });
  S.add(minus(ellR(c[0], c[1] + ry * 0.2, rx, ry * 1.2), (x, y) => y > yb), M, { z: o.z, lift: o.lift, h: o.h ?? ry * 0.9 });
  for (const [u, v, r] of o.spots ?? [[-0.5, -0.4, 0.16], [0.1, -0.7, 0.14], [0.55, -0.25, 0.12], [-0.15, -0.15, 0.1]]) S.add(ellR(c[0] + u * rx, c[1] + v * ry, rx * r, rx * r * 0.8), o.glow ? GLT : SPOT, { on: 1, lift: 0.4, h: 0.5 });
}

// ════ 퍼프볼 ════ 거칠한 껍질의 둥근 먼지버섯 · 꼭지 구멍 · 껍질에 갈라진 금 · 짧은 뿌리 다리로 아장아장 · 터질 듯 부푼다
//   p: swell · legs · hurt
const PFK = 0.72;
function puffFrame(p = {}) {
  const W = 48, H = 46, G = H - 1, S = sculpt(W, H, { k: PFK, ax: 24 });
  const sw = p.swell ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cx = 24, cy = G - 14 - sw * 2, r = 12 + sw * 3;
  for (const [o, far, d] of [[g.f, 1, -4], [g.n, 0, 4]]) S.add(capF([cx + d, cy + r * 0.7], [cx + d + o[0], G - 1 - o[1]], 1.6, 1.2), far ? STEMF : STEM, { z: far ? -2 : 4, h: 1.4 });
  S.add(U(ellR(cx, cy, r, r * 0.88), ellR(cx, cy + r * 0.6, r * 0.62, r * 0.42)), PUFF, { z: 1, h: r * 0.8 });
  // 작은 돌기 껍질 (위로 갈수록 촘촘) + 위쪽 갈색 껍질 조각
  for (let k = 0; k < 26; k++) { const a = (k / 26) * T2 * 2.6, rr = r * (0.2 + (k % 5) * 0.16), q = [cx + Math.cos(a) * rr, cy - Math.abs(Math.sin(a)) * rr * 0.8]; S.add(ellR(q[0], q[1], 1.1, 0.9), k % 3 ? PUFFF : mat(ramp(0xece4d0)), { on: 1, lift: 0.4, h: 0.6 }); }
  for (const [u, v] of [[-0.4, -0.5], [0.2, -0.65], [0.55, -0.3]]) S.add(ellR(cx + u * r, cy + v * r, 2.6, 1.6), mat(ramp(0x9a7a5a), { tex: "clay" }), { on: 1, lift: 0.3, h: 0.5 });
  S.carve(capF([cx - 6, cy - 4], [cx - 1, cy + 3], 0.5), 1).carve(capF([cx + 4, cy - 6], [cx + 7, cy], 0.5), 0.8);
  S.add(ellR(cx + 1, cy - r * 0.86, 2.6, 1.4), mat(ramp(0x6a5a48)), { lift: 0.8, h: 0.8 });
  sw > 0.6 && S.add(ellR(cx + 1, cy - r * 0.9, 1.6, 0.8), GLY, { lift: 1, h: 0.4 });
  if (!p.hurt) S.decal(cx + 4, cy + 1, 0x2a2018).decal(cx + 8, cy + 1, 0x2a2018);
  return fin(S.render({ rim: !0 }), p);
}
export const pxPuff = {
  fw: Math.round(48 * PFK), fh: Math.round(46 * PFK), w: 18, h: 18,
  anims: { idle: [4, 5], move: [6, 9], wind: [4, 8, !1], atk: [2, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { swell: Math.sin(ph) * 0.1 };
    if (nm === "move") P = { legs: gait2(f, n, 2.5, 1.5) };
    if (nm === "wind") P = { swell: t };
    if (nm === "atk") P = { swell: [1.3, 0.2][f] };
    if (nm === "rec") P = { swell: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, swell: 0.6 };
    return puffFrame(P);
  },
};

// ════ 포자 민달팽이 ════ 젖은 보라 몸 · 등에 작은 발광 버섯 셋 · 눈자루 · 끈적한 흔적
//   p: stretch · bob · hurt
const SLK = 0.72;
function slugFrame(p = {}) {
  const W = 62, H = 38, G = H - 1, S = sculpt(W, H, { k: SLK, ax: 30 });
  const st = p.stretch ?? 0, b = p.bob ?? 0, x0 = 6 - st * 2, hx = 50 + st * 4;
  S.add(U(ellR((x0 + hx) / 2, G - 5 + b * 0.5, (hx - x0) / 2, 6.6 + b * 0.3), polyF([[x0 + 2, G - 0.5], [hx + 5, G - 0.5], [hx + 5, G - 4], [x0 + 2, G - 3]]), ellR(hx + 1, G - 7 + b, 6.4, 6)), SLUG, { z: 0, h: 9 });
  S.add(ellR(hx - 6, G - 9 + b, 8, 4), SLUGF, { lift: 1, h: 2 });
  S.add(capF([x0 + 6, G - 2], [hx, G - 2], 2.4), mat(ramp(0xa898c0), { tex: "skin" }), { on: 1, h: 0.4 });
  for (let k = 0; k < 6; k++) S.carve(capF([x0 + 10 + k * 6, G - 10 + b], [x0 + 11 + k * 6, G - 3], 0.5), 0.6);
  for (const [x, s] of [[x0 + 14, 1], [x0 + 22, 1.3], [x0 + 30, 0.9]]) { S.add(capF([x, G - 9 + b], [x + 0.5, G - 13 * s + b], 1.2 * s, 1), STEM, { lift: 1, h: 1 }); cap(S, [x + 0.5, G - 14 * s + b], 4 * s, 2.6 * s, CAPT, { lift: 2, glow: 1, spots: [[-0.3, -0.5, 0.2], [0.4, -0.4, 0.16]] }); }
  for (const [d, z] of [[-1.6, 4], [1.6, 8]]) { const s0 = [hx + d, G - 11 + b], s1 = [hx + d + 3, G - 20 + b]; S.add(capF(s0, s1, 1.2, 0.9), z > 5 ? SLUG : SLUGF, { z, h: 1.2 }); S.add(ellR(s1[0], s1[1], 1.8, 1.8), GLP, { z: z + 1, h: 1.2 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxSporeSlug = {
  fw: Math.round(62 * SLK), fh: Math.round(38 * SLK), w: 22, h: 14,
  anims: { idle: [4, 5], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { stretch: (Math.sin(ph) + 1) * 0.6, bob: Math.cos(ph) * 0.3 };
    if (nm === "wind") P = { stretch: -0.4 * t, bob: t };
    if (nm === "atk") P = { stretch: 1.6, bob: -1 };
    if (nm === "rec") P = { stretch: 1.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return slugFrame(P);
  },
};

// ════ 갓 꼬마병사 ════ 붉은 점박이 갓을 투구처럼 쓴 작은 버섯 병사 · 나무껍질 방패 · 가시 달린 잔가지 창
//   p: legs · bob · thrust(0~1.2) · guard · hurt
const CLK = 0.72;
function caplingFrame(p = {}) {
  const W = 56, H = 56, G = H - 1, S = sculpt(W, H, { k: CLK, ax: 26 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, th = p.thrust ?? 0, cx = 24;
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const hp = [cx + (far ? -3 : 2), 42 + b], ft = [hp[0] + o[0] + 1, G - 1.5 - o[1]]; S.add(capF(hp, ft, 2.2, 1.8), far ? STEMF : STEM, { z: far ? -2 : 4, h: 1.8 }); S.add(ellR(ft[0] + 1, ft[1], 2.6, 1.4), far ? STEMF : STEM, { z: far ? -1 : 4.5, h: 1.2 }); }
  // 몸 (줄기 몸통)
  S.add(ellR(cx, 34 + b, 7, 9), STEM, { z: 1, h: 6 });
  S.add(capF([cx - 5, 38 + b], [cx + 5, 38 + b], 1.4), WOOD, { z: 6, h: 1 });
  // 방패 (먼 팔)
  S.add(ellR(cx - 7 + (p.guard ?? 0) * 6, 34 + b, 6, 8), mat(ramp(0x7a5a3a), { tex: "wood", amp: 1 }), { z: p.guard ? 9 : -1, h: 3, prof: "flat" });
  S.add(ellR(cx - 7 + (p.guard ?? 0) * 6, 34 + b, 2, 2), mat(ramp(0x9a8a5a)), { lift: 1, h: 0.8, z: p.guard ? 10 : 0 });
  // 얼굴 + 갓 투구
  const hx = cx + 1, hy = 24 + b;
  S.add(ellR(hx + 1, hy + 2, 6, 5.6), STEM, { z: 3, h: 5 });
  !p.hurt && S.decal(hx + 3, hy + 2, 0x1a1210).decal(hx + 6, hy + 2, 0x1a1210);
  cap(S, [hx, hy - 3], 12, 7, CAPR, { z: 5 });
  // 창 (가까운 팔)
  const sh = [cx + 5, 30 + b], hand = pol(sh, 0.3 - th * 0.3, 7 + th * 4);
  S.add(capF(sh, hand, 1.8, 1.4), STEM, { z: 8, h: 1.6 });
  const s0 = pol(hand, -0.15, -12), s1 = pol(hand, -0.15, 16 + th * 4);
  S.add(capF(s0, s1, 0.9, 0.7), WOOD, { z: 9, h: 0.9 });
  S.add(polyF([pol(s1, Math.PI / 2 - 0.15, 1.8), pol(s1, -0.15, 6), pol(s1, -Math.PI / 2 - 0.15, 1.8)]), mat(ramp(0xb8b0a0), { spec: 0.4 }), { z: 9.5, h: 1, prof: "sharp" });
  for (const q of [0.4, 0.7]) S.add(capF(lerp(s0, s1, q), pol(lerp(s0, s1, q), -1.4, 2.4), 0.5, 0.3), WOOD, { z: 9, h: 0.5 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxCapling = {
  fw: Math.round(56 * CLK), fh: Math.round(56 * CLK), w: 14, h: 22,
  anims: { idle: [4, 6], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], guard: [2, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 3, 2); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { thrust: -0.4 * t };
    if (nm === "atk") P = { thrust: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { thrust: 1 - t };
    if (nm === "guard") P = { guard: 1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return caplingFrame(P);
  },
};

// ════ [정예] 거대 버섯 어미 ════ 큰 보라 갓 아래 굵은 줄기 몸 · 줄기에 자라는 새끼 버섯들 · 뿌리 다리 넷 · 갓 가장자리 발광 점 ·
//   갓 아래 주름 그늘 속 두 눈
//   p: bob · step · bend(앞으로 숙이기 0~1) · puff(포자 뿜기) · hurt
const MTK = 0.72;
function matriarchFrame(p = {}) {
  const W = 120, H = 118, G = H - 1, S = sculpt(W, H, { k: MTK, ax: 58 });
  const b = p.bob ?? 0, st = p.step ?? 0, bd = p.bend ?? 0, cx = 58;
  const ROOT = mat(ramp(0xb8a88c), { tex: "wood", amp: 1 }), ROOTF = mat(rampF(0x8a7c66), { tex: "wood", amp: 0.9 });
  // 뿌리 다리 넷 (울퉁불퉁 무릎 · 발끝은 잔뿌리로 갈라짐)
  for (const [dx, far, s] of [[-12, 1, -st], [12, 1, st], [-18, 0, st], [16, 0, -st]]) {
    const top = [cx + dx * 0.5, 88 + b], kn = [cx + dx * 0.95 + s * 0.5, 100 + b * 0.5], ft = [cx + dx * 1.35 + s, G - 2], M = far ? ROOTF : ROOT, z = far ? -3 : 4;
    S.add(U(capF(top, kn, 5.4, 4.6), capF(kn, ft, 4.6, 3)), M, { z, h: 4 });
    S.add(ellR(kn[0], kn[1], 4.4, 3.4), M, { z: z + 0.2, h: 3 });
    for (const a of [-0.5, 0, 0.6]) S.add(capF(ft, [ft[0] + Math.sin(a) * 7, G - 0.5], 1.4, 0.5), M, { z: z + 0.1, h: 0.8 });
  }
  // 줄기 몸 (아래가 불룩한 통 · 밑동 주머니 · 세로 결) + 뿌리 팔 + 새끼 버섯
  S.add(U(ellR(cx, 70 + b, 14, 24), ellR(cx, 86 + b, 19, 9)), STEM, { z: 1, h: 13 });
  S.add(polyF([[cx - 19, 84 + b], [cx + 19, 84 + b], [cx + 21, 92 + b], [cx + 12, 90 + b], [cx + 4, 93 + b], [cx - 6, 90 + b], [cx - 14, 93 + b], [cx - 21, 90 + b]]), STEMF, { z: 1.5, h: 5 });
  for (const dx of [-9, -3, 3, 9]) S.carve(capF([cx + dx * 0.7, 62 + b], [cx + dx, 84 + b], 0.5), 0.6);
  for (const [d, far] of [[-1, 1], [1, 0]]) {
    const sh = [cx + d * 12, 62 + b], el = [cx + d * 20 + bd * 6, 74 + b + bd * 4], hd = [cx + d * 22 + bd * 12, 86 + b + bd * 2], M = far ? ROOTF : ROOT, z = far ? -1 : 7;
    S.add(U(capF(sh, el, 3.6, 3), capF(el, hd, 3, 2)), M, { z, h: 2.6 });
    for (const a of [-0.7, -0.2, 0.3]) S.add(capF(hd, pol(hd, Math.PI / 2 + a * d, 5), 1, 0.4), M, { z: z + 0.1, h: 0.6 });
  }
  for (const [x, y, s] of [[cx - 13, 76, 1], [cx + 12, 80, 0.8], [cx - 6, 88, 0.7]]) { S.add(capF([x, y + b], [x + (x < cx ? -3 : 3), y - 4 + b], 1.2 * s, 1), STEM, { lift: 1, h: 1 }); cap(S, [x + (x < cx ? -3 : 3), y - 5 + b], 5 * s, 3 * s, CAPT, { lift: 2, glow: 1, spots: [[0, -0.5, 0.2]] }); }
  // 얼굴 (줄기 윗부분 · 고리 치마 아래)
  const fy = 60 + b + bd * 3;
  for (const [x, d] of [[cx + 3 + bd * 3, 1], [cx + 11 + bd * 3, -1]]) S.add(polyF([[x - 3, fy - 1 - d * 1.4], [x + 3, fy - 1 + d * 1.4], [x + 2.4, fy + 2], [x - 2.4, fy + 2]]), DARK, { on: 1, h: 0.2 });
  S.add(capF([cx + 3 + bd * 3, fy + 8], [cx + 12 + bd * 3, fy + 7], 1.2, 0.8), DARK, { on: 1, h: 0.2 });
  // 고리 치마 (갓 바로 아래 늘어진 막)
  const cc = [cx + bd * 10, 32 + b + bd * 6];
  S.add(polyF([[cc[0] - 15, cc[1] + 12], [cc[0] + 15, cc[1] + 12], [cc[0] + 17, cc[1] + 19], [cc[0] + 10, cc[1] + 17], [cc[0] + 4, cc[1] + 21], [cc[0] - 3, cc[1] + 17], [cc[0] - 10, cc[1] + 21], [cc[0] - 17, cc[1] + 18]]), mat(ramp(0xd8ccb8), { tex: "cloth", amp: 0.8 }), { z: 5, h: 3 });
  // 갓 (크게, 숙이면 앞으로 기운다) · 아래 주름 그늘
  S.add(ellR(cc[0], cc[1] + 9, 34, 5), mat(ramp(0x6a4a5a), { tex: "cloth", amp: 0.8 }), { z: 5.5, h: 3 });
  for (let k = 0; k < 13; k++) S.carve(capF([cc[0] - 30 + k * 5, cc[1] + 7], [cc[0] - 28 + k * 4.6, cc[1] + 12], 0.4), 0.6);
  cap(S, cc, 38, 21, CAP, { z: 6, h: 18, gill: !1, spots: [[-0.62, -0.35, 0.11], [-0.3, -0.72, 0.13], [0.15, -0.66, 0.1], [0.52, -0.38, 0.12], [-0.02, -0.32, 0.08], [-0.42, -0.05, 0.07], [0.32, -0.08, 0.06]] });
  for (let k = 0; k < 8; k++) S.add(ellR(cc[0] - 32 + k * 9.2, cc[1] + 5, 1.6, 1.6), GLP, { on: 1, lift: 0.5, h: 0.5 });
  if (!p.hurt) for (const x of [cx + 3 + bd * 3, cx + 11 + bd * 3]) S.decal(x, fy + 0.6, 0xf0a0e0).decal(x + 1, fy + 0.6, 0xf0a0e0);
  const C = S.render({ rim: !0 });
  if (p.puff) { const P = toPx(W, H, MTK); for (let k = 0; k < 12; k++) { const q = P(cc[0] - 30 + k * 6, cc[1] - 26 - (k % 3) * 5); C.px(q[0], q[1], k % 2 ? 0xe0b8e8 : 0xb8f0d8); } }
  return fin(C, p);
}
export const pxMatriarch = {
  fw: Math.round(120 * MTK), fh: Math.round(118 * MTK), w: 36, h: 54,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], puff: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.8 };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 2 };
    if (nm === "wind") P = { bend: -0.4 * t, bob: -1 * t };
    if (nm === "atk") P = { bend: [0.6, 1, 1][f], bob: 2 };
    if (nm === "rec") P = { bend: 1 - t };
    if (nm === "puff") P = { bend: -0.3, puff: f >= 1, bob: [0, -1, 1, 0][f] };
    if (nm === "hurt") P = { hurt: f === 0, bend: -0.3 };
    return matriarchFrame(P);
  },
};

// ════ 갓 딱정벌레 ════ 윤나는 검보라 겉날개 위에 버섯 갓이 자란 장수풍뎅이 · 큰 뿔 · 다리 여섯
//   p: legs(위상) · horn · hurt
const CBK = 0.72;
function capBeetleFrame(p = {}) {
  const W = 66, H = 46, G = H - 1, S = sculpt(W, H, { k: CBK, ax: 32 });
  const ph = p.ph ?? 0, hn = p.horn ?? 0, cx = 30, by = G - 10;
  for (const [k, far] of [[0, 1], [1, 1], [2, 1], [0, 0], [1, 0], [2, 0]]) { const x = cx - 10 + k * 9, a = Math.sin(ph + k * 2 + far * 3) * 2.4; S.add(U(capF([x, by], [x + a + 3, by + 4], 1.4), capF([x + a + 3, by + 4], [x + a + 2, G - 0.5], 1.1, 0.7)), far ? CHITF : CHIT, { z: far ? -2 : 6, h: 1 }); }
  S.add(ellR(cx - 1, by - 5, 15, 9), CHIT, { z: 2, h: 8 });
  S.carve(capF([cx - 1, by - 14], [cx - 2, by + 3], 0.5), 1);
  const hx = cx + 15, hy = by - 2;
  S.add(ellR(hx, hy, 5.6, 5), CHIT, { z: 3, h: 4 });
  S.add(U(capF([hx + 3, hy - 1], [hx + 10, hy - 7 - hn * 3], 2.2, 1.4), capF([hx + 10, hy - 7 - hn * 3], [hx + 8, hy - 13 - hn * 4], 1.4, 0.5)), CHIT, { z: 4, h: 1.8 });
  !p.hurt && S.decal(hx + 2, hy - 1, 0xf0a0e0);
  for (const [x, y, s] of [[cx - 6, by - 13, 1], [cx + 4, by - 12, 0.8]]) { S.add(capF([x, y + 2], [x, y - 2], 1.2 * s), STEM, { lift: 2, h: 1 }); cap(S, [x, y - 3], 6 * s, 4 * s, CAPR, { lift: 3 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxCapBeetle = {
  fw: Math.round(66 * CBK), fh: Math.round(46 * CBK), w: 26, h: 18,
  anims: { idle: [4, 5], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: 0 };
    if (nm === "move") P = { ph };
    if (nm === "wind") P = { horn: -0.6 * t };
    if (nm === "atk") P = { horn: [0.8, 1.2, 1][f], ph: f };
    if (nm === "rec") P = { horn: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, horn: 0.5 };
    return capBeetleFrame(P);
  },
};

// ════ 포자 정령 ════ 빛나는 포자 알갱이가 모여 만든 흐릿한 얼굴 덩어리 · 둘레에 포자가 흩날린다
//   p: ph · swell · hurt
const SPK = 0.72;
function sporeFrame(p = {}) {
  const W = 50, H = 50, S = sculpt(W, H, { k: SPK, ax: 25 });
  const ph = p.ph ?? 0, sw = p.swell ?? 0, cx = 25, cy = 25, r = 10 + sw * 4;
  for (let k = 0; k < 16; k++) { const a = (k / 16) * T2 + ph * 0.5, rr = r * (0.4 + ((k * 7) % 5) / 8), q = pol([cx, cy], a, rr); S.add(ellR(q[0], q[1], 3.4 - (k % 3) * 0.6, 3 - (k % 3) * 0.5), k % 3 ? mat(ramp(0xc8a8d0), { tex: "skin" }) : GLT, { z: (k % 4) - 2, h: 2.4 }); }
  S.add(ellR(cx, cy, r * 0.6, r * 0.6), mat(ramp(0xd8b8e0), { tex: "skin", amp: 0.8 }), { z: 2, h: 5 });
  if (!p.hurt) S.carve(ellR(cx + 2, cy - 1, 1.4, 1.8), 2, !1).carve(ellR(cx + 6, cy - 1, 1.4, 1.8), 2, !1).carve(ellR(cx + 4, cy + 4, 2, 1.2), 1.6, !1);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, SPK);
  for (let k = 0; k < 8; k++) { const a = ph + k * 0.8, q = P(...pol([cx, cy], a, r + 6 + (k % 3) * 2)); C.px(q[0], q[1], k % 2 ? 0xb8f0d8 : 0xf0c8f0); }
  return fin(C, p);
}
export const pxSpore = {
  fw: Math.round(50 * SPK), fh: Math.round(50 * SPK), w: 16, h: 16, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, swell: Math.sin(ph) * 0.1 };
    if (nm === "wind") P = { ph: ph * 2, swell: t };
    if (nm === "atk") P = { ph, swell: [1.2, 0.6, 0.2][f] };
    if (nm === "rec") P = { ph, swell: 0.2 };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return sporeFrame(P);
  },
};

// ════ 독버섯 개구리 ════ 축축한 녹색 개구리 · 머리에 작은 붉은 버섯 · 노란 배 · 볼록한 눈 · 혀를 길게 뻗는다
//   p: crouch · jump · tongue(0~1) · hurt
const FGK = 0.72;
function frogFrame(p = {}) {
  const W = 66, H = 46, G = H - 1, S = sculpt(W, H, { k: FGK, ax: 28 });
  const cr = p.crouch ?? 0, jp = p.jump ?? 0, tg = p.tongue ?? 0, cx = 26, cy = G - 12 + cr * 3 - jp * 8;
  // 뒷다리 (접힌 큰 허벅지) · 앞다리
  if (jp < 0.5) { S.add(ellR(cx - 8, cy + 4, 8, 6), FROGF, { z: -1, h: 5 }); S.add(ellR(cx - 6, G - 2, 7, 2.4), FROGF, { z: -0.5, h: 1.6 }); }
  else S.add(capF([cx - 8, cy + 4], [cx - 22, cy + 10], 4, 2.4), FROGF, { z: -1, h: 3 });
  S.add(ellR(cx, cy, 13, 9), FROG, { z: 1, h: 8 });
  S.add(ellR(cx + 3, cy + 4, 9, 4), FROGB, { on: 1, h: 0.6 });
  for (const [x, y] of [[cx - 6, cy - 4], [cx - 1, cy - 6], [cx + 4, cy - 3]]) S.add(ellR(x, y, 1.8, 1.4), mat(ramp(0x3a6a3a)), { on: 1, h: 0.4 });
  S.add(capF([cx + 6, cy + 4], [cx + 9, G - 1], 1.8, 1.4), FROG, { z: 4, h: 1.6 });
  // 눈 + 입 + 머리 버섯
  for (const [x, z] of [[cx + 6, 3], [cx + 10, 6]]) { S.add(ellR(x, cy - 8, 3.2, 3), FROG, { z, h: 3 }); !p.hurt && S.decal(x + 1, cy - 8, 0x1a1210).decal(x + 0.5, cy - 9, 0xffffff); }
  S.carve(capF([cx + 4, cy - 1], [cx + 13, cy - 2], 0.5), 1, !1);
  S.add(capF([cx - 2, cy - 8], [cx - 2, cy - 12], 1), STEM, { lift: 1, h: 0.8 });
  cap(S, [cx - 2, cy - 13], 4, 2.6, CAPR, { lift: 2, spots: [[-0.3, -0.4, 0.22], [0.4, -0.3, 0.18]] });
  if (tg > 0.1) { const t0 = [cx + 12, cy - 1.5], t1 = [cx + 12 + tg * 30, cy - 2 - tg * 2]; S.add(capF(t0, t1, 1.2, 1), mat(ramp(0xd86a7a)), { z: 8, h: 1 }); S.add(ellR(t1[0], t1[1], 2.2, 2), mat(ramp(0xd86a7a)), { z: 8.5, h: 1.4 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxFrog = {
  fw: Math.round(66 * FGK), fh: Math.round(46 * FGK), w: 20, h: 14,
  anims: { idle: [4, 5], move: [4, 10], wind: [3, 9, !1], atk: [3, 18, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { crouch: Math.max(0, Math.sin(ph)) * 0.3 };
    if (nm === "move") P = { crouch: [1, 0, 0, 0.6][f], jump: [0, 1, 0.8, 0][f] };
    if (nm === "wind") P = { crouch: t };
    if (nm === "atk") P = { tongue: [0.6, 1, 0.8][f], crouch: 0.4 };
    if (nm === "rec") P = { tongue: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.6 };
    return frogFrame(P);
  },
};

// ════ [정예] 버섯 마녀 ════ 등 굽은 늙은 마녀 · 머리 위에 커다란 보라 버섯 갓 모자 · 이끼 빛 피부 · 해진 망토와 약초 주머니 ·
//   빛나는 버섯 지팡이 · 허리에 달린 작은 솥에서 독 김이 오른다
//   p: bob · staff(0~1.2) · brew · legs · hurt
const WTK = 0.72;
function witchFrame(p = {}) {
  const W = 110, H = 116, G = H - 1, S = sculpt(W, H, { k: WTK, ax: 52 });
  const b = p.bob ?? 0, sf = p.staff ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cx = 50;
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) S.add(ellR(cx + (far ? -6 : 6) + o[0], G - 2 - o[1], 6, 2.4), far ? mat(rampF(0x3a2c24)) : mat(ramp(0x4a3a2a), { tex: "leather" }), { z: far ? -2 : 6, h: 2 });
  // 망토 (넓게 끌리는 해진 자락)
  S.add(polyF([[cx - 10, 46 + b], [cx + 12, 46 + b], [cx + 22, G - 3], [cx + 14, G - 6], [cx + 8, G - 2], [cx, G - 7], [cx - 8, G - 2], [cx - 16, G - 6], [cx - 24, G - 3]]), ROBE, { z: 0, h: 10 });
  for (const dx of [-14, -6, 2, 10]) S.carve(capF([cx + dx * 0.4, 54 + b], [cx + dx, G - 6], 0.6), 0.9);
  // 굽은 등 + 몸
  S.add(U(ellR(cx - 2, 52 + b, 15, 14), ellR(cx + 6, 46 + b, 11, 10)), ROBEF, { z: 1, h: 10 });
  // 약초 주머니 + 작은 솥
  S.add(ellR(cx - 12, 66 + b, 5, 6), mat(ramp(0x7a6a4a), { tex: "cloth" }), { z: 4, h: 4 });
  S.add(ellR(cx + 14, 70 + b, 7, 6), mat(ramp(0x3a3838), { tex: "metal", spec: 0.4 }), { z: 6, h: 5 });
  S.add(ellR(cx + 14, 65 + b, 6, 1.6), GLT, { lift: 1, h: 0.4, z: 6.5 });
  // 머리 (긴 코 · 매부리 · 사마귀) + 큰 버섯 모자
  const hx = cx + 12, hy = 38 + b;
  S.add(ellR(hx, hy, 7, 7), SKINO, { z: 4, h: 6 });
  S.add(capF([hx + 4, hy], [hx + 12, hy + 5], 2.2, 1.2), SKINO, { z: 5, h: 2 });
  S.add(ellR(hx + 7, hy + 1, 0.9, 0.9), mat(ramp(0x6a7a5a)), { lift: 0.8, h: 0.5 });
  S.carve(capF([hx + 2, hy + 4], [hx + 7, hy + 5], 0.4), 0.8, !1);
  !p.hurt && S.decal(hx + 3, hy - 1, 0xe8f090).decal(hx + 3.4, hy - 1.6, 0xffffff);
  S.add(polyF([[hx - 8, hy - 2], [hx - 10, hy + 18], [hx - 3, hy + 10]]), mat(ramp(0xc8c4b8), { tex: "fur", amp: 0.8 }), { z: 3, h: 2 });
  S.add(capF([hx - 1, hy - 5], [hx - 2, hy - 12], 2.4, 2), STEM, { z: 6, h: 2 });
  cap(S, [hx - 3, hy - 14], 22, 11, CAP, { z: 7, h: 9, spots: [[-0.55, -0.4, 0.12], [-0.1, -0.7, 0.14], [0.4, -0.45, 0.11], [0.1, -0.2, 0.08]] });
  // 가까운 팔 + 버섯 지팡이
  const sh = [cx + 12, 48 + b], hand = pol(sh, 0.7 - sf * 1.6, 12);
  S.add(capF(sh, hand, 3.2, 2.6), ROBE, { z: 9, h: 2.6 });
  S.add(ellR(hand[0], hand[1], 2.4, 2.2), SKINO, { z: 10, h: 1.6 });
  const sa = -Math.PI / 2 + 0.2 - sf * 0.4, s0 = pol(hand, sa, -26), s1 = pol(hand, sa, 22);
  S.add(capF(s0, s1, 1.4, 1.2), WOOD, { z: 10, h: 1.2 });
  cap(S, pol(s1, sa, 3), 6, 4, CAPT, { z: 11, glow: 1, spots: [[0, -0.5, 0.25]] });
  S.add(ellR(...pol(s1, sa, 2), 3, 1.6), GLT, { z: 11.5, h: 0.6 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, WTK);
  if (p.brew) for (let k = 0; k < 6; k++) { const q = P(cx + 12 + (k % 3) * 2, 60 + b - k * 3); C.px(q[0], q[1], k % 2 ? 0x8af0d0 : 0xb8e8c8); }
  return fin(C, p);
}
export const pxWitch = {
  fw: Math.round(110 * WTK), fh: Math.round(116 * WTK), w: 28, h: 46,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], brew: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait2(f, n, 3, 1.5); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { staff: 1.2 * t };
    if (nm === "atk") P = { staff: [0.6, 0.2, 0.3][f] };
    if (nm === "rec") P = { staff: 0.3 * (1 - t) };
    if (nm === "brew") P = { brew: 1, staff: 0.4, bob: [0, 1, 0, 1][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1.5 };
    return witchFrame(P);
  },
};

// ════ 하늘 가오리 ════ 보라 등에 발광 점무늬가 있는 넓은 지느러미 날개 · 흰 배 · 긴 채찍 꼬리 · 미끄러지듯 날아 덮친다
//   p: flap · tilt · hurt
const RYK = 0.7;
function rayFrame(p = {}) {
  const W = 84, H = 50, S = sculpt(W, H, { k: RYK, ax: 40 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cx = 44, cy = 25;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 꼬리 (가늘고 짧게)
  let q = [cx - 14, cy + 1];
  for (let k = 0; k < 6; k++) { const n2 = [q[0] - 4, cy + 1 + Math.sin(k * 0.9 + fl * 1.5) * 1.6]; S.add(capF(R(...q), R(...n2), 0.9 - k * 0.1, 0.8 - k * 0.1), RAYF, { z: 0, h: 0.6 }); q = n2; }
  // 날개: 위에서 비스듬히 본 넓은 마름모 (먼 날개 위 · 가까운 날개 아래, 날갯짓에 끝이 오르내림)
  const wing = (back) => {
    const tip = back ? [cx - 6, cy - 15 - fl * 6] : [cx - 4, cy + 13 - fl * 16], mid = lerp([cx + 6, cy], tip, 0.55), lead = [mid[0] + 5, mid[1] + (back ? -1 : 1) * 1.5], trail = lerp([cx - 14, cy], tip, 0.6);
    S.add(polyF([R(cx + 10, cy + (back ? -2 : 2)), R(...lead), R(...tip), R(trail[0] - 2, trail[1]), R(cx - 14, cy)]), back ? RAYF : RAY, { z: back ? -2 : 4, h: 3, prof: "round" });
    for (const t of [0.35, 0.6]) S.add(ellR(...R(...lerp([cx - 2, cy], tip, t)), 1.5, 1.2), GLT, { z: back ? -1.5 : 4.5, lift: 0.4, h: 0.4 });
    !back && S.add(capF(R(...lerp([cx - 8, cy + 2], tip, 0.2)), R(...lerp([cx - 8, cy + 2], tip, 0.85)), 1.2, 0.6), RAYB, { on: 1, h: 0.3 });
  };
  wing(1);
  S.add(ellR(...R(cx, cy), 15, 6.4), RAY, { z: 2, h: 6 });
  for (const [u, v] of [[-8, -2], [-2, -3], [4, -2]]) S.add(ellR(...R(cx + u, cy + v), 1.6, 1.2), GLT, { on: 1, lift: 0.4, h: 0.4 });
  // 머리 지느러미 한 쌍 (앞으로 말린 뿔)
  for (const d of [-1, 1]) S.add(capF(R(cx + 13, cy + d * 2), R(cx + 19, cy + d * 3.4 - 1), 1.6, 0.8), d < 0 ? RAYF : RAY, { z: d < 0 ? 1 : 5, h: 1.2 });
  !p.hurt && S.decal(...R(cx + 11, cy - 2), 0x1a1210).decal(...R(cx + 11, cy - 2.6), 0xf0a0e0);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxRay = {
  fw: Math.round(84 * RYK), fh: Math.round(50 * RYK), w: 26, h: 12, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { flap: Math.sin(ph) };
    if (nm === "move") P = { flap: Math.sin(ph), tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.4 * t };
    if (nm === "atk") P = { flap: -0.6, tilt: 0.6 };
    if (nm === "rec") P = { flap: Math.sin(ph), tilt: 0.3 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5, tilt: -0.5 };
    return rayFrame(P);
  },
};

// ════ 포자 해파리 ════ 반투명 분홍 버섯 갓 모양 몸 · 속에 빛나는 포자 · 아래로 늘어진 균사 촉수
//   p: ph · pulse · hurt
const JLK = 0.72;
function jellyFrame(p = {}) {
  const W = 46, H = 64, S = sculpt(W, H, { k: JLK, ax: 23 });
  const ph = p.ph ?? 0, pu = p.pulse ?? 0, cx = 23, cy = 20 - pu * 2;
  for (let k = 0; k < 6; k++) { const x0 = cx - 9 + k * 3.6; let q = [x0, cy + 6]; for (let j = 0; j < 6; j++) { const n2 = [x0 + Math.sin(ph + j * 0.9 + k) * 2.4, cy + 10 + j * 5.4 * (1 - pu * 0.3)]; S.add(capF(q, n2, 0.9, 0.7), k % 2 ? MYC : MYCF, { z: k % 2 ? 1 : -1, h: 0.6 }); q = n2; } }
  S.add(U(ellR(cx, cy, 13 + pu * 2, 10 - pu), polyF([[cx - 13, cy], [cx + 13, cy], [cx + 11, cy + 6], [cx - 11, cy + 6]])), JEL, { z: 2, h: 8 });
  for (const [x, y] of [[cx - 5, cy - 3], [cx + 2, cy - 5], [cx + 6, cy], [cx - 1, cy + 2]]) S.add(ellR(x, y, 1.8, 1.8), GLP, { on: 1, lift: 0.3, h: 0.5 });
  !p.hurt && S.decal(cx + 4, cy + 2, 0x3a1a30).decal(cx + 8, cy + 2, 0x3a1a30);
  return fin(S.render({ rim: !0 }), p);
}
export const pxSporeJelly = {
  fw: Math.round(46 * JLK), fh: Math.round(64 * JLK), w: 16, h: 22, flying: !0,
  anims: { idle: [6, 7], move: [6, 9], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, pulse: Math.max(0, Math.sin(ph)) * 0.6 };
    if (nm === "wind") P = { ph, pulse: t };
    if (nm === "atk") P = { ph, pulse: [1, 0, 0][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph, pulse: 0.5 };
    return jellyFrame(P);
  },
};

// ════ 균사 도깨비불 ════ 흰 균사 실이 엉킨 공 속에 초록 불빛 · 실 끝이 바람에 흩날린다 · 실을 뻗어 묶는다
//   p: ph · reach · hurt
const WPK = 0.72;
function mycWispFrame(p = {}) {
  const W = 52, H = 52, S = sculpt(W, H, { k: WPK, ax: 26 });
  const ph = p.ph ?? 0, rc = p.reach ?? 0, cx = 26, cy = 26;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * T2 + ph * 0.3, len = 12 + (k % 3) * 3 + (k === 0 ? rc * 16 : 0); let q = [cx, cy];
    for (let j = 1; j <= 5; j++) { const n2 = pol([cx, cy], a + Math.sin(ph + j + k) * 0.22, (len * j) / 5); S.add(capF(q, n2, 1.5 - j * 0.22, 1.2 - j * 0.2), j % 2 ? MYC : MYCF, { z: Math.sin(a) > 0 ? 3 : -2, h: 0.8 }); if (j === 3 && k % 2) S.add(capF(n2, pol(n2, a + 0.7, 5), 0.6, 0.3), MYCF, { z: -1, h: 0.4 }); q = n2; }
    k % 3 === 0 && S.add(ellR(q[0], q[1], 1.2, 1.2), GLY, { z: 3.5, h: 0.6 });
  }
  S.add(ellR(cx, cy, 8.4, 8.4), MYC, { z: 1, h: 6 });
  for (let k = 0; k < 6; k++) S.carve(capF(pol([cx, cy], k * 1.05, 3), pol([cx, cy], k * 1.05 + 0.4, 8), 0.4), 0.6);
  S.add(ellR(cx, cy, 4.6, 4.6), GLY, { z: 2, h: 2 });
  !p.hurt && S.decal(cx + 1, cy - 1, 0xffffff);
  return fin(S.render({ rim: !0 }), p);
}
export const pxMycWisp = {
  fw: Math.round(52 * WPK), fh: Math.round(52 * WPK), w: 16, h: 16, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, reach: -0.3 * t };
    if (nm === "atk") P = { ph, reach: [0.6, 1.2, 1][f] };
    if (nm === "rec") P = { ph, reach: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return mycWispFrame(P);
  },
};

// ════ [정예] 균사 거미 여왕 ════ 털 난 검붉은 몸 · 등에 균사가 엉켜 자란 빛 버섯 무리 · 긴 다리 여덟 · 눈 여섯 · 큰 엄니 ·
//   배 끝에서 균사 실을 뽑는다
//   p: legs · bob · rear(앞다리 들기) · fang · hurt
const SQK = 0.7;
function spiderQueenFrame(p = {}) {
  const W = 132, H = 96, G = H - 1, S = sculpt(W, H, { k: SQK, ax: 64 });
  const b = p.bob ?? 0, ph = p.ph ?? 0, rr = p.rear ?? 0, fg = p.fang ?? 0, cx = 62, cy = 52 + b;
  const leg = (k, far) => {
    const side = k < 2 ? 1 : -1, root = [cx + 4 + (k % 2 ? 4 : -2) * side, cy - 2], up = k === 0 ? rr : 0, a = Math.sin(ph + k * 1.3 + far * 1.7) * 3;
    const kn = [root[0] + side * (15 + (k % 2) * 7) + a, cy - 25 - (k % 2) * 3 - up * 12], ft = [root[0] + side * (30 + (k % 2) * 9) + a * 1.5, k === 0 && rr > 0.3 ? cy - 24 - rr * 10 : G - 1], an = [lerp(kn, ft, 0.45)[0] + side * 5, lerp(kn, ft, 0.45)[1]];
    const M = far ? SPIDF : SPID, z = far ? -4 - k * 0.1 : 6 + k * 0.1;
    S.add(U(capF(root, kn, 3, 2.4), capF(kn, an, 2.4, 1.8), capF(an, ft, 1.8, 0.7)), M, { z, h: 2 });
    for (const j of [kn, an]) S.add(ellR(j[0], j[1], 2, 1.8), mat(ramp(0x6a4a50), { spec: 0.4 }), { z: z + 0.05, h: 1.4 });
    for (const t of [0.3, 0.6]) { const m = lerp(kn, an, t); S.add(capF(m, [m[0] + side * 2, m[1] - 2.4], 0.4, 0.2), M, { z: z + 0.1, h: 0.4 }); }
  };
  for (let k = 0; k < 4; k++) leg(k, 1);
  // 배 (뒤 큰 몸통) + 등 균사 버섯 + 실
  S.add(ellR(cx - 22, cy - 8, 24, 18), SPID, { z: 0, h: 15 });
  for (let k = 0; k < 7; k++) S.add(capF([cx - 40 + k * 5, cy - 14 + (k % 2) * 3], [cx - 36 + k * 5, cy - 20 - (k % 3) * 2], 0.6, 0.4), MYC, { on: 1, lift: 0.4, h: 0.4 });
  for (const [x, y, s] of [[cx - 30, cy - 24, 1], [cx - 20, cy - 27, 1.2], [cx - 12, cy - 22, 0.8], [cx - 36, cy - 16, 0.7]]) { S.add(capF([x, y + 3], [x, y - 2], 1 * s), STEM, { lift: 2, h: 0.8 }); cap(S, [x, y - 3], 4.4 * s, 3 * s, CAPT, { lift: 3, glow: 1, spots: [[0, -0.5, 0.2]] }); }
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 38 + k * 8, cy - 4], [cx - 36 + k * 8, cy + 6], 0.5), 0.8);
  S.add(capF([cx - 44, cy - 4], [cx - 50, G - 4], 0.6), MYCF, { z: -1, h: 0.4 });
  // 머리가슴 + 눈 여섯 + 엄니
  S.add(ellR(cx + 6, cy - 4, 14, 11), SPID, { z: 2, h: 9 });
  const hx = cx + 16, hy = cy - 6;
  if (!p.hurt) for (const [dx, dy] of [[0, -4], [3, -5], [5, -3], [1, -1], [4, -1], [6, 0]]) S.decal(hx + dx, hy + dy, 0xf0a0e0);
  for (const d of [-1, 1]) S.add(U(capF([hx + 4, hy + 3 + d], [hx + 9 + fg * 2, hy + 8 + d * 2 + fg * 2], 1.8, 1.4), capF([hx + 9 + fg * 2, hy + 8 + d * 2 + fg * 2], [hx + 7, hy + 12 + d * 2 + fg * 3], 1.4, 0.4)), mat(ramp(0x2a2024), { spec: 0.5 }), { z: 5 + d, h: 1.4 });
  for (let k = 0; k < 4; k++) leg(k, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxSpiderQueen = {
  fw: Math.round(132 * SQK), fh: Math.round(96 * SQK), w: 40, h: 30,
  anims: { idle: [4, 5], move: [6, 10], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], spit: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5, ph: 0 };
    if (nm === "move") P = { ph, bob: Math.sin(ph * 2) * 0.6 };
    if (nm === "wind") P = { rear: t, fang: 0.5 * t, bob: -1 * t };
    if (nm === "atk") P = { rear: [0.6, 0, 0][f], fang: 1.2, bob: 1 };
    if (nm === "rec") P = { fang: 1 - t };
    if (nm === "spit") P = { bob: [0, -1, 1, 0][f], fang: 0.6 };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.3, bob: 1 };
    return spiderQueenFrame(P);
  },
};
