// 길찾기 마디 확인: 칸 x 범위 · 줄 y 범위 안 마디와 닿음 여부, 그 자리 특수 칸
import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
globalThis.__sky = 1;
const [id, sd, x0, x1, y0, y1] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const o = { seed: +sd, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1, patterns: null };
const P = makePlan(z, o, 0), A = P.A;
for (let n = 0; n < A.NN; n++) { const c = A.nC[n], y = Math.round(A.nY[n] / 8); if (c >= +x0 && c <= +x1 && y >= +y0 && y <= +y1) console.log(c, y, A.reach[n] ? "R" : "-", A.nK ? A.nK[n] : ""); }
console.log("specs", (P.spec ?? P.specs ?? []).filter((r) => r.x1 / 8 > +x0 && r.x0 / 8 < +x1 && r.y1 / 8 > +y0 && r.y0 / 8 < +y1).map((r) => `${r.t ?? r.k}:${r.x0 / 8}-${r.x1 / 8}@${r.y0 / 8}-${r.y1 / 8}`).join(" "));
