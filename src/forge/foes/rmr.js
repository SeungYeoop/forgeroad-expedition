// 마이어루트 몬스터 12종 행동 (그림은 px_mr.js)
import { register } from "./core.js";
import * as X from "./px_mr.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const GLC = 0x9af0c0, BLC = 0x80d8ff, MOSSC = 0x4a7a4a;

// ════ 뿌리 나무늘보 ════ 느릿느릿하지만 갈고리 발톱을 크게 휘두르면 아프다(출혈) · 잘 밀리지 않는다
register("mr_sloth", {
  ...X.pxSloth, speed: 18, sight: 200, atkMul: 1.3, heavy: 0.8,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 6, range: 30 });
        continue;
      }
      if (near(A, 60, 40) && ready(e, "hook")) {
        yield* melee(e, A, { tele: 0.7, bar: 1, dash: 50, fw: 50, fh: 40, mult: 1.4, knock: 1.6, st: BLEED(0.12, 3), fx: "heavy", tint: 0xd8ccb0, sound: "swing" });
        cool(e, "hook", 1.8, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 44 });
    }
  },
});

// ════ 꼽등이 ════ 예측하기 힘들게 크게 뛰어다니다 몸통으로 덮친다
register("mr_cricket", {
  ...X.pxCricket, speed: 60, sight: 240, atkMul: 0.8,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        if (A.ground && Math.random() < 0.25) { A.play("move"); hop(e, Math.random() < 0.5 ? -1 : 1, 120, 260); yield* land(e, A); }
        A.play("idle"), A.stop(1);
        yield 0.4;
        continue;
      }
      if (near(A, 140, 60) && ready(e, "leap") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2.4), 320);
        for (let t = 0; t < 0.9; t += DT) { if (A.melee(20, 16, 0.8, { knock: 1 })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "leap", 0.8, 1.4);
        continue;
      }
      if (A.ground) { A.play("move"); hop(e, dirTo(A) * (Math.random() < 0.2 ? -1 : 1), 140, 280); yield* land(e, A); yield 0.2; continue; }
      yield 0.1;
    }
  },
});

// ════ 덩굴뱀 ════ 뿌리에 매달려 기다리다 번개처럼 머리를 뻗어 문다(독) · 물고 나면 다시 감는다
register("mr_vinesnake", {
  ...X.pxVineSnake, speed: 30, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 10, ry: 4, speed: 10 });
        continue;
      }
      if (near(A, 80, 60) && ready(e, "strike")) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        for (let t = 0; t < 0.2; t += DT) { if (A.melee(56, 30, 1, { knock: 0.6, st: POIS(0.14, 3) })) break; yield 0; }
        yield A.once("rec");
        cool(e, "strike", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { keep: 60, alt: 40 });
    }
  },
});

// ════ [정예] 실빛 거대 유충 ════ 천장에서 끈끈한 빛 실을 늘어뜨린다 — 실에 닿으면 묶이고(잠깐 묶임) 끌려 올라간다 · 빛 방울을 떨어뜨린다(독) ·
//   체력 절반부터 덩굴뱀이 실을 타고 내려온다
register("mr_glowworm", {
  ...X.pxGlowworm, speed: 30, sight: 300, atkMul: 1.6,
  *brain(e, A) {
    cool(e, "drip", 1.5, 2.5), cool(e, "reel", 2.5, 3.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 20, ry: 4, speed: 12 });
        continue;
      }
      yield* notice(e, A, { anim: "reel", sound: "bossRoar", vol: 0.3 });
      // 늘어진 실: 바로 아래 넓게 닿으면 느려진다
      if (Math.abs(A.dx) < 70 && A.dy > 0 && A.dy < 140) A.p.body.vx *= 0.9;
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "mr_vinesnake", n: 2, max: 3, dx: 40, dy: 30, anim: "reel", col: GLC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "reel") && Math.abs(A.dx) < 90 && A.dy > 0 && A.dy < 150) {
        A.stop(1);
        A.tele(0.6, { bar: [e.cx, 120] });
        yield A.once("wind");
        A.once("reel");
        A.sound("splat", 0.5);
        if (e.playerInRect(e.cx - 60, e.cy, 120, 150)) { e.hit(0.8, !1, "arcane", STUN(0.8), 0); A.p.body.vy = -300; A.p.body.vx = Math.sign(e.cx - A.p.cx) * 120; }
        yield 0.5;
        cool(e, "reel", 4, 5);
        continue;
      }
      if (ready(e, "drip") && Math.abs(A.dx) < 220) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("atk");
        for (let k = 0; k < 6; k++) A.shoot({ sprite: "sl_glob", speed: 0, gravity: 380, life: 2.4, radius: 5 }, A.p.cx + (k - 2.5) * 26 + (Math.random() - 0.5) * 10, e.cy + 20, 0, 0.5, { el: "poison", st: POIS(0.1, 2.5), opts: { vx: 0, vy: 30, scale: 0.7, tint: BLC } });
        cool(e, "drip", 2.6, 3.4);
        continue;
      }
      A.play("move");
      A.flyTo(A.p.cx, A.p.body.y - 140, e.speed);
      yield 0;
    }
  },
});

// ════ 잠자리 유충 ════ 진흙 속에서 기다리다 접혀 있던 아래턱을 번개처럼 쭉 뻗어 문다(사거리 김)
register("mr_nymph", {
  ...X.pxNymph, speed: 34, sight: 220, atkMul: 1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (near(A, 70, 24) && ready(e, "mask")) {
        A.face(), A.stop(1);
        A.tele(0.4, { bar: [e.cx + e.facing * 40, 70] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        for (let t = 0; t < 0.18; t += DT) { if (A.melee(60, 16, 1.1, { knock: -0.8, st: BLEED(0.08, 2) })) break; yield 0; }
        yield A.once("rec");
        cool(e, "mask", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 60 });
    }
  },
});

// ════ 큰수달 ════ 빠르게 미끄러지듯 다가와 사납게 문다 · 무리를 지어 다닌다
register("mr_otter", {
  ...X.pxOtter, speed: 110, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 30, range: 80 });
        continue;
      }
      if (near(A, 90, 30) && ready(e, "bite") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(300, Math.abs(A.dx) * 2.6), 140);
        for (let t = 0; t < 0.5; t += DT) { if (A.melee(20, 14, 0.9, { knock: 1, st: BLEED(0.08, 2) })) break; if (t > 0.12 && A.ground) break; yield 0; }
        yield* land(e, A);
        if (A.ground) { hop(e, -e.facing, 160, 140); yield* land(e, A); }
        cool(e, "bite", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 80 });
    }
  },
});

// ════ 물장군 ════ 낫 앞다리로 움켜쥐고(잠깐 묶임) 주둥이로 찔러 체액을 빤다(독)
register("mr_waterbug", {
  ...X.pxWaterbug, speed: 40, sight: 220, atkMul: 1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (near(A, 40, 24) && ready(e, "grab")) {
        const hit = yield* melee(e, A, { tele: 0.45, dash: 90, fw: 26, fh: 18, mult: 0.7, knock: 0, st: STUN(0.6), fx: "slash", tint: 0x8a7a5a, sound: "punch" });
        if (hit) { A.once("stab"); yield 0.2; A.melee(24, 18, 0.8, { knock: 0.8, st: POIS(0.12, 3) }); yield 0.3; }
        cool(e, "grab", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 아나콘다 ════ 머리를 들어 크게 문다(출혈) · 몸을 휘감아 조인다(잠깐 묶임 · 여러 번) · 꼬리로 쓸어낸다 ·
//   체력 절반부터 물장군이 몰려든다
register("mr_anaconda", {
  ...X.pxAnaconda, speed: 46, sight: 300, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "coil", 2.5, 3.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "mr_waterbug", n: 2, max: 3, dx: 50, anim: "wind", col: MOSSC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (near(A, 70, 40) && ready(e, "coil")) {
        A.face(), A.stop(1);
        A.tele(0.6);
        yield A.once("wind");
        A.once("coil");
        let held = !1;
        for (let t = 0; t < 0.3; t += DT) { if (A.melee(50, 40, 0.6, { knock: 0, st: STUN(1.2) })) { held = !0; break; } yield 0; }
        if (held) for (let k = 0; k < 3; k++) { A.play("coil"); yield 0.35; e.playerInRect(e.cx - 40, e.body.y - 40, 80, 40) && e.hit(0.5, !1, "phys", STUN(0.4), 0); A.shake(1); }
        yield A.once("rec");
        cool(e, "coil", 5, 6.5);
        continue;
      }
      if (near(A, 120, 50) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.6, bar: 1, dash: 160, fw: 70, fh: 40, mult: 1.6, knock: 1.4, st: BLEED(0.14, 3), fx: "heavy", tint: 0xe8d040, sound: "punch" });
        cool(e, "bite", 1.6, 2.2);
        continue;
      }
      if (Math.sign(A.dx) !== e.facing && near(A, 140, 40) && ready(e, "tail")) {
        A.stop(1);
        A.tele(0.5, { bar: [e.cx - e.facing * 70, 130] });
        yield 0.4;
        A.sound("swing", 0.7);
        e.playerInRect(e.cx - (e.facing > 0 ? 140 : 0), e.body.y - 30, 140, 30) && e.hit(1.2, !1, "phys", void 0, 2);
        yield 0.4;
        cool(e, "tail", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 90 });
    }
  },
});

// ════ 장님 물고기 떼 ════ 앞이 안 보여 소리를 따라 떼로 휘돌며 몰려와 조금씩 뜯어먹는다
register("mr_cavefish", {
  ...X.pxCavefish, speed: 70, sight: 200, atkMul: 0.6,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 14, speed: 30 });
        continue;
      }
      if (near(A, 30, 30) && ready(e, "nibble")) {
        A.once("wind");
        for (let t = 0; t < 1.2; t += 0.2) { A.play("atk"); A.flyTo(A.p.cx, A.p.body.y - 16, e.speed * 1.3); A.melee(26, 26, 0.25, { knock: 0, st: BLEED(0.04, 1.5) }); yield 0.2; }
        A.play("rec");
        e.body.vx = -dirTo(A) * 120;
        yield 0.5;
        cool(e, "nibble", 1.4, 2);
        continue;
      }
      A.play("move");
      A.flyTo(A.p.cx, A.p.body.y - 16, e.speed);
      yield 0;
    }
  },
});

// ════ 갑주어 ════ 뼈 판 머리로 들이받고 칼날 턱판으로 물어 끊는다(출혈) · 갑옷 머리라 앞에서 치면 덜 아프다
register("mr_placoderm", {
  ...X.pxPlacoderm, speed: 70, sight: 260, atkMul: 1.1,
  damage(e, dmg, C) {
    const dir = C?.dir ?? 0;
    return dir === -e.facing ? dmg * 0.6 : dmg;
  },
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, ry: 12, speed: 30 });
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.5, v: 360, dur: 0.5, mult: 1.2, st: BLEED(0.1, 2.5), fw: 26, fh: 16, knock: 1.4 });
        cool(e, "ram", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 20 });
    }
  },
});

// ════ 놋쇠 잠수 인형 ════ 무거운 장화로 뚜벅뚜벅 · 팔 끝 드릴을 돌려 밀고 들어온다(여러 번) · 공기통 밸브를 열어 거품을 뿜는다(밀려남)
register("mr_diver", {
  ...X.pxDiver, speed: 28, sight: 240, atkMul: 1.1, heavy: 0.9,
  *brain(e, A) {
    cool(e, "steam", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (near(A, 50, 30) && ready(e, "drill")) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 30, 50] });
        yield A.once("wind");
        A.play("atk");
        A.sound("dash", 0.4);
        for (let t = 0; t < 0.9; t += 0.15) { e.body.vx = e.facing * 60; A.melee(34, 18, 0.4, { knock: 0.4, st: BLEED(0.05, 1.5) }); yield 0.15; }
        A.stop(1);
        yield A.once("rec");
        cool(e, "drill", 2, 2.8);
        continue;
      }
      if (ready(e, "steam") && near(A, 90, 40)) {
        yield* shoot(e, A, { sprite: "p_wave", n: 1, speed: 200, mult: 0.4, el: "ice", st: CHILL(0.3, 1), ox: 14, oy: 40, tele: 0.4, sound: "splat", scale: 0.9 });
        cool(e, "steam", 4, 5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 36 });
    }
  },
});

// ════ [정예] 동굴 문어 ════ 팔을 들어 내리친다 · 팔로 감아 끌어당긴다(잠깐 묶임) · 먹물을 뿜어 시커멓게 한다(느려짐) ·
//   맞으면 먹물을 뿜으며 물러난다
register("mr_octopus", {
  ...X.pxOctopus, speed: 36, sight: 300, atkMul: 1.8, heavy: 0.9,
  *brain(e, A) {
    cool(e, "grab", 2, 3), cool(e, "ink", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "grab", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "ink") && near(A, 160, 60)) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("ink");
        A.sound("splat", 0.7);
        const x = e.cx - e.facing * 20;
        A.zone(x, groundY(e, x), 110, 3.4, 0.03, { el: "poison", st: CHILL(0.5, 1.6), kind: "slime" });
        if (A.ground) { hop(e, -dirTo(A), 160, 120); yield* land(e, A); }
        cool(e, "ink", 6, 8);
        continue;
      }
      if (ready(e, "grab") && Math.abs(A.dx) > 50 && Math.abs(A.dx) < 170 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        A.tele(0.55, { bar: [e.cx + e.facing * 90, 150] });
        yield A.once("grab");
        A.sound("swing", 0.6);
        if (e.playerInRect(e.cx + (e.facing > 0 ? 20 : -170), e.body.y - 40, 150, 40)) { e.hit(0.7, !1, "phys", STUN(0.6), 0); A.p.body.vx = -e.facing * 360, A.p.body.vy = -100; }
        cool(e, "grab", 4, 5);
        continue;
      }
      if (near(A, 100, 60) && ready(e, "lash")) {
        yield* slam(e, A, { r: 54, mult: 1.5, tele: 0.6, fwd: 40, shake: 2.5, chunk: 0x9a4a3a, tint: 0xd8b040, dust: 0x5a4a3a });
        cool(e, "lash", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});
