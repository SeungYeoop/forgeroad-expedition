// 몬스터 전투 시험: 구역 안에서 몬스터를 하나씩 플레이어 옆에 소환해 몇 초 싸우게 하고 찍는다 (행동 오류 잡기)
//   node --import ./tools/json-hook.mjs tools/foefight.mjs <폴더> <구역id> "id,id,..." [초]
import fs from "node:fs";
import { ZONES } from "../src/forge/zones.js";
const url = process.env.TEST_URL || "http://localhost:5173/";
const [out = "shots/fight", zid = "g1_0", ids = "", secs = "5"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const created = await (await fetch("http://127.0.0.1:9333/json/new?" + encodeURIComponent(url), { method: "PUT" })).json();
const ws = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map(), errors = [], warns = [];
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id) (pend.get(d.id)?.(d), pend.delete(d.id));
  else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.slice(0, 400));
  else if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "warning" || d.params.type === "error")) { const t = d.params.args.map((a) => a.value ?? a.description ?? "").join(" "); /foe|brain|model/.test(t) && warns.push(t.slice(0, 300)); }
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
  await ev('window.__game.scene.start("Run")');
  for (let i = 0; i < 200; i++) { await sleep(300); if (await ev("!!(window.__run && window.__run.player && !window.__run.frLoad && window.__run.hud && window.__run.hud())")) break; }
  await sleep(1500);
  const C0 = ZONES.find((q) => q.id === zid).c0;
  await ev(`(() => { const sc = window.__run; sc.player.iframes = 1e9; sc.travelTo(${C0} * 32 + 40, 1, null, 4400); })()`);
  await sleep(3000);
  for (let i = 0; i < 28 && !(await ev("!!window.__run.player.body?.onGround")); i++) await sleep(250);
  const list = ids.split(",").filter(Boolean);
  await ev(`window.__FG.foePreloadIds(window.__run, ${JSON.stringify(list)})`);
  await sleep(6000);
  for (const fid of list) {
    await ev(`(() => { const sc = window.__run; for (const e of sc.enemies) e.remove?.(); sc.player.hp = sc.player.maxHp; sc.player.iframes = 1e9; const z = sc.spawnEnemy("${fid}", sc.player.cx + 70, sc.player.body.y - 6, {}); z && (z.aggro = !0); window.__tf = z; })()`);
    if (!(await ev("!!window.__tf"))) { await sleep(1500); await ev(`(() => { const sc = window.__run; const z = sc.spawnEnemy("${fid}", sc.player.cx + 70, sc.player.body.y - 6, {}); z && (z.aggro = !0); window.__tf = z; })()`); }
    await sleep(Number(secs) * 1000);
    const st = await ev(`(() => { const z = window.__tf; return z ? JSON.stringify({ hp: Math.round(z.hp), dead: !!z.dead, x: Math.round(z.cx - window.__run.player.cx), y: Math.round(z.body.y - window.__run.player.body.y), tex: z.sprite?.texture?.key, fr: z.sprite?.frame?.name }) : "spawn fail"; })()`);
    const s = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${out}/${fid}.png`, Buffer.from(s.result.data, "base64"));
    console.log(fid, st);
  }
} finally {
  console.log(JSON.stringify({ errors: [...new Set(errors)].slice(0, 8), warns: [...new Set(warns)].slice(0, 8) }));
  ws.close();
  await fetch("http://127.0.0.1:9333/json/close/" + created.id).catch(() => {});
  process.exit(0);
}
