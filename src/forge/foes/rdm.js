// 듄미스트 몬스터 12종 행동 (그림은 px_dm.js)
import { register } from "./core.js";
import * as X from "./px_dm.js";
import { DT, POIS, STUN, CHILL, BURN, BLEED, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const SANDC = 0xd8b880, TURQC = 0x50e0d0, SUNC = 0xffd070;
const dust = (e, x, y, n = 8) => { for (let k = 0; k < n; k++) e.host.fx.burst("dust", x + (Math.random() - 0.5) * 30, y - Math.random() * 8, 1, SANDC); };
// 모래 속에 숨어 있으면 덜 아프다
const hiddenDmg = (e, dmg) => (e.fz?.mem.hidden ? dmg * 0.2 : dmg);

// ════ 신기루 여우 ════ 아지랑이처럼 일렁이며 플레이어 머리 위로 뛰어넘어 뒤에서 문다 · 가까우면 바로 문다
register("dm_fox", {
  ...X.pxFox, speed: 110, sight: 260, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "blink", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 30, range: 70 });
        continue;
      }
      if (ready(e, "blink") && A.ground && Math.abs(A.dx) > 40 && Math.abs(A.dx) < 150 && Math.abs(A.dy) < 30) {
        A.face(), A.stop(1);
        yield A.once("blink");
        A.play("blink");
        A.sound("magic", 0.3);
        hop(e, dirTo(A), Math.abs(A.dx) * 2.4 + 120, 340);
        yield* land(e, A);
        A.face();
        yield* melee(e, A, { tele: 0.15, dash: 160, fw: 22, fh: 16, mult: 0.9, knock: 1, st: BLEED(0.08, 2), fx: "slash", tint: SANDC, sound: "punch" });
        cool(e, "blink", 3, 4);
        continue;
      }
      if (near(A, 40, 24) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.3, dash: 140, fw: 22, fh: 16, mult: 0.9, knock: 1, fx: "slash", tint: SANDC, sound: "punch" });
        cool(e, "bite", 1, 1.6);
        continue;
      }
      yield* approach(e, A, { lo: 20, hi: 60 });
    }
  },
});

// ════ 모래공 쇠똥구리 ════ 뒷다리로 모래공을 힘껏 차 굴려 보낸다 · 공을 다시 빚는 동안은 틈 · 가까우면 머리 삽으로 떠올린다
register("dm_beetle", {
  ...X.pxDungBeetle, speed: 34, sight: 260, atkMul: 0.9, heavy: 0.5,
  *brain(e, A) {
    cool(e, "roll", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      if (near(A, 36, 22) && ready(e, "scoop")) {
        yield* melee(e, A, { tele: 0.35, dash: 100, fw: 22, fh: 16, mult: 0.8, knock: 1, up: 1, fx: "slash", tint: SANDC, sound: "punch" });
        cool(e, "scoop", 1.2, 1.8);
        continue;
      }
      if (ready(e, "roll") && Math.abs(A.dx) < 300 && Math.abs(A.dy) < 30) {
        // 공은 뒤쪽에 있으니 등을 플레이어 쪽으로 돌린다
        e.facing = -dirTo(A), A.stop(1);
        A.tele(0.55, { bar: [e.cx - e.facing * 60, 120] });
        yield A.once("wind");
        A.once("atk");
        A.sound("thud", 0.5);
        A.shoot({ sprite: "p_bigrock", speed: 220, gravity: 0, life: 1.8, radius: 9 }, e.cx - e.facing * 14, e.body.y - 10, e.facing > 0 ? Math.PI : 0, 0.9, { el: "earth", opts: { tint: SANDC } });
        dust(e, e.cx - e.facing * 14, e.body.y, 6);
        yield A.once("rec");
        cool(e, "roll", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 140 });
    }
  },
});

// ════ 뿔 독사 ════ 모래 속에 숨어 있다(맞아도 덜 아프다) 가까이 오면 솟구쳐 문다 (독) · 물고 나면 다시 파고든다
register("dm_viper", {
  ...X.pxViper, speed: 50, sight: 220, atkMul: 0.9,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.hidden = 0;
        yield* wander(e, A, { speed: 18, range: 50 });
        continue;
      }
      if (!M.hidden && !near(A, 50, 30)) {
        A.stop(1);
        yield A.once("hide");
        M.hidden = 1;
        dust(e, e.cx, e.body.y, 6);
      }
      if (M.hidden) {
        A.play("hide");
        // 모래 속에서 슬금슬금 다가간다
        if (!near(A, 46, 30)) { e.body.vx = dirTo(A) * 40, A.face(); yield 0.1; continue; }
        A.stop(1), A.face();
        A.tele(0.3);
        yield A.once("rise");
        M.hidden = 0;
        dust(e, e.cx, e.body.y, 8);
      }
      yield* melee(e, A, { tele: 0.1, dash: 150, fw: 26, fh: 16, mult: 1, knock: 0.8, st: POIS(0.14, 3), fx: "slash", tint: 0xc8a878, sound: "punch" });
      yield 0.4;
    }
  },
});

// ════ [정예] 오아시스 악어 ════ 모래 속에 숨어 빠르게 다가와(맞아도 덜 아프다) 솟구치며 크게 문다(출혈) ·
//   가까우면 턱으로 낚아채고, 꼬리를 휘둘러 뒤쪽까지 쓸어낸다
register("dm_croc", {
  ...X.pxCroc, speed: 44, sight: 280, atkMul: 1.7, heavy: 1,
  damage: hiddenDmg,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "dive", 2, 3);
    for (;;) {
      if (!e.aggro) {
        M.hidden = 0;
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.3 });
      if (ready(e, "dive") && Math.abs(A.dx) > 90 && Math.abs(A.dy) < 40) {
        A.stop(1);
        yield A.once("hide");
        M.hidden = 1;
        dust(e, e.cx, e.body.y, 12);
        for (let t = 0; t < 2.4 && !near(A, 60, 40); t += DT) { A.play("hide"); A.face(); e.body.vx = dirTo(A) * 150; Math.random() < 0.2 && dust(e, e.cx, e.body.y, 1); yield 0; }
        A.stop(1);
        A.tele(0.35, { bar: [e.cx + e.facing * 40, 90] });
        yield 0.3;
        A.once("rise");
        M.hidden = 0;
        A.sound("bossRoar", 0.4), A.shake(2);
        dust(e, e.cx, e.body.y, 14);
        yield 0.2;
        yield* melee(e, A, { tele: 0, dash: 160, fw: 60, fh: 30, mult: 1.6, knock: 1.6, st: BLEED(0.15, 3), fx: "heavy", tint: 0xd8c040, sound: "punch" });
        cool(e, "dive", 4, 5.5);
        continue;
      }
      if (near(A, 110, 40) && Math.sign(A.dx) !== e.facing && ready(e, "tail")) {
        A.stop(1);
        A.tele(0.5, { bar: [e.cx - e.facing * 60, 120] });
        yield 0.4;
        A.once("sweep");
        A.sound("swing", 0.7);
        yield 0.15;
        e.playerInRect(e.cx - (e.facing > 0 ? 120 : 0), e.body.y - 30, 120, 30) && e.hit(1.2, !1, "phys", void 0, 1.8);
        yield 0.5;
        cool(e, "tail", 2.4, 3.2);
        continue;
      }
      if (near(A, 90, 34) && ready(e, "snap")) {
        yield* melee(e, A, { tele: 0.5, bar: 1, dash: 140, fw: 56, fh: 24, mult: 1.4, knock: 1.2, fx: "heavy", tint: 0xd8c040, sound: "punch" });
        cool(e, "snap", 1.6, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 70 });
    }
  },
});

// ════ 모래 약탈자 ════ 언월도를 치켜들었다 달려들며 벤다 · 한 줌 모래를 뿌려 눈을 흐린다(느려짐)
register("dm_raider", {
  ...X.pxRaider, speed: 64, sight: 260, atkMul: 1,
  *brain(e, A) {
    cool(e, "sand", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18, range: 60 });
        continue;
      }
      if (ready(e, "sand") && near(A, 90, 40)) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("throw");
        A.sound("swing", 0.4);
        for (let k = 0; k < 3; k++) A.shoot({ sprite: "p_orb", speed: 220, gravity: 0, life: 0.5, radius: 7 }, e.cx + e.facing * 12, e.body.y - 26, (e.facing > 0 ? 0 : Math.PI) + (k - 1) * 0.2, 0.3, { el: "earth", st: CHILL(0.45, 1.6), opts: { tint: SANDC, scale: 0.8 } });
        yield 0.3;
        cool(e, "sand", 4, 5);
        continue;
      }
      if (near(A, 80, 30) && ready(e, "slash")) {
        yield* melee(e, A, { tele: 0.45, dash: 220, fw: 36, fh: 22, mult: 1.1, knock: 1.2, st: BLEED(0.08, 2), fx: "slash", tint: 0xe8e8e0, sound: "swing" });
        cool(e, "slash", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 60 });
    }
  },
});

// ════ 메뚜기 떼 ════ 몰려와 플레이어를 뒤덮고 잠시 갉아먹는다(여러 번 조금씩)
register("dm_locust", {
  ...X.pxLocusts, speed: 80, sight: 260, atkMul: 0.6,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 14, speed: 40 });
        continue;
      }
      if (near(A, 30, 34) && ready(e, "gnaw")) {
        A.once("wind");
        A.sound("splat", 0.2);
        for (let t = 0; t < 1.6; t += 0.2) { A.play("atk"); A.flyTo(A.p.cx, A.p.body.y - 18, e.speed * 1.4); A.melee(26, 30, 0.25, { knock: 0 }); yield 0.2; }
        A.play("rec");
        e.body.vx = -dirTo(A) * 120, e.body.vy = -80;
        yield 0.5;
        cool(e, "gnaw", 1.4, 2);
        continue;
      }
      A.play("move");
      A.flyTo(A.p.cx, A.p.body.y - 18, e.speed);
      yield 0;
    }
  },
});

// ════ 모래시계 정령 ════ 기울어 플레이어 발밑에 시간이 느려지는 모래 웅덩이를 만든다(느려짐) · 모래알 세 발 ·
//   체력이 바닥나면 한 번 모래를 거꾸로 돌려 체력을 되돌린다
register("dm_glass", {
  ...X.pxHourglass, speed: 44, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "slow", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 10, speed: 20 });
        continue;
      }
      if (!M.rew && e.hp < e.maxHp * 0.35) {
        M.rew = 1;
        A.stop(1), A.play("wind");
        A.sound("magic", 0.6);
        for (let k = 0; k < 4; k++) (e.host.fx.anim("ring", e.cx, e.cy, { scale: 2 - k * 0.4, tint: TURQC }), yield 0.2);
        e.hp = Math.round(e.maxHp * 0.75);
        glowOn(e, TURQC, 4);
        continue;
      }
      if (ready(e, "slow") && Math.abs(A.dx) < 240) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        A.sound("magic", 0.4);
        const x = A.p.cx;
        A.zone(x, groundY(e, x), 64, 3.2, 0.02, { el: "arcane", st: CHILL(0.55, 1.2), kind: "slime" });
        for (let k = 0; k < 10; k++) e.host.fx.burst("glow", x + (Math.random() - 0.5) * 60, groundY(e, x) - Math.random() * 20, 1, k % 2 ? TURQC : SANDC);
        yield A.once("rec");
        cool(e, "slow", 4, 5);
        continue;
      }
      if (ready(e, "grain") && Math.abs(A.dx) < 260) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.2, speed: 170, mult: 0.55, el: "earth", ox: 0, oy: 0, tele: 0.4, sound: "magic", scale: 0.7 });
        cool(e, "grain", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 60 });
    }
  },
});

// ════ [정예] 사암 스핑크스 ════ 덮치는 도약 · 앞발 휘두르기 · 눈에서 청록 빛줄기(예고된 줄) · 포효로 가까운 적을 굳힌다 ·
//   체력 절반부터 모래 속 뿔 독사를 깨운다
register("dm_sphinx", {
  ...X.pxSphinx, speed: 54, sight: 300, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "beam", 2, 3), cool(e, "pounce", 1.5, 2.5), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "beam", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "dm_viper", n: 2, max: 3, dx: 50, anim: "wind", col: TURQC });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "roar") && near(A, 70, 50)) {
        A.face(), A.stop(1);
        A.tele(0.45);
        yield A.once("wind");
        A.once("beam");
        A.sound("bossRoar", 0.5), A.shake(2);
        e.host.fx.anim("ring", e.cx, e.cy, { scale: 3, tint: TURQC });
        near(A, 90, 60) && e.hit(0.6, !1, "arcane", STUN(0.6), 1.4);
        yield 0.5;
        cool(e, "roar", 5, 7);
        continue;
      }
      if (ready(e, "beam") && Math.abs(A.dx) > 60 && Math.abs(A.dx) < 300 && Math.abs(A.dy) < 50) {
        A.face(), A.stop(1);
        const y = e.body.y - 50;
        A.tele(0.8, { bar: [e.cx + e.facing * 150, 260] });
        yield A.once("wind");
        A.once("beam");
        A.sound("magic", 0.7);
        for (let t = 0; t < 0.5; t += 0.1) {
          for (let k = 0; k < 6; k++) e.host.fx.burst("glow", e.cx + e.facing * (40 + k * 40), y + k * 7, 1, TURQC);
          e.playerInRect(e.cx + (e.facing > 0 ? 30 : -270), y - 10, 240, 50) && e.hit(0.5, !1, "arcane", void 0, 0.4);
          yield 0.1;
        }
        yield A.once("rec");
        cool(e, "beam", 4, 5.5);
        continue;
      }
      if (ready(e, "pounce") && A.ground && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 220) {
        A.face(), A.stop(1);
        A.tele(0.55);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(320, Math.abs(A.dx) * 2), 320);
        for (let t = 0; t < 1; t += DT) { if (A.melee(34, 30, 1.5, { knock: 1.6 })) break; if (t > 0.2 && A.ground) break; yield 0; }
        yield* land(e, A);
        A.shake(2), dust(e, e.cx, e.body.y, 12);
        cool(e, "pounce", 3, 4);
        continue;
      }
      if (near(A, 70, 40) && ready(e, "claw")) {
        yield* melee(e, A, { tele: 0.45, dash: 120, fw: 48, fh: 34, mult: 1.4, knock: 1.4, st: BLEED(0.1, 2), fx: "heavy", tint: TURQC, sound: "swing" });
        cool(e, "claw", 1.4, 2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 60 });
    }
  },
});

// ════ 신기루 정령 ════ 거리를 두고 작은 태양을 던진다(화상) · 다가오면 아지랑이처럼 흩어져 멀리 다시 나타난다
register("dm_mirage", {
  ...X.pxMirage, speed: 60, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "sun", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 24 });
        continue;
      }
      if (near(A, 70, 60) && ready(e, "blink")) {
        A.stop(1);
        A.play("blink");
        A.sound("magic", 0.3);
        for (let t = 0; t < 0.45; t += DT) { e.body.vx = -dirTo(A) * 420, e.body.vy = -60; yield 0; }
        A.stop(1);
        cool(e, "blink", 3, 4);
        continue;
      }
      if (ready(e, "sun") && Math.abs(A.dx) < 300) {
        yield* shoot(e, A, { sprite: "p_fire", n: 1, speed: 200, mult: 0.8, el: "fire", st: BURN(0.12, 2.5), ox: 20, oy: 30, tele: 0.5, sound: "magic", scale: 1 });
        cool(e, "sun", 1.8, 2.6);
        continue;
      }
      yield* approach(e, A, { keep: 160, alt: 50 });
    }
  },
});

// ════ 사막 날치 ════ 모래 바다를 튀어 오르듯 떼로 날다 지느러미를 접고 들이받는다
register("dm_fish", {
  ...X.pxFlyfish, speed: 120, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "ram", 0.8, 1.8);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70, ry: 20, speed: 60 });
        continue;
      }
      if (ready(e, "ram") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.35, v: 400, dur: 0.5, mult: 0.8, fw: 18, fh: 12, knock: 1 });
        cool(e, "ram", 1.4, 2.4);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 70 });
    }
  },
});

// ════ 해시계 원반 ════ 바늘 그림자가 빙빙 돌다 멈추면 플레이어 자리에 햇빛 기둥이 내리꽂힌다(위치 예고 · 화상)
register("dm_disc", {
  ...X.pxSundial, speed: 50, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "ray", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 8, speed: 20 });
        continue;
      }
      if (ready(e, "ray") && Math.abs(A.dx) < 280) {
        A.stop(1);
        const x = A.p.cx;
        A.tele(0.9, { bar: [x, 34] });
        yield A.once("wind");
        A.once("atk");
        A.sound("explosion", 0.35);
        const gy = groundY(e, x);
        for (let k = 0; k < 8; k++) e.host.fx.burst("glow", x + (Math.random() - 0.5) * 20, gy - k * 16, 1, SUNC);
        e.playerInRect(x - 17, gy - 140, 34, 140) && e.hit(1.1, !1, "fire", BURN(0.12, 2), 0.3);
        yield A.once("rec");
        cool(e, "ray", 2.6, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 90 });
    }
  },
});

// ════ [정예] 신기루 진 ════ 언월도 둘로 베며 덮친다 · 불덩이 셋 · 모래 회오리 둘을 일으킨다(닿으면 아프고 느려짐) ·
//   체력 절반부터 신기루 정령을 불러낸다
register("dm_djinn", {
  ...X.pxDjinn, speed: 80, sight: 340, atkMul: 1.7,
  *brain(e, A) {
    cool(e, "fire", 1.5, 2.5), cool(e, "storm", 4, 5), cool(e, "call", 5, 7);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 10, speed: 24 });
        continue;
      }
      yield* notice(e, A, { anim: "storm", sound: "bossRoar", vol: 0.35 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "dm_mirage", n: 2, max: 2, dx: 50, dy: 20, anim: "cast", col: SUNC });
        cool(e, "call", 12, 15);
        continue;
      }
      if (ready(e, "storm") && Math.abs(A.dx) < 280) {
        A.stop(1);
        const xs = [A.p.cx - 50, A.p.cx + 50];
        for (const x of xs) A.tele(0.8, { bar: [x, 50] });
        yield A.once("storm");
        A.sound("swing", 0.8), A.shake(1.5);
        for (const x of xs) {
          const gy = groundY(e, x);
          A.zone(x, gy, 50, 3, 0.07, { el: "wind", st: CHILL(0.35, 1), kind: "slime" });
          for (let k = 0; k < 10; k++) e.host.fx.burst("dust", x + (Math.random() - 0.5) * 40, gy - k * 8, 1, SANDC);
        }
        cool(e, "storm", 6, 8);
        continue;
      }
      if (ready(e, "slash") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { wind: "wind", atk: "atk", tele: 0.55, v: 380, dur: 0.55, mult: 1.4, st: BLEED(0.12, 2.5), fw: 46, fh: 40, knock: 1.6 });
        cool(e, "slash", 2, 2.8);
        continue;
      }
      if (ready(e, "fire") && Math.abs(A.dx) < 320) {
        A.face(), A.stop(1);
        A.tele(0.45);
        yield A.once("cast");
        A.sound("magic", 0.6);
        for (let k = 0; k < 3; k++) { A.shoot({ sprite: "p_fire", speed: 220, gravity: 0, life: 2, radius: 6 }, e.cx + e.facing * 30, e.cy - 8, Math.atan2(A.p.body.y - 12 - (e.cy - 8), A.p.cx - e.cx) + (k - 1) * 0.18, 0.7, { el: "fire", st: BURN(0.12, 2.5), opts: { scale: 1.1 } }); yield 0.12; }
        cool(e, "fire", 2.4, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 70 });
    }
  },
});
