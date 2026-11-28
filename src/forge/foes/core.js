// 새 적 시스템
// - 적마다 3D 픽셀 애니메이션 시트(관절 포즈를 프레임마다 그려 만든다)
// - 생성기(function*) 스크립트로 쓰는 AI: 생각 → 예고 → 공격 → 빈틈. 맞아서 경직되면 생각부터 다시
// - 예고 연출(느낌표·붉은 번쩍임·바닥 경고·무기 빛), 적 쪽 위험 지대(불길 등)
import { prims, ramp5 } from "../props3d.js";
import { model, render } from "./r3d.js";
import { renderSheet } from "./sheet.js";

let R = null;
export const bindFoes = (r) => (R = r);
export const SPECS = {};
import { foesOf } from "../bestiary.js";
export const register = (id, spec) => (SPECS[id] = spec);
// 그림·행동이 다 갖춰진 몬스터인가
export const hasSpec = (id) => !!(SPECS[id]?.px || SPECS[id]?.model);

// 프레임 배치 (모든 적 공통)
export const F = { IDLE: [0, 1, 2, 3], MOVE: [4, 5, 6, 7], HURT: 8, WIND: [9, 10], ATK: [11, 12, 13], SP: [14, 15, 16, 17, 18, 19] };

// ── 그리기 ──
const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export { mix, ramp5 };
const H = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
export { H as hash };

// 한 프레임용 그리기 도구 (x0 = 프레임 왼쪽)
function painter(buf, W, Hh, x0) {
  const put = (x, y, c) => {
    x = Math.round(x), y = Math.round(y);
    if (x < 0 || y < 0 || y >= Hh || x >= W) return;
    buf.set(x0 + x, y, c);
  };
  const P = prims(put);
  const lv = (I) => (I > 0.6 ? 0 : I > 0.2 ? 1 : I > -0.22 ? 2 : I > -0.6 ? 3 : 4);
  const D = {
    put,
    ...P,
    // 둥근 몸통 (빛 왼쪽 위)
    ell(cx, cy, rx, ry, col, o = {}) {
      const R5 = ramp5(col);
      for (let j = -ry; j <= ry; j++)
        for (let i = -rx; i <= rx; i++) {
          const d = (i * i) / (rx * rx) + (j * j) / (ry * ry);
          if (d > 1) continue;
          const nz = Math.sqrt(1 - d);
          let L = lv(-(i / rx) * 0.55 - (j / ry) * 0.7 + nz * 0.32 - 0.12 + (o.lift ?? 0));
          d > 0.8 && (L = Math.min(4, L + 1));
          put(cx + i, cy + j, R5[L]);
        }
    },
    // 굵은 관절 (원통처럼 둥근 명암)
    limb(x0_, y0, x1, y1, w, col) {
      const R5 = ramp5(col), r = w / 2;
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0_, y1 - y0)));
      for (let k = 0; k <= n; k++) {
        const cx = x0_ + ((x1 - x0_) * k) / n, cy = y0 + ((y1 - y0) * k) / n;
        for (let j = -Math.ceil(r); j <= Math.ceil(r); j++)
          for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) {
            const d = (i * i + j * j) / (r * r + 0.01);
            if (d > 1) continue;
            const nz = Math.sqrt(1 - d);
            put(cx + i, cy + j, R5[lv(-(i / (r + 0.01)) * 0.6 - (j / (r + 0.01)) * 0.6 + nz * 0.3 - 0.1)]);
          }
      }
    },
    // 다각형 채우기 + 면 방향 명암
    poly(pts, col, o = {}) {
      const R5 = ramp5(col);
      const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      const xs = pts.map((p) => p[0]), xa = Math.min(...xs), xb = Math.max(...xs);
      for (let y = y0; y <= y1; y++) {
        const hits = [];
        for (let k = 0; k < pts.length; k++) {
          const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length];
          if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) hits.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
        }
        hits.sort((a, b) => a - b);
        for (let k = 0; k + 1 < hits.length; k += 2)
          for (let x = Math.round(hits[k]); x < Math.round(hits[k + 1]); x++) {
            const u = (x - xa) / Math.max(1, xb - xa), v = (y - y0) / Math.max(1, y1 - y0);
            let L = o.flat ?? (u < 0.25 ? 1 : u > 0.75 ? 3 : 2);
            o.vgrad && (L = v < 0.2 ? 1 : v > 0.75 ? 3 : L);
            (x === Math.round(hits[k]) || x === Math.round(hits[k + 1]) - 1) && o.edge && (L = 4);
            put(x, y, R5[Math.max(0, Math.min(5, L))]);
          }
      }
    },
    // 빛나는 점 (눈·불씨)
    glow(x, y, col, big) {
      put(x, y, 0xffffff);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + dx, y + dy, col);
      big && [[1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(([dx, dy]) => put(x + dx, y + dy, sh(col, -0.3)));
    },
    // 불꽃 (바깥 붉음 → 노란 속)
    flame(x, y, h, ph = 0, w = 1) {
      for (let j = 0; j < h; j++) {
        const t = j / h, half = Math.max(0, Math.sin(t * Math.PI) * (2 + h * 0.18) * w * (1 - t * 0.3));
        const sway = Math.sin(ph * 2 + j * 0.5) * t * 1.5;
        for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) {
          const k = Math.abs(i) / (half + 0.01);
          put(x + i + sway, y - j, k > 0.7 ? 0xd8301a : k > 0.35 ? 0xff8a20 : t < 0.5 ? 0xffe070 : 0xffb030);
        }
      }
    },
    // 균열 (빛나는 금)
    crack(x0_, y0, len, ang, col = 0xff8a30, seed = 1) {
      let x = x0_, y = y0, a = ang;
      for (let k = 0; k < len; k++) {
        put(x, y, k % 3 === 0 ? 0xffe0a0 : col);
        a += (H(k, seed) - 0.5) * 1.2;
        x += Math.cos(a), y += Math.sin(a);
      }
    },
  };
  return D;
}
// 프레임 시트 버퍼
function sheet(fw, fh, n) {
  const W = fw * n, buf = new Uint32Array(W * fh);
  const B = {
    W, fh,
    set(x, y, c) {
      if (x < 0 || y < 0 || x >= W || y >= fh) return;
      buf[y * W + x] = (0xff000000 | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255)) >>> 0;
    },
    outline(col = 0x1a0e14) {
      const out = buf.slice();
      for (let y = 0; y < fh; y++)
        for (let x = 0; x < W; x++) {
          if (buf[y * W + x]) continue;
          if ((x % fw > 0 && buf[y * W + x - 1]) || (x % fw < fw - 1 && buf[y * W + x + 1]) || (y > 0 && buf[(y - 1) * W + x]) || (y < fh - 1 && buf[(y + 1) * W + x]))
            out[y * W + x] = (0xff000000 | ((col & 255) << 16) | (col & 0xff00) | ((col >> 16) & 255)) >>> 0;
        }
      buf.set(out);
    },
    canvas() {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = fh;
      const ctx = c.getContext("2d"), img = ctx.createImageData(W, fh);
      new Uint32Array(img.data.buffer).set(buf);
      ctx.putImageData(img, 0, 0);
      return c;
    },
  };
  return B;
}
// 3D 모델 시트: spec.anims = { 이름: [장수, fps, 반복] }, spec.model(M, 이름, k, n)
function build3d(scene, key, spec) {
  install(scene, key, spec, renderSheet(spec, key));
}
// 렌더 결과를 텍스처·애니메이션으로 붙인다
function install(scene, key, spec, sh) {
  spec._fi = sh.fi;
  const c = document.createElement("canvas");
  c.width = sh.W;
  c.height = sh.H ?? sh.fh;
  const ctx = c.getContext("2d"), img = ctx.createImageData(sh.W, c.height);
  new Uint32Array(img.data.buffer).set(sh.buf);
  ctx.putImageData(img, 0, 0);
  // 이미 같은 이름의 텍스처를 쓰는 물체가 있으면, 바꾼 뒤 새 텍스처로 다시 붙인다 (안 하면 렌더에서 멈춤)
  const users = [];
  if (scene.textures.exists(key)) {
    const walk = (L) => { for (const o of L) (o.texture?.key === key && users.push(o), o.list && walk(o.list)); };
    for (const sc of scene.game?.scene?.scenes ?? [scene]) sc.sys?.displayList && walk(sc.sys.displayList.list);
    scene.textures.remove(key);
  }
  const t = scene.textures.addCanvas(key, c);
  const cols = sh.cols ?? sh.total;
  for (let f = 0; f < sh.total; f++) t.add(f, 0, (f % cols) * sh.fw, Math.floor(f / cols) * sh.fh, sh.fw, sh.fh);
  for (const o of users) o.active !== !1 && o.setTexture?.(key, 0);
  for (const nm of ["idle", "move"]) {
    const ak = `${key}_${nm}`;
    scene.anims.exists(ak) && scene.anims.remove(ak);
    const list = sh.fi[nm] ?? sh.fi.idle;
    scene.anims.create({ key: ak, frames: list.map((fr) => ({ key, frame: fr })), frameRate: spec.anims[nm]?.[1] ?? 6, repeat: -1 });
  }
  BUILT.add(spec._id ?? key);
}
// ── 필요할 때 만들기 / 미리 만들기 ──
const BUILT = new Set(), PENDING = new Set();
let WK = null;
const keyOf = (id) => (SPECS[id]?.boss ? `b_${id}` : `e_${id}`);
function worker(scene) {
  if (WK !== null) return WK;
  try {
    WK = new Worker(new URL("./foeworker.js", import.meta.url), { type: "module" });
    WK.onmessage = (ev) => {
      const d = ev.data;
      PENDING.delete(d.id);
      const spec = SPECS[d.id];
      if (!spec || d.error || BUILT.has(d.id)) return;
      spec._id = d.id;
      const sc = WK._scene;
      sc?.sys?.textures && install(sc, keyOf(d.id), spec, d);
    };
  } catch (e) {
    WK = !1;
  }
  return WK;
}
// 몬스터가 생기기 직전: 아직 없으면 지금 바로 만든다
export function ensure(scene, id) {
  const spec = SPECS[id];
  if (!(spec?.model || spec?.px) || (BUILT.has(id) && scene.textures.exists(keyOf(id)))) return;
  spec._id = id;
  build3d(scene, keyOf(id), spec);
}
// 지역 몬스터를 뒤에서 미리 만든다
const ASKED = new Set();
export function preloadRegion(scene, ri, list = null) {
  if (!list && (ri < 0 || ASKED.has(ri))) return;
  list || ASKED.add(ri);
  // 옛 지역 번호(ri)로 부르면 그 지역 보스만 (일반 몬스터는 지웠다)
  const ids = (list ?? [`frb${ri}`]).filter((id) => SPECS[id]?.model || SPECS[id]?.px);
  const w = worker(scene);
  for (const id of ids) {
    if (BUILT.has(id) || PENDING.has(id)) continue;
    if (!w) {
      ensure(scene, id);
      continue;
    }
    w._scene = scene;
    PENDING.add(id);
    w.postMessage({ id });
  }
}
export const frameOf = (id, name, k = 0) => {
  const L = SPECS[id]?._fi?.[name];
  return L ? L[Math.min(L.length - 1, k)] : 0;
};
// 텍스처 만들기: draw(D, frameIndex) 로 프레임마다 그린다
export function buildArt(scene, key, spec) {
  if (spec.model || spec.px) return build3d(scene, key, spec);
  const n = spec.frames ?? 20, fw = spec.fw, fh = spec.fh;
  const B = sheet(fw, fh, n);
  for (let f = 0; f < n; f++) {
    const D = painter(B, fw, fh, f * fw);
    try {
      spec.draw(D, f);
    } catch (e) {
      console.warn("foe art", key, f, e);
    }
  }
  B.outline(spec.outline ?? 0x1a0e14);
  const c = B.canvas();
  scene.textures.exists(key) && scene.textures.remove(key);
  const t = scene.textures.addCanvas(key, c);
  for (let f = 0; f < n; f++) t.add(f, 0, f * fw, 0, fw, fh);
  for (const [nm, frames, rate] of [["idle", spec.idleFrames ?? F.IDLE, 5], ["move", spec.moveFrames ?? F.MOVE, 9]]) {
    const ak = `${key}_${nm}`;
    scene.anims.exists(ak) && scene.anims.remove(ak);
    scene.anims.create({ key: ak, frames: frames.map((fr) => ({ key, frame: fr })), frameRate: rate, repeat: -1 });
  }
}
export function bootFoeArt(scene) {
  // 부팅 때는 렌더하지 않는다: 1·2지역을 뒤에서 미리 만들어 둔다
  // 그래스메어 몬스터 (첫 구역). 다른 구역은 들어가기 전에 이웃 구역 몬스터를 미리 만든다 (glue prefetchNeighbors)
  preloadRegion(scene, -1, ["gm_slime", "gm_slime_mini", ...foesOf("g1_0")]);
}
// 엔진 정의에 새 적 표시
export function foeDef(d) {
  const s = SPECS[d.id];
  if (!s) return;
  d.foe = !0;
  s.w && (d.w = s.w);
  s.h && (d.h = s.h);
  s.flying !== void 0 && (d.flying = s.flying);
  s.speed && (d.speed = s.speed);
  s.sight && (d.sight = s.sight);
  s.hpMul && (d.hp = Math.round(d.hp * s.hpMul));
  s.atkMul && (d.atk = Math.round(d.atk * s.atkMul));
  s.def !== void 0 && (d.def = s.def);
  s.heavy !== void 0 && (d.heavy = s.heavy);
  d.frScale = 1;
}

// ── 행동 도구 ──
function actions(e) {
  const host = e.host, Rb = e.body;
  const A = {
    get p() {
      return host.player;
    },
    get dx() {
      return host.player.cx - e.cx;
    },
    get dy() {
      return host.player.body.y - Rb.y;
    },
    get dist() {
      return Math.hypot(this.dx, this.dy * 0.6);
    },
    get ground() {
      return Rb.onGround;
    },
    face(dir) {
      e.facing = dir ?? (this.dx > 0 ? 1 : -1);
    },
    // 걷기: 낭떠러지·벽 앞에서는 멈추거나 뛰어오른다
    walk(dir, speed, o = {}) {
      const W = host.world, M = e.fz;
      e.facing = dir;
      if (!e.def.flying && Rb.onGround) {
        if (W.ledgeAhead(Rb, dir) && !o.jumpGaps) {
          // 낭떠러지: 아래 땅이 가까우면 내려가고, 멀면 멈춘다
          const col = W.gtx(Rb.x + dir * (Rb.w / 2 + 8)), row = Math.floor(Rb.y / 16);
          let drop = 99;
          for (let k = 0; k < 6; k++) if (W.standable(col, row + k)) { drop = k; break; }
          if (drop > 4) return void (Rb.vx *= 0.5);
        }
        if (W.wallAhead(Rb, dir)) {
          if (o.climb !== !1) Rb.vy = -430;
          else return void (Rb.vx = 0);
        }
      }
      Rb.vx += (dir * speed - Rb.vx) * Math.min(1, 0.25);
      // 끼임 감지: 가려고 하는데 1초 동안 거의 못 움직이면 뛰어오르고, 계속 막히면 방향을 바꾼다
      M.stk = M.stk ?? { x: Rb.x, t: 0, n: 0 };
      M.stk.t += 1 / 60;
      if (M.stk.t > 1) {
        if (Math.abs(Rb.x - M.stk.x) < 3) {
          M.stk.n++;
          Rb.onGround && (Rb.vy = -480);
          M.stk.n >= 3 && ((M.mem.wd = -dir), (M.stk.n = 0), (M.blockedT = 2));
        } else M.stk.n = 0;
        M.stk.x = Rb.x;
        M.stk.t = 0;
      }
    },
    stop(k = 0.3) {
      Rb.vx *= 1 - k;
      Math.abs(Rb.vx) < 4 && (Rb.vx = 0);
    },
    // 날기: 목표점으로 부드럽게
    flyTo(x, y, speed) {
      const ddx = x - e.cx, ddy = y - Rb.y, d = Math.hypot(ddx, ddy) || 1;
      Rb.vx += ((ddx / d) * speed - Rb.vx) * 0.12;
      Rb.vy += ((ddy / d) * speed - Rb.vy) * 0.12;
      Math.abs(ddx) > 4 && (e.facing = ddx > 0 ? 1 : -1);
    },
    play(name, fps, loop) {
      const a = e.fz.anim, d = SPECS[e.def.id]?.anims?.[name];
      if (a.name === name && a.loop !== !1 && (loop ?? d?.[2] ?? !0)) return;
      e.fz.anim = { name, fps: fps ?? d?.[1] ?? 8, loop: loop ?? d?.[2] ?? !0, t: 0 };
    },
    // 이름 붙은 동작을 처음부터 한 번 재생하고, 끝날 때까지 기다릴 시간을 돌려준다
    once(name, fps) {
      const d = SPECS[e.def.id]?.anims?.[name];
      const f = fps ?? d?.[1] ?? 10;
      e.fz.anim = { name, fps: f, loop: !1, t: 0 };
      return (d?.[0] ?? 1) / f;
    },
    hold(name, k = 0) {
      e.fz.anim = { name: "hold", f: frameOf(e.def.id, name, k) };
    },
    frame(f) {
      e.fz.anim = { name: "hold", f };
    },
    // 예고: 준비 동작 시간만 잡는다. 바닥 빨간 경고(o.bar)는 그리지 않는다 (2026-11-28 사용자 요청)
    tele(dur, o = {}) {
      e.fz.teleT = dur;
      // 준비 시작 순간 몸에 아주 짧은 흰 번쩍임 (그림 색조는 건드리지 않고 위에 빛만 얹는다)
      if (e.sprite?.visible) {
        const f = host.add.image(e.cx, e.cy, "vx_glow").setBlendMode(R.zt.BlendModes.ADD).setTint(0xfff4e0).setDepth((e.sprite.depth ?? 10) + 0.1).setScale(Math.max(0.5, (e.sprite.displayHeight ?? 32) / 48)).setAlpha(0.55);
        host.tweens.add({ targets: f, alpha: 0, duration: 140, onComplete: () => f.destroy() });
      }
      if (o.glow && !1) {
        const [gx, gy, col] = o.glow;
        const g = host.add.image(e.cx + gx * e.facing, Rb.y + gy, "vx_glow").setBlendMode(R.zt.BlendModes.ADD).setTint(col).setDepth(13).setScale(0.2).setAlpha(0.9);
        host.tweens.add({ targets: g, scale: 0.7, alpha: 0.5, duration: dur * 1000, onComplete: () => g.destroy() });
        e.fz.temp.push(g);
      }
      R.j.play("warn", 0.5);
    },
    // 근접 판정: 몸 앞 사각형
    melee(fw, h, mult, o = {}) {
      const x = e.facing > 0 ? e.cx + (o.back ?? 0) : e.cx - fw - (o.back ?? 0);
      const y = Rb.y - h - (o.up ?? 0);
      if (e.playerInRect(x, y, fw, h)) return (e.hit(mult, !0, o.el, o.st, o.knock ?? 1), !0);
      return !1;
    },
    // 투사체
    shoot(proj, x, y, ang, mult, o = {}) {
      host.projectiles.spawn(proj, x, y, ang, "enemy", { ehit: { dmg: e.atk * mult, element: o.el ?? "phys", status: o.st, knock: 1, dir: Math.cos(ang) >= 0 ? 1 : -1, melee: !1, srcX: x, attacker: e } }, o.opts ?? {});
    },
    // 적 쪽 위험 지대 (불길 등)
    zone(x, y, w, dur, mult, o = {}) {
      Z(host).push({ x, y, w, t: dur, mult, el: o.el ?? "fire", st: o.st, atk: e.atk, cd: 0, kind: o.kind ?? "fire", fxT: 0 });
    },
    fxSlash(ox, oy, scale = 1, tint) {
      host.fx.anim("fx_slash", e.cx + ox * e.facing, Rb.y + oy, { flip: e.facing < 0, scale, tint });
    },
    fxHeavy(ox, oy, scale = 1, tint) {
      host.fx.anim("fx_heavy", e.cx + ox * e.facing, Rb.y + oy, { flip: e.facing < 0, scale, tint });
    },
    burst(kind, ox, oy, n, col) {
      host.fx.burst(kind, e.cx + ox * e.facing, Rb.y + oy, n, col);
    },
    // 텍스트는 띄우지 않는다
    text() {},
    // 플레이어 시야 축소
    blind(sec) {
      host._blindT = Math.max(host._blindT ?? 0, sec);
    },
    // 플레이어에게 상태이상
    afflict(st) {
      const p = host.player;
      !p.dead && p.statuses.apply(st, 0);
    },
    shake(a = 3) {
      host.fx.shake(a);
    },
    sound(k, v) {
      R.j.play(k, v);
    },
    rnd: (a, b) => a + Math.random() * (b - a),
    chance: (p) => Math.random() < p,
  };
  return A;
}
// 적 쪽 위험 지대 목록 (장면마다)
const Z = (host) => (host._foeZones = host._foeZones ?? []);
export function updateZones(host, dt) {
  const zs = host._foeZones;
  if (!zs || !zs.length) return;
  const p = host.player;
  for (let i = zs.length - 1; i >= 0; i--) {
    const z = zs[i];
    z.t -= dt;
    z.cd -= dt;
    z.fxT -= dt;
    if (z.kind === "slime") {
      // 슬라임 웅덩이: 가끔 초록 거품이 올라온다
      if (z.fxT <= 0) (z.fxT = 0.14), host.fx.burst("glow", z.x + (Math.random() - 0.5) * z.w * 0.8, z.y - 2, 1, 0x7ad040), Math.random() < 0.4 && host.fx.burst("rise", z.x + (Math.random() - 0.5) * z.w * 0.8, z.y - 3, 1, 0xc8ff90);
    } else if (z.fxT <= 0) {
      z.fxT = 0.06;
      const ice = z.kind === "ice", sand = z.kind === "sand";
      host.fx.burst("glow", z.x + (Math.random() - 0.5) * z.w, z.y - 2, 1, z.kind === "fire" ? 0xff7a20 : ice ? 0x9ad8ff : sand ? 0xe0b870 : 0xa0ff60);
      Math.random() < 0.5 && host.fx.burst("rise", z.x + (Math.random() - 0.5) * z.w, z.y - 4, 1, ice ? 0xe8f8ff : sand ? 0xf0d8a0 : 0xffc040);
    }
    if (!p.dead && z.cd <= 0 && Math.abs(p.cx - z.x) < z.w / 2 + 4 && Math.abs(p.body.y - z.y) < 14) {
      z.cd = 0.5;
      host.hurtPlayer({ dmg: z.atk * z.mult, element: z.el, status: z.st, knock: 0.3, dir: p.cx < z.x ? -1 : 1, melee: !1, srcX: z.x });
    }
    z.t <= 0 && zs.splice(i, 1);
  }
}

// ── 매 프레임 ──
export function think(e, dt) {
  const s = SPECS[e.def.id];
  if (!s) return "idle";
  let fz = e.fz;
  if (!fz) {
    fz = e.fz = { anim: { name: "idle", fps: 5, loop: !0, t: 0 }, temp: [], wait: 0, gen: null, last: e.life, teleT: 0, mem: {} };
    e.fA = actions(e);
    s.init && s.init(e, e.fA);
  }
  // 경직(엔진이 이 함수를 건너뛴 시간)이 있었으면 생각부터 다시
  if (e.life - fz.last > dt * 2.5 && fz.gen) {
    for (const t of fz.temp) t.active && t.destroy();
    fz.temp = [];
    fz.gen = null;
    fz.wait = 0.15;
    fz.teleT = 0;
  }
  fz.last = e.life;
  // 군기 근처: 행동이 30% 빨라진다
  const ts = e._rallyT > 0 ? 1.3 : 1;
  e._rallyT > 0 && (e._rallyT -= dt);
  fz.anim.t += dt * ts;
  fz.teleT > 0 && (fz.teleT -= dt);
  s.tick && s.tick(e, e.fA, dt);
  // 영역 밖으로 나간 플레이어를 놓쳤다: 집으로 돌아간다 (다시 알아채면 그만두고 싸운다)
  if (e._home) {
    if (e.aggro) e._home = null;
    else return homeStep(e, e.fA, dt), "foe";
  }
  if (fz.wait > 0) fz.wait -= dt * ts;
  else {
    // 엔진의 옛 "burrower" 틀은 처음에 그림을 숨긴다 — 손으로 짠 행동은 숨김을 그림(hide 동작)으로 하므로 다시 보이게 한다
    !fz.shown && ((fz.shown = 1), e.sprite?.setVisible(!0));
    fz.gen = fz.gen ?? s.brain(e, e.fA);
    const r = fz.gen.next(dt);
    if (r.done) fz.gen = null;
    else fz.wait = r.value ?? 0;
  }
  return "foe";
}
// 하던 행동을 버리고 집으로
export function goHome(e) {
  const fz = e.fz;
  if (fz) {
    for (const t of fz.temp) t.active && t.destroy();
    fz.temp = [];
    fz.gen = null;
    fz.wait = 0;
    fz.teleT = 0;
  }
  e.clearWarn?.();
  e._home = { t: 0 };
}
function homeStep(e, A, dt) {
  const H = e._home, Rb = e.body;
  H.t += dt;
  const dx = e.homeX - e.cx, hy = e._hy ?? Rb.y;
  let done = !1;
  if (e.def.flying) {
    A.flyTo(e.homeX, hy, e.speed * 0.8);
    A.play("move");
    done = Math.hypot(dx, hy - Rb.y) < 14;
  } else if (Math.abs(dx) > 10) {
    A.walk(Math.sign(dx), e.speed * 0.75);
    A.play("move");
  } else done = !0;
  // 7초 안에 못 돌아가면(떨어져서 길이 막힘) 지금 자리를 새 집으로
  if (!done && H.t > 7) ((e.homeX = e.cx), (e._hy = Rb.y), (e._terr = null), (done = !0));
  if (done) {
    e._home = null;
    A.stop(1);
    A.play("idle");
    e.fz.wait = 0.4;
  }
}
export function anim(e) {
  const fz = e.fz, s = SPECS[e.def.id];
  if (!fz || !s) return;
  const a = fz.anim;
  let f;
  if (a.name === "hold") f = a.f;
  else {
    const list = s._fi?.[a.name] ?? s.anims?.[a.name] ?? (a.name === "move" ? F.MOVE : F.IDLE);
    const k = Math.floor(a.t * (a.fps ?? 6));
    f = Array.isArray(list) ? list[a.loop ? k % list.length : Math.min(list.length - 1, k)] : 0;
  }
  e.sprite.anims.isPlaying && e.sprite.anims.stop();
  e.sprite.setFrame(f);
}
export function blocks(e, S) {
  const s = SPECS[e.def.id];
  return s?.blocks ? s.blocks(e, S) : !1;
}
export function damage(e, dmg, C) {
  const s = SPECS[e.def.id];
  return s?.damage ? s.damage(e, dmg, C) : dmg;
}
export function onDie(e) {
  const s = SPECS[e.def.id];
  if (e.fz) for (const t of e.fz.temp) t.active && t.destroy();
  s?.die && s.die(e, e.fA ?? actions(e));
}

export function hurtFrame(e) {
  const s = SPECS[e.def.id];
  return s?._fi?.hurt?.[0] ?? 8;
}
