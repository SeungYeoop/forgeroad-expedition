// 거점 창: 진짜 상점(진열장+계산대), 진짜 게시판(코르크판), 진짜 훈련소(돌벽 현판), 장비 관리소(옷장+궤짝)
import * as PAPER from "./paper.js";
import { drawCodex, stopCodex } from "./codex.js";

export const ink = (css) => {
  if (!css || css[0] !== "#") return css;
  const n = parseInt(css.slice(1, 7), 16);
  const k = 0.5;
  const r = ((n >> 16) & 255) * k, g = ((n >> 8) & 255) * k, b = (n & 255) * k;
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
};
const LINE = 0x7a5434;
// 본문 영역
const X0 = 14, Y0 = 44, X1 = 626, Y1 = 330;

// 창 뼈대: 양피지 한 장 + 머리글 + 조작 안내
export function panelFrame(P, S, title, R) {
  const { ot: W, xt: H, ct, q, Be } = R;
  const D = 200;
  const out = [];
  const add = (o, d = 0) => (o.setScrollFactor(0).setDepth(D + d), out.push(o), o);
  add(S.add.rectangle(0, 0, W, H, 0x08060c, 0.72).setOrigin(0).setInteractive());
  add(S.add.nineslice(4, 4, "ui_panel_gold", void 0, W - 8, H - 8, 6, 6, 6, 6).setOrigin(0), 1);
  const [main, sub] = title.split(" · ");
  const tt = add(ct(S, 22, 13, main, "big", q.text), 3);
  sub && add(ct(S, 28 + tt.width, 18, "· " + sub, "small", q.textDim), 3);
  add(S.add.rectangle(16, 37, W - 36, 1, LINE).setOrigin(0), 2);
  add(S.add.rectangle(16, 38, W - 36, 1, 0xfff4d0, 0.6).setOrigin(0), 2);
  add(S.add.nineslice(W - 160, 12, "ui_hud_gold", void 0, 98, 20, 6, 6, 6, 6).setOrigin(0), 2);
  add(S.add.image(W - 148, 22, "icon_gold"), 3);
  const goldText = add(ct(S, W - 138, 16, "", "body", "#ffd84a"), 3);
  const x = Be(S, W - 54, 12, 28, 20, "✕", () => P.close(), { small: !0, depth: D + 3 });
  x.bg.setScrollFactor(0), x.label.setScrollFactor(0), out.push(...x.container);
  add(S.add.rectangle(16, H - 27, W - 36, 1, LINE).setOrigin(0), 2);
  P.hintText = add(ct(S, W / 2, H - 22, "", "tiny", q.textDim).setOrigin(0.5, 0), 3);
  P.switchTo = () => {};
  return { objs: out, goldText };
}

export function makeScreens(R, D) {
  const { Ne, it: SAVE, j, q, yt } = R;
  const { mkItem, kindOf, itemIcon, IT, sd, STARTER, refresh, elCss, shopPrice, matCost, hubSellPrice, rarityDeco, BAG_MAX = 48 } = D;
  const matsOf = () => (sd().mats = sd().mats ?? {});
  const gkey = (id, g) => (g > 1 ? `${id}@${g}` : id);
  const gradeTag = (P, x, y, it, d = 207) => {
    const g = IT.gradeOf(it);
    g > 1 && P.t(x, y, IT.GRADE_ROMAN[g], "tiny", IT.GRADE_CSS[g], { stroke: "#140e18", strokeThickness: 2 }).setOrigin(1, 0).setDepth(d);
  };
  const KO = { weapon: "무기", armor: "방어구", skill: "스킬", magic: "마법" };
  const FREE = new Set(Object.values(STARTER).flat().filter((x) => x[1] === 0).map((x) => x[0]));
  // 보유 = 창고 + 가방
  const countOf = (id) => (FREE.has(id) ? Infinity : sd().owned.filter((x) => x === id).length + (sd().bag ?? []).filter((x) => x === id).length);

  // 공용: 장면 객체를 창에 붙인다
  const A = (P, o, d = 203) => (o.setScrollFactor(0).setDepth(d), P.objs.push(o), o);
  const pin = (P, x, y, col) => (A(P, P.scene.add.circle(x + 1, y + 1, 3, 0x000000, 0.35), 205), A(P, P.scene.add.circle(x, y, 3, col), 206), A(P, P.scene.add.rectangle(x - 1, y - 1, 1, 1, 0xffffff), 207));
  const note = (P, x, y, w, h, seed = 1, rot = 0, d = 203) => A(P, P.scene.add.image(x + w / 2, y + h / 2, PAPER.noteKey(P.scene, w, h, seed)).setRotation(rot), d);
  const woodBg = (P, x, y, w, h, o, d = 202) => A(P, P.scene.add.image(x, y, PAPER.woodKey(P.scene, w, h, o)).setOrigin(0), d);
  const frameWood = (P, x, y, w, h, t = 6, col = 0x5a3418) => {
    const k = { base: col, dark: 0x2a160a, hi: 0x9a6a3a, plank: t };
    woodBg(P, x, y, w, t, k, 204), woodBg(P, x, y + h - t, w, t, k, 204);
    woodBg(P, x, y, t, h, { ...k, vertical: 1 }, 204), woodBg(P, x + w - t, y, t, h, { ...k, vertical: 1 }, 204);
    A(P, P.scene.add.rectangle(x, y, w, h).setStrokeStyle(1, 0x1a0e06).setOrigin(0), 205);
  };

  function describe(P, it, x, y, w, dep = 206, noMats = !1) {
    const b = IT.BASE[it.id] && !it.mats ? IT.BASE[it.id] : { ...it, fused: 1 };
    const tx = (s, st = "small", col = q.text) => {
      const t = P.t(x, y, s, st, col, P.wrap(s, w)).setDepth(dep);
      y += t.height + 3;
    };
    if (b.fused) (tx(IT.describe(it)), noMats || tx(`재료: ${(it.mats ?? []).map((m) => IT.BASE[m]?.name ?? m).join(" + ")}`, "tiny", q.textDim));
    else if (b.kind === "weapon") (tx(`기본 공격 — ${b.attack}`), tx(`특수 동작 — ${b.special}`), tx(`속도 ${b.speed} · 사거리 ${b.range}`, "tiny", q.textDim));
    else if (b.kind === "skill") (tx(b.desc), tx(`쿨타임 ${b.cd}초 · 피해 ${b.dmg}`, "tiny", q.blue));
    else if (b.kind === "magic") (tx(b.desc), tx(`마나 ${b.mana} · 피해 ${b.dmg}`, "tiny", q.blue));
    else if (b.kind === "armor") (tx(`방어 ${b.defense}`), tx(b.desc));
    b.fused || tx(`특성: ${(b.traits ?? []).join(", ") || "없음"}`, "tiny", q.textDim);
    return y;
  }
  const nameCol = (it) => (it.el ? ink(elCss(it.el)) : q.text);

  // ══ 상점: 왼쪽 진열장, 오른쪽 계산대와 주인 ══
  const KEEPER = {
    weapon: ["npc_smith", "어서 오게! 막 벼린 놈들이야.", "좋은 눈썰미군. 그건 잘 들지."],
    armor: ["npc_armorer", "몸 지키는 게 먼저지. 둘러보게.", "그걸 입으면 한결 든든할 걸세."],
    skill: ["npc_trainer", "기술은 몸으로 익히는 법. 골라 보게.", "그 기술, 제대로 써먹어 보라고."],
    magic: ["npc_mage", "마법서가 기다리고 있었어요.", "그 주문은 조금 까다롭지만 강력해요."],
  };
  class FrShop extends Ne {
    constructor(scene, onClose, kinds, title) {
      super(scene, title, onClose);
      this.R = R;
      this.kinds = kinds;
      this.kind = kinds[0];
      this.cols = 5;
      this.page = 0;
      this.grade = 1;
      this.say = KEEPER[this.kind][1];
      this.k2 = (e) => {
        if (this.closed) return;
        (e.key === "q" || e.key === "Q") && this.pickGrade(Math.max(1, this.grade - 1));
        (e.key === "e" || e.key === "E") && this.pickGrade(Math.min(IT.GRADE_MAX, this.grade + 1));
      };
      scene.input.keyboard.on("keydown", this.k2);
      this.render();
    }
    close() {
      this.scene.input.keyboard.off("keydown", this.k2);
      super.close();
    }
    pickGrade(g) {
      if (g === this.grade) return;
      this.grade = g;
      const bid = this.list()[this.sel]?.[2];
      const lockd = bid && !IT.canEquip({ id: bid, grade: g });
      this.say = lockd ? `T${g}는 아직 자네 손에 맞지 않아. ${IT.needText({ id: bid, grade: g })}.` : g === 1 ? KEEPER[this.kind][1] : `T${g}라. 그만큼 값이 나가지만 훨씬 세지.`;
      j.play("click");
      this.render();
    }
    // 고른 물건을 지금 고른 티어로 [저장 키, 골드, 기본 id] (티어는 살 때 고른다 · 2026-11-28)
    cur() {
      const row = this.list()[this.sel];
      if (!row) return null;
      const bid = row[2], g = this.grade;
      return [gkey(bid, g), g === 1 && FREE.has(bid) ? 0 : shopPrice(bid, g), bid];
    }
    // [저장 키, 골드, 기본 id]
    list() {
      const g = 1;
      const ids = [...STARTER[this.kind].map((x) => x[0]), ...(sd().shop ?? []).filter((x) => kindOf(x.key) === this.kind).map((x) => x.key)];
      return ids.map((id) => [gkey(id, g), g === 1 && FREE.has(id) ? 0 : shopPrice(id, g), id]);
    }
    canPay(price) {
      const c = matCost(this.grade);
      return SAVE.data.gold >= price && (!c || (matsOf()[c.mat.id] ?? 0) >= c.n);
    }
    count() {
      return this.list().length;
    }
    primary() {
      this.buy();
    }
    buy() {
      const [id, price] = this.cur();
      if (FREE.has(id)) return void ((this.say = "그건 처음부터 자네 것일세. 돈 받을 물건이 아니야."), this.render());
      if (!IT.canEquip({ id: String(id).split("@")[0], grade: this.grade })) return void (j.play("error"), (this.say = `아직 자네 손에 맞지 않아. ${IT.needText({ id: String(id).split("@")[0], grade: this.grade })}. V키로 운명 보드를 보게.`), this.render());
      const c = matCost(this.grade);
      if (c && (matsOf()[c.mat.id] ?? 0) < c.n) return void (j.play("error"), (this.say = `${c.mat.name}가 모자라. ${c.n}개는 있어야 하네.`), this.render());
      // 산 물건은 가방으로 (빈 기술·마법 칸이 있으면 바로 장착) — 가방이 꽉 차면 팔지 않는다 (2026-11-28)
      const d = sd();
      d.bag ??= [];
      const auto = this.kind === "skill" ? (!d.equip.s1 ? "s1" : !d.equip.s2 ? "s2" : null) : this.kind === "magic" ? (!d.equip.magic ? "magic" : null) : null;
      if (!auto && d.bag.length >= BAG_MAX) return void (j.play("error"), (this.say = "가방이 꽉 찼네. 창고에 좀 넣고 오게."), this.render());
      if (!SAVE.spend(price)) return void (j.play("error"), (this.say = "골드가 모자라는군. 탐험을 더 다녀오게."), this.render());
      c && (matsOf()[c.mat.id] -= c.n);
      auto ? (d.owned.push(id), (d.equip[auto] = id)) : d.bag.push(id);
      SAVE.write();
      j.play("buy");
      refresh(this.scene);
      this.say = auto ? "바로 손에 익혀 두었네. 쓰러지면 끝이니 조심하게." : "가방에 넣어 두었네. 쓰러지면 끝이니 조심하게.";
      this.render();
    }
    build() {
      const sc = this.scene;
      const L = this.list();
      this.sel = Math.max(0, Math.min(this.sel, L.length - 1));
      const PER = 15;
      this.page = Math.floor(this.sel / PER);
      // ── 진열장 ──
      const sx = X0 + 4, sy = Y0 + 2, sw = 340, shh = Y1 - Y0 - 4;
      woodBg(this, sx, sy, sw, shh, { base: 0x4a2c16, dark: 0x24140a, hi: 0x6a4424, vertical: 1, plank: 20 });
      A(this, sc.add.rectangle(sx, sy, sw, shh, 0x000000, 0.25).setOrigin(0), 202);
      frameWood(this, sx, sy, sw, shh, 8, 0x6a4022);
      const rowH = 88;
      for (let r = 0; r < 3; r++) {
        const by = sy + 12 + r * rowH + 66;
        woodBg(this, sx + 8, by, sw - 16, 7, { base: 0x9a6a3a, dark: 0x4a2c16, hi: 0xd09a5a, plank: 7 }, 204);
        A(this, sc.add.rectangle(sx + 8, by + 7, sw - 16, 3, 0x000000, 0.35).setOrigin(0), 204);
      }
      // (티어는 계산대에서 살 때 고른다 — 진열장 값은 T1 기준)
      this.t(sx + 12, sy + 8, "값은 T1 기준 · 티어는 계산대에서", "tiny", "#e8d0a0").setDepth(206);
      L.slice(this.page * PER, this.page * PER + PER).forEach(([id, price], k) => {
        const i = this.page * PER + k;
        const r = Math.floor(k / 5), c = k % 5;
        const cx = sx + 40 + c * 65, by = sy + 12 + r * rowH + 66;
        const it = mkItem(id);
        const sel = i === this.sel;
        const n = countOf(id);
        sel && A(this, sc.add.image(cx, by - 18, "vx_glow").setTint(0xffd070).setAlpha(0.55).setScale(1.6).setBlendMode(R.zt.BlendModes.ADD), 204);
        A(this, sc.add.ellipse(cx, by, 30, 6, 0x000000, 0.4), 204);
        const ic = A(this, sc.add.image(cx, by - 18, itemIcon(sc, it)).setScale(2.3), 205);
        for (const o of rarityDeco?.(sc, it, cx, by - 18, 50, 205.5) ?? []) A(this, o, o.depth);
        gradeTag(this, cx + 22, by - 14, it);
        sel && sc.tweens.add({ targets: ic, y: by - 23, duration: 420, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
        // 가격표 (실에 매달린 종이)
        A(this, sc.add.rectangle(cx - 8, by + 7, 1, 6, 0xd8c8a8), 205);
        const tg = A(this, sc.add.rectangle(cx, by + 20, 56, 17, 0x1a0e08, 0.92).setStrokeStyle(1, sel ? 0xffd84a : 0xc89a50), 205);
        if (FREE.has(id)) this.t(cx, by + 13, "기본", "small", "#8fe07a", { stroke: "#0a0604", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(206);
        else {
          A(this, sc.add.image(cx - 19, by + 20, "icon_gold").setScale(0.8), 206);
          this.t(cx + 5, by + 13, yt(price), "small", this.canPay(price) ? "#ffe08a" : "#ff8a7a", { stroke: "#0a0604", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(206);
        }
        !FREE.has(id) && n > 0 && this.t(cx + 14, by - 38, `×${n}`, "tiny", "#ffe8a0", { stroke: "#2a1408", strokeThickness: 2 }).setDepth(207);
        const hit = A(this, sc.add.rectangle(cx, by - 22, 60, 64, 0, 0).setInteractive({ useHandCursor: !0 }), 208);
        hit.on("pointerdown", () => this.sel !== i && ((this.sel = i), (this.say = KEEPER[this.kind][2]), j.play("click"), this.render()));
        void tg;
      });
      const pages = Math.ceil(L.length / PER);
      if (pages > 1) {
        this.btn(sx + 12, sy + shh - 22, 24, 16, "◀", () => ((this.sel = Math.max(0, (this.page - 1) * PER)), this.render()), { enabled: this.page > 0 });
        this.btn(sx + sw - 36, sy + shh - 22, 24, 16, "▶", () => ((this.sel = Math.min(L.length - 1, (this.page + 1) * PER)), this.render()), { enabled: this.page < pages - 1 });
        this.t(sx + sw / 2, sy + shh - 20, `${this.page + 1} / ${pages}`, "tiny", "#e8d0a0").setOrigin(0.5, 0).setDepth(206);
      }
      // ── 계산대 ──
      const cx0 = sx + sw + 8, cw = X1 - cx0;
      woodBg(this, cx0, sy, cw, shh, { base: 0x7a4e2a, dark: 0x3a2210, hi: 0xa87444, plank: 16 });
      A(this, sc.add.rectangle(cx0, sy, cw, shh, 0x000000, 0.2).setOrigin(0), 202);
      // 벽걸이 선반 장식
      woodBg(this, cx0 + 10, sy + 26, cw - 20, 4, { base: 0x5a3418, dark: 0x2a160a, hi: 0x8a5a2e, plank: 4 }, 203);
      const [npc, greet] = KEEPER[this.kind];
      sc.textures.exists(npc) && A(this, sc.add.sprite(cx0 + 54, sy + 132, npc, 0).setOrigin(0.5, 1).setScale(3).play(`${npc}_idle`), 203);
      // 말풍선
      const bub = note(this, cx0 + 96, sy + 38, cw - 106, 52, 5, 0, 204);
      void bub;
      A(this, sc.add.triangle(cx0 + 98, sy + 74, 0, 0, 10, 4, 0, 10, 0xeedcb4), 204);
      this.t(cx0 + 104, sy + 44, this.say ?? greet, "tiny", q.text, this.wrap("", cw - 122)).setDepth(206);
      // 계산대 판
      const ty = sy + 132;
      woodBg(this, cx0, ty, cw, shh - 132, { base: 0x8a5a30, dark: 0x3a2210, hi: 0xc08850, plank: 14 }, 204);
      woodBg(this, cx0 - 2, ty - 4, cw + 4, 6, { base: 0xb07a44, dark: 0x5a3418, hi: 0xe0a868, plank: 6 }, 205);
      // 상품 설명서 (계산대 위 종이)
      const [id, price, bid] = this.cur();
      const it = mkItem(id);
      const locked = !FREE.has(id) && !IT.canEquip({ id: bid, grade: this.grade });
      note(this, cx0 + 8, ty + 6, cw - 16, shh - 132 - 70, 7, 0, 205);
      pin(this, cx0 + cw / 2, ty + 10, 0xc83a2a);
      this.img(cx0 + 30, ty + 34, "ui_medal").setScale(0.75).setDepth(206);
      this.img(cx0 + 30, ty + 34, itemIcon(sc, it)).setScale(1.7).setDepth(207);
      for (const o of rarityDeco?.(sc, it, cx0 + 30, ty + 34, 38, 207.5) ?? []) A(this, o, o.depth);
      IT.BASE[bid] && ["skill", "magic"].includes(IT.BASE[bid].kind) && this.t(X1 - 24, ty + 18, IT.RARITY_KO[IT.RARITY_OF(it)], "tiny", IT.RARITY_CSS[IT.RARITY_OF(it)], { stroke: "#2a1408", strokeThickness: 2 }).setOrigin(1, 0).setDepth(207);
      this.t(cx0 + 52, ty + 18, it.name, "body", nameCol(it)).setDepth(206);
      this.t(cx0 + 52, ty + 34, `${KO[this.kind]}${it.el ? " · " + IT.elName(it.el) : ""} · ${FREE.has(id) ? "기본 지급" : `${IT.GRADE_ROMAN[this.grade]} · 위력 ×${IT.GRADE_MULT[this.grade]}`}`, "tiny", FREE.has(id) ? q.textDim : ink(IT.GRADE_CSS[this.grade])).setDepth(206);
      A(this, sc.add.rectangle(cx0 + 16, ty + 52, cw - 32, 1, 0x9a7448), 206).setOrigin(0);
      describe(this, mkItem(bid), cx0 + 16, ty + 56, cw - 32, 206, !0);
      // 티어 고르기 (살 때 정한다 · Q/E) — 잠긴 티어는 자물쇠
      const tby = Y1 - 60;
      this.t(cx0 + 10, tby + 3, "티어", "tiny", "#f0d8b0", { stroke: "#2a1408", strokeThickness: 2 }).setDepth(206);
      for (let g = 1; g <= IT.GRADE_MAX; g++) {
        const bx = cx0 + 38 + (g - 1) * 36, on = g === this.grade, ok = IT.canEquip({ id: bid, grade: g });
        this.btn(bx, tby, 32, 18, `T${g}`, () => this.pickGrade(g), { style: on ? "green" : void 0, small: !0 });
        // 잠긴 티어: 어둡게 덮고 자물쇠
        !ok && (A(this, sc.add.rectangle(bx, tby, 32, 18, 0x140a06, on ? 0.15 : 0.55).setOrigin(0), 211), this.img(bx + 24, tby + 9, "icon_lock").setScale(0.9).setDepth(212));
      }
      // 값과 구매
      const by = Y1 - 34;
      this.img(cx0 + 18, by + 12, "icon_gold").setScale(1.3).setDepth(206);
      this.t(cx0 + 30, by + 2, FREE.has(id) ? "무료" : yt(price), "big", "#ffe08a", { stroke: "#2a1408", strokeThickness: 3 }).setDepth(206);
      const n = countOf(id);
      const mc = matCost(this.grade);
      const have = mc ? matsOf()[mc.mat.id] ?? 0 : 0;
      this.t(cx0 + 30, by + 20, FREE.has(id) ? "항상 보유" : `보유 ${n}개`, "tiny", "#f0d8b0", { stroke: "#2a1408", strokeThickness: 2 }).setDepth(206);
      if (mc) {
        this.img(cx0 + 18, by - 10, `fr_mat_${mc.mat.id}`).setScale(1.3).setDepth(206);
        this.t(cx0 + 30, by - 16, `${mc.mat.name} ×${mc.n} (보유 ${have})`, "tiny", have < mc.n ? "#ff9a8a" : "#f0d8b0", { stroke: "#2a1408", strokeThickness: 2 }).setDepth(206);
      }
      this.btn(X1 - 108, by + 2, 98, 26, FREE.has(id) ? "기본 장비" : locked ? "잠김" : `T${this.grade} 구매`, () => this.buy(), { style: "green", enabled: !FREE.has(id) && !locked && this.canPay(price), small: !1 });
      this.hintText?.setText("");
    }
  }

  // ══ 장비 관리소: 왼쪽 옷장(인형), 오른쪽 궤짝 ══
  const SL = [["weapon", "무기", ["weapon"]], ["armor", "방어구", ["armor"]], ["s1", "Q", ["skill", "magic"]], ["s2", "E", ["skill", "magic"]], ["magic", "R", ["skill", "magic"]]];
  class FrLoadout extends Ne {
    constructor(scene, onClose) {
      super(scene, "장비 관리소 · 창고와 출발 장비", onClose);
      this.R = R;
      this.slot = 0;
      this.cols = 6;
      this.sel = this.curIdx();
      this.k2 = (e) => {
        if (this.closed) return;
        (e.key === "q" || e.key === "Q") && this.pickSlot((this.slot + SL.length - 1) % SL.length);
        (e.key === "e" || e.key === "E") && this.pickSlot((this.slot + 1) % SL.length);
      };
      scene.input.keyboard.on("keydown", this.k2);
      this.render();
    }
    close() {
      this.scene.input.keyboard.off("keydown", this.k2);
      super.close();
    }
    pickSlot(i) {
      this.slot = i;
      this.sel = this.curIdx();
      j.play("click");
      this.render();
    }
    curIdx() {
      return Math.max(0, this.options().indexOf(sd().equip[SL[this.slot][0]]));
    }
    options() {
      const d = sd();
      const [key, , kinds] = SL[this.slot];
      const opt = [...new Set(d.owned)].filter((id) => kinds.includes(kindOf(id)));
      return key === "weapon" || key === "armor" ? opt : [null, ...opt];
    }
    count() {
      return this.options().length;
    }
    primary() {
      const o = this.options();
      o.length && this.equip(o[this.sel]);
    }
    sell(id) {
      const d = sd();
      const i = d.owned.indexOf(id);
      const price = hubSellPrice(id);
      if (i < 0 || price <= 0) return void j.play("error");
      d.owned.splice(i, 1);
      if (!d.owned.includes(id)) for (const k of Object.keys(d.equip)) d.equip[k] === id && (d.equip[k] = k === "weapon" ? "W01" : k === "armor" ? "A01" : null);
      SAVE.data.gold += price;
      SAVE.write();
      j.play("coinBig");
      refresh(this.scene);
      this.render();
    }
    equip(id) {
      const d = sd();
      const key = SL[this.slot][0];
      if (id) {
        const [bid, gs] = String(id).split("@"), probe = { id: bid, grade: Number(gs) || 1 };
        if (!IT.canEquip(probe)) return void (j.play("error"), this.scene.hud?.()?.toast?.(IT.needText(probe), "#ff8a8a"), (this.say = IT.needText(probe)), this.render());
      }
      if (id && (key === "s1" || key === "s2" || key === "magic")) for (const k of ["s1", "s2", "magic"]) k !== key && d.equip[k] === id && (d.equip[k] = null);
      d.equip[key] = id;
      SAVE.write();
      j.play("buy");
      refresh(this.scene);
      this.render();
    }
    build() {
      const d = sd(), sc = this.scene;
      // 옷장
      const wx = X0 + 4, wy = Y0 + 2, ww = 250, wh = Y1 - Y0 - 4;
      woodBg(this, wx, wy, ww, wh, { base: 0x5a3820, dark: 0x2a180a, hi: 0x8a5a32, vertical: 1, plank: 24 });
      A(this, sc.add.rectangle(wx + 14, wy + 14, ww - 28, wh - 28, 0x1a0e08, 0.55).setOrigin(0), 203);
      frameWood(this, wx, wy, ww, wh, 10, 0x6a4022);
      const cx = wx + ww / 2;
      A(this, sc.add.image(cx, wy + 120, "vx_glow").setTint(0xffc070).setAlpha(0.35).setScale(3).setBlendMode(R.zt.BlendModes.ADD), 203);
      // 받침대
      woodBg(this, cx - 40, wy + 196, 80, 10, { base: 0x9a6a3a, dark: 0x4a2c16, hi: 0xd09a5a, plank: 10 }, 204);
      const pk = sc.textures.exists("player_" + SAVE.data.equip.armor) ? "player_" + SAVE.data.equip.armor : null;
      pk && A(this, sc.add.sprite(cx, wy + 196, pk, 0).setOrigin(0.5, 1).setScale(3.2), 205);
      const POS = [[cx - 84, wy + 80], [cx + 84, wy + 80], [cx - 52, wy + 246], [cx, wy + 246], [cx + 52, wy + 246]];
      SL.forEach(([key, ko], i) => {
        const [x, y] = POS[i];
        const id = d.equip[key];
        const it = id ? mkItem(id) : null;
        const sel = i === this.slot;
        this.t(x, y - 34, ko, "small", sel ? "#ffe08a" : "#d8c0a0", { stroke: "#1a0e06", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(206);
        const b = A(this, sc.add.image(x, y, sel ? "ui_slot_sel" : "ui_slot").setScale(1.5).setInteractive({ useHandCursor: !0 }), 205);
        b.on("pointerdown", () => this.pickSlot(i));
        it && A(this, sc.add.image(x, y, itemIcon(sc, it)).setScale(1.5), 206);
        it && gradeTag(this, x + 20, y - 18, it);
        if (it && !FREE.has(id)) this.t(x + 18, y + 8, `×${countOf(id)}`, "tiny", "#ffe8a0", { stroke: "#1a0e06", strokeThickness: 2 }).setDepth(207);
        i < 2 && A(this, sc.add.rectangle(i ? x - 34 : x + 34, y + 4, 24, 1, 0xc89a50, 0.6), 205);
      });
      // 궤짝
      const kx = wx + ww + 10, kw = X1 - kx;
      const [key, ko] = SL[this.slot];
      const o = this.options();
      this.sel = Math.max(0, Math.min(this.sel, o.length - 1));
      woodBg(this, kx, wy, kw, 150, { base: 0x6a4224, dark: 0x2a160a, hi: 0x9a6a3a, plank: 12 });
      A(this, sc.add.rectangle(kx + 8, wy + 22, kw - 16, 120, 0x1a0e08, 0.6).setOrigin(0), 203);
      frameWood(this, kx, wy, kw, 150, 8, 0x4a2c16);
      for (const xx of [kx + 6, kx + kw - 14]) A(this, sc.add.rectangle(xx, wy, 8, 150, 0x3a3a44).setOrigin(0), 205);
      this.t(kx + 20, wy + 6, `궤짝 — ${ko} 칸에 넣을 장비`, "small", "#f0d8b0", { stroke: "#1a0e06", strokeThickness: 2 }).setDepth(206);
      const ts = 40, gap = 6, cols = 7;
      const rows = 3, r0 = Math.max(0, Math.min(Math.floor(this.sel / cols) - rows + 1, Math.ceil(o.length / cols) - rows));
      o.forEach((id, i) => {
        const r = Math.floor(i / cols) - r0;
        if (r < 0 || r >= rows) return;
        const x = kx + 22 + (i % cols) * (ts + gap) + ts / 2, y = wy + 30 + r * (ts + gap) + ts / 2 - 4;
        const sel = i === this.sel;
        const b = A(this, sc.add.image(x, y, sel ? "ui_slot_sel" : "ui_slot").setScale(ts / 28).setInteractive({ useHandCursor: !0 }), 205);
        b.on("pointerdown", () => (this.sel === i ? this.equip(id) : ((this.sel = i), j.play("click"), this.render())));
        if (id) {
          const it = mkItem(id);
          A(this, sc.add.image(x, y, itemIcon(sc, it)).setScale(1.3), 206);
          gradeTag(this, x + 18, y - 19, it);
          !FREE.has(id) && this.t(x + 9, y + 6, `×${countOf(id)}`, "tiny", "#ffe8a0", { stroke: "#1a0e06", strokeThickness: 2 }).setDepth(207);
          d.equip[key] === id && A(this, sc.add.image(x + 12, y - 12, "icon_check"), 207);
        } else this.t(x, y - 5, "비움", "tiny", "#d8c0a0").setOrigin(0.5, 0).setDepth(206);
      });
      // 설명 종이
      note(this, kx, wy + 158, kw, wh - 158, 11);
      pin(this, kx + 12, wy + 164, 0x3a6ac8);
      const cur = o[this.sel];
      if (cur) {
        const it = mkItem(cur);
        this.t(kx + 14, wy + 170, it.name, "body", nameCol(it)).setDepth(206);
        this.t(kx + kw - 14, wy + 172, FREE.has(cur) ? "기본 지급 · 잃지 않음" : `쓰러지면 잃음 · 보유 ${countOf(cur)}개`, "tiny", FREE.has(cur) ? q.green : q.orange).setOrigin(1, 0).setDepth(206);
        describe(this, it, kx + 14, wy + 188, kw - 28);
        d.equip[key] !== cur && this.btn(kx + kw - 86, Y1 - 28, 76, 20, "장착", () => this.equip(cur), { style: "green" });
        const sp = hubSellPrice(cur);
        sp > 0 && this.btn(kx + kw - 172, Y1 - 28, 80, 20, `판매 ${yt(sp)}G`, () => this.sell(cur));
      } else this.t(kx + 14, wy + 170, "이 칸을 비워 둔다.", "small", q.textDim).setDepth(206);
      // 재료는 뺐다
      [].forEach((m, i) => {
        const mx = wx + 46 + i * 50;
        this.img(mx, Y1 - 12, `fr_mat_${m.id}`).setDepth(206);
        this.t(mx + 8, Y1 - 18, `${M[m.id] ?? 0}`, "tiny", M[m.id] ? m.css : "#8a7a6a", { stroke: "#1a0e06", strokeThickness: 2 }).setDepth(206);
      });
      this.hintText?.setText("");
    }
  }

  // ══ 훈련소: 돌벽에 걸린 나무 현판 ══
  class Training extends Ne {
    constructor(scene, onClose) {
      super(scene, "훈련소 · 영구 능력치", onClose);
      this.R = R;
      this.cols = 5;
      this.render();
    }
    count() {
      return R.De.length;
    }
    primary() {
      this.train(R.De[this.sel]);
    }
    train(C) {
      const lv = SAVE.data.training[C.id] ?? 0;
      if (lv >= C.maxLevel) return;
      if (!SAVE.spend(R.Zi(C.id, lv))) return void j.play("error");
      SAVE.data.training[C.id] = lv + 1;
      SAVE.write();
      j.play("levelup");
      this.render();
    }
    build() {
      const S = SAVE.data, sc = this.scene;
      A(this, sc.add.image(X0, Y0, PAPER.stoneKey(sc, X1 - X0, Y1 - Y0)).setOrigin(0), 202);
      A(this, sc.add.rectangle(X0, Y0, X1 - X0, 10, 0x000000, 0.35).setOrigin(0), 203);
      const fmt = (C, v) => (C.fmt === "pct" ? `+${R._t(v, v < 0.1 ? 1 : 0)}` : `+${Math.round(v * 10) / 10}`);
      const gap = 8, cw = Math.floor((X1 - X0 - 16 - gap * 4) / 5), ch = 128;
      R.De.forEach((C, i) => {
        const x = X0 + 8 + (i % 5) * (cw + gap), y = Y0 + 12 + Math.floor(i / 5) * (ch + 10);
        const lv = S.training[C.id] ?? 0, max = lv >= C.maxLevel, cost = R.Zi(C.id, lv);
        const sel = i === this.sel;
        const cx = x + cw / 2;
        // 못과 끈
        A(this, sc.add.circle(cx, y, 3, 0x3a3a44), 204);
        A(this, sc.add.line(0, 0, cx, y, x + 14, y + 14, 0xc8b088).setOrigin(0), 204);
        A(this, sc.add.line(0, 0, cx, y, x + cw - 14, y + 14, 0xc8b088).setOrigin(0), 204);
        const pl = A(this, sc.add.image(cx, y + 12 + ch / 2 - 4, PAPER.woodKey(sc, cw, ch - 8, { base: sel ? 0xb07a44 : 0x8a5a30, dark: 0x3a2210, hi: 0xd8a060, plank: 14 })), 204);
        pl.setInteractive({ useHandCursor: !0 }).on("pointerover", () => this.sel !== i && ((this.sel = i), this.render())).on("pointerdown", () => ((this.sel = i), this.train(C)));
        A(this, sc.add.rectangle(cx, y + 12 + ch / 2 - 4, cw, ch - 8).setStrokeStyle(sel ? 2 : 1, sel ? 0xffd070 : 0x2a160a), 205);
        sel && sc.tweens.add({ targets: pl, angle: { from: -1.5, to: 1.5 }, duration: 700, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
        this.img(cx, y + 34, "ui_medal").setScale(0.62).setDepth(206);
        this.img(cx, y + 34, `icon_st_${C.id}`).setScale(1.6).setDepth(207);
        this.t(cx, y + 52, C.name, "small", "#fff0d0", { stroke: "#2a1408", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(206);
        // 새김 눈금
        const n = Math.min(C.maxLevel, 15), per = C.maxLevel / n, pw = Math.floor((cw - 20) / n);
        for (let k = 0; k < n; k++) A(this, sc.add.rectangle(x + 10 + k * pw + (cw - 20 - pw * n) / 2, y + 70, pw - 1, 5, lv >= (k + 1) * per ? (max ? 0x7ad04a : 0xffc040) : 0x3a2210).setOrigin(0), 206);
        this.t(cx, y + 78, `Lv ${lv}/${C.maxLevel}`, "tiny", "#f0d8b0", { stroke: "#2a1408", strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(206);
        const now = R.Yi(C, lv), nxt = R.Yi(C, lv + 1);
        this.t(cx, y + 90, max ? `${fmt(C, now)} 최대` : `${fmt(C, now)} ▸ ${fmt(C, nxt)}`, "tiny", max ? "#a8f080" : "#ffe8b0", { stroke: "#2a1408", strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(206);
        this.btn(x + 10, y + ch - 24, cw - 20, 18, max ? "최대" : `훈련 ${yt(cost)}G`, () => ((this.sel = i), this.train(C)), { style: "green", enabled: !max && S.gold >= cost });
      });
      const C = R.De[this.sel];
      this.hintText?.setText("");
    }
  }

  // ══ 기록 게시판: 코르크판에 꽂힌 쪽지 ══
  class Board extends Ne {
    constructor(scene, onClose) {
      super(scene, "기록 게시판", onClose);
      this.R = R;
      this.tab = 0;
      this.render();
    }
    count() {
      return 4;
    }
    primary() {
      this.tab = (this.tab + 1) % 4;
      this.render();
    }
    render() {
      stopCodex(this);
      super.render();
    }
    close() {
      stopCodex(this);
      super.close();
    }
    build() {
      const sc = this.scene, T = SAVE.data;
      A(this, sc.add.image(X0 + 8, Y0 + 8, PAPER.corkKey(sc, X1 - X0 - 16, Y1 - Y0 - 16)).setOrigin(0), 202);
      frameWood(this, X0, Y0, X1 - X0, Y1 - Y0, 8, 0x6a4022);
      const done = R.We.filter((a) => T.achievements.includes(a.id)).length;
      ["기록", `업적 ${done}/${R.We.length}`, "도감", "전투 지식"].forEach((s, i) => {
        const x = 128 + i * 86;
        const on = i === this.tab;
        const n = A(this, sc.add.image(x + 42, 22, PAPER.noteKey(sc, 84, 22, 20 + i)).setRotation((i - 1) * 0.03).setInteractive({ useHandCursor: !0 }), 204);
        n.on("pointerdown", () => ((this.tab = i), j.play("click"), this.render()));
        on || n.setTint(0xc8b490);
        this.t(x + 42, 16, s, "small", on ? q.text : q.textDim).setOrigin(0.5, 0).setDepth(206);
        on && pin(this, x + 8, 15, 0xc83a2a);
      });
      if (this.tab === 0) this.records(T);
      else if (this.tab === 1) this.achieve(T);
      else if (this.tab === 2) drawCodex(this, { A, note, pin, R, q, j, SAVE, describe, itemIcon, mkItem, X0, Y0, X1, Y1 });
      else this.codex();
      this.hintText?.setText(this.tab === 2 ? "책갈피로 지역 · 쪽지로 분류 · 움직임 단추로 동작을 골라 보세요" : "");
    }
    records(T) {
      const nx = X0 + 18, ny = Y0 + 16;
      // 최고 기록
      note(this, nx, ny, 170, 70, 3, -0.02);
      pin(this, nx + 85, ny + 5, 0xc83a2a);
      this.t(nx + 12, ny + 10, "최고 도달 거리", "small", q.textDim).setDepth(206);
      this.t(nx + 12, ny + 24, `${yt(T.best)}m`, "title", q.text).setDepth(206);
      T.activeTitle && this.t(nx + 158, ny + 10, `「${T.activeTitle}」`, "tiny", q.orange).setOrigin(1, 0).setDepth(206);
      // 통계
      note(this, nx, ny + 78, 170, 102, 4, 0.015);
      pin(this, nx + 20, ny + 83, 0x3a6ac8);
      let y = ny + 92;
      const row = (a, b, c = q.text) => (this.t(nx + 12, y, a, "tiny", q.textDim).setDepth(206), this.t(nx + 158, y, b, "tiny", c).setOrigin(1, 0).setDepth(206), (y += 13));
      row("총 탐험", `${T.runs}회`), row("누적 골드", yt(T.totalGold), q.gold), row("몬스터 처치", yt(T.kills)), row("엘리트 처치", yt(T.eliteKills)), row("플레이 시간", R.Ns(T.playTime)), row("업적", `${R.We.filter((a) => T.achievements.includes(a.id)).length}개`);
      // 최근 탐험
      note(this, nx, ny + 188, 170, 66, 6, -0.01);
      pin(this, nx + 150, ny + 193, 0x3aa85a);
      this.t(nx + 12, ny + 196, "최근 탐험", "small", q.textDim).setDepth(206);
      T.recentRuns.slice(0, 3).forEach((r, i) => this.t(nx + 12, ny + 212 + i * 11, `${yt(r.dist)}m · +${yt(r.gold)}G`, "tiny", q.text).setDepth(206));
      T.recentRuns.length || this.t(nx + 12, ny + 212, "아직 기록이 없다", "tiny", q.textDim).setDepth(206);
      // 보스 처치
      const bx = nx + 184;
      note(this, bx, ny, 190, 120, 8, 0.012);
      pin(this, bx + 95, ny + 5, 0xd8a020);
      this.t(bx + 12, ny + 10, "토벌 기록", "small", q.textDim).setDepth(206);
      R.Mi.forEach((b, i) => {
        const k = T.bossKills[b.id] ?? 0;
        this.t(bx + 12 + (i % 2) * 88, ny + 28 + Math.floor(i / 2) * 12, `${k > 0 ? b.name : "???"}${k > 0 ? ` ×${k}` : ""}`, "tiny", k > 0 ? q.text : q.textDim).setDepth(206);
      });
      // 지역
      note(this, bx, ny + 128, 190, 126, 9, -0.015);
      pin(this, bx + 20, ny + 133, 0xc83a2a);
      this.t(bx + 12, ny + 138, "밟아 본 땅", "small", q.textDim).setDepth(206);
      const seen = sd().seen ?? {};
      const regs = R.Ht.filter((r) => r.zone);
      const nSeen = regs.filter((r) => seen[r.zone.id]).length;
      this.t(bx + 12, ny + 156, `구역 ${nSeen} / ${regs.length}`, "body", q.text).setDepth(206);
      regs.filter((r) => seen[r.zone.id]).slice(-8).forEach((r, i) => this.t(bx + 12 + (i % 2) * 90, ny + 176 + Math.floor(i / 2) * 12, r.name, "tiny", q.text).setDepth(206));
      // 거리 보상
      const rx = bx + 204, rw = X1 - 18 - rx;
      note(this, rx, ny, rw, 254, 10, 0.01);
      pin(this, rx + rw / 2, ny + 5, 0x3a6ac8);
      this.t(rx + 12, ny + 10, "거리별 첫 도달 보상", "small", q.textDim).setDepth(206);
      let yy = ny + 28;
      for (const m of [...R.oi, ...R.Wn(Math.max(16e3, T.best), 2)]) {
        if (yy > ny + 240) break;
        const c = T.claimed.includes(m.dist);
        const un = (m.unlocks ?? []).map((l) => R.Ys[l]).join(", ");
        this.t(rx + 12, yy, `${c ? "✔" : "·"} ${yt(m.dist)}m`, "tiny", c ? q.green : q.text).setDepth(206);
        this.t(rx + 70, yy, `+${yt(m.gold)}G${un ? " · " + un : ""}`, "tiny", c ? q.textDim : q.gold).setDepth(206);
        yy += 12;
      }
    }
    achieve(T) {
      const cols = 4, w = 140, h = 47, gx = (X1 - X0 - 28 - cols * w) / (cols - 1);
      R.We.forEach((a, i) => {
        const x = X0 + 14 + (i % cols) * (w + gx), y = Y0 + 14 + Math.floor(i / cols) * (h + 4);
        if (y + h > Y1 - 6) return;
        const ok = T.achievements.includes(a.id);
        const n = note(this, x, y, w, h, 30 + i, ((i % 3) - 1) * 0.02);
        ok || n.setTint(0xb8a888);
        pin(this, x + w / 2, y + 5, ok ? 0xc83a2a : 0x7a6a5a);
        this.t(x + 8, y + 8, a.name, "small", ok ? q.text : q.textDim).setDepth(206);
        this.t(x + 8, y + 22, a.desc, "tiny", q.textDim, this.wrap("", w - 16)).setDepth(206);
        this.t(x + w - 8, y + 9, `+${yt(a.gold)}G`, "tiny", ok ? q.textDim : q.gold).setOrigin(1, 0).setDepth(206);
        if (ok) {
          const st = A(this, this.scene.add.circle(x + w - 18, y + h - 14, 9).setStrokeStyle(2, 0xb02a1a, 0.85), 206);
          void st;
          this.t(x + w - 18, y + h - 19, "달성", "tiny", "#b02a1a").setOrigin(0.5, 0).setDepth(207).setRotation(-0.2);
        }
      });
    }
    codex() {
      const w = (X1 - X0 - 44) / 2, y0 = Y0 + 16, h = Y1 - Y0 - 32;
      const L = X0 + 16, Rr = L + w + 12;
      note(this, L, y0, w, h, 40, -0.01);
      note(this, Rr, y0, w, h, 41, 0.01);
      pin(this, L + w / 2, y0 + 5, 0xc83a2a);
      pin(this, Rr + w / 2, y0 + 5, 0x3a6ac8);
      let y = y0 + 12;
      this.t(L + 12, y, "원소 반응", "small", q.text).setDepth(206);
      y += 15;
      this.t(L + 12, y, "상태 이상이 걸린 적을 다른 원소로 치면 터진다.", "tiny", q.textDim).setDepth(206);
      y += 14;
      for (const v of Object.values(R.Zs)) {
        if (y > y0 + h - 22) break;
        this.t(L + 12, y, v.name, "small", ink(v.text)).setDepth(206);
        const t = this.t(L + 74, y + 1, v.desc, "tiny", q.text, this.wrap("", w - 86)).setDepth(206);
        y += Math.max(16, t.height + 4);
      }
      let m = y0 + 12;
      this.t(Rr + 12, m, "무기 진화 (탐험 중 Lv6 이상)", "small", q.text).setDepth(206);
      m += 16;
      for (const v of Object.values(R.ke)) {
        if (m > y0 + h / 2) break;
        const o = v.weapon in SAVE.data.weapons;
        this.t(Rr + 12, m, `${o ? R.ae[v.weapon].name : "???"} → ${v.name}`, "tiny", o ? q.text : q.textDim).setDepth(206);
        this.t(Rr + w - 12, m, `${R.Ee[v.catalyst]?.name ?? "?"} ×${v.need}`, "tiny", q.orange).setOrigin(1, 0).setDepth(206);
        m += 11;
      }
      m += 8;
      this.t(Rr + 12, m, "스킬 강화 (장착 스킬 Lv3 이상)", "small", q.text).setDepth(206);
      m += 16;
      for (const [v, o] of Object.entries(R.ss)) {
        if (m > y0 + h - 12) break;
        this.t(Rr + 12, m, `${R.ve[v]?.name ?? v} → ${o.name}`, "tiny", SAVE.data.skills[v] ? q.text : q.textDim).setDepth(206);
        m += 11;
      }
    }
  }
  return { FrShop, FrLoadout, Training, Board };
}
