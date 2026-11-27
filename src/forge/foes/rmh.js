// 미스트혼 몬스터 12종 행동 (그림은 px_mh.js)
import { register } from "./core.js";
import * as X from "./px_mh.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const MC = 0xc8d8d8, LC = 0xffc060, WC = 0xd8c8a0;

// ════ 등불 허수아비 ════ 기둥째 깡충깡충 뛰어온다 · 녹슨 낫으로 벤다(출혈) · 머리 등불을 키워 불씨를 흩뿌린다
register("mh_scarecrow", {
  ...X.pxScarecrow, speed: 40, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "embers", 1.5, 2.5);
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        yield 0.2;
        continue;
      }
      if (ready(e, "embers") && Math.abs(A.dx) < 200) {
        A.face(), A.stop(1);
        A.tele(0.45);
        yield A.once("glow");
        A.sound("magic", 0.4);
        for (let k = 0; k < 5; k++) A.shoot({ sprite: "p_fire", speed: 160 + k * 15, gravity: 380, life: 2, radius: 4 }, e.cx, e.cy - 24, -Math.PI / 2 + e.facing * (0.3 + k * 0.18), 0.4, { el: "fire", st: BURN(0.08, 2), opts: { scale: 0.6 } });
        cool(e, "embers", 3, 4);
        continue;
      }
      if (near(A, 54, 40) && ready(e, "reap")) {
        yield* melee(e, A, { tele: 0.45, dash: 60, fw: 40, fh: 30, mult: 1, knock: 0.8, st: BLEED(0.08, 2), fx: "slash", tint: WC, sound: "swing" });
        cool(e, "reap", 1.5, 2);
        continue;
      }
      if (A.ground && Math.abs(A.dx) > 40) {
        A.face(), A.play("move");
        hop(e, dirTo(A), e.speed * 1.6, 160);
        yield* land(e, A);
        A.stop(1);
        yield 0.2;
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 44 });
    }
  },
});

// ════ 흰 족제비 ════ 물결치듯 빠르게 달려들어 목덜미를 문다(출혈) · 뒷발로 서서 두리번거리다 갑자기 방향을 튼다
register("mh_stoat", {
  ...X.pxStoat, speed: 104, sight: 240, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "feint", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 30, range: 70, idle: "rear" });
        continue;
      }
      if (ready(e, "feint") && near(A, 100, 30)) {
        A.face(), A.stop(1);
        yield A.once("rear");
        hop(e, -dirTo(A), 140, 120);
        yield* land(e, A);
        cool(e, "feint", 3, 4);
        continue;
      }
      if (near(A, 40, 20) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.25, dash: 180, fw: 26, fh: 14, mult: 0.8, knock: 0.3, st: BLEED(0.08, 2.5), fx: "slash", tint: MC, sound: "punch", recK: 0.5 });
        cool(e, "bite", 0.9, 1.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 덫사냥꾼 ════ 거리를 두고 석궁을 쏜다 · 발밑에 쇠 덫을 던져 깐다(밟으면 묶이고 출혈) · 붙으면 개머리로 친다
register("mh_trapper", {
  ...X.pxTrapper, speed: 50, sight: 320, atkMul: 1,
  *brain(e, A) {
    cool(e, "bolt", 1, 2), cool(e, "trap", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 50 });
        continue;
      }
      if (ready(e, "trap") && Math.abs(A.dx) < 160) {
        yield* lob(e, A, {
          wind: "wind", atk: "throw", tele: 0.35, sprite: "p_rock", n: 1, mult: 0.2, el: "phys", oy: 34, ox: 10, scale: 0.8, lead: 0.6,
          onDone: (pr) => { e.host.fx.burst("chunk", pr.x, pr.y, 3, 0x5a5c5a); A.zone(pr.x, pr.y, 18, 4, 0.2, { el: "phys", st: STUN(0.8), kind: "sand" }); },
        });
        cool(e, "trap", 5, 6);
        continue;
      }
      if (near(A, 40, 30) && ready(e, "butt")) {
        yield* melee(e, A, { tele: 0.3, dash: 60, fw: 28, fh: 22, mult: 0.8, knock: 1.8, fx: "heavy", tint: MC, sound: "punch" });
        A.ground && hop(e, -e.facing, 160, 180);
        cool(e, "butt", 2, 2.6);
        continue;
      }
      if (ready(e, "bolt") && Math.abs(A.dx) < 320 && Math.abs(A.dy) < 80) {
        yield* shoot(e, A, { sprite: "p_arrow", n: 1, speed: 420, mult: 1, el: "phys", st: BLEED(0.06, 2), ox: 20, oy: 40, tele: 0.6, sound: "bow", scale: 1 });
        cool(e, "bolt", 1.8, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 120, hi: 200 });
    }
  },
});

// ════ [정예] 목 없는 기사 ════ 죽은 말을 몰아 안개를 가르며 돌진 · 쇠사슬 철퇴를 크게 휘두른다 · 말이 앞발을 들어 내려찍는다 ·
//   옆구리의 제 머리가 비명을 지르면 주변이 얼어붙는다 · 체력 절반부터 돌진 뒤 되돌아 한 번 더
register("mh_dullahan", {
  ...X.pxDullahan, speed: 70, sight: 360, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "rush", 2, 3), cool(e, "scream", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 16, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "rear", sound: "bossRoar", vol: 0.55 });
      const rage = e.hp < e.maxHp * 0.5;
      if (ready(e, "scream") && near(A, 140, 80)) {
        A.stop(1);
        A.tele(0.6);
        yield A.once("wind");
        A.sound("bossRoar", 0.6), A.shake(2);
        e.host.fx.anim("ring", e.cx, e.cy - 20, { scale: 3, tint: 0x8af0c8 });
        near(A, 130, 80) && e.hit(0.6, !1, "ice", CHILL(0.6, 2.4), 0.8);
        cool(e, "scream", 7, 9);
        continue;
      }
      if (ready(e, "rush") && Math.abs(A.dx) > 100 && Math.abs(A.dx) < 360 && Math.abs(A.dy) < 50) {
        for (let k = 0; k < (rage ? 2 : 1); k++) {
          yield* charge(e, A, { tele: k ? 0.4 : 0.8, run: "gallop", v: 360, dur: 1.2, mult: 1.6, knock: 2.4, fw: 56, fh: 50, dust: 0x9aaaa8, overLedge: !1 });
          A.face();
        }
        cool(e, "rush", 4, 5.5);
        continue;
      }
      if (near(A, 90, 50) && ready(e, "stomp") && Math.random() < 0.4) {
        yield* slam(e, A, { wind: "rear", atk: "atk", r: 56, mult: 1.5, tele: 0.65, fwd: 50, shake: 3.5, chunk: 0x5a5448, tint: MC, dust: 0x9aaaa8 });
        cool(e, "stomp", 3, 4);
        continue;
      }
      if (near(A, 120, 70) && ready(e, "flail")) {
        yield* melee(e, A, { tele: 0.6, bar: 1, dash: 80, fw: 110, fh: 70, mult: 1.6, knock: 2, st: STUN(0.3), fx: "heavy", tint: MC, sound: "swing" });
        cool(e, "flail", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 90 });
    }
  },
});

// ════ 입 벌린 그루터기 ════ 그루터기인 척 가만히 있다(덜 아프다) · 가까이 오면 입을 쩍 벌려 문다 · 느릿느릿 뿌리로 쫓아온다
register("mh_stump", {
  ...X.pxStump, speed: 26, sight: 180, atkMul: 1.1, heavy: 1,
  damage: (e, dmg) => (e.fz.mem.hidden ? dmg * 0.4 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      if (M.hidden) {
        A.stop(1), A.play("hide");
        if (e.aggro && near(A, 44, 30)) { M.hidden = 0; A.face(); yield* melee(e, A, { tele: 0.15, dash: 60, fw: 32, fh: 26, mult: 1.3, knock: 1, st: BLEED(0.1, 2.5), fx: "slash", tint: WC, sound: "punch" }); cool(e, "bite", 1.6, 2.2); }
        yield 0.1;
        continue;
      }
      if (!e.aggro) { M.hidden = 1; continue; }
      if (near(A, 40, 30) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.4, dash: 50, fw: 30, fh: 26, mult: 1.1, knock: 1, st: BLEED(0.08, 2), fx: "slash", tint: WC, sound: "punch" });
        cool(e, "bite", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 통곡하는 드라이어드 ════ 울부짖음이 부채꼴로 퍼진다(느려짐 · 밀려남) · 땅속 뿌리를 플레이어 발밑으로 뻗어 찌른다(예고) · 가지 손으로 할퀸다
register("mh_dryad", {
  ...X.pxDryad, speed: 30, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "wail", 1.5, 2.5), cool(e, "roots", 2.5, 3.5);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 8, range: 30 });
        continue;
      }
      if (ready(e, "roots") && Math.abs(A.dx) < 260) {
        A.face(), A.stop(1);
        const x = A.p.cx, y = groundY(e, x);
        A.tele(0.3, { bar: [x, 44] });
        yield A.once("wind");
        yield 0.3;
        A.once("atk");
        A.sound("thud", 0.5);
        e.host.fx.burst("chunk", x, y - 6, 8, 0x5a5448);
        e.playerInRect(x - 22, y - 44, 44, 44) && e.hit(0.9, !0, "earth", STUN(0.4), 0.8);
        cool(e, "roots", 3.6, 4.6);
        continue;
      }
      if (ready(e, "wail") && near(A, 180, 70)) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [e.cx + e.facing * 80, 160] });
        yield A.once("wail");
        A.sound("bossRoar", 0.35);
        if (Math.sign(A.dx) === e.facing && near(A, 170, 70)) { e.hit(0.5, !1, "arcane", CHILL(0.5, 2), 0); A.p.body.vx = e.facing * 260; }
        cool(e, "wail", 3.4, 4.4);
        continue;
      }
      if (near(A, 46, 34) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.4, dash: 50, fw: 34, fh: 30, mult: 0.9, knock: 0.8, st: BLEED(0.06, 2), fx: "slash", tint: WC, sound: "swing" });
        cool(e, "claw", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 90, hi: 160 });
    }
  },
});

// ════ 대벌레 ════ 가만히 있으면 마른 가지 (공격받기 전엔 쫓지 않는다) · 낫처럼 접은 앞다리로 길게 내리친다 · 성큼성큼 물러났다 다시 다가온다
register("mh_stick", {
  ...X.pxStick, speed: 44, sight: 160, atkMul: 1,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        A.play("idle"), A.stop(1);
        yield 0.2;
        continue;
      }
      if (near(A, 70, 30) && ready(e, "strike")) {
        yield* melee(e, A, { tele: 0.45, dash: 70, fw: 50, fh: 26, mult: 1.1, knock: 0.8, st: BLEED(0.06, 2), fx: "slash", tint: WC, sound: "swing" });
        e.fz.mem.back = 0.6;
        cool(e, "strike", 1.6, 2.2);
        continue;
      }
      if (e.fz.mem.back > 0) { e.fz.mem.back -= DT; A.play("move"), A.walk(-dirTo(A), e.speed); A.face(); yield 0; continue; }
      yield* approach(e, A, { lo: 0, hi: 56 });
    }
  },
});

// ════ [정예] 웬디고 ════ 긴 팔로 크게 할퀴기 두 번(출혈) · 네 발로 내달려 덮치기 · 울부짖으면 서리 입김이 퍼진다(느려짐) ·
//   맞힐 때마다 굶주림을 채워 체력을 되찾는다 · 체력 절반부터 안개 속으로 사라졌다 등 뒤에서 덮친다
register("mh_wendigo", {
  ...X.pxWendigo, speed: 74, sight: 360, atkMul: 1.9,
  damage: (e, dmg) => (e.fz.mem.gone ? 0 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    const feed = () => { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.03); glowOn(e, 0xc03030, 6); };
    cool(e, "howl", 3, 4), cool(e, "leap", 2, 3), cool(e, "vanish", 6, 8);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "howl", sound: "bossRoar", vol: 0.55 });
      if (ready(e, "vanish") && e.hp < e.maxHp * 0.5) {
        M.gone = 1;
        A.stop(1);
        e.host.fx.burst("dust", e.cx, e.cy, 16, MC);
        e.sprite.setVisible(!1);
        yield 0.8;
        const back = -(A.p.facing ?? 1) || 1;
        e.body.x = A.p.cx + back * 50, e.body.y = A.p.body.y - 6, e.body.vx = e.body.vy = 0;
        e.facing = -back;
        e.sprite.setVisible(!0);
        e.host.fx.burst("dust", e.cx, e.cy, 16, MC);
        M.gone = 0;
        yield* melee(e, A, { tele: 0.3, dash: 140, fw: 70, fh: 60, mult: 1.6, knock: 1.6, st: BLEED(0.12, 3), fx: "heavy", tint: MC, sound: "swing", onHit: feed });
        cool(e, "vanish", 8, 10);
        continue;
      }
      if (ready(e, "howl") && near(A, 160, 90)) {
        A.stop(1);
        A.tele(0.55);
        yield A.once("howl");
        A.sound("bossRoar", 0.6), A.shake(2);
        e.host.fx.anim("ring", e.cx, e.cy - 30, { scale: 3, tint: MC });
        near(A, 150, 90) && e.hit(0.5, !1, "ice", CHILL(0.6, 2.4), 1);
        cool(e, "howl", 6, 8);
        continue;
      }
      if (ready(e, "leap") && A.ground && Math.abs(A.dx) > 90 && Math.abs(A.dx) < 280 && Math.abs(A.dy) < 80) {
        A.face(), A.stop(1);
        A.tele(0.5, { bar: [A.p.cx, 70] });
        yield A.once("wind");
        A.play("leap");
        A.sound("dash", 0.6);
        hop(e, dirTo(A), Math.min(420, Math.abs(A.dx) * 2.3), 320);
        for (let t = 0; t < 1.2; t += DT) { if (A.melee(44, 50, 1.4, { knock: 1.6, st: BLEED(0.1, 2.5) })) { feed(); break; } if (t > 0.25 && A.ground) break; yield 0; }
        yield* land(e, A);
        A.shake(2);
        cool(e, "leap", 3.5, 4.5);
        continue;
      }
      if (near(A, 90, 70) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.5, bar: 1, dash: 100, fw: 76, fh: 64, mult: 1.2, knock: 0.6, st: BLEED(0.08, 2), fx: "slash", tint: MC, sound: "swing", recK: 0.3, onHit: feed });
        yield* melee(e, A, { tele: 0.15, dash: 100, fw: 76, fh: 64, mult: 1.3, knock: 1.8, st: BLEED(0.08, 2), fx: "heavy", tint: MC, sound: "swing", onHit: feed });
        cool(e, "claw", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 76 });
    }
  },
});

// ════ 낙엽 덩이 ════ 낙엽 더미 속에 숨어 있다(덜 아프다) · 덮치면 잎이 소용돌이쳐 할퀸다 · 잎사귀를 흩날려 쏜다
register("mh_leaves", {
  ...X.pxLeaves, speed: 50, sight: 200, atkMul: 0.8,
  damage: (e, dmg) => (e.fz.mem.hidden ? dmg * 0.5 : dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    cool(e, "gust", 1.5, 2.5);
    for (;;) {
      if (M.hidden) {
        A.stop(1), A.play("hide");
        if (e.aggro && near(A, 70, 40)) M.hidden = 0;
        yield 0.1;
        continue;
      }
      if (near(A, 34, 30) && ready(e, "swirl")) {
        A.face(), A.stop(1);
        A.tele(0.35);
        yield A.once("wind");
        A.play("atk");
        A.sound("swing", 0.4);
        for (let t = 0; t < 0.6; t += DT) { e.body.vx = e.facing * 90; A.melee(30, 30, 0.35, { knock: 0.3, st: BLEED(0.04, 1.5) }); yield 0; }
        yield A.once("rec");
        cool(e, "swirl", 1.8, 2.4);
        continue;
      }
      if (ready(e, "gust") && Math.abs(A.dx) < 200) {
        yield* shoot(e, A, { sprite: "p_wave", n: 3, spread: 0.2, speed: 200, mult: 0.4, el: "wind", ox: 6, oy: 10, tele: 0.4, sound: "swing", scale: 0.5 });
        cool(e, "gust", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 26 });
    }
  },
});

// ════ 미친 나무꾼 ════ 도끼를 높이 들어 내려찍는다(땅울림) · 미친 듯이 세 번 연달아 휘두른다 · 도끼를 던졌다 주우러 달려간다
register("mh_woodcutter", {
  ...X.pxWoodcutter, speed: 62, sight: 260, atkMul: 1.1,
  *brain(e, A) {
    cool(e, "frenzy", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 50 });
        continue;
      }
      if (ready(e, "frenzy") && near(A, 50, 30)) {
        for (let k = 0; k < 3; k++) yield* melee(e, A, { tele: k ? 0.12 : 0.45, dash: 110, fw: 40, fh: 30, mult: 0.7, knock: k === 2 ? 1.6 : 0.3, st: BLEED(0.06, 2), fx: "slash", tint: WC, sound: "swing", recK: k < 2 ? 0.2 : 1 });
        cool(e, "frenzy", 4, 5);
        continue;
      }
      if (near(A, 70, 40) && ready(e, "chop")) {
        yield* slam(e, A, { r: 40, mult: 1.3, tele: 0.55, fwd: 34, shake: 2.5, chunk: 0x6a4a30, tint: WC, dust: 0x9aaaa8 });
        cool(e, "chop", 1.8, 2.4);
        continue;
      }
      if (ready(e, "toss") && Math.abs(A.dx) > 90 && Math.abs(A.dx) < 220) {
        yield* lob(e, A, { tele: 0.45, sprite: "p_rock", n: 1, mult: 1, el: "phys", st: BLEED(0.08, 2), oy: 44, ox: 10, scale: 1.2, chunkC: 0x6a6a66 });
        cool(e, "toss", 4, 5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 40 });
    }
  },
});

// ════ 회색 너구리 ════ 도토리와 돌을 던진다 · 붙으면 할퀴고 달아난다 · 맞으면 겁먹고 도망친다
register("mh_raccoon", {
  ...X.pxRaccoon, speed: 80, sight: 240, atkMul: 0.8,
  damage: (e, dmg) => ((e.fz.mem.flee = 0.7), dmg),
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "throw", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22, range: 60 });
        continue;
      }
      if (M.flee > 0) { M.flee -= DT; A.play("move"), A.walk(-dirTo(A), e.speed); yield 0; continue; }
      if (near(A, 30, 20) && ready(e, "scratch")) {
        yield* melee(e, A, { tele: 0.25, dash: 90, fw: 24, fh: 16, mult: 0.7, knock: 0.4, st: BLEED(0.05, 1.5), fx: "slash", tint: WC, sound: "punch" });
        M.flee = 0.8;
        cool(e, "scratch", 1.6, 2.2);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) < 220) {
        yield* lob(e, A, { wind: "wind", atk: "throw", tele: 0.3, sprite: "p_rock", n: 2, gap: 0.2, spread: 30, mult: 0.45, el: "phys", oy: 22, ox: 14, scale: 0.6, chunkC: 0x8a6a3a });
        cool(e, "throw", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { lo: 70, hi: 130 });
    }
  },
});

// ════ [정예] 외눈 거인 ════ 고사목 몽둥이 내려치기(넓은 땅울림) · 옆으로 크게 휩쓸기 · 맨발로 땅을 굴러 돌을 튕긴다 · 바위를 뽑아 던진다 ·
//   체력 절반부터 미친 나무꾼을 부른다(제 숲을 지키는 일꾼)
register("mh_cyclops", {
  ...X.pxCyclops, speed: 38, sight: 340, atkMul: 1.9, heavy: 1,
  *brain(e, A) {
    cool(e, "boulder", 2, 3), cool(e, "stomp", 3, 4), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "stomp", sound: "bossRoar", vol: 0.55 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "mh_woodcutter", n: 1, max: 2, dx: 50, anim: "stomp", col: MC });
        cool(e, "call", 11, 14);
        continue;
      }
      if (ready(e, "stomp") && near(A, 160, 60)) {
        yield* slam(e, A, { wind: "wind", atk: "stomp", r: 100, mult: 1.1, tele: 0.6, fwd: 0, shake: 4, st: STUN(0.4), chunk: 0x6a6a5a, tint: MC, dust: 0x9aaaa8 });
        for (let k = 0; k < 5; k++) A.shoot({ sprite: "p_rock", speed: 200, gravity: 520, life: 2, radius: 4 }, e.cx, e.body.y - 6, -Math.PI / 2 + (k - 2) * 0.45, 0.45, { el: "earth", opts: { scale: 0.7 } });
        cool(e, "stomp", 5, 6.5);
        continue;
      }
      if (near(A, 110, 60) && ready(e, "club")) {
        if (Math.random() < 0.5) yield* slam(e, A, { r: 64, mult: 1.8, tele: 0.75, fwd: 60, shake: 4.5, chunk: 0x5a5448, tint: MC, dust: 0x9aaaa8 });
        else yield* melee(e, A, { tele: 0.65, bar: 1, dash: 50, fw: 110, fh: 60, mult: 1.5, knock: 2.4, fx: "heavy", tint: MC, sound: "swing" });
        cool(e, "club", 1.8, 2.6);
        continue;
      }
      if (ready(e, "boulder") && Math.abs(A.dx) > 110 && Math.abs(A.dx) < 340) {
        yield* lob(e, A, { wind: "wind", atk: "throw", tele: 0.6, sprite: "p_bigrock", n: 1, mult: 1.3, el: "earth", oy: 90, ox: 20, scale: 1.4, chunkC: 0x6a6a5a });
        A.shake(2);
        cool(e, "boulder", 3.4, 4.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 90 });
    }
  },
});
