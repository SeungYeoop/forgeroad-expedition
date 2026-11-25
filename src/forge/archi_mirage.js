// ══════════════════════════════════════════════════════════════
// 유리 구름 섬 (g2_m1, 노랑) 「신기루 오아시스 군도」 — 유리 모래톱 위, 뜨거운 바람에 떠오른 모래섬들
//   지도 = 칸 1024 × 1056 · 섬 길 줄 1000 · ▲ = 해시계 섬 바늘 꼭대기 (x 520)
//   섬 윗면이 모래 언덕처럼 물결친다. 섬마다 쓰임·모양이 다르다
//     섬 길: 서쪽 모래배 나루 → 사구 섬 → 모래배(나룻 바구니) → 신기루 시장 섬(천막 · 밑 창고) → 구름 → 유리 조각 섬 → 출렁다리 → 동쪽 나루
//     가운데 줄: 오아시스 섬(샘 · 물속 굴) · 바람 돛 탑(위로 부는 바람) · 유리 오벨리스크(속 층) · 모래 폭포 섬
//     위 줄: 해시계 섬(▲) · 뒤집힌 피라미드 섬(속 방) · 낙타 뼈 바위 · 신기루 정원
//   장치: 나룻 바구니 · 바람(돛 탑 · 모래 폭포 위 회오리) · 짚라인 · 밧줄·덩굴 · 출렁다리 · 무너지는 판 · 회복 샘
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
const belly = (x0, x1, t, d, s, pts) => jag(PL(pts ?? [[x0, t + 4], [x0 + (x1 - x0) * 0.3, t + d * 0.8], [x0 + (x1 - x0) * 0.5, t + d], [x0 + (x1 - x0) * 0.75, t + d * 0.6], [x1, t + 4]]), 1.8, s);
// 모래 언덕 윗면 (물결)
const dune = (t, a, s) => (x) => t - Math.round(Math.max(0, Math.sin(x * 0.07 + s)) * a);

export function mirage(K) {
  skyBegin(K);
  road(K);
  oasis(K), sailTower(K), obelisk(K), sandfall(K);
  sundial(K), pyramid(K), camelRock(K), mirageGarden(K);
  smalls(K);
  skyEnd(K);
}
mirage.own = 1;

function road(K) {
  nat(K, 0, 80, () => F, jag(PL([[0, 1042], [40, 1036], [80, 1006]]), 1.2, 3), { flat: 1, fingers: 1 });
  P_(K, 20, F, "p_flags"), P_(K, 50, F, "p_crates");
  K.tag(2, F - 14, 70, F, "rest", { safe: 1 });
  K.struct("모래배 나루", "출구", 0, 986, 80, 1042);
  K.cloud(80, 100, F);
  nat(K, 100, 250, dune(F, 4, 1), belly(100, 250, F, 50, 5), { fingers: 2 });
  P_(K, 140, F, "p_bones", { s: 1 }), P_(K, 200, F - 2, "p_bush"), K.tag(104, F - 16, 246, F, "arena");
  room(K, 130, 1012, 220, 1024), climb(K, 214, F, 1024, "ladder");
  P_(K, 170, 1024, "p_urn"), K.tag(130, 1012, 220, 1024, "treasure");
  K.struct("사구 섬", "전투·보물", 100, 980, 250, 1050);
  K.ferry(250, 316, F, 6, 16);
  nat(K, 316, 500, () => F, belly(316, 500, F, 56, 7), { flat: 1, fingers: 3 });
  for (const [x, s] of [[340, 0], [390, 1], [440, 0], [480, 1]]) P_(K, x, F, s ? "p_yurt" : "p_crates", { sc: s ? 1.3 : 1 });
  room(K, 336, 1010, 480, 1022, "wood"), climb(K, 470, F, 1022, "ladder", "wood");
  P_(K, 360, 1022, "p_crates", { s: 1 }), P_(K, 400, 1022, "p_shelf"), P_(K, 440, 1022, "p_urn");
  P_(K, 410, F, "p_font"), K.heal(406, 414, F - 4, F);
  K.tag(318, F - 14, 498, F, "rest", { safe: 1 }), K.tag(336, 1010, 480, 1022, "treasure");
  K.struct("신기루 시장 섬", "쉼터·보물", 316, 986, 500, 1056);
  K.cloud(500, 530, F);
  nat(K, 530, 700, () => F, belly(530, 700, F, 46, 9), { flat: 1, fingers: 2 });
  // 유리 조각: 땅에 박힌 큰 결정 (넘어 다닌다)
  for (const [x, s] of [[560, 2], [600, 2], [650, 1], [580, 0], [626, 1]]) K.prop(x, F, "p_crystal", { s, sc: s === 2 ? 1.8 : 1.25 });
  K.tag(534, F - 14, 696, F, "arena");
  K.struct("유리 조각 섬", "전투", 530, 970, 700, 1046);
  rope_bridge(K, 700, 760, F, 5, 3, 1);
  nat(K, 760, 1024, () => F, jag(PL([[760, 1006], [800, 1036], [900, 1046], [1000, 1036], [1024, 1030]]), 1.4, 11), { flat: 1, fingers: 3 });
  room(K, 800, 1010, 900, 1022, "wood"), climb(K, 806, F, 1022, "ladder", "wood");
  P_(K, 850, 1022, "p_crates", { s: 1 }), K.tag(800, 1010, 900, 1022, "treasure");
  P_(K, 960, F, "p_flags"), P_(K, 930, F, "p_crates");
  K.tag(966, F - 14, 1022, F, "rest", { safe: 1 }), K.tag(780, F - 14, 940, F, "arena");
  K.struct("동쪽 나루", "출구·보물", 760, 986, 1024, 1046);
}

function oasis(K) {
  const t = 840;
  nat(K, 120, 300, dune(t, 3, 2), belly(120, 300, t, 70, 13), { fingers: 3 });
  K.air(160, t - 3, 250, t + 10), K.water(160, t, 250, t + 10);
  K.air(196, t + 10, 214, t + 30), K.water(196, t + 10, 214, t + 30);
  room(K, 180, t + 30, 240, t + 42), K.water(180, t + 34, 240, t + 42);
  P_(K, 210, t + 42, "p_urn"), K.tag(180, t + 30, 240, t + 42, "treasure");
  for (const x of [134, 284]) P_(K, x, t, "p_fern");
  P_(K, 270, t, "p_bush"), K.tag(124, t - 14, 158, t, "rest");
  dropTo(K, 140, t, "vine");
  K.struct("오아시스 섬", "헤엄·보물·쉼터", 120, 820, 300, 912);
}
function sailTower(K) {
  const t = 780;
  nat(K, 340, 450, () => t, belly(340, 450, t, 60, 17), { flat: 1, fingers: 2 });
  mark(1), K.rock(392, 690, 396, t), mark(0);
  K.wall(370, 700, 392, 740, "wood"), K.wall(396, 696, 424, 730, "wood");
  K.wind(380, 390, 640, t - 2, 520), K.wind(400, 410, 650, t - 2, 520);
  P_(K, 360, t, "p_crates"), K.tag(344, t - 14, 446, t, "arena");
  dropTo(K, 430, t, "rope");
  K.struct("바람 돛 탑", "바람·전투", 340, 690, 450, 840);
}
function obelisk(K) {
  const t = 760;
  nat(K, 520, 660, () => t, belly(520, 660, t, 70, 19), { flat: 1, fingers: 3 });
  mark(1);
  for (let y = 640; y < t; y++) { const w = Math.round(10 + (y - 640) * 0.08); K.rock(590 - w, y, 590 + w, y + 1); }
  for (let k = 0; k < 10; k++) K.rock(590 - (10 - k), 630 + k, 590 + (10 - k), 631 + k);
  mark(0);
  K.mat(570, 630, 610, t, "brick");
  for (const [f, h] of [[t, 30], [720, 28], [684, 26]]) (K.air(580, f - h, 600, f), K.wall(580, f - h, 600, f, "brick"));
  K.air(566, t - 12, 614, t);
  climb(K, 584, 720, t, "ladder", "brick"), climb(K, 596, 684, 720, "ladder", "brick");
  P_(K, 590, 720, "p_candles"), P_(K, 590, 684, "p_crystal", { s: 2 });
  K.tag(580, 692, 600, 720, "arena"), K.tag(580, 658, 600, 684, "treasure");
  P_(K, 540, t, "p_crystal", { s: 0 }), P_(K, 640, t, "p_crystal", { s: 1 });
  dropTo(K, 540, t, "rope");
  K.struct("유리 오벨리스크", "보물·전투", 520, 626, 660, 830);
}
function sandfall(K) {
  const t = 800;
  nat(K, 720, 880, dune(t, 4, 3), belly(720, 880, t, 60, 23), { fingers: 3 });
  K.wind(760, 768, 680, t - 2, 480);
  room(K, 790, 810, 860, 822), climb(K, 850, t, 822, "ladder");
  P_(K, 820, 822, "p_bones", { s: 2 }), K.tag(790, 810, 860, 822, "treasure"), K.tag(724, t - 16, 876, t, "arena");
  dropTo(K, 790, t, "rope");
  K.struct("모래 폭포 섬", "바람·보물", 720, 780, 880, 862);
}
function sundial(K) {
  const t = 300;
  nat(K, 450, 600, () => t, belly(450, 600, t, 80, 29), { flat: 1, fingers: 3 });
  mark(1);
  for (let k = 0; k < 40; k++) K.rock(514 + Math.round(k * 0.2), t - k - 1, 520 + Math.round(k * 0.2), t - k);
  mark(0);
  K.mat(510, t - 42, 530, t, "brick");
  K.rock(520, t - 44, 534, t - 40), K.ladder(526, t - 44, t);
  K.air(524, t - 40, 529, t), K.air(510, t - 10, 538, t), K.peak(527, t - 44);
  for (let k = 0; k < 6; k++) P_(K, 470 + k * 22, t, k % 2 ? "p_menhir" : "p_cairn");
  K.tag(520, t - 58, 534, t - 44, "rest", { safe: 1 });
  room(K, 470, 310, 580, 324), climb(K, 476, t, 324, "ladder");
  P_(K, 520, 324, "p_altar"), K.tag(470, 310, 580, 324, "treasure");
  dropTo(K, 560, 324, "rope");
  K.zip(456, t - 4, 360, 776);
  K.struct("해시계 섬", "▲ 위로·보물", 450, 250, 600, 384);
}
function pyramid(K) {
  const t = 520;
  // 뒤집힌 피라미드: 윗면 넓고 밑으로 뾰족, 속에 계단 방
  nat(K, 160, 340, () => t, (x) => t + Math.round(90 - Math.abs(x - 250) * 0.95), { flat: 1, fingers: 1, rough: 1 });
  K.mat(160, t, 340, t + 92, "brick");
  room(K, 196, 530, 304, 544, "brick"), room(K, 220, 554, 280, 568, "brick");
  climb(K, 296, t, 544, "ladder", "brick"), climb(K, 226, 544, 568, "ladder", "brick");
  P_(K, 250, 544, "p_sarcoph"), P_(K, 250, 568, "p_urn"), P_(K, 270, 568, "p_crystal", { s: 2 });
  K.tag(196, 530, 304, 544, "arena"), K.tag(220, 554, 280, 568, "treasure");
  P_(K, 180, t, "p_statue"), P_(K, 320, t, "p_statue");
  dropTo(K, 200, 544, "rope");
  K.struct("뒤집힌 피라미드 섬", "전투·보물", 160, 506, 340, 612);
}
function camelRock(K) {
  const t = 470;
  nat(K, 680, 800, (x) => t - (x > 700 && x < 730 ? 8 : x > 750 && x < 776 ? 6 : 0), belly(680, 800, t, 50, 31), { fingers: 2 });
  P_(K, 716, t - 8, "p_bones", { s: 2 }), P_(K, 760, t - 6, "p_skulls");
  K.tag(684, t - 22, 796, t, "treasure");
  dropTo(K, 790, t, "rope");
  K.struct("낙타 뼈 바위", "보물", 680, 456, 800, 524);
}
function mirageGarden(K) {
  const t = 400;
  nat(K, 840, 990, () => t, belly(840, 990, t, 60, 37), { flat: 1, fingers: 2 });
  for (const x of [856, 880, 904, 928, 952, 976]) P_(K, x, t, x % 48 ? "p_flowers" : "p_bush");
  K.air(880, t - 2, 940, t + 8), K.water(880, t, 940, t + 8);
  K.tag(844, t - 14, 878, t, "arena"), K.tag(944, t - 14, 986, t, "rest");
  dropTo(K, 860, t, "vine");
  K.zip(980, t - 4, 870, 794);
  K.struct("신기루 정원", "쉼터·전투", 840, 386, 990, 460);
}
function smalls(K) {
  // 더 채우는 섬 (쓰임·소품 제각각): [x0, x1, 윗면, 두께, 밧줄 x, 이름, 소품]
  for (const [a, b, t, d, dx, name, props] of [
    [400, 470, 660, 26, 410, "물항아리 섬", ["p_urn", "p_urn", "p_fern"]], [690, 770, 640, 30, 760, "상인 천막 섬", ["p_yurt", "p_crates"]],
    [900, 980, 700, 28, 960, "깨진 수레 섬", ["p_wheel", "p_rubble"]], [30, 100, 760, 24, 50, "낙타 쉼터", ["p_hay", "p_font"]],
    [530, 600, 620, 24, 540, "모래시계 바위", ["p_menhir", "p_crystal"]], [250, 320, 700, 26, 260, "유리 꽃 섬", ["p_crystal", "p_flowers"]],
    [860, 940, 500, 28, 870, "바람 깃발 섬", ["p_flags", "p_cairn"]],
  ]) {
    nat(K, a, b, dune(t, 2, a), belly(a, b, t, d, a % 97), { fingers: 2 });
    props.forEach((k, j) => P_(K, a + 12 + j * Math.round((b - a - 24) / Math.max(1, props.length - 1)), t, k, { s: j % 3 }));
    K.tag(a + 4, t - 14, b - 4, t, (a >> 3) % 2 ? "treasure" : "arena");
    dropTo(K, dx, t, "rope");
    K.struct(name, "징검", a, t - 14, b, t + d);
  }
  // 떠다니는 모래 디딤돌 몇 (사이 짚라인·밧줄)
  const S = [[40, 110, 640, 30], [300, 370, 600, 26], [470, 540, 520, 24], [620, 680, 600, 22], [900, 970, 620, 28], [60, 130, 380, 30], [320, 390, 400, 26], [640, 700, 280, 24], [800, 880, 200, 30], [200, 270, 200, 28]];
  S.forEach(([a, b, t, d], i) => {
    nat(K, a, b, dune(t, 2, i), belly(a, b, t, d, 41 + i * 3), { fingers: 2 });
    P_(K, (a + b) >> 1, t, ["p_bones", "p_crystal", "p_bush", "p_cairn", "p_urn"][i % 5], { s: i % 3 });
    K.tag(a + 4, t - 14, b - 4, t, i % 3 ? "arena" : "treasure");
    dropTo(K, b - 8, t, i % 2 ? "rope" : "vine");
    K.struct(["모래 디딤돌", "바람 바위", "유리 혹", "돌탑 바위", "항아리 바위"][i % 5], "징검", a, t - 14, b, t + d);
  });
}
