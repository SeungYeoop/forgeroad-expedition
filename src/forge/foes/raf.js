// 애쉬펠 몬스터 12종 행동 (그림은 px_af.js)
import { register } from "./core.js";
import * as X from "./px_af.js";
import { DT, BURN, STUN, BLEED, POIS, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY } from "./bkit.js";

const FIRE = 0xff8a3a, ASHC = 0x6a6260;

// ════ 잿불 꼬마 ════ 깡충거리며 거리를 두고 불씨를 던진다 (불 장판). 가까우면 할퀴고 뒤로 깡충
register("af_ashling", {
  ...X.pxAshling, speed: 70, sight: 240, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "throw", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 26 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn", jump: 200 });
      if (near(A, 34, 24) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.25, dash: 120, fw: 20, fh: 16, mult: 0.8, el: "fire", st: BURN(0.1, 2), fx: "slash", tint: FIRE });
        hop(e, -e.facing, 150, 220);
        yield* land(e, A);
        cool(e, "claw", 1, 1.6);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) < 230) {
        yield* lob(e, A, { tele: 0.35, sprite: "p_fire", mult: 0.7, el: "fire", st: BURN(0.12, 2.5), oy: 20, scale: 0.9, onDone: (pr) => !e.dead && A.zone(pr.x, groundY(e, pr.x), 30, 2.2, 0.06, { el: "fire", st: BURN(0.1, 2), kind: "fire" }) });
        cool(e, "throw", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { lo: 70, hi: 130 });
    }
  },
});

// ════ 사슬 사냥개 ════ 무리로 다닌다. 울부짖어 주변을 깨우고, 낮게 웅크렸다 덮쳐 문다. 끌리는 사슬 끝에 맞아도 아프다
register("af_hound", {
  ...X.pxChainHound, speed: 130, sight: 280, atkMul: 1,
  *brain(e, A) {
    cool(e, "pounce", 0.6, 1.2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 34 });
        continue;
      }
      if (!e.fz.mem.seen) {
        e.fz.mem.seen = 1;
        A.face(), A.stop(1);
        A.sound("bossRoar", 0.25);
        yield A.once("howl");
        for (const o of e.host.enemies ?? []) !o.dead && o !== e && Math.abs(o.cx - e.cx) < 260 && (o.aggro = !0);
      }
      if (ready(e, "pounce") && near(A, 120, 40)) {
        A.face(), A.stop(1);
        A.tele(0.4, { bar: [e.cx + e.facing * 50, 90] });
        yield A.once("wind");
        A.once("atk");
        hop(e, e.facing, Math.min(330, Math.abs(A.dx) * 2.2), 260);
        A.sound("dash", 0.4);
        let hit = !1;
        for (let t = 0; t < 0.6; t += DT) {
          !hit && A.melee(24, 18, 1, { knock: 0.8, st: BLEED(0.1, 2.5) }) && ((hit = !0), A.burst("spark", 14, -10, 6, FIRE));
          if (t > 0.15 && A.ground) break;
          yield 0;
        }
        yield A.once("rec");
        cool(e, "pounce", 1.2, 2);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 80, k: 1.2 });
    }
  },
});

// ════ 걸어다니는 화로 ════ 느리게 다가와 불을 크게 일으켜 앞으로 불길을 뿜는다 (불 장판). 맞으면 숯이 튄다
register("af_brazier", {
  ...X.pxBrazier, speed: 34, sight: 220, atkMul: 1.1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind" });
      if (near(A, 90, 40) && ready(e, "flame")) {
        A.face(), A.stop(1);
        A.tele(0.55, { bar: [e.cx + e.facing * 50, 90] });
        yield A.once("wind");
        A.play("atk");
        A.sound("explosion", 0.35);
        for (let t = 0; t < 0.8; t += DT) {
          Math.random() < 0.5 && e.host.fx.burst("glow", e.cx + e.facing * (20 + Math.random() * 60), e.body.y - 14 - Math.random() * 10, 1, FIRE);
          e.playerInRect(e.cx + (e.facing > 0 ? 6 : -86), e.body.y - 30, 80, 30) && !e.fz.mem.fh && ((e.fz.mem.fh = 1), e.hit(1, !1, "fire", BURN(0.15, 3), 0.5));
          yield 0;
        }
        e.fz.mem.fh = 0;
        A.zone(e.cx + e.facing * 50, groundY(e, e.cx + e.facing * 50), 60, 2.5, 0.06, { el: "fire", st: BURN(0.1, 2), kind: "fire" });
        yield A.once("rec");
        cool(e, "flame", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 60 });
    }
  },
});

// ════ [정예] 잿빛 간수 ════ 사슬 철퇴를 머리 위로 돌려 내려친다(땅울림) · 멀면 사슬을 던져 끌어당긴다 · 체력 절반부터 연타
register("af_jailer", {
  ...X.pxJailer, speed: 40, sight: 280, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "pull", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      const rage = e.hp < e.maxHp * 0.5;
      if (near(A, 80, 40) && ready(e, "smash")) {
        for (let k = 0; k < (rage ? 2 : 1); k++) yield* slam(e, A, { r: 46, mult: 1.5, tele: k ? 0.3 : 0.6, fwd: 40, shake: 3, chunk: ASHC, tint: FIRE, dust: 0x8a8078, recK: k || !rage ? 1 : 0.3 });
        cool(e, "smash", 1.6, 2.4);
        continue;
      }
      if (ready(e, "pull") && Math.abs(A.dx) > 90 && Math.abs(A.dx) < 240 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 120, 200] });
        yield 0.35;
        A.once("pull");
        A.sound("swing", 0.6);
        yield 0.15;
        if (e.playerInRect(e.cx + (e.facing > 0 ? 0 : -240), e.body.y - 40, 240, 40)) {
          e.hit(0.6, !1, "phys", STUN(0.4), 0);
          A.p.body.vx = -e.facing * 420, A.p.body.vy = -160;
        }
        yield 0.5;
        cool(e, "pull", 4, 6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 60 });
    }
  },
});

// ════ 잿까마귀 ════ 떼로 맴돌다 하나씩 급강하해 쪼고, 재를 흩뿌려 잠깐 눈을 가린다
register("af_crow", {
  ...X.pxCrow, speed: 130, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "dive", 0.8, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60, ry: 16, speed: 60 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.35, v: 380, dur: 0.5, mult: 0.8, fw: 16, fh: 14, onHit: () => (e.host.scene._blindT = Math.max(e.host.scene._blindT ?? 0, 0.8)) });
        cool(e, "dive", 1.6, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 80 });
    }
  },
});

// ════ 불씨 정령 ════ 둥실 다가와 몸을 부풀려 터진다 (넓은 불 폭발). 터지면 사라진다
register("af_cinder", {
  ...X.pxCinder, speed: 60, sight: 220, atkMul: 1.2,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 30 });
        continue;
      }
      if (near(A, 50, 40)) {
        A.stop(1);
        A.tele(0.7);
        yield A.once("wind");
        A.once("atk");
        A.sound("explosion", 0.5), A.shake(2);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.6, tint: FIRE });
        e.host.fx.burst("glow", e.cx, e.cy, 16, FIRE);
        e.playerInRect(e.cx - 50, e.cy - 40, 100, 80) && e.hit(1.3, !0, "fire", BURN(0.15, 3), 1);
        yield 0.1;
        e.hp = 0;
        e.die?.();
        return;
      }
      A.play("move");
      A.flyTo(A.p.cx, A.p.body.y - 20, e.speed);
      yield 0;
    }
  },
});

// ════ 그을린 망령 ════ 떠다니며 등불을 들어 불덩이 두 발 · 맞으면 재가 되어 흩어졌다 조금 떨어진 곳에 다시 모인다
register("af_wraith", {
  ...X.pxWraith, speed: 60, sight: 280, atkMul: 0.9,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "bolt", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 8, speed: 24 });
        continue;
      }
      if (M.lastHp != null && e.hp < M.lastHp - e.maxHp * 0.2 && ready(e, "blink")) {
        e.host.fx.burst("dust", e.cx, e.cy, 12, ASHC);
        e.body.x += (Math.random() < 0.5 ? -1 : 1) * 90;
        e.host.fx.burst("dust", e.cx, e.cy, 12, ASHC);
        cool(e, "blink", 3, 4);
      }
      M.lastHp = e.hp;
      if (ready(e, "bolt") && Math.abs(A.dx) < 260) {
        for (let k = 0; k < 2; k++) yield* shoot(e, A, { sprite: "p_fire", speed: 200, mult: 0.7, el: "fire", st: BURN(0.1, 2), ox: 10, oy: 16, tele: k ? 0.15 : 0.45, sound: "magic", scale: 0.9, recK: 0.4 });
        cool(e, "bolt", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 40 });
    }
  },
});

// ════ [정예] 잿빛 드레이크 ════ 하늘을 돌다 목을 젖혀 불을 내뿜고(앞쪽 부채꼴), 발톱 급강하 · 꼬리 휘두르기
register("af_drake", {
  ...X.pxDrake, speed: 110, sight: 320, atkMul: 1.6,
  *brain(e, A) {
    cool(e, "breath", 2, 3), cool(e, "dive", 3.5, 4.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 16 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "breath") && Math.abs(A.dx) < 200 && A.dy > -10) {
        A.face(), e.body.vx *= 0.2, e.body.vy *= 0.2;
        A.tele(0.6);
        yield A.once("wind");
        A.play("breath");
        A.sound("explosion", 0.4);
        for (let t = 0; t < 1; t += DT) {
          if ((t * 60) % 6 < 1) A.shoot({ sprite: "p_fire", speed: 240, gravity: 120, life: 1.2, radius: 5 }, e.cx + e.facing * 34, e.body.y - 26, Math.atan2(A.p.body.y - 10 - (e.body.y - 26), A.p.cx - e.cx) + (Math.random() - 0.5) * 0.35, 0.45, { el: "fire", st: BURN(0.1, 2), opts: { scale: 0.9 } });
          yield 0;
        }
        yield A.once("rec");
        cool(e, "breath", 3, 4);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 240) {
        yield* dive(e, A, { tele: 0.5, v: 420, dur: 0.6, mult: 1.3, fw: 30, fh: 22, st: BLEED(0.1, 2.5) });
        cool(e, "dive", 3.5, 5);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 90 });
    }
  },
});

// ════ 향로 정령 ════ 흔들리며 다가와 매캐한 연기를 뿜는다 (독 연기 장판이 잠깐 머문다)
register("af_censer", {
  ...X.pxCenser, speed: 50, sight: 240, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "smoke", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 8, speed: 24 });
        continue;
      }
      if (ready(e, "smoke") && near(A, 140, 120)) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("splat", 0.4);
        const x = A.p.cx;
        A.zone(x, groundY(e, x), 56, 3.2, 0.05, { el: "poison", st: POIS(0.1, 2), kind: "slime" });
        for (let k = 0; k < 10; k++) e.host.fx.burst("dust", x + (Math.random() - 0.5) * 50, groundY(e, x) - 6 - Math.random() * 20, 1, 0x8a8280);
        yield A.once("rec");
        cool(e, "smoke", 2.8, 3.8);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 60 });
    }
  },
});

// ════ 불박쥐 ════ 갈지자로 날다 불씨를 흘리며 들이받는다
register("af_bat", {
  ...X.pxFireBat, speed: 140, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "dive", 0.6, 1.4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, ry: 18, speed: 70, f: 1.6 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.3, v: 360, dur: 0.5, mult: 0.75, el: "fire", st: BURN(0.08, 2), fw: 16, fh: 14 });
        cool(e, "dive", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 80, alt: 60 });
    }
  },
});

// ════ 족쇄 망령 ════ 손을 뻗어 붙잡으면 족쇄를 채운다 (잠깐 묶임 + 중독 같은 저주 피해)
register("af_shackle", {
  ...X.pxShackle, speed: 70, sight: 240, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "grab", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 30 });
        continue;
      }
      if (ready(e, "grab") && near(A, 70, 50)) {
        yield* melee(e, A, { tele: 0.45, dash: 160, fw: 36, fh: 30, mult: 0.7, st: STUN(0.8), fx: "slash", tint: 0xc8d0d8, sound: "swing" });
        cool(e, "grab", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 50, alt: 20 });
    }
  },
});

// ════ [정예] 잿빛 불새 ════ 불 깃을 비처럼 쏟고(위에서 여러 발), 불타는 급강하 · 한 번 쓰러지면 잿더미에서 다시 살아난다(체력 절반)
register("af_phoenix", {
  ...X.pxPhoenix, speed: 120, sight: 320, atkMul: 1.6,
  // 쓰러질 피해를 처음 받으면 잿더미에서 다시 살아난다 (체력 절반)
  damage(e, dmg) {
    const M = e.fz?.mem;
    if (M && !M.reborn && dmg >= e.hp) {
      M.reborn = 1;
      e.hp = Math.round(e.maxHp * 0.5);
      e.host.fx.burst("glow", e.cx, e.cy, 24, FIRE);
      e.host.fx.anim("ring", e.cx, e.cy, { scale: 3, tint: FIRE });
      return 0;
    }
    return dmg;
  },
  *brain(e, A) {
    cool(e, "rain", 2, 3), cool(e, "dive", 3.5, 4.5);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 18 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "rain") && Math.abs(A.dx) < 220) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("rain");
        A.sound("magic", 0.5);
        for (let k = 0; k < 7; k++) {
          const x = A.p.cx + (k - 3) * 26 + (Math.random() - 0.5) * 10;
          A.shoot({ sprite: "p_fire", speed: 0, gravity: 500, life: 2, radius: 5 }, x, A.p.body.y - 160, 0, 0.55, { el: "fire", st: BURN(0.1, 2), opts: { vx: 0, vy: 60, scale: 0.9 } });
          yield 0.08;
        }
        cool(e, "rain", 3, 4);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 260) {
        yield* dive(e, A, { tele: 0.5, v: 440, dur: 0.6, mult: 1.3, el: "fire", st: BURN(0.12, 2.5), fw: 30, fh: 22 });
        cool(e, "dive", 3.5, 5);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 100 });
    }
  },
});
