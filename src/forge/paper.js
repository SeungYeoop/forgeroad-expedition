// 크기에 맞춰 그때그때 그리는 종이·나무·코르크 텍스처 (늘려 쓰지 않으므로 뭉개지지 않는다)
const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 부드러운 값 잡음
const vn = (x, y, s, seed) => {
  const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = H(gx, gy, seed), b = H(gx + 1, gy, seed), c = H(gx, gy + 1, seed), d = H(gx + 1, gy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const lerp = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(w, h);
  draw(img.data, w, h, ctx);
  ctx.putImageData(img, 0, 0);
  scene.textures.addCanvas(key, cv);
  return key;
}
const px = (d, w, x, y, c, a = 255) => {
  const i = (y * w + x) * 4;
  if (a >= 255) ((d[i] = c[0]), (d[i + 1] = c[1]), (d[i + 2] = c[2]), (d[i + 3] = 255));
  else {
    const t = a / 255, ba = d[i + 3] / 255, oa = t + ba * (1 - t);
    if (oa <= 0) return;
    for (let k = 0; k < 3; k++) d[i + k] = (c[k] * t + d[i + k] * ba * (1 - t)) / oa;
    d[i + 3] = oa * 255;
  }
};

// 양피지 한 장: 찢긴 가장자리, 그을린 테두리, 얼룩, 섬유, 그림자
function sheet(d, w, h, o) {
  const seed = o.seed ?? 1;
  const base = rgb(o.base ?? 0xf0dfb6), edge = rgb(o.edge ?? 0xb98a52), burn = rgb(0x5a3518);
  const sh = o.shadow ?? 3;
  const W = w - sh, Hh = h - sh;
  const torn = (t, len, s) => Math.floor(vn(t, 0, 5, s) * 2.2 + vn(t, 0, 1.5, s + 9) * 1.2);
  const inside = (x, y) => {
    const l = torn(y, Hh, seed + 1), r = W - 1 - torn(y, Hh, seed + 2), t = torn(x, W, seed + 3), b = Hh - 1 - torn(x, W, seed + 4);
    return x >= l && x <= r && y >= t && y <= b ? Math.min(x - l, r - x, y - t, b - y) : -1;
  };
  // 그림자
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (inside(x - sh, y - sh) >= 0 && inside(x, y) < 0) px(d, w, x, y, [20, 10, 6], 110);
  for (let y = 0; y < Hh; y++)
    for (let x = 0; x < W; x++) {
      const e = inside(x, y);
      if (e < 0) continue;
      const blot = vn(x, y, 22, seed) * 0.6 + vn(x, y, 7, seed + 5) * 0.4;
      const burnT = Math.max(0, 1 - e / (o.burn ?? 12)) ** 1.6;
      let c = mixc(base, edge, Math.min(1, burnT * 0.9 + (blot - 0.5) * 0.35 + 0.08));
      // 섬유 결
      const fib = H(Math.floor(x / 5), y, seed + 7);
      fib > 0.93 && (c = mixc(c, [255, 248, 228], 0.25));
      fib < 0.05 && (c = mixc(c, edge, 0.25));
      H(x, y, seed + 8) > 0.985 && (c = mixc(c, burn, 0.25));
      // 커피 얼룩 고리
      if (o.stain !== !1) {
        const sx = W * (0.2 + H(seed, 1) * 0.6), sy = Hh * (0.25 + H(seed, 2) * 0.5), rr = Math.min(W, Hh) * 0.18;
        const dd = Math.abs(Math.hypot(x - sx, y - sy) - rr);
        dd < 1.6 && (c = mixc(c, edge, 0.18 * (1 - dd / 1.6)));
      }
      if (e === 0) c = mixc(c, burn, 0.75);
      else if (e === 1) c = mixc(c, burn, 0.3);
      px(d, w, x, y, c.map(Math.round));
    }
  // 잉크로 그은 안쪽 테두리
  if (o.rule) {
    const m = o.rule, ink = [122, 82, 48];
    for (let x = m; x < W - m; x++) {
      const wob = H(x, 3, seed) > 0.92 ? 140 : 190;
      px(d, w, x, m, ink, wob), px(d, w, x, Hh - 1 - m, ink, wob);
      px(d, w, x, m + 2, ink, 90), px(d, w, x, Hh - 3 - m, ink, 90);
    }
    for (let y = m; y < Hh - m; y++) {
      const wob = H(3, y, seed) > 0.92 ? 140 : 190;
      px(d, w, m, y, ink, wob), px(d, w, W - 1 - m, y, ink, wob);
      px(d, w, m + 2, y, ink, 90), px(d, w, W - 3 - m, y, ink, 90);
    }
    // 모서리 장식
    for (const [cx, cy] of [[m + 1, m + 1], [W - 2 - m, m + 1], [m + 1, Hh - 2 - m], [W - 2 - m, Hh - 2 - m]])
      for (let k = -2; k <= 2; k++) (px(d, w, cx + k, cy, ink, 230), px(d, w, cx, cy + k, ink, 230));
  }
}
// 종이 위에 눌러 그린 칸
function inset(d, w, h, o) {
  const ink = rgb(o.ink ?? 0x7a5230), fill = rgb(o.fill ?? 0x5a3a1e);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const e = Math.min(x, y, w - 1 - x, h - 1 - y);
      if ((x === 0 || x === w - 1) && (y === 0 || y === h - 1)) continue;
      if (e === 0) px(d, w, x, y, ink, o.sel ? 255 : 210);
      else if (e === 1 && o.sel) px(d, w, x, y, ink, 160);
      else if (e === 1 && (x === 1 || y === 1)) px(d, w, x, y, [60, 36, 16], 50);
      else if (e === 1) px(d, w, x, y, [255, 250, 230], 90);
      else px(d, w, x, y, fill, (o.alpha ?? 0.07) * 255 + (vn(x, y, 9, 3) - 0.5) * 10);
    }
}
// 나무판: 결, 옹이, 판자 이음
export function wood(d, w, h, o = {}) {
  const base = rgb(o.base ?? 0x8a5a32), dark = rgb(o.dark ?? 0x4a2c14), hi = rgb(o.hi ?? 0xc08850);
  const plank = o.plank ?? 18, vert = !!o.vertical;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = vert ? y : x, v = vert ? x : y;
      const pi = Math.floor(v / plank), pv = v % plank;
      const g = vn(u * 0.25 + pi * 50, pv * 2.5, 6, pi + 3) * 0.7 + vn(u, pv, 2, pi) * 0.3;
      let c = mixc(base, g > 0.5 ? hi : dark, Math.abs(g - 0.5) * 0.9);
      const knot = Math.hypot(((u + pi * 37) % 90) - 45, pv - plank / 2);
      knot < 3 && (c = mixc(c, dark, 0.6 - knot * 0.15));
      if (pv === 0) c = mixc(c, dark, 0.8);
      else if (pv === 1) c = mixc(c, hi, 0.35);
      else if (pv === plank - 1) c = mixc(c, dark, 0.35);
      px(d, w, x, y, c.map(Math.round));
    }
}
function cork(d, w, h) {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const n = H(x, y, 11), n2 = vn(x, y, 6, 4);
      let c = mixc([176, 128, 78], [128, 86, 46], n2);
      n > 0.9 && (c = mixc(c, [92, 58, 28], 0.6));
      n < 0.08 && (c = mixc(c, [212, 168, 112], 0.6));
      px(d, w, x, y, c.map(Math.round));
    }
}
function stone(d, w, h) {
  const bw = 26, bh = 13;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const row = Math.floor(y / bh), off = row % 2 ? bw / 2 : 0, bx = Math.floor((x + off) / bw);
      const lx = (x + off) % bw, ly = y % bh;
      const t = H(bx, row, 5);
      let c = mixc([112, 104, 112], [84, 76, 86], t * 0.7 + vn(x, y, 5, row) * 0.3);
      if (lx === 0 || ly === 0) c = [46, 40, 50];
      else if (lx === 1 || ly === 1) c = mixc(c, [170, 160, 170], 0.35);
      else if (lx === bw - 1 || ly === bh - 1) c = mixc(c, [40, 34, 44], 0.4);
      H(x, y, 8) > 0.97 && (c = mixc(c, [40, 34, 44], 0.4));
      px(d, w, x, y, c.map(Math.round));
    }
}

const PAPER = {
  ui_panel: (d, w, h) => sheet(d, w, h, { seed: w * 7 + h, rule: 7 }),
  ui_panel_gold: (d, w, h) => sheet(d, w, h, { seed: w * 3 + h, rule: 7 }),
  ui_scroll: (d, w, h) => sheet(d, w, h, { seed: w + h * 5, rule: 6 }),
  ui_tooltip: (d, w, h) => sheet(d, w, h, { seed: 9, burn: 6, shadow: 2, stain: !1 }),
  ui_inner: (d, w, h) => inset(d, w, h, {}),
  ui_parch_inner: (d, w, h) => inset(d, w, h, {}),
  ui_inner_sel: (d, w, h) => inset(d, w, h, { sel: 1, ink: 0xa8581a, fill: 0xf0a030, alpha: 0.22 }),
  ui_parch_dark: (d, w, h) => inset(d, w, h, { alpha: 0.13 }),
};
const CARD = { common: 0x7a6a58, rare: 0x2a62b8, epic: 0x7a34b8, legendary: 0xc08010 };
for (const [k, c] of Object.entries(CARD))
  PAPER[`ui_card_${k}`] = (d, w, h) => {
    sheet(d, w, h, { seed: w + 31, burn: 9, shadow: 3, stain: !1 });
    const col = rgb(c);
    for (let x = 6; x < w - 9; x++) (px(d, w, x, 5, col, 230), px(d, w, x, 6, col, 120), px(d, w, x, h - 9, col, 230), px(d, w, x, h - 10, col, 120));
    for (let y = 6; y < h - 9; y++) (px(d, w, 5, y, col, 230), px(d, w, w - 9, y, col, 230));
  };
export const isPaper = (k) => k in PAPER;
export function paperKey(scene, k, w, h) {
  w = Math.max(8, Math.round(w));
  h = Math.max(8, Math.round(h));
  return canvasTex(scene, `pp_${k}_${w}x${h}`, w, h, (d) => PAPER[k](d, w, h));
}
export function woodKey(scene, w, h, o = {}) {
  w = Math.round(w);
  h = Math.round(h);
  return canvasTex(scene, `pw_${w}x${h}_${o.base ?? 0}_${o.vertical ? 1 : 0}_${o.plank ?? 18}`, w, h, (d) => wood(d, w, h, o));
}
export const corkKey = (scene, w, h) => canvasTex(scene, `pc_${Math.round(w)}x${Math.round(h)}`, Math.round(w), Math.round(h), (d) => cork(d, Math.round(w), Math.round(h)));
export const stoneKey = (scene, w, h) => canvasTex(scene, `ps_${Math.round(w)}x${Math.round(h)}`, Math.round(w), Math.round(h), (d) => stone(d, Math.round(w), Math.round(h)));
export const noteKey = (scene, w, h, seed = 1) => canvasTex(scene, `pn_${Math.round(w)}x${Math.round(h)}_${seed}`, Math.round(w), Math.round(h), (d) => sheet(d, Math.round(w), Math.round(h), { seed, burn: 5, shadow: 2, stain: seed % 3 === 0 }));

// 모든 add.nineslice(종이 키) 호출을 정확한 크기의 그림으로 바꾼다
export function installPaper(Phaser) {
  const F = Phaser.GameObjects.GameObjectFactory.prototype;
  if (F.__paper) return;
  F.__paper = 1;
  const orig = F.nineslice;
  F.nineslice = function (x, y, key, frame, w, h, ...rest) {
    if (!isPaper(key) || !w || !h) return orig.call(this, x, y, key, frame, w, h, ...rest);
    const sc = this.scene;
    const im = this.image(x, y, paperKey(sc, key, w, h));
    const st = im.setTexture;
    im.setTexture = function (k, f) {
      return isPaper(k) ? st.call(this, paperKey(sc, k, w, h)) : st.call(this, k, f);
    };
    return im;
  };
}
