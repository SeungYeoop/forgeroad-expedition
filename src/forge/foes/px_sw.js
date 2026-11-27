// 섀도웰 몬스터 12종 (조각 도구, 오른쪽을 본다) — 바닥 없는 심연 협곡 · 멀리 걸린 다리 · 보랏빛 어둠 입자
//   위 줄: 심연 감시자 · 그림자 꼭두각시 · 심연 촉수 · [정예] 심연 처형인
//   가운데 줄: 그림자 분신 · 작은 특이점 · 자수정 가시도마뱀 · [정예] 심연 거인의 손
//   아래 줄: 공허 성게 · 공허 교단 사제 · 그림자 거미불가사리 · [정예] 심연의 사신
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm } from "./px_ah.js";

const VOID = mat(ramp(0x3a2a4a), { tex: "skin", amp: 0.8, spec: 0.4 }), VOIDF = mat(rampF(0x2a1e38), { tex: "skin", amp: 0.7 }), VD = mat(ramp(0x161020));
const AME = mat(ramp(0x9a6ad8, { hi: 0.6 }), { tex: "crystal", amp: 0.7, spec: 0.9 }), AMEF = mat(rampF(0x7a50b0), { tex: "crystal", amp: 0.6 });
const VGL = mat(rampGlow(0xc8a0ff)), VGLW = mat(rampGlow(0xf0e0ff)), BONE = mat(ramp(0xd0c8b8), { tex: "stone", amp: 0.5, spec: 0.3 }), BONEF = mat(rampF(0xa8a090), { tex: "stone", amp: 0.5 });
const IRON = mat(ramp(0x5a5660), { tex: "metal", amp: 0.9, spec: 0.5 }), IRONF = mat(rampF(0x46424c), { tex: "metal", amp: 0.8 }), LEATH = mat(ramp(0x4a3a30), { tex: "leather", amp: 0.9 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 보랏빛 어둠 입자 (렌더 뒤)
function motes(C, P, cx, cy, r, n, ph) { for (let k = 0; k < n; k++) { const a = ph + k * 2.39, rr = r * (0.5 + ((k * 7) % 5) / 8), q = P(cx + Math.cos(a) * rr, cy + Math.sin(a * 1.3) * rr * 0.7); C.px(q[0], q[1], k % 3 ? 0x9a6ad8 : 0xe0c8ff); } }

// ════ 심연 감시자 ════ 보랏빛 살덩이에 눈 아홉이 박혀 사방을 본다 · 가운데 큰 눈 · 아래로 늘어진 신경 가닥 · 눈마다 빛줄기를 쏜다
//   p: ph · look · glare · hurt
const WTK = 0.72;
function watcherFrame(p = {}) {
  const W = 66, H = 70, S = sculpt(W, H, { k: WTK, ax: 33 });
  const ph = p.ph ?? 0, lk = p.look ?? 0, gl = p.glare ?? 0, cx = 33, cy = 28;
  for (let k = 0; k < 6; k++) { let q = [cx - 10 + k * 4, cy + 10]; for (let j = 0; j < 4; j++) { const n2 = [q[0] + Math.sin(ph + k + j) * 2, q[1] + 6]; S.add(capF(q, n2, 1.2 - j * 0.2, 1 - j * 0.2), VOIDF, { z: -1, h: 0.6 }); q = n2; } }
  S.add(U(ellR(cx, cy, 15, 14), ellR(cx - 8, cy + 4, 8, 7), ellR(cx + 9, cy + 5, 7, 6)), VOID, { z: 1, h: 11 });
  for (let k = 0; k < 5; k++) S.carve(capF(pol([cx, cy], k * 1.3, 4), pol([cx, cy], k * 1.3 + 0.3, 13), 0.5), 0.6);
  const eyes = [[0, 0, 6], [-10, -6, 3], [9, -7, 3.4], [-12, 5, 2.6], [11, 6, 2.6], [-4, -11, 2.4], [5, 10, 2.4], [-6, 10, 2], [13, -1, 2]];
  for (const [dx, dy, r] of eyes) {
    const e0 = [cx + dx, cy + dy];
    S.add(ellR(e0[0], e0[1], r + 0.8, r + 0.6), VOIDF, { lift: 0.6, h: r * 0.4 });
    S.add(ellR(e0[0], e0[1], r, r * 0.9), mat(ramp(0xe8e0d8), { spec: 0.6 }), { lift: 1, h: r * 0.6 });
    S.add(ellR(e0[0] + lk * r * 0.4 + 0.3, e0[1], r * 0.55, r * 0.55), gl ? VGL : mat(ramp(0x7a3ac8), { spec: 0.6 }), { lift: 1.4, h: 0.4 });
    !p.hurt && S.decal(e0[0] + lk * r * 0.4 + 0.4, e0[1], 0x100818);
  }
  const C = S.render({ rim: !0 });
  motes(C, toPx(W, H, WTK, 33), cx, cy, 24, 8, ph);
  return fin(C, p);
}
export const pxWatcher = {
  fw: Math.round(66 * WTK), fh: Math.round(70 * WTK), w: 22, h: 22, flying: !0,
  anims: { idle: [6, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, look: Math.sin(ph) };
    if (nm === "wind") P = { ph, look: 1, glare: f > 1 ? 1 : 0 };
    if (nm === "atk") P = { ph, look: 1, glare: 1 };
    if (nm === "rec") P = { ph, look: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, look: -1 };
    return watcherFrame(P);
  },
};

// ════ 그림자 꼭두각시 ════ 위에서 내려온 그림자 실에 매달려 움직이는 나무 꼭두각시 · 마디 관절 · 금 간 하얀 가면 · 칼 든 팔이 실에 끌려 휘둘린다
//   p: ph · legs · sw · hurt
const PPK = 0.72;
const PWD = mat(ramp(0x7a5a44), { tex: "wood", amp: 1 }), PWDF = mat(rampF(0x5e4434), { tex: "wood", amp: 0.9 });
function puppetFrame(p = {}) {
  const W = 104, H = 104, G = H - 1, S = sculpt(W, H, { k: PPK, ax: 40 });
  const ph = p.ph ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 38, b = Math.sin(ph) * 2;
  const joint = (q, far) => S.add(ellR(q[0], q[1], 2, 2), far ? PWDF : PWD, { z: far ? -1.5 : 5.5, h: 1.4 });
  // 다리 (마디)
  for (const [o, far, d] of [[g.f, 1, -4], [g.n, 0, 4]]) { const hp = [cx + d * 0.6, 64 + b], kn = [cx + d + 3 + o[0] * 0.5, 80 + b * 0.5], ft = [cx + d + o[0], G - 2 - o[1]]; S.add(capF(hp, kn, 2.2), far ? PWDF : PWD, { z: far ? -2 : 3, h: 2 }); S.add(capF(kn, ft, 1.8), far ? PWDF : PWD, { z: far ? -2 : 3, h: 1.8 }); joint(kn, far); S.add(ellR(ft[0] + 2, ft[1], 3.4, 1.6), far ? PWDF : PWD, { z: far ? -1.9 : 3.1, h: 1.2 }); }
  // 먼 팔
  const shF = [cx - 6, 40 + b], elF = [cx - 10, 52 + b + Math.sin(ph + 1) * 2], hF = [cx - 8, 62 + b];
  S.add(capF(shF, elF, 1.8), PWDF, { z: -2, h: 1.6 }); S.add(capF(elF, hF, 1.6), PWDF, { z: -2, h: 1.4 }); joint(elF, 1);
  // 몸 (통 · 허리 마디) + 해진 옷
  S.add(U(ellR(cx, 46 + b, 9, 10), ellR(cx, 60 + b, 7, 5)), PWD, { z: 1, h: 6 });
  S.carve(capF([cx - 8, 55 + b], [cx + 8, 55 + b], 0.6), 1);
  S.add(polyF([[cx - 9, 38 + b], [cx + 9, 38 + b], [cx + 11, 58 + b], [cx + 4, 55 + b], [cx - 2, 60 + b], [cx - 11, 56 + b]]), mat(ramp(0x5a2a4a), { tex: "cloth", amp: 1.1 }), { z: 1.5, h: 4 });
  // 머리 (나무 구 · 금 간 하얀 가면)
  const hx = cx + 2, hy = 28 + b;
  S.add(ellR(hx, hy, 7, 7.4), PWD, { z: 3, h: 5 });
  S.add(ellR(hx + 3, hy, 5, 6.4), mat(ramp(0xe8e0d8), { spec: 0.4 }), { z: 3.4, h: 3 });
  S.add(ellR(hx + 4.4, hy - 1.6, 1.4, 1), VD, { z: 3.6, lift: 0.1, h: 0.2 });
  S.carve(capF([hx + 3, hy + 3], [hx + 7, hy + 4], 0.4), 0.8);
  S.carve(capF([hx + 2, hy - 6], [hx + 4, hy + 1], 0.3), 0.8);
  !p.hurt && S.decal(hx + 4.6, hy - 1.6, 0xc8a0ff);
  // 가까운 팔 + 칼
  const sh = [cx + 6, 40 + b], hd = sw <= 1 ? lerp([cx + 12, 60 + b], pol(sh, -1.7, 16), sw) : lerp(pol(sh, -1.7, 16), pol(sh, 0.4, 18), Math.min(1, sw - 1)), el = [L(sh[0], hd[0], 0.5) + 2, L(sh[1], hd[1], 0.5) + 2];
  S.add(capF(sh, el, 2), PWD, { z: 6, h: 1.6 }); S.add(capF(el, hd, 1.8), PWD, { z: 6, h: 1.4 }); joint(el, 0);
  const ba = sw <= 1 ? L(1.2, -2.4, sw) : L(-2.4, 0.6, Math.min(1, sw - 1)), tip = pol(hd, ba, 22);
  S.add(polyF([pol(hd, ba + 1.57, 1.2), pol(tip, ba + 1.57, 0.4), tip, pol(hd, ba - 1.57, 0.8)]), IRON, { z: 6.5, h: 1, prof: "sharp" });
  S.add(capF(pol(hd, ba + 1.57, 2.6), pol(hd, ba - 1.57, 2.6), 0.7), IRONF, { z: 6.6, h: 0.6 });
  const C = S.render({ rim: !0 });
  // 그림자 실 (위로)
  const P = toPx(W, H, PPK, 40);
  for (const q of [[hx, hy - 7], [sh[0], sh[1]], [hd[0], hd[1]], [shF[0], shF[1]], [cx, 60 + b]]) for (let y = q[1]; y > 0; y -= 1.4) { const r = P(q[0] + Math.sin(y * 0.2 + ph) * 0.6, y); C.px(r[0], r[1], (Math.floor(y) % 3) ? 0x6a4a9a : 0xc8a0ff); }
  return fin(C, p);
}
export const pxPuppet = {
  fw: Math.round(104 * PPK), fh: Math.round(104 * PPK), w: 16, h: 32,
  anims: { idle: [6, 5], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") { const g = gait2(f, n, 5, 4); P = { legs: g, ph: ph * 2 }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], ph };
    if (nm === "rec") P = { sw: 2 * (1 - t), ph };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return puppetFrame(P);
  },
};

// ════ 심연 촉수 ════ 바위 벽의 보랏빛 틈에서 뻗어 나온 촉수 셋 · 끝마다 갈고리 · 틈 안쪽은 별빛 같은 어둠
//   p: ph · lash · hurt
const TNK = 0.72;
function tendrilFrame(p = {}) {
  const W = 88, H = 86, G = H - 1, S = sculpt(W, H, { k: TNK, ax: 36 });
  const ph = p.ph ?? 0, ls = p.lash ?? 0, cx = 30;
  // 틈 (바닥의 갈라진 구멍)
  S.add(U(ellR(cx, G - 4, 22, 5)), mat(ramp(0x4a4250), { tex: "stone", amp: 1 }), { z: -1, h: 3 });
  S.add(ellR(cx, G - 4, 16, 3), VD, { z: -0.9, h: 0.6 });
  for (let k = 0; k < 4; k++) S.add(ellR(cx - 10 + k * 7, G - 4, 0.8, 0.6), VGLW, { z: -0.8, h: 0.3 });
  // 촉수 셋
  for (const [k, z] of [[1, 0], [0, 2], [2, 4]]) {
    let q = [cx - 8 + k * 8, G - 5], a = -Math.PI / 2 + (k - 1) * 0.3;
    for (let j = 0; j < 10; j++) {
      a += Math.sin(ph + j * 0.6 + k * 2) * 0.18 + (k === 1 ? ls * 0.14 : 0);
      const n2 = pol(q, a, 6.4 - j * 0.3), w = 5 - j * 0.42;
      S.add(capF(q, n2, w, w - 0.4), j % 2 ? VOID : VOIDF, { z, h: w * 0.8 });
      j > 1 && S.add(ellR(...pol(lerp(q, n2, 0.5), a + 1.57, w * 0.5), w * 0.3, w * 0.3), mat(ramp(0x8a6aa8)), { z: z + 0.1, h: 0.3 });
      q = n2;
    }
    S.add(polyF([pol(q, a + 1.57, 1.4), pol(q, a, 5), pol(pol(q, a, 3), a + 2.4, 4)]), BONE, { z: z + 0.2, h: 0.8, prof: "sharp" });
  }
  const C = S.render({ rim: !0 });
  motes(C, toPx(W, H, TNK, 36), cx, G - 30, 26, 8, ph);
  return fin(C, p);
}
export const pxTendril = {
  fw: Math.round(88 * TNK), fh: Math.round(86 * TNK), w: 30, h: 40,
  anims: { idle: [6, 5], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, lash: -0.6 * t };
    if (nm === "atk") P = { ph, lash: [0.6, 1.2, 1][f] };
    if (nm === "rec") P = { ph, lash: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3, lash: -0.4 };
    return tendrilFrame(P);
  },
};

// ════ [정예] 심연 처형인 ════ 다리 위의 처형인 · 눈구멍만 뚫린 검은 두건 · 맨 어깨와 근육질 팔 · 가죽 앞치마와 쇠사슬 · 피 얼룩 거대 도끼 ·
//   몸에서 보랏빛 어둠이 피어오른다
//   p: legs · bob · sw · hurt
const EXK = 0.72;
const ESK = mat(ramp(0x8a7a70), { tex: "skin", amp: 0.8 }), ESKF = mat(rampF(0x6e6058), { tex: "skin", amp: 0.7 }), HOOD = mat(ramp(0x1e1a24), { tex: "cloth", amp: 1 });
function executionerFrame(p = {}) {
  const W = 160, H = 128, G = H - 1, S = sculpt(W, H, { k: EXK, ax: 58 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 56;
  // 다리 (가죽 바지 · 장화)
  for (const [o, far, d] of [[g.f, 1, -9], [g.n, 0, 9]]) { const hp = [cx + d * 0.6, 82 + b], ft = [cx + d + o[0], G - 3 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 3, L(hp[1], ft[1], 0.5)]; S.add(U(capF(hp, kn, 8, 7), capF(kn, ft, 7, 6)), far ? mat(rampF(0x3a2e26), { tex: "leather" }) : LEATH, { z: far ? -3 : 3, h: 6 }); S.add(U(ellR(ft[0] + 4, ft[1], 9, 3.6)), far ? mat(rampF(0x2a2420)) : mat(ramp(0x3a3028), { tex: "leather" }), { z: far ? -2.9 : 3.1, h: 2.4 }); }
  // 먼 팔 (도끼 자루를 함께 쥠)
  const sh = [cx + 18, 52 + b], hdN = sw <= 1 ? lerp([cx + 26, 92 + b], pol(sh, -1.9, 26), sw) : lerp(pol(sh, -1.9, 26), [cx + 46, 92 + b], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.4, -2.3, sw) : L(-2.3, 0.6, Math.min(1, sw - 1));
  const shF = [cx - 16, 52 + b], hF = pol(hdN, ba, -12);
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 7, 6), capF(lerp(shF, hF, 0.5), hF, 6, 5)), ESKF, { z: -2, h: 5 });
  // 몸 (근육질 가슴 · 가죽 앞치마 · 쇠사슬)
  S.add(U(ellR(cx, 60 + b, 22, 20), ellR(cx, 78 + b, 17, 10)), ESK, { z: 1, h: 16 });
  S.carve(capF([cx + 2, 46 + b], [cx + 2, 72 + b], 0.6), 0.8).carve(capF([cx - 14, 60 + b], [cx + 18, 58 + b], 0.6), 0.7);
  for (const y of [66, 72]) S.carve(capF([cx - 4, y + b], [cx + 10, y + b], 0.4), 0.5);
  S.add(polyF([[cx - 16, 70 + b], [cx + 18, 70 + b], [cx + 20, 104 + b], [cx - 18, 104 + b]]), LEATH, { z: 2, h: 6 });
  for (const [x, y, r] of [[cx + 6, 84, 3], [cx - 8, 92, 2.4], [cx + 12, 96, 2]]) S.add(ellR(x, y + b, r, r * 0.7), mat(ramp(0x4a1a1e)), { on: 1, lift: 0.3, h: 0.3 });
  for (let k = 0; k < 8; k++) { const q = lerp([cx - 18, 46 + b], [cx + 16, 76 + b], k / 7); S.add(minus(ellR(q[0], q[1], 2.4, 1.6, 0.7), ellR(q[0], q[1], 1.2, 0.6, 0.7)), IRON, { z: 2.5, h: 1 }); }
  // 두건 머리
  const hx = cx + 6, hy = 32 + b;
  S.add(U(ellR(hx, hy, 11, 12), polyF([[hx - 12, hy + 4], [hx + 10, hy + 6], [hx + 14, hy + 16], [hx - 14, hy + 16]])), HOOD, { z: 3, h: 9 });
  S.add(polyF([[hx - 2, hy - 12], [hx + 2, hy - 18], [hx + 4, hy - 11]]), HOOD, { z: 3.1, h: 2 });
  for (const x of [hx + 4, hx + 9]) { S.add(ellR(x, hy - 1, 2, 1.4), VD, { z: 3.3, lift: 0.1, h: 0.2 }); !p.hurt && S.decal(x, hy - 1, 0xc8a0ff); }
  // 가까운 팔 + 거대 도끼
  S.add(ellR(sh[0], sh[1], 9, 8), ESK, { z: 6, h: 6 });
  const el = ik(sh, hdN, 15, 15, 1);
  S.add(U(capF(sh, el, 7, 6), capF(el, hdN, 6, 5)), ESK, { z: 7, h: 5 });
  S.add(capF(lerp(el, hdN, 0.6), lerp(el, hdN, 0.9), 5.4), LEATH, { z: 7.1, h: 4 });
  const top = pol(hdN, ba, 34), bot = pol(hdN, ba, -22);
  S.add(capF(bot, top, 2, 1.6), mat(ramp(0x4a3a2a), { tex: "wood" }), { z: 8, h: 1.6 });
  const n = ba + Math.PI / 2;
  S.add(polyF([pol(top, ba, 2), pol(pol(top, ba, 6), n, 14), pol(pol(top, ba, -6), n, 18), pol(pol(top, ba, -16), n, 15), pol(top, ba, -12)]), IRON, { z: 8.2, h: 2.4, prof: "sharp" });
  S.add(capF(pol(pol(top, ba, 5), n, 14.6), pol(pol(top, ba, -15), n, 16), 0.8), mat(ramp(0xc8c8d0), { spec: 0.8 }), { on: 1, lift: 0.4, h: 0.3 });
  S.add(ellR(...pol(pol(top, ba, -6), n, 10), 3, 2.4), mat(ramp(0x4a1a1e)), { on: 1, lift: 0.3, h: 0.3 });
  S.add(polyF([pol(top, ba, -2), pol(pol(top, ba, -6), n, -8), pol(top, ba, -10)]), IRONF, { z: 8.1, h: 1.4, prof: "sharp" });
  const C = S.render({ rim: !0 });
  motes(C, toPx(W, H, EXK, 58), cx, 70 + b, 40, 14, (p.ph ?? 0) + sw);
  return fin(C, p);
}
export const pxExecutioner = {
  fw: Math.round(160 * EXK), fh: Math.round(128 * EXK), w: 32, h: 60,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, ph };
    if (nm === "move") { const g = gait2(f, n, 6, 2.4); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 2, ph };
    if (nm === "rec") P = { sw: 2 * (1 - t) + (t > 0.5 ? 0 : 0), bob: 2 * (1 - t), ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 2, ph };
    return executionerFrame(P);
  },
};

// ════ 그림자 분신 ════ 칠흑 어둠으로 빚은 갑옷 전사의 그림자 · 보랏빛 두 눈 · 윤곽선만 희미하게 빛난다 · 가장자리가 연기처럼 흩어진다
//   p: legs · bob · sw · fade · hurt
const DBK = 0.72;
const SHD = mat(ramp(0x24202e), { tex: "cloth", amp: 0.6, spec: 0.4 }), SHDF = mat(rampF(0x18141e), { tex: "cloth", amp: 0.5 });
function doubleFrame(p = {}) {
  const W = 110, H = 92, G = H - 1, S = sculpt(W, H, { k: DBK, ax: 38 });
  const b = p.bob ?? 0, sw = p.sw ?? 0, cx = 36;
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: SHD, hurt: p.hurt,
    legO: { thigh: SHD, thighF: SHDF, shin: SHD, shinF: SHDF, boot: SHD, bootF: SHDF, knee: !1 },
    head: (hx, hy) => {
      S.add(U(ellR(hx, hy, 7, 7.4), polyF([[hx - 6, hy + 2], [hx + 7, hy + 2], [hx + 5, hy + 8], [hx - 4, hy + 8]])), SHD, { z: 4, h: 5 });
      for (const [d, z] of [[-1, 4.1], [1, 4.4]]) S.add(U(capF([hx + d * 4, hy - 4], [hx + d * 8, hy - 12], 1.4, 0.6)), SHDF, { z, h: 1 });
      !p.hurt && S.decal(hx + 4, hy, 0xc8a0ff).decal(hx + 6.4, hy, 0xc8a0ff);
    },
  });
  const sh = sol.S0, hd = sw <= 1 ? lerp([cx + 12, 58 + b], pol(sh, -1.8, 15), sw) : lerp(pol(sh, -1.8, 15), pol(sh, 0.4, 18), Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.2, -2.5, sw) : L(-2.5, 0.6, Math.min(1, sw - 1));
  arm(S, sol.S1, [cx - 4, 58 + b], 1, { M: SHD, MF: SHDF, z: -2 });
  S.add(ellR(sh[0], sh[1] + 1, 5.4, 4.4, 0.3), SHD, { z: 7, h: 3 });
  arm(S, sh, hd, 0, { M: SHD, MF: SHDF });
  const tip = pol(hd, ba, 28);
  S.add(polyF([pol(hd, ba + 1.57, 1.6), pol(tip, ba + 1.57, 0.6), tip, pol(tip, ba - 1.57, 0.6), pol(hd, ba - 1.57, 1.6)]), SHDF, { z: 9, h: 1.2, prof: "sharp" });
  S.add(capF(pol(hd, ba, 3), pol(hd, ba, 26), 0.4), VGL, { z: 9.1, h: 0.3 });
  const C = S.render({ rim: !0 });
  // 윤곽 빛 + 흩어지는 가장자리
  const { W: CW, H: CH, d } = C, out = new Int32Array(d);
  for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) { const i = y * CW + x; if (d[i] < 0) continue; if (d[i - 1] < 0 || d[i + 1] < 0 || d[i - CW] < 0 || d[i + CW] < 0) out[i] = (x + y + Math.round((p.ph ?? 0) * 4)) % 5 ? 0x5a3a8a : 0xc8a0ff; }
  for (let i = 0; i < d.length; i++) if (out[i]) d[i] = out[i];
  const P = toPx(W, H, DBK, 38);
  for (let k = 0; k < 10; k++) { const q = P(cx - 14 + (k % 5) * 4 + Math.sin(k + (p.ph ?? 0)) * 3, 40 + b - (k * 7 + (p.ph ?? 0) * 6) % 30); C.px(q[0], q[1], 0x3a2a5a); }
  return fin(C, p);
}
export const pxDouble = {
  fw: Math.round(110 * DBK), fh: Math.round(92 * DBK), w: 16, h: 30,
  anims: { idle: [6, 5], move: [6, 10], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") { const g = gait2(f, n, 5, 2.4); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 1, ph };
    if (nm === "rec") P = { sw: 2 + t, bob: 1 - t, ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, ph };
    return doubleFrame(P);
  },
};

// ════ 작은 특이점 ════ 빛을 삼키는 검은 구슬 · 둘레를 빙빙 도는 보랏빛 강착 원반 · 끌려 들어가는 돌 조각과 빛 줄기
//   p: ph · pull · hurt
const SGK = 0.72;
function singularFrame(p = {}) {
  const W = 64, H = 56, S = sculpt(W, H, { k: SGK, ax: 32 });
  const ph = p.ph ?? 0, pl = p.pull ?? 0, cx = 32, cy = 28;
  // 원반 (뒤 반쪽 → 구슬 → 앞 반쪽)
  const disk = (front) => { for (let k = 0; k < 18; k++) { const a = ph * 2 + (k / 18) * T2, s = Math.sin(a); if (front ? s < 0 : s >= 0) continue; const r = 15 + (k % 3) * 2 + pl * 3, q = [cx + Math.cos(a) * r, cy + s * r * 0.3]; S.add(ellR(q[0], q[1], 2.6, 1.2, 0), k % 3 ? VGL : VGLW, { z: front ? 3 : -2, h: 0.6 }); } };
  disk(0);
  S.add(ellR(cx, cy, 8 + pl * 2, 8 + pl * 2), VD, { z: 1, h: 6 });
  S.add(minus(ellR(cx, cy, 9.4 + pl * 2, 9.4 + pl * 2), ellR(cx, cy, 8 + pl * 2, 8 + pl * 2)), VGLW, { z: 0.9, h: 3 });
  disk(1);
  for (let k = 0; k < 4; k++) { const a = ph * 1.4 + k * 1.57, r = 22 - ((ph * 4 + k * 3) % 10), q = [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6]; S.add(ellR(q[0], q[1], 1.8, 1.4), mat(ramp(0x6a6470), { tex: "stone" }), { z: Math.sin(a) > 0 ? 3.5 : -2.5, h: 1 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxSingular = {
  fw: Math.round(64 * SGK), fh: Math.round(56 * SGK), w: 16, h: 16, flying: !0,
  anims: { idle: [6, 10], move: [6, 12], wind: [4, 10, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph: ph * 2, pull: t };
    if (nm === "atk") P = { ph: ph * 2, pull: 1 - t * 0.5 };
    if (nm === "rec") P = { ph, pull: 0 };
    if (nm === "hurt") P = { hurt: f === 0, ph, pull: -0.4 };
    return singularFrame(P);
  },
};

// ════ 자수정 가시도마뱀 ════ 등과 꼬리를 덮은 자수정 결정 가시 · 납작한 몸 · 위협하면 결정 가시를 곤두세우고 쏘아 보낸다
//   p: legs · bob · bristle · hurt
const DVK = 0.72;
const LZD = mat(ramp(0x5a4a60), { tex: "scale", amp: 1, spec: 0.4 }), LZDF = mat(rampF(0x463a4c), { tex: "scale", amp: 0.9 });
function devilFrame(p = {}) {
  const W = 92, H = 48, G = H - 1, S = sculpt(W, H, { k: DVK, ax: 42 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, br = p.bristle ?? 0, cx = 40;
  const lgf = (sh, o, far, front) => { const el = [sh[0] + (front ? 3 : -3), sh[1] + 3], ft = [sh[0] + o[0] + (front ? 5 : -3), G - 1 - o[1]]; S.add(U(capF(sh, el, 2.6, 2), capF(el, ft, 2, 1.4)), far ? LZDF : LZD, { z: far ? -3 : 5, h: 1.6 }); for (const e of [-0.4, 0, 0.4]) S.add(capF(ft, pol(ft, e, 3), 0.5, 0.3), far ? LZDF : LZD, { z: far ? -2.9 : 5.1, h: 0.3 }); };
  lgf([cx + 12, 36 + b], lg.ff, 1, 1), lgf([cx - 12, 36 + b], lg.bf, 1, 0);
  // 꼬리
  for (let k = 0; k < 6; k++) { const q = [cx - 20 - k * 4.4, 36 + b + k * 0.6], w = 4 - k * 0.5; S.add(ellR(q[0], q[1], w + 1, w), k % 2 ? LZD : LZDF, { z: 0.5 - k * 0.05, h: w * 0.8 }); if (k % 2 === 0) S.add(polyF([[q[0] - 1.4, q[1] - w + 1], [q[0], q[1] - w - 4 - br * 3], [q[0] + 1.4, q[1] - w + 1]]), AME, { lift: 0.8, h: 1, prof: "sharp" }); }
  // 몸 (납작) + 결정 가시
  S.add(ellR(cx, 33 + b, 20, 8), LZD, { z: 1, h: 7 });
  S.add(ellR(cx, 38 + b, 16, 3), mat(ramp(0x8a7a8a), { tex: "scale" }), { on: 1, h: 0.4 });
  for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const x = cx - 14 + k * 5.6 + r * 2.8, y = 27 + b + r * 3; S.add(polyF([[x - 2, y + 2], [x - 0.4 + br, y - 5 - br * 4 - (k % 2) * 2], [x + 2, y + 2]]), k % 2 ? AME : AMEF, { lift: 1, h: 1.6, prof: "sharp" }); }
  // 머리 (납작 · 눈 위 뿔 결정)
  const hx = cx + 22, hy = 33 + b;
  S.add(U(ellR(hx, hy, 7, 5), capF([hx + 2, hy + 1], [hx + 10, hy + 2], 3.4, 2)), LZD, { z: 3, h: 4 });
  for (const d of [-1, 1]) S.add(polyF([[hx - 3, hy - 3 + d], [hx - 8, hy - 8 + d * 2], [hx - 1, hy - 4 + d]]), AME, { z: 3.2 + d * 0.1, h: 1, prof: "sharp" });
  !p.hurt && S.decal(hx + 2, hy - 1.6, 0xc8a0ff).decal(hx + 2.4, hy - 1.6, 0x101010);
  lgf([cx + 14, 37 + b], lg.fn, 0, 1), lgf([cx - 10, 37 + b], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxDevil = {
  fw: Math.round(92 * DVK), fh: Math.round(48 * DVK), w: 26, h: 14,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { legs: gait4(f, n, 5, 2), bob: Math.cos(ph * 2) * 0.4 };
    if (nm === "wind") P = { bristle: t };
    if (nm === "atk") P = { bristle: [1, 0.2, 0][f] };
    if (nm === "rec") P = { bristle: 0 };
    if (nm === "hurt") P = { hurt: f === 0, bristle: 0.6 };
    return devilFrame(P);
  },
};

// ════ [정예] 심연 거인의 손 ════ 심연 바닥에서 솟아오른 거대한 잿빛 손 · 갈라진 손톱 · 손등의 보랏빛 혈관 · 손목은 어둠 속으로 이어진다 ·
//   내려치고 움켜쥐고 손가락을 튕긴다
//   p: ph · pose(0 펼침 · 1 주먹 · 2 움켜쥠) · lift · hurt
const HDK = 0.7;
const HSK = mat(ramp(0x7a7280), { tex: "skin", amp: 0.9, spec: 0.3 }), HSKF = mat(rampF(0x5e5868), { tex: "skin", amp: 0.8 });
function handFrame(p = {}) {
  const W = 140, H = 140, G = H - 1, S = sculpt(W, H, { k: HDK, ax: 70 });
  const ph = p.ph ?? 0, ps = p.pose ?? 0, lf = p.lift ?? 0, cx = 66, wy = G - 4, cy = 60 - lf * 20;
  // 손목 (어둠 속으로)
  S.add(U(capF([cx, wy + 4], [cx + 2, cy + 30], 16, 14)), HSKF, { z: 0, h: 12 });
  for (let k = 0; k < 6; k++) S.add(ellR(cx - 12 + k * 5, wy - 4 - (k % 2) * 6, 4, 3), VD, { z: 0.1, lift: 0.3, h: 0.6 });
  // 손바닥/손등
  S.add(U(ellR(cx + 2, cy + 18, 20, 18)), HSK, { z: 1, h: 14 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 6 + k * 5, cy + 30], [cx - 8 + k * 6 + Math.sin(k) * 2, cy + 8], 0.8), VGL, { on: 1, lift: 0.4, h: 0.3 });
  // 손가락 넷 + 엄지
  const fingers = [[-12, 26], [-4, 30], [4, 30], [12, 26]];
  fingers.forEach(([dx, l], k) => {
    const r0 = [cx + dx, cy + 4], a0 = -Math.PI / 2 + dx * 0.025;
    let a = a0, q = r0;
    for (let j = 0; j < 3; j++) {
      const curl = ps >= 1 ? (j + 1) * (ps === 1 ? 1.1 : 0.7) : Math.sin(ph + k + j) * 0.08;
      a = a0 + curl * (j === 0 ? 0.6 : 1);
      const n2 = pol(q, a, l / 3 - j), w = 5 - j * 0.8;
      S.add(capF(q, n2, w, w - 0.6), HSK, { z: 2 + k * 0.1, h: w * 0.9 });
      j > 0 && S.carve(capF(pol(q, a + 1.57, w), pol(q, a - 1.57, w), 0.4), 0.6);
      q = n2;
    }
    S.add(polyF([pol(q, a + 1.57, 2.4), pol(q, a, 4), pol(q, a - 1.57, 2.4)]), mat(ramp(0x3a3040), { spec: 0.5 }), { z: 2.5 + k * 0.1, h: 1, prof: "sharp" });
  });
  const t0 = [cx + 20, cy + 22], ta = -0.6 + (ps >= 1 ? -1.4 : 0);
  S.add(U(capF(t0, pol(t0, ta, 12), 6, 5), capF(pol(t0, ta, 12), pol(pol(t0, ta, 12), ta - 0.4, 10), 5, 4)), HSK, { z: 3, h: 4 });
  const C = S.render({ rim: !0 });
  motes(C, toPx(W, H, HDK, 70), cx, wy - 10, 30, 12, ph);
  return fin(C, p);
}
export const pxGiantHand = {
  fw: Math.round(140 * HDK), fh: Math.round(140 * HDK), w: 40, h: 60,
  anims: { idle: [6, 4], move: [6, 5], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], grab: [4, 10, !1], flick: [3, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, pose: 0 };
    if (nm === "wind") P = { ph, pose: 1, lift: t };
    if (nm === "atk") P = { ph, pose: 1, lift: [0.4, -0.6, -0.6][f] };
    if (nm === "rec") P = { ph, pose: 0, lift: -0.6 * (1 - t) };
    if (nm === "grab") P = { ph, pose: [0, 2, 2, 1][f], lift: [0.4, 0, 0, 0.2][f] };
    if (nm === "flick") P = { ph, pose: [1, 0, 0][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph, pose: 0, lift: -0.3 };
    return handFrame(P);
  },
};

// ════ 공허 성게 ════ 보랏빛 몸에 검은 가시가 빽빽 · 가시 끝마다 별빛 · 가시를 사방으로 쏜다 · 천천히 굴러다닌다
//   p: ph · puff · hurt
const URK = 0.72;
function urchinFrame(p = {}) {
  const W = 60, H = 56, G = H - 1, S = sculpt(W, H, { k: URK, ax: 30 });
  const ph = p.ph ?? 0, pf = p.puff ?? 0, cx = 30, cy = G - 15;
  const spikes = (front) => { for (let k = 0; k < 22; k++) { const a = (k / 22) * T2 + ph * 0.3, s = Math.sin(a * 1.7 + k); if (front ? s < 0 : s >= 0) continue; const r0 = pol([cx, cy], a, 10), tip = pol([cx, cy], a, 18 + pf * 6 + (k % 3) * 2); S.add(capF(r0, tip, 1.2, 0.3), VD, { z: front ? 3 : -1, h: 0.8 }); front && S.add(ellR(tip[0], tip[1], 0.7, 0.7), VGLW, { z: 3.1, h: 0.3 }); } };
  spikes(0);
  S.add(ellR(cx, cy, 12, 11), VOID, { z: 1, h: 9 });
  for (let k = 0; k < 10; k++) S.add(ellR(...pol([cx, cy], k * 0.63, 7), 1.2, 1.2), mat(ramp(0x6a4a8a)), { on: 1, lift: 0.3, h: 0.4 });
  spikes(1);
  return fin(S.render({ rim: !0 }), p);
}
export const pxUrchin = {
  fw: Math.round(60 * URK), fh: Math.round(56 * URK), w: 18, h: 18,
  anims: { idle: [6, 4], move: [6, 6], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 2 };
    if (nm === "wind") P = { ph, puff: t };
    if (nm === "atk") P = { ph, puff: [1, 0.4, 0][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph, puff: 0.6 };
    return urchinFrame(P);
  },
};

// ════ 공허 교단 사제 ════ 별무늬 수놓은 검보라 사제복 · 깊은 두건 속 은 가면 · 해골 달린 지팡이 · 손 사이에 공허 구슬 · 발밑 보랏빛 마법진
//   p: legs · bob · cast · hurt
const ACK = 0.72;
const ROB = mat(ramp(0x3a2a4a), { tex: "cloth", amp: 1 }), ROBF = mat(rampF(0x2a1e38), { tex: "cloth", amp: 0.9 });
function acolyteFrame(p = {}) {
  const W = 92, H = 96, G = H - 1, S = sculpt(W, H, { k: ACK, ax: 38 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, cs = p.cast ?? 0, cx = 36;
  // 사제복 (땅까지 끌린다) + 별 무늬
  S.add(polyF([[cx - 9, 40 + b], [cx + 10, 40 + b], [cx + 16 + g.n[0] * 0.4, G - 1], [cx + 6, G - 3], [cx - 2, G - 1], [cx - 10, G - 3], [cx - 16 + g.f[0] * 0.4, G - 1]]), ROB, { z: 1, h: 9 });
  for (const dx of [-8, -1, 6]) S.carve(capF([cx + dx * 0.5, 50 + b], [cx + dx, G - 4], 0.6), 0.8);
  for (const [x, y] of [[cx - 6, 62], [cx + 4, 70], [cx - 2, 80], [cx + 8, 86], [cx - 10, 84]]) S.add(ellR(x, y + (y < 80 ? b : 0), 1, 1), VGLW, { on: 1, lift: 0.3, h: 0.2 });
  S.add(capF([cx - 9, 56 + b], [cx + 10, 56 + b], 1.4), mat(ramp(0xa8a0b0), { tex: "metal", spec: 0.6 }), { z: 1.5, h: 1 });
  // 지팡이 (먼 손)
  const st0 = [cx - 10, G - 2], st1 = [cx - 6, 24 + b];
  S.add(capF(st0, st1, 1, 0.9), mat(ramp(0x3a3040), { tex: "wood" }), { z: -1, h: 1 });
  S.add(ellR(st1[0], st1[1] - 3, 4, 4), BONE, { z: -0.9, h: 3 });
  S.add(ellR(st1[0] + 1.4, st1[1] - 3.4, 1.2, 1.2), VD, { z: -0.8, lift: 0.1, h: 0.2 }).add(ellR(st1[0] + 3, st1[1] - 3, 1, 1), VD, { z: -0.8, lift: 0.1, h: 0.2 });
  S.add(capF([cx - 8, 40 + b], [cx - 7, 52 + b], 2.6, 2.2), ROBF, { z: 0.5, h: 2 });
  // 몸 + 두건 + 은 가면
  S.add(U(ellR(cx, 44 + b, 10, 9)), ROB, { z: 2, h: 7 });
  const hx = cx + 3, hy = 28 + b;
  S.add(U(ellR(hx - 1, hy, 9, 10), polyF([[hx - 10, hy], [hx - 8, hy + 14], [hx + 6, hy + 12]])), ROBF, { z: 3, h: 7 });
  S.add(ellR(hx + 3, hy + 1, 4.6, 6), VD, { z: 3.3, h: 2 });
  S.add(ellR(hx + 4, hy + 1.4, 3.4, 4.6), mat(ramp(0xc8c8d8), { tex: "metal", spec: 0.9 }), { z: 3.5, h: 2.4 });
  !p.hurt && S.decal(hx + 5, hy, 0xc8a0ff).decal(hx + 3, hy, 0xc8a0ff);
  // 가까운 팔 (공허 구슬)
  const sh = [cx + 6, 40 + b], hd = [cx + 14 + cs * 6, 46 + b - cs * 6];
  S.add(U(capF(sh, lerp(sh, hd, 0.5), 3, 2.6), capF(lerp(sh, hd, 0.5), hd, 2.6, 3.2)), ROB, { z: 6, h: 2.4 });
  S.add(ellR(hd[0], hd[1], 2, 1.8), mat(ramp(0x9a8aa8), { tex: "skin" }), { z: 6.2, h: 1.4 });
  const orb = [hd[0] + 4 + cs * 2, hd[1] - 4];
  S.add(ellR(orb[0], orb[1], 3.4 + cs * 2.4, 3.4 + cs * 2.4), VD, { z: 6.4, h: 2 });
  S.add(minus(ellR(orb[0], orb[1], 4.4 + cs * 2.6, 4.4 + cs * 2.6), ellR(orb[0], orb[1], 3.4 + cs * 2.4, 3.4 + cs * 2.4)), VGL, { z: 6.3, h: 1 });
  const C = S.render({ rim: !0 });
  // 발밑 마법진
  if (cs > 0.3) { const P = toPx(W, H, ACK, 38); for (let k = 0; k < 24; k++) { const a = (k / 24) * T2 + cs, q = P(cx + Math.cos(a) * 20, G - 1 + Math.sin(a) * 3); C.px(q[0], q[1], k % 3 ? 0x9a6ad8 : 0xe0c8ff); } }
  return fin(C, p);
}
export const pxAcolyte = {
  fw: Math.round(92 * ACK), fh: Math.round(96 * ACK), w: 16, h: 32,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], summon: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 3, 0.5); P = { legs: g, bob: g.bob * 0.4 }; }
    if (nm === "wind") P = { cast: t };
    if (nm === "atk") P = { cast: [1, 0.6, 0.3][f] };
    if (nm === "rec") P = { cast: 0.3 * (1 - t) };
    if (nm === "summon") P = { cast: [0.6, 1, 1, 0.6][f], bob: -1 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return acolyteFrame(P);
  },
};

// ════ 그림자 거미불가사리 ════ 작은 원반 몸에서 뻗은 길고 가는 팔 다섯 · 마디진 팔이 뱀처럼 꿈틀대며 기어간다 · 팔로 감아 조인다
//   p: ph · reach · hurt
const BSK = 0.72;
const BST = mat(ramp(0x4a3a5a), { tex: "scale", amp: 0.8, spec: 0.4 }), BSTF = mat(rampF(0x382c46), { tex: "scale", amp: 0.7 });
function brittleFrame(p = {}) {
  const W = 104, H = 54, G = H - 1, S = sculpt(W, H, { k: BSK, ax: 52 });
  const ph = p.ph ?? 0, rc = p.reach ?? 0, cx = 50, cy = G - 10;
  const armS = (k) => {
    const a0 = -Math.PI * 0.95 + (k / 4) * Math.PI * 0.9, far = Math.sin(a0) < -0.6;
    let q = [cx, cy - 2], a = a0;
    for (let j = 0; j < 10; j++) {
      a += Math.sin(ph * 1.5 + j * 0.7 + k * 1.3) * 0.22 + (k === 4 ? -rc * 0.05 : 0);
      const tgt = k === 4 ? a - rc * 0.12 * j : a;
      const n2 = [q[0] + Math.cos(tgt) * 3.6, Math.min(G - 1.5, q[1] + Math.sin(tgt) * 2.4 + (j > 2 ? 1.2 : 0))], w = 2.2 - j * 0.16;
      S.add(capF(q, n2, w, w - 0.1), j % 2 ? BST : BSTF, { z: far ? -1 : 2 + k * 0.05, h: w * 0.7 });
      q = n2;
    }
  };
  for (let k = 0; k < 5; k++) armS(k);
  S.add(ellR(cx, cy - 3, 7, 4.4), BST, { z: 1.5, h: 4 });
  for (let k = 0; k < 5; k++) S.add(ellR(...pol([cx, cy - 4], k * 1.26, 3.4), 1, 0.8), VGL, { on: 1, lift: 0.3, h: 0.3 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxBrittle = {
  fw: Math.round(104 * BSK), fh: Math.round(54 * BSK), w: 30, h: 10,
  anims: { idle: [6, 6], move: [6, 10], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph: ph * 2 };
    if (nm === "wind") P = { ph, reach: -0.5 * t };
    if (nm === "atk") P = { ph, reach: [0.6, 1, 0.8][f] };
    if (nm === "rec") P = { ph, reach: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph: ph * 3 };
    return brittleFrame(P);
  },
};

// ════ [정예] 심연의 사신 ════ 키 큰 해골 · 너덜너덜 바닥까지 끌리는 검은 망토 · 두건 속 별빛 눈 · 뼈 손가락 · 녹슨 거대 낫 ·
//   발 대신 어둠이 흩날린다
//   p: ph · sw · blink · hurt
const RPK = 0.72;
function reaperFrame(p = {}) {
  const W = 176, H = 132, S = sculpt(W, H, { k: RPK, ax: 66 });
  const ph = p.ph ?? 0, sw = p.sw ?? 0, cx = 62, Y = 40 + Math.sin(ph) * 2;
  // 망토 자락 (아래로 흩어짐)
  const hem = [];
  for (let k = 0; k <= 8; k++) hem.push([cx - 22 + k * 5.4 + Math.sin(ph + k) * 2, Y + 76 + Math.sin(ph * 2 + k * 1.3) * 4 + (k % 2) * 6]);
  S.add(polyF([[cx - 12, Y + 6], [cx + 14, Y + 6], ...hem.slice().reverse()]), mat(ramp(0x1e1824), { tex: "cloth", amp: 1.1 }), { z: 0, h: 8 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 10 + k * 4, Y + 14], [cx - 14 + k * 5 + Math.sin(ph + k) * 2, Y + 74], 0.6), 0.9);
  // 먼 팔 (낫 자루 아래쪽을 쥠)
  const sh = [cx + 10, Y + 8], hd = sw <= 1 ? lerp([cx + 18, Y + 36], pol(sh, -1.9, 26), sw) : lerp(pol(sh, -1.9, 26), [cx + 40, Y + 40], Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(-1.3, -2.6, sw) : L(-2.6, 0.3, Math.min(1, sw - 1));
  const shF = [cx - 8, Y + 8], hF = pol(hd, ba, -14);
  S.add(U(capF(shF, lerp(shF, hF, 0.5), 1.8), capF(lerp(shF, hF, 0.5), hF, 1.6)), BONEF, { z: -2, h: 1.4 });
  S.add(capF(shF, lerp(shF, hF, 0.6), 4, 3.4), mat(rampF(0x18141e), { tex: "cloth" }), { z: -1.9, h: 3 });
  // 몸 (갈비 비치는 망토 상반신) + 두건 해골
  S.add(U(ellR(cx + 1, Y + 14, 13, 14)), mat(ramp(0x24202c), { tex: "cloth", amp: 1 }), { z: 1, h: 10 });
  S.add(ellR(cx + 5, Y + 14, 6, 9), VD, { on: 1, lift: 0.2, h: 0.4 });
  for (let k = 0; k < 4; k++) S.add(capF([cx + 1, Y + 9 + k * 3.4], [cx + 9, Y + 10 + k * 3.4], 0.7), BONE, { on: 1, lift: 0.4, h: 0.4 });
  const hx = cx + 5, hy = Y - 6;
  S.add(U(ellR(hx - 2, hy, 11, 12), polyF([[hx - 12, hy], [hx - 14, hy + 18], [hx - 2, hy + 10]])), mat(ramp(0x1e1824), { tex: "cloth", amp: 1 }), { z: 3, h: 8 });
  S.add(ellR(hx + 3, hy + 1, 6, 7.4), VD, { z: 3.3, h: 2 });
  S.add(U(ellR(hx + 4, hy, 4.6, 5.4), ellR(hx + 5, hy + 5, 3, 2.4)), BONE, { z: 3.5, h: 3 });
  S.add(ellR(hx + 5.6, hy - 0.6, 1.4, 1.6), VD, { z: 3.7, lift: 0.1, h: 0.2 }).add(ellR(hx + 2.4, hy - 0.6, 1.2, 1.4), VD, { z: 3.7, lift: 0.1, h: 0.2 });
  for (let k = 0; k < 3; k++) S.carve(capF([hx + 3 + k * 1.2, hy + 5], [hx + 3.2 + k * 1.2, hy + 7], 0.25), 0.6);
  !p.hurt && S.decal(hx + 5.6, hy - 0.6, 0xf0e0ff).decal(hx + 2.4, hy - 0.6, 0xc8a0ff);
  // 가까운 팔 (뼈) + 거대한 낫
  const el = ik(sh, hd, 13, 13, 1);
  S.add(capF(sh, lerp(sh, el, 0.8), 5, 4.4), mat(ramp(0x24202c), { tex: "cloth" }), { z: 7, h: 3 });
  S.add(U(capF(el, hd, 1.6, 1.4)), BONE, { z: 7.2, h: 1.2 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(hd, pol(hd, ba + 1.57 + d, 3.4), 0.6, 0.3), BONE, { z: 7.4, h: 0.4 });
  const top = pol(hd, ba, 40), bot = pol(hd, ba, -30);
  S.add(capF(bot, top, 1.4, 1.2), mat(ramp(0x3a3040), { tex: "wood" }), { z: 7.6, h: 1.2 });
  const bl = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8; bl.push(pol(pol(top, ba, -2 - Math.sin(t * Math.PI) * 6), ba + Math.PI / 2, t * 44)); }
  const bl2 = bl.map((q, k) => pol(q, ba, -(1 + Math.sin((k / 8) * Math.PI) * 5)));
  S.add(polyF([...bl, ...bl2.reverse()]), mat(ramp(0x6a6068), { tex: "metal", amp: 1.1, spec: 0.5 }), { z: 7.8, h: 1.4, prof: "sharp" });
  S.add(U(...bl.slice(0, -1).map((q, k) => capF(q, bl[k + 1], 0.5))), mat(ramp(0xd8d0e0), { spec: 0.8 }), { z: 7.9, h: 0.3 });
  const C = S.render({ rim: !0 });
  motes(C, toPx(W, H, RPK, 66), cx, Y + 70, 30, 16, ph);
  return fin(C, p);
}
export const pxReaper = {
  fw: Math.round(176 * RPK), fh: Math.round(132 * RPK), w: 30, h: 60, flying: !0,
  anims: { idle: [6, 5], move: [6, 7], wind: [4, 7, !1], atk: [3, 14, !1], rec: [3, 7, !1], hurt: [2, 10, !1], blink: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, sw: t };
    if (nm === "atk") P = { ph, sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { ph, sw: 2 * (1 - t) };
    if (nm === "blink") P = { ph: ph * 3, sw: 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return reaperFrame(P);
  },
};
