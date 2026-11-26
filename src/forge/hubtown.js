// 갈림길 요새의 알비온식 마을 풍경 — 길 뒤 연립 주택 줄 · 지붕 바다(대성당 첨탑) · 제작 작업장 · 시장 노점 · 수레
import * as G3 from "./bg3d.js";
import { mix, sh, hash, ramp, tone, mass } from "./bgart.js";
import { tube, glowSpot } from "./bgzones.js";
import { stones, timber, gable, windowL, door, chimney, sign, barrel } from "./hubbuild.js";

const art = (w, h, fn) => { const B = G3.buffer(w, h, !1), lights = []; fn(B, lights); return { c: B.toCanvas(), w, h, lights }; };
const PLASTER = [0xf0e4c8, 0xe8cfa0, 0xd8e0e8, 0xf0d0c0, 0xe0e8d0, 0xf4ecd8];
const BEAMS = [0x5a3a24, 0x4a3020, 0x6a4a2a];
const ROOFS = [0x3a4a6a, 0x8a3a2a, 0x5a4a3a, 0x2a5a5a, 0x7a3a3a];
const SHUT = [0x2a6a8a, 0x8a3a2a, 0x3a7a4a, 0x6a4a8a, 0xb08030];

// 연립 주택 한 채: 돌 아래층(가게 창·문) · 튀어나온 목조 위층 1~2 · 덧창·꽃 상자 창 · 박공 또는 옆 지붕(지붕창) · 굴뚝 · 걸린 간판
function townhouse(B, L, x, g, w, h, sd) {
  const r = (k) => hash(sd, k), pick = (a, k) => a[Math.floor(r(k) * a.length)];
  const plaster = pick(PLASTER, 1), beam = pick(BEAMS, 2), roofC = pick(ROOFS, 3), shut = pick(SHUT, 4);
  const gf = 30 + Math.floor(r(5) * 8), floors = h > 160 ? 2 : 1, fh = Math.floor((h - gf - 34) / floors);
  stones(B, x, g - gf, x + w, g, r(6) > 0.5 ? 0xa09888 : 0x8a8478, sd);
  r(7) > 0.45 ? windowL(B, L, x + 8, g - gf + 8, Math.min(30, w - 34), 16, 0xffe0a8) : windowL(B, L, x + 10, g - gf + 10, 12, 12);
  door(B, x + w - 20, g, 14, 26, pick([0x6a3a20, 0x3a4a6a, 0x5a2a2a], 8));
  let top = g - gf;
  for (let f = 0; f < floors; f++) {
    const jx = 3 + f * 2;
    timber(B, x - jx, top - fh, x + w + jx, top, plaster, beam);
    for (let i = -jx; i < w + jx; i++) B.put(x + i, top, 0x3a2418), B.put(x + i, top + 1, 0x2a1a10, 140);
    const n = Math.max(1, Math.floor((w + 2 * jx) / 32));
    for (let k = 0; k < n; k++) {
      const wx = x - jx + Math.round(((k + 0.5) * (w + 2 * jx)) / n) - 6, wy = top - fh + 8, lit = r(10 + k + f * 7) > 0.35 ? 0xffd890 : 0;
      windowL(B, L, wx, wy, 12, 14, lit);
      for (let j = 0; j < 14; j++) for (const sx of [wx - 5, wx + 14]) for (let i = 0; i < 3; i++) B.put(sx + i, wy + j, tone(ramp(shut), j % 4 === 0 ? 0.35 : 0.65 - i * 0.1, sx + i, j));
      if (r(20 + k + f) > 0.5) {
        for (let i = -2; i < 14; i++) B.put(wx + i, wy + 16, 0x6a4a2a), B.put(wx + i, wy + 17, 0x4a3020);
        for (let i = -1; i < 13; i += 2) B.put(wx + i, wy + 15, 0x4a8a3a), B.put(wx + i + 1, wy + 14, [0xe04050, 0xf0d040, 0xffffff, 0xe080c0][(i + k + 8) & 3]);
      }
    }
    top -= fh;
  }
  const jx = 3 + floors * 2, rh = 26 + Math.floor(r(30) * 22);
  if (r(31) > 0.45) gable(B, x + w / 2, top, w + 2 * jx - 4, rh, roofC, { eave: 5 });
  else {
    const R = ramp(roofC);
    for (let j = 0; j < rh; j++) {
      const ins = Math.round(j * 0.35);
      for (let i = -jx - 4 + ins; i < w + jx + 4 - ins; i++) {
        const sc = Math.floor((i + 100 + (Math.floor(j / 3) % 2) * 2) / 4) % 2;
        B.put(x + i, top - j, tone(R, 0.62 - (i / (w + 2 * jx)) * 0.3 - (j % 3 === 0 ? 0.16 : 0) + (sc ? 0.04 : 0), x + i, j));
      }
    }
    for (let i = -jx - 5; i < w + jx + 5; i++) B.put(x + i, top, R[5]);
    if (w > 60) {
      const dx = x + w / 2;
      for (let j = 0; j < 10; j++) for (let i = -8; i < 8; i++) B.put(dx + i, top - 14 + j, i === -8 || i === 7 ? 0xd0c0a0 : j < 9 ? 0xffd890 : 0xd0c0a0);
      gable(B, dx, top - 14, 18, 10, roofC, { eave: 2 });
      L.push([dx, top - 9, 8, 0xffd890]);
    }
  }
  r(40) > 0.4 && chimney(B, x + Math.floor(w * (0.2 + r(41) * 0.6)), top - rh * 0.4, 8, rh * 0.6 + 12, 0x8a7a6a);
  r(42) > 0.55 && sign(B, x + w - 4, g - gf - 4, 16, 14, pick([0x8a6a3a, 0x3a5a7a, 0x7a3a3a], 43), (cx, cy) => { for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) i * i + j * j < 10 && B.put(cx + i, cy + j, pick([0xe0c060, 0xd8d8e0, 0xe06040], 44)); });
}
// 길 뒤 연립 주택 줄 (길 전체, 집마다 폭·높이·색이 다르다) — 뒤에 있는 만큼 살짝 하늘빛
export function townRow(W, skyC) {
  return art(W, 240, (B, L) => {
    let x = -10, k = 0;
    while (x < W) {
      const w = 64 + Math.floor(hash(k, 77) * 50), h = 130 + Math.floor(hash(77, k) * 95);
      townhouse(B, L, x, 239, w, h, 500 + k * 13);
      x += w + 1 + Math.floor(hash(k, 78) * 4), k++;
    }
    for (let i = 0; i < B.col.length; i++) B.al[i] && (B.col[i] = sh(mix(B.col[i], skyC, 0.26), -0.14));
  });
}
// 지붕 바다 (중경, 이어지는 타일): 겹겹 지붕 · 굴뚝 · 대성당(본당 · 높은 창 · 첨탑)
export function roofsea(skyC) {
  return art(800, 230, (B) => {
    for (let row = 0; row < 3; row++) {
      const hz = 0.55 - row * 0.15, base = 160 + row * 26;
      if (row === 1) {
        const cx = 300;
        for (let j = 0; j < 90; j++) for (let i = -44; i < 44; i++) B.put(cx + i, base - j, mix(tone(ramp(0xc8c0b0), 0.72 - (i + 44) / 180, cx + i, j), skyC, hz));
        for (let k = 0; k < 4; k++) for (let j = 0; j < 26; j++) for (let i = 0; i < 7; i++) B.put(cx - 34 + k * 20 + i, base - 72 + j, mix(j < 4 ? 0xe0d8c8 : 0x4a6aa8, skyC, hz));
        for (let j = 0; j < 22; j++) { const half = 50 * (j / 22); for (let i = -half; i <= half; i++) B.put(cx + i, base - 112 + j, mix(tone(ramp(0x3a4a6a), i < 0 ? 0.7 : 0.4, cx + i, j), skyC, hz)); }
        for (let j = 0; j < 150; j++) { const half = j < 70 ? 13 : 13 * (1 - (j - 70) / 80); for (let i = -half; i <= half; i++) B.put(cx + 60 + i, base - j, mix(j < 70 ? tone(ramp(0xc8c0b0), i < 0 ? 0.78 : 0.45, cx + i, j) : tone(ramp(0x3a4a6a), i < 0 ? 0.7 : 0.4, cx + i, j), skyC, hz)); }
        for (let j = 0; j < 9; j++) B.put(cx + 60, base - 150 - j, mix(0xe0c060, skyC, hz)), j === 4 && [-3, -2, -1, 1, 2, 3].forEach((d) => B.put(cx + 60 + d, base - 154, mix(0xe0c060, skyC, hz)));
        for (let j = 40; j < 56; j++) for (let i = -5; i <= 5; i++) B.put(cx + 60 + i, base - j, mix(i === 0 ? 0xffd890 : 0x2a2a3a, skyC, hz));
      }
      let x = -20, k = 0;
      while (x < 820) {
        const w = 30 + Math.floor(hash(k, row, 5) * 40), h = 18 + Math.floor(hash(row, k, 6) * 26), c = ROOFS[(k + row) % ROOFS.length], wc = PLASTER[(k * 3 + row) % PLASTER.length];
        if (!(row === 0 && x > 230 && x < 390)) {
          for (let j = 0; j < 230 - base; j++) for (let i = 0; i < w; i++) B.put(x + i, base + j, mix(tone(ramp(wc), 0.62 - i / (w * 3), x + i, j), skyC, hz));
          for (let i = 5; i < w - 6; i += 11) for (let j = 6; j < 12; j++) B.put(x + i, base + j, mix(hash(i, k, row) > 0.4 ? 0xffd890 : 0x3a3a4a, skyC, hz + 0.05));
          for (let j = 0; j < h; j++) { const half = (w / 2 + 3) * (j / h); for (let i = -half; i <= half; i++) B.put(x + w / 2 + i, base - h + j, mix(tone(ramp(c), i < 0 ? 0.7 : 0.4, x + i, j), skyC, hz)); }
          hash(k, row, 9) > 0.5 && (() => { for (let j = 0; j < 14; j++) for (let i = 0; i < 4; i++) B.put(x + w * 0.7 + i, base - h * 0.6 - j, mix(0x7a6a5a, skyC, hz)); })();
        }
        x += w - 2, k++;
      }
    }
  });
}
// 제작 작업장 (제련로 · 제재소 · 무두질 · 베틀 · 석공)
export const smelter = () => art(60, 70, (B, L) => {
  stones(B, 8, 20, 52, 69, 0x8a7a6a, 61);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 18; i++) { const t = j > 10 ? Math.sqrt(Math.max(0, 81 - (j - 10) ** 2 * 3)) : 9; Math.abs(i - 9) < t && B.put(21 + i, 66 - j, mix(0x3a1008, 0xff9030, 1 - j / 18)); }
  glowSpot(B, 30, 58, 22, 0xff8030, 110), L.push([30, 58, 18, 0xff8030]);
  chimney(B, 24, 22, 12, 22, 0x7a6a5a);
  for (let k = 0; k < 4; k++) mass(B, 50 + k * 2, 62 - k * 3, 6, 5, () => true, { col: 0x8a8a92, round: 1, warp: 0 });
});
export const lumbermill = () => art(80, 50, (B) => {
  for (let k = 0; k < 6; k++) { const y = 46 - Math.floor(k / 3) * 8, x0 = 4 + (k % 3) * 6 + Math.floor(k / 3) * 3; tube(B, [[x0, y], [x0 + 40, y]], 4, 4, 0x8a5a30, { warp: 0, seed: k }); B.put(x0 + 40, y, 0xd8b878), B.put(x0 + 41, y - 1, 0xc8a060); }
  for (const x of [56, 74]) tube(B, [[x, 49], [x + 2, 30]], 1.5, 1.5, 0x6a4a2a, { warp: 0, seed: x });
  tube(B, [[52, 32], [78, 32]], 3, 3, 0xa07040, { warp: 0 });
  for (let i = 0; i < 14; i++) B.put(60 + i, 28 - (i % 2), 0xc8c8d0);
});
export const tannery = () => art(60, 70, (B) => {
  for (const x of [6, 54]) tube(B, [[x, 69], [x, 8]], 2, 2, 0x6a4a2a, { warp: 0, seed: x });
  tube(B, [[4, 10], [56, 10]], 1.5, 1.5, 0x6a4a2a, { warp: 0 });
  for (let k = 0; k < 3; k++) mass(B, 10 + k * 15, 12, 13, 30, (X, Y) => Math.abs(X - 16 - k * 15) < 6 - Math.abs(Y - 26) * 0.08 + Math.sin(Y * 0.5) * 0.6, { col: [0x9a6a3a, 0x8a5a30, 0xb08048][k], round: 2, bump: 0.6, sc: 3, warp: 0.8, seed: k });
  barrel(B, 30, 69);
});
export const loom = () => art(56, 60, (B) => {
  for (const x of [6, 48]) tube(B, [[x, 59], [x, 10]], 2, 2, 0x7a5434, { warp: 0, seed: x });
  for (const y of [12, 50]) tube(B, [[4, y], [50, y]], 2, 2, 0x7a5434, { warp: 0, seed: y });
  const C = [0xc03040, 0x3a6ad8, 0xe0c040, 0x3aa85a];
  for (let x = 10; x < 46; x++) for (let y = 14; y < 48; y++) B.put(x, y, (x + Math.floor(y / 6)) % 4 === 0 ? sh(C[Math.floor(y / 9) % 4], -0.3) : C[Math.floor(y / 9) % 4]);
  for (let k = 0; k < 2; k++) mass(B, 14 + k * 20, 52, 9, 7, () => true, { col: C[k], round: 3, warp: 0 });
});
export const stonecutter = () => art(66, 46, (B) => {
  const blk = (x, y, w, h, c) => mass(B, x, y, w, h, () => true, { col: c, round: 2, bump: 0.4, sc: 3, warp: 0.5, seed: x * 3 + y });
  blk(4, 30, 22, 15, 0xb8b0a0), blk(28, 32, 18, 13, 0xa8a090), blk(10, 17, 18, 13, 0xc0b8a8), blk(48, 36, 14, 9, 0x9a9488);
  for (let k = 0; k < 10; k++) B.put(30 + k * 2, 30 - (k % 3), 0xd8d0c0);
  tube(B, [[40, 30], [52, 20]], 1, 1, 0x6a4a2a, { warp: 0 }), mass(B, 49, 15, 9, 6, () => true, { col: 0x7a7a82, round: 1, warp: 0 });
});
// 시장 노점: 줄무늬 차양(물결 끝) · 나무 판대 · 물건(과일 · 천 두루마리 · 항아리)
export const marketStall = (c1, c2, goods) => art(64, 64, (B) => {
  for (const x of [4, 58]) tube(B, [[x, 63], [x, 16]], 1.5, 1.5, 0x6a4a2a, { warp: 0, seed: x });
  for (let j = 0; j < 16; j++) for (let i = 0; i < 64; i++) B.put(i, 8 + j + Math.round(i * 0.05), tone(ramp(Math.floor(i / 8) % 2 ? c1 : c2), 0.82 - j * 0.03, i, j));
  for (let i = 0; i < 64; i++) { const sc = Math.round(Math.abs(Math.sin((i / 8) * Math.PI)) * 3); for (let j = 0; j < sc; j++) B.put(i, 24 + j + Math.round(i * 0.05), sh(Math.floor(i / 8) % 2 ? c1 : c2, -0.2)); }
  mass(B, 2, 42, 60, 8, () => true, { col: 0x9a6a3a, round: 2, warp: 0 });
  for (let y = 50; y < 64; y++) for (let x = 6; x < 58; x++) B.put(x, y, x % 7 === 0 ? 0x4a3020 : 0x6a4a2a);
  for (let k = 0; k < 7; k++) {
    const x = 8 + k * 7;
    if (goods === "fruit") mass(B, x - 3, 36, 7, 7, (X, Y) => (X - x) ** 2 + (Y - 39) ** 2 < 9, { col: [0xd83a2a, 0xf0b030, 0x6ab040][k % 3], round: 2, warp: 0 });
    else if (goods === "cloth") tube(B, [[x - 2, 40], [x + 2, 36]], 2.5, 2.5, [0x3a6ad8, 0xc03040, 0xe0d0a0, 0x6a3a8a][k % 4], { warp: 0, seed: k });
    else mass(B, x - 3, 33, 7, 10, (X, Y) => Math.abs(X - x) < 3 - Math.abs(Y - 38) * 0.15 + (Y > 34 ? 0.5 : -1), { col: [0xb06a3a, 0x8a8a9a, 0x5a8aa8][k % 3], round: 2, warp: 0 });
  }
});
export const cart = () => art(70, 44, (B) => {
  mass(B, 6, 14, 50, 18, (X, Y) => Y > 16 + (X < 10 ? 2 : 0), { col: 0x8a5a30, round: 2, grooves: 0.8, warp: 0 });
  for (let k = 0; k < 5; k++) mass(B, 10 + k * 9, 6, 9, 10, (X, Y) => (X - 14 - k * 9) ** 2 + (Y - 12) ** 2 < 16, { col: [0xd8c070, 0xb08048, 0xc8a060][k % 3], round: 3, warp: 0 });
  for (const x of [18, 44]) {
    for (let a = 0; a < 360; a += 4) { const t = (a * Math.PI) / 180; B.put(x + Math.cos(t) * 9, 33 + Math.sin(t) * 9, 0x3a2a1a), B.put(x + Math.cos(t) * 8, 33 + Math.sin(t) * 8, 0x6a4a2a); }
    for (let k = 0; k < 4; k++) { const t = (k * Math.PI) / 4; for (let q = -8; q <= 8; q++) B.put(x + Math.cos(t) * q, 33 + Math.sin(t) * q, 0x5a3a20); }
  }
  tube(B, [[56, 24], [69, 28]], 1.5, 1.5, 0x6a4a2a, { warp: 0 });
});
