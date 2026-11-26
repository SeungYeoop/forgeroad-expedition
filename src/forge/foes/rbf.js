// 보그플로트 몬스터 12종 행동 (그림은 px_bf.js)
import { register } from "./core.js";
import * as X from "./px_bf.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const BOGC = 0xd8f0a0, MUDC = 0x5a4a34;
const mudPool = (e, A, x, w = 44, dur = 3) => {
  const gy = groundY(e, x);
  A.zone(x, gy, w, dur, 0.03, { el: "earth", st: CHILL(0.4, 1.2), kind: "slime" });
  for (let k = 0; k < 6; k++) e.host.fx.burst("dust", x + (Math.random() - 0.5) * w, gy - 3, 1, MUDC);
};

// ════ 늪 왜가리 ════ 꼼짝 않고 서 있다가 목을 웅크렸다 단검 부리로 길게 찌른다(출혈) · 찌른 뒤 한 걸음 물러선다
register("bf_heron", {
  ...X.pxHeron, speed: 40, sight: 240, atkMul: 1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      if (near(A, 80, 40) && ready(e, "stab")) {
        yield* melee(e, A, { tele: 0.5, bar: 1, dash: 60, fw: 64, fh: 16, mult: 1.1, knock: 0.8, st: BLEED(0.1, 2.5), fx: "slash", tint: 0xe8d040, sound: "swing" });
        if (A.ground) { hop(e, -e.facing, 90, 120); yield* land(e, A); }
        cool(e, "stab", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 50, hi: 74 });
    }
  },
});

// ════ 갈대 인형 ════ 비틀대며 다가와 갈대 손톱으로 두 번 할퀸다 · 사슴 머리뼈로 울부짖으면 둘레가 얼어붙듯 느려진다
register("bf_effigy", {
  ...X.pxEffigy, speed: 34, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "wail", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      if (ready(e, "wail") && near(A, 110, 60)) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("wail");
        A.sound("bossRoar", 0.25);
        e.host.fx.anim("ring", e.cx, e.cy - 10, { scale: 2.8, tint: BOGC });
        near(A, 110, 60) && e.hit(0.4, !1, "arcane", CHILL(0.55, 2.2), 0);
        cool(e, "wail", 6, 8);
        continue;
      }
      if (near(A, 54, 34) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.45, dash: 70, fw: 34, fh: 30, mult: 0.9, knock: 0.6, fx: "slash", tint: 0xb0a060, sound: "swing", recK: 0.3 });
        yield* melee(e, A, { tele: 0.1, dash: 90, fw: 34, fh: 30, mult: 1, knock: 1.2, fx: "slash", tint: 0xb0a060, sound: "swing" });
        cool(e, "claw", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ 이탄 미라 ════ 느릿느릿 다가와 팔을 뻗어 붙잡는다(잠깐 묶임) · 멀면 늪 진흙을 토해 미끄러운 웅덩이를 만든다
register("bf_mummy", {
  ...X.pxMummy, speed: 24, sight: 220, atkMul: 1,
  *brain(e, A) {
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (near(A, 40, 30) && ready(e, "grab")) {
        const hit = yield* melee(e, A, { tele: 0.55, dash: 80, fw: 26, fh: 26, mult: 0.8, knock: 0, st: STUN(0.8), fx: "heavy", tint: 0x8a7a5a, sound: "punch" });
        if (hit) yield* melee(e, A, { tele: 0.1, fw: 22, fh: 22, mult: 0.9, knock: 1.4, st: POIS(0.1, 2.5), fx: "slash", tint: BOGC, sound: "splat" });
        cool(e, "grab", 2, 2.8);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 200) {
        yield* lob(e, A, { wind: "spit", atk: "spit", tele: 0.45, sprite: "sl_glob", mult: 0.6, el: "earth", st: CHILL(0.4, 1.5), oy: 40, ox: 18, scale: 0.9, chunkC: MUDC, onDone: (pr) => !e.dead && mudPool(e, A, pr.x, 40, 3) });
        cool(e, "spit", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 늪 하마 ════ 고개를 숙이고 땅을 울리며 돌진 · 입을 쩍 벌려 크게 문다(출혈) · 앞발로 내려찍어 진흙 물결 둘을 보낸다
register("bf_hippo", {
  ...X.pxHippo, speed: 34, sight: 280, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "charge", 2, 3), cool(e, "wave", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.4 });
      if (near(A, 100, 40) && ready(e, "gape")) {
        yield* melee(e, A, { tele: 0.65, bar: 1, dash: 120, fw: 70, fh: 40, mult: 1.6, knock: 1.6, st: BLEED(0.14, 3), fx: "heavy", tint: 0xc88a80, sound: "punch" });
        cool(e, "gape", 1.8, 2.6);
        continue;
      }
      if (ready(e, "wave") && near(A, 220, 50)) {
        yield* slam(e, A, { r: 60, mult: 1.3, tele: 0.6, fwd: 40, shake: 3, chunk: MUDC, tint: BOGC, dust: 0x6a5a44 });
        for (const d of [-1, 1]) A.shoot({ sprite: "p_wave", speed: 230, life: 1.2, radius: 10 }, e.cx + d * 40, e.body.y - 10, d > 0 ? 0 : Math.PI, 0.7, { el: "earth", st: CHILL(0.3, 1), opts: { tint: 0x8a7a5a } });
        cool(e, "wave", 4, 5.5);
        continue;
      }
      if (ready(e, "charge") && Math.abs(A.dx) > 100 && Math.abs(A.dx) < 320 && Math.abs(A.dy) < 40) {
        yield* charge(e, A, { run: "charge", tele: 0.8, v: 300, dur: 1.4, mult: 1.7, knock: 2.4, fw: 50, fh: 36, dust: 0x6a5a44 });
        cool(e, "charge", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 흡혈 모기 ════ 맴돌다 주둥이 바늘로 찌르러 내리꽂는다 · 찌르면 피를 빨아 체력을 채우고 배가 부풀어 느려진다
register("bf_mosquito", {
  ...X.pxMosquito, speed: 100, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "stab", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 16, speed: 40 });
        continue;
      }
      if (M.fed > 0) { M.fed -= 0.1; A.play("fed"); }
      if (ready(e, "stab") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.4, v: M.fed > 0 ? 240 : 360, dur: 0.5, mult: 0.7, st: BLEED(0.08, 2), fw: 16, fh: 14, onHit: () => { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.25); M.fed = 4; glowOn(e, 0xd83030, 3); } });
        cool(e, "stab", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 50 });
    }
  },
});

// ════ 안개 아귀 ════ 이마의 등불을 흔들어 플레이어를 끌어당기고, 다가오면 바늘 이빨 턱으로 덥석 문다
register("bf_angler", {
  ...X.pxAngler, speed: 50, sight: 280, atkMul: 1,
  *brain(e, A) {
    cool(e, "lure", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 12, speed: 24 });
        continue;
      }
      if (ready(e, "lure") && Math.abs(A.dx) < 200 && Math.abs(A.dy) < 100) {
        A.face(), A.stop(1);
        A.play("lure");
        A.sound("magic", 0.4);
        for (let t = 0; t < 1.4; t += DT) { const d = Math.sign(e.cx - A.p.cx); A.p.body.vx += d * 9; if (near(A, 50, 40)) break; yield 0; }
        cool(e, "lure", 5, 6.5);
        continue;
      }
      if (near(A, 70, 50) && ready(e, "bite")) {
        yield* dive(e, A, { tele: 0.4, v: 300, dur: 0.4, mult: 1.1, st: BLEED(0.1, 2), fw: 26, fh: 22, knock: 1.2 });
        cool(e, "bite", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { keep: 80, alt: 30 });
    }
  },
});

// ════ 늪 검은고니 ════ 날개를 치켜세우고 쉿 소리를 내며 날갯짓 바람을 보낸다(밀려남) · 목을 쭉 뻗어 쪼며 덮친다
register("bf_swan", {
  ...X.pxSwan, speed: 100, sight: 280, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "gust", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60, ry: 14, speed: 44 });
        continue;
      }
      if (ready(e, "gust") && Math.abs(A.dx) < 200) {
        A.face(), A.stop(1);
        A.tele(0.45);
        yield A.once("hiss");
        A.sound("swing", 0.6);
        A.shoot({ sprite: "p_wave", speed: 240, gravity: 0, life: 1, radius: 10 }, e.cx + e.facing * 16, e.cy, Math.atan2(A.p.body.y - 12 - e.cy, A.p.cx - e.cx), 0.5, { el: "wind", opts: { tint: 0x3a3840 } });
        cool(e, "gust", 3, 4);
        continue;
      }
      if (ready(e, "peck") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.4, v: 360, dur: 0.5, mult: 0.9, fw: 18, fh: 16, knock: 1 });
        cool(e, "peck", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 60 });
    }
  },
});

// ════ [정예] 늪 히드라 ════ 머리 셋이 번갈아 문다(앞 · 뒤) · 가운데 머리가 독을 뿜어 독 웅덩이 셋 · 체력 절반부터 세 머리가 연달아 문다
register("bf_hydra", {
  ...X.pxHydra, speed: 22, sight: 300, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "spit", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 6, range: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "triple", sound: "bossRoar", vol: 0.4 });
      const rage = e.hp < e.maxHp * 0.5;
      if (rage && near(A, 110, 70) && ready(e, "triple")) {
        A.face(), A.stop(1);
        A.tele(0.6, { bar: [e.cx + e.facing * 50, 110] });
        yield A.once("wind");
        A.once("triple");
        for (let k = 0; k < 3; k++) { A.sound("punch", 0.5); for (let t = 0; t < 0.22; t += DT) { A.melee(70, 60, 0.9, { knock: 0.8, st: POIS(0.1, 2) }); yield 0; } }
        yield A.once("rec");
        cool(e, "triple", 3.4, 4.4);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 280) {
        yield* lob(e, A, { wind: "wind", atk: "spit", tele: 0.55, sprite: "sl_glob", n: 3, gap: 0.16, spread: 60, mult: 0.7, el: "poison", st: POIS(0.14, 3), oy: 90, ox: 30, scale: 1.1, chunkC: 0xa0c060, onDone: (pr) => !e.dead && A.zone(pr.x, groundY(e, pr.x), 40, 3, 0.05, { el: "poison", st: POIS(0.1, 2), kind: "slime" }) });
        cool(e, "spit", 3.6, 4.8);
        continue;
      }
      if (near(A, 100, 60) && ready(e, "bite")) {
        yield* melee(e, A, { wind: "wind", atk: Math.random() < 0.5 ? "bite1" : "atk", tele: 0.55, bar: 1, dash: 40, fw: 70, fh: 60, mult: 1.4, knock: 1.4, st: BLEED(0.1, 2.5), fx: "heavy", tint: 0xe8d040, sound: "punch" });
        cool(e, "bite", 1.6, 2.2);
        continue;
      }
      if (Math.sign(A.dx) !== e.facing && near(A, 70, 60) && ready(e, "back")) {
        A.stop(1);
        A.tele(0.5);
        yield 0.3;
        A.once("bite2");
        A.sound("punch", 0.5);
        yield 0.15;
        e.playerInRect(e.cx - (e.facing > 0 ? 80 : 0), e.body.y - 70, 80, 70) && e.hit(1.2, !1, "phys", BLEED(0.1, 2), 1.4);
        yield 0.5;
        cool(e, "back", 2, 3);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 안개 소금쟁이 ════ 안개 위를 미끄러지다 순식간에 쭉 미끄러져 와 주둥이로 찌른다
register("bf_strider", {
  ...X.pxStrider, speed: 90, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "skate", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 4, speed: 60 });
        continue;
      }
      if (ready(e, "skate") && Math.abs(A.dx) < 240 && Math.abs(A.dy) < 120) {
        yield* dive(e, A, { tele: 0.35, v: 480, dur: 0.45, mult: 0.8, st: BLEED(0.08, 2), fw: 24, fh: 12, ty: 14 });
        cool(e, "skate", 1.2, 2);
        continue;
      }
      // 짧게 미끄러지며 자리를 옮긴다
      A.play("move");
      e.body.vx = dirTo(A) * e.speed * (0.6 + Math.random() * 0.8), e.body.vy = (A.p.body.y - 60 - e.cy) * 0.8;
      yield 0.3;
      A.stop(1), A.play("idle");
      yield 0.25;
    }
  },
});

// ════ 안개 칠성장어 ════ 물결치며 날다 빨판 입으로 들러붙어 잠시 피를 빤다(여러 번 조금씩)
register("bf_lamprey", {
  ...X.pxLamprey, speed: 90, sight: 260, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "latch", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, ry: 16, speed: 40 });
        continue;
      }
      if (ready(e, "latch") && Math.abs(A.dx) < 200) {
        let hit = !1;
        yield* dive(e, A, { tele: 0.4, v: 360, dur: 0.5, mult: 0.6, fw: 18, fh: 14, knock: 0, onHit: () => (hit = !0) });
        if (hit) for (let t = 0; t < 1.4 && !e.dead; t += 0.2) { A.play("latch"); A.flyTo(A.p.cx - e.facing * 10, A.p.body.y - 16, 900); A.melee(20, 20, 0.25, { knock: 0, st: BLEED(0.06, 1) }); e.hp = Math.min(e.maxHp, e.hp + 2); yield 0.2; }
        cool(e, "latch", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 50 });
    }
  },
});

// ════ 독 연꽃 ════ 꽃잎을 활짝 펴 독 씨앗 다섯 발을 부채꼴로 쏜다 · 가끔 꽃가루를 뿌려 발밑에 독 웅덩이
register("bf_lotus", {
  ...X.pxLotus, speed: 30, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "seed", 1, 2), cool(e, "pollen", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 20, ry: 8, speed: 16 });
        continue;
      }
      if (ready(e, "pollen") && Math.abs(A.dx) < 160) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.3);
        const x = A.p.cx;
        A.zone(x, groundY(e, x), 54, 3, 0.05, { el: "poison", st: POIS(0.1, 2), kind: "slime" });
        for (let k = 0; k < 10; k++) e.host.fx.burst("glow", x + (Math.random() - 0.5) * 50, groundY(e, x) - 30 + Math.random() * 30, 1, 0xc08ac0);
        cool(e, "pollen", 5, 6.5);
        continue;
      }
      if (ready(e, "seed") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { sprite: "p_thorn", n: 5, spread: 0.2, speed: 200, mult: 0.5, el: "poison", st: POIS(0.08, 2), ox: 0, oy: 18, tele: 0.45, sound: "shoot", scale: 0.8 });
        cool(e, "seed", 2.2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 70 });
    }
  },
});

// ════ [정예] 닭발 오두막 ════ 닭발로 껑충 뛰어 내려찍는다(땅울림) · 발톱 걷어차기 · 문을 입처럼 열어 불씨를 토하고 갈대 인형을 뱉어낸다
register("bf_hut", {
  ...X.pxHut, speed: 50, sight: 300, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "spew", 2, 3), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "spew", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.6) {
        yield* summon(e, A, { id: "bf_effigy", n: 1, max: 2, dx: 40, anim: "spew", col: BOGC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (near(A, 70, 40) && ready(e, "kick")) {
        yield* melee(e, A, { wind: "wind", atk: "kick", tele: 0.5, dash: 80, fw: 54, fh: 30, mult: 1.4, knock: 2, st: BLEED(0.1, 2), fx: "heavy", tint: 0xc8a050, sound: "punch" });
        cool(e, "kick", 1.6, 2.2);
        continue;
      }
      if (ready(e, "stomp") && A.ground && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 200) {
        A.face(), A.stop(1);
        A.tele(0.6);
        yield A.once("wind");
        hop(e, dirTo(A), Math.min(260, Math.abs(A.dx) * 1.8), 380);
        yield* land(e, A);
        A.once("atk");
        A.shake(3), A.sound("thud", 0.8);
        e.host.fx.anim("ring", e.cx, e.body.y - 6, { scale: 3, tint: 0x8a7a5a });
        e.playerInRect(e.cx - 64, e.body.y - 30, 128, 30) && e.hit(1.4, !0, "earth", STUN(0.3), 1.4);
        yield A.once("rec");
        cool(e, "stomp", 3, 4);
        continue;
      }
      if (ready(e, "spew") && Math.abs(A.dx) < 280) {
        yield* lob(e, A, { wind: "spew", atk: "spew", tele: 0.5, sprite: "p_fire", n: 3, gap: 0.15, spread: 50, mult: 0.7, el: "fire", st: BURN(0.12, 2.5), oy: 40, ox: 4, scale: 1, chunkC: 0xff8a3a, onDone: (pr) => !e.dead && A.zone(pr.x, groundY(e, pr.x), 30, 2, 0.05, { el: "fire", st: BURN(0.1, 2), kind: "fire" }) });
        cool(e, "spew", 3.4, 4.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 60 });
    }
  },
});
