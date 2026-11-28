// 맵 어색한 곳 검사 함수 (mapaudit.mjs · auditshot.mjs가 쓴다)
import { upChunk, downChunk } from "../src/forge/zones.js";
import { SPEC, HEAD } from "../src/forge/natgen.js";

const CLIMB = new Set([SPEC.ladder, SPEC.rope, SPEC.vine]);
const WATER = new Set([SPEC.water, SPEC.curL, SPEC.curR]);

export function audit(P) {
  const { F, WP, HP } = P;
  const solid = (x, y) => y >= HP || x < 0 || x >= WP || (y >= 0 && F.solid(x, y));
  const air = (x, y) => !solid(x, y);
  const inWater = (x, y) => P.spec.some((r) => WATER.has(r.t) && x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
  // 장치로 따로 그리는 발판(나무판 1·구름 2·무너지는 판 13·도개교 21)은 장에서 빠져 있다 — 밟을 수 있는 면으로 본다
  const PLAT = P.spec.filter((r) => r.t === 1 || r.t === 2 || r.t === 13 || r.t === 21);
  const platAt = (x, y) => PLAT.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 - 1 && y < r.y1);
  const foot = (x, y) => solid(x, y) || platAt(x, y);
  // 몸(폭 10, 키 HEAD)이 서는 자리: 발밑 세 점이 바위(또는 발판), 몸 상자가 공기
  const stand = (x, y) => {
    if (!(foot(x, y + 1) && foot(x - 4, y + 1) && foot(x + 4, y + 1))) return !1;
    for (let yy = y - 2; yy > y - HEAD; yy -= 4) for (const dx of [-5, 0, 5]) if (solid(x + dx, yy)) return !1;
    return !0;
  };
  // (ax,ay) → (bx,by) 몸 높이 줄이 막히지 않았나 (가로 이동)
  const clearRow = (ax, bx, y) => {
    const s = Math.sign(bx - ax) || 1;
    for (let x = ax; s > 0 ? x <= bx : x >= bx; x += s * 3) if (solid(x, y)) return !1;
    return !0;
  };
  const out = { ladder: [], water: [], exit: [], wall: [], prop: [], carve: (P.polishReverted & 2 ? [] : P.carves ?? []).map((c) => ({ k: "carve", ...c })), link: (P.links ?? []).map((l) => ({ k: "link", ...l })), fixed: (P.spec ?? []).filter((r) => r.nc).map((r) => ({ k: "deco", x: (r.x0 + r.x1) >> 1, y: r.y0, h: r.y1 - r.y0, t: r.t })) };

  // ── 사다리·밧줄·덩굴 ──
  for (const r of P.spec) {
    if (!CLIMB.has(r.t) || r.nc) continue; // nc = 그림만 남긴 장식 (탈 수 없음)
    const cx = Math.round((r.x0 + r.x1) / 2), nm = r.t === SPEC.ladder ? "사다리" : r.t === SPEC.rope ? "밧줄" : "덩굴";
    // 묻힘: 가운데 줄 25% 넘게 바위
    let sol = 0, n = 0;
    for (let y = r.y0 + 4; y < r.y1 - 4; y += 4) (n++, solid(cx, y) && sol++);
    if (n && sol / n > 0.25) out.ladder.push({ k: "buried", what: nm, x: cx, y: Math.round((r.y0 + r.y1) / 2), len: r.y1 - r.y0 });
    // 위 끝: 꼭대기에서 살짝 뛰어(약 40px) 옆이나 위 바닥에 올라설 수 있나
    //   (사다리에서 뛰어 닿는 곳까지: 옆 ±100px, 위 80px — 생성기 fixClimbs와 같은 기준)
    const clearLine = (ax, ay, bx, by) => {
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
      for (let i = 0; i <= n; i++) if (solid(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return !1;
      return !0;
    };
    let top = !1;
    for (let y = r.y0 - 80; y <= r.y0 + 40 && !top; y += 2)
      for (let dx = 0; dx <= 100 && !top; dx += 3)
        for (const x of dx ? [r.x0 - dx, r.x1 + dx] : [cx]) if (stand(x, y) && (clearRow(cx, x, Math.min(y, r.y0) - 12) || clearLine(cx, r.y0 - 14, x, y - 14))) top = !0;
    // 꼭대기 위가 트여 있으면(천장 없이 계속 공기) 올라선 뒤 옆으로 갈 수 있는 곳이 있어야 한다 — 위가 바로 천장이면 막힘
    if (!top) out.ladder.push({ k: "top", what: nm, x: cx, y: r.y0, ceil: solid(cx, r.y0 - 30) ? 1 : 0 });
    // 아래 끝: 바닥에 닿거나 근처 바닥으로 내려설 수 있나, 아니면 떨어져서 바닥에 닿나
    let bot = !1;
    for (let y = r.y1 - 40; y <= r.y1 + 44 && !bot; y += 2)
      for (let x = r.x0 - 30; x <= r.x1 + 30 && !bot; x += 3) if (stand(x, y) && clearRow(cx, x, Math.max(y, r.y1) - 12)) bot = !0;
    if (!bot) {
      let y = r.y1;
      while (y < HP && air(cx, y)) y += 4;
      const fall = y - r.y1;
      // 400px 넘게 떨어지거나 끝까지 바닥이 없으면 문제
      (fall > 400 || y >= HP) && out.ladder.push({ k: "bottom", what: nm, x: cx, y: r.y1, fall });
    }
  }

  // ── 물: 아래·양옆이 바위나 물이어야 한다 ──
  for (const r of P.spec) {
    if (!WATER.has(r.t)) continue;
    let leakB = 0, leakL = 0, leakR = 0, nb = 0, ns = 0;
    for (let x = r.x0 + 2; x < r.x1 - 1; x += 4) (nb++, !solid(x, r.y1 + 2) && !inWater(x, r.y1 + 2) && leakB++);
    for (let y = r.y0 + 4; y < r.y1 - 1; y += 4) {
      ns++;
      !solid(r.x0 - 2, y) && !inWater(r.x0 - 2, y) && leakL++;
      !solid(r.x1 + 1, y) && !inWater(r.x1 + 1, y) && leakR++;
    }
    if (leakB || leakL || leakR) out.water.push({ x: Math.round((r.x0 + r.x1) / 2), y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0, bottom: leakB && `${leakB}/${nb}`, left: leakL && `${leakL}/${ns}`, right: leakR && `${leakR}/${ns}` });
  }

  // ── 위아래 문 높이 ──
  const A = P.A;
  if (A) {
    let topY = 1e9, botY = -1;
    for (let i = 0; i < A.NN; i++) if (A.reach[i]) (topY = Math.min(topY, A.nY[i]), (botY = Math.max(botY, A.nY[i])));
    const z = P.z;
    // 문은 위/아래 구역과 맞닿은 조각(512px) 안에만 놓인다 — 그 기둥 안에서 가장 높은/낮은 설 자리와도 비교
    const colExt = (cx) => {
      let t = 1e9, b = -1;
      for (let i = 0; i < A.NN; i++) if (A.reach[i] && Math.abs(A.nC[i] * 8 + 4 - cx) < 256) (t = Math.min(t, A.nY[i]), (b = Math.max(b, A.nY[i])));
      return [t, b];
    };
    if (upChunk(z) >= 0 && P.peak) {
      const [ct] = colExt(P.upX);
      out.exit.push({ k: "up", x: Math.round(P.peak.x), y: Math.round(P.peak.y), gap: Math.round(P.peak.y - topY), colGap: Math.round(P.peak.y - ct), topY, colTop: ct });
    }
    if (downChunk(z) >= 0 && P.deep) {
      const [, cb] = colExt(P.downX);
      out.exit.push({ k: "down", x: Math.round(P.deep.x), y: Math.round(P.deep.y), gap: Math.round(botY - P.deep.y), colGap: Math.round(cb - P.deep.y), botY, colBot: cb });
    }
  }

  // ── 뒷벽: 8px 칸 ──
  const G = 8, GW = Math.ceil(WP / G), GH = Math.ceil(HP / G);
  const WL = new Uint8Array(GW * GH), AIR = new Uint8Array(GW * GH), OUTS = new Uint8Array(GW * GH);
  // 1 = 건물·바위 뒷벽, 2 = 나무 장식(잎 덩어리 leaf·줄기 stem — 하늘에 나와 있는 게 정상)
  for (const w of P.walls ?? []) {
    const v = w.m === "leaf" || w.m === "stem" ? 2 : 1;
    const x0 = Math.max(0, Math.floor(w.x0 / G)), x1 = Math.min(GW, Math.ceil(w.x1 / G)), y0 = Math.max(0, Math.floor(w.y0 / G)), y1 = Math.min(GH, Math.ceil(w.y1 / G));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) WL[y * GW + x] === 1 || (WL[y * GW + x] = v);
  }
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) AIR[y * GW + x] = air(x * G + 4, y * G + 4) ? 1 : 0;
  // 바깥 = 맨 윗줄(하늘)과 이어진 공기 (동굴 구역은 바깥이 없다)
  if (P.kind !== "cave") {
    const st = [];
    for (let x = 0; x < GW; x++) AIR[x] && (OUTS[x] = 1, st.push(x));
    while (st.length) {
      const k = st.pop(), x = k % GW, y = (k / GW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue;
        const q = Y * GW + X;
        AIR[q] && !OUTS[q] && ((OUTS[q] = 1), st.push(q));
      }
    }
  }
  // 하늘에 나온 뒷벽 덩어리 / 실내 구멍 덩어리 (이웃끼리 묶어 크기와 가운데)
  const blobs = (pred) => {
    const seen = new Uint8Array(GW * GH), res = [];
    for (let k = 0; k < GW * GH; k++) {
      if (seen[k] || !pred(k)) continue;
      const st = [k];
      seen[k] = 1;
      let n = 0, sx = 0, sy = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      while (st.length) {
        const q = st.pop(), x = q % GW, y = (q / GW) | 0;
        n++, (sx += x), (sy += y), (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue;
          const r = Y * GW + X;
          !seen[r] && pred(r) && ((seen[r] = 1), st.push(r));
        }
      }
      res.push({ n, x: Math.round((sx / n) * G), y: Math.round((sy / n) * G), w: (x1 - x0 + 1) * G, h: (y1 - y0 + 1) * G });
    }
    return res;
  };
  // 튀어나온 뒷벽: 바깥 공기 위의 건물·바위 뒷벽 중 위(지붕)나 아래(바닥)로 96px 안에 바위가 없는 칸 — 지붕 위로 솟거나 바닥 밑으로 처진 벽
  const SOL = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH ? 0 : !AIR[y * GW + x];
  const loose = (k) => {
    if (WL[k] !== 1 || !OUTS[k]) return !1;
    const x = k % GW, y = (k / GW) | 0;
    let up = !1, dn = !1;
    for (let d = 1; d <= 12 && !(up && dn); d++) (up ||= SOL(x, y - d)), (dn ||= SOL(x, y + d));
    return !up || !dn;
  };
  // (지붕 위·바닥 밑 뒷벽은 잘라 본 건물 그림이라 정상인 경우가 많아 세지 않는다 — 참고용으로만 남김)
  void loose;
  // 벽 구멍: 뒷벽이 없는 공기 덩어리인데 둘레가 거의(75%+) 건물·바위 뒷벽 — 벽 한가운데 뚫린 곳
  // 동굴 구역은 구멍 너머에 구역 배경 그림이 보이므로 세지 않는다
  if (P.kind !== "cave") {
    const seen = new Uint8Array(GW * GH);
    for (let k0 = 0; k0 < GW * GH; k0++) {
      if (seen[k0] || !AIR[k0] || WL[k0]) continue;
      const st = [k0], cells = [];
      seen[k0] = 1;
      let ring = 0, ringW = 0, big = !1;
      while (st.length) {
        const q = st.pop();
        cells.push(q);
        if (cells.length > 600) big = !0;
        const x = q % GW, y = (q / GW) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue;
          const r = Y * GW + X;
          if (AIR[r] && !WL[r]) !seen[r] && ((seen[r] = 1), st.push(r));
          else if (AIR[r]) (ring++, WL[r] === 1 && ringW++);
        }
      }
      if (big || cells.length < 3 || ring < 8 || ringW / ring < 0.75) continue;
      let sx = 0, sy = 0;
      for (const q of cells) (sx += q % GW), (sy += (q / GW) | 0);
      out.wall.push({ k: "hole", n: cells.length, x: Math.round((sx / cells.length) * G), y: Math.round((sy / cells.length) * G), w: 48, h: 48 });
    }
  }

  // ── 소품 받침 ──
  // 무너지는 판(13)·도개교(21) 위 소품은 판이 움직이면 허공에 남는다 → "moving"
  const MOV = P.spec.filter((r) => r.t === 13 || r.t === 21);
  const movAt = (x, y) => MOV.some((r) => x >= r.x0 - 2 && x < r.x1 + 2 && y >= r.y0 - 4 && y < r.y1 + 4);
  for (const p of P.props ?? []) {
    if (p.bg || p.ext) continue;
    if (p.hang) {
      !solid(p.x, p.y + 2) && !solid(p.x, p.y - 2) && !platAt(p.x, p.y + 2) && out.prop.push({ k: "hang", what: p.k, x: p.x, y: p.y });
      continue;
    }
    if (movAt(p.x, p.y + 1)) out.prop.push({ k: "moving", what: p.k, x: p.x, y: p.y });
    else if (!foot(p.x, p.y + 1) && !foot(p.x, p.y + 4) && !foot(p.x, p.y - 2)) out.prop.push({ k: "floor", what: p.k, x: p.x, y: p.y });
  }
  return out;
}

