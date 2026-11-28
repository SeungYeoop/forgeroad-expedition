// 로딩 화면: 구역 이름 · 층 · 위험도, 그 구역 색으로 칠한 시차 실루엣(지상=산과 언덕, 하늘=떠 있는 섬, 지하=동굴),
// 떠오르는 빛 알갱이, 진행 막대. 게임 장면(Run) 위에 화면 고정으로 덮는다 (HUD는 그동안 숨긴다)
const W = 640, H = 360, LW = 320; // 실루엣은 320폭으로 그려 2배로 (픽셀 느낌)
import * as UK from "./uikit.js";
import { HOOKS } from "./codex.js";
// 지역 소개 한 줄 (로딩 화면 · 2026-11-28)
const DESC = {
  g1_0: "바람이 풀을 빗질하는 초원. 갈림길 요새를 나서면 처음 만나는 땅이다.",
  g0_m1: "구름 위 탁상 고원. 목동들의 풀밭과 돌 오두막이 하늘에 떠 있다.",
  g1_m1: "옛 석공들이 하늘에 놓은 돌다리 도시. 출렁다리 아래로는 끝없는 낭떠러지다.",
  gm1_m1: "하늘까지 자란 거목들의 수관. 가지 위 오두막과 덩굴 길이 얽혀 있다.",
  gm1_0: "이끼 낀 거목 줄기 속 마을. 뿌리 사이로 오래된 길이 숨어 있다.",
  g0_1: "철을 캐던 광부들이 버린 갱도. 광맥 사이로 녹슨 수레길이 이어진다.",
  g1_1: "물방울이 천 년을 깎은 종유굴. 석회 기둥 사이로 지하 호수가 고여 있다.",
  gm1_1: "거목의 뿌리가 파고든 굴. 뿌리 덩이 사이로 버섯빛이 번진다.",
  gm2_m1: "늪이 통째로 떠오른 하늘. 늘어진 뿌리와 말뚝 마을이 흔들린다.",
  gm2_m2: "거대 버섯이 구름을 뚫고 자란 곳. 포자가 눈처럼 흩날린다.",
  gm1_m2: "이끼 덮인 첨탑 수도원. 종소리가 구름 사이로 울린다.",
  g0_m2: "빛을 기르던 유리 대온실. 깨진 유리 사이로 꽃이 하늘로 자란다.",
  g1_m2: "잿빛 하늘 섬. 꺼지지 않는 불씨가 바람에 날린다.",
  g2_m2: "호박빛 하늘 성채 앰버홀드. 본성과 결투장이 구름 위에 서 있다.",
  g2_m1: "모래 안개가 떠도는 하늘 사막. 해시계 기둥이 시간을 가리킨다.",
  g2_0: "유리처럼 빛나는 모래 언덕. 번개가 모래를 녹여 길을 낸다.",
  g2_1: "흘러내리는 모래가 시간을 재는 굴. 화석이 벽에 박혀 있다.",
  g2_2: "거울 같은 수정이 빛을 되비추는 깊은 굴. 빛줄기를 조심하라.",
  g1_2: "거대한 짐승의 뼈가 묻힌 깊은 굴. 해골이 길을 막는다.",
  g0_2: "빛이 닿지 않는 우물 밑. 그림자가 횃불을 피해 움직인다.",
  gm1_2: "거미줄이 동굴을 덮은 곳. 매달린 고치들이 숨을 쉰다.",
  gm2_2: "안개가 뿔처럼 솟는 굴. 물소리 사이로 무언가 운다.",
  gm2_1: "늪 뿌리가 얽힌 진흙 굴. 빛 실을 늘어뜨린 유충이 산다.",
  gm2_0: "검은 늪지 블랙펜. 교수목 버드나무가 가지를 늘어뜨린다.",
};
const LAYER_BAR = { sky: [0xe8f4ff, 0x8ab8e8], cave: [0xffc060, 0xc04a18], ground: [0xf0d070, 0x6a9a3a] };

const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const css = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
const hash = (a, b) => {
  let x = (a * 374761393 + b * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
// 가로로 이어지는 잡음 (LW 주기)
const pn = (x, sc, seed) => {
  const n = Math.max(1, Math.round(LW / sc)), fx = x / sc, i = Math.floor(fx), f = fx - i, u = f * f * (3 - 2 * f);
  const a = hash(((i % n) + n) % n, seed), b = hash((((i + 1) % n) + n) % n, seed);
  return a + (b - a) * u;
};

// 하늘 그라데이션 (디더링 띠)
function skyTex(sc, key, top, mid, bot, sun) {
  if (sc.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = W / 2;
  cv.height = H / 2;
  const g = cv.getContext("2d"), sx = W * 0.36, sy = H * 0.2;
  for (let y = 0; y < H / 2; y++)
    for (let x = 0; x < W / 2; x++) {
      const d = (((x * 7 + y * 13) % 16) / 16 - 0.5) / 14, t = y / (H / 2 - 1) + d;
      let c = t < 0.6 ? mix(top, mid, t / 0.6) : mix(mid, bot, (t - 0.6) / 0.4);
      const r = Math.hypot(x - sx, (y - sy) * 1.3) / 120 + d * 0.8;
      r < 1 && (c = mix(c, sun, 0.75 * Math.pow(1 - r, 2.4)));
      Math.hypot(x - sx, y - sy) < 9 && (c = mix(sun, 0xffffff, 0.35));
      g.fillStyle = css(c);
      g.fillRect(x, y, 1, 1);
    }
  sc.textures.addCanvas(key, cv);
  return key;
}
// 실루엣 띠 하나 (LW × h, 위는 투명)
function stripTex(sc, key, h, draw) {
  if (sc.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = LW;
  cv.height = h;
  draw(cv.getContext("2d"), h);
  sc.textures.addCanvas(key, cv);
  return key;
}
const col = (g, x, y0, y1, c) => {
  g.fillStyle = css(c);
  g.fillRect(x, Math.round(y0), 1, Math.max(0, Math.round(y1) - Math.round(y0)));
};
// 능선 + 꼭대기 1px 밝은 테두리
function ridge(g, h, f, c, hi) {
  for (let x = 0; x < LW; x++) {
    const y = Math.round(f(x));
    col(g, x, y, h, c);
    col(g, x, y, y + 1, hi);
  }
}
function island(g, cx, y, w, c, hi, seed) {
  const hh = Math.round(w * 0.55);
  for (let i = 0; i < w; i++) {
    const u = i / (w - 1) - 0.5, bot = y + 3 + hh * Math.pow(1 - Math.abs(u) * 2, 0.8) * (0.75 + 0.25 * hash(i, seed));
    col(g, cx + i - (w >> 1), y, bot, c);
    col(g, cx + i - (w >> 1), y, y + 1, hi);
    hash(i, seed + 3) > 0.85 && col(g, cx + i - (w >> 1), bot, bot + 2 + hash(i, seed + 4) * 8, c);
  }
}
function tree(g, x, gy, s, c) {
  g.fillStyle = css(c);
  g.fillRect(x, gy - 4 * s, 1, 4 * s);
  for (const [dx, dy, r] of [[0, -6, 3.2], [-2.2, -4.5, 2.4], [2.4, -4.6, 2.5]]) {
    const R = r * s;
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) i * i + j * j <= R * R && g.fillRect(Math.round(x + dx * s + i), Math.round(gy + dy * s + j), 1, 1);
  }
}

// 구역마다 실루엣 세 겹 (먼 → 가까운)
function strips(sc, z, pal) {
  const layer = z.y < 0 ? "sky" : z.y > 0 ? "cave" : "ground";
  const k = `ld_${layer}_${pal.far}_${pal.near}`;
  const dusk = mix(pal.sky?.[0] ?? 0x202040, 0x0a0814, 0.5), warm = mix(pal.accent ?? 0xffc080, 0xff9a60, 0.4);
  const C = [mix(mix(pal.far, dusk, 0.55), warm, 0.12), mix(pal.mid, 0x0a0814, 0.66), mix(pal.near, 0x05040a, 0.82)];
  const HI = [mix(C[0], warm, 0.35), mix(C[1], warm, 0.3), mix(C[2], warm, 0.25)];
  const out = [];
  if (layer === "ground") {
    out.push(stripTex(sc, k + "_0", 110, (g, h) => ridge(g, h, (x) => 86 - 78 * (pn(x, 60, 1) * 0.55 + pn(x, 20, 2) * 0.3 + Math.abs(pn(x, 7, 3) - 0.5) * 0.3), C[0], HI[0])));
    out.push(stripTex(sc, k + "_1", 80, (g, h) => {
      const f = (x) => 34 - 22 * (pn(x, 90, 5) * 0.75 + pn(x, 30, 6) * 0.25) + 8;
      ridge(g, h, f, C[1], HI[1]);
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(hash(i, 7) * LW);
        tree(g, x, f(x) + 2, 0.8 + hash(i, 8) * 0.6, C[1]);
      }
    }));
    out.push(stripTex(sc, k + "_2", 50, (g, h) => {
      const f = (x) => 24 - 12 * (pn(x, 60, 9) * 0.8 + pn(x, 15, 10) * 0.2) + 6;
      ridge(g, h, f, C[2], HI[2]);
      for (let x = 0; x < LW; x += 2) hash(x, 11) > 0.45 && col(g, x, f(x) - 1 - hash(x, 12) * 3, f(x), C[2]);
    }));
  } else if (layer === "sky") {
    out.push(stripTex(sc, k + "_0", 150, (g) => {
      for (let i = 0; i < 6; i++) island(g, Math.floor(hash(i, 21) * LW), 20 + hash(i, 22) * 70, 18 + hash(i, 23) * 22, C[0], HI[0], i);
    }));
    out.push(stripTex(sc, k + "_1", 140, (g) => {
      for (let i = 0; i < 4; i++) island(g, Math.floor(hash(i, 31) * LW), 30 + hash(i, 32) * 60, 34 + hash(i, 33) * 30, C[1], HI[1], i + 9);
    }));
    out.push(stripTex(sc, k + "_2", 40, (g, h) => {
      // 아래 구름 바다
      for (let x = 0; x < LW; x++) {
        const y = 14 - 10 * (pn(x, 20, 41) * 0.7 + pn(x, 7, 42) * 0.3);
        col(g, x, y, h, mix(pal.sky?.[1] ?? 0xffffff, 0xffffff, 0.3));
        col(g, x, y, y + 1, 0xffffff);
      }
    }));
  } else {
    out.push(stripTex(sc, k + "_0", 180, (g, h) => {
      // 먼 동굴 벽: 위 종유석 + 아래 석순
      for (let x = 0; x < LW; x++) {
        const t = 20 + 16 * pn(x, 25, 51) + (hash(x >> 2, 52) > 0.8 ? 18 * hash(x >> 2, 53) : 0);
        col(g, x, 0, t, C[0]);
        const b = h - 22 - 18 * pn(x, 30, 54);
        col(g, x, b, h, C[0]);
        col(g, x, b, b + 1, HI[0]);
      }
    }));
    out.push(stripTex(sc, k + "_1", 180, (g, h) => {
      for (let x = 0; x < LW; x++) {
        const t = 8 + 10 * pn(x, 40, 61) + (hash(x >> 1, 62) > 0.86 ? 26 * hash(x >> 1, 63) : 0);
        col(g, x, 0, t, C[1]);
        const b = h - 12 - 12 * pn(x, 45, 64);
        col(g, x, b, h, C[1]);
        col(g, x, b, b + 1, HI[1]);
      }
    }));
    out.push(stripTex(sc, k + "_2", 40, (g, h) => ridge(g, h, (x) => 22 - 12 * pn(x, 26, 71) + 6, C[2], HI[2])));
  }
  return { keys: out, layer };
}

export function showLoad(sc, z, R, o = {}) {
  const reg = z.reg ?? {}, pal = reg.pal ?? { sky: [0x1c1834, 0x4a4070], far: 0x3a3658, mid: 0x2a2644, near: 0x18142a, accent: 0xffe060 };
  const D = 10000, objs = [];
  const add = (x) => (objs.push(x), x.setScrollFactor(0).setDepth(D + objs.length * 0.01), x);
  const cave = z.y > 0, warm = mix(pal.accent ?? 0xffc080, 0xff9a60, 0.4);
  const top = mix(pal.sky[0], 0x05040a, 0.78), mid = mix(mix(pal.sky[0], pal.far, 0.5), 0x0a0814, 0.45), bot = cave ? mix(pal.far, 0x05040a, 0.6) : mix(warm, pal.sky[1], 0.35);
  add(sc.add.image(W / 2, H / 2, skyTex(sc, `ld_sky_${z.y > 0 ? 1 : 0}_${pal.sky[0]}_${pal.sky[1]}`, top, mid, bot, cave ? mix(pal.accent ?? 0xffe0a0, 0x000000, 0.5) : mix(warm, 0xfff0c0, 0.4))).setScale(2));
  const S = strips(sc, z, pal);
  // 실루엣 띠: 아래 끝을 맞춘다 (먼 띠는 높이, 가까운 띠는 낮게)
  const hs = S.layer === "sky" ? [150, 140, 40] : S.layer === "cave" ? [180, 180, 40] : [110, 80, 50];
  const bots = S.layer === "sky" ? [H * 0.62, H * 0.86, H] : S.layer === "cave" ? [H, H, H] : [H - 52, H - 18, H];
  const layers = S.keys.map((k, i) => add(sc.add.tileSprite(W / 2, bots[i], LW, hs[i], k).setScale(2).setOrigin(0.5, 1)));
  const speed = [4, 9, 20];
  // 떠오르는 빛 알갱이
  const motes = Array.from({ length: 36 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 14, ph: Math.random() * 6.28, s: Math.random() < 0.3 ? 2 : 1 }));
  const fx = add(sc.add.graphics());
  // ── 실제 지역 배경 (게임 안 배경 그림 · 준비되면 실루엣 위로 서서히) ──
  const bgKey = `bg_${reg.id}`, art = [];
  let artA = 0;
  reg.id && !sc.textures.exists(bgKey + "_sky") && HOOKS.bg?.(sc, reg);
  const putArt = () => {
    if (art.length || !sc.textures.exists(bgKey + "_sky") || [0, 1, 2].some((l) => !sc.textures.exists(`${bgKey}_${l}`))) return;
    art.push(sc.add.image(W / 2, H / 2, bgKey + "_sky").setDisplaySize(W, H));
    for (const l of [0, 1, 2]) art.push(sc.add.tileSprite(W / 2, H / 2, W, H, `${bgKey}_${l}`).setTilePosition(0, 120 + l * 10));
    art.forEach((o, i) => o.setScrollFactor(0).setDepth(D + 0.045 + i * 0.001).setAlpha(0));
  };
  putArt();
  art.length && (artA = 1);
  // ── 아래 정보 띠 (철 테두리 · 2026-11-28 리메이크) ──
  const D0 = R.dangerOf ? R.dangerOf(z) : null;
  const shade = add(sc.add.graphics());
  for (let i = 0; i < 16; i++) shade.fillStyle(0x05040a, 0.05 * i).fillRect(0, H - 150 + i * 6, W, 6);
  const BX = 16, BY = H - 110, BW = W - 32, BH = 98;
  add(UK.frame(sc, BX, BY, BW, BH, {}));
  // 대표 몬스터 실루엣 (띠 위에 선다)
  const ids = [];
  for (const band of Object.values(reg.layers ?? {})) for (const e of band.enemies ?? []) ids.length < 6 && !ids.includes(e.id) && ids.push(e.id);
  const shown = ids.filter((id) => sc.textures.exists(`e_${id}`)).slice(0, 3);
  shown.forEach((id, i) => {
    const im = sc.add.image(W - 70 - i * 58, BY + 2, `e_${id}`, 0).setOrigin(0.5, 1);
    im.setScale(Math.min(2, 52 / Math.max(1, im.height), 60 / Math.max(1, im.width))).setTintFill(0x07050a);
    add(im);
  });
  // 링 색 띠 + 이름 + 층·위험도 + 소개
  const ring = add(sc.add.graphics());
  ring.fillStyle(D0?.color ?? 0xc8bca0, 1).fillRect(BX + 14, BY + 14, 4, BH - 28);
  const name = add(R.ct(sc, BX + 28, BY + 7, z.name ?? "", "title", "#f6ecd2", { stroke: "#140c06", strokeThickness: 4 }));
  const sub = add(R.ct(sc, BX + 30 + name.width + 12, BY + 18, [R.layerName ? R.layerName(z.y) : "", D0 ? `${D0.name} · ${D0.label}` : ""].filter(Boolean).join("   "), "small", D0?.css ?? "#c8bca0", { stroke: "#140c06", strokeThickness: 3 }));
  add(R.ct(sc, BX + 30, BY + 48, DESC[z.id] ?? "", "tiny", "#e8dcc4", { stroke: "#140c06", strokeThickness: 2, wordWrap: { width: BW - 230, useAdvancedWrap: !0 } }));
  const orn = add(sc.add.graphics());
  const status = add(R.ct(sc, BX + 30, BY + BH - 20, "지형을 설계하는 중", "tiny", "#d8ccb0", { stroke: "#140c06", strokeThickness: 2 }).setOrigin(0, 0.5));
  const pct = add(R.ct(sc, BX + BW - 18, BY + BH - 20, "0%", "small", "#f6ecd2", { stroke: "#140c06", strokeThickness: 3 }).setOrigin(1, 0.5));
  const bar = add(sc.add.graphics());
  void sub;
  const L = {
    stage: "plan",
    t: 0,
    shown: 0,
    alpha: o.instant ? 1 : 0,
    want: 1,
    p: 0,
    shownP: 0,
    done: null,
    onOpaque: [],
    painted: 0,
    total: 1,
    setP(p) {
      L.p = Math.max(L.p, Math.min(1, p));
    },
    update(dt) {
      L.t += dt;
      L.alpha += Math.sign(L.want - L.alpha) * Math.min(Math.abs(L.want - L.alpha), dt / (L.want ? 0.22 : 0.4));
      if (L.alpha >= 1 && L.onOpaque.length) for (const f of L.onOpaque.splice(0)) f();
      // 설계 중엔 정보가 없으니 천천히 차오르게(55%까지), 그리는 중엔 실제 띠 수로
      if (L.stage === "plan") L.setP(0.55 * (1 - Math.exp(-L.t / 2.2)));
      else if (L.stage === "paint") L.setP(0.55 + 0.45 * (L.painted / Math.max(1, L.total)));
      L.shownP += (L.p - L.shownP) * Math.min(1, dt * 6);
      for (const x of objs) x.setAlpha(L.alpha);
      putArt();
      art.length && (artA = Math.min(1, artA + dt * 1.5));
      art.forEach((o, i) => (o.setAlpha(L.alpha * artA), i && (o.tilePositionX += [2, 5, 11][i - 1] * dt)));
      const hud = sc.hud?.();
      hud?.cameras?.main && hud.cameras.main.setAlpha(1 - L.alpha);
      layers.forEach((t, i) => (t.tilePositionX += speed[i] * dt * 0.5));
      fx.clear();
      for (const m of motes) {
        m.y -= m.v * dt;
        m.ph += dt * 2;
        if (m.y < -4) ((m.y = H + 4), (m.x = Math.random() * W));
        fx.fillStyle(pal.accent ?? 0xffe0a0, 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(m.ph))).fillRect(Math.round(m.x + Math.sin(m.ph * 0.7) * 6), Math.round(m.y), m.s, m.s);
      }
      // 이름 아래 장식선 (끝 마름모가 천천히 빛난다)
      const a = 0.6 + 0.4 * Math.sin(L.t * 3), ox = BX + 30, oy = BY + 42, ow = Math.min(BW - 250, name.width + 120);
      orn.clear().fillStyle(0xc8a060, 0.7).fillRect(ox, oy, ow, 1);
      orn.fillStyle(0xffe0a0, a).fillTriangle(ox + ow, oy - 3, ox + ow + 4, oy, ox + ow, oy + 4);
      // 진행 막대: 층 재질 색 (하늘 = 구름빛 · 동굴 = 불씨 · 지상 = 금빛), 칸 + 깜빡이는 끝
      const [c0, c1] = LAYER_BAR[S.layer] ?? LAYER_BAR.ground;
      const bx = BX + 150, by = BY + BH - 23, bw = BW - 220, n = Math.floor(bw / 6), fill = L.shownP * n;
      bar.clear().fillStyle(0x05040a, 0.85).fillRect(bx - 3, by - 3, bw + 6, 12).lineStyle(1, 0x8a6a3a, 0.9).strokeRect(bx - 3.5, by - 3.5, bw + 7, 13);
      for (let i = 0; i < n; i++) {
        const on = i < Math.floor(fill), edge = i === Math.floor(fill);
        if (!on && !edge) continue;
        bar.fillStyle(mix(c1, c0, i / n), edge ? 0.35 + 0.35 * Math.sin(L.t * 10) : 1).fillRect(bx + i * 6, by, 5, 6);
      }
      pct.setText(`${Math.round(L.shownP * 100)}%`);
      const dots = ".".repeat(1 + (Math.floor(L.t * 3) % 3));
      status.setText((L.stage === "plan" ? "지형을 설계하는 중" : L.stage === "paint" ? "땅을 그리는 중" : "준비 완료") + (L.stage === "ready" ? "" : dots));
      if (L.closing && L.alpha <= 0) L.destroy();
    },
    close(cb) {
      L.stage = "ready";
      L.setP(1);
      L.closing = 1;
      L.want = 0;
      cb && cb();
    },
    destroy() {
      if (L.dead) return;
      L.dead = 1;
      for (const x of objs) x.destroy();
      for (const x of art) x.destroy();
      const hud = sc.hud?.();
      hud?.cameras?.main && hud.cameras.main.setAlpha(1);
    },
  };
  for (const x of objs) x.setAlpha(L.alpha);
  return L;
}
