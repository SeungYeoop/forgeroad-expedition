// 노랑 하늘 구역 7곳 — skyisles 생성기 + 맵마다 지구(색·재료·방 짜임·소품) · 섬 모양 · 상징 구조물
import { skyisles } from "./skyisles.js";
import { nat, PL, jag, mark, fbm } from "./archi_sky.js";
import { room, TN } from "./angular.js";

const d = (n, m, t, props, top) => ({ n, m, t: t.split(" "), props, top: top.split(" ") });
// 지구 고르기: 높이 띠 셋(아래·가운데·위) × 서·동
const band = (L) => (x, f) => L[(f > 760 ? 0 : f > 430 ? 1 : 2) * 2 + (x < 512 ? 0 : 1)];

// 여러 층을 차지하는 큰 구조물 자리: k0층엔 진짜 섬(밑 몸통), k0+1 ~ k1층엔 섬 대신 구조물 층 (옆 섬과 다리로 이어진다)
export function hold(tiers, T, k0, k1, x0, x1, D, bx0 = x0, bx1 = x1, solid = 0) {
  for (let k = k0; k <= k1 && k < tiers.length; k++) {
    const a = k === k0 ? bx0 : x0, b = k === k0 ? bx1 : x1;
    tiers[k] = tiers[k].filter((s) => s.x1 < a - 24 || s.x0 > b + 24);
    tiers[k].push(k === k0 ? { x0: a, x1: b, f: T[k], D, tier: k, solid, id: `h${k}` } : { x0: a, x1: b, f: T[k], D: 0, tier: k, pseudo: 1, id: `h${k}` });
    tiers[k].sort((p, q) => p.x0 - q.x0);
  }
}
// 구조물 속 층 (뒷벽 + 층마다 판 + 엇갈린 사다리): 바닥 yb ~ 지붕 yt, must = 반드시 판이 있어야 하는 줄(옆 섬 다리 높이)
export function build(K, x0, x1, yb, yt, m, must, props, name, ri) {
  K.air(x0, yt, x1, yb), K.wall(x0, yt, x1, yb, m), K.mat(x0 - 2, yt - 2, x1 + 2, yb, m);
  const fl = [...new Set([...must.filter((y) => y < yb - 6 && y > yt + 4), yt])].sort((a, b) => b - a), ys = [];
  let p = yb;
  for (const y of fl) {
    const n = Math.max(1, Math.ceil((p - y) / 22));
    for (let k = 1; k <= n; k++) ys.push([Math.round(p - ((p - y) * k) / n), k === n]);
    p = y;
  }
  // 반드시 판(옆 섬 다리 높이 · 지붕)은 끝까지, 사이 층은 한쪽으로 치우친 짧은 판 + 방 칸막이
  let lo = yb, side = 0;
  const w = x1 - x0;
  for (const [y, full] of ys) {
    const a = full ? x0 - (y === yt ? 3 : 0) : side ? x0 : x0 + Math.round(w * 0.35), b = full ? x1 + (y === yt ? 3 : 0) : side ? x1 - Math.round(w * 0.35) : x1;
    K.plank(a, b, y);
    const lx = side ? Math.max(a, x0) + 3 : Math.min(b, x1) - 4;
    K.ladder(lx, y, lo), (side ^= 1);
    if (!full && lo - y >= 18) K.wall(side ? a + 2 : b - 3, y, side ? a + 3 : b - 2, y + 8, "stem");
    K.prop(ri(Math.max(a, x0) + 6, Math.min(b, x1) - 6), y, props[ri(0, props.length - 1)]);
    ri(0, 1) && K.prop(ri(x0 + 6, x1 - 6), lo, props[ri(0, props.length - 1)]);
    K.tag(Math.max(a, x0) + 2, y - 10, Math.min(b, x1) - 2, y, y === yt ? "treasure" : ri(0, 2) ? "arena" : "treasure");
    lo = y;
  }
  K.struct(name, "탑", x0, yt, x1, yb);
}
// 바위 기둥: 층마다 굵기가 다른 울퉁불퉁한 바위 마디를 쌓고, 속에 세로 갱 + 층마다 가로 굴 + 마디 가운데 방
export function pillar(K, x0, x1, ytop, ybot, floors, m, name, ri, dd) {
  const stops = [...new Set([...floors.filter((f) => f < ybot - 20 && f > ytop + 20), ybot])].sort((a, b) => a - b);
  // 마디: 가운데가 불룩하고 이음매가 잘록, 가장자리는 잡음으로 들쭉날쭉
  let prev = ytop;
  mark(true);
  for (const f of stops) {
    const e = dd?.bulge ? ri(dd.bulge[0], dd.bulge[1]) : ri(6, 18), sd = (f * 13 + x0) % 997, H = f + 3 - prev;
    for (let y = prev; y < f + 3; y++) {
      const t = (y - prev) / H, bulge = Math.sin(Math.PI * Math.min(1, t * 1.1)) * e;
      const l = Math.round(x0 - bulge - (fbm(y / 7, 1.3, sd) - 0.5) * 9), r = Math.round(x1 + bulge + (fbm(y / 7, 4.1, sd + 3) - 0.5) * 9);
      K.rock(l, y, r, y + 1);
    }
    prev = f;
  }
  mark(false);
  dd?.skin && K.mat(x0 - 22, ytop, x1 + 22, ybot + 3, dd.skin);
  const sx = (x0 + x1) >> 1;
  K.air(sx - 1, ytop, sx + 2, ybot), K.wall(sx - 1, ytop, sx + 2, ybot, m), K.plank(sx - 1, sx + 2, ytop), K.ladder(sx, ytop, ybot);
  let up = ytop, n = 0;
  const TT = ["vault", "shrine", "library", "cage", "workshop", "pillars", "ore"];
  for (const f of stops) {
    {
      K.air(x0 - 18, f - 11, x1 + 18, f), K.wall(x0 - 18, f - 11, x1 + 18, f, m), K.mat(x0, f - 13, x1, f + 2, m);
      K.tag(x0 + 2, f - 10, x1 - 2, f, "arena");
    }
    // 마디 속 방: 갱 양옆 (한 마디에 한두 층)
    for (let mf = f - ri(22, 32); mf - 14 > up + 6; mf -= ri(24, 38)) {
      const lay = ri(0, 4), sides = lay === 0 ? [[x0 - 4, x1 + 4]] : lay === 1 ? [[x0 + 2, sx - 1]] : lay === 2 ? [[sx + 2, x1 - 2]] : lay === 3 ? [[x0 - 2, sx - 1], [sx + 2, x1 - 8]] : [[x0 + 6, sx - 1], [sx + 2, x1 + 2]];
      for (const [a, b] of sides) {
        if (b - a < 14) continue;
        const t = TT[(n++ * 3 + ri(0, 2)) % TT.length];
        room(K, a, b, mf, ri(10, 17), dd, t, ri, null);
        K.tag(a + 1, mf - 10, b - 1, mf, t === "vault" || t === "library" || t === "ore" ? "treasure" : t === "shrine" ? "rest" : "arena");
        K.struct(`${name} ${TN[t]} ${n}`, "방", a, mf - 12, b, mf);
      }
    }
    up = f;
  }
  // 방 짜임(가운데 바위 기둥·단·칸막이)이 세로 갱을 막지 않게 갱을 다시 뚫는다
  K.air(sx - 1, ytop, sx + 2, ybot), K.wall(sx - 1, ytop, sx + 2, ybot, m), K.plank(sx - 1, sx + 2, ytop), K.ladder(sx, ytop, ybot);
  K.struct(name, "탑", x0, ytop, x1, ybot);
}
const rows = (T, a, b) => T.slice(a, b + 1);

// ═══ 글래스블룸 (g0_m2) 「수정 온실 군도」 — 하얀 수정 · 꽃 정원 · 유리 온실 ═══
const g0_m2 = {
  seed: 0x6a11, peak: 530, gap: [88, 108], iw: [46, 140], gx: [18, 44], dep: [26, 60], jit: 28,
  link: { bridge: 3, cloud: 4, crumble: 1, ferry: 1 }, vert: ["ladder", "vine", "rope"],
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0, c = x0 + w * (0.35 + R() * 0.3); return [[x0, f + 3], [x0 + w * 0.2, f + D * 0.45], [c, f + D], [x1 - w * 0.2, f + D * 0.4], [x1, f + 3]]; },
  pick: band([
    d("정원사 마을", "wood", "bunks workshop shrine library cistern", ["p_flowers", "p_crates", "p_hive", "p_fern"], "hut pool plain hut"),
    d("수정 화단", "rock", "ore vault pillars steps collapse", ["p_crystal", "p_flowers", "p_urn", "p_bush"], "steps plain pool"),
    d("빛 온실", "brick", "library shrine split balcony vault", ["p_crystal", "p_lamp", "p_shelf", "p_candles"], "hut plain tower plain"),
    d("프리즘 바위", "rock", "ore pillars pit ell tower", ["p_crystal", "p_crystal", "p_urn", "p_statue"], "steps ruin plain"),
    d("태양 정원", "brick", "shrine vault tower library", ["p_brazier", "p_candles", "p_crystal", "p_flowers"], "steps hut plain tower"),
    d("구름 꽃밭", "rock", "steps cistern pillars balcony", ["p_flowers", "p_nest", "p_crystal", "p_font"], "pool plain steps"),
  ]),
  place: (K, { tiers, T }) => hold(tiers, T, 3, 4, 390, 630, 56, 360, 660),
  sig: (K, { T, ri }) => build(K, 400, 620, T[3], T[4] - 16, "brick", rows(T, 4, 4), ["p_crystal", "p_flowers", "p_fern", "p_font"], "유리 대온실", ri),
};

// ═══ 애쉬펠 (g1_m2) 「사슬에 묶인 잿빛 폐허」 — 잿빛 돌 · 불탄 사원 · 가운데 닻바위 ═══
const g1_m2 = {
  seed: 0x4af2, peak: 300, gap: [80, 100], iw: [34, 110], gx: [16, 40], dep: [22, 54], jit: 32, rough: 3.4, fing: 26,
  link: { bridge: 2, crumble: 4, cloud: 1, ferry: 1 }, vert: ["rope", "rope", "ladder"],
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 4], [x0 + w * 0.1, f + D * 0.7], [x0 + w * (0.3 + R() * 0.1), f + D * 0.55], [x0 + w * 0.55, f + D], [x1 - w * 0.15, f + D * 0.6], [x1, f + 5]]; },
  pick: band([
    d("잿더미 마을", "wood", "collapse bunks cage workshop", ["p_rubble", "p_dead", "p_brazier", "p_chain"], "ruin plain hut"),
    d("무너진 회랑", "brick", "split pillars collapse vault", ["p_brokencol", "p_rubble", "p_chain", "p_urn"], "ruin steps plain"),
    d("불탄 사원", "brick", "shrine library vault balcony", ["p_candles", "p_altar", "p_brazier", "p_bell"], "ruin tower plain"),
    d("사슬 감옥", "rock", "cage pit vault collapse", ["p_chain", "p_cage", "p_skulls", "p_rack"], "ruin plain steps"),
    d("잿빛 종루", "brick", "tower shrine library ell", ["p_bell", "p_candles", "p_statue", "p_brazier"], "steps plain tower"),
    d("재 둥지", "rock", "pillars ore steps pit", ["p_nest", "p_dead", "p_rubble", "p_bones"], "plain ruin"),
  ]),
  place: (K, { tiers, T }) => hold(tiers, T, 1, T.length - 1, 474, 550, 46, 420, 604),
  sig: (K, { T, tiers, ri }) => {
    const top = T[T.length - 1];
    pillar(K, 474, 550, top - 18, T[1], rows(T, 2, T.length - 1), "brick", "잿빛 닻바위", ri, { n: "닻바위", m: "brick", props: ["p_chain", "p_brazier", "p_rubble"] });
    K.prop(512, top - 18, "p_brazier"), K.tag(480, top - 30, 544, top - 18, "treasure");
    // 닻바위에서 섬들로 늘어진 사슬
    for (const row of tiers) for (const s of row) if (!s.pseudo && s.tier > 1 && ri(0, 2) === 0) K.prop(s.x0 < 512 ? s.x1 - 4 : s.x0 + 4, s.f, "p_chain");
  },
};

// ═══ 모스스파이어 (gm1_m2) 「하늘 수도원」 — 초록 이끼 · 수도원 · 세 층 종탑 ═══
const gm1_m2 = {
  seed: 0x2d57, peak: 520, gap: [92, 116], iw: [60, 160], gx: [20, 50], dep: [36, 70], jit: 22, fing: 30,
  link: { bridge: 5, crumble: 1, cloud: 1, ferry: 1 }, vert: ["vine", "vine", "ladder"],
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 6], [x0 + w * 0.08, f + D * 0.75], [x0 + w * 0.5, f + D * (0.85 + R() * 0.15)], [x1 - w * 0.08, f + D * 0.8], [x1, f + 6]]; },
  inner: 0.62,
  pick: band([
    d("이끼 농원", "wood", "workshop bunks cistern steps", ["p_fern", "p_moss", "p_hay", "p_crates"], "hut pool plain"),
    d("순례자 숙소", "wood", "bunks shrine library split", ["p_candles", "p_shelf", "p_lectern", "p_fern"], "hut steps"),
    d("수도원 회랑", "brick", "library shrine pillars balcony", ["p_lectern", "p_candles", "p_shelf", "p_bell"], "hut plain tower plain"),
    d("명상 정원", "rock", "shrine steps cistern ell", ["p_cairn", "p_menhir", "p_fern", "p_flowers"], "steps pool"),
    d("필사실", "brick", "library vault tower shrine", ["p_shelf", "p_lectern", "p_candles", "p_flags"], "hut plain tower"),
    d("돌탑 언덕", "rock", "pillars ore steps vault", ["p_cairn", "p_menhir", "p_moss", "p_flags"], "steps ruin"),
  ]),
  place: (K, { tiers, T }) => hold(tiers, T, 2, 4, 440, 600, 60, 400, 640),
  sig: (K, { T, ri }) => {
    build(K, 446, 594, T[2], T[4] - 18, "brick", rows(T, 3, 4), ["p_bell", "p_candles", "p_lectern", "p_shelf"], "모스스파이어 종탑", ri);
    K.prop(520, T[4] - 18, "p_bell");
  },
};

// ═══ 스포어캡 (gm2_m2) 「떠오른 버섯 갓」 — 자줏빛 포자 · 섬마다 버섯 갓 · 거대 버섯 ═══
const gm2_m2 = {
  seed: 0x5c0f, peak: 500, gap: [84, 104], iw: [50, 130], gx: [22, 52], dep: [40, 66], jit: 34, fing: 60, inner: 0.34,
  link: { cloud: 3, bridge: 3, crumble: 1, ferry: 1 }, vert: ["vine", "rope"],
  // 버섯 갓: 얇은 갓 + 가운데로 늘어진 대
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0, c = x0 + w * (0.4 + R() * 0.2), sw = Math.max(6, w * 0.12); return [[x0, f + 3], [x0 + w * 0.25, f + D * 0.3], [c - sw, f + D * 0.38], [c - sw * 0.7, f + D], [c + sw * 0.7, f + D], [c + sw, f + D * 0.38], [x1 - w * 0.25, f + D * 0.3], [x1, f + 3]]; },
  pick: band([
    d("포자 늪가", "wood", "cistern bunks workshop pit", ["p_shroom", "p_moss", "p_roots", "p_log"], "pool plain hut"),
    d("갓 밑 마을", "wood", "bunks workshop library shrine", ["p_shroom", "p_lamp", "p_crates", "p_urn"], "hut plain"),
    d("포자 둥지", "rock", "cage pit pillars collapse", ["p_nest", "p_shroom", "p_bones", "p_web"], "plain ruin"),
    d("발광 갓", "rock", "ore vault steps ell", ["p_shroom", "p_crystal", "p_lamp", "p_font"], "steps pool"),
    d("포자 제단", "brick", "shrine vault tower library", ["p_altar", "p_shroom", "p_candles", "p_urn"], "steps plain tower"),
    d("우산 숲", "rock", "pillars steps balcony split", ["p_shroom", "p_shroom", "p_fern", "p_nest"], "plain hut"),
  ]),
  place: (K, { tiers, T }) => (hold(tiers, T, 1, 3, 486, 538, 0), (tiers[1] = tiers[1].filter((s) => s.id !== "h1")), tiers[1].push({ x0: 486, x1: 538, f: T[1], D: 0, tier: 1, pseudo: 1 }), tiers[1].sort((p, q) => p.x0 - q.x0), hold(tiers, T, 4, 4, 380, 650, 50)),
  sig: (K, { T, ri }) => {
    pillar(K, 486, 538, T[3] - 14, 1000, rows(T, 1, 3), "wood", "거대 버섯 대", ri, { n: "버섯 대", m: "wood", props: ["p_shroom", "p_lamp", "p_urn"] });
    for (let y = T[3] - 14; y < 990; y += 40) K.prop(492, y + 20, "p_shroom", { s: 1 });
  },
};

// ═══ 앰버홀드 (g2_m2, 보스) 「호박빛 기사 성채」 — 호박색 사암 · 성채 · 동쪽 결투장 ═══
const g2_m2 = {
  seed: 0x7e21, peak: 470, boss: 896, gap: [86, 104], iw: [56, 150], gx: [16, 40], dep: [30, 64], jit: 28, rough: 1.4,
  link: { bridge: 4, crumble: 1, cloud: 1, ferry: 1 }, vert: ["ladder", "ladder", "rope"],
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 8], [x0 + w * 0.1, f + D * 0.8], [x0 + w * 0.5, f + D * (0.9 + R() * 0.1)], [x1 - w * 0.1, f + D * 0.8], [x1, f + 8]]; },
  inner: 0.66,
  pick: band([
    d("마구간 섬", "wood", "bunks workshop cistern split", ["p_hay", "p_crates", "p_wheel", "p_rack"], "hut plain"),
    d("훈련장", "wood", "pillars workshop steps cage", ["p_rack", "p_banner", "p_crates", "p_flags"], "plain hut ruin"),
    d("기사단 숙소", "brick", "bunks library shrine balcony", ["p_banner", "p_candles", "p_shelf", "p_rack"], "hut plain tower"),
    d("무기고", "brick", "vault split tower ell", ["p_rack", "p_crates", "p_anvil", "p_banner"], "plain steps tower"),
    d("성채 예배당", "brick", "shrine library vault balcony", ["p_altar", "p_candles", "p_statue", "p_bell"], "steps plain tower"),
    d("망루 외곽", "rock", "pillars ore steps pit", ["p_flags", "p_brazier", "p_statue", "p_nest"], "ruin tower plain"),
  ]),
  place: (K, { tiers, T }) => hold(tiers, T, 1, 3, 380, 580, 60, 340, 620),
  sig: (K, { T, ri }) => {
    build(K, 386, 574, T[1], T[3] - 18, "brick", rows(T, 2, 3), ["p_banner", "p_rack", "p_statue", "p_candles"], "앰버홀드 본성", ri);
    K.prop(480, T[3] - 18, "p_flags");
    K.wall(900, 956, 1024, 1000, "brick"), K.prop(920, 1000, "p_banner"), K.prop(1004, 1000, "p_banner"), K.prop(962, 1000, "p_brazier");
    K.struct("맹세의 결투장", "보스", 900, 956, 1024, 1000);
  },
};

// ═══ 듄미스트 (g2_m1) 「신기루 모래섬」 — 금빛 모래 · 오아시스 · 해시계 기둥 ═══
const g2_m1 = {
  seed: 0x3b9d, peak: 520, gap: [78, 96], iw: [70, 190], gx: [24, 60], dep: [20, 44], jit: 30, fing: 70, inner: 0.7,
  link: { cloud: 5, bridge: 2, ferry: 2, crumble: 1 }, vert: ["rope", "ladder"],
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 2], [x0 + w * 0.15, f + D * 0.6], [x0 + w * (0.3 + R() * 0.4), f + D], [x1 - w * 0.15, f + D * 0.55], [x1, f + 2]]; },
  pick: band([
    d("대상 야영지", "wood", "bunks workshop cistern split", ["p_yurt", "p_crates", "p_urn", "p_cart"], "pool hut plain"),
    d("오아시스", "rock", "cistern shrine steps pillars", ["p_fern", "p_bush", "p_font", "p_flowers"], "pool pool plain"),
    d("모래 사원", "brick", "shrine vault library tower", ["p_statue", "p_urn", "p_candles", "p_menhir"], "steps tower"),
    d("유리 모래톱", "rock", "ore pit collapse ell", ["p_crystal", "p_bones", "p_cairn", "p_urn"], "plain ruin steps"),
    d("별 관측소", "brick", "library tower vault balcony", ["p_shelf", "p_crystal", "p_lamp", "p_flags"], "hut plain tower"),
    d("신기루 정원", "rock", "pillars steps cistern shrine", ["p_flowers", "p_crystal", "p_font", "p_bush"], "pool steps"),
  ]),
  place: (K, { tiers, T }) => hold(tiers, T, 1, 4, 498, 550, 40, 456, 594),
  sig: (K, { T, ri }) => {
    pillar(K, 498, 550, T[4] - 22, T[1], rows(T, 2, 4), "brick", "해시계 기둥", ri, { n: "해시계", m: "brick", props: ["p_urn", "p_statue", "p_crystal"] });
    K.prop(524, T[4] - 22, "p_menhir"), K.tag(506, T[4] - 34, 542, T[4] - 22, "treasure");
  },
};

// ═══ 보그플로트 (gm2_m1) 「떠오른 늪 덩어리」 — 검푸른 진흙 · 늘어진 뿌리 · 가운데 뿌리 덩이 ═══
const gm2_m1 = {
  seed: 0x1f4e, peak: 540, gap: [86, 108], iw: [50, 150], gx: [18, 46], dep: [34, 68], jit: 28, fing: 18, rough: 3,
  link: { crumble: 3, bridge: 3, cloud: 1, ferry: 1 }, vert: ["vine", "vine", "rope"],
  belly: (s, R) => { const { x0, x1, f, D } = s, w = x1 - x0; return [[x0, f + 5], [x0 + w * 0.2, f + D * (0.6 + R() * 0.3)], [x0 + w * 0.45, f + D * 0.7], [x0 + w * 0.6, f + D], [x1 - w * 0.2, f + D * 0.65], [x1, f + 5]]; },
  pick: band([
    d("말뚝 마을", "wood", "bunks workshop cistern cage", ["p_log", "p_lamp", "p_crates", "p_roots"], "pool hut"),
    d("썩은 늪가", "rock", "cistern pit collapse pillars", ["p_shroom", "p_roots", "p_moss", "p_bones"], "pool plain"),
    d("뿌리 굴", "wood", "split ell vault library", ["p_roots", "p_shelf", "p_lamp", "p_urn"], "hut ruin"),
    d("늪 무당 집", "wood", "shrine cage library vault", ["p_skulls", "p_candles", "p_bones", "p_dead"], "hut tower"),
    d("가스 둥지", "rock", "pit pillars ore steps", ["p_nest", "p_shroom", "p_dead", "p_moss"], "plain pool"),
    d("고목 섬", "rock", "steps shrine pillars ell", ["p_dead", "p_fern", "p_roots", "p_log"], "ruin pool"),
  ]),
  place: (K, { tiers, T }) => hold(tiers, T, 2, 2, 300, 720, 72),
  sig: (K, { T, real, ri }) => {
    // 섬 배에서 늘어진 뿌리 덩굴 (아래 섬까지 닿지 않는 것도 있다)
    //   섬 속에 방이 있으므로 섬 맨 아래(배 끝)부터 위로 올라가 진짜 밑면을 찾는다 — 방·바닥을 뚫고 지나던 덩굴 (2026-11-28)
    for (const s of real) if (s.tier > 0) for (let x = s.x0 + 10; x < s.x1 - 10; x += ri(24, 44)) {
      let y = Math.min(1048, s.f + (s.D ?? 40) + 16);
      while (y > s.f && K.get(x, y) !== 1) y--;
      if (y <= s.f) continue;
      y++;
      let e = Math.min(1048, y + ri(12, 36));
      for (let q = y; q < e; q++) if (K.get(x, q) === 1) { e = q - 1; break; }
      e - y >= 6 && K.vine(x - 1, x + 1, y - 2, e);
    }
    K.struct("늪 뿌리 덩이", "섬", 300, T[2] - 14, 720, T[2] + 72);
  },
};

const mk = (Z) => { const f = (K) => skyisles(K, Z); f.own = 1; return f; };
export const SKY_MAPS = { g0_m2: mk(g0_m2), g1_m2: mk(g1_m2), gm1_m2: mk(gm1_m2), gm2_m2: mk(gm2_m2), g2_m2: mk(g2_m2), g2_m1: mk(g2_m1), gm2_m1: mk(gm2_m1) };
