// 모스스파이어 몬스터 12종 (조각 도구, 오른쪽을 본다) — 이끼 바늘 봉우리 위 하늘 수도원 · 종탑 · 기도 깃발
//   아래 섬 줄: 이끼 수도승 · 바위 야크 · 종 껍질 딱정벌레 · [정예] 석상 수도원장
//   가운데 줄: 산 학 · 기도 깃발 정령 · 이끼 꼬마 · [정예] 종지기 거인
//   위 줄: 산수리 · 연 정령 · 경전 두루마리 · [정예] 구름 현자
import { ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, glass, gait4, gait2, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const ROBE = mat(ramp(0x8a5a3a), { tex: "cloth", amp: 0.9 }), ROBEF = mat(rampF(0x744a30), { tex: "cloth", amp: 0.8 }), SASH = mat(ramp(0xa8843e), { tex: "cloth", amp: 0.7 });
const MOSS = mat(ramp(0x5e8a44), { tex: "fur", amp: 1, dir: 1.57 }), MOSSF = mat(rampF(0x4e7838), { tex: "fur", amp: 0.9, dir: 1.57 });
const SKIN = mat(ramp(0xc89a74), { tex: "skin", amp: 0.6 }), SKINF = mat(rampF(0xa8805e), { tex: "skin", amp: 0.5 }), OLD = mat(ramp(0xd8c4a8), { tex: "skin", amp: 0.6 });
const STONE = mat(ramp(0x9a9284), { tex: "stone", amp: 1 }), STONEF = mat(rampF(0x847c70), { tex: "stone", amp: 0.9 }), WOOD = mat(ramp(0x7a5434), { tex: "wood", amp: 0.9, dir: 1.57 });
const BRONZE = mat(ramp(0xa87a44), { tex: "metal", amp: 0.9, spec: 0.45 }), BRONZEF = mat(rampF(0x8e6638), { tex: "metal", amp: 0.8 }), VERD = mat(ramp(0x5a9a88), { tex: "metal", amp: 1.1 });
const YAK = mat(ramp(0x6e5e4e), { tex: "fur", amp: 1.2, dir: 1.4 }), YAKF = mat(rampF(0x5a4c40), { tex: "fur", amp: 1, dir: 1.4 }), HORN = mat(ramp(0xd8ccb0), { spec: 0.3 });
const FEW = mat(ramp(0xe8e4dc), { tex: "feather", amp: 0.8, dir: 0.3 }), FEWF = mat(rampF(0xc8c4bc), { tex: "feather", amp: 0.7, dir: 0.3 }), FEB = mat(ramp(0x3a3634), { tex: "feather", amp: 0.9, dir: 0.3 });
const EAG = mat(ramp(0x7a5a3a), { tex: "feather", amp: 1, dir: 0.4 }), EAGF = mat(rampF(0x644a30), { tex: "feather", amp: 0.9, dir: 0.4 }), BEAK = mat(ramp(0xd8b048), { spec: 0.5 });
const SHELL = mat(ramp(0x6a7a5a), { tex: "metal", amp: 0.9, spec: 0.4 }), CHIT = mat(ramp(0x3a3430), { tex: "skin", amp: 0.6, spec: 0.3 });
const PAPER = mat(ramp(0xe8dcc0), { tex: "cloth", amp: 0.5 }), PAPERF = mat(rampF(0xc8bc9e), { tex: "cloth", amp: 0.5 }), INK = 0x2a2018;
const CLOUD = mat(ramp(0xece8f0, { hi: 0.5 }), { tex: "skin", amp: 0.6 }), CLOUDF = mat(rampF(0xc8c4d4), { tex: "skin", amp: 0.5 });
const FLAGS = [0xa8443e, 0xd8b048, 0x4a6aa0, 0x5a8a4a, 0xe8e0d0].map((c) => mat(ramp(c), { tex: "cloth", amp: 0.8 }));
const GLW = mat(rampGlow(0xfff0b0)), GLB = mat(rampGlow(0xa8d8ff)), BEAD = mat(ramp(0x6a3a2a), { spec: 0.5 });
const fin = (C, p) => (p.hurt ? flash(C) : C);
const toPx = (W, H, K) => (x, y) => [W * K / 2 + (x - W / 2) * K, H * K + (y - H) * K];
// 이끼 덮개 (가장자리가 늘어진 털이끼 + 작은 풀잎)
const mossCap = (S, cx, cy, rx, ry, o = {}) => { S.add(ellR(cx, cy, rx, ry), MOSS, { on: o.on ?? 1, lift: o.lift ?? 1.2, h: o.h ?? 1.6 }); for (let k = 0; k < Math.round(rx / 2.5); k++) { const x = cx - rx + 2 + k * 2.6; S.add(capF([x, cy + ry * 0.4], [x - 0.4, cy + ry + 1.5 + (k % 3)], 0.9, 0.5), MOSSF, { lift: (o.lift ?? 1.2) + 0.3, h: 0.6 }); } };

// ════ 이끼 수도승 ════ 이끼가 어깨까지 덮인 갈색 승복 · 깊게 눌러쓴 두건(그늘 속 눈) · 나무 지팡이 끝에 작은 종 · 목에 염주
//   p: bob · legs · staff(0 짚음 ~ 1.2 머리 위 · 2 내려친 끝) · pray · hurt
const MKK = 0.72;
function monkFrame(p = {}) {
  const W = 60, H = 70, G = H - 1, S = sculpt(W, H, { k: MKK, ax: 30 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, sf = p.staff ?? 0, cx = 28;
  // 발 (승복 자락 아래)
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) S.add(ellR(cx - 2 + (far ? -3 : 3) + o[0], G - 1.5 - o[1], 4, 2), far ? mat(rampF(0x4a3a2a)) : mat(ramp(0x5a4632), { tex: "leather" }), { z: far ? -2 : 6, h: 1.6 });
  // 승복 (넓게 퍼진 자락 · 세로 주름)
  S.add(polyF([[cx - 8, 24 + b], [cx + 8, 24 + b], [cx + 13 + g.n[0] * 0.3, G - 2], [cx - 13 + g.f[0] * 0.3, G - 2]]), ROBE, { z: 1, h: 8 });
  for (const dx of [-7, -2, 3, 8]) S.carve(capF([cx + dx * 0.5, 32 + b], [cx + dx, G - 3], 0.5), 0.7);
  S.add(capF([cx - 9, 42 + b], [cx + 9, 42 + b], 2), SASH, { z: 8, h: 1.6 });
  S.add(capF([cx + 4, 43 + b], [cx + 5, 52 + b], 1.2, 0.8), SASH, { z: 8.5, h: 1 });
  // 이끼 어깨 덮개 + 염주
  mossCap(S, cx, 25 + b, 11, 4.4);
  for (let k = 0; k < 9; k++) { const a = 0.4 + (k / 8) * 2.3; S.add(ellR(cx + 1 + Math.cos(a) * 6, 27 + b + Math.sin(a) * 5, 1.1, 1.1), BEAD, { lift: 2, h: 0.8 }); }
  // 두건 + 그늘 속 얼굴
  const hx = cx + 2, hy = 16 + b;
  S.add(U(ellR(hx - 1, hy, 8.4, 8.4), polyF([[hx - 9, hy], [hx - 11, hy + 10], [hx - 3, hy + 8]])), ROBE, { z: 3, h: 6 });
  S.add(ellR(hx + 2.4, hy + 2, 4.6, 5), mat(ramp(0x2a1e16)), { lift: -1, z: 4, h: 1.5 });
  S.add(ellR(hx + 3, hy + 4.4, 3, 2.6), SKIN, { lift: 0.5, h: 1.2 });
  if (!p.hurt) for (const x of [hx + 2.4, hx + 5]) S.decal(x, hy + 1.6, 0xd8f0a0);
  mossCap(S, hx - 2, hy - 6, 6, 2.4);
  // 지팡이 (가까운 손) + 끝 종
  const sh = [cx + 6, 28 + b];
  const hand = p.pray ? [cx + 7, 34 + b] : sf >= 2 ? pol(sh, 0.3, 12) : sf > 0.6 ? pol(sh, -1.9 + (sf - 0.6) * 0.5, 11) : pol(sh, 1.0, 10);
  S.add(capF(sh, hand, 2.6, 2.2), ROBE, { z: 9, h: 2.4 });
  S.add(ellR(hand[0], hand[1], 1.9, 1.9), SKIN, { z: 10, h: 1.5 });
  const sa = p.pray ? -Math.PI / 2 : sf >= 2 ? 0.45 : sf > 0.6 ? -1.2 - (sf - 0.6) * 0.8 : -1.45, s0 = pol(hand, sa, -14), s1 = pol(hand, sa, 18);
  S.add(capF(s0, s1, 1.2, 1), WOOD, { z: 10.5, h: 1.1 });
  S.add(ellR(...pol(s1, sa, 2), 2.4, 2.6), BRONZE, { z: 11, h: 2 });
  p.pray && S.add(ellR(hx + 2, hy - 12, 3, 3), GLW, { z: 12, h: 1.5 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxMonk = {
  fw: Math.round(60 * MKK), fh: Math.round(70 * MKK), w: 16, h: 30,
  anims: { idle: [4, 5], move: [6, 8], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], pray: [4, 6] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4 };
    if (nm === "move") { const g = gait2(f, n, 3, 1.5); P = { legs: g, bob: g.bob }; }
    if (nm === "wind") P = { staff: 1.2 * t };
    if (nm === "atk") P = { staff: 2, bob: [0.5, 1, 1][f] };
    if (nm === "rec") P = { staff: 2 - 2 * t };
    if (nm === "pray") P = { pray: 1, bob: Math.sin(ph) * 0.3 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1 };
    return monkFrame(P);
  },
};

// ════ 바위 야크 ════ 땅까지 늘어진 덥수룩한 갈색 털 · 어깨 혹 · 넓게 휜 뿔 · 등에 이끼와 작은 기도 깃발 · 코뚜레
//   p: legs · bob · head(숙이기) · crouch · hurt
const YKK = 0.7;
function yakFrame(p = {}) {
  const W = 96, H = 72, G = H - 1, S = sculpt(W, H, { k: YKK, ax: 46 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd0 = p.head ?? 0, cx = 46;
  const leg = (x, o, far) => { const top = [x, 46 + b], ft = [x + o[0], G - 2 - o[1]]; S.add(capF(top, ft, far ? 4 : 4.6, 3.4), far ? YAKF : YAK, { z: far ? -3 : 5, h: 3.6 }); S.add(ellR(ft[0] + 1, ft[1] + 0.4, 3.6, 2), mat(far ? rampF(0x2e2622) : ramp(0x3a302a)), { z: far ? -2 : 5.5, h: 1.6 }); };
  leg(cx + 16, lg.ff, 1), leg(cx - 16, lg.bf, 1);
  // 몸 (어깨 혹) + 늘어진 털 자락
  S.add(U(ellR(cx, 40 + b, 25, 15), ellR(cx + 12, 32 + b, 15, 13)), YAK, { z: 1, h: 13 });
  S.add(polyF([[cx - 24, 42 + b], [cx + 26, 42 + b], [cx + 24, 58 + b], [cx + 16, 54 + b], [cx + 8, 60 + b], [cx, 55 + b], [cx - 8, 60 + b], [cx - 16, 55 + b], [cx - 24, 58 + b]]), YAK, { blend: 3, h: 3 });
  for (let k = 0; k < 9; k++) S.carve(capF([cx - 20 + k * 5.4, 44 + b], [cx - 21 + k * 5.4, 57 + b], 0.5), 0.8);
  // 꼬리
  S.add(capF([cx - 24, 36 + b], [cx - 30, 48 + b], 2.4, 1.6), YAKF, { z: 0, h: 1.8 });
  // 등 이끼 + 기도 깃발 줄
  mossCap(S, cx + 2, 25 + b, 16, 4);
  S.add(capF([cx - 8, 22 + b], [cx - 8, 12 + b], 0.7), WOOD, { lift: 2, h: 0.6 }).add(capF([cx + 12, 20 + b], [cx + 12, 10 + b], 0.7), WOOD, { lift: 2, h: 0.6 });
  for (let k = 0; k < 4; k++) { const x = cx - 6 + k * 4.4, y = 13 + b + Math.sin((k + 0.5) / 4 * Math.PI) * 2; S.add(polyF([[x - 1.6, y], [x + 1.6, y], [x + 1.2, y + 4], [x, y + 3], [x - 1.2, y + 4]]), FLAGS[k], { lift: 2.5, h: 0.6 }); }
  // 머리 (낮게 앞으로) + 뿔 + 코
  const hx = cx + 29, hy = 42 + b + hd0 * 6;
  S.add(ellR(hx, hy, 9, 8.4), YAK, { z: 6, h: 8 });
  S.add(ellR(hx + 6, hy + 4, 5.4, 4.4), mat(ramp(0x4a3c34), { tex: "skin" }), { z: 7, h: 4 });
  S.add(polyF([[hx - 6, hy + 4], [hx + 6, hy + 6], [hx + 2, hy + 14], [hx - 4, hy + 13]]), YAKF, { z: 6.5, h: 2 });
  for (const [far, z] of [[1, 5], [0, 8]]) { const r0 = [hx - 3 + (far ? -2 : 1), hy - 5], c1 = [hx - 12 + (far ? -2 : 0), hy - 10 - hd0 * 3], c2 = [hx - 9 + (far ? -2 : 0), hy - 18 - hd0 * 4], c3 = [hx + 2, hy - 20 - hd0 * 5]; S.add(U(capF(r0, c1, 2.6, 2.2), capF(c1, c2, 2.2, 1.6), capF(c2, c3, 1.6, 0.6)), HORN, { z, h: 1.8 }); }
  S.add(minus(ellR(hx + 10, hy + 7, 2, 2), ellR(hx + 10, hy + 7, 1, 1)), BRONZE, { z: 9, h: 0.8 });
  !p.hurt && S.decal(hx + 3, hy - 1, 0x1a1210).decal(hx + 3.4, hy - 1.6, 0xffffff);
  leg(cx + 19, lg.fn, 0), leg(cx - 13, lg.bn, 0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxYak = {
  fw: Math.round(96 * YKK), fh: Math.round(72 * YKK), w: 34, h: 30,
  anims: { idle: [4, 4], move: [6, 8], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.5, head: 0.2 + Math.sin(ph) * 0.1 };
    if (nm === "move") P = { legs: gait4(f, n, 5, 2.5), bob: Math.cos(ph * 2) * 0.6 };
    if (nm === "wind") P = { head: 1 * t, crouch: t, legs: { fn: [-2, 0], ff: [-2, 0], bn: [2, 0], bf: [2, 0] } };
    if (nm === "atk") P = { head: 1, legs: gait4(f, 3, 7, 3), bob: Math.cos(f * 2) * 1 };
    if (nm === "rec") P = { head: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, head: -0.4, crouch: 0.3 };
    return yakFrame(P);
  },
};

// ════ 종 껍질 딱정벌레 ════ 녹청 낀 청동 종 모양 등딱지(가장자리 띠 · 새김 무늬) · 짧은 검은 다리 여섯 · 큰뿔
//   맞으면 종처럼 울린다. 몸을 엎드려 종 속에 숨는다
//   p: legs · hide · ring(울림 흔들) · horn(0~1 들어올림) · hurt
const BBK = 0.72;
function bellBeetleFrame(p = {}) {
  const W = 62, H = 48, G = H - 1, S = sculpt(W, H, { k: BBK, ax: 30 });
  const hd = p.hide ?? 0, rg = p.ring ?? 0, hn = p.horn ?? 0, ph = p.ph ?? 0, cx = 28, by = G - 8 + hd * 4;
  // 다리 (숨으면 접힘)
  if (hd < 0.8) for (const [k, far] of [[0, 1], [1, 1], [2, 1], [0, 0], [1, 0], [2, 0]]) { const x = cx - 10 + k * 9, a = Math.sin(ph + k * 2 + far * 3) * 2; S.add(U(capF([x, by - 2], [x + a + 3, by + 3], 1.2), capF([x + a + 3, by + 3], [x + a + 2, G - 0.5], 1, 0.7)), CHIT, { z: far ? -2 : 6, h: 1 }); }
  // 머리 + 큰뿔
  const hx = cx + 16 - hd * 5, hy = by - 3;
  S.add(ellR(hx, hy, 5, 4.4), CHIT, { z: 2, h: 4 });
  S.add(U(capF([hx + 3, hy - 1], [hx + 10, hy - 6 - hn * 4], 1.8, 1.2), capF([hx + 10, hy - 6 - hn * 4], [hx + 9, hy - 10 - hn * 5], 1.2, 0.5)), CHIT, { z: 3, h: 1.6 });
  !p.hurt && S.decal(hx + 2, hy - 1, 0xd8b048);
  // 종 등딱지 (위가 둥근 종 + 아래 넓은 테)
  const R = (x, y) => { const a = Math.sin(rg) * 0.12, c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - by; return [cx + dx * c - dy * s, by + dx * s + dy * c]; };
  S.add(polyF([R(cx - 8, by - 20), R(cx + 8, by - 20), R(cx + 13, by - 6), R(cx + 17, by + 1), R(cx - 17, by + 1), R(cx - 13, by - 6)]), BRONZE, { z: 4, h: 10 });
  S.add(ellR(...R(cx, by - 20), 8, 3), BRONZE, { z: 4, h: 4 });
  S.add(polyF([R(cx - 18, by - 1), R(cx + 18, by - 1), R(cx + 18, by + 2), R(cx - 18, by + 2)]), BRONZE, { z: 6, h: 2, prof: "flat" });
  S.carve(capF(R(cx - 14, by - 8), R(cx + 14, by - 8), 0.5), 0.8).carve(capF(R(cx - 12, by - 12), R(cx + 12, by - 12), 0.5), 0.6);
  for (let k = 0; k < 5; k++) S.add(ellR(...R(cx - 10 + k * 5, by - 10), 1.2, 1.2), BRONZEF, { on: 1, h: 0.5 });
  S.add(ellR(...R(cx - 4, by - 14), 5, 2.4), VERD, { on: 1, h: 0.4 }).add(ellR(...R(cx + 8, by - 4), 4, 2), VERD, { on: 1, h: 0.4 });
  S.add(ellR(...R(cx, by - 23), 2, 2), BRONZE, { lift: 1, h: 1.4 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxBellBeetle = {
  fw: Math.round(62 * BBK), fh: Math.round(48 * BBK), w: 24, h: 18,
  anims: { idle: [4, 5], move: [6, 10], hide: [2, 6], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1], ring: [4, 14, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph: 0 };
    if (nm === "move") P = { ph };
    if (nm === "hide") P = { hide: 1 };
    if (nm === "wind") P = { horn: -0.5 * t, hide: 0.2 * t };
    if (nm === "atk") P = { horn: [0.6, 1.2, 1][f] };
    if (nm === "rec") P = { horn: 1 - t };
    if (nm === "ring") P = { hide: 1, ring: [1, -1, 0.7, -0.4][f] };
    if (nm === "hurt") P = { hurt: f === 0, ring: 1 };
    return bellBeetleFrame(P);
  },
};

// ════ [정예] 석상 수도원장 ════ 이끼와 풀이 자란 돌 석상(가부좌에서 일어선 늙은 수도원장) · 돌 승복 주름 · 가슴에 큰 염주 ·
//   한 손에 돌 경전, 한 손은 합장 / 내려찍기 · 이마의 빛나는 점
//   p: bob · step · arm(0~1.4) · crouch · throw · hurt
const ABK = 0.72;
function abbotFrame(p = {}) {
  const W = 118, H = 116, G = H - 1, S = sculpt(W, H, { k: ABK, ax: 56 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 5, st = p.step ?? 0, ar = p.arm ?? 0, cx = 56;
  // 받침돌 (발 아래 넓은 연꽃 받침)
  S.add(ellR(cx, G - 3, 30, 5), STONEF, { z: -4, h: 3 });
  for (let k = 0; k < 7; k++) { const x = cx - 24 + k * 8; S.add(ellR(x, G - 6, 4.4, 3.4), STONEF, { z: -3, h: 2 }); }
  // 다리 (돌 승복 아래 굵은 발)
  for (const [x, far, s] of [[cx - 10, 1, -st], [cx + 10, 0, st]]) S.add(ellR(x + s, G - 9, 7, 4), far ? STONEF : STONE, { z: far ? -2 : 4, h: 4 });
  // 몸 (넓은 돌 승복 · 깊은 주름) + 이끼
  S.add(polyF([[cx - 16, 44 + b], [cx + 16, 44 + b], [cx + 26, G - 10], [cx - 26, G - 10]]), STONE, { z: 1, h: 14 });
  for (const dx of [-16, -8, 0, 8, 16]) S.carve(capF([cx + dx * 0.5, 54 + b], [cx + dx, G - 12], 0.7), 1.1);
  S.add(polyF([[cx - 6, 44 + b], [cx + 4, 44 + b], [cx + 18, 80 + b], [cx + 10, 82 + b]]), STONE, { blend: 2, h: 2 });
  mossCap(S, cx - 14, G - 14, 10, 3.6), mossCap(S, cx + 16, 70 + b, 7, 3);
  // 먼 팔 (돌 경전을 안음)
  const shF = [cx - 16, 50 + b], hF = ar > 0.7 && !p.throw ? [cx - 22, 30 + b] : [cx - 12, 70 + b];
  S.add(capF(shF, hF, 7, 6), STONEF, { z: -2, h: 6 });
  S.add(polyF([[hF[0] - 8, hF[1] - 5], [hF[0] + 6, hF[1] - 7], [hF[0] + 8, hF[1] + 5], [hF[0] - 6, hF[1] + 7]]), STONEF, { z: -1, h: 3, prof: "flat" });
  // 어깨 + 큰 염주
  S.add(ellR(cx, 46 + b, 20, 8), STONE, { z: 3, h: 6 });
  for (let k = 0; k < 12; k++) { const a = 0.25 + (k / 11) * 2.65; S.add(ellR(cx + Math.cos(a) * 13, 48 + b + Math.sin(a) * 12, 2.4, 2.4), mat(ramp(0x6a5a4a), { spec: 0.4 }), { z: 8, h: 2 }); }
  S.add(ellR(cx, 62 + b, 3.4, 3.4), GLW, { z: 9, h: 2 });
  // 머리 (긴 귓불 · 감은 눈 · 이마 점 · 머리 위 풀)
  const hx = cx + 3, hy = 30 + b;
  S.add(ellR(hx, hy, 11, 12), STONE, { z: 5, h: 10 });
  for (const d of [-1, 1]) S.add(capF([hx + d * 10, hy - 2], [hx + d * 10.4, hy + 9], 2.4, 2), STONE, { z: 4.5, h: 2 });
  S.carve(capF([hx - 1, hy + 1], [hx + 3, hy + 1.6], 0.5), 1, !1).carve(capF([hx + 5, hy + 1.6], [hx + 9, hy + 1], 0.5), 1, !1);
  S.carve(capF([hx + 2, hy + 7], [hx + 7, hy + 7], 0.5), 0.8, !1);
  S.add(ellR(hx + 4, hy - 4, 1.6, 1.6), p.hurt ? STONE : GLW, { lift: 0.5, h: 0.8 });
  mossCap(S, hx - 2, hy - 11, 8, 2.6);
  for (const d of [-4, 0, 3]) S.add(capF([hx + d, hy - 12], [hx + d - 1, hy - 17], 0.6, 0.3), MOSS, { lift: 2, h: 0.5 });
  // 가까운 팔 (합장 / 들어 내려찍기 / 던지기)
  const shN = [cx + 18, 50 + b], tN = p.throw ?? 0;
  const hN = tN > 0 ? pol(shN, -2.6 + tN * 2.4, 26) : ar > 0.7 ? [cx + 26, 18 + b - (ar - 0.7) * 10] : [cx + 8, 60 + b];
  S.add(capF(shN, hN, 7, 6), STONE, { z: 10, h: 6 });
  S.add(ellR(hN[0], hN[1], 6.4, 6), STONE, { z: 11, h: 5 });
  tN > 0.2 && tN < 1.1 && S.add(ellR(hN[0], hN[1] - 6, 5, 5), BEAD, { z: 12, h: 4 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxAbbot = {
  fw: Math.round(118 * ABK), fh: Math.round(116 * ABK), w: 34, h: 52,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], throw: [4, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6 };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.6 };
    if (nm === "wind") P = { arm: 1.4 * t, crouch: -0.2 * t };
    if (nm === "atk") P = { arm: [0.5, 0.1, 0][f], crouch: 0.8 };
    if (nm === "rec") P = { arm: 0, crouch: 0.6 * (1 - t) };
    if (nm === "throw") P = { throw: [0.05, 0.4, 1, 1.2][f], crouch: 0.2 };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.3 };
    return abbotFrame(P);
  },
};

// ════ 산 학 ════ 흰 몸 · 검은 날개 끝과 목 · 붉은 정수리 · 긴 부리와 다리 — 날며 부리로 찌른다
//   p: flap · tilt · neck · hurt
const CNK = 0.7;
function craneFrame(p = {}) {
  const W = 76, H = 56, S = sculpt(W, H, { k: CNK, ax: 36 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, nk = p.neck ?? 0, cx = 34, cy = 28;
  const R = (x, y) => { const c = Math.cos(tl * 0.4), s = Math.sin(tl * 0.4), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 1 + (back ? -3 : 0), cy - 2), a = -Math.PI / 2 - 0.55 + (1 - up) * 0.95;
    S.add(ellR(...pol(root, a + 0.25, 9), 11, 5, a), back ? FEWF : FEW, { z: back ? -4 : 6, h: 2.4 });
    for (let k = 0; k < 5; k++) { const ak = a - 0.16 * k, tip = pol(root, ak, 24 - k * 1.8); S.add(capF(pol(root, ak, 12), tip, 2.4, 1), back ? mat(rampF(0x2e2a2a), { tex: "feather" }) : FEB, { z: back ? -3.9 : 6.1, h: 1.2 }); }
  };
  wing(1);
  // 꼬리 + 다리 (뒤로 길게)
  S.add(capF(R(cx - 8, cy + 1), R(cx - 16, cy + 3), 3, 1.4), FEB, { z: 0, h: 1.4 });
  for (const d of [0, 2]) S.add(capF(R(cx - 4 + d, cy + 4), R(cx - 24 + d, cy + 8 + d), 0.8, 0.6), mat(ramp(0x3a3430)), { z: 0.5, h: 0.6 });
  // 몸
  S.add(ellR(...R(cx, cy + 1), 11, 6.6), FEW, { z: 2, h: 5.6 });
  // 목 (검은 띠) + 머리 + 붉은 정수리 + 긴 부리
  const n0 = R(cx + 9, cy - 1), hd = R(cx + 20 + nk * 6, cy - 9 + nk * 5);
  S.add(capF(n0, hd, 3, 2.2), FEW, { z: 3, h: 2.4 });
  S.add(capF(lerp(n0, hd, 0.35), lerp(n0, hd, 0.85), 2.6, 2.2), FEB, { on: 1, h: 0.4 });
  S.add(ellR(hd[0], hd[1], 3.4, 3), FEW, { z: 4, h: 2.8 });
  S.add(ellR(hd[0] - 0.5, hd[1] - 2.2, 1.8, 1.2), mat(ramp(0xc83a3a)), { on: 1, h: 0.4 });
  S.add(polyF([[hd[0] + 2.4, hd[1] - 1], [hd[0] + 15 + nk * 3, hd[1] + 1 + nk * 2], [hd[0] + 2.4, hd[1] + 1]]), BEAK, { z: 5, h: 1, prof: "sharp" });
  !p.hurt && S.decal(hd[0] + 1, hd[1] - 0.6, 0x101010);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxCrane = {
  fw: Math.round(76 * CNK), fh: Math.round(56 * CNK), w: 20, h: 14, flying: !0,
  anims: { idle: [4, 8], move: [4, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 0.8, tilt: -0.3 * t, neck: -0.6 * t };
    if (nm === "atk") P = { flap: -0.6, tilt: 0.5, neck: 1 };
    if (nm === "rec") P = { flap: fl, neck: 0.5 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return craneFrame(P);
  },
};

// ════ 기도 깃발 정령 ════ 줄에 꿰인 다섯 빛깔 기도 깃발이 바람에 뱀처럼 휘감겨 날아다닌다 · 맨 앞 깃발에 그려진 눈
//   p: ph · lash(0~1.2 휘두르기) · hurt
const FGK = 0.72;
function flagFrame(p = {}) {
  const W = 72, H = 52, S = sculpt(W, H, { k: FGK, ax: 36 });
  const ph = p.ph ?? 0, ls = p.lash ?? 0;
  const pts = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6, x = 6 + t * 58 + ls * t * t * 8, y = 26 + Math.sin(ph + t * 5) * 9 * (1 - ls * 0.5) - ls * t * 10; pts.push([x, y]); }
  for (let k = 0; k < 6; k++) S.add(capF(pts[k], pts[k + 1], 0.6), mat(ramp(0x8a7a5a)), { z: 0, h: 0.5 });
  for (let k = 0; k < 6; k++) {
    const q = lerp(pts[k], pts[k + 1], 0.5), a = Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]), fl = Math.sin(ph * 2 + k) * 2;
    const c = Math.cos(a), s = Math.sin(a), Q = (u, v) => [q[0] + u * c - v * s, q[1] + u * s + v * c];
    S.add(polyF([Q(-4, 0.5), Q(4, 0.5), Q(4.6 + fl * 0.3, 10), Q(0, 8.4 + fl * 0.4), Q(-4.4, 10)]), FLAGS[k % 5], { z: 1 + k * 0.1, h: 1.2 });
    S.carve(capF(Q(-3, 3), Q(3, 3), 0.4), 0.5);
    k === 5 && !p.hurt && (S.decal(...Q(1.5, 4.5), 0x1a1410), S.decal(...Q(1.2, 4), 0xffffff));
    k === 2 && S.add(ellR(...Q(0, 5), 1.8, 1.8), GLW, { on: 1, h: 0.3 });
  }
  return fin(S.render({ rim: !0 }), p);
}
export const pxFlag = {
  fw: Math.round(72 * FGK), fh: Math.round(52 * FGK), w: 22, h: 14, flying: !0,
  anims: { idle: [6, 10], move: [6, 12], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph, lash: -0.5 * t };
    if (nm === "atk") P = { ph, lash: [0.6, 1.2, 1][f] };
    if (nm === "rec") P = { ph, lash: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return flagFrame(P);
  },
};

// ════ 이끼 꼬마 ════ 둥근 이끼 덩이 몸 · 돌 조각 얼굴 · 머리에 새싹과 작은 꽃 · 짧은 나무뿌리 다리로 통통 뛴다
//   p: squash(-1~1) · jump · hurt
const MSK = 0.72;
function mosslingFrame(p = {}) {
  const W = 46, H = 46, G = H - 1, S = sculpt(W, H, { k: MSK, ax: 23 });
  const sq = p.squash ?? 0, jp = p.jump ?? 0, cx = 22, cy = G - 13 - jp * 8;
  if (jp < 0.5) for (const d of [-5, 5]) S.add(capF([cx + d, cy + 8], [cx + d * 1.3, G - 1], 1.4, 1), WOOD, { z: d < 0 ? -1 : 3, h: 1.2 });
  S.add(ellR(cx, cy, 12 + sq * 2, 11 - sq * 2), MOSS, { z: 1, h: 10 });
  for (let k = 0; k < 10; k++) { const a = (k / 10) * T2, q = pol([cx, cy], a, 11); S.add(capF(q, pol(q, a, 2.4), 1, 0.4), MOSSF, { lift: 0.5, h: 0.6 }); }
  S.add(polyF([[cx + 2, cy - 4], [cx + 10, cy - 3], [cx + 9, cy + 4], [cx + 3, cy + 5]]), STONE, { lift: 2, h: 2, prof: "flat" });
  !p.hurt && S.decal(cx + 5, cy - 0.5, 0x1a1410).decal(cx + 8, cy - 0.5, 0x1a1410).decal(cx + 6.5, cy + 2.5, 0x3a2a20);
  S.add(capF([cx - 2, cy - 10], [cx - 3, cy - 16], 0.7, 0.5), mat(ramp(0x7aa050)), { lift: 1, h: 0.6 });
  S.add(ellR(cx - 5, cy - 16, 2.6, 1.3, -0.5), mat(ramp(0x7aa050), { tex: "leaf" }), { lift: 1, h: 0.8 }).add(ellR(cx - 0.5, cy - 17, 2.6, 1.3, 0.5), mat(ramp(0x7aa050), { tex: "leaf" }), { lift: 1, h: 0.8 });
  S.add(ellR(cx + 6, cy - 10, 1.6, 1.6), mat(ramp(0xe8d0e0)), { lift: 1.5, h: 0.6 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxMossling = {
  fw: Math.round(46 * MSK), fh: Math.round(46 * MSK), w: 16, h: 16,
  anims: { idle: [4, 6], move: [4, 10], wind: [3, 9, !1], atk: [3, 14, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1);
    let P = { squash: [0, 0.2, 0, -0.1][f % 4] };
    if (nm === "move") P = { squash: [0.6, -0.4, -0.2, 0.3][f], jump: [0, 0.8, 1, 0.3][f] };
    if (nm === "wind") P = { squash: 0.8 * t };
    if (nm === "atk") P = { squash: -0.5, jump: [0.6, 1, 0.8][f] };
    if (nm === "rec") P = { squash: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, squash: 0.5 };
    return mosslingFrame(P);
  },
};

// ════ [정예] 종지기 거인 ════ 이끼 수염 늘어진 거구의 수도승 · 등에 큰 청동 종을 지고, 커다란 나무 종망치를 휘두른다 ·
//   팔뚝에 감은 붉은 천 · 종을 치면 울림 고리가 퍼진다
//   p: bob · step · hammer(0 ~ 1.4 들기 · 2 내려침) · ring(종 흔들) · crouch · hurt
const BGK = 0.72;
function bellguardFrame(p = {}) {
  const W = 120, H = 116, G = H - 1, S = sculpt(W, H, { k: BGK, ax: 56 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 5, st = p.step ?? 0, hm = p.hammer ?? 0, rg = p.ring ?? 0, cx = 54;
  // 등의 종 (뒤)
  const bx = cx - 20 + Math.sin(rg) * 2, byy = 34 + b;
  S.add(polyF([[bx - 9, byy - 14], [bx + 9, byy - 14], [bx + 13, byy + 6], [bx + 17, byy + 14], [bx - 17, byy + 14], [bx - 13, byy + 6]]), BRONZEF, { z: -6, h: 10 });
  S.add(ellR(bx, byy - 14, 9, 3.4), BRONZEF, { z: -6, h: 3 });
  S.carve(capF([bx - 14, byy + 6], [bx + 14, byy + 6], 0.6), 0.8);
  S.add(ellR(bx - 3, byy - 4, 5, 3), VERD, { on: 1, h: 0.4 });
  S.add(capF([bx + 8, byy - 10], [cx + 6, 40 + b], 1.4), mat(ramp(0x8a6a3a), { tex: "cloth" }), { z: -2, h: 1.2 });
  // 다리
  for (const [x, far, s] of [[cx - 8, 1, -st], [cx + 10, 0, st]]) { const hp = [x, 78 + b], ft = [x + s, G - 4]; S.add(capF(hp, ft, 7.4, 6), far ? ROBEF : ROBE, { z: far ? -3 : 3, h: 6 }); S.add(ellR(ft[0] + 3, G - 3.4, 8.4, 3.6), far ? mat(rampF(0x4a3a2a)) : mat(ramp(0x5a4632), { tex: "leather" }), { z: far ? -2 : 4, h: 3 }); }
  // 몸 (불룩한 배 · 승복 · 띠)
  S.add(U(ellR(cx, 64 + b, 22, 20), ellR(cx + 4, 46 + b, 18, 14)), ROBE, { z: 1, h: 16 });
  for (const dx of [-10, -2, 6]) S.carve(capF([cx + dx, 50 + b], [cx + dx - 2, 82 + b], 0.6), 0.9);
  S.add(capF([cx - 20, 70 + b], [cx + 22, 68 + b], 3), SASH, { z: 9, h: 2.4 });
  mossCap(S, cx + 2, 36 + b, 17, 4.6);
  // 머리 (대머리 · 짙은 눈썹 · 이끼 수염)
  const hx = cx + 10, hy = 26 + b;
  S.add(ellR(hx, hy, 10, 10), SKIN, { z: 5, h: 9 });
  S.add(capF([hx + 1, hy - 3], [hx + 9, hy - 2.4], 1.4), mat(ramp(0x5a5040), { tex: "fur" }), { lift: 1, h: 1 });
  S.add(polyF([[hx - 1, hy + 5.5], [hx + 10, hy + 5], [hx + 8.6, hy + 17], [hx + 5, hy + 14], [hx + 2, hy + 18], [hx, hy + 11]]), MOSS, { z: 7, h: 2 });
  S.carve(capF([hx + 4, hy + 4.2], [hx + 9, hy + 4], 0.5), 0.8, !1);
  !p.hurt && S.decal(hx + 5, hy - 1, 0x1a1410).decal(hx + 5.4, hy - 1.6, 0xffffff);
  S.add(ellR(hx + 9, hy + 1, 2, 2.4), SKIN, { lift: 1, h: 1.2 });
  // 가까운 팔 + 종망치 (긴 자루 · 둥근 나무 머리 · 쇠테)
  const sh = [cx + 18, 44 + b];
  const hand = hm >= 2 ? [cx + 28, 62 + b] : hm > 0.6 ? pol(sh, -1.7 - (hm - 0.6) * 0.4, 20) : pol(sh, 0.9, 18);
  S.add(capF(sh, hand, 7, 6), SKIN, { z: 10, h: 6 });
  S.add(capF(lerp(sh, hand, 0.45), lerp(sh, hand, 0.75), 7.4, 6.6), mat(ramp(0xa8443e), { tex: "cloth" }), { on: 1, h: 0.8 });
  S.add(ellR(hand[0], hand[1], 6, 5.6), SKIN, { z: 11, h: 5 });
  const ha = hm >= 2 ? 0.95 : hm > 0.6 ? -2.2 : -1.2, hh = pol(hand, ha, 26);
  S.add(capF(pol(hand, ha, -6), hh, 2, 1.8), WOOD, { z: 11.5, h: 1.8 });
  // 망치 머리: 자루와 직각인 굵은 통나무 토막 (양 끝 마구리 · 쇠테 둘)
  const ax = ha + Math.PI / 2, m0 = pol(hh, ax, -11), m1 = pol(hh, ax, 11);
  S.add(capF(m0, m1, 7, 7), mat(ramp(0x8a6038), { tex: "wood", amp: 0.8, dir: ax }), { z: 12, h: 6 });
  for (const e of [m0, m1]) S.add(ellR(e[0], e[1], 3, 6.6, ax), mat(ramp(0xb08a5a), { tex: "wood", amp: 0.5 }), { z: 12.5, h: 4 });
  for (const q of [0.25, 0.75]) S.add(capF(pol(lerp(m0, m1, q), ha, -7.4), pol(lerp(m0, m1, q), ha, 7.4), 1.3), IRONLIKE, { on: 1, h: 0.6 });
  return fin(S.render({ rim: !0 }), p);
}
const IRONLIKE = mat(ramp(0x6a6460), { tex: "metal", amp: 0.8, spec: 0.3 });
export const pxBellguard = {
  fw: Math.round(120 * BGK), fh: Math.round(116 * BGK), w: 34, h: 52,
  anims: { idle: [4, 4], move: [6, 5], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], ring: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.7, ring: Math.sin(ph) * 0.3 };
    if (nm === "move") P = { step: Math.sin(ph) * 5, bob: -Math.abs(Math.sin(ph)) * 2, ring: Math.sin(ph) };
    if (nm === "wind") P = { hammer: 1.4 * t, crouch: -0.2 * t };
    if (nm === "atk") P = { hammer: 2, crouch: [0.4, 0.8, 0.8][f] };
    if (nm === "rec") P = { hammer: t < 0.5 ? 2 : 0.3, crouch: 0.6 * (1 - t) };
    if (nm === "ring") P = { hammer: [1.2, 0.6, 1.2, 0.6][f], ring: [1, -1, 1, -1][f] };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.4, ring: 1 };
    return bellguardFrame(P);
  },
};

// ════ 산수리 ════ 갈색 깃 · 흰 머리 · 노란 갈고리 부리 · 넓게 편 날개 끝 깃 다섯 · 노란 발톱
//   p: flap · tilt · talon · hurt
const EGK = 0.7;
function eagleFrame(p = {}) {
  const W = 82, H = 60, S = sculpt(W, H, { k: EGK, ax: 40 });
  const fl = p.flap ?? 0, tl = p.tilt ?? 0, tn = p.talon ?? 0, cx = 38, cy = 30;
  const R = (x, y) => { const c = Math.cos(tl * 0.5), s = Math.sin(tl * 0.5), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  const wing = (back) => {
    const up = fl * (back ? 0.85 : 1), root = R(cx + 2 + (back ? -4 : 0), cy - 3), a = -Math.PI / 2 - 0.5 + (1 - up) * 0.95;
    S.add(ellR(...pol(root, a + 0.25, 10), 12, 6, a), back ? EAGF : EAG, { z: back ? -5 : 7, h: 2.6 });
    for (let k = 0; k < 6; k++) { const ak = a - 0.15 * k, tip = pol(root, ak, 28 - k * 2); S.add(capF(pol(root, ak, 13), tip, 2.6, 1), back ? EAGF : mat(ramp(0x5a4028), { tex: "feather", amp: 1, dir: ak }), { z: back ? -4.9 : 7.1, h: 1.2 }); }
  };
  wing(1);
  for (const d of [-0.18, 0, 0.18]) S.add(capF(R(cx - 9, cy + 1), R(cx - 20, cy + 2 + d * 10), 3, 2), EAGF, { z: 0, h: 1.4 });
  S.add(ellR(...R(cx, cy + 1), 12, 7.4), EAG, { z: 2, h: 6 });
  for (const d of [-2, 2]) { const hp = R(cx + d, cy + 6), ft = R(cx + d + 2 + tn * 6, cy + 12 + tn * 3); S.add(capF(hp, ft, 2, 1.4), mat(ramp(0xc8a040)), { z: 3, h: 1.4 }); for (const e of [-0.5, 0, 0.5]) S.add(capF(ft, pol(ft, 1 + e - tn * 0.6, 3.4), 0.7, 0.3), mat(ramp(0x2a2420)), { z: 3.5, h: 0.5 }); }
  const hd = R(cx + 13, cy - 5);
  S.add(ellR(hd[0], hd[1], 5.6, 5), mat(ramp(0xece8e0), { tex: "feather", amp: 0.7 }), { z: 4, h: 4.6 });
  S.add(polyF([[hd[0] + 3.6, hd[1] - 1.6], [hd[0] + 10, hd[1]], [hd[0] + 8.6, hd[1] + 3.6], [hd[0] + 3.6, hd[1] + 2]]), BEAK, { z: 5, h: 1.8 });
  !p.hurt && S.decal(hd[0] + 1.6, hd[1] - 1.4, 0x1a1410).decal(hd[0] + 1.2, hd[1] - 2, 0xffd060);
  wing(0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxEagle = {
  fw: Math.round(82 * EGK), fh: Math.round(60 * EGK), w: 20, h: 14, flying: !0,
  anims: { idle: [4, 8], move: [4, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), fl = [1, 0.2, -1, 0.2][f % 4];
    let P = { flap: fl };
    if (nm === "move") P = { flap: fl, tilt: 0.15 };
    if (nm === "wind") P = { flap: 1, tilt: -0.3 * t, talon: 0.5 * t };
    if (nm === "atk") P = { flap: -0.5, tilt: 0.6, talon: 1 };
    if (nm === "rec") P = { flap: fl, talon: 1 - t };
    if (nm === "hurt") P = { hurt: f === 0, flap: 0.6, tilt: -0.4 };
    return eagleFrame(P);
  },
};

// ════ 연 정령 ════ 대나무 살에 한지를 댄 마름모 연(먹으로 그린 사나운 얼굴) · 긴 꼬리 리본 · 끊어진 연줄
//   p: ph · tilt · hurt
const KTK = 0.72;
function kiteFrame(p = {}) {
  const W = 56, H = 70, S = sculpt(W, H, { k: KTK, ax: 28 });
  const ph = p.ph ?? 0, tl = p.tilt ?? 0, cx = 28, cy = 24;
  const R = (x, y) => { const c = Math.cos(tl * 0.5 + Math.sin(ph) * 0.08), s = Math.sin(tl * 0.5 + Math.sin(ph) * 0.08), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
  // 꼬리 리본 (아래로 물결)
  for (let k = 0; k < 6; k++) { const y0 = cy + 18 + k * 7, x0 = cx + Math.sin(ph + k * 0.9) * 4; S.add(polyF([R(x0 - 2, y0), R(x0 + 2, y0), R(x0 + Math.sin(ph + k + 1) * 4 + 1.6, y0 + 6), R(x0 + Math.sin(ph + k + 1) * 4 - 1.6, y0 + 6)]), FLAGS[k % 5], { z: -1, h: 0.8 }); }
  S.add(polyF([R(cx, cy - 20), R(cx + 15, cy), R(cx, cy + 20), R(cx - 15, cy)]), PAPER, { z: 1, h: 2.4, prof: "flat" });
  S.add(polyF([R(cx, cy - 20), R(cx - 15, cy), R(cx, cy + 20)]), PAPERF, { on: 1, h: 0.2 });
  for (const [a, b] of [[R(cx, cy - 20), R(cx, cy + 20)], [R(cx - 15, cy), R(cx + 15, cy)]]) S.add(capF(a, b, 0.7), mat(ramp(0x9a7a4a), { tex: "wood" }), { lift: 0.8, h: 0.6 });
  // 먹 얼굴 (사나운 눈 · 송곳니 입)
  for (const [x, y] of [[cx - 6, cy - 4], [cx + 5, cy - 4]]) { S.add(polyF([R(x - 3, y - 1), R(x + 3, y - 2), R(x + 2, y + 1.6), R(x - 2.6, y + 1.4)]), mat(ramp(0x2a2018)), { on: 1, h: 0.3 }); !p.hurt && S.decal(...R(x + 0.6, y), 0xc83a3a); }
  S.add(polyF([R(cx - 7, cy + 6), R(cx + 7, cy + 6), R(cx + 4, cy + 10), R(cx - 4, cy + 10)]), mat(ramp(0xa8443e)), { on: 1, h: 0.3 });
  for (const x of [cx - 4, cx + 2]) S.add(polyF([R(x, cy + 6), R(x + 2, cy + 6), R(x + 1, cy + 9)]), PAPER, { on: 1, lift: 0.5, h: 0.3 });
  // 끊어진 연줄
  for (let k = 0; k < 8; k++) S.add(capF(R(cx + 2 + k * 2.4, cy + 2 + k * 3 + Math.sin(ph + k) * 1), R(cx + 4 + k * 2.4, cy + 5 + k * 3 + Math.sin(ph + k + 1) * 1), 0.35), mat(ramp(0xd8ccb0)), { z: 0, h: 0.3 });
  return fin(S.render({ rim: !0 }), p);
}
export const pxKite = {
  fw: Math.round(56 * KTK), fh: Math.round(70 * KTK), w: 18, h: 20, flying: !0,
  anims: { idle: [6, 8], move: [6, 10], wind: [3, 9, !1], atk: [3, 16, !1], rec: [3, 9, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "move") P = { ph, tilt: 0.3 };
    if (nm === "wind") P = { ph, tilt: -0.6 * t };
    if (nm === "atk") P = { ph, tilt: [0.6, 1, 0.8][f] };
    if (nm === "rec") P = { ph, tilt: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, ph, tilt: -0.6 };
    return kiteFrame(P);
  },
};

// ════ 경전 두루마리 ════ 양 끝에 나무 축이 달린 누런 두루마리가 반쯤 펼쳐져 떠 있다 · 먹 글자가 빛나며 떠오른다
//   p: open(0.3~1) · glow · ph · hurt
const SCK = 0.72;
function scrollFrame(p = {}) {
  const W = 64, H = 50, S = sculpt(W, H, { k: SCK, ax: 32 });
  const op = p.open ?? 0.6, gl = p.glow ?? 0.4, ph = p.ph ?? 0, cx = 32, cy = 26 + Math.sin(ph) * 1.5, hw = 8 + op * 16;
  // 종이 (살짝 물결)
  S.add(polyF([[cx - hw, cy - 10 + Math.sin(ph) * 1], [cx + hw, cy - 10 - Math.sin(ph) * 1], [cx + hw, cy + 10 - Math.sin(ph) * 1], [cx - hw, cy + 10 + Math.sin(ph) * 1]]), PAPER, { z: 1, h: 2, prof: "flat" });
  for (let k = 0; k < Math.round(op * 5); k++) { const x = cx - hw + 5 + k * 6.4; for (let j = 0; j < 4; j++) S.add(capF([x, cy - 7 + j * 4], [x + 2.4, cy - 6.4 + j * 4], 0.5), mat(gl > 0.8 ? rampGlow(0xffd070) : ramp(0x2a2018)), { on: 1, h: 0.2 }); }
  S.add(ellR(cx, cy, 3.4, 3.4), mat(ramp(0xa8443e)), { on: 1, lift: 0.3, h: 0.3 });
  // 두 축 (나무 + 금 끝)
  for (const d of [-1, 1]) { const x = cx + d * (hw + 1.5); S.add(capF([x, cy - 13], [x, cy + 13], 2.6), WOOD, { z: 3, h: 2.4 }); for (const e of [-1, 1]) S.add(ellR(x, cy + e * 13.5, 2.4, 1.6), BRONZE, { z: 3.5, h: 1.4 }); }
  const C = S.render({ rim: !0 });
  const P = toPx(W, H, SCK);
  if (gl > 0.5) for (let k = 0; k < 4; k++) { const q = P(cx - 10 + k * 7, cy - 16 - ((ph * 3 + k * 5) % 10)); C.px(q[0], q[1], 0xffe090); }
  return fin(C, p);
}
export const pxScroll = {
  fw: Math.round(64 * SCK), fh: Math.round(50 * SCK), w: 22, h: 16, flying: !0,
  anims: { idle: [6, 6], move: [6, 8], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph, open: 0.6, glow: 0.4 };
    if (nm === "wind") P = { ph, open: 0.6 + 0.4 * t, glow: 0.4 + t * 0.6 };
    if (nm === "atk") P = { ph, open: 1, glow: 1.2 };
    if (nm === "rec") P = { ph, open: 1 - 0.4 * t, glow: 1 - t * 0.6 };
    if (nm === "hurt") P = { hurt: f === 0, ph, open: 0.3, glow: 0 };
    return scrollFrame(P);
  },
};

// ════ [정예] 구름 현자 ════ 구름 방석에 가부좌로 떠 있는 늙은 현자 · 흰 눈썹과 땅까지 닿는 흰 수염 · 하늘색 도포 ·
//   둘레를 도는 큰 염주 알 여섯 · 한 손엔 번개를 머금은 부채
//   p: ph · fan(0~1) · bolt · hurt
const SGK = 0.7;
function sageFrame(p = {}) {
  const W = 124, H = 116, S = sculpt(W, H, { k: SGK, ax: 60 });
  const ph = p.ph ?? 0, fn = p.fan ?? 0, cx = 58, cy = 62 + Math.sin(ph) * 2;
  const beads = (front) => { for (let k = 0; k < 6; k++) { const a = ph + k * 1.047, x = cx + Math.cos(a) * 40, y = cy - 6 + Math.sin(a) * 10; (Math.sin(a) >= 0) === front && (S.add(ellR(x, y, 4.4, 4.4), mat(ramp(0x6a3a2a), { spec: 0.5 }), { z: front ? 14 : -6, h: 3.6 }), S.add(ellR(x - 1, y - 1, 1.4, 1.4), GLB, { lift: 1, h: 0.4, z: front ? 14.5 : -5.5 })); } };
  beads(!1);
  // 구름 방석
  for (const [dx, dy, r] of [[-22, 30, 11], [-8, 34, 13], [8, 33, 12], [22, 30, 10], [0, 26, 12]]) S.add(ellR(cx + dx, cy + dy, r, r * 0.7), dy > 30 ? CLOUDF : CLOUD, { z: dy > 30 ? 0 : 1, h: r * 0.6 });
  // 가부좌 다리 (도포)
  S.add(ellR(cx + 2, cy + 18, 24, 9), mat(ramp(0x6a8ab0), { tex: "cloth" }), { z: 3, h: 7 });
  // 몸 (도포 · 넓은 소매)
  S.add(polyF([[cx - 12, cy - 18], [cx + 14, cy - 18], [cx + 20, cy + 14], [cx - 18, cy + 14]]), mat(ramp(0x7a9ac0), { tex: "cloth", amp: 0.9 }), { z: 4, h: 12 });
  for (const dx of [-8, 0, 8]) S.carve(capF([cx + dx * 0.6, cy - 12], [cx + dx, cy + 12], 0.6), 0.8);
  S.add(capF([cx - 14, cy + 2], [cx + 16, cy + 2], 2.2), SASH, { z: 9, h: 1.6 });
  // 머리 + 흰 눈썹 + 긴 흰 수염
  const hx = cx + 4, hy = cy - 28;
  S.add(ellR(hx, hy, 9.4, 9.4), OLD, { z: 6, h: 8 });
  S.add(capF([hx + 1, hy - 3], [hx + 12, hy - 1], 1.6, 0.8), CLOUD, { lift: 1, h: 1 });
  S.add(polyF([[hx - 3, hy + 3], [hx + 9, hy + 3], [hx + 7, hy + 22], [hx + 3, hy + 34], [hx, hy + 22]]), CLOUD, { z: 10, h: 3 });
  for (const dx of [0, 3, 6]) S.carve(capF([hx + dx, hy + 6], [hx + dx - 1, hy + 24], 0.4), 0.6);
  S.carve(capF([hx + 3, hy - 0.6], [hx + 7, hy - 0.8], 0.4), 0.8, !1);
  S.add(polyF([[hx - 8, hy - 6], [hx + 2, hy - 10], [hx + 8, hy - 7], [hx, hy - 4]]), OLD, { lift: 1, h: 1.6 });
  // 가까운 소매 + 번개 부채
  const sh = [cx + 14, cy - 12], hand = pol(sh, 0.6 - fn * 1.8, 14);
  S.add(U(capF(sh, hand, 5.6, 4.6)), mat(ramp(0x7a9ac0), { tex: "cloth" }), { z: 11, h: 4.4 });
  S.add(ellR(hand[0], hand[1], 2.6, 2.6), OLD, { z: 12, h: 2 });
  const fa = -1.2 - fn * 0.8;
  for (let k = 0; k < 7; k++) { const a = fa - 0.6 + k * 0.2; S.add(polyF([hand, pol(hand, a - 0.09, 16), pol(hand, a + 0.09, 16)]), k % 2 ? PAPER : PAPERF, { z: 12.5, h: 1.2 }); }
  S.add(capF(pol(hand, fa - 0.3, 10), pol(hand, fa + 0.3, 13), 0.7), GLB, { lift: 1, h: 0.4, z: 13 });
  beads(!0);
  return fin(S.render({ rim: !0 }), p);
}
export const pxSage = {
  fw: Math.round(124 * SGK), fh: Math.round(116 * SGK), w: 34, h: 40, flying: !0,
  anims: { idle: [6, 6], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], call: [4, 8, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { ph };
    if (nm === "wind") P = { ph: ph * 2, fan: t };
    if (nm === "atk") P = { ph, fan: 1, bolt: 1 };
    if (nm === "rec") P = { ph, fan: 1 - t };
    if (nm === "call") P = { ph: ph * 3, fan: 0.5 };
    if (nm === "hurt") P = { hurt: f === 0, ph };
    return sageFrame(P);
  },
};
