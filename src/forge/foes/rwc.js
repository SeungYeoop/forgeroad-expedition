// 웹크로프트 몬스터 12종 행동 (그림은 px_wc.js)
import { register } from "./core.js";
import * as X from "./px_wc.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const SC = 0xe8e8f4, DC = 0xb8e8ff;
// 거미줄 덩이: 맞으면 느려지고, 떨어진 자리에 끈적한 거미줄 장판
const webBall = (e, A, o = {}) => ({ sprite: "sl_glob", tint: SC, st: CHILL(o.slow ?? 0.5, o.dur ?? 1.6), onDone: (pr) => A.zone(pr.x, pr.y, o.r ?? 30, o.zt ?? 3, 0.02, { el: "phys", st: CHILL(0.5, 1), kind: "slime" }) });

// ════ 깡충거미 ════ 웅크렸다가 훌쩍 뛰어 덮친다(독) · 가까우면 물고 뒤로 튄다
register("wc_jumper", {
  ...X.pxJumper, speed: 66, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "pounce", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22, range: 50 });
        continue;
      }
      if (ready(e, "pounce") && A.ground && Math.abs(A.dx) > 40 && Math.abs(A.dx) < 170 && Math.abs(A.dy) < 70) {
        A.face(), A.stop(1);
        A.tele(0.35);
        yield A.once("wind");
        A.play("atk");
        A.sound("jump", 0.4);
        hop(e, dirTo(A), Math.min(300, Math.abs(A.dx) * 2.4), 260 + Math.max(0, -A.dy) * 1.6);
        for (let t = 0; t < 1; t += DT) { if (A.melee(20, 18, 1, { knock: 0.6, el: "poison", st: POIS(0.08, 2.5) })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "pounce", 2.2, 3);
        continue;
      }
      if (near(A, 28, 20) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.25, dash: 80, fw: 22, fh: 16, mult: 0.8, knock: 0.6, el: "poison", st: POIS(0.06, 2), fx: "slash", tint: SC, sound: "punch" });
        A.ground && hop(e, -e.facing, 120, 160);
        cool(e, "bite", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 90 });
    }
  },
});

// ════ 고치 망자 ════ 비틀비틀 다가와 뼈 손으로 할퀸다 · 입에서 거미줄을 토해 묶는다(느려짐)
register("wc_husk", {
  ...X.pxHusk, speed: 30, sight: 220, atkMul: 1,
  *brain(e, A) {
    cool(e, "spit", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) > 40 && Math.abs(A.dx) < 180) {
        const w = webBall(e, A);
        yield* shoot(e, A, { wind: "spit", atk: "spit", sprite: w.sprite, n: 1, speed: 180, mult: 0.4, el: "phys", st: w.st, ox: 10, oy: 46, tele: 0.45, sound: "splat", scale: 0.9, onDone: w.onDone });
        cool(e, "spit", 3, 4);
        continue;
      }
      if (near(A, 44, 30) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.5, dash: 60, fw: 32, fh: 26, mult: 1.1, knock: 1, st: BLEED(0.06, 2), fx: "slash", tint: SC, sound: "swing" });
        cool(e, "claw", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ 매달린 번데기 ════ 천장 높이에 매달려 흔들린다 · 아래로 지나가면 실을 타고 툭 떨어져 문다 · 거미줄을 뱉는다
register("wc_pupa", {
  ...X.pxPupa, speed: 40, sight: 240, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "drop", 1, 2), cool(e, "spit", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 6, ry: 4, speed: 10 });
        continue;
      }
      if (ready(e, "drop") && Math.abs(A.dx) < 60 && A.dy > 20) {
        yield* dive(e, A, { tele: 0.4, v: 360, dur: 0.5, ty: 6, mult: 1, knock: 0.6, el: "poison", st: POIS(0.08, 2.5) });
        cool(e, "drop", 2.6, 3.4);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 200) {
        const w = webBall(e, A);
        yield* shoot(e, A, { sprite: w.sprite, n: 1, speed: 170, mult: 0.4, el: "phys", st: w.st, ox: 6, oy: -4, tele: 0.4, sound: "splat", scale: 0.8, onDone: w.onDone });
        cool(e, "spit", 3, 4);
        continue;
      }
      yield* approach(e, A, { keep: 30, alt: 90 });
    }
  },
});

// ════ [정예] 드라이더 기사 ════ 실 감은 창으로 꿰뚫기(출혈) · 여덟 다리로 일직선 돌진 · 뒤로 높이 뛰며 거미줄 그물을 쏜다 ·
//   앞다리 내려찍기 · 체력 절반부터 깡충거미를 부른다
register("wc_drider", {
  ...X.pxDrider, speed: 62, sight: 340, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "web", 2, 3), cool(e, "rush", 3, 4), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "rear", sound: "bossRoar", vol: 0.45 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "wc_jumper", n: 2, max: 3, dx: 40, anim: "rear", col: DC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "web") && near(A, 120, 60) && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("rear");
        hop(e, -e.facing, 220, 300);
        e.facing = dirTo(A);
        yield 0.25;
        A.once("web");
        A.sound("splat", 0.6);
        const w = webBall(e, A, { r: 44, zt: 4 });
        for (let k = 0; k < 3; k++) A.shoot({ sprite: w.sprite, speed: 230, gravity: 220, life: 2, radius: 8 }, e.cx + e.facing * 30, e.cy, Math.atan2(A.p.body.y - 10 - e.cy, A.p.cx - e.cx) + (k - 1) * 0.18, 0.6, { el: "phys", st: w.st, opts: { scale: 1.2, tint: SC, onDone: w.onDone } });
        yield* land(e, A);
        cool(e, "web", 4.5, 6);
        continue;
      }
      if (near(A, 110, 50) && ready(e, "lance")) {
        if (Math.random() < 0.4) yield* slam(e, A, { wind: "rear", atk: "atk", r: 50, mult: 1.5, tele: 0.6, fwd: 60, shake: 3, chunk: 0x4a4a56, tint: SC, dust: 0x5a5a66 });
        else yield* melee(e, A, { tele: 0.55, bar: 1, dash: 160, fw: 90, fh: 30, mult: 1.6, knock: 1.6, st: BLEED(0.12, 3), fx: "slash", tint: SC, sound: "swing" });
        cool(e, "lance", 1.6, 2.4);
        continue;
      }
      if (ready(e, "rush") && Math.abs(A.dx) > 130 && Math.abs(A.dx) < 340 && Math.abs(A.dy) < 50) {
        yield* charge(e, A, { tele: 0.7, v: 340, dur: 1.1, mult: 1.5, knock: 2, fw: 50, fh: 40, st: BLEED(0.1, 2.5), dust: 0x5a5a66 });
        cool(e, "rush", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 90 });
    }
  },
});

// ════ 실 채집꾼 ════ 갈고리 장대로 걸어 끌어당긴다 · 장대를 휘두른다 · 실 감개에서 끈적한 실을 던진다
register("wc_harvester", {
  ...X.pxHarvester, speed: 48, sight: 280, atkMul: 1,
  *brain(e, A) {
    cool(e, "hook", 2, 3), cool(e, "toss", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      if (ready(e, "hook") && Math.abs(A.dx) > 50 && Math.abs(A.dx) < 130 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        A.tele(0.45, { bar: [e.cx + e.facing * 65, 110] });
        yield A.once("hook");
        if (e.playerInRect(e.cx + (e.facing > 0 ? 10 : -130), e.body.y - 50, 120, 50)) { e.hit(0.5, !1, "phys", STUN(0.4), 0); A.p.body.vx = -e.facing * 320; }
        cool(e, "hook", 4, 5);
        continue;
      }
      if (near(A, 60, 30) && ready(e, "swing")) {
        yield* melee(e, A, { tele: 0.45, dash: 60, fw: 50, fh: 30, mult: 1, knock: 1.2, fx: "slash", tint: SC, sound: "swing" });
        cool(e, "swing", 1.6, 2.2);
        continue;
      }
      if (ready(e, "toss") && Math.abs(A.dx) < 240) {
        const w = webBall(e, A);
        yield* lob(e, A, { tele: 0.4, sprite: w.sprite, n: 1, mult: 0.4, el: "phys", st: w.st, oy: 40, ox: 4, scale: 1, onDone: w.onDone });
        cool(e, "toss", 2.8, 3.6);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 100 });
    }
  },
});

// ════ 통거미 ════ 긴 다리로 성큼성큼 · 높이 든 다리로 위에서 내리찌른다 · 맞으면 다리 하나를 떼어 두고 도망친다
register("wc_harvestman", {
  ...X.pxHarvestman, speed: 76, sight: 220, atkMul: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 26, range: 70 });
        continue;
      }
      if (e.fz.mem.flee > 0) {
        e.fz.mem.flee -= DT;
        A.play("move"), A.walk(-dirTo(A), e.speed * 1.2);
        yield 0;
        continue;
      }
      if (near(A, 54, 50) && ready(e, "stab")) {
        const hit = yield* melee(e, A, { tele: 0.4, dash: 60, fw: 30, fh: 44, mult: 1, knock: 0.8, st: POIS(0.06, 2), fx: "slash", tint: SC, sound: "swing" });
        hit && (e.fz.mem.flee = 0.8);
        cool(e, "stab", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
  damage: (e, dmg) => (Math.random() < 0.25 ? ((e.fz.mem.flee = 0.6), dmg * 0.5) : dmg),
});

// ════ 거미알 주머니 ════ 꼼짝 않고 숨 쉰다 · 플레이어가 가까우면 깡충거미가 깨어난다 · 붙어서 치면 터져 독 거미줄이 튄다
register("wc_eggsac", {
  ...X.pxEggsac, speed: 0, sight: 200, atkMul: 0.8, heavy: 1,
  *brain(e, A) {
    cool(e, "hatch", 1, 2), cool(e, "burst", 2, 3);
    for (;;) {
      A.stop(1);
      if (!e.aggro) { A.play("idle"); yield 0.3; continue; }
      if (ready(e, "burst") && near(A, 40, 40)) {
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.6);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.8, tint: SC });
        near(A, 50, 50) && e.hit(0.7, !1, "poison", POIS(0.1, 3), 1.6);
        A.zone(e.cx, groundY(e, e.cx), 40, 3, 0.03, { el: "poison", st: CHILL(0.5, 1), kind: "slime" });
        yield A.once("rec");
        cool(e, "burst", 4, 5);
        continue;
      }
      if (ready(e, "hatch") && Math.abs(A.dx) < 220) {
        yield* summon(e, A, { id: "wc_jumper", n: 1, max: 2, dx: 20, anim: "wind", col: DC });
        cool(e, "hatch", 7, 9);
        continue;
      }
      A.play("idle");
      yield 0.15;
    }
  },
});

// ════ [정예] 실에 감긴 거인 ════ 실 덩이 주먹 내려치기(땅울림) · 등의 기생 거미 다리로 연달아 찌르기 · 움켜쥐어 실로 감아 던지기 ·
//   정수리 기생 거미가 거미줄 덩이를 뿌린다 · 체력 절반부터 실이 찢겨 빨라진다
register("wc_bound", {
  ...X.pxBound, speed: 34, sight: 320, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "stab", 2, 3), cool(e, "web", 2, 3), cool(e, "grab", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "stab", sound: "bossRoar", vol: 0.5 });
      if (e.hp < e.maxHp * 0.5 && !e.fz.mem.torn) { e.fz.mem.torn = 1; e.speed *= 1.5; glowOn(e, SC, 16); A.sound("bossRoar", 0.5); }
      if (near(A, 90, 70) && ready(e, "stab")) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 40, 90] });
        for (let k = 0; k < 3; k++) {
          yield A.once("stab");
          A.sound("swing", 0.5);
          e.playerInRect(e.cx + (e.facing > 0 ? 0 : -90), e.body.y - 90, 90, 90) && e.hit(0.6, !1, "poison", POIS(0.06, 2), 0.6);
          yield 0.12;
        }
        cool(e, "stab", 3.5, 4.5);
        continue;
      }
      if (near(A, 70, 50) && ready(e, "grab")) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("grab");
        let held = !1;
        for (let t = 0; t < 0.25; t += DT) { if (A.melee(50, 50, 0.6, { knock: 0, st: STUN(1.1) })) { held = !0; break; } yield 0; }
        if (held) { yield 0.6; e.playerInRect(e.cx - 60, e.body.y - 90, 120, 90) && e.hit(0.4, !1, "phys", CHILL(0.6, 2), 0); A.p.body.vx = e.facing * 400, A.p.body.vy = -260; }
        cool(e, "grab", 4.5, 6);
        continue;
      }
      if (near(A, 110, 60) && ready(e, "smash")) {
        yield* slam(e, A, { r: 62, mult: 1.7, tele: 0.7, fwd: 50, shake: 4, chunk: 0xd8d8e0, tint: SC, dust: 0xc8c8d4 });
        cool(e, "smash", 1.8, 2.6);
        continue;
      }
      if (ready(e, "web") && Math.abs(A.dx) < 300) {
        const w = webBall(e, A, { r: 36 });
        yield* lob(e, A, { wind: "wind", atk: "stab", tele: 0.5, sprite: w.sprite, n: 3, gap: 0.12, spread: 70, mult: 0.5, el: "phys", st: w.st, oy: 90, ox: 20, scale: 1.1, onDone: w.onDone });
        cool(e, "web", 3.4, 4.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 은빛 좀벌레 ════ 번개처럼 갈지자로 내달려 물고 지나간다 · 맞으면 재빨리 달아난다
register("wc_silverfish", {
  ...X.pxSilverfish, speed: 110, sight: 220, atkMul: 0.7,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 30, range: 60 });
        continue;
      }
      if (M.flee > 0) { M.flee -= DT; A.play("move"), A.walk(-dirTo(A), e.speed); yield 0; continue; }
      if (near(A, 90, 20) && ready(e, "dart")) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.play("atk");
        A.sound("dash", 0.4);
        let hit = !1;
        for (let t = 0; t < 0.5; t += DT) { e.body.vx = e.facing * 300; !hit && A.melee(20, 14, 0.8, { knock: 0.4, st: BLEED(0.05, 1.5) }) && (hit = !0); yield 0; }
        A.stop(1);
        M.flee = 0.6;
        cool(e, "dart", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 80 });
    }
  },
  damage: (e, dmg) => ((e.fz.mem.flee = 0.5), dmg),
});

// ════ 문짝거미 ════ 흙 뚜껑 밑에 숨어 있다(덜 아프다) · 가까이 오면 뚜껑을 젖히고 튀어나와 문다(잠깐 묶임) · 다시 굴로 숨는다
register("wc_trapdoor", {
  ...X.pxTrapdoor, speed: 56, sight: 200, atkMul: 1.1,
  damage: (e, dmg) => (e.fz.mem.hidden ? dmg * 0.3 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      if (M.hidden) {
        A.stop(1);
        if (e.aggro && near(A, 60, 30)) {
          A.face();
          A.tele(0.25);
          A.sound("thud", 0.4), e.host.fx.burst("dust", e.cx, e.body.y - 4, 6, 0x4a4250);
          yield A.once("pop");
          M.hidden = 0;
          e.body.vx = e.facing * 220;
          for (let t = 0; t < 0.2; t += DT) { if (A.melee(28, 18, 1.1, { knock: 0.4, el: "poison", st: STUN(0.5) })) break; yield 0; }
          yield A.once("rec");
          cool(e, "sink", 2.5, 3.5);
          continue;
        }
        A.play("hide");
        yield 0.1;
        continue;
      }
      if (ready(e, "sink") && Math.abs(e.cx - e.homeX) < 20) {
        yield A.once("sink");
        M.hidden = 1;
        continue;
      }
      if (ready(e, "sink")) { A.play("move"), A.walk(Math.sign(e.homeX - e.cx), e.speed); yield 0; continue; }
      if (near(A, 34, 20) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.3, dash: 100, fw: 28, fh: 16, mult: 1, knock: 0.6, el: "poison", st: POIS(0.08, 2), fx: "slash", tint: SC, sound: "punch" });
        cool(e, "bite", 1.2, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 26 });
    }
  },
});

// ════ 거미 무녀 ════ 거미줄 그물을 날린다(느려짐) · 플레이어 발밑에 거미줄 올가미를 친다(예고 뒤 묶임) · 은빛 좀벌레를 부른다 · 가까우면 물러난다
register("wc_priestess", {
  ...X.pxPriestess, speed: 34, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "net", 1, 2), cool(e, "snare", 2.5, 3.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (ready(e, "call")) {
        yield* summon(e, A, { id: "wc_silverfish", n: 2, max: 2, dx: 24, anim: "summon", col: DC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "snare") && Math.abs(A.dx) < 260) {
        A.face(), A.stop(1);
        const x = A.p.cx, y = groundY(e, x);
        A.tele(0.3, { bar: [x, 56] });
        yield A.once("wind");
        yield 0.35;
        A.once("atk");
        A.sound("splat", 0.5);
        e.host.fx.anim("ring", x, y - 4, { scale: 1.4, tint: SC });
        e.playerInRect(x - 28, y - 30, 56, 30) && e.hit(0.5, !1, "phys", STUN(0.9), 0);
        A.zone(x, y, 30, 2.5, 0.02, { el: "phys", st: CHILL(0.6, 1), kind: "slime" });
        cool(e, "snare", 4, 5);
        continue;
      }
      if (ready(e, "net") && Math.abs(A.dx) < 280) {
        const w = webBall(e, A);
        yield* shoot(e, A, { sprite: w.sprite, n: 2, spread: 0.2, speed: 200, mult: 0.5, el: "phys", st: w.st, ox: 18, oy: 42, tele: 0.45, sound: "magic", scale: 0.9, onDone: w.onDone });
        cool(e, "net", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { lo: 120, hi: 200 });
    }
  },
});

// ════ [정예] 알 품은 타란툴라 ════ 앞다리를 쳐들어 송곳니로 내리꽂기(독) · 앞으로 내달려 들이받기 · 배의 가시털을 비벼 날린다(독 구름) ·
//   알 주머니에서 새끼 깡충거미가 쏟아진다
register("wc_tarantula", {
  ...X.pxTarantula, speed: 44, sight: 320, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "hairs", 2, 3), cool(e, "rush", 3, 4), cool(e, "brood", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "rear", sound: "bossRoar", vol: 0.5 });
      if (ready(e, "brood") && e.hp < e.maxHp * 0.8) {
        yield* summon(e, A, { id: "wc_jumper", n: 2, max: 3, dx: 50, anim: "flick", col: DC });
        cool(e, "brood", 9, 12);
        continue;
      }
      if (ready(e, "hairs") && near(A, 160, 80)) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("flick");
        A.sound("splat", 0.5);
        const x = e.cx - e.facing * 10;
        for (let k = 0; k < 8; k++) A.shoot({ sprite: "p_thorn", speed: 150 + k * 10, gravity: 120, life: 1.6, radius: 4 }, x, e.cy - 20, -Math.PI / 2 + (k - 3.5) * 0.3, 0.3, { el: "poison", st: POIS(0.08, 2), opts: { scale: 0.6, tint: 0xd8b880 } });
        A.zone(e.cx + e.facing * 30, groundY(e, e.cx + e.facing * 30), 60, 3, 0.04, { el: "poison", st: POIS(0.06, 2), kind: "slime" });
        yield A.once("rec");
        cool(e, "hairs", 5, 6.5);
        continue;
      }
      if (near(A, 100, 60) && ready(e, "fang")) {
        yield* slam(e, A, { wind: "rear", atk: "atk", r: 54, mult: 1.6, tele: 0.65, fwd: 56, shake: 3, st: POIS(0.12, 3), chunk: 0x4a4038, tint: 0xd8b880, dust: 0x4a4250 });
        cool(e, "fang", 1.8, 2.6);
        continue;
      }
      if (ready(e, "rush") && Math.abs(A.dx) > 120 && Math.abs(A.dx) < 320 && Math.abs(A.dy) < 50) {
        yield* charge(e, A, { tele: 0.7, v: 300, dur: 1.2, mult: 1.5, knock: 2.2, fw: 56, fh: 40, dust: 0x4a4250 });
        cool(e, "rush", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});
