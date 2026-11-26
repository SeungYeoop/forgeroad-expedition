// 구역 배경 미리보기: 하늘 + 원경·중경·근경을 겹쳐 PNG (640×360, 2배 확대)
//   node --import ./tools/json-hook.mjs tools/bgpreview.mjs <출력폴더> [구역id,...] [위로 올린 정도 0~240]
import { ZONES } from "../src/forge/zones.js";
import { paintLayer3d, paintSky3d } from "../src/forge/bgnew.js";
import { savePNG } from "./png.mjs";
import fs from "node:fs";

const [out = "bgprev", ids = "", offS = "130"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const OFF = Number(offS), W = 640, H = 360, LH = 600;
function buf(w, h) {
  const col = new Float32Array(w * h * 3);
  return {
    w, h, col,
    px(x, y, c, a = 255) {
      x = Math.round(x), y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 3, t = a / 255;
      col[i] = col[i] * (1 - t) + ((c >> 16) & 255) * t, col[i + 1] = col[i + 1] * (1 - t) + ((c >> 8) & 255) * t, col[i + 2] = col[i + 2] * (1 - t) + (c & 255) * t;
    },
  };
}
// 층은 따로 그린 뒤(알파 포함) 화면 버퍼에 얹는다
function layerBuf(w, h) {
  const rgba = new Float32Array(w * h * 4);
  return {
    w, h, rgba,
    px(x, y, c, a = 255) {
      x = Math.round(x), y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4, t = a / 255, oa = rgba[i + 3];
      if (oa === 0 || t >= 1) return void (rgba[i] = (c >> 16) & 255, rgba[i + 1] = (c >> 8) & 255, rgba[i + 2] = c & 255, rgba[i + 3] = Math.max(oa, t));
      rgba[i] = rgba[i] * (1 - t) + ((c >> 16) & 255) * t, rgba[i + 1] = rgba[i + 1] * (1 - t) + ((c >> 8) & 255) * t, rgba[i + 2] = rgba[i + 2] * (1 - t) + (c & 255) * t, rgba[i + 3] = Math.min(1, oa + t);
    },
  };
}
const rng = (seed) => {
  let s = seed >>> 0 || 1;
  const next = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (a, b) => a + Math.floor(next() * (b - a + 1)), range: (a, b) => a + next() * (b - a), chance: (p) => next() < p };
};
const want = ids ? ids.split(",") : null;
for (const z of ZONES) {
  const bgid = z.reg?.zbg ?? (process.env.ANY ? z.reg?.look : null);
  if (z.kind !== "zone" || !bgid || (want && !want.includes(z.id))) continue;
  const reg = z.reg, S = buf(W, H);
  paintSky3d(S, reg.pal, W, H);
  for (const l of [0, 1, 2]) {
    const L = layerBuf(W, LH);
    paintLayer3d(L, l, reg.pal, rng(1234 + l), bgid);
    const off = OFF - l * 10;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const j = ((y + off) * W + x) * 4;
      if (y + off >= LH || !L.rgba[j + 3]) continue;
      const i = (y * W + x) * 3, t = L.rgba[j + 3];
      S.col[i] = S.col[i] * (1 - t) + L.rgba[j] * t, S.col[i + 1] = S.col[i + 1] * (1 - t) + L.rgba[j + 1] * t, S.col[i + 2] = S.col[i + 2] * (1 - t) + L.rgba[j + 2] * t;
    }
  }
  const K = 2, img = new Uint8Array(W * K * H * K * 4);
  for (let y = 0; y < H * K; y++) for (let x = 0; x < W * K; x++) {
    const i = (((y / K) | 0) * W + ((x / K) | 0)) * 3, o = (y * W * K + x) * 4;
    img[o] = S.col[i], img[o + 1] = S.col[i + 1], img[o + 2] = S.col[i + 2], img[o + 3] = 255;
  }
  savePNG(`${out}/${z.id}.png`, W * K, H * K, img);
  console.log(z.id, reg.name, reg.zbg);
}
