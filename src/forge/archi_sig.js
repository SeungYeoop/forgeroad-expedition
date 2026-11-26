// 지하 맵마다 하나뿐인 상징 구조물 + 생성 수치 (angular.js의 Z.sig · Z.gap … 로 들어간다)
const EN = 600;
const tw = (K, x0, x1, y0, y1, m, name) => {
  K.air(x0, y0, x1, y1), K.wall(x0, y0, x1, y1, m), K.mat(x0 - 3, y0 - 2, x1 + 3, y1 + 2, m);
  let s = 0;
  for (let y = y1 - 16; y > y0 + 4; y -= 16, s ^= 1) {
    const lx = s ? x0 + 4 : x1 - 6;
    K.rock(x0, y, x1, y + 2), K.mat(x0, y, x1, y + 2, m), K.air(lx - 1, y, lx + 2, y + 2), K.plank(lx - 1, lx + 2, y), K.ladder(lx, y, y + 16);
  }
  K.struct(name, "탑", x0, y0, x1, y1), K.tag(x0 + 2, y0, x1 - 2, y0 + 14, "treasure");
};
const near = (LV, y) => LV.reduce((b, f) => (Math.abs(f - y) < Math.abs(b - y) ? f : b), LV[0]);
const last = (LV) => LV[LV.length - 1];

export const SIG = {
  // 아이언베인: 한가운데 위에서 아래까지 대수갱 (승강기 + 옆 사다리, 층마다 정거장)
  g0_1: (K, { LV }) => {
    const a = LV[0], b = last(LV);
    K.air(500, a - 10, 526, b), K.wall(500, a - 10, 526, b, "wood"), K.lift(502, 512, a, b, a - 12), K.ladder(522, a, b);
    for (const f of LV) (K.air(470, f - 10, 556, f), K.wall(470, f - 10, 556, f, "wood"), K.prop(480, f, "p_lamp"));
    K.struct("중앙 대수갱", "승강기", 470, a - 10, 556, b);
  },
  // 드립스톤: 한 층 전체가 지하 호수 + 호수에서 솟은 수몰 사원 탑
  g1_1: (K, { LV, ri }) => {
    const f = near(LV, 780);
    K.air(40, f - 12, 984, f), K.air(40, f, 984, f + 16), K.water(40, f, 984, f + 16), K.rock(40, f + 16, 984, f + 20);
    for (let x = 80; x < 960; x += ri(60, 90)) K.rock(x, f - 2, x + ri(10, 18), f + 16);
    tw(K, 470, 556, near(LV, 560) - 10, f + 16, "brick", "수몰 사원 탑");
    K.struct("지하 호수", "헤엄", 40, f - 12, 984, f + 20);
  },
  // 루트홀로우: 지도를 관통하는 곧은뿌리 기둥 셋
  gm1_1: (K, { LV }) => { for (const x of [150, 470, 820]) tw(K, x, x + 40, LV[0] - 10, last(LV), "wood", "곧은뿌리 기둥"); },
  // 섀도웰: 지도를 세로로 가르는 협곡, 층마다 다리 (군데군데 무너지는 판)
  g0_2: (K, { LV, ri }) => {
    K.air(420, LV[0] - 12, 600, last(LV));
    for (const f of LV) for (let x = 420; x < 600; x += 8) (ri(0, 6) ? K.plank : K.crumble)(x, x + 8, f);
    K.rope(424, LV[0] - 3, last(LV)), K.rope(596, LV[0] - 3, last(LV));
    K.struct("심연 협곡", "다리", 420, LV[0] - 12, 600, last(LV));
  },
  // 본디프: 위쪽 등뼈 회랑 + 아래로 늘어진 갈비뼈 기둥
  g1_2: (K, { LV }) => {
    const f = LV[1];
    K.air(40, f - 14, 980, f), K.wall(40, f - 14, 980, f, "brick"), K.mat(36, f - 18, 984, f + 4, "brick");
    for (let x = 80; x < 960; x += 34) K.wall(x, f, x + 4, Math.min(last(LV), f + 160), "stem");
    K.struct("등뼈 회랑", "전투", 40, f - 14, 980, f);
  },
  // 웹크로프트: 세 층을 꿰뚫는 거미줄 대공동 셋 (층 높이마다 줄 판)
  gm1_2: (K, { LV, ri }) => {
    const i0 = 2, i1 = Math.min(LV.length - 2, 5);
    for (const [a, b] of [[60, 280], [400, 640], [740, 960]]) {
      K.air(a, LV[i0] - 12, b, LV[i1]);
      for (let i = i0; i <= i1; i++) for (let x = a; x < b; x += 6) ri(0, 5) && K.plank(x, x + 5, LV[i]);
      K.rope(a + 4, LV[i0] - 3, LV[i1]), K.rope(b - 5, LV[i0] - 3, LV[i1]);
      K.struct("거미줄 대공동", "전투", a, LV[i0] - 12, b, LV[i1]);
    }
  },
  // 미러딥: 가운데 세 층짜리 프리즘 홀 (가운데 결정 기둥)
  g2_2: (K, { LV }) => {
    const i0 = 3, i1 = Math.min(LV.length - 2, 6);
    K.air(380, LV[i0] - 12, 640, LV[i1]), K.wall(380, LV[i0] - 12, 640, LV[i1], "brick");
    for (let i = i0; i < i1; i++) (K.plank(380, 440, LV[i]), K.plank(580, 640, LV[i]), K.ladder(384, LV[i], LV[i + 1]), K.ladder(636, LV[i], LV[i + 1]));
    K.rock(500, LV[i0] - 12, 520, LV[i1] - 12);
    K.struct("프리즘 홀", "전투", 380, LV[i0] - 12, 640, LV[i1]);
  },
  // 미스트혼: 서쪽 세 층짜리 안개 숲 홀 (죽은 나무 턱)
  gm2_2: (K, { LV, ri }) => {
    const i0 = 3, i1 = Math.min(LV.length - 2, 6);
    K.air(60, LV[i0] - 12, 460, LV[i1]);
    for (let i = i0 + 1; i < i1; i++) for (let x = 60 + ri(0, 20); x < 430; x += ri(50, 80)) (K.rock(x, LV[i], x + 30, LV[i] + 3), K.prop(x + 15, LV[i], "p_dead"));
    for (let x = 80; x < 440; x += 60) K.vine(x, x + 2, LV[i0] - 6, LV[i1]);
    K.struct("안개 숲 홀", "전투", 60, LV[i0] - 12, 460, LV[i1]);
  },
  // 샌드글래스: 모래시계 공동 셋 (넓은 위 방 · 좁은 목 · 넓은 아래 방)
  g2_1: (K, { LV }) => {
    for (const cx of [200, 520, 840]) {
      const a = LV[1], m = LV[3], b = LV[5];
      K.air(cx - 64, a - 28, cx + 64, a), K.air(cx - 6, a, cx + 6, m - 28), K.ladder(cx, a, m - 28);
      K.air(cx - 70, m - 28, cx + 70, b), K.wall(cx - 70, m - 28, cx + 70, b, "brick");
      K.plank(cx - 70, cx - 20, m), K.plank(cx + 20, cx + 70, m), K.ladder(cx - 22, m, b), K.ladder(cx + 21, m, b);
      K.struct("모래시계 공동", "전투", cx - 70, a - 28, cx + 70, b);
    }
  },
  // 마이어루트: 수상 대로 (입구 줄 밑이 물, 길은 말뚝 판자) + 뿌리 기둥 둘
  gm2_1: (K, { LV, ri }) => {
    K.air(40, EN, 984, EN + 14), K.water(40, EN + 2, 984, EN + 14);
    for (let x = 40; x < 984; x += 6) ri(0, 9) && K.plank(x, x + 6, EN);
    for (let x = 60; x < 980; x += 24) K.wall(x, EN, x + 1, EN + 14, "stem");
    for (const x of [260, 720]) tw(K, x, x + 36, LV[0] - 10, last(LV), "wood", "뿌리 기둥");
    K.struct("수상 대로", "헤엄·길", 40, EN - 12, 984, EN + 14);
  },
};
// 맵마다 생성 수치 (층 간격 · 갱도 길이 · 방 크기 · 큰 홀 · 지하실)
export const SHAPE = {
  g0_1: { gap: [50, 70], seg: [160, 420], rw: [26, 80], rh: [16, 30], big: 0.1, cellar: 0.25 },
  g1_1: { gap: [58, 90], seg: [200, 500], rw: [40, 110], rh: [20, 40], big: 0.25, cellar: 0.1 },
  gm1_1: { gap: [44, 64], seg: [90, 260], rw: [20, 60], rh: [14, 26], big: 0.08, cellar: 0.35 },
  g0_2: { gap: [54, 76], seg: [120, 330], rw: [24, 70], rh: [16, 34], big: 0.12, cellar: 0.2 },
  g1_2: { gap: [60, 84], seg: [180, 460], rw: [30, 100], rh: [18, 40], big: 0.2, cellar: 0.15 },
  gm1_2: { gap: [46, 66], seg: [100, 300], rw: [22, 70], rh: [14, 28], big: 0.1, cellar: 0.3 },
  g2_2: { gap: [42, 58], seg: [50, 150], rw: [20, 50], rh: [12, 24], big: 0.05, cellar: 0.25 },
  gm2_2: { gap: [56, 80], seg: [150, 400], rw: [30, 90], rh: [18, 36], big: 0.2, cellar: 0.15 },
  g2_1: { gap: [52, 72], seg: [140, 380], rw: [30, 96], rh: [16, 32], big: 0.15, cellar: 0.2 },
  gm2_1: { gap: [50, 74], seg: [160, 420], rw: [28, 84], rh: [16, 30], big: 0.12, cellar: 0.15 },
};
