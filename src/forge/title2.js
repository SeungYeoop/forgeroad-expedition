// 타이틀 화면 (2026-11-28 다듬기 4-7): 거점 「갈림길 요새」 마을을 그대로 배경으로 깔고 카메라가 천천히 훑는다
//   어두운 밤 → 불꽃 → 망치 소리와 함께 단조 로고가 내려앉음 → 메뉴(철판 단추)가 나타난다. 아무 키나 누르면 연출을 건너뛴다
import * as UK from "./uikit.js";
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
// o: { ground(지면 y), items: [{label, sub, primary, small, act}], record(문자열), version }
export function buildTitle(sc, FG, o) {
  const W = R.ot, Hh = R.xt;
  // ── 배경: 거점 마을 ──
  const H2 = FG.buildHub(sc, o.ground);
  // 시설 이름표는 타이틀에서 지운다
  for (const c of sc.children.list.slice()) c.type === "Text" && Math.abs((c.depth ?? 0) - 9) < 0.01 && c.destroy();
  const cam = sc.cameras.main;
  cam.setBounds(0, 0, FG.HUB_W ?? 2720, Hh);
  cam.scrollX = 260;
  sc.tweens.add({ targets: cam, scrollX: 1860, duration: 140000, ease: "Sine.easeInOut", yoyo: !0, repeat: -1 });
  sc.frTitleHub = H2;
  // 로고 쪽을 읽기 좋게: 위쪽 어둡게 + 가장자리
  const top = sc.add.graphics().setScrollFactor(0).setDepth(60);
  for (let i = 0; i < 40; i++) top.fillStyle(0x0a0604, 0.5 * (1 - i / 40)).fillRect(0, i * 3, W, 3);
  for (let i = 0; i < 24; i++) top.fillStyle(0x0a0604, 0.45 * (i / 24)).fillRect(0, Hh - 110 + i * 5, W, 5);
  UK.vignette(sc, 0.55, 61);
  // ── 로고 ──
  const L = sc.add.container(0, 0).setDepth(70).setScrollFactor(0);
  const glow = sc.add.image(W / 2, 74, "vx_glow").setTint(0xff9a40).setBlendMode(R.zt.BlendModes.ADD).setScale(9, 3.2).setAlpha(0.32).setScrollFactor(0);
  const em = sc.add.image(W / 2, 32, emblemKey(sc)).setScrollFactor(0).setScale(0.9);
  const t1 = forgeText(sc, W / 2, 88, "포지로드", 46);
  const t2 = R.ct(sc, W / 2, 120, "F  O  R  G  E  R  O  A  D", "small", "#d8b888", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0);
  const rule = sc.add.graphics().setScrollFactor(0);
  rule.fillStyle(0xd8a860, 0.8).fillRect(W / 2 - 120, 132, 90, 1).fillRect(W / 2 + 30, 132, 90, 1);
  rule.fillStyle(0xffe0a0, 1).fillTriangle(W / 2 - 4, 132, W / 2, 128, W / 2 + 4, 132).fillTriangle(W / 2 - 4, 132, W / 2, 136, W / 2 + 4, 132);
  L.add([glow, em, t1, t2, rule]);
  sc.tweens.add({ targets: glow, alpha: 0.18, duration: 1800, yoyo: !0, repeat: -1, ease: "Sine.easeInOut" });
  // ── 메뉴 (철판 단추) ──
  const menu = [];
  const MY = 228;
  o.items.forEach((m, i) => {
    let x, y, w, h;
    if (m.primary) (w = 210), (h = 30), (x = W / 2 - w / 2), (y = MY);
    else if (m.small) (w = 120), (h = 18), (x = W / 2 - w / 2), (y = MY + 76);
    else (w = 102), (h = 24), (x = W / 2 - 105 + (m.col ?? 0) * 108), (y = MY + 40);
    const P = UK.plate(sc, x, y, w, h, m.label, () => o.onPick?.(i, !0), { primary: m.primary, small: !m.primary, depth: 72, font: m.primary ? "big" : m.small ? "tiny" : "small", onHover: () => o.onPick?.(i, !1) });
    menu.push(P);
  });
  const sub = R.ct(sc, W / 2, MY - 16, "", "tiny", "#f0dcb8", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5).setDepth(72).setScrollFactor(0);
  const foot = [
    R.ct(sc, 14, Hh - 16, o.record ?? "", "tiny", "#d8c8a8", { stroke: "#140a04", strokeThickness: 2 }).setDepth(72).setScrollFactor(0),
    R.ct(sc, W - 14, Hh - 16, `↑↓ 선택 · Enter 확인    ${o.version ?? ""}`, "tiny", "#b8a888", { stroke: "#140a04", strokeThickness: 2 }).setOrigin(1, 0).setDepth(72).setScrollFactor(0),
  ];
  const ui = [...menu.flatMap((P) => P.objs), sub, ...foot];
  // ── 시작 연출 ──
  const black = sc.add.rectangle(0, 0, W, Hh, 0x000000, 1).setOrigin(0).setDepth(90).setScrollFactor(0);
  L.setAlpha(0).setY(-30);
  for (const u of ui) u.setAlpha(0);
  let done = !1;
  const finish = () => {
    if (done) return;
    done = !0;
    sc.tweens.killTweensOf([black, L, ...ui]);
    black.setAlpha(0), L.setAlpha(1).setY(0);
    for (const u of ui) u.setAlpha(1);
  };
  // 불꽃 몇 점 → 어둠이 걷힘 → 로고 쾅 → 메뉴
  sc.time.delayedCall(200, () => !done && sc.add.particles(W / 2, 90, "vx_px", { speed: { min: 60, max: 200 }, angle: { min: 200, max: 340 }, gravityY: 300, lifespan: 900, quantity: 26, emitting: !1, tint: [0xffd060, 0xff7020], blendMode: R.zt.BlendModes.ADD }).setScrollFactor(0).setDepth(91).explode(26));
  sc.tweens.add({ targets: black, alpha: 0, delay: 350, duration: 1300 });
  sc.tweens.add({
    targets: L,
    alpha: 1,
    y: 0,
    delay: 700,
    duration: 380,
    ease: "Back.easeIn",
    onComplete: () => {
      if (done) return;
      R.j.play("swingHeavy", 1), R.j.play("explosion", 0.35);
      sc.cameras.main.shake(180, 0.006);
      sc.add.particles(W / 2, 100, "vx_px", { speed: { min: 80, max: 260 }, angle: { min: 180, max: 360 }, gravityY: 420, lifespan: 800, quantity: 40, emitting: !1, tint: [0xfff0a0, 0xffa040, 0xff6020], blendMode: R.zt.BlendModes.ADD }).setScrollFactor(0).setDepth(71).explode(40);
    },
  });
  sc.tweens.add({ targets: ui, alpha: 1, delay: 1400, duration: 600, onComplete: () => (done = !0) });
  // 떠다니는 불씨
  sc.add.particles(0, 0, "vx_px", { x: { min: 0, max: W }, y: Hh + 4, speedY: { min: -26, max: -10 }, speedX: { min: -6, max: 6 }, lifespan: 9000, frequency: 260, scale: { start: 0.7, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: [0xffb050, 0xff7030], blendMode: R.zt.BlendModes.ADD }).setScrollFactor(0).setDepth(62);
  return { menu, sub, finish, isDone: () => done };
}
export function titleUpdate(sc, FG) {
  sc.frTitleHub && FG.hubParallax(sc, sc.frTitleHub);
}
