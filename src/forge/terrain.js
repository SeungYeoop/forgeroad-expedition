// 지형 렌더러 (3D를 픽셀로 옮긴 느낌)
// - 돌 하나하나를 둥근 덩어리로 보고, 왼쪽 위 빛으로 5단계 팔레트 명암을 준다
// - 윗면은 두께 있는 풀판(앞으로 늘어진 입술 + 아래 그늘), 옆면은 테두리 빛/그늘, 밑면은 매달린 바위
// - 덩어리 안쪽으로 갈수록 어두워진다 (공기와의 거리)
// - 지하는 생물군계(이끼·종유석·자수정·심층암·용암)마다 재질과 장식이 다르다
import { H, sh, mix, pack, unpack, CAP, ramp, BIOMES, lvq } from "./terrpal.js";
import { pixFine, fineSlice, cropBand, BANDH } from "./terrfine.js";
import { finishRGBA } from "./paintfx.js";
export { BANDH };
export { BIOMES };
const T = 16, COLS = 32, PW = COLS * T;
// 그림판 하나 (전체 그림 + 밟을 수 있는 것만 담은 그림)
let ENTRY_N = 0;
function trackEntries(scene) {
  if (scene._frTerrainEntries) return scene._frTerrainEntries;
  const entries = new Set();
  scene._frTerrainEntries = entries;
  const cleanup = () => {
    // Phaser reuses the Scene object between runs, but each run has a new map.
    for (const [base, job] of PRE) if (job.scene === scene) {
      job.dead = !0;
      PRE.delete(base);
    }
    for (const [id, job] of WK_JOBS) if (job.scene === scene) {
      job.dead = !0;
      WK_JOBS.delete(id);
    }
    for (let i = FREE.length - 1; i >= 0; i--) if (FREE[i].scene === scene) FREE.splice(i, 1);
    for (const entry of entries) {
      scene.textures.remove(entry.key);
      scene.textures.remove(entry.keyF);
      scene.textures.remove(entry.keyW);
    }
    entries.clear();
    scene._frTerr?.clear();
    scene._frTerr = null;
    scene._frTerrainEntries = null;
    scene.events.off("shutdown", cleanup);
    scene.events.off("destroy", cleanup);
  };
  scene.events.once("shutdown", cleanup);
  scene.events.once("destroy", cleanup);
  return entries;
}
function makeEntry(scene, PH) {
  const id = `${ENTRY_N++}_${Math.random().toString(36).slice(2, 7)}`;
  const mk = (k) => {
    const cv = document.createElement("canvas");
    cv.width = PW;
    cv.height = PH;
    scene.textures.addCanvas(k, cv);
    return cv;
  };
  const cv = mk(`frterr_${id}`), cvF = mk(`frterrF_${id}`), cvW = mk(`frterrW_${id}`);
  const entry = { scene, key: `frterr_${id}`, keyF: `frterrF_${id}`, keyW: `frterrW_${id}`, cv, cvF, cvW, ctx: cv.getContext("2d"), ctxF: cvF.getContext("2d"), ctxW: cvW.getContext("2d") };
  trackEntries(scene).add(entry);
  return entry;
}
// ── 미리 그리기: 곧 불러올 구역을 여러 프레임에 나눠 그려 둔다 (불러오는 순간의 끊김 제거) ──
const PRE = new Map(), FREE = [];
// 작업 스레드: 픽셀 계산을 게임 밖에서 (구역마다 0.2초 가까이 걸리던 계산이 화면을 끊지 않게)
const MARGIN = 16;
let WK = null, WK_N = 0;
const WK_JOBS = new Map(), WK_LAT = [], WK_Q = [];
const NWK = Math.max(1, Math.min(3, ((typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 2) - 1));
// 지금 구역 소품 그림 목록: 스레드가 쉴 때 조금씩 미리 그려 둔다 (띠를 그릴 때 처음 보는 그림을 그리느라 늦지 않게)
const WARM = { key: null, list: [], pal: null };
export function warmProps(key, list, pal) {
  if (WARM.key === key) return;
  Object.assign(WARM, { key, list, pal: { top: pal?.top, rock: pal?.rock, acc: pal?.accent ?? 0xffe060 } });
  if (WK) for (const w of WK) w.warmI = 0;
  pump();
}
function onResult(w, ev) {
  w.busy = null;
  if (ev.data.warmDone) return void pump();
  const d = ev.data, j = WK_JOBS.get(d.id);
  j && WK_LAT.push(Math.round(performance.now() - j.t0));
  WK_JOBS.delete(d.id);
  pump();
  if (!j) return;
  if (j.dead) return void FREE.push(j.S);
  if (d.error) return void (j.gen = paintSteps(j.scene, j.S, j.ch, j.base, j.raw, j.region, j.band), (j.wait = !1));
  const img = new ImageData(new Uint8ClampedArray(d.img), PW, d.h);
  j.gen = (function* () {
    finishPut(j.S, img, new Uint8ClampedArray(d.front), new Uint8ClampedArray(d.wall));
    yield;
    // 불러오는 중 장면이 바뀌어 그림이 지워졌으면 건너뛴다
    const rf = (k) => { const t = j.scene.textures?.exists(k) && j.scene.textures.get(k); t?.refresh?.(); };
    rf(j.S.key);
    yield;
    rf(j.S.keyF);
    rf(j.S.keyW);
  })();
  j.wait = !1;
}
// 줄에서 급한 것(보이는 띠)부터, 쉬는 스레드에 하나씩. 버린 일은 보내지 않는다
function pump() {
  if (!WK) return;
  for (const w of WK) {
    if (w.busy) continue;
    let bi = -1;
    for (let i = 0; i < WK_Q.length; i++) if (bi < 0 || WK_Q[i].j.pri > WK_Q[bi].j.pri) bi = i;
    while (bi >= 0 && WK_Q[bi].j.dead) {
      const q = WK_Q.splice(bi, 1)[0];
      WK_JOBS.delete(q.id);
      FREE.push(q.j.S);
      bi = -1;
      for (let i = 0; i < WK_Q.length; i++) if (bi < 0 || WK_Q[i].j.pri > WK_Q[bi].j.pri) bi = i;
    }
    if (bi < 0) {
      // 할 일이 없으면 소품 그림 미리 그리기 (하나씩: 급한 띠가 오래 기다리지 않게)
      const i = w.warmI ?? 0;
      if (WARM.list.length && i < WARM.list.length) {
        w.warmI = i + 1;
        w.busy = { warm: 1 };
        w.postMessage({ warm: WARM.list.slice(i, i + 1), pal: WARM.pal });
      }
      continue;
    }
    const q = WK_Q.splice(bi, 1)[0];
    w.busy = q;
    q.j.t0 = performance.now();
    w.postMessage(q.msg, q.tr);
  }
}
function worker() {
  if (WK !== null) return WK;
  try {
    WK = [];
    for (let i = 0; i < NWK; i++) {
      const w = new Worker(new URL("./terrworker.js", import.meta.url), { type: "module" });
      w.busy = null;
      w.onmessage = (ev) => onResult(w, ev);
      w.onerror = () => {
        // 스레드가 죽으면 맡긴 일과 줄의 일을 화면 스레드에서 (드문 경우)
        WK = !1;
        for (const j of WK_JOBS.values()) (j.gen = paintSteps(j.scene, j.S, j.ch, j.base, j.raw, j.region, j.band)), (j.wait = !1);
        WK_JOBS.clear();
        WK_Q.length = 0;
      };
      WK.push(w);
    }
  } catch (e) {
    WK = !1;
  }
  return WK;
}
// 띠(band) 높이: 맨 아래 띠는 짧을 수 있다
const bandH = (ch, band) => Math.min(BANDH, Math.round(ch.grid.length / COLS) * T - band * BANDH);
export function prepaint(scene, ch, base, raw, region, band = 0, force = !1) {
  for (const [b, j] of PRE) j.scene !== scene && (PRE.delete(b), (j.dead = !0), j.wait || FREE.push(j.S));
  const pk = base + ":" + band;
  if (PRE.has(pk) || (!force && PRE.size >= 4)) return;
  const PH = bandH(ch, band);
  let S = FREE.pop();
  (!S || S.scene !== scene || S.cv.height !== PH) && (S = makeEntry(scene, PH));
  const j = { scene, S, ch, base, raw, region, band, gen: null, done: !1, wait: !1, pk, rt: null, pri: force ? 2 : 1 };
  PRE.set(pk, j);
  const W = worker();
  if (W) {
    const post = (msg, tr) => (WK_Q.push({ id: msg.id, j, msg, tr }), pump());
    const id = ++WK_N;
    j.wait = !0;
    j.t0 = performance.now();
    WK_JOBS.set(id, j);
    if (ch.fine) {
      // 자연 지형: 칸 대신 밀도장 조각(좌우 여유 포함)을 보낸다 — 옆 구역을 만들지 않는다
      const fine = fineSlice(ch, band);
      post({ id, fine, base, band, ch: { n: ch.grid.length, ug: ch.ug }, region: { pal: region.pal, theme: region.theme, look: region.look } }, [fine.d.buffer]);
      return;
    }
    const ROWS = Math.round(ch.grid.length / COLS), CW = COLS + MARGIN * 2;
    const codes = new Uint8Array(CW * ROWS);
    for (let c = 0; c < CW; c++) {
      const wc = base + c - MARGIN;
      for (let r = 0; r < ROWS; r++) codes[r * CW + c] = wc < 0 ? 1 : raw(wc, r);
    }
    post({ id, codes, CW, ROWS, margin: MARGIN, base, band, bandTop: band * BANDH, bandH: PH, ch: { n: ch.grid.length, ug: ch.ug, clouds: ch.clouds, pools: ch.pools }, region: { pal: region.pal, theme: region.theme, look: region.look } }, [codes.buffer]);
  } else j.gen = paintSteps(scene, S, ch, base, raw, region, band);
}
// 늦게 끝난 띠: 기다리던 그림판이 아직 같은 띠면 그린다
function lateDraw(j) {
  PRE.delete(j.pk);
  const rt = j.rt;
  j.rt = null;
  if (rt && rt._frJob === j) ((rt._frJob = null), rt.draw(j.S.key, 0, 0));
}
export function prepaintStep(ms = 5) {
  const t0 = performance.now();
  for (const j of [...PRE.values()]) {
    if (j.dead && !j.wait) {
      PRE.delete(j.pk);
      FREE.push(j.S);
      continue;
    }
    if (j.done) {
      j.rt && lateDraw(j);
      continue;
    }
    if (j.wait || !j.gen) continue;
    while (performance.now() - t0 < ms) if (j.gen.next().done) { j.done = !0; break; }
    j.done && j.rt && lateDraw(j);
    if (performance.now() - t0 >= ms) return;
  }
}
export function paintChunk(scene, rt, ch, base, raw, region, band = 0) {
  const PH = bandH(ch, band);
  const pool = (scene._frTerr = scene._frTerr ?? new Map());
  const pk = base + ":" + band;
  // 이 그림판이 다른 띠를 기다리던 중이면 그 일은 버린다 (결과가 와도 그리지 않는다)
  const prevJ = rt._frJob;
  if (prevJ) {
    rt._frJob = null;
    prevJ.rt = null;
    if (prevJ.pk !== pk) {
      prevJ.dead = !0;
      pool.get(rt) === prevJ.S && pool.delete(rt);
    }
  }
  // 버린(죽은) 같은 띠 일은 목록에서 빼고 새로 맡긴다
  const pd = PRE.get(pk);
  pd && pd.dead && (PRE.delete(pk), pd.wait || FREE.push(pd.S));
  let pre = PRE.get(pk);
  // 작업 스레드가 있으면 화면 스레드에서 그리지 않는다: 미리 그려 둔 게 없으면 지금 맡기고, 끝나면 그린다
  if (!pre && worker()) (prepaint(scene, ch, base, raw, region, band, !0), (pre = PRE.get(pk)));
  if (pre && pre.wait && !pre.dead && pre.scene === scene && pre.ch === ch && pre.S.cv.height === PH) {
    pre.pri = 2;
    const old = pool.get(rt);
    old && old !== pre.S && FREE.push(old);
    pool.set(rt, pre.S);
    pre.rt = rt;
    rt._frJob = pre;
    return;
  }
  if (pre) {
    PRE.delete(pk);
    if (pre.scene === scene && pre.ch === ch && pre.S.cv.height === PH && !pre.wait) {
      // 남은 단계가 있으면 마저 그린다
      if (!pre.done) for (;;) if (pre.gen.next().done) break;
      const old = pool.get(rt);
      old && old !== pre.S && FREE.push(old);
      pool.set(rt, pre.S);
      rt.draw(pre.S.key, 0, 0);
      return;
    }
    pre.dead = !0;
    pre.wait || FREE.push(pre.S);
  }
  let S = pool.get(rt);
  (!S || S.cv.height !== PH) && ((S = makeEntry(scene, PH)), pool.set(rt, S));
  const g = paintSteps(scene, S, ch, base, raw, region, band);
  while (!g.next().done);
  rt.draw(S.key, 0, 0);
}
// 띠 하나 그리기: 자연 지형은 띠(+여유)만 계산, 칸 지형은 전체를 계산해 띠만 잘라 쓴다
export function* bandPixels(ch, base, raw, region, band) {
  let r, oy;
  if (ch.fine) {
    const sl = fineSlice(ch, band);
    (r = cropBand(yield* pixFine(ch, base, region, sl), sl.cropTop, sl.cropH)), (oy = (sl.y0 ?? 0) + sl.cropTop);
  } else {
    const H2 = bandH(ch, band);
    (r = cropBand(yield* pixSteps(ch, base, raw, region), band * BANDH, H2)), (oy = band * BANDH);
  }
  // 거점 화풍 마무리 붓질 (작업 스레드와 같은 값)
  finishRGBA(r.img.data, r.img.width, r.img.height, { ox: base * 16, oy, clump: 0.28, mute: 0.16, tex: 0.06, lim: 70, despeck: 1 });
  finishRGBA(r.wall, r.img.width, r.img.height, { ox: base * 16, clump: 0.12, mute: 0.18, tex: 0.04, lim: 34, despeck: 1 });
  return r;
}
function* paintSteps(scene, S, ch, base, raw, region, band = 0) {
  const { img, front, wall } = yield* bandPixels(ch, base, raw, region, band);
  yield;
  finishPut(S, img, front, wall);
  yield;
  scene.textures.get(S.key).refresh();
  yield;
  scene.textures.get(S.keyF).refresh();
  scene.textures.get(S.keyW).refresh();
}
function finishPut(S, img, front, wall) {
  const PH = img.height;
  S.ctx.putImageData(img, 0, 0);
  S.ctxF.putImageData(new ImageData(front, PW, PH), 0, 0);
  S.ctxW.putImageData(new ImageData(wall, PW, PH), 0, 0);
}
// 픽셀 계산만 (DOM 없이 — 작업 스레드에서도 돈다)
export function* pixSteps(ch, base, raw, region) {
  const ROWS = Math.round(ch.grid.length / COLS), PH = ROWS * T;
  const P = region.pal ?? { rock: 0x9a8a7a, soil: 0x8a6a50, soilDark: 0x4a3428, top: 0x7cc04a, topHi: 0xc4f070, accent: 0xffe060 };
  const th = region.theme ?? "plains";
  const cap = CAP[th] ?? "grass";
  const img = new ImageData(PW, PH);
  const buf = new Uint32Array(img.data.buffer);
  const code = (c, r) => (r < 0 ? 0 : r >= ROWS ? 1 : base + c < 0 ? 1 : raw(base + c, r));
  const solid = (c, r) => { const v = code(c, r); return v === 1 || v === 6 || v === 7; };
  const solidish = (c, r) => { const v = code(c, r); return v === 1 || v === 4 || v === 5 || v === 6 || v === 7; };
  const plat = (c, r) => code(c, r) === 2;
  const put = (x, y, c) => x >= 0 && y >= 0 && x < PW && y < PH && (buf[y * PW + x] = pack(c));
  const empty = (x, y) => x >= 0 && y >= 0 && x < PW && y < PH && buf[y * PW + x] === 0;
  const get = (x, y) => unpack(buf[y * PW + x]);

  const ug = ch.ug ?? { top: ROWS - 40, biome: null };
  const BI = ug.biome ? BIOMES[ug.biome] : null;
  const clouds = new Set(ch.clouds ?? []);
  const isUG = (r) => r >= ug.top;

  // 공기와의 거리 (칸) — 덩어리 안쪽 어둠
  const dist = new Uint8Array(COLS * ROWS).fill(9);
  {
    const q = [];
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r < ROWS; r++) if (!solidish(c, r)) ((dist[r * COLS + c] = 0), q.push(c, r));
    for (let i = 0; i < q.length; i += 2) {
      const c = q[i], r = q[i + 1], d = dist[r * COLS + c];
      if (d >= 6) continue;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const cc = c + dc, rr = r + dr;
        if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) continue;
        const k = rr * COLS + cc;
        dist[k] > d + 1 && ((dist[k] = d + 1), q.push(cc, rr));
      }
    }
  }
  // ── 둥근 돌 (월드 좌표 셀룰러 잡음) ──
  const stone = (wx, wy, G) => {
    const gx = Math.floor(wx / G), gy = Math.floor(wy / G);
    let f1 = 1e9, f2 = 1e9, id = 0, dx1 = 0, dy1 = 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = gx + i, cy = gy + j;
        const px = (cx + 0.2 + H(cx, cy, 1) * 0.6) * G, py = (cy + 0.2 + H(cx, cy, 2) * 0.6) * G;
        const dx = wx - px, dy = (wy - py) * 1.2, d = dx * dx + dy * dy;
        if (d < f1) ((f2 = f1), (f1 = d), (id = cx * 7919 + cy * 31), (dx1 = dx), (dy1 = dy));
        else if (d < f2) f2 = d;
      }
    return { e: Math.sqrt(f2) - Math.sqrt(f1), id, dx: dx1, dy: dy1 };
  };
  // 둥근 돌의 입체 명암 단계 (0 밝음 … 4 어두움, 5 외곽선)
  const lvl3d = (wx, wy, G) => {
    const st = stone(wx, wy, G);
    if (st.e < 1.15) return [5, st];
    const R = G * 0.55, edge = Math.max(0, 1 - st.e / 3.6), s = 0.55 + edge * 1.3;
    const I = (st.dx / R) * s * -0.6 + (st.dy / R) * s * -0.8 + (H(st.id, 3) - 0.5) * 0.5;
    let L = I > 0.85 ? 0 : I > 0.3 ? 1 : I > -0.35 ? 2 : I > -0.95 ? 3 : 4;
    const n = H(wx, wy, 7);
    n > 0.985 && (L = Math.max(0, L - 1));
    n < 0.012 && (L = Math.min(4, L + 1));
    return [L, st];
  };
  const brickLvl = (wx, wy, bw, bh) => {
    const row = Math.floor(wy / bh), v = wy - row * bh;
    const off = Math.floor(H(row, 5) * bw), bi = Math.floor((wx + off) / bw), u = wx + off - bi * bw;
    if (u === 0 || v === 0) return 5;
    let L = 2 + (H(bi, row, 4) > 0.7 ? -1 : H(bi, row, 4) < 0.2 ? 1 : 0);
    if (v === 1 || u === 1) L = 0;
    else if (v === 2) L = Math.min(L, 1);
    else if (v === bh - 1 || u === bw - 1) L = 4;
    else if (v === bh - 2) L = Math.max(L, 3);
    return L;
  };
  // 재질: 위치에 따라 팔레트와 명암 단계
  const RAMP = {};
  const rampOf = (b) => (RAMP[b] = RAMP[b] ?? ramp(b));
  const regionBase = {
    plains: mix(P.rock, P.soil, 0.3), forest: mix(mix(P.rock, 0x4a6a44, 0.3), P.soil, 0.2), cave: mix(P.rock, P.soil, 0.45),
    desert: mix(P.soil, P.rock, 0.35), snow: mix(P.rock, 0xa8d0f0, 0.45), fortress: mix(P.rock, 0x8a5a48, 0.25),
    kingdom: mix(P.rock, 0xf0ecf4, 0.4), abyss: P.rock,
  }[th] ?? mix(P.rock, P.soil, 0.3);
  const matLvl = (c, r, wx, wy) => {
    if (isUG(r) && BI) return lvq(wx, wy, 15);
    if (th === "fortress") return brickLvl(wx, wy, 16, 9);
    if (th === "kingdom") return brickLvl(wx, wy, 24, 12);
    return lvq(wx, wy, th === "desert" ? 11 : 14);
  };
  const baseAt = (r) => (isUG(r) ? (BI ? BI.rock : mix(regionBase, 0x3a3448, 0.35)) : regionBase);

  // ── 1) 단단한 칸 ──
  for (let c = 0; c < COLS; c++, yield)
    for (let r = 0; r < ROWS; r++) {
      const cv = code(c, r);
      if (cv !== 1 && cv !== 4 && cv !== 5 && cv !== 6 && cv !== 7) continue;
      const slope = cv === 4 ? 1 : cv === 5 ? -1 : 0;
      const aU = slope ? !0 : !solidish(c, r - 1), aD = r < ROWS - 1 && !solidish(c, r + 1);
      const aL = slope === 1 ? !1 : !solidish(c - 1, r), aR = slope === -1 ? !1 : !solidish(c + 1, r);
      const dTop = (() => { let k = 0; while (k < 3 && solidish(c, r - k - 1)) k++; return k; })();
      const d = dist[r * COLS + c];
      const ugCell = isUG(r);
      const R5 = rampOf(baseAt(r));
      // 이 칸의 윗면 덮개
      const capT = ugCell ? (BI?.cap ? "moss" : "rock") : cap;
      const cTop = capT === "moss" ? BI.cap[0] : capT === "snow" ? 0xeef6ff : capT === "sand" ? P.topHi : P.top;
      const cHi = capT === "moss" ? BI.cap[1] : capT === "snow" ? 0xffffff : capT === "sand" ? 0xfff6d0 : P.topHi;
      const CR = rampOf(cTop);
      for (let py = 0; py < T; py++)
        for (let px = 0; px < T; px++) {
          const x = c * T + px, y = r * T + py, wx = (base + c) * T + px, wy = y;
          let sy = 0;
          if (slope === 1) sy = T - 1 - px;
          else if (slope === -1) sy = px;
          if (py < sy) continue;
          const ty = py - sy;
          // 둥근 모서리
          if (!slope && aU && ((aL && px + py < 4) || (aR && T - 1 - px + py < 4))) continue;
          if (aD && ((aL && px + (T - 1 - py) < 3) || (aR && T - 1 - px + (T - 1 - py) < 3))) continue;
          let L = matLvl(c, r, wx, wy);
          // 안쪽일수록 어둡게
          L < 5 && (L = Math.min(4, L + (d >= 4 ? 2 : d >= 2 ? 1 : 0)));
          // 윗면 바로 아래 그늘 (풀판이 드리운 그림자)
          if (L < 5 && dTop === 1 && ty < 4) L = Math.min(4, L + 1);
          // 옆면: 왼쪽은 빛 테두리, 오른쪽은 그늘
          if (aL && px < 3) L = px === 0 ? 5 : px === 1 ? Math.max(0, Math.min(L, 1)) : L;
          if (aR && px > 12) L = px === 15 ? 5 : Math.min(4, L + (px - 12));
          if (aD && py > 12) L = py === 15 ? 5 : Math.min(4, L + (py - 12));
          let col = R5[L];
          // 용암 지대: 틈새가 빛난다
          if (BI && ugCell && ug.biome === "magma" && L === 5 && H(wx >> 3, wy >> 3, 51) > 0.7) col = mix(0xff6a20, 0xffd060, H(wx, wy, 52) * 0.5);
          // 윗면 덮개
          if (aU) {
            if (capT === "grass" || capT === "moss" || capT === "snow" || capT === "sand") {
              const drip = Math.floor(H(wx >> 1, r, 11) * 3) + (H(wx >> 2, r, 12) > 0.8 ? 3 : 0);
              if (ty === 0) col = CR[5];
              else if (ty === 1) col = cHi;
              else if (ty < 4) col = H(wx >> 1, wy >> 1, 13) > 0.55 ? cHi : mix(cHi, cTop, 0.45);
              else if (ty < 6) col = cTop;
              else if (ty === 6) col = CR[3];
              else if (ty < 7 + drip) col = ty === 6 + drip ? CR[5] : CR[4];
              else if (ty < 10 + drip && L < 5) col = R5[Math.min(4, L + 2 - Math.floor((ty - 7 - drip) / 2))];
            } else if (capT === "ledge") {
              if (ty === 0) col = R5[5];
              else if (ty === 1) col = R5[0];
              else if (ty < 4) col = R5[1];
              else if (ty === 4) col = R5[4];
              else if (ty === 5) col = R5[5];
            } else {
              // 바위 윗면: 밝은 두께
              if (ty === 0) col = R5[5];
              else if (ty === 1) col = R5[0];
              else if (ty < 4) col = H(wx, wy, 14) > 0.85 ? R5[0] : R5[1];
              else if (ty === 4) col = R5[3];
            }
          }
          put(x, y, col);
        }
    }
  // ── 2) 밑면에 매달린 바위 (하늘 섬은 뿌리) ──
  for (let c = 0; c < COLS; c++, yield)
    for (let r = 0; r < ROWS - 1; r++) {
      if (!solid(c, r) || solid(c, r + 1) || plat(c, r + 1)) continue;
      const R5 = rampOf(baseAt(r));
      const floating = code(c, r) === 6 || code(c, r) === 7;
      for (let px = 0; px < T; px++) {
        const wx = (base + c) * T + px;
        const L = H(wx >> 2, r, 9) > 0.4 ? Math.floor(H(wx >> 2, r, 10) * 10) + 2 - Math.abs((wx & 3) - 1.5) * 1.6 : 0;
        const x = c * T + px, y0 = (r + 1) * T;
        for (let k = 0; k < L; k++) {
          if (!empty(x, y0 + k)) break;
          const edge = k >= Math.floor(L) - 1 || (wx & 3) === 0;
          put(x, y0 + k, edge ? R5[5] : (wx & 3) === 1 ? R5[3] : R5[4]);
        }
        // 하늘 섬 뿌리 · 숲 덩굴 · 고드름 · 수정
        if (floating && !isUG(r) && H(wx, r, 61) > 0.9) {
          const L2 = 8 + Math.floor(H(wx, r, 62) * 26);
          for (let k = 0; k < L2; k++) {
            const xx = x + Math.round(Math.sin(k * 0.35 + wx) * 1.2);
            empty(xx, y0 + k) && put(xx, y0 + k, k % 6 === 5 ? 0x7ab04a : k % 2 ? 0x5a3a22 : 0x6e4a2c);
          }
        } else if (!isUG(r) && (th === "forest" || th === "kingdom") && H(wx, r, 31) > 0.86) {
          const L2 = 6 + Math.floor(H(wx, r, 32) * 22);
          for (let k = 0; k < L2; k++) {
            const xx = x + Math.round(Math.sin(k * 0.4 + wx) * 1);
            empty(xx, y0 + k) && put(xx, y0 + k, k % 5 === 4 ? sh(P.top, 0.2) : sh(P.top, -0.35 + (k % 2) * 0.1));
          }
        } else if (!isUG(r) && th === "snow" && H(wx >> 1, r, 33) > 0.7) {
          const L2 = 3 + Math.floor(H(wx >> 1, r, 34) * 10) - Math.abs((wx & 1) - 0.5) * 2;
          for (let k = 0; k < L2; k++) empty(x, y0 + k) && put(x, y0 + k, k < 2 ? 0xffffff : mix(0xc8ecff, 0x7ab8e8, k / L2));
        }
      }
    }
  // ── 3) 발판: 나무판 · 구름 · 자수정 판 ──
  for (let c = 0; c < COLS; c++, yield)
    for (let r = 0; r < ROWS; r++) {
      if (!plat(c, r)) continue;
      const eL = !plat(c - 1, r), eR = !plat(c + 1, r);
      const cloud = clouds.has(`${c},${r}`);
      const crystal = isUG(r) && ug.biome === "geode";
      for (let px = 0; px < T; px++) {
        const wx = (base + c) * T + px;
        if (cloud) {
          // 뭉게구름 발판
          const bump = Math.round(2 + Math.sin(wx * 0.45) * 1.5 + Math.sin(wx * 0.17) * 1.2);
          const bot = 10 + Math.round(Math.sin(wx * 0.3) * 1.5);
          for (let py = -bump; py < bot; py++) {
            if ((eL && px < 3 && py < 2 - px) || (eR && px > 12 && py < px - 13)) continue;
            const t = (py + bump) / (bot + bump);
            const col = py === -bump ? 0xb8c8e8 : t < 0.25 ? 0xffffff : t < 0.6 ? 0xf0f4ff : t < 0.85 ? 0xd4def4 : 0xa8b8dc;
            put(c * T + px, r * T + py, col);
          }
          continue;
        }
        for (let py = 0; py < 11; py++) {
          if ((eL && px + py < 2) || (eR && 15 - px + py < 2) || (eL && px === 0 && py > 8) || (eR && px === 15 && py > 8)) continue;
          let col;
          if (crystal) {
            const R5 = rampOf(0x9a62d8);
            col = py === 0 || py === 10 || (eL && px === 0) || (eR && px === 15) ? R5[5] : py < 3 ? R5[0] : py < 5 ? R5[1] : (wx + py) % 7 === 0 ? R5[0] : R5[3];
          } else {
            const top = 0xc89058, face = 0x8a5a32;
            const seam = wx % 16 === 0;
            if (py === 0 || py === 10 || (eL && px === 0) || (eR && px === 15)) col = 0x2a160c;
            else if (py === 1) col = sh(top, 0.35);
            else if (py < 4) col = seam ? sh(top, -0.25) : top;
            else if (py === 4) col = sh(top, -0.38);
            else col = seam ? 0x3a2414 : (wx % 16 === 3 || wx % 16 === 12) && py === 6 ? 0xd0c0a0 : sh(face, -(py - 5) * 0.07 + (py === 5 ? 0.12 : 0));
          }
          put(c * T + px, r * T + py, col);
        }
      }
    }
  // 입체 레이어용: 밟을 수 있는 것만 담은 그림
  const front = new Uint8ClampedArray(img.data);
  const wall = new Uint8ClampedArray(img.data.length);
  const wallBuf = new Uint32Array(wall.buffer);

  // ── 4) 지하 뒷벽 ──
  const wallBase = BI ? BI.wall : mix(regionBase, 0x0e0a14, 0.7);
  const WR = rampOf(sh(wallBase, 0.08));
  for (let c = 0; c < COLS; c++, yield) {
    const entrances = ug.entrances?.filter(e => c >= e.x && c < e.x + e.w) ?? [];
    const entranceTop = entrances.length ? Math.min(...entrances.map(e => e.top)) : ROWS;
    const surfaceTop = ug.surface?.[c] ?? ROWS;
    const wallTop = Math.min(surfaceTop, entranceTop, ug.top - 2);
    for (let r = wallTop; r < ROWS; r++) {
      // Paint a continuous backing, including underneath foreground rocks and
      // platforms: their recessed copies must never expose the outdoor backdrop.
      let covered = r >= surfaceTop || r >= entranceTop;
      for (let k = 1; k <= 60 && r - k >= 0; k++) if (solid(c, r - k)) { covered = !0; break; }
      if (!covered) continue;
      for (let y = r * T; y < r * T + T; y++)
        for (let x = c * T; x < c * T + T; x++) {
          const wx = (base + c) * T + (x - c * T);
          const L0 = lvq(wx * 0.8 + 3000, y * 0.8, 18);
          let L = L0 >= 5 ? 5 : L0 >= 3 ? 4 : 3;
          // 가장자리(바위 옆) 그늘
          (solid(c, r - 1) && y - r * T < 6) || (solid(c - 1, r) && x - c * T < 4) || (solid(c + 1, r) && x - c * T > 11) ? (L = Math.min(5, L + 1)) : 0;
          // Keep the rear wall behind the extruded terrain faces, not in the front texture.
          wallBuf[y * PW + x] = pack(WR[L]);
        }
    }
  }
  // ── 5) 장식 ──
  const decoFloor = (x, y, wx, r) => {
    const h = H(wx, r, 21);
    if (isUG(r) && BI) {
      switch (ug.biome) {
        case "lush":
          if (h > 0.93) {
            // 큰잎 (드립리프)
            const L = 4 + Math.floor(H(wx, 71) * 6);
            for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, 0x3a7a2a);
            for (let dx = -3; dx <= 3; dx++) empty(x + dx, y - L - 1) && put(x + dx, y - L - 1, Math.abs(dx) === 3 ? 0x2a5a1e : 0x6ac040);
            for (let dx = -2; dx <= 2; dx++) empty(x + dx, y - L - 2) && put(x + dx, y - L - 2, 0x9ae060);
          } else if (h > 0.88) {
            // 진달래 덤불
            for (let dy = 1; dy <= 4; dy++) for (let dx = -3; dx <= 3; dx++) Math.abs(dx) + dy < 6 && empty(x + dx, y - dy) && put(x + dx, y - dy, H(wx + dx, dy, 72) > 0.75 ? 0xf080c0 : dy > 2 ? 0x4a8a34 : 0x3a6a2a);
          } else if (h > 0.5) {
            const L = 1 + Math.floor(H(wx, 22) * 3);
            for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, k === L ? 0xa8e070 : 0x5a9a3a);
          }
          break;
        case "drip":
          if (h > 0.9) {
            // 석순
            const L = 4 + Math.floor(H(wx, 73) * 12), w = 1 + Math.floor(L / 6);
            for (let k = 1; k <= L; k++) {
              const ww = Math.max(0, Math.round(w * (1 - k / L)));
              for (let dx = -ww; dx <= ww; dx++) empty(x + dx, y - k) && put(x + dx, y - k, dx < 0 ? 0xd8b088 : dx > 0 ? 0x6a4a30 : 0xa8845e);
            }
          }
          break;
        case "geode":
          if (h > 0.9) {
            // 자수정 덩어리
            const L = 3 + Math.floor(H(wx, 74) * 8);
            for (let k = 1; k <= L; k++) for (const dx of [-1, 0, 1]) (dx === 0 || k < L - 1) && empty(x + dx, y - k) && put(x + dx, y - k, dx < 0 ? 0xe0b0ff : dx > 0 ? 0x5a2a90 : 0x9a5ae0);
            empty(x, y - L - 1) && put(x, y - L - 1, 0xffffff);
          } else if (h > 0.8) for (let dx = -1; dx <= 1; dx++) empty(x + dx, y - 1) && put(x + dx, y - 1, 0xf0f0f8);
          break;
        case "deep":
          if (h > 0.7) {
            // 청록 빛 이끼 (스컬크 같은)
            const w = 2 + Math.floor(H(wx, 75) * 4);
            for (let dx = 0; dx < w; dx++) put(x + dx, y, H(wx + dx, 76) > 0.6 ? 0x40fff0 : 0x0e6a6a);
            h > 0.95 && (put(x, y - 1, 0x0e6a6a), put(x, y - 2, 0x40fff0), put(x - 1, y - 2, 0x0e6a6a), put(x + 1, y - 2, 0x0e6a6a));
          }
          break;
        case "magma":
          if (h > 0.85) {
            put(x, y, 0xff8030);
            empty(x, y - 1) && put(x, y - 1, 0xffd060);
          }
          break;
      }
      return;
    }
    if (th === "forest" && h > 0.985) {
      const red = H(wx, 41) > 0.5;
      for (let k = 1; k <= 3; k++) empty(x, y - k) && put(x, y - k, 0xe8dcc0);
      for (const dx of [-2, -1, 0, 1, 2]) empty(x + dx, y - 4) && put(x + dx, y - 4, red ? 0xd8323a : 0xe0a040);
      for (const dx of [-1, 0, 1]) empty(x + dx, y - 5) && put(x + dx, y - 5, red ? 0xff6a5a : 0xffd070);
      empty(x, y - 4) && put(x, y - 4, 0xffffff);
    } else if ((th === "cave" || th === "kingdom") && h > 0.975) {
      const L = 3 + Math.floor(H(wx, 42) * 5);
      for (let k = 1; k <= L; k++) for (const dx of [0, 1]) empty(x + dx, y - k) && put(x + dx, y - k, dx ? mix(P.accent, 0x000000, 0.25) : mix(P.accent, 0xffffff, 0.35));
      empty(x, y - L - 1) && put(x, y - L - 1, 0xffffff);
    } else if (th === "desert" && h > 0.985) {
      for (let k = 1; k <= 5; k++) empty(x, y - k) && put(x, y - k, 0x5a9a3a);
      empty(x - 1, y - 3) && put(x - 1, y - 3, 0x5a9a3a);
      empty(x + 1, y - 4) && put(x + 1, y - 4, 0x5a9a3a);
    } else if (cap === "grass" && h > 0.5) {
      // 두 톤 풀잎
      const L = 2 + Math.floor(H(wx, 22) * 4);
      for (let k = 1; k <= L; k++) empty(x, y - k) && put(x, y - k, k === L ? P.topHi : k > L / 2 ? P.top : sh(P.top, -0.25));
      h > 0.965 && (empty(x, y - L - 1) && put(x, y - L - 1, P.accent), empty(x - 1, y - L) && put(x - 1, y - L, P.accent), empty(x + 1, y - L) && put(x + 1, y - L, P.accent));
    } else if (cap === "snow" && h > 0.9) empty(x, y - 1) && put(x, y - 1, 0xffffff);
  };
  const decoCeil = (x, y, wx, r) => {
    if (!(isUG(r) && BI)) return;
    const h = H(wx, r, 81);
    switch (ug.biome) {
      case "lush":
        if (h > 0.88) {
          // 빛나는 열매가 달린 덩굴
          const L = 8 + Math.floor(H(wx, r, 82) * 40);
          for (let k = 0; k < L; k++) {
            const xx = x + Math.round(Math.sin(k * 0.3 + wx) * 1);
            if (!empty(xx, y + k)) break;
            put(xx, y + k, k % 2 ? 0x3a7a2a : 0x4e9a34);
            k % 7 === 5 && (put(xx + 1, y + k, 0xffb040), put(xx + 1, y + k + 1, 0xffe080));
          }
        } else if (h > 0.84) {
          // 포자꽃
          for (const [dx, dy] of [[0, 0], [-1, 1], [1, 1], [0, 1], [-2, 2], [2, 2], [0, 2]]) empty(x + dx, y + dy) && put(x + dx, y + dy, dy === 2 ? 0xff70b0 : 0x6a9a3a);
        }
        break;
      case "drip":
      case "geode":
        if (h > 0.82) {
          // 뾰족한 종유석 / 자수정 고드름
          const L = 5 + Math.floor(H(wx, r, 83) * 18), w = 1 + Math.floor(L / 7);
          const geo = ug.biome === "geode";
          for (let k = 0; k < L; k++) {
            const ww = Math.max(0, Math.round(w * (1 - k / L)));
            for (let dx = -ww; dx <= ww; dx++)
              empty(x + dx, y + k) && put(x + dx, y + k, geo ? (dx < 0 ? 0xe0b0ff : dx > 0 ? 0x5a2a90 : 0x9a5ae0) : dx < 0 ? 0xd8b088 : dx > 0 ? 0x6a4a30 : 0xa8845e);
          }
        }
        break;
      case "deep":
        h > 0.9 && [0, 1, 2].forEach((k) => empty(x, y + k) && put(x, y + k, k === 2 ? 0x40fff0 : 0x0e3a3a));
        break;
      case "magma":
        h > 0.9 && [0, 1, 2, 3].forEach((k) => empty(x, y + k) && put(x, y + k, k > 1 ? 0xff8030 : 0x3a1a10));
        break;
    }
  };
  for (let c = 0; c < COLS; c++, yield)
    for (let r = 1; r < ROWS - 1; r++) {
      const floor = solid(c, r) && !solid(c, r - 1) && !plat(c, r - 1);
      const ceil = solid(c, r) && !solid(c, r + 1) && !plat(c, r + 1);
      for (let px = 1; px < T - 1; px++) {
        const wx = (base + c) * T + px;
        floor && decoFloor(c * T + px, r * T, wx, r);
        ceil && decoCeil(c * T + px, (r + 1) * T, wx, r);
      }
    }
  // ── 6) 웅덩이 (물) ──
  for (const pl of ch.pools ?? [])
    for (let x = pl.x * T; x < (pl.x + pl.w) * T; x++)
      for (let y = pl.row * T + 5; y < (pl.row + pl.depth) * T; y++) {
        if (x < 0 || x >= PW || solid(Math.floor(x / T), Math.floor(y / T))) continue;
        const k = y - (pl.row * T + 5);
        const wx = base * T + x;
        const col = k === 0 ? 0xc0f0ff : k === 1 ? 0x70b8f0 : (wx + k * 3) % 11 === 0 && k < 8 ? 0x5aa0e8 : mix(0x3a78d0, 0x1a2a6a, Math.min(1, k / 26));
        put(x, y, col);
      }
  return { img, front, wall };
}

// ── 도감용 지형 그림: 32칸 너비 격자를 지역 재질로 한 장 그려 텍스처 키를 돌려준다 ──
const PREVIEW = new Map();
export function paintPreview(scene, name, grid, region) {
  const hit = PREVIEW.get(name);
  if (hit && scene.textures.exists(hit)) return hit;
  const ROWS = Math.round(grid.length / COLS);
  const S = makeEntry(scene, ROWS * T);
  const raw = (c, r) => (c >= COLS ? grid[r * COLS + COLS - 1] : grid[r * COLS + c]);
  const g0 = pixSteps({ grid, ug: { top: ROWS + 40, biome: null } }, 0, raw, region);
  let st;
  do st = g0.next(); while (!st.done);
  finishPut(S, st.value.img, st.value.front, st.value.wall);
  scene.textures.get(S.key).refresh();
  PREVIEW.set(name, S.key);
  return S.key;
}
export const _wkState = () => ({ WK: WK === null ? "none" : WK ? "on" : "off", n: WK ? WK.length : 0, jobs: WK_JOBS.size, queue: WK_Q.length, pre: PRE.size, lat: WK_LAT.slice(-10) });
