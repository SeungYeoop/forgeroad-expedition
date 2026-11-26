// 모스스파이어 몬스터 12종 행동 (그림은 px_ms.js)
import { register } from "./core.js";
import * as X from "./px_ms.js";
import { DT, STUN, BLEED, POIS, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, groundY, glowOn } from "./bkit.js";

const GOLD = 0xffe090, MOSSC = 0x6a9a4a, STONEC = 0x9a9284;

// ════ 이끼 수도승 ════ 지팡이로 내려치고, 다치면 멈춰 기도해 자기와 주변 몬스터 체력을 조금 채운다
register("ms_monk", {
  ...X.pxMonk, speed: 52, sight: 240, atkMul: 1,
  *brain(e, A) {
    cool(e, "pray", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 18 });
        continue;
      }
      yield* notice(e, A, { anim: "wind" });
      if (ready(e, "pray") && e.hp < e.maxHp * 0.6) {
        A.stop(1), A.play("pray");
        A.sound("buff", 0.4);
        for (let t = 0; t < 1.2; t += 0.3) (glowOn(e, GOLD, 4), yield 0.3);
        for (const o of e.host.enemies ?? []) !o.dead && Math.abs(o.cx - e.cx) < 140 && (o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.15));
        cool(e, "pray", 7, 9);
        continue;
      }
      if (near(A, 44, 30) && ready(e, "staff")) {
        yield* melee(e, A, { tele: 0.4, dash: 90, fw: 28, fh: 26, mult: 1, knock: 1, fx: "heavy", tint: GOLD, sound: "punch" });
        cool(e, "staff", 1.1, 1.7);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ 바위 야크 ════ 머리를 숙이고 땅을 긁다 일직선 돌진. 벽에 박으면 어지러움
register("ms_yak", {
  ...X.pxYak, speed: 46, sight: 260, atkMul: 1.2, heavy: 0.7,
  *brain(e, A) {
    cool(e, "charge", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 14, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.2 });
      if (ready(e, "charge") && Math.abs(A.dx) < 260 && Math.abs(A.dy) < 30) {
        yield* charge(e, A, { tele: 0.6, v: 280, dur: 1.1, mult: 1.2, knock: 1.6, dust: 0x8a7a6a });
        cool(e, "charge", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 60, hi: 140 });
    }
  },
});

// ════ 종 껍질 딱정벌레 ════ 종 속에 숨으면 앞뒤 어디서 쳐도 막고 "땡" 울린다 (가까우면 잠깐 굳음). 뿔로 떠받기
register("ms_beetle", {
  ...X.pxBellBeetle, speed: 40, sight: 200, atkMul: 1, heavy: 0.6,
  blocks(e, S) {
    return !!e.fz?.mem.shell && !S.pierceShield;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.shell = 0;
        yield* wander(e, A, { speed: 14, range: 40 });
        continue;
      }
      if (near(A, 40, 26) && ready(e, "shell") && Math.random() < 0.5) {
        M.shell = 1, A.stop(1), A.play("hide");
        yield 0.9;
        A.once("ring");
        A.sound("block", 0.6), A.shake(1);
        e.host.fx.anim("ring", e.cx, e.body.y - 10, { scale: 1.8, tint: GOLD });
        near(A, 60, 40) && e.hit(0.4, !1, "phys", STUN(0.5), 0.6);
        yield 0.4;
        M.shell = 0;
        cool(e, "shell", 3, 4.5);
        continue;
      }
      if (near(A, 44, 24) && ready(e, "horn")) {
        yield* melee(e, A, { tele: 0.35, dash: 140, fw: 26, fh: 18, mult: 1, knock: 1.2, up: 1, fx: "slash", tint: 0xd8c8a0 });
        cool(e, "horn", 1.2, 1.8);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 석상 수도원장 ════ 손바닥 내려찍기(땅울림), 돌 염주를 던지고, 체력 절반부터 이끼 꼬마를 불러낸다
register("ms_abbot", {
  ...X.pxAbbot, speed: 30, sight: 260, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "throw", 2, 3), cool(e, "call", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.25 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.5) {
        yield* summon(e, A, { id: "ms_mossling", n: 2, max: 3, dx: 36, anim: "wind", col: 0xa0e080 });
        cool(e, "call", 8, 11);
        continue;
      }
      if (near(A, 64, 40) && ready(e, "palm")) {
        yield* slam(e, A, { r: 52, mult: 1.5, tele: 0.6, fwd: 22, shake: 3, chunk: STONEC, tint: GOLD, dust: 0xa89a88 });
        cool(e, "palm", 1.8, 2.6);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) > 70 && Math.abs(A.dx) < 280) {
        yield* lob(e, A, { wind: "throw", atk: "throw", tele: 0.4, sprite: "p_rock", n: 3, gap: 0.18, spread: 40, mult: 0.8, oy: 50, ox: 12, scale: 1, chunkC: 0x6a5a4a });
        cool(e, "throw", 2.6, 3.6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 50 });
    }
  },
});

// ════ 산 학 ════ 높이 맴돌다 긴 부리를 앞세워 비스듬히 찔러 내려온다 (출혈)
register("ms_crane", {
  ...X.pxCrane, speed: 110, sight: 280, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "dive", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 70, ry: 14, speed: 50 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 220) {
        yield* dive(e, A, { tele: 0.45, v: 400, dur: 0.55, mult: 0.9, st: BLEED(0.1, 2.5), fw: 22, fh: 12 });
        cool(e, "dive", 1.8, 2.8);
        continue;
      }
      yield* approach(e, A, { keep: 110, alt: 90 });
    }
  },
});

// ════ 기도 깃발 정령 ════ 바람을 타고 휘감겨 와 깃발 줄로 채찍질하고, 바람으로 밀어낸다
register("ms_flag", {
  ...X.pxFlag, speed: 90, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "lash", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, ry: 12, speed: 40 });
        continue;
      }
      if (ready(e, "lash") && near(A, 70, 50)) {
        yield* melee(e, A, { tele: 0.4, dash: 120, fw: 46, fh: 24, mult: 0.8, knock: 1.8, el: "wind", fx: "slash", tint: 0xf0e8d0, sound: "swing" });
        cool(e, "lash", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { keep: 60, alt: 30 });
    }
  },
});

// ════ 이끼 꼬마 ════ 통통 뛰어와 몸통 박치기. 떼로 몰려다닌다
register("ms_mossling", {
  ...X.pxMossling, speed: 60, sight: 200, atkMul: 0.7,
  *brain(e, A) {
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20 });
        continue;
      }
      if (near(A, 60, 30) && ready(e, "bump") && A.ground) {
        A.face(), A.stop(1);
        A.tele(0.3);
        yield A.once("wind");
        A.once("atk");
        hop(e, dirTo(A), Math.min(220, Math.abs(A.dx) * 2.4), 240);
        for (let t = 0; t < 0.6; t += DT) { if (A.melee(16, 16, 0.8, { knock: 1 })) break; if (t > 0.15 && A.ground) break; yield 0; }
        yield* land(e, A);
        cool(e, "bump", 1, 1.6);
        continue;
      }
      // 통통 뛰며 다가간다
      if (A.ground && Math.abs(A.dx) > 40) { A.play("move"); hop(e, dirTo(A), e.speed, 140); yield* land(e, A); yield 0.1; continue; }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ [정예] 종지기 거인 ════ 종망치 내려치기(땅울림) · 등의 종을 쳐 울림 고리 세 겹(가까울수록 아프고 잠깐 굳음) · 망치 휘둘러 밀어내기
register("ms_bellguard", {
  ...X.pxBellguard, speed: 38, sight: 280, atkMul: 1.7, heavy: 1,
  *brain(e, A) {
    cool(e, "ring", 3, 4);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "ring", sound: "block", vol: 0.6 });
      if (ready(e, "ring") && near(A, 160, 80)) {
        A.face(), A.stop(1);
        A.tele(0.6);
        yield A.once("ring");
        for (let k = 0; k < 3; k++) {
          A.sound("block", 0.7), A.shake(1.5);
          const r = 50 + k * 34;
          e.host.fx.anim("ring", e.cx - e.facing * 18, e.body.y - 40, { scale: r / 22, tint: GOLD });
          const d = Math.hypot(A.dx, A.dy);
          d < r && d > r - 40 && e.hit(0.6, !1, "phys", k === 0 ? STUN(0.5) : void 0, 0.8);
          yield 0.25;
        }
        cool(e, "ring", 5, 7);
        continue;
      }
      if (near(A, 80, 40) && ready(e, "smash")) {
        yield* slam(e, A, { r: 50, mult: 1.6, tele: 0.6, fwd: 34, shake: 3, chunk: 0x8a6038, tint: GOLD, dust: 0xa89a88 });
        cool(e, "smash", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 60 });
    }
  },
});

// ════ 산수리 ════ 높이서 발톱을 세우고 내리꽂는다. 붙잡히면 잠깐 묶임
register("ms_eagle", {
  ...X.pxEagle, speed: 130, sight: 320, atkMul: 1,
  *brain(e, A) {
    cool(e, "dive", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 80, ry: 16, speed: 60 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 240) {
        yield* dive(e, A, { tele: 0.5, v: 440, dur: 0.6, mult: 1, st: STUN(0.4), fw: 22, fh: 16 });
        cool(e, "dive", 2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 130, alt: 110 });
    }
  },
});

// ════ 연 정령 ════ 바람에 휙 기울며 날카로운 모서리로 베고 지나간다 (왕복)
register("ms_kite", {
  ...X.pxKite, speed: 120, sight: 280, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "cut", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60, ry: 20, speed: 50 });
        continue;
      }
      if (ready(e, "cut") && Math.abs(A.dx) < 200) {
        for (let k = 0; k < 2; k++) yield* dive(e, A, { tele: k ? 0.2 : 0.4, v: 360, dur: 0.5, mult: 0.7, st: BLEED(0.08, 2), fw: 20, fh: 20 });
        cool(e, "cut", 2, 3);
        continue;
      }
      yield* approach(e, A, { keep: 100, alt: 70 });
    }
  },
});

// ════ 경전 두루마리 ════ 펼쳐서 빛나는 글자 다섯을 부채꼴로 쏜다 (마법)
register("ms_scroll", {
  ...X.pxScroll, speed: 50, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "read", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 8, speed: 24 });
        continue;
      }
      if (ready(e, "read") && Math.abs(A.dx) < 280) {
        yield* shoot(e, A, { sprite: "p_orb", n: 5, spread: 0.18, speed: 180, mult: 0.55, el: "arcane", ox: 0, oy: 18, tele: 0.55, sound: "magic", scale: 0.75 });
        cool(e, "read", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 60 });
    }
  },
});

// ════ [정예] 구름 현자 ════ 부채로 번개 세 줄기를 땅에 떨어뜨리고(위치 예고), 염주 알을 쏘며, 산수리를 불러낸다
register("ms_sage", {
  ...X.pxSage, speed: 60, sight: 320, atkMul: 1.6,
  *brain(e, A) {
    cool(e, "bolt", 1.5, 2.5), cool(e, "beads", 3, 4), cool(e, "call", 6, 8);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 8, speed: 20 });
        continue;
      }
      yield* notice(e, A, { anim: "call", sound: "magic", vol: 0.5 });
      if (ready(e, "call") && e.hp < e.maxHp * 0.6) {
        yield* summon(e, A, { id: "ms_eagle", n: 1, max: 2, dx: 50, dy: 20, anim: "call", col: 0xc8e8ff });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "bolt") && Math.abs(A.dx) < 300) {
        A.stop(1);
        const xs = [A.p.cx - 50, A.p.cx, A.p.cx + 50];
        for (const x of xs) A.tele(0.7, { bar: [x, 30] });
        yield A.once("wind");
        A.once("atk");
        A.sound("explosion", 0.4), A.shake(1.5);
        for (const x of xs) {
          const gy = groundY(e, x);
          e.host.fx.burst("glow", x, gy - 30, 10, 0xc8e8ff);
          e.playerInRect(x - 14, gy - 120, 28, 120) && e.hit(1.1, !1, "lightning", STUN(0.4), 0.3);
        }
        yield A.once("rec");
        cool(e, "bolt", 2.6, 3.6);
        continue;
      }
      if (ready(e, "beads") && Math.abs(A.dx) < 260) {
        for (let k = 0; k < 6; k++) A.shoot({ sprite: "p_orb", speed: 160, gravity: 0, life: 2.2, radius: 5 }, e.cx, e.cy, Math.atan2(A.p.body.y - 10 - e.cy, A.p.cx - e.cx) + (k - 2.5) * 0.22, 0.55, { el: "arcane", opts: { scale: 0.9 } });
        A.sound("magic", 0.4);
        yield 0.6;
        cool(e, "beads", 3, 4);
        continue;
      }
      yield* approach(e, A, { keep: 140, alt: 80 });
    }
  },
});
