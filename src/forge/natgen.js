// 자연 지형 생성기 — 구역 하나를 "밀도장"(4px 격자의 연속 값, 양수 = 바위)으로 만든다.
//
// 예전 방식(16px 칸 + 45° 경사 칸)으로는 사각형·삼각형·계단 모양을 벗어날 수 없어서, 지형 자체를
// 칸보다 촘촘한 연속 값으로 바꾸었다. 충돌·그림 모두 같은 장을 픽셀마다 쌍선형 보간해 쓰므로
// 보이는 윤곽과 밟는 윤곽이 1px까지 같다.
//
// 만드는 순서 (자연에서 지형이 생기는 과정을 흉내 낸다)
//  지상: 큰·중간·작은 잡음 겹침 → 단층(솟음·꺼짐) → 협곡 → 지층 경도에 따른 풍화(열 침식)
//        → 물길 침식(오목한 비탈) → 잔물결 → 가파른 면만 2D로 비틀어 돌출·오목·처마 → 굴러온 바위
//  땅속: 치즈(큰 공동)·스파게티(구불 통로)·수직 틈 잡음 → 뼈대 굴(입구·출구를 잇는 구불길) → 셀룰러 오토마타
//  하늘: 윗면은 평평하고 아래로 좁아지는 바위섬, 지역마다 모양 규칙이 다르다
//  끝으로 길찾기 검사: 입구에서 모든 출구에 닿고, 빠져나올 수 없는 구덩이가 없을 때까지
//        자연스러운 바위 턱·굴을 덧붙여 고친다 (사각형·45° 경사로 단순화하지 않는다)
import { ARCHI, kit } from "./archi.js";
import { decoKinds, decoKey, decoHeight, decoWidth } from "./natdeco.js";
import { makeNoise, rng, strHash, clamp, lerp, smooth } from "./noise.js";
import { propSize, propHangs } from "./natprops.js";
import { profileOf, profileKey } from "./terrprof.js";
import { BLUEPRINTS } from "./natbp.js";

export const Q = 4; // 격자 간격 (px)
const TS = 16;
// 조각 높이(칸): 위 하늘 250줄 + 지상 56줄 + 땅속 222줄 (main.js의 TOPR·UGR과 같아야 한다)
export const FT = 528;
export const FLOOR = 300, UG_TOP = 306;
// 픽셀 블록 크기: 지형은 8px 네모 블록으로 맞춰진다 (몸 22px ≈ 3블록, 1블록 턱은 걸어서 오른다)
export const BLK = 8;
export const HEAD = 28; // 지나갈 수 있는 최소 높이 (몸 22px + 여유)
const BODY = 22;

// ── 밀도장 ───────────────────────────────────────────
export class ZField {
  constructor(LW, LH) {
    this.LW = LW;
    this.LH = LH;
    this.d = new Float32Array(LW * LH);
    this.WP = (LW - 1) * Q;
    this.HP = (LH - 1) * Q;
  }
  // 구역 안 연속 좌표(px)의 값
  v(x, y) {
    const LW = this.LW;
    let u = x / Q, w = y / Q;
    if (u < 0) u = 0;
    else if (u > LW - 1.000001) u = LW - 1.000001;
    if (w < 0) w = 0;
    else if (w > this.LH - 1.000001) w = this.LH - 1.000001;
    const i = u | 0, j = w | 0, fu = u - i, fv = w - j, k = j * LW + i, d = this.d;
    const a = d[k] + (d[k + 1] - d[k]) * fu, b = d[k + LW] + (d[k + LW + 1] - d[k + LW]) * fu;
    return a + (b - a) * fv;
  }
  // 픽셀 (px, py)가 바위인가 (픽셀 가운데에서 잰다)
  solid(px, py) {
    return this.v(px + 0.5, py + 0.5) > 0;
  }
}

// ── 구역 설계 (캐시) ─────────────────────────────────
const PLANS = new Map();
export const planCache = PLANS;
export function planOf(z, o) {
  const key = `${z.id}:${o.seed}`;
  let P = PLANS.get(key);
  if (P) {
    PLANS.delete(key);
    PLANS.set(key, P);
    return P;
  }
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  let best = null;
  const tries = [];
  for (let a = 0; a < 3; a++) {
    const Q2 = makePlan(z, o, a);
    tries.push(Q2.check);
    if (!best || Q2.check.score > best.check.score) best = Q2;
    // 길(출구·문)이 다 이어지고 갇힘이 작으면 다시 만들지 않는다 (큰 갇힘 = 빠지면 못 나오는 굴은 다른 시도로)
    if (Q2.check.ok || (Q2.check.miss.length === 0 && (Q2.check.traps ?? 0) <= 12)) break;
  }
  best.tries = tries;
  best.seedIn = o.seed;
  best.ms = Math.round(((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0) * 10) / 10;
  while (PLANS.size >= 7) PLANS.delete(PLANS.keys().next().value);
  PLANS.set(key, best);
  noteExits(key, best);
  return best;
}
// ▲▼ 문 자리는 설계 캐시(7개)에서 밀려나도 남겨 둔다 — 문 물체·도착 자리를 찾을 때 쓴다 (2026-11-28)
const EXITS = new Map();
const noteExits = (key, P) => EXITS.set(key, { peak: P.peak ? { x: P.peak.x, y: P.peak.y } : null, deep: P.deep ? { x: P.deep.x, y: P.deep.y } : null });
export const exitsOf = (z, seed) => EXITS.get(`${z.id}:${seed}`) ?? null;

// ── 다른 스레드(natworker)에서 만든 설계를 주고받기 ──
export const planKey = (z, seed) => `${z.id}:${seed}`;
export const hasPlan = (z, seed) => PLANS.has(planKey(z, seed));
const KEEP = ["base", "props", "kind", "pkey", "seed", "attempt", "W", "WP", "HP", "Ft", "LW", "LH", "isZone", "arenaFrom", "upX", "downX", "gy", "h", "spots", "hzSpots", "pads", "peak", "chest", "deep", "ugTop", "islands", "check", "tries", "ms", "repairs", "trees", "mats", "walls", "feats", "spec", "roomTags", "structs"];
export function packPlan(P) {
  const data = { d: P.F.d };
  for (const k of KEEP) data[k] = P[k];
  const transfer = [P.F.d.buffer];
  P.gy && transfer.push(P.gy.buffer);
  P.h && transfer.push(P.h.buffer);
  // 보낸 배열은 이 스레드에서 쓸 수 없게 되므로 캐시에서 뺀다
  PLANS.delete(planKey(P.z, P.seedIn));
  return { data, transfer };
}
export function adoptPlan(z, seed, data) {
  const F = Object.create(ZField.prototype);
  Object.assign(F, { LW: data.LW, LH: data.LH, d: data.d, WP: (data.LW - 1) * Q, HP: (data.LH - 1) * Q });
  const P = { ...data, z, prof: profileOf(z), F };
  delete P.d;
  const key = planKey(z, seed);
  PLANS.delete(key);
  while (PLANS.size >= 7) PLANS.delete(PLANS.keys().next().value);
  PLANS.set(key, P);
  noteExits(key, P);
  return P;
}
export function makePlan(z, o, attempt) {
  const prof = profileOf(z);
  const kind = prof.kind;
  const Ft = o.Ft ?? FT;
  const W = (z.c1 - z.c0) * 32, WP = W * TS, HP = Ft * TS;
  const LW = WP / Q + 1, LH = HP / Q + 1;
  const seed = (Math.imul((o.seed >>> 0) ^ 0x2545f491, 2654435761) ^ strHash(z.id) ^ Math.imul(attempt + 1, 0x9e3779b9)) >>> 0;
  const N = makeNoise(seed), R = rng(seed ^ 0xa511e9b3);
  const isZone = z.kind === "zone";
  const arenaFrom = isZone && z.boss ? WP - 64 * TS : WP;
  const P = {
    z, kind, prof, pkey: profileKey(z), attempt, seed, W, WP, HP, Ft, LW, LH, isZone, arenaFrom,
    F: new ZField(LW, LH), N, R,
    h: null, islands: [], pads: [], peak: null, deep: null, mouths: [], rooms: [], repairs: 0, mats: [], walls: [], feats: [], spec: [], specReq: [],
    upX: isZone && o.up >= 0 ? (o.up - z.c0) * 512 + 256 : -1,
    downX: isZone && o.down >= 0 ? (o.down - z.c0) * 512 + 256 : -1,
  };
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  let t0 = now();
  P.bp = BLUEPRINTS[z.id] ?? null;
  if (kind === "ground") buildGround(P);
  else if (kind === "cave") buildCave(P);
  else buildSky(P);
  P.tm = { build: now() - t0, an: 0, rep: 0 };
  specks(P);
  blockSnap(P);
  // 고치기: 길이 이어질 때까지 자연스러운 턱·굴을 덧붙인다
  t0 = now();
  let A = analyze(P);
  P.tm.an += now() - t0;
  let trapIt = 0;
  for (let it = 0; it < (o.noRepair ? 0 : o.maxRep ?? 14) && !A.ok; it++) {
    // 길이 다 이어진 뒤 갇힘 고치기는 몇 번만 (검사 한 번이 비싸다)
    if (A.miss.length === 0 && ++trapIt > 5) break;
    t0 = now();
    // 고치기 전 상태 (고친 뒤 이어졌던 목표가 끊기면 되돌린다)
    const snap = P.F.d.slice();
    const fixed = repair(P, A);
    const t1 = now();
    fixed && (specks(P), blockSnap(P));
    P.tm.rep += now() - t0;
    if (!fixed) break;
    P.repairs++;
    const t2 = now();
    const A0 = A;
    A = analyze(P);
    P.tm.an += now() - t2;
    if (A.miss.some((g) => !A0.miss.includes(g))) {
      // 고치다가 이어져 있던 길을 끊었다: 되돌린다 (같은 짝은 다시 고르지 않는다)
      P.F.d.set(snap);
      A = A0;
      if (A0.miss.length === 0) break;
    }
  }
  P.check = { ok: A.ok, score: A.score, miss: A.miss, traps: A.trapCount, repairs: P.repairs };
  P.A = A;
  finishMeta(P, A);
  // 다듬기 (2026-11-28): 물·사다리를 바로잡고, 길이 끊기거나 갇히는 곳이 생기면 되돌린다
  //   물과 사다리를 따로 검사해서 나빠진 쪽만 되돌린다
  for (const [fix, bit] of [[settleWater, 1], [fixClimbs, 2], [linkUnreached, 4]]) {
    const spec0 = P.spec.slice(), fd0 = bit === 2 ? P.F.d.slice() : null;
    const carved = fix(P, A);
    bit === 4 && (P.linkAdd = carved);
    if (!carved && P.spec.length === spec0.length && P.spec.every((r, i) => r === spec0[i])) continue;
    const t2 = now(), A2 = analyze(P);
    P.tm.an += now() - t2;
    if (A2.miss.length > A.miss.length || A2.trapCount > A.trapCount) {
      // 디버그(globalThis.__polishDbg): 되돌리기 전 상태를 남긴다 (tools/_climbdbg.mjs)
      globalThis.__polishDbg && (P._dbg = { bit, spec0, spec1: P.spec, Fd: P.F.d.slice(), A, A2 });
      ((P.spec = spec0), (P.polishReverted = (P.polishReverted ?? 0) | bit));
      fd0 && P.F.d.set(fd0);
    }
    else ((A = A2), (P.A = A2), (P.check = { ...P.check, ok: A2.ok, score: A2.score, miss: A2.miss, traps: A2.trapCount }));
  }
  P.polishReverted !== 3 && finishMeta(P, A);
  relocateExits(P);
  P.kind === "ground" && P.h && clipWalls(P);
  patchWalls(P);
  placeDeco(P);
  P.bp && placeProps(P);
  propSupport(P);
  // 무너지는 판·도개교 위 소품은 판이 움직이면 허공에 남는다 → 놓지 않는다 (2026-11-28)
  P.props &&= P.props.filter((p) => p.bg || p.hang || !P.spec.some((r) => (r.t === 13 || r.t === 21) && p.x >= r.x0 - 2 && p.x < r.x1 + 2 && p.y + 1 >= r.y0 - 4 && p.y + 1 < r.y1 + 4));
  for (const r of P.spec) if (DYN_SPEC.has(r.t)) cutShape(P, r.x0 - 4, r.y0 - 4, r.x1 + 4, r.y1 + 4, (px, py) => Math.min(px - r.x0, r.x1 - px, py - r.y0, r.y1 - py) + 0.5);
  P.spec.some((r) => DYN_SPEC.has(r.t)) && blockSnap(P);
  return P;
}
// 고인 물 바로잡기 (2026-11-28): 고인 물은 아래와 양옆이 막힌 곳에만 있어야 한다
//   8px 기둥마다 밑이 바위(또는 다른 물)인지 보고, 밑이 막힌 기둥끼리 묶는다.
//   묶음 양옆 벽 높이 중 낮은 쪽까지만 물을 채운다 (벽보다 높이 솟은 물을 낮춘다). 옆이 트였거나 1칸도 안 남으면 지운다
function settleWater(P) {
  // 이웃 물에 기댄 조각이 있으니, 바뀌지 않을 때까지 몇 번 되풀이
  for (let it = 0; it < 4 && settleWater1(P); it++);
}
function settleWater1(P) {
  const { F, WP, HP } = P;
  const isW = (t) => t === 3 || t === 11 || t === 12;
  const water = P.spec.filter((r) => isW(r.t));
  if (!water.length) return !1;
  const sol = (x, y) => y >= HP || x < 0 || x >= WP || (y >= 0 && F.solid(x, y));
  const inOther = (r, x, y) => water.some((q) => q !== r && x >= q.x0 && x < q.x1 && y >= q.y0 && y < q.y1);
  // 기둥 x의 벽 윗면 (물 밑바닥 바로 위부터 위로 이어진 바위). 트였으면 null, 이웃 물과 이어지면 물 윗면
  const rim = (r, x) => {
    if (inOther(r, x, r.y1 - 4)) return r.y0;
    if (!sol(x, r.y1 - 4)) return null;
    let y = r.y1 - 4;
    while (y > r.y0 - 8 && sol(x, y - 4)) y -= 4;
    return y;
  };
  const out = [];
  let moved = 0;
  for (const r of water) {
    const n = Math.round((r.x1 - r.x0) / 8), ok = [];
    for (let i = 0; i < n; i++) ok.push(sol(r.x0 + i * 8 + 4, r.y1 + 3) || inOther(r, r.x0 + i * 8 + 4, r.y1 + 3));
    for (let i = 0; i < n; ) {
      if (!ok[i]) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && ok[j]) j++;
      const a = r.x0 + i * 8, b = Math.min(r.x1, r.x0 + j * 8);
      const L = rim(r, a - 3), Rr = rim(r, b + 2);
      if (L != null && Rr != null) {
        const top = Math.max(r.y0, Math.ceil(Math.max(L, Rr) / 8) * 8);
        r.y1 - top >= 8 && out.push({ ...r, x0: a, x1: b, y0: top });
      }
      i = j;
    }
    const same = out.length && out[out.length - 1].x0 === r.x0 && out[out.length - 1].x1 === r.x1 && out[out.length - 1].y0 === r.y0;
    same || moved++;
  }
  if (!moved) return !1;
  P.spec = P.spec.filter((r) => !isW(r.t)).concat(out);
  P.waterFix = (P.waterFix ?? 0) + moved;
  return !0;
}
// 오르는 장치(사다리 6·밧줄 7·덩굴 8) 바로잡기 (2026-11-28)
//   가운데 줄을 따라 공기 구간으로 나눈다 (바위 속을 지나는 부분은 뺀다. 나무판·구름·무너지는 판·도개교는 지나갈 수 있는 것으로 본다)
//   위 끝에서 설 자리가 없으면(천장에 막힌 막다른 끝) 옆으로 내려설 수 있는 가장 높은 곳까지 줄이고, 그런 곳도 없으면 뺀다
export function fixClimbs(P) {
  const { F, WP, HP } = P;
  // 지나갈 수 있는 것: 나무판·구름·무너지는 판·도개교(발판) + 금 간 벽(부수고 지나간다)
  const PLAT = P.spec.filter((r) => r.t === 1 || r.t === 2 || r.t === 13 || r.t === 21);
  const PASS = P.spec.filter((r) => r.t === 1 || r.t === 2 || r.t === 13 || r.t === 14 || r.t === 21);
  const WAT = P.spec.filter((r) => r.t === 3 || r.t === 11 || r.t === 12);
  const platAt = (x, y, m = 0) => PLAT.some((r) => x >= r.x0 - m && x < r.x1 + m && y >= r.y0 - 1 - m && y < r.y1 + m);
  const passAt = (x, y) => PASS.some((r) => x >= r.x0 - 4 && x < r.x1 + 4 && y >= r.y0 - 5 && y < r.y1 + 4);
  const rock = (x, y) => y >= HP || x < 0 || x >= WP || (y >= 0 && F.solid(x, y));
  const solid = (x, y) => rock(x, y) && !passAt(x, y);
  const foot = (x, y) => solid(x, y) || platAt(x, y);
  const stand = (x, y) => {
    if (!(foot(x, y + 1) && foot(x - 4, y + 1) && foot(x + 4, y + 1))) return !1;
    for (let yy = y - 2; yy > y - HEAD; yy -= 4) for (const dx of [-5, 0, 5]) if (solid(x + dx, yy)) return !1;
    return !0;
  };
  const clearRow = (ax, bx, y) => {
    const s = Math.sign(bx - ax) || 1;
    for (let x = ax; s > 0 ? x <= bx : x >= bx; x += s * 3) if (solid(x, y)) return !1;
    return !0;
  };
  // 두 점 사이 몸 높이 선이 트였나 (사다리에서 뛰어내리는 길)
  const clearLine = (ax, ay, bx, by) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
    for (let i = 0; i <= n; i++) if (solid(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return !1;
    return !0;
  };
  // 높이 [lo, hi] 안에서 장치 옆으로 내려서거나 뛰어 닿을 자리 (옆 ±100px, 사다리에서 뛰면 ~80px까지 오른다)
  const exitIn = (r, cx, lo, hi, ref) => {
    for (let y = lo; y <= hi; y += 2)
      for (let dx = 0; dx <= 100; dx += 3)
        for (const x of dx ? [r.x0 - dx, r.x1 + dx] : [cx])
          if (stand(x, y) && (clearRow(cx, x, Math.min(y, ref) - 12) || clearLine(cx, ref - 14, x, y - 14))) return y;
    return null;
  };
  const out = [];
  let changed = 0, carved = 0;
  for (const r of P.spec) {
    if (r.t !== 6 && r.t !== 7 && r.t !== 8) {
      out.push(r);
      continue;
    }
    const cx = Math.round((r.x0 + r.x1) / 2), keep = [];
    // 얇은 바위(32px 이하)가 길을 막으면 사다리 폭만큼 구멍을 판다 (바닥 판 구멍) — 위·아래가 공기일 때만
    //   두꺼운 바위는 아래에서 잘라 낸다 (방·바닥을 뚫고 지나던 덩굴)
    for (let y = r.y0 - 4; y < r.y1; ) {
      if (!solid(cx, y + 2)) {
        y += 4;
        continue;
      }
      // 판 윗면 t ~ 밑면 e: 판 위아래가 모두 공기이고, 사다리가 판 밑으로 8px 넘게 이어질 때만 (사다리 발밑 바닥은 파지 않는다)
      let t = y, e = y;
      while (t > r.y0 - 40 && solid(cx, t - 2)) t -= 4;
      while (e < r.y1 && solid(cx, e + 2)) e += 4;
      // 사다리 꼭대기를 덮은 판은 48px까지 판다 (막다른 사다리를 위층으로 잇는다)
      const lim = r.t === 6 && t < r.y0 ? 48 : 32;
      // 판 위가 물이면 파지 않는다 (호수 바닥에 구멍 → 물이 샌다)
      const wet = WAT.some((w) => cx >= w.x0 - 4 && cx < w.x1 + 4 && t - 6 >= w.y0 - 4 && t - 6 < w.y1 + 4);
      // 물 밑 판은 파지도 자르지도 않는다 (원래대로: 자르면 호수에 갇힌다) → 아래 나누기에서 공기로 본다
      wet && e - t <= lim && keep.push([t - 2, e + 2]);
      if (!wet && e - t <= lim && !solid(cx, t - 6) && !solid(cx, e + 6) && e <= r.y1 - 8) {
        const x0 = r.x0 - 2, x1 = r.x1 + 2, y0 = t - 2, y1 = e + 2;
        cutShape(P, x0, y0, x1, y1, (px, py) => Math.min(px - x0, x1 - px, py - y0, y1 - py) + 0.5);
        carved++;
        (P.carves ??= []).push({ x: cx, y: (t + e) >> 1, h: e - t });
      }
      y = e;
    }
    const runs = [];
    let a = null;
    for (let y = r.y0; y < r.y1; y += 4) {
      const s = solid(cx, y + 2) && !keep.some(([k0, k1]) => y + 2 >= k0 && y + 2 <= k1);
      if (!s && a == null) a = y;
      if (s && a != null) (runs.push([a, y]), (a = null));
    }
    a != null && runs.push([a, r.y1]);
    const pieces = [];
    for (let [y0, y1] of runs) {
      if (y1 - y0 < 24) continue;
      // 위 끝에서 내려서거나 뛰어 닿을 곳이 없으면 막다른 끝 (천장에 막혔든, 하늘로 트였든)
      if (exitIn(r, cx, y0 - 80, y0 + 40, y0) == null) {
        // 막다른 위 끝: 아래로 내려가며 처음 옆으로 내려설 수 있는 높이를 찾는다
        //   그 위쪽은 그림으로만 남기고(nc: 탈 수 없음), 아래쪽만 탈 수 있게 한다 — 모양은 그대로, 막다른 길로 끌고 가지 않는다
        let ny = null;
        for (let y = y0 + 44; y <= y1 + 8 && ny == null; y += 8) ny = exitIn(r, cx, y - 8, y, y);
        //   사다리는 탈 수 없는 사다리가 헷갈리므로 막다른 부분을 잘라 내고, 밧줄·덩굴은 그림으로 남긴다
        const cut = ny == null ? y1 : Math.min(y1, Math.max(y0, Math.floor((ny - 24) / 8) * 8));
        cut > y0 && r.t !== 6 && pieces.push([y0, cut, 1]);
        y1 - cut >= 24 && pieces.push([cut, y1, 0]);
        continue;
      }
      pieces.push([y0, y1, 0]);
    }
    if (pieces.length === 1 && pieces[0][0] === r.y0 && pieces[0][1] === r.y1 && !pieces[0][2]) {
      out.push(r);
      continue;
    }
    changed++;
    for (const [y0, y1, nc] of pieces) out.push(nc ? { ...r, y0, y1, nc: 1 } : { ...r, y0, y1 });
  }
  // 겹친 같은 장치는 하나로 (나란히 두 개 그려져 이중 사다리로 보이던 곳) · 허공에서 끝나는 아래 끝은 바닥까지 늘린다 (640px 안)
  const CLs = out.filter((r) => (r.t === 6 || r.t === 7 || r.t === 8) && !r.nc);
  const gone = new Set();
  for (let i = 0; i < CLs.length; i++) {
    let a = CLs[i];
    if (gone.has(a)) continue;
    for (let j = i + 1; j < CLs.length; j++) {
      const b = CLs[j];
      if (gone.has(b) || b.t !== a.t || Math.abs((a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2) >= 8 || b.y0 > a.y1 + 4 || b.y1 < a.y0 - 4) continue;
      // 원래 물체는 되돌리기용으로 그대로 두고 새 물체로 바꾼다
      const na = { ...a, y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1), x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1) };
      out[out.indexOf(a)] = na;
      CLs[i] = a = na;
      gone.add(b);
      changed++;
    }
  }
  for (const r of CLs) {
    if (gone.has(r)) continue;
    const cx = Math.round((r.x0 + r.x1) / 2);
    let y = r.y1;
    while (y < HP && y < r.y1 + 660 && !foot(cx, y + 2)) y += 4;
    const fall = y - r.y1;
    if (fall > 16 && fall <= 640 && y < HP && foot(cx, y + 2)) {
      out[out.indexOf(r)] = { ...r, y1: Math.floor((y + 2) / 8) * 8 };
      changed++;
    }
  }
  const fin = gone.size ? out.filter((r) => !gone.has(r)) : out;
  carved && blockSnap(P);
  P.climbCarve = carved;
  if (changed) ((P.spec = fin), (P.climbFix = changed));
  return carved;
}
// 못 가는 발판 잇기 (2026-11-28): 길 검사에서 닿지 못한 발판 무리(마디 6개 이상)의 가장자리 바로 바깥에
//   덩굴(동굴은 사다리)을 늘어뜨려, 480px 안 아래의 닿는 바닥과 잇는다 — 오두막 발판·섬·가지 위 막힌 곳
export function linkUnreached(P, A, why = null) {
  if (!A?.reach) return 0;
  const { nC, nY, NN, reach, colN } = A;
  const { F, WP, HP } = P, NCOL = colN.length - 1;
  const rock = (x, y) => y >= HP || x < 0 || x >= WP || (y >= 0 && F.solid(x, y));
  const seen = new Uint8Array(NN), clusters = [];
  for (let n = 0; n < NN; n++) {
    if (reach[n] || seen[n]) continue;
    const st = [n], cl = [];
    seen[n] = 1;
    while (st.length) {
      const a = st.pop();
      cl.push(a);
      // 마디는 2열마다 있다
      for (const dc of [-2, -1, 0, 1, 2]) {
        const c = nC[a] + dc;
        if (c < 0 || c >= NCOL) continue;
        for (let m = colN[c]; m < colN[c + 1]; m++) if (!seen[m] && !reach[m] && Math.abs(nY[m] - nY[a]) <= 12) ((seen[m] = 1), st.push(m));
      }
    }
    cl.length >= 6 && clusters.push(cl);
  }
  why && (why.clusters = clusters.length, why.sizes = clusters.map((c) => c.length).sort((a, b) => b - a).slice(0, 12).join(","));
  const reachNear = (x, y) => {
    const c0 = Math.floor(x / 8);
    for (let c = c0 - 3; c <= c0 + 3; c++) {
      if (c < 0 || c >= NCOL) continue;
      for (let m = colN[c]; m < colN[c + 1]; m++) if (reach[m] && Math.abs(nY[m] - y) <= 12) return !0;
    }
    return !1;
  };
  const t = P.kind === "cave" ? 6 : 8, lim = Math.min(WP, P.arenaFrom) - 64;
  let added = 0;
  for (const cl of clusters) {
    let lo = cl[0], hi = cl[0];
    for (const n of cl) (nC[n] < nC[lo] && (lo = n), nC[n] > nC[hi] && (hi = n));
    let done = !1;
    for (const [n, dir] of [[lo, -1], [hi, 1]]) {
      const fy = nY[n];
      for (const off of [12, 20, 28]) {
        if (done) break;
        const x = Math.round((nC[n] * 8 + 4 + dir * off) / 8) * 8;
        const W = (k) => (why && (why[k] = (why[k] ?? 0) + 1), 0);
        if (x < 64 || x > lim || rock(x, fy - 4) || rock(x, fy - 24)) { W("edge"); continue; }
        let y = fy;
        while (y < HP && y < fy + 480 && !rock(x, y + 2)) y += 4;
        if (y >= HP || y - fy >= 480) { W("far"); continue; }
        if (y - fy < 40) { W("near"); continue; }
        if (!reachNear(x, y)) { W("landUnreach"); continue; }
        let clear = !0;
        for (let yy = fy - 20; yy < y - 4 && clear; yy += 6) clear = !rock(x - 6, yy) && !rock(x + 6, yy);
        if (!clear) { W("narrow"); continue; }
        P.spec.push({ x0: x - 8, x1: x + 8, y0: Math.floor((fy - 24) / 8) * 8, y1: Math.floor((y + 2) / 8) * 8, t, link: 1 });
        (P.links ??= []).push({ x, y: fy });
        done = !0;
        added++;
      }
      if (done) break;
    }
  }
  return added;
}
// 위아래 문 자리 (2026-11-28): ▲ 문은 맵에서 가장 높은 설 자리, ▼ 문은 가장 낮은 설 자리로 — 맵 중간에 있던 문
//   후보 = 평평하고 머리 위 48px가 빈 닿는 자리(P.spots), 맵 양 끝 8칸과 보스 결투장은 뺀다
function relocateExits(P) {
  // 함정 방·보물 방·함정 자리·물가는 뺀다 (가시 구덩이에 놓이던 ▼ 문)
  const bad = (P.roomTags ?? []).filter((t) => t.role === "trap" || t.role === "treasure");
  const pads = P.pads ?? [], wat = (P.spec ?? []).filter((r) => r.t === 3 || r.t === 11 || r.t === 12);
  const S = (P.spots ?? []).filter(
    (s) =>
      s.x > 96 &&
      s.x < Math.min(P.WP, P.arenaFrom) - 96 &&
      !bad.some((t) => s.x >= t.x0 && s.x < t.x1 && s.y >= t.y0 && s.y <= t.y1) &&
      !pads.some((q) => s.x > q.xa - 48 && s.x < q.xb + 48 && Math.abs((q.y ?? s.y) - s.y) < 48) &&
      !wat.some((r) => s.x > r.x0 - 32 && s.x < r.x1 + 32 && s.y > r.y0 - 40 && s.y < r.y1 + 24),
  );
  if (!S.length) return;
  const snap = (x) => Math.round((x - 8) / TS) * TS + 8;
  if (P.upX >= 0 && P.peak) {
    const top = S.reduce((b, s) => (s.y < b.y ? s : b), S[0]);
    top.y < P.peak.y - 40 && ((P.peak0 = P.peak), (P.peak = { x: snap(top.x), y: top.y }));
  }
  if (P.downX >= 0 && P.deep) {
    const bot = S.reduce((b, s) => (s.y > b.y ? s : b), S[0]);
    bot.y > P.deep.y + 40 && ((P.deep0 = P.deep), (P.deep = { x: snap(bot.x), y: bot.y }));
  }
}
// 뒷벽 메우기 (2026-11-28): 뒷벽이 있는 건물 옆의 좁은 틈(사다리 굴·벽과 바위 사이)에 뒷벽이 비어 배경이 보이던 곳
//   8px 칸: 공기이고 뒷벽이 없는데, 좌우(또는 위아래) 2칸 안이 양쪽 다 바위·뒷벽이고, 바로 옆 칸 하나는 뒷벽인 칸을 채운다 (3번 되풀이)
function patchWalls(P) {
  if (!P.walls?.length) return;
  const { F, WP, HP } = P, G = 8, GW = Math.ceil(WP / G), GH = Math.ceil(HP / G);
  const mats = ["rock", "brick", "wood", "inwood"], WL = new Uint8Array(GW * GH);
  for (const w of P.walls) {
    if (w.m === "leaf" || w.m === "stem") continue;
    const v = Math.max(1, mats.indexOf(w.m) + 1);
    const x0 = Math.max(0, Math.floor(w.x0 / G)), x1 = Math.min(GW, Math.ceil(w.x1 / G)), y0 = Math.max(0, Math.floor(w.y0 / G)), y1 = Math.min(GH, Math.ceil(w.y1 / G));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) WL[y * GW + x] = v;
  }
  const AIR = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && !F.solid(x * G + 4, y * G + 4);
  const W = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH ? 0 : WL[y * GW + x]);
  const full = (x, y) => !AIR(x, y) || W(x, y) > 0;
  let added = 0;
  for (let it = 0; it < 3; it++) {
    const add = [];
    for (let y = 1; y < GH - 1; y++)
      for (let x = 1; x < GW - 1; x++) {
        if (W(x, y) || !AIR(x, y)) continue;
        const h = (full(x - 1, y) || full(x - 2, y)) && (full(x + 1, y) || full(x + 2, y)) && (W(x - 1, y) || W(x + 1, y));
        const v = (full(x, y - 1) || full(x, y - 2)) && (full(x, y + 1) || full(x, y + 2)) && (W(x, y - 1) || W(x, y + 1));
        if (!h && !v) continue;
        add.push([x, y, W(x - 1, y) || W(x + 1, y) || W(x, y - 1) || W(x, y + 1)]);
      }
    if (!add.length) break;
    for (const [x, y, v] of add) WL[y * GW + x] = v;
    added += add.length;
    // 줄마다 같은 재질끼리 이어 붙여 사각형으로
    const byRow = new Map();
    for (const [x, y, v] of add) {
      byRow.has(y) || byRow.set(y, []);
      byRow.get(y).push([x, v]);
    }
    for (const [y, xs] of byRow) {
      xs.sort((p, q) => p[0] - q[0]);
      let s0 = xs[0][0], px = s0, pv = xs[0][1];
      for (let i = 1; i <= xs.length; i++) {
        const q = xs[i];
        if (q && q[0] === px + 1 && q[1] === pv) {
          px = q[0];
          continue;
        }
        P.walls.push({ x0: s0 * G, y0: y * G, x1: (px + 1) * G, y1: (y + 1) * G, m: mats[pv - 1] ?? "rock", keep: 1 });
        if (q) ((s0 = q[0]), (px = q[0]), (pv = q[1]));
      }
    }
  }
  P.wallFix = added;
}
// 소품 받침 (2026-11-28): 바닥 소품은 가운데 밑이 바위·발판이어야, 매다는 소품은 바로 위가 바위여야 한다 — 아니면 뺀다
function propSupport(P) {
  if (!P.props?.length) return;
  const { F, WP, HP } = P;
  const PLAT = P.spec.filter((r) => r.t === 1 || r.t === 2);
  const rock = (x, y) => y >= HP || x < 0 || x >= WP || (y >= 0 && F.solid(x, y));
  const foot = (x, y) => rock(x, y) || PLAT.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 - 1 && y < r.y1);
  const n0 = P.props.length;
  P.props = P.props.filter((p) => {
    if (p.bg || p.ext) return !0;
    if (p.hang) return rock(p.x, p.y + 3) || rock(p.x, p.y) || rock(p.x, p.y - 3);
    return foot(p.x, p.y + 1) || foot(p.x, p.y + 3) || foot(p.x, p.y - 1);
  });
  P.propFix = n0 - P.props.length;
}
// 지표를 가로지르는 뒷벽은 지표선 아래(언덕 속)만 남긴다.
//   정문 복도·동굴 입구처럼 비탈이 방을 비스듬히 자르는 곳에서, 네모난 뒷벽이 비탈 바깥 하늘에 그대로 보이던 문제
//   (지표보다 완전히 위인 뒷벽 = 하늘섬 속 방은 그대로 둔다)
function clipWalls(P) {
  const S = 4, hAt = (x) => P.h[clamp(Math.round(x / Q), 0, P.h.length - 1)];
  const out = [];
  for (const w of P.walls ?? []) {
    // 지표 구조물(통나무 다리·그루터기·거목 속)의 뒷벽은 그대로
    if (w.keep) {
      out.push(w);
      continue;
    }
    let cross = !1;
    for (let x = w.x0; x < w.x1 && !cross; x += S) {
      const h = Math.max(hAt(x), hAt(Math.min(w.x1, x + S)));
      cross = w.y0 < h - 2 && w.y1 > h + 2;
    }
    if (!cross) {
      out.push(w);
      continue;
    }
    // 4px 기둥마다 지표 아래부터. 같은 높이끼리 이어 붙인다
    let cur = null;
    for (let x = w.x0; x < w.x1; x += S) {
      const x1 = Math.min(w.x1, x + S);
      const h = Math.ceil(Math.max(hAt(x), hAt(x1)) / 4) * 4, y0 = Math.max(w.y0, h);
      if (y0 >= w.y1) {
        cur = null;
        continue;
      }
      if (cur && cur.y0 === y0 && cur.x1 === x) cur.x1 = x1;
      else ((cur = { ...w, x0: x, x1, y0 }), out.push(cur));
    }
  }
  P.walls = out;
}
// ── 특수 블럭: 1 나무판 2 구름 3 물 4 얼음 5 튕김 버섯 ──
//   매달려 오르내리는 곳: 6 사다리 7 밧줄 8 덩굴 (위아래 키) · 9 짚라인(줄, ax·ay→bx·by) · 10 바람 기둥(떠오른다)
//   11·12 물살(왼쪽·오른쪽으로 미는 물) · 13 무너지는 발판 · 14 금 간 벽(때려 부순다) · 15 승강기 길(발판이 오르내린다)
//   13·14는 검사 때는 바위, 마지막에 장에서 빼고 장치(gizmo.js)가 그리고 막는다
const GROUND_NEW = new Set(["gm1_0", "g2_0", "gm2_0"]);
export const SPEC = { plank: 1, cloud: 2, water: 3, ice: 4, bounce: 5, ladder: 6, rope: 7, vine: 8, zip: 9, wind: 10, curL: 11, curR: 12, crumble: 13, crack: 14, lift: 15, fall: 16, geyser: 17, heal: 18, lever: 19, ferry: 20, draw: 21, swing: 22 };
// 금 간 벽(14)은 길찾기에서 지나갈 수 있는 것으로 본다 (언제든 부수고 지나간다) — 뒤 숨은 방에도 상자가 놓인다
const SOLID_SPEC = new Set([1, 2, 4, 5, 13, 21]);
export const CLIMB_SPEC = new Set([6, 7, 8, 10, 15, 17]);
const DYN_SPEC = new Set([1, 2, 13, 14, 21]);
function spec(P, x0, y0, x1, y1, kind, ex) {
  const sn = (v) => Math.round(v / BLK) * BLK;
  [x0, y0, x1, y1] = [sn(x0), sn(y0), sn(x1), sn(y1)];
  if (x1 <= x0 || y1 <= y0) return;
  const t = SPEC[kind];
  P.spec.push(ex ? { x0, y0, x1, y1, t, ...ex } : { x0, y0, x1, y1, t });
  // 막는 것만 검사·충돌용으로 장에 바위로 넣는다 (나무판·구름·무너지는 판·금 간 벽은 마지막에 뺀다)
  SOLID_SPEC.has(t) && addShape(P, x0 - 4, y0 - 4, x1 + 4, y1 + 4, (px, py) => Math.min(px - x0, x1 - px, py - y0, y1 - py) + 0.5);
  t === 4 && P.mats.push({ x0, y0, x1, y1, m: "ice" });
  t === 5 && P.mats.push({ x0, y0, x1, y1, m: "jelly" });
}
// 동굴 방에서 정한 특수 블럭 (칸 좌표 → px). 짚라인은 ex에 끝점(px)
function applySpecReq(P) {
  for (const q of P.specReq) spec(P, q.x0 * BLK, q.y0 * BLK, q.x1 * BLK, q.y1 * BLK, q.k, q.ex);
  P.specReq = [];
}
// 나무·폐허: 하늘이 트인 평평한 윗면(땅·섬)에. 숲(무리)과 드문드문 한 그루가 번갈아 나온다
function placeDeco(P) {
  P.trees = [];
  const reg = P.z.reg;
  if (P.kind === "cave" || !reg?.pal) return;
  const { F, N } = P, R = rng((P.seed ^ 0x7e3e5) >>> 0);
  const kinds = decoKinds(reg).filter((k) => !P.bp || (k !== "pillar" && k !== "arch")), lim = Math.min(P.WP, P.arenaFrom) - 160;
  const avoid = [P.peak, P.chest, P.deep, ...(P.mouths ?? [])].filter(Boolean);
  const pads = P.pads ?? [];
  const surfMax = (x) => (P.kind === "ground" && P.h ? P.h[Math.min(P.h.length - 1, Math.round(x / Q))] + 8 : P.HP - 8);
  // 숲 지역(모스바크): 지표면이면 머리 위에 하늘섬이 있어도 나무를 세운다 (나무 키만큼만 비면)
  const FOREST = P.z.reg?.look === "mossbark";
  for (let x = 200; x < lim; ) {
    const grove = N.n1(x / 900 + 17.3) > -0.15;
    x += grove ? R.range(40, 100) : R.range(160, 380);
    if (x >= lim) break;
    if (avoid.some((a) => Math.abs(a.x - x) < 90) || pads.some((p) => x > p.xa - 30 && x < p.xb + 30)) continue;
    const ymax = Math.min(P.HP - 8, surfMax(x));
    for (let y = 8; y < ymax; y++) {
      if (!F.solid(x, y) || F.solid(x, y - 1)) continue;
      if (P.spec.some((r) => x >= r.x0 - 16 && x < r.x1 + 16 && y >= r.y0 - 8 && y <= r.y1 + 8)) continue;
      // 윗면 y: 섬 위는 70%, 땅 위는 숲이면 거의 항상
      if (R() > (FOREST ? 0.97 : grove ? 0.9 : 0.75)) continue;
      const kind = R.pick(kinds), sz = grove ? R.int(1, 2) : R.int(0, 2);
      const w = decoWidth(kind, sz), h = decoHeight(kind, sz);
      let ok = true;
      // 밑동 양쪽이 평평한가
      for (const dx of [-12, -6, 6, 12]) ok = ok && F.solid(x + dx, y + 8) && !F.solid(x + dx, y - 9);
      // 설계 구역: 작은 디딤돌 위에는 나무를 두지 않는다 (나무 폭만큼 발판이 있어야)
      if (P.bp) for (const dx of [-w * 0.45, w * 0.45]) ok = ok && F.solid(x + dx, y + 24);
      // 설계 구역: 하늘이 트인 곳에만 (섬 속 동굴·신전 바닥에는 두지 않는다)
      if (P.bp && !(FOREST && P.h && Math.abs(y - (surfMax(x) - 8)) < 48)) for (let yy = y - 8; ok && yy > 0; yy -= 16) ok = !F.solid(x, yy);
      // 위 공간이 비었는가
      for (let dx = -w / 2; ok && dx <= w / 2; dx += 8) for (let yy = y - 4; ok && yy > y - h; yy -= 8) ok = !F.solid(x + dx, yy);
      // 벽돌(다리·탑) 위엔 나무를 심지 않는다
      if (ok && (P.mats ?? []).some((m) => (m.m === "brick" || m.m === "trim") && x >= m.x0 && x < m.x1 && y + 4 >= m.y0 && y + 4 < m.y1)) ok = false;
      if (ok && !P.trees.some((T) => Math.abs(T.x - x) < (T.w + w) * 0.3 && Math.abs(T.y - y) < 40)) P.trees.push({ x: Math.round(x), y, w, key: decoKey(kind, sz, R.int(0, 5), reg.pal) });
    }
  }
}

// ── 소품 (설계도 구역): 3D 픽셀 그림 (natprops.js), 지형을 칠할 때 공기 칸에 겹쳐 그린다 ──
// 자리: 하늘이 트인 바닥(지표·섬 윗면) · 동굴 바닥/천장 · 벽돌 방 바닥/천장/뒷벽 횃불
//   P.props = [{ x, y(붙는 점), k(종류), s(크기), v(변형), acc(강조색), hang }]
function placeProps(P) {
  const { F, WP, HP } = P, R = rng((P.seed ^ 0x9e0b5) >>> 0), out = [];
  const solid = (x, y) => y >= HP || (x >= 0 && x < WP && y >= 0 && F.solid(x, y));
  // 벽돌 재질·뒷벽·나무 뒷벽 자리: 8px 칸 지도로 한 번에 (사각형이 수천 개여도 빠르게)
  const GW = Math.ceil(WP / 8) + 1, GH = Math.ceil(HP / 8) + 1, BR = new Uint8Array(GW * GH), WL = new Uint8Array(GW * GH);
  const paint = (G, r, v) => {
    const x0 = Math.max(0, Math.floor(r.x0 / 8)), x1 = Math.min(GW, Math.ceil(r.x1 / 8)), y0 = Math.max(0, Math.floor(r.y0 / 8)), y1 = Math.min(GH, Math.ceil(r.y1 / 8));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) G[y * GW + x] |= v;
  };
  for (const m of P.mats ?? []) m.m === "brick" && paint(BR, m, 1);
  for (const w of P.walls ?? []) w.m !== "stem" && paint(WL, w, w.m === "wood" ? 3 : 1);
  const gAt = (G, x, y) => (x < 0 || y < 0 || x >= WP || y >= HP ? 0 : G[Math.floor(y / 8) * GW + Math.floor(x / 8)]);
  const brickAt = (x, y) => gAt(BR, x, y) === 1;
  const surf = (x) => (P.h ? P.h[clamp(Math.round(x / Q), 0, P.h.length - 1)] : 0);
  // 뒷벽이 있는 자리 (횃불·창·벽감은 뒷벽에만 단다)
  const wallAt = (x, y) => gAt(WL, x, y) > 0;
  const avoid = [P.peak, P.deep, ...(P.mouths ?? [])].filter(Boolean);
  const pads = P.pads ?? [];
  const water = (P.spec ?? []).filter((r) => r.t === 3 || r.t === 11 || r.t === 12);
  const tres = (P.roomTags ?? []).filter((t) => t.role === "treasure").map((t) => ({ x: (t.x0 + t.x1) / 2, y: t.y1 }));
  const free = (x, y, w) => !avoid.some((a) => Math.abs(a.x - x) < 70 + w / 2 && Math.abs(a.y - y) < 120) && !pads.some((p) => x + w / 2 > p.xa - 16 && x - w / 2 < p.xb + 16 && Math.abs((p.y ?? y) - y) < 40) && !water.some((r) => x + w / 2 > r.x0 - 12 && x - w / 2 < r.x1 + 12 && y > r.y0 - 24 && y < r.y1 + 24) && !tres.some((t) => Math.abs(t.x - x) < 26 + w / 2 && Math.abs(t.y - y) < 60);
  // ── 기둥: 뒷벽에 칠하던 기둥 띠 → 3D 기둥 그림 (뒷벽 층). 기둥 머리·받침 띠는 지운다 ──
  const cols = [], keepW = [];
  for (const wl of P.walls ?? []) (wl.m === "stem" && wl.x1 - wl.x0 <= 26 && wl.y1 - wl.y0 >= 40 ? cols : keepW).push(wl);
  const near = (wl, cc) => wl.x0 < cc.x1 + 6 && wl.x1 > cc.x0 - 6 && (Math.abs(wl.y1 - cc.y0) <= 12 || Math.abs(wl.y0 - cc.y0) <= 12 || Math.abs(wl.y1 - cc.y1) <= 10);
  P.walls = keepW.filter((wl) => !(wl.m === "stem" && wl.y1 - wl.y0 <= 10 && cols.some((cc) => near(wl, cc))));
  for (const cc of cols) {
    const cx = Math.round((cc.x0 + cc.x1) / 2), brk = brickAt(cx, cc.y1 - 8);
    out.push({ x: cx, y: cc.y1 + 1, k: brk ? "p_column" : "p_rockcol", s: Math.round((cc.y1 - cc.y0 + (brk ? 10 : 0)) / 8) * 8, v: Math.round(cc.x1 - cc.x0), acc: null, hang: 0, bg: 1, dim: 0.04, ext: 1, g: brk ? 0 : 1 });
  }
  // 받침 확인: 폭의 85%가 바닥(천장)에 닿고, 반대쪽으로 높이만큼 비었나
  const floorOK = (x, y, w, h) => {
    for (const f of [-0.42, -0.2, 0, 0.2, 0.42]) if (!solid(x + w * f, y + 3) || solid(x + w * f, y - 2)) return false;
    for (const dx of [-w / 2, 0, w / 2]) for (let yy = y - 6; yy > y - h; yy -= 8) if (solid(x + dx, yy)) return false;
    return true;
  };
  const ceilOK = (x, y, w, h) => {
    for (const f of [-0.42, -0.2, 0, 0.2, 0.42]) if (!solid(x + w * f, y - 3) || solid(x + w * f, y + 2)) return false;
    for (const dx of [-w / 2, 0, w / 2]) for (let yy = y + 6; yy < y + h + 48; yy += 8) if (solid(x + dx, yy)) return false;
    return true;
  };
  const placed = [];
  const room = (x, y, w) => !placed.some((q) => Math.abs(q.x - x) < (q.w + w) / 2 + 10 && Math.abs(q.y - y) < 40);
  const pickW = (tbl) => {
    let t = R() * tbl.reduce((p, q) => p + q[1], 0);
    for (const q of tbl) if ((t -= q[1]) <= 0) return q[0];
    return tbl[0][0];
  };
  // 크기 배율: 사람 크기 물건은 작게, 바위·기둥·석상 같은 건 방 높이에 맞춰 크게까지
  const SCS = [0.8, 1, 1.25, 1.5, 1.8, 2.2, 2.6], SCW = [2, 4, 4, 3, 2, 1.5, 1];
  // 그림 가짓수를 줄이려고 배율은 정해진 단계로만 (같은 그림을 여러 번 쓴다)
  const snapSc = (v) => SCS.reduce((b, c) => (Math.abs(c - v) < Math.abs(b - v) ? c : b), 1);
  const SCALED = ["p_stalag", "p_stalac", "p_crystal", "p_boulder", "p_bush", "p_shroom", "p_rubble", "p_brokencol", "p_moss", "p_roots", "p_fern", "p_flowers", "p_bones", "p_skulls"];
  const CAP = { p_torch: 1, p_brazier: 1.25, p_candles: 1.25, p_altar: 1.25, p_rack: 1.25, p_urn: 1.5, p_crates: 1.5, p_skulls: 1.5, p_bones: 1.5, p_flowers: 1.25, p_fern: 1.5, p_bush: 1.8, p_log: 1.5, p_chain: 1.5, p_cage: 1.5, p_chand: 1.5, p_banner: 1.5, p_web: 1.5, p_shelf: 1.25, p_rubble: 1.8, p_sarcoph: 1.5, p_statue: 2.6 };
  const pickSc = (k, room) => {
    const cap = Math.min(CAP[k] ?? 2.6, room);
    const c = SCS.map((v, i) => (v <= cap ? SCW[i] : 0));
    let t = R() * c.reduce((p, q) => p + q, 0);
    for (let i = 0; i < c.length; i++) if ((t -= c[i]) <= 0) return SCS[i];
    return 1;
  };
  const tryPut = (x, yy, k, hang, o = {}) => {
    const s = o.s ?? (["p_statue", "p_shelf", "p_crates", "p_brazier", "p_torch", "p_altar", "p_rack", "p_sarcoph", "p_niche", "p_cage", "p_chand"].includes(k) ? 0 : SCALED.includes(k) ? R.int(1, 2) : R.int(0, 2));
    const [w0, h0] = propSize(k, s), sc = o.sc ?? pickSc(k, (o.room ?? 300) / (h0 + 18)), w = w0 * sc, h = h0 * sc;
    if (!free(x, yy, w) || !room(x, yy, w) || !(hang ? ceilOK(x, yy, w, h) : floorOK(x, yy, w, h + 6))) return false;
    placed.push({ x, y: yy, w });
    // 바닥 소품은 2px, 매단 소품은 6px 바위에 묻어 떠 보이지 않게
    // 종유석: 물방울이 떨어질 바닥까지 거리 (움직임 층에서 쓴다)
    let fall = 0;
    if (k === "p_stalac") for (let q = yy + 8; q < yy + 900 && !solid(x, q); q += 4) fall = q - yy;
    out.push({ x: Math.round(x), y: Math.round(hang ? yy - 6 : yy + 2), k, s, v: SCALED.includes(k) ? 0 : R.int(0, 1), sc, acc: o.acc ?? null, hang: hang ? 1 : 0, g: o.g ?? 0, ...(fall ? { fall } : {}) });
    return true;
  };
  // 설계에서 정한 자리 소품 (자리 검사 없이 먼저 놓는다)
  for (const q of P.fixedProps ?? []) {
    const hang = (q.hang ?? propHangs(q.k)) ? 1 : 0, s = q.s ?? 1, sc = q.sc ?? 1;
    const [w0] = propSize(q.k, s);
    let qy = q.y;
    // 매다는 소품(깃발·사슬…)인데 자리가 바닥(밑이 바위, 위가 공기)이면 바로 위 천장 밑면으로 옮긴다
    //   바닥에서 아래로 그려져 조각만 떠 보이던 문제 (2026-11-28)
    if (hang && !solid(q.x, qy - 4) && solid(q.x, qy + 4)) {
      let c = qy - 8;
      while (c > qy - 320 && !solid(q.x, c)) c -= 2;
      if (!solid(q.x, c)) continue;
      while (solid(q.x, c + 1)) c++;
      qy = c + 4;
    }
    placed.push({ x: q.x, y: qy, w: w0 * sc });
    out.push({ x: Math.round(q.x), y: Math.round(hang ? qy - 6 : qy + 2), k: q.k, s, v: q.v ?? 0, sc, acc: q.acc ?? null, hang, g: 0 });
  }
  // 지역 장식 표: 그린스텝은 고원 풀밭 소품, 굴·계단엔 종유석·수정 대신 이끼·뿌리·고사리
  const GS = P.z?.reg?.look === "greenstep" || P.z?.reg?.deco === "green";
  // 스톤브리지: 돌 도시 — 바위 방엔 수정·종유석 대신 무너진 석재·항아리, 천장엔 사슬
  const SB = P.z?.reg?.look === "stonebridge";
  // 리프크라운: 나무 속·잎 방 — 버섯·고사리·둥지, 천장엔 뿌리·이끼
  const LC = P.z?.reg?.look === "leafcrown";
  // 동굴 구역 짜임별 소품 (설계도 cave.style): 바닥·천장 소품표, 뒷벽 큰 소품, 수정·버섯 색
  const CS = P.bp?.cave?.style ?? null;
  const CRY = CS === "drip" ? [0x80e0ff, 0xd8f4ff, 0x60c8e8] : CS === "mine" ? [0xc080ff, 0xffa040, 0xa070f0] : [0x60d0ff, 0xc080ff, 0xffd070];
  const SHR = CS === "root" ? [0x60f0c0, 0xc070f0, 0xffb040, 0x80e0ff] : [0xc060e0, 0x40e0c0, 0xffa040];
  const CAVE_FLOOR = {
    drip: [["p_stalag", 44], ["p_boulder", 16], ["p_crystal", 10], ["p_rubble", 8], ["p_bones", 5], ["p_shroom", 4]],
    mine: [["p_crates", 16], ["p_rubble", 18], ["p_ore", 14], ["p_boulder", 10], ["p_rack", 8], ["p_cart", 6], ["p_log", 6], ["p_bones", 5], ["p_anvil", 3]],
    root: [["p_shroom", 34], ["p_fern", 18], ["p_log", 10], ["p_boulder", 8], ["p_flowers", 6], ["p_stalag", 6], ["p_bones", 5]],
    green: [["p_fern", 18], ["p_boulder", 14], ["p_rubble", 10], ["p_crates", 6], ["p_flowers", 4]],
    grove: [["p_shroom", 22], ["p_fern", 20], ["p_log", 10], ["p_nest", 6], ["p_flowers", 10], ["p_bush", 8], ["p_hive", 3]],
    stone: [["p_rubble", 18], ["p_urn", 14], ["p_brokencol", 10], ["p_crates", 10], ["p_boulder", 8], ["p_statue", 5], ["p_candles", 5]],
  }[GS ? "green" : SB ? "stone" : LC ? "grove" : CS];
  const CAVE_CEIL = { drip: [["p_stalac", 70], ["p_moss", 8], ["p_web", 6]], mine: [["p_chain", 24], ["p_web", 18], ["p_cage", 8], ["p_moss", 4]], root: [["p_roots", 50], ["p_moss", 26], ["p_web", 8], ["p_stalac", 6]], green: [["p_roots", 44], ["p_moss", 36], ["p_web", 6]], stone: [["p_chain", 24], ["p_web", 12], ["p_moss", 6]], grove: [["p_roots", 40], ["p_moss", 30], ["p_web", 10]] }[GS ? "green" : SB ? "stone" : LC ? "grove" : CS];
  const woodAt = (x, y) => (gAt(WL, x, y) & 2) > 0;
  // 구름 디딤돌: 위에도 아래에도 아무것도 두지 않는다
  const CL = (P.spec ?? []).filter((s) => s.t === 2);
  const onCloud = (x, y) => CL.some((s) => x >= s.x0 - 8 && x < s.x1 + 8 && y >= s.y0 - 14 && y <= s.y1 + 14);
  P.trees = (P.trees ?? []).filter((T) => !onCloud(T.x, T.y + 2));
  // ── 나무: 옛 그림(natdeco) 대신 3D 픽셀 나무 ──
  for (const T of P.trees ?? []) {
    const [, kind, sS, vS] = T.key.split(":");
    const k = kind === "pine" ? "p_pine" : kind === "dead" ? (["grassmere", "mossbark", "greenstep", "leafcrown"].includes(P.z?.reg?.look) ? "p_oak" : "p_dead") : ["oak", "willow", "pale"].includes(kind) ? "p_oak"
      : kind === "cactus" ? "p_cactus" : kind === "shroom" ? "p_shroom" : kind === "crystal" ? "p_crystal" : kind === "pillar" || kind === "arch" ? "p_brokencol" : null;
    if (!k) continue;
    out.push({ x: T.x, y: T.y + 2, k, s: Math.min(2, +sS), v: +vS % 2, acc: null, hang: 0, sc: 1, g: 0 });
    T.conv = 1;
  }
  P.trees = (P.trees ?? []).filter((T) => !T.conv);
  const T_OPEN = GS ? [["p_flowers", 30], ["p_bush", 16], ["p_fern", 14], ["p_boulder", 12], ["p_cairn", 6], ["p_menhir", 3], ["p_sheep", 3]] : [["p_bush", 34], ["p_flowers", 26], ["p_boulder", 18], ["p_fern", 16], ["p_log", 6]];
  const T_UGB = [["p_sarcoph", 12], ["p_skulls", 14], ["p_rubble", 16], ["p_brokencol", 10], ["p_urn", 10], ["p_brazier", 8], ["p_rack", 8], ["p_altar", 5], ["p_crates", 6], ["p_candles", 8]];
  const T_SKB = GS ? [["p_candles", 16], ["p_urn", 12], ["p_lectern", 10], ["p_shelf", 10], ["p_statue", 8], ["p_brazier", 8], ["p_crates", 4]] : [["p_statue", 14], ["p_urn", 16], ["p_brazier", 12], ["p_candles", 12], ["p_altar", 8], ["p_shelf", 7], ["p_crates", 5], ["p_brokencol", 8], ["p_rubble", 6]];
  const torchAt = [], bgAt = [];
  for (let x = 40; x < WP - 40; x += 8) {
    let prevSolid = solid(x, 0);
    for (let y = 4; y < HP - 4; y += 4) {
      const sd = solid(x, y);
      if (sd === prevSolid) continue;
      prevSolid = sd;
      let yy = y;
      while (yy > y - 4 && solid(x, yy - 1) === sd) yy--;
      // 하늘 구역: 땅속이 없다 (섬 윗면 = 바깥 소품, 섬 속 방 = 뒷벽이 있으면 동굴 소품)
      const ug = P.kind === "sky" ? !1 : yy > surf(x) + 24, brk = brickAt(x, sd ? yy + 6 : yy - 6);
      if (onCloud(x, yy)) continue;
      if (sd) {
        // ── 바닥 ──
        let clear = 0;
        for (let q = yy - 4; q > yy - 320 && !solid(x, q); q -= 4) clear += 4;
        let open = clear >= 316;
        for (let q = yy - 320; q > Math.max(0, yy - 520) && open; q -= 16) solid(x, q) && (open = false);
        // 동굴 소품은 땅속이거나 섬 속(뒷벽이 있는 곳)만. 위에 하늘섬이 있어도 트인 땅은 바깥 소품
        const ctx = brk ? (ug ? "ugb" : "skb") : ug || wallAt(x, yy - 24) ? "cave" : "open";
        void open;
        const deep = ug && yy > surf(x) + 1400;
        // 뒷벽 장식 (뒷벽 층): 하늘 신전은 창·걸개, 땅속 던전은 벽감·때 낀 걸개, 큰 동굴은 흐릿한 큰 종유석·수정
        if (ctx === "skb" && clear >= 170 && wallAt(x, yy - 90) && !bgAt.some((q) => Math.abs(q.x - x) < 320 && Math.abs(q.y - yy) < 120) && free(x, yy, 40)) {
          const win = R() < 0.5, sz = clear > 220 ? 2 : 1;
          bgAt.push({ x, y: yy });
          out.push({ x, y: win ? yy - 70 : yy - clear + 6, k: win ? "p_window" : "p_tapestry", s: sz, v: R.int(0, 1), acc: null, hang: win ? 0 : 1, bg: 1 });
        } else if (ctx === "ugb" && clear >= 110 && wallAt(x, yy - 40) && !bgAt.some((q) => Math.abs(q.x - x) < 260 && Math.abs(q.y - yy) < 100) && free(x, yy, 40)) {
          bgAt.push({ x, y: yy });
          const tap = clear >= 170 && R() < 0.35;
          out.push({ x, y: tap ? yy - clear + 6 : yy - 30 - R.int(0, 20), k: tap ? "p_tapestry" : "p_niche", s: 1, v: R.int(0, 1), sc: tap ? 1 : R() < 0.5 ? 1 : 1.25, acc: null, hang: tap ? 1 : 0, bg: 1, g: 1 });
        } else if (ctx === "cave" && !GS && !SB && !LC && !(CS === "mine" && woodAt(x, yy - 24)) && clear >= 150 && !out.some((q) => q.bg && !q.hang && Math.abs(q.x - x) < 170 && Math.abs(q.y - yy) < 140) && R() < 0.85) {
          const big = Math.min(2.6, clear / 70);
          const bk = CS === "root" ? (R() < 0.6 ? "p_shroom" : "p_stalag") : CS === "mine" ? "p_rockcol" : R() < (CS === "drip" ? 0.85 : 0.7) ? "p_stalag" : "p_crystal";
          bk === "p_rockcol"
            ? clear >= 170 && clear < 316 && out.push({ x, y: yy + 2, k: "p_rockcol", s: Math.round((clear + 8) / 8) * 8, v: 18, acc: null, hang: 0, bg: 1, dim: 0.04, ext: 1, g: 1 })
            : out.push({ x, y: yy + 2, k: bk, s: 2, v: R.int(0, 1), sc: snapSc(Math.max(1.25, big * (0.6 + R() * 0.4))), acc: bk === "p_shroom" ? SHR[R.int(0, SHR.length - 1)] : CRY[R.int(0, 2)], hang: 0, bg: 1, g: 1 });
        }
        const rate = ctx === "open" ? 0.075 : ctx === "cave" ? 0.15 : 0.12;
        if (R() > rate) continue;
        // 그린스텝 나무 벽 방 = 사람 사는 곳 (살림 소품)
        const home = GS && ctx === "cave" && woodAt(x, yy - 24);
        const k = home ? pickW([["p_crates", 18], ["p_hay", 16], ["p_urn", 14], ["p_wool", 8], ["p_cheese", 6], ["p_shelf", 6]]) : ctx === "open" ? pickW(T_OPEN) : ctx === "ugb" ? pickW(T_UGB) : ctx === "skb" ? pickW(T_SKB) : CAVE_FLOOR ? pickW(CAVE_FLOOR) : pickW([["p_stalag", 28], ["p_shroom", 16], ["p_crystal", deep ? 24 : 12], ["p_boulder", 14], ["p_bones", 7], ["p_rubble", 8], ["p_skulls", 3]]);
        tryPut(x, yy, k, false, { room: clear, g: ug ? 1 : 0, acc: k === "p_crystal" ? CRY[R.int(0, 2)] : k === "p_shroom" ? SHR[R.int(0, SHR.length - 1)] : null });
        // 벽돌 방: 뒷벽 횃불 (천장이 높은 방, 220px마다)
        //   뒷벽 층(bg)에 그린다: 앞 지형 층에 그리면 입체 깊이 차이로 벽에서 미끄러져 허공에 떠 보였다 (2026-11-28)
        const mineW = CS === "mine" && woodAt(x + 40, yy - 60);
        if ((brk || mineW) && clear >= 110 && !torchAt.some((t) => Math.abs(t.x - x) < (mineW ? 300 : 220) && Math.abs(t.y - yy) < 60) && free(x + 40, yy, 12)) {
          let c2 = 0;
          for (let q = yy - 4; q > yy - 120 && !solid(x + 40, q); q -= 4) c2 += 4;
          c2 >= 110 && (wallAt(x + 40, yy - 60) || mineW) && (torchAt.push({ x: x + 40, y: yy }), out.push({ x: x + 40, y: yy - 46, k: "p_torch", s: 0, v: 0, acc: null, hang: 0, bg: 1, dim: 0 }));
        }
      } else {
        // ── 천장 (바위 밑) ──
        if (yy < 40) continue;
        let below = 0;
        for (let q = yy + 4; q < yy + 260 && !solid(x, q); q += 4) below += 4;
        if (below < 100) continue;
        // 바깥 하늘의 섬 밑면(뒷벽 없는 곳)에는 종유석·사슬을 달지 않는다
        if (!ug && !brk && !wallAt(x, yy + 30)) continue;
        // 그린스텝: 벽돌 다리 밑 같은 바깥 하늘에도 달지 않는다
        if ((GS || SB || LC) && !wallAt(x, yy + 30)) continue;
        const ctx = brk ? (ug ? "ugb" : "skb") : "cave";
        // 큰 동굴 천장 뒷벽: 흐릿한 큰 종유석 (바위에 묻혀 붙는다)
        if (ctx === "cave" && !GS && !SB && !LC && below >= 170 && !out.some((q) => q.bg && q.hang && Math.abs(q.x - x) < (CS === "drip" ? 130 : 190) && Math.abs(q.y - yy) < 120) && CS !== "mine" && R() < 0.8 && ceilOK(x, yy, 30, 60))
          out.push({ x, y: yy - 6, k: CS === "root" && R() < 0.7 ? "p_roots" : "p_stalac", s: 2, v: R.int(0, 1), sc: snapSc(Math.min(2.6, 1.25 + R() * below / 160)), acc: null, hang: 1, bg: 1, g: 1 });
        if (R() > (ctx === "cave" ? (CS === "drip" ? 0.2 : 0.12) : 0.08)) continue;
        const tall = below > 170;
        const k = GS && ctx === "cave" && woodAt(x, yy + 30) ? pickW([["p_web", 10], ["p_chain", 6]]) : ctx === "ugb" ? pickW([["p_chain", 18], ["p_cage", 14], ["p_web", 16], ["p_moss", 16], ["p_chand", tall ? 10 : 0], ["p_banner", tall ? 8 : 0]]) : ctx === "skb" ? pickW([["p_banner", tall ? 30 : 0], ["p_chand", tall ? 20 : 0], ["p_chain", 12], ["p_web", 6]]) : CAVE_CEIL ? pickW(CAVE_CEIL) : pickW([["p_stalac", 50], ["p_roots", ug ? 10 : 40], ["p_moss", 24]]);
        tryPut(x, yy, k, true, { room: below - 60, g: ug ? 1 : 0 });
      }
    }
  }
  P.props = out;
}
// 예전(116줄 높이) 기준 y를 지금 높이로: 지면 위는 지면 높이 비율로, 아래는 땅속 깊이 비율로 늘린다
function Yo(P, y) {
  const base = FLOOR * TS, bot = (P.Ft - 5) * TS;
  return y <= 1120 ? (y * base) / 1120 : base + ((y - 1120) * (bot - base)) / 656;
}
// 8px 블록 맞추기: 블록 가운데 값의 부호로 블록 전체가 바위/공기가 되도록 격자 값을 다시 쓴다.
// 블록 가운데 격자점 = ±8, 블록 경계 격자점 = 둘러싼 블록이 모두 같으면 그 부호, 섞이면 0
// → 쌍선형 보간해도 각 픽셀의 부호가 자기 블록의 부호와 같다 (보이는 모양 = 밟는 모양 = 네모 블록)
function cellsOf(P) {
  const { F } = P, LW = F.LW, LH = F.LH, d = F.d;
  const S = BLK / Q; // 블록 하나 = 격자 2칸
  const NX = Math.floor((LW - 1) / S), NY = Math.floor((LH - 1) / S);
  const cell = scratch("BS", Int8Array, NX * NY);
  for (let cy = 0; cy < NY; cy++)
    for (let cx = 0; cx < NX; cx++) cell[cy * NX + cx] = d[(cy * S + 1) * LW + cx * S + 1] > 0 ? 1 : -1;
  return { cell, NX, NY };
}
function writeCells(P, C) {
  const { F } = P, LW = F.LW, LH = F.LH, d = F.d;
  const { cell, NX, NY } = C;
  const at = (cx, cy) => (cx < 0 || cy < 0 || cx >= NX || cy >= NY ? 0 : cell[cy * NX + cx]);
  for (let j = 0; j < LH; j++) {
    const oj = j & 1, cy0 = oj ? (j - 1) >> 1 : (j >> 1) - 1, cy1 = oj ? cy0 : j >> 1;
    for (let i = 0; i < LW; i++) {
      const oi = i & 1, cx0 = oi ? (i - 1) >> 1 : (i >> 1) - 1, cx1 = oi ? cx0 : i >> 1;
      let s = 0, mixed = false;
      for (const cy of [cy0, cy1])
        for (const cx of [cx0, cx1]) {
          const v = at(cx, cy);
          if (!v) continue;
          if (!s) s = v;
          else if (v !== s) mixed = true;
        }
      d[j * LW + i] = mixed ? 0 : s * 8;
    }
  }
}
function blockSnap(P) {
  writeCells(P, cellsOf(P));
}
// 임시 버퍼 재사용 (구역마다 수 MB씩 새로 만들면 쓰레기 수거로 가끔 크게 멈춘다)
const SCR = new Map();
function scratch(name, Ctor, n) {
  let a = SCR.get(name);
  if (!a || a.length < n || !(a instanceof Ctor)) SCR.set(name, (a = new Ctor(Math.ceil(n * 1.05))));
  return a.subarray(0, n);
}

// ── 공용 도형 ────────────────────────────────────────
// 바위 더하기: F = max(F, sdf)  (sdf: 안쪽 양수, px)
function addShape(P, x0, y0, x1, y1, sdf) {
  const { F } = P, LW = F.LW, d = F.d;
  const i0 = Math.max(0, Math.floor(x0 / Q)), i1 = Math.min(LW - 1, Math.ceil(x1 / Q));
  const j0 = Math.max(0, Math.floor(y0 / Q)), j1 = Math.min(F.LH - 1, Math.ceil(y1 / Q));
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const v = sdf(i * Q, j * Q);
      const k = j * LW + i;
      if (v > d[k]) d[k] = v > 12 ? 12 : v;
    }
}
// 파내기: F = min(F, -sdf)
function cutShape(P, x0, y0, x1, y1, sdf) {
  const { F } = P, LW = F.LW, d = F.d;
  const i0 = Math.max(0, Math.floor(x0 / Q)), i1 = Math.min(LW - 1, Math.ceil(x1 / Q));
  const j0 = Math.max(0, Math.floor(y0 / Q)), j1 = Math.min(F.LH - 1, Math.ceil(y1 / Q));
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const v = -sdf(i * Q, j * Q);
      const k = j * LW + i;
      if (v < d[k]) d[k] = v < -12 ? -12 : v;
    }
}
// 평평한 바닥 (칸 경계에 정확히): 문·보스 방·함정 자리. 위쪽 공기는 얇게만 (방 모양은 따로 판다)
function flatFloor(P, xa, xb, yF, above = 12, below = 28, feather = 20) {
  const { F } = P, LW = F.LW, d = F.d;
  const FA = 12, FB = 12;
  const i0 = Math.max(0, Math.floor((xa - feather) / Q)), i1 = Math.min(LW - 1, Math.ceil((xb + feather) / Q));
  const j0 = Math.max(0, Math.floor((yF - above - FA) / Q)), j1 = Math.min(F.LH - 1, Math.ceil((yF + below + FB) / Q));
  for (let j = j0; j <= j1; j++) {
    const y = j * Q;
    let t = y - yF;
    t = t > 8 ? 8 : t < -8 ? -8 : t;
    // 띠 안은 정확히, 띠 바깥은 원래 값으로 부드럽게
    const vy = y < yF - above ? smooth((y - (yF - above - FA)) / FA) : y > yF + below ? smooth((yF + below + FB - y) / FB) : 1;
    if (vy <= 0) continue;
    for (let i = i0; i <= i1; i++) {
      const x = i * Q;
      const wx = x < xa ? smooth(1 - (xa - x) / feather) : x > xb ? smooth(1 - (x - xb) / feather) : 1;
      const w = wx * vy;
      if (w <= 0) continue;
      const k = j * LW + i;
      // 바닥 위 공기는 반드시 비우고(min), 아래 바위는 반드시 채운다(max)
      const cur = d[k];
      const tgt = y < yF ? Math.min(cur, t) : Math.max(cur, t);
      d[k] = cur + (tgt - cur) * w;
    }
  }
}

// 바위섬 (윗면은 x의 함수라 반드시 밟을 수 있다)
// 밑면 = 얕은 몸통 + 아래로 처진 덩어리 여러 개(위치·폭·깊이 제각각) + 두 겹 거친 잡음 → 원뿔·반원이 아닌 불규칙한 바윗덩이
// st: rock | cloud | garden | spire | ledge
function island(P, cx, top, w, t, st, opt = {}) {
  const { N, R } = P;
  const hw = w / 2, so = R() * 1000;
  const tilt = st === "ledge" ? R.range(-0.02, 0.02) : R.range(-0.05, 0.05);
  const lipL = R.range(0.7, 0.9), lipR = R.range(0.7, 0.9), rimD = st === "cloud" ? R.range(8, 14) : R.range(4, 11);
  const shape = opt.shape ?? "plateau";
  const boxy = shape === "mesa" || shape === "hollow";
  let body = st === "spire" ? 0.44 : st === "cloud" ? 0.4 : st === "ledge" ? 0.62 : st === "garden" ? 0.42 : 0.34;
  if (boxy) body = 0.62;
  if (shape === "twin") body = 0.22;
  const nl = opt.lobes ?? (st === "ledge" ? R.int(0, 1) : st === "spire" ? R.int(1, 3) : R.int(2, 4));
  const lobes = [];
  // 쌍봉: 양쪽에 깊은 덩어리 두 개, 가운데는 얇은 다리
  if (shape === "twin") for (const u of [-0.5, 0.5]) lobes.push({ u: u + R.range(-0.08, 0.08), s: R.range(0.3, 0.4), d: t * R.range(0.85, 1.1) });
  for (let k = shape === "twin" ? nl : 0; k < nl; k++) {
    const s = st === "spire" ? R.range(0.22, 0.42) : st === "cloud" ? R.range(0.32, 0.66) : R.range(0.2, 0.48);
    lobes.push({ u: R.range(-0.66, 0.66), s, d: t * (k === 0 ? R.range(0.8, 1) : R.range(0.4, 0.85)) });
  }
  const crag = st === "spire" ? 0.32 : st === "cloud" ? 0.1 : st === "garden" ? 0.16 : 0.24;
  const topAt =
    opt.topFn ??
    ((x) => {
      const u = (x - cx) / hw, au = u < 0 ? -u : u;
      const lip = u < 0 ? lipL : lipR;
      const r = au > lip ? (au - lip) / (1 - lip) : 0;
      // 계단형: 단마다 높이가 다르다 (단 높이는 한 번 뛰어 오를 만큼)
      let off = 0;
      if (opt.tiers) for (const T of opt.tiers) if (u >= T.u0 && u < T.u1) off = T.off;
      // 윗면은 평평하게 (가장자리만 한두 블록 내려간다)
      return top + off + (r > 0.55 ? BLK : 0) + (r > 0.85 ? BLK : 0) + (opt.round && au > 0.86 ? Math.round((opt.round * ((au - 0.86) / 0.14) ** 2) / BLK) * BLK : 0) + (opt.hill ? opt.hill(x) : 0);
    });
  // 밑면은 16px 기둥마다 한 깊이(8px 단위) → 거꾸로 선 계단 피라미드 같은 블록 밑면
  const botAt = (x0) => {
    const x = Math.floor(x0 / 16) * 16 + 8;
    return Math.max(topAt(x0) + BLK, Math.round(botRaw(x) / BLK) * BLK);
  };
  const botRaw = opt.botFn ?? ((x) => {
    const u = (x - cx) / hw, au = u < 0 ? -u : u;
    const env = 1 - au * au;
    if (env <= 0) return topAt(x);
    // 탑형·속 빈 섬은 옆면이 거의 곧게 선 덩어리
    let dep = t * body * (boxy ? Math.pow(env, 0.22) : Math.sqrt(env));
    const e3 = env * 3 < 1 ? env * 3 : 1;
    for (const L of lobes) {
      const v = (u - L.u) / L.s, q = 1 - v * v;
      if (q <= 0) continue;
      const lv = L.d * (st === "spire" ? q * Math.sqrt(q) : q) * e3;
      dep = dep > lv ? dep + lv * 0.18 : lv + dep * 0.18;
    }
    const n = 0.5 + 0.5 * N.fbm1(x / (st === "spire" ? 10 : 17) + so + 7, 3);
    dep *= 1 - crag + 2 * crag * n;
    dep += 3 * N.n1(x / 5 + so);
    return topAt(x) + (dep > 6 ? dep : 6);
  });
  // 격자 세로줄마다 윗면·밑면을 한 번만 재서 채운다
  {
    const { F } = P, LW = F.LW, LH = F.LH, d = F.d;
    const i0 = Math.max(0, Math.ceil((cx - hw) / Q)), i1 = Math.min(LW - 1, Math.floor((cx + hw) / Q));
    for (let i = i0; i <= i1; i++) {
      const x = i * Q, u = (x - cx) / hw;
      if (u <= -1 || u >= 1) continue;
      const tp = topAt(x), bt = botAt(x), c = (1 - (u < 0 ? -u : u)) * hw;
      const j0 = Math.max(0, Math.floor((tp - 12) / Q)), j1 = Math.min(LH - 1, Math.ceil((bt + 12) / Q));
      for (let j = j0; j <= j1; j++) {
        const y = j * Q, a = y - tp, b = bt - y;
        let v = a < b ? (a < c ? a : c) : b < c ? b : c;
        const k = j * LW + i;
        if (v > d[k]) d[k] = v > 12 ? 12 : v;
      }
    }
  }
  opt.keep !== false && P.islands.push({ cx, top, w, t, st, shape });
  // 속이 뚫린 아주 큰 섬: 안에 방 몇 개 + 통로 + 위에서 내려가는 세로굴 (8px 블록 직사각형)
  if (shape === "hollow") {
    // 뒷벽은 섬 안쪽만 (옆으로 뚫린 끝·위로 열린 곳은 하늘이 보인다)
    const box = (x0, y0, x1, y1) => (cutShape(P, x0, y0, x1, y1, (px, py) => Math.min(px - x0, x1 - px, py - y0, y1 - py) + 0.5), P.walls.push({ x0: Math.max(x0, cx - hw * 0.86), y0: Math.max(y0, top + 16), x1: Math.min(x1, cx + hw * 0.86), y1, m: "rock" }));
    const slab = (x0, y0, x1, y1) => addShape(P, x0, y0, x1, y1, (px, py) => Math.min(px - x0, x1 - px, py - y0, y1 - py) + 0.5);
    const sn = (v) => Math.round(v / BLK) * BLK;
    const yF = sn(top + Math.min(t * 0.42, 220)), th = sn(R.range(64, 80));
    // 가로 통로: 한쪽 옆면으로 뚫려 나간다
    const side = R() < 0.5 ? -1 : 1;
    const xa = sn(side < 0 ? cx - hw - 40 : cx - hw * 0.62), xb = sn(side < 0 ? cx + hw * 0.62 : cx + hw + 40);
    box(xa, yF - th, xb, yF);
    // 방: 통로 위로 높게 판 방 2~3개
    const nR = R.int(2, 3);
    for (let k = 0; k < nR; k++) {
      const rc = cx + hw * (-0.5 + k / Math.max(1, nR - 1)) * R.range(0.85, 1.05), rw = R.range(140, 240), rh = sn(Math.min(R.range(110, 170), yF - top - 40));
      box(sn(rc - rw / 2), yF - rh, sn(rc + rw / 2), yF);
      // 방 안 발판 (높은 방에서 다시 오르는 단)
      R() < 0.6 && slab(sn(rc - rw / 2), yF - 72, sn(rc - rw / 2 + R.range(48, 80)), yF - 56);
    }
    // 세로굴: 윗면에서 통로까지, 엇갈린 발판
    const sx = sn(cx - side * hw * R.range(0.2, 0.4));
    box(sx - 24, top - 16, sx + 24, yF - 8);
    for (let y = yF - 72, k = 0; y > top + 24; y -= 72, k++) {
      const l = k % 2 ? sx - 24 : sx;
      slab(l, y, l + 24, y + 16);
    }
  }
  // 붙은 작은 바위 (크고 작은 바위가 이어진 모양)
  if (opt.sub !== false && w > 70 && st !== "ledge") {
    const n = R.int(0, st === "spire" ? 2 : 1);
    for (let k = 0; k < n; k++) {
      const side = R() < 0.5 ? -1 : 1;
      const sw = w * R.range(0.2, 0.38);
      const sx = cx + side * (hw - sw * R.range(0.15, 0.55));
      const stp = top + R.range(14, Math.max(16, t * 0.45));
      island(P, sx, stp, sw, sw * R.range(0.5, 1.1), st === "cloud" ? "rock" : st, { sub: false, keep: false });
    }
  }
}
// 지상·동굴 구역의 세계 맨 아래는 늘 막혀 있게 (고치기 굴이 바닥을 뚫어 세계 밖으로 떨어지는 일이 없게)
function sealBottom(P) {
  if (P.kind === "sky") return;
  const { F } = P, LW = F.LW, d = F.d;
  for (let j = Math.floor((P.HP - 40) / Q); j < F.LH; j++) for (let i = 0, o = j * LW; i < LW; i++) d[o + i] < 4 && (d[o + i] = 4);
}
// 최종 장에서 떠 있는 아주 작은 바위 부스러기를 지운다 (파내기·깎기로 쪼개진 조각 등). 섬은 훨씬 크다
function specks(P, minPts = 20) {
  sealBottom(P);
  const { F } = P, LW = F.LW, LH = F.LH, d = F.d, n = d.length;
  const seen = scratch("SK", Uint8Array, n).fill(0), q = scratch("SQ", Int32Array, n);
  for (let s = 0; s < n; s++) {
    if (seen[s] || d[s] <= 0) continue;
    let h = 0, t = 0, border = false;
    q[t++] = s;
    seen[s] = 1;
    while (h < t) {
      const k = q[h++], j = (k / LW) | 0, i = k - j * LW;
      if (i === 0 || j === 0 || i === LW - 1 || j === LH - 1) border = true;
      if (i > 0 && !seen[k - 1] && d[k - 1] > 0) ((seen[k - 1] = 1), (q[t++] = k - 1));
      if (i < LW - 1 && !seen[k + 1] && d[k + 1] > 0) ((seen[k + 1] = 1), (q[t++] = k + 1));
      if (j > 0 && !seen[k - LW] && d[k - LW] > 0) ((seen[k - LW] = 1), (q[t++] = k - LW));
      if (j < LH - 1 && !seen[k + LW] && d[k + LW] > 0) ((seen[k + LW] = 1), (q[t++] = k + LW));
    }
    if (!border && t < minPts) for (let m = 0; m < t; m++) d[q[m]] = -2;
  }
}
// 작은 덩어리 지우기: 셀룰러 오토마타 뒤에도 남은 작은 공기 주머니·떠 있는 바위 조각
function prune(B, LW, LH, minAir, minRock, ja = 0, jb = LH - 1) {
  if (jb < ja) return;
  const n = B.length, seen = scratch("PS", Uint8Array, n).fill(0), q = scratch("PQ", Int32Array, (jb - ja + 1) * LW);
  const kA = ja * LW, kB = (jb + 1) * LW;
  for (let s = kA; s < kB; s++) {
    if (seen[s]) continue;
    const val = B[s];
    let h = 0, t = 0, border = false;
    q[t++] = s;
    seen[s] = 1;
    while (h < t) {
      const k = q[h++], j = (k / LW) | 0, i = k - j * LW;
      if (i === 0 || j <= ja || i === LW - 1 || j >= jb) border = true;
      if (i > 0 && !seen[k - 1] && B[k - 1] === val) ((seen[k - 1] = 1), (q[t++] = k - 1));
      if (i < LW - 1 && !seen[k + 1] && B[k + 1] === val) ((seen[k + 1] = 1), (q[t++] = k + 1));
      if (j > ja && !seen[k - LW] && B[k - LW] === val) ((seen[k - LW] = 1), (q[t++] = k - LW));
      if (j < jb && !seen[k + LW] && B[k + LW] === val) ((seen[k + LW] = 1), (q[t++] = k + LW));
    }
    if (val === 0 ? t < minAir : !border && t < minRock) for (let m = 0; m < t; m++) B[q[m]] = 1 - val;
  }
}

// 굴 파기: 점 목록을 따라 반지름이 바뀌는 둥근 굴 (바닥은 조금 평평하게)
function carveWormB(P, B, pts, r0, r1, flat = 0.82) {
  const { LW, LH, N } = P;
  const so = P.R() * 999;
  let s = 0;
  for (let k = 0; k < pts.length; k++) {
    const [px, py] = pts[k];
    if (k) {
      const ex = px - pts[k - 1][0], ey = py - pts[k - 1][1];
      s += Math.sqrt(ex * ex + ey * ey);
    }
    // 굵기: 긴 물결 + 짧은 물결 (좁아졌다 넓어지는 통로)
    const r = lerp(r0, r1, 0.5 + 0.5 * N.n1(s / 70 + so)) * (0.82 + 0.36 * (0.5 + 0.5 * N.n1(s / 23 + so + 41)));
    const rx = r * 1.18, ryU = r, ryD = r * flat;
    const i0 = Math.max(1, Math.floor((px - rx) / Q)), i1 = Math.min(LW - 2, Math.ceil((px + rx) / Q));
    const j0 = Math.max(1, Math.floor((py - ryU) / Q)), j1 = Math.min(LH - 2, Math.ceil((py + ryD) / Q));
    for (let j = j0; j <= j1; j++) {
      const dy = j * Q - py, ry = dy < 0 ? ryU : ryD;
      for (let i = i0; i <= i1; i++) {
        const dx = (i * Q - px) / rx, ddy = dy / ry;
        if (dx * dx + ddy * ddy < 1) B[j * LW + i] = 0;
      }
    }
  }
}
// 사행(蛇行) 길: 관성 있는 무작위 걸음이 목표 쪽으로 점점 끌려간다 → 직선·45° 대각선이 아닌 굽이치는 굴
// wig: 굽이 세기, wl: 굽이 길이(px)
function meander(P, ax, ay, bx, by, wig = 0.7, wl = 90, step = 10) {
  const { N, R } = P;
  const L0 = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) || 1;
  const so = R() * 700;
  let x = ax, y = ay, dx = (bx - ax) / L0, dy = (by - ay) / L0;
  // 처음 방향도 조금 비튼다
  const k0 = R.range(-0.6, 0.6);
  ((dx = dx - dy * k0), (dy = dy + ((bx - ax) / L0) * k0));
  let n0 = Math.sqrt(dx * dx + dy * dy);
  ((dx /= n0), (dy /= n0));
  let pts = [[x, y]];
  const maxS = Math.ceil((L0 * 2.2) / step) + 8;
  for (let k = 0; k < maxS; k++) {
    const tx = bx - x, ty = by - y, tl = Math.sqrt(tx * tx + ty * ty);
    if (tl < step * 1.6) break;
    const n = N.fbm1((k * step) / wl + so, 2);
    let nx = dx - dy * n * wig, ny = dy + dx * n * wig;
    // 처음엔 거의 제멋대로, 갈수록(그리고 목표가 가까울수록) 목표 쪽으로
    const prog = (k * step) / (L0 * 1.5);
    const pull = Math.min(0.7, 0.04 + 0.3 * prog + (tl < 120 ? 0.3 : 0));
    nx = nx * (1 - pull) + (tx / tl) * pull;
    ny = ny * (1 - pull) + (ty / tl) * pull;
    const nl = Math.sqrt(nx * nx + ny * ny) || 1;
    dx = nx / nl;
    dy = ny / nl;
    x += dx * step;
    y += dy * step;
    pts.push([x, y]);
  }
  pts.push([bx, by]);
  return resample(smoothPts(pts, 2));
}
function smoothPts(pts, it) {
  for (let r = 0; r < it; r++) {
    const q = [pts[0]];
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      q.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    q.push(pts[pts.length - 1]);
    pts = q;
  }
  return pts;
}
function resample(pts, gap = 4) {
  const out = [pts[0]];
  let acc = 0;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
    const seg = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    acc += seg;
    while (acc >= gap) {
      acc -= gap;
      const t = 1 - acc / (seg || 1);
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// 경유점들을 차례로 사행 길로 잇는다
function meanderVia(P, way, wig, wl) {
  const out = [];
  for (let k = 0; k < way.length - 1; k++) out.push(...meander(P, way[k][0], way[k][1], way[k + 1][0], way[k + 1][1], wig, wl));
  return out;
}

// ── 동굴 바위 지도 (1 = 바위) ─────────────────────────
// 8px 간격으로 잡음을 재고(빠르게) 4px 격자로 보간해 문턱값을 넘는지 본다
function caveRock(P, cp, limit) {
  const { LW, LH, N } = P;
  const LW8 = ((LW - 1) >> 1) + 1, LH8 = ((LH - 1) >> 1) + 1;
  const A8 = scratch("A8", Float32Array, LW8 * LH8).fill(-1);
  const ch = cp.cheese, sp = cp.spag, vt = cp.vert, pl = cp.pillars;
  const warp = cp.warp ?? 40;
  for (let j = 0; j < LH8; j++) {
    const y = j * 8;
    for (let i = 0; i < LW8; i++) {
      const x = i * 8;
      const lim = limit(x, y);
      if (lim <= -1) continue;
      const wx = warp * N.n2(x / 190 + 3.3, y / 190 + 1.7), wy = warp * 0.65 * N.n2(x / 190 + 8.1, y / 190 + 5.9);
      const X = x + wx, Y = y + wy;
      let air = -1;
      if (ch) {
        const c = N.fbm2(X / ch.wl, Y / (ch.wl * ch.aniso), 3);
        air = Math.max(air, (c - ch.thr) * 5);
      }
      if (sp) {
        const w = lerp(sp.w[0], sp.w[1], 0.5 + 0.5 * N.n2(x / 420 + 2.2, y / 420 + 6.6));
        const s = N.n2(X / sp.wl + 31.1, Y / (sp.wl * sp.aniso) + 17.3);
        air = Math.max(air, (w - Math.abs(s)) * 14);
      }
      if (vt) {
        const w = lerp(vt.w[0], vt.w[1], 0.5 + 0.5 * N.n2(x / 380 + 4.4, y / 380 + 9.9));
        const s = N.n2(X / (vt.wl * 0.32) + 51.5, Y / vt.wl + 23.3);
        air = Math.max(air, (w - Math.abs(s)) * 12);
      }
      if (air > 0 && pl) {
        const p = N.n2(x / pl.wl + 61.1, y / (pl.wl * 3.4) + 37.7);
        if (p > pl.thr) air = Math.min(air, (pl.thr - p) * 6);
      }
      A8[j * LW8 + i] = air + lim;
    }
  }
  const B = scratch("B", Uint8Array, LW * LH);
  for (let j = 0; j < LH; j++) {
    const j8 = j >> 1, fj = (j & 1) * 0.5, j8b = Math.min(LH8 - 1, j8 + 1);
    for (let i = 0; i < LW; i++) {
      const i8 = i >> 1, fi = (i & 1) * 0.5, i8b = Math.min(LW8 - 1, i8 + 1);
      const a = A8[j8 * LW8 + i8], b = A8[j8 * LW8 + i8b], c = A8[j8b * LW8 + i8], e = A8[j8b * LW8 + i8b];
      const v = (a + (b - a) * fi) * (1 - fj) + (c + (e - c) * fi) * fj;
      B[j * LW + i] = v > 0 ? 0 : 1;
    }
  }
  return B;
}
// 공기가 있는 줄 범위 (위아래 여유 포함) — 그 바깥은 전부 바위라 계산할 필요가 없다
function airRows(B, LW, LH, pad = 6) {
  let a = -1, b = -1;
  for (let j = 0; j < LH; j++) {
    const o = j * LW;
    for (let i = 0; i < LW; i++)
      if (!B[o + i]) {
        a < 0 && (a = j);
        b = j;
        break;
      }
  }
  return a < 0 ? [0, -1] : [Math.max(0, a - pad), Math.min(LH - 1, b + pad)];
}
// 셀룰러 오토마타: 3×3 안 바위가 5칸 이상이면 바위 (잡티 제거·둥글게)
function caSmooth(B, LW, LH, iters, ja = 0, jb = LH - 1) {
  let a = B, b = scratch("CA", Uint8Array, B.length);
  b.set(a);
  const row = new Uint8Array(LW);
  const j0 = Math.max(1, ja), j1 = Math.min(LH - 2, jb);
  for (let it = 0; it < iters; it++) {
    for (let j = j0; j <= j1; j++) {
      const o = j * LW;
      // 세로 3칸 합
      for (let i = 0; i < LW; i++) row[i] = a[o - LW + i] + a[o + i] + a[o + LW + i];
      for (let i = 1; i < LW - 1; i++) b[o + i] = row[i - 1] + row[i] + row[i + 1] >= 5 ? 1 : 0;
    }
    const t = a;
    a = b;
    b = t;
  }
  if (a !== B) B.set(a);
}
// 바위 지도 → 부드러운 장 (흐림 두 번, px 단위 ±4). ja..jb 바깥 줄은 바위(+4)
function blurToField(B, LW, LH, ja = 0, jb = LH - 1) {
  const n = B.length, f = scratch("BF", Float32Array, n).fill(4);
  if (jb < ja) return f;
  const r0 = Math.max(0, ja - 2), r1 = Math.min(LH - 1, jb + 2), RN = r1 - r0 + 1;
  const a = scratch("BA", Float32Array, RN * LW), g = scratch("BG", Float32Array, RN * LW);
  for (let j = 0; j < RN; j++) for (let i = 0, o = (r0 + j) * LW, p = j * LW; i < LW; i++) a[p + i] = B[o + i] ? 1 : -1;
  const T = 1 / 3;
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < RN; j++) {
      const o = j * LW;
      g[o] = (a[o] * 2 + a[o + 1]) * T;
      for (let i = 1; i < LW - 1; i++) g[o + i] = (a[o + i - 1] + a[o + i] + a[o + i + 1]) * T;
      g[o + LW - 1] = (a[o + LW - 2] + a[o + LW - 1] * 2) * T;
    }
    for (let j = 0; j < RN; j++) {
      const o = j * LW, up = j > 0 ? o - LW : -1, dn = j < RN - 1 ? o + LW : -1;
      for (let i = 0; i < LW; i++) a[o + i] = ((up < 0 ? 1 : g[up + i]) + g[o + i] + (dn < 0 ? 1 : g[dn + i])) * T;
    }
  }
  for (let j = 0; j < RN; j++) for (let i = 0, o = (r0 + j) * LW, p = j * LW; i < LW; i++) f[o + i] = a[p + i] * 4;
  return f;
}

// ── 지상 ─────────────────────────────────────────────
function surfaceHeights(P) {
  const { prof: S, LW, WP, N, R } = P;
  const h = new Float64Array(LW), ro = new Float64Array(LW);
  const base = FLOOR * TS;
  const M = S.macro, Me = S.meso, Wp = S.warp, Ro = S.rough;
  const flip = R() < 0.5;
  for (let i = 0; i < LW; i++) {
    const x = i * Q;
    const xw = x + Wp.amp * N.fbm1(x / Wp.wl + 11.3, 2);
    ro[i] = lerp(Ro.lo, Ro.hi, smooth(0.5 + 0.65 * N.fbm1(x / Ro.wl + 71.7, 2)));
    let mac = N.fbm1(xw / M.wl + 3.1, 3);
    if (M.ridge > 0) mac = lerp(mac, 2 * N.ridge1(xw / M.wl + 41.9, 3) - 1, M.ridge);
    let e = M.amp * mac + Me.amp * ro[i] * N.fbm1(xw / Me.wl + 19.7, 3);
    if (S.dunes) {
      // 사구: 바람받이는 길고 완만하게, 미끄럼면은 짧고 가파르게 (안식각은 풍화가 정한다)
      const D = S.dunes, xd = flip ? WP - x : x;
      const ph = xd / D.wl + 0.4 * N.fbm1(xd / (D.wl * 2.6) + 5.5, 2);
      const k = Math.floor(ph), t = ph - k;
      const a = D.asym;
      const p = t < a ? smooth(t / a) : 1 - smooth((t - a) / (1 - a));
      const amp = D.amp * (0.4 + 0.8 * (0.5 + 0.5 * N.n1(k * 0.61 + 9.3)));
      e += amp * (p - 0.5) * ro[i];
    }
    h[i] = base - e;
  }
  // 단층: 한쪽이 솟거나 꺼진 급경사, 또는 솟은 땅덩이(탁상지)·꺼진 땅(지구대)
  const F0 = S.faults;
  for (let k = R.int(F0.n[0], F0.n[1]); k > 0; k--) {
    const xf = R.range(0.14, 0.82) * WP;
    const hf = R.range(F0.h[0], F0.h[1]) * (R() < 0.5 ? 1 : -1);
    const wf = R.range(F0.w[0], F0.w[1]);
    const block = R() < 0.6 ? R.range(180, 560) : 0;
    const wf2 = R.range(F0.w[0], F0.w[1]) * R.range(1, 2.5);
    for (let i = 0; i < LW; i++) {
      const x = i * Q;
      let s = smooth((x - xf) / wf + 0.5);
      if (block) s *= 1 - smooth((x - xf - block) / wf2 + 0.5);
      h[i] -= hf * s;
    }
  }
  // 산괴: 크게 솟은 산덩어리 (산악 지역). 양쪽 비탈 길이가 다르고, 능선 잡음으로 봉우리가 제각각
  const MS = S.massif;
  if (MS)
    for (let k = R.int(1, 2), first = 1; k > 0; k--, first = 0) {
      // 첫 산은 크게, 밑으로 걸어 지나가는 굴이 난다. ▲ 문은 산이 아니라 높은 하늘섬에 있다
      const lim = Math.min(WP, P.arenaFrom);
      let xm = R.range(0.22, 0.78) * lim;
      if (P.upX >= 0) for (let t = 0; t < 30 && Math.abs(xm - P.upX) < 1500; t++) xm = R.range(0.12, 0.88) * lim;
      // 낮고 넓게: 가파른 봉우리 대신 꼭대기가 넓고 평평한 산 (단을 밟고 오른다)
      const hm = (first ? MS.h[1] * R.range(0.9, 1.05) : R.range(MS.h[0], MS.h[1])) * 0.5, wm = R.range(MS.w[0], MS.w[1]) * 0.9;
      first && (P.mtn = { a: Math.max(160, xm - wm * 0.62), b: Math.min(lim - 160, xm + wm * 0.62) });
      const as = R.range(0.55, 1.45), so = R() * 99;
      for (let i = 0; i < LW; i++) {
        const x = i * Q;
        const t = (x - xm) / ((wm * (x < xm ? as : 2 - as)) / 2);
        if (t <= -1 || t >= 1) continue;
        const q = 1 - t * t;
        // 윗부분은 평평한 고원, 비탈은 완만한 S자. 큰 기복만 (뾰족한 능선 잡음 없음)
        const p = smooth(Math.min(1, q * 1.1));
        h[i] -= hm * p * (0.85 + 0.15 * N.fbm1(x / 900 + so, 2));
      }
    }
  // 협곡·골짜기 (양쪽 비탈이 다른 비대칭)
  const V = S.valleys;
  for (let k = R.int(V.n[0], V.n[1]); k > 0; k--) {
    const xv = R.range(0.15, 0.8) * WP, dv = R.range(V.d[0], V.d[1]), wv = R.range(V.w[0], V.w[1]);
    const as = R.range(0.55, 1.45);
    for (let i = 0; i < LW; i++) {
      const x = i * Q;
      const t = (x - xv) / (wv * (x < xv ? as : 2 - as));
      if (t <= -1 || t >= 1) continue;
      const q = 1 - Math.abs(t);
      h[i] += dv * q * Math.sqrt(q) * (0.6 + 0.4 * q);
    }
  }
  // 풍화(열 침식): 비탈이 안식각보다 가파르면 위의 흙이 아래로 흘러내린다. 단단한 지층은 버틴다(절벽이 남는다)
  const E = S.erosion;
  const hardAt = (x, y) => {
    const v = N.n2(x / 900 + 9.1, y / E.layerWl + 3.7) * 0.7 + N.n2(x / 300 + 1.3, y / (E.layerWl * 0.5)) * 0.3;
    return E.layerAmt * smooth((v + 0.05) / 0.5);
  };
  const tal = new Float64Array(LW);
  for (let it = 0; it < E.iters; it++) {
    if (it % 10 === 0)
      for (let i = 0; i < LW; i++) tal[i] = Q * lerp(E.soft, E.hard, hardAt(i * Q, h[i]));
    const fw = it & 1;
    for (let k = 0; k < LW - 1; k++) {
      const i = fw ? k : LW - 2 - k;
      const d = h[i + 1] - h[i];
      const top = d > 0 ? i : i + 1;
      const ad = d > 0 ? d : -d, lim = tal[top];
      if (ad > lim) {
        const m = (ad - lim) * 0.25;
        if (d > 0) ((h[i] += m), (h[i + 1] -= m));
        else ((h[i] -= m), (h[i + 1] += m));
      }
    }
  }
  // 물길 침식: 위에서 모인 물이 많을수록 비탈 아래쪽을 더 깎는다 → 오목한 비탈, 넓은 골짜기 바닥
  const St = S.stream;
  if (St && St.k > 0) {
    const A = new Float64Array(LW), D = new Int32Array(LW), ord = new Int32Array(LW);
    for (let it = 0; it < St.iters; it++) {
      for (let i = 0; i < LW; i++) ord[i] = i;
      ord.sort((a, b) => h[a] - h[b]);
      A.fill(1);
      for (let q = 0; q < LW; q++) {
        const i = ord[q];
        const l = i > 0 ? h[i - 1] : -1e9, r = i < LW - 1 ? h[i + 1] : -1e9;
        let dn = -1;
        if (l > h[i] || r > h[i]) dn = l > r ? i - 1 : i + 1;
        D[i] = dn;
        dn >= 0 && (A[dn] += A[i]);
      }
      for (let i = 0; i < LW; i++) {
        const dn = D[i];
        if (dn < 0) continue;
        const drop = h[dn] - h[i];
        const ero = Math.min(drop * 0.45, St.k * Math.sqrt(A[i] / 25) * (drop / Q) * 2);
        h[i] += ero;
      }
    }
  }
  // 잔물결
  const Mi = S.micro;
  for (let i = 0; i < LW; i++) h[i] += Mi.amp * ro[i] * N.fbm1((i * Q) / Mi.wl + 91.3, 2);
  // 높이 범위 (넘치면 눌러 담는다)
  const top = S.band[0] * TS, bot = S.band[1] * TS;
  for (let i = 0; i < LW; i++) {
    if (h[i] < top + 48) h[i] = top + 48 - (top + 48 - h[i]) * 0.35;
    if (h[i] > bot - 32) h[i] = bot - 32 + (h[i] - (bot - 32)) * 0.35;
  }
  // 계단밭(단구): 완만한 비탈은 평평한 단 + 짧고 가파른 턱으로 → 경사면 대신 평지와 단이 이어진 픽셀 게임 지형
  // 먼저 비탈을 45° 이하로 (블록 계단 한 칸씩 걸어 오른다), 완만한 곳만 단으로 다듬는다
  P.ro = ro;
  return h;
}
// 비탈 기울기 제한: 너무 가파른 곳은 아래쪽(골짜기·산자락)을 채워 넓힌다 → 산은 높이를 지키고 자락이 길어진다
// pins: [[x0, x1, y]] 높이를 지킬 자리 (구역 끝 출구). 그 둘레의 산은 깎는다
// s: 칸마다 허용 기울기 (배열) — 완만한 자락과 가파른 턱이 섞여 곧은 삼각형이 되지 않는다
function limitSlope(h, s, pins = []) {
  const n = h.length;
  for (const [x0, x1, y] of pins) {
    // 고정 자리에서 바깥으로 기울기를 쌓아 가며 그보다 높은 곳은 깎는다
    const i0 = Math.round(x0 / Q), i1 = Math.round(x1 / Q);
    let lim = y;
    for (let i = i0 - 1; i >= 0; i--) ((lim -= s[i] * Q), (h[i] = Math.max(h[i], lim)));
    lim = y;
    for (let i = i1 + 1; i < n; i++) ((lim -= s[i] * Q), (h[i] = Math.max(h[i], lim)));
  }
  for (let i = 1; i < n; i++) h[i] > h[i - 1] + s[i] * Q && (h[i] = h[i - 1] + s[i] * Q);
  for (let i = n - 2; i >= 0; i--) h[i] > h[i + 1] + s[i] * Q && (h[i] = h[i + 1] + s[i] * Q);
}
// 계단밭(단구): 비탈을 평평한 단 + 짧은 턱으로 (턱 높이 TR은 1단 점프로 오른다)
function terrace(h, TR, skip = null) {
  for (let i = 0; i < h.length; i++) {
    if (skip && skip[i]) continue;
    const k = Math.floor(h[i] / TR), f = h[i] / TR - k;
    h[i] = (k + smooth(smooth(f))) * TR;
  }
}
function flattenH(h, xa, xb, y, feather) {
  for (let i = 0; i < h.length; i++) {
    const x = i * Q;
    if (x >= xa && x <= xb) h[i] = y;
    else if (x > xa - feather && x < xa) h[i] = lerp(h[i], y, smooth((x - (xa - feather)) / feather));
    else if (x > xb && x < xb + feather) h[i] = lerp(h[i], y, smooth(1 - (x - xb) / feather));
  }
}
function buildGround(P) {
  const { prof: S, LW, LH, WP, N, R, F, arenaFrom } = P;
  const bp = P.bp;
  const h = bp ? bpSurface(P, bp) : sectionSurface(P);
  const base = FLOOR * TS;
  // 구역 양 끝: 출구 자리(평평, 칸 경계) → 자연 지형으로 부드럽게
  flattenH(h, 0, 132, base, 300);
  flattenH(h, arenaFrom < WP ? arenaFrom - 40 : WP - 132, WP, base, arenaFrom < WP ? 260 : 300);
  const slope = Float64Array.from({ length: LW }, (_, i) => clamp(0.5 + 0.42 * N.fbm1((i * Q) / 520 + 33.3, 2), 0.22, 0.85));
  // 평평한 자리(함정·웅덩이·쉼터): 분지 바닥이나 완만한 언덕 위를 칸 경계 높이로 고른다
  const pads = [];
  if (bp)
    for (const q of bp.pads ?? []) {
      let sum = 0, n = 0;
      for (let x = q.xa; x <= q.xb; x += Q) ((sum += h[Math.round(x / Q)]), n++);
      const y = Math.round(sum / n / TS) * TS;
      flattenH(h, q.xa, q.xb, y, 56);
      pads.push({ xa: q.xa, xb: q.xb, y, basin: false });
    }
  const nPads = bp ? 0 : R.int(S.pads.n[0], S.pads.n[1]);
  for (let k = 0, tries = 0; k < nPads && tries < 80; tries++) {
    const wT = R.int(S.pads.w[0], S.pads.w[1]);
    const xa = Math.round(R.range(260, Math.min(WP, arenaFrom) - 300 - wT * TS) / TS) * TS;
    const xb = xa + wT * TS;
    if (pads.some((p) => xa < p.xb + 160 && xb > p.xa - 160)) continue;
    if (P.upX >= 0 && Math.abs((xa + xb) / 2 - P.upX) < 220) continue;
    let lo = 1e9, hi = -1e9, sum = 0, n = 0;
    for (let x = xa; x <= xb; x += Q) {
      const v = h[x / Q];
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
      sum += v;
      n++;
    }
    if (hi - lo > 40) continue;
    // 분지라면 아래로(물이 고이는 높이), 아니면 평균 높이
    const basin = h[xa / Q - 8] < hi - 4 && h[xb / Q + 8] < hi - 4;
    const yP = Math.round((basin ? hi : sum / n) / TS) * TS;
    flattenH(h, xa, xb, yP, 56);
    pads.push({ xa, xb, y: yP, basin });
    k++;
  }
  P.pads = pads;
  {
    const pins = [[0, 132, base], [arenaFrom < WP ? arenaFrom - 40 : WP - 132, WP, base], ...pads.map((p) => [p.xa, p.xb, p.y])];
    limitSlope(h, slope, pins);
    const skip = new Uint8Array(LW);
    for (const p of pads) for (let i = Math.floor(p.xa / Q); i <= Math.ceil(p.xb / Q) && i < LW; i++) skip[i] = 1;
    terraceVar(h, rng(P.seed ^ 0x7e77a), skip);
  }
  P.h = h;
  const hAt = (x) => {
    const u = x / Q;
    if (u <= 0) return h[0];
    if (u >= LW - 1) return h[LW - 1];
    const i = u | 0, f = u - i;
    return h[i] + (h[i + 1] - h[i]) * f;
  };
  const Fs = F.d;
  for (let j = 0; j < LH; j++) {
    const y = j * Q;
    for (let i = 0; i < LW; i++) {
      const f = y - h[i];
      Fs[j * LW + i] = f > 12 ? 12 : f < -12 ? -12 : f;
    }
  }
  // 땅속 (8px 블록 칸)
  const bottom = (P.Ft - 5) * TS, lim = Math.min(WP, arenaFrom);
  const C = cellsOf(P);
  const surfRow = (cx) => Math.floor(hAt(clamp(cx, 0, C.NX - 1) * BLK + 4) / BLK);
  // 골짜기 연못: 둑은 한 칸씩 (걸어서 나온다)
  for (const pd of P.ponds ?? []) {
    const cx = Math.round(pd.x / BLK), hw = Math.max(6, Math.round(pd.w / BLK / 2));
    const rows = [];
    for (let x = cx - hw - 2; x <= cx + hw + 2; x++) rows.push(surfRow(x));
    const sr = rows.slice().sort((a, b) => a - b)[rows.length >> 1];
    if (Math.max(...rows) - Math.min(...rows) > (P.bp ? 5 : 0)) continue;
    for (let x = cx - hw - 2; x <= cx + hw + 2; x++) {
      const r0 = surfRow(x);
      for (let y = r0; y < sr; y++) C.cell[y * C.NX + x] = -1;
      for (let y = sr; y < r0; y++) C.cell[y * C.NX + x] = 1;
    }
    const d = R.int(3, 5);
    for (let x = cx - hw; x <= cx + hw; x++) {
      const e = Math.min(x - (cx - hw), cx + hw - x), dd = Math.min(d, 1 + e);
      for (let y = sr; y < sr + dd; y++) C.cell[y * C.NX + x] = -1;
      P.specReq.push({ x0: x, y0: sr, x1: x + 1, y1: sr + dd, k: "water" });
    }
  }
  const NXl = Math.floor(lim / BLK) - 4, bot = Math.floor((bottom - 24) / BLK) & ~1;
  const toC = (x) => Math.round(x / BLK);
  // 지표 역할 자리 (보물·전투): 그 자리 지면 위
  for (const q of bp?.spots ?? []) {
    let top = 1e9;
    for (let x = q.xa; x <= q.xb; x += 16) top = Math.min(top, hAt(x));
    (P.roomTags ??= []).push({ x0: q.xa, x1: q.xb, y0: top - 200, y1: hAt((q.xa + q.xb) / 2) + 24, role: q.role });
  }
  const AR = ARCHI[P.z.id];
  if (AR) AR(kit(P, C), { stage: "under", surfRow, NXl });
  else if (bp?.dungeon) {
    const dg = dungeonWorld(P, C, bp.dungeon);
    caveWorld(P, C, {
      y0: base / BLK + 18,
      y1: bot,
      gap: [70, 84],
      lim: NXl,
      topAt: (cx) => (cx > NXl ? 1e9 : surfRow(cx) + 16),
      surfRow,
      design: bp,
      extern: dg,
      noClimb: bp.noClimb ?? 0,
      fill: bp.caveFill ?? null,
      mouths: (bp.mouths ?? []).map((m) => ({ x: toC(m.x), y: surfRow(toC(m.x)), to: m.to })),
      sinks: (bp.sinks ?? []).map((m) => ({ x: toC(m.x), y: surfRow(toC(m.x)) })),
      deepX: -1,
      shafts: 0,
      noGrotto: 1,
    });
  } else caveWorld(P, C, {
    y0: base / BLK + 18,
    y1: bot,
    gap: [70, 84],
    lim: NXl,
    maxGrand: 2,
    topAt: (cx) => (cx > NXl ? 1e9 : surfRow(cx) + 16),
    surfRow,
    mouths: (P.mouthX ?? []).filter((x) => x > 320 && x < lim - 320).map((x) => ({ x: toC(x), y: surfRow(toC(x)) })),
    sinks: (P.sinks ?? []).filter((x) => x > 320 && x < lim - 320).map((x) => ({ x: toC(x), y: surfRow(toC(x)) })),
    deepX: P.downX >= 0 ? toC(clamp(P.downX, 300, lim - 300)) : -1,
    shafts: R.int(2, 3),
  });
  cleanCells(C, Math.max(0, Math.min(...Array.from(h)) / BLK - 2) | 0);
  writeCells(P, C);
  applySpecReq(P);
  if (P.deep) flatFloor(P, P.deep.x - 40, P.deep.x + 40, P.deep.y, 12, 30, 18);
  // 하늘: 산만 한 하늘섬(▲ 문) + 큰 섬 + 디딤돌 길 (땅 위 구조물은 두지 않는다)
  // 땅 위를 새로 지은 구역(지상 모드 하늘섬)은 옛 설계의 하늘 장식(디딤돌 줄 등)을 쓰지 않는다
  bp?.feats && !(AR && GROUND_NEW.has(P.z.id)) && bpFeats(P, hAt, bp.feats);
  if (AR) {
    // 지역 설계 코드: 땅 위 하늘도 (지표·구조물 위에 짓는다)
    const C2 = cellsOf(P);
    AR(kit(P, C2), { stage: "sky", surfRow: (cx) => Math.floor(hAt(clamp(cx, 0, C2.NX - 1) * BLK + 4) / BLK) });
    writeCells(P, C2);
    applySpecReq(P);
  } else skyWorld(P, hAt, S.islands.style, bp?.sky ? { design: bp.sky } : {});
  P.ugTop = Math.max(UG_TOP, Math.ceil(Math.max(...Array.from(h)) / TS) + 3);
}
// ── 지상 지형 덩어리 (8px 블록 사각형으로 짓는다, 재질은 그림에만 쓰인다) ──
function featKit(P, R) {
  const th = P.z.reg?.theme ?? "plains", id = P.z.reg?.bgId ?? "";
  const sn = (v) => Math.round(v / BLK) * BLK;
  const rs = (x0, y0, x1, y1) => (px, py) => Math.min(px - x0, x1 - px, py - y0, y1 - py) + 0.5;
  const add = (x0, y0, x1, y1, m) => {
    [x0, y0, x1, y1] = [sn(x0), sn(y0), sn(x1), sn(y1)];
    addShape(P, x0 - 4, y0 - 4, x1 + 4, y1 + 4, rs(x0, y0, x1, y1));
    m && P.mats.push({ x0, y0, x1, y1, m });
  };
  const cut = (x0, y0, x1, y1, wall) => {
    [x0, y0, x1, y1] = [sn(x0), sn(y0), sn(x1), sn(y1)];
    cutShape(P, x0 - 4, y0 - 4, x1 + 4, y1 + 4, rs(x0, y0, x1, y1));
    wall && P.walls.push({ x0, y0, x1, y1, m: wall, keep: 1 });
  };
  const back = (x0, y0, x1, y1, m) => P.walls.push({ x0: sn(x0), y0: sn(y0), x1: sn(x1), y1: sn(y1), m, keep: 1 });
  const W = {
    tree: th === "desert" || th === "fortress" ? 0 : th === "forest" ? 4 : 3,
    arch: th === "forest" ? 1 : th === "desert" ? 3 : 2,
    ruin: th === "fortress" ? 3 : th === "forest" ? 1 : 2,
    shroom: id === "rotmarsh" ? 4 : th === "forest" ? 2 : 0,
    log: th === "desert" || th === "snow" ? 0 : 2,
    pillars: th === "forest" ? 1 : 2,
    pond: th === "fortress" ? 0 : th === "snow" ? 3 : th === "desert" ? 1 : 2,
    watch: th === "forest" || th === "snow" || th === "desert" ? 1 : 2,
  };
  const FW = { tree: 520, arch: 520, ruin: 260, shroom: 460, log: 380, pillars: 360, pond: 360, watch: 260 };
  const pine = th === "snow";
  const builders = {
    // 거대 나무: 줄기 + 한쪽에 엇갈린 가지 사다리 + 넓은 잎 지붕(위를 걸어 다닌다), 반은 줄기 속이 비어 안에서도 오른다
    tree(x, yb, o = {}) {
      const tw = sn(o.tw ?? R.range(56, 88)), H = sn(o.H ?? R.range(300, 560)), cw = sn(o.cw ?? R.range(320, 480)), ct = sn(o.ct ?? R.range(72, 88));
      const yT = yb - H - ct + 40;
      add(x - tw / 2, yT + 24, x + tw / 2, yb + 16, "wood");
      add(x - tw / 2 - 16, yb - 16, x + tw / 2 + 16, yb + 16, "wood");
      add(x - tw / 2 - 32, yb - 8, x + tw / 2 + 32, yb + 16, "wood");
      // 잎 지붕
      if (pine) {
        add(x - cw / 2, yT + ct - 40, x + cw / 2, yT + ct, "leaf");
        add(x - cw * 0.36, yT + ct - 80, x + cw * 0.36, yT + ct - 40, "leaf");
        add(x - cw * 0.2, yT + ct - 120, x + cw * 0.2, yT + ct - 80, "leaf");
      } else {
        add(x - cw * 0.3, yT, x + cw * 0.3, yT + 24, "leaf");
        add(x - cw / 2, yT + 24, x + cw / 2, yT + ct - 24, "leaf");
        add(x - cw * 0.38, yT + ct - 24, x + cw * 0.38, yT + ct, "leaf");
      }
      // 가지 사다리 (한쪽, 80px마다, 길고 짧게 번갈아) — 맨 위 가지는 잎 지붕 끝 너머까지
      const side = o.side ?? (R() < 0.5 ? -1 : 1);
      const yTop = yT + ct + 16;
      let k = 0;
      // 안쪽 가지(줄기에 붙음)와 바깥 가지(떨어져 잎 뭉치)가 번갈아 — 한 가지가 바로 위 가지 밑에 갇히지 않게
      for (let y = yb - 72; y > yTop + 40; y -= 72, k++) {
        const e = x + side * (tw / 2), a = k % 2 ? e + side * 104 : e, b = k % 2 ? e + side * 184 : e + side * 80;
        spec(P, Math.min(a, b), y, Math.max(a, b), y + 8, "plank");
        k % 2 && add(Math.min(b, b - side * 40), y - 16, Math.max(b, b - side * 40), y, "leaf");
      }
      {
        const a = x + side * (tw / 2), b = x + side * (cw / 2 + 48);
        spec(P, Math.min(a, b), yTop, Math.max(a, b), yTop + 8, "plank");
      }
      // 밑동은 양쪽으로 뚫린 굴 (땅 위를 걸어서 지나간다)
      cut(x - tw / 2 - 40, yb - 48, x + tw / 2 + 40, yb, "wood");
      // 속 빈 줄기: 엇갈린 발판 → 잎 지붕 위로 나온다
      if ((o.hollow ?? R() < 0.55) && tw >= 64) {
        const hw = o.H ? Math.min(32, tw / 2 - 16) : 20, pw = o.H ? hw - 8 : 20;
        cut(x - hw, yT - 8, x + hw, yb, "wood");
        for (let y = yb - 56, j = 0; y > yT + 16; y -= 56, j++) {
          // (손 설계 나무: 왼 발판은 16px — 오른쪽에서 뛰어 오를 때 머리가 걸리지 않게. x는 16의 배수 + 8)
          const l = j % 2 ? x - hw : x + hw - pw, w = j % 2 && o.H ? 16 : pw;
          spec(P, l, y, l + w, y + 8, "plank");
        }
      }
      return { x0: x - cw / 2, x1: x + cw / 2, top: pine ? yT + ct - 120 : yT };
    },
    // 바위 아치: 두 기둥 + 위 다리, 바깥쪽 계단으로 오른다 (o.m: 재질 — 숲은 뿌리 아치)
    arch(x, yb, o = {}) {
      const pw = sn(o.pw ?? R.range(56, 96)), span = sn(o.span ?? R.range(160, 320)), ah = sn(o.ah ?? R.range(120, 220)), tt = sn(o.tt ?? R.range(40, 64)), m = o.m;
      const L = x - span / 2 - pw, Rr = x + span / 2 + pw, top = yb - ah - tt;
      add(L, top, x - span / 2, yb + 16, m);
      add(x + span / 2, top, Rr, yb + 16, m);
      add(L, top, Rr, yb - ah, m);
      // 둥근 맛: 안쪽 모서리 계단
      for (let k = 1; k <= 3; k++) {
        add(x - span / 2, yb - ah, x - span / 2 + 8 * (4 - k) * 2, yb - ah + 8 * k, m);
        add(x + span / 2 - 8 * (4 - k) * 2, yb - ah, x + span / 2, yb - ah + 8 * k, m);
      }
      // 바깥 계단 (한쪽 또는 양쪽)
      const n = Math.ceil((ah + tt) / 64);
      for (const sd of o.steps ?? (R() < 0.5 ? [-1] : [-1, 1]))
        for (let i = 1; i < n; i++) {
          const ex = sd < 0 ? L : Rr, w = 40 * i;
          add(Math.min(ex, ex + sd * w), top + 64 * i, Math.max(ex, ex + sd * w), yb + 16, m);
        }
      o.moss && add(L + 8, top - 8, Rr - 8, top, "leaf");
      return { x0: L, x1: Rr, top };
    },
    // 쓰러진 거목 다리: 골짜기를 가로지르는 속 빈 통나무 — 위(껍질 위)·속(굴)·아래(골짜기 바닥) 세 길
    //   o.x0·o.x1: 양 끝, yb: 속 바닥 높이
    bridge(x, yb, o) {
      const x0 = sn(o.x0), x1 = sn(o.x1), T = 104;
      add(x0, yb - T + 16, x1, yb + 16, "wood");
      cut(x0 - 8, yb - T + 40, x1 + 8, yb, "wood");
      add(x0 + 40, yb - T + 8, x0 + 40 + sn((x1 - x0) * 0.3), yb - T + 16, "leaf");
      add(x1 - 40 - sn((x1 - x0) * 0.25), yb - T + 8, x1 - 40, yb - T + 16, "leaf");
      // 양 끝 디딤 (땅에서 한 번 뛰어 속으로) — 통나무 밑은 비탈이 지나간다
      for (const [e, sd] of o.ground != null ? [[x0, -1], [x1, 1]] : []) {
        const g = o.ground, mid = sn((g + yb + 40) / 2);
        add(Math.min(e, e + sd * 88), yb + 40, Math.max(e, e + sd * 88), g + 16, "wood");
        add(Math.min(e + sd * 88, e + sd * 176), mid, Math.max(e + sd * 88, e + sd * 176), g + 16, "wood");
      }
      // 껍질에 난 구멍: 속에서 위로 올라오는 곳 / 아래로 떨어지는 곳
      for (const u of o.holes ?? []) cut(x0 + (x1 - x0) * u - 24, yb - T + 8, x0 + (x1 - x0) * u + 24, yb - T + 48);
      for (const u of o.drops ?? []) cut(x0 + (x1 - x0) * u - 24, yb - 8, x0 + (x1 - x0) * u + 24, yb + 24);
      // 바닥 구멍 (절대 x): 골짜기 비탈이 바로 밑이라 아래에서 뛰어 올라온다
      for (const hx of o.dropX ?? []) cut(hx - 32, yb - 8, hx + 32, yb + 24);
      return { x0, x1, top: yb - T + 8 };
    },
    // 거대 그루터기: 속이 빈 방 — 옆 구멍으로 들어가 안쪽 버섯 선반을 밟고 윗면 테두리로 나온다
    stump(x, yb, o = {}) {
      const w = sn(o.w ?? 320), H = sn(o.H ?? 240), L = x - w / 2, Rr = x + w / 2, wl = 32, sd = o.side ?? -1;
      add(L, yb - H, Rr, yb + 16, "wood");
      add(L - 24, yb - 40, Rr + 24, yb + 16, "wood");
      cut(L + wl, yb - H - 8, Rr - wl, yb, "wood");
      // 옆 구멍 (o.side 쪽) + 반대쪽 작은 창
      sd < 0 ? cut(L - 32, yb - 56, L + wl, yb) : cut(Rr - wl, yb - 56, Rr + 32, yb);
      // 안쪽 선반 (엇갈려 72px마다)
      const sw = Math.max(72, sn((w - 2 * wl - 64) / 2));
      for (let y = yb - 72, j = 0; y > yb - H + 24; y -= 72, j++) {
        const a = j % 2 ? L + wl : Rr - wl - sw;
        add(a, y, a + sw, y + 8, "cap");
      }
      // 윗면: 들쭉날쭉 테두리
      for (let xx = L; xx < Rr; xx += 48) (xx - L) % 96 === 0 && cut(xx, yb - H - 8, xx + 24, yb - H + 16);
      return { x0: L, x1: Rr, top: yb - H };
    },
    // 폐허 탑: 벽돌 벽, 층마다 바닥(구멍이 번갈아), 아래 문, 창, 부서진 윗면
    ruin(x, yb) {
      const w = sn(R.range(128, 184)), H = sn(R.range(240, 420)), L = x - w / 2, Rr = x + w / 2;
      add(L, yb - H, Rr, yb + 16, "brick");
      cut(L + 16, yb - H - 8, Rr - 16, yb, "brick");
      cut(L - 8, yb - 48, L + 16, yb);
      cut(Rr - 16, yb - 48, Rr + 8, yb);
      let j = 0;
      for (let y = yb - 88; y > yb - H + 40; y -= 88, j++) {
        if (j % 2) spec(P, L + 16, y, Rr - 16 - 56, y + 8, "plank");
        else spec(P, L + 16 + 56, y, Rr - 16, y + 8, "plank");
        // 창
        R() < 0.6 && cut(j % 2 ? L - 8 : Rr - 16, y - 56, j % 2 ? L + 16 : Rr + 8, y - 24);
      }
      // 맨 위 바닥(지붕) + 성가퀴, 한쪽 모서리는 무너짐
      const yR = yb - H + 16;
      add(L + 16, yR, Rr - 16, yR + 16, "brick");
      cut(x - 24, yR - 8, x + 24, yR + 24);
      for (let xx = L; xx < Rr - 8; xx += 32) cut(xx + 16, yb - H - 8, xx + 32, yb - H + 16);
      const bs = R() < 0.5 ? L : Rr - 48;
      cut(bs, yb - H - 8, bs + 48, yb - H + 40);
      return { x0: L, x1: Rr, top: yb - H };
    },
    // 거대 버섯: 줄기 + 둥근 지붕(계단형), 작은 버섯 발판들로 오른다
    shroom(x, yb, o = {}) {
      const sw = sn(R.range(32, 48)), H = sn(o.H ?? R.range(180, 300)), cw = sn(o.cw ?? R.range(200, 320)), yc = yb - H;
      back(x - sw / 2, yc + 24, x + sw / 2, yb, "stem");
      add(x - cw / 2, yc, x + cw / 2, yc + 24, "cap");
      add(x - cw / 2 + 24, yc - 16, x + cw / 2 - 24, yc, "cap");
      add(x - cw / 2 + 56, yc - 32, x + cw / 2 - 56, yc - 16, "cap");
      const side = o.side ?? (R() < 0.5 ? -1 : 1);
      const n = Math.max(1, Math.floor((H - 40) / 80));
      for (let i = 1; i <= n; i++) {
        const sx = x + side * (cw / 2 + 40 + (n - i) * 56), sy = yb - i * 80 + 40;
        if (sy <= yc + 24) break;
        back(sx - 8, sy + 8, sx + 8, yb, "stem");
        // 작은 버섯은 튕김 버섯 (밟으면 높이 튀어 오른다)
        add(sx - 36, sy, sx + 36, sy + 8, "cap");
        spec(P, sx - 28, sy - 8, sx + 28, sy, "bounce");
      }
      return { x0: x - cw / 2, x1: x + cw / 2, top: yc - 32 };
    },
    // 속 빈 통나무: 위로 넘거나 안으로 지나간다
    log(x, yb, o = {}) {
      const lw = sn(o.w ?? R.range(200, 360));
      add(x - lw / 2, yb - 64, x + lw / 2, yb + 8, "wood");
      cut(x - lw / 2 - 8, yb - 40, x + lw / 2 + 8, yb, "wood");
      cut(x - lw / 2 - 8, yb - 72, x - lw / 2 + 8, yb - 56);
      cut(x + lw / 2 - 8, yb - 72, x + lw / 2 + 8, yb - 56);
      // 이끼
      add(x - lw / 2 + 24, yb - 72, x - lw / 2 + 24 + sn(lw * 0.4), yb - 64, "leaf");
      return { x0: x - lw / 2, x1: x + lw / 2, top: yb - 72 };
    },
    // 연못: 헤엄쳐 건너고 빠져나온다 (눈 지역은 얼음이 덮였다). 한쪽에 나무판 선착장
    pond(x, yb) {
      const pw = sn(R.range(160, 320)), d = sn(R.range(40, 72)), L = x - pw / 2, Rr = x + pw / 2;
      cut(L, yb - 40, Rr, yb + d);
      if (th === "snow") (spec(P, L, yb, Rr, yb + 8, "ice"), spec(P, L, yb + 8, Rr, yb + d, "water"));
      else {
        spec(P, L, yb + 8, Rr, yb + d, "water");
        const sd = R() < 0.5 ? -1 : 1, e = sd < 0 ? L : Rr;
        spec(P, Math.min(e, e - sd * 72), yb, Math.max(e, e - sd * 72), yb + 8, "plank");
      }
      return { x0: L, x1: Rr, top: yb };
    },
    // 나무 망루: 기둥 + 엇갈린 나무판 층 + 지붕
    watch(x, yb) {
      const w = sn(R.range(160, 208)), n = R.int(3, 4), L = x - w / 2, Rr = x + w / 2, top = yb - n * 80;
      back(L, top - 8, L + 8, yb, "wood");
      back(Rr - 8, top - 8, Rr, yb, "wood");
      for (let k = 1; k < n; k++) {
        const y = yb - k * 80;
        k % 2 ? spec(P, L + 8, y, Rr - 64, y + 8, "plank") : spec(P, L + 64, y, Rr - 8, y + 8, "plank");
      }
      spec(P, L - 24, top, Rr + 24, top + 8, "plank");
      // 지붕 (계단식, 올라설 수 있다)
      add(L - 24, top - 72, Rr + 24, top - 64, "wood");
      add(L, top - 80, Rr, top - 72, "wood");
      add(L + 24, top - 88, Rr - 24, top - 80, "wood");
      return { x0: L - 24, x1: Rr + 24, top: top - 88 };
    },
    // 돌기둥 계단: 높이가 다른 기둥 여러 개가 붙어 계단이 된다
    pillars(x, yb) {
      const n = R.int(3, 5);
      let xx = x - 170, h = sn(R.range(56, 80));
      const peak = R.int(1, n - 1);
      let top = yb;
      for (let i = 0; i < n; i++) {
        const w = sn(R.range(56, 88));
        add(xx, yb - h, xx + w, yb + 16);
        top = Math.min(top, yb - h);
        xx += w;
        h += (i < peak ? 1 : -1) * sn(R.range(48, 80));
        h = Math.max(48, h);
      }
      return { x0: x - 170, x1: xx, top };
    },
  };
  return { builders, add, cut, back, sn, W, FW };
}
// 자리 고르기: 가운데 높이로 위는 깎고 아래는 채운다 (지표 높이도 고친 대로)
function levelBed(P, hAt, K, a, b, yb) {
  const { sn, cut, add } = K;
  for (let xx = sn(a) - 16; xx < sn(b) + 16; xx += 8) {
    const g = hAt(xx + 4);
    if (g < yb - 2) cut(xx, g - 16, xx + 8, yb);
    else if (g > yb + 2) add(xx, yb, xx + 8, g + 16);
  }
  for (let i = Math.max(0, Math.floor((sn(a) - 16) / Q)); i <= Math.min(P.h.length - 1, Math.ceil((sn(b) + 16) / Q)); i++) P.h[i] = yb;
}
// 설계도 지표 구조물: 자리·크기를 손으로 정한다 (bp.feats)
function bpFeats(P, hAt, list) {
  const R = rng((P.seed ^ 0x5fea7) >>> 0), K = featKit(P, R);
  for (const q of list) {
    const fw = q.bed ?? K.FW[q.kind] ?? 300, a = q.x - fw / 2, b = q.x + fw / 2;
    let yb = q.y;
    if (yb == null) {
      let lo = 1e9, hi = -1e9;
      for (let xx = a; xx <= b; xx += 8) ((lo = Math.min(lo, hAt(xx))), (hi = Math.max(hi, hAt(xx))));
      yb = (lo + hi) / 2;
    }
    yb = K.sn(yb);
    q.y == null && !q.noBed && levelBed(P, hAt, K, a, b, yb);
    const box = K.builders[q.kind](K.sn(q.x), yb, q);
    box.kind = q.kind;
    P.feats.push(box);
  }
}
function groundFeatures(P, hAt) {
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom);
  const { builders, W, FW, sn, cut, add } = featKit(P, R);
  const pickKind = () => {
    let t = Object.values(W).reduce((a, b) => a + b, 0) * R();
    for (const [k, w] of Object.entries(W)) if ((t -= w) <= 0) return k;
    return "arch";
  };
  const avoid = (a, b) =>
    (P.pads ?? []).some((p) => b > p.xa - 16 && a < p.xb + 16) ||
    (P.mouths ?? []).some((m) => b > m.x - 140 && a < m.x + 140) ||
    (P.upX >= 0 && b > P.upX - 900 && a < P.upX + 900) ||
    P.feats.some((F2) => b > F2.x0 - 120 && a < F2.x1 + 120);
  for (let x0 = R.range(300, 600); x0 < lim - 400; x0 += R.range(160, 380)) {
    const kind = pickKind(), fw = FW[kind];
    // 이 칸 안에서 비어 있고 너무 울퉁불퉁하지 않은 자리를 찾는다
    let x = -1, lo = 0, hi = 0;
    for (let tr = 0; tr < 24 && x < 0; tr++) {
      const cx = x0 + tr * 40, a = cx - fw / 2, b = cx + fw / 2;
      if (a < 260 || b > lim - 260 || avoid(a, b)) continue;
      let l = 1e9, h = -1e9;
      for (let xx = a; xx <= b; xx += 8) {
        const v = hAt(xx);
        l = Math.min(l, v);
        h = Math.max(h, v);
      }
      if (h - l > 96) continue;
      ((x = cx), (lo = l), (hi = h));
    }
    if (x < 0) continue;
    const a = x - fw / 2, b = x + fw / 2;
    // 자리 고르기: 가운데 높이로 위는 깎고 아래는 채운다 (양 끝 단차는 한 번 뛰어 오를 만큼)
    const yb = sn((lo + hi) / 2);
    for (let xx = sn(a) - 16; xx < sn(b) + 16; xx += 8) {
      const g = hAt(xx + 4);
      if (g < yb - 2) cut(xx, g - 16, xx + 8, yb);
      else if (g > yb + 2) add(xx, yb, xx + 8, g + 16);
    }
    // 지표 높이도 고친 대로 (뒷벽·장식·적 자리가 새 지면을 따른다)
    for (let i = Math.max(0, Math.floor((sn(a) - 16) / Q)); i <= Math.min(P.h.length - 1, Math.ceil((sn(b) + 16) / Q)); i++) P.h[i] = yb;
    const box = builders[kind](sn(x), yb);
    box.kind = kind;
    P.feats.push(box);
    x0 = Math.max(x0, box.x1);
  }
}
const botY = (path, x) => {
  let best = path[0], bd = 1e9;
  for (const p of path) {
    const d = Math.abs(p[0] - x);
    d < bd && ((bd = d), (best = p));
  }
  return best[1];
};
// 뼈대 점들에서 공기를 따라 퍼져 닿지 않는 공기(따로 떨어진 작은 굴)는 바위로 메운다
function keepConnected(B, LW, LH, seeds) {
  const n = B.length, seen = scratch("KC", Uint8Array, n).fill(0), q = scratch("KQ", Int32Array, n);
  let t = 0;
  for (const [x, y] of seeds) {
    const i = Math.round(x / Q), j = Math.round(y / Q);
    if (i < 1 || j < 1 || i >= LW - 1 || j >= LH - 1) continue;
    const k = j * LW + i;
    !B[k] && !seen[k] && ((seen[k] = 1), (q[t++] = k));
  }
  for (let h = 0; h < t; h++) {
    const k = q[h];
    for (const m of [k - 1, k + 1, k - LW, k + LW]) m > 0 && m < n && !B[m] && !seen[m] && ((seen[m] = 1), (q[t++] = m));
  }
  for (let k = 0; k < n; k++) !B[k] && !seen[k] && (B[k] = 1);
}
// 동굴방: 둥근 천장 + 거의 평평한 바닥 (무너져 쌓인 돌 바닥처럼 아주 조금만 울퉁불퉁)
function chamber(P, B, cx, fy, rx, ry) {
  const { LW, LH, N } = P, so = P.R() * 99;
  const i0 = Math.max(1, Math.floor((cx - rx * 1.25) / Q)), i1 = Math.min(LW - 2, Math.ceil((cx + rx * 1.25) / Q));
  const j0 = Math.max(1, Math.floor((fy - ry * 1.3) / Q)), j1 = Math.min(LH - 2, Math.ceil((fy + 8) / Q));
  for (let i = i0; i <= i1; i++) {
    const x = i * Q, fn = fy + 3 * N.n1(x / 37 + so);
    for (let j = j0; j <= j1; j++) {
      const y = j * Q;
      if (y > fn) continue;
      const dx = (x - cx) / rx, dy = (y - fn) / ry, rr = 1 + 0.17 * N.n2(x / 44 + so, y / 44);
      if (dx * dx + dy * dy < rr * rr) B[j * LW + i] = 0;
    }
  }
  P.rooms.push({ x: cx, y: fy, rx, ry });
}
function room(P, B, cx, yF, rx, ry, lift = 0.55) {
  const { LW, LH, N } = P, so = P.R() * 99;
  const cy = yF - ry * lift;
  const i0 = Math.max(1, Math.floor((cx - rx * 1.3) / Q)), i1 = Math.min(LW - 2, Math.ceil((cx + rx * 1.3) / Q));
  const j0 = Math.max(1, Math.floor((cy - ry * 1.3) / Q)), j1 = Math.min(LH - 2, Math.ceil((cy + ry * 1.3) / Q));
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const x = i * Q, y = j * Q;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const rr = 1 + 0.22 * N.n2(x / 26 + so, y / 26);
      if (dx * dx + dy * dy < rr * rr) B[j * LW + i] = 0;
    }
  P.rooms.push({ x: cx, y: yF, rx, ry });
}

// ▲ 문까지 오르는 섬 사슬 (꼭대기부터 아래로 내려오며 놓는다)
function skyChain(P, groundAt, style) {
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 60;
  for (let tries = 0; tries < 50; tries++) {
    const pw = R.range(150, 210);
    const pcx = clamp(P.upX + R.range(-110, 110), 140, lim - 140);
    const ptop = Math.round(R.range(5, 7)) * TS;
    const chain = [{ cx: pcx, top: ptop, w: pw, t: R.range(80, 130) }];
    let cur = chain[0], ok = false;
    for (let g = 0; g < 40; g++) {
      const gl = Math.min(groundAt(cur.cx - cur.w / 2), groundAt(cur.cx), groundAt(cur.cx + cur.w / 2));
      if (cur.top >= gl - 96) {
        ok = true;
        break;
      }
      // 제멋대로 걷기: 방향은 매번 새로 고르되, ▲ 문에서 너무 멀어지면 되돌아오게
      const pull = clamp((cur.cx - P.upX) / 700, -0.4, 0.4);
      const dir = R() < 0.5 - pull ? 1 : -1;
      let placed = null;
      for (const d of [dir, -dir]) {
        for (let q = 0; q < 7 && !placed; q++) {
          const big = R() < 0.18;
          const w = big ? R.range(130, 200) : R.range(44, 120);
          const gap = R.range(-20, 60);
          const cx = d > 0 ? cur.cx + cur.w / 2 + gap + w / 2 : cur.cx - cur.w / 2 - gap - w / 2;
          if (cx - w / 2 < 70 || cx + w / 2 > lim) continue;
          const gnd = Math.min(groundAt(cx - w / 2), groundAt(cx), groundAt(cx + w / 2));
          let top = cur.top + R.range(30, 78);
          if (top > gnd - 60) top = gnd - 60;
          if (top < cur.top + 24) continue;
          const t = Math.min(big ? R.range(60, 120) : R.range(28, 80), gnd - 44 - top);
          // 너무 얇으면 판자처럼 보인다
          if (t < 24) continue;
          const B = { cx, top, w, t };
          // 다른 섬 머리 위를 막지 않게, 겹치지 않게
          if (chain.some((A) => Math.abs(A.cx - cx) < (A.w + w) / 2 + 14 && Math.abs(top - A.top) < HEAD + 30 + (A.top < top ? A.t * 1.3 : t * 1.3))) continue;
          placed = B;
        }
        if (placed) break;
      }
      if (!placed) break;
      chain.push(placed);
      cur = placed;
    }
    if (!ok) continue;
    for (const I of chain) island(P, I.cx, I.top, I.w, I.t, I === chain[0] ? (style === "spire" ? "rock" : style) : style);
    const pk = chain[0];
    P.peak = { x: Math.round((pk.cx - pk.w * 0.22) / TS) * TS + 8, y: pk.top, isl: pk };
    // 꼭대기 섬 위는 평평하게 (문·보물 상자)
    flatFloor(P, pk.cx - pk.w * 0.36, pk.cx + pk.w * 0.36, Math.round(pk.top / TS) * TS, 16, 10, 14);
    P.peak.y = Math.round(pk.top / TS) * TS;
    P.chest = { x: Math.round((pk.cx + pk.w * 0.22) / TS) * TS + 8, y: P.peak.y };
    return;
  }
}
// 하늘 군도: 큰 섬들을 여러 높이 층에 엇갈리게 흩어 놓는다 (한 줄 계단이 아니라 갈래길이 여럿 생긴다)
// 층 사이 높이는 2단 점프로 오를 만큼, 같은 층 섬 사이 틈은 건너뛸 만큼. 꼭대기 큰 섬이 ▲ 문
// 하늘 층: 아주 큰 섬(폭 600~1000)을 높이 층마다 엇갈려 놓고, 층 사이는 작은 디딤 섬 두세 개로 잇는다.
// 맨 위 층의 ▲ 조각 위 큰 섬에 ▲ 문
function skyLayers(P, groundAt0, style, lower = null) {
  let groundAt = groundAt0;
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 60, base = FLOOR * TS;
  const placed = [];
  const snap = (y) => Math.round(y / BLK) * BLK;
  const groundMin = (a, b) => {
    let lo = 1e9;
    for (let x = a; x <= b; x += 16) lo = Math.min(lo, groundAt(clamp(x, 0, WP - 1)));
    return lo;
  };
  const depthAt = (A, x0, x1) => {
    const n = clamp(A.cx, x0, x1), u = (n - A.cx) / (A.w / 2), e = 1 - u * u;
    return e <= 0 ? 8 : A.t * 1.45 * e + 8;
  };
  // 겹치는 가로 구간에서 위 섬 밑면과 아래 섬 윗면 사이에 몸이 지나갈 공간이 있는가
  // 계단 점프 길 (다른 섬·디딤판이 들어오면 안 된다)
  const noGo = [];
  let stairMode = false;
  const free = (B, pad = 18, margin = 40) => {
    const dB = B.t > 16 ? B.t * 1.45 + 8 : 16;
    for (const Z of noGo) if (B.cx + B.w / 2 > Z.x0 && B.cx - B.w / 2 < Z.x1 && B.top + dB > Z.y0 && B.top < Z.y1) return false;
    // 비탈 바로 위에 낮게 뜨면 비탈을 오르는 길을 막는다: 비탈 위에서는 밑면과 땅 사이 140px 이상 (평평한 땅 위 디딤판은 괜찮다)
    if (!stairMode) {
      let lo = 1e9, hi = -1e9;
      for (let x = B.cx - B.w / 2 - 24; x <= B.cx + B.w / 2 + 24; x += 16) {
        const g = groundAt(clamp(x, 0, WP - 1));
        lo = Math.min(lo, g);
        hi = Math.max(hi, g);
      }
      if (lo < P.HP - 40 && hi - lo > 24 && B.top < lo && lo - (B.top + (B.t > 16 ? B.t * 1.45 + 8 : 16)) < 140) return false;
    }
    for (const A of placed) {
      const x0 = Math.max(A.cx - A.w / 2, B.cx - B.w / 2) - pad, x1 = Math.min(A.cx + A.w / 2, B.cx + B.w / 2) + pad;
      if (x0 >= x1) continue;
      const [U, L] = A.top <= B.top ? [A, B] : [B, A];
      if (L.top - (U.top + depthAt(U, x0, x1)) < HEAD + margin) return false;
    }
    return true;
  };
  // 아래에 겹치는 섬이 있으면 그만큼 얇게 (밑면과 아래 섬 윗면 사이에 몸 + 점프 여유)
  const fitT = (B) => {
    for (const A of placed) {
      if (A.top <= B.top) continue;
      const x0 = Math.max(A.cx - A.w / 2, B.cx - B.w / 2) - 18, x1 = Math.min(A.cx + A.w / 2, B.cx + B.w / 2) + 18;
      if (x0 >= x1) continue;
      const n = clamp(B.cx, x0, x1), u = (n - B.cx) / (B.w / 2), e = Math.max(0.05, 1 - u * u);
      B.t = Math.min(B.t, (A.top - B.top - 8 - HEAD - 40) / (1.45 * e));
    }
    return B.t;
  };
  const put = (I, big) => {
    if (!big && R() < (P.skyZone ? 0.45 : 0.2)) {
      // 구름 발판: 아래에서 뚫고 올라가고, 위에서 뛰면 더 높이 뛴다
      spec(P, I.cx - I.w / 2, I.top, I.cx + I.w / 2, I.top + 16, "cloud");
      placed.push(I);
      return I;
    }
    island(P, I.cx, I.top, I.w, I.dt ?? I.t, style, big ? { lobes: clamp(Math.round(I.w / 260), 2, 6), sub: false, shape: I.shape, tiers: I.tiers } : { sub: false, shape: I.t >= 36 ? (R() < 0.5 ? "mesa" : "plateau") : "plateau", lobes: I.t >= 36 ? R.int(1, 2) : R.int(0, 2) });
    if (big && !I.noPond && (I.shape === "plateau" || I.shape === "mesa") && I.w > 500 && (I.dt ?? I.t) > 110 && R() < 0.35) {
      const pw = Math.min(320, I.w * 0.35), sx = I.cx + (R() - 0.5) * I.w * 0.3;
      cutShape(P, sx - pw / 2 - 4, I.top - 24, sx + pw / 2 + 4, I.top + 52, (px, py) => Math.min(px - (sx - pw / 2), sx + pw / 2 - px, py - (I.top - 20), I.top + 48 - py) + 0.5);
      spec(P, sx - pw / 2, I.top + 8, sx + pw / 2, I.top + 48, "water");
    }
    placed.push(I);
    return I;
  };
  // 디딤 섬: 아래(땅·아래 층 섬)에서 큰 섬 가장자리까지 한 번에 2단 점프(약 92px)씩 오르도록
  const surfAt = (x, below) => {
    // 땅은 걸어 다니는 평지(지면 높이 근처, 완만한 곳)만 출발점이 된다 — 산비탈은 오를 수 없을 수 있다
    const gx = clamp(x, 0, WP - 1), g0 = groundAt(gx);
    let s = g0 < P.HP - 40 && Math.abs(groundAt(clamp(gx + 48, 0, WP - 1)) - groundAt(clamp(gx - 48, 0, WP - 1))) < 40 ? g0 : P.HP;
    for (const A of placed) if (Math.abs(x - A.cx) < A.w / 2 - 20 && A.top > below && A.top < s) s = A.top;
    return s;
  };
  const STEP = 92;
  // 한쪽(dir) 가장자리로 디딤 섬 사슬을 놓아 본다. 놓은 것은 성공했을 때만 남긴다
  const chainTo = (B, dir) => {
    const ex = B.cx + (dir * B.w) / 2;
    let best = null;
    for (let d = 40; d < 1000 && !best; d += 40) {
      const sx = ex + dir * d;
      if (sx < 80 || sx > lim - 40) break;
      const sy = surfAt(sx, B.top + 20);
      if (sy >= P.HP - 40) continue;
      const rise = sy - B.top, nR = Math.max(0, Math.ceil(rise / STEP) - 1);
      // 디딤 섬은 가로로 나란히 (아래위로 겹치면 머리가 닿는다)
      if (d < nR * 210 + 30) continue;
      best = { sx, sy, rise };
    }
    if (!best) return null;
    const { sy } = best;
    const minD = Math.max(0, Math.ceil(best.rise / STEP) - 1) * 210 + 20;
    let e = best.sx;
    while ((e - ex) * dir - 4 > minD && Math.abs(surfAt(e - dir * 4, B.top + 20) - sy) <= 8) e -= dir * 4;
    let y = sy;
    const steps = [];
    for (let step = 0; step < 10; step++) {
      const gapB = (e - ex) * dir, riseB = y - B.top;
      if (gapB <= 84 && riseB <= STEP) return steps;
      const nUp = Math.ceil(riseB / STEP);
      const rise = riseB > 0 ? Math.min(STEP, riseB / Math.max(1, nUp)) : 0;
      // 남은 틈이 좁으면 작은 디딤판을 틈 가운데에
      // 남은 가로 자리를 남은 오름 횟수로 나눠 쓴다 (너무 넓은 판이면 가로 자리가 모자라 끊긴다)
      const g = Math.min(R.range(36, 56), (gapB - 48) / 2);
      const w = Math.min(R.range(110, 170), (gapB - 40) / Math.max(1, nUp) - g);
      if (w < 72 || g < 12) return null;
      const near = e - dir * g;
      let I = null;
      // 막히면 조금씩 옮겨 본다
      for (const [jx, jy] of [[0, 0], [0, -8], [-dir * 16, 0], [0, 8], [-dir * 32, -8]]) {
        const C2 = { cx: near - (dir * w) / 2 + jx, top: snap(y - rise + jy), w, t: R.pick([18, 20, 24, 24, 36, 48]) };
        if (y - C2.top <= STEP && free(C2, 6, 10) && !steps.some((Q) => Math.abs(Q.cx - C2.cx) < (Q.w + C2.w) / 2 + 6 && Math.abs(Q.top - C2.top) < 60)) {
          I = C2;
          break;
        }
      }
      if (!I) return null;
      steps.push(I);
      e = I.cx - (dir * I.w) / 2;
      y = I.top;
    }
    return null;
  };
  const connect = (B) => {
    for (const dir of R() < 0.5 ? [-1, 1] : [1, -1]) {
      const st = chainTo(B, dir);
      if (st) {
        for (const I of st) put(I, 0);
        return true;
      }
    }
    return false;
  };
  // 큰 섬 흩어 놓기: 아래에서 위로 높이 띠를 올라가며 띠마다 아무 자리에나 여러 모양·크기의 섬을 놓는다
  // (줄지어 놓지 않는다). 아래 땅·섬에서 디딤 섬으로 이어지는 섬만 남긴다
  const sky = !!P.skyZone;
  const SHAPES = ["plateau", "plateau", "tiers", "tiers", "mesa", "twin"];
  const makeIsl = (cls) => {
    const I = { huge: 1, cls };
    if (cls === 2) ((I.w = R.range(1700, 2600)), (I.t = R.range(400, 560)), (I.shape = "hollow"));
    else if (cls === 1) ((I.w = R.range(800, 1300)), (I.t = R.range(220, 340)), (I.shape = R.pick(SHAPES)));
    else ((I.w = R.range(380, 700)), (I.t = R.range(120, 220)), (I.shape = R.pick(SHAPES)));
    if (I.shape === "mesa") ((I.w *= 0.7), (I.t *= 1.5));
    if (I.shape === "tiers") {
      // 단 2~4개: 이웃 단과 높이 차 24~64px
      const n = R.int(2, 4), cut = [-1];
      for (let k = 1; k < n; k++) cut.push(-1 + (2 * k) / n + R.range(-0.12, 0.12));
      cut.push(1.01);
      let o = 0;
      I.tiers = [];
      for (let k = 0; k < n; k++) (I.tiers.push({ u0: cut[k], u1: cut[k + 1], off: o }), (o += R.pick([-64, -48, -32, -24, 24, 32, 48, 64])));
      const lo = Math.min(...I.tiers.map((T) => T.off));
      for (const T of I.tiers) T.off -= lo;
      I.span = Math.max(...I.tiers.map((T) => T.off));
    }
    I.dt = I.t;
    return I;
  };
  const near = (I) =>
    placed.some((J) => {
      if (!J.huge) return false;
      const hg = Math.max(J.cx - J.w / 2, I.cx - I.w / 2) - Math.min(J.cx + J.w / 2, I.cx + I.w / 2);
      return hg < (sky ? 180 : 240) && Math.abs(J.top - I.top) < (sky ? 230 : 260);
    });
  const reserved = [];
  const hitRes = (I) =>
    reserved.some((Z) => Z !== I.res && I.cx + I.w / 2 > Z.cx - Z.w / 2 - 160 && I.cx - I.w / 2 < Z.cx + Z.w / 2 + 160 && I.top < Z.top + Z.t * 0.9 + 260 && I.top + (I.t ?? 0) * 1.2 > Z.top - 200);
  const tryPlace = (I, x, top) => {
    I.cx = x;
    I.top = snap(top);
    if (I.cx - I.w / 2 < 50 || I.cx + I.w / 2 > lim - 10 || I.top < 260 || hitRes(I)) return null;
    // 아래 땅과 섬 밑면 사이 여유 (몸 + 점프)
    const g = groundMin(I.cx - I.w / 2 - 60, I.cx + I.w / 2 + 60);
    const span = I.span ?? 0;
    I.dt = Math.min(I.dt, (g - I.top - span - 160) / 1.45);
    if (I.dt < 70) return null;
    // 검사용 두께: 계단 아래 단만큼 더 깊다
    I.t = I.dt + span / 1.45;
    if (fitT(I) < 70 || near(I) || !free(I)) return null;
    I.dt = I.t - span / 1.45;
    placed.push(I);
    const ok = connect(I);
    placed.pop();
    return ok ? put(I, 1) : null;
  };
  // 아래쪽 (하늘 구역): 아래 바닥 섬 위로 섬을 흩어 놓고, 위 바닥 섬에서 아래로 디딤 섬 사슬을 내린다
  if (lower) for (const F0 of lower.floor) placed.push(F0);
  const layers = [];
  const yFloor = P.skyFloorY ?? base, yLow = yFloor - R.range(240, 300);
  let nBig = 0;
  for (let k = 0, tr = 0; k < (sky ? 2 : 1) && tr < 40; tr++) {
    const I = makeIsl(2);
    I.cx = R.range(I.w / 2 + 80, lim - I.w / 2 - 40);
    I.top = snap(R.range(320 + (yFloor - 320) * 0.3, 320 + (yFloor - 320) * 0.7));
    if (P.upX >= 0 && Math.abs(I.cx - P.upX) < I.w / 2 + 500) continue;
    if (reserved.some((Z) => Math.abs(Z.cx - I.cx) < (Z.w + I.w) / 2 + 300 && Math.abs(Z.top - I.top) < 900)) continue;
    I.res = I;
    reserved.push(I);
    k++;
  }
  let peakI = null, stairX = 0, stairSide = 1;
  if (P.isZone && P.upX >= 0) {
    const pw = snap(R.range(560, 760)), pcx = clamp(P.upX + R.range(-100, 100), pw / 2 + 300, lim - pw / 2 - 300);
    peakI = { cx: pcx, top: snap(320 + (yFloor - 320) * 0.22), w: pw, t: R.range(150, 200), huge: 1, shape: "plateau", noPond: 1 };
    put(peakI, 1);
    // 계단은 아래 땅이 평평하고 낮은 쪽으로 (산비탈에 걸리지 않게)
    const rough = (sd) => {
      const x0 = pcx + sd * (pw / 2), x1 = x0 + sd * 400;
      let lo = 1e9, hi = -1e9;
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += 16) {
        const g = groundAt(clamp(x, 0, WP - 1));
        lo = Math.min(lo, g);
        hi = Math.max(hi, g);
      }
      return hi - lo + Math.max(0, yFloor - lo) * 0.2;
    };
    stairSide = rough(1) <= rough(-1) ? 1 : -1;
    stairX = pcx + stairSide * (pw / 2 + 24);
    // 계단 기둥 (위 1200px): 다른 섬이 들어오지 않게
    reserved.push({ stair: 1, cx: stairX + stairSide * 100, w: 300, top: peakI.top, t: (yFloor - peakI.top) / 0.9 });
    // ▲ 문 섬 옆에서 아래로 엇갈린 구름 계단 (다른 섬보다 먼저: 섬·디딤판이 계단을 피한다)
    let y = peakI.top + 72, k = 0;
    const surfBelow = (x0, x1, yy) => {
      let best = 1e9;
      // 땅만 본다 (섬은 실제로 닿는지 알 수 없다)
      for (let x = x0; x <= x1; x += 16) best = Math.min(best, groundAt(clamp(x, 0, WP - 1)));
      return best;
    };
    // 구불구불한 구름 계단: 좌우로 불규칙하게 흔들리고(같은 쪽으로 두세 번 이어 오르기도), 간격·크기가 제각각.
    // 5~8칸마다 작은 바위 쉼터 섬. 구름 모양도 가끔 한쪽이 한 칸 솟은 뭉게구름
    const band0 = stairSide > 0 ? stairX : stairX - 340, band1 = band0 + 340;
    let xa = stairSide > 0 ? stairX : stairX - 110, wPrev = 110, dirS = stairSide, rest = R.int(5, 8);
    // 점프 길 상자: 아래 칸 → 위 칸 사이 (다른 칸이 끼면 머리가 닿는다 — 검사기는 구름도 단단한 바닥으로 본다)
    const depth = (I) => (I.t > 16 ? 24 : 16);
    const hits = (I, B) => I.cx + I.w / 2 > B.x0 && I.cx - I.w / 2 < B.x1 && I.top + depth(I) > B.y0 && I.top < B.y1;
    const corOf = (A, B) => {
      const ar = A.cx + A.w / 2, al = A.cx - A.w / 2, br = B.cx + B.w / 2, bl = B.cx - B.w / 2;
      const [x0, x1] = bl >= ar ? [ar, bl] : br <= al ? [br, al] : [Math.max(al, bl), Math.min(ar, br)];
      return { x0: x0 - 10, x1: x1 + 10, y0: Math.min(A.top, B.top) - 40, y1: Math.max(A.top, B.top) };
    };
    let prevI = null, lastCor = null;
    stairMode = true;
    for (let guard = 0; guard < 120; guard++, k++) {
      const isRest = --rest <= 0;
      const w = snap(isRest ? R.range(150, 210) : R.range(72, 136));
      let got = null;
      for (let tr = 0; tr < 24 && !got; tr++) {
        // 자리가 없으면 조금 낮춰서 (위 칸과 더 벌어지지 않게 8px씩, 세 번까지)
        if (tr && tr % 8 === 0) y = Math.min(y + 8, prevI ? prevI.top + 84 : y);
        // 방향: 대개 번갈아, 가끔 같은 쪽으로. 띠를 벗어나면 되돌린다
        let d = k === 0 ? 0 : tr % 8 < 4 ? (R() < 0.7 ? -dirS : dirS) : tr % 2 ? 1 : -1;
        const g = R.range(12, 56);
        let nx = d === 0 ? (stairSide > 0 ? stairX : stairX - w) : d > 0 ? xa + wPrev + g : xa - g - w;
        if (nx < band0) nx = xa + wPrev + g;
        if (nx + w > band1) nx = xa - g - w;
        const C2 = { cx: nx + w / 2, top: snap(y), w, t: isRest ? R.range(22, 30) : 16 };
        if (nx < 60 || nx + w > lim - 20 || !free(C2, 6, 10)) continue;
        if (lastCor && hits(C2, lastCor) && tr < 20) continue;
        if (prevI) {
          const cor = corOf(prevI, C2);
          if (placed.some((I) => I !== prevI && hits(I, cor)) && tr < 20) continue;
          C2.cor = cor;
        }
        got = C2;
        dirS = nx > xa ? 1 : nx < xa ? -1 : dirS;
        xa = nx;
      }
      if (!got) { globalThis.__dbg && console.log("stair stop", k, Math.round(y), Math.round(xa)); break; }
      if (isRest) {
        island(P, got.cx, got.top, got.w, got.t, style, { sub: false, shape: "plateau", lobes: R.int(0, 1) });
        rest = R.int(5, 8);
      } else {
        spec(P, got.cx - w / 2, got.top, got.cx + w / 2, got.top + 16, "cloud");
        // 뭉게구름: 한쪽 위에 작은 구름 덩이 (한 칸 높은 턱, 걸어서 넘는다)
        if (w >= 104 && R() < 0.4) {
          const pw = snap(w * R.range(0.35, 0.5)), px = R() < 0.5 ? got.cx - w / 2 + 8 : got.cx + w / 2 - 8 - pw;
          spec(P, px, got.top - 8, px + pw, got.top, "cloud");
        }
      }
      placed.push(got);
      wPrev = w;
      lastCor = got.cor ?? null;
      got.cor && noGo.push(got.cor);
      prevI = got;
      const g = surfBelow(got.cx - w / 2 - 40, got.cx + w / 2 + 40, got.top);
      const rem = g - got.top;
      if (rem <= 88) { globalThis.__dbg && console.log("stair ground", k, Math.round(got.top), g); break; }
      y = got.top + Math.min(R.range(52, 84), Math.max(40, rem - 56));
    }
    stairMode = false;
  }
  for (let y = yLow, k = 0; y > 320 && k < 40; k++, y -= R.range(200, 300)) {
    const row = [];
    const per = sky ? R.int(2, 4) : R.int(1, 3);
    // 잡아 둔 아주 큰 섬: 그 높이에 이르면 (위아래로 조금씩 옮겨 가며) 놓아 본다
    for (const Z of reserved.slice()) {
      if (Z.stair || Z.top < y - 140) continue;
      let got = null;
      for (let tr = 0; tr < 16 && !got; tr++) {
        const I = { ...Z, dt: Z.t, t: Z.t };
        got = tryPlace(I, Z.cx + R.range(-200, 200), Z.top + R.range(-120, 60));
      }
      reserved.splice(reserved.indexOf(Z), 1);
      got && (row.push(got), nBig++);
    }
    for (let tr = 0; tr < 36 && row.length < per; tr++) {
      const cls = R() < 0.45 ? 1 : 0;
      const I = makeIsl(cls);
      const x = R.range(I.w / 2 + 60, lim - I.w / 2 - 20);
      const got = tryPlace(I, x, y + R.range(-110, 110));
      got && row.push(got);
    }
    layers.push(row);
  }
  // 출구 섬: 안쪽 아래로 디딤 사슬
  if (lower) for (const F0 of lower.floor) connect(F0);
  if (peakI) {
    const c0 = P.upX - 256 + 28, c1 = P.upX + 256 - 28;
    const px = clamp(P.upX, Math.max(c0, peakI.cx - peakI.w / 2 + 60), Math.min(c1, peakI.cx + peakI.w / 2 - 60));
    const yv = snap(peakI.top);
    flatFloor(P, px - 36, px + 36, yv, 16, 10, 14);
    P.peak = { x: Math.round((px - 8) / TS) * TS + 8, y: yv };
    const cxp = clamp(px + (px < peakI.cx ? 64 : -64), peakI.cx - peakI.w / 2 + 24, peakI.cx + peakI.w / 2 - 24);
    P.chest = { x: Math.round((cxp - 8) / TS) * TS + 8, y: yv };
  }
}
function skyTiers(P, groundAt, style, dens) {
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 60, base = FLOOR * TS;
  const placed = [];
  // 겹치는 가로 구간에서 위 섬의 실제 처진 깊이(가장자리로 갈수록 얇다)를 재서, 아래 섬 윗면 위에 머리 공간이 남는지
  let depthK = 1.45;
  const depthAt = (A, x0, x1) => {
    const n = clamp(A.cx, x0, x1), u = (n - A.cx) / (A.w / 2), e = 1 - u * u;
    return e <= 0 ? 0 : A.t * depthK * e + 6;
  };
  const free = (cx, top, w, t) => {
    const B = { cx, top, w, t };
    for (const A of placed) {
      const x0 = Math.max(A.cx - A.w / 2, cx - w / 2) - 18, x1 = Math.min(A.cx + A.w / 2, cx + w / 2) + 18;
      if (x0 >= x1) continue;
      const [U, L] = A.top <= top ? [A, B] : [B, A];
      if (L.top - (U.top + depthAt(U, x0, x1)) < HEAD + 10) return false;
    }
    return true;
  };
  const st = style === "spire" ? "rock" : style;
  if (style === "spire") depthK = 1.75;
  if (!1) {
    const pw = R.range(220, 300), pcx = clamp(P.upX + R.range(-80, 80), 300, lim - 300), ptop = Math.round(R.range(5, 7)) * TS, pt = R.range(70, 110);
    island(P, pcx, ptop, pw, pt, st);
    placed.push({ cx: pcx, top: ptop, w: pw, t: pt });
    // 꼭대기 섬 양옆 한 층 아래 어깨 섬 (한 번 뛰어 오르는 거리)
    for (const side of [-1, 1]) {
      const w = R.range(130, 210), gap = R.range(16, 56), t = R.range(50, 90);
      const cx = pcx + side * (pw / 2 + gap + w / 2), top = ptop + R.range(58, 76);
      if (cx - w / 2 < 60 || cx + w / 2 > lim) continue;
      island(P, cx, top, w, t, style);
      placed.push({ cx, top, w, t });
    }
    flatFloor(P, pcx - pw * 0.36, pcx + pw * 0.36, ptop, 16, 10, 14);
    P.peak = { x: Math.round((pcx - pw * 0.22) / TS) * TS + 8, y: ptop };
    P.chest = { x: Math.round((pcx + pw * 0.22) / TS) * TS + 8, y: ptop };
  }
  // 자라나는 군도: 밟을 수 있는 자리(땅·바닥 섬·이미 놓인 섬 가장자리)에서 한 번 뛰어 닿는 곳에 큰 섬을 놓고,
  // 새 섬의 양쪽 가장자리가 또 다음 출발점이 된다 → 여러 갈래로 위로 자란다. 한 갈래는 ▲ 문 쪽으로 기운다
  const launches = [];
  for (let x = 140; x < lim - 140; x += R.range(120, 220)) {
    const g = groundAt(x);
    // 산비탈에서는 시작하지 않는다 (산 옆구리에 계단처럼 붙는다)
    g < base + 40 && g > base - 120 && launches.push({ x, y: g, g: 1 });
  }
  const want = Math.round((lim / 4096) * (dens > 0.7 ? 16 : 13));
  let made = 0;
  for (let it = 0; it < 5000 && made < want && launches.length; it++) {
    // 절반은 "줄기": 높은 출발점 중 ▲ 문에 가까운 것, 나머지는 아무 출발점
    let L;
    // 줄기: ▲ 문 둘레(±900px)의 높은 출발점 중 하나에서 아무 방향으로 → 지그재그로 굽이치며 오른다
    if (!P.peak && P.upX >= 0 && R() < 0.65) {
      const near = launches.filter((q) => Math.abs(q.x - P.upX) < 900).sort((a, b) => a.y - b.y).slice(0, 5);
      L = near.length ? near[Math.floor(R() * near.length)] : launches[Math.floor(R() * launches.length)];
    } else L = launches[Math.floor(R() * launches.length)];
    const away = !P.peak && P.upX >= 0 && Math.abs(L.x - P.upX) > 700;
    const dir = away ? Math.sign(P.upX - L.x) : R() < 0.5 ? -1 : 1;
    // 땅에서 오르는 첫 섬은 밑으로 걸어 지나갈 머리 공간 + 두께가 필요해서 조금 높게 (2단 점프 안)
    // 높이 오를수록 옆으로 더 떨어져야 달려 뛰는 궤적이 새 섬 옆구리에 부딪히지 않는다
    // 큰 섬(폭 600~1100)과 중간 섬(260~460)을 섞는다 — 큰 섬 위는 걸어 다니는 땅덩이
    const huge = !L.g && R() < 0.5 || (L.g && R() < 0.25);
    const w = huge ? R.range(600, 1100) : R.range(260, 460), rise = L.g ? R.range(84, 104) : R.range(44, 80);
    const gap = L.g ? R.range(-60, 40) : clamp(R.range(40, 66) + (rise - 44) * 0.7, 40, 92);
    const cx = L.x + dir * (gap + w / 2), top = L.y - rise;
    if (top < 150 || cx - w / 2 < 50 || cx + w / 2 > lim) continue;
    let lo = 1e9, hi = -1e9;
    for (let gx = cx - w / 2 - 90; gx <= cx + w / 2 + 90; gx += 16) {
      const g = groundAt(gx);
      ((lo = Math.min(lo, g)), (hi = Math.max(hi, g)));
    }
    const room = lo - top;
    if (room < 70) continue;
    let t = huge ? R.range(170, 300) : R.range(80, 170);
    if (lo - (top + t * 1.45 + 6) < 150) {
      let l2 = 1e9, h2 = -1e9;
      for (let gx = cx - w / 2 - 40; gx <= cx + w / 2 + 40; gx += 12) {
        const g = groundAt(gx);
        ((l2 = Math.min(l2, g)), (h2 = Math.max(h2, g)));
      }
      if (h2 - l2 > 48) continue;
      t = Math.min(t, (room - 52) / 1.45);
    }
    if (t < 22 || !free(cx, top, w, t)) continue;
    island(P, cx, top, w, t, style, huge ? { lobes: clamp(Math.round(w / 220), 2, 5) } : {});
    placed.push({ cx, top, w, t, huge });
    launches.push({ x: cx - w / 2 + 16, y: top }, { x: cx + w / 2 - 16, y: top });
    made++;
  }
  // ▲ 문: ▲ 조각 안에 걸친 섬 중 가장 높은 섬 위 (자라난 갈래로 이미 닿는 곳)
  if (P.isZone && P.upX >= 0 && !P.peak) {
    const c0 = P.upX - 256 + 28, c1 = P.upX + 256 - 28;
    const cand = placed.filter((I) => I.cx + I.w / 2 - 36 > c0 && I.cx - I.w / 2 + 36 < c1).sort((a, b) => a.top - b.top)[0];
    if (cand && cand.top < base - 560) {
      const px = clamp(cand.cx, Math.max(c0, cand.cx - cand.w / 2 + 36), Math.min(c1, cand.cx + cand.w / 2 - 36));
      const y = Math.round(cand.top / TS) * TS;
      flatFloor(P, px - 36, px + 36, y, 16, 10, 14);
      P.peak = { x: Math.round((px - 8) / TS) * TS + 8, y };
      const cxp = clamp(px + (px < cand.cx ? 48 : -48), cand.cx - cand.w / 2 + 24, cand.cx + cand.w / 2 - 24);
      Math.abs(cxp - px) > 30 && (P.chest = { x: Math.round((cxp - 8) / TS) * TS + 8, y });
    } else {
      // 갈래가 거기까지 못 자랐으면 예전처럼 꼭대기 섬 (고치기가 이어 준다)
      const pw = R.range(600, 900), pcx = clamp(P.upX + R.range(-60, 60), pw / 2 + 60, lim - pw / 2 - 60), ptop = Math.round(R.range(10, 16)) * TS;
      island(P, pcx, ptop, pw, R.range(170, 260), st, { lobes: 3 });
      flatFloor(P, pcx - pw * 0.36, pcx + pw * 0.36, ptop, 16, 10, 14);
      P.peak = { x: Math.round((pcx - 8) / TS) * TS + 8, y: ptop };
    }
  }
  let tier = 99;
  for (let ty = 96 + R.range(62, 80); dens > 1 && ty < base - 64; ty += R.range(62, 82), tier++) {
    let x = R.range(40, 220);
    while (x < lim - 100) {
      const w = R.range(110, 280), gap = R.range(36, 120);
      const cx = x + w / 2, top = ty + R.range(-10, 10);
      x += w + gap;
      // 꼭대기 섬 바로 아래 두 층은 ▲ 문 근처를 촘촘히 (꼭대기로 가는 길이 반드시 있게)
      const nearPeak = tier < 2 && P.upX >= 0 && Math.abs(cx - P.upX) < 520;
      if (cx + w / 2 > lim || R() > (nearPeak ? 1 : dens)) continue;
      // 섬 폭 ±90px 아래 땅 (틈 위면 땅이 없다 → 아주 깊게 잡힌다)
      let lo = 1e9, hi = -1e9;
      for (let gx = cx - w / 2 - 90; gx <= cx + w / 2 + 90; gx += 16) {
        const g = groundAt(gx);
        ((lo = Math.min(lo, g)), (hi = Math.max(hi, g)));
      }
      const room = lo - top;
      if (room < 70 || top > base - 64) continue;
      // 점프 궤적(약 155px)을 막지 않게: 처진 밑면까지 높이 떠 있거나,
      // 낮은 디딤 섬이면 아래 땅이 틈·벼랑 없이 이어진 곳에만 (얇게, 밑으로 지나갈 머리 공간)
      let t = R.range(44, 120);
      if (lo - (top + t * 1.45 + 6) < 150) {
        // 섬 바로 밑(±40px)이 틈·벼랑 없이 이어진 땅이면 밑으로 걸어 지나갈 머리 공간만 있으면 된다
        let l2 = 1e9, h2 = -1e9;
        for (let gx = cx - w / 2 - 40; gx <= cx + w / 2 + 40; gx += 12) {
          const g = groundAt(gx);
          ((l2 = Math.min(l2, g)), (h2 = Math.max(h2, g)));
        }
        if (h2 - l2 > 48) continue;
        t = Math.min(t, (room - 52) / 1.45);
      }
      if (t < 22 || !free(cx, top, w, t)) continue;
      island(P, cx, top, w, t, style);
      placed.push({ cx, top, w, t });
    }
  }
}
function scatterIslands(P, groundAt, n, I) {
  const { R, WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 50;
  const placed = P.islands.slice();
  for (let k = 0, t = 0; k < n && t < 300; t++) {
    const w = R.range(I.w[0], I.w[1]), th = R.range(I.t[0], I.t[1]);
    const cx = R.range(90 + w / 2, lim - w / 2);
    const gnd = Math.min(groundAt(cx - w / 2), groundAt(cx), groundAt(cx + w / 2));
    const maxTop = gnd - th * 1.25 - 120;
    if (maxTop < 150) continue;
    const top = R.range(130, maxTop);
    if (placed.some((A) => Math.abs(A.cx - cx) < (A.w + w) / 2 + 56 && top < A.top + A.t * 1.4 + 70 && top + th * 1.4 + 70 > A.top)) continue;
    island(P, cx, top, w, th, I.style);
    placed.push({ cx, top, w, t: th });
    k++;
  }
}
// 구역 양 끝 벽 (지상: 땅 위 14줄까지 바위 절벽, 동굴: 위아래 전체)
function zoneEnds(P) {
  const { N, WP, kind } = P;
  const topY = kind === "ground" ? (FLOOR - 14) * TS : -40;
  for (const side of [0, 1]) {
    const so = side * 37.7;
    const sdf = (x, y) => {
      const xx = side ? WP - x : x;
      const face = 40 + 9 * N.fbm1(y / 34 + so, 2) + 4 * N.n1(y / 9 + so);
      const tp = topY + 10 * N.fbm1(xx / 20 + so + 3, 2);
      const a = Math.max(33, face) - xx;
      return Math.min(a, y - tp + (xx < 20 ? 8 : 0));
    };
    side ? addShape(P, WP - 70, topY - 20, WP, P.HP, sdf) : addShape(P, 0, topY - 20, 70, P.HP, sdf);
  }
}

// ── 방과 통로 동굴 (8px 블록 단위) ─────────────────────
// 바닥이 평평한 방(넓은 홀·계단식 방·발판 있는 높은 방·작은 방)을 놓고, 평평한 통로 + 45° 계단 + 발판 있는 세로굴로 잇는다.
// 떠 있는 바위 조각·뾰족한 돌기·갈 수 없는 구멍은 만들지 않는다.
// o: { top(x) 방을 놓아도 되는 가장 높은 줄, bot 가장 낮은 바닥 줄, pre: 미리 정한 방·입구(pt: 점), target: 방 개수 }
function roomCaves(P, C, o) {
  // 동굴만의 난수 (동굴을 고쳐도 하늘섬·지상 배치가 바뀌지 않게)
  const R = rng(P.seed ^ 0x5ca7e1), { cell, NX, NY } = C;
  // probe: 파지 않고 세기만 (통로 후보 비교용). floor = 다른 굴의 바닥을 지우는 칸, air = 이미 빈 칸
  let probe = null;
  const setA = (x, y) => {
    if (x < 1 || y < 1 || x >= NX - 1 || y >= NY - 1) return;
    const k = y * NX + x;
    if (!probe) return void (cell[k] = -1);
    if (cell[k] === -1) probe.air++;
    else if (cell[k - NX] === -1) probe.floor++;
  };
  const setR = (x, y) => x >= 0 && y >= 0 && x < NX && y < NY && (cell[y * NX + x] = 1);
  const isA = (x, y) => x >= 0 && y >= 0 && x < NX && y < NY && cell[y * NX + x] === -1;
  // 오르는 간격: 1단 점프(75px)에 여유를 두고 8칸(64px) 이하
  const STEP = 8;
  const rooms = [...o.pre];
  // 방이 들어갈 자리 (다른 방과 m칸 떨어져, 위쪽 한계 아래)
  const fits = (x0, x1, y0, y1, m) => {
    if (x0 < 6 || x1 > NX - 6 || y1 > o.bot || y0 < 2) return false;
    for (let x = x0 - 2; x <= x1 + 2; x += 3) if (y0 < o.top(Math.min(NX - 1, Math.max(0, x)))) return false;
    for (const r of rooms) if (x0 < r.x1 + m && x1 > r.x0 - m && y0 < r.fy + m && y1 > r.fy - (r.hh ?? r.h) - m) return false;
    return true;
  };
  // 블록 걸음 잡음: 3~8칸마다 최대 d칸씩 바뀐다 (1칸 돌기·홈 없이 큼직한 들쭉날쭉)
  const walk = (n, lo, hi, d = 1, r0 = 3, r1 = 8) => {
    const a = new Int16Array(n);
    let v = R.int(lo, hi), run = 0;
    for (let i = 0; i < n; i++) {
      if (run-- <= 0) ((v = clamp(v + R.int(-d, d), lo, hi)), (run = R.int(r0, r1)));
      a[i] = v;
    }
    return a;
  };
  // 바위는 모든 굴을 판 뒤에 놓는다 (나중에 판 통로가 지우지 않게)
  const later = [];
  // 굴뚝: 좌우 벽이 번갈아 튀어나온다. 튀어나온 벽의 윗면이 디딤 단 (STEP 이하 간격, 떠 있는 발판 없음)
  // 칸 xl..xr-1, 위 바닥 줄 yUp(upSide 쪽 바닥과 이어진다), 아래 바닥 줄 yDn. 맨 아래 칸은 upSide 쪽만 튀어나온다
  // tr: 돌출 아랫면 쐐기 기울기 (아래로 한 줄마다 tr칸씩 벽 쪽으로 좁아진다 → 밑의 단에서 뛰어오를 머리 자리)
  const chimneyRock = (xl, xr, yUp, yDn, upSide, oMin, oMax, tr = 1) => {
    const D = yDn - yUp, W = xr - xl;
    if (D <= 12) return;
    let n = Math.ceil(D / STEP);
    n % 2 || n++;
    const o = [R.int(oMin, oMax), R.int(oMin, oMax)];
    let yb = yDn, rem = D;
    for (let k = 0; k < n; k++) {
      const left = n - k, lo = Math.max(4, rem - STEP * (left - 1)), hi = Math.min(STEP, rem - 4 * (left - 1));
      const hk = k === n - 1 ? rem : clamp(Math.round(rem / left) + R.int(-1, 1), lo, hi);
      rem -= hk;
      // 이 칸 위 경계의 디딤 단이 있는 쪽 = 튀어나오는 쪽
      const S = (n - k - 1) % 2 === 0 ? upSide : 1 - upSide;
      // 바로 아래 단(반대쪽)과의 가로 틈 4~5칸: 1단 점프 꼭대기 거리 (멀면 2단 점프가 위 돌출에 머리를 박는다)
      o[S] = k === 0 ? R.int(oMin, oMax) : clamp(W - R.int(4, 5) - o[1 - S], 3, W - 7);
      const top = yb - hk;
      for (let y = top; y < yb; y++) {
        const fb = yb - 1 - y, w = k === 0 ? o[S] : Math.max(1, o[S] - tr * (hk - 1 - fb));
        for (let i = 0; i < w; i++) setR(S ? xr - 1 - i : xl + i, y);
      }
      yb = top;
    }
  };
  // 매달린 바위(천장에서 내려온 굵은 기둥, 아래는 계단식으로 좁아진다). 바닥과 gap칸 이상 띄운다
  const hanging = (xc, yc, yEnd, w) => {
    for (let y = yc; y < yEnd; y++) {
      const k = yEnd - y, hw = Math.min(w, 1 + Math.floor(k / 2) + 1);
      for (let x = xc - hw; x <= xc + hw; x++) setR(x, y);
    }
  };
  // 바닥 둔덕 (낮은 단, 옆은 계단): 높이 ht ≤ 5칸
  const mound = (xa, xb, fy, ht) => {
    for (let k = 0; k < ht; k++) {
      const a = xa + k * R.int(1, 3), b = xb - k * R.int(1, 3);
      if (b - a < 4) break;
      for (let x = a; x < b; x++) setR(x, fy - 1 - k);
    }
  };
  // 방 파기: 바닥 fy(바위 줄), 칸 x0..x1-1, 높이 h
  // 벽돌 (던전): 뒷벽은 공기에, 재질은 둘레 바위 2칸에
  const brick = (x0, y0, x1, y1) => {
    if (probe) return;
    P.walls.push({ x0: x0 * BLK, y0: y0 * BLK, x1: x1 * BLK, y1: y1 * BLK, m: "brick" });
    P.mats.push({ x0: (x0 - 2) * BLK, y0: (y0 - 2) * BLK, x1: (x1 + 2) * BLK, y1: (y1 + 2) * BLK, m: "brick" });
  };
  // 큰 자연 동굴: 들쭉날쭉한 높은 천장, 바닥은 낮은 단들 (단 사이 STEP 이하), 매달린 바위, 아래가 뚫린 바위 기둥
  const N = P.N, so = R() * 99;
  const carveGreat = (r) => {
    const { x0, x1, fy, h } = r, w = x1 - x0;
    const tops = new Int32Array(w), lv = new Int32Array(w);
    let hold = 0, run = 0;
    for (let x = x0; x < x1; x++) {
      const u = (x - x0 + 0.5) / w, d = Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
      if (run-- <= 0) ((hold = Math.round(h * (0.4 + 0.6 * d) + h * 0.38 * N.fbm1(x / 70 + so, 3))), (run = R.int(2, 5)));
      tops[x - x0] = fy - Math.max(14, hold);
    }
    // 바닥 단: 양 끝(문)은 바닥 그대로
    let l = 0;
    for (let x = x0 + R.int(10, 18); x < x1 - 12; ) {
      const seg = R.int(16, 40), nl = clamp(l + R.int(2, 5) * (l === 0 || R() < 0.55 ? 1 : -1), 0, 14);
      const xe = Math.min(x1 - 12, x + seg);
      for (let xx = x; xx < xe; xx++) lv[xx - x0] = x1 - 12 - xx < 14 ? Math.min(nl, 4) : nl;
      l = nl;
      x = xe;
    }
    let topMin = fy;
    for (let x = x0; x < x1; x++) {
      const t = tops[x - x0];
      topMin = Math.min(topMin, t);
      for (let y = t; y < fy - lv[x - x0]; y++) setA(x, y);
    }
    r.hh = fy - topMin;
    // 매달린 바위 덩어리
    for (let k = R.int(3, 5); k > 0; k--) {
      const cx = R.int(x0 + 20, x1 - 20), yEnd = fy - lv[cx - x0] - R.int(14, 24);
      if (yEnd - tops[cx - x0] > 6) hanging(cx, tops[cx - x0] - 2, yEnd, R.int(5, 10));
    }
    // 아래가 뚫린 굵은 바위 기둥 (아치 높이 11~14칸)
    if (w > 200 && R() < 0.8) {
      const pw = R.int(10, 16), px = R.int(x0 + 40, x1 - 40 - pw), aH = R.int(11, 14);
      for (let x = px; x < px + pw; x++) {
        const u = ((x - px + 0.5) / pw) * 2 - 1, b = fy - lv[x - x0] - aH - Math.round(3 * Math.sqrt(Math.max(0, 1 - u * u)));
        for (let y = tops[x - x0] - 2; y < b; y++) setR(x, y);
      }
    }
    // 물웅덩이
    if (R() < 0.5) {
      const pw = R.int(14, 26), px = R.int(x0 + 24, x1 - 24 - pw), base = fy - lv[px - x0];
      let flat = true;
      for (let x = px; x < px + pw; x++) fy - lv[x - x0] !== base && (flat = false);
      if (flat) {
        const d = R.int(3, 6);
        for (let x = px; x < px + pw; x++) for (let y = base; y < base + d; y++) setA(x, y);
        P.specReq.push({ x0: px, y0: base, x1: px + pw, y1: base + d, k: "water" });
      }
    }
  };
  // 던전 방: 네모난 방, 모서리는 계단식으로 깎고 넓은 방은 계단식 둥근 천장. 벽돌 벽
  const carveDun = (r) => {
    const { x0, x1, fy, h, type } = r, w = x1 - x0, ch = R.int(2, 3);
    const vault = (type === "hall" || type === "tiered") && R() < 0.6 ? R.int(3, 6) * 2 : 0;
    let topMin = fy;
    for (let x = x0; x < x1; x++) {
      const e = Math.min(x - x0, x1 - 1 - x), u = ((x - x0 + 0.5) / w) * 2 - 1;
      const v = vault ? Math.floor((vault * Math.sqrt(Math.max(0, 1 - u * u))) / 2) * 2 : 0;
      const top = fy - h - v + Math.max(0, ch - e);
      topMin = Math.min(topMin, top);
      for (let y = top; y < fy; y++) setA(x, y);
    }
    r.hh = fy - topMin;
    // 기둥 (뒷벽 그림만, 뒷벽보다 먼저)
    if (w > 60 && !probe)
      for (let x = x0 + R.int(10, 16); x < x1 - 10; x += R.int(18, 28)) P.walls.push({ x0: x * BLK, y0: topMin * BLK, x1: (x + 3) * BLK, y1: fy * BLK, m: "rock" });
    brick(x0, topMin, x1, fy);
    if (type === "tiered") {
      const a = x0 + 8, b = x1 - 8, n = R.int(3, 4);
      let l = 0;
      for (let k = 0; k < n; k++) {
        const xs = a + Math.round(((b - a) * k) / n), xe = a + Math.round(((b - a) * (k + 1)) / n);
        l = k === n - 1 ? Math.min(l, 4) : clamp(l + R.int(2, 4) * (l === 0 || R() < 0.6 ? 1 : -1), 2, 10);
        for (let x = xs; x < xe; x++) for (let y = fy - l; y < fy; y++) setR(x, y);
      }
    } else if (type === "hall") {
      // 가운데 단 (계단 2칸씩) 또는 물웅덩이
      if (R() < 0.5) {
        const dw = R.int(16, Math.max(17, Math.floor(w * 0.4))), dx = x0 + Math.floor((w - dw) / 2), nk = R.int(2, 3);
        for (let k = 0; k < nk; k++) for (let x = dx + 2 * k; x < dx + dw - 2 * k; x++) for (let y = fy - 2 * k - 2; y < fy - 2 * k; y++) setR(x, y);
      } else {
        const pw = R.int(12, 22), px = x0 + R.int(10, w - 10 - pw), d = R.int(3, 5);
        for (let x = px; x < px + pw; x++) for (let y = fy; y < fy + d; y++) setA(x, y);
        P.specReq.push({ x0: px, y0: fy, x1: px + pw, y1: fy + d, k: "water" });
      }
    } else if (type === "tall") {
      const oM = Math.floor((w - 10) / 2), sd = R() < 0.5 ? 0 : 1;
      later.push(() => chimneyRock(x0, x1, fy - h + 4, fy, sd, oM - 2, oM, 99));
    }
  };
  const carveRoom = (r) => {
    if (r.type === "great") return carveGreat(r);
    if (r.dun) return carveDun(r);
    const { x0, x1, fy, h, type } = r, w = x1 - x0;
    // 천장: 한쪽으로 치우친 둥근 지붕 + 큼직한 들쭉날쭉
    const pk = R.range(0.2, 0.8), dome = type === "tall" || type === "small" ? h * 0.12 : h * R.range(0.15, 0.35);
    const jag = walk(w, -2, 2, 1, 3, 9);
    // 벽: 바닥 위 3줄부터 바깥으로 0~3칸 패인다
    const wl = walk(h + 40, 0, 3, 1, 3, 7), wr = walk(h + 40, 0, 3, 1, 3, 7);
    let topMin = fy;
    for (let x = x0; x < x1; x++) {
      const u = (x - x0 + 0.5) / w, t = u < pk ? (u - pk) / pk : (u - pk) / (1 - pk);
      const top = fy - h - Math.round(dome * Math.max(0, 1 - t * t)) - jag[x - x0];
      topMin = Math.min(topMin, top);
      for (let y = top; y < fy; y++) setA(x, y);
    }
    r.hh = fy - topMin;
    for (let y = topMin + 2; y < fy - 3; y++) {
      const k = fy - y;
      if (k >= wl.length) continue;
      // 패인 벽은 위쪽 천장선 아래에서만
      for (let d = 1; d <= wl[k]; d++) isA(x0, y - 1) && isA(x0, y + 1) && setA(x0 - d, y);
      for (let d = 1; d <= wr[k]; d++) isA(x1 - 1, y - 1) && isA(x1 - 1, y + 1) && setA(x1 - 1 + d, y);
    }
    if (type === "tiered") {
      // 여러 단: 단 사이 2~4블록 (한 번 점프로 오른다). 문 옆(양 끝 8칸)은 바닥 그대로
      const a = x0 + 8, b = x1 - 8, n = R.int(3, 5);
      let lv = 0;
      for (let k = 0; k < n; k++) {
        const xs = a + Math.round(((b - a) * k) / n), xe = a + Math.round(((b - a) * (k + 1)) / n);
        lv = k === n - 1 ? Math.min(lv, R.int(2, 4)) : clamp(lv + R.int(2, 4) * (lv === 0 || R() < 0.6 ? 1 : -1), 2, 12);
        for (let x = xs; x < xe; x++) for (let y = fy - lv; y < fy; y++) setR(x, y);
      }
    } else if (type === "hall") {
      // 넓은 홀: 낮은 둔덕·물웅덩이·매달린 바위 기둥
      const nf = Math.max(1, Math.round(w / 60));
      for (let k = 0; k < nf; k++) {
        const v = R(), cx = x0 + Math.round(((k + 0.5) / nf) * w) + R.int(-6, 6);
        if (v < 0.35) mound(cx - R.int(6, 12), cx + R.int(6, 12), fy, R.int(2, 5));
        else if (v < 0.6 && h >= 18) {
          // 매달린 바위: 바닥 위 9~12칸 띄워서 (머리·2단 점프 자리)
          const yTop = fy - h - 6, yEnd = fy - R.int(9, 12);
          let yc = yTop;
          while (yc < yEnd && isA(cx, yc)) yc++;
          if (yEnd - yc >= 4) hanging(cx, yTop, yEnd, R.int(3, 5));
        } else if (v < 0.8) {
          const pw = R.int(10, 22), px = clamp(cx - (pw >> 1), x0 + 6, x1 - 6 - pw), d = R.int(3, 6);
          for (let x = px; x < px + pw; x++) for (let y = fy; y < fy + d; y++) setA(x, y);
          P.specReq.push({ x0: px, y0: fy, x1: px + pw, y1: fy + d, k: "water" });
        }
      }
      if (R() < 0.3) {
        const bx = R() < 0.5 ? x0 + 2 : x1 - 6;
        P.specReq.push({ x0: bx, y0: fy - 1, x1: bx + 4, y1: fy, k: "bounce" });
      }
    } else if (type === "cavern") {
      // 여러 층 공간: 가운데쯤 계단식 바위 언덕 (단마다 STEP 이하, 양쪽 비탈 길이가 다르다). 문 옆은 비운다
      const levels = Math.min(R.int(3, 6), Math.floor((h - 16) / STEP));
      let a = x0 + 10 + R.int(0, Math.floor(w * 0.15)), b = x1 - 10 - R.int(0, Math.floor(w * 0.15)), y = fy;
      for (let k = 0; k < levels && b - a > 8; k++) {
        const st = R.int(5, STEP);
        for (let yy = y - st; yy < y; yy++) for (let x = a; x < b; x++) setR(x, yy);
        y -= st;
        const cut = b - a - R.int(6, 10);
        const fl = Math.round(cut * R.range(0.2, 0.8));
        a += Math.max(4, fl);
        b -= Math.max(4, cut - fl);
      }
      if (R() < 0.5) {
        const cx = x0 + Math.round(w * R.range(0.4, 0.6)), yEnd = fy - R.int(10, 14);
        hanging(cx, fy - h - 8, yEnd, R.int(3, 6));
      }
    } else if (type === "tall") {
      // 높은 방: 양쪽 벽이 번갈아 튀어나온 큰 단 (지그재그로 오른다)
      const oM = Math.floor((w - 12) / 2), ys = fy - h + 4, sd = R() < 0.5 ? 0 : 1;
      later.push(() => chimneyRock(x0, x1, ys, fy, sd, oM - 2, oM, Math.max(2, Math.round(oM / 5))));
    }
  };
  // [종류, 확률, 너비, 높이]
  const TYPES = [
    ["hall", 0.32, [90, 136], [26, 40]],
    ["cavern", 0.18, [110, 136], [40, 50]],
    ["tiered", 0.18, [90, 136], [26, 38]],
    ["tall", 0.14, [44, 64], [90, 124]],
    ["small", 0.18, [44, 70], [18, 26]],
  ];
  const pickT = () => {
    let v = R();
    for (const T of TYPES) if ((v -= T[1]) <= 0) return T;
    return TYPES[0];
  };
  for (const r of rooms) !r.pt && carveRoom(r);
  // 배치: 던전 구역(반듯한 격자, 먼저 자리를 잡는다) → 큰 자연 동굴 → 나머지 자연 방(줄 없이 흩어서, 크기·높이 제각각)
  const SW = 160, SH = 72;
  const ncol = Math.floor((NX - 16) / SW), nrow = Math.floor((o.bot - 4) / SH);
  for (let k = P.kind === "cave" ? 2 : 1, tries = 0; k > 0 && tries < 20; tries++) {
    const cw = R.int(2, 3), c0 = R.int(0, Math.max(0, ncol - cw)), r0 = R.int(0, Math.max(0, Math.min(nrow - 2, 3)));
    const made = [];
    for (let c = c0; c < c0 + cw; c++)
      for (let rr = r0; rr < r0 + 2; rr++) {
        const sx = 8 + c * SW, sy = o.bot - rr * SH;
        for (let t = 0; t < 6; t++) {
          const T = [TYPES[0], TYPES[2], TYPES[3], TYPES[4]][R.int(0, 3)];
          const w = Math.min(R.int(T[2][0], T[2][1]), SW - 24), h = Math.min(R.int(T[3][0], T[3][1]), T[0] === "tall" ? 2 * SH - 16 : SH - 14);
          const x0 = sx + R.int(8, SW - 16 - w), fy = (sy - R.int(2, 6)) & ~1;
          if (!fits(x0, x0 + w, fy - h - 16, fy + 3, 8)) continue;
          const r = { x0, x1: x0 + w, fy, h, type: T[0], dun: 1 };
          rooms.push(r);
          made.push(r);
          carveRoom(r);
          break;
        }
      }
    made.length >= 2 && k--;
  }
  // 큰 자연 동굴
  {
    const want = Math.max(1, Math.round((NX * (o.bot - 40)) / 260000));
    for (let k = 0, t = 0; k < want && t < 300; t++) {
      const w = R.int(240, 400), h = R.int(44, 80), x0 = R.int(10, NX - 10 - w), fy = R.int(h + 30, o.bot) & ~1;
      if (!fits(x0, x0 + w, fy - h - 24, fy + 3, 14)) continue;
      const r = { x0, x1: x0 + w, fy, h, type: "great" };
      rooms.push(r);
      carveRoom(r);
      k++;
    }
  }
  // 나머지 자연 방: 아무 데나 (격자 줄 없이)
  const NT = [
    ["hall", 0.38, [60, 180], [18, 46]],
    ["cavern", 0.2, [100, 200], [36, 62]],
    ["tiered", 0.2, [80, 170], [24, 44]],
    ["small", 0.22, [30, 70], [14, 28]],
  ];
  for (let t = 0; t < 5000 && rooms.length < o.target; t++) {
    let v = R(), T = NT[0];
    for (const q of NT) if ((v -= q[1]) <= 0) { T = q; break; }
    const w = R.int(T[2][0], T[2][1]), h = R.int(T[3][0], T[3][1]);
    const x0 = R.int(8, NX - 8 - w), fy = R.int(h + 20, o.bot) & ~1;
    if (!fits(x0, x0 + w, fy - h - Math.ceil(h * 0.35) - 3, fy + 3, 12)) continue;
    const r = { x0, x1: x0 + w, fy, h, type: T[0] };
    rooms.push(r);
    carveRoom(r);
  }
  // ── 통로 ──
  const H = () => R.int(12, 16);
  // 평평한 통로 (천장은 큼직하게 들쭉날쭉)
  let dunLink = 0;
  const horiz = (xa, xb, fy, h) => {
    const a = Math.min(xa, xb), b = Math.max(xa, xb), jg = dunLink ? new Int16Array(b - a + 1) : walk(b - a + 1, 0, 2, 1, 4, 10);
    dunLink && brick(a, fy - h, b + 1, fy);
    for (let x = a; x <= b; x++) {
      for (let y = fy - h - jg[x - a]; y < fy; y++) setA(x, y);
      // 바닥 줄이 이미 비어 있으면 (다른 굴 위를 지난다) 바닥이 없는 통로
      probe && isA(x, fy) && probe.hole++;
    }
  };
  // 계단 (한 칸씩 오르내린다 → 걸어서 간다). 사이사이 평평한 쉼터(slack칸까지), 천장은 들쭉날쭉. 끝 x를 돌려준다
  const stairs = (x, y, dir, n, dn, h, slack = 0) => {
    let xx = x, f = y, left = n, sl = slack, jg = 0, run = 0;
    const col = (fPrev) => {
      if (run-- <= 0) ((jg = dunLink ? 0 : R.int(0, 3)), (run = R.int(3, 8)));
      dunLink && brick(xx, Math.min(f, fPrev) - h, xx + 1, f);
      for (let yy = Math.min(f, fPrev) - h - jg; yy < f; yy++) setA(xx, yy);
      probe && isA(xx, f) && probe.hole++;
    };
    col(f);
    while (left > 0) {
      const r = Math.min(left, R.int(4, 12));
      for (let i = 0; i < r; i++) ((xx += dir), (f += dn), col(f - dn));
      left -= r;
      if (left > 0 && sl > 0) {
        const L = Math.min(sl, R.int(2, 7));
        for (let i = 0; i < L; i++) ((xx += dir), col(f));
        sl -= L;
      }
    }
    return xx;
  };
  // 굴뚝 길: 위 통로는 가운데까지, 아래 통로는 굴뚝 벽 밖 2칸에서 낮은 문(6칸)으로 들어온다
  const chimney = (xa, ya, xb, yb, xm, h) => {
    const up = ya < yb, xU = up ? xa : xb, yU = Math.min(ya, yb), xL = up ? xb : xa, yL = Math.max(ya, yb);
    const upSide = xU < xm ? 0 : 1, lowSide = 1 - upSide;
    const hw = R.int(6, 8), xl = xm - hw, xr = xm + hw;
    horiz(xU, xm, yU, h);
    const xo = lowSide ? xr + 2 : xl - 3;
    horiz(xL, xo, yL, h);
    for (let x = Math.min(xm, xo); x <= Math.max(xm, xo); x++) for (let y = yL - 6; y < yL; y++) setA(x, y);
    for (let y = yU - h; y < yL; y++) for (let x = xl; x < xr; x++) setA(x, y);
    dunLink && brick(xl, yU - h, xr, yL);
    const tr = dunLink ? 99 : 1;
    probe || later.push(() => chimneyRock(xl, xr, yU, yL, upSide, 3, 5, tr));
  };
  // A 바닥(xa, ya) → B 바닥(xb, yb): 평평한 통로, 높이 차는 계단(자리가 되면) 또는 세로굴
  // 후보 경로를 여럿 만들어 다른 굴의 바닥을 가장 덜 지우는 것을 판다 (지운 바닥 = 공중에 뜬 계단·통로 끝)
  const route = (xa, ya, xb, yb, pref = 0) => {
    const h = H(), dir = xb >= xa ? 1 : -1, dx = Math.abs(xb - xa), dy = yb - ya, ady = Math.abs(dy);
    if (ady === 0) return horiz(xa, xb, ya, h);
    const cands = [];
    if (ady <= 4 && dx > 8)
      // 낮은 턱 (한 번 점프): 통로 가운데에 단 하나
      for (let k = 0; k < 4; k++) {
        const xs = xa + dir * R.int(3, dx - 3);
        cands.push(() => (horiz(xa, xs, ya, h), horiz(xs, xb, yb, h)));
      }
    else {
      if (ady <= dx - 2)
        for (let k = 0; k < 5; k++) {
          const sl = dx - ady, pre = Math.round(sl * R.range(0, 0.6)), land = Math.round((sl - pre) * R.range(0.3, 1));
          const xs = xa + dir * pre;
          cands.push(() => {
            horiz(xa, xs, ya, h);
            const xe = stairs(xs, ya, dir, ady, Math.sign(dy), h, land);
            horiz(xe, xb, yb, h);
          });
        }
      for (let k = 0; k < 5; k++) {
        const xm = xa + dir * Math.round(clamp(dx * (0.1 + 0.2 * k), Math.min(16, dx / 2), Math.max(dx / 2, dx - 16)));
        const c = () => chimney(xa, ya, xb, yb, xm, h);
        c.pen = cands.length ? (pref ? 1e6 : dunLink ? 60 : 600) : 0;
        cands.push(c);
      }
    }
    let best = null, bs = 1e18;
    for (const c of cands) {
      probe = { air: 0, floor: 0, hole: 0 };
      c();
      const sc = probe.floor * 4 + probe.hole * 3 + probe.air * 0.4 + R() * 2 + (c.pen ?? 0);
      probe = null;
      sc < bs && ((bs = sc), (best = c));
    }
    best();
  };
  const door = (r, dir) => (r.pt ? r.x0 : dir > 0 ? r.x1 : r.x0 - 1);
  const link = (A, B) => {
    dunLink = A.dun && B.dun ? 1 : 0;
    const [L, Rr] = A.x0 + A.x1 <= B.x0 + B.x1 ? [A, B] : [B, A];
    if (L.x1 <= Rr.x0 || L.pt || Rr.pt) return route(door(L, 1), L.fy, door(Rr, -1), Rr.fy, L.pt || Rr.pt ? 1 : 0);
    // 위아래로 겹친 방: 오른쪽 바깥으로 돌아서
    const xo = Math.min(NX - 14, Math.max(L.x1, Rr.x1) + R.int(12, 18));
    route(L.x1, L.fy, xo, Rr.fy);
    horiz(Rr.x1, xo, Rr.fy, H());
  };
  // 최소 신장 트리 (가로 거리 + 세로 거리×2) + 덤으로 몇 개 더 (고리 길)
  const cx = (r) => (r.x0 + r.x1) / 2;
  // 자연 동굴끼리는 비탈 굴로 이을 수 있는 짝을 고른다 (높이 차가 가로 틈보다 크면 세로굴이 필요하다)
  const cost = (a, b) => {
    const dy = Math.abs(a.fy - b.fy), gap = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1));
    return Math.abs(cx(a) - cx(b)) + 2 * dy + (!(a.dun && b.dun) && dy > 4 && dy > gap - 2 ? 3000 : 0);
  };
  const n = rooms.length;
  const inT = new Uint8Array(n), best = new Float64Array(n).fill(1e18), from = new Int32Array(n).fill(-1);
  best[0] = 0;
  const edges = [];
  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i;
    inT[u] = 1;
    from[u] >= 0 && edges.push([from[u], u]);
    for (let i = 0; i < n; i++)
      if (!inT[i]) {
        const c = cost(rooms[u], rooms[i]);
        c < best[i] && ((best[i] = c), (from[i] = u));
      }
  }
  for (let i = 0; i < n; i++) {
    if (rooms[i].pt || R() > 0.3) continue;
    let j = -1;
    for (let k = 0; k < n; k++) if (k !== i && !rooms[k].pt && !edges.some(([a, b]) => (a === i && b === k) || (a === k && b === i)) && (j < 0 || cost(rooms[i], rooms[k]) < cost(rooms[i], rooms[j]))) j = k;
    j >= 0 && cost(rooms[i], rooms[j]) < 300 && edges.push([i, j]);
  }
  for (const [a, b] of edges) link(rooms[a], rooms[b]);
  dunLink = 0;
  for (const fn of later) fn();
  later.length = 0;
  // 방 바닥 줄은 바위로 (통로·세로굴이 바닥에 낸 구멍 메우기). 물웅덩이 자리는 빼고
  const pools = P.specReq.filter((q) => q.k === "water");
  for (const r of rooms)
    if (!r.pt)
      for (let x = r.x0; x < r.x1; x++) pools.some((q) => x >= q.x0 && x < q.x1 && q.y0 === r.fy) || isA(x, r.fy - 1) && setR(x, r.fy);
  fixDrops(C, R, o.inCave ?? (() => true));
  rooms.route = (...a) => (route(...a), later.forEach((fn) => fn()), (later.length = 0));
  // 고치기에서 쓴다: 끊긴 두 곳 사이에 굴을 하나 더 판다 (칸 좌표, 바닥 줄)
  P.caveRoute = (xa, ya, xb, yb) => {
    dunLink = 0;
    rooms.route(xa, ya, xb, yb);
  };
  return rooms;
}
// 오를 수 없는 낭떠러지 고치기 (칸 단위): 바닥 끝 아래가 8칸(64px)보다 깊고 근처에 디딜 데도 없으면
// 아래 바닥에 바위 계단 더미(단마다 8칸 이하)를 쌓는다. 끝 밑이 얕게 파인 곳은 메워 벽으로 만든다
function fixDrops(C, R, inCave) {
  const { cell, NX, NY } = C;
  const solid = (x, y) => x < 0 || y < 0 || x >= NX || y >= NY || cell[y * NX + x] === 1;
  const stand = (x, y) => solid(x, y) && !solid(x, y - 1) && !solid(x, y - 2) && !solid(x, y - 3);
  const put = (x, y) => x >= 0 && y >= 0 && x < NX && y < NY && (cell[y * NX + x] = 1);
  let fixes = 0;
  for (let y = 4; y < NY - 2; y++)
    for (let x = 2; x < NX - 2; x++) {
      if (!stand(x, y)) continue;
      for (const dir of [-1, 1]) {
        const xn = x + dir;
        if (solid(xn, y) || solid(xn, y + 1)) continue;
        let y2 = y + 1;
        while (y2 < NY && !solid(xn, y2)) y2++;
        const d = y2 - y;
        if (d <= 8 || y2 >= NY - 1 || !inCave(xn, y2)) continue;
        // 근처(14칸 안, 8칸 아래까지)에 디딜 곳이 있으면 거기서 뛰어오른다
        let ok = false;
        for (let k = 1; k <= 14 && !ok; k++) for (let yy = y + 1; yy <= y + 8 && !ok; yy++) stand(x + dir * k, yy) && (ok = true);
        if (ok) continue;
        // 끝 밑이 비었다(처마): 얕으면(10칸 이하) 메워서 벽으로
        let wall = true;
        for (let yy = y + 1; yy < y2; yy++) solid(x, yy) || (wall = false);
        if (!wall) {
          let p = 0;
          while (p < 12 && !solid(x - dir * p, y + 1)) p++;
          if (p > 10) continue;
          for (let k = 0; k < p; k++) for (let yy = y + 1; yy < NY && !solid(x - dir * k, yy); yy++) put(x - dir * k, yy);
        }
        // 계단 더미: 단 n개, 끝에 가까울수록 높다
        const n = Math.ceil(d / 8) - 1;
        let xs = xn, good = true;
        const plan = [];
        for (let k = 1; k <= n && good; k++) {
          const top = y + Math.round((k * d) / (n + 1)), w = R.int(4, 7);
          for (let i = 0; i < w; i++) {
            const xx = xs + dir * i;
            // 아래 바닥이 같은 높이(±1)이고 위가 비어 있어야
            let f = top;
            while (f < NY && !solid(xx, f)) f++;
            if (Math.abs(f - y2) > 1 || solid(xx, top - 4)) good = false;
            plan.push([xx, top, f]);
          }
          xs += dir * w;
        }
        if (!good) continue;
        for (const [xx, top, f] of plan) for (let yy = top; yy < f; yy++) put(xx, yy);
        fixes++;
      }
    }
  return fixes;
}
// 떠 있는 작은 바위 조각(벽·바닥과 이어지지 않은 것)과 1블록 돌기·홈을 없앤다 (keepRows 위 줄은 건드리지 않는다)
function cleanCells(C, keepRows) {
  const { cell, NX, NY } = C;
  const seen = scratch("CC", Uint8Array, NX * NY).fill(0), q = scratch("CQ", Int32Array, NX * NY);
  for (let s = keepRows * NX; s < NX * NY; s++) {
    if (seen[s] || cell[s] !== 1) continue;
    let h = 0, t = 0, border = false;
    q[t++] = s;
    seen[s] = 1;
    while (h < t) {
      const k = q[h++], y = (k / NX) | 0, x = k - y * NX;
      (x === 0 || y <= keepRows || x === NX - 1 || y === NY - 1) && (border = true);
      if (x > 0 && !seen[k - 1] && cell[k - 1] === 1) ((seen[k - 1] = 1), (q[t++] = k - 1));
      if (x < NX - 1 && !seen[k + 1] && cell[k + 1] === 1) ((seen[k + 1] = 1), (q[t++] = k + 1));
      if (y > 0 && !seen[k - NX] && cell[k - NX] === 1) ((seen[k - NX] = 1), (q[t++] = k - NX));
      if (y < NY - 1 && !seen[k + NX] && cell[k + NX] === 1) ((seen[k + NX] = 1), (q[t++] = k + NX));
    }
    // 작은 덩어리만 지운다 (방 발판·세로굴 발판은 벽에 붙어 있어 남는다)
    if (!border && t < 24) for (let m = 0; m < t; m++) cell[q[m]] = -1;
  }
  for (let it = 0; it < 2; it++)
    for (let y = keepRows + 1; y < NY - 1; y++)
      for (let x = 1; x < NX - 1; x++) {
        const k = y * NX + x, v = cell[k];
        const nn = (cell[k - 1] !== v) + (cell[k + 1] !== v) + (cell[k - NX] !== v) + (cell[k + NX] !== v);
        nn >= 3 && (cell[k] = -v);
      }
}

// ── 동굴 ─────────────────────────────────────────────
// 동굴 구역 짜임 (설계도 cave.style): 같은 생성기로 지역마다 다른 동굴
//   drip 드립스톤: 큰 공동이 많고 천장이 높다 · 매달린 종유 바위가 빽빽 · 웅덩이·호수 바닥 · 들쭉날쭉한 굴
//   mine 아이언베인: 옛 갱도 — 반듯한 바닥·천장의 방, 곧은 굴, 세로 갱도 넷, 나무 판자 벽 (after)
//   root 루트홀로우: 둥근 굴방 · 봉긋한 바닥 · 굵은 뿌리 기둥 · 구불구불한 굴
const CAVE_STYLE = {
  drip: {
    maxGrand: 6, shafts: 2, gap: [100, 130], band: 0.35, ceil: ["dome", "double", "dome", "slant"], hang: 2.2, jag: 4, tunH: [11, 14],
    k: { large: ["lake", "pillared", "lake", "tiered", "hall"], medium: ["lake", "hall", "tiered", "hall"] },
    fl: { hall: ["flat", "basin", "steps"], grand: ["basin", "steps", "basin", "mound"] },
  },
  mine: {
    maxGrand: 1, shafts: 4, gap: [84, 100], band: 0.8, ceil: ["flat"], ceilAmp: 0.15, hang: 0, jag: 0, tunH: [10, 11],
    k: { large: ["pillared", "hall", "tiered", "hall"], medium: ["hall", "tiered", "hall"], tall: ["tiered"] },
    fl: { hall: ["flat", "flat", "steps"], pillared: ["flat"], grand: ["flat", "steps"], tiered: ["steps"] },
    wood: 0.62,
  },
  root: {
    maxGrand: 3, shafts: 2, gap: [90, 120], band: 0.3, ceil: ["dome", "dome", "double"], hang: 0.6, jag: 2, tunH: [10, 12], pillars: 1,
    k: { large: ["pillared", "pillared", "hall", "lake"], medium: ["hall", "hall", "lake"] },
    fl: { hall: ["mound", "flat", "basin"], pillared: ["mound", "flat"], grand: ["mound", "basin"] },
  },
};
function buildCave(P) {
  const { WP, R, arenaFrom, F } = P;
  const base = FLOOR * TS, bottom = (P.Ft - 5) * TS;
  F.d.fill(12);
  const C = cellsOf(P);
  const bot = Math.floor((bottom - 24) / BLK) & ~1, lim = Math.min(WP, arenaFrom);
  const NXl = Math.floor(lim / BLK) - 6;
  const ST = CAVE_STYLE[P.bp?.cave?.style] ?? null;
  // 손 설계 동굴 구역: 방·입구·▲▼ 방을 설계도대로, 위아래는 비탈 굴과 떨어지는 구멍만 (세로 갱도·오르는 방 없음)
  const DS = P.bp?.caves ? P.bp : null;
  const AR = ARCHI[P.z.id];
  if (AR) AR(kit(P, C));
  else if (DS) {
    const dg = DS.dungeon ? dungeonWorld(P, C, DS.dungeon) : null;
    caveWorld(P, C, { y0: 14, y1: bot, anchor: base / BLK, gap: [96, 124], lim: NXl, topAt: () => 14, design: DS, extern: dg, style: ST, noClimb: 1, shafts: 0, deepX: -1, peakX: -1, arena: -1 });
  }
  else caveWorld(P, C, {
    y0: 14,
    y1: bot,
    anchor: base / BLK,
    gap: ST?.gap ?? [96, 124],
    band: ST?.band ?? 0.4,
    shafts: ST?.shafts ?? R.int(2, 3),
    lim: NXl,
    maxGrand: ST?.maxGrand ?? 4,
    style: ST,
    entries: true,
    topAt: () => 14,
    arena: arenaFrom < WP ? Math.floor(arenaFrom / BLK) : -1,
    peakX: P.isZone && P.upX >= 0 ? Math.round(clamp(P.upX, 300, lim - 300) / BLK) : -1,
    peakRow: R.int(260, 330),
    deepX: P.isZone && P.downX >= 0 ? Math.round(clamp(P.downX, 300, lim - 300) / BLK) : -1,
  });
  cleanCells(C, 0);
  writeCells(P, C);
  applySpecReq(P);
  // 옛 갱도: 방 일부에 나무 판자 뒷벽 (지형이 빈 곳에만 그려진다)
  if (ST?.wood) {
    const WR = rng((P.seed ^ 0x3a7e) >>> 0);
    for (const r of P.rooms ?? []) {
      if (r.top == null || r.kind === "grand" || r.kind === "lake" || r.kind === "door" || r.kind === "ruins" || WR() > ST.wood) continue;
      P.walls.push({ x0: (r.x0 - 1) * BLK, y0: (r.top - 2) * BLK, x1: (r.x1 + 1) * BLK, y1: r.fy * BLK, m: "wood" });
    }
  }
  // 입구·출구 통로 바닥 (칸 경계에 평평하게)
  flatFloor(P, 34, 140, base, 16, 28, 30);
  flatFloor(P, WP - 140, WP - 34, base, 16, 28, 30);
  if (arenaFrom < WP) flatFloor(P, arenaFrom, WP - 34, base, 16, 48, 40);
  if (P.peak) flatFloor(P, P.peak.x - 40, P.peak.x + 40, P.peak.y, 12, 30, 18);
  if (P.deep) flatFloor(P, P.deep.x - 40, P.deep.x + 40, P.deep.y, 12, 30, 18);
  P.ugTop = 0;
}
function rubble(P) {
  const { R, N, F } = P;
  for (let k = 0, t = 0; k < 10 && t < 200; t++) {
    const x = R.range(200, Math.min(P.arenaFrom, P.WP) - 200), y = R.range(300, P.HP - 140);
    // 바닥 위 (공기 바로 아래가 바위)
    if (F.v(x, y) > 0 || F.v(x, y + 12) <= 0 || F.v(x, y - 40) > 0) continue;
    const r = R.range(8, 18), so = R() * 99;
    addShape(P, x - r * 2, y - r, x + r * 2, y + r, (px, py) => {
      const dx = (px - x) / (r * 1.6), dy = (py - (y + r * 0.3)) / r;
      return (1 + 0.25 * N.n2(px / 7 + so, py / 7) - Math.sqrt(dx * dx + dy * dy)) * r;
    });
    k++;
  }
}

// ── 하늘 ─────────────────────────────────────────────
function buildSky(P) {
  const { prof: S, WP, R, N, arenaFrom, F } = P;
  F.d.fill(-12);
  // 섬 길(맨 아래 기초 땅) 높이: 설계도 skyBase가 있으면 그 높이 (출구도 그 높이)
  const base = (P.base = P.bp?.skyBase ?? FLOOR * TS);
  const fl = S.floor;
  // 지역 설계 코드가 지도 전체(맨 아래 섬 길까지)를 직접 짓는 하늘 구역: 기초 섬·맨 아래 바닥 없이 빈 하늘에서 시작
  {
    const AR = ARCHI[P.z.id];
    if (AR?.own) {
      P.skyZone = 1;
      P.skyWalk = 1;
      P.skyFloorY = P.HP;
      const C = cellsOf(P);
      C.cell.fill(-1);
      AR(kit(P, C), { base });
      writeCells(P, C);
      applySpecReq(P);
      P.ugTop = P.Ft + 20;
      return;
    }
  }
  // 바닥 섬: 큰 섬 사이 틈 (뛰어넘는다)
  const segs = [];
  let x = 0;
  while (x < WP) {
    let w = R.int(fl.w[0], fl.w[1]) * TS;
    if (x === 0) w = Math.max(w, 22 * TS);
    if (x + w >= WP - 18 * TS || x + w > arenaFrom - 6 * TS) w = arenaFrom < WP && x < arenaFrom - 6 * TS ? Math.max(w, arenaFrom - x) : WP - x;
    if (x >= arenaFrom - 6 * TS) w = WP - x;
    segs.push([x, Math.min(WP, x + w)]);
    x += w;
    if (x >= WP) break;
    x += R.int(fl.gap[0], fl.gap[1]) * TS;
  }
  if (0) {
    const ma = Math.max(150, P.upX - R.range(560, 760)), mb = Math.min(arenaFrom - 200, P.upX + R.range(560, 760));
    for (let k = segs.length - 1; k >= 0; k--) if (segs[k][1] > ma && segs[k][0] < mb) segs.splice(k, 1);
    segs.push([ma, mb]);
    segs.sort((p, q) => p[0] - q[0]);
    P.skyMt = { a: ma, b: mb, H: R.range(560, 760), as: R.range(0.75, 1.25), so: R() * 99 };
  }
  P.floorSegs = segs;
  P.skyZone = 1;
  const segOff = segs.map(() => 0);
  for (let k = 1; k < segs.length - 1; k++) {
    const toEnd = Math.min(k, segs.length - 1 - k) * 56;
    segOff[k] = Math.round(clamp(segOff[k - 1] + R.range(-56, 56), Math.max(-220, -toEnd), Math.min(140, toEnd)) / TS) * TS;
  }
  if (arenaFrom < WP) segOff[segs.length - 1] = 0;
  const offAt = (x) => {
    for (let k = 0; k < segs.length; k++) if (x >= segs[k][0] - 8 && x < segs[k][1] + 8) return segOff[k];
    return 0;
  };
  const so = R() * 999;
  const mtAt = (x) => {
    const M = P.skyMt;
    if (!M || x <= M.a || x >= M.b) return 0;
    const c = (M.a + M.b) / 2, t = (x - c) / (((M.b - M.a) / 2) * (x < c ? M.as : 2 - M.as));
    if (t <= -1 || t >= 1) return 0;
    const q = 1 - t * t;
    return M.H * q * q * (0.7 + 0.3 * N.ridge1(x / 220 + M.so, 3));
  };
  const topAt = (x) => base + offAt(x) - fl.amp * (0.5 + 0.5 * N.fbm1(x / 260 + so, 2)) + 3 * N.n1(x / 31 + so) - mtAt(x);
  const style = S.islands.style;
  // 맨 아래 줄 = 섬 길: 출입 섬 사이를 큰 섬들로 잇고, 섬 사이 틈은 구름다리로 덮는다 (떨어지지 않고 왼쪽 출구 → 오른쪽 출구)
  //   그 위 가운데·위 섬 줄과 ▲ 섬은 지상 구역 하늘처럼 이 길을 "땅"으로 삼아 짓는다 (설계도가 있으면 설계도대로)
  for (let k = 1; k < segs.length; k++) segOff[k] = P.bp?.flatWalk ? 0 : clamp(segOff[k], segOff[k - 1] - 48, segOff[k - 1] + 48);
  const segTop = [];
  segs.forEach(([a, b], k) => {
    const w = b - a, cx = (a + b) / 2, hw = w / 2, off = segOff[k];
    const t = R.int(fl.t[0], fl.t[1]) * TS;
    const lipA = R.range(0.92, 0.97), lipB = R.range(0.92, 0.97), rd = R.range(6, 12);
    const tf = (px) => {
      const u = (px - cx) / hw, au = u < 0 ? -u : u, lip = u < 0 ? lipA : lipB;
      const r = au > lip ? (au - lip) / (1 - lip) : 0;
      return (a === 0 && px < 150) || (b >= WP && px > WP - 150) ? base : base + off - fl.amp * (0.5 + 0.5 * N.fbm1(px / 260 + so, 2)) + r * r * rd;
    };
    segTop.push(tf);
    island(P, cx, base + off, w, t, style === "spire" ? "rock" : style, { topFn: tf, lobes: clamp(Math.round(w / 110), 2, 7), sub: false });
  });
  // 틈: 낮은 쪽 높이에 구름다리 (양쪽 섬에 8px씩 걸친다)
  const gapY = [];
  for (let k = 0; k + 1 < segs.length; k++) {
    const a = segs[k][1], b = segs[k + 1][0];
    const y = Math.round(Math.max(segTop[k](a - 2), segTop[k + 1](b + 2)) / BLK) * BLK + BLK;
    gapY.push([a, b, y]);
    spec(P, a - 8, y, b + 8, y + 16, "cloud");
  }
  P.skyWalk = 1;
  // 출구 자리·보스 방 바닥은 정확히 70줄
  flatFloor(P, 34, 140, base, 40, 20, 40);
  flatFloor(P, WP - 140, WP - 34, base, 40, 20, 40);
  if (arenaFrom < WP) flatFloor(P, arenaFrom, WP - 34, base, 40, 20, 60);
  // 맨 아래: 끊김 없는 일자 바닥 (아래로 떨어지지 않는다)
  const yB = Math.round((P.HP - 200) / TS) * TS;
  P.skyFloorY = yB;
  addShape(P, -8, yB - 8, WP + 8, P.HP + 8, (px, py) => py - yB + 0.5);
  const groundAt = (x) => {
    for (let k = 0; k < segs.length; k++) if (x >= segs[k][0] && x < segs[k][1]) return segTop[k](x);
    for (const [a, b, y] of gapY) if (x >= a && x < b) return y;
    return yB;
  };
  // 지역 설계 코드가 있으면 하늘 전체를 그것으로 (기초 땅 위에 짓는다)
  const AR = ARCHI[P.z.id];
  if (AR) {
    const C = cellsOf(P);
    AR(kit(P, C), { base });
    writeCells(P, C);
    applySpecReq(P);
  } else skyWorld(P, groundAt, S.islands.style, P.bp?.sky ? { design: P.bp.sky, walk: 1 } : { walk: 1 });
  P.ugTop = P.Ft + 20;
}

// ════════════════════════════════════════════════════════════════════
// 지형 v2 — 구간으로 짠 지표 · 층으로 쌓인 동굴과 고대 유적 · 산만 한 하늘섬과 디딤돌 길
// 방·섬마다 역할을 정한다 (쉼터·전투·보물·전망·성소) → roomTags로 적·상자를 놓는다
// ════════════════════════════════════════════════════════════════════

// 계단밭: 단 높이를 24~56px로 제각각 (8px 단위). skip[i]인 곳은 그대로
function terraceVar(h, R, skip) {
  const base = FLOOR * TS;
  let lo = 1e9, hi = -1e9;
  for (let i = 0; i < h.length; i++) ((lo = Math.min(lo, h[i])), (hi = Math.max(hi, h[i])));
  const lv = [base];
  for (let y = base; y > lo - 64; ) lv.unshift((y -= R.pick([24, 32, 40, 40, 48, 56])));
  for (let y = base; y < hi + 64; ) lv.push((y += R.pick([24, 32, 40, 48])));
  for (let i = 0; i < h.length; i++) {
    if (skip && skip[i]) continue;
    const v = h[i];
    let k = 0;
    while (k < lv.length - 2 && lv[k + 1] <= v) k++;
    const a = lv[k], b = lv[k + 1], f = clamp((v - a) / (b - a), 0, 1);
    h[i] = a + (b - a) * smooth(smooth(f));
  }
}

// 지표: 입구 들판 → (언덕·골짜기(연못)·고원·풀밭(싱크홀)·사구) → 큰 산(가운데~오른쪽, ▲ 문 가까이) → … → 출구 들판
// 같은 종류 구간은 이어서 오지 않는다. 굴 입구·연못·싱크홀 자리를 함께 정한다
function sectionSurface(P) {
  const { prof: S, LW, WP, N, arenaFrom } = P;
  const R = rng(P.seed ^ 0x5ec7a1);
  const base = FLOOR * TS, lim = Math.min(WP, arenaFrom);
  const el = new Float64Array(LW);
  const bump = (u) => (u <= -1 || u >= 1 ? 0 : (1 - u * u) * (1 - u * u));
  const plat = (u, p) => {
    const a = u < 0 ? -u : u;
    if (a >= 1) return 0;
    if (a <= p) return 1;
    const s = (a - p) / (1 - p);
    return 1 - s * s * (3 - 2 * s);
  };
  const addEl = (x0, x1, f) => {
    for (let i = Math.max(0, Math.floor(x0 / Q)); i <= Math.min(LW - 1, Math.ceil(x1 / Q)); i++) el[i] += f(i * Q);
  };
  const E0 = R.range(560, 860), E1 = arenaFrom < WP ? arenaFrom - 80 : WP - R.range(560, 860);
  P.sections = [];
  P.ponds = [];
  P.sinks = [];
  P.mouthX = [];
  // 큰 산 하나: 가운데~오른쪽 (입구 쪽 1000px+ 떨어져서)
  const MS = S.massif;
  const mH = clamp(MS ? R.range(MS.h[0], MS.h[1]) * 0.5 : R.range(420, 620), 380, 860);
  const mW = R.range(2000, 2800), as = R.range(0.42, 0.58), wl = mW * as, wr = mW - wl;
  let cm = P.upX >= 0 ? P.upX + R.range(-300, 300) : lim * R.range(0.5, 0.66);
  cm = clamp(cm, Math.max(lim * 0.42, E0 + 1000 + wl), Math.min(lim * 0.74, E1 - 600 - wr));
  {
    const pTop = R.range(0.1, 0.16), shSide = R() < 0.5 ? -1 : 1, shAt = R.range(0.38, 0.55), shAmt = R.range(0.1, 0.18), so = R() * 99;
    addEl(cm - wl, cm + wr, (x) => {
      const t = (x - cm) / (x < cm ? wl : wr), a = t < 0 ? -t : t;
      if (a >= 1) return 0;
      const s = a <= pTop ? 0 : (a - pTop) / (1 - pTop);
      let e = Math.pow(1 - s, 1.5);
      if ((t < 0 ? -1 : 1) === shSide) e += shAmt * bump((s - shAt) / 0.18);
      return mH * Math.min(1, e) * (0.95 + 0.05 * N.fbm1(x / 280 + so, 2));
    });
    P.mtn = { a: cm - wl, b: cm + wr, cx: cm, h: mH, pa: cm - wl * pTop, pb: cm + wr * pTop };
    P.sections.push({ kind: "mountain", a: cm - wl, b: cm + wr });
  }
  const kinds = S.dunes ? ["dunes", "hills", "valley", "dunes", "mesa"] : ["hills", "valley", "mesa", "meadow", "hills", "valley"];
  const need = S.dunes ? ["valley", "mesa", "dunes"] : ["valley", "mesa", "meadow"];
  let last = "";
  const span = (a, b) => {
    for (let x = a; b - x >= 520; ) {
      let w = Math.min(b - x, R.range(760, 1400));
      if (b - x - w < 520) w = b - x;
      let k = need.length && R() < 0.75 ? need[R.int(0, need.length - 1)] : R.pick(kinds);
      for (let t = 0; t < 8 && k === last; t++) k = R.pick(kinds);
      need.includes(k) && need.splice(need.indexOf(k), 1);
      last = k;
      const x0 = x, c = x + w / 2, hw = w / 2;
      if (k === "hills") {
        const n = w > 1100 ? R.int(2, 3) : R.int(1, 2);
        for (let j = 0; j < n; j++) {
          const cc = x0 + (w * (j + 0.5)) / n + R.range(-0.1, 0.1) * (w / n), hh = R.range(110, 300), ww = R.range(0.38, 0.55) * (w / n) + 120;
          addEl(cc - ww, cc + ww, (xx) => hh * bump((xx - cc) / ww));
        }
        P.mouthX.push(c + R.range(-0.25, 0.25) * w);
      } else if (k === "valley") {
        const d = R.range(150, 260), ww = hw * R.range(0.72, 0.9), p = R.range(0.3, 0.42);
        addEl(c - ww, c + ww, (xx) => -d * plat((xx - c) / ww, p));
        P.ponds.push({ x: c, w: Math.min(ww * p * 1.5, R.range(150, 260)) });
      } else if (k === "mesa") {
        const hh = R.range(180, 320), ww = hw * R.range(0.66, 0.84), p = R.range(0.5, 0.64);
        addEl(c - ww, c + ww, (xx) => hh * plat((xx - c) / ww, p));
        P.mouthX.push(c + (R() < 0.5 ? -1 : 1) * ww * R.range(0.75, 0.95));
      } else if (k === "meadow") {
        const s2 = R() * 99;
        addEl(x0, x0 + w, (xx) => 26 * (0.5 + 0.5 * N.fbm1(xx / 210 + s2, 2)) * bump((xx - c) / hw));
        P.sinks.push(c + R.range(-0.2, 0.2) * w);
      } else if (k === "dunes") {
        const D = S.dunes, s2 = R() * 99;
        addEl(x0, x0 + w, (xx) => {
          const ph = (xx - x0) / (D.wl * 2.2) + 0.3 * N.fbm1(xx / 900 + s2, 2);
          const t = ph - Math.floor(ph), aa = D.asym, p2 = t < aa ? smooth(t / aa) : 1 - smooth((t - aa) / (1 - aa));
          return D.amp * 2.2 * p2 * bump((xx - c) / hw);
        });
      }
      P.sections.push({ kind: k, a: x0, b: x0 + w });
      x += w;
    }
  };
  span(E0, cm - wl);
  span(cm + wr, E1);
  const s3 = R() * 99, h = new Float64Array(LW);
  for (let i = 0; i < LW; i++) h[i] = base - el[i] - 6 * N.fbm1((i * Q) / 70 + s3, 2);
  return h;
}

// ── 땅속 세계 (8px 블록 칸) ──────────────────────────
// 층마다 동굴 방이 이어지고(가끔 끊겨 갈래가 된다), 층 사이는 비탈 굴·오르는 방으로 여러 곳을 잇는다. 맨 아래층엔 고대 유적
// 방 모양은 처음부터 걷기 좋게: 바닥 단 차이 5칸(40px) 이하, 천장은 바닥 위 13칸(104px) 이상, 매달린 바위·기둥 아치 밑은 12칸 이상
// o: { y0, y1 방을 놓을 위·아래 줄, gap [층 간격], topAt(cx) 이보다 위엔 못 놓음, lim 칸 끝, anchor 꼭 있어야 하는 층 바닥 줄,
//      entries 동굴 구역 좌우 입구, arena 보스 방 시작 칸, mouths [{x,y}] 지표 굴 입구, sinks [{x,y}] 싱크홀, peakX/peakRow, deepX }
function caveWorld(P, C, o) {
  const R = rng(P.seed ^ 0xca7e51), N = P.N, { cell, NX, NY } = C;
  const STEP = 8, lim = o.lim;
  const setC = (x, y, v) => x >= 1 && y >= 1 && x < NX - 1 && y < NY - 1 && (cell[y * NX + x] = v);
  const air = (x, y) => setC(x, y, -1), rock = (x, y) => setC(x, y, 1);
  const rect = (x0, y0, x1, y1, v) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setC(x, y, v);
  };
  const walk = (n, lo, hi, d = 1, r0 = 3, r1 = 8) => {
    const a = new Int16Array(Math.max(1, n));
    let v = R.int(lo, hi), run = 0;
    for (let i = 0; i < n; i++) {
      if (run-- <= 0) ((v = clamp(v + R.int(-d, d), lo, hi)), (run = R.int(r0, r1)));
      a[i] = v;
    }
    return a;
  };
  const later = [], rooms = [], boxes = [], tags = [];
  // 이어짐 (0 = 바깥: 지표·입구)
  const par = [0];
  const find = (a) => (par[a] === a ? a : (par[a] = find(par[a])));
  const uni = (a, b) => (par[find(a)] = find(b));
  const newRoom = (r) => {
    r.id = par.length;
    par.push(r.id);
    r.deg = 0;
    rooms.push(r);
    return r;
  };
  const linkR = (a, b) => (uni(a.id, b.id), a.deg++, b.deg++);
  const free = (x0, x1, y0, y1, m = 6, ex = [], top = true) => {
    if (x0 < 3 || x1 > lim - 3 || y1 > o.y1 + 4 || y0 < 2) return false;
    if (top) for (let x = Math.max(0, x0); x <= x1; x += 2) if (y0 < o.topAt(x)) return false;
    for (const b of boxes) if (!ex.includes(b.r) && x0 < b.x1 + m && x1 > b.x0 - m && y0 < b.y1 + m && y1 > b.y0 - m) return false;
    return true;
  };
  const pathFree = (xa, xb, ya, yb, ex, top = true) => {
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    for (const b of boxes) if (!ex.includes(b.r) && x0 < b.x1 + 2 && x1 > b.x0 - 2 && Math.min(ya, yb) - 16 < b.y1 && Math.max(ya, yb) + 1 > b.y0) return false;
    if (top) for (let x = x0; x <= x1; x += 2) if (Math.min(ya, yb) - 16 < o.topAt(x) && x > 4 && x < lim - 4) return false;
    return true;
  };

  // ── 동굴 방 ──
  // floor: flat | steps | mound | basin. 양 끝(문 쪽)은 바닥 줄 fy, 안쪽은 단 (한 단 5칸 이하)
  const carveCavern = (r) => {
    const { x0, x1, fy, h, kind } = r, w = x1 - x0;
    const lv = new Int16Array(w);
    const segs = [];
    for (let x = R.int(6, 10); x < w - 6; ) {
      const L = Math.min(w - 6 - x, R.int(10, 24));
      if (L < 6) break;
      segs.push([x, x + L]);
      x += L;
    }
    let cur = 0;
    for (let k = 0; k < segs.length; k++) {
      const rem = segs.length - 1 - k, pat = r.floor;
      let d = 0;
      if (pat === "mound") d = k < segs.length / 2 ? R.int(2, 5) : -R.int(2, 5);
      else if (pat === "basin") d = k < segs.length / 2 ? -R.int(2, 4) : R.int(2, 4);
      else if (pat === "steps") d = R.int(2, 5) * (R() < 0.55 ? 1 : -1);
      else d = R() < 0.25 ? R.int(-2, 2) : 0;
      const cap = 5 * (rem + 1);
      let t = clamp(cur + d, Math.max(-cap, pat === "basin" ? -10 : -3), Math.min(cap, 12));
      t = clamp(t, cur - 5, cur + 5);
      cur = t;
      for (let i = segs[k][0]; i < segs[k][1]; i++) lv[i] = cur;
    }
    // ▲ 문 자리 등: 가운데 바닥은 평평하게
    if (r.flatC != null) for (let i = Math.max(0, r.flatC - 9); i < Math.min(w, r.flatC + 9); i++) lv[i] = 0;
    // 천장: 한쪽으로 치우친 둥근 지붕, 큼직한 잡음 (2~4칸씩 같은 높이)
    const pk = R.range(0.25, 0.75), sq = R.range(0.35, 0.8), amp = R.range(0.1, 0.28) * (o.style?.ceilAmp ?? 1), fq = R.range(14, 34), so = R() * 99;
    // 천장 모양: 둥근 지붕 · 쌍봉 · 한쪽으로 기운 · 평평(끝만 둥글게)
    const ct = r.ceil ?? R.pick(o.style?.ceil ?? ["dome", "dome", "double", "slant", "flat"]);
    const p1 = R.range(0.18, 0.4), p2 = R.range(0.6, 0.82), s1 = R.range(0.16, 0.26), s2 = R.range(0.16, 0.26), sl = R() < 0.5;
    const top = new Int32Array(w);
    let hold = 0, run = 0;
    for (let i = 0; i < w; i++) {
      const u = (i + 0.5) / w, t = u < pk ? (u - pk) / pk : (u - pk) / (1 - pk);
      const bl = (v) => Math.max(0, 1 - v * v);
      const dome =
        ct === "double" ? Math.max(bl((u - p1) / s1), bl((u - p2) / s2), 0.25 * bl(t)) : ct === "slant" ? Math.min(1, 4 * Math.min(u, 1 - u)) * (sl ? 0.3 + 0.7 * u : 1 - 0.7 * u) : ct === "flat" ? Math.min(1, 5 * Math.min(u, 1 - u)) * 0.82 : Math.pow(Math.max(0, 1 - t * t), sq);
      if (run-- <= 0) ((hold = Math.round(h * (0.38 + 0.62 * dome) * (1 + amp * N.fbm1((x0 + i) / fq + so, 2)))), (run = R.int(2, 4)));
      top[i] = Math.min(fy - lv[i] - 13, fy - Math.max(14, hold));
    }
    let tMin = fy;
    for (let i = 0; i < w; i++) {
      tMin = Math.min(tMin, top[i]);
      for (let y = top[i]; y < fy - lv[i]; y++) air(x0 + i, y);
    }
    // 웅덩이: 문 높이보다 낮은 바닥에 물 (둑은 단이라 걸어서 나온다)
    for (const [a, b] of segs) if (lv[a] < 0) P.specReq.push({ x0: x0 + a, y0: fy, x1: x0 + b, y1: fy - lv[a], k: "water" });
    // 매달린 바위 (끝은 3칸 이상으로 굵게, 바닥 위 12칸 이상 띄운다)
    const nh = Math.round((kind === "grand" ? R.int(3, 6) : kind === "small" ? 0 : R.int(0, 3)) * (o.style?.hang ?? 1));
    for (let k = 0; k < nh; k++) {
      const i = R.int(10, w - 11);
      let fMin = 1e9;
      for (let j = Math.max(0, i - 7); j < Math.min(w, i + 8); j++) fMin = Math.min(fMin, fy - lv[j]);
      const room2 = fMin - 13 - top[i];
      if (room2 < 5) continue;
      const len = R.int(4, room2), W0 = R.int(3, 8), lean = R.range(-0.35, 0.35);
      for (let d = 0; d < len + 3; d++) {
        const hw = Math.max(1, Math.round((W0 / 2) * (1 - Math.max(0, d - 3) / (len + 2)))), c = i + Math.round(lean * Math.max(0, d - 3));
        for (let x = c - hw; x <= c + hw; x++) x >= 0 && x < w && rock(x0 + x, top[i] - 3 + d);
      }
    }
    // 굵은 바위 기둥 (아래는 아치로 뚫려 지나간다)
    const np = (kind === "pillared" ? R.int(1, 2) : kind === "grand" ? R.int(0, 2) : 0) + (o.style?.pillars && kind !== "small" && w >= 70 ? o.style.pillars : 0);
    for (let k = 0; k < np; k++) {
      const pw = R.int(8, 14), i0 = R.int(16, Math.max(17, w - 16 - pw)), aH = R.int(12, 15);
      for (let i = i0; i < i0 + pw && i < w; i++) {
        const u = ((i - i0 + 0.5) / pw) * 2 - 1, b = fy - lv[i] - aH - Math.round(3 * Math.sqrt(Math.max(0, 1 - u * u)));
        for (let y = top[i] - 2; y < b; y++) rock(x0 + i, y);
      }
    }
    r.lv = lv;
    r.tops = top;
    r.top = tMin;
    boxes.push({ r, x0, x1, y0: tMin - 2, y1: fy + 10 });
  };

  // ── 굴: A 문(xa, ya 바닥 줄) → B 문(xb, yb). 가로 길이 ≥ 높이 차 (비탈 45°). 평지·비탈이 섞이고 천장은 들쭉날쭉 ──
  const tunnel = (xa, ya, xb, yb, h = R.int(o.style?.tunH?.[0] ?? 10, o.style?.tunH?.[1] ?? 13)) => {
    const dir = xb >= xa ? 1 : -1, dn = Math.sign(yb - ya);
    let left = Math.abs(yb - ya), slack = Math.max(0, Math.abs(xb - xa) - left);
    let x = xa, f = ya, jg = 0, run = 0;
    const col = (fp) => {
      if (run-- <= 0) ((jg = R.int(0, o.style?.jag ?? 3)), (run = R.int(3, 7)));
      for (let y = Math.min(f, fp) - h - jg; y < f; y++) air(x, y);
    };
    col(f);
    while (x !== xb) {
      const sl = left > 0 && (slack <= 0 || R() < left / (left + slack));
      const L = Math.max(1, Math.min(sl ? left : slack, R.int(3, 10), Math.abs(xb - x)));
      for (let k = 0; k < L && x !== xb; k++) {
        x += dir;
        const fp = f;
        sl && left > 0 ? ((f += dn), left--) : slack--;
        col(fp);
      }
    }
  };

  // ── 오르는 방: 넓은 자연 굴뚝. 벽에서 번갈아 튀어나온 큰 바위 단 (위아래 STEP칸 이하, 마주 보는 단 끝 사이 4~5칸)
  // 위 문은 upSide 쪽(바닥 줄 yU), 아래 문은 lowSide 쪽(바닥 줄 yD, 높이 8칸)
  const climbRoom = (xl, xr, yU, yD, upSide, lowSide) => {
    const n0 = yD - yU + 20, wl = walk(n0, 0, 3, 1, 3, 7), wr = walk(n0, 0, 3, 1, 3, 7);
    const JMIN = Math.max(4, Math.floor((xr - xl - 5) / 2) - 2);
    for (let y = yU - 14; y < yD; y++) {
      const k = y - (yU - 14);
      for (let x = xl - wl[k]; x < xr + wr[k]; x++) air(x, y);
    }
    later.push(() => {
      const D = yD - yU, W = xr - xl;
      if (D <= 12) return;
      let n = Math.ceil(D / STEP);
      // 맨 아래 칸은 아래 문 반대쪽만 튀어나오게 (문을 막지 않게)
      const want = lowSide !== upSide ? 1 : 0;
      if (n % 2 !== want) n++;
      const oo = [R.int(JMIN, JMIN + 3), R.int(JMIN, JMIN + 3)], gap = R.int(2, 3);
      let yb = yD, rem = D;
      for (let k = 0; k < n; k++) {
        const left = n - k, lo = Math.max(3, rem - STEP * (left - 1)), hi = Math.min(STEP, rem - 3 * (left - 1));
        const hk = k === n - 1 ? rem : clamp(Math.round(rem / left) + R.int(-1, 1), lo, hi);
        rem -= hk;
        const S = (n - k - 1) % 2 === 0 ? upSide : 1 - upSide;
        oo[S] = k === 0 ? R.int(JMIN, JMIN + 3) : clamp(W - gap - oo[1 - S], 3, W - 5);
        const tp = yb - hk, tr = R.int(1, 2);
        for (let y = tp; y < yb; y++) {
          const fb = yb - 1 - y, wv = k === 0 ? oo[S] : Math.max(2, oo[S] - tr * Math.max(0, hk - 2 - fb)), kk = clamp(y - (yU - 14), 0, n0 - 1);
          if (S === 0) for (let x = xl - wl[kk]; x < xl + wv; x++) rock(x, y);
          else for (let x = xr - wv; x < xr + wr[kk]; x++) rock(x, y);
        }
        yb = tp;
      }
    });
  };

  // ── 고대 유적 (던전): 가운데 성소(두 층 높이, 좌우 대칭, 3단 제단 위에 ▼ 문) · 양쪽 계단실(넓은 돌계단) · 양쪽 회랑(기둥)
  // 벽돌 건물을 세우고 방을 판다. 바깥 문은 위층 회랑 양 끝 (바닥 줄 fyT)
  const ruinsAt = (cx, fyB) => {
    const Hs = R.int(22, 25), slab = 2, wall = 2, door = 11;
    const fyT = fyB - Hs - slab;
    const sw = R.int(13, 17) * 4, stW = Hs + slab + R.int(8, 11);
    const hw0 = R.int(32, 52), hw1 = R.int(32, 52), vault = R.int(3, 5) * 2;
    const s0 = cx - (sw >> 1), s1 = s0 + sw;
    const aL = s0 - wall - stW, bR = s1 + wall + stW;
    const hL = aL - wall - hw0, hR = bR + wall + hw1;
    const X0 = hL - wall, X1 = hR + wall;
    const roof = fyB - 2 * Hs - slab - vault - wall;
    if (X0 < 8 || X1 > lim - 8 || !free(X0 - 2, X1 + 2, roof - 2, fyB + wall + 2, 4)) return null;
    rect(X0, roof, X1, fyB + wall, 1);
    P.mats.push({ x0: X0 * BLK, y0: roof * BLK, x1: X1 * BLK, y1: (fyB + wall) * BLK, m: "brick" });
    const back = (x0, y0, x1, y1, m) => P.walls.push({ x0: x0 * BLK, y0: y0 * BLK, x1: x1 * BLK, y1: y1 * BLK, m });
    // 기둥 그림 먼저 (먼저 놓은 뒷벽이 이긴다)
    const yS = fyB - 2 * Hs - slab;
    for (const off of [sw / 2 - 7, sw / 2 - 17]) if (off > 10) for (const s of [-1, 1]) back(cx + s * off - 1, yS, cx + s * off + 2, fyB, "rock");
    for (const [a, b] of [[hL, aL - wall], [bR + wall, hR]]) {
      const st = R.int(8, 11);
      for (let x = a + st - 1; x < b - 3; x += st) back(x, fyT - Hs + 3, x + 2, fyT, "rock");
      back(a, fyT - Hs, b, fyT - Hs + 2, "rock");
    }
    // 성소: 두 층 높이 + 계단식 둥근 천장
    for (let x = s0; x < s1; x++) {
      const u = ((x - s0 + 0.5) / sw) * 2 - 1, v = Math.floor((vault * Math.sqrt(Math.max(0, 1 - u * u))) / 2) * 2;
      for (let y = yS - v; y < fyB; y++) air(x, y);
    }
    // 제단 3단 (맨 위 단에 ▼ 문)
    const t1 = Math.round(sw * 0.62) & ~1, t2 = Math.round(sw * 0.42) & ~1, t3 = Math.max(12, Math.round(sw * 0.24) & ~1);
    rect(cx - t1 / 2, fyB - 2, cx + t1 / 2, fyB, 1);
    rect(cx - t2 / 2, fyB - 4, cx + t2 / 2, fyB - 2, 1);
    rect(cx - t3 / 2, fyB - 6, cx + t3 / 2, fyB - 4, 1);
    P.deep = { x: Math.round((cx * BLK - 8) / TS) * TS + 8, y: (fyB - 6) * BLK };
    // 계단실: 바깥쪽 위 계단참 → 성소 쪽 아래로 내려가는 넓은 돌계단 (한 칸에 한 줄 = 걸어서 오르내린다)
    rect(aL, fyT - Hs, s0 - wall, fyB, -1);
    rect(aL, fyT, aL + 6, fyB, 1);
    for (let i = 0; i < fyB - fyT; i++) rect(aL + 6 + i, fyT + 1 + i, aL + 7 + i, fyB, 1);
    rect(s1 + wall, fyT - Hs, bR, fyB, -1);
    rect(bR - 6, fyT, bR, fyB, 1);
    for (let i = 0; i < fyB - fyT; i++) rect(bR - 7 - i, fyT + 1 + i, bR - 6 - i, fyB, 1);
    // 회랑 (위층)
    rect(hL, fyT - Hs, aL - wall, fyT, -1);
    rect(bR + wall, fyT - Hs, hR, fyT, -1);
    // 문: 회랑↔계단실(위), 계단실↔성소(아래), 바깥(회랑 끝)
    rect(aL - wall, fyT - door, aL, fyT, -1);
    rect(bR, fyT - door, bR + wall, fyT, -1);
    rect(s0 - wall, fyB - door, s0, fyB, -1);
    rect(s1, fyB - door, s1 + wall, fyB, -1);
    rect(X0, fyT - door, hL, fyT, -1);
    rect(hR, fyT - door, X1, fyT, -1);
    // 뒷벽
    back(s0, yS - vault, s1, fyB, "brick");
    back(aL, fyT - Hs, s0 - wall, fyB, "brick");
    back(s1 + wall, fyT - Hs, bR, fyB, "brick");
    back(hL, fyT - Hs, aL - wall, fyT, "brick");
    back(bR + wall, fyT - Hs, hR, fyT, "brick");
    tags.push({ x0: s0 * BLK, x1: s1 * BLK, y0: (yS - vault) * BLK, y1: fyB * BLK + 8, role: "sanctum" });
    tags.push({ x0: hL * BLK, x1: (aL - wall) * BLK, y0: (fyT - Hs) * BLK, y1: fyT * BLK + 8, role: "arena" });
    tags.push({ x0: (bR + wall) * BLK, x1: hR * BLK, y0: (fyT - Hs) * BLK, y1: fyT * BLK + 8, role: "arena" });
    const r = newRoom({ x0: X0, x1: X1, fy: fyT, h: Hs, top: roof, kind: "ruins" });
    boxes.push({ r, x0: X0, x1: X1, y0: roof - 2, y1: fyB + wall + 2 });
    return r;
  };

  // ── 잇기: 굴은 단단한 바위만 뚫는다 (다른 방·굴을 가로지르면 그 바닥이 지워지므로) ──
  const bandClear = (xa, ya, xb, yb, top = true, h = 16) => {
    const dir = xb >= xa ? 1 : -1, n = Math.abs(xb - xa), ady = Math.abs(yb - ya), dn = Math.sign(yb - ya);
    for (let k = 2; k <= n - 2; k++) {
      const x = xa + dir * k, fe = ya + dn * Math.min(k, ady), fl = yb - dn * Math.min(n - k, ady);
      const lo = Math.min(fe, fl) - h - 2, hi = Math.max(fe, fl) + 1;
      if (x < 1 || x >= NX - 1) return false;
      for (let y = lo; y <= hi; y++) {
        if (y < 1 || y >= NY - 1) return false;
        if (top ? y < o.topAt(x) : o.surfRow && y < o.surfRow(x) + 2) {
          if (top) return false;
          continue;
        }
        if (cell[y * NX + x] === -1) {
          if ((k < 14 && Math.abs(y - ya) < h + 4) || (k > n - 14 && Math.abs(y - yb) < h + 4)) continue;
          return false;
        }
      }
    }
    return true;
  };
  const rectRock = (x0, y0, x1, y1) => {
    if (x0 < 2 || y0 < 2 || x1 > NX - 2 || y1 > NY - 2) return false;
    for (let y = y0; y < y1; y++) {
      if (y < o.topAt(x0) || y < o.topAt(x1)) return false;
      for (let x = x0; x < x1; x++) if (cell[y * NX + x] === -1) return false;
    }
    return true;
  };
  // ── 설계 모드: 설계도 방을 그대로 판다 ──
  const byId = {};
  if (o.design) {
    for (const q of o.design.caves) {
      const x0 = Math.round(q.x0 / BLK), x1 = Math.round(q.x1 / BLK), fy = Math.round(q.fy / BLK) & ~1;
      const r = newRoom({ x0, x1, fy, h: Math.round(q.h / BLK), kind: q.kind, floor: q.floor, role: q.role, ceil: q.ceil, bpId: q.id, peak: q.peak ? 1 : 0 });
      if (q.deep && P.downX >= 0) r.flatC = Math.round(P.downX / BLK) - x0;
      if (q.peak && P.upX >= 0) r.flatC = Math.round(P.upX / BLK) - x0;
      if (q.entry) r.flatC = q.entry === "L" ? 0 : x1 - x0 - 1;
      carveCavern(r);
      byId[q.id] = r;
      if (q.deep && P.downX >= 0) P.deep = { x: Math.round((P.downX - 8) / TS) * TS + 8, y: fy * BLK };
      if (q.peak && P.upX >= 0) P.peak = { x: Math.round((P.upX - 8) / TS) * TS + 8, y: fy * BLK };
      // 입구 방: 구역 끝까지 곧은 굴 (이웃 구역 문)
      if (q.entry) (q.entry === "L" ? tunnel(1, fy, x0 - 1, fy) : tunnel(x1, fy, NX - 2, fy), uni(r.id, 0), r.deg++);
    }
  }
  // 던전 서쪽 문: 연결용 점 (던전 안 무리마다 이어짐 노드, 정문과 이어진 무리는 바깥)
  if (o.extern) {
    const compNode = new Map();
    for (const L of o.extern.links) {
      if (!compNode.has(L.comp)) {
        const id = par.length;
        par.push(id);
        compNode.set(L.comp, id);
        L.comp === o.extern.rootComp && uni(id, 0);
      }
      const r = newRoom({ x0: L.x + 1, x1: L.x + 1, fy: L.y, h: 12, top: L.y - 12, kind: "door", door: 1, bpId: L.id });
      uni(r.id, compNode.get(L.comp));
      byId[L.id] = r;
    }
  }
  // ── 미리 놓을 방: 고대 유적(맨 아래, ▼ 문) · ▲ 문 방 · 동굴 구역 좌우 입구 방(보스 방) ──
  if (o.deepX >= 0) {
    if (!ruinsAt(o.deepX, o.y1 - 2)) {
      const w = 40, x0 = clamp(o.deepX - 20, 6, lim - 46), fy = o.y1 - 2;
      const r = newRoom({ x0, x1: x0 + w, fy, h: 18, kind: "hall", floor: "flat", flatC: o.deepX - x0 });
      carveCavern(r);
      P.deep = { x: Math.round((o.deepX * BLK - 8) / TS) * TS + 8, y: fy * BLK };
    }
  }
  if (o.peakX >= 0) {
    const w = R.int(64, 90), x0 = clamp(o.peakX - (w >> 1), 6, lim - 6 - w), fy = o.peakRow & ~1;
    const r = newRoom({ x0, x1: x0 + w, fy, h: R.int(22, 28), kind: "hall", floor: "flat", peak: 1, flatC: o.peakX - x0 });
    carveCavern(r);
    P.peak = { x: Math.round((o.peakX * BLK - 8) / TS) * TS + 8, y: fy * BLK };
  }
  if (o.entries) {
    const A0 = o.anchor & ~1;
    const wl = R.int(60, 100), eL = newRoom({ x0: R.int(16, 30), fy: A0, h: R.int(22, 30), kind: "hall", floor: "flat" });
    eL.x1 = eL.x0 + wl;
    carveCavern(eL);
    tunnel(1, A0, eL.x0 - 1, A0);
    uni(eL.id, 0);
    let eR;
    if (o.arena > 0) {
      eR = newRoom({ x0: o.arena, x1: NX - 3, fy: A0, h: 26, kind: "hall", floor: "flat", boss: 1 });
      carveCavern(eR);
    } else {
      const wr = R.int(60, 100);
      eR = newRoom({ x0: lim - R.int(16, 30) - wr, fy: A0, h: R.int(22, 30), kind: "hall", floor: "flat" });
      eR.x1 = eR.x0 + wr;
      carveCavern(eR);
    }
    tunnel(eR.x1, A0, NX - 2, A0);
  }

  // ── 지표 굴 입구: 언덕 비탈에서 비스듬히 내려가 입구 동굴로 (서로 떨어진 2~3곳) ──
  {
    let made = 0;
    const used = [];
    for (const m of (o.mouths ?? []).slice().sort(() => R() - 0.5)) {
      if (o.noGrotto || made >= 3 || used.some((x) => Math.abs(x - m.x) < 160)) continue;
      for (const sd of R() < 0.5 ? [1, -1] : [-1, 1]) {
        const w = R.int(50, 90), h = R.int(22, 30), fy = (m.y + R.int(34, 56)) & ~1, dx = fy - m.y + R.int(8, 24);
        const x0 = sd > 0 ? m.x + dx + 1 : m.x - dx - w, x1 = x0 + w;
        if (!free(x0, x1, fy - Math.ceil(h * 1.3) - 2, fy + 10, 8)) continue;
        if (!bandClear(m.x, m.y, sd > 0 ? x0 - 1 : x1, fy, false)) continue;
        const r = newRoom({ x0, x1, fy, h, kind: "hall", floor: R.pick(["flat", "steps"]), grotto: 1 });
        carveCavern(r);
        tunnel(m.x, m.y, sd > 0 ? x0 - 1 : x1, fy, R.int(9, 11));
        uni(r.id, 0);
        r.deg++;
        used.push(m.x);
        made++;
        break;
      }
    }
  }
  // ── 협곡(수직 굴): 층 사이를 잇는 중심축. 방을 흩어 놓기 전에 자리를 잡는다 ──
  const shafts = [];
  const makeShaft = (xc, yTop, yBot, W0, force) => {
    const W = W0 ?? R.int(34, 46), xl = xc - (W >> 1), xr = xl + W;
    if (xl < 10 || xr > lim - 10 || yBot - yTop < 24) return null;
    if (!force && !free(xl - 6, xr + 6, yTop - 18, yBot + 4, 4)) return null;
    const segs = [], bnd = [], oo = [0, 0], gap = R.int(2, 3);
    let y = yBot, side = R() < 0.5 ? 0 : 1;
    for (let k = 0; y - yTop > 5; k++) {
      const hk = Math.min(R.int(6, 8), y - yTop), S = side;
      oo[S] = k === 0 ? R.int((W >> 1) - 4, W >> 1) : clamp(W - gap - oo[1 - S], 3, W - 5);
      segs.push({ top: y - hk, bot: y, S, o: oo[S], k });
      bnd.push({ y: y - hk, side: S });
      y -= hk;
      side ^= 1;
    }
    const sh = { xl, xr, yTop: y, yBot, segs, bnd, id: par.length, deg: 0 };
    globalThis.__dbg2 && console.log("shaft", xl * 8, xr * 8, W, segs.filter((q) => q.top * 8 > 7380 && q.top * 8 < 7700).map((q) => [q.top * 8, q.S, q.o, q.k].join("/")).join(" "));
    par.push(sh.id);
    const y0 = y - 16, n0 = yBot - y0 + 4, wl = walk(n0, 0, 3, 1, 3, 7), wr = walk(n0, 0, 3, 1, 3, 7);
    for (let yy = y0; yy < yBot; yy++) for (let x = xl - wl[yy - y0]; x < xr + wr[yy - y0]; x++) air(x, yy);
    later.push(() => {
      for (const sg of segs) {
        const tr = R.int(1, 2), hk = sg.bot - sg.top;
        for (let yy = sg.top; yy < sg.bot; yy++) {
          const fb = sg.bot - 1 - yy, wv = sg.k === 0 ? sg.o : Math.max(2, sg.o - tr * Math.max(0, hk - 2 - fb)), kk = yy - y0;
          if (sg.S === 0) for (let x = xl - wl[kk]; x < xl + wv; x++) rock(x, yy);
          else for (let x = xr - wv; x < xr + wr[kk]; x++) rock(x, yy);
        }
      }
    });
    boxes.push({ r: null, x0: xl - 4, x1: xr + 4, y0: y0 - 2, y1: yBot + 2 });
    shafts.push(sh);
    return sh;
  };
  {
    for (const q of o.design?.shafts ?? []) makeShaft(Math.round(q.x / BLK), Math.round(q.top / BLK), Math.round(q.bot / BLK), q.w ? Math.round(q.w / BLK) : undefined, 1) || globalThis.__dbg && console.log("design shaft failed", q.x);
    const nS = o.shafts ?? 3;
    for (let i = 0; i < nS; i++) {
      for (let t = 0; t < 20; t++) {
        const xc = Math.round(lim * ((i + 0.5) / nS + R.range(-0.12, 0.12)));
        let tp = o.y0 + 6;
        for (let x = xc - 24; x <= xc + 24; x += 4) tp = Math.max(tp, o.topAt(clamp(x, 0, NX - 1)) + 20);
        const full = R() < 0.35, yb = o.y1 - 2 - R.int(0, 24);
        const yT = full ? tp : R() < 0.5 ? tp : Math.round(lerp(tp, yb, R.range(0.25, 0.45)));
        const yB = full ? yb : Math.round(lerp(yT, yb, R.range(0.45, 0.8)));
        if (makeShaft(xc, yT, yB)) break;
      }
    }
  }
  if (o.surfRow)
    for (const sh of shafts) {
      for (const sd of R() < 0.5 ? [0, 1] : [1, 0]) {
        const tb = sh.bnd.filter((b) => b.side === sd).sort((a, b) => a.y - b.y)[0];
        if (!tb) continue;
        const wx = sd === 0 ? sh.xl : sh.xr - 1;
        let mx = wx, ok = false;
        for (let t = 0; t < 4; t++) {
          const dy = tb.y - o.surfRow(mx);
          mx = wx + (sd === 0 ? -1 : 1) * (dy + R.int(10, 26));
        }
        const my = o.surfRow(mx);
        if (mx > 40 && mx < lim - 40 && Math.abs(mx - wx) >= tb.y - my + 6 && bandClear(mx, my, sd === 0 ? wx - 5 : wx + 5, tb.y, false)) {
          tunnel(mx, my, wx, tb.y, R.int(9, 11));
          uni(sh.id, 0);
          sh.deg++;
          ok = true;
        }
        if (ok) break;
      }
    }
  // 방 → 가까운 협곡: 같은 쪽 단 중 높이가 가까운 것으로 비탈 굴 (아래 바닥은 맨 아래 단 반대쪽이면)
  const toShaft = (r, sh) => {
    const sd = r.x1 <= sh.xl - 4 ? 0 : r.x0 >= sh.xr + 4 ? 1 : -1;
    if (sd < 0) return false;
    const xd = sd === 0 ? r.x1 : r.x0 - 1, wx = sd === 0 ? sh.xl : sh.xr - 1, dist = Math.abs(wx - xd);
    if (dist > 150 || dist < 8) return false;
    const opts = sh.bnd.filter((b) => b.side === sd).map((b) => b.y);
    sh.segs[0].S !== sd && opts.push(sh.yBot);
    opts.sort((a, b) => Math.abs(a - r.fy) - Math.abs(b - r.fy));
    for (const yb of opts.slice(0, 3)) {
      if (dist < Math.abs(yb - r.fy) + 6) continue;
      if (!bandClear(xd, r.fy, sd === 0 ? wx - 5 : wx + 5, yb)) {
        globalThis.__dbg && r.bpId && console.log("toShaft band fail", r.bpId, xd, r.fy, wx, yb);
        continue;
      }
      tunnel(xd, r.fy, wx, yb);
      uni(r.id, sh.id);
      r.deg++;
      sh.deg++;
      return true;
    }
    return false;
  };
  // ── 방 흩어 놓기 (2D): 큰 것부터, 서로 10칸 이상 띄운다. 바닥 높이는 층 줄 근처를 조금 더 좋아한다 (층 느낌) ──
  const SZ = {
    grand: { w: [160, 260], h: [50, 76], k: ["grand"] },
    tall: { w: [34, 60], h: [48, 84], k: ["tiered", "hall"] },
    large: { w: [90, 160], h: [30, 48], k: ["pillared", "tiered", "lake", "hall"] },
    medium: { w: [50, 100], h: [22, 34], k: ["hall", "tiered", "lake", "hall"] },
    small: { w: [30, 50], h: [16, 22], k: ["small"] },
  };
  const FL = { hall: ["flat", "steps", "mound"], grand: ["steps", "basin", "mound"], lake: ["basin"], tiered: ["steps"], pillared: ["flat", "mound", "steps"], small: ["flat", "steps"] };
  const area = lim * (o.y1 - o.y0);
  let cov = rooms.reduce((s, r) => s + (r.x1 - r.x0) * (r.h ?? 20), 0);
  const lines = [];
  for (let y = o.y1 - 2; y > o.y0 + 20; y -= R.int(o.gap[0], o.gap[1])) lines.push(y);
  const place = (cls, n, covMax) => {
    for (let k = 0, t = 0; k < n && t < Math.min(n, 60) * 140 && cov < covMax * area; t++) {
      const S2 = SZ[cls], w = R.int(S2.w[0], S2.w[1]), h = R.int(S2.h[0], S2.h[1]);
      const x0 = R.int(6, Math.max(7, lim - 6 - w)), hiY = o.y0 + Math.ceil(h * 1.3) + 4;
      if (hiY >= o.y1 - 2) continue;
      let fy = R() < (o.band ?? 0.6) ? R.pick(lines) + R.int(-6, 6) : R.int(hiY, o.y1 - 2);
      fy = clamp(fy, hiY, o.y1 - 2) & ~1;
      if (!free(x0, x0 + w, fy - Math.ceil(h * 1.3) - 2, fy + 10, 12)) continue;
      if (o.design && !rectRock(x0 - 8, fy - Math.ceil(h * 1.3) - 10, x0 + w + 8, fy + 12)) continue;
      const kind = R.pick(o.style?.k?.[cls] ?? S2.k);
      const r = newRoom({ x0, x1: x0 + w, fy, h, kind, floor: R.pick(o.style?.fl?.[kind] ?? FL[kind]), cls });
      carveCavern(r);
      cov += w * h;
      k++;
    }
  };
  if (o.extern) {
    if (o.extern.box) boxes.push({ r: null, ...o.extern.box });
    else {
      let dx0 = 1e9;
      for (const L of o.extern.links) dx0 = Math.min(dx0, L.x + 3);
      dx0 < 1e9 && boxes.push({ r: null, x0: dx0, x1: lim + 8, y0: 0, y1: NY });
    }
  }
  if (!o.design) place("grand", o.maxGrand ?? 2, 0.06);
  if (!o.design) {
    place("tall", R.int(2, 4), 0.09);
    place("large", 999, 0.14);
    place("medium", 999, 0.2);
    place("small", 999, 0.23);
  }

  const cands = [];
  // 이을 후보 (isNew가 있으면 새 방이 낀 짝만)
  const addCands = (isNew) => {
    const nw = (a, b) => !isNew || isNew(a) || (b && isNew(b));
    for (const A of rooms)
      for (const B of rooms) {
        if (A === B || A.x1 > B.x0 || !nw(A, B)) continue;
        const dx = B.x0 - 1 - A.x1, dy = B.fy - A.fy;
        if (dx < 6 || dx > 220 || Math.abs(dy) > 140) continue;
        if (dx >= Math.abs(dy) + 6) cands.push({ a: A, b: B, t: "slope", c: (dx + Math.abs(dy) + (Math.abs(dy) < 8 ? 30 : 0)) * R.range(0.7, 1.3) });
        else if (!o.noClimb && dx >= 34 && Math.abs(dy) <= 110) cands.push({ a: A, b: B, t: "climbMid", c: dx + 2 * Math.abs(dy) + 30 });
      }
    for (const A of rooms)
      for (const B of rooms) {
        if (A === B || A.fy >= B.fy || A.x1 <= B.x0 || B.x1 <= A.x0 || !nw(A, B)) continue;
        const dy = B.fy - A.fy;
        if (!o.noClimb && dy >= 16 && dy <= 110) cands.push({ a: A, b: B, t: "climbSide", c: 2 * dy + 60 });
      }
    for (const sh of shafts)
      for (const r of rooms) {
        if (!nw(r)) continue;
        const sd = r.x1 <= sh.xl - 4 ? 0 : r.x0 >= sh.xr + 4 ? 1 : -1;
        if (sd < 0) continue;
        const dist = sd === 0 ? sh.xl - r.x1 : r.x0 - sh.xr;
        if (dist >= 8 && dist <= 150) cands.push({ a: r, sh, t: "shaft", c: dist * 0.8 + R.range(0, 24) });
      }
    cands.sort((p, q) => p.c - q.c);
  };
  addCands(null);
  const bId = (e) => (e.sh ? e.sh.id : e.b.id);
  // 지표 입구: 비탈 굴이 안 되면 구덩이 + 바위 단(오르는 방)으로
  const mouthClimb = (m) => {
    for (const r of rooms.slice().sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - m.x) - Math.abs((b.x0 + b.x1) / 2 - m.x)).slice(0, 6)) {
      if (r.kind === "ruins" || r.peak || r.fy - m.y < 20 || r.fy - m.y > 110) continue;
      const W = R.int(18, 24), s2 = r.x0 > m.x ? 1 : -1, xl = m.x - (W >> 1), xd = s2 > 0 ? r.x0 - 1 : r.x1, wd = s2 > 0 ? xl + W - 1 : xl;
      if ((xd - wd) * s2 < 4 || (xd - wd) * s2 > 90) continue;
      if (!rectRock(xl - 3, m.y + 3, xl + W + 3, r.fy + 2) || !bandClear(xd, r.fy, wd, r.fy)) continue;
      climbRoom(xl, xl + W, m.y, r.fy, s2 > 0 ? 0 : 1, s2 > 0 ? 1 : 0);
      tunnel(wd, r.fy, xd, r.fy);
      uni(r.id, 0);
      r.deg++;
      return true;
    }
    return false;
  };
  const build = (e) => {
    if (e.t === "shaft") return toShaft(e.a, e.sh);
    const A = e.a, B = e.b;
    if (e.t === "slope") {
      if (!bandClear(A.x1, A.fy, B.x0 - 1, B.fy)) return false;
      tunnel(A.x1, A.fy, B.x0 - 1, B.fy);
      linkR(A, B);
      return true;
    }
    const [u, d] = A.fy < B.fy ? [A, B] : [B, A];
    const W = R.int(20, 26);
    const tryRoom = (xl, upSide, lowSide, xu, xd) => {
      if (xl < 4 || xl + W > lim - 4 || !rectRock(xl - 4, u.fy - 19, xl + W + 4, d.fy + 2)) return false;
      const wu = upSide === 0 ? xl : xl + W - 1, wd = lowSide === 0 ? xl : xl + W - 1;
      if (!bandClear(xu, u.fy, wu, u.fy) || !bandClear(xd, d.fy, wd, d.fy)) return false;
      climbRoom(xl, xl + W, u.fy, d.fy, upSide, lowSide);
      tunnel(xu, u.fy, wu, u.fy);
      tunnel(xd, d.fy, wd, d.fy);
      boxes.push({ r: null, x0: xl - 4, x1: xl + W + 4, y0: u.fy - 18, y1: d.fy + 2 });
      linkR(u, d);
      return true;
    };
    if (e.t === "climbMid") {
      const xl = Math.round((A.x1 + B.x0) / 2) - (W >> 1);
      if (xl < A.x1 + 5 || xl + W > B.x0 - 5) return false;
      return tryRoom(xl, u === A ? 0 : 1, d === A ? 0 : 1, u === A ? A.x1 : B.x0 - 1, d === A ? A.x1 : B.x0 - 1);
    }
    for (const s of R() < 0.5 ? [1, -1] : [-1, 1]) {
      const xl = s > 0 ? Math.max(u.x1, d.x1) + R.int(6, 14) : Math.min(u.x0, d.x0) - R.int(6, 14) - W;
      if (tryRoom(xl, s > 0 ? 0 : 1, s > 0 ? 0 : 1, s > 0 ? u.x1 : u.x0 - 1, s > 0 ? d.x1 : d.x0 - 1)) return true;
    }
    return false;
  };
  // 지표 굴 입구 먼저 (서로 떨어진 2~3곳)
  {
    const mk = [];
    for (const m of o.mouths ?? [])
      for (const r of rooms)
        for (const sd of [1, -1]) {
          if (r.kind === "ruins" || r.peak || r.door || (m.to && r.bpId !== m.to)) continue;
          const xb = sd > 0 ? r.x0 - 1 : r.x1, dx = (xb - m.x) * sd, dy = r.fy - m.y;
          if (dy > 6 && dx >= dy + 6 && dx < dy + 240) mk.push({ m, r, xb, c: dx + dy });
        }
    mk.sort((p, q) => p.c - q.c);
    const done = [];
    for (const e of mk) {
      if (done.length >= 3 || done.some((q) => Math.abs(q.m.x - e.m.x) < 90 || q.r === e.r)) continue;
      if (!bandClear(e.m.x, e.m.y, e.xb, e.r.fy, false)) continue;
      tunnel(e.m.x, e.m.y, e.xb, e.r.fy, R.int(9, 11));
      uni(e.r.id, 0);
      e.r.deg++;
      done.push(e);
    }

  }
  // 설계도 길 (이미 이어졌어도 고리로 짓는다)
  const designLinks = () => {
    for (const [a, b] of o.design?.links ?? []) {
      const A = byId[a], B = byId[b];
      if (!A || !B) continue;
      let ok = false;
      for (const e of cands) if (!e.sh && ((e.a === A && e.b === B) || (e.a === B && e.b === A)) && !ok && (e.used || build(e))) ((e.used = 1), (ok = true));
      // 손 설계: 후보 검사(다른 굴과 겹침)를 못 넘어도 설계한 비탈 굴은 판다 (자리는 설계도가 책임진다)
      if (!ok && o.noClimb) {
        const [Lr, Rr] = A.x1 <= B.x0 ? [A, B] : [B, A], gap = Rr.x0 - 1 - Lr.x1;
        if (Lr.x1 <= Rr.x0 && gap >= Math.abs(Rr.fy - Lr.fy) + 2) (tunnel(Lr.x1, Lr.fy, Rr.x0 - 1, Rr.fy), linkR(Lr, Rr), (ok = true));
      }
      !ok && globalThis.__dbg && console.log("design link failed", a, b);
    }
  };
  if (o.design) {
    for (const e of cands) e.sh && find(e.a.id) !== find(bId(e)) && build(e) && (e.used = 1);
    designLinks();
    for (const [a, b, fb] of o.design.drops ?? []) {
      const u = byId[a], d = byId[b];
      let ok = false;
      for (let t = 0; u && d && u.lv && d.tops && t < 30 && !ok; t++) {
        const lo = Math.max(u.x0, d.x0) + 10, hi = Math.min(u.x1, d.x1) - 10;
        if (hi - lo < 4) break;
        const x = R.int(lo, hi), hw = 2, fu = u.fy - u.lv[x - u.x0], td = d.tops[x - d.x0];
        // 바위 검사는 아래 방 천장이 가장 높은 곳까지만 (둥근 천장이 구멍 옆에서 조금 올라와도 된다)
        let tdm = td;
        for (let xx = x - hw - 3; xx < x + hw + 4; xx++) { const tt = d.tops[xx - d.x0]; tt != null && tt < tdm && (tdm = tt); }
        if (td - fu < 6 || td - fu > 80 || tdm - fu < 4 || !rectRock(x - hw - 3, fu + 1, x + hw + 4, tdm - 1)) { globalThis.__dbgDrop && console.log("dropwhy", a, b, x * BLK, fu * BLK, td * BLK, tdm * BLK); continue; }
        // 구멍 밑이 아래 방 바닥까지 트여 있어야 (기둥 꼭대기 같은 데 떨어지지 않게)
        let open = true;
        // (둔덕·계단 바닥은 그 자리 바닥 높이까지)
        const fd = d.lv ? d.fy - d.lv[x - d.x0] : d.fy;
        for (let y = td + 1; y < fd - 3 && open; y++) cell[y * NX + x] !== -1 && (open = false);
        if (!open) { globalThis.__dbgDrop && console.log("dropclosed", a, b, x * BLK); continue; }
        // 깔때기: 아래로 갈수록 넓어지기만 한다 (벽에 발 디딜 턱이 생기지 않게)
        const n = td - fu + 2, spread = Math.min(0.3, 6 / Math.max(1, n));
        let wl = 0, wr = 0;
        for (let y = fu - 1; y <= td; y++) {
          const i = y - fu + 1;
          wl = Math.max(wl, Math.floor(i * spread + R() * 1.6));
          wr = Math.max(wr, Math.floor(i * spread + R() * 1.6));
          for (let xx = x - hw - wl; xx <= x + hw + wr; xx++) air(xx, y);
        }
        // 아래 방 천장(둥근 곳)과 만나는 데 턱이 남지 않게: 구멍 폭 전체를 그 자리 천장까지
        for (let xx = x - hw - wl; xx <= x + hw + wr; xx++) {
          const tt = d.tops[xx - d.x0];
          if (tt != null) for (let y = td; y <= tt; y++) air(xx, y);
        }
        uni(u.id, d.id);
        ok = true;
        globalThis.__dbg && console.log("drop", a, b, x * BLK, fu * BLK, td * BLK);
      }
      // 구멍을 못 뚫으면 보통 굴로라도 잇는다 (한쪽 길만 있는 무리가 갇히지 않게)
      if (!ok && u && d) for (const e of cands) if (!ok && !e.sh && ((e.a === u && e.b === d) || (e.a === d && e.b === u)) && (e.used || build(e))) ((e.used = 1), (ok = true));
      // 그래도 못 이으면 정해 둔 옆길 (설계도 fb)
      if (!ok && fb) {
        const A = byId[fb[0]], B = byId[fb[1]];
        for (const e of cands) if (!ok && A && B && !e.sh && ((e.a === A && e.b === B) || (e.a === B && e.b === A)) && (e.used || build(e))) ((e.used = 1), (ok = true));
      }
      !ok && globalThis.__dbg && console.log("design drop failed", a, b);
    }
  }
  // 최소로 다 잇기 (싼 길부터, 방-방·방-협곡) — 설계 모드에서는 설계도 길로 못 이은 것만
  for (const e of cands) find(e.a.id) !== find(bId(e)) && build(e) && (e.used = 1);
  if (!o.design) designLinks();
  // 고리 몇 개 (되돌아가지 않아도 되게)
  if (!o.design) for (const e of cands) if (!e.used && R() < 0.22 && e.a.deg < 4 && (e.sh ? e.sh.deg < 8 : e.b.deg < 4) && e.c < 160) build(e) && (e.used = 1);
  // 설계 모드: 설계 길을 다 판 뒤 빈 바위에 방을 더 흩어 놓고 (구조가 얽히게), 그 방들을 이을 후보를 더한다
  if (o.design && o.fill) {
    const n0 = rooms.length;
    place("large", o.fill[0], 0.2);
    place("medium", o.fill[1], 0.26);
    place("small", o.fill[2], 0.3);
    const fresh = new Set(rooms.slice(n0));
    const nc = cands.length;
    addCands((r) => fresh.has(r));
    for (let i = cands.length - 1; i >= 0; i--) if (cands[i].t === "shaft" && (fresh.has(cands[i].a) || fresh.has(cands[i].b))) cands.splice(i, 1);
    let climbs = 0;
    for (const pass of ["slope", "climb"])
      for (let it = 0, ok = true; ok && it < 20; it++) {
        ok = false;
        const root = find(0);
        for (const e of cands) {
          if (e.used || !(fresh.has(e.a) || fresh.has(e.b)) || (pass === "slope") !== (e.t === "slope")) continue;
          if (pass === "climb" && climbs >= 4) break;
          const ra = find(e.a.id) === root, rb = find(bId(e)) === root;
          if (ra === rb) continue;
          if (build(e)) ((e.used = 1), (ok = true), pass === "climb" && climbs++);
        }
      }
    // 못 붙은 채움 방은 바위로 되돌리고 목록에서 뺀다
    const root = find(0);
    for (const r of [...fresh]) {
      if (find(r.id) === root) continue;
      const ya = r.fy - Math.ceil(r.h * 1.4) - 6, yb = r.fy + 6;
      rect(r.x0 - 3, ya, r.x1 + 3, yb, 1);
      P.specReq = P.specReq.filter((q) => !(q.x0 >= r.x0 - 3 && q.x1 <= r.x1 + 3 && q.y0 >= ya && q.y1 <= yb));
      rooms.splice(rooms.indexOf(r), 1);
      for (let i = boxes.length - 1; i >= 0; i--) boxes[i].r === r && boxes.splice(i, 1);
      for (let i = cands.length - 1; i >= 0; i--) (cands[i].a === r || cands[i].b === r) && cands.splice(i, 1);
      globalThis.__dbg && console.log("fill removed", r.kind, r.x0 * 8, r.fy * 8);
    }
  }
  // 지름길: 위 방 바닥 구멍으로 아래 방에 떨어진다 (한쪽 길)
  for (let k = o.design ? 3 : 0, t = 0; k < 3 && t < 40; t++) {
    const u = R.pick(rooms), d = R.pick(rooms);
    if (u === d || !u.lv || !d.tops || u.fy >= d.top) continue;
    const a = Math.max(u.x0, d.x0) + 10, b = Math.min(u.x1, d.x1) - 10;
    if (b - a < 12) continue;
    const x = R.int(a, b), hw = R.int(3, 4), fu = u.fy - u.lv[x - u.x0], td = d.tops[x - d.x0];
    if (td - fu < 6 || td - fu > 70 || !rectRock(x - hw - 1, fu + 1, x + hw + 2, td - 1)) continue;
    for (let y = fu; y <= td; y++) for (let xx = x - hw; xx <= x + hw; xx++) air(xx, y);
    k++;
  }
  // 싱크홀: 풀밭 구멍 → 아래 방 (빛 구멍, 떨어지는 지름길)
  for (const s of o.sinks ?? []) {
    const r = rooms.find((q) => q.tops && s.x > q.x0 + 12 && s.x < q.x1 - 12 && q.top - s.y < 70);
    if (!r) continue;
    const yTop = s.y - 2, yBot = r.tops[s.x - r.x0] + 1, hw = R.int(3, 4);
    if (yBot <= yTop || !rectRock(s.x - hw - 2, s.y + 1, s.x + hw + 3, yBot - 1)) continue;
    const jl = walk(yBot - yTop + 4, 0, 1, 1, 3, 6), jr = walk(yBot - yTop + 4, 0, 1, 1, 3, 6);
    for (let y = yTop; y < yBot; y++) for (let x = s.x - hw - jl[y - yTop]; x <= s.x + hw + jr[y - yTop]; x++) air(x, y);
  }
  // 아직 끊긴 무리: 붙을 수 있는 길을 다시 찾아 (바깥과 이어진 무리에)
  for (let it = 0; it < 30; it++) {
    const root = find(0);
    let ok = false;
    for (const e of cands) {
      if (e.used) continue;
      const fa = find(e.a.id), fb = find(bId(e));
      if (fa === fb || (fa !== root && fb !== root)) continue;
      if (build(e)) {
        e.used = 1;
        ok = true;
        break;
      }
    }
    if (!ok) break;
  }

  if (globalThis.__dbg) {
    const comps = new Map();
    for (const r of rooms) comps.set(find(r.id), (comps.get(find(r.id)) ?? 0) + 1);
    const byT = {};
    for (const e of cands) if (e.used) byT[e.t] = (byT[e.t] ?? 0) + 1;
    console.log("loose", rooms.filter((r) => find(r.id) !== find(0)).map((r) => r.kind + "@" + r.x0 * 8 + "," + r.fy * 8).join(" "));
    console.log("shafts", shafts.length, shafts.map((q) => q.deg).join(","), "cave rooms", rooms.length, "comps", comps.size, "rootSize", comps.get(find(0)) ?? 0, "cands", cands.length, JSON.stringify(byT));
  }
  for (let it = 0; it < 24; it++) {
    const root = find(0), loose = rooms.filter((r) => find(r.id) !== root);
    if (!loose.length) break;
    let ok = false;
    for (const a of loose.sort(() => R() - 0.5).slice(0, 6)) {
      const bs = rooms.filter((r) => find(r.id) === root && Math.abs(r.fy - a.fy) >= 18 && Math.abs(r.fy - a.fy) <= 160 && Math.abs((r.x0 + r.x1) / 2 - (a.x0 + a.x1) / 2) < 420);
      bs.sort((p, q) => Math.abs((p.x0 + p.x1) / 2 - (a.x0 + a.x1) / 2) - Math.abs((q.x0 + q.x1) / 2 - (a.x0 + a.x1) / 2));
      for (const b of bs.slice(0, 4)) {
        const [u, d] = a.fy < b.fy ? [a, b] : [b, a];
        for (let t = 0; t < 10 && !ok; t++) {
          const lo = Math.min(a.x0, b.x0) - 120, hi = Math.max(a.x1, b.x1) + 120, xc = R.int(Math.max(30, lo), Math.min(lim - 30, hi));
          const snap = cell.slice(), nb = boxes.length, nl = later.length, np = par.length, ns = shafts.length;
          const sh = makeShaft(xc, u.fy - 1, d.fy + 1);
          if (sh && toShaft(u, sh) && toShaft(d, sh)) ok = true;
          else {
            cell.set(snap);
            boxes.length = nb;
            later.length = nl;
            par.length = np;
            shafts.length = ns;
          }
        }
        if (ok) break;
      }
      if (ok) break;
    }
    if (!ok) break;
  }
  for (const fn of later) fn();
  later.length = 0;

  // ── 방 역할 ──
  let nT = 0;
  const order = rooms.slice().sort(() => R() - 0.5);
  for (const r of order) {
    if (r.kind === "ruins" || r.door) continue;
    if (r.role) {
      tags.push({ x0: r.x0 * BLK, x1: r.x1 * BLK, y0: (r.top ?? r.fy - r.h) * BLK, y1: r.fy * BLK + 8, role: r.role });
      continue;
    }
    let role = "arena";
    if (r.peak || r.kind === "lake") role = "rest";
    else if (r.kind === "grand") role = "vista";
    else if (r.boss) role = "boss";
    else if (r.deg <= 1 && nT < 4 && r.kind !== "grand") ((role = "treasure"), nT++);
    else if (r.kind === "small" || R() < 0.3) role = "rest";
    tags.push({ x0: r.x0 * BLK, x1: r.x1 * BLK, y0: (r.top ?? r.fy - r.h) * BLK, y1: r.fy * BLK + 8, role });
  }
  P.roomTags = (P.roomTags ?? []).concat(tags);
  P.rooms = rooms;
  // 고치기에서 쓴다: 끊긴 두 곳 사이에 굴(또는 오르는 방)을 하나 더
  P.caveRoute = (xa, ya, xb, yb) => {
    const [x1, y1, x2, y2] = ya <= yb ? [xa, ya, xb, yb] : [xb, yb, xa, ya];
    if (Math.abs(x2 - x1) >= y2 - y1 + 4) tunnel(x1, y1, x2, y2);
    else {
      const sd = x2 >= x1 ? 1 : -1, W = 16;
      const xl = sd > 0 ? x1 + 4 : x1 - 4 - W, xr = xl + W;
      climbRoom(xl, xr, y1, y2, sd > 0 ? 0 : 1, (sd > 0 ? x2 >= xr : x2 > xl) ? (sd > 0 ? 1 : 0) : sd > 0 ? 0 : 1);
      tunnel(x1, y1, sd > 0 ? xl : xr - 1, y1);
      tunnel(x2 >= xr ? xr : xl - 1, y2, x2, y2);
      for (const fn of later) fn();
      later.length = 0;
    }
  };
}

// ── 하늘 ─────────────────────────────────────────────
// 산만 한 하늘섬(▲ 문): 꼭대기가 산 모양 — 양쪽 어깨(평평)에서 계단식으로 올라 정상 평지의 문. 밑은 거꾸로 선 산
// 큰 섬(쉼터·보물·전망)과 디딤돌 길: 돌·구름을 섞어 2~4개씩, 한쪽으로 비스듬히 오른다 (사다리처럼 쌓지 않는다)
// 길은 검사기와 같은 점프 크기로 놓는다: 한 번에 오름 ≤ 74px, 틈 44~92px, 뛰는 길(머리 자리)에 다른 것이 없게
// o: { sky: 하늘 구역, exits: [{x0, x1, t}] 하늘 구역 출입 섬 }
// 하늘섬 속: 동굴 방(둥근 천장)·폐허 방(네모 + 벽돌)·계단 굴·옆 입구. 좌표 px (구역 기준)
//   I = { kind: "cave"|"ruin", halls: [{x0,x1,F,h,role,kind,type}], pass: [[xa,fa,xb,fb,H]], mouths: [{side:"E"|"W", x, F}] }
//   돌려준다: 입구 [{side, e(섬 옆 x), F}]
// 네모난 섬 깨기 ① 윗면 낮은 둔덕 (가장자리·지킬 자리 keep [[x, 반폭]] 근처는 평평하게)
function hillOf(P, R, x0, x1, keep, A = 72) {
  const so = R() * 99, cx = (x0 + x1) / 2, hw = (x1 - x0) / 2;
  return (x) => {
    const au = Math.abs(x - cx) / hw;
    let p = clamp((0.74 - au) / 0.14, 0, 1);
    for (const [k, r] of keep) p = Math.min(p, clamp((Math.abs(x - k) - r) / 80, 0, 1));
    if (p <= 0) return 0;
    const n = 0.5 + 0.5 * P.N.fbm1(x / 230 + so, 2);
    return -Math.round((A * Math.max(0, n * 1.7 - 0.55) * p) / BLK) * BLK;
  };
}
// ② 옆면을 군데군데 안쪽으로 둥글게 깎는다 (입구·섬 속 길 근처는 피한다). depAt(x) = 윗면에서 밑면까지 깊이
function sideBites(P, R, x0, x1, top, depAt, I) {
  const boxes = [];
  for (const h of I?.halls ?? []) boxes.push([h.x0, h.x1, h.F - h.h, h.F]);
  for (const [xa, fa, xb, fb, H = 136] of I?.pass ?? []) boxes.push([Math.min(xa, xb), Math.max(xa, xb), Math.min(fa, fb) - H, Math.max(fa, fb)]);
  for (const m of I?.mouths ?? []) boxes.push([Math.min(m.x, m.edge ?? (m.side === "E" ? x1 : x0)) - 64, Math.max(m.x, m.edge ?? (m.side === "E" ? x1 : x0)) + 64, m.F - 260, m.F + 80]);
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? x0 : x1, D = depAt(ex - sd * 24);
    for (let k = 0, n = R.int(2, 3); k < n; k++) {
      const r = R.range(40, 88), yc = top + R.range(0.2, 0.85) * D;
      if (yc - r < top + 72 || yc + r > top + D - 24) continue;
      const cxx = ex + sd * r * 0.4;
      if (boxes.some(([a, b, c, d]) => cxx - r - 48 < b && cxx + r + 48 > a && yc - r - 48 < d && yc + r + 48 > c)) continue;
      const so = R() * 99;
      cutShape(P, cxx - r - 8, yc - r - 8, cxx + r + 8, yc + r + 8, (px, py) => r * (0.9 + 0.2 * (0.5 + 0.5 * P.N.fbm1(Math.atan2(py - yc, px - cxx) * 2 + so, 2))) - Math.hypot(px - cxx, py - yc));
    }
  }
}
function sideCrags(P, R, x0, x1, top, depAt, I) {
  const out = [], mF = (I?.mouths ?? []).map((m) => [m.side, m.F]);
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? x0 : x1, D = depAt(ex - sd * 24);
    for (let k = 0, n = R.int(3, 5); k < n; k++) {
      const rx = R.range(60, 150), ry = R.range(50, 120), yc = top + 170 + R() * Math.max(0, D - 220);
      if (yc + ry > top + D + 60) continue;
      if (mF.some(([side, F]) => (side === "E") === sd > 0 && Math.abs(yc - (F - 72)) < ry + 190)) continue;
      const cxx = ex + sd * R.range(10, 50), so = R() * 99;
      if (cxx - rx < 140 || cxx + rx > Math.min(P.WP, P.arenaFrom) - 140) continue;
      addShape(P, cxx - rx - 8, yc - ry - 8, cxx + rx + 8, yc + ry + 8, (px, py) => {
        const a = Math.atan2(py - yc, px - cxx), q = 0.82 + 0.3 * (0.5 + 0.5 * P.N.fbm1(a * 2.2 + so, 2));
        return (1 - Math.hypot((px - cxx) / rx, (py - yc) / ry) / q) * Math.min(rx, ry);
      });
      out.push({ x0: cxx - rx - 10, x1: cxx + rx + 10, y0: yc - ry - 10, y1: yc + ry + 10 });
    }
  }
  return out;
}
function innerNeed(I, T, x0, x1) {
  const need = [];
  for (const h of I?.halls ?? []) need.push([h.x0 - 24, h.x1 + 24, h.F - T + 64]);
  for (const [xa, fa, xb, fb] of I?.pass ?? []) need.push([Math.min(xa, xb) - 24, Math.max(xa, xb) + 24, Math.max(fa, fb) - T + 64]);
  for (const m of I?.mouths ?? []) need.push(m.side === "E" ? [m.x - 24, (m.edge ?? x1) + 8, m.F - T + 64] : [(m.edge ?? x0) - 8, m.x + 24, m.F - T + 64]);
  return (x, dep) => {
    for (const [a, b, d] of need) {
      const out = x < a ? a - x : x > b ? x - b : 0, v = d - out * 1.4;
      v > dep && (dep = v);
    }
    return dep;
  };
}
function skyInner(P, R, I, x0i, x1i, top, tags, topAt = null, bodyAt = null) {
  const sn = (v) => Math.round(v / BLK) * BLK, ruin = I.kind === "ruin", lo = x0i + 16, hi = x1i - 16;
  const box = (a, b, c, d) => cutShape(P, a - 4, b - 4, c + 4, d + 4, (px, py) => Math.min(px - a, c - px, py - b, d - py) + 0.5);
  const slab = (a, b, c, d) => addShape(P, a - 4, b - 4, c + 4, d + 4, (px, py) => Math.min(px - a, c - px, py - b, d - py) + 0.5);
  const wall = (a, b, c, d, m) => {
    const A = Math.max(a, lo), B = Math.min(c, hi);
    if (bodyAt) {
      // 파기 전 섬 바위 칸 [윗면, 밑면] 안에만: 하늘로 트인 출구 위·섬 옆 밖·입구 바깥엔 뒷벽이 없다
      for (let x = Math.floor(A / 8) * 8; x < B; x += 8) {
        const bc = bodyAt(x);
        if (!bc) continue;
        const xa = Math.max(A, x), xb = Math.min(B, x + 8), Y = Math.max(b, bc[0] + 16), Y1 = Math.min(d, bc[1] - 6);
        Y1 > Y && xb > xa && P.walls.push({ x0: xa, y0: Y, x1: xb, y1: Y1, m });
      }
      return;
    }
    if (!topAt) {
      const Y = Math.max(b, top + 16);
      B > A && d > Y && P.walls.push({ x0: A, y0: Y, x1: B, y1: d, m });
      return;
    }
    // 턱 섬: 32px 칸마다 그 자리 윗면 아래만
    for (let x = A; x < B; x += 32) {
      const xe = Math.min(B, x + 32), Y = Math.max(b, Math.max(topAt(x), topAt(xe - 1)) + 16);
      d > Y && P.walls.push({ x0: x, y0: Y, x1: xe, y1: d, m });
    }
  };
  const brick = (a, b, c, d) => P.mats.push({ x0: a - 24, y0: b - 24, x1: c + 24, y1: d + 24, m: "brick" });
  // 방 (뒷벽이 먼저 놓은 것이 이기므로 기둥 → 벽 순서)
  for (const h of I.halls ?? []) {
    const a = sn(h.x0), b = sn(h.x1), F = sn(h.F), H = h.h, cx = (a + b) / 2, hw = (b - a) / 2, so = R() * 99;
    if (ruin) {
      box(a, F - H, b, F);
      if (h.type !== "vault") for (let x = a + 40; x < b - 30; x += 64) (wall(x, F - H + 20, x + 16, F, "stem"), wall(x - 8, F - H + 12, x + 24, F - H + 20, "stem"));
      wall(a, F - H, b, F, h.type === "vault" ? "wood" : "brick");
      brick(a, F - H, b, F);
      // 천장 받침돌
      for (let x = a + 40; x < b - 30; x += 64) (slab(x - 16, F - H, x + 32, F - H + 8), slab(x - 8, F - H + 8, x + 24, F - H + 16));
      if (h.type === "sanctum") {
        slab(cx - 176, F - 16, cx + 176, F);
        slab(cx - 112, F - 32, cx + 112, F - 16);
        slab(cx - 56, F - 48, cx + 56, F - 32);
        tags.push({ x0: cx - 56, x1: cx + 56, y0: F - 220, y1: F - 40, role: "treasure", big: 1 });
      }
      if (h.type === "vault") for (const u of b - a > 300 ? [0.3, 0.7] : []) slab(sn(a + (b - a) * u) - 24, F - 16, sn(a + (b - a) * u) + 24, F);
    } else {
      const cl = (x) => {
        const u = (x - cx) / hw, e = Math.max(0, 1 - u * u);
        return F - H * (0.5 + 0.5 * Math.sqrt(e)) * (0.88 + 0.24 * (0.5 + 0.5 * P.N.fbm1(x / 44 + so, 3)));
      };
      cutShape(P, a - 4, F - H * 1.2 - 8, b + 4, F + 4, (px, py) => Math.min(F - py, py - cl(px), px - a, b - px) + 0.5);
      wall(a, F - H * 1.2, b, F, "rock");
      if (h.kind === "pool") {
        const pw = Math.min(208, (b - a) * 0.42), xa = sn(cx - pw / 2), xb = sn(cx + pw / 2);
        box(xa, F - 8, xb, F + 48);
        spec(P, xa, F + 8, xb, F + 48, "water");
      }
      if (h.kind === "pillar") for (let x = a + 56; x < b - 40; x += 72) wall(x, F - H, x + 20, F, "stem");
    }
    // 함정 자리 (던전 가시와 같은 방식)
    if (h.trap) (P.pads ??= []).push({ xa: sn(h.trap[0]), xb: sn(h.trap[1]), y: F, dungeon: 1 });
    h.role && h.type !== "sanctum" && tags.push({ x0: a + 24, x1: b - 24, y0: F - H, y1: F + 24, role: h.role });
    h.type === "sanctum" && tags.push({ x0: a + 24, x1: b - 24, y0: F - H, y1: F + 24, role: "arena" });
  }
  // 계단 굴: 단 높이 ≤48, 단 폭 = 거리/(단 수+1)
  for (const [xa, fa0, xb, fb0, H = 136] of I.pass ?? []) {
    // 윗면으로 나가는 계단: 위 끝 위를 덮는 얇은 바위가 남지 않게 위쪽을 넓게 튼다
    if (!ruin && fb0 <= (topAt ? topAt(xb) : top) + 8) {
      const dir = Math.sign(xb - xa), span = Math.abs(xb - xa) * 0.45;
      cutShape(P, Math.min(xb, xb - dir * span) - 4, fb0 - 200, Math.max(xb, xb - dir * span) + 4, fb0 + 40, (px, py) => {
        const t = clamp((xb - px) * dir / span, 0, 1);
        return Math.min(fb0 + t * (fb0 - fa0) * 0.45 - 40 - py, py - (fb0 - 200)) + 0.5;
      });
    }
    const fa = sn(fa0), fb = sn(fb0), rise = fb - fa, k = Math.max(1, Math.ceil(Math.abs(rise) / 48)), a = Math.min(xa, xb), b = Math.max(xa, xb), so = R() * 99;
    // 단 경계: 유적은 같은 폭, 자연 굴은 폭을 섞고(0.7~1.3) 모서리를 비스듬히 깎는다 (바위 턱)
    const avg = Math.abs(xb - xa) / (k + 1), rough = !ruin && avg >= 56;
    const wts = Array.from({ length: k + 1 }, () => (rough ? 0.8 + R() * 0.4 : 1)), tot = wts.reduce((p, q) => p + q, 0);
    const bnd = [0];
    for (const v of wts) bnd.push(bnd[bnd.length - 1] + v / tot);
    const lev = (i) => fa + (rise * i) / k;
    const fl = (x) => {
      const t = clamp((x - xa) / (xb - xa || 1), 0, 0.9999);
      let i = 0;
      while (i < k && t >= bnd[i + 1]) i++;
      if (!ruin && i < k) {
        // 단의 뒤쪽 55%는 다음 단까지 부드러운 비탈 (네모난 계단 대신 바위 비탈 턱)
        const f = (t - bnd[i]) / (bnd[i + 1] - bnd[i]), rr = 0.55;
        if (f > 1 - rr) {
          const u = (f - (1 - rr)) / rr;
          return lev(i) + (lev(i + 1) - lev(i)) * u * u * (3 - 2 * u);
        }
      }
      return sn(lev(i));
    };
    const cl = (x) => fl(x) - H - (ruin ? 0 : 12 * (0.5 + 0.5 * P.N.fbm1(x / 30 + so, 2)));
    cutShape(P, a - 4, Math.min(fa, fb) - H - 28, b + 4, Math.max(fa, fb) + 4, (px, py) => Math.min(fl(px) - py, py - cl(px), px - a, b - px) + 0.5);
    wall(a, Math.min(fa, fb) - H - 16, b, Math.max(fa, fb), ruin ? "brick" : "rock");
    // 벽돌은 단마다 굴 둘레만
    if (ruin) for (let i = 0; i <= k; i++) {
      const ta = xa + ((xb - xa) * i) / (k + 1), tb = xa + ((xb - xa) * (i + 1)) / (k + 1), fy = sn(fa + (rise * i) / k);
      brick(Math.min(ta, tb), fy - H, Math.max(ta, tb), fy);
    }
  }
  // 떨어지는 구멍 [x0, x1, 위 바닥, 아래 천장]
  for (const [a, b, y0, y1] of I.drops ?? []) (box(a, y0 - 8, b, y1 + 28), wall(a, y0, b, y1, ruin ? "brick" : "rock"), ruin && brick(a, y0, b, y1));
  // 옆 입구: 방 끝에서 섬 옆면 밖까지 곧은 굴
  const out = [];
  for (const m of I.mouths ?? []) {
    const F = sn(m.F), e = m.edge ?? (m.side === "E" ? x1i : x0i), a = m.side === "E" ? sn(m.x) : e - 64, b = m.side === "E" ? e + 64 : sn(m.x);
    if (ruin) box(a, F - 144, b, F);
    else {
      const cxm = (a + b) / 2, hx = (b - a) / 2, cym = F - 72, rr = 44;
      cutShape(P, a - 4, F - 152, b + 4, F + 4, (px, py) => {
        const qx = Math.abs(px - cxm) - (hx - rr), qy = Math.abs(py - cym) - (72 - rr);
        const o2 = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr;
        return py > F - 30 ? Math.min(F - py, hx - Math.abs(px - cxm)) + 0.5 : -o2 + 0.5;
      });
      // 바깥쪽 입구는 천장이 위로 벌어진다 (네모난 구멍 대신 동굴 어귀)
      const eo = m.side === "E" ? e : e, so2 = R() * 99;
      cutShape(P, eo - 140, F - 240, eo + 140, F - 100, (px, py) => {
        const d = Math.abs(px - eo), fl2 = F - 140 - 70 * clamp(1 - d / 130, 0, 1) ** 1.5 - 10 * P.N.fbm1(px / 24 + so2, 2);
        return Math.min(py - fl2, F - 100 - py, (m.side === "E" ? px - (e - 130) : e + 130 - px)) + 0.5;
      });
    }
    // 뒷벽은 입구가 뚫린 벽면까지만 (밖으로 삐져나오면 곧은 끝이 보인다)
    wall(m.side === "E" ? a : Math.max(a, e), F - 144, m.side === "E" ? Math.min(b, e) : b, F, ruin ? "brick" : "rock");
    ruin && brick(a, F - 144, b, F);
    out.push({ side: m.side, e, F });
  }
  return out;
}
function skyWorld(P, groundAt, style, o = {}) {
  const R = rng(P.seed ^ 0x51ca7e), { WP, arenaFrom } = P;
  const lim = Math.min(WP, arenaFrom) - 40;
  const sn = (v) => Math.round(v / BLK) * BLK;
  const st2 = style === "spire" ? "rock" : style;
  const objs = [], plats = [], tags = [];
  const hitB = (x0, x1, y0, y1, ex, cors = true) => {
    for (const b of objs) {
      if (ex && (ex.includes(b) || (b.of && ex.includes(b.of)))) continue;
      if (!cors && b.cor) continue;
      if (x0 < b.x1 && x1 > b.x0 && y0 < b.y1 && y1 > b.y0) return true;
    }
    return false;
  };
  const gAt = (x) => groundAt(clamp(x, 0, WP - 1));
  const gHit = (x0, x1, y1) => {
    for (let x = x0; x < x1; x += 16) if (gAt(x) < y1) return true;
    return gAt(x1) < y1;
  };
  const edge = (A, s) => (A.edgeAt ? A.edgeAt(s) : { x: s > 0 ? A.x1 - 8 : A.x0 + 8, y: A.top + (A.rim ?? 16) });
  // total을 m개로 (각 lo~hi)
  const part = (total, m, lo, hi) => {
    if (m <= 0) return [];
    if (total < lo * m - 0.5 || total > hi * m + 0.5) return null;
    const v = Array.from({ length: m }, () => R.range(lo, hi));
    for (let it = 0; it < 24; it++) {
      const diff = total - v.reduce((p, q) => p + q, 0);
      if (Math.abs(diff) < 0.5) break;
      for (let i = 0; i < m; i++) v[i] = clamp(v[i] + diff / m, lo, hi);
    }
    return Math.abs(total - v.reduce((p, q) => p + q, 0)) < 2 ? v : null;
  };
  // 디딤돌 길 계획: A 가장자리(d 쪽) → B 가장자리(-d 쪽)
  const HR = o.design ? 92 : 72, HA = o.design ? 80 : 70;
  const stonePlan = (A, B, d, maxN = 4) => {
    const a = edge(A, d), b = edge(B, -d), ends = [A.obj, B.obj];
    const span = (b.x - a.x) * d, rise = a.y - b.y;
    if (span < 44) return null;
    for (let n = Math.max(0, Math.ceil(Math.abs(rise) / HA) - 1); n <= maxN; n++) {
      // 돌 폭 w(52~116) 중 발 디딜 거리 w-8, 틈 g(44~92): span = Σg + Σ(w-8)
      const loW = Math.max(44 * n, span - 92 * (n + 1)), hiW = Math.min(108 * n, span - 44 * (n + 1));
      if (n === 0 ? span > 92 || Math.abs(rise) > HR : loW > hiW) continue;
      for (let tr = 0; tr < (o.design ? 20 : 8); tr++) {
        const ws = n ? part(R.range(loW, hiW), n, 44, 108) : [];
        if (!ws) continue;
        const gs = part(span - ws.reduce((p, q) => p + q, 0), n + 1, 44, 92);
        if (!gs) continue;
        const rs = Array.from({ length: n + 1 }, () => rise / (n + 1));
        for (let i = 0; i < n; i++) {
          const j = R.range(-12, 12);
          rs[i] += j;
          rs[i + 1] -= j;
        }
        if (rs.some((v) => v > HR || v < -HR)) continue;
        const st = [], cors = [];
        let ex = a.x, ey = a.y, bad = false, nCloud = 0;
        for (let i = 0; i <= n && !bad; i++) {
          const lx = ex + d * gs[i], ly = i < n ? sn(ey - rs[i]) : b.y;
          if (Math.abs(ey - ly) > HR + 4) bad = true;
          const cor = { x0: Math.min(ex, lx) + 2, x1: Math.max(ex, lx) - 2, y0: Math.min(ey, ly) - 100, y1: Math.max(ey, ly) - 4, cor: 1 };
          const W = globalThis.__why;
          if (bad || hitB(cor.x0, cor.x1, cor.y0, cor.y1, ends, false)) ((bad = true), W && (W.cor = (W.cor ?? 0) + 1));
          else if (!(i === 0 && A.ground) && !(i === n && B.ground) && gHit(cor.x0, cor.x1, cor.y1 + 8)) ((bad = true), W && (W.corG = (W.corG ?? 0) + 1));
          if (bad) break;
          cors.push(cor);
          if (i < n) {
            const low = gAt(lx) - (ey - rs[i]) < 110, w = ws[i] + 8, cloud = low || (nCloud < 2 && R() < 0.3);
            nCloud = cloud ? nCloud + 1 : 0;
            const t = cloud ? 16 : 32, dep = cloud ? 16 : o.design ? 56 : 40;
            const s = { x0: d > 0 ? lx : lx - w, x1: d > 0 ? lx + w : lx, y: ly, t, cloud, dep };
            let lowStep = false;
            if (o.design) {
              let gmin = 1e9, gmax = -1e9;
              for (let xx = s.x0 - 40; xx <= s.x1 + 40; xx += 8) {
                const g = gAt(xx);
                g < gmin && (gmin = g);
                g > gmax && (gmax = g);
              }
              lowStep = gmax - gmin > 20 && gmax - (s.y + dep) < 108;
            }
            // 같은 섬에서 출발·도착하는 다른 디딤돌 길의 점프 공간(cor)은 피하지 않는다 (한 섬 같은 쪽 끝에서 위아래로 길이 갈라질 때)
            // 같은 섬에서 갈라지는 다른 디딤돌 길의 점프 공간(cor)은 머리 위 여유를 70px까지만 본다 (100px 다 보면 길이 안 지어지고, 안 보면 머리가 막힌다)
            const shared = (b) => b.cor && b.ends && (b.ends.includes(ends[0]) || b.ends.includes(ends[1]));
            const hitS = (x0, x1, y0, y1) => objs.some((b) => !(ends.includes(b) || (b.of && ends.includes(b.of))) && x0 < b.x1 && x1 > b.x0 && y0 < b.y1 && y1 > (shared(b) ? b.y0 + 30 : b.y0));
            if (lowStep || hitS(s.x0 - 6, s.x1 + 6, s.y - 4, s.y + dep) || gHit(s.x0 - 8, s.x1 + 8, s.y + dep + 30)) {
              const W = globalThis.__why;
              W && (W[lowStep ? "low" : gHit(s.x0 - 8, s.x1 + 8, s.y + dep + 30) ? "stG" : "st"] = (W[lowStep ? "low" : gHit(s.x0 - 8, s.x1 + 8, s.y + dep + 30) ? "stG" : "st"] ?? 0) + 1);
              bad = true;
              break;
            }
            st.push(s);
            ex = d > 0 ? s.x1 - 8 : s.x0 + 8;
            ey = ly;
          }
        }
        if (!bad) for (const c of cors) c.ends = ends;
        if (!bad) return { st, cors, hops: cors.map((c, i) => ({ i, from: i === 0 ? a : { x: d > 0 ? st[i - 1].x1 - 8 : st[i - 1].x0 + 8, y: st[i - 1].y }, to: i < st.length ? { x: d > 0 ? st[i].x0 + 8 : st[i].x1 - 8, y: st[i].y } : b })) };
      }
    }
    return null;
  };
  const commit = (pl) => {
    (P.skyHops ??= []).push(...(pl.hops ?? []));
    for (const s of pl.st) {
      if (s.cloud) spec(P, s.x0, s.y, s.x1, s.y + 16, "cloud");
      else {
        // 바위 디딤돌: 윗면 두 블록 두께 판 + 아래 작은 덩이 (블록 맞추기에서 사라지지 않게)
        const sx0 = Math.round(s.x0 / BLK) * BLK, sx1 = Math.round(s.x1 / BLK) * BLK, y0 = s.y;
        const box = (a, b, c, d) => addShape(P, a - 4, b - 4, c + 4, d + 4, (px, py) => Math.min(px - a, c - px, py - b, d - py) + 0.5);
        box(sx0, y0, sx1, y0 + 16);
        if (o.design) {
          const lump = R.range(16, 34), mid = (sx0 + sx1) / 2 + R.range(-0.15, 0.15) * (sx1 - sx0), hw = (sx1 - sx0) / 2;
          addShape(P, sx0 - 4, y0, sx1 + 4, y0 + 20 + lump, (px, py) => {
            const u = (px - mid) / hw, e = 1 - u * u;
            return Math.min(px - sx0, sx1 - px, py - y0, y0 + 16 + (e > 0 ? lump * Math.pow(e, 0.8) : 0) - py) + 0.5;
          });
        } else {
          const q = Math.round(((sx1 - sx0) * R.range(0.18, 0.32)) / BLK) * BLK;
          sx1 - sx0 - 2 * q >= 16 && box(sx0 + q, y0 + 16, sx1 - q, y0 + 24 + (R() < 0.5 ? 8 : 0));
        }
      }
      objs.push({ x0: s.x0 - 4, x1: s.x1 + 4, y0: s.y - 2, y1: s.y + s.dep });
    }
    for (const c of pl.cors) objs.push(c);
  };
  const reach = (A, B, maxN = 4) => {
    const ds = [];
    edge(A, 1).x + 40 < edge(B, -1).x && ds.push(1);
    edge(A, -1).x - 40 > edge(B, 1).x && ds.push(-1);
    for (const d of ds) {
      const pl = stonePlan(A, B, d, maxN);
      if (pl) return pl;
    }
    return null;
  };
  // 큰 섬 (윗면은 평평하거나 한 단 솟은 곳이 있다)
  const isle = (cx, top, w, t, role, shape) => {
    const tiers = w > 520 && R() < 0.6 ? [(() => { const a = R.range(-0.6, 0.2); return { u0: a, u1: a + R.range(0.25, 0.45), off: -R.pick([24, 32, 40]) }; })()] : null;
    island(P, cx, top, w, t, st2, { sub: R() < 0.5, lobes: clamp(Math.round(w / 220), 1, 5), shape: shape ?? R.pick(["plateau", "plateau", "mesa", "twin"]), tiers });
    const I = { x0: cx - w / 2, x1: cx + w / 2, top, rim: 16, t };
    I.obj = { x0: I.x0 - 8, x1: I.x1 + 8, y0: top - 48, y1: top + t * 1.3 + 40 };
    objs.push(I.obj);
    plats.push(I);
    role && tags.push({ x0: I.x0 + 40, x1: I.x1 - 40, y0: top - 160, y1: top + 24, role });
    return I;
  };
  const isleBox = (cx, top, w, t, m = 30) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, y1 = top + t * 1.3 + 40;
    return { ok: x0 > 120 && x1 < lim - 40 && !hitB(x0 - m, x1 + m, top - 140, y1 + m) && !gHit(x0 - m, x1 + m, y1 + 60), x0, x1, y1 };
  };
  // 땅 발판 (평평한 곳에서만 출발)
  const groundPlat = (x, w = 120) => {
    if (x - w / 2 < 80 || x + w / 2 > lim - 40) return null;
    const y = gAt(x);
    for (const dx of [-w / 2, -w / 4, w / 4, w / 2]) if (Math.abs(gAt(x + dx) - y) > 10) return null;
    return { x0: x - w / 2, x1: x + w / 2, top: y, ground: 1, obj: null, edgeAt: (s) => { const xx = s > 0 ? x + w / 2 - 8 : x - w / 2 + 8; return { x: xx, y: gAt(xx) }; } };
  };

  // 하늘 구역: 출입 섬
  const ex = (o.exits ?? []).map((E) => {
    const top = gAt((E.x0 + E.x1) / 2);
    const I = { x0: E.x0, x1: E.x1, top, rim: 0, edgeAt: (s) => { const xx = s > 0 ? E.x1 - 10 : E.x0 + 10; return { x: xx, y: gAt(xx) + 8 }; } };
    I.obj = { x0: E.x0 - 8, x1: E.x1 + 8, y0: top - 40, y1: top + (E.t ?? 200) * 1.4 + 60 };
    objs.push(I.obj);
    plats.push(I);
    return I;
  });

  // ── ▲ 문: 산만 한 하늘섬 ──
  let G = null;
  if (P.isZone && P.upX >= 0) {
    const peakY = sn(o.design?.peakY ?? (o.sky ? R.range(2100, 2450) : R.range(2250, 2550)));
    const gw = sn(o.design?.gate?.w ?? R.range(1700, 2300));
    const cx = clamp(o.design?.gate?.cx ?? P.upX + R.range(-220, 220), gw / 2 + 160, lim - gw / 2 - 120);
    const dX = clamp(P.upX, cx - gw * 0.22, cx + gw * 0.22);
    const xa = cx - gw / 2, xb = cx + gw / 2;
    const pl = R.range(96, 150), shH = o.design?.gate?.sh ?? R.range(220, 330), shW = R.range(170, 260), tS = o.design?.gate?.tS ?? R.range(620, 860);
    const lv = [peakY];
    for (let y = peakY; y < peakY + shH + 80; ) lv.push((y += R.pick([24, 32, 40, 48])));
    const quant = (v) => {
      let k = 0;
      while (k < lv.length - 2 && lv[k + 1] <= v) k++;
      const a2 = lv[k], b2 = lv[k + 1], f = clamp((v - a2) / (b2 - a2), 0, 1);
      return a2 + (b2 - a2) * smooth(smooth(f));
    };
    const flat = o.design?.gate?.flat;
    const gKeep = [[dX, 220]];
    for (const [xa, fa, xb, fb] of o.design?.gate?.inner?.pass ?? []) (fa <= peakY && gKeep.push([xa, 110]), fb <= peakY && gKeep.push([xb, 110]));
    const gHill = flat ? hillOf(P, R, xa, xb, gKeep, 80) : null;
    const topFn = (x) => {
      if (flat) {
        const au = Math.abs(x - cx) / (gw / 2);
        return peakY + gHill(x) + (au > 0.88 ? Math.round((40 * ((au - 0.88) / 0.12) ** 2) / BLK) * BLK : 0);
      }
      const L = x < dX ? dX - xa : xb - dX, dd = Math.abs(x - dX);
      if (dd <= pl) return peakY;
      return quant(peakY + shH * Math.pow(clamp((dd - pl) / Math.max(40, L - pl - shW), 0, 1), 0.9));
    };
    const lobes = Array.from({ length: R.int(2, 4) }, () => ({ u: R.range(-0.55, 0.55), s: R.range(0.12, 0.26), d: R.range(90, 240) }));
    const gNeed = o.design?.gate?.inner ? innerNeed(o.design.gate.inner, peakY, xa, xb) : null;
    const so = R() * 99;
    const botFn = (x) => {
      const u = (x - cx) / (gw / 2);
      if (u <= -1 || u >= 1) return topFn(x) + 8;
      const e = 1 - u * u;
      let dep = 40 + (tS - 40) * Math.pow(e, o.design?.gate?.belly ?? 1.6);
      for (const Lb of lobes) {
        const v = (u - Lb.u) / Lb.s, q = 1 - v * v;
        if (q > 0) dep += Lb.d * q * q * e;
      }
      dep *= 0.88 + 0.24 * (0.5 + 0.5 * P.N.fbm1(x / 60 + so, 3));
      return topFn(x) + (gNeed ? gNeed(x, dep) : dep);
    };
    island(P, cx, peakY, gw, tS, st2, { topFn, botFn, sub: false, lobes: 0 });
    o.design?.gate?.mat && P.mats.push({ x0: xa - 16, y0: peakY - 80, x1: xb + 16, y1: peakY + tS * 1.6 + 60, m: o.design.gate.mat });
    G = { x0: xa, x1: xb, top: peakY, rim: 0, gate: 1, topAt: topFn };
    const gBody = new Map();
    if (o.design?.gate?.inner)
      for (let xx = Math.floor(xa / 8) * 8; xx < xb; xx += 8) {
        let yt = -1, yb = -1;
        for (let yy = peakY - 140; yy < peakY + tS * 2.4; yy += 4) {
          const sd = P.F.solid(xx + 4, yy);
          if (sd && yt < 0) yt = yy;
          if (yt >= 0 && !sd) ((yb = yy), (yy = 1e9));
        }
        yt >= 0 && gBody.set(xx, [yt, yb < 0 ? peakY + tS * 2.4 : yb]);
      }
    G.mouths = o.design?.gate?.inner ? skyInner(P, R, o.design.gate.inner, xa, xb, peakY, tags, null, (x) => gBody.get(Math.floor(x / 8) * 8) ?? null) : [];
    G.edgeAt = (s) => {
      const x = s > 0 ? xb - 12 : xa + 12;
      return { x, y: topFn(x) };
    };
    G.obj = { x0: xa - 8, x1: xb + 8, y0: peakY - 96, y1: peakY + shH + 60 };
    objs.push(G.obj);
    for (let x = xa; x < xb; x += 96) {
      let yb = 0;
      for (let xx = x; xx <= Math.min(xb, x + 96); xx += 8) yb = Math.max(yb, botFn(xx));
      objs.push({ x0: x - 4, x1: Math.min(xb, x + 96) + 4, y0: peakY, y1: yb + 24, of: G.obj });
    }
    plats.push(G);
    P.peak = { x: Math.round((dX - 8) / TS) * TS + 8, y: peakY };
    tags.push({ x0: dX - pl, x1: dX + pl, y0: peakY - 200, y1: peakY + 8, role: "rest" });
  }

  // 아래 발판 A에서 위 발판 B로: 바로 못 가면 큰 섬을 하나씩 놓으며 오른다 (B 바깥쪽으로 다가간다)
  const ascend = (A, B, maxSteps = 9) => {
    let cur = A;
    // 다가갈 쪽은 처음에 정한다 (이리저리 떠돌지 않게)
    const mid = (B.x0 + B.x1) / 2, toR = (A.x0 + A.x1) / 2 > mid;
    const tx = toR ? B.x1 + R.range(260, 520) : B.x0 - R.range(260, 520);
    for (let step = 0; step < maxSteps; step++) {
      const dpl = reach(cur, B, 6);
      if (dpl) return commit(dpl), true;
      const ccx = (cur.x0 + cur.x1) / 2, near = cur.top - edge(B, toR ? 1 : -1).y < 460;
      let best = null, bs = -1e9;
      const why = { y: 0, dir: 0, box: 0, reach: 0 };
      for (let t = 0; t < 90; t++) {
        const ey = edge(B, toR ? 1 : -1).y;
        const yW = sn(cur.top - ey > 380 ? cur.top - R.range(200, 340) : Math.min(cur.top + 60, ey + R.range(60, 260)));
        if (yW <= ey + 40) {
          why.y++;
          continue;
        }
        const w = sn(R.range(320, 700)), tt = R.range(90, 200), d = R() < 0.5 ? 1 : -1, sp = R.range(160, 760);
        const e = edge(cur, d), nearX = e.x + d * sp, cx = d > 0 ? nearX + w / 2 - 8 : nearX - w / 2 + 8;
        if (Math.abs(cx - tx) > Math.max(Math.abs(ccx - tx) + 150, 700) || (yW > cur.top - 70 && Math.abs(cx - tx) > Math.abs(ccx - tx) - 120)) {
          why.dir++;
          continue;
        }
        const bx = isleBox(cx, yW, w, tt);
        if (!bx.ok) {
          why.box++;
          continue;
        }
        const W = { x0: bx.x0, x1: bx.x1, top: yW, rim: 16, t: tt };
        W.obj = { x0: W.x0 - 8, x1: W.x1 + 8, y0: yW - 48, y1: bx.y1 };
        objs.push(W.obj);
        const pl = reach(cur, W, 4);
        objs.pop();
        if (!pl) {
          why.reach++;
          continue;
        }
        const sc = cur.top - yW - Math.abs(cx - tx) * (near ? 1.6 : 0.7) + R() * 60;
        if (sc > bs) ((bs = sc), (best = { W, pl }));
      }
      if (!best) {
        globalThis.__sky && console.log("ascend stuck at", Math.round((cur.x0 + cur.x1) / 2), Math.round(cur.top), "step", step, JSON.stringify(why), "tx", Math.round(tx));
        return false;
      }
      commit(best.pl);
      cur = isle((best.W.x0 + best.W.x1) / 2, best.W.top, best.W.x1 - best.W.x0, best.W.t, R() < 0.5 ? "rest" : "arena");
      cur.linked = 1;
      globalThis.__sky && console.log("  waypoint", Math.round((cur.x0 + cur.x1) / 2), Math.round(cur.top));
    }
    return false;
  };

  // 하늘 구역: 왼쪽 출입 섬 → 오른쪽 출입 섬 (큰 섬을 건너며)
  if (o.sky && ex.length >= 2) {
    let cur = ex[0];
    const goal = ex[ex.length - 1];
    for (let step = 0; step < 14; step++) {
      const dpl = reach(cur, goal, 5);
      if (dpl) {
        commit(dpl);
        break;
      }
      let best = null, bs = -1e9;
      for (let t = 0; t < 90; t++) {
        const w = sn(R.range(420, 980)), tt = R.range(140, 300), sp = R.range(380, 760);
        const yW = sn(clamp(cur.top + R.range(-200, 160), 4150, 4950));
        const e = edge(cur, 1), cx = e.x + sp + w / 2 - 8;
        if (cx + w / 2 > edge(goal, -1).x - 60) continue;
        const bx = isleBox(cx, yW, w, tt);
        if (!bx.ok) continue;
        const W = { x0: bx.x0, x1: bx.x1, top: yW, rim: 16, t: tt };
        W.obj = { x0: W.x0 - 8, x1: W.x1 + 8, y0: yW - 48, y1: bx.y1 };
        objs.push(W.obj);
        const pl = reach(cur, W, 5);
        objs.pop();
        if (!pl) continue;
        const sc = cx + R() * 200;
        if (sc > bs) ((bs = sc), (best = { W, pl }));
      }
      if (!best) break;
      commit(best.pl);
      cur = isle((best.W.x0 + best.W.x1) / 2, best.W.top, best.W.x1 - best.W.x0, best.W.t, step % 2 ? "arena" : "rest");
    }
  }

  // 설계 섬: 정한 자리·모양·역할. 길은 설계도 links 순서대로 (디딤돌은 모든 섬을 먼저 놓은 뒤에 — 섬을 피해 놓인다)
  //   턱 섬(step): 한쪽이 dy 높다. 낮은 쪽 끝으로 들어와 턱을 올라, 높은 쪽 끝(턱 위)에서 낮은 쪽 위로 디딤돌을 띄워 되돌아 오른다
  if (o.design) {
    const D = o.design, byId = new Map(), log = (...a) => globalThis.__sky && console.log(...a);
    const shapeDep = (q, x0, w, t) => {
      const sh = q.shape ?? "chunk", so = R() * 99, hw = w / 2, cx = x0 + hw;
      const lobes = [];
      if (sh === "twin") for (const u of [-0.42, 0.42]) lobes.push({ u: u + R.range(-0.06, 0.06), s: R.range(0.26, 0.34), d: t * R.range(0.55, 0.7) });
      else if (sh === "lumpy") for (const u of [-0.55, -0.1, 0.4].map((v) => v + R.range(-0.08, 0.08))) lobes.push({ u, s: R.range(0.14, 0.22), d: t * R.range(0.35, 0.6) });
      else if (sh !== "block") for (let k = 0, n = sh === "spire" ? 1 : R.int(1, 2); k < n; k++) lobes.push({ u: R.range(-0.4, 0.4), s: R.range(0.2, 0.34), d: t * (sh === "spire" ? R.range(0.06, 0.12) : R.range(0.12, 0.24)) });
      // 큰 덩어리(block): 섬마다 밑 모양을 다르게 (form) — 옆은 둥글게 줄어든다. 속 굴·방 밑에는 늘 바위가 남게 (need)
      let form = null, need = null;
      if (sh === "block") {
        const fm = q.form ?? R.pick(["bowl", "cone", "keel", "tiers", "roots"]);
        form = { fm, a: fm === "cone" ? 0.12 : fm === "bowl" ? 0.3 : 0.2, p: fm === "cone" ? 1.4 : fm === "bowl" ? 0.45 : 0.8, sk: fm === "keel" ? R.pick([-1, 1]) * R.range(0.3, 0.45) : 0 };
        if (fm === "roots") for (let k = 0, n = R.int(4, 6); k < n; k++) lobes.push({ u: -0.75 + (1.5 * (k + R.range(0.2, 0.8))) / n, s: R.range(0.06, 0.11), d: t * R.range(0.25, 0.55) });
        else if (fm === "keel") lobes.push({ u: form.sk, s: R.range(0.3, 0.4), d: t * R.range(0.35, 0.5) });
        else lobes.push({ u: R.range(-0.3, 0.3), s: R.range(0.22, 0.32), d: t * R.range(0.15, 0.3) });
      }
      return (x) => {
        const u = (x - cx) / hw;
        if (u <= -1 || u >= 1) return 8;
        const e = 1 - u * u;
        let dep = form ? t * (form.a + (1 - form.a) * Math.pow(Math.max(0, 1 - ((u - form.sk * 0.5) / (1 + Math.abs(form.sk) * 0.5)) ** 2), form.p)) : sh === "spire" ? t * (0.16 + 0.84 * Math.pow(e, 2.2)) : sh === "slab" ? t * (0.34 + 0.4 * Math.pow(e, 0.45)) : sh === "lumpy" ? t * (0.2 + 0.3 * e) : sh === "tower" ? t * (0.42 + 0.58 * Math.pow(e, 0.5)) : sh === "twin" ? t * (0.2 + 0.22 * e) : t * (0.22 + 0.62 * Math.pow(e, 0.8));
        for (const L of lobes) {
          const v = (u - L.u) / L.s, qq = 1 - v * v;
          if (qq > 0) dep += L.d * qq * qq * Math.sqrt(e);
        }
        if (form?.fm === "tiers") dep = Math.round(dep / 64) * 64 + 16 * P.N.fbm1(x / 30 + so, 2);
        dep = dep * (0.92 + 0.16 * (0.5 + 0.5 * P.N.fbm1(x / 46 + so, 3))) + 3 * P.N.n1(x / 7 + so);
        // 속 굴 밑 받침: 바깥으로 갈수록 비스듬히 줄어든다
        return dep;
      };
    };
    // 섬 하나: 낮은 쪽(lo)·높은 쪽(hi) 발판, 충돌 상자는 48px 조각마다 실제 밑면까지
    for (const q of D.isles) {
      const w = q.w, t = q.t, x0 = q.cx - w / 2, x1 = q.cx + w / 2, top = sn(q.top);
      const st = q.step, rz = st ? sn(x0 + w * st.at) : null, hiTop = st ? top - st.dy : top;
      const ur = st ? (rz - q.cx) / (w / 2) : 0;
      const tiers = st ? [st.hi === "R" ? { u0: ur, u1: 2, off: -st.dy } : { u0: -2, u1: ur, off: -st.dy }] : null;
      const dep = shapeDep(q, x0, w, t);
      const bx = isleBox(q.cx, hiTop, w, t, 20);
      bx.ok || log("isle box warn", q.id, Math.round(q.cx), top);
      const keep = [[rz ?? -1e9, 120]];
      for (const [xa, fa, xb, fb] of q.inner?.pass ?? []) (fa <= top && keep.push([xa, 110]), fb <= top && keep.push([xb, 110]));
      const hill0 = q.shape === "block" ? hillOf(P, R, x0, x1, keep) : null;
      const riser = q.shape === "block" && st && st.dy > 200 ? (x) => {
        const d = st.hi === "L" ? x - rz : rz - x;
        if (d < 0) return -d < 200 ? Math.round((96 * (1 + d / 200) ** 2) / BLK) * BLK : 0;
        return d < 160 ? -Math.round((0.35 * st.dy * (1 - d / 160) ** 2) / BLK) * BLK : 0;
      } : null;
      const hill = hill0 || riser ? (x) => (hill0 ? hill0(x) : 0) + (riser ? riser(x) : 0) : null;
      // 밑면: 높은 쪽·낮은 쪽 각자 윗면에서 잰 깊이 + 섬 속 길 받침(절대 높이), 땅에서 240px 이상
      const lTop = (x) => (st && (st.hi === "R" ? x >= rz : x < rz) ? hiTop : top);
      const nAbs = q.shape === "block" && q.inner ? innerNeed(q.inner, 0, x0, x1) : null;
      // 턱 경계 밑면은 300px에 걸쳐 부드럽게
      const bTop = (x) => { if (!st) return top; const k = clamp(((st.hi === "R" ? x - rz : rz - x) + 150) / 300, 0, 1); return top + (hiTop - top) * smooth(k); };
      const botAbs = (x) => Math.min(nAbs ? nAbs(x, bTop(x) + dep(x)) : bTop(x) + dep(x), Math.max(lTop(x) + 24, gAt(x) - 240));
      island(P, q.cx, top, w, t, st2, { sub: false, lobes: 0, tiers, hill, round: q.shape === "block" ? 40 : 0, botFn: botAbs });
      // 섬 몸 재질 (잎 덩어리 · 나뭇가지 등): 칠할 때만 쓰인다
      q.mat && P.mats.push({ x0: x0 - 16, y0: hiTop - 80, x1: x1 + 16, y1: top + t * 1.8 + 60, m: q.mat });
      const head = { x0: 0, x1: 0, y0: -9, y1: -9 };
      objs.push(head);
      if (q.shape === "block") {
      }
      // 파기 전 섬 바위 칸마다 [윗면, 밑면] (섬 속 뒷벽을 이 안에만 그린다)
      const bodyCols = new Map();
      if (q.inner)
        for (let xx = Math.floor(x0 / 8) * 8; xx < x1; xx += 8) {
          let yt = -1, yb = -1;
          for (let yy = hiTop - 130; yy < top + t * 3 + 400; yy += 4) {
            const sd = P.F.solid(xx + 4, yy);
            if (sd && yt < 0) yt = yy;
            if (yt >= 0 && !sd) ((yb = yy), (yy = 1e9));
          }
          yt >= 0 && bodyCols.set(xx, [yt, yb < 0 ? top + t * 3 + 400 : yb]);
        }
      if (q.inner)
        for (const m of skyInner(P, R, q.inner, x0, x1, top, tags, (x) => (st && (st.hi === "R" ? x >= rz : x < rz) ? hiTop : top), (x) => bodyCols.get(Math.floor(x / 8) * 8) ?? null)) {
          const pt = { x0: m.e - 40, x1: m.e + 40, top: m.F, rim: 0, t, obj: head, bpId: q.id, edgeAt: () => ({ x: m.e + (m.side === "E" ? -8 : 8), y: m.F }) };
          plats.push(pt);
          byId.set(q.id + (m.side === "E" ? ">" : "<"), pt);
        }
      const topAt = (x) => (st && (st.hi === "R" ? x >= rz : x < rz) ? hiTop : top);
      for (let x = x0; x < x1; x += 48) {
        const xb = Math.min(x1, x + 48);
        let yb = 0, hb = 0;
        for (let xx = x; xx <= xb; xx += 8) ((yb = Math.max(yb, botAbs(Math.min(xx, x1 - 1)))), hill && (hb = Math.min(hb, hill(xx))));
        objs.push({ x0: x - (x === x0 ? 8 : 0), x1: xb + (xb === x1 ? 8 : 0), y0: Math.min(topAt(x), topAt(xb - 1)) + hb - 56, y1: yb + 16, of: head });
      }
      const part = (a, b, tp, outerL, outerR) => {
        const I = { x0: a, x1: b, top: tp, rim: 16, t, obj: head, bpId: q.id };
        const od = q.shape === "block" ? 48 : 16;
        const rd = riser && tp === hiTop ? 88 : 0;
        I.edgeAt = (sd) => (sd > 0 ? (outerR ? { x: b - 8, y: tp + od } : { x: b - 8, y: tp + rd }) : outerL ? { x: a + 8, y: tp + od } : { x: a + 8, y: tp + rd });
        return I;
      };
      let lo, hi = null;
      if (!st) lo = part(x0, x1, top, true, true);
      else if (st.hi === "R") ((lo = part(x0, rz, top, true, false)), (hi = part(rz, x1, hiTop, false, true)));
      else ((hi = part(x0, rz, hiTop, true, false)), (lo = part(rz, x1, top, false, true)));
      plats.push(lo);
      byId.set(q.id, lo);
      hi && (plats.push(hi), byId.set(q.id + "^", hi));
      q.role && tags.push({ x0: x0 + 32, x1: x1 - 32, y0: hiTop - 160, y1: top + 24, role: q.role });
      P.islands.length && (P.islands[P.islands.length - 1].bp = q.id);
    }
    G && byId.set("G", G);
    // ▲ 섬 옆 입구 (속 신전)
    for (const m of G?.mouths ?? []) byId.set("G" + (m.side === "E" ? ">" : "<"), { x0: m.e - 40, x1: m.e + 40, top: m.F, rim: 0, obj: G.obj, edgeAt: () => ({ x: m.e + (m.side === "E" ? -8 : 8), y: m.F }) });
    const port = (k, toward = null) => {
      if (k.startsWith("G:") && G) {
        const x = Number(k.slice(2));
        return { x0: x - 40, x1: x + 40, top: G.topAt(x), rim: 0, obj: G.obj, edgeAt: (sd) => ({ x: x + sd * 24, y: G.topAt(x + sd * 24) }) };
      }
      if (!k.startsWith("g:")) return byId.get(k);
      // 시드마다 땅이 조금씩 달라서: 정한 자리에서 가까운 평평한 곳부터 찾는다
      const gx = Number(k.slice(2));
      let g = null;
      const sg = toward != null && toward > gx ? 1 : -1;
      for (let d = 0; d <= 96 && !g; d += 16) g = groundPlat(gx + sg * d, 80) ?? (d ? groundPlat(gx - sg * d, 80) : null);
      // 평지가 없으면 비탈 그 자리에서 (비탈에서도 뛸 수 있다)
      g ??= { x0: gx - 40, x1: gx + 40, top: gAt(gx), ground: 1, obj: null, edgeAt: (sd) => ({ x: gx + sd * 32, y: gAt(gx + sd * 32) }) };
      g && (g.obj = { x0: 0, x1: 0, y0: -9, y1: -9 });
      return g;
    };
    for (const [a, b, maxN = 4] of D.links) {
      const B = port(b), A = port(a, B ? (B.x0 + B.x1) / 2 : null);
      if (!A || !B) {
        log("link missing", a, b);
        continue;
      }
      let pl = null;
      globalThis.__sky && (globalThis.__why = {});
      for (let t = 0; t < 24 && !pl; t++) pl = reach(A, B, maxN + (t >= 16 ? 1 : 0));
      // 땅에서 오르는 길이 안 되면 출발점을 옆으로 옮겨 본다
      if (!pl && a.startsWith("g:")) for (const dx of [-96, 96, -192, 192, -288, 288]) {
        const A2 = port("g:" + (Number(a.slice(2)) + dx), (B.x0 + B.x1) / 2);
        for (let t = 0; t < 8 && A2 && !pl; t++) pl = reach(A2, B, maxN + 1);
        if (pl) break;
      }
      if (pl) {
        commit(pl);
        B.linked = 1;
        log("link", a, "→", b, "stones", pl.st.length);
      } else {
        const d = (A.x0 + A.x1) / 2 < (B.x0 + B.x1) / 2 ? 1 : -1, ea = edge(A, d), eb = edge(B, -d);
        log("link FAIL", JSON.stringify(globalThis.__why), a, "→", b, "span", Math.round((eb.x - ea.x) * d), "rise", Math.round(ea.y - eb.y), "from", Math.round(ea.x), Math.round(ea.y), "to", Math.round(eb.x), Math.round(eb.y));
      }
    }
    G && (G.done = 1);
  }
  // ▲ 문까지 오르는 길: 출발점(산 정상 평지 → 높은 땅 → 하늘 구역은 큰 섬)마다 해 본다
  if (G && !G.done) {
    const starts = [];
    if (o.sky || o.design) for (const I of plats) I !== G && I.linked !== 0 && starts.push(I);
    if (!o.sky) {
      if (P.mtn) {
        const mx = (P.mtn.pa + P.mtn.pb) / 2, g = groundPlat(mx, clamp(P.mtn.pb - P.mtn.pa - 40, 80, 320));
        g && starts.push(g);
      }
      for (let x = 300; x < lim - 300; x += 160) {
        const g = groundPlat(x);
        g && starts.push(g);
      }
    }
    const gx = (G.x0 + G.x1) / 2;
    starts.sort((a, b) => a.top - b.top + (Math.abs((a.x0 + a.x1) / 2 - gx) - Math.abs((b.x0 + b.x1) / 2 - gx)) * 0.3);
    globalThis.__sky && console.log("G", Math.round(G.x0), Math.round(G.x1), Math.round(G.top), "edges", JSON.stringify(G.edgeAt(-1)), JSON.stringify(G.edgeAt(1)), "starts", starts.length, starts.slice(0, 8).map((q) => Math.round((q.x0 + q.x1) / 2) + "," + Math.round(q.top)).join(" "));
    for (const s of starts.slice(0, 8)) if (ascend(s, G)) break;
  }

  // 덤 섬: 보물·전망·쉼터 (아래쪽 땅·섬에서 디딤돌로 잇는다)
  const extra = (n, yLo, yHi) => {
    for (let k = 0, t = 0; k < n && t < n * 60; t++) {
      const w = sn(R.range(360, 980)), tt = R.range(140, 320), cx = R.range(w / 2 + 140, lim - w / 2 - 60), top = sn(R.range(yLo, yHi));
      const bx = isleBox(cx, top, w, tt, 80);
      if (!bx.ok) continue;
      const I = { x0: bx.x0, x1: bx.x1, top, rim: 16, t: tt };
      I.obj = { x0: I.x0 - 8, x1: I.x1 + 8, y0: top - 48, y1: bx.y1 };
      objs.push(I.obj);
      const lows = plats.filter((A) => A.top > top + 60 && A.top < top + 380 && (A.x1 < I.x0 ? I.x0 - A.x1 : A.x0 - I.x1) < 1100);
      for (const gx of [I.x0 - R.range(220, 520), I.x1 + R.range(220, 520)]) {
        const g = !o.sky && gAt(gx) > top + 60 && gAt(gx) < top + 380 ? groundPlat(gx) : null;
        g && lows.push(g);
      }
      let pl = null;
      for (const A of lows.sort(() => R() - 0.5)) if ((pl = reach(A, I, 4))) break;
      objs.pop();
      if (!pl) continue;
      commit(pl);
      isle((I.x0 + I.x1) / 2, top, I.x1 - I.x0, tt, k === 0 ? "treasure" : R() < 0.5 ? "vista" : "rest");
      k++;
    }
  };
  const bands = o.design ? [] : o.sky ? [[4000, 4700, 3], [3300, 4000, 3], [2600, 3300, 2]] : [[4050, 4500, 2], [3450, 4050, 2], [2800, 3450, 2]];
  for (const [a, b, n] of bands) extra(n, a, b);
  P.roomTags = (P.roomTags ?? []).concat(tags);
}


// ── 던전 (설계도): 격자 칸 64×48블록(512×384px). 직사각형 방 + 수평 문 + 탑 방(두 층 높이). 경사 없음 ──
// 방 종류: guard 경비실(엄폐 블록·초소) · colonnade 회랑(천장 받침·뒤 기둥) · arena 투기장(발코니 2단·가운데 단) ·
//          trap 함정 복도(낮은 천장·가시) · vault 보물실(받침대) · shrine 쉼터(샘) · sanctum 성소(3단 제단·발코니)
// 탑(towers): 한 열 × 두 층 높이 방. 윗층 바닥 높이에 착지대(문 쪽), 그 아래 발판 넷 (짜임 zig·float·ring·pillar — 탑마다 다르게)
// 벽돌은 방·탑·문 둘레 3칸 껍데기만 (그 바깥은 바위)
// 돌려준다: { links: [{id, x, y, comp}] 서쪽 벽 동굴 길 문(칸), rootComp: 정문과 이어진 무리, find }
function dungeonWorld(P, C, D) {
  const R = rng(P.seed ^ 0xd0d0e), { cell, NX, NY } = C;
  const setC = (x, y, v) => x >= 1 && y >= 1 && x < NX - 1 && y < NY - 1 && (cell[y * NX + x] = v);
  const rect = (x0, y0, x1, y1, v) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setC(x, y, v);
  };
  const back = (x0, y0, x1, y1, m) => P.walls.push({ x0: x0 * BLK, y0: y0 * BLK, x1: x1 * BLK, y1: y1 * BLK, m });
  // 던전 껍데기 재질: 기본 벽돌, 설계가 mat을 주면 그 재질 (wood = 나무껍질 성채)
  const brick = (x0, y0, x1, y1, m = 3) => P.mats.push({ x0: (x0 - m) * BLK, y0: (y0 - m) * BLK, x1: (x1 + m) * BLK, y1: (y1 + m) * BLK, m: D.mat ?? "brick" });
  const tag = (x0, y0, x1, y1, role) => (P.roomTags ??= []).push({ x0: x0 * BLK, x1: x1 * BLK, y0: y0 * BLK, y1: y1 * BLK + 8, role });
  const MW = 64, MH = 48, GX = Math.round(D.x0 / BLK), GY = Math.round(D.y0 / BLK);
  const colX = (c) => GX + c * MW, stY = (s) => GY + s * MH, floorR = (s) => stY(s + 1) - 4;
  // 이어짐 (방·탑 무리)
  const par = new Map(), find = (a) => (par.get(a) === a ? a : (par.set(a, find(par.get(a))), par.get(a)));
  const node = (k) => (par.has(k) || par.set(k, k), k), uni = (a, b) => par.set(find(node(a)), find(node(b)));
  const rooms = D.rooms.map((r) => ({ ...r })), towers = (D.towers ?? []).map((t) => ({ ...t }));
  const at = (s, c) => rooms.find((r) => r.s === s && c >= r.c0 && c <= r.c1) ?? towers.find((t) => t.col === c && (t.s === s || t.s + 1 === s));
  // 판: 윗면 2칸 + 아래로 좁아지는 받침 (side 0 서벽에 붙음 · 1 동벽에 붙음 · -1 떠 있음), br 받침 줄 수
  const ledge = (a, b, row, side, br = 2) => {
    rect(a, row, b, row + 2, 1);
    for (let k = 0; k < br; k++) {
      const c = 3 * (k + 1);
      if (side === 0) rect(a, row + 2 + k, b - c, row + 3 + k, 1);
      else if (side === 1) rect(a + c, row + 2 + k, b, row + 3 + k, 1);
      else k === 0 && rect(a + 2, row + 2, b - 2, row + 3, 1);
    }
  };
  // 문: 두 방 사이 벽을 12칸 높이로 뚫는다
  const door = (xa, xb, F) => (rect(xa, F - 12, xb, F, -1), brick(xa, F - 12, xb, F));
  // ── 방 ──
  for (const r of rooms) {
    node(r.id);
    const x0 = colX(r.c0) + 2, x1 = colX(r.c1 + 1) - 2, F = floorR(r.s), w = x1 - x0, cx = (x0 + x1) >> 1;
    const H = { guard: 30, colonnade: 38, arena: 42, trap: 16, vault: 22, shrine: 30, sanctum: 44 }[r.type] ?? 32;
    const top = F - H;
    Object.assign(r, { x0, x1, F, top });
    // 뒤 기둥 (먼저 놓은 뒷벽이 이긴다)
    if (r.type === "colonnade" || r.type === "sanctum" || r.type === "guard") {
      const st = r.type === "guard" ? 16 : 12, m = r.type === "guard" ? "rock" : "stem";
      for (let x = x0 + st - 1; x < x1 - 3; x += st) (back(x, top + 5, x + 2, F, m), back(x - 1, top + 4, x + 3, top + 5, m), back(x - 1, F - 1, x + 3, F, m));
    }
    if (r.type === "shrine") (back(cx - 11, top + 7, cx - 8, F, "stem"), back(cx + 8, top + 7, cx + 11, F, "stem"), back(cx - 13, top + 5, cx + 13, top + 7, "stem"));
    if (r.type === "arena") {
      for (let x = x0 + 20; x < x1 - 18; x += 22) back(x, top + 6, x + 3, F - 1, "stem");
      back(x0, top + 4, x1, top + 6, "stem");
    }
    rect(x0, top, x1, F, -1);
    back(x0, top, x1, F, r.type === "vault" ? "wood" : D.wall ?? "brick");
    brick(x0, top, x1, F);
    // 천장 받침돌 (회랑·성소): 기둥 위마다 거꾸로 선 계단 모양
    if (r.type === "colonnade" || r.type === "sanctum")
      for (let x = x0 + 11; x < x1 - 4; x += 12) (rect(x - 3, top, x + 5, top + 2, 1), rect(x - 2, top + 2, x + 4, top + 3, 1), rect(x - 1, top + 3, x + 3, top + 4, 1));
    if (r.type === "arena" || r.type === "sanctum") {
      // 발코니: 바닥 위 7칸 (양쪽), 그 위 10칸에 좁은 회랑 (위아래로 싸운다)
      const bw = Math.min(16, Math.floor(w / 5));
      ledge(x0, x0 + bw, F - 7, 0, 1);
      ledge(x1 - bw, x1, F - 7, 1, 1);
      if (H >= 40) (ledge(x0, x0 + 8, F - 16, 0, 1), ledge(x1 - 8, x1, F - 16, 1, 1));
      if (r.type === "arena" && w > 90) {
        const dw = Math.min(30, Math.floor(w / 4));
        rect(cx - (dw >> 1), F - 3, cx + (dw >> 1), F, 1);
      }
    }
    if (r.type === "sanctum") {
      rect(cx - 22, F - 2, cx + 22, F, 1);
      rect(cx - 14, F - 4, cx + 14, F - 2, 1);
      rect(cx - 7, F - 6, cx + 7, F - 4, 1);
      tag(cx - 7, F - 30, cx + 7, F - 6, "treasure");
      P.roomTags[P.roomTags.length - 1].big = 1;
    }
    if (r.type === "guard") {
      // 엄폐 블록 둘 + 한쪽 끝 초소 (판)
      for (const u of [0.3, 0.62]) {
        const bx = x0 + Math.round(w * u) + R.int(-2, 2);
        rect(bx, F - 3, bx + 5, F, 1);
      }
      R() < 0.5 ? ledge(x1 - 12, x1, F - 8, 1, 1) : ledge(x0, x0 + 12, F - 8, 0, 1);
    }
    if (r.type === "vault") for (const u of w > 70 ? [0.25, 0.5, 0.75] : [0.5]) {
      const px = x0 + Math.round(w * u);
      rect(px - 5, F - 2, px + 5, F, 1);
    }
    if (r.type === "shrine") {
      // 샘: 바닥을 2칸 판 물
      rect(cx - 6, F, cx + 6, F + 2, -1);
      P.specReq.push({ x0: cx - 6, y0: F, x1: cx + 6, y1: F + 2, k: "water" });
    }
    if (r.type === "trap") for (let x = x0 + 12; x + 8 < x1 - 10; x += 22) (P.pads ??= []).push({ xa: x * BLK, xb: (x + 8) * BLK, y: F * BLK, dungeon: 1 });
    tag(x0, top, x1, F, r.role);
  }
  // 같은 층 이웃 방 사이 문
  for (const a of rooms) for (const b of rooms) if (a.s === b.s && a.c1 + 1 === b.c0) (door(a.x1, b.x0, a.F), uni(a.id, b.id));
  // ── 탑: 두 층 높이 방. 정규형(착지대 서쪽, 폭 60칸) 발판을 짜임마다 놓고, 착지대가 동쪽이면 거울 ──
  const mkTower = (t, x0, x1, F0, F1, head) => {
    node(t.id);
    const W = x1 - x0, top = F0 - head, sc = W / 60, X = (a) => Math.round(a * sc);
    Object.assign(t, { x0, x1, F: F1, F0, top });
    back(x0 + X(16), top + 2, x0 + X(16) + 2, F1, "rock");
    back(x1 - X(16) - 2, top + 2, x1 - X(16), F1, "rock");
    rect(x0, top, x1, F1, -1);
    back(x0, top, x1, F1, D.wall ?? "brick");
    brick(x0, top, x1, F1);
    const both = t.up.includes("W") && t.up.includes("E"), M = !both && t.up.includes("E");
    const put = (a, b, row, side, br = 2) => {
      let p = X(a), q = X(b), sd = side;
      if (M) ((p = W - X(b)), (q = W - X(a)), (sd = side < 0 ? -1 : 1 - side));
      ledge(x0 + p, x0 + q, row, sd, br);
    };
    // 발판 사이 높이: 기본 9.6칸, 설계가 step을 주면 그만큼 (작을수록 촘촘)
    const n = Math.max(2, Math.round((F1 - F0) / (D.step ?? 9.6))), lv = (k) => F1 - Math.round(((F1 - F0) * k) / n);
    // 착지대 (윗층 문 높이)
    put(0, 18, F0, 0);
    both && put(42, 60, F0, 1);
    const jit = () => R.int(-2, 2);
    const pat = D.stairs ? "stair" : t.pat ?? "zig";
    if (pat === "stair") {
      // 계단식 (동굴 구역 던전): 위아래 한 단씩, 가로 4칸 틈으로 엇갈림 → 1단 점프로 오른다. 맨 위 단은 양쪽 착지대 밑에
      for (let k = n - 1; k >= 1; k--) {
        const j = n - 1 - k;
        if (j === 0) (put(4, 24, lv(k), -1), put(36, 56, lv(k), -1));
        else j % 2 ? put(32, 52, lv(k), -1) : put(8, 28, lv(k), -1);
      }
    } else if (pat === "float" && n === 5) {
      // 흔들림 없이: 발판 사이 틈 6칸 이하, 맨 위 발판에서 양쪽 착지대 모두 닿는다
      for (const [k, a, b] of [[1, 30, 44], [2, 10, 24], [3, 30, 44], [4, 24, 38]]) put(a, b, lv(k), -1);
    } else if (pat === "pillar" && n === 5) {
      // 가운데 굵은 기둥 (윗면이 둘째 발판), 양쪽 벽 발판에서 오른다
      put(0, 14, lv(1), 0);
      put(46, 60, lv(1), 1);
      const [p, q] = M ? [W - X(36), W - X(24)] : [X(24), X(36)];
      rect(x0 + p, lv(2), x0 + q, F1, 1);
      back(x0 + p, top + 2, x0 + q, lv(2), "rock");
      R() < 0.5 ? put(46, 60, lv(3), 1) : put(0, 14, lv(3), 0);
      put(22, 38, lv(4), -1);
    } else
      for (let k = n - 1; k >= 1; k--) {
        const j = n - 1 - k;
        if (j % 2 === 0) {
          const q = jit();
          put(22 + q, 38 + q, lv(k), -1);
        } else if (pat === "ring") (put(0, 14, lv(k), 0), put(46, 60, lv(k), 1));
        else j % 4 === 1 ? put(44 + jit(), 60, lv(k), 1) : put(0, 16 + jit(), lv(k), 0);
      }
    // 문: 윗층(착지대 높이)·아랫층(바닥)
    for (const [d, F, s] of [[t.up, F0, t.s], [t.down, F1, t.s + 1]]) {
      if (t.s < 0 && s < 0) continue;
      for (const sd of ["W", "E"]) {
        if (!d.includes(sd)) continue;
        const nb = at(s, sd === "W" ? t.col - 1 : t.col + 1);
        if (!nb && !(sd === "W" && t.col === 0 && t.cave)) continue;
        sd === "W" ? door(nb ? nb.x1 ?? colX(t.col) - 2 : colX(t.col) - 2, x0, F) : door(x1, nb ? nb.x0 ?? colX(t.col + 1) + 2 : colX(t.col + 1) + 2, F);
        nb && uni(t.id, nb.id);
      }
    }
    t.role && tag(x0, top, x1, F1, t.role);
  };
  for (const t of towers) mkTower(t, colX(t.col) + 2, colX(t.col + 1) - 2, floorR(t.s), floorR(t.s + 1), 40);
  // ── 정문: 고원 동쪽 비탈 문 → 짧은 복도 → 정문 탑(VG, 지표 높이 → 1층) ──
  if (D.gate) {
    // 정문 탑: 기본은 지표 높이에서 1층까지. 동굴 구역은 row(문 높이 px)·down(1층 문 쪽)·cave(서쪽 벽 동굴 문)를 정한다
    const surfRow = D.gate.row ? Math.round(D.gate.row / BLK) & ~1 : (FLOOR * TS) / BLK, col = D.gate.col, g = { id: "VG", col, s: -1, up: D.gate.up ?? "E", down: D.gate.down ?? "W", pat: "zig", role: "rest", cave: D.gate.cave };
    towers.push(g);
    mkTower(g, colX(col) + 12, colX(col) + 52, surfRow, floorR(0), 13);
    const dx = Math.round(D.gate.door / BLK);
    rect(g.x1, surfRow - 12, dx + 2, surfRow, -1);
    // 뒷벽은 판 자리 끝(문)까지 — 예전엔 마지막 2칸이 비어 언덕 속에 하늘이 보였다 (지표 위로 나온 부분은 clipWalls가 자른다)
    back(g.x1, surfRow - 12, dx + 2, surfRow, "brick");
    brick(g.x1, surfRow - 12, dx, surfRow);
    uni("VG", "@root");
  }
  // 서쪽 벽 동굴 길 (방·탑)
  const links = [];
  const caveDoor = (id, x0, F, of = id) => {
    rect(colX(0) - 3, F - 12, x0, F, -1);
    brick(colX(0) - 3, F - 12, x0, F);
    links.push({ id, x: colX(0) - 3, y: F, comp: null, of });
  };
  // 동쪽 벽 동굴 길 (cave: "E")
  const NCOL = D.cols ?? 6;
  const caveDoorE = (id, x1, F, of = id) => {
    rect(x1, F - 12, colX(NCOL) + 3, F, -1);
    brick(x1, F - 12, colX(NCOL) + 3, F);
    links.push({ id, x: colX(NCOL) + 2, y: F, comp: null, of, east: 1 });
  };
  for (const r of rooms) r.cave === "E" ? r.c1 === NCOL - 1 && caveDoorE(r.id, r.x1, r.F) : r.cave && r.c0 === 0 && caveDoor(r.id, r.x0, r.F);
  for (const t of towers)
    if (t.caveE && t.col === NCOL - 1) {
      t.caveE !== "down" && caveDoorE(t.id, t.x1, t.F0);
      t.caveE !== "up" && caveDoorE(t.caveE === "both" ? t.id + "_d" : t.id, t.x1, t.F, t.id);
    }
  for (const t of towers)
    if (t.cave && (t.col === 0 || t.id === "VG")) {
      t.cave !== "down" && caveDoor(t.id, t.x0, t.F0);
      t.cave !== "up" && caveDoor(t.cave === "both" ? t.id + "_d" : t.id, t.x0, t.F, t.id);
    }
  for (const L of links) L.comp = find(L.of);
  const rootComp = par.has("@root") ? find("@root") : null;
  const box = { x0: GX - 4, x1: colX(NCOL) + 4, y0: GY - 2 - (D.gate ? 40 : 0), y1: GY + (D.stories ?? 8) * MH + 2 };
  return { links, rootComp, find, box };
}

// 설계도 지표: 구간마다 정한 모양 (언덕 혹·골짜기·고원·큰 산)
function bpSurface(P, bp) {
  const { LW, N } = P, base = FLOOR * TS, el = new Float64Array(LW);
  const bump = (u) => (u <= -1 || u >= 1 ? 0 : (1 - u * u) * (1 - u * u));
  const plat = (u, p) => {
    const a = u < 0 ? -u : u;
    if (a >= 1) return 0;
    if (a <= p) return 1;
    const t = (a - p) / (1 - p);
    return 1 - t * t * (3 - 2 * t);
  };
  const addEl = (x0, x1, fn) => {
    for (let i = Math.max(0, Math.floor(x0 / Q)); i <= Math.min(LW - 1, Math.ceil(x1 / Q)); i++) el[i] += fn(i * Q);
  };
  P.ponds = [];
  P.sinks = [];
  // 던전 없는 설계도: 자연 동굴 입구 자리 (지표 x)
  P.mouthX = bp.mouthX ?? [];
  P.sections = bp.surface;
  for (const q of bp.surface) {
    if (q.kind === "hills") for (const b of q.bumps) addEl(b.c - b.w, b.c + b.w, (x) => b.h * bump((x - b.c) / b.w));
    else if (q.kind === "valley") {
      addEl(q.c - q.w, q.c + q.w, (x) => -q.d * plat((x - q.c) / q.w, q.p));
      q.pond && P.ponds.push({ x: q.c, w: q.pond });
    } else if (q.kind === "mesa") addEl(q.c - q.w, q.c + q.w, (x) => q.h * plat((x - q.c) / q.w, q.p));
    else if (q.kind === "mountain") {
      const so = 17.3, sh = q.shoulder;
      addEl(q.c - q.wl, q.c + q.wr, (x) => {
        const t = (x - q.c) / (x < q.c ? q.wl : q.wr), a = t < 0 ? -t : t;
        if (a >= 1) return 0;
        const u = a <= q.top ? 0 : (a - q.top) / (1 - q.top);
        let e = Math.pow(1 - u, 1.5);
        if (sh && (t < 0 ? -1 : 1) === (sh.side ? 1 : -1)) e += sh.amt * bump((u - sh.at) / 0.18);
        return q.h * Math.min(1, e) * (0.96 + 0.04 * N.fbm1(x / 280 + so, 2));
      });
      P.mtn = { a: q.c - q.wl, b: q.c + q.wr, cx: q.c, h: q.h, pa: q.c - q.wl * q.top, pb: q.c + q.wr * q.top };
    }
  }
  const h = new Float64Array(LW);
  for (let i = 0; i < LW; i++) h[i] = base - el[i] - 4 * N.fbm1((i * Q) / 70 + 3.1, 2);
  return h;
}
// ── 길찾기 검사 ──────────────────────────────────────
// 8px마다 세로줄을 재서 바위 구간을 정확히 구하고(쌍선형 장은 세로로 선형이라 0이 되는 곳을 바로 계산),
// 바닥(머리 위 28px 이상 빈 곳)마다 걷기·점프·떨어지기로 갈 수 있는 곳을 잇는다.
const CW = 8;
// 세로줄 하나(픽셀 열 px)의 바위 구간 [위, 아래): 쌍선형 장은 세로로 선형이라 0이 되는 곳을 바로 계산한다
function colIntervals(d, LW, LH, HP, px, tops, bots) {
  const x = px + 0.5, u = x / Q, i = Math.min(LW - 2, u | 0), fu = u - i;
  let v0 = d[i] + (d[i + 1] - d[i]) * fu;
  let start = v0 > 0 ? 0 : -1;
  for (let j = 0; j < LH - 1; j++) {
    const k = (j + 1) * LW + i;
    const v1 = d[k] + (d[k + 1] - d[k]) * fu;
    if (v0 > 0 !== v1 > 0) {
      const p = Math.floor(Q * (j + v0 / (v0 - v1)) - 0.5) + 1;
      if (v1 > 0) start = p;
      else {
        tops.push(start);
        bots.push(p);
        start = -1;
      }
    }
    v0 = v1;
  }
  start >= 0 && (tops.push(start), bots.push(HP));
}
// 8px 기둥마다: 가운데 열(발 닿는 바닥)과, 몸 너비(±5px)를 덮는 세 열을 합친 구간(머리·어깨가 지나갈 자리)
function columns(P) {
  const { F } = P, d = F.d, LW = F.LW, LH = F.LH, WP = P.WP;
  const NC = Math.floor(WP / CW);
  const ivS = new Int32Array(NC + 1), dvS = new Int32Array(NC + 1);
  const tops = [], bots = [], dts = [], dbs = [], tT = [], tB = [];
  for (let c = 0; c < NC; c++) {
    ivS[c] = tops.length;
    colIntervals(d, LW, LH, P.HP, c * CW + 4, tops, bots);
    dvS[c] = dts.length;
    tT.length = tB.length = 0;
    for (let k = ivS[c]; k < tops.length; k++) (tT.push(tops[k]), tB.push(bots[k]));
    colIntervals(d, LW, LH, P.HP, Math.max(0, c * CW - 1), tT, tB);
    colIntervals(d, LW, LH, P.HP, Math.min(WP - 1, c * CW + 9), tT, tB);
    const ord = tT.map((_, k) => k).sort((a, b) => tT[a] - tT[b]);
    let cs = -1, ce = -1;
    for (const k of ord) {
      const s = tT[k], e = tB[k];
      if (cs < 0) ((cs = s), (ce = e));
      else if (s <= ce) e > ce && (ce = e);
      else (dts.push(cs), dbs.push(ce), (cs = s), (ce = e));
    }
    cs >= 0 && (dts.push(cs), dbs.push(ce));
  }
  ivS[NC] = tops.length;
  dvS[NC] = dts.length;
  return { NC, ivS, top: Int32Array.from(tops), bot: Int32Array.from(bots), dvS, dtop: Int32Array.from(dts), dbot: Int32Array.from(dbs) };
}
// 점프 물리 (엔진 플레이어와 같은 값): 점프 500, 2단 점프 440(꼭대기에서), 중력 오를 때 1500 · 내려갈 때 1725,
// 가로 속도는 기본 150보다 조금 낮게(140) 잡아 빠듯한 점프는 넣지 않는다
// 엔진은 프레임마다 속도에 중력을 먼저 더하고 움직이므로 꼭대기가 공식보다 낮다 → 30fps 기기에서도 되도록
// 실효 점프 속도(500 → 475, 440 → 415)를 쓴다. 떨어질 때는 최고 낙하 속도 720을 넘지 않는다
const VX = 135, GU = 1500, GD = 1725, VMAX = 720, J1 = 475, J2 = 415;
const T1 = J1 / GU, H1 = (J1 * J1) / (2 * GU), T2 = J2 / GU, H2 = (J2 * J2) / (2 * GU), TV = VMAX / GD;
const fallD = (w) => (w <= TV ? 0.5 * GD * w * w : 0.5 * VMAX * TV + VMAX * (w - TV));
// 달리며 뛴 뒤 t초의 높이 (위로 +)
const hRun = (t, dbl) => {
  if (t <= T1) return J1 * t - 0.5 * GU * t * t;
  const u = t - T1;
  if (!dbl) return H1 - fallD(u);
  if (u <= T2) return H1 + J2 * u - 0.5 * GU * u * u;
  return H1 + H2 - fallD(u - T2);
};
export function analyze(P) {
  const C = columns(P);
  const { NC, ivS, top, bot, dvS, dtop, dbot } = C;
  // 가운데 열 [y0, y1]에 바위가 없는가
  const airC = (c, y0, y1) => {
    if (c < 0 || c >= NC) return false;
    for (let k = ivS[c]; k < ivS[c + 1]; k++) if (top[k] <= y1 && bot[k] > y0) return false;
    return true;
  };
  // 몸 너비 전체 [y0, y1]에 바위가 없는가
  const airD = (c, y0, y1) => {
    if (c < 0 || c >= NC) return false;
    for (let k = dvS[c]; k < dvS[c + 1]; k++) if (dtop[k] <= y1 && dbot[k] > y0) return false;
    return true;
  };
  // 발이 y에 있을 때 몸이 들어갈 자리 (아래 모서리 6px은 비탈에 걸쳐도 된다 — 충돌 모양과 같다)
  // 몸 자리 검사는 같은 (기둥, 높이)를 수없이 다시 묻는다 → 기억해 둔다 (0 모름, 1 빔, 2 막힘)
  const HY = Math.ceil(P.HP) + 64, BA = scratch("BA", Uint8Array, NC * HY).fill(0);
  const bodyAir = (c, y) => {
    if (c < 0 || c >= NC || y < 0 || y >= HY) return airD(c, y - BODY, y - 9) && airC(c, y - BODY, y - 1);
    const k = c * HY + y, v = BA[k];
    if (v) return v === 1;
    const r = airD(c, y - BODY, y - 9) && airC(c, y - BODY, y - 1);
    BA[k] = r ? 1 : 2;
    return r;
  };
  const air = airD;
  // 바닥 마디 (16px마다; 장애물은 8px마다·몸 너비로 검사)
  const nC = [], nY = [], colN = new Int32Array(NC + 1);
  for (let c = 0; c < NC; c++) {
    colN[c] = nC.length;
    if (c & 1) continue;
    let prev = -9999;
    for (let k = ivS[c]; k < ivS[c + 1]; k++) {
      const t = top[k];
      // 발 디딜 폭: 가운데 ±4px 모두 바닥이 있어야 (바늘 끝 같은 돌 꼭대기는 설 자리가 아니다)
      if (t > 0 && t - prev >= HEAD && t < P.HP - 2 && bodyAir(c, t) && P.F.solid(c * CW + 1, t + 2) && P.F.solid(c * CW + 6, t + 2)) (nC.push(c), nY.push(t));
      prev = bot[k];
    }
  }
  colN[NC] = nC.length;
  const NN = nC.length;
  // 한 가지 움직임으로 A(ca, ya) → B(cb, yb)에 갈 수 있나
  // mode 0: 달리며 1단 점프, 1: 달리며 2단 점프, 2: 제자리 2단으로 솟았다 건너기, 3: 제자리 1단, 4: 걸어 나가 떨어지기
  // 모드 0~3: 기둥 k(0~18)에서의 높이 (미리 계산)
  const HTAB = [0, 1, 2, 3].map((m) => {
    const t0 = m === 2 ? T1 + T2 : m === 3 ? T1 : 0, hTop = m === 2 ? H1 + H2 : m === 3 ? H1 : 0;
    return Float64Array.from({ length: 19 }, (_, k) => hMode(m, t0 + (k * CW) / VX, t0, hTop));
  });
  function hMode(mode, t, t0, hTop) {
    return mode === 0 ? hRun(t, !1) : mode === 1 ? hRun(t, !0) : mode === 4 ? -fallD(t) : hTop - fallD(t - t0);
  }
  const _hMode_unused = (mode, t, t0, hTop) => (mode === 0 ? hRun(t, !1) : mode === 1 ? hRun(t, !0) : mode === 4 ? -fallD(t) : hTop - fallD(t - t0));
  const tryMode = (ca, ya, cb, yb, mode) => {
    const dir = cb > ca ? 1 : -1, n = (cb - ca) * dir;
    const HT = mode < 4 ? HTAB[mode] : null;
    let t0 = 0, hTop = 0, kOff = 0;
    if (mode === 2 || mode === 3) {
      hTop = mode === 2 ? H1 + H2 : H1;
      t0 = mode === 2 ? T1 + T2 : T1;
    }
    // 걸어 나가기: 발밑이 끊기는 기둥부터 떨어진다
    if (mode === 4) {
      while (kOff < n && !airC(ca + kOff * dir, ya, ya + 3)) kOff++;
      if (kOff >= n) return false;
    }
    const tAt = (k) => (mode === 4 ? (Math.max(0, k - kOff) * CW) / VX : t0 + (k * CW) / VX);
    // 도착 높이부터 (B 바닥보다 아래로 도착하면 옆면에 부딪힌다)
    const yEnd = ya - (HT ? HT[n] : hMode(mode, tAt(n), t0, hTop));
    // 걸어 내려가기 (블록 계단 한두 칸): B 높이까지 떨어진 곳이 B와 같은 바닥이면 거기 내려서 걸어간다
    if (mode === 4 && yEnd > yb - 6) {
      for (let k = 1; k <= n; k++) {
        const c = ca + k * dir, y = k < kOff ? ya : Math.min(yb, Math.round(ya + fallD(tAt(k))));
        if (!bodyAir(c, y)) return false;
        if (y >= yb && !airC(c, yb, yb + 1)) {
          for (let m = k + 1; m <= n; m++) if (!bodyAir(ca + m * dir, yb) || airC(ca + m * dir, yb, yb + 1)) return false;
          return true;
        }
      }
      return false;
    }
    // 6px 이상 여유 있게 도착해야 (빠듯한 점프는 사람도 어렵다)
    if (yEnd > yb - 6) return false;
    if ((mode === 2 || mode === 3) && !(airD(ca, ya - hTop - BODY, ya - 9) && airC(ca, ya - hTop - BODY, ya - 1))) return false;
    for (let k = 1; k < n; k++) {
      const y = mode === 4 && k < kOff ? ya : Math.round(ya - (HT ? HT[k] : hMode(mode, tAt(k), t0, hTop)));
      if (!bodyAir(ca + k * dir, y)) return false;
    }
    const ye = Math.round(yEnd);
    return airD(cb, ye - BODY, yb - 9) && airC(cb, ye - BODY, yb - 1);
  };
  const UP_MODES = [1, 0, 2, 3], DN_MODES = [4, 0, 1];
  // (검사 도구용) 이 길을 어떤 움직임으로 인정했나: "walk" | 0~4
  const how = (a, b) => {
    const ca = nC[a], ya = nY[a], cb = nC[b], yb = nY[b], rise = ya - yb, dc = cb > ca ? 1 : -1;
    if (Math.abs(cb - ca) === 2 && Math.abs(rise) <= 16 && bodyAir(ca, Math.min(ya, yb)) && bodyAir(ca + dc, Math.min(ya, yb)) && bodyAir(cb, yb)) return "walk";
    for (const m of rise > 0 ? UP_MODES : DN_MODES) if (tryMode(ca, ya, cb, yb, m)) return m;
    return null;
  };
  // 마디에서 나가는 길
  const walkTo = (a, cb) => {
    const ca = nC[a], ya = nY[a], dc = cb > ca ? 1 : -1;
    for (let b = colN[cb]; b < colN[cb + 1]; b++) {
      const yb = nY[b];
      if (Math.abs(ya - yb) > 16) continue;
      const hi = Math.min(ya, yb);
      if (bodyAir(ca, hi) && bodyAir(ca + dc, hi) && bodyAir(cb, yb)) return b;
    }
    return -1;
  };
  const chain = new Set();
  const out = (a) => {
    const ca = nC[a], ya = nY[a], res = [];
    // 양쪽으로 걸어서 닿는 마디들
    chain.clear();
    for (const dir of [-1, 1]) {
      let cur = a;
      for (let st = 0; st < 9; st++) {
        const cb = nC[cur] + 2 * dir;
        if (cb < 0 || cb >= NC) break;
        const b = walkTo(cur, cb);
        if (b < 0) break;
        chain.add(b);
        cur = b;
      }
    }
    for (let cb = Math.max(0, ca - 18); cb <= Math.min(NC - 1, ca + 18); cb += 2) {
      if (cb === ca) continue;
      const dc = cb > ca ? 1 : -1;
      for (let b = colN[cb]; b < colN[cb + 1]; b++) {
        if (Math.abs(cb - ca) > 2 && chain.has(b)) continue;
        const yb = nY[b], rise = ya - yb;
        // 걷기: 이웃 마디, 높이 차 16px 이내 (충돌은 1px에 2px까지 오르고 6px 턱을 넘는다)
        if (Math.abs(cb - ca) === 2 && Math.abs(rise) <= 16) {
          const hi = Math.min(ya, yb);
          if (bodyAir(ca, hi) && bodyAir(ca + dc, hi) && bodyAir(cb, yb)) {
            res.push(b);
            continue;
          }
        }
        if (rise > H1 + H2 - 20) continue;
        const modes = rise > 0 ? UP_MODES : DN_MODES;
        for (const m of modes)
          if (tryMode(ca, ya, cb, yb, m)) {
            res.push(b);
            break;
          }
      }
    }
    return res;
  };
  const near = (x, y, rx = 14, ry = 12) => {
    let best = -1, bd = 1e9;
    const c0 = Math.max(0, Math.floor((x - rx) / CW)), c1 = Math.min(NC - 1, Math.floor((x + rx) / CW));
    for (let c = c0; c <= c1; c++)
      for (let n = colN[c]; n < colN[c + 1]; n++) {
        const dd = Math.abs(nC[n] * CW + 4 - x) + Math.abs(nY[n] - y);
        if (Math.abs(nY[n] - y) <= ry && dd < bd) ((bd = dd), (best = n));
      }
    return best;
  };
  const base = P.base ?? FLOOR * TS;
  const start = near(44, base, 20, 40);
  const goals = [];
  goals.push({ id: "R", n: near(P.WP - 56, base, 24, 40) });
  P.peak && goals.push({ id: "U", n: near(P.peak.x, P.peak.y, 16, 6) });
  P.deep && goals.push({ id: "D", n: near(P.deep.x, P.deep.y, 16, 6) });
  // ── 매달려 오르내리는 곳(사다리·밧줄·덩굴·바람·승강기)과 짚라인: 거기 붙을 수 있는 마디 → 거기서 내리거나 뛰어 닿는 마디 ──
  const EXTRA = new Array(NN);
  {
    const nodesIn = (x0, x1, y0, y1) => {
      const r = [];
      const c0 = Math.max(0, Math.floor(x0 / CW)), c1 = Math.min(NC - 1, Math.floor(x1 / CW));
      for (let c = c0; c <= c1; c++) for (let n = colN[c]; n < colN[c + 1]; n++) nY[n] >= y0 && nY[n] <= y1 && r.push(n);
      return r;
    };
    // 공중 점(발 높이 yv)에서 뛰거나 떨어져 닿는 마디
    const fromAir = (cv, yv, set) => {
      if (!bodyAir(cv, yv)) return;
      for (let cb = Math.max(0, cv - 18); cb <= Math.min(NC - 1, cv + 18); cb++) {
        if (cb === cv) continue;
        for (let b = colN[cb]; b < colN[cb + 1]; b++) {
          if (set.has(b)) continue;
          const rise = yv - nY[b];
          if (rise > H1 + H2 - 20) continue;
          for (const m of rise > 0 ? UP_MODES : DN_MODES)
            if (tryMode(cv, yv, cb, nY[b], m)) {
              set.add(b);
              break;
            }
        }
      }
    };
    const link = (E, X) => {
      if (!X.size) return;
      const xs = [...X];
      for (const a of E) (EXTRA[a] ??= []).push(...xs.filter((b) => b !== a));
    };
    for (const r of P.spec ?? []) {
      // 물(3·11·12)도: 점프 키로 헤엄쳐 올라 물 밖으로 뛰어나온다
      // 레버로 잠긴 승강기는 없는 것으로 (지름길: 주 길이 따로 있어야 한다)
      if (r.t === 15 && r.lock) continue;
      // 장식 전용(nc: 막다른 사다리·밧줄을 그림으로만 남긴 것)은 붙을 수 없다
      if (r.nc) continue;
      if (CLIMB_SPEC.has(r.t) || r.fallw || ((r.t === 3 || r.t === 11 || r.t === 12) && r.y1 - r.y0 >= 16)) {
        const X = new Set(nodesIn(r.x0 - 12, r.x1 + 12, r.y0 - 6, r.y1 + 24));
        const cols = [];
        if (r.x1 - r.x0 <= 32) cols.push(Math.floor((r.x0 + r.x1) / 2 / CW));
        else for (let x = r.x0 + 8; x < r.x1 - 4; x += 16) cols.push(Math.floor(x / CW));
        for (const cv of cols) for (let y = r.y0 + 12; y <= r.y1 + 11; y += 20) fromAir(cv, Math.round(y), X);
        // 붙을 수 있는 곳: 그 안·위·아래에 서 있거나, 옆에서 뛰어 닿는다
        const E = new Set([...nodesIn(r.x0 - 12, r.x1 + 12, r.y0 - 6, r.y1 + 24), ...nodesIn(r.x0 - 72, r.x1 + 72, r.y0 + 8, r.y1 + 100)]);
        link(E, X);
      } else if (r.t === 22) {
        // 덩굴 그네: 줄 근처(밑·옆에서 뛰어)에서 잡고, 흔들리는 호의 여러 점에서 놓아 떨어진다
        // 달려 뛰어 잡는다: 옆 150px · 아래 110px 안에 선 곳
        const E = new Set([...nodesIn(r.x0 - 150, r.x1 + 150, r.y0 + 8, r.y1 + 110)]);
        const X = new Set();
        for (const a of [-1.15, -0.85, -0.5, 0, 0.5, 0.85, 1.15]) {
          const x = r.ax + Math.sin(a) * r.len, y = r.ay + Math.cos(a) * r.len + 25;
          x > 0 && x < P.WP && fromAir(Math.floor(x / CW), Math.round(y), X);
        }
        link(E, X);
      } else if (r.t === 20) {
        // 하늘 나룻 바구니: 양쪽 나루(바구니가 닿는 끝)에 선 곳끼리 오간다
        const w = r.w ?? 48, A1 = nodesIn(r.x0 - 40, r.x0 + w + 8, r.y1 - 10, r.y1 + 10), B1 = nodesIn(r.x1 - w - 8, r.x1 + 40, r.y1 - 10, r.y1 + 10);
        link(A1, new Set(B1));
        link(B1, new Set(A1));
      } else if (r.t === 9 && r.ax != null) {
        const n = Math.max(1, Math.ceil(Math.abs(r.bx - r.ax) / 32)), dir = Math.sign(r.by - r.ay);
        const pts = [];
        for (let k = 0; k <= n; k++) pts.push([r.ax + ((r.bx - r.ax) * k) / n, r.ay + ((r.by - r.ay) * k) / n]);
        // 줄은 낮은 쪽으로만 간다 (평평하면 양쪽): 붙은 곳에서 아래쪽 점들로
        for (let i = 0; i <= n; i++) {
          const [x, y] = pts[i];
          const E = nodesIn(x - 24, x + 24, y + 18, y + 110);
          if (!E.length) continue;
          const X = new Set();
          for (let k = 0; k <= n; k++) {
            if (dir > 0 && k < i) continue;
            if (dir < 0 && k > i) continue;
            fromAir(Math.floor(pts[k][0] / CW), Math.round(pts[k][1] + 26), X);
          }
          link(E, X);
        }
      }
    }
  }
  // 앞으로 (입구에서)
  const adj = new Array(NN);
  const reach = new Uint8Array(NN);
  const q = [];
  if (start >= 0) ((reach[start] = 1), q.push(start));
  while (q.length) {
    const a = q.pop();
    const o = (adj[a] = EXTRA[a] ? out(a).concat(EXTRA[a]) : out(a));
    for (const b of o) reach[b] || ((reach[b] = 1), q.push(b));
  }
  const miss = goals.filter((g) => g.n < 0 || !reach[g.n]).map((g) => g.id);
  start < 0 && miss.push("L");
  // 거꾸로 (어느 출구에든 닿을 수 있는가): 닿은 마디들 안에서
  const rev = new Array(NN);
  for (let a = 0; a < NN; a++) if (adj[a]) for (const b of adj[a]) (rev[b] ??= []).push(a);
  const co = new Uint8Array(NN);
  for (const g of [{ n: start }, ...goals]) if (g.n >= 0 && reach[g.n]) ((co[g.n] = 1), q.push(g.n));
  while (q.length) {
    const b = q.pop();
    for (const a of rev[b] ?? []) co[a] || ((co[a] = 1), q.push(a));
  }
  let trapCount = 0;
  const traps = [];
  for (let a = 0; a < NN; a++) if (reach[a] && !co[a]) (trapCount++, traps.push(a));
  // 하늘 구역은 떨어지면 처음 자리로 돌아오므로 갇힘이 아니다
  const trapsBad = P.kind === "sky" ? 0 : trapCount;
  const ok = miss.length === 0 && trapsBad === 0;
  const score = (goals.length + 1 - miss.length) * 1000 - Math.min(999, trapsBad);
  return { ok, score, miss, trapCount: trapsBad, traps: P.kind === "sky" ? [] : traps, nC, nY, colN, NN, reach, co, adj, out, start, goals, C, air, how, tryMode, bodyAir, airC, airD };
}

// ── 고치기 ───────────────────────────────────────────
// 갈 수 있는 곳(a)과 가야 하는 곳(b) 중 가장 가까운 짝을 찾아, 사이가 비었으면 바위 턱을 놓고 막혔으면 굴을 판다
// 한 번에 여러 곳을 고친다 (못 닿은 출구마다 하나, 갇히는 구덩이는 서로 떨어진 곳 3군데까지)
function repair(P, A) {
  const { nC, nY, NN, reach, co, out } = A;
  const X = (n) => nC[n] * CW + 4;
  // 땅속 마디 (지표보다 64px 넘게 아래)
  const ugN = (n) => P.kind === "cave" || (P.h && nY[n] > P.h[Math.min(P.h.length - 1, Math.round(X(n) / Q))] + 64);
  const pairs = [];
  // 가장 가까운 짝 (위로 가는 길은 조금 더 비싸게)
  const closest = (src, dst) => {
    let best = null, bd = 1e18;
    const stepS = Math.max(1, Math.floor(src.length / 700)), stepD = Math.max(1, Math.floor(dst.length / 700));
    const top = [];
    for (let i = 0; i < src.length; i += stepS) {
      const a = src[i], xa = X(a), ya = nY[a];
      for (let k = 0; k < dst.length; k += stepD) {
        const b = dst[k], dx = Math.abs(X(b) - xa), dy = ya - nY[b];
        const cost = dx + (dy > 0 ? dy * 1.25 : -dy * 0.6);
        if (top.length < 24 || cost < top[top.length - 1][0]) {
          top.push([cost, a, b]);
          top.sort((p, q) => p[0] - q[0]);
          top.length > 24 && top.pop();
        }
      }
    }
    // 바깥(지상·하늘)에서는 산을 뚫는 굴로 잇지 않는다: 사이가 거의 비어 있는 짝을 고른다
    for (const [, a, b] of top) {
      if (P.kind === "cave" || (ugN(a) && ugN(b))) return [a, b];
      let rock = 0;
      for (let t = 0.2; t <= 0.8; t += 0.15) P.F.v(lerp(X(a), X(b), t), lerp(nY[a], nY[b], t) - 14) > 0 && rock++;
      if (rock <= 1) return [a, b];
    }
    return top.length ? [top[0][1], top[0][2]] : best;
  };
  let did = false;
  if (A.miss.length) {
    for (const id of A.miss) {
      const g = A.goals.find((q) => q.id === id);
      const gn = g ? g.n : -1;
      if (gn < 0) {
        did = true;
        // 목표 자리에 바닥이 없다: 그 자리를 둥근 방 + 평평한 바닥으로
        const pt = id === "U" ? P.peak : id === "D" ? P.deep : id === "R" ? { x: P.WP - 56, y: P.base ?? FLOOR * TS } : { x: 44, y: P.base ?? FLOOR * TS };
        if (!pt) continue;
        cutShape(P, pt.x - 50, pt.y - 66, pt.x + 50, pt.y, (x, y) => {
          const ex = (x - pt.x) / 1.4, ey = y - (pt.y - 26);
          return 32 - Math.sqrt(ex * ex + ey * ey);
        });
        flatFloor(P, pt.x - 36, pt.x + 36, pt.y, 14, 20, 14);
        continue;
      }
      // 목표 둘레 마디들: 목표에서 앞으로 퍼진 마디 중 목표보다 높거나 비슷한 곳 (거기서는 대개 걸어·떨어져 목표에 닿는다)
      // (전체 그래프를 거꾸로 만들면 닿지 않은 넓은 하늘까지 모두 계산해야 해서 매우 느리다)
      const back = new Uint8Array(NN), q = [gn];
      back[gn] = 1;
      for (let h = 0; h < q.length && q.length < 2000; h++) {
        const b = q[h];
        for (const c of A.adj[b] ?? (A.adj[b] = out(b))) back[c] || ((back[c] = 1), q.push(c));
      }
      const src = [], dst = [];
      for (let n = 0; n < NN; n++) reach[n] ? src.push(n) : back[n] && nY[n] <= nY[gn] + 24 && dst.push(n);
      dst.length || dst.push(gn);
      const pr = src.length && dst.length ? closest(src, dst) : null;
      pr && pairs.push(pr);
    }
  }
  if (A.traps.length && pairs.length < 3) {
    const dst = [];
    for (let n = 0; n < NN; n++) co[n] && dst.push(n);
    // 서로 떨어진 구덩이끼리 묶는다
    const groups = [];
    for (const t of A.traps) {
      const g = groups.find((G) => Math.abs(X(G[0]) - X(t)) < 120 && Math.abs(nY[G[0]] - nY[t]) < 120);
      g ? g.push(t) : groups.push([t]);
    }
    groups.sort((a, b) => b.length - a.length);
    for (const G of groups.slice(0, 3 - pairs.length)) {
      const pr = dst.length ? closest(G, dst) : null;
      pr && pairs.push(pr);
    }
  }
  // 같은 짝을 또 고치려 하면(앞 고치기가 소용없었다) 검사하는 길 그대로를 둥글게 파낸다. 세 번째는 포기
  const tried = (P.tried ??= new Map());
  for (const [a, b] of pairs) {
    const key = `${X(a)},${nY[a]},${X(b)},${nY[b]}`, cnt = (tried.get(key) ?? 0) + 1;
    tried.set(key, cnt);
    // 땅속: 돌 발판 대신 굴을 하나 더 판다 (동굴과 같은 모양 — 평평한 통로·계단·굴뚝)
    if (P.caveRoute && ugN(a) && ugN(b)) {
      if (cnt > 2) continue;
      const C = cellsOf(P);
      P.caveRoute(nC[a], Math.round(nY[a] / BLK), nC[b], Math.round(nY[b] / BLK));
      writeCells(P, C);
      did = !0;
      continue;
    }
    if (cnt === 1) (bridge(P, X(a), nY[a], X(b), nY[b]), (did = !0));
    else if (cnt === 2) {
      // 그래도 안 되면 사이에 디딤 바위를 하나 더 (높이를 반씩 나눈다)
      const xa = X(a), xb = X(b), ya = nY[a], yb = nY[b];
      ledge(P, (xa + xb) / 2 + P.R.range(-10, 10), Math.round(Math.max(ya, yb) - Math.abs(ya - yb) / 2 - 6), P.R.range(36, 56));
      clearPath(P, xa, ya, (xa + xb) / 2, Math.max(ya, yb) - Math.abs(ya - yb) / 2);
      did = !0;
    }
  }
  return did;
}
// 둥근 캡슐 모양으로 파낸다 (선분 두 끝 사이)
function capsule(P, x0, y0, x1, y1, r) {
  const L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
  const n = Math.max(1, Math.ceil(L / 4));
  for (let k = 0; k <= n; k++) {
    const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
    cutShape(P, x - r - 2, y - r - 2, x + r + 2, y + r + 2, (px, py) => r - Math.sqrt((px - x) * (px - x) + (py - y) * (py - y)));
  }
}
// 달리며 2단 점프하는 실제 궤적(길찾기가 검사하는 것과 같은 식)을 따라 몸 크기만큼 둥글게 비운다
function clearPath(P, xa, ya, xb, yb) {
  const dir = xb > xa ? 1 : -1, dx = Math.abs(xb - xa);
  let ye = ya;
  for (let s = 0; s <= dx + 0.01; s += 4) {
    const y = ya - hRun(s / VX, !0);
    ye = y;
    const x = xa + dir * s;
    cutShape(P, x - 16, y - 28, x + 16, y + 4, (px, py) => 13.5 - Math.sqrt((px - x) * (px - x) + (py - (y - 12)) * (py - (y - 12))));
  }
  ye < yb && capsule(P, xb, ye - 12, xb, yb - 12, 12);
}
function bridge(P, xa, ya, xb, yb) {
  const { F, R } = P;
  // 사이가 바위로 얼마나 막혔나
  let rock = 0, n = 0;
  for (let t = 0.1; t <= 0.9; t += 0.05) {
    const x = lerp(xa, xb, t), y = lerp(ya, yb, t) - 14;
    F.v(x, y) > 0 && rock++;
    n++;
  }
  const rise = ya - yb, dx = Math.abs(xb - xa), L = Math.sqrt(dx * dx + rise * rise);
  const so = R() * 99;
  const carveAlong = (pts, r0, r1) => {
    let s = 0;
    for (let k = 0; k < pts.length; k++) {
      const [x, y] = pts[k];
      k && (s += 4);
      const r = lerp(r0, r1, 0.5 + 0.5 * P.N.n1(s / 50 + so));
      cutShape(P, x - r * 1.3, y - r - 2, x + r * 1.3, y + r, (px, py) => {
        const ex = (px - x) / 1.2, ey = py - y;
        return r - Math.sqrt(ex * ex + ey * ey);
      });
    }
  };
  // 지표 위(하늘·산 바깥)끼리는 굴을 파지 않는다 — 산을 비스듬히 가르는 상처가 생긴다
  const hS = (x) => (P.h ? P.h[clamp(Math.round(x / Q), 0, P.h.length - 1)] : 1e9);
  const outside = P.kind === "sky" || (P.kind === "ground" && ya < hS(xa) + 30 && yb < hS(xb) + 30);
  if (rock / n > 0.3 && !outside) {
    // 굴: 굽이치고, 굵기가 바뀌고, 바닥은 걸을 수 있게
    carveAlong(meander(P, xa, ya - 16, xb, yb - 16, L > 80 ? 0.8 : 0.3, 70), 17, 25);
    return;
  }
  // 바위 턱 사다리: 한 번에 오를 수 있는 높이·거리로 나누고, 좌우로 엇갈리게 놓는다
  const hops = Math.max(1, Math.ceil(Math.max(rise / 68, dx / 90)));
  if (hops === 1) {
    // 한 번 뛰면 되는데 막혔다: 실제로 뛰는 궤적을 따라 둥글게 깎는다 (머리 위 낮은 천장·튀어나온 바위)
    clearPath(P, xa, ya, xb, yb);
    return;
  }
  // 간격·크기·좌우가 제각각인 바위 턱 (같은 간격으로 쌓인 사다리처럼 보이지 않게)
  const side = R() < 0.5 ? 1 : -1;
  for (let k = 1; k < hops; k++) {
    const t = clamp((k + R.range(-0.22, 0.22)) / hops, 0.08, 0.92);
    const x = lerp(xa, xb, t) + side * (k % 2 ? 1 : -1) * R.range(8, 34), y = Math.round(lerp(ya, yb, t) + R.range(-10, 8));
    // 바깥 하늘에서는 작은 디딤돌 대신 큰 섬
    P.kind !== "cave" && y < (P.h ? P.h[clamp(Math.round(x / Q), 0, P.h.length - 1)] : FLOOR * TS) - 60 ? island(P, x, y, R.range(140, 240), R.range(40, 70), P.prof.islands?.style ?? "rock", { sub: false, keep: false }) : ledge(P, x, y, R.range(30, 72));
  }
}
// 벽에서 튀어나온 바위 턱 (가까운 벽이 없으면 떠 있는 작은 바위)
function ledge(P, x, y, w) {
  const { F, R } = P;
  let wall = 0;
  for (let d = w / 2; d < w / 2 + 44 && !wall; d += 4) {
    if (F.v(x - d, y + 6) > 0 && F.v(x - d, y - 20) > 0) wall = -d;
    else if (F.v(x + d, y + 6) > 0 && F.v(x + d, y - 20) > 0) wall = d;
  }
  // 턱 위 머리 공간 (둥근 천장)
  cutShape(P, x - w / 2 - 10, y - 50, x + w / 2 + 10, y - 1, (px, py) => {
    const ex = (px - x) / (w / 2 + 8), ey = (py - (y - 6)) / 44;
    return (1 - Math.sqrt(ex * ex + ey * ey)) * 24;
  });
  if (wall) {
    const ext = Math.abs(wall) + 12, cx = x + Math.sign(wall) * (ext / 2);
    island(P, cx, y, w + ext, R.range(18, 34), "ledge", { sub: false, keep: false });
  } else island(P, x, y, w, R.range(20, 40), "ledge", { sub: false, keep: false });
}

// ── 결과 정리: 바닥·적 자리·보물·함정 ─────────────────
function finishMeta(P, A) {
  const { nC, nY, NN, reach } = A;
  const NC = A.C.NC;
  // 칸마다 "주 지면" 높이 (px)
  const W = P.W, gy = new Int16Array(W).fill(-1);
  const base = P.base ?? FLOOR * TS;
  for (let t = 0; t < W; t++) {
    const c = t * 2;
    let best = -1, bd = 1e9;
    const ref = P.kind === "ground" ? P.h[Math.min(P.h.length - 1, (t * TS + 8) / Q | 0)] : base;
    for (const cc of [c, c + 1])
      for (let n = A.colN[cc]; n < A.colN[cc + 1]; n++) {
        if (!reach[n] && P.kind !== "ground") continue;
        const dd = Math.abs(nY[n] - ref);
        if (P.kind === "sky" && dd > 48) continue;
        if (P.kind === "cave" && dd > 220) continue;
        dd < bd && ((bd = dd), (best = nY[n]));
      }
    gy[t] = best;
  }
  P.gy = gy;
  // 서 있을 만한 자리 (평평하고 머리 위가 넉넉한 곳)
  const spots = [];
  for (let n = 0; n < NN; n++) {
    if (!reach[n]) continue;
    const c = nC[n], y = nY[n];
    if (c < 8 || c > NC - 8) continue;
    let flat = 0;
    for (const d of [-4, -2, 2, 4]) {
      const cc = c + d;
      for (let m = A.colN[cc]; m < A.colN[cc + 1]; m++) if (Math.abs(nY[m] - y) <= (d === 2 || d === -2 ? 4 : 7)) (flat++, (m = 1e9));
    }
    if (flat < 4 || !A.air(c, y - 48, y - 1)) continue;
    spots.push({ x: c * CW + 4, y });
  }
  P.spots = spots;
  // 함정 자리: 지상의 평평한 자리(분지는 웅덩이·늪)
  P.hzSpots = P.pads.map((p) => ({ x0: p.xa / TS, x1: p.xb / TS, y: p.y, basin: p.basin, dungeon: p.dungeon }));
}

// ── 조각 그리기 (엔진에 넘길 칸 격자·높이·물건) ─────────
// r: 조각 칸 격자(32 × Ft), l: 땅 높이(아래에서 센 값), s: 천장 줄
export function chunk(z, S, r, l, s, o) {
  const P = planOf(z, o);
  return drawChunk(P, z, S, r, l, s, o);
}
const HZ = { spikes: "spikes", poison: "poison", quicksand: "quicksand", ice: "ice", firetrap: "fireJet" };
export function drawChunk(P, z, S, r, l, s, o) {
  const { Ft, fe, ze } = o;
  const vt = 32, base = (S - z.c0) * vt, x0 = base * TS;
  const F = P.F;
  // 칸 격자: 칸 가운데가 바위면 바위 (예전 시스템·AI용 근사)
  for (let y = 0; y < Ft; y++)
    for (let x = 0; x < vt; x++) r[y * vt + x] = F.v(x0 + x * TS + 8, y * TS + 8) > 0 ? fe : ze;
  const gy = new Int16Array(vt), flat = new Uint8Array(vt);
  for (let x = 0; x < vt; x++) {
    const v = P.gy[base + x];
    gy[x] = v;
    l[x] = v >= 0 ? Ft - Math.floor(v / TS) : 0;
    // 천장 (동굴): 주 지면 위 바위의 아랫면
    let c = 0;
    if (P.kind === "cave" && v > 0) {
      for (let yy = v - HEAD; yy > 0; yy -= 2)
        if (F.solid(x0 + x * TS + 8, yy)) {
          c = Math.floor(yy / TS) + 1;
          break;
        }
    }
    s[x] = c;
    // 칸 전체가 평평한가 (±1px) — 함정·행사·상자를 놓아도 되는 칸
    if (v >= 0 && v % TS === 0) {
      let ok = true;
      for (let px = 0; px < TS && ok; px += 3) ok = F.solid(x0 + x * TS + px, v) && !F.solid(x0 + x * TS + px, v - 1);
      flat[x] = ok ? 1 : 0;
    }
  }
  const R = rng((P.seed ^ Math.imul(S + 1, 0x85ebca6b)) >>> 0);
  const out = { clouds: [], chests: [], spawns: [], hazards: [], peak: null, deep: null, ug: null, natural: 1 };
  const inR = (r) => r.x1 > x0 - 40 && r.x0 < x0 + vt * TS + 40;
  out.fine = { F, x0, kind: P.kind, pkey: P.pkey, render: P.prof.render, zone: z.id, ox: x0, mats: (P.mats ?? []).filter(inR), walls: (P.walls ?? []).filter(inR), spec: (P.spec ?? []).filter(inR), props: (P.props ?? []).filter((p) => p.x > x0 - 96 && p.x < x0 + vt * TS + 96) };
  out.gy = gy;
  out.flat = flat;
  out.trees = (P.trees ?? []).filter((T) => T.x + T.w / 2 + 8 > x0 && T.x - T.w / 2 - 8 < x0 + vt * TS).map((T) => ({ key: T.key, x: (T.x - x0 - 8) / TS, py: T.y, row: Math.floor(T.y / TS), nat: 1 }));
  const inC = (px) => px >= x0 && px < x0 + vt * TS;
  // ▲·▼ 문
  // 문 자리는 맵 맨 위·맨 아래로 옮겨질 수 있다 (relocateExits) — 정해진 조각이 아니라 문이 든 조각에 둔다
  if (P.peak && o.up >= 0 && inC(P.peak.x)) {
    out.peak = { x: Math.floor((P.peak.x - x0) / TS), row: P.peak.y / TS, py: P.peak.y };
    P.chest && inC(P.chest.x) && out.chests.push({ x: Math.floor((P.chest.x - x0) / TS), row: P.chest.y / TS, py: P.chest.y, tier: R() < 0.35 ? 2 : 1 });
  }
  if (P.deep && o.down >= 0 && inC(P.deep.x)) out.deep = { x: Math.floor((P.deep.x - x0) / TS), row: P.deep.y / TS, py: P.deep.y };
  // 지하 표시 (뒷벽·어둠)
  if (P.kind === "cave") out.ug = { top: 0, biome: o.biome, entrances: [], surface: new Array(vt).fill(0) };
  else if (P.kind === "ground")
    out.ug = {
      top: P.ugTop,
      biome: o.biome,
      entrances: [],
      surface: Array.from({ length: vt }, (_, x) => Math.floor(P.h[Math.min(P.h.length - 1, ((x0 + x * TS + 8) / Q) | 0)] / TS)),
      // 4px마다 지표 높이(px): 뒷벽은 지표 아래 덮인 곳에만, 땅속 암석은 지표에서 일정 깊이 아래부터
      surfPx: Array.from({ length: (vt * TS) / Q + 1 }, (_, k) => Math.round((P.hu ??= ugSurf(P))[Math.min(P.h.length - 1, x0 / Q + k)])),
    };
  else out.ug = { top: Ft + 20, biome: null, entrances: [], surface: [] };
  // 적·보물 자리
  if (!o.arena) {
    const near = (g, p) => g && Math.abs(g.x - p.x) < 5 && Math.abs(g.row - p.row) < 3;
    // 방 역할: 쉼터·성소엔 적이 없고, 전투 방엔 하나 더, 보물 방·보물 섬엔 상자
    const tags = P.roomTags ?? [];
    const tagOf = (p) => tags.find((t) => p.x >= t.x0 && p.x < t.x1 && p.y >= t.y0 && p.y <= t.y1);
    const spots = P.spots.filter((p) => inC(p.x) && (P.kind !== "ground" || Math.abs(p.y - P.gy[Math.floor(p.x / TS)]) > 20) && !["rest", "sanctum"].includes(tagOf(p)?.role) && (!P.bp || ["arena", "vista", "treasure", "trap"].includes(tagOf(p)?.role)));
    const pick = () => spots.splice(Math.floor(R() * spots.length), 1)[0];
    const mk = (p) => ({ x: Math.floor((p.x - x0) / TS), row: Math.floor((p.y - 1) / TS), py: p.y });
    // 층별 몬스터가 정해진 구역(그래스메어): 구역 전체를 한 번에 짠 배치에서 이 조각 몫만 꺼낸다
    const L = z.reg?.layers;
    if (L) {
      const rs = o.runSeed >>> 0;
      P.enc?.rs === rs || (P.enc = planEnc(P, z, rs));
      out.planned = 1;
      for (const c of P.enc.camps)
        c.pts.forEach((p, k) => {
          if (!inC(p.x)) return;
          const q = mk(p);
          out.spawns.push({ ...q, ox: p.x - (x0 + q.x * TS + 8), fy: flyY(F, p.x, p.y), layer: c.lay, enemy: c.type, lead: k === 0, big: c.big ? 1 : 0, camp: c.key, elite: c.elite, guard: c.guard });
        });
      for (const c of P.enc.chests) inC(c.x) && out.chests.push({ ...mk(c), tier: c.tier, camp: c.key, planned: 1 });
    }
    for (let k = 0, n = P.kind === "ground" ? 2 : 4; k < n && spots.length && !L; k++) {
      const p = mk(pick());
      p && !near(out.peak, p) && !near(out.deep, p) && out.spawns.push(p);
    }
    // 설계도 구역: 상자는 보물 방에만 (아래)
    for (let k = 0; k < 2 && spots.length && !P.bp && !L; k++) {
      const p = mk(pick());
      p && !near(out.peak, p) && !near(out.deep, p) && R() < 0.12 && out.chests.push({ ...p, tier: R() < 0.12 ? 2 : R() < 0.45 ? 1 : 0 });
    }
    for (const t of tags) {
      if (!L && t.role === "arena" && t.x1 > x0 && t.x0 < x0 + vt * TS) {
        const c = spots.filter((p) => tagOf(p) === t);
        if (c.length) {
          const p = mk(c[Math.floor(R() * c.length)]);
          !near(out.peak, p) && !near(out.deep, p) && out.spawns.push(p);
        }
      }
      const cx = (t.x0 + t.x1) / 2;
      if (L || t.role !== "treasure" || t.x1 <= x0 - 600 || t.x0 >= x0 + vt * TS + 600) continue;
      const c = P.spots.filter((p) => p.x >= t.x0 && p.x < t.x1 && p.y >= t.y0 && p.y <= t.y1).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0];
      c && inC(c.x) && out.chests.push({ ...mk(c), tier: t.big ? 2 : R() < 0.4 ? 2 : 1 });
    }
    P.kind === "sky" && !L && R() < 0.7 && out.spawns.push({ x: 4 + Math.floor(R() * 24), row: 50 + Math.floor(R() * 40), fly: 1 });
    // 지상 함정: 평평한 자리에만 (분지는 웅덩이·늪, 언덕 위는 가시·불기둥·얼음)
    if (P.kind === "ground" && o.patterns) {
      const pool = Object.entries(o.patterns).filter(([k]) => HZ[k]);
      for (const hz of P.hzSpots) {
        const a = Math.max(hz.x0, base), b = Math.min(hz.x1, base + vt);
        if (hz.dungeon) {
          if (b - a >= 2) out.hazards.push({ type: "spikes", x: a - base, row: hz.y / TS, py: hz.y, w: b - a, natural: 1 });
          continue;
        }
        if (b - a < 2 || !pool.length) continue;
        let tot = pool.reduce((s2, [, w]) => s2 + w, 0) * R();
        let pickK = pool[0][0];
        for (const [k2, w] of pool) if ((tot -= w) <= 0) ((pickK = k2), (tot = 1e9));
        if (hz.basin && (pickK === "spikes" || pickK === "firetrap")) {
          const wet = pool.find(([k2]) => k2 === "poison" || k2 === "quicksand" || k2 === "ice");
          wet && (pickK = wet[0]);
        }
        const type = HZ[pickK];
        const row = hz.y / TS;
        if (type === "fireJet") {
          for (const xx of [a + 1, a + 4]) xx < b && flat[xx - base] && out.hazards.push({ type, x: xx - base, row, py: hz.y, w: 1, natural: 1 });
        } else {
          const w = Math.min(b - a - 1, type === "spikes" ? R.int(1, 3) : R.int(2, 4));
          const xx = a + Math.floor(R() * (b - a - w));
          let okW = true;
          for (let q = xx; q < xx + w; q++) okW = okW && !!flat[q - base];
          okW && w > 0 && out.hazards.push({ type, x: xx - base, row, py: hz.y, w, natural: 1 });
        }
      }
    }
  }
  return out;
}

// ── 층 (하늘섬 · 땅 · 지하) ─────────────────────────
// 지상 구역: 지표(P.h)보다 120px(약 7칸) 넘게 위면 하늘섬, 64px(4칸) 넘게 아래면 지하
export function layerAt(P, x, y) {
  if (P.kind === "ground" && P.h) {
    const h = P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / Q)))];
    return y < h - 120 ? "sky" : y > h + 64 ? "under" : "ground";
  }
  // 하늘·동굴 구역: 설 수 있는 자리 높이를 셋으로 나눈 띠 (하늘 = 위 high · 가운데 mid · 아래 low / 동굴 = 윗층 top · 가운데 mid · 아랫층 bot)
  const B = (P.bands ??= bandsOf(P));
  const k = y < B[0] ? 0 : y < B[1] ? 1 : 2;
  return P.kind === "sky" ? ["high", "mid", "low"][k] : ["top", "mid", "bot"][k];
}
function bandsOf(P) {
  const ys = (P.spots ?? []).map((p) => p.y).sort((a, b) => a - b);
  if (ys.length < 6) return [P.HP / 3, (P.HP * 2) / 3];
  // 하늘 구역 맨 아래 일자 바닥은 세지 않는다 (자리가 많아 띠가 쏠린다)
  const yMax = ys[ys.length - 1], L = P.kind === "sky" ? ys.filter((y) => y < yMax - 24) : ys;
  const q = (t) => L[Math.min(L.length - 1, Math.floor(L.length * t))];
  return [q(1 / 3), q(2 / 3)];
}
// 나는 몬스터가 떠 있을 높이: 머리 위가 트인 만큼 (최대 64px)
function flyY(F, x, y) {
  let top = y;
  for (let yy = y - 8; yy >= y - 104; yy -= 8) {
    if (F.solid(x, yy)) break;
    top = yy;
  }
  return Math.round(y - Math.min(64, Math.max(0, y - top - 32)));
}
// ── 구역 단위 적·상자 배치 ──────────────────────────
// 층마다 사는 몬스터가 다르고(z.reg.layers), 몬스터는 무리(진영) 단위로 서로 떨어뜨려 놓는다.
//   - 입구·출구 둘레, ▲·▼ 문 둘레, 쉼터·성소, 보스 방 앞은 비운다
//   - 전투 방(arena)에는 먼저 큰 무리를 둔다
//   - 상자: 땅은 무리 뒤(지키는 상자), 하늘섬은 가장 높은 섬, 지하는 가장 깊은 굴 — 층마다 고르게
// 탐험마다(rs) 무리 자리·종류·상자 자리가 바뀐다. 지형은 그대로
// 띠마다: 무리 사이 간격 · 구역(8192px) 하나에 무리 수 상한 · 따로 놓는 상자 수 (하늘·동굴 구역의 세 띠는 기본값)
const ENC_GAP = { ground: 340, sky: 360, under: 380 }, GAP0 = 380;
const CAMP_N = { ground: 18, sky: 22, under: 26 }, CAMP0 = 20;
const CHEST_N = { ground: 5, sky: 4, under: 4 }, CHEST0 = 4;
function planEnc(P, z, rs) {
  const R = rng((P.seed ^ Math.imul((rs ^ 0x51ed27) + 1, 0x27d4eb2d)) >>> 0);
  const L = z.reg.layers, ring = z.ring ?? 1, dg = z.kind === "dungeon";
  const tags = P.roomTags ?? [];
  const tagOf = (p) => tags.find((t) => p.x >= t.x0 && p.x < t.x1 && p.y >= t.y0 && p.y <= t.y1);
  const safe = dg ? 360 : 760, end = Math.min(P.WP - safe, P.arenaFrom - 260);
  const doors = [P.peak, P.deep].filter(Boolean);
  const BANDS = Object.keys(L), cand = Object.fromEntries(BANDS.map((b) => [b, []]));
  // 정말 설 수 있는 자리만 (발밑 바로 아래 땅, 발목 위 공기)
  const stand = (p) => P.F.solid(p.x, p.y + 3) && !P.F.solid(p.x, p.y - 6);
  for (const p of P.spots) {
    if (p.x < safe || p.x > end || !stand(p)) continue;
    if (doors.some((d) => Math.abs(d.x - p.x) < 180 && Math.abs(d.y - p.y) < 140)) continue;
    const role = tagOf(p)?.role;
    // 쉼터·성소·시련(장치를 다루는 길)엔 무리를 세우지 않는다
    if (role === "rest" || role === "sanctum" || role === "trial") continue;
    cand[layerAt(P, p.x, p.y)]?.push({ x: p.x, y: p.y, role });
  }
  // 언덕진 지표는 "평평한 자리"가 드물다: 완만한 주 지면 칸도 지표 후보로 (머리 위 40px 트임)
  if (P.kind === "ground" && P.gy)
    for (let t = 1; t < P.W - 1; t++) {
      const y = P.gy[t], x = t * TS + 8;
      if (y <= 0 || x < safe || x > end || Math.abs(P.gy[t - 1] - P.gy[t + 1]) > 8 || P.F.solid(x, y - 40) || P.F.solid(x, y - 20) || P.F.solid(x, y - 6) || !P.F.solid(x, y + 3)) continue;
      if (doors.some((d) => Math.abs(d.x - x) < 180 && Math.abs(d.y - y) < 140) || layerAt(P, x, y) !== "ground") continue;
      const role = tagOf({ x, y })?.role;
      role !== "rest" && role !== "sanctum" && role !== "trial" && cand.ground?.push({ x, y, role });
    }
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const far = (list, p, d) => list.every((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 1.4) >= d);
  const pickW = (list) => {
    let t = list.reduce((s, e) => s + (e.w ?? 1), 0) * R();
    for (const e of list) if ((t -= e.w ?? 1) <= 0) return e;
    return list[0];
  };
  const camps = [], chests = [], extra = Object.fromEntries(BANDS.map((b) => [b, []]));
  for (const lay of BANDS) {
    const pool = L[lay]?.enemies, C = cand[lay];
    if (!pool?.length || !C.length) continue;
    const gap = dg ? 340 : ENC_GAP[lay] ?? GAP0, mine = [];
    const order = shuffle(C.slice()).sort((a, b) => (b.role === "arena") - (a.role === "arena"));
    for (const p of order) far(mine, p, gap) && mine.push(p);
    // 상한을 넘으면 전투 방 무리는 남기고, 나머지는 가로로 고르게 솎는다
    const cap = Math.max(2, Math.round((CAMP_N[lay] ?? CAMP0) * (P.WP / 8192) * (dg ? 1.6 : 1)));
    if (mine.length > cap) {
      const keep = mine.filter((p) => p.role === "arena").slice(0, cap), rest = mine.filter((p) => p.role !== "arena").sort((a, b) => a.x - b.x);
      const need = cap - keep.length;
      for (let i = 0; i < need; i++) keep.push(rest[Math.floor(((i + R() * 0.8 + 0.1) * rest.length) / need)]);
      mine.length = 0;
      mine.push(...keep);
    }
    for (const p of mine) {
      const big = p.role === "arena", E = pickW(pool);
      const [a, b] = E.pack ?? [1, 2];
      let n = a + Math.floor(R() * (b - a + 1)) + (big || dg ? 1 : 0);
      ring >= 2 && R() < 0.3 && n++;
      // 무리: 같은 턱 위(높이 차 6px 안), 22px 넘게 서로 떨어진 자리
      const pts = [p];
      for (const q of shuffle(C.filter((q) => Math.abs(q.y - p.y) <= 6 && Math.abs(q.x - p.x) <= 120)))
        if (pts.length < n && pts.every((r) => Math.abs(r.x - q.x) >= 22)) pts.push(q);
      camps.push({ id: camps.length, lay, type: E.id, pts, big });
    }
    // 땅: 무리 뒤 40~110px 자리 (그 무리가 지키는 상자)
    if (dg || lay !== "ground") continue;
    for (const c of shuffle(camps.filter((c) => c.lay === "ground"))) {
      const h = c.pts[0], q = C.filter((q) => Math.abs(q.y - h.y) <= 10 && Math.abs(q.x - h.x) >= 40 && Math.abs(q.x - h.x) <= 110 && c.pts.every((r) => Math.abs(r.x - q.x) >= 18));
      q.length && extra.ground.push(q[Math.floor(R() * q.length)]);
    }
  }
  // ── 상자: 보물 방 + 층마다 몇 개. 모든 상자에 지키는 무리를 붙이고, 무리 세기 = 상자 등급 ──
  //   0 나무(작은 무리) · 1 철(3마리) · 2 황금(정예 우두머리) · 3 전설(정예 종 + 특성 둘)
  //   찾기 어려운 상자(높은 하늘섬·깊은 지하·큰 보물 방)일수록 높은 등급
  if (!dg) {
    for (const t of tags) {
      if (t.role !== "treasure") continue;
      const cx = (t.x0 + t.x1) / 2;
      const c = P.spots.filter((p) => p.x >= t.x0 && p.x < t.x1 && p.y >= t.y0 && p.y <= t.y1).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0];
      const lay = layerAt(P, c?.x ?? 0, c?.y ?? 0);
      c && cand[lay] && chests.push({ x: c.x, y: c.y, lay, big: t.big ? 1 : 0, elite: t.elite ? 1 : 0, safe: t.safe ? 1 : 0 });
    }
    for (const lay of BANDS) {
      const C = cand[lay];
      let list = extra[lay];
      if (lay !== "ground") {
        // 위쪽 띠(하늘섬·하늘 구역)는 높은 곳부터, 아래쪽 띠(지하·동굴)는 깊은 곳부터 (위·아래 30% 안에서 고른다)
        const up = lay === "sky" || P.kind === "sky";
        const s2 = C.slice().sort((a, b) => (up ? a.y - b.y : b.y - a.y));
        list = shuffle(s2.slice(0, Math.max(6, Math.ceil(s2.length * 0.3))));
      }
      const want = CHEST_N[lay] ?? CHEST0;
      let n = 0;
      for (const q of list) {
        if (n >= want) break;
        if (!far([...chests, ...doors], q, 600)) continue;
        chests.push({ x: q.x, y: q.y, lay });
        n++;
      }
    }
    // 지키는 무리: 가까운 무리(260px 안, 같은 층)를 쓰고, 없으면 상자 옆에 새로 세운다
    const allSp = Object.fromEntries(BANDS.map((b) => [b, []]));
    for (const p of P.spots) stand(p) && allSp[layerAt(P, p.x, p.y)]?.push(p);
    for (const c of cand.ground ?? []) allSp.ground.push(c);
    const pickNear = (lay, p) => {
      let q = allSp[lay].filter((q) => Math.abs(q.y - p.y) <= 12 && Math.abs(q.x - p.x) >= 40 && Math.abs(q.x - p.x) <= 170);
      q.length || (q = allSp[lay].filter((q) => Math.abs(q.x - p.x) >= 30 && Math.hypot(q.x - p.x, q.y - p.y) <= 220));
      return q.length ? q[Math.floor(R() * q.length)] : null;
    };
    for (const c of chests) {
      // 거점 안 상자: 지키는 무리 없이
      if (c.safe) continue;
      const pool = L[c.lay]?.enemies;
      let g = camps.filter((k) => k.lay === c.lay).map((k) => [k, Math.hypot(k.pts[0].x - c.x, (k.pts[0].y - c.y) * 1.5)]).filter(([, d]) => d < 260).sort((a, b) => a[1] - b[1])[0]?.[0];
      if (!g && pool?.length) {
        const p = pickNear(c.lay, c);
        if (p) {
          const E = pickW(pool);
          g = { id: camps.length, lay: c.lay, type: E.id, pts: [{ x: p.x, y: p.y }], big: !1 };
          camps.push(g);
        }
      }
      g && (c.camp = g.id);
    }
    // 등급 나누기: 지키는 무리가 있는 상자만, 찾기 어려운 순서로 줄 세우고 높은 등급부터 (무방비 상자는 나무)
    const surf = (x) => (P.h ? P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / Q)))] : P.HP / 2);
    // 찾기 어려운 정도: 지상 구역은 지표에서 멀수록, 하늘 구역은 높을수록, 동굴 구역은 깊을수록
    const remote = (c) => (P.kind === "sky" ? P.HP - c.y : P.kind === "cave" ? c.y : c.lay === "sky" ? surf(c.x) - c.y : c.lay === "under" ? c.y - surf(c.x) : R() * 1500);
    // 정예 방(설계에서 정한 곳)은 가장 높은 등급부터
    for (const c of chests) c.score = remote(c) + (c.big ? 900 : 0) + (c.elite ? 1e6 : 0) + R() * 600;
    const gd = chests.filter((c) => c.camp != null).sort((a, b) => b.score - a.score), N = gd.length;
    const nL = Math.max(1, Math.round(N * 0.12)), nG = Math.round(N * 0.28), nI = Math.round(N * 0.35);
    gd.forEach((c, i) => (c.tier = i < nL ? 3 : i < nL + nG ? 2 : i < nL + nG + nI ? 1 : 0));
    for (const c of chests) c.camp == null && (c.tier = 0);
    // 띠마다 철 상자 하나는 (그 띠에서 가장 찾기 어려운 상자)
    for (const b of BANDS) {
      const gg = gd.filter((c) => c.lay === b);
      gg.length && !gg.some((c) => c.tier >= 1) && (gg[0].tier = 1);
    }
    for (const c of gd) camps[c.camp].guard = Math.max(camps[c.camp].guard ?? -1, c.tier);
    // 무리 세기를 상자 등급에 맞춘다
    for (const g of camps) {
      if (g.guard == null) continue;
      const C = allSp[g.lay], p = g.pts[0], pool = L[g.lay]?.enemies ?? [];
      // 지기 종류: 나무 = 가장 약한 것 · 철 = 중간까지 · 황금·전설 = 가장 센 것
      if (pool.length) {
        const ts = pool.map((e) => e.t ?? 1), lo = Math.min(...ts), hi = Math.max(...ts);
        const ok = pool.filter((e) => (g.guard === 0 ? (e.t ?? 1) === lo : g.guard === 1 ? (e.t ?? 1) <= Math.max(lo, 2) : (e.t ?? 1) === hi));
        ok.length && !ok.some((e) => e.id === g.type) && (g.type = pickW(ok).id);
      }
      const want = g.guard === 0 ? 2 : 3 + (g.guard === 3 ? 1 : 0);
      if (g.guard === 0) g.pts.length = Math.min(g.pts.length, 2);
      for (const q of shuffle(C.filter((q) => Math.abs(q.y - p.y) <= 6 && Math.abs(q.x - p.x) <= 130)))
        if (g.pts.length < want && g.pts.every((r) => Math.abs(r.x - q.x) >= 22)) g.pts.push(q);
      g.elite = g.guard >= 3 ? 2 : g.guard === 2 ? 1 : 0;
    }
  }
  for (const c of camps) c.key = `${z.id}#${rs}#${c.id}`;
  for (const c of chests) c.camp != null && (c.key = camps[c.camp].key);
  return { rs, camps, chests };
}

// 땅속 뒷벽이 시작하는 높이 (4px 칸마다): 지표선(P.h) 아래라도 옆으로 176px 안에서 하늘과 트인 공기(처마·문간·굴 입구 지붕 밑)는
// 바깥으로 보고 그 아래부터 뒷벽을 칠한다 (하늘에 네모난 벽이 생기지 않게)
function ugSurf(P) {
  const hu = Float32Array.from(P.h), sol = (x, y) => P.F.solid(x, y), H = (x) => P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(x / Q)))];
  for (let i = 0; i < P.h.length; i++) {
    const x = i * Q + 2, h = P.h[i];
    let low = h;
    for (let y = h + 8; y < h + 960; y += 8) {
      if (sol(x, y)) continue;
      let open = !1;
      for (const d of [-1, 1]) {
        for (let k = 8; k <= 176 && !open; k += 8) {
          const xx = x + d * k;
          if (sol(xx, y)) break;
          y < H(xx) - 4 && (open = !0);
        }
        if (open) break;
      }
      open && (low = y + 8);
    }
    hu[i] = low;
  }
  return hu;
}
// ── 엔진 바깥(도구·검사)용 ───────────────────────────
export const sampleSolid = (P, x, y) => P.F.solid(x, y);
