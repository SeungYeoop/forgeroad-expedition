// 고품질 배경 화법 — 모든 형체를 "높이장"으로 보고 법선으로 빛을 받게 칠한다
//   · 형체 마스크 → 거리장(가장자리에서 얼마나 안쪽인지) → 둥근 높이 + 잡음 요철 → 법선 → 빛(왼쪽 위) → 6단 명암 램프 + 베이어 디더링
//   · 빛 받는 가장자리엔 밝은 테, 그늘 가장자리엔 짙은 외곽선, 멀수록 하늘색에 묻힘(대기 원근)
//   · 명암 램프는 밝은 쪽이 따뜻하게, 어두운 쪽이 차갑게 색이 돈다
import * as G3 from "./bg3d.js";
const W = 640;
export const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 주기 값 잡음 (가로 period마다 반복 → 배경이 끝없이 이어진다)
export const vn = (x, y, sc, seed, period = W) => {
  const n = Math.max(1, Math.round(period / sc)), fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), u0 = fx - ix, v0 = fy - iy;
  const u = u0 * u0 * (3 - 2 * u0), v = v0 * v0 * (3 - 2 * v0);
  const H = (a, b) => hash(((a % n) + n) % n, b, seed);
  const a = H(ix, iy), b = H(ix + 1, iy), c = H(ix, iy + 1), d = H(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export const fbm = (x, y, sc, seed, oct = 4) => {
  let s = 0, a = 1, t = 0;
  for (let k = 0; k < oct; k++) (s += vn(x, y, sc / 2 ** k, seed + k * 17) * a), (t += a), (a *= 0.5);
  return s / t;
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const dith = (x, y) => BAYER[(((y & 3) << 2) | (x & 3)) >>> 0];
// 6단 램프: 0 = 가장 밝음(따뜻한 빛) … 5 = 가장 어두움(차가운 그늘)
export function ramp(c, warm = 0xfff0d0, cool = 0x1c1430) {
  return [mix(sh(c, 0.5), warm, 0.25), mix(sh(c, 0.25), warm, 0.1), c, mix(sh(c, -0.25), cool, 0.12), mix(sh(c, -0.45), cool, 0.25), mix(sh(c, -0.65), cool, 0.4)];
}
// 밝기 I(0~1) → 램프 색 (디더링으로 단 사이를 섞는다)
export function tone(R, I, x, y) {
  const f = Math.max(0, Math.min(1, 1 - I)) * (R.length - 1), b = Math.floor(f);
  return R[Math.min(R.length - 1, b + (f - b > dith(x, y) ? 1 : 0))];
}
const LX = -0.55, LY = -0.68, LZ = 0.48;

// ── 입체 덩어리: inside(px, py) 마스크로 정한 형체를 높이장으로 칠한다 ──
//   o: { col, R(램프 직접), round(둥근 정도 px), bump(요철), sc(요철 크기), strata(가로 결), haze, skyC, rim, glow(속빛 색), seed, light }
export function mass(B, x0, y0, w, h, inside, o = {}) {
  x0 = Math.floor(x0), y0 = Math.floor(y0), w = Math.ceil(w), h = Math.ceil(h);
  if (w < 2 || h < 2) return;
  const M = new Uint8Array(w * h), D = new Float32Array(w * h);
  const wp = o.warp ?? 1.6, ws = o.wsc ?? 6, ws0 = (o.seed ?? 1) + 77;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X = x0 + i, Y = y0 + j, dx = wp ? (vn(X, Y, ws, ws0) - 0.5) * 2 * wp : 0, dy = wp ? (vn(X, Y, ws, ws0 + 1) - 0.5) * 2 * wp : 0;
    M[j * w + i] = inside(X + dx, Y + dy) ? 1 : 0;
  }
  // 거리장 (두 번 훑는 근사)
  const INF = 1e4;
  for (let k = 0; k < w * h; k++) D[k] = M[k] ? INF : 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i;
    if (!M[k]) continue;
    const l = i > 0 ? D[k - 1] : 0, u = j > 0 ? D[k - w] : 0, ul = i > 0 && j > 0 ? D[k - w - 1] : 0, ur = i < w - 1 && j > 0 ? D[k - w + 1] : 0;
    D[k] = Math.min(D[k], l + 1, u + 1, ul + 1.414, ur + 1.414);
  }
  for (let j = h - 1; j >= 0; j--) for (let i = w - 1; i >= 0; i--) {
    const k = j * w + i;
    if (!M[k]) continue;
    const r = i < w - 1 ? D[k + 1] : 0, d = j < h - 1 ? D[k + w] : 0, dr = i < w - 1 && j < h - 1 ? D[k + w + 1] : 0, dl = i > 0 && j < h - 1 ? D[k + w - 1] : 0;
    D[k] = Math.min(D[k], r + 1, d + 1, dr + 1.414, dl + 1.414);
  }
  const rd = o.round ?? Math.max(3, Math.min(w, h) * 0.3), bump = o.bump ?? 0.22, sc = o.sc ?? 12, seed = o.seed ?? 1;
  const R = o.R ?? ramp(o.col ?? 0x808080, o.warm, o.cool), skyC = o.skyC ?? 0, haze = o.haze ?? 0, L = o.light ?? [LX, LY, LZ];
  const Hf = (i, j) => {
    if (i < 0 || j < 0 || i >= w || j >= h) return 0;
    const k = j * w + i;
    if (!M[k]) return 0;
    const t = Math.min(1, D[k] / rd), dome = Math.sqrt(1 - (1 - t) * (1 - t));
    const X = x0 + i, Y = y0 + j;
    let n = (fbm(X, Y, sc, seed, 3) - 0.5) * bump;
    if (o.strata) n += Math.sin(Y * o.strata + fbm(X, Y, 40, seed + 9, 2) * 6) * 0.08;
    if (o.grooves) n += Math.sin(X * o.grooves + fbm(X, Y * 0.15, 20, seed + 13, 2) * 7) * 0.09;
    return dome + n * t;
  };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i;
    if (!M[k]) continue;
    const X = x0 + i, Y = y0 + j;
    const gx = (Hf(i + 1, j) - Hf(i - 1, j)) * rd * 0.5, gy = (Hf(i, j + 1) - Hf(i, j - 1)) * rd * 0.5;
    const nl = Math.hypot(gx, gy, 1), nx = -gx / nl, ny = -gy / nl, nz = 1 / nl;
    let I = 0.42 + (nx * L[0] + ny * L[1] + nz * L[2]) * 0.62;
    // 아래로 갈수록 살짝 어둡게 (땅에 붙은 그늘), 테두리 처리
    if (o.fadeDown) I -= Math.max(0, (j / h - 0.5)) * o.fadeDown;
    let c = tone(R, I, X, Y);
    const edge = D[k] <= 1.01;
    if (edge) c = nx * L[0] + ny * L[1] > 0.15 && o.rim !== false ? (o.rimCol ?? R[0]) : R[5];
    if (o.glow && D[k] > rd * 0.6) c = mix(c, o.glow, Math.min(0.6, (D[k] - rd * 0.6) / (rd * 2)));
    B.put(X, Y, haze ? mix(c, skyC, haze) : c, o.a ?? 255);
  }
}
// ── 능선 땅 (중경·근경 바닥): 위 모양 f(x), 위 덮개(풀·모래·이끼) + 아래 바위 결 ──
export function land(B, o) {
  const { base, amp, col, cap, skyC = 0, haze = 0, seed = 1, sc = 110, capH = 5, blades = 0, fringe } = o;
  const f = (x) => base - amp * (vn(x, 0, sc, seed) * 0.62 + vn(x, 0, sc / 3, seed + 3) * 0.28 + vn(x, 0, sc / 9, seed + 5) * 0.1);
  const R = ramp(col), C = cap ? ramp(cap) : null;
  for (let x = 0; x < W; x++) {
    const y0 = Math.round(f(x)), sl = f(x + 2) - f(x - 2);
    for (let y = y0; y < B.h; y++) {
      const t = y - y0;
      let c;
      if (C && t < capH + vn(x, 1, 6, seed + 7) * 3) {
        const I = 0.75 - t * 0.07 + (sl > 0.4 ? -0.18 : sl < -0.4 ? 0.12 : 0) + (fbm(x, y, 8, seed + 2, 2) - 0.5) * 0.3;
        c = tone(C, I, x, y);
      } else {
        // 바위 결: 기울어진 판 (요철 잡음의 가로 변화로 면 방향)
        const n1 = fbm(x + t * 0.6, y * 1.3, 34, seed + 11, 3), n2 = fbm(x + 2 + t * 0.6, y * 1.3, 34, seed + 11, 3);
        let I = 0.55 + (n1 - n2) * 3.2 - Math.min(0.45, t / 260) + (sl < -0.4 ? 0.08 : sl > 0.4 ? -0.1 : 0);
        o.strata && (I += Math.sin(y * o.strata + fbm(x, y, 30, seed, 2) * 5) * 0.08);
        c = tone(R, I, x, y);
      }
      B.put(x, y, haze ? mix(c, skyC, haze * (1 - Math.min(1, t / 200) * 0.3)) : c);
    }
    // 풀잎·결 끝 (능선 위로 솟는 1~4px)
    if (blades && hash(x, 5, seed) < blades) {
      const L = 1 + Math.floor(hash(x, 6, seed) * 4), bc = fringe ?? (C ? C[0] : R[0]);
      for (let k = 1; k <= L; k++) B.put(x + (k > 2 && hash(x, 7, seed) > 0.5 ? 1 : 0), y0 - k, haze ? mix(k === L ? bc : C ? C[1] : R[1], skyC, haze) : k === L ? bc : C ? C[1] : R[1]);
    }
  }
  return f;
}
// ── 산맥 여러 겹 (원경의 주인공) ──
//   능선: 날카롭게 갈라지는 봉우리(릿지 잡음) · 면: 능선 기울기로 빛 받는 면/그늘 면 + 세로로 흘러내린 골짜기 결
//   눈: 꼭대기에서 골 따라 흘러내림 · 겹: 요청 수 + 아주 먼 겹 둘, 겹 밑마다 골짜기 안개가 고인다 · 멀수록 하늘에 묻힌다
export function ranges(B, o) {
  const { base, amp, col, skyC, seed = 1, snow = 0 } = o, n = (o.n ?? 3) + 2, fs = [], sharp = o.sharp ?? 1;
  const h0 = Math.min(0.9, (o.haze0 ?? 0.6) + 0.22), h1 = o.haze1 ?? 0.25, lum = (((skyC >> 16) & 255) + ((skyC >> 8) & 255) + (skyC & 255)) / 765, fogC = o.fog ?? (lum > 0.45 ? mix(skyC, 0xffffff, 0.25) : skyC);
  const S5 = ramp(0xf4f8ff, 0xffffff, 0x7080b0);
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), hz = h0 + (h1 - h0) * t, sd = seed + k * 31;
    const b = base - (n - 1 - k) * 9 + (o.step ?? 0) * k * 0.3, a = amp * (1.2 - t * 0.5) * (k < 2 ? o.giant ?? 1 : 1), sc = (o.sc ?? 150) * (1.25 - t * 0.55);
    const P = (x) => {
      let p = 0, w = 0.62, f = 1;
      for (let q = 0; q < 4; q++) { const r = 1 - Math.abs(2 * vn(x, 0, sc / f, sd + q) - 1); p += Math.pow(r, 1 + sharp * 0.8) * w; w *= 0.5; f *= 2.3; }
      return p / 1.05;
    };
    const f = (x) => b - a * P(x);
    const R = ramp(mix(col, o.col1 ?? col, t), o.warm ?? 0xfff0d8, o.cool ?? 0x30284a);
    const gs = 7 + t * 5;
    const Gf = (x, y) => 1 - Math.abs(2 * vn(x, y * 0.55, gs, sd + 9) - 1);
    for (let x = 0; x < W; x++) {
      const y0 = Math.round(f(x)), sl = (f(x + 3) - f(x - 3)) / 6, snowD = a * 0.32 * (0.5 + vn(x, 2, 30, sd + 4));
      for (let y = y0; y < Math.min(B.h, b + 160); y++) {
        const d = y - y0, gx = Gf(x + 1, y) - Gf(x - 1, y);
        const near = Math.exp(-d / 45);
        const fg = (xx) => fbm(xx + d * 0.85, y * 0.5, 30, sd + 5, 3) + fbm(xx - d * 0.6, y * 0.6, 13, sd + 6, 2) * 0.25;
        let I = 0.56 - sl * 1.6 * Math.exp(-d / 16) + gx * 1.1 * near + (fg(x + 1) - fg(x - 1)) * 9 * (1 - near * 0.5) - d / 420;
        d < 1 && (I += sl < 0 ? 0.3 : 0.1);
        const onSnow = (snow || (o.giant && k < 2 && o.giantSnow !== false)) && d < snowD * (0.7 + gx * 2) && (y0 < b - a * 0.35);
        const c = tone(onSnow ? S5 : R, onSnow ? I + 0.25 : I, x, y);
        const pool = Math.min(1, Math.max(0, (y - (b - a * 0.15)) / 90)) * 0.45;
        B.put(x, y, mix(c, fogC, Math.min(1, hz + (1 - hz) * pool)));
      }
    }
    k < n - 1 && fog(B, b - 4, 16, fogC, Math.round(150 * (1 - t * 0.6)), sd + 3, 50);
    o.between && o.between(k, b, a);
    fs.push(f);
  }
  return fs.slice(2);
}
// ── 안개 띠 (잡음으로 흐르는 결) ──
export function fog(B, y, hgt, c, a, seed, sc = 60) {
  for (let yy = Math.max(0, Math.floor(y - hgt)); yy < Math.min(B.h, y + hgt); yy++) {
    const k = 1 - Math.abs(yy - y) / hgt;
    for (let x = 0; x < W; x++) {
      const n = fbm(x, yy * 2.5, sc, seed, 3);
      const v = Math.max(0, n - 0.35) / 0.65;
      v > 0 && B.put(x, yy, c, Math.round(a * k * k * v));
    }
  }
}
// ── 빛줄기 (위에서 비스듬히, 아래로 옅어짐) ──
export function rays(B, x, w, len, c, a, ang = 0.35) {
  for (let j = 0; j < len; j++) {
    const k = 1 - j / len, cx = x + j * ang, hw = w * (0.5 + j / len * 0.7);
    for (let i = -hw; i <= hw; i++) B.put(cx + i, j, c, Math.round(a * k * (1 - Math.abs(i) / hw)));
  }
}
// ── 빛나는 점 (빛무리 포함) ──
export function glint(B, x, y, c, r = 2, a = 255) {
  for (let j = -r * 2; j <= r * 2; j++) for (let i = -r * 2; i <= r * 2; i++) {
    const d = Math.hypot(i, j);
    d < r * 2 && B.put(x + i, y + j, c, Math.round(a * 0.25 * (1 - d / (r * 2))));
  }
  B.put(x, y, 0xffffff, a), B.put(x - 1, y, c, a), B.put(x + 1, y, c, a), B.put(x, y - 1, c, a), B.put(x, y + 1, c, a);
}
// ── 수정: 면 셋(빛 면·정면·그늘 면)의 경계가 결정마다 다르고, 끝이 비스듬히 깨지고, 속에 금이 간다 ──
export function crystal(B, cx, gy, w, h, col, o = {}) {
  const sd = o.seed ?? ((cx * 7 + h * 13) | 0), R = ramp(col, 0xffffff, o.cool ?? 0x302060), hz = o.haze ? (c) => mix(c, o.skyC, o.haze) : (c) => c;
  const lean = o.lean ?? 0, tip = h * (0.16 + hash(sd, 4) * 0.22), tipOff = (hash(sd, 1) - 0.5) * w * 0.7;
  const u0 = -0.45 + hash(sd, 2) * 0.3, u1 = 0.1 + hash(sd, 3) * 0.35, crack = h * (0.3 + hash(sd, 5) * 0.4), cs = (hash(sd, 6) - 0.5) * 1.6;
  for (let j = 0; j < h; j++) {
    const yy = gy - j, inTip = j > h - tip, t = inTip ? (h - j) / tip : 1;
    const half = (w / 2) * (inTip ? t : 1 - (j / h) * 0.12) * (1 + (vn(j, sd, 5, sd) - 0.5) * 0.18);
    const sx = cx + lean * j + (inTip ? tipOff * (1 - t) : 0);
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const u = i / Math.max(1, half);
      let L = u < u0 ? 0.95 : u < u1 ? 0.62 : 0.28;
      inTip && (L += u < tipOff / w ? 0.12 : -0.08);
      L += -(j / h) * 0.1 + (1 - j / h) * 0.08 * (o.inner ? 1 : 0);
      let c = tone(R, L, sx + i, yy);
      Math.abs(i) >= Math.ceil(half) && (c = R[5]);
      (Math.abs(u - u0) < 0.07 || Math.abs(u - u1) < 0.05) && (c = mix(c, 0xffffff, 0.4));
      Math.abs(j - crack - i * cs) < 0.6 && Math.abs(i) < half - 1 && (c = mix(c, 0xffffff, 0.55));
      B.put(sx + i, yy, hz(c), o.a ?? 255);
    }
  }
  o.glow && glint(B, Math.round(cx + lean * h + tipOff * 0.8), Math.round(gy - h + 2), o.glow, 1, 220);
}
// 수정 무리: 큰 결정 하나 + 바깥으로 기운 작은 결정들 + 박힌 바위 둔덕
export function crystals(B, x, gy, size, cols, o = {}) {
  const sd = o.seed ?? (x | 0), n = 3 + Math.floor(hash(sd, 9) * 4);
  for (let k = n - 1; k >= 0; k--) {
    const main = k === 0, side = k % 2 ? -1 : 1, f = main ? 1 : 0.3 + hash(sd, k) * 0.45;
    crystal(B, x + (main ? 0 : side * size * (0.25 + hash(k, sd) * 0.4)), gy + 2, Math.max(3, size * 0.32 * f), size * f * (main ? 1 : 0.9), cols[k % cols.length], { ...o, lean: (main ? (hash(sd, 7) - 0.5) * 0.15 : side * (0.15 + hash(sd, k + 3) * 0.35)), seed: sd + k * 11 });
  }
  if (o.rock !== false) mass(B, x - size * 0.45, gy - size * 0.14, size * 0.9, size * 0.2, (X, Y) => ((X - x) / (size * 0.42)) ** 2 + ((Y - gy) / (size * 0.13)) ** 2 < 1, { col: o.rockCol ?? 0x6a6478, round: 3, bump: 0.6, sc: 3, haze: o.haze, skyC: o.skyC, seed: sd });
}
// ── 나무: 잎 덩어리를 높이장으로 (빛 방향 음영 + 잎결) ──
export function tree(B, x, gy, s, leaf, trunk, o = {}) {
  const hz = o.haze ?? 0, skyC = o.skyC ?? 0, kind = o.kind ?? "round";
  const tw = Math.max(2, Math.round(3 * s)), th = Math.round((kind === "tall" ? 34 : 20) * s);
  mass(B, x - tw / 2 - 1, gy - th, tw + 2, th + 2, (X, Y) => Math.abs(X - x + Math.sin(Y * 0.2) * 0.6) < tw / 2 + (Y > gy - 4 ? 1.5 : 0), { col: trunk, round: 2, bump: 0.2, haze: hz, skyC, rim: false });
  if (kind === "dead") {
    // 비틀린 고목: 밑동이 퍼진 줄기 + 두 단계로 갈라지며 가늘어지는 가지 (모두 둥근 관)
    const limb = (x0, y0, ang, len, r, depth, sd) => {
      const pts = [];
      for (let k = 0; k <= 6; k++) pts.push([x0 + Math.cos(ang + Math.sin(k * 0.9 + sd) * 0.18) * (len * k) / 6, y0 + Math.sin(ang + Math.sin(k * 0.9 + sd) * 0.18) * (len * k) / 6]);
      const n = pts.length - 1;
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (const [px, py] of pts) (bx0 = Math.min(bx0, px)), (by0 = Math.min(by0, py)), (bx1 = Math.max(bx1, px)), (by1 = Math.max(by1, py));
      const rr = r + 2;
      mass(B, bx0 - rr, by0 - rr, bx1 - bx0 + 2 * rr, by1 - by0 + 2 * rr, (X, Y) => {
        for (let k = 0; k < n; k++) {
          const [ax, ay] = pts[k], [cx, cy] = pts[k + 1], dx = cx - ax, dy = cy - ay, L2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((X - ax) * dx + (Y - ay) * dy) / L2));
          if (Math.hypot(X - ax - dx * t, Y - ay - dy * t) < r * (1 - ((k + t) / n) * 0.6)) return true;
        }
        return false;
      }, { col: trunk, round: Math.max(1.5, r * 0.8), bump: 0.5, sc: 3, haze: hz, skyC, seed: sd, rim: r > 1.5 });
      if (depth > 0) {
        const [ex, ey] = pts[n], [mx, my] = pts[3];
        limb(mx, my, ang - 0.6 - hash(sd, 1) * 0.4, len * 0.55, r * 0.55, depth - 1, sd + 3);
        limb(ex, ey, ang + 0.5 + hash(sd, 2) * 0.4, len * 0.5, r * 0.5, depth - 1, sd + 5);
        limb(ex, ey, ang - 0.2, len * 0.45, r * 0.45, depth - 1, sd + 7);
      }
    };
    const r0 = Math.max(2, 2.6 * s);
    mass(B, x - r0 * 3, gy - r0 * 2, r0 * 6, r0 * 2 + 2, (X, Y) => Math.abs(X - x) < r0 * (1 + Math.pow(Math.max(0, (Y - gy + r0 * 2) / (r0 * 2)), 2) * 2), { col: trunk, round: r0, bump: 0.5, sc: 3, haze: hz, skyC, rim: false });
    limb(x, gy, -Math.PI / 2 + (hash(x | 0, 3) - 0.5) * 0.3, 30 * s, r0, 2, x | 0);
    return;
  }
  if (kind === "pine") {
    // 층마다 아래 끝이 톱니처럼 처진 가지 다발, 층 크기·기울기가 제각각
    const tiers = 4 + Math.floor(hash(x | 0, 5) * 3), H = 46 * s, top = gy - th * 0.4 - H;
    for (let k = 0; k < tiers; k++) {
      const ty = top + (H * k) / tiers, th2 = (H / tiers) * 1.7, hw = (5 + (k / tiers) * 13) * s * (0.85 + hash(k, x | 0) * 0.3), sk = (hash(x | 0, k) - 0.5) * 3 * s;
      mass(B, x - hw - 4 + sk, ty - 2, hw * 2 + 8, th2 + 4, (X, Y) => {
        const t = (Y - ty) / th2, half = hw * Math.pow(Math.max(0, t), 0.8), saw = Math.abs(((X - x) / (3 * s)) % 1 - 0.5) * 2 * 3 * s;
        return t >= 0 && Math.abs(X - x - sk * t) < half && Y < ty + th2 - saw * (Math.abs(X - x) / Math.max(1, hw));
      }, { col: k % 2 ? leaf : sh(leaf, -0.06), round: 2.5 * s, bump: 0.8, sc: 2.5, haze: hz, skyC, seed: (x | 0) + k });
    }
    return;
  }
  const r = 13 * s, cy = gy - th - r * 0.6;
  const C = [[0, 0, 1], [-0.75, 0.35, 0.72], [0.8, 0.3, 0.75], [-0.3, -0.55, 0.7], [0.4, -0.5, 0.68]];
  mass(B, x - r * 2, cy - r * 1.6, r * 4, r * 3, (X, Y) => C.some(([dx, dy, k]) => (X - x - dx * r) ** 2 + (Y - cy - dy * r) ** 2 < (k * r) ** 2 * (0.9 + 0.2 * vn(X, Y, 3, 7))), { col: leaf, round: r * 0.7, bump: 0.9, sc: 3.5, haze: hz, skyC, seed: x | 0 });
}
// ── 떠 있는 섬: 울퉁불퉁 처진 밑면 + 종유석처럼 늘어진 바위 + 아래 떠도는 파편 + 윗면 덮개와 처마 ──
export function isle(B, x, y, w, rock, cap, o = {}) {
  const d = o.depth ?? w * 0.7, sd = o.seed ?? ((x * 7 + y) | 0), hz = o.haze ?? 0, skyC = o.skyC ?? 0;
  const drips = [];
  for (let k = 0; k < 2 + Math.floor(hash(sd, 1) * 3); k++) drips.push([0.2 + hash(sd, k + 2) * 0.6, 0.25 + hash(k, sd) * 0.5, 0.04 + hash(sd, k + 9) * 0.05]);
  const bot = (X) => {
    const u = (X - x) / w;
    if (u < 0 || u > 1) return y;
    let b = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.65) * (0.55 + 0.6 * fbm(X, 0, 16, sd, 3));
    for (const [c, a, wd] of drips) b += a * Math.exp(-(((u - c) / wd) ** 2));
    return y + 3 + d * b;
  };
  const top = (X) => y + (vn(X, 1, 9, sd) - 0.5) * 2;
  const lip = (Y) => Math.min(w * 0.12, (Y - y) * 0.18) * (0.6 + vn(Y, 3, 7, sd));
  mass(B, x - 4, y - 3, w + 8, d * 1.9 + 10, (X, Y) => Y > top(X) + 1 && Y < bot(X) && X > x + lip(Y) && X < x + w - lip(Y + 50), { col: rock, round: Math.min(10, w * 0.14), bump: 0.7, sc: 6, strata: o.strata ?? 0.3, haze: hz, skyC, seed: sd, fadeDown: 0.45, warp: 2.2 });
  for (let k = 0; k < 1 + Math.floor(hash(sd, 20) * 3); k++) {
    const fx = x + w * (0.2 + hash(sd, k + 21) * 0.6), fy = bot(fx) + 6 + hash(k, sd, 2) * 16, r = 2 + hash(sd, k + 25) * Math.min(7, w * 0.06);
    mass(B, fx - r - 2, fy - r - 2, r * 2 + 4, r * 2.6 + 4, (X, Y) => ((X - fx) / r) ** 2 + ((Y - fy) / (r * 1.2)) ** 2 < 1, { col: rock, round: r * 0.6, bump: 0.8, sc: 3, haze: hz, skyC, seed: sd + k });
  }
  if (cap) {
    const C = ramp(cap);
    for (let X = x - 2; X < x + w + 2; X++) {
      const t0 = Math.round(top(X)), dr = hash(X, 3, sd) > 0.82 ? 2 + Math.floor(hash(X, 4, sd) * 5) : 0;
      for (let j = -1; j < 4 + (X < x + 3 || X > x + w - 3 ? dr : 0) + (hash(X, 5, sd) > 0.9 ? dr : 0); j++) B.put(X, t0 + j, mix(j < 0 ? (hash(X, 3, sd) > 0.5 ? C[1] : C[0]) : tone(C, 0.9 - j * 0.18, X, t0 + j), skyC, hz));
    }
  }
  if (o.roots) for (let X = x + 3; X < x + w - 3; X += 2 + Math.floor(hash(X, sd) * 5)) {
    if (hash(X, sd, 2) > o.roots) continue;
    const L = 6 + hash(X, sd, 3) * d * 0.7;
    for (let k = 0; k < L; k++) B.put(X + Math.round(Math.sin(k * 0.3 + X) * 1.2), bot(X) - 2 + k, mix(k % 4 ? o.rootCol ?? 0x5a3e28 : sh(o.rootCol ?? 0x5a3e28, 0.2), skyC, hz));
  }
  return bot;
}
// ── 물 띠: 위 그림을 거꾸로 비춘 반사 + 물결 줄 ──
export function water(B, y0, y1, col, a = 200) {
  for (let y = y0; y < Math.min(B.h, y1); y++) for (let x = 0; x < W; x++) {
    const sy = 2 * y0 - y - 1 + Math.round(Math.sin(x * 0.15 + y * 0.6) * 1.5);
    const i = sy * W + (((x % W) + W) % W);
    const refl = sy >= 0 && B.al[i] ? B.col[i] : col;
    let c = mix(refl, col, 0.55 + (y - y0) / (y1 - y0) * 0.3);
    (y + Math.round(vn(x, y, 20, 3) * 6)) % 5 === 0 && (c = mix(c, 0xffffff, 0.18));
    B.put(x, y, c, a);
  }
}
export const each = (x, fn) => [-W, 0, W].forEach((dx) => fn(x + dx));

// ── 동굴 겹: 위에서 내려온 천장 바위(산맥을 뒤집어)와 아래 바닥 바위를 먼 겹부터 — 먼 겹은 어둠에 묻힌다 ──
export function caveRanges(B, o) {
  const { n = 3, col, dark, seed = 1, ceil = 120, floor = 360, amp = 90 } = o;
  for (let k = 0; k < n; k++) {
    const t = k / Math.max(1, n - 1), hz = 0.72 - t * 0.5, c = mix(col, o.col1 ?? col, t);
    const T = G3.buffer(W, B.h);
    G3.mountains(T, { base: B.h - ceil - k * 22, amp: amp * (1.1 - t * 0.3), col: c, skyC: dark, haze: hz, seed: seed + k * 13 + 5, sc: 70 + k * 20 });
    for (let y = 0; y < B.h; y++) for (let x = 0; x < W; x++) { const i = (B.h - 1 - y) * W + x; T.al[i] && B.put(x, y, T.col[i]); }
    G3.mountains(B, { base: floor + k * 16, amp: amp * (0.9 - t * 0.3), col: c, skyC: dark, haze: hz, seed: seed + k * 17, sc: 90 + k * 25 });
  }
}
