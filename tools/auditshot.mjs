// 맵 검사에서 걸린 자리를 실제 지형 그림(terrfine)으로 잘라 PNG로 (설계는 한 번만 만든다)
//   node --import ./tools/json-hook.mjs tools/auditshot.mjs <구역id> <시드> <폴더> [종류=ladder,water,exit,wall,prop] [종류마다 몇 장=6]
//   표시: 노란 네모 = 걸린 자리 · 빨간 사람 = 캐릭터 크기(10×22)
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { planOf, drawChunk } from "../src/forge/natgen.js";
import { pixFine, fineSlice } from "../src/forge/terrfine.js";
import { biomeOf } from "../src/forge/terrprof.js";
import { savePNG } from "./png.mjs";
import { audit } from "./mapaudit-lib.mjs";
import fs from "node:fs";

const [id, seedS = "1", out = "shots/audit", kindsS = "ladder,water,exit,wall,prop", perS = "6"] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const seed = Number(seedS), per = Number(perS);
fs.mkdirSync(out, { recursive: true });
const o = { seed, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), patterns: z.y === 0 ? z.reg?.patterns : null };
const P = planOf(z, o);
const R = audit(P);
const region = { pal: z.reg.pal, theme: z.reg.theme, look: z.reg.look };
const CH = new Map();
const chunkImg = (S) => {
  if (CH.has(S)) return CH.get(S);
  const r = new Uint8Array(32 * 528), l = new Array(32), s = new Array(32);
  const ch = drawChunk(P, z, S, r, l, s, { ...o, arena: false });
  const g = pixFine({ ug: ch.ug }, S * 32, region, fineSlice(ch));
  let st;
  do st = g.next(); while (!st.done);
  const v = { A: st.value.img.data, Wl: st.value.wall, h: st.value.img.height };
  CH.set(S, v);
  return v;
};
const CW = 384, CHH = 256, SC = 2;
function crop(cx0, cy0, marks) {
  const cx = Math.max(0, Math.min(P.WP - CW, Math.round(cx0 - CW / 2))), cy = Math.max(0, Math.min(P.HP - CHH, Math.round(cy0 - CHH / 2)));
  const img = new Uint8Array(CW * CHH * 4);
  for (let y = 0; y < CHH; y++)
    for (let x = 0; x < CW; x++) {
      const k = (y * CW + x) * 4;
      img[k] = 110; img[k + 1] = 160; img[k + 2] = 220; img[k + 3] = 255;
    }
  for (let S = z.c0; S < z.c1; S++) {
    const sx = (S - z.c0) * 512;
    if (sx + 512 <= cx || sx >= cx + CW) continue;
    const { A, Wl, h } = chunkImg(S);
    for (let y = 0; y < CHH; y++) {
      const yy = cy + y;
      if (yy >= h) break;
      for (let x = 0; x < CW; x++) {
        const xx = cx + x - sx;
        if (xx < 0 || xx >= 512) continue;
        const q = (yy * 512 + xx) * 4, k = (y * CW + x) * 4;
        // 뒷벽은 조금 어둡게 (앞 지형과 구분)
        for (const [src, dim] of [[Wl, 0.8], [A, 1]]) {
          if (!src[q + 3]) continue;
          const al = src[q + 3] / 255;
          for (let c = 0; c < 3; c++) img[k + c] = img[k + c] * (1 - al) + src[q + c] * dim * al;
        }
      }
    }
  }
  const put = (x, y, c) => {
    x = Math.round(x - cx); y = Math.round(y - cy);
    if (x < 0 || y < 0 || x >= CW || y >= CHH) return;
    const k = (y * CW + x) * 4;
    img[k] = c[0]; img[k + 1] = c[1]; img[k + 2] = c[2];
  };
  for (const m of marks) {
    if (m.fig) {
      for (let y = m.y - 22; y <= m.y; y++) for (let x = m.x - 5; x <= m.x + 5; x++) put(x, y, y < m.y - 15 ? [255, 220, 170] : [230, 30, 40]);
      continue;
    }
    const { x, y, w = 24, h = 24 } = m;
    for (let t = 0; t < 2; t++) {
      for (let i = 0; i < w; i++) (put(x - w / 2 + i, y - h / 2 + t, [255, 230, 0]), put(x - w / 2 + i, y + h / 2 - t, [255, 230, 0]));
      for (let i = 0; i < h; i++) (put(x - w / 2 + t, y - h / 2 + i, [255, 230, 0]), put(x + w / 2 - t, y - h / 2 + i, [255, 230, 0]));
    }
  }
  // 2배로
  const W2 = CW * SC, H2 = CHH * SC, big = new Uint8Array(W2 * H2 * 4);
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) big.set(img.subarray(((y / SC | 0) * CW + (x / SC | 0)) * 4, ((y / SC | 0) * CW + (x / SC | 0)) * 4 + 4), (y * W2 + x) * 4);
  return { W2, H2, big };
}
const list = [];
for (const kind of kindsS.split(",")) {
  const arr = (R[kind] ?? []).slice();
  // 고르게 뽑기 (앞쪽만 몰리지 않게)
  const step = Math.max(1, Math.floor(arr.length / per));
  for (let i = 0, n = 0; i < arr.length && n < per; i += step, n++) list.push([kind, arr[i], i]);
}
for (const [kind, f, i] of list) {
  const marks = [{ x: f.x, y: f.y, w: f.w ? Math.min(f.w, 360) : 24, h: f.h ? Math.min(f.h, 240) : 24 }];
  kind === "ladder" && marks.push({ fig: 1, x: f.x, y: f.y });
  const { W2, H2, big } = crop(f.x, f.y, marks);
  const nm = `${out}/${id}_${kind}_${f.k ?? ""}_${i}.png`;
  savePNG(nm, W2, H2, big);
  console.log(nm, JSON.stringify(f));
}
