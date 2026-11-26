import { ZONES, upChunk, downChunk } from "../src/forge/zones.js";
import { makePlan } from "../src/forge/natgen.js";
import { biomeOf } from "../src/forge/terrprof.js";
const [id, x0, x1, y0, y1] = process.argv.slice(2);
const z = ZONES.find((q) => q.id === id);
const P = makePlan(z, { seed: 1, Ft: 528, up: upChunk(z), down: downChunk(z), fe: 1, ze: 0, biome: biomeOf(z), noRepair: 1 }, 0);
for (let y = +y0; y < +y1; y++) { let s = String(y).padStart(4) + " "; for (let x = +x0; x < +x1; x++) s += P.F.v(x * 8 + 4, y * 8 + 4) > 0 ? "#" : "."; console.log(s); }
