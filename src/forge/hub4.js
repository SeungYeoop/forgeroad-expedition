// 거점 「갈림길 요새」 — 네 갈래 출구가 모이는 요새 마을 (처음부터 새로)
//   ◀ 서문(서쪽 지상) · ▼ 갱도 승강기(지하) · 운명의 비석 광장(가운데) · ▲ 하늘 승강장(하늘, 정박한 비행선) · ▶ 동문(동쪽 지상)
//   그림: bgart 화법(높이장 음영 · 디더링 · 대기 원근) 버퍼를 캔버스로. 원경은 시차 타일, 건물·길은 월드 그림
import * as G3 from "./bg3d.js";
import { mix, sh, hash, vn, fbm, ramp, tone, mass, ranges, fog, glint, isle, crystals, tree, land, setDither } from "./bgart.js";
import { skyRef, hillsRef, pinesRef, bigTree, deadTree, tent, lanternPost, soilStrip, waterStrip, reedsStrip } from "./hubref.js";
import { PAL, skyGold, hillsVillage, pineBand, leafTree, birch, houseArt, palisadeGate, groundBank, waterBank, waterPlants, groundProps, boulderArt, barrelB, crateB, hay, canvasOf as canvasP } from "./hubpaint.js";
import { tower as towerB, wall as wallB, banner, chain, glowSpot, tube } from "./bgzones.js";
import { lamp } from "./hub2.js";
import { storehouse, smithy, armorer, wizardTower, dojoHall, noticeBoard, waystone } from "./hubbuild.js";
import { townRow, roofsea, smelter, lumbermill, tannery, loom, stonecutter, marketStall, cart } from "./hubtown.js";
import * as ZN from "./zones.js";
import { CLOTH, seerTower, skyLift, boardArt, runeStone, signpost2, mineHead, smelter2, lumber2, tannery2, loom2, stonecut2, cart2, tent2, lamp2 } from "./hubpaint2.js";

export const HUB_W = 2720;
// 돌아온 방향별로 설 자리 (문 바로 안쪽)
export const ARRIVE_X = { L: 190, R: 2530, U: 1640, D: 920 };
const SKY = [0x3a78c8, 0xcfe6f4], SKYC = 0xbcd8ec;
const canvasOf = (w, h, fn) => { const B = G3.buffer(w, h, !1); fn(B); return B.toCanvas(); };
const P = (w, h, fn, lights = []) => ({ c: canvasOf(w, h, fn), w, h, lights });

// ── 원경: 하늘 · 해 · 구름 ──
function skyCanvas(W, H) {
  return canvasOf(W, H, (B) => {
    G3.sky(B, SKY[0], SKY[1], mix(SKY[0], SKY[1], 0.55));
    glowSpot(B, 470, 60, 150, 0xffffff, 45), glowSpot(B, 470, 60, 30, 0xfffff0, 160), glowSpot(B, 470, 60, 10, 0xffffff, 255);
    for (let i = 0; i < 9; i++) { const x = (i * 131 + 40) % W, y = 30 + ((i * 47) % 110), s = 0.6 + ((i * 7) % 6) / 8; G3.cloud(B, x, y, s, 0xffffff, mix(SKY[0], SKY[1], 0.55), 235, 11 + i); }
  });
}
// 먼 산맥 + 떠 있는 섬 (하늘 갈래가 보인다)
function farCanvas() {
  return canvasOf(640, 240, (B) => {
    ranges(B, { n: 2, base: 236, amp: 80, col: 0x8a9ab8, col1: 0x6a7a98, skyC: SKYC, seed: 41, snow: 1, haze0: 0.72, haze1: 0.55, giant: 1.1, sharp: 0.6 });
    // 언덕 위 성채 (도시의 성)
    mass(B, 300, 150, 260, 90, (X, Y) => Y > 230 - 70 * Math.exp(-(((X - 430) / 90) ** 2)) + (vn(X, 0, 20, 5) - 0.5) * 6, { col: 0x6a8a6a, round: 8, bump: 0.5, sc: 10, haze: 0.45, skyC: SKYC, seed: 5 });
    wallB(B, 370, 166, 120, 22, 0xb8b0a0, { haze: 0.45, skyC: SKYC });
    for (const [x, h, w] of [[372, 50, 14], [404, 80, 18], [430, 110, 22], [462, 70, 16], [484, 46, 12]]) towerB(B, x, 168, w, h, 0xc0b8a8, 0x3a5a9a, 0xffd890, { haze: 0.45, skyC: SKYC, flag: 0xc03020 });
  });
}
// 들판: 산 아래부터 거리 뒤까지 끊김 없이 이어지는 땅 (구릉 · 밭고랑 · 생울타리 · 나무 · 농가) — 거점이 땅 위에 있다
function fieldsCanvas() {
  return canvasOf(640, 220, (B) => {
    const f1 = land(B, { base: 60, amp: 34, col: 0x6a8a52, cap: 0x8ab85a, skyC: SKYC, haze: 0.32, seed: 21, sc: 220, capH: 8 });
    for (let y = 70; y < 220; y += 7) for (let x = 0; x < 640; x++) y > f1(x) + 8 && (x + y * 3) % 23 < 2 && B.put(x, y, mix(0x5a7a40, SKYC, 0.3));
    for (let k = 0; k < 14; k++) { const x = (k * 53 + 11) % 640; tree(B, x, Math.round(f1(x)) + 6, 0.55 + (k % 3) * 0.15, 0x4a7a3a, 0x5a4030, { haze: 0.3, skyC: SKYC, kind: k % 4 ? "round" : "pine" }); }
    for (const x of [120, 410]) { const g = Math.round(f1(x)) + 10; for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) B.put(x + i, g - j, mix(0xe8dcc0, SKYC, 0.3)); for (let j = 0; j < 8; j++) { const h = 11 * (j / 8); for (let i = -h; i <= h; i++) B.put(x + 9 + i, g - 20 + j, mix(i < 0 ? 0xa04a32 : 0x7a3424, SKYC, 0.3)); } }
    const f2 = land(B, { base: 150, amp: 26, col: 0x5a7a42, cap: 0x7aa84a, skyC: SKYC, haze: 0.16, seed: 33, sc: 160, capH: 7 });
    for (let x = 0; x < 640; x += 3) hash(x, 4) > 0.35 && mass(B, x - 4, Math.round(f2(x)) - 6, 9, 8, (X, Y) => (X - x) ** 2 + ((Y - f2(x) + 2) * 1.4) ** 2 < 14, { col: 0x4a7a36, round: 2, bump: 0.8, sc: 2, haze: 0.16, skyC: SKYC, warp: 0.5 });
  });
}
// 중경: 요새 성벽 실루엣 · 망루 · 성 언덕
function midCanvas() {
  return canvasOf(800, 190, (B) => {
    mass(B, 0, 120, 800, 70, (X, Y) => Y > 150 - Math.sin(X * 0.012) * 18 - vn(X, 0, 40, 3) * 14, { col: 0x5a7a5a, round: 6, bump: 0.5, sc: 10, haze: 0.35, skyC: SKYC, seed: 3 });
    wallB(B, 0, 170, 800, 26, 0x9a9488, { haze: 0.4, skyC: SKYC });
    for (let k = 0; k < 9; k++) towerB(B, 20 + k * 92 + (k % 2) * 20, 172, 14 + (k % 3) * 4, 50 + ((k * 37) % 50), 0xa8a294, [0x3a5a9a, 0x8a3a2a, 0x3a6a4a][k % 3], 0xffd890, { haze: 0.38, skyC: SKYC, flag: [0xc03020, 0x2a6ad8, 0xe0b040][k % 3] });
  });
}
// 길: 돌길(빛 받는 윗변 · 줄눈 · 크기가 다른 돌) → 연석 → 흙과 풀 길가(꽃 · 돌멩이 · 울타리 말뚝) — 땅 위 마을
function streetCanvas(W, H) {
  return canvasOf(W, H, (B) => {
    const R5 = ramp(0x8a8478), G5 = ramp(0x5a8a42), S5 = ramp(0x7a5a3a), road = 26;
    for (let y = 0; y < Math.min(H, road); y++) {
      const row = Math.floor(y / 6), off = (row * 7) % 11;
      for (let x = 0; x < W; x++) {
        const bw = 9 + Math.floor(hash(Math.floor((x + off) / 10), row, 3) * 5), bx = (x + off) % bw, by = y % 6;
        const I = 0.62 - y / 90 + (hash(Math.floor((x + off) / bw), row, 7) - 0.5) * 0.25 + (by === 1 ? 0.12 : 0) - (bx === 0 || by === 0 ? 0.3 : 0);
        B.put(x, y, tone(R5, I, x, y));
      }
    }
    for (let x = 0; x < W; x++) for (let j = 0; j < 4; j++) B.put(x, road + j, tone(ramp(0xa8a090), 0.8 - j * 0.18 - (x % 22 === 0 ? 0.3 : 0), x, j));
    for (let y = road + 4; y < H; y++) for (let x = 0; x < W; x++) {
      const n = fbm(x, y, 18, 5, 3), grass = n > 0.42 - (y - road) * 0.004;
      B.put(x, y, grass ? tone(G5, 0.62 + (n - 0.5) * 0.6 - (y - road) / 120, x, y) : tone(S5, 0.55 + (fbm(x, y, 5, 9, 2) - 0.5) * 0.4 - (y - road) / 140, x, y));
    }
    for (let x = 0; x < W; x += 2) if (hash(x, 11) > 0.4) { const L = 2 + Math.floor(hash(x, 12) * 4); for (let k = 0; k < L; k++) B.put(x, road + 4 - k, k === L - 1 ? G5[0] : G5[1]); }
    for (let k = 0; k < W / 9; k++) { const x = Math.floor(hash(k, 13) * W), y = road + 8 + Math.floor(hash(k, 14) * (H - road - 12)), c = [0xffffff, 0xf0d040, 0xe06080, 0xb090f0][k % 4]; B.put(x, y, c), B.put(x + 1, y, sh(c, -0.2)), B.put(x, y + 1, 0x3a6a2a); }
    for (let k = 0; k < W / 30; k++) { const x = Math.floor(hash(k, 15) * W), y = road + 10 + Math.floor(hash(k, 16) * (H - road - 16)), r = 2 + Math.floor(hash(k, 17) * 3); mass(B, x - r, y - r, r * 2 + 1, r * 2 + 1, (X, Y) => (X - x) ** 2 + ((Y - y) * 1.3) ** 2 < r * r, { col: 0x9a9488, round: 1.5, warp: 0 }); }
    for (let x = 6; x < W; x += 34) { for (let j = 0; j < 12; j++) B.put(x, road + 16 - j, j === 11 ? 0x8a6a40 : 0x6a4a2a), B.put(x + 1, road + 16 - j, 0x4a3020); }
    for (const y of [road + 8, road + 12]) for (let x = 6; x < W; x++) B.put(x, y, 0x7a5a34);
  });
}
// 원근 바닥 줄: 위(먼 쪽)는 돌이 작고 옅게, 아래(가까운 쪽)는 크고 짙게 — 줄마다 다른 속도로 흐른다
function floorRows(Hf) {
  const rows = [];
  for (let y = 0, k = 0; y < Hf; k++) { const h = Math.min(Hf - y, Math.max(2, Math.round(2 + (y / Hf) * 9))); rows.push({ k, y, h }); y += h; }
  return rows;
}
function floorRow(row, Hf) {
  return canvasOf(640, row.h, (B) => {
    const t = row.y / Hf, bw = Math.round(7 + t * 22), off = (row.k * 11) % bw, R5 = ramp(mix(0x9a9284, 0x6a6458, t));
    for (let y = 0; y < row.h; y++) for (let x = 0; x < 640; x++) {
      const b = Math.floor((x + off) / bw), bx = (x + off) % bw;
      let I = 0.66 - t * 0.25 + (hash(b, row.k, 7) - 0.5) * 0.28 + (y === 0 ? 0.14 : 0) - (bx === 0 || y === row.h - 1 ? 0.32 : 0) - (bx === 1 ? -0.06 : 0);
      row.k === 0 && (I = 0.85 - (x % 24 === 0 ? 0.3 : 0));
      B.put(x, y, tone(R5, I, x, y));
    }
  });
}
// ── 출구 건물 ──
// 서문·동문: 두 망루 사이 아치 문(내리닫이 창살) · 성벽 · 깃발 · 가는 길 표지
function gateArt(flip, col, label) {
  const w = 180, h = 190;
  return P(w, h, (B) => {
    wallB(B, 10, h - 1, w - 20, 92, 0x9a9488);
    const ax = w / 2, aw = 30, ah = 62, ay = h - 1;
    for (let j = 0; j < ah; j++) for (let i = -aw; i <= aw; i++) { const top = j > ah - aw ? Math.sqrt(Math.max(0, aw * aw - (j - (ah - aw)) ** 2)) : aw; Math.abs(i) < top && B.put(ax + i, ay - j, j % 8 === 0 || (i + 60) % 8 === 0 ? 0x3a3430 : mix(0x0c0a10, col, 0.15 + (1 - j / ah) * 0.25)); }
    for (let i = -aw - 3; i <= aw + 3; i++) for (let j = 0; j < 4; j++) { const r = aw + 3 - j, yy = ay - (ah - aw) - Math.sqrt(Math.max(0, r * r - i * i)); Math.abs(i) <= r && B.put(ax + i, yy, tone(ramp(0xb8b0a0), 0.8 - j * 0.15, ax + i, j)); }
    towerB(B, 6, h - 1, 30, 140, 0x9a9080, 0x3e3434, 0xffc070, { flag: col });
    towerB(B, w - 36, h - 1, 30, 140, 0x9a9080, 0x3e3434, 0xffc070, { flag: col });
    banner(B, ax - 24, h - 70, 14, col, { w: 10, h: 26, emblem: 0xffe8a0 }), banner(B, ax + 16, h - 70, 14, col, { w: 10, h: 26, emblem: 0xffe8a0 });
    glowSpot(B, ax, h - 30, 40, col, 60);
  }, [[90, 160, 14, col]]);
}
// ▲ 하늘 승강장: 높은 돌탑 + 옆으로 오르내리는 나무 승강 틀(밧줄) + 꼭대기에 정박한 비행선(풍선 · 곤돌라 · 밧줄)
function skyLiftArt() {
  const w = 220, h = 300;
  return P(w, h, (B) => {
    const tx = 70, tw = 40, th = 200;
    towerB(B, tx, h - 1, tw, th, 0x9a9080, 0x3e3434, 0xffc070, { roofK: 0.6 });
    for (let j = 0; j < th - 10; j++) { B.put(tx + tw + 6, h - 1 - j, 0x6a4a2a), B.put(tx + tw + 24, h - 1 - j, 0x6a4a2a); j % 12 === 0 && (() => { for (let i = 6; i <= 24; i++) B.put(tx + tw + i, h - 1 - j, 0x8a6438); })(); }
    for (let i = 4; i <= 26; i++) for (let j = 0; j < 4; j++) B.put(tx + tw + i, h - 90 + j, j === 0 ? 0xa07a48 : 0x6a4a2a);
    for (let j = 0; j < th; j++) B.put(tx + tw + 15, h - 1 - j, 0xd8c8a0);
    // 비행선
    const bx = 130, by = 52;
    mass(B, bx - 78, by - 34, 156, 68, (X, Y) => ((X - bx) / 76) ** 2 + ((Y - by) / 30) ** 2 < 1, { col: 0xd86a4a, round: 22, bump: 0.15, sc: 14, warp: 0, rimCol: 0xffe0c0 });
    for (let k = -3; k <= 3; k++) for (let j = -28; j <= 28; j++) { const x = bx + k * 20 * Math.sqrt(Math.max(0, 1 - (j / 30) ** 2)); B.put(x, by + j, 0x8a3a2a, 160); }
    mass(B, bx - 100, by - 14, 26, 28, (X, Y) => X > bx - 98 && Math.abs(Y - by) < (X - (bx - 98)) * 0.6, { col: 0xc85a3a, round: 3, warp: 0 });
    for (const dx of [-30, -10, 10, 30]) for (let j = 0; j < 22; j++) B.put(bx + dx * (1 - j / 60), by + 28 + j, 0x4a3a2a);
    mass(B, bx - 34, by + 48, 68, 16, (X, Y) => Math.abs(X - bx) < 32 - (Y - by - 48) * 0.5, { col: 0x8a5a30, round: 3, bump: 0.4, sc: 3, warp: 0 });
    for (let i = 0; i < 5; i++) B.put(bx - 24 + i * 12, by + 53, 0xffe090), B.put(bx - 23 + i * 12, by + 53, 0xffe090);
    chain(B, bx - 34, by + 56, tx + tw / 2, h - th - 6, 0x6a5a4a, { sag: 8 });
  }, [[90, 120, 10], [130, 105, 10]]);
}
// ▼ 갱도 승강기: 나무 권양탑(기운 다리 · 버팀목 · 큰 바퀴 · 줄) + 갱구(땅에 뚫린 어두운 구멍과 붉은 등) + 광차와 광석 더미
function mineLiftArt() {
  const w = 200, h = 190;
  return P(w, h, (B) => {
    const cx = 100, top = 30, base = h - 1;
    const beam = (x0, y0, x1, y1, r) => tube(B, [[x0, y0], [x1, y1]], r, r, 0x7a5434, { bump: 0.7, sc: 2, seed: x0 + y0 });
    beam(cx - 50, base, cx - 10, top + 10, 4), beam(cx + 50, base, cx + 10, top + 10, 4), beam(cx - 80, base, cx - 14, top + 30, 3);
    for (let k = 1; k < 5; k++) { const y = base - k * 32, half = 50 - (k * 40) / 5; beam(cx - half, y, cx + half, y, 2.5); beam(cx - half, y, cx + half - 8, y - 28, 1.5); }
    const r = 22;
    for (let a = 0; a < 360; a += 2) { const t = (a * Math.PI) / 180; for (let q = 0; q < 3; q++) B.put(cx + Math.cos(t) * (r - q), top + Math.sin(t) * (r - q), q === 0 ? 0x2a2420 : 0x5a5450); }
    for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3; for (let q = 0; q < r; q++) B.put(cx + Math.cos(t) * q, top + Math.sin(t) * q, 0x4a4440); }
    mass(B, cx - 5, top - 5, 10, 10, (X, Y) => (X - cx) ** 2 + (Y - top) ** 2 < 16, { col: 0x8a8a90, round: 3, warp: 0 });
    for (let y = top; y < base; y++) B.put(cx + r - 1, y, 0x2a2a2a);
    for (let j = 0; j < 22; j++) for (let i = -26; i <= 26; i++) B.put(cx + i, base - j, Math.abs(i) > 22 || j > 18 ? 0x5a4a3a : mix(0x080608, 0x3a1a10, j / 30));
    glowSpot(B, cx, base - 10, 34, 0xff7030, 70), glowSpot(B, cx - 30, base - 40, 10, 0xffb060, 140), glowSpot(B, cx + 30, base - 40, 10, 0xffb060, 140);
    const cart = (x) => { mass(B, x, base - 16, 28, 14, (X, Y) => X > x + (Y - base + 16) * 0.2 && X < x + 28 - (Y - base + 16) * 0.2, { col: 0x6a6a72, round: 2, warp: 0 }); for (const dx of [6, 21]) mass(B, x + dx - 3, base - 5, 7, 6, (X, Y) => (X - x - dx) ** 2 + (Y - base + 2) ** 2 < 9, { col: 0x3a3a40, round: 2, warp: 0 }); for (let k = 0; k < 6; k++) mass(B, x + 4 + k * 4, base - 21, 6, 6, (X, Y) => (X - x - 7 - k * 4) ** 2 + (Y - base + 18) ** 2 < 6, { col: k % 2 ? 0xc06a2a : 0x5a5458, round: 2 }); };
    cart(4), cart(w - 34);
    for (let x = 0; x < w; x++) (x % 8 < 2 && B.put(x, base - 1, 0x5a3e24), B.put(x, base - 3, 0x9a9aa0));
  }, [[70, 150, 10, 0xffb060], [130, 150, 10, 0xffb060]]);
}
// 광장: 돌 원판 바닥 + 네 갈래 이정표
function signpost() {
  return P(70, 90, (B) => {
    tube(B, [[35, 89], [35, 14]], 3, 3, 0x7a5434, { bump: 0.6, sc: 2 });
    const arms = [[-1, 22, 0x6a8a4a, "W"], [1, 34, 0xc89040, "E"], [-1, 46, 0x6a9ad8, "U"], [1, 58, 0xb06a4a, "D"]];
    for (const [d, y, c] of arms) for (let j = 0; j < 8; j++) for (let i = 0; i < 26 - (j < 4 ? 4 - j : j - 3); i++) B.put(35 + d * (4 + i), y + j, tone(ramp(c), 0.8 - j * 0.07, i, j));
  });
}

// ── 시설 배치 (왼쪽에서 오른쪽) ──
const dirName = (dx, dy) => { const z = ZN.cell(dx, dy); return z && z !== ZN.HUB_ID ? ZN.BY_ID[z.id ?? z]?.name ?? "" : ""; };
function FAC() {
  return [
    { id: "exitL", name: `◀ 서문 · ${dirName(-1, 0)}`, x: 100, art: () => gateArt(!0, 0x3a8a4a), exit: "L" },
    { id: "wardrobe", name: "창고", x: 330, art: storehouse, npc: ["npc_quarter", 46, !0] },
    { id: "forge", name: "대장간 · 무기", x: 590, art: smithy, npc: ["npc_smith", 24, !0] },
    { id: "exitD", name: `▼ 갱도 승강기 · ${dirName(0, 1)}`, x: 870, art: mineLiftArt, exit: "D" },
    { id: "armory", name: "갑옷 공방", x: 1130, art: armorer, npc: ["npc_armorer", -36, !0] },
    { id: "destiny", name: "운명의 비석", x: 1370, art: waystone },
    { id: "plaza", x: 1470, art: signpost },
    { id: "exitU", name: `▲ 하늘 승강장 · ${dirName(0, -1)}`, x: 1680, art: skyLiftArt, exit: "U" },
    { id: "lab", name: "마법사 탑", x: 1950, art: wizardTower, npc: ["npc_mage", 44, !0] },
    { id: "dojo", name: "무술 도장", x: 2190, art: dojoHall, npc: ["npc_trainer", 40, !0], dummy: -150 },
    { id: "board", name: "기록 게시판", x: 2430, art: noticeBoard, npc: ["npc_scribe", -66, !1] },
    { id: "exitR", name: `▶ 동문 · ${dirName(1, 0)}`, x: 2620, art: () => gateArt(!1, 0xd89a3a), exit: "R" },
  ];
}

// ── 시설 그림 (이엉지붕 긴 집 계열) ──
const anvil = (B, x, g) => { for (let j = 0; j < 4; j++) for (let i = -9; i < 11; i++) B.put(x + i, g - 12 + j, j === 0 ? 0x9a9aa4 : 0x5a5a62); for (let j = 4; j < 9; j++) for (let i = -3; i < 4; i++) B.put(x + i, g - 12 + j, 0x4a4a52); for (let j = 9; j < 12; j++) for (let i = -6; i < 7; i++) B.put(x + i, g - 12 + j, 0x3a3a42); };
const armorStand = (B, x, g) => { for (let j = 0; j < 26; j++) B.put(x, g - j, 0x5a3e28); for (let j = 0; j < 14; j++) for (let i = -6; i <= 6; i++) Math.abs(i) < 6 - Math.max(0, j - 9) * 0.6 && B.put(x + i, g - 24 + j, i < -2 ? 0xd8dce4 : i < 3 ? 0xa8acb8 : 0x6a6e7a); for (let j = 0; j < 6; j++) for (let i = -3; i <= 3; i++) B.put(x + i, g - 31 + j, i < 0 ? 0xc8ccd4 : 0x8a8e9a); };
const dummyPost = (B, x, g) => { for (let j = 0; j < 30; j++) for (let i = 0; i < 3; i++) B.put(x + i - 1, g - j, i ? 0x5a3e28 : 0x7a5a3c); for (let i = -9; i <= 9; i++) for (let j = 0; j < 3; j++) B.put(x + i, g - 22 + j, j ? 0x5a3e28 : 0x7a5a3c); hay(B, x, g - 26, 12, 8); };
function FAC5() {
  return [
    { id: "exitL", name: `◀ 서문 · ${dirName(-1, 0)}`, x: 100, art: () => palisadeGate(0x3a7a44), exit: "L" },
    { id: "wardrobe", name: "창고", x: 330, art: () => houseArt({ w: 150, wallH: 30, roofH: 54, beams: !0, windows: [-46], seed: 2, extra: (B, L, cx, g) => { barrelB(B, cx + 62, g), barrelB(B, cx + 76, g), crateB(B, cx - 84, g), crateB(B, cx - 72, g, 10), crateB(B, cx - 80, g - 12, 9); } }), npc: ["npc_quarter", 46, !0] },
    { id: "forge", name: "대장간 · 무기", x: 590, art: () => houseArt({ w: 160, wallH: 32, roofH: 50, seed: 4, lit: 0xff7a20, doorDX: -30, windows: [40], extra: (B, L, cx, g) => { anvil(B, cx + 10, g); for (let y = g - 110; y < g - 30; y++) for (let i = 0; i < 12; i++) B.put(cx + 46 + i, y, (y + (i > 5 ? 3 : 0)) % 6 === 0 || i === 0 ? 0x5e5850 : i < 6 ? 0xa8a090 : 0x847c70); L.push([cx - 30, g - 14, 30, 0xff8030]); } }), npc: ["npc_smith", 24, !0] },
    { id: "exitD", name: `▼ 갱도 승강기 · ${dirName(0, 1)}`, x: 870, art: mineHead, exit: "D" },
    { id: "armory", name: "갑옷 공방", x: 1130, art: () => houseArt({ w: 160, wallH: 30, roofH: 52, seed: 6, beams: !0, windows: [-40, 40], extra: (B, L, cx, g) => { armorStand(B, cx + 74, g), armorStand(B, cx + 90, g); } }), npc: ["npc_armorer", -36, !0] },
    { id: "destiny", name: "운명의 비석", x: 1370, art: runeStone },
    { id: "plaza", x: 1470, art: signpost2 },
    { id: "exitU", name: `▲ 하늘 승강장 · ${dirName(0, -1)}`, x: 1680, art: skyLift, exit: "U" },
    { id: "lab", name: "마법사 탑", x: 1950, art: seerTower, npc: ["npc_mage", 44, !0] },
    { id: "dojo", name: "무술 도장", x: 2190, art: () => houseArt({ w: 190, wallH: 32, roofH: 58, seed: 8, beams: !0, windows: [-56, 56], extra: (B, L, cx, g) => { dummyPost(B, cx - 104, g), dummyPost(B, cx - 120, g); } }), npc: ["npc_trainer", 40, !0], dummy: -150 },
    { id: "board", name: "기록 게시판", x: 2430, art: boardArt, npc: ["npc_scribe", -66, !1] },
    { id: "exitR", name: `▶ 동문 · ${dirName(1, 0)}`, x: 2620, art: () => palisadeGate(0xb87a30), exit: "R" },
  ];
}

export function buildHub(sc, R, gy) {
  // 레퍼런스 ref08 기준: 역광 하늘 · 구릉 마을 · 침엽수 띠 · 잎 뭉치 나무 · 이엉지붕 긴 집 · 흙 단면 · 비치는 물 · 물풀 전경
  setDither(!1);
  const { ot: W, xt: Hh, zt } = R;
  const ADD = zt.BlendModes.ADD;
  const tex = (key, canvas) => (sc.textures.exists(key) || sc.textures.addCanvas(key, canvas), key);
  const SUN = [130, 118];
  sc.add.image(W / 2, Hh / 2, tex("h7_sky", skyGold(W, Hh, SUN))).setScrollFactor(0).setDepth(-100);
  const layers = [];
  const lay = (key, cv, f, y, d) => { const t = sc.add.tileSprite(W / 2, y, W, cv.height, tex(key, cv)).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d); t.setData("f", f); layers.push(t); return t; };
  lay("h7_hills", hillsVillage(640, 200).c, 0.06, gy + 6, -98);
  const haze = sc.add.graphics().setScrollFactor(0).setDepth(-97.5);
  for (let i = 0; i < 20; i++) haze.fillStyle(0xf4e4bc, 0.02 * (20 - Math.abs(i - 10) * 2)).fillRect(0, gy - 100 + i * 3, W, 3);
  lay("h7_pinesF", pineBand(640, 150, 7, 0.34), 0.14, gy - 4, -97);
  const haze2 = sc.add.graphics().setScrollFactor(0).setDepth(-96.5);
  for (let i = 0; i < 16; i++) haze2.fillStyle(0xf0dcb0, 0.016 * (16 - Math.abs(i - 8) * 2)).fillRect(0, gy - 60 + i * 3, W, 3);
  lay("h7_pinesN", pineBand(640, 190, 5, 0.04, 26), 0.26, gy + 4, -96);
  // 해에서 퍼지는 빛줄기 (숲 위, 건물 뒤)
  const rays = sc.add.graphics().setScrollFactor(0).setDepth(-95).setBlendMode(ADD);
  for (let k = 0; k < 7; k++) { const a = 0.12 + k * 0.17 + Math.sin(k * 3.1) * 0.05, a2 = a + 0.05 + (k % 3) * 0.02, RL = 760; rays.fillStyle(0xffe8b0, 0.026).fillTriangle(SUN[0], SUN[1], SUN[0] + Math.cos(a) * RL, SUN[1] + Math.sin(a) * RL, SUN[0] + Math.cos(a2) * RL, SUN[1] + Math.sin(a2) * RL); }
  for (let i = 0; i < 5; i++) {
    const b = sc.add.text(-20, 50 + i * 10, "v", { fontSize: "8px", color: "#3a3428" }).setScrollFactor(0.1).setDepth(-97);
    sc.tweens.add({ targets: b, x: W + 200, y: b.y - 14, duration: 30000 + i * 2500, delay: i * 2300, repeat: -1 });
  }
  const glow = (x, y, s, col = 0xffb050, a = 0.5) => {
    const g = sc.add.image(x, y, "vx_glow").setBlendMode(ADD).setTint(col).setAlpha(a).setScale(s / 24).setDepth(7);
    sc.tweens.add({ targets: g, alpha: a * 0.6, duration: 900 + Math.random() * 900, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  };
  const WL = gy + 30, refl = [];
  const shadows = sc.add.graphics().setDepth(2.3);
  const place = (key, p, x, depth = 1, rf = 0.28) => {
    sc.add.image(x, gy + 1, tex(key, p.c)).setOrigin(0.5, 1).setDepth(depth);
    rf && refl.push(sc.add.image(x, WL + 22, key).setOrigin(0.5, 0).setFlipY(!0).setAlpha(rf).setTint(0x7a8a84).setDepth(2.05));
    const w = p.w * 0.75, x0 = x - w / 2;
    for (let i = 0; i < 4; i++) shadows.fillStyle(0x1a1208, 0.09).fillRect(x0 + i * 3, gy - 1, w - i * 6, 2 + i * 0.5);
    const ox = x - p.w / 2, oy = gy + 1 - p.h;
    for (const [lx, ly, s, col] of p.lights ?? []) glow(ox + lx, oy + ly, s * 1.7, col ?? 0xffb050, 0.55);
    return { ox, oy, w: p.w, h: p.h };
  };
  const out = { facilities: [], layers, street: null, floor: [], ext: [], VY: gy - 170 };
  // 큰 나무 (가을 노랑 · 올리브 · 자작) — 한 화면에 한두 그루, 사이로 구릉이 보이게
  for (const [k, p, x] of [["h7_t1", leafTree(PAL.autumn, 1, 1), 210], ["h7_t2", leafTree(PAL.olive, 4, 1.05), 750], ["h7_t3", birch(PAL.olive, 7, 1), 1010], ["h7_t4", leafTree(PAL.autumn, 9, 0.95), 1560], ["h7_t5", leafTree(PAL.olive, 12, 1.1), 2060], ["h7_t6", birch(PAL.autumn, 15, 0.95), 2320]]) place(k, p, x, 0.7, 0.22);
  // 큰 바위 무더기 (건물 뒤)
  for (const [k, w, h, x, sd] of [["h7_rock1", 70, 44, 150, 1], ["h7_rock2", 56, 34, 1450, 2], ["h7_rock3", 80, 50, 2105, 3], ["h7_rock4", 46, 28, 790, 4]]) place(k, boulderArt(w, h, sd), x, 0.65, 0.2);
  // 천막 (붉은 물결 장식) · 제작 작업장 · 짚더미
  for (const [k, p, x] of [["h8_tent1", tent2(80, 70, CLOTH.red), 228], ["h8_tent2", tent2(70, 64, CLOTH.blue), 1535]]) place(k, p, x, 0.8);
  for (const [k, p, x] of [["h8_smelt", smelter2(), 462], ["h8_lumber", lumber2(), 736], ["h8_tan", tannery2(), 1010], ["h8_loom", loom2(), 1840], ["h8_stone", stonecut2(), 2060], ["h8_cart", cart2(), 2330]]) place(k, p, x, 1.4, 0.2);
  for (const f of FAC5()) {
    const p = f.art();
    const { ox, oy } = place("h8_" + f.id, p, f.x, f.exit ? 1.2 : 1);
    if (f.id === "forge") {
      sc.add.particles(ox + p.w / 2 + 52, oy + 30, "hub_smoke", { speedY: { min: -26, max: -12 }, speedX: { min: 4, max: 12 }, lifespan: 3600, frequency: 240, alpha: { start: 0.5, end: 0 }, scale: { start: 0.6, end: 2 } }).setDepth(0);
      sc.add.particles(ox + p.w / 2 - 30, gy - 16, "vx_px", { x: { min: -10, max: 10 }, speedY: { min: -70, max: -30 }, lifespan: 1100, frequency: 70, tint: [0xffd060, 0xff7020], blendMode: ADD }).setDepth(8);
    }
    if (f.id === "destiny") sc.add.particles(f.x, oy + 110, "vx_px", { x: { min: -22, max: 22 }, y: { min: -60, max: 40 }, speedY: { min: -30, max: -12 }, lifespan: 1800, frequency: 120, tint: [0xffd060, 0xfff0b0], blendMode: ADD }).setDepth(8);
    if (f.exit === "D") sc.add.particles(f.x, gy - 8, "vx_px", { x: { min: -18, max: 18 }, speedY: { min: -40, max: -16 }, lifespan: 1400, frequency: 90, tint: [0xff8040, 0xffc060], blendMode: ADD }).setDepth(8);
    if (f.exit === "U") sc.add.particles(f.x + 20, gy - 60, "vx_soft", { x: { min: -14, max: 14 }, speedY: { min: -60, max: -30 }, lifespan: 2200, frequency: 140, scale: { start: 0.25, end: 0 }, tint: [0xfff0d0, 0xffffff], blendMode: ADD }).setDepth(8);
    if (f.npc) {
      const [k, dx, flip] = f.npc;
      sc.textures.exists(k) && sc.add.sprite(f.x + dx, gy + 1, k, 0).setOrigin(0.5, 1).setDepth(6).setFlipX(flip).play(k + "_idle");
    }
    if (f.name) {
      R.ct(sc, f.x, Math.max(oy - 8, f.exit ? 66 : 22), f.name, "small", f.exit ? "#fff4d8" : "#ffe8c0", { stroke: "#2a1a0c", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(9);
      out.facilities.push({ id: f.id, name: f.name, x: f.x, labelY: oy, dummyX: f.dummy ? f.x + f.dummy : null, exit: f.exit });
    }
  }
  const lampXs = [460, 1000, 1250, 1820, 2310];
  for (const x of lampXs) place("h8_lantern", lamp2(), x, 3, 0.25);
  // 땅선 소품 (덤불 · 들꽃 · 풀포기 · 돌 · 버섯 · 울타리) — 출구 앞은 비운다
  sc.add.image(0, gy + 1, tex("h7_props", groundProps(HUB_W, 40, [[30, 170], [835, 905], [1645, 1715], [2550, 2700]]))).setOrigin(0, 1).setDepth(2.4);
  // 전경: 흙 단면(땅선 = 캔버스 8번 줄) → 비치는 물 → 물풀 (물풀은 더 빠르게 흐른다)
  const fl = (key, cv, f, y, d) => { const t = sc.add.tileSprite(W / 2, y, W, cv.height, tex(key, cv)).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d); t.setData("f", f), out.floor.push(t); return t; };
  fl("h7_water", waterBank(640, Hh - WL + 2), 1, WL, 2.0);
  fl("h7_bank", groundBank(640, 46), 1, gy - 8, 2.2);
  fl("h7_plants", waterPlants(640, 110), 1.22, Hh - 110, 3);
  // 물 위 오리 두 마리 (생기)
  const duck = canvasP(12, 8, (B) => { for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) B.put(1 + i, 4 + j - (i > 6 ? 1 : 0), j === 0 ? 0xa08060 : 0x6a5038); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) B.put(8 + i, 1 + j, j === 0 ? 0x3a7a4a : 0x2a5a3a); B.put(11, 2, 0xe8a030); });
  for (let k = 0; k < 2; k++) {
    const d = sc.add.image(500 + k * 900, WL + 24 + k * 10, tex("h7_duck", duck)).setDepth(2.25);
    sc.tweens.add({ targets: d, x: d.x + 260, duration: 26000 + k * 6000, yoyo: !0, repeat: -1, ease: "Sine.easeInOut", onYoyo: () => d.setFlipX(!0), onRepeat: () => d.setFlipX(!1) });
    sc.tweens.add({ targets: d, y: d.y + 1, duration: 900, yoyo: !0, repeat: -1 });
  }
  // 해 번짐 (화면 위에 부드럽게) + 따뜻한 먼지
  sc.add.image(SUN[0], SUN[1], "vx_glow").setBlendMode(ADD).setTint(0xfff0c0).setScale(16).setAlpha(0.15).setScrollFactor(0).setDepth(50);
  sc.add.image(SUN[0], SUN[1], "vx_glow").setBlendMode(ADD).setTint(0xffe0a0).setScale(30).setAlpha(0.05).setScrollFactor(0).setDepth(50);
  sc.add.image(SUN[0] - 10, SUN[1] + 10, "vx_glow").setBlendMode(ADD).setTint(0xfff8e0).setScale(5).setAlpha(0.28).setScrollFactor(0).setDepth(50);
  sc.add.particles(0, 0, "vx_soft", { x: { min: -40, max: W + 40 }, y: { min: 80, max: gy }, speedX: { min: -8, max: 8 }, speedY: { min: -10, max: -3 }, lifespan: 6000, frequency: 600, alpha: { start: 0, end: 0.18 }, scale: { min: 0.5, max: 1.2 }, tint: [0xfff0c8], blendMode: ADD }).setScrollFactor(1.2, 0).setDepth(55);
  // 화면 색 보정: 따뜻한 금빛 + 초록 채도 낮춤 + 부드러운 번짐 + 가장자리 어둡게 (ref08의 촉촉한 빛)
  try {
    const cam = sc.cameras.main;
    if (cam.postFX) {
      cam.postFX.clear();
      const cm = cam.postFX.addColorMatrix();
      cm.saturate(-0.05);
      cm.contrast(0.12, !0);
      cm.multiply([1.05, 0.03, 0, 0, 0, 0.01, 1, 0.01, 0, 0, 0, 0.03, 0.88, 0, 0, 0, 0, 0, 1, 0], !0);
    }
  } catch (e) {}
  out.refl = refl;
  setDither(!0);
  return out;
}
export function hubParallax(sc, H) {
  if (!H) return;
  const sx = sc.cameras.main.scrollX;
  for (const l of H.layers) l.tilePositionX = sx * l.getData("f");
  for (const t of H.floor ?? []) t.tilePositionX = sx * t.getData("f");
}
