// 지형 그림 공용 재료: 해시·색 섞기·5단계 명암 팔레트·둥근 돌 무늬 (칸 그림과 자연 지형 그림이 같이 쓴다)
export const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
export const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export const mix = (a, b, t) => {
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export const pack = (c) => (0xff000000 | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0;
export const unpack = (v) => ((v & 255) << 16) | (v & 0xff00) | ((v >> 16) & 255);
export const CAP = { plains: "grass", forest: "grass", cave: "rock", desert: "sand", snow: "snow", fortress: "ledge", kingdom: "ledge", abyss: "rock" };

// 5단계 팔레트 + 외곽선. 그늘은 보라빛, 빛은 따뜻하게
export function ramp(b) {
  // 그늘은 차갑되 보라로 치우치지 않게 (흙이 분홍빛으로 뜨지 않도록), 빛은 따뜻하게
  return [mix(sh(b, 0.4), 0xfff0d4, 0.18), sh(b, 0.16), b, mix(sh(b, -0.3), 0x2c2a34, 0.14), mix(sh(b, -0.52), 0x1e1c24, 0.24), mix(sh(b, -0.74), 0x120f14, 0.38)];
}
// 지하 생물군계
export const BIOMES = {
  lush: { name: "이끼 동굴", rock: 0x7c8a6c, cap: [0x5aa83e, 0xa8e070], wall: 0x2a3a2a, glow: 0xffb040 },
  drip: { name: "종유석 동굴", rock: 0xa8845e, cap: null, wall: 0x3a2a20, glow: 0xffe0b0 },
  geode: { name: "자수정 동굴", rock: 0x6e6486, cap: null, wall: 0x241c34, glow: 0xc080ff },
  deep: { name: "심층암 지대", rock: 0x4e566a, cap: null, wall: 0x14181e, glow: 0x30e0d0 },
  mine: { name: "쇠맥 광산", rock: 0x6c6470, cap: null, wall: 0x221e26, glow: 0xffa050 },
  magma: { name: "용암 지대", rock: 0x58403c, cap: null, wall: 0x1e1210, glow: 0xff7020 },
};

// 둥근 돌 명암을 한 번만 계산해 두는 반복 타일 (구역마다 다시 계산하면 한 번에 0.2초씩 멈췄다)
const LV_TILES = new Map();
export function lvTile(G) {
  let t = LV_TILES.get(G);
  if (t) return t;
  const n = 18, T = G * n, a = new Uint8Array(T * T);
  const wrap = (c) => ((c % n) + n) % n;
  for (let wy = 0; wy < T; wy++)
    for (let wx = 0; wx < T; wx++) {
      const gx = Math.floor(wx / G), gy = Math.floor(wy / G);
      let f1 = 1e9, f2 = 1e9, id = 0, dx1 = 0, dy1 = 0;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const cx = gx + i, cy = gy + j, hx = wrap(cx), hy = wrap(cy);
          const px = (cx + 0.2 + H(hx, hy, 1) * 0.6) * G, py = (cy + 0.2 + H(hx, hy, 2) * 0.6) * G;
          const dx = wx - px, dy = (wy - py) * 1.2, d = dx * dx + dy * dy;
          if (d < f1) ((f2 = f1), (f1 = d), (id = hx * 7919 + hy * 31), (dx1 = dx), (dy1 = dy));
          else if (d < f2) f2 = d;
        }
      const e = Math.sqrt(f2) - Math.sqrt(f1);
      let L;
      if (e < 1.1) L = 5;
      else {
        // 둥근 모서리 돌: 가장자리 띠(약 3px)만 바깥으로 기울어 왼쪽 위는 밝고 오른쪽 아래는 어둡다, 가운데는 거의 평평
        //   + 돌마다 밝기 · 잔결 · 일부 돌에 가는 금
        const R = G * 0.55, dl = Math.hypot(dx1, dy1) || 1, nx = dx1 / dl, ny = dy1 / dl;
        const bev = Math.max(0, 1 - (e - 1.1) / 3.2), tilt = bev * bev * 1.3 + 0.22 * Math.min(1, dl / R);
        const I = (-nx * 0.6 - ny * 0.8) * tilt + (H(id, 3) - 0.5) * 0.6 + (H(wx >> 1, wy >> 1, 11) - 0.5) * 0.2;
        L = I > 0.62 ? 0 : I > 0.22 ? 1 : I > -0.22 ? 2 : I > -0.62 ? 3 : 4;
        if (H(id, 13) > 0.8 && dl < R * 0.75) {
          const an = H(id, 14) * Math.PI, dd = Math.abs(dx1 * Math.sin(an) - dy1 * Math.cos(an));
          dd < 0.6 && (L = Math.min(5, L + 2));
        }
        const q = H(wx, wy, 7);
        q > 0.985 && (L = Math.max(0, L - 1));
        q < 0.012 && (L = Math.min(4, L + 1));
      }
      a[wy * T + wx] = L;
    }
  t = { a, T };
  LV_TILES.set(G, t);
  return t;
}
export const lvq = (wx, wy, G) => {
  const t = lvTile(G), T = t.T;
  return t.a[(((wy | 0) % T) + T) % T * T + ((((wx | 0) % T) + T) % T)];
};
