// 샌드글래스 몬스터 12종 행동 (그림은 px_sg.js)
import { register } from "./core.js";
import * as X from "./px_sg.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const SANDC = 0xd8b880, TURQC = 0x50e0d0, AMBC = 0xffb040, CLAYC = 0xb0704a;
const hiddenDmg = (e, dmg) => (e.fz?.mem.hidden ? dmg * 0.25 : dmg);
const dust = (e, x, y, n = 8) => { for (let k = 0; k < n; k++) e.host.fx.burst("dust", x + (Math.random() - 0.5) * 40, y - Math.random() * 10, 1, SANDC); };

// ════ 모래 진드기 ════ 높은 곳에서 툭 떨어지듯 뛰어올라 들러붙어 피를 빤다(출혈 · 회복) · 배부르면 굼떠진다
register("sg_tick", {
  ...X.pxTick, speed: 50, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (M.fat > 0) { M.fat -= 0.1; A.play("fed"); }
      if (near(A, 110, 70) && ready(e, "jump") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(260, Math.abs(A.dx) * 2.4), 260);
        for (let t = 0; t < 0.8; t += DT) { if (A.melee(18, 16, 0.8, { knock: 0.3, st: BLEED(0.1, 2.5) })) { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.2); M.fat = 3; break; } if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "jump", M.fat > 0 ? 3 : 1.4, M.fat > 0 ? 4 : 2);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 80 });
    }
  },
});

// ════ 미라 익룡 ════ 너덜한 날개로 맴돌다 긴 부리로 찌르러 내리꽂는다(출혈) · 쉰 비명으로 모래 먼지를 일으켜 앞을 가린다(느려짐)
register("sg_ptero", {
  ...X.pxPtero, speed: 110, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "dive", 1, 2), cool(e, "shriek", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 14, speed: 44 });
        continue;
      }
      if (ready(e, "shriek") && near(A, 160, 120)) {
        A.stop(1);
        yield A.once("shriek");
        A.sound("bossRoar", 0.3);
        const x = A.p.cx;
        A.zone(x, groundY(e, x), 70, 2.6, 0.02, { el: "earth", st: CHILL(0.4, 1.2), kind: "slime" });
        dust(e, x, groundY(e, x), 14);
        cool(e, "shriek", 6, 8);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 240) {
        yield* dive(e, A, { tele: 0.45, v: 420, dur: 0.55, mult: 1, st: BLEED(0.1, 2.5), fw: 26, fh: 14 });
        cool(e, "dive", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 100 });
    }
  },
});

// ════ 사암 가면 ════ 청록 눈빛을 모아 빛줄기를 쏜다 · 둘레를 도는 돌 조각을 날려 보낸다
register("sg_mask", {
  ...X.pxMask, speed: 44, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "beam", 1, 2), cool(e, "rocks", 2.5, 3.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 20, ry: 8, speed: 18 });
        continue;
      }
      if (ready(e, "rocks") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { sprite: "p_rock", n: 4, spread: 0.3, speed: 200, mult: 0.5, el: "earth", ox: 0, oy: 6, tele: 0.45, sound: "shoot", scale: 0.7 });
        cool(e, "rocks", 3, 4);
        continue;
      }
      if (ready(e, "beam") && Math.abs(A.dx) < 280 && Math.abs(A.dy) < 80) {
        yield* shoot(e, A, { sprite: "p_ebolt", n: 1, speed: 360, mult: 0.9, el: "arcane", ox: 8, oy: 10, tele: 0.6, sound: "magic", scale: 1 });
        cool(e, "beam", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 70 });
    }
  },
});

// ════ [정예] 모래폭포 거인 ════ 바위 주먹 내려치기(땅울림 · 모래 더미가 남는다) · 모래를 길게 쏟아붓는 숨(느려짐) · 떨어진 바위를 던진다 ·
//   체력 절반부터 모래 진드기가 몸에서 떨어져 나온다
register("sg_colossus", {
  ...X.pxColossus, speed: 24, sight: 300, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "breath", 2, 3), cool(e, "throw", 3, 4), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "breath", sound: "bossRoar", vol: 0.4 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "sg_tick", n: 2, max: 4, dx: 40, anim: "wind", col: SANDC });
        cool(e, "call", 9, 12);
        continue;
      }
      if (near(A, 100, 60) && ready(e, "smash")) {
        yield* slam(e, A, { r: 64, mult: 1.6, tele: 0.7, fwd: 50, shake: 3, chunk: SANDC, tint: AMBC, dust: SANDC });
        A.zone(e.cx + e.facing * 50, groundY(e, e.cx + e.facing * 50), 50, 3, 0.02, { el: "earth", st: CHILL(0.35, 1), kind: "slime" });
        cool(e, "smash", 2, 2.8);
        continue;
      }
      if (ready(e, "breath") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 80) {
        A.face(), A.stop(1);
        A.tele(0.6, { bar: [e.cx + e.facing * 90, 160] });
        yield A.once("breath");
        A.sound("splat", 0.6);
        for (let t = 0; t < 0.8; t += 0.1) { e.playerInRect(e.cx + (e.facing > 0 ? 20 : -180), e.body.y - 90, 160, 70) && e.hit(0.3, !1, "earth", CHILL(0.5, 1.5), 0.3); dust(e, e.cx + e.facing * (40 + t * 140), e.body.y - 40, 2); yield 0.1; }
        cool(e, "breath", 4, 5.5);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) > 100 && Math.abs(A.dx) < 320) {
        yield* lob(e, A, { tele: 0.55, sprite: "p_bigrock", n: 1, mult: 1.3, el: "earth", st: STUN(0.3), oy: 90, ox: 30, scale: 1.2, chunkC: 0xc89a68 });
        cool(e, "throw", 3.4, 4.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 모래 상어 ════ 모래 속을 헤엄친다(지느러미만 보이고 덜 아프다) · 가까우면 튀어 올라 문다(출혈)
register("sg_shark", {
  ...X.pxShark, speed: 90, sight: 260, atkMul: 1,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      if (!e.aggro) {
        M.hidden = 1;
        yield* wander(e, A, { speed: 40, range: 80 });
        continue;
      }
      if (near(A, 80, 40) && ready(e, "leap")) {
        A.face(), A.stop(1);
        A.tele(0.35, { bar: [e.cx + e.facing * 30, 80] });
        yield A.once("wind");
        A.once("atk");
        M.hidden = 0;
        A.sound("splat", 0.5);
        dust(e, e.cx, e.body.y, 10);
        hop(e, dirTo(A), Math.min(280, Math.abs(A.dx) * 2.6), 220);
        for (let t = 0; t < 0.7; t += DT) { if (A.melee(28, 20, 1.1, { knock: 1.2, st: BLEED(0.1, 2.5) })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        yield A.once("rec");
        M.hidden = 1;
        cool(e, "leap", 1.8, 2.6);
        continue;
      }
      M.hidden = 1;
      yield* approach(e, A, { lo: 30, hi: 60 });
    }
  },
});

// ════ 천산갑 ════ 몸을 공처럼 말아 굴러 들이받는다(말린 동안 덜 아프다) · 가까우면 앞발톱으로 할퀸다
register("sg_pangolin", {
  ...X.pxPangolin, speed: 40, sight: 240, atkMul: 0.9, heavy: 0.6,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "roll", 1, 2);
    for (;;) {
      if (!e.aggro) {
        M.hidden = 0;
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (ready(e, "roll") && Math.abs(A.dx) > 50 && Math.abs(A.dx) < 260 && Math.abs(A.dy) < 30) {
        M.hidden = 1;
        yield* charge(e, A, { tele: 0.5, v: 300, dur: 1, mult: 1, knock: 1.4, fw: 22, fh: 22, dust: SANDC });
        M.hidden = 0;
        cool(e, "roll", 2.4, 3.2);
        continue;
      }
      if (near(A, 36, 22) && ready(e, "claw")) {
        yield* melee(e, A, { atk: "swipe", tele: 0.35, dash: 60, fw: 22, fh: 16, mult: 0.8, knock: 0.8, st: BLEED(0.08, 2), fx: "slash", tint: SANDC, sound: "swing" });
        cool(e, "claw", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 토용 병사 ════ 굳은 흙 몸이라 잘 밀리지 않는다 · 극(창)으로 길게 찌른다 · 대열을 지어 다닌다
register("sg_soldier", {
  ...X.pxClaySoldier, speed: 34, sight: 240, atkMul: 1, heavy: 0.6,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      if (near(A, 70, 30) && ready(e, "thrust")) {
        yield* melee(e, A, { tele: 0.5, bar: 1, dash: 80, fw: 62, fh: 16, mult: 1.1, knock: 1.2, fx: "slash", tint: CLAYC, sound: "swing" });
        cool(e, "thrust", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 64 });
    }
  },
});

// ════ [정예] 토용 장군 ════ 긴 칼 내려베기(땅울림) · 칼을 들어 토용 병사를 깨운다 · 금 간 틈의 호박빛을 터뜨려 둘레를 태운다(체력 절반부터)
register("sg_general", {
  ...X.pxGeneral, speed: 34, sight: 300, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "call", 2, 4), cool(e, "burst", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "call", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "call")) {
        yield* summon(e, A, { id: "sg_soldier", n: 2, max: 3, dx: 50, anim: "call", col: CLAYC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (e.hp < e.maxHp * 0.5 && ready(e, "burst") && near(A, 110, 70)) {
        A.stop(1);
        A.tele(0.7);
        yield A.once("wind");
        A.sound("explosion", 0.6), A.shake(2.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3.6, tint: AMBC });
        e.host.fx.burst("glow", e.cx, e.cy, 20, AMBC);
        near(A, 110, 80) && e.hit(1.2, !0, "fire", BURN(0.12, 2.5), 1.4);
        cool(e, "burst", 6, 8);
        continue;
      }
      if (near(A, 90, 50) && ready(e, "cleave")) {
        yield* slam(e, A, { r: 54, mult: 1.6, tele: 0.65, fwd: 44, shake: 3, chunk: CLAYC, tint: AMBC, dust: 0xa08060 });
        cool(e, "cleave", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 70 });
    }
  },
});

// ════ 화석 덩이 ════ 돌덩이 몸으로 내려찍는다(땅울림) · 잘 밀리지 않는다
register("sg_fossil", {
  ...X.pxFossil, speed: 30, sight: 220, atkMul: 1.1, heavy: 0.8,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 30 });
        continue;
      }
      if (near(A, 50, 30) && ready(e, "slam")) {
        yield* slam(e, A, { r: 40, mult: 1.2, tele: 0.55, fwd: 16, shake: 1.6, chunk: 0x8a7c68, tint: AMBC, dust: 0x9a8a70 });
        cool(e, "slam", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ 살아난 암모나이트 ════ 모래를 뿜어 쏜살같이 나아가 촉수로 감아 문다 · 멀면 먹물 대신 모래 먹구름을 뿜는다(느려짐)
register("sg_ammonite", {
  ...X.pxAmmonite, speed: 60, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "cloud", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 24 });
        continue;
      }
      if (ready(e, "cloud") && Math.abs(A.dx) < 200) {
        yield* shoot(e, A, { wind: "jet", atk: "jet", sprite: "p_orb", n: 3, spread: 0.3, speed: 160, mult: 0.4, el: "earth", st: CHILL(0.4, 1.5), ox: 20, oy: 0, tele: 0.45, sound: "splat", scale: 0.9 });
        cool(e, "cloud", 3, 4);
        continue;
      }
      if (ready(e, "grab") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.45, v: 340, dur: 0.5, mult: 1, st: STUN(0.4), fw: 22, fh: 18, knock: 0.6 });
        cool(e, "grab", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 30 });
    }
  },
});

// ════ 모래 입 ════ 유사 속에서 움직이지 않고 기다린다(덜 아프다) · 가까이 오면 모래가 빨려 들어가 끌려오고, 입이 쩍 열려 문다
register("sg_maw", {
  ...X.pxMaw, speed: 0, sight: 200, atkMul: 1.2, heavy: 1,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      A.stop(1);
      if (!e.aggro || !near(A, 130, 40)) { M.hidden = 1; A.play("idle"); yield 0.2; continue; }
      A.play("move");
      if (A.ground) A.p.body.vx += Math.sign(e.cx - A.p.cx) * 7;
      if (near(A, 50, 30) && ready(e, "bite")) {
        A.tele(0.4);
        yield A.once("wind");
        M.hidden = 0;
        A.once("atk");
        A.sound("punch", 0.6), A.shake(1.5);
        e.playerInRect(e.cx - 34, e.body.y - 30, 68, 34) && e.hit(1.3, !1, "phys", BLEED(0.12, 3), 1.4);
        yield A.once("rec");
        M.hidden = 1;
        cool(e, "bite", 1.6, 2.2);
        continue;
      }
      yield 0.05;
    }
  },
});

// ════ [정예] 화석 폭군 ════ 거대한 턱으로 문다(출혈) · 꼬리뼈로 뒤쪽까지 휩쓴다 · 포효로 둘레를 굳히고 천장에서 돌이 떨어진다 ·
//   쿵쿵 짓밟으며 돌진
register("sg_trex", {
  ...X.pxTyrant, speed: 40, sight: 320, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "roar", 2, 3), cool(e, "rush", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "roar", sound: "bossRoar", vol: 0.5 });
      if (ready(e, "roar") && near(A, 200, 90)) {
        A.stop(1);
        yield A.once("roar");
        A.sound("bossRoar", 0.6), A.shake(3);
        near(A, 110, 70) && e.hit(0.4, !1, "phys", STUN(0.6), 0.6);
        for (let k = 0; k < 4; k++) A.shoot({ sprite: "p_rock", speed: 0, gravity: 520, life: 2, radius: 6 }, A.p.cx + (k - 1.5) * 50 + (Math.random() - 0.5) * 20, A.p.body.y - 170, 0, 0.7, { el: "earth", opts: { vx: 0, vy: 40, scale: 0.9 } });
        cool(e, "roar", 6, 8);
        continue;
      }
      if (Math.sign(A.dx) !== e.facing && near(A, 130, 50) && ready(e, "tail")) {
        A.stop(1);
        A.tele(0.5, { bar: [e.cx - e.facing * 70, 130] });
        yield 0.35;
        A.once("tail");
        A.sound("swing", 0.8);
        yield 0.15;
        e.playerInRect(e.cx - (e.facing > 0 ? 140 : 0), e.body.y - 50, 140, 50) && e.hit(1.3, !1, "phys", void 0, 2);
        yield 0.5;
        cool(e, "tail", 2.4, 3.2);
        continue;
      }
      if (near(A, 110, 60) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.6, bar: 1, dash: 120, fw: 70, fh: 50, mult: 1.7, knock: 1.6, st: BLEED(0.14, 3), fx: "heavy", tint: AMBC, sound: "punch" });
        cool(e, "bite", 1.6, 2.2);
        continue;
      }
      if (ready(e, "rush") && Math.abs(A.dx) > 120 && Math.abs(A.dx) < 360 && Math.abs(A.dy) < 50) {
        yield* charge(e, A, { run: "move", tele: 0.7, v: 280, dur: 1.4, mult: 1.6, knock: 2.2, fw: 56, fh: 50, dust: 0x9a8a70 });
        cool(e, "rush", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 90 });
    }
  },
});
