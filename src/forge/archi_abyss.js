// ══════════════════════════════════════════════════════════════
// 그림자 심연 (g0_2, 노랑) 「심연 벼랑 도시」 — 아이언베인 광부들이 파다 뚫어 버린 끝없는 틈
//   지도 = 칸 1024 × 1056 · 입구·출구 줄 600 · ▲ = 틈 위 돌 아치 다리 가운데 (x 512) · ▼ = 틈 바닥 무너진 성당
//   한가운데 위에서 아래까지 지도를 가르는 큰 틈. 양쪽 벼랑 속에 층마다 다른 집(벼랑 집)이 박혀 있다
//     서쪽 벼랑: 그림자 승강기(벼랑 속 수갱)가 층마다 집 문을 지난다 — 파수꾼 망루 · 등불 공방 · 기도 굴 · 그림자 감옥 · 우물 집 · 뼈 창고 · 밑바닥 나루
//     동쪽 벼랑: 엇갈린 사다리로 오르내리는 집 — 박쥐 둥지 · 매달린 시장 · 밧줄 공방 · 버섯 집 · 검은 물 집 · 사슬 대장간
//     다리: 줄 340 출렁다리(무너지는 판) · 줄 600 돌다리(가운데 도개교) · 줄 840 사슬 다리 · 맨 위 줄 60 돌 아치(▲)
//     서쪽 날개: 그림자 감옥 2층 (쇠창살 방) · 동쪽 날개: 발광 균열 (비스듬한 결정 틈 굴과 결정방)
//     틈 바닥: 검은 물웅덩이 · 무너진 성당 (▼)
//   장치: 승강기 · 짚라인 둘 · 도개교 · 출렁다리 · 사다리·밧줄 · 무너지는 판 · 떨어지는 바위 · 금 간 벽 · 회복 샘
// ══════════════════════════════════════════════════════════════

const EN = 600;
const P = (K, x, f, k, o) => K.prop(x, f, k, o);
function shaft(K, x, fu, fd, k = "ladder", m = null) {
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}
// 틈 벽 (줄 y의 서쪽·동쪽 벼랑 x)
const WL = (y) => 380 + Math.round(Math.sin(y * 0.021) * 14 + Math.sin(y * 0.057 + 1) * 6);
const WR = (y) => 642 + Math.round(Math.sin(y * 0.017 + 2) * 16 + Math.sin(y * 0.049) * 6);

export function abyss(K) {
  rift(K);
  westCliff(K);
  eastCliff(K);
  bridges(K);
  prison(K);
  fissures(K);
  cathedral(K);
}

function rift(K) {
  for (let y = 36; y < 1004; y++) K.air(WL(y), y, WR(y), y + 1);
  K.rock(WL(1004) - 4, 1004, WR(1004) + 4, 1020);
  // 벼랑에서 튀어나온 바위 혹 (오르내릴 때 쉬어 간다)
  for (const [x0, x1, y] of [[WL(180) - 2, WL(180) + 10, 180], [WR(250) - 12, WR(250) + 2, 250], [WL(520) - 2, WL(520) + 9, 520], [WR(450) - 10, WR(450) + 2, 450], [WL(780) - 2, WL(780) + 12, 780], [WR(720) - 11, WR(720) + 2, 720]]) K.rock(x0, y, x1, y + 4);
  K.fall(470, 476, 120, 330), K.fall(560, 566, 380, 590), K.fall(500, 506, 650, 830);
  // 틈 속 떠 있는 바위 덩이 (윗면 평평, 밑은 종유석처럼 뾰족) — 크기·높이 제각각
  for (const [x0, x1, t, d] of [[430, 470, 150, 14], [540, 590, 210, 20], [452, 486, 290, 10], [580, 616, 470, 16], [420, 462, 520, 12], [470, 520, 700, 22], [566, 604, 760, 12], [430, 456, 880, 10], [548, 590, 920, 14]]) {
    for (let x = x0; x < x1; x++) {
      const u = (x - x0) / (x1 - x0), dd = Math.round(d * Math.sin(u * Math.PI) ** 0.7 + Math.sin(x * 0.9) * 1.5);
      K.rock(x, t, x + 1, t + Math.max(2, dd));
    }
    P(K, (x0 + x1) >> 1, t, ((x0 * 7) % 3) ? "p_crystal" : "p_bones", { s: (x0 >> 3) % 3 });
  }
  // 덩이 사이 밧줄 (위 덩이 · 다리에서 아래 덩이로)
  for (const [x, y0, y1] of [[460, 154, 290], [470, 294, 520], [586, 214, 470], [596, 474, 600], [490, 604, 700], [586, 704, 760], [444, 524, 600], [574, 764, 840], [440, 844, 880], [560, 924, 990]]) K.rope(x, y0 - 3, y1);
  // 매달린 우리 발판 (사슬): 덩이 아래 작은 판
  for (const [x, f] of [[500, 380], [520, 640], [480, 810]]) (K.plank(x - 6, x + 6, f), K.prop(x, f - 2, "p_cage"));
  K.rope(500, 290 - 3, 380), K.rope(520, 600 - 3, 640), K.rope(480, 760 - 3, 810);
}

// ═══ 서쪽 벼랑: 그림자 승강기 + 층마다 다른 집 ═══
function westCliff(K) {
  // 승강기 수갱 (벼랑 속)
  K.air(320, 112, 334, 952), K.wall(320, 112, 334, 952, "wood");
  K.lift(322, 332, 120, 950, 108);
  // 집: [바닥, 높이, 이름, 역할, 꾸밈]
  const H = [
    [120, 16, "파수꾼 망루", "arena", (f) => (P(K, 350, f, "p_brazier"), P(K, 366, f, "p_rack"))],
    [230, 18, "등불 공방", "treasure", (f) => (P(K, 344, f, "p_lamp"), P(K, 358, f, "p_anvil"), P(K, 372, f, "p_lamp"))],
    [340, 22, "기도 굴", "rest", (f) => (P(K, 352, f, "p_candles", { s: 1 }), P(K, 368, f, "p_statue"), K.heal(358, 366, f - 4, f))],
    [450, 18, "우물 집", "treasure", (f) => (P(K, 350, f, "p_font"), P(K, 366, f, "p_urn"))],
    [720, 20, "뼈 창고", "arena", (f) => (P(K, 346, f, "p_bones", { s: 1 }), P(K, 362, f, "p_skulls"), P(K, 374, f, "p_cage"))],
    [840, 16, "밧줄 창고", "treasure", (f) => (P(K, 352, f, "p_crates"), P(K, 368, f, "p_chain"))],
    [950, 18, "밑바닥 나루", "rest", (f) => (P(K, 352, f, "p_lamp"), P(K, 368, f, "p_crates", { s: 1 }))],
  ];
  for (const [f, h, name, role, deco] of H) {
    const xr = WL(f) + 1;
    K.air(334, f - h, xr, f), K.wall(334, f - h, xr, f, "brick");
    // 승강기 문
    K.air(330, f - 9, 336, f);
    // 틈 쪽 발코니 (튀어나온 돌 턱) + 처마
    K.rock(xr - 1, f, xr + 12, f + 3), K.mat(xr - 1, f, xr + 12, f + 3, "brick");
    K.rock(xr - 1, f - h - 3, xr + 8, f - h), K.mat(xr - 1, f - h - 3, xr + 8, f - h, "brick");
    K.prop(xr + 4, f - h, "p_chain");
    deco(f);
    K.tag(336, f - h, xr, f, role);
    K.struct(name, role, 320, f - h, xr + 12, f + 3);
  }
  // 망루 위 → 맨 위 돌 아치 (사다리)
  shaft(K, 360, 60, 120);
  K.air(352, 48, WL(60) + 1, 60);
}

// ═══ 동쪽 벼랑: 엇갈린 사다리로 잇는 집 ═══
function eastCliff(K) {
  const H = [
    [170, 16, "박쥐 둥지", "arena", (f, x) => (P(K, x + 12, f, "p_nest"), P(K, x + 30, f, "p_bones"))],
    [280, 20, "매달린 시장", "rest", (f, x) => (P(K, x + 10, f, "p_crates"), P(K, x + 26, f, "p_urn"), P(K, x + 42, f, "p_lamp"))],
    [400, 18, "밧줄 공방", "treasure", (f, x) => (P(K, x + 14, f, "p_rack"), P(K, x + 32, f, "p_chain"))],
    [520, 18, "버섯 집", "arena", (f, x) => (P(K, x + 12, f, "p_shroom", { s: 2 }), P(K, x + 30, f, "p_shroom", { s: 1 }))],
    [660, 20, "검은 물 집", "treasure", (f, x) => (K.air(x + 10, f, x + 40, f + 5), K.water(x + 10, f, x + 40, f + 5), P(K, x + 46, f, "p_urn"))],
    [780, 18, "사슬 대장간", "arena", (f, x) => (P(K, x + 14, f, "p_anvil"), P(K, x + 32, f, "p_brazier"))],
    [900, 16, "망각의 방", "treasure", (f, x) => (P(K, x + 18, f, "p_sarcoph"), P(K, x + 36, f, "p_candles"))],
  ];
  H.forEach(([f, h, name, role, deco], i) => {
    const xl = WR(f) - 1, x1 = xl + 58;
    K.air(xl, f - h, x1, f), K.wall(xl, f - h, x1, f, "wood");
    K.rock(xl - 12, f, xl + 1, f + 3), K.mat(xl - 12, f, xl + 1, f + 3, "wood");
    K.rock(xl - 8, f - h - 3, xl + 1, f - h), K.mat(xl - 8, f - h - 3, xl + 1, f - h, "wood");
    K.prop(xl - 4, f - h, "p_cage");
    deco(f, xl);
    K.tag(xl + 2, f - h, x1, f, role);
    K.struct(name, role, xl - 12, f - h, x1, f + 3);
    // 위 집과 사다리 (엇갈려: 안쪽 끝 / 틈 쪽)
    if (i) {
      const pf = H[i - 1][0], x = i % 2 ? Math.min(WR(pf), WR(f)) + 50 : Math.max(WR(pf), WR(f)) + 6;
      shaft(K, x, pf, f, "ladder", "wood");
    }
  });
  // 줄 600 대로 (동쪽 집 사이)
  shaft(K, WR(520) + 40, 520, EN, "ladder", "wood"), shaft(K, WR(600) + 44, EN, 660, "ladder", "wood");
}

// ═══ 다리 ═══
function bridges(K) {
  // 맨 위 돌 아치 (▲): 아래가 둥글게 파인 돌 다리
  const a = WL(60) - 2, b = WR(60) + 2;
  for (let x = a; x < b; x++) {
    const u = (x - a) / (b - a), d = Math.round(Math.sin(u * Math.PI) * 4);
    K.rock(x, 60, x + 1, 64 + (u < 0.12 || u > 0.88 ? 10 : 0) + (d < 2 ? 3 : 0)), K.mat(x, 60, x + 1, 66, "brick");
  }
  K.air(WR(60) - 2, 46, WR(60) + 30, 60), K.rock(WR(60), 60, WR(60) + 30, 64);
  K.peak(512, 60);
  P(K, 494, 60, "p_statue"), P(K, 530, 60, "p_statue"), P(K, 512, 60, "p_brazier");
  K.tag(496, 46, 528, 60, "rest", { safe: 1 });
  K.struct("돌 아치 다리", "▲ 아이언베인으로", a, 46, b, 70);
  // 줄 340 출렁다리 (서 기도 굴 ↔ 동 밧줄 공방 밑 턱)
  const ax = WL(340) + 12, bx = WR(340) - 12;
  for (let x = ax, i = 0; x < bx; x += 4, i++) {
    const t = (x - ax) / (bx - ax), y = 340 + Math.round(5 * Math.sin(Math.PI * t));
    i % 5 === 3 ? K.crumble(x, x + 4, y) : K.plank(x, x + 4, y);
  }
  K.rock(bx, 340, WR(340) + 2, 344), K.ladder(bx + 4, 340, 400 - 0);
  K.air(bx + 3, 344, bx + 6, 400);
  // 줄 600 돌다리 (가운데 도개교)
  const c = WL(EN) - 2, d = WR(EN) + 2;
  K.rock(c, EN, 486, EN + 5), K.rock(538, EN, d, EN + 5);
  K.mat(c, EN, 486, EN + 5, "brick"), K.mat(538, EN, d, EN + 5, "brick");
  K.draw(486, 512, EN, "L", 0), K.draw(512, 538, EN, "R", 1.4);
  for (const x of [430, 590]) P(K, x, EN, "p_lamp");
  K.tag(440, EN - 14, 480, EN, "arena"), K.tag(544, EN - 14, 590, EN, "arena");
  K.struct("돌다리", "대로", c, EN - 2, d, EN + 6);
  // 줄 840 사슬 다리 (판자 사이가 넓다)
  const e = WL(840) + 12, g = WR(840) - 1;
  for (let x = e; x < g; x += 7) K.plank(x, Math.min(g, x + 5), 840);
  K.rock(g, 840, g + 4, 844);
  K.air(g + 1, 780 + 0, g + 4, 840), K.ladder(g + 2, 780, 840);
  // 짚라인: 동 박쥐 둥지 → 서 우물 집 · 서 등불 공방 → 동 버섯 집
  K.zip(WR(170) + 2, 166, WL(450) + 8, 446);
  K.zip(WL(230) + 4, 226, WR(520) - 6, 516);
}

// ═══ 서쪽 날개: 그림자 감옥 (입구 줄 600) ═══
function prison(K) {
  K.hall(0, 320, EN, 12), K.wall(40, EN - 12, 320, EN, "brick");
  K.air(320, EN - 12, WL(EN) + 1, EN);
  K.air(330, EN - 9, 336, EN);
  K.tag(2, EN - 12, 40, EN, "rest", { safe: 1 });
  // 감옥 방: 대로 위아래로 쇠창살 방
  for (const [x, up] of [[60, 1], [110, 0], [160, 1], [210, 0], [260, 1]]) {
    const y0 = up ? EN - 30 : EN, y1 = up ? EN - 12 : EN + 16;
    K.air(x, y0, x + 34, y1), K.wall(x, y0, x + 34, y1, "brick");
    up ? shaft(K, x + 4, y0 + 0, EN, "ladder") : shaft(K, x + 30, EN, y1, "ladder");
    P(K, x + 18, y1, up ? "p_cage" : "p_bones"), P(K, x + 10, y1, "p_chain");
    K.tag(x, y0, x + 34, y1, (x / 50) % 2 ? "treasure" : "arena");
  }
  // 금 간 벽 뒤 간수장 방
  K.crack(36, EN + 2, 40, EN + 14);
  K.air(4, EN + 2, 36, EN + 14), K.rock(4, EN, 36, EN + 2), K.ladder(20, EN - 2, EN + 14);
  P(K, 14, EN + 14, "p_crates", { s: 1 }), K.tag(4, EN + 2, 36, EN + 14, "treasure");
  K.struct("그림자 감옥", "전투·보물", 0, EN - 30, 320, EN + 16);
}

// ═══ 동쪽 날개: 발광 균열 (비스듬한 결정 틈) ═══
function fissures(K) {
  const x0 = WR(EN) + 58;
  K.hall(x0 - 58, 1024, EN, 12);
  K.tag(966, EN - 12, 1022, EN, "rest", { safe: 1 });
  // 위로 가는 균열 둘, 아래로 하나 — 굽이마다 평평한 결정방 (기울기 1 이하)
  K.wiggle([[760, EN], [840, 520]], 9, 0.8);
  K.hall(840, 902, 520, 16);
  K.wiggle([[900, 520], [964, 456]], 9, 0.8);
  K.hall(962, 1016, 456, 18);
  K.wiggle([[842, 520], [790, 468]], 9, 0.8);
  K.hall(742, 792, 468, 14);
  K.wiggle([[880, EN], [940, 660]], 9, 0.8);
  K.hall(938, 1000, 660, 14);
  shaft(K, 992, 660, 860, "ladder");
  K.hall(900, 1010, 860, 18);
  for (const [a, b, f, role] of [[840, 902, 520, "arena"], [962, 1016, 456, "treasure"], [742, 792, 468, "arena"], [938, 1000, 660, "arena"], [900, 1010, 860, "treasure"]]) {
    for (let k = 0; k < 3; k++) P(K, a + 8 + k * Math.round((b - a - 16) / 2), f, "p_crystal", { s: k });
    K.tag(a + 2, f - 14, b - 2, f, role);
  }
  K.struct("발광 균열", "보물·전투", 720, 330, 1010, 880);
}

// ═══ 틈 바닥: 검은 물웅덩이 · 무너진 성당 (▼) ═══
function cathedral(K) {
  const f = 1004;
  K.air(WL(990) + 10, 990, WR(990) - 10, f), K.water(WL(990) + 10, 990, 450, f), K.water(590, 990, WR(990) - 10, f);
  K.rock(450, 990, 590, f), K.mat(450, 990, 590, f, "brick");
  // 무너진 성당: 기둥 넷(둘은 부러졌다), 제단
  for (const [x, h] of [[462, 60], [486, 26], [538, 44], [574, 18]]) K.wall(x, 990 - h, x + 4, 990, "stem");
  K.rock(486, 987, 492, 990), K.rock(574, 988, 580, 990);
  K.rock(456, 926, 520, 930), K.mat(456, 926, 520, 930, "brick");
  K.ladder(468, 926, 990);
  K.deep(512, 990);
  P(K, 512, 990, "p_altar"), P(K, 500, 990, "p_candles", { s: 1 }), P(K, 526, 990, "p_skulls"), P(K, 486, 926, "p_brokencol");
  K.tag(492, 976, 532, 990, "rest", { safe: 1 }), K.tag(456, 912, 520, 926, "treasure");
  // 나루 ↔ 성당: 물 위 판자
  for (let x = WL(950) + 12; x < 450; x += 6) K.plank(x, x + 4, 990);
  K.ladder(WL(950) + 13, 950, 990);
  K.struct("무너진 성당", "▼ 아래로·쉼터", 440, 910, 600, f);
}
