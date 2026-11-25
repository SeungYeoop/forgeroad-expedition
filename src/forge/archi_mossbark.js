// ══════════════════════════════════════════════════════════════
// 모스바크 「이끼 거목 숲」 — 지표(natbp 손 설계) 위 하늘과 밑 땅속을 손으로 짓는다
//   하늘: 거목 넷 (생김새·오르는 길이 전부 다르다)
//     이끼 노목(서) — 줄기를 감은 덩굴 · 층층 수관 셋 · 나무 위 오두막
//     쌍둥이 거목 — 두 줄기를 높이가 다른 출렁다리 둘이 잇는다 · 사이에 덩굴 그네
//     협곡 거목(가운데, ▲) — 협곡 바닥에서 솟은 속 빈 줄기, 속 계단 방 넷 · 꼭대기 둥지 = ▲
//     부러진 거목(동) — 꺾인 꼭대기에서 짚라인으로 출구 숲까지
//   땅속:
//     이끼 묘지(서) — 지표 납골당 문 → 3층 지하 묘지(납골실 · 예배실 · 가라앉은 홀)
//     개울 지하 수로(가운데) — 협곡 연못 바닥 폭포 → 지하 개울 공동 (물살 · 징검돌)
//     버섯 사슴 굴(동) — 썩은 통나무 굴로 이은 둥근 굴방들, 사슴뿔 보물
//     지하 늪(맨 아래) — 판자 길 · 뿌리 둔덕 · 가운데 섬 ▼
// ══════════════════════════════════════════════════════════════

const P = (K, x, f, k, o) => K.prop(x, f, k, o);
function shaft(K, x, fu, fd, k = "ladder", m = null) {
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}

export function mossbark(K, o) {
  if (o.stage === "under") return under(K, o);
  return sky(K, o);
}

// ════════════ 하늘 ════════════
// 줄기: 밑동(지표 s)에서 top까지, 반폭 tw, 밑동 아래는 지나가는 굴
function trunk(K, cx, top, s, tw, flare = 6, S = () => s) {
  const H = s - top;
  for (let y = top; y < s + 12; y++) {
    // 밑동이 크게 부풀고, 위로 갈수록 가늘어지며, 줄기가 살짝 휘어 있다
    const t = Math.max(0, (y - (s - 40)) / 40), u = (y - top) / H;
    const w = Math.round(tw * (0.7 + 0.3 * u) + t * t * flare * 1.6), sw = Math.round(Math.sin(u * 3.1 + cx * 0.07) * 2);
    // 줄기는 그 자리 땅까지만 (비탈 밑으로 파고들지 않는다)
    for (let x = cx - w + sw; x < cx + w + sw; x++) y < S(x) + 2 && (K.rock(x, y, x + 1, y + 1), K.mat(x, y, x + 1, y + 1, "wood"));
    // 옹이 (작은 혹)
    (y * 7 + cx) % 53 === 0 && (K.rock(cx + w + sw, y - 1, cx + w + sw + 3, y + 2), K.mat(cx + w + sw, y - 1, cx + w + sw + 3, y + 2, "wood"));
  }
  // 겉뿌리: 밑동 양옆으로 땅을 움켜쥔다
  for (const d of [-1, 1]) for (let i = 0; i < flare + 6; i++) {
    const x = cx + d * (Math.ceil(tw + flare * 1.6 + 4) + i), g = S(x), y = g - Math.max(0, 2 - Math.floor(i / 3));
    K.rock(x, y, x + 1, g + 2), K.mat(x, y, x + 1, g + 2, "wood");
  }
  // 밑동 아치: 그 자리 땅 높이를 따라 판다 (비탈에서도 걸어서 지난다)
  const AW = Math.ceil(tw + flare * 1.6 + 4);
  for (let x = cx - AW; x < cx + AW; x++) {
    const g = S(x);
    K.air(x, g - 12, x + 1, g);
    x >= cx - tw && x < cx + tw && K.wall(x, g - 12, x + 1, g, "wood");
  }
}
// 수관 판 (잎 배가 아래로 늘어진다)
function canopy(K, x0, x1, f, depth = 6) {
  K.slab(x0, x1, f, 3, "leaf");
  K.belly(x0 + 2, x1 - 2, f + 3, depth + 4, "leaf");
  // 잎 뭉치: 수관 밑에 덩어리진 잎 (가장자리 안쪽, 덩굴 자리는 비운다)
  for (const [x, r] of [[x0 + 8, 3], [x1 - 8, 3], [(x0 + x1) >> 1, 5]]) {
    K.ell(x, f + 5, r + 2, r, 1, 0.15);
    K.mat(x - r - 3, f + 1, x + r + 3, f + 5 + r, "leaf");
  }
}
function sky(K, o) {
  const S = o.surfRow;
  // ── 이끼 노목 (x 210) ──
  {
    const cx = 210, s = S(cx), top = 300;
    trunk(K, cx, top, s, 7, 6, S);
    canopy(K, 168, 252, 300, 8), canopy(K, 150, 196, 356, 5), canopy(K, 226, 272, 404, 6);
    // 덩굴이 줄기를 감는다: 엇갈린 쪽으로 세 마디
    // 덩굴: 땅 → 두 낮은 수관 (줄기 양쪽), 낮은 수관 → 높은 수관 (수관 끝)
    K.vine(222, 225, 401, s), K.vine(197, 200, 353, s);
    K.vine(256, 259, 297, 404), K.vine(162, 165, 297, 356);
    // 오두막 (위 수관)
    K.rock(178, 280, 180, 294), K.rock(212, 280, 214, 294), K.rock(176, 278, 216, 281), K.mat(176, 278, 216, 300, "wood");
    K.wall(180, 281, 212, 300, "wood"), K.mat(172, 274, 220, 278, "leaf"), K.rock(172, 274, 220, 278);
    P(K, 190, 300, "p_crates"), P(K, 204, 300, "p_lamp");
    K.tag(180, 281, 212, 300, "treasure"), K.tag(226, 390, 272, 404, "arena"), K.tag(150, 342, 196, 356, "arena");
    K.struct("이끼 노목", "보물·전투", 150, 274, 272, s);
  }
  // ── 쌍둥이 거목 (x 352 · 418): 높이 다른 출렁다리 둘, 사이에 그네 ──
  {
    const a = 352, b = 418, sa = S(a), sb = S(b);
    trunk(K, a, 236, sa, 6, 6, S), trunk(K, b, 196, sb, 6, 6, S);
    canopy(K, 322, 382, 236, 7), canopy(K, 392, 446, 196, 7);
    canopy(K, 334, 370, 320, 4), canopy(K, 400, 436, 290, 4);
    // 줄기 사다리 (바깥쪽)
    K.air(a - 10, 240, a - 7, sa), K.ladder(a - 9, 236, sa);
    K.air(b + 7, 200, b + 10, sb), K.ladder(b + 8, 196, sb);
    // 출렁다리: 아래(320 ↔ 290), 위(236 ↔ 196 은 너무 가파르다 → 236 ↔ 236 끝턱)
    for (let x = 370, i = 0; x < 400; x += 4, i++) K.plank(x, x + 4, 318 - Math.round(((x - 370) / 30) * 28) + Math.round(Math.sin(((x - 370) / 30) * Math.PI) * 3));
    K.rock(382, 236, 392, 239), K.plank(382, 392, 236);
    K.ladder(390, 196, 236);
    K.swing(386, 250, 22);
    P(K, 340, 236, "p_nest"), P(K, 424, 196, "p_hive"), P(K, 350, 320, "p_shroom", { s: 1 });
    K.tag(322, 222, 382, 236, "arena"), K.tag(392, 182, 446, 196, "treasure");
    K.struct("쌍둥이 거목", "그네·보물", 318, 182, 450, Math.max(sa, sb));
  }
  // ── 협곡 거목 (x 560, ▲): 속 빈 줄기, 속 계단 방 넷 ──
  {
    const cx = 560, s = S(cx), top = 96, X0 = cx - 22, X1 = cx + 22;
    for (let y = top + 4; y < s + 2; y++) {
      const t = Math.max(0, (y - (s - 40)) / 40), w = Math.round(22 + t * t * 10);
      K.rock(cx - w, y, cx + w, y + 1), K.mat(cx - w, y, cx + w, y + 1, "wood");
    }
    // 밑동 문 (협곡 양쪽에서)
    K.air(cx - 34, s - 10, cx + 34, s), K.wall(cx - 22, s - 10, cx + 22, s, "wood");
    const F = [s - 10];
    while (F[F.length - 1] - 62 > top + 34) F.push(F[F.length - 1] - 62 + ((F.length * 13) % 11) - 5);
    for (let i = 1; i < F.length; i++) {
      const f = F[i], h = Math.min(28, F[i - 1] - f - 6);
      K.air(X0 + 4, f - h, X1 - 4, f), K.wall(X0 + 4, f - h, X1 - 4, f, "wood");
      const x = i % 2 ? X0 + 8 : X1 - 8;
      shaft(K, x, f, F[i - 1], "ladder", "wood");
      K.tag(X0 + 4, f - h, X1 - 4, f, i % 3 === 1 ? "arena" : i % 3 === 2 ? "treasure" : "rest");
      // 가지 문: 바깥 작은 턱 (전망)
      const sd = i % 2 ? 1 : -1, dx = sd > 0 ? X1 : X0 - 14;
      K.air(sd > 0 ? X1 - 4 : X0 - 1, f - 8, sd > 0 ? X1 + 1 : X0 + 4, f), K.rock(dx, f, dx + 14, f + 3), K.mat(dx, f, dx + 14, f + 3, "leaf");
    }
    const last = F[F.length - 1];
    shaft(K, cx, top + 4, last, "vine", "wood");
    canopy(K, cx - 46, cx + 46, top + 4, 10);
    K.peak(cx, top + 4);
    P(K, cx - 20, top + 4, "p_nest"), P(K, cx + 24, top + 4, "p_shroom", { s: 2 });
    K.tag(cx - 40, top - 12, cx + 40, top + 4, "rest", { safe: 1 });
    K.struct("협곡 거목", "▲ 정상", cx - 46, top - 10, cx + 46, s);
    // 쌍둥이 위 수관 → 협곡 거목 가지 (짚라인)
    K.zip(446, 190, X0 - 4, F[Math.min(3, F.length - 1)] - 4);
  }
  // ── 덩굴 장막 나무 (x 280): 가는 줄기, 늘어진 덩굴 커튼 사이로 오르는 수관 넷 ──
  {
    const cx = 280, s = S(cx);
    trunk(K, cx, 250, s, 4, 5, S);
    const L = [[262, 300, 250], [250, 276, 300], [290, 316, 336], [256, 282, 380], [288, 312, 430]];
    for (const [a, b, f] of L) canopy(K, a, b, f, 4);
    for (const [x, y0, y1] of [[248, 303, 380], [317, 339, 430], [254, 383, s], [313, 433, s], [298, 253, 336], [262, 253, 300]]) K.vine(x - 1, x + 2, y0 - 3, y1);
    P(K, 270, 250, "p_nest"), P(K, 300, 336, "p_hive"), P(K, 264, 380, "p_shroom", { s: 1 });
    K.tag(262, 236, 300, 250, "treasure"), K.tag(256, 366, 282, 380, "arena");
    // 노목 높은 수관 ↔ 장막 나무 ↔ 쌍둥이 (가지 판자 다리)
    for (let x = 252; x < 262; x += 3) K.plank(x, x + 3, 300);
    for (let x = 300; x < 322; x += 4) K.plank(x, x + 4, 250 - Math.round((x - 300) * 0.6));
    K.rock(318, 236, 324, 239), K.plank(318, 324, 236);
    K.struct("덩굴 장막 나무", "덩굴·보물", 246, 236, 320, s);
  }
  // ── 새집 나무 (x 700, 언덕 비탈): 층마다 새집 · 가지 끝 전망 ──
  {
    const cx = 700, s = S(cx);
    trunk(K, cx, 300, s, 6, 6, S);
    for (const [a, b, f] of [[676, 724, 300], [652, 690, 356], [712, 750, 410], [660, 694, 460]]) canopy(K, a, b, f, 5);
    for (const [x, y0, y1] of [[650, 359, 460], [752, 413, s], [658, 463, s], [726, 303, 410], [674, 303, 356]]) K.vine(x - 1, x + 2, y0 - 3, y1);
    for (const [x, f] of [[684, 300], [664, 356], [736, 410], [676, 460]]) P(K, x, f, "p_nest");
    K.tag(676, 286, 724, 300, "treasure"), K.tag(712, 396, 750, 410, "arena"), K.tag(652, 342, 690, 356, "arena");
    // 협곡 거목 가지 ↔ 새집 나무 (출렁다리)
    for (let x = 610, i = 0; x < 652; x += 4, i++) (i === 5 ? K.crumble : K.plank)(x, x + 4, 356 + Math.round(Math.sin(((x - 610) / 42) * Math.PI) * 4));
    K.struct("새집 나무", "보물·전투", 650, 286, 752, s);
  }
  // ── 부러진 거목 (x 820): 꺾인 꼭대기 → 짚라인 ──
  {
    const cx = 820, s = S(cx), top = 330;
    trunk(K, cx, top, s, 9, 8, S);
    // 꺾인 자리: 비스듬히 잘린 윗면 + 쓰러진 윗동이 옆 가지에 걸렸다
    for (let k = 0; k < 9; k++) K.air(cx - 9 + k * 2, top, cx - 7 + k * 2, top + 9 - k);
    for (let i = 0; i < 70; i++) K.rock(cx + 10 + i, top + 40 + Math.round(i * 0.45), cx + 11 + i, top + 46 + Math.round(i * 0.45)), K.mat(cx + 10 + i, top + 40 + Math.round(i * 0.45), cx + 11 + i, top + 46 + Math.round(i * 0.45), "wood");
    canopy(K, 788, 812, 372, 4), canopy(K, 776, 800, 420, 4);
    K.vine(cx - 18, cx - 16, top - 1, s - 1);
    K.vine(786, 788, 369, 420), K.vine(774, 776, 417, s);
    P(K, cx, top + 9, "p_nest"), P(K, 800, 372, "p_hive");
    K.tag(cx - 8, top - 10, cx + 8, top + 8, "treasure"), K.tag(776, 406, 800, 420, "arena");
    K.zip(cx + 2, top + 2, 970, S(970) - 4);
    K.struct("부러진 거목", "짚라인·보물", 770, top - 4, 900, s);
  }
}

// ════════════ 땅속 ════════════
function under(K, o) {
  const S = o.surfRow;
  // ── 이끼 묘지 (서): 지표 납골당 문 → 3층 ──
  {
    const gx = 150, s = S(gx);
    // 납골당 문: 지표 위 작은 돌집 + 계단 굴
    K.rock(gx - 12, s - 14, gx + 12, s - 12), K.mat(gx - 14, s - 16, gx + 14, s, "brick");
    K.rock(gx - 12, s - 12, gx - 10, s), K.rock(gx + 10, s - 12, gx + 12, s);
    K.air(gx - 10, s - 12, gx + 10, s), K.wall(gx - 10, s - 12, gx + 10, s, "brick");
    shaft(K, gx, s, 700, "ladder", "brick");
    K.mat(60, 660, 420, 830, "brick");
    // 1층 납골실: 벽마다 해골 선반 (낮은 칸막이)
    K.hall(70, 410, 700, 18), K.wall(70, 682, 410, 700, "brick");
    for (const x of [110, 170, 230, 290, 350]) K.rock(x, 682, x + 4, 692);
    for (const x of [90, 140, 200, 260, 320, 380]) P(K, x, 700, x % 3 ? "p_skulls" : "p_sarcoph");
    K.tag(72, 682, 408, 700, "arena");
    // 2층 예배실: 높은 방, 제단 · 촛불 · 걸침 회랑
    K.hall(80, 400, 760, 40), K.wall(80, 720, 400, 760, "brick");
    K.plank(80, 160, 736), K.plank(320, 400, 736), K.ladder(84, 736, 760), K.ladder(396, 736, 760);
    for (const x of [140, 200, 280, 340]) K.wall(x, 720, x + 3, 760, "stem");
    P(K, 240, 760, "p_altar"), P(K, 220, 760, "p_candles", { s: 1 }), P(K, 262, 760, "p_candles"), P(K, 120, 736, "p_lectern"), P(K, 360, 736, "p_shelf");
    K.heal(234, 246, 756, 760);
    K.tag(82, 720, 398, 760, "rest"), K.tag(80, 724, 160, 736, "treasure");
    shaft(K, 380, 700, 760, "ladder", "brick");
    // 3층 가라앉은 홀: 바닥에 물, 가라앉은 석관 위를 건넌다
    K.hall(70, 410, 820, 26), K.wall(70, 794, 410, 820, "brick");
    K.air(90, 820, 390, 828), K.water(90, 820, 390, 828);
    for (const [a, b] of [[96, 118], [140, 166], [190, 210], [236, 262], [290, 310], [336, 360]]) K.rock(a, 818, b, 828), K.mat(a, 818, b, 828, "brick");
    shaft(K, 100, 760, 818, "ladder", "brick");
    P(K, 250, 818, "p_sarcoph"), P(K, 200, 818, "p_urn");
    K.tag(72, 794, 408, 818, "arena");
    // 금 간 벽 뒤 이끼 왕 관
    K.crack(410, 806, 414, 820);
    K.air(414, 798, 450, 820), K.wall(414, 798, 450, 820, "brick");
    P(K, 432, 820, "p_sarcoph"), P(K, 442, 820, "p_candles");
    K.tag(414, 798, 450, 820, "treasure");
    K.struct("이끼 묘지", "전투·쉼터·보물", 60, 660, 450, 830);
  }
  // ── 개울 지하 수로 (가운데): 협곡 연못 바닥 폭포 → 지하 개울 공동 ──
  {
    K.sell(590, 800, 130, 70, 2.6, -1, 0.06);
    K.rock(450, 850, 730, 870);
    K.water(462, 830, 720, 850);
    // 연못 바닥에서 떨어지는 물길 (헤엄쳐 오른다)
    const px = 594, s = S(px);
    K.fallw(px - 2, s, px + 3, 760);
    // 징검돌 · 턱
    for (const [a, b, t] of [[470, 500, 826], [530, 556, 822], [610, 640, 824], [670, 700, 820]]) K.rock(a, t, b, 850);
    K.rock(470, 770, 520, 774), K.rock(660, 760, 712, 764);
    K.ladder(498, 770, 826), K.ladder(662, 760, 820);
    for (const [x, f, k] of [[484, 826, "p_fern"], [620, 824, "p_shroom"], [690, 820, "p_fern"], [490, 770, "p_nest"]]) P(K, x, f, k);
    K.tag(470, 756, 520, 770, "treasure"), K.tag(520, 800, 700, 822, "arena");
    // 묘지 3층 동쪽 → 수로 (굽은 굴)
    K.wiggle([[450, 820], [470, 826]], 9, 0);
    K.struct("개울 지하 수로", "헤엄·보물", 450, 730, 730, 870);
  }
  // ── 버섯 사슴 굴 (동): 둥근 굴방을 썩은 통나무 굴로 ──
  {
    const lx = 860, s = S(lx);
    // 지표 쓰러진 통나무 구멍 → 굴
    K.air(lx - 3, s - 2, lx + 3, s), shaft(K, lx, s, 690, "vine", "wood");
    const ch = [[860, 700, 34, 14, "rest"], [760, 760, 30, 16, "arena"], [982, 790, 26, 13, "treasure"], [820, 850, 40, 16, "arena"]];
    for (const [x, y, rx, ry, role] of ch) {
      K.ell(x, y - ry, rx, ry, -1, 0.06), K.air(x - rx + 4, y - 4, x + rx - 4, y);
      K.tag(x - rx + 4, y - ry * 2 + 2, x + rx - 4, y, role);
    }
    // 통나무 굴 (나무 뒷벽)
    K.wiggle([[830, 700], [770, 760]], 9, 0.6, "wood");
    K.wiggle([[890, 700], [936, 744], [982, 790]], 9, 0.6, "wood");
    K.wiggle([[760, 760], [800, 800], [850, 850]], 9, 0.6, "wood");
    K.wiggle([[982, 790], [922, 850], [856, 850]], 9, 0.6, "wood");
    // 수로 ↔ 사슴 굴
    K.wiggle([[712, 760], [732, 760], [760, 760]], 9, 0.5, "wood");
    P(K, 860, 700, "p_shroom", { s: 2 }), P(K, 744, 760, "p_bones", { s: 1 }), P(K, 982, 790, "p_bones", { s: 2 }), P(K, 800, 850, "p_shroom", { s: 1 }), P(K, 840, 850, "p_fern");
    K.struct("버섯 사슴 굴", "전투·보물", 720, 670, 960, 870);
  }
  // ── 뿌리 길 (지표 밑 얕은 층): 묘지 위 ↔ 수로 위, 뿌리가 천장을 뚫고 늘어졌다 ──
  {
    K.wiggle([[160, 660], [260, 650], [360, 664], [450, 652]], 9, 1.2, "wood");
    for (const [x, y] of [[200, 646], [300, 652], [410, 650]]) K.vine(x, x + 2, y - 9, y);
    K.ell(300, 648, 18, 9), P(K, 300, 657, "p_roots"), K.tag(284, 640, 316, 657, "treasure");
    shaft(K, 160, 660, 700, "ladder");
    K.wiggle([[450, 652], [500, 700], [530, 740]], 9, 1, "wood");
    K.struct("뿌리 길", "보물", 150, 636, 540, 744);
  }
  // ── 가라앉은 샘 (서쪽 아래): 맑은 샘 굴, 물속 보물 ──
  {
    K.ell(180, 890, 80, 26), K.rock(96, 900, 266, 920);
    K.air(110, 900, 250, 910), K.water(110, 900, 250, 910);
    K.rock(130, 896, 160, 900), K.rock(200, 896, 230, 900);
    P(K, 145, 896, "p_font"), P(K, 215, 896, "p_crystal", { s: 1 }), K.heal(176, 186, 906, 910);
    K.tag(110, 870, 250, 896, "rest");
    shaft(K, 240, 818, 896);
    K.struct("가라앉은 샘", "쉼터·회복", 96, 862, 266, 920);
  }
  // ── 사슴 굴 아래 뿌리 둥지 (동쪽 아래) ──
  {
    K.hall(866, 936, 918, 16), K.wall(866, 902, 936, 918, "wood"), K.wiggle([[850, 850], [884, 884]], 9, 0.5, "wood"), shaft(K, 884, 884, 918);
    P(K, 900, 918, "p_nest"), P(K, 880, 918, "p_bones", { s: 2 }), K.tag(866, 884, 934, 918, "treasure");
    K.struct("뿌리 둥지", "보물", 856, 880, 944, 920);
  }
  // ── 지하 늪 (맨 아래): 판자 길, 뿌리 둔덕, 가운데 섬 ▼ ──
  {
    K.air(90, 930, 960, 1012);
    for (let x = 90; x < 960; x++) {
      const v = Math.round(Math.sin(x * 0.04) * 5 + Math.sin(x * 0.011 + 1) * 6);
      v > 0 ? K.air(x, 930 - v, x + 1, 930) : K.rock(x, 930, x + 1, 930 - v);
    }
    K.rock(84, 1012, 966, 1026);
    K.water(96, 996, 954, 1012);
    for (let x = 100, i = 0; x < 950; x += 14 + ((i * 5) % 9), i++) (i % 4 === 3 ? K.crumble : K.plank)(x, x + 10, 994 - ((i * 3) % 4));
    for (const [a, b, t] of [[220, 262, 980], [470, 560, 984], [700, 740, 978]]) (K.rock(a, t, b, 1012), K.mat(a, t, b, 1012, "wood"));
    K.deep(516, 984);
    // 늪 천장에서 내려와 물에 박힌 뿌리 기둥 (밑동에 지나가는 아치)
    for (const [x, w] of [[180, 5], [360, 7], [640, 6], [860, 5]]) {
      K.rock(x - w, 920, x + w, 1012), K.mat(x - w, 920, x + w, 1012, "wood");
      K.air(x - w, 982, x + w, 996), K.ell(x, 982, w + 1, 5);
    }
    for (const x of [130, 250, 420, 600, 760, 900]) K.vine(x, x + 2, 925, 970 + ((x * 7) % 20));
    // 가라앉은 오두막 (늪 서쪽 둔덕 위)
    K.rock(214, 960, 216, 980), K.rock(266, 960, 268, 980), K.rock(210, 956, 272, 960), K.mat(210, 956, 272, 980, "wood"), K.wall(216, 960, 266, 980, "wood");
    P(K, 240, 980, "p_crates"), P(K, 252, 980, "p_lamp");
    P(K, 496, 984, "p_roots"), P(K, 536, 984, "p_shroom", { s: 1 }), P(K, 720, 978, "p_log");
    K.tag(480, 968, 552, 984, "rest", { safe: 1 }), K.tag(120, 976, 440, 994, "arena"), K.tag(600, 976, 940, 994, "arena");
    // 위와 잇기: 묘지 3층 · 수로 바닥 · 사슴 굴 아래
    shaft(K, 380, 818, 994), shaft(K, 600, 850, 994), shaft(K, 820, 850, 994);
    K.struct("지하 늪", "▼ 아래로", 84, 916, 966, 1026);
  }
}
