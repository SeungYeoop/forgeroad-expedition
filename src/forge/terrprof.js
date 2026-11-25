// 지역별 지형 생성 규칙 (색이 아니라 "만드는 방법"이 다르다)
// 단위: px (타일 16px). 높이는 아래로 갈수록 커지는 y.
//
// 지상(ground): 여러 겹 잡음 지표 → 단층(급경사) → 지층 경도에 따른 풍화(열 침식) → 물길 침식 → 잔물결
//               → 가파른 면만 2D 비틀기(돌출·오목) → 땅속 동굴(치즈·스파게티·수직굴) → 셀룰러 오토마타
// 동굴(cave): 같은 동굴 잡음을 구역 전체에, 층마다 동굴방 크기·통로 굵기·수직 구조가 다르다
// 하늘(sky): 섬 모양(윗면 평평, 아래로 좁아짐)이 층마다 다르다
const G = (o) => ({ kind: "ground", ...o });
const C = (o) => ({ kind: "cave", ...o });
const S = (o) => ({ kind: "sky", ...o });

// 공통 지하(지상 구역 땅속) 동굴: 얕고 드문드문
const SHALLOW_CAVES = { top: 104, cheese: { wl: 300, aniso: 0.55, thr: 0.26 }, spag: { wl: 280, aniso: 0.75, w: [0.045, 0.09] }, vert: null, pillars: null, ca: 3, worm: [42, 56] };

export const PROFILES = {
  // ── 지상 ──────────────────────────────────────
  // 재의 들판: 완만한 언덕, 넓은 골짜기, 절벽은 드물게
  ash: G({
    name: "완만한 잿빛 구릉",
    macro: { amp: 160, wl: 980, ridge: 0 },
    meso: { amp: 42, wl: 270 },
    micro: { amp: 3, wl: 44 },
    warp: { amp: 140, wl: 520 },
    rough: { wl: 1300, lo: 0.45, hi: 1.25 },
    massif: { n: [2, 3], h: [1134, 1620], w: [2800, 4600] },
    faults: { n: [0, 4], h: [26, 54], w: [26, 60] },
    valleys: { n: [2, 4], d: [36, 70], w: [160, 300] },
    erosion: { iters: 60, soft: 0.55, hard: 2.2, layerWl: 90, layerAmt: 0.35 },
    stream: { k: 0.18, iters: 4 },
    band: [246, 310],
    overhang: { amp: 12, wl: 46 },
    grain: { amp: 1.6, wl: 22 },
    boulders: { n: [2, 4], r: [10, 22] },
    pads: { n: [6, 10], w: [3, 6] },
    caves: SHALLOW_CAVES,
    islands: { n: [4, 6], w: [80, 200], t: [40, 120], style: "rock" },
    render: { stone: 14, strata: 0.25, soil: 10, pebble: 0.4 },
  }),
  // 이끼 숲: 둥근 언덕과 이끼 덮인 바위, 뿌리가 드러난 작은 벼랑
  mist: G({
    name: "이끼 덮인 둔덕",
    macro: { amp: 192, wl: 1050, ridge: 0.15 },
    meso: { amp: 54, wl: 230 },
    micro: { amp: 4, wl: 38 },
    warp: { amp: 170, wl: 480 },
    rough: { wl: 1100, lo: 0.5, hi: 1.35 },
    massif: { n: [2, 3], h: [1188, 1728], w: [2800, 4600] },
    faults: { n: [2, 4], h: [30, 64], w: [20, 44] },
    valleys: { n: [2, 6], d: [40, 90], w: [140, 260] },
    erosion: { iters: 60, soft: 0.65, hard: 3.2, layerWl: 80, layerAmt: 0.45 },
    stream: { k: 0.22, iters: 4 },
    band: [246, 312],
    overhang: { amp: 20, wl: 40 },
    grain: { amp: 2, wl: 20 },
    boulders: { n: [4, 7], r: [12, 28] },
    pads: { n: [6, 10], w: [3, 5] },
    caves: { ...SHALLOW_CAVES, cheese: { wl: 210, aniso: 0.6, thr: 0.3 } },
    islands: { n: [4, 7], w: [80, 220], t: [50, 140], style: "garden" },
    render: { stone: 15, strata: 0.15, soil: 12, pebble: 0.3 },
  }),
  // 검은 늪지: 낮고 평평한 습지, 넓은 웅덩이 분지, 작은 둔덕
  marsh: G({
    name: "낮은 습지 분지",
    macro: { amp: 74, wl: 1250, ridge: 0 },
    meso: { amp: 20, wl: 300 },
    micro: { amp: 3, wl: 30 },
    warp: { amp: 110, wl: 600 },
    rough: { wl: 1400, lo: 0.4, hi: 1.1 },
    massif: { n: [2, 2], h: [810, 1134], w: [2800, 4600] },
    faults: { n: [0, 2], h: [20, 36], w: [30, 60] },
    valleys: { n: [4, 8], d: [26, 52], w: [120, 220] },
    erosion: { iters: 70, soft: 0.45, hard: 1.4, layerWl: 100, layerAmt: 0.2 },
    stream: { k: 0.12, iters: 3 },
    band: [256, 312],
    overhang: { amp: 6, wl: 50 },
    grain: { amp: 1.8, wl: 18 },
    boulders: { n: [1, 3], r: [10, 18] },
    pads: { n: [6, 10], w: [3, 6] },
    caves: { ...SHALLOW_CAVES, cheese: { wl: 260, aniso: 0.5, thr: 0.38 } },
    islands: { n: [4, 6], w: [90, 210], t: [36, 100], style: "rock" },
    render: { stone: 13, strata: 0.1, soil: 14, pebble: 0.5 },
  }),
  // 유리 모래톱: 바람 방향으로 기운 사구(완만한 바람받이 + 가파른 미끄럼면), 드문 바위 메사
  glass: G({
    name: "기울어진 사구",
    macro: { amp: 112, wl: 1150, ridge: 0 },
    meso: { amp: 10, wl: 300 },
    micro: { amp: 2, wl: 34 },
    warp: { amp: 80, wl: 700 },
    rough: { wl: 1200, lo: 0.5, hi: 1.2 },
    dunes: { amp: 60, wl: 230, asym: 0.78 },
    massif: { n: [2, 3], h: [1026, 1512], w: [2800, 4600] },
    faults: { n: [0, 2], h: [40, 70], w: [16, 30] },
    valleys: { n: [0, 2], d: [30, 50], w: [160, 240] },
    erosion: { iters: 40, soft: 0.62, hard: 2.6, layerWl: 120, layerAmt: 0.3 },
    stream: { k: 0.05, iters: 2 },
    band: [246, 310],
    overhang: { amp: 6, wl: 50 },
    grain: { amp: 1.2, wl: 26 },
    boulders: { n: [1, 3], r: [12, 24] },
    pads: { n: [6, 8], w: [3, 6] },
    caves: { ...SHALLOW_CAVES, cheese: { wl: 250, aniso: 0.45, thr: 0.36 } },
    islands: { n: [3, 5], w: [80, 190], t: [40, 110], style: "rock" },
    render: { stone: 11, strata: 0.55, soil: 16, pebble: 0.2 },
  }),
  // 서리 절벽: 산악. 뾰족한 능선, 높은 단층 절벽, 깊은 협곡, 단단한 지층 띠
  frost: G({
    name: "서리 산악 절벽",
    macro: { amp: 400, wl: 1100, ridge: 0.75 },
    meso: { amp: 78, wl: 230 },
    micro: { amp: 6, wl: 40 },
    warp: { amp: 200, wl: 460 },
    rough: { wl: 900, lo: 0.6, hi: 1.5 },
    massif: { n: [2, 3], h: [1540, 2214], w: [2800, 4600] },
    faults: { n: [4, 8], h: [60, 150], w: [10, 26] },
    valleys: { n: [2, 4], d: [90, 170], w: [70, 150] },
    erosion: { iters: 70, soft: 0.8, hard: 5.5, layerWl: 64, layerAmt: 0.8 },
    stream: { k: 0.3, iters: 5 },
    band: [244, 314],
    overhang: { amp: 30, wl: 34 },
    grain: { amp: 3, wl: 18 },
    boulders: { n: [4, 8], r: [12, 30] },
    pads: { n: [6, 10], w: [3, 5] },
    caves: { ...SHALLOW_CAVES, top: 96, cheese: { wl: 200, aniso: 0.75, thr: 0.3 }, vert: { wl: 260, w: [0.03, 0.06] } },
    islands: { n: [4, 6], w: [70, 170], t: [70, 180], style: "spire" },
    render: { stone: 16, strata: 0.85, soil: 6, pebble: 0.15 },
  }),
  // 용암 요새: 거친 화산 지대. 탁상지(메사)와 깎아지른 단층, 좁고 깊은 틈
  fort: G({
    name: "화산 탁상지",
    macro: { amp: 336, wl: 900, ridge: 0.55 },
    meso: { amp: 86, wl: 200 },
    micro: { amp: 7, wl: 36 },
    warp: { amp: 150, wl: 420 },
    rough: { wl: 800, lo: 0.7, hi: 1.5 },
    massif: { n: [2, 3], h: [1296, 2042], w: [2800, 4600] },
    faults: { n: [6, 10], h: [56, 130], w: [8, 20] },
    valleys: { n: [2, 6], d: [70, 140], w: [56, 120] },
    erosion: { iters: 50, soft: 0.9, hard: 6.5, layerWl: 56, layerAmt: 0.9 },
    stream: { k: 0.15, iters: 3 },
    band: [244, 314],
    overhang: { amp: 26, wl: 30 },
    grain: { amp: 3.2, wl: 16 },
    boulders: { n: [3, 6], r: [12, 26] },
    pads: { n: [6, 10], w: [3, 5] },
    caves: { ...SHALLOW_CAVES, top: 96, cheese: { wl: 190, aniso: 0.6, thr: 0.28 }, vert: { wl: 220, w: [0.03, 0.07] } },
    islands: { n: [3, 5], w: [70, 170], t: [60, 160], style: "spire" },
    render: { stone: 12, strata: 0.7, soil: 4, pebble: 0.1 },
  }),

  // ── 지하 ──────────────────────────────────────
  // 광맥 동굴(얕은 지하): 중간 크기 동굴방, 구불구불한 통로 그물, 가끔 돌기둥
  vein: C({
    name: "구불구불한 광맥 굴",
    caves: {
      cheese: { wl: 210, aniso: 0.55, thr: 0.3 },
      spag: { wl: 240, aniso: 0.7, w: [0.05, 0.1] },
      vert: { wl: 260, w: [0.025, 0.06] },
      pillars: { wl: 30, thr: 0.62 },
      ca: 3,
      worm: [42, 56],
      warp: 46,
      rooms: [3, 5],
      roomR: [56, 110],
    },
    render: { stone: 14, strata: 0.35, soil: 0, pebble: 0.3 },
  }),
  // 그림자 심연(깊은 지하): 거대한 동굴 공간, 가파른 절벽, 세로로 깊은 틈
  abyss: C({
    name: "거대 심연 공동",
    caves: {
      cheese: { wl: 380, aniso: 0.7, thr: 0.12 },
      spag: { wl: 300, aniso: 0.8, w: [0.03, 0.07] },
      vert: { wl: 300, w: [0.045, 0.09] },
      pillars: { wl: 40, thr: 0.58 },
      ca: 4,
      worm: [48, 64],
      warp: 70,
      rooms: [2, 4],
      roomR: [110, 190],
    },
    render: { stone: 17, strata: 0.6, soil: 0, pebble: 0.2 },
  }),
  // 용암 핵(땅의 핵): 아주 넓은 공간과 굵은 돌기둥, 뾰족한 천장, 무너진 바위 더미
  core: C({
    name: "무너진 용암 공동",
    caves: {
      cheese: { wl: 330, aniso: 0.6, thr: 0.06 },
      spag: { wl: 260, aniso: 0.7, w: [0.03, 0.06] },
      vert: { wl: 240, w: [0.03, 0.07] },
      pillars: { wl: 52, thr: 0.5 },
      ca: 4,
      worm: [46, 62],
      warp: 60,
      rooms: [3, 4],
      roomR: [120, 200],
      rubble: 1,
    },
    render: { stone: 13, strata: 0.45, soil: 0, pebble: 0.4 },
  }),

  // ── 하늘 ──────────────────────────────────────
  // 구름 섬(낮은 하늘): 넓고 윗면 평평한 섬, 둥글고 얕은 밑면
  cloud: S({
    name: "넓은 평원 섬",
    floor: { w: [18, 34], t: [7, 11], gap: [2, 4], amp: 10 },
    islands: { n: [12, 16], w: [90, 260], t: [36, 90], style: "cloud" },
    render: { stone: 14, strata: 0.2, soil: 10, pebble: 0.3 },
  }),
  // 빛의 정원: 둥근 수풀 섬, 아치처럼 뚫린 바위, 늘어진 뿌리
  garden: S({
    name: "둥근 정원 섬",
    floor: { w: [16, 30], t: [9, 14], gap: [2, 4], amp: 16 },
    islands: { n: [12, 17], w: [80, 230], t: [60, 150], style: "garden" },
    render: { stone: 15, strata: 0.1, soil: 12, pebble: 0.3 },
  }),
  // 뇌운 첨탑(높은 하늘): 좁고 높은 바위 첨탑, 들쭉날쭉한 밑동
  spire: S({
    name: "뾰족한 첨탑 섬",
    floor: { w: [14, 26], t: [11, 16], gap: [2, 4], amp: 14 },
    islands: { n: [14, 19], w: [56, 160], t: [90, 260], style: "spire" },
    render: { stone: 16, strata: 0.8, soil: 5, pebble: 0.15 },
  }),
};

// 구역(칸) → 생성 규칙
const GROUND_AT = { "-3": "frost", "-2": "marsh", "-1": "mist", 1: "ash", 2: "glass", 3: "fort" };
const CAVE_AT = { 1: "vein", 2: "abyss", 3: "core" };
const SKY_AT = { "-1": "cloud", "-2": "garden", "-3": "spire" };
export function profileKey(z) {
  if (z.y > 0) return CAVE_AT[Math.min(3, z.y)] ?? "vein";
  if (z.y < 0) return SKY_AT[Math.max(-3, z.y)] ?? "cloud";
  return GROUND_AT[z.x] ?? "ash";
}
export const profileOf = (z) => PROFILES[profileKey(z)];
// 땅속 생물군계 (그림 재질·장식): 동굴 칸은 깊이·열에 따라, 지상 칸 땅속은 열에 따라
// 파랑 동굴 줄(y=1): 드립스톤(x=1) 석회 종유 · 아이언베인(x=0) 광맥 수정 · 루트홀로우(x=-1) 이끼 뿌리
const CAVE_BIO = (x, y) => (y === 3 ? "magma" : y === 2 ? "deep" : x === -1 ? "lush" : y === 1 && x === 1 ? "drip" : y === 1 && x === 0 ? "mine" : Math.abs(x) % 2 ? "geode" : "drip");
const GROUND_BIO = { "-3": "drip", "-2": "deep", "-1": "lush", 1: "drip", 2: "geode", 3: "magma" };
export const biomeOf = (z) => (z.y > 0 ? CAVE_BIO(z.x, z.y) : GROUND_BIO[z.x] ?? "drip");
