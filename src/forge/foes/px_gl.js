// 글리머샌즈 몬스터 12종 (조각 도구, 오른쪽을 본다) — 번개에 유리로 굳은 사구 · 무지갯빛 유리 메사 · 반쯤 묻힌 거대 유리 조각과 뼈
//   지상 줄: 번개유리 하이에나 · 유리턱 개미 · 유리혹 낙타 · [정예] 번개 코뿔소
//   하늘 줄: 번개 구슬 · 해골 독수리 · 태양 렌즈 눈 · [정예] 천둥새
//   지하 줄: 유리병 소라게 · 도굴꾼 해골 · 낙타거미 · [정예] 개미귀신
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const GLS = mat(ramp(0x9ad8d0, { hi: 0.6 }), { tex: "glass", amp: 0.5, spec: 0.9 }), GLV = mat(ramp(0xb8a0e0, { hi: 0.6 }), { tex: "glass", amp: 0.5, spec: 0.9 }), GLA = mat(ramp(0xe8c070, { hi: 0.6 }), { tex: "glass", amp: 0.5, spec: 0.9 });
const FUL = mat(ramp(0x8a8478), { tex: "stone", amp: 1.2, spec: 0.5 }), BOLT = mat(rampGlow(0xa0e0ff)), BOLTW = mat(rampGlow(0xe8f8ff));
const SAND = mat(ramp(0xe0c898), { tex: "stone", amp: 0.9 }), SANDF = mat(rampF(0xc0a878), { tex: "stone", amp: 0.8 });
const BONE = mat(ramp(0xe0d4b8), { tex: "stone", amp: 0.5, spec: 0.3 }), BONEF = mat(rampF(0xb8ac90), { tex: "stone", amp: 0.5 }), DARK = mat(ramp(0x1a1612));
const LEATH = mat(ramp(0x6a4a30), { tex: "leather", amp: 0.9 }), WOOD = mat(ramp(0x7a5a3a), { tex: "wood", amp: 0.9 }), IRON = mat(ramp(0x6a6a6e), { tex: "metal", amp: 0.8, spec: 0.5 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
const GLX = [GLS, GLV, GLA];
// 유리 결정 조각 (a→b 방향 · 폭 w) 무지갯빛 셋 중 하나
const shard = (S, a, b, w, k, o = {}) => { const d = Math.atan2(b[1] - a[1], b[0] - a[0]); S.add(polyF([pol(a, d + 1.57, w), b, pol(a, d - 1.57, w * 0.7)]), GLX[k % 3], { z: o.z, lift: o.lift, h: o.h ?? w * 0.8, prof: "sharp" }); };
// 지그재그 번개 (렌더 뒤 픽셀로)
function arc(C, P, a, b, n, seed, c0 = 0xe8f8ff, c1 = 0xa0e0ff) {
  let q = P(...a);
  for (let k = 1; k <= n; k++) {
    const t = k / n, j = k < n ? Math.sin(seed * 7.1 + k * 3.7) * 3 : 0, m = P(L(a[0], b[0], t) + j, L(a[1], b[1], t) - j * 0.6);
    const steps = Math.max(1, Math.round(Math.hypot(m[0] - q[0], m[1] - q[1])));
    for (let s = 0; s <= steps; s++) { const x = L(q[0], m[0], s / steps), y = L(q[1], m[1], s / steps); C.px(x, y, c0); C.px(x + 1, y, c1); }
    q = m;
  }
}

// ════ 번개유리 하이에나 ════ 앞이 높고 뒤로 처진 등 · 얼룩 점박이 회황색 털 · 검은 주둥이 · 둥근 귀 · 등 갈기 따라 녹아 붙은 유리 조각 ·
//   웃는 듯 벌어진 턱
//   p: legs · bob · crouch · leap · jaw · head · hurt
const HYK = 0.72;
const HYN = mat(ramp(0xa8946a), { tex: "fur", amp: 1, dir: 0.3 }), HYNF = mat(rampF(0x86744e), { tex: "fur", amp: 0.9, dir: 0.3 }), HYND = mat(ramp(0x3e3226), { tex: "fur", amp: 0.8 });
function hyenaFrame(p = {}) {
  const W = 88, H = 58, G = H - 1, S = sculpt(W, H, { k: HYK, ax: 40 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 4, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, lp = p.leap ?? 0, jw = p.jaw ?? 0, cx = 38;
  const lgf = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 3 : -2), G - 1.5 - o[1] - lp * 6], kn = ik(sh, ft, front ? 13 : 10, front ? 13 : 11, front ? -1 : 1), M0 = far ? HYNF : HYN;
    S.add(U(capF(sh, kn, far ? 3.6 : 4.2, 2.6), capF(kn, ft, 2.2, 1.8)), M0, { z: far ? -3 : 5, h: 2.8 });
    S.add(ellR(ft[0] + 1.8, ft[1] + 0.2, 3, 1.6), HYND, { z: far ? -2.9 : 5.1, h: 1.4 });
  };
  lgf([cx + 12, 30 + b], lg.ff, 1, 1), lgf([cx - 12, 34 + b], lg.bf, 1, 0);
  S.add(U(capF([cx - 18, 30 + b], [cx - 24, 38 + b], 2, 1.4)), HYNF, { z: 0, h: 1.4 });
  S.add(ellR(cx - 25, 40 + b, 2, 2.6), HYND, { z: 0.1, h: 1.4 });
  // 몸 (앞이 높고 뒤가 낮다) + 점박이
  S.add(U(ellR(cx + 8, 28 + b, 13, 10), ellR(cx - 10, 32 + b, 10, 7.4), capF([cx - 6, 31 + b], [cx + 4, 29 + b], 8)), HYN, { z: 1, h: 8 });
  for (const [x, y] of [[cx - 12, 30], [cx - 6, 34], [cx, 28], [cx + 6, 33], [cx + 12, 26], [cx - 2, 36], [cx + 10, 34]]) S.add(ellR(x, y + b, 1.6, 1.3), HYND, { on: 1, lift: 0.2, h: 0.3 });
  // 등 갈기 + 녹아 붙은 유리
  for (let k = 0; k < 8; k++) { const x = cx - 14 + k * 4.4, y = 24 + b - k * 1.4 + (k > 5 ? (k - 5) * 1.2 : 0); S.add(polyF([[x - 1.6, y + 2], [x + 0.6, y - 3], [x + 1.8, y + 2]]), HYND, { lift: 0.8, h: 1, prof: "sharp" }); k % 2 && shard(S, [x, y + 1], [x - 2 + k * 0.3, y - 7 - (k % 3) * 2], 1.8, k, { lift: 1.4 }); }
  // 목 + 머리
  const hx = cx + 24, hy = 20 + b - lp * 3, ha = (p.head ?? 0) * 0.4;
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  S.add(capF([cx + 14, 26 + b], [hx - 3, hy + 3], 7, 5.4), HYN, { z: 3, h: 5 });
  S.add(ellR(...R(hx - 4, hy - 6), 2.8, 3), HYNF, { z: 3.2, h: 2 });
  S.add(ellR(...R(hx, hy), 6.4, 5.6), HYN, { z: 5, h: 5 });
  S.add(capF(R(hx + 3, hy + 1), R(hx + 11, hy + 2.4), 4, 3), HYND, { z: 6, h: 3 });
  S.add(capF(R(hx + 3, hy + 4 + jw), R(hx + 10, hy + 5 + jw * 4), 2.4, 1.6), HYND, { z: 5.8, h: 1.8 });
  if (jw > 0.2) { S.add(polyF([R(hx + 4, hy + 3), R(hx + 12, hy + 2.6), R(hx + 11, hy + 4.4 + jw * 3.6), R(hx + 4, hy + 5)]), mat(ramp(0x7a2a2a)), { z: 5.9, h: 0.4 }); for (const x of [hx + 6, hx + 9.6]) S.add(polyF([R(x - 0.6, hy + 3.2), R(x + 0.6, hy + 3.2), R(x, hy + 5)]), BONE, { z: 6.1, h: 0.4 }); }
  S.add(ellR(...R(hx + 11.6, hy + 1.6), 1.3, 1.1), DARK, { lift: 0.8, h: 0.6 });
  S.add(ellR(...R(hx - 1, hy - 6), 2.8, 3.2), HYN, { z: 6.4, h: 2 });
  S.add(ellR(...R(hx - 1, hy - 6), 1.4, 1.8), HYND, { on: 1, lift: 0.2, h: 0.3 });
  !p.hurt && S.decal(...R(hx + 3, hy - 1.6), 0x1a1210).decal(...R(hx + 3.4, hy - 2.2), 0xa0e0ff);
  lgf([cx + 14, 31 + b], lg.fn, 0, 1), lgf([cx - 10, 35 + b], lg.bn, 0, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxHyena = {
  fw: Math.round(88 * HYK), fh: Math.round(58 * HYK), w: 26, h: 18,
  anims: { idle: [4, 6], move: [6, 13], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], laugh: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5, jaw: 0.2 };
    if (nm === "move") P = { legs: gait4(f, n, 6, 3), bob: Math.cos(ph * 2) * 0.7, jaw: 0.3 };
    if (nm === "wind") P = { crouch: t, head: 0.3 * t, jaw: 0.5 * t };
    if (nm === "atk") P = { leap: [0.6, 1, 0.5][f], jaw: [1.2, 0.2, 0][f], head: -0.3, legs: { fn: [6, 3], ff: [6, 3], bn: [-6, 0], bf: [-6, 0] } };
    if (nm === "rec") P = { crouch: 0.4 * (1 - t), jaw: 0.3 };
    if (nm === "laugh") P = { head: [-0.6, -0.3, -0.6, -0.3][f], jaw: [1, 0.4, 1, 0.4][f], bob: [0, 1, 0, 1][f] };
    if (nm === "hurt") P = { hurt: f === 0, head: 0.4, jaw: 1, crouch: 0.4 };
    return hyenaFrame(P);
  },
};

// ════ 유리턱 개미 ════ 녹슨 붉은빛 키틴 · 머리·가슴·배 세 마디 · 번개유리로 된 거대한 큰턱 · 꺾인 더듬이 · 다리 여섯
//   p: ph · jaw · rear · hurt
const ANK = 0.72;
const ANT = mat(ramp(0x8a3a24), { tex: "metal", amp: 0.6, spec: 0.6 }), ANTF = mat(rampF(0x6a2a1a), { tex: "metal", amp: 0.5 });
function antFrame(p = {}) {
  const W = 72, H = 44, G = H - 1, S = sculpt(W, H, { k: ANK, ax: 34 });
  const ph = p.ph ?? 0, jw = p.jaw ?? 0, rr = p.rear ?? 0, cx = 32, by = G - 11 - rr * 2;
  const legs = (far) => { for (let k = 0; k < 3; k++) { const r0 = [cx - 2 + k * 4, by + 2], a = Math.sin(ph + k * 2.1 + (far ? 3 : 0)) * 3, kn = [cx - 8 + k * 9 + a, by - 4], ft = [cx - 12 + k * 12 + a * 1.4, G - 0.5]; S.add(U(capF(r0, kn, 1, 0.8), capF(kn, ft, 0.8, 0.5)), far ? ANTF : ANT, { z: far ? -2 : 5, h: 0.7 }); } };
  legs(1);
  // 배 (뒤 큰 마디) · 허리 · 가슴
  S.add(ellR(cx - 14, by - 1 - rr * 2, 10, 7, -0.2 - rr * 0.3), ANT, { z: 1, h: 6 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 20 + k * 5, by - 7], [cx - 22 + k * 5, by + 4], 0.4), 0.6);
  S.add(ellR(cx - 4, by, 2.4, 2), ANTF, { z: 1.5, h: 1.6 });
  S.add(U(ellR(cx + 3, by - 2, 6, 4), ellR(cx + 6, by - 4, 3.6, 3)), ANT, { z: 2, h: 4 });
  // 머리 + 유리 큰턱 + 더듬이
  const hx = cx + 14, hy = by - 4 - rr * 3;
  S.add(ellR(hx, hy, 5.4, 4.6), ANT, { z: 3, h: 4 });
  !p.hurt && S.decal(hx + 1.6, hy - 1.4, 0x101010).decal(hx + 2, hy - 1.8, 0xa0e0ff);
  for (const [d, z] of [[-1, 2.8], [1, 4]]) { const r0 = [hx + 4, hy + 1 + d * 0.6], a = 0.15 + d * (0.25 + jw * 0.35); shard(S, r0, pol(r0, a, 10), 1.8, d + 1, { z }); S.add(polyF([pol(r0, a, 9), pol(pol(r0, a, 10), a - d * 1.4, 3), pol(r0, a, 6)]), GLX[d + 1], { z, h: 0.8, prof: "sharp" }); }
  for (const [d, z] of [[0, 2.6], [2, 4.2]]) S.add(U(capF([hx + 1, hy - 3], [hx + 2 + d, hy - 10], 0.5), capF([hx + 2 + d, hy - 10], [hx + 9 + d, hy - 12 + rr * 2], 0.45, 0.3)), ANTF, { z, h: 0.4 });
  legs(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxAnt = {
  fw: Math.round(72 * ANK), fh: Math.round(44 * ANK), w: 22, h: 12,
  anims: { idle: [4, 6], move: [6, 14], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.3, jaw: 0.2 + Math.sin(ph) * 0.1 };
    if (nm === "move") P = { ph: ph, jaw: 0.2 };
    if (nm === "wind") P = { rear: t, jaw: 1 * t };
    if (nm === "atk") P = { rear: 0.3, jaw: [0, -0.3, 0.2][f] };
    if (nm === "rec") P = { jaw: 0.3 * t };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.5, jaw: 0.8 };
    return antFrame(P);
  },
};

// ════ 유리혹 낙타 ════ 들개처럼 사나워진 단봉낙타 · 혹 위로 번개유리 결정이 솟았다 · 낡은 안장 담요 조각 · 울퉁불퉁 무릎 ·
//   녹은 유리를 침처럼 뱉는다
//   p: legs · bob · neck(뒤로 젖힘) · spit · hurt
const CMK = 0.72;
const CAM = mat(ramp(0xc8a070), { tex: "fur", amp: 0.9, dir: 0.4 }), CAMF = mat(rampF(0xa48058), { tex: "fur", amp: 0.8, dir: 0.4 }), CAMD = mat(ramp(0x7a5a3a), { tex: "fur", amp: 1 });
function camelFrame(p = {}) {
  const W = 120, H = 102, G = H - 1, S = sculpt(W, H, { k: CMK, ax: 54 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, nk = p.neck ?? 0, cx = 50;
  const lgf = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 2 : -1), G - 1.5 - o[1]], kn = ik(sh, ft, 22, 22, front ? -1 : 1), M0 = far ? CAMF : CAM;
    S.add(U(capF(sh, kn, far ? 4.6 : 5.4, 2.6), capF(kn, ft, 2.2, 2)), M0, { z: far ? -3 : 5, h: 3 });
    S.add(ellR(kn[0], kn[1], 3.2, 3), CAMD, { z: far ? -2.9 : 5.1, h: 2 });
    S.add(ellR(ft[0] + 2, ft[1] - 0.6, 4, 1.8), CAMD, { z: far ? -2.8 : 5.2, h: 1.4 });
  };
  lgf([cx + 14, 54 + b], lg.ff, 1, 1), lgf([cx - 18, 54 + b], lg.bf, 1, 0);
  S.add(U(capF([cx - 26, 46 + b], [cx - 30, 62 + b], 1.6, 1)), CAMD, { z: 0, h: 1 });
  // 몸 + 혹 + 유리 결정
  S.add(U(ellR(cx - 2, 48 + b, 26, 13), ellR(cx - 4, 36 + b, 15, 12)), CAM, { z: 1, h: 12 });
  for (let k = 0; k < 6; k++) { const x = cx - 12 + k * 4.6, y = 26 + b + Math.abs(k - 2.5) * 1.6; shard(S, [x, y + 2], [x + (k - 2.5) * 1.2, y - 8 - ((k * 3) % 5)], 2.4 - (k % 2) * 0.6, k, { lift: 1.2 }); }
  // 안장 담요 조각
  S.add(polyF([[cx - 20, 38 + b], [cx + 10, 38 + b], [cx + 14, 54 + b], [cx + 6, 52 + b], [cx - 2, 56 + b], [cx - 10, 52 + b], [cx - 22, 54 + b]]), mat(ramp(0x8a3a3a), { tex: "cloth", amp: 1 }), { lift: 1, h: 2 });
  for (let k = 0; k < 4; k++) S.add(capF([cx - 20 + k * 2, 41 + b + k * 3.6], [cx + 10 + k, 41 + b + k * 3.6], 0.6), mat(ramp(0xd8b060)), { on: 1, lift: 0.3, h: 0.3 });
  // 목 (앞으로 굽은 긴 목) + 머리
  const n0 = [cx + 20, 44 + b], n1 = [cx + 30 - nk * 4, 34 + b + nk * 2], hd = [cx + 32 - nk * 8, 18 + b + nk * 2];
  S.add(U(capF(n0, n1, 7, 5.4), capF(n1, hd, 5.4, 4)), CAM, { z: 2, h: 5 });
  S.add(capF(lerp(n0, n1, 0.2), lerp(n1, hd, 0.6), 1.6), CAMD, { on: 1, lift: 0.3, h: 0.4 });
  S.add(U(ellR(hd[0], hd[1], 5.4, 4.6), capF([hd[0] + 2, hd[1]], [hd[0] + 11, hd[1] + 3], 3.6, 2.6)), CAM, { z: 3, h: 4 });
  S.add(capF([hd[0] + 3, hd[1] + 4 + (p.spit ? 1 : 0)], [hd[0] + 10, hd[1] + 5 + (p.spit ? 2.4 : 0)], 1.6, 1.2), CAMF, { z: 2.9, h: 1.4 });
  S.add(polyF([[hd[0] - 3, hd[1] - 3], [hd[0] - 5, hd[1] - 7], [hd[0] - 1, hd[1] - 4]]), CAMD, { z: 3.1, h: 1 });
  S.add(ellR(hd[0] + 10, hd[1] + 1.4, 0.8, 0.6), DARK, { lift: 0.6, h: 0.3 });
  !p.hurt && S.decal(hd[0] + 1.6, hd[1] - 1.4, 0x1a1210).decal(hd[0] + 2.4, hd[1] - 2.2, 0x6a4a30);
  lgf([cx + 16, 55 + b], lg.fn, 0, 1), lgf([cx - 16, 55 + b], lg.bn, 0, 0);
  const C = S.render({ rim: !0 });
  if (p.spit) { const P = toPx(W, H, CMK, 54); for (let k = 0; k < 7; k++) { const q = P(hd[0] + 13 + k * 2.4, hd[1] + 5 + k * 0.4); C.px(q[0], q[1], k % 2 ? 0xffc060 : 0xff8a30); } }
  return fin(C, p);
}
export const pxCamel = {
  fw: Math.round(120 * CMK), fh: Math.round(102 * CMK), w: 34, h: 40,
  anims: { idle: [4, 4], move: [6, 8], wind: [3, 8, !1], atk: [4, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") P = { legs: gait4(f, n, 7, 3), bob: Math.cos(ph * 2) * 1 };
    if (nm === "wind") P = { neck: t };
    if (nm === "atk") P = { neck: [0.6, -0.4, -0.4, 0][f], spit: f === 1 || f === 2 };
    if (nm === "rec") P = { neck: 0 };
    if (nm === "hurt") P = { hurt: f === 0, neck: 0.6 };
    return camelFrame(P);
  },
};

// ════ [정예] 번개 코뿔소 ════ 두꺼운 회색 가죽 주름 · 갑옷 같은 어깨 판 · 번개유리로 자라난 두 뿔에서 전기가 튄다 · 등뼈 따라 유리 가시
//   p: legs · bob · head(숙임) · spark · hurt
const RHK = 0.72;
const RHN = mat(ramp(0x7a7672), { tex: "skin", amp: 1.1, spec: 0.3 }), RHNF = mat(rampF(0x625e5a), { tex: "skin", amp: 1 });
function rhinoFrame(p = {}) {
  const W = 176, H = 98, G = H - 1, S = sculpt(W, H, { k: RHK, ax: 78 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd0 = p.head ?? 0, cx = 72;
  const lgf = (sh, o, far) => { const ft = [sh[0] + o[0], G - 1 - o[1]], kn = [L(sh[0], ft[0], 0.5) + 2, L(sh[1], ft[1], 0.5)]; S.add(U(capF(sh, kn, 9, 7), capF(kn, ft, 7, 6.4)), far ? RHNF : RHN, { z: far ? -3 : 6, h: 6 }); S.add(ellR(ft[0] + 2, ft[1] - 2, 8, 2.6), far ? RHNF : RHN, { z: far ? -2.9 : 6.1, h: 2 }); for (const d of [-3, 1, 5]) S.add(ellR(ft[0] + 3 + d, ft[1] - 1, 1.6, 1.2), mat(ramp(0x4a4642)), { z: far ? -2.8 : 6.2, h: 0.6 }); };
  lgf([cx + 22, 66 + b], lg.ff, 1), lgf([cx - 34, 66 + b], lg.bf, 1);
  S.add(capF([cx - 56, 46 + b], [cx - 62, 58 + b], 2, 1.2), RHN, { z: 0, h: 1.2 });
  S.add(U(ellR(cx - 8, 52 + b, 48, 24), ellR(cx - 40, 50 + b, 20, 22), ellR(cx + 24, 46 + b, 18, 22)), RHN, { z: 1, h: 18 });
  // 가죽 주름 · 어깨 판
  for (const x of [cx + 8, cx - 24]) S.carve(capF([x, 30 + b], [x - 4, 72 + b], 0.8), 1.2);
  S.carve(capF([cx - 52, 52 + b], [cx + 30, 72 + b], 0.6), 0.6);
  S.add(U(ellR(cx + 14, 40 + b, 14, 12)), RHN, { lift: 1.2, h: 3 });
  S.carve(minus(ellR(cx + 14, 40 + b, 14, 12), ellR(cx + 14, 40 + b, 12.6, 10.6)), 0.8);
  for (let k = 0; k < 5; k++) S.add(ellR(cx + 8 + k * 3, 34 + b + k * 2.6, 1.4, 1.2), mat(ramp(0x9a9690)), { on: 1, lift: 0.4, h: 0.4 });
  // 등뼈 유리 가시
  for (let k = 0; k < 8; k++) { const x = cx - 40 + k * 9, y = 28 + b - Math.sin((k / 7) * Math.PI) * 4; shard(S, [x, y + 3], [x - 2, y - 7 - (k % 3) * 3], 2.6, k, { lift: 1.4 }); }
  // 머리 (숙이면 뿔이 앞으로) + 뿔 둘
  const hx = cx + 44 + hd0 * 4, hy = 50 + b + hd0 * 6, ha = hd0 * 0.4;
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  S.add(capF([cx + 30, 46 + b], [hx - 4, hy - 2], 15, 12), RHN, { z: 2, h: 11 });
  S.add(U(ellR(...R(hx, hy), 13, 11), capF(R(hx + 4, hy + 2), R(hx + 22, hy + 6), 9, 7)), RHN, { z: 3, h: 9 });
  S.add(capF(R(hx + 14, hy + 9), R(hx + 22, hy + 9), 2.4, 1.6), RHNF, { z: 3.2, h: 1.4 });
  S.add(polyF([R(hx - 6, hy - 10), R(hx - 10, hy - 20), R(hx - 2, hy - 12)]), RHN, { z: 3.4, h: 2 });
  for (const [a, l, w, k] of [[-0.95, 22, 4.6, 0], [-1.2, 12, 3, 1]]) { const r0 = R(hx + 17 - k * 9, hy - 1 - k * 2); shard(S, r0, pol(r0, a + ha, l), w, k, { z: 4, h: w }); S.add(polyF([pol(r0, a + ha + 1.57, w * 0.4), pol(r0, a + ha, l * 0.85), pol(r0, a + ha - 1.57, w * 0.3)]), FUL, { z: 4.1, h: 1, prof: "sharp" }); }
  for (let k = 0; k < 4; k++) S.carve(capF(R(hx - 2 + k * 3, hy + 2), R(hx - 4 + k * 3, hy + 8), 0.5), 0.8);
  !p.hurt && S.decal(...R(hx + 4, hy - 2), 0x101010).decal(...R(hx + 4.4, hy - 2.6), 0xa0e0ff);
  lgf([cx + 24, 68 + b], lg.fn, 0), lgf([cx - 32, 68 + b], lg.bn, 0);
  const C = S.render({ rim: !0 });
  if (p.spark) { const P = toPx(W, H, RHK, 78), tip = pol(R(hx + 17, hy - 1), -0.95 + ha, 22); arc(C, P, tip, [tip[0] + 10, tip[1] - 12], 4, p.spark); arc(C, P, tip, [tip[0] - 8, tip[1] - 14], 3, p.spark + 2); }
  return fin(C, p);
}
export const pxRhino = {
  fw: Math.round(176 * RHK), fh: Math.round(98 * RHK), w: 64, h: 44,
  anims: { idle: [4, 3], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], charge: [4, 12], storm: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.8, spark: f % 2 ? f + 1 : 0 };
    if (nm === "move") P = { legs: gait4(f, n, 6, 2.4), bob: Math.cos(ph * 2) * 1.2 };
    if (nm === "charge") P = { legs: gait4(f, n, 11, 4), bob: Math.cos(ph * 2) * 2, head: 0.8, spark: f + 1 };
    if (nm === "wind") P = { head: -0.4 * t, spark: f + 1 };
    if (nm === "atk") P = { head: [0.6, 1.2, 1][f], spark: f + 1 };
    if (nm === "rec") P = { head: 1 - t };
    if (nm === "storm") P = { head: -0.5, spark: f + 1, bob: [0, -2, 0, -2][f] };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.4 };
    return rhinoFrame(P);
  },
};

// ════ 번개 구슬 ════ 흰 번개가 뭉친 구슬 · 둘레를 도는 유리 조각들 · 튀는 전기 가지
//   p: ph · charge · hurt
const BLK = 0.72;
function orbFrame(p = {}) {
  const W = 54, H = 54, S = sculpt(W, H, { k: BLK, ax: 27 });
  const ph = p.ph ?? 0, ch = p.charge ?? 0, cx = 27, cy = 27;
  for (let k = 0; k < 6; k++) { const a = ph + k * 1.05, r = 13 + (k % 2) * 3, q = [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5]; shard(S, pol(q, a, -3), pol(q, a, 4), 1.8, k, { z: Math.sin(a) * 3 }); }
  S.add(ellR(cx, cy, 9 + ch * 2, 9 + ch * 2), BOLT, { z: 0, h: 6 });
  S.add(ellR(cx - 1, cy - 1, 5 + ch, 5 + ch), BOLTW, { z: 0.5, h: 3 });
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, BLK, 27);
  for (let k = 0; k < 3 + Math.round(ch * 3); k++) { const a = ph * 2 + k * 2.1; arc(C, P, [cx, cy], [cx + Math.cos(a) * (14 + ch * 6), cy + Math.sin(a) * (14 + ch * 6)], 3, k + ph); }
  return fin(C, p);
}
export const pxOrb = {
  fw: Math.round(54 * BLK), fh: Math.round(54 * BLK), w: 14, h: 14, flying: !0,
  anims: { idle: [6, 12], move: [6, 14], wind: [4, 12, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph: ph * 2, charge: t };
    if (nm === "atk") P = { ph, charge: [1.4, 1, 0.6][f] };
    if (nm === "rec") P = { ph, charge: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return orbFrame(P);
  },
};

// ════ 해골 독수리 ════ 살이 다 떨어진 독수리 뼈대 · 갈고리 부리 두개골 · 갈비뼈 속에 박혀 빛나는 유리 조각 · 날개뼈에 남은 너덜한 검은 깃
//   p: flap · tilt · talon · hurt
const VTK = 0.72;
const VFE = mat(ramp(0x3a3430), { tex: "feather", amp: 1.1, dir: 0.3 }), VFEF = mat(rampF(0x2a2622), { tex: "feather", amp: 1, dir: 0.3 });
function vultureFrame(p = {}) {
  const W = 92, H = 66, S = sculpt(W, H, { k: VTK, ax: 44 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, tn = p.talon ?? 0, cx = 42, cy = 32;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 - (back ? 3 : 0), cy - 3), a = -Math.PI / 2 - 0.55 + (1 - up) * 1.0, el = pol(root, a + 0.25, 13), wr = pol(el, a - 0.15, 12);
    for (let k = 0; k < 6; k++) { const ak = a - 0.13 * k, base = lerp(el, wr, k / 6); if ((k * 7) % 5 === 1) continue; S.add(capF(base, pol(base, ak - 0.3, 18 - k * 1.6), 2.2, 0.6), back ? VFEF : VFE, { z: back ? -5 : 7, h: 0.8 }); }
    S.add(U(capF(root, el, 1.6, 1.2), capF(el, wr, 1.2, 1), capF(wr, pol(wr, a - 0.4, 8), 0.9, 0.5)), back ? BONEF : BONE, { z: back ? -4.8 : 7.2, h: 1 });
    S.add(ellR(el[0], el[1], 1.6, 1.6), back ? BONEF : BONE, { z: back ? -4.7 : 7.3, h: 1 });
  };
  wing(1);
  // 꼬리뼈 + 척추 + 골반
  S.add(U(capF(R(cx - 8, cy + 1), R(cx - 20, cy + 3), 1.2, 0.8)), BONE, { z: 0, h: 0.8 });
  for (let k = 0; k < 3; k++) S.add(capF(R(cx - 16, cy + 2), R(cx - 26, cy + k * 2), 1.6, 0.5), VFEF, { z: -0.5, h: 0.6 });
  S.add(ellR(...R(cx - 6, cy + 2), 4, 3), BONE, { z: 1, h: 2 });
  // 갈비뼈 우리 + 속 유리 조각
  shard(S, R(cx + 2, cy + 3), R(cx + 6, cy - 4), 3, 2, { z: 1.4 });
  S.add(ellR(...R(cx + 3, cy), 2, 2), mat(rampGlow(0xffd080)), { z: 1.5, h: 1 });
  for (let k = 0; k < 5; k++) { const x = cx - 3 + k * 3; S.add(U(capF(R(x, cy - 5), R(x + 1.6, cy + 1), 0.7), capF(R(x + 1.6, cy + 1), R(x + 0.6, cy + 6), 0.7, 0.5)), BONE, { z: 2 + k * 0.01, h: 0.8 }); }
  S.add(capF(R(cx - 6, cy - 5), R(cx + 12, cy - 6), 1.2), BONE, { z: 2.1, h: 1 });
  // 다리뼈 + 발톱
  for (const d of [-2, 2]) { const hp = R(cx + d, cy + 5), kn = R(cx + d - 3, cy + 11), ft = R(cx + d + 2 + tn * 6, cy + 17 + tn * 2); S.add(U(capF(hp, kn, 1), capF(kn, ft, 0.8)), BONE, { z: 3, h: 0.8 }); for (const e of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 1 + e - tn * 0.6, 3.6), 0.6, 0.2), DARK, { z: 3.1, h: 0.4 }); }
  // 긴 목뼈 + 해골 머리 (갈고리 부리)
  const n0 = R(cx + 12, cy - 6), hd = R(cx + 20, cy - 12);
  for (let k = 0; k < 4; k++) S.add(ellR(...lerp(n0, hd, k / 4), 1.6, 1.4), BONE, { z: 3.2, h: 1 });
  S.add(ellR(hd[0], hd[1], 4.4, 3.8), BONE, { z: 4, h: 3 });
  S.add(polyF([[hd[0] + 2, hd[1] - 2], [hd[0] + 10, hd[1] - 0.6], [hd[0] + 10.6, hd[1] + 3], [hd[0] + 8, hd[1] + 2], [hd[0] + 2, hd[1] + 1.6]]), BONE, { z: 4.2, h: 1.6 });
  S.add(ellR(hd[0] + 0.6, hd[1] - 0.6, 1.8, 1.8), DARK, { z: 4.3, lift: 0.1, h: 0.3 });
  S.add(ellR(hd[0] + 5.6, hd[1] - 0.2, 1, 0.7), DARK, { z: 4.3, lift: 0.1, h: 0.3 });
  !p.hurt && S.decal(hd[0] + 0.8, hd[1] - 0.6, 0xffd080);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxVulture = {
  fw: Math.round(92 * VTK), fh: Math.round(66 * VTK), w: 22, h: 16, flying: !0,
  anims: { idle: [4, 6], move: [4, 9], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, talon: 0.5 * t };
    if (nm === "atk") P = { flap: -0.7, tilt: 0.6, talon: 1 };
    if (nm === "rec") P = { flap: fl, talon: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return vultureFrame(P);
  },
};

// ════ 태양 렌즈 눈 ════ 놋쇠 테에 끼운 두꺼운 유리 렌즈 · 렌즈 너머로 크게 보이는 눈동자 · 테의 작은 날개판 넷 · 햇빛을 모아 태운다
//   p: ph · focus · look · hurt
const LNK = 0.72;
const BRASS = mat(ramp(0xb08a44), { tex: "metal", amp: 0.8, spec: 0.7 });
function lensFrame(p = {}) {
  const W = 66, H = 66, S = sculpt(W, H, { k: LNK, ax: 33 });
  const ph = p.ph ?? 0, fc = p.focus ?? 0, lk = p.look ?? 0, cx = 33, cy = 32;
  // 날개판 넷
  for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.78 + Math.sin(ph) * 0.1, r0 = pol([cx, cy], a, 15); S.add(polyF([pol(r0, a + 1.57, 3), pol(pol(r0, a, 9), a + 1.57, 1.4), pol(r0, a, 11), pol(pol(r0, a, 9), a - 1.57, 1.4), pol(r0, a - 1.57, 3)]), BRASS, { z: -1, h: 1.4, prof: "flat" }); }
  // 눈 (렌즈 뒤 · 크게 보임) + 렌즈 + 테
  S.add(ellR(cx, cy, 14, 14), mat(ramp(0xe8e0d0), { tex: "skin", amp: 0.4 }), { z: 0, h: 8 });
  S.add(ellR(cx + 3 + lk * 2, cy, 7.4, 7.4), mat(ramp(0xd8a040), { tex: "scale", amp: 0.6 }), { on: 1, lift: 0.4, h: 1 });
  S.add(ellR(cx + 3.4 + lk * 2, cy, 3.6 - fc * 1.6, 3.6 - fc * 1.6), DARK, { on: 1, lift: 0.6, h: 0.4 });
  for (let k = 0; k < 6; k++) S.add(capF(pol([cx + 3 + lk * 2, cy], k, 4), pol([cx + 3 + lk * 2, cy], k, 7), 0.3), mat(ramp(0x9a6a20)), { on: 1, lift: 0.5, h: 0.2 });
  for (const [a, r] of [[2.5, 13], [1.2, 12.6], [-0.4, 13]]) S.add(capF(pol([cx, cy], a, r - 3), pol([cx, cy], a + 0.25, r), 0.5), mat(ramp(0xb04a3a)), { on: 1, lift: 0.3, h: 0.2 });
  S.add(ellR(cx - 5, cy - 6, 4, 2.4, -0.6), mat(ramp(0xffffff)), { on: 1, lift: 2.4, h: 0.3 });
  S.add(capF([cx + 4, cy + 9], [cx + 9, cy + 5], 0.8), mat(ramp(0xe8f8ff)), { on: 1, lift: 2.4, h: 0.3 });
  S.add(minus(ellR(cx, cy, 14, 14), ellR(cx + 1, cy + 1, 12.6, 12.6)), mat(ramp(0x6a8a9a), { tex: "glass", spec: 0.8 }), { on: 1, lift: 0.8, h: 0.4 });
  S.add(minus(ellR(cx, cy, 17, 17), ellR(cx, cy, 14, 14)), BRASS, { z: 2, h: 3 });
  for (let k = 0; k < 12; k++) S.add(ellR(...pol([cx, cy], (k / 12) * T2, 15.6), 0.7, 0.7), mat(ramp(0xe0c070), { spec: 0.8 }), { z: 2.1, lift: 0.4, h: 0.4 });
  const C = S.render({ rim: !0 });
  if (fc > 0.5) { const P = toPx(W, H, LNK, 33); for (let k = 0; k < 6; k++) { const q = P(cx + 20 + k * 4, cy + k * 2); C.px(q[0], q[1], 0xfff0a0); C.px(q[0], q[1] + 1, 0xffd060); } }
  return fin(C, p);
}
export const pxLens = {
  fw: Math.round(66 * LNK), fh: Math.round(66 * LNK), w: 20, h: 20, flying: !0,
  anims: { idle: [6, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, look: Math.sin(ph) * 0.5 };
    if (nm === "wind") P = { ph, focus: t, look: 1 };
    if (nm === "atk") P = { ph, focus: 1, look: 1 };
    if (nm === "rec") P = { ph, focus: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, look: -1, focus: -0.6 };
    return lensFrame(P);
  },
};

// ════ [정예] 천둥새 ════ 폭풍빛 검회색 거대한 새 · 날개마다 흰 번개 무늬 깃 · 불꽃 튀는 관 깃 · 푸르게 빛나는 눈 · 검은 갈고리 발톱
//   p: flap · tilt · talon · jaw · storm · hurt
const TBK = 0.7;
const TBD = mat(ramp(0x3e4450), { tex: "feather", amp: 1, dir: 0.3, spec: 0.4 }), TBDF = mat(rampF(0x2e3440), { tex: "feather", amp: 0.9, dir: 0.3 }), TBW = mat(ramp(0xd8e8f0), { tex: "feather", amp: 0.7 });
function thunderFrame(p = {}) {
  const W = 156, H = 112, S = sculpt(W, H, { k: TBK, ax: 72 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, tn = p.talon ?? 0, jw = p.jaw ?? 0, cx = 70, cy = 60;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 - (back ? 5 : 0), cy - 8), a = -Math.PI / 2 - 0.5 + (1 - up) * 1.0;
    for (let k = 0; k < 10; k++) { const ak = a - 0.1 * k - 0.04, tip = pol(root, ak, 54 - k * 3.6); S.add(capF(pol(root, ak, 20), tip, 3.6, 1), back ? TBDF : TBD, { z: back ? -6 : 9 + k * 0.01, h: 1.2 }); !back && k % 2 === 0 && S.add(U(capF(pol(root, ak, 26), pol(pol(root, ak, 34), ak + 1.57, 1.4), 0.7), capF(pol(pol(root, ak, 34), ak + 1.57, 1.4), pol(root, ak, 44 - k * 3), 0.7)), TBW, { on: 1, lift: 0.3, h: 0.3 }); }
    S.add(ellR(...pol(root, a + 0.12, 15), 17, 9, a), back ? TBDF : TBD, { z: back ? -5.8 : 9.2, h: 3 });
    for (let k = 0; k < 5; k++) { const q = pol(pol(root, a + 0.12, 8 + k * 4), a + 1.57, 3); S.carve(minus(ellR(q[0], q[1], 3.4, 2.4, a), ellR(...pol(q, a + 1.57, -1.4), 3.4, 2.4, a)), 0.6); }
  };
  wing(1);
  // 꼬리 (부채꼴 · 흰 끝)
  for (const d of [-0.25, -0.08, 0.08, 0.25]) { const t0 = R(cx - 16, cy + 2), t1 = pol(t0, Math.PI + d + tl * 0.4, 26); S.add(capF(t0, t1, 3.4, 2.4), TBDF, { z: 0, h: 1.2 }); S.add(ellR(t1[0], t1[1], 2.6, 2), TBW, { z: 0.1, h: 0.8 }); }
  // 몸 + 가슴 깃 무늬
  S.add(U(ellR(...R(cx, cy), 22, 14), ellR(...R(cx + 12, cy - 4), 14, 13)), TBD, { z: 2, h: 13 });
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const q = R(cx + 4 + k * 4.4 + (r % 2) * 2, cy - 6 + r * 5); S.carve(minus(ellR(q[0], q[1] + 1, 2.6, 2), ellR(q[0], q[1] - 0.4, 2.6, 2)), 0.5); }
  // 발 (검은 발톱)
  for (const d of [-3, 3]) { const hp = R(cx + 6 + d, cy + 10), ft = R(cx + 12 + d + tn * 14, cy + 26 - tn * 6); S.add(capF(hp, lerp(hp, ft, 0.5), 4.4, 3), TBDF, { z: 3 + d * 0.1, h: 2.4 }); S.add(capF(lerp(hp, ft, 0.45), ft, 2, 1.6), mat(ramp(0x5a5a50), { tex: "scale" }), { z: 3.1 + d * 0.1, h: 1.4 }); for (const e of [-0.6, 0, 0.6]) { const c0 = pol(ft, 0.7 + e - tn * 0.6, 5); S.add(U(capF(ft, c0, 1, 0.7), capF(c0, pol(c0, 1.6 + e - tn * 0.5, 3), 0.7, 0.2)), DARK, { z: 3.2, h: 0.6 }); } }
  // 목 + 머리 + 관 깃 + 부리
  const hd = R(cx + 26, cy - 18);
  S.add(capF(R(cx + 12, cy - 6), hd, 10, 8), TBD, { z: 4, h: 8 });
  for (let k = 0; k < 5; k++) S.add(capF([hd[0] - 4, hd[1] - 6], pol([hd[0] - 4, hd[1] - 6], -2.4 - k * 0.18, 12 - k), 1.6, 0.4), k % 2 ? TBW : mat(ramp(0x6ac0f0), { tex: "feather" }), { z: 3.8, h: 1 });
  S.add(ellR(hd[0], hd[1], 8, 7), TBD, { z: 5, h: 6 });
  S.add(polyF([[hd[0] + 5, hd[1] - 3], [hd[0] + 15, hd[1] - 1], [hd[0] + 16, hd[1] + 3], [hd[0] + 13.6, hd[1] + 5.4], [hd[0] + 12, hd[1] + 2], [hd[0] + 5, hd[1] + 2]]), mat(ramp(0xc8c8b8), { spec: 0.6 }), { z: 6, h: 2.4 });
  S.add(polyF([[hd[0] + 5, hd[1] + 2.6 + jw], [hd[0] + 12, hd[1] + 3 + jw * 3], [hd[0] + 6, hd[1] + 5 + jw * 2]]), mat(ramp(0xa0a094)), { z: 5.8, h: 1.2 });
  S.add(capF([hd[0] - 1, hd[1] - 4], [hd[0] + 5, hd[1] - 3.4], 1.4, 1), TBDF, { z: 6.2, h: 1.4 });
  !p.hurt && S.decal(hd[0] + 2.6, hd[1] - 2, 0xa0e0ff).decal(hd[0] + 3.2, hd[1] - 2, 0xffffff);
  wing(0);
  const C = S.render({ rim: !0 });
  if (p.storm) { const P = toPx(W, H, TBK, 72); for (let k = 0; k < 4; k++) arc(C, P, R(cx + (k - 1.5) * 14, cy - 20), R(cx + (k - 1.5) * 24, cy - 44), 4, p.storm + k); }
  return fin(C, p);
}
export const pxThunderbird = {
  fw: Math.round(156 * TBK), fh: Math.round(112 * TBK), w: 40, h: 34, flying: !0,
  anims: { idle: [4, 7], move: [4, 9], wind: [4, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1], storm: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, talon: 0.4 * t, jaw: 0.6 * t };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.55, talon: 1, jaw: 1 };
    if (nm === "rec") P = { flap: fl, talon: 1 - t };
    if (nm === "storm") P = { flap: [1, 1, 0.8, 1][f], tilt: -0.3, jaw: 1, storm: f + 1 };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4, jaw: 1 };
    return thunderFrame(P);
  },
};

// ════ 유리병 소라게 ════ 버려진 초록 유리병을 집으로 쓰는 주황 소라게 · 병 속에 말린 배가 비친다 · 큰 집게발 하나 · 자루 눈
//   p: ph · claw · hide · hurt
const CBK = 0.72;
const CRB = mat(ramp(0xd8683a), { tex: "metal", amp: 0.6, spec: 0.5 }), CRBF = mat(rampF(0xb0522c), { tex: "metal", amp: 0.5 }), BOT = mat(ramp(0x5a9a6a, { hi: 0.6 }), { tex: "glass", amp: 0.4, spec: 0.95 });
function crabFrame(p = {}) {
  const W = 76, H = 54, G = H - 1, S = sculpt(W, H, { k: CBK, ax: 36 });
  const ph = p.ph ?? 0, cl = p.claw ?? 0, hd = p.hide ?? 0, cx = 34;
  // 다리 (먼 쪽)
  const legs = (far) => { for (let k = 0; k < 3; k++) { const r0 = [cx + 8 + k * 2 - hd * 4, G - 10], a = Math.sin(ph + k * 2 + (far ? 3 : 0)) * 2, kn = [cx + 12 + k * 5 + a - hd * 6, G - 14], ft = [cx + 14 + k * 6 + a * 1.4 - hd * 6, G - 0.5]; S.add(U(capF(r0, kn, 1.4, 1.1), capF(kn, ft, 1.1, 0.5)), far ? CRBF : CRB, { z: far ? -2 : 6, h: 1 }); } };
  legs(1);
  // 유리병 (뉘인 병 · 목은 뒤쪽) + 속에 비치는 배
  const by = G - 14;
  S.add(U(ellR(cx - 6, by, 18, 12), capF([cx - 22, by - 2], [cx - 32, by - 4], 5, 4)), BOT, { z: 1, h: 10 });
  S.add(capF([cx - 32, by - 4], [cx - 34, by - 4.4], 5.4), mat(ramp(0x4a7a5a), { tex: "glass", spec: 0.8 }), { z: 1.2, h: 4 });
  S.add(ellR(cx - 6, by + 2, 12, 7), mat(ramp(0xc87a50), { tex: "skin" }), { on: 1, lift: -0.6, h: 0.3 });
  for (let k = 0; k < 3; k++) S.carve(capF([cx - 14 + k * 6, by - 4], [cx - 16 + k * 6, by + 8], 0.4), 0.3);
  S.add(capF([cx - 20, by - 8], [cx + 4, by - 10], 1.2), mat(ramp(0xe8fff0)), { on: 1, lift: 1.4, h: 0.3 });
  S.add(ellR(cx - 24, by - 6, 1.6, 1), mat(ramp(0xe8fff0)), { on: 1, lift: 1.4, h: 0.3 });
  S.add(U(ellR(cx - 6, G - 2, 18, 2)), SAND, { z: 0.5, h: 1 });
  // 머리 · 자루 눈 · 집게발 (숨으면 병 속으로)
  if (hd < 0.9) {
    const hx = cx + 12 - hd * 10, hy = G - 14;
    S.add(ellR(hx, hy, 5, 4.4), CRB, { z: 3, h: 3.4 });
    for (const [d, z] of [[-1, 2.6], [1, 4]]) { const e0 = [hx + 2 + d, hy - 3], e1 = [hx + 3 + d * 1.6, hy - 9]; S.add(capF(e0, e1, 0.7, 0.5), CRB, { z, h: 0.5 }); S.add(ellR(e1[0], e1[1], 1.2, 1.2), DARK, { z: z + 0.1, h: 0.6 }); }
    const c0 = [hx + 3, hy + 2], c1 = [hx + 10 + cl * 4, hy - 2 - cl * 4];
    S.add(capF(c0, c1, 2.2, 2.6), CRB, { z: 5, h: 2 });
    S.add(U(ellR(c1[0] + 3, c1[1], 5, 3.6, -0.3)), CRB, { z: 5.2, h: 3.4 });
    S.add(polyF([[c1[0] + 4, c1[1] + 2], [c1[0] + 12, c1[1] + 2 + cl * 3], [c1[0] + 5, c1[1] + 4.4]]), CRBF, { z: 5.1, h: 1.2 });
    S.add(polyF([[c1[0] + 5, c1[1] - 2], [c1[0] + 12, c1[1] - 1 - cl * 2], [c1[0] + 7, c1[1] + 1]]), CRB, { z: 5.3, h: 1.2 });
    for (let k = 0; k < 4; k++) S.add(ellR(c1[0] + 1 + k * 2, c1[1] - 1.4, 0.5, 0.5), mat(ramp(0xf0a070)), { on: 1, lift: 0.3, h: 0.2 });
  }
  legs(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxBottleCrab = {
  fw: Math.round(76 * CBK), fh: Math.round(54 * CBK), w: 24, h: 18,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], hide: [3, 8, !1], out: [3, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { ph };
    if (nm === "wind") P = { claw: -0.6 * t };
    if (nm === "atk") P = { claw: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { claw: 1 - t };
    if (nm === "hide") P = { hide: t };
    if (nm === "out") P = { hide: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, hide: 0.4 };
    return crabFrame(P);
  },
};

// ════ 도굴꾼 해골 ════ 모래 무덤을 파던 도굴꾼의 해골 · 찌그러진 챙모자와 해진 목도리 · 등에 멘 전리품 자루 · 곡괭이 · 허리에 흔들리는 등불
//   p: legs · bob · sw(곡괭이 0~2) · hurt
const SKK = 0.72;
function skeletonFrame(p = {}) {
  const W = 104, H = 92, G = H - 1, S = sculpt(W, H, { k: SKK, ax: 38 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sw = p.sw ?? 0, cx = 36;
  const bone = (a, c, w, far, z) => { S.add(capF(a, c, w, w * 0.85), far ? BONEF : BONE, { z, h: w }); S.add(ellR(c[0], c[1], w * 1.2, w * 1.1), far ? BONEF : BONE, { z: z + 0.05, h: w }); };
  // 다리 (뼈) + 해진 장화
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) { const hp = [cx + d * 0.6, 58 + b], ft = [cx + d + o[0], G - 3 - o[1]], kn = [L(hp[0], ft[0], 0.5) + 2, L(hp[1], ft[1], 0.5)]; bone(hp, kn, 1.6, far, far ? -2 : 3); bone(kn, [ft[0], ft[1] - 4], 1.4, far, far ? -2 : 3); S.add(U(ellR(ft[0] + 3, ft[1], 6, 2.6), capF([ft[0], ft[1] - 6], [ft[0], ft[1]], 3.4)), far ? mat(rampF(0x4a3424), { tex: "leather" }) : LEATH, { z: far ? -1.8 : 3.2, h: 2 }); }
  // 전리품 자루 (등)
  S.add(ellR(cx - 12, 42 + b, 9, 11), mat(ramp(0x8a7a5a), { tex: "cloth", amp: 1.1 }), { z: -3, h: 7 });
  S.add(capF([cx - 12, 30 + b], [cx - 10, 33 + b], 2.4), mat(ramp(0x6a5a40), { tex: "cloth" }), { z: -2.9, h: 1.6 });
  S.add(polyF([[cx - 18, 36 + b], [cx - 14, 34 + b], [cx - 13, 38 + b]]), mat(ramp(0xe0c060), { spec: 0.8 }), { z: -2.8, h: 0.6 });
  // 먼 팔
  const shF = [cx - 4, 34 + b], hF = sw > 0.5 ? lerp([cx + 10, 30 + b], [cx + 16, 44 + b], Math.min(1, Math.max(0, sw - 1))) : [cx - 2, 54 + b];
  bone(shF, lerp(shF, hF, 0.5), 1.2, 1, -2); bone(lerp(shF, hF, 0.5), hF, 1, 1, -2);
  // 골반 · 척추 · 갈비뼈
  S.add(U(ellR(cx, 56 + b, 6, 3.4)), BONE, { z: 1, h: 2.6 });
  S.carve(ellR(cx + 1, 56 + b, 2, 1.4), 1);
  for (let k = 0; k < 6; k++) S.add(ellR(cx - 2 + k * 0.4, 52 + b - k * 3.4, 1.4, 1.3), BONE, { z: 1.2, h: 1 });
  for (let k = 0; k < 4; k++) S.add(U(capF([cx - 2, 36 + b + k * 3.4], [cx + 7, 38 + b + k * 3.4], 0.9), capF([cx + 7, 38 + b + k * 3.4], [cx + 6, 41 + b + k * 3], 0.8)), BONE, { z: 1.4 + k * 0.01, h: 0.9 });
  // 해진 목도리
  S.add(U(capF([cx - 4, 33 + b], [cx + 6, 33 + b], 2.6), polyF([[cx - 4, 33 + b], [cx - 12, 46 + b], [cx - 8, 46 + b], [cx - 1, 35 + b]])), mat(ramp(0x7a3a2a), { tex: "cloth", amp: 1.2 }), { z: 2, h: 2 });
  // 해골 + 찌그러진 챙모자
  const hx = cx + 3, hy = 24 + b;
  S.add(U(ellR(hx, hy, 6, 6.4), ellR(hx + 2.6, hy + 4.6, 3.6, 2.6)), BONE, { z: 3, h: 5 });
  S.add(ellR(hx + 3, hy, 1.8, 2), DARK, { z: 3.2, lift: 0.1, h: 0.3 });
  S.add(polyF([[hx + 5.6, hy + 2], [hx + 6.6, hy + 3.6], [hx + 5, hy + 3.6]]), DARK, { z: 3.2, lift: 0.1, h: 0.3 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx + 1 + k * 1.4, hy + 5.4], [hx + 1.2 + k * 1.4, hy + 7], 0.25), 0.6);
  !p.hurt && S.decal(hx + 3.2, hy + 0.2, 0xffd080);
  S.add(U(minus(ellR(hx - 1, hy - 3, 6.4, 5), (x, y) => y > hy - 2.4), capF([hx - 10, hy - 2], [hx + 9, hy - 3.4], 1.4, 1.2)), mat(ramp(0x6a5a44), { tex: "leather", amp: 1 }), { z: 4, h: 3 });
  S.carve(capF([hx - 3, hy - 7], [hx - 1, hy - 4], 0.6), 0.8);
  // 허리 등불
  const lp = [cx + 8, 60 + b + Math.sin(p.ph ?? 0) * 1];
  S.add(capF([cx + 6, 56 + b], lp, 0.3), IRON, { z: 3.4, h: 0.3 });
  S.add(U(polyF([[lp[0] - 2.4, lp[1]], [lp[0] + 2.4, lp[1]], [lp[0] + 2, lp[1] + 6], [lp[0] - 2, lp[1] + 6]])), IRON, { z: 3.5, h: 1.4 });
  S.add(ellR(lp[0], lp[1] + 3, 1.4, 2), mat(rampGlow(0xffc060)), { z: 3.6, h: 0.6 });
  // 가까운 팔 + 곡괭이
  const sh = [cx + 4, 34 + b], hd = sw <= 1 ? lerp([cx + 12, 52 + b], pol(sh, -1.9, 15), sw) : lerp(pol(sh, -1.9, 15), pol(sh, 0.4, 17), Math.min(1, sw - 1));
  const pa = sw <= 1 ? L(-1.3, -2.6, sw) : L(-2.6, 0.5, Math.min(1, sw - 1));
  bone(sh, lerp(sh, hd, 0.5), 1.3, 0, 7); bone(lerp(sh, hd, 0.5), hd, 1.1, 0, 7);
  const top = pol(hd, pa, 20);
  S.add(capF(pol(hd, pa, -6), top, 1, 0.9), WOOD, { z: 7.2, h: 0.9 });
  S.add(U(capF(top, pol(pol(top, pa + 1.57, 8), pa, -3), 1.4, 0.5), capF(top, pol(pol(top, pa - 1.57, 7), pa, -2), 1.4, 0.5)), IRON, { z: 7.3, h: 1.2 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxGraveSkel = {
  fw: Math.round(104 * SKK), fh: Math.round(92 * SKK), w: 14, h: 30,
  anims: { idle: [4, 5], move: [6, 8], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") { const g = gait2(f, n, 4, 2); P = { legs: g, bob: g.bob, ph }; }
    if (nm === "wind") P = { sw: t, ph };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 1, ph };
    if (nm === "rec") P = { sw: 2 + t, bob: 1 - t, ph };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, ph };
    return skeletonFrame(P);
  },
};

// ════ 낙타거미 ════ 모래빛 털이 성긴 몸 · 머리 앞에 쇠집게 같은 거대한 두 겹 턱 · 다리처럼 긴 더듬이 다리 · 빠른 다리 여섯
//   p: ph · jaw · rear · hurt
const SFK = 0.72;
const SOL = mat(ramp(0xc8a878), { tex: "fur", amp: 1, dir: 1.2 }), SOLF = mat(rampF(0xa08858), { tex: "fur", amp: 0.9, dir: 1.2 }), SOLJ = mat(ramp(0x6a4a34), { tex: "metal", amp: 0.6, spec: 0.6 });
function solifugeFrame(p = {}) {
  const W = 92, H = 50, G = H - 1, S = sculpt(W, H, { k: SFK, ax: 42 });
  const ph = p.ph ?? 0, jw = p.jaw ?? 0, rr = p.rear ?? 0, cx = 40, by = G - 12 - rr * 3;
  const legs = (far) => { for (let k = 0; k < 3; k++) { const r0 = [cx - 2 + k * 4, by + 2], a = Math.sin(ph + k * 2.1 + (far ? 3 : 0)) * 4, kn = [cx - 12 + k * 12 + a, by - 8], ft = [cx - 22 + k * 16 + a * 1.4, G - 0.5]; S.add(U(capF(r0, kn, 1.3, 1), capF(kn, ft, 1, 0.5)), far ? SOLF : SOL, { z: far ? -2 : 5, h: 0.8 }); } };
  legs(1);
  // 더듬이 다리 (긴 촉수 다리 둘)
  for (const [d, z] of [[-1, -1.5], [1, 5.5]]) { const r0 = [cx + 8, by], kn = [cx + 18 + d * 2, by - 10 - rr * 6], ft = [cx + 32 + d * 3, by - 4 - rr * 10]; S.add(U(capF(r0, kn, 1.3, 1.1), capF(kn, ft, 1.1, 0.9)), d < 0 ? SOLF : SOL, { z, h: 0.9 }); S.add(ellR(ft[0], ft[1], 1.4, 1.4), mat(ramp(0xe8d8b0)), { z: z + 0.1, h: 0.8 }); }
  // 배 (마디 줄무늬) + 가슴 · 머리
  S.add(ellR(cx - 14, by, 13, 7.4), SOL, { z: 1, h: 6 });
  for (let k = 0; k < 5; k++) S.carve(capF([cx - 24 + k * 4.4, by - 6], [cx - 25 + k * 4.4, by + 6], 0.4), 0.7);
  S.add(ellR(cx + 4, by - 2, 7, 6), SOL, { z: 2, h: 5 });
  !p.hurt && S.decal(cx + 7, by - 7, 0x101010).decal(cx + 8, by - 7, 0x101010);
  // 거대한 두 겹 턱
  for (const [d, z] of [[-1, 2.6], [1, 4]]) { const r0 = [cx + 9, by - 1 + d * 1.6], up = pol(r0, -0.2 - jw * 0.3, 13), lo = pol(r0, 0.25 + jw * 0.35, 12); S.add(U(capF(r0, up, 3.4, 1.4), capF(r0, lo, 2.8, 1.2)), SOLJ, { z, h: 2 }); for (const q of [0.5, 0.75]) { S.add(polyF([pol(lerp(r0, up, q), 1.5, 0.4), pol(lerp(r0, up, q), 1.8, 2.4), pol(lerp(r0, up, q), 0.3, 1)]), mat(ramp(0x2a1e18)), { z: z + 0.05, h: 0.4 }); } }
  legs(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxSolifuge = {
  fw: Math.round(92 * SFK), fh: Math.round(50 * SFK), w: 24, h: 14,
  anims: { idle: [4, 7], move: [6, 18], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: Math.sin(ph) * 0.4, jaw: 0.2 };
    if (nm === "move") P = { ph: ph, jaw: 0.2 };
    if (nm === "wind") P = { rear: t, jaw: t };
    if (nm === "atk") P = { rear: 0.3, jaw: [0, 1, 0][f] };
    if (nm === "rec") P = { jaw: 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, rear: 0.6, jaw: 1 };
    return solifugeFrame(P);
  },
};

// ════ [정예] 개미귀신 ════ 모래 깔때기 함정 속에 반쯤 묻힌 거대한 애벌레 · 털 난 둥근 회갈색 몸 · 머리에 달린 낫 같은 큰턱 둘 ·
//   함정 둘레로 모래가 흘러내린다
//   p: jaw · rise · fling · hurt
const ALK = 0.7;
const ALN = mat(ramp(0x7a6a54), { tex: "fur", amp: 1.2, dir: 1.1 }), ALNF = mat(rampF(0x5e5040), { tex: "fur", amp: 1.1, dir: 1.1 }), ALJ = mat(ramp(0x5a3a24), { tex: "metal", amp: 0.6, spec: 0.6 });
function antlionFrame(p = {}) {
  const W = 176, H = 92, G = H - 1, S = sculpt(W, H, { k: ALK, ax: 80 });
  const jw = p.jaw ?? 0, rs = p.rise ?? 0, fg = p.fling ?? 0, cx = 76, by = G - 18 - rs * 12;
  // 모래 깔때기 (둘레 둔덕 · 안쪽 경사 줄무늬)
  S.add(U(ellR(cx - 44, G - 4, 34, 7), ellR(cx + 50, G - 4, 34, 7)), SAND, { z: -2, h: 5 });
  S.add(polyF([[cx - 70, G - 6], [cx - 14, G], [cx + 20, G], [cx + 78, G - 6], [cx + 78, G], [cx - 70, G]]), SANDF, { z: -2.5, h: 1, prof: "flat" });
  for (let k = 0; k < 8; k++) S.carve(capF([cx - 66 + k * 18, G - 7], [cx - 40 + k * 14, G - 1], 0.5), 0.6);
  // 다리 (짧은 · 먼 쪽)
  for (let k = 0; k < 3; k++) S.add(U(capF([cx - 6 + k * 8, by + 8], [cx - 10 + k * 10, by + 16], 2.2, 1.6), capF([cx - 10 + k * 10, by + 16], [cx - 6 + k * 10, G - 2], 1.6, 1)), ALNF, { z: -1, h: 1.4 });
  // 몸 (둥근 털 배 · 마디) + 등 가시털
  S.add(U(ellR(cx - 16, by + 2, 34, 18), ellR(cx + 16, by - 2, 18, 14)), ALN, { z: 1, h: 16 });
  for (let k = 0; k < 6; k++) S.carve(capF([cx - 44 + k * 10, by - 14], [cx - 46 + k * 10, by + 16], 0.7), 0.8);
  for (let k = 0; k < 10; k++) { const x = cx - 44 + k * 7, y = by - 14 - Math.sin((k / 9) * Math.PI) * 4; S.add(polyF([[x - 1.6, y + 3], [x, y - 4], [x + 1.6, y + 3]]), ALNF, { lift: 1, h: 1, prof: "sharp" }); }
  for (const [x, y] of [[cx - 30, by - 4], [cx - 14, by - 8], [cx - 22, by + 6], [cx + 2, by + 2]]) S.add(ellR(x, y, 3, 2), mat(ramp(0x5a4a3a), { tex: "fur" }), { on: 1, lift: 0.3, h: 0.4 });
  // 머리 + 낫 큰턱 둘 + 눈
  const hx = cx + 34, hy = by - 2;
  S.add(ellR(hx, hy, 9, 8), ALN, { z: 3, h: 7 });
  for (const [d, z] of [[-1, 2.6], [1, 5]]) {
    const r0 = [hx + 6, hy + d * 2], a = d * (0.3 + jw * 0.5) - 0.05, m = pol(r0, a, 16), tip = pol(m, a - d * 1.2, 10);
    S.add(U(capF(r0, m, 3.4, 2.4), capF(m, tip, 2.4, 0.5)), ALJ, { z, h: 2 });
    for (let q = 0; q < 3; q++) S.add(polyF([pol(lerp(r0, m, 0.3 + q * 0.25), a + d * 1.57, -0.6), pol(lerp(r0, m, 0.3 + q * 0.25), a + d * 1.57, -3), pol(lerp(r0, m, 0.42 + q * 0.25), a + d * 1.57, -0.6)]), ALJ, { z: z + 0.05, h: 0.6, prof: "sharp" });
  }
  !p.hurt && [[hx + 2, hy - 4], [hx + 4, hy - 3], [hx + 3, hy - 5.4]].forEach(([x, y]) => S.decal(x, y, 0x101010));
  const C = S.render({ rim: !0 });
  if (fg) { const P = toPx(W, H, ALK, 80); for (let k = 0; k < 14; k++) { const q = P(hx + 6 + k * 2, hy - 8 - k * 2.4 + Math.sin(k) * 2); C.px(q[0], q[1], k % 2 ? 0xe0c898 : 0xc0a878); } }
  return fin(C, p);
}
export const pxAntlion = {
  fw: Math.round(176 * ALK), fh: Math.round(92 * ALK), w: 56, h: 30,
  anims: { idle: [4, 4], move: [6, 6], wind: [4, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], fling: [4, 12, !1], sink: [3, 8, !1], rise: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { jaw: 0.3 + Math.sin(ph) * 0.1 };
    if (nm === "move") P = { jaw: 0.3, rise: Math.sin(ph) * 0.2 };
    if (nm === "wind") P = { jaw: 1 * t, rise: 0.4 * t };
    if (nm === "atk") P = { jaw: [1, -0.3, -0.2][f], rise: 0.8 };
    if (nm === "rec") P = { jaw: 0.3, rise: 0.8 * (1 - t) };
    if (nm === "fling") P = { fling: f === 1 || f === 2, rise: [0, 0.3, 0.4, 0][f], jaw: 0.6 };
    if (nm === "sink") P = { rise: -t * 1.4, jaw: 0.2 };
    if (nm === "rise") P = { rise: -1.4 + t * 1.6, jaw: t };
    if (nm === "hurt") P = { hurt: f === 0, jaw: 1, rise: 0.2 };
    return antlionFrame(P);
  },
};
