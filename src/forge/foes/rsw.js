// 섀도웰 몬스터 12종 행동 (그림은 px_sw.js)
import { register } from "./core.js";
import * as X from "./px_sw.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const VC = 0xc8a0ff, VD = 0x4a2a6a;

// ════ 심연 감시자 ════ 눈 아홉이 동시에 노려본다 — 가운데 눈이 빛줄기를 쏘고(예고), 작은 눈들이 보랏빛 구슬을 흩뿌린다
register("sw_watcher", {
  ...X.pxWatcher, speed: 40, sight: 320, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "gaze", 1, 2), cool(e, "orbs", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 10, speed: 18 });
        continue;
      }
      if (ready(e, "orbs") && Math.abs(A.dx) < 240) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.sound("magic", 0.4);
        for (let k = 0; k < 6; k++) A.shoot({ sprite: "p_orb", speed: 130, gravity: 0, life: 2.4, radius: 5 }, e.cx, e.cy, (k / 6) * Math.PI * 2, 0.45, { el: "arcane", opts: { scale: 0.7, tint: VC } });
        cool(e, "orbs", 3.4, 4.4);
        continue;
      }
      if (ready(e, "gaze") && Math.abs(A.dx) < 300) {
        yield* shoot(e, A, { sprite: "p_ebolt", n: 1, speed: 380, mult: 0.9, el: "arcane", ox: 4, oy: 0, tele: 0.65, sound: "magic", scale: 1 });
        cool(e, "gaze", 2, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 70 });
    }
  },
});

// ════ 그림자 꼭두각시 ════ 실에 끌려 휘청이며 다가와 칼을 두 번 휘두른다 · 실이 당겨지면 갑자기 크게 뛰어오른다
register("sw_puppet", {
  ...X.pxPuppet, speed: 52, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "yank", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 40 });
        continue;
      }
      if (ready(e, "yank") && A.ground && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 200) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield 0.25;
        hop(e, dirTo(A), Math.min(300, Math.abs(A.dx) * 2.2), 360);
        for (let t = 0; t < 1; t += DT) { if (A.melee(20, 24, 1, { knock: 1 })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "yank", 3, 4);
        continue;
      }
      if (near(A, 46, 30) && ready(e, "slash")) {
        yield* melee(e, A, { tele: 0.4, dash: 90, fw: 30, fh: 24, mult: 0.8, knock: 0.4, st: BLEED(0.06, 2), fx: "slash", tint: VC, sound: "swing", recK: 0.3 });
        yield* melee(e, A, { tele: 0.08, dash: 90, fw: 30, fh: 24, mult: 0.9, knock: 1.2, fx: "slash", tint: VC, sound: "swing" });
        cool(e, "slash", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 36 });
    }
  },
});

// ════ 심연 촉수 ════ 바위 틈에서 꼼짝 않는다(덜 아프다) · 가까이 오면 촉수 셋으로 후려치고, 갈고리로 끌어당긴다
register("sw_tendril", {
  ...X.pxTendril, speed: 0, sight: 200, atkMul: 1.1, heavy: 1,
  damage: (e, dmg) => dmg * 0.7,
  *brain(e, A) {
    cool(e, "hook", 2, 3);
    for (;;) {
      A.stop(1);
      if (!e.aggro) { A.play("idle"); yield 0.3; continue; }
      if (ready(e, "hook") && Math.abs(A.dx) > 50 && Math.abs(A.dx) < 140 && Math.abs(A.dy) < 60) {
        A.face();
        A.tele(0.5, { bar: [e.cx + e.facing * 70, 120] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.5);
        if (e.playerInRect(e.cx + (e.facing > 0 ? 10 : -140), e.body.y - 70, 130, 70)) { e.hit(0.6, !1, "arcane", STUN(0.4), 0); A.p.body.vx = -e.facing * 300; }
        yield A.once("rec");
        cool(e, "hook", 3.4, 4.4);
        continue;
      }
      if (near(A, 60, 70) && ready(e, "lash")) {
        A.face();
        yield* melee(e, A, { tele: 0.45, fw: 50, fh: 60, mult: 1.1, knock: 1.4, fx: "slash", tint: VC, sound: "swing" });
        cool(e, "lash", 1.4, 2);
        continue;
      }
      A.play("idle");
      yield 0.15;
    }
  },
});

// ════ [정예] 심연 처형인 ════ 거대 도끼 내려찍기(땅울림 · 출혈) · 도끼를 끌며 일직선 돌진 · 쇠사슬을 던져 끌어당긴다 ·
//   체력 절반부터 내려찍은 자리에 어둠이 고인다(느려짐)
register("sw_executioner", {
  ...X.pxExecutioner, speed: 40, sight: 300, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "chain", 2, 3), cool(e, "rush", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.4 });
      const rage = e.hp < e.maxHp * 0.5;
      if (near(A, 90, 50) && ready(e, "chop")) {
        yield* slam(e, A, { r: 58, mult: 1.7, tele: 0.7, fwd: 48, shake: 3.5, chunk: 0x5a5660, tint: VC, dust: 0x4a4250 });
        rage && A.zone(e.cx + e.facing * 48, groundY(e, e.cx + e.facing * 48), 60, 3.4, 0.05, { el: "arcane", st: CHILL(0.45, 1.2), kind: "slime" });
        cool(e, "chop", 1.8, 2.6);
        continue;
      }
      if (ready(e, "chain") && Math.abs(A.dx) > 90 && Math.abs(A.dx) < 240 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 120, 200] });
        yield 0.4;
        A.sound("swing", 0.6);
        yield 0.15;
        if (e.playerInRect(e.cx + (e.facing > 0 ? 0 : -240), e.body.y - 50, 240, 40)) { e.hit(0.6, !1, "phys", STUN(0.5), 0); A.p.body.vx = -e.facing * 420, A.p.body.vy = -160; }
        yield 0.5;
        cool(e, "chain", 4.5, 6);
        continue;
      }
      if (ready(e, "rush") && Math.abs(A.dx) > 120 && Math.abs(A.dx) < 320 && Math.abs(A.dy) < 40) {
        yield* charge(e, A, { tele: 0.7, v: 300, dur: 1.2, mult: 1.5, knock: 2, fw: 40, fh: 40, st: BLEED(0.1, 2.5), dust: 0x4a4250 });
        cool(e, "rush", 4, 5.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 70 });
    }
  },
});

// ════ 그림자 분신 ════ 칠흑 전사의 그림자 · 달려들며 두 번 벤다 · 맞으면 그림자 속으로 흩어졌다 등 뒤에서 나타난다
register("sw_double", {
  ...X.pxDouble, speed: 80, sight: 280, atkMul: 1,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "shift", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20, range: 60 });
        continue;
      }
      if (ready(e, "shift") && A.ground && near(A, 160, 40)) {
        A.stop(1);
        e.host.fx.burst("glow", e.cx, e.cy, 10, VD);
        hop(e, dirTo(A), Math.abs(A.dx) * 2.4 + 140, 320);
        yield* land(e, A);
        A.face();
        e.host.fx.burst("glow", e.cx, e.cy, 10, VD);
        yield* melee(e, A, { tele: 0.2, dash: 140, fw: 34, fh: 24, mult: 1, knock: 1, st: BLEED(0.08, 2), fx: "slash", tint: VC, sound: "swing" });
        cool(e, "shift", 4, 5);
        continue;
      }
      if (near(A, 60, 30) && ready(e, "slash")) {
        yield* melee(e, A, { tele: 0.4, dash: 160, fw: 34, fh: 24, mult: 0.9, knock: 0.4, fx: "slash", tint: VC, sound: "swing", recK: 0.3 });
        yield* melee(e, A, { tele: 0.1, dash: 120, fw: 34, fh: 24, mult: 1, knock: 1.2, fx: "slash", tint: VC, sound: "swing" });
        cool(e, "slash", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 20, hi: 50 });
    }
  },
});

// ════ 작은 특이점 ════ 둘레를 끌어당긴다(가까울수록 세게) · 한껏 끌어모은 뒤 터지듯 밀어낸다
register("sw_singular", {
  ...X.pxSingular, speed: 30, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "pull", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 20, ry: 8, speed: 16 });
        continue;
      }
      if (ready(e, "pull") && near(A, 200, 140)) {
        A.stop(1);
        A.tele(0.4);
        A.play("wind");
        A.sound("magic", 0.4);
        for (let t = 0; t < 1.4; t += DT) { const dx = e.cx - A.p.cx, dy = e.cy - A.p.cy, d = Math.hypot(dx, dy) || 1; if (d < 200) { A.p.body.vx += (dx / d) * 14; A.p.body.vy += (dy / d) * 6; } yield 0; }
        A.once("atk");
        A.sound("explosion", 0.5), A.shake(2);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2.6, tint: VC });
        near(A, 60, 60) && e.hit(1.1, !1, "arcane", STUN(0.3), 2.2);
        yield A.once("rec");
        cool(e, "pull", 4, 5);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 40 });
    }
  },
});

// ════ 자수정 가시도마뱀 ════ 결정 가시를 곤두세웠다 부채꼴로 쏜다(출혈) · 가까우면 몸을 웅크려 가시로 찌른다
register("sw_devil", {
  ...X.pxDevil, speed: 54, sight: 240, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "quill", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 50 });
        continue;
      }
      if (ready(e, "quill") && Math.abs(A.dx) < 220) {
        yield* shoot(e, A, { sprite: "p_thorn", n: 5, spread: 0.18, speed: 240, mult: 0.45, el: "phys", st: BLEED(0.06, 2), ox: 0, oy: 14, tele: 0.45, sound: "shoot", scale: 0.8 });
        cool(e, "quill", 2.4, 3.2);
        continue;
      }
      if (near(A, 34, 22) && ready(e, "spike")) {
        yield* melee(e, A, { tele: 0.3, fw: 30, fh: 20, mult: 0.9, knock: 1, st: BLEED(0.08, 2), fx: "slash", tint: VC, sound: "punch" });
        cool(e, "spike", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 120 });
    }
  },
});

// ════ [정예] 심연 거인의 손 ════ 주먹을 들어 내리친다(땅울림) · 움켜쥐어 조였다 던진다(잠깐 묶임) · 손가락을 튕겨 바위를 날린다 ·
//   체력이 줄면 그림자 분신이 손바닥에서 솟아난다
register("sw_hand", {
  ...X.pxGiantHand, speed: 26, sight: 300, atkMul: 1.8, heavy: 1,
  *brain(e, A) {
    cool(e, "grab", 2, 3), cool(e, "flick", 1.5, 2.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      yield* notice(e, A, { anim: "grab", sound: "bossRoar", vol: 0.4 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.6) {
        yield* summon(e, A, { id: "sw_double", n: 1, max: 2, dx: 40, anim: "grab", col: VC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (near(A, 80, 60) && ready(e, "grab")) {
        A.face(), A.stop(1);
        A.tele(0.55);
        yield A.once("grab");
        let held = !1;
        for (let t = 0; t < 0.25; t += DT) { if (A.melee(40, 50, 0.5, { knock: 0, st: STUN(1) })) { held = !0; break; } yield 0; }
        if (held) { for (let k = 0; k < 2; k++) { yield 0.3; e.playerInRect(e.cx - 40, e.body.y - 80, 80, 80) && e.hit(0.5, !1, "phys", STUN(0.4), 0); A.shake(1); } A.p.body.vx = e.facing * 380, A.p.body.vy = -260; }
        cool(e, "grab", 4, 5);
        continue;
      }
      if (near(A, 110, 60) && ready(e, "smash")) {
        yield* slam(e, A, { r: 60, mult: 1.6, tele: 0.65, fwd: 30, shake: 3.5, chunk: 0x7a7280, tint: VC, dust: 0x4a4250 });
        cool(e, "smash", 1.8, 2.6);
        continue;
      }
      if (ready(e, "flick") && Math.abs(A.dx) > 80 && Math.abs(A.dx) < 300) {
        yield* lob(e, A, { wind: "wind", atk: "flick", tele: 0.45, sprite: "p_rock", n: 3, gap: 0.1, spread: 50, mult: 0.7, el: "earth", oy: 60, ox: 20, scale: 1, chunkC: 0x6a6470 });
        cool(e, "flick", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 70 });
    }
  },
});

// ════ 공허 성게 ════ 천천히 굴러다니다 가시를 사방으로 쏜다 · 맨손으로 치면 가시에 찔린다
register("sw_urchin", {
  ...X.pxUrchin, speed: 24, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "burst", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (near(A, 24, 24)) A.melee(18, 18, 0.4, { knock: 0.6, st: BLEED(0.06, 1.5) });
      if (ready(e, "burst") && near(A, 200, 100)) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("shoot", 0.5);
        for (let k = 0; k < 10; k++) A.shoot({ sprite: "p_thorn", speed: 200, gravity: 0, life: 1.2, radius: 4 }, e.cx, e.cy, Math.PI + (k / 9) * Math.PI, 0.45, { el: "arcane", st: BLEED(0.05, 1.5), opts: { scale: 0.7 } });
        yield A.once("rec");
        cool(e, "burst", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 20 });
    }
  },
});

// ════ 공허 교단 사제 ════ 공허 구슬을 쏜다 · 발밑 마법진에서 공허 성게를 불러낸다 · 가까이 오면 어둠을 터뜨려 밀어낸다
register("sw_acolyte", {
  ...X.pxAcolyte, speed: 34, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "bolt", 1, 2), cool(e, "call", 3, 5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      if (ready(e, "call")) {
        yield* summon(e, A, { id: "sw_urchin", n: 1, max: 2, dx: 30, anim: "summon", col: VC });
        cool(e, "call", 9, 12);
        continue;
      }
      if (near(A, 50, 40) && ready(e, "push")) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.sound("explosion", 0.4);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 2, tint: VC });
        near(A, 60, 50) && e.hit(0.6, !1, "arcane", void 0, 2.4);
        cool(e, "push", 3, 4);
        continue;
      }
      if (ready(e, "bolt") && Math.abs(A.dx) < 300) {
        yield* shoot(e, A, { sprite: "p_orb", n: 2, spread: 0.15, speed: 200, mult: 0.7, el: "arcane", st: CHILL(0.3, 1.2), ox: 18, oy: 40, tele: 0.5, sound: "magic", scale: 1 });
        cool(e, "bolt", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 120, hi: 200 });
    }
  },
});

// ════ 그림자 거미불가사리 ════ 꿈틀대는 긴 팔로 빠르게 기어와 감아 조인다(잠깐 묶임)
register("sw_brittle", {
  ...X.pxBrittle, speed: 70, sight: 220, atkMul: 0.8,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 24, range: 60 });
        continue;
      }
      if (near(A, 50, 24) && ready(e, "wrap")) {
        yield* melee(e, A, { tele: 0.4, dash: 120, fw: 36, fh: 18, mult: 0.8, knock: 0.2, st: STUN(0.6), fx: "slash", tint: VC, sound: "swing" });
        cool(e, "wrap", 1.8, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ [정예] 심연의 사신 ════ 거대 낫으로 크게 휩쓴다(출혈) · 어둠 속으로 사라졌다 플레이어 뒤에서 나타난다 · 낫을 던져 되돌아오게 한다 ·
//   체력 절반부터 공허 교단 사제를 불러낸다
register("sw_reaper", {
  ...X.pxReaper, speed: 60, sight: 340, atkMul: 1.9,
  *brain(e, A) {
    cool(e, "blink", 2, 3), cool(e, "throw", 3, 4), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 8, speed: 18 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.45 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "sw_acolyte", n: 1, max: 2, dx: 50, anim: "blink", col: VC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "blink") && Math.abs(A.dx) < 260) {
        A.stop(1);
        A.play("blink");
        e.host.fx.burst("glow", e.cx, e.cy, 14, VD);
        yield 0.4;
        const side = -Math.sign(A.p.facing || 1);
        for (let t = 0; t < 0.3; t += DT) { A.flyTo(A.p.cx + side * 50, A.p.body.y - 30, 900); yield 0; }
        e.host.fx.burst("glow", e.cx, e.cy, 14, VD);
        A.face();
        yield* melee(e, A, { tele: 0.35, dash: 100, fw: 70, fh: 50, mult: 1.6, knock: 1.6, st: BLEED(0.14, 3), fx: "heavy", tint: VC, sound: "swing" });
        cool(e, "blink", 4, 5.5);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) > 80 && Math.abs(A.dx) < 300) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 130, 240] });
        yield A.once("wind");
        A.once("atk");
        A.sound("swing", 0.7);
        const a = e.facing > 0 ? 0 : Math.PI;
        A.shoot({ sprite: "p_wave", speed: 300, gravity: 0, life: 0.8, radius: 12 }, e.cx + e.facing * 20, e.cy, a, 1, { el: "arcane", st: BLEED(0.1, 2), opts: { tint: VC } });
        yield 0.8;
        A.shoot({ sprite: "p_wave", speed: 300, gravity: 0, life: 0.8, radius: 12 }, e.cx + e.facing * 240, e.cy, a + Math.PI, 1, { el: "arcane", st: BLEED(0.1, 2), opts: { tint: VC } });
        cool(e, "throw", 4, 5);
        continue;
      }
      if (near(A, 90, 60) && ready(e, "reap")) {
        yield* melee(e, A, { tele: 0.6, bar: 1, dash: 80, fw: 80, fh: 56, mult: 1.6, knock: 1.4, st: BLEED(0.14, 3), fx: "heavy", tint: VC, sound: "swing" });
        cool(e, "reap", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 20 });
    }
  },
});
