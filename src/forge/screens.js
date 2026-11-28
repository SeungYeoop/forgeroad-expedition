import * as UK from "./uikit.js";
// 거점 창: 진짜 상점(진열장+계산대), 진짜 게시판(코르크판), 진짜 훈련소(돌벽 현판), 장비 관리소(옷장+궤짝)
import * as PAPER from "./paper.js";
import * as ALB from "./albkit.js";
import * as ZN from "./zones.js";
import { FR_BOSSES } from "./world.js";
import { drawCodex, drawZoneCodex, stopCodex } from "./codex.js";

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
const BD0 = { X0, Y0, X1, Y1 };

// 창 뼈대: 양피지 한 장 + 머리글 + 조작 안내
export function panelFrame(P, S, title, R) {
  const { ot: W, xt: H, ct, q, Be } = R;
  const D = 200;
  const out = [];
  const add = (o, d = 0) => (o.setScrollFactor(0).setDepth(D + d), out.push(o), o);
  // 알비온식 창 (P.alb): 틀은 build()가 그린다 — 여기서는 어둡게 깔기만 (2026-11-28)
  if (P.alb) {
    add(S.add.rectangle(0, 0, W, H, 0x08060c, 0.55).setOrigin(0).setInteractive());
    const goldText = add(ct(S, -200, -200, "", "tiny", "#000000")).setVisible(!1);
    P.hintText = add(ct(S, -200, -200, "", "tiny", "#000000")).setVisible(!1);
    P.switchTo = () => {};
    return { objs: out, goldText };
  }
  // 공통 UI 틀 (2026-11-28): 어두운 나무판 + 단조 철 테두리 + 붉은 리본 제목
  add(S.add.rectangle(0, 0, W, H, 0x08060c, 0.72).setOrigin(0).setInteractive());
  add(UK.frame(S, 4, 4, W - 8, H - 8, {}), 1);
  const [main, sub] = title.split(" · ");
  const rb = UK.ribbon(S, W / 2, 6, Math.max(120, main.length * 16 + 40), main, { font: "big", h: 26 });
  rb.objs.forEach((o, i) => add(o, 3 + i * 0.1));
  sub && add(ct(S, 22, 15, sub, "small", "#e8d4b0", { stroke: "#140a04", strokeThickness: 3 }), 3);
  add(S.add.rectangle(16, 37, W - 36, 1, LINE).setOrigin(0), 2);
  add(S.add.rectangle(16, 38, W - 36, 1, 0xfff4d0, 0.6).setOrigin(0), 2);
  add(S.add.nineslice(W - 160, 12, "ui_hud_gold", void 0, 98, 20, 6, 6, 6, 6).setOrigin(0), 2);
  add(S.add.image(W - 148, 22, "icon_gold"), 3);
  const goldText = add(ct(S, W - 138, 16, "", "body", "#ffd84a"), 3);
  const x = Be(S, W - 54, 12, 28, 20, "✕", () => P.close(), { small: !0, depth: D + 3 });
  x.bg.setScrollFactor(0), x.label.setScrollFactor(0), out.push(...x.container);
  add(S.add.rectangle(16, H - 27, W - 36, 1, LINE).setOrigin(0), 2);
  P.hintText = add(ct(S, W / 2, H - 22, "", "tiny", "#d8c8a8", { stroke: "#140a04", strokeThickness: 2 }).setOrigin(0.5, 0), 3);
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
  const pin = (P, x, y, col) => P.alb || (A(P, P.scene.add.circle(x + 1, y + 1, 3, 0x000000, 0.35), 205), A(P, P.scene.add.circle(x, y, 3, col), 206), A(P, P.scene.add.rectangle(x - 1, y - 1, 1, 1, 0xffffff), 207));
  const note = (P, x, y, w, h, seed = 1, rot = 0, d = 203) => P.alb ? A(P, P.scene.add.image(Math.round(x), Math.round(y), ALB.insetKey(P.scene, Math.round(w), Math.round(h), seed)).setOrigin(0), d) : A(P, P.scene.add.image(x + w / 2, y + h / 2, PAPER.noteKey(P.scene, w, h, seed)).setRotation(rot), d);
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
    // 사기 · 팔기 탭 (진열장 위 · 2026-11-28)
    modeTabs(sx, sy) {
      for (const [m, ko] of [[!1, "사기"], [!0, "팔기"]])
        this.btn(sx + 12 + (m ? 60 : 0), sy + 6, 56, 18, ko, () => this.sellMode !== m && ((this.sellMode = m), (this.sel = 0), (this.say = m ? "가방에서 팔 물건을 고르게. 값은 넉넉히 쳐주지." : KEEPER[this.kind][1]), j.play("click"), this.render()), { style: this.sellMode === m ? "green" : void 0, small: !0 });
    }
    // 팔기: 진열장에 가방 물건 · 계산대에서 판매
    buildSell() {
      const sc = this.scene, d = sd();
      const bag = (d.bag ?? []).map((k, i) => ({ k, i, it: mkItem(k), price: hubSellPrice(k) })).filter((r) => r.it);
      this.sel = Math.max(0, Math.min(this.sel, bag.length - 1));
      const sx = X0 + 4, sy = Y0 + 2, sw = 340, shh = Y1 - Y0 - 4;
      woodBg(this, sx, sy, sw, shh, { base: 0x4a2c16, dark: 0x24140a, hi: 0x6a4424, vertical: 1, plank: 20 });
      A(this, sc.add.rectangle(sx, sy, sw, shh, 0x000000, 0.25).setOrigin(0), 202);
      frameWood(this, sx, sy, sw, shh, 8, 0x6a4022);
      this.modeTabs(sx, sy);
      const PER = 20, page = Math.floor(this.sel / PER);
      bag.slice(page * PER, page * PER + PER).forEach((r, k) => {
        const i = page * PER + k, c = k % 5, row = Math.floor(k / 5), cx = sx + 40 + c * 65, cy = sy + 52 + row * 62;
        const on = i === this.sel;
        on && A(this, sc.add.image(cx, cy, "vx_glow").setTint(0xffd070).setAlpha(0.5).setScale(1.4).setBlendMode(R.zt.BlendModes.ADD), 204);
        A(this, sc.add.rectangle(cx, cy, 44, 44, 0x1a0e08, 0.85).setStrokeStyle(1, on ? 0xffd84a : 0x8a6038), 204);
        A(this, sc.add.image(cx, cy, itemIcon(sc, r.it)).setScale(1.7), 205);
        for (const o of rarityDeco?.(sc, r.it, cx, cy, 44, 205.5) ?? []) A(this, o, o.depth);
        this.t(cx, cy + 24, `+${yt(r.price)}`, "tiny", "#ffe08a", { stroke: "#0a0604", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(206);
        const hit = A(this, sc.add.rectangle(cx, cy, 56, 56, 0, 0).setInteractive({ useHandCursor: !0 }), 208);
        hit.on("pointerdown", () => this.sel !== i && ((this.sel = i), j.play("click"), this.render()));
      });
      bag.length || this.t(sx + sw / 2, sy + shh / 2, "가방이 비었다", "body", "#e8d0a0", { stroke: "#0a0604", strokeThickness: 3 }).setOrigin(0.5).setDepth(206);
      // 계산대
      const cx0 = sx + sw + 8, cw = X1 - cx0;
      woodBg(this, cx0, sy, cw, shh, { base: 0x7a4e2a, dark: 0x3a2210, hi: 0xa87444, plank: 16 });
      const [npc] = KEEPER[this.kind];
      sc.textures.exists(npc) && A(this, sc.add.sprite(cx0 + 54, sy + 132, npc, 0).setOrigin(0.5, 1).setScale(3).play(`${npc}_idle`), 203);
      note(this, cx0 + 96, sy + 38, cw - 106, 52, 5, 0, 204);
      this.t(cx0 + 104, sy + 44, this.say ?? "", "tiny", q.text, this.wrap("", cw - 122)).setDepth(206);
      const ty = sy + 132;
      woodBg(this, cx0, ty, cw, shh - 132, { base: 0x8a5a30, dark: 0x3a2210, hi: 0xc08850, plank: 14 }, 204);
      const r = bag[this.sel];
      if (!r) return void this.hintText?.setText("");
      note(this, cx0 + 8, ty + 6, cw - 16, shh - 132 - 46, 7, 0, 205);
      this.img(cx0 + 30, ty + 34, "ui_medal").setScale(0.75).setDepth(206);
      this.img(cx0 + 30, ty + 34, itemIcon(sc, r.it)).setScale(1.7).setDepth(207);
      this.t(cx0 + 52, ty + 18, r.it.name, "body", nameCol(r.it)).setDepth(206);
      this.t(cx0 + 52, ty + 34, `가방 ${r.i + 1}번째 칸`, "tiny", q.textDim).setDepth(206);
      describe(this, r.it, cx0 + 16, ty + 56, cw - 32, 206, !0);
      const by = Y1 - 34;
      this.img(cx0 + 18, by + 12, "icon_gold").setScale(1.3).setDepth(206);
      this.t(cx0 + 30, by + 2, `+${yt(r.price)}`, "big", "#ffe08a", { stroke: "#2a1408", strokeThickness: 3 }).setDepth(206);
      this.btn(X1 - 108, by + 2, 98, 26, this.sellArm === r.k ? "한 번 더: 판매" : "판매하기", () => this.sellNow(r), { style: this.sellArm === r.k ? "red" : "green", enabled: r.price > 0, small: this.sellArm === r.k });
      this.hintText?.setText("");
    }
    sellNow(r) {
      const d = sd();
      if (d.bag?.[r.i] !== r.k) return;
      // 희귀 이상은 한 번 더 눌러야 판다 (실수 방지 · 2026-11-28)
      if (["rare", "epic", "legendary"].includes(IT.RARITY_OF(r.it)) && this.sellArm !== r.k) {
        this.sellArm = r.k;
        this.say = `${IT.RARITY_KO[IT.RARITY_OF(r.it)]} 물건이로군. 정말 팔 건가? 한 번 더 누르게.`;
        j.play("error");
        return void this.render();
      }
      this.sellArm = null;
      d.bag.splice(r.i, 1);
      SAVE.data.gold += r.price;
      SAVE.write();
      j.play("coinBig");
      this.say = `${r.it.name}, ${yt(r.price)} 골드에 사지.`;
      refresh(this.scene);
      this.render();
    }
    build() {
      if (this.alb) return this.albBuild();
      if (this.sellMode) return this.buildSell();
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
      this.modeTabs(sx, sy);
      this.t(sx + sw - 12, sy + 10, "값은 T1 기준", "tiny", "#e8d0a0").setOrigin(1, 0).setDepth(206);
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
      if (this.alb) return this.albBuild();
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
      if (this.alb) return this.albBuild();
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
      const { X0, Y0, X1 } = this.bd ?? BD0;
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
      note(this, bx, ny, 190, 154, 8, 0.012);
      pin(this, bx + 95, ny + 5, 0xd8a020);
      this.t(bx + 12, ny + 10, "토벌 기록", "small", q.textDim).setDepth(206);
      R.Mi.forEach((b, i) => {
        const k = T.bossKills[b.id] ?? 0;
        this.t(bx + 12 + (i % 2) * 88, ny + 26 + Math.floor(i / 2) * 11, `${k > 0 ? b.name : "???"}${k > 0 ? ` ×${k}` : ""}`, "tiny", k > 0 ? q.text : q.textDim).setDepth(206);
      });
      // 지역
      note(this, bx, ny + 160, 190, 94, 9, -0.015);
      pin(this, bx + 20, ny + 165, 0xc83a2a);
      this.t(bx + 12, ny + 166, "밟아 본 땅", "small", q.textDim).setDepth(206);
      const seen = sd().seen ?? {};
      const regs = R.Ht.filter((r) => r.zone);
      const nSeen = regs.filter((r) => seen[r.zone.id]).length;
      this.t(bx + 12, ny + 180, `구역 ${nSeen} / ${regs.length}`, "body", q.text).setDepth(206);
      regs.filter((r) => seen[r.zone.id]).slice(-8).forEach((r, i) => this.t(bx + 12 + (i % 2) * 90, ny + 198 + Math.floor(i / 2) * 12, r.name, "tiny", q.text).setDepth(206));
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
      const { X0, Y0, X1, Y1 } = this.bd ?? BD0;
      const cols = 4, w = 140, h = 47, gx = (X1 - X0 - 28 - cols * w) / (cols - 1);
      R.We.forEach((a, i) => {
        const x = X0 + 14 + (i % cols) * (w + gx), y = Y0 + 14 + Math.floor(i / cols) * (h + 4);
        if (y + h > Y1 - 6) return;
        const ok = T.achievements.includes(a.id);
        const n = note(this, x, y, w, h, 30 + i, ((i % 3) - 1) * 0.02);
        ok || this.alb || n.setTint(0xb8a888);
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
      const { X0, Y0, X1, Y1 } = this.bd ?? BD0;
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

  // ══════════ 알비온식 거점 창 (2026-11-28 2차) — docs/intent/albion-ui-analysis.md 7-3 ══════════
  //   나무 머리띠(초상 원·제목·주인 말·골드·닫기 + 알약 줄) + 종이 몸통(표 머리·줄·세로 구분선·안쪽 판·진홍 실행 단추)
  const RAR_INK = { common: "#3a2a1a", uncommon: "#1d6418", rare: "#183f88", epic: "#621a92", legendary: "#8a5200" };
  const rarInk = (it) => (it.el ? ink(elCss(it.el)) : RAR_INK[IT.RARITY_OF(it)] ?? ALB.C.ink);
  const at = (P, x, y, s, st = "tiny", col = ALB.C.ink, o = {}) => P.t(x, y, s, st, col, { ...ALB.inkStyle, ...o }).setDepth(206);
  const bold = (P, x, y, s, st = "small", col = ALB.C.ink) => at(P, x, y, s, st, col, { stroke: col, strokeThickness: 1 });
  const dt = (P, x, y, s, st = "tiny", col = "#ecd9b8", o = {}) => P.t(x, y, s, st, col, { ...ALB.darkStyle, ...o }).setDepth(206);
  const aIcon = (sc, it) => (D.albIcon ? D.albIcon(sc, it) : itemIcon(sc, it));
  const badge = (P, x, y, key, d = 207) => A(P, P.scene.add.image(Math.round(x) - 5, Math.round(y) - 5, key).setOrigin(0), d);
  // 칸 + 아이콘 + 배지 (가방과 같은 칸)
  function aslot(P, x, y, it, o = {}) {
    const sc = P.scene;
    A(P, sc.add.image(x, y, it ? (o.hi ? "alb_slot_hi" : "alb_slot") : o.hi ? "alb_hollow_hi" : "alb_hollow"), o.d ?? 205);
    if (!it) return;
    A(P, sc.add.image(x, y, aIcon(sc, it)).setAlpha(o.dim ? 0.4 : 1), (o.d ?? 205) + 1);
    const g = o.grade ?? IT.gradeOf(it);
    badge(P, x - 9, y - 9, `alb_badge_tier_${g}`, (o.d ?? 205) + 2);
    const rar = IT.RARITY_OF(it);
    (rar !== "common" || it.tier > 0) && badge(P, x + 9, y + 9, `alb_badge_${rar}${it.tier ? "_" + it.tier : ""}`, (o.d ?? 205) + 2);
  }
  function abtn(P, x, y, w, label, cb, o = {}) {
    const sc = P.scene, hh = o.h ?? 13, en = o.enabled !== !1, st = o.look ?? (en ? o.style ?? "navy" : "off");
    const bg = A(P, sc.add.image(x, y, ALB.pillKey(sc, w, hh, st)).setOrigin(0), 209);
    const col = !en ? "#9a9a9e" : st === "red" ? "#ffe27a" : st === "paper" ? ALB.C.ink : st === "steel" || st === "off" ? "#e8e4dc" : st === "green" ? "#e8ffd0" : ALB.C.gold;
    P.t(x + w / 2, y + Math.floor(hh / 2) - 4, label, "tiny", col, st === "paper" ? ALB.inkStyle : ALB.darkStyle).setOrigin(0.5, 0).setDepth(210);
    if (en || o.look) {
      bg.setInteractive({ useHandCursor: !0 });
      bg.on("pointerover", () => bg.setTexture(ALB.pillKey(sc, w, hh, st, 1)));
      bg.on("pointerout", () => bg.setTexture(ALB.pillKey(sc, w, hh, st, 0)));
      bg.on("pointerdown", () => cb());
    }
    return bg;
  }
  // 표 머리 (선택 열은 종이색, 나머지 회색 금속)
  const colHead = (P, x, y, w, label, on) => (A(P, P.scene.add.image(x, y, ALB.pillKey(P.scene, w, 11, on ? "paper" : "steel")).setOrigin(0), 205), P.t(x + 6, y + 1, label, "tiny", on ? ALB.C.ink : "#f4f0e8", on ? ALB.inkStyle : ALB.darkStyle).setDepth(206));
  const vline = (P, x, y, h) => A(P, P.scene.add.rectangle(x, y, 1, h, 0x9a7a62, 0.55).setOrigin(0), 204);
  const inset = (P, x, y, w, h, seed = 1) => A(P, P.scene.add.image(x, y, ALB.insetKey(P.scene, Math.round(w), Math.round(h), seed)).setOrigin(0), 203);
  const grooveP = (P, x, y, w) => ALB.groove(P.scene, x, y, w, 205).forEach((o) => A(P, o, 205));
  // 창: 나무 머리띠 + 종이 몸통. 몸통 영역을 돌려준다
  function win(P, o) {
    const sc = P.scene, { x, y, w, h } = o, head = o.head ?? 58;
    ALB.makeArt(sc);
    A(P, sc.add.image(x, y + head - 8, ALB.parchKey(sc, w, h - head + 8, { seed: o.seed ?? 19 })).setOrigin(0), 202);
    A(P, sc.add.rectangle(x + 2, y + 3, w, head - 6, 0x0a0604, 0.5).setOrigin(0), 201.5);
    A(P, sc.add.image(x, y, ALB.woodHeadKey(sc, w, head)).setOrigin(0), 203);
    A(P, sc.add.image(x + 7, y + 4, o.medal).setOrigin(0), 205);
    dt(P, x + 48, y + 6, o.title, "body", "#f2dfc2", { stroke: "#f2dfc2", strokeThickness: 1 });
    o.sub && dt(P, x + 48, y + 22, o.sub, "tiny", "#c8b49a");
    // 골드
    const gt = dt(P, x + w - 24, y + 8, yt(SAVE.data.gold), "small", "#ffe08a").setOrigin(1, 0);
    A(P, sc.add.image(x + w - 30 - gt.width, y + 13, "icon_gold"), 206);
    const cl = A(P, sc.add.image(x + w - 17, y + 5, "alb_close").setOrigin(0).setInteractive({ useHandCursor: !0 }), 209);
    cl.on("pointerover", () => cl.setTexture("alb_close_hov"));
    cl.on("pointerout", () => cl.setTexture("alb_close"));
    cl.on("pointerdown", () => P.close());
    return { bx: x + 10, by: y + head + 4, bw: w - 20, bh: h - head - 10, x, y, w, h };
  }
  // 종이 위 설명 (잉크 색)
  function inkDescribe(P, it, x, y, w) {
    const b = IT.BASE[it.id] && !it.mats ? IT.BASE[it.id] : { ...it, fused: 1 };
    const tx = (s, col = ALB.C.ink2) => {
      const t = at(P, x, y, s, "tiny", col, { wordWrap: { width: w, useAdvancedWrap: !0 }, lineSpacing: 1 });
      y += t.height + 3;
    };
    if (b.fused) tx(IT.describe(it));
    else if (b.kind === "weapon") (tx(`기본 공격 — ${b.attack}`), tx(`특수 동작 — ${b.special}`), tx(`속도 ${b.speed} · 사거리 ${b.range}`, ALB.C.label));
    else if (b.kind === "skill") (tx(b.desc), tx(`쿨타임 ${b.cd}초 · 피해 ${b.dmg}`, "#183f88"));
    else if (b.kind === "magic") (tx(b.desc), tx(`마나 ${b.mana} · 피해 ${b.dmg}`, "#183f88"));
    else if (b.kind === "armor") (tx(`방어 ${b.defense}`), tx(b.desc));
    b.fused || tx(`특성: ${(b.traits ?? []).join(", ") || "없음"}`, ALB.C.label);
    return y;
  }

  // ── 상점 (사기) ──
  FrShop.prototype.alb = 1;
  FrShop.prototype.albBuild = function () {
    const sc = this.scene, d = sd();
    const [npc, greet] = KEEPER[this.kind];
    const [title] = String(this.title).split(" · ");
    const B = win(this, { x: 94, y: 20, w: 452, h: 320, title, sub: `“${this.say ?? greet}”`, medal: ALB.portraitKey(sc, 34, npc, 10, 2) });
    // 머리 둘째 줄: 사기·팔기 / 티어
    const ry = B.y + 38;
    for (const [m, ko, xx] of [[!1, "사기", 0], [!0, "팔기", 38]])
      abtn(this, B.x + 48 + xx, ry, 36, ko, () => this.sellMode !== m && ((this.sellMode = m), (this.sel = 0), (this.say = m ? "가방에서 팔 물건을 고르게. 값은 넉넉히 쳐주지." : greet), j.play("click"), this.render()), { style: this.sellMode === m ? "paper" : "navy" });
    if (this.sellMode) return this.albSell(B);
    const L = this.list();
    this.sel = Math.max(0, Math.min(this.sel, L.length - 1));
    const [id, price, bid] = this.cur();
    dt(this, B.x + B.w - 12 - 6 * 26 - 26, ry + 2, "티어", "tiny", "#c8b49a");
    for (let g = 1; g <= IT.GRADE_MAX; g++) {
      const ok = FREE.has(id) || IT.canEquip({ id: bid, grade: g });
      abtn(this, B.x + B.w - 12 - (IT.GRADE_MAX - g + 1) * 26, ry, 24, `T${g}`, () => this.pickGrade(g), { look: g === this.grade ? "paper" : ok ? "navy" : "off" });
    }
    // ── 왼쪽: 진열 목록 ──
    const lx = B.bx, ly = B.by, VR = 7, RH = 30;
    bold(this, lx + 2, ly + 1, "진열 물건", "small");
    const hy = ly + 16;
    colHead(this, lx, hy, 146, "물건", !0), colHead(this, lx + 148, hy, 38, "보유"), colHead(this, lx + 188, hy, 58, "값 (T1)");
    this.off = Math.max(0, Math.min(this.off ?? 0, L.length - VR));
    this.sel < this.off && (this.off = this.sel);
    this.sel >= this.off + VR && (this.off = this.sel - VR + 1);
    const ty = hy + 14;
    vline(this, lx + 147, ty, VR * RH), vline(this, lx + 187, ty, VR * RH);
    for (let r = 0; r < VR; r++) {
      const i = this.off + r, row = L[i], y0 = ty + r * RH;
      r % 2 && A(this, sc.add.rectangle(lx, y0, 246, RH, 0x5a3a22, 0.05).setOrigin(0), 203.5);
      if (!row) {
        aslot(this, lx + 15, y0 + 15, null);
        at(this, lx + 34, y0 + 10, "빈 진열대", "tiny", "#a8886c");
        continue;
      }
      const [rid, rprice] = row, it = mkItem(rid), on = i === this.sel, n = countOf(rid);
      on && A(this, sc.add.rectangle(lx, y0, 246, RH, 0xfff0c8, 0.4).setOrigin(0).setStrokeStyle(1, 0xc8a050), 204);
      aslot(this, lx + 15, y0 + 15, it, { hi: on });
      at(this, lx + 34, y0 + 5, it.name, "small", rarInk(it));
      at(this, lx + 34, y0 + 18, `${KO[this.kind]}${it.el ? " · " + IT.elName(it.el) : ""}`, "tiny", ALB.C.label);
      at(this, lx + 167, y0 + 10, FREE.has(rid) ? "∞" : `${n}`, "tiny", n ? ALB.C.ink : ALB.C.label).setOrigin(0.5, 0);
      if (FREE.has(rid)) at(this, lx + 217, y0 + 10, "기본", "tiny", "#1d6418").setOrigin(0.5, 0);
      else {
        A(this, sc.add.image(lx + 196, y0 + 15, "icon_gold"), 206);
        at(this, lx + 203, y0 + 10, yt(rprice), "tiny", this.canPay(rprice) ? ALB.C.ink : ALB.C.inkRed, { stroke: this.canPay(rprice) ? ALB.C.ink : ALB.C.inkRed, strokeThickness: 1 });
      }
      const hit = A(this, sc.add.rectangle(lx, y0, 246, RH, 0, 0).setOrigin(0).setInteractive({ useHandCursor: !0 }), 208);
      hit.on("pointerdown", () => this.sel !== i && ((this.sel = i), (this.say = KEEPER[this.kind][2]), j.play("click"), this.render()));
    }
    // 스크롤 (목록이 길 때)
    if (L.length > VR) {
      const sx = lx + 249, sh = VR * RH;
      A(this, sc.add.image(sx, ty, ALB.railKey(sc, sh)).setOrigin(0), 205);
      const th = Math.max(12, Math.round((sh * VR) / L.length));
      A(this, sc.add.image(sx, ty + Math.round(((sh - th) * this.off) / (L.length - VR)), ALB.thumbKey(sc, th)).setOrigin(0), 206);
    }
    // ── 오른쪽: 고른 물건 (안쪽 판) ──
    const dx = lx + 258, dw = B.bw - 258, dy = ly, dh = B.bh;
    inset(this, dx, dy, dw, dh, 3);
    const it = mkItem(id);
    const locked = !FREE.has(id) && !IT.canEquip({ id: bid, grade: this.grade });
    aslot(this, dx + 20, dy + 20, it, { grade: this.grade });
    at(this, dx + 40, dy + 6, it.name, "small", rarInk(it), { wordWrap: { width: dw - 46, useAdvancedWrap: !0 } });
    at(this, dx + 40, dy + 20, FREE.has(id) ? "기본 지급 · 잃지 않음" : `${IT.GRADE_ROMAN[this.grade]} · 위력 ×${IT.GRADE_MULT[this.grade]}`, "tiny", ALB.C.label);
    grooveP(this, dx + 6, dy + 38, dw - 12);
    const descEnd = inkDescribe(this, mkItem(bid), dx + 8, dy + 43, dw - 16);
    // 아래: 재료 · 값 · 구매
    const by = dy + dh - 62;
    // 티어별 위력 · 값 (고른 티어 강조 · 잠긴 티어 표시)
    const RT = 11, tTop = Math.max(descEnd + 4, by - 4 - (IT.GRADE_MAX + 1) * RT - 2);
    const nRows = Math.min(IT.GRADE_MAX, Math.floor((by - 4 - tTop - RT) / RT));
    if (nRows >= 2) {
      colHead(this, dx + 6, tTop, 30, "티어", !0), colHead(this, dx + 38, tTop, 44, "위력"), colHead(this, dx + 84, tTop, dw - 90, "값");
      for (let g = 1; g <= nRows; g++) {
        const y = tTop + 12 + (g - 1) * RT, on = g === this.grade, ok = FREE.has(id) || IT.canEquip({ id: bid, grade: g });
        on && A(this, sc.add.rectangle(dx + 6, y, dw - 12, RT, 0xfff0c8, 0.5).setOrigin(0).setStrokeStyle(1, 0xc8a050), 204);
        at(this, dx + 10, y + 1, `T${g}`, "tiny", on ? ALB.C.ink : ALB.C.label);
        at(this, dx + 42, y + 1, `×${IT.GRADE_MULT[g]}`, "tiny", ALB.C.ink);
        const pr = g === 1 && FREE.has(bid) ? "무료" : `${yt(shopPrice(bid, g))}G`, mc2 = matCost(g);
        at(this, dx + 88, y + 1, ok ? `${pr}${mc2 ? ` + ${mc2.mat.name} ${mc2.n}` : ""}` : "잠김", "tiny", ok ? ALB.C.ink : ALB.C.inkRed);
        const hit = A(this, sc.add.rectangle(dx + 6, y, dw - 12, RT, 0, 0).setOrigin(0).setInteractive({ useHandCursor: !0 }), 208);
        hit.on("pointerdown", () => this.pickGrade(g));
      }
    }
    grooveP(this, dx + 6, by, dw - 12);
    const mc = matCost(this.grade), have = mc ? matsOf()[mc.mat.id] ?? 0 : 0;
    if (mc) (A(this, sc.add.image(dx + 13, by + 10, `fr_mat_${mc.mat.id}`), 206), at(this, dx + 22, by + 5, `${mc.mat.name} ×${mc.n}  (보유 ${have})`, "tiny", have < mc.n ? ALB.C.inkRed : ALB.C.ink));
    else at(this, dx + 8, by + 5, FREE.has(id) ? "항상 보유" : `보유 ${countOf(id)}개 · 쓰러지면 잃음`, "tiny", ALB.C.label);
    at(this, dx + 8, by + 20, "가격", "tiny", ALB.C.label);
    A(this, sc.add.image(dx + 38, by + 25, "icon_gold"), 206);
    bold(this, dx + 45, by + 18, FREE.has(id) ? "무료" : yt(price), "body", this.canPay(price) || FREE.has(id) ? ALB.C.ink : ALB.C.inkRed);
    abtn(this, dx + 6, dy + dh - 20, dw - 12, FREE.has(id) ? "기본 장비" : locked ? "잠김 · 운명 보드(V)" : `T${this.grade} 구매`, () => this.buy(), { style: "red", h: 15, enabled: !FREE.has(id) && !locked && this.canPay(price) });
    this.hintText?.setText("");
  };
  // ── 상점 (팔기): 왼쪽 가방 칸 8×6, 오른쪽 판매 ──
  FrShop.prototype.albSell = function (B) {
    const sc = this.scene, d = sd();
    const bag = (d.bag ?? []).map((k, i) => ({ k, i, it: mkItem(k), price: hubSellPrice(k) })).filter((r) => r.it);
    this.sel = Math.max(0, Math.min(this.sel, bag.length - 1));
    dt(this, B.x + B.w - 12, B.y + 40, `가방 ${bag.length} / ${BAG_MAX}`, "tiny", "#c8b49a").setOrigin(1, 0);
    const lx = B.bx, ly = B.by;
    bold(this, lx + 2, ly + 1, "팔 물건 고르기", "small");
    const GX = lx + 15, GY = ly + 32;
    for (let k = 0; k < 48; k++) {
      const c = k % 8, r = Math.floor(k / 8), x = GX + c * 31, y = GY + r * 31, R0 = bag[k];
      aslot(this, x, y, R0?.it, { hi: k === this.sel && !!R0 });
      if (!R0) continue;
      const hit = A(this, sc.add.rectangle(x, y, 28, 28, 0, 0).setInteractive({ useHandCursor: !0 }), 208);
      hit.on("pointerdown", () => this.sel !== k && ((this.sel = k), (this.sellArm = null), j.play("click"), this.render()));
    }
    const dx = lx + 258, dw = B.bw - 258, dy = ly, dh = B.bh;
    inset(this, dx, dy, dw, dh, 5);
    const r = bag[this.sel];
    if (!r) return void at(this, dx + dw / 2, dy + dh / 2 - 6, "가방이 비었다", "small", ALB.C.label).setOrigin(0.5, 0);
    aslot(this, dx + 20, dy + 20, r.it);
    at(this, dx + 40, dy + 6, r.it.name, "small", rarInk(r.it), { wordWrap: { width: dw - 46, useAdvancedWrap: !0 } });
    at(this, dx + 40, dy + 20, `${IT.RARITY_KO[IT.RARITY_OF(r.it)]} · 가방 ${r.i + 1}번째 칸`, "tiny", ALB.C.label);
    grooveP(this, dx + 6, dy + 38, dw - 12);
    const descEnd = inkDescribe(this, r.it, dx + 8, dy + 43, dw - 16);
    const by = dy + dh - 46;
    // 정보 표 (이름표 회갈색 · 값 짙게)
    const total = bag.reduce((s2, b) => s2 + b.price, 0);
    const rows = [["종류", IT.KIND_KO[r.it.kind] ?? "-"], ["희귀도", IT.RARITY_KO[IT.RARITY_OF(r.it)]], ["등급", `${IT.GRADE_ROMAN[IT.gradeOf(r.it)]} · 위력 ×${IT.GRADE_MULT[IT.gradeOf(r.it)]}`], ["가방 전체 값", `${yt(total)}G`], ["확인", ["rare", "epic", "legendary"].includes(IT.RARITY_OF(r.it)) ? "희귀 이상 · 두 번 눌러 판매" : "한 번에 판매"]];
    const t0 = Math.max(descEnd + 4, by - 4 - rows.length * 12);
    rows.forEach(([a, b], k) => {
      const y = t0 + k * 12;
      if (y + 11 > by - 2) return;
      k % 2 || A(this, sc.add.rectangle(dx + 6, y, dw - 12, 12, 0x5a3a22, 0.06).setOrigin(0), 204);
      at(this, dx + 10, y + 2, a, "tiny", ALB.C.label);
      at(this, dx + dw - 10, y + 2, b, "tiny", ALB.C.ink).setOrigin(1, 0);
    });
    grooveP(this, dx + 6, by, dw - 12);
    at(this, dx + 8, by + 6, "판매가", "tiny", ALB.C.label);
    A(this, sc.add.image(dx + 46, by + 11, "icon_gold"), 206);
    bold(this, dx + 53, by + 4, `+${yt(r.price)}`, "body", ALB.C.ink);
    const arm = this.sellArm === r.k;
    abtn(this, dx + 6, dy + dh - 20, dw - 12, arm ? "한 번 더 눌러 판매" : "판매하기", () => this.sellNow(r), { style: "red", h: 15, enabled: r.price > 0 });
    this.hintText?.setText("");
  };

  // ── 훈련소: 표 (능력치 · 단계 · 효과 · 훈련) ──
  Training.prototype.alb = 1;
  Training.prototype.albBuild = function () {
    const S = SAVE.data, sc = this.scene;
    const total = R.De.reduce((s, C) => s + (S.training[C.id] ?? 0), 0);
    const B = win(this, { x: 100, y: 18, w: 440, h: 324, title: "훈련소", sub: "“골드로 몸을 단련하게. 한 번 익힌 건 잃지 않네.”", medal: ALB.portraitKey(sc, 34, "npc_trainer", 10, 2) });
    dt(this, B.x + 48, B.y + 40, `훈련 합계 Lv ${total}`, "tiny", "#c8b49a");
    const fmt = (C, v) => (C.fmt === "pct" ? `+${R._t(v, v < 0.1 ? 1 : 0)}` : `+${Math.round(v * 10) / 10}`);
    const lx = B.bx, hy = B.by + 1, RH = 23;
    colHead(this, lx, hy, 118, "능력치", !0), colHead(this, lx + 120, hy, 104, "단계"), colHead(this, lx + 226, hy, 110, "효과 (지금 ▸ 다음)"), colHead(this, lx + 338, hy, 82, "훈련");
    const ty = hy + 14;
    vline(this, lx + 119, ty, R.De.length * RH), vline(this, lx + 225, ty, R.De.length * RH), vline(this, lx + 337, ty, R.De.length * RH);
    R.De.forEach((C, i) => {
      const y0 = ty + i * RH, lv = S.training[C.id] ?? 0, max = lv >= C.maxLevel, cost = R.Zi(C.id, lv), on = i === this.sel;
      i % 2 && A(this, sc.add.rectangle(lx, y0, 420, RH, 0x5a3a22, 0.05).setOrigin(0), 203.5);
      on && A(this, sc.add.rectangle(lx, y0, 420, RH, 0xfff0c8, 0.4).setOrigin(0).setStrokeStyle(1, 0xc8a050), 204);
      A(this, sc.add.image(lx + 2, y0 + 2, ALB.iconMedalKey(sc, 19, `icon_st_${C.id}`, lv > 0 ? 1 : 0)).setOrigin(0), 205);
      at(this, lx + 26, y0 + 6, C.name, "small", ALB.C.ink);
      A(this, sc.add.image(lx + 124, y0 + 9, ALB.gaugeKey(sc, 56, lv / C.maxLevel)).setOrigin(0), 205);
      at(this, lx + 184, y0 + 6, `${lv} / ${C.maxLevel}`, "tiny", max ? "#1d6418" : ALB.C.ink);
      const now = R.Yi(C, lv), nxt = R.Yi(C, lv + 1);
      at(this, lx + 230, y0 + 6, max ? `${fmt(C, now)}  최대` : `${fmt(C, now)}  ▸  ${fmt(C, nxt)}`, "tiny", max ? "#1d6418" : ALB.C.ink);
      if (max) bold(this, lx + 379, y0 + 6, "최대", "tiny", "#1d6418").setOrigin(0.5, 0);
      else abtn(this, lx + 342, y0 + 5, 74, `훈련  ${yt(cost)}G`, () => ((this.sel = i), this.train(C)), { enabled: S.gold >= cost });
      const hit = A(this, sc.add.rectangle(lx, y0, 336, RH, 0, 0).setOrigin(0).setInteractive(), 204.5);
      hit.on("pointerdown", () => this.sel !== i && ((this.sel = i), j.play("click"), this.render()));
    });
    this.hintText?.setText("");
  };

  // ── 기록 게시판 (2026-11-28 재구성): 지금 게임에 살아 있는 기록만 ──
  //   뺀 것: 거리 기록·거리 보상(구역제에서 안 씀) · 옛 보스 명단 · 무기 진화·스킬 강화(옛 무기 체계) · 이룰 수 없는 업적
  //   탭: 기록(통계·최근 탐험·세계 정복·지역 보스) · 도감 · 업적(진행 막대) · 융합 속성(8×8 반응표)
  const secHead = (P, x, y, w, label, right) => {
    const sc = P.scene;
    A(P, sc.add.rectangle(x, y, w, 13, 0x3a302a).setOrigin(0), 204);
    A(P, sc.add.rectangle(x, y, w, 1, 0x7a6a58).setOrigin(0), 204.5);
    A(P, sc.add.rectangle(x, y + 13, w, 1, 0xfff0d8, 0.3).setOrigin(0), 204.5);
    A(P, sc.add.triangle(x + w, y, 0, 0, 6, 6.5, 0, 13, 0x3a302a).setOrigin(0), 204);
    dt(P, x + 6, y + 2, label, "tiny", "#f6e4c8");
    right && dt(P, x + w - 6, y + 2, right, "tiny", "#c8b49a").setOrigin(1, 0);
  };
  const stripe = (P, x, y, w, h, k) => k % 2 || A(P, P.scene.add.rectangle(x, y, w, h, 0x5a3a22, 0.07).setOrigin(0), 203.5);
  const ago = (t) => {
    const m = Math.max(0, Math.floor((Date.now() - (t ?? Date.now())) / 60000));
    return m < 1 ? "방금" : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`;
  };
  const RING = [null, ["파랑", 0x4a90ff, "위험 낮음"], ["노랑", 0xffc83a, "위험"], ["빨강", 0xff4a3a, "매우 위험 · 봉인"]];
  const bossList = () => ZN.FR_WORLD.filter((r) => r.boss).map((r) => ({ b: FR_BOSSES.find((x) => x.id === r.boss), z: ZN.BY_ID[r.id.slice(2)] })).filter((o) => o.b && o.z).sort((a, b) => a.z.ring - b.z.ring || a.z.lvl - b.z.lvl);
  const ACH_DEAD = new Set(["boss_all", "clean_500", "arsenal", "wardrobe5", "smith10", "skill5"]);
  const sumObj = (o) => Object.values(o ?? {}).reduce((s, v) => s + (+v || 0), 0);
  const ACH_PROG = { first_run: ["runs", 1], runs_10: ["runs", 10], runs_50: ["runs", 50], kills_100: ["kills", 100], kills_1000: ["kills", 1e3], kills_5000: ["kills", 5e3], elite_50: ["eliteKills", 50], boss_first: [(T) => sumObj(T.bossKills), 1], gold_10k: ["totalGold", 1e4], gold_100k: ["totalGold", 1e5], train100: [(T) => sumObj(T.training), 100] };
  // 반응 효과 (glue.js reaction() 실제 동작에서 옮김)
  const FX_KO = {
    blast: "주변 폭발 · 피해 ×1.5", blastPoison: "폭발 + 화상·독을 함께 건다", beam: "바라보는 쪽으로 긴 광선 · ×1.4", spreadBurn: "주변 적에게 화상 확산 (흑염은 8초)",
    lavaPool: "바닥에 용암 장판 3초", bogPool: "늪 장판(감속) + 맞은 적 기절 2초", holyFire: "하늘에서 빛기둥 · 주변 ×1.4", shatter: "얼어붙은 적을 깨뜨림 · ×3",
    blizzard: "넓은 범위 강한 냉기 감속", root: "주변 적 속박 1.5초 + 냉기", frostbite: "오래가는 독 + 냉기 감속", shield: "나에게 받는 피해 -35% 4초",
    reflect: "받는 피해 -25% + 대지 정령 셋", spirit: "적을 쫓는 정령 둘을 부른다", storm: "가까운 적 5명에게 연쇄 번개", pull: "주변 적을 한곳으로 끌어당김",
    paralyze: "마비 2초 + 독", bigBolt: "거대한 낙뢰 · 주변 ×2.6", trueDmg: "방어를 무시하는 피해", blind: "흙먼지 · 주변 적 절반 확률 기절",
    spreadPoison: "주변 적에게 독 확산", haste: "나의 이동·공격 속도 +30% 5초", fear: "주변 적을 공포로 밀쳐냄", gold: "맞은 자리에 골드가 떨어진다", maxHpCut: "적 최대 체력 20% 깎기 (보스 제외)",
  };

  Board.prototype.alb = 1;
  Board.prototype.albBuild = function () {
    const sc = this.scene, T = SAVE.data;
    const live = R.We.filter((a) => !ACH_DEAD.has(a.id)), done = live.filter((a) => T.achievements.includes(a.id)).length;
    const B = win(this, { x: 16, y: 8, w: 608, h: 344, title: "기록 게시판", medal: ALB.iconMedalKey(sc, 34, "icon_flag") });
    const tabs = ["기록", "도감", `업적 ${done}/${live.length}`, "융합 속성"], tw = [40, 40, 62, 58];
    this.tab = Math.max(0, Math.min(3, this.tab ?? 0));
    let tx0 = B.x + 48;
    tabs.forEach((s, i) => (abtn(this, tx0, B.y + 38, tw[i], s, () => ((this.tab = i), j.play("click"), this.render()), { style: i === this.tab ? "paper" : "navy" }), (tx0 += tw[i] + 3)));
    this.bd = { X0: B.bx, Y0: B.by - 2, X1: B.bx + B.bw, Y1: B.by + B.bh };
    if (this.tab === 0) this.albRecords(T, B);
    else if (this.tab === 1) {
      // 새 도감: 지금 세계(48구역 · 24곳 몬스터 288종 · 보스 12) 기준 (2026-11-28)
      const P = this;
      const H = { secHead: (...a) => secHead(P, ...a), at: (...a) => at(P, ...a), bold: (...a) => bold(P, ...a), dt: (...a) => dt(P, ...a), inset: (...a) => inset(P, ...a) };
      drawZoneCodex(this, { A, R, j, SAVE, ...this.bd, ZN, seen: sd().seen ?? {}, H });
    } else if (this.tab === 2) this.albAchieve(T, B, live, done);
    else this.albElems(B);
  };
  // 기록: 왼쪽 통계·최근 탐험 / 오른쪽 세계 정복·지역 보스
  Board.prototype.albRecords = function (T, B) {
    const sc = this.scene, x0 = B.bx, y0 = B.by, LW = 184;
    const bosses = bossList(), slain = bosses.filter((o) => (T.bossKills?.[o.b.id] ?? 0) > 0).length;
    const seen = sd().seen ?? {}, zones = ZN.ZONES.filter((z) => z.kind === "zone"), nSeen = zones.filter((z) => seen[z.id]).length;
    const live = R.We.filter((a) => !ACH_DEAD.has(a.id));
    secHead(this, x0, y0, LW, "탐험 통계");
    const rows = [["총 탐험", `${yt(T.runs ?? 0)}회`], ["누적 골드", `${yt(T.totalGold ?? 0)}G`], ["몬스터 처치", yt(T.kills ?? 0)], ["엘리트 처치", yt(T.eliteKills ?? 0)], ["보스 토벌", `${slain} / ${bosses.length}`], ["밟은 구역", `${nSeen} / ${zones.length}`], ["업적", `${live.filter((a) => T.achievements.includes(a.id)).length} / ${live.length}`], ["훈련 합계", `Lv ${sumObj(T.training)}`], ["플레이 시간", R.Ns(T.playTime ?? 0)]];
    rows.forEach(([a, b], k) => {
      const y = y0 + 16 + k * 13;
      stripe(this, x0, y, LW, 13, k);
      at(this, x0 + 6, y + 2, a, "tiny", ALB.C.label);
      bold(this, x0 + LW - 6, y + 2, b, "tiny").setOrigin(1, 0);
    });
    const ry = y0 + 16 + rows.length * 13 + 8;
    secHead(this, x0, ry, LW, "최근 탐험", `${Math.min(8, T.recentRuns?.length ?? 0)}건`);
    const rr = (T.recentRuns ?? []).slice(0, 8);
    rr.forEach((r, k) => {
      const y = ry + 16 + k * 13;
      if (y + 13 > B.by + B.bh) return;
      stripe(this, x0, y, LW, 13, k);
      at(this, x0 + 6, y + 2, `${k + 1}.`, "tiny", ALB.C.label);
      A(this, sc.add.image(x0 + 24, y + 7, "icon_gold"), 206);
      bold(this, x0 + 31, y + 2, `+${yt(r.gold ?? 0)}`, "tiny");
      at(this, x0 + LW - 6, y + 2, ago(r.at), "tiny", ALB.C.label).setOrigin(1, 0);
    });
    rr.length || at(this, x0 + 6, ry + 20, "아직 마친 탐험이 없다. 거점 문으로 나가 보자.", "tiny", ALB.C.label, { wordWrap: { width: LW - 12 } });
    // 다음 목표: 진행이 가장 많이 된 미달성 업적 셋
    const ny = ry + 16 + Math.max(2, rr.length) * 13 + 8;
    const goals = live.filter((a) => !T.achievements.includes(a.id) && ACH_PROG[a.id]).map((a) => {
      const pg = ACH_PROG[a.id], cur = Math.min(pg[1], typeof pg[0] === "function" ? pg[0](T) : T[pg[0]] ?? 0);
      return { a, cur, max: pg[1], f: cur / pg[1] };
    }).sort((p1, p2) => p2.f - p1.f);
    const fit = Math.floor((B.by + B.bh - ny - 16) / 22);
    if (fit > 0 && goals.length) {
      secHead(this, x0, ny, LW, "다음 목표");
      goals.slice(0, fit).forEach((g, k) => {
        const y = ny + 16 + k * 22;
        stripe(this, x0, y, LW, 22, k);
        bold(this, x0 + 6, y + 2, g.a.name, "tiny");
        at(this, x0 + LW - 6, y + 2, `+${yt(g.a.gold)}G`, "tiny", "#8a5200").setOrigin(1, 0);
        A(this, sc.add.image(x0 + 6, y + 14, ALB.gaugeKey(sc, 96, g.f)).setOrigin(0), 206);
        at(this, x0 + LW - 6, y + 12, `${yt(g.cur)} / ${yt(g.max)}`, "tiny", ALB.C.label).setOrigin(1, 0);
      });
    }
    // 오른쪽: 세계 정복 (고리별)
    const rx = x0 + LW + 10, rw = B.bw - LW - 10;
    secHead(this, rx, y0, rw, "세계 정복", `밟은 구역 ${nSeen} / ${zones.length}`);
    [1, 2, 3].forEach((rg, k) => {
      const zs = zones.filter((z) => z.ring === rg), n = zs.filter((z) => seen[z.id]).length, [nm, col, lab] = RING[rg];
      const y = y0 + 17 + k * 15;
      stripe(this, rx, y, rw, 15, k);
      A(this, sc.add.rectangle(rx + 6, y + 4, 8, 8, col).setOrigin(0).setStrokeStyle(1, 0x2a1a10), 206);
      bold(this, rx + 18, y + 3, `${nm} 고리`, "tiny");
      at(this, rx + 66, y + 3, lab, "tiny", ALB.C.label);
      A(this, sc.add.image(rx + 172, y + 5, ALB.gaugeKey(sc, 150, zs.length ? n / zs.length : 0)).setOrigin(0), 206);
      bold(this, rx + rw - 6, y + 3, `${n} / ${zs.length}`, "tiny").setOrigin(1, 0);
    });
    // 지역 보스
    const by = y0 + 17 + 3 * 15 + 6;
    secHead(this, rx, by, rw, "지역 보스", `토벌 ${slain} / ${bosses.length}`);
    const hy = by + 16, cx = [0, 150, 286, 344];
    colHead(this, rx, hy, 148, "보스", !0), colHead(this, rx + cx[1], hy, 134, "사는 곳"), colHead(this, rx + cx[2], hy, 56, "위험"), colHead(this, rx + cx[3], hy, rw - cx[3], "토벌");
    bosses.forEach((o, k) => {
      const y = hy + 13 + k * 13;
      if (y + 13 > B.by + B.bh + 2) return;
      const n = T.bossKills?.[o.b.id] ?? 0, known = n > 0 || seen[o.z.id];
      stripe(this, rx, y, rw, 13, k);
      known ? bold(this, rx + 6, y + 2, o.b.name, "tiny", n ? ALB.C.ink : ALB.C.ink2) : at(this, rx + 6, y + 2, "??? (만나지 못함)", "tiny", ALB.C.label);
      at(this, rx + cx[1] + 6, y + 2, seen[o.z.id] ? o.z.name : "밟지 않은 땅", "tiny", seen[o.z.id] ? ALB.C.ink : ALB.C.label);
      const [rn, rc] = RING[o.z.ring];
      A(this, sc.add.rectangle(rx + cx[2] + 6, y + 3, 7, 7, rc).setOrigin(0).setStrokeStyle(1, 0x2a1a10), 206);
      at(this, rx + cx[2] + 16, y + 2, rn, "tiny", ALB.C.ink);
      n ? bold(this, rx + cx[3] + 6, y + 2, `✔ ×${n}`, "tiny", "#1d6418") : at(this, rx + cx[3] + 6, y + 2, "-", "tiny", ALB.C.label);
    });
    [cx[1], cx[2], cx[3]].forEach((c) => vline(this, rx + c - 1, hy + 13, Math.min(bosses.length, 14) * 13));
  };
  // 업적: 2열 · 메달 · 이름 · 설명 · 보상 · 진행 막대
  Board.prototype.albAchieve = function (T, B, live, done) {
    const sc = this.scene, x0 = B.bx, y0 = B.by;
    secHead(this, x0, y0, B.bw, "업적", `달성 ${done} / ${live.length}`);
    const CW = Math.floor((B.bw - 8) / 2), RH = 37, rows = Math.ceil(live.length / 2);
    live.forEach((a, i) => {
      const c = Math.floor(i / rows), r = i % rows, x = x0 + c * (CW + 8), y = y0 + 17 + r * RH;
      if (y + RH > B.by + B.bh + 4) return;
      const ok = T.achievements.includes(a.id);
      stripe(this, x, y, CW, RH - 2, r);
      ok && A(this, sc.add.rectangle(x, y, CW, RH - 2, 0xfff0c8, 0.35).setOrigin(0).setStrokeStyle(1, 0xc8a050, 0.8), 204);
      A(this, sc.add.image(x + 4, y + 5, ALB.iconMedalKey(sc, 22, ok ? "icon_check" : null, ok ? 1 : 0)).setOrigin(0), 206);
      bold(this, x + 32, y + 2, a.name, "small", ok ? ALB.C.ink : ALB.C.ink2);
      at(this, x + 32, y + 14, a.desc, "tiny", ALB.C.label);
      const gw = A(this, sc.add.image(x + CW - 6, y + 4, "icon_gold").setOrigin(1, 0), 206);
      bold(this, x + CW - 8 - gw.width, y + 3, `+${yt(a.gold)}`, "tiny", ok ? ALB.C.label : "#8a5200").setOrigin(1, 0);
      const pg = ACH_PROG[a.id];
      if (pg) {
        const cur = Math.min(pg[1], typeof pg[0] === "function" ? pg[0](T) : T[pg[0]] ?? 0);
        A(this, sc.add.image(x + 32, y + 26, ALB.gaugeKey(sc, 110, ok ? 1 : cur / pg[1])).setOrigin(0), 206);
        at(this, x + 148, y + 24, ok ? "완료" : `${yt(cur)} / ${yt(pg[1])}`, "tiny", ok ? "#1d6418" : ALB.C.ink);
      } else at(this, x + 32, y + 24, ok ? "완료" : "한 번의 탐험 안에서 이뤄야 한다", "tiny", ok ? "#1d6418" : "#8a5200");
    });
  };
  // 융합 속성: 8×8 표 (대각선 = 같은 속성 둘 = 순수) + 고른 칸 설명
  Board.prototype.albElems = function (B) {
    const sc = this.scene, x0 = B.bx, y0 = B.by;
    const base = Object.values(IT.ELEMS).filter((e) => e.kind === "base");
    secHead(this, x0, y0, B.bw, "융합 속성표");
    this.ex = this.ex ?? 0;
    this.ey = this.ey ?? 1;
    const LC = 40, CWd = 41, CH = 26, gx = x0 + LC, gy = y0 + 30;
    const elInk = (e) => ink(e.css);
    base.forEach((e, i) => {
      A(this, sc.add.rectangle(gx + i * CWd, y0 + 16, CWd - 1, 13, e.color, 0.35).setOrigin(0), 204);
      bold(this, gx + i * CWd + CWd / 2, y0 + 18, e.name, "tiny", elInk(e)).setOrigin(0.5, 0);
      A(this, sc.add.rectangle(x0, gy + i * CH, LC - 2, CH - 1, e.color, 0.35).setOrigin(0), 204);
      bold(this, x0 + (LC - 2) / 2, gy + i * CH + 8, e.name, "tiny", elInk(e)).setOrigin(0.5, 0);
    });
    base.forEach((a, yi) =>
      base.forEach((b, xi) => {
        const id = xi === yi ? IT.pureOf(a.id) : IT.compOf(a.id, b.id), E = IT.ELEMS[id];
        if (!E) return;
        const x = gx + xi * CWd, y = gy + yi * CH, on = xi === this.ex && yi === this.ey;
        A(this, sc.add.rectangle(x, y, CWd - 1, CH - 1, E.color, xi === yi ? 0.55 : 0.28).setOrigin(0), 204);
        xi === yi && A(this, sc.add.rectangle(x + 1, y + 1, CWd - 3, CH - 3).setOrigin(0).setStrokeStyle(1, 0x2a1a10, 0.5), 204.5);
        on && A(this, sc.add.rectangle(x - 1, y - 1, CWd + 1, CH + 1).setOrigin(0).setStrokeStyle(2, 0x3a2410), 205.5);
        at(this, x + CWd / 2, y + 8, E.name, "tiny", ALB.C.ink).setOrigin(0.5, 0);
        const hit = A(this, sc.add.rectangle(x, y, CWd - 1, CH - 1, 0, 0).setOrigin(0).setInteractive({ useHandCursor: !0 }), 208);
        hit.on("pointerdown", () => ((this.ex = xi), (this.ey = yi), j.play("click"), this.render()));
      }),
    );
    // 오른쪽: 고른 칸 설명
    const dx = gx + base.length * CWd + 8, dw = B.bx + B.bw - dx, dy = y0 + 16, dh = B.bh - 16;
    inset(this, dx, dy, dw, dh, 9);
    const a = base[this.ey], b = base[this.ex], pure = a === b, E = IT.ELEMS[pure ? IT.pureOf(a.id) : IT.compOf(a.id, b.id)];
    A(this, sc.add.rectangle(dx + 8, dy + 8, 22, 22, E.color).setOrigin(0).setStrokeStyle(1, 0x2a1a10), 206);
    bold(this, dx + 36, dy + 7, E.name, "body", elInk(E));
    at(this, dx + 36, dy + 22, pure ? "순수 속성" : "복합 속성", "tiny", ALB.C.label);
    grooveP(this, dx + 6, dy + 36, dw - 12);
    at(this, dx + 8, dy + 42, "만드는 법", "tiny", ALB.C.label);
    bold(this, dx + 8, dy + 54, pure ? `${a.name} + ${a.name}` : `${a.name} + ${b.name}`, "small");
    at(this, dx + 8, dy + 68, pure ? "같은 속성 장비 둘을 융합" : "두 속성 장비를 융합 (순서 상관없음)", "tiny", ALB.C.label);
    grooveP(this, dx + 6, dy + 82, dw - 12);
    at(this, dx + 8, dy + 88, "맞힐 때", "tiny", ALB.C.label);
    const ef = pure ? "두 배로 센 속성 상태이상 + 18% 확률로 순수 폭발 (×1.5)" : `${FX_KO[E.fx] ?? "반응"}\n두 속성의 상태이상도 함께 건다`;
    at(this, dx + 8, dy + 100, ef, "tiny", ALB.C.ink, { wordWrap: { width: dw - 16, useAdvancedWrap: !0 }, lineSpacing: 2 });
    // 같은 줄(첫 속성)이 들어간 조합 전부
    const ly0 = dy + 132;
    grooveP(this, dx + 6, ly0, dw - 12);
    at(this, dx + 8, ly0 + 5, `${a.name}과 섞으면 (같은 줄 8가지)`, "tiny", ALB.C.label);
    base.forEach((o, k) => {
      const id2 = o === a ? IT.pureOf(a.id) : IT.compOf(a.id, o.id), E2 = IT.ELEMS[id2];
      const col = k % 2, row = Math.floor(k / 2), xx = dx + 8 + col * Math.floor((dw - 16) / 2), yy = ly0 + 18 + row * 12;
      if (!E2 || yy > dy + dh - 62) return;
      A(this, sc.add.rectangle(xx, yy + 2, 6, 6, E2.color).setOrigin(0).setStrokeStyle(1, 0x2a1a10), 206);
      at(this, xx + 10, yy, `${o.name} → `, "tiny", ALB.C.label);
      bold(this, xx + 10 + 34, yy, E2.name, "tiny", o === b ? "#8a1a0e" : ALB.C.ink);
    });
    grooveP(this, dx + 6, dy + dh - 48, dw - 12);
    at(this, dx + 8, dy + dh - 42, pure ? "같은 적에게 다시 터지려면 1.2초" : "같은 적에게 다시 터지려면 0.9초", "tiny", ALB.C.label);
  };
  return { FrShop, FrLoadout, Training, Board };
}
