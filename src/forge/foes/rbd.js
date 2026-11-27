// 본디프 몬스터 12종 행동 (그림은 px_bd.js)
import { register } from "./core.js";
import * as X from "./px_bd.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn, lurk } from "./bkit.js";

const BC = 0xe8dcc0, BN = 0xb8a888, GC = 0xb8e070;

// ════ 대머리황새 ════ 뼈 더미를 뒤지며 어슬렁 · 긴 부리로 내리찍는다(출혈) · 뼈를 물어 던진다 · 날개를 펴 뒤로 훌쩍 물러난다
register("bd_stork", {
  ...X.pxStork, speed: 46, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "toss", 1.5, 2.5), cool(e, "flap", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (ready(e, "flap") && A.ground && near(A, 30, 30)) {
        A.face(), A.play("flap");
        A.sound("jump", 0.4);
        hop(e, -dirTo(A), 160, 260);
        e.facing = dirTo(A);
        yield* land(e, A);
        cool(e, "flap", 4, 5);
        continue;
      }
      if (near(A, 54, 30) && ready(e, "peck")) {
        yield* melee(e, A, { tele: 0.4, dash: 80, fw: 34, fh: 22, mult: 1, knock: 0.8, st: BLEED(0.08, 2), fx: "slash", tint: BC, sound: "punch" });
        cool(e, "peck", 1.2, 1.8);
        continue;
      }
      if (ready(e, "toss") && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 220) {
        yield* lob(e, A, { wind: "toss", atk: "toss", tele: 0.35, sprite: "p_rock", n: 1, mult: 0.7, el: "phys", oy: 30, ox: 14, scale: 0.8, chunkC: BC });
        cool(e, "toss", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 46 });
    }
  },
});

// ════ 뼈 가면 사냥꾼 ════ 거리를 두고 뼈 촉 투창을 던진다(출혈) · 붙으면 창으로 찌르고 뒤로 물러난다
register("bd_hunter", {
  ...X.pxHunter, speed: 58, sight: 320, atkMul: 1,
  *brain(e, A) {
    cool(e, "jav", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 60 });
        continue;
      }
      if (near(A, 50, 30) && ready(e, "stab")) {
        yield* melee(e, A, { tele: 0.35, dash: 120, fw: 44, fh: 18, mult: 1, knock: 1.2, st: BLEED(0.06, 2), fx: "slash", tint: BC, sound: "swing" });
        A.ground && hop(e, -e.facing, 140, 160);
        cool(e, "stab", 1.6, 2.2);
        continue;
      }
      if (ready(e, "jav") && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 300 && Math.abs(A.dy) < 120) {
        yield* shoot(e, A, { wind: "aim", atk: "throw", sprite: "p_arrow", n: 1, speed: 330, g: 260, mult: 0.9, el: "phys", st: BLEED(0.08, 2.5), ox: 10, oy: 36, tele: 0.55, sound: "swing", scale: 1.3 });
        cool(e, "jav", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { lo: 110, hi: 190 });
    }
  },
});

// ════ 벌거숭이 두더지쥐 ════ 흙 속에 숨어 다닌다(덜 아프다) · 가까이 오면 튀어나와 앞니로 문다 · 다시 파고든다
register("bd_molerat", {
  ...X.pxMoleRat, speed: 60, sight: 200, atkMul: 0.9,
  damage: (e, dmg) => (e.fz.mem.hidden ? dmg * 0.4 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      if (M.hidden) {
        if (e.aggro && near(A, 34, 30)) {
          A.face(), A.stop(1);
          A.tele(0.3);
          A.sound("thud", 0.4), e.host.fx.burst("dust", e.cx, e.body.y - 4, 8, 0x6a5440);
          yield A.once("pop");
          M.hidden = 0;
          yield* melee(e, A, { tele: 0, wind: "rec", dash: 120, fw: 30, fh: 18, mult: 1, knock: 0.8, st: BLEED(0.06, 2), fx: "slash", tint: BC, sound: "punch" });
          cool(e, "dig", 2, 3);
          continue;
        }
        A.play("hide");
        e.aggro ? A.walk(dirTo(A), e.speed * 0.7) : A.stop(0.3);
        yield 0;
        continue;
      }
      if (ready(e, "dig")) {
        A.stop(1);
        e.host.fx.burst("dust", e.cx, e.body.y - 4, 8, 0x6a5440);
        yield A.once("dig");
        M.hidden = 1;
        continue;
      }
      if (near(A, 34, 24) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.3, dash: 100, fw: 28, fh: 18, mult: 0.9, knock: 0.6, st: BLEED(0.05, 2), fx: "slash", tint: BC, sound: "punch" });
        cool(e, "bite", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 26 });
    }
  },
});

// ════ [정예] 뼈 갑주 매머드 ════ 코로 휩쓸기 · 앞발을 들어 땅 구르기(넓은 땅울림, 기절) · 엄니 돌진 · 코로 바위를 집어 던진다 ·
//   체력 절반부터 구른 자리에서 뼈 파편이 튄다
register("bd_mammoth", {
  ...X.pxMammoth, speed: 36, sight: 320, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "stomp", 2, 3), cool(e, "rush", 3, 4), cool(e, "hurl", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "rear", sound: "bossRoar", vol: 0.5 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "stomp") && near(A, 130, 60)) {
        yield* slam(e, A, { wind: "rear", atk: "stomp", r: 84, mult: 1.6, tele: 0.75, fwd: 40, shake: 4.5, st: STUN(0.5), chunk: BN, tint: BC, dust: 0x6a5a48 });
        if (rage) for (let k = 0; k < 6; k++) A.shoot({ sprite: "p_rock", speed: 200, gravity: 500, life: 2, radius: 4 }, e.cx + e.facing * 40, e.body.y - 10, -Math.PI / 2 + (k - 2.5) * 0.35, 0.5, { el: "phys", opts: { scale: 0.7 } });
        cool(e, "stomp", 3.5, 4.5);
        continue;
      }
      if (near(A, 90, 50) && ready(e, "swipe")) {
        yield* melee(e, A, { tele: 0.5, bar: 1, fw: 70, fh: 50, mult: 1.3, knock: 2.2, up: 1, fx: "heavy", tint: BC, sound: "swing" });
        cool(e, "swipe", 1.6, 2.4);
        continue;
      }
      if (ready(e, "rush") && Math.abs(A.dx) > 130 && Math.abs(A.dx) < 340 && Math.abs(A.dy) < 50) {
        yield* charge(e, A, { tele: 0.8, v: 280, dur: 1.4, mult: 1.6, knock: 2.4, fw: 50, fh: 44, dust: 0x6a5a48 });
        cool(e, "rush", 4.5, 6);
        continue;
      }
      if (ready(e, "hurl") && Math.abs(A.dx) > 100 && Math.abs(A.dx) < 320) {
        yield* lob(e, A, { wind: "grab", atk: "hurl", tele: 0.5, sprite: "p_bigrock", n: 1, mult: 1.2, el: "earth", oy: 70, ox: 60, scale: 1.3, chunkC: 0x7a6a58 });
        A.shake(1.5);
        cool(e, "hurl", 3.4, 4.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 골수 점액 ════ 느릿느릿 · 녹은 뼛조각을 뱉는다(독) · 맞닿으면 녹아붙는다 · 지나간 자리에 골수 웅덩이
register("bd_marrow", {
  ...X.pxMarrow, speed: 26, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "spit", 1, 2), cool(e, "pool", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (near(A, 24, 24)) A.melee(22, 20, 0.4, { knock: 0.4, el: "poison", st: POIS(0.08, 2) });
      if (ready(e, "pool")) {
        A.zone(e.cx, groundY(e, e.cx), 34, 3, 0.04, { el: "poison", st: CHILL(0.35, 1), kind: "slime" });
        cool(e, "pool", 4, 5);
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 220) {
        yield* lob(e, A, { tele: 0.4, sprite: "sl_glob", n: 3, gap: 0.12, spread: 40, mult: 0.5, el: "poison", st: POIS(0.08, 2.5), oy: 20, ox: 10, scale: 0.9, chunkC: 0xd8a850 });
        cool(e, "spit", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 20 });
    }
  },
});

// ════ 척추 뱀 ════ 빠르게 미끄러져 다가와 고개를 쳐들었다 덮친다 · 꼬리 뼈방울을 흔들어 뼛조각을 흩뿌린다
register("bd_spine", {
  ...X.pxSpine, speed: 74, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "rattle", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 24, range: 70 });
        continue;
      }
      if (ready(e, "rattle") && near(A, 140, 80)) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.play("rattle");
        A.sound("shoot", 0.4);
        for (let k = 0; k < 5; k++) A.shoot({ sprite: "p_thorn", speed: 220, gravity: 300, life: 1.4, radius: 4 }, e.cx - e.facing * 20, e.body.y - 6, -Math.PI / 2 + (k - 2) * 0.4 + (e.facing > 0 ? 0.3 : -0.3), 0.4, { el: "phys", st: BLEED(0.05, 1.5), opts: { scale: 0.7, tint: BC } });
        yield 0.5;
        cool(e, "rattle", 3.4, 4.4);
        continue;
      }
      if (near(A, 80, 30) && ready(e, "strike")) {
        yield* melee(e, A, { tele: 0.45, dash: 220, fw: 34, fh: 22, mult: 1.1, knock: 1, st: POIS(0.08, 2.5), fx: "slash", tint: BC, sound: "swing" });
        cool(e, "strike", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 70 });
    }
  },
});

// ════ 뼈 점술사 ════ 공기뼈 셋을 던진다(떨어진 자리에서 터짐) · 플레이어 발밑에 뼈 가시를 솟게 한다(예고) · 체력이 줄면 척추 뱀을 일으킨다
register("bd_seer", {
  ...X.pxSeer, speed: 30, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "bones", 1, 2), cool(e, "spikes", 2.5, 3.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (ready(e, "call") && e.hp < e.maxHp * 0.7) {
        yield* summon(e, A, { id: "bd_spine", n: 1, max: 2, dx: 30, anim: "ritual", col: GC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "spikes") && Math.abs(A.dx) < 260) {
        A.face(), A.stop(1);
        const x = A.p.cx, y = groundY(e, x);
        A.tele(0.3, { bar: [x, 50] });
        yield A.once("ritual");
        yield 0.25;
        A.sound("thud", 0.5), A.shake(1.5);
        e.host.fx.burst("chunk", x, y - 6, 8, BC);
        e.host.fx.anim("ring", x, y - 4, { scale: 1.6, tint: GC });
        e.playerInRect(x - 25, y - 40, 50, 40) && e.hit(1, !0, "phys", BLEED(0.1, 2.5), 0.6);
        cool(e, "spikes", 4, 5);
        continue;
      }
      if (ready(e, "bones") && Math.abs(A.dx) < 260) {
        yield* lob(e, A, {
          tele: 0.45, sprite: "p_rock", n: 3, gap: 0.12, spread: 70, mult: 0.5, el: "arcane", oy: 44, ox: 16, scale: 0.6,
          onDone: (pr) => { e.host.fx.anim("ring", pr.x, pr.y, { scale: 0.9, tint: GC }); e.host.fx.burst("chunk", pr.x, pr.y, 3, BC); e.playerInRect(pr.x - 18, pr.y - 18, 36, 30) && e.hit(0.4, !1, "arcane", void 0, 0.5); },
        });
        cool(e, "bones", 2.2, 3);
        continue;
      }
      yield* approach(e, A, { lo: 130, hi: 200 });
    }
  },
});

// ════ [정예] 뼈무더기 거인 ════ 넓적다리뼈 몽둥이 내려치기(땅울림) · 옆으로 크게 휩쓸기 · 뼈 손으로 움켜쥐어 갈비 우리에 가뒀다 내던진다 ·
//   포효하면 가슴 불씨가 터져 주변을 태운다 · 체력 절반부터 척추 뱀을 일으킨다
register("bd_colossus", {
  ...X.pxColossus, speed: 40, sight: 320, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "grab", 2, 3), cool(e, "roar", 4, 6), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "roar", sound: "bossRoar", vol: 0.5 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "bd_spine", n: 2, max: 3, dx: 40, anim: "roar", col: 0xffb060 });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "roar") && near(A, 80, 60)) {
        A.stop(1);
        A.tele(0.6);
        yield A.once("roar");
        A.sound("explosion", 0.6), A.shake(3);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3, tint: 0xffb060 });
        near(A, 80, 60) && e.hit(1, !1, "fire", BURN(0.12, 2.5), 2);
        cool(e, "roar", 6, 8);
        continue;
      }
      if (near(A, 70, 50) && ready(e, "grab")) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("grab");
        let held = !1;
        for (let t = 0; t < 0.25; t += DT) { if (A.melee(44, 50, 0.5, { knock: 0, st: STUN(1.2) })) { held = !0; break; } yield 0; }
        if (held) { for (let k = 0; k < 3; k++) { yield 0.3; e.playerInRect(e.cx - 50, e.body.y - 90, 100, 90) && e.hit(0.35, !1, "fire", BURN(0.08, 1.5), 0); A.shake(1); } A.p.body.vx = e.facing * 420, A.p.body.vy = -280; }
        cool(e, "grab", 4.5, 6);
        continue;
      }
      if (near(A, 110, 60) && ready(e, "smash")) {
        if (Math.random() < 0.5) yield* slam(e, A, { r: 64, mult: 1.7, tele: 0.7, fwd: 50, shake: 4, chunk: BN, tint: BC, dust: 0x6a5a48 });
        else yield* melee(e, A, { tele: 0.6, bar: 1, dash: 60, fw: 96, fh: 50, mult: 1.5, knock: 2, fx: "heavy", tint: BC, sound: "swing" });
        cool(e, "smash", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 시체 구더기 ════ 꿈틀꿈틀 기어와 문다(독) · 썩은 즙을 뱉는다
register("bd_maggot", {
  ...X.pxMaggot, speed: 30, sight: 180, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (near(A, 30, 20) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.35, dash: 60, fw: 26, fh: 16, mult: 0.8, knock: 0.4, el: "poison", st: POIS(0.08, 2.5), fx: "slash", tint: 0xc8d090, sound: "splat" });
        cool(e, "bite", 1.2, 1.8);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 160) {
        yield* lob(e, A, { tele: 0.4, sprite: "sl_glob", n: 1, mult: 0.5, el: "poison", st: POIS(0.1, 3), oy: 8, ox: 14, scale: 0.7, sound: "splat", chunkC: 0xa8b070 });
        cool(e, "spit", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 24 });
    }
  },
});

// ════ 구울 ════ 네 발로 내달려 덮친다 · 갈고리 손톱으로 두 번 할퀸다(출혈) · 피를 빨면 체력을 되찾는다
register("bd_ghoul", {
  ...X.pxGhoul, speed: 84, sight: 260, atkMul: 1,
  *brain(e, A) {
    cool(e, "leap", 1.5, 2.5);
    const heal = () => { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.06); glowOn(e, 0xc03030, 6); };
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 50, idle: "feed" });
        continue;
      }
      if (ready(e, "leap") && A.ground && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 180 && Math.abs(A.dy) < 60) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.play("leap");
        A.sound("jump", 0.5);
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2.4), 300);
        for (let t = 0; t < 1; t += DT) { if (A.melee(26, 24, 1.1, { knock: 1, st: BLEED(0.08, 2) })) { heal(); break; } if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "leap", 3, 4);
        continue;
      }
      if (near(A, 44, 30) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.35, dash: 100, fw: 32, fh: 24, mult: 0.8, knock: 0.3, st: BLEED(0.06, 2), fx: "slash", tint: 0xd0c0a0, sound: "swing", recK: 0.3, onHit: heal });
        yield* melee(e, A, { tele: 0.08, dash: 100, fw: 32, fh: 24, mult: 0.9, knock: 1.2, st: BLEED(0.06, 2), fx: "slash", tint: 0xd0c0a0, sound: "swing", onHit: heal });
        cool(e, "claw", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 36 });
    }
  },
});

// ════ 부패 쉬파리 ════ 윙윙 맴돌다 내리꽂힌다(독) · 부푼 배를 짜내 독 구름을 떨어뜨린다
register("bd_bloatfly", {
  ...X.pxBloatfly, speed: 70, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "drop", 2, 3), cool(e, "dive", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 30 });
        continue;
      }
      if (ready(e, "drop") && Math.abs(A.dx) < 50 && A.dy > 20) {
        A.stop(1);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.5);
        A.shoot({ sprite: "sl_glob", speed: 0, gravity: 500, life: 2, radius: 6 }, e.cx, e.cy + 6, Math.PI / 2, 0.5, { el: "poison", st: POIS(0.1, 3), opts: { scale: 1, tint: 0x8ab040, onDone: (pr) => A.zone(pr.x, pr.y, 36, 3, 0.05, { el: "poison", st: POIS(0.08, 2), kind: "slime" }) } });
        yield A.once("rec");
        cool(e, "drop", 3.5, 4.5);
        continue;
      }
      if (ready(e, "dive") && near(A, 140, 120)) {
        yield* dive(e, A, { tele: 0.4, v: 320, mult: 0.9, el: "poison", st: POIS(0.08, 2.5) });
        cool(e, "dive", 2.6, 3.6);
        continue;
      }
      yield* approach(e, A, { keep: Math.abs(A.dx) < 60 ? 0 : 50, alt: 70 });
    }
  },
});

// ════ [정예] 무덤지기 거인 ════ 무덤 삽 내려찍기(땅울림) · 삽으로 흙과 뼈를 퍼 던진다 · 해골 등롱의 도깨비불을 부채꼴로 쏜다(독불) ·
//   땅을 파 구울을 불러낸다
register("bd_keeper", {
  ...X.pxKeeper, speed: 36, sight: 320, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "lamp", 2, 3), cool(e, "dig", 2, 3), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "lamp", sound: "bossRoar", vol: 0.45 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.75) {
        yield* summon(e, A, { id: "bd_ghoul", n: 1, max: 2, dx: 40, anim: "dig", col: GC });
        cool(e, "call", 9, 12);
        continue;
      }
      if (near(A, 100, 50) && ready(e, "chop")) {
        yield* slam(e, A, { r: 60, mult: 1.7, tele: 0.7, fwd: 56, shake: 3.5, chunk: 0x6a5440, tint: BC, dust: 0x6a5440 });
        cool(e, "chop", 1.8, 2.6);
        continue;
      }
      if (ready(e, "lamp") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { wind: "lamp", atk: "lamp", sprite: "p_fire", n: 5, spread: 0.2, speed: 200, mult: 0.6, el: "poison", st: POIS(0.1, 3), ox: 30, oy: 40, tele: 0.55, sound: "magic", scale: 1 });
        cool(e, "lamp", 3, 4);
        continue;
      }
      if (ready(e, "dig") && Math.abs(A.dx) > 80 && Math.abs(A.dx) < 300) {
        yield* lob(e, A, { wind: "wind", atk: "dig", tele: 0.5, sprite: "p_rock", n: 4, gap: 0.08, spread: 80, mult: 0.6, el: "earth", oy: 30, ox: 40, scale: 0.9, chunkC: 0x6a5440 });
        cool(e, "dig", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});
