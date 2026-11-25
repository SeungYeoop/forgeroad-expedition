// ══════════════════════════════════════════════════════════════
// 루트홀로우 「고목 뿌리 밑 세상」 — 모스바크 거목들의 뿌리가 땅속을 꽉 채운 곳
//   지도 = 칸(8px) 1024 × 1056 · 입구·출구 줄 600 · ▲ = 곧은뿌리 꼭대기 방 (x 514) · ▼ = 뿌리 심장 공동 바닥
//   층 띠 (위→아래), 구역마다 짜임이 전부 다르다
//     윗줄: 곧은뿌리 — 땅 위 거목에서 곧게 내려온 속 빈 뿌리, 층마다 쓰임이 다른 방 다섯(꼭대기 ▲) · 양옆 비스듬한 곁뿌리 굴
//     서쪽: 균사 숲 — 높이·크기가 제각각인 거대 버섯 갓을 덩굴과 튕김 갓으로 오른다
//     동쪽: 뿌리 매듭 미로 — 서로 엇갈리는 속 빈 뿌리 세 가닥, 매듭마다 굴방
//     광차 대로 대신: 뿌리 다리(줄 600) — 협곡 위를 가로지르는 굵은 뿌리, 밑은 뿌리 심장으로 떨어진다
//     아랫줄: 포자 늪(물 · 수련 판자 · 독버섯) · 뿌리 심장(빛나는 뿌리 매듭 속 방, ▼)
//     맨 아래: 고목 무덤 — 뿌리에 감긴 옛 무덤 회랑
//   장치: 덩굴 · 튕김 버섯 갓 · 덩굴 그네 · 무너지는 판 · 금 간 벽 · 사다리 · 회복 샘
// ══════════════════════════════════════════════════════════════

const EN = 600;
function shaft(K, x, fu, fd, k = "ladder", m = null) {
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}
const P = (K, x, f, k, o) => K.prop(x, f, k, o);
// 바로 아래 바닥까지 덩굴 (갓·턱 가장자리에서)
function vineDown(K, x, f) {
  let y = f + 1;
  while (y < K.NY - 2 && K.get(x, y) === 1) y++;
  const top = y;
  while (y < K.NY - 2 && K.get(x, y) !== 1) y++;
  K.vine(x - 1, x + 2, Math.min(f, top) - 3, y);
}

export function roothollow(K) {
  taproot(K);
  mycelium(K);
  knotMaze(K);
  rootBridge(K);
  sporeBog(K);
  heart(K);
  tomb(K);
}

// ═══ 곧은뿌리: 속 빈 세로 뿌리, 방 다섯 (층마다 쓰임이 다르다) ═══
function taproot(K) {
  const X0 = 462, X1 = 566;
  // 뿌리 몸통 (위가 굵고 아래로 살짝 가늘어진다)
  for (let y = 24; y < 336; y++) {
    const t = (y - 24) / 312, w = Math.round(6 * t);
    K.mat(X0 - 8 + w, y, X1 + 8 - w, y + 1, "wood");
  }
  const F = [[84, 48], [142, 46], [198, 44], [256, 46], [320, 50]];
  for (const [f, h] of F) (K.air(X0 + 6, f - h, X1 - 6, f), K.wall(X0 + 6, f - h, X1 - 6, f, "wood"));
  // 꼭대기: 거목 밑동으로 오르는 방 (▲)
  K.peak(514, 84);
  P(K, 484, 84, "p_roots"), P(K, 544, 84, "p_shroom", { s: 1 });
  K.tag(X0 + 6, 36, X1 - 6, 84, "rest", { safe: 1 });
  // 2층: 뿌리 저장고 (항아리·상자, 걸침 판)
  K.plank(X0 + 6, X0 + 46, 120), K.ladder(X0 + 10, 120, 142);
  P(K, 478, 120, "p_urn"), P(K, 500, 142, "p_crates", { s: 1 }), P(K, 540, 142, "p_urn");
  K.tag(X0 + 6, 96, X1 - 6, 142, "treasure");
  // 3층: 버섯 재배실 (버섯 줄)
  for (const x of [482, 500, 520, 540]) P(K, x, 198, "p_shroom", { s: x % 3 });
  K.heal(508, 520, 194, 198);
  K.tag(X0 + 6, 154, X1 - 6, 198, "rest");
  // 4층: 딱정벌레 둥지 (둥지·뼈, 바닥 가운데 꺼진 판)
  K.air(500, 256, 528, 262), K.crumble(500, 514, 256), K.plank(514, 528, 256);
  P(K, 480, 256, "p_nest"), P(K, 548, 256, "p_bones");
  K.tag(X0 + 6, 210, X1 - 6, 256, "arena");
  // 5층: 밑동 홀 (넓다, 양옆으로 곁뿌리)
  K.tag(X0 + 6, 270, X1 - 6, 320, "arena"), P(K, 514, 320, "p_log");
  // 층 사이 사다리 (번갈아)
  shaft(K, 546, 84, 142, "ladder", "wood"), shaft(K, 482, 142, 198, "ladder", "wood"), shaft(K, 546, 198, 256, "ladder", "wood"), shaft(K, 482, 256, 320, "ladder", "wood");
  // 곁뿌리 굴: 3층 서쪽 → 균사 숲 꼭대기, 4층 동쪽 → 매듭 미로
  K.air(X0 - 2, 188, X0 + 7, 198);
  K.wiggle([[X0, 198], [400, 250], [340, 300]], 9, 1, "wood");
  K.air(X1 - 7, 246, X1 + 2, 256);
  K.wiggle([[X1, 256], [640, 300], [700, 330]], 9, 1, "wood");
  // 5층 아래: 뿌리털 덩굴로 균사 숲·대로로
  K.air(X0 - 2, 310, X0 + 7, 320), K.air(X1 - 7, 310, X1 + 2, 320);
  // 밑동 아래 뿌리털 굴: 곧은뿌리 밑에서 대로까지 트인 공동 (뿌리털이 늘어졌다)
  K.sell(514, 460, 92, 140, 2.4, -1, 0.06);
  K.air(430, 560, 600, 600);
  K.rock(X0 - 24, 320, X0, 324), K.rock(X1, 320, X1 + 24, 324);
  for (const [x, y, L] of [[476, 330, 60], [500, 336, 90], [536, 334, 40], [552, 330, 110]]) K.vine(x, x + 2, y, y + L);
  K.tag(440, 540, 590, 600, "arena");
  K.rock(X0 + 6, 320, X1 - 6, 323), K.mat(X0 + 6, 320, X1 - 6, 323, "wood");
  shaft(K, 514, 320, EN, "ladder");
  K.struct("곧은뿌리", "▲ 모스바크로 · 쉼터·보물", X0 - 8, 24, X1 + 8, 336);
}

// ═══ 균사 숲 (서쪽): 거대 버섯 갓 ═══
function mycelium(K) {
  K.sell(232, 446, 196, 156, 3.2, -1, 0.05);
  K.air(36, 560, 430, 600);
  K.rock(30, EN, 440, 612);
  // 갓: [가운데, 윗면, 반폭] — 크기·높이 제각각
  const caps = [[96, 548, 20], [176, 512, 30], [104, 462, 18], [252, 452, 36], [344, 498, 22], [318, 396, 28], [196, 370, 22], [388, 340, 18], [120, 410, 14], [252, 318, 16]];
  for (const [cx, f, w] of caps) {
    // 줄기: 뒤에 선 굵은 균사 기둥 (밑동이 부푼다)
    let fl = f + 4;
    while (fl < EN && K.get(cx, fl) !== 1) fl++;
    for (let y = f + 3; y < fl; y++) {
      const t = (y - f) / Math.max(1, fl - f), hw = Math.round(2 + Math.max(0, t - 0.75) * 16 + (w > 25 ? 1 : 0));
      K.wall(cx - hw, y, cx + hw + 1, y + 1, "wood");
    }
    for (let x = cx - w; x <= cx + w; x++) {
      const d = Math.abs(x - cx) / w, th = Math.round(5 - d * 3), up = Math.round((1 - d * d) * 6);
      K.rock(x, f - up, x + 1, f - up + th + 1);
      K.mat(x, f - up, x + 1, f - up + th + 1, "leaf");
    }
  }
  // 덩굴: 갓 가장자리에서 아래 바닥까지 (엇갈린 쪽)
  caps.forEach(([cx, f, w], i) => vineDown(K, i % 2 ? cx + w + 2 : cx - w - 2, f));
  // 튕김 갓 (바닥에서 높은 갓으로)
  K.bounce(280, 292, EN), K.bounce(60, 70, EN);
  // 곧은뿌리 곁뿌리 끝 → 꼭대기 갓
  K.rock(330, 300, 352, 304);
  for (const [cx, f, s] of [[176, 512, 1], [252, 452, 2], [318, 396, 0], [196, 370, 1]]) P(K, cx + 8, f - 3, "p_shroom", { s });
  P(K, 140, EN, "p_shroom", { s: 2 }), P(K, 230, EN, "p_fern"), P(K, 380, EN, "p_shroom", { s: 1 }), P(K, 120, 410, "p_nest");
  K.tag(40, 570, 420, EN, "arena"), K.tag(220, 430, 290, 452, "arena"), K.tag(240, 300, 266, 318, "treasure"), K.tag(104, 396, 136, 410, "treasure");
  K.hall(0, 40, EN, 10);
  K.tag(4, EN - 12, 60, EN, "rest", { safe: 1 });
  K.struct("균사 숲", "전투·보물", 36, 290, 430, 612);
}

// ═══ 뿌리 매듭 미로 (동쪽): 엇갈린 속 빈 뿌리 세 가닥, 매듭마다 굴방 ═══
function knotMaze(K) {
  const roots = [
    [[700, 330], [860, 300], [990, 380]],
    [[700, 330], [606, 400], [760, 480], [900, 440], [1000, 520]],
    [[860, 300], [780, 380], [900, 500], [990, 590]],
    [[990, 380], [920, 430]],
  ];
  for (const pts of roots) {
    // 뿌리 껍질 (굴 둘레 나무)
    for (let k = 0; k + 1 < pts.length; k++) {
      const [xa, ya] = pts[k], [xb, yb] = pts[k + 1], n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
      for (let i = 0; i <= n; i++) {
        const x = xa + i * dir, f = Math.round(ya + ((yb - ya) * i) / Math.max(1, n));
        K.mat(x - 1, f - 13, x + 2, f + 4, "wood");
      }
    }
    K.wiggle(pts, 9, 0.8, "wood");
  }
  // 매듭 굴방 (크기·쓰임이 다르다)
  const knots = [[700, 330, 22, 11, "rest"], [860, 300, 18, 10, "arena"], [990, 380, 14, 10, "treasure"], [760, 480, 24, 12, "arena"], [900, 440, 16, 9, "treasure"], [780, 380, 20, 10, "arena"], [606, 400, 14, 9, "treasure"]];
  for (const [x, y, rx, ry, role] of knots) {
    K.ell(x, y - ry, rx, ry), K.wall(x - rx, y - ry * 2, x + rx, y, "wood");
    K.tag(x - rx + 2, y - ry * 2, x + rx - 2, y, role);
  }
  P(K, 700, 330, "p_shroom", { s: 1 }), P(K, 990, 380, "p_urn"), P(K, 900, 440, "p_crates"), P(K, 606, 400, "p_nest"), P(K, 760, 480, "p_bones"), P(K, 780, 380, "p_web");
  K.swing(830, 404, 18);
  K.struct("뿌리 매듭 미로", "전투·보물", 590, 280, 1010, 600);
}

// ═══ 뿌리 다리 (줄 600): 협곡을 가로지르는 굵은 뿌리 ═══
function rootBridge(K) {
  K.hall(430, 1024, EN, 12);
  // 협곡 (밑은 뿌리 심장)
  K.air(572, EN, 704, 760), K.air(572, 760, 612, 980);
  // 굵은 뿌리 다리: 가운데가 처진다, 한 곳이 썩었다
  for (let x = 568; x < 708; x++) {
    const s = Math.round(Math.sin(((x - 568) / 140) * Math.PI) * 3);
    if ((x >= 626 && x < 636) || x < 578) continue;
    K.rock(x, EN + s, x + 1, EN + s + 5), K.mat(x, EN + s, x + 1, EN + s + 5, "wood");
  }
  K.crumble(626, 636, EN + 3);
  // 곧은뿌리 밑 덩굴 (밑동 홀 양옆 턱 → 대로)
  vineDown(K, 450, 320), vineDown(K, 578, 320);
  P(K, 470, EN, "p_roots"), P(K, 760, EN, "p_shroom", { s: 2 }), P(K, 980, EN, "p_log");
  K.tag(960, EN - 12, 1022, EN, "rest", { safe: 1 });
  K.tag(720, EN - 12, 940, EN, "arena");
  K.struct("뿌리 다리", "대로·함정", 430, 588, 1024, 612);
}

// ═══ 포자 늪 (서쪽 아래): 물, 수련 판자, 독버섯 ═══
function sporeBog(K) {
  shaft(K, 64, EN, 690, "vine");
  K.sell(262, 764, 214, 92, 2.6, -1, 0.06);
  K.rock(40, 846, 484, 866);
  K.water(48, 808, 478, 846);
  // 수련 판자 (높이 조금씩 다르게), 몇은 썩었다
  for (const [a, b, f, c] of [[60, 92, 804, 0], [110, 136, 806, 1], [156, 190, 803, 0], [214, 236, 805, 1], [262, 300, 804, 0], [326, 348, 806, 1], [372, 410, 803, 0], [430, 470, 805, 0]]) c ? K.crumble(a, b, f) : K.plank(a, b, f);
  // 늪 위 둔덕 (뿌리 덩이)
  for (const [a, b, t] of [[96, 130, 760], [200, 250, 744], [320, 370, 756]]) (K.rock(a, t, b, 808), K.mat(a, t, b, 808, "wood"));
  for (const [a, t] of [[96, 760], [200, 744], [320, 756]]) K.vine(a - 3, a, t - 3, 846);
  P(K, 110, 760, "p_shroom", { s: 2 }), P(K, 228, 744, "p_shroom", { s: 1 }), P(K, 348, 756, "p_nest"), P(K, 300, 804, "p_fern");
  K.tag(200, 724, 250, 744, "treasure"), K.tag(60, 784, 470, 804, "arena");
  K.struct("포자 늪", "헤엄·전투", 40, 672, 484, 866);
}

// ═══ 뿌리 심장 (동쪽 아래): 빛나는 뿌리 매듭, 속에 방, ▼ ═══
function heart(K) {
  K.sell(774, 858, 196, 132, 2.8, -1, 0.05);
  K.air(584, 944, 964, 980);
  K.rock(570, 980, 980, 1000);
  // 매듭 (나무 덩어리) + 속 방 + 문 굴
  K.ell(774, 870, 64, 52), K.mat(706, 814, 842, 926, "wood");
  K.ell(774, 870, 40, 26, -1), K.rock(734, 880, 814, 896);
  K.wall(736, 846, 812, 880, "wood");
  K.air(810, 870, 870, 880), K.rock(810, 880, 872, 884), K.mat(810, 880, 872, 884, "wood");
  K.stairway(872, 881, 900, 909, 3, "wood");
  P(K, 774, 880, "p_altar"), P(K, 756, 880, "p_roots"), P(K, 794, 880, "p_shroom", { s: 2 });
  K.tag(740, 852, 808, 880, "treasure");
  // 동쪽 턱 (매듭 문으로 오른다)
  K.rock(900, 910, 948, 914), K.mat(900, 910, 948, 914, "wood"), K.air(944, 896, 962, 980), K.ladder(951, 910, 980);
  // 협곡에서 내려오는 덩굴
  K.vine(574, 577, EN - 3, 980);
  K.deep(640, 980);
  for (const [x, s] of [[600, 2], [680, 1], [860, 2], [920, 0]]) P(K, x, 980, "p_shroom", { s });
  K.tag(590, 950, 700, 980, "arena"), K.tag(860, 950, 960, 980, "arena");
  K.struct("뿌리 심장", "▼ 아래로·보물", 576, 726, 972, 1000);
}

// ═══ 고목 무덤 (맨 아래 서쪽): 뿌리에 감긴 옛 무덤 회랑 ═══
function tomb(K) {
  shaft(K, 300, 846, 960);
  K.hall(90, 500, 960, 20), K.wall(90, 940, 500, 960, "brick"), K.mat(84, 934, 506, 966, "brick");
  for (const x of [140, 200, 260, 340, 400, 460]) K.wall(x, 940, x + 3, 960, "stem");
  for (const [x, k] of [[120, "p_sarcoph"], [180, "p_candles"], [230, "p_sarcoph"], [320, "p_skulls"], [370, "p_sarcoph"], [430, "p_urn"]]) P(K, x, 960, k);
  K.tag(92, 940, 498, 960, "arena");
  // 금 간 벽 뒤 옛 사제 무덤
  K.crack(86, 948, 90, 960);
  K.air(50, 942, 86, 960), K.wall(50, 942, 86, 960, "brick");
  P(K, 68, 960, "p_altar");
  K.tag(50, 942, 86, 960, "treasure");
  // 뿌리 심장 바닥으로 (뿌리 굴)
  K.wiggle([[500, 960], [540, 972], [580, 980]], 9, 0.6, "wood");
  K.struct("고목 무덤", "전투·보물", 50, 934, 506, 966);
}
