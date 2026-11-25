// ══════════════════════════════════════════════════════════════
// 이끼 빛의 정원 (gm1_m2, 노랑) 「하늘 수도원 군도」 — 리프크라운 위, 이끼 덮인 섬마다 수도승들이 지은 수도원
//   지도 = 칸 1024 × 1056 · 섬 길 줄 1000 · ▲ = 종각 섬 지붕 (x 520)
//     섬 길: 서쪽 순례자 나루 → 차밭 계단섬(윗면이 층층 단) → 출렁다리 → 회랑 섬(기둥 회랑 · 안뜰 샘) → 구름 → 명상 굴 섬 → 깃발 다리 → 동쪽 나루
//     가운데: 대수도원(층마다 다른 방: 식당 · 필사실 · 수련장 · 종루 계단) · 탑 경당(뾰족 탑 속 경전) · 기도 바퀴 섬 · 약초 온실 섬
//     위: 종각 섬(▲) · 구름 위 은둔자 굴 · 별 보는 돌 · 폭포 바위
//   장치: 출렁다리 · 깃발 줄(짚라인) · 폭포(헤엄) · 바람(기도 바퀴 위) · 사다리·밧줄 · 무너지는 판 · 회복 샘 · 금 간 벽
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
const belly = (x0, x1, t, d, s) => jag(PL([[x0, t + 5], [x0 + (x1 - x0) * 0.25, t + d * 0.75], [x0 + (x1 - x0) * 0.5, t + d], [x0 + (x1 - x0) * 0.8, t + d * 0.65], [x1, t + 5]]), 1.6, s);

export function monastery(K) {
  skyBegin(K);
  road(K);
  abbey(K), stupa(K), prayerWheel(K), herbHouse(K);
  belfry(K), hermit(K), starStone(K), fallsRock(K);
  steps(K);
  stepsMore(K);
  skyEnd(K);
}
monastery.own = 1;

function road(K) {
  nat(K, 0, 80, () => F, jag(PL([[0, 1042], [40, 1038], [80, 1006]]), 1.2, 3), { flat: 1, fingers: 2 });
  P_(K, 20, F, "p_flags"), P_(K, 52, F, "p_cairn");
  K.tag(2, F - 14, 70, F, "rest", { safe: 1 });
  K.struct("순례자 나루", "출구", 0, 986, 80, 1042);
  K.cloud(80, 100, F);
  // 차밭 계단섬: 윗면이 서쪽으로 내려가는 단 (높이 제각각)
  nat(K, 100, 290, (x) => (x < 150 ? F : x < 190 ? F - 5 : x < 240 ? F - 10 : F - 6), belly(100, 290, F, 60, 5), { flat: 1, fingers: 3 });
  for (const [x, f] of [[120, F], [140, F], [165, F - 5], [180, F - 5], [205, F - 10], [225, F - 10], [260, F - 6]]) P_(K, x, f, "p_bush");
  room(K, 130, 1012, 270, 1024, "wood"), climb(K, 136, F, 1024, "ladder", "wood");
  P_(K, 180, 1024, "p_crates"), P_(K, 220, 1024, "p_hay"), K.tag(130, 1012, 270, 1024, "treasure");
  K.tag(104, F - 24, 286, F, "arena");
  K.struct("차밭 계단섬", "전투·보물", 100, 980, 290, 1060);
  rope_bridge(K, 290, 330, F - 6, 4, 4, 1);
  // 회랑 섬: 기둥 회랑 + 안뜰 샘
  nat(K, 330, 540, () => F - 6, belly(330, 540, F - 6, 60, 7), { flat: 1, fingers: 3 });
  const t = F - 6;
  mark(1), K.rock(350, t - 26, 520, t - 23), mark(0);
  K.mat(346, t - 30, 524, t - 23, "brick");
  for (const x of [356, 384, 412, 456, 484, 512]) K.wall(x, t - 23, x + 3, t, "stem");
  K.air(430, t - 2, 444, t + 6), K.water(430, t, 444, t + 6), K.heal(430, 444, t - 2, t + 6);
  K.ladder(352, t - 26, t);
  P_(K, 400, t, "p_lectern"), P_(K, 470, t, "p_candles", { s: 1 }), P_(K, 437, t - 26, "p_bell");
  K.tag(348, t - 23, 522, t, "rest", { safe: 1 }), K.tag(352, t - 38, 520, t - 26, "arena");
  K.struct("회랑 섬", "쉼터·회복", 330, t - 30, 540, 1060);
  K.cloud(540, 570, F - 6);
  // 명상 굴 섬: 윗면은 좁고, 섬 배에 명상 굴 셋 (높이 다르게)
  nat(K, 570, 740, () => F - 6, belly(570, 740, F - 6, 80, 9), { flat: 1, fingers: 3 });
  for (const [a, b, f] of [[590, 630, 1010], [650, 700, 1024], [610, 660, 1040]]) room(K, a, f - 10, b, f);
  climb(K, 596, F - 6, 1010, "rope"), climb(K, 692, F - 6, 1024, "rope"), climb(K, 654, 1024, 1040, "ladder");
  for (const [x, f] of [[610, 1010], [676, 1024], [636, 1040]]) P_(K, x, f, "p_candles");
  K.tag(590, 1000, 630, 1010, "rest"), K.tag(610, 1030, 660, 1040, "treasure"), K.tag(574, F - 20, 736, F - 6, "arena");
  K.struct("명상 굴 섬", "쉼터·보물", 570, 980, 740, 1072);
  // 깃발 다리 (판자 위로 깃발 줄)
  rope_bridge(K, 740, 780, F - 6, 3, 0, 0);
  P_(K, 760, F - 6, "p_flags");
  nat(K, 780, 1024, (x) => (x < 820 ? F - 6 : x < 850 ? F - 6 + Math.round((x - 820) / 5) : F), jag(PL([[780, 1000], [820, 1034], [920, 1046], [1024, 1030]]), 1.4, 11), { flat: 1, fingers: 3 });
  // 동쪽 출구 높이 맞춤: 끝은 줄 1000
  room(K, 820, 1006, 920, 1018, "wood"), climb(K, 826, F - 6, 1018, "ladder", "wood");
  P_(K, 870, 1018, "p_shelf"), K.tag(820, 1006, 920, 1018, "treasure");
  K.tag(966, F - 14, 1022, F, "rest", { safe: 1 }), K.tag(790, F - 20, 940, F - 6, "arena");
  K.struct("동쪽 나루", "출구·보물", 780, 980, 1024, 1046);
}

// ═══ 대수도원: 층마다 다른 방 ═══
function abbey(K) {
  const t = 760;
  nat(K, 280, 520, () => t, belly(280, 520, t, 120, 13), { flat: 1, fingers: 4 });
  // 지상 건물 (2층)
  mark(1);
  K.rock(310, t - 60, 314, t - 10), K.rock(486, t - 60, 490, t - 10), K.rock(306, t - 64, 494, t - 60), K.rock(306, t - 34, 470, t - 31);
  for (let k = 0; k < 40; k++) K.rock(300 + k * 2, t - 64 - Math.min(k, 40 - k) * 0.4, 302 + k * 2, t - 63);
  mark(0);
  K.mat(306, t - 72, 494, t, "brick");
  K.air(314, t - 60, 486, t - 34), K.air(314, t - 31, 486, t), K.wall(314, t - 60, 486, t, "brick");
  K.ladder(476, t - 34, t), K.air(470, t - 34, 482, t - 31);
  P_(K, 340, t, "p_crates"), P_(K, 380, t, "p_brazier"), P_(K, 430, t, "p_shelf"); // 식당
  P_(K, 340, t - 34, "p_lectern"), P_(K, 380, t - 34, "p_shelf"), P_(K, 420, t - 34, "p_candles"); // 필사실
  K.tag(316, t - 31, 484, t, "rest"), K.tag(316, t - 60, 470, t - 34, "treasure");
  // 섬 속: 수련장 (넓은 방) · 종루 계단 굴
  room(K, 300, 780, 500, 800), climb(K, 492, t, 800, "ladder");
  for (const x of [330, 370, 430, 470]) P_(K, x, 800, "p_rack");
  K.tag(300, 780, 500, 800, "arena");
  room(K, 340, 820, 460, 836), climb(K, 452, 800, 836, "ladder");
  P_(K, 400, 836, "p_altar"), K.tag(340, 820, 460, 836, "treasure");
  K.crack(460, 826, 464, 836), K.air(464, 822, 490, 836), P_(K, 478, 836, "p_urn"), K.tag(464, 822, 490, 836, "treasure");
  dropTo(K, 350, 836, "rope");
  K.struct("대수도원", "쉼터·보물·전투", 280, t - 72, 520, 880);
}
function stupa(K) {
  const t = 720;
  nat(K, 600, 720, () => t, belly(600, 720, t, 70, 17), { flat: 1, fingers: 2 });
  mark(1);
  for (let y = t - 70; y < t; y++) { const w = Math.round(6 + (y - (t - 70)) * 0.38); K.rock(660 - w, y, 660 + w, y + 1); }
  mark(0);
  K.mat(630, t - 72, 690, t, "brick");
  K.air(648, t - 50, 672, t), K.wall(648, t - 50, 672, t, "brick");
  K.air(624, t - 12, 696, t);
  K.ladder(652, t - 50, t), K.air(654, t - 66, 666, t - 50), K.ladder(660, t - 66, t - 50);
  K.plank(648, 672, t - 50);
  P_(K, 662, t, "p_shelf"), P_(K, 660, t - 50, "p_crystal", { s: 2 });
  K.tag(650, t - 30, 670, t, "treasure"), K.tag(604, t - 14, 716, t, "arena");
  dropTo(K, 610, t, "rope");
  K.struct("탑 경당", "보물·전투", 600, t - 72, 720, 800);
}
function prayerWheel(K) {
  const t = 800;
  nat(K, 780, 900, () => t, belly(780, 900, t, 60, 19), { flat: 1, fingers: 2 });
  P_(K, 840, t, "p_wheel", { s: 1 });
  K.wind(826, 834, 700, t - 2, 460);
  K.tag(784, t - 14, 896, t, "arena");
  dropTo(K, 890, t, "rope");
  K.struct("기도 바퀴 섬", "바람·전투", 780, 786, 900, 862);
}
function herbHouse(K) {
  const t = 840;
  nat(K, 80, 230, () => t, belly(80, 230, t, 60, 23), { flat: 1, fingers: 3 });
  for (let y = t - 30; y < t; y++) { const hw = Math.floor(Math.sqrt(Math.max(0, 1 - ((t - y) / 30) ** 2)) * 56); hw > 2 && K.wall(150 - hw, y, 150 + hw, y + 1, "brick"); }
  mark(1);
  for (let a = 14; a <= 166; a += 3) { const r = (Math.PI * a) / 180; K.rock(Math.round(150 + Math.cos(r) * 58) - 1, Math.round(t - Math.sin(r) * 32) - 1, Math.round(150 + Math.cos(r) * 58) + 1, Math.round(t - Math.sin(r) * 32) + 1); }
  mark(0);
  for (const x of [110, 130, 160, 190]) P_(K, x, t, x % 40 ? "p_fern" : "p_flowers");
  K.heal(146, 154, t - 4, t);
  K.tag(100, t - 26, 200, t, "rest");
  dropTo(K, 220, t, "vine");
  K.struct("약초 온실 섬", "쉼터·회복", 80, t - 34, 230, 900);
}
function belfry(K) {
  const t = 420;
  nat(K, 440, 600, () => t, belly(440, 600, t, 90, 29), { flat: 1, fingers: 3 });
  // 종각: 기둥 넷 · 지붕 (지붕 위 = ▲)
  mark(1);
  for (const x of [480, 500, 540, 560]) K.rock(x, t - 34, x + 3, t - 4);
  for (let k = 0; k < 48; k++) K.rock(472 + k * 2, t - 40 - Math.min(k, 47 - k) * 0.25, 474 + k * 2, t - 34);
  mark(0);
  K.air(480, t - 4, 563, t);
  K.ladder(470, t - 42, t), K.rock(462, t - 42, 470, t - 40);
  K.prop(521, t - 34, "p_bell");
  K.peak(520, t - 46);
  K.tag(500, t - 60, 540, t - 46, "rest", { safe: 1 });
  room(K, 470, 432, 580, 446), climb(K, 574, t, 446, "ladder");
  P_(K, 520, 446, "p_statue"), P_(K, 490, 446, "p_candles"), K.tag(470, 432, 580, 446, "treasure");
  dropTo(K, 480, 446, "rope");
  K.zip(596, t - 4, 650, 646);
  K.struct("종각 섬", "▲ 위로·보물", 440, t - 60, 600, 510);
}
function hermit(K) {
  const t = 300;
  nat(K, 150, 290, () => t, belly(150, 290, t, 70, 31), { fingers: 3 });
  room(K, 176, 312, 262, 326), climb(K, 182, t, 326, "rope");
  P_(K, 220, 326, "p_candles", { s: 1 }), P_(K, 244, 326, "p_shelf"), K.tag(176, 312, 262, 326, "treasure");
  P_(K, 210, t, "p_cairn"), K.tag(154, t - 14, 286, t, "arena");
  dropTo(K, 250, 326, "rope");
  K.struct("은둔자 굴", "보물·전투", 150, 286, 290, 372);
}
function starStone(K) {
  const t = 260;
  nat(K, 760, 880, () => t, belly(760, 880, t, 60, 37), { fingers: 2 });
  for (const x of [780, 820, 860]) P_(K, x, t, "p_menhir");
  K.tag(764, t - 14, 876, t, "treasure");
  dropTo(K, 870, t, "rope");
  K.zip(764, t - 4, 590, 416);
  K.struct("별 보는 돌", "보물·짚라인", 760, 246, 880, 322);
}
function fallsRock(K) {
  const t = 560;
  nat(K, 860, 990, () => t, belly(860, 990, t, 80, 41), { flat: 1, fingers: 3 });
  K.air(900, t - 2, 950, t + 8), K.water(900, t, 950, t + 8);
  K.fallw(930, t + 8, 936, 794);
  P_(K, 880, t, "p_fern"), P_(K, 970, t, "p_flowers"), K.tag(864, t - 14, 898, t, "arena");
  dropTo(K, 972, t, "vine");
  K.struct("폭포 바위", "폭포·전투", 860, 546, 990, 640);
}
// 작은 이끼 디딤섬 (모양·높이 제각각)
function stepsMore(K) {
  // 더 채우는 섬 (디딤섬보다 나중에 지어 밧줄이 그 위에 닿는다): [x0, x1, 윗면, 두께, 밧줄 x, 이름, 소품]
  for (const [a, b, t, d, dx, name, props] of [
    [900, 980, 700, 28, 960, "향 피우는 바위", ["p_brazier", "p_candles"]], [44, 104, 240, 24, 92, "구름 위 돌탑", ["p_cairn", "p_menhir"]],
    [460, 540, 160, 26, 470, "새벽 종 바위", ["p_bell", "p_flags"]], [200, 270, 460, 24, 210, "기도 깃발 섬", ["p_flags", "p_fern"]],
    [820, 890, 140, 24, 830, "독수리 바위", ["p_nest", "p_bones"]],
  ]) {
    nat(K, a, b, () => t, belly(a, b, t, d, a % 67), { flat: 1, fingers: 2 });
    props.forEach((k, j) => P_(K, a + 12 + j * (b - a - 24), t, k, { s: j % 3 }));
    K.tag(a + 4, t - 14, b - 4, t, (a >> 3) % 2 ? "treasure" : "arena");
    dropTo(K, dx, t, "rope");
    K.struct(name, "징검", a, t - 14, b, t + d);
  }
}
function steps(K) {
  const S = [[30, 100, 640, 30], [180, 250, 560, 26], [560, 620, 560, 24], [680, 740, 560, 26], [40, 110, 440, 28], [320, 400, 560, 26], [660, 720, 380, 24], [900, 980, 420, 28], [340, 410, 280, 26], [600, 670, 180, 26]];
  S.forEach(([a, b, t, d], i) => {
    nat(K, a, b, () => t, belly(a, b, t, d, 51 + i * 3), { fingers: 2 });
    P_(K, (a + b) >> 1, t, ["p_cairn", "p_flags", "p_fern", "p_candles", "p_menhir"][i % 5], { s: i % 3 });
    K.tag(a + 4, t - 14, b - 4, t, i % 3 ? "arena" : "treasure");
    dropTo(K, i === 7 ? a + 20 : b - 8, t, i % 2 ? "rope" : "vine");
    K.struct(["이끼 디딤섬", "돌탑 섬", "깃발 바위"][i % 3], "징검", a, t - 14, b, t + d);
  });
}
