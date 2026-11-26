// 지상 구역 3곳의 땅 위 (지표 + 하늘) — skyisles 지상 모드 + 맵마다 땅 위 큰 지형물과 상징 구조물
//   모스바크 「이끼 거목 숲」 · 글리머샌즈 「유리 사구」 · 블랙펜 「가라앉은 마을」 (땅속은 archi_under.js 그대로)
import { skyisles } from "./skyisles.js";
import { nat, PL, jag } from "./archi_sky.js";
import { hold, pillar } from "./archi_skymaps.js";

const d = (n, m, t, props, top) => ({ n, m, t: t.split(" "), props, top: top.split(" ") });
// 높이 띠 셋(지표 가까이 · 가운데 · 높은 하늘) × 서·동
const band = (L) => (x, f) => L[(f > 400 ? 0 : f > 220 ? 1 : 2) * 2 + (x < 512 ? 0 : 1)];
const rows = (T, a, b) => T.slice(a, b + 1);

// 땅 위 바위 덩어리(언덕·메사): 윗면은 평평, 속엔 지표 높이의 빈 방(양옆으로 드나든다) + 윗면에서 내려오는 사다리
function outcrop(K, GR, x0, x1, h, m, name, ri, o = {}) {
  let g = 1e9;
  for (let x = x0; x < x1; x++) g = Math.min(g, GR(x));
  const top = g - h, sd = (x0 * 11 + h) % 997;
  nat(K, x0, x1, () => top, (x) => GR(x) + 6, { flat: 1, sh: 3, fingers: 0, warp: o.warp ?? 4, rough: 2.4, seed: sd });
  // 속 굴: 지표를 따라 덩어리를 관통 (걸어서 지나간다) — 가운데는 높게 넓혀 방으로, 윗면에서 사다리로 내려온다
  const rh = Math.min(h - 6, ri(12, 15));
  for (let x = x0 - 3; x < x1 + 3; x++) {
    const gx = GR(x), mid = Math.max(0, 1 - Math.abs(x - (x0 + x1) / 2) / ((x1 - x0) / 2));
    const hh = Math.min(rh + Math.round(mid * 4), gx - top - 4);
    hh > 8 && (K.air(x, gx - hh, x + 1, gx), K.wall(x, gx - hh, x + 1, gx, m));
  }
  const lx = ri(x0 + 10, x1 - 12), lg = GR(lx);
  if (lg - rh - top > 3) (K.air(lx - 1, top, lx + 2, lg - rh), K.plank(lx - 1, lx + 2, top), K.ladder(lx, top, lg));
  const cx = (x0 + x1) >> 1, cg = GR(cx);
  K.tag(cx - 16, cg - 12, cx + 16, cg, o.role ?? "treasure");
  o.props && K.prop(cx, cg, o.props[ri(0, o.props.length - 1)]);
  K.struct(`${name} 속 굴`, o.role ?? "treasure", x0, cg - rh, x1, cg);
  o.topProps && K.prop((x0 + x1) >> 1, top, o.topProps[ri(0, o.topProps.length - 1)]);
  K.tag(x0 + 4, top - 14, x1 - 4, top, "arena"), K.struct(name, "언덕", x0, top, x1, g);
  return [x0, x1, top];
}

// ═══ 모스바크 「이끼 거목 숲」 — 속이 빈 거목 셋(층마다 굴) · 그 위 이끼 수관 섬 · 지표 이끼 바위 · 수관 사이 이끼 섬 ═══
const gm1_0 = (surfRow) => ({
  seed: 0x5b07, peak: 480, gap: [74, 96], iw: [50, 130], gx: [20, 50], dep: [24, 50], jit: 18, ceil: 60, fing: 26,
  link: { bridge: 4, crumble: 1, cloud: 1, ferry: 1 }, vert: ["vine", "vine", "rope"], ground: surfRow,
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 5], [x0 + w * 0.1, f + D * 0.7], [x0 + w * 0.5, f + D * (0.8 + R() * 0.2)], [x1 - w * 0.1, f + D * 0.65], [x1, f + 5]]; },
  pick: band([
    d("이끼 바위 언덕", "rock", "pillars cistern steps shrine", ["p_moss", "p_fern", "p_shroom", "p_log"], "plain pool steps"),
    d("사슴 풀밭", "wood", "bunks workshop cistern", ["p_fern", "p_bush", "p_log", "p_flowers"], "hut plain"),
    d("수관 마을", "wood", "bunks workshop library shrine", ["p_lamp", "p_crates", "p_fern", "p_nest"], "hut plain tower"),
    d("반딧불 수관", "wood", "shrine cistern balcony ell", ["p_lamp", "p_fern", "p_moss", "p_flowers"], "plain hut"),
    d("우듬지 둥지", "wood", "vault tower library cage", ["p_nest", "p_bones", "p_fern", "p_lamp"], "tower plain"),
    d("구름 수관", "rock", "pillars ore steps vault", ["p_fern", "p_moss", "p_nest", "p_flowers"], "steps plain"),
  ]),
  surface: (K, { ri, GR }) => [
    outcrop(K, GR, 40, 110, 26, "rock", "이끼 바위", ri, { props: ["p_shroom", "p_fern"], topProps: ["p_moss"] }),
    outcrop(K, GR, 300, 360, 20, "rock", "쓰러진 거목 밑동", ri, { props: ["p_log", "p_fern"], topProps: ["p_shroom"] }),
    outcrop(K, GR, 640, 720, 30, "rock", "이끼 바위", ri, { props: ["p_nest", "p_fern"], topProps: ["p_moss"] }),
    outcrop(K, GR, 900, 980, 22, "rock", "사슴 바위", ri, { role: "rest", props: ["p_font"], topProps: ["p_fern"] }),
  ],
  place: (K, { tiers, T }) => {
    const k = Math.min(4, T.length - 1);
    for (const [x0, x1] of [[150, 196], [470, 522], [790, 836]]) (hold(tiers, T, 1, Math.min(3, T.length - 2), x0, x1, 0), hold(tiers, T, k, k, x0 - 70, x1 + 70, 30));
  },
  sig: (K, { T, ri, G0 }) => {
    const k = Math.min(3, T.length - 2);
    for (const [x0, x1] of [[150, 196], [470, 522], [790, 836]]) {
      let g = 0;
      for (let x = x0 - 10; x < x1 + 10; x++) g = Math.max(g, G0(x));
      pillar(K, x0, x1, T[k] - 16, g, rows(T, 1, k), "wood", "이끼 거목", ri, { n: "거목 속", m: "wood", props: ["p_lamp", "p_nest", "p_fern"], bulge: [2, 5], skin: "wood" });
      K.air(x0 - 20, g - 11, x1 + 20, g), K.wall(x0 - 20, g - 11, x1 + 20, g, "wood");
    }
  },
});

// ═══ 글리머샌즈 「유리 사구」 — 지표 유리 메사(속 방) · 사암 하늘섬 · 거대 유리 첨탑 기둥 ═══
const g2_0 = (surfRow) => ({
  seed: 0x6c31, peak: 520, gap: [76, 98], iw: [60, 160], gx: [24, 58], dep: [20, 44], jit: 22, ceil: 60, fing: 60, inner: 0.7,
  link: { cloud: 3, bridge: 3, ferry: 2, crumble: 1 }, vert: ["rope", "ladder"], ground: surfRow,
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 2], [x0 + w * 0.12, f + D * 0.5], [x0 + w * (0.3 + R() * 0.4), f + D], [x1 - w * 0.15, f + D * 0.5], [x1, f + 2]]; },
  pick: band([
    d("유리 메사", "rock", "ore vault pillars steps", ["p_crystal", "p_urn", "p_bones", "p_cairn"], "plain steps"),
    d("대상 쉼터", "wood", "bunks workshop cistern", ["p_yurt", "p_crates", "p_urn", "p_cart"], "hut pool plain"),
    d("모래 사원", "brick", "shrine vault library tower", ["p_statue", "p_urn", "p_candles", "p_menhir"], "steps tower"),
    d("빛 결정 언덕", "rock", "ore pit collapse ell", ["p_crystal", "p_crystal", "p_urn", "p_bones"], "plain ruin"),
    d("별 관측소", "brick", "library tower vault balcony", ["p_shelf", "p_crystal", "p_lamp", "p_flags"], "tower hut"),
    d("신기루 정원", "rock", "pillars steps cistern shrine", ["p_flowers", "p_crystal", "p_font", "p_bush"], "pool steps"),
  ]),
  surface: (K, { ri, GR }) => [
    outcrop(K, GR, 60, 170, 44, "brick", "유리 메사", ri, { props: ["p_crystal", "p_urn"], topProps: ["p_crystal"] }),
    outcrop(K, GR, 360, 430, 30, "rock", "모래 언덕 굴", ri, { props: ["p_bones", "p_urn"], topProps: ["p_cairn"] }),
    outcrop(K, GR, 600, 700, 52, "brick", "유리 메사", ri, { props: ["p_statue", "p_crystal"], topProps: ["p_crystal"] }),
    outcrop(K, GR, 860, 940, 34, "rock", "대상 바위", ri, { role: "rest", props: ["p_yurt"], topProps: ["p_flags"] }),
  ],
  place: (K, { tiers, T }) => hold(tiers, T, 1, Math.min(4, T.length - 1), 494, 540, 0, 494, 540),
  sig: (K, { T, ri, G0 }) => {
    const k = Math.min(4, T.length - 1);
    let g = 0;
    for (let x = 484; x < 550; x++) g = Math.max(g, G0(x));
    pillar(K, 494, 540, T[k] - 22, g, rows(T, 1, k), "brick", "거대 유리 첨탑", ri, { n: "유리 첨탑", m: "brick", props: ["p_crystal", "p_urn", "p_statue"] });
    K.prop(517, T[k] - 22, "p_crystal", { s: 2 }), K.tag(498, T[k] - 34, 536, T[k] - 22, "treasure");
  },
});

// ═══ 블랙펜 「가라앉은 마을」 — 지표 말뚝 집들(마루·지붕·사다리) · 속 빈 고목 기둥 둘 · 뿌리 늘어진 늪 섬 ═══
function stilts(K, GR, x0, w, ri, name) {
  let g = 1e9;
  for (let x = x0; x < x0 + w; x++) g = Math.min(g, GR(x));
  const fl = g - ri(10, 14), rf = fl - ri(14, 18);
  for (let x = x0 + 2; x < x0 + w; x += 10) K.wall(x, fl, x + 1, GR(x) + 2, "stem");
  K.plank(x0 - 4, x0 + w + 4, fl), K.wall(x0, rf, x0 + w, fl, "wood"), K.plank(x0 - 2, x0 + w + 2, rf);
  K.ladder(x0 - 2, fl, g), K.ladder(x0 + w - 3, rf, fl);
  K.prop(x0 + (w >> 1), fl, ["p_lamp", "p_crates", "p_shelf", "p_cage"][ri(0, 3)]), K.prop(x0 + 6, rf, "p_lamp");
  K.tag(x0 + 2, fl - 12, x0 + w - 2, fl, "treasure"), K.struct(`${name}`, "집", x0, rf, x0 + w, fl);
  return fl;
}
const gm2_0 = (surfRow) => ({
  seed: 0x7d1f, peak: 700, gap: [78, 100], iw: [50, 140], gx: [18, 46], dep: [30, 60], jit: 20, ceil: 60, fing: 16, rough: 3,
  link: { crumble: 3, bridge: 3, cloud: 1, ferry: 1 }, vert: ["vine", "vine", "rope"], ground: surfRow,
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 5], [x0 + w * 0.2, f + D * (0.6 + R() * 0.3)], [x0 + w * 0.45, f + D * 0.7], [x0 + w * 0.6, f + D], [x1 - w * 0.2, f + D * 0.65], [x1, f + 5]]; },
  pick: band([
    d("말뚝 마을", "wood", "bunks workshop cistern cage", ["p_log", "p_lamp", "p_crates", "p_roots"], "pool hut"),
    d("썩은 늪가", "rock", "cistern pit collapse pillars", ["p_shroom", "p_roots", "p_moss", "p_bones"], "pool plain"),
    d("늪 무당 집", "wood", "shrine cage library vault", ["p_skulls", "p_candles", "p_bones", "p_dead"], "hut tower"),
    d("뿌리 굴", "wood", "split ell vault library", ["p_roots", "p_shelf", "p_lamp", "p_urn"], "hut ruin"),
    d("까마귀 둥지", "rock", "pit pillars ore steps", ["p_nest", "p_dead", "p_bones", "p_moss"], "plain ruin"),
    d("도깨비불 고목", "rock", "steps shrine pillars ell", ["p_dead", "p_fern", "p_roots", "p_log"], "ruin pool"),
  ]),
  surface: (K, { ri, GR }) => {
    let x = 30, n = 0;
    while (x < 980) {
      if (x > 220 && x < 290 || x > 600 && x < 670) { x += 70; continue; }
      const w = ri(28, 46);
      stilts(K, GR, x, w, ri, `가라앉은 집 ${++n}`);
      x += w + ri(26, 70);
    }
    return [outcrop(K, GR, 400, 470, 24, "rock", "늪 사당 바위", ri, { role: "rest", props: ["p_altar"], topProps: ["p_candles"] })];
  },
  place: (K, { tiers, T }) => { for (const [x0, x1] of [[236, 278], [616, 660]]) hold(tiers, T, 1, Math.min(3, T.length - 1), x0, x1, 0); },
  sig: (K, { T, real, ri, G0 }) => {
    const k = Math.min(3, T.length - 1);
    for (const [x0, x1] of [[236, 278], [616, 660]]) {
      let g = 0;
      for (let x = x0 - 10; x < x1 + 10; x++) g = Math.max(g, G0(x));
      pillar(K, x0, x1, T[k] - 16, g, rows(T, 1, k), "wood", "속 빈 고목", ri, { n: "고목 속", m: "wood", props: ["p_skulls", "p_candles", "p_roots"], bulge: [2, 6], skin: "wood" });
      K.air(x0 - 20, g - 11, x1 + 20, g), K.wall(x0 - 20, g - 11, x1 + 20, g, "wood");
    }
    for (const s of real) if (s.tier > 0) for (let x = s.x0 + 10; x < s.x1 - 10; x += ri(22, 40)) {
      let y = s.f + 2;
      while (y < 1050 && K.get(x, y) === 1) y++;
      K.vine(x - 1, x + 1, y - 2, Math.min(y + ri(12, 34), G0(x) - 6));
    }
  },
});

const MK = { gm1_0, g2_0, gm2_0 };
// 땅 위 단계(stage "sky")에서 부른다: o.surfRow = 칸 x → 지표 줄
export const GSKY = Object.fromEntries(Object.entries(MK).map(([id, f]) => [id, (K, o) => skyisles(K, f(o.surfRow))]));
