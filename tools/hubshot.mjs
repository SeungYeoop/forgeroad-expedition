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
  for (const p of spec.split(";").filter(Boolean)) {
    const [x, n] = p.split(",");
    await ev(`(() => { const h = window.__hub; h.player.body.x = ${x}; h.player.x !== undefined && (h.player.x = ${x}); h.cameras.main.centerOn(${x}, 180); })()`);
    await sleep(1500);
    const s = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${out}/${n}.png`, Buffer.from(s.result.data, "base64"));
    console.log(n);
  }
} finally {
  console.log(JSON.stringify({ errors }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
}
