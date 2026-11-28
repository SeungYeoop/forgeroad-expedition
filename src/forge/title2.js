// 타이틀 화면 (2026-11-28 다듬기 4-7): 거점 「갈림길 요새」 마을을 그대로 배경으로 깔고 카메라가 천천히 훑는다
//   어두운 밤 → 불꽃 → 망치 소리와 함께 단조 로고가 내려앉음 → 아래 명령 띠가 솟아오른다. 아무 키나 누르면 연출을 건너뛴다
import * as UK from "./uikit.js";
import * as ALB from "./albkit.js";
let R = null;
export const bindTitle = (r) => (R = r);

// 모루 + 엇갈린 망치 문장 (픽셀, 명암 4단 · 2026-11-28)
function emblemKey(sc) {
  const key = "t2_emblem2";
  if (sc.textures.exists(key)) return key;
  const W = 96, Hh = 60, cv = document.createElement("canvas");
  cv.width = W;
  cv.height = Hh;
  const g = cv.getContext("2d");
  const px = (x, y, c, w = 1, h = 1) => ((g.fillStyle = c), g.fillRect(Math.round(x), Math.round(y), w, h));
  const OUT = "#120c08";
  // 엇갈린 망치: 굵은 나무 자루(3px, 결) + 큰 쇠머리(명암·모서리 빛)
  const hammer = (s) => {
    const x0 = s > 0 ? 22 : 74, dx = s > 0 ? 1 : -1;
    for (let i = 0; i < 40; i++) {
      const x = x0 + dx * i * 0.95, y = 10 + i;
      px(x - 2, y - 1, OUT, 5, 3);
    }
    for (let i = 0; i < 40; i++) {
      const x = x0 + dx * i * 0.95, y = 10 + i;
      px(x - 1, y, i % 7 === 3 ? "#5a3418" : "#8a5a30", 3, 1), px(x - 1 + (s > 0 ? 0 : 2), y, "#b07a44");
    }
    // 쇠머리 (자루 위 끝을 가로지름)
    const hx0 = x0 - 11, hy = 2;
    px(hx0 - 1, hy - 1, OUT, 24, 14);
    for (let j = 0; j < 12; j++) px(hx0, hy + j, j < 2 ? "#d8d2c8" : j < 5 ? "#9a948c" : j < 9 ? "#6a6660" : "#3e3a36", 22, 1);
    px(hx0, hy, "#f0ece4", 3, 12), px(hx0 + 19, hy, "#2a2624", 3, 12);
    px(hx0 + 8, hy + 3, "#4a4640", 6, 6), px(hx0 + 9, hy + 4, "#2a2624", 4, 4);
  };
  hammer(1), hammer(-1);
  // 모루: 뿔 + 윗면 + 허리 + 받침
  px(6, 31, OUT, 84, 12);
  for (let j = 0; j < 10; j++) px(8 + (j < 4 ? 0 : 6), 32 + j, j === 0 ? "#f0ece4" : j < 3 ? "#c8c2b8" : j < 6 ? "#8a8680" : "#5a5650", 80 - (j < 4 ? 0 : 6), 1);
  for (let k = 0; k < 14; k++) px(8 - k, 33 + Math.floor(k / 4), k < 2 ? "#c8c2b8" : "#9a948c", 1, Math.max(1, 5 - Math.floor(k / 3)));
  px(30, 42, OUT, 36, 9);
  for (let j = 0; j < 8; j++) px(31 + j, 42 + j, "#4a4640", 34 - j * 2, 1);
  px(20, 50, OUT, 56, 8);
  for (let j = 0; j < 6; j++) px(21, 51 + j, j === 0 ? "#8a8680" : j < 3 ? "#5e5850" : "#3a3632", 54, 1);
  // 모루 위 달군 쇠 + 불꽃 점
  px(40, 29, OUT, 16, 4), px(41, 30, "#ffd060", 14, 1), px(41, 31, "#ff7a20", 14, 1);
  for (const [x, y, c] of [[44, 24, "#ffe090"], [50, 21, "#ffb040"], [38, 22, "#ff8030"], [54, 26, "#ffd060"], [47, 18, "#fff0b0"]]) px(x, y, c, 2, 2);
  sc.textures.addCanvas(key, cv);
  return key;
}
// 단조 금속 글자: 위는 흰 금빛, 가운데 칼날 띠, 아래는 그을린 구리
function forgeText(sc, x, y, s, size) {
  const t = R.ct(sc, x, y, s, "title", "#f0c060", { fontSize: `${size}px`, stroke: "#160a04", strokeThickness: Math.round(size / 7), shadow: { offsetX: 0, offsetY: 3, color: "#000000", blur: 0, fill: !0, stroke: !0 } }).setOrigin(0.5).setScrollFactor(0);
  try {
    const g = t.context.createLinearGradient(0, 0, 0, t.height);
    g.addColorStop(0, "#fff6d8"), g.addColorStop(0.42, "#f2c872"), g.addColorStop(0.5, "#fff0c0"), g.addColorStop(0.58, "#c07a30"), g.addColorStop(1, "#5a2e10");
    t.setFill(g);
  } catch {}
  return t;
}
// 큰 수 줄이기 (칸 넘침 방지): 12,345 → 1.2만
const short = (n) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : n >= 1e4 ? `${(n / 1e4).toFixed(n >= 1e5 ? 0 : 1)}만` : n.toLocaleString());

// o: { ground(지면 y), items: [{label, primary, small, col, act}], stats, version, onPick }
// 구조 (2026-11-29 확정 C안): 위 레터박스 · 가운데 큰 로고 · 맨 아래 가로 명령 띠 (가운데 솟은 받침 위 진홍 시작)
export function buildTitle(sc, FG, o) {
  const W = R.ot, Hh = R.xt;
  // ── 배경: 거점 마을 (카메라가 천천히 훑는다) ──
  const H2 = FG.buildHub(sc, o.ground);
  for (const c of sc.children.list.slice()) c.type === "Text" && Math.abs((c.depth ?? 0) - 9) < 0.01 && c.destroy();
  const cam = sc.cameras.main;
  cam.setBounds(0, 0, FG.HUB_W ?? 2720, Hh);
  cam.scrollX = 260;
  sc.tweens.add({ targets: cam, scrollX: 1860, duration: 140000, ease: "Sine.easeInOut", yoyo: !0, repeat: -1 });
  sc.frTitleHub = H2;
  const top = sc.add.graphics().setScrollFactor(0).setDepth(60);
  for (let i = 0; i < 40; i++) top.fillStyle(0x0a0604, 0.5 * (1 - i / 40)).fillRect(0, i * 3, W, 3);
  UK.vignette(sc, 0.55, 61);
  ALB.makeArt(sc);
  const BY = Hh - 54; // 명령 띠 위쪽
  // ── 레터박스 (위) + 띠 위 그늘 ──
  const lb = sc.add.graphics().setScrollFactor(0).setDepth(70);
  lb.fillStyle(0x050406, 0.92).fillRect(0, 0, W, 14).fillStyle(0x8a6a3a, 0.5).fillRect(0, 14, W, 1);
  for (let i = 0; i < 20; i++) lb.fillStyle(0x050406, 0.5 * (i / 20)).fillRect(0, BY - 40 + i * 2, W, 2);
  const verT = R.ct(sc, W - 8, 3, o.version ?? "", "tiny", "#8a7a6a").setOrigin(1, 0).setDepth(73).setScrollFactor(0);
  // ── 로고 ──
  const L = sc.add.container(0, 0).setDepth(72).setScrollFactor(0);
  const glow = sc.add.image(W / 2, 104, "vx_glow").setTint(0xff9a40).setBlendMode(R.zt.BlendModes.ADD).setScale(11, 3.6).setAlpha(0.3).setScrollFactor(0);
  const em = sc.add.image(W / 2, 50, emblemKey(sc)).setScrollFactor(0);
  const t1 = forgeText(sc, W / 2, 112, "포지로드", 54);
  const t2 = R.ct(sc, W / 2, 148, "F  O  R  G  E  R  O  A  D", "small", "#d8b888", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0);
  const rule = sc.add.graphics().setScrollFactor(0);
  rule.fillStyle(0xd8a860, 0.8).fillRect(W / 2 - 130, 160, 100, 1).fillRect(W / 2 + 30, 160, 100, 1);
  rule.fillStyle(0xffe0a0, 1).fillTriangle(W / 2 - 4, 160, W / 2, 156, W / 2 + 4, 160).fillTriangle(W / 2 - 4, 160, W / 2, 164, W / 2 + 4, 160);
  L.add([glow, em, t1, t2, rule]);
  sc.tweens.add({ targets: glow, alpha: 0.16, duration: 1800, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  // ── 명령 띠: 모두 한 컨테이너 (아래에서 솟아오른다) ──
  const bar = sc.add.container(0, 0).setDepth(71).setScrollFactor(0);
  const put = (o2) => (bar.add(o2), o2);
  put(sc.add.image(-4, BY, ALB.darkPanelKey(sc, W + 8, Hh - BY + 6, 11)).setOrigin(0));
  put(sc.add.graphics()).fillStyle(0x050406, 0.8).fillRect(0, BY - 2, W, 1).fillStyle(0xd8a860, 0.6).fillRect(0, BY - 1, W, 1);
  // 가운데 솟은 받침 + 쇠 방패
  const PW = 200, PX = Math.round(W / 2 - PW / 2), PY = BY - 24;
  const pulse = put(sc.add.image(W / 2, PY + 29, "vx_glow").setTint(0xff3040).setBlendMode(R.zt.BlendModes.ADD).setScale(3.6, 1.2).setAlpha(0));
  put(sc.add.image(PX, PY, ALB.raisedKey(sc, PW, 36, 22)).setOrigin(0));
  const cr = put(sc.add.graphics()), CY = PY - 1;
  cr.fillStyle(0x08080a).fillTriangle(W / 2 - 11, CY, W / 2 + 11, CY, W / 2, CY + 14).fillRect(W / 2 - 11, CY - 6, 22, 7);
  cr.fillStyle(0x9a9aa2).fillTriangle(W / 2 - 9, CY, W / 2 + 9, CY, W / 2, CY + 11).fillRect(W / 2 - 9, CY - 5, 18, 6);
  cr.fillStyle(0x7a1a22).fillTriangle(W / 2 - 6, CY, W / 2 + 6, CY, W / 2, CY + 7).fillRect(W / 2 - 6, CY - 3, 12, 4);
  cr.fillStyle(0xf0c860).fillRect(W / 2 - 1, CY - 2, 2, 7).fillRect(W / 2 - 3, CY, 6, 2);
  // 왼쪽: 내 기록 2×2
  const S = o.stats ?? {};
  const rec = [[["탐험", `${short(S.runs ?? 0)}회`], ["골드", short(S.gold ?? 0)]], [["구역", `${S.zones ?? 0}/${S.zonesMax ?? 48}`], ["보스", `${S.bosses ?? 0}/${S.bossesMax ?? 12}`]]];
  const RX = 12, RY = BY + 10, CW = 50, RH = 15;
  const box = put(sc.add.graphics());
  box.fillStyle(0x060607, 0.6).fillRect(RX, RY, CW * 2, RH * 2).lineStyle(1, 0x3d3331).strokeRect(RX + 0.5, RY + 0.5, CW * 2 - 1, RH * 2 - 1);
  box.fillStyle(0x3d3331).fillRect(RX + CW, RY + 3, 1, RH * 2 - 6).fillRect(RX + 3, RY + RH, CW * 2 - 6, 1);
  rec.forEach((row, r) => row.forEach(([a, b], c) => {
    const x = RX + c * CW, y = RY + r * RH + 3;
    put(R.ct(sc, x + 5, y, a, "tiny", "#a89a8a", ALB.darkStyle));
    put(R.ct(sc, x + CW - 5, y, b, "tiny", "#f4e6d0", ALB.darkStyle).setOrigin(1, 0));
  }));
  // 단추
  const cy = BY + 18, menu = [];
  o.items.forEach((m, i) => {
    let P;
    if (m.primary) P = plate(sc, o, put, W / 2 - 78, PY + 12, 156, 34, m.label, "red", "big", i);
    else if (m.small) P = plate(sc, o, put, W - 104, cy, 92, 13, m.label, "steel", "tiny", i, m.armLabel);
    else P = plate(sc, o, put, (m.col ?? 0) ? W / 2 + PW / 2 - 4 : W / 2 - PW / 2 + 4 - 100, cy - 3, 100, 18, m.label, "navy", "small", i);
    menu.push(P);
  });
  // 시작 단추를 고르고 있으면 받침 뒤 진홍 빛이 맥박친다
  sc.tweens.add({ targets: pulse, alpha: { from: 0.12, to: 0.32 }, duration: 1100, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  menu[0] && (menu[0].onSel = (v) => pulse.setVisible(v));
  const sub = R.ct(sc, -200, -200, "", "tiny", "#000000").setVisible(!1);
  // ── 시작 연출: 불꽃 → 어둠이 걷힘 → 로고 쾅 → 띠가 아래에서 솟아오름 ──
  const black = sc.add.rectangle(0, 0, W, Hh, 0x000000, 1).setOrigin(0).setDepth(90).setScrollFactor(0);
  L.setAlpha(0).setY(-30);
  bar.setY(70);
  verT.setAlpha(0);
  let done = !1;
  const finish = () => {
    if (done) return;
    done = !0;
    sc.tweens.killTweensOf([black, L, bar, verT]);
    black.setAlpha(0), L.setAlpha(1).setY(0), bar.setY(0), verT.setAlpha(1);
  };
  sc.time.delayedCall(200, () => !done && sc.add.particles(W / 2, 102, "vx_px", { speed: { min: 60, max: 200 }, angle: { min: 200, max: 340 }, gravityY: 300, lifespan: 900, quantity: 26, emitting: !1, tint: [0xffd060, 0xff7020], blendMode: R.zt.BlendModes.ADD }).setScrollFactor(0).setDepth(91).explode(26));
  sc.tweens.add({ targets: black, alpha: 0, delay: 350, duration: 1300 });
  sc.tweens.add({
    targets: L, alpha: 1, y: 0, delay: 700, duration: 380, ease: "Back.easeIn",
    onComplete: () => {
      if (done) return;
      R.j.play("swingHeavy", 1), R.j.play("explosion", 0.35);
      sc.cameras.main.shake(180, 0.006);
      sc.add.particles(W / 2, 112, "vx_px", { speed: { min: 80, max: 260 }, angle: { min: 180, max: 360 }, gravityY: 420, lifespan: 800, quantity: 40, emitting: !1, tint: [0xfff0a0, 0xffa040, 0xff6020], blendMode: R.zt.BlendModes.ADD }).setScrollFactor(0).setDepth(71).explode(40);
    },
  });
  sc.tweens.add({ targets: bar, y: 0, delay: 1300, duration: 520, ease: "Cubic.easeOut", onComplete: () => (done = !0) });
  sc.tweens.add({ targets: verT, alpha: 1, delay: 1400, duration: 500 });
  // 떠다니는 불씨
  sc.add.particles(0, 0, "vx_px", { x: { min: 0, max: W }, y: Hh + 4, speedY: { min: -26, max: -10 }, speedX: { min: -6, max: 6 }, lifespan: 9000, frequency: 260, scale: { start: 0.7, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: [0xffb050, 0xff7030], blendMode: R.zt.BlendModes.ADD }).setScrollFactor(0).setDepth(62);
  // 가로 순서 (←→): 게시판 · 시작 · 설정 · 초기화
  return { menu, sub, finish, isDone: () => done, order: [1, 0, 2, 3] };
}
// 알약 단추 (st0: red 시작 · navy · steel 초기화). armLabel이 오면 그 글일 때 진홍으로 (초기화 확인)
function plate(sc, o, put, x, y, w, h, label, st0, font, i) {
  x = Math.round(x), y = Math.round(y);
  let st = st0, sel = !1, hov = !1;
  const P = {};
  if (st0 === "red") {
    const g = put(sc.add.graphics()), cy = y + h / 2;
    for (const s of [-1, 1]) {
      const ex = s < 0 ? x + 2 : x + w - 2;
      g.fillStyle(0x08080a).fillTriangle(ex, cy - 8, ex, cy + 8, ex + s * 13, cy);
      g.fillStyle(0x9a9aa2).fillTriangle(ex, cy - 6, ex, cy + 1, ex + s * 10, cy);
      g.fillStyle(0x4a4a52).fillTriangle(ex, cy + 1, ex, cy + 6, ex + s * 10, cy);
    }
  }
  const bg = put(sc.add.image(x, y, ALB.pillKey(sc, w, h, st)).setOrigin(0).setInteractive({ useHandCursor: !0 }));
  const col = () => (st === "red" ? "#ffe27a" : st === "steel" ? "#f0ece4" : ALB.C.gold);
  const dy = font === "big" ? 9 : font === "small" ? 6 : 4;
  const t = put(R.ct(sc, x + w / 2, y + Math.floor(h / 2) - dy, label, font, col(), ALB.darkStyle).setOrigin(0.5, 0));
  // 고르면 단추 아래 금색 쐐기
  const mark = put(sc.add.graphics()).setVisible(!1);
  mark.fillStyle(0xf0c860).fillTriangle(x + w / 2 - 4, y + h + 6, x + w / 2 + 4, y + h + 6, x + w / 2, y + h + 2);
  const upd = () => (bg.setTexture(ALB.pillKey(sc, w, h, st, sel || hov ? 1 : 0)), t.setColor(col()));
  bg.on("pointerover", () => ((hov = !0), upd(), o.onPick?.(i, !1)));
  bg.on("pointerout", () => ((hov = !1), upd()));
  bg.on("pointerdown", () => o.onPick?.(i, !0));
  P.select = (v) => ((sel = v), mark.setVisible(v), upd(), P.onSel?.(v));
  // 글이 바뀌면 (초기화 확인) 진홍으로 · 단추 폭을 넘으면 글을 줄인다
  P.set = (s) => {
    t.setText(s).setScale(1);
    t.width > w - 8 && t.setScale((w - 8) / t.width, 1);
    st = s === label ? st0 : "red";
    upd();
  };
  return P;
}
export function titleUpdate(sc, FG) {
  sc.frTitleHub && FG.hubParallax(sc, sc.frTitleHub);
}
