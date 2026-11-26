// 구역 배경(하늘+3층) 확인: node --import ./tools/json-hook.mjs tools/bggal.mjs out.json g1_0 g0_1 ... → python tools/bgpng.py out.json out.png
// 구역 배경(하늘 + 원경·중경·근경)을 원시 RGBA로 — PIL이 겹쳐 그린다
import fs from "node:fs";
const root = new URL("../src/forge/", import.meta.url).href;
const BGN = await import(root + "bgnew.js");
const ZN = await import(root + "zones.js");
const fake = (w, h) => {
  const buf = new Uint32Array(w * h);
  return { w, h, buf, px(x, y, c, a = 255) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x, rgba = (cc, aa) => (((aa & 255) << 24) | ((cc & 255) << 16) | (((cc >> 8) & 255) << 8) | ((cc >> 16) & 255)) >>> 0; if (a >= 255) return void (buf[i] = rgba(c, 255)); const o0 = buf[i], oa = o0 >>> 24; if (!oa) return void (buf[i] = rgba(c, a)); const t = a / 255, r = Math.round((o0 & 255) * (1 - t) + ((c >> 16) & 255) * t), g = Math.round(((o0 >> 8) & 255) * (1 - t) + ((c >> 8) & 255) * t), b = Math.round(((o0 >> 16) & 255) * (1 - t) + (c & 255) * t); buf[i] = (((Math.min(255, oa + a)) << 24) | (b << 16) | (g << 8) | r) >>> 0; } };
};
let s0 = 12345; const rng = { next: () => ((s0 = (s0 * 16807) % 2147483647) / 2147483647), int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }, range(a, b) { return a + this.next() * (b - a); }, chance(p) { return this.next() < p; } };
const out = {};
for (const zid of process.argv.slice(3)) {
  const z = ZN.ZONES.find((q) => q.id === zid);
  const reg = ZN.regionOf ? ZN.regionOf(z) : null;
  // 구역 팔레트·배경 id 고르기: zones.js의 region 만들기를 흉내 (zbg 우선, 아니면 look)
  const R = ZN.zoneRegion ? ZN.zoneRegion(z) : null;
  const pal = R?.pal ?? ZN.REGION_PAL?.[zid];
  out[zid] = { err: null };
  try {
    const rg = z.reg, id = rg.zbg ?? rg.look ?? rg.bgId ?? rg.id, P = rg.pal;
    const sky = fake(640, 360); BGN.paintSky3d(sky, P, 640, 360);
    const L = [0, 1, 2].map((l) => { const T = fake(640, 600); BGN.paintLayer3d(T, l, P, rng, id); return Buffer.from(T.buf.buffer).toString("base64"); });
    out[zid] = { id, sky: Buffer.from(sky.buf.buffer).toString("base64"), L };
  } catch (e) { out[zid].err = String(e).slice(0, 200) + " " + (e.stack || "").split("\n")[1]; }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => k + (v.err ? " ERR " + v.err : " ok " + v.id)).join("\n"));
