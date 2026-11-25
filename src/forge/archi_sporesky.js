// ══════════════════════════════════════════════════════════════
// 늪지 빛의 정원 (gm2_m2, 노랑) 「떠다니는 버섯 갓 군도」 — 늪 가스를 먹고 자라 하늘로 떠오른 거대 버섯들
//   섬 = 버섯 갓: 윗면은 완만한 둥근 지붕, 밑면은 주름(갓 밑 주름 굴), 가운데서 아래로 늘어진 대(줄기 속 사다리)
//   지도 = 칸 1024 × 1056 · 섬 길 줄 1000 · ▲ = 왕버섯 갓 꼭대기 (x 520)
//     섬 길: 서쪽 포자 나루 → 둥근 갓 섬 → 튕김 갓 → 고리 갓 섬(요정 고리) → 구름 → 주름 굴 섬 → 버섯 다리 → 동쪽 나루
//     위로: 갓마다 크기·높이·대 길이가 다르다 — 왕버섯(▲) · 쌍둥이 갓 · 구멍 난 갓 · 썩은 갓(무너지는 판) · 빛 포자 갓 · 거꾸로 갓
//   장치: 튕김 갓(통통) · 덩굴·밧줄 · 대 속 사다리 · 짚라인 · 무너지는 판 · 바람(포자 바람) · 회복 샘
// ══════════════════════════════════════════════════════════════
import { PL, jag, nat, room, climb, dropTo, rope_bridge, P_, mark, skyBegin, skyEnd } from "./archi_sky.js";

const F = 1000;
// 버섯 갓 섬: [x0, x1] 윗면 가운데 높이 t (둥근 지붕 dome칸), 두께 th, 대 길이 stem
function cap(K, x0, x1, t, dome, th, stem, s, o = {}) {
  const c = (x0 + x1) / 2, hw = (x1 - x0) / 2;
  const top = (x) => t + Math.round(dome * ((x - c) / hw) ** 2);
  const bot = (x) => t + dome + th - Math.round(Math.abs(Math.sin(x * 0.9 + s)) * 2);
  nat(K, x0, x1, top, bot, { fingers: 0, roll: 0.4, warp: 1.5, rough: 1, sh: 3 });
  K.mat(x0 - 2, t - 2, x1 + 2, t + dome + th + 2, "leaf");
  // 주름 (밑면 세로 홈, 그림만)
  for (let x = x0 + 6; x < x1 - 6; x += 5) K.wall(x, t + dome + th - 1, x + 1, t + dome + th + 3, "wood");
  // 대: 갓 밑 가운데에서 아래로 (속에 사다리)
  if (stem > 0) {
    const sx = Math.round(c), sw = o.sw ?? 5, y0 = t + dome + th;
    mark(1);
    for (let y = y0; y < y0 + stem; y++) { const w = sw + Math.round(Math.sin(y * 0.1 + s) * 1); K.rock(sx - w, y, sx + w, y + 1); }
    mark(0);
    K.mat(sx - sw - 2, y0, sx + sw + 2, y0 + stem, "wood");
  }
  return { c: Math.round(c), top, foot: t + dome + th + stem };
}

export function sporesky(K) {
  skyBegin(K);
  road(K);
  caps(K);
  skyEnd(K);
}
sporesky.own = 1;

function road(K) {
  nat(K, 0, 80, () => F, jag(PL([[0, 1042], [40, 1036], [80, 1006]]), 1.2, 3), { flat: 1, fingers: 2 });
  P_(K, 20, F, "p_shroom", { s: 2 }), P_(K, 52, F, "p_lamp");
  K.tag(2, F - 14, 70, F, "rest", { safe: 1 });
  K.struct("포자 나루", "출구", 0, 986, 80, 1042);
  rope_bridge(K, 80, 110, F, 3, 0, 0);
  nat(K, 110, 270, () => F, jag(PL([[110, 1006], [150, 1036], [200, 1044], [270, 1006]]), 1.6, 5), { flat: 1, fingers: 3 });
  K.mat(110, F, 270, 1044, "leaf");
  room(K, 140, 1010, 240, 1022), climb(K, 146, F, 1022, "vine");
  P_(K, 190, 1022, "p_shroom", { s: 2 }), K.tag(140, 1010, 240, 1022, "treasure"), K.tag(114, F - 14, 266, F, "arena");
  for (const x of [130, 200, 250]) P_(K, x, F, "p_shroom", { s: x % 3 });
  K.struct("둥근 갓 섬", "보물·전투", 110, 986, 270, 1046);
  K.bounce(276, 292, F + 6), K.rock(270, F + 6, 300, F + 10), K.mat(270, F + 6, 300, F + 10, "leaf");
  nat(K, 300, 480, () => F, jag(PL([[300, 1006], [340, 1040], [420, 1046], [480, 1006]]), 1.6, 7), { flat: 1, fingers: 3 });
  for (let k = 0; k < 8; k++) P_(K, 360 + Math.round(Math.cos((k / 8) * Math.PI * 2) * 30), F, "p_shroom", { s: k % 3 });
  P_(K, 390, F, "p_font"), K.heal(386, 394, F - 4, F);
  K.tag(302, F - 14, 476, F, "rest", { safe: 1 });
  K.struct("고리 갓 섬", "쉼터·회복", 300, 986, 480, 1046);
  K.cloud(480, 510, F);
  nat(K, 510, 700, () => F, jag(PL([[510, 1006], [560, 1044], [640, 1048], [700, 1006]]), 1.6, 9), { flat: 1, fingers: 3 });
  for (let x = 530; x < 690; x += 18) K.air(x, 1008, x + 10, 1030);
  K.air(526, 1008, 690, 1016);
  climb(K, 600, F, 1016, "ladder");
  P_(K, 560, 1016, "p_nest"), P_(K, 640, 1016, "p_urn"), K.tag(526, 1008, 690, 1016, "treasure"), K.tag(514, F - 14, 696, F, "arena");
  K.struct("주름 굴 섬", "보물·전투", 510, 986, 700, 1050);
  for (let x = 700; x < 760; x += 5) K.plank(x, x + 5, F + Math.round(Math.sin(((x - 700) / 60) * Math.PI) * 4));
  nat(K, 760, 1024, () => F, jag(PL([[760, 1006], [820, 1038], [920, 1046], [1024, 1032]]), 1.4, 11), { flat: 1, fingers: 3 });
  room(K, 800, 1010, 900, 1022, "wood"), climb(K, 806, F, 1022, "ladder", "wood");
  P_(K, 850, 1022, "p_crates", { s: 1 }), K.tag(800, 1010, 900, 1022, "treasure");
  K.tag(966, F - 14, 1022, F, "rest", { safe: 1 }), K.tag(780, F - 14, 940, F, "arena");
  K.struct("동쪽 나루", "출구·보물", 760, 986, 1024, 1046);
}

// ═══ 갓 섬들 (아래부터 위로: 아래 갓이 먼저 지어져야 대·밧줄이 닿는다) ═══
function caps(K) {
  // 아래 줄
  const A = cap(K, 120, 260, 840, 6, 8, 40, 1);
  shaft(K, A.c, A.top(A.c), A.foot - 2), dropTo(K, A.c, A.foot - 2, "vine");
  P_(K, 150, A.top(150), "p_shroom", { s: 2 }), K.tag(140, 826, 240, 846, "arena");
  K.struct("작은 갓", "전투", 120, 830, 260, 900);
  const B = cap(K, 330, 470, 800, 8, 10, 60, 2);
  shaft(K, B.c, B.top(B.c), B.foot - 2), dropTo(K, B.c, B.foot - 2, "rope");
  K.tag(350, 790, 450, 808, "arena"), P_(K, 360, B.top(360), "p_nest");
  K.struct("쌍둥이 갓 (서)", "전투", 330, 790, 470, 880);
  const B2 = cap(K, 480, 580, 760, 6, 8, 0, 3);
  dropTo(K, 560, B2.top(560) + 14, "rope");
  K.tag(490, 750, 570, 766, "treasure"), P_(K, 530, B2.top(530), "p_urn");
  K.struct("쌍둥이 갓 (동)", "보물", 480, 750, 580, 790);
  const C = cap(K, 600, 770, 820, 8, 12, 50, 4);
  shaft(K, C.c, C.top(C.c), C.foot - 2), dropTo(K, C.c, C.foot - 2, "rope");
  // 구멍 난 갓: 가운데 큰 구멍 (빠지면 밑 갓으로)
  K.air(630, 818, 644, 840);
  K.tag(700, 812, 760, 826, "arena"), P_(K, 740, C.top(740), "p_shroom", { s: 1 });
  K.struct("구멍 난 갓", "전투·함정", 600, 810, 770, 900);
  const D = cap(K, 860, 990, 860, 6, 8, 40, 5);
  shaft(K, D.c, D.top(D.c), D.foot - 2), dropTo(K, D.c, D.foot - 2, "vine");
  dropTo(K, 982, D.top(982), "rope");
  K.tag(870, 850, 980, 866, "treasure"), P_(K, 900, D.top(900), "p_crates");
  K.struct("빛 포자 갓", "보물", 860, 850, 990, 916);
  // 가운데 줄
  const E = cap(K, 60, 200, 620, 8, 10, 60, 6);
  shaft(K, E.c, E.top(E.c), E.foot - 2), dropTo(K, E.c, E.foot - 2, "rope");
  K.tag(80, 610, 180, 628, "arena"), P_(K, 90, E.top(90), "p_shroom", { s: 2 });
  K.struct("높은 갓", "전투", 60, 610, 200, 700);
  const G = cap(K, 260, 420, 580, 10, 12, 80, 7);
  shaft(K, G.c, G.top(G.c), G.foot - 2), dropTo(K, G.c, G.foot - 2, "rope");
  // 썩은 갓: 가장자리 판자가 무너진다
  K.crumble(250, 262, 592), K.crumble(418, 430, 592);
  K.bounce(300, 312, G.top(306)), K.tag(320, 570, 380, 586, "treasure");
  K.struct("썩은 갓", "보물·함정", 250, 570, 430, 690);
  const H = cap(K, 560, 700, 620, 6, 10, 70, 8);
  shaft(K, H.c, H.top(H.c), H.foot - 2), dropTo(K, H.c, H.foot - 2, "rope");
  K.wind(586, 594, 480, H.top(590), 480);
  K.tag(600, 612, 660, 626, "arena");
  K.struct("포자 바람 갓", "바람·전투", 560, 610, 700, 710);
  const I = cap(K, 790, 950, 560, 8, 12, 110, 9);
  shaft(K, I.c, I.top(I.c), I.foot - 2), dropTo(K, I.c, I.foot - 2, "rope");
  dropTo(K, 798, I.top(798), "rope");
  K.tag(820, 550, 920, 566, "rest"), P_(K, 880, I.top(880), "p_shroom", { s: 2 });
  K.struct("긴 대 갓", "쉼터", 790, 550, 950, 690);
  // 위 줄
  const W = cap(K, 420, 620, 300, 14, 14, 100, 10, { sw: 7 });
  shaft(K, W.c, W.top(W.c), W.foot - 2), dropTo(K, W.c, W.foot - 2, "rope");
  K.peak(W.c, W.top(W.c));
  P_(K, W.c - 20, W.top(W.c - 20), "p_shroom", { s: 2 }), P_(K, W.c + 24, W.top(W.c + 24), "p_shroom", { s: 2 });
  K.tag(W.c - 14, 286, W.c + 14, 300, "rest", { safe: 1 });
  room(K, 460, 332, 580, 344), climb(K, 470, W.top(470), 344, "vine");
  P_(K, 520, 344, "p_altar"), K.tag(460, 332, 580, 344, "treasure");
  K.struct("왕버섯", "▲ 위로·보물", 420, 290, 620, 430);
  const X = cap(K, 140, 280, 380, 8, 10, 60, 11);
  shaft(K, X.c, X.top(X.c), X.foot - 2), dropTo(K, X.c, X.foot - 2, "rope");
  K.tag(160, 370, 260, 388, "arena");
  K.zip(276, 378, 424, 310);
  K.struct("서쪽 갓", "전투·짚라인", 140, 370, 280, 460);
  const Y = cap(K, 720, 880, 360, 8, 10, 80, 12);
  shaft(K, Y.c, Y.top(Y.c), Y.foot - 2), dropTo(K, Y.c, Y.foot - 2, "rope");
  K.tag(740, 350, 860, 366, "treasure");
  K.zip(724, 358, 616, 312);
  K.struct("동쪽 갓", "보물·짚라인", 720, 350, 880, 460);
  // 작은 갓들 (대 없이 떠 있다, 빈 하늘을 채운다): 아래 갓까지 밧줄
  for (const [a, b, t, dx, k] of [[30, 100, 720, 40, "p_shroom"], [270, 330, 700, 280, "p_nest"], [560, 620, 680, 570, "p_shroom"], [960, 1010, 720, 990, "p_bones"], [300, 360, 470, 310, "p_flowers"], [650, 710, 470, 660, "p_shroom"], [40, 100, 280, 60, "p_crystal"], [640, 700, 240, 650, "p_shroom"]]) {
    const c = cap(K, a, b, t, 3, 6, 0, a % 13);
    P_(K, (a + b) >> 1, c.top((a + b) >> 1), k, { s: a % 3 });
    K.tag(a + 4, t - 12, b - 4, t + 2, (a >> 3) % 2 ? "treasure" : "arena");
    dropTo(K, dx, c.top(dx), "vine");
    K.struct("작은 갓", "징검", a, t - 12, b, t + 12);
  }
  // 거꾸로 갓: 대가 위로 솟고 갓이 아래 (대 꼭대기 전망)
  const Z = cap(K, 900, 1000, 220, 4, 8, 0, 13);
  mark(1); for (let y = 160; y < 220; y++) K.rock(946, y, 954, y + 1); mark(0);
  K.mat(944, 160, 956, 220, "wood");
  K.air(944, 210, 956, 222);
  K.ladder(958, 160, Z.top(958));
  P_(K, 950, 160, "p_lamp"), K.tag(944, 146, 956, 160, "treasure");
  dropTo(K, 920, Z.top(920), "rope");
  K.struct("거꾸로 갓", "보물", 900, 146, 1000, 240);
}
function shaft(K, x, fu, fd) {
  K.air(x - 1, fu, x + 2, fd);
  K.plank(x - 1, x + 2, fu);
  K.ladder(x, fu, fd);
}
