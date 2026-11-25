// ══════════════════════════════════════════════════════════════
// 유리 빛의 정원 (g2_m2, 노랑 · 보스) 「기사단 공중 성채」 — 타다 남은 기사 그레이번의 기사단이 지키던 하늘 성채
//   지도 = 칸 1024 × 1056 · 섬 길 줄 1000 · ▲ = 본성 망루 꼭대기 (x 470) · 보스 방 = 동쪽 끝 맹세의 결투장 섬 (x 896~)
//     섬 길: 서쪽 성문 섬(성문탑 · 내리닫이 다리) → 도개교 → 훈련장 섬(허수아비 · 무기 시렁) → 도개교 → 본성 섬(3층 성 · 망루) → 출렁다리 → 마구간 섬 → 결투장 섬(보스)
//     위: 본성 망루(▲) · 예배당 섬(종 · 제단) · 무기고 섬(속 창고) · 기사 묘지 섬 · 봉화대 섬
//   장치: 도개교 · 승강기(본성 안) · 사다리·밧줄 · 짚라인 · 무너지는 판 · 뜨거운 바람(봉화) · 회복 샘
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
const belly = (x0, x1, t, d, s) => jag(PL([[x0, t + 5], [x0 + (x1 - x0) * 0.22, t + d * 0.7], [x0 + (x1 - x0) * 0.5, t + d], [x0 + (x1 - x0) * 0.8, t + d * 0.6], [x1, t + 5]]), 2, s);
// 성벽 (총안 있는 위 가장자리)
function battlement(K, a, b, f, h) {
  mark(1);
  K.rock(a, f - h, b, f - h + 3);
  for (let x = a; x < b; x += 6) K.rock(x, f - h - 3, x + 3, f - h);
  mark(0);
  K.mat(a, f - h - 3, b, f - h + 3, "brick");
}

export function citadel(K) {
  skyBegin(K);
  road(K);
  keep(K);
  upper(K);
  highIsles(K);
  duel(K);
  skyEnd(K);
}
citadel.own = 1;

function road(K) {
  // 서쪽 성문 섬: 성문탑 (길이 탑 밑 문을 지난다)
  nat(K, 0, 150, () => F, belly(0, 150, F, 56, 3), { flat: 1, fingers: 3 });
  mark(1), K.rock(80, F - 44, 120, F - 14), mark(0);
  K.mat(78, F - 48, 122, F, "brick"), K.air(84, F - 40, 116, F - 18), K.wall(84, F - 40, 116, F, "brick");
  K.air(80, F - 14, 120, F), K.ladder(112, F - 40, F), K.air(110, F - 18, 114, F - 14);
  battlement(K, 78, 122, F - 40, 4);
  P_(K, 30, F, "p_flags"), P_(K, 96, F - 18, "p_rack"), K.prop(100, F - 14, "p_banner");
  K.tag(2, F - 14, 70, F, "rest", { safe: 1 }), K.tag(84, F - 40, 116, F - 18, "treasure");
  K.struct("서쪽 성문 섬", "출구·보물", 0, F - 52, 150, 1056);
  K.draw(150, 196, F, "L", 0);
  // 훈련장 섬
  nat(K, 196, 360, () => F, belly(196, 360, F, 60, 5), { flat: 1, fingers: 3 });
  for (const x of [220, 260, 300]) P_(K, x, F, "p_fence");
  P_(K, 240, F, "p_rack"), P_(K, 330, F, "p_crates");
  room(K, 220, 1012, 340, 1026, "wood"), climb(K, 226, F, 1026, "ladder", "wood");
  P_(K, 280, 1026, "p_anvil"), P_(K, 310, 1026, "p_rack"), K.tag(220, 1012, 340, 1026, "treasure");
  K.tag(200, F - 14, 356, F, "arena");
  K.struct("훈련장 섬", "전투·보물", 196, 986, 360, 1060);
  K.draw(360, 400, F, "R", 1.2);
  // 본성 섬 밑동 (본성은 keep()에서)
  nat(K, 400, 600, () => F, belly(400, 600, F, 70, 7), { flat: 1, fingers: 4 });
  rope_bridge(K, 600, 650, F, 4, 3, 1);
  // 마구간 섬
  nat(K, 650, 860, () => F, belly(650, 860, F, 60, 9), { flat: 1, fingers: 3 });
  mark(1), K.rock(680, F - 24, 820, F - 21), mark(0);
  K.mat(676, F - 28, 824, F - 21, "wood");
  K.wall(680, F - 21, 820, F, "wood");
  for (const x of [680, 720, 760, 800, 818]) K.wall(x, F - 21, x + 2, F, "stem");
  P_(K, 700, F, "p_hay"), P_(K, 740, F, "p_hay", { s: 1 }), P_(K, 780, F, "p_crates"), P_(K, 840, F, "p_font"), K.heal(836, 844, F - 4, F);
  K.ladder(822, F - 24, F);
  K.tag(682, F - 21, 818, F, "arena"), K.tag(826, F - 14, 858, F, "rest", { safe: 1 });
  K.struct("마구간 섬", "전투·쉼터", 650, F - 28, 860, 1060);
  rope_bridge(K, 860, 900, F, 3, 0, 0);
}

// ═══ 본성: 3층 + 망루(▲), 안에 승강기 ═══
function keep(K) {
  const a = 420, b = 580;
  mark(1);
  K.rock(a, 700, a + 4, F), K.rock(b - 4, 700, b, F);
  K.rock(a, 696, b, 700);
  K.rock(450, 600, 490, 700);
  mark(0);
  K.mat(a, 600, b, F, "brick");
  K.air(a + 4, F - 30, b - 4, F), K.air(a, F - 14, a + 4, F), K.air(b - 4, F - 14, b, F);
  const Fl = [[F - 30, 30], [900, 40], [820, 40], [740, 40]];
  for (const [f, h] of Fl) (K.air(a + 4, f - h, b - 4, f), K.wall(a + 4, f - h, b - 4, f, "brick"));
  for (const f of [900, 820, 740]) K.rock(a + 4, f, b - 4, f + 4);
  K.wall(a + 4, 700, b - 4, F, "brick");
  battlement(K, a, b, 700, 0);
  // 승강기 (동쪽 벽 속) + 엇갈린 사다리
  K.air(b - 16, 700, b - 4, F), K.lift(b - 14, b - 6, 740, F, 692);
  for (const [x, u, d] of [[a + 10, 900, F], [a + 120, 820, 900], [a + 14, 740, 820]]) climb(K, x, u, d, "ladder", "brick");
  P_(K, 460, F, "p_brazier"), P_(K, 500, F, "p_statue"), P_(K, 540, F, "p_banner");
  P_(K, 450, 900, "p_rack"), P_(K, 500, 900, "p_crates", { s: 1 });
  P_(K, 460, 820, "p_shelf"), P_(K, 500, 820, "p_lectern"), P_(K, 540, 820, "p_candles");
  P_(K, 470, 740, "p_altar"), P_(K, 510, 740, "p_chand");
  K.tag(a + 6, F - 30, b - 18, F, "arena"), K.tag(a + 6, 860, b - 18, 900, "arena"), K.tag(a + 6, 780, b - 18, 820, "treasure"), K.tag(a + 6, 700, b - 18, 740, "rest");
  // 망루 (▲): 본성 지붕 위
  climb(K, 470, 696, 740, "ladder", "brick");
  K.air(454, 610, 486, 696), K.wall(454, 610, 486, 696, "brick");
  K.ladder(480, 600, 696), K.air(478, 600, 483, 610), K.plank(478, 483, 600);
  K.peak(470, 600);
  K.prop(464, 600, "p_banner"), K.tag(456, 586, 486, 600, "rest", { safe: 1 });
  K.struct("본성", "▲ 위로·쉼터·보물", a, 586, b, F);
}

function upper(K) {
  // 예배당 섬
  const t1 = 760;
  nat(K, 200, 360, () => t1, belly(200, 360, t1, 60, 13), { flat: 1, fingers: 3 });
  mark(1), K.rock(230, t1 - 40, 234, t1), K.rock(326, t1 - 40, 330, t1); for (let k = 0; k < 52; k++) K.rock(226 + k * 2, t1 - 44 - Math.min(k, 51 - k) * 0.3, 228 + k * 2, t1 - 40); mark(0);
  K.air(234, t1 - 40, 326, t1), K.wall(234, t1 - 40, 326, t1, "brick");
  K.air(226, t1 - 12, 234, t1), K.air(326, t1 - 12, 334, t1);
  K.prop(280, t1 - 40, "p_bell"), P_(K, 280, t1, "p_altar"), P_(K, 254, t1, "p_candles"), P_(K, 306, t1, "p_candles", { s: 1 });
  K.tag(236, t1 - 40, 324, t1, "treasure");
  dropTo(K, 210, t1, "rope");
  K.struct("예배당 섬", "보물", 200, t1 - 50, 360, 830);
  // 무기고 섬 (속 창고 2층)
  const t2 = 720;
  nat(K, 640, 800, () => t2, belly(640, 800, t2, 80, 17), { flat: 1, fingers: 3 });
  room(K, 660, 730, 780, 744, "brick"), room(K, 680, 754, 760, 768, "brick");
  climb(K, 666, t2, 744, "ladder", "brick"), climb(K, 754, 744, 768, "ladder", "brick");
  P_(K, 700, 744, "p_rack"), P_(K, 740, 744, "p_rack"), P_(K, 720, 768, "p_crates", { s: 1 });
  K.tag(660, 730, 780, 744, "arena"), K.tag(680, 754, 760, 768, "treasure");
  dropTo(K, 790, t2, "rope");
  K.struct("무기고 섬", "전투·보물", 640, 706, 800, 800);
  // 기사 묘지 섬
  const t3 = 540;
  nat(K, 80, 220, () => t3, belly(80, 220, t3, 60, 19), { flat: 1, fingers: 2 });
  for (const x of [100, 130, 160, 190]) P_(K, x, t3, x % 60 ? "p_menhir" : "p_statue");
  K.tag(84, t3 - 14, 216, t3, "arena");
  dropTo(K, 210, t3, "rope");
  K.zip(216, t3 - 4, 330, 756);
  K.struct("기사 묘지 섬", "전투·짚라인", 80, t3 - 14, 220, 600);
  // 봉화대 섬 (위로 부는 뜨거운 바람)
  const t4 = 460;
  nat(K, 660, 780, () => t4, belly(660, 780, t4, 60, 23), { flat: 1, fingers: 2 });
  K.wall(714, t4 - 20, 726, t4, "brick");
  P_(K, 720, t4, "p_brazier");
  K.wind(684, 690, 380, t4 - 2, 480);
  K.tag(664, t4 - 14, 710, t4, "treasure");
  dropTo(K, 670, t4, "rope");
  K.struct("봉화대 섬", "보물·바람", 660, t4 - 22, 780, 520);
  // 작은 성벽 조각 섬들
  for (const [a, b, t, s] of [[300, 380, 560, 27], [820, 890, 620, 29], [40, 110, 760, 31], [560, 630, 420, 33]]) {
    nat(K, a, b, () => t, belly(a, b, t, 26, s), { flat: 1, fingers: 2 });
    battlement(K, a + 4, b - 4, t, 0);
    P_(K, (a + b) >> 1, t, "p_brokencol");
    K.tag(a + 4, t - 14, b - 4, t, "arena");
    dropTo(K, a + 10, t, "rope");
    K.struct("무너진 성벽 조각", "전투", a, t - 14, b, t + 26);
  }
}

// ═══ 높은 하늘 섬들 (쓰임·모양 제각각, 아래 섬까지 밧줄) ═══
function highIsles(K) {
  const I = [
    [100, 200, 380, 36, 43, "깃발 탑 섬", (t) => (K.wall(146, t - 40, 150, t, "stem"), K.prop(148, t - 40, "p_banner"), P_(K, 120, t, "p_flags"))],
    [360, 460, 300, 40, 45, "매 둥지 바위", (t) => (P_(K, 400, t, "p_nest"), P_(K, 430, t, "p_bones", { s: 1 }))],
    [600, 700, 240, 34, 47, "깨진 종탑 조각", (t) => (K.wall(630, t - 30, 634, t, "stem"), K.wall(666, t - 22, 670, t, "stem"), K.prop(650, t, "p_bell"))],
    [820, 920, 330, 38, 49, "기사 동상 섬", (t) => (P_(K, 870, t, "p_statue"), P_(K, 846, t, "p_candles"), P_(K, 896, t, "p_brazier"))],
    [460, 560, 140, 42, 51, "하늘 감시대", (t) => (battlement(K, 470, 550, t, 0), P_(K, 500, t, "p_lamp"), P_(K, 530, t, "p_crates", { s: 1 }))],
    [240, 330, 180, 36, 53, "부서진 투석기 섬", (t) => (P_(K, 270, t, "p_wheel"), P_(K, 300, t, "p_log"), P_(K, 316, t, "p_rubble"))],
  ];
  I.forEach(([a, b, t, d, s, name, deco], i) => {
    nat(K, a, b, () => t, belly(a, b, t, d, s), { flat: 1, fingers: 2 });
    deco(t);
    K.tag(a + 4, t - 14, b - 4, t, i % 2 ? "treasure" : "arena");
    dropTo(K, a + 10, t, "rope");
    K.struct(name, i % 2 ? "보물" : "전투", a, t - 40, b, t + d);
  });
}

// ═══ 보스 방: 맹세의 결투장 섬 (동쪽 끝 128칸) ═══
function duel(K) {
  nat(K, 900, 1024, () => F, jag(PL([[900, 1010], [940, 1040], [1000, 1048], [1024, 1040]]), 1.4, 41), { flat: 1, fingers: 3 });
  for (const x of [906, 1016]) K.wall(x, F - 30, x + 3, F, "stem");
  P_(K, 920, F, "p_brazier"), P_(K, 1004, F, "p_brazier");
  P_(K, 960, F, "p_banner");
  K.struct("맹세의 결투장", "보스", 900, F - 34, 1024, 1048);
}
