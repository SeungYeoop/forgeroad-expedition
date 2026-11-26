// 식물 소품 (거점 화풍, DOM 없이 픽셀 버퍼만 — 지형 작업 스레드에서도 돈다)
//   잎 뭉치 활엽수 · 톱니 가지 침엽수 · 마른 나무 · 덤불 · 잎 덤불 · 고사리 · 들꽃
//   3D 거리 함수 대신 거점(hubpaint)의 붓으로 그린다: 큰 잎 뭉치(톱니 가장자리·밑면 그늘), 층마다 늘어진 가지 끝, 결 있는 줄기
import { mix, sh, hash, vn } from "./bgart.js";
import { canopy } from "./hubpaint.js";

// 원색을 흙빛 쪽으로 (레퍼런스 팔레트)
const mute = (c, k = 0.25) => mix(c, 0x6e5e48, k);
// 5단 램프: 밝음은 따뜻하게, 그늘은 차갑게 (보라로 치우치지 않게)
export const R5 = (c) => [mix(sh(c, 0.34), 0xffe6c0, 0.18), sh(c, 0.13), c, mix(sh(c, -0.32), 0x262036, 0.18), mix(sh(c, -0.56), 0x161220, 0.3)];
const T5 = (p, v) => p[v > 0.55 ? 0 : v > 0.18 ? 1 : v > -0.22 ? 2 : v > -0.58 ? 3 : 4];
const tx = (x, y, s = 1, k = 0) => ((hash(x >> 1, y >> 1, 77 + k) - 0.5) * 0.55 + (vn(x, y, 8, 78 + k) - 0.5) * 0.7) * s;
const BARK = R5(0x6e4e32), DEADB = R5(0x7a6a58);

// 줄기: 아래가 굵고 뿌리가 퍼진다, 세로 결, 오른쪽 그늘, 가지 몇 개가 수관 속으로
function trunk(B, x, g, h, w, seed, P = BARK, nb = 4) {
  for (let y = 0; y < h; y++) {
    const t = y / h, half = (w / 2) * (1 - t * 0.45) + (y < 8 ? (8 - y) * 0.7 * (w / 10) : 0), bx = x + Math.sin(t * 2.2 + seed) * w * 0.25;
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
      const u = i / Math.max(1, half), X = Math.round(bx + i), Y = g - y;
      let v = 0.35 - u * 0.85 + tx(X, Y >> 2, 0.8, seed & 31);
      Math.abs(u) > 0.86 && (v = u < 0 ? -0.3 : -0.95);
      B.put(X, Y, T5(P, v));
    }
  }
  for (let k = 0; k < nb; k++) {
    const tt = 0.5 + k * (0.45 / nb), sy = g - h * tt, dir = k % 2 ? 1 : -1, L = (0.2 + hash(k, seed) * 0.18) * h * 1.2, x0 = x + Math.sin(tt * 2.2 + seed) * w * 0.25;
    for (let s = 0; s < L; s++) {
      const th = Math.max(1, Math.round((w * 0.3) * (1 - s / L))), px = x0 + dir * s * 0.95, py = sy - s * 0.7 - s * s * 0.006;
      for (let q = 0; q < th; q++) B.put(px, py + q, T5(P, q === 0 ? 0.3 : -0.5));
    }
  }
}
// 침엽수 (층마다 늘어진 가지 끝 톱니, 왼쪽 끝 햇빛, 아래 층부터 그려 위 층이 덮는다)
function pine(B, x, base, h, w, seed, P) {
  const tiers = 6 + Math.floor(hash(seed, 3) * 3), top = base - h;
  for (let j = 0; j < Math.max(5, h * 0.1); j++) for (let i = -1; i <= 1; i++) B.put(x + i, base - j, T5(BARK, i < 0 ? 0 : -0.6));
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
        B.put(X, y, T5(P, v));
      }
    }
  }
  for (let j = 0; j < 4; j++) B.put(x, top - j, T5(P, 0));
}
// 굵기가 줄어드는 가지 한 줄기 (왼쪽 위가 밝다)
function limb(B, x0, y0, x1, y1, w0, w1, P, sd) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  for (let s = 0; s <= L; s += 0.5) {
    const t = s / L, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = (w0 + (w1 - w0) * t) / 2;
    for (let q = -r; q <= r; q += 0.5) {
      const u = q / Math.max(0.5, r), lit = -(nx * 0.6 + ny * 0.8) * u, X = Math.round(x + nx * q), Y = Math.round(y + ny * q);
      B.put(X, Y, T5(P, Math.abs(u) > 0.8 && lit < 0 ? -0.9 : 0.1 + lit * 0.7 + tx(X, Y >> 1, 0.5, sd)));
    }
  }
}
// 마른 나무: 비틀린 줄기가 두 번씩 갈라진다
function deadTree(B, x, g, h, w, seed) {
  let px = x, py = g;
  const seg = 5;
  for (let k = 0; k < seg; k++) {
    const nx = px + (hash(k, seed) - 0.5) * w * 1.4, ny = py - (h * 0.62) / seg, ww = w * (1.15 - (0.6 * k) / seg);
    limb(B, px, py, nx, ny, ww * 2, ww * 1.6, DEADB, seed + k);
    if (k >= 2) {
      const side = k % 2 ? 1 : -1, bx = nx + side * h * (0.14 + 0.12 * hash(k, seed, 2)), by = ny - h * (0.08 + 0.14 * hash(k, seed, 3));
      limb(B, nx, ny, bx, by, w * 0.8, w * 0.4, DEADB, seed + 10 + k);
      limb(B, bx, by, bx + side * h * 0.08, by - h * (0.06 + 0.08 * hash(k, seed, 4)), w * 0.4, 1, DEADB, seed + 20 + k);
      limb(B, bx, by, bx - side * h * 0.04, by - h * 0.1, w * 0.35, 1, DEADB, seed + 30 + k);
    }
    (px = nx), (py = ny);
  }
  limb(B, px, py, px + (hash(9, seed) - 0.5) * 8, py - h * 0.16, w * 0.7, 1, DEADB, seed + 40);
  for (const d of [-1, 1]) limb(B, x, g - 2, x + d * w * 2.4, g, w * 0.9, w * 0.4, DEADB, seed + 50 + d);
}
// 고사리 잎 한 줄기: 밑동에서 a 방향으로 솟아 끝이 바깥·아래로 휜다. 작은 잎은 양쪽으로 비스듬히, 위쪽 잎이 밝다
function frond(B, x, g, a, L, P, sd) {
  const side = Math.sign(a) || 1;
  let px = x, py = g, ang = a;
  for (let s = 0; s < L; s++) {
    const t = s / L;
    ang = a + side * t * t * 1.5;
    const nx = px + Math.sin(ang) * 0.9, ny = py - Math.cos(ang) * 0.9;
    B.put(nx, ny, T5(P, -0.35 + t * 0.2));
    if (s > 1 && s % 2 === 0) {
      const lw = Math.max(1, Math.round((1 - t) * 4));
      for (let q = 1; q <= lw; q++) {
        const ox = Math.cos(ang) * q, oy = Math.sin(ang) * q;
        B.put(nx - ox * side - q * 0.2 * side, ny - oy * side - q * 0.45, T5(P, 0.5 - q * 0.12 + tx(Math.round(nx), Math.round(ny), 0.3, sd)));
        B.put(nx + ox * side + q * 0.1 * side, ny + oy * side - q * 0.35, T5(P, -0.05 - q * 0.12));
      }
    }
    (px = nx), (py = ny);
  }
}
// 바위 무더기: 덩어리 둘·셋, 넓은 면 + 붓 질감, 꼭대기 이끼, 아래 오른쪽 짙은 테, 금
function boulder(B, cx, g, w, h, rock, moss, seed) {
  const RP = R5(mute(rock, 0.15)), MP = R5(mute(moss, 0.25));
  for (const [lx, rx, ry] of [[cx - w * 0.28, w * 0.24, h * 0.62], [cx + w * 0.26, w * 0.26, h * 0.5], [cx - w * 0.04, w * 0.34, h]]) {
    for (let j = 0; j <= ry + 2; j++) for (let i = -rx - 2; i <= rx + 2; i++) {
      const X = Math.round(lx + i), Y = g - j, nx = i / rx, ny = -j / ry, e = 1 + (vn(X, Y, 8, seed) - 0.5) * 0.3, d2 = nx * nx + ny * ny;
      if (d2 > e * e) continue;
      const nz = Math.sqrt(Math.max(0, 1 - d2 / (e * e))), lam = (-0.55 * nx - 0.8 * ny) * 0.8 + nz * 0.35;
      let v = (lam - 0.15) * 1.2 + tx(X, Y, 0.7, seed & 31) + (vn(X, Y, 16, seed + 3) - 0.5) * 0.5;
      d2 > e * e * 0.82 && lam < 0.1 && (v = -0.95);
      B.put(X, Y, ny < -0.55 && vn(X, Y, 8, seed + 7) > 0.55 ? T5(MP, v + 0.2) : T5(RP, v));
    }
  }
  for (let k = 0; k < 3; k++) { let x = cx + (hash(k, seed) - 0.5) * w * 0.6, y = g - h * (0.3 + hash(seed, k) * 0.45); for (let s = 0; s < 5 + hash(k, 3) * 7; s++) { B.has(x, y) && B.put(x, y, RP[4]); x += hash(k, s) - 0.5; y += 1; } }
}

export const VEG = {
  // 활엽수: 줄기 + 큰 잎 뭉치 셋 (가끔 가을빛)
  p_oak(s, R, c) {
    const H = [90, 140, 200][s], W = [80, 120, 160][s], k = H / 140, seed = Math.floor(R() * 9999);
    const leaf = R5(mute(R() < 0.18 ? mix(c.top, 0xd8a040, 0.55) : c.top, 0.22));
    return {
      W: W + 24, H: H + 20,
      p2: (B) => {
        const cx = (W + 24) / 2, g = H + 19;
        trunk(B, cx, g, H * 0.56, 11 * k, seed);
        canopy(B, cx - W * 0.16, g - H * 0.6, W * 0.28, H * 0.19, leaf, seed + 1, 6 * k, 11 * k);
        canopy(B, cx + W * 0.17, g - H * 0.64, W * 0.26, H * 0.18, leaf, seed + 2, 6 * k, 11 * k);
        canopy(B, cx, g - H * 0.77, W * 0.28, H * 0.17, leaf, seed + 3, 7 * k, 12 * k);
      },
    };
  },
  p_pine(s, R, c) {
    const H = [100, 150, 210][s], W = [50, 72, 100][s], seed = Math.floor(R() * 9999), P = R5(mute(mix(c.top, 0x1e4a32, 0.45), 0.2));
    return { W: W + 16, H: H + 12, p2: (B) => pine(B, (W + 16) / 2, H + 11, H, W, seed, P) };
  },
  p_dead(s, R, c) {
    const H = [90, 140, 200][s], w = [2.8, 4, 5.4][s], seed = Math.floor(R() * 9999);
    return { W: Math.round(H * 0.75), H: H + 14, p2: (B) => deadTree(B, Math.round(H * 0.375), H + 13, H, w, seed) };
  },
  // 덤불: 납작한 잎 뭉치 + 열매
  p_bush(s, R, c) {
    const W = 36 + s * 14, H = 20 + s * 8, seed = Math.floor(R() * 9999), P = R5(mute(c.top, 0.22));
    return {
      W, H,
      p2: (B) => {
        const ry = (H - 4) / 2.1;
        canopy(B, W / 2, H - 1 - (H - 4) * 0.42, (W - 8) / 2.2, ry, P, seed, ry * 0.5, ry * 0.85);
        for (let k = 0; k < 2 + s; k++) { const x = W * (0.25 + hash(k, seed) * 0.5), y = H * (0.3 + hash(seed, k) * 0.4); B.put(x, y, sh(mute(c.acc, 0.2), 0.2)), B.put(x + 1, y, mute(c.acc, 0.2)), B.put(x, y + 1, sh(mute(c.acc, 0.2), -0.35)); }
      },
    };
  },
  p_foliage(s, R, c) {
    const conif = s >= 4, ss = conif ? s - 4 : s, rx = 16 + ss * 11, ry = 10 + ss * 6, seed = Math.floor(R() * 9999);
    const P = R5(mute(conif ? mix(c.top, 0x1e4a2a, 0.45) : c.top, 0.22));
    return { W: rx * 2 + 18, H: ry * 2 + 16, p2: (B) => canopy(B, rx + 9, ry + 8, rx * 0.92, ry * 0.92, P, seed, ry * 0.42, ry * 0.72) };
  },
  p_boulder(s, R, c) {
    const W = 34 + s * 18, H = 20 + s * 10, seed = Math.floor(R() * 9999);
    return { W, H, p2: (B) => boulder(B, W / 2, H - 1, W - 10, H - 4, c.rock, c.top, seed) };
  },
  // 고사리·넓은 잎 포기: 밑동에서 부채꼴로 펼쳐져 끝이 휘는 잎 여럿 (잎 폭은 가운데가 넓다, 왼쪽 가장자리 밝음, 가운데 잎맥)
  p_fern(s, R, c) {
    const W = 26 + s * 10, H = 18 + s * 7, seed = Math.floor(R() * 9999), P = R5(mute(sh(c.top, 0.05), 0.2)), n = 6 + s * 2;
    return {
      W, H,
      p2: (B) => {
        const order = [...Array(n).keys()].sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
        for (const k of order) {
          const a = -1.15 + (2.3 * k) / (n - 1) + (hash(k, seed) - 0.5) * 0.15, L = (H - 2) * (0.7 + hash(seed, k) * 0.3) * (1 - Math.abs(a) * 0.2), side = Math.sign(a) || 1;
          let px = W / 2 + (hash(k, seed, 2) - 0.5) * 4, py = H - 1;
          for (let j = 0; j < L; j++) {
            const t = j / L, ang = a + side * t * t * 1.1, wd = Math.max(1, Math.round(3.2 * Math.sin(Math.min(1, t * 1.25) * Math.PI) + 0.4));
            px += Math.sin(ang) * 0.95, py -= Math.cos(ang) * 0.95;
            for (let w = -Math.floor(wd / 2); w <= Math.ceil(wd / 2); w++) {
              const X = Math.round(px + Math.cos(ang) * w), Y = Math.round(py + Math.sin(ang) * w * 0.6);
              B.put(X, Y, T5(P, (w < 0 ? 0.35 : w === 0 ? -0.25 : -0.05) - t * 0.25 + tx(X, Y, 0.35, seed & 31) - (k % 2 ? 0.15 : 0)));
            }
          }
        }
      },
    };
  },
  // 들꽃: 낮은 풀포기 + 가는 줄기 + 2px 꽃송이 (강조색·흰색·분홍)
  p_flowers(s, R, c) {
    const W = 28 + s * 10, H = 12 + s * 4, seed = Math.floor(R() * 9999), G5 = R5(mute(c.top, 0.25)), cols = [mute(c.acc, 0.15), 0xf2eee0, mute(mix(c.acc, 0xff60a0, 0.6), 0.2)];
    return {
      W, H,
      p2: (B) => {
        const g = H - 1;
        for (let k = 0; k < 34 + s * 10; k++) { const x = 2 + hash(k, seed) * (W - 4), L = 2 + hash(seed, k) * 4, lean = (hash(k, 3, seed) - 0.5) * 0.8; for (let j = 0; j < L; j++) B.put(x + lean * j, g - j, T5(G5, (j / L) * 1.2 - 0.5)); }
        for (let k = 0; k < 4 + s * 3; k++) {
          const x = 3 + hash(k, seed, 5) * (W - 6), L = 4 + hash(seed, k, 6) * (H - 6), col = cols[k % 3];
          for (let j = 0; j < L; j++) B.put(x, g - j, G5[3]);
          B.put(x, g - L, col), B.put(x + 1, g - L, sh(col, -0.25)), B.put(x, g - L - 1, sh(col, 0.2)), B.put(x - 1, g - L, sh(col, -0.1));
        }
      },
    };
  },
};
// 버퍼 → RGBA + 선택 외곽선 (맞닿은 색을 어둡게 한 테두리)
export function bufToRGBA(B, W, H) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) if (B.al[i]) { const c = B.col[i]; (data[i * 4] = (c >> 16) & 255), (data[i * 4 + 1] = (c >> 8) & 255), (data[i * 4 + 2] = c & 255), (data[i * 4 + 3] = 255); }
  return selOutRGBA(data, W, H);
}
export function selOutRGBA(d, W, H, skip = null) {
  const res = new Uint8ClampedArray(d);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (d[k * 4 + 3]) continue;
      let best = -1, lum = 1e9;
      for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
        const kk = jj * W + ii;
        if (!d[kk * 4 + 3] || (skip && skip[kk])) continue;
        const l = d[kk * 4] + d[kk * 4 + 1] + d[kk * 4 + 2];
        l < lum && ((lum = l), (best = kk));
      }
      if (best < 0) continue;
      const c = mix(sh((d[best * 4] << 16) | (d[best * 4 + 1] << 8) | d[best * 4 + 2], -0.62), 0x1c120c, 0.45);
      (res[k * 4] = (c >> 16) & 255), (res[k * 4 + 1] = (c >> 8) & 255), (res[k * 4 + 2] = c & 255), (res[k * 4 + 3] = 255);
    }
  return res;
}
