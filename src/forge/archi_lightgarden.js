// ══════════════════════════════════════════════════════════════
// 빛의 정원 (g0_m2, 노랑) 「수정 온실 군도」 — 그린스텝 위 구름 위, 수정과 빛을 기르는 정원사들의 섬
//   지도 = 칸 1024 × 1056 · 맨 아래 섬 길 줄 1000 (좌우 출구) · ▲ = 태양 제단 (x 530)
//   섬마다 모양·속 짜임이 다르다 (같은 틀을 찍는 함수 없음)
//     섬 길: 서쪽 나루 → 구름 → 수정 정원섬(밑 수정굴) → 출렁다리 → 거울 연못섬 → 나룻 바구니 → 온실 뿌리섬 → 구름 → 프리즘 바위 → 출렁다리 → 동쪽 나루
//     아래 줄: 빛 폭포섬(섬을 뚫고 떨어지는 폭포, 헤엄쳐 오른다) · 나선섬(속 비탈 방 셋) · 공중 온실(유리 돔 + 2층 화분방) · 수정 둥지
//     가운데 줄: 프리즘 탑(속 층 셋) · 구름 목장 · 거울 호수섬 · 별빛 관측소(돔)
//     위 줄: 구름 등대 · 바람 꽃밭 · 태양 제단(▲) · 무지개 아치
//   장치: 폭포(헤엄) · 빛 기둥(위로 부는 바람) · 짚라인 · 나룻 바구니 · 출렁다리 · 밧줄·덩굴 · 회복 샘 · 무너지는 판
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyHole, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
// 섬 밑면: 가운데가 깊고 양끝이 얕은 불룩한 배 (점 몇 개를 손으로)
const belly = (x0, x1, t, d, s, pts) => jag(PL(pts ?? [[x0, t + 4], [x0 + (x1 - x0) * 0.2, t + d * 0.6], [x0 + (x1 - x0) * 0.5, t + d], [x0 + (x1 - x0) * 0.8, t + d * 0.55], [x1, t + 4]]), 1.6, s);

export function lightgarden(K) {
  skyBegin(K);
  road(K);
  fallsIsle(K), spiralIsle(K), greenhouse(K), crystalNest(K);
  prismTower(K), cloudRanch(K), mirrorLake(K), observatory(K);
  beacon(K), windMeadow(K), sunAltar(K), rainbowArch(K);
  smallIsles(K);
  skyEnd(K);
}
lightgarden.own = 1;

// ═══ 섬 길 (줄 1000) ═══
function road(K) {
  nat(K, 0, 70, () => F, jag(PL([[0, 1042], [30, 1036], [60, 1020], [70, 1004]]), 1.2, 1), { flat: 1, fingers: 1 });
  P_(K, 20, F, "p_flags"), P_(K, 46, F, "p_lamp");
  K.tag(2, F - 14, 66, F, "rest", { safe: 1 });
  K.struct("서쪽 나루", "출구", 0, 986, 70, 1042);
  K.cloud(70, 96, F);
  // 수정 정원섬: 윗면 수정 화단, 밑에 수정굴
  nat(K, 96, 232, () => F, belly(96, 232, F, 46, 3), { flat: 1, fingers: 2 });
  room(K, 112, 1008, 206, 1022), climb(K, 120, F, 1022, "ladder");
  for (const [x, s] of [[130, 1], [150, 2], [176, 0], [196, 1]]) P_(K, x, 1022, "p_crystal", { s });
  for (const x of [110, 140, 170, 210]) P_(K, x, F, "p_flowers");
  K.tag(112, 1008, 206, 1022, "treasure"), K.tag(100, F - 14, 228, F, "arena");
  K.struct("수정 정원섬", "보물·전투", 96, 986, 232, 1046);
  rope_bridge(K, 232, 270, F, 4, 4, 1);
  // 거울 연못섬: 윗면이 움푹한 연못, 연못 밑 작은 굴 (물속으로 들어간다)
  nat(K, 270, 400, () => F, belly(270, 400, F, 40, 5), { flat: 1, fingers: 1 });
  K.air(300, 996, 370, 1008), K.water(300, 998, 370, 1008);
  K.air(330, 1008, 352, 1018), K.water(330, 1008, 352, 1018);
  P_(K, 340, 1018, "p_urn"), K.tag(330, 1008, 352, 1018, "treasure");
  P_(K, 286, F, "p_fern"), P_(K, 386, F, "p_flowers");
  K.struct("거울 연못섬", "헤엄·보물", 270, 986, 400, 1040);
  K.ferry(400, 460, F, 6, 14);
  // 온실 뿌리섬: 윗면 화분 줄, 밑에 뿌리 저장고
  nat(K, 460, 604, () => F, belly(460, 604, F, 52, 7), { flat: 1, fingers: 2 });
  room(K, 480, 1010, 580, 1022, "wood"), climb(K, 572, F, 1022, "ladder", "wood");
  P_(K, 496, 1022, "p_crates"), P_(K, 530, 1022, "p_shelf"), P_(K, 556, 1022, "p_urn");
  for (const x of [476, 500, 524, 548]) P_(K, x, F, "p_bush");
  P_(K, 590, F, "p_font"), K.heal(586, 596, F - 4, F);
  K.tag(462, F - 14, 600, F, "rest", { safe: 1 }), K.tag(480, 1010, 580, 1022, "treasure");
  K.struct("온실 뿌리섬", "쉼터·보물", 460, 986, 604, 1052);
  K.cloud(604, 640, F);
  // 프리즘 바위: 윗면에 솟은 수정 바위 둘 (넘어 다닌다)
  nat(K, 640, 760, () => F, belly(640, 760, F, 44, 9), { flat: 1, fingers: 2 });
  mark(1);
  K.rock(672, 990, 680, 1000), K.rock(676, 984, 680, 990), K.rock(718, 992, 728, 1000);
  mark(0);
  P_(K, 676, 984, "p_crystal", { s: 2 }), P_(K, 724, 992, "p_crystal", { s: 1 });
  K.tag(642, F - 14, 756, F, "arena");
  K.struct("프리즘 바위", "전투", 640, 980, 760, 1044);
  rope_bridge(K, 760, 800, F, 3, 3, 2);
  // 동쪽 나루: 긴 섬, 밑에 나루 창고
  nat(K, 800, 1024, () => F, jag(PL([[800, 1006], [840, 1034], [920, 1044], [990, 1036], [1024, 1030]]), 1.4, 11), { flat: 1, fingers: 2 });
  room(K, 860, 1010, 940, 1022, "wood"), climb(K, 932, F, 1022, "ladder", "wood");
  P_(K, 876, 1022, "p_crates", { s: 1 }), P_(K, 910, 1022, "p_rack");
  P_(K, 990, F, "p_flags"), P_(K, 960, F, "p_lamp");
  K.tag(964, F - 14, 1022, F, "rest", { safe: 1 }), K.tag(810, F - 14, 950, F, "arena"), K.tag(860, 1010, 940, 1022, "treasure");
  K.struct("동쪽 나루", "출구·보물", 800, 986, 1024, 1044);
}

// ═══ 아래 줄 ═══
// 빛 폭포섬: 섬 한가운데를 뚫고 섬 길까지 떨어지는 폭포 (헤엄쳐 오른다)
function fallsIsle(K) {
  const t = 878;
  nat(K, 118, 252, () => t, belly(118, 252, t, 54, 13, [[118, t + 6], [150, t + 40], [196, t + 58], [230, t + 30], [252, t + 4]]), { fingers: 3 });
  K.fallw(196, t - 30, 202, F);
  K.air(186, t - 30, 212, t - 18), K.rock(184, t - 18, 214, t - 14), K.air(196, t - 18, 202, t);
  K.water(188, t - 22, 210, t - 18);
  room(K, 132, 888, 180, 902), climb(K, 140, t, 902, "rope");
  P_(K, 160, 902, "p_crystal", { s: 1 }), P_(K, 170, t, "p_flowers"), P_(K, 228, t, "p_fern");
  K.tag(132, 888, 180, 902, "treasure"), K.tag(120, t - 14, 186, t, "arena");
  dropTo(K, 222, t, "vine");
  K.struct("빛 폭포섬", "폭포·보물", 118, 846, 252, 940);
}
// 나선섬: 속 비탈 방 셋이 지그재그로
function spiralIsle(K) {
  const t = 846;
  nat(K, 298, 428, () => t, belly(298, 428, t, 84, 17, [[298, t + 8], [320, t + 50], [360, t + 86], [400, t + 60], [428, t + 6]]), { fingers: 2 });
  room(K, 312, 856, 410, 866), room(K, 322, 876, 404, 886), room(K, 336, 896, 392, 906);
  climb(K, 404, t, 866, "ladder"), climb(K, 326, 866, 886, "ladder"), climb(K, 388, 886, 906, "ladder");
  P_(K, 340, 866, "p_urn"), P_(K, 360, 886, "p_shelf"), P_(K, 364, 906, "p_crystal", { s: 2 });
  K.tag(312, 856, 410, 866, "arena"), K.tag(322, 876, 404, 886, "arena"), K.tag(336, 896, 392, 906, "treasure");
  P_(K, 320, t, "p_flowers"), P_(K, 380, t, "p_bush");
  dropTo(K, 330, 906, "rope");
  K.struct("나선섬", "전투·보물", 298, 830, 428, 932);
}
// 공중 온실: 유리 돔(돌 뼈대) + 그 밑 2층 화분방
function greenhouse(K) {
  const t = 800, cx = 590;
  nat(K, 482, 702, () => t, belly(482, 702, t, 96, 19, [[482, t + 8], [520, t + 60], [580, t + 100], [650, t + 70], [702, t + 6]]), { flat: 1, fingers: 3 });
  // 돔: 반원 뼈대 (2칸 두께), 기둥 사이로 드나든다
  mark(1);
  for (let a = 0; a <= 180; a += 2) {
    const r = Math.PI * a / 180, x = Math.round(cx + Math.cos(r) * 70), y = Math.round(t - Math.sin(r) * 54);
    (a > 12 && a < 168) && K.rock(x - 1, y - 1, x + 1, y + 1);
  }
  for (const x of [540, 590, 640]) K.rock(x, t - 50 + Math.round(Math.abs(x - cx) / 4), x + 2, t - 40);
  mark(0);
  for (let y = t - 52; y < t; y++) {
    const hw = Math.floor(Math.sqrt(Math.max(0, 1 - ((t - y) / 54) ** 2)) * 68);
    hw > 2 && K.wall(cx - hw, y, cx + hw, y + 1, "brick");
  }
  for (let x = 530; x < 660; x += 14) P_(K, x, t, x % 28 ? "p_bush" : "p_flowers");
  K.plank(536, 576, t - 26), K.plank(604, 644, t - 30), K.ladder(540, t - 26, t), K.ladder(640, t - 30, t);
  P_(K, 556, t - 26, "p_hive"), P_(K, 624, t - 30, "p_flowers");
  K.tag(530, t - 50, 650, t, "rest"), K.tag(536, t - 40, 644, t - 26, "treasure");
  // 2층 화분방
  room(K, 504, 812, 676, 826, "wood"), room(K, 530, 836, 650, 850, "wood");
  climb(K, 668, t, 826, "ladder", "wood"), climb(K, 540, 826, 850, "ladder", "wood");
  for (const x of [520, 560, 600, 640]) P_(K, x, 826, "p_fern");
  P_(K, 590, 850, "p_crates"), P_(K, 620, 850, "p_urn");
  K.heal(600, 612, 846, 850);
  K.tag(504, 812, 676, 826, "arena"), K.tag(530, 836, 650, 850, "treasure");
  dropTo(K, 520, 826, "rope"), dropTo(K, 690, t, "vine");
  K.struct("공중 온실", "쉼터·전투·보물", 482, 740, 702, 900);
}
function crystalNest(K) {
  const t = 858;
  nat(K, 790, 934, () => t, belly(790, 934, t, 50, 23), { fingers: 2 });
  room(K, 820, 866, 900, 878), climb(K, 826, t, 878, "vine");
  P_(K, 860, 878, "p_nest"), P_(K, 884, 878, "p_crystal", { s: 2 });
  P_(K, 810, t, "p_crystal", { s: 1 }), P_(K, 916, t, "p_crystal", { s: 0 });
  K.tag(820, 866, 900, 878, "treasure"), K.tag(794, t - 14, 930, t, "arena");
  dropTo(K, 910, t, "rope");
  K.struct("수정 둥지", "보물·전투", 790, 840, 934, 912);
}

// ═══ 가운데 줄 ═══
// 프리즘 탑: 좁고 높은 수정 첨탑, 속 층 셋, 꼭대기 빛 기둥
function prismTower(K) {
  const t = 520;
  nat(K, 168, 254, () => t, jag(PL([[168, t + 30], [180, t + 160], [206, t + 250], [236, t + 170], [254, t + 30]]), 1.4, 29), { fingers: 2, sh: 6 });
  room(K, 184, 560, 238, 580), room(K, 190, 620, 232, 640), room(K, 194, 680, 228, 700);
  climb(K, 230, t, 580, "ladder"), climb(K, 196, 580, 640, "ladder"), climb(K, 224, 640, 700, "ladder");
  P_(K, 210, 580, "p_lectern"), P_(K, 210, 640, "p_crystal", { s: 2 }), P_(K, 212, 700, "p_altar");
  K.tag(184, 560, 238, 580, "arena"), K.tag(190, 620, 232, 640, "treasure"), K.tag(194, 680, 228, 700, "arena");
  P_(K, 190, t, "p_crystal", { s: 2 }), P_(K, 236, t, "p_crystal", { s: 1 });
  dropTo(K, 210, 700, "rope");
  K.struct("프리즘 탑", "전투·보물", 168, 500, 254, 770);
}
function cloudRanch(K) {
  const t = 640;
  nat(K, 330, 476, () => t, belly(330, 476, t, 48, 31), { fingers: 2 });
  for (const x of [346, 380, 420, 450]) P_(K, x, t, x % 3 ? "p_flowers" : "p_sheep");
  P_(K, 400, t, "p_fence"), P_(K, 462, t, "p_hive");
  room(K, 360, 650, 440, 662, "wood"), climb(K, 434, t, 662, "ladder", "wood");
  P_(K, 380, 662, "p_hay"), P_(K, 410, 662, "p_wool");
  K.tag(334, t - 14, 470, t, "arena"), K.tag(360, 650, 440, 662, "rest");
  dropTo(K, 364, 662, "rope");
  K.struct("구름 목장", "전투·쉼터", 330, 626, 476, 690);
}
function mirrorLake(K) {
  const t = 598;
  nat(K, 556, 764, () => t, belly(556, 764, t, 70, 37, [[556, t + 6], [600, t + 50], [660, t + 74], [720, t + 44], [764, t + 4]]), { flat: 1, fingers: 3 });
  K.air(590, t - 2, 700, t + 12), K.water(590, t, 700, t + 12);
  for (const [a, b] of [[606, 618], [640, 652], [676, 688]]) K.rock(a, t + 4, b, t + 12);
  room(K, 612, 622, 690, 636), K.air(640, t + 12, 646, 622), K.water(640, t + 12, 646, 622);
  P_(K, 650, 636, "p_urn"), P_(K, 670, 636, "p_crystal", { s: 1 });
  K.tag(612, 622, 690, 636, "treasure");
  P_(K, 572, t, "p_fern"), P_(K, 730, t, "p_flowers"), P_(K, 748, t, "p_font"), K.heal(744, 752, t - 4, t);
  K.tag(560, t - 14, 588, t, "arena"), K.tag(704, t - 14, 760, t, "rest");
  dropTo(K, 740, t, "vine");
  K.struct("거울 호수섬", "헤엄·보물·쉼터", 556, 584, 764, 672);
}
function observatory(K) {
  const t = 556, cx = 912;
  nat(K, 830, 994, () => t, belly(830, 994, t, 60, 41), { flat: 1, fingers: 2 });
  mark(1);
  for (let a = 14; a <= 166; a += 3) {
    const r = Math.PI * a / 180;
    K.rock(Math.round(cx + Math.cos(r) * 34) - 1, Math.round(t - Math.sin(r) * 26) - 1, Math.round(cx + Math.cos(r) * 34) + 1, Math.round(t - Math.sin(r) * 26) + 1);
  }
  mark(0);
  for (let y = t - 25; y < t; y++) {
    const hw = Math.floor(Math.sqrt(Math.max(0, 1 - ((t - y) / 26) ** 2)) * 32);
    hw > 2 && K.wall(cx - hw, y, cx + hw, y + 1, "brick");
  }
  P_(K, cx, t, "p_lectern"), P_(K, cx - 18, t, "p_shelf"), P_(K, cx + 18, t, "p_candles");
  K.tag(cx - 30, t - 24, cx + 30, t, "treasure");
  room(K, 850, 566, 970, 578), climb(K, 856, t, 578, "ladder");
  P_(K, 900, 578, "p_crates"), K.tag(850, 566, 970, 578, "arena");
  dropTo(K, 880, 578, "rope");
  K.struct("별빛 관측소", "보물·전투", 830, 528, 994, 616);
}

// ═══ 위 줄 ═══
function beacon(K) {
  const t = 300;
  nat(K, 56, 166, () => t, belly(56, 166, t, 66, 43, [[56, t + 4], [80, t + 40], [110, t + 70], [140, t + 36], [166, t + 4]]), { fingers: 2 });
  mark(1);
  K.rock(100, t - 36, 116, t), K.rock(96, t - 40, 120, t - 36);
  mark(0);
  K.air(103, t - 36, 113, t), K.wall(103, t - 36, 113, t, "brick");
  K.air(100, t - 10, 116, t);
  K.air(106, t - 40, 110, t - 36), K.plank(106, 110, t - 40), K.ladder(108, t - 40, t);
  K.prop(100, t - 40, "p_brazier"), K.prop(116, t - 40, "p_lamp"), P_(K, 76, t, "p_lamp");
  K.tag(60, t - 14, 98, t, "arena"), K.tag(122, t - 14, 162, t, "rest");
  dropTo(K, 130, t, "rope");
  K.zip(150, t - 4, 244, 394);
  K.struct("구름 등대", "전투·짚라인", 56, 256, 166, 370);
}
function windMeadow(K) {
  const t = 398;
  nat(K, 230, 404, () => t, belly(230, 404, t, 52, 47), { fingers: 3 });
  for (const x of [250, 280, 310, 340, 380]) P_(K, x, t, x % 20 ? "p_flowers" : "p_windmill");
  // 빛 기둥: 위로 부는 바람이 태양 제단 아래 턱으로 올려 준다
  K.wind(392, 400, 232, t, 540);
  K.tag(234, t - 14, 400, t, "arena");
  dropTo(K, 360, t, "vine");
  K.struct("바람 꽃밭", "전투·빛 기둥", 230, 380, 404, 450);
}
function sunAltar(K) {
  const t = 220;
  nat(K, 404, 648, () => t, belly(404, 648, t, 100, 53, [[404, t + 30], [440, t + 70], [520, t + 104], [600, t + 60], [648, t + 10]]), { fingers: 4 });
  // 서쪽 아래 턱 (빛 기둥이 닿는 곳) → 제단으로 오르는 사다리
  K.rock(402, 246, 424, 250), climb(K, 416, t, 246, "ladder");
  K.peak(530, t);
  P_(K, 530, t, "p_altar"), P_(K, 500, t, "p_statue"), P_(K, 560, t, "p_statue"), P_(K, 476, t, "p_brazier"), P_(K, 584, t, "p_brazier");
  K.tag(500, t - 14, 560, t, "rest", { safe: 1 });
  room(K, 470, 236, 600, 252), climb(K, 590, t, 252, "ladder");
  P_(K, 500, 252, "p_candles", { s: 1 }), P_(K, 540, 252, "p_shelf");
  K.tag(470, 236, 600, 252, "treasure");
  dropTo(K, 610, t, "rope");
  K.zip(640, t - 4, 720, 356);
  K.struct("태양 제단", "▲ 위로·보물", 398, 200, 648, 324);
}
function rainbowArch(K) {
  const t = 360;
  nat(K, 680, 884, () => t, belly(680, 884, t, 60, 59, [[680, t + 4], [700, t + 50], [760, t + 62], [820, t + 60], [860, t + 40], [884, t + 4]]), { flat: 1, fingers: 2 });
  K.ell(782, t + 62, 26, 36), skyHole(K, 782, t + 62, 27, 37);
  room(K, 700, 372, 748, 384), climb(K, 708, t, 384, "ladder");
  room(K, 820, 372, 866, 386), climb(K, 858, t, 386, "rope");
  P_(K, 720, 384, "p_urn"), P_(K, 840, 386, "p_crystal", { s: 2 }), P_(K, 782, t, "p_flowers");
  K.tag(700, 372, 748, 384, "arena"), K.tag(820, 372, 866, 386, "treasure"), K.tag(740, t - 14, 830, t, "arena");
  dropTo(K, 870, 386, "rope");
  K.struct("무지개 아치", "전투·보물", 680, 340, 884, 430);
}

// ═══ 작은 섬들: 빈 하늘을 채운다 (하나하나 쓰임·모양이 다르다), 아래 섬까지 밧줄·덩굴 ═══
function smallIsles(K) {
  // 벌집 정원섬: 벌통 셋, 꿀 떨어지는 밑면
  nat(K, 36, 112, () => 700, belly(36, 112, 700, 40, 61, [[36, 704], [60, 730], [90, 742], [112, 704]]), { fingers: 3 });
  for (const x of [50, 72, 96]) P_(K, x, 700, "p_hive");
  K.tag(40, 686, 108, 700, "arena"), dropTo(K, 104, 700, "vine");
  K.struct("벌집 정원섬", "전투", 36, 686, 112, 746);
  // 물방울 섬: 둥근 물웅덩이를 품은 작은 섬 (물속 보물)
  nat(K, 266, 326, () => 742, belly(266, 326, 742, 34, 67), { fingers: 1 });
  K.ell(296, 752, 14, 8), K.water(282, 744, 310, 760), K.air(286, 742, 306, 744);
  P_(K, 296, 760, "p_urn"), K.tag(284, 744, 308, 760, "treasure"), dropTo(K, 308, 742, "rope");
  K.struct("물방울 섬", "헤엄·보물", 266, 730, 326, 780);
  // 부서진 온실 조각: 기운 돌 뼈대만 남았다
  nat(K, 436, 522, () => 690, belly(436, 522, 690, 38, 71), { fingers: 2 });
  mark(1);
  for (let k = 0; k < 22; k++) K.rock(452 + k, 690 - Math.round(k * 1.1) - 2, 454 + k, 690 - Math.round(k * 1.1));
  K.rock(496, 664, 498, 690);
  mark(0);
  P_(K, 470, 690, "p_brokencol"), P_(K, 508, 690, "p_bush"), K.tag(440, 676, 518, 690, "arena"), dropTo(K, 500, 690, "rope");
  K.struct("부서진 온실 조각", "전투", 436, 660, 522, 730);
  // 종 섬: 돌 아치에 매단 종
  nat(K, 766, 846, () => 704, belly(766, 846, 704, 44, 73), { fingers: 2 });
  mark(1);
  K.rock(786, 680, 790, 704), K.rock(822, 680, 826, 704), K.rock(784, 676, 828, 680);
  mark(0);
  K.prop(806, 680, "p_bell"), P_(K, 776, 704, "p_candles"), K.tag(770, 690, 842, 704, "rest"), dropTo(K, 800, 704, "rope");
  K.struct("종 섬", "쉼터", 766, 672, 846, 750);
  // 달 우물: 우물 굴이 섬 밑바닥까지 (밑 보물방)
  nat(K, 938, 1014, () => 722, belly(938, 1014, 722, 56, 79), { fingers: 2 });
  K.air(970, 722, 976, 760), K.wall(970, 722, 976, 760, "rock"), K.water(970, 744, 976, 760);
  room(K, 950, 760, 1000, 770), K.water(950, 764, 1000, 770);
  P_(K, 972, 722, "p_font"), P_(K, 990, 770, "p_crystal", { s: 2 }), K.tag(950, 760, 1000, 770, "treasure");
  dropTo(K, 1004, 722, "rope");
  K.struct("달 우물", "보물·헤엄", 938, 708, 1014, 780);
  // 새벽 첨탑: 태양 제단 위 좁은 바늘 바위
  nat(K, 516, 584, () => 92, jag(PL([[516, 100], [532, 140], [550, 170], [566, 140], [584, 100]]), 1.2, 83), { fingers: 1, sh: 4 });
  P_(K, 550, 92, "p_crystal", { s: 2 }), K.tag(520, 78, 580, 92, "treasure"), dropTo(K, 536, 92, "rope");
  K.struct("새벽 첨탑", "보물", 516, 78, 584, 172);
  // 구름 그네터: 덩굴 그네 둘로 바람 꽃밭 위를 건넌다
  nat(K, 300, 384, () => 250, belly(300, 384, 250, 40, 89), { fingers: 2 });
  K.swing(320, 254, 20), K.swing(366, 254, 24);
  P_(K, 340, 250, "p_nest"), K.tag(304, 236, 380, 250, "arena"), dropTo(K, 344, 250, "vine");
  K.struct("구름 그네터", "그네·전투", 300, 236, 384, 292);
  // 별똥 바위: 떨어진 별 조각이 박힌 바위 (빛나는 결정)
  nat(K, 698, 782, () => 178, jag(PL([[698, 184], [716, 214], [740, 230], [766, 210], [782, 182]]), 2.4, 97), { fingers: 2 });
  for (const [x, s] of [[714, 0], [740, 2], [762, 1]]) P_(K, x, 178, "p_crystal", { s });
  K.tag(702, 164, 778, 178, "treasure"), dropTo(K, 734, 178, "rope");
  K.struct("별똥 바위", "보물", 698, 164, 782, 232);
  // 꽃 계단섬: 윗면이 세 단 (단마다 꽃 색이 다르다)
  nat(K, 856, 966, (x) => (x < 892 ? 268 : x < 928 ? 262 : 256), belly(856, 966, 262, 48, 101), { flat: 1, fingers: 2 });
  for (const x of [866, 880, 902, 916, 938, 954]) P_(K, x, x < 892 ? 268 : x < 928 ? 262 : 256, "p_flowers");
  K.tag(860, 244, 962, 268, "arena"), dropTo(K, 962, 256, "vine");
  K.struct("꽃 계단섬", "전투", 856, 244, 966, 316);
  // 안개 등: 바위 기둥 위 등불, 기둥 속 작은 방
  nat(K, 18, 92, () => 462, belly(18, 92, 462, 44, 103), { fingers: 2 });
  room(K, 32, 470, 78, 482), climb(K, 40, 462, 482, "ladder");
  P_(K, 56, 462, "p_lamp"), P_(K, 60, 482, "p_shelf"), K.tag(32, 470, 78, 482, "treasure"), dropTo(K, 64, 482, "rope");
  K.struct("안개 등", "보물", 18, 448, 92, 510);
  // 프리즘 조각: 얇은 결정 판 (가장자리가 무너진다)
  nat(K, 560, 624, () => 478, belly(560, 624, 478, 26, 107), { fingers: 1 });
  K.crumble(552, 560, 478), K.crumble(624, 632, 478);
  P_(K, 592, 478, "p_crystal", { s: 1 }), K.tag(562, 464, 622, 478, "arena"), dropTo(K, 576, 478, "rope");
  K.struct("프리즘 조각", "전투", 552, 464, 632, 506);
  // 잠든 거인 섬: 누운 석상 (머리·가슴·발이 섬 윗면 굴곡)
  nat(K, 378, 474, (x) => 520 - (x > 386 && x < 400 ? 8 : x > 412 && x < 440 ? 5 : x > 456 && x < 466 ? 4 : 0), belly(378, 474, 520, 60, 109), { fingers: 2 });
  room(K, 398, 528, 456, 540), climb(K, 448, 520, 540, "ladder");
  P_(K, 426, 540, "p_sarcoph"), P_(K, 410, 540, "p_candles"), K.tag(398, 528, 456, 540, "treasure"), K.tag(382, 506, 470, 520, "arena");
  dropTo(K, 404, 540, "rope");
  K.struct("잠든 거인 섬", "보물·전투", 378, 504, 474, 584);
}
