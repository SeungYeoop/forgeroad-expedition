// 소품 전체 그림 확인: node --import ./tools/json-hook.mjs tools/propgal.mjs out.json → python tools/galpng.py out.json out.png
// 소품 전체를 한 장에: 각 소품 RGBA를 이어 붙인 원시 파일 + 배치 JSON (PIL로 PNG 만든다)
import fs from "node:fs";
const root = new URL("../src/forge/", import.meta.url).href;
const NP = await import(root + "natprops.js?t=" + Date.now());
const out = process.argv[2];
const pal = { top: Number(process.argv[3] ?? 0x6a9a3a), rock: Number(process.argv[4] ?? 0x8a7a6a), acc: Number(process.argv[5] ?? 0xffd060) };
const items = [];
for (const k of NP.PROP_KINDS) for (const s of [1]) {
  try { const r = NP.paintProp(k, s, 1, pal, 1, 0, k === "p_column" || k === "p_rockcol" ? { h: 60, w: 12 } : null); items.push({ k, s, w: r.w, h: r.h, data: Buffer.from(r.data.buffer, r.data.byteOffset, r.data.byteLength).toString("base64") }); }
  catch (e) { items.push({ k, s, err: String(e).slice(0, 120) }); }
}
fs.writeFileSync(out, JSON.stringify(items));
console.log("props", items.length, items.filter((i) => i.err).map((i) => i.k + ":" + i.err).join(" | "));
