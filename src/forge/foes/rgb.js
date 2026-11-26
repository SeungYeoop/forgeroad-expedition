// 글래스블룸 몬스터 12종 행동 (그림은 px_gb.js)
import { register } from "./core.js";
import * as X from "./px_gb.js";
import { DT, POIS, STUN, BLEED, CHILL, groundY, hop, near, dirTo, ready, cool, land, wander, hover, notice, approach, melee, slam, lob, shoot, dive, charge, summon, lurk } from "./bkit.js";

const SHARD = 0xd8c8ff, GLASSC = 0xc8e8f0;

// ════ 수정껍질 달팽이 ════ 느릿느릿. 앞에서 치면 껍질에 숨어 막는다. 가까우면 결정 가시를 앞으로 내지른다
register("gb_snail", {
  ...X.pxSnail, speed: 22, sight: 180, atkMul: 1, heavy: 0.6,
  blocks(e, S) {
    return !!e.fz?.mem.shell && S.dir === -e.facing && !S.pierceShield;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    for (;;) {
      if (!e.aggro) {
        M.shell = 0;
        yield* wander(e, A, { speed: 10, range: 40 });
        continue;
      }
      yield* notice(e, A, { anim: "wind" });
      // 플레이어가 공격하러 바싹 붙으면 숨는다 (잠깐)
      if (near(A, 34, 24) && ready(e, "hide") && Math.random() < 0.4) {
        M.shell = 1, A.stop(1), A.play("hide");
        yield 1 + Math.random() * 0.6;
        M.shell = 0;
        cool(e, "hide", 2.5, 4);
      }
      if (near(A, 44, 22) && ready(e, "spike")) {
        yield* melee(e, A, { tele: 0.45, dash: 60, fw: 30, fh: 20, mult: 1, st: BLEED(0.1, 2), fx: "slash", tint: SHARD, sound: "swing" });
        cool(e, "spike", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 30 });
    }
  },
});

// ════ 정원 자동인형 ════ 전지가위로 두 번 자르고, 멀면 물뿌리개로 미끄러운 물웅덩이를 만든다 (밟으면 느려짐)
register("gb_gardener", {
  ...X.pxGardener, speed: 58, sight: 220, atkMul: 1,
  *brain(e, A) {
    cool(e, "spray", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 20 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "warn" });
      if (near(A, 40, 26) && ready(e, "snip")) {
        yield* melee(e, A, { tele: 0.35, dash: 120, fw: 24, fh: 18, mult: 0.7, st: BLEED(0.08, 2), fx: "slash", tint: 0xe8e8f0, win: 0.32, sound: "swing" });
        cool(e, "snip", 0.8, 1.3);
        continue;
      }
      if (ready(e, "spray") && Math.abs(A.dx) < 160 && Math.abs(A.dx) > 50) {
        A.face(), A.stop(1);
        A.tele(0.4);
        yield A.once("spray");
        const x = e.cx + e.facing * 50;
        A.zone(x, groundY(e, x), 60, 3, 0.04, { el: "ice", st: CHILL(0.35, 1.2), kind: "ice" });
        e.host.fx.burst("drip", e.cx + e.facing * 40, e.body.y - 10, 8, 0xa8d8f0);
        cool(e, "spray", 4, 6);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 34 });
    }
  },
});

// ════ 가시 화분 ════ 움직이지 않는다. 몸을 부풀렸다 수정 가시 세 발을 부채꼴로. 바싹 붙으면 화분 속으로 움츠려 덜 아프다
register("gb_pot", {
  ...X.pxPot, speed: 0, sight: 260, atkMul: 0.9,
  damage(e, dmg) {
    return e.fz?.mem.duck ? dmg * 0.4 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "shot", 0.6, 1.4);
    for (;;) {
      A.stop(1);
      if (!e.aggro) {
        A.play("idle");
        yield 0.1;
        continue;
      }
      if (near(A, 30, 30)) {
        M.duck = 1, A.play("duck");
        yield 0.3;
        continue;
      }
      M.duck = 0;
      if (ready(e, "shot") && Math.abs(A.dx) < 240) {
        yield* shoot(e, A, { sprite: "p_thorn", n: 3, spread: 0.26, speed: 210, mult: 0.6, ox: 2, oy: 26, tele: 0.45, sound: "shoot", st: BLEED(0.06, 2) });
        cool(e, "shot", 1.6, 2.4);
        continue;
      }
      A.face(), A.play("idle");
      yield 0.1;
    }
  },
});

// ════ [정예] 온실 유리 골렘 ════ 두 수정 팔로 내려찍어 유리 파편을 사방에 흩뿌리고, 멀면 수정 덩이를 던진다. 금이 가면 더 사나워진다
register("gb_golem", {
  ...X.pxGolem, speed: 36, sight: 260, atkMul: 1.6, heavy: 1,
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "throw", 2, 3);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 12, range: 50 });
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.25 });
      const rage = e.hp < e.maxHp * 0.5;
      if (near(A, 60, 40) && ready(e, "slam")) {
        yield* slam(e, A, {
          r: 50, mult: 1.4, tele: rage ? 0.45 : 0.6, fwd: 16, shake: 3, chunk: SHARD, tint: GLASSC, dust: 0xc8c0e0,
          *after(x, y) {
            // 파편이 양옆 위로 튄다
            for (let k = 0; k < (rage ? 6 : 4); k++) {
              const a = -Math.PI / 2 + (k - (rage ? 2.5 : 1.5)) * 0.42;
              A.shoot({ sprite: "p_icicle", speed: 0, gravity: 520, life: 2, radius: 4 }, x, y - 10, 0, 0.5, { el: "phys", opts: { vx: Math.cos(a) * 200, vy: Math.sin(a) * 260 - 60, scale: 0.8 } });
            }
          },
        });
        cool(e, "slam", rage ? 1.4 : 2, rage ? 2 : 3);
        continue;
      }
      if (ready(e, "throw") && Math.abs(A.dx) > 80 && Math.abs(A.dx) < 300) {
        yield* lob(e, A, { wind: "throw", atk: "throw", tele: 0.4, sprite: "p_bigrock", mult: 1.1, oy: 46, ox: 10, scale: 1.2, chunkC: SHARD, n: rage ? 2 : 1 });
        cool(e, "throw", 2.5, 3.5);
        continue;
      }
      yield* approach(e, A, { lo: 0, hi: 46 });
    }
  },
});

// ════ 수정 날개 나방 ════ 멀리서 맴돌다 머리 위로 와서 빛가루를 뿌린다 (맞으면 잠깐 굳음). 가루를 뿌리고는 물러난다
register("gb_moth", {
  ...X.pxMoth, speed: 70, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "dust", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 50, ry: 14 });
        continue;
      }
      if (ready(e, "dust") && Math.abs(A.dx) < 40 && A.dy > 20 && A.dy < 90) {
        A.stop(1);
        A.tele(0.4);
        yield A.once("wind");
        A.play("atk");
        A.sound("magic", 0.35);
        for (let t = 0; t < 0.7; t += DT) {
          Math.random() < 0.4 && e.host.fx.burst("glow", e.cx + (Math.random() - 0.5) * 20, e.body.y + 4, 1, 0xe8d8ff);
          e.playerInRect(e.cx - 16, e.body.y, 32, 90) && !e.fz.mem.hitD && ((e.fz.mem.hitD = 1), e.hit(0.5, !1, "arcane", STUN(0.5), 0));
          yield 0;
        }
        e.fz.mem.hitD = 0;
        cool(e, "dust", 2.4, 3.4);
        continue;
      }
      // 플레이어 머리 위로
      A.play("move");
      A.flyTo(A.p.cx + Math.sin(e.life * 1.3) * 16, A.p.body.y - 60, e.speed);
      yield 0;
    }
  },
});

// ════ 유리 벌 ════ 윙윙 맴돌다 침을 앞세워 급강하 (독). 꽃밭 근처에 둘셋씩
register("gb_bee", {
  ...X.pxBee, speed: 120, sight: 260, atkMul: 0.8,
  *brain(e, A) {
    cool(e, "dive", 0.8, 1.6);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 40, ry: 12, speed: 50 });
        continue;
      }
      if (ready(e, "dive") && Math.abs(A.dx) < 200) {
        yield* dive(e, A, { tele: 0.4, v: 360, dur: 0.5, mult: 0.8, st: POIS(0.12, 3), fw: 16, fh: 14 });
        cool(e, "dive", 1.6, 2.4);
        continue;
      }
      yield* approach(e, A, { keep: 90, alt: 70 });
    }
  },
});

// ════ 유리 덩굴 ════ 땅속에 잎만 내놓고 숨어 있다(덜 아프다). 가까이 오면 솟아 길게 채찍질 (넉넉한 사거리)
register("gb_vine", {
  ...X.pxVine, speed: 0, sight: 140, atkMul: 1.1,
  damage(e, dmg) {
    return e.fz?.mem.hidden ? dmg * 0.4 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    M.hidden = 1;
    for (;;) {
      A.stop(1);
      if (M.hidden) {
        A.play("hide");
        if (e.aggro && near(A, 70, 40)) {
          M.hidden = 0;
          A.face();
          e.host.fx.burst("dust", e.cx, e.body.y - 2, 8, 0x8a6a4a);
          yield A.once("rise");
        }
        yield 0.08;
        continue;
      }
      if (!near(A, 120, 60)) {
        // 멀어지면 다시 숨는다
        M.hidden = 1;
        yield 0.3;
        continue;
      }
      if (near(A, 64, 40) && ready(e, "lash")) {
        yield* melee(e, A, { tele: 0.4, fw: 56, fh: 30, mult: 1, knock: 1.1, fx: "slash", fxX: 30, fxY: -26, fxS: 0.8, tint: SHARD, sound: "swing", st: BLEED(0.08, 2) });
        cool(e, "lash", 1.1, 1.8);
        continue;
      }
      A.face(), A.play("idle");
      yield 0.1;
    }
  },
});

// ════ [정예] 거대 파리지옥 ════ 뿌리박혀 움직이지 않는다. 앞으로 뻗어 덥석 물고(물리면 잠깐 묶임), 멀면 씨앗을 뱉고, 덩굴 졸개를 부른다
register("gb_flytrap", {
  ...X.pxFlytrap, speed: 0, sight: 280, atkMul: 1.6, heavy: 1,
  *brain(e, A) {
    cool(e, "spit", 1.5, 2.5), cool(e, "call", 6, 8);
    for (;;) {
      A.stop(1);
      if (!e.aggro) {
        A.play("idle");
        yield 0.1;
        continue;
      }
      yield* notice(e, A, { anim: "wind", sound: "bossRoar", vol: 0.25 });
      if (near(A, 80, 50) && ready(e, "bite")) {
        yield* melee(e, A, { tele: 0.55, fw: 60, fh: 36, mult: 1.5, st: STUN(0.7), knock: 0.4, fx: "heavy", fxX: 34, fxY: -36, fxS: 0.9, tint: 0xf0a0a0, sound: "punch", bar: 1 });
        cool(e, "bite", 1.4, 2);
        continue;
      }
      if (ready(e, "call") && e.hp < e.maxHp * 0.7) {
        yield* summon(e, A, { id: "gb_vine", n: 2, max: 2, dx: 40, anim: "spit", col: 0xa0e0a0 });
        cool(e, "call", 10, 13);
        continue;
      }
      if (ready(e, "spit") && Math.abs(A.dx) < 300) {
        yield* lob(e, A, { wind: "spit", atk: "spit", tele: 0.35, sprite: "sl_glob", n: 3, gap: 0.14, spread: 50, mult: 0.7, el: "poison", st: POIS(0.12, 3), ox: 30, oy: 40, scale: 0.9, chunkC: 0xa0c060 });
        cool(e, "spit", 2.2, 3.2);
        continue;
      }
      A.face(), A.play("idle");
      yield 0.1;
    }
  },
});

// ════ 프리즘 정령 ════ 거리를 두고 떠서, 빛을 모았다가 세 갈래 빛살 (마지막 한 발은 플레이어를 정확히 겨눈다)
register("gb_prism", {
  ...X.pxPrism, speed: 50, sight: 300, atkMul: 0.9,
  *brain(e, A) {
    cool(e, "beam", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 24, ry: 8, speed: 24 });
        continue;
      }
      if (ready(e, "beam") && Math.abs(A.dx) < 280) {
        yield* shoot(e, A, { sprite: "p_orb", n: 3, spread: 0.3, speed: 190, mult: 0.6, el: "arcane", ox: 0, oy: 22, tele: 0.55, sound: "magic", scale: 0.85 });
        yield 0.25;
        yield* shoot(e, A, { sprite: "p_orb", n: 1, speed: 260, mult: 0.7, el: "arcane", ox: 0, oy: 22, tele: 0, sound: "magic", scale: 1 });
        cool(e, "beam", 2.4, 3.4);
        continue;
      }
      yield* approach(e, A, { keep: 150, alt: 60 });
    }
  },
});

// ════ 벌새 떼 ════ 아주 빠르다. 둘레를 휙휙 돌다 부리로 연달아 찌르고 빠진다 (출혈)
register("gb_hummer", {
  ...X.pxHummer, speed: 170, sight: 280, atkMul: 0.7,
  *brain(e, A) {
    cool(e, "jab", 0.6, 1.2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 60, ry: 16, speed: 80, f: 1.4 });
        continue;
      }
      if (ready(e, "jab") && Math.abs(A.dx) < 160) {
        for (let k = 0; k < 2; k++) yield* dive(e, A, { tele: k ? 0.15 : 0.3, v: 420, dur: 0.35, mult: 0.55, st: BLEED(0.06, 2), fw: 16, fh: 12 });
        cool(e, "jab", 1.4, 2.2);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 50 });
    }
  },
});

// ════ 파편 정령 ════ 조각을 모아 굳었다가 사방으로 흩어 쏜다 (여덟 방향). 흩어진 동안은 맞아도 덜 아프다
register("gb_shard", {
  ...X.pxShard, speed: 60, sight: 240, atkMul: 0.8,
  damage(e, dmg) {
    return e.fz?.mem.scatter ? dmg * 0.5 : dmg;
  },
  *brain(e, A) {
    const M = e.fz.mem;
    cool(e, "burst", 1, 2);
    for (;;) {
      if (!e.aggro) {
        yield* hover(e, A, { rx: 30, ry: 10, speed: 30 });
        continue;
      }
      if (ready(e, "burst") && near(A, 120, 90)) {
        A.stop(1);
        A.tele(0.5);
        yield A.once("wind");
        A.once("atk");
        M.scatter = 1;
        A.sound("explosion", 0.35);
        for (let k = 0; k < 8; k++) A.shoot({ sprite: "p_icicle", speed: 180, gravity: 0, life: 1.4, radius: 4 }, e.cx, e.cy, (k / 8) * Math.PI * 2, 0.55, { el: "phys", opts: { scale: 0.7 } });
        yield 0.6;
        yield A.once("rec");
        M.scatter = 0;
        cool(e, "burst", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { keep: 70, alt: 50 });
    }
  },
});

// ════ [정예] 수정 공작 ════ 꼬리를 부채처럼 펴서 수정 깃 다섯 발, 날개짓 돌풍으로 밀어내기, 가까우면 부리 연타
register("gb_peacock", {
  ...X.pxPeacock, speed: 70, sight: 280, atkMul: 1.5,
  *brain(e, A) {
    cool(e, "fan", 1.5, 2.5), cool(e, "gust", 4, 6);
    for (;;) {
      if (!e.aggro) {
        yield* wander(e, A, { speed: 22, range: 60 });
        continue;
      }
      yield* notice(e, A, { anim: "fan", sound: "bossRoar", vol: 0.25 });
      if (near(A, 46, 30) && ready(e, "peck")) {
        for (let k = 0; k < 2; k++) yield* melee(e, A, { tele: k ? 0.15 : 0.3, dash: 140, fw: 26, fh: 24, mult: 0.9, fx: "slash", tint: SHARD, sound: "swing", recK: 0.5 });
        cool(e, "peck", 1, 1.6);
        continue;
      }
      if (ready(e, "gust") && near(A, 120, 40)) {
        A.face(), A.stop(1);
        A.tele(0.45, { bar: [e.cx + e.facing * 60, 120] });
        yield A.once("gust");
        A.sound("dash", 0.5);
        for (let t = 0; t < 0.5; t += DT) {
          e.playerInRect(e.cx + (e.facing > 0 ? 0 : -130), e.body.y - 50, 130, 50) && (A.p.body.vx = e.facing * 320);
          Math.random() < 0.3 && A.burst("dust", 20, -20, 1, 0xd8d0f0);
          yield 0;
        }
        cool(e, "gust", 5, 7);
        continue;
      }
      if (ready(e, "fan") && Math.abs(A.dx) < 280) {
        A.face(), A.stop(1);
        A.tele(0.5);
        yield A.once("fan");
        yield* shoot(e, A, { wind: "fan", atk: "fan", sprite: "p_icicle", n: 5, spread: 0.2, speed: 230, mult: 0.6, ox: -10, oy: 44, tele: 0, sound: "shoot", scale: 0.9 });
        cool(e, "fan", 2.2, 3.2);
        continue;
      }
      yield* approach(e, A, { lo: 30, hi: 70 });
    }
  },
});
