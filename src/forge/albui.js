// 알비온식 UI 툴킷 (2026-11-28 · UI 전면 교체)
//   알비온 온라인 UI 분석 → 규칙:
//   · 창: 밝은 크림 양피지(위가 살짝 밝은 세로 그라데이션 + 아주 옅은 섬유 결), 1px 짙은 갈색 외곽 + 1px 청동 선 + 안쪽 흰 빛, 모서리 1px 둥글림
//   · 머리띠: 창 위 14~16px 진한 황갈색 띠, 아래 1px 갈색 선 + 1px 밝은 선. 제목은 작고 짙은 갈색 글자. 오른쪽 끝에 둥근 닫기(X)
//   · 칸: 짙은 회갈색 정사각형(24~28px), 1px 검은 테 + 크림 위에 눌린 그늘(위·왼 어둡고 아래·오른 밝음). 단계 숫자는 왼쪽 위 작게, 개수는 오른쪽 아래
//   · 단추: 황갈색 가죽 그라데이션 + 1px 짙은 테 + 위 흰 빛. 주 단추는 금빛. 글자는 짙은 갈색
//   · 탭: 고른 탭은 창과 같은 크림으로 이어지고, 나머지는 한 톤 어두운 황갈색
//   · 막대: 얇다(체력 6px · 기력 4px), 짙은 홈 + 밝은 위 빛
//   · 전체적으로 작고 촘촘하다: 글자 8~10px, 여백 4~6px
let R = null;
export const bindAlbui = (r) => (R = r);

// ── 색 ──
export const C = {
  body0: 0xeee2c6, body1: 0xdccaa4, // 창 바탕 (위 → 아래)
  hdr0: 0xcdb78c, hdr1: 0xb59c6e, // 머리띠
  edge: 0x2a1d10, bronze: 0x8c6c40, glint: 0xfbf4e2, // 외곽 · 청동 선 · 안쪽 빛
  rule: 0x9c8460, ruleHi: 0xf6eedb, // 나눔선
  well0: 0x2e2822, well1: 0x231e19, wellEdge: 0x120e0a, // 칸
  gold: 0xe0b45c, goldHi: 0xffe7a8,
  sunk: 0xcdbb94, // 크림 위 움푹 판
};
export const INK = "#2a1c0e", INK2 = "#6a5134", INK3 = "#8c7454", INK_HDR = "#33230f", INK_RED = "#9a2414", INK_GOLD = "#8a5a00", INK_GREEN = "#2e6a1c", INK_BLUE = "#1e4a8a";
export const LIGHT = "#f3e8cf", LIGHT2 = "#bfae8c";

const H = (x, y, s = 1) => {
  let n = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const vn = (x, y, s, seed) => {
  const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = H(gx, gy, seed), b = H(gx + 1, gy, seed), c = H(gx, gy + 1, seed), d = H(gx + 1, gy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const mix = (a, b, t) => {
  const A = rgb(a), B = rgb(b);
  return (Math.round(A[0] + (B[0] - A[0]) * t) << 16) | (Math.round(A[1] + (B[1] - A[1]) * t) << 8) | Math.round(A[2] + (B[2] - A[2]) * t);
};
export const shade = (c, f) => {
  const [r, g, b] = rgb(c), k = (v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return (k(r) << 16) | (k(g) << 8) | k(b);
};
export const css = (c) => "#" + (c >>> 0).toString(16).padStart(6, "0");

// 픽셀 버퍼 (ImageData 위에 그리고 한 번에 올린다)
function buf(w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  const set = (x, y, c, a = 1) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4, [r, g, b] = rgb(c);
    if (a >= 1) return void ((d[i] = r), (d[i + 1] = g), (d[i + 2] = b), (d[i + 3] = 255));
    const ba = d[i + 3] / 255, oa = a + ba * (1 - a);
    if (oa <= 0) return;
    d[i] = (r * a + d[i] * ba * (1 - a)) / oa;
    d[i + 1] = (g * a + d[i + 1] * ba * (1 - a)) / oa;
    d[i + 2] = (b * a + d[i + 2] * ba * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  };
  return { d, w, h, set, rect: (x, y, ww, hh, c, a = 1) => { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) set(x + i, y + j, c, a); } };
}
// 이미 있으면 그대로, 없으면 그려서 등록. replace: 같은 키의 옛 그림을 지우고 새로 (전역 ui_* 교체용)
export function tex(sc, key, w, h, paint, replace = !1) {
  const T = sc.textures;
  if (T.exists(key)) {
    if (!replace) return key;
    T.remove(key);
  }
  w = Math.max(1, Math.round(w)), h = Math.max(1, Math.round(h));
  const b = buf(w, h);
  paint(b, w, h);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  ctx.putImageData(new ImageData(b.d, w, h), 0, 0);
  T.addCanvas(key, cv);
  return key;
}

// ── 그리기: 창 ──
// o: { hdr: 머리띠 높이, tint: 머리띠 색 바꾸기, flat: 청동 선 없이(안쪽 판), seed }
export function paintPanel(b, w, h, o = {}) {
  const hdr = o.hdr ?? 0, seed = o.seed ?? 3;
  const b0 = o.body0 ?? C.body0, b1 = o.body1 ?? C.body1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let c = mix(b0, b1, y / h);
      const n = (vn(x, y, 14, seed) - 0.5) * 0.05 + (H(x >> 1, y, seed) - 0.5) * 0.025 + (H(x, y >> 2, seed + 4) > 0.97 ? -0.03 : 0);
      c = shade(c, n);
      b.set(x, y, c);
    }
  if (hdr) {
    const h0 = o.tint ? shade(o.tint, 0.18) : C.hdr0, h1 = o.tint ?? C.hdr1;
    for (let y = 0; y < hdr; y++) for (let x = 0; x < w; x++) b.set(x, y, shade(mix(h0, h1, y / hdr), (H(x >> 1, y, seed + 2) - 0.5) * 0.03));
    b.rect(0, hdr, w, 1, shade(h1, -0.45));
    b.rect(0, hdr + 1, w, 1, C.glint, 0.55);
  }
  // 테두리: 외곽 짙은 선(모서리 둥글림) → 청동 → 안쪽 빛
  const flat = !!o.flat;
  for (let x = 1; x < w - 1; x++) (b.set(x, 0, C.edge), b.set(x, h - 1, C.edge));
  for (let y = 1; y < h - 1; y++) (b.set(0, y, C.edge), b.set(w - 1, y, C.edge));
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) b.set(x, y, 0, 0);
  for (const [x, y] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) b.set(x, y, C.edge);
  if (!flat) {
    const br = o.rim ?? C.bronze;
    for (let x = 2; x < w - 2; x++) (b.set(x, 1, shade(br, 0.25)), b.set(x, h - 2, shade(br, -0.25)));
    for (let y = 2; y < h - 2; y++) (b.set(1, y, br), b.set(w - 2, y, shade(br, -0.15)));
    for (let x = 2; x < w - 2; x++) (b.set(x, 2, C.glint, hdr ? 0.35 : 0.8), b.set(x, h - 3, 0x7a6244, 0.35));
    for (let y = 2; y < h - 2; y++) (b.set(2, y, C.glint, 0.5), b.set(w - 3, y, 0x7a6244, 0.3));
    // 모서리 작은 청동 쇠붙이
    if (w >= 40 && h >= 40)
      for (const [x, y] of [[2, 2], [w - 5, 2], [2, h - 5], [w - 5, h - 5]]) (b.rect(x, y, 3, 3, shade(br, -0.35)), b.set(x + 1, y + 1, C.goldHi));
  } else {
    for (let x = 1; x < w - 1; x++) b.set(x, 1, C.glint, 0.6);
    for (let y = 1; y < h - 1; y++) b.set(1, y, C.glint, 0.4);
  }
}
// 크림 위 움푹 판 (목록·글 상자)
export function paintSunk(b, w, h, o = {}) {
  const c0 = o.sel ? 0xf4e0a8 : o.fill ?? C.sunk;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, shade(c0, (H(x >> 1, y, 9) - 0.5) * 0.03 - (y / h) * 0.03));
  const top = o.sel ? 0x8a5a14 : 0x7a6444, bot = C.glint;
  for (let x = 1; x < w - 1; x++) (b.set(x, 0, top, 0.9), b.set(x, h - 1, bot, 0.9), b.set(x, 1, top, 0.25));
  for (let y = 1; y < h - 1; y++) (b.set(0, y, top, 0.9), b.set(w - 1, y, bot, 0.9), b.set(1, y, top, 0.2));
  if (o.sel) {
    for (let x = 1; x < w - 1; x++) (b.set(x, 0, C.gold), b.set(x, h - 1, C.gold));
    for (let y = 1; y < h - 1; y++) (b.set(0, y, C.gold), b.set(w - 1, y, C.gold));
  }
}
// 칸: st 0 보통 · 1 마우스 · 2 고름/놓을 곳 · 3 잠김
export function paintSlot(b, s, st = 0, o = {}) {
  const w0 = o.well0 ?? C.well0, w1 = o.well1 ?? C.well1;
  // 크림 위 눌린 그늘
  b.rect(0, 0, s, 1, 0x5a4630, 0.7), b.rect(0, 0, 1, s, 0x5a4630, 0.7);
  b.rect(1, s - 1, s - 1, 1, C.glint, 0.9), b.rect(s - 1, 1, 1, s - 1, C.glint, 0.9);
  const edge = st === 1 ? 0xb89050 : st === 2 ? C.gold : C.wellEdge;
  for (let y = 1; y < s - 1; y++)
    for (let x = 1; x < s - 1; x++) {
      const e = x === 1 || y === 1 || x === s - 2 || y === s - 2;
      if (e) b.set(x, y, edge);
      else {
        const r = Math.hypot(x - s / 2, y - s / 2) / (s * 0.7);
        let c = mix(w0, w1, y / s);
        c = shade(c, 0.06 * (1 - r) + (H(x, y, 21) - 0.5) * 0.04);
        st === 3 && (c = shade(c, -0.3));
        b.set(x, y, c);
      }
    }
  // 안쪽 위 그늘 1px + 아래 빛
  b.rect(2, 2, s - 4, 1, 0x000000, 0.45), b.rect(2, 2, 1, s - 4, 0x000000, 0.3);
  b.rect(2, s - 3, s - 4, 1, 0x6a5a48, 0.35);
  if (st === 2) (b.rect(2, 2, s - 4, 1, C.goldHi, 0.5), b.rect(2, 2, 1, s - 4, C.goldHi, 0.3));
  if (st === 1) b.rect(2, 2, s - 4, 1, 0xd8b878, 0.35);
}
// 단추: kind normal · primary(금) · dark(어두운 바탕용) · danger / st 0 보통 · 1 마우스 · 2 누름 · 3 꺼짐 · 4 고름
const BTN = {
  normal: [[0xf2e0b4, 0xc9a96e], [0xfbecc8, 0xd8b97e], [0xc4a46c, 0xdcc290], [0xcfc3a8, 0xb5a88c], [0xffe4a4, 0xe0b25c]],
  primary: [[0xf8d27c, 0xcf8c2a], [0xffe098, 0xe09c38], [0xc8842a, 0xe8aa4c], [0xcfc3a8, 0xb5a88c], [0xffe4a4, 0xe0b25c]],
  danger: [[0xe89a7c, 0xb0442a], [0xf4ae90, 0xc4553a], [0xa83e26, 0xc85a40], [0xcfc3a8, 0xb5a88c], [0xf4ae90, 0xc4553a]],
  dark: [[0x4a3e30, 0x2e261e], [0x5e4e3a, 0x3a3024], [0x2a221a, 0x3a3024], [0x34302a, 0x2a2622], [0x6a5434, 0x46381e]],
};
export function paintBtn(b, w, h, kind = "normal", st = 0) {
  const [t, bo] = (BTN[kind] ?? BTN.normal)[st] ?? BTN.normal[0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, shade(mix(t, bo, y / (h - 1)), (H(x >> 1, y, 5) - 0.5) * 0.03));
  const ed = st === 4 ? 0x6a3c08 : kind === "dark" ? 0x0e0a06 : 0x3a2812;
  for (let x = 1; x < w - 1; x++) (b.set(x, 0, ed), b.set(x, h - 1, ed));
  for (let y = 1; y < h - 1; y++) (b.set(0, y, ed), b.set(w - 1, y, ed));
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) b.set(x, y, 0, 0);
  if (st !== 2) (b.rect(1, 1, w - 2, 1, 0xffffff, kind === "dark" ? 0.15 : 0.5), b.rect(1, 2, 1, h - 4, 0xffffff, kind === "dark" ? 0.08 : 0.25));
  b.rect(1, h - 2, w - 2, 1, 0x000000, 0.2);
  if (st === 4) (b.rect(1, 1, w - 2, 1, C.goldHi), b.rect(1, h - 2, w - 2, 1, 0x8a5410, 0.6));
}
export const btnInk = (kind, st) => (st === 3 ? "#7a6c58" : kind === "dark" ? "#efe2c4" : kind === "danger" ? "#2a0c04" : INK);
// 탭 (sel: 창과 이어진다)
export function paintTab(b, w, h, sel) {
  const t = sel ? C.hdr0 : 0xb8a27a, bo = sel ? C.body0 : 0xa48c62;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, mix(t, bo, y / h));
  for (let x = 2; x < w - 2; x++) b.set(x, 0, C.edge);
  b.set(1, 1, C.edge), b.set(w - 2, 1, C.edge);
  for (let y = 2; y < h; y++) (b.set(0, y, C.edge), b.set(w - 1, y, C.edge));
  b.rect(2, 1, w - 4, 1, C.glint, sel ? 0.8 : 0.35);
  sel || b.rect(0, h - 1, w, 1, C.edge);
}
// 둥근 닫기 단추 (13px)
export function paintClose(b, s, st = 0) {
  const c = (s - 1) / 2;
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > c + 0.5) continue;
      b.set(x, y, d > c - 0.5 ? C.edge : d > c - 1.5 ? (y < c ? 0xe0c48a : 0x9a7a48) : mix(st ? 0x8a3020 : 0x4a3626, st ? 0x5a1a10 : 0x2a1e14, y / s));
    }
  for (let i = -2; i <= 2; i++) (b.set(Math.round(c + i), Math.round(c + i), 0xf4e8cc), b.set(Math.round(c + i), Math.round(c - i), 0xf4e8cc));
}
// 금속 고리 메달 (초상화 · 능력 단추 둘레)
export function paintRing(b, s, o = {}) {
  const c = (s - 1) / 2, th = o.th ?? 3, inner = o.inner ?? 0x1e1812;
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > c + 0.5) continue;
      if (d > c - 0.5) b.set(x, y, C.edge);
      else if (d > c - th - 0.5) {
        const a = Math.atan2(y - c, x - c), lit = 0.5 - 0.5 * Math.sin(a + 0.8);
        b.set(x, y, mix(o.dark ?? 0x6a4e24, o.lite ?? 0xf0d290, lit));
      } else if (d > c - th - 1.5) b.set(x, y, C.edge);
      else b.set(x, y, mix(shade(inner, 0.12), inner, y / s));
    }
}

// ── 키 만들기 ──
export const panelKey = (sc, w, h, o = {}) => tex(sc, `al_pn_${Math.round(w)}_${Math.round(h)}_${o.hdr ?? 0}_${o.flat ? 1 : 0}_${o.tint ?? 0}_${o.seed ?? 3}_${o.body0 ?? 0}`, w, h, (b, W, Hh) => paintPanel(b, W, Hh, o));
export const sunkKey = (sc, w, h, o = {}) => tex(sc, `al_sk_${Math.round(w)}_${Math.round(h)}_${o.sel ? 1 : 0}_${o.fill ?? 0}`, w, h, (b, W, Hh) => paintSunk(b, W, Hh, o));
export const slotKey = (sc, s, st = 0) => tex(sc, `al_sl_${s}_${st}`, s, s, (b) => paintSlot(b, s, st));
export const btnKey = (sc, w, h, kind = "normal", st = 0) => tex(sc, `al_bt_${Math.round(w)}_${Math.round(h)}_${kind}_${st}`, w, h, (b, W, Hh) => paintBtn(b, W, Hh, kind, st));
export const tabKey = (sc, w, h, sel) => tex(sc, `al_tb_${Math.round(w)}_${Math.round(h)}_${sel ? 1 : 0}`, w, h, (b, W, Hh) => paintTab(b, W, Hh, sel));
export const closeKey = (sc, st = 0) => tex(sc, `al_cl_${st}`, 13, 13, (b) => paintClose(b, 13, st));
export const ringKey = (sc, s, o = {}) => tex(sc, `al_rg_${s}_${o.th ?? 3}_${o.inner ?? 0}_${o.lite ?? 0}`, s, s, (b) => paintRing(b, s, o));

// ── 조립 도우미 ──
const T = (sc, x, y, s, st, col, o) => R.ct(sc, x, y, s, st, col, o);
// 창: { objs, x, y, w, h, top(본문 시작 y), close } — o: { title, onClose, depth, hdr, sub, scroll(화면 고정, 기본 true), shadow }
export function panel(sc, x, y, w, h, o = {}) {
  const d = o.depth ?? 10, hdr = o.title !== void 0 ? o.hdr ?? 15 : 0, objs = [];
  const fix = (g) => (o.scroll === !1 ? g : g.setScrollFactor(0));
  o.shadow !== !1 && objs.push(fix(sc.add.rectangle(x + 2, y + 3, w, h, 0x000000, 0.35).setOrigin(0).setDepth(d - 0.02)));
  objs.push(fix(sc.add.image(x, y, panelKey(sc, w, h, { hdr, tint: o.tint, seed: o.seed })).setOrigin(0).setDepth(d)));
  if (hdr) {
    objs.push(fix(T(sc, x + 7, y + Math.round((hdr - 10) / 2) + 1, o.title, "small", INK_HDR).setDepth(d + 0.1)));
    o.sub && objs.push(fix(T(sc, x + w - (o.onClose ? 22 : 7), y + Math.round((hdr - 8) / 2) + 1, o.sub, "tiny", INK2).setOrigin(1, 0).setDepth(d + 0.1)));
  }
  let close = null;
  if (o.onClose) {
    close = closeBtn(sc, x + w - 10, y + (hdr ? hdr / 2 + 0.5 : 9), o.onClose, d + 0.2, o.scroll);
    objs.push(close);
  }
  return { objs, x, y, w, h, top: y + hdr + 2, close, destroy: () => objs.forEach((g) => g.destroy()) };
}
export function closeBtn(sc, cx, cy, fn, depth = 10, scroll) {
  const im = sc.add.image(Math.round(cx), Math.round(cy), closeKey(sc, 0)).setDepth(depth).setInteractive({ useHandCursor: !0 });
  scroll === !1 || im.setScrollFactor(0);
  im.on("pointerover", () => im.setTexture(closeKey(sc, 1)));
  im.on("pointerout", () => im.setTexture(closeKey(sc, 0)));
  im.on("pointerdown", (p) => p.leftButtonDown?.() !== !1 && (R.j.play("close"), fn()));
  return im;
}
// 단추: Be/UK.plate 와 같은 모양의 핸들 { bg, tx, label, container, objs, set, setLabel, select, enable, setEnabled, setVisible, destroy }
export function btn(sc, x, y, w, h, label, fn, o = {}) {
  w = Math.round(w), h = Math.round(h), x = Math.round(x), y = Math.round(y);
  const kind = o.kind ?? (o.primary ? "primary" : "normal"), d = o.depth ?? 10;
  const bg = sc.add.image(x, y, btnKey(sc, w, h, kind, 0)).setOrigin(0).setDepth(d).setInteractive({ useHandCursor: !0 });
  const font = o.font ?? (h >= 22 ? "body" : h >= 15 ? "small" : "tiny");
  const tx = T(sc, x + w / 2, y + h / 2, label, font, btnInk(kind, 0)).setOrigin(0.5).setDepth(d + 0.1);
  o.scroll === !1 || (bg.setScrollFactor(0), tx.setScrollFactor(0));
  let on = o.enabled !== !1, sel = !!o.selected, hov = !1;
  const paint = (st) => {
    const s = !on ? 3 : st === 2 ? 2 : sel ? 4 : st;
    bg.setTexture(btnKey(sc, w, h, kind, s));
    tx.setColor(btnInk(kind, s)).setY(y + h / 2 + (s === 2 ? 1 : 0));
  };
  bg.on("pointerover", () => ((hov = !0), on && (paint(1), o.onHover?.())));
  bg.on("pointerout", () => ((hov = !1), paint(0)));
  bg.on("pointerdown", (p) => {
    if (p.rightButtonDown?.()) return;
    if (!on) return void R.j.play("error");
    paint(2);
    o.sound !== !1 && R.j.play("click");
    o.onUp || fn?.();
  });
  bg.on("pointerup", () => on && (paint(hov ? 1 : 0), o.onUp && fn?.()));
  paint(0);
  const H2 = {
    bg, tx, label: tx, container: [bg, tx], objs: [bg, tx], enabled: on,
    set: (s) => (tx.setText(s), H2), setLabel: (s) => (tx.setText(s), H2),
    select: (v) => ((sel = !!v), paint(0), H2), setSelected: (v) => ((sel = !!v), paint(0), H2),
    enable: (v) => ((on = H2.enabled = !!v), paint(0), H2), setEnabled: (v) => ((on = H2.enabled = !!v), paint(0), H2),
    setVisible: (v) => (bg.setVisible(v), tx.setVisible(v), v ? bg.setInteractive() : bg.disableInteractive(), H2),
    destroy: () => (bg.destroy(), tx.destroy()),
  };
  return H2;
}
// 탭 줄: items [[key, label]], cur, onPick(key) → objs
export function tabs(sc, x, y, w, h, items, cur, onPick, o = {}) {
  const d = o.depth ?? 10, objs = [], tw = Math.floor((w - (items.length - 1)) / items.length);
  items.forEach(([k, ko], i) => {
    const sel = k === cur, tx0 = x + i * (tw + 1);
    const bg = sc.add.image(tx0, y, tabKey(sc, tw, h, sel)).setOrigin(0).setDepth(d).setScrollFactor(0).setInteractive({ useHandCursor: !0 });
    const t = T(sc, tx0 + tw / 2, y + h / 2 + 1, ko, "tiny", sel ? INK : INK2).setOrigin(0.5).setDepth(d + 0.1).setScrollFactor(0);
    bg.on("pointerdown", () => k !== cur && (R.j.play("click"), onPick(k)));
    bg.on("pointerover", () => sel || t.setColor(INK));
    bg.on("pointerout", () => sel || t.setColor(INK2));
    objs.push(bg, t);
  });
  // 탭 아래 선 (고른 탭 아래만 열림)
  return objs;
}
// 칸 그림 하나 (중심 좌표)
export function slot(sc, cx, cy, s, st = 0, depth = 10) {
  return sc.add.image(Math.round(cx), Math.round(cy), slotKey(sc, s, st)).setDepth(depth).setScrollFactor(0);
}
// 나눔선
export function rule(sc, x, y, w, depth = 10) {
  const g = sc.add.graphics().setDepth(depth).setScrollFactor(0);
  g.fillStyle(C.rule, 1).fillRect(x, y, w, 1).fillStyle(C.ruleHi, 0.8).fillRect(x, y + 1, w, 1);
  return g;
}
// 움푹 판
export function sunk(sc, x, y, w, h, o = {}) {
  return sc.add.image(x, y, sunkKey(sc, w, h, o)).setOrigin(0).setDepth(o.depth ?? 10).setScrollFactor(0);
}
// 세로 스크롤 막대
export function scrollbar(sc, x, y, h, rows, vis, pos, depth = 10) {
  const g = sc.add.graphics().setDepth(depth).setScrollFactor(0);
  g.fillStyle(0x7a6444, 0.6).fillRect(x, y, 4, h).fillStyle(0xb8a27a, 1).fillRect(x + 1, y + 1, 2, h - 2);
  const th = Math.max(10, (h * vis) / rows), ty = y + ((h - th) * pos) / Math.max(1, rows - vis);
  g.fillStyle(C.edge, 1).fillRect(x, ty, 4, th).fillStyle(0x7a5a34, 1).fillRect(x + 1, ty + 1, 2, th - 2).fillStyle(0xc8a06a, 1).fillRect(x + 1, ty + 1, 2, 1);
  return g;
}
// 얇은 막대 (체력 · 기력): { bg, fill, set(v) }
export function bar(sc, x, y, w, h, col, depth = 10) {
  const g = sc.add.graphics().setDepth(depth).setScrollFactor(0);
  g.fillStyle(C.edge, 1).fillRect(x - 1, y - 1, w + 2, h + 2).fillStyle(0x1a140e, 1).fillRect(x, y, w, h);
  const fill = sc.add.rectangle(x, y, w, h, col).setOrigin(0).setDepth(depth + 0.1).setScrollFactor(0);
  const shine = sc.add.rectangle(x, y, w, 1, 0xffffff, 0.35).setOrigin(0).setDepth(depth + 0.2).setScrollFactor(0);
  return { bg: g, fill, shine, objs: [g, fill, shine], set: (v) => ((fill.width = Math.max(0, w * v)), (shine.width = fill.width)) };
}
// 작은 글자 도우미 (짙은 잉크 · 화면 고정)
export const ink = (sc, x, y, s, st = "tiny", col = INK, o = {}) => T(sc, x, y, s, st, col, o).setScrollFactor(0);
// 어두운 게임 화면 위 글자 (밝은 글자 + 얇은 외곽)
export const lit = (sc, x, y, s, st = "tiny", col = LIGHT, o = {}) => T(sc, x, y, s, st, col, { stroke: "#120c06", strokeThickness: 2, ...o }).setScrollFactor(0);
// 희귀도 글자색 (크림 바탕용)
export const RAR_INK = { common: "#3a2a1a", uncommon: "#2e6a1c", rare: "#1e4a8a", epic: "#62208e", legendary: "#9a5200" };
export const RAR_HDR = { common: 0xb59c6e, uncommon: 0x7a9a58, rare: 0x6a8ab8, epic: 0x9a78b8, legendary: 0xd09a48 };

// ── 전역 교체: 옛 ui_* 이름표를 알비온 그림으로 ──
//   nineslice(ui_panel 등) 은 paper.js 가 정확한 크기로 다시 그리게 넘긴다 (exactPainter)
//   image(ui_slot 등) 은 같은 크기로 바꿔 끼운다
export const EXACT = {
  ui_panel: (b, w, h) => paintPanel(b, w, h, { seed: w + h }),
  ui_panel_gold: (b, w, h) => paintPanel(b, w, h, { seed: w * 3 + h, rim: 0xb08440 }),
  ui_scroll: (b, w, h) => paintPanel(b, w, h, { seed: w + h * 5 }),
  ui_tooltip: (b, w, h) => paintPanel(b, w, h, { seed: 9, flat: !0 }),
  ui_inner: (b, w, h) => paintSunk(b, w, h),
  ui_parch_inner: (b, w, h) => paintSunk(b, w, h),
  ui_inner_sel: (b, w, h) => paintSunk(b, w, h, { sel: 1 }),
  ui_parch_dark: (b, w, h) => paintSunk(b, w, h, { fill: 0xc4b08a }),
  ui_hud_panel: (b, w, h) => paintPanel(b, w, h, { seed: 5, flat: !0, body0: 0x3a3026, body1: 0x241d16 }),
  ui_hud_gold: (b, w, h) => paintPanel(b, w, h, { seed: 6, flat: !0, body0: 0x4a3c2a, body1: 0x2e2418 }),
  ui_btn: (b, w, h) => paintBtn(b, w, h, "normal", 0),
  ui_btn_hi: (b, w, h) => paintBtn(b, w, h, "normal", 1),
  ui_btn_off: (b, w, h) => paintBtn(b, w, h, "normal", 3),
  ui_btn_green: (b, w, h) => paintBtn(b, w, h, "primary", 0),
  ui_btn_green_hi: (b, w, h) => paintBtn(b, w, h, "primary", 1),
  ui_bar: (b, w, h) => (b.rect(0, 0, w, h, C.edge), b.rect(1, 1, w - 2, h - 2, 0x1a140e)),
};
for (const [k, c] of Object.entries({ common: 0x8a7a64, rare: 0x3a6ab0, epic: 0x7a48b0, legendary: 0xc08820 }))
  EXACT[`ui_card_${k}`] = (b, w, h) => paintPanel(b, w, h, { seed: w + 31, rim: c, flat: !1 });
export function installGlobal(sc) {
  const S = (k, w, h, paint) => tex(sc, k, w, h, paint, !0);
  S("ui_slot", 28, 28, (b) => paintSlot(b, 28, 0));
  S("ui_slot_sel", 28, 28, (b) => paintSlot(b, 28, 2));
  S("ui_slot_big", 32, 32, (b) => paintSlot(b, 32, 0));
  S("ui_medal", 48, 48, (b) => paintRing(b, 48, { th: 3 }));
  S("ui_medal_big", 64, 64, (b) => paintRing(b, 64, { th: 4 }));
  S("ui_keybadge", 11, 11, (b) => paintRing(b, 11, { th: 1, inner: 0x2a2016 }));
  // 작은 나인슬라이스 원본도 바꿔 둔다 (정확한 크기 그림이 없는 쓰임새 대비)
  for (const [k, f] of Object.entries(EXACT)) {
    const [w, h] = k.startsWith("ui_btn") ? [16, 14] : k === "ui_bar" ? [16, 10] : k === "ui_tooltip" ? [12, 12] : k.startsWith("ui_inner") ? [16, 16] : [24, 24];
    S(k, w, h, (b) => f(b, w, h));
  }
}
