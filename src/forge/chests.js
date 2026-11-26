// 보물 상자 4단계 그림 (나무 · 철 · 황금 · 전설) — 픽셀을 직접 찍는다. 프레임 32×28
//   0 닫힘 · 1 틈 (안에서 빛) · 2 열림 (빛 + 보물) · 3 열린 뒤 (빈 상자) · 4 사슬로 잠김 (지키는 적이 살아 있음)
// 키: fr_chest0 ~ fr_chest3
export const CW = 32, CH = 28, FRAMES = 5;
export const TIER_NAME = ["나무 상자", "철 상자", "황금 상자", "전설 상자"];
export const TIER_COLOR = [0xffd890, 0x9ad8ff, 0xffd040, 0xd890ff];
export const TIER_CSS = ["#ffe0a0", "#a8dcff", "#ffd040", "#e0a0ff"];

// 단계별 색: 몸(어둠·중간·밝음·결) · 쇠(어둠·중간·밝음) · 자물쇠 · 보석 · 안쪽 빛 · 외곽선
const PAL = [
  { b: [0x5a3418, 0x8a5428, 0xb8783c, 0x6e401c], m: [0x3c3a40, 0x6a6870, 0x9a98a2], lock: [0x8a6a1c, 0xd0a840, 0xffe890], gem: null, glow: 0xffe6a0, o: 0x1a0e08 },
  { b: [0x3a4656, 0x5a6a80, 0x8296ae, 0x46566a], m: [0x2a2e36, 0x8c96a4, 0xd6e0ec], lock: [0x46505e, 0xa8b4c4, 0xf0f6ff], gem: [0x2a6aa8, 0x58b0f0], glow: 0xc8ecff, o: 0x0c1018 },
  { b: [0x5a1420, 0x8c2432, 0xb84250, 0x6c1a28], m: [0x8a5a10, 0xe0aa28, 0xfff0a0], lock: [0x8a5a10, 0xf0c040, 0xfff6c0], gem: [0x1a7a4a, 0x48e890], glow: 0xfff0a0, o: 0x1a0608 },
  { b: [0x24163a, 0x3c2860, 0x5c4290, 0x2c1c48], m: [0x8a5a10, 0xe8b830, 0xfff4b0], lock: [0x5a2a8a, 0xb070ff, 0xf0d8ff], gem: [0x6a1aa8, 0xe070ff], glow: 0xf0c8ff, o: 0x0a0614, rune: 0x7af0ff },
];
// 거점 화풍: 원색을 흙빛 쪽으로 누르고(보석·빛·문양은 그대로), 2px 붓 결로 나무·쇠 표면에 질감
const mixc = (a, b, t) => { const g = (k) => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); return (g(16) << 16) | (g(8) << 8) | g(0); };
for (const P of PAL) {
  P.b = P.b.map((c) => mixc(c, 0x5e4a36, 0.28));
  P.m = P.m.map((c) => mixc(c, 0x6e6250, 0.18));
  P.lock = P.lock.map((c) => mixc(c, 0x6e6250, 0.15));
}
const hh = (a, b, c = 0) => { let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

export function chestFrame(t, f) {
  return frame(t, f);
}
function frame(t, f) {
  const P = PAL[t], W = CW, H = CH, px = new Int32Array(W * H).fill(-1);
  const set = (x, y, c) => x >= 0 && y >= 0 && x < W && y < H && c != null && (px[y * W + x] = c);
  const rect = (x, y, w, h, c) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, c);
  };
  const [b0, b1, b2, bg] = P.b, [m0, m1, m2] = P.m;
  const open = f === 2 || f === 3, lift = f === 1 ? 3 : 0;
  const X0 = 3, X1 = 28; // 몸 가로 (포함)
  // ── 열린 뚜껑 (몸 뒤로 젖혀짐: 안쪽 면이 보인다) ──
  if (open) {
    rect(X0 + 2, 1, X1 - X0 - 3, 1, b0);
    rect(X0 + 1, 2, X1 - X0 - 1, 8, b0);
    rect(X0 + 2, 3, X1 - X0 - 3, 6, bg);
    for (const bx of [6, 23]) rect(bx, 2, 3, 8, m0);
    rect(X0, 9, X1 - X0 + 1, 2, m0);
    rect(X0, 9, X1 - X0 + 1, 1, m1);
  }
  // ── 몸 (앞면) ──
  const top = 14;
  rect(X0, top, X1 - X0 + 1, 12, b1);
  // 결: 나무는 판자 줄, 나머지는 판 이음
  for (const y of [top + 4, top + 8]) rect(X0, y, X1 - X0 + 1, 1, t === 0 ? b0 : bg);
  if (t === 0) for (let k = 0; k < 14; k++) set(X0 + 2 + ((k * 7) % 23), top + 1 + ((k * 5) % 10), bg);
  rect(X0, top, 1, 12, b2); // 왼쪽 빛
  rect(X0 + 1, top, X1 - X0 - 1, 1, b2); // 윗 모서리 빛
  rect(X1, top, 1, 12, b0); // 오른쪽 그늘
  rect(X0, top + 10, X1 - X0 + 1, 2, m0); // 아래 쇠테
  rect(X0, top + 10, X1 - X0 + 1, 1, m1);
  // 세로 쇠띠 + 못
  for (const bx of [6, 23]) {
    rect(bx, top, 3, 12, m1);
    rect(bx, top, 1, 12, m2);
    rect(bx + 2, top, 1, 12, m0);
    for (const y of [top + 2, top + 7]) set(bx + 1, y, m2);
  }
  // 전설: 앞면에 빛나는 문양
  if (P.rune) {
    for (const [x, y] of [[11, 17], [12, 18], [11, 19], [20, 17], [19, 18], [20, 19], [12, 22], [19, 22], [13, 23], [18, 23]]) set(x, y, P.rune);
  }
  // 황금 이상: 모서리 장식
  if (t >= 2) for (const [x, y] of [[X0, top], [X1, top], [X0, top + 9], [X1, top + 9]]) (set(x, y, m2), set(x + (x === X0 ? 1 : -1), y, m1));
  // ── 안쪽 (열렸을 때): 어둠 + 빛 + 보물 ──
  if (open) {
    rect(X0 + 1, 11, X1 - X0 - 1, 3, P.o);
    if (f === 2) {
      rect(X0 + 2, 12, X1 - X0 - 3, 2, P.glow);
      const gold = t === 3 ? 0xf0d8ff : 0xffd040;
      for (let k = 0; k < 4 + t * 3; k++) set(X0 + 3 + ((k * 5) % 21), 11 + (k % 2), k % 3 ? gold : 0xffffff);
      P.gem && (set(15, 11, P.gem[1]), set(16, 11, P.gem[1]));
    } else for (let k = 0; k < 3; k++) set(X0 + 6 + k * 7, 13, b0);
  }
  // ── 닫힌 뚜껑 (둥근 지붕) ──
  if (!open) {
    const ly = 4 - lift;
    rect(X0 + 4, ly + 1, X1 - X0 - 7, 1, b1);
    rect(X0 + 2, ly + 2, X1 - X0 - 3, 1, b1);
    rect(X0 + 1, ly + 3, X1 - X0 - 1, 6, b1);
    rect(X0 + 4, ly + 2, X1 - X0 - 9, 1, b2);
    rect(X0 + 2, ly + 3, X1 - X0 - 6, 1, b2);
    rect(X0 + 1, ly + 7, X1 - X0 - 1, 2, b0);
    t === 0 && rect(X0 + 1, ly + 5, X1 - X0 - 1, 1, bg);
    for (const bx of [6, 23]) {
      rect(bx, ly + 1, 3, 8, m1);
      rect(bx, ly + 1, 1, 8, m2);
      rect(bx + 2, ly + 1, 1, 8, m0);
    }
    // 뚜껑 테
    rect(X0, ly + 9, X1 - X0 + 1, 2, m1);
    rect(X0, ly + 9, X1 - X0 + 1, 1, m2);
    rect(X0, ly + 10, X1 - X0 + 1, 1, m0);
    // 틈: 안에서 새는 빛
    lift && rect(X0 + 1, ly + 11, X1 - X0 - 1, lift, P.glow);
    // 전설: 뚜껑 위 왕관 장식
    t === 3 && (rect(14, ly - 1, 4, 2, m1), set(15, ly - 2, P.gem[1]), set(16, ly - 2, P.gem[1]));
    t === 2 && (rect(15, ly, 2, 1, m2));
  }
  // ── 자물쇠 ──
  const [l0, l1, l2] = P.lock, ly0 = open ? 14 : 12 - lift;
  if (!open) {
    rect(13, ly0, 6, 7, l1);
    rect(13, ly0, 6, 1, l2);
    rect(13, ly0, 1, 7, l2);
    rect(18, ly0, 1, 7, l0);
    rect(13, ly0 + 6, 6, 1, l0);
    if (P.gem) (rect(15, ly0 + 2, 2, 2, P.gem[1]), set(15, ly0 + 2, 0xffffff), set(16, ly0 + 3, P.gem[0]));
    else (set(15, ly0 + 3, P.o), set(16, ly0 + 3, P.o), set(15, ly0 + 4, P.o));
  } else rect(14, ly0, 4, 3, l0);
  // ── 사슬 (지키는 적이 살아 있을 때) ──
  if (f === 4) {
    const C0 = 0x5a5a62, C1 = 0xb0b0ba;
    for (let k = 0; k < 26; k++) {
      const x1 = X0 + k, y1 = 6 + Math.round(k * 0.62), x2 = X1 - k;
      const c = k % 2 ? C1 : C0;
      set(x1, y1, c), set(x1, y1 + 1, C0), set(x2, y1, c), set(x2, y1 + 1, C0);
    }
    // 붉은 봉인 자물통
    rect(13, 13, 6, 6, 0x6a1010);
    rect(14, 14, 4, 4, 0xd02828);
    set(15, 15, 0xff9090);
    rect(14, 11, 4, 2, C1);
    set(14, 12, -1), set(17, 12, -1);
    rect(15, 12, 2, 1, -1);
  }
  // ── 그림자 + 외곽선 ──
  const out = new Int32Array(px);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (px[y * W + x] !== -1) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && px[yy * W + xx] !== -1) {
          out[y * W + x] = P.o;
          break;
        }
      }
    }
  return out;
}

export function chestTextures(scene) {
  for (let t = 0; t < 4; t++) {
    const key = `fr_chest${t}`;
    if (scene.textures.exists(key)) continue;
    const cv = document.createElement("canvas");
    cv.width = CW * FRAMES;
    cv.height = CH;
    const cx = cv.getContext("2d"), im = cx.createImageData(cv.width, CH), d = im.data;
    for (let f = 0; f < FRAMES; f++) {
      const px = frame(t, f);
      for (let y = 0; y < CH; y++)
        for (let x = 0; x < CW; x++) {
          const c = px[y * CW + x];
          if (c < 0) continue;
          const k = (y * cv.width + f * CW + x) * 4, kk = 1 + (hh(x >> 1, y >> 1, t) - 0.5) * 0.12 + (hh(x >> 3, y, t + 9) - 0.5) * 0.06, [r, g, b] = rgb(c).map((v) => Math.max(0, Math.min(255, Math.round(v * kk))));
          d[k] = r;
          d[k + 1] = g;
          d[k + 2] = b;
          d[k + 3] = 255;
        }
    }
    cx.putImageData(im, 0, 0);
    const tex = scene.textures.addCanvas(key, cv);
    for (let f = 0; f < FRAMES; f++) tex.add(f, 0, f * CW, 0, CW, CH);
  }
}
