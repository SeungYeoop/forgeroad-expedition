// 글리머샌즈 몬스터 12종 행동 (그림은 px_gl.js)
import { register } from "./core.js";
import * as X from "./px_gl.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const BOLTC = 0xa0e0ff, GLASSC = 0x9ad8d0, SANDC = 0xe0c898;
const hiddenDmg = (e, dmg) => (e.fz?.mem.hidden ? dmg * 0.2 : dmg);
// 예고한 자리에 번개 줄기 (xs 마다)
function* strikes(e, A, xs, o = {}) {
  for (const x of xs) A.tele(o.tele ?? 0.75, { bar: [x, 30] });
  yield A.once(o.anim ?? "wind");
  A.sound("explosion", 0.45), A.shake(1.5);
  for (const x of xs) {
    const gy = groundY(e, x);
    for (let k = 0; k < 6; k++) e.host.fx.burst("glow", x + (Math.random() - 0.5) * 10, gy - k * 22, 1, BOLTC);
    e.playerInRect(x - 14, gy - 130, 28, 130) && e.hit(o.mult ?? 1, !1, "lightning", STUN(0.35), 0.3);
  }
}

// ════ 번개유리 하이에나 ════ 떼로 다니며 낄낄 웃어 무리를 부추긴다(무리 회복 · 깨움) · 낮게 웅크렸다 달려들어 문다(출혈)
register("gl_hyena", {
  ...X.pxHyena, speed: 100, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "laugh", 2, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 28, range: 70 });
        continue;
      }
      if (ready(e, "laugh")) {
        A.stop(1);
        yield A.once("laugh");
        A.sound("bossRoar", 0.2);
        for (const o of e.host.enemies ?? []) if (!o.dead && o !== e && Math.abs(o.cx - e.cx) < 160) { o.aggro = !0; o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.08); }
        cool(e, "laugh", 7, 9);
        continue;
      }
      if (near(A, 110, 30) && ready(e, "lunge") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.35);
        yield A.once("wind");
        A.once("atk");
        A.sound("dash", 0.4);
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2.6), 180);
        for (let t = 0; t < 0.6; t += DT) { if (A.melee(20, 16, 0.9, { knock: 1, st: BLEED(0.1, 2.5) })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        yield A.once("rec");
        cool(e, "lunge", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 40, hi: 90 });
    }
  },
});

// ════ 유리턱 개미 ════ 줄지어 다니며 유리 큰턱으로 물고(출혈) · 몸을 세워 개미산을 짧게 뿜는다(독)
register("gl_ant", {
  ...X.pxAnt, speed: 70, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "acid", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 30, range: 80 });
        continue;
      }
      if (near(A, 34, 20) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.3, dash: 100, fw: 20, fh: 14, mult: 0.8, knock: 0.8, st: BLEED(0.08, 2), fx: "slash", tint: GLASSC, sound: "punch" });
        cool(e, "bite", 0.9, 1.4);
        continue;
      }
      if (ready(e, "acid") && near(A, 90, 30)) {
        yield* shoot(e, A, { sprite: "sl_glob", n: 3, spread: 0.18, speed: 200, mult: 0.45, el: "poison", st: POIS(0.08, 2), ox: 14, oy: 10, tele: 0.4, sound: "splat", scale: 0.5 });
        cool(e, "acid", 3, 4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 26 });
    }
  },
});

// ════ 유리혹 낙타 ════ 목을 젖혔다 녹은 유리를 뱉는다(화상 · 바닥에 남는다) · 뒤로 다가오면 뒷발로 걷어찬다
register("gl_camel", {
  ...X.pxCamel, speed: 50, sight: 260, atkMul: 1.1, heavy: 0.6,
  *brain(e, A) {
    cool(e, "spit", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 70 });
        continue;
      }
      if (Math.sign(A.dx) !== e.facing && near(A, 60, 40) && ready(e, "kick")) {
        A.stop(1);
        A.tele(0.4, { bar: [e.cx - e.facing * 40, 60] });
        yield 0.35;
        A.sound("punch", 0.6);
        e.playerInRect(e.cx - (e.facing > 0 ? 64 : 0), e.body.y - 40, 64, 40) && e.hit(1.2, !1, "phys", STUN(0.3), 2);
        yield 0.5;
        cool(e, "kick", 2, 3);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) > 40 && Math.abs(A.dx) < 260) {
        yield* lob(e, A, { tele: 0.5, sprite: "p_fire", n: 2, gap: 0.12, spread: 30, mult: 0.8, el: "fire", st: BURN(0.12, 2.5), oy: 70, ox: 40, scale: 0.9, chunkC: 0xffa040, onDone: (pr) => !e.dead && A.zone(pr.x, groundY(e, pr.x), 30, 2.4, 0.05, { el: "fire", st: BURN(0.1, 2), kind: "fire" }) });
        cool(e, "spit", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 80, hi: 160 });
    }
  },
});

// ════ [정예] 번개 코뿔소 ════ 유리 뿔을 숙이고 일직선 돌진(크게 날림) · 뿔로 떠올리기 · 뿔에 번개를 모아 주변 세 곳에 벼락(예고)
register("gl_rhino", {
  ...X.pxRhino, speed: 40, sight: 300, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "charge", 1.5, 2.5), cool(e, "storm", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "storm", sound: "bossRoar", vol: 0.4 });
      if (ready(e, "storm") && Math.abs(A.dx) < 300) {
        A.stop(1);
        yield* strikes(e, A, [A.p.cx - 60, A.p.cx, A.p.cx + 60], { anim: "storm", mult: 1.1 });
        cool(e, "storm", 4.5, 6);
        continue;
      }
      if (near(A, 90, 40) && ready(e, "toss")) {
        yield* melee(e, A, { tele: 0.55, bar: 1, dash: 140, fw: 60, fh: 40, mult: 1.5, knock: 1.6, up: 1, el: "lightning", fx: "heavy", tint: BOLTC, sound: "punch" });
        cool(e, "toss", 1.6, 2.2);
        continue;
      }
      if (ready(e, "charge") && Math.abs(A.dx) > 90 && Math.abs(A.dx) < 340 && Math.abs(A.dy) < 40) {
        yield* charge(e, A, { run: "charge", tele: 0.8, v: 320, dur: 1.4, mult: 1.8, knock: 2.4, fw: 54, fh: 40, el: "lightning", dust: SANDC });
        cool(e, "charge", 3.6, 5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 80 });
    }
  },
});

// ════ 번개 구슬 ════ 지지직 다가와 몸을 부풀려 둘레로 방전한다(잠깐 굳음) · 멀면 전기 화살을 쏜다
register("gl_orb", {
  ...X.pxOrb, speed: 80, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "bolt", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 14, speed: 30 });
        continue;
      }
      if (near(A, 54, 50) && ready(e, "zap")) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("explosion", 0.35);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.2, tint: BOLTC });
        e.playerInRect(e.cx - 50, e.cy - 50, 100, 100) && e.hit(0.9, !1, "lightning", STUN(0.4), 0.6);
        yield A.once("rec");
        cool(e, "zap", 2.2, 3);
        continue;
      }
      if (ready(e, "bolt") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { sprite: "p_ebolt", n: 1, speed: 300, mult: 0.7, el: "lightning", ox: 0, oy: 0, tele: 0.4, sound: "magic", scale: 0.9 });
        cool(e, "bolt", 2, 2.8);
        continue;
      }
      A.play("move");
      A.flyTo(A.p.cx, A.p.body.y - 30, e.speed);
      yield 0;
    }
  },
});

// ════ 해골 독수리 ════ 높이 맴돌다 뼈 발톱으로 내리꽂는다(출혈) · 쪼고 나면 다시 높이 오른다
register("gl_vulture", {
  ...X.pxVulture, speed: 110, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "dive", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 90, ry: 14, speed: 50 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.45, v: 400, dur: 0.55, mult: 0.9, st: BLEED(0.1, 2.5), fw: 20, fh: 14 });
        cool(e, "dive", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 120, alt: 110 });
    }
  },
});

// ════ 태양 렌즈 눈 ════ 렌즈로 햇빛을 모아 플레이어 발밑에 뜨거운 점을 좇게 한 뒤 태운다(화상) · 눈부신 섬광(잠깐 굳음)
register("gl_lens", {
  ...X.pxLens, speed: 44, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "burn", 1, 2), cool(e, "flash", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 10, speed: 20 });
        continue;
      }
      if (ready(e, "flash") && near(A, 90, 70)) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("magic", 0.5);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.6, tint: 0xfff0a0 });
        near(A, 100, 80) && e.hit(0.3, !1, "fire", STUN(0.6), 0);
        cool(e, "flash", 5, 6.5);
        continue;
      }
      if (ready(e, "burn") && Math.abs(A.dx) < 280) {
        A.stop(1), A.play("wind");
        let x = A.p.cx;
        for (let t = 0; t < 1.1; t += 0.1) { x += (A.p.cx - x) * 0.35; const gy = groundY(e, x); e.host.fx.burst("glow", x, gy - 2, 1, 0xfff0a0); yield 0.1; }
        A.once("atk");
        A.sound("explosion", 0.3);
        const gy = groundY(e, x);
        A.zone(x, gy, 30, 1.6, 0.08, { el: "fire", st: BURN(0.12, 2), kind: "fire" });
        e.playerInRect(x - 16, gy - 40, 32, 40) && e.hit(1, !1, "fire", BURN(0.14, 2.5), 0.2);
        yield A.once("rec");
        cool(e, "burn", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 80 });
    }
  },
});

// ════ [정예] 천둥새 ════ 날개를 펴 벼락 넷을 부른다(예고) · 발톱 내리꽂기(출혈) · 날갯짓 돌풍 · 번개 구슬을 낳는다
register("gl_thunder", {
  ...X.pxThunderbird, speed: 110, sight: 340, atkMul: 1.7,
  *brain(e, A) {
    cool(e, "storm", 2, 3), cool(e, "dive", 1.5, 2.5), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70, ry: 14, speed: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "storm", sound: "bossRoar", vol: 0.4 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.6) {
        yield* summon(e, A, { id: "gl_orb", n: 2, max: 3, dx: 50, dy: 20, anim: "storm", col: BOLTC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "storm") && Math.abs(A.dx) < 320) {
        A.stop(1);
        const x0 = A.p.cx;
        yield* strikes(e, A, [x0 - 90, x0 - 30, x0 + 30, x0 + 90], { anim: "storm", mult: 1.1, tele: 0.85 });
        cool(e, "storm", 4.5, 6);
        continue;
      }
      if (ready(e, "gust") && Math.abs(A.dx) < 240) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.sound("swing", 0.7);
        for (const d of [-0.2, 0.2]) A.shoot({ sprite: "p_wave", speed: 260, gravity: 0, life: 1.2, radius: 10 }, e.cx + e.facing * 20, e.cy, Math.atan2(A.p.body.y - 12 - e.cy, A.p.cx - e.cx) + d, 0.6, { el: "wind", opts: { tint: 0xd8e8f0 } });
        yield 0.3;
        cool(e, "gust", 3, 4);
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 260) {
        yield* dive(e, A, { tele: 0.55, v: 440, dur: 0.6, mult: 1.4, st: BLEED(0.14, 3), fw: 34, fh: 24, knock: 1.4 });
        cool(e, "dive", 2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 110 });
    }
  },
});

// ════ 유리병 소라게 ════ 다가오면 유리병 속으로 쏙 숨는다(덜 아프다) · 틈을 보다 튀어나와 큰 집게로 집는다
register("gl_crab", {
  ...X.pxBottleCrab, speed: 40, sight: 200, atkMul: 0.9,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.hidden = 0;
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (!M.hidden && near(A, 60, 30) && ready(e, "hide")) {
        A.stop(1);
        yield A.once("hide");
        M.hidden = 1;
        for (let t = 0; t < 1.4; t += 0.1) { A.play("hide"); yield 0.1; }
        yield A.once("out");
        M.hidden = 0;
        A.face();
        yield* melee(e, A, { tele: 0.1, dash: 90, fw: 26, fh: 16, mult: 1.1, knock: 1.2, st: BLEED(0.08, 2), fx: "slash", tint: 0xd8683a, sound: "punch" });
        cool(e, "hide", 2.4, 3.2);
        continue;
      }
      if (near(A, 36, 22) && ready(e, "pinch")) {
        yield* melee(e, A, { tele: 0.35, dash: 70, fw: 24, fh: 16, mult: 0.9, knock: 1, fx: "slash", tint: 0xd8683a, sound: "punch" });
        cool(e, "pinch", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 도굴꾼 해골 ════ 곡괭이를 치켜들었다 내려찍는다 · 멀면 파낸 유리 조각을 던진다
register("gl_skel", {
  ...X.pxGraveSkel, speed: 46, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "throw", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (near(A, 46, 30) && ready(e, "pick")) {
        yield* melee(e, A, { tele: 0.5, dash: 70, fw: 34, fh: 30, mult: 1.2, knock: 1.2, st: BLEED(0.08, 2), fx: "heavy", tint: 0xd8d0c0, sound: "swing" });
        cool(e, "pick", 1.4, 2);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 240) {
        yield* lob(e, A, { tele: 0.4, sprite: "p_rock", mult: 0.7, el: "phys", st: BLEED(0.06, 2), oy: 50, ox: 10, scale: 0.8, chunkC: GLASSC });
        cool(e, "throw", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ 낙타거미 ════ 무섭게 빠르다 · 순식간에 달려들어 두 겹 턱으로 물어뜯고 바로 물러난다(출혈)
register("gl_solifuge", {
  ...X.pxSolifuge, speed: 130, sight: 240, atkMul: 0.9,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 40, range: 80 });
        continue;
      }
      if (near(A, 120, 30) && ready(e, "rush")) {
        yield* charge(e, A, { tele: 0.35, v: 360, dur: 0.45, mult: 0.9, knock: 0.8, fw: 22, fh: 14, st: BLEED(0.1, 2.5), stopOnHit: 1, stun: !1, dust: SANDC });
        if (A.ground) { hop(e, -e.facing, 200, 160); yield* land(e, A); }
        cool(e, "rush", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 110 });
    }
  },
});

// ════ [정예] 개미귀신 ════ 모래 깔때기 함정 한가운데서 기다린다 · 가까이 오면 모래가 흘러 플레이어를 끌어당긴다 · 모래를 퍼부어 던진다 ·
//   큰턱으로 물기(출혈) · 모래 속으로 파고들었다 플레이어 쪽에서 솟는다 · 체력 절반부터 유리턱 개미가 몰려든다
register("gl_antlion", {
  ...X.pxAntlion, speed: 30, sight: 300, atkMul: 1.7, heavy: 1,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "fling", 1.5, 2.5), cool(e, "burrow", 4, 6), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        M.hidden = 0;
        A.stop(1), A.play("idle");
        yield 0.3;
        continue;
      }
      yield* notice(e, A, { anim: "fling", sound: "bossRoar", vol: 0.35 });
      // 함정: 가까우면 모래가 흘러 끌려온다
      if (A.ground && Math.abs(A.dx) < 150 && Math.abs(A.dy) < 40) A.p.body.vx += Math.sign(e.cx - A.p.cx) * 5;
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "gl_ant", n: 3, max: 4, dx: 60, anim: "fling", col: SANDC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "burrow") && Math.abs(A.dx) > 120) {
        A.stop(1);
        yield A.once("sink");
        M.hidden = 1;
        for (let t = 0; t < 2.2 && !near(A, 40, 40); t += DT) { A.play("sink"); A.face(); e.body.vx = dirTo(A) * 170; Math.random() < 0.25 && e.host.fx.burst("dust", e.cx, e.body.y - 2, 1, SANDC); yield 0; }
        A.stop(1);
        A.tele(0.4, { bar: [e.cx + e.facing * 30, 100] });
        yield 0.3;
        A.once("rise");
        M.hidden = 0;
        A.shake(2.5), A.sound("bossRoar", 0.4);
        for (let k = 0; k < 12; k++) e.host.fx.burst("dust", e.cx + (Math.random() - 0.5) * 80, e.body.y - Math.random() * 20, 1, SANDC);
        e.playerInRect(e.cx - 50, e.body.y - 50, 100, 50) && e.hit(1.4, !0, "earth", STUN(0.4), 1.6);
        yield 0.5;
        cool(e, "burrow", 6, 8);
        continue;
      }
      if (near(A, 90, 40) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.55, bar: 1, dash: 60, fw: 64, fh: 32, mult: 1.6, knock: 1.4, st: BLEED(0.14, 3), fx: "heavy", tint: SANDC, sound: "punch" });
        cool(e, "bite", 1.6, 2.2);
        continue;
      }
      if (ready(e, "fling") && Math.abs(A.dx) < 280) {
        yield* lob(e, A, { wind: "fling", atk: "fling", tele: 0.5, sprite: "p_rock", n: 4, gap: 0.12, spread: 70, mult: 0.6, el: "earth", oy: 30, ox: 40, scale: 0.9, chunkC: SANDC });
        cool(e, "fling", 2.6, 3.4);
        continue;
      }
      A.stop(1), A.play("idle");
      yield 0.2;
    }
  },
});
