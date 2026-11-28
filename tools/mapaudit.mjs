// 맵 어색한 곳 검사 (노드에서 바로, 2026-11-28 다듬기 2단계)
//   node --import ./tools/json-hook.mjs tools/mapaudit.mjs
//   SEEDS=1,2,3  ZONES=g0_2,g1_m2  OUT=폴더(구역마다 JSON)  — 구역 하나 끝날 때마다 바로 저장한다 (설계가 느리다)
// 검사:
//   ladder  사다리·밧줄·덩굴 위 끝/아래 끝에서 설 자리가 없다 (top · bottom · buried)
//   water   고인 물이 아래나 옆으로 샌다 (아래·양옆이 바위나 물이 아니다)
//   exit    ▲ 문이 구역에서 가장 높은 설 자리보다 한참 아래 · ▼ 문이 가장 낮은 설 자리보다 한참 위
//   wall    뒷벽이 바깥 하늘에 나와 있다 (sky) · 막힌 실내 공기인데 뒷벽이 없다 (hole)
//   prop    바닥 소품 밑이 비었다 · 매다는 소품 위가 비었다
import { ZONES, upChunk, downChunk, isLocked } from "../src/forge/zones.js";
import { planOf } from "../src/forge/natgen.js";
import { audit } from "./mapaudit-lib.mjs";
import fs from "node:fs";

const seeds = (process.env.SEEDS || "1").split(",").map(Number);
const only = process.env.ZONES ? process.env.ZONES.split(",") : null;
const OUT = process.env.OUT || "";
OUT && fs.mkdirSync(OUT, { recursive: true });
const rows = [];
for (const seed of seeds)
  for (const z of ZONES) {
    if (z.kind !== "zone" || isLocked(z.id) || (only && !only.includes(z.id))) continue;
    const t0 = performance.now();
    const P = planOf(z, { seed, Ft: 528, up: upChunk(z), down: downChunk(z) });
    const R = audit(P);
    const c = (a, k) => a.filter((q) => !k || q.k === k).length;
    const row = { seed, id: z.id, name: z.name, kind: P.kind, s: Math.round((performance.now() - t0) / 1000), ladTop: c(R.ladder, "top"), ladBot: c(R.ladder, "bottom"), ladBur: c(R.ladder, "buried"), water: c(R.water), upGap: R.exit.find((e) => e.k === "up")?.gap ?? "", upCol: R.exit.find((e) => e.k === "up")?.colGap ?? "", downGap: R.exit.find((e) => e.k === "down")?.gap ?? "", downCol: R.exit.find((e) => e.k === "down")?.colGap ?? "", wallSky: c(R.wall, "sky"), wallHole: c(R.wall, "hole"), prop: c(R.prop), ok: P.check.ok ? 1 : 0, miss: P.check.miss.join(""), traps: P.check.traps, rev: P.polishReverted ?? 0, fix: `물${P.waterFix ?? 0} 잇기${P.linkAdd ?? 0} 사다리${P.climbFix ?? 0} 구멍${P.climbCarve ?? 0} 벽${P.wallFix ?? 0} 소품${P.propFix ?? 0}${P.peak0 ? " ▲이동" : ""}${P.deep0 ? " ▼이동" : ""}` };
    rows.push(row);
    console.log(JSON.stringify(row));
    OUT && fs.writeFileSync(`${OUT}/${z.id}_s${seed}.json`, JSON.stringify({ row, ...R, WP: P.WP, HP: P.HP }, null, 1));
  }
console.table(rows);
