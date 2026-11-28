// 새 지역 몬스터 행동 도구 — 생성기(brain)가 조합해서 쓴다. 공격은 늘 예고(wind) → 타격(atk) → 여운(rec)
//   e: 엔진 적 · A: core.js 행동 도구 (walk·stop·flyTo·play·once·tele·melee·shoot·zone·fxSlash·fxHeavy·burst·shake·sound·afflict)
export const DT = 1 / 60;
export const now = (e) => e.life;
export const POIS = (p = 0.15, d = 3) => ({ type: "poison", chance: 1, dur: d, power: p });
export const CHILL = (p = 0.4, d = 1.5) => ({ type: "chill", chance: 1, dur: d, power: p });
export const BURN = (p = 0.15, d = 2.5) => ({ type: "burn", chance: 1, dur: d, power: p });
export const STUN = (d = 0.6) => ({ type: "stun", chance: 1, dur: d });
export const BLEED = (p = 0.12, d = 3) => ({ type: "bleed", chance: 1, dur: d, power: p });
export const hop = (e, dir, vx, vy) => ((e.body.vy = -vy), (e.body.vx = dir * vx), (e.facing = dir || e.facing));
export const near = (A, w, h) => Math.abs(A.dx) < w && Math.abs(A.dy) < h;
export const dirTo = (A) => Math.sign(A.dx) || 1;
// 쿨다운 (M[k]가 지났는가 / 다시 걸기)
export const ready = (e, k) => now(e) >= (e.fz.mem[k] ?? 0);
export const cool = (e, k, a, b = a) => (e.fz.mem[k] = now(e) + a + Math.random() * (b - a));
// 착지까지 기다리기
export function* land(e, A, maxT = 2) {
  yield 0.06;
  for (let t = 0; !A.ground && t < maxT; t += DT) yield 0;
}
// ── 평소 (알아채기 전) ──
// 걷는 것: 어슬렁 걷다 멈춰 두리번
export function* wander(e, A, o = {}) {
  const M = e.fz.mem;
  if (M.lookT > 0) {
    M.lookT -= DT;
    A.play(o.idle ?? "idle"), A.stop(0.3);
    Math.random() < 0.01 && (e.facing = -e.facing);
  } else if (o.still) A.play(o.idle ?? "idle"), A.stop(0.3);
  else {
    A.play(o.move ?? "move");
    A.walk(M.wd ?? 1, o.speed ?? 28);
    Math.random() < 0.006 && (M.wd = -(M.wd ?? 1));
    Math.random() < 0.005 && (M.lookT = 1 + Math.random() * 1.6);
    // 집에서 너무 멀어지면 돌아선다
    Math.abs(e.cx - e.homeX) > (o.range ?? 90) && (M.wd = Math.sign(e.homeX - e.cx) || 1);
  }
  yield 0;
}
// 나는 것: 집 둘레를 느리게 맴돈다
export function* hover(e, A, o = {}) {
  const M = e.fz.mem;
  M.ph = (M.ph ?? Math.random() * 6) + DT;
  A.play(o.idle ?? "idle");
  A.flyTo(e.homeX + Math.sin(M.ph * (o.f ?? 0.7)) * (o.rx ?? 50), (e._hy ?? e.body.y) + Math.cos(M.ph * 1.3) * (o.ry ?? 10), o.speed ?? 40);
  yield 0;
}
// 처음 알아챔: 움찔 (alert 동작이 있으면 그것, 없으면 wind 일부)
export function* notice(e, A, o = {}) {
  const M = e.fz.mem;
  if (M.seen) return;
  M.seen = 1;
  A.face(), A.stop(1);
  o.sound && A.sound(o.sound, o.vol ?? 0.35);
  if (o.anim) yield A.once(o.anim);
  else yield 0.25;
  o.jump && A.ground && !e.def.flying && (hop(e, e.facing, 0, o.jump), yield* land(e, A));
  yield o.after ?? 0.1;
}
// ── 쫓기 한 걸음: 거리 [lo, hi] 사이를 유지 (멀면 다가가고 너무 붙으면 물러난다) ──
export function* approach(e, A, o = {}) {
  const d = Math.abs(A.dx), lo = o.lo ?? 0, hi = o.hi ?? 30;
  if (e.def.flying) {
    const M = e.fz.mem;
    M.ph = (M.ph ?? 0) + DT;
    const p = A.p, side = Math.sign(e.cx - p.cx) || 1;
    A.play(o.move ?? "move");
    A.flyTo(p.cx + side * (o.keep ?? 80) + Math.sin(M.ph * 1.3) * 20, p.body.y - (o.alt ?? 70) + Math.cos(M.ph * 2) * 10, e.speed);
    A.face();
  } else if (d > hi) A.play(o.move ?? "move"), A.walk(dirTo(A), e.speed * (o.k ?? 1), { jumpGaps: o.jumpGaps });
  else if (d < lo) A.play(o.back ?? o.move ?? "move"), A.walk(-dirTo(A), e.speed * 0.6), A.face();
  else A.play(o.idle ?? "idle"), A.stop(), A.face();
  yield 0;
}
// 바닥 경고 대신 늘린 준비 시간 (초)
const WIND_PLUS = 0.14;
// ── 근접: 예고 → 몸을 던지며 휘두름 → 여운 ──
//   o: range·ay(닿는 거리) · tele 예고 초 · dash 앞으로 · fw·fh 판정 · mult · knock · el · st · win 판정 시간 · fx "slash"|"heavy" · tint · sound
export function* melee(e, A, o = {}) {
  A.face(), A.stop(1);
  o.tele !== 0 && A.tele(o.tele ?? 0.32, o.bar ? { bar: [e.cx + e.facing * (o.fw ?? 24) * 0.5, o.fw ?? 30] } : {});
  // 빨간 바닥 경고가 없어진 대신 준비 동작을 조금 길게 잡는다
  yield A.once(o.wind ?? "wind") + (o.bar ? WIND_PLUS : 0);
  A.once(o.atk ?? "atk");
  o.dash && (e.body.vx = e.facing * o.dash);
  o.lift && (e.body.vy = -o.lift);
  A.sound(o.sound ?? "swing", o.vol ?? 0.5);
  let hit = !1;
  for (let t = 0; t < (o.win ?? 0.2); t += DT) {
    !hit && A.melee(o.fw ?? 22, o.fh ?? 18, o.mult ?? 1, { knock: o.knock ?? 0.8, el: o.el, st: o.st, up: o.up, back: o.back }) && ((hit = !0), o.spark !== !1 && A.burst("spark", (o.fw ?? 22) * 0.6, -(o.fh ?? 18) * 0.6, 6, o.tint ?? 0xfff0c0), o.onHit?.());
    o.during?.(t);
    yield 0;
  }
  o.fx === "slash" && A.fxSlash(o.fxX ?? 12, o.fxY ?? -12, o.fxS ?? 0.55, o.tint ?? 0xf0f0e0);
  o.fx === "heavy" && A.fxHeavy(o.fxX ?? 12, o.fxY ?? -12, o.fxS ?? 0.55, o.tint ?? 0xf0f0e0);
  A.stop(0.6);
  o.after && (yield* o.after(hit));
  yield A.once(o.rec ?? "rec") * (o.recK ?? 1);
  return hit;
}
// ── 내려찍기: 바닥 경고 → 쾅 (양옆 반경 r 안 = 맞음, 링·흔들림) ──
export function* slam(e, A, o = {}) {
  A.face(), A.stop(1);
  const r = o.r ?? 44;
  A.tele(o.tele ?? 0.5, { bar: [e.cx + e.facing * (o.fwd ?? 10), r * 2] });
  yield A.once(o.wind ?? "wind") + WIND_PLUS;
  A.once(o.atk ?? "atk");
  yield o.delay ?? 0.08;
  const x = e.cx + e.facing * (o.fwd ?? 10), y = e.body.y;
  e.host.fx.anim("ring", x, y - 4, { scale: (r / 26) * 1.2, tint: o.tint ?? 0xe8d8b0 });
  e.host.fx.burst("dust", x, y - 2, 10, o.dust ?? 0xb8a888);
  o.chunk !== !1 && e.host.fx.burst("chunk", x, y - 4, 6, o.chunk ?? 0x8a8478);
  A.shake(o.shake ?? 2);
  A.sound(o.sound ?? "thud", 0.6);
  e.playerInRect(x - r, y - (o.h ?? 26), r * 2, o.h ?? 26) && e.hit(o.mult ?? 1.2, !0, o.el, o.st, o.knock ?? 1.2);
  o.after && (yield* o.after(x, y));
  yield A.once(o.rec ?? "rec") * (o.recK ?? 1);
}
// ── 포물선 던지기 (돌·덩이) ──
//   o: sprite·g 중력·ox·oy 손 위치·mult·el·st·scale·lead 이끌기·n 연속·spread·trail·onDone(pr)
export function* lob(e, A, o = {}) {
  A.face(), A.stop(1);
  o.tele !== 0 && A.tele(o.tele ?? 0.3);
  yield A.once(o.wind ?? "wind");
  const n = o.n ?? 1;
  for (let k = 0; k < n; k++) {
    A.once(o.atk ?? "atk");
    yield o.release ?? 0.12;
    const p = A.p, ox = e.cx + e.facing * (o.ox ?? 6), oy = e.body.y - (o.oy ?? 16), g = o.g ?? 560;
    const tx = p.cx + (p.body.vx ?? 0) * (o.lead ?? 0.3) + (k ? (Math.random() - 0.5) * (o.spread ?? 30) : 0);
    const T = Math.max(0.45, Math.min(0.95, Math.abs(tx - ox) / 260));
    A.shoot({ sprite: o.sprite ?? "p_rock", speed: 0, gravity: g, life: 2.6, radius: o.radius ?? 5, trail: o.trail }, ox, oy, 0, o.mult ?? 0.8, {
      el: o.el ?? "phys", st: o.st,
      opts: { vx: (tx - ox) / T, vy: (p.body.y - 10 - oy - 0.5 * g * T * T) / T, scale: o.scale ?? 1.1, onDone: o.onDone ? (pr) => o.onDone(pr) : (pr) => e.host.fx.burst("chunk", pr.x, pr.y, 4, o.chunkC ?? 0x8a8478) },
    });
    A.sound(o.sound ?? "swing", 0.45);
    yield o.gap ?? 0.18;
  }
  yield A.once(o.rec ?? "rec") * (o.recK ?? 0.8);
}
// ── 곧은 탄 (마력탄·가시·물방울): n발 부채꼴 ──
export function* shoot(e, A, o = {}) {
  A.face(), A.stop(1);
  o.tele !== 0 && A.tele(o.tele ?? 0.35);
  yield A.once(o.wind ?? "wind");
  A.once(o.atk ?? "atk");
  yield o.release ?? 0.06;
  const p = A.p, ox = e.cx + e.facing * (o.ox ?? 8), oy = e.body.y - (o.oy ?? 14);
  const base = o.aim === !1 ? (e.facing > 0 ? 0 : Math.PI) : Math.atan2(p.body.y - 10 - oy, p.cx - ox);
  const n = o.n ?? 1, sp = o.spread ?? 0.22;
  for (let k = 0; k < n; k++) {
    const a = base + (n > 1 ? (k - (n - 1) / 2) * sp : 0);
    A.shoot({ sprite: o.sprite ?? "p_orb", speed: o.speed ?? 220, gravity: o.g ?? 0, life: o.life ?? 2.2, radius: o.radius ?? 5, trail: o.trail }, ox, oy, a, o.mult ?? 0.7, { el: o.el ?? "phys", st: o.st, opts: { scale: o.scale ?? 1, onDone: o.onDone } });
  }
  A.sound(o.sound ?? "shoot", 0.4);
  yield A.once(o.rec ?? "rec") * (o.recK ?? 0.8);
}
// ── 나는 것의 급강하: 위로 자리 잡고 → 예고 → 플레이어 쪽으로 곧장 ──
export function* dive(e, A, o = {}) {
  A.face();
  e.body.vx *= 0.2, e.body.vy *= 0.2;
  A.tele(o.tele ?? 0.42);
  yield A.once(o.wind ?? "wind");
  A.once(o.atk ?? "atk");
  A.sound(o.sound ?? "dash", 0.4);
  const p = A.p, tx = p.cx, ty = p.body.y - (o.ty ?? 10), dx = tx - e.cx, dy = ty - e.body.y, Ln = Math.hypot(dx, dy) || 1, v = o.v ?? 340;
  for (let t = 0; t < (o.dur ?? 0.45); t += DT) {
    e.body.vx = (dx / Ln) * v, e.body.vy = (dy / Ln) * v;
    if (A.melee(o.fw ?? 18, o.fh ?? 18, o.mult ?? 1, { knock: o.knock ?? 0.6, el: o.el, st: o.st })) {
      o.onHit?.();
      break;
    }
    yield 0;
  }
  e.body.vx *= 0.3, e.body.vy = -Math.abs(e.body.vy) * 0.5;
  yield A.once(o.rec ?? "rec");
}
// ── 땅 돌진: 땅을 긁고 달린다 → 벽에 박으면 어지러움 ──
export function* charge(e, A, o = {}) {
  A.face(), A.stop(1);
  A.tele(o.tele ?? 0.5, { bar: [e.cx + e.facing * 60, 120] });
  yield A.once(o.wind ?? "wind") + WIND_PLUS;
  A.play(o.run ?? "atk");
  A.sound(o.sound ?? "dash", 0.5);
  const dir = e.facing, W = e.host.world;
  let hit = !1, wall = !1;
  for (let t = 0; t < (o.dur ?? 1.1); t += DT) {
    e.body.vx = dir * (o.v ?? 260);
    !hit && A.melee(o.fw ?? 22, o.fh ?? 18, o.mult ?? 1.1, { knock: o.knock ?? 1.4, el: o.el, st: o.st }) && ((hit = !0), A.shake(1.5));
    Math.random() < 0.3 && A.burst("dust", -6, -1, 1, o.dust ?? 0xb8a888);
    if (A.ground && W.wallAhead(e.body, dir)) {
      wall = !0;
      break;
    }
    if (A.ground && W.ledgeAhead(e.body, dir) && !o.overLedge) break;
    if (hit && o.stopOnHit) break;
    yield 0;
  }
  A.stop(1);
  if (wall && o.stun !== !1) {
    A.shake(2), A.sound("thud", 0.6), e.host.fx.burst("chunk", e.cx + dir * 12, e.body.y - 12, 6, 0x8a8478);
    e.fz.mem.dizzy = 1;
    A.play(o.stunAnim ?? "hurt");
    yield o.stunT ?? 1.4;
    e.fz.mem.dizzy = 0;
  }
  yield A.once(o.rec ?? "rec");
  return hit;
}
// ── 졸개 부르기 (최대 max마리) ──
export function* summon(e, A, o = {}) {
  const M = e.fz.mem;
  M.kids = (M.kids ?? []).filter((k) => !k.dead && !k.removed);
  if (M.kids.length >= (o.max ?? 3)) return !1;
  A.face(), A.stop(1);
  A.tele(o.tele ?? 0.4);
  yield A.once(o.anim ?? "wind");
  A.sound(o.sound ?? "magic", 0.5);
  for (let k = 0; k < (o.n ?? 2) && M.kids.length < (o.max ?? 3); k++) {
    const x = e.cx + (k % 2 ? 1 : -1) * (o.dx ?? 26) * (1 + k * 0.5), y = e.body.y - (o.dy ?? 4);
    const z = e.host.spawnEnemy(o.id, x, y, { summoned: !0, noGold: !0, camp: e.opts.camp, layer: e.opts.layer });
    z && ((z.aggro = !0), M.kids.push(z), e.host.fx.burst("glow", z.cx, z.cy, 10, o.col ?? 0xfff0a0));
    yield 0.12;
  }
  yield A.once(o.rec ?? "rec") * 0.7;
  return !0;
}
// 적 쪽 웅덩이·장판 (발밑 y에)
export const groundY = (e, x) => {
  const W = e.host.world;
  for (let y = e.body.y - 40; y < e.body.y + 120; y += 4) if (W.solidAtPx(x, y)) return y;
  return e.body.y;
};
// 숨어 있기 (맞으면 덜 아프다): 플레이어가 가까워질 때까지 한 프레임씩
export function* lurk(e, A, o = {}) {
  e.fz.mem.hidden = 1;
  A.play(o.anim ?? "hide");
  A.stop(1);
  yield o.step ?? 0.1;
}
// 몸이 반짝 (회복·강화 표시)
export const glowOn = (e, col, n = 8) => e.host.fx.burst("glow", e.cx, e.cy, n, col);
