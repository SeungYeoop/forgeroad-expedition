// 몬스터 손그림 확인: node --import ./tools/json-hook.mjs tools/foegal.mjs out.json [id접두사|id,...] → python tools/foepng.py out.json out.png
import fs from "node:fs";
const root = new URL("../src/forge/", import.meta.url).href;
const { MODELS } = await import(root + "foes/models.js");
const { renderSheet } = await import(root + "foes/sheet.js");
const [out, sel = ""] = process.argv.slice(2);
const ids = Object.keys(MODELS).filter((id) => (sel.includes(",") ? sel.split(",").includes(id) : id.startsWith(sel)));
const res = [];
for (const id of ids) {
  try {
    const s = renderSheet(MODELS[id], id);
    const pick = (nm, k = 0) => { const L = s.fi[nm]; return L ? L[Math.min(L.length - 1, k)] : null; };
    const frames = [pick("idle"), pick("move", 1), pick("wind") ?? pick("atk"), pick("atk", 1) ?? pick("attack", 1), pick("hurt")].filter((f) => f != null);
    const cut = frames.map((f) => { const ox = (f % s.cols) * s.fw, oy = Math.floor(f / s.cols) * s.fh, b = new Uint32Array(s.fw * s.fh); for (let y = 0; y < s.fh; y++) b.set(s.buf.subarray((oy + y) * s.W + ox, (oy + y) * s.W + ox + s.fw), y * s.fw); return Buffer.from(b.buffer).toString("base64"); });
    res.push({ id, fw: s.fw, fh: s.fh, frames: cut, anims: Object.keys(s.fi).join(",") });
  } catch (e) { res.push({ id, err: String(e).slice(0, 200) }); }
}
fs.writeFileSync(out, JSON.stringify(res));
console.log(res.length, res.filter((r) => r.err).map((r) => r.id + ":" + r.err).join(" | "));
