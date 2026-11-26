// 각진 갱도·방 생성기 (지하 공통) — 구불구불한 자연 동굴 없음 · 사선 비탈 없음
//   암반에 높이가 들쭉날쭉한 수평 갱도 층을 깎고, 층마다 크기·속 짜임이 제각각인 방을 붙인다
//   + 두 층을 꿰뚫는 큰 홀 · 갱도 밑에 매달린 지하실 · 여러 층을 세로로 관통하는 탑 지구 · 레버 지름길
//   Z = { seed, y0, y1, en(입구 줄, 없으면 null), boss(보스 방 시작 x), peak:[x], deep:[x], top(위 연결: (K,x)=>바닥 줄), D(지구 목록), pick(x,f)=>지구 }
import { rng } from "./noise.js";

const W = 1024;
const P = (K, x, f, k, o) => K.prop(x, f, k, o);
export const TN = {
  pillars: "기둥 홀", balcony: "발코니 방", pit: "구덩이 다리", cistern: "물탱크", vault: "금고", ore: "광맥 기둥 방", steps: "계단 방", bunks: "침상 방",
  shrine: "사당", workshop: "작업장", collapse: "무너진 방", tower: "망루 방", split: "두 칸 방", ell: "ㄱ자 방", cage: "우리 방", library: "서고",
};
const ROLE = {
  pillars: "arena", balcony: "arena", pit: "trap", cistern: "arena", vault: "treasure", ore: "treasure", steps: "arena", bunks: "rest",
  shrine: "rest", workshop: "arena", collapse: "arena", tower: "treasure", split: "arena", ell: "arena", cage: "arena", library: "treasure",
};

export function angular(K, Z) {
  const R = rng(Z.seed >>> 0), ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = (a) => a[Math.floor(R() * a.length)];
  // ── 층 바닥: 들쭉날쭉한 간격 (입구 줄은 반드시) ──
  const LV = [];
  const G = Z.gap ?? [46, 80], SG = Z.seg ?? [110, 380], RW = Z.rw ?? [22, 92], RH = Z.rh ?? [14, 36];
  for (let f = Z.y0 + ri(30, 50); f < Z.y1; f += ri(G[0], G[1])) LV.push(f);
  if (Z.en != null) {
    const k = LV.reduce((b, f, i) => (Math.abs(f - Z.en) < Math.abs(LV[b] - Z.en) ? i : b), 0);
    LV[k] = Z.en;
    LV.sort((a, b) => a - b);
    for (let i = LV.length - 1; i > 0; i--) LV[i] - LV[i - 1] < 34 && LV.splice(LV[i] === Z.en ? i - 1 : i, 1);
  }
  const segs = [], rooms = [];
  let N = 0;
  const bossX = Z.boss ?? W;
  // ── 갱도 구간 ──
  LV.forEach((f, i) => {
    const out = [];
    if (f === Z.en) out.push([0, W]);
    else {
      let x = ri(6, 50);
      while (x < W - 50) {
        const len = Math.min(W - 6 - x, ri(SG[0], SG[1]));
        len > 40 && out.push([x, Math.min(x + len, f > (Z.en ?? 9999) - 60 && f < (Z.en ?? 0) + 60 ? bossX - 8 : W - 6)]);
        x += len + ri(18, 64);
      }
      if ((i === 0 && Z.peak) || (i === LV.length - 1 && Z.deep)) {
        const px = (i === 0 ? Z.peak : Z.deep)[0];
        out.some(([a, b]) => a < px - 30 && b > px + 30) || out.push([px - 44, px + 44]);
      }
    }
    for (const [a, b] of out) {
      const gh = f === Z.en ? 12 : ri(9, 12), d = Z.pick((a + b) >> 1, f);
      K.air(a, f - gh, b, f), K.wall(a, f - gh, b, f, d.m);
      d.m === "wood" && posts(K, a, b, f, gh, ri);
      d.m === "brick" && K.mat(a - 2, f - gh - 2, b + 2, f + 2, "brick");
      // 갱도 바닥 높낮이: 가끔 한 단(4칸) 오르는 턱
      if (b - a > 140 && ri(0, 2) === 0) { const s = ri(a + 40, b - 60); K.rock(s, f - 4, s + ri(30, 50), f); }
    }
    segs.push(out);
  });
  // ── 방 ──
  LV.forEach((f, i) => {
    const gap = i === 0 ? 46 : f - LV[i - 1];
    for (const [a, b] of segs[i]) {
      let x = a + ri(2, 14);
      while (x < b - 24) {
        const d = Z.pick(x + 40, f);
        // 큰 홀: 위층까지 꿰뚫는다 (가끔)
        const big = i > 0 && gap < 76 && R() < (Z.big ?? 0.15);
        const w = Math.min(b - 3 - x, big ? ri(60, 120) : ri(RW[0], RW[1])), h = big ? gap + ri(6, 14) : Math.min(gap - 8, ri(RH[0], RH[1]));
        if (w < 20 || h < 10) break;
        const t = big ? "hall" : d.t[(N * 7 + i * 3 + ri(0, 2)) % d.t.length];
        room(K, x, x + w, f, h, d, t, ri, LV[i - 1]);
        const role0 = t === "hall" ? "arena" : ROLE[t], role = role0 === "treasure" && (((N + 1) * 2654435761) >>> 0) % 100 < 50 ? "arena" : role0;
        K.tag(x + 2, f - Math.min(h, 14), x + w - 2, f, role);
        K.struct(`${d.n} ${t === "hall" ? "큰 홀" : TN[t]} ${++N}`, role, x, f - h, x + w, f);
        rooms.push([x, x + w, f]);
        // 지하실: 갱도 밑으로 매달린 작은 방 (가끔)
        if (i < LV.length - 1 && R() < (Z.cellar ?? 0.2) && w > 30) {
          const ca = x + ri(4, w - 26), cb = ca + ri(18, 26), ch = Math.min(LV[i + 1] - f - 20, ri(10, 14));
          if (ch >= 8) {
            K.air(ca, f + 3, cb, f + 3 + ch), K.wall(ca, f + 3, cb, f + 3 + ch, d.m);
            K.air(ca + 2, f, ca + 5, f + 3), K.plank(ca + 2, ca + 5, f), K.ladder(ca + 3, f, f + 3 + ch);
            P(K, (ca + cb) >> 1, f + 3 + ch, pick(["p_crates", "p_urn", d.props[2]]), { s: 1 }), K.tag(ca, f + 3, cb, f + 3 + ch, "treasure");
            K.struct(`${d.n} 지하실 ${++N}`, "treasure", ca, f + 3, cb, f + 3 + ch);
          }
        }
        x += w + ri(4, 24);
      }
    }
  });
  // ── 탑 지구: 여러 층을 세로로 관통 (층마다 판 + 엇갈린 사다리) ──
  for (let k = 0; k < (Z.towers ?? 2); k++) {
    const i0 = ri(1, Math.max(1, LV.length - 5)), i1 = Math.min(LV.length - 1, i0 + ri(2, 4)), x0 = ri(60, bossX - 120), x1 = x0 + ri(30, 44), d = Z.pick(x0, LV[i0]);
    if (Z.en != null && LV[i0] < Z.en && LV[i1] > Z.en && x0 > bossX - 160) continue;
    K.air(x0, LV[i0] - 12, x1, LV[i1]), K.wall(x0, LV[i0] - 12, x1, LV[i1], d.m === "rock" ? "brick" : d.m);
    K.mat(x0 - 3, LV[i0] - 14, x1 + 3, LV[i1] + 2, d.m === "wood" ? "wood" : "brick");
    let side = 0;
    for (let y = LV[i1] - 16; y > LV[i0] - 4; y -= 16, side ^= 1) {
      const lx = side ? x0 + 4 : x1 - 6;
      K.rock(x0, y, x1, y + 2), K.mat(x0, y, x1, y + 2, d.m === "wood" ? "wood" : "brick"), K.air(lx - 1, y, lx + 2, y + 2);
      K.plank(lx - 1, lx + 2, y), K.ladder(lx, y, y + 16);
      ri(0, 2) === 0 && P(K, (x0 + x1) >> 1, y, pick(d.props), { s: 1 });
    }
    K.tag(x0 + 2, LV[i0] - 12, x1 - 2, LV[i0], "treasure");
    K.struct(`${d.n} 탑 ${++N}`, "treasure", x0, LV[i0] - 12, x1, LV[i1]);
  }
  // ── 층 사이 수직 갱 (겹치는 구간마다 1~3개, 멀면 승강기) ──
  for (let i = 1; i < LV.length; i++)
    for (const [a, b] of segs[i]) {
      const up = segs[i - 1].map(([c, e]) => [Math.max(a, c) + 6, Math.min(b, e) - 6]).filter(([c, e]) => e - c > 4);
      if (!up.length) {
        const [c, e] = segs[i - 1].reduce((p, q) => (Math.abs((q[0] + q[1]) / 2 - (a + b) / 2) < Math.abs((p[0] + p[1]) / 2 - (a + b) / 2) ? q : p));
        const x = Math.max(a + 6, Math.min(b - 6, c < a ? a + 8 : b - 8));
        K.air(Math.min(x, e) - 2, LV[i - 1] - 9, Math.max(x, c) + 3, LV[i - 1]);
        shaft(K, x, LV[i - 1], LV[i], ri);
        continue;
      }
      for (const [c, e] of up.slice(0, ri(1, 3))) shaft(K, ri(c, e), LV[i - 1], LV[i], ri);
    }
  // ── 위 연결 (지상 구역의 땅속: 지표에서 맨 위 층으로) ──
  if (Z.top) for (const x of Z.topX ?? [150, 500, 860]) { const s = Z.top(x); K.air(x - 3, s - 2, x + 3, s), K.air(x - 1, s, x + 2, LV[0]), K.plank(x - 1, x + 2, s), K.ladder(x, s, LV[0]); }
  // ── ▲ · ▼ · 입구 · 보스 방 ──
  if (Z.peak) { const [x] = Z.peak; K.air(x - 22, LV[0] - 18, x + 22, LV[0]), K.peak(x, LV[0]), K.tag(x - 20, LV[0] - 14, x + 20, LV[0], "rest", { safe: 1 }); }
  if (Z.deep) { const [x] = Z.deep, f = LV[LV.length - 1]; K.air(x - 40, f - 20, x + 40, f), K.deep(x, f), K.tag(x - 30, f - 14, x + 30, f, "rest", { safe: 1 }); }
  if (Z.en != null) {
    K.tag(2, Z.en - 12, 40, Z.en, "rest", { safe: 1 });
    bossX < W ? K.air(bossX, Z.en - 44, W, Z.en) : K.tag(984, Z.en - 12, 1022, Z.en, "rest", { safe: 1 });
  }
  // ── 레버 지름길: 위쪽 레버 → 입구 줄까지 큰 승강기 ──
  if (Z.en != null && LV[1] < Z.en) {
    const x = ri(300, Math.min(bossX, W) - 120), s = segs[1].find(([a, b]) => a < x - 10 && b > x + 14);
    if (s) (K.lever(x - 6, LV[1], `sc_${Z.seed}`), K.air(x, LV[1] - 6, x + 12, Z.en), K.lift(x + 1, x + 11, LV[1], Z.en, LV[1] - 10, `sc_${Z.seed}`, "up"));
  }
  Z.sig && Z.sig(K, { LV, segs, ri, R });
  return { LV, segs, rooms };
}

function posts(K, a, b, f, gh, ri) {
  for (let x = a + 6; x < b - 4; x += ri(14, 22)) K.wall(x, f - gh, x + 1, f, "stem");
}
function shaft(K, x, fu, fd, ri) {
  if (fd - fu > 120) return void (K.air(x - 4, fu - 8, x + 5, fd), K.lift(x - 3, x + 4, fu, fd, fu - 10));
  K.air(x - 1, fu, x + 2, fd), K.plank(x - 1, x + 2, fu);
  ri(0, 4) === 0 ? K.rope(x, fu - 3, fd) : K.ladder(x, fu, fd);
}

// 방 하나 [x0, x1) 바닥 f 높이 h, 짜임 t
export function room(K, x0, x1, f, h, d, t, ri, fUp) {
  const w = x1 - x0, cx = (x0 + x1) >> 1, pr = d.props;
  K.air(x0, f - h, x1, f), K.wall(x0, f - h, x1, f, d.m);
  d.m === "brick" && K.mat(x0 - 2, f - h - 2, x1 + 2, f + 2, "brick");
  const again = (tt) => room(K, x0, x1, f, h, d, tt, ri, fUp);
  switch (t) {
    case "hall": { // 위층 갱도 높이에 양쪽 회랑 + 가운데 큰 기둥 (위아래 층이 한 방에서 만난다)
      const g = fUp ?? f - 30;
      K.plank(x0, x0 + Math.min(24, w >> 2), g), K.plank(x1 - Math.min(24, w >> 2), x1, g);
      K.ladder(x0 + 4, g, f), K.ladder(x1 - 5, g, f);
      for (let x = x0 + 16; x < x1 - 14; x += ri(18, 26)) K.wall(x, f - h, x + 3, f, "stem");
      P(K, cx, f, pr[0]), P(K, x0 + 10, g, pr[1]), P(K, x1 - 10, g, pr[2]);
      break;
    }
    case "pillars":
      for (let x = x0 + 8; x < x1 - 6; x += ri(10, 16)) K.wall(x, f - h, x + 2, f, "stem");
      P(K, cx, f, pr[0]), P(K, x0 + 6, f, pr[1]);
      break;
    case "balcony": {
      if (h < 20) return again("workshop");
      const bf = f - Math.min(10, (h >> 1) + 1), right = ri(0, 1), a = right ? cx : x0, b = right ? x1 : cx;
      K.plank(a, b, bf), K.ladder(right ? a + 2 : b - 3, bf, f);
      P(K, (a + b) >> 1, bf, pr[1]), P(K, right ? x0 + 8 : x1 - 8, f, pr[0]);
      break;
    }
    case "pit": {
      const pw = Math.min(14, (w >> 1) - 2);
      K.air(cx - pw, f, cx + pw, f + 10), K.crumble(cx - pw, cx + pw, f), K.ladder(cx + pw - 2, f, f + 10);
      P(K, cx - 2, f + 10, "p_urn"), K.tag(cx - pw, f, cx + pw, f + 10, "treasure");
      break;
    }
    case "cistern":
      K.air(x0 + 4, f, x1 - 4, f + 6), K.water(x0 + 4, f, x1 - 4, f + 6), K.plank(cx - 4, cx + 4, f);
      P(K, x0 + 2, f, pr[0]);
      break;
    case "vault": {
      const vx = ri(0, 1) ? x1 - 14 : x0 + 12;
      K.rock(vx, f - h, vx + 2, f), K.crack(vx, f - 8, vx + 2, f);
      const ia = vx < cx ? x0 : vx + 2, ib = vx < cx ? vx : x1;
      P(K, (ia + ib) >> 1, f, "p_crates", { s: 1 }), K.tag(ia, f - 8, ib, f, "treasure");
      P(K, vx < cx ? x1 - 8 : x0 + 8, f, pr[2]);
      break;
    }
    case "ore":
      if (h > 20) K.rock(cx - 5, f - h, cx + 5, f - 11), d.m !== "rock" && K.mat(cx - 5, f - h, cx + 5, f - 11, d.m);
      P(K, cx - 10, f, pr[1], { s: 2 }), P(K, cx + 10, f, pr[0]);
      break;
    case "steps": {
      // 가운데로 오르고 다시 내려가는 단 (양쪽 끝은 갱도 바닥 높이 그대로)
      const n = Math.max(1, Math.min(3, Math.floor((h - 12) / 4))), sw = Math.max(4, Math.floor(w / (2 * n + 2)));
      for (let k = 1; k <= n; k++) {
        const a = x0 + sw * k, b = x1 - sw * k;
        if (b - a < 6) break;
        K.rock(a, f - 4 * k, b, f - 4 * (k - 1)), d.m !== "rock" && K.mat(a, f - 4 * k, b, f, d.m);
      }
      P(K, cx, f - 4 * n, pr[2]);
      break;
    }
    case "bunks":
      for (let x = x0 + 4; x < x1 - 10; x += ri(14, 18)) K.plank(x, x + 10, f - 7);
      P(K, x0 + 6, f, "p_crates"), P(K, x1 - 6, f, "p_lamp");
      break;
    case "shrine":
      K.rock(cx - 10, f - 3, cx + 10, f), d.m !== "rock" && K.mat(cx - 10, f - 3, cx + 10, f, d.m);
      P(K, cx, f - 3, "p_altar"), P(K, cx - 8, f - 3, "p_candles"), K.heal(cx - 3, cx + 3, f - 7, f - 3);
      break;
    case "workshop":
      if (h >= 18) (K.plank(x0, x0 + (w >> 1), f - 9), K.ladder(x0 + (w >> 1) - 2, f - 9, f), P(K, x0 + (w >> 2), f - 9, "p_crates"));
      P(K, cx + 6, f, pr[1]), P(K, x1 - 6, f, pr[0]);
      break;
    case "collapse":
      K.rock(cx - 8, f - 2, cx + 6, f), K.rock(cx - 4, f - 3, cx + 2, f - 2), K.fall(cx + 10, cx + 14, f - h + 1, f);
      P(K, cx, f - 3, "p_rubble"), P(K, x0 + 6, f, pr[0]);
      break;
    case "tower": {
      if (h < 24) return again("pillars");
      const a = cx - 10, b = cx + 10;
      K.plank(a, b, f - 9), K.plank(a, b, f - 18), K.ladder(a + 2, f - 18, f);
      K.wall(a, f - 20, a + 1, f, "stem"), K.wall(b - 1, f - 20, b, f, "stem");
      P(K, cx, f - 18, "p_crates", { s: 1 }), K.tag(a, f - 30, b, f - 18, "treasure");
      break;
    }
    case "split": { // 가운데 벽으로 두 칸 (벽 밑은 기어서 지나간다)
      if (w < 40) return again("steps");
      K.rock(cx - 1, f - h, cx + 2, f - 7);
      P(K, x0 + (w >> 2), f, pr[0]), P(K, x1 - (w >> 2), f, pr[2]);
      break;
    }
    case "ell": { // 한쪽만 높게 솟은 ㄱ자 방 (높은 쪽에 판)
      if (h < 22) return again("collapse");
      const right = ri(0, 1), a = right ? x0 : cx, b = right ? cx : x1;
      K.rock(a, f - h, b, f - 12);
      const pa = right ? cx : x0, pb = right ? x1 : cx;
      K.plank(pa, pb, f - 12), K.ladder(right ? pb - 3 : pa + 2, f - 12, f);
      P(K, (pa + pb) >> 1, f - 12, pr[1]);
      break;
    }
    case "cage": // 천장에 매단 우리와 사슬
      for (let x = x0 + 8; x < x1 - 8; x += ri(14, 20)) P(K, x, f - h, ri(0, 1) ? "p_cage" : "p_chain");
      P(K, cx, f, "p_bones");
      break;
    case "library": // 책장 줄 + 다락
      for (let x = x0 + 6; x < x1 - 6; x += 12) P(K, x, f, "p_shelf");
      h >= 18 && (K.plank(x0 + 4, x1 - 4, f - 10), K.ladder(x1 - 7, f - 10, f));
      break;
  }
}
