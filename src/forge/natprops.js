// 3D 모양(거리 함수)을 왼쪽 위 빛으로 비춰 픽셀로 옮긴 소품들.
// 면 방향(법선)에 따라 빛·채움빛·하늘빛·구석 어둠·테두리 빛을 계산해 게임 팔레트 6단계(밝음 → 외곽선)로 나누고,
// 단계 경계는 2×2 디더링, 실루엣은 어두운 외곽선, 깊이가 끊기는 곳은 안쪽 선을 넣는다. 불꽃·수정은 스스로 빛난다.
// 그림 하나 = { w, h, data(RGBA), ax, ay }  (ax, ay = 붙는 점: 바닥 소품은 밑동 가운데, 매단 소품은 윗동 가운데)
// 키: natdeco와 같은 nt:<종류>:<크기>:<변형>:<잎색>:<바위색>:<강조색>, 종류는 p_로 시작

const mix = (a, b, t) => {
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
// 게임 소품과 같은 명암 사다리 (0 가장 밝음 … 4 가장 어두움, 5 외곽선)
const ramp = (b) => [mix(sh(b, 0.42), 0xfff2d8, 0.18), sh(b, 0.17), b, mix(sh(b, -0.3), 0x3c2848, 0.2), mix(sh(b, -0.52), 0x24183a, 0.32), mix(sh(b, -0.74), 0x140c1e, 0.45)];
const OUTLINE = 0x1e1018;
function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0, (s >>> 8) / 16777216);
};
// 값 잡음 (3D, 0~1)
function vn3(x, y, z, sd) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (i, j, k) => hash(xi + i + sd * 131, yi + j, zi + k * 7919);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ── 거리 함수 도형 (y 위, 바닥 y=0) ──
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const S = {
  sphere: (cx, cy, cz, r) => (x, y, z) => len3(x - cx, y - cy, z - cz) - r,
  ellip: (cx, cy, cz, rx, ry, rz) => (x, y, z) => {
    const a = len3((x - cx) / rx, (y - cy) / ry, (z - cz) / rz), b = len3((x - cx) / (rx * rx), (y - cy) / (ry * ry), (z - cz) / (rz * rz));
    return (a * (a - 1)) / Math.max(1e-4, b);
  },
  box: (cx, cy, cz, bx, by, bz, r = 0) => (x, y, z) => {
    const qx = Math.abs(x - cx) - bx + r, qy = Math.abs(y - cy) - by + r, qz = Math.abs(z - cz) - bz + r;
    return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  },
  // 세로 원기둥 (바닥 y0 ~ 윗면 y1)
  cyl: (cx, cz, r, y0, y1, rr = 0) => (x, y, z) => {
    const dx = Math.hypot(x - cx, z - cz) - r + rr, dy = Math.abs(y - (y0 + y1) / 2) - (y1 - y0) / 2 + rr;
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - rr;
  },
  // 위로 좁아지는 원뿔대 (바닥 반지름 r0, 윗면 r1)
  taper: (cx, cz, r0, r1, y0, y1) => (x, y, z) => {
    const t = clamp((y - y0) / (y1 - y0), 0, 1), r = r0 + (r1 - r0) * t, k = (r0 - r1) / (y1 - y0);
    const dr = (Math.hypot(x - cx, z - cz) - r) / Math.sqrt(1 + k * k), dy = Math.max(y0 - y, y - y1);
    return Math.max(dr, dy);
  },
  capsule: (ax, ay, az, bx, by, bz, r) => (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az, qx = bx - ax, qy = by - ay, qz = bz - az;
    const h = clamp((px * qx + py * qy + pz * qz) / (qx * qx + qy * qy + qz * qz), 0, 1);
    return len3(px - qx * h, py - qy * h, pz - qz * h) - r;
  },
  // 가로 원기둥 (x축, 통나무)
  log: (cx, cy, cz, r, hl) => (x, y, z) => {
    const dx = Math.abs(x - cx) - hl, dr = Math.hypot(y - cy, z - cz) - r;
    return Math.min(Math.max(dx, dr), 0) + Math.hypot(Math.max(dx, 0), Math.max(dr, 0));
  },
  torus: (cx, cy, cz, R, r) => (x, y, z) => Math.hypot(Math.hypot(x - cx, z - cz) - R, y - cy) - r,
};
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

// ── 그리기 ──
// parts: [{ d: 거리 함수, m: 재질 번호, k?: 앞 도형과 부드럽게 붙임, sub?: 깎아 내기 }]
// mats: [{ c: 바탕색, emit?: 스스로 빛남(밝은색, 중간색, 가장자리색), tex?: 무늬(x,y,z) → 명암 보정, gloss?: 반짝임 }]
function render(W, H, parts, mats, o = {}) {
  const pitch = o.pitch ?? 0.36, cp = Math.cos(pitch), sp = Math.sin(pitch), Z0 = 90, SC = o.sc ?? 1;
  // 때·이끼 (땅속): 바탕색을 어둡게, 위를 향한 면 군데군데 이끼
  const MOSS = ramp(0x4a6a34), base5 = new Map();
  const rampOf = (c) => (base5.has(c) || base5.set(c, ramp(o.grime ? mix(c, 0x241c28, 0.26) : c)), base5.get(c));
  const fx = 0, fy = -sp, fz = -cp;
  const base = o.base ?? 4;
  const scene = (x, y, z) => {
    let d = 1e9, m = 0;
    for (const P of parts) {
      const v = P.d(x, y, z);
      if (P.sub) {
        -v > d && ((d = -v), (m = P.m));
        continue;
      }
      if (P.k) {
        const nd = smin(d, v, P.k);
        v < d && (m = P.m);
        d = nd;
      } else if (v < d) ((d = v), (m = P.m));
    }
    return [d, m];
  };
  const dist = (x, y, z) => scene(x, y, z)[0];
  const col = new Int32Array(W * H).fill(-1), dep = new Float32Array(W * H).fill(1e9), lvl = new Int8Array(W * H).fill(-1), mid = new Int8Array(W * H).fill(-1);
  const Lx = -0.56, Ly = 0.7, Lz = 0.44, Fx = 0.72, Fy = 0.12, Fz = 0.3;
  const bayer = [0, 0.5, 0.75, 0.25];
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const sx = (i + 0.5 - W / 2) / SC, sy = (H - base - (j + 0.5)) / SC;
      let x = sx, y = sy * cp + Z0 * sp, z = -sy * sp + Z0 * cp, t = 0, hit = false, m = 0;
      for (let k = 0; k < 90 && t < Z0 * 2.2; k++) {
        const [d, mm] = scene(x, y, z);
        if (d < 0.25) {
          hit = true;
          m = mm;
          break;
        }
        const st = Math.max(d * 0.9, 0.25);
        t += st;
        x += fx * st;
        y += fy * st;
        z += fz * st;
      }
      if (!hit) continue;
      const e = 0.35;
      // 네 점으로 면 방향
      const a1 = dist(x + e, y - e, z - e), a2 = dist(x - e, y - e, z + e), a3 = dist(x - e, y + e, z - e), a4 = dist(x + e, y + e, z + e);
      let nx = a1 - a2 - a3 + a4, ny = -a1 - a2 + a3 + a4, nz = -a1 + a2 - a3 + a4;
      const nl = Math.hypot(nx, ny, nz) || 1;
      ((nx /= nl), (ny /= nl), (nz /= nl));
      const M = mats[m] ?? mats[0];
      const k = j * W + i;
      dep[k] = t;
      mid[k] = m;
      if (M.emit) {
        // 스스로 빛남: 정면을 볼수록·잡음이 밝을수록 밝은 색
        const f = clamp(-(nx * fx + ny * fy + nz * fz), 0, 1) * 0.6 + vn3(x * 0.4, y * 0.4, z * 0.4, 9) * 0.5;
        col[k] = f > 0.75 ? M.emit[0] : f > 0.45 ? M.emit[1] : M.emit[2];
        lvl[k] = 9;
        continue;
      }
      const diff = Math.max(0, nx * Lx + ny * Ly + nz * Lz), fill = Math.max(0, nx * Fx + ny * Fy + nz * Fz) * 0.28, sky = 0.22 * (0.5 + 0.5 * ny);
      let occ = 0;
      for (let s = 1; s <= 2; s++) occ += Math.max(0, s * 2.6 - dist(x + nx * s * 2.6, y + ny * s * 2.6, z + nz * s * 2.6)) / (s * 2.6);
      const ao = 1 - 0.4 * occ;
      const vdot = Math.abs(nx * fx + ny * fy + nz * fz), rim = 0.22 * Math.pow(1 - vdot, 2.5) * (nx < 0.2 ? 1 : 0.4);
      let I = (diff * 0.82 + fill + sky) * ao + rim + (M.tex ? M.tex(x, y, z, nx, ny, nz) : 0);
      if (M.gloss) {
        // 반짝임 (빛 반사 방향)
        const rx = 2 * diff * nx - Lx, ry = 2 * diff * ny - Ly, rz = 2 * diff * nz - Lz, spec = Math.pow(Math.max(0, -(rx * fx + ry * fy + rz * fz)), 12) * M.gloss;
        I += spec;
      }
      const v = I * 4.4 + bayer[(j & 1) * 2 + (i & 1)] - 0.35;
      lvl[k] = clamp(4 - Math.floor(v), 0, 4);
      const mossy = o.grime && ny > 0.45 && vn3(x * 0.45, y * 0.45, z * 0.45, 33) > 0.6;
      col[k] = (mossy ? MOSS : rampOf(M.c))[lvl[k]];
    }
  // 안쪽 선: 깊이가 크게 끊기는 곳 (앞쪽 도형의 테두리)
  const out = new Uint8ClampedArray(W * H * 4);
  const setc = (k, c) => ((out[k * 4] = (c >> 16) & 255), (out[k * 4 + 1] = (c >> 8) & 255), (out[k * 4 + 2] = c & 255), (out[k * 4 + 3] = 255));
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (col[k] < 0) continue;
      let c = col[k];
      if (lvl[k] !== 9) {
        const M = mats[mid[k]] ?? mats[0];
        let edge = false;
        for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const ii = i + di, jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
          const kk = jj * W + ii;
          col[kk] >= 0 && dep[kk] - dep[k] > 5 && (edge = true);
        }
        edge && (c = rampOf(M.c)[5]);
      }
      setc(k, c);
    }
  // 바깥 외곽선 한 겹 (게임 소품과 같은 색)
  const res = new Uint8ClampedArray(out);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (out[k * 4 + 3]) continue;
      let n = false;
      for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const ii = i + di, jj = j + dj;
        ii >= 0 && jj >= 0 && ii < W && jj < H && out[(jj * W + ii) * 4 + 3] && lvl[jj * W + ii] !== 9 && (n = true);
      }
      n && ((res[k * 4] = (OUTLINE >> 16) & 255), (res[k * 4 + 1] = (OUTLINE >> 8) & 255), (res[k * 4 + 2] = OUTLINE & 255), (res[k * 4 + 3] = 255));
    }
  // 빛 번짐: 스스로 빛나는 점 둘레에 밝은 점 몇 개 (외곽선 안쪽만)
  if (o.glow)
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const k = j * W + i;
        if (lvl[k] !== 9 || hash(i, j, 77) > 0.35) continue;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, -1]]) {
          const ii = i + di, jj = j + dj, kk = jj * W + ii;
          if (ii < 0 || jj < 0 || ii >= W || jj >= H || res[kk * 4 + 3]) continue;
          const c = o.glow;
          ((res[kk * 4] = (c >> 16) & 255), (res[kk * 4 + 1] = (c >> 8) & 255), (res[kk * 4 + 2] = c & 255), (res[kk * 4 + 3] = 255));
        }
      }
  return crop(res, W, H, o.hang);
}
// 빈 둘레를 잘라 내고 붙는 점 정하기
function crop(d, W, H, hang) {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++)
      if (d[(j * W + i) * 4 + 3]) ((x0 = Math.min(x0, i)), (x1 = Math.max(x1, i)), (y0 = Math.min(y0, j)), (y1 = Math.max(y1, j)));
  if (x1 < 0) return { w: 1, h: 1, data: new Uint8ClampedArray(4), ax: 0, ay: 0 };
  const w = x1 - x0 + 1, h = y1 - y0 + 1, data = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++) data.set(d.subarray(((y0 + j) * W + x0) * 4, ((y0 + j) * W + x1 + 1) * 4), j * w * 4);
  return { w, h, data, ax: Math.round(W / 2 - x0), ay: hang ? 0 : h - 1 };
}

// ── 무늬 ──
const stoneTex = (sd) => (x, y, z) => {
  const n = vn3(x * 0.33, y * 0.33, z * 0.33, sd), c = vn3(x * 0.9, y * 0.9, z * 0.9, sd + 3);
  return (n - 0.5) * 0.22 + (c > 0.82 ? -0.22 : 0);
};
const woodTex = (sd, axis = "y") => (x, y, z) => {
  const a = axis === "y" ? y : x, g = Math.sin(a * 0.9 + vn3(x * 0.2, y * 0.2, z * 0.2, sd) * 6) * 0.08;
  return g + (vn3(x * 0.7, y * 0.15, z * 0.7, sd + 1) > 0.8 ? -0.15 : 0);
};
const leafTex = (sd) => (x, y, z) => (vn3(x * 0.45, y * 0.45, z * 0.45, sd) - 0.5) * 0.5 + (vn3(x * 1.2, y * 1.2, z * 1.2, sd + 5) > 0.78 ? 0.18 : 0);
const clothTex = (sd) => (x, y, z) => Math.sin(x * 0.9 + vn3(x * 0.1, y * 0.1, 0, sd) * 3) * 0.12;
const FLAME = [0xfff4c0, 0xffb84a, 0xe85a24];

// ── 종류 ──
// 크기 s (0~2), 변형 v, 색: top 잎, rock 바위, acc 강조
const KINDS = {
  // 바닥에서 솟은 종유석 무리 (동굴)
  p_stalag(s, R, c) {
    const parts = [], n = 2 + s;
    for (let k = 0; k < n; k++) {
      const x = (R() - 0.5) * (8 + s * 6), z = (R() - 0.5) * 8, h = (14 + s * 12) * (0.5 + R() * 0.7), r = 2.6 + R() * (2 + s);
      parts.push({ d: S.taper(x, z, r, 0.3, -2, h), m: 0, k: 2 });
    }
    parts.push({ d: S.ellip(0, -1, 0, 8 + s * 5, 3.5, 7), m: 0, k: 3 });
    return { W: 28 + s * 14, H: 30 + s * 22, parts, mats: [{ c: c.rock, tex: stoneTex(3) }] };
  },
  // 천장에 매달린 종유석 (거꾸로)
  p_stalac(s, R, c) {
    const parts = [], n = 2 + s;
    for (let k = 0; k < n; k++) {
      const x = (R() - 0.5) * (8 + s * 6), z = (R() - 0.5) * 8, h = (14 + s * 12) * (0.5 + R() * 0.7), r = 2.4 + R() * (1.8 + s);
      parts.push({ d: S.taper(x, z, r, 0.3, -2, h), m: 0, k: 2 });
    }
    const flip = parts.map((P) => ({ ...P, d: ((f) => (x, y, z) => f(x, -y + 40, z))(P.d) }));
    return { W: 28 + s * 14, H: 30 + s * 22, parts: flip, mats: [{ c: c.rock, tex: stoneTex(4) }], hang: true, top: 40 };
  },
  // 빛나는 수정 무리
  p_crystal(s, R, c) {
    const parts = [], n = 3 + s * 2, glowC = c.acc;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + R(), lean = 0.25 + R() * 0.35, h = (10 + s * 9) * (0.55 + R() * 0.6), r = 1.8 + R() * 1.6 + s * 0.6;
      const bx = Math.cos(a) * (2 + s * 2) * 0.6, bz = Math.sin(a) * 3;
      parts.push({ d: S.capsule(bx, 0, bz, bx + Math.cos(a) * h * lean, h, bz + Math.sin(a) * h * lean * 0.4, r), m: k % 3 === 0 ? 1 : 0 });
    }
    parts.push({ d: S.ellip(0, -1, 0, 7 + s * 4, 3, 6), m: 2, k: 2 });
    return {
      W: 30 + s * 14, H: 28 + s * 18, parts,
      mats: [{ c: mix(glowC, 0xffffff, 0.15), gloss: 0.7 }, { c: glowC, emit: [0xffffff, mix(glowC, 0xffffff, 0.45), glowC] }, { c: c.rock, tex: stoneTex(5) }],
      glow: mix(glowC, 0xffffff, 0.3),
    };
  },
  // 버섯 무리 (갓 밑이 빛난다)
  p_shroom(s, R, c) {
    const parts = [], n = 2 + s;
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * (6 + s * 2) + (R() - 0.5) * 3, z = (R() - 0.5) * 6, h = (6 + s * 5) * (0.6 + R() * 0.7), r = 3 + s * 1.5 + R() * 2;
      parts.push({ d: S.taper(x, z, 1.6 + s * 0.3, 1.2, 0, h), m: 0 });
      parts.push({ d: S.ellip(x, h + 1, z, r, r * 0.55, r), m: 1, k: 1 });
      parts.push({ d: S.ellip(x, h - 0.6, z, r * 0.8, 0.9, r * 0.8), m: 2 });
    }
    return {
      W: 32 + s * 12, H: 22 + s * 14, parts,
      mats: [{ c: 0xd8c8b0, tex: woodTex(2) }, { c: c.acc, gloss: 0.4, tex: (x, y, z) => (vn3(x * 0.9, y * 0.9, z * 0.9, 8) > 0.74 ? 0.35 : 0) }, { c: c.acc, emit: [0xffffff, mix(c.acc, 0xffffff, 0.5), c.acc] }],
    };
  },
  // 해골·뼈 더미
  p_bones(s, R, c) {
    const bone = 0xe8dcc0, parts = [];
    parts.push({ d: S.sphere(0, 4, 0, 4 + s), m: 0 });
    parts.push({ d: S.sphere(-1.5, 3.6, 3.4 + s, 1.3), m: 1, sub: 1 });
    parts.push({ d: S.sphere(1.8, 3.6, 3.4 + s, 1.3), m: 1, sub: 1 });
    for (let k = 0; k < 3 + s; k++) {
      const a = R() * Math.PI, l = 6 + R() * 5, x = (R() - 0.5) * 14, z = (R() - 0.5) * 6;
      parts.push({ d: S.capsule(x - Math.cos(a) * l * 0.5, 1.6, z - Math.sin(a) * 2 + 2, x + Math.cos(a) * l * 0.5, 1.8, z + Math.sin(a) * 2 + 2, 1.6), m: 0 });
      parts.push({ d: S.sphere(x - Math.cos(a) * l * 0.5, 1.8, z + 2, 2), m: 0 }, { d: S.sphere(x + Math.cos(a) * l * 0.5, 2, z + 2, 2), m: 0 });
    }
    return { W: 30 + s * 6, H: 14 + s * 3, parts, mats: [{ c: bone, tex: stoneTex(6) }, { c: 0x2a1a20 }] };
  },
  // 둥근 바위 (지표·동굴)
  p_boulder(s, R, c) {
    const parts = [], n = 1 + s;
    for (let k = 0; k < n + 1; k++) {
      const r = (6 + s * 4) * (k ? 0.55 + R() * 0.3 : 1), x = k ? (R() - 0.5) * (10 + s * 8) : 0;
      parts.push({ d: ((f, sd) => (X, Y, Z) => f(X, Y, Z) + (vn3(X * 0.25, Y * 0.25, Z * 0.25, sd) - 0.5) * 3)(S.ellip(x, r * 0.62, (R() - 0.5) * 4, r, r * 0.7, r * 0.85), k), m: 0, k: 2.5 });
    }
    return { W: 34 + s * 18, H: 20 + s * 10, parts, mats: [{ c: c.rock, tex: stoneTex(7) }] };
  },
  // 덤불 (지표·섬 윗면)
  p_bush(s, R, c) {
    const parts = [], n = 4 + s * 2;
    for (let k = 0; k < n; k++) {
      const x = (R() - 0.5) * (14 + s * 10), y = 4 + R() * (5 + s * 3), r = 4 + s * 1.6 + R() * 2.5;
      parts.push({ d: ((f, sd) => (X, Y, Z) => f(X, Y, Z) + (vn3(X * 0.55, Y * 0.55, Z * 0.55, sd) - 0.5) * 2.4)(S.sphere(x, y, (R() - 0.5) * 5, r), k), m: 0, k: 2 });
    }
    // 열매·꽃
    for (let k = 0; k < 2 + s; k++) parts.push({ d: S.sphere((R() - 0.5) * (12 + s * 8), 6 + R() * (5 + s * 3), 5, 1.2), m: 1 });
    return { W: 36 + s * 14, H: 20 + s * 8, parts, mats: [{ c: c.top, tex: leafTex(4) }, { c: c.acc, gloss: 0.6 }] };
  },
  // 꽃밭 (작은 꽃 여러 송이)
  p_flowers(s, R, c) {
    const parts = [], n = 4 + s * 3, cols = [c.acc, 0xf0f0ff, mix(c.acc, 0xff60a0, 0.6)];
    for (let k = 0; k < n; k++) {
      const x = (R() - 0.5) * (16 + s * 8), z = (R() - 0.5) * 6, h = 4 + R() * (3 + s * 2);
      parts.push({ d: S.capsule(x, 0, z, x + (R() - 0.5) * 2, h, z, 0.45), m: 0 });
      parts.push({ d: S.sphere(x, h, z, 1.3 + R() * 0.6), m: 1 + (k % 3) });
    }
    parts.push({ d: S.ellip(0, 0, 0, 10 + s * 5, 1.6, 5), m: 0 });
    return { W: 28 + s * 10, H: 12 + s * 4, parts, mats: [{ c: sh(c.top, -0.1), tex: leafTex(2) }, ...cols.map((cc) => ({ c: cc, gloss: 0.3 }))] };
  },
  // 쓰러진 통나무 (버섯이 핀)
  p_log(s, R, c) {
    const L = 12 + s * 6, r = 3.4 + s * 0.8, parts = [];
    parts.push({ d: S.log(0, r, 0, r, L), m: 0 });
    parts.push({ d: S.cyl(-L, 0, r * 0.75, -1, 2 * r + 1), m: 1, sub: 1 });
    parts.push({ d: S.ellip(L * 0.4, r * 2 - 0.2, 1, 2.6, 1.2, 2.2), m: 2 });
    parts.push({ d: S.capsule(-L * 0.3, r * 1.6, 0, -L * 0.3 - 3, r * 2.6, -1, 0.8), m: 0 });
    return { W: L * 2 + 14, H: r * 2 + 10, parts, mats: [{ c: 0x7a5030, tex: woodTex(3, "x") }, { c: 0x4a3020 }, { c: c.acc, gloss: 0.4 }] };
  },
  // 고사리·풀 덤불
  p_fern(s, R, c) {
    const parts = [], n = 5 + s * 2;
    for (let k = 0; k < n; k++) {
      const a = -1.1 + (2.2 * k) / (n - 1) + (R() - 0.5) * 0.2, l = 8 + s * 4 + R() * 3;
      parts.push({ d: S.capsule(0, 0, 0, Math.sin(a) * l, Math.cos(a) * l * 0.9, (R() - 0.5) * 4, 1.1 - k * 0.02), m: 0, k: 0.8 });
    }
    return { W: 26 + s * 10, H: 16 + s * 6, parts, mats: [{ c: sh(c.top, 0.05), tex: leafTex(6) }] };
  },
  // 늘어진 뿌리·덩굴 (천장)
  p_roots(s, R, c) {
    const parts = [], n = 3 + s * 2, top = 60;
    for (let k = 0; k < n; k++) {
      const x = (R() - 0.5) * (12 + s * 10), z = (R() - 0.5) * 4, l = (16 + s * 14) * (0.5 + R() * 0.7);
      let px = x, py = top;
      for (let q = 0; q < 4; q++) {
        const nx = px + (R() - 0.5) * 4, ny = py - l / 4;
        parts.push({ d: S.capsule(px, py, z, nx, ny, z, 1.1 - q * 0.15), m: 0, k: 0.6 });
        R() < 0.5 && parts.push({ d: S.ellip(nx + 1.5, ny, z + 0.5, 1.8, 1, 1.2), m: 1 });
        ((px = nx), (py = ny));
      }
    }
    return { W: 30 + s * 16, H: 44 + s * 24, parts, mats: [{ c: 0x6a4a2e, tex: woodTex(5) }, { c: c.top, tex: leafTex(7) }], hang: true, top };
  },
  // ── 던전·신전 ──
  // 벽 횃불 (뒷벽에 붙은 받침 + 불꽃)
  p_torch(s, R, c) {
    const parts = [
      { d: S.box(0, 6, -1, 1.4, 7, 1.4, 0.4), m: 0 },
      { d: S.taper(0, 0, 3.2, 2.2, 12, 16), m: 1 },
      { d: S.box(0, 10, -2.5, 2.6, 1.2, 1.2, 0.3), m: 1 },
      { d: ((f) => (x, y, z) => f(x, y, z) + (vn3(x * 0.6, y * 0.45, z * 0.6, 11) - 0.5) * 1.6)(S.ellip(0, 20.5, 0, 2.6, 5.2, 2.6)), m: 2 },
    ];
    return { W: 16, H: 32, parts, mats: [{ c: 0x6a4a30, tex: woodTex(8) }, { c: 0x5a5a68, gloss: 0.5 }, { c: 0xffb040, emit: FLAME }], glow: 0xffd080 };
  },
  // 화로 (세 발 받침 + 불)
  p_brazier(s, R, c) {
    const parts = [];
    for (const a of [0, 2.1, 4.2]) parts.push({ d: S.capsule(Math.cos(a) * 5, 0, Math.sin(a) * 4, Math.cos(a) * 2.5, 9, Math.sin(a) * 2, 0.9), m: 0 });
    parts.push({ d: S.taper(0, 0, 4.2, 7, 9, 14), m: 0, k: 1 });
    parts.push({ d: S.cyl(0, 0, 5.8, 12.5, 15), m: 1, sub: 1 });
    parts.push({ d: ((f) => (x, y, z) => f(x, y, z) + (vn3(x * 0.5, y * 0.4, z * 0.5, 12) - 0.5) * 2.4)(S.ellip(0, 18, 0, 4.6, 7, 4)), m: 2 });
    return { W: 24, H: 34, parts, mats: [{ c: 0x4a4a58, gloss: 0.6 }, { c: 0x2a2028 }, { c: 0xffa040, emit: FLAME }], glow: 0xffd080 };
  },
  // 항아리 (줄무늬 도자기)
  p_urn(s, R, c) {
    const h = 14 + s * 5, r = 5 + s * 1.5;
    const body = (x, y, z) => {
      const t = clamp(y / h, 0, 1), rr = r * (0.55 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.15))) * (t > 0.85 ? 0.55 : 1);
      return Math.max((Math.hypot(x, z) - rr) * 0.8, -y, y - h);
    };
    const parts = [{ d: body, m: 0 }, { d: S.cyl(0, 0, r * 0.5, h - 1, h + 1.6, 0.4), m: 0 }, { d: S.torus(0, h * 0.55, 0, r * 1.05, 0.55), m: 1 }];
    R() < 0.6 && parts.push({ d: S.torus(r * 0.9, h * 0.75, 0, 2, 0.6), m: 0 });
    const clay = [0xb06838, 0x8a5a7a, 0x5a7a8a][Math.floor(R() * 3)];
    return { W: r * 3 + 10, H: h + 10, parts, mats: [{ c: clay, gloss: 0.35, tex: (x, y) => (Math.floor(y / 3) % 3 === 0 ? -0.12 : 0) }, { c: c.acc, gloss: 0.5 }] };
  },
  // 수호 석상 (받침 위 투구 쓴 기사)
  p_statue(s, R, c) {
    const st = mix(c.rock, 0xb8b0a8, 0.45), parts = [
      { d: S.box(0, 3, 0, 9, 3, 6, 0.6), m: 0 },
      { d: S.box(0, 7, 0, 7.5, 1.2, 5, 0.4), m: 0 },
      { d: S.taper(0, 0, 4.2, 3.6, 8, 20), m: 0, k: 1.5 },
      { d: S.ellip(0, 26, 0, 5.4, 7, 3.6), m: 0, k: 2 },
      { d: S.sphere(0, 36, 0, 3.6), m: 0, k: 1 },
      { d: S.box(0, 38.5, 0, 3.2, 1.2, 3.4, 0.6), m: 0, k: 0.8 },
      { d: S.capsule(-5.5, 30, 0, -7, 18, 2, 1.6), m: 0, k: 1 },
      { d: S.capsule(5.5, 30, 0, 6.5, 22, 3, 1.6), m: 0, k: 1 },
      { d: S.capsule(7.2, 8, 3.5, 7.2, 40, 3.5, 0.9), m: 1 },
      { d: S.box(7.2, 28, 3.5, 2.6, 0.7, 0.7, 0.2), m: 1 },
    ];
    return { W: 34, H: 52, parts, mats: [{ c: st, tex: stoneTex(9) }, { c: mix(st, 0x8a8a9a, 0.4), gloss: 0.3 }] };
  },
  // 촛대·초 무리
  p_candles(s, R, c) {
    const parts = [];
    for (let k = 0; k < 3 + s; k++) {
      const x = (k - (2 + s) / 2) * 3.4 + (R() - 0.5), h = 3 + R() * 5;
      parts.push({ d: S.cyl(x, (R() - 0.5) * 2, 1.2, 0, h, 0.3), m: 0 });
      parts.push({ d: S.ellip(x, h + 1.8, 0, 0.9, 1.8, 0.9), m: 1 });
    }
    parts.push({ d: S.ellip(0, 0, 0, 8 + s * 2, 1.2, 4), m: 0 });
    return { W: 22 + s * 6, H: 16, parts, mats: [{ c: 0xece0c8, gloss: 0.3 }, { c: 0xffc060, emit: FLAME }], glow: 0xffd890 };
  },
  // 상자·통 쌓음
  p_crates(s, R, c) {
    const parts = [
      { d: S.box(-4, 5, 0, 5, 5, 5, 0.4), m: 0 },
      { d: S.cyl(6, 1, 4.2, 0, 11, 0.6), m: 1 },
    ];
    s > 0 && parts.push({ d: S.box(-3, 14, 0.5, 4, 4, 4, 0.4), m: 0 });
    return {
      W: 30, H: 30, parts,
      mats: [{ c: 0x9a6a3a, tex: (x, y, z) => (Math.abs(((x + 9) % 5) - 2.5) < 0.5 || Math.abs(((y + 10) % 5) - 2.5) < 0.4 ? -0.2 : woodTex(10)(x, y, z)) }, { c: 0x8a5a30, tex: (x, y) => (Math.abs(y - 2.5) < 0.6 || Math.abs(y - 8.5) < 0.6 ? -0.3 : 0) }],
    };
  },
  // 책장 (뒷벽 앞)
  p_shelf(s, R, c) {
    const parts = [{ d: S.box(0, 16, -2, 11, 16, 3.5, 0.5), m: 0 }];
    for (const yy of [8, 17, 26]) parts.push({ d: S.box(0, yy + 3.2, 0.5, 9.6, 3.6, 3.2), m: 0, sub: 1 });
    for (const yy of [8, 17, 26]) for (let k = 0; k < 6; k++) {
      const x = -8.4 + k * 3.2 + (R() - 0.5) * 0.6, hh = 2.4 + R() * 1.2;
      parts.push({ d: S.box(x, yy + hh, 0.2, 1.3, hh, 2.6, 0.2), m: 1 + Math.floor(R() * 3) });
    }
    return { W: 30, H: 40, parts, mats: [{ c: 0x6a4428, tex: woodTex(12) }, { c: 0x8a2a2a }, { c: 0x2a4a7a }, { c: 0x3a6a3a }] };
  },
  // 깃발 (천장에 매달린 천, 가운데 문장)
  p_banner(s, R, c) {
    const L = 40 + s * 22, top = 96;
    const cloth = (x, y, z) => {
      const t = clamp((top - y) / L, 0, 1), wv = Math.sin(t * 5 + x * 0.3) * 0.8, hw = 7 + s;
      const dx = Math.abs(x) - hw, tail = y < top - L + 6 ? Math.abs(x) - (y - (top - L)) * (hw / 6) : -1;
      return Math.max(dx, Math.abs(z - wv) - 0.7, y - top, top - L - y, tail);
    };
    const parts = [
      { d: S.log(0, top + 1.5, 0, 1.3, 11 + s), m: 1 },
      { d: cloth, m: 0 },
      { d: S.sphere(0, top - L * 0.42, 1.2, 3 + s * 0.6), m: 2 },
    ];
    const clr = [0x8a2a3a, 0x2a3a7a, 0x3a5a2a][Math.floor(R() * 3)];
    return { W: 30 + s * 2, H: L + 10, parts, mats: [{ c: clr, tex: clothTex(13) }, { c: 0x8a6a3a, gloss: 0.4 }, { c: c.acc, gloss: 0.7 }], hang: true, top: top + 3 };
  },
  // 뒷벽 아치 창 (돌 틀 + 빛 드는 유리, 가운데 창살)
  p_window(s, R, c) {
    const st = mix(c.rock, 0xc8b898, 0.5), hw = 9 + s * 3, hh = 22 + s * 8;
    const arch = (x, y, z, w, h) => { const yy = y - h; return yy > 0 ? Math.hypot(x, yy) - w : Math.abs(x) - w; };
    const parts = [
      { d: (x, y, z) => Math.max(arch(x, y, z, hw + 3, hh), Math.abs(z) - 2, -y), m: 0 },
      { d: (x, y, z) => Math.max(arch(x, y, z, hw, hh), Math.abs(z - 1.5) - 1, 2 - y), m: 1 },
      { d: S.box(0, (hh + hw) / 2 + 2, 2.4, 0.8, (hh + hw) / 2 - 1, 0.8), m: 0 },
      { d: S.box(0, hh * 0.6, 2.4, hw - 1, 0.8, 0.8), m: 0 },
      { d: S.box(0, 1, 1, hw + 5, 1.5, 3.5, 0.4), m: 0 },
    ];
    return { W: hw * 2 + 14, H: hh + hw + 10, parts, mats: [{ c: st, tex: stoneTex(14) }, { c: 0xa8d8f0, emit: [0xf0fbff, 0xb8e4f8, 0x78b0d8] }], pitch: 0.1 };
  },
  // 뒷벽 걸개 천 (큰 무늬 천, 위 막대)
  p_tapestry(s, R, c) {
    const hw = 12 + s * 3, L = 50 + s * 14, top = 110;
    const cloth = (x, y, z) => Math.max(Math.abs(x) - hw, Math.abs(z - Math.sin(x * 0.25) * 0.6) - 0.8, y - top, top - L - y);
    const clr = [0x6a2a3a, 0x2a3a6a, 0x5a4a2a][Math.floor(R() * 3)];
    const parts = [{ d: S.log(0, top + 1.5, 0, 1.4, hw + 3), m: 1 }, { d: cloth, m: 0 }];
    const pat = (x, y) => { const v = Math.abs(((y - top) % 12 + 12) % 12 - 6) < 1 || Math.abs(Math.abs(x) - (hw - 3)) < 0.9 ? 0.32 : Math.hypot(x, y - (top - L / 2)) < 6 ? 0.45 : 0; return v; };
    parts.push({ d: S.sphere(0, top - L / 2, 1.4, 4.5), m: 2 });
    return { W: hw * 2 + 12, H: L + 8, parts, mats: [{ c: clr, tex: (x, y, z) => pat(x, y) + clothTex(15)(x, y, z) }, { c: 0x8a6a3a, gloss: 0.4 }, { c: c.acc, gloss: 0.6 }], hang: true, top: top + 3, pitch: 0.08 };
  },
  // ── 높이를 정해 그리는 기둥 (e = { h, w }) ──
  // 신전 돌기둥: 받침돌·둥근 받침·홈 파인 몸통(위로 살짝 가늘어짐)·목둘레·둥근 머리·머리판
  p_column(s, R, c, e) {
    const h = e?.h ?? 120, w = e?.w ?? 16, r = w / 2, st = 0xd8ccb0;
    const shaft = (x, y, z) => {
      const t = clamp((y - 10) / (h - 22), 0, 1), rr = r * (1 - 0.08 * t) * (1 + 0.035 * Math.sin(t * Math.PI));
      return Math.max(Math.hypot(x, z) - rr, 9 - y, y - (h - 11));
    };
    const flute = (x, y, z) => (Math.cos(Math.atan2(z, x) * 10) > 0.5 ? -0.2 : 0);
    const parts = [
      { d: S.box(0, 3, 0, r + 4, 3, r + 3, 0.6), m: 0 },
      { d: S.torus(0, 7.5, 0, r + 1.2, 1.8), m: 0, k: 1 },
      { d: shaft, m: 1, k: 1.2 },
      { d: S.torus(0, h - 12.5, 0, r + 0.5, 1.3), m: 0, k: 1 },
      { d: S.ellip(0, h - 8, 0, r + 3, 3, r + 2.4), m: 0, k: 1.5 },
      { d: S.box(0, h - 3, 0, r + 5, 3, r + 4, 0.5), m: 0 },
    ];
    return { W: w + 18, H: h + 2, parts, mats: [{ c: st, tex: stoneTex(21) }, { c: st, tex: (x, y, z) => flute(x, y, z) + stoneTex(22)(x, y, z) * 0.6 }], pitch: 0.12 };
  },
  // 동굴 자연 돌기둥 (바닥·천장이 굵고 가운데가 잘록, 울퉁불퉁)
  p_rockcol(s, R, c, e) {
    const h = e?.h ?? 140, w = (e?.w ?? 20) * 1.3, r = w / 2;
    const d = (x, y, z) => {
      const t = clamp(y / h, 0, 1), rr = r * (0.55 + 0.9 * (2 * t - 1) ** 2) + 3 * (vn3(x * 0.12, y * 0.06, z * 0.12, 31) - 0.5) * 2;
      return Math.max((Math.hypot(x, z) - rr) * 0.8, -y, y - h);
    };
    return { W: w * 2 + 10, H: h + 2, parts: [{ d, m: 0 }], mats: [{ c: c.rock, tex: stoneTex(32) }], pitch: 0.15 };
  },
  // ── 지하 던전 ──
  // 석관 (뚜껑에 십자 문양)
  p_sarcoph(s, R, c) {
    const st = mix(c.rock, 0x9a9488, 0.5), parts = [
      { d: S.box(0, 5, 0, 15, 5, 6, 0.8), m: 0 },
      { d: S.box(0, 11, 0, 16, 1.6, 6.8, 0.6), m: 1 },
      { d: S.box(0, 13.2, 0, 13, 1.2, 5, 0.8), m: 1, k: 1 },
      { d: S.box(0, 14.8, 0, 3.4, 0.8, 1, 0.3), m: 2 },
      { d: S.box(-1, 14.8, 0, 0.8, 0.8, 3.6, 0.3), m: 2 },
    ];
    R() < 0.5 && parts.push({ d: S.box(9, 9, 6.5, 3, 2.5, 0.8, 0.2), m: 1, sub: 1 });
    return { W: 40, H: 22, parts, mats: [{ c: st, tex: stoneTex(41) }, { c: sh(st, 0.08), tex: stoneTex(42) }, { c: c.acc, gloss: 0.5 }] };
  },
  // 해골 더미
  p_skulls(s, R, c) {
    const parts = [], n = 5 + s * 3;
    for (let k = 0; k < n; k++) {
      const row = k < n * 0.55 ? 0 : k < n * 0.85 ? 1 : 2, x = (R() - 0.5) * (14 - row * 4) * (1 + s * 0.3), y = 3 + row * 4.6, z = (R() - 0.5) * 6;
      parts.push({ d: S.sphere(x, y, z, 3), m: 0, k: 0.6 });
      parts.push({ d: S.sphere(x - 1.1, y + 0.2, z + 2.6, 0.9), m: 1, sub: 1 }, { d: S.sphere(x + 1.1, y + 0.2, z + 2.6, 0.9), m: 1, sub: 1 });
    }
    return { W: 30 + s * 8, H: 18 + s * 5, parts, mats: [{ c: 0xe0d4b8, tex: stoneTex(43) }, { c: 0x201418 }] };
  },
  // 무너진 돌무더기
  p_rubble(s, R, c) {
    const parts = [];
    for (let k = 0; k < 5 + s * 2; k++) {
      const bw = 2 + R() * 3, x = (R() - 0.5) * (22 + s * 8), z = (R() - 0.5) * 8;
      parts.push({ d: ((f, sd) => (X, Y, Z) => f(X, Y, Z) + (vn3(X * 0.6, Y * 0.6, Z * 0.6, sd) - 0.5) * 1.5)(S.box(x, bw * 0.6, z, bw, bw * 0.7, bw * 0.8, 0.5), k), m: 0 });
    }
    return { W: 34 + s * 10, H: 12 + s * 3, parts, mats: [{ c: mix(c.rock, 0xb0a490, 0.35), tex: stoneTex(44) }] };
  },
  // 부러진 기둥 토막 + 쓰러진 기둥 마디
  p_brokencol(s, R, c) {
    const h = 16 + s * 10, r = 5 + s;
    const stub = (x, y, z) => Math.max(Math.hypot(x + 6, z) - r, 5 - y, y - (h + (vn3(x * 0.5, 0, z * 0.5, 45) - 0.5) * 7));
    const parts = [{ d: S.box(-6, 2.5, 0, r + 3, 2.5, r + 2, 0.5), m: 0 }, { d: stub, m: 0, k: 1 }, { d: S.log(10, 3.6, 3, 3.6, 5 + s), m: 0 }];
    return { W: 36 + s * 6, H: h + 9, parts, mats: [{ c: 0xcfc3a6, tex: (x, y, z) => (Math.cos(Math.atan2(z, x + 6) * 10) > 0.6 ? -0.15 : 0) + stoneTex(46)(x, y, z) }] };
  },
  // 쇠 우리 (사슬에 매달림, 안에 해골)
  p_cage(s, R, c) {
    const top = 90, cy = top - 26, parts = [];
    for (let k = 0; k < 4; k++) {
      const yy = top - k * 3.2;
      parts.push({ d: k % 2 ? (x, y, z) => S.torus(0, 0, 0, 1.5, 0.5)(y - yy, x, z) : (x, y, z) => S.torus(0, 0, 0, 1.5, 0.5)(x, z, y - yy), m: 0 });
    }
    parts.push({ d: S.torus(0, cy + 10, 0, 7, 0.7), m: 0 }, { d: S.torus(0, cy - 10, 0, 7, 0.7), m: 0 }, { d: S.ellip(0, cy + 12.5, 0, 6, 3, 6), m: 0 });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      parts.push({ d: S.capsule(Math.cos(a) * 7, cy - 10, Math.sin(a) * 7, Math.cos(a) * 7, cy + 10, Math.sin(a) * 7, 0.55), m: 0 });
    }
    parts.push({ d: S.sphere(0, cy - 6.5, 0, 2.6), m: 1 });
    return { W: 22, H: 40, parts, mats: [{ c: 0x5a5a66, gloss: 0.7 }, { c: 0xe0d4b8 }], hang: true, top: top + 2, pitch: 0.25 };
  },
  // 무기걸이 (칼 넷)
  p_rack(s, R, c) {
    const parts = [{ d: S.box(0, 1.5, 0, 12, 1.5, 3, 0.4), m: 0 }, { d: S.box(-10, 14, 0, 1.2, 13, 1.2, 0.3), m: 0 }, { d: S.box(10, 14, 0, 1.2, 13, 1.2, 0.3), m: 0 }, { d: S.box(0, 24, 0, 11.5, 1, 1.2, 0.3), m: 0 }];
    for (let k = 0; k < 4; k++) {
      const x = -7 + k * 4.6, l = 10 + R() * 3;
      parts.push({ d: S.box(x, 4 + l, 1.6, 0.6, l, 0.4, 0.1), m: 1 }, { d: S.box(x, 6 + R() * 2, 1.6, 1.8, 0.6, 0.6, 0.1), m: 2 });
    }
    return { W: 30, H: 30, parts, mats: [{ c: 0x6a4a2e, tex: woodTex(47) }, { c: 0x9aa0b0, gloss: 0.9 }, { c: 0x5a3a20 }] };
  },
  // 제단 (붉은 천 + 양쪽 초)
  p_altar(s, R, c) {
    const st = mix(c.rock, 0xb8b0a4, 0.45), parts = [{ d: S.box(0, 6, 0, 14, 6, 6, 0.8), m: 0 }, { d: S.box(0, 12.8, 0, 15.5, 1.2, 7, 0.4), m: 0 }, { d: S.box(0, 8.5, 6.2, 5, 4.5, 0.3, 0.2), m: 1 }];
    for (const x of [-10, 10]) parts.push({ d: S.cyl(x, 0, 1.3, 13.8, 18 + R() * 3, 0.3), m: 2 }, { d: S.ellip(x, 21.5, 0, 0.9, 1.8, 0.9), m: 3 });
    return { W: 38, H: 26, parts, mats: [{ c: st, tex: stoneTex(48) }, { c: 0x8a2030, tex: clothTex(49) }, { c: 0xece0c8 }, { c: 0xffc060, emit: FLAME }], glow: 0xffd890 };
  },
  // 쇠 샹들리에 (천장, 초 여섯)
  p_chand(s, R, c) {
    const top = 90, cy = top - 22, parts = [{ d: S.capsule(0, top, 0, 0, cy + 4, 0, 0.7), m: 0 }, { d: S.torus(0, cy, 0, 11, 1), m: 0 }];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      parts.push({ d: S.capsule(0, cy + 4, 0, Math.cos(a) * 10, cy, Math.sin(a) * 10, 0.5), m: 0 });
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3, x = Math.cos(a) * 11, z = Math.sin(a) * 11;
      parts.push({ d: S.cyl(x, z, 0.9, cy + 0.5, cy + 4, 0.2), m: 1 }, { d: S.ellip(x, cy + 5.6, z, 0.8, 1.6, 0.8), m: 2 });
    }
    return { W: 34, H: 30, parts, mats: [{ c: 0x4a4a54, gloss: 0.6 }, { c: 0xece0c8 }, { c: 0xffc060, emit: FLAME }], hang: true, top: top + 1, glow: 0xffd890, pitch: 0.4 };
  },
  // 벽감 (뒷벽 아치 홈 안에 해골·초)
  p_niche(s, R, c) {
    const st = mix(c.rock, 0xa89c88, 0.4), hw = 8, hh = 13;
    const arch = (x, y, w) => { const yy = y - hh; return yy > 0 ? Math.hypot(x, yy) - w : Math.max(Math.abs(x) - w, -y); };
    const parts = [
      { d: (x, y, z) => Math.max(arch(x, y, hw + 3), -arch(x, y, hw), Math.abs(z) - 2), m: 0 },
      { d: (x, y, z) => Math.max(arch(x, y, hw + 0.5), Math.abs(z + 3) - 0.8), m: 1 },
      { d: S.box(0, 1, 0, hw + 4, 1.2, 3, 0.3), m: 0 },
      { d: S.sphere(-3, 4.6, -1, 2.8), m: 2 }, { d: S.sphere(-4.1, 4.8, 1.6, 0.8), m: 1, sub: 1 }, { d: S.sphere(-1.9, 4.8, 1.6, 0.8), m: 1, sub: 1 },
      { d: S.cyl(4, -1, 1, 2, 6, 0.3), m: 3 }, { d: S.ellip(4, 7.6, -1, 0.8, 1.6, 0.8), m: 4 },
    ];
    return { W: 30, H: 34, parts, mats: [{ c: st, tex: stoneTex(50) }, { c: 0x1a1218 }, { c: 0xe0d4b8 }, { c: 0xece0c8 }, { c: 0xffc060, emit: FLAME }], pitch: 0.08, glow: 0xffd890 };
  },
  // 늘어진 이끼 (천장)
  p_moss(s, R, c) {
    const top = 70, parts = [], n = 6 + s * 3, mc = mix(c.top, 0x3a5a2a, 0.5);
    for (let k = 0; k < n; k++) {
      const x = (R() - 0.5) * (16 + s * 8), z = (R() - 0.5) * 3, l = (8 + s * 8) * (0.4 + R());
      parts.push({ d: S.capsule(x, top, z, x + (R() - 0.5) * 2, top - l, z, 0.9 - R() * 0.3), m: 0, k: 0.8 });
    }
    parts.push({ d: S.ellip(0, top + 1, 0, 9 + s * 4, 2, 3), m: 0, k: 1.5 });
    return { W: 26 + s * 10, H: 30 + s * 14, parts, mats: [{ c: mc, tex: leafTex(51) }], hang: true, top: top + 2 };
  },
  // ── 나무 (3D 픽셀): 참나무·소나무·마른 나무 ──
  // 참나무: 굵은 밑동과 뿌리, 갈래 가지, 가지 끝마다 잎 뭉치 (잎 뭉치는 울퉁불퉁)
  p_oak(s, R, c) {
    const H = [90, 140, 200][s], W = [80, 120, 160][s], tr = [3.2, 4.6, 6.2][s], lean = (R() - 0.5) * 0.12, tt = H * 0.52;
    const trunk = (x, y, z) => {
      const t = clamp(y / tt, 0, 1), cx = lean * y, r = tr * (1.25 - 0.45 * t) + (y < 7 ? (7 - y) * 0.55 : 0);
      return Math.max(Math.hypot(x - cx, z) - r, -y, y - tt - 6);
    };
    const parts = [{ d: trunk, m: 0 }], cl = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + R();
      parts.push({ d: S.capsule(lean * 2, 2.5, 0, Math.cos(a) * tr * 2.4, 0.5, Math.sin(a) * tr * 1.4, tr * 0.42), m: 0, k: 1.2 });
    }
    const nb = 4 + s;
    for (let k = 0; k < nb; k++) {
      const side = k % 2 ? 1 : -1, y0 = tt * (0.55 + 0.4 * R()), x1 = side * W * (0.16 + 0.22 * R()), y1 = tt + H * (0.05 + 0.22 * R()), z1 = (R() - 0.5) * W * 0.22;
      parts.push({ d: S.capsule(lean * y0, y0, 0, x1, y1, z1, tr * 0.42), m: 0, k: 1.4 });
      cl.push([x1, y1 + 4, z1, W * (0.15 + 0.06 * R())]);
    }
    cl.push([lean * tt, tt + H * 0.3, 0, W * 0.24]);
    for (let k = 0; k < 4 + s; k++) cl.push([(R() - 0.5) * W * 0.6, tt + H * (0.12 + 0.3 * R()), (R() - 0.5) * W * 0.3, W * (0.12 + 0.06 * R())]);
    const cc = [lean * tt, tt + H * 0.22, 0], cr = Math.max(W * 0.55, H * 0.4) + 6;
    const canopy = (x, y, z) => {
      const db = len3(x - cc[0], y - cc[1], z - cc[2]) - cr;
      if (db > 5) return db;
      let d = 1e9;
      for (const [px, py, pz, r] of cl) d = Math.min(d, len3(x - px, y - py, z - pz) - r);
      return d + (vn3(x * 0.2, y * 0.2, z * 0.2, 61) - 0.5) * 7 + (vn3(x * 0.55, y * 0.55, z * 0.55, 62) - 0.5) * 2.4;
    };
    parts.push({ d: canopy, m: 1, k: 2.5 });
    const leaf = R() < 0.18 ? mix(c.top, 0xd8a040, 0.55) : c.top;
    return { W: W + 24, H: H + 20, parts, mats: [{ c: 0x6e4a2e, tex: woodTex(63) }, { c: leaf, tex: leafTex(64) }], pitch: 0.28 };
  },
  // 소나무: 곧은 줄기에 아래로 넓은 가지층 여럿 (층 가장자리는 들쭉날쭉)
  p_pine(s, R, c) {
    const H = [100, 150, 210][s], W = [50, 72, 100][s], tr = [2.6, 3.6, 4.8][s], n = 4 + s;
    const parts = [{ d: S.taper(0, 0, tr * 1.3, tr * 0.5, 0, H * 0.96), m: 0 }];
    const needle = mix(c.top, 0x1e4a32, 0.45);
    for (let k = 0; k < n; k++) {
      const y0 = H * (0.18 + (0.72 * k) / n), h = H * (0.3 - 0.02 * k), r = (W / 2) * (1 - (0.75 * k) / n);
      parts.push({ d: ((f, sd) => (x, y, z) => f(x, y, z) + (vn3(x * 0.35, y * 0.25, z * 0.35, sd) - 0.5) * 3.2)(S.taper(0, 0, r, 0.6, y0, y0 + h), k + 70), m: 1, k: 1.5 });
    }
    return { W: W + 16, H: H + 12, parts, mats: [{ c: 0x5a3a24, tex: woodTex(71) }, { c: needle, tex: leafTex(72) }], pitch: 0.28 };
  },
  // 마른 나무: 비틀린 줄기, 두 번 갈라지는 가지 (껍질 무늬)
  p_dead(s, R, c) {
    const H = [90, 140, 200][s], tr = [2.8, 4, 5.4][s], parts = [];
    let px = 0, py = 0;
    const seg = 5;
    for (let k = 0; k < seg; k++) {
      const nx = px + (R() - 0.5) * tr * 2.2, ny = py + (H * 0.62) / seg;
      parts.push({ d: S.capsule(px, py, 0, nx, ny, 0, tr * (1.2 - (0.6 * k) / seg)), m: 0, k: 1.2 });
      if (k >= 2) {
        const side = k % 2 ? 1 : -1, bx = nx + side * H * (0.14 + 0.12 * R()), by = ny + H * (0.08 + 0.14 * R());
        parts.push({ d: S.capsule(nx, ny, 0, bx, by, (R() - 0.5) * 8, tr * 0.42), m: 0, k: 0.9 });
        parts.push({ d: S.capsule(bx, by, 0, bx + side * H * 0.08, by + H * (0.06 + 0.08 * R()), (R() - 0.5) * 6, tr * 0.22), m: 0, k: 0.6 });
        parts.push({ d: S.capsule(bx, by, 0, bx - side * H * 0.04, by + H * 0.1, 0, tr * 0.2), m: 0, k: 0.6 });
      }
      ((px = nx), (py = ny));
    }
    parts.push({ d: S.capsule(px, py, 0, px + (R() - 0.5) * 8, py + H * 0.16, 0, tr * 0.35), m: 0, k: 0.8 });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + R();
      parts.push({ d: S.capsule(0, 2, 0, Math.cos(a) * tr * 2.6, 0.4, Math.sin(a) * tr * 1.4, tr * 0.45), m: 0, k: 1 });
    }
    return { W: H * 0.75, H: H + 14, parts, mats: [{ c: 0x7a6a5a, tex: (x, y, z) => woodTex(73)(x, y, z) + (Math.sin(y * 1.3 + x * 0.4) > 0.75 ? -0.15 : 0) }], pitch: 0.26 };
  },
  // 사슬 (천장)
  p_chain(s, R, c) {
    const top = 80, n = 6 + s * 4, parts = [];
    for (let k = 0; k < n; k++) {
      const y = top - k * 3.4, rot = k % 2;
      parts.push({ d: rot ? (x, yy, z) => S.torus(0, 0, 0, 1.6, 0.55)(yy - y, x, z) : (x, yy, z) => S.torus(0, 0, 0, 1.6, 0.55)(x, z, yy - y) , m: 0 });
    }
    R() < 0.6 && parts.push({ d: S.capsule(0, top - n * 3.4 - 1, 0, 0, top - n * 3.4 - 5, 0, 1.6), m: 0 });
    return { W: 14, H: n * 3.4 + 14, parts, mats: [{ c: 0x6a6a78, gloss: 0.8 }], hang: true, top: top + 2, pitch: 0.2 };
  },
  // 거미줄 (천장 구석)
  p_web(s, R, c) {
    const parts = [], top = 30, sp = 10 + s * 4;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.45;
      parts.push({ d: S.capsule(0, top, 0, Math.cos(a) * sp * 0.2 + Math.sin(a) * sp, top + Math.cos(a) * -sp * 0.9, 0, 0.32), m: 0 });
    }
    for (let q = 1; q <= 3; q++) parts.push({ d: ((rr) => (x, y, z) => Math.max(Math.abs(Math.hypot(x, y - top) - rr) - 0.3, Math.abs(z) - 0.3, y - top))(q * sp * 0.3), m: 0 });
    return { W: sp * 2 + 8, H: sp + 8, parts, mats: [{ c: 0xd8d8e8 }], hang: true, top, pitch: 0.05 };
  },
  // ── 그린스텝 (고원 목초지·수도원) ──
  // 돌탑 (납작한 돌을 쌓음)
  p_cairn(s, R, c) {
    const parts = [], n = 4 + s;
    let y = 0, r = 6 + s * 1.5;
    for (let k = 0; k < n; k++) {
      const h = r * 0.45;
      parts.push({ d: ((f, sd) => (X, Y, Z) => f(X, Y, Z) + (vn3(X * 0.4, Y * 0.4, Z * 0.4, sd) - 0.5) * 1.2)(S.ellip((R() - 0.5) * 2, y + h, (R() - 0.5) * 2, r, h, r * 0.8), k), m: 0, k: 0.6 });
      y += h * 1.7;
      r *= 0.78;
    }
    return { W: 26 + s * 6, H: Math.ceil(y) + 10, parts, mats: [{ c: mix(c.rock, 0xc8c0b0, 0.35), tex: stoneTex(12) }] };
  },
  // 선돌 (위는 이끼 모자, 밑동 풀)
  p_menhir(s, R, c) {
    const h = 26 + s * 8, w = 5 + s;
    const stone = ((f, sd) => (X, Y, Z) => f(X, Y, Z) + (vn3(X * 0.3, Y * 0.12, Z * 0.3, sd) - 0.5) * 2.2)(S.taper(0, 0, w, w * 0.7, 0, h), 3);
    const parts = [{ d: stone, m: 0 }, { d: S.ellip(0, h * 0.96, 0, w * 0.8, 2.4, w * 0.62), m: 1, k: 1 }, { d: S.ellip(0, 0.6, 0, w + 3, 1.5, w), m: 2 }];
    return { W: w * 2 + 16, H: h + 10, parts, mats: [{ c: mix(c.rock, 0xa8a8a0, 0.4), tex: stoneTex(14) }, { c: sh(c.top, -0.15), tex: leafTex(5) }, { c: sh(c.top, -0.2), tex: leafTex(6) }] };
  },
  // 양 (복슬복슬한 털, 검은 얼굴·다리)
  p_sheep(s, R, c) {
    const parts = [];
    for (let k = 0; k < 7; k++) parts.push({ d: S.sphere(-5 + k * 1.7 + (R() - 0.5), 8 + (R() - 0.5) * 2, (R() - 0.5) * 3, 4 + R() * 1.2), m: 0, k: 1.6 });
    parts.push({ d: S.ellip(7.5, 9.5, 0, 2.6, 2.2, 2), m: 1, k: 0.5 });
    parts.push({ d: S.ellip(6.8, 11.6, 1.8, 1.4, 0.7, 0.8), m: 1 });
    for (const [x, z] of [[-4, 1.5], [-3, -1.5], [3.5, 1.5], [4.5, -1.5]]) parts.push({ d: S.capsule(x, 0.5, z, x, 5, z, 0.8), m: 1 });
    return { W: 30, H: 22, parts, mats: [{ c: 0xf0ece2, tex: leafTex(8) }, { c: 0x3a3030 }] };
  },
  // 나무 울타리 한 칸
  p_fence(s, R, c) {
    const parts = [], L = 10;
    for (const x of [-L, L]) parts.push({ d: S.box(x, 6, 0, 1, 6, 1, 0.3), m: 0 });
    for (const y of [5, 9.5]) parts.push({ d: S.box(0, y, 0, L + 1, 0.7, 0.6, 0.2), m: 0 });
    return { W: L * 2 + 10, H: 18, parts, mats: [{ c: 0x8a6440, tex: woodTex(4, "x") }] };
  },
  // 건초 더미
  p_hay(s, R, c) {
    const parts = [{ d: S.log(0, 5, 0, 5, 7), m: 0 }];
    s > 0 && parts.push({ d: S.log(-3, 14, 0, 4.5, 6), m: 0 });
    return { W: 30, H: s > 0 ? 28 : 18, parts, mats: [{ c: 0xd8b860, tex: (x, y, z) => (Math.abs((((x + 20) % 4) + 4) % 4 - 2) < 0.4 ? -0.15 : 0) + (vn3(x * 0.8, y * 0.8, z * 0.8, 3) - 0.5) * 0.3 }] };
  },
  // 기도 깃발 (장대에서 비스듬히 늘어진 줄)
  p_flags(s, R, c) {
    const H = 26 + s * 6, parts = [{ d: S.capsule(0, 0, 0, 0, H, 0, 0.7), m: 0 }];
    const cols = [0xe84a4a, 0xf0d050, 0x4a9ae8, 0x5ac870, 0xf0f0f0];
    for (let k = 0; k < 5; k++) {
      const t = (k + 1) / 6, x = 2 + t * 14, y = H - t * (H - 6) - 2;
      parts.push({ d: S.box(x, y - 2.2, 0, 1.6, 2.2, 0.3, 0.1), m: 1 + k });
    }
    parts.push({ d: S.capsule(0, H - 1, 0, 16, 6, 0, 0.25), m: 0 });
    return { W: 34, H: H + 8, parts, mats: [{ c: 0x7a5a3a }, ...cols.map((cc) => ({ c: cc }))] };
  },
  // 종틀 (나무 틀에 청동 종)
  p_bell(s, R, c) {
    const parts = [
      { d: S.box(-7, 9, 0, 1, 9, 1, 0.2), m: 0 },
      { d: S.box(7, 9, 0, 1, 9, 1, 0.2), m: 0 },
      { d: S.box(0, 18.5, 0, 9, 1, 1.4, 0.3), m: 0 },
      { d: S.taper(0, 0, 3.6, 2, 10, 17), m: 1, k: 0.6 },
      { d: S.sphere(0, 17, 0, 2.2), m: 1, k: 0.8 },
      { d: S.ellip(0, 10, 0, 4, 0.8, 4), m: 1, k: 0.5 },
    ];
    return { W: 26, H: 28, parts, mats: [{ c: 0x7a5434, tex: woodTex(5) }, { c: 0xc8963c, gloss: 0.8 }] };
  },
  // 독서대 (펼친 책)
  p_lectern(s, R, c) {
    const tilt = (b) => (x, y, z) => b(x, y - x * 0.3, z);
    const parts = [
      { d: S.box(0, 0.8, 0, 4, 0.8, 3, 0.2), m: 0 },
      { d: S.box(0, 6, 0, 1, 5.5, 1, 0.2), m: 0 },
      { d: tilt(S.box(0, 12, 0, 5, 0.8, 3.5, 0.3)), m: 0 },
      { d: tilt(S.box(0, 13.2, 0, 4.4, 0.4, 3, 0.2)), m: 1 },
    ];
    return { W: 20, H: 22, parts, mats: [{ c: 0x7a5030, tex: woodTex(6) }, { c: 0xf0e8d0 }] };
  },
  // 거대한 새 둥지 (나뭇가지 고리 + 알)
  p_nest(s, R, c) {
    const parts = [{ d: ((f, sd) => (X, Y, Z) => f(X, Y, Z) + (vn3(X * 0.6, Y * 0.6, Z * 0.6, sd) - 0.5) * 1.6)(S.torus(0, 4, 0, 11, 4), 9), m: 0 }, { d: S.ellip(0, 2.5, 0, 11, 2.5, 7), m: 0, k: 1.5 }];
    for (let k = 0; k < 3; k++) parts.push({ d: S.ellip(-3 + k * 3, 5.5, (R() - 0.5) * 3, 1.8, 2.4, 1.8), m: 1 });
    return { W: 40, H: 16, parts, mats: [{ c: 0x8a6a42, tex: woodTex(7, "x") }, { c: 0xe8e0d0, gloss: 0.4 }] };
  },
  // 회복 샘 돌확 (빛나는 물)
  p_font(s, R, c) {
    const st = mix(c.rock, 0xc8c0b8, 0.45);
    const parts = [
      { d: S.cyl(0, 0, 3, 0, 6, 0.4), m: 0 },
      { d: S.cyl(0, 0, 8, 6, 10, 0.8), m: 0, k: 1 },
      { d: S.cyl(0, 0, 6.6, 8, 11, 0.4), m: 0, sub: 1 },
      { d: S.cyl(0, 0, 6.8, 8.4, 9.2, 0.2), m: 1 },
    ];
    return { W: 26, H: 18, parts, mats: [{ c: st, tex: stoneTex(15) }, { c: 0x7af0ff, emit: [0xe0ffff, 0x80f0ff, 0x40b0e0] }], glow: 0x9af4ff };
  },
  // 물레방아 바퀴 (살 6개 · 물받이 판 · A자 받침)
  p_wheel(s, R, c) {
    const Rr = 13 + s * 3, cy = Rr + 3, parts = [];
    parts.push({ d: (x, y, z) => Math.hypot(Math.hypot(x, y - cy) - Rr, z) - 1.3, m: 0 });
    parts.push({ d: (x, y, z) => Math.hypot(Math.hypot(x, y - cy) - Rr * 0.55, z) - 0.8, m: 0 });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      parts.push({ d: S.capsule(0, cy, 0, Math.cos(a) * Rr, cy + Math.sin(a) * Rr, 0, 0.7), m: 0 });
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, r = Rr + 1.6;
      parts.push({ d: S.box(Math.cos(a) * r, cy + Math.sin(a) * r, 0, 1.5, 1.5, 2.6, 0.2), m: 0 });
    }
    parts.push({ d: S.capsule(0, cy, -4, 0, cy, 4, 1.6), m: 1 });
    for (const sx of [-1, 1]) parts.push({ d: S.capsule(sx * (Rr * 0.6), 0, -4, 0, cy, -4, 1), m: 0 });
    return { W: Rr * 2 + 14, H: cy + Rr + 7, parts, mats: [{ c: 0x7a5434, tex: woodTex(21) }, { c: 0x4a4a52, gloss: 0.5 }] };
  },
  // 베틀 (나무 틀 · 날실 · 짜던 줄무늬 천)
  p_loom(s, R, c) {
    const cols = [0xc84a3a, 0x3a7ac8, 0xd8b040, 0x5aa860][s % 4];
    const parts = [
      { d: S.box(-11, 13, 0, 1.2, 13, 1.2, 0.3), m: 0 },
      { d: S.box(11, 13, 0, 1.2, 13, 1.2, 0.3), m: 0 },
      { d: S.box(0, 25.5, 0, 12.5, 1.2, 1.4, 0.3), m: 0 },
      { d: S.box(0, 8, 0, 12, 1, 1.4, 0.3), m: 0 },
      { d: S.box(0, 13, 0.4, 9.5, 4.5, 0.3, 0.1), m: 1 },
      { d: S.box(0, 4, 3, 10, 0.8, 1, 0.2), m: 0 },
    ];
    for (let k = 0; k < 7; k++) parts.push({ d: S.box(-8.5 + k * 2.85, 21, -0.4, 0.16, 4.2, 0.16), m: 2 });
    return { W: 32, H: 34, parts, mats: [{ c: 0x7a5434, tex: woodTex(9) }, { c: cols, tex: (x, y) => (Math.floor(y * 0.9) % 3 === 0 ? -0.22 : 0.04) }, { c: 0xf0e8d8 }] };
  },
  // 벌통 (짚 꼬아 만든 둥근 벌통, 나무 받침)
  p_hive(s, R, c) {
    const dome = S.ellip(0, 4, 0, 6.5, 9.5, 6.5);
    const parts = [
      { d: S.box(0, 3, 0, 7.5, 0.8, 5, 0.3), m: 1 },
      { d: S.box(-5.5, 1.2, 0, 0.8, 1.3, 0.8), m: 1 },
      { d: S.box(5.5, 1.2, 0, 0.8, 1.3, 0.8), m: 1 },
      { d: (x, y, z) => Math.max(dome(x, y, z), 3.6 - y), m: 0 },
      { d: S.ellip(0, 5.6, 6.2, 1.7, 1.2, 2), m: 2, sub: 1 },
    ];
    return { W: 22, H: 20, parts, mats: [{ c: 0xd0a850, tex: (x, y) => ((((y * 1.2) % 2.4) + 2.4) % 2.4 < 0.6 ? -0.22 : 0.02) }, { c: 0x6a4a2e, tex: woodTex(11) }, { c: 0x2a2018 }] };
  },
  // 치즈 선반 (둥근 치즈가 세 칸에)
  p_cheese(s, R, c) {
    const parts = [{ d: S.box(-11, 13, 0, 1, 13, 1, 0.2), m: 0 }, { d: S.box(11, 13, 0, 1, 13, 1, 0.2), m: 0 }];
    for (const y of [1, 10, 19]) parts.push({ d: S.box(0, y, 0, 11.5, 0.7, 3.4, 0.2), m: 0 });
    for (const y of [1, 10, 19]) for (let k = 0; k < 3; k++) R() < 0.85 && parts.push({ d: S.cyl(-6.5 + k * 6.5 + (R() - 0.5), 0, 2.8, y + 0.7, y + 3.7, 0.8), m: 1 });
    return { W: 30, H: 30, parts, mats: [{ c: 0x7a5434, tex: woodTex(13) }, { c: 0xf0c050, gloss: 0.3 }] };
  },
  // 잎 덩어리 (수관을 이루는 큰 잎 뭉치): 잎 공 여럿을 겹친 덩이, 위는 밝고 아래는 어둡게 · s 4 이상 = 바늘잎(짙은 초록)
  p_foliage(s, R, c) {
    const conif = s >= 4, ss = conif ? s - 4 : s, rx = 16 + ss * 11, ry = 10 + ss * 6, parts = [], n = 10 + ss * 6;
    const base = conif ? mix(c.top, 0x1e4a2a, 0.45) : c.top;
    for (let k = 0; k < n; k++) {
      const a = R() * 6.283, r = Math.sqrt(R()), x = Math.cos(a) * rx * 0.78 * r, y = ry + 2 + Math.sin(a) * ry * 0.72 * r;
      parts.push({ d: S.sphere(x, y, (R() - 0.5) * rx * 0.5, (4.5 + ss * 2.3) * (0.7 + R() * 0.6)), m: R() < 0.3 ? 1 : R() < 0.15 ? 2 : 0, k: 2.2 });
    }
    return { W: rx * 2 + 18, H: ry * 2 + 16, parts, mats: [{ c: base, tex: leafTex(7) }, { c: mix(base, 0xe0f490, 0.28), tex: leafTex(9) }, { c: mix(base, 0x0e2a14, 0.35), tex: leafTex(11) }] };
  },
  // 돌난간 한 칸 (아래 띠 · 병 모양 난간동자 다섯 · 위 손잡이)
  p_balus(s, R, c) {
    const st = mix(c.rock, 0xe8e2d4, 0.55), L = 14, parts = [{ d: S.box(0, 1.2, 0, L, 1.2, 2.2, 0.3), m: 0 }, { d: S.box(0, 12.6, 0, L + 0.8, 1.2, 2.6, 0.4), m: 0, k: 0.5 }];
    for (let k = 0; k < 5; k++) {
      const x = -L + 2.6 + k * ((2 * L - 5.2) / 4);
      parts.push({ d: S.ellip(x, 5.6, 0, 1.7, 2.6, 1.7), m: 0, k: 0.8 }, { d: S.cyl(x, 0, 0.9, 2, 11.5, 0.3), m: 0 }, { d: S.ellip(x, 10, 0, 1.3, 1, 1.3), m: 0 });
    }
    return { W: L * 2 + 8, H: 20, parts, mats: [{ c: st, tex: stoneTex(31) }] };
  },
  // 가로등 (쇠기둥 · 굽은 팔 · 빛나는 등)
  p_lamp(s, R, c) {
    const H = 30 + s * 4, parts = [
      { d: S.box(0, 1, 0, 3, 1, 3, 0.4), m: 0 },
      { d: S.cyl(0, 0, 0.9, 1, H, 0.3), m: 0 },
      { d: S.capsule(0, H, 0, 4.5, H + 2, 0, 0.6), m: 0 },
      { d: S.box(5, H - 3, 0, 2.2, 3, 2.2, 0.4), m: 1 },
      { d: S.box(5, H + 0.4, 0, 2.8, 0.6, 2.8, 0.3), m: 0 },
    ];
    return { W: 22, H: H + 8, parts, mats: [{ c: 0x3a3c48, gloss: 0.6 }, { c: 0xffd27a, emit: [0xfff4d0, 0xffd27a, 0xe0a040] }], glow: 0xffe0a0 };
  },
  // 유목 천막 (펠트 벽 · 원뿔 지붕 · 붉은 띠 · 나무 문 · 꼭대기 연기 구멍)
  p_yurt(s, R, c) {
    const r = 13 + s * 2, wh = 9 + s, rh = 9 + s * 1.5;
    const felt = (x, y, z) => (Math.abs(y - wh * 0.55) < 0.9 ? -0.32 : 0) + (vn3(x * 0.5, y * 0.5, z * 0.5, 4) - 0.5) * 0.18;
    const roofT = (x, y, z) => {
      const a = Math.atan2(z, x);
      return (Math.abs(((a * 8) / Math.PI) % 1) < 0.12 ? -0.18 : 0) + (Math.abs(y - wh - 2.2) < 0.8 ? -0.35 : 0);
    };
    const parts = [
      { d: S.cyl(0, 0, r, 0, wh, 0.8), m: 0 },
      { d: S.taper(0, 0, r + 1.6, 2.2, wh - 0.3, wh + rh), m: 1, k: 0.8 },
      { d: S.cyl(0, 0, 2.6, wh + rh - 0.6, wh + rh + 1, 0.3), m: 3 },
      { d: S.box(-r * 0.25, 4.2, r - 0.4, 2.8, 4.2, 1.2, 0.3), m: 2 },
      { d: S.box(-r * 0.25, 4.2, r + 0.4, 3.4, 4.6, 0.4, 0.2), m: 3 },
    ];
    return { W: r * 2 + 12, H: wh + rh + 10, parts, mats: [{ c: 0xeadfc6, tex: felt }, { c: 0xd8c4a0, tex: roofT }, { c: 0xc8503a, tex: woodTex(19) }, { c: 0x8a5a34, tex: woodTex(23) }] };
  },
  // 기둥 풍차 (나무 몸통 · 받침 다리 · 천 날개 넷)
  p_windmill(s, R, c) {
    const H = 30 + s * 6, hy = H + 5, L = 16 + s * 3, a0 = 0.35 + R() * 0.5;
    const rot = (a, f) => (x, y, z) => {
      const dx = x, dy = y - hy, ca = Math.cos(a), sa = Math.sin(a);
      return f(dx * ca + dy * sa, -dx * sa + dy * ca, z);
    };
    const parts = [
      { d: S.capsule(-6, 0, -2, 0, 14, 0, 1), m: 0 },
      { d: S.capsule(6, 0, -2, 0, 14, 0, 1), m: 0 },
      { d: S.capsule(0, 0, 4, 0, 14, 0, 1), m: 0 },
      { d: S.box(0, 14 + (H - 14) / 2, 0, 5.5, (H - 14) / 2, 5, 0.6), m: 1 },
      { d: S.taper(0, 0, 6.5, 2, H - 1, H + 5), m: 2, k: 0.6 },
      { d: S.capsule(0, hy, 0, 0, hy, 7.5, 1.3), m: 0 },
    ];
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2;
      parts.push({ d: rot(a, (u, v, z) => S.box(L * 0.55, 0, 0, L * 0.55, 0.6, 0.6, 0.2)(u, v, z - 7.5)), m: 0 });
      parts.push({ d: rot(a, (u, v, z) => S.box(L * 0.62, 2.2, 0, L * 0.4, 1.9, 0.25, 0.1)(u, v, z - 7.2)), m: 3 });
    }
    return { W: L * 2 + 20, H: hy + L + 8, parts, mats: [{ c: 0x7a5434, tex: woodTex(27) }, { c: 0xa87a4c, tex: woodTex(29, "x") }, { c: 0x8a4a34, tex: woodTex(31) }, { c: 0xf0e8d4, tex: (x, y) => (((Math.floor(x * 0.7) + Math.floor(y * 0.7)) & 1) ? -0.08 : 0.04) }] };
  },
  // 양털 말리는 줄 (장대 둘 · 줄에 걸린 털뭉치)
  p_wool(s, R, c) {
    const parts = [{ d: S.capsule(-13, 0, 0, -13, 19, 0, 0.7), m: 0 }, { d: S.capsule(13, 0, 0, 13, 19, 0, 0.7), m: 0 }, { d: S.capsule(-13, 18, 0, 13, 17, 0, 0.3), m: 0 }];
    for (let k = 0; k < 3; k++) {
      const x = -7.5 + k * 7.5;
      for (let j = 0; j < 4; j++) parts.push({ d: S.sphere(x + (R() - 0.5) * 3, 15 - j * 1.9, (R() - 0.5) * 1.2, 2.5), m: 1, k: 1.2 });
    }
    return { W: 34, H: 26, parts, mats: [{ c: 0x7a5a3a, tex: woodTex(17) }, { c: 0xf0ece2, tex: leafTex(8) }] };
  },
  // ── 광산 ──
  // 광차 (철 바퀴 넷 · 나무 통 · 광석 무더기)
  p_cart(s, R, c) {
    const parts = [
      { d: S.box(0, 9, 0, 11, 5, 5.5, 0.6), m: 0 },
      { d: S.box(0, 10.5, 0, 9.6, 4.2, 4.2), m: 0, sub: 1 },
      { d: S.box(0, 4, 0, 11.6, 0.8, 6, 0.2), m: 1 },
      { d: S.box(0, 14, 0, 11.4, 0.7, 5.8, 0.2), m: 1 },
    ];
    for (const sx of [-7, 7]) for (const sz of [-5, 5]) parts.push({ d: S.capsule(sx, 3, sz - 0.8, sx, 3, sz + 0.8, 3), m: 1 });
    for (let k = 0; k < 7; k++) parts.push({ d: S.sphere(-7 + k * 2.4 + (R() - 0.5), 14 + R() * 2.5, (R() - 0.5) * 5, 2.2 + R() * 1.2), m: 2, k: 1.2 });
    R() < 0.6 && parts.push({ d: S.sphere(1, 17, 0, 1.6), m: 3 });
    return { W: 34, H: 26, parts, mats: [{ c: 0x7a5434, tex: (x, y, z) => (Math.abs(((x + 12) % 6) - 3) < 0.5 ? -0.2 : woodTex(41)(x, y, z)) }, { c: 0x4a4a54, gloss: 0.6 }, { c: 0x5a5260, tex: stoneTex(43) }, { c: 0xffa040, emit: [0xffe8b0, 0xffb060, 0xd06a2a] }], glow: 0xffb060 };
  },
  // 광석 바위 (거친 바위 몸에 빛나는 광맥 조각)
  p_ore(s, R, c) {
    const r = 7 + s * 3, parts = [{ d: ((f) => (x, y, z) => f(x, y, z) + (vn3(x * 0.35, y * 0.35, z * 0.35, 51) - 0.5) * 3.2)(S.ellip(0, r * 0.7, 0, r * 1.3, r, r)), m: 0 }];
    for (let k = 0; k < 4 + s * 2; k++) {
      const a = R() * Math.PI * 2, b = R() * 1.2;
      parts.push({ d: S.sphere(Math.cos(a) * r * 1.05 * Math.cos(b), r * 0.7 + Math.sin(b) * r * 0.85, Math.sin(a) * r * 0.6 + 2, 1.2 + R() * 1.4), m: 1, k: 0.6 });
    }
    const vein = [[0xffd8a0, 0xe88a3a, 0xa04a1a], [0xe0f4ff, 0x80c8f0, 0x3a70b0], [0xfff0a0, 0xe0b030, 0x8a6a10]][s % 3];
    return { W: r * 3 + 8, H: r * 2 + 6, parts, mats: [{ c: mix(c.rock, 0x4a4450, 0.4), tex: stoneTex(53) }, { c: vein[1], emit: vein }], glow: vein[0] };
  },
  // 모루 (받침 통나무 + 쇠 모루 + 망치)
  p_anvil(s, R, c) {
    const parts = [
      { d: S.cyl(0, 0, 6, 0, 8, 0.6), m: 0 },
      { d: S.box(0, 10, 0, 4.5, 2, 3, 0.4), m: 1 },
      { d: S.box(0, 13, 0, 9, 1.6, 3.4, 0.4), m: 1 },
      { d: S.capsule(9, 13, 0, 13, 13.4, 0, 1.2), m: 1 },
      { d: S.capsule(-4, 15, 3, 3, 21, 4, 0.6), m: 0 },
      { d: S.box(3.5, 21.5, 4, 2.4, 1.3, 1.3, 0.3), m: 1 },
    ];
    return { W: 34, H: 28, parts, mats: [{ c: 0x6a4a30, tex: woodTex(47) }, { c: 0x3e3e48, gloss: 0.8 }] };
  },
  // 증기 굴착기 (보일러 통 · 굴뚝 · 앞에 나사 송곳)
  p_drill(s, R, c) {
    const parts = [
      { d: S.capsule(-8, 9, 0, 6, 9, 0, 7), m: 0 },
      { d: S.cyl(-8, 0, 2.4, 14, 26, 0.4), m: 1 },
      { d: S.torus(-8, 26, 0, 2.6, 0.7), m: 1 },
      { d: (x, y, z) => { const t = clamp((x - 12) / 14, 0, 1), rr = 6 * (1 - t) + 0.4; return Math.max(Math.hypot(y - 9, z) - rr - Math.sin(x * 1.6 + Math.atan2(z, y - 9)) * 0.9, 12 - x, x - 27); }, m: 2 },
      { d: S.box(-2, 1.4, 0, 12, 1.4, 6, 0.3), m: 1 },
      { d: S.sphere(-1, 12, 6.2, 2), m: 3 },
    ];
    for (const sx of [-14, 2]) parts.push({ d: S.capsule(sx, 3, -6, sx, 3, 6, 3), m: 1 });
    return { W: 50, H: 36, parts, mats: [{ c: 0x8a5a3a, gloss: 0.7, tex: (x, y) => (Math.abs(((x + 20) % 5) - 2.5) < 0.4 ? -0.25 : 0) }, { c: 0x3e3e48, gloss: 0.6 }, { c: 0x9a9aa8, gloss: 0.9 }, { c: 0xff8040, emit: [0xfff0c0, 0xffa050, 0xc05020] }], glow: 0xffa060 };
  },
};
export const PROP_KINDS = Object.keys(KINDS);
// 대략 크기 (자리 고를 때): [폭, 높이]
export function propSize(kind, s) {
  const k = KINDS[kind];
  if (!k) return [24, 24];
  const d = k(s, rng(1), { top: 0x6a9a3a, rock: 0x8a7a6a, acc: 0xffd060 });
  return [d.W - 6, d.H - 4];
}
export const propHangs = (kind) => ["p_stalac", "p_roots", "p_banner", "p_chain", "p_web", "p_tapestry", "p_cage", "p_chand", "p_moss"].includes(kind);
const CACHE = new Map();
// sc = 크기 배율, g = 때·이끼, e = 기둥 높이·폭 { h, w }
export function paintProp(kind, s, v, pal, sc = 1, g = 0, e = null) {
  const key = [kind, s, v, pal.top, pal.rock, pal.acc, sc, g, e ? e.h + "x" + e.w : ""].join(":");
  if (CACHE.has(key)) return CACHE.get(key);
  const R = rng((v + 1) * 7919 + s * 131 + kind.length * 17);
  const d = KINDS[kind](s, R, pal, e);
  const W = Math.ceil(d.W * sc) + 8, H = Math.ceil(d.H * sc) + 8;
  const res = render(W, H, d.parts, d.mats, { hang: d.hang, glow: d.glow, pitch: d.pitch, sc, grime: g, base: d.hang ? H - Math.ceil((d.top ?? 40) * sc) - 6 : 4 });
  CACHE.set(key, res);
  return res;
}
