// UI 전면 리메이크: 짙은 철판 + 얇은 금빛 테두리 + 모서리 장식. 하단 왼쪽 초상화 메달 HUD, 상단 명판.
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
const BLACK = 0x050308;
const GOLD = 0xd8aa58, GOLD_HI = 0xfff0b8, GOLD_LO = 0x6a4618;

// 판: 위→아래 그라데이션, 검은 외곽, 위·왼 밝은 빗면, 아래·오른 어두운 빗면, 금 장식 모서리
function frame(ht, w, h, o) {
  const b = new ht(w, h);
  const top = o.fill2 ?? sh(o.fill, 0.1), bot = o.fill;
  for (let y = 1; y < h - 1; y++) b.rect(1, y, w - 2, 1, mix(top, bot, y / h));
  b.rect(2, 0, w - 4, 1, BLACK);
  b.rect(2, h - 1, w - 4, 1, BLACK);
  b.rect(0, 2, 1, h - 4, BLACK);
  b.rect(w - 1, 2, 1, h - 4, BLACK);
  b.px(1, 1, BLACK); b.px(w - 2, 1, BLACK); b.px(1, h - 2, BLACK); b.px(w - 2, h - 2, BLACK);
  b.rect(2, 1, w - 4, 1, o.rimHi);
  b.rect(1, 2, 1, h - 4, o.rim);
  b.rect(2, h - 2, w - 4, 1, o.rimLo);
  b.rect(w - 2, 2, 1, h - 4, o.rimLo);
  if (o.thick) {
    b.rect(3, 2, w - 6, 1, sh(o.rim, -0.25));
    b.rect(2, 3, 1, h - 6, sh(o.rim, -0.35));
    b.rect(3, 3, w - 6, 1, o.inner);
    b.rect(3, h - 3, w - 6, 1, sh(bot, -0.4));
    b.rect(w - 3, 3, 1, h - 6, sh(bot, -0.3));
  } else b.rect(2, 2, w - 4, 1, o.inner);
  if (o.corner) for (const [x, y] of [[0, 0], [w - 5, 0], [0, h - 5], [w - 5, h - 5]]) {
    b.rect(x + 1, y + 1, 3, 3, o.corner);
    b.px(x + 1, y + 1, sh(o.corner, 0.6));
    b.px(x + 3, y + 3, sh(o.corner, -0.4));
  }
  return b;
}
function btn(ht, w, h, top, bot, rim, hi) {
  const b = new ht(w, h);
  for (let y = 1; y < h - 1; y++) b.rect(1, y, w - 2, 1, mix(top, bot, y / h));
  b.rect(2, 0, w - 4, 1, BLACK);
  b.rect(2, h - 1, w - 4, 1, BLACK);
  b.rect(0, 2, 1, h - 4, BLACK);
  b.rect(w - 1, 2, 1, h - 4, BLACK);
  b.px(1, 1, BLACK); b.px(w - 2, 1, BLACK); b.px(1, h - 2, BLACK); b.px(w - 2, h - 2, BLACK);
  b.rect(2, 1, w - 4, 1, hi);
  b.rect(2, 2, w - 4, 1, sh(top, 0.25));
  b.rect(1, 2, 1, h - 4, rim);
  b.rect(w - 2, 2, 1, h - 4, sh(rim, -0.45));
  b.rect(2, h - 2, w - 4, 1, sh(bot, -0.5));
  return b;
}
// 아이콘 칸: 바깥 테두리를 넓게, 안쪽 20x20 우물
function slotTex(ht, size, o) {
  const b = new ht(size, size), m = (size - 22) / 2;
  const r = 3;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const cx = Math.min(x, size - 1 - x), cy = Math.min(y, size - 1 - y);
      if (cx + cy < r - 1) continue;
      const edge = cx === 0 || cy === 0 || cx + cy === r - 1;
      let c;
      if (edge) c = BLACK;
      else if (cx === 1 || cy === 1 || cx + cy === r) c = y < size / 2 || x < size / 2 ? (y < x ? o.hi : o.rim) : o.lo;
      else if (cx < m + 1 || cy < m + 1) c = mix(o.plate, sh(o.plate, -0.35), y / size);
      else if (cx === m + 1 || cy === m + 1) c = BLACK;
      else c = mix(o.well, sh(o.well, 0.12), 1 - Math.hypot(x - size / 2, y - size / 2) / (size * 0.6));
      b.px(x, y, c);
    }
  for (const [x, y] of [[2, 2], [size - 4, 2], [2, size - 4], [size - 4, size - 4]]) (b.rect(x, y, 2, 2, o.gem), b.px(x, y, sh(o.gem, 0.6)));
  return b;
}

export function makeUiTextures(scene, ht, lt) {
  const IRON = 0x1c1824, IRON2 = 0x2a2534;
  lt(scene, "ui_panel", frame(ht, 24, 24, { fill: IRON, fill2: IRON2, rim: 0x8a7a68, rimHi: 0xc8b090, rimLo: 0x3a2e24, inner: 0x0a080e, thick: 1, corner: GOLD }));
  lt(scene, "ui_panel_gold", frame(ht, 24, 24, { fill: 0x18131e, fill2: 0x272030, rim: GOLD, rimHi: GOLD_HI, rimLo: GOLD_LO, inner: 0x0a080c, thick: 1, corner: 0xffe08a }));
  lt(scene, "ui_inner", frame(ht, 16, 16, { fill: 0x0e0c13, fill2: 0x16131d, rim: 0x3a3446, rimHi: 0x4a4258, rimLo: 0x221e2a, inner: 0x060508 }));
  lt(scene, "ui_inner_sel", frame(ht, 16, 16, { fill: 0x2a2030, fill2: 0x3a2c40, rim: 0xe8b860, rimHi: GOLD_HI, rimLo: 0x9a6a28, inner: 0x1a1220 }));
  lt(scene, "ui_btn", btn(ht, 16, 14, 0x3a3346, 0x221d2a, 0x6a5e7a, 0x9a8cb0));
  lt(scene, "ui_btn_hi", btn(ht, 16, 14, 0x5a4a66, 0x3a2e46, 0xd8a860, GOLD_HI));
  lt(scene, "ui_btn_off", btn(ht, 16, 14, 0x221e28, 0x18151d, 0x34303c, 0x3a3644));
  lt(scene, "ui_btn_green", btn(ht, 16, 14, 0x8a5420, 0x5a3412, 0xd89040, 0xffd090));
  lt(scene, "ui_btn_green_hi", btn(ht, 16, 14, 0xb06c28, 0x7c4618, 0xffd080, 0xfff4c8));
  lt(scene, "ui_slot", slotTex(ht, 28, { plate: 0x2a2434, well: 0x0c0a12, rim: 0x8a7a68, hi: 0xd8c098, lo: 0x3a2e24, gem: GOLD }));
  lt(scene, "ui_slot_sel", slotTex(ht, 28, { plate: 0x3a2c40, well: 0x1a1220, rim: GOLD, hi: GOLD_HI, lo: GOLD_LO, gem: 0xfff0a0 }));
  lt(scene, "ui_slot_big", slotTex(ht, 32, { plate: 0x2c2436, well: 0x0c0a12, rim: GOLD, hi: GOLD_HI, lo: GOLD_LO, gem: 0xff6050 }));
  // 막대 틀
  const bar = new ht(16, 10);
  bar.rect(2, 0, 12, 1, BLACK); bar.rect(2, 9, 12, 1, BLACK); bar.rect(0, 2, 1, 6, BLACK); bar.rect(15, 2, 1, 6, BLACK);
  bar.px(1, 1, BLACK); bar.px(14, 1, BLACK); bar.px(1, 8, BLACK); bar.px(14, 8, BLACK);
  bar.rect(1, 1, 14, 8, 0x08060c);
  bar.rect(2, 1, 12, 1, 0x6a5a48);
  bar.rect(2, 8, 12, 1, 0x2a2018);
  lt(scene, "ui_bar", bar);
  lt(scene, "ui_tooltip", frame(ht, 12, 12, { fill: 0x0f0c14, fill2: 0x1a1622, rim: 0x8a6a48, rimHi: 0xc8a070, rimLo: 0x4a3420, inner: 0x07060a }));
  const card = (k, c) => lt(scene, `ui_card_${k}`, frame(ht, 24, 24, { fill: 0x120f18, fill2: sh(c, -0.72), rim: c, rimHi: sh(c, 0.5), rimLo: sh(c, -0.5), inner: 0x07060a, thick: 1, corner: sh(c, 0.35) }));
  card("common", 0x8a8090);
  card("rare", 0x4a90e0);
  card("epic", 0xa060e0);
  card("legendary", 0xf0b030);
  // 초상화 메달: 방패꼴 철판 + 금테 + 아래 보석
  const S = 54, pf = new ht(S, S);
  const shield = (x, y) => {
    const u = (x - S / 2) / (S / 2), v = (y - 4) / (S - 8);
    return v >= 0 && v <= 1 && Math.abs(u) <= (v < 0.6 ? 0.92 : 0.92 * Math.sqrt(Math.max(0, (1 - v) / 0.4)));
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (!shield(x, y)) continue;
      const edge = !shield(x - 1, y) || !shield(x + 1, y) || !shield(x, y - 1) || !shield(x, y + 1);
      const e2 = !shield(x - 2, y) || !shield(x + 2, y) || !shield(x, y - 2) || !shield(x, y + 2);
      const e3 = !shield(x - 4, y) || !shield(x + 4, y) || !shield(x, y - 4) || !shield(x, y + 4);
      pf.px(x, y, edge ? BLACK : e2 ? (y < S / 2 ? GOLD_HI : GOLD) : e3 ? mix(0x3a3244, 0x1a1622, y / S) : mix(0x2a2236, 0x0e0b14, y / S));
    }
  pf.circle(S / 2, S - 9, 4, BLACK);
  pf.circle(S / 2, S - 9, 3, 0xc02a30);
  pf.px(S / 2 - 1, S - 11, 0xffb0a0);
  for (const x of [8, S - 9]) (pf.rect(x, 7, 2, 2, GOLD_HI), pf.px(x, 7, 0xffffff));
  lt(scene, "ui_portrait", pf);
  const base = new ht(16, 16);
  base.rect(0, 0, 16, 16, 0x0c0a10);
  base.rect(0, 0, 16, 1, GOLD_LO);
  lt(scene, "ui_hudbase", base);
  // ── 양피지 두루마리 세트 ──
  const parch = (w, h, base, edge, line, seed) => {
    const b = new ht(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const cx = Math.min(x, w - 1 - x), cy = Math.min(y, h - 1 - y), d = Math.min(cx, cy);
        if (d === 0) { b.px(x, y, BLACK); continue; }
        let c = mix(base, sh(base, -0.12), y / h);
        const n = ((x * 73856093) ^ (y * 19349663) ^ seed) >>> 0;
        n % 23 === 0 && (c = sh(c, -0.08));
        n % 41 === 0 && (c = sh(c, 0.07));
        if (d === 1) c = edge;
        else if (d === 2) c = sh(edge, 0.25);
        else if (d < 6) c = mix(sh(base, -0.3), c, (d - 2) / 4);
        else if (d === 7) c = mix(c, line, 0.6);
        b.px(x, y, c);
      }
    return b;
  };
  lt(scene, "ui_scroll", parch(32, 32, 0xead6aa, 0x6a4424, 0x9a7448, 7));
  lt(scene, "ui_parch_inner", parch(24, 24, 0xd8bf8e, 0x7a5430, 0xa88458, 11));
  lt(scene, "ui_parch_dark", parch(20, 20, 0xc6a87a, 0x6a4628, 0x8a6a44, 13));
  // 두루마리 축
  const rod = new ht(14, 32);
  for (let y = 0; y < 32; y++) {
    rod.px(0, y, BLACK); rod.px(13, y, BLACK);
    for (let x = 1; x < 13; x++) rod.px(x, y, mix(0x8a5a30, 0x3a2414, Math.abs(x - 4) / 9));
    rod.px(4, y, 0xc8905a);
  }
  lt(scene, "ui_rod", rod);
  const cap = new ht(18, 10);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 18; x++) {
    const e = x === 0 || x === 17 || y === 0 || y === 9;
    cap.px(x, y, e ? BLACK : mix(GOLD_HI, GOLD_LO, y / 9));
  }
  cap.rect(2, 2, 14, 1, 0xfff6d0);
  lt(scene, "ui_rodcap", cap);
  // 양피지 위 아이콘 칸
  lt(scene, "ui_pslot", slotTex(ht, 30, { plate: 0xb8946a, well: 0x3a2818, rim: 0x6a4424, hi: 0xe8cc98, lo: 0x4a2e18, gem: 0x8a5a2a }));
  lt(scene, "ui_pslot_sel", slotTex(ht, 30, { plate: 0xe0b860, well: 0x4a3018, rim: 0xb07818, hi: 0xfff0b0, lo: 0x6a4410, gem: 0xfff0a0 }));
  // 이름 리본
  const rib = new ht(32, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
    const tail = x < 6 ? Math.abs(y - 8) > (x * 8) / 6 : x > 25 ? Math.abs(y - 8) > ((31 - x) * 8) / 6 : !1;
    if (tail || y < 2 || y > 13) continue;
    const e = y === 2 || y === 13;
    rib.px(x, y, e ? BLACK : y < 6 ? 0x8a3a24 : 0x6a2a1a);
  }
  lt(scene, "ui_ribbon", rib);
  // 원형 메달 (HUD·상세 페이지)
  const md = (S, ring, inner) => {
    const b = new ht(S, S), c = S / 2 - 0.5;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > S / 2) continue;
      b.px(x, y, d > S / 2 - 1 ? BLACK : d > S / 2 - 3 ? (y < c ? GOLD_HI : GOLD) : d > S / 2 - 4 ? BLACK : d > S / 2 - 6 ? ring : mix(inner, sh(inner, -0.4), y / S));
    }
    return b;
  };
  lt(scene, "ui_medal", md(48, 0x3a3046, 0x241c30));
  lt(scene, "ui_medal_big", md(64, 0x4a3420, 0x2a1c14));
  // HUD용 어두운 판은 따로 보관
  lt(scene, "ui_hud_panel", frame(ht, 24, 24, { fill: IRON, fill2: IRON2, rim: 0x8a7a68, rimHi: 0xc8b090, rimLo: 0x3a2e24, inner: 0x0a080e, thick: 1, corner: GOLD }));
  lt(scene, "ui_hud_gold", frame(ht, 24, 24, { fill: 0x18131e, fill2: 0x272030, rim: GOLD, rimHi: GOLD_HI, rimLo: GOLD_LO, inner: 0x0a080c, thick: 1, corner: 0xffe08a }));
  // ── 모든 창·카드·버튼을 양피지 세트로 ──
  const pframe = (w, h, base, leather, trim, corner, seed = 3) => {
    const b = new ht(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const cx = Math.min(x, w - 1 - x), cy = Math.min(y, h - 1 - y), d = Math.min(cx, cy);
        if (cx + cy < 2) continue;
        let c;
        if (d === 0 || cx + cy === 2) c = BLACK;
        else if (d === 1) c = y < h / 2 ? sh(leather, 0.25) : leather;
        else if (d === 2) c = sh(leather, -0.25);
        else if (d === 3) c = trim;
        else if (d === 4) c = sh(leather, -0.45);
        else {
          c = mix(base, sh(base, -0.1), y / h);
          const n = ((x * 73856093) ^ (y * 19349663) ^ seed) >>> 0;
          n % 23 === 0 && (c = sh(c, -0.07));
          n % 37 === 0 && (c = sh(c, 0.06));
          d === 5 && (c = sh(c, -0.18));
        }
        b.px(x, y, c);
      }
    if (corner) for (const [x, y] of [[1, 1], [w - 6, 1], [1, h - 6], [w - 6, h - 6]]) {
      b.rect(x, y, 5, 5, BLACK);
      b.rect(x + 1, y + 1, 3, 3, corner);
      b.px(x + 1, y + 1, sh(corner, 0.6));
    }
    return b;
  };
  lt(scene, "ui_panel", pframe(24, 24, 0xe6cf9e, 0x5a3a1e, 0xa07a48, GOLD, 5));
  lt(scene, "ui_panel_gold", pframe(24, 24, 0xead4a4, 0x6a3a18, GOLD, 0xffe08a, 7));
  lt(scene, "ui_inner", pframe(16, 16, 0xd4b886, 0x7a5430, 0xb8956a, 0, 9));
  lt(scene, "ui_inner_sel", pframe(16, 16, 0xf0d898, 0x9a5a18, 0xffe090, 0, 11));
  lt(scene, "ui_tooltip", pframe(12, 12, 0xe6cf9e, 0x5a3a1e, 0xa07a48, 0, 13));
  const pcard = (k, c) => lt(scene, `ui_card_${k}`, pframe(24, 24, mix(0xe8d2a2, c, 0.12), sh(c, -0.45), c, sh(c, 0.3), 17));
  pcard("common", 0x8a7a68);
  pcard("rare", 0x3a7ad8);
  pcard("epic", 0x9a4ad8);
  pcard("legendary", 0xe0a020);
  // 가죽 버튼 (진한 잉크 글자가 잘 보이도록 밝은 가죽)
  lt(scene, "ui_btn", btn(ht, 16, 14, 0xd8bc8a, 0xb89462, 0x7a5430, 0xf4e2b8));
  lt(scene, "ui_btn_hi", btn(ht, 16, 14, 0xf0d49a, 0xd4ae6e, 0xa06a28, 0xfff4cc));
  lt(scene, "ui_btn_off", btn(ht, 16, 14, 0xa89a84, 0x8a7c68, 0x5a4e40, 0xbcae98));
  lt(scene, "ui_btn_green", btn(ht, 16, 14, 0xf0b060, 0xc8803a, 0x8a4a14, 0xffe0a0));
  lt(scene, "ui_btn_green_hi", btn(ht, 16, 14, 0xffc878, 0xe09a4a, 0xa85a18, 0xfff0c8));
  // 키 배지
  const kb = new ht(11, 11);
  kb.circle(5, 5, 5, BLACK);
  kb.circle(5, 5, 4, GOLD);
  kb.circle(5, 5, 3, 0x1a1420);
  lt(scene, "ui_keybadge", kb);
}

// HUD 재배치: 왼쪽 위 메달 + 스킬 줄 + 체력/마나/경험치, 오른쪽 위 재화, 아래쪽은 비운다
export function remakeHud(hud, R) {
  const W = R.ot;
  for (const o of hud.children.list.slice()) {
    if (o.type === "NineSlice" && Math.abs(o.x - 4) < 1 && Math.abs(o.y - 4) < 1) o.setVisible(!1);
    if (o.texture?.key === "icon_heart") o.setVisible(!1);
    if (o.type === "Text" && o.text === "우클릭: 특수") o.setVisible(!1);
    if (o.texture?.key === "icon_a_cloth" || (o.texture?.key === "ui_slot" && Math.abs(o.x - 70) < 1)) o.setVisible(!1);
  }
  hud.armorIcon?.setVisible(!1);
  // 뒷받침 그늘
  const shade = hud.add.graphics().setDepth(-2);
  for (let i = 0; i < 26; i++) shade.fillStyle(0x07050c, 0.55 * (1 - i / 26)).fillRect(0, 69 - i * 3, 230 - i * 2, 3);
  // 메달 + 얼굴
  hud.frPortraitBg = hud.add.image(27, 28, "ui_medal").setDepth(2);
  hud.frFace = hud.add.sprite(27, 60, "player_cloth", 0).setOrigin(0.5, 1).setScale(1.8).setDepth(3);
  const mask = hud.make.graphics({ add: !1 }).fillCircle(27, 28, 18);
  hud.frFace.setMask(mask.createGeometryMask());
  hud.frPortraitRing = hud.add.image(27, 28, "ui_medal").setDepth(4).setAlpha(0);
  hud.frLvBadge = hud.add.nineslice(9, 49, "ui_hud_gold", void 0, 36, 13, 6, 6, 6, 6).setOrigin(0).setDepth(5);
  hud.lvText?.setPosition(27, 50).setOrigin(0.5, 0).setDepth(8);
  // 스킬 줄: Q E R + 무기
  const place = (g, cx, cy) => {
    if (!g?.bg) return;
    const bx = g.bg.x, by = g.bg.y;
    for (const k of Object.keys(g)) {
      const o = g[k];
      o && o.x !== void 0 && o.setPosition && o.setPosition(cx + (o.x - bx), cy + (o.y - by));
    }
  };
  hud.frKeyBadges = [];
  for (let i = 0; i < 3; i++) {
    const s = hud.sSlots[i];
    if (!s) continue;
    const cx = 69 + i * 30, cy = 18;
    place(s, cx, cy);
    hud.frFrames?.[i]?.setPosition(cx, cy).setSize(20, 20);
    hud.frKindTags?.[i]?.setVisible(!1);
    s.key?.setPosition(cx - 12, cy - 15).setDepth(9);
    hud.frKeyBadges.push(hud.add.image(cx - 10, cy - 11, "ui_keybadge").setDepth(8));
  }
  const w0 = hud.wSlots[0];
  if (w0) {
    place(w0, 166, 19);
    w0.bg.setTexture("ui_slot_big");
    w0.key?.setVisible(!1);
  }
  // 체력·마나·경험치
  hud.add.nineslice(48, 34, "ui_hud_panel", void 0, 156, 30, 6, 6, 6, 6).setOrigin(0).setDepth(-1);
  const hp = hud.hpBar;
  if (hp) {
    hp.bg.setPosition(52, 37).setSize(148, 12).setDepth(4);
    hp.lag.setPosition(54, 39).setSize(144, 8).setDepth(5);
    hp.fill.setPosition(54, 39).setSize(144, 8).setDepth(6);
    hp.w = 148;
    hp.fill.setFillStyle(0xc8323e);
  }
  hud.frHpShine = hud.add.rectangle(54, 39, 144, 2, 0xffffff, 0.28).setOrigin(0).setDepth(7);
  hud.frHpShade = hud.add.rectangle(54, 45, 144, 2, 0x000000, 0.3).setOrigin(0).setDepth(7);
  const ticks = hud.add.graphics().setDepth(7);
  for (let i = 1; i < 10; i++) ticks.fillStyle(0x000000, 0.35).fillRect(54 + (144 * i) / 10, 39, 1, 8);
  hud.hpText?.setPosition(126, 38).setOrigin(0.5, 0).setDepth(8);
  hud.frManaBg?.setPosition(52, 51).setSize(148, 6).setStrokeStyle(1, 0x050308).setDepth(4);
  hud.frMana?.setPosition(53, 52).setDepth(5).setFillStyle(0x4a8cff);
  hud.frManaMax = 146;
  hud.frManaText?.setPosition(206, 48).setDepth(8);
  hud.xpBg?.setPosition(52, 58).setSize(148, 3).setStrokeStyle(1, 0x050308).setDepth(4);
  hud.xpBar?.setPosition(53, 59).setDepth(5).setFillStyle(0x7ad0ff);
  hud.frXpMax = 146;
  hud.frBagText?.setPosition(8, -11).setDepth(8);
  // 덩어리 전체를 왼쪽 아래로
  const H = R.xt, dy = H - 72;
  for (const o of hud.children.list.slice())
    o !== hud.distText && o !== hud.goldText && o !== hud.goldIcon && o !== hud.killText && o.x < 236 && o.y < 72 && o.y > -20 && o.y !== void 0 && !((o.width ?? 0) > 200) && ![hud.bossName, hud.bossMark].includes(o) && (o.y += dy);
  mask.y += dy;
  // 위 가운데 맵 이름 패널과 오른쪽 위 돈 패널은 쓰지 않는다 (2026-11-28). 돈은 가방에서 본다
  hud.frTopHidden = [hud.distText, hud.bestText, hud.progBg, hud.progFill, hud.progBest, hud.progSkull, hud.progText, hud.goldText, hud.goldIcon, hud.killText];
  for (const o of hud.frTopHidden) o?.setVisible(!1);
}
export function updateHud(hud) {
  const sc = hud.run;
  const p = sc?.player;
  if (!p || !hud.frFace) return;
  const k = `player_${p.stats.armorId}`;
  hud.frFace.texture.key !== k && hud.frFace.setTexture(k, 0);
  const lowHp = p.hp / p.maxHp < 0.3;
  hud.frPortraitBg.setTint(lowHp && Math.sin(sc.time.now / 120) > 0 ? 0xff8080 : 0xffffff);
  hud.frHpShine.width = Math.max(0, hud.hpBar.fill.width - 2);
  hud.frHpShade.width = Math.max(0, hud.hpBar.fill.width);
}
