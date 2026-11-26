// 레퍼런스 화풍(docs/reference/maps) 거점 부품 — 평면 2~3단 음영 · 강한 대기 원근 · 땅 단면 + 물 전경
//   천막(붉은 물결 장식) · 랜턴 기둥 · 거대 활엽수 · 마른 고목 · 침엽수 띠 · 언덕 위 성 · 흙 단면 · 물 · 갈대·부들·연잎 · 말뚝 울타리
import * as G3 from "./bg3d.js";
import { mix, sh, hash, vn, fbm, ramp, tone, mass } from "./bgart.js";
import { tube, glowSpot } from "./bgzones.js";

export const art = (w, h, fn) => { const B = G3.buffer(w, h, !1), lights = []; fn(B, lights); return { c: B.toCanvas(), w, h, lights }; };
export const canvasOf = (w, h, fn) => { const B = G3.buffer(w, h, !1); fn(B); return B.toCanvas(); };
// 3단 평면 음영 (밝은 면 · 몸 · 그늘)
const F3 = (c) => [sh(c, 0.18), c, sh(c, -0.28)];

// ── 하늘: 높은 하늘색 → 밝은 지평선, 해 빛무리(노란 링 + 넓은 흰 번짐), 큰 뭉게구름(위 밝고 아래 어두운 평면 단) ──
export function skyRef(W, H, sun = [470, 70]) {
  return canvasOf(W, H, (B) => {
    for (let y = 0; y < H; y++) { const t = y / (H - 1), c = t < 0.6 ? mix(0x4a8ad0, 0x9cc8e8, t / 0.6) : mix(0x9cc8e8, 0xe8eedc, (t - 0.6) / 0.4); for (let x = 0; x < W; x++) B.put(x, y, c); }
    const [sx, sy] = sun;
    glowSpot(B, sx, sy, 160, 0xfff4d0, 70), glowSpot(B, sx, sy, 70, 0xffffff, 110);
    for (let a = 0; a < 360; a += 1) { const t = (a * Math.PI) / 180; for (let q = 0; q < 3; q++) B.put(sx + Math.cos(t) * (26 + q), sy + Math.sin(t) * (26 + q), 0xfff0a0, 170); }
    for (let j = -20; j <= 20; j++) for (let i = -20; i <= 20; i++) i * i + j * j < 400 && B.put(sx + i, sy + j, i * i + j * j < 300 ? 0xffffff : 0xfff8d8);
    const cloud = (cx, cy, s) => {
      const blobs = [];
      for (let k = 0; k < 7; k++) blobs.push([cx + (k - 3) * 14 * s + (hash(k, cx) - 0.5) * 8 * s, cy - Math.sin((k / 6) * Math.PI) * 12 * s - hash(cx, k) * 6 * s, (9 + Math.sin((k / 6) * Math.PI) * 8) * s]);
      for (let y = cy - 34 * s; y < cy + 8 * s; y++) for (let x = cx - 60 * s; x < cx + 60 * s; x++) {
        let inside = 0, top = 1e9;
        for (const [bx, by, r] of blobs) { const d = (x - bx) ** 2 + (y - by) ** 2; d < r * r && ((inside = 1), (top = Math.min(top, by - r))); }
        if (!inside || y > cy + 6 * s) continue;
        const lv = y < top + 5 * s ? 0xffffff : y > cy ? 0xb8c8d8 : 0xe4ecf4;
        B.put(Math.round(x), Math.round(y), lv);
      }
    };
    for (const [x, y, s] of [[90, 60, 1.1], [250, 40, 0.8], [600, 90, 1.3], [330, 120, 0.7], [520, 30, 0.6]]) cloud(x, y, s);
  });
}
// ── 먼 언덕 + 언덕 위 성 (낮은 대비 · 하늘에 많이 묻힘) ──
export function hillsRef(skyC) {
  return canvasOf(640, 200, (B) => {
    const back = (x) => 120 - 40 * Math.exp(-(((x - 430) / 110) ** 2)) - (vn(x, 0, 90, 3) - 0.5) * 30;
    for (let x = 0; x < 640; x++) for (let y = Math.round(back(x)); y < 200; y++) B.put(x, y, mix(F3(0x7a8a6a)[x > 430 ? 2 : (y - back(x)) < 4 ? 0 : 1], skyC, 0.55));
    // 바위 벼랑과 성 (ref01: 언덕 위 탑)
    for (let x = 380; x < 500; x++) { const top = back(x) - 6; for (let y = Math.round(top); y < top + 30; y++) B.put(x, y, mix(F3(0x8a8a80)[x < 430 ? 0 : x < 470 ? 1 : 2], skyC, 0.45)); }
    const tw = (x, w, h, roof) => { const g = back(x + w / 2) - 6; for (let y = g - h; y < g; y++) for (let i = 0; i < w; i++) B.put(x + i, y, mix(F3(0x8a7a6a)[i < w * 0.35 ? 0 : i < w * 0.75 ? 1 : 2], skyC, 0.42)); for (let j = 0; j < roof; j++) { const half = (w / 2 + 2) * (j / roof); for (let i = -half; i <= half; i++) B.put(x + w / 2 + i, g - h - roof + j, mix(i < 0 ? 0x5a4a44 : 0x3e3434, skyC, 0.42)); } for (let y = g - h + 6; y < g - 4; y += 9) B.put(x + w / 2, y, mix(0x2a2422, skyC, 0.4)); };
    tw(400, 16, 40, 12), tw(422, 22, 72, 0), tw(450, 14, 48, 10), tw(468, 12, 30, 8);
    for (let i = 396; i < 484; i++) for (let j = 0; j < 14; j++) B.put(i, back(440) - 6 - j, mix(F3(0x8a7a6a)[1], skyC, 0.44));
    for (let i = 422; i < 444; i += 4) for (let j = 0; j < 4; j++) B.put(i, back(433) - 84 - j, mix(0x8a7a6a, skyC, 0.42));
    const front = (x) => 160 - (vn(x, 1, 70, 8)) * 26;
    for (let x = 0; x < 640; x++) for (let y = Math.round(front(x)); y < 200; y++) B.put(x, y, mix(F3(0x6a7a52)[(y - front(x)) < 3 ? 0 : 1], skyC, 0.42));
  });
}
// ── 침엽수 띠: 빽빽한 뾰족 나무 실루엣 (한 색조 · 명도 2~3단) ──
export function pinesRef(skyC, haze, seed = 1, H = 150, dark = 0x2e4a32) {
  return canvasOf(640, H, (B) => {
    const F = F3(dark);
    for (let k = 0; k < 90; k++) {
      const x = Math.floor(hash(k, seed) * 660) - 10, h = 50 + hash(seed, k) * (H - 60), w = h * (0.32 + hash(k, 3, seed) * 0.12), base = H - hash(k, 4, seed) * 14;
      for (let j = 0; j < h; j++) {
        const t = j / h, tier = (t * 6) % 1, half = w / 2 * t * (0.75 + tier * 0.35);
        for (let i = -half; i <= half; i++) B.put(x + i, base - h + j, mix(F[i < -half * 0.3 ? 0 : i < half * 0.4 ? 1 : 2], skyC, haze));
      }
    }
    for (let y = H - 10; y < H; y++) for (let x = 0; x < 640; x++) B.put(x, y, mix(F[2], skyC, haze));
  });
}
// ── 거대 활엽수 (ref02·07): 줄기 + 큰 둥근 잎 뭉치마다 밝은 윗면 · 몸 · 어두운 아랫면 ──
export function bigTree(seed = 1, s = 1, leaf = 0x5a7a34) {
  const w = Math.round(220 * s), h = Math.round(300 * s);
  return art(w, h, (B) => {
    const cx = w / 2, g = h - 1, F = F3(leaf), T3 = F3(0x5a3e28);
    for (let y = g; y > g - h * 0.55; y--) { const t = (g - y) / (h * 0.55), half = (10 + (1 - t) ** 3 * 14) * s, bx = cx + Math.sin(t * 2.4 + seed) * 6 * s; for (let i = -half; i <= half; i++) B.put(bx + i, y, T3[i < -half * 0.3 ? 0 : i < half * 0.4 ? 1 : 2]); }
    for (let k = 0; k < 3; k++) tube(B, [[cx, g - h * (0.35 + k * 0.08)], [cx + (k % 2 ? 1 : -1) * 50 * s, g - h * (0.5 + k * 0.08)]], 4 * s, 2 * s, 0x5a3e28, { warp: 0, seed: k });
    const F4 = [sh(leaf, 0.22), leaf, sh(leaf, -0.28), sh(leaf, -0.5)], clumps = [];
    for (let k = 0; k < 30; k++) clumps.push([cx + (hash(k, seed) - 0.5) * w * 0.86, g - h * (0.46 + hash(seed, k) * 0.48), (16 + hash(k, 3, seed) * 20) * s]);
    clumps.sort((a, b) => b[1] - a[1]);
    for (const [x, y, r] of clumps) for (let j = -r; j <= r; j++) for (let i = -r * 1.2; i <= r * 1.2; i++) {
      const d = (i / 1.2) ** 2 + j * j, edge = r * r * (0.82 + 0.3 * vn(x + i, y + j, 5, seed));
      if (d > edge) continue;
      const lit = -(i * 0.45 + j) / r - (y - (g - h)) / h * 0.4;
      B.put(x + i, y + j, d > edge * 0.86 && lit < 0 ? F4[3] : F4[lit > 0.45 ? 0 : lit > -0.1 ? 1 : lit > -0.6 ? 2 : 3]);
    }
  });
}
// 마른 고목 (ref07): 갈라지며 가늘어지는 회갈색 가지
export function deadTree(seed = 1, s = 1) {
  const w = Math.round(200 * s), h = Math.round(260 * s);
  return art(w, h, (B) => {
    const limb = (x, y, a, L, r, d) => { const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; tube(B, [[x, y], [(x + x2) / 2 + Math.sin(a) * 6, (y + y2) / 2], [x2, y2]], r, Math.max(0.6, r * 0.55), 0x7a6a5a, { warp: 0, seed: d * 7 + Math.round(x) }); if (d > 0) { limb(x2, y2, a - 0.5 - hash(d, x | 0) * 0.3, L * 0.62, r * 0.6, d - 1); limb(x2, y2, a + 0.45 + hash(x | 0, d) * 0.3, L * 0.58, r * 0.55, d - 1); } };
    limb(w / 2, h - 1, -Math.PI / 2 + 0.08, h * 0.38, 9 * s, 4);
  });
}
// 천막 (ref07): 큰 천 지붕 · 붉은 물결 장식 띠 · 어두운 입구 · 버팀줄 · 깃발
export function tent(w = 150, h = 120, trim = 0xb02a22, cloth = 0xe4d8b8) {
  return art(w + 40, h + 30, (B) => {
    const cx = (w + 40) / 2, g = h + 29, top = g - h, eaveY = g - h * 0.45, C = F3(cloth), T = F3(trim);
    for (let y = top; y < eaveY; y++) { const t = (y - top) / (eaveY - top), half = 10 + t * (w / 2 + 6); for (let i = -half; i <= half; i++) B.put(cx + i, y, C[i < -half * 0.45 ? 0 : i < half * 0.35 ? 1 : 2]); }
    for (let y = eaveY; y < g; y++) for (let i = -w / 2; i <= w / 2; i++) { const fold = Math.floor((i + w / 2) / 14) % 2; B.put(cx + i, y, Math.abs(i) < w * 0.12 ? (y > eaveY + 10 ? 0x1a1410 : C[2]) : C[fold ? 1 : 2]); }
    for (let i = -w / 2 - 6; i <= w / 2 + 6; i++) { const sc = Math.round(Math.abs(Math.sin(((i + w) / 10) * Math.PI)) * 5); for (let j = 0; j < 6 + sc; j++) B.put(cx + i, eaveY - 2 + j, T[j < 2 ? 0 : 1]); }
    for (const d of [-1, 1]) for (let k = 0; k < 30; k++) B.put(cx + d * (w / 2 + 6 + k * 0.6), eaveY + 2 + k, 0x8a7a5a);
    for (let j = 0; j < 22; j++) B.put(cx, top - j, 0x4a3020);
    for (let j = 0; j < 7; j++) for (let i = 1; i < 14 - j; i++) B.put(cx + i, top - 22 + j, T[i < 5 ? 0 : 1]);
  });
}
// T자 랜턴 기둥 (ref05)
export function lanternPost() {
  return art(30, 70, (B, L) => {
    for (let y = 8; y < 70; y++) for (let i = 0; i < 4; i++) B.put(12 + i, y, F3(0x5a3e28)[i < 1 ? 0 : i < 3 ? 1 : 2]);
    for (let x = 4; x < 26; x++) for (let j = 0; j < 3; j++) B.put(x, 8 + j, F3(0x5a3e28)[j]);
    for (let j = 0; j < 4; j++) B.put(22, 11 + j, 0x2a2a2a);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 7; i++) B.put(19 + i, 15 + j, j === 0 || j === 8 || i === 0 || i === 6 ? 0x2a2a2a : 0xffc860);
    L.push([22, 19, 16, 0xffb050]);
  });
}
// 말뚝 울타리 (ref02): 끝이 뾰족한 통나무 줄
export function palisade(w = 120) {
  return art(w, 70, (B) => {
    for (let x = 0; x < w; x += 9) { const h = 52 + hash(x, 2) * 14, F = F3(0x9a6a3a); for (let y = 69; y > 69 - h; y--) for (let i = 0; i < 8; i++) { const tip = 69 - h + 8 - y; if (tip > 0 && Math.abs(i - 3.5) > (8 - tip) / 2) continue; B.put(x + i, y, F[i < 2 ? 0 : i < 6 ? 1 : 2]); } for (let i = 0; i < 9; i++) (B.put(x + i, 30, 0x4a3020), B.put(x + i, 54, 0x4a3020)); }
  });
}
// ── 땅 단면 (풀 가장자리 + 흙 + 돌·뼈·해골·뿌리) — 이어지는 타일 ──
export function soilStrip(W, H = 24) {
  return canvasOf(W, H, (B) => {
    const G = F3(0x4e7a36), S = F3(0x4a3424);
    for (let x = 0; x < W; x++) {
      const gl = 4 + Math.round(vn(x, 0, 9, 3) * 3);
      for (let y = 0; y < H; y++) B.put(x, y, y < gl ? G[y < 2 ? 0 : 1] : y < gl + 2 ? G[2] : S[(y + Math.round(vn(x, y, 7, 5) * 3)) % 9 < 1 ? 0 : (x * 7 + y) % 13 < 1 ? 2 : 1]);
      hash(x, 5) > 0.55 && [1, 2, 3].slice(0, 1 + Math.floor(hash(x, 6) * 3)).forEach((k) => B.put(x, -k + 1, G[k === 1 ? 1 : 0]));
    }
    for (let k = 0; k < W / 26; k++) { const x = Math.floor(hash(k, 7) * W), y = 10 + Math.floor(hash(k, 8) * (H - 13)), t = k % 6; if (t < 3) mass(B, x - 3, y - 2, 7, 5, (X, Y) => (X - x) ** 2 + (Y - y) ** 2 * 1.6 < 8, { col: 0x8a8478, round: 1.5, warp: 0 }); else if (t === 3) { for (let i = 0; i < 9; i++) B.put(x + i, y, 0xd8d0c0); for (let i = 1; i < 8; i += 2) (B.put(x + i, y - 1, 0xc8c0b0), B.put(x + i, y + 1, 0xc8c0b0)); } else if (t === 4) { for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) B.put(x + i, y + j, j === 1 && (i === 1 || i === 3) ? 0x2a2018 : 0xe0d8c8); } else for (let i = 0; i < 12; i++) B.put(x + i, y + Math.round(Math.sin(i * 0.6) * 1.5), 0x6a4a30); }
  });
}
// ── 물 (검고 잔잔한 늪) — 물결 줄 · 연잎 (이어지는 타일, 반사는 따로 겹친다) ──
export function waterStrip(W, H) {
  return canvasOf(W, H, (B) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) B.put(x, y, mix(0x24323a, 0x10181c, y / H));
    for (let k = 0; k < W / 3; k++) { const x = Math.floor(hash(k, 9) * W), y = Math.floor(hash(k, 10) * H), L = 4 + Math.floor(hash(k, 11) * 14); for (let i = 0; i < L; i++) B.put(x + i, y, 0x4a6a74, 110); }
    for (let k = 0; k < W / 70; k++) { const x = Math.floor(hash(k, 12) * W), y = 8 + Math.floor(hash(k, 13) * (H - 16)); for (let j = -2; j <= 2; j++) for (let i = -5; i <= 5; i++) (i * i) / 25 + (j * j) / 5 < 1 && !(i > 0 && Math.abs(j) < 1) && B.put(x + i, y + j, j < 0 ? 0x5a8a3a : 0x3e6a2a); }
  });
}
// 갈대·부들·수초 (가장 앞, 가장 빠른 시차)
export function reedsStrip(W, H) {
  return canvasOf(W, H, (B) => {
    for (let x = 0; x < W; x += 2) {
      if (hash(x, 14) < 0.62) continue;
      const L = 8 + Math.floor(hash(x, 15) * (H - 10)), lean = (hash(x, 16) - 0.5) * 0.25, cat = hash(x, 17) > 0.8;
      for (let k = 0; k < L; k++) B.put(x + lean * k, H - 1 - k, k > L - 6 && cat ? (hash(x, 18) > 0.5 ? 0xd8b040 : 0x7a4a2a) : k % 3 ? 0x3e6a2e : 0x5a8a3e);
    }
    for (let k = 0; k < W / 40; k++) { const x = Math.floor(hash(k, 19) * W), y = H - 4 - Math.floor(hash(k, 20) * 10), c = [0xffffff, 0xf0d040, 0xb090f0][k % 3]; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) Math.abs(i) + Math.abs(j) < 2 && B.put(x + i, y + j, c); B.put(x, y, 0xf0d040); }
  });
}
