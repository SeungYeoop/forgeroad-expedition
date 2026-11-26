// 동굴 깎기 도구 (v2): 발판을 놓는 대신 "암반 덩어리 + 빈 공간 장(場)"을 만들고 경계를 다듬어 동굴 자체를 만든다
//   1) 장 D(x,y): 손으로 정한 방(타원 덩이)·굴(굵기가 변하는 선)·작은 벽감을 비틀린 잡음과 합친다 (D > 0 = 빈 곳)
//   2) 세포 자동자로 경계를 2~3번 다듬어 자연스러운 바위 윤곽
//   3) 방마다 바닥을 정해진 높이로 고른다 (평평 · 계단식 · 웅덩이) → 플레이하기 편한 바닥
//   4) 높은 방은 엇갈린 바위 턱(1단 점프 간격)으로 오른다 · 물 웅덩이는 낮은 곳부터 채운다
import { fbm } from "./archi_sky.js";

export function cavefield(K, S) {
  const { NX, NY } = K;
  const D = new Float32Array(NX * NY).fill(-1);
  const add = (x0, y0, x1, y1, f) => {
    for (let y = Math.max(2, y0 | 0); y < Math.min(NY - 2, y1); y++)
      for (let x = Math.max(1, x0 | 0); x < Math.min(NX - 1, x1); x++) {
        const v = f(x, y), i = y * NX + x;
        v > D[i] && (D[i] = v);
      }
  };
  // 방: 타원 덩이 (밑은 납작하게), 가장자리를 잡음으로 비튼다
  for (const c of S.rooms) {
    const s = c.s ?? (c.x * 7 + c.y) % 97, wob = c.wob ?? 0.32;
    add(c.x - c.rx - 8, c.y - c.ry - 8, c.x + c.rx + 8, c.y + c.ry + 8, (x, y) => {
      const dx = (x - c.x) / c.rx, dy = (y - c.y) / c.ry;
      return 1 - Math.hypot(dx, dy > 0 ? dy * 1.25 : dy) + (fbm(x / 13, y / 13, s) - 0.5) * wob * 2;
    });
  }
  // 굴: 점 목록 + 굵기 r (높이 = 2r 남짓), 굵기가 조금씩 출렁인다
  for (const t of S.tunnels) {
    const r = t.r ?? 5, s = t.s ?? 11;
    for (let k = 0; k + 1 < t.p.length; k++) {
      const [ax, ay] = t.p[k], [bx, by] = t.p[k + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      add(Math.min(ax, bx) - r - 6, Math.min(ay, by) - r - 6, Math.max(ax, bx) + r + 6, Math.max(ay, by) + r + 6, (x, y) => {
        const u = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (L * L)));
        const px = ax + (bx - ax) * u, py = ay + (by - ay) * u;
        const rr = r * (0.85 + 0.3 * fbm(x / 20, y / 20, s));
        return 1 - Math.hypot(x - px, (y - py) * 1.15) / rr + (fbm(x / 9, y / 9, s + 3) - 0.5) * 0.4;
      });
    }
  }
  // 칸으로 옮기기 (테두리 3칸은 바위)
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) K.set(x, y, D[y * NX + x] > 0 && x > 2 && x < NX - 3 && y > 2 && y < NY - 3 ? -1 : 1);
  // 세포 자동자: 이웃 8칸 중 바위 5칸 이상 → 바위, 3칸 이하 → 빈 곳 (가는 가시·외톨이 구멍이 사라진다)
  for (let it = 0; it < (S.smooth ?? 2); it++) {
    const T = new Int8Array(NX * NY);
    for (let y = 1; y < NY - 1; y++)
      for (let x = 1; x < NX - 1; x++) {
        let n = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) (i || j) && K.get(x + i, y + j) === 1 && n++;
        T[y * NX + x] = n >= 5 ? 1 : n <= 3 ? -1 : K.get(x, y);
      }
    for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) K.set(x, y, T[y * NX + x]);
  }
  // 방 바닥 고르기
  for (const c of S.rooms) c.f != null && floor(K, c);
}

// 바닥: 방 너비 안에서 바닥을 c.f 높이로 (위로 튀어나온 바위는 깎고, 꺼진 곳은 채운다). c.steps = 계단식 단 높이
function floor(K, c) {
  const x0 = Math.round(c.x - c.rx * 0.92), x1 = Math.round(c.x + c.rx * 0.92);
  for (let x = x0; x <= x1; x++) {
    let f = c.f;
    if (c.steps) {
      const u = (x - x0) / Math.max(1, x1 - x0), n = c.stepN ?? 3;
      f = c.f - Math.round(Math.abs(Math.round(u * n) - (c.stepUp ? 0 : n / 2)) * c.steps);
    }
    // 이 줄의 빈 곳이 방 높이 안에 있을 때만 고른다 (벽 속은 건드리지 않는다)
    const top = Math.round(c.y - c.ry * 0.6);
    let air = false;
    for (let y = top; y < f + 6; y++) if (K.get(x, y) === -1) { air = true; break; }
    if (!air) continue;
    for (let y = f - (c.head ?? 9); y < f; y++) K.set(x, y, -1);
    for (let y = f; y < f + 4; y++) K.set(x, y, 1);
  }
  // 웅덩이: 바닥 가운데를 파고 물
  if (c.pool) {
    const a = Math.round(c.x - c.pool), b = Math.round(c.x + c.pool), d = c.poolD ?? 6;
    for (let x = a; x < b; x++) for (let y = c.f; y < c.f + d; y++) K.set(x, y, -1);
    K.water(a, c.f, b, c.f + d);
  }
}

// 높은 방의 엇갈린 바위 턱: 바닥 f에서 위로 gap칸씩, 좌우 번갈아 (가장자리를 잡음으로 다듬은 두께 3 바위)
export function ledges(K, c, o = {}) {
  // 턱끼리 가로로 겹치지 않게 (사이 틈 o.split칸): 아래 턱 끝에서 위 턱 끝으로 비스듬히 뛰어오른다
  const gap = o.gap ?? 8, w = o.w ?? 22, sp = o.split ?? 5, out = [];
  let i = 0;
  for (let y = c.f - gap; y > c.y - c.ry + (o.top ?? 10); y -= gap, i++) {
    const hw = Math.round(w / 2), cx = Math.round(c.x + (i % 2 ? 1 : -1) * (hw + sp / 2) + (i % 3) - 1);
    for (let x = cx - hw; x <= cx + hw; x++) {
      const e = Math.min(x - (cx - hw), cx + hw - x), th = e < 2 ? 2 : 3 + (e > 5 ? 1 : 0);
      for (let k = 0; k < th; k++) K.set(x, y + k, 1);
    }
    out.push([cx - hw, cx + hw, y]);
  }
  return out;
}

// 바닥 높이 찾기: (x, 위 y)에서 아래로 첫 바위
export const floorAt = (K, x, y) => {
  while (y < K.NY - 2 && K.get(x, y) !== 1) y++;
  return y;
};

// ═══ v3: 지도 전체 암반 장 → 잡음으로 거대한 빈 공간 → 세포 자동자로 경계 다듬기 → 작은 구멍 지우기 → 끊긴 동굴 잇기 ═══
//   o: { y0, y1 (동굴 줄 범위), th (빈 곳 문턱, 클수록 바위가 많다), sx, sy (큰 공동 크기), band (층 간격), seed, keep(x,y) 건드리지 않을 칸 }
export function noiseCaves(K, o = {}) {
  const { NX, NY } = K, s = o.seed ?? 5, y0 = o.y0 ?? 10, y1 = o.y1 ?? NY - 10;
  for (let y = y0; y < y1; y++)
    for (let x = 3; x < NX - 3; x++) {
      if (o.keep && o.keep(x, y)) continue;
      const a = fbm(x / (o.sx ?? 64), y / (o.sy ?? 24), s), b = fbm(x / 22, y / 15, s + 9);
      // 층: 가로로 긴 동굴 줄이 위아래로 쌓이게 (줄 사이는 두꺼운 암반)
      const band = Math.cos(((y + fbm(x / 140, y / 90, s + 3) * 70) / (o.band ?? 84)) * Math.PI * 2);
      const v = a * 0.58 + b * 0.27 + band * 0.15;
      K.get(x, y) === 1 && v > (o.th ?? 0.53) && K.set(x, y, -1);
    }
  // 경계 다듬기
  for (let it = 0; it < 4; it++) {
    const T = new Int8Array(NX * NY);
    for (let y = y0; y < y1; y++)
      for (let x = 3; x < NX - 3; x++) {
        if (o.keep && o.keep(x, y)) { T[y * NX + x] = K.get(x, y); continue; }
        let n = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) (i || j) && K.get(x + i, y + j) === 1 && n++;
        T[y * NX + x] = n >= 5 ? 1 : n <= 3 ? -1 : K.get(x, y);
      }
    for (let y = y0; y < y1; y++) for (let x = 3; x < NX - 3; x++) K.set(x, y, T[y * NX + x]);
  }
  // 빈 곳 덩어리 이름 붙이기
  const lab = new Int32Array(NX * NY).fill(-1), comps = [], q = new Int32Array(NX * NY);
  for (let i0 = 0; i0 < NX * NY; i0++) {
    if (lab[i0] >= 0 || K.get(i0 % NX, (i0 / NX) | 0) !== -1) continue;
    let h = 0, t = 0, sx = 0, sy = 0;
    q[t++] = i0, (lab[i0] = comps.length);
    while (h < t) {
      const k = q[h++], y = (k / NX) | 0, x = k - y * NX;
      sx += x, sy += y;
      for (const n of [k - 1, k + 1, k - NX, k + NX]) {
        const nx = n % NX, ny = (n / NX) | 0;
        if (n < 0 || n >= NX * NY || lab[n] >= 0 || K.get(nx, ny) !== -1) continue;
        lab[n] = comps.length, (q[t++] = n);
      }
    }
    comps.push({ n: t, cx: sx / t, cy: sy / t, cells: t < 80 ? Array.from(q.subarray(0, t)) : null });
  }
  // 아주 작은 구멍은 메운다
  comps.forEach((c, id) => c.cells && c.cells.forEach((k) => K.set(k % NX, (k / NX) | 0, 1)));
  // 남은 덩어리를 큰 것부터: 가장 가까운 이미 이어진 빈 곳까지 가로 굴(+ 세로 갱) 하나로 잇는다
  const big = comps.map((c, id) => ({ ...c, id })).filter((c) => !c.cells).sort((a, b) => b.n - a.n);
  const linked = new Set(big.length ? [big[0].id] : []);
  const isLinked = (x, y) => x > 2 && y > 2 && x < NX - 3 && y < NY - 3 && K.get(x, y) === -1 && linked.has(lab[y * NX + x]);
  const out = [];
  for (const c of big.slice(1)) {
    let best = null;
    const x0 = Math.round(c.cx), yc = Math.round(c.cy);
    for (let r = 4; r < 260 && !best; r += 3)
      for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, Math.round(r / 3)], [-r, Math.round(r / 3)], [r, -Math.round(r / 3)], [-r, -Math.round(r / 3)]])
        if (!best && isLinked(x0 + dx, yc + dy)) best = [x0 + dx, yc + dy];
    if (!best) continue;
    // 가로로 먼저 (높이 = 9칸), 그 다음 세로 갱 (사다리)
    const [bx, by] = best, xa = Math.min(x0, bx), xb = Math.max(x0, bx);
    K.air(xa, yc - 8, xb + 1, yc + 1);
    if (Math.abs(by - yc) > 2) { const ya = Math.min(yc, by), yb = Math.max(yc, by); K.air(bx - 1, ya - 2, bx + 2, yb + 1), out.push([bx, ya, yb]); }
    linked.add(c.id);
  }
  return out; // 세로 갱 (사다리 놓을 자리)
}
// 키 큰 빈 기둥(세로 빈 칸 > tall)마다 엇갈린 바위 턱을 자동으로 (1단 점프 간격)
export function autoLedges(K, o = {}) {
  const { NX, NY } = K, tall = o.tall ?? 22, gap = o.gap ?? 8, step = o.step ?? 26, out = [];
  for (let x = 12; x < NX - 12; x += step)
    for (let y = o.y0 ?? 10; y < (o.y1 ?? NY - 10); ) {
      if (K.get(x, y) !== -1) { y++; continue; }
      let e = y;
      while (e < NY - 3 && K.get(x, e) === -1) e++;
      if (e - y > tall) {
        let i = 0;
        for (let f = e - gap; f > y + 8; f -= gap, i++) {
          const cx = x + (i % 2 ? 7 : -7), hw = 6 + (i % 3);
          let ok = true;
          for (let k = cx - hw; k <= cx + hw; k++) if (K.get(k, f - 6) !== -1) ok = false;
          if (!ok) continue;
          for (let k = cx - hw; k <= cx + hw; k++) for (let j = 0; j < 3; j++) K.set(k, f + j, 1);
          out.push([cx - hw, cx + hw, f]);
        }
      }
      y = e;
    }
  return out;
}

// ═══ v4: 높은 공동을 자연 지층 바닥으로 나눈다 (턱을 찍지 않는다) ═══
//   지층 줄 yS(x) = 줄마다 기준 높이 + 부드러운 잡음. 빈 기둥이 maxH보다 길면 그 기둥이 지나는 지층 줄에 두께 4~6 바위
//   지층 바닥은 군데군데 꺼져 있다 (구멍) → 구멍 가장자리에 밧줄을 내려 위아래 층을 잇는다
export function strata(K, o = {}) {
  const { NX, NY } = K, gapY = o.gap ?? 26, maxH = o.maxH ?? 20, s = o.seed ?? 41, holes = [];
  const lines = [];
  for (let b = (o.y0 ?? 20) + gapY; b < (o.y1 ?? NY - 20); b += gapY) lines.push(b);
  const yS = (b, x) => Math.round(b + (fbm(x / 90, b / 50, s) - 0.5) * 16 + (fbm(x / 23, b, s + 5) - 0.5) * 4);
  for (let x = 4; x < NX - 4; x++) {
    if (o.keep && o.keep(x, 0)) continue;
    for (const b of lines) {
      const y = yS(b, x);
      if (o.keep && o.keep(x, y)) continue;
      // 이 칸이 긴 빈 기둥 속인가
      let up = y, dn = y;
      if (K.get(x, y) !== -1) continue;
      while (up > 2 && K.get(x, up - 1) === -1) up--;
      while (dn < NY - 3 && K.get(x, dn + 1) === -1) dn++;
      if (dn - up < maxH || y - up < 9 || dn - y < 9) continue;
      // 꺼진 구멍 (잡음이 높은 곳)
      if (fbm(x / 11, b / 7, s + 9) > (o.hole ?? 0.7)) { holes.push([x, y, dn]); continue; }
      const th = 4 + Math.round(fbm(x / 15, b / 9, s + 2) * 3);
      for (let k = 0; k < th; k++) K.set(x, y + k, 1);
    }
  }
  // 구멍 묶음마다 가장자리 하나에 밧줄 (위 지층 바닥 → 아래 바닥)
  const ropes = [];
  holes.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (let i = 0; i < holes.length; ) {
    let j = i;
    while (j + 1 < holes.length && holes[j + 1][1] === holes[i][1] && holes[j + 1][0] - holes[j][0] <= 2) j++;
    const w = holes[j][0] - holes[i][0] + 1;
    if (w >= 3) {
      const x = holes[i][0] + 1;
      let fd = holes[i][1] + 1;
      while (fd < NY - 3 && K.get(x, fd) !== 1) fd++;
      K.rope(x, holes[i][1] - 3, fd), ropes.push([x, holes[i][1], fd]);
    }
    i = j + 1;
  }
  return ropes;
}
