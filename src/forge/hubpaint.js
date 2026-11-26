// 거점 그림 (레퍼런스 ref08 기준: 가을 해질녘 이엉지붕 마을) — 손으로 찍은 픽셀 아트처럼
//   잎 뭉치 나무 · 역광 구름 · 이엉지붕 긴 집 · 초록 구릉 · 흙 단면 · 비치는 물 · 부들·노란 풀·들꽃 전경
//   모든 색은 5단 팔레트(밝음 → 어둠)에서만 고른다. 디더링 없음. 빛은 왼쪽 위(해 쪽)
import * as G3 from "./bg3d.js";
import { mix, sh, hash, vn } from "./bgart.js";

export const art = (w, h, fn) => { const B = G3.buffer(w, h, !1), lights = []; fn(B, lights); return { c: B.toCanvas(), w, h, lights }; };
export const canvasOf = (w, h, fn) => { const B = G3.buffer(w, h, !1); fn(B); return B.toCanvas(); };
const T5 = (pal, v) => pal[v > 0.55 ? 0 : v > 0.18 ? 1 : v > -0.2 ? 2 : v > -0.58 ? 3 : 4];
export const PAL = {
  autumn: [0xfff0a0, 0xf4c650, 0xdc9430, 0xb0641c, 0x6e3c14],
  olive: [0xd0dc78, 0x9cb444, 0x6a8a2e, 0x46642a, 0x2a3e1c],
  green: [0xb8d070, 0x84a840, 0x5a8030, 0x3a5c26, 0x22381a],
  bark: [0xa08060, 0x7a5a3c, 0x5a3e28, 0x3e2a1a, 0x261810],
  thatch: [0xfae4a4, 0xe4c072, 0xc29a52, 0x8e6c3a, 0x5a4226],
  plank: [0xb88a5a, 0x96683e, 0x74502e, 0x543820, 0x342214],
  stone: [0xd0c8b8, 0xa8a090, 0x847c70, 0x5e5850, 0x3a3630],
  grass: [0xc4dc6a, 0x96bc44, 0x6a9432, 0x466a26, 0x2a4418],
  soil: [0xb08a58, 0x8e6a40, 0x6c4c2c, 0x4a321c, 0x2e1e12],
  cloud: [0xfffaea, 0xf8e2b4, 0xe6c896, 0xc2b4a0, 0x9e9aa4],
};

// ── 잎 뭉치 나무 ──
// 수관 = 작은 뭉치(반지름 r0~r1) 수십 개. 위 뭉치부터 그려 아래(앞) 뭉치가 덮는다.
// 뭉치마다 왼쪽 위 밝은 테 · 오른쪽 아래 어두운 테, 수관 전체도 위·왼쪽이 밝다, 군데군데 잎 반점
function canopy(B, cx, cy, rx, ry, pal, seed, r0 = 5, r1 = 10) {
  const gl = (x, y) => -((x - cx) / rx) * 0.32 - ((y - cy) / ry) * 0.6;
  // 1) 바탕 덩어리: 일그러진 타원을 어두운 잎색으로 꽉 채운다 (뭉치 사이로 하늘이 비치지 않게)
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const a = Math.atan2(j / ry, i / rx), e = 0.8 + Math.sin(a * 3 + seed) * 0.06 + Math.sin(a * 7 + seed * 2) * 0.05;
    (i / rx) ** 2 + (j / ry) ** 2 < e * e && B.put(cx + i, cy + j, T5(pal, -0.5 + gl(cx + i, cy + j) * 0.6 + (hash((cx + i) >> 1, (cy + j) >> 1, seed) > 0.8 ? -0.4 : 0)));
  }
  // 2) 뭉치: 작은 것 위주, 위에서 아래로 그려 아래 뭉치의 밝은 머리가 위 뭉치의 그늘에 붙는다
  const cl = [], n = Math.round((rx * ry) / ((r0 + r1) * (r0 + r1) * 0.13));
  for (let k = 0; k < n; k++) {
    const a = hash(k, seed) * Math.PI * 2, d = Math.pow(hash(seed, k), 0.42) * 0.98;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, r = r0 + Math.pow(hash(k, 7, seed), 1.6) * (r1 - r0);
    cl.push([x, y, r]);
  }
  cl.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of cl) {
    for (let j = -r - 2; j <= r + 2; j++) for (let i = -r - 2; i <= r + 2; i++) {
      const px = Math.round(x + i), py = Math.round(y + j);
      const d2 = (i * i + j * j) / (r * r), edge = 1 + (hash(px >> 1, py >> 1, seed + 11) - 0.5) * 0.42;
      if (d2 > edge) continue;
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, d2))), lam = (-i * 0.45 - j * 0.75) / r + nz * 0.4;
      let v = (lam - 0.4) * 1.05 + gl(px, py) * 1.2 - 0.12;
      j > r * 0.45 && d2 > 0.55 && (v -= 0.55);
      hash(px >> 1, py >> 1, seed + 3) > 0.93 && (v += lam > 0 ? 0.45 : -0.45);
      B.put(px, py, T5(pal, v));
    }
  }
}
// 줄기와 가지 (아래가 굵고, 두세 갈래로 갈라져 수관 속으로)
function trunk(B, x, g, h, w, seed) {
  const P = PAL.bark;
  for (let y = 0; y < h; y++) {
    const t = y / h, half = w / 2 * (1 - t * 0.45) + (y < 8 ? (8 - y) * 0.7 : 0), bx = x + Math.sin(t * 2.2 + seed) * 4;
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const u = i / Math.max(1, half);
      let v = 0.4 - u * 0.75 + ((Math.round(g - y) + Math.round(i * 3)) % 9 === 0 ? -0.3 : 0);
      Math.abs(u) > 0.9 && (v = -0.9);
      B.put(bx + i, g - y, T5(P, v));
    }
  }
  for (let k = 0; k < 3; k++) {
    const sy = g - h * (0.55 + k * 0.14), dir = k % 2 ? 1 : -1, L = 26 + hash(k, seed) * 20;
    for (let s = 0; s < L; s++) for (let q = -1; q <= 1; q++) B.put(x + dir * s * 0.9 + Math.sin(seed + k) * 3, sy - s * 0.7 + q, T5(P, q < 0 ? 0.3 : -0.3));
  }
}
export function leafTree(pal, seed = 1, s = 1) {
  const w = Math.round(230 * s), h = Math.round(290 * s);
  return art(w, h, (B) => {
    const cx = w / 2, g = h - 1;
    trunk(B, cx, g, h * 0.62, 16 * s, seed);
    canopy(B, cx - w * 0.12, g - h * 0.62, w * 0.3, h * 0.2, pal, seed + 1, 5 * s, 10 * s);
    canopy(B, cx + w * 0.14, g - h * 0.66, w * 0.28, h * 0.19, pal, seed + 2, 5 * s, 10 * s);
    canopy(B, cx, g - h * 0.78, w * 0.32, h * 0.2, pal, seed + 3, 5 * s, 11 * s);
    canopy(B, cx - w * 0.2, g - h * 0.48, w * 0.2, h * 0.12, pal, seed + 4, 4 * s, 9 * s);
  });
}
// 자작나무 (흰 줄기 · 검은 줄무늬) — ref08 오른쪽
export function birch(pal, seed = 1, s = 1) {
  const w = Math.round(170 * s), h = Math.round(300 * s);
  return art(w, h, (B) => {
    const cx = w / 2, g = h - 1;
    for (let y = 0; y < h * 0.7; y++) { const half = 6 * s * (1 - y / (h * 0.9)); for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) B.put(cx + i + Math.sin(y * 0.02) * 3, g - y, (g - y + Math.round(i * 2)) % 17 < 2 || Math.abs(i) >= Math.ceil(half) ? 0x2a2620 : i < 0 ? 0xf4f0e4 : 0xc8c4b8); }
    canopy(B, cx, g - h * 0.72, w * 0.36, h * 0.22, pal, seed, 5 * s, 9 * s);
    canopy(B, cx + w * 0.12, g - h * 0.56, w * 0.22, h * 0.12, pal, seed + 5, 4 * s, 8 * s);
  });
}

// ── 이엉지붕 ──: 용마루에서 처마로 넓어지는 지붕, 3px마다 짚 줄, 짚 결, 왼쪽(해 쪽) 밝음, 처마 아래 깊은 그늘
function thatch(B, cx, wFull, yTop, yEave, o = {}) {
  const P = PAL.thatch, full = wFull / 2, ridge = full * (o.ridge ?? 0.42), H = yEave - yTop;
  for (let y = yTop; y <= yEave + 3; y++) {
    const t = Math.min(1, (y - yTop) / H), half = ridge + (full - ridge) * Math.pow(t, 0.85) - (y > yEave ? (y - yEave) * 1.5 : 0);
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const u = (x - cx) / full, row = Math.floor((y - yTop + Math.round(hash(x >> 2, 1, o.seed ?? 1) * 2)) / 3);
      let v = 0.35 - u * 0.45 + (hash(x >> 1, row, o.seed ?? 1) - 0.5) * 0.4 - t * 0.12;
      (y - yTop + Math.round(hash(x >> 2, 1, o.seed ?? 1) * 2)) % 3 === 0 && (v -= 0.28);
      y === yTop && (v += 0.5);
      y >= yEave && (v = y === yEave ? -0.35 : -0.9);
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
      let v = 0.25 - ((x - x0) / (x1 - x0)) * 0.35 + sft + (px === 1 ? 0.15 : 0) - (y - y0 < (o.shade ?? 8) ? 0.75 : 0);
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

// ── 하늘: 높은 하늘 → 따뜻한 지평선, 큰 해 번짐, 역광 구름 ──
export function skyGold(W, H, sun = [130, 120]) {
  return canvasOf(W, H, (B) => {
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1), c = t < 0.45 ? mix(0x5a98d0, 0x9ac4dc, t / 0.45) : t < 0.8 ? mix(0x9ac4dc, 0xf0e0b6, (t - 0.45) / 0.35) : mix(0xf0e0b6, 0xf6ead0, (t - 0.8) / 0.2);
      for (let x = 0; x < W; x++) B.put(x, y, c);
    }
    const [sx, sy] = sun;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - sx, (y - sy) * 1.15) / 260; d < 1 && B.put(x, y, 0xfff2c8, Math.round(210 * (1 - d) ** 2.4)); }
    // 적운: 덩어리 높이를 부드럽게 더한 높이장 → 기울기로 음영 (면이 각지지 않게), 아래는 평평, 해 쪽 가장자리는 금빛 테
    const cloud = (cx, cy, w, h, seed) => {
      const P = [], n = Math.round(w / 7);
      for (let k = 0; k < n; k++) {
        const t = hash(k, seed), env = Math.sin(t * Math.PI), r = h * (0.16 + env * 0.36) * (0.65 + hash(seed, k) * 0.55);
        P.push([cx - w / 2 + t * w, cy - r * 0.55 - env * h * 0.5 * hash(k, seed, 3), r]);
      }
      const x0 = Math.floor(cx - w * 0.7), y0 = Math.floor(cy - h * 1.4), GW = Math.ceil(w * 1.4), GH = Math.ceil(h * 1.6), S = new Float32Array(GW * GH);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let s = 0;
        for (const [px, py, r] of P) { const d2 = ((x0 + x - px) ** 2 + (y0 + y - py) ** 2) / (r * r); d2 < 1 && (s += (1 - d2) ** 2 * r); }
        S[y * GW + x] = s;
      }
      const at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH ? 0 : S[y * GW + x]), TH = h * 0.06;
      const lx0 = sx - cx, ly0 = sy - cy, ll = Math.hypot(lx0, ly0) || 1, lx = lx0 / ll, ly = ly0 / ll;
      for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) {
        const s = at(x, y), X = x0 + x, Y = y0 + y;
        if (s < TH + (hash(X >> 1, Y >> 1, seed) - 0.5) * TH * 0.5 || Y > cy + Math.sin(X * 0.21 + seed) * 1.5) continue;
        const gx = (at(x + 1, y) - at(x - 1, y)) / 2, gy = (at(x, y + 1) - at(x, y - 1)) / 2, gm = Math.hypot(gx, gy) + 0.6;
        const facing = -(gx * lx + gy * ly) / gm, low = (Y - (cy - h)) / (h * 1.1);
        let v = facing * 0.75 + 0.35 - low * 0.9;
        s < TH * 2.2 && facing > 0.25 && (v = 1);
        s < TH * 1.6 && facing < -0.3 && (v -= 0.3);
        B.put(X, Y, T5(PAL.cloud, v));
      }
    };
    for (const [x, y, w, h, s] of [[300, 120, 230, 70, 3], [470, 80, 150, 50, 5], [60, 60, 120, 40, 7], [600, 150, 120, 40, 9]]) cloud(x, y, w, h, s);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - sx, y - sy); d < 18 ? B.put(x, y, 0xffffff) : d < 46 && B.put(x, y, 0xfff8dc, Math.round(200 * (1 - (d - 18) / 28))); }
  });
}
// ── 먼 구릉 + 그 위 이엉지붕 마을 + 옅은 침엽수 (중경, 이어지는 타일) ──
export function hillsVillage(W = 640, H = 200) {
  return art(W, H, (B, L) => {
    const haze = 0xe8e0c0, hz = (c, a) => mix(c, haze, a);
    const mt = (x) => 70 - vn(x, 0, 120, 4) * 30;
    for (let x = 0; x < W; x++) for (let y = Math.round(mt(x)); y < H; y++) B.put(x, y, hz(0x9aa8a0, 0.62));
    for (let k = 0; k < 60; k++) { const x = hash(k, 21) * W, base = 130 - hash(21, k) * 20, h = 22 + hash(k, 22) * 26; for (let j = 0; j < h; j++) { const half = (h * 0.28) * (j / h) * (0.8 + ((j / h * 5) % 1) * 0.3); for (let i = -half; i <= half; i++) B.put(x + i, base - h + j, hz(T5(PAL.green, i < 0 ? -0.2 : -0.6), 0.5)); } }
    const h1 = (x) => 120 - vn(x, 1, 160, 6) * 26 - Math.sin(x / W * Math.PI * 2) * 6;
    for (let x = 0; x < W; x++) for (let y = Math.round(h1(x)); y < H; y++) { const t = (y - h1(x)) / 80; B.put(x, y, hz(T5(PAL.grass, 0.6 - t * 1.2 + (vn(x, y, 30, 8) - 0.5) * 0.5), 0.32)); }
    for (let t = 0; t < 1; t += 0.002) { const x = 320 + Math.sin(t * 5) * 60 + t * 90, y = h1(x) + t * 70; for (let i = -1 - t * 3; i <= 1 + t * 3; i++) B.put(x + i, y, hz(0xe2d2a0, 0.3)); }
    for (const [x, w, s] of [[150, 90, 1], [260, 60, 2], [480, 70, 3]]) {
      const g = Math.round(h1(x)) + 6;
      longhouse(B, L, x, g, w, { wallH: 14, roofH: 26, seed: s, door: !1, beams: !0 });
      for (let y = g - 60; y < g + 4; y++) for (let x2 = x - w / 2 - 12; x2 < x + w / 2 + 12; x2++) B.al[(y * W + Math.round(x2))] && (B.col[y * W + Math.round(x2)] = hz(B.col[y * W + Math.round(x2)], 0.3));
    }
    L.length = 0;
  });
}
// 가까운 침엽수 띠 (따뜻한 안개에 살짝 묻힘, 층마다 가지 끝 밝음)
export function pineBand(W = 640, H = 190, seed = 3) {
  return canvasOf(W, H, (B) => {
    const hz = (c) => mix(sh(c, -0.18), 0xc8c49c, 0.3);
    for (let k = 0; k < 38; k++) {
      const x = hash(k, seed) * (W + 40) - 20, h = 90 + hash(seed, k) * (H - 100), w = h * 0.34, base = H - hash(k, 2, seed) * 10;
      for (let j = 0; j < h - 8; j++) {
        const t = j / h, tier = (t * 7) % 1, half = (w / 2) * t * (0.7 + tier * 0.45);
        for (let i = -Math.ceil(half); i <= half; i++) { const u = i / Math.max(1, half); B.put(x + i, base - h + j, hz(T5(PAL.green, tier > 0.8 && u < 0 ? 0.3 : u < -0.3 ? -0.15 : u < 0.4 ? -0.45 : -0.75))); }
      }
      for (let j = 0; j < 10; j++) B.put(x, base - 8 + j, hz(PAL.bark[3]));
    }
  });
}
// ── 땅 단면: 풀 가장자리(위로 솟는 풀잎 · 꽃) + 흙(가로 결 · 돌 · 해골 · 뿌리) + 아래 처진 그늘 ──
//   캔버스 줄 8이 땅선(발 딛는 줄)
export function groundBank(W = 640, H = 46) {
  return canvasOf(W, H, (B) => {
    const G0 = 8, soilTop = 15, under = 38;
    for (let x = 0; x < W; x++) {
      const top = G0 - Math.round(vn(x, 0, 7, 2) * 2);
      for (let y = top; y < soilTop; y++) B.put(x, y, T5(PAL.grass, y === top ? 0.7 : y < top + 2 ? 0.3 : (y - top) > 4 ? -0.4 : -0.05 + (hash(x, y) - 0.5) * 0.4));
      if (hash(x, 3) > 0.45) { const L = 1 + Math.floor(hash(x, 4) * 6); for (let k = 1; k <= L; k++) B.put(x + (k > 3 && hash(x, 5) > 0.5 ? 1 : 0), top - k, T5(PAL.grass, k === L ? 0.7 : 0)); }
      for (let y = soilTop; y < under; y++) { const band = Math.floor((y + Math.round(vn(x, 0, 18, 7) * 3)) / 4); B.put(x, y, T5(PAL.soil, 0.25 - (y - soilTop) / 30 + (hash(band, x >> 3) - 0.5) * 0.35 + (y === soilTop ? -0.5 : 0))); }
      for (let y = under; y < H; y++) B.put(x, y, T5(PAL.soil, -0.9));
    }
    for (let k = 0; k < W / 14; k++) { const x = Math.floor(hash(k, 9) * W), y = soilTop + 4 + Math.floor(hash(k, 10) * 16), r = 2 + Math.floor(hash(k, 11) * 3); for (let j = -r; j <= r; j++) for (let i = -r - 1; i <= r + 1; i++) (i * i) / ((r + 1) * (r + 1)) + (j * j) / (r * r) < 1 && B.put(x + i, y + j, T5(PAL.stone, -(i + j) / r * 0.6 - 0.1)); }
    for (let k = 0; k < W / 120; k++) { const x = Math.floor(hash(k, 12) * W), y = soilTop + 8; for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) B.put(x + i, y + j, j === 2 && (i === 1 || i === 4) ? 0x2a1a10 : j === 4 && i % 2 ? 0x3a2a1a : 0xe8e0cc); }
    for (let k = 0; k < W / 40; k++) { const x = Math.floor(hash(k, 13) * W); for (let j = 0; j < 14; j++) B.put(x + Math.round(Math.sin(j * 0.5 + k) * 1.5), soilTop + j, T5(PAL.bark, -0.5)); }
    for (let k = 0; k < W / 10; k++) { const x = Math.floor(hash(k, 14) * W), y = G0 - 1 - Math.floor(hash(k, 15) * 4), c = [0xffffff, 0xf8d848, 0xe86a8a, 0xa88ae8][k % 4]; B.put(x, y, c), B.put(x + 1, y, sh(c, -0.25)), B.put(x, y + 1, PAL.grass[3]); }
  });
}
// 물: 위 흙·풀 단면이 거꾸로 일렁이며 비치고, 아래로 갈수록 어둡다 + 물결 빛 줄 + 연잎
export function waterBank(W = 640, H = 60) {
  return canvasOf(W, H, (B) => {
    const bank = G3.buffer(W, 46, !1);
    const tmp = groundBank(W, 46).getContext("2d").getImageData(0, 0, W, 46).data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = y / H, sy = 37 - Math.floor(y * 0.9), sx = x + Math.round(Math.sin(y * 0.9 + x * 0.05) * (1 + t * 2));
      let c = mix(0x5e6e68, 0x2e3a3a, t);
      if (sy >= 6) { const i = (sy * W + (((sx % W) + W) % W)) * 4; tmp[i + 3] && (c = mix((tmp[i] << 16) | (tmp[i + 1] << 8) | tmp[i + 2], c, 0.45 + t * 0.4)); }
      (y + Math.round(vn(x, y, 20, 3) * 6)) % 7 === 0 && (c = mix(c, 0xd8e8e0, 0.3 - t * 0.2));
      B.put(x, y, c);
    }
    for (let k = 0; k < W / 80; k++) { const x = Math.floor(hash(k, 16) * W), y = 14 + Math.floor(hash(k, 17) * (H - 24)); for (let j = -2; j <= 2; j++) for (let i = -6; i <= 6; i++) (i * i) / 36 + (j * j) / 6 < 1 && !(i > 1 && Math.abs(j) < 1) && B.put(x + i, y + j, T5(PAL.grass, j < 0 ? 0.1 : -0.5)); }
    void bank;
  });
}
// 전경 물풀: 부들(갈색 이삭) · 노란 풀 덤불 · 흰 꽃 무리 · 파란 꽃 · 갈대 (덩어리로, 사이사이 빈 물)
export function waterPlants(W = 640, H = 110) {
  return canvasOf(W, H, (B) => {
    const g = H - 1;
    const clump = (cx, kind, s) => {
      if (kind === 0) for (let k = 0; k < 7; k++) { const x = cx + (k - 3) * 4 + Math.round(hash(k, cx) * 3), L = (40 + hash(cx, k) * 40) * s; for (let j = 0; j < L; j++) B.put(x + (j > L * 0.6 ? 1 : 0), g - j, T5(PAL.olive, j % 5 ? -0.3 : 0)); for (let j = 0; j < 9; j++) for (let i = 0; i < 3; i++) B.put(x + i, g - L - j + 2, T5([0xb07a48, 0x8e5a30, 0x6e4020, 0x4e2c14, 0x2e1a0c], i === 0 ? 0.3 : -0.2)); }
      if (kind === 1) for (let k = 0; k < 26; k++) { const x0 = cx + (hash(k, cx, 1) - 0.5) * 40 * s, L = (18 + hash(cx, k, 2) * 30) * s, lean = (hash(k, 3, cx) - 0.5) * 0.8; for (let j = 0; j < L; j++) for (let w = 0; w < 2; w++) B.put(x0 + lean * j + w, g - j, T5([0xfae890, 0xe4c858, 0xc0a438, 0x8e7a2a, 0x5a4e1c], (j / L) * 1.2 - 0.6 + (w ? -0.3 : 0.1))); }
      if (kind === 2) { for (let k = 0; k < 12; k++) { const x = cx + (hash(k, cx) - 0.5) * 34, y = g - 4 - hash(cx, k) * 12; for (let j = 0; j < g - y; j++) B.put(x, y + j, PAL.green[3]); for (const [i, j] of [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) B.put(x + i, y + j, 0xffffff); B.put(x, y, 0xf8d040); } }
      if (kind === 3) for (let k = 0; k < 14; k++) { const x = cx + (hash(k, cx, 4) - 0.5) * 30, L = 10 + hash(cx, k, 5) * 18; for (let j = 0; j < L; j++) B.put(x, g - j, PAL.green[2]); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) Math.abs(i) + Math.abs(j) < 2 && B.put(x + i, g - L + j, i < 0 ? 0x8aa0f0 : 0x5a6ad0); }
      if (kind === 4) for (let k = 0; k < 18; k++) { const x = cx + (hash(k, cx, 6) - 0.5) * 30, L = (20 + hash(cx, k, 7) * 36) * s, lean = (hash(k, cx, 8) - 0.5) * 0.4; for (let j = 0; j < L; j++) B.put(x + lean * j, g - j, T5(PAL.green, j / L - 0.5)); }
      // 노란 풀 덤불 (ref08 오른쪽 아래): 둥근 덤불 윤곽 안에 휘어진 풀잎 수십 가닥, 위 끝이 밝다
      if (kind === 5) {
        const HW = 44 * s, HT = 62 * s, YP = [0xfff0a0, 0xecc858, 0xc89a34, 0x8e6a22, 0x5a4214];
        for (let k = 0; k < 120 * s; k++) {
          const u = hash(k, cx, 9) * 2 - 1, x0 = cx + u * HW, L = HT * Math.sqrt(1 - u * u) * (0.55 + hash(cx, k, 10) * 0.5), bend = (hash(k, 11, cx) - 0.5) * 1.4 + u * 0.6;
          for (let j = 0; j < L; j++) { const t = j / L, x = x0 + bend * t * t * L * 0.35; for (let w = 0; w < 2; w++) B.put(x + w, g - j, T5(YP, t * 1.3 - 0.75 - u * 0.25 + (w ? -0.25 : 0.1) + (hash(k, 12) > 0.75 ? -0.35 : 0))); }
        }
      }
    };
    const plan = [[30, 1, 1.1], [70, 0, 1], [118, 5, 0.9], [175, 2, 1], [230, 0, 0.9], [300, 3, 1], [365, 5, 1.15], [430, 4, 1.1], [470, 0, 1.1], [530, 2, 1], [585, 5, 0.85], [625, 0, 0.9]];
    for (const [x, k, s] of plan) clump(x, k, s);
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
    const g = h - 1, log = (x, top) => { for (let y = top; y <= g; y++) for (let i = 0; i < 7; i++) { const tip = top + 6 - y; if (tip > 0 && Math.abs(i - 3) > (6 - tip) / 2) continue; B.put(x + i, y, T5(PAL.bark, 0.45 - i * 0.18 + (y % 19 === 0 ? -0.4 : 0))); } };
    for (let x = 0; x < w; x += 7) log(x, g - 70 - Math.round(hash(x, 3) * 10));
    for (const tx of [6, w - 46]) {
      for (let x = tx; x < tx + 40; x += 7) log(x, g - 120);
      planks(B, tx - 4, g - 132, tx + 44, g - 118, { shade: 3 });
      thatch(B, tx + 20, 60, g - 162, g - 132, { seed: tx, ridge: 0.1 });
      smallWindow(B, L, tx + 16, g - 112, 0xffb050);
    }
    const ax = w / 2;
    for (let j = 0; j < 62; j++) for (let i = -26; i <= 26; i++) { const top = j > 44 ? Math.sqrt(Math.max(0, 26 * 26 - ((j - 44) * 1.5) ** 2)) : 26; Math.abs(i) < top && B.put(ax + i, g - j, (i + 30) % 7 === 0 ? 0x2a1a10 : j % 14 === 4 ? 0x4a4a52 : T5(PAL.plank, -0.1 - Math.abs(i) / 60)); }
    for (let j = 0; j < 62; j++) B.put(ax, g - j, 0x1a1008);
    for (const bx of [ax - 40, ax + 30]) for (let j = 0; j < 30; j++) for (let i = 0; i < 10; i++) B.put(bx + i, g - 100 + j + (i % 2 && j > 26 ? 2 : 0), T5([sh(col, 0.3), sh(col, 0.1), col, sh(col, -0.3), sh(col, -0.5)], 0.4 - i * 0.08));
    L.push([ax, g - 20, 20, 0xffb050]);
  });
}
