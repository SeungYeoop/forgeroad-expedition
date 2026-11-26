// 게임이 만든 텍스처(스프라이트 시트)를 PNG로 뽑는다
//   node tools/texshot.mjs <폴더> "player_cloth,npc_smith,..." [배율]
import fs from "node:fs";
const url = process.env.TEST_URL || "http://localhost:5173/";
const [out = "shots/tex", spec = "", scale = "4"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map(), errors = [];
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
  else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.slice(0, 300));
};
const send = (m, p = {}) => new Promise((r) => { const k = ++id; pend.set(k, r); ws.send(JSON.stringify({ id: k, method: m, params: p })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await send("Runtime.enable");
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(3000);
  // 몬스터: e_<id> 요청이면 미리 만들고 잠깐 기다린다
  const foeIds = spec.split(",").filter((k) => /^e_|^b_/.test(k)).map((k) => k.slice(2));
  if (foeIds.length) {
    await ev(`(() => { const sc = window.__game.scene.getScenes(true)[0] ?? window.__game.scene.scenes[0]; window.__FG?.foePreloadIds?.(sc, ${JSON.stringify(foeIds)}); return 1; })()`);
    for (let i = 0; i < 80; i++) { await sleep(500); const ok = await ev(`${JSON.stringify(spec.split(",").filter((k) => /^e_|^b_/.test(k)))}.every((k) => window.__game.textures.exists(k))`); if (ok) break; }
  }
  for (const key of spec.split(",").filter(Boolean)) {
    const url2 = await ev(`(() => { const t = window.__game.textures; if (!t.exists(${JSON.stringify(key)})) return null; const src = t.get(${JSON.stringify(key)}).getSourceImage(); const c = document.createElement("canvas"), s = ${Number(scale)}; c.width = src.width * s; c.height = src.height * s; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.fillStyle = "#8a9a7a"; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); return c.toDataURL("image/png"); })()`);
    if (!url2) { console.log("없음", key); continue; }
    fs.writeFileSync(`${out}/${key}.png`, Buffer.from(url2.split(",")[1], "base64"));
    console.log("ok", key);
  }
} finally {
  console.log(JSON.stringify({ errors }));
  await fetch("http://127.0.0.1:9333/json/close/" + created.id);
  process.exit(0);
}
