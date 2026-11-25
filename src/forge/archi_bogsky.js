// ══════════════════════════════════════════════════════════════
// 늪지 구름 섬 (gm2_m1, 노랑) 「떠오른 늪 덩어리」 — 검은 늪지 위, 늪 가스에 뿌리째 떠오른 진흙섬들
//   섬 밑으로 뿌리·덩굴이 길게 늘어지고, 윗면엔 고인 늪물. 섬과 섬은 덩굴과 썩은 판자로 잇는다
//   지도 = 칸 1024 × 1056 · 섬 길 줄 1000 · ▲ = 마녀의 오두막 굴뚝 위 (x 520)
//     섬 길: 서쪽 갈대 나루 → 진흙 웅덩이 섬 → 썩은 판자 다리 → 버섯 둔덕 → 거품 늪 섬(가스 간헐천) → 덩굴 다리 → 동쪽 나루
//     가운데: 개구리 왕 둥지섬(속 굴방) · 거머리 웅덩이 섬 · 가라앉는 오두막 섬 · 뿌리 덩어리 섬(뿌리 속 굴)
//     위: 마녀의 오두막(▲, 기울어진 오두막 · 솥) · 반딧불 덤불 · 해골 나무 섬 · 늪 가스 바위
//   장치: 간헐천(늪 가스, 위로 띄운다) · 덩굴·밧줄 · 덩굴 그네 · 무너지는 판 · 짚라인 · 물 · 회복 샘
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
const belly = (x0, x1, t, d, s) => jag(PL([[x0, t + 6], [x0 + (x1 - x0) * 0.2, t + d * 0.7], [x0 + (x1 - x0) * 0.45, t + d], [x0 + (x1 - x0) * 0.7, t + d * 0.8], [x1, t + 6]]), 2.6, s);
// 섬 밑에 늘어진 뿌리 덩굴 (장식 + 일부는 오를 수 있다)
function roots(K, a, b, t, d, n, s) {
  for (let k = 0; k < n; k++) {
    const x = Math.round(a + ((b - a) * (k + 0.5)) / n + Math.sin(k * 2.3 + s) * 4);
    K.vine(x, x + 2, t + Math.round(d * 0.5), t + d + 14 + ((k * 7 + s) % 18));
  }
}
// 늪물 웅덩이 (윗면에 움푹)
const pond = (K, a, b, t, d = 6) => (K.air(a, t - 1, b, t + d), K.water(a, t, b, t + d));

export function bogsky(K) {
  skyBegin(K);
  road(K);
  frogKing(K), leeches(K), sinkingHut(K), rootBall(K);
  witchHut(K), fireflies(K), skullTree(K), gasRock(K);
  skyEnd(K);
}
bogsky.own = 1;

function road(K) {
  nat(K, 0, 76, () => F, jag(PL([[0, 1044], [40, 1038], [76, 1008]]), 1.2, 3), { flat: 1, fingers: 2 });
  P_(K, 20, F, "p_fern"), P_(K, 50, F, "p_lamp");
  K.tag(2, F - 14, 70, F, "rest", { safe: 1 });
  K.struct("갈대 나루", "출구", 0, 986, 76, 1044);
  rope_bridge(K, 76, 110, F, 3, 3, 0);
  nat(K, 110, 290, () => F, belly(110, 290, F, 56, 5), { flat: 1, fingers: 3 });
  pond(K, 150, 200, F), pond(K, 230, 270, F, 4);
  room(K, 140, 1012, 260, 1024), climb(K, 212, F, 1024, "vine");
  P_(K, 190, 1024, "p_urn"), P_(K, 230, 1024, "p_bones"), K.tag(140, 1012, 260, 1024, "treasure"), K.tag(112, F - 14, 148, F, "arena");
  roots(K, 110, 290, F, 56, 4, 1);
  K.struct("진흙 웅덩이 섬", "헤엄·보물", 110, 986, 290, 1056);
  for (let x = 290, i = 0; x < 340; x += 5, i++) (i % 3 === 2 ? K.crumble : K.plank)(x, x + 5, F + Math.round(Math.sin(((x - 290) / 50) * Math.PI) * 4));
  nat(K, 340, 470, (x) => F - Math.round(Math.max(0, Math.sin((x - 340) * 0.05)) * 8), belly(340, 470, F, 50, 7), { fingers: 2 });
  for (const [x, s] of [[360, 2], [390, 1], [430, 2], [455, 0]]) P_(K, x, F - 6, "p_shroom", { s });
  K.tag(344, F - 22, 466, F, "arena");
  K.struct("버섯 둔덕", "전투", 340, 980, 470, 1050);
  K.cloud(470, 500, F);
  nat(K, 500, 700, () => F, belly(500, 700, F, 60, 9), { flat: 1, fingers: 3 });
  pond(K, 540, 660, F, 8);
  for (const x of [560, 600, 640]) K.geyser(x - 2, x + 2, 900, F + 8);
  K.plank(552, 572, F - 1), K.plank(618, 638, F - 1), K.heal(680, 690, F - 4, F);
  K.tag(502, F - 14, 540, F, "rest", { safe: 1 }), K.tag(662, F - 14, 698, F, "arena");
  roots(K, 500, 700, F, 60, 5, 2);
  K.struct("거품 늪 섬", "간헐천·쉼터", 500, 900, 700, 1060);
  for (let x = 700; x < 760; x += 4) K.plank(x, x + 4, F + Math.round(Math.sin(((x - 700) / 60) * Math.PI) * 5));
  K.vine(706, 708, F - 30, F), K.vine(752, 754, F - 30, F);
  nat(K, 760, 1024, () => F, jag(PL([[760, 1006], [800, 1036], [900, 1048], [1024, 1032]]), 1.6, 11), { flat: 1, fingers: 3 });
  room(K, 800, 1010, 900, 1022, "wood"), climb(K, 806, F, 1022, "ladder", "wood");
  P_(K, 850, 1022, "p_crates", { s: 1 }), K.tag(800, 1010, 900, 1022, "treasure");
  P_(K, 960, F, "p_lamp"), P_(K, 930, F, "p_fern");
  K.tag(966, F - 14, 1022, F, "rest", { safe: 1 }), K.tag(780, F - 14, 940, F, "arena");
  K.struct("동쪽 나루", "출구·보물", 760, 986, 1024, 1048);
}

function frogKing(K) {
  const t = 820;
  nat(K, 90, 260, () => t, belly(90, 260, t, 80, 13), { fingers: 3 });
  pond(K, 110, 160, t);
  K.ell(190, t + 30, 40, 16), K.rock(150, t + 44, 230, t + 48);
  K.air(186, t, 194, t + 14), K.plank(186, 194, t), K.vine(187, 193, t - 3, t + 44);
  P_(K, 190, t + 44, "p_nest"), P_(K, 210, t + 44, "p_bones", { s: 2 }), P_(K, 170, t + 44, "p_shroom", { s: 1 });
  K.tag(156, t + 20, 226, t + 44, "treasure"), K.tag(94, t - 14, 256, t, "arena");
  roots(K, 90, 260, t, 80, 4, 3);
  dropTo(K, 120, t + 6, "vine");
  K.struct("개구리 왕 둥지섬", "보물·전투", 90, 806, 260, 920);
}
function leeches(K) {
  const t = 760;
  nat(K, 300, 440, () => t, belly(300, 440, t, 54, 17), { fingers: 2 });
  pond(K, 316, 424, t, 10);
  for (const [a, b] of [[330, 344], [366, 380], [400, 414]]) K.rock(a, t + 4, b, t + 10);
  P_(K, 306, t, "p_bones"), K.tag(316, t - 4, 424, t + 10, "arena");
  roots(K, 300, 440, t, 54, 3, 4);
  dropTo(K, 434, t, "rope");
  K.struct("거머리 웅덩이 섬", "헤엄·전투", 300, 746, 440, 830);
}
function sinkingHut(K) {
  const t = 780;
  nat(K, 500, 640, () => t, belly(500, 640, t, 50, 19), { fingers: 3 });
  // 반쯤 가라앉아 기운 오두막 (벽 기울기)
  for (let y = 0; y < 20; y++) K.wall(530 + Math.round(y * 0.3), t - 20 + y, 600 + Math.round(y * 0.3), t - 19 + y, "wood");
  mark(1);
  for (let k = 0; k < 74; k++) K.rock(528 + k, t - 22 - Math.round(k * 0.1), 529 + k, t - 19 - Math.round(k * 0.1));
  mark(0);
  K.air(528, t - 19, 610, t);
  P_(K, 560, t, "p_crates"), P_(K, 590, t, "p_shelf"), P_(K, 540, t, "p_lamp");
  K.tag(530, t - 19, 606, t, "treasure");
  K.ladder(612, t - 28, t);
  roots(K, 500, 640, t, 50, 3, 5);
  dropTo(K, 510, t, "vine");
  K.struct("가라앉는 오두막 섬", "보물", 500, 750, 640, 840);
}
function rootBall(K) {
  const t = 740;
  nat(K, 720, 900, () => t, belly(720, 900, t, 110, 23), { fingers: 4, rough: 3 });
  K.mat(720, t, 900, t + 110, "wood");
  K.wiggle([[740, t], [790, t + 40], [850, t + 40], [880, t + 70]], 8, 1, "wood");
  K.ell(810, t + 34, 22, 10);
  P_(K, 810, t + 40, "p_roots"), P_(K, 860, t + 40, "p_shroom", { s: 2 }), K.tag(790, t + 26, 850, t + 40, "treasure");
  dropTo(K, 880, t + 70, "vine");
  K.swing(700, t - 40, 30);
  K.struct("뿌리 덩어리 섬", "보물", 720, 726, 900, 850);
}
function witchHut(K) {
  const t = 380;
  nat(K, 430, 610, () => t, belly(430, 610, t, 90, 29), { fingers: 4 });
  // 기울어진 오두막 + 굴뚝 (굴뚝 꼭대기 = ▲)
  K.mat(470, t - 36, 570, t, "wood");
  mark(1);
  K.rock(470, t - 30, 472, t - 8), K.rock(568, t - 32, 570, t - 8);
  for (let k = 0; k < 104; k++) K.rock(468 + k, t - 34 - Math.round(Math.sin((k / 104) * Math.PI) * 10), 469 + k, t - 31);
  K.rock(530, t - 70, 540, t - 40);
  K.rock(526, t - 74, 544, t - 70);
  mark(0);
  K.air(472, t - 30, 568, t), K.wall(472, t - 30, 568, t, "wood");
  K.air(533, t - 70, 537, t - 30), K.ladder(535, t - 74, t);
  K.peak(535, t - 74);
  P_(K, 500, t, "p_cage"), P_(K, 520, t, "p_brazier"), P_(K, 550, t, "p_shelf"), P_(K, 490, t, "p_candles", { s: 1 });
  K.tag(474, t - 30, 566, t, "treasure"), K.tag(526, t - 88, 544, t - 74, "rest", { safe: 1 });
  room(K, 460, 394, 590, 408), climb(K, 584, t, 408, "vine");
  P_(K, 520, 408, "p_skulls"), K.tag(460, 394, 590, 408, "arena");
  roots(K, 430, 610, t, 90, 5, 6);
  dropTo(K, 470, 408, "rope");
  K.struct("마녀의 오두막", "▲ 위로·보물", 430, 300, 610, 480);
}
function fireflies(K) {
  const t = 560;
  nat(K, 140, 300, () => t, belly(140, 300, t, 60, 31), { fingers: 3 });
  for (const x of [160, 190, 220, 250, 280]) P_(K, x, t, x % 60 ? "p_bush" : "p_fern");
  K.tag(144, t - 14, 296, t, "arena");
  roots(K, 140, 300, t, 60, 4, 7);
  dropTo(K, 160, t, "vine");
  K.zip(296, t - 4, 434, 756);
  K.struct("반딧불 덤불", "전투·짚라인", 140, 546, 300, 630);
}
function skullTree(K) {
  const t = 520;
  nat(K, 700, 840, () => t, belly(700, 840, t, 60, 37), { fingers: 3 });
  P_(K, 770, t, "p_dead"), P_(K, 740, t, "p_skulls"), P_(K, 800, t, "p_bones", { s: 1 });
  K.tag(704, t - 14, 836, t, "treasure");
  roots(K, 700, 840, t, 60, 3, 8);
  dropTo(K, 830, t, "rope");
  K.zip(704, t - 4, 600, 776);
  K.struct("해골 나무 섬", "보물·짚라인", 700, 506, 840, 590);
}
function gasRock(K) {
  const t = 300;
  nat(K, 760, 900, () => t, belly(760, 900, t, 70, 41), { fingers: 3 });
  K.geyser(800, 806, 200, t), K.geyser(860, 866, 210, t);
  room(K, 780, 312, 880, 324), climb(K, 786, t, 324, "ladder");
  P_(K, 830, 324, "p_urn"), K.tag(780, 312, 880, 324, "treasure"), K.tag(764, t - 14, 896, t, "arena");
  dropTo(K, 820, 324, "rope");
  K.zip(764, t - 4, 600, 376);
  K.struct("늪 가스 바위", "간헐천·보물", 760, 200, 900, 370);
  // 더 채우는 섬 (먼저 아래 것부터): [x0, x1, 윗면, 두께, 밧줄 x, 이름, 소품]
  for (const [a, b, tt, d, dx, name, props] of [
    [900, 980, 700, 28, 910, "썩은 통나무 섬", ["p_log", "p_shroom"]], [60, 130, 720, 26, 120, "올챙이 웅덩이", ["p_fern", "p_hive"]],
    [300, 380, 640, 30, 310, "부러진 장대 섬", ["p_fence", "p_lamp"]], [620, 690, 620, 26, 630, "독버섯 둔덕", ["p_shroom", "p_shroom"]],
    [900, 980, 480, 26, 910, "까마귀 횃대", ["p_dead", "p_nest"]], [620, 700, 200, 30, 690, "높은 늪 거품", ["p_moss", "p_bones"]], [300, 370, 300, 26, 310, "마녀 약초밭", ["p_flowers", "p_candles"]],
  ]) {
    nat(K, a, b, () => tt, belly(a, b, tt, d, a % 89), { fingers: 2 });
    props.forEach((k, j) => P_(K, a + 14 + j * (b - a - 28), tt, k, { s: j % 3 }));
    pond(K, a + 24, a + 40, tt, 3);
    K.tag(a + 4, tt - 14, b - 4, tt, (a >> 3) % 2 ? "treasure" : "arena");
    roots(K, a, b, tt, d, 2, a % 7);
    dropTo(K, dx, tt, "rope");
    K.struct(name, "징검", a, tt - 14, b, tt + d);
  }
  // 작은 진흙 덩이 디딤 (높이 제각각, 밑에 뿌리)
  const S = [[40, 100, 640, 28], [330, 400, 600, 26], [600, 660, 620, 24], [920, 990, 600, 30], [60, 130, 420, 26], [300, 370, 440, 28], [640, 700, 400, 24], [920, 990, 380, 26], [220, 290, 260, 30]];
  S.forEach(([a, b, tt, d], i) => {
    nat(K, a, b, () => tt, belly(a, b, tt, d, 51 + i * 3), { fingers: 2 });
    P_(K, (a + b) >> 1, tt, ["p_shroom", "p_fern", "p_bones", "p_nest", "p_lamp"][i % 5], { s: i % 3 });
    K.tag(a + 4, tt - 14, b - 4, tt, i % 3 ? "arena" : "treasure");
    roots(K, a, b, tt, d, 2, i);
    dropTo(K, a + 8, tt, i % 2 ? "rope" : "vine");
    K.struct(["진흙 덩이", "뿌리 덩이", "이끼 덩이"][i % 3], "징검", a, tt - 14, b, tt + d);
  });
}
