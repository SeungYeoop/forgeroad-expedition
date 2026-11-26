// 지역 배경 (원경 0 · 중경 1 · 근경 2) — 3D 픽셀 리메이크
import * as G from "./bg3d.js";
import { paintGrass } from "./bggrass.js";
import { paintSteppe } from "./bgsteppe.js";
import { ZBG, paintZone } from "./bgzones.js";
const W = 640, HH = 360;
const mix = (a, b, t) => {
  t = Math.max(0, Math.min(1, t));
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const sh = (c, f) => {
  const g = (s) => {
    const v = (c >> s) & 255;
    return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  };
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
export const THEME = {
  ashvillage: "plains", mistwood: "forest", echomine: "cave", rotmarsh: "marsh", blazefort: "fortress", frostgorge: "snow",
  glassdesert: "desert", thunderspire: "spire", crystalsanctum: "crystal", skyruins: "sky", shadowcapital: "abyss", forgeheart: "forge",
  grassmere: "grass",
  // 파랑 지역 (새 설계)
  mossbark: "forest", greenstep: "steppe", stonebridge: "sky", leafcrown: "sky", ironvein: "cave", dripstone: "cave", roothollow: "cave",
  // 새로 지은 20곳 전용 (bgzones.js)
  ...Object.fromEntries(Object.keys(ZBG).map((k) => [k, "zone"])),
};
const DARK = { cave: 1, abyss: 1 };

export function paintLayer3d(T, S, E, h, id) {
  if (ZBG[id]) return paintZone(T, S, E, h, id);
  const th = THEME[id] ?? (/forest|wood/.test(id) ? "forest" : "plains");
  if (th === "grass") return paintGrass(T, S, E, h);
  if (th === "steppe") return paintSteppe(T, S, E, h);
  const B = G.buffer(W, T.h ?? HH);
  const skyC = E.sky[1], seed = h.int(1, 9999);
  const R = (a, b) => h.int(a, b);
  const each = (x, fn) => [-W, 0, W].forEach((dx) => fn(x + dx));
  const hz = (k) => (c) => mix(c, skyC, k);
  if (S === 0) {
    // ── 원경 ──
    if (!DARK[th]) {
      const light = mix(skyC, 0xffffff, 0.75), shade = mix(E.sky[0], skyC, 0.35);
      for (let i = 0; i < 6; i++) {
        const x = R(0, W), y = R(50, 160), s = 0.7 + h.next() * 0.8;
        each(x, (xx) => G.cloud(B, xx, y, s, light, shade, 235, seed + i));
      }
    }
    if (th === "desert") G.dunes(B, 300, 50, mix(E.far, E.soil, 0.3), skyC, 0.35, seed);
    else {
      const snow = th === "snow" || th === "plains" || th === "sky" || th === "spire" || th === "crystal";
      G.mountains(B, { base: 300, amp: 150, col: th === "cave" || th === "abyss" ? sh(E.far, -0.2) : E.far, skyC, haze: DARK[th] ? 0.1 : 0.38, snow, seed, sc: 110 });
      G.mountains(B, { base: 315, amp: 90, col: sh(E.far, -0.12), skyC, haze: DARK[th] ? 0.05 : 0.22, snow: snow && th !== "plains", seed: seed + 50, sc: 70 });
    }
    const hzf = hz(0.3);
    if (th === "forest" || th === "marsh")
      for (let i = 0; i < 9; i++) {
        const x = R(0, W);
        each(x, (xx) => G.tree(B, xx, 312 + R(-6, 6), 2 + h.next(), sh(E.top, -0.3), sh(E.soil, -0.35), th === "marsh" ? "pine" : "round", 0.4, skyC));
      }
    if (th === "fortress" || th === "forge") {
      for (let i = 0; i < 5; i++) {
        const x = R(0, W), w = R(12, 20), hh = R(70, 130);
        each(x, (xx) => G.tower(B, xx, 312, w, hh, sh(E.rock, -0.3), sh(E.rock, -0.5), E.accent, hzf));
      }
      for (let y = 240; y < 320; y++) for (let x = 0; x < W; x++) B.put(x, y, E.accent, Math.round(40 * ((y - 240) / 80)));
    }
    if (th === "spire")
      for (let i = 0; i < 4; i++) {
        const x = R(20, W - 20), hh = R(140, 210);
        each(x, (xx) => (G.tower(B, xx, 315, 14, hh, E.rock, sh(E.accent, -0.4), E.accent, hzf), G.ball(B, xx + 7, 315 - hh - 22, 5, G.ramp5(E.accent))));
      }
    if (th === "crystal")
      for (let i = 0; i < 8; i++) {
        const x = R(0, W);
        each(x, (xx) => G.crystal(B, xx, 315, R(14, 24), R(80, 170), E.accent, hz(0.35)));
      }
    // 들판 하늘: 아주 먼 하늘섬 몇 개 (안개에 묻힌다)
    if (th === "plains")
      for (let i = 0; i < 3; i++) {
        const x = R(0, W), y = R(80, 170), w = R(22, 44);
        each(x, (xx) => G.island(B, xx, y, w, E.top, E.rock, hz(0.62), seed + 70 + i));
      }
    if (th === "sky")
      for (let i = 0; i < 5; i++) {
        const x = R(0, W), y = R(150, 230), w = R(30, 60);
        each(x, (xx) => G.island(B, xx, y, w, E.top, E.rock, hz(0.5), seed + i));
      }
    if (th === "abyss")
      for (let i = 0; i < 5; i++) {
        const x = R(0, W), w = R(16, 26), hh = R(100, 190);
        each(x, (xx) => G.tower(B, xx, 315, w, hh, sh(E.far, -0.3), sh(E.far, -0.5), E.accent));
      }
    if (th === "snow")
      for (let i = 0; i < 16; i++) {
        const x = R(0, W);
        each(x, (xx) => G.tree(B, xx, 316, 1.3, 0x2e5a5a, 0x3a2a20, "pine", 0.4, skyC));
      }
    if (th === "cave" || th === "abyss")
      for (let x = 0; x < W; x += R(14, 30)) {
        const L = R(40, 130), w0 = R(5, 9), R5 = G.ramp5(sh(E.far, -0.1));
        for (let j = 0; j < L; j++) {
          const half = Math.round(w0 * (1 - j / L));
          for (let i = -half; i <= half; i++) B.put(x + i, j, R5[Math.abs(i) === half ? 5 : i < -half * 0.4 ? 1 : i <= 0 ? 2 : 3]);
        }
      }
    if (th === "plains")
      for (let i = 0; i < 4; i++) {
        const x = R(0, W);
        each(x, (xx) => (G.tower(B, xx, 318, 12, R(30, 50), mix(E.rock, 0xffffff, 0.1), sh(E.accent, -0.3), 0xffd890, hz(0.35))));
      }
    B.toHt(T);
    return;
  }
  if (S === 1) {
    // ── 중경 ──
    const f = th === "desert" ? G.dunes(B, 318, 40, E.soil, skyC, 0.15, seed) : G.hills(B, { base: 322, amp: 55, col: mix(E.mid, E.rock, 0.3), top: DARK[th] ? null : th === "snow" ? 0xe8f2ff : mix(E.top, E.mid, 0.3), skyC, haze: 0.18, seed });
    const hzm = hz(0.2);
    if (th === "sky" || th === "crystal" || th === "spire" || th === "plains" || th === "forest")
      for (let i = 0; i < 4; i++) {
        const x = R(20, W - 80), y = R(100, 200), w = R(36, 80);
        each(x, (xx) => G.island(B, xx, y, w, E.top, E.rock, hz(0.3), seed + 10 + i));
      }
    const n = { plains: 7, forest: 11, marsh: 9, snow: 10, sky: 4, spire: 5, crystal: 7, fortress: 5, abyss: 6, forge: 5, desert: 4, cave: 8 }[th] ?? 6;
    for (let i = 0; i < n; i++) {
      const x = R(0, W), gy = Math.round(f(x)) + 3;
      each(x, (xx) => {
        if (th === "forest" || th === "marsh") G.tree(B, xx, gy, 1.3 + h.next() * 0.6, sh(E.top, -0.12), sh(E.soil, -0.2), th === "marsh" && i % 2 ? "dead" : "round", 0.15, skyC);
        else if (th === "snow") G.tree(B, xx, gy, 1.2, 0x2e6a5a, 0x4a3424, "pine", 0.15, skyC);
        else if (th === "plains") i % 2 ? G.tree(B, xx, gy, 1.1, E.top, E.soil, "round", 0.15, skyC) : G.tower(B, xx, gy, 18, 34, mix(E.rock, 0xffffff, 0.15), sh(E.accent, -0.3), 0xffe8a0, hzm);
        else if (th === "desert") G.cone(B, xx, gy, R(40, 70), R(24, 40), sh(E.rock, 0.05), hzm);
        else if (th === "cave") G.crystal(B, xx, gy, R(8, 14), R(24, 50), E.accent, hzm);
        else if (th === "crystal") G.crystal(B, xx, gy, R(10, 18), R(40, 80), E.accent, hzm);
        else G.tower(B, xx, gy, R(14, 22), R(40, 90), mix(E.rock, th === "abyss" ? 0x000000 : 0xffffff, 0.15), th === "abyss" ? sh(E.rock, -0.4) : sh(E.accent, -0.35), E.accent, hzm);
      });
    }
    B.toHt(T);
    return;
  }
  // ── 근경: 진한 언덕 + 덤불·바위 ──
  const f = th === "desert" ? G.dunes(B, 345, 22, sh(E.soil, 0.05), skyC, 0, seed) : G.hills(B, { base: 348, amp: 30, col: mix(E.near, E.rock, 0.35), top: DARK[th] ? null : th === "snow" ? 0xf4f8ff : E.top, skyC, haze: 0, seed: seed + 3, sc: 90 });
  for (let i = 0; i < 16; i++) {
    const x = R(0, W), gy = Math.round(f(x)) + 4;
    each(x, (xx) => {
      if (th === "forest" || th === "marsh" || th === "plains" || th === "sky") {
        const r = R(7, 14), L5 = G.ramp5(sh(E.top, -0.15));
        G.ball(B, xx, gy - r * 0.5, r, L5);
        G.ball(B, xx + r * 0.8, gy - r * 0.2, Math.round(r * 0.7), L5);
        h.next() < 0.25 && (B.put(xx - 2, gy - r - 1, E.accent), B.put(xx + 3, gy - r + 1, E.accent));
      } else if (th === "crystal" || th === "cave") G.crystal(B, xx, gy, R(6, 10), R(12, 26), E.accent);
      else G.ball(B, xx, gy - 3, R(6, 11), G.ramp5(mix(E.rock, E.near, 0.3)));
    });
  }
  B.toHt(T);
}

// 하늘 그라데이션 (엔진 sky 층)
export function paintSky3d(T, E, w, hgt) {
  const B = G.buffer(w, hgt);
  G.sky(B, E.sky[0], E.sky[1], mix(E.sky[0], E.sky[1], 0.6));
  // 해 빛무리 (팔레트에 glow가 있는 지역)
  if (E.glow) {
    const cx = w * 0.78, cy = hgt * 0.16, r = hgt * 0.5;
    for (let y = 0; y < hgt; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - cx, (y - cy) * 1.2) / r;
        d < 1 && B.put(x, y, E.glow, Math.round(150 * Math.pow(1 - d, 2.2)));
      }
  }
  B.toHt(T);
}
