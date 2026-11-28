// 자연 지형 구역(설계도)의 움직이는 장식 층: 지형·소품은 구워 둔 그림이고, 그 위에 살아 있는 것만 얹는다
//   불빛 일렁임(횃불·화로·초·샹들리에·제단·벽감) · 빛 맥박(수정·버섯·창) · 불티 · 창 빛줄기와 먼지
//   종유석 물방울(떨어져 튄다) · 수면 반짝임 · 섬 나무 잎 날림
// 플랜(P.props·P.spec·P.trees)에서 자리를 받고, 화면 근처 것만 그린다 (구역 좌표 + 구역 왼쪽 끝 = 화면 세계 좌표)
import { propSize } from "./natprops.js";
let R = null;
export const bindAnim = (r) => (R = r);

// 빛: [반지름, 색, 밝기, 일렁임(불)이면 1]
const LIGHT = {
  p_torch: [70, 0xffa040, 0.24, 1], p_brazier: [92, 0xff9038, 0.3, 1], p_candles: [40, 0xffc060, 0.17, 1], p_chand: [84, 0xffc060, 0.24, 1],
  p_altar: [52, 0xffc060, 0.17, 1], p_niche: [34, 0xffc060, 0.15, 1], p_crystal: [56, 0, 0.2, 0], p_shroom: [44, 0, 0.18, 0], p_window: [70, 0xd0ecff, 0.13, 0],
  p_font: [52, 0x9af4ff, 0.22, 0],
};
// 빛 중심: 그림 높이에 대한 비율 (바닥 소품은 붙는 점에서 위로, 매단 소품은 아래로)
const AT = { p_torch: 0.86, p_brazier: 0.72, p_candles: 0.6, p_chand: 0.78, p_altar: 0.72, p_niche: 0.35, p_crystal: 0.45, p_shroom: 0.5, p_window: 0.5, p_font: 0.5 };

function mkTex(sc) {
  if (sc.textures.exists("na_halo")) return;
  const cv = (w, h, f) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    f(c.getContext("2d"), w, h);
    return c;
  };
  sc.textures.addCanvas("na_px", cv(2, 2, (x) => ((x.fillStyle = "#fff"), x.fillRect(0, 0, 2, 2))));
  sc.textures.addCanvas("na_drop", cv(2, 5, (x) => ((x.fillStyle = "#fff"), x.fillRect(0, 1, 2, 4), x.fillRect(0, 0, 1, 1))));
  sc.textures.addCanvas("na_line", cv(10, 1, (x) => {
    const g = x.createLinearGradient(0, 0, 10, 0);
    g.addColorStop(0, "rgba(255,255,255,0)"), g.addColorStop(0.5, "rgba(255,255,255,1)"), g.addColorStop(1, "rgba(255,255,255,0)");
    (x.fillStyle = g), x.fillRect(0, 0, 10, 1);
  }));
  sc.textures.addCanvas("na_halo", cv(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.95)"), g.addColorStop(0.3, "rgba(255,255,255,0.42)"), g.addColorStop(0.65, "rgba(255,255,255,0.12)"), g.addColorStop(1, "rgba(255,255,255,0)");
    (x.fillStyle = g), x.fillRect(0, 0, 64, 64);
  }));
  // 가장자리 어둠: 가운데는 투명, 바깥으로 갈수록 검게
  sc.textures.addCanvas("na_vig", cv(256, 256, (x) => {
    const g = x.createRadialGradient(128, 128, 40, 128, 128, 182);
    g.addColorStop(0, "rgba(0,0,0,0)"), g.addColorStop(0.45, "rgba(0,0,0,0.25)"), g.addColorStop(0.8, "rgba(0,0,0,0.75)"), g.addColorStop(1, "rgba(0,0,0,1)");
    (x.fillStyle = g), x.fillRect(0, 0, 256, 256);
  }));
  sc.textures.addCanvas("na_ray", cv(32, 128, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(255,255,255,0.9)"), g.addColorStop(0.6, "rgba(255,255,255,0.35)"), g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    // 가운데가 짙고 양옆이 옅은 기둥 (줄 몇 개)
    for (let i = 0; i < 32; i++) ((x.globalAlpha = 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / 32) * (0.7 + 0.3 * Math.sin(i * 1.7))), x.fillRect(i, 0, 1, 128));
  }));
}
const hash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// 구역이 바뀌면 자리 목록을 새로 만든다
const SIZE = new Map();
const sizeOf = (k, s) => {
  const key = k + ":" + s;
  SIZE.has(key) || SIZE.set(key, propSize(k, s));
  return SIZE.get(key);
};
function build(A, P) {
  const lights = [], drips = [], wins = [], trees = [];
  for (const p of P.props ?? []) {
    const L = LIGHT[p.k];
    if (p.k === "p_oak" || p.k === "p_pine") {
      const [w0, h1] = sizeOf(p.k, p.s);
      trees.push({ x: p.x, y: p.y - h1 * 0.62, w: w0, t: hash(p.x, p.y) * 6 });
      continue;
    }
    if (!LIGHT[p.k] && p.k !== "p_stalac") continue;
    const [, h0] = p.ext ? [0, p.s] : sizeOf(p.k, p.s);
    const h = h0 * (p.sc ?? 1);
    if (L) {
      const cy = p.hang ? p.y + h * AT[p.k] : p.y - h * AT[p.k];
      lights.push({ x: p.x, y: cy, r: L[0] * Math.sqrt(p.sc ?? 1), tint: L[1] || (p.acc ?? 0x80d0ff), a: L[2], fire: L[3], ph: hash(p.x, p.y) * 6.28, k: p.k, sp: 0, bg: !!p.bg });
      p.k === "p_window" && wins.push({ x: p.x, y: p.y - h * 0.8, w: 20 * (p.sc ?? 1) * (1 + p.s * 0.3), len: 150 + p.s * 30, ph: hash(p.y, p.x) * 6.28, dt: 0, bg: !!p.bg });
    }
    if (p.k === "p_stalac" && p.fall > 40 && !p.bg) drips.push({ x: p.x + (hash(p.x, 3) - 0.5) * 6, y: p.y + h * 0.9, fall: p.fall - h * 0.9, t: 1 + hash(p.x, p.y) * 4 });
  }
  for (const T of P.trees ?? []) trees.push({ x: T.x, y: T.y - 40, w: T.w, t: hash(T.x, T.y) * 6 });
  const water = (P.spec ?? []).filter((r) => (r.t === 3 || r.t === 11 || r.t === 12) && r.x1 - r.x0 >= 24).map((r) => ({ ...r, n: Math.max(1, Math.floor((r.x1 - r.x0) / 46)) }));
  lights.sort((a, b) => a.x - b.x);
  Object.assign(A, { lights, drips, wins, trees, water });
}
function ensure(sc) {
  if (sc._na && sc._na.scene === sc && sc._na.alive) return sc._na;
  mkTex(sc);
  const A = { scene: sc, alive: true, key: null, halos: [], rays: [], lines: [], parts: [], t: 0, vig: null, va: 0 };
  sc.events.once("shutdown", () => (A.alive = false));
  sc._na = A;
  return A;
}
const ADD = () => R.zt.BlendModes.ADD;
const pool = (sc, arr, i, key, depth, add = true) => {
  let o = arr[i];
  if (!o) {
    o = sc.add.image(0, 0, key).setDepth(depth);
    add && o.setBlendMode(ADD());
    arr[i] = o;
  }
  return o.setVisible(true);
};
// 작은 알갱이 (불티·먼지·물방울·튀김·잎): 직접 움직인다
function spawn(A, sc, o) {
  let q = A.parts.find((p) => !p.on);
  if (!q) {
    if (A.parts.length > 220) return;
    q = { img: sc.add.image(0, 0, "na_px").setDepth(2.6) };
    A.parts.push(q);
  }
  Object.assign(q, { on: true, life: o.life, age: 0, x: o.x, y: o.y, vx: o.vx ?? 0, vy: o.vy ?? 0, g: o.g ?? 0, sway: o.sway ?? 0, a: o.a ?? 1, fade: o.fade ?? 1, stopY: o.stopY ?? null, onStop: o.onStop ?? null, ph: Math.random() * 6.28 });
  q.img.setTexture(o.tex ?? "na_px").setTint(o.tint ?? 0xffffff).setScale(o.s ?? 1).setAlpha(q.a).setVisible(true).setBlendMode(o.add === false ? 0 : ADD()).setPosition(o.x, o.y);
}
// 동굴 안 가장자리 어둠: 땅속이거나 뒷벽으로 둘러싸인 곳(섬 속 굴·신전·던전)에 있으면 화면 가장자리가 은은하게 어두워진다
function vignette(A, sc, dt, src) {
  let target = 0;
  if (src) {
    const P = src.P, px = sc.player.cx - src.ox, py = sc.player.cy;
    const inside = (P.walls ?? []).some((w) => px >= w.x0 && px < w.x1 && py >= w.y0 && py < w.y1);
    const surf = P.h ? P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(px / 4)))] : 1e9;
    target = inside ? 0.34 : py > surf + 24 ? 0.26 : 0;
  }
  A.va += (target - A.va) * Math.min(1, dt * 2.2);
  if (A.va < 0.005 && !target) return void (A.vig && A.vig.setVisible(false));
  const cam = sc.cameras.main;
  A.vig ??= sc.add.image(0, 0, "na_vig").setScrollFactor(0).setDepth(39.5);
  A.vig.setVisible(true).setPosition(cam.width / 2, cam.height / 2).setDisplaySize(cam.width * 1.15, cam.height * 1.25).setAlpha(A.va);
}
export function update(sc, dt, src) {
  if (!R || !sc.world || !sc.player) return;
  const A = ensure(sc);
  vignette(A, sc, dt, src);
  if (!src) {
    if (A.key) {
      for (const o of [...A.halos, ...A.rays, ...A.lines]) o && o.setVisible(false);
      A.wg && A.wg.clear();
      for (const p of A.parts) ((p.on = false), p.img.setVisible(false));
      A.key = null;
    }
    return;
  }
  if (A.key !== src.key) (build(A, src.P), (A.key = src.key));
  A.t += dt;
  const t = A.t, cam = sc.cameras.main, ox = src.ox, M = 220;
  // 뒷벽 소품(창·벽감·벽 수정)은 뒷벽 층과 같은 깊이로 (depth.js가 매 프레임 정한다)
  const wp = sc._dp?.wp;
  const PX = (b, x) => (b && wp ? wp.vx + (x - wp.vx) * wp.s : x), PY = (b, y) => (b && wp ? wp.vy + (y - wp.vy) * wp.s : y), PS = (b) => (b && wp ? wp.s : 1);
  const vx0 = cam.scrollX - ox - M, vx1 = cam.scrollX + cam.width / cam.zoom - ox + M, vy0 = cam.scrollY - M, vy1 = cam.scrollY + cam.height / cam.zoom + M;
  // ── 빛무리 ──
  let nh = 0;
  const L = A.lights;
  let lo = 0, hi = L.length;
  while (lo < hi) ((hi + lo) >> 1, L[(lo + hi) >> 1].x < vx0 ? (lo = ((lo + hi) >> 1) + 1) : (hi = (lo + hi) >> 1));
  for (let i = lo; i < L.length && L[i].x < vx1; i++) {
    const l = L[i];
    if (l.y < vy0 || l.y > vy1) continue;
    const f = l.fire ? 0.8 + 0.13 * Math.sin(t * 11 + l.ph) + 0.09 * Math.sin(t * 23.7 + l.ph * 2) + 0.05 * Math.sin(t * 41 + l.ph * 3) : 0.72 + 0.28 * Math.sin(t * 1.7 + l.ph);
    const o = pool(sc, A.halos, nh++, "na_halo", 1.6);
    o.setTint(l.tint).setAlpha(l.a * f).setScale((l.r / 32) * PS(l.bg) * (l.fire ? 1 + 0.05 * Math.sin(t * 8.3 + l.ph) : 1)).setPosition(PX(l.bg, ox + l.x), PY(l.bg, l.y));
    // 불티: 화로·횃불에서 가끔 위로
    if (l.fire && (l.k === "p_brazier" || l.k === "p_torch") && Math.random() < dt * (l.k === "p_brazier" ? 4 : 1.6))
      spawn(A, sc, { x: PX(l.bg, ox + l.x) + (Math.random() - 0.5) * 6, y: PY(l.bg, l.y) - 4, vx: (Math.random() - 0.5) * 10, vy: -26 - Math.random() * 24, sway: 12, life: 0.7 + Math.random() * 0.8, tint: Math.random() < 0.5 ? 0xffd070 : 0xff7a30, s: 0.5 });
    // 수정·버섯: 가끔 떠오르는 빛 알갱이
    if (!l.fire && l.k !== "p_window" && Math.random() < dt * 0.6)
      spawn(A, sc, { x: PX(l.bg, ox + l.x) + (Math.random() - 0.5) * 14, y: PY(l.bg, l.y) + 4, vy: -10 - Math.random() * 8, sway: 6, life: 1.6 + Math.random(), tint: l.tint, s: 0.5, a: 0.8 });
  }
  for (let i = nh; i < A.halos.length; i++) A.halos[i].setVisible(false);
  // ── 창 빛줄기 + 그 안에 떠도는 먼지 ──
  let nr = 0;
  for (const w of A.wins) {
    if (w.x < vx0 || w.x > vx1 || w.y < vy0 || w.y > vy1) continue;
    const o = pool(sc, A.rays, nr++, "na_ray", 1.4);
    o.setOrigin(0.5, 0).setRotation(-0.42).setTint(0xd8f0ff).setAlpha(0.1 + 0.04 * Math.sin(t * 0.9 + w.ph)).setScale((w.w / 32) * PS(w.bg), (w.len / 128) * PS(w.bg)).setPosition(PX(w.bg, ox + w.x), PY(w.bg, w.y));
    if (Math.random() < dt * 2.2) {
      const d = Math.random() * w.len * 0.9;
      spawn(A, sc, { x: PX(w.bg, ox + w.x) + Math.sin(0.42) * d + (Math.random() - 0.5) * w.w * 0.8, y: PY(w.bg, w.y) + Math.cos(0.42) * d, vx: (Math.random() - 0.5) * 4, vy: 3 + Math.random() * 4, sway: 3, life: 2 + Math.random() * 2, tint: 0xfff6e0, s: 0.5, a: 0.7 });
    }
  }
  for (let i = nr; i < A.rays.length; i++) A.rays[i].setVisible(false);
  // ── 종유석 물방울 ──
  for (const d of A.drips) {
    if (d.x < vx0 || d.x > vx1 || d.y < vy0 - 400 || d.y > vy1) continue;
    if ((d.t -= dt) > 0) continue;
    d.t = 2 + Math.random() * 4.5;
    const floor = d.y + d.fall;
    spawn(A, sc, {
      x: ox + d.x, y: d.y, g: 520, life: 4, tex: "na_drop", tint: 0xa8d8ff, a: 0.85, fade: 0, stopY: floor, add: false,
      onStop: (x, y) => {
        for (let k = 0; k < 4; k++) spawn(A, sc, { x, y: y - 1, vx: (Math.random() - 0.5) * 50, vy: -30 - Math.random() * 40, g: 300, life: 0.35, tint: 0xc8e8ff, s: 0.5, a: 0.9 });
      },
    });
  }
  // ── 물 덮개: 캐릭터(깊이 20)·적보다 앞에 반투명 물빛 → 물에 들어가면 잠겨 보인다 ──
  A.wg ??= sc.add.graphics().setDepth(22.5);
  A.wg.clear();
  for (const r of A.water) {
    if (r.x1 < vx0 || r.x0 > vx1 || r.y1 < vy0 || r.y0 > vy1) continue;
    const X = ox + r.x0, Wd = r.x1 - r.x0, Hd = r.y1 - r.y0;
    A.wg.fillStyle(0x2f6fb8, 0.34).fillRect(X, r.y0 + 3, Wd, Hd - 3);
    A.wg.fillStyle(0x7fc4f0, 0.35).fillRect(X, r.y0 + 2, Wd, 2);
    A.wg.fillStyle(0x0c2448, 0.18).fillRect(X, r.y0 + Math.min(Hd, 26), Wd, Math.max(0, Hd - 26));
  }
  // ── 수면 반짝임 (흘러가는 밝은 줄) ──
  let nl = 0;
  for (const r of A.water) {
    if (r.x1 < vx0 || r.x0 > vx1 || r.y0 < vy0 || r.y0 > vy1) continue;
    const W = r.x1 - r.x0;
    for (let k = 0; k < r.n; k++) {
      const sp = 8 + (k % 3) * 5, u = ((k / r.n) * W + t * sp * (k % 2 ? 1 : -1)) % W, x = r.x0 + (u < 0 ? u + W : u);
      const o = pool(sc, A.lines, nl++, "na_line", 22.6);
      o.setTint(0xffffff).setAlpha(0.35 + 0.3 * Math.sin(t * 2.3 + k * 1.9)).setScale(1 + (k % 2), 1).setPosition(ox + x, r.y0 + 2 + (k % 3));
    }
  }
  for (let i = nl; i < A.lines.length; i++) A.lines[i].setVisible(false);
  // ── 섬·지표 나무 잎 날림 ──
  for (const T of A.trees) {
    if (T.x < vx0 || T.x > vx1 || T.y < vy0 || T.y > vy1) continue;
    if ((T.t -= dt) > 0) continue;
    T.t = 2.5 + Math.random() * 5;
    spawn(A, sc, { x: ox + T.x + (Math.random() - 0.5) * T.w * 0.6, y: T.y - Math.random() * 40, vx: -10 - Math.random() * 10, vy: 14 + Math.random() * 10, sway: 22, life: 4.5, tint: Math.random() < 0.7 ? 0x7cc04a : 0xe8c050, s: 1, a: 0.95, add: false });
  }
  // ── 알갱이 움직이기 ──
  for (const p of A.parts) {
    if (!p.on) continue;
    p.age += dt;
    if (p.age >= p.life) {
      ((p.on = false), p.img.setVisible(false));
      continue;
    }
    p.vy += p.g * dt;
    p.x += (p.vx + (p.sway ? Math.sin(p.age * 3 + p.ph) * p.sway : 0)) * dt;
    p.y += p.vy * dt;
    if (p.stopY != null && p.y >= p.stopY) {
      p.onStop && p.onStop(p.x, p.stopY);
      ((p.on = false), p.img.setVisible(false));
      continue;
    }
    const k = p.age / p.life;
    p.img.setPosition(p.x, p.y).setAlpha(p.a * (p.fade ? 1 - k * k : 1));
  }
}
