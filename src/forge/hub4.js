// 거점 「갈림길 요새」 — 네 갈래 출구가 모이는 요새 마을 (처음부터 새로)
//   ◀ 서문(서쪽 지상) · ▼ 갱도 승강기(지하) · 운명의 비석 광장(가운데) · ▲ 하늘 승강장(하늘, 정박한 비행선) · ▶ 동문(동쪽 지상)
//   그림: bgart 화법(높이장 음영 · 디더링 · 대기 원근) 버퍼를 캔버스로. 원경은 시차 타일, 건물·길은 월드 그림
import * as G3 from "./bg3d.js";
import { mix, sh, hash, vn, fbm, ramp, tone, mass, ranges, fog, glint, isle, crystals, tree } from "./bgart.js";
import { tower as towerB, wall as wallB, banner, chain, glowSpot, tube } from "./bgzones.js";
import { lamp } from "./hub2.js";
import { storehouse, smithy, armorer, wizardTower, dojoHall, noticeBoard, waystone } from "./hubbuild.js";
import * as ZN from "./zones.js";

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
    for (let i = 0; i < 4; i++) isle(B, 40 + i * 160, 40 + (i % 2) * 30, 40 + (i % 3) * 14, 0x8a90a8, 0x9ac87a, { haze: 0.55, skyC: SKYC, roots: 0.5, seed: 70 + i });
    ranges(B, { n: 2, base: 236, amp: 90, col: 0x8a9ab8, col1: 0x6a7a98, skyC: SKYC, seed: 41, snow: 1, haze0: 0.72, haze1: 0.55, giant: 1.15, sharp: 0.6 });
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
// 길: 끝에서 끝까지 이어진 돌길 (빛 받는 윗변 · 줄눈 · 크기가 다른 돌) + 길가 풀
function streetCanvas(W, H) {
  return canvasOf(W, H, (B) => {
    const R5 = ramp(0x8a8478), G5 = ramp(0x5a8a42);
    for (let y = 0; y < H; y++) {
      const row = Math.floor(y / 6), off = (row * 7) % 11;
      for (let x = 0; x < W; x++) {
        const bw = 9 + Math.floor(hash(Math.floor((x + off) / 10), row, 3) * 5), bx = (x + off) % bw, by = y % 6;
        let I = 0.62 - y / (H * 2.4) + (hash(Math.floor((x + off) / bw), row, 7) - 0.5) * 0.25 + (by === 1 ? 0.12 : 0) - (bx === 0 || by === 0 ? 0.3 : 0);
        B.put(x, y, tone(R5, I, x, y));
      }
    }
    for (let x = 0; x < W; x++) for (let k = 0; k < 2 + Math.floor(hash(x, 5) * 3); k++) B.put(x, k, tone(G5, 0.8 - k * 0.2, x, k));
    for (let x = 0; x < W; x += 2) hash(x, 9) > 0.5 && B.put(x, -1 + 0, G5[0]);
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
    towerB(B, 6, h - 1, 30, 140, 0xa8a294, 0x3a5a9a, 0xffd890, { flag: col });
    towerB(B, w - 36, h - 1, 30, 140, 0xa8a294, 0x3a5a9a, 0xffd890, { flag: col });
    banner(B, ax - 24, h - 70, 14, col, { w: 10, h: 26, emblem: 0xffe8a0 }), banner(B, ax + 16, h - 70, 14, col, { w: 10, h: 26, emblem: 0xffe8a0 });
    glowSpot(B, ax, h - 30, 40, col, 60);
  }, [[90, 160, 14, col]]);
}
// ▲ 하늘 승강장: 높은 돌탑 + 옆으로 오르내리는 나무 승강 틀(밧줄) + 꼭대기에 정박한 비행선(풍선 · 곤돌라 · 밧줄)
function skyLiftArt() {
  const w = 220, h = 300;
  return P(w, h, (B) => {
    const tx = 70, tw = 40, th = 200;
    towerB(B, tx, h - 1, tw, th, 0xb0a898, 0x2a5a9a, 0xffd890, { roofK: 0.6 });
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

export function buildHub(sc, R, gy) {
  const { ot: W, xt: Hh, zt } = R;
  const ADD = zt.BlendModes.ADD;
  const tex = (key, canvas) => (sc.textures.exists(key) || sc.textures.addCanvas(key, canvas), key);
  sc.add.image(W / 2, Hh / 2, tex("h4_sky", skyCanvas(W, Hh))).setScrollFactor(0).setDepth(-100);
  const layers = [];
  const lay = (key, cv, f, y, d) => { const t = sc.add.tileSprite(W / 2, y, W, cv.height, tex(key, cv)).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d); t.setData("f", f); layers.push(t); return t; };
  lay("h4_far", farCanvas(), 0.06, gy - 70, -98);
  lay("h4_mid", midCanvas(), 0.3, gy + 6, -95);
  // 길가 안개 (원경과 마을 사이)
  const fogG = sc.add.graphics().setScrollFactor(0).setDepth(-96);
  for (let i = 0; i < 18; i++) fogG.fillStyle(0xe8f2ff, 0.014 * i).fillRect(0, gy - 110 + i * 4, W, 4);
  // 날아가는 새 떼
  for (let i = 0; i < 6; i++) {
    const b = sc.add.text(-20, 30 + i * 12, "ᵛ", { fontSize: "10px", color: "#2a3a4a" }).setScrollFactor(0.1).setDepth(-97);
    sc.tweens.add({ targets: b, x: W + 200, y: b.y - 16, duration: 28000 + i * 2500, delay: i * 2100, repeat: -1 });
  }
  const street = sc.add.image(0, gy - 2, tex("h4_street", streetCanvas(HUB_W, Hh - gy + 4))).setOrigin(0, 0).setDepth(2);
  const glow = (x, y, s, col = 0xffb050, a = 0.5) => {
    const g = sc.add.image(x, y, "vx_glow").setBlendMode(ADD).setTint(col).setAlpha(a).setScale(s / 24).setDepth(7);
    sc.tweens.add({ targets: g, alpha: a * 0.6, duration: 900 + Math.random() * 900, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  };
  const place = (key, p, x, depth = 1) => {
    sc.add.image(x, gy + 1, tex(key, p.c)).setOrigin(0.5, 1).setDepth(depth);
    const ox = x - p.w / 2, oy = gy + 1 - p.h;
    for (const [lx, ly, s, col] of p.lights ?? []) glow(ox + lx, oy + ly, s * 1.6, col ?? 0xffb050, 0.45);
    return { ox, oy, w: p.w, h: p.h };
  };
  const out = { facilities: [], layers, street };
  for (const f of FAC()) {
    const p = f.art();
    const { ox, oy } = place("h4_" + f.id, p, f.x, f.exit ? 1.2 : 1);
    if (f.id === "forge") sc.add.particles(ox + 159, oy + 2, "hub_smoke", { speedY: { min: -26, max: -12 }, speedX: { min: 4, max: 12 }, lifespan: 3200, frequency: 260, alpha: { start: 0.55, end: 0 }, scale: { start: 0.6, end: 1.8 } }).setDepth(0);
    if (f.id === "destiny") sc.add.particles(f.x, oy + 110, "vx_px", { x: { min: -22, max: 22 }, y: { min: -60, max: 40 }, speedY: { min: -30, max: -12 }, lifespan: 1800, frequency: 120, tint: [0xffd060, 0xfff0b0], blendMode: ADD }).setDepth(8);
    if (f.exit === "D") sc.add.particles(f.x, gy - 8, "vx_px", { x: { min: -18, max: 18 }, speedY: { min: -40, max: -16 }, lifespan: 1400, frequency: 90, tint: [0xff8040, 0xffc060], blendMode: ADD }).setDepth(8);
    if (f.exit === "U") {
      // 비행선이 천천히 오르내린다 (그림 위에 빛만 흔들어 살아 있게) + 위로 날리는 바람결
      sc.add.particles(f.x + 20, gy - 60, "vx_soft", { x: { min: -14, max: 14 }, speedY: { min: -60, max: -30 }, lifespan: 2200, frequency: 140, scale: { start: 0.25, end: 0 }, tint: [0xd8f0ff, 0xffffff], blendMode: ADD }).setDepth(8);
    }
    if (f.exit === "L" || f.exit === "R") sc.add.particles(f.x, gy - 40, "vx_soft", { x: { min: -24, max: 24 }, y: { min: -50, max: 20 }, speedY: { min: -20, max: -8 }, lifespan: 1600, frequency: 120, scale: { start: 0.28, end: 0 }, tint: [f.exit === "L" ? 0xa0ffb0 : 0xffe0a0], blendMode: ADD }).setDepth(8);
    if (f.npc) {
      const [k, dx, flip] = f.npc;
      sc.textures.exists(k) && sc.add.sprite(f.x + dx, gy + 1, k, 0).setOrigin(0.5, 1).setDepth(6).setFlipX(flip).play(`${k}_idle`);
    }
    if (f.name) {
      R.ct(sc, f.x, Math.max(oy - 8, 22), f.name, "small", f.exit ? "#bfe8ff" : "#ffe8c0", { stroke: "#14203a", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(9);
      out.facilities.push({ id: f.id, name: f.name, x: f.x, labelY: oy, dummyX: f.dummy ? f.x + f.dummy : null, exit: f.exit });
    }
  }
  for (const x of [210, 460, 730, 1000, 1250, 1560, 1820, 2060, 2310, 2530]) place("h4_lamp", lamp(), x, 3);
  return out;
}
export function hubParallax(sc, H) {
  if (!H) return;
  const sx = sc.cameras.main.scrollX;
  for (const l of H.layers) l.tilePositionX = sx * l.getData("f");
}
