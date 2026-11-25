// ══════════════════════════════════════════════════════════════
// 잿빛 빛의 정원 (g1_m2, 노랑) 「사슬에 묶인 잿빛 폐허 군도」 — 스톤브리지 위, 불타 버린 하늘 사원의 잔해
//   섬들이 흩어지지 않게 가운데 거대한 닻바위에 사슬로 묶여 있다
//   지도 = 칸 1024 × 1056 · 섬 길 줄 1000 · ▲ = 재의 종탑 꼭대기 (x 300)
//     섬 길: 서쪽 잿더미 나루 → 무너진 회랑 섬 → 사슬 다리 → 화로 광장 섬 → 구름 → 그을린 나무 섬 → 사슬 다리 → 동쪽 나루
//     가운데: 닻바위 — 섬 길에서 위로 솟은 거대한 바위, 속에 사슬 감옥 4층 (층마다 짜임 다름) · 바위 둘레에 사슬로 묶인 섬들
//     서쪽: 재의 종탑 (▲, 속 계단 · 깨진 종) · 그을린 도서관 섬 (서가 층)
//     동쪽: 뒤집힌 탑 (섬 밑에 거꾸로 매달린 탑, 아래로 내려가며 방) · 불씨 화로 섬 · 잿빛 나무 섬
//   장치: 사슬(밧줄) · 짚라인 · 승강기(닻바위 사슬 승강기) · 뜨거운 바람(화로 위로 부는 바람) · 무너지는 판 · 출렁다리
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyHole, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
const belly = (x0, x1, t, d, s, pts) => jag(PL(pts ?? [[x0, t + 4], [x0 + (x1 - x0) * 0.25, t + d * 0.7], [x0 + (x1 - x0) * 0.55, t + d], [x0 + (x1 - x0) * 0.85, t + d * 0.5], [x1, t + 4]]), 2.2, s);

export function ashsky(K) {
  skyBegin(K);
  road(K);
  anchor(K);
  bellTower(K), library(K);
  invertedTower(K), braziers(K), ashTrees(K);
  smallRuins(K);
  skyEnd(K);
}
ashsky.own = 1;

function road(K) {
  nat(K, 0, 96, () => F, jag(PL([[0, 1044], [40, 1040], [80, 1020], [96, 1004]]), 1.4, 3), { flat: 1, fingers: 2 });
  P_(K, 20, F, "p_brazier"), P_(K, 60, F, "p_rubble");
  K.tag(2, F - 14, 80, F, "rest", { safe: 1 });
  K.struct("잿더미 나루", "출구", 0, 986, 96, 1044);
  // 무너진 회랑 섬: 기둥 줄 (몇은 부러졌다), 밑에 무너진 지하 회랑
  nat(K, 96, 300, () => F, belly(96, 300, F, 56, 5), { flat: 1, fingers: 3 });
  for (const [x, h] of [[120, 30], [150, 12], [180, 30], [210, 6], [240, 30], [270, 18]]) K.wall(x, F - h, x + 3, F, "stem");
  mark(1), K.rock(116, 966, 186, 970), K.rock(236, 966, 276, 970), mark(0);
  room(K, 130, 1010, 270, 1022), climb(K, 140, F, 1022, "ladder"), climb(K, 262, F, 1022, "rope");
  P_(K, 170, 1022, "p_brokencol"), P_(K, 210, 1022, "p_urn"), P_(K, 240, 1022, "p_rubble");
  K.tag(100, F - 14, 296, F, "arena"), K.tag(130, 1010, 270, 1022, "treasure");
  K.ladder(122, 966, F);
  K.struct("무너진 회랑 섬", "전투·보물", 96, 960, 300, 1056);
  rope_bridge(K, 300, 344, F, 5, 3, 1);
  // 화로 광장 섬: 큰 화로 셋, 위로 뜨거운 바람
  nat(K, 344, 520, () => F, belly(344, 520, F, 50, 7), { flat: 1, fingers: 2 });
  for (const x of [372, 432, 492]) (P_(K, x, F, "p_brazier"), K.wind(x - 3, x + 3, 860, F - 4, 480));
  P_(K, 404, F, "p_statue"), P_(K, 462, F, "p_statue"), P_(K, 516, F, "p_font"), K.heal(512, 520, F - 4, F);
  K.tag(346, F - 14, 516, F, "rest", { safe: 1 });
  K.struct("화로 광장 섬", "쉼터·뜨거운 바람", 344, 986, 520, 1052);
  // 닻바위 밑동 (섬 길이 닻바위를 뚫고 지난다)
  nat(K, 540, 720, () => F, belly(540, 720, F, 50, 9), { flat: 1, fingers: 3 });
  K.cloud(520, 540, F);
  K.cloud(720, 746, F);
  // 그을린 나무 섬
  nat(K, 746, 880, () => F, belly(746, 880, F, 44, 11), { flat: 1, fingers: 2 });
  for (const x of [770, 812, 852]) P_(K, x, F, "p_dead");
  room(K, 770, 1008, 860, 1020), climb(K, 776, F, 1020, "ladder");
  P_(K, 820, 1020, "p_bones", { s: 1 }), K.tag(770, 1008, 860, 1020, "treasure"), K.tag(750, F - 14, 876, F, "arena");
  K.struct("그을린 나무 섬", "전투·보물", 746, 986, 880, 1044);
  rope_bridge(K, 880, 920, F, 4, 4, 2);
  nat(K, 920, 1024, () => F, jag(PL([[920, 1006], [950, 1034], [1000, 1040], [1024, 1036]]), 1.3, 13), { flat: 1, fingers: 2 });
  P_(K, 960, F, "p_brazier"), P_(K, 1000, F, "p_rubble");
  K.tag(966, F - 14, 1022, F, "rest", { safe: 1 });
  K.struct("동쪽 나루", "출구", 920, 986, 1024, 1040);
}

// ═══ 닻바위: 섬 길에서 솟은 거대한 바위, 속에 사슬 감옥 4층 + 사슬 승강기 ═══
function anchor(K) {
  const x0 = 560, x1 = 704;
  nat(K, x0, x1, (x) => 560 + Math.abs(x - 632) * 0.4, (x) => F + 6, { fingers: 0, sh: 8, rough: 2.8 });
  // 섬 길이 지나는 굴 (밑동 관문)
  K.air(560, F - 14, 704, F), K.wall(566, F - 14, 698, F, "brick");
  P_(K, 600, F, "p_chain"), P_(K, 664, F, "p_cage"), K.tag(570, F - 14, 694, F, "arena");
  // 감옥 층: [바닥, 높이, 짜임]
  const L = [[940, 30, "cells"], [880, 34, "torture"], [820, 30, "guard"], [760, 40, "vault"], [690, 34, "hall"], [620, 32, "top"]];
  for (const [f, h, kind] of L) {
    K.air(574, f - h, 690, f), K.wall(574, f - h, 690, f, "brick");
    if (kind === "cells") for (const x of [592, 620, 648, 676]) (K.wall(x, f - h, x + 2, f, "stem"), P_(K, x - 8, f, "p_cage"));
    if (kind === "torture") (P_(K, 600, f, "p_rack"), P_(K, 640, f, "p_chain"), P_(K, 670, f, "p_skulls"));
    if (kind === "guard") (P_(K, 600, f, "p_crates"), P_(K, 630, f, "p_brazier"), P_(K, 660, f, "p_rack"));
    if (kind === "vault") (K.plank(580, 640, f - 20), K.ladder(584, f - 20, f), P_(K, 610, f - 20, "p_urn"), P_(K, 660, f, "p_sarcoph"));
    if (kind === "hall") for (const x of [600, 632, 664]) K.wall(x, f - h, x + 3, f, "stem");
    if (kind === "top") (P_(K, 632, f, "p_altar"), P_(K, 610, f, "p_candles"), P_(K, 656, f, "p_candles"));
    K.tag(576, f - h, 688, f, kind === "vault" || kind === "top" ? "treasure" : kind === "hall" ? "rest" : "arena");
  }
  // 층 사이: 사슬 승강기 (동쪽 벽 속) + 엇갈린 사다리
  K.air(690, 600, 700, F), K.wall(690, 600, 700, F, "wood"), K.lift(691, 699, 620, F, 592);
  for (const [x, a, b] of [[584, 940, F], [676, 880, 940], [590, 820, 880], [670, 760, 820], [586, 690, 760], [674, 620, 690]]) climb(K, x, a, b, "ladder", "brick");
  for (const f of [940, 820, 690]) K.air(688, f - 9, 692, f);
  // 꼭대기 바깥 (바위 정수리) 문
  climb(K, 632, 560, 620, "ladder");
  P_(K, 620, 560, "p_chain"), P_(K, 646, 560, "p_brazier");
  K.tag(600, 544, 664, 560, "arena");
  // 바위에서 사방 섬으로 뻗은 사슬 (짚라인)
  K.zip(600, 560, 450, 756), K.zip(664, 560, 960, 736);
  K.struct("닻바위", "감옥·승강기·보물", 556, 540, 710, F + 6);
}

// ═══ 재의 종탑 (▲): 섬 위 높은 탑, 속 계단, 깨진 종 ═══
function bellTower(K) {
  const t = 520;
  nat(K, 230, 380, () => t, belly(230, 380, t, 80, 17), { flat: 1, fingers: 3 });
  mark(1);
  K.rock(282, 300, 322, t), K.rock(276, 296, 328, 300), K.rock(286, 282, 318, 296);
  mark(0);
  K.mat(276, 282, 328, t, "brick");
  const Fs = [t, 468, 420, 370, 330];
  for (let i = 1; i < Fs.length; i++) {
    const f = Fs[i - 1], h = f - Fs[i] - 6;
    K.air(286, f - h, 318, f), K.wall(286, f - h, 318, f, "brick");
    climb(K, i % 2 ? 290 : 314, Fs[i], f, "ladder", "brick");
  }
  K.air(282, Fs[0] - 12, 322, Fs[0]);
  K.air(290, 284, 314, 296), K.wall(290, 284, 314, 296, "brick"), climb(K, 302, 296, 330, "ladder", "brick");
  K.prop(302, 284, "p_bell");
  K.peak(302, 296);
  K.tag(290, 284, 314, 296, "rest", { safe: 1 });
  for (const [f, k] of [[468, "p_shelf"], [420, "p_candles"], [370, "p_chain"]]) P_(K, 300, f, k);
  K.tag(286, 456, 318, 468, "arena"), K.tag(286, 406, 318, 420, "treasure"), K.tag(286, 356, 318, 370, "arena");
  P_(K, 250, t, "p_dead"), P_(K, 356, t, "p_rubble");
  dropTo(K, 244, t, "rope"), dropTo(K, 370, t, "rope");
  K.struct("재의 종탑", "▲ 위로·보물", 230, 282, 380, 600);
}
function library(K) {
  const t = 720;
  nat(K, 40, 210, () => t, belly(40, 210, t, 90, 19, [[40, t + 6], [70, t + 70], [130, t + 94], [180, t + 50], [210, t + 6]]), { fingers: 3 });
  room(K, 56, 730, 190, 748, "wood"), room(K, 70, 758, 176, 776, "wood");
  climb(K, 182, t, 748, "ladder", "wood"), climb(K, 74, 748, 776, "ladder", "wood");
  for (const x of [72, 100, 128, 156]) P_(K, x, 748, "p_shelf");
  P_(K, 120, 776, "p_lectern"), P_(K, 150, 776, "p_candles", { s: 1 });
  K.tag(56, 730, 190, 748, "arena"), K.tag(70, 758, 176, 776, "treasure");
  P_(K, 60, t, "p_rubble"), P_(K, 140, t, "p_brokencol");
  dropTo(K, 120, 776, "rope");
  K.zip(200, t - 4, 300, 866);
  K.struct("그을린 도서관 섬", "전투·보물", 40, 706, 210, 816);
}

// ═══ 동쪽: 뒤집힌 탑 · 불씨 화로 섬 · 잿빛 나무 섬 ═══
function invertedTower(K) {
  const t = 600;
  nat(K, 780, 940, () => t, belly(780, 940, t, 30, 23), { flat: 1, fingers: 1 });
  // 섬 밑에 거꾸로 매달린 탑 (밑으로 내려가며 방 셋, 끝이 뾰족)
  mark(1);
  for (let y = t + 10; y < t + 170; y++) {
    const w = y < t + 150 ? 26 : Math.round(26 * (1 - (y - t - 150) / 20));
    K.rock(860 - w, y, 860 + w, y + 1);
  }
  mark(0);
  K.mat(834, t + 10, 886, t + 170, "brick");
  const R = [[t + 44, 26], [t + 88, 30], [t + 132, 30]];
  let prev = t;
  for (const [f, h] of R) {
    K.air(840, f - h, 880, f), K.wall(840, f - h, 880, f, "brick");
    climb(K, f === R[0][0] ? 846 : f === R[1][0] ? 874 : 846, prev, f, "ladder", "brick");
    prev = f;
  }
  P_(K, 860, R[0][0], "p_chand"), P_(K, 856, R[1][0], "p_shelf"), P_(K, 860, R[2][0], "p_altar");
  K.tag(840, R[0][0] - 26, 880, R[0][0], "arena"), K.tag(840, R[1][0] - 30, 880, R[1][0], "arena"), K.tag(840, R[2][0] - 30, 880, R[2][0], "treasure");
  P_(K, 800, t, "p_dead"), P_(K, 920, t, "p_brazier");
  dropTo(K, 932, t, "rope");
  K.struct("뒤집힌 탑", "전투·보물", 780, 586, 940, t + 172);
}
function braziers(K) {
  const t = 760;
  nat(K, 380, 520, () => t, belly(380, 520, t, 50, 29), { fingers: 2 });
  for (const x of [400, 450, 500]) (P_(K, x, t, "p_brazier"), K.wind(x - 2, x + 2, 640, t - 4, 420));
  K.tag(384, t - 14, 516, t, "arena");
  dropTo(K, 470, t, "rope");
  K.struct("불씨 화로 섬", "전투·뜨거운 바람", 380, 746, 520, 812);
}
function ashTrees(K) {
  const t = 740;
  nat(K, 940, 1020, () => t, belly(940, 1020, t, 60, 31), { fingers: 2 });
  P_(K, 960, t, "p_dead"), P_(K, 998, t, "p_dead"), P_(K, 980, t, "p_nest");
  K.tag(944, t - 14, 1016, t, "treasure");
  dropTo(K, 1004, t, "vine");
  K.struct("잿빛 나무 섬", "보물", 940, 726, 1020, 802);
}

// ═══ 작은 폐허 섬들 (모양·쓰임 제각각) ═══
function smallRuins(K) {
  // 부서진 아치 섬
  nat(K, 60, 170, () => 520, belly(60, 170, 520, 50, 37), { flat: 1, fingers: 2 });
  K.wall(84, 480, 88, 520, "stem"), K.wall(140, 490, 144, 520, "stem"), K.wall(84, 476, 120, 480, "brick");
  K.tag(64, 506, 166, 520, "arena"), dropTo(K, 150, 520, "rope"), P_(K, 110, 520, "p_brokencol");
  K.struct("부서진 아치 섬", "전투", 60, 470, 170, 576);
  // 해골 제단 바위
  nat(K, 430, 520, () => 420, jag(PL([[430, 426], [456, 470], [480, 486], [504, 460], [520, 424]]), 2, 41), { fingers: 2 });
  P_(K, 470, 420, "p_altar"), P_(K, 450, 420, "p_skulls"), P_(K, 494, 420, "p_candles");
  K.tag(434, 406, 516, 420, "treasure"), dropTo(K, 440, 420, "rope");
  K.zip(516, 416, 620, 558);
  K.struct("해골 제단 바위", "보물", 430, 406, 520, 490);
  // 매달린 종 섬 (사슬에 매달린 거꾸로 종)
  nat(K, 720, 800, () => 400, belly(720, 800, 400, 40, 43), { fingers: 2 });
  K.prop(760, 404, "p_bell"), P_(K, 740, 400, "p_chain"), K.tag(724, 386, 796, 400, "arena");
  dropTo(K, 790, 400, "rope");
  K.struct("매달린 종 섬", "전투", 720, 386, 800, 446);
  // 재 날리는 높은 섬 (가장 높은 보물)
  nat(K, 560, 650, () => 300, belly(560, 650, 300, 46, 47), { fingers: 2 });
  room(K, 574, 310, 640, 322), climb(K, 580, 300, 322, "ladder");
  P_(K, 610, 322, "p_urn"), P_(K, 630, 322, "p_crates", { s: 1 }), K.tag(574, 310, 640, 322, "treasure");
  dropTo(K, 640, 322, "rope");
  K.struct("재 날리는 섬", "보물", 560, 286, 650, 350);
  // 연기 첨탑 (좁은 바늘)
  nat(K, 880, 950, () => 330, jag(PL([[880, 336], [900, 380], [916, 420], [934, 380], [950, 336]]), 1.4, 53), { fingers: 1 });
  P_(K, 916, 330, "p_brazier"), K.tag(884, 316, 946, 330, "arena"), dropTo(K, 900, 330, "rope");
  K.struct("연기 첨탑", "전투", 880, 316, 950, 424);
  // 더 채우는 잔해 섬: [x0, x1, 윗면, 두께, 밧줄 x, 이름, 소품]
  for (const [a, b, t, d, dx, name, props] of [
    [40, 110, 900, 26, 60, "그을린 우물 바위", ["p_font", "p_rubble"]], [430, 500, 600, 28, 440, "기도 깃발 바위", ["p_flags", "p_candles"]],
    [960, 1020, 560, 26, 1004, "재 둥지", ["p_nest", "p_bones"]], [180, 250, 420, 24, 240, "깨진 종 조각", ["p_bell", "p_rubble"]],
    [680, 740, 200, 26, 690, "하늘 끝 화로", ["p_brazier", "p_chain"]], [960, 1020, 240, 24, 1004, "불탄 서가 조각", ["p_shelf", "p_candles"]],
  ]) {
    nat(K, a, b, () => t, belly(a, b, t, d, a % 61), { flat: 1, fingers: 2 });
    props.forEach((k, j) => P_(K, a + 12 + j * (b - a - 24), t, k, { s: j % 3 }));
    K.tag(a + 4, t - 14, b - 4, t, (a >> 3) % 2 ? "treasure" : "arena");
    dropTo(K, dx, t, "rope");
    K.struct(name, "징검", a, t - 14, b, t + d);
  }
  // 무너진 다리 조각 둘 (출렁다리 끝만 남았다)
  nat(K, 180, 240, () => 880, belly(180, 240, 880, 26, 59), { fingers: 1 });
  nat(K, 270, 330, () => 870, belly(270, 330, 870, 24, 61), { fingers: 1 });
  rope_bridge(K, 240, 270, 876, 2, 2, 0);
  P_(K, 200, 880, "p_rubble"), P_(K, 300, 870, "p_chain");
  K.tag(184, 866, 236, 880, "arena");
  dropTo(K, 200, 880, "vine"), dropTo(K, 310, 870, "rope");
  K.struct("무너진 다리 조각", "전투", 180, 860, 330, 906);
}
