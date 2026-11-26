// 앰버홀드 몬스터 12종 행동 (그림은 px_ah.js)
import { register } from "./core.js";
import * as X from "./px_ah.js";
import { DT, POIS, STUN, CHILL, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const AMBC = 0xffb048, GOLDC = 0xffe090, STEELC = 0xa8aab0, REDC = 0xc04030;
// 호박 진액 웅덩이: 밟으면 끈적해 느려진다
const resin = (e, A, x, w = 44, dur = 3) => {
  A.zone(x, groundY(e, x), w, dur, 0.03, { el: "earth", st: CHILL(0.45, 1.2), kind: "slime" });
  e.host.fx.burst("glow", x, groundY(e, x) - 4, 6, AMBC);
};
// 깃발·나팔로 주변 아군을 북돋운다: 체력 조금 회복 + 반짝
const rally = (e, r, k) => {
  for (const o of e.host.enemies ?? []) if (!o.dead && o !== e && Math.abs(o.cx - e.cx) < r && Math.abs(o.cy - e.cy) < r) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * k); o.aggro = !0; glowOn(o, GOLDC, 3); }
};

// ════ 성채 경비견 ════ 짖어 가까운 적을 움찔하게 하고(잠깐 굳음), 낮게 웅크렸다 달려들어 문다 (출혈)
register("ah_hound", {
  ...X.pxMastiff, speed: 96, sight: 260, atkMul: 1,
  *brain(e, A) {
    cool(e, "bark", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 26, range: 70 });
        continue;
      }
      if (ready(e, "bark") && near(A, 90, 50)) {
        A.face(), A.stop(1);
        A.once("bark");
        A.sound("bossRoar", 0.25);
        yield 0.25;
        e.host.fx.anim("ring", e.cx + e.facing * 20, e.body.y - 14, { scale: 1.6, tint: GOLDC });
        near(A, 70, 40) && e.hit(0.3, !1, "phys", STUN(0.35), 0.8);
        yield 0.4;
        cool(e, "bark", 4, 6);
        continue;
      }
      if (near(A, 110, 30) && ready(e, "lunge") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.35);
        yield A.once("wind");
        A.once("atk");
        A.sound("dash", 0.4);
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2.6), 180);
        for (let t = 0; t < 0.6; t += DT) { if (A.melee(20, 16, 1, { knock: 1, st: BLEED(0.1, 2.5) })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        yield A.once("rec");
        cool(e, "lunge", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 80 });
    }
  },
});

// ════ 미늘창병 ════ 미늘창을 치켜들었다 내려찍는다(긴 사거리) · 가까우면 창끝으로 빠르게 찌른다
register("ah_footman", {
  ...X.pxFootman, speed: 44, sight: 240, atkMul: 1.1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      if (near(A, 30, 26) && ready(e, "jab")) {
        yield* melee(e, A, { tele: 0.25, dash: 80, fw: 30, fh: 16, mult: 0.8, knock: 1.2, fx: "slash", tint: STEELC, sound: "swing", recK: 0.6 });
        cool(e, "jab", 1, 1.4);
        continue;
      }
      if (near(A, 70, 34) && ready(e, "chop")) {
        yield* melee(e, A, { tele: 0.55, bar: 1, dash: 60, fw: 62, fh: 34, mult: 1.3, knock: 1.4, fx: "heavy", tint: STEELC, sound: "swing", win: 0.25 });
        A.shake(1);
        cool(e, "chop", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 56 });
    }
  },
});

// ════ 수지 덩어리 ════ 느리게 굴러와 몸을 납작 부딪치고, 끈적한 진액 덩어리를 뱉는다(느려짐) · 터지면 진액 웅덩이를 남긴다
register("ah_ooze", {
  ...X.pxOoze, speed: 26, sight: 220, atkMul: 0.8,
  die(e, A) {
    resin(e, A, e.cx, 50, 4);
    A.sound("splat", 0.6);
  },
  *brain(e, A) {
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 30 });
        continue;
      }
      if (near(A, 40, 26) && ready(e, "slap")) {
        yield* melee(e, A, { tele: 0.45, dash: 90, fw: 26, fh: 18, mult: 0.9, knock: 0.8, st: CHILL(0.4, 1.5), fx: "heavy", tint: AMBC, sound: "splat" });
        cool(e, "slap", 1.4, 2);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) > 50 && Math.abs(A.dx) < 220) {
        yield* lob(e, A, { tele: 0.45, sprite: "sl_glob", mult: 0.6, el: "earth", st: CHILL(0.5, 2), oy: 18, scale: 0.9, chunkC: AMBC, onDone: (pr) => !e.dead && resin(e, A, pr.x, 34, 2.4) });
        cool(e, "spit", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 텅 빈 갑주 거인 ════ 탑 방패를 세우면 앞쪽 공격을 막는다 · 방패로 밀쳐내기 · 대검 내려찍기(땅울림) ·
//   체력 절반부터 찍은 자리에 호박 진액이 고인다
register("ah_bulwark", {
  ...X.pxBulwark, speed: 30, sight: 260, atkMul: 1.7, heavy: 1,
  blocks(e, S) {
    return !!e.fz?.mem.guard && e.stunT <= 0 && S.dir === -e.facing && !S.pierceShield;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "guard", 1, 2);
    for (;;) {
      if (!e.aggro) {
        M.guard = 0;
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "guard", sound: "block", vol: 0.6 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "guard") && near(A, 140, 60) && Math.random() < 0.5) {
        A.face(), A.stop(1);
        M.guard = 1, A.play("guard");
        for (let t = 0; t < 1.4; t += 0.1) { A.face(); yield 0.1; }
        M.guard = 0;
        if (near(A, 50, 40)) yield* melee(e, A, { tele: 0.2, dash: 160, fw: 34, fh: 40, mult: 0.9, knock: 2.2, st: STUN(0.3), fx: "heavy", tint: GOLDC, sound: "block" });
        cool(e, "guard", 3, 4.5);
        continue;
      }
      if (near(A, 90, 50) && ready(e, "smash")) {
        yield* slam(e, A, { r: 56, mult: 1.6, tele: 0.65, fwd: 46, shake: 3, chunk: STEELC, tint: AMBC, dust: 0xa89a88 });
        rage && resin(e, A, e.cx + e.facing * 46, 60, 4);
        cool(e, "smash", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 70 });
    }
  },
});

// ════ 석궁병 ════ 거리를 벌리고 무거운 볼트를 쏜다(아프다) · 쏜 뒤 한참 감는다 · 바짝 붙으면 뒤로 물러난다
register("ah_xbow", {
  ...X.pxCrossbow, speed: 40, sight: 320, atkMul: 1,
  *brain(e, A) {
    cool(e, "shot", 1, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (near(A, 50, 30) && A.ground && ready(e, "back")) {
        A.face();
        hop(e, -dirTo(A), 160, 200);
        yield* land(e, A);
        cool(e, "back", 2, 3);
        continue;
      }
      if (ready(e, "shot") && Math.abs(A.dx) < 320 && Math.abs(A.dy) < 80) {
        yield* shoot(e, A, { sprite: "p_arrow", n: 1, speed: 420, mult: 1.2, el: "phys", ox: 26, oy: 46, tele: 0.6, sound: "shoot", scale: 1.1 });
        A.play("rec");
        yield 1.2;
        cool(e, "shot", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 140, hi: 230 });
    }
  },
});

// ════ 호박 말벌 ════ 붕붕 맴돌다 배를 굽혀 독침을 찌르러 내리꽂는다
register("ah_wasp", {
  ...X.pxWasp, speed: 120, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "sting", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 16, speed: 50 });
        continue;
      }
      if (ready(e, "sting") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.35, v: 380, dur: 0.45, mult: 0.8, st: POIS(0.12, 3), fw: 16, fh: 14 });
        cool(e, "sting", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 80, alt: 50 });
    }
  },
});

// ════ 깃발 기수 ════ 깃발을 높이 흔들어 주변 아군을 북돋는다(체력 회복) · 깃대 창끝으로 길게 찌른다
register("ah_banner", {
  ...X.pxBearer, speed: 40, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "rally", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (ready(e, "rally")) {
        A.stop(1), A.play("rally");
        A.sound("buff", 0.5);
        for (let t = 0; t < 1.2; t += 0.3) (glowOn(e, GOLDC, 3), yield 0.3);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3.4, tint: GOLDC });
        rally(e, 170, 0.15);
        cool(e, "rally", 7, 9);
        continue;
      }
      if (near(A, 74, 30) && ready(e, "poke")) {
        yield* melee(e, A, { tele: 0.45, bar: 1, dash: 70, fw: 60, fh: 18, mult: 1, knock: 1.2, fx: "slash", tint: GOLDC, sound: "swing" });
        cool(e, "poke", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 70 });
    }
  },
});

// ════ [정예] 기마 창기사 ════ 창을 낮추고 일직선으로 질주(크게 아프고 멀리 날림) · 가까우면 창으로 찌르고 말발굽으로 짓밟는다 ·
//   체력 절반부터 미늘창병을 부른다
register("ah_lancer", {
  ...X.pxLancer, speed: 70, sight: 320, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "charge", 1.5, 2.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 80 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "ah_footman", n: 2, max: 2, dx: 50, anim: "wind", col: GOLDC });
        cool(e, "call", 12, 15);
        continue;
      }
      if (ready(e, "charge") && Math.abs(A.dx) > 80 && Math.abs(A.dx) < 360 && Math.abs(A.dy) < 50) {
        yield* charge(e, A, { tele: 0.7, v: 360, dur: 1.3, mult: 1.6, knock: 2.2, fw: 44, fh: 30, dust: 0xb89a70 });
        cool(e, "charge", 3, 4.5);
        continue;
      }
      if (near(A, 90, 40) && ready(e, "thrust")) {
        yield* melee(e, A, { tele: 0.45, bar: 1, dash: 100, fw: 76, fh: 24, mult: 1.3, knock: 1.6, fx: "slash", tint: STEELC, sound: "swing" });
        cool(e, "thrust", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 120, hi: 220 });
    }
  },
});

// ════ 망루 매 ════ 높이 맴돌다 날개를 접고 발톱으로 내리꽂는다 (출혈)
register("ah_falcon", {
  ...X.pxFalcon, speed: 140, sight: 320, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "dive", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 16, speed: 60 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 240) {
        yield* dive(e, A, { tele: 0.4, v: 460, dur: 0.55, mult: 0.9, st: BLEED(0.1, 2.5), fw: 18, fh: 14 });
        cool(e, "dive", 1.6, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 110 });
    }
  },
});

// ════ 날개 투구 ════ 투구째로 들이받아 머리를 울린다(잠깐 굳음) · 맞고 튕겨 나가 다시 날아든다
register("ah_helm", {
  ...X.pxWingHelm, speed: 90, sight: 280, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "ram", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 12, speed: 40 });
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.5, v: 360, dur: 0.5, mult: 0.9, st: STUN(0.35), fw: 18, fh: 18, onHit: () => (A.sound("block", 0.5), e.host.fx.burst("spark", e.cx, e.cy, 6, AMBC)) });
        cool(e, "ram", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 60 });
    }
  },
});

// ════ 망령 전령 ════ 나팔을 불어 소리 물결을 보낸다(밀려남) · 주변 아군을 깨워 북돋는다
register("ah_herald", {
  ...X.pxHerald, speed: 50, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "blow", 1, 2), cool(e, "rally", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 24 });
        continue;
      }
      if (ready(e, "rally")) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.once("atk");
        A.sound("buff", 0.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3, tint: GOLDC });
        rally(e, 200, 0.1);
        yield A.once("rec");
        cool(e, "rally", 8, 10);
        continue;
      }
      if (ready(e, "blow") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { sprite: "p_wave", n: 1, speed: 220, mult: 0.7, el: "wind", st: { type: "stun", chance: 0.3, dur: 0.3 }, ox: 30, oy: 20, tele: 0.45, sound: "magic", scale: 1 });
        cool(e, "blow", 2.2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 60 });
    }
  },
});

// ════ [정예] 그리폰 ════ 높이서 발톱을 세우고 내리꽂는다(출혈) · 날갯짓 돌풍 세 갈래(밀려남) · 울부짖어 가까운 적을 굳히고 망루 매를 부른다
register("ah_griffon", {
  ...X.pxGriffon, speed: 110, sight: 340, atkMul: 1.7,
  *brain(e, A) {
    cool(e, "dive", 1.5, 2.5), cool(e, "gust", 3, 4), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70, ry: 14, speed: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "gust", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.6) {
        A.stop(1), A.play("wind");
        A.sound("bossRoar", 0.4);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3, tint: GOLDC });
        near(A, 90, 70) && e.hit(0.4, !1, "phys", STUN(0.5), 0.6);
        yield 0.5;
        yield* summon(e, A, { id: "ah_falcon", n: 2, max: 2, dx: 50, dy: 20, anim: "gust", col: GOLDC });
        cool(e, "call", 11, 14);
        continue;
      }
      if (ready(e, "gust") && Math.abs(A.dx) < 280) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("gust");
        A.sound("swing", 0.7);
        for (const d of [-0.22, 0, 0.22]) A.shoot({ sprite: "p_wave", speed: 240, gravity: 0, life: 1.4, radius: 10 }, e.cx + e.facing * 20, e.cy, Math.atan2(A.p.body.y - 12 - e.cy, A.p.cx - e.cx) + d, 0.7, { el: "wind", opts: { tint: 0xf0e0b0 } });
        yield 0.3;
        cool(e, "gust", 3.4, 4.6);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 260) {
        yield* dive(e, A, { tele: 0.55, v: 440, dur: 0.6, mult: 1.4, st: BLEED(0.14, 3), fw: 34, fh: 24, knock: 1.4 });
        cool(e, "dive", 2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 100 });
    }
  },
});
