// 스포어캡 몬스터 12종 행동 (그림은 px_sc.js)
import { register } from "./core.js";
import * as X from "./px_sc.js";
import { DT, POIS, STUN, CHILL, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const SPORE = 0xb8f0d8, PINK = 0xf0a0e0, CAPC = 0x9a5a8a, STEMC = 0xd8ccb0;
// 포자 구름: 바닥에 독 웅덩이 + 피어오르는 포자 알갱이
const cloud = (e, A, x, w = 50, dur = 2.6) => {
  const gy = groundY(e, x);
  A.zone(x, gy, w, dur, 0.05, { el: "poison", st: POIS(0.1, 2.5), kind: "slime" });
  for (let k = 0; k < 10; k++) e.host.fx.burst("glow", x + (Math.random() - 0.5) * w, gy - 6 - Math.random() * 30, 1, k % 2 ? SPORE : PINK);
};

// ════ 퍼프볼 ════ 아장아장 다가와 잔뜩 부풀었다가 퍽 터뜨려 둘레에 포자 구름을 남긴다
register("sc_puff", {
  ...X.pxPuff, speed: 34, sight: 200, atkMul: 0.7,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (near(A, 54, 36) && ready(e, "pop")) {
        A.face(), A.stop(1);
        A.tele(0.6);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.6, tint: SPORE });
        e.playerInRect(e.cx - 40, e.cy - 34, 80, 60) && e.hit(0.7, !1, "poison", POIS(0.12, 3), 0.4);
        cloud(e, A, e.cx, 60, 2.4);
        yield A.once("rec");
        cool(e, "pop", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 포자 민달팽이 ════ 느리게 기며 끈적한 자국을 남기고(독), 몸을 늘여 독액 덩어리를 뱉는다
register("sc_slug", {
  ...X.pxSporeSlug, speed: 22, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (ready(e, "trail")) {
        A.zone(e.cx - e.facing * 10, groundY(e, e.cx), 26, 3, 0.03, { el: "poison", st: POIS(0.08, 2), kind: "slime" });
        cool(e, "trail", 1.6, 2.2);
      }
      if (ready(e, "spit") && Math.abs(A.dx) > 40 && Math.abs(A.dx) < 220) {
        yield* lob(e, A, { tele: 0.4, sprite: "sl_glob", mult: 0.7, el: "poison", st: POIS(0.12, 3), oy: 12, ox: 18, scale: 0.8, chunkC: 0xa898c0 });
        cool(e, "spit", 2.2, 3);
        continue;
      }
      if (near(A, 40, 24) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.4, dash: 60, fw: 24, fh: 14, mult: 0.8, knock: 0.6, el: "poison", st: POIS(0.1, 2), fx: "slash", tint: 0xa898c0, sound: "splat" });
        cool(e, "bite", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 갓 꼬마병사 ════ 잔가지 창으로 찌르고, 맞서면 나무껍질 방패를 들어 앞쪽 공격을 막는다
register("sc_capling", {
  ...X.pxCapling, speed: 50, sight: 230, atkMul: 0.9,
  blocks(e, S) {
    const M = e.fz?.mem;
    return !!M?.guard && e.stunT <= 0 && S.dir === -e.facing && !S.pierceShield;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.guard = 0;
        yield* wander(e, A, { speed: 18 });
        continue;
      }
      if (near(A, 70, 30) && ready(e, "guard") && Math.random() < 0.35) {
        A.face(), A.stop(1);
        M.guard = 1, A.play("guard");
        yield 1;
        M.guard = 0;
        cool(e, "guard", 2.5, 4);
        continue;
      }
      if (near(A, 52, 26) && ready(e, "poke")) {
        yield* melee(e, A, { tele: 0.4, dash: 110, fw: 34, fh: 14, mult: 0.9, knock: 1, fx: "slash", tint: 0xd8d0c0, sound: "swing" });
        cool(e, "poke", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ [정예] 거대 버섯 어미 ════ 몸을 숙여 갓으로 내려찍기(땅울림) · 포자를 뿜어 플레이어 주변 세 곳에 독 구름(예고) ·
//   체력이 줄면 퍼프볼을 낳는다
register("sc_matriarch", {
  ...X.pxMatriarch, speed: 26, sight: 280, atkMul: 1.6, heavy: 1,
  *brain(e, A) {
    cool(e, "puff", 2, 3), cool(e, "spawn", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "puff", sound: "bossRoar", vol: 0.25 });
      if (ready(e, "spawn") && e.hp < e.maxHp * 0.65) {
        yield* summon(e, A, { id: "sc_puff", n: 2, max: 3, dx: 40, anim: "puff", col: SPORE });
        cool(e, "spawn", 8, 11);
        continue;
      }
      if (near(A, 72, 44) && ready(e, "slam")) {
        yield* slam(e, A, { r: 56, mult: 1.5, tele: 0.6, fwd: 26, shake: 3, chunk: CAPC, tint: PINK, dust: 0xb8a8b8 });
        cloud(e, A, e.cx + e.facing * 30, 50, 2);
        cool(e, "slam", 1.8, 2.6);
        continue;
      }
      if (ready(e, "puff") && Math.abs(A.dx) < 260) {
        A.face(), A.stop(1);
        const xs = [A.p.cx - 60, A.p.cx, A.p.cx + 60];
        for (const x of xs) A.tele(0.8, { bar: [x, 50] });
        yield A.once("puff");
        A.sound("splat", 0.7), A.shake(1);
        for (const x of xs) {
          cloud(e, A, x, 50, 3);
          e.playerInRect(x - 25, groundY(e, x) - 60, 50, 60) && e.hit(0.8, !1, "poison", POIS(0.15, 3), 0.3);
        }
        cool(e, "puff", 3.5, 5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 56 });
    }
  },
});

// ════ 갓 딱정벌레 ════ 땅을 긁다 뿔을 앞세워 돌진 · 가까우면 뿔로 떠올린다
register("sc_beetle", {
  ...X.pxCapBeetle, speed: 44, sight: 240, atkMul: 1, heavy: 0.6,
  *brain(e, A) {
    cool(e, "charge", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (near(A, 44, 24) && ready(e, "toss")) {
        yield* melee(e, A, { tele: 0.35, dash: 120, fw: 26, fh: 18, mult: 1, knock: 1.2, up: 1, fx: "slash", tint: 0xd8c8a0, sound: "punch" });
        cool(e, "toss", 1.2, 1.8);
        continue;
      }
      if (ready(e, "charge") && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 240 && Math.abs(A.dy) < 30) {
        yield* charge(e, A, { tele: 0.55, v: 260, dur: 0.9, mult: 1.1, knock: 1.4, dust: 0x6a5a6a });
        cool(e, "charge", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ 포자 정령 ════ 둥실 떠다니며 느린 포자 알 세 개를 흩뿌리고, 가까이 오면 부풀어 포자를 뿜는다
register("sc_spore", {
  ...X.pxSpore, speed: 54, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "orb", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 24 });
        continue;
      }
      if (near(A, 50, 50) && ready(e, "burst")) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.4);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 1.8, tint: SPORE });
        e.playerInRect(e.cx - 44, e.cy - 44, 88, 88) && e.hit(0.8, !1, "poison", POIS(0.12, 3), 0.6);
        yield A.once("rec");
        cool(e, "burst", 2.4, 3.2);
        continue;
      }
      if (ready(e, "orb") && Math.abs(A.dx) < 240) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.3, speed: 110, mult: 0.55, el: "poison", st: POIS(0.08, 2), ox: 0, oy: 0, tele: 0.45, sound: "magic", scale: 0.7 });
        cool(e, "orb", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 40 });
    }
  },
});

// ════ 독버섯 개구리 ════ 폴짝폴짝 뛰어다니며 혀를 길게 뻗어 끌어당기고(독), 가까우면 덮치듯 뛰어오른다
register("sc_frog", {
  ...X.pxFrog, speed: 70, sight: 240, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "tongue", 1, 2);
    for (;;) {
      if (!e.aggro) {
        if (A.ground && Math.random() < 0.3) { A.play("move"); hop(e, Math.random() < 0.5 ? -1 : 1, 70, 180); yield* land(e, A); }
        A.play("idle"), A.stop(1);
        yield 0.5;
        continue;
      }
      if (ready(e, "tongue") && Math.abs(A.dx) > 40 && Math.abs(A.dx) < 120 && Math.abs(A.dy) < 30) {
        A.face(), A.stop(1);
        A.tele(0.4, { bar: [e.cx + e.facing * 60, 120] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        yield 0.08;
        if (e.playerInRect(e.cx + (e.facing > 0 ? 0 : -120), e.body.y - 26, 120, 22)) {
          e.hit(0.7, !1, "poison", POIS(0.1, 2.5), 0);
          A.p.body.vx = -e.facing * 300, A.p.body.vy = -120;
        }
        yield A.once("rec");
        cool(e, "tongue", 2.4, 3.4);
        continue;
      }
      if (near(A, 90, 40) && ready(e, "leap") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.play("move");
        hop(e, dirTo(A), Math.min(240, Math.abs(A.dx) * 2.2), 300);
        for (let t = 0; t < 0.8; t += DT) { if (A.melee(18, 14, 0.9, { knock: 1 })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "leap", 1.4, 2);
        continue;
      }
      if (A.ground && Math.abs(A.dx) > 60) { A.play("move"); hop(e, dirTo(A), e.speed, 200); yield* land(e, A); yield 0.15; continue; }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 버섯 마녀 ════ 지팡이로 독 화살 세 발 · 솥을 휘저어 독약 병 셋을 던져 독 웅덩이 · 독버섯 개구리를 불러낸다
register("sc_witch", {
  ...X.pxWitch, speed: 40, sight: 300, atkMul: 1.6,
  *brain(e, A) {
    cool(e, "brew", 2.5, 3.5), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "brew", sound: "magic", vol: 0.5 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.7) {
        yield* summon(e, A, { id: "sc_frog", n: 2, max: 3, dx: 40, anim: "brew", col: SPORE });
        cool(e, "call", 9, 12);
        continue;
      }
      if (ready(e, "brew") && Math.abs(A.dx) < 260) {
        yield* lob(e, A, { wind: "brew", atk: "atk", tele: 0.5, sprite: "sl_glob", n: 3, gap: 0.16, spread: 60, mult: 0.7, el: "poison", st: POIS(0.12, 3), oy: 46, ox: 20, scale: 1, chunkC: 0x8af0d0, onDone: (pr) => !e.dead && cloud(e, A, pr.x, 40, 2.6) });
        cool(e, "brew", 3, 4.2);
        continue;
      }
      if (near(A, 60, 40) && ready(e, "staff")) {
        yield* melee(e, A, { tele: 0.45, dash: 60, fw: 40, fh: 30, mult: 1.2, knock: 1.4, el: "poison", st: POIS(0.1, 2), fx: "heavy", tint: SPORE, sound: "punch" });
        cool(e, "staff", 1.6, 2.2);
        continue;
      }
      if (ready(e, "bolt") && Math.abs(A.dx) < 300) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.2, speed: 200, mult: 0.6, el: "poison", st: POIS(0.08, 2), ox: 28, oy: 66, tele: 0.45, sound: "magic", scale: 0.8 });
        cool(e, "bolt", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 80, hi: 160 });
    }
  },
});

// ════ 하늘 가오리 ════ 넓은 지느러미로 미끄러지듯 맴돌다 꼬리 가시를 앞세워 비스듬히 덮친다 (독)
register("sc_ray", {
  ...X.pxRay, speed: 100, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "dive", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 14, speed: 50 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.45, v: 360, dur: 0.6, mult: 0.9, st: POIS(0.12, 3), fw: 26, fh: 12 });
        cool(e, "dive", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 90 });
    }
  },
});

// ════ 포자 해파리 ════ 위에서 천천히 따라오며 몸을 오므려 포자 방울을 비처럼 떨어뜨린다 · 촉수에 닿으면 독
register("sc_jelly", {
  ...X.pxSporeJelly, speed: 40, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "rain", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 14, speed: 20 });
        continue;
      }
      if (ready(e, "rain") && Math.abs(A.dx) < 80) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.4);
        for (let k = 0; k < 4; k++) {
          A.shoot({ sprite: "sl_glob", speed: 0, gravity: 420, life: 2, radius: 5 }, e.cx + (k - 1.5) * 12, e.cy + 18, 0, 0.5, { el: "poison", st: POIS(0.1, 2.5), opts: { vx: (k - 1.5) * 20, vy: 40, scale: 0.7 } });
          yield 0.12;
        }
        yield A.once("rec");
        cool(e, "rain", 2.2, 3);
        continue;
      }
      if (near(A, 24, 40)) A.melee(14, 30, 0.5, { knock: 0.4, el: "poison", st: POIS(0.08, 2) });
      A.play("move");
      A.flyTo(A.p.cx, A.p.body.y - 90, e.speed);
      yield 0;
    }
  },
});

// ════ 균사 도깨비불 ════ 거리를 두고 떠다니다 균사 실을 쏘아 묶는다(잠깐 묶임) · 실에서 풀려난 포자가 흩날린다
register("sc_wisp", {
  ...X.pxMycWisp, speed: 70, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "snare", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 16, speed: 30 });
        continue;
      }
      if (ready(e, "snare") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { sprite: "p_thorn", n: 1, speed: 260, mult: 0.6, el: "earth", st: STUN(0.6), ox: 10, oy: 0, tele: 0.55, sound: "shoot", scale: 0.9 });
        cool(e, "snare", 3, 4);
        continue;
      }
      if (ready(e, "dust") && Math.abs(A.dx) < 180) {
        yield* shoot(e, A, { sprite: "p_orb", n: 4, spread: 0.25, speed: 140, mult: 0.45, el: "poison", st: POIS(0.06, 2), ox: 0, oy: 0, tele: 0.3, sound: "magic", scale: 0.6 });
        cool(e, "dust", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 60 });
    }
  },
});

// ════ [정예] 균사 거미 여왕 ════ 엄니로 물기(독) · 앞다리를 들었다 덮치는 도약 · 끈끈한 균사 그물을 뱉어 느리게 함 ·
//   체력이 줄면 균사 도깨비불을 불러낸다
register("sc_queen", {
  ...X.pxSpiderQueen, speed: 60, sight: 300, atkMul: 1.6, heavy: 0.9,
  *brain(e, A) {
    cool(e, "web", 1.5, 2.5), cool(e, "pounce", 2, 3), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.6) {
        yield* summon(e, A, { id: "sc_wisp", n: 2, max: 3, dx: 40, dy: 30, anim: "spit", col: SPORE });
        cool(e, "call", 9, 12);
        continue;
      }
      if (near(A, 60, 34) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.45, dash: 140, fw: 38, fh: 26, mult: 1.4, knock: 1.2, el: "poison", st: POIS(0.15, 3), fx: "heavy", tint: PINK, sound: "punch" });
        cool(e, "bite", 1.4, 2);
        continue;
      }
      if (ready(e, "web") && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 280) {
        yield* shoot(e, A, { wind: "spit", atk: "spit", sprite: "p_orb", n: 3, spread: 0.22, speed: 200, mult: 0.5, el: "poison", st: CHILL(0.5, 2), ox: 30, oy: 16, tele: 0.5, sound: "splat", scale: 1 });
        cool(e, "web", 2.6, 3.6);
        continue;
      }
      if (ready(e, "pounce") && A.ground && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 220) {
        A.face(), A.stop(1);
        A.tele(0.55);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2), 320);
        for (let t = 0; t < 1; t += DT) { if (A.melee(30, 22, 1.4, { knock: 1.4 })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        A.shake(2), e.host.fx.burst("dust", e.cx, e.body.y, 10, 0x8a7a7a);
        cool(e, "pounce", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 50 });
    }
  },
});
