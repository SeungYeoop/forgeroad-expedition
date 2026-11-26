// 그린스텝 배경: 구름 바다 위로 솟은 붉은 사암 탁상 고원(테푸이)들
//   원경: 높은 새털구름 · 안개에 묻힌 먼 고원 실루엣(가는 폭포) · 구름 바다
//   중경: 가까운 고원 (층층 사암·세로 골·초록 윗면·폭포와 물보라) · 떠 있는 바위 · 더 가까운 구름 바다
//   근경: 화면 아래 큰 뭉게구름 꼭대기
//   빛은 왼쪽 위(아침 해), 멀수록 하늘색에 묻힌다. 가로 W 주기로 끝없이 이어진다
import * as G from "./bg3d.js";
import { mass, ramp } from "./bgart.js";
const W = 640;
const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
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
const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 1D 값 잡음 (주기 W)
const pn = (x, sc, seed) => {
  const n = Math.max(1, Math.round(W / sc)), fx = x / sc, i = Math.floor(fx), f = fx - i, u = f * f * (3 - 2 * f);
  const a = hash(((i % n) + n) % n, seed), b = hash((((i + 1) % n) + n) % n, seed);
  return a + (b - a) * u;
};
const BANDS = [0, 0.08, -0.05, 0.05, -0.1, 0.03, -0.03];

// 탁상 고원 하나: 평평한 윗면(풀), 거의 곧은 절벽(아래로 조금 벌어짐), 가로 지층·세로 골, 왼쪽 밝고 오른쪽 그늘
function tepui(B, cx, base, w, h, o) {
  const { rock, top, skyC, haze = 0, seed = 1, falls = [] } = o;
  const topY = Math.round(base - h);
  // 가장자리는 풍화로 들쭉날쭉, 어깨는 둥글게, 아래로 조금 벌어진다
  const half = (y) => (w / 2) * (1 + Math.max(0, (y - topY) / h) ** 2 * 0.22);
  const eL = (y) => cx - half(y) + (pn(y * 3, 11, seed) - 0.5) * 7 + (pn(y, 37, seed + 9) - 0.5) * 12;
  const eR = (y) => cx + half(y) + (pn(y * 3, 13, seed + 1) - 0.5) * 7 + (pn(y, 41, seed + 10) - 0.5) * 12;
  const topAt = (x) => topY + (pn(x * 2, 17, seed + 5) - 0.5) * 4 + Math.max(0, Math.abs(x - cx) - w * 0.4) * 0.7;
  mass(B, cx - w * 0.8, topY - 8, w * 1.6, B.h - topY + 8, (X, Y) => Y >= topAt(X) && X > eL(Y) && X < eR(Y), { col: rock, round: Math.max(6, w * 0.1), bump: 0.45, sc: 10, strata: 0.6, grooves: 0.32, haze, skyC, seed, warp: 1.2 });
  // 윗면 풀 덮개 (붓 뭉치 · 가장자리로 처진 풀)
  const GR = ramp(top);
  for (let x = Math.floor(cx - w * 0.75); x <= cx + w * 0.75; x++) {
    let y0 = -1;
    for (let y = topY - 8; y < topY + 30; y++) if (y >= topAt(x) && x > eL(y) && x < eR(y)) { y0 = y; break; }
    if (y0 < 0) continue;
    const capN = 3 + Math.floor(pn(x * 2, 9, seed + 4) * 3) + (hash(x >> 1, 3, seed) > 0.8 ? 2 : 0);
    for (let j = 0; j < capN; j++) {
      const hb = hash(x >> 1, (y0 + j) >> 1, seed + 6);
      const L = j === 0 ? 1 : j === capN - 1 ? 4 : hb > 0.85 ? 1 : hb < 0.12 ? 3 : 2;
      B.put(x, y0 + j, mix(GR[L], skyC, haze));
    }
    hash(x, seed, 7) > 0.6 && B.put(x, y0 - 1, mix(GR[hash(x, 8) > 0.5 ? 1 : 2], skyC, haze));
  }
  // 폭포: 윗면 가장자리 근처에서 아래로 (흰 줄 + 흔들림), 아래 물보라
  for (const fx of falls) {
    const x0 = cx + fx * w * 0.5;
    for (let y = topY + 1; y < B.h; y++) {
      const sx = x0 + Math.round(Math.sin(y * 0.08 + seed) * 0.6);
      B.put(sx, y, mix(0xffffff, skyC, haze * 0.7), 220);
      B.put(sx + 1, y, mix(0xd8f0ff, skyC, haze * 0.7), 140);
    }
  }
}
// 구름 바다: 뭉게구름 꼭대기를 줄지어 놓고 그 아래는 구름 몸통으로 메운다
function cloudSea(B, top, s0, s1, light, shade, R, h, seed, n = 12) {
  for (let i = 0; i < n; i++) {
    const x = ((i + h.next() * 0.6) * W) / n, y = top + R(-6, 6), s = s0 + h.next() * (s1 - s0);
    G.cloud(B, x, y, s, light, shade, 255, seed + i);
  }
  const body = mix(light, shade, 0.35);
  for (let y = top + Math.round(8 * s0); y < B.h; y++) for (let x = 0; x < W; x++) B.has(x, y) || B.put(x, y, mix(body, shade, Math.min(1, (y - top) / 90) * 0.5));
}

export function paintSteppe(T, S, E, h) {
  const B = G.buffer(W, T.h ?? 360);
  const skyC = E.sky[1], seed = h.int(1, 9999);
  const R = (a, b) => h.int(a, b);
  const rock = E.rock, top = E.top;
  const light = mix(skyC, 0xffffff, 0.82), shade = mix(E.sky[0], skyC, 0.62);
  if (S === 0) {
    // 새털구름 (가로로 긴 옅은 줄)
    for (let i = 0; i < 16; i++) {
      const x = R(0, W), y = R(16, 140), L = R(40, 150);
      for (let k = 0; k < L; k++) {
        const a = Math.round(90 * (1 - Math.abs(k - L / 2) / (L / 2)));
        B.put(x + k, y + Math.round(Math.sin((x + k) * 0.02) * 2), light, a);
        hash(i, k, seed) > 0.6 && B.put(x + k, y + 1, light, a >> 1);
      }
    }
    // 먼 고원들 (안개에 묻힌 분홍빛)
    const far = mix(E.far, rock, 0.25);
    for (let i = 0; i < 5; i++) {
      const cx = ((i + 0.3 + h.next() * 0.4) * W) / 5, w = R(50, 130), hh = R(45, 120);
      tepui(B, cx, 300, w, hh, { rock: far, top: mix(top, far, 0.45), skyC, haze: 0.5, seed: seed + i, falls: i % 2 ? [-0.6] : [] });
    }
    cloudSea(B, 292, 0.8, 1.3, light, shade, R, h, seed + 20, 14);
    B.toHt(T);
    return;
  }
  if (S === 1) {
    // 가까운 고원 (붉은 사암)
    for (let i = 0; i < 3; i++) {
      const cx = ((i + 0.2 + h.next() * 0.6) * W) / 3, w = R(110, 200), hh = R(110, 190);
      tepui(B, cx, 335, w, hh, { rock: mix(rock, E.far, 0.15), top, skyC, haze: 0.22, seed: seed + 40 + i, falls: i === 1 ? [-0.7, 0.55] : [0.6] });
    }
    // 떠 있는 바위
    for (let i = 0; i < 4; i++) {
      const x = R(0, W), y = R(90, 200), w = R(18, 40);
      G.island(B, x, y, w, top, rock, (c) => mix(c, skyC, 0.3), seed + 60 + i);
    }
    cloudSea(B, 318, 1.2, 1.9, light, shade, R, h, seed + 80, 10);
    B.toHt(T);
    return;
  }
  // ── 근경: 큰 뭉게구름 꼭대기 ──
  cloudSea(B, 342, 2, 3, mix(light, 0xffffff, 0.3), mix(shade, light, 0.15), R, h, seed + 100, 7);
  B.toHt(T);
}
