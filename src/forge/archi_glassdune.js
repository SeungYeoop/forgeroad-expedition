// ══════════════════════════════════════════════════════════════
// 유리 모래톱 (g2_0, 노랑 · 보스) — 지표(natbp 손 설계: 모래 언덕 · 유리 웅덩이 · 고원 · 보스 모래밭) 위아래를 손으로
//   하늘: 유리 첨탑 숲 — 모래에서 솟은 기울어진 유리 바늘 다섯, 바늘마다 결정 턱(높이 제각각), 꼭대기끼리 짚라인 · ▲ = 가장 높은 바늘
//   땅속: 모래 벌레 굴 — 굵고 둥근 벌레 굴이 고리처럼 감기고, 굴 사이 알 방 · 묻힌 유리 신전(3칸 방) · 개미귀신 구덩이 · 맨 아래 모래 샘(▼)
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

export function glassdune(K, o) {
  if (o.stage === "under") return under(K, o);
  skyBegin(K);
  sky(K, o);
  skyEnd(K);
}

function sky(K, o) {
  const S = o.surfRow;
  // [밑동 x, 꼭대기 x, 꼭대기 y, 굵기]
  const T = [[130, 110, 360, 5], [300, 340, 240, 6], [500, 470, 160, 7], [650, 690, 280, 5], [820, 800, 340, 6]];
  for (const [bx, tx, ty, w] of T) {
    const s = S(bx);
    // 모래 위에 떠 있는 바늘: 가운데가 가장 굵고 위아래로 뾰족 (밑 끝은 땅에서 40칸 위)
    const bot = s - 40;
    for (let y = ty; y < bot; y++) {
      const u = (y - ty) / (s - ty), x = Math.round(tx + (bx - tx) * u), v = (y - ty) / (bot - ty);
      const ww = Math.max(0, Math.round(w * Math.min(1, v * 1.6) * Math.min(1, (1 - v) * 4) + 0.6));
      K.rock(x - ww, y, x + ww + 1, y + 1), K.mat(x - ww, y, x + ww + 1, y + 1, "brick");
    }
    // 결정 턱: 바늘 옆으로 번갈아, 밧줄로 잇는다
    // 바늘이 기운 반대쪽에 턱을 쌓는다 (턱 위에서 위 턱으로 밧줄)
    const side = tx < bx ? 1 : -1;
    let prev = null, lx = 0;
    for (let y = s - 50; y > ty + 10; y -= 46 + ((bx + y) % 13)) {
      const u = (y - ty) / (s - ty), x = Math.round(tx + (bx - tx) * u) + side * (Math.round(w * u) + 9);
      K.rock(x - 7, y, x + 7, y + 2), K.mat(x - 7, y, x + 7, y + 2, "brick");
      K.rope(x, y - 3, prev ?? S(x));
      P(K, x + side * 3, y, "p_crystal", { s: (y >> 3) % 3 });
      prev = y, lx = x;
    }
    // 꼭대기 판 (마지막 턱에서 밧줄)
    K.rock(tx - 14, ty, tx + 14, ty + 2), K.mat(tx - 14, ty, tx + 14, ty + 2, "brick");
    K.rope(lx, ty - 3, prev);
    P(K, tx, ty, "p_crystal", { s: 2 }), K.tag(tx - 10, ty - 14, tx + 10, ty, "treasure");
  }
  K.peak(470, 160);
  K.tag(460, 146, 480, 160, "rest", { safe: 1 });
  K.zip(462, 156, 346, 236), K.zip(478, 156, 682, 276), K.zip(690, 276, 806, 336), K.zip(334, 236, 118, 356);
  K.struct("유리 첨탑 숲", "▲ 위로·보물", 90, 150, 850, 640);
}

function under(K, o) {
  const S = o.surfRow;
  // 모래 벌레 굴: 굵고 둥근 굴 두 고리 (기울기 1 이하)
  K.wiggle([[80, 700], [200, 760], [340, 720], [460, 780], [560, 740], [700, 800], [820, 760], [940, 820]], 14, 2);
  K.wiggle([[60, 860], [180, 900], [320, 860], [440, 920], [580, 880], [720, 930], [860, 900], [960, 940]], 14, 2);
  // 고리 사이 이음 (짧은 사다리 수갱)
  for (const [x, a, b] of [[200, 760, 900], [460, 780, 920], [700, 800, 930], [940, 820, 940]]) shaft(K, x, a, b);
  // 지표에서 내려오는 개미귀신 구덩이 둘 (깔때기 · 바닥은 굴)
  for (const x of [260, 760]) {
    const s = S(x);
    for (let k = 0; k < 24; k++) K.air(x - 24 + k, s + k, x + 24 - k, s + k + 1);
    shaft(K, x, s + 22, x === 260 ? 744 : 782, "rope");
  }
  // 알 방 (벌레 굴 옆 둥근 방, 평평한 바닥)
  for (const [x, y, rx, role] of [[140, 728, 24, "treasure"], [400, 748, 26, "arena"], [640, 768, 22, "treasure"], [880, 790, 24, "arena"], [250, 880, 26, "rest"], [650, 904, 24, "treasure"]]) {
    K.ell(x, y - 10, rx, 10), K.air(x - rx + 4, y - 6, x + rx - 4, y);
    P(K, x, y, role === "treasure" ? "p_urn" : role === "rest" ? "p_font" : "p_bones", { s: 2 }), K.tag(x - rx + 4, y - 18, x + rx - 4, y, role);
  }
  K.heal(246, 254, 876, 880);
  // 묻힌 유리 신전 (3칸 방, 굴 사이에 묻혔다)
  K.mat(480, 810, 640, 860, "brick");
  for (const [a, b] of [[488, 534], [538, 584], [588, 632]]) (K.air(a, 826, b, 852), K.wall(a, 826, b, 852, "brick"));
  K.air(534, 842, 538, 852), K.air(584, 842, 588, 852);
  shaft(K, 510, 800, 852), shaft(K, 610, 852, 888, "ladder");
  P(K, 510, 852, "p_statue"), P(K, 560, 852, "p_altar"), P(K, 610, 852, "p_crystal", { s: 2 });
  K.tag(488, 826, 534, 852, "arena"), K.tag(538, 826, 584, 852, "treasure"), K.tag(588, 826, 632, 852, "arena");
  // 맨 아래 모래 샘 (▼)
  K.ell(512, 1000, 120, 30), K.rock(380, 1004, 644, 1034), K.air(400, 980, 624, 1004);
  K.water(402, 994, 622, 1004), K.rock(480, 992, 544, 1004), K.deep(512, 992);
  P(K, 500, 992, "p_crystal", { s: 2 }), P(K, 524, 992, "p_urn"), K.tag(486, 978, 538, 992, "rest", { safe: 1 });
  shaft(K, 440, 920, 1004), shaft(K, 580, 880, 1004);
  K.struct("모래 벌레 굴", "▼ 아래로·보물·전투", 40, 680, 980, 1034);
}
