// 5지역 보스 「불꽃 장군 이그나르」 — 화로를 차지하려던 군대의 장군. 불에 삼켜진 뒤에도 요새를 지휘한다.
// 1단계: 글레이브 연격 · 군기 꽂기(불의 고리 + 병사) · 화염 돌진   2단계: 포격 지원 · 용암 해자 · 화염 창 투척
import { frameOf } from "./core.js";

const FIRE = 0xff7a20, HOT = 0xffb060;
const F = (nm, k = 0) => frameOf("frb4", nm, k);
const BURN = (p = 0.3, d = 3) => ({ type: "burn", chance: 1, dur: d, power: p });

function boom(b, x, y, r, mult) {
  const fx = b.host.fx;
  fx.anim("explode", x, y - 10, { scale: r / 26, tint: 0xffa040 });
  fx.burst("chunk", x, y - 4, 8, 0x5a3a2a);
  fx.shake(4);
  b.hitCircle(x, y - 10, r, mult, "fire", BURN());
}

export async function bossRun4(b, name, R) {
  const host = b.host, fx = host.fx, Rb = b.body, p = b.pl(), P2 = b.phase === 2, j = R.j;
  b.faceP();
  const map = { artillery: "glaiveCombo", lavaMoat: "bannerPlant", spearThrow: "flameDash" };
  !P2 && map[name] && (name = map[name]);
  if (P2 && !b._p2) ((b._p2 = 1), (name = "lavaMoat"));
  switch (name) {
    case "glaiveCombo": {
      // 다가와서 글레이브를 뒤로 크게 젖혔다가 → 베기 · 올려베기 · 회전베기
      if (Math.abs(p.cx - b.cx) > 80) await b.walkTo(b.clampX(p.cx - b.facing * 60), 140, 1.4);
      b.faceP();
      b.frame(F("wind"));
      b.warnBar(b.cx + b.facing * 50, 110, 0.55);
      j.play("warn", 0.5);
      await b.wait(0.55);
      b.frame(F("cut1"));
      Rb.vx = b.facing * 160;
      j.play("swingHeavy", 0.9);
      fx.anim("fx_slash", b.cx + b.facing * 44, Rb.y - 40, { flip: b.facing < 0, scale: 1.8, tint: HOT });
      b.hitRect(b.facing > 0 ? b.cx : b.cx - 100, Rb.y - 70, 100, 70, 1.2, "fire", BURN());
      await b.wait(0.22);
      Rb.vx = 0;
      b.frame(F("cut2"));
      j.play("swing", 1);
      fx.anim("fx_slash", b.cx + b.facing * 40, Rb.y - 60, { flip: b.facing < 0, scale: 1.8, tint: HOT });
      b.hitRect(b.facing > 0 ? b.cx : b.cx - 96, Rb.y - 100, 96, 100, 1.1, "fire", BURN());
      await b.wait(0.3);
      // 회전베기: 몸을 웅크렸다 돈다
      b.frame(F("wind"));
      b.warnCircle(b.cx, Rb.y - 30, 90, 0.4);
      await b.wait(0.4);
      for (let i = 0; i < 6; i++) {
        b.frame(F("spin", i % 2));
        i % 2 || j.play("swingHeavy", 0.8);
        fx.burst("glow", b.cx + (Math.random() - 0.5) * 120, Rb.y - Math.random() * 60, 2, FIRE);
        i === 2 && b.hitCircle(b.cx, Rb.y - 30, 90, 1.4, "fire", BURN());
        await b.wait(0.07);
      }
      P2 && (b.wave(-1, 0.9, 280, FIRE), b.wave(1, 0.9, 280, FIRE));
      b.frame(F("idle"));
      await b.wait(0.8);
      break;
    }
    case "bannerPlant": {
      // 군기를 높이 들어 땅에 꽂는다 → 주위로 불의 고리 + 화염 보병 소환
      b.frame(F("roar"));
      j.play("bossRoar", 0.7);
      await b.wait(0.4);
      b.frame(F("plant"));
      b.warnCircle(b.cx, b.groundY - 10, 120, 0.8);
      await b.wait(0.8);
      fx.shake(8);
      j.play("thud", 1.6);
      fx.anim("ring", b.cx, b.groundY - 16, { scale: 4.5, tint: 0xff5030 });
      fx.anim("fx_smash", b.cx, b.groundY - 14, { scale: 2.6, tint: HOT });
      b.hitCircle(b.cx, b.groundY - 10, 120, 1.5, "fire", BURN());
      for (const d of [-1, 1]) {
        host._foeZones = host._foeZones ?? [];
        host._foeZones.push({ x: b.cx + d * 90, y: b.groundY, w: 50, t: 3, mult: 0.25, el: "fire", st: BURN(0.2, 2), atk: b.atk, cd: 0, kind: "fire", fxT: 0 });
      }
      await b.wait(0.4);
      await b.summon("fr4_0", P2 ? 3 : 2, 4);
      b.frame(F("idle"));
      await b.wait(0.8);
      break;
    }
    case "flameDash": {
      // 글레이브를 앞으로 겨누고 → 아레나를 가로지르는 돌진, 지나간 자리에 불길
      for (let r = 0; r < (P2 ? 2 : 1); r++) {
        b.faceP();
        const tx = b.facing > 0 ? b.arenaR - 40 : b.arenaL + 40;
        b.frame(F("wind"));
        b.warnBar((b.cx + tx) / 2, Math.abs(tx - b.cx) + 40, 0.7);
        j.play("warn", 0.6);
        await b.wait(0.7);
        j.play("dash", 1.2);
        const x0 = b.cx;
        let hit = !1, t = 0;
        while (Math.abs(tx - b.cx) > 14 && t < 1.2 && !b.dead) {
          b.frame(F("dash", Math.floor(t * 20) % 2));
          Rb.vx = b.facing * 620;
          fx.burst("glow", b.cx - b.facing * 20, Rb.y - 20, 2, FIRE);
          !hit && (hit = b.hitRect(b.cx - 30, Rb.y - 70, 60, 70, 1.5, "fire", BURN()));
          await b.wait(0.03);
          t += 0.03;
        }
        Rb.vx = 0;
        fx.shake(4);
        for (let x = Math.min(x0, b.cx); x < Math.max(x0, b.cx); x += 60) {
          host._foeZones = host._foeZones ?? [];
          host._foeZones.push({ x, y: b.groundY, w: 56, t: 2.2, mult: 0.2, el: "fire", st: BURN(0.2, 2), atk: b.atk, cd: 0, kind: "fire", fxT: 0 });
        }
        b.frame(F("stagger"));
        await b.wait(0.7);
      }
      b.frame(F("idle"));
      await b.wait(0.4);
      break;
    }
    case "artillery": {
      // 포격 지원: 성벽의 포병에게 신호 → 플레이어 주변에 포탄이 차례로 떨어진다
      b.frame(F("cast"));
      j.play("bossRoar", 0.8);
      await b.wait(0.4);
      for (let i = 0; i < 7 && !b.dead; i++) {
        const x = b.clampX(i % 2 ? p.cx : p.cx + (Math.random() - 0.5) * 220, 30);
        b.warnCircle(x, b.groundY - 10, 54, 0.9);
        host.time.delayedCall(900 / b.speedMul, () => !b.dead && boom(b, x, b.groundY, 54, 1.2));
        await b.wait(0.28);
      }
      b.frame(F("idle"));
      await b.wait(1.2);
      break;
    }
    case "lavaMoat": {
      // 용암 해자: 글레이브로 바닥을 갈라 아레나 바닥이 용암으로 차오른다. 안전한 곳은 두 군데뿐
      b.frame(F("roar"));
      j.play("bossRoar", 1);
      host.cameras.main.flash(200, 255, 120, 40);
      await b.wait(0.5);
      b.frame(F("plant"));
      fx.shake(10);
      j.play("thud", 1.8);
      const L = b.arenaL + 20, W = b.arenaR - b.arenaL - 40;
      const safe = [L + W * (0.15 + Math.random() * 0.25), L + W * (0.6 + Math.random() * 0.25)];
      for (let x = L; x < L + W; x += 40) b.warnBar(x + 20, 36, 1.2);
      for (const s of safe) fx.anim("ring", s, b.groundY - 10, { scale: 1.6, tint: 0x80d0ff });
      await b.wait(1.2);
      for (let x = L; x < L + W; x += 40) {
        if (safe.some((s) => Math.abs(s - (x + 20)) < 40)) continue;
        host._foeZones = host._foeZones ?? [];
        host._foeZones.push({ x: x + 20, y: b.groundY, w: 40, t: 4.5, mult: 0.45, el: "fire", st: BURN(0.35, 3), atk: b.atk, cd: 0, kind: "fire", fxT: 0 });
      }
      j.play("explosion", 1.2);
      await b.wait(4.5);
      b.frame(F("idle"));
      await b.wait(0.4);
      break;
    }
    case "spearThrow": {
      // 화염 창 투척: 몸을 뒤로 젖혀 겨누고 → 직선으로 꿰뚫는 창, 꽂힌 자리 폭발
      for (let r = 0; r < 2; r++) {
        b.faceP();
        b.frame(F("throw"));
        const ox = b.cx + b.facing * 20, oy = Rb.y - 60, ang = Math.atan2(p.cy - oy, p.cx - ox);
        j.play("warn", 0.6);
        await b.wait(0.6);
        j.play("swingHeavy", 1.1);
        b.shoot({ sprite: "p_ballista", speed: 620, life: 1.2, radius: 8, aoe: 40 }, ox, oy, ang, 1.6, "fire", BURN(0.35, 3), { tint: HOT, scale: 1.6 });
        b.frame(F("cut2"));
        await b.wait(0.7);
      }
      b.frame(F("idle"));
      await b.wait(0.6);
      break;
    }
    default:
      await b.wait(0.5);
  }
}
