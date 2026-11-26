// 새로 지은 파랑·노랑 구역 20곳 전용 배경 (원경 0 · 중경 1 · 근경 2) — bgart.js 화법(높이장 입체 음영 · 디더링 · 대기 원근)
//   하늘(pal.sky)은 paintSky3d가 칠하고, 여기서는 그 위 세 층. 버퍼 640 × 600, 화면에 보이는 땅 띠는 대략 y 300~400
//   하늘 구역: 먼 산·섬 → 중간 섬과 구름 바다 → 가까운 구름 둑 / 지상 구역: 산 → 언덕 → 땅 / 지하: 암벽 → 기둥·종유석 → 바닥
import * as G from "./bg3d.js";
import { mix, sh, hash, vn, fbm, ramp, tone, mass, land, ranges, fog, rays, glint, crystal, tree, isle, water, caveRanges, crystals } from "./bgart.js";
const W = 640;

// ══ 공용 소품 ══
function clouds(B, E, R, seed, n, y0, y1, s0 = 0.7, s1 = 1.4, a = 235, tint) {
  const sk = E.sky[1], light = tint ? mix(tint, 0xffffff, 0.7) : mix(sk, 0xffffff, 0.86), shade = tint ? mix(tint, E.sky[0], 0.35) : mix(E.sky[0], sk, 0.6);
  for (let i = 0; i < n; i++) {
    const x = R(0, W), y = R(y0, y1), s = s0 + (R(0, 100) / 100) * (s1 - s0);
    for (const dx of [-W, 0, W]) G.cloud(B, x + dx, y, s, light, shade, a, seed + i);
  }
}
function cirrus(B, R, seed, col, n, ymax) {
  for (let i = 0; i < n; i++) {
    const x = R(0, W), y = R(10, ymax), L = R(60, 180);
    for (let k = 0; k < L; k++) B.put(x + k, y + Math.round(Math.sin(k * 0.03 + i) * 2), col, Math.round(120 * Math.sin((k / L) * Math.PI)));
  }
}
// 구름 바다: 뭉게구름(bg3d)을 줄지어 붙이고 그 밑을 부드러운 구름 몸통으로 채운다
//   o.tint: 다 그린 뒤 밝기만 남기고 그 색 램프로 다시 입힌다 (잿빛 구름 · 분홍 포자 구름 …)
function cloudSea(B, base, amp, col, seed, o = {}) {
  const T = G.buffer(W, B.h), gray = !!o.tint, light = gray ? 0xe4e4e4 : mix(col, 0xffffff, 0.35), shade = gray ? 0x7a7a7a : mix(col, o.shade ?? 0x8890b8, 0.55), deep = gray ? 0x5a5a5a : mix(col, o.shade ?? 0x8890b8, 0.85);
  gray && (col = 0xc4c4c4);
  for (let y = Math.round(base); y < B.h; y++) {
    const t = Math.min(1, (y - base) / 90);
    for (let x = 0; x < W; x++) { const n = vn(x, y * 2, 40, seed + 4) * 0.25; T.put(x, y, t + n * 0.6 > 0.95 ? deep : t + n > 0.45 ? shade : col); }
  }
  for (let k = 0, x = -30; x < W + 30; k++, x += 26 + hash(k, seed) * 34) {
    const sc = (o.s ?? 0.9) + hash(seed, k) * (o.s1 ?? 0.7), y = base + 6 - hash(k, seed, 2) * amp;
    for (const dx of [-W, 0, W]) G.cloud(T, x + dx, y, sc, light, shade, 255, seed + k);
  }
  const TR = o.tint ? ramp(o.tint, o.tintHi ?? mix(o.tint, 0xffffff, 0.6), o.tintLo ?? mix(o.tint, 0x000000, 0.6)) : null;
  for (let y = 0; y < B.h; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!T.al[i]) continue;
    let c = T.col[i];
    if (TR) { const L = (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.55 + (c & 255) * 0.15) / 255; c = tone(TR, Math.max(0, Math.min(1, (L - 0.3) / 0.62)), x, y); }
    B.put(x, y, o.haze ? mix(c, o.skyC, o.haze) : c);
  }
}
// 지평선: 산 뒤로 낮게 깔린 먼 뭉게구름 띠 (옅게) + 해 빛무리
function horizon(B, E, R, seed, o = {}) {
  const sk = E.sky[1], y = (o.y ?? 262) - 70, light = mix(sk, 0xffffff, o.lk ?? 0.55), shade = mix(E.sky[0], sk, 0.72);
  if (o.sun) { glowSpot(B, o.sun[0], o.sun[1], 130, 0xffffff, 50), glowSpot(B, o.sun[0], o.sun[1], 34, 0xfffff4, 150), glowSpot(B, o.sun[0], o.sun[1], 12, 0xffffff, 255); }
  if (o.a !== 0) for (let k = 0, x = -30; x < W + 30; k++, x += 50 + hash(k, seed) * 90) {
    if (hash(k, seed, 7) < 0.3) continue;
    const sc = 0.35 + hash(seed, k) * 0.45, yy = y - hash(k, seed, 3) * 50;
    for (const dx of [-W, 0, W]) G.cloud(B, x + dx, yy, sc, light, shade, o.a ?? 95, seed + 50 + k);
  }
}
// 봉우리 밑을 감싸는 구름 둑 (봉우리가 구름을 뚫고 솟아 보이게)
function cloudBank(B, E, y, seed, o = {}) {
  const sk = E.sky[1], light = o.light ?? mix(sk, 0xffffff, 0.7), shade = o.shade ?? mix(E.sky[0], sk, 0.6);
  fog(B, y + 8, 22, mix(sk, 0xffffff, 0.35), o.fogA ?? 200, seed + 1, 70);
  for (let k = 0, x = -40; x < W + 40; k++, x += 18 + hash(k, seed) * 30) {
    const sc = 0.55 + hash(seed, k) * 0.7, yy = y + 6 - hash(k, seed, 3) * 18;
    for (const dx of [-W, 0, W]) G.cloud(B, x + dx, yy, sc, light, shade, o.a ?? 235, seed + 90 + k);
  }
  for (let yy = y + 10; yy < y + 60; yy++) for (let x = 0; x < W; x++) B.put(x, yy, mix(light, shade, (yy - y - 10) / 80), 255);
}
// 해에서 비스듬히 내려오는 굵은 빛살 (부채꼴)
function sunRays(B, sx, sy, n, col, a, seed) {
  for (let k = 0; k < n; k++) {
    const ang = Math.PI * (0.58 + (k / Math.max(1, n - 1)) * 0.3) + (hash(k, seed) - 0.5) * 0.06, wd = 0.025 + hash(seed, k) * 0.03;
    for (let r = 20; r < 520; r += 1) {
      const hw = r * wd, cx = sx + Math.cos(ang) * r, cy = sy + Math.sin(ang) * r, al = a * (1 - r / 520);
      for (let i = -hw; i <= hw; i++) B.put(cx - Math.sin(ang) * i, cy + Math.cos(ang) * i, col, Math.round(al * (1 - Math.abs(i) / (hw + 1))));
    }
  }
}
// 새 떼 (크기 비교 — 풍경이 커 보이게)
function birds(B, R, n, x0, y0, col) {
  for (let i = 0; i < n; i++) {
    const x = x0 + R(-60, 60), y = y0 + R(-25, 25), w = R(2, 4);
    for (let k = 0; k <= w; k++) B.put(x - k, y - (w - k) * 0.6, col), B.put(x + k, y - (w - k) * 0.6, col);
  }
}
// 가늘게 솟은 바위 첨탑 (끝이 뾰족, 옆면 요철)
function spire(B, x, gy, w, h, col, o = {}) {
  const sd = o.seed ?? x | 0;
  mass(B, x - w, gy - h, w * 2, h + 2, (X, Y) => { const t = (gy - Y) / h, half = (w / 2) * Math.pow(Math.max(0, 1 - t), o.pow ?? 0.7) * (0.85 + 0.3 * vn(Y, 0, 9, sd)); return Math.abs(X - x - (o.lean ?? 0) * (gy - Y)) < half; }, { col, round: w * 0.35, bump: 0.6, sc: 6, strata: o.strata ?? 0, haze: o.haze, skyC: o.skyC, seed: sd, glow: o.glow });
}
// 관 (뿌리·뼈 몸통): 점 목록을 따라 굵기가 r0→r1로 줄어드는 둥근 관
export function tube(B, pts, r0, r1, col, o = {}) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  const r = Math.max(r0, r1) + 2, n = pts.length - 1;
  mass(B, x0 - r, y0 - r, x1 - x0 + 2 * r, y1 - y0 + 2 * r, (X, Y) => {
    for (let k = 0; k < n; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((X - ax) * dx + (Y - ay) * dy) / L2)), d = Math.hypot(X - ax - dx * t, Y - ay - dy * t);
      if (d < r0 + (r1 - r0) * ((k + t) / n)) return true;
    }
    return false;
  }, { col, round: Math.max(2, r0 * 0.9), bump: o.bump ?? 0.4, sc: o.sc ?? 4, haze: o.haze, skyC: o.skyC, seed: o.seed ?? 3, rim: o.rim, glow: o.glow });
}
// 늘어진 뿌리 (위에서 아래로 흔들리며 가늘어진다)
function rootDown(B, x, y, L, r, col, seed, o = {}) {
  const pts = [];
  for (let k = 0; k <= 12; k++) pts.push([x + Math.sin(k * 0.7 + seed) * (3 + k * 0.6) + (vn(k, seed, 3, 5) - 0.5) * 6, y + (L * k) / 12]);
  tube(B, pts, r, 0.6, col, { ...o, seed });
}
// 버섯: 휘어진 대(밑동 퍼짐 · 턱받이 · 선반 버섯) + 한쪽으로 기운 갓(물결 테두리) + 갓 밑 주름 + 점박이 + 갓 밑 빛
function mush(B, cx, gy, cw, h, cap, stem, o = {}) {
  const sd = (o.seed ?? 0) * 31 + (cx | 0), sw = Math.max(3, cw * 0.13), bend = (Y) => Math.sin(((gy - Y) / h) * 2.3 + (o.seed ?? 0)) * cw * 0.07, hz = o.haze ?? 0, skyC = o.skyC ?? 0;
  mass(B, cx - cw * 0.4, gy - h - 2, cw * 0.8, h + 4, (X, Y) => Math.abs(X - cx - bend(Y)) < (sw / 2) * (1 + Math.pow(Math.max(0, (Y - (gy - h * 0.22)) / (h * 0.22)), 2) * 1.1), { col: stem, round: sw * 0.5, bump: 0.25, sc: 5, grooves: 0.9, haze: hz, skyC, seed: sd });
  const ry = gy - h * 0.82;
  mass(B, cx + bend(ry) - sw * 1.1, ry - 2, sw * 2.2, 6, (X, Y) => Math.abs(X - cx - bend(ry)) < sw * (0.55 + (Y - ry + 2) * 0.1) && Y < ry + 2 + Math.sin(X * 0.9) * 0.8, { col: sh(stem, 0.08), round: 2, haze: hz, skyC, seed: sd + 1 });
  for (let k = 0; k < (cw > 40 ? 3 : 0); k++) {
    const fy = gy - h * (0.25 + hash(sd, k) * 0.45), dir = k % 2 ? 1 : -1, fx = cx + bend(fy) + dir * sw * 0.45, fw = 4 + hash(k, sd) * cw * 0.08;
    mass(B, fx - fw - 1, fy - fw * 0.5 - 1, fw * 2 + 2, fw * 0.8 + 2, (X, Y) => ((X - fx - dir * fw * 0.5) / fw) ** 2 + ((Y - fy) / (fw * 0.4)) ** 2 < 1 && Y <= fy + 1, { col: mix(cap, stem, 0.5), round: 2, haze: hz, skyC, seed: sd + k + 5 });
  }
  const ch = cw * (0.34 + hash(sd, 3) * 0.12), skew = (hash(sd, 4) - 0.5) * cw * 0.18, cy = gy - h + bend(gy - h);
  if (o.glow) for (let j = 0; j < ch * 1.3; j++) for (let i = -cw * 0.55; i < cw * 0.55; i++) { const dd = (i / (cw * 0.55)) ** 2 + (j / (ch * 1.3)) ** 2; dd < 1 && B.put(cx + i, cy + j, o.glow, Math.round(70 * (1 - dd))); }
  const lip = (X) => cy + 2 + (Math.abs(X - cx) / (cw / 2)) * ch * 0.3 + Math.sin(X * 0.45 + sd) * 1.4;
  const capTop = (X) => { const u = (X - cx - skew * 0.5) / (cw / 2); return cy - ch * Math.sqrt(Math.max(0, 1 - u * u)) * (1 + (u < 0 ? 0.08 : -0.05)); };
  mass(B, cx - cw / 2 - 3, cy - ch * 1.2 - 2, cw + 6, ch * 1.6 + 6, (X, Y) => Math.abs(X - cx) < cw / 2 + Math.sin(Y + X * 0.3) * 0.6 && Y >= capTop(X) && Y < lip(X), { col: cap, round: ch * 0.8, bump: 0.12, sc: 9, haze: hz, skyC, seed: sd + 2 });
  for (let i = -cw / 2 + 3; i < cw / 2 - 3; i += 2) { const L = 2 + Math.floor(hash(i | 0, sd) * 2); for (let j = 0; j < L; j++) B.put(cx + i + (i * j) / cw, lip(cx + i) + j - 1, mix(sh(stem, -0.35 - j * 0.1), skyC, hz)); }
  if (o.spots) for (let k = 0; k < cw / 5; k++) {
    const a = 0.25 + hash(k, sd) * (Math.PI - 0.5), r = 0.25 + hash(sd, k) * 0.65, sx = cx + Math.cos(a) * (cw / 2) * r, sy = cy - Math.sin(a) * ch * r * 0.95, sr = 0.8 + hash(k, 7, sd) * cw * 0.05, sq = 0.6 + hash(k, 8) * 0.4;
    for (let j = -sr; j <= sr; j++) for (let i = -sr; i <= sr; i++) (i * i) / (sr * sr) + (j * j) / (sr * sr * sq * sq) <= 1 && B.put(sx + i, sy + j, mix(j < 0 ? sh(o.spots, 0.2) : o.spots, skyC, hz));
  }
}
// 탑: 크기가 다른 돌 블록(원기둥 음영) + 띠 돌 + 받침 + 처마가 나온 오목 지붕(비늘 기와 · 꼭대기 장식) + 돌테 아치 창 + 밑동 이끼
export function tower(B, x, gy, w, h, col, roof, win, o = {}) {
  const R = ramp(col), RR = ramp(roof), hz = o.haze ?? 0, skyC = o.skyC ?? 0, P = (X, Y, c, a) => B.put(X, Y, hz ? mix(c, skyC, hz) : c, a), sd = (x * 13 + h) | 0;
  let rowY = 0, row = 0;
  while (rowY < h) {
    const rh = 3 + Math.floor(hash(row, sd) * 3);
    let bx = -Math.floor(hash(sd, row) * 6), blk = 0;
    while (bx < w) {
      const bw = 4 + Math.floor(hash(row, blk, sd) * 6), shift = (hash(blk, row, sd) - 0.5) * 0.22;
      for (let j = 0; j < rh && rowY + j < h; j++) for (let i = Math.max(0, bx); i < Math.min(w, bx + bw); i++) {
        const u = i / (w - 1), mortar = j === 0 || i === bx;
        let I = 0.86 - Math.pow(u, 0.9) * 0.78 + shift + (j === 1 ? 0.06 : 0) - (mortar ? 0.2 : 0);
        const band = (rowY + j) % 22 < 2, plinth = rowY + j < 6;
        band && (I += 0.12);
        const X = x + i - (band || plinth ? 1 : 0) * (i === 0 ? 1 : 0), Y = gy - rowY - j;
        let c = i === 0 || i === w - 1 ? R[5] : tone(R, I, X, Y);
        (rowY + j < 10 && hash(i, rowY + j, sd) < 0.35 - (rowY + j) * 0.03) && (c = mix(c, 0x5a8a3a, 0.6));
        P(X, Y, c);
      }
      bx += bw, blk++;
    }
    rowY += rh, row++;
  }
  for (let j = 0; j < 6; j++) (P(x - 1, gy - j, R[4]), P(x + w, gy - j, R[5]));
  const rh = Math.round(w * (o.roofK ?? 1.4)), eave = 3, rw = w + eave * 2;
  for (let j = 0; j < rh; j++) {
    const t = j / rh, half = (rw / 2) * Math.pow(t, 1.5);
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const u = (i + half) / Math.max(1, 2 * half), scale = (Math.floor((i + 50) / 3) + Math.floor(j / 3)) % 2;
      let I = 0.92 - u * 0.85 - (j % 3 === 2 ? 0.14 : 0) + (scale ? 0.04 : 0);
      P(x + w / 2 + i, gy - h - rh + j, Math.abs(i) >= Math.ceil(half) ? RR[5] : tone(RR, I, x + i, j));
    }
  }
  for (let i = -eave; i < w + eave; i++) P(x + i, gy - h, R[5], 200), P(x + i, gy - h + 1, R[4], 140);
  const fx = Math.round(x + w / 2), fy = gy - h - rh;
  for (let j = 0; j < 4; j++) P(fx, fy - j, j === 3 ? 0xffe090 : RR[1]);
  if (o.flag) {
    for (let j = 0; j < 12; j++) P(fx, fy - j, 0x3a2a20);
    for (let j = 0; j < 5; j++) for (let i = 1; i < 10 - j * 0.6; i++) P(fx + i, fy - 12 + j + Math.round(Math.sin(i * 0.8 + j * 0.2) * 0.8), tone(ramp(o.flag), 0.72 - i * 0.03 + (j === 0 ? 0.1 : 0), fx + i, j));
  }
  if (win) for (let yy = gy - h + 10, k = 0; yy < gy - 10; yy += 13 + (k % 2) * 4, k++) {
    const wx = Math.round(x + w * (k % 2 ? 0.55 : 0.3)), lit = hash(k, sd) > 0.2;
    for (let j = -2; j < 9; j++) for (let i = -2; i < 5; i++) {
      const inArch = (i >= 0 && i < 3 && j >= 0 && j < 7 && !(j === 0 && i !== 1)), frame = !inArch && i >= -1 && i < 4 && j >= -1 && j < 8 && !(j === -1 && (i === -1 || i === 3));
      inArch ? P(wx + i, yy + j, lit ? (j < 2 ? sh(win, 0.4) : win) : 0x1a1418) : frame && P(wx + i, yy + j, R[1]);
    }
    lit && glowSpotA(B, wx + 1, yy + 4, 7, win, 40);
  }
  if (o.vine) for (let k = 0; k < 2; k++) { let vx = x + 2 + hash(k, sd) * (w - 4); for (let j = 0; j < h * 0.6; j++) { vx += (hash(j, k, sd) - 0.5) * 1.2; P(vx, gy - j, j % 3 ? 0x4a7a32 : 0x6aa048); } }
}
function glowSpotA(B, x, y, r, c, a) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j) / r; d < 1 && B.put(x + i, y + j, c, Math.round(a * (1 - d))); } }
// 성벽: 크기가 다른 돌(빛 방향 음영) + 군데군데 빠진 톱니 + 밑동 이끼·덩굴
export function wall(B, x, gy, w, h, col, o = {}) {
  const R = ramp(col), hz = o.haze ?? 0, skyC = o.skyC ?? 0, sd = (x * 3 + h) | 0;
  let rowY = 0, row = 0;
  while (rowY < h) {
    const rh = 3 + Math.floor(hash(row, sd) * 3);
    let bx = -Math.floor(hash(sd, row) * 7), blk = 0;
    while (bx < w) {
      const bw = 5 + Math.floor(hash(row, blk, sd) * 7), shift = (hash(blk, row, sd) - 0.5) * 0.25;
      for (let j = 0; j < rh && rowY + j < h; j++) for (let i = Math.max(0, bx); i < Math.min(w, bx + bw); i++) {
        let I = 0.62 + shift - (j === 0 || i === bx ? 0.22 : 0) + (j === 1 ? 0.06 : 0) - (i / w) * 0.12;
        let c = tone(R, I, x + i, gy - rowY - j);
        rowY + j < 8 && hash(i, rowY + j, sd) < 0.4 - (rowY + j) * 0.05 && (c = mix(c, 0x5a7a3a, 0.55));
        B.put(x + i, gy - rowY - j, mix(c, skyC, hz));
      }
      bx += bw, blk++;
    }
    rowY += rh, row++;
  }
  for (let i = 0; i < w; i++) if (Math.floor(i / 5) % 2 === 0 && hash(Math.floor(i / 5), sd, 3) > 0.15) for (let j = 0; j < 4 - (hash(Math.floor(i / 5), sd, 4) > 0.8 ? 2 : 0); j++) B.put(x + i, gy - h - j, mix(tone(R, 0.75 - (i % 5) * 0.08, x + i, j), skyC, hz));
}
// 깃발 장대 (바람에 흔들리는 천)
export function banner(B, x, gy, h, col, o = {}) {
  const hz = o.haze ?? 0, skyC = o.skyC ?? 0, R = ramp(col);
  for (let j = 0; j < h; j++) B.put(x, gy - j, mix(j % 5 ? 0x4a3420 : 0x6a4a2a, skyC, hz)), B.put(x + 1, gy - j, mix(0x2a1e14, skyC, hz));
  const fw = o.w ?? 10, fh = o.h ?? 16;
  for (let j = 0; j < fh; j++) for (let i = 2; i < fw + 2 - (j > fh - 4 ? (j - fh + 4) * 2 * (i % 2) : 0); i++) {
    const wave = Math.sin(i * 0.6 + j * 0.1) * 1.2;
    B.put(x + i, gy - h + j + wave, mix(tone(R, 0.75 - i * 0.03 + Math.cos(i * 0.6) * 0.15, x + i, j), skyC, hz));
  }
  o.emblem && fw && (B.put(x + 2 + fw / 2, gy - h + fh / 2, o.emblem), B.put(x + 3 + fw / 2, gy - h + fh / 2, o.emblem));
}
// 유리 돔 온실: 속 식물 + 유리판(하늘빛 반사·대각선 빛) + 갈빗대 틀 + 돌 받침
function dome(B, cx, gy, r, o = {}) {
  const hz = o.haze ?? 0, skyC = o.skyC ?? 0, frame = ramp(o.frame ?? 0xe8e4f0), P = (X, Y, c, a) => B.put(X, Y, hz ? mix(c, skyC, hz) : c, a);
  for (let k = 0; k < 4; k++) { const px = cx - r * 0.6 + k * r * 0.4; mass(B, px - 5, gy - r * 0.55, 10, r * 0.55, (X, Y) => (X - px) ** 2 / 25 + (Y - gy + r * 0.3) ** 2 / (r * r * 0.08) < 1, { col: [0x5aa868, 0x88c860, 0xd078a0][k % 3], round: 3, bump: 0.8, sc: 2, haze: hz, skyC, rim: false }); }
  for (let j = -r; j <= 0; j++) for (let i = -r; i <= r; i++) {
    const d = (i * i + j * j) / (r * r);
    if (d > 1) continue;
    const ang = Math.atan2(-j, i), mer = Math.abs(((ang / Math.PI) * 8) % 1 - 0.5) > 0.44, lat = Math.abs(((-j / r) * 4) % 1 - 0.5) > 0.42, edge = d > 0.9;
    if (edge || mer || lat) P(cx + i, gy + j, tone(frame, 0.9 - (i / r) * 0.5 - (edge ? 0.3 : 0), cx + i, gy + j));
    else {
      const ref = mix(o.glass ?? 0xc8ecff, 0xffffff, Math.max(0, (-j / r) * 0.4 - (i / r) * 0.2)), hl = Math.abs(i + j * 0.8 + r * 0.35) < r * 0.08;
      P(cx + i, gy + j, hl ? 0xffffff : ref, hl ? 200 : 120);
    }
  }
  wall(B, cx - r - 2, gy + 4, 2 * r + 4, 4, o.base ?? 0xc8c0d0, { haze: hz, skyC });
}
// 부서진 기둥: 홈 파인 몸통 + 비스듬히 깨진 윗면 + 받침돌 + 발치에 떨어진 조각 + 이끼
function column(B, x, gy, w, h, col, o = {}) {
  const sd = (x * 7 + h * 3) | 0, cut = h * (0.75 + hash(sd, 1) * 0.25), slope = (hash(sd, 2) - 0.5) * 1.4;
  mass(B, x - 2, gy - h - 4, w + 4, h + 6, (X, Y) => X >= x && X < x + w && Y > gy - cut - (X - x - w / 2) * slope - Math.abs(Math.sin(X * 1.7 + sd)) * 2.5 && Y < gy - 3, { col, round: w * 0.35, bump: 0.25, sc: 5, grooves: 2.1, haze: o.haze, skyC: o.skyC, seed: sd, warp: 0.6 });
  mass(B, x - 3, gy - 5, w + 6, 6, (X, Y) => X >= x - 2 && X < x + w + 2 && Y >= gy - 4, { col: sh(col, -0.05), round: 2, bump: 0.3, haze: o.haze, skyC: o.skyC, seed: sd + 1, warp: 0.4 });
  const fx = x + w + 2 + hash(sd, 3) * 6, fr = Math.max(2, w * 0.35);
  mass(B, fx - fr, gy - fr * 1.2, fr * 2 + 1, fr * 1.4, (X, Y) => ((X - fx) / fr) ** 2 + ((Y - gy + fr * 0.5) / (fr * 0.7)) ** 2 < 1, { col, round: 2, bump: 0.4, haze: o.haze, skyC: o.skyC, seed: sd + 2 });
  if (o.moss !== false) for (let i = 0; i < w; i++) hash(i, sd, 4) < 0.5 && B.put(x + i, gy - cut - (i - w / 2) * slope - 1, mix(0x5a8a3a, o.skyC ?? 0, o.haze ?? 0));
}
// 오벨리스크: 보이는 두 면 + 군데군데 깨진 모서리 + 새김 글자 줄 + 모래에 묻힌 밑동
function obelisk(B, cx, gy, w, h, col, o = {}) {
  const R = ramp(col), hz = o.haze ?? 0, skyC = o.skyC ?? 0, sd = (cx * 5) | 0;
  for (let j = 0; j < h + w; j++) {
    const Y = gy - j, tip = j > h ? (h + w - j) / w : 1, half = (w / 2) * (1 - (j / (h + w)) * 0.3) * tip;
    const chipL = hash(j >> 2, sd, 1) > 0.88 ? 1 : 0, chipR = hash(j >> 2, sd, 2) > 0.9 ? 1 : 0;
    for (let i = -Math.ceil(half) + chipL; i <= Math.ceil(half) - chipR; i++) {
      let I = i < 0 ? 0.85 : 0.35;
      j < h && j % 20 < 2 && (I -= 0.14);
      const gx = i < 0 ? i + Math.ceil(half) : i;
      j < h - 4 && j > 10 && j % 20 > 4 && j % 20 < 16 && gx > 1 && gx < half - 1 && hash(gx, j >> 1, sd) > 0.62 && (I -= 0.28);
      I += (fbm(cx + i, Y, 8, sd, 2) - 0.5) * 0.25;
      B.put(cx + i, Y, mix(Math.abs(i) >= Math.ceil(half) - (i < 0 ? chipL : chipR) ? R[5] : tone(R, I, cx + i, Y), skyC, hz));
    }
  }
  for (let i = -w; i < w; i++) for (let j = 0; j < 4 - Math.abs(i) / w * 3; j++) B.put(cx + i, gy - j, mix(tone(ramp(0xe8c890), 0.7 - j * 0.1, cx + i, j), skyC, hz));
}
// 사슬 (고리가 번갈아 정면·옆면)
export function chain(B, x0, y0, x1, y1, col, o = {}) {
  const R = ramp(col), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4), hz = o.haze ?? 0, skyC = o.skyC ?? 0;
  for (let k = 0; k < n; k++) {
    const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * (o.sag ?? 0);
    if (k % 2) for (let j = -2; j <= 2; j++) B.put(x, y + j, mix(R[j < 0 ? 1 : 3], skyC, hz));
    else for (let a = 0; a < 12; a++) B.put(x + Math.cos(a * 0.52) * 1.5, y + Math.sin(a * 0.52) * 2.5, mix(R[a < 6 ? 3 : 1], skyC, hz));
  }
}
// 갈비뼈 아치 (뼈 관 + 관절 혹)
function rib(B, cx, gy, w, h, col, o = {}) {
  const pts = [];
  for (let k = 0; k <= 16; k++) { const th = (k / 16) * Math.PI; pts.push([cx + (w / 2) * Math.cos(th), gy - h * Math.sin(th) * (1 + 0.08 * Math.sin(th * 3))]); }
  tube(B, pts, o.r ?? 3, o.r ?? 3, col, { haze: o.haze, skyC: o.skyC, seed: cx | 0 });
  for (const s of [-1, 1]) mass(B, cx + (s * w) / 2 - 5, gy - 5, 10, 7, (X, Y) => (X - cx - (s * w) / 2) ** 2 / 16 + (Y - gy + 2) ** 2 / 9 < 1, { col, round: 3, haze: o.haze, skyC: o.skyC });
}
// 거미줄: 살 + 살 사이로 안쪽으로 처진 고리 + 이슬
function web(B, cx, cy, r, c, a, seed = 1) {
  const L = (x0, y0, x1, y1, al = a) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k <= n; k++) B.put(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c, al); };
  const sp = 8 + Math.floor(hash(seed, 1) * 4), ang = [], len = [];
  for (let k = 0; k < sp; k++) (ang[k] = (k / sp) * Math.PI * 2 + (hash(k, seed) - 0.5) * 0.4), (len[k] = r * (0.75 + hash(seed, k) * 0.35));
  for (let k = 0; k < sp; k++) L(cx, cy, cx + Math.cos(ang[k]) * len[k], cy + Math.sin(ang[k]) * len[k]);
  for (let rr = r * 0.14; rr < r * 0.9; rr += r * (0.07 + hash(rr | 0, seed) * 0.03))
    for (let k = 0; k < sp; k++) {
      const k2 = (k + 1) % sp, r1 = Math.min(rr, len[k]), r2 = Math.min(rr, len[k2]), a1 = ang[k], a2 = ang[k2] + (k2 === 0 ? Math.PI * 2 : 0);
      const m = (a1 + a2) / 2, sag = rr * 0.86;
      const xa = cx + Math.cos(a1) * r1, ya = cy + Math.sin(a1) * r1, xm = cx + Math.cos(m) * sag, ym = cy + Math.sin(m) * sag, xb = cx + Math.cos(a2) * r2, yb = cy + Math.sin(a2) * r2;
      L(xa, ya, xm, ym, a * 0.8), L(xm, ym, xb, yb, a * 0.8);
    }
  for (let k = 0; k < 8; k++) glint(B, cx + (hash(k, seed, 1) - 0.5) * r * 1.3, cy + (hash(k, seed, 2) - 0.5) * r * 1.3, 0xd0f0ff, 1, 170);
}
// 흉곽: 등뼈(마디 혹) + 양쪽으로 휘어 내려오는 갈비뼈 쌍 (가운데가 크고 끝으로 갈수록 작다)
function ribcage(B, x0, x1, sy, gy, col, o = {}) {
  const pts = [], n = Math.round((x1 - x0) / 40);
  for (let k = 0; k <= 24; k++) pts.push([x0 + ((x1 - x0) * k) / 24, sy + Math.sin((k / 24) * Math.PI) * -16 + Math.sin(k * 0.9) * 2]);
  tube(B, pts, o.r ?? 5, (o.r ?? 5) * 0.6, col, { haze: o.haze, skyC: o.skyC, seed: 7 });
  for (let k = 1; k < n; k++) {
    const t = k / n, x = x0 + (x1 - x0) * t, y = sy - Math.sin(t * Math.PI) * 16, sz = 0.45 + Math.sin(t * Math.PI) * 0.55, h = (gy - y) * sz, w = 36 * sz;
    for (const d of [-1, 1]) {
      const rp = [];
      for (let j = 0; j <= 14; j++) { const u = j / 14; rp.push([x + d * w * Math.sin(u * Math.PI * 0.85) + d * u * 6, y + h * (1 - Math.cos(u * Math.PI * 0.5))]); }
      tube(B, rp, (o.r ?? 5) * 0.7 * sz + 1, 1, d < 0 ? sh(col, -0.15) : col, { haze: o.haze, skyC: o.skyC, seed: k * 2 + (d > 0 ? 1 : 0) });
    }
    mass(B, x - 5, y - 6, 10, 9, (X, Y) => (X - x) ** 2 / 20 + (Y - y + 1) ** 2 / 14 < 1, { col, round: 3, haze: o.haze, skyC: o.skyC });
  }
}
// 모래 폭포: 굵은 흐름(가운데 밝고 가장자리 어둡게, 흘러내리는 결) + 위 틈 빛 + 밑 먼지 기둥
function sandfall(B, x, y0, y1, w, c, a = 230) {
  const Rr = ramp(c, 0xfff8e0, 0x3a2a14);
  for (let y = y0; y < y1; y++) for (let i = 0; i < w; i++) {
    const u = i / (w - 1), wob = Math.sin(y * 0.08 + x) * 0.8;
    const I = 0.75 - Math.abs(u - 0.4) * 0.9 + (vn(x + i, y * 0.2, 3, 9) - 0.5) * 0.5 + (((y * 0.5 + i * 3) | 0) % 9 < 2 ? 0.2 : 0);
    B.put(x + i + wob, y, tone(Rr, I, x + i, y), Math.round(a * (i === 0 || i === w - 1 ? 0.5 : 1)));
  }
  for (let j = 0; j < 30; j++) for (let i = -w; i < w * 2; i++) { const d = Math.hypot((i - w / 2) / (w * 1.2), j / 30); d < 1 && B.put(x + i, y1 - j * 0.5 - 2, c, Math.round(90 * (1 - d))); }
  for (let j = 0; j < 14; j++) for (let i = -4; i < w + 4; i++) B.put(x + i, y0 + j, 0xfff4d0, Math.round(120 * (1 - j / 14)));
}
// 종유석 커튼 (천장에서 내려온 뾰족 바위, 입체)
function stalac(B, col, n, maxL, seed, o = {}) {
  for (let k = 0; k < n; k++) {
    const x = hash(k, seed) * W, L = 20 + hash(k, seed, 1) * maxL, w = 6 + hash(k, seed, 2) * 16;
    mass(B, x - w, -2, w * 2, L + 4, (X, Y) => Math.abs(X - x) < (w / 2) * Math.pow(Math.max(0, 1 - Y / L), 0.75) * (0.85 + 0.3 * vn(Y, k, 7, seed)), { col, round: w * 0.3, bump: 0.5, sc: 5, strata: 0.4, haze: o.haze, skyC: o.skyC, seed: seed + k, glow: o.glow });
    o.drip && glint(B, Math.round(x), Math.round(L + 4), o.drip, 1, 200);
  }
}
// 석순 (아래에서 솟은 뾰족 바위)
function stalag(B, x, gy, w, h, col, o = {}) { spire(B, x, gy, w, h, col, { ...o, pow: 0.9, strata: 0.35 }); }
// 동굴 뒷벽: 부드러운 어둠 + 천장·바닥 바위 겹 셋 (먼 겹은 어둠에 묻힌다)
function caveBack(B, col, seed, o = {}) {
  const dark = o.dark ?? mix(col, 0x000000, 0.7), mid = mix(col, 0x000000, 0.45);
  for (let y = 0; y < B.h; y++) for (let x = 0; x < W; x++) B.put(x, y, mix(dark, mid, Math.max(0, 1 - Math.abs(y - 250) / 260) * (0.6 + vn(x, y, 120, seed) * 0.4)));
  caveRanges(B, { n: o.n ?? 3, col: sh(col, 0.15), col1: col, dark, seed, ceil: o.ceil ?? 140, floor: o.floor ?? 370, amp: o.amp ?? 100 });
}
// 빛웅덩이 (색 빛무리)
export function glowSpot(B, x, y, r, c, a) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j * 1.3) / r; d < 1 && B.put(x + i, y + j, c, Math.round(a * (1 - d) * (1 - d))); }
}
// 동굴 바닥: 크기가 다른 둥근 바위 · 납작한 판돌 · 작은 석순 · 잔돌 (땅 윗선 f를 따라)
function caveFloor(B, f, col, R, o = {}) {
  for (let i = 0; i < (o.n ?? 14); i++) {
    const x = R(0, W), gy = Math.round(f(((x % W) + W) % W)) + 3, k = R(0, 9);
    if (k < 5) { const rw = R(5, 16), rh = Math.round(rw * (0.45 + R(0, 40) / 100)); mass(B, x - rw - 1, gy - rh * 1.6, rw * 2 + 2, rh * 1.8, (X, Y) => ((X - x) / rw) ** 2 + ((Y - gy + rh * 0.6) / rh) ** 2 < 1, { col: sh(col, (R(0, 20) - 10) / 100), round: rh * 0.7, bump: 0.6, sc: 4, seed: x + k, warp: 1.8 }); }
    else if (k < 7) { const w = R(4, 9), h = R(12, 34); spire(B, x, gy, w, h, sh(col, 0.08), { pow: 0.9, strata: 0.4, seed: x }); }
    else { const L = R(14, 30); mass(B, x - L, gy - 5, L * 2, 7, (X, Y) => Math.abs(X - x) < L - Math.abs(Y - gy + 2) * 3 && Y > gy - 5 + (X - x) * 0.05, { col: sh(col, -0.05), round: 2, bump: 0.5, strata: 1, seed: x }); }
  }
  for (let i = 0; i < 60; i++) { const x = R(0, W), y = Math.round(f(x)) + R(0, 2); B.put(x, y, sh(col, 0.25)), B.put(x + 1, y, sh(col, -0.2)); }
}
// 야자수: 휘어 오른 마디 줄기 + 늘어진 잎 일곱 + 열매
function palm(B, x, gy, s, o = {}) {
  const hz = o.haze ?? 0, skyC = o.skyC ?? 0, lean = (hash(x | 0, 3) - 0.5) * 30 * s, H = 44 * s, top = [x + lean, gy - H];
  tube(B, [[x, gy], [x + lean * 0.2, gy - H * 0.35], [x + lean * 0.6, gy - H * 0.75], top], 2.6 * s, 1.8 * s, 0x8a6a44, { haze: hz, skyC, seed: x | 0, bump: 0.9, sc: 1.5 });
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * (0.05 + (k / 6) * 0.9), L = (18 + hash(k, x | 0) * 8) * s, pts = [];
    for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push([top[0] + Math.cos(a) * L * t, top[1] + Math.sin(a) * L * t * 0.7 + t * t * L * 0.6]); }
    tube(B, pts, 2.2 * s, 0.6, k % 2 ? 0x4a8a3a : 0x5aa048, { haze: hz, skyC, seed: k + (x | 0), bump: 0.9, sc: 1.2 });
  }
  for (let k = 0; k < 3; k++) mass(B, top[0] - 4 + k * 3, top[1], 4, 4, (X, Y) => (X - top[0] + 3 - k * 3) ** 2 + (Y - top[1] - 2) ** 2 < 3, { col: 0x6a4a2a, round: 1.5, haze: hz, skyC, rim: false });
}
// 들꽃 (땅 윗선 f를 따라)
function flowers(B, f, n, cols, R) {
  for (let i = 0; i < n; i++) {
    const x = R(0, W), y = Math.round(f(x)) + R(1, 8), c = cols[i % cols.length];
    B.put(x, y, c), B.put(x + 1, y, sh(c, -0.2)), B.put(x, y + 1, sh(c, -0.4)), hash(i, 9) > 0.6 && B.put(x, y - 1, sh(c, 0.3));
  }
}
const at = (f, x) => Math.round(f(((Math.round(x) % W) + W) % W));

// ══ 구역별 화가 ══ (S 층, B 버퍼, E 팔레트, R 정수 난수, seed)
const ZP = {
  // ─────────── 하늘 (노랑) ───────────
  g0_m2(S, B, E, R, seed) { // 글래스블룸 「수정 온실 군도」: 연보라 수정 산맥 · 거대 수정 첨탑 · 유리 온실 섬 · 수정 꽃밭
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      sunRays(B, 520, 40, 6, 0xfff8ff, 34, seed);
      glowSpot(B, 250, 150, 90, 0xffffff, 30);
      crystals(B, 250, 300, 300, [0xc8e8ff, 0xe8d0ff, 0xd0fff0], { haze: 0.45, skyC: sk, glow: 0xffffff, rockCol: 0xb0a8d0, seed: seed + 400 });
      glowSpot(B, 250, 60, 70, 0xffffff, 40);
      birds(B, R, 7, 430, 150, mix(0x4a4a6a, sk, 0.4));
      cirrus(B, R, seed, 0xffffff, 8, 140);
      clouds(B, E, R, seed, 4, 60, 150, 0.8, 1.5, 230);
      horizon(B, E, R, seed, { y: 250, sun: [520, 70] });
      ranges(B, { giant: 1.5, between: (k, b) => k === 1 && cloudBank(B, E, b - 40, seed + 7), n: 3, base: 318, amp: 120, col: 0xb8b0e0, col1: 0x9aa0d0, skyC: sk, seed, snow: 1, haze0: 0.7, haze1: 0.35, step: 14 });
      for (let i = 0; i < 5; i++) crystals(B, R(0, W), 334, R(50, 120), [0xd8f0ff, 0xf0d8ff, 0xd8fff0], { ...o(0.58), glow: 0xffffff, rockCol: 0x9a90b8 });
      for (let i = 0; i < 5; i++) { const x = R(0, W), y = R(150, 240), w = R(30, 54); isle(B, x, y, w, 0xa8a0c0, 0x9ae0c0, { ...o(0.5), roots: 0.5, rootCol: 0x8a7a9a }); for (let k = 0; k < 3; k++) crystal(B, x + w * (0.2 + k * 0.28), y, R(4, 8), R(14, 34), 0xe0f4ff, o(0.48)); }
      fog(B, 320, 30, 0xf4ecff, 170, seed);
    } else if (S === 1) {
      for (let i = 0; i < 3; i++) {
        const x = R(0, W), y = R(190, 260), w = R(80, 120);
        isle(B, x, y, w, 0x9a90b8, 0x88dcb0, { ...o(0.22), roots: 0.4, rootCol: 0x7a6a88, depth: w * 0.55 });
        dome(B, x + w * 0.45, y, Math.round(w * 0.24), { ...o(0.22), glass: 0xd0f0ff });
        crystal(B, x + w * 0.85, y, 8, 30, 0xf0d8ff, { ...o(0.2), glow: 0xffffff });
      }
      cloudSea(B, 352, 26, 0xffffff, seed + 7, { tint: 0xe0d8f8, tintHi: 0xffffff, tintLo: 0x6a60a0 });
      for (let i = 0; i < 5; i++) rays(B, R(0, W), R(10, 22), 300, 0xfff4ff, 26, 0.4);
    } else {
      cloudSea(B, 398, 22, 0xffffff, seed + 9, { tint: 0xece4ff, tintHi: 0xffffff, tintLo: 0x8078b8 });
      for (let i = 0; i < 4; i++) crystals(B, R(0, W), R(380, 396), R(26, 44), [0xd8f0ff, 0xffd8f4, 0xe0fff0], { glow: 0xffffff, rockCol: 0xb0a8d0 });
      for (let i = 0; i < 30; i++) glint(B, R(0, W), R(200, 400), 0xfff0ff, 1, 180);
    }
  },
  g1_m2(S, B, E, R, seed) { // 애쉬펠 「사슬에 묶인 잿빛 폐허」: 잿빛 노을 · 연기 기둥 · 사슬에 매달린 폐허 섬 · 불씨
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      { const x = 60, y = 120, w = 210, bot = isle(B, x, y, w, 0x6a5a54, 0x5a5448, { haze: 0.6, skyC: sk, depth: 110, seed: seed + 400 }); for (let k = 0; k < 7; k++) column(B, x + 18 + k * 27, y, 9, 40 + (k % 3) * 14 - (k === 5 ? 26 : 0), 0x9a8c84, { haze: 0.6, skyC: sk }); wall(B, x + 14, y - 46, w - 28, 6, 0x9a8c84, { haze: 0.6, skyC: sk }); for (const cx of [x + 30, x + w - 30]) chain(B, cx, -10, cx, y, 0x2a2424, { haze: 0.5, skyC: sk }); for (let y2 = y; y2 > -20; y2 -= 5) glowSpot(B, x + w * 0.6 + Math.sin(y2 * 0.05) * 10, y2, 14 + (y - y2) * 0.15, 0x3a2e2c, 45); }
      glowSpot(B, 500, 330, 160, 0xff6020, 45);
      for (let i = 0; i < 5; i++) { const x = R(0, W); for (let y = 330; y > 40; y -= 6) glowSpot(B, x + Math.sin(y * 0.02 + i) * 14 + (330 - y) * 0.15, y, 10 + (330 - y) * 0.08, 0x4a3a38, 40); }
      horizon(B, E, R, seed, { y: 270, a: 0 });
      ranges(B, { giant: 1.8, giantSnow: false, between: (k, b) => k === 1 && fog(B, b - 24, 34, 0x8a7068, 230, seed + 9, 80), n: 3, base: 322, amp: 110, col: 0x6a5a58, col1: 0x4a3e3e, skyC: sk, seed, haze0: 0.6, haze1: 0.25, sharp: 2 });
      for (let i = 0; i < 5; i++) {
        const x = R(0, W), y = R(140, 230), w = R(30, 56);
        chain(B, x + w / 2, 0, x + w / 2, y, 0x3a3434, o(0.45));
        isle(B, x, y, w, 0x6a6058, 0x5a5448, o(0.45));
        column(B, x + w * 0.25, y, 5, R(10, 24), 0x9a9088, o(0.45)), column(B, x + w * 0.6, y, 5, R(8, 18), 0x9a9088, o(0.45));
      }
      for (let y = 250; y < 345; y++) for (let x = 0; x < W; x++) B.put(x, y, 0xff6a20, Math.round(70 * ((y - 250) / 95) ** 2));
    } else if (S === 1) {
      for (let i = 0; i < 2; i++) {
        const x = R(0, W), y = R(200, 250), w = R(110, 150);
        chain(B, x + 10, 0, x + 10, y, 0x2e2828, o(0.15)), chain(B, x + w - 10, 0, x + w - 10, y, 0x2e2828, o(0.15));
        isle(B, x, y, w, 0x5a504a, 0x4e4a40, { ...o(0.18), depth: w * 0.5 });
        for (let k = 0; k < 4; k++) column(B, x + 14 + (k * (w - 30)) / 3, y, 7, R(14, 40), 0x8a8078, o(0.15));
        wall(B, x + w * 0.3, y, w * 0.35, 12, 0x7a7068, o(0.15));
      }
      cloudSea(B, 356, 26, 0xffffff, seed + 3, { tint: 0x8a7670, tintHi: 0xe8c8b0, tintLo: 0x2a1e20 });
      for (let i = 0; i < 60; i++) glint(B, R(0, W), R(60, 360), [0xff9040, 0xffc060, 0xff6020][i % 3], 1, 200);
    } else {
      cloudSea(B, 400, 20, 0xffffff, seed + 9, { tint: 0x6a5852, tintHi: 0xd0a890, tintLo: 0x1a1214 });
      for (let i = 0; i < 4; i++) { const x = R(0, W), y = R(380, 396); column(B, x, y + 4, 9, R(18, 40), 0x7a7068); mass(B, x + 10, y - 4, 14, 10, (X, Y) => (X - x - 17) ** 2 / 40 + (Y - y + 1) ** 2 / 14 < 1, { col: 0x6a6058, round: 3 }); }
      for (let i = 0; i < 90; i++) { const x = R(0, W), y = R(100, 420); B.put(x, y, [0xffa040, 0xff6020, 0xffd080][i % 3], 230); i % 4 || glint(B, x, y, 0xff8030, 1, 160); }
    }
  },
  gm1_m2(S, B, E, R, seed) { // 모스스파이어 「하늘 수도원」: 이끼 바늘 봉우리 · 봉우리마다 수도원 · 종탑 섬 · 기도 깃발 언덕
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      sunRays(B, 540, 30, 5, 0xfffff0, 30, seed);
      { const x = 180, gy = 330, h = 330; spire(B, x, gy, 150, h, 0x8aa898, { haze: 0.55, skyC: sk, strata: 0.25, seed: seed + 400, pow: 0.55 }); for (let k = 0; k < 4; k++) tower(B, x - 26 + k * 14, gy - h + 70 - (k % 2) * 10, 10, 30 + k * 6, 0xe0d8c4, 0x9a4a34, 0xffd890, { haze: 0.55, skyC: sk, roofK: 1.7 }); sandfall(B, x + 30, gy - h + 90, gy - 20, 6, 0xf0fbff, 160); }
      birds(B, R, 6, 400, 140, mix(0x2a3a3a, sk, 0.4));
      clouds(B, E, R, seed, 5, 50, 160, 0.8, 1.6, 235);
      horizon(B, E, R, seed, { y: 270, sun: [540, 60] });
      ranges(B, { giant: 1.7, between: (k, b) => k === 1 && cloudBank(B, E, b - 40, seed + 7), n: 3, base: 330, amp: 130, col: 0x9ab8a8, col1: 0x7a9a88, skyC: sk, seed, snow: 1, haze0: 0.62, haze1: 0.42, sharp: 1.4 });
      for (let i = 0; i < 9; i++) {
        const x = R(0, W), h = R(130, 250), w = R(22, 40), hz = 0.62 - (h / 250) * 0.15;
        spire(B, x, 340, w, h, 0x7a9a80, { ...o(hz), strata: 0.3, seed: seed + i });
        for (let y = 340 - h + 24; y < 330; y += R(14, 30)) { const t = (340 - y) / h, half = (w / 2) * Math.pow(1 - t, 0.7), side = R(0, 1) ? 1 : -1, mx = x + side * half * 0.7, mw = R(5, 10), mh = R(4, 9); mass(B, mx - mw, y - mh, mw * 2, mh * 2, (X, Y) => (X - mx) ** 2 / (mw * mw) + (Y - y) ** 2 / (mh * mh) < 1 + (vn(X, Y, 3, 11) - 0.5), { col: 0x6aa84a, round: 3, bump: 0.8, sc: 3, haze: hz, skyC: sk }); }
        i % 2 === 0 && tower(B, x - 5, 340 - h + 26, 10, 22, 0xd8d0b8, 0x9a4a34, 0xffd890, { ...o(hz), roofK: 1.5 });
      }
      fog(B, 300, 36, 0xf0f8e8, 190, seed);
    } else if (S === 1) {
      for (let i = 0; i < 3; i++) {
        const x = R(0, W), y = R(180, 260), w = R(90, 130);
        isle(B, x, y, w, 0x7a8070, 0x6ab048, { ...o(0.2), roots: 0.35, rootCol: 0x4a5a3a });
        wall(B, x + 10, y, w * 0.5, 16, 0xd8d0b8, o(0.2));
        tower(B, x + w * 0.62, y, 16, R(46, 70), 0xe0d8c0, 0x8a3a2a, 0xffd890, { ...o(0.2), flag: 0xe0b040 });
        tree(B, x + w * 0.2, y, 0.9, 0x3e7a3a, 0x5a4030, { ...o(0.2), kind: "pine" });
      }
      cloudSea(B, 354, 26, 0xffffff, seed + 5, { tint: 0xd8ecd8, tintHi: 0xffffff, tintLo: 0x587868 });
    } else {
      const f = land(B, { base: 392, amp: 26, col: 0x5a6a50, cap: 0x5aa850, skyC: sk, seed: seed + 5, blades: 0.6, capH: 6 });
      const FL = [0xe04040, 0xf0d040, 0x40a0e0, 0xf0f0f0, 0x40c060];
      for (let k = 0; k < 3; k++) {
        const x0 = R(0, W), x1 = x0 + R(70, 140), y0 = at(f, x0) - 30, y1 = at(f, x1) - 30;
        banner(B, x0, at(f, x0), 30, 0x6a4a2a, { w: 0, h: 0 }), banner(B, x1, at(f, x1), 30, 0x6a4a2a, { w: 0, h: 0 });
        for (let t = 0.05; t < 1; t += 0.07) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 10; for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) B.put(x + i, y + j + Math.sin(i) * 0.5, tone(ramp(FL[Math.round(t * 14) % 5]), 0.75 - i * 0.1, x + i, j)); }
      }
      for (let i = 0; i < 7; i++) { const x = R(0, W), gy = at(f, x) + 2; for (let k = 0; k < 4; k++) { const r = 5 - k, cy = gy - k * 6 - r - 2; mass(B, x - r - 1, cy - r, r * 2 + 3, r * 2 + 2, (X, Y) => (X - x) ** 2 / (r * r + 1) + (Y - cy) ** 2 / (r * r * 0.5 + 1) < 1, { col: 0xa8a898, round: 2 }); } }
      for (let i = 0; i < 5; i++) { const x = R(0, W); tree(B, x, at(f, x) + 2, 1.1, 0x3e7a3a, 0x5a4030, { kind: "pine" }); }
      flowers(B, f, 60, [0xffffff, 0xffe070, 0xc8a8ff], R);
    }
  },
  gm2_m2(S, B, E, R, seed) { // 스포어캡 「떠오른 버섯 갓」: 보랏빛 밤하늘 · 거대 버섯 숲 실루엣 · 빛나는 갓 섬 · 포자
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      mush(B, 430, 360, 380, 330, 0xb07ab0, 0xd8c8d8, { haze: 0.62, skyC: sk, spots: 0xf0d8f0, glow: 0x90ffd0, seed: 77 });
      glowSpot(B, 430, 120, 150, 0x90ffd0, 30);
      G.stars(B, 70, 160, seed);
      for (let i = 0; i < 8; i++) { const x = R(0, W); mush(B, x, 350, R(70, 150), R(150, 260), [0xb070a8, 0x9a70c0, 0xc0789a][i % 3], 0xd8c8d8, { ...o(0.55), spots: 0xf0d8f0, glow: 0x90ffd0, seed: i }); }
      fog(B, 330, 40, 0xf0b8e0, 190, seed);
    } else if (S === 1) {
      for (let i = 0; i < 4; i++) { const x = R(0, W), y = R(170, 260), w = R(60, 100); mush(B, x + w / 2, 380, w, 380 - y, [0xd05a9a, 0x9a5ad0, 0xe08a50, 0xc070c0][i], 0xe8d8e0, { ...o(0.2), spots: 0xffe0f0, glow: 0x90ffd0, seed: i * 3 }); }
      cloudSea(B, 356, 24, 0xffffff, seed + 3, { tint: 0xd890c8, tintHi: 0xffe0f8, tintLo: 0x4a2a6a });
      for (let i = 0; i < 70; i++) glint(B, R(0, W), R(40, 360), [0x90ffd0, 0xffd0f0][i % 2], 1, 170);
    } else {
      const f = land(B, { base: 394, amp: 18, col: 0x4a3a5a, cap: 0x9a4a7a, skyC: sk, seed: seed + 5, blades: 0.3, capH: 5 });
      for (let i = 0; i < 14; i++) { const x = R(0, W); mush(B, x, at(f, x) + 3, R(12, 30), R(10, 30), [0xd05a9a, 0x8a5ad0, 0xf09a50][i % 3], 0xf0e0e8, { spots: 0xffffff, glow: 0x90ffd0, seed: i }); }
      for (let i = 0; i < 50; i++) glint(B, R(0, W), R(150, 400), 0x90ffd0, 1, 200);
    }
  },
  g2_m2(S, B, E, R, seed) { // 앰버홀드 「호박빛 기사 성채」: 해질녘 호박 하늘 · 메사 위 성채 · 성벽과 망루 · 기사단 깃발
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      sunRays(B, 500, 120, 6, 0xffe8b0, 36, seed);
      { const x = 250, gy = 372, w = 230, h = 120; mass(B, x - w / 2 - 20, gy - h, w + 40, h + 60, (X, Y) => Math.abs(X - x) < w / 2 + (Y - gy + h) * 0.35 + (vn(X, Y, 9, 3) - 0.5) * 10 && Y > gy - h + Math.abs(Math.sin(X * 0.08)) * 4, { col: 0xb08060, round: 10, bump: 0.6, sc: 8, strata: 0.5, haze: 0.45, skyC: sk, seed: seed + 400 }); wall(B, x - w / 2 + 10, gy - h, w - 20, 26, 0xc89c70, { haze: 0.45, skyC: sk }); for (let k = 0; k < 7; k++) tower(B, x - w / 2 + 14 + k * 30, gy - h - 20, 14 + (k === 3 ? 8 : 0), 50 + ((k * 37) % 60) + (k === 3 ? 50 : 0), 0xd0a878, 0x8a3020, 0xffd080, { haze: 0.45, skyC: sk, flag: 0xc03020 }); }
      birds(B, R, 8, 120, 150, mix(0x3a2418, sk, 0.3));
      cirrus(B, R, seed, 0xfff0c0, 10, 160);
      clouds(B, E, R, seed, 3, 60, 140, 1, 1.6, 220, 0xffc080);
      horizon(B, E, R, seed, { y: 280, lk: 0.3, sun: [500, 120] });
      const fs = ranges(B, { giant: 1.6, giantSnow: false, between: (k, b) => k === 1 && cloudBank(B, E, b - 30, seed + 7, { light: 0xffe0b8, shade: 0xb07850 }), n: 2, base: 330, amp: 60, col: 0xb08060, col1: 0x8a6048, skyC: sk, seed, haze0: 0.55, haze1: 0.35, sharp: 0.4, sc: 220 });
      for (let i = 0; i < 2; i++) {
        const x = R(0, W), gy = at(fs[1], x) + 4;
        wall(B, x - 60, gy, 120, 24, 0xc09068, o(0.4));
        for (let k = 0; k < 5; k++) tower(B, x - 60 + k * 26, gy - 20, 12, R(40, 90), 0xc8a070, 0x8a3a2a, 0xffd080, { ...o(0.4), flag: 0xc03020 });
      }
    } else if (S === 1) {
      const f = land(B, { base: 352, amp: 34, col: 0x8a6448, cap: 0xa89058, skyC: sk, haze: 0.15, seed: seed + 3, strata: 0.5 });
      for (let i = 0; i < 2; i++) {
        const x = R(0, W), gy = at(f, x + 60) + 2;
        wall(B, x, gy, 140, 34, 0xb08860, o(0.15));
        tower(B, x - 8, gy, 20, 80, 0xb88e64, 0x7a2a20, 0xffc060, { ...o(0.15), flag: 0xe0a030 });
        tower(B, x + 132, gy, 18, 66, 0xb88e64, 0x7a2a20, 0xffc060, { ...o(0.15), flag: 0xc03020 });
        tower(B, x + 60, gy - 30, 24, 70, 0xc09468, 0x8a3020, 0xffd080, { ...o(0.15), flag: 0xe0a030 });
      }
      rays(B, 500, 30, 320, 0xffe0a0, 30, -0.3), rays(B, 380, 18, 300, 0xffe0a0, 22, -0.3);
    } else {
      const f = land(B, { base: 396, amp: 18, col: 0x5a4030, cap: 0x8a7a48, skyC: sk, seed: seed + 5, blades: 0.45 });
      for (let i = 0; i < 6; i++) { const x = R(0, W); banner(B, x, at(f, x) + 2, R(40, 60), [0xc03020, 0xe0a030][i % 2], { w: 12, h: 22, emblem: 0xffe8a0 }); }
      for (let i = 0; i < 10; i++) { const x = R(0, W), gy = at(f, x) + 2; for (let k = 0; k < 24; k++) B.put(x + k * 0.18, gy - k, k > 20 ? 0xd8d8e0 : 0x5a4030); }
      for (let i = 0; i < 4; i++) { const x = R(0, W), gy = at(f, x) + 3; mass(B, x - 8, gy - 10, 16, 12, (X, Y) => (X - x) ** 2 / 50 + (Y - gy + 4) ** 2 / 30 < 1, { col: 0xc8b060, round: 4 }); }
    }
  },
  g2_m1(S, B, E, R, seed) { // 듄미스트 「신기루 모래섬」: 아지랑이 모래 바다 · 모래 흘리는 떠오른 섬 · 해시계 오벨리스크 · 오아시스
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      sunRays(B, 560, 50, 5, 0xfffff0, 30, seed);
      { const x = 120, y = 50, w = 280, bot = isle(B, x, y, w, 0xd0a070, 0xf0d8a0, { haze: 0.58, skyC: sk, depth: 120, strata: 0.6, seed: seed + 400 }); for (let k = 0; k < 5; k++) { const sx = Math.round(x + 30 + k * 55), sy = Math.round(bot(sx)); sandfall(B, sx, sy - 4, 330, 5 + (k % 2) * 3, mix(0xf0d8a0, sk, 0.45), 170); } obelisk(B, x + w * 0.5, y, 12, 70, 0xe0c090, { haze: 0.58, skyC: sk }); }
      birds(B, R, 6, 470, 160, mix(0x5a4a3a, sk, 0.4));
      cirrus(B, R, seed, 0xffffff, 6, 120);
      horizon(B, E, R, seed, { y: 285, sun: [560, 60] });
      ranges(B, { giant: 1.5, giantSnow: false, n: 3, base: 330, amp: 60, col: 0xe8c898, col1: 0xd8a870, skyC: sk, seed, haze0: 0.7, haze1: 0.4, sharp: 0.2, sc: 260 });
      obelisk(B, R(0, W), 300, 14, 170, 0xe0c090, o(0.42));
      for (let i = 0; i < 6; i++) {
        const x = R(0, W), y = R(130, 240), w = R(34, 64);
        const bot = isle(B, x, y, w, 0xd0a070, 0xf0d8a0, { ...o(0.45), strata: 0.6 });
        const sx = Math.round(x + w * 0.5), sy = Math.round(bot(sx)), L = R(40, 110);
        for (let yy = sy - 2; yy < sy + L; yy++) for (let k = 0; k < 4; k++) B.put(sx + k + Math.sin(yy * 0.15) * 0.6, yy, mix((yy + k * 3) % 5 ? 0xf0d8a0 : 0xffffff, sk, 0.45), 200);
      }
      fog(B, 312, 34, 0xfff6e0, 200, seed);
    } else if (S === 1) {
      const f = land(B, { base: 354, amp: 36, col: 0xd0a060, cap: 0xf0d8a0, skyC: sk, haze: 0.12, seed: seed + 3, strata: 0.8, capH: 3, sc: 180 });
      for (let i = 0; i < 2; i++) { const x = R(0, W), gy = at(f, x); water(B, gy - 1, gy + 6, 0x58b8c8, 230); for (let k = 0; k < 4; k++) palm(B, x - 30 + k * 20 + R(-4, 4), gy + 1, 0.8 + R(0, 40) / 100, o(0.12)); for (let k = 0; k < 14; k++) { const rx = x - 40 + R(0, 90), L = R(5, 12); for (let j = 0; j < L; j++) B.put(rx + j * 0.1, gy - j, j % 3 ? 0x6a8a3a : 0x8aaa4a); } }
      for (let i = 0; i < 3; i++) { const x = R(0, W), gy = at(f, x) + 2, w = R(26, 40), h = R(14, 20), cl = [0xc04030, 0xe8d8b8, 0x3a6aa0][i % 3]; for (const px of [x, x + w]) for (let j = 0; j < h + 3; j++) B.put(px, gy - j, mix(0x5a4028, sk, 0.12)); for (let i2 = -3; i2 <= w + 3; i2++) { const sag = Math.sin(((i2 + 3) / (w + 6)) * Math.PI) * 4; for (let j = 0; j < 4; j++) B.put(x + i2, gy - h - 2 + sag + j, mix(tone(ramp(Math.floor((i2 + 3) / 5) % 2 ? cl : 0xf0e8d8), 0.85 - j * 0.15, x + i2, j), sk, 0.12)); } mass(B, x + 4, gy - 7, w - 8, 8, (X, Y) => true, { col: 0x9a7a54, round: 2, warp: 1.2, haze: 0.12, skyC: sk }); }
    } else {
      const f = land(B, { base: 396, amp: 18, col: 0xb08050, cap: 0xe8c890, skyC: sk, seed: seed + 5, strata: 0.9, capH: 3 });
      for (let i = 0; i < 5; i++) { const x = R(0, W); rib(B, x, at(f, x) + 3, R(20, 34), R(12, 22), 0xf0e8d8, { r: 1.5 }); }
      for (let i = 0; i < 40; i++) glint(B, R(0, W), R(380, 420), 0x90f0ff, 1, 200);
    }
  },
  gm2_m1(S, B, E, R, seed) { // 보그플로트 「떠오른 늪 덩어리」: 늪 안개 하늘 · 뿌리 늘어진 진흙섬 · 썩은 고목 · 갈대
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      { const x = 200, y = 30, w = 320, bot = isle(B, x, y, w, 0x4a4030, 0x5a7a3a, { haze: 0.62, skyC: sk, depth: 130, seed: seed + 400 }); for (let k = 0; k < 16; k++) { const rx = x + 10 + k * 19; rootDown(B, rx, bot(rx) - 6, 60 + hash(k, 3) * 160, 3, 0x4a3a28, seed + 500 + k, { haze: 0.62, skyC: sk }); } for (let k = 0; k < 4; k++) tree(B, x + 40 + k * 70, y, 1.6, 0x3a4a30, 0x3a3020, { haze: 0.62, skyC: sk, kind: "dead" }); }
      horizon(B, E, R, seed, { y: 280, a: 0 });
      ranges(B, { giant: 1.6, giantSnow: false, between: (k, b) => k === 1 && fog(B, b - 20, 40, mix(sk, 0xffffff, 0.2), 220, seed + 9, 80), n: 3, base: 336, amp: 80, col: 0x5a6e54, col1: 0x4a5a44, skyC: sk, seed, haze0: 0.6, haze1: 0.4, sharp: 0.6 });
      for (let i = 0; i < 7; i++) {
        const x = R(0, W), y = R(110, 240), w = R(34, 64);
        const bot = isle(B, x, y, w, 0x4a4030, 0x5a7a3a, o(0.48));
        for (let k = 0; k < 4; k++) { const rx = x + w * (0.15 + k * 0.23); rootDown(B, rx, bot(rx) - 4, R(30, 80), 2, 0x4a3a28, seed + i * 7 + k, o(0.48)); }
        tree(B, x + w * 0.5, y, 0.8, 0x3a4a30, 0x3a3020, { ...o(0.48), kind: "dead" });
      }
      fog(B, 300, 46, 0xc8d8b8, 180, seed);
    } else if (S === 1) {
      const f = land(B, { base: 356, amp: 22, col: 0x3a4430, cap: 0x4a6a30, skyC: sk, haze: 0.12, seed: seed + 3 });
      for (let i = 0; i < 2; i++) { const x = R(0, W), y = R(180, 240), w = R(90, 130), bot = isle(B, x, y, w, 0x4a3e2e, 0x5a7a3a, o(0.18)); for (let k = 0; k < 7; k++) { const rx = x + w * (0.08 + k * 0.13); rootDown(B, rx, bot(rx) - 6, R(40, 110), 3, 0x4a3828, seed + 40 + i * 9 + k, o(0.18)); } }
      for (let i = 0; i < 6; i++) { const x = R(0, W); tree(B, x, at(f, x) + 3, 1.4, 0x2e4a2a, 0x3a3020, { ...o(0.12), kind: i % 2 ? "dead" : "pine" }); }
      water(B, 352, 372, 0x2a3a34, 210);
    } else {
      const f = land(B, { base: 398, amp: 14, col: 0x2a3020, cap: 0x4a6a28, skyC: sk, seed: seed + 5, blades: 0.5, fringe: 0x8aaa4a });
      for (let x = 0; x < W; x += 2) if (hash(x, seed) > 0.45) { const gy = at(f, x) + 2, L = 10 + hash(x, seed, 1) * 26, lean = (hash(x, 3) - 0.5) * 0.3; for (let k = 0; k < L; k++) B.put(x + lean * k, gy - k, k > L - 6 && hash(x, 4) > 0.8 ? 0x6a4a2a : k % 5 ? 0x5a7a34 : 0x7a9a44); }
      for (let i = 0; i < 24; i++) glint(B, R(0, W), R(220, 390), 0xb0ff80, 1, 210);
    }
  },
  // ─────────── 지상 ───────────
  gm1_0(S, B, E, R, seed) { // 모스바크: 이끼 감긴 거목 기둥 숲 · 빛줄기 · 반딧불
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      sunRays(B, 420, -20, 7, 0xf0ffd8, 34, seed);
      for (let i = 0; i < 9; i++) { const x = R(0, W), w = R(28, 50); mass(B, x - 30, -4, w + 60, 360, (X, Y) => Math.abs(X - x - w / 2 - Math.sin(Y * 0.01 + i) * 6) < w / 2 * (1 - Y / 2000) + (Y > 300 ? ((Y - 300) / 40) ** 2 * 16 * (0.6 + 0.4 * Math.abs(Math.sin((X - x) * 0.12))) : 0), { col: 0x5a6a4a, round: w * 0.4, bump: 0.4, sc: 8, grooves: 0.55, ...o(0.6), seed: seed + i }); for (let y = 30; y < 330; y += R(18, 34)) { const mx = x + R(-2, w + 2), mw = R(5, 9), mh = R(3, 6); mass(B, mx - mw, y - mh, mw * 2, mh * 2, (X, Y) => (X - mx) ** 2 / (mw * mw) + (Y - y) ** 2 / (mh * mh) < 1 + (vn(X, Y, 2, 3) - 0.5) * 0.8, { col: 0x6aa048, round: 3, bump: 0.9, sc: 2, ...o(0.6) }); } }
      for (let i = 0; i < 5; i++) rays(B, R(0, W), R(16, 30), 360, 0xf0ffd8, 30, 0.25);
      fog(B, 310, 50, 0xd8f0e0, 200, seed);
    } else if (S === 1) {
      const f = land(B, { base: 350, amp: 26, col: 0x3a4a30, cap: 0x4e9436, skyC: sk, haze: 0.15, seed: seed + 3, blades: 0.4 });
      for (let i = 0; i < 5; i++) { const x = R(0, W), w = R(22, 34), gy = at(f, x + w / 2); mass(B, x - 26, -4, w + 52, gy + 8, (X, Y) => Math.abs(X - x - w / 2 - Math.sin(Y * 0.012 + i) * 4) < w / 2 + (Y > gy - 26 ? ((Y - gy + 26) / 26) ** 2 * 22 * (0.5 + 0.5 * Math.abs(Math.sin((X - x) * 0.15 + i))) : 0), { col: 0x5a4a34, round: w * 0.35, bump: 0.45, sc: 6, grooves: 0.7, ...o(0.15), seed: seed + 30 + i }); for (let k = 0; k < 2; k++) { const by = R(60, gy - 80), bd = k % 2 ? 1 : -1, bx = x + w / 2 + bd * w * 0.45; tube(B, [[bx, by], [bx + bd * 14, by - 8], [bx + bd * 22, by - 6]], 4, 2, 0x5a4a34, { seed: i * 3 + k, haze: 0.15, skyC: sk }); } for (let y = 20; y < gy - 10; y += R(10, 20)) { const mx = x + R(-2, w + 2), mw = R(5, 10), mh = R(3, 7); mass(B, mx - mw, y - mh, mw * 2, mh * 2, (X, Y) => (X - mx) ** 2 / (mw * mw) + (Y - y) ** 2 / (mh * mh) < 1 + (vn(X, Y, 2, 3) - 0.5) * 0.8, { col: 0x5aa040, round: 3, bump: 0.9, sc: 2, ...o(0.15) }); } }
      for (let i = 0; i < 6; i++) { const x = R(0, W); tree(B, x, at(f, x) + 2, 0.9, 0x3e7a30, 0x4a3a28, o(0.15)); }
    } else {
      const f = land(B, { base: 394, amp: 16, col: 0x2a3a20, cap: 0x4e9436, skyC: sk, seed: seed + 5, blades: 0.7 });
      for (let i = 0; i < 10; i++) { const x = R(0, W), gy = at(f, x) + 3, r = R(5, 10); mass(B, x - r, gy - r * 1.4, r * 2, r * 1.5, (X, Y) => (X - x) ** 2 + ((Y - gy + r * 0.5) * 1.3) ** 2 < r * r, { col: 0x3e7a30, round: r * 0.6, bump: 1, sc: 2.5 }); }
      for (let i = 0; i < 6; i++) { const x = R(0, W), gy = at(f, x) + 2; tube(B, [[x - 30, gy + 2], [x - 10, gy - 6], [x + 10, gy - 4], [x + 34, gy + 3]], 3, 2, 0x5a4a30, { seed: i }); }
      for (let i = 0; i < 60; i++) glint(B, R(0, W), R(80, 400), 0xe8f870, 1, 220);
    }
  },
  g2_0(S, B, E, R, seed) { // 글리머샌즈: 유리로 굳은 사구 · 무지갯빛 유리 메사 · 아지랑이 · 반쯤 묻힌 거대 유리 조각과 뼈
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    if (S === 0) {
      sunRays(B, 520, 40, 6, 0xffffff, 30, seed);
      crystals(B, 420, 340, 240, [0xa8e0ff, 0xe0c8ff, 0xffe8b0], { haze: 0.38, skyC: sk, glow: 0xffffff, rockCol: 0xd8b888, seed: seed + 400 });
      birds(B, R, 5, 200, 170, mix(0x4a3a2a, sk, 0.4));
      cirrus(B, R, seed, 0xffffff, 10, 160);
      glowSpot(B, 520, 60, 110, 0xffffff, 60);
      horizon(B, E, R, seed, { y: 270, sun: [520, 60] });
      const fs = ranges(B, { giant: 1.5, giantSnow: false, n: 3, base: 330, amp: 90, col: 0xe8d0a0, col1: 0xd8a870, skyC: sk, seed, haze0: 0.7, haze1: 0.38, sc: 240 });
      for (let i = 0; i < 5; i++) crystals(B, R(0, W), 338, R(60, 140), [0xc8f4ff, 0xf0d8ff, 0xfff0c0], { ...o(0.45), glow: 0xffffff, rockCol: 0xd0b080 });
      fog(B, 326, 22, 0xfff8e8, 170, seed);
    } else if (S === 1) {
      const f = land(B, { base: 356, amp: 40, col: 0xd0a060, cap: 0xf0d8a8, skyC: sk, haze: 0.1, seed: seed + 3, strata: 0.7, capH: 3, sc: 200 });
      for (let i = 0; i < 5; i++) { const x = R(0, W); crystals(B, x, at(f, x) + 6, R(34, 80), [0xc8f4ff, 0xf0d8ff, 0xd8ffe8], { ...o(0.1), glow: 0xffffff, rockCol: 0xc8a070 }); }
      { const x = R(0, W); ribcage(B, x, x + 160, at(f, x + 80) - 30, at(f, x + 80) + 6, 0xf0e8d8, { r: 4, ...o(0.12) }); }
      for (let y = 300; y < 356; y += 3) for (let x = 0; x < W; x++) Math.sin(x * 0.05 + y * 0.7) > 0.96 && B.put(x, y, 0xffffff, 50);
    } else {
      const f = land(B, { base: 398, amp: 16, col: 0xb08050, cap: 0xe8c890, skyC: sk, seed: seed + 5, strata: 0.9, capH: 3 });
      for (let i = 0; i < 6; i++) { const x = R(0, W); crystals(B, x, at(f, x) + 4, R(16, 30), [0xd8f8ff, 0xffe0f8], { glow: 0xffffff, rockCol: 0xa07848 }); }
      for (let i = 0; i < 120; i++) { const x = R(0, W); glint(B, x, at(f, x) + R(1, 30), [0xffffff, 0xc0f0ff, 0xffd8f8][i % 3], 1, 200); }
    }
  },
  gm2_0(S, B, E, R, seed) { // 블랙펜: 검은 늪 달밤 · 비틀린 거대 고목 · 달빛 비친 검은 물 · 겹 안개 · 도깨비불
    const sk = E.sky[1], o = (h) => ({ haze: h, skyC: sk });
    const moonX = 470, moonY = 90;
    if (S === 0) {
      tree(B, 300, 350, 7.5, 0x1a2018, 0x161c16, { haze: 0.35, skyC: sk, kind: "dead" });
      G.stars(B, 90, 220, seed);
      glowSpot(B, moonX, moonY, 90, 0xc8e8d0, 50), glowSpot(B, moonX, moonY, 46, 0xe0f8e8, 70);
      mass(B, moonX - 24, moonY - 24, 48, 48, (X, Y) => (X - moonX) ** 2 + (Y - moonY) ** 2 < 23 * 23, { col: 0xe8f0d8, round: 12, bump: 0.5, sc: 7, warm: 0xffffff, cool: 0x8a9a88, rimCol: 0xffffff });
      ranges(B, { n: 2, base: 330, amp: 70, col: 0x2a3832, col1: 0x1e2a24, skyC: sk, seed, haze0: 0.55, haze1: 0.35 });
      for (let i = 0; i < 10; i++) tree(B, R(0, W), 334, 2.2 + hash(i, seed) * 1.4, 0x2a3020, 0x2a2622, { ...o(0.5), kind: "dead" });
      fog(B, 318, 36, 0x9aac98, 190, seed);
    } else if (S === 1) {
      const f = land(B, { base: 350, amp: 18, col: 0x1e2620, cap: 0x2a3a20, skyC: sk, haze: 0.1, seed: seed + 3 });
      for (let i = 0; i < 5; i++) { const x = R(0, W); tree(B, x, at(f, x) + 3, 3 + hash(i, seed, 2) * 1.2, 0x2a3a22, 0x24201a, { ...o(0.12), kind: "dead" }); }
      water(B, 348, 380, 0x0c1410, 230);
      for (let y = 352; y < 378; y += 2) { const w = 26 - (y - 352) * 0.6; for (let i = -w; i < w; i++) hash(i | 0, y) > 0.45 && B.put(moonX + i + Math.sin(y) * 3, y, 0xd8f0e0, 120); }
      fog(B, 344, 22, 0xa8b8a8, 150, seed + 5);
      for (let i = 0; i < 12; i++) { const x = R(0, W), y = R(240, 340); glowSpot(B, x, y, 10, 0x90ffb0, 100); glint(B, x, y, 0xc0ffd0, 1, 255); }
    } else {
      const f = land(B, { base: 398, amp: 12, col: 0x101410, cap: 0x2a3a1a, skyC: sk, seed: seed + 5, blades: 0.5, fringe: 0x4a6a2a });
      for (let i = 0; i < 6; i++) { const x = R(0, W), gy = at(f, x) + 2; tube(B, [[x, gy], [x + 4, gy - 14], [x + 2, gy - 26], [x - 3, gy - 34]], 3, 1.2, 0x2a2420, { seed: i }); }
      for (let x = 0; x < W; x += 2) if (hash(x, seed + 1) > 0.6) { const gy = at(f, x) + 2, L = 8 + hash(x, seed, 1) * 20; for (let k = 0; k < L; k++) B.put(x + k * 0.12, gy - k, k > L - 5 && hash(x, 4) > 0.7 ? 0x4a3020 : k % 4 ? 0x2e3e22 : 0x3e5030); }
      for (let i = 0; i < 10; i++) { const x = R(0, W), y = R(300, 390); glowSpot(B, x, y, 14, 0x90ffb0, 90); glint(B, x, y, 0xd0ffe0, 1, 255); }
    }
  },
  // ─────────── 지하 ───────────
  g0_1(S, B, E, R, seed) { // 아이언베인: 녹슨 광산 — 주황 광맥 · 버팀목 갱도 · 등불
    if (S === 0) {
      caveBack(B, 0x4a4248, seed);
      for (let i = 0; i < 9; i++) { const cx = R(0, W), cy = R(40, 420); glowSpot(B, cx, cy, 30, 0xff9040, 40); for (let k = 0; k < 7; k++) { const x = cx + R(-22, 22), y = cy + R(-12, 12), r = R(2, 5); mass(B, x - r, y - r, r * 2 + 1, r * 2 + 1, (X, Y) => (X - x) ** 2 + (Y - y) ** 2 < r * r + vn(X, Y, 2, k) * 4, { col: k % 3 ? 0xc06a2a : 0xe8a050, round: 2, warm: 0xfff0c0, cool: 0x3a1a10 }); k % 2 || glint(B, x, y - 1, 0xffd090, 1, 220); } }
      for (let i = 0; i < 6; i++) glowSpot(B, R(0, W), R(100, 380), 40, 0xffa040, 40);
    } else if (S === 1) {
      stalac(B, 0x4a4248, 14, 70, seed + 1);
      const f = land(B, { base: 360, amp: 30, col: 0x4a4048, seed: seed + 3, strata: 0.4 });
      for (let i = 0; i < 4; i++) { const x = R(0, W), gy = at(f, x + 30); for (const dx of [0, 56]) tube(B, [[x + dx, gy + 2], [x + dx + (dx ? 2 : -2), gy - 80]], 3, 3, 0x7a5a34, { seed: i + dx, bump: 0.6, sc: 2 }); tube(B, [[x - 6, gy - 82], [x + 62, gy - 84]], 3.5, 3.5, 0x8a6438, { seed: i + 9, bump: 0.6, sc: 2 }); tube(B, [[x + 2, gy - 58], [x + 16, gy - 80]], 2, 2, 0x6a4a2c, { seed: i + 3 }); tube(B, [[x + 54, gy - 58], [x + 40, gy - 80]], 2, 2, 0x6a4a2c, { seed: i + 4 }); for (let j = 0; j < 8; j++) B.put(x + 28, gy - 80 + j, 0x2a2a2a); glowSpot(B, x + 28, gy - 68, 26, 0xffb060, 110); mass(B, x + 25, gy - 73, 7, 9, () => true, { col: 0xffc070, round: 2, glow: 0xfff0c0 }); }
    } else {
      const f = land(B, { base: 398, amp: 14, col: 0x3a3438, seed: seed + 5 });
      for (let i = 0; i < 10; i++) { const x = R(0, W), gy = at(f, x) + 3, r = R(4, 9); mass(B, x - r, gy - r * 1.5, r * 2, r * 1.6, (X, Y) => (X - x) ** 2 + ((Y - gy + r * 0.6) * 1.3) ** 2 < r * r, { col: i % 3 ? 0x5a4e50 : 0xa0602a, round: r * 0.5, bump: 0.6, sc: 3 }); }
      for (let x = 0; x < W; x += 1) { x % 14 < 4 && (B.put(x, at(f, x) - 2, 0x5a3e24), B.put(x, at(f, x) - 1, 0x3a2a18)); B.put(x, at(f, x) - 4, 0x9a9aa0), B.put(x, at(f, x) - 5, 0xc8c8d0); }
      caveFloor(B, f, 0x4a4248, R);
    }
  },
  g1_1(S, B, E, R, seed) { // 드립스톤: 종유석 대성당 · 비치는 지하 호수 · 물방울 빛
    if (S === 0) {
      caveBack(B, 0x2a4048, seed, { warm: 0xc0f0ff });
      stalac(B, 0x3a5058, 24, 160, seed + 1, { haze: 0.25, skyC: 0x10202a });
      for (let i = 0; i < 10; i++) stalag(B, R(0, W), 380, R(16, 30), R(60, 160), 0x3a5058, { haze: 0.25, skyC: 0x10202a });
    } else if (S === 1) {
      stalac(B, 0x5a7078, 16, 90, seed + 2, { drip: 0xa0f0ff });
      const f = land(B, { base: 352, amp: 24, col: 0x4a5a5a, seed: seed + 3, strata: 0.5 });
      for (let i = 0; i < 8; i++) { const x = R(0, W); stalag(B, x, at(f, x) + 3, R(10, 18), R(30, 70), 0x6a8080); }
      water(B, 356, 400, 0x1a5068, 235);
      for (let i = 0; i < 30; i++) glint(B, R(0, W), R(360, 398), 0xa0f0ff, 1, 160);
    } else {
      const f = land(B, { base: 404, amp: 10, col: 0x2a3434, seed: seed + 5 });
      for (let i = 0; i < 10; i++) { const x = R(0, W); stalag(B, x, at(f, x) + 3, R(6, 10), R(12, 30), 0x5a6a6a); }
      for (let i = 0; i < 30; i++) glint(B, R(0, W), R(40, 300), 0xa0f0ff, 1, 180);
      caveFloor(B, f, 0x4a5a5a, R);
    }
  },
  gm1_1(S, B, E, R, seed) { // 루트홀로우: 천장을 뚫고 내려온 굵은 고목 뿌리 · 초록 포자빛
    if (S === 0) {
      caveBack(B, 0x2e2232, seed, { warm: 0xd0ffd8 });
      for (let i = 0; i < 9; i++) rootDown(B, R(0, W), -10, R(200, 380), R(4, 9), 0x3a2a24, seed + i, { haze: 0.35, skyC: 0x16101a });
      for (let i = 0; i < 6; i++) glowSpot(B, R(0, W), R(80, 360), 50, 0x7af0a0, 30);
    } else if (S === 1) {
      for (let i = 0; i < 7; i++) rootDown(B, R(0, W), -10, R(250, 380), R(6, 12), 0x5a4030, seed + 30 + i);
      land(B, { base: 362, amp: 24, col: 0x3a2e28, cap: 0x4a3a28, seed: seed + 3 });
      for (let i = 0; i < 40; i++) glint(B, R(0, W), R(40, 360), 0x7af0a0, 1, 200);
    } else {
      const f = land(B, { base: 404, amp: 12, col: 0x221a16, cap: 0x3a2a1a, seed: seed + 5 });
      for (let i = 0; i < 5; i++) { const x = R(0, W), gy = at(f, x) + 3; tube(B, [[x - 40, gy + 4], [x - 15, gy - 8], [x + 15, gy - 6], [x + 45, gy + 4]], 5, 3, 0x5a3e2a, { seed: i }); }
      for (let i = 0; i < 30; i++) glint(B, R(0, W), R(200, 400), 0x7af0a0, 1, 220);
      caveFloor(B, f, 0x3a2e28, R);
    }
  },
  g0_2(S, B, E, R, seed) { // 섀도웰: 바닥 없는 심연 협곡 · 멀리 걸린 다리 · 보랏빛 어둠 입자
    if (S === 0) {
      caveBack(B, 0x2a2236, seed, { warm: 0xc8b0ff });
      for (let y = 200; y < B.h; y++) { const k = Math.min(1, (y - 200) / 160), mid = 325 + Math.sin(y * 0.03 + seed) * 18, hw = 18 + k * 70 + (fbm(0, y, 14, seed, 3) - 0.5) * 22; for (let x = Math.round(mid - hw); x < mid + hw; x++) { const e = Math.min(x - mid + hw, mid + hw - x); B.put(x, y, 0x030106, Math.round(255 * Math.min(1, k * 1.3) * Math.min(1, e / 16))); } }
      for (const [y, s2, hw] of [[262, 1, 60], [318, 2, 90], [372, 3, 110]]) { for (let x = 325 - hw; x < 325 + hw; x += 2) { const yy = y + Math.sin(((x - 325 + hw) / (2 * hw)) * Math.PI) * 10; hash(x >> 2, s2) > 0.12 && (B.put(x, yy, 0x7a6a8a), B.put(x + 1, yy, 0x6a5a7a), B.put(x, yy + 1, 0x2e2440)); } for (let x = 325 - hw; x < 325 + hw; x += 9) { const yy = y + Math.sin(((x - 325 + hw) / (2 * hw)) * Math.PI) * 10; for (let j = -8; j < 0; j++) B.put(x, yy + j, 0x4a3e5a, 120); } }
    } else if (S === 1) {
      stalac(B, 0x3a3048, 16, 70, seed + 2);
      land(B, { base: 360, amp: 30, col: 0x2a2236, seed: seed + 3, strata: 0.4 });
      for (let i = 0; i < 40; i++) glint(B, R(0, W), R(40, 360), 0xa080ff, 1, 180);
    } else {
      const f = land(B, { base: 404, amp: 12, col: 0x181220, seed: seed + 5 });
      for (let i = 0; i < 8; i++) { const x = R(0, W); stalag(B, x, at(f, x) + 3, R(8, 14), R(14, 34), 0x2e2440); }
      caveFloor(B, f, 0x2e2440, R);
    }
  },
  g1_2(S, B, E, R, seed) { // 본디프: 거대 짐승 뼈 협곡 — 등뼈와 갈비뼈 아치 · 해골 더미
    if (S === 0) {
      caveBack(B, 0x3e342c, seed, { warm: 0xffe8c8 });
      ribcage(B, -20, 420, 110, 370, 0x9a9080, { r: 7, haze: 0.4, skyC: 0x1a140e });
      ribcage(B, 400, 700, 150, 370, 0x9a9080, { r: 6, haze: 0.45, skyC: 0x1a140e });
    } else if (S === 1) {
      const f = land(B, { base: 360, amp: 26, col: 0x4a3e34, seed: seed + 3, strata: 0.4 });
      { const x = R(0, W); ribcage(B, x, x + 260, 190, at(f, x + 130) + 4, 0xd8d0c0, { r: 5 }); }
    } else {
      const f = land(B, { base: 404, amp: 12, col: 0x2a221c, seed: seed + 5 });
      for (let i = 0; i < 14; i++) { const x = R(0, W), gy = at(f, x) + 2; mass(B, x - 5, gy - 9, 10, 9, (X, Y) => (X - x) ** 2 / 16 + (Y - gy + 5) ** 2 / 14 < 1, { col: 0xe0d8c8, round: 3 }); B.put(x - 2, gy - 5, 0x181010), B.put(x + 1, gy - 5, 0x181010), B.put(x - 1, gy - 3, 0x302820); }
      for (let i = 0; i < 6; i++) { const x = R(0, W), gy = at(f, x) + 3; tube(B, [[x, gy], [x + 18, gy - 4]], 2, 2, 0xd8d0c0, { seed: i }); }
      caveFloor(B, f, 0x4a3e34, R);
    }
  },
  gm1_2(S, B, E, R, seed) { // 웹크로프트: 공동을 덮은 거미줄 · 매달린 고치 · 이슬 빛
    if (S === 0) {
      caveBack(B, 0x34343e, seed, { warm: 0xe8e8ff });
      for (let i = 0; i < 6; i++) web(B, R(0, W), R(70, 260), R(50, 90), 0xc8c8d8, 60, seed + i);
    } else if (S === 1) {
      stalac(B, 0x4a4a56, 14, 60, seed + 2);
      land(B, { base: 362, amp: 24, col: 0x34343e, seed: seed + 3 });
      for (let i = 0; i < 6; i++) { const x = R(0, W), y = R(80, 230); for (let j = 0; j < y; j++) B.put(x, j, 0xe0e0ea, 120); mass(B, x - 5, y, 10, 18, (X, Y) => (X - x) ** 2 / 20 + (Y - y - 9) ** 2 / 70 < 1, { col: 0xe8e4d8, round: 4, bump: 0.8, sc: 2, strata: 1.2 }); }
      for (let i = 0; i < 3; i++) web(B, R(0, W), R(120, 260), R(30, 50), 0xf0f0f8, 100, seed + 20 + i);
    } else {
      const f = land(B, { base: 404, amp: 12, col: 0x1e1e26, seed: seed + 5 });
      for (let i = 0; i < 3; i++) web(B, R(0, W), R(330, 390), R(22, 36), 0xf8f8ff, 120, seed + 40 + i);
      caveFloor(B, f, 0x3a3a46, R);
    }
  },
  g2_2(S, B, E, R, seed) { // 미러딥: 거울 수정 벽 · 서로 비추는 빛 기둥
    if (S === 0) {
      caveBack(B, 0x2a3450, seed, { warm: 0xd0f0ff });
      for (let i = 0; i < 6; i++) crystals(B, R(0, W), 384, R(120, 240), [0x8ab0e0, 0xb0a0e0, 0x9ac0f0], { haze: 0.35, skyC: 0x0e1424, rockCol: 0x2a3450 });
      for (let i = 0; i < 4; i++) rays(B, R(0, W), 14, 380, 0xc0e0ff, 26, 0.1);
    } else if (S === 1) {
      const f = land(B, { base: 360, amp: 24, col: 0x2a3450, seed: seed + 3 });
      for (let i = 0; i < 6; i++) { const x = R(0, W); crystals(B, x, at(f, x) + 4, R(40, 100), [0xc0e8ff, 0xe0c8ff, 0xffffff], { glow: 0xffffff, rockCol: 0x34405a }); }
      stalac(B, 0x5a6a90, 10, 50, seed + 4, { glow: 0x8ab0e0 });
    } else {
      const f = land(B, { base: 404, amp: 10, col: 0x161c2a, seed: seed + 5 });
      for (let i = 0; i < 8; i++) { const x = R(0, W); crystals(B, x, at(f, x) + 3, R(14, 28), [0xd8f0ff, 0xc8d8ff], { glow: 0xffffff, rockCol: 0x1e2638 }); }
      caveFloor(B, f, 0x2a3450, R);
    }
  },
  gm2_2(S, B, E, R, seed) { // 미스트혼: 동굴 속 죽은 숲 · 짙은 안개 띠 겹겹
    if (S === 0) {
      caveBack(B, 0x3a4644, seed, { warm: 0xe0f0f0 });
      for (let i = 0; i < 14; i++) tree(B, R(0, W), 360, 2 + hash(i, seed), 0x3a4040, 0x3a3838, { kind: "dead", haze: 0.45, skyC: 0x4a5654 });
      fog(B, 300, 60, 0xb0c0c0, 200, seed);
    } else if (S === 1) {
      const f = land(B, { base: 362, amp: 24, col: 0x2a3432, cap: 0x3a4a44, seed: seed + 3 });
      for (let i = 0; i < 7; i++) { const x = R(0, W); tree(B, x, at(f, x) + 3, 1.7, 0x3a4040, 0x3a3434, { kind: "dead", haze: 0.15, skyC: 0x4a5654 }); }
      fog(B, 340, 34, 0xc8d8d8, 190, seed + 1);
    } else {
      const f = land(B, { base: 406, amp: 10, col: 0x181e1e, seed: seed + 5 });
      fog(B, 396, 24, 0xd8e8e8, 170, seed + 2);
      caveFloor(B, f, 0x2a3432, R);
    }
  },
  g2_1(S, B, E, R, seed) { // 샌드글래스: 천장 틈에서 쏟아지는 모래 폭포 · 모래 더미 · 먼지 빛
    if (S === 0) {
      caveBack(B, 0x5a4a32, seed, { warm: 0xfff0c0 });
      for (let i = 0; i < 6; i++) { const x = R(0, W); rays(B, x - 10, 12, 360, 0xfff0c0, 22, 0.02); sandfall(B, x, 0, R(300, 380), R(6, 10), mix(0xe0c080, 0x1a140c, 0.35), 210); }
    } else if (S === 1) {
      stalac(B, 0x6a5638, 12, 60, seed + 2);
      const f = land(B, { base: 360, amp: 34, col: 0x8a6a40, cap: 0xd0a868, seed: seed + 3, strata: 0.8, capH: 3, sc: 160 });
      for (let i = 0; i < 3; i++) { const x = R(0, W); rays(B, x - 14, 18, 400, 0xfff0c0, 30, 0.02); sandfall(B, x, 0, at(f, x + 6), R(12, 18), 0xe8c888); }
    } else {
      const f = land(B, { base: 404, amp: 14, col: 0x5a4428, cap: 0xb08850, seed: seed + 5, strata: 0.9, capH: 3, sc: 160 });
      for (let i = 0; i < 40; i++) glint(B, R(0, W), R(100, 400), 0xfff0c0, 1, 150);
      caveFloor(B, f, 0x6a5232, R);
    }
  },
  gm2_1(S, B, E, R, seed) { // 마이어루트: 물에 잠긴 뿌리 굴 · 검푸른 물 반사 · 이끼 빛
    if (S === 0) {
      caveBack(B, 0x2a3e36, seed, { warm: 0xd0ffe8 });
      for (let i = 0; i < 10; i++) rootDown(B, R(0, W), -10, R(220, 380), R(4, 8), 0x2e2a20, seed + i, { haze: 0.35, skyC: 0x0c1614 });
    } else if (S === 1) {
      for (let i = 0; i < 7; i++) rootDown(B, R(0, W), -10, R(300, 380), R(6, 11), 0x4a3a28, seed + 40 + i);
      land(B, { base: 352, amp: 18, col: 0x2a3a30, cap: 0x3a5a30, seed: seed + 3 });
      water(B, 350, 400, 0x103a3a, 230);
      for (let i = 0; i < 30; i++) glint(B, R(0, W), R(60, 340), 0x80ffc0, 1, 190);
    } else {
      const f = land(B, { base: 406, amp: 10, col: 0x101a16, cap: 0x2a4a2a, seed: seed + 5, blades: 0.5, fringe: 0x5a8a3a });
      for (let x = 0; x < W; x += 3) if (hash(x, seed) > 0.6) { const gy = at(f, x) + 2, L = 8 + hash(x, 2) * 16; for (let k = 0; k < L; k++) B.put(x + k * 0.1, gy - k, k % 4 ? 0x4a7a3a : 0x6a9a4a); }
      caveFloor(B, f, 0x2a3a30, R);
    }
  },
};
// 배경 id ("z_" + 구역 id) → 화가
export const ZBG = Object.fromEntries(Object.keys(ZP).map((k) => ["z_" + k, k]));
export function paintZone(T, S, E, h, id) {
  const k = ZBG[id], B = G.buffer(W, T.h ?? 360), seed = h.int(1, 9999), R = (a, b) => h.int(a, b);
  ZP[k](S, B, E, R, seed);
  B.toHt(T);
}
// 구역별 배경 색 (하늘 위·아래 · 원경 · 중경 · 근경 · 빛)
export const ZPAL = {
  g0_m2: { sky: [0x6ab8e8, 0xf4e8ff], far: 0xb8c8e8, mid: 0x8ab8c8, near: 0x4a7a7a, glow: 0xffe8f8 },
  g1_m2: { sky: [0x4a3c3c, 0xe0a070], far: 0x7a6a64, mid: 0x4e4440, near: 0x2a2424, glow: 0xff9040 },
  gm1_m2: { sky: [0x5a9ac8, 0xe8f4d8], far: 0x8ab0a0, mid: 0x5a8a5a, near: 0x2e5a34, glow: 0xfff4d0 },
  gm2_m2: { sky: [0x3a2a5a, 0xe8b0d8], far: 0x8a6a9a, mid: 0x6a4a7a, near: 0x3a2a4a, glow: 0x90ffd0 },
  g2_m2: { sky: [0x6a4a3a, 0xffc070], far: 0xb08060, mid: 0x7a5a44, near: 0x40302a, glow: 0xffd080 },
  g2_m1: { sky: [0x8ab8d8, 0xfff0d0], far: 0xe0c8a0, mid: 0xd0a870, near: 0x9a7448, glow: 0xfff4d0 },
  gm2_m1: { sky: [0x3a5048, 0xb0c8a0], far: 0x6a7e64, mid: 0x4a5a40, near: 0x26301e, glow: 0xd8f0a0 },
  g2_0: { sky: [0x6aa8d8, 0xfff0d8], far: 0xd8c098, mid: 0xc8a068, near: 0x8a6a40, glow: 0xffffff },
  gm2_0: { sky: [0x10161a, 0x3a4a40], far: 0x2a3430, mid: 0x1e2620, near: 0x101410, glow: 0x90ffb0 },
  g0_2: { sky: [0x08060e, 0x2a2038], far: 0x2a2236, mid: 0x1c1626, near: 0x100c16 },
  g1_2: { sky: [0x14100e, 0x4a3e34], far: 0x3e342c, mid: 0x2c241e, near: 0x18140f },
  gm1_2: { sky: [0x121216, 0x3a3a44], far: 0x34343e, mid: 0x26262e, near: 0x16161c },
  g2_2: { sky: [0x0e1424, 0x3a4a6a], far: 0x34405a, mid: 0x262e44, near: 0x161c2a },
  gm2_2: { sky: [0x101614, 0x4a5654], far: 0x3a4644, mid: 0x2a3432, near: 0x181e1e },
  g2_1: { sky: [0x1a140c, 0x6a5638], far: 0x5a4a32, mid: 0x3e3222, near: 0x221a10 },
  gm2_1: { sky: [0x0c1614, 0x2e4a40], far: 0x2a3e36, mid: 0x1e2e28, near: 0x101a16 },
};
