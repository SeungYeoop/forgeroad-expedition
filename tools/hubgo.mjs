// 거점 화면: 거점에 들어가 플레이어를 x로 옮겨 찍는다
//   node --import ./tools/json-hook.mjs tools/hubshot.mjs <폴더> "x,이름;..."
import fs from "node:fs";
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5173/";
const [out = "shots/spot", spec = ""] = process.argv.slice(2);
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
  await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 160 && !(await ev("!!window.__game")); i++) await sleep(500);
  await sleep(3000);
  await ev('window.__game.scene.start("Hub")');
  for (let i = 0; i < 60 && !(await ev("!!(window.__hub && window.__hub.player)")); i++) await sleep(300);
  await sleep(2500);
  for (const d of spec.split(",")) {
    await ev('window.__game.scene.start("Hub")');
    for (let i = 0; i < 60 && !(await ev("!!(window.__hub && window.__hub.player && !window.__hub.leaving)")); i++) await sleep(300);
    await sleep(1500);
    await ev(`(() => { window.__FG.setHubDest("${d}"); window.__hub.startRun(); })()`);
    let z = null;
    for (let i = 0; i < 120; i++) { await sleep(500); z = await ev("(() => { const r = window.__run; if (!r || !r.player || r.frLoad) return null; const c = r.world.chunkOfLocal(r.player.cx); const zz = window.__FG.zoneAtPlayer ? window.__FG.zoneAtPlayer(r) : null; return JSON.stringify({ chunk: c, x: Math.round(r.player.cx), y: Math.round(r.player.cy), name: r.hud?.()?.regionName ?? null }); })()"); if (z) break; }
    await sleep(2500);
    const s2 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${out}/run_${d}.png`, Buffer.from(s2.result.data, "base64"));
    console.log(d, z);
  }
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
