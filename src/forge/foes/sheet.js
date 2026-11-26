// 몬스터 시트 렌더 (순수 계산 — 워커와 본 스레드 모두에서 쓴다)
import { model, render } from "./r3d.js";

export function renderSheet(spec, key = "") {
  const names = Object.keys(spec.anims);
  const total = names.reduce((a, n) => a + spec.anims[n][0], 0);
  // 텍스처 폭은 2048 이하로 (모바일 한도): 넘치면 여러 줄로 감는다
  const fw = spec.fw, fh = spec.fh, cols = Math.max(1, Math.min(total, Math.floor(2048 / fw))), rows = Math.ceil(total / cols);
  const W = fw * cols, H = fh * rows;
  const buf = new Uint32Array(W * H);
  const fi = {};
  let f = 0;
  for (const nm of names) {
    const [n] = spec.anims[nm];
    fi[nm] = [];
    for (let k = 0; k < n; k++) {
      let fr;
      if (spec.px) {
        // 2D 픽셀로 직접 그린 그림
        fr = new Uint32Array(fw * fh);
        try {
          const cv = spec.px(nm, k, n), src = cv.rgba();
          for (let y = 0; y < Math.min(fh, cv.H); y++) fr.set(src.subarray(y * cv.W, y * cv.W + Math.min(fw, cv.W)), y * fw);
        } catch (e) {
          console.warn("foe px", key, nm, k, e);
        }
      } else {
        const M = model();
        try {
          spec.model(M, nm, k, n);
        } catch (e) {
          console.warn("foe model", key, nm, k, e);
        }
        fr = render(M, fw, fh, spec.render ?? {});
      }
      finishFoe(fr, fw, fh);
      const ox = (f % cols) * fw, oy = Math.floor(f / cols) * fh;
      for (let y = 0; y < fh; y++) buf.set(fr.subarray(y * fw, y * fw + fw), (oy + y) * W + ox);
      fi[nm].push(f++);
    }
  }
  return { buf, fi, W, H, cols, fh, fw, total };
}

// 거점 화풍 마무리 (몬스터 한 장마다): 원색을 흙빛 쪽으로 살짝 · 검은 외곽선을 맞닿은 색의 짙은 선택 외곽선으로 ·
//   위쪽 가장자리에 따뜻한 빛 · 2px 붓 결. 아주 밝고 진한 색(불·마법 빛)은 그대로 둔다
const hsh = (a, b, c = 0) => { let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
function finishFoe(fr, w, h) {
  const src = fr.slice(), A = (i) => src[i] >>> 24, R = (v) => v & 255, G = (v) => (v >> 8) & 255, Bc = (v) => (v >> 16) & 255;
  const lum = (v) => R(v) * 0.3 + G(v) * 0.59 + Bc(v) * 0.11;
  const pack = (r, g, b, a) => ((a << 24) | (Math.max(0, Math.min(255, Math.round(b))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(r)))) >>> 0;
  const edge = (x, y) => x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1 || !A(y * w + x - 1) || !A(y * w + x + 1) || !A((y - 1) * w + x) || !A((y + 1) * w + x);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x, v = src[i], a = A(i);
      if (!a) continue;
      let r = R(v), g = G(v), b = Bc(v);
      const l = lum(v), mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
      // 외곽선: 가장자리의 아주 어두운 픽셀 → 안쪽 이웃 색을 어둡게
      if (l < 42 && edge(x, y)) {
        let best = -1, bl = -1;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          const u = src[Y * w + X];
          if (!(u >>> 24) || lum(u) < 42) continue;
          const lu = lum(u);
          lu > bl && ((bl = lu), (best = u));
        }
        if (best >= 0) { r = R(best) * 0.38 * 0.55 + 0x1c * 0.45; g = G(best) * 0.38 * 0.55 + 0x12 * 0.45; b = Bc(best) * 0.38 * 0.55 + 0x0c * 0.45; }
        fr[i] = pack(r, g, b, a);
        continue;
      }
      // 빛나는 색은 그대로
      if (!(sat > 0.55 && mx > 200)) {
        const k = 0.16; r += (0x6e - r) * k * 0.6 + (l - r) * k * 0.6; g += (0x5e - g) * k * 0.6 + (l - g) * k * 0.6; b += (0x48 - b) * k * 0.6 + (l - b) * k * 0.6;
        const t = 1 + (hsh(x >> 1, y >> 1, 5) - 0.5) * 0.09; r *= t; g *= t; b *= t;
      }
      // 위쪽 가장자리 따뜻한 빛 (바로 위가 외곽선이나 빈 곳)
      if (y > 0) { const u = src[i - w]; if (!(u >>> 24) || lum(u) < 42) { r += (255 - r) * 0.14; g += (236 - g) * 0.12; b += (200 - b) * 0.08; } }
      fr[i] = pack(r, g, b, a);
    }
}
