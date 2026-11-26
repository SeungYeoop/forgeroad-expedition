// 캐릭터 그림 (레퍼런스 ref08 화풍: 바이킹 전사) — 32x32 프레임 24장
//   원본 포즈 데이터(As)와 손 위치(HAND)는 그대로 → 무기 위치가 맞는다. 그림만 새로 그린다.
//   · 사실적인 비율(작은 머리 · 긴 몸), 수염과 땋은 머리, 양모 튜닉 + 가죽 띠 + 다리 감개 + 가죽 신
//   · 목도리 대신 모피 깃 달린 양모 망토, 옷 색은 흙빛으로 눌러 쓴다(레퍼런스 팔레트)
//   · 테두리는 검정이 아닌 짙은 갈색, 빛은 앞 위에서
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
// 원색을 흙빛 쪽으로 누른다
const mute = (c, k = 0.3) => mix(c, 0x6e5e48, k);
const SKIN = 0xe2b690, SKIN_M = 0xc48c68, SKIN_D = 0x8e5c44, EYE = 0x1a1210, OUT = 0x1c120c;
export const HAIRS = {
  brown: [0x7a5030, 0x553620, 0x342014],
  blond: [0xdcb474, 0xac844a, 0x705028],
  red: [0xb8662e, 0x8a461e, 0x542812],
  grey: [0xc4bcac, 0x948c80, 0x5e5850],
  black: [0x4a3c34, 0x2e2420, 0x1a1412],
};
const LEATHER = [0x9a6c44, 0x74502e, 0x50361e], IRON = [0xb4b0a8, 0x86827a, 0x5a5650, 0x3a3834], GOLD = [0xf0d070, 0xc89a3a, 0x8a6420];
const HAND = {
  down: [1, 7], low: [3, 6], fwd: [6, 2], back: [-4, 5], up: [2, -6], reach: [7, -1], cast: [7, -3],
};

// 다리: 바지 허벅지 + 감개 감은 정강이(사선 줄) + 가죽 신
function leg(b, hx, hy, fx, fy, P, back) {
  const k = back ? -0.28 : 0, pants = sh(P.pants, k), wrap = sh(P.wrap, k), boot = sh(LEATHER[2], k);
  const kx = (hx + fx) / 2 + 0.5, ky = (hy + fy - 2) / 2;
  b.thickLine(hx, hy, kx, ky, 3.4, pants);
  b.line(hx + 1, hy, kx + 1, ky, sh(pants, 0.18));
  b.thickLine(kx, ky, fx, fy - 2, 3, wrap);
  for (let t = 0.2; t < 0.95; t += 0.33) { const x = kx + (fx - kx) * t, y = ky + (fy - 2 - ky) * t; b.line(x - 1, y + 1, x + 1, y, sh(wrap, -0.35)); }
  b.rect(fx - 1, fy - 3, 4, 4, boot);
  b.rect(fx + 3, fy - 1, 1, 2, boot);
  b.rect(fx - 1, fy - 3, 4, 1, sh(boot, 0.35));
  b.px(fx + 2, fy - 2, sh(boot, 0.2));
  b.rect(fx - 1, fy, 5, 1, sh(boot, -0.35));
}
// 팔: 소매 + 가죽 팔 보호대 + 손
function arm(b, sx, sy, pose, P, back) {
  const [dx, dy] = HAND[pose] ?? HAND.down, hx = sx + dx, hy = sy + dy, mx = (sx + hx) / 2, my = (sy + hy) / 2, k = back ? -0.3 : 0;
  b.thickLine(sx, sy, mx, my, 3, sh(P.sleeve, k));
  b.thickLine(mx, my, hx, hy, 2.5, sh(P.bracer, k));
  b.line(mx, my, mx + (hx - mx) * 0.25, my + (hy - my) * 0.25, sh(P.bracer, k + 0.3));
  b.rect(hx - 1, hy - 1, 3, 2, back ? SKIN_M : SKIN);
  b.px(hx - 1, hy + 1, back ? SKIN_D : SKIN_M), b.px(hx, hy + 1, back ? SKIN_D : SKIN_M);
  !back && b.px(hx, hy - 1, sh(SKIN, 0.2));
}
// 망토: 어깨에서 뒤로 흘러내리는 양모 망토(주름 · 해진 끝단)
function cloak(b, x, y, wave, col) {
  const L = 11 + (5 - Math.min(5, wave)) * 0.6, sw = 1 + wave * 1.15, outer = [], inner = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    outer.push([x - 1 - u * (2 + sw) + Math.sin(u * 4 + wave) * 0.6, y + u * L]);
    inner.push([x + 4 - u * sw * 0.5, y + u * L * 0.92]);
  }
  b.poly([...outer, ...inner.reverse()], sh(col, -0.08));
  for (let k = 0; k < 3; k++) b.line(x + 2 - k * 1.5, y + 2, x - k * 1.4 - sw * 0.8, y + L - 1, sh(col, k % 2 ? -0.35 : 0.15));
  const e = outer[outer.length - 1];
  for (let i = 0; i < 4; i++) b.px(e[0] + i * 1.3, e[1] + (i % 2), sh(col, -0.4));
}
// 머리 (12×12 픽셀 설계, 약간 귀엽게): 둥근 머리 · 앞머리 · 두 눈 · 볼 홍조 · 복슬 수염 · 투구/두건/띠/왕관
//   (ox, oy) = 머리 칸의 왼쪽 위. 얼굴은 오른쪽(앞)을 본다
const T3 = (p, v) => p[v > 0.3 ? 0 : v > -0.3 ? 1 : 2];
const BLUSH = 0xe8907a, BONE = [0xf0e6cc, 0xd0c4a4, 0x9a8e74];
function head(b, ox, oy, P, L, id) {
  const H = P.hair, helm = L.helm, hood = helm === "hood";
  const metal = helm === "helm" || helm === "helmet" || helm === "cap" || helm === "horned" || helm === "horns" || id === "steel" || id === "guardian";
  const put = (x, y, c) => b.px(ox + x, oy + y, c);
  const cap = (x, y) => ((x - 5.5) / 5.6) ** 2 + ((y - 5.6) / 5.4) ** 2 <= 1;
  const face = (x, y) => y >= 5 && ((x - 7.2) / 3.5) ** 2 + ((y - 7.5) / 3.4) ** 2 <= 1;
  const HP = hood ? [sh(P.hood, 0.22), P.hood, sh(P.hood, -0.32)] : H;
  // 1) 뒤로 늘어진 것: 두건 자락 / 땋은 머리
  if (hood) for (let y = 8; y < 15; y++) for (let x = 0; x < 4.5 - (y - 8) * 0.45; x++) put(x, y, T3(HP, -0.2 - x * 0.1 - (y - 8) * 0.08));
  else if (P.braid) { for (let k = 0; k < 5; k++) put(k > 2 ? 0 : 1, 9 + k, k % 2 ? H[2] : H[0]), put(k > 2 ? 1 : 2, 9 + k, H[1]); put(0, 14, LEATHER[1]), put(1, 14, LEATHER[0]); }
  // 2) 머리 덩어리 (빛: 왼쪽 위, 결: 사선)
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    if (!cap(x, y) || face(x, y)) continue;
    put(x, y, T3(HP, -((x - 5.5) / 5.6) * 0.35 - ((y - 5.6) / 5.4) * 0.8 + (!hood && (x * 2 + y) % 5 === 0 ? -0.4 : 0) + (y <= 1 && x >= 4 && x <= 7 ? 0.3 : 0)));
  }
  // 3) 얼굴 (위·앞이 밝고 귀 쪽·턱이 어둡다)
  for (let y = 5; y < 12; y++) for (let x = 3; x < 12; x++) {
    if (!face(x, y)) continue;
    const v = -((x - 8.5) / 3.5) * 0.25 - ((y - 6.5) / 3.4) * 0.55;
    put(x, y, x <= 4 ? SKIN_D : v > 0.35 ? sh(SKIN, 0.1) : v > -0.45 ? SKIN : SKIN_M);
  }
  put(11, 8, SKIN), put(11, 9, SKIN_M);
  // 4) 앞머리 (두건 · 투구가 아니면)
  if (!hood && !metal) { put(5, 5, H[1]), put(6, 5, H[0]), put(9, 5, H[1]), put(5, 6, H[2]); }
  if (hood) { put(5, 5, H[1]), put(6, 5, H[0]); }
  // 귀
  !hood && (put(4, 7, SKIN), put(4, 8, SKIN_M));
  // 5) 눈 (1×2, 귀엽게 크게) · 홍조 · 코 · 입
  const eye = id === "abyss" || L.eyeGlow ? L.glow ?? 0xb070ff : EYE;
  put(6, 7, eye), put(6, 8, eye), put(7, 8, eye), put(7, 7, eye === EYE ? 0xfaf6ee : sh(eye, 0.5)), put(9, 7, eye), put(9, 8, eye);
  put(6, 6, sh(SKIN_M, -0.1)), put(7, 6, SKIN_M), put(9, 6, sh(SKIN_M, -0.1));
  put(5, 9, mix(SKIN, BLUSH, 0.6)), put(10, 9, mix(SKIN, BLUSH, 0.5));
  !P.beard && put(8, 10, 0x9a5a48);
  // 6) 수염: 콧수염 + 복슬한 턱수염 (1 짧음 · 2 길게 가슴까지)
  if (P.beard) {
    const long = P.beard > 1, ry = long ? 4 : 2.3, cy = long ? 10.6 : 10.3;
    for (let y = 9; y < 16; y++) for (let x = 3; x < 12; x++) {
      const t = ((x - 7.6) / 3.9) ** 2 + ((y - cy) / ry) ** 2;
      if (t > 1 || (y === 9 && (x < 6 || x > 10))) continue;
      put(x, y, T3(H, 0.35 - ((y - 9) / (ry * 1.6)) - ((x - 7.6) / 3.9) * 0.2 + ((x + y * 2) % 4 === 0 ? -0.45 : 0)));
    }
    put(7, 9, H[0]), put(8, 9, H[1]), put(9, 9, H[0]), put(10, 9, H[1]);
  }
  // 7) 머리 장비
  if (metal) {
    const IP = [0xd0ccc4, 0x928e86, 0x5c5852];
    for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) {
      if (!cap(x, y)) continue;
      put(x, y, y === 5 ? (x % 3 === 1 ? IP[0] : IP[2]) : T3(IP, -((x - 5.5) / 5.6) * 0.4 - ((y - 3) / 3) * 0.7 + (x === 6 ? 0.5 : x === 7 ? -0.5 : 0)));
    }
    put(8, 6, IP[1]), put(8, 7, IP[2]);
    id === "guardian" && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((x) => put(x, 5, x % 3 ? GOLD[1] : GOLD[0]));
    if (helm === "horned" || helm === "horns") for (const [x, y, k] of [[1, 3, 1], [0, 2, 0], [0, 1, 0], [1, 0, 1], [10, 3, 1], [11, 2, 0], [11, 1, 1], [10, 0, 2]]) put(x, y, BONE[k]);
  } else if (helm === "bandana") {
    for (let x = 1; x < 11; x++) put(x, 4, x % 4 === 2 ? sh(P.trim, 0.25) : P.trim);
    put(0, 5, P.trim), put(0, 6, sh(P.trim, -0.25)), put(1, 6, sh(P.trim, -0.15));
  } else if (helm === "crown") {
    for (let x = 2; x < 10; x++) put(x, 3, x % 3 === 0 ? GOLD[0] : GOLD[1]);
    for (const x of [3, 6, 9]) put(x, 2, GOLD[0]);
    put(6, 3, 0xd04040);
  }
}
// 몸통: 양모 튜닉(앞이 밝다) + 목 트임 + 가죽 띠와 쇠 고리 + 갑옷별 무늬
function torso(b, x, y, h, P, L, id) {
  const c = P.tunic;
  const tone = [-0.34, -0.18, -0.06, 0, 0, 0.06, 0.12, 0.18, 0.1];
  for (let xx = 0; xx < 9; xx++) b.rect(x + xx, y, 1, h, sh(c, tone[xx]));
  b.rect(x + 1, y, 7, 1, sh(c, 0.26));
  b.px(x + 3, y + 3, sh(c, -0.2)), b.px(x + 3, y + 4, sh(c, -0.2)), b.px(x + 6, y + 4, sh(c, -0.12));
  b.px(x + 5, y + 1, sh(c, -0.35)), b.px(x + 6, y + 2, sh(c, -0.3)), b.px(x + 7, y + 1, sh(c, -0.35));
  switch (id) {
    case "chain":
      for (let yy = 1; yy < h - 2; yy++) for (let xx = yy % 2; xx < 9; xx += 2) b.px(x + xx, y + yy, sh(c, xx > 5 ? 0.25 : -0.12));
      break;
    case "steel":
    case "guardian":
      for (let yy = 1; yy < h - 2; yy += 2) { b.rect(x, y + yy, 9, 1, sh(c, -0.3)); for (let xx = (yy >> 1) % 2; xx < 9; xx += 2) b.px(x + xx, y + yy + 1, sh(c, xx > 5 ? 0.3 : 0.05)); }
      id === "guardian" && (b.rect(x, y, 9, 1, GOLD[1]), b.rect(x + 4, y + 1, 1, h - 3, GOLD[2]));
      break;
    case "leather":
      b.line(x + 6, y + 1, x + 6, y + h - 3, sh(c, -0.4));
      for (let yy = 2; yy < h - 3; yy += 2) b.px(x + 7, y + yy, 0xd8b884);
      break;
    case "mage":
      b.rect(x + 4, y, 1, h, P.trim);
      b.circle(x + 4.5, y + 3, 1.1, L.glow ?? 0x90c0ff);
      break;
    case "thorns":
      for (const [dx, dy] of [[1, 0], [8, 0], [0, 3]]) b.poly([[x + dx, y + dy], [x + dx - 2, y + dy - 2], [x + dx + 1, y + dy - 1]], 0xd8c8a0);
      break;
    case "vampire":
      b.poly([[x - 1, y - 3], [x + 3, y + 2], [x + 3, y - 1]], sh(c, -0.35));
      b.poly([[x + 10, y - 3], [x + 6, y + 2], [x + 6, y - 1]], sh(c, -0.35));
      break;
    case "berserker":
      b.rect(x + 3, y + 1, 5, 4, SKIN_M), b.rect(x + 5, y + 1, 3, 3, SKIN);
      b.line(x + 4, y + 2, x + 7, y + 4, 0x6a3020);
      break;
    case "abyss":
      b.rect(x + 3, y + 2, 3, 3, L.glow ?? 0xb070ff);
      b.px(x + 4, y + 3, 0xffffff);
      break;
  }
  // 가죽 띠 + 쇠 고리
  b.rect(x, y + h - 3, 9, 2, LEATHER[1]);
  b.rect(x, y + h - 3, 9, 1, LEATHER[0]);
  b.px(x + 6, y + h - 3, IRON[0]), b.px(x + 6, y + h - 2, IRON[2]);
  b.px(x + 2, y + h - 1, LEATHER[2]), b.px(x + 2, y + h, LEATHER[1]);
}
// 튜닉 자락 (앞다리 위를 덮는다): 무릎 위까지, 끝단 장식 띠
function hem(b, x, y, P, L, id) {
  const c = P.tunic, long = L.skirt || id === "mage";
  const d = long ? 7 : 4;
  b.poly([[x - 0.5, y], [x + 9.5, y], [x + 10.5, y + d], [x - 1.5, y + d]], sh(c, -0.08));
  b.line(x + 7, y, x + 9, y + d, sh(c, 0.15));
  b.line(x + 3, y + 1, x + 2, y + d, sh(c, -0.3));
  b.line(x - 1.5, y + d, x + 10.5, y + d, P.trim);
  id === "chain" && b.line(x - 1, y + d - 1, x + 10, y + d - 1, IRON[1]);
}
// 모피 깃 / 어깨 장식
function mantle(b, x, y, P, L) {
  const s = L.shoulder;
  if (s === "plate" || s === "pad") {
    const c = s === "plate" ? IRON[1] : LEATHER[1];
    b.ellipse(x + 7, y + 1.5, 2.8, 2.1, c);
    b.line(x + 5, y, x + 9, y, sh(c, 0.4));
  }
  const big = s === "fur" ? 1.25 : 1, f = P.fur;
  b.ellipse(x + 4, y + 0.6, 4.8 * big, 1.6 * big, f);
  for (let i = -5; i <= 5; i++) b.px(x + 4 + i, y - 0.5 + ((i + 20) % 3 === 0 ? -1 : 0) * big, sh(f, 0.28));
  for (let i = -4; i <= 4; i += 2) b.px(x + 4 + i, y + 1.6 * big, sh(f, -0.35));
  s === "spike" && [0, 8].forEach((dx) => b.poly([[x + dx, y], [x + dx - 1, y - 3], [x + dx + 1.5, y - 1]], 0xd8c8a0));
  s === "wing" && b.poly([[x - 1, y], [x - 4, y - 4], [x + 2, y - 1]], sh(L.cape ?? 0x5a1a2a, -0.2));
  s === "orb" && b.circle(x + 8, y - 1, 1.2, L.glow ?? 0x90c0ff);
}

// 갑옷·인물 모양 → 그릴 색 묶음
function paint(L, id) {
  const tunic = mute(L.body, id === "steel" || id === "chain" || id === "guardian" ? 0.12 : 0.3);
  return {
    tunic,
    sleeve: id === "steel" || id === "chain" || id === "guardian" ? mute(L.dark ?? 0x4a4038, 0.2) : sh(tunic, -0.06),
    bracer: LEATHER[1],
    pants: mute(sh(L.dark ?? 0x3a3428, -0.1), 0.3),
    wrap: mix(mute(L.trim ?? 0x8a7a5a, 0.4), 0xb8a888, 0.35),
    trim: mute(L.trim ?? 0x8a6a40, 0.25),
    hood: mute(L.body, 0.32),
    cape: mute(L.cape ?? mix(L.body, 0x5a4a38, 0.6), 0.35),
    fur: L.shoulder === "fur" ? 0x6a4a30 : L.fur ?? 0x9a8a70,
    hair: HAIRS[L.hair ?? "brown"],
    beard: L.beard ?? 1,
    braid: L.braid ?? !0,
  };
}

function frame(b, A, L, id) {
  const P = paint(L, id);
  if (A.lying) {
    const y = 27;
    b.rect(8, y, 12, 2, P.cape);
    b.rect(10, y - 4, 10, 5, P.tunic);
    b.rect(10, y, 10, 1, LEATHER[1]);
    b.rect(20, y - 3, 5, 4, P.pants);
    b.rect(25, y - 2, 2, 3, LEATHER[2]);
    b.ellipse(7, y - 2, 3.4, 3.2, SKIN);
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
  const dy = A.dy, sq = A.squash ?? 0, tx = 12 + A.lean, hipY = 23 + dy;
  // 뒤: 망토 · 뒷팔 · 뒷다리
  cloak(b, tx + 2, 14 + dy, A.cape ?? 0, P.cape);
  arm(b, tx + 1, 16 + dy, A.barm, P, !0);
  leg(b, tx + 2, hipY, 13 + A.bl[0], 31 - A.bl[1], P, !0);
  // 몸 · 앞다리 · 자락
  torso(b, tx, 15 + dy + sq, 9 - sq, P, L, id);
  leg(b, tx + 6, hipY, 17 + A.fl[0], 31 - A.fl[1], P, !1);
  hem(b, tx, 22 + dy, P, L, id);
  // 모피 깃 → 머리 (수염이 깃 위로) → 앞팔
  mantle(b, tx, 15 + dy + sq, P, L);
  head(b, tx - 2, 3 + dy + sq, P, L, id);
  arm(b, tx + 7, 16 + dy, A.arm, P, !1);
}

// 선택 외곽선: 테두리 픽셀을 맞닿은 안쪽 색의 짙은 버전으로 (검은 선보다 부드럽고 정교하게)
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
      b.rimLight(0xfff0d0, 0.22);
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
    b.rimLight(0xfff0d0, 0.2);
    frames.push(b);
  }
  Et(scene, key, frames, 32, 32);
}
