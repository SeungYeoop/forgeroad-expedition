// 화면 연출 1단계: 조명(어둠 + 광원), 색 보정·블룸·비네트, 캐릭터 외곽선·그림자, 타격감, 사망 연출, 플레이어 움직임 연출.
import * as V from "./vfx.js";

let R = null;
export function bindLook(refs) {
  R = refs;
}
const W = 640, H = 360;
const rnd = (a, b) => a + Math.random() * (b - a);

// 지역별 분위기: 어둠 농도, 어둠 색, 광원 색, 색 보정
const MOOD = {
  fire: { dark: 0, col: 0x1a0806, light: 0xffb070, sat: 0.05, con: 0.18 },
  ice: { dark: 0, col: 0x06101e, light: 0xc0e8ff, sat: -0.1, con: 0.15 },
  lightning: { dark: 0, col: 0x0a0818, light: 0xe0d8ff, sat: -0.05, con: 0.2 },
  wind: { dark: 0, col: 0x061410, light: 0xe0fff0, sat: -0.05, con: 0.12 },
  earth: { dark: 0, col: 0x100a04, light: 0xffd090, sat: -0.1, con: 0.2 },
  poison: { dark: 0, col: 0x0a1206, light: 0xd8ffa0, sat: -0.05, con: 0.18 },
  light: { dark: 0, col: 0x141006, light: 0xfff4d0, sat: -0.05, con: 0.12 },
  dark: { dark: 0, col: 0x08040e, light: 0xd8b0ff, sat: -0.15, con: 0.22 },
  none: { dark: 0, col: 0x08060c, light: 0xfff0d8, sat: -0.08, con: 0.16 },
};

function boot(sc) {
  const tex = sc.textures;
  if (!tex.exists("lk_light")) {
    const c = tex.createCanvas("lk_light", 128, 128);
    const g = c.context;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.35, "rgba(255,255,255,0.85)");
    gr.addColorStop(0.7, "rgba(255,255,255,0.3)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    c.refresh();
  }
}

// 장면 시작 시 한 번
function setup(sc) {
  boot(sc);
  const L = (sc.lk = { mood: MOOD.none, ents: new Map(), wasGround: !0, runT: 0, t: 0, flick: 0 });
  // 어둠 층: 매 프레임 채운 뒤 광원 자리를 지운다
  L.rt = sc.add.renderTexture(0, 0, W, H).setOrigin(0).setScrollFactor(0).setDepth(26);
  L.brush = sc.make.image({ key: "lk_light", add: !1 });
  L.glow = sc.add.renderTexture(0, 0, W, H).setOrigin(0).setScrollFactor(0).setDepth(26.5).setBlendMode(1).setAlpha(0.22);
  // 카메라 색 보정 (WebGL에서만)
  const cam = sc.cameras.main;
  try {
    if (cam.postFX && !cam._lkFx) {
      cam._lkFx = 1;
      L.cm = cam.postFX.addColorMatrix();
    }
  } catch (e) {}
  applyMood(sc);
  return L;
}
function applyMood(sc) {
  const L = sc.lk;
  if (!L?.cm) return;
  // 거점과 같은 색 보정: 채도 살짝 누르고 · 빛은 따뜻하게 · 대비 조금 (형광빛 금지)
  L.cm.reset();
  L.cm.saturate(-0.04);
  L.cm.multiply([1.04, 0.02, 0, 0, 0, 0.01, 1, 0.01, 0, 0, 0, 0.02, 0.92, 0, 0, 0, 0, 0, 1, 0], !0);
  L.cm.contrast(0.1, !0);
}
export function region(sc, reg) {
  const L = sc.lk ?? setup(sc);
  const el = reg?.element && MOOD[reg.element] ? reg.element : "none";
  L.mood = { ...MOOD[el] };
  /광산|동굴|심연|그림자|지하|무덤|밤/.test(reg?.name ?? "") && (L.mood.dark = 0);
  applyMood(sc);
}

// ── 매 프레임 ──
export function update(sc, dt) {
  const L = sc.lk ?? setup(sc);
  const p = sc.player;
  if (!p) return;
  L.t += dt;
  const cam = sc.cameras.main;
  const vx = cam.worldView.x, vy = cam.worldView.y, z = cam.zoom || 1;
  // 0) 하늘 너머: 높이 올라갈수록 하늘이 짙은 남색이 되고 별이 뜬다
  if (!L.alt) {
    const g = sc.add.graphics().setScrollFactor(0).setDepth(-96);
    for (let i = 0; i < 36; i++) g.fillStyle(0x0a1240 + i * 0x010102, 1).fillRect(0, i * 10, W, 10);
    for (let i = 0; i < 90; i++) g.fillStyle(0xffffff, Math.random() * 0.8 + 0.2).fillRect(Math.random() * W, Math.random() * H * 0.8, Math.random() < 0.15 ? 2 : 1, Math.random() < 0.15 ? 2 : 1);
    L.alt = g.setAlpha(0);
  }
  const maxY = (R.Oe ?? 896) - H;
  const up = Math.max(0, Math.min(1, (maxY - cam.scrollY) / Math.max(1, maxY)));
  L.alt.setAlpha(Math.max(0, (up - 0.35) / 0.65) * 0.95);
  // 1) 캐릭터 꾸미기 (외곽선·그림자)
  decorate(sc, L, dt);
  // 2) 플레이어 움직임 연출
  playerJuice(sc, L, dt);
  // 3) 조명
  const m = L.mood;
  L.rt.clear();
  L.glow.clear();
  if (!m.dark) return;
  L.rt.fill(m.col, m.dark);
  const B = L.brush;
  const light = (x, y, r, a = 1, glow = 0) => {
    const sx = (x - vx) * z, sy = (y - vy) * z;
    if (sx < -r || sx > W + r || sy < -r || sy > H + r) return;
    B.setScale((r * z) / 64).setAlpha(a).setPosition(sx, sy);
    L.rt.erase(B);
    if (glow) (B.setTint(glow).setAlpha(a * 0.8), L.glow.draw(B), B.clearTint());
  };
  L.flick = L.flick * 0.9 + rnd(-1, 1) * 0.1;
  light(p.cx, p.cy - 6, 150 + L.flick * 6, 1, m.light);
  light(p.cx, p.cy, 60, 1);
  for (const t of sc.targets()) if (!t.dead && t.sprite?.visible !== !1 && t.kind !== "object") light(t.body.x, t.body.y - t.body.h / 2, t.kind === "boss" ? 90 : t.isElite ? 52 : 34, 0.75);
  const V2 = sc.frv;
  if (V2) {
    for (const P of V2.ps) P.dead || light(P.x, P.y, 46 * (P.s?.scaleX ?? 1), 1, V.palOf(P.el)[2]);
    let n = 0;
    for (const it of V2.items) {
      const o = it.o;
      if (!o.active || o.blendMode !== 1 || o.alpha < 0.15 || ++n > 80) continue;
      light(o.x, o.y, Math.max(20, Math.min(160, (o.displayWidth + o.displayHeight) * 0.6)), Math.min(1, o.alpha + 0.2), o.tintTopLeft);
    }
  }
  for (const zn of sc.fr?.zones ?? []) light(zn.x, zn.y - 10, zn.r * 1.3, 0.7, zn.el ? V.palOf(zn.el)[2] : 0);
  for (const pr of sc.projectiles?.list ?? []) pr.active && light(pr.x, pr.y, pr.owner === "enemy" ? 30 : 40, 0.9, pr.owner === "enemy" ? 0xff6050 : 0xfff0c0);
  for (const k of sc.fr?.pickups ?? []) light(k.x, k.y, 34, 0.8, 0xffe0a0);
}

// 적·플레이어에 외곽선·그림자를 한 번씩 달아 준다
function decorate(sc, L, dt) {
  const add = (o, isP) => {
    const sp = o.sprite;
    if (!sp || L.ents.has(o)) return;
    const sh = sc.add.image(sp.x, sp.y, "vx_glow").setTint(0x000000).setAlpha(0.5).setDepth((sp.depth ?? 10) - 0.5);
    L.ents.set(o, { sh, bx: sp.scaleX, by: sp.scaleY, isP });
  };
  add(sc.player, !0);
  for (const t of sc.targets()) t.kind !== "object" && add(t);
  for (const [o, e] of L.ents) {
    const sp = o.sprite;
    if (!sp?.active || (o.dead && !e.isP)) {
      e.sh.destroy();
      L.ents.delete(o);
      continue;
    }
    const w = (o.body?.w ?? 16) * 1.3;
    const ground = o.body?.onGround !== !1;
    e.sh.setPosition(o.body.x, o.body.y + 1).setScale(w / 26, w / 110).setVisible(sp.visible !== !1 && ground && (o.isP ? !0 : !0)).setAlpha(ground ? 0.55 : 0);
  }
}

// 착지 먼지·찌그러짐, 달리기 먼지, 점프 늘어남
function playerJuice(sc, L, dt) {
  const p = sc.player, b = p.body, sp = p.sprite;
  if (!sp || p.dead) return;
  const g = !!b.onGround;
  if (g && !L.wasGround) {
    const hard = (L.fallV ?? 0) > 420;
    sc.fx.burst("dust", p.cx - 6, b.y - 1, hard ? 8 : 4, 0xc8b8a0);
    sc.fx.burst("dust", p.cx + 6, b.y - 1, hard ? 8 : 4, 0xc8b8a0);
    squash(sc, sp, hard ? 1.25 : 1.12, hard ? 0.75 : 0.88, hard ? 110 : 70);
    hard && sc.fx.shake(2);
  }
  if (!g && L.wasGround && b.vy < -50) {
    squash(sc, sp, 0.85, 1.18, 90);
    sc.fx.burst("dust", p.cx, b.y - 1, 5, 0xc8b8a0);
  }
  L.fallV = b.vy > 0 ? b.vy : 0;
  L.wasGround = g;
  if (g && Math.abs(b.vx) > 60) {
    L.runT -= dt;
    L.runT <= 0 && ((L.runT = 0.16), sc.fx.burst("dust", p.cx - Math.sign(b.vx) * 5, b.y - 1, 1, 0xb0a090));
  }
}
function squash(sc, sp, sx, sy, ms) {
  if (sp._lkSq) return;
  sp._lkSq = 1;
  const bx = sp.scaleX < 0 ? -1 : 1;
  sc.tweens.add({ targets: sp, scaleX: Math.abs(sp.scaleX) * sx * bx, scaleY: sp.scaleY * sy, duration: ms * 0.4, yoyo: !0, ease: "Quad.easeOut", onComplete: () => ((sp._lkSq = 0), sp.setScale(1 * bx < 0 ? -1 : 1, 1)) });
}

// ── 타격 ──
export function onHit(sc, T, C, dealt) {
  const L = sc.lk;
  if (!L || !T?.sprite || T.dead === void 0) return;
  const sp = T.sprite;
  const e = L.ents.get(T);
  // 맞은 적이 찌그러졌다 복원
  if (e && !sp._lkSq && dealt > 0) {
    sp._lkSq = 1;
    sc.tweens.add({ targets: sp, scaleX: e.bx * 1.18, scaleY: e.by * 0.84, duration: 45, yoyo: !0, onComplete: () => ((sp._lkSq = 0), sp.setScale(e.bx, e.by)) });
  }
  const heavy = C.heavy || dealt >= (sc.player?.stats?.atk ?? 10) * 3;
  // 타격 방향 섬광 줄기
  const x = T.body.x, y = T.body.y - T.body.h / 2;
  const dir = C.dir ?? (x < sc.player.cx ? -1 : 1);
  const s = sc.add.image(x, y, "vx_streak").setBlendMode(1).setDepth(33).setTint(0xffffff).setScale(heavy ? 4 : 2.6, heavy ? 3 : 2).setRotation(dir > 0 ? rnd(-0.4, 0.4) : Math.PI + rnd(-0.4, 0.4));
  sc.tweens.add({ targets: s, alpha: 0, scaleY: 0.2, duration: heavy ? 180 : 110, onComplete: () => s.destroy() });
  if (heavy) {
    const st = sc.add.image(x, y, "vx_star").setBlendMode(1).setDepth(33).setScale(4).setRotation(rnd(0, 1));
    sc.tweens.add({ targets: st, scale: 0.5, alpha: 0, angle: 45, duration: 220, onComplete: () => st.destroy() });
    zoomPunch(sc, 0.03);
  }
}
function zoomPunch(sc, k) {
  const cam = sc.cameras.main;
  if (cam._lkZ || sc.dying) return;
  cam._lkZ = 1;
  const z0 = cam.zoom;
  sc.tweens.addCounter({ from: 0, to: 1, duration: 140, onUpdate: (tw) => cam.setZoom(z0 * (1 + Math.sin(tw.getValue() * Math.PI) * k)), onComplete: () => ((cam._lkZ = 0), cam.setZoom(z0)) });
}

// ── 처치 ── 흩어지는 몸 + 혼 + 바닥 충격
export function onKill(sc, T) {
  const sp = T?.sprite;
  if (!sp) return;
  const x = T.body.x, y = T.body.y - T.body.h / 2;
  try {
    const ghost = sc.add.image(sp.x, sp.y, sp.texture.key, sp.frame.name).setOrigin(sp.originX, sp.originY).setScale(sp.scaleX, sp.scaleY).setFlipX(sp.flipX).setDepth(sp.depth + 0.1).setTintFill(0xffffff);
    sc.tweens.add({ targets: ghost, alpha: 0, scaleX: sp.scaleX * 1.3, scaleY: sp.scaleY * 0.2, duration: 260, ease: "Quad.easeIn", onComplete: () => ghost.destroy() });
  } catch (e) {}
  const big = T.isElite || T.kind === "boss";
  const n = big ? 40 : 18;
  for (let i = 0; i < n; i++) {
    const px = x + rnd(-T.body.w / 2, T.body.w / 2), py = y + rnd(-T.body.h / 2, T.body.h / 2);
    const d = sc.add.image(px, py, "vx_px").setDepth(32).setTint(i % 3 ? 0x2a1830 : 0xd0c0ff).setScale(rnd(1, 2.2));
    sc.tweens.add({ targets: d, x: px + rnd(-30, 30), y: py - rnd(10, 50), alpha: 0, duration: rnd(350, 700), ease: "Quad.easeOut", onComplete: () => d.destroy() });
  }
  const soul = sc.add.image(x, y, "vx_soft").setDepth(32).setBlendMode(1).setTint(0xb090ff).setScale(1.2);
  sc.tweens.add({ targets: soul, y: y - 46, alpha: 0, scale: 0.4, duration: 700, ease: "Sine.easeOut", onUpdate: () => Math.random() < 0.5 && sc.fx.burst("glow", soul.x + rnd(-3, 3), soul.y, 1, 0x9070e0), onComplete: () => soul.destroy() });
  const ring = sc.add.image(x, T.body.y - 2, "vx_ring").setDepth(9).setBlendMode(1).setTint(0xd0c0ff).setScale(0.2, 0.06);
  sc.tweens.add({ targets: ring, scaleX: big ? 2.6 : 1.4, scaleY: big ? 0.5 : 0.26, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
  big && (zoomPunch(sc, 0.05), sc.fx.shake(5));
}
