// 장치 (자연 지형 구역): 플레이어가 다루는 것과 살아 움직이는 지형
//   이동 (devMove — main.js 플레이어 update가 부른다):
//     사다리(6)·밧줄(7)·덩굴(8): 위·아래 키로 매달려 오르내린다, 점프(스페이스)로 뛰어내린다, 꼭대기에서 올라선다
//     짚라인(9): 줄 밑에서 위 키(W·↑)를 누르고 있으면 매달려 낮은 쪽으로 미끄러진다, 점프·아래 키로 놓는다
//     바람 기둥(10): 들어가면 떠오른다 (아래 키로 천천히 내려간다) · 물살(11·12): 물속에서 한쪽으로 떠밀린다
//   움직이는 지형 (update — 매 프레임, 화면 근처만):
//     무너지는 발판(13): 밟으면 흔들리다 떨어지고 잠시 뒤 다시 생긴다
//     금 간 벽(14): 때려서 부수면 숨은 길이 열린다 (그 판 동안)
//     승강기(15): 발판이 길 위아래 끝을 오가며 태워 나른다
//     떨어지는 종유석(16): 밑을 지나면 떨어져 다친다, 다시 자란다
//     간헐천(17): 몇 초마다 물기둥(포자)이 뿜어 높이 띄운다
//     하늘 나룻 바구니(20): 줄에 매달린 바구니가 두 섬 나루 사이를 옆으로 오간다
//     도개교(21): 다리 판이 주기마다 경첩 쪽으로 들렸다 내려온다 (놓였을 때 건넌다)
//     덩굴 그네(22): 위 키로 잡아 진자처럼 흔들고, 점프로 놓아 날아간다
import * as G3 from "./bg3d.js";
let R = null;
export const bindDevices = (r) => (R = r);
const near = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));

// ── 플레이어 이동 ──
export function devMove(pl, C, T, dt, spd, h) {
  const W = pl.host?.world ?? pl.host?.collider;
  if (!W || !W.devAt) return;
  const d = W.devAt(C);
  pl.zipT = Math.max(0, (pl.zipT ?? 0) - dt);
  // 짚라인
  if (pl.zip) {
    const r = pl.zip.r, lo = Math.min(r.ax, r.bx), hi = Math.max(r.ax, r.bx), zx = d.zx;
    const end = pl.zip.dir > 0 ? zx >= hi - 6 : zx <= lo + 6;
    if (end || (T.jump && pl.zipT <= 0) || T.down || C.hitWall || zx < lo - 20 || zx > hi + 20) {
      pl.zip = null;
      T.jump && pl.zipT <= 0 && (C.vy = -420);
      pl.airJumps = Math.max(pl.airJumps, 1);
    } else {
      const slope = hi > lo ? Math.abs(r.by - r.ay) / (hi - lo) : 0;
      pl.zip.v = Math.min(200 + slope * 260, pl.zip.v + (240 + slope * 500) * dt);
      const nx = zx + pl.zip.dir * pl.zip.v * dt;
      const ly = hi > lo ? r.ay + ((r.by - r.ay) * (nx - r.ax)) / (r.bx - r.ax) : r.ay;
      C.vx = pl.zip.dir * pl.zip.v;
      C.vy = (ly + (C.h ?? 22) + 3 - C.y) / Math.max(dt, 1 / 120);
      pl.facing = pl.zip.dir;
      pl.airJumps = 1 + (pl.run?.extraJumps ?? 0);
      return;
    }
  } else if (d.zip && T.up && !C.onGround) {
    const r = d.zip;
    const dir = r.ay === r.by ? (h || pl.facing || 1) : Math.sign((r.ay > r.by ? r.ax : r.bx) - (r.ay > r.by ? r.bx : r.ax));
    pl.zip = { r, dir, v: Math.max(120, Math.abs(C.vx)) };
    pl.zipT = 0.3;
    pl.climb = 0;
    R?.j.play("swing", 0.7);
    return;
  }
  // 덩굴 그네: 잡은 자리 길이로 매달려 진자처럼 흔들린다 (좌우 키로 구른다), 점프로 놓으면 흔들리던 힘으로 날아간다
  pl.swingT = Math.max(0, (pl.swingT ?? 0) - dt);
  if (pl.swing) {
    const s = pl.swing, r = s.r, L = s.L;
    if ((T.jump && s.t <= 0) || T.down) {
      const vx = s.w * L * Math.cos(s.a), vy = -s.w * L * Math.sin(s.a);
      pl.swing = null;
      pl.swingT = 0.35;
      C.vx = Math.max(-520, Math.min(520, vx));
      C.vy = Math.min(0, vy) - (T.jump ? 380 : 0);
      pl.airJumps = Math.max(pl.airJumps, 1);
      return;
    }
    s.t -= dt;
    s.w += (-(1500 / L) * Math.sin(s.a) + h * 3 * Math.cos(s.a)) * dt;
    s.w *= 1 - 0.12 * dt;
    s.a = Math.max(-1.35, Math.min(1.35, s.a + s.w * dt));
    const tx = r.ax + Math.sin(s.a) * L, ty = r.ay + Math.cos(s.a) * L;
    C.vx = (tx - d.zx) / Math.max(dt, 1 / 120);
    C.vy = (ty + (C.h ?? 22) + 3 - C.y) / Math.max(dt, 1 / 120);
    pl.facing = s.w >= 0 ? 1 : -1;
    pl.airJumps = 1 + (pl.run?.extraJumps ?? 0);
    pl.climb = 0;
    return;
  } else if (d.swing && T.up && pl.swingT <= 0) {
    const r = d.swing, hy = C.y - (C.h ?? 22) - 3, L = Math.max(24, Math.min(r.len, hy - r.ay));
    const a = Math.asin(Math.max(-0.95, Math.min(0.95, (d.zx - r.ax) / L)));
    pl.swing = { r, a, L, w: ((C.vx || 0) / L) * Math.cos(a), t: 0.25 };
    pl.climb = 0;
    R?.j.play("swing", 0.7);
    return;
  }
  // 매달리기
  const cl = d.sp === 6 || d.sp === 7 || d.sp === 8;
  if (pl.climb && !cl) {
    pl.climb = 0;
    // 꼭대기: 위로 살짝 뛰어 바닥에 올라선다
    T.up && C.vy <= 0 && (C.vy = -300);
  }
  if (!pl.climb && cl && (T.up || (T.down && !C.onGround) || (T.down && C.onGround))) {
    pl.climb = 1;
    C.vx *= 0.3;
  }
  if (pl.climb) {
    if (T.jump && !T.up) {
      pl.climb = 0;
      C.vy = -430;
      C.vx = h * spd;
      return;
    }
    const sp = d.sp === 8 ? 95 : 125;
    C.vy = T.up ? -sp : T.down ? sp + 15 : 0;
    C.vx = h * (d.sp === 8 ? 80 : 60);
    T.down && (C.dropThrough = 0.15);
    pl.airJumps = 1 + (pl.run?.extraJumps ?? 0);
    h && (pl.facing = h);
    return;
  }
  // 바람: 위로 부는 기둥 / 옆으로 부는 바람 길 (밀면서 살짝 띄운다 — 틈을 건넌다)
  if (d.wind) {
    if (d.wind.dx) {
      C.vx = near(C.vx, d.wind.dx * (d.wind.pow ?? 300), 1500 * dt);
      C.vy = near(C.vy, T.down ? 120 : -(d.wind.lift ?? 40), 1100 * dt);
      pl.facing = d.wind.dx > 0 ? 1 : -1;
    } else C.vy = near(C.vy, T.down ? 70 : -(d.wind.pow ?? 250), 1500 * dt);
    pl.airJumps = Math.max(pl.airJumps, 1);
  }
  // 물살
  if (d.cur && C.inWater) C.vx = Math.max(-spd - 110, Math.min(spd + 110, C.vx + d.cur * 560 * dt));
}

// ── 움직이는 지형 ──
function mkTex(sc) {
  if (sc.textures.exists("dv_plank")) return;
  const cv = (k, w, h, f) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    f(c.getContext("2d"), w, h);
    sc.textures.addCanvas(k, c);
  };
  // 거점 화풍 붓: 5단 램프(밝음 따뜻 · 그늘 차갑게) + 2px 붓 결
  const pix = (k, w, h, f) => { const B = G3.buffer(w, h, !0); f(B); sc.textures.addCanvas(k, B.toCanvas()); };
  const hs = (a, b, c = 0) => { let v = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  const R5 = (c) => [mixc(shc(c, 0.36), 0xffe8c4, 0.15), shc(c, 0.14), c, mixc(shc(c, -0.32), 0x262230, 0.15), mixc(shc(c, -0.58), 0x161218, 0.3)];
  const T5 = (p2, v) => p2[v > 0.55 ? 0 : v > 0.18 ? 1 : v > -0.22 ? 2 : v > -0.58 ? 3 : 4];
  const WOOD = R5(0x7e5a38), IRN = R5(0x787470), STN = R5(0x847a6e), ROPE = R5(0xb09868);
  const grain = (x, y, sd) => (hs(x >> 1, y >> 1, sd) - 0.5) * 0.4 + (((x + Math.round(Math.sin(y * 0.9 + sd) * 2)) % 5) === 0 ? -0.25 : 0);
  // 무너지는 판: 금 간 나무판 (8px 높이, 16px마다 이어 붙인다) — 위 빛 · 아래 그늘 · 나뭇결 · 갈라진 금
  pix("dv_plank", 16, 8, (B) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
      let v = 0.15 + grain(x, y, 3) - (y === 7 ? 1 : y === 6 ? 0.45 : 0) + (y === 0 ? 0.6 : y === 1 ? 0.25 : 0);
      x === 15 && (v = -0.9);
      B.put(x, y, T5(WOOD, v));
    }
    for (const [x, y] of [[5, 2], [5, 3], [6, 4], [7, 4], [7, 5], [11, 3], [11, 4], [12, 5]]) B.put(x, y, WOOD[4]);
    B.put(3, 3, IRN[1]), B.put(13, 3, IRN[1]);
  });
  // 금 간 벽 (16px): 막돌 두 장 + 밝은 금 + 부스러기
  pix("dv_crack", 16, 16, (B) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const st = y < 8 ? (x < 9 ? 0 : 1) : x < 6 ? 2 : 3, lx = st === 1 ? x - 9 : st === 3 ? x - 6 : x, ly = y % 8, sw = st === 0 ? 9 : st === 1 ? 7 : st === 2 ? 6 : 10;
      let v = 0.2 - (lx / sw) * 0.5 - (ly / 8) * 0.4 + (hs(st, 1) - 0.5) * 0.4 + (hs(x >> 1, y >> 1, 4) - 0.5) * 0.35;
      (ly === 7 || lx === sw - 1) && (v = -0.9);
      ly === 0 && (v += 0.35);
      B.put(x, y, T5(STN, v));
    }
    for (const [x, y] of [[3, 3], [4, 4], [4, 5], [5, 6], [6, 6], [7, 7], [10, 9], [11, 9], [12, 10], [12, 11]]) B.put(x, y, 0x2a2420), B.put(x + 1, y, 0xd8c894);
  });
  // 도개교 판: 두꺼운 판자 + 쇠띠 + 못
  pix("dv_draw", 16, 8, (B) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
      let v = 0.05 + grain(x, y, 5) - (y === 7 ? 1 : 0) + (y === 0 ? 0.55 : 0);
      x === 7 && (v = -0.8);
      B.put(x, y, x === 12 || x === 13 ? T5(IRN, (x === 12 ? 0.3 : -0.2) + (y === 0 ? 0.4 : 0) - (y === 7 ? 0.8 : 0)) : T5(WOOD, v));
    }
    B.put(12, 2, IRN[0]), B.put(12, 5, IRN[0]);
  });
  // 승강기 발판: 판자 + 가운데 쇠 띠 + 밑 그늘
  pix("dv_lift", 16, 10, (B) => {
    for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) {
      let v = 0.1 + grain(x, y, 7) + (y === 0 ? 0.6 : y < 3 ? 0.25 : 0) - (y === 9 ? 1 : y === 8 ? 0.4 : 0);
      B.put(x, y, y === 4 ? T5(IRN, 0.3 - (x % 6 === 0 ? 0.5 : 0)) : T5(WOOD, v));
    }
  });
  pix("dv_cable", 2, 8, (B) => { for (let y = 0; y < 8; y++) B.put(0, y, ROPE[(y & 3) < 2 ? 1 : 3]), B.put(1, y, ROPE[(y & 3) < 2 ? 3 : 2]); });
  // 종유석 (떨어지는 것): 위가 넓은 뾰족돌, 왼쪽 빛 · 오른쪽 그늘 · 가로 결
  pix("dv_stal", 12, 28, (B) => {
    for (let y = 0; y < 28; y++) {
      const w = Math.max(1, 6 * Math.pow(1 - y / 28, 0.85));
      for (let x = Math.round(6 - w); x < Math.round(6 + w); x++) {
        const u = (x - 6) / w;
        let v = 0.3 - u * 0.8 + (hs(x >> 1, y >> 1, 8) - 0.5) * 0.3 - (y % 5 === 0 ? 0.25 : 0);
        Math.abs(u) > 0.82 && u > 0 && (v = -0.9);
        B.put(x, y, T5(STN, v));
      }
    }
  });
  cv("dv_px", 2, 2, (x) => ((x.fillStyle = "#fff"), x.fillRect(0, 0, 2, 2)));
  cv("dv_streak", 10, 1, (x) => {
    const g = x.createLinearGradient(0, 0, 10, 0);
    g.addColorStop(0, "rgba(255,255,255,0)"), g.addColorStop(0.7, "rgba(255,255,255,0.9)"), g.addColorStop(1, "rgba(255,255,255,0)");
    (x.fillStyle = g), x.fillRect(0, 0, 10, 1);
  });
  // 레버 (꺼짐·켜짐): 막돌 받침 + 둥근 나무 손잡이 + 쇠 머리, 켜면 초록 · 꺼지면 붉은 등
  for (const on of [0, 1])
    pix(on ? "dv_lever1" : "dv_lever0", 16, 24, (B) => {
      for (let y = 18; y < 24; y++) for (let x = 2; x < 14; x++) { let v = 0.25 - ((x - 2) / 12) * 0.6 + (hs(x >> 1, y >> 1, 11) - 0.5) * 0.3 + (y === 18 ? 0.4 : 0) - (y === 23 ? 0.8 : 0); (x === 2 || x === 13) && (v = -0.9); B.put(x, y, T5(STN, v)); }
      for (let i = 0; i < 14; i++) { const x = on ? 8 + i * 0.45 : 8 - i * 0.45, y = 18 - i; B.put(x, y, WOOD[1]), B.put(x + 1, y, WOOD[3]); }
      const hx = on ? 14 : 2;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) i * i + j * j <= 5 && B.put(hx + i, 4 + j, T5(IRN, -(i + j) / 3));
      const lc = on ? 0x8ac870 : 0xc86a50;
      B.put(8, 16, lc), B.put(7, 16, shc(lc, -0.3)), B.put(8, 15, shc(lc, 0.3));
    });
}
const mixc = (a, b, t) => { const g = (k) => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); return (g(16) << 16) | (g(8) << 8) | g(0); };
const shc = (c, f) => { const g = (k) => { const v = (c >> k) & 255; return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))); }; return (g(16) << 16) | (g(8) << 8) | g(0); };
const KEYGONE = new Set(); // 부서진 벽 (구역:자리) — 그 판 동안
const SWITCH = new Set(); // 켠 레버 (구역:이름) — 그 판 동안
let HEALMSG = 0;
function build(sc, src) {
  const A = { key: src.key, items: [], parts: [] };
  for (const r of src.P.spec ?? []) {
    if (r.t === 13) A.items.push({ k: "crumble", r, st: "solid", t: 0, spr: null });
    else if (r.t === 14) A.items.push({ k: "crack", r, hp: r.hp ?? 3, cd: 0, gone: KEYGONE.has(src.key + ":" + r.x0 + ":" + r.y0), spr: null });
    else if (r.t === 15) A.items.push({ k: "lift", r, y: r.y1 - 0, dir: -1, wait: 1, spr: null, cab: null });
    else if (r.t === 16) A.items.push({ k: "fall", r, st: "hang", y: r.y0, vy: 0, t: 0, spr: null });
    else if (r.t === 17) A.items.push({ k: "geyser", r, t: (r.x0 % 7) * 0.4, on: 0 });
    else if (r.t === 18) A.items.push({ k: "heal", r, t: 0 });
    else if (r.t === 19) A.items.push({ k: "lever", r, cd: 0, spr: null });
    else if (r.t === 20) A.items.push({ k: "ferry", r, x: r.x0, dir: 1, wait: 1, spr: null, cab: null });
    else if (r.t === 21) A.items.push({ k: "draw", r, t: r.ph ?? 0, spr: null });
  }
  // 레버로 잠긴 승강기: 처음엔 정한 끝(park)에 멈춰 있다
  for (const it of A.items) if (it.k === "lift" && it.r.lock) it.r.park === "up" ? ((it.y = it.r.y0), (it.dir = 1)) : ((it.y = it.r.y1), (it.dir = -1));
  return A;
}
function hide(it) {
  it.spr && it.spr.setVisible(false);
  it.cab && it.cab.setVisible(false);
}
export function update(sc, dt, src) {
  if (!R || !sc.world || !sc.player) return;
  const W = sc.world;
  if (!src) {
    sc._dv?.gfx?.clear();
    if (sc._dv) for (const it of sc._dv.items) hide(it);
    W.dyn && (W.dyn.length = 0);
    return;
  }
  mkTex(sc);
  if (!sc._dv || sc._dv.key !== src.key || sc._dv.scene !== sc) {
    if (sc._dv) for (const it of sc._dv.items) (it.spr && it.spr.destroy(), it.cab && it.cab.destroy());
    sc._dv?.gfx?.destroy();
    sc._dv = build(sc, src);
    sc._dv.scene = sc;
  }
  const A = sc._dv, ox = src.ox;
  const pl = sc.player, B = pl.body, px = B.x - ox, py = B.y;
  const cam = sc.cameras.main, M = 400;
  const vx0 = cam.scrollX - ox - M, vx1 = cam.scrollX + cam.width / cam.zoom - ox + M, vy0 = cam.scrollY - M, vy1 = cam.scrollY + cam.height / cam.zoom + M;
  // 전역 픽셀 = 구역 좌표 + 구역 왼쪽 끝 전역 픽셀
  const GX = src.gx0;
  const dyn = (W.dyn ??= []);
  dyn.length = 0;
  const standing = (x0, x1, top) => B.onGround && px >= x0 - 3 && px <= x1 + 3 && Math.abs(py - top) <= 2;
  const atk = pl.weapons?.attacking?.() ?? false;
  for (const it of A.items) {
    const r = it.r, vis = r.x1 > vx0 && r.x0 < vx1 && r.y1 > vy0 && r.y0 < vy1;
    if (it.k === "crumble") {
      if (it.st === "solid" && standing(r.x0, r.x1, r.y0)) ((it.st = "shake"), (it.t = 0.55), R.j.play("block", 0.5));
      else if (it.st === "shake" && (it.t -= dt) <= 0) ((it.st = "gone"), (it.t = 3.2));
      else if (it.st === "gone" && (it.t -= dt) <= 0) {
        const inside = px > r.x0 - 8 && px < r.x1 + 8 && py > r.y0 && py - 24 < r.y1;
        inside ? (it.t = 0.5) : (it.st = "solid");
      }
      it.st !== "gone" && dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: r.y0, y1: r.y1 });
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, r.x1 - r.x0, r.y1 - r.y0, "dv_plank").setOrigin(0, 0).setDepth(2.4);
      const sh = it.st === "shake" ? (Math.random() - 0.5) * 2 : 0;
      it.spr.setVisible(it.st !== "gone").setPosition(ox + r.x0 + sh, r.y0 + (it.st === "shake" ? Math.random() : 0)).setAlpha(it.st === "gone" ? 0 : 1);
    } else if (it.k === "crack") {
      if (it.gone) { hide(it); continue; }
      it.cd = Math.max(0, it.cd - dt);
      dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: r.y0, y1: r.y1 });
      // 때리기: 공격 중이고 바라보는 쪽 40px 안
      if (atk && it.cd <= 0) {
        const f = pl.facing ?? 1, ex = f > 0 ? r.x0 - px : px - r.x1;
        if (ex > -6 && ex < 40 && py > r.y0 && py - 22 < r.y1) {
          it.hp--, (it.cd = 0.3);
          sc.fx?.burst?.("chunk", ox + (f > 0 ? r.x0 : r.x1), py - 12, 5, 0x9a90a0);
          sc.fx?.shake?.(2);
          R.j.play("block", 0.7);
          if (it.hp <= 0) {
            it.gone = true;
            KEYGONE.add(src.key + ":" + r.x0 + ":" + r.y0);
            for (let y = r.y0; y < r.y1; y += 16) sc.fx?.burst?.("chunk", ox + (r.x0 + r.x1) / 2, y + 8, 6, 0x8a8094);
            sc.fx?.shake?.(5);
            R.j.play("thud");
            sc.fx?.text?.(ox + (r.x0 + r.x1) / 2, r.y0 - 8, "숨은 길!", "#ffe080");
            hide(it);
            continue;
          }
        }
      }
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, r.x1 - r.x0, r.y1 - r.y0, "dv_crack").setOrigin(0, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + r.x0, r.y0).setAlpha(1).setTint(it.hp < (r.hp ?? 3) ? 0xffd8c8 : 0xffffff);
    } else if (it.k === "lift") {
      // 발판 윗면 it.y: r.y0(위 끝) ~ r.y1(아래 끝)
      const w = r.x1 - r.x0;
      let dy = 0;
      const locked = r.lock && !SWITCH.has(src.key + ":" + r.lock);
      if (locked) it.wait = 0.5;
      else if (it.wait > 0) it.wait -= dt;
      else {
        const ny = it.y + it.dir * 95 * dt;
        if (ny <= r.y0) ((dy = r.y0 - it.y), (it.y = r.y0), (it.dir = 1), (it.wait = 1.4));
        else if (ny >= r.y1) ((dy = r.y1 - it.y), (it.y = r.y1), (it.dir = -1), (it.wait = 1.4));
        else ((dy = ny - it.y), (it.y = ny));
      }
      // 태우기: 서 있으면 같이 움직인다
      if (dy && B.onGround && px >= r.x0 - 3 && px <= r.x1 + 3 && Math.abs(py - (it.y - dy)) <= 3) B.y += dy;
      dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: Math.round(it.y), y1: Math.round(it.y) + 10 });
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, w, 10, "dv_lift").setOrigin(0, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + r.x0, Math.round(it.y));
      const top = (r.top ?? r.y0 - 60);
      it.cab ??= sc.add.tileSprite(0, 0, 2, 8, "dv_cable").setOrigin(0.5, 0).setDepth(2.3);
      it.cab.setVisible(true).setPosition(ox + (r.x0 + r.x1) / 2, top).setSize(2, Math.max(2, it.y - top));
    } else if (it.k === "ferry") {
      // 하늘 나룻 바구니: 줄에 매달려 두 나루 사이를 오간다 (끝에서 잠시 쉰다), 서 있으면 같이 간다
      const w = r.w ?? 48, lo = r.x0, hi = r.x1 - w;
      let dx = 0;
      if (it.wait > 0) it.wait -= dt;
      else {
        const nx = it.x + it.dir * 80 * dt;
        if (nx >= hi) ((dx = hi - it.x), (it.x = hi), (it.dir = -1), (it.wait = 1.6));
        else if (nx <= lo) ((dx = lo - it.x), (it.x = lo), (it.dir = 1), (it.wait = 1.6));
        else ((dx = nx - it.x), (it.x = nx));
      }
      if (dx && B.onGround && px >= it.x - dx - 3 && px <= it.x - dx + w + 3 && Math.abs(py - r.y1) <= 3) B.x += dx;
      const bx = Math.round(it.x);
      dyn.push({ on: 1, x0: GX + bx, x1: GX + bx + w, y0: r.y1, y1: r.y1 + 10 });
      if (!vis) { hide(it); continue; }
      it.spr ??= sc.add.tileSprite(0, 0, w, 10, "dv_lift").setOrigin(0, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + bx, r.y1);
      it.cab ??= sc.add.tileSprite(0, 0, 2, 8, "dv_cable").setOrigin(0.5, 0).setDepth(2.3);
      it.cab.setVisible(true).setPosition(ox + bx + w / 2, r.y0 + 2).setSize(2, Math.max(2, r.y1 - r.y0 - 2));
    } else if (it.k === "draw") {
      // 도개교: 3.4초 놓임 → 0.7초 들림 → 2.2초 서 있음 → 0.7초 내려옴 (한 바퀴 7초)
      it.t = (it.t + dt) % 7;
      const t = it.t, a = t < 3.4 ? 0 : t < 4.1 ? (t - 3.4) / 0.7 : t < 6.3 ? 1 : 1 - (t - 6.3) / 0.7;
      const was = it.a ?? 0;
      it.a = a;
      a > 0 && was === 0 && vis && R.j.play("block", 0.45);
      a < 0.12 && dyn.push({ on: 1, x0: GX + r.x0, x1: GX + r.x1, y0: r.y0, y1: r.y0 + 8 });
      if (!vis) { hide(it); continue; }
      const L = r.hinge === "R";
      it.spr ??= sc.add.tileSprite(0, 0, r.x1 - r.x0, 8, "dv_draw").setOrigin(L ? 1 : 0, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + (L ? r.x1 : r.x0), r.y0).setAngle((L ? 1 : -1) * a * 78);
    } else if (it.k === "fall") {
      if (it.st === "hang") {
        if (px > r.x0 - 10 && px < r.x1 + 10 && py > r.y0 && py < r.y1 + 20) ((it.st = "shake"), (it.t = 0.35));
      } else if (it.st === "shake") {
        (it.t -= dt) <= 0 && ((it.st = "drop"), (it.vy = 0));
      } else if (it.st === "drop") {
        it.vy = Math.min(900, it.vy + 1600 * dt);
        it.y += it.vy * dt;
        const cx = (r.x0 + r.x1) / 2;
        if (Math.abs(px - cx) < 10 && py > it.y && py - 24 < it.y + 28) {
          pl.hurt({ dmg: Math.max(4, Math.round(pl.maxHp * 0.12)), element: "phys", dir: px < cx ? -1 : 1, knock: 1 });
          it.st = "regrow", (it.t = 4), sc.fx?.burst?.("chunk", ox + cx, it.y + 20, 6, 0xa8a0b0);
        } else if (it.y + 28 >= r.y1) ((it.st = "regrow"), (it.t = 4), sc.fx?.burst?.("chunk", ox + cx, r.y1 - 2, 8, 0xa8a0b0), vis && R.j.play("thud", 0.5));
      } else if (it.st === "regrow" && (it.t -= dt) <= 0) ((it.st = "hang"), (it.y = r.y0));
      if (!vis || it.st === "regrow") { hide(it); continue; }
      it.spr ??= sc.add.image(0, 0, "dv_stal").setOrigin(0.5, 0).setDepth(2.4);
      it.spr.setVisible(true).setPosition(ox + (r.x0 + r.x1) / 2 + (it.st === "shake" ? (Math.random() - 0.5) * 2 : 0), it.y);
    } else if (it.k === "geyser") {
      // 간헐천: 2.2초 쉬고 1.4초 뿜는다 (뿜을 때 칸 안이면 높이 띄운다)
      it.t -= dt;
      if (it.t <= 0) ((it.on = !it.on), (it.t = it.on ? 1.4 : 2.2), it.on && vis && R.j.play("ice", 0.4));
      if (it.on && px > r.x0 && px < r.x1 && py > r.y0 && py - 20 < r.y1) ((B.vy = Math.min(B.vy, -(r.pow ?? 560))), (pl.airJumps = Math.max(pl.airJumps, 1)));
      if (vis && it.on && Math.random() < dt * 40) {
        const x = ox + r.x0 + Math.random() * (r.x1 - r.x0);
        sc.fx?.burst?.("glow", x, r.y1 - 4 - Math.random() * (r.y1 - r.y0) * 0.8, 1, r.tint ?? 0xa8e0ff);
      }
      if (vis && !it.on && it.t < 0.6 && Math.random() < dt * 10) sc.fx?.burst?.("dust", ox + (r.x0 + r.x1) / 2, r.y1 - 2, 1, r.tint ?? 0xa8e0ff);
    } else if (it.k === "heal") {
      // 회복 샘: 안에 있으면 체력이 찬다 (초당 30%), 위로 오르는 빛 알갱이
      const inside = px > r.x0 && px < r.x1 && py > r.y0 && py - 20 < r.y1;
      if (inside && pl.hp < pl.maxHp && !pl.dead) {
        pl.heal(pl.maxHp * 0.3 * dt, !1);
        (it.t -= dt) <= 0 && ((it.t = 0.25), sc.fx?.burst?.("glow", px + (Math.random() - 0.5) * 12, py - 8, 2, 0x9af4ff));
        if (!HEALMSG) ((HEALMSG = 1), sc.fx?.text?.(px, py - 34, "회복 샘", "#9af4ff"), R.j.play("heal", 0.6));
      }
      vis && Math.random() < dt * 3 && sc.fx?.burst?.("glow", ox + r.x0 + Math.random() * (r.x1 - r.x0), r.y1 - 6, 1, 0xc8fff4);
    } else if (it.k === "lever") {
      const key = src.key + ":" + r.id;
      it.cd = Math.max(0, it.cd - dt);
      if (!SWITCH.has(key) && atk && it.cd <= 0 && Math.abs(px - (r.x0 + r.x1) / 2) < 34 && Math.abs(py - r.y1) < 30) {
        SWITCH.add(key);
        it.cd = 1;
        R.j.play("open");
        sc.fx?.shake?.(2);
        sc.fx?.text?.(ox + (r.x0 + r.x1) / 2, r.y0 - 12, "철컥! 승강기가 움직인다", "#c8f0a0");
      }
      if (!vis) {
        hide(it);
        continue;
      }
      it.spr ??= sc.add.image(0, 0, "dv_lever0").setOrigin(0.5, 1).setDepth(2.4);
      it.spr.setVisible(true).setTexture(SWITCH.has(key) ? "dv_lever1" : "dv_lever0").setPosition(ox + (r.x0 + r.x1) / 2, r.y1);
    }
  }
  // 덩굴 그네 그리기: 매달린 동안은 잡은 손까지, 아니면 곧게 늘어진다
  A.gfx ??= sc.add.graphics().setDepth(2.35);
  A.gfx.clear();
  for (const r of src.P.spec ?? []) {
    if (r.t !== 22 || r.x1 < vx0 || r.x0 > vx1 || r.y1 < vy0 || r.y0 > vy1) continue;
    const att = pl.swing && pl.swing.r === r;
    const ex = att ? px : r.ax, ey = att ? py - (B.h ?? 22) - 3 : r.ay + r.len;
    A.gfx.lineStyle(3, 0x2e5a22, 1).lineBetween(ox + r.ax, r.ay, ox + ex, ey);
    A.gfx.lineStyle(1, 0x8ad060, 1).lineBetween(ox + r.ax - 1, r.ay, ox + ex - 1, ey);
    for (let k = 1; k < 7; k++) {
      const t = k / 7;
      A.gfx.fillStyle(k % 3 ? 0x5aa040 : 0x86c858, 1).fillCircle(ox + r.ax + (ex - r.ax) * t + (k % 2 ? 2 : -2), r.ay + (ey - r.ay) * t, 2);
    }
    A.gfx.fillStyle(0x6a4a2a, 1).fillCircle(ox + r.ax, r.ay + 1, 3);
  }
  // 바람: 떠오르는 결 / 옆으로 흐르는 바람결 (화면 근처)
  A.st ??= [];
  for (const r of src.P.spec ?? []) {
    if (r.t !== 10 || r.x1 < vx0 || r.x0 > vx1 || r.y1 < vy0 || r.y0 > vy1) continue;
    const area = ((r.x1 - r.x0) * (r.y1 - r.y0)) / 4000;
    if (Math.random() < dt * (4 + area * 6)) {
      let q = A.st.find((p) => !p.on);
      if (!q && A.st.length < 90) A.st.push((q = { img: sc.add.image(0, 0, "dv_streak").setDepth(2.5).setBlendMode(1) }));
      if (q) {
        const hor = !!r.dx, x = r.x0 + Math.random() * (r.x1 - r.x0), y = r.y0 + Math.random() * (r.y1 - r.y0);
        Object.assign(q, { on: true, age: 0, life: 0.6 + Math.random() * 0.5, x, y, vx: hor ? r.dx * (220 + Math.random() * 120) : 0, vy: hor ? -(r.lift ?? 30) * 0.4 : -(180 + Math.random() * 120) });
        q.img.setVisible(true).setAngle(hor ? 0 : 90).setScale(hor ? 1.6 : 1.2, 1).setTint(0xf4fbff).setAlpha(0);
      }
    }
  }
  for (const q of A.st) {
    if (!q.on) continue;
    q.age += dt;
    if (q.age >= q.life) ((q.on = false), q.img.setVisible(false));
    else ((q.x += q.vx * dt), (q.y += q.vy * dt), q.img.setPosition(ox + q.x, q.y).setAlpha(0.55 * Math.sin((Math.PI * q.age) / q.life)));
  }
}
