// ══════════════════════════════════════════════════════════════
// 아이언베인 v5 「녹슨 쇠맥의 광산 도시」 — 각진 갱도·방 구조 (구불구불한 자연 동굴 없음 · 사선 비탈 없음)
//   암반을 높이가 제각각인 수평 갱도 층 14줄로 깎고, 층마다 크기·속 짜임이 다른 방을 줄줄이 붙인다. 층 사이는 수직 갱(사다리·승강기·밧줄)
//   지구(위치)마다 재질·방 종류·이름이 다르다:
//     옛 갱도(서북, 나무 버팀목) · 갱구 마을(위 가운데, ▲) · 코볼트 요새(동북, 벽돌) · 수몰 갱(서, 물) · 결정 굴(동, 광맥)
//     광차 대로(줄 600) · 녹슨 작업장(서남, 벽돌) · 용광로 지구(동남, 벽돌·증기) · 웜 굴(맨 아래, 무너진 바위, ▼)
//   방 속 짜임 12가지: 기둥 홀 · 발코니 방 · 구덩이 다리 · 물탱크 · 금 간 벽 금고 · 광맥 기둥 · 계단 방 · 침상 방 · 사당 · 작업장 · 무너진 방 · 망루 방
// ══════════════════════════════════════════════════════════════
import { rng } from "./noise.js";

const EN = 600, W = 1024;
const LV = [120, 190, 262, 334, 404, 474, 540, EN, 670, 742, 812, 882, 952, 1012];
const P = (K, x, f, k, o) => K.prop(x, f, k, o);

const D = {
  old: { n: "옛 갱도", m: "wood", t: ["collapse", "pillars", "bunks", "pit", "vault", "steps", "workshop"], props: ["p_rubble", "p_cart", "p_chain"] },
  town: { n: "갱구 마을", m: "wood", t: ["workshop", "shrine", "bunks", "balcony", "pillars"], props: ["p_lamp", "p_crates", "p_anvil"] },
  fort: { n: "코볼트 요새", m: "brick", t: ["pillars", "balcony", "vault", "bunks", "shrine", "tower", "pit"], props: ["p_banner", "p_rack", "p_brazier"] },
  flood: { n: "수몰 갱", m: "wood", t: ["cistern", "pit", "balcony", "vault", "cistern", "steps"], props: ["p_wheel", "p_crates", "p_chain"] },
  crys: { n: "결정 굴", m: "rock", t: ["ore", "steps", "vault", "ore", "collapse", "tower"], props: ["p_crystal", "p_ore", "p_crystal"] },
  road: { n: "광차 대로", m: "wood", t: ["workshop", "pillars", "bunks"], props: ["p_cart", "p_lamp", "p_crates"] },
  work: { n: "녹슨 작업장", m: "brick", t: ["workshop", "pillars", "vault", "balcony", "steps", "cistern"], props: ["p_anvil", "p_cart", "p_rack"] },
  forge: { n: "용광로 지구", m: "brick", t: ["ore", "workshop", "tower", "vault", "pillars", "pit"], props: ["p_brazier", "p_anvil", "p_drill"] },
  worm: { n: "웜 굴", m: "rock", t: ["collapse", "pit", "ore", "vault", "steps", "collapse"], props: ["p_bones", "p_skulls", "p_rubble"] },
};
function district(x, f) {
  if (f < 300) return x < 380 ? D.old : x < 640 ? D.town : D.fort;
  if (f < EN) return x < 512 ? D.flood : D.crys;
  if (f === EN) return D.road;
  if (f < 880) return x < 512 ? D.work : D.forge;
  return D.worm;
}
const TN = { pillars: "기둥 홀", balcony: "발코니 방", pit: "구덩이 다리", cistern: "물탱크", vault: "금고", ore: "광맥 기둥 방", steps: "계단 방", bunks: "침상 방", shrine: "사당", workshop: "작업장", collapse: "무너진 방", tower: "망루 방" };
const ROLE = { pillars: "arena", balcony: "arena", pit: "trap", cistern: "arena", vault: "treasure", ore: "treasure", steps: "arena", bunks: "rest", shrine: "rest", workshop: "arena", collapse: "arena", tower: "treasure" };

export function ironvein(K) {
  const R = rng(0x1e0a5);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const segs = [];
  let roomN = 0;
  // ── 층마다 갱도 구간 ──
  LV.forEach((f, i) => {
    const out = [];
    if (f === EN) out.push([0, W]);
    else {
      let x = ri(8, 40);
      while (x < W - 60) {
        const len = Math.min(W - 8 - x, ri(150, 420));
        out.push([x, x + len]);
        x += len + ri(24, 70);
      }
      if ((i === 0 || i === LV.length - 1) && !out.some(([a, b]) => a < 480 && b > 544)) out.push([470, 560]);
    }
    for (const [a, b] of out) {
      const gh = f === EN ? 12 : ri(9, 11), d = district((a + b) >> 1, f);
      K.air(a, f - gh, b, f), K.wall(a, f - gh, b, f, d.m);
      if (d.m === "wood") for (let x = a + 6; x < b - 4; x += ri(14, 22)) K.wall(x, f - gh, x + 1, f, "stem");
      if (d.m === "brick") K.mat(a - 2, f - gh - 2, b + 2, f + 2, "brick");
    }
    segs.push(out);
  });
  // ── 방: 갱도 위로 솟은 방을 줄줄이 ──
  LV.forEach((f, i) => {
    const maxH = i === 0 ? 40 : f - LV[i - 1] - 9;
    for (const [a, b] of segs[i]) {
      let x = a + ri(3, 18);
      while (x < b - 26) {
        const w = Math.min(b - 3 - x, ri(26, 96)), h = Math.min(maxH, ri(15, 34));
        if (w < 22) break;
        const d = district(x + (w >> 1), f), t = d.t[(roomN + i) % d.t.length];
        room(K, x, x + w, f, h, d, t, ri);
        K.tag(x + 2, f - Math.min(h, 14), x + w - 2, f, ROLE[t]);
        K.struct(`${d.n} ${TN[t]} ${++roomN}`, ROLE[t], x, f - h, x + w, f);
        x += w + ri(5, 26);
      }
    }
  });
  // ── 층 사이 수직 갱 ──
  for (let i = 1; i < LV.length; i++)
    for (const [a, b] of segs[i]) {
      const up = segs[i - 1].map(([c, d]) => [Math.max(a, c) + 6, Math.min(b, d) - 6]).filter(([c, d]) => d - c > 4);
      if (!up.length) {
        const [c, d] = segs[i - 1].reduce((p, q) => (Math.abs((q[0] + q[1]) / 2 - (a + b) / 2) < Math.abs((p[0] + p[1]) / 2 - (a + b) / 2) ? q : p));
        const x = Math.max(a + 6, Math.min(b - 6, c < a ? a + 8 : b - 8));
        K.air(Math.min(x, d) - 2, LV[i - 1] - 9, Math.max(x, c) + 3, LV[i - 1]);
        shaft(K, x, LV[i - 1], LV[i], ri);
        continue;
      }
      for (const [c, d] of up.slice(0, 2)) shaft(K, ri(c, d), LV[i - 1], LV[i], ri);
    }
  // ── ▲ · ▼ · 입구 ──
  K.air(490, LV[0] - 18, 534, LV[0]), K.wall(490, LV[0] - 18, 534, LV[0], "wood");
  K.peak(512, LV[0]);
  P(K, 500, LV[0], "p_bell"), P(K, 524, LV[0], "p_brazier"), K.tag(492, LV[0] - 14, 532, LV[0], "rest", { safe: 1 });
  K.air(470, LV[13] - 20, 560, LV[13]), K.deep(512, LV[13]);
  P(K, 490, LV[13], "p_skulls"), P(K, 536, LV[13], "p_bones", { s: 2 }), K.tag(480, LV[13] - 14, 550, LV[13], "rest", { safe: 1 });
  K.tag(2, EN - 12, 40, EN, "rest", { safe: 1 }), K.tag(984, EN - 12, 1022, EN, "rest", { safe: 1 });
  // ── 레버 지름길: 요새 위층 레버 → 대로까지 큰 승강기 ──
  K.lever(900, LV[1], "iv_short");
  K.air(940, LV[1] - 6, 952, EN), K.lift(941, 951, LV[1], EN, LV[1] - 10, "iv_short", "up");
}

function shaft(K, x, fu, fd, ri) {
  if (fd - fu > 140) return void (K.air(x - 4, fu - 8, x + 5, fd), K.lift(x - 3, x + 4, fu, fd, fu - 10));
  K.air(x - 1, fu, x + 2, fd), K.plank(x - 1, x + 2, fu);
  ri(0, 4) === 0 ? K.rope(x, fu - 3, fd) : K.ladder(x, fu, fd);
}

function room(K, x0, x1, f, h, d, t, ri) {
  const w = x1 - x0, cx = (x0 + x1) >> 1, pr = d.props;
  K.air(x0, f - h, x1, f), K.wall(x0, f - h, x1, f, d.m);
  d.m === "brick" && K.mat(x0 - 2, f - h - 2, x1 + 2, f + 2, "brick");
  switch (t) {
    case "pillars":
      for (let x = x0 + 8; x < x1 - 6; x += 12) K.wall(x, f - h, x + 2, f, "stem");
      P(K, cx, f, pr[0]), P(K, x0 + 6, f, pr[1]);
      break;
    case "balcony": {
      if (h < 20) return room(K, x0, x1, f, h, d, "workshop", ri);
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
      if (h > 20) K.rock(cx - 5, f - h, cx + 5, f - 11), K.mat(cx - 5, f - h, cx + 5, f - 11, "brick");
      P(K, cx - 10, f, "p_ore", { s: 2 }), P(K, cx + 10, f, pr[1]);
      break;
    case "steps": {
      const n = Math.max(1, Math.min(3, Math.floor((h - 12) / 4))), sw = Math.floor(w / (n + 2)), up = ri(0, 1);
      for (let k = 1; k <= n; k++) {
        const a = up ? x1 - sw * k : x0, b = up ? x1 : x0 + sw * k;
        K.rock(a, f - 4 * k, b, f - 4 * (k - 1));
        d.m !== "rock" && K.mat(a, f - 4 * k, b, f, d.m);
      }
      P(K, up ? x1 - 6 : x0 + 6, f - 4 * n, pr[2]);
      break;
    }
    case "bunks":
      for (let x = x0 + 4; x < x1 - 10; x += 16) K.plank(x, x + 10, f - 7);
      P(K, x0 + 6, f, "p_crates"), P(K, x1 - 6, f, "p_lamp");
      break;
    case "shrine":
      K.rock(cx - 10, f - 3, cx + 10, f), d.m !== "rock" && K.mat(cx - 10, f - 3, cx + 10, f, d.m);
      P(K, cx, f - 3, "p_altar"), P(K, cx - 8, f - 3, "p_candles"), K.heal(cx - 3, cx + 3, f - 7, f - 3);
      break;
    case "workshop":
      if (h >= 18) (K.plank(x0, x0 + (w >> 1), f - 9), K.ladder(x0 + (w >> 1) - 2, f - 9, f), P(K, x0 + (w >> 2), f - 9, "p_crates"));
      P(K, cx + 6, f, "p_anvil"), P(K, x1 - 6, f, pr[0]);
      break;
    case "collapse":
      K.rock(cx - 8, f - 2, cx + 6, f), K.rock(cx - 4, f - 3, cx + 2, f - 2), K.fall(cx + 10, cx + 14, f - h + 1, f);
      P(K, cx, f - 3, "p_rubble"), P(K, x0 + 6, f, pr[0]);
      break;
    case "tower": {
      if (h < 24) return room(K, x0, x1, f, h, d, "pillars", ri);
      const a = cx - 10, b = cx + 10;
      K.plank(a, b, f - 9), K.plank(a, b, f - 18), K.ladder(a + 2, f - 18, f);
      K.wall(a, f - 20, a + 1, f, "stem"), K.wall(b - 1, f - 20, b, f, "stem");
      P(K, cx, f - 18, "p_crates", { s: 1 }), K.tag(a, f - 30, b, f - 18, "treasure");
      break;
    }
  }
}
