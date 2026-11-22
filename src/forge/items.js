// 포지로드 아이템·속성·융합 규칙 (엔진 독립)
import ITEMS from "./items.json";
import FUSIONS from "./fusions.json";

// ── 속성 ─────────────────────────────────────────────
export const EL = {
  fire: { ko: "화염", color: 0xff7a30, css: "#ff9040" },
  ice: { ko: "냉기", color: 0x80dcff, css: "#90e0ff" },
  lightning: { ko: "번개", color: 0xfff070, css: "#fff070" },
  wind: { ko: "바람", color: 0x90ffc8, css: "#c8ffe0" },
  earth: { ko: "대지", color: 0xd8a860, css: "#e0b878" },
  poison: { ko: "독", color: 0x98e050, css: "#a0e060" },
  light: { ko: "빛", color: 0xfff4b0, css: "#fff8c0" },
  dark: { ko: "어둠", color: 0xb070ff, css: "#d090ff" },
};
const KO2EL = Object.fromEntries(Object.entries(EL).map(([k, v]) => [v.ko, k]));
export const elOf = (ko) => (ko ? (KO2EL[ko] ?? null) : null);
const ORDER = ["fire", "ice", "lightning", "wind", "earth", "poison", "light", "dark"];

// 복합 속성 28종 (기획서 0-2). fx = 반응 효과 종류
const COMP = [
  ["fire", "ice", "steam", "증기", "증기", "blast"],
  ["fire", "lightning", "plasma", "플라즈마", "플라즈마", "beam"],
  ["fire", "wind", "heatwave", "폭염", "폭염", "spreadBurn"],
  ["fire", "earth", "lava", "용암", "용암", "lavaPool"],
  ["fire", "poison", "sulfur", "유황", "유황", "blastPoison"],
  ["fire", "light", "solar", "태양", "태양", "holyFire"],
  ["fire", "dark", "hellfire", "흑염", "흑염", "spreadBurn"],
  ["ice", "lightning", "crystal", "결정", "결정", "shatter"],
  ["ice", "wind", "blizzard", "눈보라", "눈보라", "blizzard"],
  ["ice", "earth", "permafrost", "동토", "동토", "root"],
  ["ice", "poison", "frostbite", "서리독", "서리독", "frostbite"],
  ["ice", "light", "aurora", "오로라", "오로라", "shield"],
  ["ice", "dark", "abyssice", "심연빙", "심연", "spirit"],
  ["lightning", "wind", "storm", "폭풍", "폭풍", "storm"],
  ["lightning", "earth", "magnet", "자력", "자력", "pull"],
  ["lightning", "poison", "neurotoxin", "신경독", "마비", "paralyze"],
  ["lightning", "light", "judgment", "천벌", "천벌", "bigBolt"],
  ["lightning", "dark", "blackbolt", "흑뢰", "흑뢰", "trueDmg"],
  ["wind", "earth", "sandstorm", "모래폭풍", "사풍", "blind"],
  ["wind", "poison", "miasma", "독안개", "독풍", "spreadPoison"],
  ["wind", "light", "divinewind", "신풍", "신풍", "haste"],
  ["wind", "dark", "wraithwind", "망령풍", "망령", "fear"],
  ["earth", "poison", "bog", "늪", "늪", "bogPool"],
  ["earth", "light", "crystalE", "수정", "수정", "reflect"],
  ["earth", "dark", "grave", "무덤", "무덤", "spirit"],
  ["poison", "light", "transmute", "변성", "연금", "gold"],
  ["poison", "dark", "curse", "저주", "저주", "maxHpCut"],
  ["light", "dark", "void", "공허", "공허", "trueDmg"],
];
const PURE = {
  fire: ["whiteflame", "백염"],
  ice: ["absolute", "영도"],
  lightning: ["thunder", "뇌정"],
  wind: ["vacuum", "진공"],
  earth: ["petrify", "석화"],
  poison: ["venom", "맹독"],
  light: ["radiance", "성휘"],
  dark: ["pitch", "칠흑"],
};
export const ELEMS = {}; // id → {id, name, prefix, parts:[a,b], fx, color, css, kind}
for (const k of ORDER) ELEMS[k] = { id: k, name: EL[k].ko, prefix: EL[k].ko, parts: [k], color: EL[k].color, css: EL[k].css, kind: "base" };
const mix = (a, b) => {
  const r = Math.round(((a >> 16) + (b >> 16)) / 2),
    g = Math.round((((a >> 8) & 255) + ((b >> 8) & 255)) / 2),
    bl = Math.round(((a & 255) + (b & 255)) / 2);
  return (r << 16) | (g << 8) | bl;
};
const css = (c) => "#" + c.toString(16).padStart(6, "0");
const PAIR = {};
for (const [a, b, id, name, prefix, fx] of COMP) {
  const c = mix(EL[a].color, EL[b].color);
  ELEMS[id] = { id, name, prefix, parts: [a, b], fx, color: c, css: css(c), kind: "comp" };
  PAIR[[a, b].sort().join("+")] = id;
}
const PURE_COL = { whiteflame: 0xc4e2ff, absolute: 0xb0f6ff, thunder: 0xc09cff, vacuum: 0xc8d4ee, petrify: 0x8c867a, venom: 0x9a3ae0, radiance: 0xfff6cc, pitch: 0x7040b0 };
for (const [k, [id, name]] of Object.entries(PURE)) {
  const c = PURE_COL[id] ?? EL[k].color;
  ELEMS[id] = { id, name, prefix: name, parts: [k, k], fx: "pure_" + k, color: c, css: css(c), kind: "pure", base: k };
}
export const compOf = (a, b) => PAIR[[a, b].sort().join("+")] ?? null;
export const pureOf = (a) => (PURE[a] ? PURE[a][0] : null);
// 상태이상 판정에 쓰는 기본 속성 목록
export const partsOf = (e) => (e ? ELEMS[e]?.parts ?? [] : []);

// ── 종류 ─────────────────────────────────────────────
export const KIND_KO = { weapon: "무기", skill: "스킬", magic: "마법", armor: "방어구", rune: "각인" };
export const TIER_KO = ["기본", "1차 융합", "완성품", "전설"];
const KC = { weapon: "W", skill: "S", magic: "M", armor: "A", rune: "G" };
// 종류 조합 → 결과 종류
const COMBO = {
  WW: "weapon", WS: "weapon", WM: "weapon", WG: "weapon",
  SS: "skill", SM: "skill", SA: "skill", SG: "skill",
  MM: "magic", MA: "armor", MG: "magic",
  AA: "armor", AG: "armor", GG: "rune",
};
const CAT_KO = {
  WW: "상위 무기", WS: "기술 무기", WM: "마법 무기", WG: "각인 무기",
  SS: "연계 스킬", SM: "마법 기술", SA: "반격 스킬", SG: "각인 스킬",
  MM: "복합 마법", MA: "마법 갑옷", MG: "각인 마법", AA: "상위 방어구", AG: "각인 방어구", GG: "복합 각인",
};
const KORD = ["weapon", "skill", "magic", "armor", "rune"];

// ── 기본 아이템 ─────────────────────────────────────
export const BASE = {};
for (const it of ITEMS) BASE[it.id] = { ...it, el: elOf(it.element) };
// 보스 유물 보정 (기획서 단독 효과를 장비 형식으로)
Object.assign(BASE.B01, { el: "fire", speed: "느림", range: "근접 넓음", attack: "2연 내려치기 (200/240%), 적중 시 잔불 줄기", special: "충전 강타: 잔불 줄기 3개를 남김", traits: ["베기", "강타", "잔불"] });
Object.assign(BASE.B10, { el: "wind", speed: "보통", range: "원거리", attack: "화살 1발 (130%), 날아가다 회오리로 변함", special: "공중 공격 피해 +40%", traits: ["투사체", "회오리"] });
Object.assign(BASE.B04, { mana: 45, dmg: "20% × 16", traits: ["설치", "전염"] });
Object.assign(BASE.B05, { mana: 0, dmg: "900%", traits: ["폭발", "희생"] });
Object.assign(BASE.B08, { cd: 40, dmg: "0%", traits: ["시간"] });
Object.assign(BASE.B03, { cls: "중갑", traits: ["중량", "반격"] });
Object.assign(BASE.B06, { cls: "비늘", traits: ["빙결"] });
Object.assign(BASE.B11, { cls: "왕관", traits: ["분신"] });
for (const id of ["B02", "B07", "B09", "B12"]) BASE[id].on_weapon = BASE[id].on_cast = BASE[id].on_armor = BASE[id].desc;

// 무기 → 엔진 원형, 공격 배율(콤보), 속도
const W = {
  W01: ["sword", [1, 1, 1.4], 1],
  W02: ["greatsword", [1.8, 2.2], 1],
  W03: ["dual", [0.45, 0.45, 0.45, 0.45, 0.45, 0.45], 1.1],
  W04: ["spear", [0.7, 0.7, 0.7, 0.7], 1.25],
  W05: ["spear", [0.9, 0.9, 1.6], 1],
  W06: ["greatsword", [1.5, 1.5, 2], 0.95],
  W07: ["hammer", [3], 1],
  W08: ["scythe", [1.6, 2], 1],
  W09: ["scythe", [0.8, 0.8, 1.3], 1.15],
  W10: ["gauntlet", [0.4, 0.4, 0.4, 0.4, 0.4, 1.5], 1],
  W11: ["bow", [1], 1],
  W12: ["crossbow", [1.2, 1.2, 1.2], 1],
  W13: ["bow", [0.8, 0.8], 1.2],
  W14: ["staff", [0.7, 0.7, 0.7], 1],
  W15: ["staff", [0.5, 0.5, 0.5, 0.5, 0.5], 1.1],
  W16: ["scythe", [0.6, 0.6, 0.6, 0.6], 1.2],
  B01: ["greatsword", [2, 2.4], 1],
  B10: ["bow", [1.3], 1.1],
};
export const weaponArch = (id) => W[id] ?? W.W01;

// 방어구 → 엔진 원형(외형) + 상시 효과(fx)
const A = {
  A01: ["leather", { move: 0.05 }],
  A02: ["chain", { projRed: 0.15 }],
  A03: ["steel", { kbImmune: 1, move: -0.1 }],
  A04: ["cloth", { manaRegen: 0.3 }],
  A05: ["mage", { magicDmg: 0.2 }],
  A06: ["leather", { dashCd: -0.2 }],
  A07: ["abyss", { dashStealth: 0.5 }],
  A08: ["guardian", { block: 0.6 }],
  A09: ["thorns", { block: 0.6, thorns: 0.5 }],
  A10: ["guardian", { block: 0.9, kbImmune: 1, move: -0.05 }],
  A11: ["mage", { block: 0.6, reflect: 1 }],
  A12: ["chain", { elemRed: 0.15 }],
  A13: ["berserker", { killGuard: 0.3 }],
  A14: ["leather", { dashBuff: 0.5 }],
  A15: ["leather", { fallImmune: 1 }],
  A16: ["cloth", { chillImmune: 1, elemRed: 0.1 }],
  A17: ["mage", { healEff: 0.4 }],
  A18: ["cloth", { statusPow: 0.3, statusRes: 0.5 }],
  A19: ["leather", { airJump: 1 }],
  A20: ["steel", { dmgRed: 0.2, move: -0.2, kbImmune: 1 }],
  B03: ["steel", { kbImmune: 1, thorns: 0.3 }],
  B06: ["guardian", { iceArmor: 1, dmgRed: 0.1 }],
  B11: ["abyss", { shadowClone: 0.5 }],
};
export const armorArch = (id) => A[id] ?? ["cloth", {}];

// 각인 효과 → 대상별 수치 모드
const G = {
  G01: { w: { split: 3 }, c: { split: 3 }, a: { shardOnHit: 3 } },
  G02: { w: { pierce: 2 }, c: { pierce: 99 }, a: { ignore: 0.1 } },
  G03: { w: { chain: 1 }, c: { chain: 2 }, a: { blockChain: 1 } },
  G04: { w: { lifesteal: 0.03 }, c: { lifesteal: 0.05 }, a: { killHeal: 2 } },
  G05: { w: { boomEvery: 3 }, c: { boomEnd: 1 }, a: { lowBoom: 1 } },
  G06: { w: { range: 0.3 }, c: { homing: 1 }, a: { orbGuard: 1 } },
  G07: { w: { size: 0.4, spd: -0.1 }, c: { size: 0.5 }, a: { kbImmune: 1, hp: 0.1 } },
  G08: { w: { spd: 0.2 }, c: { cdr: 0.25 }, a: { move: 0.15 } },
  G09: { w: { reflect: 1 }, c: { reflect: 1 }, a: { reflectChance: 0.2 } },
  G10: { w: { echoEvery: 3 }, c: { echo: 0.5 }, a: { echoDmg: 0.3 } },
  G11: { w: { execute: 0.1 }, c: { executeDmg: 0.2 }, a: { killIframe: 1 } },
  G12: { w: { crit: 0.15 }, c: { critDmg: 0.5 }, a: { hurtCrit: 0.3 } },
  G13: { w: { knock: 1 }, c: { knock: 1 }, a: { hurtPush: 1 } },
  G14: { w: { bleed: 1 }, c: { bleed: 3 }, a: { bleedAttacker: 1 } },
  G15: { w: { stunEvery: 5 }, c: { stun: 1 }, a: { blockStun: 1 } },
  G16: { w: { manaOnHit: 2 }, c: { manaCost: -0.3 }, a: { manaOnHurt: 5 } },
  G17: { w: { rage: 1 }, c: { lowHpDmg: 0.4 }, a: { lowHpDef: 0.5 } },
  G18: { w: { stackDmg: 0.5 }, c: { castStack: 3 }, a: { hurtStack: 5 } },
  G19: { w: { ghost: 0.3 }, c: { ghostCast: 0.4 }, a: { dashGhost: 1 } },
  G20: { w: { boomerang: 1 }, c: { returnProj: 1 }, a: { blink: 1 } },
  G21: { w: { shieldEvery: 10 }, c: { shieldOnCast: 15 }, a: { nullify: 20 } },
  G22: { w: { blockedDmg: 0.5 }, c: { spikeFloor: 1 }, a: { thorns: 0.4 } },
  G23: { w: { gold: 0.3 }, c: { gold: 0.5 }, a: { shopDisc: 0.2 } },
  G24: { w: { luck: 0.15 }, c: { luck: 0.1 }, a: { dodge: 0.1 } },
  G25: { w: { spiritOnKill: 0.15 }, c: { spiritOnCast: 1 }, a: { guardSpirit: 1 } },
  G26: { w: { pullHit: 1 }, c: { gather: 1 }, a: { projSlow: 0.3 } },
  G27: { w: { slowHit: 0.2 }, c: { timeSlow: 2 }, a: { timeStop: 1 } },
  G28: { w: { sacrifice: 0.35 }, c: { bloodCast: 0.6 }, a: { hp: -0.3, def: 0.5 } },
  G29: { w: { reactDmg: 0.5 }, c: { reactCdr: 1 }, a: { reactShield: 10 } },
  G30: { w: { awaken: 1 }, c: { awaken: 1 }, a: { awaken: 1 } },
  B02: { w: { dashStealth: 1 }, c: { dashStealth: 1 }, a: { dashStealth: 1 } },
  B07: { w: { burrowDash: 2 }, c: { burrowDash: 2 }, a: { burrowDash: 2 } },
  B09: { w: { prism: 1 }, c: { prism: 1 }, a: { prism: 1 } },
  B12: { w: { extraSecond: 1 }, c: { extraSecond: 1 }, a: { extraSecond: 1 } },
};
export const runeMods = (gid, target) => {
  const g = G[gid];
  if (!g) return {};
  return target === "weapon" ? g.w : target === "armor" ? g.a : g.c;
};

// 스킬·마법 동작 정의. k = 동작 종류, p = 위력(공격력 배수), n = 타수
const S = {
  S01: { k: "spin", p: 0.6, n: 5, r: 46 },
  S02: { k: "dash", p: 2, dist: 0.24 },
  S03: { k: "slam", p: 3.5, r: 60 },
  S04: { k: "launch", p: 1.8, w: 46 },
  S05: { k: "wave", p: 2.2, pierce: 99, spr: "p_swordwave" },
  S06: { k: "rapid", p: 0.3, n: 12, w: 44, dur: 1.6 },
  S07: { k: "tele", p: 1.5 },
  S08: { k: "iaido", p: 5, w: 170 },
  S09: { k: "parry", p: 3 },
  S10: { k: "leap", p: 2 },
  S11: { k: "hook", p: 1 },
  S12: { k: "shout", p: 0, atk: 0.3, dur: 8 },
  S13: { k: "focus", p: 0, n: 3 },
  S14: { k: "crack", p: 2.5, n: 7, stun: 0.8 },
  S15: { k: "fan", p: 0.7, n: 3, spread: 0.22, spr: "p_blade", speed: 420 },
  S16: { k: "spin", p: 0.8, n: 4, r: 40, up: 1 },
  S17: { k: "rapid", p: 0.5, n: 8, w: 54, dur: 1, ghost: 3 },
  S18: { k: "beam", p: 4, aim: 0.6 },
  S19: { k: "fan", p: 0.9, n: 5, spread: 0.16, spr: "p_arrow", speed: 520 },
  S20: { k: "trap", p: 3, dur: 12 },
  S21: { k: "dash", p: 1.5, dist: 0.12, clearProj: 1, knock: 360 },
  S22: { k: "execute", p: 2.5, w: 50 },
  S23: { k: "frenzy", p: 0.4, n: 15, dur: 2.4 },
  S24: { k: "boomer", p: 1.8, spr: "p_blade" },
  B08: { k: "gear", p: 0, dur: 5 },
};
const M = {
  M01: { k: "proj", p: 2, spr: "p_fire", speed: 340, aoe: 40 },
  M02: { k: "orbit", p: 0.8, n: 4, dur: 4 },
  M03: { k: "stream", p: 0.25, n: 20, dur: 1.6, w: 90 },
  M04: { k: "meteor", p: 6, r: 70, n: 1 },
  M05: { k: "proj", p: 1.8, spr: "p_icicle", speed: 460, pierce: 99, stacks: 2 },
  M06: { k: "nova", p: 1.5, r: 84, stacks: 3 },
  M07: { k: "wall", p: 0.3, dur: 5 },
  M08: { k: "slowOrb", p: 0.5, n: 8, spr: "p_snowball", dur: 3 },
  M09: { k: "proj", p: 1.5, spr: "p_bolt", speed: 760 },
  M10: { k: "sky", p: 4, n: 3 },
  M11: { k: "chain", p: 1.2, n: 5 },
  M12: { k: "field", p: 0.4, n: 10, dur: 5, r: 70, float: 1 },
  M13: { k: "fan", p: 1.2, n: 2, spread: 0.08, spr: "p_wave", speed: 560, seq: 0.12 },
  M14: { k: "tornado", p: 0.5, n: 8, dur: 2.4 },
  M15: { k: "gust", p: 1, w: 110 },
  M16: { k: "updraft", p: 0.8, r: 50 },
  M17: { k: "boulder", p: 2.5, spr: "p_bigrock" },
  M18: { k: "crack", p: 0.7, n: 5, spike: 1 },
  M19: { k: "quake", p: 3, stacks: 2 },
  M20: { k: "grab", p: 1.5, dur: 2 },
  M21: { k: "fan", p: 0.6, n: 3, spread: 0.1, spr: "p_thorn", speed: 520, stacks: 3 },
  M22: { k: "field", p: 0.15, n: 12, dur: 6, r: 64 },
  M23: { k: "debuff", p: 1, armor: 0.3 },
  M24: { k: "field", p: 0.12, n: 16, dur: 8, r: 80, ground: 1, slow: 1 },
  M25: { k: "proj", p: 2.2, spr: "p_arcane", speed: 520, pierce: 99 },
  M26: { k: "healLight", p: 0.2 },
  M27: { k: "flash", p: 0.5, stun: 1.5 },
  M28: { k: "pillars", p: 1.5, n: 4 },
  M29: { k: "proj", p: 2, spr: "p_shadow", speed: 240, homing: 2.4 },
  M30: { k: "drain", p: 1.5, heal: 0.3 },
  M31: { k: "debuff", p: 0, curse: 0.4, dur: 10 },
  M32: { k: "vortex", p: 0.6, n: 6, dur: 3, r: 90 },
  B04: { k: "field", p: 0.2, n: 16, dur: 8, r: 90, ground: 1, slow: 1 },
  B05: { k: "nova", p: 9, r: 120, cost: 0.15, big: 1 },
};
export const actOf = (id) => S[id] ?? M[id] ?? null;

const parseCd = (it) => it.cd ?? 6;
export const baseCooldown = (id) => {
  const b = BASE[id];
  if (!b) return 6;
  if (b.kind === "magic") return Math.max(2, (b.mana ?? 20) / 9);
  return parseCd(b);
};
export const baseMana = (id) => BASE[id]?.mana ?? 0;

// ── 레시피 ───────────────────────────────────────────
const RECIPE = {};
for (const f of FUSIONS) RECIPE[[...f.mats].sort().join("+")] = f;
export const recipeOf = (mats) => RECIPE[[...mats].sort().join("+")] ?? null;
export const LEGENDS = FUSIONS.filter((f) => f.cat === "LG");

// ── 아이템 인스턴스 ─────────────────────────────────
let UID = 1;
export const newUid = () => `i${Date.now().toString(36)}${(UID++).toString(36)}`;
export function makeBase(id, grade = 1) {
  const b = BASE[id];
  if (!b) return null;
  return withGrade({ uid: newUid(), id, kind: b.kind, name: b.name, el: b.el, tier: 0, mats: [id], traits: [...(b.traits ?? [])], power: 1, runes: [], relic: id.startsWith("B") }, grade);
}

// ── 티어 (T1~T6, 알비온식) ─────────────────────────
// 같은 장검이라도 티어가 높을수록 강하다 (한 티어마다 x1.18). power(융합 배율)와 따로 곱한다.
// 티어를 끼려면 그 계열의 운명 보드 숙련이 그 티어에 닿아 있어야 한다.
export const GRADE_MAX = 6;
export const GRADE_ROMAN = ["", "T1", "T2", "T3", "T4", "T5", "T6"];
export const GRADE_MULT = [1, 1, 1.18, 1.39, 1.64, 1.94, 2.29];
export const GRADE_CSS = ["#e0e0e0", "#c8c8c8", "#8fe07a", "#7ab8ff", "#d090ff", "#ffb040", "#ff6a5a"];
export const gradeOf = (it) => Math.max(1, Math.min(GRADE_MAX, it?.grade ?? 1));
export const gradeMult = (it) => GRADE_MULT[gradeOf(it)] * masteryMult(it);
const stripGrade = (name) => String(name ?? "").replace(/ ([ⅠⅡⅢⅣⅤ]|T\d)$/, "");
export function withGrade(it, g) {
  if (!it) return it;
  it.grade = Math.max(1, Math.min(GRADE_MAX, g | 0 || 1));
  it.name = stripGrade(it.name) + " " + GRADE_ROMAN[it.grade];
  return it;
}
// 지역 난이도(lvl) → 떨어지는 티어: 그래스메어 T1~2 · 그린스텝 T3~4 · 스톤브리지 T5~6
export function dropGrade(region) {
  const g = Math.min(GRADE_MAX, (region | 0) + 1);
  const r = Math.random();
  return Math.max(1, Math.min(GRADE_MAX, r < 0.1 ? g - 1 : r > 0.7 ? g + 1 : g));
}

// ── 운명 보드 ───────────────────────────────────────
// 구조: 가운데 → 직업 마디 → 계통 마디(레벨 0~100) → 장비 전문화 마디(레벨 0~100)
// 계통 레벨이 오르면 그 계통의 장착 티어가 열린다. 명성은 끼고 싸울 때 직업·계통·장비에 함께 쌓인다.
export const CLASSES = [
  { id: "warrior", name: "전사", desc: "근접 무기 · 판금 갑주 · 방패" },
  { id: "hunter", name: "사냥꾼", desc: "원거리 무기 · 가죽옷" },
  { id: "mage", name: "마법사", desc: "마법 · 천옷" },
  { id: "martial", name: "무술가", desc: "기술" },
];
export const LV_MAX = 100;
export const SPEC_MAX = LV_MAX;
// lv까지 누적 명성
export const levelNeed = (lv) => Math.round(5 * Math.pow(lv, 1.8));
export const specNeed = levelNeed;
// 계통 레벨 → 장착 티어 (T1은 처음부터)
export const TIER_LV = [0, 0, 5, 15, 30, 55, 85];
let DS = null;
export const bindDestiny = (data) => (DS = data ? (data.destiny = data.destiny ?? {}) : null);
const baseIdOf = (it) => String(it?.tier ? it.primary ?? it.id : it?.id ?? it).split("@")[0];
const EL_KO = { fire: "화염", ice: "냉기", lightning: "번개", wind: "바람", earth: "대지", poison: "독", light: "빛", dark: "어둠" };
const ARMOR_G = [[/방패/, "방패", "warrior"], [/로브|도복|법의|앞치마|왕관/, "천옷", "mage"], [/망토|외투|작업복/, "가죽옷", "hunter"], [/.*/, "판금 갑주", "warrior"]];
// 장비가 하나뿐인 계통은 「그 밖의 …」로 합친다
let LCOUNT = null;
function placeOf(id) {
  const p = rawPlace(id);
  if (!p) return p;
  if (!LCOUNT) {
    LCOUNT = {};
    for (const x of Object.keys(BASE)) {
      const q = rawPlace(x);
      q && (LCOUNT[q.join(":")] = (LCOUNT[q.join(":")] ?? 0) + 1);
    }
  }
  if (LCOUNT[p.join(":")] >= 2) return p;
  const tail = { warrior: "근접 무기", hunter: "원거리 무기", mage: "마법", martial: "기술" }[p[0]];
  return [p[0], BASE[id].kind === "armor" ? p[1] : `그 밖의 ${tail}`];
}
function rawPlace(id) {
  const b = BASE[id];
  if (!b || id.startsWith("B")) return null;
  if (b.kind === "weapon") return /근접|짧음/.test(b.range ?? "근접") ? ["warrior", `${b.traits?.[0] ?? "무기"} 무기`] : ["hunter", `${b.traits?.[0] ?? "무기"} 무기`];
  if (b.kind === "magic") return ["mage", `${EL_KO[b.el] ?? "비전"} 마법`];
  if (b.kind === "armor") {
    const g = ARMOR_G.find(([re]) => re.test(b.name));
    return [g[2], g[1]];
  }
  if (b.kind === "skill") return ["martial", `${b.traits?.[0] ?? "기술"} 기술`];
  return null;
}
export const classOf = (it) => (it ? placeOf(baseIdOf(it))?.[0] ?? null : null);
export function lineKeyOf(it) {
  const p = it && placeOf(baseIdOf(it));
  return p ? `l:${p[0]}:${p[1]}` : null;
}
let WEB = null;
export function destinyWeb() {
  if (WEB) return WEB;
  const m = new Map(CLASSES.map((C) => [C.id, new Map()]));
  for (const id of Object.keys(BASE)) {
    const p = placeOf(id);
    if (!p) continue;
    const L = m.get(p[0]);
    L.has(p[1]) || L.set(p[1], []);
    L.get(p[1]).push(id);
  }
  WEB = CLASSES.map((C) => ({ ...C, lines: [...m.get(C.id)].map(([name, items]) => ({ key: `l:${C.id}:${name}`, name, items })) }));
  return WEB;
}
export const fameOf = (k) => (DS && DS[k]) || 0;
// 명성 → 레벨 0~100
export function levelOf(k) {
  const f = fameOf(k);
  let lo = 0, hi = LV_MAX;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    f >= levelNeed(mid) ? (lo = mid) : (hi = mid - 1);
  }
  return lo;
}
export function progOf(k) {
  const lv = levelOf(k);
  return lv >= LV_MAX ? 1 : Math.max(0, Math.min(1, (fameOf(k) - levelNeed(lv)) / (levelNeed(lv + 1) - levelNeed(lv))));
}
export const classLevel = (cid) => levelOf(`c:${cid}`);
export const lineLevel = (lk) => levelOf(lk);
export const specLevel = (id) => levelOf(`i:${id}`);
export const specProg = (id) => progOf(`i:${id}`);
export function lineTier(lk) {
  const lv = lineLevel(lk);
  let t = 1;
  while (t < GRADE_MAX && lv >= TIER_LV[t + 1]) t++;
  return t;
}
// 위력: 계통 레벨마다 +0.2% · 이 장비 전문화 레벨마다 +0.2% · 같은 계통 다른 장비 전문화 합의 0.05%(최대 +10%)
export function masteryMult(it) {
  const lk = lineKeyOf(it);
  if (!lk || !DS) return 1;
  const id = baseIdOf(it);
  const line = destinyWeb().flatMap((C) => C.lines).find((L) => L.key === lk);
  const others = (line?.items ?? []).reduce((s, x) => (x === id ? s : s + specLevel(x)), 0);
  return (1 + 0.002 * lineLevel(lk)) * (1 + 0.002 * specLevel(id) + Math.min(0.1, 0.0005 * others));
}
// 장비 티어가 그 계통 레벨로 열린 티어보다 높으면 못 낀다
export function canEquip(it) {
  const lk = lineKeyOf(it);
  return !lk || gradeOf(it) <= lineTier(lk);
}
export function needText(it) {
  const lk = lineKeyOf(it);
  if (!lk) return "";
  const g = gradeOf(it);
  return `운명 보드 「${lk.split(":")[2]}」 ${TIER_LV[g]}레벨에 T${g} (지금 ${lineLevel(lk)}레벨) · B키`;
}
// 명성 더하기: 직업 · 계통 · 장비에 함께 쌓인다
export function addFame(it, n) {
  const lk = lineKeyOf(it);
  if (!DS || !lk || !(n > 0)) return null;
  const id = baseIdOf(it), cid = lk.split(":")[1], ck = `c:${cid}`, ik = `i:${id}`;
  const t0 = lineTier(lk), l0 = lineLevel(lk), s0 = specLevel(id);
  DS[ck] = fameOf(ck) + n;
  DS[lk] = fameOf(lk) + n;
  DS[ik] = fameOf(ik) + n;
  const t1 = lineTier(lk), l1 = lineLevel(lk), s1 = specLevel(id);
  return {
    className: CLASSES.find((x) => x.id === cid).name, lineName: lk.split(":")[2], itemName: BASE[id]?.name,
    tierUp: t1 > t0 ? t1 : 0, lineUp: l1 > l0 ? l1 : 0, specUp: s1 > s0 ? s1 : 0,
  };
}

// ── 지역 재료 ───────────────────────────────────────
// 상점에서 T2 이상을 사려면 골드와 함께 그 등급의 재료가 필요하다.
export const MATS = {
  ember: { id: "ember", name: "잿불 숯", grade: 2, color: 0xff8a3a, css: "#ffa060", regions: [0, 1] },
  ore: { id: "ore", name: "울림 철광석", grade: 3, color: 0x9ab0c8, css: "#b8cce0", regions: [2, 3] },
  frost: { id: "frost", name: "서리불 결정", grade: 4, color: 0x70e0ff, css: "#90e8ff", regions: [4, 5, 6] },
  storm: { id: "storm", name: "뇌정 수정", grade: 5, color: 0xd090ff, css: "#d8a8ff", regions: [7, 8, 9, 10, 11] },
  star: { id: "star", name: "별쇠 조각", grade: 6, color: 0xff6a5a, css: "#ff8a7a", regions: [] },
};
export const MAT_LIST = Object.values(MATS);
export const matOfRegion = (region) => MAT_LIST.find((m) => m.regions.includes(Math.max(0, Math.min(11, region | 0)))) ?? MATS.ember;
export const matOfGrade = (g) => MAT_LIST.find((m) => m.grade === g) ?? null;
// 등급별 상점 값: 골드 배율, 재료 개수
export const GRADE_PRICE = [0, 1, 2.2, 4.8, 10, 21, 45];
export const GRADE_MATN = [0, 0, 3, 5, 7, 9, 12];
export const kindLetter = (k) => KC[k];
const catOf = (a, b) => {
  const ka = KORD.indexOf(a.kind),
    kb = KORD.indexOf(b.kind);
  const [x, y] = ka <= kb ? [a, b] : [b, a];
  return { cat: KC[x.kind] + KC[y.kind], first: x, second: y };
};
// 무기-방어구 계열 판정 (방어구에서 파생된 것은 방어구 계열)
const isArmorLine = (it) => it.kind === "armor" || (it.mats ?? []).some((m) => BASE[m]?.kind === "armor" && it.kind !== "skill");
const isWeaponLine = (it) => it.kind === "weapon";

// 1차 융합 결과 계산. 불가하면 {err}
// 융합 결과의 등급 = 재료 중 낮은 등급
export function fuse1(a0, b0) {
  const r = fuse1raw(a0, b0);
  r.item && withGrade(r.item, Math.min(gradeOf(a0), gradeOf(b0)));
  return r;
}
function fuse1raw(a0, b0) {
  if (!a0 || !b0) return { err: "재료 두 개를 고르세요" };
  // 이름에 붙은 등급 표시는 융합 이름을 만들 때 뺀다
  const a = { ...a0, name: stripGrade(a0.name) }, b = { ...b0, name: stripGrade(b0.name) };
  if (a.uid === b.uid) return { err: "같은 칸을 두 번 고를 수 없습니다" };
  if (a.tier !== 0 || b.tier !== 0) return { err: "1차 융합은 기본 아이템끼리만 됩니다" };
  if ((isWeaponLine(a) && isArmorLine(b)) || (isWeaponLine(b) && isArmorLine(a))) return { err: "무기와 방어구는 융합할 수 없습니다" };
  const { cat, first, second } = catOf(a, b);
  const kind = COMBO[cat];
  if (!kind) return { err: "융합할 수 없는 조합입니다" };
  // 속성
  let el = null;
  const ea = a.el, eb = b.el;
  if (ea && eb) el = ea === eb ? ea : compOf(ea, eb);
  else el = ea || eb || null;
  const rec = recipeOf([a.id, b.id]);
  const same = a.id === b.id;
  const name = rec ? rec.name : same ? `진화한 ${a.name}` : genName(cat, first, second, el);
  const desc = rec ? rec.desc : same ? `${a.name}의 모든 능력이 강해진 진화형` : `${first.name}와 ${second.name}의 힘을 합친 ${CAT_KO[cat]}`;
  const magicLine = first.kind === "magic" || second.kind === "magic";
  const item = {
    uid: newUid(),
    id: rec ? rec.id : `X-${cat}-${[a.id, b.id].sort().join("-")}`,
    kind,
    cat,
    catKo: CAT_KO[cat],
    name,
    desc,
    el,
    tier: 1,
    mats: [a.id, b.id],
    primary: first.id,
    secondary: second.id,
    traits: [...new Set([...(a.traits ?? []), ...(b.traits ?? [])])],
    power: same ? 1.6 : rec && rec.id.startsWith("F") ? 1.5 : 1.4,
    magicLine,
    same,
    runes: [a, b].filter((x) => x.kind === "rune").map((x) => x.id),
  };
  // 각인끼리 → 복합 각인 (특성 2개)
  if (cat === "GG") item.runes = [a.id, b.id];
  return { item };
}
function genName(cat, first, second, el) {
  const pre = el ? ELEMS[el].prefix + " " : "";
  switch (cat) {
    case "WS": return `${second.name} ${first.name}`;
    case "WM": return `${pre}${first.name}`;
    case "WG": return `${second.name}의 ${first.name}`;
    case "SS": return `${first.name}·${second.name}`;
    case "SM": return `${pre}${first.name}`;
    case "SA": return `반격 ${first.name}`;
    case "SG": return `${second.name}의 ${first.name}`;
    case "MM": return `${pre}${first.name}`;
    case "MA": return `${pre}${second.name}`;
    case "MG": return `${second.name}의 ${first.name}`;
    case "AA": return `강화 ${first.name}`;
    case "AG": return `${second.name}의 ${first.name}`;
    case "GG": return `${first.name}·${second.name} 각인`;
    default: return `${first.name}+${second.name}`;
  }
}

// 2차 융합: 1차 결과물 + 속성 재료 → 속성만 변환
export function fuse2(target, mat) {
  const r = fuse2raw(target, mat);
  r.item && withGrade(r.item, Math.min(gradeOf(target), gradeOf(mat)));
  return r;
}
function fuse2raw(target, mat) {
  if (!target || !mat) return { err: "재료 두 개를 고르세요" };
  let t = target, m = mat;
  if (t.tier !== 1 && m.tier === 1) [t, m] = [m, t];
  const extra = (t.runes ?? []).includes("B12") && t.tier === 2 && !t.extraUsed;
  if (t.tier !== 1 && !extra) return { err: t.tier >= 2 ? "완성품은 더 이상 융합할 수 없습니다" : "2차 융합은 1차 결과물에만 합니다" };
  if (!m.el || ELEMS[m.el].kind !== "base") return { err: "속성을 가진 기본 재료가 필요합니다" };
  if (m.tier !== 0) return { err: "재료는 기본 아이템이어야 합니다" };
  const cur = t.el ? ELEMS[t.el] : null;
  let el;
  if (cur && cur.kind !== "base") return { err: "복합·순수 속성 결과물은 2차 융합할 수 없습니다" };
  if (t.magicLine) {
    if (!cur) return { err: "마법 계열은 같은 속성 재료만 됩니다" };
    if (cur.id !== m.el) return { err: `마법 계열은 같은 속성(${cur.name})만 넣을 수 있습니다` };
    el = pureOf(cur.id);
  } else if (!cur) el = m.el;
  else if (cur.id === m.el) el = pureOf(cur.id);
  else el = compOf(cur.id, m.el);
  const E = ELEMS[el];
  const item = {
    ...t,
    uid: newUid(),
    el,
    tier: 2,
    name: `${E.prefix} ${stripGrade(t.name).replace(/^\S+ (?=\S)/, (w) => (Object.values(ELEMS).some((e) => e.prefix + " " === w) ? "" : w))}`,
    power: t.power * (E.kind === "pure" ? 1.3 : 1.15),
    extraUsed: extra || t.extraUsed,
    mats: [...t.mats, m.id],
  };
  return { item };
}

// 전설: 재료 3개 (+ 융합석)
export function fuseLegend(list) {
  const r = fuseLegendRaw(list);
  r.item && withGrade(r.item, Math.min(...list.map(gradeOf)));
  return r;
}
function fuseLegendRaw(list) {
  if (list.length !== 3) return { err: "전설 융합은 재료 3개가 필요합니다" };
  if (list.some((x) => x.tier !== 0)) return { err: "전설 재료는 기본 아이템이어야 합니다" };
  const rec = recipeOf(list.map((x) => x.id));
  if (!rec || rec.cat !== "LG") return { err: "알려진 전설 레시피가 아닙니다" };
  const kinds = list.map((x) => x.kind);
  const kind = kinds.includes("weapon") ? "weapon" : kinds.includes("magic") && !kinds.includes("armor") ? "magic" : kinds.includes("armor") ? "armor" : kinds.includes("skill") ? "skill" : "rune";
  const primary = list.find((x) => x.kind === kind) ?? list[0];
  const els = [...new Set(list.map((x) => x.el).filter(Boolean))];
  const el = els.length >= 2 ? compOf(els[0], els[1]) : els[0] ?? null;
  const item = {
    uid: newUid(), id: rec.id, kind, cat: "LG", catKo: "전설", name: rec.name, desc: rec.desc, el, tier: 3,
    mats: list.map((x) => x.id), primary: primary.id,
    secondary: list.find((x) => x !== primary && (x.kind === "skill" || x.kind === "magic"))?.id ?? list.find((x) => x !== primary).id,
    third: list.filter((x) => x !== primary)[1]?.id,
    traits: [...new Set(list.flatMap((x) => x.traits ?? []))], power: 2.2, magicLine: kinds.includes("magic"),
    runes: list.filter((x) => x.kind === "rune").map((x) => x.id), legend: true,
  };
  return { item };
}

// 아이템 한 줄 설명
export function describe(it) {
  if (!it) return "";
  if (it.tier === 0) {
    const b = BASE[it.id];
    if (b.relic) return `[보스 유물] ${b.desc}`;
    if (b.kind === "weapon") return `${b.attack}. 특수: ${b.special}`;
    if (b.kind === "skill") return `${b.desc} · 쿨타임 ${b.cd}초 · 피해 ${b.dmg}`;
    if (b.kind === "magic") return `${b.desc} · 마나 ${b.mana} · 피해 ${b.dmg}`;
    if (b.kind === "armor") return `방어 ${b.defense} · ${b.desc}`;
    if (b.kind === "rune") return b.desc;
    return b.desc ?? "";
  }
  const e = it.el ? ` · 속성: ${ELEMS[it.el].name}` : "";
  return `${it.desc}${e}`;
}
export const elName = (e) => (e ? ELEMS[e]?.name ?? "" : "");

// 드롭 풀: 지역 번호 이하에서 등장하는 기본 아이템
export function dropPool(region, kinds) {
  return ITEMS.filter((x) => !x.id.startsWith("B") && (x.region ?? 0) <= region && (!kinds || kinds.includes(x.kind)));
}
export const STARTER_IDS = ITEMS.filter((x) => !x.id.startsWith("B") && (x.region ?? 0) === 0).map((x) => x.id);
export const RARITY_OF = (it) => (it.tier === 3 ? "legendary" : it.tier === 2 ? "epic" : it.tier === 1 ? "rare" : it.relic ? "epic" : "common");
