// 알비온식 UI 부품 (2026-11-28 2차) — docs/intent/albion-ui-analysis.md 의 실측 색·구조를 1px 단위 캔버스로 그린다
//   종이 창(그러데이션·결·두 겹 가장자리·찢긴 홈·비네트·그림자) · 철 칸 · 종이 홈 빈 칸 · 실루엣 장비 칸
//   단계/희귀도 배지 · 닫기 원 · 남색/진홍 알약 단추 · 스크롤바 · 게이지 · 초상 원 · 철틀 종이 창 · 파란 아이콘 판
const hex = (c) => "#" + (c & 0xffffff).toString(16).padStart(6, "0");
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 부드러운 값 노이즈 (얼룩)
const VN = (x, y, s, seed) => {
  const fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
  const a = H(ix, iy, seed), b = H(ix + 1, iy, seed), c = H(ix, iy + 1, seed), d = H(ix + 1, iy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
function cv(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  const r = (a, b, ww, hh, col, al = 1) => ((x.globalAlpha = al), (x.fillStyle = hex(col)), x.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh)), (x.globalAlpha = 1));
  draw(r, x);
  return c;
}
const put = (scene, k, c) => (scene.textures.exists(k) || scene.textures.addCanvas(k, c), k);
// 둥근 사각형 안쪽 거리 (모서리 반경 rad) — 가장자리면 0
const edgeRR = (x, y, w, h, rad) => {
  const cx = Math.min(Math.max(x, rad), w - 1 - rad), cy = Math.min(Math.max(y, rad), h - 1 - rad);
  const dc = Math.hypot(x - cx, y - cy);
  if (dc > rad + 0.35) return -1;
  const inCorner = (x < rad || x > w - 1 - rad) && (y < rad || y > h - 1 - rad);
  return inCorner ? Math.floor(rad + 0.35 - dc) : Math.min(x, y, w - 1 - x, h - 1 - y);
};

// ── 색 (실측) ──
export const C = {
  paperTop: 0xe3b991, paperMid: 0xc79e7e, paperBot: 0x9c745b,
  rimOut: 0x946c52, rimOutBot: 0x775742, rimIn: 0xb58c70,
  ink: "#4a2b16", ink2: "#5a3c24", label: "#76563f", inkRed: "#8a1a0e",
  gold: "#e2b95f", silver: "#c8ccd8", light: "#d4b297",
};
const RAR_RING = { common: 0xe8e8e8, uncommon: 0x5ac84a, rare: 0x4a90e0, epic: 0xa060e0, legendary: 0xf0b030 };
export const rarRing = (rar) => RAR_RING[rar] ?? RAR_RING.common;

// ── 종이 창 ── (그림자 3px 포함: 텍스처 크기 w+3 × h+3)
export function parchKey(scene, w, h, o = {}) {
  const seed = o.seed ?? 7, tone = o.tone ?? 0;
  const k = `alb_parch_${w}x${h}_${seed}_${tone}`;
  if (scene.textures.exists(k)) return k;
  // 찢긴 홈: 가장자리마다 0~2개 (씨앗 고정)
  const notches = [];
  const side = (n, len) => {
    for (let i = 0; i < n; i++) {
      const at = Math.floor(10 + H(i, notches.length, seed) * (len - 20)), wd = 3 + Math.floor(H(notches.length, i, seed + 1) * 3), dp = 1 + (H(i, seed, notches.length) > 0.5 ? 1 : 0);
      notches.push({ at, wd, dp });
    }
  };
  const nT = notches.length; side(1, w);
  const nR = notches.length; side(2, h);
  const nB = notches.length; side(1, w);
  const nL = notches.length; side(2, h);
  const nE = notches.length;
  const cut = (x, y) => {
    for (let i = 0; i < nE; i++) {
      const N = notches[i];
      const sd = i < nR ? "T" : i < nB ? "R" : i < nL ? "B" : "L";
      const along = sd === "T" || sd === "B" ? x : y, depth = sd === "T" ? y : sd === "B" ? h - 1 - y : sd === "L" ? x : w - 1 - x;
      const off = Math.abs(along - N.at);
      if (off <= N.wd / 2 && depth < N.dp * (1 - off / (N.wd / 2 + 0.5)) + 0.5) return 1;
    }
    return 0;
  };
  void nT;
  const c = cv(w + 3, h + 3, (r) => {
    // 그림자 (오른쪽·아래)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) if (edgeRR(x, y, w, h, 3) >= 0 && !cut(x, y)) r(x + 2, y + 3, 1, 1, 0x140c04, 0.42);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const e0 = edgeRR(x, y, w, h, 3);
        if (e0 < 0 || cut(x, y)) continue;
        // 홈 근처는 가장자리처럼
        let e = e0;
        if (cut(x - 1, y) || cut(x + 1, y) || cut(x, y - 1) || cut(x, y + 1)) e = 0;
        else if (cut(x - 2, y) || cut(x + 2, y) || cut(x, y - 2) || cut(x, y + 2)) e = Math.min(e, 1);
        const t = y / (h - 1);
        let col = t < 0.45 ? mix(C.paperTop, C.paperMid, t / 0.45) : mix(C.paperMid, C.paperBot, (t - 0.45) / 0.55);
        tone && (col = sh(col, tone));
        // 결: 큰 얼룩 · 가로 섬유 · 잔결
        const blot = (VN(x, y, 14, seed) - 0.5) * 0.07 + (VN(x, y, 5, seed + 3) - 0.5) * 0.035;
        const fib = (H(x >> 3, y, seed + 5) - 0.5) * 0.025;
        const fine = (H(x, y, seed + 9) - 0.5) * 0.03;
        col = sh(col, blot + fib + fine);
        // 가장자리 두 겹 + 안쪽 비네트
        if (e === 0) col = mix(C.rimOut, C.rimOutBot, t);
        else if (e === 1) col = sh(mix(C.rimIn, 0x9a7458, t), (H(x, y, seed) - 0.5) * 0.06);
        else if (e < 7) col = sh(col, -(7 - e) * 0.018);
        r(x, y, 1, 1, col);
      }
    // 맨 위 빛 (종이 위 가장자리 안쪽 1줄 밝게)
    for (let x = 4; x < w - 4; x++) cut(x, 2) || r(x, 2, 1, 1, 0xfff0d8, 0.12);
  });
  return put(scene, k, c);
}

// ── 철틀 종이 창 (툴팁·제작창) ── 아래 띠가 두껍다. 그림자 포함 w+3 × h+3
export function ironKey(scene, w, h, o = {}) {
  const seed = o.seed ?? 11;
  const k = `alb_iron_${w}x${h}_${seed}`;
  if (scene.textures.exists(k)) return k;
  const L = 3, T = 3, Rr = 3, B = 7;
  const c = cv(w + 3, h + 3, (r) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) edgeRR(x, y, w, h, 5) >= 0 && r(x + 2, y + 3, 1, 1, 0x0a0604, 0.5);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const e = edgeRR(x, y, w, h, 5);
        if (e < 0) continue;
        const inPaper = x >= L && x < w - Rr && y >= T && y < h - B;
        if (!inPaper) {
          // 철: 위·왼 밝고 아래·오른 어둡다 + 긁힘
          let col = mix(0x5a5a5e, 0x2e2e32, y / h);
          col = sh(col, (VN(x, y, 6, seed) - 0.5) * 0.25 + (H(x, y, seed) - 0.5) * 0.1);
          H(x >> 2, y, seed + 2) > 0.93 && (col = sh(col, 0.25));
          if (e === 0) col = 0x0c0c0e;
          else if (e === 1) col = y < h / 2 ? sh(col, 0.35) : sh(col, -0.2);
          // 종이와 맞닿는 안쪽 선
          const nearPaper = x >= L - 1 && x <= w - Rr && y >= T - 1 && y <= h - B;
          nearPaper && (col = 0x141210);
          r(x, y, 1, 1, col);
          continue;
        }
        const px = x - L, py = y - T, pw = w - L - Rr, ph = h - T - B;
        const t = py / ph;
        let col = mix(0xdcb48c, 0xa4806c, t);
        col = sh(col, (VN(px, py, 12, seed) - 0.5) * 0.07 + (H(px, py, seed + 4) - 0.5) * 0.03);
        const pe = Math.min(px, py, pw - 1 - px, ph - 1 - py);
        pe < 5 && (col = sh(col, -(5 - pe) * 0.035));
        r(x, y, 1, 1, col);
      }
    // 아래 띠 가운데 긁힌 홈
    for (let x = 12; x < w - 12; x++) H(x, 1, seed) > 0.4 && r(x, h - 4, 1, 1, 0x1a1a1c, 0.6);
  });
  return put(scene, k, c);
}

// ── 파란 아이콘 판 (툴팁 왼쪽 위 · 오른쪽 아래 모서리가 크게 둥글다) ──
export function iconPanelKey(scene, s) {
  const k = `alb_icpanel_${s}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(s, s, (r) => {
    const cx = s * 0.45, cy = s * 0.45;
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const R0 = 9, ex = x - (s - 1 - R0), ey = y - (s - 1 - R0);
        if (ex > 0 && ey > 0 && Math.hypot(ex, ey) > R0) continue;
        const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy) / s;
        let col = mix(0x4a7088, 0x2c4658, d * 1.3);
        Math.floor(((a + Math.PI) / (Math.PI * 2)) * 14) % 2 && (col = sh(col, -0.08));
        col = sh(col, (H(x, y, 3) - 0.5) * 0.05);
        (x === s - 1 || y === s - 1) && (col = 0x1a2a36);
        r(x, y, 1, 1, col);
      }
  });
  return put(scene, k, c);
}

// ── 칸 ──
// 철 칸 (아이템이 있을 때) 28×28
function metalSlot(s, hi) {
  return cv(s + 1, s + 1, (r) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) edgeRR(x, y, s, s, 3) >= 0 && r(x + 1, y + 1, 1, 1, 0x2a1408, 0.35);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const e = edgeRR(x, y, s, s, 3);
        if (e < 0) continue;
        const top = y < s / 2 + (x - s / 2) * 0.0, tl = x + y < s;
        let col;
        if (e === 0) col = 0x25262a;
        else if (e === 1) col = hi ? (tl ? 0xf0d488 : 0x8a6428) : tl ? 0x8e9094 : 0x4c4d50;
        else if (e === 2) col = hi ? (tl ? 0xc8a050 : 0x6a4c20) : tl ? 0x6a6b6e : 0x56575a;
        else if (e === 3) col = top ? 0x1b1c1e : 0x111518;
        else {
          col = mix(0x3a4149, 0x30353b, y / s);
          // 희미한 마름모 문양 + 가운데 방패 문장
          ((x + y) % 6 === 0 || (x - y + 60) % 6 === 0) && (col = sh(col, 0.05));
          const dx = Math.abs(x - s / 2 + 0.5), dy = y - s / 2 + 0.5;
          dy > -6 && dy < 5 && dx < 5 - Math.max(0, dy) * 0.6 && (col = sh(col, 0.06));
          col = sh(col, (H(x, y, 5) - 0.5) * 0.05);
        }
        r(x, y, 1, 1, col);
      }
    // 위 모서리 반사점
    r(4, 1, s - 8, 1, hi ? 0xfff0c0 : 0xc9c4c0, 0.75);
  });
}
// 종이 홈 (빈 칸) — 아래 종이 위에 덮는 반투명 그림
function hollowSlot(s, hi, seed) {
  return cv(s, s, (r) => {
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        // 울퉁불퉁한 가장자리
        const j = H(x >> 1, y >> 1, seed) > 0.8 ? 1 : 0;
        let e = Math.min(x, y, s - 1 - x, s - 1 - y) - j;
        if (e < 0) continue;
        if ((x < 1 || x > s - 2) && (y < 1 || y > s - 2)) continue;
        let a = e === 0 ? 0.36 : e === 1 ? 0.26 : e === 2 ? 0.17 : 0.11;
        y <= 2 && (a += 0.06);
        const col = hi ? 0x5a3a10 : 0x5a3a22;
        r(x, y, 1, 1, col, a);
        // 아래쪽 입술은 밝게
        y === s - 1 && r(x, y, 1, 1, 0xfff0d8, 0.25);
      }
    if (hi) for (let i = 2; i < s - 2; i++) (r(i, 2, 1, 1, 0xffe090, 0.55), r(i, s - 3, 1, 1, 0xffe090, 0.55), r(2, i, 1, 1, 0xffe090, 0.55), r(s - 3, i, 1, 1, 0xffe090, 0.55));
  });
}
// 장비 칸 실루엣: 아이콘 모양을 종이에 눌러 찍는다
function ghostSlot(scene, s, iconKey, hi) {
  const base = hollowSlot(s, hi, 3);
  if (!iconKey || !scene.textures.exists(iconKey)) return base;
  const f = scene.textures.getFrame(iconKey);
  const k = f.width < 14 ? 2 : 1, fw = f.width * k, fh = f.height * k;
  const t = document.createElement("canvas");
  t.width = fw;
  t.height = fh;
  const tx = t.getContext("2d");
  tx.imageSmoothingEnabled = !1;
  tx.drawImage(f.source.image, f.cutX, f.cutY, f.width, f.height, 0, 0, fw, fh);
  const d = tx.getImageData(0, 0, fw, fh).data;
  const x = base.getContext("2d");
  const ox = Math.floor((s - fw) / 2), oy = Math.floor((s - fh) / 2);
  const A = (px, py) => px >= 0 && py >= 0 && px < fw && py < fh && d[(py * fw + px) * 4 + 3] > 40;
  for (let py = 0; py < fh; py++)
    for (let px = 0; px < fw; px++) {
      if (!A(px, py)) {
        // 오른쪽 아래 밝은 눌림 자국
        if (A(px - 1, py - 1)) ((x.globalAlpha = 0.45), (x.fillStyle = "#fff0d8"), x.fillRect(ox + px, oy + py, 1, 1));
        continue;
      }
      x.globalAlpha = A(px, py - 1) ? 0.4 : 0.55;
      x.fillStyle = "#4a3020";
      x.fillRect(ox + px, oy + py, 1, 1);
    }
  x.globalAlpha = 1;
  return base;
}
// 5줄 픽셀 글자
const GLY = {
  roman: [null,
    ["###", ".#.", ".#.", ".#.", "###"],
    ["#####", ".#.#.", ".#.#.", ".#.#.", "#####"],
    ["#######", ".#.#.#.", ".#.#.#.", ".#.#.#.", "#######"],
    ["#.#...#", "#.#...#", "#..#.#.", "#..#.#.", "#...#.."],
    ["#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
    ["#...#.#", "#...#.#", ".#.#..#", ".#.#..#", "..#...#"]],
  fuse: [[".#.", "##.", ".#.", ".#.", "###"], ["##.", "..#", ".#.", "#..", "###"], ["..#..", ".###.", "#####", ".#.#.", "#...#"]],
  key: { Q: [".#.", "#.#", "#.#", "##.", ".##"], E: ["###", "#..", "##.", "#..", "###"], R: ["##.", "#.#", "##.", "#.#", "#.#"] },
};
export const SLOT = 28;
// 칸 텍스처 키 (style: "alb" 가방 칸 · "albeq_<kind>" 장비 칸)
export function slotKey(style, hi, it) {
  if (it) return hi ? "alb_slot_hi" : "alb_slot";
  if (style === "alb") return hi ? "alb_hollow_hi" : "alb_hollow";
  return `alb_${style.slice(3)}${hi ? "_hi" : ""}`;
}
const GHOST = { eq_weapon: "fa_W01", eq_armor: "fa_A01", eq_s1: "fa_S01", eq_s2: "fa_S03", eq_magic: "fa_M01", eq_sell: "icon_gold" };
export function makeArt(scene) {
  if (scene.textures.exists("alb_slot")) return;
  put(scene, "alb_slot", metalSlot(SLOT, 0));
  put(scene, "alb_slot_hi", metalSlot(SLOT, 1));
  put(scene, "alb_hollow", hollowSlot(SLOT, 0, 1));
  put(scene, "alb_hollow_hi", hollowSlot(SLOT, 1, 1));
  for (const [k, ic] of Object.entries(GHOST)) (put(scene, `alb_${k}`, ghostSlot(scene, SLOT, ic, 0)), put(scene, `alb_${k}_hi`, ghostSlot(scene, SLOT, ic, 1)));
  // 배지 (지름 11): 짙은 원 + 테 + 픽셀 글자 (로마 숫자·융합 단계·키)
  const badge = (ring, glyph, col = 0xf4f4f4) => cv(11, 11, (r) => {
    for (let y = 0; y < 11; y++)
      for (let x = 0; x < 11; x++) {
        const d = Math.hypot(x - 5, y - 5);
        if (d > 5.6) continue;
        r(x, y, 1, 1, d > 4.5 ? ring : mix(0x3c3c40, 0x18181c, y / 11));
      }
    if (!glyph) return;
    const gw = glyph[0].length, ox = Math.floor((11 - gw) / 2), oy = 3;
    glyph.forEach((row, j) => [...row].forEach((ch, i) => ch === "#" && (r(ox + i, oy + j + 1, 1, 1, 0x000000, 0.6), r(ox + i, oy + j, 1, 1, col))));
  });
  put(scene, "alb_badge_tier", badge(0x8a8a8e));
  GLY.roman.forEach((g, n) => n && put(scene, `alb_badge_tier_${n}`, badge(0x9a9a9e, g)));
  for (const [rar, ring] of Object.entries(RAR_RING)) [null, ...GLY.fuse].forEach((g, t) => put(scene, `alb_badge_${rar}${t ? "_" + t : ""}`, badge(ring, g)));
  for (const [k, g] of Object.entries(GLY.key)) put(scene, `alb_key_${k}`, badge(0x9a8048, g, 0xf0c860));
  // 닫기 원 12×12
  const closeBtn = (hov) => cv(12, 12, (r) => {
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 12; x++) {
        const d = Math.hypot(x - 5.5, y - 5.5);
        if (d > 6) continue;
        r(x, y, 1, 1, d > 5.2 ? 0x0c0d12 : d > 4.2 ? (y < 6 ? 0xc8ccd8 : 0x5a5e6a) : mix(hov ? 0x34384a : 0x262a3a, 0x10121a, y / 12));
      }
    for (let i = 0; i < 5; i++) (r(3.5 + i, 3.5 + i, 1, 1, hov ? 0xfff0a0 : 0xfadf52), r(7.5 - i, 3.5 + i, 1, 1, hov ? 0xfff0a0 : 0xfadf52), r(4.5 + i, 3.5 + i, 1, 1, 0x8a6a10, 0.6));
  });
  put(scene, "alb_close", closeBtn(0));
  put(scene, "alb_close_hov", closeBtn(1));
  // 스크롤 끝 단추 (주황 삼각) 7×6
  const arrow = (up) => cv(7, 6, (r) => {
    for (let y = 0; y < 5; y++) {
      const row = up ? y : 4 - y, half = row * 0.7;
      for (let x = 0; x < 7; x++) Math.abs(x - 3) <= half + 0.4 && r(x, y, 1, 1, Math.abs(x - 3) > half - 0.6 ? 0x5a2a04 : mix(0xffc060, 0xd06810, y / 5));
    }
  });
  put(scene, "alb_arr_up", arrow(1));
  put(scene, "alb_arr_dn", arrow(0));
}
// 남색/진홍 알약 단추 (높이 hh)
export function pillKey(scene, w, hh, style = "navy", hov = 0) {
  const k = `alb_pill_${w}x${hh}_${style}_${hov}`;
  if (scene.textures.exists(k)) return k;
  const body = style === "red" ? [0xb8283a, 0x5a0a12] : style === "paper" ? [0xe0c098, 0xb89470] : style === "off" ? [0x4a4a4e, 0x2a2a2e] : style === "steel" ? [0x8c8884, 0x5c5854] : style === "green" ? [0x5a8a2a, 0x2a4a10] : [0x4c4f5e, 0x23252f];
  const c = cv(w, hh, (r) => {
    const rad = Math.floor(hh / 2);
    for (let y = 0; y < hh; y++)
      for (let x = 0; x < w; x++) {
        const e = edgeRR(x, y, w, hh, rad);
        if (e < 0) continue;
        let col;
        if (e === 0) col = 0x0c0d10;
        else if (e === 1) col = mix(0xd0d4e0, 0x5a5e6c, y / hh);
        else {
          col = mix(body[0], body[1], (y - 2) / (hh - 4));
          hov && (col = sh(col, 0.14));
          y === 2 && (col = sh(col, 0.25));
        }
        r(x, y, 1, 1, col);
      }
  });
  return put(scene, k, c);
}
// 초상 원 (지름 s) — 플레이어 머리를 2배로
export function portraitKey(scene, s, spriteKey, cx = 11, cy = 4) {
  const k = `alb_portrait_${s}_${spriteKey}_${cx}_${cy}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(s, s, (r, x) => {
    const c0 = (s - 1) / 2;
    for (let y = 0; y < s; y++)
      for (let X = 0; X < s; X++) {
        const d = Math.hypot(X - c0, y - c0);
        if (d > s / 2) continue;
        r(X, y, 1, 1, d > s / 2 - 1 ? 0x4a2e1a : d > s / 2 - 3 ? (y < c0 ? 0xd0d4e0 : 0x6a6e7c) : d > s / 2 - 4 ? 0x14161c : mix(0x9ac8ec, 0x4a7ab0, y / s));
      }
    if (scene.textures.exists(spriteKey)) {
      const f = scene.textures.getFrame(spriteKey, 0);
      const inner = s / 2 - 4;
      x.save();
      x.beginPath();
      x.arc(c0 + 0.5, c0 + 0.5, inner, 0, Math.PI * 2);
      x.clip();
      x.imageSmoothingEnabled = !1;
      // 얼굴 부분 (x 11~23, y 4~16) → 2배
      x.drawImage(f.source.image, f.cutX + cx, f.cutY + cy, 12, 12, Math.round(c0 - 11.5), Math.round(c0 - 11.5), 24, 24);
      x.restore();
    }
  });
  return put(scene, k, c);
}
// 문장 원 (지름 s): 은 고리 + 안쪽 그림 (kind: "chest")
export function medalKey(scene, s, kind) {
  const k = `alb_medal_${s}_${kind}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(s, s, (r) => {
    const c0 = (s - 1) / 2;
    for (let y = 0; y < s; y++)
      for (let X = 0; X < s; X++) {
        const d = Math.hypot(X - c0, y - c0);
        if (d > s / 2) continue;
        r(X, y, 1, 1, d > s / 2 - 1 ? 0x4a2e1a : d > s / 2 - 3 ? (y < c0 ? 0xd0d4e0 : 0x6a6e7c) : d > s / 2 - 4 ? 0x14161c : mix(0x5a4a3a, 0x2a2018, (Math.hypot(X - c0, y - c0 - 3) / s) * 1.6));
      }
    if (kind === "chest") {
      const ox = Math.round(c0 - 8), oy = Math.round(c0 - 6);
      // 둥근 뚜껑
      for (let y = 0; y < 5; y++) for (let x = 0; x < 16; x++) Math.abs(x - 7.5) < 6 + y * 0.6 && r(ox + x, oy + y, 1, 1, y === 0 ? 0x2a160a : mix(0xb0703a, 0x7a4a24, y / 5));
      // 몸통
      for (let y = 5; y < 13; y++) for (let x = 0; x < 16; x++) r(ox + x, oy + y, 1, 1, x === 0 || x === 15 || y === 12 ? 0x2a160a : mix(0x9a6030, 0x5a3418, (y - 5) / 8));
      // 쇠띠 · 자물쇠
      for (const bx of [3, 12]) for (let y = 0; y < 13; y++) r(ox + bx, oy + y, 1, 1, y < 5 ? 0xb8b0a0 : 0x8a8478);
      r(ox, oy + 5, 16, 1, 0x3a2a1a);
      r(ox + 6, oy + 4, 4, 5, 0xe0b040);
      r(ox + 7, oy + 6, 2, 2, 0x3a2a10);
      r(ox + 6, oy + 4, 4, 1, 0xfff0a0);
    }
  });
  return put(scene, k, c);
}
// ── 어두운 나무 머리띠 (상점·거래소 창 위쪽 · 실측 #43342d, 결 #382d27, 밝은 결 #927f6e) ── 위 모서리 둥글다, 아래는 철 띠
export function woodHeadKey(scene, w, hh, seed = 3) {
  const k = `alb_woodhead_${w}x${hh}_${seed}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(w, hh, (r) => {
    for (let y = 0; y < hh; y++)
      for (let x = 0; x < w; x++) {
        // 위 모서리만 둥글게
        if (y < 4 && edgeRR(x, y, w, hh + 8, 4) < 0) continue;
        const e = Math.min(x, y, w - 1 - x);
        // 판자: 가로 결, 판자 경계 11px마다
        const plank = Math.floor((y + (H(Math.floor(x / 90), 0, seed) * 6 | 0)) / 11);
        let col = sh(0x46372f, (H(plank, 1, seed) - 0.5) * 0.16);
        const grain = VN(x * 0.25, y * 2.2, 3, seed + plank) - 0.5;
        col = sh(col, grain * 0.32 + (H(x, y, seed) - 0.5) * 0.06);
        H(x >> 3, y, seed + 9) > 0.96 && (col = sh(col, 0.35));
        (y + (H(Math.floor(x / 90), 0, seed) * 6 | 0)) % 11 === 0 && (col = 0x231a15);
        // 철 테두리
        if (e === 0) col = 0x0c0c0e;
        else if (e === 1) col = y < 3 ? 0x8a8a90 : 0x5a5a60;
        else if (e === 2) col = sh(col, -0.25);
        if (y >= hh - 4) col = y === hh - 4 ? 0x0c0c0e : y === hh - 3 ? 0x6a6a70 : y === hh - 2 ? 0x3a3a40 : 0x141416;
        r(x, y, 1, 1, col);
      }
  });
  return put(scene, k, c);
}
// ── 안쪽 판 (구역 상자): 종이보다 살짝 어둡고, 위·왼쪽이 파인 홈 ──
export function insetKey(scene, w, h, seed = 1, tone = -0.07) {
  const k = `alb_inset_${w}x${h}_${seed}_${tone}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(w, h, (r) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (edgeRR(x, y, w, h, 2) < 0) continue;
        const e = Math.min(x, y, w - 1 - x, h - 1 - y);
        let col = sh(mix(0xd8b08c, 0xb48c70, y / h), tone + (VN(x, y, 10, seed) - 0.5) * 0.06 + (H(x, y, seed) - 0.5) * 0.03);
        if (e === 0) col = x === 0 || y === 0 ? 0x7a5a42 : 0xf0d4b0;
        else if (e === 1 && (x === 1 || y === 1)) col = sh(col, -0.12);
        r(x, y, 1, 1, col);
      }
  });
  return put(scene, k, c);
}
// ── 작은 문장 원 (지름 s, 안에 아이콘) ──
export function iconMedalKey(scene, s, iconKey, done = 1) {
  const k = `alb_imedal_${s}_${iconKey}_${done}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(s, s, (r, x) => {
    const c0 = (s - 1) / 2;
    for (let y = 0; y < s; y++)
      for (let X = 0; X < s; X++) {
        const d = Math.hypot(X - c0, y - c0);
        if (d > s / 2) continue;
        r(X, y, 1, 1, d > s / 2 - 1 ? 0x1a1410 : d > s / 2 - 2.5 ? (done ? (y < c0 ? 0xf0d488 : 0x9a6a28) : y < c0 ? 0xb8bcc8 : 0x5a5e6a) : mix(0x4a5058, 0x22262c, y / s));
      }
    if (iconKey && scene.textures.exists(iconKey)) {
      const f = scene.textures.getFrame(iconKey);
      const z = f.width <= 12 && s >= 20 ? 1 : Math.min(1, (s - 6) / f.width);
      x.imageSmoothingEnabled = !1;
      x.globalAlpha = done ? 1 : 0.45;
      x.drawImage(f.source.image, f.cutX, f.cutY, f.width, f.height, Math.round(c0 + 0.5 - (f.width * z) / 2), Math.round(c0 + 0.5 - (f.height * z) / 2), f.width * z, f.height * z);
      x.globalAlpha = 1;
    }
  });
  return put(scene, k, c);
}
// ── 어두운 대화창 (일시정지·설정·확인창 · 실측 #28272c → #161618, 테 #3d3331 · 레퍼런스 a04) ──
export function darkPanelKey(scene, w, h, seed = 2) {
  const k = `alb_dark_${w}x${h}_${seed}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(w + 3, h + 3, (r) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) edgeRR(x, y, w, h, 4) >= 0 && r(x + 2, y + 3, 1, 1, 0x000000, 0.5);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const e = edgeRR(x, y, w, h, 4);
        if (e < 0) continue;
        const t = y / h;
        let col = mix(0x2c2b31, 0x141416, t);
        col = sh(col, (VN(x, y, 9, seed) - 0.5) * 0.12 + (H(x, y, seed) - 0.5) * 0.05);
        if (e === 0) col = 0x08080a;
        else if (e === 1) col = mix(0x8a8a92, 0x3a3a40, t);
        else if (e === 2) col = 0x101012;
        else if (e === 4) col = mix(0x4a3e38, 0x2e2622, t);
        else if (e === 5) col = sh(col, -0.25);
        r(x, y, 1, 1, col);
      }
    // 위 안쪽 반사
    for (let x = 6; x < w - 6; x++) r(x, 6, 1, 1, 0xffffff, 0.04);
    // 모서리 쇠 장식 (작은 마름모)
    for (const [cx, cy] of [[6, 6], [w - 7, 6], [6, h - 7], [w - 7, h - 7]])
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) Math.abs(dx) + Math.abs(dy) <= 2 && r(cx + dx, cy + dy, 1, 1, Math.abs(dx) + Math.abs(dy) === 2 ? 0x2a2420 : dy < 0 ? 0xb8a890 : 0x6a5a48);
  });
  return put(scene, k, c);
}
// 게이지 홈 + 채움 (너비 w)
export function gaugeKey(scene, w, frac) {
  const n = Math.round(Math.max(0, Math.min(1, frac)) * (w - 2));
  const k = `alb_gauge_${w}_${n}`;
  if (scene.textures.exists(k)) return k;
  const c = cv(w, 5, (r) => {
    r(0, 0, w, 5, 0x4a3020, 0.55);
    r(1, 1, w - 2, 3, 0x2a1a10, 0.75);
    for (let x = 0; x < n; x++) (r(1 + x, 1, 1, 1, 0x9af07a), r(1 + x, 2, 1, 2, x % 2 ? 0x4ab83a : 0x52c040));
    r(Math.floor(w / 2), 0, 1, 5, 0x2a1a10, 0.9);
    r(0, 4, w, 1, 0xfff0d8, 0.25);
  });
  return put(scene, k, c);
}
// 스크롤 홈 (높이 hh)
export function railKey(scene, hh) {
  const k = `alb_rail_${hh}`;
  if (scene.textures.exists(k)) return k;
  return put(scene, k, cv(5, hh, (r) => {
    r(0, 0, 5, hh, 0x0c0d12);
    r(1, 0, 1, hh, 0x8a8e9a);
    r(2, 0, 2, hh, 0x1a1c26);
    r(3, 0, 1, hh, 0x3a3e4a);
  }));
}
export function thumbKey(scene, hh) {
  const k = `alb_thumb_${hh}`;
  if (scene.textures.exists(k)) return k;
  return put(scene, k, cv(5, hh, (r) => {
    r(0, 0, 5, hh, 0x0c0d12);
    for (let y = 1; y < hh - 1; y++) r(1, y, 3, 1, mix(0xd0d4e0, 0x6a6e7c, y / hh));
    r(1, Math.floor(hh / 2), 3, 1, 0x3a3e4a);
  }));
}
// 홈 구분선 (어두운 1px + 밝은 1px)
export function groove(scene, x, y, w, depth) {
  return [scene.add.rectangle(x, y, w, 1, 0x6a4a32, 0.55).setOrigin(0).setDepth(depth), scene.add.rectangle(x, y + 1, w, 1, 0xfff0d8, 0.3).setOrigin(0).setDepth(depth)];
}
// 종이 위 글자 (외곽선 없이, 아래 1px 밝은 각인 그림자)
export const inkStyle = { shadow: { offsetX: 0, offsetY: 1, color: "rgba(255,236,200,0.45)", blur: 0, fill: !0 } };
export const darkStyle = { shadow: { offsetX: 0, offsetY: 1, color: "rgba(0,0,0,0.85)", blur: 0, fill: !0 } };
export const ROMAN = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"];
