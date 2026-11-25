// ══════════════════════════════════════════════════════════════
// 검은 늪지 (gm2_0, 노랑 · 보스) — 지표(natbp 손 설계: 검은 웅덩이 · 큰 늪 · 쓰러진 고목 다리 · 보스 늪) 위아래를 손으로
//   하늘: 까마귀 첨탑 — 늪에서 비스듬히 솟은 죽은 고목 넷(기울기·높이 제각각), 꼭대기 둥지, 고목끼리 썩은 판자 다리 · ▲ = 가장 높은 고목 둥지
//   땅속: 진흙 속 가라앉은 마을 — 진흙 층 셋에 기울어 묻힌 집들 · 거머리 굴 · 두꺼비 알 웅덩이 · 맨 아래 진흙 샘(▼)
//   보스 방(지표 동쪽 끝 x 896~)은 지표 설계가 평평하게 비운다
// ══════════════════════════════════════════════════════════════

import { PL, jag, nat, dropTo, skyBegin, skyEnd } from "./archi_sky.js";
const P = (K, x, f, k, o) => K.prop(x, f, k, o);
function shaft(K, x, fu, fd, k = "ladder", m = null) {
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}

export function blackmarsh(K, o) {
  if (o.stage === "under") return under(K, o);
  skyBegin(K);
  sky(K, o);
  skyEnd(K);
}

// ═══ 하늘: 까마귀 첨탑 (기운 죽은 고목) ═══
function sky(K, o) {
  const S = o.surfRow;
  // [밑동 x, 꼭대기 x, 꼭대기 y, 굵기]
  const T = [[150, 190, 330, 6], [420, 380, 250, 7], [620, 680, 180, 8], [800, 770, 300, 6]];
  const tops = [];
  for (const [bx, tx, ty, w] of T) {
    const s = S(bx);
    for (let y = ty; y < s + 10; y++) {
      const u = (y - ty) / (s - ty), x = Math.round(tx + (bx - tx) * u), ww = Math.round(w * (0.6 + 0.4 * u) + (y > s - 20 ? (y - s + 20) * 0.4 : 0));
      K.rock(x - ww, y, x + ww, y + 1), K.mat(x - ww, y, x + ww, y + 1, "wood");
    }
    // 밑동 굴 (지나간다)
    K.air(bx - w - 8, s - 12, bx + w + 8, s), K.wall(bx - w, s - 12, bx + w, s, "wood");
    // 둥지 판 (꼭대기)
    K.rock(tx - 16, ty, tx + 16, ty + 3), K.mat(tx - 16, ty, tx + 16, ty + 3, "leaf");
    P(K, tx - 6, ty, "p_nest"), P(K, tx + 8, ty, "p_bones", { s: 1 });
    // 줄기를 감은 덩굴 (밑동 → 둥지): 기운 쪽 반대편에 매달린 밧줄 사다리 마디
    const side = tx > bx ? -1 : 1;
    for (let k = 0, y = s; y > ty + 4; k++) {
      const yy = Math.max(ty + 3, y - 60), u = (yy - ty) / (s - ty), x = Math.round(tx + (bx - tx) * u) + side * (w + 6);
      K.rock(x - 6, yy, x + 6, yy + 2), K.mat(x - 6, yy, x + 6, yy + 2, "wood");
      K.rope(x, yy - 3, y);
      y = yy;
    }
    tops.push([tx, ty]);
    K.tag(tx - 14, ty - 14, tx + 14, ty, "treasure");
  }
  // 늪 가스에 떠오른 진흙 덩이 (밑에 늘어진 이끼, 땅까지 밧줄)
  for (const [a, b, t, d, s] of [[60, 120, 420, 26, 3], [250, 320, 360, 30, 5], [480, 540, 300, 24, 7], [520, 590, 470, 28, 9], [860, 930, 400, 26, 11], [300, 360, 520, 22, 13], [720, 760, 520, 20, 15]]) {
    nat(K, a, b, () => t, jag(PL([[a, t + 4], [(a + b) >> 1, t + d], [b, t + 4]]), 1.8, s), { fingers: 2 });
    K.mat(a, t, b, t + 3, "leaf");
    P(K, (a + b) >> 1, t, ["p_shroom", "p_nest", "p_bones", "p_fern"][s % 4], { s: s % 3 });
    K.tag(a + 4, t - 14, b - 4, t, s % 3 ? "arena" : "treasure");
    for (let x = a + 6; x < b - 4; x += 14) K.vine(x, x + 2, t + 6, t + d + 10);
    dropTo(K, b - 8, t, "rope");
  }
  K.peak(680, 180);
  K.tag(666, 166, 694, 180, "rest", { safe: 1 });
  // 높은 둥지끼리 짚라인 (높은 쪽 → 낮은 쪽 둥지 판)
  K.zip(668, 176, 394, 246), K.zip(692, 176, 786, 296), K.zip(368, 246, 200, 326);
  K.struct("까마귀 첨탑", "▲ 위로·보물", 100, 170, 830, 640);
}

// ═══ 땅속: 진흙 속 가라앉은 마을 ═══
function under(K, o) {
  const S = o.surfRow;
  // 진흙 층 셋 (긴 굴, 바닥이 물결)
  const L = [[60, 860, 700, 18], [100, 880, 800, 20], [60, 840, 900, 18]];
  for (const [a, b, f, h] of L) {
    K.air(a, f - h, b, f);
    for (let x = a; x < b; x++) { const v = Math.round(Math.sin(x * 0.04 + f) * 2); v > 0 ? K.air(x, f - h - v, x + 1, f - h) : K.rock(x, f, x + 1, f - v); }
  }
  // 층 사이 (위아래 어긋난 자리마다 사다리·밧줄)
  for (const [x, a, b, k] of [[200, 700, 800, "ladder"], [520, 700, 800, "rope"], [780, 700, 800, "ladder"], [140, 800, 900, "rope"], [460, 800, 900, "ladder"], [820, 800, 900, "ladder"]]) shaft(K, x, a, b, k);
  // 지표에서 내려오는 구멍 둘 (검은 웅덩이 옆 · 언덕)
  for (const x of [100, 640]) { const s = S(x); K.air(x - 3, s - 2, x + 3, s), shaft(K, x, s, 700, "vine"); }
  // 층 사이 방 (크기·높이 제각각) + 잇는 사다리
  for (const [a, b, f, h, x1, x2, role] of [[340, 420, 760, 16, 380, 410, "treasure"], [660, 740, 752, 14, 700, 730, "arena"], [520, 600, 860, 16, 540, 590, "arena"], [160, 230, 850, 14, 170, 220, "treasure"]]) {
    K.hall(a, b, f, h), K.wall(a, f - h, b, f, "wood");
    shaft(K, x1, f - 60 > 0 ? (f < 800 ? 700 : 800) : 700, f), shaft(K, x2, f, f < 800 ? 800 : 900);
    P(K, (a + b) >> 1, f, role === "treasure" ? "p_urn" : "p_hive"), K.tag(a + 2, f - h, b - 2, f, role);
  }
  // 층을 꿰뚫은 고목 뿌리 기둥 (밑동에 지나가는 아치)
  for (const x of [110, 300, 560, 840]) {
    K.mat(x - 5, 660, x + 5, 910, "wood");
    for (const f of [700, 800, 900]) K.air(x - 5, f - 14, x + 5, f);
  }
  // 기울어 묻힌 집들 (층마다 다르게)
  const H = [[260, 340, 700, "rest"], [600, 680, 700, "treasure"], [320, 400, 800, "arena"], [700, 780, 800, "treasure"], [240, 320, 900, "arena"], [620, 700, 900, "rest"]];
  H.forEach(([a, b, f, role], i) => {
    for (let y = 0; y < 14; y++) K.wall(a + Math.round(y * (i % 2 ? 0.3 : -0.3)), f - 14 + y, b + Math.round(y * (i % 2 ? 0.3 : -0.3)), f - 13 + y, "wood");
    K.rock(a - 2, f - 17, b + 2, f - 15), K.mat(a - 2, f - 17, b + 2, f - 15, "wood");
    P(K, a + 14, f, ["p_crates", "p_shelf", "p_urn", "p_lamp", "p_cage", "p_bones"][i]), P(K, b - 12, f, "p_shroom", { s: i % 3 });
    K.tag(a, f - 14, b, f, role);
  });
  // 두꺼비 알 웅덩이 · 거머리 굴
  for (const [a, b, f] of [[420, 520, 700], [520, 620, 800], [380, 460, 900]]) (K.air(a, f, b, f + 6), K.water(a, f, b, f + 6), P(K, (a + b) >> 1, f, "p_hive"));
  K.ramp(856, 700, 898, 740, 9);
  K.hall(896, 948, 740, 12), P(K, 924, 740, "p_skulls"), K.tag(900, 728, 944, 740, "treasure");
  K.heal(640, 650, 896, 900);
  // 맨 아래 진흙 샘 (▼)
  K.ell(460, 980, 200, 50), K.rock(250, 1000, 680, 1034), K.air(270, 960, 650, 1000);
  K.water(272, 984, 648, 1000);
  K.rock(420, 976, 500, 1000), K.deep(460, 976);
  for (const [a, b] of [[300, 340], [560, 600]]) K.plank(a, b, 982);
  P(K, 440, 976, "p_roots"), P(K, 480, 976, "p_shroom", { s: 2 }), K.tag(430, 962, 490, 976, "rest", { safe: 1 });
  shaft(K, 300, 900, 982), shaft(K, 600, 900, 982);
  K.tag(270, 966, 400, 982, "arena"), K.tag(520, 966, 650, 982, "arena");
  K.struct("진흙 속 가라앉은 마을", "▼ 아래로·보물", 60, 660, 940, 1020);
}
