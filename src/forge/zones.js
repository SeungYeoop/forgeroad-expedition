// 격자 지도 — 7×7 칸, 가운데가 거점. 칸 하나 = 구역 하나.
import { ZBG, ZPAL } from "./bgzones.js";
// 세로는 높이: 위 3줄은 하늘(높을수록 높은 하늘), 아래 3줄은 지하(낮을수록 깊은 땅속), 가운데 줄은 지상.
// 가로는 바이옴: 지상 줄은 칸마다 다른 땅이고, 하늘·지하 줄도 그 아래(위) 지상 땅의 색과 몬스터가 섞인다.
// 구역 안에서: 왼쪽 끝 출구 = 서쪽 칸, 오른쪽 끝 = 동쪽 칸, ▲ 문 = 위 칸(하늘 쪽), ▼ 문 = 아래 칸(지하 쪽).
// 엔진은 "거리 줄" 하나로 돌아가므로, 칸마다 줄 위에 [숨은 던전 5조각][구역 8조각] 자리를 따로 잡아 둔다.
// 난이도는 줄 위치가 아니라 거점에서 떨어진 칸 수(고리)로 정한다 (diffDist).
import { FR_REGIONS } from "./world.js";
import { BESTIARY } from "./bestiary.js";

const VT = 32, ME = 6, POCKET = 5, ZLEN = 16, N = 3;
// 원래 지역(그림 재료) 번호
const ART = { ash: 0, mist: 1, mine: 2, marsh: 3, fort: 4, frost: 5, glass: 6, spire: 7, crystal: 8, sky: 9, shadow: 10, core: 11 };
// 지상 줄: x → [그림, 이름, 형용사]
const GROUND = {
  "-3": [ART.frost, "서리 절벽", "서리"],
  "-2": [ART.marsh, "검은 늪지", "늪지"],
  "-1": [ART.mist, "이끼 숲", "이끼"],
  1: [ART.ash, "재의 들판", "잿빛"],
  2: [ART.glass, "유리 모래톱", "유리"],
  3: [ART.fort, "용암 요새", "불꽃"],
};
// 하늘·지하 줄: y → [그림, 이름, 층 이름]
const LAYER = {
  "-3": [ART.spire, "뇌운 첨탑", "높은 하늘"],
  "-2": [ART.crystal, "빛의 정원", "구름 위"],
  "-1": [ART.sky, "구름 섬", "낮은 하늘"],
  1: [ART.mine, "광맥 동굴", "얕은 지하"],
  2: [ART.shadow, "그림자 심연", "깊은 지하"],
  3: [ART.core, "용암 핵", "땅의 핵"],
};
// 새 지역 설계로 다시 만든 구역 = 파랑(고리 1) 8곳. 이름·색·배경·입자 + 층 띠별 몬스터(bestiary.js)
//   look: 배경(bgnew THEME)·분위기(atmo)·음악(audmusic)이 이 이름으로 고른다
const REMADE = {
  g1_0: { name: "그래스메어", look: "grassmere", particle: "pollen",
    pal: { sky: [0x3f86d6, 0xcdeaf8], far: 0x7f9cc4, mid: 0x5f9a5c, near: 0x355f3c, top: 0x6aaf48, topHi: 0xb6e070, soil: 0x86684a, soilDark: 0x46342a, soilHi: 0xa8885e, rock: 0x9c9686, accent: 0xffe08a, fog: 0xeaf6ff, glow: 0xfff2c8 } },
  gm1_0: { name: "모스바크", look: "mossbark", particle: "fireflies",
    pal: { sky: [0x3e6e66, 0xbfe0c8], far: 0x6a8e7c, mid: 0x3e6a48, near: 0x203c28, top: 0x4e9436, topHi: 0x9ad060, soil: 0x5c4834, soilDark: 0x2e2218, soilHi: 0x7c6246, rock: 0x6e7c64, accent: 0xd8f070, fog: 0xd8f0e0, glow: 0xf0f8c0 } },
  g0_m1: { name: "그린스텝", look: "greenstep", particle: "pollen", theme: "plains",
    pal: { sky: [0x3f74c6, 0xffe2c0], far: 0xd2a89c, mid: 0xb08a7c, near: 0x7a5a52, top: 0x8cc240, topHi: 0xd8ee7a, soil: 0x9c5c3e, soilDark: 0x5a3020, soilHi: 0xc27a50, rock: 0xd09a72, accent: 0xffd27a, fog: 0xfff2e6, glow: 0xfff0d0 } },
  g1_m1: { name: "스톤브리지", look: "stonebridge", particle: "clouds",
    pal: { sky: [0x5a8ad0, 0xd8ecfa], far: 0x9ab4d8, mid: 0x7a94b8, near: 0x4a6488, top: 0x86b456, topHi: 0xc8e488, soil: 0x9a8a72, soilDark: 0x5a4e40, soilHi: 0xbaa88a, rock: 0xc8bca4, accent: 0x9ad8ff, fog: 0xf0f6ff, glow: 0xfff4d8 } },
  gm1_m1: { name: "리프크라운", look: "leafcrown", particle: "pollen", theme: "forest",
    pal: { sky: [0x5aa0d8, 0xf0f4d0], far: 0xb8d4a8, mid: 0x6aa050, near: 0x2e5a2a, top: 0x58b038, topHi: 0xb0e85a, soil: 0x7a5434, soilDark: 0x3e2818, soilHi: 0x9a7048, rock: 0x8a6a48, accent: 0xffc040, fog: 0xf8ffe8, glow: 0xfff0b0 } },
  g0_1: { name: "아이언베인", look: "ironvein", particle: "drips",
    pal: { sky: [0x1c1a20, 0x4a4248], far: 0x3a3438, mid: 0x2c2628, near: 0x1a1618, top: 0x7a6a5a, topHi: 0xb09a80, soil: 0x5a4a3e, soilDark: 0x2a221c, soilHi: 0x7a6450, rock: 0x6a6670, accent: 0xd07a3a, fog: 0xc09070, glow: 0xffb060, ugRock: 0x6c6672, ugWall: 0x221e26 } },
  g1_1: { name: "드립스톤", look: "dripstone", particle: "drips",
    pal: { sky: [0x10202a, 0x2a4a58], far: 0x2a4048, mid: 0x1e3038, near: 0x121e24, top: 0xb8c4b8, topHi: 0xe8f0e4, soil: 0x6a7470, soilDark: 0x343c3c, soilHi: 0x8a948c, rock: 0x9aa8a4, accent: 0x60e0f0, fog: 0x80c8d8, glow: 0xa0f0ff, ugRock: 0xb0b4a4, ugWall: 0x2a3432 } },
  gm1_1: { name: "루트홀로우", look: "roothollow", particle: "spores",
    pal: { sky: [0x16101a, 0x3a2a40], far: 0x2e2232, mid: 0x221a26, near: 0x140e16, top: 0x6a5a3a, topHi: 0x9a8a5a, soil: 0x5a4030, soilDark: 0x2a1c14, soilHi: 0x7a5a40, rock: 0x5e5048, accent: 0x7af0a0, fog: 0x9a7ab0, glow: 0xb0ffd0, ugRock: 0x7a6e58, ugWall: 0x2a2018 } },
};
// 노랑 지역 손 설계 구역: 원래 지역 그림(배경·음악)은 그대로, 땅 덮개·윗면 색만 덧씌운다
const NAMES = {
  g0_m2: "글래스블룸", g1_m2: "애쉬펠", gm1_m2: "모스스파이어", gm2_m2: "스포어캡", g2_m2: "앰버홀드", g2_m1: "듄미스트", gm2_m1: "보그플로트",
  g0_2: "섀도웰", g1_2: "본디프", gm1_2: "웹크로프트", g2_2: "미러딥", gm2_2: "미스트혼", g2_1: "샌드글래스", gm2_1: "마이어루트", g2_0: "글리머샌즈", gm2_0: "블랙펜",
};
const TWEAK = {
  g2_m2: { theme: "plains", pal: { top: 0x9a8a5a, topHi: 0xd8c890, accent: 0xff7030 } },
  gm2_m2: { theme: "plains", deco: "green", pal: { top: 0xb05a8a, topHi: 0xf0a0d0, accent: 0x90ffd0 } },
  gm1_m2: { theme: "plains", deco: "green", pal: { top: 0x5aa850, topHi: 0xa8e080, accent: 0xff8040 } },
  gm2_m1: { theme: "plains", deco: "green", pal: { top: 0x5a7a3a, topHi: 0x9ab860, accent: 0xb0ff80 } },
  g2_m1: { theme: "desert", pal: { top: 0xe8c890, topHi: 0xfff0c8, accent: 0x80f0ff } },
  g1_m2: { theme: "plains", pal: { top: 0x8a8a6a, topHi: 0xc0b890, accent: 0xff9040 } },
  g0_m2: { theme: "plains", deco: "green", pal: { top: 0x7ad0a0, topHi: 0xc8f4d0, accent: 0xffe0f8 } },
};
// 층 띠별 몬스터 목록 (bestiary.js → 엔진·배치가 쓰는 꼴)
function layersOf(zid) {
  const B = BESTIARY[zid];
  if (!B) return null;
  const out = {};
  for (const [band, list] of Object.entries(B.bands))
    out[band] = { enemies: list.filter((m) => !m.e).map((m) => ({ id: m.id, w: m.w, pack: m.pack, t: m.t })), elites: list.filter((m) => m.e).map((m) => m.id) };
  return out;
}
// 바깥 고리(노랑·빨강) 구역: 같은 방향의 파랑 구역 몬스터를 빌려 쓴다 (세기는 고리에 맞춰 엔진이 올린다)
const blueOf = (x, y) => `g${Math.sign(x)}_${Math.sign(y)}`.replace(/-/g, "m");
export const LAYER_NAME = (y) => (y === 0 ? "지상" : LAYER[y][2]);
// 보스가 사는 칸 (그림 지역마다 한 곳)
const BOSS_AT = { "2,-2": ART.ash, "-2,2": ART.mist, "2,0": ART.glass, "-2,0": ART.marsh, "3,0": ART.fort, "-3,0": ART.frost, "3,-1": ART.sky, "-3,-2": ART.crystal, "0,-3": ART.spire, "-3,1": ART.mine, "3,2": ART.shadow, "0,3": ART.core };

export const DANGER = [
  null,
  { name: "파랑", label: "위험 낮음", color: 0x4a90ff, css: "#6aa8ff" },
  { name: "노랑", label: "위험", color: 0xffc83a, css: "#ffd060" },
  { name: "빨강", label: "매우 위험", color: 0xff4a3a, css: "#ff7060" },
  { name: "검정", label: "숨은 던전", color: 0x9a5ad8, css: "#c090ff" },
];
export const HUB_ID = "hub";
export const ZONES = []; // 줄 위 순서 (던전·구역 모두)
// 공사 중 (파랑 지역 다시 짓기 중, 아직 확인받지 않은 곳): 들어갈 수 없고 지도에 표시한다
//   확인받으면 여기서 빼면 열린다. 개발 도구는 window.__devUnlock = 1 로 들어간다
export const LOCKED = new Set([]);
export const OPEN_LVL = { g1_0: 0, g0_m1: 2, g1_m1: 4 };
// 빨강(고리 3) 지역은 봉인: 들어갈 수 없다 (공사 중과 따로 표시)
export const isSealed = (id) => BY_ID[id]?.kind === "zone" && BY_ID[id].ring >= 3;
export const isLocked = (id) => (LOCKED.has(id) || isSealed(id)) && !(typeof window !== "undefined" && window.__devUnlock);
export const lockTag = (id) => (isSealed(id) ? "봉인" : "공사 중");
export const BY_ID = {};
export const CELLS = {}; // "x,y" → 구역
export const FR_WORLD = []; // 엔진 지역 목록 (칸마다 하나: 던전 + 구역)
export const SKY_EDGE = new Set(); // 충돌만 있는 벽 칸 (타일 x)

const key = (x, y) => `${x},${y}`;
const lerp = (a, b, t) => {
  const c = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = c(a), [r2, g2, b2] = c(b);
  return (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t);
};
function mixPal(a, b, t) {
  const o = {};
  for (const k of Object.keys(a)) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => lerp(v, b[k]?.[i] ?? v, t)) : typeof a[k] === "number" ? lerp(a[k], b[k] ?? a[k], t) : a[k];
  return o;
}
const hash = (...a) => {
  let h = 2166136261 >>> 0;
  for (const v of a) for (const ch of String(v)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
};
export const roll = (...a) => hash(...a) / 4294967296;

// ── 만들기 ──────────────────────────────────────────
(function build() {
  const cells = [];
  for (let y = -N; y <= N; y++) for (let x = -N; x <= N; x++) (x || y) && cells.push([x, y]);
  // 줄 위 순서: 안쪽 고리부터
  const ring = ([x, y]) => Math.max(Math.abs(x), Math.abs(y));
  cells.sort((a, b) => ring(a) - ring(b) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  let c = 2; // 0~1 조각은 비워 둔다 (탐험 시작 직후 잠깐 서 있는 자리)
  for (const [x, y] of cells) {
    const r = ring([x, y]);
    // 고리 안 세부 난이도 0~11 (드롭 등급·재료·적 세기 기준)
    // 열린 세 지역은 티어 사다리로: 그래스메어 T1~2 → 그린스텝 T3~4 → 스톤브리지 T5~6 (적 세기·드롭 티어·재료 모두)
    const lvl = OPEN_LVL[`g${x}_${y}`.replace(/-/g, "m")] ?? Math.min(11, (r - 1) * 4 + Math.min(3, Math.abs(x) + Math.abs(y) - r));
    const g = GROUND[x], L = LAYER[y];
    const artI = y === 0 ? g[0] : L[0];
    const art = FR_REGIONS[artI];
    const colArt = g ? FR_REGIONS[g[0]] : null;
    const name = y === 0 ? g[1] : x === 0 ? L[1] : `${g[2]} ${L[1]}`;
    const bossArt = BOSS_AT[key(x, y)];
    const id = `g${x}_${y}`.replace(/-/g, "m");
    const d = { id: `d_${id}`, kind: "dungeon", x, y, ring: r, lvl, c0: c, c1: c + POCKET, name: `${name} 숨은 던전`, short: "숨은 던전" };
    const z = { id, kind: "zone", x, y, ring: r, lvl, c0: c + POCKET, c1: c + POCKET + ZLEN, name, short: name, boss: bossArt != null, art: artI };
    c += POCKET + ZLEN;
    ZONES.push(d, z);
    CELLS[key(x, y)] = z;
    // 엔진용 지역
    const reg = {
      ...art,
      id: `w_${id}`,
      bgId: art.id,
      src: art.id,
      srcIdx: artI,
      name,
      sub: "",
      start: d.c0 * VT - ME,
      end: z.c1 * VT - ME,
      boss: bossArt != null ? FR_REGIONS[bossArt].boss : null,
      enemies: [],
      pal: colArt && y !== 0 ? mixPal(art.pal, colArt.pal, 0.35) : art.pal,
      idx: lvl,
      ceiling: y > 0 ? Math.max(0.75, art.ceiling ?? 0) : y < 0 ? 0 : art.ceiling,
      patterns: y < 0 ? { ...art.patterns, floating: (art.patterns.floating ?? 0) + 4, platforms: (art.patterns.platforms ?? 0) + 2 } : art.patterns,
      density: 2.3 + lvl * 0.07,
      eliteChance: 0.06 + lvl * 0.008,
      zone: z,
    };
    // 새 지역 설계로 다시 만든 구역: 이름·색·배경 (docs/REGIONS.md) + 층 띠별 몬스터
    if (NAMES[id]) (reg.name = NAMES[id]), (z.name = z.short = NAMES[id]), (d.name = `${NAMES[id]} 숨은 던전`);
    const TW = TWEAK[id];
    TW && (reg.theme = TW.theme ?? reg.theme, reg.deco = TW.deco, reg.pal = { ...reg.pal, ...(TW.pal ?? {}) });
    const NEW = REMADE[id];
    if (NEW) {
      Object.assign(reg, NEW);
      z.name = z.short = reg.name;
      d.name = `${reg.name} 숨은 던전`;
    }
    // 새로 지은 20곳: 전용 배경 (bgzones.js) + 배경 색
    if (ZBG["z_" + id]) (reg.zbg = "z_" + id), (reg.zbgRef = /^(gm1_0|g2_0|gm2_0)$/.test(id) ? 5000 : 8448), ZPAL[id] && (reg.pal = { ...reg.pal, ...ZPAL[id] });
    // 자기 몬스터가 있는 구역(파랑 8곳 + 다 만든 노랑 구역)은 자기 목록, 아직 없으면 같은 방향 파랑 구역 것을 빌린다
    const LY = layersOf(BESTIARY[id] ? id : NEW ? id : blueOf(x, y)) ?? layersOf("g1_0");
    reg.layers = LY;
    // 엔진이 쓰는 기본 목록 (떠도는 정예 무리·매복 행사): 지표(지상) 또는 모든 띠
    reg.enemies = LY.ground?.enemies ?? Object.values(LY).flatMap((b) => b.enemies);
    reg.elites = LY.ground?.elites ?? Object.values(LY).flatMap((b) => b.elites);
    FR_WORLD.push(reg);
    z.reg = d.reg = reg;
  }
  for (const z of ZONES) BY_ID[z.id] = z;
  // 구역 양 끝: 보이지 않는 벽 (보이는 바위 벽 없이 캐릭터가 넘어가지 못하게)
  for (const z of ZONES) for (const t of [z.c0 * VT, z.c0 * VT + 1, z.c1 * VT - 1, z.c1 * VT - 2]) SKY_EDGE.add(t);
})();

// ── 찾기 ────────────────────────────────────────────
export function zoneAtChunk(c) {
  let lo = 0, hi = ZONES.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1, z = ZONES[m];
    if (c < z.c0) hi = m - 1;
    else if (c >= z.c1) lo = m + 1;
    else return z;
  }
  return null;
}
export const zoneAtTile = (t) => zoneAtChunk(Math.floor(t / VT));
export const isFirst = (c) => zoneAtChunk(c)?.c0 === c;
export const isLast = (c) => zoneAtChunk(c)?.c1 - 1 === c;
export const isPocket = (c) => zoneAtChunk(c)?.kind === "dungeon";
export const dangerOf = (z) => DANGER[z.kind === "dungeon" ? 4 : z.ring];
export const cell = (x, y) => (x === 0 && y === 0 ? HUB_ID : CELLS[key(x, y)] ?? null);
export const pocketOf = (z) => BY_ID[`d_${z.id}`];
export const zoneOfPocket = (d) => BY_ID[d.id.slice(2)];
// 난이도용 거리: 고리 안 세부 난이도(lvl) → 원래 지역 구간의 거리
export function diffDist(A) {
  const z = zoneAtTile(Math.floor(A) + ME);
  if (!z) return A;
  const R = FR_REGIONS[z.lvl], reg = z.reg;
  const f = Math.max(0, Math.min(1, (A - reg.start) / Math.max(1, reg.end - reg.start)));
  return R.start + f * (R.end - R.start) + (z.kind === "dungeon" ? 150 : 0);
}

// ── 문 ──────────────────────────────────────────────
// 위·아래 문은 구역 3분의 1, 3분의 2 지점 조각에
// 하늘로 오르는 섬들이 넓게 퍼지도록 구역 가운데에
export const upChunk = (z) => z.c0 + 8;
// 보스 방 근처(뒤 4조각)에는 지하가 없으므로 앞쪽에
export const downChunk = (z) => z.c0 + 6;
// 이번 탐험의 무작위 내용물
let RUN_SEED = 0;
export const setRunSeed = (s) => (RUN_SEED = s >>> 0);
export const runSeed = () => RUN_SEED;
// 숨은 던전: 바깥 고리일수록 잘 나온다
export const hasDungeon = (z) => z.kind === "zone" && roll(RUN_SEED, "dg", z.id) < 0.12 + z.ring * 0.06;
// 숨은 던전 입구는 위·아래 문 사이 조각에
export const dungeonChunk = (z) => z.c0 + 10;
export const packChunk = (z) => (z.kind === "zone" && roll(RUN_SEED, "pk", z.id) < 0.35 ? z.c0 + 1 + (hash(RUN_SEED, "pkc", z.id) % (ZLEN - 3)) : -1);
export const waystoneOk = (z) => z?.kind === "zone" && z.ring >= 2 && roll(RUN_SEED, "ws", z.id) < 0.5;
export function chestRoll(c, k, tier) {
  const z = zoneAtChunk(c);
  if (!z) return tier;
  if (z.kind === "dungeon") return Math.max(1, tier);
  // 층별 몬스터 구역: 상자 등급은 지키는 무리 세기로 이미 정해졌다 (탐험마다 자리·등급이 다시 짜인다)
  if (z.reg?.layers) return tier;
  if (roll(RUN_SEED, "ch", c, k) < 0.3) return null;
  // 구역 설계가 놓은 상자는 tier가 곧 "찾기 어려운 정도" (하늘 꼭대기·깊은 지하는 좋은 상자가 잘 나온다)
  const q = roll(RUN_SEED, "ct", c, k) + (z.ring - 1) * 0.06;
  return q > 0.95 ? 2 : q > 0.68 ? 1 : 0;
}
// 구역의 출구 목록: [{at: "L"|"R"|"U"|"D"|"DG", to: 구역 id | HUB_ID, back: 도착할 자리}]
export function exitList(z) {
  if (z.kind === "dungeon") {
    const host = zoneOfPocket(z);
    return [{ at: "L", to: host.id, back: "DG" }, { at: "R", to: host.id, back: "DG" }];
  }
  const out = [];
  const W = cell(z.x - 1, z.y), E = cell(z.x + 1, z.y), U = cell(z.x, z.y - 1), D = cell(z.x, z.y + 1);
  W && out.push({ at: "L", to: W.id ?? W, back: "R" });
  E && out.push({ at: "R", to: E.id ?? E, back: "L" });
  U && out.push({ at: "U", to: U.id ?? U, back: "D" });
  D && out.push({ at: "D", to: D.id ?? D, back: "U" });
  hasDungeon(z) && out.push({ at: "DG", to: pocketOf(z).id, back: "L" });
  return out;
}

// ── 지도 그리기 (Hud 위에 겹친다) ─────────────────────
// 정사각형 칸 7×7. 칸에는 색·표시만, 이름은 오른쪽 정보창(마우스를 올린 칸 / 지금 칸)에.
export function drawMap(hud, R, cur, seen, extra = {}) {
  const { ot: W, xt: H, ct } = R;
  const objs = [];
  const add = (o, d = 0) => (objs.push(o), o.setScrollFactor?.(0), o.setDepth(460 + d), o);
  add(hud.add.rectangle(0, 0, W, H, 0x06050a, 0.95).setOrigin(0).setInteractive());
  add(hud.add.rectangle(10, 10, W - 20, H - 20).setOrigin(0).setStrokeStyle(1, 0x7a5434));
  add(ct(hud, 20, 14, "구역 지도", "big", "#f2e6c4"));
  add(ct(hud, W - 20, 18, "[M] 닫기", "tiny", "#a89070").setOrigin(1, 0));
  const SZ = 38, GAP = 2, PITCH = SZ + GAP;
  const GX = 104, GY = 48; // 격자 왼쪽 위
  const P = (x, y) => [GX + (x + N) * PITCH + SZ / 2, GY + (y + N) * PITCH + SZ / 2];
  const g = add(hud.add.graphics(), 1);
  const here = cur?.kind === "dungeon" ? zoneOfPocket(cur) : cur;
  // 층 이름 (왼쪽)
  for (let y = -N; y <= N; y++) {
    const [, py] = P(-N, y);
    add(ct(hud, GX - 6, py - 5, LAYER_NAME(y), "tiny", y < 0 ? "#9cc8ff" : y > 0 ? "#d0a070" : "#c8e090").setOrigin(1, 0), 2);
  }
  // 오른쪽 정보창
  const IX = GX + 7 * PITCH + 18, IW = W - 20 - IX;
  add(hud.add.rectangle(IX - 8, GY, IW + 8, 7 * PITCH - GAP, 0x140e18, 0.8).setOrigin(0).setStrokeStyle(1, 0x5a4030), 1);
  const iName = add(ct(hud, IX, GY + 8, "", "body", "#f2e6c4"), 2);
  const iSub = add(ct(hud, IX, GY + 28, "", "tiny", "#c8b898"), 2);
  const iMore = add(ct(hud, IX, GY + 44, "", "tiny", "#a89070", { wordWrap: { width: IW - 8, useAdvancedWrap: !0 } }), 2);
  const info = (z) => {
    if (!z) return void (iName.setText("거점").setColor("#ffe08a"), iSub.setText("안전 지대"), iMore.setText("갈림길 요새 · 서문·동문은 지상, 하늘 승강장은 하늘, 갱도 승강기는 지하로 이어진다."));
    const D = dangerOf(z), s = seen[z.id] || here === z;
    if (isLocked(z.id)) return void (iName.setText(`${z.name} (${lockTag(z.id)})`).setColor(isSealed(z.id) ? "#d07a70" : "#9a9aa0"), iSub.setText(`${LAYER_NAME(z.y)} · 아직 갈 수 없다`), iMore.setText(isSealed(z.id) ? "붉은 봉인이 길을 막고 있다. 아직 아무도 이 너머로 가지 못했다." : "이 지역은 다시 짓는 중이라 문이 닫혀 있다."));
    iSub.setText(`${LAYER_NAME(z.y)} · ${D.name} ${D.label}`);
    iName.setText(s ? z.name : "가 보지 않은 땅").setColor(s ? D.css : "#a89070");
    const m = [];
    here === z && m.push("지금 여기 있다");
    z.boss && m.push("보스가 산다");
    extra.dungeons?.includes(z.id) && m.push("이번 탐험에서 숨은 던전 입구를 봤다");
    iMore.setText(m.join(" · "));
  };
  // 칸
  for (let y = -N; y <= N; y++)
    for (let x = -N; x <= N; x++) {
      const [px, py] = P(x, y);
      const h2 = SZ / 2;
      const hit = add(hud.add.rectangle(px, py, SZ, SZ, 0, 0).setInteractive({ useHandCursor: !0 }), 4);
      if (!x && !y) {
        g.fillStyle(0x4a3418, 1).fillRect(px - h2, py - h2, SZ, SZ);
        g.lineStyle(2, 0xffe08a, 1).strokeRect(px - h2, py - h2, SZ, SZ);
        add(ct(hud, px, py, "거점", "tiny", "#ffe08a").setOrigin(0.5), 2);
        hit.on("pointerover", () => info(null));
        continue;
      }
      const z = CELLS[key(x, y)], D = dangerOf(z), s = seen[z.id];
      if (isLocked(z.id)) {
        // 공사 중: 어두운 칸 + 빗금 + 자물쇠
        const sl = isSealed(z.id);
        g.fillStyle(sl ? 0x2a1214 : 0x1c1a20, 1).fillRect(px - h2, py - h2, SZ, SZ);
        g.lineStyle(1, sl ? 0x7a3a34 : 0x5a5860, 1).strokeRect(px - h2, py - h2, SZ, SZ);
        for (let k = -SZ; k < SZ; k += 7) g.lineStyle(1, sl ? 0x4a2024 : 0x3a3840, 1).lineBetween(px - h2 + Math.max(0, k), py - h2 + Math.max(0, -k), px - h2 + Math.min(SZ, k + SZ), py - h2 + Math.min(SZ, SZ - k));
        g.fillStyle(0x9a9aa0, 1).fillRect(px - 5, py - 1, 10, 8);
        g.lineStyle(2, 0x9a9aa0, 1).strokeCircle(px, py - 3, 4);
        g.fillStyle(0x1c1a20, 1).fillRect(px - 4, py - 3, 8, 2);
        hit.on("pointerover", () => info(z));
        hit.on("pointerout", () => info(here ?? null));
        continue;
      }
      g.fillStyle(D.color, s ? 0.6 : 0.16).fillRect(px - h2, py - h2, SZ, SZ);
      g.lineStyle(1, D.color, s ? 1 : 0.45).strokeRect(px - h2, py - h2, SZ, SZ);
      // 층 표시: 하늘 = 위쪽 띠, 지하 = 아래쪽 띠
      y < 0 && g.fillStyle(0xcfe6ff, s ? 0.5 : 0.18).fillRect(px - h2 + 2, py - h2 + 2, SZ - 4, 3);
      y > 0 && g.fillStyle(0x6a4a2a, s ? 0.8 : 0.3).fillRect(px - h2 + 2, py + h2 - 5, SZ - 4, 3);
      z.boss && (g.fillStyle(0x140e18, 1).fillRect(px + h2 - 10, py - h2 + 3, 7, 7), g.fillStyle(0xff6050, 1).fillRect(px + h2 - 9, py - h2 + 4, 5, 5));
      extra.dungeons?.includes(z.id) && g.fillStyle(DANGER[4].color, 1).fillTriangle(px - h2 + 3, py - h2 + 10, px - h2 + 11, py - h2 + 10, px - h2 + 7, py - h2 + 3);
      s && g.fillStyle(0xffffff, 0.85).fillCircle(px, py + 3, 2);
      if (here === z) {
        const ring = add(hud.add.rectangle(px, py, SZ + 2, SZ + 2).setStrokeStyle(2, 0xffffff), 3);
        hud.tweens.add({ targets: ring, alpha: 0.2, duration: 600, yoyo: !0, repeat: -1 });
      }
      hit.on("pointerover", () => info(z));
      hit.on("pointerout", () => info(here ?? null));
    }
  info(here ?? null);
  // 범례
  let ly = GY + 7 * PITCH - GAP - 66;
  for (const D of DANGER.slice(1)) {
    add(hud.add.rectangle(IX, ly + 3, 7, 7, D.color).setOrigin(0), 2);
    add(ct(hud, IX + 12, ly, `${D.name} · ${D.label}`, "tiny", D.css), 2);
    ly += 12;
  }
  add(ct(hud, IX, ly + 2, "■ 보스  ▲ 숨은 던전  · 가 본 곳", "tiny", "#a89070"), 2);
  add(ct(hud, IX, ly + 14, "빗금 칸 = 공사 중 · 붉은 빗금 = 봉인 (갈 수 없다)", "tiny", "#9a9aa0"), 2);
  return objs;
}
