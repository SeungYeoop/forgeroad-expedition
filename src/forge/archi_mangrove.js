// ══════════════════════════════════════════════════════════════
// 늪지 광맥 동굴 (gm2_1, 노랑) 「지하 맹그로브 수상 마을」 — 검은 늪지 밑, 늪물이 스며 고인 땅속 물 세상
//   지도 = 칸 1024 × 1056 · 입구·출구 줄 600 · ▲ = 가운데 뿌리 기둥 꼭대기 · ▼ = 검은 웅덩이 가운데 섬
//     수상 마을(줄 600): 물 위 말뚝 데크 길 · 말뚝집 넷(쓰임이 다르다) · 데크가 끊긴 곳은 헤엄
//     뿌리 기둥 셋(x 230 · 520 · 810): 천장에서 바닥까지 내려온 속 빈 거대 뿌리, 속에 층마다 방 (높이·짜임 제각각)
//     반딧불 계단 웅덩이(위): 층층이 고인 물 계단, 계단 사이 작은 폭포(헤엄쳐 오른다), 덩굴 커튼
//     가라앉은 신전(아래): 물에 잠긴 벽돌 방 · 공기 주머니 · 물속 굴
//     검은 웅덩이(맨 아래): 깊은 물, 가운데 섬 ▼
//   장치: 폭포(헤엄) · 물 · 덩굴·사다리·밧줄 · 덩굴 그네 · 무너지는 판 · 금 간 벽 · 회복 샘
// ══════════════════════════════════════════════════════════════

const EN = 600;
const P = (K, x, f, k, o) => K.prop(x, f, k, o);
function shaft(K, x, fu, fd, k = "ladder", m = null) {
  K.air(x - 1, fu, x + 2, fd);
  m && K.wall(x - 1, fu, x + 2, fd, m);
  K.plank(x - 1, x + 2, fu);
  k === "ladder" ? K.ladder(x, fu, fd) : k === "rope" ? K.rope(x, fu - 3, fd) : K.vine(x - 1, x + 2, fu - 3, fd);
}
const COLS = [[230, 18, [520, 440, 360, 280], "서쪽 뿌리 기둥"], [520, 22, [520, 430, 340, 250, 160], "가운데 뿌리 기둥"], [810, 16, [520, 450, 380], "동쪽 뿌리 기둥"]];

export function mangrove(K) {
  cavern(K);
  village(K);
  columns(K);
  terraces(K);
  temple(K);
  blackPool(K);
}

function cavern(K) {
  // 큰 공동: 천장이 물결치는 넓은 굴 (줄 120~640)
  K.air(40, 140, 984, 640);
  for (let x = 40; x < 984; x++) {
    const v = Math.round(Math.sin(x * 0.02) * 18 + Math.sin(x * 0.07 + 1) * 8 + 20);
    K.air(x, 140 - Math.max(0, v), x + 1, 140);
  }
  K.rock(30, 640, 994, 660);
}

// ═══ 수상 마을 (줄 600) ═══
function village(K) {
  K.hall(0, 44, EN, 12), K.hall(980, 1024, EN, 12);
  K.water(44, 606, 980, 640);
  K.air(44, EN, 980, 640);
  // 데크 길 (말뚝 위 판자), 끊긴 곳은 헤엄
  for (const [a, b] of [[44, 160], [176, 300], [316, 470], [490, 640], [656, 760], [776, 980]]) {
    for (let x = a; x < b; x += 6) K.plank(x, Math.min(b, x + 6), EN);
    for (let x = a + 4; x < b; x += 22) K.wall(x, EN, x + 1, 640, "stem");
  }
  for (const [x] of [[168], [308], [480], [648], [768]]) K.ladder(x, EN, 640);
  K.tag(2, EN - 12, 44, EN, "rest", { safe: 1 }), K.tag(980, EN - 12, 1022, EN, "rest", { safe: 1 });
  // 말뚝집 넷 (데크 위 나무집, 짜임이 다르다)
  const H = [[80, 130, 22, "어부의 집", "rest", ["p_crates", "p_rack"]], [360, 430, 26, "약초 집", "treasure", ["p_shelf", "p_urn"]], [680, 740, 20, "뱃사공 오두막", "arena", ["p_crates", "p_chain"]], [880, 960, 30, "마을 회관", "rest", ["p_lectern", "p_candles"]]];
  for (const [a, b, h, name, role, props] of H) {
    K.rock(a, EN - h - 3, b, EN - h), K.mat(a - 2, EN - h - 5, b + 2, EN - h, "leaf"), K.rock(a - 2, EN - h - 5, b + 2, EN - h - 3);
    K.rock(a, EN - h, a + 2, EN - 9), K.rock(b - 2, EN - h, b, EN - 9), K.mat(a, EN - h, b, EN, "wood");
    K.wall(a + 2, EN - h, b - 2, EN, "wood");
    P(K, a + 12, EN, props[0]), P(K, b - 12, EN, props[1]);
    K.tag(a + 2, EN - h, b - 2, EN, role);
    // 지붕으로 오르는 사다리 (지붕 = 전망대)
    K.ladder(b + 3, EN - h - 5, EN);
    K.struct(name, role, a - 2, EN - h - 5, b + 2, EN);
  }
  K.heal(900, 912, EN - 4, EN);
  K.tag(180, EN - 12, 300, EN, "arena"), K.tag(500, EN - 12, 640, EN, "arena");
  P(K, 230, EN, "p_lamp"), P(K, 560, EN, "p_lamp"), P(K, 720, EN, "p_lamp");
  K.struct("수상 마을", "입구·출구·쉼터", 0, EN - 40, 1024, 640);
}

// ═══ 뿌리 기둥 셋: 천장에서 바닥까지, 속에 층마다 방 ═══
function columns(K) {
  for (const [cx, w, floors, name] of COLS) {
    // 밑동이 물에 부풀어 박힌 뿌리 (데크 밑을 지나도록 줄 600 위에서 끝난다)
    const top = 60;
    for (let y = top; y < EN - 40; y++) {
      const t = Math.max(0, (y - (EN - 120)) / 80), ww = Math.round(w + t * t * 10 + Math.sin(y * 0.11 + cx) * 1.5);
      K.rock(cx - ww, y, cx + ww, y + 1), K.mat(cx - ww, y, cx + ww, y + 1, "wood");
    }
    // 밑동에서 데크로 늘어진 뿌리털 (덩굴)
    K.vine(cx - 2, cx + 1, EN - 43, EN);
    K.air(cx - 3, EN - 50, cx + 3, EN - 40), K.plank(cx - 3, cx + 3, EN - 50);
    let prev = EN - 50;
    floors.forEach((f, i) => {
      const h = Math.min(26, prev - f - 6);
      K.air(cx - w + 4, f - h, cx + w - 4, f), K.wall(cx - w + 4, f - h, cx + w - 4, f, "wood");
      const x = i % 2 ? cx + w - 8 : cx - w + 8;
      shaft(K, x, f, prev, "ladder", "wood");
      // 바깥 옹이 문 + 턱 (번갈아)
      const sd = i % 2 ? -1 : 1, dx = sd > 0 ? cx + w : cx - w - 12;
      K.air(sd > 0 ? cx + w - 5 : cx - w, f - 8, sd > 0 ? cx + w + 1 : cx - w + 5, f), K.rock(dx, f, dx + 12, f + 3), K.mat(dx, f, dx + 12, f + 3, "wood");
      P(K, cx, f, ["p_shroom", "p_nest", "p_urn", "p_hive", "p_shelf"][i % 5], { s: 1 });
      K.tag(cx - w + 4, f - h, cx + w - 4, f, i === floors.length - 1 ? "treasure" : i % 2 ? "arena" : "rest");
      prev = f;
    });
    K.struct(name, "보물·전투", cx - w - 12, top, cx + w + 12, EN - 40);
  }
  // 가운데 기둥 꼭대기 (▲)
  K.air(500, 60, 540, 120), K.plank(512, 528, 120);
  shaft(K, 520, 120, 160, "ladder", "wood");
  K.rock(498, 88, 542, 92), K.ladder(504, 88, 120), K.air(502, 92, 506, 120);
  K.peak(520, 88);
  P(K, 520, 88, "p_roots"), K.tag(504, 74, 536, 88, "rest", { safe: 1 });
  K.swing(370, 160, 40), K.swing(670, 170, 36);
}

// ═══ 반딧불 계단 웅덩이 (위): 층층 물 계단 + 작은 폭포 ═══
function terraces(K) {
  // 서쪽 계단 (기둥 사이) — 높이·폭 제각각
  const T = [[60, 200, 440], [270, 360, 380], [60, 180, 320], [280, 470, 260], [570, 760, 330], [850, 970, 400], [600, 740, 220], [850, 960, 290]];
  for (const [a, b, f] of T) {
    K.rock(a, f, b, f + 6), K.mat(a, f, b, f + 6, "leaf");
    K.rock(a, f - 3, a + 2, f), K.rock(b - 2, f - 3, b, f);
    K.air(a + 2, f, b - 2, f + 3), K.water(a + 2, f, b - 2, f + 3);
    P(K, (a + b) >> 1, f, "p_fern");
  }
  // 계단 사이 작은 폭포 (헤엄쳐 오른다) · 덩굴
  for (const [x, a, b] of [[190, 440, EN], [340, 380, EN], [100, 320, 440], [360, 260, 380], [740, 330, EN], [960, 400, EN], [700, 220, 330], [940, 290, 400]]) K.fallw(x, a - 2, x + 4, b);
  for (const [x, a, b] of [[120, 160, 320], [420, 150, 260], [660, 140, 220], [900, 150, 290]]) K.vine(x, x + 2, a, b);
  for (const [a, b, f] of [[60, 200, 440], [280, 470, 260], [850, 970, 400], [600, 740, 220]]) K.tag(a + 4, f - 14, b - 4, f, f < 300 ? "treasure" : "arena");
  K.struct("반딧불 계단 웅덩이", "헤엄·보물", 50, 130, 980, 450);
}

// ═══ 가라앉은 신전 (아래): 물에 잠긴 방 · 공기 주머니 ═══
function temple(K) {
  K.mat(240, 680, 800, 880, "brick");
  const R = [[260, 400, 730, 40], [440, 600, 720, 30], [640, 780, 740, 46], [300, 500, 820, 50], [540, 760, 840, 60]];
  for (const [a, b, f, h] of R) {
    K.air(a, f - h, b, f), K.wall(a, f - h, b, f, "brick");
    K.water(a, f - h + 8, b, f);
    K.tag(a + 2, f - h, b - 2, f, h > 45 ? "treasure" : "arena");
  }
  // 잇는 물속 굴
  for (const [a, b, f] of [[400, 440, 720], [600, 640, 730], [380, 400, 812], [500, 540, 832]]) (K.air(a, f - 8, b, f), K.water(a, f - 8, b, f));
  for (const [x, a, b] of [[330, 728, 780], [700, 738, 790], [520, 718, 790]]) K.fallw(x, a, x + 6, b);
  P(K, 330, 730, "p_statue"), P(K, 520, 720, "p_urn"), P(K, 700, 740, "p_sarcoph"), P(K, 400, 820, "p_altar"), P(K, 650, 840, "p_brokencol");
  // 마을 물 바닥 → 신전 (물속 굴)
  for (const x of [300, 520, 740]) K.fallw(x, 636, x + 6, 692);
  K.crack(800, 828, 804, 840), K.air(804, 824, 840, 840), P(K, 820, 840, "p_crates", { s: 1 }), K.tag(804, 824, 840, 840, "treasure");
  K.struct("가라앉은 신전", "헤엄·보물", 240, 670, 840, 880);
}

// ═══ 검은 웅덩이 (맨 아래) ═══
function blackPool(K) {
  K.ell(520, 960, 260, 60), K.rock(250, 990, 790, 1020);
  K.air(270, 940, 770, 990);
  K.water(272, 960, 768, 990);
  K.rock(480, 948, 560, 990), K.mat(480, 948, 560, 952, "leaf");
  K.deep(520, 948);
  P(K, 500, 948, "p_roots"), P(K, 540, 948, "p_shroom", { s: 2 });
  K.tag(490, 934, 552, 948, "rest", { safe: 1 });
  for (const [a, b, f] of [[300, 340, 958], [390, 430, 956], [610, 650, 957], [700, 740, 958]]) K.plank(a, b, f);
  K.tag(300, 944, 440, 958, "arena"), K.tag(600, 944, 740, 958, "arena");
  // 신전 바닥 → 웅덩이 (물속 굴) · 데크에서 긴 사다리
  for (const x of [400, 640]) K.fallw(x, 816, x + 6, 962);
  shaft(K, 260, 640, 958, "ladder"), shaft(K, 780, 640, 958, "ladder");
  K.air(258, 940, 272, 958), K.air(768, 940, 782, 958);
  K.struct("검은 웅덩이", "▼ 아래로·헤엄", 250, 900, 790, 1020);
}
