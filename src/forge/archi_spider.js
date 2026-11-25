// ══════════════════════════════════════════════════════════════
// 이끼 그림자 심연 (gm1_2, 노랑) 「거미 여왕의 둥지」 — 루트홀로우 뿌리 밑, 거미들이 명주실로 엮은 땅속
//   지도 = 칸 1024 × 1056 · 입구·출구 줄 600 · ▲ = 빛 구멍 (x 760) · ▼ = 여왕의 방 바닥
//     고치 숲(서쪽 위): 천장에서 명주실로 매달린 고치 방들 — 실을 타고 고치에서 고치로
//     거미줄 대공동(동쪽 위): 높이가 다른 줄 판 다섯 가닥을 명주실이 잇고, 가운데 여왕의 옛 둥지 · 맨 위 빛 구멍(▲)
//     줄 친 굴(줄 600): 거미줄 바닥(밟으면 찢어진다) 위로 건너는 굴
//     알 무덤(서쪽 아래): 크기가 다른 알 방들이 좁은 굴로 엉켜 있다
//     독 웅덩이(동쪽 아래): 독물 위 줄 다리 · 웅덩이 속 굴
//     여왕의 방(맨 아래): 둥근 지붕 큰 방, 바닥 가운데 ▼
//   장치: 명주실(밧줄) · 짚라인 · 무너지는 판(찢어지는 줄) · 덩굴 그네 · 금 간 벽 · 간헐천(독 거품) · 회복 샘
// ══════════════════════════════════════════════════════════════

const EN = 600;
const P = (K, x, f, k, o) => K.prop(x, f, k, o);
function shaft(K, x, fu, fd, k = "ladder", m = null) {
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}
// 줄 판: 찢어지는 곳이 every번째마다
function strand(K, a, b, f, every = 0, off = 0) {
  for (let x = a, i = 0; x < b; x += 5, i++) every && (i + off) % every === every - 1 ? K.crumble(x, Math.min(b, x + 5), f) : K.plank(x, Math.min(b, x + 5), f);
}

export function spider(K) {
  cocoonGrove(K);
  webHall(K);
  webTunnel(K);
  eggTomb(K);
  venomPools(K);
  queenRoom(K);
}

// ═══ 고치 숲: 매달린 고치 방 ═══
function cocoonGrove(K) {
  K.sell(270, 300, 210, 190, 2.6, -1, 0.05);
  K.air(66, 410, 484, 480);
  K.rock(56, 480, 490, 500);
  // 고치: [가운데 x, 꼭대기 y, 반폭, 높이] — 천장에서 실로 매달렸다, 속이 빈 방
  const C = [[130, 200, 22, 34, "treasure"], [210, 150, 18, 30, "arena"], [300, 230, 26, 38, "arena"], [390, 170, 20, 30, "treasure"], [180, 320, 20, 30, "rest"], [350, 340, 24, 32, "arena"]];
  for (const [cx, top, hw, h, role] of C) {
    for (let y = 0; y < h; y++) {
      const w = Math.round(hw * Math.sin(((y + 2) / (h + 2)) * Math.PI) ** 0.6);
      K.rock(cx - w, top + y, cx + w, top + y + 1), K.mat(cx - w, top + y, cx + w, top + y + 1, "leaf");
    }
    const f = top + h - 8;
    K.air(cx - hw + 6, top + 8, cx + hw - 6, f), K.wall(cx - hw + 6, top + 8, cx + hw - 6, f, "wood");
    K.air(cx - 2, top, cx + 2, top + 8), K.plank(cx - 2, cx + 2, top);
    // 천장에서 늘어진 실 (고치 꼭대기까지) + 고치 밑에서 아래로 늘어진 실
    K.rope(cx, 100 - 3, top);
    K.air(cx + hw - 10, f, cx + hw - 6, top + h), K.rope(cx + hw - 8, f - 3, 480);
    P(K, cx - 4, f, role === "treasure" ? "p_urn" : "p_bones", { s: 1 }), P(K, cx + 6, f, "p_web");
    K.tag(cx - hw + 6, top + 8, cx + hw - 6, f, role);
  }
  // 천장 가로 실 (고치 꼭대기 실들을 잇는 천장 줄길)
  K.air(100, 96, 420, 114), strand(K, 100, 420, 104, 7, 2);
  for (const x of [100, 260, 418]) K.rope(x, 101, 480);
  P(K, 120, 480, "p_web"), P(K, 300, 480, "p_bones", { s: 2 }), P(K, 440, 480, "p_skulls");
  K.tag(70, 466, 480, 480, "arena");
  shaft(K, 80, 480, EN, "rope"), shaft(K, 470, 480, EN, "ladder");
  K.struct("고치 숲", "보물·전투·쉼터", 56, 96, 490, 500);
}

// ═══ 거미줄 대공동: 줄 판 다섯 가닥 + 옛 둥지 + 빛 구멍(▲) ═══
function webHall(K) {
  K.sell(764, 330, 230, 236, 2.4, -1, 0.05);
  K.air(548, 470, 994, 566);
  K.rock(984, 360, 1000, 430);
  K.rock(530, 566, 1000, 580);
  // 줄 판 (높이·길이 제각각, 찢어지는 곳)
  const S = [[560, 700, 500, 6, 1], [660, 860, 440, 5, 3], [820, 980, 380, 6, 0], [600, 760, 320, 5, 2], [760, 940, 250, 7, 4], [650, 820, 180, 6, 1]];
  for (const [a, b, f, e, o] of S) strand(K, a, b, f, e, o);
  // 명주실: 위아래 줄 판을 잇는다 (겹치는 곳)
  for (const [x, a, b] of [[690, 440, 500], [570, 500, 566], [840, 380, 440], [700, 320, 440], [880, 250, 380], [740, 180, 320], [800, 180, 250], [960, 380, 566]]) K.rope(x, a - 3, b);
  // 옛 둥지 (가운데 떠 있는 실 뭉치 섬)
  for (let x = 726; x < 806; x++) {
    const d = Math.round(Math.sin(((x - 726) / 80) * Math.PI) * 14);
    K.rock(x, 380, x + 1, 382 + d), K.mat(x, 380, x + 1, 382 + d, "leaf");
  }
  K.rope(766, 320 - 3, 380);
  P(K, 750, 380, "p_nest"), P(K, 780, 380, "p_bones", { s: 2 }), K.tag(730, 366, 802, 380, "treasure");
  // 빛 구멍 (▲): 천장 굴 위 작은 방
  K.air(744, 52, 778, 96), K.air(756, 96, 766, 120), K.rock(744, 76, 778, 80), K.air(758, 76, 764, 80), K.plank(758, 764, 76);
  K.rope(760, 76 - 3, 180);
  K.peak(761, 76);
  P(K, 752, 76, "p_roots"), P(K, 772, 76, "p_moss");
  K.tag(746, 62, 776, 76, "rest", { safe: 1 });
  K.zip(970, 376, 574, 496);
  K.swing(700, 104, 30);
  for (const [x, f] of [[620, 500], [760, 440], [900, 380], [660, 320], [880, 250]]) P(K, x, f, "p_web");
  K.tag(560, 486, 700, 500, "arena"), K.tag(660, 426, 860, 440, "arena"), K.tag(600, 306, 760, 320, "arena"), K.tag(820, 366, 980, 380, "rest");
  shaft(K, 980, 566, EN);
  K.struct("거미줄 대공동", "▲ 루트홀로우로 · 전투·보물", 530, 52, 1000, 580);
}

// ═══ 줄 친 굴 (줄 600): 거미줄 바닥 ═══
function webTunnel(K) {
  K.hall(0, 1024, EN, 12);
  for (const [a, b] of [[150, 210], [520, 580], [780, 840]]) (K.air(a, EN, b, EN + 30), strand(K, a, b, EN, 3, 1));
  for (const x of [120, 330, 460, 650, 720, 900]) P(K, x, EN - 12, "p_web");
  K.tag(2, EN - 12, 50, EN, "rest", { safe: 1 }), K.tag(970, EN - 12, 1022, EN, "rest", { safe: 1 });
  K.tag(240, EN - 12, 480, EN, "arena"), K.tag(600, EN - 12, 760, EN, "arena");
  // 찢어진 바닥 밑 구덩이: 사다리로 다시 오른다
  for (const [a] of [[150], [520], [780]]) K.ladder(a + 2, EN, EN + 30);
  K.struct("줄 친 굴", "입구·출구·함정", 0, EN - 12, 1024, EN + 30);
}

// ═══ 알 무덤 (서쪽 아래): 크기가 다른 알 방들 ═══
function eggTomb(K) {
  const E = [[100, 690, 26, 14, "arena"], [190, 720, 18, 11, "treasure"], [280, 680, 30, 15, "arena"], [380, 730, 22, 12, "treasure"], [140, 800, 32, 15, "arena"], [250, 830, 20, 11, "rest"], [350, 810, 28, 14, "arena"], [440, 860, 20, 10, "treasure"]];
  for (const [x, y, rx, ry, role] of E) {
    K.ell(x, y - ry, rx, ry), K.air(x - rx + 3, y - 4, x + rx - 3, y);
    for (let k = -1; k <= 1; k += 2) P(K, x + k * Math.round(rx / 2), y, "p_hive");
    K.tag(x - rx + 3, y - ry * 2, x + rx - 3, y, role);
  }
  // 잇는 굴 (평평하거나 완만히)
  for (const pts of [[[100, 690], [190, 720]], [[190, 720], [280, 690], [280, 680]], [[280, 680], [380, 730]], [[100, 690], [140, 730]], [[380, 730], [350, 760]], [[250, 830], [350, 810]], [[140, 800], [250, 830]], [[350, 810], [440, 860]]]) K.wiggle(pts, 9, 0.6);
  shaft(K, 140, 730, 800), shaft(K, 350, 730, 810);
  shaft(K, 100, EN, 690);
  K.crack(458, 848, 462, 860), K.air(462, 846, 496, 860), P(K, 480, 860, "p_crates", { s: 1 }), K.tag(462, 846, 496, 860, "treasure");
  K.struct("알 무덤", "보물·전투", 60, 650, 500, 880);
}

// ═══ 독 웅덩이 (동쪽 아래): 독물 위 줄 다리 ═══
function venomPools(K) {
  K.sell(760, 770, 210, 110, 2.8, -1, 0.05);
  K.rock(540, 850, 980, 886);
  K.water(560, 810, 960, 850, "water");
  for (const [a, b, t] of [[580, 620, 806], [680, 720, 800], [790, 830, 806], [890, 930, 802]]) K.rock(a, t, b, 850);
  strand(K, 620, 680, 780, 4, 0), strand(K, 720, 790, 776, 5, 2), strand(K, 830, 890, 782, 4, 1);
  for (const [x, a, b] of [[624, 780, 806], [716, 776, 800], [834, 782, 806], [886, 782, 802]]) K.ladder(x, a, b);
  K.geyser(650, 656, 760, 850), K.geyser(860, 866, 760, 850);
  P(K, 600, 806, "p_shroom", { s: 2 }), P(K, 700, 800, "p_skulls"), P(K, 810, 806, "p_shroom", { s: 1 }), P(K, 910, 802, "p_web");
  K.tag(580, 790, 930, 806, "arena");
  K.heal(700, 708, 796, 800);
  shaft(K, 600, EN, 806), shaft(K, 920, EN, 802);
  K.struct("독 웅덩이", "헤엄·전투", 540, 660, 980, 870);
}

// ═══ 여왕의 방 (맨 아래): 둥근 지붕, ▼ ═══
function queenRoom(K) {
  K.ell(530, 1000, 230, 90), K.rock(290, 1000, 770, 1020);
  K.air(300, 980, 760, 1000);
  // 방 둘레 알 더미 턱
  for (const [a, b, t] of [[320, 370, 990], [690, 740, 988], [430, 470, 994]]) K.rock(a, t, b, 1000);
  K.deep(530, 1000);
  P(K, 530, 1000, "p_nest"), P(K, 500, 1000, "p_bones", { s: 2 }), P(K, 560, 1000, "p_skulls"), P(K, 340, 990, "p_hive"), P(K, 710, 988, "p_hive");
  for (const x of [380, 460, 600, 680]) K.rope(x, 912, 975);
  K.tag(500, 986, 560, 1000, "rest", { safe: 1 }), K.tag(320, 970, 480, 990, "arena"), K.tag(580, 970, 740, 990, "arena");
  shaft(K, 440, 860, 994), shaft(K, 760, 850, 1000);
  K.struct("여왕의 방", "▼ 아래로", 290, 910, 770, 1020);
}
