// 미러딥 몬스터 12종 행동 (그림은 px_md.js)
import { register } from "./core.js";
import * as X from "./px_md.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const LC = 0xc8e8ff, LV = 0xc8b0f0;
// 빛줄기: 예고 막대 → 일직선 판정 + 빠른 빛 탄 (눈부심 = 잠깐 묶임)
function* beam(e, A, o = {}) {
  A.face(), A.stop(1);
  const len = o.len ?? 220, y = e.body.y - (o.oy ?? 20);
  A.tele(o.tele ?? 0.6, { bar: [e.cx + e.facing * len * 0.5, len] });
  yield A.once(o.wind ?? "wind");
  A.once(o.atk ?? "atk");
  A.sound("magic", 0.5);
  A.shoot({ sprite: "p_ebolt", speed: 620, gravity: 0, life: len / 620, radius: 6 }, e.cx + e.facing * (o.ox ?? 10), y, e.facing > 0 ? 0 : Math.PI, 0.01, { el: "arcane", opts: { scale: o.scale ?? 1.2 } });
  e.playerInRect(e.cx + (e.facing > 0 ? 0 : -len), y - (o.h ?? 14), len, (o.h ?? 14) * 2) && e.hit(o.mult ?? 1, !1, "arcane", o.st ?? STUN(0.35), o.knock ?? 0.4);
  yield A.once(o.rec ?? "rec") * (o.recK ?? 0.8);
}

// ════ 거울 도마뱀붙이 ════ 등 비늘로 빛을 모아 번쩍인다(가까우면 눈부셔 잠깐 묶임) · 재빨리 달려와 문다 · 벽 타듯 훌쩍 뛰어오른다
register("md_gecko", {
  ...X.pxGecko, speed: 72, sight: 230, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "flash", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 24, range: 60 });
        continue;
      }
      if (ready(e, "flash") && near(A, 80, 50)) {
        A.face(), A.stop(1);
        A.tele(0.45);
        yield A.once("flash");
        A.sound("magic", 0.4);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.6, tint: LC });
        near(A, 70, 50) && e.hit(0.3, !1, "arcane", STUN(0.6), 0);
        cool(e, "flash", 4, 5);
        continue;
      }
      if (near(A, 34, 20) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.3, dash: 120, fw: 26, fh: 16, mult: 0.9, knock: 0.6, fx: "slash", tint: LC, sound: "punch" });
        cool(e, "bite", 1.1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 26, jumpGaps: !0 });
    }
  },
});

// ════ 거울 방패병 ════ 거울 방패를 앞세운다 (앞에서 치면 거의 막힌다 · 뒤로 돌아가 쳐라) · 방패로 밀쳐 날린다 · 방패 뒤에서 짧은 칼로 찌른다 ·
//   막아 낸 빛을 모아 되쏜다
register("md_shield", {
  ...X.pxShieldbearer, speed: 40, sight: 260, atkMul: 1,
  damage: (e, dmg) => {
    const p = e.host.player;
    if (p && Math.sign(p.cx - e.cx) === e.facing && e.fz.mem.guard) { e.fz.mem.stored = (e.fz.mem.stored ?? 0) + 1; e.host.fx.burst("spark", e.cx + e.facing * 12, e.cy - 4, 4, LC); return dmg * 0.2; }
    return dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.guard = 0;
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      M.guard = 1;
      if ((M.stored ?? 0) >= 3) {
        M.stored = 0;
        yield* beam(e, A, { wind: "guard", atk: "bash", len: 200, oy: 30, mult: 0.9, tele: 0.5 });
        continue;
      }
      if (near(A, 40, 30) && ready(e, "bash")) {
        yield* melee(e, A, { wind: "guard", atk: "bash", tele: 0.4, dash: 140, fw: 30, fh: 30, mult: 0.7, knock: 2.4, st: STUN(0.3), fx: "heavy", tint: LC, sound: "block" });
        cool(e, "bash", 2.4, 3.2);
        continue;
      }
      if (near(A, 54, 30) && ready(e, "stab")) {
        M.guard = 0;
        yield* melee(e, A, { tele: 0.35, dash: 80, fw: 40, fh: 18, mult: 1, knock: 0.6, st: BLEED(0.06, 2), fx: "slash", tint: LC, sound: "swing" });
        cool(e, "stab", 1.3, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40, idle: "guard", move: "move" });
    }
  },
});

// ════ 프리즘 투구게 ════ 엉금엉금 기다가 꼬리 가시로 찌른다 · 등딱지로 빛을 굴절시켜 무지개 빛줄기를 쏜다 · 뒤집히면 잠시 버둥댄다
register("md_horseshoe", {
  ...X.pxHorseshoe, speed: 34, sight: 220, atkMul: 0.9,
  damage: (e, dmg) => dmg * 0.8,
  *brain(e, A) {
    cool(e, "beam", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      if (near(A, 40, 20) && ready(e, "tail")) {
        A.face();
        e.facing = -e.facing;
        yield* melee(e, A, { tele: 0.4, fw: 30, fh: 14, mult: 1, knock: 0.6, st: BLEED(0.06, 2), fx: "slash", tint: LV, sound: "swing" });
        cool(e, "tail", 1.6, 2.2);
        continue;
      }
      if (ready(e, "beam") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 30) {
        yield* beam(e, A, { len: 180, oy: 8, mult: 0.7, tele: 0.55, scale: 0.8, h: 10 });
        cool(e, "beam", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 거울 마녀 ════ 손거울로 빛줄기를 쏜다(예고 막대) · 거울 속으로 사라졌다 플레이어 곁 다른 곳에서 나온다 · 거울 조각을 부채꼴로 흩뿌린다(출혈) ·
//   거울 방패병을 불러낸다 · 체력 절반부터 빛줄기 두 번
register("md_witch", {
  ...X.pxWitch, speed: 50, sight: 340, atkMul: 1.8,
  damage: (e, dmg) => (e.fz.mem.gone ? 0 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "blink", 3, 4), cool(e, "shards", 1.5, 2.5), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 20, ry: 6, speed: 16 });
        continue;
      }
      yield* notice(e, A, { anim: "summon", sound: "bossRoar", vol: 0.45 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "call")) {
        yield* summon(e, A, { id: "md_shield", n: 1, max: 2, dx: 40, anim: "summon", col: LC });
        cool(e, "call", 12, 15);
        continue;
      }
      if (ready(e, "blink")) {
        M.gone = 1;
        yield A.once("fade");
        e.sprite.setVisible(!1);
        yield 0.5;
        const side = Math.random() < 0.5 ? -1 : 1;
        e.body.x = A.p.cx + side * 120, e.body.y = A.p.body.y - 30, e.body.vx = e.body.vy = 0;
        e.facing = -side;
        e.sprite.setVisible(!0);
        yield A.once("appear");
        M.gone = 0;
        yield* beam(e, A, { len: 260, oy: 50, mult: 1.3, tele: 0.55, h: 16 });
        cool(e, "blink", 6, 8);
        continue;
      }
      if (ready(e, "beam") && Math.abs(A.dy) < 60 && Math.abs(A.dx) < 280) {
        for (let k = 0; k < (rage ? 2 : 1); k++) yield* beam(e, A, { len: 280, oy: 50, mult: 1.3, tele: k ? 0.35 : 0.6, h: 16 });
        cool(e, "beam", 2.6, 3.4);
        continue;
      }
      if (ready(e, "shards") && Math.abs(A.dx) < 300) {
        yield* shoot(e, A, { sprite: "p_icicle", n: 7, spread: 0.18, speed: 240, mult: 0.5, el: "arcane", st: BLEED(0.06, 2), ox: 20, oy: 60, tele: 0.45, sound: "magic", scale: 0.8 });
        cool(e, "shards", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 40 });
    }
  },
});

// ════ 수정뿔 엘크 ════ 고개를 숙이고 수정 뿔로 들이받는다 · 앞발을 들어 구르면 뿔에서 빛이 터진다 · 가까우면 뒷발로 찬다
register("md_elk", {
  ...X.pxElk, speed: 64, sight: 260, atkMul: 1.1, heavy: 1,
  *brain(e, A) {
    cool(e, "ram", 2, 3), cool(e, "stomp", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 70 });
        continue;
      }
      if (ready(e, "stomp") && near(A, 70, 50)) {
        yield* slam(e, A, { wind: "rear", atk: "stomp", r: 50, mult: 1.1, tele: 0.55, fwd: 24, shake: 2, st: STUN(0.3), chunk: 0x9ab8e8, tint: LC, dust: 0x6a7898 });
        cool(e, "stomp", 3.5, 4.5);
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 260 && Math.abs(A.dy) < 40) {
        yield* charge(e, A, { tele: 0.55, v: 300, dur: 0.9, mult: 1.2, knock: 2, fw: 30, fh: 30, dust: 0x6a7898, stopOnHit: 1 });
        cool(e, "ram", 3, 4);
        continue;
      }
      if (near(A, 50, 30) && ready(e, "butt")) {
        yield* melee(e, A, { tele: 0.4, dash: 80, fw: 40, fh: 30, mult: 1, knock: 1.4, fx: "heavy", tint: LC, sound: "punch" });
        cool(e, "butt", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 44 });
    }
  },
});

// ════ 반딧불 하늘오징어 ════ 공중을 헤엄치며 맴돈다 · 빛 먹물을 뿜는다(맞으면 눈부심) · 몸을 쭉 펴 쏜살같이 들이받는다
register("md_squid", {
  ...X.pxSquid, speed: 66, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "ink", 1, 2), cool(e, "jet", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 12, speed: 24 });
        continue;
      }
      if (ready(e, "jet") && near(A, 160, 120)) {
        yield* dive(e, A, { tele: 0.4, v: 380, dur: 0.45, mult: 0.9, knock: 0.8 });
        cool(e, "jet", 3, 4);
        continue;
      }
      if (ready(e, "ink") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.25, speed: 180, mult: 0.45, el: "arcane", st: STUN(0.25), ox: -6, oy: 6, tele: 0.4, sound: "blub", scale: 0.7 });
        cool(e, "ink", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 60 });
    }
  },
});

// ════ 렌즈 술사 ════ 렌즈 지팡이로 빛을 모아 길게 쏜다(예고) · 작은 렌즈 빛 구슬을 흩뿌린다 · 가까우면 섬광을 터뜨리고 물러난다
register("md_lensmage", {
  ...X.pxLensMage, speed: 34, sight: 320, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "focus", 1.5, 2.5), cool(e, "orbs", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (near(A, 50, 40) && ready(e, "flash")) {
        A.stop(1);
        A.tele(0.35);
        yield A.once("wind");
        A.sound("magic", 0.5);
        e.host.fx.anim("ring", e.cx, e.cy - 30, { scale: 2, tint: LC });
        near(A, 60, 50) && e.hit(0.4, !1, "arcane", STUN(0.5), 1.8);
        A.ground && hop(e, -dirTo(A), 140, 180);
        cool(e, "flash", 4, 5);
        continue;
      }
      if (ready(e, "focus") && Math.abs(A.dy) < 50 && Math.abs(A.dx) < 280) {
        yield* beam(e, A, { len: 280, oy: 50, mult: 1, tele: 0.7, h: 12 });
        cool(e, "focus", 3, 4);
        continue;
      }
      if (ready(e, "orbs") && Math.abs(A.dx) < 280) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.2, speed: 200, mult: 0.5, el: "arcane", ox: 4, oy: 60, tele: 0.4, sound: "magic", scale: 0.8 });
        cool(e, "orbs", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { lo: 130, hi: 210 });
    }
  },
});

// ════ [정예] 수정 갈기 사자 ════ 낮게 웅크렸다 크게 덮친다 · 앞발 두 번 할퀴기(출혈) · 포효하면 갈기에서 빛이 터져 눈부시고(묶임) 수정 가시가 사방으로 ·
//   체력 절반부터 덮친 자리에 수정 가시가 솟는다
register("md_lion", {
  ...X.pxLion, speed: 70, sight: 340, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "pounce", 2, 3), cool(e, "roar", 3, 5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "roar", sound: "bossRoar", vol: 0.55 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "roar") && near(A, 140, 80)) {
        A.face(), A.stop(1);
        A.tele(0.6);
        yield A.once("roar");
        A.sound("bossRoar", 0.6), A.shake(3);
        e.host.fx.anim("ring", e.cx + e.facing * 30, e.cy - 10, { scale: 3.2, tint: LC });
        near(A, 120, 80) && e.hit(0.6, !1, "arcane", STUN(0.7), 1.2);
        for (let k = 0; k < 8; k++) A.shoot({ sprite: "p_icicle", speed: 220, gravity: 260, life: 1.6, radius: 5 }, e.cx + e.facing * 40, e.cy - 20, -Math.PI / 2 + (k - 3.5) * 0.36, 0.45, { el: "ice", st: BLEED(0.05, 1.5), opts: { scale: 0.8 } });
        cool(e, "roar", 6, 8);
        continue;
      }
      if (ready(e, "pounce") && A.ground && Math.abs(A.dx) > 80 && Math.abs(A.dx) < 280 && Math.abs(A.dy) < 80) {
        A.face(), A.stop(1);
        A.tele(0.55, { bar: [A.p.cx, 80] });
        yield A.once("wind");
        A.play("pounce");
        A.sound("dash", 0.6);
        hop(e, dirTo(A), Math.min(420, Math.abs(A.dx) * 2.2), 300);
        for (let t = 0; t < 1.2; t += DT) { if (A.melee(50, 40, 1.4, { knock: 1.6, st: BLEED(0.1, 2.5) })) break; if (t > 0.25 && A.ground) break; yield 0; }
        yield* land(e, A);
        A.shake(2.5);
        rage && (e.host.fx.burst("chunk", e.cx, e.body.y - 6, 8, 0x9ab8e8), e.playerInRect(e.cx - 60, e.body.y - 30, 120, 30) && e.hit(0.7, !0, "ice", BLEED(0.08, 2), 0.8));
        cool(e, "pounce", 3.5, 4.5);
        continue;
      }
      if (near(A, 100, 60) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.5, bar: 1, dash: 120, fw: 70, fh: 50, mult: 1.2, knock: 0.6, st: BLEED(0.08, 2), fx: "slash", tint: LC, sound: "swing", recK: 0.3 });
        yield* melee(e, A, { tele: 0.15, dash: 120, fw: 70, fh: 50, mult: 1.3, knock: 1.8, st: BLEED(0.08, 2), fx: "heavy", tint: LC, sound: "swing" });
        cool(e, "claw", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 90 });
    }
  },
});

// ════ 은거울 코브라 ════ 두건을 펴 빛을 비춘다(눈부심 · 잠깐 묶임) · 고개를 쳐들었다 독니로 내리꽂는다(독) · 독을 뱉는다
register("md_cobra", {
  ...X.pxCobra, speed: 44, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "hood", 1.5, 2.5), cool(e, "spit", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (ready(e, "hood") && near(A, 120, 50)) {
        A.face(), A.stop(1);
        A.tele(0.45);
        yield A.once("hood");
        A.sound("magic", 0.4);
        e.host.fx.anim("ring", e.cx + e.facing * 10, e.cy - 10, { scale: 1.4, tint: LC });
        if (Math.sign(A.dx) === e.facing && near(A, 110, 50)) e.hit(0.2, !1, "arcane", STUN(0.7), 0);
        cool(e, "hood", 4, 5);
        continue;
      }
      if (near(A, 54, 40) && ready(e, "strike")) {
        yield* melee(e, A, { tele: 0.4, dash: 100, fw: 34, fh: 26, mult: 1.1, knock: 0.8, el: "poison", st: POIS(0.1, 3), fx: "slash", tint: 0xa8e0a0, sound: "swing" });
        cool(e, "strike", 1.4, 2);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 200) {
        yield* shoot(e, A, { sprite: "sl_glob", n: 2, spread: 0.12, speed: 200, mult: 0.45, el: "poison", st: POIS(0.08, 2.5), ox: 8, oy: 34, tele: 0.4, sound: "splat", scale: 0.6 });
        cool(e, "spit", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 50 });
    }
  },
});

// ════ 프리즘 점액 ════ 통통 튀어 다닌다 · 빛을 갈라 무지개 빛 다섯 줄기를 부채꼴로 쏜다 · 맞으면 작은 빛 조각이 튄다
register("md_prism", {
  ...X.pxPrismSlime, speed: 40, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "split", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      if (ready(e, "split") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { sprite: "p_ebolt", n: 5, spread: 0.22, speed: 260, mult: 0.4, el: "arcane", ox: 4, oy: 14, tele: 0.5, sound: "magic", scale: 0.6 });
        cool(e, "split", 2.6, 3.4);
        continue;
      }
      if (near(A, 30, 24) && ready(e, "bump") && A.ground) {
        hop(e, dirTo(A), 140, 220);
        for (let t = 0; t < 0.8; t += DT) { if (A.melee(20, 18, 0.8, { knock: 1 })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "bump", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 20, hi: 60 });
    }
  },
  damage: (e, dmg) => (e.host.fx.burst("spark", e.cx, e.cy, 4, LV), dmg),
});

// ════ 눈가린 수도사 ════ 빛에 홀리지 않는다 · 재빠른 주먹 세 번 · 몸을 날려 돌려차기(멀리 날림) · 맞받아치기: 막 맞은 직후엔 곧장 반격한다
register("md_monk", {
  ...X.pxMonk, speed: 78, sight: 260, atkMul: 1,
  damage: (e, dmg) => ((e.fz.mem.counter = 1), dmg * 0.85),
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 40 });
        continue;
      }
      if (M.counter && near(A, 60, 30)) {
        M.counter = 0;
        yield* melee(e, A, { tele: 0.12, wind: "rec", atk: "kick", dash: 160, fw: 34, fh: 26, mult: 0.9, knock: 2.2, fx: "heavy", tint: LC, sound: "punch" });
        continue;
      }
      M.counter = 0;
      if (near(A, 44, 26) && ready(e, "flurry")) {
        for (let k = 0; k < 3; k++) yield* melee(e, A, { tele: k ? 0.06 : 0.3, dash: 90, fw: 26, fh: 20, mult: 0.55, knock: k === 2 ? 1.4 : 0.2, fx: "slash", tint: LC, sound: "punch", recK: k < 2 ? 0.2 : 1 });
        cool(e, "flurry", 1.6, 2.2);
        continue;
      }
      if (ready(e, "kick") && A.ground && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 150 && Math.abs(A.dy) < 30) {
        A.face(), A.stop(1);
        A.tele(0.35);
        yield A.once("wind");
        A.play("kick");
        A.sound("jump", 0.4);
        hop(e, dirTo(A), Math.abs(A.dx) * 2.2, 200);
        for (let t = 0; t < 0.8; t += DT) { if (A.melee(30, 26, 1.1, { knock: 2.4 })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "kick", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ [정예] 수정 용거북 ════ 등의 수정 첨탑이 빛을 모아 하늘로 쏘면 플레이어 둘레에 빛줄기가 쏟아진다(예고) · 용머리로 물어뜯기 ·
//   땅을 굴러 수정 파편 · 등딱지에 숨으면(덜 아프다) 첨탑에서 빛 구슬이 사방으로
register("md_turtle", {
  ...X.pxTurtle, speed: 22, sight: 340, atkMul: 1.9, heavy: 1,
  damage: (e, dmg) => (e.fz.mem.shell ? dmg * 0.35 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "rain", 2, 3), cool(e, "shell", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "glow", sound: "bossRoar", vol: 0.5 });
      if (ready(e, "shell") && e.hp < e.maxHp * 0.7) {
        A.stop(1);
        M.shell = 1;
        A.play("glow");
        for (let k = 0; k < 3; k++) {
          yield 0.6;
          A.sound("magic", 0.5);
          for (let j = 0; j < 8; j++) A.shoot({ sprite: "p_orb", speed: 170, gravity: 0, life: 2, radius: 5 }, e.cx, e.cy - 40, (j / 8) * Math.PI * 2 + k * 0.4, 0.4, { el: "arcane", opts: { scale: 0.8 } });
        }
        M.shell = 0;
        cool(e, "shell", 10, 13);
        continue;
      }
      if (ready(e, "rain") && Math.abs(A.dx) < 320) {
        A.face(), A.stop(1);
        yield A.once("glow");
        A.sound("magic", 0.6);
        const xs = [A.p.cx, A.p.cx - 60, A.p.cx + 60, A.p.cx + (Math.random() - 0.5) * 160];
        for (const x of xs) A.tele(0.7, { bar: [x, 30] });
        yield 0.75;
        A.shake(2);
        for (const x of xs) { const y = groundY(e, x); e.host.fx.anim("ring", x, y - 4, { scale: 1.2, tint: LC }); A.shoot({ sprite: "p_ebolt", speed: 0, gravity: 0, life: 0.2, radius: 4 }, x, y - 20, Math.PI / 2, 0.01, { el: "arcane", opts: { scale: 1.4 } }); e.playerInRect(x - 15, y - 60, 30, 60) && e.hit(1.1, !1, "arcane", STUN(0.3), 0.6); }
        cool(e, "rain", 4, 5);
        continue;
      }
      if (near(A, 130, 60) && ready(e, "bite")) {
        if (near(A, 80, 60) && Math.random() < 0.4) yield* slam(e, A, { wind: "wind", atk: "stomp", r: 80, mult: 1.4, tele: 0.65, fwd: 20, shake: 4, chunk: 0x9ab8e8, tint: LC, dust: 0x6a7898 });
        else yield* melee(e, A, { tele: 0.55, bar: 1, dash: 60, fw: 100, fh: 50, mult: 1.6, knock: 1.6, st: BLEED(0.1, 2.5), fx: "heavy", tint: LC, sound: "punch" });
        cool(e, "bite", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 100 });
    }
  },
});
