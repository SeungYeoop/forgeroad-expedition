// 블랙펜 몬스터 12종 행동 (그림은 px_bk.js)
import { register } from "./core.js";
import * as X from "./px_bk.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const WISPC = 0x90ffb0, MOONC = 0xd8e8ff, FIREC = 0xffb050, MUDC = 0x3a3428;
const hiddenDmg = (e, dmg) => (e.fz?.mem.hidden ? dmg * 0.2 : dmg);

// ════ 교수목 버드나무 ════ 늘어진 가지를 휘둘러 길게 후려친다 · 가지 올가미로 낚아채 끌어당긴다(잠깐 묶임)
register("bk_willow", {
  ...X.pxWillow, speed: 22, sight: 240, atkMul: 1.1, heavy: 0.8,
  *brain(e, A) {
    cool(e, "snare", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (ready(e, "snare") && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 160 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        A.tele(0.6, { bar: [e.cx + e.facing * 80, 160] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.6);
        yield 0.15;
        if (e.playerInRect(e.cx + (e.facing > 0 ? 20 : -160), e.body.y - 60, 140, 60)) { e.hit(0.6, !1, "phys", STUN(0.7), 0); A.p.body.vx = -e.facing * 320, A.p.body.vy = -140; }
        yield A.once("rec");
        cool(e, "snare", 5, 6.5);
        continue;
      }
      if (near(A, 80, 50) && ready(e, "lash")) {
        yield* melee(e, A, { tele: 0.55, bar: 1, fw: 72, fh: 44, mult: 1.2, knock: 1.4, fx: "slash", tint: 0x4a6a44, sound: "swing", win: 0.25 });
        cool(e, "lash", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 60 });
    }
  },
});

// ════ 쥐왕 ════ 꿈틀대며 몰려와 여러 입이 한꺼번에 문다(세 번 · 독) · 맞으면 흩어지듯 물러났다 다시 온다
register("bk_ratking", {
  ...X.pxRatKing, speed: 56, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 50 });
        continue;
      }
      if (near(A, 40, 24) && ready(e, "swarm")) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        for (let k = 0; k < 3; k++) { A.once("atk"); A.sound("punch", 0.3); e.body.vx = e.facing * 80; for (let t = 0; t < 0.18; t += DT) { A.melee(24, 18, 0.45, { knock: 0.3, st: POIS(0.06, 2.5) }); yield 0; } yield 0.08; }
        yield A.once("rec");
        cool(e, "swarm", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 검은 고양이 ════ 등을 세워 쉿 하고, 낮게 웅크렸다 덮쳐 할퀸다(출혈) · 목숨이 아홉 — 한 번은 쓰러져도 다시 일어난다
register("bk_cat", {
  ...X.pxCat, speed: 110, sight: 260, atkMul: 0.9,
  damage(e, dmg) {
    const M = e.fz?.mem;
    if (M && !M.life && dmg >= e.hp) { M.life = 1; e.hp = Math.round(e.maxHp * 0.4); e.host.fx.burst("glow", e.cx, e.cy, 12, WISPC); e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.6, tint: WISPC }); return 0; }
    return dmg;
  },
  *brain(e, A) {
    cool(e, "hiss", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 26, range: 60 });
        continue;
      }
      if (ready(e, "hiss") && near(A, 120, 40)) {
        A.face(), A.stop(1);
        yield A.once("hiss");
        A.sound("splat", 0.2);
        cool(e, "hiss", 5, 7);
        continue;
      }
      if (near(A, 110, 30) && ready(e, "pounce") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        A.sound("dash", 0.4);
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2.6), 220);
        for (let t = 0; t < 0.6; t += DT) { if (A.melee(18, 16, 0.9, { knock: 0.8, st: BLEED(0.1, 2.5) })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        if (A.ground) { hop(e, -e.facing, 140, 160); yield* land(e, A); }
        cool(e, "pounce", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 100 });
    }
  },
});

// ════ [정예] 늪 늑대인간 ════ 발톱 연타(출혈) · 껑충 뛰어 덮치기 · 달을 향해 울부짖어 가까운 적을 얼어붙게 하고 날뛴다(빨라짐) ·
//   체력 절반부터 더 빠르고 연타가 길어진다
register("bk_werewolf", {
  ...X.pxWerewolf, speed: 70, sight: 300, atkMul: 1.8, heavy: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "howl", 2, 3), cool(e, "leap", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "howl", sound: "bossRoar", vol: 0.45 });
      const rage = e.hp < e.maxHp * 0.5;
      if (rage && !M.rage) { M.rage = 1; e.speed *= 1.35; glowOn(e, 0xff4040, 4); }
      if (ready(e, "howl") && near(A, 160, 80)) {
        A.stop(1);
        yield A.once("howl");
        A.sound("bossRoar", 0.5), A.shake(1.5);
        e.host.fx.anim("ring", e.cx, e.cy - 20, { scale: 3.4, tint: MOONC });
        near(A, 120, 70) && e.hit(0.4, !1, "phys", STUN(0.7), 0);
        cool(e, "howl", 7, 9);
        continue;
      }
      if (ready(e, "leap") && A.ground && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 240) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("leap");
        hop(e, dirTo(A), Math.min(360, Math.abs(A.dx) * 2.2), 340);
        for (let t = 0; t < 1; t += DT) { if (A.melee(34, 34, 1.4, { knock: 1.6, st: BLEED(0.12, 3) })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        A.shake(2);
        cool(e, "leap", 2.6, 3.6);
        continue;
      }
      if (near(A, 70, 50) && ready(e, "claw")) {
        const n = rage ? 3 : 2;
        for (let k = 0; k < n; k++) yield* melee(e, A, { tele: k ? 0.12 : 0.45, dash: 140, fw: 46, fh: 40, mult: 1.1, knock: k === n - 1 ? 1.6 : 0.5, st: BLEED(0.1, 2.5), fx: "slash", tint: MOONC, sound: "swing", recK: k === n - 1 ? 1 : 0.2 });
        cool(e, "claw", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 56 });
    }
  },
});

// ════ 늪 하피 ════ 찢어지는 비명으로 소리 물결(잠깐 굳음) · 갈고리 발톱으로 내리꽂는다(출혈)
register("bk_harpy", {
  ...X.pxHarpy, speed: 110, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "scream", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70, ry: 16, speed: 44 });
        continue;
      }
      if (ready(e, "scream") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { wind: "scream", atk: "scream", sprite: "p_wave", n: 1, speed: 220, mult: 0.5, el: "wind", st: { type: "stun", chance: 0.5, dur: 0.4 }, ox: 10, oy: 20, tele: 0.45, sound: "magic", scale: 1 });
        cool(e, "scream", 3.4, 4.4);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.4, v: 400, dur: 0.55, mult: 0.9, st: BLEED(0.1, 2.5), fw: 18, fh: 18 });
        cool(e, "dive", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 90 });
    }
  },
});

// ════ 해골 등롱 ════ 턱을 벌려 불씨를 뱉고(화상) · 촛불을 확 키워 둘레를 태운다
register("bk_skulllamp", {
  ...X.pxSkullLamp, speed: 50, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 10, speed: 20 });
        continue;
      }
      if (near(A, 50, 50) && ready(e, "flare")) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("explosion", 0.3);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2, tint: FIREC });
        e.playerInRect(e.cx - 46, e.cy - 46, 92, 92) && e.hit(0.9, !1, "fire", BURN(0.12, 2.5), 0.6);
        yield A.once("rec");
        cool(e, "flare", 3, 4);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { sprite: "p_fire", n: 2, spread: 0.16, speed: 200, mult: 0.6, el: "fire", st: BURN(0.1, 2), ox: 6, oy: 0, tele: 0.45, sound: "magic", scale: 0.8 });
        cool(e, "spit", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 60 });
    }
  },
});

// ════ 안개 구렁이 ════ 차가운 안개 숨을 길게 뿜는다(느려짐) · 몸을 감았다 튕기듯 문다
register("bk_fogsnake", {
  ...X.pxFogSnake, speed: 70, sight: 280, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "breath", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, ry: 16, speed: 30 });
        continue;
      }
      if (ready(e, "breath") && Math.abs(A.dx) < 180 && Math.abs(A.dy) < 90) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("breath");
        A.sound("magic", 0.4);
        for (let k = 0; k < 6; k++) { A.shoot({ sprite: "p_orb", speed: 170, gravity: 0, life: 0.9, radius: 6 }, e.cx + e.facing * 30, e.cy, Math.atan2(A.p.body.y - 12 - e.cy, A.p.cx - e.cx) + (Math.random() - 0.5) * 0.4, 0.3, { el: "ice", st: CHILL(0.4, 1.5), opts: { tint: 0xd8e8f8, scale: 0.8 } }); yield 0.08; }
        cool(e, "breath", 3.6, 4.6);
        continue;
      }
      if (ready(e, "bite") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.45, v: 380, dur: 0.5, mult: 0.9, fw: 22, fh: 14, knock: 1 });
        cool(e, "bite", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 50 });
    }
  },
});

// ════ [정예] 흡혈 대박쥐 ════ 고목 위에서 덮쳐 물고 피를 빨아 체력을 채운다 · 초음파 비명(둘레가 잠깐 굳음) · 체력 절반부터 더 자주 덮친다
register("bk_bigbat", {
  ...X.pxBigBat, speed: 120, sight: 340, atkMul: 1.7,
  *brain(e, A) {
    cool(e, "dive", 1.5, 2.5), cool(e, "screech", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 16, speed: 44 });
        continue;
      }
      yield* notice(e, A, { anim: "screech", sound: "bossRoar", vol: 0.35 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "screech") && near(A, 160, 120)) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("screech");
        A.sound("magic", 0.6);
        for (let k = 0; k < 3; k++) { e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.6 + k * 1.2, tint: 0xd8c8e8 }); yield 0.12; }
        near(A, 130, 100) && e.hit(0.5, !1, "wind", STUN(0.6), 0.6);
        cool(e, "screech", 5, 7);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 280) {
        yield* dive(e, A, { tele: rage ? 0.4 : 0.55, v: 440, dur: 0.6, mult: 1.3, st: BLEED(0.12, 3), fw: 36, fh: 28, knock: 1.2, onHit: () => { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.06); glowOn(e, 0xd83030, 3); } });
        cool(e, "dive", rage ? 1.2 : 2, rage ? 1.8 : 3);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 110 });
    }
  },
});

// ════ 익사자 ════ 느릿느릿 다가와 불은 손으로 붙잡는다(잠깐 묶임) · 시커먼 늪물을 토한다(느려짐 · 밀려남)
register("bk_drowned", {
  ...X.pxDrowned, speed: 26, sight: 220, atkMul: 1,
  *brain(e, A) {
    cool(e, "vomit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (near(A, 40, 30) && ready(e, "grab")) {
        yield* melee(e, A, { tele: 0.5, dash: 80, fw: 26, fh: 26, mult: 1, knock: 0.2, st: STUN(0.7), fx: "heavy", tint: 0x8aa09a, sound: "punch" });
        cool(e, "grab", 2, 2.8);
        continue;
      }
      if (ready(e, "vomit") && Math.abs(A.dx) < 140 && Math.abs(A.dy) < 40) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 60, 110] });
        yield A.once("vomit");
        A.sound("splat", 0.6);
        A.shoot({ sprite: "p_wave", speed: 200, gravity: 0, life: 0.8, radius: 10 }, e.cx + e.facing * 16, e.body.y - 46, e.facing > 0 ? 0.25 : Math.PI - 0.25, 0.6, { el: "ice", st: CHILL(0.45, 1.6), opts: { tint: 0x5a8a7a } });
        cool(e, "vomit", 3.4, 4.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 늪 오소리 ════ 단단해서 잘 밀리지 않는다 · 몸을 일으켜 앞발톱으로 정신없이 세 번 할퀸다(출혈) · 짧게 들이받는다
register("bk_badger", {
  ...X.pxBadger, speed: 60, sight: 220, atkMul: 1, heavy: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 50 });
        continue;
      }
      if (near(A, 40, 26) && ready(e, "frenzy")) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.once("atk");
        for (let k = 0; k < 3; k++) { A.sound("swing", 0.4); e.body.vx = e.facing * 60; for (let t = 0; t < 0.14; t += DT) { A.melee(26, 20, 0.6, { knock: k === 2 ? 1.2 : 0.3, st: BLEED(0.06, 2) }); yield 0; } yield 0.06; }
        yield A.once("rec");
        cool(e, "frenzy", 1.6, 2.2);
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) > 50 && Math.abs(A.dx) < 160 && Math.abs(A.dy) < 24) {
        yield* charge(e, A, { tele: 0.4, v: 260, dur: 0.5, mult: 0.9, knock: 1.4, fw: 24, fh: 18, stopOnHit: 1, stun: !1, dust: 0x5a4a3a });
        cool(e, "ram", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 늪지 어인 ════ 뼈 작살로 길게 찌른다 · 젖은 그물을 던져 묶는다(잠깐 묶임 · 느려짐)
register("bk_fishfolk", {
  ...X.pxFishfolk, speed: 50, sight: 260, atkMul: 1,
  *brain(e, A) {
    cool(e, "net", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      if (ready(e, "net") && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { wind: "net", atk: "net", sprite: "p_orb", n: 1, speed: 220, mult: 0.3, el: "phys", st: STUN(0.9), ox: 16, oy: 40, tele: 0.5, sound: "swing", scale: 1.3 });
        cool(e, "net", 5, 6.5);
        continue;
      }
      if (near(A, 70, 30) && ready(e, "thrust")) {
        yield* melee(e, A, { tele: 0.45, bar: 1, dash: 90, fw: 60, fh: 16, mult: 1.1, knock: 1.2, st: BLEED(0.08, 2), fx: "slash", tint: 0xd8ccb0, sound: "swing" });
        cool(e, "thrust", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 64 });
    }
  },
});

// ════ [정예] 늪 메기 왕 ════ 진흙 속에 숨어 다가와 쩍 벌린 입으로 삼키듯 문다(크게 · 잠깐 묶임) · 긴 수염 휘두르기 ·
//   꼬리로 바닥을 쳐 진흙 물결 둘
register("bk_catfish", {
  ...X.pxCatfish, speed: 34, sight: 300, atkMul: 1.8, heavy: 1,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "dive", 2, 3), cool(e, "wave", 3, 4);
    for (;;) {
      if (!e.aggro) {
        M.hidden = 0;
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.4 });
      if (ready(e, "dive") && Math.abs(A.dx) > 100 && Math.abs(A.dy) < 40) {
        A.stop(1);
        yield A.once("hide");
        M.hidden = 1;
        for (let t = 0; t < 2.2 && !near(A, 70, 40); t += DT) { A.play("hide"); A.face(); e.body.vx = dirTo(A) * 150; Math.random() < 0.2 && e.host.fx.burst("dust", e.cx, e.body.y - 2, 1, MUDC); yield 0; }
        A.stop(1);
        A.tele(0.4, { bar: [e.cx + e.facing * 50, 100] });
        yield 0.3;
        A.once("rise");
        M.hidden = 0;
        A.shake(2), A.sound("bossRoar", 0.4);
        yield 0.2;
        yield* melee(e, A, { tele: 0, dash: 140, fw: 70, fh: 34, mult: 1.6, knock: 1.4, st: STUN(0.6), fx: "heavy", tint: 0xa8a088, sound: "punch" });
        cool(e, "dive", 5, 6.5);
        continue;
      }
      if (ready(e, "wave") && near(A, 220, 50)) {
        yield* slam(e, A, { r: 60, mult: 1.2, tele: 0.6, fwd: -40, shake: 2.5, chunk: MUDC, tint: WISPC, dust: 0x4a4a3a });
        for (const d of [-1, 1]) A.shoot({ sprite: "p_wave", speed: 220, life: 1.2, radius: 10 }, e.cx + d * 50, e.body.y - 10, d > 0 ? 0 : Math.PI, 0.7, { el: "earth", st: CHILL(0.3, 1), opts: { tint: 0x5a5a44 } });
        cool(e, "wave", 4, 5.5);
        continue;
      }
      if (near(A, 110, 40) && ready(e, "lash")) {
        A.face(), A.stop(1);
        A.tele(0.45, { bar: [e.cx + e.facing * 70, 100] });
        yield A.once("lash");
        A.sound("swing", 0.6);
        e.playerInRect(e.cx + (e.facing > 0 ? 30 : -130), e.body.y - 40, 100, 40) && e.hit(1.1, !1, "phys", void 0, 1.6);
        cool(e, "lash", 1.8, 2.4);
        continue;
      }
      if (near(A, 90, 40) && ready(e, "gulp")) {
        yield* melee(e, A, { tele: 0.6, bar: 1, dash: 120, fw: 64, fh: 34, mult: 1.5, knock: 1.2, st: STUN(0.5), fx: "heavy", tint: 0xa8a088, sound: "punch" });
        cool(e, "gulp", 1.8, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});
