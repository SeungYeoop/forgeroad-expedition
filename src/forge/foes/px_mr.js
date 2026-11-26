// 마이어루트 몬스터 12종 (조각 도구, 오른쪽을 본다) — 물에 잠긴 뿌리 굴 · 검푸른 물 반사 · 이끼 빛
//   위 줄: 뿌리 나무늘보 · 꼽등이 · 덩굴뱀 · [정예] 실빛 거대 유충
//   가운데 줄: 잠자리 유충 · 큰수달 · 물장군 · [정예] 아나콘다
//   아래 줄: 장님 물고기 떼 · 갑주어 · 놋쇠 잠수 인형 · [정예] 동굴 문어
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const ROOT = mat(ramp(0x5a4a3a), { tex: "wood", amp: 1.1 }), ROOTF = mat(rampF(0x463a2e), { tex: "wood", amp: 1 }), MOSS = mat(ramp(0x4a7a4a), { tex: "leaf", amp: 1 }), MOSSF = mat(rampF(0x3a5e3a), { tex: "leaf", amp: 0.9 });
const GLW = mat(rampGlow(0x9af0c0)), GLB = mat(rampGlow(0x80d8ff)), DARK = mat(ramp(0x121414)), BONE = mat(ramp(0xd8ccb0), { tex: "stone", amp: 0.5, spec: 0.3 });
const BRASS = mat(ramp(0xb08a44), { tex: "metal", amp: 0.8, spec: 0.7 }), BRASSF = mat(rampF(0x8a6a34), { tex: "metal", amp: 0.7 }), VERD = mat(ramp(0x5a9a80), { tex: "metal", amp: 1, spec: 0.4 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];

// ════ 뿌리 나무늘보 ════ 이끼와 물풀이 자란 덥수룩한 털 · 길고 굽은 갈고리 발톱 · 눈 둘레 검은 무늬 · 느릿하지만 휘두르면 아프다
//   p: legs · bob · sw · hurt
const SLK = 0.72;
const SLF = mat(ramp(0x7a6a50), { tex: "fur", amp: 1.2, dir: 1.4 }), SLFF = mat(rampF(0x5e5240), { tex: "fur", amp: 1.1, dir: 1.4 }), SLFC = mat(ramp(0xc8b898), { tex: "fur", amp: 0.8 });
function slothFrame(p = {}) {
  const W = 104, H = 80, G = H - 1, S = sculpt(W, H, { k: SLK, ax: 46 });
  const b = p.bob ?? 0, lg = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 42;
  // 뒷다리 (짧고 굵음)
  for (const [o, far, d] of [[lg.f, 1, -10], [lg.n, 0, -6]]) { const hp = [cx + d, 54 + b], ft = [cx + d + o[0], G - 2 - o[1]]; S.add(capF(hp, ft, 6, 4), far ? SLFF : SLF, { z: far ? -3 : 3, h: 4 }); for (const e of [0.3, 0.7]) S.add(capF([ft[0] + 2, ft[1]], pol([ft[0] + 2, ft[1]], e, 5), 0.8, 0.3), BONE, { z: far ? -2.9 : 3.1, h: 0.5 }); }
  // 먼 팔 (길고 갈고리)
  const shF = [cx + 4, 34 + b], hF = sw > 0 ? pol(shF, L(1.4, -0.2, Math.min(1, sw / 2)), 30) : [cx + 12, G - 4];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 4.6, 3.6), capF(lerp(shF, hF, 0.5), hF, 3.6, 3)), SLFF, { z: -2, h: 3 });
  for (const d of [-0.3, 0.2]) { const a = Math.atan2(hF[1] - shF[1], hF[0] - shF[0]) + d; S.add(U(capF(hF, pol(hF, a, 7), 1.2, 0.6), capF(pol(hF, a, 7), pol(pol(hF, a, 7), a + 1.4, 4), 0.6, 0.2)), BONE, { z: -1.9, h: 0.6 }); }
  // 몸 (덥수룩 · 이끼)
  S.add(U(ellR(cx - 2, 44 + b, 18, 15)), SLF, { z: 1, h: 13 });
  for (let k = 0; k < 9; k++) S.add(capF([cx - 16 + k * 4, 36 + b + (k % 2) * 4], [cx - 18 + k * 4, 56 + b + (k % 3) * 2], 1.4, 0.6), SLFF, { lift: 0.8, h: 0.8 });
  for (const [x, y, r] of [[cx - 10, 34, 6], [cx + 4, 32, 5], [cx - 2, 42, 4], [cx - 14, 46, 4]]) S.add(ellR(x, y + b, r, r * 0.6), MOSS, { lift: 1.2, h: 1.6 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 12 + k * 7, 56 + b], [cx - 13 + k * 7 + Math.sin(k) * 2, 64 + b], 0.8, 0.4), MOSSF, { lift: 0.6, h: 0.4 });
  // 머리 (둥근 얼굴 · 검은 눈 무늬)
  const hx = cx + 16, hy = 30 + b;
  S.add(ellR(hx, hy, 8, 7), SLF, { z: 3, h: 6 });
  S.add(ellR(hx + 3, hy + 1, 5.4, 4.6), SLFC, { z: 3.2, h: 4 });
  S.add(capF([hx + 1, hy - 1], [hx + 7, hy + 1.4], 1.4, 1), mat(ramp(0x2a221a), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(hx + 7, hy + 2, 1.6, 1.2), DARK, { z: 3.4, h: 0.6 });
  S.carve(capF([hx + 4, hy + 4.4], [hx + 7, hy + 4], 0.4), 0.8);
  !p.hurt && S.decal(hx + 4.4, hy, 0x101010).decal(hx + 4.6, hy - 0.4, 0x9af0c0);
  // 가까운 팔
  const sh = [cx + 10, 36 + b], hN = sw <= 1 ? lerp([cx + 22, G - 4], pol(sh, -1.4, 28), sw) : lerp(pol(sh, -1.4, 28), pol(sh, 0.4, 34), Math.min(1, sw - 1));
  S.add(U(capF(sh, lerp(sh, hN, 0.5), 5, 4), capF(lerp(sh, hN, 0.5), hN, 4, 3.4)), SLF, { z: 6, h: 3.4 });
  for (const d of [-0.3, 0.2]) { const a = Math.atan2(hN[1] - sh[1], hN[0] - sh[0]) + d; S.add(U(capF(hN, pol(hN, a, 8), 1.3, 0.6), capF(pol(hN, a, 8), pol(pol(hN, a, 8), a + 1.4, 4.4), 0.6, 0.2)), BONE, { z: 6.1, h: 0.6 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxSloth = {
  fw: Math.round(104 * SLK), fh: Math.round(80 * SLK), w: 26, h: 28,
  anims: { idle: [4, 2], move: [6, 4], wind: [3, 6, !1], atk: [3, 12, !1], rec: [3, 6, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait2(f, n, 3, 1.4); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { sw: t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 1 };
    if (nm === "rec") P = { sw: 2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return slothFrame(P);
  },
};

// ════ 꼽등이 ════ 등이 굽은 반투명 갈색 몸 · 몸보다 몇 배 긴 더듬이 · 굵은 뒷다리로 크게 뛴다 · 날개 없음
//   p: ph · crouch · leap · hurt
const CRK = 0.72;
const CRI = mat(ramp(0x9a7a5a, { hi: 0.5 }), { tex: "skin", amp: 0.7, spec: 0.5 }), CRIF = mat(rampF(0x7a5e44), { tex: "skin", amp: 0.6 });
function cricketFrame(p = {}) {
  const W = 96, H = 60, G = H - 1, S = sculpt(W, H, { k: CRK, ax: 44 });
  const ph = p.ph ?? 0, cr = p.crouch ?? 0, lp = p.leap ?? 0, cx = 40, by = G - 14 + cr * 4 - lp * 10;
  // 더듬이 (아주 길게 · 앞뒤로 휜다)
  for (const [d, z] of [[0, -1], [4, 3]]) { let q = [cx + 14, by - 6]; for (let k = 0; k < 8; k++) { const n2 = [q[0] + 4.4 - k * 0.4, q[1] - 2.4 + k * 0.9 + Math.sin(ph + k * 0.5 + d) * 0.8]; S.add(capF(q, n2, 0.4), CRIF, { z, h: 0.3 }); q = n2; } }
  // 다리 (먼 쪽)
  const hind = (far) => { const hp = [cx - 4, by], kn = [cx - 12 + lp * 4, by - 14 + cr * 4 - lp * 4], ft = [cx - 20 - lp * 10, G - 0.5 - lp * 2]; S.add(U(capF(hp, kn, far ? 2.4 : 3, 1.6), capF(kn, ft, 1, 0.6)), far ? CRIF : CRI, { z: far ? -2 : 5, h: 1.4 }); for (let k = 0; k < 4; k++) S.add(capF(lerp(kn, ft, 0.2 + k * 0.2), pol(lerp(kn, ft, 0.2 + k * 0.2), 2.4, 2), 0.3), CRIF, { z: far ? -1.9 : 5.1, h: 0.2 }); };
  const fore = (far) => { for (const [x, l] of [[cx + 6, 8], [cx + 12, 9]]) { const r0 = [x, by + 1], kn = [x + 4, by - 3], ft = [x + 6, G - 0.5 - lp * 6]; S.add(U(capF(r0, kn, 0.8), capF(kn, ft, 0.7, 0.4)), far ? CRIF : CRI, { z: far ? -1.5 : 4.5, h: 0.5 }); } };
  hind(1), fore(1);
  // 굽은 몸 (마디)
  S.add(U(ellR(cx, by - 4, 15, 8, -0.15), ellR(cx + 12, by - 4, 6, 6)), CRI, { z: 1, h: 7 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 12 + k * 4.4, by - 11 + Math.abs(k - 3)], [cx - 13 + k * 4.4, by + 2], 0.4), 0.7);
  S.add(ellR(cx - 2, by - 7, 10, 3), mat(ramp(0xc8a888)), { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(cx + 16, by - 3, 4, 4.4), CRI, { z: 2, h: 3 });
  !p.hurt && S.decal(cx + 17, by - 5, 0x101010);
  hind(0), fore(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxCricket = {
  fw: Math.round(96 * CRK), fh: Math.round(60 * CRK), w: 22, h: 14,
  anims: { idle: [4, 6], move: [4, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, crouch: [1, 0, 0, 0.5][f], leap: [0, 0.8, 0.6, 0][f] };
    if (nm === "wind") P = { ph, crouch: t };
    if (nm === "atk") P = { ph, leap: [0.8, 1, 0.6][f] };
    if (nm === "rec") P = { ph, crouch: 0.5 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, crouch: 0.6 };
    return cricketFrame(P);
  },
};

// ════ 덩굴뱀 ════ 뿌리에 감겨 매달린 가늘고 긴 초록 뱀 · 뾰족한 머리 · 가로 동공 · 번개처럼 튀어나와 문다
//   p: ph · strike · hurt
const VSK = 0.72;
const VSN = mat(ramp(0x5a9a4a), { tex: "scale", amp: 0.8, spec: 0.5 }), VSNF = mat(rampF(0x467a3a), { tex: "scale", amp: 0.7 }), VSNB = mat(ramp(0xc8d890), { tex: "scale", amp: 0.5 });
function vineSnakeFrame(p = {}) {
  const W = 96, H = 70, S = sculpt(W, H, { k: VSK, ax: 44 });
  const ph = p.ph ?? 0, sk = p.strike ?? 0, cx = 40;
  // 매달린 뿌리 (위에서 아래로)
  S.add(U(capF([cx - 16, 0], [cx - 14, 40], 3.4, 2.6), capF([cx - 14, 40], [cx - 18, 62], 2.6, 1.4)), ROOT, { z: -1, h: 2.4 });
  S.add(ellR(cx - 14, 22, 4, 2.4), MOSS, { z: -0.9, lift: 0.4, h: 1 });
  // 뿌리에 감긴 몸 → 앞으로 뻗은 목
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([cx - 14 + Math.sin(t * T2 * 1.5 + ph) * 4, 12 + t * 32]); }
  for (let i = 0; i < 8; i++) S.add(capF(pts[i], pts[i + 1], 1.6, 1.6), i % 2 ? VSN : VSNF, { z: Math.sin((i / 8) * T2 * 1.5 + ph) > 0 ? 1 : -1.5, h: 1.4 });
  const n0 = pts[8], hd = [n0[0] + 18 + sk * 26, n0[1] - 6 - sk * 2 + Math.sin(ph) * 1.4], mid = [L(n0[0], hd[0], 0.5) - 2 + sk * 4, n0[1] + 6 - sk * 6];
  S.add(U(capF(n0, mid, 1.8, 1.6), capF(mid, hd, 1.6, 1.4)), VSN, { z: 2, h: 1.4 });
  S.add(U(capF(lerp(n0, mid, 0.2), mid, 0.6), capF(mid, lerp(mid, hd, 0.8), 0.5)), VSNB, { on: 1, lift: 0.2, h: 0.2 });
  const na = Math.atan2(hd[1] - mid[1], hd[0] - mid[0]);
  S.add(U(ellR(...pol(hd, na, 2), 3.4, 2, na), polyF([pol(pol(hd, na, 2), na + 1.57, 2), pol(hd, na, 9), pol(pol(hd, na, 2), na - 1.57, 2)])), VSN, { z: 2.2, h: 1.6 });
  !p.hurt && S.decal(...pol(pol(hd, na, 4), na - 1.57, 1), 0xf0e060).decal(...pol(pol(hd, na, 4.6), na - 1.57, 1), 0x101010);
  if (sk > 0.4) S.add(polyF([pol(hd, na + 0.3, 6), pol(hd, na + 0.15, 10), pol(hd, na + 0.5, 9)]), mat(ramp(0xb03a3a)), { z: 2.1, h: 0.3 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxVineSnake = {
  fw: Math.round(96 * VSK), fh: Math.round(70 * VSK), w: 18, h: 18, flying: !0,
  anims: { idle: [6, 5], move: [6, 8], wind: [3, 9, !1], atk: [3, 20, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 1.6 };
    if (nm === "wind") P = { ph, strike: -0.4 * t };
    if (nm === "atk") P = { ph, strike: [0.8, 1, 0.9][f] };
    if (nm === "rec") P = { ph, strike: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, strike: -0.3 };
    return vineSnakeFrame(P);
  },
};

// ════ [정예] 실빛 거대 유충 ════ 천장 뿌리에 매달린 거대한 반투명 유충 · 몸 끝에서 청록 빛 · 아래로 늘어뜨린 끈끈한 빛 방울 실 수십 가닥 ·
//   실에 걸린 먹이의 뼈
//   p: ph · lower(실 내림) · reel(감아올림) · hurt
const GWK = 0.7;
const GWM = mat(ramp(0xb8b8a0, { hi: 0.55 }), { tex: "skin", amp: 0.6, spec: 0.5 }), GWMF = mat(rampF(0x949480), { tex: "skin", amp: 0.5 });
function glowwormFrame(p = {}) {
  const W = 140, H = 130, S = sculpt(W, H, { k: GWK, ax: 70 });
  const ph = p.ph ?? 0, lw = p.lower ?? 0, rl = p.reel ?? 0, cx = 70, cy = 26;
  // 천장 뿌리 덩어리
  S.add(U(ellR(cx, 4, 60, 10), ellR(cx - 30, 10, 20, 8), ellR(cx + 30, 9, 18, 8)), ROOT, { z: -2, h: 6 });
  for (let k = 0; k < 8; k++) S.add(capF([cx - 56 + k * 16, 8], [cx - 58 + k * 16 + Math.sin(k) * 4, 18 + (k % 3) * 4], 2, 1), ROOTF, { z: -1.8, h: 1 });
  // 끈끈한 빛 실 (늘어뜨림)
  for (let k = 0; k < 14; k++) { const x = cx - 52 + k * 8 + Math.sin(k * 1.7) * 3, l = (40 + ((k * 23) % 44)) * (0.5 + lw * 0.7) * (1 - rl * 0.6); for (let j = 0; j < 5; j++) { const y = cy + 6 + (l * (j + 1)) / 5, sx = x + Math.sin(ph + k + j) * 0.8; S.add(ellR(sx, y, 0.9 + (j === 4 ? 0.6 : 0), 1.1 + (j === 4 ? 0.8 : 0)), j === 4 ? GLB : mat(rampGlow(0x5aa8c8)), { z: 0, h: 0.4 }); } S.add(capF([x, cy + 4], [x + Math.sin(ph + k) * 0.8, cy + 6 + l], 0.25), mat(ramp(0xc8e0e8)), { z: -0.5, h: 0.2 }); }
  // 실에 걸린 뼈
  S.add(U(capF([cx - 24, cy + 46 * (0.5 + lw * 0.7) * (1 - rl * 0.6)], [cx - 18, cy + 52 * (0.5 + lw * 0.7) * (1 - rl * 0.6)], 1.2)), BONE, { z: 0.5, h: 0.8 });
  // 매달린 유충 몸 (마디 · 반투명) + 머리
  const bp = [];
  for (let i = 0; i <= 8; i++) bp.push([cx - 40 + i * 10, cy + Math.sin(ph + i * 0.7) * 3 + Math.sin((i / 8) * Math.PI) * 6]);
  for (let i = 0; i < 8; i++) S.add(capF(bp[i], bp[i + 1], 7 + Math.sin((i / 8) * Math.PI) * 4, 7 + Math.sin(((i + 1) / 8) * Math.PI) * 4), i % 2 ? GWM : GWMF, { z: 1, h: 8 });
  for (let i = 1; i < 8; i++) S.carve(capF([bp[i][0], bp[i][1] - 9], [bp[i][0] + 1, bp[i][1] + 9], 0.5), 0.6);
  S.add(ellR(bp[0][0] - 2, bp[0][1], 8, 7), GLB, { z: 1.2, h: 4 });
  S.add(ellR(bp[8][0] + 4, bp[8][1], 6, 5.4), mat(ramp(0x6a5a4a), { tex: "metal", spec: 0.5 }), { z: 1.4, h: 4 });
  for (const d of [-1, 1]) S.add(capF([bp[8][0] + 8, bp[8][1] + d * 2], [bp[8][0] + 13, bp[8][1] + d * 3 + 2], 0.8, 0.4), DARK, { z: 1.5, h: 0.5 });
  !p.hurt && S.decal(bp[8][0] + 6, bp[8][1] - 2, 0x101010);
  return fin(S.render({ rim: !0 }), p);
}
export const pxGlowworm = {
  fw: Math.round(140 * GWK), fh: Math.round(130 * GWK), w: 60, h: 30, flying: !0,
  anims: { idle: [6, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], reel: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, lower: 0.5 };
    if (nm === "move") P = { ph: ph * 1.4, lower: 0.5 };
    if (nm === "wind") P = { ph, lower: 0.5 + t * 0.5 };
    if (nm === "atk") P = { ph, lower: 1 };
    if (nm === "rec") P = { ph, lower: 1 - t * 0.5 };
    if (nm === "reel") P = { ph, lower: 1, reel: [0.2, 0.6, 1, 0.6][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph, lower: 0.3 };
    return glowwormFrame(P);
  },
};

// ════ 잠자리 유충 ════ 물속 사냥꾼 · 진흙빛 넓적한 몸 · 큰 겹눈 · 접혀 있던 아래턱(가면)이 번개처럼 튀어나와 문다 · 다리 여섯
//   p: ph · mask(0 접힘 ~ 1 쭉) · hurt
const NYK = 0.72;
const NYM = mat(ramp(0x6a6a4a), { tex: "skin", amp: 0.9, spec: 0.4 }), NYMF = mat(rampF(0x52523a), { tex: "skin", amp: 0.8 });
function nymphFrame(p = {}) {
  const W = 92, H = 48, G = H - 1, S = sculpt(W, H, { k: NYK, ax: 40 });
  const ph = p.ph ?? 0, mk = p.mask ?? 0, cx = 36, by = G - 10;
  const legs = (far) => { for (let k = 0; k < 3; k++) { const r0 = [cx + 2 + k * 4, by + 2], a = Math.sin(ph + k * 2 + (far ? 3 : 0)) * 3, kn = [cx - 4 + k * 10 + a, by - 5], ft = [cx - 8 + k * 13 + a * 1.4, G - 0.5]; S.add(U(capF(r0, kn, 1, 0.8), capF(kn, ft, 0.8, 0.4)), far ? NYMF : NYM, { z: far ? -2 : 5, h: 0.6 }); } };
  legs(1);
  // 배 (마디 · 끝 가시) + 날개 싹
  S.add(ellR(cx - 12, by - 1, 15, 6.4), NYM, { z: 1, h: 5 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 24 + k * 4.4, by - 6], [cx - 25 + k * 4.4, by + 5], 0.4), 0.7);
  for (const d of [-1.2, 0, 1.2]) S.add(polyF([[cx - 26, by - 1 + d], [cx - 32, by - 2 + d * 2], [cx - 26, by + d * 0.6]]), NYMF, { z: 0.8, h: 0.6, prof: "sharp" });
  S.add(polyF([[cx - 4, by - 6], [cx - 14, by - 9], [cx - 16, by - 6], [cx - 6, by - 4]]), NYMF, { lift: 0.8, h: 1 });
  // 가슴 + 머리 + 겹눈
  S.add(ellR(cx + 3, by - 2, 7, 5.4), NYM, { z: 2, h: 4 });
  S.add(ellR(cx + 12, by - 3, 6, 5), NYM, { z: 3, h: 4 });
  for (const [d, z] of [[-1, 2.8], [1, 3.4]]) S.add(ellR(cx + 13 + d * 0.6, by - 7 + d * 0.4, 3.4, 3), mat(ramp(0x4a5a3a), { tex: "scale", spec: 0.7 }), { z, h: 2 });
  !p.hurt && S.decal(cx + 14, by - 8, 0xe0f0a0);
  // 아래턱 가면 (팔꿈치처럼 접혔다가 쭉)
  const m0 = [cx + 14, by + 1], m1 = [cx + 10 + mk * 10, by + 3], m2 = [cx + 18 + mk * 22, by + 1 - mk * 2];
  S.add(U(capF(m0, m1, 1.4, 1.2), capF(m1, m2, 1.2, 1.6)), NYMF, { z: 4, h: 1 });
  for (const d of [-1, 1]) S.add(polyF([pol(m2, d * 1.2, 1.4), pol(m2, d * 0.5, 5), pol(m2, 0, 2)]), mat(ramp(0x3a3a2a), { spec: 0.5 }), { z: 4.2, h: 0.6, prof: "sharp" });
  legs(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxNymph = {
  fw: Math.round(92 * NYK), fh: Math.round(48 * NYK), w: 24, h: 12,
  anims: { idle: [4, 4], move: [6, 10], wind: [3, 9, !1], atk: [3, 22, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { ph };
    if (nm === "wind") P = { mask: -0.2 * t };
    if (nm === "atk") P = { mask: [0.8, 1, 0.6][f] };
    if (nm === "rec") P = { mask: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, mask: 0.3 };
    return nymphFrame(P);
  },
};

// ════ 큰수달 ════ 젖어 윤기 나는 짙은 갈색 털 · 목의 크림색 얼룩 · 납작한 머리와 수염 · 굵은 꼬리 · 물갈퀴 발 · 사납게 문다
//   p: legs · bob · crouch · lunge · jaw · hurt
const OTK = 0.72;
const OTR = mat(ramp(0x4a3a2e), { tex: "fur", amp: 0.8, dir: 0.2, spec: 0.5 }), OTRF = mat(rampF(0x3a2e24), { tex: "fur", amp: 0.7, dir: 0.2 }), OTRC = mat(ramp(0xd8c8a8), { tex: "fur", amp: 0.6 });
function otterFrame(p = {}) {
  const W = 104, H = 50, G = H - 1, S = sculpt(W, H, { k: OTK, ax: 48 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, lu = p.lunge ?? 0, jw = p.jaw ?? 0, cx = 46;
  const lgf = (sh, o, far) => { const ft = [sh[0] + o[0], G - 1.5 - o[1]]; S.add(capF(sh, ft, far ? 2.8 : 3.2, 2.4), far ? OTRF : OTR, { z: far ? -3 : 5, h: 2 }); S.add(ellR(ft[0] + 2, ft[1], 3.4, 1.4), far ? OTRF : OTR, { z: far ? -2.9 : 5.1, h: 1 }); };
  lgf([cx + 14, 36 + b], lg.ff, 1), lgf([cx - 14, 36 + b], lg.bf, 1);
  // 굵은 꼬리
  S.add(U(capF([cx - 24, 34 + b], [cx - 36, 40 + b], 5, 3.4), capF([cx - 36, 40 + b], [cx - 46, 42 + b + Math.sin(p.ph ?? 0) * 2], 3.4, 1.4)), OTR, { z: 0, h: 3 });
  // 긴 몸
  S.add(U(ellR(cx - 4, 33 + b, 22, 8), ellR(cx + 14, 31 + b - lu * 2, 9, 7.4)), OTR, { z: 1, h: 7 });
  S.add(capF([cx - 22, 30 + b], [cx + 16, 26 + b], 1.4), mat(ramp(0x8a7a6a), { tex: "fur" }), { on: 1, lift: 0.4, h: 0.3 });
  // 머리 (납작 · 크림 목 · 수염)
  const hx = cx + 26 + lu * 6, hy = 28 + b - lu * 2;
  S.add(ellR(cx + 18, 32 + b, 6, 4), OTRC, { on: 1, lift: 0.3, h: 0.5 });
  S.add(U(ellR(hx, hy, 7, 5.4), capF([hx + 3, hy + 1], [hx + 10, hy + 2], 3.6, 2.6)), OTR, { z: 3, h: 4 });
  S.add(capF([hx + 3, hy + 3 + jw], [hx + 9, hy + 4 + jw * 3], 2, 1.4), OTRC, { z: 2.9, h: 1.4 });
  if (jw > 0.3) for (const x of [hx + 5, hx + 8]) S.add(polyF([[x - 0.6, hy + 2.6], [x + 0.6, hy + 2.6], [x, hy + 4.4]]), BONE, { z: 3.2, h: 0.4 });
  S.add(ellR(hx + 10.4, hy + 1, 1.2, 1), DARK, { lift: 0.6, h: 0.4 });
  S.add(ellR(hx - 3, hy - 4, 1.6, 1.4), OTR, { z: 3.1, h: 1 });
  for (const d of [-1, 0, 1]) S.add(capF([hx + 8, hy + 2 + d * 0.6], [hx + 14, hy + 1 + d * 2], 0.25), mat(ramp(0xe8e0d0)), { z: 3.3, h: 0.2 });
  !p.hurt && S.decal(hx + 3, hy - 1.6, 0x101010).decal(hx + 3.4, hy - 2, 0x9af0c0);
  lgf([cx + 16, 37 + b], lg.fn, 0), lgf([cx - 12, 37 + b], lg.bn, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxOtter = {
  fw: Math.round(104 * OTK), fh: Math.round(50 * OTK), w: 28, h: 14,
  anims: { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") P = { legs: gait4(f, n, 5, 2.4), bob: Math.sin(ph * 2) * 1.2, ph };
    if (nm === "wind") P = { crouch: t, jaw: 0.5 * t, ph };
    if (nm === "atk") P = { lunge: [0.8, 1, 0.6][f], jaw: [1, 0.2, 0][f], ph };
    if (nm === "rec") P = { crouch: 0.4 * (1 - t), ph };
    if (nm === "hurt") P = { hurt: f === 0, jaw: 0.8, crouch: 0.4, ph };
    return otterFrame(P);
  },
};

// ════ 물장군 ════ 넓적한 타원 등판의 거대 물벌레 · 낫처럼 접힌 굵은 앞다리로 움켜쥔다 · 찌르는 주둥이 · 노 같은 뒷다리
//   p: ph · grab · stab · hurt
const WBK = 0.72;
const WBG = mat(ramp(0x5a4a34), { tex: "metal", amp: 0.7, spec: 0.5 }), WBGF = mat(rampF(0x463a28), { tex: "metal", amp: 0.6 });
function waterbugFrame(p = {}) {
  const W = 88, H = 50, G = H - 1, S = sculpt(W, H, { k: WBK, ax: 40 });
  const ph = p.ph ?? 0, gb = p.grab ?? 0, sb = p.stab ?? 0, cx = 36, by = G - 12;
  const oar = (far) => { const r0 = [cx - 6, by + 2], kn = [cx - 16, by - 2 + Math.sin(ph + (far ? 3 : 0)) * 2], ft = [cx - 26, by + 6 + Math.sin(ph + (far ? 3 : 0)) * 3]; S.add(U(capF(r0, kn, 1.4), capF(kn, ft, 1.2, 0.8)), far ? WBGF : WBG, { z: far ? -2 : 5, h: 0.8 }); for (let k = 0; k < 4; k++) S.add(capF(lerp(kn, ft, 0.2 + k * 0.2), pol(lerp(kn, ft, 0.2 + k * 0.2), 1.8, 2.4), 0.3), WBGF, { z: far ? -1.9 : 5.1, h: 0.2 }); };
  oar(1);
  for (const far of [1]) { const r0 = [cx + 2, by + 2], ft = [cx + 6, G - 0.5]; S.add(capF(r0, ft, 1, 0.6), WBGF, { z: -1.5, h: 0.5 }); }
  // 등판 (넓적한 타원 · 날개 겹선)
  S.add(ellR(cx - 2, by - 3, 20, 9), WBG, { z: 1, h: 6 });
  S.carve(capF([cx - 20, by - 3], [cx + 8, by - 6], 0.5), 0.8);
  S.carve(capF([cx - 4, by - 11], [cx - 6, by + 4], 0.5), 0.7);
  S.add(ellR(cx - 6, by - 6, 10, 3), mat(ramp(0x7a6a4a)), { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(cx + 16, by - 2, 5, 4), WBG, { z: 2, h: 3 });
  !p.hurt && S.decal(cx + 17, by - 4, 0xe0f0a0);
  S.add(capF([cx + 20, by - 1], [cx + 26 + sb * 6, by + 1 + sb * 2], 0.9, 0.4), WBGF, { z: 2.2, h: 0.6 });
  // 낫 앞다리 (움켜쥐기)
  for (const [d, z] of [[-1, 1.5], [1, 6]]) { const r0 = [cx + 12, by + 1 + d], fem = [cx + 18 + gb * 8, by - 6 - gb * 2 + d], tib = [cx + 16 + gb * 18, by + 2 - gb * 4 + d]; S.add(U(capF(r0, fem, 2.6, 2.2), capF(fem, tib, 1.6, 0.6)), d < 0 ? WBGF : WBG, { z, h: 1.4 }); for (let k = 0; k < 3; k++) S.add(polyF([pol(lerp(r0, fem, 0.4 + k * 0.2), 1.6, 0.4), pol(lerp(r0, fem, 0.4 + k * 0.2), 1.9, 2), pol(lerp(r0, fem, 0.5 + k * 0.2), 1.6, 0.4)]), WBGF, { z: z + 0.05, h: 0.3 }); }
  oar(0);
  { const r0 = [cx + 4, by + 3], ft = [cx + 9, G - 0.5]; S.add(capF(r0, ft, 1.1, 0.6), WBG, { z: 4.5, h: 0.5 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxWaterbug = {
  fw: Math.round(88 * WBK), fh: Math.round(50 * WBK), w: 24, h: 14,
  anims: { idle: [4, 5], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], stab: [3, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { ph };
    if (nm === "wind") P = { grab: -0.3 * t };
    if (nm === "atk") P = { grab: [0.8, 1, 0.6][f] };
    if (nm === "rec") P = { grab: 0.6 * (1 - t) };
    if (nm === "stab") P = { grab: 0.6, stab: [0.6, 1, 0.6][f] };
    if (nm === "hurt") P = { hurt: f === 0, grab: 0.3 };
    return waterbugFrame(P);
  },
};

// ════ [정예] 아나콘다 ════ 굵고 긴 올리브빛 큰뱀 · 등의 검은 둥근 무늬 · 누런 배 · 무거운 머리와 노란 눈 · 휘감아 조인다
//   p: ph · rise · strike · coil · hurt
const ANK = 0.7;
const ANA = mat(ramp(0x5a6a3a), { tex: "scale", amp: 1, spec: 0.5 }), ANAF = mat(rampF(0x46542e), { tex: "scale", amp: 0.9 }), ANAB = mat(ramp(0xc8b878), { tex: "scale", amp: 0.6 }), ANAD = mat(ramp(0x2a2a1e), { tex: "scale", amp: 0.7 });
function anacondaFrame(p = {}) {
  const W = 190, H = 92, G = H - 1, S = sculpt(W, H, { k: ANK, ax: 92 });
  const ph = p.ph ?? 0, rs = p.rise ?? 0, sk = p.strike ?? 0, co = p.coil ?? 0, cx = 90;
  // 몸 (뒤에서 앞으로 S자 · coil 이면 둥글게 감는다)
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, head = Math.max(0, i - 15) / 5;
    let x = cx - 80 + i * 8 + head * sk * 26, y = G - 7 - Math.sin(t * T2 * 1.2 + ph) * 3 * (1 - head) - head * head * rs * 34;
    if (co > 0 && i < 16) { const a = t * T2 * 1.3, r = 22 - t * 6; x = L(x, cx - 10 + Math.cos(a) * r, co); y = L(y, G - 26 + Math.sin(a) * r * 0.7, co); }
    pts.push([x, y]);
  }
  for (let i = 0; i < 20; i++) { const w = 3 + Math.sin(((i + 2) / 22) * Math.PI) * 6; S.add(capF(pts[i], pts[i + 1], w, w), i % 2 ? ANA : ANAF, { z: (co > 0 ? Math.sin((i / 20) * T2 * 1.3) * 3 : 0) + i * 0.03, h: w * 0.8 }); }
  for (let i = 1; i < 19; i += 2) S.add(ellR(pts[i][0], pts[i][1] - 2, 2.6, 2), ANAD, { on: 1, lift: 0.3, h: 0.3 });
  for (let i = 0; i < 20; i++) S.add(capF([pts[i][0], pts[i][1] + 3], [pts[i + 1][0], pts[i + 1][1] + 3], 1.2), ANAB, { on: 1, lift: 0.1, h: 0.2 });
  // 머리 (무겁고 넓적)
  const hd = pts[20], na = Math.atan2(hd[1] - pts[18][1], hd[0] - pts[18][0]), H0 = pol(hd, na, 4);
  S.add(U(ellR(H0[0], H0[1], 9, 6.4, na), capF(H0, pol(H0, na, 12), 6, 3.6)), ANA, { z: 2, h: 5 });
  S.add(capF(pol(pol(H0, na, -2), na - 1.57, 3), pol(pol(H0, na, 10), na - 1.57, 2), 1), ANAD, { on: 1, lift: 0.3, h: 0.3 });
  if (sk > 0.4) { S.add(polyF([pol(H0, na + 0.5, 4), pol(H0, na + 0.25, 14), pol(pol(H0, na + 1.57, 6), na, 10)]), mat(ramp(0xb06a6a)), { z: 1.9, h: 0.4 }); for (const d of [6, 10]) S.add(polyF([pol(pol(H0, na, d), na + 1.57, 1), pol(pol(H0, na, d + 1), na + 1.57, 1), pol(pol(H0, na, d + 0.5), na + 1.57, 3)]), BONE, { z: 2.1, h: 0.3 }); }
  !p.hurt && S.decal(...pol(pol(H0, na, 3), na - 1.57, 2.4), 0xe8d040).decal(...pol(pol(H0, na, 3.4), na - 1.57, 2.4), 0x101010);
  return fin(S.render({ rim: !0 }), p);
}
export const pxAnaconda = {
  fw: Math.round(190 * ANK), fh: Math.round(92 * ANK), w: 60, h: 20,
  anims: { idle: [6, 4], move: [6, 8], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], coil: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, rise: 0.3 };
    if (nm === "move") P = { ph: -ph, rise: 0.2 };
    if (nm === "wind") P = { ph, rise: 0.3 + 0.7 * t, strike: -0.4 * t };
    if (nm === "atk") P = { ph, rise: 0.8, strike: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { ph, rise: 0.8 - 0.5 * t, strike: 1 - t };
    if (nm === "coil") P = { ph, coil: [0.4, 0.8, 1, 0.6][f], rise: 0.6 };
    if (nm === "hurt") P = { hurt: f === 0, ph, rise: 0.5 };
    return anacondaFrame(P);
  },
};

// ════ 장님 물고기 떼 ════ 눈이 퇴화한 창백한 분홍빛 동굴 물고기 여섯 마리 · 반투명 지느러미 · 떼 지어 휘돌며 몰려든다
//   p: ph · tight · hurt
const CFK = 0.72;
const CFS = mat(ramp(0xe0c0c0, { hi: 0.55 }), { tex: "scale", amp: 0.6, spec: 0.6 }), CFSF = mat(rampF(0xc0a0a0), { tex: "scale", amp: 0.5 });
function cavefishFrame(p = {}) {
  const W = 80, H = 60, S = sculpt(W, H, { k: CFK, ax: 40 });
  const ph = p.ph ?? 0, tg = p.tight ?? 0, cx = 40, cy = 30, sp = 1 - tg * 0.5;
  const fish = [];
  for (let k = 0; k < 6; k++) fish.push([[cx + Math.cos(ph + k * 1.05) * 20 * sp, cy + Math.sin(ph * 1.3 + k * 1.9) * 12 * sp], Math.sin(ph * 1.3 + k * 1.9), k]);
  fish.sort((A, B) => A[1] - B[1]);
  for (const [q, d, k] of fish) {
    const s = 1 + d * 0.15, a = Math.sin(ph * 2 + k) * 0.25, z = d * 3;
    S.add(polyF([pol(q, a + Math.PI, 7 * s), pol(pol(q, a + Math.PI, 11 * s), a + 1.57, 3 * s), pol(pol(q, a + Math.PI, 10 * s), a, 0), pol(pol(q, a + Math.PI, 11 * s), a - 1.57, 3 * s)]), CFSF, { z: z - 0.1, h: 0.6, prof: "flat" });
    S.add(ellR(q[0], q[1], 7 * s, 3 * s, a), CFS, { z, h: 2.4 });
    S.add(polyF([pol(q, a - 1.57, 2 * s), pol(pol(q, a + Math.PI, 4 * s), a - 1.57, 5 * s), pol(q, a + Math.PI, 3 * s)]), CFSF, { z: z + 0.1, h: 0.4, prof: "flat" });
    S.add(ellR(...pol(q, a, 5 * s), 1, 0.8), mat(ramp(0xc8a0a0)), { z: z + 0.2, h: 0.4 });
    S.carve(capF(pol(q, a, 3 * s), pol(pol(q, a, 3 * s), a + 1.57, 2 * s), 0.3), 0.6);
  }
  return fin(S.render({ rim: !0 }), p);
}
export const pxCavefish = {
  fw: Math.round(80 * CFK), fh: Math.round(60 * CFK), w: 28, h: 22, flying: !0,
  anims: { idle: [6, 10], move: [6, 12], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph: ph * 2, tight: t };
    if (nm === "atk") P = { ph: ph * 2, tight: 1 - t * 0.5 };
    if (nm === "rec") P = { ph, tight: 0.5 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, tight: -0.3 };
    return cavefishFrame(P);
  },
};

// ════ 갑주어 ════ 머리와 앞몸을 덮은 두꺼운 뼈 판 갑옷 · 이빨 대신 칼날 같은 턱판 · 뒤로 갈수록 미끈한 몸과 꼬리 · 작은 눈
//   p: ph · jaw · lunge · hurt
const PDK = 0.72;
const PLT = mat(ramp(0x6a7078), { tex: "stone", amp: 0.9, spec: 0.5 }), PLTF = mat(rampF(0x52585e), { tex: "stone", amp: 0.8 }), PDB = mat(ramp(0x4a5a5a), { tex: "skin", amp: 0.7, spec: 0.5 });
function placodermFrame(p = {}) {
  const W = 112, H = 60, S = sculpt(W, H, { k: PDK, ax: 54 });
  const ph = p.ph ?? 0, jw = p.jaw ?? 0, lu = p.lunge ?? 0, cx = 52 + lu * 6, cy = 30;
  S.add(polyF([[cx - 30, cy], [cx - 46, cy - 12 + Math.sin(ph) * 3], [cx - 42, cy + Math.sin(ph) * 2], [cx - 48, cy + 10 + Math.sin(ph) * 3]]), PDB, { z: 0, h: 1.2, prof: "flat" });
  S.add(U(ellR(cx - 12, cy + 1, 22, 9), ellR(cx + 8, cy, 18, 13)), PDB, { z: 1, h: 10 });
  S.add(polyF([[cx - 14, cy - 8], [cx - 6, cy - 18 + Math.sin(ph) * 1.4], [cx, cy - 10]]), PDB, { z: 0.8, h: 1, prof: "flat" });
  // 뼈 판 갑옷 (머리 · 앞몸)
  S.add(U(ellR(cx + 12, cy - 1, 17, 13)), PLT, { lift: 1.4, h: 5 });
  for (const [a, b] of [[[cx + 2, cy - 12], [cx + 4, cy + 10]], [[cx + 14, cy - 13], [cx + 12, cy + 1]], [[cx - 2, cy - 2], [cx + 26, cy - 4]]]) S.carve(capF(a, b, 0.6), 1);
  for (const [x, y] of [[cx + 8, cy - 6], [cx + 18, cy - 8], [cx + 6, cy + 4]]) S.add(ellR(x, y, 1, 1), PLTF, { on: 1, lift: 0.3, h: 0.3 });
  // 칼날 턱판
  const jx = cx + 22;
  S.add(polyF([[jx, cy - 4], [jx + 12, cy - 2], [jx + 12, cy + 1], [jx, cy + 2]]), PLT, { z: 3, h: 2, prof: "sharp" });
  S.add(polyF([[jx, cy + 3 + jw * 2], [jx + 12, cy + 2 + jw * 9], [jx + 11, cy + 5 + jw * 9], [jx, cy + 7 + jw * 2]]), PLTF, { z: 2.8, h: 2, prof: "sharp" });
  jw > 0.3 && S.add(polyF([[jx, cy + 2], [jx + 12, cy + 1], [jx + 12, cy + 2 + jw * 9], [jx, cy + 3 + jw * 2]]), mat(ramp(0x6a2a2a)), { z: 2.7, h: 0.4 });
  S.add(ellR(cx + 18, cy - 4, 1.8, 1.8), DARK, { z: 3.2, lift: 0.3, h: 0.4 });
  !p.hurt && S.decal(cx + 18.4, cy - 4.4, 0x9af0c0);
  S.add(polyF([[cx + 2, cy + 8], [cx - 6, cy + 18], [cx + 6, cy + 12]]), PDB, { z: 3.5, h: 0.6, prof: "flat" });
  return fin(S.render({ rim: !0 }), p);
}
export const pxPlacoderm = {
  fw: Math.round(112 * PDK), fh: Math.round(60 * PDK), w: 34, h: 18, flying: !0,
  anims: { idle: [6, 5], move: [6, 8], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 1.6 };
    if (nm === "wind") P = { ph, jaw: t, lunge: -0.4 * t };
    if (nm === "atk") P = { ph, jaw: [1.2, 0, 0][f], lunge: [1, 1.4, 1][f] };
    if (nm === "rec") P = { ph, lunge: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, jaw: 0.6 };
    return placodermFrame(P);
  },
};

// ════ 놋쇠 잠수 인형 ════ 옛 수로 공사용 잠수 자동인형 · 둥근 놋쇠 투구와 동그란 유리창(속에 청록 불빛) · 녹청 슨 몸 · 무거운 납 장화 ·
//   등의 공기통에서 거품 · 팔 끝 회전 드릴
//   p: legs · bob · drill · spin · hurt
const DVK = 0.72;
function diverFrame(p = {}) {
  const W = 104, H = 92, G = H - 1, S = sculpt(W, H, { k: DVK, ax: 38 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, dr = p.drill ?? 0, sp = p.spin ?? 0, cx = 36;
  // 다리 (가죽 잠수복 · 납 장화)
  for (const [o, far, d] of [[g.f, 1, -5], [g.n, 0, 5]]) { const hp = [cx + d * 0.6, 60 + b], ft = [cx + d + o[0], G - 4 - o[1]]; S.add(capF(hp, ft, 5, 4.4), far ? mat(rampF(0x5a4a3a), { tex: "leather" }) : mat(ramp(0x6a5a44), { tex: "leather", amp: 1 }), { z: far ? -2 : 3, h: 4 }); S.add(U(ellR(ft[0] + 3, ft[1] + 1, 7, 3.4), capF([ft[0], ft[1] - 4], [ft[0], ft[1] + 2], 5)), far ? mat(rampF(0x4a4e52), { tex: "metal" }) : mat(ramp(0x5a6066), { tex: "metal", spec: 0.5 }), { z: far ? -1.9 : 3.1, h: 3 }); }
  // 공기통 (등) + 거품
  S.add(U(capF([cx - 12, 34 + b], [cx - 12, 54 + b], 5)), BRASSF, { z: -2, h: 4 });
  S.add(capF([cx - 12, 34 + b], [cx - 4, 30 + b], 1), BRASS, { z: -1.9, h: 0.8 });
  // 먼 팔
  const shF = [cx - 4, 40 + b], hF = [cx + 2 + dr * 6, 58 + b - dr * 8];
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 3.4, 3), capF(lerp(shF, hF, 0.5), hF, 3, 2.6)), mat(rampF(0x5a4a3a), { tex: "leather" }), { z: -1, h: 2.6 });
  S.add(ellR(hF[0], hF[1], 3.4, 3), VERD, { z: -0.9, h: 2 });
  // 몸 (녹청 놋쇠 흉갑 · 리벳)
  S.add(U(ellR(cx, 46 + b, 13, 14), polyF([[cx - 12, 46 + b], [cx + 12, 46 + b], [cx + 11, 62 + b], [cx - 11, 62 + b]])), mat(ramp(0x6a5a44), { tex: "leather", amp: 1 }), { z: 1, h: 10 });
  S.add(U(ellR(cx, 40 + b, 13, 8)), VERD, { lift: 1.2, h: 4 });
  for (let k = 0; k < 7; k++) S.add(ellR(...pol([cx, 40 + b], Math.PI + (k / 6) * Math.PI, 11), 0.9, 0.9), BRASS, { on: 1, lift: 0.5, h: 0.4 });
  S.add(capF([cx - 12, 60 + b], [cx + 12, 60 + b], 1.6), mat(ramp(0x3a3028), { tex: "leather" }), { z: 2, h: 1.4 });
  // 투구 (둥근 놋쇠 · 앞 · 옆 유리창)
  const hx = cx + 3, hy = 24 + b;
  S.add(ellR(hx, hy, 11, 11), BRASS, { z: 3, h: 9 });
  S.add(ellR(hx + 6, hy + 1, 5, 5), BRASSF, { z: 3.4, h: 3 });
  S.add(ellR(hx + 7, hy + 1, 3.6, 3.6), mat(rampGlow(0x50e0c8)), { z: 3.6, h: 1.6 });
  S.add(ellR(hx - 3, hy - 1, 3, 3), BRASSF, { z: 3.2, lift: 0.4, h: 1.4 });
  S.add(ellR(hx - 3, hy - 1, 2, 2), mat(ramp(0x2a3a3a), { tex: "glass", spec: 0.8 }), { z: 3.3, lift: 0.6, h: 0.6 });
  for (let k = 0; k < 6; k++) S.add(ellR(...pol([hx, hy], 2.2 + k * 0.5, 10), 0.8, 0.8), BRASS, { on: 1, lift: 0.4, h: 0.3 });
  S.add(capF([hx - 10, hy + 8], [hx + 10, hy + 9], 2), VERD, { z: 3.1, h: 2 });
  for (const [x, y, r] of [[hx - 2, hy - 6, 3], [hx + 4, hy + 6, 2]]) S.add(ellR(x, y, r, r * 0.7), VERD, { on: 1, lift: 0.3, h: 0.3 });
  !p.hurt && S.decal(hx + 7, hy, 0xffffff);
  // 가까운 팔 + 회전 드릴
  const sh = [cx + 8, 40 + b], hd = pol(sh, L(1, 0, dr), 18 + dr * 6);
  S.add(ellR(sh[0], sh[1], 5, 4.4), VERD, { z: 6, h: 3 });
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 3.6, 3.2), capF(lerp(sh, hd, 0.5), hd, 3.2, 3)), mat(ramp(0x6a5a44), { tex: "leather", amp: 1 }), { z: 6.2, h: 2.8 });
  const da = L(1, 0, dr), dt = pol(hd, da, 16);
  S.add(ellR(hd[0], hd[1], 4, 4), BRASS, { z: 6.4, h: 3 });
  S.add(polyF([pol(hd, da + 1.57, 3.4), dt, pol(hd, da - 1.57, 3.4)]), mat(ramp(0x8a8c90), { tex: "metal", spec: 0.7 }), { z: 6.5, h: 2, prof: "sharp" });
  for (let k = 0; k < 4; k++) { const t = 0.15 + k * 0.2 + ((sp * 0.2) % 0.2); S.carve(capF(pol(lerp(hd, dt, t), da + 1.57, 3.2 * (1 - t)), pol(lerp(hd, dt, t + 0.08), da - 1.57, 3.2 * (1 - t)), 0.4), 0.8); }
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, DVK, 38);
  for (let k = 0; k < 4; k++) { const q = P(cx - 6 + Math.sin(k * 2 + sp) * 2, 28 + b - k * 5 - ((sp * 3) % 5)); C.px(q[0], q[1], 0xc8f0f0); C.px(q[0] + 1, q[1], 0x9ad8d8); }
  return fin(C, p);
}
export const pxDiver = {
  fw: Math.round(104 * DVK), fh: Math.round(92 * DVK), w: 18, h: 30,
  anims: { idle: [4, 4], move: [6, 5], wind: [3, 8, !1], atk: [4, 16], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, spin: f };
    if (nm === "move") { const g = gait2(f, n, 3, 1.2); P = { legs: g, bob: g.bob, spin: f }; }
    if (nm === "wind") P = { drill: t, spin: f * 2 };
    if (nm === "atk") P = { drill: 1, spin: f * 3, bob: [0, 1, 0, 1][f] };
    if (nm === "rec") P = { drill: 1 - t, spin: f };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, spin: 0 };
    return diverFrame(P);
  },
};

// ════ [정예] 동굴 문어 ════ 물 고인 굴 바닥을 차지한 거대한 문어 · 붉은 갈색 주름 외투막 · 가로 동공의 금빛 눈 · 빨판이 줄지은 팔 여덟 ·
//   팔을 휘둘러 내리치고 감아 끌어당기며 먹물을 뿜는다
//   p: ph · lash(앞 팔 휘두르기) · grab · ink · hurt
const OCK = 0.7;
const OCT = mat(ramp(0x9a4a3a), { tex: "skin", amp: 1, spec: 0.5 }), OCTF = mat(rampF(0x7a3a2e), { tex: "skin", amp: 0.9 }), OCTS = mat(ramp(0xe0b0a0), { tex: "skin", amp: 0.5 });
function octopusFrame(p = {}) {
  const W = 176, H = 112, G = H - 1, S = sculpt(W, H, { k: OCK, ax: 84 });
  const ph = p.ph ?? 0, ls = p.lash ?? 0, gr = p.grab ?? 0, cx = 80, cy = 46;
  const arm = (k, far) => {
    const side = k < 4 ? 1 : -1, r0 = [cx + (k % 4) * 6 * side - side * 4, cy + 22], front = k === 0 || k === 1;
    let q = r0, a0 = side > 0 ? 0.6 - (k % 4) * 0.3 : Math.PI - 0.6 + (k % 4) * 0.3;
    const M0 = far ? OCTF : OCT, z = far ? -3 + k * 0.05 : 3 + k * 0.05;
    for (let j = 0; j < 9; j++) {
      let a = a0 + Math.sin(ph + j * 0.6 + k) * 0.25 + j * 0.12 * side;
      if (front && ls > 0) a = L(a, -Math.PI / 2 + 0.3 + j * 0.25 * (ls > 0.6 ? 1.6 : 0.3), ls * 0.8);
      if (front && gr > 0) a = L(a, -0.2 + j * 0.45, gr);
      const l = 7.4 - j * 0.4, n2 = pol(q, a, l), w = 6 - j * 0.6;
      S.add(capF(q, n2, w, w - 0.6), M0, { z, h: w * 0.7 });
      !far && j > 1 && S.add(ellR(...pol(lerp(q, n2, 0.5), a + 1.57, w * 0.5), w * 0.3, w * 0.3), OCTS, { z: z + 0.05, h: 0.4 });
      q = n2;
    }
  };
  for (const k of [2, 3, 5, 6, 7]) arm(k, 1);
  // 외투막 (주름 · 뒤로 늘어진 머리)
  S.add(U(ellR(cx - 8, cy - 8, 26, 22, -0.3), ellR(cx + 6, cy + 10, 22, 16)), OCT, { z: 1, h: 18 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 28 + k * 7, cy - 22 + k * 3], [cx - 24 + k * 7, cy - 6 + k * 3], 0.6), 0.7);
  for (const [x, y, r] of [[cx - 16, cy - 16, 3], [cx - 2, cy - 6, 2.4], [cx - 22, cy, 2.6], [cx + 8, cy + 4, 2]]) S.add(ellR(x, y, r, r * 0.7), OCTF, { on: 1, lift: 0.3, h: 0.4 });
  // 눈 (가로 동공) + 깔때기
  for (const [x, y, z] of [[cx + 14, cy + 4, 4], [cx + 2, cy + 6, 2]]) { S.add(ellR(x, y, 5, 4.4), OCT, { z, h: 3 }); S.add(ellR(x + 1, y, 3.4, 3), mat(ramp(0xd8b040), { spec: 0.7 }), { z: z + 0.2, h: 1.4 }); !p.hurt && S.add(capF([x - 1, y], [x + 3, y], 0.8), DARK, { z: z + 0.3, h: 0.3 }); }
  S.add(capF([cx - 4, cy + 16], [cx - 14, cy + 20], 3, 2.4), OCTF, { z: 2, h: 2 });
  for (const k of [0, 1, 4]) arm(k, 0);
  const C = S.render({ rim: !0 });
  if (p.ink) { const P = toPx(W, H, OCK, 84); for (let k = 0; k < 24; k++) { const q = P(cx - 16 - k * 2 + Math.sin(k) * 4, cy + 22 + Math.cos(k * 1.3) * 6); C.px(q[0], q[1], 0x1a1424); C.px(q[0] + 1, q[1], 0x2a2034); } }
  return fin(C, p);
}
export const pxOctopus = {
  fw: Math.round(176 * OCK), fh: Math.round(112 * OCK), w: 50, h: 44,
  anims: { idle: [6, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], grab: [4, 10, !1], ink: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 1.6 };
    if (nm === "wind") P = { ph, lash: 0.5 * t };
    if (nm === "atk") P = { ph, lash: [0.7, 1, 1][f] };
    if (nm === "rec") P = { ph, lash: 1 - t };
    if (nm === "grab") P = { ph, grab: [0.3, 0.8, 1, 0.6][f] };
    if (nm === "ink") P = { ph, ink: f > 0 };
    if (nm === "hurt") P = { hurt: f === 0, ph, grab: 0.4 };
    return octopusFrame(P);
  },
};
