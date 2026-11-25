// 지역 설계 코드: 지역마다 지도 전체를 그 지역만의 뼈대로 꽉 채운다 (방 몇 개를 굴로 잇는 대신)
//   칸 = 8px 블록 (C.cell: 1 바위, -1 공기). 장치(사다리·승강기·짚라인…)는 P.specReq로 (natgen SPEC)
//   ARCHI[구역 id](K) — K는 아래 kit: 파기·채우기·비탈 굴·장치·뒷벽·재질·방 역할
import { rng } from "./noise.js";
import { greenstep as greenstepTepui } from "./archi_greenstep.js";
import { stonebridge as stonebridgeCity } from "./archi_stonebridge.js";
import { leafcrown as leafcrownForest } from "./archi_leafcrown.js";
import { ironvein as ironveinCity } from "./archi_ironvein.js";
import { dripstone as dripstoneCave } from "./archi_dripstone.js";
import { roothollow as roothollowDeep } from "./archi_roothollow.js";
import { mossbark as mossbarkWood } from "./archi_mossbark.js";
import { lightgarden } from "./archi_lightgarden.js";
import { abyss } from "./archi_abyss.js";
import { fossil } from "./archi_fossil.js";
import { spider } from "./archi_spider.js";
import { ashsky } from "./archi_ashsky.js";
import { hourglass } from "./archi_hourglass.js";
import { mangrove } from "./archi_mangrove.js";
import { mirage } from "./archi_mirage.js";
import { bogsky } from "./archi_bogsky.js";
import { monastery } from "./archi_monastery.js";
import { mirror } from "./archi_mirror.js";
import { sporesky } from "./archi_sporesky.js";
import { mistgrove } from "./archi_mistgrove.js";
import { citadel } from "./archi_citadel.js";
import { blackmarsh } from "./archi_blackmarsh.js";
import { glassdune } from "./archi_glassdune.js";

export function kit(P, C) {
  const { cell, NX, NY } = C;
  const R = rng((P.seed ^ 0xa4c41) >>> 0);
  const inb = (x, y) => x >= 1 && y >= 1 && x < NX - 1 && y < NY - 1;
  const set = (x, y, v) => inb(x, y) && (cell[y * NX + x] = v);
  const get = (x, y) => (inb(x, y) ? cell[y * NX + x] : 1);
  const K = {
    P, C, NX, NY, R, set, get,
    // [x0, x1) × [y0, y1) 칸
    air(x0, y0, x1, y1) {
      for (let y = Math.max(1, y0 | 0); y < Math.min(NY - 1, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(NX, x1); x++) cell[y * NX + x] = -1;
    },
    rock(x0, y0, x1, y1) {
      for (let y = Math.max(1, y0 | 0); y < Math.min(NY - 1, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(NX, x1); x++) cell[y * NX + x] = 1;
    },
    // 굴 한 줄: 바닥 f(그 칸은 바위), 높이 h칸
    hall(x0, x1, f, h) {
      K.air(Math.min(x0, x1), f - h, Math.max(x0, x1), f);
    },
    // 비탈 굴: (xa, fa) → (xb, fb), 기울기 1 이하 (걸어서 오르내린다)
    ramp(xa, fa, xb, fb, h = 7) {
      const n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
      for (let i = 0; i <= n; i++) {
        const x = xa + i * dir, f = Math.round(fa + ((fb - fa) * i) / Math.max(1, n));
        K.air(x, f - h, x + 1, f);
      }
    },
    // 굽은 굴 (사인 곡선으로 흔들리며): 바닥 높이를 점들로
    wiggle(pts, h = 7, amp = 0, wallM) {
      for (let k = 0; k + 1 < pts.length; k++) {
        const [xa, fa] = pts[k], [xb, fb] = pts[k + 1];
        const n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
        for (let i = 0; i <= n; i++) {
          const x = xa + i * dir, f = Math.round(fa + ((fb - fa) * i) / Math.max(1, n) + (amp ? Math.sin((x * 0.13) + k) * amp : 0));
          K.air(x, f - h, x + 1, f);
          // 뒷벽 (하늘 섬 속 굴: 하늘이 비치지 않게) — 4칸마다 한 조각
          wallM && i % 4 === 0 && K.wall(x - 2, f - h - 1, x + 3, f, wallM);
        }
      }
    },
    // 초타원 (p가 클수록 네모에 가깝다): 바닥이 넓은 대공동
    sell(cx, cy, rx, ry, p = 3, v = -1, rough = 0) {
      for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
        for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
          const dx = Math.abs((x - cx) / rx), dy = Math.abs((y - cy) / ry), rr = 1 + (rough ? (Math.sin(x * 0.37 + y * 0.21) + Math.sin(y * 0.29 - x * 0.17)) * rough : 0);
          dx ** p + dy ** p < rr && set(x, y, v);
        }
    },
    ell(cx, cy, rx, ry, v = -1, rough = 0) {
      for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
        for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
          const dx = (x - cx) / rx, dy = (y - cy) / ry, rr = 1 + (rough ? (Math.sin(x * 0.7 + y * 0.3) + Math.sin(y * 0.9 - x * 0.4)) * rough : 0);
          dx * dx + dy * dy < rr * rr && set(x, y, v);
        }
    },
    // 장치 (칸 좌표). 사다리는 위 바닥 fu보다 3칸 위부터 아래 바닥 fd까지 (가운데 cx, 폭 2칸)
    ladder(cx, fu, fd, k = "ladder") {
      P.specReq.push({ x0: cx - 1, x1: cx + 1, y0: fu - 3, y1: fd, k });
    },
    rope(cx, y0, fd) {
      P.specReq.push({ x0: cx - 1, x1: cx + 1, y0, y1: fd, k: "rope" });
    },
    vine(x0, x1, y0, y1) {
      P.specReq.push({ x0, x1, y0, y1, k: "vine" });
    },
    plank(x0, x1, f) {
      P.specReq.push({ x0, x1, y0: f, y1: f + 1, k: "plank" });
    },
    crumble(x0, x1, f) {
      P.specReq.push({ x0, x1, y0: f, y1: f + 1, k: "crumble" });
    },
    crack(x0, y0, x1, y1) {
      K.air(x0, y0, x1, y1);
      P.specReq.push({ x0, x1, y0, y1, k: "crack" });
    },
    water(x0, y0, x1, y1, k = "water") {
      P.specReq.push({ x0, x1, y0, y1, k });
    },
    // 폭포 (세로 물기둥): 헤엄쳐 오른다
    fallw(x0, y0, x1, y1) {
      K.air(x0, y0, x1, y1);
      P.specReq.push({ x0, x1, y0, y1, k: "water", ex: { fallw: 1 } });
    },
    wind(x0, x1, y0, y1, pow) {
      P.specReq.push({ x0, x1, y0, y1, k: "wind", ex: pow ? { pow } : null });
    },
    geyser(x0, x1, y0, f, ex) {
      P.specReq.push({ x0, x1, y0, y1: f, k: "geyser", ex });
    },
    fall(x0, x1, y0, f) {
      P.specReq.push({ x0, x1, y0, y1: f, k: "fall" });
    },
    // 승강기: 길 [x0, x1), 발판 윗면이 위 바닥 fu ~ 아래 바닥 fd를 오간다 (줄은 top칸부터)
    //   lock: 레버 이름 — 그 레버를 당기기 전엔 park("up"|"down") 끝에 멈춰 있다 (길찾기 검사는 없는 것으로 본다)
    lift(x0, x1, fu, fd, top, lock, park = "up") {
      P.specReq.push({ x0, x1, y0: fu, y1: fd, k: "lift", ex: { top: (top ?? fu - 8) * 8, ...(lock ? { lock, park } : {}) } });
    },
    // 하늘 나룻 바구니: 바구니(폭 w칸) 윗면이 줄 f, 길 [x0, x1) 사이를 옆으로 오간다 (줄은 cab칸 위)
    ferry(x0, x1, f, w = 6, cab = 12) {
      P.specReq.push({ x0, x1, y0: f - cab, y1: f, k: "ferry", ex: { w: w * 8 } });
    },
    // 도개교: [x0, x1) 판이 줄 f에 놓였다가 주기마다 경첩(hinge "L"|"R") 쪽으로 들린다 (길찾기는 놓인 것으로 본다)
    draw(x0, x1, f, hinge = "L", ph = 0) {
      P.specReq.push({ x0, x1, y0: f, y1: f + 1, k: "draw", ex: { hinge, ph } });
    },
    // 덩굴 그네: 칸 (ax, ay)에 매여 len칸 늘어진 덩굴 — 매달려 흔들다 놓으면 날아간다
    swing(ax, ay, len) {
      P.specReq.push({ x0: ax - 1, x1: ax + 1, y0: ay, y1: ay + len, k: "swing", ex: { ax: ax * 8 + 4, ay: ay * 8, len: len * 8 } });
    },
    // 회복 샘: 들어가 있으면 체력이 찬다
    heal(x0, x1, y0, f) {
      P.specReq.push({ x0, x1, y0, y1: f, k: "heal" });
    },
    // 레버: 때리면 켜진다 (id로 승강기·문을 깨운다). 바닥 f 위 3칸
    lever(x, f, id) {
      P.specReq.push({ x0: x - 1, x1: x + 1, y0: f - 3, y1: f, k: "lever", ex: { id } });
    },
    // 가로 바람: dx 방향으로 밀고 살짝 띄운다 (lift px/s)
    windH(x0, x1, y0, y1, dx, pow = 300, lift = 40) {
      P.specReq.push({ x0, x1, y0, y1, k: "wind", ex: { dx, pow, lift } });
    },
    // 정한 자리 소품 (칸 좌표, 바닥 f)
    prop(x, f, k, o = {}) {
      (P.fixedProps ??= []).push({ x: x * 8 + 4, y: f * 8, k, ...o });
    },
    // 구조물 이름표 (검사 도구 · 역할 지도)
    struct(name, role, x0, y0, x1, y1) {
      (P.structs ??= []).push({ name, role, x0: x0 * 8, y0: y0 * 8, x1: x1 * 8, y1: y1 * 8 });
    },
    // 짚라인: 칸 좌표 끝점 (줄 높이) — 높은 쪽에서 낮은 쪽으로
    zip(ax, ay, bx, by) {
      P.specReq.push({ x0: Math.min(ax, bx) - 1, x1: Math.max(ax, bx) + 1, y0: Math.min(ay, by) - 1, y1: Math.max(ay, by) + 1, k: "zip", ex: { ax: ax * 8, ay: ay * 8, bx: bx * 8, by: by * 8 } });
    },
    wall(x0, y0, x1, y1, m) {
      P.walls.push({ x0: x0 * 8, y0: y0 * 8, x1: x1 * 8, y1: y1 * 8, m });
    },
    mat(x0, y0, x1, y1, m) {
      P.mats.push({ x0: x0 * 8, y0: y0 * 8, x1: x1 * 8, y1: y1 * 8, m });
    },
    tag(x0, y0, x1, y1, role, ex) {
      (P.roomTags ??= []).push({ x0: x0 * 8, x1: x1 * 8, y0: y0 * 8, y1: y1 * 8 + 8, role, ...(ex ?? {}) });
    },
    // ── 하늘에 짓기 ──
    // 받침판: 바닥 f부터 t칸 두께 (재질 m)
    slab(x0, x1, f, t = 3, m) {
      K.rock(x0, f, x1, f + t);
      m && K.mat(x0, f, x1, f + t, m);
    },
    // 섬 배: 아래로 갈수록 좁아지는 거꾸로 선 산 (울퉁불퉁)
    belly(x0, x1, f, depth, m) {
      const w = x1 - x0;
      for (let k = 0; k < depth; k++) {
        const u = k / depth, s0 = Math.round(u * u * w * 0.48 + (Math.sin(k * 0.9 + x0) + 1) * 1.5), s1 = Math.round(u * u * w * 0.48 + (Math.sin(k * 0.7 + x1) + 1) * 1.5);
        x0 + s0 < x1 - s1 && K.rock(x0 + s0, f + k, x1 - s1, f + k + 1);
      }
      m && K.mat(x0, f, x1, f + depth, m);
    },
    // 계단 다리: (xa, fa) → (xb, fb), 기울기 1 이하, 두께 t
    stairway(xa, fa, xb, fb, t = 2, m) {
      const n = Math.abs(xb - xa), dir = Math.sign(xb - xa) || 1;
      for (let i = 0; i <= n; i++) {
        const x = xa + i * dir, f = Math.round(fa + ((fb - fa) * i) / Math.max(1, n));
        K.rock(x, f, x + 1, f + t);
        m && K.mat(x, f, x + 1, f + t, m);
      }
    },
    cloud(x0, x1, f) {
      P.specReq.push({ x0, x1, y0: f, y1: f + 2, k: "cloud" });
    },
    bounce(x0, x1, f) {
      P.specReq.push({ x0, x1, y0: f - 1, y1: f, k: "bounce" });
    },
    peak(cx, f) {
      P.peak = { x: Math.round((cx * 8 - 8) / 16) * 16 + 8, y: f * 8 };
    },
    deep(cx, f) {
      P.deep = { x: Math.round((cx * 8 - 8) / 16) * 16 + 8, y: f * 8 };
    },
  };
  return K;
}

// ══════════════════════════════════════════════════════════════
// 그물 생성기: 지도 전체에 크기·종류가 제각각인 방을 빽빽이 흩뿌리고, 이웃끼리 여러 갈래로 잇는다
//   o.fixed: 꼭 있어야 할 방 (입구·▲▼·요새 문) · o.reserve: 비워 둘 곳 · o.pick(): 방 종류·크기
//   o.shape(K, r): 방 파기 · o.link(K, a, b, kind): 두 문 잇기 ("v" 위아래 겹침 · "h" 비탈 · "s" 가파름) · o.inside(K, r): 방 속 꾸밈
// ══════════════════════════════════════════════════════════════
export function network(K, o) {
  const { NX, NY, R } = K;
  const rooms = o.fixed.map((r) => ({ ...r, fixed: 1 }));
  const M = o.margin ?? 8;
  const hit = (a, b, m) => a.x0 - m < b.x1 && b.x0 - m < a.x1 && a.f - a.h - m < b.f + (b.below ?? 0) + 2 && b.f - b.h - m < a.f + (a.below ?? 0) + 2;
  const top = o.top ?? 40, bot = o.bot ?? NY - 30;
  for (let t = 0; t < (o.tries ?? 8000) && rooms.length < (o.n ?? 160); t++) {
    const q = o.pick();
    const w = q.w, h = q.h;
    const x0 = 6 + Math.floor(R() * (NX - 12 - w)), f = top + h + Math.floor(R() * Math.max(1, bot - top - h));
    const r = { ...q, x0, x1: x0 + w, f, h };
    if (rooms.some((b) => hit(r, b, M)) || (o.reserve ?? []).some((b) => hit(r, b, 4))) continue;
    rooms.push(r);
  }
  for (const r of rooms) (r.cx = (r.x0 + r.x1) / 2), (r.cy = r.f - r.h / 2), (r.deg = 0);
  // 잇기: 가장 짧은 나무(모두 이어짐) + 가까운 이웃 몇 개 더 (고리)
  const dist = (a, b) => Math.hypot(a.cx - b.cx, (a.cy - b.cy) * (o.vw ?? 1.5));
  const E = [];
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) E.push([dist(rooms[i], rooms[j]), i, j]);
  E.sort((p, q) => p[0] - q[0]);
  const par = rooms.map((_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
  const used = new Set(), links = [];
  for (const [, i, j] of E) if (find(i) !== find(j)) ((par[find(i)] = find(j)), used.add(i + ":" + j), links.push([i, j]));
  for (let i = 0; i < rooms.length; i++) {
    let k = 0;
    for (const [dd, a, b] of E) {
      if (k >= (o.extra ?? 2) || dd > (o.maxLen ?? 130)) break;
      if (a !== i && b !== i) continue;
      const key = a + ":" + b;
      if (used.has(key)) continue;
      k++;
      R() < (o.loopP ?? 0.7) && (used.add(key), links.push([a, b]));
    }
  }
  for (const [i, j] of links) (rooms[i].deg++, rooms[j].deg++);
  for (const r of rooms) o.shape(K, r);
  for (const [i, j] of links) route(K, rooms[i], rooms[j], o);
  for (const r of rooms) o.inside && o.inside(K, r);
  return rooms;
}
// 두 방 잇기: 위아래로 겹치면 세로 굴, 아니면 옆문끼리 (높이 차가 작으면 비탈, 크면 세로 굴을 끼운다)
function route(K, a, b, o) {
  const ox0 = Math.max(a.x0, b.x0), ox1 = Math.min(a.x1, b.x1);
  if (ox1 - ox0 >= 8) {
    const [U, L] = a.f < b.f ? [a, b] : [b, a];
    const mx = Math.round(ox0 + 3 + K.R() * (ox1 - ox0 - 6));
    o.link(K, { x: mx, f: U.f, r: U }, { x: mx, f: L.f, r: L }, "v");
    return;
  }
  const [A, B] = a.cx < b.cx ? [a, b] : [b, a];
  const pa = { x: A.x1 - 1, f: A.f, r: A }, pb = { x: B.x0 + 1, f: B.f, r: B };
  o.link(K, pa, pb, Math.abs(pb.f - pa.f) <= pb.x - pa.x - 6 ? "h" : "s");
}
// 비탈 이음 (평평 → 비탈 → 평평, 비탈 자리는 제각각)
function slopeLink(K, a, b, h) {
  const dy = b.f - a.f, run = b.x - a.x - Math.abs(dy), xr = a.x + Math.floor(K.R() * Math.max(1, run));
  K.hall(a.x, xr + 1, a.f, h);
  K.ramp(xr, a.f, xr + Math.abs(dy), b.f, h);
  K.hall(xr + Math.abs(dy), b.x + 1, b.f, h);
}

// ══════════════════════════════════════════════════════════════
// 아이언베인 「광산 요새」: 지도 전체가 얽힌 갱도망 (그물 생성기 + 광산 규칙)
//   꼭대기 가운데 벽돌 요새(층마다 방·사다리, 맨 위 망루 = ▲)에서 사방으로 갱도가 뻗어 내려간다
//   방 종류: 채굴방(층층 나무 발판·사다리·짚라인) · 광맥 굴 · 갱도 작업장(긴 굴, 버팀목) · 물 찬 집수정
//            · 무너진 굴(무너지는 판·떨어지는 바위) · 금 간 벽 뒤 보석 금고(막다른 방) · 환기 수갱(바람)
//   잇기: 높이 차가 작으면 비탈 갱도, 크면 사다리 수갱(아주 크면 승강기) — 세로 굴은 위 바닥에 판자 뚜껑
// ══════════════════════════════════════════════════════════════
function ironvein(K) {
  const { NX, R } = K;
  const EN = 600;
  // ── 요새 (벽돌) ──
  const KX0 = 462, KX1 = 628, KF = [70, 102, 134, 166, 198];
  K.mat(KX0 - 4, 30, KX1 + 4, 206, "brick");
  for (let s = 0; s < KF.length; s++) {
    const f = KF[s], h = s === 0 ? 20 : 24;
    K.hall(KX0 + 4, KX1 - 4, f, h);
    K.wall(KX0 + 4, f - h, KX1 - 4, f, "brick");
    const parts = [[502, 506], [560, 564], [596, 600]].filter((_, i) => (s + i) % 3 !== 0);
    for (const [a, b] of parts) (K.rock(a, f - h, b, f - 7), K.mat(a, f - h, b, f - 7, "brick"));
    K.tag(KX0 + 4, f - h, KX1 - 4, f, s === 0 ? "rest" : s === 2 ? "treasure" : "arena");
  }
  const LX = [[480, 610], [530], [490, 580], [612]];
  for (let s = 0; s < KF.length - 1; s++) for (const x of LX[s]) (K.air(x - 1, KF[s], x + 2, KF[s + 1] - 24), K.plank(x - 1, x + 2, KF[s]), K.ladder(x, KF[s], KF[s + 1]));
  K.hall(530, 560, 44, 12);
  K.wall(530, 32, 560, 44, "brick");
  K.mat(526, 30, 564, 46, "brick");
  K.air(553, 44, 556, 71), K.plank(553, 556, 44), K.ladder(554, 44, 70);
  K.peak(544, 44);
  for (const f of [134, 198]) (K.air(KX0 - 4, f - 7, KX0 + 4, f), K.air(KX1 - 4, f - 7, KX1 + 4, f));
  // ── 그물 ──
  const fixed = [
    { id: "EL", x0: 0, x1: 34, f: EN, h: 9, type: "door" },
    { id: "ER", x0: NX - 34, x1: NX, f: EN, h: 9, type: "door" },
    { id: "KW1", x0: KX0 - 30, x1: KX0 - 3, f: 134, h: 8, type: "door" },
    { id: "KE1", x0: KX1 + 3, x1: KX1 + 30, f: 134, h: 8, type: "door" },
    { id: "KW2", x0: KX0 - 30, x1: KX0 - 3, f: 198, h: 8, type: "door" },
    { id: "KE2", x0: KX1 + 3, x1: KX1 + 30, f: 198, h: 8, type: "door" },
    { id: "DP", x0: 396, x1: 436, f: 1010, h: 12, type: "work" },
  ];
  const TYPES = [
    ["stope", 5, [34, 64], [22, 34]], ["pocket", 4, [14, 24], [10, 16]], ["work", 6, [40, 90], [8, 11]],
    ["sump", 2, [30, 50], [12, 16]], ["collapse", 3, [30, 52], [12, 18]], ["vault", 2, [14, 20], [8, 10]], ["vent", 2, [8, 10], [36, 56]],
  ];
  const tot = TYPES.reduce((a, t) => a + t[1], 0);
  const pick = () => {
    let u = R() * tot;
    for (const [type, w, [w0, w1], [h0, h1]] of TYPES) if ((u -= w) <= 0) return { type, w: w0 + Math.floor(R() * (w1 - w0)), h: h0 + Math.floor(R() * (h1 - h0)) };
    return { type: "work", w: 50, h: 9 };
  };
  const rooms = network(K, {
    fixed, n: 230, margin: 5, top: 30, bot: 1030, vw: 1.6, extra: 2, maxLen: 110, loopP: 0.75, tries: 14000,
    reserve: [{ x0: KX0 - 6, x1: KX1 + 6, f: 210, h: 186 }],
    pick,
    shape(K, r) {
      if (r.type === "pocket") {
        K.ell(r.cx, r.f - r.h / 2, r.x1 - r.cx, r.h / 2 + 1, -1, 0.08);
        K.rock(r.x0 - 3, r.f, r.x1 + 3, r.f + 4);
        K.air(r.x0 + 2, r.f - 7, r.x1 - 2, r.f);
        return;
      }
      K.air(r.x0, r.f - r.h, r.x1, r.f);
      // 천장 울퉁불퉁 (바닥은 평평)
      if (r.type !== "door" && r.type !== "vent")
        for (let x = r.x0; x < r.x1; x++) {
          const v = Math.round(Math.sin(x * 0.31 + r.f) * 1.3 + Math.sin(x * 0.11 + r.x0) * 1.6);
          v > 0 ? K.air(x, r.f - r.h - v, x + 1, r.f - r.h) : K.rock(x, r.f - r.h, x + 1, r.f - r.h - v);
        }
    },
    link(K, a, b, kind) {
      const h = 7 + (K.R() < 0.3 ? 1 : 0);
      if (kind === "v") {
        // 위 방 바닥에서 아래 방 바닥까지 사다리 수갱 (아주 길면 승강기)
        if (b.f - a.f > 64 && K.R() < 0.6) {
          K.air(a.x - 4, a.f - 2, a.x + 4, b.f);
          K.wall(a.x - 4, a.f - 2, a.x + 4, b.f, "wood");
          K.lift(a.x - 3, a.x + 3, a.f, b.f);
        } else {
          K.air(a.x - 1, a.f, a.x + 2, b.f);
          K.plank(a.x - 1, a.x + 2, a.f);
          K.ladder(a.x, a.f, b.f);
        }
        return;
      }
      if (kind === "h") {
        slopeLink(K, a, b, h);
        K.R() < 0.35 && K.wall(a.x, Math.min(a.f, b.f) - h - 1, b.x, Math.max(a.f, b.f), "wood");
        return;
      }
      // 가파르면: 옆 굴 → 사다리 수갱 → 옆 굴 (수갱 자리 가운데쯤)
      const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
      const [up, lo] = a.f < b.f ? [a, b] : [b, a];
      K.hall(a.x, mx + 3, a.f, h);
      K.hall(mx - 2, b.x + 1, b.f, h);
      K.air(mx - 1, up.f, mx + 2, lo.f);
      K.plank(mx - 1, mx + 2, up.f);
      K.ladder(mx, up.f, lo.f);
    },
    inside(K, r) {
      const R = K.R;
      if (r.type === "stope") {
        // 층층 나무 발판 + 사다리, 넓으면 짚라인
        K.wall(r.x0, r.f - r.h, r.x1, r.f, "wood");
        let y = r.f - 8, side = R() < 0.5;
        while (y > r.f - r.h + 7) {
          const w = Math.min(r.x1 - r.x0 - 10, 12 + Math.floor(R() * 14)), x0 = side ? r.x0 + 1 : r.x1 - 1 - w;
          K.plank(x0, x0 + w, y);
          K.ladder(side ? x0 + w - 3 : x0 + 3, y, y + 8);
          y -= 8, (side = !side);
        }
        r.x1 - r.x0 > 44 && K.zip(r.x0 + 4, r.f - r.h + 4, r.x1 - 4, r.f - 6);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.3 ? "treasure" : "arena");
      } else if (r.type === "work") {
        K.wall(r.x0, r.f - r.h - 1, r.x1, r.f, "wood");
        for (let x = r.x0 + 10; x < r.x1 - 10; x += 22 + Math.floor(R() * 20)) R() < 0.4 && K.fall(x, x + 3, r.f - r.h, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.5 ? "arena" : "rest");
      } else if (r.type === "sump") {
        K.air(r.x0 + 5, r.f, r.x1 - 5, r.f + 5);
        K.water(r.x0 + 5, r.f, r.x1 - 5, r.f + 5, R() < 0.5 ? "curL" : "curR");
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      } else if (r.type === "collapse") {
        const a = r.x0 + 8, b = r.x1 - 8;
        K.air(a, r.f, b, r.f + 6);
        for (let x = a; x < b; x += 16) K.crumble(x, Math.min(b, x + 10), r.f);
        for (let x = r.x0 + 6; x < r.x1 - 6; x += 14) R() < 0.5 && K.fall(x, x + 3, r.f - r.h, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      } else if (r.type === "vault") {
        K.wall(r.x0, r.f - r.h, r.x1, r.f, "brick");
        if (r.deg === 1) (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "treasure");
      } else if (r.type === "vent") {
        K.wind(r.x0 + 1, r.x1 - 1, r.f - r.h + 2, r.f);
      } else if (r.type === "pocket") K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.4 ? "treasure" : "rest");
    },
  });
  K.deep(416, 1010);
  return rooms;
}


// 둥근 방 (평평한 바닥 띠를 끝까지 — 옆문이 바닥에 닿게)
function roundRoom(K, r, rough = 0.1) {
  K.ell(r.cx, r.f - r.h * 0.5, (r.x1 - r.x0) / 2, r.h * 0.55, -1, rough);
  K.rock(r.x0 - 3, r.f, r.x1 + 3, r.f + 5);
  K.air(r.x0, r.f - 8, r.x1, r.f);
}
// 종류 고르기 표: [종류, 무게, [폭], [높이]]
function picker(R, TYPES) {
  const tot = TYPES.reduce((a, t) => a + t[1], 0);
  return () => {
    let u = R() * tot;
    for (const [type, w, [w0, w1], [h0, h1]] of TYPES) if ((u -= w) <= 0) return { type, w: w0 + Math.floor(R() * (w1 - w0)), h: h0 + Math.floor(R() * (h1 - h0)) };
    const t = TYPES[0];
    return { type: t[0], w: t[2][0], h: t[3][0] };
  };
}
// 구불구불한 관: 가운데 점을 흔들되 기울기는 넘지 않게
function tube(K, a, b, h, amp = 1.5) {
  const dx = b.x - a.x, dy = b.f - a.f, room = Math.max(0, 0.85 * dx / 2 - Math.abs(dy) / 2);
  const mid = [Math.round((a.x + b.x) / 2), Math.round((a.f + b.f) / 2 + (K.R() * 2 - 1) * Math.min(room, 10))];
  K.wiggle([[a.x, a.f], mid, [b.x + 1, b.f]], h, amp);
}

// ══════════════════════════════════════════════════════════════
// 루트홀로우 「뿌리 속」: 지도 가운데를 위에서 아래까지 꿰뚫는 거대한 속 빈 고목 + 그 둘레 뿌리 굴 미로
//   고목 속: 층마다 자리·폭이 다른 방(왼쪽·오른쪽·통째), 뿌리 밧줄과 덩굴 벽으로 오른다, 맨 위 = ▲
//   뿌리 굴: 둥근 굴방을 구불구불한 관이 잇는다 (세로는 뿌리 밧줄, 가끔 포자 분출구)
//   방 종류: 굴방(늘어진 덩굴) · 밧줄 숲(천장에서 뿌리가 빽빽이) · 포자 분출구(뿜어야 닿는 높은 턱)
//            · 뿌리 웅덩이 · 썩은 둥지(무너지는 뿌리 판·떨어지는 가시) · 뿌리 벽 뒤 숨은 굴
// ══════════════════════════════════════════════════════════════
function roothollow(K) {
  const { NX, R } = K;
  const EN = 600, TX0 = 486, TX1 = 602;
  K.mat(TX0 - 6, 24, TX1 + 6, 748, "wood");
  // 고목 속 방: [바닥, 0 통째 · 1 왼쪽 · 2 오른쪽]
  const FL = [[70, 0], [126, 1], [180, 2], [238, 0], [292, 1], [356, 2], [418, 0], [478, 1], [540, 2], [600, 0], [664, 1], [728, 2]];
  const span = (k) => (k === 0 ? [TX0 + 6, TX1 - 6] : k === 1 ? [TX0 + 6, TX0 + 76] : [TX1 - 76, TX1 - 6]);
  let prevF = 30;
  const fixed = [];
  FL.forEach(([f, k], i) => {
    const [a, b] = span(k), h = f - prevF - 5;
    K.air(a, f - h, b, f);
    K.wall(a, f - h, b, f, "wood");
    // 덩굴 벽 (한쪽 안벽을 타고 오른다)
    i > 0 && K.vine(i % 2 ? a : b - 3, i % 2 ? a + 3 : b, f - h, f);
    K.tag(a, f - h, b, f, i === 0 ? "rest" : i % 4 === 2 ? "treasure" : "arena");
    // 중간 선반 (높은 방)
    if (h > 34) {
      const sx = k === 2 ? a + 4 : b - 22;
      K.plank(sx, sx + 18, f - Math.floor(h / 2));
      K.rope(k === 2 ? sx + 16 : sx + 2, f - Math.floor(h / 2) - 2, f);
    }
    // 위층과 잇는 뿌리 밧줄 (두 방이 겹치는 자리)
    if (i > 0) {
      const [pa, pb] = span(FL[i - 1][1]), x = Math.round((Math.max(a, pa) + Math.min(b, pb)) / 2) + (i % 3) * 4 - 4;
      K.air(x - 2, prevF, x + 2, f - h + 1);
      K.plank(x - 2, x + 2, prevF);
      K.rope(x, prevF - 3, f);
    }
    // 바깥으로 난 가지 문 (서·동 번갈아)
    if (i >= 1 && i <= 10) {
      const west = i % 2 === 1;
      if (west && k !== 2) (K.air(TX0 - 7, f - 8, TX0 + 7, f), fixed.push({ id: "BW" + i, x0: TX0 - 36, x1: TX0 - 7, f, h: 9, type: "door" }));
      if (!west && k !== 1) (K.air(TX1 - 7, f - 8, TX1 + 7, f), fixed.push({ id: "BE" + i, x0: TX1 + 7, x1: TX1 + 36, f, h: 9, type: "door" }));
    }
    prevF = f;
  });
  K.peak(544, 70);
  fixed.push({ id: "EL", x0: 0, x1: 34, f: EN, h: 9, type: "door" }, { id: "ER", x0: NX - 34, x1: NX, f: EN, h: 9, type: "door" }, { id: "DP", x0: 396, x1: 436, f: 1012, h: 12, type: "bulb" });
  network(K, {
    fixed, n: 240, margin: 5, top: 30, bot: 1032, vw: 1.3, extra: 2, maxLen: 100, loopP: 0.8, tries: 14000,
    reserve: [{ x0: TX0 - 8, x1: TX1 + 8, f: 752, h: 732 }],
    pick: picker(R, [["bulb", 7, [20, 48], [14, 26]], ["hall", 4, [40, 90], [10, 14]], ["grove", 2, [30, 56], [32, 46]], ["spore", 2, [22, 34], [26, 36]], ["pond", 2, [30, 56], [14, 20]], ["nest", 2, [28, 44], [14, 20]], ["hollow", 2, [12, 18], [9, 11]]]),
    shape(K, r) {
      if (r.type === "door") return void K.air(r.x0, r.f - r.h, r.x1, r.f);
      roundRoom(K, r, r.type === "hall" ? 0.05 : 0.12);
    },
    link(K, a, b, kind) {
      if (kind === "h") return void tube(K, a, b, 8, 1.5);
      const vert = (x, up, lo) => {
        // 짧은 세로 굴은 가끔 포자 분출구 (뿜을 때 타고 오른다), 아니면 뿌리 밧줄
        if (lo - up < 80 && K.R() < 0.3) {
          K.air(x - 3, up - 1, x + 3, lo);
          K.geyser(x - 3, x + 3, up - 4, lo, { tint: 0xb8ff80, pow: 520 });
        } else {
          K.air(x - 2, up, x + 2, lo);
          K.plank(x - 2, x + 2, up);
          K.rope(x, up - 3, lo);
        }
      };
      if (kind === "v") return void vert(a.x, a.f, b.f);
      const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
      K.wiggle([[a.x, a.f], [mx + 4, a.f]], 8, 1);
      K.wiggle([[mx - 3, b.f], [b.x + 1, b.f]], 8, 1);
      vert(mx, Math.min(a.f, b.f), Math.max(a.f, b.f));
    },
    inside(K, r) {
      const R = K.R, top = r.f - Math.round(r.h * 1.05);
      if (r.type === "bulb" || r.type === "hall") {
        R() < 0.5 && r.h > 14 && K.vine(Math.round(r.cx) - 1, Math.round(r.cx) + 1, top + 2, r.f - 3);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.25 ? "treasure" : R() < 0.5 ? "rest" : "arena");
      } else if (r.type === "grove") {
        // 천장에서 늘어진 뿌리 밧줄 숲 + 높은 선반
        for (let x = r.x0 + 5; x < r.x1 - 4; x += 8 + Math.floor(R() * 6)) {
          let y = r.f - 8;
          while (y > 2 && K.get(x, y - 1) === -1) y--;
          K.rope(x, y, r.f - 3 - Math.floor(R() * 8));
        }
        const sx = R() < 0.5 ? r.x0 + 3 : r.x1 - 14;
        K.plank(sx, sx + 11, r.f - r.h + 8);
        K.tag(sx, r.f - r.h, sx + 11, r.f - r.h + 8, "treasure");
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      } else if (r.type === "spore") {
        const cx = Math.round(r.cx);
        K.geyser(cx - 3, cx + 3, top + 4, r.f, { tint: 0xc8ff90, pow: 560 });
        const left = R() < 0.5, sx = left ? cx - 15 : cx + 4;
        K.rock(sx, r.f - r.h + 10, sx + 11, r.f - r.h + 13);
        K.tag(sx, r.f - r.h, sx + 11, r.f - r.h + 10, "treasure");
      } else if (r.type === "pond") {
        K.air(r.x0 + 6, r.f, r.x1 - 6, r.f + 5);
        K.water(r.x0 + 6, r.f, r.x1 - 6, r.f + 5);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      } else if (r.type === "nest") {
        const a = r.x0 + 7, b = r.x1 - 7;
        K.air(a, r.f, b, r.f + 6);
        for (let x = a; x < b; x += 15) K.crumble(x, Math.min(b, x + 9), r.f);
        for (let x = r.x0 + 6; x < r.x1 - 6; x += 12) R() < 0.5 && K.fall(x, x + 3, top + 2, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      } else if (r.type === "hollow") {
        K.wall(r.x0, r.f - r.h, r.x1, r.f, "wood");
        if (r.deg === 1) (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "treasure");
      }
    },
  });
  K.deep(416, 1012);
}

// ══════════════════════════════════════════════════════════════
// 드립스톤 「수몰 사원」: 거대한 공동 여러 개 — 공동마다 종유석 바위 턱이 빽빽한 정글짐
//   가운데 대공동: 호수 위에 선 물에 잠긴 사원 (층 사이를 세로 물길로 헤엄쳐 오른다), 사원 탑 꼭대기 = ▲
//   방 종류: 대공동(바위 턱 그물·떨어지는 종유석·바닥 웅덩이·간헐천) · 석회 굴 · 지하 호수(섬 턱)
//            · 폭포 굴뚝(세로 물기둥으로 헤엄쳐 오르면 높은 턱) · 긴 회랑
//   잇기: 넓은 비탈 굴, 세로는 폭포(헤엄쳐 오른다) 또는 물기둥 간헐천
// ══════════════════════════════════════════════════════════════
function ledges(K, x0, x1, f, top, R, n) {
  // 바위 턱 덤불: 바닥에서 시작해 이미 놓인 턱 위로 가지 치듯 자란다 (한 번 뛰어 닿는 거리) — 줄 맞춘 격자가 아니다
  const L = [{ x: x0 + (x1 - x0) * 0.25, w: 0, y: f }, { x: x0 + (x1 - x0) * 0.7, w: 0, y: f }];
  const want = n ?? Math.round(((x1 - x0) * (f - top)) / 260);
  const fits = (x, y, w) => {
    if (x < x0 || x + w > x1 || y < top + 4) return false;
    for (let yy = y - 6; yy < y + 4; yy++) for (let xx = x - 2; xx < x + w + 2; xx++) if (K.get(xx, yy) !== -1) return false;
    return true;
  };
  for (let t = 0; t < want * 30 && L.length < want + 2; t++) {
    const b = L[Math.floor(R() * L.length)];
    const w = 8 + Math.floor(R() * 12), dy = 5 + Math.floor(R() * 4);
    const side = R() < 0.5 ? -1 : 1, gap = Math.floor(R() * 10) - 3;
    const x = Math.round(side < 0 ? b.x - gap - w : b.x + b.w + gap), y = b.y - dy;
    if (!fits(x, y, w)) continue;
    // 두께: 넓은 턱은 아래로 처진 종유 바위
    K.rock(x, y, x + w, y + 2);
    w >= 14 && K.rock(x + 3, y + 2, x + w - 3, y + 3 + Math.floor(R() * 2));
    L.push({ x, w, y });
  }
}
function dripstone(K) {
  const { NX, R } = K;
  const EN = 600;
  // ── 가운데 대공동 + 사원 ──
  const CX0 = 372, CX1 = 716, CT = 236, CF = 800;
  K.sell((CX0 + CX1) / 2, (CT + CF) / 2, (CX1 - CX0) / 2, (CF - CT) / 2, 4, -1, 0.03);
  K.air(CX0 + 14, CF - 10, CX1 - 14, CF);
  K.rock(CX0, CF, CX1, CF + 6);
  // 호수
  K.air(420, CF - 2, 668, CF + 22), K.rock(420, CF + 22, 668, CF + 26);
  K.water(420, CF, 668, CF + 22);
  // 사원 (벽돌): 탑 + 6층, 아래 두 층은 물에 잠김
  const TX0 = 484, TX1 = 604, TF = [330, 404, 474, 544, 614, 684, 754];
  K.rock(TX0, 300, TX1, CF + 22);
  K.mat(TX0, 280, TX1, CF + 22, "brick");
  K.rock(TX0 + 34, 280, TX1 - 34, 300);
  for (let i = 1; i < TF.length; i++) {
    const f = TF[i], h = f - TF[i - 1] - 8;
    K.air(TX0 + 6, f - h, TX1 - 6, f);
    K.wall(TX0 + 6, f - h, TX1 - 6, f, "brick");
    for (let x = TX0 + 18; x < TX1 - 14; x += 22) K.wall(x, f - h, x + 3, f, "stem");
    i >= 5 && K.water(TX0 + 6, f - (i === 6 ? h - 2 : 6), TX1 - 6, f);
    K.tag(TX0 + 6, f - h, TX1 - 6, f, i === 3 ? "treasure" : i === 1 ? "rest" : "arena");
    // 층 사이 세로 물길 (번갈아 양쪽) — 헤엄쳐 오른다
    const x = i === 1 ? 530 : i % 2 ? TX0 + 12 : TX1 - 16;
    K.fallw(x, TF[i - 1] - 2, x + 4, f);
    K.plank(x, x + 4, TF[i - 1]);
  }
  // 탑 꼭대기 방 (▲)
  K.air(TX0 + 36, 310, TX1 - 36, 330), K.wall(TX0 + 36, 310, TX1 - 36, 330, "brick");
  K.peak(544, 330);
  // 사원 양옆 문 (3·5층) → 대공동 바위 턱
  for (const f of [TF[3], TF[5]]) {
    K.air(TX0 - 2, f - 8, TX0 + 7, f), K.air(TX1 - 7, f - 8, TX1 + 2, f);
    // 문 밖 발코니 턱
    K.rock(TX0 - 16, f, TX0, f + 3), K.rock(TX1, f, TX1 + 16, f + 3);
    K.mat(TX0 - 16, f, TX0, f + 3, "brick"), K.mat(TX1, f, TX1 + 16, f + 3, "brick");
  }
  // 대공동 바위 턱 (사원 양옆)
  ledges(K, CX0 + 8, TX0 - 4, CF, CT + 30, R);
  ledges(K, TX1 + 4, CX1 - 8, CF, CT + 30, R);
  for (const x of [400, 440, 640, 690]) K.fall(x, x + 3, CT + 20, CF);
  // 대공동 옆문: 서·동 벽 네 높이
  const fixed = [];
  for (const [i, f] of [[0, 360], [1, 480], [2, 620], [3, 760]]) {
    const w = (CX1 - CX0) / 2, dy = (f - (CT + CF) / 2) / ((CF - CT) / 2), half = Math.round(w * Math.sqrt(Math.max(0, 1 - dy * dy)));
    const xl = Math.round((CX0 + CX1) / 2 - half), xr = Math.round((CX0 + CX1) / 2 + half);
    K.air(xl - 6, f - 9, xl + 14, f), K.rock(xl - 6, f, xl + 14, f + 3);
    K.air(xr - 14, f - 9, xr + 6, f), K.rock(xr - 14, f, xr + 6, f + 3);
    fixed.push({ id: "CW" + i, x0: xl - 34, x1: xl - 6, f, h: 10, type: "door" }, { id: "CE" + i, x0: xr + 6, x1: xr + 34, f, h: 10, type: "door" });
  }
  fixed.push({ id: "EL", x0: 0, x1: 34, f: EN, h: 10, type: "door" }, { id: "ER", x0: NX - 34, x1: NX, f: EN, h: 10, type: "door" }, { id: "DP", x0: 392, x1: 440, f: 1012, h: 14, type: "grotto" });
  network(K, {
    fixed, n: 150, margin: 6, top: 30, bot: 1032, vw: 1.3, extra: 2, maxLen: 120, loopP: 0.8, tries: 14000,
    reserve: [{ x0: CX0 - 8, x1: CX1 + 8, f: CF + 30, h: CF - CT + 40 }],
    pick: picker(R, [["cavern", 3, [90, 170], [50, 90]], ["grotto", 8, [20, 46], [12, 20]], ["lake", 2, [60, 110], [22, 32]], ["chimney", 2, [14, 20], [50, 80]], ["gallery", 3, [50, 100], [12, 16]]]),
    shape(K, r) {
      if (r.type === "door") return void K.air(r.x0, r.f - r.h, r.x1, r.f);
      if (r.type === "chimney") {
        K.air(r.x0, r.f - r.h, r.x1, r.f);
        for (let y = r.f - r.h; y < r.f; y++) {
          const v = Math.round(Math.sin(y * 0.2 + r.x0) * 1.5);
          v > 0 ? K.air(r.x1, y, r.x1 + v, y + 1) : K.rock(r.x1 + v, y, r.x1, y + 1);
        }
        return;
      }
      if (r.type === "cavern" || r.type === "lake") {
        K.sell(r.cx, r.f - r.h * 0.5, (r.x1 - r.x0) / 2, r.h * 0.52, 3.2, -1, 0.03);
        K.rock(r.x0 - 3, r.f, r.x1 + 3, r.f + 5);
        K.air(r.x0, r.f - 8, r.x1, r.f);
        return;
      }
      roundRoom(K, r, 0.12);
    },
    link(K, a, b, kind) {
      const h = 9 + Math.floor(K.R() * 3);
      if (kind === "h") return void tube(K, a, b, h, 1);
      const vert = (x, up, lo) => {
        if (lo - up < 70 && K.R() < 0.35) {
          K.air(x - 3, up - 1, x + 3, lo);
          K.geyser(x - 3, x + 3, up - 4, lo, { tint: 0xa8e0ff, pow: 560 });
        } else {
          K.fallw(x - 2, up - 2, x + 2, lo);
          K.plank(x - 2, x + 2, up);
        }
      };
      if (kind === "v") return void vert(a.x, a.f, b.f);
      const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
      K.wiggle([[a.x, a.f], [mx + 4, a.f]], h, 1);
      K.wiggle([[mx - 3, b.f], [b.x + 1, b.f]], h, 1);
      vert(mx, Math.min(a.f, b.f), Math.max(a.f, b.f));
    },
    inside(K, r) {
      const R = K.R, top = r.f - Math.round(r.h * 1.05);
      if (r.type === "cavern") {
        ledges(K, r.x0 + 6, r.x1 - 6, r.f, top + 4, R);
        const pw = Math.round((r.x1 - r.x0) * 0.22), cx = Math.round(r.cx);
        K.air(cx - pw, r.f, cx + pw, r.f + 6), K.water(cx - pw, r.f, cx + pw, r.f + 6);
        for (let x = r.x0 + 12; x < r.x1 - 12; x += 24) R() < 0.4 && K.fall(x, x + 3, top + 3, r.f);
        R() < 0.5 && K.geyser(cx - 3, cx + 3, top + 10, r.f, { tint: 0xa8e0ff, pow: 600 });
        K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.5 ? "vista" : "arena");
      } else if (r.type === "lake") {
        const a = r.x0 + 6, b = r.x1 - 6;
        K.air(a, r.f, b, r.f + 10), K.water(a, r.f - 2, b, r.f + 10);
        // 물 위 섬 턱
        for (let x = a + 8; x < b - 10; x += 18 + Math.floor(R() * 8)) K.rock(x, r.f - 3, x + 7, r.f + 10);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
      } else if (r.type === "chimney") {
        // 폭포 굴뚝: 한쪽 세로 물기둥으로 헤엄쳐 오르면 꼭대기 턱
        K.fallw(r.x0 + 1, r.f - r.h + 6, r.x0 + 5, r.f);
        K.rock(r.x0 + 6, r.f - r.h + 8, r.x1, r.f - r.h + 11);
        K.tag(r.x0 + 6, r.f - r.h, r.x1, r.f - r.h + 8, "treasure");
      } else if (r.type === "grotto") {
        R() < 0.3 && r.deg === 1 && (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
        K.tag(r.x0, r.f - r.h, r.x1, r.f, r.deg === 1 ? "treasure" : R() < 0.5 ? "rest" : "arena");
      } else if (r.type === "gallery") {
        for (let x = r.x0 + 8; x < r.x1 - 8; x += 18) R() < 0.35 && K.fall(x, x + 3, top + 2, r.f);
        K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
      }
    },
  });
  K.deep(416, 1012);
}

// ── 하늘 공통: 두 받침 잇기 (돌다리·판자 다리·낡은 출렁다리 / 사다리·승강기 / 짚라인+바람) ──
function skyVert(K, x, up, lo, how) {
  // 위 받침을 뚫고 아래 받침까지
  K.air(x - 1, up, x + 2, lo);
  if (how === "lift" && lo - up > 50) {
    K.air(x - 4, up - 1, x + 4, lo);
    K.lift(x - 3, x + 3, up, lo, up - 10);
    return;
  }
  K.plank(x - 1, x + 2, up);
  how === "vine" ? K.ladder(x, up, lo, "vine") : how === "rope" ? K.rope(x, up - 3, lo) : K.ladder(x, up, lo);
}
// 짚라인으로 내려가고, 아래 받침 옆 바람 기둥으로 다시 올라온다
function zipWind(K, up, lo, m) {
  const dir = Math.sign(lo.x - up.x) || 1;
  K.zip(up.x + dir * 1, up.f - 3, lo.x - dir * 2, lo.f - 3);
  // 바람 기둥: 위 받침 끝 바로 바깥, 아래에 작은 착지판 (아래 받침까지 이어짐)
  const wx = up.x + dir * 3;
  K.stairway(wx, lo.f, lo.x, lo.f, 2, m);
  const w0 = dir > 0 ? wx : wx - 5;
  K.wind(w0, w0 + 5, up.f - 6, lo.f);
}
function skyLink(K, a, b, kind, opt) {
  const R = K.R, m = opt.mat;
  if (kind === "h") {
    const dy = Math.abs(b.f - a.f), u = R();
    if (dy <= 2 && u < opt.plankP) {
      // 판자 다리 (낡은 것은 무너지는 판이 섞인 출렁다리)
      const old = R() < opt.oldP;
      for (let x = a.x; x <= b.x; x += 6) {
        const f = Math.round(a.f + ((b.f - a.f) * (x - a.x)) / Math.max(1, b.x - a.x));
        old && (x / 6) % 3 === 1 ? K.crumble(x, Math.min(b.x + 1, x + 6), f) : K.plank(x, Math.min(b.x + 1, x + 6), f);
      }
    } else if (opt.stones && R() < opt.stones) {
      // 디딤돌 (한 번 뛰어 닿는 틈), 가끔 무너지는 돌
      const n = Math.max(1, Math.round((b.x - a.x) / 15));
      for (let i = 1; i < n; i++) {
        const x = Math.round(a.x + ((b.x - a.x) * i) / n) - 4, f = Math.round(a.f + ((b.f - a.f) * i) / n);
        R() < 0.25 ? K.crumble(x, x + 9, f) : (K.rock(x, f, x + 9, f + 3), m && K.mat(x, f, x + 9, f + 3, m));
      }
      if (n === 1) K.stairway(a.x, a.f, b.x, b.f, 2, m);
    } else {
      K.stairway(a.x, a.f, b.x, b.f, 2, m);
      // 긴 돌다리는 아래 아치 기둥
      if (opt.arches && b.x - a.x > 40) for (let x = a.x + 16; x < b.x - 10; x += 22) {
        const f = Math.round(a.f + ((b.f - a.f) * (x - a.x)) / (b.x - a.x));
        K.rock(x, f + 2, x + 3, f + 9), m && K.mat(x, f + 2, x + 3, f + 9, m);
      }
    }
    return;
  }
  if (kind === "v") return void skyVert(K, a.x, a.f, b.f, R() < opt.liftP ? "lift" : opt.vert);
  const [up, lo] = a.f < b.f ? [a, b] : [b, a];
  if (R() < opt.zipP && Math.abs(b.x - a.x) > 16) return void zipWind(K, up, lo, m);
  const mx = a.x + 3 + Math.floor(R() * Math.max(1, b.x - a.x - 6));
  K.stairway(a.x, a.f, mx + 2, a.f, 2, m);
  K.stairway(mx - 1, b.f, b.x, b.f, 2, m);
  skyVert(K, mx, up.f, lo.f, R() < opt.liftP ? "lift" : opt.vert);
}

// ══════════════════════════════════════════════════════════════
// 스톤브리지 「공중 도시」: 하늘 전체에 떠 있는 벽돌 도시
//   꼭대기 가운데 성(층마다 사다리, 맨 위 = ▲) · 집(안에 사다리로 지붕), 탑(층층 마루·사다리/승강기), 광장, 정원, 무너진 폐허
//   다리: 돌다리(아치 기둥) · 판자 다리 · 낡은 출렁다리(무너지는 판) / 세로: 사다리·승강기 / 짚라인으로 내려가고 바람 기둥으로 올라온다
// ══════════════════════════════════════════════════════════════
function stonebridge(K, o) {
  const { NX, R } = K;
  const BF = Math.round(o.base / 8);
  // 성
  const CX0 = 470, CX1 = 620, CF = [100, 150, 200];
  K.rock(CX0, 64, CX1, 210), K.mat(CX0, 56, CX1, 226, "brick");
  K.belly(CX0, CX1, 210, 40, "brick");
  for (let i = 0; i < CF.length; i++) {
    const f = CF[i], h = f - (i ? CF[i - 1] : 64) - 6;
    K.air(CX0 + 4, f - h, CX1 - 4, f), K.wall(CX0 + 4, f - h, CX1 - 4, f, "brick");
    for (let x = CX0 + 20; x < CX1 - 16; x += 26) K.wall(x, f - h, x + 3, f, "stem");
    K.tag(CX0 + 4, f - h, CX1 - 4, f, i === 0 ? "rest" : "arena");
    if (i) {
      const x = i % 2 ? CX0 + 14 : CX1 - 16;
      K.air(x - 1, CF[i - 1], x + 2, f - h), K.plank(x - 1, x + 2, CF[i - 1]), K.ladder(x, CF[i - 1], f);
    }
  }
  // 성가퀴 + 망루
  for (let x = CX0; x < CX1; x += 8) K.rock(x, 58, x + 4, 64);
  K.peak(544, 100);
  K.air(CX0 - 2, 193, CX0 + 4, 200), K.air(CX1 - 4, 193, CX1 + 2, 200);
  const fixed = [
    { id: "EL", x0: 0, x1: 40, f: BF, h: 10, type: "ground" }, { id: "ER", x0: NX - 40, x1: NX, f: BF, h: 10, type: "ground" },
    { id: "G1", x0: 230, x1: 270, f: BF, h: 10, type: "ground" }, { id: "G2", x0: 700, x1: 740, f: BF, h: 10, type: "ground" },
    { id: "CW", x0: CX0 - 46, x1: CX0 - 2, f: 200, h: 10, type: "plaza" }, { id: "CE", x0: CX1 + 2, x1: CX1 + 46, f: 200, h: 10, type: "plaza" },
  ];
  const rooms = network(K, {
    fixed, n: 120, margin: 7, top: 40, bot: BF - 30, vw: 1.2, extra: 2, maxLen: 110, loopP: 0.75, tries: 12000,
    reserve: [{ x0: CX0 - 4, x1: CX1 + 4, f: 252, h: 200 }],
    pick: (() => {
      const pk = picker(R, [["house", 6, [24, 44], [12, 18]], ["tower", 3, [16, 24], [40, 66]], ["plaza", 3, [44, 84], [10, 12]], ["garden", 2, [40, 70], [10, 12]], ["ruin", 2, [30, 50], [12, 20]]]);
      return () => {
        const q = pk();
        q.below = 14;
        return q;
      };
    })(),
    shape(K, r) {
      if (r.type === "ground") return;
      const w = r.x1 - r.x0, m = r.type === "garden" ? "leaf" : "brick";
      K.slab(r.x0 - 3, r.x1 + 3, r.f, 3, "brick");
      K.belly(r.x0 - 3, r.x1 + 3, r.f + 3, Math.min(14, Math.round(w / 3)), "brick");
      r.type === "garden" && K.mat(r.x0 - 3, r.f, r.x1 + 3, r.f + 1, "leaf");
      if (r.type === "house" || r.type === "tower") {
        const top = r.f - r.h;
        K.rock(r.x0 - 2, top - 3, r.x0, r.f), K.rock(r.x1, top - 3, r.x1 + 2, r.f), K.rock(r.x0 - 2, top - 3, r.x1 + 2, top);
        K.mat(r.x0 - 2, top - 3, r.x1 + 2, r.f, m);
        K.air(r.x0 - 2, r.f - 7, r.x0, r.f), K.air(r.x1, r.f - 7, r.x1 + 2, r.f);
        K.wall(r.x0, top, r.x1, r.f, "brick");
        // 지붕 성가퀴
        for (let x = r.x0 - 2; x < r.x1 + 2; x += 6) K.rock(x, top - 5, x + 3, top - 3), K.mat(x, top - 5, x + 3, top - 3, m);
        // 안: 탑은 층층 마루 + 사다리, 집은 지붕으로 오르는 사다리
        let y = r.f, side = R() < 0.5;
        const step = r.type === "tower" ? 11 : r.h + 3;
        while (y - step >= top - 3) {
          const ny = y - step, lx = side ? r.x0 + 2 : r.x1 - 3;
          if (ny > top) K.plank(r.x0, r.x1, ny);
          K.air(lx - 1, ny, lx + 2, ny + 1), K.plank(lx - 1, lx + 2, ny);
          K.ladder(lx, ny, y);
          y = ny, (side = !side);
        }
      } else if (r.type === "ruin") {
        // 무너진 폐허: 바닥 일부가 무너지는 판, 부서진 벽 토막
        const a = r.x0 + 6, b = r.x1 - 6;
        K.air(a, r.f, b, r.f + 3);
        for (let x = a; x < b; x += 8) K.crumble(x, Math.min(b, x + 6), r.f);
        K.rock(r.x0 - 2, r.f - 9, r.x0, r.f - 7), K.rock(r.x1, r.f - 12, r.x1 + 2, r.f - 7);
      } else if (r.type === "plaza" && w > 50) {
        const cx = Math.round(r.cx);
        K.rock(cx - 6, r.f - 1, cx + 6, r.f), K.air(cx - 5, r.f, cx + 5, r.f + 2), K.water(cx - 5, r.f, cx + 5, r.f + 2);
      }
    },
    link(K, a, b, kind) {
      skyLink(K, a, b, kind, { mat: "brick", plankP: 0.4, oldP: 0.4, stones: 0, arches: 1, liftP: 0.3, vert: "ladder", zipP: 0.45 });
    },
    inside(K, r) {
      if (r.type === "ground") return;
      K.tag(r.x0, r.f - Math.min(r.h, 14), r.x1, r.f, r.type === "tower" || r.type === "ruin" ? "arena" : r.type === "garden" ? "rest" : R() < 0.3 ? "treasure" : "arena");
    },
  });
  return rooms;
}

// ══════════════════════════════════════════════════════════════
// 그린스텝 「떠 있는 산」: 거꾸로 선 산 모양 섬이 하늘 가득한 군도 + 가운데 거대한 떠 있는 산(걸어 오르는 비탈, 산속 굴, 꼭대기 = ▲)
//   섬: 작은 섬 · 굴 뚫린 큰 섬(위 구멍 덩굴로 내려가 보물) · 바위 첨탑(옆 턱으로 오른다) · 구름 둑(밑에서 뚫고 오른다)
//   잇기: 디딤돌(가끔 무너지는 돌)·구름 다리 / 섬을 뚫고 늘어진 덩굴 / 짚라인으로 내려가고 바람 기둥으로 올라온다
// ══════════════════════════════════════════════════════════════
function greenstep(K, o) {
  const { NX, R } = K;
  const BF = Math.round(o.base / 8);
  // 가운데 떠 있는 산: 밑변 330칸 (줄 330) → 꼭대기 40칸 (줄 110), 비탈은 기울기 1 이하라 걸어 오른다
  const MX = 544, MB = 320, MT = 150;
  const hwAt = (y) => 20 + (y - MT) * 1.2;
  for (let y = MT; y <= MB; y++) K.rock(Math.round(MX - hwAt(y)), y, Math.round(MX + hwAt(y)), y + 1);
  K.belly(MX - 224, MX + 224, MB, 100);
  K.peak(MX, MT);
  // 산속 굴: 서쪽 비탈에서 들어가 동쪽 비탈로 빠지는 굽은 굴 + 가운데 보물 방 (꼭대기 옆 구멍으로 바람 타고 나온다)
  K.wiggle([[Math.round(MX - hwAt(306)) + 1, 306], [MX - 44, 262], [MX + 44, 262], [Math.round(MX + hwAt(306)) - 1, 306]], 8, 1.2, "rock");
  K.ell(MX, 250, 30, 11);
  K.wall(MX - 30, 238, MX + 30, 262, "rock"), K.wall(MX + 10, MT + 6, MX + 16, 254, "rock");
  K.rock(MX - 30, 262, MX + 30, 266), K.air(MX - 28, 254, MX + 28, 262);
  K.tag(MX - 28, 240, MX + 28, 262, "treasure");
  K.air(MX + 10, MT + 6, MX + 16, 254);
  K.wind(MX + 10, MX + 16, MT - 4, 262);
  const fixed = [
    { id: "EL", x0: 0, x1: 40, f: BF, h: 10, type: "ground" }, { id: "ER", x0: NX - 40, x1: NX, f: BF, h: 10, type: "ground" },
    { id: "G1", x0: 300, x1: 340, f: BF, h: 10, type: "ground" }, { id: "G2", x0: 760, x1: 800, f: BF, h: 10, type: "ground" },
    { id: "ML", x0: MX - 252, x1: MX - 225, f: MB, h: 10, type: "ledge" }, { id: "MR", x0: MX + 225, x1: MX + 252, f: MB, h: 10, type: "ledge" },
  ];
  network(K, {
    fixed, n: 110, margin: 8, top: 60, bot: BF - 40, vw: 1.2, extra: 2, maxLen: 110, loopP: 0.8, tries: 12000,
    reserve: [{ x0: MX - 232, x1: MX + 232, f: MB + 100, h: MB + 100 - MT + 10 }],
    pick: (() => {
      const pk = picker(R, [["isle", 8, [22, 56], [10, 14]], ["mesa", 3, [60, 100], [10, 14]], ["spire", 2, [12, 18], [12, 14]], ["cloud", 2, [36, 70], [8, 10]]]);
      return () => {
        const q = pk();
        q.below = q.type === "cloud" ? 3 : q.type === "spire" ? 50 : Math.round(q.w * 0.45);
        return q;
      };
    })(),
    shape(K, r) {
      if (r.type === "ground") return;
      const w = r.x1 - r.x0;
      if (r.type === "cloud") return void K.cloud(r.x0, r.x1, r.f);
      if (r.type === "ledge") return void K.slab(r.x0, r.x1 + 4, r.f, 3);
      if (r.type === "spire") {
        // 바위 첨탑: 꼭대기 받침 + 아래로 긴 기둥, 옆에 엇갈린 턱
        K.slab(r.x0 - 4, r.x1 + 4, r.f, 3);
        K.rock(r.x0 + 2, r.f + 3, r.x1 - 2, r.f + 50);
        for (let y = r.f + 8, i = 0; y < r.f + 48; y += 7, i++) i % 2 ? K.rock(r.x1 - 2, y, r.x1 + 8, y + 3) : K.rock(r.x0 - 8, y, r.x0 + 2, y + 3);
        return;
      }
      K.slab(r.x0, r.x1, r.f, 3);
      K.belly(r.x0, r.x1, r.f + 3, Math.round(w * 0.42));
      if (r.type === "mesa") {
        // 굴 뚫린 큰 섬: 위 구멍으로 덩굴 타고 내려가면 섬 속 방
        const cx = Math.round(r.cx);
        K.air(cx - 18, r.f + 6, cx + 18, r.f + 15), K.air(cx - 1, r.f, cx + 2, r.f + 6);
        K.plank(cx - 1, cx + 2, r.f), K.ladder(cx, r.f, r.f + 15, "vine");
        K.tag(cx - 18, r.f + 6, cx + 18, r.f + 15, "treasure");
      }
    },
    link(K, a, b, kind) {
      skyLink(K, a, b, kind, { mat: null, plankP: 0.15, oldP: 0, stones: 0.85, arches: 0, liftP: 0, vert: "vine", zipP: 0.45 });
    },
    inside(K, r) {
      if (r.type === "ground" || r.type === "ledge") return;
      K.tag(r.x0, r.f - 12, r.x1, r.f, r.type === "mesa" ? "arena" : R() < 0.3 ? "rest" : "arena");
    },
  });
}

// ══════════════════════════════════════════════════════════════
// 리프크라운 「세계수」: 기초 땅에서 하늘 꼭대기까지 한 그루
//   줄기 속: 층마다 자리가 다른 방 (덩굴 벽·밧줄로 오른다), 맨 위 수관 = ▲
//   가지: 층마다 양쪽으로 갈라져 뻗고(위는 걷는 길), 다시 위로 잔가지가 갈라진다, 끝마다 잎 덤불(위에 튕김 잎)
//   가지 사이: 늘어진 덩굴(위아래) · 가지 끝에서 다른 가지로 짚라인 · 뿌리 둘레 꽃가루 바람
// ══════════════════════════════════════════════════════════════
function leafcrown(K, o) {
  const { NX, R } = K;
  const BF = Math.round(o.base / 8);
  const TX0 = 496, TX1 = 592;
  K.rock(TX0, 60, TX1, BF), K.mat(TX0, 60, TX1, BF, "wood");
  // 뿌리 퍼짐 (기초 땅 위)
  for (let k = 0; k < 6; k++) K.stairway(TX0 - 40 + k * 4, BF - 1, TX0, BF - 6 - k * 3, 2, "wood"), K.stairway(TX1, BF - 6 - k * 3, TX1 + 40 - k * 4, BF - 1, 2, "wood");
  // 줄기 속 방 + 가지 높이
  const FL = [[110, 0], [170, 1], [228, 2], [290, 0], [352, 1], [410, 2], [470, 0], [534, 1], [596, 2], [660, 0], [722, 1], [786, 2], [850, 0], [912, 1], [BF, 0]];
  const span = (k) => (k === 0 ? [TX0 + 6, TX1 - 6] : k === 1 ? [TX0 + 6, TX0 + 60] : [TX1 - 60, TX1 - 6]);
  let prevF = 70;
  const branchF = [];
  FL.forEach(([f, k], i) => {
    const [a, b] = span(k), h = Math.min(f - prevF - 5, 40);
    K.air(a, f - h, b, f), K.wall(a, f - h, b, f, "wood");
    i > 0 && K.vine(i % 2 ? a : b - 3, i % 2 ? a + 3 : b, f - h, f);
    K.tag(a, f - h, b, f, i === 0 ? "rest" : i % 3 === 1 ? "treasure" : "arena");
    if (i > 0) {
      const [pa, pb] = span(FL[i - 1][1]), x = Math.round((Math.max(a, pa) + Math.min(b, pb)) / 2) + (i % 3) * 4 - 4;
      K.air(x - 2, prevF, x + 2, f - h + 1), K.plank(x - 2, x + 2, prevF), K.rope(x, prevF - 3, f);
    }
    // 바깥 문 (가지 나가는 자리)
    if (f < BF) {
      k !== 2 && (K.air(TX0 - 1, f - 8, TX0 + 7, f), branchF.push([f, -1]));
      k !== 1 && (K.air(TX1 - 7, f - 8, TX1 + 1, f), branchF.push([f, 1]));
    } else K.air(TX0 - 1, f - 9, TX1 + 1, f);
    prevF = f;
  });
  K.peak(544, 110);
  // 수관 꼭대기 잎 지붕
  K.ell(544, 58, 90, 18, 1), K.mat(450, 36, 640, 78, "leaf"), K.air(TX0 + 6, 70, TX1 - 6, 110);
  // 가지: 문에서 뻗어 나가며 살짝 오르내리고, 잔가지가 위로 갈라진다
  const tips = [];
  const grow = (x, f, dir, len, depth) => {
    let cx = x, cf = f;
    const pts = [];
    for (let s = 0; s < len; s++) {
      cx += dir;
      if (cx < 8 || cx > NX - 8) break;
      // 6칸마다 한 칸씩 위아래 (걸어서 간다)
      s % 6 === 5 && (cf += R() < 0.62 ? -1 : 1);
      const t = depth === 0 ? 5 : 3;
      K.rock(cx, cf, cx + 1, cf + t), K.mat(cx, cf, cx + 1, cf + t, "wood");
      pts.push([cx, cf]);
      // 잔가지: 위로 비스듬히 (기울기 1 이하)
      if (depth < 2 && s > 20 && s % 37 === 0 && R() < 0.75) {
        let sx = cx, sf = cf;
        const sl = 18 + Math.floor(R() * 26);
        for (let j = 0; j < sl; j++) {
          (sx += dir), j % 2 === 1 && (sf -= 1);
          if (sx < 8 || sx > NX - 8 || sf < 30) break;
          K.rock(sx, sf, sx + 1, sf + 3), K.mat(sx, sf, sx + 1, sf + 3, "wood");
        }
        grow(sx, sf, dir, 20 + Math.floor(R() * 60), depth + 1);
      }
    }
    if (pts.length) tips.push({ x: cx, f: cf, dir, depth });
    // 가지 밑으로 늘어진 덩굴 (아래 가지에 닿게 길게)
    for (let i = 24; i < pts.length; i += 40 + Math.floor(R() * 30)) {
      const [vx, vf] = pts[i], t = depth === 0 ? 5 : 3;
      K.air(vx - 1, vf, vx + 2, vf + t), K.plank(vx - 1, vx + 2, vf);
      K.vine(vx - 1, vx + 2, vf - 3, Math.min(BF, vf + 50 + Math.floor(R() * 40)));
    }
    return pts;
  };
  for (const [f, dir] of branchF) grow(dir < 0 ? TX0 : TX1 - 1, f, dir, 160 + Math.floor(R() * 260), 0);
  // 가지 끝 잎 덤불 (위는 걷는 잎, 가운데 튕김 잎)
  for (const t of tips) {
    const cx = t.x + t.dir * 6, w = t.depth === 0 ? 26 : 18;
    K.ell(cx, t.f - 2, w, 7, 1, 0.12), K.mat(cx - w - 2, t.f - 10, cx + w + 2, t.f + 6, "leaf");
    K.air(cx - w, t.f - 20, cx + w, t.f - 7);
    K.rock(cx - w + 2, t.f - 7, cx + w - 2, t.f - 5), K.mat(cx - w + 2, t.f - 7, cx + w - 2, t.f - 5, "leaf");
    R() < 0.5 && K.bounce(cx - 3, cx + 3, t.f - 7);
    K.tag(cx - w, t.f - 20, cx + w, t.f - 7, R() < 0.25 ? "treasure" : R() < 0.5 ? "rest" : "arena");
  }
  // 짚라인: 높은 가지 끝 → 반대쪽이 아닌 같은 쪽 더 낮은 가지 끝
  const T2 = tips.filter((t) => t.depth === 0).sort((p, q) => p.f - q.f);
  for (let i = 0; i + 2 < T2.length; i += 2) {
    const a = T2[i], b = T2.slice(i + 1).find((q) => q.dir === a.dir && q.f - a.f > 30 && Math.abs(q.x - a.x) > 40);
    b && K.zip(a.x, a.f - 10, b.x, b.f - 10);
  }
  // 뿌리 둘레 꽃가루 바람 (기초 땅에서 첫 가지까지)
  K.wind(TX0 - 12, TX0 - 4, FL[FL.length - 2][0] - 6, BF);
  K.wind(TX1 + 4, TX1 + 12, FL[FL.length - 3][0] - 6, BF);
}

// ══════════════════════════════════════════════════════════════
// 모스바크 「이끼 거목 숲」 (지상): 땅 위·아래를 다른 뼈대로
//   땅속: 이끼 무덤(벽돌 방·석관 기둥) · 늪(물 + 무너지는 판자 길) · 뿌리 굴 · 덩굴 숲 굴 — 덩굴 세로 굴로 오르내린다
//         지표에서 들어가는 구멍 셋 (둔덕 · 협곡 바닥 싱크홀 · 동쪽 언덕), 맨 아래 ▼
//   하늘: 거목들 위에 지은 나무 위 마을 — 발판마다 거목 줄기가 땅까지 (밑동은 지나가는 굴), 줄기 옆 사다리(높으면 나무 승강기)
//         오두막 · 망대 · 잎 지붕 발판(튕김 잎) · 출렁다리(무너지는 판) · 짚라인, 꼭대기 망대 = ▲
// ══════════════════════════════════════════════════════════════
function mossbark(K, o) {
  const { NX, R } = K;
  if (o.stage === "under") {
    const fixed = [];
    // 지표에서 내려가는 덩굴 구멍
    for (const [id, cx, f] of [["M1", 240, 712], ["M2", 556, 716], ["M3", 862, 712]]) {
      const s = o.surfRow(cx);
      K.air(cx - 2, s, cx + 2, f);
      K.plank(cx - 2, cx + 2, s);
      K.ladder(cx, s, f, "vine");
      fixed.push({ id, x0: cx - 18, x1: cx + 18, f, h: 10, type: "burrow" });
    }
    fixed.push({ id: "DP", x0: 396, x1: 436, f: 1012, h: 12, type: "crypt" });
    network(K, {
      fixed, n: 150, margin: 6, top: 704, bot: 1032, vw: 1.2, extra: 2, maxLen: 110, loopP: 0.8, tries: 12000,
      pick: picker(R, [["crypt", 4, [40, 80], [12, 16]], ["bog", 3, [50, 90], [12, 18]], ["burrow", 6, [16, 36], [11, 18]], ["hall", 4, [50, 100], [9, 12]], ["grove", 2, [30, 50], [24, 32]], ["hollow", 2, [12, 18], [9, 11]]]),
      shape(K, r) {
        if (r.type === "crypt" || r.type === "hall") {
          K.air(r.x0, r.f - r.h, r.x1, r.f);
          if (r.type === "crypt") {
            K.mat(r.x0 - 2, r.f - r.h - 2, r.x1 + 2, r.f + 2, "brick"), K.wall(r.x0, r.f - r.h, r.x1, r.f, "brick");
            for (let x = r.x0 + 8; x < r.x1 - 6; x += 12) K.wall(x, r.f - r.h, x + 2, r.f, "stem");
          } else
            for (let x = r.x0; x < r.x1; x++) {
              const v = Math.round(Math.sin(x * 0.27 + r.f) * 1.4 + Math.sin(x * 0.09) * 1.2);
              v > 0 ? K.air(x, r.f - r.h - v, x + 1, r.f - r.h) : K.rock(x, r.f - r.h, x + 1, r.f - r.h - v);
            }
          return;
        }
        roundRoom(K, r, 0.12);
      },
      link(K, a, b, kind) {
        if (kind === "h") return void tube(K, a, b, 8, 1.3);
        const vert = (x, up, lo) => (K.air(x - 2, up, x + 2, lo), K.plank(x - 2, x + 2, up), K.ladder(x, up, lo, "vine"));
        if (kind === "v") return void vert(a.x, a.f, b.f);
        const mx = a.x + 3 + Math.floor(K.R() * Math.max(1, b.x - a.x - 6));
        K.wiggle([[a.x, a.f], [mx + 4, a.f]], 8, 1);
        K.wiggle([[mx - 3, b.f], [b.x + 1, b.f]], 8, 1);
        vert(mx, Math.min(a.f, b.f), Math.max(a.f, b.f));
      },
      inside(K, r) {
        const R = K.R, top = r.f - Math.round(r.h * 1.05);
        if (r.type === "crypt") {
          // 석관 (낮은 돌 상자, 넘어 다닌다)
          for (let x = r.x0 + 4; x < r.x1 - 10; x += 14) R() < 0.6 && (K.rock(x, r.f - 2, x + 7, r.f), K.mat(x, r.f - 2, x + 7, r.f, "brick"));
          K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.3 ? "treasure" : "arena");
        } else if (r.type === "bog") {
          const a = r.x0 + 5, b = r.x1 - 5;
          K.air(a, r.f, b, r.f + 6), K.water(a, r.f, b, r.f + 6);
          for (let x = a; x < b; x += 10) R() < 0.35 ? K.crumble(x, Math.min(b, x + 7), r.f) : K.plank(x, Math.min(b, x + 7), r.f);
          K.tag(r.x0, r.f - r.h, r.x1, r.f, "arena");
        } else if (r.type === "grove") {
          for (let x = r.x0 + 5; x < r.x1 - 4; x += 7 + Math.floor(R() * 5)) {
            let y = r.f - 8;
            while (y > 2 && K.get(x, y - 1) === -1) y--;
            K.vine(x, x + 2, y, r.f - 3 - Math.floor(R() * 10));
          }
          K.tag(r.x0, r.f - r.h, r.x1, r.f, "rest");
        } else if (r.type === "hollow") {
          K.wall(r.x0, r.f - r.h, r.x1, r.f, "wood");
          if (r.deg === 1) (K.crack(r.x0, r.f - 7, r.x0 + 3, r.f), K.crack(r.x1 - 3, r.f - 7, r.x1, r.f));
          K.tag(r.x0, r.f - r.h, r.x1, r.f, "treasure");
        } else K.tag(r.x0, r.f - r.h, r.x1, r.f, R() < 0.5 ? "arena" : "rest");
      },
    });
    K.deep(416, 1012);
    return;
  }
  // ── 하늘: 나무 위 마을 ──
  const fixed = [{ id: "PK", x0: 524, x1: 564, f: 96, h: 12, type: "nest" }];
  const trunks = [];
  const rooms = network(K, {
    fixed, n: 70, margin: 8, top: 60, bot: 500, vw: 1.2, extra: 2, maxLen: 120, loopP: 0.8, tries: 10000,
    pick: picker(R, [["hut", 5, [24, 40], [12, 14]], ["deck", 4, [30, 60], [10, 12]], ["nest", 2, [16, 24], [10, 12]], ["canopy", 3, [50, 90], [10, 12]]]),
    shape(K, r) {
      const m = r.type === "canopy" ? "leaf" : "wood";
      K.slab(r.x0 - 3, r.x1 + 3, r.f, 3, m);
      // 거목 줄기: 발판 가운데에서 땅까지, 밑동은 지나가는 굴
      const cx = Math.round(r.cx), s = o.surfRow(cx), tw = r.type === "deck" ? 7 : 9;
      // 줄기는 큰 발판에만, 서로 70칸 넘게 떨어져서 — 나머지는 수관 덤불 (잎 배 + 늘어진 덩굴)
      const trunk = r.type !== "nest" && trunks.every((t) => Math.abs(t - cx) > 70) && K.R() < 0.85;
      if (!trunk) {
        K.belly(r.x0 - 3, r.x1 + 3, r.f + 3, 7, "leaf");
        for (let x = r.x0 + 3; x < r.x1 - 2; x += 9 + Math.floor(K.R() * 6)) K.R() < 0.5 && K.vine(x, x + 2, r.f + 4, r.f + 18 + Math.floor(K.R() * 24));
      }
      if (trunk && s > r.f + 6) {
        trunks.push(cx);
        K.rock(cx - tw, r.f + 3, cx + tw, s + 2), K.mat(cx - tw, r.f + 3, cx + tw, s + 2, "wood");
        K.air(cx - tw - 1, s - 7, cx + tw + 1, s), K.wall(cx - tw, s - 7, cx + tw, s, "wood");
        // 줄기 옆 사다리 (아주 높으면 나무 승강기)
        const lx = cx + tw + 2;
        if (s - r.f > 150 && K.R() < 0.4) (K.air(lx - 1, r.f - 1, lx + 6, s), K.lift(lx, lx + 5, r.f, s, r.f - 10));
        else (K.air(lx - 1, r.f, lx + 2, s), K.plank(lx - 1, lx + 2, r.f), K.ladder(lx, r.f, s));
      }
      if (r.type === "hut") {
        const top = r.f - r.h;
        K.rock(r.x0, top - 2, r.x0 + 1, r.f - 7), K.rock(r.x1 - 1, top - 2, r.x1, r.f - 7), K.rock(r.x0 - 2, top - 3, r.x1 + 2, top);
        K.mat(r.x0 - 2, top - 3, r.x1 + 2, r.f, "wood"), K.wall(r.x0 + 1, top, r.x1 - 1, r.f, "wood");
        K.mat(r.x0 - 4, top - 6, r.x1 + 4, top - 3, "leaf"), K.rock(r.x0 - 4, top - 6, r.x1 + 4, top - 3);
      } else if (r.type === "canopy") {
        K.mat(r.x0 - 3, r.f, r.x1 + 3, r.f + 1, "leaf");
        K.R() < 0.6 && K.bounce(Math.round(r.cx) - 3 + 14, Math.round(r.cx) + 3 + 14, r.f);
      }
    },
    link(K, a, b, kind) {
      skyLink(K, a, b, kind, { mat: "wood", plankP: 0.75, oldP: 0.35, stones: 0, arches: 0, liftP: 0.1, vert: "ladder", zipP: 0.4 });
    },
    inside(K, r) {
      K.tag(r.x0, r.f - 12, r.x1, r.f, r.type === "hut" ? (K.R() < 0.4 ? "treasure" : "rest") : "arena");
    },
  });
  K.peak(544, 96);
  return rooms;
}

export const ARCHI = { g0_1: ironveinCity, gm1_1: roothollowDeep, g1_1: dripstoneCave, g1_m1: stonebridgeCity, g0_m1: greenstepTepui, gm1_m1: leafcrownForest, gm1_0: mossbarkWood, g0_m2: lightgarden, g0_2: abyss, g1_2: fossil, gm1_2: spider, g1_m2: ashsky, g2_1: hourglass, gm2_1: mangrove, g2_m1: mirage, gm2_m1: bogsky, gm1_m2: monastery, g2_2: mirror, gm2_m2: sporesky, gm2_2: mistgrove, g2_m2: citadel, gm2_0: blackmarsh, g2_0: glassdune };
