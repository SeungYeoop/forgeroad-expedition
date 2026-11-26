// 애쉬펠 몬스터 12종 (조각 도구, 오른쪽을 본다) — 잿빛 노을 아래 사슬에 묶인 폐허 섬
//   아래 섬 줄: 잿불 꼬마 · 사슬 사냥개 · 걸어다니는 화로 · [정예] 잿빛 간수
//   가운데 줄: 잿까마귀 · 불씨 정령 · 그을린 망령 · [정예] 잿빛 드레이크
//   위 줄: 향로 정령 · 불박쥐 · 족쇄 망령 · [정예] 잿빛 불새
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, glass, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const ASH = mat(ramp(0x5e5650), { tex: "stone", amp: 0.9 }), ASHF = mat(rampF(0x4c4640), { tex: "stone", amp: 0.8 }), ASHL = mat(ramp(0x8a8078), { tex: "skin", amp: 0.8 });
const CHAR = mat(ramp(0x3a3230), { tex: "skin", amp: 0.9 }), CHARF = mat(rampF(0x2e2826), { tex: "skin", amp: 0.8 });
const EMB = mat(rampGlow(0xff8a3a)), EMBY = mat(rampGlow(0xffd070)), EMBR = mat(rampGlow(0xe8502a));
const IRON = mat(ramp(0x5a5654), { tex: "metal", amp: 1, spec: 0.35 }), IRONF = mat(rampF(0x4a4644), { tex: "metal", amp: 0.9 }), RUST = mat(ramp(0x8a4a2a), { tex: "metal", amp: 1.2 });
const CLOTH = mat(ramp(0x4a3c38), { tex: "cloth", amp: 0.9 }), CLOTHF = mat(rampF(0x3c302e), { tex: "cloth", amp: 0.8 }), LEATH = mat(ramp(0x5a4030), { tex: "leather", amp: 0.9 });
const FUR = mat(ramp(0x6a625a), { tex: "fur", amp: 1, dir: 1.2 }), FURF = mat(rampF(0x564e48), { tex: "fur", amp: 0.9, dir: 1.2 });
const CROW = mat(ramp(0x3a363c), { tex: "feather", amp: 1, dir: 0.3, spec: 0.3 }), CROWF = mat(rampF(0x2e2a30), { tex: "feather", amp: 0.9, dir: 0.3 });
const SCL = mat(ramp(0x6a5a52), { tex: "scale", amp: 1 }), SCLF = mat(rampF(0x564840), { tex: "scale", amp: 0.9 }), BELLY = mat(ramp(0xa08a6a), { tex: "scale", amp: 0.6 });
const BONE = mat(ramp(0xd8ccb0), { spec: 0.3 }), WING = mat(ramp(0x5a4844), { tex: "skin", amp: 0.7 }), WINGF = mat(rampF(0x4a3a38), { tex: "skin", amp: 0.6 });
const BRASS = mat(ramp(0x9a7a44), { tex: "metal", amp: 0.9, spec: 0.4 }), GHOST = mat(ramp(0x9aa0a8, { hi: 0.5 }), { tex: "skin", amp: 0.5 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
// 불꽃 (밑 b, 높이 h, 폭 w): 바깥 붉은 불 → 속 주황 → 심지 노랑. ph 일렁임
function flame(S, b, h, w, ph = 0, o = {}) {
  // 물방울꼴 불꽃: 아래는 둥글고 위로 가늘게 일렁이며 끝이 휜다 (겉 붉음 → 속 주황 → 심지 노랑)
  const shape = (sc, hh) => {
    const L0 = [], R0 = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10, hw = w * sc * Math.sin(Math.min(1, (1 - t) * 1.5) * Math.PI / 2) * (t < 0.2 ? 0.7 + t * 1.5 : 1), wob = Math.sin(ph + t * 5) * w * 0.35 * t, y = b[1] - hh * t;
      L0.push([b[0] + wob - hw, y]), R0.push([b[0] + wob + hw, y]);
    }
    return polyF([...L0, ...R0.reverse()]);
  };
  S.add(U(shape(1, h), ellR(b[0], b[1] - w * 0.3, w, w * 0.7)), EMBR, { z: o.z, lift: o.lift ?? 1, h: w * 0.6 });
  S.add(shape(0.62, h * 0.72), EMB, { lift: 1, h: w * 0.4 });
  S.add(ellR(b[0], b[1] - h * 0.16, w * 0.34, h * 0.18), EMBY, { lift: 1, h: 0.5 });
}
// 사슬 (점 a → b, 고리 지름 d): 고리가 번갈아 옆면·앞면
function chain(S, a, b, d = 3, M = IRON, o = {}) {
  const Ln = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(Ln / (d * 0.9))), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  for (let k = 0; k <= n; k++) {
    const q = lerp(a, b, k / n), sag = o.sag ? Math.sin((k / n) * Math.PI) * o.sag : 0, c = [q[0], q[1] + sag];
    k % 2 ? S.add(ellR(c[0], c[1], d * 0.6, d * 0.24, ang), M, { z: o.z, lift: o.lift ?? 1, h: 0.7 }) : S.add(minus(ellR(c[0], c[1], d * 0.62, d * 0.42, ang), ellR(c[0], c[1], d * 0.3, d * 0.14, ang)), M, { z: o.z, lift: o.lift ?? 1, h: 0.8 });
  }
}
// 잿불 균열 (몸 위에 빛나는 금)
const cracks = (S, pts, M = EMB) => { for (let k = 0; k + 1 < pts.length; k++) S.add(capF(pts[k], pts[k + 1], 0.55), M, { on: 1, lift: 0.3, h: 0.3 }); };

// ════ 잿불 꼬마 ════ 숯처럼 그을린 작은 몸 · 몸 곳곳 잿불 균열 · 머리 위 작은 불꽃 · 긴 손가락에 불씨를 쥐고 던진다
//   p: bob · legs · arm(0~1.2 던지기) · crouch · ph(불 일렁임) · hurt
const AIK = 0.72;
function ashlingFrame(p = {}) {
  const W = 56, H = 64, G = H - 1, S = sculpt(W, H, { k: AIK, ax: 28 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, g = p.legs ?? { n: [0, 0], f: [0, 0] }, ar = p.arm ?? 0, cx = 27;
  // 꼬리 (가는 꼬리 끝에 불씨)
  S.add(U(capF([cx - 6, 46 + b], [cx - 14, 50 + b], 1.4, 1), capF([cx - 14, 50 + b], [cx - 18, 44 + b], 1, 0.7)), CHARF, { z: -3, h: 1.2 });
  S.add(ellR(cx - 18, 43 + b, 1.6, 1.6), EMB, { z: -2, h: 1 });
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) {
    const hp = [cx - 1 + (far ? -3 : 2), 48 + b], ft = [hp[0] + o[0] + 1, G - 2 - o[1]], kn = ik(hp, ft, 7.5, 7.5, -1), M0 = far ? CHARF : CHAR;
    S.add(U(capF(hp, kn, 2.4, 1.8), capF(kn, ft, 1.8, 1.5)), M0, { z: far ? -2 : 4, h: 2 });
    S.add(ellR(ft[0] + 1.6, ft[1] + 0.4, 3.4, 1.6), M0, { z: far ? -1 : 5, h: 1.4 });
  }
  // 먼 팔
  S.add(U(capF([cx - 4, 34 + b], [cx - 8, 42 + b], 1.8, 1.4), capF([cx - 8, 42 + b], [cx - 7, 49 + b], 1.4, 1.1)), CHARF, { z: -1, h: 1.6 });
  // 몸 (배가 볼록, 등이 굽음) + 균열
  S.add(U(ellR(cx, 40 + b, 9, 9.4), ellR(cx + 2, 31 + b, 7, 6)), CHAR, { z: 1, h: 7.5 });
  cracks(S, [[cx - 4, 34 + b], [cx - 1, 39 + b], [cx - 3, 44 + b]]), cracks(S, [[cx + 3, 41 + b], [cx + 6, 45 + b]]), cracks(S, [[cx + 1, 31 + b], [cx + 4, 35 + b]]);
  // 머리 (뾰족 귀 · 큰 입 · 빛나는 눈) + 머리 불꽃
  const hx = cx + 6, hy = 22 + b;
  S.add(polyF([[hx - 5, hy - 2], [hx - 12, hy - 8], [hx - 4, hy - 5]]), CHARF, { z: 2, h: 1.6 });
  S.add(ellR(hx, hy, 7, 6.4), CHAR, { z: 4, h: 6 });
  S.add(polyF([[hx + 2, hy - 4], [hx + 7, hy - 11], [hx + 5, hy - 3]]), CHAR, { z: 5, h: 1.6 });
  S.carve(capF([hx + 1, hy + 3.5], [hx + 7, hy + 2.5], 0.7), 1.2, !1);
  S.add(capF([hx + 1.5, hy + 3.6], [hx + 6.5, hy + 2.8], 0.4), EMB, { on: 1, lift: 0.2, h: 0.2 });
  cracks(S, [[hx - 3, hy - 3], [hx - 1, hy + 1]]);
  flame(S, [hx - 1, hy - 5], 8, 3.2, p.ph ?? 0, { lift: 1.5 });
  if (!p.hurt) S.decal(hx + 3, hy - 0.6, 0xffd060).decal(hx + 6, hy - 0.8, 0xffd060).decal(hx + 3, hy - 1.4, 0xffffff);
  // 가까운 팔 (던지기: 뒤로 젖혔다 앞으로) + 손의 불씨
  const sh = [cx + 4, 33 + b], hand = ar > 0.5 ? pol(sh, -2.5 + (ar - 0.5) * 3.4, 11) : pol(sh, 1.1 - ar * 2, 10);
  S.add(capF(sh, hand, 2, 1.4), CHAR, { z: 8, h: 1.8 });
  for (const d of [-0.5, 0, 0.5]) S.add(capF(hand, pol(hand, (ar > 0.5 ? -1.2 : 1.1) + d, 3), 0.6, 0.4), CHAR, { z: 8.5, h: 0.5 });
  ar > 0.2 && ar < 1.15 && S.add(ellR(...pol(hand, -1.6, 2.5), 2.2, 2.2), EMBY, { z: 9, h: 1.5 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxAshling = {
  fw: Math.round(56 * AIK), fh: Math.round(64 * AIK), w: 14, h: 24,
  anims: { idle: [4, 7], move: [6, 11], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "idle") P = { ph, bob: Math.sin(ph) * 0.6 };
    if (nm === "move") { const g = gait2(f, n, 3, 2); P = { ph, legs: g, bob: g.bob }; }
    if (nm === "wind") P = { ph, arm: 1.1 * t, crouch: 0.5 * t };
    if (nm === "atk") P = { ph, arm: [0.5, 0.15, 0][f], crouch: -0.2 };
    if (nm === "rec") P = { ph, arm: 0, crouch: 0.3 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, crouch: 0.5 };
    return ashlingFrame(P);
  },
};

// ════ 사슬 사냥개 ════ 갈비뼈가 드러난 잿빛 사냥개 · 뾰족한 등털 · 끊어진 사슬이 달린 쇠 목줄 · 잿불 눈과 입
//   p: legs · bob · head · jaw · crouch · leap · hurt
const HDK = 0.72;
function houndFrame(p = {}) {
  const W = 84, H = 56, G = H - 1, S = sculpt(W, H, { k: HDK, ax: 40 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 4, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, lp = p.leap ?? 0, cx = 40;
  // 끌리는 사슬 (목줄에서 뒤로 바닥까지)
  chain(S, [cx + 14, 26 + b], [cx - 22, G - 2], 3.4, IRONF, { z: -6, sag: 4 });
  const leg = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 3 : -2), G - 1.5 - o[1] - lp * 6], kn = ik(sh, ft, 10, 10, front ? -1 : 1), M0 = far ? FURF : FUR;
    S.add(U(capF(sh, kn, far ? 3 : 3.6, 2.4), capF(kn, ft, 2.4, 1.8)), M0, { z: far ? -3 : 5, h: 2.6 });
    S.add(ellR(ft[0] + 1.8, ft[1] + 0.2, 3.2, 1.6), M0, { z: far ? -2 : 5.5, h: 1.4 });
  };
  leg([cx + 14, 32 + b], lg.ff, !0, !0), leg([cx - 12, 32 + b], lg.bf, !0, !1);
  // 꼬리 (가늘고 아래로)
  S.add(U(capF([cx - 18, 26 + b], [cx - 27, 30 + b], 2.2, 1.6), capF([cx - 27, 30 + b], [cx - 32, 38 + b], 1.6, 0.8)), FUR, { z: 0, h: 1.8 });
  // 몸 (깊은 가슴 · 잘록한 허리) + 갈비뼈 홈 + 등털
  S.add(U(ellR(cx + 9, 28 + b, 12, 10), ellR(cx - 9, 27 + b, 11, 7.4), capF([cx - 4, 26 + b], [cx + 4, 28 + b], 7)), FUR, { z: 1, h: 8 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx + 3 + k * 3.4, 25 + b], [cx + 1.5 + k * 3.4, 35 + b], 0.55), 0.9);
  for (let k = 0; k < 8; k++) { const x = cx - 14 + k * 4, y = 20 + b - Math.sin((k / 7) * Math.PI) * 3; S.add(polyF([[x - 1.8, y + 2], [x + 1.4, y - 4 - (k % 2) * 1.6], [x + 2, y + 2]]), FURF, { lift: 1, h: 1.4, prof: "sharp" }); }
  cracks(S, [[cx - 6, 26 + b], [cx - 2, 30 + b], [cx - 5, 33 + b]]);
  // 목 + 쇠 목줄 (가시 징)
  const hx = cx + 24, hy = 22 + b - lp * 3, ha = (p.head ?? 0) * 0.4;
  S.add(capF([cx + 14, 26 + b], [hx - 3, hy + 2], 6, 5), FUR, { z: 3, h: 5 });
  S.add(capF([cx + 13, 23 + b], [cx + 15, 31 + b], 2.6), IRON, { z: 6, h: 2.4 });
  for (const d of [-2.6, 0, 2.6]) S.add(polyF([[cx + 15, 27 + b + d - 0.9], [cx + 19, 27 + b + d], [cx + 15, 27 + b + d + 0.9]]), IRON, { z: 7, h: 0.8, prof: "sharp" });
  // 머리 (긴 주둥이 · 뒤로 젖힌 귀 · 벌어지는 턱)
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  const jw = p.jaw ?? 0;
  S.add(polyF([R(hx - 4, hy - 4), R(hx - 10, hy - 11), R(hx - 1, hy - 5)]), FUR, { z: 5, h: 1.6 });
  S.add(ellR(...R(hx, hy), 6.4, 5.6), FUR, { z: 6, h: 5.4 });
  S.add(U(capF(R(hx + 3, hy - 0.6), R(hx + 13, hy + 1.6), 3.6, 2.6)), FUR, { z: 7, h: 3 });
  S.add(capF(R(hx + 3, hy + 3.6 + jw * 1.2), R(hx + 12, hy + 4.6 + jw * 4), 2.2, 1.5), FURF, { z: 6.5, h: 1.8 });
  jw > 0.2 && S.add(polyF([R(hx + 4, hy + 2.6), R(hx + 13, hy + 2.2), R(hx + 12, hy + 4 + jw * 3.6), R(hx + 4, hy + 4)]), EMBR, { z: 6.8, h: 0.6 });
  for (const x of [hx + 6, hx + 9, hx + 11.5]) S.add(polyF([R(x - 0.6, hy + 2.8), R(x + 0.6, hy + 2.8), R(x, hy + 4.4)]), BONE, { z: 7.5, h: 0.5 });
  S.add(ellR(...R(hx + 13, hy + 1), 1.2, 1), CHAR, { lift: 1, h: 0.6 });
  !p.hurt && S.decal(...R(hx + 3, hy - 1.4), 0xff8a3a).decal(...R(hx + 3.6, hy - 2), 0xffe0a0);
  leg([cx + 16, 34 + b], lg.fn, !1, !0), leg([cx - 10, 33 + b], lg.bn, !1, !1);
  return fin(S.render({ rim: !0 }), p);
}
export const pxChainHound = {
  fw: Math.round(84 * HDK), fh: Math.round(56 * HDK), w: 28, h: 18,
  anims: { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], howl: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, jaw: 0.2 + Math.sin(ph) * 0.15 };
    if (nm === "move") P = { legs: gait4(f, n, 6, 3), bob: Math.cos(ph * 2) * 0.8, jaw: 0.3 };
    if (nm === "wind") P = { crouch: t, head: 0.3 * t, jaw: 0.5 * t };
    if (nm === "atk") P = { leap: [0.6, 1, 0.5][f], jaw: [1.2, 0.2, 0][f], head: -0.3, legs: { fn: [6, 3], ff: [6, 3], bn: [-6, 0], bf: [-6, 0] } };
    if (nm === "rec") P = { crouch: 0.4 * (1 - t), jaw: 0.3 };
    if (nm === "howl") P = { head: -1.3 * Math.min(1, t * 2), jaw: 1 };
    if (nm === "hurt") P = { hurt: f === 0, head: 0.4, jaw: 1, crouch: 0.4 };
    return houndFrame(P);
  },
};

// ════ 걸어다니는 화로 ════ 녹슨 쇠 화로 그릇(새김 띠 · 손잡이 고리) · 세 개의 휜 쇠다리 · 속에서 타오르는 불과 숯 · 그릇 앞 두 눈구멍
//   p: step · ph · roar(불 크게) · tilt · hurt
const BZK = 0.72;
function brazierFrame(p = {}) {
  const W = 56, H = 70, G = H - 1, S = sculpt(W, H, { k: BZK, ax: 28 });
  const st = p.step ?? 0, rr = p.roar ?? 0, tl = p.tilt ?? 0, cx = 28, by = 40;
  // 다리 셋 (가운데는 뒤)
  for (const [dx, far, s] of [[0, 1, 0], [-9, 0, -st], [9, 0, st]]) {
    const top = [cx + dx * 0.6 + tl * 2, by + 6], kn = [cx + dx * 1.3 + s * 0.5, by + 16], ft = [cx + dx * 1.2 + s, G - 1.5 - Math.max(0, s) * 0.6];
    S.add(U(capF(top, kn, 1.8, 1.6), capF(kn, ft, 1.6, 1.4)), far ? IRONF : IRON, { z: far ? -3 : 3, h: 1.6 });
    S.add(ellR(ft[0] + 1, ft[1] + 0.2, 3, 1.4), far ? IRONF : IRON, { z: far ? -2 : 3.5, h: 1.2 });
  }
  // 그릇 (위가 넓은 사발) + 새김 띠 + 녹 얼룩 + 손잡이 고리 + 눈구멍(빛)
  const bowl = polyF([[cx - 16 + tl * 2, by - 6], [cx + 16 + tl * 2, by - 6], [cx + 11, by + 8], [cx - 11, by + 8]]);
  S.add(bowl, IRON, { z: 4, h: 7 });
  S.add(polyF([[cx - 17.5 + tl * 2, by - 9], [cx + 17.5 + tl * 2, by - 9], [cx + 17 + tl * 2, by - 5.5], [cx - 17 + tl * 2, by - 5.5]]), IRON, { z: 5, h: 3, prof: "flat" });
  S.carve(capF([cx - 14, by - 1], [cx + 14, by - 1], 0.5), 0.6).carve(capF([cx - 12.5, by + 3], [cx + 12.5, by + 3], 0.5), 0.6);
  for (let k = 0; k < 5; k++) S.add(polyF([[cx - 10 + k * 5, by - 0.5], [cx - 8 + k * 5, by + 2.5], [cx - 6 + k * 5, by - 0.5]]), RUST, { on: 1, h: 0.4 });
  for (const d of [-1, 1]) S.add(minus(ellR(cx + d * 18 + tl * 2, by - 3, 3.2, 3.2), ellR(cx + d * 18 + tl * 2, by - 3, 1.8, 1.8)), IRONF, { z: 3, h: 1.2 });
  for (const x of [cx + 2, cx + 9]) { S.carve(ellR(x, by + 1, 1.5, 1.8), 2.4, !1); !p.hurt && S.decal(x, by + 1, 0xffa040); }
  // 숯 + 불
  for (const dx of [-10, -5, 0, 5, 10]) S.add(ellR(cx + dx + tl * 2, by - 9, 3.4, 2.4), CHAR, { z: 6, h: 2 });
  for (const [dx, h0] of [[-8, 12], [0, 18], [8, 13]]) flame(S, [cx + dx + tl * 3, by - 9], h0 * (1 + rr * 0.6), 4.6 + rr, (p.ph ?? 0) + dx, { z: 7 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxBrazier = {
  fw: Math.round(56 * BZK), fh: Math.round(70 * BZK), w: 18, h: 26,
  anims: { idle: [4, 8], move: [6, 8], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, step: Math.sin(ph) * 3, tilt: Math.sin(ph) * 0.6 };
    if (nm === "wind") P = { ph, roar: 0.3 * t, tilt: -1 * t };
    if (nm === "atk") P = { ph: ph * 2, roar: 1, tilt: 1.2 };
    if (nm === "rec") P = { ph, roar: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, tilt: -1 };
    return brazierFrame(P);
  },
};

// ════ [정예] 잿빛 간수 ════ 그을린 두건 갑옷의 거구 · 허리에 큰 열쇠 꾸러미 · 한 손에 쇠공 사슬 철퇴 · 투구 틈의 잿불 눈 ·
//   가슴판에 감옥 문장 · 너덜한 겉옷
//   p: bob · step · swing(0 내림 ~ 1.4 머리 위 · 2 내려친 끝) · pull 사슬 끌기 · crouch · hurt
const JLK = 0.72;
function jailerFrame(p = {}) {
  const W = 120, H = 116, G = H - 1, S = sculpt(W, H, { k: JLK, ax: 58 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 5, st = p.step ?? 0, sw = p.swing ?? 0, cx = 56;
  // 다리 (판금 정강이 · 무거운 장화)
  for (const [x, far, s] of [[cx - 9, 1, -st], [cx + 9, 0, st]]) {
    const hp = [x, 76 + b], ft = [x + s, G - 3], kn = [x + 2 + s * 0.5, 94 + b * 0.5], M0 = far ? IRONF : IRON;
    S.add(U(capF(hp, kn, 7, 6), capF(kn, ft, 6, 5.4)), far ? CLOTHF : CLOTH, { z: far ? -3 : 3, h: 6 });
    S.add(capF([kn[0], kn[1] + 2], [ft[0], ft[1] - 4], 5.6, 5), M0, { z: far ? -2 : 4, h: 5 });
    S.add(ellR(kn[0] + 1, kn[1], 4.4, 4), M0, { z: far ? -1.5 : 4.5, h: 3.6 });
    S.add(U(ellR(ft[0] + 3, G - 3.5, 9, 4), capF([ft[0] - 3, G - 6], [ft[0] + 2, G - 5], 4)), far ? mat(rampF(0x3a2c24), { tex: "leather" }) : LEATH, { z: far ? -1 : 5, h: 3.5 });
  }
  // 먼 팔 (사슬을 쥠)
  const shF = [cx - 16, 46 + b], hF = [cx - 22, 70 + b];
  S.add(U(capF(shF, hF, 6, 5)), IRONF, { z: -4, h: 5 });
  S.add(ellR(hF[0], hF[1] + 1, 5, 4.6), mat(rampF(0x3a2c24), { tex: "leather" }), { z: -3, h: 4 });
  // 몸통 (갑옷 흉판 + 아래 너덜한 겉옷 자락)
  S.add(polyF([[cx - 18, 72 + b], [cx + 18, 72 + b], [cx + 22, 92 + b], [cx + 10, 89 + b], [cx + 4, 94 + b], [cx - 4, 90 + b], [cx - 12, 95 + b], [cx - 20, 90 + b]]), CLOTH, { z: 1, h: 6 });
  S.add(U(ellR(cx, 58 + b, 19, 17), polyF([[cx - 17, 60 + b], [cx + 17, 60 + b], [cx + 16, 76 + b], [cx - 16, 76 + b]])), IRON, { z: 2, h: 14 });
  S.carve(capF([cx, 44 + b], [cx, 74 + b], 0.6), 0.8);
  for (const y of [52, 60, 68]) S.carve(capF([cx - 15, y + b], [cx + 15, y + 1 + b], 0.5), 0.5);
  S.add(ellR(cx + 4, 56 + b, 5.4, 5.4), RUST, { on: 1, lift: 0.6, h: 1 });
  for (const d of [-2.2, 0, 2.2]) S.add(capF([cx + 4 + d, 52 + b], [cx + 4 + d, 60 + b], 0.5), IRONF, { on: 1, lift: 0.5, h: 0.5 });
  // 허리띠 + 열쇠 꾸러미
  S.add(capF([cx - 18, 75 + b], [cx + 18, 75 + b], 2.6), LEATH, { z: 8, h: 2 });
  S.add(minus(ellR(cx + 10, 81 + b, 4.6, 4.6), ellR(cx + 10, 81 + b, 3, 3)), BRASS, { z: 9, h: 1 });
  for (const [a, l] of [[1.2, 9], [1.6, 11], [2.0, 8]]) { const k0 = pol([cx + 10, 81 + b], a, 4), k1 = pol(k0, a, l); S.add(capF(k0, k1, 0.8), BRASS, { z: 9.5, h: 0.8 }); S.add(polyF([k1, pol(k1, a + 1.57, 2.4), pol(pol(k1, a + 1.57, 2.4), a, 2)]), BRASS, { z: 9.6, h: 0.6 }); }
  // 어깨 판금 (먼 쪽 · 가까운 쪽)
  S.add(ellR(cx - 15, 44 + b, 9, 6.4, -0.3), IRONF, { z: 3, h: 5 });
  // 두건 투구 (그을린 두건 + 철 가면 + 눈 틈)
  const hx = cx + 5, hy = 30 + b;
  S.add(U(ellR(hx - 3, hy, 12, 12), polyF([[hx - 15, hy + 2], [hx - 10, hy + 18], [hx + 4, hy + 14]])), CLOTH, { z: 4, h: 9 });
  S.add(ellR(hx + 3, hy + 2, 8, 9.4), IRON, { z: 7, h: 7 });
  S.carve(capF([hx - 1, hy - 0.6], [hx + 10, hy - 1], 0.9), 2, !1);
  for (const y of [hy + 4, hy + 6.6, hy + 9.2]) S.carve(capF([hx + 2, y], [hx + 9, y], 0.4), 1, !1);
  if (!p.hurt) for (const x of [hx + 4, hx + 8]) S.decal(x, hy - 0.8, 0xff8a3a).decal(x, hy - 1.4, 0xffe0a0);
  S.add(ellR(cx + 16, 44 + b, 10, 7, 0.3), IRON, { z: 9, h: 6 });
  S.add(ellR(cx + 16, 43 + b, 5, 3, 0.3), RUST, { on: 1, h: 0.6 });
  // 가까운 팔 + 사슬 철퇴 (쇠공 · 가시)
  const sh = [cx + 18, 48 + b];
  const hand = sw >= 2 ? [cx + 34, 70 + b] : sw > 0.7 ? pol(sh, -1.6 - (sw - 0.7) * 0.6, 22) : pol(sh, 1.2 - sw * 2, 20);
  S.add(capF(sh, hand, 6.4, 5.4), IRON, { z: 10, h: 5.5 });
  S.add(ellR(hand[0], hand[1], 5.4, 5), LEATH, { z: 11, h: 4.4 });
  const ball = sw >= 2 ? [hand[0] + 18, G - 8] : sw > 0.7 ? pol(hand, -2.4, 22) : p.pull ? [hand[0] + 30, hand[1] + 4] : [hand[0] + 6, hand[1] + 22];
  chain(S, hand, ball, 3.6, IRON, { z: 10.5, sag: sw > 0.7 && sw < 2 ? -3 : 2 });
  S.add(ellR(ball[0], ball[1], 8.4, 8.4), IRON, { z: 11, h: 7.4 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * T2 + 0.3, q = pol(ball, a, 7.6); S.add(polyF([pol(q, a + 1.4, 1.8), pol(q, a, 4.4), pol(q, a - 1.4, 1.8)]), IRON, { z: 11.5, h: 1.6, prof: "sharp" }); }
  S.add(ellR(ball[0] - 2, ball[1] - 2, 2.4, 2), RUST, { on: 1, h: 0.4 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxJailer = {
  fw: Math.round(120 * JLK), fh: Math.round(116 * JLK), w: 32, h: 52,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], pull: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.7 };
    if (nm === "move") P = { step: Math.sin(ph) * 5, bob: -Math.abs(Math.sin(ph)) * 2 };
    if (nm === "wind") P = { swing: 1.4 * t, crouch: -0.2 * t };
    if (nm === "atk") P = { swing: 2, crouch: [0.4, 0.8, 0.8][f] };
    if (nm === "rec") P = { swing: t < 0.5 ? 2 : 0.2, crouch: 0.6 * (1 - t) };
    if (nm === "pull") P = { pull: 1, crouch: [0, 0.3, 0.5, 0.2][f] };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.4 };
    return jailerFrame(P);
  },
};

// ════ 잿까마귀 ════ 재를 뒤집어쓴 검은 까마귀 · 끝이 그을린 날개깃 · 잿불 눈 · 굵은 부리
//   p: flap · tilt · beak · hurt
const CRK = 0.72;
function crowFrame(p = {}) {
  const W = 64, H = 50, S = sculpt(W, H, { k: CRK, ax: 32 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cx = 30, cy = 28;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 + (back ? -3 : 0), cy - 2), a = -Math.PI / 2 - 0.6 + (1 - up) * 0.9;
    for (let k = 0; k < 5; k++) { const ak = a - 0.18 * k, len = 17 - k * 1.5, tip = pol(root, ak, len); S.add(U(capF(root, tip, 3.4 - k * 0.3, 1.4)), back ? CROWF : CROW, { z: back ? -4 - k * 0.1 : 6 - k * 0.1, h: 1.6 }); S.add(ellR(...pol(root, ak, len - 1.5), 1.2, 2.2, ak), mat(ramp(0x7a7068)), { on: 1, h: 0.3 }); }
    S.add(ellR(...pol(root, a + 0.3, 6), 6, 4, a), back ? CROWF : CROW, { z: back ? -3.5 : 6.5, h: 2.4 });
  };
  wing(1);
  // 꼬리깃 + 몸 + 다리
  for (const d of [-0.2, 0, 0.2]) S.add(capF(R(cx - 8, cy + 1), R(cx - 19, cy + 3 + d * 8), 2.6, 1.6), CROWF, { z: 0, h: 1.4 });
  S.add(ellR(...R(cx - 1, cy + 1), 10, 7), CROW, { z: 2, h: 6 });
  S.add(ellR(...R(cx + 1, cy + 3), 5, 3.4), mat(ramp(0x7a7068), { tex: "feather", amp: 0.8 }), { on: 1, h: 0.4 });
  for (const d of [0, 3]) S.add(capF(R(cx + d, cy + 7), R(cx + d + 1, cy + 12), 0.7, 0.5), mat(ramp(0x3a3230)), { z: 1, h: 0.6 });
  // 머리 + 부리
  const hd = R(cx + 9, cy - 3);
  S.add(ellR(hd[0], hd[1], 5.4, 5), CROW, { z: 4, h: 4.6 });
  const bk = p.beak ?? 0;
  S.add(polyF([R(cx + 12, cy - 5), R(cx + 21, cy - 2 + bk), R(cx + 12, cy - 1.5)]), mat(ramp(0x3a3434), { spec: 0.5 }), { z: 5, h: 1.8, prof: "sharp" });
  bk > 0.3 && S.add(polyF([R(cx + 12, cy - 1.2), R(cx + 19, cy + 1.6 + bk * 1.5), R(cx + 12, cy + 0.5)]), mat(ramp(0x2e2a2a)), { z: 4.8, h: 1.2, prof: "sharp" });
  !p.hurt && S.decal(...R(cx + 10, cy - 4.4), 0xff8a3a).decal(...R(cx + 10.5, cy - 5), 0xffffff);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxCrow = {
  fw: Math.round(64 * CRK), fh: Math.round(50 * CRK), w: 18, h: 14, flying: !0,
  anims: { idle: [4, 10], move: [4, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.2 };
    if (nm === "wind") P = { flap: 1, tilt: -0.4 * t, beak: t };
    if (nm === "atk") P = { flap: -0.6, tilt: 0.7, beak: 1 };
    if (nm === "rec") P = { flap: fl, tilt: 0.3 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.5, beak: 1 };
    return crowFrame(P);
  },
};

// ════ 불씨 정령 ════ 숯 껍질 덩어리 속에서 불이 새어 나온다 (금이 간 틈마다 빛) · 둘레에 불씨가 돈다. 부풀었다 터진다
//   p: ph · swell(0~1.3) · hurt
const CDK = 0.72;
function cinderFrame(p = {}) {
  const W = 52, H = 54, S = sculpt(W, H, { k: CDK, ax: 26 });
  const ph = p.ph ?? 0, sw = p.swell ?? 0, cx = 26, cy = 27, r = 9 + sw * 4;
  for (let k = 0; k < 5; k++) { const a = ph + k * 1.26, x = cx + Math.cos(a) * (r + 6), y = cy + Math.sin(a) * (r + 3) * 0.7; Math.sin(a) < 0 && S.add(ellR(x, y, 1.6, 1.6), EMB, { z: -3, h: 1 }); }
  // 숯 껍질 조각들 (틈이 벌어질수록 불이 보인다)
  S.add(ellR(cx, cy, r - 1, r - 1), EMB, { z: 0, h: r * 0.6 });
  for (let k = 0; k < 7; k++) { const a = (k / 7) * T2 + 0.4, c0 = pol([cx, cy], a, r * 0.55 + sw * 2); S.add(ellR(c0[0], c0[1], r * 0.48, r * 0.42, a), k % 2 ? CHAR : CHARF, { z: 2, h: r * 0.5 }); }
  S.add(ellR(cx + 1, cy + 1, 3, 2.6), EMBY, { z: 1, h: 1 });
  if (!p.hurt) S.decal(cx + 3, cy - 2, 0xffe0a0).decal(cx + 6, cy - 2, 0xffe0a0);
  for (let k = 0; k < 5; k++) { const a = ph + k * 1.26, x = cx + Math.cos(a) * (r + 6), y = cy + Math.sin(a) * (r + 3) * 0.7; Math.sin(a) >= 0 && S.add(ellR(x, y, 1.6, 1.6), EMBY, { z: 6, h: 1 }); }
  flame(S, [cx - 1, cy - r + 2], 7 + sw * 4, 3, ph, { z: 3 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxCinder = {
  fw: Math.round(52 * CDK), fh: Math.round(54 * CDK), w: 16, h: 16, flying: !0,
  anims: { idle: [6, 9], move: [6, 11], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, swell: Math.sin(ph) * 0.1 };
    if (nm === "wind") P = { ph: ph * 2, swell: 1.2 * t };
    if (nm === "atk") P = { ph, swell: [1.3, 0.6, 0.2][f] };
    if (nm === "rec") P = { ph, swell: 0.2 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, swell: 0.4 };
    return cinderFrame(P);
  },
};

// ════ 그을린 망령 ════ 해진 잿빛 두건 망토 · 두건 속엔 어둠과 두 불빛 · 아래로 갈수록 재가 되어 흩어진다 · 손에 사슬 등불
//   p: ph · lamp(등불 들기 0~1) · lean · hurt
const WRK = 0.72;
function wraithFrame(p = {}) {
  const W = 56, H = 68, S = sculpt(W, H, { k: WRK, ax: 28 });
  const ph = p.ph ?? 0, lm = p.lamp ?? 0, ln = p.lean ?? 0, cx = 27, fy = Math.sin(ph) * 1.2;
  // 망토 (아래로 갈라진 자락)
  S.add(polyF([[cx - 9 + ln, 20 + fy], [cx + 9 + ln, 20 + fy], [cx + 13, 50 + fy], [cx + 9, 58 + fy], [cx + 5, 52 + fy], [cx + 1, 62 + fy], [cx - 3, 53 + fy], [cx - 8, 60 + fy], [cx - 12, 50 + fy]]), CLOTH, { z: 0, h: 7 });
  for (const dx of [-6, -1, 4, 8]) S.carve(capF([cx + dx * 0.6 + ln, 26 + fy], [cx + dx, 56 + fy], 0.5), 0.8);
  // 먼 팔 (소매)
  S.add(capF([cx - 6 + ln, 28 + fy], [cx - 11, 42 + fy], 3, 2.4), CLOTHF, { z: -1, h: 2.4 });
  // 두건 + 속 어둠 + 눈
  const hx = cx + 2 + ln, hy = 17 + fy;
  S.add(U(ellR(hx, hy, 9, 9.4), polyF([[hx - 8, hy - 2], [hx - 12, hy - 12], [hx - 2, hy - 7]])), CLOTH, { z: 2, h: 7 });
  S.add(ellR(hx + 3, hy + 1.6, 5.4, 6), mat(ramp(0x141010)), { lift: -1, z: 3, h: 2 });
  if (!p.hurt) for (const x of [hx + 2, hx + 5.5]) S.decal(x, hy + 1, 0xff9a40).decal(x, hy + 0.4, 0xffe0a0);
  // 가까운 팔 + 사슬 등불
  const sh = [cx + 6 + ln, 27 + fy], hand = pol(sh, 0.9 - lm * 1.6, 11);
  S.add(capF(sh, hand, 3, 2.4), CLOTH, { z: 6, h: 2.6 });
  S.add(ellR(hand[0], hand[1], 1.8, 1.8), ASHL, { z: 7, h: 1.4 });
  const lp = [hand[0] + 2, hand[1] + 9];
  chain(S, hand, [lp[0], lp[1] - 4], 2.2, IRON, { z: 7 });
  S.add(polyF([[lp[0] - 3, lp[1] - 4], [lp[0] + 3, lp[1] - 4], [lp[0] + 3.4, lp[1] + 4], [lp[0] - 3.4, lp[1] + 4]]), IRON, { z: 8, h: 2, prof: "flat" });
  S.add(ellR(lp[0], lp[1], 2.2, 2.8), EMBY, { lift: 0.5, h: 1 });
  const C = S.render({ rim: !0 });
  // 아래 자락이 재로 흩어진다 (점점 비우기)
  for (let y = Math.round(H * WRK * 0.74); y < C.H; y++) { const t = (y - H * WRK * 0.74) / (C.H - H * WRK * 0.74); for (let x = 0; x < C.W; x++) { const i = y * C.W + x; C.d[i] >= 0 && ((x * 7 + y * 13 + Math.floor(ph * 3)) % 9) / 9 < t && (C.d[i] = -1); } }
  return fin(C, p);
}
export const pxWraith = {
  fw: Math.round(56 * WRK), fh: Math.round(68 * WRK), w: 16, h: 30, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, lean: 1.5 };
    if (nm === "wind") P = { ph, lamp: t, lean: -1 * t };
    if (nm === "atk") P = { ph, lamp: 1, lean: 1.5 };
    if (nm === "rec") P = { ph, lamp: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, lean: -2 };
    return wraithFrame(P);
  },
};

// ════ [정예] 잿빛 드레이크 ════ 잿빛 비늘 · 그을린 막 날개(뼈대 + 찢긴 막) · 뿔 두 쌍 · 가슴과 목 아래 잿불 비늘 틈 · 꼬리 끝 가시 ·
//   목에 끊긴 사슬 족쇄
//   p: flap · tilt · jaw · neck · breath(불 뿜기) · hurt
const DRK = 0.7;
function drakeFrame(p = {}) {
  const W = 130, H = 104, S = sculpt(W, H, { k: DRK, ax: 62 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, jw = p.jaw ?? 0, nk = p.neck ?? 0, cx = 60, cy = 56;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), sh = R(cx + 4 + (back ? -4 : 0), cy - 6), el = pol(sh, -Math.PI / 2 - 0.35 + (1 - up) * 0.9, 20), M0 = back ? WINGF : WING, B0 = back ? SCLF : SCL;
    const fingers = [-0.4, 0.1, 0.55, 1.0].map((d) => pol(el, -Math.PI / 2 - 0.9 + d + (1 - up) * 0.7, 26 - Math.abs(d - 0.3) * 8));
    S.add(polyF([sh, el, ...fingers, R(cx - 18, cy - 2)]), M0, { z: back ? -6 : 8, h: 2, prof: "flat" });
    for (let k = 0; k < 4; k++) S.carve(capF(lerp(el, fingers[k], 0.6), lerp(fingers[k], k < 3 ? fingers[k + 1] : R(cx - 18, cy - 2), 0.5), 0.6), 1, !1);
    S.add(capF(sh, el, 3, 2.4), B0, { z: back ? -5 : 9, h: 2.4 });
    for (const f0 of fingers) S.add(capF(el, f0, 1.6, 0.7), B0, { z: back ? -5 : 9, h: 1.2 });
    S.add(polyF([el, pol(el, -2.2, 6), pol(el, -1.6, 1.5)]), BONE, { z: back ? -4.5 : 9.5, h: 1, prof: "sharp" });
  };
  wing(1);
  // 꼬리 (가늘어지며 끝 가시)
  const t0 = R(cx - 16, cy + 6), t1 = R(cx - 34, cy + 12), t2 = R(cx - 50, cy + 8), t3 = R(cx - 58, cy - 2);
  S.add(U(capF(t0, t1, 7, 4.6), capF(t1, t2, 4.6, 2.6), capF(t2, t3, 2.6, 1)), SCL, { z: 0, h: 3.6 });
  S.add(polyF([t3, pol(t3, -2.4, 7), pol(t3, -1.4, 4)]), BONE, { z: 1, h: 1, prof: "sharp" });
  // 뒷다리 · 앞다리 (발톱)
  for (const [x, far] of [[cx - 10, 1], [cx - 4, 0]]) { const hp = R(x, cy + 8), ft = R(x + 6, cy + 24); S.add(U(capF(hp, ft, far ? 4.4 : 5, 2.4)), far ? SCLF : SCL, { z: far ? -1 : 6, h: 3 }); for (const d of [-0.4, 0, 0.4]) S.add(capF(ft, pol(ft, 0.9 + d, 4), 0.8, 0.3), BONE, { z: far ? -0.5 : 6.5, h: 0.6 }); }
  // 몸통 + 배 비늘 + 잿불 틈
  S.add(U(ellR(...R(cx, cy + 2), 20, 12), ellR(...R(cx + 12, cy - 2), 12, 10)), SCL, { z: 2, h: 10 });
  S.add(ellR(...R(cx + 4, cy + 7), 14, 5), BELLY, { on: 1, h: 0.6 });
  for (let k = 0; k < 5; k++) S.carve(capF(R(cx - 8 + k * 5, cy + 4), R(cx - 9 + k * 5, cy + 11), 0.45), 0.8);
  cracks(S, [R(cx + 10, cy + 2), R(cx + 14, cy + 6), R(cx + 12, cy + 10)]);
  for (let k = 0; k < 7; k++) { const q = R(cx - 14 + k * 5, cy - 9 - Math.sin((k / 6) * Math.PI) * 3); S.add(polyF([[q[0] - 2, q[1] + 2], [q[0], q[1] - 4], [q[0] + 2, q[1] + 2]]), BONE, { lift: 1, h: 1.2, prof: "sharp" }); }
  // 목 + 끊긴 사슬 족쇄 + 머리
  const n0 = R(cx + 18, cy - 4), n1 = R(cx + 28 + nk * 4, cy - 16 + nk * 6), hd = R(cx + 40 + nk * 8, cy - 22 + nk * 10);
  S.add(U(capF(n0, n1, 7, 5.4), capF(n1, hd, 5.4, 4.6)), SCL, { z: 4, h: 5 });
  S.add(capF(pol(n1, 1.1, -5), pol(n1, 1.1, 5), 2.2), IRON, { z: 7, h: 2 });
  chain(S, pol(n1, 1.1, 4), pol(n1, 1.6, 14), 2.6, IRON, { z: 7.5 });
  S.add(ellR(hd[0], hd[1], 7.4, 6), SCL, { z: 7, h: 6 });
  S.add(U(capF([hd[0] + 3, hd[1] - 1], [hd[0] + 15, hd[1] + 1], 4, 2.6)), SCL, { z: 8, h: 3.4 });
  S.add(capF([hd[0] + 3, hd[1] + 3 + jw], [hd[0] + 13, hd[1] + 4 + jw * 5], 2.6, 1.6), SCLF, { z: 7.5, h: 2 });
  jw > 0.3 && S.add(polyF([[hd[0] + 4, hd[1] + 2], [hd[0] + 15, hd[1] + 1.6], [hd[0] + 13, hd[1] + 3.6 + jw * 4], [hd[0] + 4, hd[1] + 4]]), EMB, { z: 7.7, h: 0.8 });
  for (const [a, l, z] of [[-2.5, 13, 6], [-2.2, 10, 8.5]]) S.add(U(capF([hd[0] - 3, hd[1] - 3], pol([hd[0] - 3, hd[1] - 3], a, l), 1.8, 0.6)), BONE, { z, h: 1.4 });
  !p.hurt && S.decal(hd[0] + 3, hd[1] - 2, 0xff8a3a).decal(hd[0] + 3.5, hd[1] - 2.6, 0xffe0a0);
  wing(0);
  if (p.breath) for (let k = 0; k < 3; k++) flame(S, [hd[0] + 22 + k * 7, hd[1] + 5 + k * 1.5], 10 + k * 2, 4 + k, k, { z: 12 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxDrake = {
  fw: Math.round(130 * DRK), fh: Math.round(104 * DRK), w: 34, h: 30, flying: !0,
  anims: { idle: [4, 8], move: [4, 10], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1], breath: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: fl * 0.6, tilt: -0.25 * t, neck: -0.6 * t, jaw: 0.5 * t };
    if (nm === "atk") P = { flap: -0.6, tilt: 0.4, neck: 0.6, jaw: 1.2 };
    if (nm === "rec") P = { flap: fl, neck: 0.3 * (1 - t) };
    if (nm === "breath") P = { flap: fl * 0.5, neck: 0.3, jaw: 1.3, breath: f > 0 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, jaw: 1 };
    return drakeFrame(P);
  },
};

// ════ 향로 정령 ════ 사슬에 매달린 놋쇠 향로(구멍 뚫린 뚜껑 · 새김 띠)가 혼자 흔들린다 · 구멍마다 불빛 · 위로 매캐한 연기
//   p: swing(-1~1) · puff · hurt
const CSK = 0.72;
function censerFrame(p = {}) {
  const W = 48, H = 70, S = sculpt(W, H, { k: CSK, ax: 24 });
  const sw = p.swing ?? 0, pf = p.puff ?? 0, top = [24, 2], pv = pol(top, Math.PI / 2 - sw * 0.35, 34);
  chain(S, top, pol(top, Math.PI / 2 - sw * 0.35, 26), 2.6, BRASS, { z: 0 });
  const R = (x, y) => { const c = Math.cos(-sw * 0.35), s = Math.sin(-sw * 0.35); return [pv[0] + x * c - y * s, pv[1] + x * s + y * c]; };
  // 뚜껑 (돔 + 꼭지) · 몸 (구멍 뚫린 둥근 통) · 받침
  S.add(ellR(...R(0, 0), 7, 6), BRASS, { z: 2, h: 5 });
  S.add(ellR(...R(0, -6), 2, 2), BRASS, { z: 3, h: 1.6 });
  S.add(ellR(...R(0, 8), 10, 8), BRASS, { z: 2, h: 7 });
  S.carve(capF(R(-10, 6), R(10, 6), 0.5), 0.7);
  for (const [x, y] of [[-5, 9], [0, 10], [5, 9], [-3, 13], [3, 13], [-2, 2], [3, 2]]) { S.carve(ellR(...R(x, y), 1, 1), 1.6, !1); S.decal(...R(x, y), 0xffa040); }
  S.add(polyF([R(-5, 15), R(5, 15), R(7, 19), R(-7, 19)]), BRASS, { z: 3, h: 2 });
  !p.hurt && S.decal(...R(-2, 6), 0xffe0a0).decal(...R(3, 6), 0xffe0a0);
  const C = S.render({ rim: !0 });
  // 연기 (회색 덩이 몇 개, 위로)
  const PX = (q) => [W * CSK / 2 + (q[0] - 24) * CSK, H * CSK + (q[1] - H) * CSK];
  for (let k = 0; k < 4 + pf * 4; k++) { const q = PX(R(-4 + (k % 3) * 4 + sw * 3, -10 - k * 4)), r = 1.6 + (k % 2); for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) i * i + j * j <= r * r && C.d[Math.round(q[1] + j) * C.W + Math.round(q[0] + i)] === -1 && Math.round(q[1] + j) > 0 && C.px(q[0] + i, q[1] + j, (i + j) % 3 ? 0x8a8280 : 0x6a6260); }
  return fin(C, p);
}
export const pxCenser = {
  fw: Math.round(48 * CSK), fh: Math.round(70 * CSK), w: 16, h: 22, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { swing: Math.sin(ph) * 0.6 };
    if (nm === "wind") P = { swing: -1 * t, puff: 0.5 };
    if (nm === "atk") P = { swing: [0.6, 1, 0.8][f], puff: 1 };
    if (nm === "rec") P = { swing: 0.8 * (1 - t), puff: 0.6 };
    if (nm === "hurt") P = { hurt: f === 0, swing: -0.8 };
    return censerFrame(P);
  },
};

// ════ 불박쥐 ════ 숯빛 털 · 잿불이 비치는 막 날개 · 큰 귀 · 불씨 같은 눈
//   p: flap · tilt · hurt
const BTK = 0.72;
function batFrame(p = {}) {
  const W = 60, H = 44, S = sculpt(W, H, { k: BTK, ax: 30 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cx = 30, cy = 22;
  const wing = (side) => {
    const sh = [cx + side * 2, cy - 1], el = [cx + side * 9, cy - 6 - fl * 6], tips = [[cx + side * 26, cy - 8 - fl * 10], [cx + side * 24, cy + 2 - fl * 5], [cx + side * 17, cy + 6 - fl * 2]];
    S.add(polyF([sh, el, ...tips, [cx + side * 6, cy + 5]]), side < 0 ? WINGF : WING, { z: side < 0 ? -2 : 4, h: 1.6, prof: "flat" });
    for (const tp of tips) S.add(capF(el, tp, 1, 0.5), CHAR, { z: side < 0 ? -1.5 : 4.5, h: 0.8 });
    S.add(capF(sh, el, 1.4, 1), CHAR, { z: side < 0 ? -1.5 : 4.5, h: 1 });
    S.add(ellR(...lerp(el, tips[1], 0.5), 3, 1.6), EMBR, { on: 1, h: 0.3 });
  };
  wing(-1);
  S.add(ellR(cx, cy + 1, 6, 7), mat(ramp(0x3a3230), { tex: "fur", amp: 1, dir: 1.57 }), { z: 1, h: 5 });
  S.add(ellR(cx + 1, cy - 6, 4.6, 4.2), mat(ramp(0x3a3230), { tex: "fur", amp: 1 }), { z: 2, h: 4 });
  for (const d of [-1, 1]) S.add(polyF([[cx + d * 2, cy - 8], [cx + d * 4.5, cy - 15], [cx + d * 4.6, cy - 7]]), CHAR, { z: 2.5, h: 1.2 });
  !p.hurt && S.decal(cx - 0.5, cy - 6.5, 0xffa040).decal(cx + 2.5, cy - 6.5, 0xffa040);
  S.add(polyF([[cx, cy - 3], [cx + 1, cy - 1.5], [cx + 2, cy - 3]]), BONE, { lift: 1, h: 0.4 });
  wing(1);
  return fin(S.render({ rim: !0 }), p);
}
export const pxFireBat = {
  fw: Math.round(60 * BTK), fh: Math.round(44 * BTK), w: 16, h: 14, flying: !0,
  anims: { idle: [4, 12], move: [4, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const fl = [1, 0, -1, 0][f % 4];
    let P = { flap: fl };
    if (nm === "wind") P = { flap: 1 };
    if (nm === "atk") P = { flap: -1 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.5 };
    return batFrame(P);
  },
};

// ════ 족쇄 망령 ════ 사슬로 이어진 쇠 족쇄 한 쌍과 그것을 찬 흐릿한 손 둘이 떠다닌다 · 가운데 희미한 얼굴
//   p: ph · reach(0~1.2) · hurt
const SKK = 0.72;
function shackleFrame(p = {}) {
  const W = 60, H = 56, S = sculpt(W, H, { k: SKK, ax: 30 });
  const ph = p.ph ?? 0, rc = p.reach ?? 0, cx = 28, cy = 26;
  // 흐릿한 얼굴 (가운데 뒤)
  S.add(ellR(cx, cy - 4, 8, 9), GHOST, { z: -4, h: 4 });
  S.carve(ellR(cx + 2, cy - 5, 1.6, 2.2), 2, !1).carve(ellR(cx + 6, cy - 5, 1.4, 2), 2, !1).carve(ellR(cx + 4, cy + 1, 2, 1.4), 1.6, !1);
  // 손 둘 (뒤 · 앞) + 족쇄 + 이은 사슬
  const hands = [[cx - 10 + Math.sin(ph) * 2, cy + 8 + Math.cos(ph) * 2, 1], [cx + 10 + rc * 12, cy + 4 - rc * 4 + Math.sin(ph + 1) * 2, 0]];
  chain(S, [hands[0][0] + 3, hands[0][1] - 1], [hands[1][0] - 3, hands[1][1] - 1], 3, IRON, { z: 1, sag: 5 });
  for (const [x, y, far] of hands) {
    S.add(U(capF([x - 6, y + 4], [x, y], 2.6, 2), ellR(x + 2, y - 1, 3.4, 3)), GHOST, { z: far ? -1 : 5, h: 2.4 });
    for (const d of [-0.5, 0, 0.5, 1]) S.add(capF([x + 3, y - 2], pol([x + 3, y - 2], -0.8 + d * (rc > 0.5 && !far ? 0.3 : 0.6), 4.4), 0.8, 0.5), GHOST, { z: far ? -0.5 : 5.5, h: 0.6 });
    S.add(minus(ellR(x - 2, y + 2, 4, 4.2, 0.6), ellR(x - 2, y + 2, 2.4, 2.6, 0.6)), IRON, { z: far ? 0 : 6, h: 2 });
  }
  const C = S.render({ rim: !0 });
  return fin(C, p);
}
export const pxShackle = {
  fw: Math.round(60 * SKK), fh: Math.round(56 * SKK), w: 18, h: 18, flying: !0,
  anims: { idle: [6, 7], move: [6, 9], wind: [3, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, reach: -0.3 * t };
    if (nm === "atk") P = { ph, reach: [0.6, 1.2, 1.1][f] };
    if (nm === "rec") P = { ph, reach: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return shackleFrame(P);
  },
};

// ════ [정예] 잿빛 불새 ════ 재빛 깃 끝마다 불이 붙은 큰 새 · 길게 끌리는 불꼬리 깃 · 불꽃 볏 · 금빛 부리와 발톱
//   p: flap · tilt · dive · burn(깃불 세기) · hurt
const PHK = 0.7;
function phoenixFrame(p = {}) {
  const W = 132, H = 108, S = sculpt(W, H, { k: PHK, ax: 62 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, bn = p.burn ?? 0.5, cx = 62, cy = 52;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const FE = mat(ramp(0x7a6a64), { tex: "feather", amp: 1, dir: 0.4 }), FEF = mat(rampF(0x625450), { tex: "feather", amp: 0.9, dir: 0.4 });
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 + (back ? -4 : 0), cy - 4), a = -Math.PI / 2 - 0.5 + (1 - up) * 0.95;
    for (let k = 0; k < 7; k++) {
      const ak = a - 0.14 * k, len = 34 - k * 2.6, tip = pol(root, ak, len);
      S.add(capF(pol(root, ak, 6), tip, 4.4 - k * 0.3, 1.8), back ? FEF : FE, { z: back ? -6 - k * 0.1 : 8 - k * 0.1, h: 1.8 });
      flame(S, pol(root, ak, len - 1), 6 + bn * 6, 2.2, k + up, { z: back ? -5.5 : 8.5 });
    }
    S.add(ellR(...pol(root, a + 0.2, 10), 10, 6, a), back ? FEF : FE, { z: back ? -5 : 9, h: 3 });
  };
  wing(1);
  // 불꼬리 깃 (셋 · 길게)
  for (const [d, l] of [[-0.2, 40], [0, 46], [0.25, 38]]) { const a0 = R(cx - 12, cy + 6), tp = pol(a0, Math.PI + 0.15 + d, l); S.add(capF(a0, tp, 3.4, 1.4), FE, { z: 0, h: 1.6 }); S.add(ellR(tp[0], tp[1], 4, 3), EMB, { z: 0.5, h: 1.4 }); flame(S, [tp[0] + 2, tp[1]], 8 + bn * 5, 3, d * 9, { z: 1 }); }
  // 몸통 + 가슴 불빛
  S.add(U(ellR(...R(cx, cy + 4), 16, 11), ellR(...R(cx + 10, cy - 2), 10, 9)), FE, { z: 2, h: 9 });
  S.add(ellR(...R(cx + 8, cy + 4), 7, 6), EMB, { on: 1, lift: 0.4, h: 0.6 });
  // 다리 (접어 아래로) + 금빛 발톱
  for (const dx of [-4, 3]) { const hp = R(cx + dx, cy + 12), ft = R(cx + dx + 2, cy + 22); S.add(capF(hp, ft, 2.2, 1.6), mat(ramp(0x8a7a52), { tex: "scale" }), { z: 3, h: 1.6 }); for (const d of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 1.2 + d, 4), 0.8, 0.4), mat(ramp(0xd8b050), { spec: 0.5 }), { z: 3.5, h: 0.6 }); }
  // 머리 + 불꽃 볏 + 부리
  const hd = R(cx + 22, cy - 10);
  S.add(capF(R(cx + 12, cy - 4), hd, 6, 5), FE, { z: 5, h: 5 });
  S.add(ellR(hd[0], hd[1], 6.4, 5.6), FE, { z: 6, h: 5 });
  for (const [a, h0] of [[-2.4, 10], [-2.0, 13], [-1.6, 9]]) flame(S, pol(hd, a, 4), h0 * (0.7 + bn * 0.5), 2.4, a * 3, { z: 6.5 });
  S.add(polyF([[hd[0] + 4.6, hd[1] - 2], [hd[0] + 13, hd[1] + 1.4], [hd[0] + 4.6, hd[1] + 2.4]]), mat(ramp(0xd8b050), { spec: 0.5 }), { z: 7, h: 1.8, prof: "sharp" });
  !p.hurt && S.decal(hd[0] + 2, hd[1] - 1.4, 0xfff0a0).decal(hd[0] + 2.6, hd[1] - 2, 0xffffff);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxPhoenix = {
  fw: Math.round(132 * PHK), fh: Math.round(108 * PHK), w: 34, h: 30, flying: !0,
  anims: { idle: [4, 8], move: [4, 10], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1], rain: [4, 10, !1], reborn: [6, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl, burn: 0.5 };
    if (nm === "move") P = { flap: fl, tilt: 0.15, burn: 0.6 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, burn: 0.5 + t * 0.5 };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.8, burn: 1 };
    if (nm === "rec") P = { flap: fl, tilt: 0.3 * (1 - t), burn: 0.7 };
    if (nm === "rain") P = { flap: [1, -1, 1, -1][f], burn: 1.2 };
    if (nm === "reborn") P = { flap: fl, burn: 0.2 + t };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, burn: 0.3 };
    return phoenixFrame(P);
  },
};
