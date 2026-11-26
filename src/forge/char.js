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
  b.rect(fx - 1, fy - 2, 4, 3, boot);
  b.rect(fx + 2, fy - 1, 1, 2, boot);
  b.rect(fx - 1, fy - 2, 4, 1, sh(boot, 0.3));
}
// 팔: 소매 + 가죽 팔 보호대 + 손
function arm(b, sx, sy, pose, P, back) {
  const [dx, dy] = HAND[pose] ?? HAND.down, hx = sx + dx, hy = sy + dy, mx = (sx + hx) / 2, my = (sy + hy) / 2, k = back ? -0.3 : 0;
  b.thickLine(sx, sy, mx, my, 3, sh(P.sleeve, k));
  b.thickLine(mx, my, hx, hy, 2.5, sh(P.bracer, k));
  b.line(mx, my, mx + (hx - mx) * 0.25, my + (hy - my) * 0.25, sh(P.bracer, k + 0.3));
  b.rect(hx - 1, hy - 1, 2, 2, back ? SKIN_M : SKIN);
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
// 머리: 뒷머리와 땋은 머리 · 얼굴(코 · 눈썹 그늘) · 수염 · 투구/두건
function head(b, cx, cy, P, L, id) {
  const H = P.hair, hood = L.helm === "hood";
  if (hood) {
    b.ellipse(cx - 0.5, cy + 0.2, 4.6, 4.8, sh(P.hood, -0.15));
    b.poly([[cx - 5, cy], [cx - 6, cy + 6], [cx - 1, cy + 5]], sh(P.hood, -0.3));
  } else {
    b.ellipse(cx - 1.4, cy - 0.4, 3.6, 3.9, H[1]);
    P.braid && b.thickLine(cx - 3.5, cy + 1, cx - 4.5, cy + 6, 1.6, H[2]), P.braid && b.px(cx - 4.5, cy + 6, LEATHER[1]);
  }
  // 얼굴
  b.ellipse(cx + 1, cy + 0.6, 3.2, 3.6, SKIN);
  b.rect(cx + 2, cy - 1, 2, 4, SKIN);
  b.px(cx + 4, cy, SKIN), b.px(cx + 4, cy + 1, SKIN_M);
  b.px(cx - 1, cy + 1, SKIN_M), b.px(cx, cy + 2, SKIN_M), b.px(cx - 1, cy, SKIN_D);
  // 눈썹 · 눈 · 볼
  b.px(cx + 2, cy - 1, SKIN_M), b.px(cx + 3, cy - 1, SKIN_M);
  b.px(cx + 2, cy, EYE);
  b.px(cx + 3, cy + 1, sh(SKIN, 0.12));
  // 수염 (P.beard: 0 없음 · 1 짧음 · 2 김)
  if (P.beard) {
    const d = P.beard > 1 ? 3 : 1;
    b.poly([[cx - 1, cy + 1.5], [cx + 1, cy + 2], [cx + 4.5, cy + 2], [cx + 4, cy + 3.5], [cx + 2.5, cy + 4 + d], [cx + 0.5, cy + 3 + d], [cx - 1, cy + 2.5]], H[0]);
    b.px(cx + 3, cy + 2, H[2]), b.px(cx + 4, cy + 2, H[1]);
    b.px(cx, cy + 3, H[1]), b.px(cx + 1, cy + 3 + d, H[1]);
    d > 1 && (b.px(cx + 2, cy + 5, H[1]), b.px(cx + 2, cy + 6, H[1]));
  }
  // 앞머리 / 머리 위
  if (!hood) b.poly([[cx - 4, cy - 1], [cx - 3, cy - 4], [cx, cy - 4.6], [cx + 3, cy - 4], [cx + 4, cy - 2], [cx + 2, cy - 2.6], [cx - 1, cy - 2]], H[0]), b.line(cx - 2, cy - 4, cx + 1, cy - 4, sh(H[0], 0.25));
  const helm = L.helm;
  if (hood) {
    b.poly([[cx - 4.5, cy + 1], [cx - 4, cy - 4], [cx, cy - 5.5], [cx + 3.5, cy - 4.5], [cx + 4.5, cy - 2.5], [cx + 2, cy - 2.2], [cx - 0.5, cy - 1.5], [cx - 1.5, cy + 2]], P.hood);
    b.line(cx - 1, cy - 5, cx + 3, cy - 4, sh(P.hood, 0.28));
  } else if (helm === "helm" || helm === "helmet" || helm === "cap" || helm === "horned" || helm === "horns" || id === "steel" || id === "guardian") {
    // 노르드 투구: 둥근 철 돔 + 테 + 코 가리개
    b.ellipse(cx + 0.3, cy - 2.2, 4.2, 3, IRON[1]);
    b.line(cx - 2, cy - 4, cx + 2, cy - 4.5, IRON[0]);
    b.rect(cx - 4, cy - 2, 9, 1, IRON[2]);
    b.rect(cx + 3, cy - 2, 1, 3, IRON[2]);
    b.px(cx - 3, cy - 3, IRON[3]);
    if (helm === "horned" || helm === "horns") {
      b.line(cx - 3, cy - 4, cx - 5, cy - 6, 0xe8dcc0), b.px(cx - 5, cy - 7, 0xc8bca0), b.px(cx - 4, cy - 4, 0xd8ccb0);
      b.line(cx + 3, cy - 4, cx + 4, cy - 6, 0xd8ccb0), b.px(cx + 4, cy - 7, 0xb8ac90);
    }
    if (id === "guardian") b.rect(cx - 4, cy - 2, 9, 1, GOLD[1]), b.px(cx, cy - 5, GOLD[0]);
  } else if (helm === "bandana") {
    b.rect(cx - 3, cy - 3, 7, 1, P.trim);
    b.poly([[cx - 4, cy - 3], [cx - 6, cy - 1], [cx - 5, cy]], sh(P.trim, -0.2));
  } else if (helm === "crown") {
    b.rect(cx - 3, cy - 4, 7, 1, GOLD[1]);
    for (const dx of [-2, 0.5, 3]) b.px(cx + dx, cy - 5, GOLD[0]);
  }
  if (id === "abyss" || L.eyeGlow) b.px(cx + 2, cy, L.glow ?? 0xb070ff);
}
// 몸통: 양모 튜닉(앞이 밝다) + 목 트임 + 가죽 띠와 쇠 고리 + 갑옷별 무늬
function torso(b, x, y, h, P, L, id) {
  const c = P.tunic;
  b.rect(x, y, 9, h, c);
  b.rect(x, y, 2, h, sh(c, -0.25));
  b.rect(x + 6, y, 3, h, sh(c, 0.12));
  b.rect(x + 1, y, 7, 1, sh(c, 0.22));
  b.px(x + 6, y + 1, sh(c, -0.35)), b.px(x + 7, y + 2, sh(c, -0.35));
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
  head(b, tx + 4, 10 + dy + sq, P, L, id);
  arm(b, tx + 7, 16 + dy, A.arm, P, !1);
}

export function makePlayer(scene, ht, Et, As, le) {
  for (const A of le) {
    const L = { hair: "brown", beard: 1, ...A.look };
    const frames = [];
    for (let i = 0; i < As.length; i++) {
      const b = new ht(32, 32);
      frame(b, As[i], L, A.id);
      b.outline(OUT);
      b.rimLight(0xfff0d0, 0.2);
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
    b.outline(OUT);
    b.rimLight(0xfff0d0, 0.18);
    frames.push(b);
  }
  Et(scene, key, frames, 32, 32);
}
