// 본디프 몬스터 12종 (조각 도구, 오른쪽을 본다) — 거대 짐승 뼈 협곡 · 등뼈와 갈비뼈 아치 · 해골 더미 · 따뜻한 흙빛 어둠
//   위 줄: 대머리황새 · 뼈 가면 사냥꾼 · 벌거숭이 두더지쥐 · [정예] 뼈 갑주 매머드
//   가운데 줄: 골수 점액 · 척추 뱀 · 뼈 점술사 · [정예] 뼈무더기 거인
//   아래 줄: 시체 구더기 · 구울 · 부패 쉬파리 · [정예] 무덤지기 거인
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm } from "./px_ah.js";

const BONE = mat(ramp(0xdcd0b4), { tex: "stone", amp: 0.5, spec: 0.3 }), BONEF = mat(rampF(0xb0a48a), { tex: "stone", amp: 0.5 });
const OLDB = mat(ramp(0xc4a878), { tex: "stone", amp: 0.7, spec: 0.2 }), OLDBF = mat(rampF(0x9a8460), { tex: "stone", amp: 0.6 });
const VD = mat(ramp(0x140e0a)), SINEW = mat(ramp(0x7a3a2e), { tex: "skin", amp: 0.9, spec: 0.3 }), BLOOD = mat(ramp(0x5a1a16));
const LEATH = mat(ramp(0x6a4a32), { tex: "leather", amp: 1 }), LEATHF = mat(rampF(0x4e3626), { tex: "leather", amp: 0.9 });
const FUR = mat(ramp(0x6a5038, { hi: 0.4 }), { tex: "fur", amp: 1.2, dir: 1.4 }), FURF = mat(rampF(0x4e3a28), { tex: "fur", amp: 1.1, dir: 1.4 });
const WOOD = mat(ramp(0x5a4030), { tex: "wood", amp: 1 }), IRON = mat(ramp(0x5e5a58), { tex: "metal", amp: 0.9, spec: 0.5 });
const GGL = mat(rampGlow(0xb8e070)), GGLW = mat(rampGlow(0xf0ffd0)), EMB = mat(rampGlow(0xffb060));
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 뼛가루 (렌더 뒤)
function dust(C, P, cx, cy, r, n, ph, c0 = 0xc8b898, c1 = 0x8a7a60) { for (let k = 0; k < n; k++) { const a = ph + k * 2.39, rr = r * (0.5 + ((k * 7) % 5) / 8), q = P(cx + Math.cos(a) * rr, cy + Math.sin(a * 1.3) * rr * 0.5); C.px(q[0], q[1], k % 3 ? c1 : c0); } }
// 짐승 두개골 (주둥이가 a 방향) — 뿔·이빨 선택
function skull(S, c, a, s, z, o = {}) {
  const M = o.M ?? BONE, MF = o.MF ?? BONEF, n = a + Math.PI / 2;
  S.add(U(ellR(c[0], c[1], 6 * s, 5.4 * s), capF(c, pol(c, a, 10 * s), 4.6 * s, 2.6 * s)), M, { z, h: 4 * s });
  S.add(ellR(...pol(pol(c, a, 1.5 * s), n, -1.4 * s), 2 * s, 1.7 * s), VD, { z: z + 0.2, lift: 0.1, h: 0.3 });
  S.add(ellR(...pol(c, a, 9 * s), 1.2 * s, 1 * s), VD, { z: z + 0.2, lift: 0.1, h: 0.2 });
  S.carve(capF(pol(c, a, 3 * s), pol(c, a, 9 * s), 0.5 * s), 0.6);
  if (o.jaw !== !1) {
    const jo = o.jaw ?? 0, ja = a + 0.25 + jo * 0.5, j0 = pol(pol(c, a, 1 * s), n, 3 * s);
    S.add(capF(j0, pol(j0, ja, 9.4 * s), 2 * s, 1.2 * s), MF, { z: z - 0.4, h: 1.4 * s });
    for (let k = 0; k < 4; k++) S.add(polyF([pol(pol(j0, ja, 4 + k * 1.6 * s), n, -1), pol(pol(j0, ja, 4.8 + k * 1.6 * s), n, -2.4 * s), pol(pol(j0, ja, 5.4 + k * 1.6 * s), n, -1)]), BONE, { z: z - 0.3, h: 0.4, prof: "sharp" });
    S.add(polyF([pol(pol(c, a, 8 * s), n, 2 * s), pol(pol(c, a, 8.6 * s), n, 5 * s), pol(pol(c, a, 9.4 * s), n, 2 * s)]), BONE, { z: z + 0.3, h: 0.6, prof: "sharp" });
  }
  if (o.horn) for (const [d, zz] of [[-1, -0.6], [1, 0.4]]) { let q = pol(pol(c, a, -2 * s), n, -4 * s), ha = a + Math.PI + o.horn * 0.4 - 0.9; for (let k = 0; k < 5; k++) { const n2 = pol(q, ha, 3.4 * s), w = (2.2 - k * 0.38) * s; S.add(capF(q, n2, w, w - 0.3 * s), d > 0 ? OLDB : OLDBF, { z: z + zz, h: w }); q = n2; ha += 0.42 * (o.curl ?? 1); } }
  return S;
}

// ════ 대머리황새 ════ 털 빠진 분홍 대머리 · 굵고 긴 부리 · 목에 늘어진 살주머니 · 장례복 같은 검회색 날개 · 가는 다리로 뼈 더미를 뒤진다
//   p: legs · bob · peck · wings · hurt
const STK = 0.72;
const STF = mat(ramp(0x4a4a50), { tex: "feather", amp: 1, dir: 0.3 }), STFF = mat(rampF(0x36363c), { tex: "feather", amp: 0.9, dir: 0.3 });
const STW = mat(ramp(0xd8d4cc), { tex: "feather", amp: 0.6, dir: 1.2 }), PINK = mat(ramp(0xd89088), { tex: "skin", amp: 1, spec: 0.3 }), BILL = mat(ramp(0xc8b490), { tex: "stone", amp: 0.6, spec: 0.5 });
function storkFrame(p = {}) {
  const W = 104, H = 104, G = H - 1, S = sculpt(W, H, { k: STK, ax: 44 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, pk = p.peck ?? 0, wg = p.wings ?? 0, cx = 40, by = 54 + b;
  // 다리 (무릎이 뒤로)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) {
    const hp = [cx + d, by + 8], ft = [cx + d + o[0], G - 1 - o[1]], kn = [L(hp[0], ft[0], 0.45) - 4, L(hp[1], ft[1], 0.45)];
    const M = far ? mat(rampF(0x9a8a80), { tex: "skin" }) : mat(ramp(0xb8a89c), { tex: "skin", amp: 0.8 });
    S.add(U(capF(hp, kn, 2.2, 1.6), capF(kn, ft, 1.5, 1.3)), M, { z: far ? -3 : 4, h: 1.4 });
    S.add(ellR(kn[0], kn[1], 2, 2), M, { z: far ? -2.9 : 4.1, h: 1.4 });
    for (const e of [-0.25, 0.15, 0.55]) S.add(capF(ft, pol(ft, e, 5), 0.8, 0.5), M, { z: far ? -2.8 : 4.2, h: 0.5 });
    S.add(capF(ft, pol(ft, Math.PI - 0.1, 3), 0.7, 0.5), M, { z: far ? -2.8 : 4.2, h: 0.5 });
  }
  // 몸 (흰 배 + 검은 등) · 꽁지
  S.add(polyF([[cx - 14, by - 4], [cx - 30, by + 2 + wg * -6], [cx - 28, by + 6], [cx - 12, by + 8]]), STFF, { z: 0, h: 3 });
  S.add(ellR(cx, by, 16, 12), STW, { z: 1, h: 10 });
  // 목 (살 빠진 분홍 목 · 살주머니)
  const nb = [cx + 10, by - 8], hd = lerp([cx + 14, by - 30], [cx + 30, by - 4], pk), na = Math.atan2(hd[1] - nb[1], hd[0] - nb[0]);
  S.add(ellR(cx + 13, by - 2 + pk * 3, 5, 7 - pk * 2), PINK, { z: 2.4, h: 4 });
  S.add(U(capF(nb, lerp(nb, hd, 0.5), 3.6, 2.6), capF(lerp(nb, hd, 0.5), hd, 2.6, 3.4)), PINK, { z: 3, h: 2.6 });
  S.add(ellR(nb[0] - 1, nb[1] + 2, 7, 4.6), STW, { z: 3.2, h: 3 });
  for (let k = 0; k < 5; k++) S.add(ellR(...pol(nb, na + 0.4 * (k - 2), 6), 1.4, 1), STW, { z: 3.3, h: 0.8 });
  // 머리 + 부리
  const ba = L(0.25, 1.0, pk) + (p.open ?? 0) * -0.1;
  S.add(ellR(hd[0], hd[1], 4.6, 4), PINK, { z: 4, h: 3.4 });
  for (const [x, y] of [[-2, -2], [1, -3], [-1, 1]]) S.add(ellR(hd[0] + x, hd[1] + y, 0.9, 0.7), mat(ramp(0xa85a5a)), { on: 1, lift: 0.2, h: 0.2 });
  const tip = pol(pol(hd, ba, 2), ba, 22);
  S.add(polyF([pol(hd, ba - 1.4, 3), pol(hd, ba + 1.6, 3.2), tip]), BILL, { z: 4.6, h: 2.2, prof: "sharp" });
  S.carve(capF(pol(hd, ba, 3), pol(hd, ba, 18), 0.3), 0.8);
  !p.hurt && S.decal(hd[0] + 1.4, hd[1] - 1.4, 0x101010).decal(hd[0] + 1.8, hd[1] - 1.8, 0xe8d8a0);
  // 날개 (접힘 → 펼침)
  if (wg < 0.3) {
    S.add(U(ellR(cx - 3, by - 3, 15, 9), polyF([[cx - 14, by - 2], [cx - 34, by + 4], [cx - 12, by + 8]])), STF, { z: 5, h: 6 });
    for (let k = 0; k < 4; k++) S.carve(capF([cx + 6 - k * 6, by - 7 + k], [cx - 8 - k * 6, by + 3 + k], 0.4), 0.7);
    S.add(capF([cx + 8, by - 8], [cx - 8, by - 6], 2.2), mat(ramp(0x8a8a90), { tex: "feather" }), { z: 5.4, h: 1.2 });
  } else {
    const sh = [cx + 2, by - 6];
    for (const [far, z] of [[1, -1], [0, 6]]) {
      const tp = [sh[0] - 20 - far * 4, sh[1] - 26 * wg + far * 4], tl = [sh[0] - 38, sh[1] - 6 * wg + 2];
      S.add(polyF([sh, tp, [tp[0] - 10, tp[1] + 4], tl, [sh[0] - 10, sh[1] + 8]]), far ? STFF : STF, { z, h: 3 });
      for (let k = 0; k < 4; k++) S.carve(capF(lerp(sh, tp, 0.3 + k * 0.17), lerp([sh[0] - 10, sh[1] + 8], tl, 0.3 + k * 0.17), 0.4), 0.7);
    }
  }
  return fin(S.render({ rim: !0 }), p);
}
export const pxStork = {
  fw: Math.round(104 * STK), fh: Math.round(104 * STK), w: 18, h: 36,
  anims: { idle: [4, 4], move: [6, 8], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], toss: [4, 10, !1], flap: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait2(f, n, 7, 3); P = { legs: g, bob: g.bob * 0.6, peck: 0.1 + Math.abs(Math.sin(ph)) * 0.1 }; }
    if (nm === "wind") P = { peck: -0.2 * t, wings: t > 0.5 ? 0.5 : 0 };
    if (nm === "atk") P = { peck: [1, 1.1, 0.9][f] };
    if (nm === "rec") P = { peck: 0.9 * (1 - t) };
    if (nm === "toss") P = { peck: [0.8, 0.2, -0.3, 0][f] };
    if (nm === "flap") P = { wings: [0.4, 1, 0.6, 1][f], bob: -2 };
    if (nm === "hurt") P = { hurt: f === 0, wings: 0.6, peck: -0.2 };
    return storkFrame(P);
  },
};

// ════ 뼈 가면 사냥꾼 ════ 늑대 두개골을 얼굴에 쓴 협곡 사냥꾼 · 털가죽 망토 · 손가락뼈 목걸이 · 뼈 촉 투창을 등에 메고 하나를 든다
//   p: legs · bob · aim(0 듦 · 1 뒤로 젖힘 · 2 던짐) · thrust · hurt
const HTK = 0.72;
function hunterFrame(p = {}) {
  const W = 112, H = 96, G = H - 1, S = sculpt(W, H, { k: HTK, ax: 40 });
  const b = p.bob ?? 0, am = p.aim ?? 0, th = p.thrust ?? 0, cx = 38;
  const SKN = mat(ramp(0x9a7458), { tex: "skin", amp: 0.8 }), SKNF = mat(rampF(0x7a5a44), { tex: "skin", amp: 0.7 });
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: LEATH, hurt: p.hurt,
    legO: { thigh: LEATH, thighF: LEATHF, shin: mat(ramp(0x8a7058), { tex: "fur", amp: 1, dir: 1.57 }), shinF: mat(rampF(0x6a5440), { tex: "fur", dir: 1.57 }), boot: LEATH, bootF: LEATHF, knee: !1 },
    back: () => {
      // 털가죽 망토 + 등의 투창 묶음
      S.add(polyF([[cx - 8, 38 + b], [cx + 4, 38 + b], [cx - 4, 72 + b], [cx - 14, 76 + b], [cx - 16, 66 + b]]), FUR, { z: -1, h: 5 });
      for (let k = 0; k < 3; k++) { const a = -1.95, q0 = [cx - 12 + k * 2.2, 70 + b - k], L0 = 38 + k * 2; S.add(capF(q0, pol(q0, a, L0), 0.8), WOOD, { z: -1.5 - k * 0.05, h: 0.7 }); S.add(polyF([pol(pol(q0, a, L0), a + 1.57, 1.2), pol(q0, a, L0 + 5), pol(pol(q0, a, L0), a - 1.57, 1.2)]), BONE, { z: -1.4, h: 0.7, prof: "sharp" }); }
      S.add(capF([cx - 12, 64 + b], [cx - 6, 46 + b], 3, 2.6), LEATHF, { z: -1.2, h: 2 });
      S.add(capF([cx - 11, 60 + b], [cx - 7, 50 + b], 0.5), mat(ramp(0x8a3a2a)), { z: -1, h: 0.3 });
    },
    head: (hx, hy) => {
      S.add(ellR(hx, hy + 1, 6, 6.6), SKN, { z: 4, h: 4 });
      S.add(capF([hx - 6, hy - 2], [hx - 8, hy + 10], 2.6, 1.6), mat(ramp(0x2a2018), { tex: "fur", dir: 1.57 }), { z: 3.8, h: 2 });
      skull(S, [hx + 1, hy - 2], 0.35, 0.85, 4.8, { jaw: !1, horn: 0 });
      S.add(capF([hx - 4, hy - 7], [hx - 8, hy - 13], 1.4, 0.6), OLDB, { z: 4.4, h: 0.8 }).add(capF([hx - 1, hy - 7], [hx - 2, hy - 14], 1.4, 0.6), OLDB, { z: 5.4, h: 0.8 });
      S.add(ellR(hx + 4, hy + 6, 3, 2), mat(ramp(0x3a2a20), { tex: "fur" }), { z: 4.6, h: 1 });
      !p.hurt && S.decal(hx + 3, hy - 1.6, 0xffd070);
    },
  });
  // 목걸이 (손가락뼈)
  for (let k = 0; k < 6; k++) { const q = [cx - 4 + k * 2.4, 40 + b + Math.sin(k * 0.6) * 2]; S.add(capF(q, [q[0] + 0.4, q[1] + 3], 0.8), BONE, { z: 6, h: 0.6 }); }
  // 먼 팔
  arm(S, sol.S1, [cx - 6 + th * 4, 60 + b - am * 2], 1, { M: SKNF, MF: SKNF, z: -2 });
  // 가까운 팔 + 투창
  const sh = sol.S0, hd = th > 0 ? lerp([cx + 12, 56 + b], [cx + 28, 52 + b], th) : am < 1 ? lerp([cx + 10, 52 + b], [cx - 2, 36 + b], am) : lerp([cx - 2, 36 + b], [cx + 22, 40 + b], am - 1);
  const sa = th > 0 ? -0.05 : am < 1 ? L(-0.35, -0.2, am) : L(-0.2, -0.05, am - 1);
  S.add(ellR(sh[0], sh[1] + 1, 5, 4.2, 0.3), FUR, { z: 7, h: 3 });
  if (am < 1.9) {
    const t0 = pol(hd, sa, -22), t1 = pol(hd, sa, 26);
    S.add(capF(t0, t1, 1, 0.9), WOOD, { z: 7.6, h: 0.8 });
    S.add(polyF([pol(t1, sa + 1.57, 2.2), pol(t1, sa, 8), pol(t1, sa - 1.57, 2.2)]), BONE, { z: 7.7, h: 1, prof: "sharp" });
    for (const d of [-1, 1]) S.add(capF(pol(t0, sa, 2), pol(pol(t0, sa, -2), sa + d * 1.57, 2.4), 0.6), mat(ramp(0x8a3a2a), { tex: "feather" }), { z: 7.5, h: 0.4 });
  }
  arm(S, sh, hd, 0, { M: SKN, MF: SKNF });
  S.add(capF(lerp(sh, hd, 0.65), lerp(sh, hd, 0.85), 3), LEATH, { z: 8.4, h: 2 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxHunter = {
  fw: Math.round(112 * HTK), fh: Math.round(96 * HTK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], aim: [3, 8, !1], throw: [3, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 6, 2.6); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { thrust: 0.001, bob: 1 };
    if (nm === "atk") P = { thrust: [0.7, 1, 1][f], bob: 0 };
    if (nm === "rec") P = { thrust: 1 - t * 0.99 };
    if (nm === "aim") P = { aim: t };
    if (nm === "throw") P = { aim: [1.5, 2, 2][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return hunterFrame(P);
  },
};

// ════ 벌거숭이 두더지쥐 ════ 주름진 분홍 맨살 · 입술 밖으로 튀어나온 누런 앞니 넷 · 거의 안 보이는 눈 · 뼈 더미 아래 흙 속을 판다
//   p: legs · bob · bite · dig(0 땅 위 · 1 흙에 묻힘) · hurt
const MRK = 0.72;
const NAKED = mat(ramp(0xd8a090), { tex: "skin", amp: 1.2, spec: 0.2 }), NAKEDF = mat(rampF(0xb07a6c), { tex: "skin", amp: 1 }), DIRT = mat(ramp(0x6a5440), { tex: "clay", amp: 1.2 });
function moleratFrame(p = {}) {
  const W = 84, H = 46, G = H - 1, S = sculpt(W, H, { k: MRK, ax: 40 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, bt = p.bite ?? 0, dg = p.dig ?? 0, cx = 38, sink = dg * 12;
  const paw = (sh, o, far) => { const ft = [sh[0] + o[0], G - 1 - o[1]]; S.add(capF(sh, ft, 2.6, 1.8), far ? NAKEDF : NAKED, { z: far ? -3 : 5, h: 1.6 }); for (const e of [-0.3, 0.1, 0.5]) S.add(capF(ft, pol(ft, e, 2.6), 0.5, 0.3), BONE, { z: far ? -2.9 : 5.1, h: 0.3 }); };
  dg < 0.5 && (paw([cx + 12, 36 + b], lg.ff, 1), paw([cx - 12, 36 + b], lg.bf, 1));
  // 꼬리 (가늘고 맨살)
  S.add(capF([cx - 20, 34 + b + sink], [cx - 30, 38 + b + sink], 1.4, 0.6), NAKEDF, { z: 0, h: 1 });
  // 몸 (긴 소시지 · 주름)
  S.add(U(ellR(cx - 4, 32 + b + sink, 18, 9), ellR(cx + 10, 33 + b + sink, 10, 8)), NAKED, { z: 1, h: 8 });
  for (let k = 0; k < 7; k++) S.carve(capF([cx - 18 + k * 5, 25 + b + sink], [cx - 17 + k * 5 + Math.sin(k) * 1.4, 40 + b + sink], 0.45), 0.8);
  for (const [x, y] of [[-10, 28], [2, 26], [-4, 36], [8, 30]]) S.add(capF([cx + x, y + b + sink], [cx + x + 1, y + 1.6 + b + sink], 0.3), mat(ramp(0xe8d0b8)), { on: 1, lift: 0.2, h: 0.2 });
  // 머리 (뭉툭한 주둥이 · 앞니)
  const hx = cx + 20, hy = 32 + b + sink;
  S.add(U(ellR(hx, hy, 8, 7), ellR(hx + 6, hy + 1, 5, 4.4)), NAKED, { z: 2.4, h: 6 });
  S.carve(capF([hx - 4, hy - 6], [hx - 3, hy + 5], 0.4), 0.7);
  S.add(ellR(hx + 9, hy + 0.4, 1.6, 1.4), mat(ramp(0xb06a68)), { z: 2.6, lift: 0.4, h: 0.6 });
  for (let k = 0; k < 4; k++) S.add(capF([hx + 10, hy - 1 + k * 0.8], [hx + 15 + k, hy - 2 + k * 1.4], 0.25), mat(ramp(0xe8d8c8)), { z: 2.8, h: 0.2 });
  const jo = bt * 4;
  S.add(U(capF([hx + 8, hy + 3], [hx + 11, hy + 9 - jo * 0.3], 1.3, 1)), mat(ramp(0xe0c060), { spec: 0.6 }), { z: 3, h: 1 });
  S.add(U(capF([hx + 6, hy + 5 + jo * 0.5], [hx + 9, hy + 9 + jo], 1.2, 0.9)), mat(ramp(0xd0a850), { spec: 0.5 }), { z: 2.9, h: 0.9 });
  !p.hurt && S.decal(hx + 2, hy - 3, 0x201010);
  dg < 0.5 && (paw([cx + 14, 37 + b], lg.fn, 0), paw([cx - 10, 37 + b], lg.bn, 0));
  // 흙 둔덕 (파묻힐 때)
  if (dg > 0) {
    S.add(U(ellR(cx, G - 1, 28 * dg + 6, 8 * dg + 2), ellR(cx + 14, G - 3, 8 * dg, 6 * dg)), DIRT, { z: 7, h: 5 });
    for (let k = 0; k < 5; k++) S.add(ellR(cx - 18 + k * 9, G - 3 - (k % 2) * 3 * dg, 2, 1.6), k % 2 ? BONEF : mat(ramp(0x8a7058), { tex: "stone" }), { z: 7.2, lift: 0.4, h: 1 });
  }
  return fin(S.render({ rim: !0 }), p);
}
export const pxMoleRat = {
  fw: Math.round(84 * MRK), fh: Math.round(46 * MRK), w: 26, h: 14,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], hide: [4, 6], dig: [4, 10, !1], pop: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { legs: gait4(f, n, 4, 1.6), bob: Math.cos(ph * 2) * 0.5 };
    if (nm === "wind") P = { bite: -0.3, bob: 1 };
    if (nm === "atk") P = { bite: [1, 0.6, 0][f], bob: -1 };
    if (nm === "rec") P = { bite: 0 };
    if (nm === "hide") P = { dig: 1, bob: Math.sin(ph) * 0.6 };
    if (nm === "dig") P = { dig: t };
    if (nm === "pop") P = { dig: [0.6, 0.2, 0][f], bite: 1, bob: -2 };
    if (nm === "hurt") P = { hurt: f === 0, bite: 0.4 };
    return moleratFrame(P);
  },
};

// ════ [정예] 뼈 갑주 매머드 ════ 긴 털의 거대 매머드 · 다른 짐승의 두개골을 이마에 투구처럼 묶었다 · 등뼈를 따라 갈비뼈 판 갑주 ·
//   하늘로 휜 엄니 · 코로 바위를 집어 던진다
//   p: legs · bob · rear · trunk · hurt
const MMK = 0.7;
function mammothFrame(p = {}) {
  const W = 190, H = 136, G = H - 1, S = sculpt(W, H, { k: MMK, ax: 84 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, rr = p.rear ?? 0, tr = p.trunk ?? 0, cx = 80, cy = 70 + b;
  const fy = -rr * 16; // 앞쪽 들림
  const legP = (x, o, far, front) => { const hp = [x, cy + 18 + (front ? fy * 0.8 : 0)], ft = [x + o[0] + (front ? rr * 6 : 0), G - 1 - o[1] + (front ? fy * 1.1 : 0)]; S.add(U(capF(hp, lerp(hp, ft, 0.5), 11, 10), capF(lerp(hp, ft, 0.5), ft, 10, 9)), far ? FURF : FUR, { z: far ? -4 : 6, h: 8 }); S.add(ellR(ft[0], ft[1] - 2, 10, 3.6), far ? mat(rampF(0x4a4038)) : mat(ramp(0x6a5a4c), { tex: "stone" }), { z: far ? -3.9 : 6.1, h: 2 }); for (const d of [-5, 0, 5]) S.add(ellR(ft[0] + d + 2, ft[1] - 2, 1.8, 1.4), BONEF, { z: far ? -3.8 : 6.2, h: 0.6 }); };
  legP(cx + 28, lg.ff, 1, 1), legP(cx - 30, lg.bf, 1, 0);
  // 몸 (털 덩이 · 어깨 혹)
  const tilt = (x) => ((x - cx) / 60) * fy;
  S.add(U(ellR(cx, cy + tilt(cx), 50, 32), ellR(cx + 24, cy - 12 + fy * 0.7, 28, 26), ellR(cx - 30, cy + 4 + tilt(cx - 30), 26, 26)), FUR, { z: 1, h: 26 });
  for (let k = 0; k < 14; k++) { const x = cx - 46 + k * 7; S.carve(capF([x, cy + 8 + tilt(x)], [x - 2 + Math.sin(k) * 2, cy + 34 + tilt(x)], 0.6), 1); }
  // 늘어진 배 털
  const hem = [];
  for (let k = 0; k <= 10; k++) { const x = cx - 46 + k * 9.4; hem.push([x, cy + 32 + tilt(x) + (k % 2) * 5 + Math.sin(k + (p.ph ?? 0)) * 1.4]); }
  S.add(polyF([[cx - 48, cy + 14 + tilt(cx - 48)], [cx + 46, cy + 14 + tilt(cx + 46)], ...hem.slice().reverse()]), FURF, { z: 1.5, h: 4 });
  // 등뼈 갑주 (척추 + 갈비 판)
  for (let k = 0; k < 9; k++) {
    const x = cx - 42 + k * 9.4, y = cy - 26 - Math.sin((k / 8) * Math.PI) * 10 + tilt(x) - (k > 5 ? (k - 5) * 2 : 0);
    S.add(ellR(x, y, 4, 3), BONE, { z: 9, h: 3 });
    S.add(polyF([[x - 2, y - 1], [x + 1, y - 8 - (k % 2) * 2], [x + 3, y - 1]]), OLDB, { z: 9.2, h: 1.4, prof: "sharp" });
    k % 2 === 0 && k > 0 && k < 8 && S.add(capF([x, y + 2], [x - 6, y + 22], 2.4, 1.6), k % 4 ? BONE : OLDB, { z: 9.1, h: 1.6 });
  }
  S.add(capF([cx - 30, cy - 4 + tilt(cx - 30)], [cx + 30, cy - 8 + tilt(cx + 30)], 1.8), LEATH, { z: 9.3, h: 1.2 });
  // 머리 (털 · 두개골 투구 · 엄니 · 코)
  const hx = cx + 48, hy = cy - 16 + fy;
  S.add(U(ellR(hx, hy, 20, 20), ellR(hx + 4, hy - 16, 12, 10)), FUR, { z: 4, h: 14 });
  S.add(ellR(hx + 10, hy + 2, 8, 10), mat(ramp(0x7a5c40), { tex: "fur", amp: 1.2, dir: 1.57 }), { z: 5, h: 6 });
  // 귀
  S.add(ellR(hx - 10, hy + 2, 6, 8), FUR, { z: 4.6, h: 3 });
  S.carve(ellR(hx - 9, hy + 2, 3, 5), 0.8);
  // 이마 두개골 (뿔 달린)
  skull(S, [hx + 2, hy - 12], 0.55, 1.15, 9, { jaw: !1, horn: 1, curl: 1 });
  S.add(capF([hx - 10, hy - 8], [hx + 14, hy - 4], 1.4), LEATH, { z: 10, h: 1 });
  S.add(ellR(hx + 12, hy + 2, 2.2, 1.8), VD, { z: 9.4, h: 0.4 });
  !p.hurt && S.decal(hx + 12.4, hy + 1.6, 0xffd070);
  // 먼 엄니
  const tusk = (far) => { let q = [hx + 12 - far * 4, hy + 10], a = 1.4 - rr * 0.3; const pts = []; for (let k = 0; k < 8; k++) { const n2 = pol(q, a, 6.4); S.add(capF(q, n2, 3.6 - k * 0.38, 3.2 - k * 0.38), far ? OLDBF : OLDB, { z: far ? 2 : 12, h: 2.6 - k * 0.2 }); q = n2; a -= 0.42; pts.push(q); } return pts; };
  tusk(1);
  // 코 (흔들림 · 바위 쥐기)
  let q = [hx + 14, hy + 6], a = 1.4 + tr * -1.6;
  for (let k = 0; k < 9; k++) { const n2 = pol(q, a, 5.6), w = 5.4 - k * 0.42; S.add(capF(q, n2, w, w - 0.4), k % 2 ? FUR : mat(ramp(0x5a4434), { tex: "skin", amp: 1 }), { z: 11, h: w * 0.8 }); k > 0 && S.carve(capF(pol(q, a + 1.57, w), pol(q, a - 1.57, w), 0.35), 0.6); q = n2; a += (0.12 + Math.sin((p.ph ?? 0) + k * 0.5) * 0.05) * (1 - tr * 2.2); }
  p.rock && S.add(ellR(q[0], q[1], 9, 8), mat(ramp(0x7a6a58), { tex: "stone", amp: 1.4 }), { z: 11.5, h: 7 });
  tusk(0);
  legP(cx + 32, lg.fn, 0, 1), legP(cx - 26, lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  dust(C, toPx(W, H, MMK, 84), cx, G - 4, 60, rr > 0 || p.legs ? 10 : 0, p.ph ?? 0);
  return fin(C, p);
}
export const pxMammoth = {
  fw: Math.round(190 * MMK), fh: Math.round(136 * MMK), w: 64, h: 60,
  anims: { idle: [4, 3], move: [6, 6], wind: [4, 6, !1], atk: [3, 12, !1], rec: [3, 6, !1], hurt: [2, 10, !1], rear: [4, 7, !1], stomp: [3, 14, !1], grab: [4, 8, !1], hurl: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph, trunk: Math.sin(ph) * 0.1 };
    if (nm === "move") { const g = gait4(f, n, 7, 3); P = { legs: g, bob: Math.cos(ph * 2) * 1, ph, trunk: Math.sin(ph) * 0.2 }; }
    if (nm === "wind") P = { trunk: -0.3 * t, ph, bob: 1 };
    if (nm === "atk") P = { trunk: [0.6, 1, 0.8][f], ph };
    if (nm === "rec") P = { trunk: 0.8 * (1 - t), ph };
    if (nm === "rear") P = { rear: t, trunk: 0.5 * t, ph };
    if (nm === "stomp") P = { rear: [0.4, -0.15, 0][f], bob: [0, 2, 1][f], ph };
    if (nm === "grab") P = { trunk: [-0.2, -0.3, 0.2, 0.6][f], rock: f > 1, ph };
    if (nm === "hurl") P = { trunk: [0.8, 1, 0.6][f], rock: f === 0, ph, rear: 0.2 };
    if (nm === "hurt") P = { hurt: f === 0, ph, bob: 2, trunk: -0.3 };
    return mammothFrame(P);
  },
};

// ════ 골수 점액 ════ 뼈 더미의 골수를 녹여 먹은 누런 점액 덩이 · 속에 녹다 만 뼈와 작은 해골이 떠 있다 · 표면에 기포
//   p: ph · sq(찌그러짐) · spit · hurt
const MWK = 0.72;
const MARROW = mat(ramp(0xd8a850, { hi: 0.6 }), { tex: "glass", amp: 0.6, spec: 0.8 }), MARROWD = mat(ramp(0xa8783a), { tex: "skin", amp: 0.6 });
function marrowFrame(p = {}) {
  const W = 70, H = 60, G = H - 1, S = sculpt(W, H, { k: MWK, ax: 35 });
  const ph = p.ph ?? 0, sq = p.sq ?? 0, sp = p.spit ?? 0, cx = 35, ry = 18 - sq * 4 + sp * 3, rx = 22 + sq * 4 - sp * 2, cy = G - ry;
  S.add(U(ellR(cx, cy, rx, ry), ellR(cx, G - 3, rx + 4, 4), ellR(cx + 6 + sp * 4, cy - 4 - sp * 4, 9 + sp * 3, 8)), MARROW, { z: 1, h: 16 });
  // 속의 뼈 (흐릿하게)
  const inside = [[[-10, 2], [6, -4], 1.6], [[-4, 8], [12, 6], 1.3], [[-14, -4], [-6, 8], 1.2]];
  for (const [a, b2, w] of inside) { const A0 = [cx + a[0] + Math.sin(ph) * 1.4, cy + a[1]], B0 = [cx + b2[0] + Math.sin(ph) * 1.4, cy + b2[1]]; S.add(U(capF(A0, B0, w), ellR(A0[0], A0[1], w * 1.6, w * 1.4), ellR(B0[0], B0[1], w * 1.6, w * 1.4)), OLDBF, { on: 1, lift: -1.6, h: 0.6 }); }
  skull(S, [cx + 2 + Math.cos(ph) * 1.4, cy - 6], 0.3 + Math.sin(ph) * 0.2, 0.7, 0, { M: OLDBF, MF: OLDBF, jaw: 0.4 });
  // 기포 · 녹아내림
  for (let k = 0; k < 5; k++) { const a = ph + k * 1.3, q = [cx + Math.cos(a) * rx * 0.7, cy - Math.abs(Math.sin(a)) * ry * 0.7]; S.add(ellR(q[0], q[1], 1.6, 1.4), mat(ramp(0xf0d080), { spec: 1 }), { on: 1, lift: 0.4, h: 0.8 }); }
  S.add(ellR(cx - 8, cy - ry * 0.5, 4, 2.4), mat(ramp(0xfff0c0), { spec: 1 }), { on: 1, lift: 0.5, h: 0.6 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - rx + 4 + k * 12, G - 2], [cx - rx + 6 + k * 12, G], 1.4), MARROWD, { z: 0.5, h: 1 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxMarrow = {
  fw: Math.round(70 * MWK), fh: Math.round(60 * MWK), w: 26, h: 20,
  anims: { idle: [6, 5], move: [6, 7], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, sq: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { ph, sq: Math.sin(ph) };
    if (nm === "wind") P = { ph, sq: t };
    if (nm === "atk") P = { ph, spit: [1, 0.8, 0.3][f] };
    if (nm === "rec") P = { ph, sq: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, sq: 0.8 };
    return marrowFrame(P);
  },
};

// ════ 척추 뱀 ════ 이빨 드러낸 늑대 두개골을 머리로 단 등뼈 사슬 · 마디마다 가시돌기 · 마디 사이 말라붙은 힘줄 · 꼬리 끝 뼈방울
//   p: ph · coil(0 기어감 · 1 고개 쳐듦) · strike · hurt
const SPK = 0.72;
function spineFrame(p = {}) {
  const W = 110, H = 62, G = H - 1, S = sculpt(W, H, { k: SPK, ax: 52 });
  const ph = p.ph ?? 0, co = p.coil ?? 0, st = p.strike ?? 0, cx = 44;
  const pts = [];
  for (let k = 0; k < 15; k++) {
    const t = k / 14, x = cx - 36 + t * 56 + st * t * t * 24 - co * t * 10, lift = co * Math.max(0, t - 0.55) * 60 * (1 - st * 0.6);
    pts.push([x, G - 5 + Math.sin(ph * 2 - k * 0.9) * 2.4 * (1 - t * 0.5) - lift]);
  }
  for (let k = 0; k < pts.length - 1; k++) {
    const q = pts[k], n2 = pts[k + 1], a = Math.atan2(n2[1] - q[1], n2[0] - q[0]), w = 2.6 + (k / 14) * 2;
    S.add(capF(q, n2, 1.2), SINEW, { z: 0.5 + k * 0.05, h: 0.8 });
    S.add(ellR(q[0], q[1], w, w * 0.8), k % 2 ? BONE : OLDB, { z: 1 + k * 0.05, h: w * 0.8 });
    S.add(polyF([pol(q, a + 1.57, -w * 0.6) , pol(pol(q, a, -1), a - 1.57, w + 3), pol(q, a + 1.57, -w * 0.6 + 2)]), BONEF, { z: 1.1 + k * 0.05, h: 0.8, prof: "sharp" });
    k > 2 && k % 2 && S.add(capF(q, pol(q, a + 1.9, w + 3), 0.8, 0.4), BONEF, { z: 0.8 + k * 0.05, h: 0.4 });
  }
  // 꼬리 방울
  S.add(U(ellR(pts[0][0] - 3, pts[0][1], 3, 2.4), ellR(pts[0][0] - 7, pts[0][1] - 1, 2.4, 2)), OLDB, { z: 0.9, h: 2 });
  const hd = pts[14], ha = Math.atan2(pts[14][1] - pts[12][1], pts[14][0] - pts[12][0]) * 0.5 + 0.1;
  skull(S, pol(hd, ha, 3), ha, 1, 3, { jaw: 0.3 + st * 0.7 });
  !p.hurt && S.decal(...pol(pol(hd, ha, 4.4), ha - 1.57, 1.4), 0xffb040);
  return fin(S.render({ rim: !0 }), p);
}
export const pxSpine = {
  fw: Math.round(110 * SPK), fh: Math.round(62 * SPK), w: 30, h: 14,
  anims: { idle: [6, 5], move: [6, 10], wind: [3, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], rattle: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, coil: 0.3 };
    if (nm === "move") P = { ph: ph * 2, coil: 0.1 };
    if (nm === "wind") P = { ph, coil: 0.3 + t * 0.7 };
    if (nm === "atk") P = { ph, coil: 1, strike: [0.6, 1, 1][f] };
    if (nm === "rec") P = { ph, coil: 1 - t * 0.7, strike: 1 - t };
    if (nm === "rattle") P = { ph: ph * 4, coil: 0.8 };
    if (nm === "hurt") P = { hurt: f === 0, ph, coil: 0.6 };
    return spineFrame(P);
  },
};

// ════ 뼈 점술사 ════ 허리 굽은 늙은 점쟁이 · 사슴뿔 달린 짐승 두개골 머리 장식 · 누더기 가죽 · 손가락뼈 주렁주렁 지팡이 ·
//   주머니에서 공기뼈(점치는 뼈)를 꺼내 던진다
//   p: legs · bob · cast · hurt
const SRK = 0.72;
function seerFrame(p = {}) {
  const W = 96, H = 100, G = H - 1, S = sculpt(W, H, { k: SRK, ax: 40 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cs = p.cast ?? 0, cx = 38;
  const HID = mat(ramp(0x7a6248), { tex: "leather", amp: 1.2 }), HIDF = mat(rampF(0x5a4834), { tex: "leather", amp: 1 }), SKN = mat(ramp(0x8a7a6a), { tex: "skin", amp: 1 });
  // 지팡이 (먼 손)
  const st0 = [cx - 14, G - 1], st1 = [cx - 8, 26 + b];
  S.add(capF(st0, st1, 1.2, 1), WOOD, { z: -2, h: 1 });
  for (let k = 0; k < 5; k++) S.add(capF([st1[0] - 1 + k * 0.6, st1[1] + 4], [st1[0] - 2 + k * 1.2, st1[1] + 10 + (k % 2) * 3 + Math.sin((p.ph ?? 0) + k) * 1], 0.6), BONE, { z: -1.8, h: 0.5 });
  skull(S, [st1[0], st1[1] - 2], -0.5, 0.5, -1.6, { jaw: !1 });
  // 다리 (짧은 · 감발)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 4]]) { const hp = [cx + d, 70 + b], ft = [cx + d + o[0], G - 2 - o[1]]; S.add(capF(hp, ft, 3, 2.4), far ? HIDF : mat(ramp(0x8a7a60), { tex: "cloth" }), { z: far ? -2 : 3, h: 2 }); S.add(ellR(ft[0] + 2, ft[1], 4, 1.8), far ? HIDF : HID, { z: far ? -1.9 : 3.1, h: 1.2 }); }
  // 굽은 몸 + 누더기 가죽
  S.add(U(ellR(cx - 2, 52 + b, 13, 16), ellR(cx + 4, 40 + b, 10, 9)), HID, { z: 1, h: 10 });
  const hem = [];
  for (let k = 0; k <= 6; k++) hem.push([cx - 16 + k * 5.4, 80 + b + (k % 2) * 4]);
  S.add(polyF([[cx - 14, 50 + b], [cx + 14, 50 + b], ...hem.slice().reverse()]), mat(ramp(0x6a5440), { tex: "leather", amp: 1.3 }), { z: 1.4, h: 5 });
  for (let k = 0; k < 6; k++) S.add(ellR(cx - 12 + k * 4.6, 76 + b + (k % 2) * 4, 1.2, 2), mat(ramp(0xa89070), { tex: "fur" }), { z: 1.6, h: 0.6 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 10 + k * 6, 56 + b], [cx - 12 + k * 7, 80 + b], 0.5), 0.8);
  S.add(capF([cx - 12, 60 + b], [cx + 12, 60 + b], 1.4), mat(ramp(0x3a2a1e), { tex: "leather" }), { z: 2, h: 1 });
  // 허리 주머니
  S.add(ellR(cx + 8, 66 + b, 4.4, 5), LEATH, { z: 2.4, h: 3 });
  // 목걸이
  for (let k = 0; k < 7; k++) { const q = [cx + 2 + k * 2, 36 + b + Math.sin(k * 0.5) * 3]; S.add(capF(q, [q[0] + 0.3, q[1] + 3.4], 0.8), k % 3 ? BONE : OLDB, { z: 3, h: 0.6 }); }
  // 머리 (앞으로 숙임 · 수염 · 뿔 두개골 장식)
  const hx = cx + 12, hy = 30 + b;
  S.add(ellR(hx, hy + 2, 6, 6.4), SKN, { z: 3, h: 4 });
  S.add(polyF([[hx - 1, hy + 4], [hx + 6, hy + 4], [hx + 4, hy + 16], [hx + 1, hy + 12]]), mat(ramp(0xc8c0b0), { tex: "fur", dir: 1.57 }), { z: 3.4, h: 2 });
  S.add(ellR(hx + 5, hy + 1, 1.6, 2), SKN, { z: 3.4, h: 1.2 });
  !p.hurt && S.decal(hx + 3, hy, 0xc8f0a0);
  S.add(polyF([[hx - 10, hy - 4], [hx - 2, hy - 6], [hx - 3, hy + 6], [hx - 12, hy + 12]]), HIDF, { z: 2.8, h: 3 });
  for (let k = 0; k < 4; k++) S.add(capF([hx - 8 + k * 1.4, hy - 2], [hx - 10 + k * 1.6, hy + 8 + (k % 2) * 3], 0.5), mat(ramp(0xb8b0a0), { tex: "fur" }), { z: 2.9, h: 0.4 });
  skull(S, [hx, hy - 7], 0.25, 0.8, 4.4, { jaw: !1 });
  S.add(capF([hx - 6, hy - 3], [hx + 5, hy - 4], 0.9), mat(ramp(0x8a3a2a), { tex: "cloth" }), { z: 4.2, h: 0.6 });
  // 사슴뿔
  for (const [d, z] of [[-1, 4], [1, 5]]) { let q = [hx - 4 + d, hy - 9], a = -1.9 - d * 0.15; for (let k = 0; k < 5; k++) { const n2 = pol(q, a, 4); S.add(capF(q, n2, 1.2 - k * 0.12), OLDB, { z, h: 0.8 }); k % 2 && S.add(capF(n2, pol(n2, a + 0.9, 3.4), 0.7, 0.3), OLDB, { z, h: 0.5 }); q = n2; a += 0.22; } }
  // 가까운 팔 (공기뼈를 쥔 손)
  const sh = [cx + 6, 40 + b], hd = cs < 1 ? lerp([cx + 14, 54 + b], [cx + 8, 32 + b], cs) : lerp([cx + 8, 32 + b], [cx + 26, 42 + b], cs - 1);
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 3.2, 2.6), capF(lerp(sh, hd, 0.5), hd, 2.6, 2.2)), HID, { z: 6, h: 2.2 });
  S.add(ellR(hd[0], hd[1], 2.4, 2.2), SKN, { z: 6.4, h: 1.6 });
  if (cs < 1.6) for (let k = 0; k < 3; k++) S.add(ellR(hd[0] + 1 + k * 1.4, hd[1] - 2 - (k % 2), 1.2, 0.9), BONE, { z: 6.6, h: 0.6 });
  const C = S.render({ rim: !0 });
  if (cs > 0.4) { const P = toPx(W, H, SRK, 40); for (let k = 0; k < 10; k++) { const q = P(hd[0] + Math.cos(k * 0.63 + cs) * 7, hd[1] + Math.sin(k * 0.63 + cs) * 7); C.px(q[0], q[1], k % 2 ? 0xb8e070 : 0xf0ffd0); } }
  return fin(C, p);
}
export const pxSeer = {
  fw: Math.round(96 * SRK), fh: Math.round(100 * SRK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], ritual: [4, 6, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5, ph };
    if (nm === "move") { const g = gait2(f, n, 4, 1.4); P = { legs: g, bob: g.bob * 0.6, ph: ph * 2 }; }
    if (nm === "wind") P = { cast: t, ph };
    if (nm === "atk") P = { cast: [1.5, 2, 2][f], ph };
    if (nm === "rec") P = { cast: 2 - t * 2, ph };
    if (nm === "ritual") P = { cast: [0.6, 1, 0.8, 1][f], bob: -1, ph: ph * 3 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, ph };
    return seerFrame(P);
  },
};

// ════ [정예] 뼈무더기 거인 ════ 협곡의 짐승 뼈가 엮여 일어선 거인 · 갈비뼈 우리 가슴 속에 골수 불씨 · 뿔 달린 짐승 두개골 머리 ·
//   골반과 넓적다리뼈 다리 · 한 손엔 거대한 넓적다리뼈 몽둥이 · 뼈마디를 마른 힘줄이 묶는다
//   p: legs · bob · sw · grab · hurt
const CLK = 0.66;
function colossusFrame(p = {}) {
  const W = 176, H = 142, G = H - 1, S = sculpt(W, H, { k: CLK, ax: 72 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, gr = p.grab ?? 0, cx = 70;
  const boneLimb = (a, c, w, M, z) => { S.add(U(capF(a, c, w * 0.7), ellR(a[0], a[1], w, w * 0.9), ellR(c[0], c[1], w, w * 0.9)), M, { z, h: w * 0.8 }); S.add(capF(lerp(a, c, 0.15), lerp(a, c, 0.3), w * 0.8), SINEW, { z: z + 0.2, h: w * 0.4 }); };
  // 다리 (넓적다리 · 정강이)
  for (const [o, far, d] of [[g.f, 1, -12], [g.n, 0, 12]]) { const hp = [cx + d * 0.6, 92 + b], ft = [cx + d + o[0], G - 4 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 4, L(hp[1], ft[1], 0.5)]; boneLimb(hp, kn, 5, far ? OLDBF : OLDB, far ? -4 : 4); boneLimb(kn, ft, 4.2, far ? BONEF : BONE, far ? -3.8 : 4.2); S.add(U(ellR(ft[0] + 4, ft[1] + 1, 9, 3.4)), far ? OLDBF : OLDB, { z: far ? -3.6 : 4.4, h: 2 }); for (const dd of [0, 4, 8]) S.add(capF([ft[0] + dd, ft[1] + 1], [ft[0] + dd + 4, ft[1] + 2], 1.2), BONE, { z: far ? -3.5 : 4.5, h: 0.6 }); }
  // 골반
  S.add(U(ellR(cx, 90 + b, 16, 8), ellR(cx - 10, 86 + b, 8, 8), ellR(cx + 10, 86 + b, 8, 8)), OLDB, { z: 1, h: 6 });
  S.add(ellR(cx - 8, 88 + b, 3, 3), VD, { z: 1.2, lift: 0.1, h: 0.3 }).add(ellR(cx + 8, 88 + b, 3, 3), VD, { z: 1.2, lift: 0.1, h: 0.3 });
  // 먼 팔
  const shF = [cx - 18, 44 + b], hF = gr ? lerp([cx - 22, 84 + b], [cx + 40, 60 + b], gr) : [cx - 24 + Math.sin(sw) * 4, 86 + b];
  const elF = ik(shF, hF, 22, 22, gr ? -1 : 1);
  boneLimb(shF, elF, 5, BONEF, -3), boneLimb(elF, hF, 4.4, BONEF, -2.8);
  for (let k = 0; k < 4; k++) S.add(capF(hF, pol(hF, 1.2 - gr * 1.2 + k * 0.3, 10), 1.6, 0.8), BONEF, { z: -2.6, h: 1 });
  // 척추 (등)
  for (let k = 0; k < 8; k++) S.add(ellR(cx - 4 + k * 0.6, 84 + b - k * 6, 4, 3), OLDBF, { z: 0.5, h: 3 });
  // 갈비뼈 우리 + 속 골수 불씨
  S.add(ellR(cx + 2, 58 + b, 14, 16), EMB, { z: 0.6, h: 2 });
  S.add(ellR(cx + 2, 58 + b, 9, 11), mat(rampGlow(0xffe0a0)), { z: 0.7, h: 2 });
  for (let k = 0; k < 6; k++) {
    const y = 40 + k * 6.4 + b, ww = 20 - Math.abs(k - 2) * 2.6;
    const rib = [];
    for (let j = 0; j <= 6; j++) { const a = -0.3 + (j / 6) * 2.8; rib.push([cx - 4 + Math.cos(a - 1.4) * ww, y + Math.sin(a - 1.4) * 5 + j * 1.2]); }
    S.add(U(...rib.slice(0, -1).map((q, j) => capF(q, rib[j + 1], 2.2 - j * 0.15))), k % 2 ? BONE : OLDB, { z: 3 + k * 0.05, h: 1.8 });
  }
  S.add(capF([cx + 12, 38 + b], [cx + 14, 76 + b], 2.6, 2), BONE, { z: 3.6, h: 2 });
  // 어깨 (견갑골)
  S.add(polyF([[cx - 24, 38 + b], [cx - 4, 34 + b], [cx - 8, 54 + b]]), OLDB, { z: 2, h: 3, prof: "flat" });
  // 머리 (뿔 달린 소 두개골)
  S.add(capF([cx + 2, 40 + b], [cx + 6, 26 + b], 3.4, 3), OLDBF, { z: 5, h: 2.6 });
  skull(S, [cx + 6, 20 + b], 0.35, 2, 6, { jaw: 0.2 + (p.roar ?? 0) * 0.8, horn: 1.2, curl: 0.9 });
  !p.hurt && S.decal(...pol(pol([cx + 6, 20 + b], 0.35, 3), 0.35 - 1.57, 2.4), 0xffc060);
  // 가까운 팔 + 넓적다리뼈 몽둥이
  const sh = [cx + 18, 44 + b], hd = sw <= 1 ? lerp([cx + 30, 82 + b], pol(sh, -2, 30), sw) : lerp(pol(sh, -2, 30), [cx + 58, 88 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.1, -2.3, sw) : L(-2.3, 0.7, Math.min(1, sw - 1));
  S.add(polyF([[cx + 8, 38 + b], [cx + 30, 38 + b], [cx + 22, 54 + b]]), OLDB, { z: 6, h: 3, prof: "flat" });
  const el = ik(sh, hd, 20, 20, 1);
  boneLimb(sh, el, 5.4, BONE, 7), boneLimb(el, hd, 4.6, BONE, 7.2);
  const top = pol(hd, ba, 46), bot = pol(hd, ba, -8);
  S.add(U(capF(bot, top, 4.4, 5.4), ellR(...pol(top, ba, 2), 9, 8), ellR(...pol(pol(top, ba, -3), ba + 1.57, 6), 6, 6), ellR(...pol(bot, ba, -2), 6, 5)), OLDB, { z: 8, h: 5 });
  S.carve(capF(pol(hd, ba, 8), pol(hd, ba, 40), 0.6), 0.8);
  for (let k = 0; k < 4; k++) S.add(polyF([pol(pol(top, ba, -k * 6), ba + 1.57, 5), pol(pol(top, ba, -k * 6 - 2), ba + 1.57, 11), pol(pol(top, ba, -k * 6 - 4), ba + 1.57, 5)]), BONE, { z: 8.2, h: 1.2, prof: "sharp" });
  for (let k = 0; k < 4; k++) S.add(capF(hd, pol(hd, ba + 1.9 + k * 0.25, 7), 1.6, 0.9), BONE, { z: 8.4, h: 1 });
  S.add(capF(pol(hd, ba, -3), pol(hd, ba, 4), 5), SINEW, { z: 8.5, h: 2 });
  const C = S.render({ rim: !0 });
  dust(C, toPx(W, H, CLK, 72), cx + 2, 58 + b, 14, 8, (p.ph ?? 0) * 2, 0xffe0a0, 0xffa050);
  return fin(C, p);
}
export const pxColossus = {
  fw: Math.round(176 * CLK), fh: Math.round(142 * CLK), w: 36, h: 66,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], grab: [4, 9, !1], roar: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph };
    if (nm === "move") { const g = gait2(f, n, 7, 2.4); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 2, ph };
    if (nm === "rec") P = { sw: 2 * (1 - t), bob: 2 * (1 - t), ph };
    if (nm === "grab") P = { grab: [0.3, 1, 1, 0.5][f], ph };
    if (nm === "roar") P = { roar: [0.5, 1, 1, 0.5][f], bob: -1, ph: ph * 2 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return colossusFrame(P);
  },
};

// ════ 시체 구더기 ════ 짐승 시체 속에서 자란 사람 팔뚝만 한 구더기 · 반투명한 누런 흰 마디 · 속이 비치는 검은 내장 줄 · 입가의 검은 갈고리
//   p: ph · stretch · spit · hurt
const MGK = 0.72;
const GRUB = mat(ramp(0xe8dcc4), { tex: "skin", amp: 0.8, spec: 0.6 }), GRUBF = mat(rampF(0xc0b098), { tex: "skin", amp: 0.7 });
function maggotFrame(p = {}) {
  const W = 72, H = 40, G = H - 1, S = sculpt(W, H, { k: MGK, ax: 34 });
  const ph = p.ph ?? 0, stv = p.stretch ?? 0, sp = p.spit ?? 0, cx = 34;
  const n = 9;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), w = 4 + Math.sin(t * Math.PI) * 6.4 - (k === n - 1 ? 2 : 0);
    const x = cx - 22 + k * (5.2 + stv * 1.4) + Math.sin(ph * 2 - k * 0.8) * 0.8, y = G - w - (k === n - 1 ? sp * 4 : 0);
    S.add(ellR(x, y, 3.6 + stv * 0.6, w), GRUB, { z: 1, h: w * 0.8, blend: k ? 1.4 : 0 });
    k > 0 && S.carve(capF([x - 2.8, y - w], [x - 2.6, y + w], 0.5), 0.9);
  }
  S.add(capF([cx - 18, G - 7], [cx + 16, G - 6], 1), mat(ramp(0x6a5a3a), { tex: "skin" }), { on: 1, lift: -1.2, h: 0.2 });
  const hx = cx - 22 + (n - 1) * (5.2 + stv * 1.4), hy = G - 2.4 - sp * 4;
  S.add(capF([hx + 1, hy - 1], [hx + 4, hy + 1 + sp * 2], 0.8, 0.4), VD, { z: 2.4, h: 0.4 }).add(capF([hx + 1, hy + 1], [hx + 4, hy - 1 - sp], 0.8, 0.4), VD, { z: 2.5, h: 0.4 });
  for (let k = 0; k < 4; k++) S.add(ellR(cx - 16 + k * 10, G - 0.6, 3, 0.8), mat(ramp(0xb8a878), { spec: 0.8 }), { z: 0.4, h: 0.3 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxMaggot = {
  fw: Math.round(72 * MGK), fh: Math.round(40 * MGK), w: 24, h: 12,
  anims: { idle: [6, 5], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: ph * 0.5 };
    if (nm === "move") P = { ph, stretch: Math.max(0, Math.sin(ph)) };
    if (nm === "wind") P = { ph, stretch: -0.6 * t, spit: 0.4 * t };
    if (nm === "atk") P = { ph, stretch: 0.8, spit: [1, 0.8, 0.4][f] };
    if (nm === "rec") P = { ph, spit: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, stretch: -0.5 };
    return maggotFrame(P);
  },
};

// ════ 구울 ════ 시체를 파먹는 굶주린 송장귀 · 갈비뼈가 드러난 잿빛 초록 맨살 · 바닥까지 닿는 긴 팔과 검은 갈고리 손톱 ·
//   네 발로 기다시피 하는 굽은 등 · 움푹 꺼진 눈의 희미한 빛 · 찢어진 입
//   p: legs · bob · claw(0~2) · leap · hurt
const GHK = 0.72;
const GSK = mat(ramp(0x8a907a), { tex: "skin", amp: 1, spec: 0.2 }), GSKF = mat(rampF(0x6a705e), { tex: "skin", amp: 0.9 });
function ghoulFrame(p = {}) {
  const W = 104, H = 80, G = H - 1, S = sculpt(W, H, { k: GHK, ax: 42 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cl = p.claw ?? 0, lp = p.leap ?? 0, cx = 38, Y = 42 + b - lp * 6;
  const leg = (o, far, d) => { const hp = [cx - 8 + d, Y + 8], ft = [cx - 10 + d + o[0] - lp * 6, G - 1 - o[1] - lp * 4], kn = [L(hp[0], ft[0], 0.5) + 8, L(hp[1], ft[1], 0.5) - 3]; S.add(U(capF(hp, kn, 3.6, 2.6), capF(kn, ft, 2.4, 1.8)), far ? GSKF : GSK, { z: far ? -3 : 3, h: 2.2 }); S.add(ellR(kn[0], kn[1], 2.4, 2.2), far ? GSKF : GSK, { z: far ? -2.9 : 3.1, h: 1.6 }); S.add(U(ellR(ft[0] + 2, ft[1], 4, 1.4)), far ? GSKF : GSK, { z: far ? -2.8 : 3.2, h: 1 }); for (const e of [0, 2, 4]) S.add(capF([ft[0] + 3 + e * 0.5, ft[1]], [ft[0] + 6 + e * 0.6, ft[1] + 0.4], 0.5, 0.2), VD, { z: far ? -2.7 : 3.3, h: 0.3 }); };
  leg(g.f, 1, -3);
  // 먼 팔 (땅을 짚음)
  const shF = [cx + 4, Y - 6], hF = cl > 0 ? lerp([cx + 18, G - 2], [cx + 30, Y - 6], Math.min(1, cl)) : [cx + 16 + g.n[0] * 0.6, G - 2 - g.n[1]];
  const elF = ik(shF, hF, 13, 14, -1);
  S.add(U(capF(shF, elF, 2.6, 2), capF(elF, hF, 2, 1.6)), GSKF, { z: -2, h: 1.6 });
  for (const e of [-0.4, 0, 0.4]) S.add(capF(hF, pol(hF, (cl > 0 ? -0.3 : 0.4) + e, 4.4), 0.6, 0.2), VD, { z: -1.9, h: 0.3 });
  // 몸 (굽은 등 · 갈비)
  S.add(U(ellR(cx - 2, Y, 13, 9, 0.35), ellR(cx + 8, Y - 6, 9, 8)), GSK, { z: 1, h: 8 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 2 + k * 3.4, Y - 2], [cx + 0 + k * 3.4, Y + 7], 0.5), 0.9);
  for (let k = 0; k < 6; k++) S.add(ellR(cx - 12 + k * 4.4, Y - 9 + Math.abs(k - 2.5) * 0.8, 1.6, 1.4), GSK, { on: 1, lift: 0.6, h: 0.8 });
  S.add(polyF([[cx - 14, Y + 4], [cx - 2, Y + 6], [cx - 4, Y + 16], [cx - 9, Y + 12], [cx - 13, Y + 15]]), mat(ramp(0x4a3e30), { tex: "cloth", amp: 1.2 }), { z: 2, h: 2 });
  // 머리 (앞으로 내민 · 찢어진 입)
  const hx = cx + 18, hy = Y - 8;
  S.add(U(ellR(hx, hy, 7, 6.4), capF([hx + 2, hy + 2], [hx + 8, hy + 4], 3.6, 2.4)), GSK, { z: 3, h: 5 });
  S.carve(capF([hx + 1, hy + 3.6], [hx + 9, hy + 4.4], 0.6), 1.2, !1);
  for (let k = 0; k < 4; k++) S.decal(hx + 3 + k * 1.6, hy + 3.4, 0xe0d8c0);
  S.add(ellR(hx + 3, hy - 1.4, 2, 1.6), VD, { z: 3.3, lift: 0.1, h: 0.2 });
  S.add(capF([hx - 6, hy - 3], [hx - 9, hy + 2], 1.4, 0.6), GSKF, { z: 2.8, h: 1 });
  for (let k = 0; k < 3; k++) S.add(capF([hx - 4 + k * 2, hy - 6], [hx - 6 + k * 2.4, hy - 9 - k], 0.3), mat(ramp(0x2a2a26)), { z: 3.4, h: 0.2 });
  !p.hurt && S.decal(hx + 3, hy - 1.4, 0xd0ffb0);
  // 가까운 다리
  leg(g.n, 0, 3);
  // 가까운 팔 (갈고리 손톱)
  const sh = [cx + 8, Y - 4], hd = cl <= 1 ? lerp([cx + 22 + g.f[0] * 0.6, G - 2 - g.f[1]], [cx + 16, Y - 22], cl) : lerp([cx + 16, Y - 22], [cx + 36, Y + 4], cl - 1);
  const el = ik(sh, hd, 13, 14, -1), ca = cl <= 1 ? L(0.4, -1.2, cl) : L(-1.2, 0.8, cl - 1);
  S.add(U(capF(sh, el, 2.8, 2.2), capF(el, hd, 2.2, 1.8)), GSK, { z: 6, h: 1.8 });
  S.add(ellR(hd[0], hd[1], 2.6, 2), GSK, { z: 6.2, h: 1.4 });
  for (const e of [-0.45, 0, 0.45]) { const c0 = pol(hd, ca + e, 2), c1 = pol(c0, ca + e + 0.4, 5); S.add(capF(c0, c1, 0.8, 0.2), mat(ramp(0x2a2620), { spec: 0.6 }), { z: 6.4, h: 0.4 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxGhoul = {
  fw: Math.round(104 * GHK), fh: Math.round(80 * GHK), w: 24, h: 24,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], leap: [3, 10, !1], feed: [4, 10] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8 };
    if (nm === "move") { const g = gait2(f, n, 7, 3); P = { legs: g, bob: g.bob * 1.4 }; }
    if (nm === "wind") P = { claw: t, bob: 2 };
    if (nm === "atk") P = { claw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { claw: 2 * (1 - t) };
    if (nm === "leap") P = { leap: [0.4, 1, 0.8][f], claw: [0.5, 1, 1][f] };
    if (nm === "feed") P = { bob: 3 + Math.sin(ph * 2), claw: 0.3 + Math.abs(Math.sin(ph)) * 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2 };
    return ghoulFrame(P);
  },
};

// ════ 부패 쉬파리 ════ 썩은 살에 꼬이는 주먹만 한 쉬파리 · 독으로 부푼 초록 보라 배 · 붉은 겹눈 · 털 난 가슴 · 늘어진 다리 · 윙윙 날개
//   p: ph · flap · bloat · hurt
const BFK = 0.72;
const FLYB = mat(ramp(0x3a4a2a), { tex: "metal", amp: 0.8, spec: 0.8 }), FLYH = mat(ramp(0x2a2824), { tex: "fur", amp: 1.2 }), BELLY = mat(ramp(0x6a8a3a, { hi: 0.5 }), { tex: "skin", amp: 1, spec: 0.7 });
function bloatflyFrame(p = {}) {
  const W = 66, H = 58, S = sculpt(W, H, { k: BFK, ax: 33 });
  const ph = p.ph ?? 0, fl = p.flap ?? 0, bl = p.bloat ?? 0, cx = 33, cy = 26;
  const wing = (far) => { const a = -1.9 + fl * 1.2 + far * 0.3, r = [cx - 2, cy - 5]; S.add(polyF([r, pol(r, a - 0.3, 22), pol(r, a + 0.1, 24), pol(r, a + 0.4, 14)]), mat(ramp(0xc8d0d0, { hi: 0.6 }), { tex: "glass", amp: 1 }), { z: far ? -2 : 6, h: 0.6 }); S.carve(capF(r, pol(r, a, 20), 0.3), 0.5); };
  wing(1);
  // 다리
  for (let k = 0; k < 3; k++) { const q = [cx + 2 + k * 3, cy + 4], m = [q[0] - 2 + k * 2, q[1] + 6], f = [m[0] - 2 + Math.sin(ph + k) * 1.4, m[1] + 6]; S.add(U(capF(q, m, 0.8), capF(m, f, 0.6)), FLYH, { z: 0.5, h: 0.5 }); }
  // 배 (부푼 독주머니)
  const ab = [cx - 10, cy + 2], ar = 10 + bl * 4;
  S.add(ellR(ab[0], ab[1], ar, ar * 0.8), BELLY, { z: 1, h: ar * 0.8 });
  for (let k = 0; k < 4; k++) S.carve(capF([ab[0] - ar + 3 + k * 5, ab[1] - ar * 0.6], [ab[0] - ar + 4 + k * 5, ab[1] + ar * 0.6], 0.5), 0.8);
  for (const [x, y] of [[-4, -2], [2, 4], [-8, 4]]) S.add(ellR(ab[0] + x, ab[1] + y, 1.4 + bl, 1.2 + bl), mat(ramp(0x8a5aa0), { spec: 0.6 }), { on: 1, lift: 0.4, h: 0.6 });
  // 가슴 + 머리 (붉은 겹눈)
  S.add(ellR(cx + 4, cy - 1, 7, 6.4), FLYH, { z: 2, h: 6 });
  for (let k = 0; k < 5; k++) S.add(capF([cx + k * 2, cy - 6], [cx + k * 2 - 1, cy - 9], 0.3), FLYH, { z: 2.2, h: 0.3 });
  S.add(ellR(cx + 12, cy, 5, 5), FLYB, { z: 3, h: 4 });
  S.add(ellR(cx + 13, cy - 1.4, 3.6, 4), mat(ramp(0xb83a2a), { tex: "scale", amp: 1, spec: 0.8 }), { z: 3.4, h: 2.6 });
  S.add(capF([cx + 15, cy + 3], [cx + 17, cy + 7], 0.8, 0.5), FLYH, { z: 3.2, h: 0.5 });
  wing(0);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, BFK, 33);
  for (let k = 0; k < 5; k++) { const q = P(ab[0] - 8 + k * 4 + Math.sin(ph * 2 + k) * 2, ab[1] + 14 + ((k * 5 + ph * 6) % 10)); C.px(q[0], q[1], k % 2 ? 0x8ab040 : 0x6a8a3a); }
  return fin(C, p);
}
export const pxBloatfly = {
  fw: Math.round(66 * BFK), fh: Math.round(58 * BFK), w: 18, h: 16, flying: !0,
  anims: { idle: [4, 16], move: [4, 18], wind: [4, 12, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2, fl = f % 2;
    let P = { ph, flap: fl };
    if (nm === "wind") P = { ph, flap: fl, bloat: t };
    if (nm === "atk") P = { ph, flap: fl, bloat: [1, 0.4, 0][f] };
    if (nm === "rec") P = { ph, flap: fl };
    if (nm === "hurt") P = { hurt: f === 0, ph, flap: 0.5, bloat: 0.5 };
    return bloatflyFrame(P);
  },
};

// ════ [정예] 무덤지기 거인 ════ 협곡 밑바닥 뼈 무덤을 지키는 꼽추 거인 · 챙 넓은 해진 모자 · 누더기 긴 외투 · 해골 꿴 허리 사슬 ·
//   한 손에 거대한 무덤 삽 · 다른 손에 초록 도깨비불이 든 해골 등롱
//   p: legs · bob · sw · lamp · hurt
const KPK = 0.66;
function keeperFrame(p = {}) {
  const W = 180, H = 140, G = H - 1, S = sculpt(W, H, { k: KPK, ax: 74 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, lm = p.lamp ?? 0, cx = 70;
  const COAT = mat(ramp(0x4a463c), { tex: "cloth", amp: 1.2 }), COATF = mat(rampF(0x2a2a26), { tex: "cloth", amp: 1 }), KSK = mat(ramp(0x8a8478), { tex: "skin", amp: 1 }), KSKF = mat(rampF(0x6a6458), { tex: "skin" });
  // 다리 (장화)
  for (const [o, far, d] of [[g.f, 1, -10], [g.n, 0, 10]]) { const hp = [cx + d * 0.6, 92 + b], ft = [cx + d + o[0], G - 3 - o[1]]; S.add(capF(hp, ft, 8, 7), far ? COATF : mat(ramp(0x4a4238), { tex: "cloth" }), { z: far ? -3 : 3, h: 6 }); S.add(U(ellR(ft[0] + 4, ft[1], 10, 4), capF([ft[0] - 2, ft[1] - 10], [ft[0] - 2, ft[1] - 2], 7)), far ? LEATHF : LEATH, { z: far ? -2.9 : 3.1, h: 3 }); }
  // 먼 팔 + 해골 등롱
  const shF = [cx - 14, 46 + b], hF = lm ? lerp([cx - 42, 72 + b], [cx + 30, 52 + b], lm) : [cx - 42, 72 + b];
  const elF = ik(shF, hF, 20, 20, 1);
  S.add(U(capF(shF, elF, 7, 6), capF(elF, hF, 6, 5)), COATF, { z: -2, h: 5 });
  S.add(ellR(hF[0], hF[1], 5, 4.4), KSKF, { z: -1.9, h: 3 });
  const lp = [hF[0] + 2, hF[1] + 16];
  S.add(capF(hF, [lp[0], lp[1] - 10], 0.8), IRON, { z: -1.8, h: 0.6 });
  const LZ = lm > 0.5 ? 12 : -1.6;
  S.add(ellR(lp[0], lp[1], 9, 8), GGL, { z: LZ, h: 4 });
  skull(S, [lp[0] - 2, lp[1]], 0.3, 1, LZ + 0.2, { jaw: 0.3, M: OLDB, MF: OLDBF });
  S.add(ellR(lp[0] + 1, lp[1] - 1, 2.4, 2), GGLW, { z: LZ + 2, h: 1 });
  // 몸 (굽은 등 · 혹 · 긴 외투)
  S.add(U(ellR(cx, 66 + b, 26, 26), ellR(cx - 10, 44 + b, 20, 16)), COAT, { z: 1, h: 18 });
  const hem = [];
  for (let k = 0; k <= 8; k++) hem.push([cx - 28 + k * 7, 102 + b + (k % 2) * 6 + Math.sin(k * 1.7) * 2]);
  S.add(polyF([[cx - 26, 70 + b], [cx + 26, 70 + b], ...hem.slice().reverse()]), COATF, { z: 1.4, h: 6 });
  for (let k = 0; k < 5; k++) S.carve(capF([cx - 20 + k * 10, 76 + b], [cx - 22 + k * 10.6, 104 + b], 0.6), 1);
  for (const [x, y] of [[cx - 14, 54], [cx + 6, 80], [cx - 6, 92]]) S.add(polyF([[x - 4, y + b], [x + 4, y + b], [x + 3, y + 6 + b], [x - 3, y + 7 + b]]), mat(ramp(0x5a4a3a), { tex: "cloth" }), { on: 1, lift: 0.4, h: 0.6 });
  // 허리 사슬 + 해골
  for (let k = 0; k < 10; k++) { const q = lerp([cx - 24, 72 + b], [cx + 24, 76 + b], k / 9); S.add(minus(ellR(q[0], q[1] + Math.sin(k) * 1.4, 2.4, 1.6), ellR(q[0], q[1] + Math.sin(k) * 1.4, 1.2, 0.6)), IRON, { z: 2.5, h: 1 }); }
  for (const x of [-14, 2, 16]) skull(S, [cx + x, 82 + b], 1.6, 0.7, 3, { jaw: !1 });
  // 머리 (앞으로 숙임 · 모자 · 매부리코 · 수염)
  const hx = cx + 28, hy = 38 + b;
  S.add(capF([cx + 8, 50 + b], [hx - 2, hy + 6], 8, 6), COAT, { z: 2.6, h: 5 });
  S.add(ellR(hx, hy + 2, 9, 9.4), KSK, { z: 3, h: 6 });
  S.add(U(capF([hx + 6, hy], [hx + 12, hy + 6], 2.6, 1.4)), KSK, { z: 3.4, h: 2 });
  S.add(polyF([[hx - 6, hy + 6], [hx + 8, hy + 8], [hx + 6, hy + 22], [hx, hy + 18], [hx - 4, hy + 20]]), mat(ramp(0x8a8a80), { tex: "fur", dir: 1.57 }), { z: 3.6, h: 3 });
  S.add(ellR(hx + 4, hy - 1, 2, 1.4), VD, { z: 3.6, lift: 0.1, h: 0.2 });
  !p.hurt && S.decal(hx + 4, hy - 1, 0xd0ffb0);
  S.add(capF([hx - 24, hy - 6], [hx + 22, hy - 8], 2.6, 2), COATF, { z: 4.4, h: 2 });
  S.add(U(ellR(hx - 2, hy - 12, 12, 8), polyF([[hx - 12, hy - 10], [hx - 8, hy - 22], [hx + 6, hy - 20], [hx + 10, hy - 10]])), COAT, { z: 4.6, h: 6 });
  S.add(capF([hx - 11, hy - 11], [hx + 9, hy - 11], 1.6), LEATH, { z: 4.8, h: 1 });
  // 가까운 팔 + 무덤 삽
  const sh = [cx + 12, 58 + b], hd = sw <= 1 ? lerp([cx + 26, 84 + b], pol(sh, -1.9, 30), sw) : lerp(pol(sh, -1.9, 30), [cx + 54, 92 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.3, -2.2, sw) : L(-2.2, 0.8, Math.min(1, sw - 1));
  const el = ik(sh, hd, 20, 20, 1);
  S.add(ellR(sh[0], sh[1], 9, 8), COAT, { z: 6, h: 6 });
  S.add(U(capF(sh, el, 7, 6), capF(el, hd, 6, 5)), COAT, { z: 7, h: 5 });
  S.add(ellR(hd[0], hd[1], 5, 4.4), KSK, { z: 7.2, h: 3 });
  const top = pol(hd, ba, 50), bot = pol(hd, ba, -12), n = ba + Math.PI / 2;
  S.add(capF(bot, top, 2, 1.8), WOOD, { z: 8, h: 1.6 });
  S.add(capF(pol(bot, n, -4), pol(bot, n, 4), 1.4), WOOD, { z: 8.1, h: 1 });
  S.add(polyF([pol(pol(top, ba, -4), n, -8), pol(pol(top, ba, -4), n, 8), pol(pol(top, ba, 16), n, 7), pol(top, ba, 22), pol(pol(top, ba, 16), n, -7)]), IRON, { z: 8.4, h: 2.4, prof: "flat" });
  S.carve(capF(pol(top, ba, 0), pol(top, ba, 16), 0.6), 0.8);
  S.add(ellR(...pol(pol(top, ba, 10), n, 3), 3, 2), mat(ramp(0x6a4a2a), { tex: "clay" }), { on: 1, lift: 0.3, h: 0.4 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, KPK, 74);
  for (let k = 0; k < 8; k++) { const q = P(lp[0] + Math.sin((p.ph ?? 0) + k) * 6, lp[1] - 8 - ((k * 5 + (p.ph ?? 0) * 8) % 18)); C.px(q[0], q[1], k % 2 ? 0xb8e070 : 0xf0ffd0); }
  return fin(C, p);
}
export const pxKeeper = {
  fw: Math.round(180 * KPK), fh: Math.round(140 * KPK), w: 36, h: 62,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], lamp: [4, 8, !1], dig: [4, 9, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph };
    if (nm === "move") { const g = gait2(f, n, 6, 2); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 2, ph };
    if (nm === "rec") P = { sw: 2 * (1 - t), bob: 2 * (1 - t), ph };
    if (nm === "lamp") P = { lamp: [0.4, 1, 1, 0.6][f], ph: ph * 2 };
    if (nm === "dig") P = { sw: [0.6, 1.8, 2, 1.2][f], bob: 2, ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return keeperFrame(P);
  },
};
