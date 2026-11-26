// 갈림길 요새의 시설 건물 (새 그림) — 돌 블록 아래층 · 목조 골조 위층 · 비늘 기와 지붕 · 빛나는 창 · 시설마다 고유 소품
//   모든 건물은 같은 빛(왼쪽 위) · 같은 램프 화법(bgart)으로 칠한다. 반환: { c: 캔버스, w, h, lights: [[x, y, 크기, 색]] }
import * as G3 from "./bg3d.js";
import { mix, sh, hash, vn, fbm, ramp, tone, mass } from "./bgart.js";
import { tube, glowSpot, banner } from "./bgzones.js";

const art = (w, h, fn) => { const B = G3.buffer(w, h, !1), lights = []; fn(B, lights); return { c: B.toCanvas(), w, h, lights }; };

// ── 부품 ──
// 돌 블록 벽: 줄마다 높이가 다른 돌, 돌마다 밝기 조금씩, 줄눈 어둡게, 왼쪽이 밝다
function stones(B, x0, y0, x1, y1, col, sd = 1) {
  const R = ramp(col);
  let y = y1, row = 0;
  while (y > y0) {
    const rh = 4 + Math.floor(hash(row, sd) * 3);
    let x = x0 - Math.floor(hash(sd, row) * 8), k = 0;
    while (x < x1) {
      const bw = 6 + Math.floor(hash(row, k, sd) * 8), sft = (hash(k, row, sd) - 0.5) * 0.25;
      for (let j = 0; j < rh && y - j > y0; j++) for (let i = Math.max(x0, x); i < Math.min(x1, x + bw); i++) {
        let I = 0.66 - ((i - x0) / (x1 - x0)) * 0.25 + sft + (j === rh - 1 ? 0.1 : 0) - (j === 0 || i === x ? 0.24 : 0);
        B.put(i, y - j, tone(R, I, i, y - j));
      }
      (x += bw), k++;
    }
    (y -= rh), row++;
  }
}
// 회벽 + 나무 골조 (기둥 · 가로대 · 엇갈린 버팀)
function timber(B, x0, y0, x1, y1, wallC, beamC) {
  const W = ramp(wallC), Bm = ramp(beamC);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) B.put(x, y, tone(W, 0.72 - ((x - x0) / (x1 - x0)) * 0.2 + (fbm(x, y, 6, 3, 2) - 0.5) * 0.2, x, y));
  const beam = (xa, ya, xb, yb) => { const n = Math.max(Math.abs(xb - xa), Math.abs(yb - ya)); for (let k = 0; k <= n; k++) for (let t = 0; t < 3; t++) B.put(xa + ((xb - xa) * k) / n + (xa === xb ? t : 0), ya + ((yb - ya) * k) / n + (xa === xb ? 0 : t), Bm[t === 0 ? 1 : t === 1 ? 2 : 4]); };
  beam(x0, y0, x1 - 1, y0), beam(x0, y1 - 3, x1 - 1, y1 - 3), beam(x0, (y0 + y1) >> 1, x1 - 1, (y0 + y1) >> 1);
  for (let x = x0; x <= x1 - 3; x += 18) beam(x, y0, x, y1 - 1);
  for (let x = x0 + 18; x < x1 - 18; x += 36) beam(x, y1 - 3, x + 18, (y0 + y1) >> 1);
}
// 박공 지붕: 처마가 나오고 비늘 기와 줄, 왼쪽 면 밝고 오른쪽 어둡게, 용마루 빛
function gable(B, cx, yb, w, h, col, o = {}) {
  const R = ramp(col), eave = o.eave ?? 6;
  for (let j = 0; j < h; j++) {
    const half = (w / 2 + eave) * (j / h) ** (o.curve ?? 1);
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const scale = (Math.floor((i + 400 + (Math.floor(j / 3) % 2) * 2) / 4) + Math.floor(j / 3)) % 2;
      let I = (i < 0 ? 0.78 : 0.42) - (j % 3 === 2 ? 0.16 : 0) + (scale ? 0.05 : 0) - Math.abs(i) / (w * 2);
      Math.abs(i) >= Math.ceil(half) - 1 && (I -= 0.35);
      Math.abs(i) < 1 && (I += 0.25);
      B.put(cx + i, yb - h + j, tone(R, I, cx + i, j));
    }
  }
  for (let i = -w / 2 - eave; i < w / 2 + eave; i++) B.put(cx + i, yb, R[5], 200), B.put(cx + i, yb + 1, R[4], 120);
  if (o.upturn) for (const s of [-1, 1]) for (let k = 0; k < 7; k++) B.put(cx + s * (w / 2 + eave + k), yb - k * 0.8, R[1]), B.put(cx + s * (w / 2 + eave + k), yb - k * 0.8 + 1, R[4]);
}
// 창: 돌 테 + 빛나는 유리(위가 밝다) + 십자 창살
function windowL(B, L, x, y, w, h, lit = 0xffd890, o = {}) {
  for (let j = -2; j < h + 2; j++) for (let i = -2; i < w + 2; i++) (j < 0 || j >= h || i < 0 || i >= w) && B.put(x + i, y + j, j === h + 1 ? 0x6a5a4a : 0xc8bca8);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const bar = i === (w >> 1) || j === (h >> 1);
    B.put(x + i, y + j, bar ? 0x3a2a20 : lit ? mix(sh(lit, 0.35), lit, j / h) : 0x24303a);
  }
  if (o.arch) for (let i = 0; i < w; i++) { const t = Math.sin((i / (w - 1)) * Math.PI) * 4; for (let j = 0; j < t; j++) B.put(x + i, y - 1 - j, lit ? sh(lit, 0.3) : 0x24303a); }
  lit && L.push([x + w / 2, y + h / 2, Math.max(w, h) * 0.8, lit]);
}
// 문: 둥근 위 · 세로 판자 · 쇠 띠 · 손잡이
function door(B, x, yb, w, h, col = 0x7a4a28) {
  const R = ramp(col);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const top = j > h - w / 2 ? Math.sqrt(Math.max(0, (w / 2) ** 2 - (j - (h - w / 2)) ** 2)) : w / 2;
    if (Math.abs(i - w / 2 + 0.5) > top) continue;
    let I = 0.6 - (i % 5 === 0 ? 0.25 : 0) - ((j === 8 || j === h - 12) ? 0.3 : 0);
    B.put(x + i, yb - j, (j === 8 || j === h - 12) ? 0x3a3a40 : tone(R, I, x + i, j));
  }
  B.put(x + w - 4, yb - h / 2, 0xe0c060), B.put(x + w - 4, yb - h / 2 + 1, 0x8a6a30);
}
function chimney(B, x, yb, w, h, col) { stones(B, x, yb - h, x + w, yb, col, x); for (let i = -1; i <= w; i++) B.put(x + i, yb - h, 0x6a6058), B.put(x + i, yb - h + 1, 0x4a4440); }
// 걸린 간판: 사슬 두 줄 + 판 + 그림(색 점)
function sign(B, x, y, w, h, col, mark) {
  for (let j = 0; j < 6; j++) B.put(x + 3, y - 6 + j, 0x3a3a3a), B.put(x + w - 4, y - 6 + j, 0x3a3a3a);
  const R = ramp(col);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) B.put(x + i, y + j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? R[4] : tone(R, 0.7 - j * 0.03, x + i, j));
  mark && mark(x + w / 2, y + h / 2);
}
const barrel = (B, x, yb) => { mass(B, x - 6, yb - 15, 13, 16, (X, Y) => Math.abs(X - x) < 6 - Math.abs(Y - yb + 7) * 0.12, { col: 0x8a5a30, round: 3, grooves: 1.6, warp: 0, seed: x }); for (const y of [yb - 3, yb - 12]) for (let i = -6; i <= 6; i++) B.put(x + i, y, 0x4a4a50); };
const crate = (B, x, yb, s = 12) => { mass(B, x, yb - s, s, s, () => true, { col: 0xa07040, round: 2, warp: 0, seed: x }); for (let i = 0; i < s; i++) B.put(x + i, yb - s + i, 0x6a4a28), B.put(x + i, yb - 1 - i, 0x6a4a28); };
const lantern = (B, L, x, y, c = 0xffc060) => { for (let j = 0; j < 4; j++) B.put(x, y - 4 + j, 0x2a2a2a); mass(B, x - 3, y, 7, 8, () => true, { col: c, round: 2, warp: 0, rim: false }); L.push([x, y + 4, 8, c]); };

// ── 창고: 큰 헛간 (쌍 여닫이 문 · 다락 기중기 · 통과 상자) ──
export function storehouse() {
  return art(200, 170, (B, L) => {
    const g = 169;
    stones(B, 20, g - 60, 180, g, 0x9a9488, 3);
    timber(B, 24, g - 112, 176, g - 60, 0xe8dcc0, 0x6a4a2a);
    gable(B, 100, g - 112, 160, 50, 0x3a6a4a);
    door(B, 76, g, 22, 44, 0x8a5a30), door(B, 100, g, 22, 44, 0x8a5a30);
    windowL(B, L, 40, g - 100, 14, 14), windowL(B, L, 146, g - 100, 14, 14), windowL(B, L, 92, g - 156, 14, 12, 0xffe0a0, { arch: 1 });
    tube(B, [[100, g - 150], [128, g - 156]], 2, 2, 0x6a4a2a, { warp: 0 }); for (let j = 0; j < 26; j++) B.put(127, g - 154 + j, 0xc8b890);
    crate(B, 128, g - 128, 10);
    sign(B, 128, g - 54, 30, 16, 0x8a6a3a, (cx, cy) => { for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) B.put(cx + i, cy + j, Math.abs(j) === 4 || Math.abs(i) === 6 ? 0x3a2a18 : j === -1 ? 0xe0c060 : 0xb07a3a); });
    barrel(B, 30, g), barrel(B, 44, g), crate(B, 150, g), crate(B, 162, g, 10), crate(B, 154, g - 12, 9);
  });
}
// ── 대장간: 돌집 + 열린 화덕(주황 불빛) · 모루 · 굴뚝 연기 · 무기 시렁 ──
export function smithy() {
  return art(210, 190, (B, L) => {
    const g = 189;
    stones(B, 10, g - 96, 200, g, 0x8a8478, 7);
    gable(B, 105, g - 96, 190, 56, 0x8a3a2a);
    chimney(B, 150, g - 120, 18, 70, 0x8a8478);
    for (let j = 0; j < 52; j++) for (let i = 0; i < 70; i++) { const top = j > 40 ? Math.sqrt(Math.max(0, 35 * 35 - ((j - 40) * 3) ** 2)) : 35; Math.abs(i - 35) < top && B.put(24 + i, g - j, mix(0x2a1008, 0xff8030, Math.max(0, 1 - j / 46) * 0.85)); }
    glowSpot(B, 59, g - 14, 46, 0xff8030, 120), L.push([59, g - 20, 40, 0xff8030]);
    for (let i = 0; i < 70; i++) for (let j = 0; j < 4; j++) B.put(24 + i, g - 56 + j, tone(ramp(0x9a9488), 0.8 - j * 0.15, 24 + i, j));
    mass(B, 110, g - 20, 34, 20, (X, Y) => (Y > g - 18 && Y < g - 12 && X > 112 && X < 142) || (Y >= g - 12 && X > 120 && X < 134) || (Y > g - 18 && X > 142 && X < 148 && Y < g - 14), { col: 0x5a5a62, round: 2, warp: 0 });
    windowL(B, L, 160, g - 70, 16, 16, 0xffb060);
    door(B, 168, g, 20, 40, 0x6a3a20);
    for (let k = 0; k < 4; k++) { const x = 104 + k * 8; for (let j = 0; j < 30; j++) B.put(x, g - 44 - j, j < 8 ? 0x5a3a20 : 0xc8d0d8); }
    for (let i = 98; i < 138; i++) B.put(i, g - 44, 0x4a3020), B.put(i, g - 76, 0x4a3020);
    sign(B, 30, g - 80, 30, 16, 0x6a4a2a, (cx, cy) => { for (let i = -8; i <= 8; i++) B.put(cx + i, cy - 2, 0xd0d4d8), B.put(cx + i, cy - 1, 0x8a8a90); for (let j = 0; j < 6; j++) B.put(cx, cy + j, 0x8a5a30); });
  });
}
// ── 갑옷 공방: 목조 2층 + 진열창 갑옷 · 마당 갑옷 걸이 · 방패 간판 ──
export function armorer() {
  return art(210, 180, (B, L) => {
    const g = 179;
    stones(B, 14, g - 54, 196, g, 0x9a9488, 11);
    timber(B, 18, g - 110, 192, g - 54, 0xf0e4c8, 0x5a3a24);
    gable(B, 105, g - 110, 176, 52, 0x2a4a8a);
    windowL(B, L, 30, g - 46, 40, 26, 0xffe0a8);
    for (const x of [40, 58]) { mass(B, x - 5, g - 42, 11, 18, (X, Y) => Math.abs(X - x) < 5 - Math.max(0, Y - (g - 30)) * 0.3, { col: 0xb8c0c8, round: 3, warp: 0, seed: x }); mass(B, x - 3, g - 47, 7, 6, (X, Y) => (X - x) ** 2 + (Y - g + 44) ** 2 < 9, { col: 0xa8b0b8, round: 2, warp: 0 }); }
    windowL(B, L, 40, g - 96, 14, 16), windowL(B, L, 150, g - 96, 14, 16), windowL(B, L, 96, g - 150, 16, 12, 0xffd890, { arch: 1 });
    door(B, 110, g, 22, 42);
    for (const x of [160, 180]) { tube(B, [[x, g], [x, g - 36]], 1.5, 1.5, 0x5a3a20, { warp: 0 }); mass(B, x - 8, g - 40, 17, 20, (X, Y) => Math.abs(X - x) < 8 - Math.max(0, Y - (g - 30)) * 0.4, { col: 0x9aa4b0, round: 4, warp: 0, seed: x }); mass(B, x - 4, g - 48, 9, 9, (X, Y) => (X - x) ** 2 + (Y - g + 44) ** 2 < 14, { col: 0x8a949e, round: 3, warp: 0 }); }
    sign(B, 140, g - 72, 24, 22, 0x2a4a8a, (cx, cy) => mass(B, cx - 7, cy - 8, 15, 17, (X, Y) => Math.abs(X - cx) < 7 - Math.max(0, Y - cy) * 0.6, { col: 0xd8a040, round: 3, warp: 0 }));
  });
}
// ── 마법사 탑: 가는 돌탑 · 보랏빛 고깔 지붕 · 둥근 발코니 · 빛나는 룬 띠 · 떠 있는 구슬 ──
export function wizardTower() {
  return art(130, 300, (B, L) => {
    const g = 299, x0 = 35, x1 = 95;
    stones(B, x0, g - 210, x1, g, 0x8a7aa0, 19);
    for (let y = g - 200; y < g; y += 50) for (let i = x0; i < x1; i++) B.put(i, y, (i + y) % 6 < 3 ? 0xb890ff : 0x6a4a9a);
    for (let i = x0 - 10; i < x1 + 10; i++) for (let j = 0; j < 5; j++) B.put(i, g - 140 + j, tone(ramp(0xa898b8), 0.8 - j * 0.15, i, j));
    for (let i = x0 - 10; i < x1 + 10; i += 4) for (let j = 0; j < 10; j++) B.put(i, g - 150 + j, 0x5a4a6a);
    gable(B, 65, g - 210, 70, 80, 0x5a2a9a, { eave: 8, curve: 1.6 });
    windowL(B, L, 58, g - 190, 14, 18, 0xd8b0ff, { arch: 1 }), windowL(B, L, 58, g - 120, 14, 18, 0xd8b0ff, { arch: 1 }), windowL(B, L, 58, g - 70, 14, 16, 0xffd890, { arch: 1 });
    door(B, 55, g, 20, 36, 0x4a2a6a);
    mass(B, 57, g - 312 + 0, 16, 16, (X, Y) => (X - 65) ** 2 + (Y - (g - 304)) ** 2 < 36, { col: 0xc8a0ff, round: 5, warp: 0, rimCol: 0xffffff });
    glowSpot(B, 65, g - 304, 24, 0xc090ff, 140), L.push([65, g - 304, 20, 0xb070ff]);
    for (let k = 0; k < 6; k++) glowSpot(B, 20 + hash(k, 3) * 90, g - 40 - hash(k, 4) * 220, 4, 0xd0a0ff, 200);
  });
}
// ── 무술 도장: 휘어 오른 처마 두 겹 지붕 · 붉은 기둥 · 등롱 · 나무 허수아비 기둥 ──
export function dojoHall() {
  return art(240, 190, (B, L) => {
    const g = 189;
    for (let i = 20; i < 220; i++) for (let j = 0; j < 10; j++) B.put(i, g - j, tone(ramp(0xa8a090), 0.75 - j * 0.04, i, j));
    for (let y = g - 80; y < g - 10; y++) for (let x = 36; x < 204; x++) B.put(x, y, tone(ramp(0xe8d8b0), 0.72 - (x - 36) / 900, x, y));
    for (const x of [36, 80, 156, 200]) for (let y = g - 84; y < g - 10; y++) for (let i = 0; i < 6; i++) B.put(x - 3 + i, y, tone(ramp(0xa83a2a), 0.8 - i * 0.1, x + i, y));
    for (let j = 0; j < 50; j++) for (let i = 0; i < 64; i++) B.put(88 + i, g - 10 - j, (i % 16 === 0 || j % 12 === 0) ? 0x6a4a2a : mix(0xffe8b0, 0xffc870, j / 50));
    L.push([120, g - 36, 40, 0xffd080]);
    gable(B, 120, g - 84, 200, 30, 0x2a6a5a, { eave: 14, upturn: 1, curve: 1.3 });
    for (let y = g - 104; y < g - 84; y++) for (let x = 70; x < 170; x++) B.put(x, y, tone(ramp(0xe8d8b0), 0.7, x, y));
    gable(B, 120, g - 104, 120, 26, 0x2a6a5a, { eave: 12, upturn: 1, curve: 1.3 });
    sign(B, 104, g - 100, 32, 12, 0x3a2a1a, (cx, cy) => { for (let i = -10; i <= 10; i += 5) for (let j = -2; j <= 2; j++) B.put(cx + i, cy + j, 0xe0c060); });
    for (const x of [52, 188]) lantern(B, L, x, g - 76, 0xff6040);
  });
}
// ── 기록 게시판: 지붕 달린 큰 판 · 붙은 종이와 핀 · 두 기둥 · 등잔 ──
export function noticeBoard() {
  return art(170, 140, (B, L) => {
    const g = 139;
    for (const x of [24, 144]) tube(B, [[x, g], [x, g - 104]], 3, 3, 0x6a4a2a, { warp: 0, seed: x });
    for (let y = g - 96; y < g - 24; y++) for (let x = 26; x < 144; x++) B.put(x, y, tone(ramp(0x8a6a44), 0.6 + (fbm(x, y, 5, 2, 2) - 0.5) * 0.3, x, y));
    for (let k = 0; k < 9; k++) {
      const x = 32 + (k % 4) * 27 + hash(k, 1) * 6, y = g - 90 + Math.floor(k / 4) * 22 + hash(k, 2) * 5, w = 18 + hash(k, 3) * 6, h = 16 + hash(k, 4) * 4;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) B.put(x + i, y + j, j === 0 ? 0xffffff : tone(ramp(0xf0e8d0), 0.8 - j * 0.02 - (i > w - 3 ? 0.2 : 0), x + i, j));
      for (let r = 0; r < 3; r++) for (let i = 2; i < w - 3; i++) hash(i, r, k) > 0.3 && B.put(x + i, y + 4 + r * 4, 0x8a8070);
      B.put(x + w / 2, y + 1, [0xd83a2a, 0x2a8ad8, 0x3aa85a][k % 3]);
    }
    gable(B, 84, g - 104, 140, 26, 0x6a3a2a, { eave: 6 });
    lantern(B, L, 84, g - 104);
  });
}
// ── 운명의 비석: 넓은 돌 받침 계단 위 거대한 비석 · 빛나는 별자리 룬 · 양옆 화로 ──
export function waystone() {
  return art(170, 210, (B, L) => {
    const g = 209, cx = 85;
    for (let s = 0; s < 3; s++) stones(B, cx - 70 + s * 14, g - 8 - s * 8, cx + 70 - s * 14, g - s * 8, 0xa8a090, 30 + s);
    const top = g - 190, base = g - 24;
    for (let y = top; y < base; y++) {
      const t = (y - top) / (base - top), half = 18 + t * 12 - (y - top < 14 ? (14 - (y - top)) * 1.1 : 0);
      for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
        const I = i < -half * 0.3 ? 0.55 : i < half * 0.4 ? 0.38 : 0.22;
        B.put(cx + i, y, Math.abs(i) >= Math.ceil(half) ? 0x14101c : tone(ramp(0x3a3448), I + (fbm(cx + i, y, 6, 9, 2) - 0.5) * 0.2, cx + i, y));
      }
    }
    const pts = [[0, -150], [-8, -128], [8, -120], [0, -100], [-10, -80], [10, -78], [0, -58]];
    for (let k = 0; k + 1 < pts.length; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let q = 0; q <= n; q++) B.put(cx + ax + ((bx - ax) * q) / n, g + ay + ((by - ay) * q) / n, 0xffc850, 200); }
    for (const [x, y] of pts) { glowSpot(B, cx + x, g + y, 8, 0xffd060, 160); B.put(cx + x, g + y, 0xffffff); L.push([cx + x, g + y, 8, 0xffd060]); }
    for (const x of [cx - 62, cx + 62]) { tube(B, [[x, g - 24], [x, g - 46]], 2, 2, 0x4a4a52, { warp: 0, seed: x }); mass(B, x - 8, g - 54, 17, 9, (X, Y) => Math.abs(X - x) < 8 - (Y - g + 54) * 0.4, { col: 0x5a5a62, round: 2, warp: 0 }); glowSpot(B, x, g - 58, 14, 0xff9040, 180); L.push([x, g - 58, 14, 0xff9040]); }
  });
}
