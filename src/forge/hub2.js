import { enhanceHub, hub3dUpdate } from "./hub3d.js";
import { prims } from "./props3d.js";
import * as G3 from "./bg3d.js";
// 거점 "불씨 마을" — 처음부터 다시 그린 허브. 모든 그림은 캔버스에 픽셀 단위로 직접 그린다.
import { wardrobe3d, training3d, dojo3d, board3d, stall3d } from "./hubmodels.js";
const hex = (c) => "#" + (c & 0xffffff).toString(16).padStart(6, "0");
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const mix = (a, b, t) => {
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const ramp5 = (b) => [mix(sh(b, 0.42), 0xfff2d8, 0.18), sh(b, 0.17), b, mix(sh(b, -0.3), 0x3c2848, 0.2), mix(sh(b, -0.52), 0x24183a, 0.32), mix(sh(b, -0.74), 0x140c1e, 0.45)];
const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const vn = (x, y, s, seed) => {
  const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = H(gx, gy, seed), b = H(gx + 1, gy, seed), c = H(gx, gy + 1, seed), d = H(gx + 1, gy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

function painter(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = !1;
  const p = {
    c,
    x,
    w,
    h,
    lights: [],
    r(a, b, ww, hh, col, al = 1) {
      x.globalAlpha = al;
      x.fillStyle = hex(col);
      x.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh));
      x.globalAlpha = 1;
    },
    px(a, b, col, al = 1) {
      p.r(a, b, 1, 1, col, al);
    },
    // 세로 그라데이션 띠
    grad(a, b, ww, hh, c1, c2) {
      for (let i = 0; i < hh; i++) p.r(a, b + i, ww, 1, mix(c1, c2, i / Math.max(1, hh - 1)));
    },
    // 돌벽: 둥근 돌덩이마다 왼쪽 위 빛으로 5단계 명암 (3D를 픽셀로)
    stone(a, b, ww, hh, base, seed = 1) {
      const R5 = ramp5(base), G = 11;
      for (let y = 0; y < hh; y++)
        for (let x = 0; x < ww; x++) {
          const wx = x + seed * 37, wy = y + seed * 19;
          const gx = Math.floor(wx / G), gy = Math.floor(wy / G);
          let f1 = 1e9, f2 = 1e9, id = 0, dx1 = 0, dy1 = 0;
          for (let jj = -1; jj <= 1; jj++)
            for (let ii = -1; ii <= 1; ii++) {
              const cx = gx + ii, cy = gy + jj;
              const px = (cx + 0.2 + H(cx, cy, 1) * 0.6) * G, py = (cy + 0.2 + H(cx, cy, 2) * 0.6) * G;
              const dx = wx - px, dy = (wy - py) * 1.25, d = dx * dx + dy * dy;
              if (d < f1) ((f2 = f1), (f1 = d), (id = cx * 7919 + cy), (dx1 = dx), (dy1 = dy));
              else if (d < f2) f2 = d;
            }
          const e = Math.sqrt(f2) - Math.sqrt(f1);
          let L;
          if (e < 1.1) L = 5;
          else {
            const Rr = G * 0.55, edge = Math.max(0, 1 - e / 3.4), k = 0.55 + edge * 1.3;
            const I = (dx1 / Rr) * k * -0.6 + (dy1 / Rr) * k * -0.8 + (H(id, 3) - 0.5) * 0.5;
            L = I > 0.85 ? 0 : I > 0.3 ? 1 : I > -0.35 ? 2 : I > -0.95 ? 3 : 4;
          }
          // 벽 모서리: 왼쪽 빛, 오른쪽 그늘, 아래쪽 땅 그늘
          if (x === 0 || x === ww - 1) L = 5;
          else if (x === 1) L = Math.min(L, 1);
          else if (x > ww - 4) L = Math.min(4, L + 1);
          if (y > hh - 5 && L < 5) L = Math.min(4, L + 1);
          p.px(a + x, b + y, R5[L]);
        }
    },
    // 회벽 (얼룩)
    plaster(a, b, ww, hh, base, seed = 2) {
      for (let j = 0; j < hh; j++)
        for (let i = 0; i < ww; i += 2) {
          const n = vn(i, j, 9, seed) * 0.7 + H(i, j, seed) * 0.3;
          p.r(a + i, b + j, 2, 1, sh(base, (n - 0.5) * 0.14 - (j > hh - 6 ? 0.12 : 0)));
        }
    },
    // 목재 판자 벽: 판마다 둥근 결과 홈
    planks(a, b, ww, hh, base, vertical = !0, seed = 3) {
      const pw = 6;
      for (let i = 0; i < (vertical ? ww : hh); i += pw) {
        const R5 = ramp5(sh(base, (H(i, seed) - 0.5) * 0.2));
        const n = Math.min(pw, (vertical ? ww : hh) - i);
        for (let k = 0; k < n; k++) {
          const L = k === 0 ? 5 : k === 1 ? 0 : k === 2 ? 1 : k === n - 1 ? 4 : 2;
          vertical ? p.r(a + i + k, b, 1, hh, R5[L]) : p.r(a, b + i + k, ww, 1, R5[L]);
        }
        for (let g = 0; g < 3; g++) {
          const gx = H(i, g, seed + 4);
          vertical ? p.r(a + i + 2 + Math.floor(gx * (pw - 3)), b + Math.floor(H(g, i, seed) * hh), 1, 5, R5[3]) : p.r(a + Math.floor(H(g, i, seed) * ww), b + i + 2 + Math.floor(gx * (pw - 3)), 5, 1, R5[3]);
        }
      }
    },
    beam(a, b, ww, hh, col = 0x4a2e1c) {
      if (ww <= 6 && hh > ww) return void prims(p.px).cyl(a, b, ww, hh, sh(col, 0.15));
      if (hh >= 3 && ww > hh) return void prims(p.px).box(a, b, ww, hh, sh(col, 0.15), { noOutline: hh < 4 });
      p.r(a, b, ww, hh, col);
      ww > hh ? (p.r(a, b, ww, 1, sh(col, 0.25)), p.r(a, b + hh - 1, ww, 1, sh(col, -0.4))) : (p.r(a, b, 1, hh, sh(col, 0.25)), p.r(a + ww - 1, b, 1, hh, sh(col, -0.4)));
    },
    diag(x0, y0, x1, y1, t, col = 0x4a2e1c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const xx = x0 + ((x1 - x0) * i) / n, yy = y0 + ((y1 - y0) * i) / n;
        p.r(xx, yy, t, t, col);
        p.px(xx, yy, sh(col, 0.25));
      }
    },
    // 맞배지붕: 둥근 기와 한 장 한 장에 빛과 그늘, 두꺼운 처마와 처마 그림자
    gable(cx, base, ww, hh, col, seed = 4) {
      const R5 = ramp5(col);
      for (let j = 0; j < hh; j++) {
        const half = (ww / 2) * (j / hh);
        const y = base - hh + j;
        const row = Math.floor(j / 5), off = row % 2 ? 3 : 0, v = j % 5;
        for (let i = -Math.ceil(half); i < half; i++) {
          const left = i < 0;
          const u = (i + off + 600) % 6;
          // 기와 한 장: 위는 밝고 아래 끝은 어둡다, 가운데 볼록
          let L = v === 0 ? 1 : v === 4 ? 4 : v === 3 ? 3 : 2;
          u === 0 && (L = Math.min(5, L + 2));
          u === 1 && v < 3 && (L = Math.max(0, L - 1));
          !left && (L = Math.min(4, L + 1));
          H(Math.floor((i + off + 600) / 6), row, seed) > 0.85 && (L = Math.min(4, L + 1));
          p.px(cx + i, y, R5[L]);
        }
        p.px(cx - Math.ceil(half) - 1, y, R5[5]);
        p.px(cx - Math.ceil(half) - 2, y, R5[4]);
        p.px(cx + Math.ceil(half), y, R5[5]);
        p.px(cx + Math.ceil(half) + 1, y, R5[5]);
      }
      p.r(cx - 1, base - hh - 2, 3, 4, R5[5]);
      p.r(cx, base - hh - 2, 1, 1, R5[1]);
      // 처마 두께와 그 아래 그림자
      p.r(cx - ww / 2 - 4, base, ww + 8, 1, R5[1]);
      p.r(cx - ww / 2 - 4, base + 1, ww + 8, 2, R5[4]);
      p.r(cx - ww / 2 - 4, base + 3, ww + 8, 1, R5[5]);
      p.r(cx - ww / 2 - 1, base + 4, ww + 2, 4, 0x140c1e, 0.32);
      p.r(cx - ww / 2 - 1, base + 8, ww + 2, 3, 0x140c1e, 0.15);
    },
    // 모임지붕 (사다리꼴)
    hip(a, b, ww, hh, col, inset = 12, seed = 5) {
      const R5 = ramp5(col);
      for (let j = 0; j < hh; j++) {
        const ins = inset * (1 - j / hh);
        const row = Math.floor(j / 5), off = row % 2 ? 3 : 0, v = j % 5;
        for (let i = Math.floor(ins); i < ww - ins; i++) {
          const u = (i + off) % 6;
          let L = v === 0 ? 1 : v === 4 ? 4 : v === 3 ? 3 : 2;
          u === 0 && (L = Math.min(5, L + 2));
          u === 1 && v < 3 && (L = Math.max(0, L - 1));
          i > ww / 2 && (L = Math.min(4, L + 1));
          i < ins + 2 && (L = Math.max(0, L - 1));
          p.px(a + i, b + j, R5[L]);
        }
        p.px(a + Math.floor(ins) - 1, b + j, R5[5]);
        p.px(a + Math.ceil(ww - ins), b + j, R5[5]);
      }
      p.r(a - 3, b + hh, ww + 6, 1, R5[1]);
      p.r(a - 3, b + hh + 1, ww + 6, 2, R5[4]);
      p.r(a - 3, b + hh + 3, ww + 6, 1, R5[5]);
      p.r(a, b + hh + 4, ww, 4, 0x140c1e, 0.3);
      p.r(a + inset, b - 1, ww - inset * 2, 2, R5[5]);
    },
    window(a, b, ww, hh, lit = !0, arch = !1, frame = 0x3a2414) {
      p.r(a - 2, b - 2, ww + 4, hh + 4, frame);
      p.r(a - 2, b - 2, ww + 4, 1, sh(frame, 0.3));
      for (let j = 0; j < hh; j++)
        for (let i = 0; i < ww; i++) {
          if (arch && j < ww / 2) {
            const dx = i - (ww - 1) / 2, dy = ww / 2 - j;
            if (dx * dx + dy * dy > (ww / 2) ** 2) continue;
          }
          const col = lit ? mix(0xfff0b0, 0xe07a20, Math.min(1, (j / hh) * 0.8 + Math.abs(i - ww / 2) / ww)) : mix(0x3a4a6a, 0x1a2234, j / hh);
          p.px(a + i, b + j, col);
        }
      // 창틀의 깊이: 위·왼쪽 안쪽 그늘
      p.r(a, b, ww, 2, 0x000000, 0.35);
      p.r(a, b, 2, hh, 0x000000, 0.25);
      p.r(a + Math.floor(ww / 2), b, 1, hh, frame);
      p.r(a, b + Math.floor(hh / 2), ww, 1, frame);
      lit && p.px(a + 3, b + 3, 0xffffff);
      // 창턱: 밝은 윗면 + 어두운 앞면 + 그림자
      p.r(a - 3, b + hh + 1, ww + 6, 1, sh(frame, 0.45));
      p.r(a - 3, b + hh + 2, ww + 6, 2, sh(frame, -0.2));
      p.r(a - 2, b + hh + 4, ww + 4, 2, 0x000000, 0.25);
      lit && p.lights.push([a + ww / 2, b + hh / 2, Math.max(ww, hh)]);
    },
    door(a, b, ww, hh, col = 0x6a3a1e, open = !1) {
      p.r(a - 2, b - 2, ww + 4, hh + 2, 0x2a1a10);
      for (let j = 0; j < hh; j++)
        for (let i = 0; i < ww; i++) {
          const dx = i - (ww - 1) / 2, dy = ww / 2 - j;
          if (j < ww / 2 && dx * dx + dy * dy > (ww / 2) ** 2) continue;
          let cc = open ? mix(0xffd080, 0x8a4a18, j / hh) : sh(col, (i % 5 === 0 ? -0.35 : 0) + (H(i, 7) - 0.5) * 0.1);
          p.px(a + i, b + j, cc);
        }
      if (!open) {
        p.r(a + 1, b + hh * 0.3, ww - 2, 2, 0x2a2a30);
        p.r(a + 1, b + hh * 0.72, ww - 2, 2, 0x2a2a30);
        p.r(a + ww - 4, b + hh * 0.55, 2, 2, 0xd8b050);
      } else p.lights.push([a + ww / 2, b + hh * 0.6, ww * 1.4]);
    },
    awning(a, b, ww, hh, c1, c2) {
      for (let j = 0; j < hh; j++)
        for (let i = 0; i < ww; i++) {
          const s = Math.floor(i / 8) % 2 ? c2 : c1;
          p.px(a + i, b + j, sh(s, -j / hh * 0.25 + (j === 0 ? 0.2 : 0)));
        }
      for (let i = 0; i < ww; i++) {
        const k = i % 8;
        const dd = Math.round(Math.sin((k / 8) * Math.PI) * 3);
        for (let j = 0; j < dd; j++) p.px(a + i, b + hh + j, sh(Math.floor(i / 8) % 2 ? c2 : c1, -0.3));
      }
      p.r(a, b + hh + 3, ww, 2, 0x000000, 0.18);
    },
    sign(a, b, ww, hh, draw) {
      p.r(a - 4, b - 6, ww + 8, 2, 0x2a2a30);
      p.r(a + 2, b - 6, 1, 6, 0x2a2a30);
      p.r(a + ww - 3, b - 6, 1, 6, 0x2a2a30);
      p.planks(a, b, ww, hh, 0x9a6a3a, !1, a);
      p.r(a, b, ww, 1, 0x4a2e1c), p.r(a, b + hh - 1, ww, 1, 0x2a1a10), p.r(a, b, 1, hh, 0x4a2e1c), p.r(a + ww - 1, b, 1, hh, 0x2a1a10);
      draw && draw(a + ww / 2, b + hh / 2);
    },
    chimney(a, b, ww, hh) {
      p.stone(a, b, ww, hh, 0x8a6a5a, a);
      p.r(a - 2, b - 3, ww + 4, 4, 0x4a3a34);
      p.r(a - 2, b - 3, ww + 4, 1, 0x7a6a64);
    },
    shadow(a, b, ww, hh, al = 0.3) {
      p.r(a, b, ww, hh, 0x000000, al);
    },
    flowerBox(a, b, ww) {
      p.r(a, b, ww, 4, 0x6a3a1e);
      p.r(a, b, ww, 1, 0x9a5a2e);
      for (let i = 1; i < ww - 1; i += 2) {
        p.px(a + i, b - 1, 0x4a8a3a);
        H(i, a) > 0.5 && p.px(a + i, b - 2, [0xff6a8a, 0xffd04a, 0xf0f0ff, 0xc06aff][Math.floor(H(a, i) * 4)]);
      }
    },
    barrel(a, b) {
      return void prims(p.px).cyl(a - 6, b - 15, 12, 15, 0x8a5a32, { bands: [3, 11], cap: 1 });
      for (let j = 0; j < 14; j++) {
        const ww = 10 + Math.round(Math.sin((j / 13) * Math.PI) * 2);
        for (let i = 0; i < ww; i++) p.px(a - ww / 2 + i, b - 14 + j, sh(0x8a5a32, (i < ww / 3 ? 0.15 : i > (ww * 2) / 3 ? -0.25 : 0) + (i % 3 === 0 ? -0.15 : 0)));
      }
      p.r(a - 6, b - 12, 12, 1, 0x3a3a40), p.r(a - 6, b - 4, 12, 1, 0x3a3a40), p.r(a - 5, b - 14, 10, 1, 0x5a3a20);
    },
    crate(a, b, s = 14) {
      const Q = prims(p.px);
      Q.box(a, b - s, s, s, 0xa87a48, { tex: 1 });
      Q.stick(a + 2, b - s + 2, a + s - 3, b - 3, 2, 0x6a4428);
      return;
      p.planks(a, b - s, s, s, 0xa87a48, !1, a + b);
      p.r(a, b - s, s, 1, 0x4a2e1c), p.r(a, b - 1, s, 1, 0x3a2414), p.r(a, b - s, 1, s, 0x4a2e1c), p.r(a + s - 1, b - s, 1, s, 0x3a2414);
      p.diag(a + 1, b - s + 1, a + s - 2, b - 2, 1, 0x5a3a1e);
    },
  };
  return p;
}

// ── 하늘·원경 ──
function skyCanvas(W, Hh) {
  const B = G3.buffer(W, Hh, !1);
  G3.sky(B, 0x241640, 0xffb064, 0xc0506a);
  G3.stars(B, 90, Hh * 0.35, 7);
  // 해: 겹겹의 빛무리 + 디더링 원반
  const sx = W * 0.68, sy = Hh * 0.62;
  for (let r = 80; r > 22; r -= 2) for (let a = 0; a < 360; a += 1) {
    const x = sx + Math.cos((a * Math.PI) / 180) * r, y = sy + Math.sin((a * Math.PI) / 180) * r;
    B.put(x, y, mix(0xfff0c0, 0xff8040, r / 80), 10);
  }
  for (let y = -22; y <= 22; y++) for (let x = -22; x <= 22; x++) x * x + y * y <= 484 && B.put(sx + x, sy + y, mix(0xfffbe8, 0xffc070, (y + 22) / 44 + ((x + y) & 1) * 0.04));
  // 노을 구름: 아래가 붉게 물든다
  for (let i = 0; i < 7; i++) G3.cloud(B, H(i, 9) * W, 46 + H(i, 8) * 100, 0.6 + H(i, 7) * 0.6, 0xffc8b0, 0x8a4a7a, 255, i + 3);
  return B.toCanvas();
}
function mountainsCanvas(W, Hh, seed, col, snow, haze, amp, baseY) {
  const B = G3.buffer(W, Hh);
  G3.mountains(B, { base: baseY, amp, col, skyC: haze, haze: 0.32, snow: !!snow, seed, sc: 100 });
  return B.toCanvas();
}
function castleCanvas() {
  const B = G3.buffer(260, 200, !1);
  const C = 0x6a4a6a;
  // 절벽
  G3.hills(B, { base: 175, amp: 30, col: 0x4a3448, top: null, skyC: 0xc0607a, haze: 0.1, seed: 7, sc: 80 });
  // 성벽 + 탑
  G3.box(B, 40, 110, 180, 55, C, (c) => c, { bricks: 1 });
  for (let i = 40; i < 220; i += 8) G3.box(B, i, 104, 5, 7, C);
  const tw = (x, w, top) => (G3.box(B, x, top, w, 165 - top, C, (c) => c, { bricks: 1 }), G3.cone(B, x + w / 2, top, w + 8, Math.round(w * 1.2), 0x3a2a4a));
  tw(28, 24, 70), tw(198, 24, 76), tw(88, 28, 48), tw(138, 32, 28);
  // 빛나는 창
  for (const [x, y] of [[40, 90], [210, 96], [102, 64], [102, 92], [154, 44], [154, 74], [154, 104], [60, 128], [90, 128], [120, 128], [180, 128]])
    for (let j = 0; j < 6; j++) for (let i = 0; i < 3; i++) B.put(x + i, y + j, j === 0 ? 0xfff0b0 : 0xffb050);
  // 깃발
  for (const x of [40, 210, 102, 154]) for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) B.put(x + 1 + i, 20 + j + (x === 154 ? -2 : x === 102 ? 18 : 46), i === 5 ? 0x8a2020 : 0xd04030);
  return B.toCanvas();
}
function roofsCanvas(W, Hh) {
  const B = G3.buffer(W, Hh);
  let x = 0, k = 0;
  while (x < W) {
    const w = 30 + Math.floor(H(k, 1) * 40), h = 30 + Math.floor(H(k, 2) * 50), top = Hh - h;
    const col = mix(0x4a2a40, 0x6a3a3a, H(k, 3));
    G3.box(B, x, top, w, h, col);
    // 박공 지붕: 기와 줄마다 볼록
    const rh = 10 + Math.floor(H(k, 4) * 14), R5 = G3.ramp5(mix(0x5a2a2a, 0x3a2a4a, H(k, 6)));
    for (let j = 0; j < rh; j++) {
      const hw = (w / 2 + 3) * (j / rh), v = j % 4, L = v === 0 ? 1 : v === 3 ? 4 : 2;
      for (let i = -Math.ceil(hw); i < hw; i++) B.put(x + w / 2 + i, top - rh + j, R5[Math.abs(i) >= Math.ceil(hw) - 1 ? 5 : i < 0 ? L : Math.min(4, L + 1)]);
    }
    H(k, 5) > 0.5 && G3.box(B, x + w * 0.7, top - rh - 6, 5, rh, sh(col, -0.1));
    for (let wy = top + 6; wy < Hh - 6; wy += 10)
      for (let wx = x + 5; wx < x + w - 6; wx += 9)
        if (H(wx, wy, k) > 0.55) for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) B.put(wx + i, wy + j, j === 0 ? 0xfff0b0 : H(wx, wy) > 0.3 ? 0xffb050 : 0xff8030);
    x += w - 2;
    k++;
  }
  return B.toCanvas();
}
// 자갈길
function streetCanvas(W, Hh) {
  const p = painter(W, Hh);
  p.r(0, 0, W, Hh, 0x4a3a34);
  // 연석
  for (let x = 0; x < W; x += 12) {
    const c = sh(0x9a8a80, (H(x, 1) - 0.5) * 0.16);
    p.r(x, 0, 11, 5, c);
    p.r(x, 0, 11, 1, sh(c, 0.3));
    p.r(x, 4, 11, 1, sh(c, -0.35));
  }
  // 자갈
  for (let y = 6; y < Hh; y += 6) {
    const off = (y / 6) % 2 ? 4 : 0;
    for (let x = -off; x < W; x += 8) {
      const c = sh(mix(0x8a7468, 0x6a5a58, H(x, y)), -((y - 6) / Hh) * 0.45);
      p.r(x + 1, y + 1, 6, 4, c);
      p.r(x + 1, y + 1, 6, 1, sh(c, 0.25));
      p.r(x + 6, y + 2, 1, 3, sh(c, -0.3));
    }
  }
  return p.c;
}

// ── 건물 ──
function forge() {
  const p = painter(210, 210), B = 205;
  p.shadow(10, B - 4, 190, 4, 0.35);
  p.chimney(150, 20, 22, 110);
  p.stone(20, 100, 170, B - 100, 0x8a7a80, 11);
  p.gable(100, 104, 196, 60, 0x9a3a28);
  p.plaster(46, 70, 108, 34, 0xe0cca8);
  p.beam(46, 68, 108, 4);
  p.beam(46, 70, 4, 34), p.beam(150, 70, 4, 34), p.beam(98, 70, 4, 34);
  p.diag(50, 72, 96, 100, 3), p.diag(102, 100, 148, 72, 3);
  p.window(66, 80, 14, 14), p.window(120, 80, 14, 14);
  // 큰 화로 입구
  const fx = 44, fy = 130, fw = 64, fh = 70;
  p.r(fx - 6, fy - 6, fw + 12, fh + 6, 0x3a3038);
  for (let j = 0; j < fh; j++)
    for (let i = 0; i < fw; i++) {
      const dx = i - fw / 2, dy = fw / 2 - j;
      if (j < fw / 2 && dx * dx + dy * dy > (fw / 2) ** 2) continue;
      const t = j / fh;
      p.px(fx + i, fy + j, mix(0x2a1010, 0xff8a20, Math.max(0, t - 0.25) * 1.3 * (1 - Math.abs(dx) / fw)));
    }
  for (let i = 0; i < 9; i++) p.r(fx + 6 + i * 6, fy + fh - 10 - (H(i, 4) * 10), 4, 10, mix(0xffe060, 0xff5010, H(i, 5)));
  p.lights.push([fx + fw / 2, fy + fh - 14, 70, 0xff6a20]);
  // 아치 돌
  for (let a = 0; a <= 12; a++) {
    const ang = Math.PI + (a / 12) * Math.PI, r = fw / 2 + 3;
    p.r(fx + fw / 2 + Math.cos(ang) * r - 3, fy + fw / 2 + Math.sin(ang) * r - 3, 6, 6, a % 2 ? 0xa89aa0 : 0x8a7a80);
  }
  p.door(136, 150, 26, 50);
  p.sign(120, 112, 40, 22, (cx, cy) => {
    p.r(cx - 10, cy - 2, 14, 6, 0x5a5a64), p.r(cx - 10, cy - 2, 14, 1, 0x9a9aa4), p.r(cx + 4, cy - 4, 3, 10, 0x6a3a1e);
  });
  // 모루·무기걸이
  p.r(10, B - 18, 30, 6, 0x4a4a54), p.r(14, B - 12, 22, 4, 0x3a3a44), p.r(20, B - 8, 10, 8, 0x3a3a44), p.r(10, B - 18, 30, 1, 0x8a8a94);
  p.beam(170, B - 46, 30, 3), p.beam(172, B - 46, 3, 46), p.beam(195, B - 46, 3, 46);
  for (let k = 0; k < 3; k++) (p.r(178 + k * 6, B - 44, 2, 30, 0xb8b8c8), p.r(177 + k * 6, B - 16, 4, 2, 0x6a3a1e));
  return p;
}
function armory() {
  const p = painter(190, 200), B = 195;
  p.shadow(8, B - 4, 176, 4, 0.35);
  p.stone(14, B - 40, 162, 40, 0x7a7488, 21);
  p.plaster(18, 70, 154, B - 110, 0xd8c8b0);
  p.beam(16, 68, 158, 4), p.beam(16, B - 42, 158, 4);
  for (const x of [16, 60, 126, 170]) p.beam(x, 68, 4, B - 108);
  p.diag(20, 72, 58, B - 44, 3), p.diag(130, B - 44, 168, 72, 3);
  p.hip(6, 26, 178, 44, 0x3a5a8a, 22);
  p.window(76, 84, 16, 18, !0, !0), p.window(100, 84, 16, 18, !0, !0);
  p.r(150, 18, 12, 30, 0x4a4a5a);
  p.awning(64, 116, 64, 10, 0x2a5aa8, 0xe8e0d0);
  p.door(86, B - 40, 22, 40);
  // 방패 간판
  p.sign(24, 98, 30, 26, (cx, cy) => {
    for (let j = -8; j < 9; j++) {
      const hw = j < 2 ? 7 : 7 - (j - 1);
      p.r(cx - hw, cy + j, hw * 2, 1, j < 0 ? 0x3a6ac8 : 0x2a4a98);
    }
    p.r(cx - 1, cy - 8, 2, 16, 0xe8c050);
  });
  // 갑옷 마네킹
  const man = (x) => {
    p.r(x - 1, B - 40, 2, 40, 0x5a3a20);
    p.r(x - 8, B - 36, 16, 18, 0x9aa0b8), p.r(x - 8, B - 36, 16, 2, 0xd0d8e8), p.r(x + 4, B - 36, 4, 18, 0x6a7088);
    p.r(x - 10, B - 38, 6, 5, 0xb0b8d0), p.r(x + 4, B - 38, 6, 5, 0x7a8098);
    p.r(x - 5, B - 46, 10, 9, 0xa8b0c8), p.r(x - 3, B - 43, 6, 2, 0x1a1a24);
    p.r(x - 6, B - 4, 12, 4, 0x4a3020);
  };
  man(150), man(170);
  return p;
}
function training() {
  const p = painter(240, 150), B = 145;
  // 울타리
  for (let x = 4; x < 236; x += 18) (p.beam(x, B - 34, 5, 34, 0x7a4a26), p.r(x, B - 36, 5, 3, 0x5a3418));
  p.beam(4, B - 30, 232, 4, 0x8a5a30), p.beam(4, B - 16, 232, 4, 0x8a5a30);
  // 모래 바닥
  p.r(0, B - 4, 240, 4, 0xc8a070);
  // 과녁
  const tx = 200, ty = B - 70;
  p.beam(tx - 2, ty, 4, 70, 0x6a3a1e);
  for (let r = 14; r > 0; r--) {
    const c = [0xf0e8d8, 0xc83a2a][Math.floor(r / 3) % 2];
    for (let j = -r; j <= r; j++) {
      const hw = Math.round(Math.sqrt(r * r - j * j));
      p.r(tx - hw, ty + j, hw * 2, 1, c);
    }
  }
  p.r(tx + 2, ty - 4, 10, 2, 0x8a5a30), p.r(tx + 10, ty - 6, 3, 6, 0xe0e0e0);
  // 깃발 장대
  for (const [x, c] of [[30, 0xc83a2a], [120, 0x2a6ab8]]) {
    p.beam(x, B - 110, 3, 110, 0x5a3418);
    for (let j = 0; j < 26; j++) p.r(x + 3, B - 106 + j, 20 - Math.abs(j - 13) * 0.3 - (j > 18 ? (j - 18) : 0), 1, sh(c, (j % 6 < 3 ? 0.08 : -0.08)));
    p.r(x - 1, B - 112, 5, 3, 0xd8b050);
  }
  // 무기 거치대
  p.beam(60, B - 44, 36, 3), p.beam(62, B - 44, 3, 44), p.beam(92, B - 44, 3, 44);
  for (let k = 0; k < 4; k++) p.r(68 + k * 6, B - 54 + (k % 2) * 4, 2, 40, [0xb8b8c8, 0x8a5a30][k % 2]);
  p.barrel(150, B - 4), p.crate(160, B - 4);
  return p;
}
function dojo() {
  const p = painter(200, 210), B = 205;
  p.shadow(8, B - 4, 184, 4, 0.35);
  p.stone(12, B - 22, 176, 22, 0x8a8478, 31);
  p.planks(22, 96, 156, B - 118, 0xa87040, !0, 7);
  for (const x of [20, 62, 134, 176]) p.beam(x, 92, 6, B - 112, 0x7a2a1a);
  // 이중 지붕 (끝이 들린 처마)
  const roof = (y, w, hh, col) => {
    for (let j = 0; j < hh; j++) {
      const t = j / hh, hw = w / 2 * (0.55 + 0.45 * t) + (j > hh - 4 ? (j - hh + 4) * 3 : 0);
      for (let i = -hw; i < hw; i++) p.px(100 + i, y + j, sh(col, (i < 0 ? 0.06 : -0.14) + ((Math.floor(i) + 200) % 6 === 0 ? -0.25 : 0)));
    }
    p.r(100 - w / 2 - 12, y + hh, w + 24, 3, sh(col, -0.5));
    p.r(100 - w / 2 - 14, y + hh - 3, 4, 3, sh(col, -0.3)), p.r(100 + w / 2 + 10, y + hh - 3, 4, 3, sh(col, -0.3));
  };
  roof(18, 120, 30, 0x2a6a4a);
  p.plaster(56, 51, 88, 20, 0xe8dcc0);
  p.window(76, 56, 10, 10), p.window(114, 56, 10, 10);
  roof(68, 190, 26, 0x2a6a4a);
  // 미닫이 문 (창호지)
  for (let k = 0; k < 2; k++) {
    const x = 74 + k * 26;
    p.r(x, 130, 24, 70, 0x5a2a1a);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) p.r(x + 2 + i * 7, 132 + j * 17, 6, 15, 0xfff0c8);
    p.lights.push([x + 12, 165, 30]);
  }
  // 등롱
  for (const x of [32, 168]) {
    p.r(x, 96, 1, 8, 0x2a1a10);
    for (let j = 0; j < 14; j++) p.r(x - 5 + Math.abs(j - 7) * 0.4, 104 + j, 11 - Math.abs(j - 7) * 0.8, 1, mix(0xffa040, 0xd03020, j / 14));
    p.lights.push([x, 111, 26, 0xff6030]);
  }
  p.sign(84, 104, 32, 18, (cx, cy) => {
    p.r(cx - 6, cy - 4, 2, 9, 0x2a1a10), p.r(cx - 6, cy - 4, 9, 2, 0x2a1a10), p.r(cx + 2, cy - 1, 4, 2, 0x2a1a10), p.r(cx, cy + 2, 6, 2, 0x2a1a10);
  });
  return p;
}
function tower() {
  const p = painter(150, 300), B = 295;
  p.shadow(10, B - 4, 130, 4, 0.35);
  p.stone(30, 80, 90, B - 80, 0x7a6a8a, 41);
  // 원통 음영
  for (let x = 30; x < 120; x++) {
    const t = (x - 30) / 90;
    p.r(x, 80, 1, B - 80, t < 0.25 ? 0xffffff : 0x000000, t < 0.25 ? (0.25 - t) * 0.4 : (t - 0.5) * 0.45 * (t > 0.5 ? 1 : 0));
  }
  p.r(24, 76, 102, 8, 0x4a3a5a), p.r(24, 76, 102, 1, 0x8a7a9a);
  for (let i = 24; i < 126; i += 8) p.r(i, 70, 5, 6, 0x5a4a6a);
  // 뾰족 지붕
  for (let j = 0; j < 70; j++) {
    const hw = 54 * (j / 70);
    for (let i = -hw; i < hw; i++) {
      const row = Math.floor(j / 4);
      let c = sh(0x5a2a8a, (i < 0 ? 0.1 : -0.2) + ((Math.floor(i + 100 + (row % 2) * 3) % 6 === 0) ? -0.25 : 0));
      p.px(75 + i, 6 + j, c);
    }
  }
  p.r(74, 0, 2, 8, 0xd8c060);
  p.r(70, 2, 10, 2, 0xd8c060);
  p.window(66, 100, 18, 26, !0, !0, 0x2a1a3a);
  p.window(46, 160, 12, 18, !0, !0, 0x2a1a3a), p.window(92, 160, 12, 18, !0, !0, 0x2a1a3a);
  p.window(66, 205, 18, 22, !0, !0, 0x2a1a3a);
  // 마법 창빛은 보라
  p.lights = p.lights.map((l) => [...l, 0xb070ff]);
  p.door(62, B - 46, 26, 46, 0x4a2a5a, !0);
  p.lights[p.lights.length - 1][3] = 0xc890ff;
  p.r(56, B - 6, 38, 6, 0x6a6080), p.r(52, B - 3, 46, 3, 0x5a5070);
  p.sign(100, 240, 26, 22, (cx, cy) => {
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
      p.r(cx + Math.cos(ang) * 6 - 1, cy + Math.sin(ang) * 6 - 1, 3, 3, 0x8a40d0);
    }
    p.r(cx - 1, cy - 1, 3, 3, 0xe0b0ff);
  });
  return p;
}
function wardrobe() {
  const p = painter(180, 170), B = 165;
  p.shadow(6, B - 4, 168, 4, 0.35);
  // 큰 천막
  for (let j = 0; j < 120; j++) {
    const t = j / 120, hw = 20 + 70 * Math.min(1, t * 1.4);
    for (let i = -hw; i < hw; i++) {
      const s = Math.floor((i + 200) / 14) % 2 ? 0x2a7a5a : 0xe8d8b0;
      p.px(90 + i, B - 124 + j, sh(s, (i < 0 ? 0.05 : -0.15) - (t > 0.9 ? 0.15 : 0)));
    }
  }
  p.r(88, B - 140, 4, 18, 0x5a3418);
  for (let j = 0; j < 8; j++) p.r(92, B - 140 + j, 12 - j, 1, 0xd8b040);
  // 입구
  for (let j = 0; j < 60; j++) {
    const hw = 8 + j * 0.35;
    p.r(90 - hw, B - 64 + j, hw * 2, 1, mix(0xffd080, 0x6a3a18, j / 60));
  }
  p.lights.push([90, B - 34, 50]);
  // 상자·옷걸이
  for (const x of [22, 140]) {
    p.planks(x, B - 22, 22, 18, 0x8a5a2e, !1, x);
    p.r(x, B - 22, 22, 2, 0xd8b050), p.r(x + 9, B - 16, 4, 4, 0xd8b050);
  }
  p.beam(8, B - 70, 3, 66), p.beam(36, B - 70, 3, 66), p.beam(8, B - 70, 31, 3);
  for (let k = 0; k < 3; k++) p.r(12 + k * 8, B - 66, 7, 22, [0xa83a3a, 0x3a6aa8, 0x6a8a3a][k]);
  return p;
}
function board() {
  const p = painter(150, 130), B = 125;
  p.shadow(6, B - 3, 138, 3, 0.35);
  p.beam(14, 20, 6, B - 20), p.beam(130, 20, 6, B - 20);
  p.hip(6, 6, 138, 16, 0x8a3a28, 10);
  p.planks(20, 26, 110, 66, 0x7a4a26, !1, 4);
  p.r(22, 28, 106, 62, 0xb88050);
  for (let i = 0; i < 1400; i++) p.px(22 + H(i, 1) * 106, 28 + H(i, 2) * 62, H(i, 3) > 0.5 ? 0x9a6a3a : 0xd09a60);
  const notes = [[28, 32, 26, 30], [58, 34, 30, 22], [92, 30, 30, 34], [32, 66, 22, 20], [62, 60, 28, 26], [96, 68, 24, 18]];
  notes.forEach(([x, y, w, h], i) => {
    p.r(x + 1, y + 1, w, h, 0x000000, 0.25);
    p.r(x, y, w, h, [0xf4e8c8, 0xe8dcb8, 0xfff4d8][i % 3]);
    for (let k = 4; k < h - 3; k += 4) p.r(x + 3, y + k, w - 6 - H(i, k) * 8, 1, 0x7a6a5a);
    p.r(x + w / 2 - 1, y + 1, 3, 3, [0xd03030, 0x3060d0, 0x30a040][i % 3]);
  });
  // 등불
  p.beam(140, 20, 2, 30, 0x2a2a30);
  p.r(136, 50, 10, 12, 0x3a3a40), p.r(138, 52, 6, 8, 0xffd070);
  p.lights.push([141, 56, 30]);
  return p;
}
function gate() {
  const p = painter(260, 260), B = 255;
  p.shadow(10, B - 4, 240, 4, 0.4);
  const towerAt = (x) => {
    p.stone(x, 40, 56, B - 40, 0x8a8090, x + 51);
    p.r(x - 4, 36, 64, 6, 0x5a5260);
    for (let i = x - 4; i < x + 60; i += 10) p.stone(i, 22, 7, 14, 0x8a8090, i);
    p.window(x + 22, 80, 10, 16, !0, !0, 0x2a2430);
    p.r(x + 26, 130, 4, 16, 0x1a1418);
  };
  towerAt(14);
  towerAt(190);
  p.stone(70, 70, 120, B - 70, 0x7a7080, 61);
  p.r(66, 64, 128, 8, 0x5a5260);
  for (let i = 66; i < 194; i += 10) p.stone(i, 52, 7, 12, 0x7a7080, i + 3);
  // 아치 통로 + 빛나는 관문
  const ax = 90, ay = 120, aw = 80, ah = B - 120;
  for (let j = 0; j < ah; j++)
    for (let i = 0; i < aw; i++) {
      const dx = i - aw / 2, dy = aw / 2 - j;
      if (j < aw / 2 && dx * dx + dy * dy > (aw / 2) ** 2) continue;
      const t = Math.hypot(dx / aw, (j - ah * 0.55) / ah);
      p.px(ax + i, ay + j, mix(0xfff4c0, 0x5a2a7a, Math.min(1, t * 1.9)));
    }
  p.lights.push([ax + aw / 2, ay + ah * 0.55, 110, 0xffc070]);
  for (let a = 0; a <= 14; a++) {
    const ang = Math.PI + (a / 14) * Math.PI, r = aw / 2 + 4;
    p.r(ax + aw / 2 + Math.cos(ang) * r - 4, ay + aw / 2 + Math.sin(ang) * r - 4, 8, 8, a % 2 ? 0xb0a8b8 : 0x8a8090);
  }
  // 내려진 쇠창살(위쪽)
  for (let i = 0; i < 8; i++) p.r(ax + 6 + i * 10, ay - 2, 3, 18, 0x2a2a32);
  p.r(ax + 2, ay + 10, aw - 4, 3, 0x2a2a32);
  // 깃발
  for (const x of [36, 212]) {
    for (let j = 0; j < 50; j++) p.r(x, 44 + j, 14, 1, j > 44 ? (j % 2 ? 0x8a1a1a : 0) : sh(0xb02a2a, j % 8 < 4 ? 0.06 : -0.06));
    p.r(x + 4, 60, 6, 6, 0xe8c050);
  }
  return p;
}
function fountain() {
  const p = painter(110, 84), B = 80, Q = prims(p.px);
  p.shadow(4, B - 3, 102, 3, 0.35);
  // 아래 수반: 돌 벽 + 두꺼운 테두리
  p.stone(6, B - 22, 98, 22, 0x9a90a0, 71);
  Q.box(3, B - 27, 104, 6, 0xc0b8c8);
  // 물: 밝은 수면 선과 깊이
  for (let i = 0; i < 92; i++) for (let j = 0; j < 5; j++) p.px(9 + i, B - 32 + j, j === 0 ? 0xc8f0ff : j === 1 ? 0x7ac0f0 : (i + j * 3) % 9 === 0 ? 0x6ab0e8 : 0x3a80d0);
  // 가운데 기둥과 위 수반
  Q.cyl(47, B - 56, 16, 25, 0xa8a0b0, { bands: [6, 18] });
  Q.box(36, B - 61, 38, 6, 0xc0b8c8);
  for (let i = 0; i < 30; i++) for (let j = 0; j < 3; j++) p.px(40 + i, B - 64 + j, j === 0 ? 0xc8f0ff : 0x4a90d8);
  // 동상: 불꽃을 든 대장장이 (금빛)
  Q.box(49, B - 70, 12, 6, 0xb8a888);
  Q.cyl(51, B - 86, 8, 17, 0xd0a040);
  Q.sphere(55, B - 90, 4, 0xe0b850, { shine: 1 });
  Q.stick(58, B - 82, 62, B - 92, 2, 0xc89838);
  Q.sphere(62, B - 95, 3, 0xff9030, { noOutline: 1 });
  p.lights.push([62, B - 95, 22, 0xff8030]);
  return p;
}
function stall(c1, c2, goods) {
  const p = painter(84, 74), B = 70, Q = prims(p.px);
  p.shadow(2, B - 2, 80, 2, 0.3);
  Q.cyl(6, 14, 4, B - 14, 0x6a4428);
  Q.cyl(74, 14, 4, B - 14, 0x6a4428);
  // 차양: 줄무늬 천이 둥글게 늘어진다 (주름마다 빛/그늘)
  for (let i = 0; i < 80; i++) {
    const stripe = Math.floor(i / 8) % 2 ? c2 : c1, k = i % 8;
    const L = [1, 0, 0, 1, 2, 2, 3, 4][k];
    const R5 = [sh(stripe, 0.35), sh(stripe, 0.15), stripe, sh(stripe, -0.25), sh(stripe, -0.45), sh(stripe, -0.7)];
    const drop = Math.round(Math.sin((k / 8) * Math.PI) * 4);
    for (let j = 0; j < 12 + drop; j++) p.px(2 + i, 6 + j, j === 0 ? R5[5] : j === 11 + drop ? R5[5] : j < 2 ? R5[Math.max(0, L - 1)] : R5[L]);
  }
  p.r(2, 4, 80, 2, 0x4a2e1c);
  // 진열대: 두꺼운 판 + 앞판
  Q.box(3, B - 27, 78, 6, 0xb8844c);
  p.planks(5, B - 21, 74, 21, 0x8a5a2e, !1, c1 & 255);
  for (let k = 0; k < 7; k++) {
    const x = 11 + k * 10;
    if (goods === "fruit") Q.sphere(x, B - 31, 3, [0xd83a2a, 0xf0a020, 0x6ab03a][k % 3], { shine: 1 });
    else (Q.cyl(x - 2, B - 38, 5, 11, [0x6a5aa8, 0x2aa8a8, 0xd84a8a][k % 3], { cap: 1 }), Q.box(x - 1, B - 40, 3, 3, 0xd8c8b0, { noOutline: 1 }));
  }
  return p;
}
// ── 알비온식 거점 새 시설 ─────────────────────────────
// 시장: 긴 지붕 아래 좌판 세 칸, 저울 간판, 상자·자루
function destinyStone() {
  const p = painter(120, 200), B = 195;
  p.shadow(10, B - 4, 100, 4, 0.4);
  // 받침 계단
  p.stone(14, B - 20, 92, 20, 0x6a6878, 31);
  p.stone(24, B - 32, 72, 12, 0x7a7888, 32);
  // 돌기둥 (위가 좁은)
  for (let y = 20; y < B - 32; y++) {
    const t = (y - 20) / (B - 52), w = 26 + t * 18;
    for (let x = -w; x <= w; x++) {
      const sh = x < -w + 4 ? 0x1e1c2a : x > w - 5 ? 0x14121e : (x + y * 3) % 17 === 0 ? 0x34304a : 0x28243a;
      p.px(60 + x, y, sh);
    }
  }
  // 뾰족한 머리
  for (let y = 4; y < 20; y++) {
    const w = (y - 4) * 1.7;
    for (let x = -w; x <= w; x++) p.px(60 + x, y, x < -w + 2 ? 0x1e1c2a : 0x2e2a42);
  }
  // 빛나는 육각 그물
  const node = (cx, cy, r, col) => {
    for (let a = 0; a < 6; a++) {
      const a0 = Math.PI / 6 + (a * Math.PI) / 3, a1 = a0 + Math.PI / 3;
      for (let s = 0; s <= 8; s++) {
        const k = s / 8;
        p.px(cx + Math.cos(a0) * r * (1 - k) + Math.cos(a1) * r * k, cy + Math.sin(a0) * r * (1 - k) + Math.sin(a1) * r * k, col);
      }
    }
    p.r(cx - 1, cy - 1, 3, 3, 0xfff0b0);
  };
  const pts = [[60, 60], [48, 86], [72, 86], [60, 112], [44, 132], [76, 132]];
  const link = ([x0, y0], [x1, y1]) => { for (let s = 0; s <= 20; s++) p.px(x0 + (x1 - x0) * s / 20, y0 + (y1 - y0) * s / 20, 0xd8a840); };
  link(pts[0], pts[1]), link(pts[0], pts[2]), link(pts[1], pts[3]), link(pts[2], pts[3]), link(pts[3], pts[4]), link(pts[3], pts[5]);
  pts.forEach(([x, y], i) => node(x, y, i === 0 ? 7 : 5, 0xffd060));
  p.lights.push([60, 90, 60, 0xffc850]);
  return p;
}

function lamp() {
  const p = painter(22, 84), B = 82, Q = prims(p.px);
  Q.cyl(9, 18, 4, B - 22, 0x3a3a46, { bands: [10, 30] });
  Q.box(5, B - 6, 12, 6, 0x3a3a46);
  Q.box(3, 2, 16, 4, 0x3a3a46);
  // 유리: 안에서 빛나는 등
  for (let j = 0; j < 11; j++) for (let i = 0; i < 12; i++) p.px(5 + i, 6 + j, j < 2 ? 0xfff4c8 : i < 3 ? 0xffe090 : i > 9 ? 0xe09040 : 0xffd070);
  p.r(10, 6, 2, 11, 0x2a2a32);
  Q.box(4, 17, 14, 3, 0x3a3a46);
  p.lights.push([11, 11, 30, 0xffb050]);
  return p;
}
function wall(flip) {
  const p = painter(120, 260), B = 255;
  p.stone(0, 60, 120, B - 60, 0x7a7080, flip ? 91 : 81);
  for (let i = 0; i < 120; i += 12) p.stone(i, 46, 8, 14, 0x7a7080, i);
  const tx = flip ? 10 : 50;
  p.stone(tx, 10, 60, B - 10, 0x8a8090, 99);
  p.r(tx - 4, 6, 68, 6, 0x5a5260);
  p.window(tx + 25, 50, 10, 16, !0, !0, 0x2a2430);
  return p;
}

const FAC = [
  // 알비온식 거점: 창고 · 시장 · 정제소 → 제작 공방들 → 광장 → 운명의 비석 → 출구
  { id: "wardrobe", name: "창고", x: 190, art: wardrobe3d, npc: ["npc_quarter", 50, !0] },
  { id: "forge", name: "대장간 · 무기", x: 470, art: forge, npc: ["npc_smith", 60, !0] },
  { id: "armory", name: "갑옷 공방", x: 760, art: armory, npc: ["npc_armorer", -30, !0] },
  { id: "board", name: "기록 게시판", x: 1040, art: board3d, npc: ["npc_scribe", -60, !1] },
  { id: "plaza", x: 1340, art: fountain },
  { id: "lab", name: "마법사 탑", x: 1520, art: tower, npc: ["npc_mage", 46, !0] },
  { id: "dojo", name: "무술 도장", x: 1720, art: dojo3d, npc: ["npc_trainer", 50, !0], dummy: -110 },
  { id: "destiny", name: "운명의 비석", x: 1880, art: destinyStone },
  { id: "exit", name: "탐험 출구", x: 2080, art: gate },
];
export const HUB_W = 2240;

export function buildHub(sc, R, gy) {
  const { ot: W, xt: Hh, zt } = R;
  const ADD = zt.BlendModes.ADD;
  const tex = (key, canvas) => (sc.textures.exists(key) || sc.textures.addCanvas(key, canvas), key);
  // 하늘과 원경 (시차)
  sc.add.image(W / 2, Hh / 2, tex("h2_sky", skyCanvas(W, Hh))).setScrollFactor(0).setDepth(-100);
  const layers = [];
  const lay = (key, cv, f, y, d) => {
    const t = sc.add.tileSprite(W / 2, y, W, cv.height, tex(key, cv)).setScrollFactor(0).setDepth(d);
    t.setData("f", f);
    layers.push(t);
  };
  lay("h2_mtn1", mountainsCanvas(640, 200, 3, 0x6a4a7a, 0xf0d8e8, 0xc0607a, 110, 150), 0.05, Hh - 170, -98);
  const castle = sc.add.image(520, gy - 150, tex("h2_castle", castleCanvas())).setScrollFactor(0.15, 1).setDepth(-97).setTint(0xd0a0c0);
  lay("h2_mtn2", mountainsCanvas(640, 160, 9, 0x4a2e4a, 0, 0xa04a5a, 60, 130), 0.18, Hh - 120, -96);
  lay("h2_roofs", roofsCanvas(800, 130), 0.4, gy - 70, -95);
  sc.add.rectangle(0, gy - 10, R.HUBW, 30, 0x2a1a24).setOrigin(0).setScrollFactor(0.4, 1).setDepth(-94);
  // 노을빛 안개
  const fog = sc.add.graphics().setScrollFactor(0).setDepth(-93);
  for (let i = 0; i < 24; i++) fog.fillStyle(0xff9060, 0.012 * i).fillRect(0, gy - 120 + i * 4, W, 4);
  // 새
  for (let i = 0; i < 5; i++) {
    const b = sc.add.text(-20, 40 + i * 14, "ᵛ", { fontSize: "10px", color: "#2a1828" }).setScrollFactor(0.1).setDepth(-96);
    sc.tweens.add({ targets: b, x: W + 200, y: b.y - 20, duration: 26000 + i * 3000, delay: i * 2600, repeat: -1 });
  }
  // 길
  const st = streetCanvas(R.HUBW, Hh - gy + 4);
  const street = sc.add.image(0, gy - 2, tex("h2_street", st)).setOrigin(0, 0).setDepth(2);
  const buildings = [];
  // 건물·장식
  const glow = (x, y, s, col = 0xffb050, a = 0.5) => {
    const g = sc.add.image(x, y, "vx_glow").setBlendMode(ADD).setTint(col).setAlpha(a).setScale(s / 24).setDepth(7);
    sc.tweens.add({ targets: g, alpha: a * 0.6, duration: 900 + Math.random() * 900, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
    return g;
  };
  const place = (key, p, x, depth = 1) => {
    const im = sc.add.image(x, gy + 1, tex(key, p.c)).setOrigin(0.5, 1).setDepth(depth);
    const ox = x - p.w / 2, oy = gy + 1 - p.h;
    for (const [lx, ly, s, col] of p.lights) glow(ox + lx, oy + ly, s * 1.6, col ?? 0xffb050, 0.45);
    return { im, ox, oy };
  };
  place("h2_wallL", wall(!1), 60, 1);
  place("h2_wallR", wall(!0), R.HUBW - 50, 1);
  const out = { facilities: [], layers, castle };
  for (const f of FAC) {
    const p = f.art();
    const { ox, oy } = place("h2_" + f.id, p, f.x, f.id === "training" ? 1 : 1);
    f.id !== "plaza" && buildings.push({ x: f.x, w: p.w });
    f.id === "forge" && (sc.add.particles(ox + 161, oy + 18, "hub_smoke", { speedY: { min: -26, max: -12 }, speedX: { min: 4, max: 12 }, lifespan: 3200, frequency: 260, alpha: { start: 0.55, end: 0 }, scale: { start: 0.6, end: 1.8 } }).setDepth(0),
      sc.add.particles(ox + 76, oy + 190, "vx_px", { speedY: { min: -70, max: -30 }, speedX: { min: -20, max: 20 }, lifespan: 900, frequency: 70, tint: [0xffd060, 0xff7020], blendMode: ADD }).setDepth(8));
    if (f.id === "lab")
      for (let k = 0; k < 4; k++) {
        const r = sc.add.image(f.x, oy + 60, "vx_glow").setBlendMode(ADD).setTint(0xb070ff).setScale(0.3).setDepth(8);
        sc.tweens.addCounter({ from: 0, to: Math.PI * 2, duration: 4200, repeat: -1, onUpdate: (tw) => { const a = tw.getValue() + (k * Math.PI) / 2; r.setPosition(f.x + Math.cos(a) * 46, oy + 70 + Math.sin(a) * 10); r.setDepth(Math.sin(a) > 0 ? 8 : 0.5); } });
      }
    if (f.id === "destiny")
      sc.add.particles(f.x, oy + 120, "vx_px", { x: { min: -22, max: 22 }, y: { min: -60, max: 40 }, speedY: { min: -30, max: -12 }, lifespan: 1800, frequency: 120, tint: [0xffd060, 0xfff0b0], blendMode: ADD }).setDepth(8);
    if (f.id === "exit") {
      sc.add.particles(f.x, gy - 50, "vx_soft", { x: { min: -30, max: 30 }, y: { min: -60, max: 40 }, speedY: { min: -30, max: -10 }, lifespan: 1600, frequency: 90, scale: { start: 0.3, end: 0 }, tint: [0xffe0a0, 0xd090ff], blendMode: ADD }).setDepth(8);
    }
    if (f.id === "plaza") {
      sc.add.particles(f.x + 4, gy - 58, "vx_px", { speedY: { min: -60, max: -40 }, speedX: { min: -24, max: 24 }, gravityY: 160, lifespan: 900, frequency: 30, tint: [0xa8e0ff, 0xffffff] }).setDepth(8);
    }
    if (f.npc) {
      const [k, dx, flip] = f.npc;
      sc.textures.exists(k) && sc.add.sprite(f.x + dx, gy + 1, k, 0).setOrigin(0.5, 1).setDepth(6).setFlipX(flip).play(`${k}_idle`);
    }
    if (f.name) {
      const lb = R.ct(sc, f.x, Math.max(oy - 8, gy - 200), f.name, "small", "#ffe8c0", { stroke: "#2a1408", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(9);
      f.id === "training" && lb.setY(oy - 4);
      out.facilities.push({ id: f.id, name: f.name, x: f.x, labelY: oy, dummyX: f.dummy ? f.x + f.dummy : null });
    }
  }
  // 거리 소품
  const props = [
    ["h2_stall_b", () => stall3d(0x6a3aa8, 0xf0e0c0, "potion"), 1255],
  ];
  for (const [k, f, x] of props) place(k, f(), x, 1.5);
  const lamps = [80, 330, 610, 905, 1170, 1420, 1620, 1800, 1960];
  for (const x of lamps) place("h2_lamp", lamp(), x, 3);
  const misc = painter(60, 30);
  misc.barrel(10, 29), misc.barrel(22, 29), misc.crate(30, 29), misc.crate(44, 29, 12), misc.barrel(16, 17);
  for (const x of [330, 1180]) place("h2_misc", misc, x, 3);
  // 깃발 줄
  const lg = sc.add.graphics().setDepth(1.6);
  for (let a = 0; a < 7; a++) {
    const x0 = 120 + a * 270, x1 = x0 + 250;
    lg.lineStyle(1, 0x2a1a10, 1);
    let prev = null;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const x = x0 + (x1 - x0) * t, y = gy - 120 + Math.sin(t * Math.PI) * 26;
      prev && lg.lineBetween(prev[0], prev[1], x, y);
      prev = [x, y];
      if (Math.round(t * 20) % 2 === 0 && t > 0 && t < 1) {
        // 깃발: 바람에 살짝 꺾인 천 (빛 받는 왼쪽 · 그늘진 오른쪽 · 윗단 접힘)
        const fc = [0xd83a2a, 0xf0c040, 0x2a8ad8, 0x3aa85a][Math.round(t * 20) % 4], tip = x + Math.sin(a * 3 + t * 9) * 1.5;
        lg.fillStyle(sh(fc, 0.18), 1).fillTriangle(x - 4, y, x, y, tip, y + 9);
        lg.fillStyle(sh(fc, -0.28), 1).fillTriangle(x, y, x + 4, y, tip, y + 9);
        lg.fillStyle(sh(fc, -0.5), 1).fillRect(x - 4, y, 8, 1);
        lg.fillStyle(sh(fc, 0.45), 1).fillRect(x - 3, y + 1, 1, 2);
      }
    }
  }
  enhanceHub(sc, R, gy, out, { street, buildings, lamps });
  return out;
}
export function hubParallax(sc, H2) {
  if (!H2) return;
  const sx = sc.cameras.main.scrollX;
  for (const l of H2.layers) l.tilePositionX = sx * l.getData("f");
  H2.fg && (H2.fg.tilePositionX = sx * 1.25);
  hub3dUpdate(sc, H2);
}
