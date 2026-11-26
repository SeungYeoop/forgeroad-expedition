// 거점 시설·작업장 그림 (ref08 화풍) — 통나무 · 막돌 · 이엉 · 가죽 · 양모 · 쇠
//   hubpaint.js의 팔레트와 붓 질감(tx)을 그대로 쓴다. 빛은 왼쪽 위. 마법·불빛만 밝은 색을 허용
import { mix, sh, hash, vn } from "./bgart.js";
import { art, PAL, T5, tx, TT, thatch } from "./hubpaint.js";

const DARKBARK = PAL.bark.map((c) => sh(c, -0.28));
const IRON = [0x9a968c, 0x76726a, 0x58544e, 0x3e3a36, 0x26241f];
export const CLOTH = {
  red: [0xd07a58, 0xb05a3c, 0x8e4430, 0x6a3022, 0x441e16],
  ochre: [0xe8c070, 0xcc9e4c, 0xa87c38, 0x7e5a28, 0x543c1a],
  blue: [0x8aa0c0, 0x66809e, 0x4c627e, 0x36485e, 0x22303e],
  canvas: [0xf0e4c4, 0xdccca4, 0xbca884, 0x948262, 0x665a44],
  hide: [0xc89a68, 0xa87a4c, 0x865c36, 0x624226, 0x3e2a18],
};
const FIRE = [0xfff4c0, 0xffd060, 0xff9a30, 0xd85a1a, 0x8a2a10];
const PARCH = [0xf4ead0, 0xe6d8b4, 0xd0bc94, 0xa89470, 0x7a6a4e];
const LICHEN = [0xd8d088, 0xb8b060, 0x989444, 0x747036, 0x504c26];
const MAG = 0x8ad0f0;
const RST = [0xb0a48c, 0x8a7e6a, 0x6a604e, 0x4a4236, 0x2c2822];

// ── 붓 ──
// 둥근 통나무 (어느 방향이든): 원통 음영 + 길이 방향 나무결, 그늘 쪽 짙은 테
function log(B, x0, y0, x1, y1, r, seed = 1, pal = PAL.bark) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, lit = -(nx * 0.6 + ny * 0.8);
  for (let s = 0; s <= L; s += 0.5) for (let q = -r; q <= r; q += 0.5) {
    const X = Math.round(x0 + ux * s + nx * q), Y = Math.round(y0 + uy * s + ny * q), u = q / r, lam = lit * u;
    let v = 0.15 + lam * 0.75 + tx(Math.round(q * 2) + 40, Math.round(s / 3), 0.55, seed);
    Math.abs(u) > 0.78 && (v = lam < 0 ? -0.9 : v - 0.15);
    B.put(X, Y, T5(pal, v));
  }
}
function rope(B, x0, y0, x1, y1, sag = 0, col = 0x5a4830) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let k = 0; k <= n; k++) { const t = k / n; B.put(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * 4 * t * (1 - t), col); }
}
// 막돌 쌓기: 줄마다 높이가 다르고 돌마다 폭이 다르다, 돌마다 둥근 음영 · 사이 짙은 틈
function fieldstone(B, x0, y0, x1, y1, seed = 1, inside = () => !0, shade = () => 0) {
  let y = y1, row = 0;
  while (y > y0) {
    const rh = Math.min(y - y0, 5 + Math.floor(hash(row, seed) * 4));
    let x = x0 - Math.floor(hash(seed, row) * 8), k = 0;
    while (x < x1) {
      const sw = 7 + Math.floor(hash(row, k, seed) * 9), tint = (hash(k, row, seed + 1) - 0.5) * 0.35, cxs = x + sw / 2, cys = y - rh / 2;
      for (let py = y - rh; py <= y; py++) for (let px = x; px < x + sw; px++) {
        if (px < x0 || px > x1 || !inside(px, py)) continue;
        const a = (px - cxs) / (sw / 2), b = (py - cys) / (rh / 2 + 0.5);
        if (a ** 4 + b ** 4 > 0.92) { B.put(px, py, T5(PAL.stone, -0.95)); continue; }
        B.put(px, py, T5(PAL.stone, 0.2 + (-0.45 * a - 0.75 * b) * 0.45 + tint + shade(px, py) + tx(px, py, 0.4, seed)));
      }
      x += sw, k++;
    }
    y -= rh + 1, row++;
  }
}
// 둥근 나무 몸통 (세로 널, 원통 음영, 위는 처마 그늘)
function drum(B, cx, y0, y1, half, seed = 1, pal = PAL.plank) {
  const xa = Math.round(cx - half);
  for (let y = y0; y < y1; y++) for (let x = xa; x <= Math.round(cx + half); x++) {
    const u = (x - cx) / half, px = (x - xa) % 6;
    let v = 0.3 - u * 0.65 + (px === 0 ? -0.65 : px === 1 ? 0.15 : 0) + tx(x, y >> 1, 0.35, seed) - (y - y0 < 4 ? 0.6 : 0);
    Math.abs(u) > 0.93 && (v -= 0.45);
    B.put(x, y, T5(pal, v));
  }
}
// 빛나는 창 (아치형 가능, 십자 창살)
function glowWin(B, L, x, y, w, h, col, arch = 1) {
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    if (arch && j < w / 2 && Math.hypot(i - (w - 1) / 2, j - w / 2) > w / 2 + 0.6) continue;
    const fr = i < 0 || i >= w || j < 0 || j >= h;
    B.put(x + i, y + j, fr ? T5(PAL.bark, -0.6) : i === Math.floor(w / 2) || j === Math.floor(h / 2) ? sh(col, -0.55) : mix(col, 0xffffff, Math.max(0, 0.4 - j / h)));
  }
  L.push([x + w / 2, y + h / 2, Math.max(w, h) + 4, col]);
}
function fire(B, L, x, y, s = 1) {
  const H = 10 * s;
  for (let j = 0; j < H; j++) { const half = 4 * s * (1 - j / H) + Math.sin(j * 1.3 + x) * 0.8; for (let i = -Math.ceil(half); i <= half; i++) B.put(x + i, y - j, FIRE[Math.min(4, Math.floor((Math.abs(i) / Math.max(1, half)) * 2.2 + (j / H) * 2.2))]); }
  L.push([x, y - 5 * s, 16 * s, 0xff9a30]);
}
function lanternB(B, L, x, y) {
  for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) B.put(x + i, y + j, Math.abs(i) === 3 || j === 0 || j === 7 ? IRON[3] : j < 3 ? 0xfff0b0 : 0xffc060);
  B.put(x, y - 1, IRON[2]), L.push([x, y + 4, 12, 0xffb050]);
}
const wicker = (B, x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) B.put(x + i, y + j, T5(PAL.thatch, ((i + (j >> 1) * 2) % 4 < 2 ? 0.1 : -0.4) - (i / w) * 0.4 + (j === 0 ? 0.5 : 0) - (i === 0 || i === w - 1 ? 0.4 : 0))); };

// ── 마법사 탑: 막돌 기단 + 둥근 나무 몸통 + 발코니 + 돌출 윗방 + 원뿔 이엉지붕, 푸른 마법 창 · 룬 깃발 · 수정 ──
export function seerTower() {
  return art(150, 262, (B, L) => {
    const g = 261, cx = 75;
    fieldstone(B, cx - 36, g - 80, cx + 36, g, 3, (x, y) => Math.abs(x - cx) <= 32 + (y - (g - 80)) * 0.05, (x) => -((x - cx) / 34) * 0.55);
    drum(B, cx, g - 170, g - 80, 30, 5);
    for (const by of [g - 84, g - 130, g - 172]) for (let x = cx - 33; x <= cx + 33; x++) for (let j = 0; j < 3; j++) B.put(x, by + j, T5(PAL.bark, -((x - cx) / 33) * 0.6 + (j === 0 ? 0.35 : -0.35)));
    drum(B, cx, g - 200, g - 172, 38, 6);
    for (const d of [-1, 1]) log(B, cx + d * 30, g - 108, cx + d * 44, g - 126, 1.5, 7 + d);
    for (let x = cx - 47; x <= cx + 47; x++) for (let j = 0; j < 4; j++) B.put(x, g - 128 + j, T5(PAL.plank, j === 0 ? 0.6 : j === 3 ? -0.85 : 0.15 - (x - cx) / 110));
    for (let x = cx - 45; x <= cx + 45; x += 9) for (let j = 1; j <= 12; j++) B.put(x, g - 128 - j, T5(PAL.bark, x < cx ? 0.1 : -0.3));
    for (let x = cx - 46; x <= cx + 46; x++) B.put(x, g - 140, T5(PAL.bark, 0.3)), B.put(x, g - 139, T5(PAL.bark, -0.5));
    glowWin(B, L, cx - 15, g - 195, 8, 14, MAG), glowWin(B, L, cx + 7, g - 195, 8, 14, MAG), glowWin(B, L, cx - 4, g - 164, 8, 15, MAG), glowWin(B, L, cx - 22, g - 66, 7, 11, 0xffc060);
    thatch(B, cx, 104, g - 248, g - 196, { seed: 7, ridge: 0.04 });
    for (let j = 0; j < 9; j++) B.put(cx, g - 248 - j, T5(PAL.bark, -0.3)), B.put(cx + 1, g - 248 - j, T5(PAL.bark, -0.7));
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) i * i + j * j <= 9 && B.put(cx + i, g - 257 + j, i + j < -1 ? 0xe8fbff : i + j < 2 ? MAG : 0x4a8ab0);
    L.push([cx, g - 257, 22, MAG]);
    // 아치 문
    for (let j = 0; j < 30; j++) for (let i = -9; i <= 9; i++) {
      if (j > 22 && Math.hypot(i, j - 22) > 9) continue;
      const fr = Math.abs(i) >= 8 || (j > 22 && Math.hypot(i, j - 22) > 7.5);
      B.put(cx + i, g - j, fr ? T5(PAL.bark, i < 0 ? 0.2 : -0.6) : (i + 30) % 4 === 0 ? 0x24160c : T5(PAL.plank, -0.2 - i / 20));
    }
    for (let j = 6; j < 20; j += 4) B.put(cx + 5, g - j, MAG);
    // 룬 깃발 (발코니에 매달림, 아래 V자)
    for (const bx of [cx - 41, cx + 32]) for (let j = 0; j < 34; j++) for (let i = 0; i < 9; i++) {
      if (j > 28 && Math.abs(i - 4) < j - 28) continue;
      const rune = (i === 4 && j > 6 && j < 24) || (j === 10 + Math.abs(i - 4) && i > 1 && i < 7);
      B.put(bx + i, g - 124 + j, rune ? 0xe8c060 : T5(CLOTH.blue, 0.3 - i * 0.1 + tx(bx + i, j, 0.3)));
    }
    // 매달린 부적 (뼈 · 깃털)
    for (const [hx, hl] of [[cx - 22, 10], [cx - 10, 14], [cx + 14, 9], [cx + 26, 12]]) { rope(B, hx, g - 125, hx, g - 125 + hl, 0, 0x3a2a1a); B.put(hx, g - 124 + hl, 0xe8e0c8), B.put(hx, g - 123 + hl, 0xc8c0a8), B.put(hx + 1, g - 123 + hl, 0x6a6a7a); }
    // 밑동 수정 무리
    for (let k = 0; k < 6; k++) {
      const x = k < 3 ? cx - 48 + k * 4 : cx + 38 + (k - 3) * 4, h = 6 + hash(k, 5) * 12, w2 = 2 + hash(k, 6) * 2;
      for (let j = 0; j < h; j++) { const hw = w2 * Math.min(1, (h - j) / 4); for (let i = -Math.ceil(hw); i <= hw; i++) B.put(x + i, g - j, i < 0 ? 0xc8f0ff : i === 0 ? MAG : 0x4a7a9a); }
      L.push([x, g - h / 2, 7, MAG]);
    }
  });
}

// ── 하늘 승강장: 통나무 망루(기운 다리 · X자 버팀 · 사다리 · 발판 · 이엉 차양 · 권양기) + 덧댄 천 열기구와 고리 바구니 ──
export function skyLift() {
  return art(232, 312, (B, L) => {
    const g = 311, cx = 62, top = g - 186;
    log(B, cx - 24, g, cx - 14, top, 2, 11, DARKBARK), log(B, cx + 24, g, cx + 14, top, 2, 12, DARKBARK);
    for (let y = top; y <= g; y++) B.put(cx - 5, y, T5(PAL.bark, 0)), B.put(cx + 5, y, T5(PAL.bark, -0.5));
    for (let y = top + 4; y <= g; y += 7) for (let x = cx - 5; x <= cx + 5; x++) B.put(x, y, T5(PAL.bark, 0.3));
    const hw = (y) => 34 - ((g - y) / (g - top)) * 12;
    for (let k = 0; k < 5; k++) {
      const yA = g - k * 37, yB = g - (k + 1) * 37;
      log(B, cx - hw(yB), yB, cx + hw(yB), yB, 1.6, 20 + k);
      log(B, cx - hw(yA), yA - 2, cx + hw(yB), yB + 2, 1.1, 30 + k), log(B, cx + hw(yA), yA - 2, cx - hw(yB), yB + 2, 1.1, 40 + k);
    }
    log(B, cx - 34, g, cx - 22, top, 3, 13), log(B, cx + 34, g, cx + 22, top, 3, 14);
    for (let x = cx - 38; x <= cx + 38; x++) for (let j = 0; j < 5; j++) B.put(x, top + j, T5(PAL.plank, j === 0 ? 0.6 : j === 4 ? -0.85 : 0.2 - (x - cx) / 100 + ((x - cx + 40) % 6 === 0 ? -0.5 : 0)));
    for (const d of [-1, 1]) log(B, cx + d * 32, top, cx + d * 32, top - 34, 1.5, 50 + d);
    for (let x = cx - 36; x <= cx + 36; x++) B.put(x, top - 12, T5(PAL.bark, 0.3)), B.put(x, top - 11, T5(PAL.bark, -0.5));
    thatch(B, cx, 92, top - 58, top - 32, { seed: 21, ridge: 0.18 });
    lanternB(B, L, cx - 28, top - 26);
    // 권양기
    const wx = cx + 50, wy = g - 14;
    log(B, wx - 8, g, wx, wy, 1.5, 60), log(B, wx + 8, g, wx, wy, 1.5, 61);
    for (let a = 0; a < 360; a += 3) { const t = (a * Math.PI) / 180; for (let q = 0; q < 3; q++) B.put(wx + Math.cos(t) * (11 - q), wy + Math.sin(t) * (11 - q), T5(PAL.bark, q === 0 ? -0.7 : Math.sin(t) < 0 ? 0.3 : -0.2)); }
    for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3; for (let q = 0; q < 9; q++) B.put(wx + Math.cos(t) * q, wy + Math.sin(t) * q, T5(PAL.bark, -0.3)); }
    rope(B, wx, wy - 11, cx + 30, top - 2, 0);
    // 열기구 (세로 천 조각 여덟, 붉은색·황토색 번갈아, 기운 자국, 허리 밧줄)
    const bx = 170, by = 134, rx = 50, ry = 56;
    for (let y = by - ry; y <= by + ry; y++) {
      const t = (y - by) / ry, half = t < 0 ? rx * Math.sqrt(1 - t * t) : rx * Math.sqrt(Math.max(0, 1 - t * t * 0.85)) * (1 - 0.6 * t);
      for (let x = Math.round(bx - half); x <= bx + half; x++) {
        const u = (x - bx) / Math.max(1, half), gore = (Math.asin(Math.max(-1, Math.min(1, u))) / Math.PI + 0.5) * 8, gi = Math.floor(gore), fr = gore - gi;
        let v = -0.62 * u - 0.75 * t + 0.25 + tx(x, y, 0.45, 70);
        (fr < 0.08 || Math.abs(u) > 0.95) && (v -= 0.55);
        Math.abs(t - 0.42) < 0.035 && (v = -0.75);
        hash(gi, Math.floor((y - by) / 14), 71) > 0.8 && fr > 0.25 && fr < 0.75 && (v += 0.25);
        B.put(x, y, T5(gi % 2 ? CLOTH.ochre : CLOTH.red, v));
      }
    }
    const my = by + ry, ky = my + 26;
    for (const d of [-1, 1]) rope(B, bx + d * 7, my, bx + d * 12, ky, 0, 0x4a3a28);
    for (let j = 0; j < 6; j++) for (let i = -2; i <= 2; i++) Math.abs(i) < 3 - j / 3 && B.put(bx + i, my + 6 - j, FIRE[Math.min(4, Math.abs(i) + (j >> 1))]);
    L.push([bx, my + 4, 18, 0xffa040]);
    wicker(B, bx - 13, ky, 27, 15);
    for (const sx of [bx - 16, bx + 16]) for (let j = 0; j < 6; j++) for (let i = -2; i <= 2; i++) B.put(sx + i, ky + 4 + j, T5(CLOTH.hide, 0.2 - i * 0.2 - j * 0.05));
    rope(B, bx - 12, ky + 14, cx + 38, top + 2, 14);
  });
}

// ── 기록 게시판: 말린 장식 기둥 둘 + 가로 널판 + 양피지 쪽지(못 · 붉은 밀랍) + 이엉 지붕 + 등불 + 두루마리 바구니 ──
export function boardArt() {
  return art(170, 152, (B, L) => {
    const g = 151;
    for (const x of [24, 146]) {
      log(B, x, g, x, g - 116, 3, x);
      for (let a = 0; a < 300; a += 12) { const t = (a * Math.PI) / 180, r = 5 - a / 90; B.put(x + Math.cos(t) * r * (x < 85 ? -1 : 1), g - 121 + Math.sin(t) * r, T5(PAL.bark, -0.2)); }
    }
    for (let y = g - 100; y < g - 26; y++) for (let x = 27; x < 144; x++) {
      const row = Math.floor((y - (g - 100)) / 7), py = (y - (g - 100)) % 7;
      B.put(x, y, T5(PAL.plank, 0.1 - (x - 85) / 160 + (hash(row, 3) - 0.5) * 0.3 + (py === 0 ? -0.7 : py === 1 ? 0.2 : 0) + tx(x >> 1, y, 0.35, 8)));
    }
    log(B, 18, g - 101, 152, g - 101, 2.2, 81), log(B, 18, g - 25, 152, g - 25, 2.2, 82);
    for (let k = 0; k < 10; k++) {
      const x = 32 + (k % 4) * 28 + Math.floor(hash(k, 1) * 6), y = g - 95 + Math.floor(k / 4) * 22 + Math.floor(hash(k, 2) * 5), w = 18 + Math.floor(hash(k, 3) * 6), h = 15 + Math.floor(hash(k, 4) * 5);
      if (y + h > g - 28 || x + w > 142) continue;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const curl = (i === w - 1 && j > h - 4) || (j === h - 1 && i > w - 3); B.put(x + i, y + j, curl ? 0x8a7a5a : T5(PARCH, 0.45 - (i / w) * 0.35 - (j / h) * 0.2 + tx(x + i, y + j, 0.25))); }
      for (let r = 0; r < 3; r++) for (let i = 2; i < w - 3; i++) hash(i, r, k) > 0.3 && B.put(x + i, y + 4 + r * 4, 0x6a5a44);
      B.put(x + w / 2, y + 1, IRON[3]);
      k % 3 === 0 && (B.put(x + w - 5, y + h - 4, 0xa82a1a), B.put(x + w - 4, y + h - 4, 0x8a1a10), B.put(x + w - 5, y + h - 3, 0x8a1a10));
    }
    thatch(B, 85, 158, g - 136, g - 104, { seed: 12, ridge: 0.3 });
    rope(B, 140, g - 103, 140, g - 97, 0, IRON[3]), lanternB(B, L, 140, g - 96);
    wicker(B, 32, g - 9, 17, 10);
    for (const [sx, sy] of [[35, 15], [40, 17], [44, 14]]) for (let j = 0; j < 7; j++) B.put(sx, g - sy + j, 0xece0c0), B.put(sx + 1, g - sy + j, 0xc8b894);
  });
}

// ── 운명의 비석 (룬돌): 막돌 두 단 위 둥근 머리 선돌 · 가장자리 따라 새긴 뱀 띠와 금빛 룬 · 가운데 별자리 홈 · 이끼·지의류 · 양옆 쇠 화로 ──
export function runeStone() {
  return art(170, 222, (B, L) => {
    const g = 221, cx = 85, top = g - 190, base = g - 24;
    fieldstone(B, cx - 68, g - 12, cx + 68, g, 31, () => !0, (x) => -((x - cx) / 68) * 0.3);
    fieldstone(B, cx - 50, g - 24, cx + 50, g - 13, 32, () => !0, (x) => -((x - cx) / 50) * 0.3);
    const half = (y) => { const t = (y - top) / (base - top), c = y - top < 28 ? Math.sqrt(Math.max(0, 1 - ((28 - (y - top)) / 28) ** 2)) : 1; return (24 + t * 7) * c + (vn(Math.round(y), 0, 8, 41) - 0.5) * 3; };
    for (let y = top; y <= base; y++) {
      const hw = half(y);
      for (let i = -Math.ceil(hw); i <= Math.ceil(hw); i++) {
        const X = cx + i, u = i / Math.max(1, hw);
        let v = 0.3 - u * 0.75 + tx(X, y, 0.6, 41) + (vn(X, y, 16, 42) - 0.5) * 0.4;
        Math.abs(u) > 0.9 && (v = u > 0 ? -0.9 : v - 0.2);
        B.put(X, y, vn(X, y, 6, 43) > 0.74 ? T5(LICHEN, v) : y > base - 12 && vn(X, y, 6, 44) > 0.5 ? TT(PAL.grass, v, X, y, 0.5) : T5(RST, v));
      }
    }
    // 뱀 띠: 왼쪽 가장자리를 타고 올라 머리를 넘어 오른쪽으로 내려온다
    const yArc = top + 36, r0 = half(yArc) - 7, pts = [];
    for (let y = base - 8; y > yArc; y -= 0.5) pts.push([cx - (half(y) - 7), y]);
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.02) pts.push([cx + Math.cos(a) * r0, yArc + Math.sin(a) * r0 * 0.9]);
    for (let y = yArc; y < base - 8; y += 0.5) pts.push([cx + (half(y) - 7), y]);
    for (let k = 1; k < pts.length; k++) {
      const [x, y] = pts[k], [px, py] = pts[k - 1], dl = Math.hypot(x - px, y - py) || 1, nx = -(y - py) / dl, ny = (x - px) / dl;
      for (let q = -3; q <= 3; q += 0.5) B.put(Math.round(x + nx * q), Math.round(y + ny * q), Math.abs(q) >= 2.5 ? T5(RST, -0.95) : T5(RST, 0.65 - q * 0.12));
      if (k % 14 === 0) for (const q of [-1, 0, 1]) B.put(Math.round(x + nx * q), Math.round(y + ny * q), 0xf0c850);
      k % 70 === 0 && L.push([x, y, 7, 0xffd060]);
    }
    const [hx, hy] = pts[0];
    for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) (i * i) / 16 + (j * j) / 9 <= 1 && B.put(hx + i, hy + 3 + j, T5(RST, 0.5 - j * 0.15));
    B.put(hx + 1, hy + 2, 0xf0c850);
    // 별자리 홈 (운명)
    const cs = [[0, -140], [-8, -122], [7, -112], [-2, -94], [-10, -76], [8, -68], [0, -52]];
    for (let k = 0; k + 1 < cs.length; k++) {
      const [ax, ay] = cs[k], [bx2, by2] = cs[k + 1], n = Math.max(Math.abs(bx2 - ax), Math.abs(by2 - ay));
      for (let q = 0; q <= n; q++) { const X = cx + ax + ((bx2 - ax) * q) / n, Y = g + ay + ((by2 - ay) * q) / n; B.put(X + 1, Y + 1, T5(RST, -0.95)), B.put(X, Y, 0xe8b848); }
    }
    for (const [x, y] of cs) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) B.put(cx + x + i, g + y + j, i || j ? 0xf0c850 : 0xffffff); L.push([cx + x, g + y, 8, 0xffd060]); }
    // 쇠 화로
    for (const x of [cx - 66, cx + 66]) {
      log(B, x - 7, g - 12, x, g - 34, 1, x, IRON), log(B, x + 7, g - 12, x, g - 34, 1, x + 1, IRON);
      for (let j = 0; j < 6; j++) for (let i = -8 + j * 0.6; i <= 8 - j * 0.6; i++) B.put(x + i, g - 40 + j, T5(IRON, j === 0 ? 0.5 : 0.1 - i / 12));
      fire(B, L, x, g - 41, 1);
    }
  });
}

// ── 광장 이정표: 통나무 기둥 + 화살 끝 널 넷(끝을 흐린 색으로 칠함) + 밑동 돌무더기 ──
export function signpost2() {
  return art(72, 94, (B) => {
    const g = 93, x = 36;
    log(B, x, g, x, g - 84, 2.5, 5);
    for (let j = 0; j < 4; j++) for (let i = -3 + j; i <= 3 - j; i++) B.put(x + i, g - 86 - j, T5(PAL.bark, 0.3 - i * 0.2));
    for (const [d, y, c] of [[-1, 16, 0x6a8a4a], [1, 28, 0xc89040], [-1, 40, 0x5a7ab0], [1, 52, 0xa85a3a]]) {
      const pc = [sh(c, 0.3), sh(c, 0.1), mix(c, 0x6a4a2c, 0.3), sh(mix(c, 0x4a3420, 0.4), -0.2), 0x2e2014];
      for (let j = 0; j < 7; j++) for (let i = 0; i < 28; i++) {
        if (i > 22 && Math.abs(j - 3) > 27 - i) continue;
        const X = x + d * (3 + i), v = 0.4 - j * 0.12 + tx(X, j, 0.3, y) + (j === 6 ? -0.8 : 0);
        B.put(X, g - 84 + y + j, i > 16 ? T5(pc, v) : T5(PAL.plank, v));
      }
      B.put(x + d * 6, g - 81 + y, IRON[3]);
    }
    for (let k = 0; k < 5; k++) {
      const sx = x - 12 + k * 6, r = 3 + hash(k, 9) * 2;
      for (let j = 0; j <= r; j++) for (let i = -r - 1; i <= r + 1; i++) (i * i) / ((r + 1) ** 2) + (j * j) / (r * r) < 1 && B.put(sx + i, g - j, T5(PAL.rock, -i / r * 0.5 + j / r * 0.4 - 0.1));
    }
  });
}

// ── 갱도 승강기: 통나무 A자 권양탑 + 쇠테 큰 바퀴 + 갱구(통나무 틀, 깊은 붉은 빛) + 레일 · 광차 · 광석 더미 ──
export function mineHead() {
  return art(200, 190, (B, L) => {
    const g = 189, cx = 100, top = 36;
    for (let j = 0; j < 28; j++) for (let i = -24; i <= 24; i++) B.put(cx + i, g - j, mix(0x0a0706, 0x6a2a10, Math.max(0, 1 - j / 14) * 0.85));
    L.push([cx, g - 8, 26, 0xff7030]);
    log(B, cx + 84, g, cx + 10, top + 26, 2.5, 4, DARKBARK);
    log(B, cx - 54, g, cx - 8, top + 6, 3.5, 5), log(B, cx + 54, g, cx + 8, top + 6, 3.5, 6);
    for (let k = 1; k < 4; k++) { const y = g - 30 - k * 30, w2 = 54 - ((g - y) / (g - top)) * 46; log(B, cx - w2, y, cx + w2, y, 1.8, 10 + k); }
    log(B, cx - 26, g, cx - 26, g - 32, 2.5, 1), log(B, cx + 26, g, cx + 26, g - 32, 2.5, 2), log(B, cx - 33, g - 32, cx + 33, g - 32, 2.5, 3);
    const r = 23;
    for (let k = 0; k < 8; k++) { const t = (k * Math.PI) / 4; log(B, cx, top, cx + Math.cos(t) * (r - 3), top + Math.sin(t) * (r - 3), 1, 20 + k); }
    for (let a = 0; a < 360; a += 1.5) { const t = (a * Math.PI) / 180; for (let q = 0; q < 4; q++) B.put(cx + Math.cos(t) * (r - q), top + Math.sin(t) * (r - q), q === 0 ? IRON[3] : T5(PAL.bark, -Math.cos(t + 0.9) * 0.6 - q * 0.1)); }
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) i * i + j * j <= 9 && B.put(cx + i, top + j, T5(IRON, -(i + j) / 4));
    for (let y = top; y < g - 4; y++) B.put(cx + r - 1, y, 0x4a3a28);
    for (let x = 0; x < 200; x++) { x % 9 < 3 && B.put(x, g, T5(PAL.bark, -0.4)); B.put(x, g - 3, IRON[1]), B.put(x, g - 2, IRON[3]); }
    const cartB = (x) => {
      for (let j = 0; j < 13; j++) for (let i = 0; i < 30; i++) { if (i < (13 - j) * 0.2 || i > 29 - (13 - j) * 0.2) continue; B.put(x + i, g - 5 - j, j === 12 || j === 6 || i % 10 === 0 ? T5(IRON, 0.1 - i / 60) : T5(PAL.plank, 0.35 - i / 40 + tx(x + i, j, 0.3))); }
      for (const dx of [7, 23]) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) i * i + j * j <= 10 && B.put(x + dx + i, g - 5 + j, i * i + j * j < 3 ? IRON[1] : IRON[3]);
      for (let k = 0; k < 7; k++) { const ox = x + 4 + k * 3.5, oy = g - 19 - (k % 3); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) i * i + j * j <= 5 && B.put(ox + i, oy + j, k % 3 === 0 ? (i + j < 0 ? 0xf0a050 : 0xb05a20) : T5(PAL.rock, -(i + j) / 3 - 0.2)); }
    };
    cartB(6);
    for (let j = 0; j < 18; j++) { const w3 = 22 * Math.sqrt(1 - (j / 18) ** 2); for (let i = -Math.ceil(w3); i <= w3; i++) { const X = 170 + i, Y = g - 4 - j; B.put(X, Y, hash(X >> 1, Y >> 1, 9) > 0.86 ? (hash(X, Y) > 0.5 ? 0xe8903a : 0xb0602a) : TT(PAL.rock, 0.3 - i / 30 - j / 30 + (hash(X >> 2, Y >> 2, 3) - 0.5) * 0.6, X, Y, 0.5)); } }
    lanternB(B, L, cx - 38, g - 66), lanternB(B, L, cx + 38, g - 66);
  });
}

// ── 작업장 ──
// 제련로: 막돌 원뿔 화로(입구 불빛 · 꼭대기 불꽃) + 가죽 풀무 + 숯 더미
export const smelter2 = () => art(66, 76, (B, L) => {
  const g = 75, cx = 34;
  for (let j = 0; j < 8; j++) { const w = 10 * Math.sqrt(1 - (j / 8) ** 2); for (let i = -Math.ceil(w); i <= w; i++) B.put(55 + i, g - j, hash(i, j, 3) > 0.7 ? 0x4a4440 : 0x1e1a18); }
  fieldstone(B, cx - 18, g - 50, cx + 18, g, 5, (x, y) => Math.abs(x - cx) <= 18 - (g - y) * 0.2, (x) => -((x - cx) / 18) * 0.5);
  for (let j = 0; j < 12; j++) for (let i = -5; i <= 5; i++) (j < 8 || Math.hypot(i, j - 8) < 5) && B.put(cx + i, g - j, FIRE[Math.min(4, Math.floor(Math.abs(i) / 2 + j / 4))]);
  L.push([cx, g - 6, 20, 0xff8030]);
  fire(B, L, cx, g - 50, 0.8);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 14; i++) Math.abs(j - 4) < 4 - i * 0.15 + 1.5 && B.put(2 + i, g - 10 - j, T5(CLOTH.hide, 0.3 - j * 0.08 - i * 0.03));
  log(B, 2, g - 18, 15, g - 15, 1, 3), log(B, 16, g - 13, cx - 15, g - 8, 1, 4, IRON);
});
// 제재소: 통나무 더미(나이테 단면) + 톱질 모탕 위 통나무와 톱 + 도끼 박힌 그루터기 + 나뭇조각
export const lumber2 = () => art(86, 52, (B) => {
  const g = 51;
  const end = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j); if (d > r) continue; B.put(x + i, y + j, d > r - 1.2 ? T5(PAL.bark, -0.5) : Math.round(d) % 3 === 0 ? T5(CLOTH.ochre, -0.3) : T5(CLOTH.ochre, 0.3 - (i + j) / (r * 3))); } };
  for (const [n, y, x0] of [[4, g - 6, 8], [3, g - 17, 14], [2, g - 28, 20]]) for (let k = 0; k < n; k++) end(x0 + k * 12, y, 6);
  log(B, 58, g, 68, g - 17, 1.2, 5), log(B, 78, g, 68, g - 17, 1.2, 6), log(B, 56, g - 20, 85, g - 21, 3.5, 7);
  for (let i = 0; i < 14; i++) for (let j = 0; j < 4 - Math.floor(i / 5); j++) B.put(64 + i, g - 25 - j, T5(IRON, 0.4 - j * 0.2));
  log(B, 62, g - 26, 64, g - 24, 1.2, 8);
  for (let j = 0; j < 8; j++) for (let i = -6; i <= 6; i++) B.put(50 + i, g - j, j === 7 ? T5(CLOTH.ochre, 0.3 - i / 12) : T5(PAL.bark, 0.2 - i / 8));
  log(B, 50, g - 8, 56, g - 22, 1, 9);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) B.put(54 + i, g - 22 - j, T5(IRON, 0.3 - i * 0.15));
  for (let k = 0; k < 14; k++) B.put(40 + hash(k, 4) * 44, g - hash(k, 5) * 2, hash(k, 6) > 0.5 ? CLOTH.ochre[0] : CLOTH.ochre[2]);
});
// 무두질 틀: 통나무 틀 둘에 끈으로 당겨 맨 가죽
export const tannery2 = () => art(66, 72, (B) => {
  const g = 71;
  for (const [fx, fw, fh] of [[6, 26, 46], [36, 24, 38]]) {
    log(B, fx, g, fx, g - fh - 4, 1.4, fx), log(B, fx + fw, g, fx + fw, g - fh - 4, 1.4, fx + 1);
    log(B, fx - 2, g - fh, fx + fw + 2, g - fh, 1.2, fx + 2), log(B, fx - 2, g - 8, fx + fw + 2, g - 8, 1.2, fx + 3);
    const hx = fx + fw / 2, hy = g - 8 - (fh - 8) / 2, rx = fw / 2 - 3, ry = (fh - 8) / 2 - 3;
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) { const a = Math.atan2(j / ry, i / rx), e = 0.82 + Math.sin(a * 4 + fx) * 0.12; (i / rx) ** 2 + (j / ry) ** 2 < e * e && B.put(hx + i, hy + j, TT(CLOTH.hide, 0.25 - (i / rx) * 0.35 - (j / ry) * 0.2, Math.round(hx + i), Math.round(hy + j), 0.5)); }
    for (let k = 0; k < 4; k++) { const y = hy - ry * 0.6 + (k * ry * 1.2) / 3; rope(B, fx + 1, y, hx - rx * 0.75, y, 0, 0x3a2a1a), rope(B, hx + rx * 0.75, y, fx + fw - 1, y, 0, 0x3a2a1a); }
  }
});
// 베틀 (추 달린 세운 베틀): 벽에 기댄 기둥 둘 · 위 천 두루마리 · 줄무늬 짠 천 · 늘어진 날실 · 돌 추 · 양털 바구니
export const loom2 = () => art(62, 68, (B) => {
  const g = 67, lean = (y) => (g - y) * 0.1, st = [CLOTH.red, CLOTH.ochre, CLOTH.canvas, CLOTH.blue];
  log(B, 8, g, 14, g - 62, 1.8, 1), log(B, 46, g, 52, g - 62, 1.8, 2);
  for (let y = g - 56; y < g - 30; y++) for (let x = 11; x < 49; x++) { const X = Math.round(x + lean(y)); B.put(X, y, T5(st[Math.floor((y - (g - 56)) / 5) % 4], 0.3 - (x - 11) / 60 + ((x + y) % 2 ? 0.12 : -0.12) + tx(X, y, 0.25))); }
  log(B, 6, g - 59, 56, g - 59, 2.2, 3);
  for (let x = 12; x < 48; x += 2) for (let y = g - 30; y < g - 12; y++) B.put(Math.round(x + lean(y)), y, CLOTH.canvas[(x >> 1) % 2 ? 1 : 2]);
  log(B, 10, g - 22, 52, g - 24, 1, 4);
  for (let x = 14; x < 48; x += 6) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const d = i * i + j * j; d <= 5 && d > 0 && B.put(Math.round(x + lean(g - 10)) + i, g - 10 + j, T5(PAL.stone, -(i + j) / 3)); }
  for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) B.put(48 + i, g - j, T5(PAL.thatch, ((i + (j >> 1) * 2) % 4 < 2 ? 0.1 : -0.4) + (j === 7 ? 0.5 : 0)));
  for (const [x, c] of [[51, CLOTH.canvas], [55, CLOTH.red], [58, CLOTH.blue]]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) i * i + j * j <= 5 && B.put(x + i, g - 9 + j, T5(c, -(i + j) / 3 + 0.2));
});
// 석공장: 다듬은 돌덩이 쌓음(윗면 밝음 · 오른쪽 그늘) + 쪼개는 중인 큰 돌 + 망치와 정 + 돌 부스러기
export const stonecut2 = () => art(72, 50, (B) => {
  const g = 49;
  const block = (x, y, w, h, sd) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const T = j >= h - 2, S = i >= w - 3, O = i === 0 || j === 0 || i === w - 1 || j === h - 1; B.put(x + i, y - j, T5(PAL.stone, O ? -0.85 : T ? 0.75 : S ? -0.45 : 0.25 - (i / w) * 0.3 + tx(x + i, y - j, 0.35, sd))); } };
  block(2, g, 22, 12, 1), block(25, g, 20, 12, 2), block(8, g - 12, 22, 11, 3);
  for (let j = 0; j < 20; j++) { const w = 13 * Math.sqrt(1 - (j / 20) ** 2); for (let i = -Math.ceil(w); i <= w; i++) { const X = 58 + i, Y = g - j; B.put(X, Y, i === 1 && j > 4 ? T5(PAL.stone, -0.95) : TT(PAL.rock, 0.35 - i / 13 * 0.6 - j / 40, X, Y, 0.5)); } }
  log(B, 44, g - 2, 50, g - 14, 0.9, 4);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) B.put(47 + i, g - 15 - j, T5(IRON, 0.3 - i * 0.12));
  for (let j = 0; j < 7; j++) B.put(59, g - 20 - j, IRON[j < 2 ? 0 : 2]);
  for (let k = 0; k < 16; k++) B.put(34 + hash(k, 7) * 36, g - hash(k, 8) * 2, hash(k, 9) > 0.5 ? PAL.stone[0] : PAL.stone[2]);
});
// 수레: 널 짐칸 · 난간 · 바큇살 바퀴 · 손잡이 채 · 자루와 통과 양배추
export const cart2 = () => art(76, 48, (B) => {
  const g = 47;
  log(B, 58, g - 18, 75, g - 4, 1.2, 4);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 52; i++) B.put(6 + i, g - 16 - j, T5(PAL.plank, j === 5 ? 0.6 : j === 0 ? -0.8 : 0.2 - i / 100 + (i % 10 === 0 ? -0.5 : 0)));
  for (const [x, w, h] of [[10, 12, 14], [22, 11, 12]]) for (let j = 0; j < h; j++) { const hw = (w / 2) * Math.sqrt(1 - ((j - h / 2) / (h / 2 + 1)) ** 2); for (let i = -Math.ceil(hw); i <= hw; i++) B.put(x + w / 2 + i, g - 22 - j, j === h - 2 && Math.abs(i) < 2 ? 0x4a3420 : TT(CLOTH.canvas, 0.3 - i / hw * 0.5 - j / h * 0.2, x + i, j, 0.3)); }
  for (let j = 0; j < 13; j++) for (let i = -5; i <= 5; i++) { const half = 5 - Math.abs(j - 6) * 0.12; Math.abs(i) <= half && B.put(43 + i, g - 22 - j, j === 3 || j === 10 ? IRON[2] : T5(PAL.plank, 0.4 - (i / 5) * 0.7)); }
  for (const x of [52, 56]) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) i * i + j * j <= 9 && B.put(x + i, g - 25 + j, T5(PAL.green, -(i + j) / 4 + 0.3));
  for (let x = 6; x <= 58; x += 13) log(B, x, g - 21, x, g - 30, 0.9, x);
  log(B, 4, g - 30, 60, g - 30, 1, 3);
  const wx = 30, wy = g - 11, r = 11;
  for (let k = 0; k < 8; k++) { const t = (k * Math.PI) / 4; log(B, wx, wy, wx + Math.cos(t) * (r - 2), wy + Math.sin(t) * (r - 2), 0.7, 30 + k); }
  for (let a = 0; a < 360; a += 2) { const t = (a * Math.PI) / 180; for (let q = 0; q < 3; q++) B.put(wx + Math.cos(t) * (r - q), wy + Math.sin(t) * (r - q), q === 0 ? IRON[3] : T5(PAL.bark, -Math.cos(t + 0.9) * 0.5)); }
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) i * i + j * j <= 4 && B.put(wx + i, wy + j, IRON[2]);
});
// 천막: 기둥과 작은 깃발 · 솔기가 모이는 원뿔 지붕 · 물결 장식 띠 · 천 벽 · 걷어 올린 입구 · 당김 줄과 말뚝
export function tent2(w = 80, h = 70, trim = CLOTH.red) {
  return art(w + 20, h + 12, (B) => {
    const g = h + 11, cx = (w + 20) / 2, top = g - h, eave = g - Math.round(h * 0.42);
    for (let j = 0; j < 10; j++) B.put(cx, top + 2 - j, T5(PAL.bark, 0));
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8 - j * 2; i++) B.put(cx + 1 + i, top - 7 + j, T5(trim, 0.2));
    for (let y = top; y <= eave; y++) {
      const t = (y - top) / (eave - top), hw = 3 + (w / 2 - 3) * Math.pow(t, 0.9);
      for (let x = Math.round(cx - hw); x <= cx + hw; x++) { const u = (x - cx) / hw, fr = (((u * 3 + 3) % 1) + 1) % 1; B.put(x, y, T5(CLOTH.canvas, 0.45 - u * 0.7 - t * 0.1 + (fr < 0.1 ? -0.4 : 0) + tx(x, y, 0.3, 9))); }
    }
    for (let x = Math.round(cx - w / 2); x <= cx + w / 2; x++) { const d = 4 + Math.round(2 * Math.abs(Math.sin((x - cx) * 0.4))); for (let j = 0; j < d; j++) B.put(x, eave + j, T5(trim, 0.35 - ((x - cx) / w) * 1.2 - (j === d - 1 ? 0.5 : 0))); }
    for (let y = eave + 4; y <= g; y++) for (let x = Math.round(cx - w / 2 + 3); x <= cx + w / 2 - 3; x++) { const u = (x - cx) / (w / 2); B.put(x, y, T5(CLOTH.canvas, 0.1 - u * 0.6 - (y - eave < 7 ? 0.5 : 0) + (x % 9 === 0 ? -0.3 : 0) + tx(x, y, 0.3, 10))); }
    for (let y = eave + 6; y <= g; y++) { const k = (y - eave - 6) / (g - eave - 6), hw = 4 + k * 9; for (let x = Math.round(cx - hw); x <= cx + hw; x++) B.put(x, y, x < cx - hw + 3 ? T5(CLOTH.canvas, 0.6) : mix(0x1a120a, 0x5a3a1a, 1 - k)); }
    for (const d of [-1, 1]) { rope(B, cx + d * (w / 2 - 2), eave + 2, cx + d * (w / 2 + 8), g - 1, 0, 0x6a5a40); for (let j = 0; j < 3; j++) B.put(cx + d * (w / 2 + 8), g - j, T5(PAL.bark, 0)); }
  });
}
// 등불 기둥: 통나무 기둥 · 팔 · 쇠 등불
export function lamp2() {
  return art(30, 72, (B, L) => {
    const g = 71;
    log(B, 13, g, 13, 8, 2, 3);
    log(B, 10, 10, 26, 10, 1.4, 4);
    rope(B, 22, 11, 22, 14, 0, IRON[3]);
    lanternB(B, L, 22, 15);
    for (let j = 0; j < 4; j++) for (let i = -4 + j; i <= 4 - j; i++) B.put(13 + i, g - j, T5(PAL.stone, 0.3 - i / 5));
  });
}
