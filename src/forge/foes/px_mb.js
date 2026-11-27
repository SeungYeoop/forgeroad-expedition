// 모스바크 몬스터 12종 (2D 픽셀 손그림, 오른쪽을 본다) — 이끼 덮인 거목 숲
//   땅: 이끼 거북 · 가시덩굴 · 사슴벌레 기사 · [정예] 이끼 트롤
//   수관(하늘섬): 숲 올빼미 · 도토리 다람쥐 · 잎사귀 나방 · [정예] 거대 사마귀
//   땅속(이끼 굴): 독두꺼비 · 반딧불 무리 · 개울 가재 · [정예] 늪 두꺼비 왕
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik, ramp, rampF, rampGlow, mixc, dots, strokes, rot, eye, glass, limb, gait4, gait2, flapOf, spec, done, flash, T2, L } from "./kit.js";
import { sculpt, mat } from "./px3.js";

const MOSS = ramp(0x5a9a3a), MOSSD = ramp(0x3e7a2e), BARK = ramp(0x6a4a30), BARKF = rampF(0x5a3e28), FERN = ramp(0x7ab848);
const mossy = (C, pts, r = 1.4) => pts.forEach(([x, y, s = 1]) => C.part(ellR(x, y, r * s * 1.4, r * s), MOSS, { sep: !1, shine: 1 }));

// ════ 이끼 거북 ════ 이끼와 고사리가 자란 둥근 등껍질. 껍질에 숨어 막고, 껍질째 굴러 들이받는다. 뒤집히면 버둥버둥
//   p: legs · hide 숨기(0~1) · roll 구르기 각 · flip 뒤집힘 · head · hurt
const TSK = ramp(0x8a8a50), TSKF = rampF(0x7a7a44), SHELL = ramp(0x5a5a36);
const done3 = (C, p) => (p.hurt ? flash(C) : C);
function glint3(C, P, x, y, r = 2, c = 0xffffff) { const q = P(x, y); C.px(q[0], q[1], c); for (let k = 1; k <= r; k++) { C.px(q[0] + k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0] - k, q[1], k < r ? c : 0xb8e0ff); C.px(q[0], q[1] + k, 0xb8e0ff); C.px(q[0], q[1] - k, 0xb8e0ff); } }
const M_MOSS = mat(ramp(0x6a9a44), { tex: "leaf", amp: 1.3 }), M_MOSSD = mat(ramp(0x4e7a36), { tex: "leaf", amp: 1.2 }), M_BARK = mat(ramp(0x6a4a30), { tex: "wood", amp: 1.2, dir: 1.57 }), M_VD = mat(ramp(0x100c08));
const M_toPx = (W, H, K, AX = W / 2) => (x, y) => [Math.round(W * K) / 2 + (x - AX) * K, H * K + (y - H) * K];
const M_moss = (S, pts) => pts.forEach(([x, y, r]) => S.add(U(ellR(x, y, r * 1.4, r), ellR(x + r * 0.8, y + r * 0.4, r * 0.8, r * 0.7)), M_MOSS, { lift: 0.6, h: r * 0.6 }));
function turtleFrame(p = {}) {
  const W = 74, H = 48, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 37 });
  const lg = { fn: [0, 0], ff: [0, 0], bn: [0, 0], bf: [0, 0], ...(p.legs ?? {}) }, hd = p.hide ?? 0, rl = p.roll ?? 0, fl = p.flip ?? 0, cx = 36;
  const SK = mat(ramp(0x7a8a5a), { tex: "scale", amp: 1, spec: 0.3 }), SKF = mat(rampF(0x5e6e46), { tex: "scale" }), SH = mat(ramp(0x6a5a3a), { tex: "wood", amp: 1.2 });
  const cy = fl ? G - 10 : G - 13;
  const leg = (x, o, far) => { if (hd > 0.6 && !fl) return; const r = [x, fl ? cy - 8 : cy + 6], f = fl ? [x + o[0], cy - 14 - o[1]] : [x + o[0], G - 1 - o[1]]; S.add(capF(r, f, 3.4, 3), far ? SKF : SK, { z: far ? -3 : 5, h: 2.4 }); S.add(ellR(f[0] + 1, f[1], 3.6, 1.6), far ? SKF : SK, { z: far ? -2.9 : 5.1, h: 1 }); };
  leg(cx + 12, lg.ff, 1), leg(cx - 12, lg.bf, 1);
  // 등껍질 (구르면 회전 무늬)
  const shell = fl ? minus(ellR(cx, cy, 22, 14), (x, y) => y < cy - 2) : minus(ellR(cx, cy, 22, 15), (x, y) => y > cy + 6);
  S.add(shell, SH, { z: 1, h: 13 });
  for (let k = 0; k < 6; k++) { const a = rl + k * 1.05; const q = [cx + Math.cos(a) * 11, cy - (fl ? -4 : 4) + Math.sin(a) * 6]; S.carve(minus(ellR(q[0], q[1], 5, 4), ellR(q[0], q[1], 4, 3)), 0.8); }
  S.add(capF([cx - 22, cy + (fl ? -2 : 6)], [cx + 22, cy + (fl ? -2 : 6)], 2), mat(ramp(0xa89060), { tex: "wood" }), { z: 1.2, h: 1.4 });
  if (!fl) { M_moss(S, [[cx - 8, cy - 12, 3], [cx + 5, cy - 14, 2.6], [cx + 14, cy - 8, 2], [cx - 15, cy - 5, 2]]); for (const [x, a] of [[cx - 4, -1.9], [cx + 2, -1.4]]) { const r = [x, cy - 13]; S.add(capF(r, pol(r, a, 8), 0.6), M_MOSSD, { z: 3, h: 0.4 }); for (let k = 0; k < 4; k++) S.add(ellR(...pol(pol(r, a, 2 + k * 1.6), a + 1.57 * (k % 2 ? 1 : -1), 1.4), 1.4, 0.7), M_MOSS, { z: 3.1, h: 0.4 }); } }
  // 머리
  if (hd < 0.8 && !fl) { const hx = cx + 24 - hd * 8, hy = cy + 2 + (p.head ?? 0) * 2; S.add(U(capF([cx + 16, cy + 3], [hx, hy], 4, 3.6), ellR(hx + 2, hy, 5, 4.4)), SK, { z: 2, h: 4 }); S.add(capF([hx + 2, hy + 2], [hx + 7, hy + 1.6], 0.5), M_VD, { on: 1, lift: 0.2, h: 0.2 }); !p.hurt && S.decal(hx + 3, hy - 1.6, 0x101010); }
  leg(cx + 15, lg.fn, 0), leg(cx - 9, lg.bn, 0);
  return done3(S.render({ rim: !0 }), p);
}
export const pxTurtle = spec(53, 35, 26, 18,
  { idle: [4, 5], move: [6, 8], wind: [3, 10, !1], atk: [6, 20], rec: [3, 10, !1], hurt: [2, 10, !1], hide: [2, 4], flip: [4, 10] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { head: Math.sin(ph) * 0.4 };
    if (nm === "move") return { legs: gait4(f, n, 3, 1.5) };
    if (nm === "wind" || nm === "hide") return { hide: nm === "hide" ? 1 : t };
    if (nm === "atk") return { hide: 1, roll: ph };
    if (nm === "rec") return { hide: 1 - t };
    if (nm === "flip") return { flip: 1, legs: { fn: [Math.sin(ph * 2) * 3, 4], ff: [Math.cos(ph * 2) * 3, 4], bn: [-Math.sin(ph * 2) * 3, 4], bf: [-Math.cos(ph * 2) * 3, 4] } };
    return { hurt: f === 0, hide: 0.4 };
  }, turtleFrame);

// ════ 가시덩굴 ════ 덤불로 숨어 있다가 꽃봉오리 머리를 쳐들고 가시 덩굴을 채찍처럼 휘두른다
//   p: rise(0 덤불 ~ 1 쳐듦) · whip 채찍(-1 뒤로 ~ 1 앞으로 길게) · open 봉오리 벌림 · hurt
const VINE = ramp(0x3e7a32), VINEF = rampF(0x346a2a), BUD = ramp(0xb03a4a), THORN = ramp(0xe0d0a0);
function thornFrame(p = {}) {
  const W = 84, H = 64, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 36 });
  const rs = p.rise ?? 1, wh = p.whip ?? 0, op = p.open ?? 0, cx = 30;
  const VN = mat(ramp(0x4a7a2e), { tex: "wood", amp: 1, dir: 1.57 }), VNF = mat(rampF(0x3a6024), { tex: "wood" }), TH = mat(ramp(0xd8c8a0), { spec: 0.3 }), BUD = mat(ramp(0xc84a5a), { tex: "skin", amp: 0.7, spec: 0.3 });
  // 덤불 밑동
  S.add(U(ellR(cx, G - 6, 18, 7), ellR(cx - 10, G - 9, 8, 6), ellR(cx + 10, G - 9, 9, 6)), M_MOSSD, { z: 0, h: 6 });
  for (let k = 0; k < 9; k++) S.add(ellR(cx - 16 + k * 4, G - 12 + Math.sin(k * 1.7) * 3, 2.6, 1.6, k * 0.6), k % 2 ? M_MOSS : M_MOSSD, { lift: 0.6, h: 0.8 });
  // 줄기 (쳐들기 · 채찍)
  if (rs > 0.05) {
    const pts = [[cx, G - 8]]; let a = -Math.PI / 2;
    for (let k = 0; k < 9; k++) { a += (k < 4 ? 0.02 : 0.16 + wh * 0.22) * (1 + wh * 0.5); pts.push(pol(pts[k], a + Math.sin(k * 0.8) * 0.06, (4.6 + wh * Math.max(0, k - 4) * 1.2) * rs)); }
    S.add(U(...pts.slice(1).map((q, k) => capF(pts[k], q, 2.6 - k * 0.18, 2.4 - k * 0.18))), VN, { z: 1, h: 1.8 });
    pts.forEach((q, k) => k > 0 && k % 1 === 0 && S.add(polyF([pol(q, -2.4 + k, 1.6), pol(q, -1.6 + k, 4), pol(q, -0.8 + k, 1.6)]), TH, { z: 1.2, h: 0.4, prof: "sharp" }));
    const hd = pts[9], ha = Math.atan2(hd[1] - pts[8][1], hd[0] - pts[8][0]);
    for (let k = 0; k < 5; k++) { const pa = ha + (k - 2) * (0.5 + op * 0.25); S.add(polyF([pol(hd, pa + 0.4, 2), pol(hd, pa, 7 + op * 2), pol(hd, pa - 0.4, 2)]), k % 2 ? BUD : mat(ramp(0xa83a4a), { tex: "skin" }), { z: 2 + (k === 2 ? 0.4 : 0), h: 1.2 }); }
    S.add(ellR(hd[0], hd[1], 3, 3), mat(ramp(0xf0d060), { tex: "fur" }), { z: 2.6, h: 1.4 });
    op > 0.5 && S.add(ellR(...pol(hd, ha, 1.4), 1.4, 1.4), M_VD, { z: 2.8, h: 0.3 });
  }
  return done3(S.render({ rim: !0 }), p);
}
export const pxThorn = spec(60, 46, 18, 22,
  { hide: [1, 1], rise: [4, 12, !1], idle: [4, 6], move: [4, 6], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "hide") return { rise: 0 };
    if (nm === "rise") return { rise: t, open: t };
    if (nm === "wind") return { whip: -t, open: 0.5 };
    if (nm === "atk") return { whip: [0.4, 1, 0.9][f], open: 1 };
    if (nm === "rec") return { whip: 0.9 * (1 - t), open: 0.6 * (1 - t) };
    if (nm === "hurt") return { hurt: f === 0, whip: -0.3 };
    return { whip: Math.sin(ph) * 0.1, open: 0.2 };
  }, thornFrame);

// ════ 사슴벌레 기사 ════ 뒷다리로 선 사슴벌레. 등딱지는 갑옷, 거대한 큰턱으로 붙잡아 뒤로 내던진다. 딱지를 펴고 짧게 난다
//   p: bob · legs · jaw 큰턱 벌림 · lift 들어올림 · fly 날개 · lean · hurt
const STAG = ramp(0x4a2a1e), STAGF = rampF(0x3e2218), MAND = ramp(0x7a4a2a);
function stagFrame(p = {}) {
  const W = 70, H = 66, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const b = p.bob ?? 0, g = p.legs ?? { n: [0, 0], f: [0, 0] }, jw = p.jaw ?? 0, lf = p.lift ?? 0, fy = p.fly ?? 0, ln = p.lean ?? 0, cx = 28;
  const CH = mat(ramp(0x5a3a2a), { tex: "metal", amp: 0.6, spec: 0.9 }), CHF = mat(rampF(0x40281c), { tex: "metal" }), MAN = mat(ramp(0x7a4a2a), { tex: "metal", amp: 0.8, spec: 0.7 });
  const lx = ln * 8;
  // 날개 (날 때)
  if (fy > 0) for (const [d, z] of [[-1, -3], [1, -2]]) S.add(U(ellR(cx - 6 + d * 2, 24 + b - fy * 6, 4 + fy * 2, 16, -0.6 + d * 0.3)), mat(ramp(0xd8d0b8, { hi: 0.6 }), { tex: "glass", amp: 1, spec: 0.8 }), { z, h: 0.6 });
  // 다리 (뒷다리로 섬 · 가시 마디)
  for (const [o, far, d] of [[g.f, 1, -3], [g.n, 0, 3]]) { const hp = [cx + d, 44 + b], kn = [cx + d + 4, 51 + b], ft = [cx + d + o[0], G - 1 - o[1]]; S.add(U(capF(hp, kn, 2.2, 1.8), capF(kn, ft, 1.8, 1.2)), far ? CHF : CH, { z: far ? -2 : 3, h: 1.4 }); S.add(polyF([[kn[0], kn[1] - 1], [kn[0] + 3, kn[1] - 1.4], [kn[0] + 1, kn[1] + 1]]), far ? CHF : CH, { z: far ? -1.9 : 3.1, h: 0.4 }); S.add(U(capF(ft, [ft[0] + 3, ft[1]], 0.8), capF(ft, [ft[0] - 2, ft[1]], 0.8)), far ? CHF : CH, { z: far ? -1.8 : 3.2, h: 0.4 }); }
  // 몸 (딱지 = 갑옷)
  S.add(U(ellR(cx + lx * 0.4, 36 + b, 9.4, 12)), CH, { z: 1, h: 8 });
  S.carve(capF([cx + lx * 0.4, 25 + b], [cx + lx * 0.4, 47 + b], 0.5), 0.9, !1);
  S.add(capF([cx - 6 + lx * 0.4, 28 + b], [cx - 5 + lx * 0.4, 40 + b], 0.8), mat(ramp(0x9a6a4a), { spec: 0.8 }), { on: 1, lift: 0.3, h: 0.2 });
  S.add(capF([cx - 8 + lx * 0.4, 38 + b], [cx + 8 + lx * 0.4, 38 + b], 1.4), mat(ramp(0x6a5030), { tex: "leather" }), { z: 1.4, h: 0.6 });
  // 앞다리 둘 (팔)
  for (const [far, d] of [[1, -1], [0, 1]]) { const sh = [cx + 4 + lx * 0.6, 28 + b], hd = [cx + 10 + lx + lf * 4, 36 + b - lf * 12 + d * 2]; S.add(U(capF(sh, lerp(sh, hd, 0.5), 2, 1.6), capF(lerp(sh, hd, 0.5), hd, 1.6, 1.2)), far ? CHF : CH, { z: far ? -1 : 5, h: 1.2 }); }
  // 머리 + 거대 큰턱
  const hx = cx + 6 + lx, hy = 20 + b;
  S.add(U(ellR(hx, hy, 7, 5.4)), CH, { z: 3, h: 5 });
  const MAN2 = mat(ramp(0x9a5a34), { tex: "metal", amp: 0.8, spec: 0.9 });
  for (const [d, z] of [[-1, 3.6], [1, 2.8]]) { const r = [hx + 5, hy + d * 2.4], a = d * (0.35 + jw * 0.35) - lf * 0.6, m = pol(r, a, 11), t = pol(m, a - d * 1.2, 7); S.add(U(capF(r, m, 2.6, 2), capF(m, t, 2, 0.5)), d < 0 ? MAN2 : MAN, { z, h: 1.8 }); S.add(polyF([pol(lerp(r, m, 0.5), a + d * 1.57, 1.4), pol(lerp(r, m, 0.6), a + d * 1.57 - d * 0.6, 4.4), pol(lerp(r, m, 0.72), a + d * 1.57, 1.4)]), d < 0 ? MAN2 : MAN, { z: z + 0.05, h: 0.6, prof: "sharp" }); }
  !p.hurt && S.decal(hx + 2, hy - 2, 0xffb040);
  return done3(S.render({ rim: !0 }), p);
}
export const pxStag = spec(50, 48, 18, 28,
  { idle: [4, 6], move: [8, 12], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], toss: [4, 12, !1], fly: [4, 18] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, jaw: 0.2 + 0.1 * Math.sin(ph) };
    if (nm === "move") { const g = gait2(f, n, 3.5, 2); return { legs: g, bob: g.bob, lean: 0.15 }; }
    if (nm === "wind") return { jaw: t * 1.2, lean: -0.2 * t };
    if (nm === "atk") return { jaw: [1.2, -0.2, -0.3][f], lean: 0.4 };
    if (nm === "toss") return { jaw: -0.3, lift: [0.5, 1, 1, 0.2][f], lean: [-0.2, -0.5, -0.6, 0.3][f] };
    if (nm === "fly") return { fly: 0.6 + 0.4 * Math.abs(Math.sin(ph * 2)), jaw: 0.8, legs: { n: [2, 3], f: [-1, 3] } };
    if (nm === "rec") return { jaw: 0.3, lean: 0.4 * (1 - t) };
    return { hurt: f === 0, lean: -0.4, jaw: 0.5 };
  }, stagFrame);

// ════ [정예] 이끼 트롤 ════ (큰 몬스터 조각 도구) 구부정한 거구 · 땅에 닿을 듯 긴 팔 · 등을 덮은 이끼와 버섯 · 이끼 수염 · 통나무 몽둥이. 맞지 않으면 이끼가 빛나며 상처를 메운다
//   p: bob · step · log 통나무(0 끌기 ~ 0.5 세워 들기 ~ 1 어깨 뒤로 ~ 2 내려침) · rock 바위 들기(1)/던짐(2) · regen 재생 빛 · fl 깜빡 · hurt
const TRK = 0.7;
const TR_SK = mat(ramp(0x6e7e5c), { tex: "skin", amp: 0.6 }), TR_SKF = mat(ramp(0x5e6e50, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.5 }), TR_BEL = mat(ramp(0x94a27a), { tex: "skin", amp: 0.4 });
const TR_MOSS = mat(ramp(0x4e8c36), { tex: "fur", amp: 0.9, dir: 1.57 }), TR_MOSSD = mat(ramp(0x467e30), { tex: "fur", amp: 0.9, dir: 1.57 });
const TR_LOGC = ramp(0x7a5432), TR_LOGE = mat(ramp(0xc8a070), { tex: "wood", amp: 0.4 }), TR_TUSK = mat(ramp(0xece0bc), { spec: 0.4 });
const TR_CAP = mat(ramp(0xc4503a), { spec: 0.35 }), TR_STEM = mat(ramp(0xe4d8b4)), TR_ROCK = mat(ramp(0x7e786a), { tex: "stone", amp: 0.8 }), TR_GLOW = mat(rampGlow(0x9cff64));
const TR_KF = [[1.45, 1.3, 0.3], [0.9, -1.2, -1.75], [-1.3, -2.2, -2.8]];
function trollFrame(p = {}) {
  const W = 124, H = 108, G = H - 1, S = sculpt(W, H, { k: p.k ?? TRK, ax: 56 });
  const b = p.bob ?? 0, st = p.step ?? 0, lg = p.log ?? 0, rk = p.rock ?? 0, rg = p.regen ?? 0, fl = p.fl ?? 0;
  // 먼 팔: 늘어뜨림(손등이 땅에 닿을 듯) / 바위 들어 올림 / 던진 뒤 앞으로
  const sF = [52, 50 + b], hF = rk === 1 ? [56, 28 + b] : rk === 2 ? [98, 46 + b] : [44, 94 + b], eF = ik(sF, hF, 22, 22, rk === 1 ? 1 : -1);
  S.add(U(capF(sF, eF, 7, 6), capF(eF, hF, 6, 5.4)), TR_SKF, { z: -5, h: 6 });
  S.add(ellR(hF[0], hF[1], 6.4, 5.6), TR_SKF, { z: -4, h: 5 });
  if (rk === 1) {
    S.add(ellR(hF[0] + 1, hF[1] - 12, 12, 10.5), TR_ROCK, { z: -3, h: 10 });
    S.carve(capF([hF[0] - 6, hF[1] - 16], [hF[0] + 2, hF[1] - 10], 0.6), 1).carve(capF([hF[0] + 4, hF[1] - 20], [hF[0] + 8, hF[1] - 14], 0.5), 0.8);
    S.add(ellR(hF[0] - 3, hF[1] - 19, 5, 3), TR_MOSS, { on: 1, h: 0.8 });
  }
  // 다리 (짧고 휜 다리 + 넓적한 발과 발가락)
  for (const [x, far, sg] of [[46, 1, -st], [64, 0, st]]) {
    const M0 = far ? TR_SKF : TR_SK, hip = [x, 78 + b], ft = [x + sg, G - 4], kn = [x + 5 + sg * 0.5, 92 + b * 0.5];
    S.add(U(ellR(hip[0], hip[1], 10, 8), capF(hip, kn, 9, 7.4), capF(kn, ft, 7.4, 6)), M0, { z: far ? -2 : 3, h: 8 });
    S.add(ellR(ft[0] + 3, G - 3, 10, 3.8), M0, { z: far ? -1.5 : 3.5, h: 3 });
    for (const d of [0, 1, 2]) S.add(ellR(ft[0] + 10 + d * 2.2, G - 2.4 + d * 0.3, 2.4, 2), M0, { z: far ? -1 : 4, h: 2 });
    far || S.carve(capF([kn[0] - 5, kn[1] + 1], [kn[0] + 3, kn[1] + 2], 0.6), 0.8);
  }
  // 몸통 (구부정한 등 혹) + 배 + 배 주름
  S.add(U(ellR(54, 64 + b, 24, 19), ellR(58, 46 + b, 21, 17)), TR_SK, { z: 0, h: 18 });
  S.add(ellR(66, 70 + b, 13, 11), TR_BEL, { blend: 4, h: 4 });
  for (const y of [64, 69, 74]) S.carve(capF([59, y + b], [72, y + 1 + b], 0.6), 0.6);
  // 등 이끼 덮개 (털결이 아래로) + 늘어진 이끼 가닥
  S.add(U(ellR(50, 38 + b, 19, 10, -0.25), ellR(38, 50 + b, 9, 13)), TR_MOSS, { lift: 2, h: 3 });
  for (const [x, y, l] of [[30, 56, 10], [35, 61, 8], [41, 48, 6], [58, 44, 7], [47, 47, 5]]) S.add(capF([x, y + b], [x - 0.6, y + l + b], 1.8, 0.9), TR_MOSS, { lift: 1.6, h: 1.4 });
  // 등 버섯 셋 (붉은 갓 + 흰 점) + 고사리
  for (const [x, y, s] of [[40, 30, 1], [49, 26, 0.8], [33, 38, 0.7]]) {
    S.add(capF([x, y + 6 * s + b], [x + 0.6, y + b], 1.5 * s), TR_STEM, { lift: 3, h: 1.6 });
    S.add(ellR(x + 0.6, y + b, 5.4 * s, 3.2 * s), TR_CAP, { lift: 5, h: 3 * s, prof: "soft" });
    p.block || (S.decal(x - 1.4 * s, y - 1 * s + b, 0xfff4e0), S.decal(x + 2 * s, y - 0.6 * s + b, 0xfff4e0));
  }
  for (const a of [-2.4, -2.0, -1.65]) S.add(capF([60, 31 + b], pol([60, 31 + b], a, 9), 1.2, 0.5), TR_MOSS, { lift: 3, h: 1 });
  // 머리 (앞으로 쑥, 낮게) · 처진 귀 · 눈썹 · 작은 눈 · 큰 매부리코 · 아래턱 엄니 · 이끼 수염
  const hx = 86, hy = 50 + b;
  S.add(polyF([[hx - 8, hy - 6], [hx - 22, hy - 11], [hx - 10, hy + 2]]), TR_SK, { z: 4, h: 3 });
  S.add(ellR(hx, hy, 11, 10), TR_SK, { z: 6, h: 10 });
  S.add(capF([hx - 7, hy - 6], [hx + 8, hy - 5], 3, 2.4), TR_SK, { blend: 2, h: 2.4 });
  S.add(ellR(hx + 3, hy + 7, 9, 4.5), TR_SK, { z: 7, h: 5 });
  S.add(U(ellR(hx + 11, hy + 1, 5.6, 5), capF([hx + 8, hy - 3], [hx + 12, hy + 2], 2.4)), TR_SK, { z: 8, h: 6 });
  S.carve(ellR(hx + 13, hy + 3.5, 1.2, 0.8), 1, !1).carve(capF([hx - 3, hy + 4.5], [hx + 8, hy + 5], 0.6), 1.2, !1);
  for (const x of [hx + 1, hx + 6]) S.add(polyF([[x - 1.4, hy + 6], [x + 1.4, hy + 6], [x + 0.6, hy + 1.5]]), TR_TUSK, { z: 9, h: 1.6 });
  S.add(polyF([[hx - 6, hy + 8], [hx + 10, hy + 9], [hx + 9, hy + 16], [hx + 6, hy + 14], [hx + 4, hy + 20], [hx + 1, hy + 15], [hx - 2, hy + 19], [hx - 4, hy + 13]]), TR_MOSSD, { z: 8.5, h: 2 });
  if (!p.block && !p.hurt) for (const [x, y] of [[hx + 1, hy - 2], [hx + 6, hy - 1.6]]) S.decal(x, y, 0xffd040).decal(x, y - 1, 0x2a1a08);
  // 가까운 팔 + 통나무 몽둥이 (손잡이 쪽이 가늘고 끝이 굵다 · 끝에 이끼와 잘린 면 · 잔가지)
  const kk = lg > 1 ? [0.55, 0.95, 1.0] : lg > 0.5 ? TR_KF[1].map((v, i) => L(v, TR_KF[2][i], (lg - 0.5) * 2)) : TR_KF[0].map((v, i) => L(v, TR_KF[1][i], lg * 2));
  const s0 = [72, 54 + b], e0 = pol(s0, kk[0], 20), hd = pol(e0, kk[1], 19), dv = [Math.cos(kk[2]), Math.sin(kk[2])];
  const ln = dv[1] > 0.05 ? Math.min(36, (G - 5 - hd[1]) / dv[1]) : 36, lt = [hd[0] + dv[0] * ln, hd[1] + dv[1] * ln];
  const LG = mat(TR_LOGC, { tex: "wood", amp: 0.8, dir: kk[2] });
  S.add(capF(pol(hd, kk[2] + Math.PI, 5), lt, 3.8, 6.2), LG, { z: 9, h: 6 });
  S.add(ellR(lt[0], lt[1], 2, 5.6, kk[2]), TR_LOGE, { z: 9.6, h: 5 });
  S.add(ellR(...lerp(hd, lt, 0.78), 5, 3, kk[2]), TR_MOSS, { on: 1, h: 1 });
  const bq = lerp(hd, lt, 0.55);
  S.add(capF(bq, pol(bq, kk[2] - 1.0, 7), 1.7, 0.8), LG, { z: 8.8, h: 1.4 });
  S.add(ellR(...pol(bq, kk[2] - 1.0, 8), 2.4, 1.4, kk[2]), TR_MOSS, { z: 8.9, h: 1 });
  S.carve(ellR(...lerp(hd, lt, 0.35), 1.4, 1), 0.8);
  S.add(U(capF(s0, e0, 7.6, 6.4), capF(e0, hd, 6.4, 5.6)), TR_SK, { z: 10, h: 7 });
  S.add(ellR(hd[0], hd[1], 6.4, 5.8), TR_SK, { z: 11, h: 6 });
  S.add(ellR(...lerp(e0, hd, 0.4), 4, 2.6, kk[1]), TR_MOSS, { on: 1, h: 1 });
  // 재생: 이끼가 빛나고 빛 알갱이가 오른다
  if (rg > 0 && !p.block) {
    for (const [x, y] of [[44, 36], [52, 34], [38, 48], [60, 40], [34, 56], [hx, hy + 14]]) S.add(ellR(x, y + b, 1.6, 1.3), TR_GLOW, { on: 1, h: 0.6, lift: 0.5 });
    for (const [x, y] of [[30, 26], [50, 18], [66, 24], [24, 44], [76, 34]]) S.decal(x + (fl % 2), y + b - (fl % 4) * 2, 0xd8ffb0);
  }
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxTroll = {
  fw: Math.round(124 * TRK), fh: Math.round(108 * TRK), w: 32, h: 50,
  anims: { idle: [4, 5], move: [6, 7], wind: [4, 8, !1], atk: [3, 14, !1], rec: [3, 8, !1], hurt: [2, 10, !1], throw: [4, 10, !1], regen: [4, 8] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = { log: 0 };
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.6, log: 0.04 * Math.sin(ph) };
    if (nm === "move") P = { step: Math.sin(ph) * 4, bob: -Math.abs(Math.sin(ph)) * 1.5, log: 0.06 };
    if (nm === "wind") P = { log: 0.2 + 0.8 * t, bob: -t };
    if (nm === "atk") P = { log: 2, bob: 2 };
    if (nm === "rec") P = { log: f === 0 ? 2 : 0.3 * (1 - t), bob: 2 * (1 - t) };
    if (nm === "throw") P = { rock: f < 2 ? 1 : 2, log: 0.05, bob: f < 2 ? -1 : 1 };
    if (nm === "regen") P = { regen: 1, fl: f, bob: Math.sin(ph) * 0.4 };
    if (nm === "hurt") P = { hurt: f === 0, bob: 1, log: 0.3 };
    return trollFrame(P);
  },
};

// ════ 숲 올빼미 ════ 동그란 몸 · 귀깃 · 커다란 눈. 가지에 앉아 고개를 돌리다 소리 없이 급강하해 할퀸다
//   p: perch 앉음 · flap · turn 고개 돌림 · talon 발톱 뻗기 · hurt
const OWL = ramp(0x8a6a48), OWLF = rampF(0x7a5c3e), OWLB = ramp(0xd8c8a0);
function owlFrame(p = {}) {
  const W = 60, H = 58, S = sculpt(W, H, { k: 0.72, ax: 30 });
  const pc = p.perch ?? 0, fl = p.flap ?? 0, tn = p.turn ?? 0, ta = p.talon ?? 0, cx = 30, cy = 28;
  const OW = mat(ramp(0x8a6a4a), { tex: "feather", amp: 1.1, dir: 1.57 }), OWF = mat(rampF(0x6a5038), { tex: "feather", dir: 1.57 }), OWC = mat(ramp(0xd8c8a8), { tex: "feather", amp: 0.8 }), YL = mat(ramp(0xe8c040), { spec: 0.6 });
  if (pc) S.add(capF([cx - 18, cy + 15], [cx + 18, cy + 14], 3), M_BARK, { z: -2, h: 2 });
  const wing = (far, d) => { if (pc) { S.add(ellR(cx + d * 9, cy + 2, 5, 11, d * 0.2), far ? OWF : OW, { z: far ? 0.5 : 3, h: 3 }); return; } const r = [cx + d * 6, cy - 3], a = d > 0 ? -0.6 - fl * 0.8 : -2.5 + fl * 0.8, tip = pol(r, a, 22), m = pol(r, a + d * 0.6, 16); S.add(polyF([r, tip, lerp(tip, m, 0.5), m, [cx + d * 4, cy + 6]]), far ? OWF : OW, { z: far ? -2 : 5, h: 1.6 }); for (let k = 0; k < 3; k++) S.carve(capF(lerp(r, tip, 0.4), lerp(m, tip, 0.2 + k * 0.3), 0.35), 0.6); };
  wing(1, -1);
  S.add(U(ellR(cx, cy + 2, 10, 13)), OW, { z: 1, h: 9 });
  S.add(ellR(cx + 1, cy + 5, 6.4, 8.4), OWC, { on: 1, lift: 0.3, h: 0.8 });
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) S.add(capF([cx - 3 + k * 3, cy + 1 + r * 4], [cx - 2 + k * 3, cy + 2.4 + r * 4], 0.5), OWF, { on: 1, lift: 0.4, h: 0.2 });
  // 머리 (얼굴 원반 · 귀깃 · 큰 눈)
  const hx = cx + tn * 0.6, hy = cy - 12;
  S.add(ellR(hx, hy, 9, 8), OW, { z: 2, h: 6 });
  for (const d of [-1, 1]) S.add(polyF([[hx + d * 5, hy - 5], [hx + d * 9, hy - 13], [hx + d * 2, hy - 7]]), OWF, { z: 2.2, h: 1.4 });
  S.add(U(ellR(hx - 3.6 + tn, hy, 4.4, 4.2), ellR(hx + 3.6 + tn, hy, 4.4, 4.2)), OWC, { z: 2.4, h: 1.6 });
  for (const d of [-1, 1]) { S.add(ellR(hx + d * 3.6 + tn, hy, 2.6, 2.6), mat(ramp(0xf0a020), { spec: 1 }), { z: 2.8, h: 0.8 }); !p.hurt && S.decal(hx + d * 3.6 + tn, hy, 0x101010).decal(hx + d * 3.6 + tn - 0.6, hy - 0.8, 0xffffff); }
  S.add(polyF([[hx - 1 + tn, hy + 2], [hx + 1 + tn, hy + 2], [hx + tn, hy + 5]]), mat(ramp(0x3a3028), { spec: 0.6 }), { z: 3, h: 0.6, prof: "sharp" });
  // 발톱
  for (const d of [-1, 1]) { const r = [cx + d * 3, cy + 14], e = [r[0] + ta * 4, r[1] + 2 + ta * 6]; S.add(capF(r, e, 1.4, 1), YL, { z: 3.4, h: 0.6 }); for (const e2 of [-0.5, 0, 0.5]) S.add(capF(e, pol(e, 1.4 - ta + e2, 2.6), 0.6, 0.2), mat(ramp(0x2a2420), { spec: 0.6 }), { z: 3.5, h: 0.3 }); }
  wing(0, 1);
  return done3(S.render({ rim: !0 }), p);
}
export const pxOwl = spec(43, 42, 18, 20,
  { perch: [4, 4], idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [3, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "perch") return { perch: 1, turn: [0, -2, 0, 2][f] };
    if (nm === "wind") return { flap: fl, talon: 0.3 * t };
    if (nm === "atk") return { flap: -1, talon: 1 };
    if (nm === "rec") return { flap: fl, talon: 1 - t };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6 };
    return { flap: fl };
  }, owlFrame, { flying: !0 });

// ════ 도토리 다람쥐 ════ 꼬리가 몸보다 큰 다람쥐. 도토리를 꼭 쥐고 다니다 던진다
//   p: bob · legs · tail · throw 던지기(0~1) · acorn · crouch · hurt
const SQ = ramp(0xb8703a), SQF = rampF(0xa0602e), SQB = ramp(0xf0d8b0), ACORN = ramp(0x8a5a2a);
function squirrelFrame(p = {}) {
  const W = 50, H = 44, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 24 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 3, g = p.legs ?? { n: [0, 0], f: [0, 0] }, tl = p.tail ?? 0, th = p.throw ?? 0, cx = 24;
  const SQ = mat(ramp(0xb0643a), { tex: "fur", amp: 1.2, dir: 0.6 }), SQF = mat(rampF(0x8a4a2a), { tex: "fur", dir: 0.6 }), SQW = mat(ramp(0xf0e0c8), { tex: "fur", amp: 0.7 }), TAIL = mat(ramp(0xc07446), { tex: "fur", amp: 1.5, dir: 1.2 });
  // 큰 꼬리 (S자)
  const tp = [[cx - 6, 32 + b], [cx - 14, 26 + b - tl], [cx - 16, 14 + b - tl * 1.6], [cx - 10, 6 + b - tl], [cx - 4, 8 + b]];
  S.add(U(...tp.slice(1).map((q, k) => capF(tp[k], q, 3.6 + k * 0.6, 4 + k * 0.6))), TAIL, { z: -1, h: 4 });
  for (let k = 0; k < 6; k++) S.carve(capF(lerp(tp[1], tp[3], k / 5), [lerp(tp[1], tp[3], k / 5)[0] - 3, lerp(tp[1], tp[3], k / 5)[1] + 2], 0.4), 0.6);
  // 뒷다리
  for (const [o, far] of [[g.f, 1], [g.n, 0]]) { const hp = [cx - 3 + (far ? -1 : 1), 34 + b], ft = [hp[0] + 3 + o[0], G - 1 - o[1]]; S.add(ellR(hp[0], hp[1], 5, 4.6), far ? SQF : SQ, { z: far ? -2 : 3, h: 3 }); S.add(ellR(ft[0] + 1, ft[1] - 0.6, 3.6, 1.4), far ? SQF : SQ, { z: far ? -1.9 : 3.1, h: 1 }); }
  // 몸 + 흰 배
  S.add(U(ellR(cx + 1, 30 + b, 7, 8.4)), SQ, { z: 1, h: 6 });
  S.add(ellR(cx + 4, 32 + b, 3.6, 5.6), SQW, { on: 1, lift: 0.3, h: 0.6 });
  // 머리
  const hx = cx + 6, hy = 19 + b;
  S.add(U(ellR(hx, hy, 5.6, 5), capF([hx + 2, hy + 1], [hx + 7, hy + 2], 2.6, 1.6)), SQ, { z: 3, h: 4 });
  S.add(polyF([[hx - 3, hy - 3], [hx - 4, hy - 9], [hx, hy - 4]]), SQ, { z: 3.2, h: 1 });
  S.add(capF([hx + 1, hy + 2], [hx + 6, hy + 2.6], 1.2), SQW, { on: 1, lift: 0.3, h: 0.3 });
  S.add(ellR(hx + 2, hy - 1, 1.6, 1.6), mat(ramp(0x101010), { spec: 1 }), { z: 3.4, h: 0.6 });
  !p.hurt && S.decal(hx + 1.6, hy - 1.6, 0xffffff);
  // 앞발 + 도토리
  const sh = [cx + 4, 26 + b], hd = th > 0.5 ? pol(sh, -2 + (th - 0.5) * 2.6, 8) : [cx + 8, 30 + b];
  S.add(capF(sh, hd, 1.6, 1.2), SQ, { z: 5, h: 1 });
  if (p.acorn || (th < 0.5)) { S.add(ellR(hd[0] + 1, hd[1] + 0.6, 2.4, 2.8), mat(ramp(0xa87a40), { tex: "wood", spec: 0.6 }), { z: 5.2, h: 1.6 }); S.add(minus(ellR(hd[0] + 1, hd[1] - 1.4, 2.6, 1.8), (x, y) => y > hd[1] - 1), mat(ramp(0x6a4a2a), { tex: "clay" }), { z: 5.4, h: 1 }); }
  return done3(S.render({ rim: !0 }), p);
}
export const pxSquirrel = spec(36, 32, 12, 14,
  { idle: [6, 8], move: [6, 16], wind: [3, 12, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.4, tail: Math.sin(ph) * 0.8, throw: f === 3 ? 0.4 : 0 };
    if (nm === "move") return { bob: -Math.abs(Math.sin(ph)) * 2.5, legs: { n: [2 * Math.sin(ph), Math.max(0, Math.cos(ph)) * 2], f: [-2 * Math.sin(ph), Math.max(0, -Math.cos(ph)) * 2] }, tail: Math.sin(ph) * 1.5 };
    if (nm === "wind") return { throw: 0.6 + 0.3 * t, crouch: t };
    if (nm === "atk") return { throw: [0.9, 1.3, 1.4, 1.1][f], acorn: f < 2 ? 1 : 0, crouch: 0.4 };
    if (nm === "rec") return { throw: 0.6 * (1 - t), acorn: 0 };
    return { hurt: f === 0, crouch: 0.6, tail: 1.5 };
  }, squirrelFrame);

// ════ 잎사귀 나방 ════ 잎맥 무늬 날개(초록·갈색) · 털 많은 몸 · 깃털 더듬이. 인분을 흩뿌려 느려지게 한다
//   p: flap · dust 인분(0~1) · tilt · hurt
const MTH = ramp(0x8a8a5a), LEAFW = ramp(0x6a9a48), LEAFB = ramp(0x8a6a3a);
function mothFrame(p = {}) {
  const W = 66, H = 54, S = sculpt(W, H, { k: 0.72, ax: 33 });
  const fl = p.flap ?? 0, cx = 33, cy = 27, sq = 0.55 + (fl + 1) * 0.25;
  const MB = mat(ramp(0x7a8a5a), { tex: "fur", amp: 1.3, dir: 1.57 }), WG = mat(ramp(0x7aa050), { tex: "leaf", amp: 0.7 }), WGF = mat(rampF(0x5a7a3a), { tex: "leaf" }), VEIN = mat(ramp(0x4a5a2a)), BRN = mat(ramp(0x8a6a3a), { tex: "leaf" });
  for (const d of [-1, 1]) {
    const M = d < 0 ? WGF : WG, Y = (y) => cy + (y - cy) * sq;
    S.add(polyF([[cx + d * 2, Y(cy - 3)], [cx + d * 14, Y(cy - 17)], [cx + d * 27, Y(cy - 12)], [cx + d * 22, Y(cy + 1)], [cx + d * 2, Y(cy + 2)]]), M, { z: 1, h: 1.4 });
    S.add(polyF([[cx + d * 2, Y(cy + 2)], [cx + d * 18, Y(cy + 3)], [cx + d * 16, Y(cy + 14)], [cx + d * 6, Y(cy + 15)]]), d < 0 ? mat(rampF(0x6a5a30), { tex: "leaf" }) : BRN, { z: 0.8, h: 1.2 });
    S.add(capF([cx + d * 2, Y(cy - 1)], [cx + d * 24, Y(cy - 10)], 0.5), VEIN, { on: 1, lift: 0.3, h: 0.2 });
    for (let k = 0; k < 4; k++) S.add(capF([cx + d * (6 + k * 4.4), Y(cy - 2.6 - k * 1.6)], [cx + d * (10 + k * 4), Y(cy - 9 - k * 1.4)], 0.35), VEIN, { on: 1, lift: 0.3, h: 0.2 });
    S.add(ellR(cx + d * 20, Y(cy - 8), 2, 1.6 * sq), mat(ramp(0xd8c860)), { on: 1, lift: 0.4, h: 0.2 });
  }
  S.add(U(ellR(cx, cy - 2, 3.4, 4.4), ellR(cx, cy + 7, 2.6, 6)), MB, { z: 2, h: 3 });
  S.add(ellR(cx, cy - 8, 2.8, 2.4), MB, { z: 2.4, h: 2 });
  for (const d of [-1, 1]) { const r0 = [cx + d, cy - 10], e = [cx + d * 8, cy - 18]; S.add(U(capF(r0, e, 0.6, 0.3), ...[0.3, 0.5, 0.7, 0.9].map((t) => capF(lerp(r0, e, t), [lerp(r0, e, t)[0] + d * 1.8, lerp(r0, e, t)[1] + 1.2], 0.3))), MB, { z: 2.6, h: 0.3 }); }
  !p.hurt && S.decal(cx - 1.6, cy - 8.4, 0x101010).decal(cx + 1.6, cy - 8.4, 0x101010);
  const C = S.render({ rim: !0 });
  if (p.dust) { const Q = M_toPx(W, H, 0.72, 33); for (let k = 0; k < 16; k++) { const q = Q(cx + Math.cos(k * 1.3) * (10 + (k % 4) * 5), cy + 12 + Math.sin(k * 2.1) * 6 + k); C.px(q[0], q[1], k % 2 ? 0xd8e8a0 : 0xa8c870); } }
  return done3(C, p);
}
export const pxMoth = spec(48, 39, 18, 16,
  { idle: [4, 14], move: [4, 16], wind: [3, 10, !1], atk: [4, 12, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const fl = [1, 0.3, -1, 0.3][f % 4];
    if (nm === "wind") return { flap: fl, tilt: -0.2 * t };
    if (nm === "atk") return { flap: fl * 1.2, dust: 1, tilt: 0.1 };
    if (nm === "rec") return { flap: fl };
    if (nm === "hurt") return { hurt: f === 0, flap: 0.6, tilt: -0.3 };
    return { flap: fl };
  }, mothFrame, { flying: !0 });

// ════ [정예] 거대 사마귀 ════ (큰 몬스터 조각 도구) 잎사귀 같은 큰 날개 · 세모 머리와 큰 겹눈 · 가시 돋친 두 낫. 잎처럼 가만히 있다가 낫 두 자루로 연속 베기, 뒤로 뛰었다 날아드는 베기
//   p: hide 잎 위장 · bob · scythe/scythe2 가까운·먼 낫(0 접음 ~ 1 들기 ~ 2 내려벰) · lean · legs · wing 날개 펼침 · sway 더듬이 · hurt
const MTK = 0.68;
const MT_B = mat(ramp(0x6aa848), { tex: "skin", amp: 0.3 }), MT_BF = mat(ramp(0x5a8e40, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.3 });
const MT_W = mat(ramp(0x8ac060), { tex: "skin", amp: 0.2 }), MT_WF = mat(ramp(0x6e9a4c, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.2 });
const MT_EYE = mat(ramp(0xd8f080), { spec: 0.6 }), MT_SP = mat(ramp(0xf0ffd8), { spec: 0.4 }), MT_PINK = mat(ramp(0xe89ab0), { spec: 0.3 });
const MT_BEL = mat(ramp(0xb8d890), { tex: "skin", amp: 0.2 }), MT_DRY = mat(ramp(0xb08a48), { tex: "skin", amp: 0.4 });
function mantisFrame(p = {}) {
  const W = 104, H = 84, G = H - 1, S = sculpt(W, H, { k: p.k ?? MTK, ax: 48 });
  const hd = p.hide ?? 0, b = (p.bob ?? 0) + hd * 5, sc = p.scythe ?? 0, sc2 = p.scythe2 ?? sc, ln = p.lean ?? 0, wg = p.wing ?? 0, sw = p.sway ?? 0;
  const g = p.legs ?? { n: [0, 0], f: [0, 0] };
  const leg = (at, kn, ft, far) => S.add(U(capF(at, kn, 1.9, 1.5), capF(kn, ft, 1.5, 0.8)), far ? MT_BF : MT_B, { z: far ? -3 : 8, h: 1.4 });
  // 낫: 넓적다리(안쪽 가시 줄) → 접히는 낫날(가시 · 끝 갈고리)
  const nx = 64 + ln * 8, ny = 40 + b + Math.abs(ln) * 2;
  const scy = (far, s) => {
    const s0 = [nx - 2 + far * 2, ny + 6 - far], u = Math.max(0, s - 1);
    const a = s > 1 ? L(-1.6, 0.3, u) : L(1.05, -1.6, s), ta = s > 1 ? L(2.18, 0.85, u) : L(3.55, 2.18, s);
    const e = pol(s0, a, 16), f = pol(e, ta, 17), sd = Math.sin(ta - a) > 0 ? 1 : -1, M0 = far ? MT_BF : MT_B, SP = far ? MT_BF : MT_SP, z0 = far ? -1 : 12;
    S.add(U(capF(s0, e, 3.2, 3), ellR(e[0], e[1], 3, 3)), M0, { z: z0, h: 3 });
    for (let k = 1; k <= 3; k++) { const q = lerp(s0, e, 0.25 + k * 0.18); S.add(polyF([pol(q, a, 1), pol(q, a + Math.PI, 1), pol(q, a + sd * 1.45, 5)]), SP, { z: z0 + 0.3, h: 0.7 }); }
    S.add(capF(e, f, 2.6, 0.6), M0, { z: z0 + 0.5, h: 2.2 });
    for (let k = 1; k <= 4; k++) { const q = lerp(e, f, k / 5.5); S.add(polyF([pol(q, ta, 0.9), pol(q, ta + Math.PI, 0.9), pol(q, ta - sd * 1.35, 3.6)]), SP, { z: z0 + 0.6, h: 0.7 }); }
    S.add(capF(f, pol(f, ta - sd * 1.9, 4), 1.1, 0.3), M0, { z: z0 + 0.7, h: 1 });
    far || S.add(ellR(...lerp(s0, e, 0.5), 1.6, 1.2), MT_PINK, { on: 1, h: 0.4 });
  };
  // 먼 다리 (가운데 · 뒤) + 먼 낫 + 먼 날개
  leg([46, 67 + b], [56, 58 + b], [66 + g.f[0], G - g.f[1]], 1);
  leg([40, 68 + b], [30, 59 + b], [18 + g.f[0], G - g.f[1]], 1);
  scy(1, sc2);
  const wingP = (dy) => [[48, 62 + dy], [34, 56 + dy], [16, 55 + dy], [2, 60 + dy], [12, 66 + dy], [30, 67 + dy], [46, 66 + dy]];
  const WR = (ang) => rot([48, 64 + b], ang);
  wg > 0.05 && S.add(polyF(wingP(b - 1).map(WR(-wg * 1.15))), MT_WF, { z: 1, h: 2 });
  // 배 (넓은 잎 모양, 끝이 위로 휨) + 마디
  S.add(U(ellR(26, 69 + b, 20, 7.5, 0.08), ellR(7, 64 + b, 6.5, 5, -0.5)), MT_B, { z: 0, h: 6 });
  S.add(ellR(26, 74 + b, 18, 2.4, 0.08), MT_BEL, { on: 1, h: 0.6 });
  for (let k = 0; k < 6; k++) S.carve(capF([14 + k * 5, 65 + b + k * 0.3], [13 + k * 5, 76 + b], 0.45), 0.7);
  // 가까운 날개 (잎맥 · 가운데 맥)
  const wr = WR(-wg * 0.9), WP = wingP(b).map(wr);
  S.add(polyF(WP), MT_W, { z: 3, h: 2.5, lift: 1 });
  S.add(U(ellR(...wr([9, 60 + b]), 5, 3, -0.2), ellR(...wr([20, 65.5 + b]), 3, 1.4)), MT_DRY, { on: 1, h: 0.5 });
  S.carve(capF(wr([47, 64 + b]), wr([4, 60.5 + b]), 0.5), 0.8);
  for (const [x0, x1, y1] of [[40, 33, 57.5], [31, 24, 56.5], [22, 15, 57], [13, 7, 58.5], [40, 35, 66], [31, 26, 66.5], [22, 17, 66]]) S.carve(capF(wr([x0, 63 + b]), wr([x1, y1 + b]), 0.35), 0.5);
  // 가슴 → 앞가슴(비스듬히 세움) → 세모 머리 · 큰 겹눈 · 입틀 · 더듬이
  S.add(ellR(46, 66 + b, 9, 5.6), MT_B, { z: 3, h: 5 });
  S.add(capF([48, 65 + b], [nx, ny], 4, 2.8), MT_B, { z: 4, h: 3 });
  const hx = nx + 3, hy = ny - 7;
  S.add(U(capF([hx - 1, hy - 6], [hx - 8 + sw, hy - 16], 0.8, 0.6), capF([hx - 8 + sw, hy - 16], [hx - 15 + sw * 1.5, hy - 21], 0.6, 0.5)), MT_B, { z: 6, h: 0.6 });
  S.add(capF([hx + 2, hy - 6], [hx + 6 - sw, hy - 20], 0.7, 0.5), MT_BF, { z: 5, h: 0.6 });
  S.add(polyF([[hx - 7, hy - 3], [hx + 8, hy - 5], [hx + 6, hy + 3], [hx + 1, hy + 8]]), MT_B, { z: 6, h: 4 });
  S.add(ellR(hx + 6, hy - 4.8, 2.4, 2.4), MT_EYE, { z: 5.5, h: 2 });
  S.add(ellR(hx - 4, hy - 3.8, 3.8, 3.5), MT_EYE, { z: 7, h: 3 });
  S.add(polyF([[hx, hy + 6], [hx + 3, hy + 6], [hx + 1.4, hy + 10]]), MT_BF, { z: 6.5, h: 1.2 });
  p.block || p.hurt || (S.decal(hx - 3.4, hy - 3.2, 0x1a3010), S.decal(hx + 6.5, hy - 4.6, 0x1a3010));
  // 가까운 다리 + 가까운 낫
  leg([44, 68 + b], [53, 60 + b], [62 + g.n[0], G - g.n[1]], 0);
  leg([38, 69 + b], [28, 61 + b], [15 + g.n[0], G - g.n[1]], 0);
  scy(0, sc);
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxMantis = {
  fw: Math.round(104 * MTK), fh: Math.round(84 * MTK), w: 24, h: 30,
  anims: { hide: [2, 2], idle: [4, 6], move: [6, 12], wind: [3, 10, !1], atk: [4, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], leap: [4, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "hide") P = { hide: 1, scythe: 0, lean: -0.3, sway: f };
    if (nm === "idle") P = { bob: Math.sin(ph) * 0.4, scythe: 0.1 + 0.05 * Math.sin(ph), sway: Math.sin(ph) };
    if (nm === "move") P = { scythe: 0.25, lean: 0.2, bob: -Math.abs(Math.sin(ph)) * 0.8, legs: { n: [2.4 * Math.sin(ph), Math.max(0, Math.cos(ph)) * 2.4], f: [-2.4 * Math.sin(ph), Math.max(0, -Math.cos(ph)) * 2.4] } };
    if (nm === "wind") P = { scythe: t, lean: -0.35 * t, wing: 0.25 * t };
    if (nm === "atk") P = { scythe: [2, 2, 1.4, 2][f], scythe2: [1.6, 1.4, 2, 2][f], lean: 0.55 };
    if (nm === "leap") P = { scythe: [1, 1, 1.4, 2][f], lean: [0.2, 0.6, 0.6, 0.4][f], bob: [2, -3, -3, 1][f], wing: [0.3, 1, 0.8, 0.3][f] };
    if (nm === "rec") P = { scythe: L(1.5, 0.15, t), lean: 0.4 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, lean: -0.45, scythe: 0.4, wing: 0.3 };
    return mantisFrame(P);
  },
};

// ════ 독두꺼비 ════ 오돌토돌한 자줏빛 두꺼비. 긴 혀로 멀리서 끌어당기고, 독 거품을 뱉는다
//   p: bob · crouch · mouth · tongue 혀 길이(0~1) · puff 볼 부풀림 · hurt
const TOAD = ramp(0x6a5a7a), TOADB = ramp(0xd8c890), WART = ramp(0xa87aa0), TONG = ramp(0xd85a7a);
function toadFrame(p = {}) {
  const W = 100, H = 46, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 36 });
  const b = (p.bob ?? 0) + (p.crouch ?? 0) * 2, mo = p.mouth ?? 0, tg = p.tongue ?? 0, pf = p.puff ?? 0, cx = 32;
  const TD = mat(ramp(0x7a4a8a), { tex: "skin", amp: 1.3, spec: 0.5 }), TDF = mat(rampF(0x5a3468), { tex: "skin" }), BEL = mat(ramp(0xd8c890), { tex: "skin", amp: 0.6 }), WART = mat(ramp(0xb87ac0), { spec: 0.5 });
  // 뒷다리 (접힌)
  S.add(U(ellR(cx - 10, G - 8 + b, 8, 7), capF([cx - 10, G - 4 + b], [cx - 2, G - 1], 3, 2)), TDF, { z: -1, h: 5 });
  // 몸
  S.add(U(ellR(cx, G - 12 + b, 16, 10), ellR(cx + 10, G - 14 + b, 10, 8)), TD, { z: 1, h: 9 });
  S.add(ellR(cx + 4, G - 6 + b, 12, 4), BEL, { on: 1, lift: 0.2, h: 0.5 });
  for (const [x, y, r] of [[-8, -18, 1.8], [-2, -21, 1.4], [5, -20, 2], [-12, -12, 1.4], [10, -16, 1.2], [0, -14, 1.2]]) S.add(ellR(cx + x, G + y + b, r, r), WART, { lift: 0.6, h: r * 0.8 });
  // 볼 주머니
  pf > 0 && S.add(ellR(cx + 16, G - 6 + b, 4 + pf * 5, 3 + pf * 4), mat(ramp(0xe8b8d8, { hi: 0.6 }), { tex: "skin", spec: 0.8 }), { z: 2.4, h: 3 });
  // 머리 + 입 + 혀
  const hx = cx + 18, hy = G - 16 + b;
  S.add(U(ellR(hx, hy, 8, 6)), TD, { z: 2, h: 5 });
  S.add(ellR(hx - 1, hy - 5, 3.4, 3), TD, { z: 2.4, h: 2.4 });
  S.add(ellR(hx, hy - 5.6, 2.2, 2), mat(ramp(0xe8c040), { spec: 1 }), { z: 2.8, h: 0.8 });
  !p.hurt && S.decal(hx, hy - 5.6, 0x101010);
  S.add(capF([hx - 2, hy + 3 + mo * 1.6], [hx + 8, hy + 2 + mo * 2], 0.6 + mo * 1.4, 0.4), mat(ramp(0x4a1a2a)), { z: 2.4, h: 0.3 });
  if (tg > 0) { const t0 = [hx + 7, hy + 3], t1 = [hx + 7 + tg * 40, hy + 1]; S.add(capF(t0, t1, 1.2, 1), mat(ramp(0xe86a8a), { tex: "skin", spec: 0.6 }), { z: 2.6, h: 0.6 }); S.add(ellR(t1[0], t1[1], 3, 2.6), mat(ramp(0xe86a8a), { tex: "skin", spec: 0.7 }), { z: 2.7, h: 1.8 }); }
  // 앞다리
  S.add(capF([cx + 12, G - 8 + b], [cx + 15, G - 1], 2, 1.6), TD, { z: 4, h: 1.2 });
  S.add(ellR(cx + 16, G - 0.8, 3, 1.2), TD, { z: 4.1, h: 0.6 });
  return done3(S.render({ rim: !0 }), p);
}
export const pxToad = spec(72, 33, 26, 16,
  { idle: [4, 6], move: [4, 10], wind: [3, 10, !1], atk: [4, 16, !1], rec: [3, 10, !1], hurt: [2, 10, !1], spit: [4, 12, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { puff: Math.max(0, Math.sin(ph)) * 0.6 };
    if (nm === "move") return { crouch: f % 2 ? 1 : 0, bob: f % 2 ? 0 : -4 };
    if (nm === "wind") return { crouch: t, mouth: t * 0.5 };
    if (nm === "atk") return { mouth: 1, tongue: [0.5, 1, 1, 0.4][f] };
    if (nm === "spit") return { puff: [0.6, 1, 0.3, 0][f], mouth: f >= 2 ? 1 : 0 };
    if (nm === "rec") return { mouth: 1 - t, tongue: 0 };
    return { hurt: f === 0, crouch: 0.8, mouth: 0.6 };
  }, toadFrame);

// ════ 반딧불 무리 ════ 빛나는 반딧불 여럿이 모인 무리. 흩어져 날다가 한데 모여 눈부신 빛을 터뜨린다
//   p: spread 흩어짐(0 모임 ~ 1) · glow 빛 · ph 위상 · hurt
const FLY = ramp(0x3a3a2a), FLYG = rampGlow(0xf0f070);
function fireflyFrame(p = {}) {
  const W = 56, H = 50, S = sculpt(W, H, { k: 0.72, ax: 28 });
  const sp = p.spread ?? 0.7, gl = p.glow ?? 0.5, ph = p.ph ?? 0, cx = 28, cy = 25;
  const BD = mat(ramp(0x3a3428), { tex: "metal", amp: 0.5, spec: 0.7 }), GL = mat(rampGlow(0xd8f070)), GLW = mat(rampGlow(0xf8ffd8)), WG = mat(ramp(0xd8e0d0, { hi: 0.6 }), { tex: "glass", spec: 0.8 });
  const n = 6, pos = [];
  for (let k = 0; k < n; k++) { const a = k * 1.05 + ph * 0.5, r = 4 + sp * (10 + (k % 3) * 3); pos.push([cx + Math.cos(a) * r, cy + Math.sin(a * 1.3) * r * 0.7]); }
  pos.forEach((c, k) => {
    const z = k;
    S.add(ellR(c[0] - 1.4, c[1], 2.6 + gl * 0.6, 2.2 + gl * 0.4), gl > 1.2 ? GLW : GL, { z, h: 1.6 });
    S.add(ellR(c[0] + 1.6, c[1] - 0.4, 1.8, 1.6), BD, { z: z + 0.1, h: 1.2 });
    S.add(ellR(c[0] + 3, c[1] - 0.8, 1.2, 1.1), mat(ramp(0xc84030)), { z: z + 0.2, h: 0.8 });
    S.add(ellR(c[0], c[1] - 2.6 - ((k + Math.round(ph * 4)) % 2), 2.4, 1, -0.4), WG, { z: z + 0.3, h: 0.3 });
  });
  const C = S.render({ rim: !1 });
  const Q = M_toPx(W, H, 0.72, 28);
  pos.forEach((c, k) => gl > 0.7 && glint3(C, Q, c[0] - 1.4, c[1], gl > 1.2 ? 2 : 1, 0xf8ffd8));
  return done3(C, p);
}
export const pxFirefly = spec(40, 36, 18, 16,
  { idle: [6, 12], move: [6, 14], wind: [4, 10, !1], atk: [3, 14, !1], rec: [3, 10, !1], hurt: [2, 10, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "wind") return { spread: 0.8 - t * 0.8, glow: 0.6 + t * 0.6, ph: ph * 2 };
    if (nm === "atk") return { spread: 0.1 + f * 0.4, glow: 1.6, ph };
    if (nm === "rec") return { spread: t, glow: 1 - t * 0.4, ph };
    if (nm === "hurt") return { hurt: f === 0, spread: 1.2, glow: 0.3, ph };
    return { spread: 0.7, glow: 0.5 + 0.3 * Math.sin(ph * 2), ph };
  }, fireflyFrame, { flying: !0 });

// ════ 개울 가재 ════ 붉은 갈색 껍질 · 커다란 두 집게(들고 다님) · 마디 꼬리. 옆걸음 치며 집고, 물을 튀겨 쏜다
//   p: legs 위상 · claw 집게(0 들기 ~ 1 집기) · squirt · bob · hurt
const CRAY = ramp(0xa8483a), CRAYF = rampF(0x903e32), CLAWC = ramp(0xc8584a);
function crayFrame(p = {}) {
  const W = 74, H = 46, G = H - 1, S = sculpt(W, H, { k: 0.72, ax: 36 });
  const b = p.bob ?? 0, lp = p.legs ?? 0, cl = p.claw ?? 0, cx = 32;
  const CR = mat(ramp(0x9a4a30), { tex: "metal", amp: 0.8, spec: 0.8 }), CRF = mat(rampF(0x7a3a24), { tex: "metal" });
  for (let k = 0; k < 4; k++) for (const far of [1, 0]) { const s = [cx - 2 + k * 4, G - 9 + b], a = 1.5 + Math.sin(lp + k * 1.6 + far * 3) * 0.35 + (k - 1.5) * 0.15, e = pol(s, a - 0.6, 4.4), ft = pol(e, a + 0.5, 4.4); S.add(U(capF(s, e, 0.9, 0.7), capF(e, ft, 0.7, 0.4)), far ? CRF : CR, { z: far ? -2 : 3, h: 0.6 }); }
  // 꼬리 (마디 · 부채)
  for (let k = 0; k < 5; k++) S.add(ellR(cx - 12 - k * 4, G - 10 + b + k * 0.6, 4.4 - k * 0.4, 3.6 - k * 0.3), k % 2 ? CR : CRF, { z: 1 - k * 0.05, h: 2.6 });
  for (const d of [-0.5, 0, 0.5]) S.add(polyF([[cx - 30, G - 8 + b], pol([cx - 30, G - 8 + b], Math.PI + d, 6), pol([cx - 30, G - 8 + b], Math.PI + d + 0.3, 5)]), CR, { z: 0.7, h: 0.8 });
  // 몸통 (머리가슴 · 이마 뿔)
  S.add(U(ellR(cx, G - 12 + b, 11, 5.6)), CR, { z: 1.2, h: 5 });
  S.carve(capF([cx - 6, G - 17 + b], [cx - 4, G - 7 + b], 0.4), 0.6);
  S.add(polyF([[cx + 9, G - 14 + b], [cx + 15, G - 13 + b], [cx + 10, G - 11 + b]]), CR, { z: 1.4, h: 0.8, prof: "sharp" });
  for (const d of [-1, 1]) S.add(capF([cx + 10, G - 13 + b], [cx + 26, G - 20 + b + d * 2], 0.4, 0.2), CRF, { z: 1.5 + d * 0.1, h: 0.2 });
  S.add(ellR(cx + 9, G - 16 + b, 1.2, 1.2), M_VD, { z: 1.6, h: 0.6 });
  !p.hurt && S.decal(cx + 8.6, G - 16.4 + b, 0xffffff);
  // 집게 둘 (들고 다님)
  for (const far of [1, 0]) { const r = [cx + 8, G - 10 + b + far], e = [cx + 15, G - 18 + b - far * 2 + cl * 4], o = cl < 0.5 ? 0.6 : 0.1; S.add(capF(r, e, 1.8, 1.6), far ? CRF : CR, { z: far ? -1 : 4, h: 1.2 }); S.add(U(ellR(e[0] + 3, e[1], 5, 3.4), polyF([[e[0] + 5, e[1] - 1.6], [e[0] + 13, e[1] - 3 - o * 3], [e[0] + 7, e[1] - 0.4]]), polyF([[e[0] + 5, e[1] + 1.4], [e[0] + 12, e[1] + 2 + o * 3], [e[0] + 7, e[1] + 0.4]])), far ? CRF : CR, { z: far ? -0.9 : 4.1, h: 2.4 }); S.add(ellR(e[0] + 2, e[1] - 1.6, 1, 0.8), mat(ramp(0xd8a080)), { on: 1, lift: 0.3, h: 0.2 }); }
  const C = S.render({ rim: !0 });
  if (p.squirt) { const Q = M_toPx(W, H, 0.72, 36); for (let k = 0; k < 8; k++) { const q = Q(cx + 14 + k * 3, G - 13 + b - Math.sin(k * 0.4) * 2); C.px(q[0], q[1], k % 2 ? 0x90d0f0 : 0xd8f0ff); } }
  return done3(C, p);
}
export const pxCrayfish = spec(53, 33, 24, 14,
  { idle: [4, 6], move: [6, 14], wind: [3, 10, !1], atk: [3, 18, !1], rec: [3, 10, !1], hurt: [2, 10, !1], squirt: [4, 14, !1] },
  (nm, f, n, t) => {
    const ph = (f / n) * T2;
    if (nm === "idle") return { bob: Math.sin(ph) * 0.3, claw: 0.1 + 0.1 * Math.sin(ph) };
    if (nm === "move") return { legs: ph * 2, claw: 0.2 };
    if (nm === "wind") return { claw: 0, bob: -t };
    if (nm === "atk") return { claw: [0.6, 1, 1][f] };
    if (nm === "squirt") return { squirt: f > 0 ? 1 : 0, claw: 0.3 };
    if (nm === "rec") return { claw: 1 - t };
    return { hurt: f === 0, claw: 0.5, bob: 1 };
  }, crayFrame);

// ════ [정예] 늪 두꺼비 왕 ════ (큰 몬스터 조각 도구) 머리에 버섯 왕관을 쓴 거대한 두꺼비. 오돌토돌한 혹 · 이끼 망토 · 금빛 눈 · 늘어나는 턱주머니. 높이 뛰어 짓누르고, 혀로 삼켰다 뱉는다
//   p: bob · crouch 웅크림 · air 공중 · mouth · tongue 혀 길이 · belly 턱주머니 부풀림 · hurt
const TKK = 0.68;
const TK_SK = mat(ramp(0x627240), { tex: "skin", amp: 0.7 }), TK_SKF = mat(ramp(0x52603a, { cool: 0x1c2a40 }), { tex: "skin", amp: 0.6 }), TK_BEL = mat(ramp(0xdccc94), { tex: "skin", amp: 0.3 });
const TK_WART = mat(ramp(0x7e8c4e), { tex: "skin", amp: 0.4 }), TK_EYE = mat(ramp(0xf0b830), { spec: 0.7 }), TK_MOUTH = mat(ramp(0x5a1e2c)), TK_TONG = mat(ramp(0xe0607e), { spec: 0.5 });
const TK_CAP = mat(ramp(0xc8402a), { spec: 0.35 }), TK_CAPY = mat(ramp(0xe0a830), { spec: 0.35 }), TK_STEM = mat(ramp(0xe8dcb8)), TK_MOSS = mat(ramp(0x4e8a36), { tex: "fur", amp: 0.9, dir: 1.57 });
function toadKingFrame(p = {}) {
  const W = 148, H = 88, G = H - 1, S = sculpt(W, H, { k: p.k ?? TKK, ax: 62 });
  const cr = p.crouch ?? 0, air = p.air ?? 0, mo = p.mouth ?? 0, tg = p.tongue ?? 0, be = p.belly ?? 0;
  const sq = 1 - cr * 0.1 + air * 0.08, Y = (y) => G - (G - y) * sq - air * 12 + (p.bob ?? 0), RX = (r) => r * (2 - sq), RY = (r) => r * sq;
  // 먼 뒷다리 · 먼 앞다리
  S.add(ellR(42, Y(68), 12, 9), TK_SKF, { z: -3, h: 8 });
  S.add(capF([98, Y(66)], air ? [104, Y(84)] : [106, G - 3], 3.6, 3), TK_SKF, { z: -3, h: 3 });
  // 몸 (거대) + 머리 덩이
  S.add(U(ellR(58, Y(58), RX(34), RY(24)), ellR(86, Y(50), RX(18), RY(15))), TK_SK, { z: 0, h: 22 });
  // 혹 (옆구리 · 머리)
  for (const [x, y, r] of [[36, 64, 2.6], [46, 63, 2.4], [56, 64, 2.2], [30, 56, 2.4], [62, 41, 2.4], [68, 47, 2], [96, 47, 1.8], [88, 55, 1.6], [64, 56, 2.2], [74, 62, 1.8]]) S.add(ellR(x, Y(y), r, r * 0.85), TK_WART, { blend: 1.2, h: r * 0.7 });
  // 이끼 망토 (등을 덮고 끝이 너덜너덜)
  S.add(polyF([[24, Y(52)], [34, Y(40)], [48, Y(35)], [60, Y(37)], [58, Y(45)], [52, Y(52)], [48, Y(48)], [44, Y(57)], [40, Y(51)], [34, Y(60)], [31, Y(53)], [26, Y(59)]]), TK_MOSS, { lift: 1.6, h: 2.2 });
  // 배 + 턱주머니 (부풀면 크게)
  S.add(ellR(76, Y(72), RX(20), RY(9)), TK_BEL, { on: 1, h: 1 });
  S.add(ellR(92, Y(65) + be * 2, 8 + be * 6, 4.5 + be * 5), TK_BEL, { z: 4, h: 3 + be * 4 });
  // 입: 다물면 긴 입선, 벌리면 입 속 + 아래턱이 내려온다
  const mc = [76, Y(56)];
  if (mo > 0.15) {
    S.add(polyF([[mc[0] + 4, mc[1] - 0.5], [104, Y(53)], [103, Y(53) + mo * 9], [mc[0] + 6, mc[1] + 2]]), TK_MOUTH, { on: 1, h: 0.4 });
    S.add(polyF([[mc[0] + 4, mc[1] + 2], [103, Y(53) + mo * 9], [101, Y(58) + mo * 10], [86, Y(64) + mo * 5], [mc[0] + 2, mc[1] + 5]]), TK_SK, { z: 5, h: 5 });
  } else S.carve(capF([mc[0] + 2, mc[1]], [104, Y(53)], 0.7), 1.4, !1);
  S.carve(ellR(102, Y(47.5), 1, 0.7), 0.9, !1);
  // 귀샘 · 눈두덩 · 금빛 눈(가로 동공) · 찌푸린 눈꺼풀
  S.add(ellR(72, Y(44), 7, 3.6, -0.2), TK_WART, { blend: 2, h: 2 });
  S.add(ellR(94, Y(41), 4.4, 4), TK_SK, { z: 2, h: 4 });
  S.add(ellR(95, Y(40.5), 3, 2.8), TK_EYE, { z: 2.4, h: 3.4 });
  S.add(ellR(84, Y(40), 7.4, 6.4), TK_SK, { z: 5, h: 6 });
  S.add(ellR(85, Y(39), 5, 4.6), TK_EYE, { z: 6, h: 5.4 });
  S.add(capF([79, Y(35)], [91, Y(36)], 1.5, 1.2), TK_SK, { z: 6.5, h: 1.6 });
  if (!p.block && !p.hurt) { for (const x of [83, 84, 85, 86, 87]) S.decal(x, Y(39.4), 0x1a1008); S.decal(84, Y(37.4), 0xffffff); S.decal(96, Y(40.4), 0x1a1008); }
  // 버섯 왕관 (붉은 갓 둘 + 노란 갓 · 흰 점)
  for (const [x, y, s, M0] of [[64, 38, 0.7, TK_CAPY], [71, 34, 1, TK_CAP], [78, 32, 0.8, TK_CAP]]) {
    S.add(capF([x, Y(y) + 6 * s], [x, Y(y)], 1.6 * s), TK_STEM, { lift: 2, h: 1.6 });
    S.add(ellR(x, Y(y) - 0.5, 5.6 * s, 3.4 * s), M0, { lift: 5, h: 3 * s, prof: "soft" });
    p.block || (S.decal(x - 1.6 * s, Y(y) - 1.4 * s, 0xfff4e0), S.decal(x + 2 * s, Y(y) - 0.8 * s, 0xfff4e0));
  }
  // 혀 (끈적한 끝)
  if (tg > 0) {
    const t0 = [100, Y(56) + mo * 5], t1 = [100 + tg * 28, t0[1] - 1];
    S.add(capF(t0, t1, 2.8, 2.2), TK_TONG, { z: 7, h: 2.4 });
    S.add(ellR(t1[0] + 3, t1[1], 4.8, 4), TK_TONG, { z: 7.5, h: 4 });
  }
  // 가까운 앞다리 (손가락 셋) · 가까운 뒷다리 (접힌 허벅지 + 물갈퀴 발)
  const sh = [94, Y(64)], hn = air ? [104, Y(82)] : [100, G - 3];
  S.add(capF(sh, hn, 4.6, 3.6), TK_SK, { z: 6, h: 4 });
  for (const d of [-0.5, 0.1, 0.7]) S.add(capF(hn, pol(hn, d, 5), 1.5, 1.1), TK_SK, { z: 6.5, h: 1.4 });
  S.add(ellR(32, Y(66), RX(15), RY(11)), TK_SK, { z: 4, h: 9 });
  S.carve(capF([22, Y(62)], [40, Y(72)], 0.6), 0.7);
  const ft = air ? [14, Y(86)] : [46, G - 3];
  S.add(capF([24, Y(74)], ft, 5, 3.6), TK_SK, { z: 4.5, h: 4 });
  for (const d of [-0.4, 0, 0.4]) S.add(capF(ft, pol(ft, (air ? Math.PI + 0.6 : 0) + d, 7), 1.5, 1), TK_SK, { z: 5, h: 1.4 });
  const C = S.render({ debug: p.debug, rim: !p.block });
  return p.hurt ? flash(C) : C;
}
export const pxToadKing = {
  fw: Math.round(148 * TKK), fh: Math.round(88 * TKK), w: 44, h: 34,
  anims: { idle: [4, 5], move: [4, 8], wind: [4, 8, !1], atk: [3, 12, !1], rec: [3, 8, !1], hurt: [2, 10, !1], air: [2, 6], swallow: [4, 12, !1], spit: [3, 12, !1] },
  px(nm, f, n) {
    const t = f / Math.max(1, n - 1), ph = (f / n) * T2;
    let P = {};
    if (nm === "idle") P = { belly: Math.max(0, Math.sin(ph)) * 0.5, bob: Math.sin(ph) * 0.4 };
    if (nm === "move") P = { crouch: f % 2, air: f % 2 ? 0 : 0.6 };
    if (nm === "wind") P = { crouch: t, belly: t * 0.5 };
    if (nm === "air") P = { air: 1, mouth: 0.4, bob: f * 0.6 };
    if (nm === "atk") P = { crouch: [1.2, 0.8, 0.4][f], mouth: 1 };
    if (nm === "swallow") P = { mouth: 1, tongue: [0.5, 1, 0.6, 0.1][f] };
    if (nm === "spit") P = { mouth: [0.3, 1.4, 1][f], belly: [1, 0.2, 0][f] };
    if (nm === "rec") P = { crouch: 0.6 * (1 - t), mouth: 0.6 * (1 - t) };
    if (nm === "hurt") P = { hurt: f === 0, crouch: 0.6, mouth: 0.8 };
    return toadKingFrame(P);
  },
};
