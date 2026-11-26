// 하늘 군도 생성기 (노랑 하늘 구역 공통) — 각진 방이 든 속 빈 바위섬 수십 개
//   층(높이 띠)마다 크기·깊이·높이가 제각각인 섬을 늘어놓고, 섬 속엔 1~3층 방 (갱도 + 방 짜임 16가지)
//   섬 윗면엔 오두막 · 단 · 폐허 기둥 · 연못, 섬과 섬은 출렁다리 · 무너지는 다리 · 구름 · 나룻 바구니, 층 사이는 섬 배를 뚫고 내린 사다리·밧줄·덩굴·승강기
//   Z = { seed, gap:[a,b] 층 간격, iw:[a,b] 섬 폭, gx:[a,b] 섬 사이, dep:[a,b] 섬 깊이, jit 높이 흔들림, link:{bridge,crumble,cloud,ferry}, vert:[..],
//         pick(x,f)=>지구{n,m,t,props,top}, peak:x, boss:x, sig(K,ctx) }
import { rng } from "./noise.js";
import { PL, jag, nat, rope_bridge, P_, skyBegin, skyEnd, dropTo, surf } from "./archi_sky.js";
import { room as aroom, TN } from "./angular.js";

const W = 1024, F = 1000;
const ROLE = { pillars: "arena", balcony: "arena", pit: "trap", cistern: "arena", vault: "treasure", ore: "treasure", steps: "arena", bunks: "rest", shrine: "rest", workshop: "arena", collapse: "arena", tower: "treasure", split: "arena", ell: "arena", cage: "arena", library: "treasure" };

export function skyisles(K, Z) {
  const R = rng(Z.seed >>> 0), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = (a) => a[Math.floor(R() * a.length)];
  const wpick = (o) => { let s = 0; for (const k in o) s += o[k]; let r = R() * s; for (const k in o) if ((r -= o[k]) < 0) return k; return Object.keys(o)[0]; };
  const G = Z.gap ?? [86, 112], IW = Z.iw ?? [50, 150], GX = Z.gx ?? [16, 46], DP = Z.dep ?? [28, 64], J = Z.jit ?? 24;
  skyBegin(K);
  // 지상 구역: 맨 아래 층 대신 실제 땅(Z.ground = 칸 x → 지표 줄) + 땅 위 큰 지형물(Z.surface가 [x0, x1, 윗면]들을 돌려준다)
  // 지표: 엔진의 지표 줄은 어림이라 실제 칸에서 첫 바위를 찾는다 (땅 위에 아직 아무것도 짓기 전)
  const GC = new Int16Array(W).fill(-1);
  const GR0 = Z.ground ? (x) => { x = Math.max(0, Math.min(W - 1, Math.round(x))); if (GC[x] < 0) { let y = Math.max(1, Z.ground(x) - 40); while (y < K.NY - 2 && K.get(x, y) !== 1) y++; GC[x] = y; } return GC[x]; } : null;
  if (GR0) for (let x = 0; x < W; x++) GR0(x);
  const tops = GR0 && Z.surface ? Z.surface(K, { ri, R, GR: GR0 }) ?? [] : [];
  const GR = GR0 ? (x) => { x = Math.max(0, Math.min(W - 1, Math.round(x))); let g = GR0(x); for (const t of tops) x >= t[0] && x < t[1] && (g = Math.min(g, t[2])); return g; } : null;
  const minG = (a, b) => { let m = 1e9; for (let x = a; x <= b; x += 3) m = Math.min(m, GR(x)); return m; };
  // 지표 절벽(뛰어오를 수 없는 높이 차): 낮은 쪽 발치에 사다리
  if (GR0) for (let x = 2, last = -99; x < W - 3; x++) {
    const a = GR0(x), b = GR0(x + 1), d = Math.abs(a - b);
    if (d < 7 || x - last < 12) continue;
    let top = Math.min(a, b), bot = Math.max(a, b), xl = a > b ? x : x + 1;
    for (let k = 2; k < 6; k++) { const c = GR0(a > b ? x + k : x + 1 - k); top = Math.min(top, c); }
    K.ladder(xl, top, bot), K.plank(xl - 1, xl + 2, top), (last = x);
  }
  let gTop = F;
  if (GR) { gTop = 1e9; for (let x = 0; x < W; x += 4) gTop = Math.min(gTop, GR(x)); }
  // ── 층 높이 (층은 뼈대일 뿐, 섬마다 위아래로 크게 흩어진다) ──
  const T = [GR ? gTop : F];
  for (let f = T[0] - ri(G[0], G[1]); f > (Z.ceil ?? 44); f -= ri(G[0], G[1])) T.push(f);
  // ── 섬 배치 ──
  const tiers = T.map((tf, i) => {
    const out = [];
    if (i === 0 && GR) return out;
    let x = i === 0 ? 0 : ri(4, 50);
    while (x < W - 30) {
      let w = i === 0 ? ri(110, 210) : R() < 0.3 ? ri(IW[0], (IW[0] + IW[1]) >> 1) : ri(IW[0], IW[1]);
      if (W - (x + w) < 40 || i === 0 && W - (x + w) < 110) w = W - (i === 0 ? 0 : ri(4, 20)) - x;
      if (w < 26) break;
      if (Z.boss && i === 1 && x + w > Z.boss - 40) break;
      let f = i === 0 ? F : Math.max(40, tf + ri(-J, J));
      if (GR && i === 1) f = Math.min(f, minG(x, x + w) - 70);
      out.push({ x0: x, x1: x + w, f, D: i === 0 ? ri(30, 48) : ri(DP[0], DP[1]), tier: i, id: `${i}_${out.length}` });
      x += w + ri(GX[0], GX[1]);
    }
    return out;
  });
  Z.place && Z.place(K, { tiers, T, ri, R });
  // 깊이: 바로 밑 섬과 40칸은 띄운다 (밑이 비면 깊게)
  const clear = (s, lower) => lower.reduce((m, l) => (l.x1 > s.x0 - 12 && l.x0 < s.x1 + 12 ? Math.min(m, l.f - s.f - 40) : m), 90);
  for (let i = 1; i < tiers.length; i++) for (const s of tiers[i]) s.pseudo || (s.D = Math.max(14, Math.min(s.D, GR && i === 1 ? minG(s.x0 - 12, s.x1 + 12) - s.f - 40 : clear(s, tiers[i - 1]), Math.round((s.x1 - s.x0) * 0.75))));
  // 디딤 섬: 섬 사이 빈 하늘, 층 사이 높이 (밑 섬으로 덩굴이 내려간다)
  const isl = [];
  for (let i = 1; i < tiers.length; i++)
    for (let k = 0; k + 1 < tiers[i].length; k++) {
      const a = tiers[i][k], b = tiers[i][k + 1];
      if (b.x0 - a.x1 < 34 || R() > (Z.islet ?? 0.6)) continue;
      const w = Math.min(b.x0 - a.x1 - 12, ri(14, 30)), x0 = ri(a.x1 + 6, b.x0 - 6 - w), f = Math.max(a.f, b.f) + ri(22, 40);
      const s = { x0, x1: x0 + w, f, D: ri(8, 14), tier: i - 0.5, islet: 1 };
      if (GR && i === 1 ? minG(s.x0, s.x1) - s.f < s.D + 24 : clear(s, tiers[i - 1]) < s.D + 4) continue;
      isl.push(s);
    }
  const all = tiers.flat(), real = [...all.filter((s) => !s.pseudo), ...isl];
  // ── 섬 몸통 (자연 바위, 윗면은 평평) · 모양 갈래: 뾰족 · 둥근 · 판 · 쌍봉 · 외벼랑 ──
  const FAM = {
    v: (x0, x1, f, D, w) => [[x0, f + 4], [x0 + w * (0.15 + R() * 0.15), f + D * (0.5 + R() * 0.2)], [x0 + w * (0.4 + R() * 0.2), f + D], [x0 + w * (0.7 + R() * 0.15), f + D * (0.5 + R() * 0.25)], [x1, f + 4]],
    round: (x0, x1, f, D, w) => [[x0, f + 5], [x0 + w * 0.04, f + D * 0.6], [x0 + w * 0.22, f + D * 0.95], [x1 - w * (0.2 + R() * 0.1), f + D], [x1 - w * 0.04, f + D * 0.6], [x1, f + 5]],
    slab: (x0, x1, f, D, w) => [[x0, f + 4], [x0 + 6, f + D * 0.45], [x0 + w * 0.5, f + D * (0.4 + R() * 0.15)], [x1 - 6, f + D * 0.45], [x1, f + 4]],
    twin: (x0, x1, f, D, w) => [[x0, f + 4], [x0 + w * 0.25, f + D], [x0 + w * 0.5, f + D * 0.45], [x0 + w * 0.75, f + D * (0.8 + R() * 0.2)], [x1, f + 4]],
    cliff: (x0, x1, f, D, w) => (R() < 0.5 ? [[x0, f + 4], [x0 + 3, f + D], [x0 + w * 0.4, f + D * 0.9], [x1, f + 4]] : [[x0, f + 4], [x1 - w * 0.4, f + D * 0.9], [x1 - 3, f + D], [x1, f + 4]]),
  };
  for (const s of real) {
    const { x0, x1, f, D } = s, w = x1 - x0, sd = (x0 * 7 + f * 3 + Z.seed) % 991;
    const fam = s.tier === 0 ? "slab" : R() < (Z.own ?? 0.45) && Z.belly ? null : wpick(Z.fam ?? { v: 2, round: 2, slab: 1, twin: 1, cliff: 1 });
    const shape = fam ? FAM[fam](x0, x1, f, D, w) : Z.belly(s, R);
    nat(K, x0, x1, () => f, jag(PL(shape), 1.8, sd), { flat: 1, sh: 2, fingers: Math.max(1, Math.round(w / (Z.fing ?? 40))), rough: Z.rough ?? 2.2, seed: sd });
  }
  for (const s of [...all, ...isl]) s.d = Z.pick((s.x0 + s.x1) >> 1, s.f);
  let N = 0;
  // ── 섬 윗면 꾸밈 (지구마다 다른 것) ──
  for (const s of real) {
    const { x0, x1, f, d } = s, w = x1 - x0, cx = (x0 + x1) >> 1;
    if (s.bare) continue;
    if (s.tier === 0 && (x0 === 0 || x1 === W)) { P_(K, x0 === 0 ? 20 : W - 20, f, d.props[0]); continue; }
    const top = d.top[(s.tier * 3 + (x0 >> 4)) % d.top.length];
    if (w < 40) { P_(K, cx, f, pick(d.props)); continue; }
    if (top === "hut") { // 오두막: 지붕 위로 사다리 (지붕도 길)
      const hw = Math.min(40, w >> 1), a = cx - (hw >> 1), h = ri(12, 16);
      K.wall(a, f - h, a + hw, f, d.m === "rock" ? "wood" : d.m), K.plank(a - 2, a + hw + 2, f - h), K.ladder(a + hw - 3, f - h, f);
      P_(K, a + 6, f, pick(d.props)), K.prop(a + (hw >> 1), f - h, pick(d.props)), K.tag(a, f - h - 12, a + hw, f - h, "treasure");
      K.struct(`${d.n} 오두막 ${++N}`, "treasure", a, f - h, a + hw, f);
    } else if (top === "steps") { // 단 (4칸씩 둘)
      const a = cx - (w >> 2), b = cx + (w >> 2);
      K.rock(a, f - 4, b, f), K.rock(a + 8, f - 8, b - 8, f - 4);
      P_(K, cx, f - 8, d.props[1]), K.tag(a, f - 20, b, f - 8, "arena");
    } else if (top === "ruin") { // 폐허 기둥 + 기둥 위 판
      for (let x = x0 + 8; x < x1 - 8; x += ri(12, 20)) K.wall(x, f - ri(8, 18), x + 2, f, "stem");
      const a = cx - 10;
      K.plank(a, a + 20, f - 10), K.ladder(a + 2, f - 10, f), P_(K, cx + 12, f, d.props[2]), K.tag(x0 + 4, f - 14, x1 - 4, f, "arena");
    } else if (top === "pool") { // 윗면 연못 (3칸 깊이)
      const a = cx - Math.min(24, w >> 2), b = cx + Math.min(24, w >> 2);
      K.air(a, f, b, f + 3), K.water(a, f, b, f + 3), P_(K, x0 + 8, f, d.props[0]), K.tag(a, f - 10, b, f + 3, "arena");
    } else if (top === "tower") { // 망루: 판 셋
      const a = cx - 9, b = cx + 9;
      K.wall(a, f - 30, b, f, d.m === "rock" ? "brick" : d.m), K.plank(a, b, f - 10), K.plank(a, b, f - 20), K.plank(a - 3, b + 3, f - 30);
      K.ladder(a + 2, f - 30, f), P_(K, cx + 3, f - 30, pick(d.props)), K.tag(a, f - 40, b, f - 30, "treasure");
      K.struct(`${d.n} 망루 ${++N}`, "treasure", a, f - 30, b, f);
    } else {
      for (let x = x0 + 10; x < x1 - 10; x += ri(14, 26)) P_(K, x, f, pick(d.props));
      K.tag(x0 + 4, f - 14, x1 - 4, f, "arena");
    }
    R() < 0.15 && K.heal(cx - 3, cx + 3, f - 4, f);
    K.struct(`${d.n} 섬 ${++N}`, s.tier === 0 ? "길" : "섬", x0, f - 14, x1, f + s.D);
  }
  // ── 섬 속 방 (1~3층) ──
  for (const s of real) {
    const { x0, x1, f, D, d } = s, w = x1 - x0;
    if (w < 44 || D < 26 || s.solid) continue;
    const a = Math.round(x0 + w * 0.22), b = Math.round(x1 - w * 0.22), lim = f + D * (Z.inner ?? 0.56);
    let fl = f + ri(15, 19), prev = f, lvl = 0, hx = ri(a + 4, b - 6);
    if (fl + 3 > lim) continue;
    climb(K, hx, surf(K, hx, f - 12), fl, d.m, ri);
    while (fl < lim && lvl < 3) {
      K.air(a, fl - 9, b, fl), K.wall(a, fl - 9, b, fl, d.m);
      let x = a + ri(0, 6);
      while (x < b - 20) {
        const rw = Math.min(b - x, ri(20, 46)), h = Math.min(fl - prev - 3, ri(10, 17));
        if (rw < 18 || h < 10) break;
        const t = d.t[(N * 5 + lvl * 3 + ri(0, 3)) % d.t.length];
        aroom(K, x, x + rw, fl, h, d, t, ri, null);
        const role = ROLE[t];
        K.tag(x + 2, fl - Math.min(h, 12), x + rw - 2, fl, role), K.struct(`${d.n} ${TN[t]} ${++N}`, role, x, fl - h, x + rw, fl);
        x += rw + ri(3, 14);
      }
      const nf = fl + ri(15, 18);
      if (nf >= lim || lvl >= 2) break;
      const nx = ri(a + 4, b - 6);
      climb(K, nx, fl, nf, d.m, ri);
      prev = fl, fl = nf, lvl++;
    }
  }
  // ── 같은 층 섬 잇기 ──
  for (const row of tiers)
    for (let k = 0; k + 1 < row.length; k++) {
      const a = row[k], b = row[k + 1], g = b.x0 - a.x1, y = Math.min(a.f, b.f);
      if (g <= 4 && Math.abs(a.f - b.f) <= 4) continue;
      let kind = wpick(Z.link ?? { bridge: 4, crumble: 2, cloud: 2, ferry: 1 });
      if (kind === "ferry" && g < 36) kind = "bridge";
      if (kind === "cloud" && g < 12) kind = "bridge";
      const ea = a.x1 - 2, eb = b.x0 + 2;
      if (kind === "bridge") rope_bridge(K, ea, eb, y, Math.min(4, g >> 3));
      else if (kind === "crumble") rope_bridge(K, ea, eb, y, Math.min(3, g >> 3), 3, k);
      else if (kind === "cloud") for (let x = ea; x < eb; x += 10) K.cloud(x, Math.min(eb, x + 7), y);
      else K.ferry(ea, eb, y, 6, 14), K.plank(ea, ea + 2, y), K.plank(eb - 2, eb, y);
      // 낮은 쪽 섬으로 내려가는 사다리
      if (a.f > y + 1) K.plank(ea - 4, ea, y), K.ladder(ea - 2, y, a.f);
      if (b.f > y + 1) K.plank(eb, eb + 4, y), K.ladder(eb + 2, y, b.f);
      kind === "ferry" || K.tag(ea, y - 10, eb, y, kind === "crumble" ? "trap" : "arena");
    }
  // ── 층 사이 (위 섬 배를 뚫고 아래 섬 윗면까지) ──
  for (let i = 1; i < tiers.length; i++) {
    let n = 0;
    for (const u of tiers[i]) {
      if (u.pseudo) continue;
      if (GR && i === 1) { dropTo(K, ri(u.x0 + Math.min(8, (u.x1 - u.x0) >> 3), u.x1 - Math.min(8, (u.x1 - u.x0) >> 3)), u.f, pick(Z.vert ?? ["ladder", "rope", "vine"])); n++; continue; }
      const lo = tiers[i - 1].map((l) => [l, Math.max(u.x0, l.x0) + 6, Math.min(u.x1, l.x1) - 6]).filter(([, a, b]) => b - a > 2);
      if (!lo.length) continue;
      const [l, a, b] = pick(lo), x = ri(a, b), kind = pick(Z.vert ?? ["ladder", "rope", "vine"]);
      if (l.f - u.f > 100 && R() < 0.5) {
        K.air(x - 4, u.f - 8, x + 5, l.f), K.lift(x - 3, x + 4, u.f, l.f, u.f - 10);
      } else dropTo(K, x, u.f, kind);
      n++;
    }
    if (!n && !(GR && i === 1)) {
      const u = tiers[i][0], l = tiers[i - 1][0], x = u.x0 + 4;
      K.air(x - 4, u.f - 8, x + 5, l.f), K.lift(x - 3, x + 4, u.f, l.f, u.f - 10);
    }
  }
  for (const s of isl) {
    const i = Math.round(s.tier - 0.5), lo = tiers[i].filter((l) => l.x0 < s.x1 - 4 && l.x1 > s.x0 + 4);
    if (lo.length || GR) dropTo(K, ri(s.x0 + 3, s.x1 - 4), s.f, pick(Z.vert ?? ["vine"]));
    K.struct(`${s.d.n} 디딤 섬`, "섬", s.x0, s.f - 10, s.x1, s.f + s.D);
  }
  // ── 쉼터 · ▲ · 보스 방 ──
  if (!GR) {
    K.tag(2, F - 14, 40, F, "rest", { safe: 1 });
    Z.boss ? K.air(Z.boss, F - 44, W, F) : K.tag(984, F - 14, W - 2, F, "rest", { safe: 1 });
  }
  const topRow = tiers[tiers.length - 1], px = Z.peak ?? 520;
  const pk = topRow.reduce((b, s) => (Math.abs((s.x0 + s.x1) / 2 - px) < Math.abs((b.x0 + b.x1) / 2 - px) ? s : b), topRow[0]);
  const pX = Math.max(pk.x0 + 10, Math.min(pk.x1 - 10, px));
  K.air(pX - 14, pk.f - 20, pX + 14, pk.f), K.peak(pX, pk.f), K.tag(pX - 12, pk.f - 14, pX + 12, pk.f, "rest", { safe: 1 });
  Z.sig && Z.sig(K, { tiers, T, ri, R, all, real, pick, G0: GR0 });
  skyEnd(K);
  return { tiers, T };
}

function climb(K, x, fu, fd, m, ri) {
  K.air(x - 1, fu, x + 2, fd), K.wall(x - 1, fu, x + 2, fd, m), K.plank(x - 1, x + 2, fu);
  ri(0, 4) === 0 ? K.rope(x, fu - 3, fd) : K.ladder(x, fu, fd);
}
