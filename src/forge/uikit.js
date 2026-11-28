// 공통 UI 틀 — 알비온식 툴킷(albui.js)에 맡긴다 (2026-11-28 UI 전면 교체)
//   frame(sc, x, y, w, h, o)   크림 양피지 창 (o.fill === false: 테두리만)
//   plate(sc, x, y, w, h, label, fn, o)  황갈색 단추 (o.primary: 금빛) → { set(label), select(on), enable(on), destroy() }
//   ribbon(sc, cx, y, w, text, o)   작은 제목 머리판
//   vignette(sc, a)   화면 가장자리 어둡게
import * as AL from "./albui.js";
let R = null;
export const bindUikit = (r) => (R = r);

// ── 알비온식으로 교체 (2026-11-28): 나무·철 대신 크림 양피지 창 · 황갈색 단추 · 머리띠 ──
export function frameKey(sc, w, h, o = {}) {
  w = Math.round(w), h = Math.round(h);
  if (o.fill === !1)
    return AL.tex(sc, `uk_alf_${w}_${h}`, w, h, (b) => {
      for (let x = 1; x < w - 1; x++) (b.set(x, 0, AL.C.edge), b.set(x, h - 1, AL.C.edge), b.set(x, 1, AL.C.bronze), b.set(x, h - 2, AL.C.bronze));
      for (let y = 1; y < h - 1; y++) (b.set(0, y, AL.C.edge), b.set(w - 1, y, AL.C.edge), b.set(1, y, AL.C.bronze), b.set(w - 2, y, AL.C.bronze));
    });
  return AL.panelKey(sc, w, h, { seed: w + h });
}
export function frame(sc, x, y, w, h, o = {}) {
  return sc.add.image(x, y, frameKey(sc, w, h, o)).setOrigin(0).setDepth(o.depth ?? 0).setScrollFactor(0);
}
// 단추 (옛 철판 단추 자리) → { bg, tx, set, select, enable, destroy, objs }
export function plate(sc, x, y, w, h, label, fn, o = {}) {
  return AL.btn(sc, x, y, w, h, label, fn, { primary: o.primary, depth: o.depth ?? 10, font: o.font, enabled: o.enabled, onHover: o.onHover, onUp: !0 });
}
// 제목 머리판 (옛 리본 자리): 작은 황갈색 판 + 짙은 글자
export function ribbon(sc, cx, y, w, text, o = {}) {
  const hh = Math.min(o.h ?? 18, 18), ww = Math.round(w);
  const im = sc.add.image(Math.round(cx - ww / 2), y, AL.panelKey(sc, ww, hh, { hdr: hh - 2, flat: !0, tint: o.col ? AL.mix(o.col, AL.C.hdr1, 0.6) : void 0 })).setOrigin(0).setDepth(o.depth ?? 10).setScrollFactor(0);
  const t = R.ct(sc, cx, y + hh / 2, text, hh >= 16 ? "small" : "tiny", AL.INK_HDR).setOrigin(0.5).setDepth((o.depth ?? 10) + 0.1).setScrollFactor(0);
  return { im, t, objs: [im, t] };
}
export function vignette(sc, a = 0.6, depth = 0) {
  const g = sc.add.graphics().setDepth(depth).setScrollFactor(0), W = R.ot, Hh = R.xt;
  for (let i = 0; i < 20; i++) {
    const t = a * Math.pow(1 - i / 20, 2);
    g.fillStyle(0x050304, t).fillRect(0, i * 4, W, 4).fillRect(0, Hh - (i + 1) * 4, W, 4).fillRect(i * 5, 0, 5, Hh).fillRect(W - (i + 1) * 5, 0, 5, Hh);
  }
  return g;
}
