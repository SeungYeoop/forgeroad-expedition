// 거점 그림 — 레퍼런스 ref08 화풍 (docs/reference/maps)
//   · 색: ref08 화면에서 직접 뽑은 따뜻한 올리브·카키·금빛 5단 팔레트 (민트 초록 금지)
//   · 질감: 모든 면에 2px 뭉치 + 8px 얼룩 잡음 → 색 경계가 손으로 찍은 점 덩어리처럼 섞인다 (디더링 없음)
//   · 빛: 왼쪽 위(해 쪽). 큰 잎 뭉치 · 톱니 가지 침엽수 · 역광 뭉게구름 · 이엉지붕 긴 집 · 흙 단면 · 비치는 물 · 물풀 전경
import * as G3 from "./bg3d.js";
import { mix, sh, hash, vn } from "./bgart.js";

export const art = (w, h, fn) => { const B = G3.buffer(w, h, !1), lights = []; fn(B, lights); return { c: B.toCanvas(), w, h, lights }; };
export const canvasOf = (w, h, fn) => { const B = G3.buffer(w, h, !1); fn(B); return B.toCanvas(); };
// 가로로 이어지는 띠 (좌우 끝이 맞물림)
const tile = (w, h, fn) => { const B = G3.buffer(w, h, !0); fn(B); return B.toCanvas(); };
const T5 = (pal, v) => pal[v > 0.55 ? 0 : v > 0.18 ? 1 : v > -0.2 ? 2 : v > -0.58 ? 3 : 4];
// 붓 질감 (명암 값에 더한다)
const tx = (x, y, s = 1, k = 0) => ((hash(x >> 1, y >> 1, 77 + k) - 0.5) * 0.55 + (vn(x, y, 8, 78 + k) - 0.5) * 0.7) * s;
const TT = (pal, v, x, y, s = 1, k = 0) => T5(pal, v + tx(x, y, s, k));
export const PAL = {
  autumn: [0xf6dc8c, 0xe2b45e, 0xc88e40, 0xa46a2c, 0x6a4220],
  olive: [0xd2c87a, 0xaaa052, 0x887c3e, 0x625026, 0x3c3016],
  green: [0xa6b062, 0x7c8a46, 0x5a6a36, 0x3e4a28, 0x262e1a],
  pine: [0xa49a5c, 0x807438, 0x665c2e, 0x4c4424, 0x302c18],
  pine2: [0x94a062, 0x6e7e48, 0x52623a, 0x3a4a2c, 0x24301c],
  bark: [0x9a7a56, 0x74583a, 0x564028, 0x3c2c1c, 0x241a10],
  thatch: [0xdcc488, 0xbca46c, 0x9c8a58, 0x7e6642, 0x524028],
  plank: [0xa88458, 0x86643e, 0x684a2c, 0x4a3420, 0x2e2014],
  stone: [0xc8b898, 0xa49478, 0x80725a, 0x5c5040, 0x3a3228],
  rock: [0xcaa878, 0xa88a60, 0x8a6e4c, 0x5e4c34, 0x3a2e22],
  grass: [0xb4b058, 0x8c8c40, 0x6a6a30, 0x4c4622, 0x2e2814],
  soil: [0x8a6a42, 0x6a5232, 0x523a22, 0x3c2a1a, 0x261a10],
  gold: [0xecd070, 0xc8a44c, 0xa4823a, 0x7a5a28, 0x523a1e],
  hill: [0xeed6a0, 0xcab47c, 0xb09a62, 0x8e7846, 0x665636],
  cloud: [0xfffbe8, 0xfcefc8, 0xf2dcb0, 0xdcc49a, 0xb8a684],
};

// ── 잎 뭉치 나무 ──
// 1) 어두운 바탕 덩어리로 틈을 막고 2) 큰 뭉치를 아래부터 그려, 위 뭉치의 그늘진 밑면이 아래 뭉치 머리에 얹히게 한다.
//    뭉치 가장자리는 3px 간격 잎 톱니, 속은 2px 잎 점 질감
function canopy(B, cx, cy, rx, ry, pal, seed, r0 = 9, r1 = 17) {
  const gl = (x, y) => -((x - cx) / rx) * 0.35 - ((y - cy) / ry) * 0.6;
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const a = Math.atan2(j / ry, i / rx), e = 0.78 + Math.sin(a * 3 + seed) * 0.06 + Math.sin(a * 7 + seed * 2) * 0.05, X = Math.round(cx + i), Y = Math.round(cy + j);
    (i / rx) ** 2 + (j / ry) ** 2 < e * e && B.put(X, Y, TT(pal, -0.5 + gl(X, Y) * 0.5, X, Y, 0.8, seed & 63));
  }
  const cl = [], n = Math.round((rx * ry) / (r1 * r1 * 0.55)) + 5;
  for (let k = 0; k < n; k++) {
    const a = hash(k, seed) * Math.PI * 2, d = Math.pow(hash(seed, k), 0.5) * 0.9;
    cl.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, r0 + Math.pow(hash(k, 7, seed), 1.3) * (r1 - r0), k]);
  }
  cl.sort((a, b) => b[1] - a[1]);
  for (const [x, y, r, k] of cl) {
    const R = Math.ceil(r * 1.15);
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const X = Math.round(x + i), Y = Math.round(y + j), d = Math.hypot(i, j), ang = Math.atan2(j, i);
      const re = r * (1 + (hash(Math.round(((ang + Math.PI) * r) / 3.2), k, seed) - 0.5) * 0.22 + (j < 0 ? 0.04 : -0.06));
      if (d > re) continue;
      const nx = i / r, ny = j / r, nz = Math.sqrt(Math.max(0, 1 - Math.min(1, (d / re) ** 2))), lam = (-0.55 * nx - 0.8 * ny) * 0.85 + nz * 0.35;
      let v = (lam - 0.14) * 1.25 + gl(X, Y) * 0.95 + tx(X, Y, 1, seed & 63);
      ny > 0.35 && d > re * 0.68 && (v -= 0.65);
      hash(X, Y, seed + 5) > 0.95 && (v += lam > 0.1 ? 0.5 : -0.5);
      B.put(X, Y, T5(pal, v));
    }
  }
}
// 줄기와 가지: 아래가 굵고 뿌리가 퍼진다, 세로 나무결, 오른쪽 그늘
function trunk(B, x, g, h, w, seed) {
  const P = PAL.bark;
  for (let y = 0; y < h; y++) {
    const t = y / h, half = (w / 2) * (1 - t * 0.45) + (y < 9 ? (9 - y) * 0.9 : 0), bx = x + Math.sin(t * 2.2 + seed) * 4;
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const u = i / Math.max(1, half), X = Math.round(bx + i), Y = g - y;
      let v = 0.4 - u * 0.85 + tx(X, Y >> 2, 0.8, seed);
      Math.abs(u) > 0.86 && (v = u < 0 ? -0.3 : -0.95);
      B.put(X, Y, T5(P, v));
    }
  }
  for (let k = 0; k < 4; k++) {
    const tt = 0.5 + k * 0.12, sy = g - h * tt, dir = k % 2 ? 1 : -1, L = 22 + hash(k, seed) * 24, x0 = x + Math.sin(tt * 2.2 + seed) * 4;
    for (let s = 0; s < L; s++) {
      const th = Math.max(1, Math.round(3.5 * (1 - s / L))), px = x0 + dir * s * 0.95, py = sy - s * 0.7 - s * s * 0.006;
      for (let q = 0; q < th; q++) B.put(px, py + q, T5(P, q === 0 ? 0.3 : -0.5));
    }
  }
}
export function leafTree(pal, seed = 1, s = 1) {
  const w = Math.round(230 * s), h = Math.round(290 * s);
  return art(w, h, (B) => {
    const cx = w / 2, g = h - 1;
    trunk(B, cx, g, h * 0.62, 16 * s, seed);
    canopy(B, cx - w * 0.14, g - h * 0.6, w * 0.28, h * 0.19, pal, seed + 1, 9 * s, 16 * s);
    canopy(B, cx + w * 0.15, g - h * 0.64, w * 0.26, h * 0.18, pal, seed + 2, 9 * s, 16 * s);
    canopy(B, cx - w * 0.02, g - h * 0.76, w * 0.28, h * 0.17, pal, seed + 3, 10 * s, 18 * s);
    canopy(B, cx - w * 0.24, g - h * 0.47, w * 0.17, h * 0.1, pal, seed + 4, 8 * s, 13 * s);
  });
}
// 자작나무: 흰 줄기 + 짧은 검은 껍질 무늬, 오른쪽 그늘
export function birch(pal, seed = 1, s = 1) {
  const w = Math.round(170 * s), h = Math.round(300 * s);
  return art(w, h, (B) => {
    const cx = w / 2, g = h - 1;
    for (let y = 0; y < h * 0.7; y++) {
      const half = 6 * s * (1 - y / (h * 0.9)) + (y < 6 ? (6 - y) * 0.6 : 0), bx = cx + Math.sin(y * 0.02) * 3;
      for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
        const X = Math.round(bx + i), Y = g - y, u = i / Math.max(1, half);
        const mark = hash(Y >> 1, (i + 20) >> 2, seed) > 0.86 || (Y % 23 < 2 && hash(Y, seed) > 0.4);
        B.put(X, Y, Math.abs(u) > 0.85 ? 0x2a2620 : mark ? 0x3a342a : T5([0xf8f4e8, 0xe6e0d0, 0xc8c2b0, 0x9a9484, 0x6a6458], 0.5 - u * 0.9 + tx(X, Y, 0.4)));
      }
    }
    canopy(B, cx, g - h * 0.72, w * 0.32, h * 0.2, pal, seed, 8 * s, 14 * s);
    canopy(B, cx + w * 0.1, g - h * 0.55, w * 0.22, h * 0.12, pal, seed + 5, 7 * s, 12 * s);
  });
}

// ── 이엉지붕 ──: 용마루에서 처마로 넓어지는 지붕, 3px마다 짚 줄, 짚 결, 왼쪽(해 쪽) 밝음, 처마 아래 깊은 그늘
function thatch(B, cx, wFull, yTop, yEave, o = {}) {
  const P = PAL.thatch, full = wFull / 2, ridge = full * (o.ridge ?? 0.42), H = yEave - yTop, sd = o.seed ?? 1;
  for (let y = yTop; y <= yEave + 3; y++) {
    const t = Math.min(1, (y - yTop) / H), half = ridge + (full - ridge) * Math.pow(t, 0.85) - (y > yEave ? (y - yEave) * 1.5 : 0);
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const u = (x - cx) / full, off = Math.round(hash(x >> 2, 1, sd) * 2), row = Math.floor((y - yTop + off) / 3);
      let v = 0.35 - u * 0.5 + (hash(x >> 1, row, sd) - 0.5) * 0.4 - t * 0.15 + tx(x, y, 0.45, sd);
      (y - yTop + off) % 3 === 0 && (v -= 0.3);
      y === yTop && (v += 0.5);
      y >= yEave && (v = y === yEave ? -0.35 : -0.95);
      Math.abs(x - cx) > half - 1.2 && (v -= 0.5);
      B.put(x, y, T5(P, v));
    }
  }
  for (let x = Math.floor(cx - ridge); x <= cx + ridge; x++) for (let j = -2; j < 1; j++) B.put(x, yTop + j, T5(P, j === -2 ? 0.7 : (x >> 2) % 2 ? 0.2 : -0.3));
}
// 세로 나무판 벽: 판마다 밝기, 판 틈 어둠, 위쪽은 처마 그늘로 어둡다
function planks(B, x0, y0, x1, y1, o = {}) {
  const P = o.pal ?? PAL.plank;
  for (let x = x0; x < x1; x++) {
    const b = Math.floor((x - x0) / 5), px = (x - x0) % 5, sft = (hash(b, x0, 3) - 0.5) * 0.3;
    for (let y = y0; y < y1; y++) {
      let v = 0.25 - ((x - x0) / (x1 - x0)) * 0.35 + sft + (px === 1 ? 0.15 : 0) - (y - y0 < (o.shade ?? 8) ? 0.75 : 0) + tx(x, y >> 1, 0.3, 4);
      px === 0 && (v = -0.75);
      (y + b * 11) % 26 === 0 && px === 2 && (v -= 0.4);
      B.put(x, y, T5(P, v));
    }
  }
}
function stoneBase(B, x0, x1, g, h = 5) {
  for (let x = x0 - 2; x < x1 + 2; x++) for (let y = g - h; y <= g; y++) {
    const st = Math.floor((x + (Math.floor((g - y) / 3) % 2) * 4) / 8);
    let v = 0.3 - ((x - x0) / (x1 - x0)) * 0.4 + (hash(st, Math.floor((g - y) / 3), 5) - 0.5) * 0.5;
    ((x + (Math.floor((g - y) / 3) % 2) * 4) % 8 === 0 || (g - y) % 3 === 0) && (v = -0.7);
    B.put(x, y, T5(PAL.stone, v));
  }
}
function doorway(B, x, g, w, h, lit) {
  for (let j = 0; j < h; j++) for (let i = -2; i < w + 2; i++) {
    const frame = i < 0 || i >= w || j === h - 1;
    B.put(x + i, g - j, frame ? T5(PAL.bark, i < 0 ? 0.3 : -0.3) : lit ? mix(0x3a1e10, lit, Math.max(0, 1 - j / h) * 0.7) : 0x1a1008);
  }
}
function smallWindow(B, L, x, y, lit = 0xffc860) {
  for (let j = -1; j < 8; j++) for (let i = -1; i < 7; i++) B.put(x + i, y + j, i < 0 || j < 0 || i === 6 || j === 7 ? T5(PAL.bark, -0.4) : i === 3 ? 0x3a2414 : lit);
  L.push([x + 3, y + 4, 9, lit]);
}
// 박공 끝 엇갈린 들보 (바이킹 긴 집)
function crossedBeams(B, cx, y) {
  for (let k = 0; k < 14; k++) for (let q = 0; q < 2; q++) (B.put(cx - k + q, y - k, T5(PAL.bark, 0)), B.put(cx + k - q, y - k, T5(PAL.bark, -0.3)));
}
// 이엉지붕 긴 집 하나 (벽 높이 wallH · 지붕 높이 roofH)
export function longhouse(B, L, cx, g, w, o = {}) {
  const wallH = o.wallH ?? 30, roofH = o.roofH ?? 50, x0 = Math.round(cx - w / 2), x1 = Math.round(cx + w / 2);
  stoneBase(B, x0, x1, g, 5);
  planks(B, x0, g - wallH, x1, g - 5, { shade: 7 });
  o.door !== false && doorway(B, Math.round(cx + (o.doorDX ?? 0) - 8), g - 5, 16, wallH - 12, o.lit);
  for (const wx of o.windows ?? []) smallWindow(B, L, Math.round(cx + wx), g - wallH + 10);
  thatch(B, cx, w + 18, g - wallH - roofH, g - wallH + 3, { seed: o.seed ?? 1, ridge: o.ridge });
  o.beams && crossedBeams(B, cx + (o.beamDX ?? 0), g - wallH - roofH - 1);
}
// ── 소품 ──
export function barrelB(B, x, g) { for (let j = 0; j < 14; j++) for (let i = -6; i <= 6; i++) { const half = 6 - Math.abs(j - 7) * 0.15; if (Math.abs(i) > half) continue; B.put(x + i, g - j, j === 3 || j === 10 ? 0x4a4a50 : T5(PAL.plank, 0.4 - (i / 6) * 0.7 - (i % 3 === 0 ? 0.25 : 0))); } }
export function crateB(B, x, g, s = 12) { for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) B.put(x + i, g - j, i === 0 || j === 0 || i === s - 1 || j === s - 1 || i === j || i === s - 1 - j ? T5(PAL.plank, -0.5) : T5(PAL.plank, 0.35 - i / s * 0.5)); }
export function hay(B, x, g, w = 30, h = 16) { for (let j = 0; j < h; j++) { const half = w / 2 * Math.sqrt(1 - (j / h) ** 2); for (let i = -Math.ceil(half); i <= half; i++) B.put(x + i, g - j, T5(PAL.thatch, 0.3 - i / half * 0.5 + (hash(x + i, j) - 0.5) * 0.4 - (j < 2 ? 0.4 : 0))); } }

// ── 하늘: 옅은 하늘색 → 따뜻한 지평선, 아주 큰 해 번짐, 역광 뭉게구름 ──
export function skyGold(W, H, sun = [130, 118]) {
  return canvasOf(W, H, (B) => {
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1), c = t < 0.4 ? mix(0x92c2e2, 0xb2d6ea, t / 0.4) : t < 0.72 ? mix(0xb2d6ea, 0xf2e2c0, (t - 0.4) / 0.32) : mix(0xf2e2c0, 0xf8ecd4, (t - 0.72) / 0.28);
      for (let x = 0; x < W; x++) B.put(x, y, c);
    }
    const [sx, sy] = sun;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - sx, (y - sy) * 1.1) / 320; d < 1 && B.put(x, y, 0xfff4d2, Math.round(225 * (1 - d) ** 2.1)); }
    // 뭉게구름: 덩어리 높이를 부드럽게 더한 높이장 → 기울기 음영 + 붓 질감, 가장자리도 질감으로 들쭉날쭉,
    //   해 쪽 가장자리 금빛 테, 아래는 평평하고 하늘에 풀린다
    const cloud = (cx, cy, w, h, seed, flat = 0) => {
      const P = [], n = Math.round(w / 6);
      for (let k = 0; k < n; k++) {
        const t = hash(k, seed), env = Math.pow(Math.sin(t * Math.PI), 0.7), r = h * (0.14 + env * (flat ? 0.2 : 0.34)) * (0.6 + hash(seed, k) * 0.6);
        P.push([cx - w / 2 + t * w, cy - r * 0.5 - env * h * (flat ? 0.2 : 0.55) * hash(k, seed, 3), r]);
      }
      const x0 = Math.floor(cx - w * 0.7), y0 = Math.floor(cy - h * 1.5), GW = Math.ceil(w * 1.4), GH = Math.ceil(h * 1.7), S = new Float32Array(GW * GH);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let s = 0;
        for (const [px, py, r] of P) { const d2 = ((x0 + x - px) ** 2 + (y0 + y - py) ** 2) / (r * r); d2 < 1 && (s += (1 - d2) ** 2 * r); }
        S[y * GW + x] = s;
      }
      const at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH ? 0 : S[y * GW + x]), TH = h * 0.06;
      const lx0 = sx - cx, ly0 = sy - cy, ll = Math.hypot(lx0, ly0) || 1, lx = lx0 / ll, ly = ly0 / ll;
      for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) {
        const s = at(x, y), X = x0 + x, Y = y0 + y;
        if (X < 0 || X >= W || Y < 0 || Y >= H) continue;
        if (s < TH * (1 + tx(X, Y, 0.9, seed)) || Y > cy + 2 + Math.sin(X * 0.17 + seed) * 1.5) continue;
        const gx = (at(x + 1, y) - at(x - 1, y)) / 2, gy = (at(x, y + 1) - at(x, y - 1)) / 2, gm = Math.hypot(gx, gy) + 0.6;
        const facing = -(gx * lx + gy * ly) / gm, low = (Y - (cy - h)) / (h * 1.15);
        let v = facing * 0.7 + 0.45 - low * 0.95 + tx(X, Y, 0.75, seed + 1);
        s < TH * 2.4 && facing > 0.1 && (v = 1);
        const a = Y > cy - h * 0.25 ? Math.max(90, Math.round(255 * Math.min(1, (cy + 2 - Y) / (h * 0.3)))) : 255;
        B.put(X, Y, T5(PAL.cloud, v), a);
      }
    };
    for (const c of [[600, 70, 130, 40, 11], [60, 92, 150, 46, 9], [470, 140, 230, 78, 5], [250, 178, 330, 100, 3], [380, 206, 420, 30, 13, 1]]) cloud(...c);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - sx, y - sy); d < 16 ? B.put(x, y, 0xffffff) : d < 50 && B.put(x, y, 0xfff8dc, Math.round(210 * (1 - (d - 16) / 34))); }
  });
}
// ── 먼 산 · 구릉(밭 · 오솔길 · 관목 · 작은 나무) · 이엉지붕 마을, 위쪽일수록 금빛 안개 (이어지는 띠) ──
export function hillsVillage(W = 640, H = 200) {
  const B = G3.buffer(W, H, !0), L = [];
  const MP = [0xe4dcc0, 0xd0cab0, 0xbab8a0, 0xa4a690, 0x8e9282];
  const m1 = (x) => 64 - vn(x, 0, 160, 4) * 36 - vn(x, 0, 32, 5) * 8;
  for (let x = 0; x < W; x++) { const top = Math.round(m1(x)), sl = m1(x + 1) - m1(x - 1); for (let y = top; y < H; y++) B.put(x, y, TT(MP, 0.35 - (y - top) / 40 + (sl < 0 ? 0.35 : -0.25) * Math.min(1, Math.abs(sl)), x, y, 0.4, 3)); }
  const h0 = (x) => 98 - vn(x, 3, 160, 9) * 26 - vn(x, 3, 40, 10) * 6;
  for (let x = 0; x < W; x++) { const top = Math.round(h0(x)), sl = h0(x + 1) - h0(x - 1); for (let y = top; y < H; y++) B.put(x, y, TT(PAL.hill, 0.5 - (y - top) / 45 + (sl < 0 ? 0.25 : -0.2) + (y === top ? 0.4 : 0), x, y, 0.6, 4)); }
  for (let k = 0; k < 80; k++) {
    const x = hash(k, 31) * W, y = h0(x) + 3 + hash(31, k) * 22, r = 2 + hash(k, 32) * 3;
    for (let j = -r; j <= r; j++) for (let i = -r * 1.2; i <= r * 1.2; i++) (i / 1.2) ** 2 + j * j <= r * r && B.put(x + i, y + j, T5(PAL.green, ((-i - j) / r) * 0.6 - 0.2));
  }
  const h1 = (x) => 126 - vn(x, 1, 160, 6) * 24 - Math.sin((x / W) * Math.PI * 2) * 6;
  for (let x = 0; x < W; x++) {
    const top = Math.round(h1(x)), sl = h1(x + 1) - h1(x - 1);
    for (let y = top; y < H; y++) {
      const field = vn(x, y * 2.5, 40, 12) > 0.6, pal = vn(x, y, 80, 13) > 0.5 ? PAL.hill : PAL.grass;
      let v = 0.6 - (y - top) / 40 + (sl < 0 ? 0.2 : -0.15) + (field ? ((y + Math.round(x * 0.25)) % 4 === 0 ? -0.5 : 0.15) : 0);
      y === top && (v += 0.4);
      B.put(x, y, TT(pal, v, x, y, 0.6, 5));
    }
  }
  for (let t = 0; t < 1; t += 0.0015) { const x = 330 + Math.sin(t * 5) * 60 + t * 90, y = h1(x) + 2 + t * 66; for (let i = -1 - t * 4; i <= 1 + t * 4; i++) B.put(x + i, y, TT([0xf0dcaa, 0xdcc490, 0xc4aa78, 0xa08a60, 0x7a6a4a], 0.3, Math.round(x + i), Math.round(y), 0.5)); }
  for (let k = 0; k < 22; k++) {
    const x = hash(k, 41) * W, base = h1(x) + 6 + hash(41, k) * 40, r = 4 + hash(k, 42) * 5, pal = [PAL.green, PAL.olive, PAL.autumn][k % 3], tall = hash(k, 43) > 0.5;
    tall && (() => { for (let j = 0; j < r * 1.4; j++) B.put(x, base - j, PAL.bark[3]); })();
    canopy(B, x, base - r * (tall ? 1.8 : 0.8), r * 1.3, r, pal, 400 + k, 2, 3.5);
  }
  for (const [x, w, s] of [[150, 90, 1], [262, 60, 2], [480, 74, 3], [560, 44, 4]]) longhouse(B, L, x, Math.round(h1(x)) + 8, w, { wallH: 14, roofH: 24, seed: s, door: !1, beams: !0 });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; B.al[i] && (B.col[i] = mix(B.col[i], 0xf2e2bc, 0.5 - (y / H) * 0.32)); }
  return { c: B.toCanvas(), w: W, h: H, lights: [] };
}
// 침엽수 한 그루: 아래 층부터 그려 위 층이 아래 층 머리를 덮는다. 층 밑은 늘어진 가지 끝 톱니, 왼쪽 끝은 햇빛
function pine(B, x, base, h, seed, hz) {
  const P = hash(seed, 9) > 0.5 ? PAL.pine : PAL.pine2, w = h * (0.34 + hash(seed, 2) * 0.1), tiers = 6 + Math.floor(hash(seed, 3) * 3), top = base - h;
  for (let j = 0; j < Math.max(5, h * 0.09); j++) for (let i = -1; i <= 1; i++) B.put(x + i, base - j, hz(T5(PAL.bark, i < 0 ? 0 : -0.6)));
  for (let k = tiers - 1; k >= 0; k--) {
    const t0 = k / tiers, t1 = Math.min(1, (k + 1.6) / tiers), yT = top + t0 * h * 0.88, yB = top + t1 * h * 0.88, halfB = (w / 2) * (0.14 + 0.86 * t1);
    for (let y = Math.floor(yT); y <= Math.ceil(yB) + 5; y++) {
      const f = Math.min(1, (y - yT) / Math.max(1, yB - yT)), half = halfB * Math.pow(Math.max(0.02, f), 0.8);
      for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
        const X = Math.round(x + i), u = i / Math.max(1, half), edge = yB + Math.abs(u) * 2.5 + hash(X >> 1, k, seed) * 3.5 - 1.5;
        if (y > edge) continue;
        let v = 0.3 - u * 0.6 - f * 0.4 + (f < 0.15 ? 0.25 : 0) + tx(X, y, 0.9, seed & 255);
        u < -0.7 && f > 0.45 && (v += 0.45);
        y > edge - 2 && (v -= 0.45);
        B.put(X, y, hz(T5(P, v)));
      }
    }
  }
  for (let j = 0; j < 5; j++) B.put(x, top - j, hz(T5(P, 0)));
}
// 침엽수 띠 (haze: 금빛 안개에 묻힌 정도 — 먼 띠는 짙게)
export function pineBand(W = 640, H = 190, seed = 3, haze = 0.25, dens = 15) {
  return tile(W, H, (B) => {
    const hz = (c) => mix(c, 0xe0cc98, haze), list = [];
    for (let k = 0; k < Math.round(W / dens); k++) list.push([hash(k, seed) * W, H - 2 - hash(k, 2, seed) * 14, H * (0.4 + hash(seed, k) * 0.55), k]);
    list.sort((a, b) => a[1] - b[1]);
    for (const [x, base, h, k] of list) pine(B, x, base, h, seed * 100 + k, hz);
  });
}
// ── 땅 단면: 두꺼운 이끼 풀 가장자리(아래로 늘어짐 · 위로 풀잎 · 꽃) + 짙은 적갈색 흙(결 · 돌 · 뿌리 · 해골) + 아래 그늘 ──
//   캔버스 줄 8이 땅선(발 딛는 줄)
export function groundBank(W = 640, H = 46) {
  return tile(W, H, (B) => {
    const G0 = 8, soilTop = 16, under = 38;
    for (let x = 0; x < W; x++) {
      const top = G0 - Math.round(vn(x, 0, 8, 2) * 2), drip = soilTop + Math.floor(Math.max(0, vn(x, 5, 16, 3) - 0.45) * 10) + (hash(x >> 1, 6) > 0.8 ? 2 : 0);
      for (let y = top; y < drip; y++) {
        let v = y === top ? 0.75 : y < top + 3 ? 0.35 : -(y - top) / 14;
        y >= drip - 1 && (v -= 0.45);
        B.put(x, y, TT(PAL.grass, v, x, y, 0.8, 1));
      }
      if (hash(x, 3) > 0.4) { const L = 1 + Math.floor(hash(x, 4) * 7); for (let k = 1; k <= L; k++) B.put(x + (k > 3 && hash(x, 5) > 0.5 ? 1 : 0), top - k, T5(PAL.grass, k === L ? 0.7 : 0.1)); }
      for (let y = drip; y < under; y++) {
        const band = Math.floor((y + Math.round(vn(x, 0, 16, 7) * 3)) / 4);
        let v = 0.35 - (y - soilTop) / 26 + (hash(band, x >> 3) - 0.5) * 0.3 + tx(x, y, 0.6, 2);
        y < drip + 2 && (v -= 0.6);
        B.put(x, y, T5(PAL.soil, v));
      }
      for (let y = under; y < H; y++) B.put(x, y, T5(PAL.soil, -0.95));
    }
    for (let k = 0; k < W / 12; k++) {
      const x = Math.floor(hash(k, 9) * W), y = soilTop + 5 + Math.floor(hash(k, 10) * 17), r = 2 + Math.floor(hash(k, 11) * 4);
      for (let j = -r; j <= r; j++) for (let i = -r - 1; i <= r + 1; i++) (i * i) / ((r + 1) * (r + 1)) + (j * j) / (r * r) < 1 && B.put(x + i, y + j, TT(PAL.rock, (-(i + j) / r) * 0.6 - 0.1 - (j > r * 0.5 ? 0.4 : 0), x + i, y + j, 0.4));
    }
    for (let k = 0; k < W / 160; k++) { const x = Math.floor(hash(k, 12) * W), y = soilTop + 9; for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) B.put(x + i, y + j, j === 2 && (i === 1 || i === 4) ? 0x2a1a10 : j === 4 && i % 2 ? 0x3a2a1a : i === 5 ? 0xa89a80 : 0xd8ccb0); }
    for (let k = 0; k < W / 36; k++) { const x = Math.floor(hash(k, 13) * W), L = 8 + hash(k, 18) * 14; for (let j = 0; j < L; j++) B.put(x + Math.round(Math.sin(j * 0.5 + k) * 1.5), soilTop + j, T5(PAL.bark, -0.6)); }
    for (let k = 0; k < W / 9; k++) { const x = Math.floor(hash(k, 14) * W), y = G0 - 1 - Math.floor(hash(k, 15) * 4), c = [0xf4f0e0, 0xeec848, 0xd87aa0, 0x9a82dc][k % 4]; B.put(x, y, c), B.put(x + 1, y, sh(c, -0.25)), B.put(x, y + 1, PAL.grass[3]); }
  });
}
// 물: 위 흙·풀 단면이 거꾸로 일렁이며 비치고, 아래로 갈수록 어두운 올리브 갈색 + 짧은 물결 빛 + 연잎
export function waterBank(W = 640, H = 60) {
  const tmp = groundBank(W, 46).getContext("2d").getImageData(0, 0, W, 46).data;
  return tile(W, H, (B) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = y / H, sy = 37 - Math.floor(y * 0.85), sx = x + Math.round(Math.sin(y * 0.8 + x * 0.04) * (1 + t * 2));
      let c = mix(0x5e5638, 0x302c1c, t);
      if (sy >= 4) { const i = (sy * W + (((sx % W) + W) % W)) * 4; tmp[i + 3] && (c = mix(sh((tmp[i] << 16) | (tmp[i + 1] << 8) | tmp[i + 2], -0.15), c, 0.5 + t * 0.35)); }
      hash(x >> 3, y, 4) > 0.9 && y % 3 === 0 && (c = mix(c, 0xb0aa80, 0.45 - t * 0.3));
      B.put(x, y, c);
    }
    for (let k = 0; k < W / 70; k++) { const x = Math.floor(hash(k, 16) * W), y = 14 + Math.floor(hash(k, 17) * (H - 24)); for (let j = -2; j <= 2; j++) for (let i = -6; i <= 6; i++) (i * i) / 36 + (j * j) / 6 < 1 && !(i > 1 && Math.abs(j) < 1) && B.put(x + i, y + j, T5(PAL.olive, j < 0 ? 0.1 : -0.5)); }
  });
}
// 전경 물풀: 부들 · 노란 풀 · 흰 꽃 무리 · 파란 꽃 · 갈대 · 노란 풀 덤불 · 짙은 넓은 잎 (덩어리로, 사이사이 빈 물)
export function waterPlants(W = 640, H = 110) {
  return tile(W, H, (B) => {
    const g = H - 1, CAT = [0x9a6a3a, 0x7a4a26, 0x5e3418, 0x42240e, 0x2a160a];
    const clump = (cx, kind, s) => {
      if (kind === 0) for (let k = 0; k < 7; k++) { const x = cx + (k - 3) * 4 + Math.round(hash(k, cx) * 3), L = (40 + hash(cx, k) * 40) * s; for (let j = 0; j < L; j++) B.put(x + (j > L * 0.6 ? 1 : 0), g - j, T5(PAL.grass, j % 5 ? -0.3 : 0)); for (let j = 0; j < 9; j++) for (let i = 0; i < 3; i++) B.put(x + i, g - L - j + 2, T5(CAT, i === 0 ? 0.3 : -0.2)); }
      if (kind === 1) for (let k = 0; k < 26; k++) { const x0 = cx + (hash(k, cx, 1) - 0.5) * 40 * s, L = (18 + hash(cx, k, 2) * 30) * s, lean = (hash(k, 3, cx) - 0.5) * 0.8; for (let j = 0; j < L; j++) for (let w = 0; w < 2; w++) B.put(x0 + lean * j + w, g - j, T5(PAL.gold, (j / L) * 1.2 - 0.6 + (w ? -0.3 : 0.1))); }
      if (kind === 2) { for (let k = 0; k < 12; k++) { const x = cx + (hash(k, cx) - 0.5) * 34, y = g - 4 - hash(cx, k) * 12; for (let j = 0; j < g - y; j++) B.put(x, y + j, PAL.grass[3]); for (const [i, j] of [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) B.put(x + i, y + j, 0xf8f4e8); B.put(x, y, 0xf0c840); } }
      if (kind === 3) for (let k = 0; k < 14; k++) { const x = cx + (hash(k, cx, 4) - 0.5) * 30, L = 10 + hash(cx, k, 5) * 18; for (let j = 0; j < L; j++) B.put(x, g - j, PAL.grass[2]); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) Math.abs(i) + Math.abs(j) < 2 && B.put(x + i, g - L + j, i < 0 ? 0x8a9ae0 : 0x5a64c0); }
      if (kind === 4) for (let k = 0; k < 18; k++) { const x = cx + (hash(k, cx, 6) - 0.5) * 30, L = (20 + hash(cx, k, 7) * 36) * s, lean = (hash(k, cx, 8) - 0.5) * 0.4; for (let j = 0; j < L; j++) B.put(x + lean * j, g - j, T5(PAL.grass, j / L - 0.5)); }
      // 노란 풀 덤불: 둥근 윤곽 안에 휘어진 풀잎 수십 가닥, 끝이 밝다
      if (kind === 5) {
        const HW = 44 * s, HT = 62 * s;
        for (let k = 0; k < 120 * s; k++) {
          const u = hash(k, cx, 9) * 2 - 1, x0 = cx + u * HW, L = HT * Math.sqrt(1 - u * u) * (0.55 + hash(cx, k, 10) * 0.5), bend = (hash(k, 11, cx) - 0.5) * 1.4 + u * 0.6;
          for (let j = 0; j < L; j++) { const t = j / L, x = x0 + bend * t * t * L * 0.35; for (let w = 0; w < 2; w++) B.put(x + w, g - j, T5(PAL.gold, t * 1.3 - 0.75 - u * 0.25 + (w ? -0.25 : 0.1) + (hash(k, 12) > 0.75 ? -0.35 : 0))); }
        }
      }
      // 짙은 넓은 잎 (부들 밑동)
      if (kind === 6) for (let k = 0; k < 16; k++) {
        const x0 = cx + (hash(k, cx, 20) - 0.5) * 30 * s, L = (14 + hash(cx, k, 21) * 22) * s, bend = (hash(k, 22, cx) - 0.5) * 2;
        for (let j = 0; j < L; j++) { const t = j / L, x = x0 + bend * t * t * L * 0.4, wd = Math.max(1, Math.round(3 * Math.sin(t * Math.PI) + 0.5)); for (let w = 0; w < wd; w++) B.put(x + w, g - j, T5(PAL.green, t * 0.9 - 0.7 + (w === 0 ? 0.35 : 0))); }
      }
    };
    const plan = [[30, 1, 1.1], [62, 6, 1], [80, 0, 1], [125, 5, 0.9], [180, 2, 1], [235, 0, 0.9], [262, 6, 0.8], [305, 3, 1], [372, 5, 1.15], [430, 4, 1.1], [478, 0, 1.1], [505, 6, 1], [540, 2, 1], [590, 5, 0.85], [628, 0, 0.9]];
    for (const [x, k, s] of plan) clump(x, k, s);
  });
}
// ── 땅선 소품 (덤불 · 들꽃 · 풀포기 · 돌 · 버섯 · 엮은 울타리) — 거점 폭 전체, skip 구간은 비운다 ──
export function groundProps(W, H = 40, skip = []) {
  return canvasOf(W, H, (B) => {
    const g = H - 1, free = (x, r) => !skip.some(([a, b]) => x + r > a && x - r < b);
    const FL = [[0xf6f2e4, 0xc8c4b4], [0xf0c844, 0xb88a20], [0xe07aa0, 0xa04870], [0x9a82dc, 0x6a52a8], [0xe85a3a, 0xa03020]];
    for (let x = 6, k = 0; x < W - 6; k++) {
      const kind = Math.floor(hash(k, 51) * 6), r = 10 + hash(k, 52) * 14;
      if (free(x, r)) {
        if (kind === 0) { const h = 10 + hash(k, 54) * 12; canopy(B, x, g - h / 2 + 1, r, h / 2, [PAL.green, PAL.olive, PAL.green][k % 3], 900 + k, 3, 6); }
        if (kind === 1) for (let q = 0; q < 12; q++) { const fx = x + (hash(q, k, 55) - 0.5) * r * 2, L = 3 + hash(k, q, 56) * 8, [c1, c2] = FL[(k + q) % FL.length]; for (let j = 0; j < L; j++) B.put(fx, g - j, PAL.grass[3]); B.put(fx, g - L, c1), B.put(fx + 1, g - L, c2), B.put(fx, g - L - 1, c1); }
        if (kind === 2) for (let q = 0; q < 16; q++) { const bx = x + (hash(q, k, 57) - 0.5) * r * 1.4, L = 4 + hash(k, q, 58) * 9, lean = (hash(q, 59, k) - 0.5) * 0.9; for (let j = 0; j < L; j++) B.put(bx + lean * j, g - j, T5(PAL.grass, (j / L) * 1.3 - 0.5)); }
        if (kind === 3) for (let q = 0; q < 3; q++) {
          const sx = x + (q - 1) * 9 + hash(q, k) * 4, rr = 3 + hash(k, q, 60) * 4;
          for (let j = 0; j <= rr; j++) for (let i = -rr - 2; i <= rr + 2; i++) { const nx = i / (rr + 2), ny = -j / rr; nx * nx + ny * ny < 1 && B.put(sx + i, g - j, TT(PAL.rock, -nx * 0.6 - ny * 0.8 - 0.2 - (nx * nx + ny * ny > 0.75 && nx > 0 ? 0.6 : 0), Math.round(sx + i), g - j, 0.5)); }
        }
        if (kind === 4) for (let q = 0; q < 3; q++) {
          const mx = x + (q - 1) * 6, mh = 3 + q % 2 * 2, red = hash(k, 61) > 0.5;
          for (let j = 0; j < mh; j++) B.put(mx, g - j, 0xe8dcc4), B.put(mx + 1, g - j, 0xc4b498);
          for (let i = -3; i <= 4; i++) for (let j = 0; j < 3; j++) Math.abs(i - 0.5) < 4 - j && B.put(mx + i, g - mh - j, (i + j) % 3 === 0 && red && j > 0 ? 0xf8f0e0 : red ? (i < 1 ? 0xd84a30 : 0xa02a1a) : i < 1 ? 0xb08a5a : 0x7a5a38);
        }
        if (kind === 5) {
          for (let p = 0; p < 3; p++) { const px = x - 12 + p * 12; for (let j = 0; j < 16; j++) for (let i = 0; i < 2; i++) B.put(px + i, g - j, T5(PAL.bark, i ? -0.5 : 0.2)); }
          for (const hy of [5, 9, 13]) for (let i = -14; i <= 14; i++) B.put(x + i, g - hy + Math.round(Math.sin(i * 0.8 + hy) * 1), T5(PAL.bark, (i + hy) % 4 < 2 ? 0.3 : -0.3));
        }
      }
      x += 18 + hash(k, 53) * 40;
    }
  });
}
// 큰 바위 무더기 (덩어리 셋, 넓은 면 + 붓 질감, 꼭대기 이끼, 아래 오른쪽 짙은 테)
export function boulderArt(w, h, seed = 1) {
  return art(w + 8, h + 4, (B) => {
    const g = h + 3, cx = (w + 8) / 2;
    for (const [lx, rx, ry] of [[cx - w * 0.28, w * 0.24, h * 0.62], [cx + w * 0.26, w * 0.26, h * 0.5], [cx - w * 0.04, w * 0.34, h]]) {
      for (let j = 0; j <= ry + 2; j++) for (let i = -rx - 2; i <= rx + 2; i++) {
        const X = Math.round(lx + i), Y = g - j, nx = i / rx, ny = -j / ry, e = 1 + (vn(X, Y, 8, seed) - 0.5) * 0.3, d2 = nx * nx + ny * ny;
        if (d2 > e * e) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d2 / (e * e))), lam = (-0.55 * nx - 0.8 * ny) * 0.8 + nz * 0.35;
        let v = (lam - 0.15) * 1.2 + tx(X, Y, 0.7, seed) + (vn(X, Y, 16, seed + 3) - 0.5) * 0.5;
        d2 > e * e * 0.82 && lam < 0.1 && (v = -0.95);
        B.put(X, Y, ny < -0.55 && vn(X, Y, 8, seed + 7) > 0.55 ? TT(PAL.grass, v + 0.2, X, Y, 0.6) : T5(PAL.rock, v));
      }
    }
    for (let k = 0; k < 4; k++) { let x = cx + (hash(k, seed) - 0.5) * w * 0.7, y = g - h * (0.3 + hash(seed, k) * 0.5); for (let s = 0; s < 6 + hash(k, 3) * 8; s++) { B.has(x, y) && B.put(x, y, PAL.rock[4]); x += hash(k, s) - 0.5; y += 1; } }
  });
}
// ── 건물 (거점 시설) ──
export function houseArt(o) {
  const w = o.w ?? 170, h = (o.wallH ?? 32) + (o.roofH ?? 56) + 20;
  return art(w + 40, h, (B, L) => {
    const cx = (w + 40) / 2, g = h - 1;
    longhouse(B, L, cx, g, w, { ...o, lit: o.lit ?? 0xffa040 });
    o.extra && o.extra(B, L, cx, g);
  });
}
// 통나무 말뚝 성문 (서문·동문): 말뚝 벽 + 이엉지붕 망루 둘 + 무거운 판문 + 깃발
export function palisadeGate(col) {
  const w = 190, h = 200;
  return art(w, h, (B, L) => {
    const g = h - 1, log = (x, top) => { for (let y = top; y <= g; y++) for (let i = 0; i < 7; i++) { const tip = top + 6 - y; if (tip > 0 && Math.abs(i - 3) > (6 - tip) / 2) continue; B.put(x + i, y, T5(PAL.bark, 0.45 - i * 0.18 + (y % 19 === 0 ? -0.4 : 0) + tx(x + i, y >> 2, 0.5, 9))); } };
    for (let x = 0; x < w; x += 7) log(x, g - 70 - Math.round(hash(x, 3) * 10));
    for (const tx0 of [6, w - 46]) {
      for (let x = tx0; x < tx0 + 40; x += 7) log(x, g - 120);
      planks(B, tx0 - 4, g - 132, tx0 + 44, g - 118, { shade: 3 });
      thatch(B, tx0 + 20, 60, g - 162, g - 132, { seed: tx0, ridge: 0.1 });
      smallWindow(B, L, tx0 + 16, g - 112, 0xffb050);
    }
    const ax = w / 2;
    for (let j = 0; j < 62; j++) for (let i = -26; i <= 26; i++) { const top = j > 44 ? Math.sqrt(Math.max(0, 26 * 26 - ((j - 44) * 1.5) ** 2)) : 26; Math.abs(i) < top && B.put(ax + i, g - j, (i + 30) % 7 === 0 ? 0x2a1a10 : j % 14 === 4 ? 0x4a4a52 : T5(PAL.plank, -0.1 - Math.abs(i) / 60)); }
    for (let j = 0; j < 62; j++) B.put(ax, g - j, 0x1a1008);
    for (const bx of [ax - 40, ax + 30]) for (let j = 0; j < 30; j++) for (let i = 0; i < 10; i++) B.put(bx + i, g - 100 + j + (i % 2 && j > 26 ? 2 : 0), T5([sh(col, 0.3), sh(col, 0.1), col, sh(col, -0.3), sh(col, -0.5)], 0.4 - i * 0.08));
    L.push([ax, g - 20, 20, 0xffb050]);
  });
}
