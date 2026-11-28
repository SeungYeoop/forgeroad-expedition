// 공통 UI 틀 (2026-11-28 다듬기 4-1): 거점(이엉지붕 마을 · 대장간) 분위기에 맞춘 어두운 나무 + 단조 철 테두리 + 리벳 + 양피지
//   frame(sc, x, y, w, h, o)   철 테두리 패널 (o.fill: 안쪽 어두운 나무 · o.paper: 양피지 안판)
//   plate(sc, x, y, w, h, label, fn, o)  철판 단추 (보통·올림·누름 · 금 테 강조) → { set(label), select(on), destroy() }
//   ribbon(sc, cx, y, w, text, o)   제비꼬리 리본 제목
//   vignette(sc, a)   화면 가장자리 어둡게
let R = null;
export const bindUikit = (r) => (R = r);

const cvTex = (sc, key, w, h, draw) => {
  if (sc.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d");
  g.imageSmoothingEnabled = !1;
  draw(g, w, h);
  sc.textures.addCanvas(key, cv);
  return key;
};
const hx = (c) => "#" + (c >>> 0).toString(16).padStart(6, "0");
const H = (x, y, s = 1) => {
  let n = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
// 어두운 나무판 (세로 널, 결, 못)
function wood(g, x0, y0, w, h, base = [58, 36, 20]) {
  const plank = 22;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++) {
      const p = Math.floor(x / plank), px = x % plank;
      let v = 0.82 + H(p, 7) * 0.22 + Math.sin(y * 0.09 + p * 2.3 + Math.sin(y * 0.021 + p) * 2) * 0.05 + (H(x >> 1, y >> 2, p) - 0.5) * 0.08;
      px === 0 && (v *= 0.45);
      px === 1 && (v *= 0.8);
      px === plank - 1 && (v *= 1.12);
      g.fillStyle(`rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`);
      g.fillRect(x0 + x, y0 + y, 1, 1);
    }
}
// 양피지 (얼룩 + 가장자리 그을림)
function paper(g, x0, y0, w, h) {
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++) {
      const e = Math.min(x, y, w - 1 - x, h - 1 - y);
      let v = 0.93 + (H(x >> 2, y >> 2, 3) - 0.5) * 0.07 + (H(x, y, 4) - 0.5) * 0.04;
      e < 6 && (v *= 0.78 + e * 0.035);
      g.fillStyle(`rgb(${Math.round(232 * v)},${Math.round(212 * v)},${Math.round(170 * v)})`);
      g.fillRect(x0 + x, y0 + y, 1, 1);
    }
}
// 단조 철 테두리 (두께 t): 바깥 어두운 선 → 밝은 윗날 → 몸 → 아랫그늘, 모서리 꺾쇠 + 리벳
function iron(g, w, h, t = 5) {
  const C = { out: 0x0c0a0a, hi: 0x9a948c, body: 0x4a4640, mid: 0x5e5850, lo: 0x2a2624, rust: 0x6a4028 };
  const px = (x, y, c, ww = 1, hh = 1) => ((g.fillStyle = hx(c)), g.fillRect(x, y, ww, hh));
  for (let i = 0; i < t; i++) {
    const c = i === 0 ? C.out : i === 1 ? C.hi : i === t - 1 ? C.lo : (i & 1 ? C.body : C.mid);
    px(i, i, c, w - i * 2, 1), px(i, h - 1 - i, i === 1 ? C.lo : c, w - i * 2, 1), px(i, i, c, 1, h - i * 2), px(w - 1 - i, i, i === 1 ? C.lo : c, 1, h - i * 2);
  }
  // 망치 자국 · 녹
  for (let k = 0; k < (w + h) / 6; k++) {
    const side = k % 4, r = H(k, 9);
    const x = side < 2 ? Math.floor(r * w) : side === 2 ? 2 : w - 3, y = side >= 2 ? Math.floor(r * h) : side === 0 ? 2 : h - 3;
    px(x, y, H(k, 11) > 0.7 ? C.rust : C.lo);
  }
  // 모서리 꺾쇠 판
  const L = 14;
  for (const [cx, cy, dx, dy] of [[0, 0, 1, 1], [w - 1, 0, -1, 1], [0, h - 1, 1, -1], [w - 1, h - 1, -1, -1]]) {
    for (let i = 0; i < L; i++)
      for (let j = 0; j < t + 3; j++) {
        const a = j === 0 ? C.out : j === 1 ? C.hi : j >= t + 1 ? C.lo : C.mid;
        px(cx + dx * i, cy + dy * j, a), px(cx + dx * j, cy + dy * i, a);
      }
    // 리벳
    const rx = cx + dx * (t + 1), ry = cy + dy * (t + 1);
    px(rx - 1, ry - 1, C.out, 3, 3), px(rx - 1, ry - 1, 0xc8c0b0), px(rx, ry, 0x8a8278), px(rx + 1, ry + 1, C.lo);
  }
  // 변을 따라 리벳 (48px마다)
  for (let x = 40; x < w - 40; x += 48) for (const y of [Math.floor(t / 2), h - 1 - Math.floor(t / 2)]) (px(x - 1, y - 1, C.out, 3, 3), px(x - 1, y - 1, 0xb0a898), px(x, y, 0x6a6258));
  for (let y = 40; y < h - 40; y += 48) for (const x of [Math.floor(t / 2), w - 1 - Math.floor(t / 2)]) (px(x - 1, y - 1, C.out, 3, 3), px(x - 1, y - 1, 0xb0a898), px(x, y, 0x6a6258));
}
export function frameKey(sc, w, h, o = {}) {
  w = Math.round(w), h = Math.round(h);
  const key = `uk_fr_${w}_${h}_${o.paper ? "p" : o.fill === !1 ? "n" : "w"}`;
  return cvTex(sc, key, w, h, (g) => {
    o.fill !== !1 && (o.paper ? (wood(g, 0, 0, w, h), paper(g, 9, 9, w - 18, h - 18)) : wood(g, 0, 0, w, h));
    // 안쪽 그늘
    if (o.fill !== !1) for (let i = 0; i < 6; i++) ((g.fillStyle = `rgba(0,0,0,${0.22 - i * 0.035})`), g.fillRect(5 + i, 5 + i, w - 10 - i * 2, 1), g.fillRect(5 + i, 5 + i, 1, h - 10 - i * 2));
    iron(g, w, h);
  });
}
export function frame(sc, x, y, w, h, o = {}) {
  return sc.add.image(x, y, frameKey(sc, w, h, o)).setOrigin(0).setDepth(o.depth ?? 0).setScrollFactor(0);
}
// 철판 단추 그림 (st: 0 보통 · 1 올림 · 2 누름 · 3 주 단추(금))
function plateKey(sc, w, h, st) {
  const key = `uk_pl_${w}_${h}_${st}`;
  return cvTex(sc, key, w, h, (g) => {
    const gold = st === 3 || st === 1;
    const top = st === 2 ? 0x3a3632 : gold ? 0x8a6a3a : 0x5a5450, bot = st === 2 ? 0x2a2624 : gold ? 0x4a361c : 0x34302c;
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1), c = [0, 8, 16].map((s) => Math.round(((top >> s) & 255) * (1 - t) + ((bot >> s) & 255) * t));
      for (let x = 0; x < w; x++) {
        const v = 1 + (H(x >> 1, y, 5) - 0.5) * 0.08;
        g.fillStyle = `rgb(${Math.min(255, Math.round(c[2] * v))},${Math.min(255, Math.round(c[1] * v))},${Math.min(255, Math.round(c[0] * v))})`;
        g.fillRect(x, y, 1, 1);
      }
    }
    const px = (x, y, c, ww = 1, hh = 1) => ((g.fillStyle = hx(c)), g.fillRect(x, y, ww, hh));
    px(0, 0, 0x0c0a0a, w, 1), px(0, h - 1, 0x0c0a0a, w, 1), px(0, 0, 0x0c0a0a, 1, h), px(w - 1, 0, 0x0c0a0a, 1, h);
    const edge = st === 1 ? 0xffd890 : st === 3 ? 0xe8b860 : 0x9a948c;
    st !== 2 && (px(1, 1, edge, w - 2, 1), px(1, 1, edge, 1, h - 3));
    px(1, h - 2, 0x1a1614, w - 2, 1), px(w - 2, 1, 0x1a1614, 1, h - 2);
    for (const x of [4, w - 5]) (px(x - 1, Math.floor(h / 2) - 1, 0x0c0a0a, 3, 3), px(x - 1, Math.floor(h / 2) - 1, gold ? 0xffe0a0 : 0xc8c0b0), px(x, Math.floor(h / 2), gold ? 0x8a6020 : 0x6a6258));
  });
}
export function plate(sc, x, y, w, h, label, fn, o = {}) {
  w = Math.round(w), h = Math.round(h);
  const d = o.depth ?? 10, base = o.primary ? 3 : 0;
  const bg = sc.add.image(x, y, plateKey(sc, w, h, base)).setOrigin(0).setDepth(d).setScrollFactor(0).setInteractive({ useHandCursor: !0 });
  const tx = R.ct(sc, x + w / 2, y + h / 2 + (o.small ? 0 : 1), label, o.font ?? (o.small ? "small" : "body"), o.primary ? "#fff0c8" : "#f0e4d0", { stroke: "#140c08", strokeThickness: 3 }).setOrigin(0.5).setDepth(d + 0.1).setScrollFactor(0);
  let sel = !1, on = o.enabled !== !1;
  const paint = (st) => bg.setTexture(plateKey(sc, w, h, !on ? 2 : st)).setAlpha(on ? 1 : 0.55);
  bg.on("pointerover", () => on && (paint(1), o.onHover?.()));
  bg.on("pointerout", () => paint(sel ? 1 : base));
  bg.on("pointerdown", () => on && (paint(2), R.j.play("click")));
  bg.on("pointerup", () => on && (paint(sel ? 1 : base), fn?.()));
  paint(base);
  return {
    bg,
    tx,
    set: (s) => tx.setText(s),
    select: (v) => ((sel = v), paint(v ? 1 : base), tx.setColor(v ? "#ffe8a8" : o.primary ? "#fff0c8" : "#f0e4d0")),
    enable: (v) => ((on = v), paint(base)),
    destroy: () => (bg.destroy(), tx.destroy()),
    objs: [bg, tx],
  };
}
// 제비꼬리 리본 제목 (붉은 천 + 금 테)
export function ribbon(sc, cx, y, w, text, o = {}) {
  const hh = o.h ?? 26, key = `uk_rb_${Math.round(w)}_${hh}_${o.col ?? 0}`;
  const col = o.col ?? 0x7a1e18;
  cvTex(sc, key, w + 40, hh + 6, (g) => {
    const px = (x, y, c, ww = 1, hh2 = 1) => ((g.fillStyle = hx(c)), g.fillRect(x, y, ww, hh2));
    const shade = (c, k) => [16, 8, 0].reduce((a, s) => a | (Math.max(0, Math.min(255, Math.round(((c >> s) & 255) * k))) << s), 0);
    // 꼬리 (뒤쪽, 어둡게)
    for (const s of [0, 1]) {
      const x0 = s ? w + 20 : 0;
      for (let y = 3; y < hh + 3; y++) {
        const d = Math.abs(y - (hh / 2 + 3)), cut = Math.max(0, 10 - d * 0.8);
        for (let x = 0; x < 20; x++) {
          const inside = s ? x < 20 - cut : x >= cut;
          inside && px(x0 + x, y + 3, shade(col, 0.6 + (H(x, y, 2) - 0.5) * 0.06));
        }
      }
    }
    // 몸
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) px(20 + x, y, shade(col, (y < 2 ? 1.35 : y > hh - 3 ? 0.65 : 1 - y * 0.008) + (H(x >> 1, y, 3) - 0.5) * 0.06));
    // 금 테
    px(20, 2, 0xe0b060, w, 1), px(20, hh - 3, 0xa07030, w, 1);
    for (let x = 24; x < w + 16; x += 6) px(x, 0, 0xf0d090, 2, 1);
  });
  const im = sc.add.image(cx, y, key).setOrigin(0.5, 0).setDepth(o.depth ?? 10).setScrollFactor(0);
  const t = R.ct(sc, cx, y + hh / 2, text, o.font ?? "body", "#fff0d0", { stroke: "#2a0806", strokeThickness: 3 }).setOrigin(0.5).setDepth((o.depth ?? 10) + 0.1).setScrollFactor(0);
  return { im, t, objs: [im, t] };
}
export function vignette(sc, a = 0.6, depth = 0) {
  const g = sc.add.graphics().setDepth(depth).setScrollFactor(0), W = R.ot, Hh = R.xt;
  for (let i = 0; i < 20; i++) {
    const t = a * Math.pow(1 - i / 20, 2);
    g.fillStyle(0x050304, t).fillRect(0, i * 4, W, 4).fillRect(0, Hh - (i + 1) * 4, W, 4).fillRect(i * 5, 0, 5, Hh).fillRect(W - (i + 1) * 5, 0, 5, Hh);
  }
  return g;
}
