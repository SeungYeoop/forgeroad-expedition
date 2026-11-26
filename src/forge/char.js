// 캐릭터 그림 (레퍼런스 ref08: 바이킹 전사) — 32x32 프레임 24장
//   원본 포즈 데이터(As)와 손 위치(HAND)는 그대로 → 무기 위치가 맞는다. 그림만 새로 그린다.
//   장난감처럼 보이지 않게:
//   · 실루엣: 등을 덮는 무거운 양모 망토 + 뭉치진 모피 깃, 넓은 어깨 → 잘록한 허리(네모 몸통 금지)
//   · 명암: 재질마다 5단(밝음은 따뜻하게, 그늘은 차갑게), 부위끼리 밝기를 확실히 나눈다
//           (밝은 얼굴·손 / 중간 튜닉 / 짙은 망토·머리 / 차가운 바지)
//   · 얼굴: 짙은 눈썹, 우뚝한 코, 귀밑털과 이어진 수염, 결이 보이는 머리
//   · 테두리: 맞닿은 색을 어둡게 한 선택 외곽선, 위쪽 가장자리엔 따뜻한 빛
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
const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const nz = (x, y, k = 0) => hash(Math.round(x), Math.round(y), k) - 0.5;
// 원색을 흙빛 쪽으로 누른다
const mute = (c, k = 0.3) => mix(c, 0x6e5e48, k);
// 5단 램프: 밝음은 따뜻하게, 그늘은 차갑게
const R5 = (c) => [mix(sh(c, 0.34), 0xffe6c0, 0.18), sh(c, 0.13), c, mix(sh(c, -0.32), 0x262036, 0.2), mix(sh(c, -0.56), 0x161220, 0.32)];
const T5 = (p, v) => p[v > 0.55 ? 0 : v > 0.18 ? 1 : v > -0.22 ? 2 : v > -0.58 ? 3 : 4];
const T3 = (p, v) => p[v > 0.3 ? 0 : v > -0.3 ? 1 : 2];
const SKIN = 0xe0b08a, SKIN_L = 0xf0c8a0, SKIN_M = 0xbc8462, SKIN_D = 0x8a563e, EYE = 0x1a1210, OUT = 0x1c120c;
export const HAIRS = {
  brown: [0x6e4a2e, 0x4a301c, 0x2c1c12],
  blond: [0xd4ac6c, 0xa07a42, 0x664824],
  red: [0xb0602c, 0x80401c, 0x4c2410],
  grey: [0xb8b0a2, 0x88827a, 0x56524c],
  black: [0x443830, 0x2a221e, 0x161210],
};
const LEATHER = [0x9a6c44, 0x74502e, 0x50361e], IRON = [0xb4b0a8, 0x86827a, 0x5a5650, 0x3a3834], GOLD = [0xf0d070, 0xc89a3a, 0x8a6420];
const HAND = {
  down: [1, 7], low: [3, 6], fwd: [6, 2], back: [-4, 5], up: [2, -6], reach: [7, -1], cast: [7, -3],
};

// ── 망토: 어깨에서 등 뒤로 무릎까지, 세로 주름 · 해진 끝단 · 바람에 뒤로 날림 ──
function cloak(b, tx, ty, wave, P) {
  const pal = R5(P.cape), sw = wave * 1.05, L = 12, top = ty - 1;
  for (let y = top; y <= ty + L; y++) {
    const t = (y - top) / L, back = tx - 1 - t * (2.4 + sw) + Math.sin(t * 5 + wave) * 0.6, front = tx + 5 - t * (1.2 + sw * 0.35);
    for (let x = Math.floor(back); x <= Math.ceil(front); x++) {
      const u = (x - back) / Math.max(1, front - back), fold = Math.sin((x + t * sw * 2) * 1.5 + wave);
      let v = -0.2 + fold * 0.32 - t * 0.28 + nz(x, y, 3) * 0.18;
      u < 0.12 && (v -= 0.3);
      b.px(x, y, T5(pal, v));
    }
    if (y === ty + L) for (let x = Math.floor(back); x <= Math.ceil(front); x++) hash(x, 7) > 0.45 && b.px(x, y + 1, pal[4]);
  }
}
// ── 다리: 바지(허벅지 굵고 무릎에서 가늘어짐) + 아마 감개 + 가죽 신(발끝이 앞으로) ──
function leg(b, hx, hy, fx, fy, P, back) {
  const k = back ? -0.3 : 0, tp = R5(sh(P.pants, k)), wp = R5(sh(P.wrap, k)), bp = R5(sh(LEATHER[2], k));
  const kx = (hx + fx) / 2 + 0.6, ky = (hy + fy - 3) / 2;
  b.thickLine(hx, hy, kx, ky, 3.6, tp[2]);
  b.line(hx + 1, hy, kx + 1, ky, tp[1]);
  b.line(hx - 1, hy + 1, kx - 1, ky, tp[3]);
  b.thickLine(kx, ky, fx + 0.5, fy - 3, 2.7, wp[2]);
  for (let t = 0.15; t < 0.95; t += 0.3) { const x = kx + (fx + 0.5 - kx) * t, y = ky + (fy - 3 - ky) * t; b.line(x - 1, y + 1, x + 1, y, wp[3]); b.px(x + 1, y - 1, wp[1]); }
  b.rect(fx - 1, fy - 3, 3, 2, bp[2]);
  b.px(fx, fy - 3, bp[1]);
  b.rect(fx - 1, fy - 1, 5, 1, bp[2]);
  b.px(fx + 2, fy - 1, bp[1]), b.px(fx + 3, fy - 1, bp[1]);
  b.rect(fx - 1, fy, 5, 1, bp[4]);
}
// ── 팔: 어깨 쪽 굵은 소매(위가 밝다) + 가죽 팔 보호대와 끈 + 손(엄지) ──
function arm(b, sx, sy, pose, P, back) {
  const [dx, dy] = HAND[pose] ?? HAND.down, hx = sx + dx, hy = sy + dy, ex = sx + dx * 0.5, ey = sy + dy * 0.5;
  const s = R5(sh(P.sleeve, back ? -0.32 : 0.06)), br = R5(sh(LEATHER[1], back ? -0.32 : 0));
  // 앞팔은 몸 위에 짙은 안쪽 테두리를 먼저 깔아 몸통과 분리한다
  if (!back) { const dk = mix(sh(P.sleeve, -0.62), OUT, 0.45); b.thickLine(sx, sy + 0.5, ex, ey, 4.4, dk); b.thickLine(ex, ey, hx, hy, 3.5, dk); b.rect(hx - 2, hy - 2, 4, 4, dk); }
  b.thickLine(sx, sy, ex, ey, 3.3, s[2]);
  b.line(sx + 0.7, sy - 0.6, ex + 0.7, ey - 0.6, s[1]);
  b.thickLine(ex, ey, hx, hy, 2.4, br[2]);
  b.line(ex + 0.5, ey - 0.4, hx + 0.5, hy - 0.4, br[1]);
  b.px((ex + hx) / 2, (ey + hy) / 2, br[4]);
  const sk = back ? [SKIN_M, SKIN_D] : [SKIN, SKIN_M];
  b.rect(hx - 1, hy - 1, 2, 2, sk[0]);
  b.px(hx + 1, hy - 1, sk[1]), b.px(hx - 1, hy + 1, sk[1]);
  !back && b.px(hx, hy - 1, SKIN_L);
}
// ── 몸통: 넓은 어깨 → 잘록한 허리 → 엉덩이, 앞이 밝은 원통 음영 + 사선 주름 + 목 트임 + 갑옷 무늬 + 띠·주머니·칼집 ──
const SHAPE = [[1, 8], [0, 9], [0, 9.6], [0.4, 9.6], [1, 9.2], [1.4, 8.6], [1.4, 8.6], [1, 9], [1, 9]];
function torso(b, tx, ty, h, P, L, id) {
  const pal = R5(P.tunic), row = (r) => SHAPE[Math.min(8, Math.round((r * 8) / Math.max(1, h - 1)))];
  const each = (fn) => { for (let r = 0; r < h; r++) { const [l, rr] = row(r); for (let x = Math.ceil(tx + l); x <= Math.floor(tx + rr); x++) fn(x, ty + r, r, (x - (tx + (l + rr) / 2)) / ((rr - l) / 2)); } };
  each((x, y, r, u) => { let v = u * 0.5 + (1 - r / 8) * 0.3 - 0.12 + nz(x, y, 5) * 0.1; Math.abs(u) > 0.86 && (v -= 0.35); b.px(x, y, T5(pal, v)); });
  // 사선 주름 · 목 트임(장식 띠)
  b.px(tx + 4, ty + 3, pal[3]), b.px(tx + 3, ty + 4, pal[3]), b.px(tx + 5, ty + 4, pal[1]), b.px(tx + 6, ty + 5, pal[3]);
  b.px(tx + 7, ty + 1, pal[4]), b.px(tx + 7, ty + 2, pal[4]), b.px(tx + 6, ty + 1, sh(P.trim, 0.1)), b.px(tx + 8, ty + 1, sh(P.trim, 0.1)), b.px(tx + 8, ty + 2, P.trim);
  switch (id) {
    case "chain": each((x, y, r, u) => r > 0 && r < h - 2 && (x + y) % 2 === 0 && b.px(x, y, T5(R5(IRON[1]), u * 0.5 - 0.1 + (r % 2 ? 0.25 : -0.15)))); break;
    case "steel":
    case "guardian":
      each((x, y, r, u) => r > 0 && r < h - 2 && b.px(x, y, T5(R5(id === "guardian" ? 0x9a9488 : IRON[1]), u * 0.5 + (r % 2 ? -0.45 : 0.2) + ((x + (r >> 1)) % 3 === 0 ? -0.3 : 0))));
      id === "guardian" && (each((x, y, r) => r === 0 && b.px(x, y, GOLD[1])), b.px(tx + 5, ty + 2, GOLD[0]));
      break;
    case "leather": each((x, y, r, u) => r > 0 && r < h - 2 && (u > 0.2 && u < 0.4 ? b.px(x, y, pal[4]) : r % 2 === 0 && u > 0.5 && u < 0.7 && b.px(x, y, 0xd8b884))); break;
    case "mage": each((x, y, r, u) => u > 0.15 && u < 0.4 && b.px(x, y, P.trim)); b.px(tx + 6, ty + 3, L.glow ?? 0x90c0ff); break;
    case "thorns": for (const [dx, dy] of [[1, 0], [8, 0], [0, 3]]) b.poly([[tx + dx, ty + dy], [tx + dx - 2, ty + dy - 2], [tx + dx + 1, ty + dy - 1]], 0xd8c8a0); break;
    case "vampire": b.poly([[tx - 1, ty - 3], [tx + 3, ty + 2], [tx + 3, ty - 1]], pal[4]), b.poly([[tx + 10, ty - 3], [tx + 6, ty + 2], [tx + 6, ty - 1]], pal[4]); break;
    case "berserker": each((x, y, r, u) => r > 0 && r < 5 && u > -0.1 && b.px(x, y, u > 0.5 ? SKIN : SKIN_M)); b.line(tx + 5, ty + 2, tx + 8, ty + 4, 0x6a3020); break;
    case "abyss": b.rect(tx + 4, ty + 2, 3, 3, L.glow ?? 0xb070ff), b.px(tx + 5, ty + 3, 0xffffff); break;
  }
  // 가죽 띠 + 쇠고리 · 주머니 · 작은 칼(seax) 칼집
  const by = ty + h - 2;
  for (let x = tx + 1; x <= tx + 9; x++) b.px(x, by, LEATHER[0]), b.px(x, by + 1, LEATHER[2]);
  b.px(tx + 7, by, IRON[0]), b.px(tx + 7, by + 1, IRON[2]);
  b.rect(tx + 1, by + 1, 2, 2, LEATHER[1]), b.px(tx + 1, by + 1, LEATHER[0]), b.px(tx + 2, by + 2, LEATHER[2]);
  b.px(tx + 8, by - 1, IRON[0]), b.px(tx + 8, by + 2, LEATHER[2]), b.px(tx + 9, by + 2, LEATHER[1]), b.px(tx + 9, by + 3, LEATHER[2]);
}
// ── 튜닉 아랫자락: 띠 아래 허벅지 위쪽만 덮는 짧은 자락(가운데 트임 · 주름) ──
function skirt(b, tx, y, P, L, id) {
  const pal = R5(P.tunic), long = L.skirt || id === "mage", d = long ? 6 : 3;
  for (let j = 0; j < d; j++) for (let x = tx + 1 - j * 0.3; x <= tx + 9 + j * 0.3; x++) {
    const X = Math.round(x), u = (X - (tx + 5)) / 5;
    if (!long && j === d - 1 && Math.abs(X - (tx + 5)) < 1) continue;
    let v = u * 0.45 - j * 0.12 - 0.05 + ((X + j) % 3 === 0 ? -0.35 : 0);
    j === d - 1 && (v -= 0.3);
    b.px(X, y + j, T5(pal, v));
  }
  id === "chain" && b.line(tx, y + d - 1, tx + 10, y + d - 1, IRON[2]);
  long && b.line(tx - 1, y + d - 1, tx + 11, y + d - 1, P.trim);
}
// ── 모피 깃: 어깨를 감싸는 털 뭉치들(위가 밝고 아래로 털 끝이 늘어진다) + 어깨 갑옷 + 금 브로치 ──
function mantle(b, tx, ty, P, L) {
  const s = L.shoulder;
  if (s === "plate" || s === "pad") {
    const p = R5(s === "plate" ? IRON[1] : LEATHER[1]);
    for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) (i * i) / 9 + (j * j) / 4.5 <= 1 && b.px(tx + 8 + i, ty + 2 + j, T5(p, -j * 0.35 + i * 0.12 + (j === 2 ? -0.5 : 0)));
  }
  const fp = P.furPal, big = s === "fur" ? 1.3 : 1;
  for (let k = 0; k < 7; k++) {
    const cx = tx - 1 + k * 1.7, cy = ty + 0.2 + (k % 2) * 0.5 + (k === 0 || k === 6 ? 0.8 : 0), r = (1.55 + (k % 3) * 0.25) * big;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const d = Math.hypot(i, j * 1.2);
      if (d > r) continue;
      b.px(cx + i, cy + j, T5(fp, (-j / r) * 0.75 - 0.1 + nz(cx + i, cy + j, 9) * 0.3));
    }
  }
  for (let x = tx - 1; x <= tx + 9; x++) hash(x, 11) > 0.6 && b.px(x, ty + 2 + Math.round(big - 1), fp[3]);
  b.px(tx + 8, ty + 1, GOLD[0]), b.px(tx + 9, ty + 1, GOLD[1]), b.px(tx + 8, ty + 2, GOLD[2]);
  s === "spike" && [0, 8].forEach((dx) => b.poly([[tx + dx, ty], [tx + dx - 1, ty - 3], [tx + dx + 1.5, ty - 1]], 0xd8c8a0));
  s === "wing" && b.poly([[tx - 1, ty], [tx - 4, ty - 4], [tx + 2, ty - 1]], sh(L.cape ?? 0x5a1a2a, -0.2));
  s === "orb" && b.circle(tx + 8, ty - 1, 1.2, L.glow ?? 0x90c0ff);
}
// ── 머리 (10×10 픽셀 설계): 결이 보이는 머리 · 짙은 눈썹 · 눈 · 우뚝한 코 · 광대 빛 · 귀 · 귀밑털과 이어진 수염 · 투구/두건/띠/왕관 ──
const BONE = [0xf0e6cc, 0xd0c4a4, 0x9a8e74];
function head(b, ox, oy, P, L, id) {
  const H = P.hair, helm = L.helm, hood = helm === "hood";
  const metal = helm === "helm" || helm === "helmet" || helm === "cap" || helm === "horned" || helm === "horns" || id === "steel" || id === "guardian";
  const put = (x, y, c) => b.px(ox + x, oy + y, c);
  const cap = (x, y) => ((x - 4.2) / 4.4) ** 2 + ((y - 4.3) / 4.3) ** 2 <= 1;
  const face = (x, y) => y >= 3 && ((x - 6.3) / 2.7) ** 2 + ((y - 5.8) / 3.1) ** 2 <= 1;
  const HP = hood ? [sh(P.hood, 0.2), P.hood, sh(P.hood, -0.32)] : H;
  // 뒤로 늘어진 것: 어깨까지 오는 뒷머리(물결 끝) · 땋은 머리 / 두건 자락
  if (hood) for (let y = 6; y < 13; y++) for (let x = -1; x < 4 - (y - 6) * 0.35; x++) put(x, y, T3(HP, -0.15 - (x + 1) * 0.08 - (y - 6) * 0.07));
  else {
    for (let y = 6; y < 11; y++) for (let x = 0; x < 3; x++) (y < 10 || hash(x, 3, ox) > 0.4) && put(x, y, T3(H, -0.15 - (y - 6) * 0.08 + (x === 1 ? 0.25 : 0) + ((x + y) % 3 === 0 ? -0.4 : 0)));
    if (P.braid) { for (let k = 0; k < 4; k++) put(0, 11 + k, k % 2 ? H[2] : H[1]), put(1, 11 + k, k % 2 ? H[1] : H[0]); put(0, 15, LEATHER[1]), put(1, 15, LEATHER[0]); }
  }
  // 머리 덩어리: 위·앞이 밝고 사선 결, 가장자리는 들쭉날쭉
  for (let y = -1; y < 10; y++) for (let x = -1; x < 10; x++) {
    const edge = !cap(x, y) && (cap(x + 1, y) || cap(x, y + 1)) && hash(x, y, 21) > 0.7;
    if ((!cap(x, y) && !edge) || face(x, y)) continue;
    put(x, y, T3(HP, -((x - 4.2) / 4.4) * 0.3 - ((y - 4.3) / 4.3) * 0.75 + (!hood && (x + y * 2) % 4 === 0 ? -0.45 : 0) + (y <= 1 && x >= 3 && x <= 6 ? 0.35 : 0) - (edge ? 0.3 : 0)));
  }
  // 얼굴: 이마·광대 밝고, 귀 쪽·눈두덩·턱 아래 어둡다
  for (let y = 3; y < 10; y++) for (let x = 3; x < 10; x++) {
    if (!face(x, y)) continue;
    const v = -((x - 7.6) / 2.7) * 0.3 - ((y - 4.4) / 3.1) * 0.6;
    put(x, y, x <= 4 ? SKIN_M : v > 0.42 ? SKIN_L : v > -0.35 ? SKIN : SKIN_M);
  }
  put(6, 9, SKIN_M), put(7, 9, SKIN_D);
  // 우뚝한 코 · 콧방울 그늘 · 광대 빛 · 눈두덩 그늘
  put(9, 4, SKIN), put(9, 5, SKIN_L), put(9, 6, SKIN_M), put(8, 6, SKIN_D), put(7, 6, SKIN_L), put(7, 5, SKIN_M);
  // 이마선 · 앞머리
  if (!hood && !metal) { put(5, 3, H[1]), put(4, 3, H[0]), put(8, 3, H[2]), put(3, 4, H[1]), put(3, 5, H[2]); }
  if (hood) { put(5, 3, H[1]), put(4, 4, H[2]); }
  // 귀
  !hood && (put(4, 5, SKIN_M), put(4, 6, SKIN_D), put(5, 6, SKIN_M));
  // 짙은 눈썹 · 눈
  const eye = id === "abyss" || L.eyeGlow ? L.glow ?? 0xb070ff : EYE;
  put(6, 4, H[2]), put(7, 4, H[2]), put(8, 4, H[1]);
  put(6, 5, eye), put(8, 5, eye);
  !P.beard && (put(7, 8, 0x8a4a38), put(8, 8, SKIN_M));
  // 수염: 귀밑털에서 턱으로 이어지고 앞·아래로 뾰족 (1 짧게 · 2 가슴까지 땋음)
  if (P.beard) {
    const rows = P.beard > 1
      ? [[6, 4, 4], [7, 4, 9], [8, 4, 9], [9, 4, 9], [10, 5, 9], [11, 5, 8], [12, 6, 8], [13, 6, 7]]
      : [[6, 4, 4], [7, 4, 9], [8, 4, 9], [9, 4, 9], [10, 5, 8], [11, 6, 8]];
    for (const [y, x0, x1] of rows) for (let x = x0; x <= x1; x++) {
      if (y === 8 && x === 8) { put(x, y, 0x4a261c); continue; }
      put(x, y, T3(H, 0.4 - (y - 7) * 0.2 - (x - 6.5) * 0.1 + ((x + y) % 3 === 0 ? -0.45 : 0) + (y === 7 && x > 6 ? 0.25 : 0)));
    }
    put(5, 7, H[2]), put(4, 8, H[2]);
    if (P.beard > 1) put(6, 14, LEATHER[0]), put(7, 14, LEATHER[1]), put(6, 15, H[1]), put(7, 15, H[2]);
  }
  // 머리 장비
  if (metal) {
    const IP = [0xd4d0c8, 0x96928a, 0x5e5a54];
    for (let y = -1; y < 4; y++) for (let x = -1; x < 10; x++) {
      if (y >= 0 ? !cap(x, y) : x < 3 || x > 5) continue;
      put(x, y, y === 3 ? (x % 3 === 1 ? IP[0] : IP[2]) : T3(IP, -((x - 4.2) / 4.4) * 0.4 - ((y - 1.5) / 2.5) * 0.7 + (x === 4 ? 0.45 : x === 5 ? -0.45 : 0)));
    }
    put(8, 4, IP[1]), put(8, 5, IP[2]);
    id === "guardian" && [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach((x) => put(x, 3, x % 3 ? GOLD[1] : GOLD[0]));
    if (helm === "horned" || helm === "horns") for (const [x, y, k] of [[0, 1, 1], [-1, 0, 0], [-1, -1, 0], [0, -2, 2], [8, 1, 1], [9, 0, 0], [9, -1, 1], [8, -2, 2]]) put(x, y, BONE[k]);
  } else if (helm === "bandana") {
    for (let x = 0; x < 9; x++) put(x, 2, x % 3 === 1 ? sh(P.trim, 0.25) : P.trim);
    put(-1, 3, P.trim), put(-1, 4, sh(P.trim, -0.25)), put(0, 4, sh(P.trim, -0.15));
  } else if (helm === "crown") {
    for (let x = 1; x < 8; x++) put(x, 1, x % 2 ? GOLD[0] : GOLD[1]);
    for (const x of [1, 4, 7]) put(x, 0, GOLD[0]);
    put(4, 1, 0xd04040);
  }
}

// 갑옷·인물 모양 → 그릴 색 묶음 (부위마다 밝기를 나눈다)
function paint(L, id) {
  const metalBody = id === "steel" || id === "chain" || id === "guardian";
  const tunic = mute(L.body, metalBody ? 0.12 : 0.32);
  const cape = sh(mute(L.cape ?? mix(L.body, 0x4a3a2a, 0.55), 0.4), -0.25);
  const fur = L.shoulder === "fur" ? 0x6a4a30 : L.fur ?? 0x948468;
  return {
    tunic,
    sleeve: metalBody ? mute(L.dark ?? 0x4a4038, 0.2) : sh(tunic, -0.08),
    pants: mix(mute(sh(L.dark ?? 0x3a3428, -0.1), 0.3), 0x3c4450, 0.35),
    wrap: 0xa89474,
    trim: mute(L.trim ?? 0x8a6a40, 0.25),
    hood: mute(L.body, 0.32),
    cape,
    furPal: R5(fur),
    hair: HAIRS[L.hair ?? "brown"],
    beard: L.beard ?? 1,
    braid: L.braid ?? !0,
  };
}

function frame(b, A, L, id) {
  const P = paint(L, id);
  if (A.lying) {
    const y = 27;
    b.rect(6, y - 1, 14, 3, P.cape);
    b.rect(10, y - 4, 10, 5, P.tunic);
    b.rect(10, y, 10, 1, LEATHER[1]);
    b.rect(20, y - 3, 5, 4, P.pants);
    b.rect(25, y - 2, 2, 3, LEATHER[2]);
    b.ellipse(7, y - 2, 3.2, 3, SKIN);
    b.poly([[3, y - 5], [9, y - 6], [8, y - 2], [3, y]], P.hair[1]);
    P.beard && b.rect(7, y, 4, 2, P.hair[1]);
    if (A.lying === 2) for (let i = 0; i < b.buf.length; i++) {
      const r = b.buf[i];
      if (r >>> 24) {
        const k = 0.72;
        b.buf[i] = ((255 << 24) | (Math.round(((r >> 16) & 255) * k) << 16) | (Math.round(((r >> 8) & 255) * k) << 8) | Math.round((r & 255) * k)) >>> 0;
      }
    }
    return;
  }
  const dy = A.dy, sq = A.squash ?? 0, tx = 12 + A.lean, hipY = 23 + dy, ty = 15 + dy + sq;
  cloak(b, tx + 1, ty, A.cape ?? 0, P);
  arm(b, tx + 1, 16 + dy, A.barm, P, !0);
  leg(b, tx + 2, hipY, 13 + A.bl[0], 31 - A.bl[1], P, !0);
  torso(b, tx, ty, 9 - sq, P, L, id);
  leg(b, tx + 6, hipY, 17 + A.fl[0], 31 - A.fl[1], P, !1);
  skirt(b, tx, hipY, P, L, id);
  mantle(b, tx, ty - 1, P, L);
  head(b, tx - 1, 4 + dy + sq, P, L, id);
  arm(b, tx + 7, 16 + dy, A.arm, P, !1);
}

// 선택 외곽선: 테두리 픽셀을 맞닿은 안쪽 색의 짙은 버전으로
function selOut(b) {
  const W = b.w, H = b.h, src = b.buf.slice(), col = (v) => ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (src[y * W + x] >>> 24) continue;
    let best = -1, lum = 1e9;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const v = src[Y * W + X];
      if ((v >>> 24) < 100) continue;
      const c = col(v), l = ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
      l < lum && ((lum = l), (best = c));
    }
    best >= 0 && b.px(x, y, mix(sh(best, -0.62), OUT, 0.45));
  }
}

export function makePlayer(scene, ht, Et, As, le) {
  for (const A of le) {
    const L = { hair: "brown", beard: 1, ...A.look };
    const frames = [];
    for (let i = 0; i < As.length; i++) {
      const b = new ht(32, 32);
      frame(b, As[i], L, A.id);
      selOut(b);
      b.rimLight(0xffe8c8, 0.2);
      frames.push(b);
    }
    Et(scene, `player_${A.id}`, frames, 32, 32);
  }
}

export function makeNpc(scene, ht, Et, As, key, look) {
  const L = { dark: 0x3a3428, ...look };
  const frames = [];
  for (let i = 0; i < 4; i++) {
    const b = new ht(32, 32);
    frame(b, As[i], L, "npc");
    selOut(b);
    b.rimLight(0xffe8c8, 0.18);
    frames.push(b);
  }
  Et(scene, key, frames, 32, 32);
}
