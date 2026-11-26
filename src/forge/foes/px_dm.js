// 듄미스트 몬스터 12종 (조각 도구, 오른쪽을 본다) — 아지랑이 모래 바다 위 모래 흘리는 섬 · 해시계 오벨리스크 · 오아시스
//   아래 섬 줄: 신기루 여우 · 모래공 쇠똥구리 · 뿔 독사 · [정예] 오아시스 악어
//   가운데 줄: 모래 약탈자 · 메뚜기 떼 · 모래시계 정령 · [정예] 사암 스핑크스
//   위 줄: 신기루 정령 · 사막 날치 · 해시계 원반 · [정예] 신기루 진
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";
import { soldier, arm } from "./px_ah.js";

const SAND = mat(ramp(0xd8b880), { tex: "stone", amp: 0.9 }), SANDF = mat(rampF(0xb8986a), { tex: "stone", amp: 0.8 });
const SST = mat(ramp(0xc8a070), { tex: "stone", amp: 1 }), SSTF = mat(rampF(0xa07c54), { tex: "stone", amp: 0.9 });
const TURQ = mat(ramp(0x3aa0a0), { tex: "stone", amp: 0.5, spec: 0.5 }), TURQG = mat(rampGlow(0x50e0d0)), SUNG = mat(rampGlow(0xffd070));
const GOLD = mat(ramp(0xd0a848), { tex: "metal", amp: 0.7, spec: 0.7 }), BRONZE = mat(ramp(0xa0743a), { tex: "metal", amp: 0.8, spec: 0.6 });
const LEATH = mat(ramp(0x6a4a30), { tex: "leather", amp: 0.9 }), LEATHF = mat(rampF(0x52382a), { tex: "leather", amp: 0.8 });
const DARK = mat(ramp(0x1e1614)), BONE = mat(ramp(0xe0d4b8), { spec: 0.3 }), WHITE = mat(ramp(0xf0e8d8));
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
// 아지랑이: 줄마다 옆으로 흔들고(신기루), 세면 몇 줄을 비운다
function haze(C, amt, ph = 0) {
  if (!(amt > 0)) return C;
  const { W, H, d } = C, row = new Int32Array(W);
  for (let y = 0; y < H; y++) {
    const sh = Math.round(Math.sin(y * 0.7 + ph) * amt);
    if (amt > 1.4 && (y + Math.round(ph * 3)) % 3 === 0) { for (let x = 0; x < W; x++) d[y * W + x] = -1; continue; }
    if (!sh) continue;
    for (let x = 0; x < W; x++) row[x] = d[y * W + x];
    for (let x = 0; x < W; x++) { const sx = x - sh; d[y * W + x] = sx >= 0 && sx < W ? row[sx] : -1; }
  }
  return C;
}

// ════ 신기루 여우 ════ 모래빛 털 · 몸보다 큰 귀 · 검은 끝 꼬리 · 눈에서 주둥이로 흐르는 검은 줄 · 호박 눈 ·
//   순간이동할 때 아지랑이처럼 일렁이며 사라진다
//   p: legs · bob · crouch · leap · jaw · fade · hurt
const FXK = 0.72;
const FOX = mat(ramp(0xd8b078), { tex: "fur", amp: 0.9, dir: 0.2 }), FOXF = mat(rampF(0xb08e5c), { tex: "fur", amp: 0.8, dir: 0.2 }), FOXW = mat(ramp(0xf0e4c8), { tex: "fur", amp: 0.6 }), FOXD = mat(ramp(0x4a3424), { tex: "fur", amp: 0.8 });
function foxFrame(p = {}) {
  const W = 78, H = 56, G = H - 1, S = sculpt(W, H, { k: FXK, ax: 36 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, lp = p.leap ?? 0, jw = p.jaw ?? 0, cx = 34;
  const lgf = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 2 : -2), G - 1.5 - o[1] - lp * 5], kn = ik(sh, ft, 11, 11, front ? -1 : 1), M0 = far ? FOXF : FOX;
    S.add(U(capF(sh, kn, far ? 2.6 : 3, 1.8), capF(kn, ft, 1.6, 1.2)), M0, { z: far ? -3 : 5, h: 2 });
    S.add(ellR(ft[0] + 1.4, ft[1], 2.2, 1.2), front && !far ? FOXW : M0, { z: far ? -2.9 : 5.1, h: 1 });
  };
  lgf([cx + 10, 33 + b], lg.ff, 1, 1), lgf([cx - 10, 32 + b], lg.bf, 1, 0);
  // 꼬리 (풍성 · 검은 끝)
  const sw = Math.sin(p.ph ?? 0) * 2, t0 = [cx - 14, 28 + b], t1 = [cx - 24, 30 + b], t2 = [cx - 31, 37 + b + sw];
  S.add(U(capF(t0, t1, 2.6, 4.4), capF(t1, t2, 4.4, 3)), FOX, { z: 0, h: 3.4 });
  S.add(ellR(t2[0] - 0.6, t2[1] + 0.6, 3, 2.6), FOXD, { z: 0.1, h: 2.4 });
  // 몸 + 흰 배
  S.add(U(ellR(cx + 4, 28 + b, 11, 7.4), ellR(cx - 8, 27 + b, 9, 6.6)), FOX, { z: 1, h: 6 });
  S.add(ellR(cx + 1, 32.6 + b, 12, 2.4), FOXW, { on: 1, h: 0.5 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 10 + k * 5, 23 + b], [cx - 11 + k * 5, 30 + b], 0.4), 0.5);
  // 목 + 머리
  const hx = cx + 17, hy = 19 + b - lp * 2, ha = (p.head ?? 0) * 0.4;
  const R = (x, y) => { const c = Math.cos(ha), s = Math.sin(ha), dx = x - hx, dy = y - hy; return [hx + dx * c - dy * s, hy + dx * s + dy * c]; };
  S.add(capF([cx + 8, 26 + b], [hx - 2, hy + 3], 5.4, 4.4), FOX, { z: 2, h: 4 });
  S.add(ellR(cx + 11, 26 + b, 4, 4), FOXW, { on: 1, h: 0.6 });
  S.add(polyF([R(hx - 3, hy - 3), R(hx - 8, hy - 17), R(hx + 1, hy - 5)]), FOXF, { z: 3, h: 1.6 });
  S.add(ellR(...R(hx, hy), 5.8, 5.2), FOX, { z: 4, h: 4.4 });
  S.add(capF(R(hx + 3, hy + 1.2), R(hx + 11, hy + 2.6), 3, 1.3), FOX, { z: 5, h: 2.4 });
  S.add(capF(R(hx + 3, hy + 3 + jw), R(hx + 9, hy + 3.6 + jw * 2.6), 1.4, 0.8), FOXW, { z: 4.8, h: 1 });
  S.add(ellR(...R(hx + 2, hy + 3), 3.4, 2), FOXW, { on: 1, lift: 0.2, h: 0.4 });
  S.add(ellR(...R(hx + 11.2, hy + 2.2), 1.1, 0.9), DARK, { lift: 0.6, h: 0.5 });
  S.add(capF(R(hx + 3, hy - 0.2), R(hx + 8, hy + 1.8), 0.5), FOXD, { on: 1, lift: 0.3, h: 0.2 });
  S.add(polyF([R(hx, hy - 3.4), R(hx + 1, hy - 18), R(hx + 6, hy - 4)]), FOX, { z: 6, h: 1.8 });
  S.add(polyF([R(hx + 1.4, hy - 5), R(hx + 1.8, hy - 15), R(hx + 4.4, hy - 5)]), mat(ramp(0xc8907a), { tex: "skin" }), { z: 6.1, lift: 0.3, h: 0.6 });
  !p.hurt && S.decal(...R(hx + 3, hy - 1), 0x1a1210).decal(...R(hx + 2.4, hy - 1.4), 0xffc040);
  lgf([cx + 12, 34 + b], lg.fn, 0, 1), lgf([cx - 8, 33 + b], lg.bn, 0, 0);
  return fin(haze(S.render({ rim: !0 }), p.fade ?? 0, p.ph ?? 0), p);
}
export const pxFox = {
  fw: Math.round(78 * FXK), fh: Math.round(56 * FXK), w: 22, h: 16,
  anims: { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], blink: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4, ph };
    if (nm === "move") P = { legs: gait4(f, n, 5, 3), bob: Math.cos(ph * 2) * 0.6, ph };
    if (nm === "wind") P = { crouch: t, head: 0.3 * t, ph };
    if (nm === "atk") P = { leap: [0.6, 1, 0.4][f], jaw: [1, 0.3, 0][f], head: -0.2, legs: { fn: [5, 3], ff: [5, 3], bn: [-5, 0], bf: [-5, 0] }, ph };
    if (nm === "rec") P = { crouch: 0.4 * (1 - t), ph };
    if (nm === "blink") P = { fade: [0.8, 1.6, 2.4, 1][f], crouch: 0.4, ph: ph * 2 };
    if (nm === "hurt") P = { hurt: f === 0, head: 0.3, jaw: 0.8, crouch: 0.4, ph };
    return foxFrame(P);
  },
};

// ════ 모래공 쇠똥구리 ════ 푸른빛 도는 검은 등껍질 · 삽 모양 머리 · 뒷다리로 제 몸보다 큰 모래공을 굴린다(조약돌 박힘)
//   p: rot(공 회전) · push · ball(0~1 크기) · kick · hurt
const BTK = 0.72;
const BTL = mat(ramp(0x2a3040), { tex: "metal", amp: 0.6, spec: 0.75 }), BTLF = mat(rampF(0x20242e), { tex: "metal", amp: 0.5 }), BTLH = mat(ramp(0x4a7a9a), { spec: 0.8 });
function dungFrame(p = {}) {
  const W = 76, H = 54, G = H - 1, S = sculpt(W, H, { k: BTK, ax: 38 });
  const rot = p.rot ?? 0, pu = p.push ?? 0, bs = p.ball ?? 1, kk = p.kick ?? 0, cx = 42;
  const br = 14 * bs, bc = [cx - 16 - kk * 6, G - br];
  // 먼 다리
  const bx = cx + 6 + pu * 2, by = G - 13 + pu;
  for (const [r0, ft] of [[[bx + 6, by + 3], [bx + 13, G - 0.5]], [[bx + 1, by + 4], [bx + 3, G - 0.5]]]) S.add(U(capF(r0, lerp(r0, ft, 0.5), 1.2), capF(lerp(r0, ft, 0.5), ft, 1, 0.6)), BTLF, { z: -2, h: 0.8 });
  // 모래공 (조약돌 · 굴러간 자국)
  if (bs > 0.05) {
    S.add(ellR(bc[0], bc[1], br, br), SAND, { z: 0, h: br * 0.9 });
    for (let k = 0; k < 9; k++) { const a = rot + k * 0.7, rr = br * (0.3 + (k % 3) * 0.25), q = pol(bc, a, rr); S.add(ellR(q[0], q[1], 1.4, 1.2), k % 2 ? mat(ramp(0x9a8060), { tex: "stone" }) : mat(ramp(0xe8d0a0), { tex: "stone" }), { on: 1, lift: 0.4, h: 0.6 }); }
    for (let k = 0; k < 3; k++) S.carve(capF(pol(bc, rot + k * 2.1, br * 0.2), pol(bc, rot + k * 2.1 + 0.5, br * 0.8), 0.4), 0.6);
  }
  // 등껍질 (앞으로 숙인 몸) + 머리 삽
  const R = (x, y) => { const a = 0.35 + pu * 0.15, c = Math.cos(a), s = Math.sin(a), dx = x - bx, dy = y - by; return [bx + dx * c - dy * s, by + dx * s + dy * c]; };
  S.add(ellR(...R(bx - 2, by - 1), 11, 7.4, 0.35), BTL, { z: 2, h: 7 });
  S.carve(capF(R(bx - 12, by - 1), R(bx + 6, by - 3), 0.5), 0.9);
  for (const d of [-4, 0, 4]) S.add(capF(R(bx - 10 + d * 0.3, by - 4 + d * 0.8), R(bx + 4, by - 6 + d * 0.6), 0.5), BTLH, { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(...R(bx + 9, by + 1), 5, 4.4), BTL, { z: 3, h: 4 });
  S.add(polyF([R(bx + 11, by - 2), R(bx + 18, by + 1), R(bx + 17, by + 5), R(bx + 11, by + 5)]), BTL, { z: 3.2, h: 1.6 });
  for (const d of [0, 2, 4]) S.add(polyF([R(bx + 17, by + d), R(bx + 19.4, by + d + 1), R(bx + 17, by + d + 1.8)]), BTL, { z: 3.3, h: 0.6, prof: "sharp" });
  S.add(polyF([R(bx + 9, by - 3), R(bx + 12, by - 10), R(bx + 13, by - 3)]), BTL, { z: 3.4, h: 1, prof: "sharp" });
  !p.hurt && S.decal(...R(bx + 10, by), 0xa0c8e0);
  // 가까운 다리: 앞다리 둘은 땅, 뒷다리 둘은 공 위로
  for (const [r0, ft] of [[[bx + 8, by + 4], [bx + 15, G - 0.5]], [[bx + 2, by + 5], [bx + 5, G - 0.5]]]) { const m = [lerp(r0, ft, 0.5)[0] + 2, lerp(r0, ft, 0.5)[1]]; S.add(U(capF(r0, m, 1.4), capF(m, ft, 1.2, 0.6)), BTL, { z: 5, h: 1 }); for (const q of [0.4, 0.7]) S.add(capF(lerp(m, ft, q), pol(lerp(m, ft, q), 0, 1.6), 0.3), BTL, { z: 5.1, h: 0.3 }); }
  const kp = kk * 8;
  for (const [r0, ft] of [[[bx - 6, by + 2], [bc[0] + br * 0.6 + kp, bc[1] - br * 0.5]], [[bx - 8, by + 4], [bc[0] + br * 0.9 + kp, bc[1] + br * 0.1]]]) { const m = [lerp(r0, ft, 0.5)[0], lerp(r0, ft, 0.5)[1] - 4]; S.add(U(capF(r0, m, 1.5), capF(m, ft, 1.2, 0.6)), BTL, { z: 4, h: 1 }); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxDungBeetle = {
  fw: Math.round(76 * BTK), fh: Math.round(54 * BTK), w: 22, h: 18,
  anims: { idle: [4, 5], move: [6, 9], wind: [3, 8, !1], atk: [3, 14, !1], rec: [4, 6, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { rot: 0, push: Math.sin(ph) * 0.2 };
    if (nm === "move") P = { rot: -ph, push: 0.4 + Math.sin(ph * 2) * 0.3 };
    if (nm === "wind") P = { push: -0.6 * t, kick: -0.3 * t };
    if (nm === "atk") P = { push: 0.6, kick: [0.6, 1, 1][f], ball: [1, 0, 0][f] };
    if (nm === "rec") P = { ball: t, push: 0.2 };
    if (nm === "hurt") P = { hurt: f === 0, push: -0.4 };
    return dungFrame(P);
  },
};

// ════ 뿔 독사 ════ 모래빛 비늘에 갈색 얼룩 · 눈 위 뿔 비늘 · 세로 동공 · 옆으로 구불구불 미끄러지고 모래 속에 숨었다 솟아 문다
//   p: ph · rise(머리 들기) · strike · bur(묻힘 0~1) · tongue · hurt
const VPK = 0.72;
const VIP = mat(ramp(0xc8a878), { tex: "scale", amp: 1 }), VIPF = mat(rampF(0xa88a5c), { tex: "scale", amp: 0.9 }), VIPD = mat(ramp(0x7a5a3a), { tex: "scale", amp: 0.8 }), VIPB = mat(ramp(0xe8d8b0), { tex: "scale", amp: 0.5 });
function viperFrame(p = {}) {
  const W = 84, H = 48, G = H - 1, S = sculpt(W, H, { k: VPK, ax: 38 });
  const ph = p.ph ?? 0, rs = p.rise ?? 0, sk = p.strike ?? 0, bur = p.bur ?? 0, cx = 36, sink = bur * 9;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const head = Math.max(0, i - 9) / 5, x = cx - 26 + i * 3.4 + head * sk * 14, y = G - 3.4 - Math.sin(i * 0.65 + ph) * 2.6 * (1 - head) - head * head * rs * 16 + sink;
    pts.push([x, y]);
  }
  for (let i = 0; i < 14; i++) S.add(capF(pts[i], pts[i + 1], 1.2 + i * 0.24, 1.2 + (i + 1) * 0.24), i % 2 ? VIP : VIPF, { z: i * 0.05, h: 3.4 });
  for (let i = 1; i < 13; i += 2) S.add(ellR(pts[i][0], pts[i][1] - 0.8, 1.8 + i * 0.12, 1.4), VIPD, { on: 1, lift: 0.3, h: 0.3 });
  for (let i = 0; i < 14; i++) S.add(capF([pts[i][0], pts[i][1] + 1], [pts[i + 1][0], pts[i + 1][1] + 1], 0.6), VIPB, { on: 1, lift: 0.1, h: 0.2 });
  // 머리 (넓은 세모 · 뿔 비늘 · 세로 동공)
  const hd = pts[14], na = Math.atan2(hd[1] - pts[12][1], hd[0] - pts[12][0]);
  const H0 = pol(hd, na, 2.6);
  S.add(U(ellR(H0[0], H0[1], 5.6, 4.2, na), polyF([pol(H0, na + 1.57, 4.4), pol(H0, na, 7), pol(H0, na - 1.57, 4.4)])), VIP, { z: 2, h: 3.4 });
  S.add(ellR(...pol(H0, na - 1.57, 1.6), 2.4, 1.2, na), VIPD, { on: 1, lift: 0.3, h: 0.3 });
  const ey = pol(pol(H0, na, 1), na - 1.57, 1.6);
  S.add(polyF([pol(ey, na + 0.4, 1), pol(ey, na - 1.9, 4.2), pol(ey, na - 0.6, 1)]), VIPD, { z: 2.4, h: 1, prof: "sharp" });
  !p.hurt && S.decal(ey[0], ey[1] + 0.4, 0xe0c040).decal(ey[0] + 0.4, ey[1] + 0.4, 0x1a1210);
  if (p.tongue) { const tq = pol(H0, na, 6); S.add(U(capF(tq, pol(tq, na, 4), 0.35), capF(pol(tq, na, 4), pol(pol(tq, na, 4), na - 0.5, 2), 0.3), capF(pol(tq, na, 4), pol(pol(tq, na, 4), na + 0.5, 2), 0.3)), mat(ramp(0x8a2a3a)), { z: 2.6, h: 0.3 }); }
  if (sk > 0.5) for (const d of [-0.9, 0.9]) S.add(capF(pol(H0, na, 3), pol(pol(H0, na, 3.6), na + d + 1.57 * Math.sign(d) * 0.2, 2.6), 0.4, 0.2), BONE, { z: 2.7, h: 0.4 });
  // 모래 둔덕 (묻혔을 때)
  if (bur > 0.05) { S.add(U(ellR(cx - 6, G - 1, 30 * Math.min(1, bur * 1.4), 3 + bur * 3), ellR(cx + 18, G - 1, 10 * bur, 2 + bur * 2)), SAND, { z: 3, h: 3 }); for (let k = 0; k < 5; k++) S.carve(capF([cx - 26 + k * 10, G - 3 - bur * 2], [cx - 22 + k * 10, G - 2], 0.4), 0.6); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxViper = {
  fw: Math.round(84 * VPK), fh: Math.round(48 * VPK), w: 24, h: 12,
  anims: { idle: [4, 6], move: [6, 12], wind: [3, 9, !1], atk: [3, 18, !1], rec: [3, 9, !1], hurt: [2, 10, !1], hide: [3, 8, !1], rise: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: ph * 0.5, rise: 0.4, tongue: f % 2 };
    if (nm === "move") P = { ph: -ph, rise: 0.2 };
    if (nm === "wind") P = { rise: 0.4 + 0.6 * t, strike: -0.4 * t, tongue: 1 };
    if (nm === "atk") P = { rise: 0.6, strike: [0.8, 1.2, 1][f] };
    if (nm === "rec") P = { rise: 0.6 - 0.2 * t, strike: 1 - t };
    if (nm === "hide") P = { bur: t, rise: 0 };
    if (nm === "rise") P = { bur: 1 - t, rise: t, strike: 0.6 * t };
    if (nm === "hurt") P = { hurt: f === 0, rise: 0.2 };
    return viperFrame(P);
  },
};

// ════ [정예] 오아시스 악어 ════ 진흙 묻은 올리브빛 비늘 · 등에 두 줄 돌기 비늘 · 꼬리 위 볏 · 긴 주둥이와 맞물린 이빨 · 노란 눈 ·
//   모래 속에 몸을 숨기고 다가온다
//   p: legs · bob · jaw · lunge · sweep(꼬리) · bur · hurt
const CRK = 0.72;
const CRC = mat(ramp(0x6a6a44), { tex: "scale", amp: 1.1 }), CRCF = mat(rampF(0x52523a), { tex: "scale", amp: 1 }), CRCB = mat(ramp(0xc8b890), { tex: "scale", amp: 0.6 }), CRCD = mat(ramp(0x44442c), { tex: "scale", amp: 0.8, spec: 0.3 });
function crocFrame(p = {}) {
  const W = 172, H = 74, G = H - 1, S = sculpt(W, H, { k: CRK, ax: 80 });
  const b = p.bob ?? 0, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, jw = p.jaw ?? 0, lu = p.lunge ?? 0, swp = p.sweep ?? 0, bur = p.bur ?? 0, cx = 76 + lu * 6, by = G - 15 + b + bur * 8;
  const lgf = (sh, o, far, front) => {
    const el = [sh[0] + (front ? 3 : -4) + o[0] * 0.5, sh[1] + 5], ft = [sh[0] + o[0] + (front ? 6 : -2), G - 1.2 - o[1]], M0 = far ? CRCF : CRC;
    S.add(U(capF(sh, el, 4.4, 3.4), capF(el, ft, 3.4, 2.4)), M0, { z: far ? -3 : 6, h: 3 });
    for (const d of [-1.4, 0, 1.4, 2.8]) S.add(capF(ft, [ft[0] + 3 + d, ft[1] + 0.6], 0.8, 0.4), M0, { z: far ? -2.9 : 6.1, h: 0.5 });
  };
  lgf([cx + 18, by + 4], lg.ff, 1, 1), lgf([cx - 22, by + 4], lg.bf, 1, 0);
  // 꼬리 (가늘어지며 볏) — sweep 이면 위로 휘두름
  const tp = [[cx - 30, by - 1]];
  for (let k = 1; k <= 6; k++) tp.push([cx - 30 - k * 8.4, by + 1 + k * 1.6 - swp * k * k * 0.7]);
  for (let k = 0; k < 6; k++) { S.add(capF(tp[k], tp[k + 1], 8 - k * 1.2, 7 - k * 1.2), k % 2 ? CRC : CRCF, { z: 0.5 - k * 0.05, h: 5 - k * 0.6 }); S.add(polyF([[tp[k][0] - 2, tp[k][1] - (7 - k * 1.1)], [tp[k][0] - 4.2, tp[k][1] - (10 - k * 1.2)], [tp[k][0] - 6, tp[k][1] - (6.6 - k * 1.1)]]), CRCD, { z: 0.6, h: 1.2, prof: "sharp" }); }
  // 몸통 + 배 + 돌기 비늘 두 줄
  S.add(U(ellR(cx - 6, by, 30, 11), ellR(cx + 20, by - 1, 14, 9)), CRC, { z: 1, h: 9 });
  S.add(ellR(cx - 2, by + 7, 30, 3), CRCB, { on: 1, h: 0.6 });
  for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) { const x = cx - 30 + k * 6.6 + r * 3, y = by - 9.4 + r * 3 + Math.sin((k / 8) * Math.PI) * -1; S.add(ellR(x, y, 2.4, 1.8), CRCD, { lift: 0.8, h: 1.2 }); }
  for (let k = 0; k < 8; k++) S.carve(capF([cx - 30 + k * 7, by - 2], [cx - 31 + k * 7, by + 6], 0.4), 0.5);
  // 머리 (평평한 두개골 · 긴 주둥이 · 이빨 · 눈 돌기)
  const hx = cx + 34 + lu * 8, hy = by - 2;
  S.add(ellR(hx, hy, 10, 6.4), CRC, { z: 2, h: 5 });
  S.add(capF([hx + 4, hy + 0.6 + jw * -1.2], [hx + 32, hy + 2.4 - jw * 3], 5.4, 3.6), CRC, { z: 3, h: 3.4 });
  S.add(capF([hx + 2, hy + 4 + jw * 1.2], [hx + 30, hy + 5.4 + jw * 6], 4, 2.6), CRCF, { z: 2.5, h: 2.4 });
  if (jw > 0.3) S.add(polyF([[hx + 4, hy + 2.4], [hx + 31, hy + 1.2 - jw * 3], [hx + 29, hy + 4.6 + jw * 6], [hx + 4, hy + 5]]), mat(ramp(0xc89a7a), { tex: "skin" }), { z: 2.7, h: 0.6 });
  for (let k = 0; k < 7; k++) { const x = hx + 8 + k * 3.4, y0 = hy + 3.8 - jw * (k / 6) * 3, y1 = hy + 4.4 + jw * (k / 6) * 6; S.add(polyF([[x - 0.7, y0], [x + 0.7, y0], [x, y0 + 1.8]]), BONE, { z: 3.4, h: 0.4 }); S.add(polyF([[x + 1, y1], [x + 2.4, y1], [x + 1.7, y1 - 1.8]]), BONE, { z: 3.4, h: 0.4 }); }
  S.add(ellR(hx + 31, hy - 0.6 - jw * 3, 2, 1.4), CRC, { z: 3.5, h: 1.4 });
  S.add(ellR(hx + 2, hy - 5, 3, 2.4), CRC, { z: 3, h: 2.4 });
  !p.hurt && S.decal(hx + 3, hy - 5.4, 0xd8c040).decal(hx + 3, hy - 5, 0x1a1210);
  lgf([cx + 20, by + 5], lg.fn, 0, 1), lgf([cx - 20, by + 5], lg.bn, 0, 0);
  if (bur > 0.05) { S.add(U(ellR(cx, G - 1, 60 * Math.min(1, bur * 1.3), 2 + bur * 6), ellR(cx + 40, G - 1, 18 * bur, 2 + bur * 3)), SAND, { z: 8, h: 4 }); for (let k = 0; k < 9; k++) S.carve(capF([cx - 54 + k * 12, G - 3 - bur * 4], [cx - 50 + k * 12, G - 2], 0.5), 0.7); }
  return fin(S.render({ rim: !0 }), p);
}
export const pxCroc = {
  fw: Math.round(172 * CRK), fh: Math.round(74 * CRK), w: 64, h: 24,
  anims: { idle: [4, 4], move: [6, 8], wind: [4, 8, !1], atk: [3, 16, !1], rec: [3, 8, !1], hurt: [2, 10, !1], sweep: [4, 12, !1], hide: [3, 6, !1], rise: [3, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.5, jaw: 0.1 };
    if (nm === "move") P = { legs: gait4(f, n, 6, 2.4), bob: Math.cos(ph * 2) * 0.5 };
    if (nm === "wind") P = { jaw: 1.2 * t, lunge: -0.4 * t };
    if (nm === "atk") P = { jaw: [1.4, 0, 0][f], lunge: [1, 1.2, 1][f] };
    if (nm === "rec") P = { lunge: 1 - t, jaw: 0.2 };
    if (nm === "sweep") P = { sweep: [0.3, 1, 0.6, 0][f], lunge: -0.3 };
    if (nm === "hide") P = { bur: t };
    if (nm === "rise") P = { bur: 1 - t, jaw: t };
    if (nm === "hurt") P = { hurt: f === 0, jaw: 1, lunge: -0.3 };
    return crocFrame(P);
  },
};

// ════ 모래 약탈자 ════ 쪽빛 두건과 얼굴 가리개 사이로 눈만 · 햇볕에 그은 피부 · 크림색 겉옷과 쪽빛 조끼 · 붉은 허리띠와 단검 ·
//   감은 정강이 · 굽은 언월도
//   p: legs · bob · sw(0 내림 · 1 치켜듦 · 2 벰) · throw · hurt
const RDK = 0.72;
const ROBE = mat(ramp(0xd8ccb0), { tex: "cloth", amp: 1 }), ROBEF = mat(rampF(0xb0a488), { tex: "cloth", amp: 0.9 }), INDI = mat(ramp(0x3a4a7a), { tex: "cloth", amp: 0.9 }), INDIF = mat(rampF(0x2e3a62), { tex: "cloth", amp: 0.8 });
const SASH = mat(ramp(0xa83a2a), { tex: "cloth", amp: 0.9 }), SKIND = mat(ramp(0x9a6a4a), { tex: "skin", amp: 0.7 }), STEEL = mat(ramp(0x9a9ca0), { tex: "metal", amp: 0.8, spec: 0.7 });
function scimitar(S, hd, ba, z) {
  const up = [], lo = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8, c = pol(hd, ba, 4 + t * 28), bend = Math.sin(t * 1.4) * 5, w = 1.2 + t * 1.6 - (t > 0.85 ? (t - 0.85) * 14 : 0); const q = pol(c, ba + 1.57, bend); up.push(pol(q, ba - 1.57, Math.max(0.2, w * 0.4))); lo.push(pol(q, ba + 1.57, Math.max(0.2, w))); }
  S.add(polyF([...up, ...lo.reverse()]), STEEL, { z, h: 1.4, prof: "sharp" });
  S.add(capF(pol(hd, ba + 1.57, 3.4), pol(hd, ba - 1.57, 3.4), 0.9), GOLD, { z: z + 0.1, h: 0.8 });
  S.add(capF(hd, pol(hd, ba, -6), 1), LEATH, { z: z + 0.1, h: 0.8 });
  S.add(ellR(...pol(hd, ba, -7), 1.4, 1.4), GOLD, { z: z + 0.2, h: 1 });
}
function raiderFrame(p = {}) {
  const W = 104, H = 90, G = H - 1, S = sculpt(W, H, { k: RDK, ax: 36 });
  const b = p.bob ?? 0, sw = p.sw ?? 0, th = p.throw ?? 0, cx = 34;
  const sol = soldier(S, {
    cx, Y: 46, G, b, legs: p.legs, tabard: !1, body: ROBE, hurt: p.hurt,
    legO: { thigh: ROBE, thighF: ROBEF, shin: mat(ramp(0xb8a888), { tex: "cloth", amp: 1.2 }), shinF: mat(rampF(0x988868), { tex: "cloth" }), boot: LEATH, bootF: LEATHF, knee: !1 },
    head: (hx, hy) => {
      S.add(capF([hx - 5, hy - 2], [hx - 10, hy + 12], 2.4, 1.4), INDIF, { z: 2.5, h: 1.6 });
      S.add(ellR(hx + 2.6, hy + 1.6, 4, 4.6), SKIND, { z: 4, h: 3 });
      S.add(polyF([[hx - 2, hy + 1], [hx + 7.4, hy + 1.4], [hx + 7, hy + 6.6], [hx - 2, hy + 7]]), INDI, { z: 4.4, h: 2.4 });
      for (const y of [hy + 3, hy + 5]) S.carve(capF([hx, y], [hx + 6, y + 0.4], 0.3), 0.5);
      S.add(U(ellR(hx, hy - 2.4, 7.6, 6.2), ellR(hx - 1, hy - 5.6, 6, 4)), INDI, { z: 5, h: 5 });
      for (const [y, d] of [[hy - 4.6, 0.3], [hy - 2, -0.2], [hy + 0.2, 0.3]]) S.carve(capF([hx - 7, y + d * 4], [hx + 7, y], 0.4), 0.7);
      S.add(capF([hx - 6.6, hy - 1], [hx + 7.2, hy - 0.6], 1.4), mat(ramp(0x4e5e90), { tex: "cloth" }), { z: 5.2, h: 1.2 });
      !p.hurt && S.decal(hx + 4.6, hy + 0.4, 0x1a1210).decal(hx + 2.6, hy + 0.4, 0x1a1210).decal(hx + 5.4, hy + 0.4, 0x3a2418);
    },
  });
  // 쪽빛 조끼 + 붉은 허리띠 + 단검
  S.add(polyF([[cx - 9, 42 + b], [cx - 2, 41 + b], [cx - 1, 60 + b], [cx - 10, 62 + b]]), INDI, { z: 2, h: 7 });
  S.add(polyF([[cx + 5, 41 + b], [cx + 9, 42 + b], [cx + 9, 58 + b], [cx + 5, 60 + b]]), INDI, { z: 2, h: 7 });
  S.add(polyF([[cx - 10, 61 + b], [cx + 10, 61 + b], [cx + 10, 65 + b], [cx - 10, 65 + b]]), SASH, { z: 3.4, h: 2 });
  S.add(polyF([[cx - 8, 64 + b], [cx - 4, 64 + b], [cx - 6, 74 + b], [cx - 9, 72 + b]]), SASH, { z: 3.3, h: 1 });
  S.add(capF([cx + 6, 60 + b], [cx + 11, 68 + b], 1.2, 0.8), BRONZE, { z: 3.6, h: 1 });
  // 먼 팔 (모래 뿌리기) · 가까운 팔 (언월도)
  const hF = th > 0 ? pol(sol.S1, -0.3 + (1 - th) * 1.2, 18) : [cx - 2, 60 + b];
  arm(S, sol.S1, hF, 1, { z: th > 0 ? 6 : -1, M: ROBE, MF: ROBEF, bend: th > 0 ? -1 : 1 });
  const hd = sw <= 1 ? lerp(pol(sol.S0, 1.1, 15), pol(sol.S0, -1.8, 14), sw) : lerp(pol(sol.S0, -1.8, 14), pol(sol.S0, 0.5, 17), Math.min(1, sw - 1));
  const ba = sw <= 1 ? L(1.0, -2.6, sw) : L(-2.6, 0.6, Math.min(1, sw - 1));
  S.add(ellR(sol.S0[0], sol.S0[1] + 1, 5, 4, 0.3), ROBE, { z: 7, h: 3 });
  arm(S, sol.S0, hd, 0, { bend: 1, M: ROBE, MF: ROBEF });
  scimitar(S, hd, ba, 9);
  const C = S.render({ rim: !0 });
  if (th > 0.6) { const P = toPx(W, H, RDK, 36); for (let k = 0; k < 14; k++) { const q = P(hF[0] + 4 + k * 2.2, hF[1] - 2 + Math.sin(k * 1.7) * 4); C.px(q[0], q[1], k % 2 ? 0xe8d0a0 : 0xc8a878); } }
  return fin(C, p);
}
export const pxRaider = {
  fw: Math.round(104 * RDK), fh: Math.round(90 * RDK), w: 16, h: 30,
  anims: { idle: [4, 5], move: [6, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], throw: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 5, 2.4); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { sw: t, bob: -0.5 * t };
    if (nm === "atk") P = { sw: [1.5, 2, 2][f], bob: 1 };
    if (nm === "rec") P = { sw: 2 + t, bob: 1 - t };
    if (nm === "throw") P = { throw: [0.3, 1, 1, 0.5][f] };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, sw: 0.2 };
    return raiderFrame(P);
  },
};

// ════ 메뚜기 떼 ════ 모래빛 메뚜기 아홉 마리가 소용돌이치며 몰려다닌다 · 굵은 뒷다리 · 얼룩진 앞날개와 펼친 뒷날개
//   p: ph · tight(뭉침 0~1) · hurt
const LCK = 0.72;
const LOC = mat(ramp(0xc8a040), { tex: "scale", amp: 0.8, spec: 0.3 }), LOCF = mat(rampF(0x9a7a34), { tex: "scale", amp: 0.7 }), LOCD = mat(ramp(0x4a3420)), LWG = mat(ramp(0x9a845a, { hi: 0.4 }), { tex: "glass", amp: 0.6 });
function locust(S, c, a, s, wp, z) {
  const fw = pol(c, a, 5 * s), bk = pol(c, a, -5 * s), up = a - 1.57;
  S.add(polyF([pol(c, up, 1.6 * s), pol(pol(c, a, -7 * s), up, 2 + (1 + Math.sin(wp)) * 2.4 * s), pol(c, a, -7 * s)]), LWG, { z: z - 0.2, h: 0.4, prof: "flat" });
  S.add(capF(bk, fw, 1.4 * s, 1.6 * s), z > 0 ? LOC : LOCF, { z, h: 1.2 * s });
  S.add(ellR(...pol(fw, a, 1.2 * s), 1.6 * s, 1.5 * s), LOC, { z: z + 0.1, h: 1.2 * s });
  S.add(capF(pol(c, up, 0.6 * s), pol(pol(c, a, -6 * s), up, 1.8 * s), 0.8 * s, 0.5 * s), LOCD, { z: z + 0.2, h: 0.6 });
  const kn = pol(pol(c, a, -2 * s), up, 3.4 * s);
  S.add(U(capF(pol(c, a, -0.5 * s), kn, 1 * s, 0.7 * s), capF(kn, pol(pol(c, a, -6 * s), up, -1 * s), 0.5 * s, 0.3 * s)), LOCF, { z: z + 0.3, h: 0.6 });
  S.add(capF(pol(fw, a, 1.6 * s), pol(pol(fw, a, 6 * s), up, 3 * s), 0.3), LOCD, { z: z + 0.1, h: 0.2 });
}
function swarmFrame(p = {}) {
  const W = 76, H = 62, S = sculpt(W, H, { k: LCK, ax: 38 });
  const ph = p.ph ?? 0, tg = p.tight ?? 0, cx = 38, cy = 30, sp = 1 - tg * 0.55;
  const L9 = [];
  for (let k = 0; k < 7; k++) { const q = [cx + Math.cos(ph + k * 2.39) * (20 - (k % 3) * 3) * sp, cy + Math.sin(ph * 1.3 + k * 1.71) * (14 - (k % 2) * 3) * sp]; L9.push([q, Math.sin(ph * 1.3 + k * 1.71), k]); }
  L9.sort((A, B) => A[1] - B[1]);
  for (const [q, d, k] of L9) locust(S, q, -0.15 + Math.sin(ph + k) * 0.2 + tg * 0.3, 1.15 + (d + 1) * 0.15, ph * 4 + k, d * 3);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, LCK, 38);
  for (let k = 0; k < 10; k++) { const q = P(cx + Math.cos(ph * 1.7 + k * 1.3) * 26 * sp, cy + Math.sin(ph * 2.1 + k * 2.2) * 18 * sp); C.px(q[0], q[1], 0x6a5030); }
  return fin(C, p);
}
export const pxLocusts = {
  fw: Math.round(76 * LCK), fh: Math.round(62 * LCK), w: 28, h: 24, flying: !0,
  anims: { idle: [6, 10], move: [6, 12], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph: ph * 2, tight: t };
    if (nm === "atk") P = { ph: ph * 2, tight: 1 - t * 0.5 };
    if (nm === "rec") P = { ph, tight: 0.5 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, tight: -0.4 };
    return swarmFrame(P);
  },
};

// ════ 모래시계 정령 ════ 청록 새김이 박힌 놋쇠 틀 · 두 유리 구 속에서 모래가 흘러내린다 · 윗 뚜껑의 청록 외눈 · 기울며 시간을 늦춘다
//   p: tilt · sand(윗구 모래 0~1) · glow · hurt
const HGK = 0.72;
const GLS = mat(ramp(0xd8e0d8, { hi: 0.6 }), { tex: "glass", amp: 0.4, spec: 0.9 }), SNDM = mat(ramp(0xe0b870), { tex: "stone", amp: 0.6 });
function hourglassFrame(p = {}) {
  const W = 52, H = 70, S = sculpt(W, H, { k: HGK, ax: 26 });
  const tl = p.tilt ?? 0, sd = p.sand ?? 0.6, cx = 26, cy = 34;
  const R = (x, y) => { const c = Math.cos(tl), s = Math.sin(tl), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 뒤 기둥
  S.add(capF(R(cx, cy - 22), R(cx, cy + 22), 1.2), BRONZE, { z: -3, h: 1 });
  // 유리 (두 구 + 잘록한 목) + 모래
  S.add(U(ellR(...R(cx, cy - 11), 9, 10.4, tl), ellR(...R(cx, cy + 11), 9, 10.4, tl)), GLS, { z: 0, h: 6 });
  const lvl = cy - 16 + (1 - sd) * 14;
  S.add((x, y) => { const q = [cx + (x - cx) * Math.cos(-tl) - (y - cy) * Math.sin(-tl), cy + (x - cx) * Math.sin(-tl) + (y - cy) * Math.cos(-tl)]; return ((q[0] - cx) / 8) ** 2 + ((q[1] - (cy - 11)) / 9.4) ** 2 <= 1 && q[1] > lvl; }, SNDM, { z: 0.5, lift: -1, h: 4 });
  S.add(polyF([R(cx - 8, cy + 20), R(cx + 8, cy + 20), R(cx + 2, cy + 20 - (1 - sd) * 12 - 3), R(cx - 2, cy + 20 - (1 - sd) * 12 - 3)]), SNDM, { z: 0.5, h: 3 });
  S.add(capF(R(cx, cy - 1), R(cx, cy + 18 - (1 - sd) * 12), 0.5), mat(ramp(0xf0d090)), { z: 0.6, h: 0.5 });
  S.add(ellR(...R(cx - 4, cy - 15), 1.6, 3.4, tl), WHITE, { on: 1, lift: 1, h: 0.3 }).add(ellR(...R(cx - 4, cy + 7), 1.4, 3, tl), WHITE, { on: 1, lift: 1, h: 0.3 });
  // 앞 기둥 둘 (꼬인 놋쇠 · 청록 고리)
  for (const d of [-11, 11]) { S.add(capF(R(cx + d, cy - 22), R(cx + d, cy + 22), 1.4), BRONZE, { z: 3, h: 1.4 }); for (const y of [-12, 0, 12]) S.add(ellR(...R(cx + d, cy + y), 2, 1.2, tl), TURQ, { z: 3.1, h: 1 }); }
  // 위 · 아래 뚜껑 (새김 띠) + 외눈
  for (const [y, top] of [[cy - 24, 1], [cy + 24, 0]]) {
    S.add(U(ellR(...R(cx, y), 14, 3.4, tl), polyF([R(cx - 14, y), R(cx + 14, y), R(cx + 12, y + (top ? -3 : 3)), R(cx - 12, y + (top ? -3 : 3))])), BRONZE, { z: 4, h: 3 });
    for (let k = -3; k <= 3; k++) S.add(ellR(...R(cx + k * 3.6, y), 0.8, 0.8), TURQ, { on: 1, lift: 0.4, h: 0.3 });
  }
  S.add(ellR(...R(cx, cy - 29), 4, 3.4, tl), BRONZE, { z: 5, h: 2.6 });
  S.add(ellR(...R(cx, cy - 29), 2.4, 2.2, tl), p.glow ? TURQG : TURQ, { z: 5.2, h: 1.4 });
  !p.hurt && S.decal(...R(cx + 0.6, cy - 29.4), 0xffffff);
  S.add(polyF([R(cx - 2, cy + 27), R(cx + 2, cy + 27), R(cx, cy + 32)]), BRONZE, { z: 4, h: 1, prof: "sharp" });
  return fin(S.render({ rim: !0 }), p);
}
export const pxHourglass = {
  fw: Math.round(52 * HGK), fh: Math.round(70 * HGK), w: 16, h: 24, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { tilt: Math.sin(ph) * 0.06, sand: 0.4 + Math.sin(ph) * 0.2 };
    if (nm === "move") P = { tilt: 0.12 + Math.sin(ph) * 0.05, sand: 0.5 };
    if (nm === "wind") P = { tilt: -0.5 * t, sand: 0.6, glow: 1 };
    if (nm === "atk") P = { tilt: [0.4, 0.8, 0.6][f], sand: 0.3, glow: 1 };
    if (nm === "rec") P = { tilt: 0.6 * (1 - t), sand: 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, tilt: -0.3, sand: 0.5 };
    return hourglassFrame(P);
  },
};

// ════ [정예] 사암 스핑크스 ════ 깨어난 사암 사자 · 줄무늬 두건을 쓴 엄한 돌 얼굴과 땋은 턱수염 · 접힌 돌 날개 · 갈라진 틈마다 청록 빛 ·
//   큰 앞발
//   p: legs · bob · crouch · leap · beam · head · hurt
const SXK = 0.7;
function sphinxFrame(p = {}) {
  const W = 156, H = 120, G = H - 1, S = sculpt(W, H, { k: SXK, ax: 70 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 6, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, lp = p.leap ?? 0, bm = p.beam ?? 0, wu = p.wing ?? 0, cx = 66;
  const crack = (pts) => { for (let k = 0; k + 1 < pts.length; k++) S.add(capF(pts[k], pts[k + 1], 0.6), TURQG, { on: 1, lift: 0.2, h: 0.3 }); };
  const SSL = mat(ramp(0xdcb88a), { tex: "stone", amp: 0.6 });
  // 돌 날개: 덮깃 판 + 긴 첫째깃 (먼 쪽 · 가까운 쪽)
  const wing = (back) => {
    const root = [cx + 6 - (back ? 6 : 0), 54 + b], a = -Math.PI / 2 - 0.75 + wu * 0.35 + (back ? -0.12 : 0), M0 = back ? SSTF : SST;
    for (let k = 0; k < 8; k++) { const ak = a - 0.1 * k, tip = pol(root, ak, 44 - k * 3.2); S.add(polyF([pol(pol(root, ak, 16), ak + 1.57, 2.6), pol(tip, ak + 1.57, 1), tip, pol(pol(root, ak, 16), ak - 1.57, 1.4)]), back ? SSTF : k % 2 ? SST : SSL, { z: back ? -6 : 8 + k * 0.01, h: 1.6, prof: "flat" }); }
    S.add(ellR(...pol(root, a + 0.12, 13), 15, 8, a), M0, { z: back ? -5.8 : 8.3, h: 3 });
    for (let k = 0; k < 5; k++) { const q = pol(pol(root, a + 0.12, 6 + k * 4), a + 1.57, 3); S.carve(minus(ellR(q[0], q[1], 3.4, 2.4, a), ellR(...pol(q, a + 1.57, -1.6), 3.4, 2.4, a)), 0.6); }
    !back && crack([pol(root, a, 8), pol(root, a - 0.15, 18), pol(root, a - 0.05, 26)]);
  };
  const lgf = (sh, o, far, front) => {
    const ft = [sh[0] + o[0] + (front ? 4 : -2), G - 2 - o[1] - lp * 8], kn = ik(sh, ft, 18, 18, front ? -1 : 1), M0 = far ? SSTF : SST;
    S.add(U(capF(sh, kn, far ? 7 : 8, 5), capF(kn, ft, 4.6, 4)), M0, { z: far ? -4 : 6, h: 5 });
    S.add(U(ellR(ft[0] + 4, ft[1] - 1, 7, 3.4), ellR(ft[0], ft[1] - 3, 4.4, 3.4)), M0, { z: far ? -3.9 : 6.1, h: 3 });
    for (const d of [0, 2.4, 4.8]) S.carve(capF([ft[0] + 5 + d, ft[1] - 3], [ft[0] + 5.4 + d, ft[1] + 1.4], 0.4), 0.8);
  };
  wing(1);
  lgf([cx + 20, 82 + b], lg.ff, 1, 1), lgf([cx - 30, 80 + b], lg.bf, 1, 0);
  // 꼬리 (돌 · 술)
  S.add(U(capF([cx - 42, 70 + b], [cx - 54, 78 + b], 3, 2.4), capF([cx - 54, 78 + b], [cx - 58, 94 + b], 2.4, 1.8)), SST, { z: 0, h: 2 });
  S.add(ellR(cx - 58, 97 + b, 3.6, 4.4), SSTF, { z: 0.1, h: 2.4 });
  // 몸통 (엉덩이 · 통 · 가슴) + 배 + 갈비 · 근육 결
  S.add(U(ellR(cx - 30, 70 + b, 16, 15), ellR(cx - 6, 74 + b, 27, 13), ellR(cx + 18, 68 + b, 15, 17)), SST, { z: 1, h: 14 });
  S.add(ellR(cx - 4, 84 + b, 24, 3), SSL, { on: 1, h: 0.5 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 16 + k * 6, 66 + b], [cx - 18 + k * 6, 82 + b], 0.5), 0.6);
  S.carve(capF([cx - 40, 64 + b], [cx - 30, 80 + b], 0.6), 0.7);
  crack([[cx - 10, 64 + b], [cx - 6, 70 + b], [cx - 9, 76 + b], [cx - 4, 82 + b]]);
  // 머리: 두건(정수리 → 귀 뒤로 넓게 퍼져 어깨까지) + 사람 얼굴 옆모습 + 땋은 턱수염
  const hx = cx + 26, hy = 38 + b + (p.head ?? 0) * 4;
  S.add(polyF([[hx - 2, hy - 12], [hx + 8, hy - 13], [hx + 10, hy - 6], [hx + 5, hy + 2], [hx + 4, hy + 20], [hx - 10, hy + 26], [hx - 14, hy + 14], [hx - 8, hy - 4]]), SST, { z: 3, h: 7 });
  for (let k = 0; k < 7; k++) S.add(capF([hx - 13 + k * 0.6, hy - 8 + k * 4.4], [hx + 6, hy - 10 + k * 4.4], 1), k % 3 === 1 ? TURQ : SSTF, { on: 1, lift: 0.3, h: 0.3 });
  S.add(U(ellR(hx + 8, hy + 2, 7.4, 9.4)), SSL, { z: 5, h: 6 });
  S.add(U(ellR(hx + 4, hy - 8, 8.6, 5)), SST, { z: 5.3, h: 4 });
  for (let k = 0; k < 3; k++) S.add(capF([hx - 3, hy - 11 + k * 2.6], [hx + 12, hy - 9.6 + k * 2.6], 0.8), k === 1 ? TURQ : SSTF, { on: 1, lift: 0.3, h: 0.3 });
  S.add(capF([hx + 10, hy - 3], [hx + 15, hy - 2.4], 1.2), SSL, { z: 5.6, h: 1.4 });
  S.add(polyF([[hx + 13.6, hy - 2], [hx + 17, hy + 4], [hx + 14, hy + 4.6]]), SSL, { z: 5.8, h: 2.2 });
  S.add(ellR(hx + 14.4, hy + 7.4, 2.2, 1.3), SSL, { z: 5.7, h: 1.2 });
  S.carve(capF([hx + 12.6, hy + 7.4], [hx + 16, hy + 7.2], 0.4), 1, !1);
  S.add(ellR(hx + 13.4, hy + 10.4, 2.4, 1.8), SSL, { z: 5.6, h: 1.4 });
  S.add(capF([hx + 12.4, hy + 12], [hx + 12.6, hy + 22], 2, 1.8), SSTF, { z: 5.7, h: 1.6 });
  for (let k = 0; k < 4; k++) S.carve(capF([hx + 10.6, hy + 13.6 + k * 2.2], [hx + 14.4, hy + 13.6 + k * 2.2], 0.3), 0.6);
  S.carve(ellR(hx + 12.4, hy, 2, 1.2), 1.4, !1);
  S.carve(capF([hx + 6, hy - 1], [hx + 7, hy + 6], 0.4), 0.6);
  if (!p.hurt) S.decal(hx + 12.8, hy - 0.2, bm ? 0xa0fff0 : 0x50e0d0).decal(hx + 11.8, hy - 0.2, bm ? 0xffffff : 0x2a8a80);
  crack([[hx + 7, hy - 10], [hx + 8, hy - 5], [hx + 6.6, hy]]);
  lgf([cx + 22, 84 + b], lg.fn, 0, 1), lgf([cx - 28, 82 + b], lg.bn, 0, 0);
  wing(0);
  const C = S.render({ rim: !0 });
  if (bm > 0.5) { const P = toPx(W, H, SXK, 70); for (let k = 0; k < 18; k++) { const q = P(hx + 14 + k * 4, hy - 0.4 + k * 1.6); C.px(q[0], q[1], 0xc0fff4); C.px(q[0], q[1] + 1, 0x50e0d0); } }
  return fin(C, p);
}
export const pxSphinx = {
  fw: Math.round(156 * SXK), fh: Math.round(120 * SXK), w: 56, h: 52,
  anims: { idle: [4, 4], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], beam: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") P = { legs: gait4(f, n, 7, 3), bob: Math.cos(ph * 2) * 0.8 };
    if (nm === "wind") P = { crouch: t, head: 0.3 * t, wing: -0.6 * t };
    if (nm === "atk") P = { leap: [0.8, 1, 0.4][f], wing: 0.8, legs: { fn: [8, 4], ff: [8, 4], bn: [-6, 0], bf: [-6, 0] } };
    if (nm === "rec") P = { crouch: 0.5 * (1 - t) };
    if (nm === "beam") P = { beam: f > 0 ? 1 : 0, head: -0.2, wing: 1 };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.4, head: 0.4 };
    return sphinxFrame(P);
  },
};

// ════ 신기루 정령 ════ 아지랑이로 된 두건 쓴 형체 · 두건 속 놋쇠 가면(표정 없음) · 아래는 일렁이며 흩어진다 · 두 손 사이 작은 태양
//   p: ph · cast · fade · hurt
const MRK = 0.72;
const HZ = mat(ramp(0xf0d8a0, { hi: 0.6 }), { tex: "glass", amp: 0.5, spec: 0.5 }), HZF = mat(ramp(0xd8b880, { hi: 0.5 }), { tex: "glass", amp: 0.4 });
function mirageFrame(p = {}) {
  const W = 72, H = 88, S = sculpt(W, H, { k: MRK, ax: 32 });
  const ph = p.ph ?? 0, cs = p.cast ?? 0, cx = 30, Y = 36 + Math.sin(ph) * 1.4;
  // 일렁이는 아랫자락
  const hem = [];
  for (let k = 0; k <= 6; k++) hem.push([cx - 12 + k * 4 + Math.sin(ph + k) * 2, Y + 40 + Math.sin(ph * 2 + k * 1.3) * 4 + (k % 2) * 4]);
  S.add(polyF([[cx - 9, Y + 2], [cx + 9, Y + 2], ...hem.slice().reverse()]), HZF, { z: 0, h: 6 });
  for (let k = 0; k < 4; k++) S.carve(capF([cx - 6 + k * 4, Y + 10], [cx - 8 + k * 4 + Math.sin(ph + k) * 2, Y + 38], 0.5), 0.8);
  // 몸 + 두건
  S.add(ellR(cx, Y + 6, 10, 12), HZ, { z: 1, h: 8 });
  const hx = cx + 2, hy = Y - 10;
  S.add(U(ellR(hx - 1, hy, 8.6, 9), polyF([[hx - 9, hy], [hx - 12, hy + 14], [hx - 2, hy + 8]])), HZ, { z: 2, h: 6 });
  S.add(ellR(hx + 3, hy + 1, 5, 6.4), DARK, { z: 2.4, h: 2 });
  S.add(ellR(hx + 4, hy + 1.4, 3.6, 5), BRONZE, { z: 2.6, h: 2.4 });
  S.carve(capF([hx + 3, hy - 0.4], [hx + 7, hy - 0.4], 0.5), 1.2, !1).carve(capF([hx + 4, hy + 4], [hx + 6.4, hy + 4], 0.3), 0.8, !1);
  !p.hurt && S.decal(hx + 5, hy - 0.4, 0xfff4c0).decal(hx + 7, hy - 0.4, 0xfff4c0);
  // 두 팔 + 작은 태양
  const sun = [cx + 14 + cs * 6, Y + 2 - cs * 4];
  for (const [far, d] of [[1, -2], [0, 2]]) { const sh = [cx + d, Y - 2], hd = [sun[0] - 3 + d, sun[1] + d * 1.4]; S.add(U(capF(sh, lerp(sh, hd, 0.5), 2.4, 2), capF(lerp(sh, hd, 0.5), hd, 2, 1.6)), far ? HZF : HZ, { z: far ? 0.5 : 6, h: 1.8 }); }
  S.add(ellR(sun[0], sun[1], 2.6 + cs * 2.4, 2.6 + cs * 2.4), SUNG, { z: 5, h: 2 });
  return fin(haze(S.render({ rim: !0 }), 0.8 + (p.fade ?? 0), ph), p);
}
export const pxMirage = {
  fw: Math.round(72 * MRK), fh: Math.round(88 * MRK), w: 16, h: 30, flying: !0,
  anims: { idle: [6, 7], move: [6, 8], wind: [3, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], blink: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, cast: t * 0.7 };
    if (nm === "atk") P = { ph, cast: [1, 0.6, 0.3][f] };
    if (nm === "rec") P = { ph, cast: 0.3 * (1 - t) };
    if (nm === "blink") P = { ph: ph * 2, fade: [0.6, 1.4, 2.2, 0.8][f] };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return mirageFrame(P);
  },
};

// ════ 사막 날치 ════ 모래 바다 위로 튀어 오르는 은빛 날치 · 등의 짙은 줄 · 날개처럼 펼친 청록 가슴지느러미(지느러미살) · 아래가 긴 꼬리
//   p: flap · tilt · hurt
const FFK = 0.72;
const FSH = mat(ramp(0xc8ccc0), { tex: "scale", amp: 0.8, spec: 0.8 }), FSHD = mat(ramp(0x4a6a7a), { tex: "scale", amp: 0.7, spec: 0.6 }), FIN = mat(ramp(0x6ac0b8, { hi: 0.5 }), { tex: "glass", amp: 0.5, spec: 0.6 }), FINF = mat(rampF(0x4a9a94), { tex: "glass", amp: 0.4 });
function flyfishFrame(p = {}) {
  const W = 74, H = 46, S = sculpt(W, H, { k: FFK, ax: 36 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, cx = 38, cy = 26;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const finW = (back) => {
    const root = R(cx + 4 - (back ? 2 : 0), cy - 1), a = -Math.PI / 2 - 1.1 + (1 - fl) * 0.5 + (back ? 0.15 : 0), rays = [];
    for (let k = 0; k < 6; k++) rays.push(pol(root, a - 0.12 * k, 22 - k * 1.6));
    S.add(polyF([root, ...rays, pol(root, a - 0.9, 6)]), back ? FINF : FIN, { z: back ? -3 : 6, h: 0.8, prof: "flat" });
    for (const r of rays) S.add(capF(root, r, 0.4), back ? FSHD : mat(ramp(0x3a7a80)), { z: back ? -2.9 : 6.1, h: 0.3 });
  };
  finW(1);
  // 꼬리 (아래 갈래가 길다)
  const tb = R(cx - 16, cy + 1);
  S.add(polyF([tb, R(cx - 26, cy - 7), R(cx - 22, cy + 1), R(cx - 30, cy + 9)]), FSHD, { z: 0, h: 1.2, prof: "flat" });
  S.add(ellR(...R(cx, cy), 17, 5.4), FSH, { z: 1, h: 5 });
  S.add(capF(R(cx - 14, cy - 3), R(cx + 12, cy - 4), 2.2, 1.4), FSHD, { on: 1, lift: 0.3, h: 0.4 });
  S.add(capF(R(cx - 12, cy + 0.6), R(cx + 14, cy + 0.4), 0.5), mat(ramp(0xe8e0c8)), { on: 1, lift: 0.3, h: 0.2 });
  for (let k = 0; k < 6; k++) S.carve(capF(R(cx - 10 + k * 4, cy - 4), R(cx - 11 + k * 4, cy + 3), 0.3), 0.4);
  S.add(polyF([R(cx - 6, cy + 4), R(cx - 1, cy + 9), R(cx + 1, cy + 4)]), FINF, { z: 2, h: 0.6, prof: "flat" });
  S.add(ellR(...R(cx + 12, cy - 0.6), 2.4, 2.4), mat(ramp(0xe0d8b8)), { z: 1.6, h: 1.4 });
  !p.hurt && S.decal(...R(cx + 12.4, cy - 0.8), 0x101010);
  S.carve(capF(R(cx + 9, cy - 3), R(cx + 8, cy + 3), 0.4), 0.8);
  S.carve(capF(R(cx + 15, cy + 1.6), R(cx + 17, cy + 1.2), 0.3), 0.8, !1);
  finW(0);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, FFK, 36);
  for (let k = 0; k < 6; k++) { const q = P(...R(cx - 30 - k * 3, cy + 6 + Math.sin(k * 2) * 3)); C.px(q[0], q[1], k % 2 ? 0xe8d0a0 : 0xc8a878); }
  return fin(C, p);
}
export const pxFlyfish = {
  fw: Math.round(74 * FFK), fh: Math.round(46 * FFK), w: 22, h: 12, flying: !0,
  anims: { idle: [4, 10], move: [4, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl, tilt: Math.sin((f / n) * T2) * 0.1 };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.5 * t };
    if (nm === "atk") P = { flap: -0.8, tilt: 0.8 };
    if (nm === "rec") P = { flap: fl, tilt: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.4, tilt: -0.6 };
    return flyfishFrame(P);
  },
};

// ════ 해시계 원반 ════ 떠다니는 사암 해시계 · 방사형 시각 홈과 청록 시각 보석 · 놋쇠 바늘(그림자가 돈다) · 가운데 청록 눈 ·
//   아래로 모래가 흘러내린다
//   p: ph(그림자 각) · tilt · charge · hurt
const SDK = 0.72;
function sundialFrame(p = {}) {
  const W = 64, H = 62, S = sculpt(W, H, { k: SDK, ax: 32 });
  const ph = p.ph ?? 0, ch = p.charge ?? 0, tl = p.tilt ?? 0, cx = 32, cy = 30;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 두께 (아래 옆면) + 윗면
  S.add(U(ellR(...R(cx, cy + 4), 24, 11, tl * 0.4), polyF([R(cx - 24, cy), R(cx + 24, cy), R(cx + 24, cy + 4), R(cx - 24, cy + 4)])), SSTF, { z: 0, h: 4 });
  S.add(ellR(...R(cx, cy), 24, 11, tl * 0.4), SST, { z: 1, h: 5, prof: "flat" });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * T2, q0 = R(cx + Math.cos(a) * 5, cy + Math.sin(a) * 2.4), q1 = R(cx + Math.cos(a) * 19, cy + Math.sin(a) * 8.8); S.carve(capF(q0, q1, 0.35), 0.6); S.add(ellR(...R(cx + Math.cos(a) * 21.4, cy + Math.sin(a) * 9.6), 1, 0.8), ch > 0.3 && k % 2 ? TURQG : TURQ, { on: 1, lift: 0.4, h: 0.3 }); }
  // 바늘 그림자 (시간 따라 돈다)
  const sa = ph;
  S.add(polyF([R(cx, cy), R(cx + Math.cos(sa - 0.12) * 20, cy + Math.sin(sa - 0.12) * 9), R(cx + Math.cos(sa + 0.12) * 20, cy + Math.sin(sa + 0.12) * 9)]), mat(ramp(0x6a5038)), { on: 1, lift: 0.1, h: 0.2 });
  // 놋쇠 바늘 + 가운데 눈
  S.add(polyF([R(cx - 3, cy + 1), R(cx + 7, cy + 1), R(cx - 3, cy - 18)]), BRONZE, { z: 3, h: 1.4, prof: "flat" });
  S.carve(polyF([R(cx - 1.4, cy - 2), R(cx + 2.4, cy - 2), R(cx - 1.4, cy - 10)]), 0.8);
  S.add(ellR(...R(cx - 6, cy + 1), 3.4, 2.4), BRONZE, { z: 2, h: 1.6 });
  S.add(ellR(...R(cx - 6, cy + 1), 2, 1.5), ch > 0.3 ? TURQG : TURQ, { z: 2.1, h: 1 });
  !p.hurt && S.decal(...R(cx - 5.4, cy + 0.6), 0xffffff);
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, SDK, 32);
  for (let k = 0; k < 8; k++) { const q = P(...R(cx - 8 + (k % 4) * 5 + Math.sin(ph + k) * 1.5, cy + 12 + k * 2.4)); C.px(q[0], q[1], k % 2 ? 0xe8d0a0 : 0xc8a878); }
  if (ch > 0.6) for (let k = 0; k < 6; k++) { const q = P(...R(cx - 3, cy - 18 - k * 2.6)); C.px(q[0], q[1], 0xfff0b0); }
  return fin(C, p);
}
export const pxSundial = {
  fw: Math.round(64 * SDK), fh: Math.round(62 * SDK), w: 22, h: 14, flying: !0,
  anims: { idle: [6, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, tilt: Math.sin(ph) * 0.1 };
    if (nm === "move") P = { ph, tilt: 0.2 };
    if (nm === "wind") P = { ph: ph * 3, charge: t, tilt: -0.2 * t };
    if (nm === "atk") P = { ph, charge: 1, tilt: 0.2 };
    if (nm === "rec") P = { ph, charge: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph, tilt: -0.4 };
    return sundialFrame(P);
  },
};

// ════ [정예] 신기루 진 ════ 구릿빛 근육질 상체 · 정수리 상투에서 흘러내리는 검은 머리 · 땋은 턱수염 · 금 귀걸이와 팔찌 ·
//   팔 넷(위 두 손은 언월도, 아래 한 손엔 불덩이) · 허리 아래는 휘도는 모래 회오리
//   p: ph · sw(언월도 0~2) · cast · storm · hurt
const DJK = 0.7;
const DSK = mat(ramp(0x9a6a44), { tex: "skin", amp: 0.8, spec: 0.3 }), DSKF = mat(rampF(0x7a5034), { tex: "skin", amp: 0.7 }), HAIR = mat(ramp(0x1e1a1a), { tex: "fur", amp: 1, dir: 1.4 });
function djinnFrame(p = {}) {
  const W = 156, H = 136, S = sculpt(W, H, { k: DJK, ax: 66 });
  const ph = p.ph ?? 0, sw = p.sw ?? 0, cs = p.cast ?? 0, st = p.storm ?? 0, cx = 64, Y = 56 + Math.sin(ph) * 1.6;
  // 모래 회오리 (허리 → 아래 끝)
  const tw = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8; tw.push([cx + Math.sin(ph * 2 + t * 5) * (3 + t * 6) - t * 6, Y + 18 + t * 58]); }
  S.add(U(...tw.slice(0, -1).map((q, k) => capF(q, tw[k + 1], 16 - k * 1.7 + st * 3, 16 - (k + 1) * 1.7 + st * 3))), SAND, { z: -1, h: 6 });
  for (let k = 0; k < 7; k++) { const q = tw[k + 1], w = 15 - k * 1.7; S.carve(capF([q[0] - w, q[1] - 2 + Math.sin(ph * 3 + k) * 2], [q[0] + w, q[1] + 3 + Math.sin(ph * 3 + k) * 2], 0.6), 1); }
  // 먼 팔 둘 (위: 언월도 · 아래: 주먹)
  const shF = [cx - 12, Y - 10], shF2 = [cx - 10, Y + 2];
  const hdU = sw <= 1 ? lerp(pol(shF, -2.2, 24), pol(shF, -2.6, 24), sw) : lerp(pol(shF, -2.6, 24), pol(shF, -0.2, 26), Math.min(1, sw - 1));
  const baF = sw <= 1 ? L(-1.6, -2.2, sw) : L(-2.2, 0.4, Math.min(1, sw - 1));
  S.add(U(capF(shF, lerp(shF, hdU, 0.5), 5, 4.4), capF(lerp(shF, hdU, 0.5), hdU, 4.4, 3.6)), DSKF, { z: -3, h: 3.6 });
  S.add(capF(lerp(shF, hdU, 0.7), lerp(shF, hdU, 0.8), 3.8), GOLD, { z: -2.9, h: 3 });
  scimitar(S, hdU, baF, -2.5);
  const hdL = [cx - 18, Y + 18];
  S.add(U(capF(shF2, lerp(shF2, hdL, 0.5), 4.4, 4), capF(lerp(shF2, hdL, 0.5), hdL, 4, 3.4)), DSKF, { z: -2, h: 3 });
  S.add(ellR(hdL[0], hdL[1] + 1, 3.6, 3.4), DSKF, { z: -1.9, h: 2.4 });
  // 몸통 (가슴 · 배 근육) + 허리띠
  S.add(U(ellR(cx + 2, Y - 2, 18, 15), ellR(cx + 1, Y + 12, 13, 10)), DSK, { z: 1, h: 12 });
  S.carve(capF([cx + 4, Y - 12], [cx + 4, Y + 18], 0.5), 0.8);
  S.carve(capF([cx - 10, Y + 2], [cx + 16, Y + 1], 0.5), 0.7);
  for (const y of [Y + 8, Y + 13]) S.carve(capF([cx - 4, y], [cx + 12, y], 0.4), 0.5);
  S.add(polyF([[cx - 14, Y + 18], [cx + 15, Y + 18], [cx + 16, Y + 25], [cx - 15, Y + 25]]), INDI, { z: 2, h: 4 });
  S.add(capF([cx - 15, Y + 21.4], [cx + 16, Y + 21.4], 1.2), GOLD, { z: 2.1, h: 1 });
  S.add(ellR(cx + 6, Y + 21.4, 3, 3), GOLD, { z: 2.2, h: 1.6 });
  S.add(ellR(cx + 6, Y + 21.4, 1.4, 1.4), TURQ, { z: 2.3, h: 1 });
  // 목걸이 + 머리 (상투 · 땋은 수염 · 뾰족 귀 · 금 귀걸이)
  S.add(capF([cx - 6, Y - 13], [cx + 12, Y - 12], 1.4), GOLD, { lift: 1, h: 1 });
  const hx = cx + 6, hy = Y - 24;
  S.add(U(capF([hx - 4, hy - 10], [hx - 16 + Math.sin(ph) * 3, hy + 4], 2.6, 1.6), capF([hx - 16 + Math.sin(ph) * 3, hy + 4], [hx - 22 + Math.sin(ph + 1) * 4, hy + 18], 1.6, 1)), HAIR, { z: 2, h: 1.6 });
  S.add(ellR(hx - 2, hy - 10, 3.4, 2.6), HAIR, { z: 3, h: 2 });
  S.add(ellR(hx - 2, hy - 8.4, 3, 1), GOLD, { z: 3.2, h: 1 });
  S.add(capF([cx + 2, Y - 14], [hx, hy + 4], 5, 4.4), DSKF, { z: 3.6, h: 4 });
  S.add(ellR(hx, hy, 7.4, 8.6), mat(ramp(0xa87450), { tex: "skin", amp: 0.7, spec: 0.3 }), { z: 4, h: 7 });
  S.add(capF([hx + 3, hy - 3.6], [hx + 8.4, hy - 3.2], 1.2), DSKF, { z: 4.4, h: 1.4 });
  S.add(polyF([[hx + 6.4, hy - 2.6], [hx + 8.6, hy + 2], [hx + 6.4, hy + 2.6]]), mat(ramp(0xa87450), { tex: "skin" }), { z: 4.6, h: 1.6 });
  S.add(U(polyF([[hx - 1, hy + 3], [hx + 7.4, hy + 3.6], [hx + 7, hy + 9], [hx + 4, hy + 22], [hx + 1, hy + 21], [hx - 2, hy + 9]])), HAIR, { z: 9.5, h: 2 });
  for (let k = 0; k < 5; k++) S.carve(capF([hx + 0.6 + k * 0.6, hy + 9 + k * 2.6], [hx + 6 - k * 0.3, hy + 9 + k * 2.6], 0.3), 0.7);
  S.add(ellR(hx + 2.6, hy + 21, 1.6, 1.2), GOLD, { z: 9.6, h: 0.8 });
  S.add(capF([hx + 4.6, hy + 4.6], [hx + 7.6, hy + 4.4], 0.5), mat(ramp(0x6a3a2a)), { z: 9.6, h: 0.3 });
  S.add(polyF([[hx - 5, hy - 1], [hx - 10, hy - 6], [hx - 4, hy + 3]]), DSK, { z: 4.2, h: 1.4 });
  S.add(minus(ellR(hx - 5, hy + 5, 2, 2), ellR(hx - 5, hy + 5, 1, 1)), GOLD, { z: 4.3, h: 0.8 });
  if (!p.hurt) S.decal(hx + 5.6, hy - 1.6, 0xfff0a0).decal(hx + 6.6, hy - 1.6, 0xffd060);
  // 가까운 팔 둘 (위: 언월도 · 아래: 불덩이)
  const sh = [cx + 14, Y - 9], sh2 = [cx + 12, Y + 3];
  const hdN = sw <= 1 ? lerp(pol(sh, -0.5, 22), pol(sh, -1.9, 24), sw) : lerp(pol(sh, -1.9, 24), pol(sh, 0.3, 27), Math.min(1, sw - 1));
  const baN = sw <= 1 ? L(-1.1, -2.4, sw) : L(-2.4, 0.55, Math.min(1, sw - 1));
  const hdC = [cx + 26 + cs * 8, Y + 10 - cs * 4];
  S.add(U(capF(sh2, lerp(sh2, hdC, 0.5), 4.6, 4), capF(lerp(sh2, hdC, 0.5), hdC, 4, 3.4)), DSK, { z: 7, h: 3.4 });
  S.add(capF(lerp(sh2, hdC, 0.7), lerp(sh2, hdC, 0.8), 3.6), GOLD, { z: 7.1, h: 2.6 });
  S.add(ellR(hdC[0], hdC[1], 3.6, 3.4), DSK, { z: 7.2, h: 2.4 });
  S.add(ellR(hdC[0] + 5, hdC[1] - 4, 3.4 + cs * 3, 3.4 + cs * 3), SUNG, { z: 7.3, h: 2.4 });
  S.add(ellR(sh[0], sh[1], 8, 7), DSK, { z: 8, h: 5 });
  S.add(U(capF(sh, lerp(sh, hdN, 0.5), 5.4, 4.6), capF(lerp(sh, hdN, 0.5), hdN, 4.6, 3.8)), DSK, { z: 8.2, h: 4 });
  S.add(capF(lerp(sh, hdN, 0.7), lerp(sh, hdN, 0.8), 4.2), GOLD, { z: 8.3, h: 3 });
  S.add(capF(lerp(sh, hdN, 0.22), lerp(sh, hdN, 0.26), 5.2), GOLD, { z: 8.3, h: 3 });
  scimitar(S, hdN, baN, 9);
  return fin(haze(S.render({ rim: !0 }), st * 1.2, ph), p);
}
export const pxDjinn = {
  fw: Math.round(156 * DJK), fh: Math.round(136 * DJK), w: 34, h: 56, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], cast: [4, 10, !1], storm: [6, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, sw: t };
    if (nm === "atk") P = { ph, sw: [1.5, 2, 2][f] };
    if (nm === "rec") P = { ph, sw: 2 + t };
    if (nm === "cast") P = { ph, cast: [0.3, 1, 1, 0.4][f] };
    if (nm === "storm") P = { ph: ph * 2, storm: Math.sin(t * Math.PI), sw: 1 };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return djinnFrame(P);
  },
};
