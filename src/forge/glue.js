// 포지로드 ↔ 원본 엔진 연결부.
// 원본(끝없는 경계)의 전투·지형·UI는 그대로 쓰고, 장비·스킬·마법·융합·드롭을 포지로드 규칙으로 바꾼다.
import * as IT from "./items.js";
import * as VFX from "./vfx.js";
import * as ATMO from "./atmo.js";
import * as DEPTH from "./depth.js";
import * as NATANIM from "./natanim.js";
import * as DEV from "./devices.js";
import { showLoad } from "./loadscreen.js";
import { warmProps, prepaintStep } from "./terrain.js";
import * as PROPS from "./props3d.js";
import * as FOES from "./foes/core.js";
import * as SLIME from "./foes/slimefx.js";
import * as UK from "./uikit.js";
import * as AL from "./albui.js";
import * as T2 from "./title2.js";
export { UK, AL };
import "./foes/rg0.js";
import "./foes/regions.js"; // 새 지역 몬스터 행동 (모스바크·그린스텝·스톤브리지·리프크라운·아이언베인·드립스톤·루트홀로우)
import { sahar } from "./foes/m6.js";
import { kryos } from "./foes/m5.js";
import { ignar } from "./foes/m4.js";
import { globrak } from "./foes/m3.js";
import { grauk } from "./foes/m2.js";
import { elkharn } from "./foes/m1.js";
import { bossRun as bossRun0 } from "./foes/boss0.js";
import { bossRun1 } from "./foes/boss1.js";
import { bossRun2 } from "./foes/boss2.js";
import { bossRun3 } from "./foes/boss3.js";
import { bossRun4 } from "./foes/boss4.js";
import { bossRun5 } from "./foes/boss5.js";
import { bossRun6 } from "./foes/boss6.js";
import { interp } from "./interp.js";
import * as SP from "./spells.js";
import * as ZN from "./zones.js";
import * as ZG from "./natgen.js";
import * as CHS from "./chests.js";
import { biomeOf } from "./terrprof.js";
import * as SK from "./skills.js";
import * as LOOK from "./look.js";
import * as ICON from "./icons.js";
import * as UI from "./ui.js";
import * as SCR from "./screens.js";
import { HOOKS } from "./codex.js";
export { HOOKS };
import * as HUB2 from "./hub2.js";
import * as HUB4 from "./hub4.js";
import * as PAPER from "./paper.js";
import * as INV from "./invart.js";
import { makeTiles } from "./tiles.js";
import { makePlayer, makeNpc } from "./char.js";
import { makeMobs } from "./mobs.js";
import * as HUBART from "./hubart.js";
import { paintDeco } from "./natdeco.js";

let R = null; // 엔진 참조 (main.js가 bind로 넘김)
const ORIG_W = {};
const ORIG_A = {};
export function bind(refs) {
  R = refs;
  UK.bindUikit(R);
  AL.bindAlbui(R);
  T2.bindTitle(R);
  VFX.bindVfx(R.zt);
  LOOK.bindLook(R);
  ATMO.bindAtmo(R);
  NATANIM.bindAnim(R);
  DEV.bindDevices(R);
  DEPTH.bindDepth(R);
  FOES.bindFoes(R);
  for (const w of R.ce) ORIG_W[w.id] = structuredClone(w);
  for (const a of R.le) ORIG_A[a.id] = structuredClone(a);
}

// ── 저장 ─────────────────────────────────────────────
export const STARTER = {
  weapon: [["W01", 0], ["W02", 150], ["W03", 150], ["W14", 180]],
  armor: [["A01", 0], ["A02", 140], ["A04", 120], ["A08", 160]],
  skill: [["S01", 0], ["S02", 120], ["S04", 120], ["S15", 140], ["S05", 160]],
  magic: [["M01", 0], ["M05", 140], ["M09", 140], ["M13", 140], ["M17", 140], ["M21", 140], ["M25", 160], ["M29", 160]],
};
export function saveDefaults() {
  return { owned: ["W01", "A01", "S01", "M01"], equip: { weapon: "W01", s1: "S01", s2: null, magic: "M01", armor: "A01" } };
}
const sd = () => {
  const d = R.it.data;
  IT.bindDestiny(d);
  (!d.fr || !Array.isArray(d.fr.owned)) && (d.fr = saveDefaults());
  d.fr.equip = { ...saveDefaults().equip, ...(d.fr.equip ?? {}) };
  for (const id of ["W01", "A01", "S01", "M01"]) d.fr.owned.includes(id) || d.fr.owned.push(id);
  return d.fr;
};

// ── 색·유틸 ─────────────────────────────────────────
const elColor = (e) => (e ? IT.ELEMS[e]?.color ?? 0xffffff : 0xffffff);
const elCss = (e) => (e ? IT.ELEMS[e]?.css ?? "#ffffff" : "#ffffff");
const dispEl = (e) => (e ? IT.partsOf(e)[0] : "phys");
const mixc = (a, b, t) => {
  const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (f(16) << 16) | (f(8) << 8) | f(0);
};
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const dist2 = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// ── 무기·방어구 원형 덮어쓰기 ───────────────────────
function weaponPrimary(item) {
  if (!item) return "W01";
  if (item.tier === 0) return item.id;
  const m = [item.primary, item.secondary, item.third, ...(item.mats ?? [])].find((x) => x && IT.BASE[x]?.kind === "weapon");
  return m ?? "W01";
}
function runeList(item) {
  return item ? [...(item.runes ?? [])] : [];
}
function weaponMods(item) {
  const m = {};
  for (const g of runeList(item)) for (const [k, v] of Object.entries(IT.runeMods(g, "weapon"))) m[k] = (m[k] ?? 0) + v;
  return m;
}
function buildWeaponDef(item) {
  const pid = weaponPrimary(item);
  const [arch, pows, spd] = IT.weaponArch(pid);
  const o = ORIG_W[arch];
  const tpl = o.combo;
  const mods = weaponMods(item);
  const sp = spd * (1 + (mods.spd ?? 0));
  const rng = 1 + (mods.range ?? 0) + (mods.size ?? 0);
  let P = pows.slice();
  const WSP = item.tier > 0 ? interp(item) : null;
  if (item.same) P = [...P, Math.max(...P) * 1.2];
  if (item.cat === "WW" && !item.same) {
    const b = IT.weaponArch([item.primary, item.secondary].find((x) => x !== pid) ?? pid)[1];
    P = [...P.slice(0, -1), Math.max(P[P.length - 1], b[b.length - 1]) * 1.25];
  }
  if (WSP?.combo) P = WSP.combo.slice(0, 12);
  else if (WSP?.comboN) {
    const n = WSP.comboN, base = P.slice(0, -1).length ? P.slice(0, -1) : P;
    P = Array.from({ length: n }, (_, i) => (i === n - 1 ? Math.max(...P) : base[i % base.length]));
  }
  const combo = P.map((p, i) => {
    const t = tpl[Math.min(tpl.length - 1, Math.round((i * (tpl.length - 1)) / Math.max(1, P.length - 1)))];
    const s = { ...t, power: p * (item.power ?? 1) * IT.gradeMult(item), interval: t.interval / sp, windup: (t.windup ?? 0) / sp };
    t.range && !t.projectile && (s.range = t.range * rng);
    t.height && mods.size && (s.height = t.height * (1 + mods.size));
    mods.knock && (s.knockback = (t.knockback ?? 120) * 2);
    return s;
  });
  const b = IT.BASE[pid];
  const ec = item.el ? elColor(item.el) : null;
  return {
    ...structuredClone(o),
    name: item.name,
    desc: IT.describe(item),
    element: dispEl(item.el),
    status: void 0,
    combo,
    critBonus: (o.critBonus ?? 0) + (mods.crit ?? 0),
    special: { ...o.special, name: String(b.special ?? o.special.name).split(":")[0].slice(0, 14), power: o.special.power * (item.power ?? 1) * IT.gradeMult(item) },
    look: ec ? { blade: mixc(o.look.blade, ec, 0.55), hilt: o.look.hilt, accent: ec } : { ...o.look },
    upgrade: { ...o.upgrade, perks: [] },
    frItem: item,
  };
}
function armorPrimary(item) {
  if (!item) return "A01";
  if (item.tier === 0) return item.id;
  return [item.primary, item.secondary, item.third, ...(item.mats ?? [])].find((x) => x && IT.BASE[x]?.kind === "armor") ?? "A01";
}
function armorFx(item) {
  const fx = {};
  if (!item) return fx;
  const add = (o, f = 1) => {
    for (const [k, v] of Object.entries(o)) fx[k] = (fx[k] ?? 0) + v * f;
  };
  const arms = (item.mats ?? [item.id]).filter((x) => IT.BASE[x]?.kind === "armor");
  const f = arms.length > 1 ? 0.7 : 1;
  for (const a of arms) add(IT.armorArch(a)[1], f);
  for (const g of runeList(item)) add(IT.runeMods(g, "armor"));
  const A = item.tier > 0 ? interp(item)?.armor : null;
  if (A) for (const [k, v] of Object.entries(A)) k !== "def" && (fx[k] = v);
  // 방패가 재료에 들어 있으면 막기는 항상 유지
  const sh = arms.map((a) => IT.armorArch(a)[1].block ?? 0).reduce((m, v) => Math.max(m, v), 0);
  sh && !(fx.block >= sh * 0.7) && (fx.block = Math.max(fx.block ?? 0, sh * 0.7));
  return fx;
}
function armorDefense(item) {
  if (!item) return 6;
  const AD = item.tier > 0 ? interp(item)?.armor?.def : null;
  if (AD != null) return Math.round(AD * IT.gradeMult(item));
  const arms = (item.mats ?? [item.id]).filter((x) => IT.BASE[x]?.kind === "armor");
  const f = arms.length > 1 ? 0.7 : 1;
  const d = arms.reduce((s, a) => s + (IT.BASE[a].defense ?? 6) * f, 0) || 6;
  return Math.round(d * (item.tier ? 0.85 + 0.15 * item.power : 1) * IT.gradeMult(item));
}
function overlay(equip, scene) {
  const w = equip.weapon ?? IT.makeBase("W01");
  const wd = buildWeaponDef(w);
  const arch = IT.weaponArch(weaponPrimary(w))[0];
  Object.assign(R.ae[arch], wd);
  try {
    scene?.textures && redrawTex(scene, `w_${arch}`, HUBART.polishWeapon(R.fn(R.ae[arch])));
  } catch (e) {}
  const a = equip.armor ?? IT.makeBase("A01");
  const aarch = IT.armorArch(armorPrimary(a))[0];
  const ao = ORIG_A[aarch];
  Object.assign(R.He[aarch], { ...structuredClone(ao), name: a.name, def: armorDefense(a), defPerLevel: 0, passive: { ...ao.passive, base: 0, perLevel: 0 }, hpMult: 1, moveMult: 1, atkSpeedMult: 1, dashCdMult: 1, resist: 0, resistPerLevel: 0 });
  return { weapons: [arch, null], armor: aarch };
}

// 이미 쓰이고 있는 텍스처는 지우지 않고 캔버스를 다시 그린다
function redrawTex(scene, key, buf) {
  const tex = scene.textures.exists(key) ? scene.textures.get(key) : null;
  const cv = tex?.canvas;
  if (cv && cv.width === buf.w && cv.height === buf.h) {
    const g = tex.context;
    g.clearRect(0, 0, cv.width, cv.height);
    buf.blitTo(g, 0, 0);
    tex.refresh();
  } else if (!tex) R.lt(scene, key, buf);
}
// ── 스탯 ─────────────────────────────────────────────
let slotVer = 0;
function slotIds() {
  return [`frq${slotVer}`, `fre${slotVer}`, `frr${slotVer}`, null];
}
export function stats(scene) {
  const fr = scene.fr;
  const lo = overlay(fr.equip, scene);
  registerSlots(scene);
  const s = R.xe(R.it.data, { weapons: lo.weapons, armor: lo.armor, skills: slotIds() });
  // 원형 갑옷 고유 효과 정리
  Object.assign(s, { healRecvMult: 1, elemTakenMult: 1, meleeTakenMult: 1, dmgMult: 1, skillCdMult: 1, thornsPct: 0, berserkMax: 0, lifesteal: 0, killHealPct: 0 });
  const fx = armorFx(fr.equip.armor);
  fr.afx = fx;
  s.moveSpeed *= 1 + (fx.move ?? 0);
  s.dashCd *= Math.max(0.3, 1 + (fx.dashCd ?? 0));
  s.resist = Math.min(0.7, s.resist + (fx.elemRed ?? 0));
  fx.kbImmune && ((s.knockbackResist = 1), (s.staggerImmune = !0));
  s.healEff += fx.healEff ?? 0;
  fx.thorns && (s.thornsPct = fx.thorns);
  fx.hp && (s.maxHp = Math.round(s.maxHp * (1 + fx.hp)));
  fx.def && (s.def *= 1 + fx.def);
  const at = fr.attr;
  if (at) {
    s.atk *= 1 + 0.04 * at.str;
    s.maxHp = Math.round(s.maxHp * (1 + 0.06 * at.vit));
    s.def += 2 * at.vit;
    s.attackSpeed *= 1 + 0.03 * at.agi;
    s.moveSpeed *= 1 + 0.02 * at.agi;
    s.skillCdMult *= Math.max(0.6, 1 - 0.015 * at.agi);
    s.critChance += 0.015 * at.luk;
    s.critDamage += 0.04 * at.luk;
    s.goldGain += 0.03 * at.luk;
  }
  s.defReduction = Math.min(R.de.maxReduction, s.def / (s.def + R.de.defK));
  const wm = weaponMods(fr.equip.weapon);
  fr.wmods = wm;
  s.lifesteal += wm.lifesteal ?? 0;
  s.goldGain += (wm.gold ?? 0) + (fx.gold ?? 0);
  s.critChance = Math.min(R.de.critCap, s.critChance + (wm.crit ?? 0));
  s.attackSpeed *= 1 + (wm.spd ?? 0);
  const ai = fr.attr?.int ?? 0;
  fr.maxMana = 100 + 6 * ai;
  fr.manaRegen = 3.5 * (1 + (fx.manaRegen ?? 0) + 0.06 * ai);
  fr.magicDmg = (fx.magicDmg ?? 0) + 0.06 * ai;
  return s;
}
export function hubStats(scene) {
  const d = sd();
  const mk = (id) => (id ? mkItem(id) : null);
  const fake = {
    fr: { equip: { weapon: mk(d.equip.weapon) ?? IT.makeBase("W01"), s1: mk(d.equip.s1), s2: mk(d.equip.s2), magic: mk(d.equip.magic), armor: mk(d.equip.armor) ?? IT.makeBase("A01") } },
    textures: scene.textures,
  };
  return stats(fake);
}

// 스킬 슬롯 등록 (Q, E, R)
function registerSlots(scene) {
  slotVer++;
  const fr = scene.fr;
  const ids = slotIds();
  const items = [fr.equip.s1, fr.equip.s2, fr.equip.magic];
  fr.slotIds = ids;
  fr.slotItems = {};
  items.forEach((it, i) => {
    const id = ids[i];
    fr.slotItems[id] = it;
    const cd = it ? itemCooldown(it) : 1;
    R.ve[id] = { id, name: it?.name ?? "", power: 1, cooldown: cd, radius: 60, duration: 3, element: dispEl(it?.el), color: elColor(it?.el), frItem: it };
    try {
      scene.textures && makeSlotIcon(scene, `icon_s_${id}`, it);
    } catch (e) {}
  });
}
function castMods(item) {
  const m = {};
  for (const g of runeList(item)) for (const [k, v] of Object.entries(IT.runeMods(g, "cast"))) m[k] = (m[k] ?? 0) + v;
  return m;
}
function itemCooldown(it) {
  const p = it.tier === 0 ? it.id : it.primary;
  let cd = IT.baseCooldown(p);
  if (it.cat === "SS" || it.cat === "LG") cd = Math.max(cd, IT.baseCooldown(it.secondary)) * 1.1;
  if (it.cat === "MM") cd = (cd + IT.baseCooldown(it.secondary)) * 0.8;
  const cm = castMods(it);
  return Math.max(0.6, cd * (1 - (cm.cdr ?? 0)));
}
function itemMana(it) {
  if (!it) return 0;
  const ids = it.tier === 0 ? [it.id] : [it.primary, it.secondary, it.third].filter(Boolean);
  const mags = ids.filter((x) => IT.BASE[x]?.kind === "magic");
  if (!mags.length) return 0;
  // 마법 기술·마법 무기는 마나를 쓰지 않음
  if (it.kind !== "magic") return 0;
  let m = mags.reduce((s, x) => s + IT.baseMana(x), 0) * (mags.length > 1 ? 0.7 : 1);
  return Math.round(m * (1 + (castMods(it).manaCost ?? 0)));
}

// ── 아이콘 ───────────────────────────────────────────
const KIND_ICON = {
  spin: "blades", dash: "shadowdash", slam: "shockwave", launch: "fissure", wave: "shockwave", rapid: "blades", tele: "shadowdash",
  iaido: "vampstrike", parry: "heal", leap: "shockwave", hook: "vampstrike", shout: "berserk", focus: "berserk", crack: "fissure",
  fan: "blades", beam: "lightning", trap: "fissure", execute: "vampstrike", frenzy: "shadowdash", boomer: "blades", gear: "berserk",
  proj: "fireburst", orbit: "blades", stream: "fireburst", meteor: "fireburst", nova: "iceWave", wall: "iceWave", slowOrb: "iceWave",
  sky: "lightning", chain: "lightning", field: "fissure", tornado: "iceWave", gust: "shockwave", updraft: "shockwave", boulder: "fissure",
  quake: "fissure", grab: "fissure", debuff: "vampstrike", healLight: "heal", flash: "heal", pillars: "lightning", drain: "vampstrike", vortex: "shadowdash",
};
function srcIconFor(it) {
  if (!it) return null;
  const p = it.tier === 0 ? it.id : it.primary;
  const k = IT.BASE[p]?.kind;
  if (k === "weapon") return `w_${IT.weaponArch(p)[0]}`;
  if (k === "armor") return `icon_a_${IT.armorArch(p)[0]}`;
  if (k === "rune") return "fr_rune";
  const a = IT.actOf(p);
  return `icon_s_${KIND_ICON[a?.k] ?? "shockwave"}`;
}
function recolor(scene, src, dst, tint, amt, size = 20) {
  const tex = scene.textures;
  if (!tex.exists(src)) return !1;
  const img = tex.get(src).getSourceImage();
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = !1;
  const sw = img.width, sh = img.height;
  const fr = tex.get(src).get(0);
  const fw = fr?.width ?? sw, fh = fr?.height ?? sh;
  const sc = Math.min(1, size / Math.max(fw, fh));
  g.drawImage(img, fr?.cutX ?? 0, fr?.cutY ?? 0, fw, fh, Math.round((size - fw * sc) / 2), Math.round((size - fh * sc) / 2), Math.round(fw * sc), Math.round(fh * sc));
  if (tint != null && amt > 0) {
    const d = g.getImageData(0, 0, size, size);
    const tr = (tint >> 16) & 255, tg = (tint >> 8) & 255, tb = tint & 255;
    for (let i = 0; i < d.data.length; i += 4) {
      if (!d.data[i + 3]) continue;
      const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
      const L = (r * 0.3 + gg * 0.59 + b * 0.11) / 255;
      if (L < 0.14) continue;
      const k = Math.min(1.2, 0.3 + L * 1.1);
      d.data[i] = Math.min(255, r * (1 - amt) + tr * k * amt);
      d.data[i + 1] = Math.min(255, gg * (1 - amt) + tg * k * amt);
      d.data[i + 2] = Math.min(255, b * (1 - amt) + tb * k * amt);
    }
    g.putImageData(d, 0, 0);
  }
  tex.exists(dst) && tex.remove(dst);
  tex.addCanvas(dst, c);
  return !0;
}
function makeSlotIcon(scene, key, it) {
  if (!it) {
    recolor(scene, "icon_lock", key, null, 0);
    return;
  }
  if (key.startsWith("icon_s_")) return void ICON.composeIcon(scene, key, it, elColor, 20);
  return void ICON.composeIcon(scene, key, it, elColor, 24);
  const src = srcIconFor(it);
  const kind = IT.BASE[it.tier === 0 ? it.id : it.primary]?.kind;
  recolor(scene, src, key, it.el ? elColor(it.el) : kind === "magic" ? 0x9ab0ff : null, it.el ? 0.55 : 0);
}
export function itemIcon(scene, it) {
  if (it.tier === 0 && scene.textures.exists(`fi_${it.id}`)) return `fi_${it.id}`;
  const key = `fr_ic_${it.uid}`;
  if (!scene.textures.exists(key)) makeSlotIcon(scene, key, it);
  return key;
}
export const rarityColor = (it) => IT.RARITY_COL[IT.RARITY_OF(it)];
// 희귀도 테두리 텍스처 (크기 s × s, 2026-11-28): 일반 회색 얇은 사각 · 고급 초록 모서리 꺾쇠 · 희귀 파랑 리벳 4개 · 영웅 보라 팔각 + 위 보석 · 전설 금 장식 틀 + 소용돌이
export function rarityFrame(scene, rar, s) {
  const key = `rf_${rar}_${s}`;
  if (scene.textures.exists(key)) return key;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s + 6;
  const g = cv.getContext("2d"), o = 3;
  const px = (x, y, c, w = 1, h = 1) => ((g.fillStyle = c), g.fillRect(o + x, o + y, w, h));
  const box = (c, t, cut = 0) => {
    for (let i = 0; i < t; i++) {
      px(cut, i, c, s - cut * 2, 1), px(cut, s - 1 - i, c, s - cut * 2, 1), px(i, cut, c, 1, s - cut * 2), px(s - 1 - i, cut, c, 1, s - cut * 2);
    }
  };
  if (rar === "common") (box("#2a2a2a", 2), box("#8a8a8a", 1));
  else if (rar === "uncommon") {
    box("#1a3a14", 2), box("#4aa83a", 1);
    const L = Math.max(4, s >> 2);
    for (const [x, y, dx, dy] of [[0, 0, 1, 1], [s - 1, 0, -1, 1], [0, s - 1, 1, -1], [s - 1, s - 1, -1, -1]])
      for (let k = 0; k < L; k++) (px(x + dx * k - (dx < 0 ? 0 : 0), y - dy * 1, "#a8ff90"), px(x - dx * 1, y + dy * k, "#a8ff90"), px(x + dx * k, y, "#7be36a"), px(x, y + dy * k, "#7be36a"));
  } else if (rar === "rare") {
    box("#0e2240", 2), box("#4a90e0", 1);
    px(1, 1, "#4a90e0", s - 2, 1);
    for (const [x, y] of [[1, 1], [s - 4, 1], [1, s - 4], [s - 4, s - 4]]) (px(x, y, "#2a5a98", 3, 3), px(x, y, "#cfe6ff"), px(x + 1, y + 1, "#8ac0ff"));
  } else if (rar === "epic") {
    const c = 3;
    box("#2a1040", 2, c), box("#a060e0", 1, c);
    for (let k = 0; k <= c; k++) for (const [x, y] of [[c - k, k], [s - 1 - c + k, k], [k, s - 1 - c + k], [s - 1 - k, s - 1 - c + k]]) px(x, y, "#c58aff");
    const m = s >> 1;
    px(m - 2, -2, "#5a2a8a", 4, 4), px(m - 1, -2, "#f0c8ff", 2, 1), px(m - 1, -1, "#d090ff", 2, 2);
  } else {
    box("#3a2408", 3), box("#f0b030", 2), box("#ffe9a0", 1);
    for (const [x, y, dx, dy] of [[0, 0, 1, 1], [s - 1, 0, -1, 1], [0, s - 1, 1, -1], [s - 1, s - 1, -1, -1]]) {
      px(x + dx * 2, y + dy * 2, "#fff4c0"), px(x + dx * 3, y + dy * 2, "#f0b030"), px(x + dx * 2, y + dy * 3, "#f0b030"), px(x + dx * 3, y + dy * 3, "#b07010");
      px(x - dx * 1, y - dy * 1, "#ffd860");
    }
    const m = s >> 1;
    px(m - 3, -3, "#3a2408", 6, 4), px(m - 2, -3, "#f0b030", 4, 3), px(m - 1, -3, "#fff4c0", 2, 1);
  }
  scene.textures.addCanvas(key, cv);
  return key;
}
const RAR_KINDS = new Set(["skill", "magic"]);
// 스킬·마법 그림 위에 희귀도 테두리를 얹는다 (전설은 은은한 빛이 돈다). 돌려준 물체 목록은 부르는 쪽이 지운다
export function rarityDeco(scene, it, x, y, s, depth) {
  if (!it || !RAR_KINDS.has(it.kind ?? IT.BASE[it.id]?.kind)) return [];
  const rar = IT.RARITY_OF(it), out = [scene.add.image(x, y, rarityFrame(scene, rar, s)).setDepth(depth)];
  if (rar === "legendary" || rar === "epic") {
    const gl = scene.add.image(x, y, "vx_glow").setTint(IT.RARITY_COL[rar]).setBlendMode(R.zt.BlendModes.ADD).setScale((s / 40) * 1.2).setAlpha(rar === "legendary" ? 0.5 : 0.28).setDepth(depth - 0.1);
    const tw = scene.tweens.add({ targets: gl, alpha: rar === "legendary" ? 0.2 : 0.12, scale: (s / 40) * 1.45, duration: 900, yoyo: !0, repeat: -1 });
    gl.once("destroy", () => tw.remove());
    out.push(gl);
  }
  return out;
}

// 부팅 시 생성하는 공용 텍스처
export function bootTextures(scene) {
  CHS.chestTextures(scene);
  VFX.bootVfx(scene, R.ht, R.lt);
  ICON.bootIcons(scene, R.ht, R.lt);
  makePlayer(scene, R.ht, R.Et, R.As, R.le);
  ATMO.bootAtmo(scene);
  const g = (k, w, h, f) => {
    const b = new R.ht(w, h);
    f(b);
    R.lt(scene, k, b);
  };
  // 각인 아이콘
  g("fr_rune", 20, 20, (b) => {
    b.circle(10, 10, 8, 0x3a2e48);
    b.ring(10, 10, 8, 1.5, 0xd8c090);
    b.line(10, 4, 10, 16, 0xffe8b0);
    b.line(6, 7, 14, 13, 0xffe8b0);
    b.line(14, 7, 6, 13, 0xffe8b0);
    b.outline();
  });
  // 융합석
  g("fr_stone", 16, 16, (b) => {
    b.poly([[8, 1], [14, 6], [12, 14], [4, 14], [2, 6]], 0xff8a3a);
    b.poly([[8, 3], [12, 7], [10, 12], [6, 12], [4, 7]], 0xffc070);
    b.px(7, 5, 0xffffff);
    b.px(8, 5, 0xffffff);
    b.outline();
  });
  // 카드용 흰 문양 14x14 (색은 tint)
  const W = 0xffffff;
  g("perk_frw", 14, 14, (b) => { b.line(2, 12, 11, 3, W); b.line(3, 12, 12, 3, W); b.line(2, 9, 5, 12, W); b.rect(10, 2, 3, 2, W); });
  g("perk_frs", 14, 14, (b) => { b.ring(7, 7, 6, 1.5, W); b.line(3, 7, 11, 7, W); b.line(9, 4, 12, 7, W); b.line(9, 10, 12, 7, W); });
  g("perk_frm", 14, 14, (b) => { b.circle(7, 7, 4, W); b.ring(7, 7, 6.5, 1, W, 160); b.px(2, 2, W); b.px(12, 3, W); b.px(11, 12, W); });
  g("perk_fra", 14, 14, (b) => { b.poly([[2, 2], [12, 2], [12, 8], [7, 13], [2, 8]], W); b.rect(6, 4, 2, 6, 0x000000, 90); });
  g("perk_frg", 14, 14, (b) => { b.ring(7, 7, 6, 1.5, W); b.line(7, 2, 7, 12, W); b.line(3, 4, 11, 10, W); b.line(11, 4, 3, 10, W); });
  g("perk_frstone", 14, 14, (b) => { b.poly([[7, 1], [13, 5], [11, 13], [3, 13], [1, 5]], W); });
  // 지역 재료 아이콘
  const shade = (c, k) => ((Math.min(255, ((c >> 16) & 255) * k) << 16) | (Math.min(255, ((c >> 8) & 255) * k) << 8) | Math.min(255, (c & 255) * k)) >>> 0;
  for (const m of IT.MAT_LIST)
    g(`fr_mat_${m.id}`, 12, 12, (b) => {
      if (m.id === "ember") (b.circle(6, 7, 4.5, 0x2a1a14), b.circle(5, 6, 2.5, m.color), b.px(7, 8, 0xffe0a0));
      else if (m.id === "ore") (b.poly([[1, 9], [3, 3], [8, 1], [11, 6], [9, 11], [3, 11]], 0x5a5a66), b.poly([[4, 5], [7, 3], [9, 6], [6, 8]], m.color), b.px(5, 9, 0xe0e8f0));
      else (b.poly([[6, 0], [10, 5], [6, 11], [2, 5]], shade(m.color, 0.6)), b.poly([[6, 1], [8, 5], [6, 9], [4, 5]], m.color), b.px(5, 3, 0xffffff));
      b.outline();
    });
  // 구역 관문: 돌 아치 + 안쪽 빛
  g("fr_gate", 30, 46, (b) => {
    const S0 = 0x5a5468, S1 = 0x7a748a, S2 = 0x3a3446;
    b.rect(1, 42, 28, 4, S2);
    b.rect(2, 10, 6, 33, S0);
    b.rect(22, 10, 6, 33, S0);
    b.rect(3, 10, 3, 32, S1);
    b.rect(23, 10, 3, 32, S1);
    b.poly([[2, 12], [6, 5], [15, 1], [24, 5], [28, 12], [22, 12], [20, 8], [15, 6], [10, 8], [8, 12]], S0);
    b.poly([[4, 10], [8, 5], [15, 3], [15, 5], [10, 7], [7, 11]], S1);
    b.rect(13, 1, 4, 5, 0xd8c090);
    for (const y of [18, 26, 34]) (b.rect(2, y, 6, 1, S2), b.rect(22, y, 6, 1, S2));
    b.outline();
  });
  g("fr_gate_glow", 16, 30, (b) => {
    for (let y = 0; y < 30; y++)
      for (let x = 0; x < 16; x++) {
        const dx = (x - 7.5) / 8, dy = (y - 15) / 15;
        const d = dx * dx + dy * dy;
        d < 1 && b.px(x, y, 0xffffff, Math.round(230 * (1 - d)));
      }
  });
  // 위로 가는 문: 하늘빛 아치 + 위로 오르는 계단
  g("fr_gate_up", 30, 46, (b) => {
    const S0 = 0x8a9ab8, S1 = 0xc8d8f0, S2 = 0x4a5878;
    b.rect(1, 42, 28, 4, S2);
    b.rect(2, 12, 5, 31, S0);
    b.rect(23, 12, 5, 31, S0);
    b.rect(3, 12, 2, 30, S1);
    b.rect(24, 12, 2, 30, S1);
    b.poly([[2, 14], [15, 0], [28, 14], [23, 14], [15, 6], [7, 14]], S0);
    b.poly([[4, 13], [15, 2], [15, 5], [7, 13]], S1);
    for (let k = 0; k < 4; k++) b.rect(9 + k * 2, 38 - k * 6, 12 - k * 4, 3, 0xe8f4ff);
    b.poly([[15, 9], [19, 14], [11, 14]], 0xffffff);
    b.outline();
  });
  // 아래로 가는 문: 바위 동굴 입구
  g("fr_gate_down", 34, 40, (b) => {
    const S0 = 0x5a4a3a, S1 = 0x7a6a52, S2 = 0x2a2018;
    b.poly([[0, 40], [2, 22], [8, 8], [17, 2], [26, 8], [32, 22], [34, 40]], S0);
    b.poly([[3, 38], [5, 22], [10, 10], [17, 5], [17, 9], [12, 14], [8, 24], [7, 38]], S1);
    b.poly([[7, 40], [9, 24], [13, 15], [17, 12], [21, 15], [25, 24], [27, 40]], 0x0a0806);
    b.poly([[17, 26], [21, 31], [13, 31]], 0xffd890);
    b.poly([[17, 36], [21, 31], [13, 31]], 0xffd890);
    b.rect(0, 38, 34, 2, S2);
    b.outline();
  });
  // 귀환 표석
  g("fr_waystone", 18, 36, (b) => {
    b.rect(2, 30, 14, 6, 0x3a3440);
    b.rect(1, 33, 16, 3, 0x2a2430);
    b.poly([[4, 30], [3, 6], [9, 1], [15, 6], [14, 30]], 0x6a6478);
    b.poly([[5, 29], [5, 7], [9, 3], [9, 29]], 0x847e92);
    b.line(9, 9, 9, 24, 0x80f0ff);
    b.line(6, 13, 12, 13, 0x80f0ff);
    b.line(7, 19, 11, 19, 0x80f0ff);
    b.ring(9, 16, 3, 1, 0xc0ffff);
    b.outline();
  });
  // 드롭 빛기둥
  g("fr_beam", 8, 48, (b) => {
    for (let y = 0; y < 48; y++) b.rect(0, y, 8, 1, 0xffffff, Math.round(200 * (1 - y / 48)));
  });
}

// ── 런 시작 ─────────────────────────────────────────
// 상점에서 산 장비는 1회용: 탐험을 시작하면 장착한 것 하나씩 소모된다
function consumeLoadout(d) {
  const FREE = new Set(Object.values(STARTER).flat().filter((x) => x[1] === 0).map((x) => x[0]));
  const DEF = { weapon: "W01", armor: "A01", s1: "S01", s2: null, magic: "M01" };
  for (const k of Object.keys(d.equip)) {
    const id = d.equip[k];
    if (!id || FREE.has(id)) continue;
    const i = d.owned.indexOf(id);
    i >= 0 && d.owned.splice(i, 1);
    if (!d.owned.includes(id)) {
      const def = DEF[k];
      d.equip[k] = def && !Object.values(d.equip).includes(def) ? def : null;
    }
  }
  R.it.write();
}
export function startRun(scene) {
  scene.frv = null;
  const d = sd();
  const mk = (id) => (id ? mkItem(id) : null);
  scene.fr = {
    equip: { weapon: mk(d.equip.weapon) ?? IT.makeBase("W01"), s1: mk(d.equip.s1), s2: mk(d.equip.s2), magic: mk(d.equip.magic), armor: mk(d.equip.armor) ?? IT.makeBase("A01") },
    // 저장된 가방을 들고 나간다 (쓰러지면 잃는다 · 살아 돌아오면 그대로)
    bag: (consumeLoadout(d), (() => {
      const b = (d.bag ?? []).map((k) => mkItem(k)).filter(Boolean);
      d.bag = [];
      R.it.write();
      return b;
    })()),
    bagMax: 48, // 알비온식 큰 가방 (5열 · 스크롤, 2026-11-28)
    stones: 1,
    mana: 100,
    maxMana: 100,
    manaRegen: 5,
    charge: 0,
    hits: 0,
    pickups: [],
    mats: {},
    runSeed: (Math.random() * 4294967295) >>> 0,
    dgSeen: [],
    zones: [],
    ents: [],
    chain: {},
    focus: 0,
    gearT: 0,
    restPending: 0,
    relicIds: [],
    react: new WeakMap(),
    auraCd: 0,
    dash: null,
    slam: null,
    found: 0,
    fused: 0,
    attr: { str: 0, vit: 0, int: 0, agi: 0, luk: 0 },
    sp: 0,
  };
  R.it.data.skillSlots = 3;
}
export function applyLoadout(scene) {
  if (scene.fr?.hub) return hubSync(scene);
  const p = scene.player;
  if (!p) return;
  const keep = p.skills.cds.slice();
  p.applyStats(stats(scene));
  for (let i = 0; i < 3; i++) p.skills.cds[i] = Math.min(keep[i] ?? 0, p.skills.maxCds[i]);
}

// ── 피격 보정 (방어구) ─────────────────────────────
export function hurtMod(player, S, C) {
  const sc = player.host;
  sc && (sc.frLastHurt = sc.time?.now ?? 0); // 귀환: 맞은 뒤 4초는 전투 중
  sc && noteHurt(sc, S, C); // 사망 화면: 받은 피해 기록
  const fr = sc?.fr;
  if (!fr) return C;
  const fx = fr.afx ?? {};
  fx.dmgRed && (C *= 1 - Math.min(0.6, fx.dmgRed));
  !S.melee && fx.projRed && (C *= 1 - fx.projRed);
  if (!1) {
    C *= 1 - Math.min(0.9, fx.block);
    sc.fx.burst("spark", player.cx + player.facing * 8, player.cy, 6, 0xd0e0ff);
    fx.blockStun && S.attacker && !S.attacker.dead && S.attacker.statuses.apply({ type: "stun", chance: 1, dur: 0.8 }, 0);
  }
  fx.dodge && Math.random() < fx.dodge && ((C = 0), sc.fx.text(player.cx, player.body.y - 34, "회피", "#c8ffe0"));
  C = guardHurt(sc, player, S, C);
  C = SP.hurtHook(sc, player, S, C);
  fx.manaOnHurt && (fr.mana = Math.min(fr.maxMana, fr.mana + fx.manaOnHurt));
  fx.lowHpDef && player.hp < player.maxHp * 0.3 && (C *= 1 - fx.lowHpDef * 0.5);
  fx.iceArmor && Math.random() < 0.3 && player.buff("dmgReduce", 3, 0.4, "shield", "얼음 갑옷");
  // 마법 갑옷: 피격 시 마법 발동
  const a = fr.equip.armor;
  if (a && (a.cat === "MA" || (a.legend && a.kind === "armor")) && fr.auraCd <= 0) {
    fr.auraCd = 4;
    const mid = [a.primary, a.secondary, a.third].find((x) => IT.BASE[x]?.kind === "magic");
    mid && payAt(sc, a, a.el, [VFX.payloadOf(mid)], player.cx, player.cy, 1.2, 0.9);
  }
  return C;
}

// ── 시전 ─────────────────────────────────────────────
export const isFr = (id) => typeof id == "string" && id.startsWith("fr");
// ── 시전 준비 동작 (2026-11-28) ─────────────────────────
//   마법 전부 + 쿨타임 4초 이상 스킬은 누르면 바로 나가지 않고, 준비 시간 동안 손에 빛이 모인다 (영웅·전설은 발밑 마법진)
//   준비 시간 = 희귀도가 높을수록 길게 (마법 0.25~0.75초, 스킬 0.2~0.6초). 준비 중에는 걸음이 절반, 맞아도 끊기지 않는다
//   마나·쿨타임은 준비가 끝나 실제로 나갈 때 쓴다
const RAR_I = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
function windupOf(sk, S, it) {
  const kind = it.kind ?? IT.BASE[it.id]?.kind;
  const r = RAR_I[IT.RARITY_OF(it)] ?? 0;
  if (kind === "magic") return 0.25 + r * 0.125;
  if (kind === "skill" && (sk.nums(sk.slots[S])?.cooldown ?? 0) >= 4) return 0.2 + r * 0.1;
  return 0;
}
export function cast(sk, S, T) {
  const id = sk.slots[S], sc = sk.p.host, fr = sc.fr, it = fr?.slotItems?.[id];
  if (!it || sk.cds[S] > 0 || sk.p.dead) return;
  if (fr.windup) return;
  const ch = fr.chain[S];
  const w = ch && ch.t > 0 ? 0 : windupOf(sk, S, it);
  if (w <= 0) return castNow(sk, S, T);
  // 마나가 모자라면 준비 없이 바로 (castNow가 "마나 부족"을 띄운다)
  const mana = itemMana(it);
  if (mana > 0 && !castMods(it).bloodCast && fr.mana < mana) return castNow(sk, S, T);
  const p = sk.p, col = it.el ? elColor(it.el) : rarityColor(it), rar = IT.RARITY_OF(it);
  fr.windup = { t: 0, w, S, T: { ...T }, sk, col, big: RAR_I[rar] >= 3, g: sc.add.graphics().setDepth(12), fxT: 0 };
  p.castT = w + 0.05;
  p.castSlow = 0.5;
  R.j.play("magic", 0.5);
}
export function windupTick(sc, dt) {
  const W = sc.fr?.windup;
  if (!W) return;
  const p = sc.player;
  if (!p || p.dead || sc.dying || sc.frLoad) return endWindup(sc);
  W.t += dt;
  const f = Math.min(1, W.t / W.w), hx = p.cx + p.facing * 9, hy = p.body.y - 16;
  p.castT = Math.max(p.castT, 0.05);
  // 손에 모이는 빛: 바깥에서 안으로 빨려 드는 알갱이 + 커지는 빛 공
  W.fxT -= dt;
  if (W.fxT <= 0) {
    W.fxT = 0.03;
    const a = Math.random() * Math.PI * 2, d = 26 * (1 - f) + 10;
    sc.fx.burst("glow", hx + Math.cos(a) * d, hy + Math.sin(a) * d, 1, W.col);
  }
  const g = W.g.clear();
  g.fillStyle(W.col, 0.18 + 0.3 * f).fillCircle(hx, hy, 3 + 6 * f);
  g.fillStyle(0xffffff, 0.5 + 0.4 * f).fillCircle(hx, hy, 1.5 + 2 * f);
  // 영웅·전설: 발밑 마법진 (안팎 고리 + 도는 룬 점)
  if (W.big) {
    const R0 = 16 + 10 * f, y0 = p.body.y - 1, rot = W.t * 4;
    g.fillStyle(W.col, 0.08 + 0.12 * f).fillEllipse(p.cx, y0, R0 * 2, R0 * 0.5);
    g.lineStyle(2, W.col, 0.5 + 0.5 * f).strokeEllipse(p.cx, y0, R0 * 2, R0 * 0.5);
    g.lineStyle(1, 0xffffff, 0.3 + 0.4 * f).strokeEllipse(p.cx, y0, R0 * 1.4, R0 * 0.34);
    for (let i = 0; i < 6; i++) {
      const a = rot + (i * Math.PI) / 3;
      g.fillStyle(W.col, 0.8 * f).fillRect(p.cx + Math.cos(a) * R0 - 1, y0 + Math.sin(a) * R0 * 0.25 - 1, 2, 2);
    }
  }
  if (W.t < W.w) return;
  const { sk, S, T } = W;
  endWindup(sc);
  sc.fx.burst("spark", hx, hy, 8, W.col);
  castNow(sk, S, T);
}
function endWindup(sc) {
  const W = sc.fr?.windup;
  if (!W) return;
  W.g.destroy();
  sc.fr.windup = null;
  sc.player && (sc.player.castSlow = 1);
}
function castNow(sk, S, T) {
  const id = sk.slots[S];
  const sc = sk.p.host;
  const fr = sc.fr;
  const it = fr?.slotItems?.[id];
  if (!it || sk.cds[S] > 0 || sk.p.dead) return;
  const p = sk.p;
  // 연계 스킬: 두 번째 입력
  const ch = fr.chain[S];
  if (ch && ch.t > 0) {
    fr.chain[S] = null;
    const n = sk.nums(id);
    ((sk.maxCds[S] = n.cooldown), (sk.cds[S] = n.cooldown));
    runAction(sc, ch.next, it, { mult: 1.3, el: it.el });
    ch.third && sc.time.delayedCall(260, () => p.dead || runAction(sc, ch.third, it, { mult: 1.1, el: it.el }));
    return;
  }
  const cm = castMods(it);
  let mana = itemMana(it);
  if (mana > 0) {
    if (cm.bloodCast) {
      if (p.hp <= mana * 0.5) return void (sc.fx.text(p.cx, p.body.y - 34, "체력 부족", "#ff6060"), R.j.play("error"));
      p.hp -= Math.round(mana * 0.5);
    } else {
      if (fr.mana < mana) return void (sc.fx.text(p.cx, p.body.y - 34, "마나 부족", "#80b0ff"), R.j.play("error"));
      fr.mana -= mana;
    }
  }
  const n = sk.nums(id);
  ((sk.maxCds[S] = n.cooldown), (sk.cds[S] = n.cooldown), (p.castT = 0.3));
  const ang = Math.atan2(T.aimY - p.cy, T.aimX - p.cx),
    dir = Math.cos(ang) >= 0 ? 1 : -1;
  p.weapons.attacking() || (p.facing = dir);
  const prim = it.tier === 0 ? it.id : it.primary;
  const opts = { mult: 1, el: it.el, ang, aimX: T.aimX, aimY: T.aimY };
  cm.lowHpDmg && p.hp < p.maxHp * 0.5 && (opts.mult *= 1 + cm.lowHpDmg);
  cm.bloodCast && (opts.mult *= 1.6);
  if (cm.castStack) {
    fr.castStack = Math.min(3, (fr.castStack ?? 0) + 1);
    opts.mult *= 1 + fr.castStack * 0.15;
  }
  cm.shieldOnCast && p.buff("dmgReduce", 2, 0.25, "shield", "보호막");
  // 스킬 융합: 설명대로 짠 전용 동작
  const sfn = it.tier > 0 ? SK.skillOf(it) : null;
  if (sfn) {
    const K = makeK(sc, it, { ...opts, spec: null }, !1);
    K.spec = null;
    K.resetCd = () => resetSlotOf(sc, it);
    SK.runSkill(K, sfn);
    return;
  }
  switch (it.cat) {
    case "SS": {
      // 설명대로 두 기술이 하나로 이어진다
      const sp = interp(it);
      runAction(sc, prim, it, { ...opts, spec: sp, ss: !0 });
      sc.time.delayedCall(sp?.m?.instant ? 60 : 240, () => p.dead || runAction(sc, it.secondary, it, { ...opts, spec: sp, ss: !0 }));
      break;
    }
    case "MM":
      magicCast(sc, [prim, it.secondary], it, opts);
      break;
    case "SA":
      runAction(sc, prim, it, { ...opts, spec: interp(it) });
      parryWindow(sc, it, 0.6);
      break;
    case "LG": {
      const ids = [it.primary, it.secondary, it.third].filter(Boolean);
      const mags = ids.filter((x) => IT.BASE[x]?.kind === "magic");
      const sks = ids.filter((x) => IT.BASE[x]?.kind === "skill");
      if (it.kind === "magic" || !sks.length) magicCast(sc, mags, it, opts);
      else sks.forEach((a, i) => sc.time.delayedCall(i * 220, () => p.dead || runAction(sc, a, it, { ...opts, pay: mags.map((m) => VFX.payloadOf(m)) })));
      break;
    }
    case "SM":
    case "SG":
      runAction(sc, prim, it, { ...opts, spec: interp(it) });
      break;
    default:
      runAction(sc, IT.actOf(prim) ? prim : it.secondary, it, { ...opts, spec: interp(it) });
  }
  cm.echo && sc.time.delayedCall(1000, () => p.dead || runAction(sc, prim, it, { ...opts, mult: opts.mult * cm.echo }));
  cm.ghostCast && sc.time.delayedCall(350, () => p.dead || (p.spawnAfterimage?.(), runAction(sc, prim, it, { ...opts, mult: opts.mult * cm.ghostCast })));
  cm.spiritOnCast && spirit(sc, p.cx, p.cy - 20, it.el);
  cm.timeSlow && slowAll(sc, 2);
  cm.gather && gather(sc, p.cx + dir * 80, p.cy, 120);
}

// 피해 기준값
function base(sc, it, kindMagic) {
  const p = sc.player,
    s = p.stats;
  return s.atk * p.atkMult() * s.dmgMult * s.skillPower * (it?.power ?? 1) * IT.gradeMult(it) * (kindMagic ? 0.7 * (1 + (sc.fr.magicDmg ?? 0)) : 1);
}
function params(sc, it, dmg, extra = {}) {
  const el = extra.el !== void 0 ? extra.el : it?.el;
  return {
    dmg,
    element: dispEl(el),
    knock: 140,
    stagger: 0.35,
    dir: sc.player.facing,
    source: "skill",
    skillId: "frskill",
    pierceShield: !0,
    frEl: el,
    frElChance: 1,
    frItem: it,
    ...extra,
  };
}
function targetsIn(sc, x, y, r, set) {
  const out = [];
  for (const t of sc.targets()) {
    if (t.dead || (set && set.has(t))) continue;
    const b = t.body;
    const cx = Math.max(b.x - b.w / 2, Math.min(x, b.x + b.w / 2)),
      cy = Math.max(b.y - b.h, Math.min(y, b.y));
    Math.hypot(cx - x, cy - y) <= r && out.push(t);
  }
  return out;
}
function targetsRect(sc, x0, x1, y0, y1, set) {
  const out = [];
  const a = Math.min(x0, x1),
    b2 = Math.max(x0, x1);
  for (const t of sc.targets()) {
    if (t.dead || (set && set.has(t))) continue;
    const b = t.body;
    b.x + b.w / 2 > a && b.x - b.w / 2 < b2 && b.y > y0 && b.y - b.h < y1 && out.push(t);
  }
  return out;
}
function nearest(sc, x, y, r, n = 1, exclude) {
  const arr = sc
    .targets()
    .filter((t) => !t.dead && t.kind !== "object" && (!exclude || !exclude.has(t)))
    .map((t) => [t, dist2(t.body.x, t.body.y - t.body.h / 2, x, y)])
    .filter((a) => a[1] <= r)
    .sort((a, b) => a[1] - b[1]);
  return arr.slice(0, n).map((a) => a[0]);
}
const tc = (t) => [t.body.x, t.body.y - t.body.h / 2];
function hit(sc, t, it, dmg, extra) {
  return sc.hitTarget(t, params(sc, it, dmg, { dir: t.body.x < sc.player.cx ? -1 : 1, ...extra }));
}
function groundY(sc, x, y) {
  const c = sc.collider;
  let yy = y;
  for (let i = 0; i < 30 && !c.solidAtPx(x, yy + 1); i++) yy += 8;
  for (let i = 0; i < 8 && c.solidAtPx(x, yy - 1); i++) yy -= 8;
  // 1px까지 정확히 (자연 지형의 땅은 칸 경계에 맞춰져 있지 않다)
  for (let i = 0; i < 10 && !c.solidAtPx(x, yy + 1); i++) yy++;
  for (let i = 0; i < 12 && c.solidAtPx(x, yy); i++) yy--;
  return yy + 1;
}

// 그래픽 효과
function flashLine(sc, x0, y0, x1, y1, color, w = 6, dur = 220) {
  const g = sc.add.graphics().setDepth(46).setBlendMode(R.zt.BlendModes.ADD);
  g.lineStyle(w * 2.2, color, 0.35).lineBetween(x0, y0, x1, y1);
  g.lineStyle(w, color, 0.9).lineBetween(x0, y0, x1, y1);
  g.lineStyle(Math.max(1, w / 3), 0xffffff, 1).lineBetween(x0, y0, x1, y1);
  sc.tweens.add({ targets: g, alpha: 0, duration: dur, onComplete: () => g.destroy() });
  trackGfx(sc, g);
  return g;
}
function skyPillar(sc, x, y, color, w = 14, dur = 380) {
  const g = sc.add.graphics().setDepth(46).setBlendMode(R.zt.BlendModes.ADD);
  const top = y - 300;
  g.fillStyle(color, 0.25).fillRect(x - w, top, w * 2, y - top);
  g.fillStyle(color, 0.7).fillRect(x - w / 2, top, w, y - top);
  g.fillStyle(0xffffff, 0.95).fillRect(x - w / 6, top, w / 3, y - top);
  g.fillStyle(color, 0.5).fillEllipse(x, y, w * 4, w);
  sc.tweens.add({ targets: g, alpha: 0, scaleX: 1, duration: dur, ease: "Cubic.easeIn", onComplete: () => g.destroy() });
  trackGfx(sc, g);
}
function ringFx(sc, x, y, r, color, dur = 360) {
  const g = sc.add.graphics().setDepth(45).setBlendMode(R.zt.BlendModes.ADD);
  const o = { r: r * 0.2, a: 1 };
  sc.tweens.add({
    targets: o,
    r,
    a: 0,
    duration: dur,
    ease: "Cubic.easeOut",
    onUpdate: () => {
      g.clear();
      g.lineStyle(4, color, o.a * 0.9).strokeCircle(x, y, o.r);
      g.lineStyle(10, color, o.a * 0.25).strokeCircle(x, y, o.r * 0.92);
    },
    onComplete: () => g.destroy(),
  });
}
function trackGfx(sc, g) {
  sc.fr && sc.fr.ents.push({ gfx: g, life: 2, kind: "gfx" });
}
function burstEl(sc, x, y, el, n = 12) {
  sc.fx.burst("glow", x, y, n, elColor(el));
}

// ── 동작 ─────────────────────────────────────────────
// 마법 시전 (vfx 모듈)
export function magicCast(sc, ids, it, o = {}) {
  ids = ids.filter((x) => VFX.MAGIC[x]);
  if (!ids.length) return;
  // 융합 마법: 설명대로 짠 전용 주문
  const spell = it && it.tier > 0 && it.cat === "MM" ? SP.spellOf(it) : null;
  if (spell) {
    const K = makeK(sc, it, { ...o, spec: null }, !0);
    K.spec = null;
    return void SP.run(K, spell);
  }
  if (it?.same && ids.length === 1) ids = [ids[0], ids[0]];
  const spec = o.spec ?? interp(it);
  if (spec?.del && ids.includes(spec.del) && ids.length > 1) ids = [spec.del, ...ids.filter((x) => x !== spec.del)];
  const K = makeK(sc, it, { ...o, spec }, !0);
  VFX.castMagic(K, ids);
}
function makeK(sc, it, o, isMagic) {
  const p = sc.player;
  const cm = castMods(it);
  const el = o.el !== void 0 ? o.el : it?.el ?? null;
  const B = base(sc, it, isMagic) * (o.mult ?? 1);
  const ex = {};
  cm.knock && (ex.knock = 360);
  cm.bleed && (ex.status = { type: "bleed", chance: 1, dur: 3, power: 0.25 });
  cm.stun && (ex.frStun = cm.stun);
  cm.lifesteal && (ex.frLs = cm.lifesteal);
  cm.chain && (ex.frChain = cm.chain);
  const K = {
    sc, p, it, el, B, ang: o.ang, size: 1 + (cm.size ?? 0), pays: [], payAt: () => {}, spec: o.spec ?? null,
    hit: (t, m, extra = {}) => (t.dead ? 0 : sc.hitTarget(t, params(sc, it, B * m, { el, dir: t.body.x < p.cx ? -1 : 1, ...ex, ...extra }))),
    tin: (x, y, r, set) => targetsIn(sc, x, y, r, set),
    trect: (x0, x1, y0, y1, set) => targetsRect(sc, x0, x1, y0, y1, set),
    near: (x, y, r, n, exc) => nearest(sc, x, y, r, n, exc),
    gy: (x, y) => groundY(sc, x, y),
    zone: (z) => {
      const zz = { ...z, it };
      addZone(sc, zz);
      return zz;
    },
    ent: (e) => {
      Object.assign(e, { kind: "fx", t: e.dur });
      sc.fr.ents.push(e);
    },
    clearProj: (a, b, c, d) => clearEnemyProj(sc, a, b, c, d),
    snd: (k, v) => R.j.play(k, v),
    applyEl: (t, e) => applyEl(sc, t, e, B, 1),
  };
  const ent0 = K.ent;
  K.ent = (e) => {
    ent0(e);
    K.focus = () => (e.t <= 0 ? null : { x: e.x ?? p.cx, y: e.gy !== void 0 ? e.gy - 30 : e.x !== void 0 ? p.cy : p.cy });
  };
  // 설명에 적힌 부가 효과를 명중마다 적용
  const hit0 = K.hit;
  K.hit = (t, m, extra = {}) => {
    const M = K.spec?.m ?? {};
    const d = hit0(t, m * (M.mult && !K._multUsed ? 1 : 1), { ...(M.knockup ? { knockUp: 300 } : {}), ...extra });
    applyMods(sc, t, M, d, B);
    return d;
  };
  return K;
}
// 설명 수식어 → 상태 효과
function applyMods(sc, t, M, d, B) {
  if (!M || !t || t.dead === void 0) return;
  const p = sc.player;
  if (M.freeze) {
    t._frIce = (t._frIce ?? 0) + 2;
    t._frIce >= 5 && ((t._frIce = 0), t.statuses.apply({ type: "freeze", chance: 1, dur: 1.5 }, 0));
    t.statuses.apply({ type: "chill", chance: 1, dur: 2.5, power: 0.4 }, 0);
  }
  M.chill && t.statuses.apply({ type: "chill", chance: 1, dur: 3, power: 0.3 + 0.08 * M.chill }, 0);
  M.burn && t.statuses.apply({ type: "burn", chance: 1, dur: 3, power: 0.3 }, B);
  M.poison && t.statuses.apply({ type: "poison", chance: 1, dur: 4, power: 0.12 * M.poison }, B);
  M.armor && t.statuses.apply({ type: "armorBreak", chance: 1, dur: 5, power: 0.3 }, 1);
  M.stun && !t.dead && Math.random() < 0.5 && t.statuses.apply({ type: "stun", chance: 1, dur: Math.min(2, M.stun) }, 0);
  M.pull && t.kind !== "boss" && (t.body.vx += Math.sign(p.cx - t.body.x) * 160);
  M.drain && d > 0 && p.heal(d * 0.2, !1);
  M.exec && !t.dead && t.kind !== "boss" && t.hp / t.maxHp < M.exec && (t.receive(t.hp + 1, !0, { knock: 0, dir: 1 }), sc.fx.text(t.body.x, t.body.y - t.body.h - 8, "처형", "#ff4040"));
}
// 마법 착탄 효과를 특정 지점에 (스킬·무기·갑옷 융합용)
function payAt(sc, it, el, keys, x, y, s, mult = 0.6) {
  const K = makeK(sc, it, { el, mult }, !0);
  for (const k of keys) k && VFX.PAY[k]?.(K, x, y, s);
}
const DUR = { spin: (a) => a.n * 0.11, rapid: (a) => a.dur, frenzy: (a) => a.dur, iaido: () => 0.4, beam: (a) => a.aim, slam: () => 0.6, leap: () => 0.26, dash: (a) => a.dist, crack: (a) => a.n * 0.055, tele: () => 0.05 };
const TICKS = { spin: (a) => a.n, rapid: (a) => Math.ceil(a.n / 3), frenzy: (a) => Math.ceil(a.n / 3), crack: (a) => Math.ceil(a.n / 2) };
export function runAction(sc, actId, it, o = {}) {
  if (IT.BASE[actId]?.kind === "magic") return magicCast(sc, [actId], it, o);
  const a0 = IT.actOf(actId);
  const S = o.spec;
  const a = a0 && S?.n && o.ss && ["rapid", "fan", "spin", "frenzy", "crack"].includes(a0.k) ? { ...a0, n: S.n } : a0;
  if (!a) return;
  const p = sc.player;
  const fx = sc.fx;
  const isMagic = IT.BASE[actId]?.kind === "magic";
  const cm = castMods(it);
  const el = o.el !== void 0 ? o.el : it?.el ?? IT.BASE[actId]?.el ?? null;
  const col = el ? elColor(el) : 0xffffff;
  const dir = p.facing;
  const B = base(sc, it, isMagic) * (o.mult ?? 1) * (it && it.tier === 0 ? 1 : 1);
  const P = (m, extra) => params(sc, it, B * m, { el, ...extra });
  const size = 1 + (cm.size ?? 0);
  const ex = {};
  cm.knock && (ex.knock = 360);
  cm.bleed && (ex.status = { type: "bleed", chance: 1, dur: 3, power: 0.25 });
  cm.stun && (ex.frStun = cm.stun);
  cm.executeDmg && (ex.frExec = cm.executeDmg);
  cm.lifesteal && (ex.frLs = cm.lifesteal);
  cm.chain && (ex.frChain = cm.chain);
  cm.gold && (ex.frGold = cm.gold);
  let payBudget = o.pay ? 4 : 0;
  // 설명에 적힌 재료 마법 분출
  const em = S?.emit;
  const EK = em ? makeK(sc, it, { el, mult: o.mult, spec: S }, !0) : null;
  let emBudget = 10;
  const fire = (x, y, m = 1) => EK && emBudget-- > 0 && VFX.emitFx(EK, em, x, y, p.facing > 0 ? 0 : Math.PI, S.pat, S.n, S.m, m);
  const M = S?.m ?? {};
  const H = (t, m, extra = {}) => {
    const d = sc.hitTarget(t, P(m * (M.mult && t.hp / t.maxHp < (M.exec ?? 0.25) ? 1 : 1), { dir: t.body.x < p.cx ? -1 : 1, ...(M.knockup ? { knockUp: 320 } : {}), ...ex, ...extra }));
    applyMods(sc, t, M, d, B);
    const [x, y] = tc(t);
    if (el) {
      VFX.impact(sc, el, x, y, 0.35);
      if (payBudget > 0 && !t.dead) (payBudget--, payAt(sc, it, el, o.pay, x, y, 0.65));
    }
    if (em && (S.when === "hit" || (S.when === "kill" && t.dead))) fire(x, y, 0.8);
    return d;
  };
  if (a && em) {
    const D = (DUR[a.k]?.(a) ?? 0.15) + 0.05;
    const hx = () => p.cx + p.facing * 8;
    if (S.when === "start" || S.pat === "orbit") fire(hx(), p.cy, 1);
    else if (S.when === "during" && S.n) sc.time.delayedCall((D * 1000) / 2, () => p.dead || fire(hx(), p.cy, 1));
    else if (S.when === "during" || S.when === "tick") {
      const n = TICKS[a.k]?.(a) ?? 3;
      for (let i = 0; i < n; i++) sc.time.delayedCall((i * D * 1000) / n, () => p.dead || fire(hx(), p.cy, 0.7));
    } else if (S.when === "end") sc.time.delayedCall(D * 1000, () => p.dead || fire(p.cx, p.body.y - 12, 1));
  }
  const projOpts = (spr, speed, extra = {}) => ({
    sprite: spr,
    speed,
    life: extra.life ?? 1.4,
    radius: extra.radius ?? 6,
    aoe: extra.aoe ?? 0,
    homing: extra.homing ?? (cm.homing ? 2.2 : 0),
    pierce: extra.pierce ?? (cm.pierce ? 99 : 0),
    trail: col,
    gravity: extra.gravity ?? 0,
  });
  const shoot = (spr, speed, ang, m, extra = {}) => {
    const n = cm.split ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const aa = ang + (n > 1 ? (i - 1) * 0.18 : 0);
      sc.projectiles.spawn(projOpts(spr, speed, extra), p.cx + Math.cos(aa) * 10, p.cy - 4 + Math.sin(aa) * 6, aa, "player", { hit: P(m * (n > 1 ? 0.6 : 1), ex) }, {
        scale: (extra.scale ?? 1.3) * size,
        tint: el ? col : void 0,
        pierce: extra.pierce ?? 0,
        onDone: (pp) => {
          cm.boomEnd && boom(sc, pp.x, pp.y, 40 * size, B * 0.8, el);
          extra.onDone?.(pp);
        },
      });
    }
  };
  const ang0 = o.ang ?? (dir > 0 ? 0 : Math.PI);
  switch (a.k) {
    case "spin": {
      let i = 0;
      const tick = () => {
        if (p.dead) return;
        fx.anim("fx_spin", p.cx, p.cy, { scale: 1.3 * size, tint: el ? col : void 0, blend: !!el });
        VFX.slash(sc, p.cx, p.cy - 2, a.r * size * 0.9, i * 2.1, i * 2.1 + 4.4, el, 8, 220);
        for (const t of targetsIn(sc, p.cx, p.cy, a.r * size)) H(t, a.p, { knock: 90, stagger: 0.2, knockUp: a.up ? 220 : 0 });
        R.j.play("swing", 1.1);
        ++i < a.n && sc.time.delayedCall(110, tick);
      };
      tick();
      p.iframes = Math.max(p.iframes, 0.12 * a.n);
      break;
    }
    case "dash": {
      sc.fr.dash = { t: a.dist, dir, hits: new Set(), dmg: B * a.p, it, el, knock: a.knock ?? 180, clear: a.clearProj, ex };
      p.iframes = Math.max(p.iframes, a.dist + 0.1);
      p.body.vy = 0;
      p.weapons.interrupt();
      fx.burst("glow", p.cx, p.cy, 10, col);
      R.j.play("dash");
      break;
    }
    case "slam": {
      p.body.onGround && (p.body.vy = -360);
      sc.fr.slam = { t: 1.2, it, el, dmg: B * a.p, r: a.r * size, ex, delay: 0.18 };
      p.body.vy = Math.max(p.body.vy, -360);
      R.j.play("jump");
      break;
    }
    case "launch": {
      const x0 = p.cx, x1 = p.cx + dir * a.w * size;
      fx.anim("fx_heavy", p.cx + dir * 18, p.cy - 8, { flip: dir < 0, tint: el ? col : void 0, scale: 1.3 * size });
      VFX.slash(sc, p.cx, p.cy, 34 * size, dir > 0 ? 1.2 : Math.PI - 1.2, dir > 0 ? -1.6 : Math.PI + 1.6, el, 9, 260);
      for (const t of targetsRect(sc, x0, x1, p.body.y - 50, p.body.y + 6)) H(t, a.p, { knockUp: 340, knock: 40, stagger: 0.6 });
      R.j.play("swingHeavy");
      fx.shake(2);
      break;
    }
    case "wave":
      shoot(a.spr, 430, ang0, a.p, { pierce: 99, scale: 1.6, life: 1.1 });
      fx.anim("fx_slash", p.cx + dir * 14, p.cy, { flip: dir < 0, tint: el ? col : void 0, scale: 1.4 });
      R.j.play("swingHeavy");
      break;
    case "rapid": {
      let i = 0;
      const dt = (a.dur * 1000) / a.n;
      const hitset = new Set();
      const tick = () => {
        if (p.dead) return;
        const x1 = p.cx + p.facing * a.w * size;
        fx.anim("fx_thrust", p.cx + p.facing * (14 + Math.random() * 18), p.cy - 6 + rnd(-8, 8), { flip: p.facing < 0, tint: el ? col : void 0 });
        const ty = p.cy - 6 + rnd(-8, 8);
        VFX.beam(sc, p.cx + p.facing * 6, ty, p.cx + p.facing * a.w * size, ty, VFX.palOf(el), 2, 120);
        a.ghost && i % 2 === 0 && p.spawnAfterimage?.();
        for (const t of targetsRect(sc, p.cx, x1, p.body.y - 34, p.body.y + 4)) H(t, a.p, { knock: 30, stagger: 0.12 });
        i % 2 === 0 && R.j.play("swing", 1.3);
        ++i < a.n && sc.time.delayedCall(dt, tick);
      };
      tick();
      break;
    }
    case "tele": {
      const t = nearest(sc, p.cx, p.cy, 240)[0];
      fx.burst("glow", p.cx, p.cy, 14, el ? col : 0x9060d0);
      if (t) {
        const s = t.body.x > p.cx ? 1 : -1;
        const nx = t.body.x + s * (t.body.w / 2 + 10);
        sc.collider.solidAtPx(nx, t.body.y - 8) || ((p.body.x = nx), (p.body.y = Math.min(p.body.y, t.body.y)));
        p.facing = -s;
        H(t, a.p, { stagger: 0.6, knock: 160, dir: -s });
        fx.anim("fx_heavy", t.body.x, t.body.y - t.body.h / 2, { flip: s > 0, tint: el ? col : 0xb080ff });
        VFX.slash(sc, t.body.x, t.body.y - t.body.h / 2, 26, -2.4, 0.8, el ?? "dark", 8, 240);
      }
      p.iframes = Math.max(p.iframes, 0.3);
      R.j.play("dash");
      break;
    }
    case "iaido": {
      p.iframes = Math.max(p.iframes, 0.5);
      p.weapons.interrupt();
      p.body.vx = 0;
      fx.burst("glow", p.cx, p.cy, 8, col);
      sc.time.delayedCall(M.instant ? 30 : 380, () => {
        if (p.dead) return;
        const x1 = p.cx + p.facing * a.w * size;
        flashLine(sc, p.cx, p.cy - 4, x1, p.cy - 4, el ? col : 0xfff0d0, 5, 300);
        const x2 = S?.pat === "radial" ? p.cx - p.facing * a.w * size : p.cx;
        x2 !== p.cx && flashLine(sc, p.cx, p.cy - 4, x2, p.cy - 4, el ? col : 0xfff0d0, 5, 300);
        for (const t of targetsRect(sc, Math.min(x1, x2), Math.max(x1, x2), p.body.y - 40, p.body.y + 6)) H(t, a.p, { stagger: 0.9, knock: 260, heavy: !0 });
        const ox = p.body.x;
        p.body.x = Math.max(ox, Math.min(ox + p.facing * a.w * 0.6, ox)) + p.facing * 4;
        fx.stop(0.12);
        fx.shake(4);
        sc.cameras.main.flash(90, 255, 255, 255);
        R.j.play("crit");
      });
      break;
    }
    case "parry":
      parryWindow(sc, it, 0.45, a.p * B, el);
      break;
    case "leap": {
      p.body.vy = -420;
      p.body.vx = dir * 320;
      sc.time.delayedCall(240, () => {
        if (p.dead) return;
        fx.anim("fx_heavy", p.cx + p.facing * 16, p.cy + 6, { flip: p.facing < 0, tint: el ? col : void 0, scale: 1.4 * size });
        VFX.slash(sc, p.cx, p.cy, 40 * size, p.facing > 0 ? -1.4 : Math.PI + 1.4, p.facing > 0 ? 1.2 : Math.PI - 1.2, el, 10, 260);
        for (const t of targetsIn(sc, p.cx + p.facing * 20, p.cy + 8, 44 * size)) H(t, a.p, { knock: 200, stagger: 0.5 });
        R.j.play("swingHeavy");
      });
      break;
    }
    case "hook": {
      const t = nearest(sc, p.cx, p.cy, 280)[0];
      if (t) {
        const [tx, ty] = tc(t);
        flashLine(sc, p.cx, p.cy, tx, ty, 0xc0c0c0, 2, 260);
        if (t.kind === "boss") ((p.body.x = t.body.x - Math.sign(t.body.x - p.cx) * (t.body.w / 2 + 12)), (p.body.vy = -120));
        else t.body.x = p.cx + dir * 22;
        H(t, a.p, { stagger: 0.8, knock: 30 });
      }
      R.j.play("swing");
      break;
    }
    case "shout": {
      p.buff("atk", a.dur, a.atk * (it?.power ?? 1) * IT.gradeMult(it), "berserk", "전투 함성");
      for (const t of targetsIn(sc, p.cx, p.cy, 100)) t.statuses.apply({ type: "stun", chance: 1, dur: 1 }, 0);
      ringFx(sc, p.cx, p.cy, 100, el ? col : 0xff6040);
      fx.shake(3);
      R.j.play("buff");
      break;
    }
    case "focus":
      sc.fr.focus = a.n;
      p.buff("critNext", 30, 1, "crit", "집중");
      fx.burst("rise", p.cx, p.cy, 16, 0xffd84a);
      R.j.play("buff");
      break;
    case "crack": {
      let i = 0;
      const seen = new Set();
      const step = () => {
        if (p.dead) return;
        const x = p.cx + dir * (20 + i * 22);
        const y = groundY(sc, x, p.body.y - 16);
        fx.anim(el === "ice" ? "icespike" : "rockspike", x, y - 16, { scale: size, tint: el && el !== "earth" ? col : void 0, depth: 24 });
        fx.burst("chunk", x, y, 3, 0xa89878);
        for (const t of targetsRect(sc, x - 14, x + 14, y - 44, y + 4, seen)) (seen.add(t), H(t, a.p, { knockUp: 240, knock: 60, frStun: a.stun ?? 0 }));
        ++i < a.n && sc.time.delayedCall(55, step);
      };
      step();
      fx.shake(3);
      R.j.play("thud");
      break;
    }
    case "fan": {
      const n = a.n;
      for (let i = 0; i < n; i++) {
        const go = () => {
          const ang = ang0 + (n > 1 && !a.seq ? (i - (n - 1) / 2) * a.spread : 0);
          shoot(a.spr, a.speed, ang, a.p, { life: 1, scale: 1.2 });
        };
        a.seq ? sc.time.delayedCall(i * a.seq * 1000, () => p.dead || go()) : go();
      }
      R.j.play("shoot");
      break;
    }
    case "beam": {
      p.body.vx = 0;
      fx.burst("glow", p.cx + dir * 10, p.cy, 10, col);
      R.j.play("charge");
      sc.time.delayedCall(a.aim * 1000, () => {
        if (p.dead) return;
        const y = p.cy - 4,
          x1 = p.cx + p.facing * 640;
        flashLine(sc, p.cx, y, x1, y, el ? col : 0xfff0a0, 8, 360);
        for (const t of targetsRect(sc, p.cx, x1, y - 18, y + 24)) H(t, a.p, { knock: 220, stagger: 0.6, heavy: !0 });
        p.body.vx = -p.facing * 140;
        fx.shake(4);
        R.j.play("lightning");
      });
      break;
    }
    case "trap": {
      sc.fr.zones = sc.fr.zones.filter((z) => z.kind !== "trap" || (sc.fr.zones.filter((q) => q.kind === "trap").length <= 2 ? !0 : (z.g.destroy(), !1)));
      addZone(sc, { kind: "trap", x: p.cx, y: groundY(sc, p.cx, p.body.y - 4), r: 18, t: a.dur, it, el, dmg: B * a.p, tick: 0.1 });
      R.j.play("click");
      break;
    }
    case "execute": {
      const x1 = p.cx + dir * a.w;
      fx.anim("fx_heavy", p.cx + dir * 18, p.cy, { flip: dir < 0, tint: 0xff4040, scale: 1.3 });
      VFX.slash(sc, p.cx, p.cy - 4, 44, dir > 0 ? -2 : Math.PI + 2, dir > 0 ? 1.4 : Math.PI - 1.4, el ?? "fire", 12, 300);
      for (const t of targetsRect(sc, p.cx, x1, p.body.y - 40, p.body.y + 6)) {
        const low = t.hp / t.maxHp < 0.25;
        H(t, a.p * (low ? 3 : 1), { stagger: 0.7, heavy: !0 });
        t.dead && sc.player.skills && resetSlotOf(sc, it);
      }
      R.j.play("crit");
      break;
    }
    case "frenzy": {
      p.iframes = Math.max(p.iframes, a.dur + 0.2);
      let i = 0;
      const tick = () => {
        if (p.dead) return;
        const t = pick(nearest(sc, p.cx, p.cy, 320, 6));
        if (t) {
          const s = Math.random() < 0.5 ? -1 : 1;
          p.spawnAfterimage?.();
          p.body.x = t.body.x + s * 14;
          p.facing = -s;
          fx.anim("fx_slash", t.body.x, t.body.y - t.body.h / 2, { flip: Math.random() < 0.5, tint: el ? col : 0xd0f0ff });
          const ra = Math.random() * 6.28;
          VFX.slash(sc, t.body.x, t.body.y - t.body.h / 2, 24, ra, ra + 2.6, el, 6, 180);
          H(t, a.p, { knock: 40, stagger: 0.2 });
        }
        R.j.play("swing", 1.3);
        ++i < a.n && sc.time.delayedCall((a.dur * 1000) / a.n, tick);
      };
      tick();
      break;
    }
    case "boomer": {
      const spr = a.spr;
      const go = (ang, back) =>
        sc.projectiles.spawn(projOpts(spr, 460, { life: 0.5, pierce: 99 }), back ? back.x : p.cx, back ? back.y : p.cy - 4, ang, "player", { hit: P(a.p, ex) }, {
          scale: 1.6 * size,
          tint: el ? col : void 0,
          onDone: back ? void 0 : (pp) => go(Math.atan2(p.cy - pp.y, p.cx - pp.x), { x: pp.x, y: pp.y }),
        });
      go(ang0);
      R.j.play("swing");
      break;
    }
    case "gear":
      sc.fr.gearT = a.dur;
      ringFx(sc, p.cx, p.cy, 60, 0xffd080);
      R.j.play("buff");
      break;
    // ── 마법 ──
    case "proj": {
      const stk = a.stacks ?? 0;
      shoot(a.spr, a.speed, ang0, a.p, {
        pierce: a.pierce ?? 0,
        homing: a.homing ?? (cm.homing ? 2.2 : 0),
        aoe: a.aoe ? a.aoe * size : 0,
        life: a.speed > 600 ? 0.8 : 1.5,
        scale: 1.4,
      });
      stk && (ex.frStacks = stk);
      R.j.play("magic");
      break;
    }
    case "orbit": {
      const orbs = [];
      for (let i = 0; i < a.n; i++) orbs.push(sc.add.sprite(p.cx, p.cy, "p_orb").play("p_orb_anim").setTint(col).setDepth(26).setBlendMode(R.zt.BlendModes.ADD).setScale(1.1 * size));
      sc.fr.ents.push({ kind: "orbit", orbs, t: a.dur, ang: 0, it, el, dmg: B * a.p, cd: new Map(), r: 40 * size });
      R.j.play("buff");
      break;
    }
    case "stream": {
      let i = 0;
      const tick = () => {
        if (p.dead) return;
        const x1 = p.cx + p.facing * a.w * size;
        for (let k = 0; k < 3; k++) {
          const s = sc.add.sprite(p.cx + p.facing * 10, p.cy - 2, "flame").setDepth(27).setBlendMode(R.zt.BlendModes.ADD).setTint(col).play("flame_anim");
          sc.tweens.add({ targets: s, x: p.cx + p.facing * rnd(a.w * 0.5, a.w) * size, y: p.cy - 2 + rnd(-16, 12), scale: rnd(1.2, 2), alpha: 0, duration: 380, onComplete: () => s.destroy() });
          trackGfx(sc, s);
        }
        for (const t of targetsRect(sc, p.cx, x1, p.body.y - 34, p.body.y + 8)) H(t, a.p, { knock: 20, stagger: 0.05, noCrit: !0 });
        ++i < a.n && sc.time.delayedCall((a.dur * 1000) / a.n, tick);
      };
      tick();
      R.j.play("magic");
      break;
    }
    case "meteor": {
      const t = nearest(sc, p.cx + dir * 120, p.cy, 360)[0];
      const tx = t ? t.body.x : p.cx + dir * 150;
      const ty = groundY(sc, tx, (t ? t.body.y : p.body.y) - 10);
      const warn = sc.add.ellipse(tx, ty, a.r * 2 * size, 10, col, 0.35).setDepth(9);
      trackGfx(sc, warn);
      sc.tweens.add({ targets: warn, alpha: 0.7, duration: 150, yoyo: !0, repeat: 3 });
      const m = sc.add.sprite(tx - 120, ty - 320, "p_orb").play("p_orb_anim").setTint(col).setScale(3.2 * size).setDepth(30).setBlendMode(R.zt.BlendModes.ADD);
      trackGfx(sc, m);
      sc.tweens.add({
        targets: m,
        x: tx,
        y: ty,
        duration: 650,
        ease: "Quad.easeIn",
        onUpdate: () => sc.fx.burst("glow", m.x, m.y, 2, col),
        onComplete: () => {
          m.destroy();
          warn.destroy();
          boom(sc, tx, ty - 10, a.r * size, B * a.p, el, it, 2.6);
          sc.fx.burst("chunk", tx, ty, 16, 0x806050);
          sc.cameras.main.flash(120, 255, 200, 140);
        },
      });
      R.j.play("magic");
      break;
    }
    case "nova": {
      if (a.cost) {
        const c = Math.round(p.maxHp * a.cost);
        p.hp = Math.max(1, p.hp - c);
        fx.number(p.cx, p.body.y - 30, `-${c}`, "#ff5a4a");
      }
      for (const t of targetsIn(sc, p.cx, p.cy, a.r * size)) H(t, a.p, { knock: 220, stagger: 0.5, frStacks: a.stacks ?? 0 });
      ringFx(sc, p.cx, p.cy, a.r * size, col, 420);
      fx.anim(el === "ice" ? "iceburst" : "explode", p.cx, p.cy, { scale: (a.r * size) / (a.big ? 22 : 40), tint: col, blend: !0 });
      burstEl(sc, p.cx, p.cy, el, a.big ? 40 : 20);
      fx.shake(a.big ? 6 : 2);
      a.big && sc.cameras.main.flash(160, 255, 160, 80);
      R.j.play(a.big ? "explosion" : el === "ice" ? "ice" : "magic");
      break;
    }
    case "wall": {
      const x = p.cx + dir * 34;
      const y = groundY(sc, x, p.body.y - 4);
      addZone(sc, { kind: "wall", x, y, r: 16, t: a.dur, it, el, dmg: B * a.p, tick: 0.5, h: 54 });
      fx.anim("icespike", x, y - 16, { scale: 1.8, tint: col });
      R.j.play("ice");
      break;
    }
    case "slowOrb": {
      const s = sc.add.sprite(p.cx + dir * 12, p.cy - 4, "p_orb").play("p_orb_anim").setTint(col).setScale(1.8 * size).setDepth(26).setBlendMode(R.zt.BlendModes.ADD);
      sc.fr.ents.push({ kind: "mover", s, vx: dir * 110, vy: 0, t: a.dur, it, el, dmg: B * a.p, tick: 0, every: a.dur / a.n, r: 46 * size, pull: 0 });
      R.j.play("magic");
      break;
    }
    case "sky": {
      const ts = nearest(sc, p.cx, p.cy, 380, a.n);
      if (!ts.length) ts.push(null);
      ts.forEach((t, i) =>
        sc.time.delayedCall(i * 110, () => {
          const [x, y] = t ? tc(t) : [p.cx + dir * (80 + i * 40), p.cy];
          sc.effects.bolt([{ x: x + rnd(-20, 20), y: y - 240 }, { x, y }]);
          skyPillar(sc, x, t ? t.body.y : groundY(sc, x, y), el ? col : 0xfff070, 6, 260);
          for (const u of targetsIn(sc, x, y, 26 * size)) H(u, a.p, { stagger: 0.5, knock: 80 });
          fx.anim("explode", x, y, { scale: 1.2, tint: col, blend: !0 });
          R.j.play("lightning");
        }),
      );
      fx.shake(2);
      break;
    }
    case "chain": {
      const pts = [{ x: p.cx, y: p.cy }];
      const seen = new Set();
      let cx = p.cx, cy = p.cy, r = 200;
      for (let i = 0; i < a.n; i++) {
        const t = nearest(sc, cx, cy, r, 1, seen)[0];
        if (!t) break;
        seen.add(t);
        [cx, cy] = tc(t);
        pts.push({ x: cx, y: cy });
        H(t, a.p, { knock: 60, stagger: 0.3 });
        r = 140;
      }
      pts.length === 1 && pts.push({ x: p.cx + dir * 70, y: p.cy - 8 });
      sc.effects.bolt(pts);
      R.j.play("lightning");
      break;
    }
    case "field": {
      let x, y;
      if (a.ground) ((x = p.cx + dir * 50), (y = groundY(sc, x, p.body.y - 4)));
      else {
        const t = nearest(sc, p.cx + dir * 100, p.cy, 260)[0];
        [x, y] = t ? tc(t) : [p.cx + dir * 90, p.cy - (a.float ? 30 : 0)];
      }
      addZone(sc, { kind: a.ground ? "pool" : "cloud", x, y, r: a.r * size, t: a.dur, it, el, dmg: B * a.p, tick: a.dur / a.n, slow: a.slow, float: a.float });
      R.j.play("magic");
      break;
    }
    case "tornado": {
      const s = sc.add.sprite(p.cx + dir * 20, p.body.y - 18, "fx_spin").setScale(1.6 * size, 2.2 * size).setTint(col).setDepth(26).setBlendMode(R.zt.BlendModes.ADD);
      sc.fr.ents.push({ kind: "mover", s, vx: dir * 120, vy: 0, t: a.dur, it, el, dmg: B * a.p, tick: 0, every: a.dur / a.n, r: 40 * size, pull: 160, spin: 1, ground: 1 });
      R.j.play("magic");
      break;
    }
    case "gust": {
      const x1 = p.cx + dir * a.w * size;
      for (const t of targetsRect(sc, p.cx, x1, p.body.y - 50, p.body.y + 8)) H(t, a.p, { knock: 560, knockUp: 120, stagger: 0.5 });
      clearEnemyProj(sc, p.cx, x1, p.body.y - 60, p.body.y + 10);
      for (let k = 0; k < 10; k++) sc.fx.burst("dust", p.cx + dir * rnd(10, a.w), p.cy + rnd(-20, 10), 1, col);
      fx.anim("fx_spin", p.cx + dir * 40, p.cy, { scale: 1.4, tint: col, blend: !0 });
      R.j.play("dash");
      break;
    }
    case "updraft":
      p.body.vy = -560;
      for (const t of targetsIn(sc, p.cx, p.body.y, a.r * size)) H(t, a.p, { knockUp: 380, knock: 20 });
      fx.anim("fx_spin", p.cx, p.body.y - 10, { scale: 1.6, tint: col, blend: !0 });
      fx.burst("dust", p.cx, p.body.y, 12, col);
      R.j.play("jump");
      break;
    case "boulder":
      sc.projectiles.spawn(projOpts(a.spr, 300, { gravity: 600, life: 2.4, aoe: 36 * size, pierce: 2 }), p.cx, p.cy - 8, ang0 - dir * 0.45 * (dir > 0 ? 1 : -1), "player", { hit: P(a.p, ex) }, { scale: 1.4 * size, tint: el && el !== "earth" ? col : void 0 });
      R.j.play("swingHeavy");
      break;
    case "quake": {
      for (const t of targetsRect(sc, p.cx - 330, p.cx + 330, p.body.y - 140, p.body.y + 120)) t.def?.flying || H(t, a.p, { knockUp: 200, stagger: 0.6, frStacks: a.stacks });
      for (let k = 0; k < 10; k++) sc.fx.burst("chunk", p.cx + rnd(-300, 300), p.body.y, 3, 0x9a8060);
      fx.shake(8, 400);
      sc.cameras.main.flash(80, 200, 160, 100);
      R.j.play("explosion");
      break;
    }
    case "grab": {
      const t = nearest(sc, p.cx, p.cy, 280)[0];
      if (t) {
        fx.anim("vine", t.body.x, t.body.y - 12, { scale: 1.4, tint: col, depth: 24 });
        t.statuses.apply({ type: "stun", chance: 1, dur: a.dur }, 0);
        H(t, a.p, { knock: 0 });
      }
      R.j.play("thud");
      break;
    }
    case "debuff": {
      const t = nearest(sc, p.cx, p.cy, 300)[0];
      if (t) {
        a.armor && t.statuses.apply({ type: "armorBreak", chance: 1, dur: 6, power: a.armor }, 1);
        a.curse && t.statuses.apply({ type: "curse", chance: 1, dur: a.dur, power: a.curse }, 1);
        a.armor && t.statuses.apply({ type: "poison", chance: 1, dur: 6, power: 0.3 }, B);
        a.p && H(t, a.p);
        const [x, y] = tc(t);
        ringFx(sc, x, y, 30, col);
        sc.fx.text(x, t.body.y - t.body.h - 10, a.curse ? "저주" : "부패", elCss(el));
      }
      R.j.play("magic");
      break;
    }
    case "healLight":
      p.heal(p.maxHp * a.p);
      p.statuses.clear("poison");
      p.statuses.clear("burn");
      for (const t of targetsIn(sc, p.cx, p.cy, 130)) applyEl(sc, t, "light", B, 1);
      skyPillar(sc, p.cx, p.body.y, 0xfff4b0, 18, 500);
      fx.burst("rise", p.cx, p.cy, 24, 0xfff4b0);
      R.j.play("heal");
      break;
    case "flash":
      sc.cameras.main.flash(260, 255, 255, 240);
      for (const t of targetsRect(sc, sc.cameras.main.scrollX, sc.cameras.main.scrollX + R.ot, -9999, 9999)) (t.statuses.apply({ type: "stun", chance: 1, dur: a.stun }, 0), H(t, a.p, { knock: 0 }));
      R.j.play("levelup");
      break;
    case "pillars": {
      const ts = nearest(sc, p.cx, p.cy, 360, a.n);
      for (let i = 0; i < a.n; i++) {
        const t = ts[i];
        const x = t ? t.body.x : p.cx + dir * (50 + i * 40);
        const y = groundY(sc, x, (t ? t.body.y : p.body.y) - 8);
        const warn = sc.add.ellipse(x, y, 34, 8, col, 0.5).setDepth(9);
        trackGfx(sc, warn);
        sc.time.delayedCall(320 + i * 120, () => {
          warn.destroy();
          skyPillar(sc, x, y, el ? col : 0xfff4b0, 12, 420);
          for (const u of targetsRect(sc, x - 18 * size, x + 18 * size, y - 220, y + 4)) H(u, a.p, { stagger: 0.5, knock: 60 });
          sc.fx.burst("rise", x, y, 10, col);
          sc.fx.shake(2);
          R.j.play("lightning", 0.8);
        });
      }
      break;
    }
    case "drain": {
      const t = nearest(sc, p.cx, p.cy, 240)[0];
      if (t) {
        const [x, y] = tc(t);
        const d = H(t, a.p, { stagger: 0.4 });
        p.heal(d * a.heal);
        for (let k = 0; k < 8; k++) {
          const s = sc.add.image(x + rnd(-8, 8), y + rnd(-8, 8), "px1").setTint(col).setScale(2).setDepth(27).setBlendMode(R.zt.BlendModes.ADD);
          sc.tweens.add({ targets: s, x: p.cx, y: p.cy, duration: 300 + k * 40, ease: "Quad.easeIn", onComplete: () => s.destroy() });
          trackGfx(sc, s);
        }
        flashLine(sc, p.cx, p.cy, x, y, col, 3, 300);
      }
      R.j.play("magic");
      break;
    }
    case "vortex": {
      const t = nearest(sc, p.cx + dir * 110, p.cy, 260)[0];
      const [x, y] = t ? tc(t) : [p.cx + dir * 110, p.cy - 10];
      addZone(sc, { kind: "vortex", x, y, r: a.r * size, t: a.dur, it, el, dmg: B * a.p, tick: a.dur / a.n, pull: 220 });
      R.j.play("magic");
      break;
    }
  }
  ex.frStacks = ex.frStacks ?? a.stacks;
}
function resetSlotOf(sc, it) {
  const sk = sc.player.skills;
  for (let i = 0; i < 3; i++) if (sc.fr.slotItems[sk.slots[i]] === it) sk.cds[i] = 0;
  sc.fx.text(sc.player.cx, sc.player.body.y - 40, "재사용!", "#ff6080");
}
function parryWindow(sc, it, dur, dmg, el) {
  const p = sc.player;
  p.iframes = Math.max(p.iframes, dur);
  p.buff("dmgReduce", dur, 0.9, "shield", "받아치기");
  sc.fx.burst("spark", p.cx + p.facing * 8, p.cy, 8, 0xd0e0ff);
  sc.fr.parry = { t: dur, it, dmg: dmg ?? base(sc, it) * 1.2, el: el ?? it?.el, hpAt: p.hp };
  R.j.play("block");
}
function boom(sc, x, y, r, dmg, el, it, scale = 1) {
  sc.fx.anim("explode", x, y, { scale: (r / 22) * Math.min(1.6, scale * 0.6), tint: el ? elColor(el) : 0xffb060, blend: !0 });
  ringFx(sc, x, y, r, el ? elColor(el) : 0xffb060, 360);
  burstEl(sc, x, y, el, 14);
  sc.fx.shake(Math.min(6, 2 + scale));
  R.j.play("explosion", 0.8);
  for (const t of targetsIn(sc, x, y, r)) sc.hitTarget(t, params(sc, it, dmg, { el, dir: t.body.x < x ? -1 : 1, knock: 240, stagger: 0.5, source: "aoe" }));
}
function clearEnemyProj(sc, x0, x1, y0, y1) {
  const a = Math.min(x0, x1),
    b = Math.max(x0, x1);
  for (const q of sc.projectiles.list) q.active && q.owner === "enemy" && q.x > a && q.x < b && q.y > y0 && q.y < y1 && sc.projectiles.kill(q);
}
function spirit(sc, x, y, el) {
  const t = nearest(sc, x, y, 300)[0];
  if (!t) return;
  sc.projectiles.spawn({ sprite: "p_shadow", speed: 220, life: 2.2, radius: 6, homing: 3, trail: elColor(el ?? "dark") }, x, y, Math.atan2(t.body.y - y, t.body.x - x), "player", { hit: params(sc, null, sc.player.stats.atk * sc.player.atkMult() * 1.2, { el: el ?? "dark" }) }, { scale: 1.2, tint: elColor(el ?? "dark") });
}
function slowAll(sc, dur) {
  for (const t of targetsIn(sc, sc.player.cx, sc.player.cy, 260)) t.statuses.apply({ type: "chill", chance: 1, dur, power: 0.6 }, 0);
}
function gather(sc, x, y, r) {
  for (const t of targetsIn(sc, x, y, r)) t.kind !== "boss" && (t.body.vx += Math.sign(x - t.body.x) * 260);
}

// ── 지대 ─────────────────────────────────────────────
function addZone(sc, z) {
  z.g = sc.add.graphics().setDepth(z.kind === "cloud" || z.kind === "vortex" ? 26 : 9).setBlendMode(R.zt.BlendModes.ADD);
  z.life = z.t;
  z.tk = 0;
  z.hits = new Set();
  sc.fr.zones.push(z);
}
function drawZone(sc, z, T) {
  const g = z.g;
  const c = z.el ? elColor(z.el) : 0xd0d0d0;
  const fade = Math.min(1, z.t / 0.4) * Math.min(1, (z.life - z.t) / 0.2 + 0.3);
  g.clear();
  switch (z.kind) {
    case "pool":
      g.fillStyle(c, 0.28 * fade).fillEllipse(z.x, z.y - 2, z.r * 2, 14);
      g.fillStyle(c, 0.5 * fade).fillEllipse(z.x, z.y - 2, z.r * 1.4, 8);
      for (let i = 0; i < 4; i++) {
        const a = T * 2 + i * 1.7;
        g.fillStyle(0xffffff, 0.4 * fade).fillCircle(z.x + Math.cos(a) * z.r * 0.6, z.y - 4 - ((T * 20 + i * 9) % 14), 1.5);
      }
      break;
    case "cloud":
      for (let i = 0; i < 6; i++) {
        const a = T * 0.8 + i;
        g.fillStyle(c, 0.12 * fade).fillCircle(z.x + Math.cos(a) * z.r * 0.4, z.y + Math.sin(a * 1.3) * z.r * 0.25, z.r * 0.55);
      }
      z.float && g.fillStyle(0xffffff, 0.7 * fade).fillCircle(z.x, z.y, 5 + Math.sin(T * 12) * 2);
      z.float && g.lineStyle(2, c, 0.8 * fade).strokeCircle(z.x, z.y, 9);
      break;
    case "vortex":
      for (let i = 0; i < 3; i++) g.lineStyle(3, c, (0.6 - i * 0.15) * fade).strokeCircle(z.x, z.y, (z.r * (1 - ((T * 1.4 + i / 3) % 1))));
      g.fillStyle(0x000000, 0.35 * fade).fillCircle(z.x, z.y, 12);
      g.fillStyle(c, 0.6 * fade).fillCircle(z.x, z.y, 6);
      break;
    case "wall":
      g.fillStyle(c, 0.35 * fade).fillRect(z.x - 7, z.y - z.h, 14, z.h);
      g.fillStyle(0xffffff, 0.5 * fade).fillRect(z.x - 2, z.y - z.h, 3, z.h);
      break;
    case "trap":
      g.lineStyle(2, z.armed === !1 ? 0x606060 : c === 0xd0d0d0 ? 0xffd060 : c, 0.9).strokeCircle(z.x, z.y - 3, 7);
      g.fillStyle(0xffd060, 0.5 + Math.sin(T * 6) * 0.3).fillCircle(z.x, z.y - 3, 2);
      break;
    case "fire":
      g.fillStyle(c, 0.25 * fade).fillEllipse(z.x, z.y - 2, z.r * 2, 12);
      break;
  }
}
const p0 = (sc) => sc.player;
function updateZones(sc, dt) {
  const fr = sc.fr;
  const T = sc.time.now / 1000;
  for (let i = fr.zones.length - 1; i >= 0; i--) {
    const z = fr.zones[i];
    z.t -= dt;
    z.tk -= dt;
    drawZone(sc, z, T);
    if (z.kind === "wall") clearEnemyProj(sc, z.x - 12, z.x + 12, z.y - z.h, z.y + 4);
    if (z.pull) for (const t of targetsIn(sc, z.x, z.y, z.r * 1.5)) t.kind !== "boss" && (t.body.vx += Math.sign(z.x - t.body.x) * z.pull * dt * 8);
    if (z.kind === "trap") {
      if (z.armed !== !1) {
        const ts = targetsIn(sc, z.x, z.y - 6, z.r);
        if (ts.length) {
          z.armed = !1;
          z.t = Math.min(z.t, 0.6);
          const hit40 = targetsIn(sc, z.x, z.y - 6, 40);
          for (const t of hit40) (t.statuses.apply({ type: "stun", chance: 1, dur: z.stunDur ?? 2 }, 0), sc.hitTarget(t, params(sc, z.it, z.dmg, { el: z.el, knock: 0 })));
          z.onTrigger?.(z, hit40);
          sc.fx.anim("vine", z.x, z.y - 10, { scale: 1.3 });
          R.j.play("thud");
        }
      }
    } else if (z.tk <= 0) {
      z.tk = z.tick;
      const ts = targetsIn(sc, z.x, z.y - (z.kind === "pool" ? 8 : 0), z.r);
      for (const t of ts) {
        z.slow && t.statuses.apply({ type: "chill", chance: 1, dur: 1, power: 0.5 }, 0);
        z.dmg > 0 && sc.hitTarget(t, params(sc, z.it, z.dmg, { el: z.el, knock: 0, stagger: 0.05, noCrit: !0, source: "aoe" }));
      }
      z.heal && Math.abs(p0(sc).cx - z.x) < z.r && Math.abs(p0(sc).body.y - (z.kind === "pool" ? z.y : z.y + 20)) < Math.max(40, z.r * 0.8) && p0(sc).heal(p0(sc).maxHp * z.heal, !1);
      z.onTick?.(z, ts);
    }
    z.onFrame?.(z, dt);
    if (Math.random() < dt * 14) {
      const px = z.x + (Math.random() - 0.5) * z.r * 1.6;
      z.kind === "pool" && (VFX.puff(sc, Math.random() < 0.5 ? "bubble" : "mist", z.el, px, z.y - 4, 1), Math.random() < 0.3 && VFX.puff(sc, "flame", z.el, px, z.y - 2, 1));
      z.kind === "cloud" && VFX.puff(sc, "mist", z.el, px, z.y + (Math.random() - 0.5) * z.r, 2);
      z.kind === "vortex" && VFX.puff(sc, "wisp", z.el, px, z.y, 1);
    }
    if (z.t <= 0) (z.g.destroy(), z.onEnd?.(), fr.zones.splice(i, 1));
  }
}
function updateEnts(sc, dt) {
  const fr = sc.fr;
  const p = sc.player;
  for (let i = fr.ents.length - 1; i >= 0; i--) {
    const e = fr.ents[i];
    if (e.kind === "gfx") {
      e.life -= dt;
      (e.life <= 0 || !e.gfx.active) && fr.ents.splice(i, 1);
      continue;
    }
    e.t -= dt;
    if (e.kind === "orbit") {
      e.ang += dt * 5;
      e.orbs.forEach((s, k) => {
        const a = e.ang + (k / e.orbs.length) * Math.PI * 2;
        const x = p.cx + Math.cos(a) * e.r,
          y = p.cy + Math.sin(a) * e.r * 0.8;
        s.setPosition(x, y);
        for (const t of targetsIn(sc, x, y, 10)) {
          if ((e.cd.get(t) ?? 0) > 0) continue;
          e.cd.set(t, 0.4);
          sc.hitTarget(t, params(sc, e.it, e.dmg, { el: e.el, knock: 80, stagger: 0.15, dir: t.body.x < p.cx ? -1 : 1 }));
        }
      });
      for (const [k, v] of e.cd) e.cd.set(k, v - dt);
      if (e.t <= 0) {
        e.orbs.forEach((s) => s.destroy());
        fr.ents.splice(i, 1);
      }
      continue;
    }
    if (e.kind === "fx") {
      e.upd?.(e, dt);
      e.t <= 0 && (e.end?.(e), fr.ents.splice(i, 1));
      continue;
    }
    if (e.kind === "mover") {
      e.s.x += e.vx * dt;
      if (e.ground) {
        const y = groundY(sc, e.s.x, e.s.y);
        e.s.y += (y - 18 - e.s.y) * Math.min(1, dt * 8);
      }
      e.spin && (e.s.rotation += dt * 14);
      e.tick -= dt;
      if (e.pull) for (const t of targetsIn(sc, e.s.x, e.s.y, e.r * 1.6)) t.kind !== "boss" && (t.body.vx += Math.sign(e.s.x - t.body.x) * e.pull * dt * 6);
      if (e.tick <= 0) {
        e.tick = e.every;
        for (const t of targetsIn(sc, e.s.x, e.s.y, e.r)) sc.hitTarget(t, params(sc, e.it, e.dmg, { el: e.el, knock: 30, stagger: 0.1, noCrit: !0, source: "aoe", dir: t.body.x < e.s.x ? -1 : 1 }));
        sc.fx.burst("glow", e.s.x, e.s.y, 3, e.el ? elColor(e.el) : 0xffffff);
      }
      if (e.t <= 0) {
        sc.tweens.add({ targets: e.s, alpha: 0, scale: 0.2, duration: 200, onComplete: () => e.s.destroy() });
        fr.ents.splice(i, 1);
      }
    }
  }
}

// ── 매 프레임 ───────────────────────────────────────
export function update(sc, dt) {
  sc._frSkyZone = (zoneOfPlayer(sc)?.y ?? 0) < 0;
  const fr = sc.fr;
  if (!fr || !sc.player) return;
  const p = sc.player;
  recallTick(sc, dt);
  oxygenTick(sc, dt);
  windupTick(sc, dt);
  FOES.updateZones(sc, dt);
  // 중간 보스 등장 알림
  for (const e of sc.enemies)
    if (e.opts?.midBoss && !e.dead && !e._announced && Math.abs(e.cx - p.cx) < 300 && Math.abs(e.body.y - p.body.y) < 160) {
      e._announced = !0;
      e.aggro = !0;
      sc.hud?.()?.banner("중간 보스", `${e.def.name} · 쓰러뜨리면 많은 아이템을 얻는다`, "#ff7060");
      sc.cameras.main.shake(300, 0.006);
      R.j.play("bossRoar");
    }
  fr.mana = Math.min(fr.maxMana, fr.mana + fr.manaRegen * dt);
  fr.auraCd -= dt;
  fr.emCd = (fr.emCd ?? 0) - dt;
  for (const k in fr.chain) {
    const c = fr.chain[k];
    if (c && (c.t -= dt) <= 0) {
      fr.chain[k] = null;
      const sk = p.skills;
      ((sk.maxCds[k] = c.full), (sk.cds[k] = c.full));
    }
  }
  if (fr.gearT > 0) {
    fr.gearT -= dt;
    for (let i = 0; i < 3; i++) p.skills.cds[i] = Math.max(0, p.skills.cds[i] - dt * 2);
  }
  if (fr.parry) {
    fr.parry.t -= dt;
    if (p.hp < fr.parry.hpAt || p._frParried) {
      p._frParried = !1;
    }
    if (fr.parry.t <= 0) {
      const pr = fr.parry;
      fr.parry = null;
      for (const t of targetsIn(sc, p.cx + p.facing * 20, p.cy, 54)) sc.hitTarget(t, params(sc, pr.it, pr.dmg, { el: pr.el, knock: 260, stagger: 0.8, heavy: !0 }));
      sc.fx.anim("fx_heavy", p.cx + p.facing * 18, p.cy, { flip: p.facing < 0, tint: pr.el ? elColor(pr.el) : 0xd0e0ff, scale: 1.4 });
      R.j.play("crit");
    }
  }
  // 대시 스킬
  if (fr.dash) {
    const d = fr.dash;
    d.t -= dt;
    p.body.vx = d.dir * 720;
    p.body.vy = 0;
    p.facing = d.dir;
    for (const t of sc.targets()) {
      if (t.dead || d.hits.has(t)) continue;
      const b = t.body;
      Math.abs(b.x - p.cx) < b.w / 2 + 16 && p.cy > b.y - b.h - 10 && p.cy < b.y + 10 && (d.hits.add(t), sc.hitTarget(t, params(sc, d.it, d.dmg, { el: d.el, dir: d.dir, knock: d.knock, stagger: 0.5, ...d.ex })), sc.fx.anim("fx_thrust", b.x, b.y - b.h / 2, { tint: d.el ? elColor(d.el) : void 0, flip: d.dir < 0 }));
    }
    d.clear && clearEnemyProj(sc, p.cx - 20, p.cx + 20, p.cy - 30, p.cy + 30);
    sc.fx.burst("glow", p.cx, p.cy, 2, d.el ? elColor(d.el) : 0xd0e0ff);
    p.spawnAfterimage?.();
    d.t <= 0 && ((fr.dash = null), (p.body.vx = d.dir * 140));
  }
  if (fr.slam) {
    const s = fr.slam;
    s.t -= dt;
    s.delay -= dt;
    s.delay <= 0 && !p.body.onGround && (p.body.vy = Math.max(p.body.vy, 700));
    if ((s.delay <= 0 && p.body.onGround) || s.t <= 0) {
      fr.slam = null;
      for (const t of targetsIn(sc, p.cx, p.body.y - 6, s.r)) sc.hitTarget(t, params(sc, s.it, s.dmg, { el: s.el, knock: 260, knockUp: 200, stagger: 0.7, heavy: !0, dir: t.body.x < p.cx ? -1 : 1, ...s.ex }));
      sc.fx.anim("fx_smash", p.cx, p.body.y - 12, { scale: 1.6, tint: s.el ? elColor(s.el) : void 0 });
      ringFx(sc, p.cx, p.body.y - 4, s.r, s.el ? elColor(s.el) : 0xffd0a0);
      sc.fx.burst("chunk", p.cx, p.body.y, 12, 0xa89878);
      sc.fx.shake(5);
      R.j.play("thud");
    }
  }
  const we = fr.equip.weapon?.el;
  if (we && p.weapons?.ws?.visible && Math.random() < dt * 24) VFX.trail(sc, we, p.weapons.ws.x + (Math.random() - 0.5) * 10, p.weapons.ws.y + (Math.random() - 0.5) * 6);
  updateZones(sc, dt);
  VFX.updateVfx(sc, dt);
  ATMO.update(sc, dt);
  NATANIM.update(sc, dt, natAnimSrc(sc));
  DEV.update(sc, dt, devSrc(sc));
  R.j.setSpace && R.j.setSpace(audioSpace(sc));
  updateEnts(sc, dt);
  updatePickups(sc, dt);
  LOOK.update(sc, dt);
}
export function shift(sc, T) {
  const fr = sc.fr;
  if (!fr) return;
  for (const z of fr.zones) z.x -= T;
  for (const e of fr.ents) {
    e.kind === "mover" && (e.s.x -= T);
    e.kind === "fx" && e.x !== void 0 && (e.x -= T);
    e.kind === "fx" && e.onShift?.(T);
    e.kind === "gfx" && e.gfx.x !== void 0 && (e.gfx.x -= T);
  }
  for (const k of fr.pickups) ((k.x -= T), k.s.setX(k.x), k.b.setX(k.x));
  VFX.shiftVfx(sc, T);
}

// ── 명중 시 (속성·각인) ─────────────────────────────
export function onHit(sc, T, C, dealt) {
  const fr = sc.fr;
  if (!fr || T.dead === void 0) return;
  LOOK.onHit(sc, T, C, dealt);
  const p = sc.player;
  const weaponHit = C.source === "weapon" || C.source === "special";
  if (weaponHit) {
    const w = fr.equip.weapon;
    const wm = fr.wmods ?? {};
    fr.hits++;
    w?.el && applyEl(sc, T, w.el, C.dmg, w.magicLine ? 0.6 : 0.4);
    fr.focus > 0 && (fr.focus--, fr.focus > 0 && p.buff("critNext", 30, 1, "crit", "집중"));
    wm.manaOnHit && (fr.mana = Math.min(fr.maxMana, fr.mana + wm.manaOnHit));
    wm.chain && Math.random() < 0.5 && sc.effects.chainLightning(T, wm.chain);
    wm.boomEvery && fr.hits % 3 === 0 && boom(sc, T.body.x, T.body.y - T.body.h / 2, 34, C.dmg * 0.8, w?.el, w);
    wm.echoEvery && fr.hits % 3 === 0 && sc.time.delayedCall(90, () => T.dead || sc.hitTarget(T, { ...C, source: "proc", noCrit: !0 }));
    wm.execute && !T.dead && T.kind !== "boss" && !T.isElite && T.hp / T.maxHp < wm.execute && (T.receive(T.hp + 1, !0, { ...C, knock: 0 }), sc.fx.text(T.body.x, T.body.y - T.body.h - 8, "참수", "#ff4040"));
    wm.bleed && T.statuses.apply({ type: "bleed", chance: 1, dur: 3, power: 0.22 }, C.dmg);
    wm.stunEvery && fr.hits % 5 === 0 && T.statuses.apply({ type: "stun", chance: 1, dur: 0.5 }, 0);
    wm.ghost && Math.random() < 0.5 && sc.time.delayedCall(120, () => T.dead || sc.hitTarget(T, { ...C, dmg: C.dmg * wm.ghost, source: "proc", noCrit: !0 }));
    wm.slowHit && T.statuses.apply({ type: "chill", chance: 1, dur: 1.5, power: wm.slowHit }, 0);
    wm.pullHit && T.kind !== "boss" && (T.body.vx += Math.sign(p.cx - T.body.x) * 120);
    wm.sacrifice && p.hp > 2 && (p.hp -= 1);
    wm.shieldEvery && fr.hits % 10 === 0 && p.buff("dmgReduce", 3, 0.3, "shield", "보호막");
    wm.awaken;
    // 기술 무기: 공격 횟수로 충전
    if (w && (w.cat === "WS" || (w.legend && w.kind === "weapon"))) {
      const sid = [w.secondary, w.third].find((x) => IT.BASE[x]?.kind === "skill");
      if (sid) {
        fr.charge++;
        const need = Math.round(IT.baseCooldown(sid) * 1.6);
        if (fr.charge >= need) {
          fr.charge = 0;
          sc.fx.text(p.cx, p.body.y - 40, IT.BASE[sid].name + "!", "#ffd84a");
          runAction(sc, sid, w, { mult: 1, el: w.el });
        }
      }
    }
    // 마법 무기: 4타마다 마법이 섞임
    w?.el && VFX.impact(sc, w.el, T.body.x, T.body.y - T.body.h / 2, 0.3);
    const WS = w && w.tier > 0 ? interp(w) : null;
    if (WS) {
      applyMods(sc, T, { ...WS.m, knockup: 0, pull: WS.m.pull && Math.random() < 0.3, stun: 0, exec: WS.m.exec }, dealt, C.dmg);
      WS.m.every && fr.hits % WS.m.every === 0 && T.statuses.apply({ type: "stun", chance: 1, dur: WS.m.stun ?? 1 }, 0);
      const mid = WS.emit;
      if (mid && (w.cat === "WM" || w.cat === "LG")) {
        const len = Math.max(1, p.weapons.def?.combo?.length ?? 3);
        let go = !1, at = "hand";
        if (WS.when === "swing") (go = fr.emCd <= 0) && (fr.emCd = 0.35);
        else if (WS.when === "hit") ((go = Math.random() < 0.4), (at = "t"));
        else if (WS.when === "finisher") ((go = fr.hits % len === 0), (at = WS.pat === "up" || WS.pat === "radial" ? "t" : "hand"));
        if (go) {
          const K = makeK(sc, w, { el: w.el, mult: 0.7, spec: WS }, !0);
          const x = at === "t" ? T.body.x : p.cx + p.facing * 10, y = at === "t" ? T.body.y - T.body.h / 2 : p.cy - 2;
          VFX.emitFx(K, mid, x, y, p.facing > 0 ? 0 : Math.PI, WS.pat, WS.n, WS.m, 0.8);
        }
      }
    }
  } else if (C.frEl !== void 0) {
    C.frEl && applyEl(sc, T, C.frEl, C.dmg, C.frElChance ?? 1, C.frStacks);
    C.frStun && T.statuses.apply({ type: "stun", chance: 1, dur: C.frStun }, 0);
    C.frLs && p.heal(dealt * C.frLs, !1);
    C.frChain && sc.effects.chainLightning(T, C.frChain);
  }
  // 반사 등은 생략. 피해 증가 상태 처리는 hitTarget에서
}
export function dmgTakenMult(T) {
  let m = 1;
  T.statuses.has("erode") && (m *= 1.15 * (T._frPitch ? 1.25 : 1));
  const cu = T.statuses.get("curse");
  cu && cu.t > 0 && (m *= 1 + Math.min(0.6, cu.power));
  T._frPetrify > 0 && (m *= 2);
  m *= SP.takenHook(T);
  return m;
}

// 속성 상태이상
export function applyEl(sc, T, el, dmg, chance = 1, stacks = 0) {
  if (!el || T.dead || Math.random() > chance) return;
  const E = IT.ELEMS[el];
  if (!E) return;
  const pure = E.kind === "pure";
  const pm = pure ? 2 : 1;
  const parts = pure ? [E.base] : E.parts;
  for (const pt of parts) baseStatus(sc, T, pt, dmg, pm, stacks);
  const now = sc.time.now;
  if (E.kind === "comp") {
    const last = sc.fr.react.get(T) ?? -1e9;
    if (now - last > 900) {
      sc.fr.react.set(T, now);
      reaction(sc, T, E, dmg);
    }
  } else if (pure && Math.random() < 0.18) {
    const last = sc.fr.react.get(T) ?? -1e9;
    now - last > 1200 && (sc.fr.react.set(T, now), pureBurst(sc, T, E, dmg));
  }
}
function baseStatus(sc, T, k, dmg, pm, stacks) {
  const st = T.statuses;
  switch (k) {
    case "fire":
      st.apply({ type: "burn", chance: 1, dur: 3, power: 0.22 * pm }, dmg);
      break;
    case "ice":
      st.apply({ type: "chill", chance: 1, dur: 2.5, power: 0.35 }, 0);
      T._frIce = (T._frIce ?? 0) + 1 + (stacks ?? 0);
      if (T._frIce >= 5) {
        T._frIce = 0;
        st.apply({ type: "freeze", chance: 1, dur: 1.5 * pm }, 0);
        sc.fx.anim("iceburst", T.body.x, T.body.y - T.body.h / 2, { scale: 0.9 });
        sc.fx.text(T.body.x, T.body.y - T.body.h - 10, "빙결", "#90e0ff");
      }
      break;
    case "lightning":
      Math.random() < 0.3 * pm && sc.effects.chainLightning(T, pm > 1 ? 4 : 1);
      break;
    case "wind":
      T.kind !== "boss" && (T.body.vx += sc.player.facing * 90 * pm);
      T._frWind = (T._frWind ?? 0) + 1;
      T._frWind >= 3 && T.kind !== "boss" && ((T._frWind = 0), (T.body.vy = -300));
      break;
    case "earth":
      T._frEarth = (T._frEarth ?? 0) + 1 + (stacks ?? 0);
      st.apply({ type: "armorBreak", chance: 1, dur: 3, power: Math.min(0.4, 0.08 * T._frEarth) }, 1);
      if (T._frEarth >= 3) {
        T._frEarth = 0;
        st.apply({ type: "stun", chance: 1, dur: pm > 1 ? 2 : 1 }, 0);
        pm > 1 && (T._frPetrify = 2);
        sc.fx.text(T.body.x, T.body.y - T.body.h - 10, pm > 1 ? "석화" : "기절", "#e0b878");
      }
      break;
    case "poison":
      st.apply({ type: "poison", chance: 1, dur: 4, power: 0.18 * pm }, dmg);
      break;
    case "light":
      T._frMark = (T._frMark ?? 0) + 1 + (stacks ?? 0);
      if (T._frMark >= 3) {
        T._frMark = 0;
        const [x, y] = tc(T);
        skyPillar(sc, x, T.body.y, 0xfff4b0, 10, 300);
        for (const t of targetsIn(sc, x, y, 36)) sc.hitTarget(t, params(sc, null, dmg * 0.9, { el: null, element: "light", knock: 60, source: "aoe", noReact: !0 }));
        sc.player.heal(sc.player.maxHp * 0.02 * pm, !1);
      }
      break;
    case "dark":
      st.apply({ type: "erode", chance: 1, dur: 4 }, 1);
      pm > 1 && (T._frPitch = 1);
      break;
  }
}
function pureBurst(sc, T, E, dmg) {
  const [x, y] = tc(T);
  sc.fx.text(x, T.body.y - T.body.h - 16, `${E.name}!`, E.css);
  boom(sc, x, y, 48, dmg * 1.5, E.id, null, 2);
}
// 복합 속성 반응 (기획서 0-2)
function reaction(sc, T, E, dmg) {
  const [x, y] = tc(T);
  const p = sc.player;
  const D = Math.max(dmg, p.stats.atk * p.atkMult()) * (1 + (p.host.fr.wmods?.reactDmg ?? 0));
  const c = E.color;
  sc.fx.text(x, T.body.y - T.body.h - 16, `${E.name}!`, E.css);
  sc.fx.burst("glow", x, y, 14, c);
  const prm = (m, extra = {}) => params(sc, null, D * m, { el: null, element: dispEl(E.id), knock: 160, stagger: 0.4, source: "aoe", noReact: !0, ...extra });
  const area = (r, m, extra) => {
    for (const t of targetsIn(sc, x, y, r)) sc.hitTarget(t, prm(m, { dir: t.body.x < x ? -1 : 1, ...extra }));
  };
  switch (E.fx) {
    case "blast":
      sc.fx.anim("explode", x, y, { scale: 2.2, tint: c, blend: !0 });
      area(54, 1.5);
      sc.fx.shake(3);
      R.j.play("explosion", 0.8);
      break;
    case "blastPoison":
      sc.fx.anim("explode", x, y, { scale: 2, tint: c, blend: !0 });
      for (const t of targetsIn(sc, x, y, 54)) (t.statuses.apply({ type: "burn", chance: 1, dur: 3, power: 0.25 }, D), t.statuses.apply({ type: "poison", chance: 1, dur: 4, power: 0.2 }, D));
      area(54, 1.2);
      R.j.play("explosion", 0.7);
      break;
    case "beam": {
      const d = p.facing;
      flashLine(sc, x - d * 30, y, x + d * 360, y, c, 7, 320);
      for (const t of targetsRect(sc, x, x + d * 360, y - 14, y + 18)) sc.hitTarget(t, prm(1.4, { dir: d }));
      R.j.play("lightning");
      break;
    }
    case "spreadBurn":
      for (const t of targetsIn(sc, x, y, 80)) t.statuses.apply({ type: "burn", chance: 1, dur: E.id === "hellfire" ? 8 : 4, power: 0.3 }, D);
      ringFx(sc, x, y, 80, c);
      break;
    case "lavaPool":
      addZone(sc, { kind: "pool", x, y: groundY(sc, x, T.body.y - 4), r: 46, t: 3, it: null, el: "fire", dmg: D * 0.35, tick: 0.4 });
      break;
    case "bogPool":
      addZone(sc, { kind: "pool", x, y: groundY(sc, x, T.body.y - 4), r: 46, t: 3, it: null, el: "poison", dmg: D * 0.2, tick: 0.5, slow: 1 });
      T.statuses.apply({ type: "stun", chance: 1, dur: 2 }, 0);
      break;
    case "holyFire":
      skyPillar(sc, x, T.body.y, c, 16, 420);
      area(60, 1.4);
      break;
    case "shatter":
      if (T.statuses.has("freeze") || T.statuses.has("chill")) {
        T.statuses.clear("freeze");
        sc.fx.anim("iceburst", x, y, { scale: 1.6, tint: c });
        sc.hitTarget(T, prm(3, { knock: 120 }));
        R.j.play("ice");
      }
      break;
    case "blizzard":
      for (const t of targetsIn(sc, x, y, 90)) t.statuses.apply({ type: "chill", chance: 1, dur: 3, power: 0.6 }, 0);
      for (let k = 0; k < 14; k++) sc.fx.burst("glow", x + rnd(-80, 80), y + rnd(-50, 30), 1, 0xffffff);
      area(90, 0.6);
      break;
    case "root":
      for (const t of targetsIn(sc, x, y, 60)) (t.statuses.apply({ type: "stun", chance: 1, dur: 1.5 }, 0), t.statuses.apply({ type: "chill", chance: 1, dur: 3, power: 0.5 }, 0));
      sc.fx.anim("icespike", x, T.body.y - 16, { scale: 1.4, tint: c });
      break;
    case "frostbite":
      T.statuses.apply({ type: "poison", chance: 1, dur: 6, power: 0.4 }, D);
      T.statuses.apply({ type: "chill", chance: 1, dur: 5, power: 0.5 }, 0);
      break;
    case "shield":
      p.buff("dmgReduce", 4, 0.35, "shield", E.name);
      sc.fx.anim("ring", p.cx, p.cy, { scale: 1.2, tint: c, blend: !0 });
      break;
    case "reflect":
      p.buff("dmgReduce", 4, 0.25, "shield", E.name);
      for (let k = 0; k < 3; k++) spirit(sc, p.cx + rnd(-20, 20), p.cy - 20, "earth");
      break;
    case "spirit":
      spirit(sc, x, y - 10, E.parts[1]);
      spirit(sc, x, y - 10, E.parts[1]);
      break;
    case "storm": {
      const ts = nearest(sc, x, y, 220, 5);
      ts.forEach((t, i) => sc.time.delayedCall(i * 70, () => {
        const [tx, ty] = tc(t);
        sc.effects.bolt([{ x: tx, y: ty - 200 }, { x: tx, y: ty }]);
        t.dead || sc.hitTarget(t, prm(0.9));
      }));
      R.j.play("lightning");
      break;
    }
    case "pull":
      for (const t of targetsIn(sc, x, y, 130)) t !== T && t.kind !== "boss" && (t.body.x += (x - t.body.x) * 0.6);
      ringFx(sc, x, y, 130, c);
      area(40, 0.8);
      break;
    case "paralyze":
      T.statuses.apply({ type: "stun", chance: 1, dur: 2 }, 0);
      T.statuses.apply({ type: "poison", chance: 1, dur: 4, power: 0.36 }, D);
      break;
    case "bigBolt":
      skyPillar(sc, x, T.body.y, 0xfff8c0, 22, 500);
      sc.effects.bolt([{ x, y: y - 260 }, { x, y }]);
      area(50, 2.6, { heavy: !0 });
      sc.fx.shake(5);
      sc.cameras.main.flash(120, 255, 255, 200);
      R.j.play("lightning");
      break;
    case "trueDmg":
      sc.hitTarget(T, prm(1.2, { frTrue: !0, knock: 60 }));
      sc.fx.anim("ring", x, y, { scale: 0.9, tint: c, blend: !0 });
      break;
    case "blind":
      for (const t of targetsIn(sc, x, y, 90)) t.statuses.apply({ type: "stun", chance: 0.5, dur: 0.8 }, 0);
      for (let k = 0; k < 10; k++) sc.fx.burst("dust", x + rnd(-70, 70), y + rnd(-30, 20), 1, 0xe0c080);
      break;
    case "spreadPoison":
      for (const t of targetsIn(sc, x, y, 90)) t.statuses.apply({ type: "poison", chance: 1, dur: 5, power: 0.25 }, D);
      ringFx(sc, x, y, 90, c);
      break;
    case "haste":
      p.buff("speed", 5, 0.3, "speed", E.name);
      p.buff("berserkSpd", 5, 0.3, "speed", E.name);
      break;
    case "fear":
      for (const t of targetsIn(sc, x, y, 100)) t.kind !== "boss" && ((t.body.vx = Math.sign(t.body.x - p.cx) * 320), t.statuses.apply({ type: "stun", chance: 1, dur: 1.5 }, 0));
      break;
    case "gold":
      sc.dropGold(x, y, 3 + sc.dist / 300);
      break;
    case "maxHpCut":
      !T._frCursed && T.kind !== "boss" && ((T._frCursed = !0), (T.maxHp = Math.round(T.maxHp * 0.8)), (T.hp = Math.min(T.hp, T.maxHp)));
      T._frCursed || ((T._frCursed = !0), sc.hitTarget(T, prm(1)));
      break;
  }
}

// ── 화면 가운데 큰 알림 (2026-11-28, 알비온식) ──────────
//   장식 띠가 펼쳐지고 → 아이콘 · 제목 · 설명 → 잠시 뒤 접힌다. 여러 개면 차례로
//   o: { title, sub, color(숫자), css, icon(텍스처 키), small(작은 알림), sound }
export function bigNotice(scene, o) {
  if (!scene?.add) return;
  (scene.frNotes ??= []).push(o);
  scene.frNoteBusy || nextNotice(scene);
}
function nextNotice(sc) {
  const o = sc.frNotes?.shift();
  if (!o || !sc.sys?.isActive?.()) return void (sc.frNoteBusy = 0);
  sc.frNoteBusy = 1;
  const ADD = R.zt.BlendModes.ADD, W = R.ot, small = !!o.small;
  const pw = small ? 230 : 330, ph = small ? 30 : 56, y = small ? 54 : 70;
  const col = o.color ?? 0xffd070, css = o.css ?? "#ffe08a";
  const C = sc.add.container(W / 2, y).setScrollFactor(0).setDepth(60);
  const glow = sc.add.image(0, 0, "vx_glow").setTint(col).setBlendMode(ADD).setScale(pw / 40, ph / 26).setAlpha(0.35);
  const g = sc.add.graphics();
  // 띠 꼬리 (양끝 제비꼬리)
  const tail = (s) => {
    const x = (s * pw) / 2;
    g.fillStyle(0x2a1a0c, 0.95).fillTriangle(x, -ph / 2 + 6, x + s * 22, -ph / 2 + 6, x + s * 12, 0).fillTriangle(x, ph / 2 - 6, x + s * 22, ph / 2 - 6, x + s * 12, 0);
    g.fillStyle(0x2a1a0c, 0.95).fillRect(Math.min(x, x + s * 12), -ph / 2 + 6, 12, ph - 12);
    g.lineStyle(1, 0xc8a050, 0.9).lineBetween(x, -ph / 2 + 6, x + s * 22, -ph / 2 + 6).lineBetween(x + s * 22, -ph / 2 + 6, x + s * 12, 0).lineBetween(x + s * 12, 0, x + s * 22, ph / 2 - 6).lineBetween(x + s * 22, ph / 2 - 6, x, ph / 2 - 6);
  };
  tail(-1), tail(1);
  // 판: 어두운 가죽 + 금 테두리 두 줄 + 모서리 마름모
  g.fillStyle(0x140c08, 0.94).fillRect(-pw / 2, -ph / 2, pw, ph);
  g.fillStyle(col, 0.1).fillRect(-pw / 2, -ph / 2, pw, ph / 2);
  g.lineStyle(2, 0xc8a050, 1).strokeRect(-pw / 2, -ph / 2, pw, ph);
  g.lineStyle(1, 0x6a4a20, 1).strokeRect(-pw / 2 + 4, -ph / 2 + 4, pw - 8, ph - 8);
  g.lineStyle(1, col, 0.8).lineBetween(-pw / 2 + 8, ph / 2 - 6, pw / 2 - 8, ph / 2 - 6);
  for (const [cx, cy] of [[-pw / 2, -ph / 2], [pw / 2, -ph / 2], [-pw / 2, ph / 2], [pw / 2, ph / 2]]) g.fillStyle(0xe8c070, 1).fillTriangle(cx - 4, cy, cx, cy - 4, cx + 4, cy).fillTriangle(cx - 4, cy, cx, cy + 4, cx + 4, cy);
  const parts = [glow, g];
  let tx = 0;
  if (o.icon && !small) {
    const ix = -pw / 2 + 30;
    parts.push(sc.add.image(ix, 0, "ui_medal").setScale(0.85), sc.add.image(ix, 0, o.icon).setScale(1.5));
    const ring = sc.add.image(ix, 0, "vx_glow").setTint(col).setBlendMode(ADD).setScale(1.1).setAlpha(0.6);
    parts.push(ring);
    sc.tweens.add({ targets: ring, alpha: 0.2, scale: 1.4, duration: 700, yoyo: !0, repeat: -1 });
    tx = 22;
  }
  const t1 = R.ct(sc, tx, small ? 0 : -9, o.title ?? "", small ? "small" : "big", css, { stroke: "#140a04", strokeThickness: 4 }).setOrigin(0.5);
  parts.push(t1);
  if (o.sub && !small) parts.push(R.ct(sc, tx, 14, o.sub, "tiny", "#e8d8b8", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5));
  C.add(parts);
  C.setScale(0.05, 1).setAlpha(0);
  R.j.play(o.sound ?? (small ? "buff" : "levelup"));
  // 반짝이는 가루
  const sp = !small && sc.time.addEvent({ delay: 90, repeat: 20, callback: () => sc.fx?.burst?.("glow", W / 2 + (Math.random() - 0.5) * pw, y + (Math.random() - 0.5) * ph, 1, col) });
  void sp;
  sc.tweens.add({
    targets: C,
    scaleX: 1,
    alpha: 1,
    duration: 260,
    ease: "Back.easeOut",
    onComplete: () =>
      sc.tweens.add({
        targets: C,
        alpha: 0,
        y: y - 10,
        delay: small ? 1300 : 2600,
        duration: 320,
        onComplete: () => (C.destroy(), nextNotice(sc)),
      }),
  });
}

// ── 처치 시 ─────────────────────────────────────────
// 운명 보드 명성: 낀 장비 계열마다 (무기 100% · 방어구 50% · 기술·마법 40%). 강한 적·높은 티어 지역일수록 많이
export function fameOnKill(sc, T, mult = 1) {
  const fr = sc.fr;
  if (!fr || !R.it?.data) return;
  IT.bindDestiny(R.it.data);
  const def = T.def ?? {};
  const lvl = sc.currentRegion?.()?.idx ?? 0;
  const base = (0.13 * (def.hp ?? 20) + 0.4 * (def.atk ?? 8)) * (1 + 0.6 * Math.min(5, lvl)) * mult;
  const e = fr.equip ?? {};
  const gains = [[e.weapon, 1], [e.armor, 0.5], [e.s1, 0.4], [e.s2, 0.4], [e.magic, 0.4]];
  const h = sc.hud?.();
  for (const [it, k] of gains) {
    const u = it && IT.addFame(it, base * k);
    if (!u || !(u.tierUp || u.lineUp || u.specUp)) continue;
    // 티어 해금 = 큰 알림, 계열 레벨 = 작은 알림 (2026-11-28 · 오른쪽 위 글자 알림 대신)
    if (u.tierUp) bigNotice(h, { title: `T${u.tierUp} 해금`, sub: `운명 보드 · ${u.lineName} ${u.lineUp}레벨 — 이제 T${u.tierUp} 장비를 낄 수 있다`, css: IT.GRADE_CSS[u.tierUp], color: parseInt(String(IT.GRADE_CSS[u.tierUp] ?? "#ffd070").slice(1, 7), 16), icon: itemIcon(sc, it) });
    else if (u.lineUp) bigNotice(h, { small: 1, title: `${u.lineName} ${u.lineUp}레벨`, css: "#ffe6a0", color: 0xffd070 });
    applyLoadout(sc);
  }
}
export function onKill(sc, T) {
  const fr = sc.fr;
  if (!fr) return;
  const p = sc.player;
  const [x, y] = tc(T);
  if (T.statuses.has("erode")) {
    sc.fx.anim("explode", x, y, { scale: 1.4, tint: 0x9050e0, blend: !0 });
    for (const t of targetsIn(sc, x, y, T._frPitch ? 70 : 46)) t !== T && sc.hitTarget(t, params(sc, null, p.stats.atk * p.atkMult() * 1.2, { el: null, element: "dark", source: "aoe", noReact: !0 }));
  }
  SP.killHook(sc, T);
  LOOK.onKill(sc, T);
  const fx = fr.afx ?? {};
  fx.killGuard && p.buff("dmgReduce", 2, fx.killGuard, "shield", "뼈 갑옷");
  fx.killHeal && p.heal(fx.killHeal, !1);
  fx.killIframe && (p.iframes = Math.max(p.iframes, 1));
  const wm = fr.wmods ?? {};
  wm.spiritOnKill && Math.random() < wm.spiritOnKill && spirit(sc, x, y, fr.equip.weapon?.el);
  // 드롭
  const def = T.def ?? {};
  if (T.opts?.summoned) return;
  fameOnKill(sc, T, T.opts?.midBoss ? 6 : T.isElite ? (T.rare ? 8 : 3) : 1);
  const luck = 1 + (wm.luck ?? 0);
  if (T.opts?.midBoss) {
    // 중간 보스: 아이템 잔뜩 + 융합석
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) sc.time.delayedCall(i * 120, () => dropItem(sc, x, y - 6, randomItem(sc)));
    sc.time.delayedCall(n * 120, () => gainStoneDrop(sc, x, y));
    dropMat(sc, x, y - 6, 3 + Math.floor(Math.random() * 3));
    sc.dropGold?.(x, y - 10, 220);
    sc.hud?.()?.toast("중간 보스 처치! 보물이 쏟아진다", "#ffd84a");
    sc.cameras.main.flash(300, 255, 220, 160);
    return;
  }
  if (T.isElite) {
    dropMat(sc, x, y - 6, 1 + Math.floor(Math.random() * 2));
    Math.random() < (T.rare ? 0.8 : 0.5) * luck && gainStoneDrop(sc, x, y);
    Math.random() < (T.rare ? 0.9 : 0.5) * luck && dropItem(sc, x, y, randomItem(sc, def.frDrop, T.rare ? 1 : 0));
    return;
  }
  const txt = def.frDrop ?? "";
  const m = txt.match(/(무기|스킬|마법|방어구|각인)[^(]*\((\d+)%\)/);
  // 하드 밸런스: 일반 몬스터 드롭율 1/4
  Math.random() < 0.12 * luck && dropMat(sc, x, y - 6, 1);
  if (m && Math.random() < (Number(m[2]) / 100) * 0.25 * luck) dropItem(sc, x, y, randomItem(sc, m[1]));
  else if (Math.random() < 0.005 * luck) dropItem(sc, x, y, randomItem(sc));
}
// 보물 상자: 등급별 아이템 (하드: 0: 25% 1개, 1: 60% 1개, 2: 1개 + 60% 융합석)
// ── 보물 상자 ────────────────────────────────────────
// 등급별 보상: 아이템(확률 목록) · 한 등급 위 아이템이 나올 확률 · 융합석(정수 + 남은 확률) · 재료 [최소, 최대] · 골드
const CHEST_LOOT = [
  { items: [0.8], up: 0, stones: 0.2, mats: [1, 2], gold: 90 },
  { items: [1, 0.55], up: 0.2, stones: 0.6, mats: [2, 4], gold: 220 },
  { items: [1, 1, 0.5], up: 0.5, stones: 1.5, mats: [4, 6], gold: 480 },
  { items: [1, 1, 1, 0.6], up: 1, stones: 2.6, mats: [7, 10], gold: 1000 },
];
export function chestLoot(sc, x, y, tier) {
  if (!sc.fr) return;
  const L = CHEST_LOOT[Math.max(0, Math.min(3, tier))];
  const jobs = [];
  L.items.forEach((p, i) => {
    if (Math.random() >= p) return;
    // 전설 상자 첫 아이템은 반드시 한 등급 위 (25%는 두 등급 위)
    const up = tier === 3 && i === 0 ? (Math.random() < 0.25 ? 2 : 1) : Math.random() < L.up ? 1 : 0;
    jobs.push(() => dropItem(sc, x, y, randomItem(sc, void 0, up)));
  });
  const st = Math.floor(L.stones) + (Math.random() < L.stones % 1 ? 1 : 0);
  for (let i = 0; i < st; i++) jobs.push(() => gainStoneDrop(sc, x, y));
  const mn = L.mats[0] + Math.floor(Math.random() * (L.mats[1] - L.mats[0] + 1));
  jobs.push(() => dropMat(sc, x, y, mn));
  // 하나씩 튀어나온다
  jobs.forEach((f, i) => sc.time.delayedCall(i * 120, () => sc.fr && f()));
}
// 상자 물체 (엔진 이벤트 관리자 evm이 가까우면 prompt를 띄우고 E로 interact)
//   o.camp: 지키는 무리 — 그 무리가 살아 있는 동안 사슬로 잠겨 있다
export function chestObj(sc, evm, st, x, y, tier, after, o = {}) {
  tier = Math.max(0, Math.min(3, tier | 0));
  const col = CHS.TIER_COLOR[tier], name = CHS.TIER_NAME[tier];
  const ADD = R.zt.BlendModes.ADD;
  const glow = sc.add.image(x, y - 12, "vx_glow").setTint(col).setBlendMode(ADD).setDepth(5).setAlpha(0).setScale(0.7 + tier * 0.18);
  const spr = sc.add.sprite(x, y + 1, `fr_chest${tier}`, st.opened ? 3 : 0).setOrigin(0.5, 1).setDepth(6);
  const v = { chunk: null, x, y, sprites: [spr, glow], alive: !0 };
  const guards = () => (o.camp ? (sc.enemies ?? []).filter((e) => !e.dead && !e.removed && e.opts?.camp === o.camp && Math.hypot(e.cx - x, e.body.y - y) < 420).length : 0);
  let sealed = !st.opened && guards() > 0, chk = 0, fxT = 0, t = 0, openT = -1;
  const setPrompt = () => (v.prompt = st.opened ? void 0 : sealed ? `잠김 · ${name} (지키는 적을 쓰러뜨리면 열린다)` : `열기 · ${name}`);
  !st.opened && spr.setFrame(sealed ? 4 : 0);
  setPrompt();
  v.update = (dt) => {
    t += dt;
    if (openT >= 0) {
      openT += dt;
      spr.setFrame(openT < 0.12 ? 1 : openT < 2.4 ? 2 : 3);
      glow.setAlpha(Math.max(0, 0.9 - openT * 0.35));
      return;
    }
    if (st.opened) return;
    // 잠김 → 풀림
    if ((chk -= dt) <= 0) {
      chk = 0.25;
      const s2 = guards() > 0;
      if (sealed && !s2) {
        sc.fx.burst("chunk", x, y - 12, 10, 0x9a9aa4);
        sc.fx.burst("glow", x, y - 12, 14, col);
        sc.fx.text(x, y - 34, "봉인이 풀렸다", CHS.TIER_CSS[tier]);
        R.j.play("open");
      }
      sealed !== s2 && ((sealed = s2), spr.setFrame(sealed ? 4 : 0), setPrompt());
    }
    // 반짝임: 등급이 높을수록 자주·밝게. 잠긴 동안은 붉게
    glow.setAlpha(sealed ? 0.18 + 0.08 * Math.sin(t * 3) : (0.12 + tier * 0.1) * (0.75 + 0.25 * Math.sin(t * 2.4)));
    sealed && glow.setTint(0xff4040);
    !sealed && glow.setTint(col);
    if ((fxT -= dt) <= 0 && !sealed) {
      fxT = 0.5 / (1 + tier);
      sc.fx.burst("glow", x + (Math.random() - 0.5) * 22, y - 6 - Math.random() * 14, 1, col);
      tier === 3 && sc.fx.burst("rise", x + (Math.random() - 0.5) * 18, y - 4, 1, 0x7af0ff);
    }
  };
  v.interact = () => {
    if (st.opened) return;
    sealed && guards() === 0 && ((sealed = !1), spr.setFrame(0));
    if (sealed) {
      sc.fx.text(x, y - 34, "지키는 적이 남아 있다", "#ff8a8a");
      R.j.play("warn", 0.5);
      return;
    }
    st.opened = !0;
    v.prompt = void 0;
    openT = 0;
    R.j.play("chest");
    tier >= 2 && R.j.play("magic", 0.6);
    sc.fx.burst("glow", x, y - 12, 18 + tier * 10, col);
    tier >= 1 && sc.fx.text(x, y - 36, name, CHS.TIER_CSS[tier]);
    tier >= 2 && sc.fx.shake?.(tier === 3 ? 3 : 1.5);
    // 빛기둥
    const beam = sc.add.image(x, y - 6, "fr_beam").setOrigin(0.5, 1).setTint(col).setDepth(23).setBlendMode(ADD).setAlpha(0.9).setScale(0.6 + tier * 0.35, 0.3);
    sc.tweens.add({ targets: beam, scaleY: 1.4 + tier * 0.5, alpha: 0, duration: 900 + tier * 250, ease: "Cubic.easeOut", onComplete: () => beam.destroy() });
    sc.time.delayedCall(180, () => {
      if (!sc.fr && !sc.dropGold) return;
      sc.dropGold(x, y - 14, CHEST_LOOT[tier].gold);
      chestLoot(sc, x, y - 14, tier);
      (tier === 3 || (tier === 2 && Math.random() < 0.35)) && sc.queueRelic(0.6);
      tier >= 1 && Math.random() < 0.5 && evm.randomBlessing(x, y - 30, !0);
      after?.();
    });
  };
  return v;
}
const KO2K = { 무기: "weapon", 스킬: "skill", 마법: "magic", 방어구: "armor", 각인: "rune" };
export function randomItem(sc, hint, up = 0) {
  const reg = sc.currentRegion?.()?.idx ?? 0;
  let kinds = null;
  if (hint) for (const [ko, k] of Object.entries(KO2K)) hint.includes(ko) && (kinds = [...(kinds ?? []), k]);
  const pool = IT.dropPool(Math.min(11, reg), kinds);
  const w = { weapon: 2, skill: 3, magic: 3, armor: 1.6, rune: 2.4 };
  let tot = pool.reduce((s, x) => s + w[x.kind], 0);
  let r = Math.random() * tot;
  const g = Math.min(IT.GRADE_MAX, IT.dropGrade(reg) + up);
  for (const x of pool) if ((r -= w[x.kind]) <= 0) return IT.makeBase(x.id, g);
  return IT.makeBase(pool[0]?.id ?? "G01", g);
}

// ── 줍기 ─────────────────────────────────────────────
function dropItem(sc, x, y, item, stone = !1) {
  if (!item && !stone) return;
  const col = stone ? 0xff8a3a : item.relic ? 0xd070ff : item.el ? elColor(item.el) : 0xffffff;
  const key = stone ? "fr_stone" : itemIcon(sc, item);
  const s = sc.add.image(x, y, key).setDepth(24).setScale(stone ? 1 : 0.8);
  const b = sc.add.image(x, y, "fr_beam").setOrigin(0.5, 1).setTint(col).setDepth(23).setBlendMode(R.zt.BlendModes.ADD).setAlpha(0.8);
  sc.fr.pickups.push({ s, b, x, y, vy: -220, vx: rnd(-60, 60), item, stone, t: 0, ground: !1 });
  sc.fx.burst("glow", x, y, 10, col);
}
function gainStoneDrop(sc, x, y) {
  dropItem(sc, x, y, null, !0);
}
// 지역 재료: 가방 칸을 쓰지 않는다. 쓰러지면 잃는다
function dropMat(sc, x, y, n = 1) {
  // 재료는 뺐다 (상점은 골드만)
  return;
  if (!sc.fr || n <= 0) return;
  for (let i = 0; i < n; i++) {
    // 재료 티어도 지역 티어를 따라 굴린다 (T2 숯 · T3 철광석 · T4 결정 · T5 수정 · T6 별쇠)
    const m = IT.matOfGrade(Math.max(2, IT.dropGrade(sc.currentRegion?.()?.idx ?? 0))) ?? IT.MATS.ember;
    const s = sc.add.image(x, y, `fr_mat_${m.id}`).setDepth(24);
    const b = sc.add.image(x, y, "fr_beam").setOrigin(0.5, 1).setTint(m.color).setDepth(23).setBlendMode(R.zt.BlendModes.ADD).setAlpha(0.6).setScale(0.7, 0.6);
    sc.fr.pickups.push({ s, b, x, y, vy: -200 - Math.random() * 90, vx: rnd(-80, 80), mat: m.id, t: 0, ground: !1 });
  }
}
function gainMat(sc, id) {
  const fr = sc.fr, m = IT.MATS[id];
  fr.mats = fr.mats ?? {};
  fr.mats[id] = (fr.mats[id] ?? 0) + 1;
  sc.fx.text(sc.player.cx, sc.player.body.y - 30, `${m.name} +1`, m.css);
  R.j.play("coin");
}
function updatePickups(sc, dt) {
  const fr = sc.fr;
  const p = sc.player;
  for (let i = fr.pickups.length - 1; i >= 0; i--) {
    const k = fr.pickups[i];
    k.t += dt;
    if (!k.ground) {
      k.vy = Math.min(500, k.vy + 900 * dt);
      k.x += k.vx * dt;
      const ny = k.y + k.vy * dt;
      if (k.vy > 0 && sc.collider.solidAtPx(k.x, ny + 6)) {
        // 실제 지면(1px 단위)에 내려앉는다
        let gy = Math.floor(ny + 6);
        while (gy > ny - 10 && sc.collider.solidAtPx(k.x, gy - 1)) gy--;
        k.ground = !0;
        k.y = gy - 8;
      } else k.y = ny;
      k.y > 900 && (k.y = p.body.y - 20, k.x = p.cx);
    }
    const bob = k.ground ? Math.sin(k.t * 3) * 2 : 0;
    k.s.setPosition(k.x, k.y + bob);
    k.b.setPosition(k.x, k.y + 8).setAlpha(0.5 + Math.sin(k.t * 4) * 0.25);
    const d = dist2(k.x, k.y, p.cx, p.cy);
    // 가방이 가득 차면 줍지 않고 바닥에 둔다
    if (!k.stone && !k.mat && fr.bag.length >= fr.bagMax && !autoSlot(fr, k.item)) {
      if (d < 20 && (fr.fullWarn ?? 0) < Date.now()) {
        fr.fullWarn = Date.now() + 2500;
        sc.fx.text(p.cx, p.body.y - 36, "가방이 가득 찼습니다", "#ffb0a0");
      }
      continue;
    }
    if (k.t > 0.4 && d < 60) ((k.x += (p.cx - k.x) * Math.min(1, dt * 10)), (k.y += (p.cy - k.y) * Math.min(1, dt * 10)));
    if (k.t > 0.4 && d < 14 && !p.dead) {
      k.s.destroy();
      k.b.destroy();
      fr.pickups.splice(i, 1);
      k.stone ? gainStone(sc, 1) : k.mat ? gainMat(sc, k.mat) : gain(sc, k.item);
    }
  }
}
// 가방이 가득 차서 발밑에 남아 있던 아이템: 가방에 자리가 나면 바로 넣는다 (가방 창을 다시 열 필요 없이)
function pullWaiting(sc) {
  const fr = sc.fr, p = sc.player;
  if (!fr?.pickups || !p) return;
  for (let i = fr.pickups.length - 1; i >= 0 && fr.bag.length < fr.bagMax; i--) {
    const k = fr.pickups[i];
    if (k.stone || !k.item || dist2(k.x, k.y, p.cx, p.cy) > 70) continue;
    k.s.destroy();
    k.b.destroy();
    fr.pickups.splice(i, 1);
    gain(sc, k.item);
  }
}
export function gainStone(sc, n = 1) {
  sc.fr.stones += n;
  const h = sc.hud?.();
  h?.toast(`융합석 +${n}`, "#ffb060");
  R.j.play("coinBig");
}
export function gain(sc, item) {
  const fr = sc.fr;
  const h = sc.hud?.();
  fr.found++;
  noteFound(fr, item);
  // 비어 있는 장비 칸이면 바로 장착
  const slot = IT.canEquip(item) ? autoSlot(fr, item) : null;
  if (slot) {
    fr.equip[slot] = item;
    applyLoadout(sc);
    h?.toast(`장착 ${item.name}`, rarCss(item));
    R.j.play("buff");
    return;
  }
  if (fr.bag.length < fr.bagMax) {
    fr.bag.push(item);
    h?.toast(`+ ${item.name}`, rarCss(item));
    R.j.play("buy");
  } else {
    // 가방이 가득 참: 팔지 않고 바닥에 떨어뜨린다
    fr.found--;
    const p = sc.player;
    dropItem(sc, p.cx + p.facing * 18, p.body.y - 20, item);
    h?.toast("가방이 가득 찼다 (바닥에 둠)", "#ffb0a0");
  }
}
const rarCss = (it) => IT.RARITY_CSS[IT.RARITY_OF(it)];
function autoSlot(fr, it) {
  if (it.kind === "skill") return !fr.equip.s1 ? "s1" : !fr.equip.s2 ? "s2" : !fr.equip.magic ? "magic" : null;
  if (it.kind === "magic") return !fr.equip.magic ? "magic" : !fr.equip.s2 ? "s2" : !fr.equip.s1 ? "s1" : null;
  return null;
}

// ── 레벨업·유물·상점 카드 ───────────────────────────
let OFF = 0;
function offerDef(sc, item, stone) {
  const id = `fro_${OFF++}`;
  const kind = stone ? "stone" : item.kind;
  const icon = { weapon: "frw", skill: "frs", magic: "frm", armor: "fra", rune: "frg", stone: "frstone" }[kind];
  R.Ee[id] = {
    id,
    iconKey: stone ? null : itemIcon(sc, item),
    name: stone ? "융합석" : item.name,
    rarity: stone ? "rare" : IT.RARITY_OF(item),
    icon,
    color: stone ? 0xff8a3a : item.el ? elColor(item.el) : item.relic ? 0xd070ff : 0xf0e0c0,
    tag: stone ? "재료" : `${IT.KIND_KO[item.kind]}${item.el ? " · " + IT.elName(item.el) : ""}`,
    relic: !1,
    max: 1,
    desc: () => (stone ? "필드에서 1차·2차 융합을 할 수 있다" : IT.describe(item)),
    apply: () => (stone ? gainStone(sc, 1) : gain(sc, item)),
  };
  return { def: R.Ee[id], stack: 1 };
}
export function hookBuild(sc) {
  const b = sc.build;
  b.offerLevel = () => {
    const out = [];
    const seen = new Set();
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.12) {
        out.push(offerDef(sc, null, !0));
        continue;
      }
      let it;
      for (let k = 0; k < 8 && (!it || seen.has(it.id)); k++) it = randomItem(sc);
      seen.add(it.id);
      out.push(offerDef(sc, it));
    }
    return out;
  };
  b.offerRelics = () => {
    const out = [];
    const rid = sc.fr.relicIds.shift();
    rid && out.push(offerDef(sc, IT.makeBase(rid)));
    while (out.length < 3) out.push(Math.random() < 0.3 ? offerDef(sc, null, !0) : offerDef(sc, randomItem(sc)));
    return out;
  };
  b.offerShop = () => [offerDef(sc, randomItem(sc)), offerDef(sc, randomItem(sc)), offerDef(sc, null, !0)];
}
export function onBossKilled(sc, T) {
  try { fameOnKill(sc, { def: { hp: (T.def?.hp ?? 600) / 4, atk: T.def?.atk ?? 20 } }, 10); } catch (e) {}
  const fr = sc.fr;
  if (!fr) return;
  T.def?.relic && fr.relicIds.push(T.def.relic);
  fr.stones += 1;
  const [bx, by] = T?.body ? tc(T) : [sc.player.cx, sc.player.cy];
  dropMat(sc, bx, by - 6, 6 + Math.floor(Math.random() * 4));
  fr.restPending = 1;
}

// ── 귀환 표석: 5초 동안 곁에 머물러야 한다. 맞거나 멀어지면 끊긴다 ─────
const WAY_T = 5;
export function waystone(evm, chunk, x, y) {
  const sc = evm.s;
  const ADD = R.zt.BlendModes.ADD;
  const spr = sc.add.image(x, y + 1, "fr_waystone").setOrigin(0.5, 1).setDepth(5);
  const glow = sc.add.image(x, y - 18, "vx_glow").setTint(0x80f0ff).setBlendMode(ADD).setAlpha(0.3).setScale(1.3).setDepth(4);
  const gfx = sc.add.graphics().setDepth(40);
  const PROMPT = "귀환 (5초 집중)";
  const o = { chunk, x, y, sprites: [spr, glow, gfx], alive: !0, prompt: PROMPT };
  let ch = null, t = 0, fxT = 0;
  const stop = (msg) => {
    ch = null;
    gfx.clear();
    o.prompt = PROMPT;
    msg && sc.fx.text(sc.player.cx, sc.player.body.y - 40, msg, "#ff9a8a");
    msg && R.j.play("error");
  };
  o.update = (dt) => {
    t += dt;
    glow.setAlpha((ch ? 0.6 : 0.25) + Math.sin(t * 3) * 0.1);
    if (!ch) return;
    const p = sc.player;
    if (p.dead || sc.dying) return stop();
    if (Math.abs(p.cx - x) > 48 || Math.abs(p.body.y - y) > 40) return stop("귀환이 끊겼다 · 표석에서 멀어짐");
    if (p.hp < ch.hp) return stop("귀환이 끊겼다 · 공격받음");
    ch.hp = p.hp;
    ch.t += dt;
    const f = Math.min(1, ch.t / WAY_T);
    const hx = p.cx, hy = p.body.y - 50;
    gfx.clear();
    gfx.lineStyle(4, 0x0a1418, 0.7).beginPath().arc(hx, hy, 10, 0, Math.PI * 2).strokePath();
    gfx.lineStyle(3, 0x80f0ff, 1).beginPath().arc(hx, hy, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f).strokePath();
    gfx.lineStyle(1, 0x80f0ff, 0.25 + 0.5 * f).lineBetween(x, y - 18, hx, p.body.y - 14);
    fxT -= dt;
    fxT <= 0 && ((fxT = 0.12), sc.fx.burst("glow", p.cx + rnd(-10, 10), p.body.y - rnd(0, 26), 1, 0x80f0ff));
    if (ch.t >= WAY_T) {
      ch = null;
      gfx.clear();
      o.prompt = void 0;
      sc.fx.burst("rise", p.cx, p.cy, 40, 0x80f0ff);
      sc.cameras.main.flash(300, 160, 240, 255);
      R.j.play("portal");
      sc.extract?.();
    }
  };
  o.interact = () => {
    if (ch || sc.dying || sc.player.dead) return;
    ch = { t: 0, hp: sc.player.hp };
    o.prompt = "집중 중… 맞거나 멀어지면 끊긴다";
    sc.hud?.()?.toast("귀환 집중 시작 · 5초 버텨라", "#80f0ff");
    R.j.play("magic");
  };
  return o;
}

// ── B 귀환 (2026-11-28, 알비온식) ─────────────────────
//   B를 누르면 5초 집중 → 거점으로. 움직이거나 맞으면 끊긴다. 전투 중(가까운 적이 나를 노림·4초 안에 맞음)에는 못 쓴다
//   비용 = (기본 + 가방 아이템 수 × 아이템당) × 늘림^(거점까지 지역 수 − 1) — 재료는 10개를 아이템 1개로 센다
//   탐험 골드에서 먼저, 모자라면 모아 둔 골드에서 낸다
const RECALL_T = 5, RECALL_BASE = 80, RECALL_PER_ITEM = 15, RECALL_GROW = 1.5;
const HOPS = new Map();
// 거점에서 몇 구역 떨어졌나 (출구로 이어진 길 기준, 숨은 던전은 바깥 구역 +1)
export function hubHops(z) {
  if (!z) return 1;
  if (z.kind === "dungeon") return hubHops(ZN.zoneOfPocket(z)) + 1;
  if (HOPS.has(z.id)) return HOPS.get(z.id);
  const dist = new Map([[ZN.HUB_ID, 0]]), q = [ZN.HUB_ID];
  const nb = (id) => (id === ZN.HUB_ID ? Object.values(ZN.BY_ID).filter((t) => t.kind === "zone" && ZN.exitList(t).some((e) => e.to === ZN.HUB_ID)).map((t) => t.id) : ZN.exitList(ZN.BY_ID[id]).map((e) => e.to));
  while (q.length) {
    const a = q.shift();
    for (const b of nb(a)) if (!dist.has(b) && (b === ZN.HUB_ID || ZN.BY_ID[b])) (dist.set(b, dist.get(a) + 1), q.push(b));
  }
  for (const [id, d] of dist) id !== ZN.HUB_ID && HOPS.set(id, d);
  return HOPS.get(z.id) ?? 3;
}
export function recallItems(fr) {
  const mats = Object.values(fr?.mats ?? {}).reduce((a, b) => a + b, 0);
  return (fr?.bag?.length ?? 0) + Math.floor(mats / 10);
}
export function recallCost(sc) {
  const hops = hubHops(zoneOfPlayer(sc));
  return Math.round(((RECALL_BASE + recallItems(sc.fr) * RECALL_PER_ITEM) * Math.pow(RECALL_GROW, Math.max(0, hops - 1))) / 10) * 10;
}
const goldHave = (sc) => Math.floor((sc.run?.gold ?? 0) + (sc.run?.milestoneGold ?? 0)) + Math.floor(R.it.data.gold ?? 0);
function payGold(sc, n) {
  const run = sc.run, a = Math.min(n, Math.max(0, Math.floor(run.gold)));
  run.gold -= a;
  n -= a;
  n > 0 && (R.it.data.gold = Math.max(0, (R.it.data.gold ?? 0) - n));
  R.it.write();
}
const recallSay = (sc, msg, col = "#ff9a8a") => {
  const p = sc.player;
  sc.fx.text(p.cx, p.body.y - 44, msg, col);
};
function inCombat(sc) {
  const p = sc.player;
  if (sc.time.now - (sc.frLastHurt ?? -1e9) < 4000) return !0;
  return (sc.enemies ?? []).some((e) => !e.dead && e.aggro && Math.abs(e.cx - p.cx) < 360 && Math.abs(e.body.y - p.body.y) < 200);
}
export function toggleRecall(sc) {
  if (!sc?.fr || !sc.player || sc.dying || sc.player.dead || sc.frLoad || sc.zoneBusy) return;
  if (sc.frRecall) return void stopRecall(sc, "귀환을 멈췄다", "#c8c8d0");
  if (sc.hud?.()?.modalOpen) return;
  if (inCombat(sc)) return void (recallSay(sc, "전투 중에는 귀환할 수 없다"), R.j.play("error"));
  const cost = recallCost(sc);
  if (goldHave(sc) < cost) return void (recallSay(sc, `골드 부족 · 귀환 ${cost.toLocaleString()}G`), R.j.play("error"));
  const p = sc.player;
  sc.frRecall = { t: 0, hp: p.hp, x: p.cx, y: p.body.y, cost, fxT: 0, g: sc.add.graphics().setDepth(40), txt: R.ct(sc, p.cx, p.body.y - 64, "", "tiny", "#bff4ff", { stroke: "#0a1418", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(41) };
  R.j.play("magic");
}
function stopRecall(sc, msg, col) {
  const C = sc.frRecall;
  if (!C) return;
  C.g.destroy();
  C.txt.destroy();
  sc.frRecall = null;
  msg && (recallSay(sc, msg, col), R.j.play("error"));
}
export function recallTick(sc, dt) {
  const C = sc.frRecall;
  if (!C) return;
  const p = sc.player;
  if (!p || p.dead || sc.dying || sc.frLoad) return stopRecall(sc);
  if (Math.abs(p.cx - C.x) > 6 || Math.abs(p.body.y - C.y) > 10) return stopRecall(sc, "귀환이 끊겼다 · 움직임");
  if (p.hp < C.hp) return stopRecall(sc, "귀환이 끊겼다 · 공격받음");
  C.hp = p.hp;
  C.t += dt;
  const f = Math.min(1, C.t / RECALL_T), hx = p.cx, hy = p.body.y - 50;
  // 집중 막대 + 남은 시간·비용
  const g = C.g.clear(), W = 44;
  g.fillStyle(0x0a1418, 0.85).fillRect(hx - W / 2 - 1, hy - 1, W + 2, 6);
  g.fillStyle(0x80f0ff, 1).fillRect(hx - W / 2, hy, W * f, 4);
  g.fillStyle(0xffffff, 0.35).fillRect(hx - W / 2, hy, W * f, 1);
  // 발밑 빛 고리 + 몸을 감싸는 빛 기둥
  g.lineStyle(1, 0x80f0ff, 0.35 + 0.4 * f).strokeEllipse(hx, p.body.y, 26 + 10 * f, 6 + 2 * f);
  g.fillStyle(0x80f0ff, 0.06 + 0.12 * f).fillRect(hx - 9, p.body.y - 40 - 60 * f, 18, 40 + 60 * f);
  const s = `귀환 ${(RECALL_T - C.t).toFixed(1)}초 · ${C.cost.toLocaleString()}G`;
  C.txt.text !== s && C.txt.setText(s);
  C.txt.setPosition(hx, hy - 3);
  C.fxT -= dt;
  C.fxT <= 0 && ((C.fxT = 0.08), sc.fx.burst("rise", hx + rnd(-10, 10), p.body.y - rnd(0, 8), 1, 0x80f0ff));
  if (C.t < RECALL_T) return;
  if (goldHave(sc) < C.cost) return stopRecall(sc, "골드 부족");
  payGold(sc, C.cost);
  stopRecall(sc);
  sc.fx.burst("rise", p.cx, p.cy, 40, 0x80f0ff);
  sc.cameras.main.flash(300, 160, 240, 255);
  R.j.play("portal");
  sc.extract?.();
}

// ── 물속 산소 (2026-11-28) ─────────────────────────────
//   머리가 물에 잠기면 산소가 OXY_T초 동안 줄어든다 (머리 위 거품 10개). 다 떨어지면 0.5초마다 최대 체력 5%씩 잃고 화면 가장자리가 어두워진다.
//   물 밖에서는 초당 30%씩 다시 찬다. 장비 효과 afx.oxy(초)로 늘릴 수 있다
const OXY_T = 10, OXY_REFILL = 0.3, DROWN_TICK = 0.5, DROWN_PCT = 0.05;
export function oxygenTick(sc, dt) {
  const fr = sc.fr, p = sc.player;
  if (!fr || !p || p.dead) return;
  fr.oxy ??= 1;
  const under = !!p.body.headWater, max = OXY_T + (fr.afx?.oxy ?? 0);
  if (under) fr.oxy = Math.max(0, fr.oxy - dt / max);
  else fr.oxy = Math.min(1, fr.oxy + dt * OXY_REFILL);
  // 입에서 거품
  under && (fr.oxyFx = (fr.oxyFx ?? 0) - dt) <= 0 && ((fr.oxyFx = fr.oxy > 0 ? 0.45 : 0.15), sc.fx.burst("rise", p.cx + p.facing * 4, p.body.y - 20, fr.oxy > 0 ? 1 : 3, 0xcfeeff));
  // 숨이 막힘
  if (under && fr.oxy <= 0) {
    if ((fr.drownT = (fr.drownT ?? 0) + dt) >= DROWN_TICK) {
      fr.drownT = 0;
      const d = Math.max(1, Math.round(p.maxHp * DROWN_PCT));
      p.hp -= d;
      sc.fx.number(p.cx, p.body.y - 30, `-${d}`, "#7fc8ff", !1);
      R.j.play("playerHurt", 0.6);
      sc.fx.shake(1.5);
      p.hp <= 0 && ((p.hp = 0), (sc.frDeathCause = { name: "익사", el: "water" }), p.die());
    }
  } else fr.drownT = 0;
  // 머리 위 거품 막대
  const g = (sc.frOxyG ??= sc.add.graphics().setDepth(40));
  g.clear();
  if (fr.oxy < 1) {
    const n = 10, left = fr.oxy * n, x0 = p.cx - (n * 6) / 2 + 3, y = p.body.y - p.body.h - 14;
    for (let i = 0; i < n; i++) {
      const f = Math.max(0, Math.min(1, left - i)), x = x0 + i * 6;
      g.lineStyle(1, 0x0a1a2a, 0.8).strokeCircle(x, y, 2.6);
      f > 0 && (g.fillStyle(0xbfe8ff, 0.95).fillCircle(x, y, 2.3 * Math.max(0.35, f)), g.fillStyle(0xffffff, 0.9).fillRect(x - 1, y - 2, 1, 1));
    }
  }
  // 숨 막힘: 화면 가장자리 어둡게 (HUD)
  const h = sc.hud?.();
  if (h) {
    const v = (h.frDrownV ??= h.add.graphics().setDepth(-3).setScrollFactor(0));
    const a = under && fr.oxy <= 0 ? 0.55 + 0.15 * Math.sin(sc.time.now / 160) : fr.oxy < 0.3 && under ? (0.3 - fr.oxy) * 1.2 : 0;
    if (a !== h.frDrownA) {
      h.frDrownA = a;
      v.clear();
      if (a > 0) {
        const W = R.ot, Hh = R.xt;
        for (let i = 0; i < 12; i++) {
          const t = a * (1 - i / 12) * 0.5;
          v.fillStyle(0x020a16, t).fillRect(0, i * 4, W, 4).fillRect(0, Hh - (i + 1) * 4, W, 4).fillRect(i * 5, 0, 5, Hh).fillRect(W - (i + 1) * 5, 0, 5, Hh);
        }
      }
    }
  }
}

// ── 휴식처 (보스 처치 후) ───────────────────────────
export function maybeRest(sc) {
  const fr = sc.fr;
  if (!fr || !fr.restPending || sc.relicQueue > 0 || sc.build.pending > 0 || sc.levelDelay > 0) return !1;
  const h = sc.hud();
  if (!h || h.modalOpen) return !1;
  fr.restPending = 0;
  openRest(sc);
  return !0;
}
function openRest(sc) {
  const h = sc.hud();
  const p = sc.player;
  const fr = sc.fr;
  const reg = sc.currentRegion();
  h.choice(`휴식처 · ${reg.name}`, `화로가 타오른다. 융합석 ${fr.stones} · 가방 ${fr.bag.length}/${fr.bagMax}`, [
    { label: "융합로", desc: "융합석 없이 융합 · 전설 융합 가능", icon: "fr_stone", cb: () => openBag(sc, { free: !0, legend: !0, onClose: () => openRest(sc) }) },
    { label: "상점", desc: "아이템·융합석·회복약", icon: "icon_gold", cb: () => (sc.openShop((fr.restShop = fr.restShop ?? {})), sc.time.delayedCall(30, () => waitClose(sc, () => openRest(sc)))) },
    {
      label: "회복의 샘",
      desc: fr.springUsed ? "이미 사용했다" : "체력을 모두 회복하고 상태 이상을 씻어낸다",
      icon: "icon_heart",
      enabled: !fr.springUsed,
      cb: () => {
        fr.springUsed = !0;
        p.heal(p.maxHp);
        p.statuses.clear();
        fr.mana = fr.maxMana;
        sc.fx.burst("rise", p.cx, p.cy, 30, 0x80f0ff);
        R.j.play("heal");
        sc.time.delayedCall(30, () => openRest(sc));
      },
    },
    { label: "거점으로 귀환", desc: "지금까지 얻은 것을 모두 가지고 돌아간다", icon: "icon_check", cb: () => sc.extract?.() },
    { label: "출발", desc: "다음 지역으로 · 더 깊이, 더 위험하게", cb: () => ((fr.restShop = null), (fr.springUsed = !1)) },
  ]);
}
function waitClose(sc, cb) {
  const h = sc.hud();
  if (!h) return;
  if (h.modalOpen) {
    sc.time.delayedCall(100, () => waitClose(sc, cb));
    return;
  }
  cb();
}
// 엔진이 장면을 멈춰도 동작하는 대기
const waitHud = (h, cb) => {
  if (h.modalOpen) return void setTimeout(() => waitHud(h, cb), 100);
  cb();
};

// ── HUD ──────────────────────────────────────────────
export function hudCreate(hud) {
  const ct = R.ct;
  hud.frManaBg = hud.add.rectangle(4, 34, 168, 5, 0x141018, 0.85).setOrigin(0).setStrokeStyle(1, 0x2a3060);
  hud.frMana = hud.add.rectangle(5, 35, 0, 3, 0x4a8cff).setOrigin(0);
  hud.frManaText = ct(hud, 176, 31, "", "tiny", "#8ab8ff", { stroke: "#140e18", strokeThickness: 3 });
  hud.frBagText = ct(hud, 8, R.xt - 54, "", "tiny", "#ffd8a0", { stroke: "#140e18", strokeThickness: 3 });
  // 2번 무기 칸 숨김
  const w2 = hud.wSlots[1];
  if (w2) for (const k of ["bg", "cd", "key", "star"]) w2[k]?.setAlpha?.(0);
  const f = hud.sSlots[3];
  if (f) for (const k of ["bg", "icon", "cd", "cdText", "key", "lock"]) f[k]?.setAlpha?.(0);
  const r = hud.sSlots[2];

  hud.frFrames = [0, 1, 2].map((i) => {
    const s = hud.sSlots[i];
    return s ? hud.add.rectangle(s.bg.x, s.bg.y, 23, 23).setStrokeStyle(1, 0xffffff, 0.9).setDepth(4) : null;
  });
  hud.frKindTags = [0, 1, 2].map((i) => {
    const s = hud.sSlots[i];
    return s ? ct(hud, s.bg.x, s.bg.y - 25, "", "tiny", "#ffffff", { stroke: "#140e18", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(5) : null;
  });
  UI.remakeHud(hud, R);
  // 스킬 칸 희귀도 테두리 (2026-11-28)
  hud.frRarImgs = [0, 1, 2].map((i) => {
    const f = hud.frFrames?.[i];
    return f ? hud.add.image(f.x, f.y, "__DEFAULT").setDepth(5).setVisible(!1) : null;
  });
  miniCreate(hud);
  hud.input.keyboard.addCapture("TAB");
  hud.input.keyboard.on("keydown-TAB", () => toggleBag(hud.run));
  // B = 귀환, V = 운명 보드 (2026-11-28)
  hud.input.keyboard.on("keydown-B", () => toggleRecall(hud.run));
  hud.input.keyboard.on("keydown-V", () => toggleDestiny(hud));
  hud.input.keyboard.on("keydown-M", () => toggleMap(hud));
  hud.events.once("shutdown", () => (hud.frMap = null));
}
export function hudUpdate(hud) {
  const sc = hud.run;
  const fr = sc?.fr;
  if (!fr || !hud.frMana) return;
  hud.frMana.width = Math.max(0, (hud.frManaMax ?? 166) * (fr.mana / fr.maxMana));
  UI.updateHud(hud);
  hud.frManaText.setText(`${Math.floor(fr.mana)}`);
  ["s1", "s2", "magic"].forEach((k, i) => {
    const it = fr.equip[k];
    const f = hud.frFrames?.[i], t = hud.frKindTags?.[i];
    // 바뀔 때만 다시 그린다 (setColor는 매번 글자 텍스처를 새로 만들어 렉의 원인이었다)
    const sig = it ? it.kind : "";
    if (f && f._frSig !== sig) (f._frSig = sig), f.setStrokeStyle(1, it ? ICON.KIND_COL[it.kind] : 0x403848, it ? 1 : 0.5);
    // 희귀도 테두리: 아이템이 바뀔 때만 (uid로)
    const ri = hud.frRarImgs?.[i], rs = it ? `${it.uid ?? it.id}|${IT.RARITY_OF(it)}` : "";
    if (ri && ri._frSig !== rs) {
      ri._frSig = rs;
      it ? ri.setTexture(rarityFrame(hud, IT.RARITY_OF(it), 22)).setVisible(!0) : ri.setVisible(!1);
      f?.setStrokeStyle(1, 0, 0);
    }
    if (t && t._frSig !== sig) (t._frSig = sig), t.setText(it ? (it.kind === "magic" ? "마법" : "스킬") : "").setColor(it ? ICON.KIND_CSS[it.kind] : "#ffffff");
  });
  const wtag = fr.equip.weapon?.cat === "WS" ? `  ·  충전 ${fr.charge}` : "";
  const mn = Object.values(fr.mats ?? {}).reduce((a, b) => a + b, 0);
  const sig = `${fr.bag.length}|${fr.stones}|${fr.sp}|${mn}|${wtag}`;
  hud.frBagSig !== sig && ((hud.frBagSig = sig), hud.frBagText.setText(`가방 ${fr.bag.length}/${fr.bagMax} · 융합석 ${fr.stones}${fr.sp ? ` · 스탯 +${fr.sp}` : ""} [Tab]${wtag}`));
  const w2 = hud.wSlots[1];
  w2?.icon?.setVisible(!1);
  const f = hud.sSlots[3];
  if (f) for (const k of ["bg", "icon", "cd", "cdText", "key", "lock"]) f[k]?.setVisible?.(!1);
  miniUpdate(hud);
}

// ── 미니맵 (오른쪽 아래) ─────────────────────────────
// 지금 구역 전체를 실제 지형 장(natgen)에서 줄여 그린다. 구역이 바뀔 때만 다시 만들고, 표시는 1초에 10번 갱신
const MINI_W = 104, MINI_H = 104;
// 확대·축소: 미니맵 한 점 = 격자 몇 칸 (0.5 = 2배 확대 · 1 = 기본 · 2 = 절반 · 4 = 구역 전체)
const MINI_Z = [0.5, 1, 2, 4], MINI_ZK = "fr_minizoom";
function miniCreate(hud) {
  const x = R.ot - MINI_W - 7, y = R.xt - MINI_H - 7;
  let zi = 1;
  try {
    const v = +localStorage.getItem(MINI_ZK);
    v >= 0 && v < MINI_Z.length && localStorage.getItem(MINI_ZK) != null && (zi = v);
  } catch {}
  hud.frMini = { x, y, zid: null, t: 0, blink: 0, zi };
  hud.frMiniFrame = hud.add.nineslice(x - 3, y - 3, "ui_hud_panel", void 0, MINI_W + 6, MINI_H + 6, 6, 6, 6, 6).setOrigin(0).setDepth(-1).setAlpha(0.88);
  hud.frMiniBg = hud.add.rectangle(x, y, MINI_W, MINI_H, 0x0a0812, 0.72).setOrigin(0).setDepth(0);
  hud.frMiniImg = hud.add.image(x, y, "__DEFAULT").setOrigin(0).setDepth(1).setVisible(!1);
  hud.frMiniG = hud.add.graphics().setDepth(2);
  // 확대(+)·축소(−) 단추: 미니맵 왼쪽 위 (마우스 휠, 키보드 +/− 도 된다)
  const btn = (bx, label, d) => {
    const b = R.ct(hud, bx, y + 1, label, "small", "#e8e0f0", { backgroundColor: "#140e18cc", padding: { x: 2, y: 0 } }).setOrigin(0).setDepth(3).setAlpha(0.8);
    b.setInteractive({ useHandCursor: !0 }).on("pointerdown", (p, lx, ly, ev) => (ev?.stopPropagation?.(), miniZoom(hud, d)));
    b.on("pointerover", () => b.setAlpha(1)).on("pointerout", () => b.setAlpha(0.8));
    return b;
  };
  hud.frMiniIn = btn(x + 1, "+", -1);
  hud.frMiniOut = btn(x + 12, "−", 1);
  hud.frMiniTag = R.ct(hud, x + MINI_W - 2, y + MINI_H - 2, "", "tiny", "#ffe08a", { stroke: "#140e18", strokeThickness: 3 }).setOrigin(1).setDepth(3).setAlpha(0);
  const kb = hud.input.keyboard;
  for (const k of ["PLUS", "NUMPAD_ADD"]) kb.on(`keydown-${k}`, () => miniZoom(hud, -1));
  for (const k of ["MINUS", "NUMPAD_SUBTRACT"]) kb.on(`keydown-${k}`, () => miniZoom(hud, 1));
  hud.input.on("wheel", (p, objs, dx, dy) => {
    const M = hud.frMini;
    if (!M || !hud.frMiniBg.visible || hud.frBag || hud.frMap) return;
    p.x >= M.x - 3 && p.x < M.x + MINI_W + 3 && p.y >= M.y - 3 && p.y < M.y + MINI_H + 3 && dy && miniZoom(hud, dy > 0 ? 1 : -1);
  });
  hud.events.once("shutdown", () => (hud.frMini = null));
}
function miniZoom(hud, d) {
  const M = hud.frMini;
  if (!M || hud.frBag || hud.frMap) return;
  const zi = Math.max(0, Math.min(MINI_Z.length - 1, M.zi + d));
  if (zi === M.zi) return;
  M.zi = zi;
  M.cx = -1e9; // 다음 갱신에 다시 그림
  M.t = 0;
  try {
    localStorage.setItem(MINI_ZK, String(zi));
  } catch {}
  const z = MINI_Z[zi], T = hud.frMiniTag;
  T.setText(z === 4 ? "구역 전체" : z < 1 ? `×${1 / z}` : z === 1 ? "×1" : `×1/${z}`).setAlpha(1);
  hud.tweens.killTweensOf(T);
  hud.tweens.add({ targets: T, alpha: 0, delay: 900, duration: 400 });
  R.j.play("click", 0.4);
}
// 미니맵: 구역 전체를 24px 칸 격자로 한 번 만들어 두고(0 하늘 · 1 바위 · 2 굴·방 속 · 3 물), 플레이어 둘레 104칸만 그린다
const MINI_S = 24;
function miniGrid(sc, z) {
  const P = ZG.planOf(z, { seed: sc.world.gen.seed, Ft: R.Ft, up: z.kind === "zone" ? ZN.upChunk(z) : -1, down: z.kind === "zone" ? ZN.downChunk(z) : -1 });
  const S = MINI_S, GW = Math.ceil(P.WP / S), GH = Math.ceil(P.HP / S), g = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < GW; gx++) {
      let n = 0;
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) P.F.solid((gx + ox) * S, (gy + oy) * S) && n++;
      g[gy * GW + gx] = n >= 2 ? 1 : 0;
    }
  const fill = (r, v) => {
    for (let gy = Math.max(0, Math.round(r.y0 / S)); gy < Math.min(GH, Math.round(r.y1 / S)); gy++)
      for (let gx = Math.max(0, Math.round(r.x0 / S)); gx < Math.min(GW, Math.round(r.x1 / S)); gx++) g[gy * GW + gx] === 0 && (g[gy * GW + gx] = v);
  };
  for (const w of P.walls ?? []) fill(w, 2);
  for (const r of P.spec ?? []) r.t === 3 && fill(r, 3);
  const surf = new Float32Array(GW);
  for (let gx = 0; gx < GW; gx++) surf[gx] = P.h ? P.h[Math.min(P.h.length - 1, Math.round(((gx + 0.5) * S) / 4))] : 0;
  return { P, g, GW, GH, surf };
}
function miniDraw(hud, M, cx, cy) {
  const S = MINI_S, { g, GW, GH, surf } = M.grid, z = M.z;
  const k = MINI_Z[M.zi ?? 1], sx = S * k;
  const vw = MINI_W * sx, vh = MINI_H * sx;
  // 구역이 미니맵보다 작으면 가운데에 (축소했을 때)
  const fit = (c, full, v) => (full <= v ? Math.round((full - v) / 2 / sx) * sx : Math.max(0, Math.min(full - v, Math.round((c - v / 2) / sx) * sx)));
  M.ox = fit(cx, GW * S, vw);
  M.oy = fit(cy, GH * S, vh);
  M.sx = M.sy = sx;
  M.cx = cx;
  M.cy = cy;
  const key = "fr_minimap";
  let tex = hud.textures.exists(key) ? hud.textures.get(key) : null;
  if (!tex || tex.width !== MINI_W || tex.height !== MINI_H) (tex && hud.textures.remove(key), (tex = hud.textures.createCanvas(key, MINI_W, MINI_H)));
  const ctx = tex.getContext(), im = ctx.createImageData(MINI_W, MINI_H), d = im.data;
  const pal = z.reg?.pal ?? {};
  const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const shade = (c, f) => rgb(c).map((v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))));
  const base = z.y > 0 ? pal.rock ?? 0x6a6070 : pal.soil ?? 0x8a6a50;
  const B = shade(base, -0.1), Tp = rgb(z.y > 0 ? 0xc8b8a0 : pal.top ?? 0x9ad060), UB = shade(pal.rock ?? base, -0.4), UT = shade(pal.rock ?? base, 0.2);
  const IN = [44, 36, 52], WA = [58, 120, 192], WT = [140, 200, 240];
  // 한 점에 격자 여러 칸이 들어가면(축소) 가장 많은 것으로
  const n = Math.max(1, k), cnt = new Uint8Array(4);
  const cellAt = (gx, gy) => {
    if (n === 1) return gx < 0 || gy < 0 || gx >= GW || gy >= GH ? -1 : g[gy * GW + gx];
    cnt.fill(0);
    let any = 0;
    for (let yy = gy; yy < gy + n; yy++)
      for (let xx = gx; xx < gx + n; xx++) xx >= 0 && yy >= 0 && xx < GW && yy < GH && (cnt[g[yy * GW + xx]]++, any++);
    if (!any) return -1;
    let b = 0;
    for (let q = 1; q < 4; q++) cnt[q] > cnt[b] && (b = q);
    return b;
  };
  for (let my = 0; my < MINI_H; my++)
    for (let mx = 0; mx < MINI_W; mx++) {
      const gx = Math.floor((M.ox + mx * sx) / S), gy = Math.floor((M.oy + my * sx) / S);
      const v = cellAt(gx, gy);
      if (v <= 0) continue;
      let c;
      if (v === 1) {
        const up = cellAt(gx, gy - n);
        const top = gy > 0 && up !== 1;
        const ug = z.y > 0 || (gy + 0.5) * S > surf[Math.max(0, Math.min(GW - 1, gx))] + 40;
        c = ug ? (top ? UT : UB) : top ? Tp : B;
      } else if (v === 2) c = IN;
      else c = gy > 0 && cellAt(gx, gy - n) !== 3 ? WT : WA;
      const k = (my * MINI_W + mx) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  ctx.putImageData(im, 0, 0);
  tex.refresh();
  hud.frMiniImg.setTexture(key).setVisible(!0);
}
function miniUpdate(hud) {
  const M = hud.frMini, sc = hud.run;
  if (!M || !sc?.world || !sc.player) return;
  const now = sc.time.now;
  if (now - M.t < 100) return;
  M.t = now;
  const z = zoneOfPlayer(sc);
  const show = !!z && !hud.frBag && !hud.frMap;
  for (const o of [hud.frMiniFrame, hud.frMiniBg, hud.frMiniImg, hud.frMiniG, hud.frMiniIn, hud.frMiniOut, hud.frMiniTag]) o?.setVisible(show && (o !== hud.frMiniImg || M.zid === z?.id));
  if (!show) return;
  const W = sc.world, g0 = W.originChunk * 512 - z.c0 * 512;
  const pzx = sc.player.x + g0, pzy = sc.player.body.y;
  if (M.zid !== z.id) Object.assign(M, { grid: miniGrid(sc, z), zid: z.id, z, cx: -1e9 });
  if (Math.abs(pzx - M.cx) > M.sx * 4 || Math.abs(pzy - M.cy) > M.sx * 4 || !M.sx) miniDraw(hud, M, pzx, pzy);
  const toM = (lx, y) => [M.x + (lx + g0 - M.ox) / M.sx, M.y + (y - M.oy) / M.sy];
  const inM = (x, y) => x >= M.x + 2 && x < M.x + MINI_W - 2 && y >= M.y + 2 && y < M.y + MINI_H - 2;
  const G = hud.frMiniG.clear();
  // 지금 화면 범위
  const cam = sc.cameras.main, [cx0, cy0] = toM(cam.scrollX, cam.scrollY);
  G.lineStyle(1, 0xffffff, 0.35).strokeRect(Math.round(cx0) + 0.5, Math.round(cy0) + 0.5, Math.round(R.ot / M.sx), Math.round(R.xt / M.sy));
  // 출구 (숨은 던전 입구는 한 번 본 뒤에만)
  for (const e of ZN.exitList(z)) {
    if (e.at === "DG" && !(sc.fr?.dgSeen ?? []).includes(z.id)) continue;
    const p = exitPos(W, z, e.at);
    if (!p || p.row <= 0) continue;
    const lx = W.lx(p.tile) + 8, y = p.py > 0 ? p.py : p.row * 16;
    const [ex, ey] = toM(lx, y);
    if (!inM(ex, ey)) continue;
    const col = e.at === "U" ? 0x7ae8ff : e.at === "D" ? 0xffa040 : e.at === "DG" ? 0xc080ff : 0xffe08a;
    const X = Math.round(ex), Y = Math.round(ey) - 2;
    G.fillStyle(0x140e18, 1).fillRect(X - 2, Y - 2, 5, 5);
    if (e.at === "U") G.fillStyle(col, 1).fillTriangle(X - 2, Y + 2, X + 2, Y + 2, X, Y - 2);
    else if (e.at === "D") G.fillStyle(col, 1).fillTriangle(X - 2, Y - 2, X + 2, Y - 2, X, Y + 2);
    else G.fillStyle(col, 1).fillRect(X - 1, Y - 1, 3, 3);
  }
  // 적 (정예는 주황, 보스는 크게)
  for (const en of sc.enemies ?? []) {
    if (en.dead || en.removed) continue;
    const [ex, ey] = toM(en.cx, en.body?.y ?? en.cy);
    if (ex < M.x || ex >= M.x + MINI_W || ey < M.y || ey >= M.y + MINI_H) continue;
    G.fillStyle(en.isElite ? 0xffa040 : 0xff4a4a, 1).fillRect(Math.round(ex), Math.round(ey) - 1, 1, 1);
  }
  if (sc.boss && !sc.boss.dead) {
    const [bx, by] = toM(sc.boss.cx ?? sc.boss.body?.x ?? 0, sc.boss.body?.y ?? 0);
    G.fillStyle(0xff2020, 1).fillRect(Math.round(bx) - 1, Math.round(by) - 3, 3, 3);
  }
  // 플레이어 (깜빡임)
  const [px, py] = toM(sc.player.x, sc.player.body.y);
  M.blink = (M.blink + 1) % 8;
  const X = Math.round(px), Y = Math.round(py) - 1;
  G.fillStyle(0x140e18, 1).fillRect(X - 2, Y - 2, 5, 5);
  G.fillStyle(M.blink < 6 ? 0xffffff : 0x9ad0ff, 1).fillRect(X - 1, Y - 1, 3, 3);
}

// ── 가방·융합 화면 ─────────────────────────────────
function toggleBag(sc) {
  const h = sc?.hud?.();
  if (!h || !sc.fr) return;
  if (h.frBag) return void closeBag(h);
  if (h.modalOpen || sc.player?.dead || sc.dying) return;
  openBag(sc, { free: !1, legend: !1 });
}
const SLOT_KEYS = ["weapon", "s1", "s2", "magic", "armor"];
const SLOT_KO = { weapon: "무기", s1: "Q", s2: "E", magic: "R", armor: "방어구" };
// ── 거점 가방 · 저장되는 가방 (2026-11-28) ──
//   가방(d.bag, 저장 키 목록)은 거점과 탐험에 같이 들고 다닌다. 살아 돌아오면 그대로, 쓰러지면 잃는다
//   거점에서는 거점 장면(sc)에 가방을 그리고, 저장 데이터를 탐험 모양(fr)으로 바꿔 넘긴다. 바뀔 때마다 저장에 다시 쓴다
export const BAG_MAX = 48;
function hubFrOf() {
  const d = sd();
  d.bag ??= [];
  const mk = (k) => (k ? mkItem(k) : null), eq = {};
  for (const k of SLOT_KEYS) eq[k] = mk(d.equip[k]);
  return { hub: 1, equip: eq, bag: d.bag.map(mk).filter(Boolean), bagMax: BAG_MAX, stones: 0, mats: d.mats ?? {}, pickups: [], chain: {}, sp: 0, attr: { str: 0, vit: 0, int: 0, agi: 0, luk: 0 }, ents: [], zones: [] };
}
// 거점 카메라는 움직이므로, 가방은 카메라가 고정된 작은 UI 장면에 그린다
// (장면 추가는 다음 틱에 처리되므로, 준비될 때까지 기다렸다가 cb — 게임 업데이트 도중 열면 null이라 거점이 멈추던 문제)
function withBagUI(sc, cb) {
  const SM = sc.scene;
  if (!SM.get("FrBagUI")) {
    class FrBagUI extends R.zt.Scene {
      constructor() {
        super("FrBagUI");
      }
    }
    SM.add("FrBagUI", FrBagUI, !0);
  } else SM.isActive("FrBagUI") || SM.launch("FrBagUI");
  let n = 0;
  const go = () => {
    const ui = SM.get("FrBagUI");
    if (ui && ui.sys.settings.status >= 5) return void (SM.bringToTop("FrBagUI"), cb(ui));
    ++n < 120 && sc.time.delayedCall(16, go);
  };
  go();
}
export const hubBagOpen = (sc) => !!sc?.scene?.get?.("FrBagUI")?.frBag;
// ── 창고 (알비온식, 2026-11-28): 창고 시설에서 연다. 왼쪽 = 창고 칸(종류 탭·스크롤), 오른쪽 = 가방
//   저장: 창고 = 보유 목록(owned)에서 장착 중인 것 하나씩을 뺀 나머지. 옮길 때마다 owned = 창고 + 장착
function stashOf(d) {
  const keys = d.owned.slice();
  for (const k of SLOT_KEYS) {
    const e = d.equip[k];
    if (!e || FREE_KEYS.has(e)) continue;
    const i = keys.indexOf(e);
    i >= 0 && keys.splice(i, 1);
  }
  return keys.map((k) => mkItem(k)).filter(Boolean);
}
export function openStashHub(sc) {
  const cur = sc.scene.get("FrBagUI");
  if (cur?.frBag) closeBag(cur);
  if (sc.leaving) return;
  sc.fr = hubFrOf();
  sc.fr.stash = stashOf(sd());
  sc.frHubEq = { ...sd().equip };
  withBagUI(sc, (ui) => {
    openBagOn(ui, sc, { free: !1, legend: !1, hub: !0, stash: !0 });
    sc.events.once("shutdown", () => ui.frBag && closeBag(ui));
  });
}
export function toggleBagHub(sc) {
  const cur = sc.scene.get("FrBagUI");
  if (cur?.frBag) return void closeBag(cur);
  if (sc.panelOpen || sc.leaving) return;
  sc.fr = hubFrOf();
  sc.frHubEq = { ...sd().equip };
  withBagUI(sc, (ui) => {
    openBagOn(ui, sc, { free: !1, legend: !1, hub: !0 });
    sc.events.once("shutdown", () => ui.frBag && closeBag(ui));
  });
}
export function closeBagHub(sc) {
  const ui = sc?.scene?.get?.("FrBagUI");
  ui?.frBag && closeBag(ui);
}
const bagKeyOf = (d, it) => {
  const k = itemKey(it);
  it.tier !== 0 && ((d.items ??= {}), (d.items[k] = snapItem(it)));
  return k;
};
function hubSync(sc) {
  const fr = sc.fr, d = sd();
  if (!fr?.hub) return;
  // 장착 칸: 바뀐 칸만 창고(owned) 수를 맞춘다 (장착한 물건은 창고 수에 들어 있다)
  for (const k of SLOT_KEYS) {
    const nk = fr.equip[k] ? bagKeyOf(d, fr.equip[k]) : null, ok = sc.frHubEq?.[k] ?? null;
    if (nk === ok) continue;
    if (ok && !FREE_KEYS.has(ok)) {
      const i = d.owned.indexOf(ok);
      i >= 0 && d.owned.splice(i, 1);
    }
    nk && !FREE_KEYS.has(nk) && d.owned.push(nk);
    d.equip[k] = nk;
    sc.frHubEq[k] = nk;
  }
  d.bag = fr.bag.map((it) => bagKeyOf(d, it));
  // 창고를 열었으면 보유 목록 = 창고 + 장착 (무료 기본 장비는 세지 않는다)
  fr.stash && (d.owned = [...fr.stash.map((it) => bagKeyOf(d, it)), ...SLOT_KEYS.map((k) => d.equip[k]).filter((k) => k && !FREE_KEYS.has(k))].filter((k) => !FREE_KEYS.has(k)));
  R.it.write();
  sc.player?.applyStats?.(hubStats(sc));
}
// 가방 판매 골드: 탐험 중이면 이번 탐험 골드, 거점이면 모아 둔 골드
const bagGold = (sc, g) => (sc.run ? (sc.run.gold += g) : ((R.it.data.gold = (R.it.data.gold ?? 0) + g), R.it.write()));
const bagGoldNow = (sc) => (sc.run ? Math.floor((sc.run.gold ?? 0) + (sc.run.milestoneGold ?? 0)) : Math.floor(R.it.data.gold ?? 0));
// 가방은 게임을 멈추지 않는다 (알비온식, 2026-11-28): 걸어 다닐 수 있고, 공격·스킬만 막힌다 (Run.readInput → bagBlocks)
export const bagBlocks = (sc) => !!sc?.hud?.()?.frBag;
export function closeBagOf(sc) {
  const h = sc?.hud?.();
  h?.frBag && closeBag(h);
}
export function openBag(sc, opts) {
  openBagOn(sc.hud(), sc, opts);
}
function openBagOn(h, sc, opts) {
  if (!h) return;
  const B = (h.frBag = { sc, opts, sel: [], objs: [], info: [], forge: [null, null, null], msg: "", hover: null, pin: null, drag: null, hits: [], scroll: 0 });
  B.onMove = (p) => dragMove(h, p);
  B.onUp = (p) => dragEnd(h, p);
  // 휠: 가방 칸 위에서 굴리면 줄을 넘긴다
  B.onWheel = (p, objs, dx, dy) => {
    const inB = (G) => G && dy && p.x >= G.x && p.x <= G.x + G.w && p.y >= G.y && p.y <= G.y + G.h;
    const G = B.gridBox, S = B.stashBox;
    if (inB(S)) {
      const s = Math.max(0, Math.min(S.rows - S.VR, (B.stScroll ?? 0) + (dy > 0 ? 1 : -1)));
      return void (s !== B.stScroll && ((B.stScroll = s), renderBag(h)));
    }
    if (!inB(G)) return;
    const s = Math.max(0, Math.min(G.rows - G.VR, B.scroll + (dy > 0 ? 1 : -1)));
    s !== B.scroll && ((B.scroll = s), renderBag(h));
  };
  h.input.on("pointermove", B.onMove);
  h.input.on("pointerup", B.onUp);
  h.input.on("wheel", B.onWheel);
  R.j.play("open");
  renderBag(h);
}
function closeBag(h) {
  const B = h.frBag;
  if (!B) return;
  h.input.off("pointermove", B.onMove);
  h.input.off("pointerup", B.onUp);
  h.input.off("wheel", B.onWheel);
  B.drag?.ghost?.destroy();
  B.hlImg?.destroy();
  B.hlBox?.destroy();
  B.tip?.objs.forEach((o) => o.destroy());
  for (const o of [...B.objs, ...B.info, ...(B.det ?? [])]) (h.tweens.killTweensOf(o), o.destroy());
  h.frBag = null;
  R.j.play("close");
  // 거점 가방: 저장하고 거점 능력치로
  B.opts.hub && (hubSync(B.sc), (B.sc.fr = null));
  B.opts.onClose && B.sc.time.delayedCall(50, B.opts.onClose);
}
function allEntries(fr) {
  const out = [];
  SLOT_KEYS.forEach((k) => out.push({ where: "eq", key: k, item: fr.equip[k] }));
  fr.bag.forEach((it, i) => out.push({ where: "bag", key: i, item: it }));
  return out;
}
// 가방 칸 배치 (fr.bag은 내용물, fr.bagPos는 칸 위치)
function bagSlots(fr) {
  const P = (fr.bagPos = fr.bagPos ?? []);
  P.length = fr.bagMax;
  // 같은 아이템이 두 칸에 보이지 않게 (끌어다 놓기 중 겹쳐 보이던 문제)
  const seen = new Set();
  for (let i = 0; i < P.length; i++) (P[i] && fr.bag.includes(P[i]) && !seen.has(P[i])) ? seen.add(P[i]) : (P[i] = null);
  for (let i = fr.bag.length - 1; i >= 0; i--) fr.bag.indexOf(fr.bag[i]) !== i && fr.bag.splice(i, 1);
  for (const it of fr.bag) if (!P.includes(it)) {
    const i = P.indexOf(null);
    i >= 0 && (P[i] = it);
  }
  return P;
}
const bagReplace = (fr, a, b) => {
  const i = fr.bag.indexOf(a);
  i >= 0 && (b ? (fr.bag[i] = b) : fr.bag.splice(i, 1));
};
const entItem = (fr, e) => (!e ? null : e.where === "eq" ? fr.equip[e.key] : e.where === "bag" ? bagSlots(fr)[e.key] ?? null : e.where === "stash" ? fr.stashView?.[e.key] ?? null : null);
const sameEnt = (a, b) => !!(a && b && a.where === b.where && a.key === b.key);
function forgeResult(B) {
  const fr = B.sc.fr;
  const items = B.forge.map((e) => entItem(fr, e)).filter(Boolean);
  if (items.length < 2) return null;
  const key = items.map((x) => x.uid).join("|") + (B.opts.legend ? "L" : "");
  if (B.resKey === key) return B.resVal;
  B.resKey = key;
  return (B.resVal = forgeCalc(B, items));
}
function forgeCalc(B, items) {
  if (items.length === 3) return B.opts.legend ? IT.fuseLegend(items) : { err: "전설 융합은 휴식처 융합로에서만 됩니다" };
  return items.some((x) => x.tier >= 1) ? IT.fuse2(items[0], items[1]) : IT.fuse1(items[0], items[1]);
}
// ── 끌어다 놓기 ──
function dragStart(h, ent, p) {
  const B = h.frBag;
  const it = ent.where === "forge" ? entItem(B.sc.fr, B.forge[ent.key]) : entItem(B.sc.fr, ent);
  if (!it) return;
  B.drag = { ent, it, x0: p.x, y0: p.y, ghost: null };
}
function dragMove(h, p) {
  const B = h.frBag;
  if (!B) return;
  moveTip(h, p);
  const D = B.drag;
  if (!D) return;
  if (!D.ghost && Math.hypot(p.x - D.x0, p.y - D.y0) > 4) {
    B.hover = null;
    hideTip(h);
    D.ghost = h.add.image(p.x, p.y, itemIcon(B.sc, D.it)).setDepth(99).setScale(1.1).setAlpha(0.9);
    R.j.play("click");
    renderBag(h);
  }
  if (D.ghost) {
    D.ghost.setPosition(p.x, p.y);
    const t = hitAt(B, p.x, p.y);
    const k = t ? `${t.type}:${t.key}` : "";
    if (k !== B.hl) {
      B.hl = k;
      const ok = t && canDrop(B, D.it, D.ent, t);
      B.hlImg = B.hlImg ?? h.add.image(0, 0, "vx_glow").setBlendMode(R.zt.BlendModes.ADD).setDepth(98);
      B.hlBox = B.hlBox ?? h.add.rectangle(0, 0, 10, 10).setStrokeStyle(1, 0xffe0a0).setDepth(98);
      B.hlImg.setVisible(!!ok).setTint(0xffc060).setAlpha(0.45);
      B.hlBox.setVisible(!!ok);
      ok && (B.hlImg.setPosition(t.x + t.w / 2, t.y + t.h / 2).setScale(Math.max(t.w, t.h) / 22), B.hlBox.setPosition(t.x + t.w / 2, t.y + t.h / 2).setSize(t.w + 2, t.h + 2));
    }
  }
}
function hitAt(B, x, y) {
  for (const r of B.hits) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
  return null;
}
function dragEnd(h, p) {
  const B = h.frBag;
  const D = B?.drag;
  if (!D) return;
  B.drag = null;
  B.hl = "";
  B.hlImg?.setVisible(!1);
  B.hlBox?.setVisible(!1);
  if (!D.ghost) {
    B.pin = D.ent.where === "forge" ? B.forge[D.ent.key] : D.ent;
    R.j.play("click");
    return void renderBag(h);
  }
  D.ghost.destroy();
  B.hover = null;
  dropOn(h, D.ent, hitAt(B, p.x, p.y));
  h.frBag && renderBag(h);
}
function dropOn(h, src, tgt) {
  const B = h.frBag;
  const sc = B.sc, fr = sc.fr;
  const fail = (m) => ((B.msg = m), R.j.play("error"));
  if (src.where === "forge") {
    const e = B.forge[src.key];
    if (tgt?.type === "forge") ((B.forge[src.key] = B.forge[tgt.key]), (B.forge[tgt.key] = e));
    else B.forge[src.key] = null;
    return void R.j.play("click");
  }
  if (!tgt) return;
  const it = entItem(fr, src);
  if (!it) return;
  if (tgt.type === "forge") {
    if (tgt.key === 2 && !B.opts.legend) return fail("세 번째 칸은 휴식처 융합로에서만 씁니다");
    B.forge = B.forge.map((e) => (sameEnt(e, src) ? null : e));
    B.forge[tgt.key] = { where: src.where, key: src.key };
    B.msg = "";
    return void R.j.play("buy");
  }
  const changed = () => ((B.forge = [null, null, null]), (B.pin = null), applyLoadout(sc), R.j.play("buy"));
  if (tgt.type === "stash") {
    if (!fr.stash || src.where === "stash") return;
    if (src.where === "eq" && (src.key === "weapon" || src.key === "armor") && FREE_KEYS.has(itemKey(it))) return fail("기본 장비는 창고에 넣지 않습니다");
    takeOut(fr, src);
    fr.stash.push(it);
    B.msg = `창고에 넣음: ${it.name}`;
    return changed();
  }
  if (src.where === "stash" && tgt.type === "bag") {
    const P = bagSlots(fr);
    if (fr.bag.length >= fr.bagMax) return fail("가방이 가득 찼습니다");
    takeOut(fr, src);
    fr.bag.push(it);
    P[tgt.key] ? bagSlots(fr) : (P[tgt.key] = it);
    B.msg = `가방에 넣음: ${it.name}`;
    return changed();
  }
  if (tgt.type === "eq") {
    const k = tgt.key;
    if (src.where === "eq" && src.key === k) return;
    if (!slotFits(k, it)) return fail(`${SLOT_KO[k]} 칸에는 넣을 수 없는 아이템입니다`);
    if (!IT.canEquip(it)) return fail(IT.needText(it));
    const old = fr.equip[k];
    if (src.where === "eq") {
      if (old && !slotFits(src.key, old)) return fail("서로 바꿀 수 없습니다");
      fr.equip[src.key] = old ?? null;
      fr.equip[k] = it;
    } else {
      fr.equip[k] = it;
      bagReplace(fr, it, old);
      bagSlots(fr)[src.key] = old ?? null;
    }
    B.msg = `장착: ${it.name}`;
    return changed();
  }
  if (tgt.type === "bag") {
    const i = tgt.key;
    const P = bagSlots(fr);
    const there = P[i] ?? null;
    if (src.where === "bag") {
      if (src.key === i) return;
      ((P[src.key] = there), (P[i] = it));
      return changed();
    }
    const k = src.key;
    if (there) {
      if (!slotFits(k, there)) return fail(k === "weapon" || k === "armor" ? `${SLOT_KO[k]}는 같은 종류로만 바꿀 수 있습니다` : "그 아이템은 이 칸에 장착할 수 없습니다");
      fr.equip[k] = there;
      bagReplace(fr, there, it);
      P[i] = it;
      B.msg = `장착: ${there.name}`;
      return changed();
    }
    if (k === "weapon" || k === "armor") return fail(`${SLOT_KO[k]} 칸은 비울 수 없습니다`);
    if (fr.bag.length >= fr.bagMax) return fail("가방이 가득 찼습니다");
    fr.equip[k] = null;
    fr.bag.push(it);
    P[i] = it;
    B.msg = `해제: ${it.name}`;
    return changed();
  }
  if (tgt.type === "sell") {
    if (src.where === "eq" && (src.key === "weapon" || src.key === "armor")) return fail("장착 중인 무기·방어구는 팔 수 없습니다");
    takeOut(fr, src);
    const g = sellPrice(sc, it);
    bagGold(sc, g);
    B.msg = `${it.name} 판매 +${g}G`;
    B.forge = [null, null, null];
    B.pin = null;
    applyLoadout(sc);
    R.j.play("coin");
  }
}
const sellPrice = (sc, it) => Math.round((10 + (sc.run ? ZN.diffDist(sc.dist) : 0) / 150) * (1 + it.tier) * IT.GRADE_PRICE[IT.gradeOf(it)] ** 0.6);
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
// 우클릭: 바로 장착·해제 / Shift+클릭: 융합대
function quickAction(h, e, toForge) {
  const B = h.frBag;
  const fr = B.sc.fr;
  if (e.where === "forge") return void ((B.forge[e.key] = null), R.j.play("click"), renderBag(h));
  const it = entItem(fr, e);
  if (!it) return;
  if (toForge || it.kind === "rune") {
    if (B.forge.some((f) => sameEnt(f, e))) B.forge = B.forge.map((f) => (sameEnt(f, e) ? null : f));
    else {
      const j = B.forge.slice(0, B.opts.legend ? 3 : 2).indexOf(null);
      if (j < 0) return void ((B.msg = "융합대가 가득 찼습니다"), R.j.play("error"), renderBag(h));
      dropOn(h, e, { type: "forge", key: j });
    }
    return void renderBag(h);
  }
  if (fr.stash && (e.where === "stash" || e.where === "bag")) {
    if (e.where === "stash") {
      const i = bagSlots(fr).indexOf(null);
      if (i < 0) return void ((B.msg = "가방이 가득 찼습니다"), R.j.play("error"), renderBag(h));
      dropOn(h, e, { type: "bag", key: i });
    } else dropOn(h, e, { type: "stash", key: 0 });
    return void renderBag(h);
  }
  if (e.where === "eq") {
    const i = bagSlots(fr).indexOf(null);
    if (i < 0) return void ((B.msg = "가방이 가득 찼습니다"), R.j.play("error"), renderBag(h));
    dropOn(h, e, { type: "bag", key: i });
  } else {
    let k = it.kind === "weapon" ? "weapon" : it.kind === "armor" ? "armor" : null;
    if (!k) {
      const order = it.kind === "magic" ? ["magic", "s2", "s1"] : ["s1", "s2", "magic"];
      k = order.find((x) => !fr.equip[x]) ?? order[0];
    }
    dropOn(h, e, { type: "eq", key: k });
  }
  renderBag(h);
}
function canDrop(B, it, srcEnt, tgt) {
  if (!it) return !1;
  if (tgt.type === "stash") return !!B.sc.fr.stash && srcEnt.where !== "stash";
  if (srcEnt.where === "stash") return tgt.type === "bag" ? B.sc.fr.bag.length < B.sc.fr.bagMax : tgt.type === "sell" || tgt.type === "forge" || (tgt.type === "eq" && slotFits(tgt.key, it));
  if (tgt.type === "eq") return slotFits(tgt.key, it);
  if (tgt.type === "sell") return !(srcEnt.where === "eq" && (srcEnt.key === "weapon" || srcEnt.key === "armor"));
  if (tgt.type === "forge") return tgt.key < 2 || B.opts.legend;
  if (tgt.type === "bag" && srcEnt.where === "eq") {
    const there = bagSlots(B.sc.fr)[tgt.key];
    return there ? slotFits(srcEnt.key, there) : srcEnt.key !== "weapon" && srcEnt.key !== "armor";
  }
  return !0;
}
// ── 인벤토리 (알비온식 · 2026-11-28 UI 전면 교체) ──
//   오른쪽 좁은 크림 창 하나: 머리띠(가방 · 닫기) → 장비(캐릭터 · 무기 · 방어구 · Q E R · 레벨) → 칸 7열 스크롤 → 융합 제단 → 판매 · 예상 가치
//   창고를 열면 왼쪽에 같은 모양의 창고 창이 붙는다. 아이템 설명은 마우스를 올린 칸 옆에 붙는 툴팁
const INK = "#2a1709", INK2 = "#5c3d22", INK_R = "#8a1a0e";
const parRar = (it) => AL.RAR_INK[IT.RARITY_OF(it)] ?? AL.INK;
const BAG_SLOT = 25, BAG_PITCH = 26, BAG_COLS = 7;
const BAG_W = 200;
function renderBag(h) {
  const B = h.frBag;
  for (const o of [...B.objs, ...(B.det ?? [])]) (h.tweens.killTweensOf(o), o.destroy());
  B.objs = [];
  B.det = [];
  B.slots = [];
  B.hits = [];
  const sc = B.sc, fr = sc.fr;
  pullWaiting(sc);
  const { ct } = R;
  const ADD = R.zt.BlendModes.ADD;
  const add = (o) => (B.objs.push(o), o);
  const txt = (x, y, t, st, col, o = {}) => add(ct(h, x, y, t, st, col, o).setDepth(96));
  const ink = (x, y, t, st = "tiny", col = AL.INK) => txt(x, y, t, st, col);
  const dark = (x, y, t, st = "tiny", col = AL.LIGHT) => txt(x, y, t, st, col, { stroke: "#0c0804", strokeThickness: 2 });
  h.input.mouse?.disableContextMenu();
  const W = R.ot, Hh = R.xt;
  const res = forgeResult(B);
  const inForge = (e) => B.forge.some((f) => sameEnt(f, e));
  const D = B.drag?.ghost ? B.drag : null;
  // 칸 하나 (중심 좌표 · 한 변 s)
  const slotBox = (x, y, e, tgt, s = BAG_SLOT) => {
    const it = e.where === "forge" ? entItem(fr, B.forge[e.key]) : entItem(fr, e);
    const over = B.hl === `${tgt.type}:${tgt.key}`;
    const ok = D ? canDrop(B, D.it, D.ent, tgt) : !1;
    const hov = B.hover?.e && sameEnt(B.hover.e, e);
    const cand = !!(D && ok && !sameEnt(D.ent, e));
    const bg = add(h.add.image(x, y, AL.slotKey(h, s, over && ok ? 2 : hov || cand ? 1 : 0)).setDepth(93).setInteractive({ useHandCursor: !!it }));
    B.slots.push({ bg, e, s, it, lock: over && ok, cand });
    B.hits.push({ x: x - s / 2, y: y - s / 2, w: s, h: s, ...tgt });
    bg.on("pointerdown", (p) => {
      if (!it) return;
      if (p.rightButtonDown()) return void quickAction(h, e, !1);
      if (p.event?.shiftKey) return void quickAction(h, e, !0);
      dragStart(h, e, p);
    });
    bg.on("pointerover", () => it && !B.drag && !(B.hover?.e && sameEnt(B.hover.e, e)) && setHover(h, { e, it, x, y, s }));
    bg.on("pointerout", () => B.hover?.e && sameEnt(B.hover.e, e) && setHover(h, null));
    if (it) {
      const dim = (D && sameEnt(D.ent, e)) || (e.where !== "forge" && inForge(e));
      const ic = add(h.add.image(x, y, itemIcon(sc, it)).setDepth(94));
      ic.setScale((s - 3) / Math.max(ic.width, ic.height, 1)).setAlpha(dim ? 0.3 : 1);
      for (const o of rarityDeco(h, it, x, y, s - 2, 94.5)) add(o.setAlpha(dim ? 0.3 : o.alpha));
      it.tier > 0 && dark(x - s / 2 + 2, y - s / 2 + 1, ["", "Ⅰ", "Ⅱ", "★"][it.tier], "tiny", rarCss(it));
      e.where !== "forge" && inForge(e) && dark(x, y, "융합", "tiny", "#ffc070").setOrigin(0.5);
    }
    return it;
  };
  // ── 오른쪽: 가방 창 ──
  const PW = BAG_W, PX = W - PW - 6, PY = 6, PH = Hh - 12;
  B.panelX = PX;
  const P = AL.panel(h, PX, PY, PW, PH, { title: "가방", sub: fr.hub ? "거점" : "", depth: 91, onClose: () => closeBag(h) });
  B.objs.push(...P.objs);
  // 장비: 캐릭터 그림 · 무기 · 방어구 · Q E R
  const DX = PX + 6, DY = P.top + 2, DW = 58, DH = 72;
  add(h.add.rectangle(DX, DY, DW, DH, 0x2a231c).setOrigin(0).setDepth(92).setStrokeStyle(1, AL.C.edge));
  add(h.add.rectangle(DX + 1, DY + 1, DW - 2, 1, 0x000000, 0.5).setOrigin(0).setDepth(92));
  add(h.add.image(DX + DW / 2, DY + DH / 2, "vx_glow").setTint(0xffc070).setBlendMode(ADD).setScale(1.3).setAlpha(0.22).setDepth(92));
  const p = sc.player;
  const body = add(h.add.sprite(DX + DW / 2, DY + DH - 3, `player_${p.stats.armorId}`, 0).setOrigin(0.5, 1).setDepth(93));
  body.setScale(Math.min(3, (DH - 8) / Math.max(1, body.height), (DW - 6) / Math.max(1, body.width)));
  const ex = (i) => PX + 84 + i * 29, rowA = DY + 13, rowB = DY + 50;
  [["weapon", "무기"], ["armor", "방어구"]].forEach(([k, ko], i) => {
    slotBox(ex(i), rowA, { where: "eq", key: k }, { type: "eq", key: k });
    ink(ex(i), rowA + 14, ko, "tiny", AL.INK3).setOrigin(0.5, 0);
  });
  [["s1", "Q"], ["s2", "E"], ["magic", "R"]].forEach(([k, ko], i) => {
    slotBox(ex(i), rowB, { where: "eq", key: k }, { type: "eq", key: k });
    ink(ex(i), rowB + 14, ko, "tiny", AL.INK3).setOrigin(0.5, 0);
  });
  // 레벨 · 체력 · 능력치 단추
  const lx = ex(2) - 12;
  ink(lx, DY, `Lv ${sc.build?.level ?? 1}`, "small", AL.INK);
  ink(lx, DY + 13, `체력 ${Math.round(p.hp)}/${p.maxHp}`, "tiny", AL.INK2);
  const sbt = AL.btn(h, lx, DY + 24, PX + PW - 7 - lx, 14, fr.sp > 0 ? `능력치 +${fr.sp}` : "능력치", () => ((B.showStats = !B.showStats), renderBag(h)), { depth: 96, primary: fr.sp > 0, selected: !!B.showStats, font: "tiny" });
  B.objs.push(...sbt.objs);
  if (!fr.hub) {
    add(h.add.image(ex(3) - 4, rowB, "fr_stone").setDepth(95).setScale(0.8));
    ink(ex(3) + 4, rowB - 4, `${fr.stones}`, "small", AL.INK_BLUE);
    ink(ex(3) - 6, rowB + 14, "융합석", "tiny", AL.INK3).setOrigin(0.5, 0);
  }
  // 칸 머리줄: 개수 · 돈
  let y = DY + DH + 3;
  add(AL.rule(h, PX + 6, y, PW - 12, 92));
  y += 4;
  ink(PX + 7, y, `${fr.bag.length} / ${fr.bagMax}`, "tiny", AL.INK2);
  const gtx = ink(PX + PW - 8, y, `${bagGoldNow(sc).toLocaleString()}`, "small", AL.INK_GOLD).setOrigin(1, 0);
  add(h.add.image(gtx.x - gtx.width - 6, y + 5, "icon_gold").setDepth(95));
  y += 13;
  // 칸 7열 · 스크롤
  const COLS = BAG_COLS, VR = 6, GX = PX + 7, GY = y;
  const rows = Math.ceil(fr.bagMax / COLS);
  B.scroll = Math.max(0, Math.min(rows - VR, B.scroll ?? 0));
  for (let r = 0; r < VR; r++)
    for (let c = 0; c < COLS; c++) {
      const i = (B.scroll + r) * COLS + c;
      if (i >= fr.bagMax) continue;
      slotBox(GX + BAG_SLOT / 2 + c * BAG_PITCH, GY + BAG_SLOT / 2 + r * BAG_PITCH, { where: "bag", key: i }, { type: "bag", key: i });
    }
  rows > VR && add(AL.scrollbar(h, PX + PW - 10, GY, VR * BAG_PITCH - 1, rows, VR, B.scroll, 93));
  B.gridBox = { x: PX + 4, y: GY - 2, w: PW - 8, h: VR * BAG_PITCH + 2, rows, VR };
  y = GY + VR * BAG_PITCH + 2;
  // ── 융합 제단 ──
  add(AL.rule(h, PX + 6, y, PW - 12, 92));
  y += 4;
  ink(PX + 7, y, B.opts.legend ? "융합로 · 전설" : "융합 제단", "tiny", AL.INK_HDR);
  if (fr.hub) {
    ink(PX + PW - 8, y, "탐험 중에만 쓸 수 있다", "tiny", AL.INK3).setOrigin(1, 0);
    y += 14;
  } else {
    const ok = res && !res.err, nS = B.opts.legend ? 3 : 2, fy = y + 22;
    const sx = Array.from({ length: nS }, (_, j) => PX + 20 + j * 30);
    for (let j = 0; j < nS; j++) {
      slotBox(sx[j], fy, { where: "forge", key: j }, { type: "forge", key: j });
      j < nS - 1 && ink(sx[j] + 15, fy - 5, "+", "tiny", AL.INK3).setOrigin(0.5, 0);
    }
    const rx = sx[nS - 1] + 40;
    ink(rx - 20, fy - 5, "▶", "tiny", ok ? AL.INK_GOLD : AL.INK3).setOrigin(0.5, 0);
    const rb = add(h.add.image(rx, fy, AL.slotKey(h, BAG_SLOT, ok ? 2 : 3)).setDepth(93).setInteractive());
    rb.on("pointerover", () => ok && !B.hover?.res && setHover(h, { res: 1, it: res.item, x: rx, y: fy, s: BAG_SLOT }));
    rb.on("pointerout", () => B.hover?.res && setHover(h, null));
    if (ok) {
      const g = add(h.add.image(rx, fy, "vx_glow").setTint(res.item.el ? elColor(res.item.el) : 0xffa040).setBlendMode(ADD).setDepth(93).setScale(0.8));
      h.tweens.add({ targets: g, alpha: 0.4, scale: 1, duration: 700, yoyo: !0, repeat: -1 });
      const ic = add(h.add.image(rx, fy, itemIcon(sc, res.item)).setDepth(94));
      ic.setScale((BAG_SLOT - 3) / Math.max(ic.width, ic.height, 1));
    }
    B.altar = { x: rx, y: fy };
    const cost = B.opts.free ? 0 : 1;
    const bx = rx + 18, bw = PX + PW - 7 - bx;
    const fb = AL.btn(h, bx, fy - 8, bw, 16, cost ? `망치질 ${cost}` : "망치질", () => {
      if (!ok) return;
      B.sel = B.forge.filter(Boolean).map((e) => ({ ...e, item: entItem(fr, e) }));
      B.forge = [null, null, null];
      B.hover = null;
      doFuse(h, res.item, cost);
    }, { depth: 96, primary: !0, enabled: !!ok && fr.stones >= cost, font: "tiny" });
    B.objs.push(...fb.objs);
    const fmsg = !res ? (B.forge.some(Boolean) ? "재료를 하나 더 올리세요" : "재료 둘을 끌어 올리세요 (Shift+클릭)") : res.err ? res.err : res.item.name;
    ink(PX + 7, fy + 15, cut(fmsg, 30), "tiny", res?.err ? AL.INK_RED : ok ? parRar(res.item) : AL.INK3);
    y = fy + 27;
  }
  // ── 판매 · 예상 가치 ──
  add(AL.rule(h, PX + 6, y, PW - 12, 92));
  y += 5;
  const sOver = B.hl === "sell:0", sOk = D ? canDrop(B, D.it, D.ent, { type: "sell" }) : !1;
  const SW = 96, SH = PY + PH - 6 - y;
  add(AL.sunk(h, PX + 6, y, SW, SH, { sel: sOver && sOk, depth: 92 }));
  ink(PX + 6 + SW / 2, y + SH / 2 - 4, D && sOk ? `판매 +${sellPrice(sc, D.it)}G` : "끌어 놓아 판매", "tiny", D && sOk ? AL.INK_GOLD : AL.INK3).setOrigin(0.5, 0);
  B.hits.push({ x: PX + 6, y, w: SW, h: SH, type: "sell", key: 0 });
  const val = fr.bag.reduce((s, it) => s + sellPrice(sc, it), 0);
  ink(PX + SW + 12, y + 1, "예상 가치", "tiny", AL.INK2);
  add(h.add.image(PX + SW + 16, y + 16, "icon_gold").setDepth(95));
  ink(PX + SW + 23, y + 11, val.toLocaleString(), "small", AL.INK_GOLD);
  // ── 왼쪽: 창고 (열었을 때) ──
  B.opts.stash && drawStash(h, B, add, ink, slotBox);
  // 알림 글 (게임 화면 위)
  B.msg && dark((B.opts.stash ? W : PX) / 2 + (B.opts.stash ? 0 : 0), Hh - 22, B.msg, "small", "#ffc8a0").setOrigin(0.5, 0);
  renderDetail(h);
}
// 창고 창 (왼쪽): 종류 탭 · 7열 스크롤 칸 · 전부 넣기 · 같은 것 넣기 · 정렬 · 창고 가치
const STASH_TABS = [["all", "전체"], ["weapon", "무기"], ["armor", "방어"], ["skill", "스킬"], ["magic", "마법"], ["etc", "기타"]];
const stashKind = (it) => (["weapon", "armor", "skill", "magic"].includes(it.kind) ? it.kind : "etc");
function drawStash(h, B, add, ink, slotBox) {
  const sc = B.sc, fr = sc.fr;
  const SX = 6, SY = 6, SW = BAG_W, SH = R.xt - 12;
  B.stashRight = SX + SW;
  const P = AL.panel(h, SX, SY, SW, SH, { title: "창고", sub: `${fr.stash.length}개`, depth: 91 });
  B.objs.push(...P.objs);
  const tab = (B.stTab ??= "all");
  let y = P.top + 3;
  B.objs.push(...AL.tabs(h, SX + 6, y, SW - 12, 13, STASH_TABS, tab, (k) => ((B.stTab = k), (B.stScroll = 0), renderBag(h)), { depth: 92 }));
  y += 16;
  // 보이는 목록 (탭으로 거른다) — stashView[i]가 칸 i의 물건
  const view = (fr.stashView = fr.stash.filter((it) => tab === "all" || stashKind(it) === tab));
  const COLS = BAG_COLS, VR = 9, GX = SX + 7, GY = y;
  const rows = Math.max(VR, Math.ceil((view.length + 1) / COLS));
  B.stScroll = Math.max(0, Math.min(rows - VR, B.stScroll ?? 0));
  for (let r = 0; r < VR; r++)
    for (let c = 0; c < COLS; c++) {
      const i = (B.stScroll + r) * COLS + c;
      slotBox(GX + BAG_SLOT / 2 + c * BAG_PITCH, GY + BAG_SLOT / 2 + r * BAG_PITCH, { where: "stash", key: i }, { type: "stash", key: i });
    }
  rows > VR && add(AL.scrollbar(h, SX + SW - 10, GY, VR * BAG_PITCH - 1, rows, VR, B.stScroll, 93));
  B.stashBox = { x: SX + 4, y: GY - 2, w: SW - 8, h: VR * BAG_PITCH + 2, rows, VR };
  // 칸 사이 어디에 놓아도 창고로
  B.hits.push({ x: SX + 4, y: GY - 2, w: SW - 8, h: VR * BAG_PITCH + 2, type: "stash", key: 0 });
  y = GY + VR * BAG_PITCH + 3;
  add(AL.rule(h, SX + 6, y, SW - 12, 92));
  y += 5;
  // 단추: 전부 넣기 · 같은 것 넣기 · 정렬
  const move = (pred) => {
    let n = 0;
    for (const it of fr.bag.slice()) if (pred(it)) (bagReplace(fr, it, null), fr.stash.push(it), n++);
    n && (applyLoadout(sc), R.j.play("buy"));
    B.msg = n ? `창고에 ${n}개 넣음` : "넣을 물건이 없습니다";
    renderBag(h);
  };
  const kinds = new Set(fr.stash.map((it) => it.id));
  const RAR = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }, KO = { weapon: 0, armor: 1, skill: 2, magic: 3, rune: 4 };
  const bw = Math.floor((SW - 12 - 4) / 3);
  const b1 = AL.btn(h, SX + 6, y, bw, 15, "전부 넣기", () => move(() => !0), { depth: 96, primary: !0, font: "tiny" });
  const b2 = AL.btn(h, SX + 8 + bw, y, bw, 15, "같은 것 넣기", () => move((it) => kinds.has(it.id)), { depth: 96, font: "tiny" });
  const b3 = AL.btn(h, SX + 10 + bw * 2, y, bw, 15, "정렬", () => {
    fr.stash.sort((a, b) => (KO[a.kind] ?? 9) - (KO[b.kind] ?? 9) || (RAR[IT.RARITY_OF(b)] ?? 0) - (RAR[IT.RARITY_OF(a)] ?? 0) || IT.gradeOf(b) - IT.gradeOf(a) || String(a.name).localeCompare(String(b.name)));
    applyLoadout(sc);
    renderBag(h);
  }, { depth: 96, font: "tiny" });
  B.objs.push(...b1.objs, ...b2.objs, ...b3.objs);
  y += 20;
  // 창고 가치 (거점 판매가 합)
  const val = fr.stash.reduce((s, it) => s + hubSellPrice(itemKey(it)), 0);
  ink(SX + 7, y, "창고 가치", "tiny", AL.INK2);
  const vt = ink(SX + SW - 8, y - 2, val.toLocaleString(), "small", AL.INK_GOLD).setOrigin(1, 0);
  add(h.add.image(vt.x - vt.width - 6, y + 3, "icon_gold").setDepth(95));
  ink(SX + 7, y + 13, "우클릭: 가방 ↔ 창고 · 끌어서 옮기기", "tiny", AL.INK3);
}
// 마우스 올리기: 화면 전체를 다시 만들지 않고 칸 강조와 툴팁만 바꾼다 (렉 원인이었음)
function setHover(h, hv) {
  const B = h.frBag;
  if (!B) return;
  B.hover = hv;
  for (const S of B.slots) {
    const hov = !!(hv?.e && sameEnt(hv.e, S.e));
    S.bg.active && S.bg.setTexture(AL.slotKey(h, S.s, S.lock ? 2 : hov || S.cand ? 1 : 0));
  }
  for (const o of B.det) (h.tweens.killTweensOf(o), o.destroy());
  B.det = [];
  renderDetail(h);
}
// 툴팁 (알비온식): 희귀도 색 머리띠 + 이름 · 종류 줄 · 설명 · 수치 · 조작 안내. 칸 옆에 붙는다
//   아이템이 없고 능력치를 켰거나 남은 포인트가 있으면 능력치 창
function renderDetail(h) {
  const B = h.frBag, sc = B.sc, fr = sc.fr;
  const { ct } = R;
  const W = R.ot, Hh = R.xt;
  const it = B.hover?.it;
  if (!it && !B.showStats) return;
  const TW = 172, d = 97;
  const parts = [];
  const t = (x, y, s, st, col, o = {}) => {
    const o2 = ct(h, x, y, s, st, col, o).setDepth(d + 0.1);
    parts.push(o2);
    return o2;
  };
  let y = 0, title = "", tint;
  if (!it) {
    title = "능력치";
    const p = sc.player;
    y = 4;
    t(7, y, `방랑 대장장이 · Lv ${sc.build?.level ?? 1}`, "tiny", AL.INK);
    t(TW - 7, y, `체력 ${Math.round(p.hp)}/${p.maxHp}`, "tiny", AL.INK2).setOrigin(1, 0);
    y += 12;
    t(7, y, fr.sp ? `남은 포인트 ${fr.sp}` : "레벨이 오를 때마다 포인트 +1", "tiny", fr.sp ? AL.INK_RED : AL.INK3);
    y += 14;
    fr.attr = fr.attr ?? { str: 0, vit: 0, int: 0, agi: 0, luk: 0 };
    const btns = [];
    ATTR.forEach(([k, ko, , fx]) => {
      t(7, y, ko, "small", AL.INK);
      t(36, y, `${fr.attr[k]}`, "small", AL.INK_RED);
      const ds = t(54, y + 2, fx(fr.attr[k]), "tiny", AL.INK2, { wordWrap: { width: TW - 80, useAdvancedWrap: !0 } });
      fr.sp > 0 && btns.push([k, y]);
      y += Math.max(16, ds.height + 6);
    });
    B.statBtns = btns;
  } else {
    title = it.name;
    tint = AL.RAR_HDR[IT.RARITY_OF(it)];
    y = 4;
    const ic = h.add.image(16, y + 12, itemIcon(sc, it)).setDepth(d + 0.1);
    ic.setScale(22 / Math.max(ic.width, ic.height, 1));
    parts.push(ic);
    t(32, y + 1, `${IT.KIND_KO[it.kind]}${it.el ? " · " + IT.elName(it.el) : ""}`, "tiny", AL.INK);
    t(32, y + 12, it.tier === 0 ? (it.relic ? "보스 유물" : "기본") : `${it.catKo ?? ""} ${IT.TIER_KO[it.tier]}`, "tiny", AL.INK2);
    t(TW - 7, y + 1, IT.RARITY_KO?.[IT.RARITY_OF(it)] ?? "", "tiny", parRar(it)).setOrigin(1, 0);
    y += 27;
    const rl = h.add.graphics().setDepth(d + 0.1);
    rl.fillStyle(AL.C.rule, 1).fillRect(6, y, TW - 12, 1).fillStyle(AL.C.ruleHi, 0.8).fillRect(6, y + 1, TW - 12, 1);
    parts.push(rl);
    y += 5;
    const line = (s, col = AL.INK) => {
      const o = t(7, y, s, "tiny", col, { wordWrap: { width: TW - 14, useAdvancedWrap: !0 } });
      y += o.height + 3;
    };
    line(IT.describe(it));
    it.tier > 0 && line(`재료: ${it.mats.map((m) => IT.BASE[m]?.name ?? m).join(" + ")}`, AL.INK2);
    if (it.kind === "skill" || it.kind === "magic") {
      const mana = itemMana(it);
      line(`쿨타임 ${itemCooldown(it).toFixed(1)}초${mana ? ` · 마나 ${mana}` : ""}`, AL.INK_BLUE);
    }
    it.kind === "armor" && line(`방어 ${armorDefense(it)}`, AL.INK_BLUE);
    it.kind === "rune" && line("장착 불가 · 융합 재료 전용", AL.INK_RED);
    const e = B.hover.e;
    const hint = B.hover.res ? "융합 결과물" : fr.stash && e?.where === "stash" ? "우클릭: 가방으로" : fr.stash && e?.where === "bag" ? "우클릭: 창고로" : e?.where === "eq" ? "우클릭: 해제" : `우클릭: 장착 · 판매 ${sellPrice(sc, it)}G`;
    y += 2;
    t(7, y, hint, "tiny", AL.INK3);
    y += 10;
  }
  const hdr = 15, TH = hdr + 2 + y + 4;
  // 자리: 칸이 창고 쪽이면 창고 오른쪽, 아니면 가방 창 왼쪽
  const hv = B.hover;
  const left = hv && hv.x < W / 2 && B.stashRight ? B.stashRight + 4 : (B.panelX ?? W - BAG_W - 6) - TW - 4;
  const top = Math.max(6, Math.min(Hh - TH - 6, hv ? hv.y - (hv.s ?? 24) / 2 - 2 : 6));
  const P = AL.panel(h, left, top, TW, TH, { title: cut(title, 18), tint, depth: d });
  B.det.push(...P.objs);
  for (const o of parts) (o.setPosition(o.x + left, o.y + P.top), o.setScrollFactor?.(0), B.det.push(o));
  if (!it && fr.sp > 0)
    for (const [k, yy] of B.statBtns ?? []) {
      const b = AL.btn(h, left + TW - 22, P.top + yy - 1, 15, 13, "+", () => addAttr(h, k, 1), { depth: d + 0.2, primary: !0, font: "tiny" });
      B.det.push(...b.objs);
    }
}
const ink2 = (css) => SCR.ink(css);
function renderInfo() {}
function hideTip() {}
function showTip() {}
function moveTip() {}
function takeOut(fr, s) {
  if (s.where === "stash") {
    const it = fr.stashView?.[s.key];
    const i = it ? fr.stash.indexOf(it) : -1;
    i >= 0 && fr.stash.splice(i, 1);
    return it;
  }
  if (s.where === "eq") {
    const it = fr.equip[s.key];
    fr.equip[s.key] = null;
    return it;
  }
  const P = bagSlots(fr);
  const it = P[s.key];
  bagReplace(fr, it, null);
  P[s.key] = null;
  return it;
}
function doFuse(h, result, cost) {
  const B = h.frBag;
  const sc = B.sc, fr = sc.fr;
  if (fr.stones < cost) return void R.j.play("error");
  fr.stones -= cost;
  const sel = B.sel.filter((s) => s.item);
  // 장착 칸 재료가 있으면 결과물은 그 칸으로
  const eqSlot = sel.find((s) => s.where === "eq" && slotFits(s.key, result))?.key;
  // 가방 인덱스가 큰 것부터 제거
  const P = bagSlots(fr);
  const bagSel = sel.filter((s) => s.where === "bag");
  const firstSlot = bagSel.length ? Math.min(...bagSel.map((s) => s.key)) : -1;
  for (const s of sel.filter((s) => s.where === "eq")) fr.equip[s.key] = null;
  for (const s of bagSel) (bagReplace(fr, s.item, null), (P[s.key] = null));
  if (eqSlot) fr.equip[eqSlot] = result;
  else {
    const auto = SLOT_KEYS.find((k) => !fr.equip[k] && slotFits(k, result));
    auto ? (fr.equip[auto] = result) : fr.bag.push(result);
  }
  fr.equip.weapon || (fr.equip.weapon = fr.bag.find((x) => x.kind === "weapon") ?? IT.makeBase("W01"));
  fr.equip.armor || (fr.equip.armor = fr.bag.find((x) => x.kind === "armor") ?? IT.makeBase("A01"));
  fr.bag = fr.bag.filter((x) => x !== fr.equip.weapon && x !== fr.equip.armor);
  firstSlot >= 0 && fr.bag.includes(result) && !P.includes(result) && (P[firstSlot] = result);
  fr.fused++;
  noteFound(fr, result);
  applyLoadout(sc);
  B.sel = [];
  B.msg = `융합 완료: ${result.name}`;
  fusionFx(h, result);
  renderBag(h);
}
function slotFits(k, it) {
  return (k === "weapon" && it.kind === "weapon") || (k === "armor" && it.kind === "armor") || ((k === "s1" || k === "s2" || k === "magic") && (it.kind === "skill" || it.kind === "magic"));
}
function fusionFx(h, it) {
  const c = it.el ? elColor(it.el) : rarityColor(it);
  const cx = h.frBag?.altar?.x ?? R.ot / 2, cy = h.frBag?.altar?.y ?? R.xt / 2;
  h.cameras.main.shake(160, 0.006);
  R.j.play("hit");
  const fl = h.add.rectangle(0, 0, R.ot, R.xt, c, 0.5).setOrigin(0).setDepth(99).setBlendMode(R.zt.BlendModes.ADD);
  h.tweens.add({ targets: fl, alpha: 0, duration: 500, onComplete: () => fl.destroy() });
  for (let i = 0; i < 24; i++) {
    const s = h.add.image(cx, cy, "px1").setTint(i % 3 ? c : 0xffffff).setScale(3).setDepth(99).setBlendMode(R.zt.BlendModes.ADD);
    const a = (i / 24) * Math.PI * 2;
    h.tweens.add({ targets: s, x: cx + Math.cos(a) * rnd(80, 180), y: cy + Math.sin(a) * rnd(60, 140), alpha: 0, scale: 0.5, duration: 700, ease: "Cubic.easeOut", onComplete: () => s.destroy() });
  }
  const t = R.ct(h, cx, cy - 20, it.name, "title", rarCss(it), { stroke: "#140e18", strokeThickness: 6 }).setOrigin(0.5).setDepth(100).setScale(1.6).setAlpha(0);
  h.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: "Back.easeOut", yoyo: !0, hold: 700, onComplete: () => t.destroy() });
  R.j.play("levelup");
}
function equip(h, s, slot) {
  const B = h.frBag;
  const fr = B.sc.fr;
  const it = takeOut(fr, s);
  const old = fr.equip[slot];
  fr.equip[slot] = it;
  old && fr.bag.push(old);
  applyLoadout(B.sc);
  B.sel = [];
  B.msg = `장착: ${it.name}`;
  R.j.play("buy");
  renderBag(h);
}
function unequip(h, s) {
  const B = h.frBag;
  const fr = B.sc.fr;
  if (fr.bag.length >= fr.bagMax) return;
  const it = takeOut(fr, s);
  it && fr.bag.push(it);
  applyLoadout(B.sc);
  B.sel = [];
  renderBag(h);
}
function sell(h, s) {
  const B = h.frBag;
  const sc = B.sc, fr = sc.fr;
  const it = takeOut(fr, s);
  const g = sellPrice(sc, it);
  bagGold(sc, g);
  B.sel = [];
  B.msg = `${it.name} 판매 +${g}G`;
  R.j.play("coin");
  renderBag(h);
}
export function bagOpen(h) {
  return !!h.frBag;
}
export function closeBagHud(h) {
  closeBag(h);
}
let PANELS = null;
export function panels() {
  return (PANELS = PANELS ?? makeHubPanels());
}

// ── 허브 상점·장비 관리 ─────────────────────────────
export function panelFrame(P, S, title) {
  return SCR.panelFrame(P, S, title, R);
}
export function makeHubPanels() {
  if (R) return SCR.makeScreens(R, { mkItem, kindOf, itemIcon, IT, sd, STARTER, elCss, shopPrice, matCost, hubSellPrice, rarityDeco, BAG_MAX, refresh: (sc) => sc.player?.applyStats?.(hubStats(sc)) });
  return makeHubPanelsOld();
}
function makeHubPanelsOld() {
  const { Ne, it: SAVE, j, q, yt } = R;
  const KO = { weapon: "무기", armor: "방어구", skill: "스킬", magic: "마법" };
  const refresh = (sc) => sc.player?.applyStats?.(hubStats(sc));
  // 상점: 자기 품목만 판다
  class FrShop extends Ne {
    constructor(scene, onClose, kinds, title) {
      super(scene, title, onClose);
      this.kinds = kinds;
      this.tab = 0;
      this.k2 = (e) => {
        if (this.closed || this.kinds.length < 2) return;
        const k = e.key;
        (k === "q" || k === "Q" || k === "ArrowLeft" || k === "e" || k === "E" || k === "ArrowRight") && ((this.tab = (this.tab + 1) % this.kinds.length), (this.sel = 0), j.play("click"), this.render());
      };
      scene.input.keyboard.on("keydown", this.k2);
      this.render();
    }
    close() {
      this.scene.input.keyboard.off("keydown", this.k2);
      super.close();
    }
    list() {
      const k = this.kinds[this.tab];
      return [...STARTER[k], ...(sd().shop ?? []).filter((x) => kindOf(x.key) === k).map((x) => [x.key, x.price])];
    }
    count() {
      return this.list().length;
    }
    primary() {
      const [id, price] = this.list()[this.sel];
      const d = sd();
      if (d.owned.includes(id)) return;
      if (!SAVE.spend(price)) return void j.play("error");
      d.owned.push(id);
      const k = kindOf(id);
      if (k === "skill") !d.equip.s1 ? (d.equip.s1 = id) : !d.equip.s2 && (d.equip.s2 = id);
      else if (k === "magic") !d.equip.magic && (d.equip.magic = id);
      SAVE.write();
      j.play("buy");
      refresh(this.scene);
      this.render();
    }
    build() {
      const d = sd();
      if (this.kinds.length > 1)
        this.kinds.forEach((k, i) => this.btn(R.Ot + 10 + i * 60, R.Wt + 26, 56, 16, KO[k], () => ((this.tab = i), (this.sel = 0), this.render()), { style: i === this.tab ? "green" : void 0 }));
      const top = R.Wt + (this.kinds.length > 1 ? 46 : 30);
      const L = this.list();
      L.forEach(([id, price], i) => {
        const b = mkItem(id);
        const own = d.owned.includes(id);
        this.listItem(i, top + i * 27, itemIcon(this.scene, b), b.name, own ? "보유" : `${yt(price)} 골드`, own ? q.text : q.gold, own ? q.textDim : q.gold, own ? "owned" : "buy", () => {});
      });
      const [id, price] = L[Math.min(this.sel, L.length - 1)];
      const it = mkItem(id);
      const b = IT.BASE[id] ?? { ...it, fused: 1 };
      const C = R.Ot + 216, E = R.Wt + 30, W = R.ne - 226;
      this.box(C, E, W, R.Qt - 40);
      this.img(C + 26, E + 24, itemIcon(this.scene, it)).setScale(2);
      this.t(C + 52, E + 8, b.name, "big", it.el ? elCss(it.el) : q.gold);
      this.t(C + 52, E + 26, `${IT.KIND_KO[b.kind]}${it.el ? " · " + IT.elName(it.el) : ""} · ${b.fused ? (it.catKo ?? "") + " · " + IT.TIER_KO[it.tier] + " (탐험에서 발견)" : "기초 아이템"}`, "tiny", b.fused ? "#ffb060" : q.textDim);
      let y = E + 50;
      const tx = (str, st = "small", col = q.text) => {
        const t = this.t(C + 10, y, str, st, col, this.wrap(str, W - 20));
        y += t.height + 4;
      };
      if (b.fused) (tx(IT.describe(it)), tx(`재료: ${it.mats.map((m) => IT.BASE[m]?.name ?? m).join(" + ")}`, "tiny", q.textDim));
      else if (b.kind === "weapon") (tx(`기본 공격: ${b.attack}`), tx(`특수 동작: ${b.special}`), tx(`속도 ${b.speed} · 사거리 ${b.range}`, "tiny", q.textDim));
      else if (b.kind === "skill") (tx(b.desc), tx(`쿨타임 ${b.cd}초 · 피해 ${b.dmg}`, "tiny", "#8ab8ff"));
      else if (b.kind === "magic") (tx(b.desc), tx(`마나 ${b.mana} · 피해 ${b.dmg}`, "tiny", "#8ab8ff"));
      else if (b.kind === "armor") (tx(`방어 ${b.defense}`), tx(b.desc));
      b.fused || tx(`특성: ${(b.traits ?? []).join(", ") || "없음"}`, "tiny", q.textDim);
      y += 6;
      tx("산 장비는 장비 관리소에서 출발 장비로 장착합니다. 탐험 중에는 다른 아이템과 융합할 수 있습니다.", "tiny", "#ffb060");
      const own = d.owned.includes(id);
      const by = E + R.Qt - 66;
      own ? this.btn(C + 8, by, 170, 22, "보유 중", () => {}, { enabled: !1 }) : this.btn(C + 8, by, 170, 22, `구매 · ${yt(price)} 골드`, () => this.primary(), { style: "green", enabled: SAVE.data.gold >= price });
      this.t(C + 10, by + 26, "", "tiny", q.textDim);
    }
  }
  // 장비 관리소: 보유 장비만 장착
  const SL = [["weapon", "무기", ["weapon"]], ["s1", "Q 칸", ["skill", "magic"]], ["s2", "E 칸", ["skill", "magic"]], ["magic", "R 칸", ["skill", "magic"]], ["armor", "방어구", ["armor"]]];
  class FrLoadout extends Ne {
    constructor(scene, onClose) {
      super(scene, "장비 관리소 · 출발 장비", onClose);
      this.pickSel = 0;
      this.render();
    }
    count() {
      return SL.length;
    }
    options() {
      const d = sd();
      const [key, , kinds] = SL[this.sel];
      const opt = d.owned.filter((id) => kinds.includes(kindOf(id)));
      return key === "weapon" || key === "armor" ? opt : [null, ...opt];
    }
    primary() {
      const o = this.options();
      if (!o.length) return;
      this.pickSel = (this.pickSel + 1) % o.length;
      this.equip(o[this.pickSel]);
    }
    equip(id) {
      const d = sd();
      const key = SL[this.sel][0];
      if (id && (key === "s1" || key === "s2" || key === "magic")) for (const k of ["s1", "s2", "magic"]) k !== key && d.equip[k] === id && (d.equip[k] = null);
      d.equip[key] = id;
      SAVE.write();
      j.play("buy");
      refresh(this.scene);
      this.render();
    }
    build() {
      const d = sd();
      SL.forEach(([key, ko], i) => {
        const id = d.equip[key];
        const it = id ? mkItem(id) : null;
        this.listItem(i, R.Wt + 30 + i * 27, it ? itemIcon(this.scene, it) : "icon_lock", ko, it ? it.name : "비어 있음", q.text, it ? q.gold : q.textDim, "owned", () => (this.pickSel = 0));
      });
      const C = R.Ot + 216, E = R.Wt + 30, W = R.ne - 226;
      this.box(C, E, W, R.Qt - 40);
      const [key, ko] = SL[this.sel];
      this.t(C + 10, E + 6, `${ko} — 보유한 장비`, "big", q.gold);
      const o = this.options();
      o.forEach((id, i) => {
        const x = C + 10 + (i % 6) * 62, y = E + 32 + Math.floor(i / 6) * 58;
        const on = d.equip[key] === id;
        const box = this.box(x, y, 56, 52, on ? "ui_inner_sel" : "ui_inner").setInteractive({ useHandCursor: !0 });
        box.on("pointerdown", () => this.equip(id));
        if (id) {
          const it = mkItem(id);
          this.img(x + 28, y + 18, itemIcon(this.scene, it)).setScale(1.4);
          this.t(x + 28, y + 36, it.name, "tiny", on ? q.gold : q.text).setOrigin(0.5, 0);
        } else this.t(x + 28, y + 20, "해제", "small", q.textDim).setOrigin(0.5, 0);
      });
      o.length || this.t(C + 10, E + 36, "보유한 장비가 없습니다. 상점에서 구매하세요.", "small", q.textDim);
      this.t(C + 10, E + R.Qt - 58, "", "tiny", q.textDim);
    }
  }
  return { FrShop, FrLoadout };
}

export const compEl = (a, b) => (a === b ? a : IT.compOf(a, b));

export const regionFx = (sc, reg) => (ATMO.regionFx(sc, reg), LOOK.region(sc, reg));
export const parallax = (sc, C) => (ATMO.parallax(sc, C, Math.max(0, R.OREF - R.xt - sc.cameras.main.scrollY)), DEPTH.update(sc));
// 무리 크기
export function packSize(def, rng) {
  const t = def?.frType;
  if (t === "돌진") return rng.int(2, 3);
  if (t === "공중") return rng.chance(0.55) ? rng.int(2, 3) : 1;
  if (t === "근접") return rng.chance(0.4) ? 2 : 1;
  if (t === "원거리") return rng.chance(0.25) ? 2 : 1;
  return 1;
}
export const hubFx = (sc, gy, w) => ATMO.hubFx(sc, gy, w);
export const buildHub = (sc, gy) => HUB4.buildHub(sc, { ...R, HUBW: HUB4.HUB_W }, gy);
export const hubParallax = (sc, h2) => HUB4.hubParallax(sc, h2);
// 타이틀 (거점 마을 배경 · 단조 로고 · 철판 메뉴)
export const buildTitle = (sc, o) => T2.buildTitle(sc, { buildHub, hubParallax, HUB_W: HUB4.HUB_W }, o);
export const titleUpdate = (sc) => T2.titleUpdate(sc, { hubParallax });

export const _IT = IT;
export const _interp = interp;

export function bootLate(scene) {
  PAPER.installPaper(R.zt);
  UI.makeUiTextures(scene, R.ht, R.lt);
  AL.installGlobal(scene);
  const sizeOf = (k, base) => {
    const key = `${k}_${base}`;
    if (!scene.textures.exists(key)) return [0, 0];
    const f = scene.textures.get(key).get(0);
    return [f.width, f.height];
  };
  makeMobs(scene, R.ht, R.Et, R.Os, R.Mi, sizeOf, R.frTint);
  PROPS.remakeDecor(scene);
  PROPS.remakeChests(scene);
  FOES.bootFoeArt(scene);
  HUBART.makeHubArt(scene, R.ht, R.lt);
  HUBART.makeEmblem(scene, R.ht, R.lt);
  for (const w of R.ce) R.lt(scene, `w_${w.id}`, HUBART.polishWeapon(R.fn(w)));
  const NPC = {
    // 바이킹 마을 사람들 (char.js: hair · beard · fur · shoulder)
    npc_smith: { body: 0x6a4a32, trim: 0x3a2418, dark: 0x3a3030, helm: "bandana", cape: 0x5a3a24, hair: "black", beard: 2, shoulder: "pad" },
    npc_armorer: { body: 0x646a74, trim: 0x4a5060, dark: 0x34343e, helm: "helm", cape: 0x34405a, hair: "black", beard: 2, shoulder: "plate" },
    npc_trainer: { body: 0x9a3a2a, trim: 0x3a2418, dark: 0x4a3a22, helm: "horns", cape: 0x6a4a2a, hair: "red", beard: 2, shoulder: "fur" },
    npc_mage: { body: 0x4a4a7a, trim: 0xd8b040, dark: 0x2a2a3a, helm: "hood", glow: 0xa0e0ff, cape: 0x2a2a4a, hair: "grey", beard: 2, skirt: !0 },
    npc_quarter: { body: 0x3a7a5a, trim: 0xe0c070, dark: 0x2a3a30, helm: "bandana", cape: 0x8a7a5a, hair: "blond", beard: 1 },
    npc_scribe: { body: 0xb0a080, trim: 0x6a4a2a, dark: 0x5a4a3a, helm: "none", skirt: !0, cape: 0x8a6a4a, hair: "blond", beard: 0, braid: !0 },
  };
  for (const [k, look] of Object.entries(NPC)) makeNpc(scene, R.ht, R.Et, R.As, k, look);
}
export function titleFx(scene) {
  HUBART.titleFx(scene, R);
}
export function tiles(scene, reg, key) {
  const theme = reg.theme ?? reg.id;
  R.Et(scene, key, makeTiles(R.ht, theme, reg.pal), 16, 16);
  return !0;
}

// ── 발견한 아이템 → 상점 등록 ───────────────────────
// 저장 키: 기본 아이템은 "W02", 등급이 있으면 "W02@3". 융합품은 "id|속성|단계(@등급)"
const itemKey = (it) => {
  const g = IT.gradeOf(it);
  const k = it.tier === 0 ? it.id : `${it.id}|${it.el ?? "-"}|${it.tier}`;
  return g > 1 ? `${k}@${g}` : k;
};
const snapItem = (it) => {
  const o = {};
  for (const [k, v] of Object.entries(it)) k[0] !== "_" && k !== "uid" && (o[k] = v);
  return JSON.parse(JSON.stringify(o));
};
// 저장 키(기본 id 또는 융합 키) → 아이템
export function mkItem(id) {
  if (!id) return null;
  const [bid, gs] = String(id).split("@");
  if (IT.BASE[bid]) return IT.makeBase(bid, Number(gs) || 1);
  const sv = sd().items?.[id];
  if (!sv) return null;
  return { ...JSON.parse(JSON.stringify(sv)), uid: `sv_${id.replace(/[^\w]/g, "_")}` };
}
const kindOf = (id) => (id ? IT.BASE[String(id).split("@")[0]]?.kind ?? sd().items?.[id]?.kind ?? null : null);
function noteFound(fr, it) {
  if (!it || it.kind === "rune") return;
  fr.foundList = fr.foundList ?? {};
  fr.foundList[itemKey(it)] = it;
}
export function snapFound(scene) {
  const fr = scene.fr;
  if (!fr || !scene.run) return;
  for (const k of SLOT_KEYS) noteFound(fr, fr.equip[k]);
  scene.run.frFound = Object.entries(fr.foundList ?? {}).map(([key, it]) => ({ key, item: snapItem(it) }));
}
const UNLOCK_PRICE = (it) => (it.tier >= 3 ? 1200 : it.tier === 2 ? 700 : it.tier === 1 ? 420 : 220);

// ── 상점 값·창고 ────────────────────────────────────
const FREE_KEYS = new Set(Object.values(STARTER).flat().filter((x) => x[1] === 0).map((x) => x[0]));
// 기본 아이템의 Ⅰ 등급 값
function basePrice(id) {
  for (const L of Object.values(STARTER)) for (const [k, p] of L) if (k === id) return p || 100;
  const sh = (sd().shop ?? []).find((x) => x.key === id);
  return sh ? sh.price : 220;
}
export const shopPrice = (id, g) => Math.round(basePrice(id) * IT.GRADE_PRICE[g]);
// 등급 g를 사는 데 드는 재료 {mat, n}
export const matCost = (g) => null; // 재료는 뺐다
// 거점 창고에서 팔 때 값 (산 값의 30%)
export function hubSellPrice(key) {
  if (FREE_KEYS.has(key)) return 0;
  const it = mkItem(key);
  if (!it) return 0;
  const g = IT.gradeOf(it);
  return it.tier === 0 ? Math.round(shopPrice(it.id, g) * 0.3) : Math.round(UNLOCK_PRICE(it) * IT.GRADE_PRICE[g] * 0.5);
}
function stash(d, it) {
  const key = itemKey(it);
  if (it.tier !== 0) (d.items = d.items ?? {}), (d.items[key] = snapItem(it));
  FREE_KEYS.has(key) || d.owned.push(key);
  return key;
}

// ── 탐험 끝: 살아서 돌아오면 전부 창고로, 쓰러지면 전부 잃는다 ─────
export function settleLoot(sc, safe) {
  const fr = sc.fr;
  if (!fr || fr.settled || !sc.run) return;
  fr.settled = 1;
  const d = sd();
  const items = [...SLOT_KEYS.map((k) => [k, fr.equip[k]]), ...fr.bag.map((it) => [null, it])].filter(([, it]) => it);
  const out = { safe: !!safe, items: [], mats: { ...(fr.mats ?? {}) }, runeGold: 0, newShop: [] };
  if (safe) {
    for (const k of SLOT_KEYS) d.equip[k] = null;
    d.bag = [];
    for (const [slot, it] of items) {
      // 가방 물건은 가방에 그대로 (알비온식, 2026-11-28) — 장착한 물건만 창고·장착으로
      if (!slot) {
        const key = bagKeyOf(d, it);
        d.bag.length < BAG_MAX ? d.bag.push(key) : stash(d, it);
        out.items.push({ key, item: snapItem(it) });
        if (it.tier === 0 && !it.relic && !FREE_KEYS.has(it.id) && !Object.values(STARTER).flat().some((x) => x[0] === it.id) && !(d.shop ?? []).some((x) => x.key === it.id)) {
          (d.shop = d.shop ?? []).push({ key: it.id, price: UNLOCK_PRICE(it) });
          out.newShop.push(it.id);
        }
        continue;
      }
      const key = stash(d, it);
      slot && (d.equip[slot] = key);
      FREE_KEYS.has(key) || out.items.push({ key, item: snapItem(it) });
      // 처음 가져온 기본 아이템은 상점에도 들어온다
      if (it.tier === 0 && !it.relic && !FREE_KEYS.has(it.id) && !Object.values(STARTER).flat().some((x) => x[0] === it.id) && !(d.shop ?? []).some((x) => x.key === it.id)) {
        (d.shop = d.shop ?? []).push({ key: it.id, price: UNLOCK_PRICE(it) });
        out.newShop.push(it.id);
      }
    }
    d.equip.weapon = d.equip.weapon ?? "W01";
    d.equip.armor = d.equip.armor ?? "A01";
    d.mats = d.mats ?? {};
    for (const [m, n] of Object.entries(out.mats)) d.mats[m] = (d.mats[m] ?? 0) + n;
    sc.run.gold += out.runeGold;
  } else {
    for (const [, it] of items) FREE_KEYS.has(itemKey(it)) || out.items.push({ key: itemKey(it), item: snapItem(it) });
    for (const k of SLOT_KEYS) d.equip[k] && !FREE_KEYS.has(d.equip[k]) && !d.owned.includes(d.equip[k]) && (d.equip[k] = null);
    d.equip.weapon = d.equip.weapon ?? "W01";
    d.equip.armor = d.equip.armor ?? "A01";
  }
  sc.run.frLoot = out;
  sc.run.frZoneName = zoneOfPlayer(sc)?.name;
  sc.run.frDeath = safe ? null : deathSummary(sc);
  R.it.write();
}

// ── 알비온식 사망 화면 (2026-11-28 · 탐험 일지 대신) ─────────
//   맞을 때마다 피해 출처를 기록해 두고(최근 15초), 쓰러지면: 쓰러뜨린 상대 · 받은 피해 내역 · 잃은 것 · 거점에서 다시 일어나기
const DMG_WIN = 15000;
const EL_SRC = { fire: "불길", poison: "독", ice: "냉기", lightning: "번개", water: "물", phys: "함정", dark: "어둠", holy: "빛" };
export function noteHurt(sc, S, dmg) {
  if (!sc?.time) return;
  const a = S?.attacker, now = sc.time.now;
  const name = a?.def?.name ?? (S?.boss ? "보스" : EL_SRC[S?.element] ?? "알 수 없는 것");
  const log = (sc.frDmgLog ??= []);
  log.push({ t: now, name, dmg, el: S?.element ?? "phys", tex: a?.sprite?.texture?.key ?? null, elite: !!a?.isElite });
  while (log.length && now - log[0].t > DMG_WIN) log.shift();
}
function deathSummary(sc) {
  const log = sc.frDmgLog ?? [], now = sc.time?.now ?? 0;
  const recent = log.filter((e) => now - e.t <= DMG_WIN);
  const by = new Map();
  for (const e of recent) {
    const g = by.get(e.name) ?? { name: e.name, dmg: 0, hits: 0, tex: e.tex, el: e.el, elite: e.elite };
    g.dmg += e.dmg;
    g.hits++;
    e.tex && (g.tex = e.tex);
    by.set(e.name, g);
  }
  const rows = [...by.values()].sort((a, b) => b.dmg - a.dmg);
  const last = sc.frDeathCause ? { name: sc.frDeathCause.name, tex: null } : recent[recent.length - 1] ?? null;
  return { rows: rows.slice(0, 6), total: rows.reduce((s, r) => s + r.dmg, 0), killer: last ? { name: last.name, tex: last.tex, elite: !!last.elite } : null };
}
export function deathScreen(scene, T) {
  const D = T?.frDeath;
  if (!D || T.abandoned) return !1;
  const { ct, Be, ot: W, xt: H } = R;
  scene.frPicked = !0; // 잃은 것은 이 화면에서 보여 준다
  const A = (o) => o;
  // 바탕: 어두운 잿빛 + 붉은 가장자리
  A(scene.add.rectangle(0, 0, W, H, 0x0a0809, 1).setOrigin(0));
  const vg = scene.add.graphics();
  for (let i = 0; i < 18; i++) {
    const a = 0.05 * (1 - i / 18);
    vg.fillStyle(0x6a0a0a, a).fillRect(0, i * 5, W, 5).fillRect(0, H - (i + 1) * 5, W, 5).fillRect(i * 6, 0, 6, H).fillRect(W - (i + 1) * 6, 0, 6, H);
  }
  for (let i = 0; i < 40; i++) scene.add.rectangle(Math.random() * W, Math.random() * H, 1, 1, 0xb0a090, 0.15 + Math.random() * 0.2);
  // 제목
  const t1 = ct(scene, W / 2, 22, "쓰러졌다", "title", "#e05040", { stroke: "#1a0606", strokeThickness: 6 }).setOrigin(0.5, 0).setAlpha(0);
  scene.tweens.add({ targets: t1, alpha: 1, y: 18, duration: 600 });
  ct(scene, W / 2, 58, `${T.frZoneName ?? "어딘가"}  ·  ${D.killer ? `${D.killer.name}에게` : "알 수 없는 이유로"}`, "small", "#c8b8a8", { stroke: "#0a0606", strokeThickness: 3 }).setOrigin(0.5, 0);
  // 패널 틀
  const panel = (x, y, w, h, title) => {
    const g = scene.add.graphics();
    g.fillStyle(0x16100c, 0.92).fillRect(x, y, w, h);
    g.lineStyle(2, 0x6a4a28, 1).strokeRect(x, y, w, h);
    g.lineStyle(1, 0x2a1a10, 1).strokeRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle(0x6a4a28, 1).fillRect(x + 10, y + 20, w - 20, 1);
    ct(scene, x + 10, y + 6, title, "tiny", "#e8c890", { stroke: "#0a0604", strokeThickness: 2 });
  };
  // 왼쪽: 쓰러뜨린 상대
  const KX = 36, KY = 82, KW = 196, KH = 196;
  panel(KX, KY, KW, KH, "쓰러뜨린 상대");
  const k = D.killer;
  if (k?.tex && scene.textures.exists(k.tex)) {
    const glow = scene.add.image(KX + KW / 2, KY + 104, "vx_glow").setTint(0xa02020).setBlendMode(R.zt.BlendModes.ADD).setScale(2.6).setAlpha(0.45);
    void glow;
    const im = scene.add.image(KX + KW / 2, KY + 150, k.tex, 0).setOrigin(0.5, 1);
    im.setScale(Math.min(3, 110 / Math.max(im.height, 1), 150 / Math.max(im.width, 1)));
  } else ct(scene, KX + KW / 2, KY + 90, k?.name === "익사" ? "물속에서 숨이 막혔다" : "…", "body", "#8a7a6a").setOrigin(0.5);
  ct(scene, KX + KW / 2, KY + 160, k?.name ?? "알 수 없음", "big", k?.elite ? "#ffb060" : "#f0e0c8", { stroke: "#0a0604", strokeThickness: 4 }).setOrigin(0.5, 0);
  k?.elite && ct(scene, KX + KW / 2, KY + 180, "정예", "tiny", "#ffb060").setOrigin(0.5, 0);
  // 오른쪽: 받은 피해 (마지막 15초)
  const PX = 248, PY = 82, PW = 356, PH = 196;
  panel(PX, PY, PW, PH, `받은 피해 · 마지막 15초 · 합계 ${Math.round(D.total).toLocaleString()}`);
  const max = Math.max(1, ...D.rows.map((r) => r.dmg));
  D.rows.forEach((r, i) => {
    const y = PY + 32 + i * 26;
    const pct = D.total ? Math.round((r.dmg / D.total) * 100) : 0;
    ct(scene, PX + 12, y, r.name, "small", r.elite ? "#ffb060" : "#e8dcc8");
    ct(scene, PX + PW - 12, y, `${Math.round(r.dmg).toLocaleString()}  ·  ${pct}%`, "tiny", "#c8b8a8").setOrigin(1, 0);
    scene.add.rectangle(PX + 12, y + 15, PW - 24, 5, 0x2a1a14).setOrigin(0);
    const bar = scene.add.rectangle(PX + 12, y + 15, 1, 5, i === 0 ? 0xc83a2a : 0x9a5a3a).setOrigin(0);
    scene.tweens.add({ targets: bar, width: Math.max(2, ((PW - 24) * r.dmg) / max), duration: 500, delay: 200 + i * 80 });
  });
  D.rows.length || ct(scene, PX + PW / 2, PY + 90, "기록된 피해가 없다", "small", "#8a7a6a").setOrigin(0.5);
  // 아래: 잃은 것
  const lost = (T.frLoot?.items ?? []).slice(0, 14);
  ct(scene, 36, 292, lost.length ? `잃은 것 ${T.frLoot.items.length}개` : "잃은 것 없음", "small", "#e8c890");
  lost.forEach((o, i) => {
    const x = 52 + i * 30, y = 326;
    scene.add.rectangle(x, y, 26, 26, 0x1a1210).setStrokeStyle(1, 0x5a3a20);
    try {
      const it = mkItem(o.key) ?? o.item;
      it && scene.add.image(x, y, itemIcon(scene, it)).setScale(0.95).setAlpha(0.75);
      it && scene.add.line(0, 0, x - 11, y - 11, x + 11, y + 11, 0xc83a2a, 0.8).setOrigin(0);
    } catch {}
  });
  const go = () => scene.leaving || scene.leave();
  const b = Be(scene, W - 196, 300, 170, 30, "거점에서 다시 일어나기", go, { style: "green" });
  void b;
  ct(scene, W - 111, 334, "Enter · Space", "tiny", "#8a7a6a").setOrigin(0.5, 0);
  scene.input.keyboard.once("keydown-ENTER", go);
  scene.input.keyboard.once("keydown-SPACE", go);
  return !0;
}

// 결과 화면: 가져온 것 / 잃은 것
export function resultPick(scene, result, done) {
  const L = result?.frLoot;
  if (!L) return !1;
  const matN = Object.values(L.mats).reduce((s, n) => s + n, 0);
  if (!L.items.length && !matN && L.safe) return !1;
  scene.frPicking = !0;
  const { ct, Ce, Be, q, ot, xt } = R;
  const objs = [];
  const add = (o) => (objs.push(o), o);
  const W = 520, H = 270, X = (ot - W) / 2, Y = (xt - H) / 2;
  const finish = () => {
    for (const o of objs) o.destroy();
    scene.frPicking = !1;
    done();
  };
  add(scene.add.rectangle(0, 0, ot, xt, 0x05040a, 0.8).setOrigin(0).setDepth(200).setInteractive());
  add(Ce(scene, X, Y, W, H, "ui_panel_gold").setDepth(201));
  add(ct(scene, X + 18, Y + 10, L.safe ? "무사히 가져온 것" : "쓰러진 자리에 남은 것", "big", L.safe ? q.text : "#c83a2a").setDepth(202));
  add(ct(scene, X + W - 18, Y + 14, L.safe ? "모두 창고에 넣었다" : "이번 탐험에 들고 간 것은 모두 잃었다", "tiny", q.textDim).setOrigin(1, 0).setDepth(202));
  add(scene.add.rectangle(X + 14, Y + 32, W - 28, 1, 0x7a5434).setOrigin(0).setDepth(202));
  add(scene.add.nineslice(X + 14, Y + 40, "ui_parch_dark", void 0, W - 28, 150, 6, 6, 6, 6).setOrigin(0).setDepth(202));
  const list = L.items.slice(0, 27);
  list.forEach((x, i) => {
    const bx = X + 24 + (i % 9) * 54, by = Y + 48 + Math.floor(i / 9) * 46;
    const it = { ...x.item, uid: `sv_${x.key.replace(/[^\w]/g, "_")}` };
    add(scene.add.nineslice(bx, by, "ui_inner", void 0, 42, 42, 4, 4, 4, 4).setOrigin(0).setDepth(203));
    const ic = add(scene.add.image(bx + 21, by + 20, itemIcon(scene, it)).setDepth(204).setScale(1.5));
    L.safe || ic.setTint(0x806060);
    const g = IT.gradeOf(it);
    g > 1 && add(ct(scene, bx + 38, by + 28, IT.GRADE_ROMAN[g], "tiny", IT.GRADE_CSS[g], { stroke: "#140e18", strokeThickness: 2 }).setOrigin(1, 0).setDepth(205));
    x.sold && add(ct(scene, bx + 21, by + 2, "판매", "tiny", "#ffe08a", { stroke: "#140e18", strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(205));
  });
  list.length || add(ct(scene, X + W / 2, Y + 104, L.safe ? "장비 말고는 가져온 것이 없다" : "잃은 장비 없음 (기본 장비뿐)", "small", q.textDim).setOrigin(0.5, 0).setDepth(203));
  let my = Y + 198;
  const ms = IT.MAT_LIST.filter((m) => L.mats[m.id]).map((m) => `${m.name} ×${L.mats[m.id]}`).join("  ·  ");
  const extra = [];
  L.runeGold && extra.push(`각인 판매 +${L.runeGold}G`);
  L.newShop.length && extra.push(`상점에 새 물건 ${L.newShop.length}종`);
  L.safe || extra.push("벌어 둔 골드도 모두 잃었다");
  extra.length && add(ct(scene, X + 20, my, extra.join("  ·  "), "tiny", L.safe ? q.gold : "#ff8a7a").setDepth(203));
  const b1 = Be(scene, X + W - 112, Y + H - 36, 96, 24, "확인", finish, { style: "green", depth: 205 });
  objs.push(...b1.container);
  return !0;
}

// ── 스탯 ─────────────────────────────────────────────
export const ATTR = [
  ["str", "힘", "#ff8a60", (n) => `공격력 +${n * 4}%`],
  ["vit", "체력", "#ff6070", (n) => `최대 체력 +${n * 6}% · 방어 +${n * 2}`],
  ["int", "지능", "#8ab8ff", (n) => `마법 피해 +${n * 6}% · 마나 +${n * 6}`],
  ["agi", "민첩", "#90ffc0", (n) => `공격 속도 +${n * 3}% · 이동 +${n * 2}%`],
  ["luk", "행운", "#ffd84a", (n) => `치명타 +${(n * 1.5).toFixed(1)}% · 치명 피해 +${n * 4}%`],
];
const SP_PER_LV = 1;
export function levelPoints(sc, n) {
  const fr = sc.fr;
  if (!fr) return;
  fr.sp = (fr.sp ?? 0) + SP_PER_LV * n;
  const p = sc.player;
  sc.fx.burst("rise", p.cx, p.cy, 24, 0xffd84a);
  sc.fx.text(p.cx, p.body.y - 44, `레벨 업! 스탯 +${SP_PER_LV * n}`, "#ffd84a");
  sc.hud?.()?.toast(`레벨 ${sc.build.level}! 능력치 포인트 [Tab]`, "#ffd84a");
  R.j.play("levelup");
}
function addAttr(h, k, n) {
  const B = h.frBag;
  const fr = B.sc.fr;
  n = Math.min(n, fr.sp ?? 0);
  if (n <= 0) return void R.j.play("error");
  fr.attr[k] += n;
  fr.sp -= n;
  const p = B.sc.player, hp0 = p.maxHp;
  applyLoadout(B.sc);
  p.maxHp > hp0 && (p.hp += p.maxHp - hp0);
  R.j.play("buy");
  renderBag(h);
}

// ── 막기 (↓ 유지, 막기 가능한 방어구가 있을 때만) ───────
// 누른 직후 0.22초 안에 막으면 완벽한 막기: 피해 0 + 공격자 기절. 그 뒤로는 정면 피해 감소.
function shieldTex(sc) {
  if (sc.textures.exists("fr_guard_shield")) return;
  const c = document.createElement("canvas");
  c.width = 14;
  c.height = 20;
  const g = c.getContext("2d");
  const P = [[1, 1], [13, 1], [13, 10], [7, 19], [1, 10]];
  const path = (inset) => {
    g.beginPath();
    P.forEach(([x, y], i) => {
      const xx = x + (x < 7 ? inset : x > 7 ? -inset : 0), yy = y + (y < 10 ? inset : -inset);
      i ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
    });
    g.closePath();
  };
  g.fillStyle = "#2a2230"; path(0); g.fill();
  g.fillStyle = "#c89a40"; path(1); g.fill();
  g.fillStyle = "#7a8296"; path(2); g.fill();
  g.fillStyle = "#a8b0c4"; g.fillRect(3, 3, 4, 6);
  g.fillStyle = "#e0b850"; g.fillRect(6, 4, 2, 10); g.fillRect(4, 7, 6, 2);
  g.fillStyle = "#ffffff"; g.fillRect(3, 3, 1, 3);
  sc.textures.addCanvas("fr_guard_shield", c);
}
export function guard(sc, held, pressed) {
  const fr = sc.fr, p = sc.player;
  if (!fr || !p) return !1;
  const can = !!fr.afx?.block;
  if (pressed && !can && !p.dead && (fr.guardWarn ?? 0) < Date.now()) {
    fr.guardWarn = Date.now() + 1500;
    sc.fx.text(p.cx, p.body.y - 36, "막기 가능한 방어구가 없습니다", "#a0a0b0");
  }
  held = held && can && !p.dead && !sc.dying && !sc.hud?.()?.modalOpen;
  if (held && !fr.guard) {
    shieldTex(sc);
    const s = sc.add.image(p.cx, p.cy, "fr_guard_shield").setDepth(32).setOrigin(0.5, 0.55);
    const gl = sc.add.image(p.cx, p.cy, "vx_glow").setTint(0xfff0b0).setBlendMode(R.zt.BlendModes.ADD).setDepth(31).setScale(0.45, 0.7).setAlpha(0);
    fr.guard = { t0: Date.now(), s, gl, raise: 0, kick: 0 };
    sc.fx.burst("spark", p.cx + p.facing * 10, p.cy, 5, 0xffe0a0);
    R.j.play("block", 0.5);
  } else if (!held && fr.guard) {
    const G = fr.guard;
    sc.tweens.add({ targets: [G.s, G.gl], alpha: 0, duration: 90, onComplete: () => (G.s.destroy(), G.gl.destroy()) });
    fr.guard = null;
  }
  const G = fr.guard;
  if (G) {
    const perfect = Date.now() - G.t0 < 220;
    G.raise = Math.min(1, G.raise + 0.25);
    G.kick = Math.max(0, G.kick - 0.12);
    // 방패를 들어 올리는 동작: 아래에서 앞으로 올라와 몸 앞에 고정, 맞으면 뒤로 밀렸다 돌아옴
    const x = p.cx + p.facing * (6 + 6 * G.raise - G.kick * 5), y = p.cy + 6 - 7 * G.raise + G.kick * 1.5;
    G.s.setPosition(x, y).setFlipX(p.facing < 0).setAngle(p.facing * (1 - G.raise) * 40 - p.facing * G.kick * 12).setScale(1 + G.kick * 0.15);
    G.gl.setPosition(x, y).setAlpha(perfect ? 0.6 : G.kick * 0.6);
    p.body.vx *= (fr.afx?.block ?? 0) >= 0.9 ? 0 : 0.8;
    p.weapons?.ws && (p.weapons.ws.alpha = 0.25);
    for (const q of sc.projectiles.list)
      q.active && q.owner === "enemy" && Math.abs(q.x - x) < 14 && Math.abs(q.y - y) < 22 && Math.sign(q.x - p.cx) === p.facing &&
        (sc.projectiles.kill(q), guardImpact(sc, x, y), perfect && guardPerfect(sc, null));
  } else p.weapons?.ws && p.weapons.ws.alpha < 1 && (p.weapons.ws.alpha = 1);
  return !!G;
}
function guardImpact(sc, x, y) {
  const G = sc.fr.guard;
  G && (G.kick = 1);
  sc.fx.burst("spark", x + sc.player.facing * 4, y, 10, 0xffe0a0);
  sc.fx.anim("hitspark", x + sc.player.facing * 4, y, { scale: 1.2, tint: 0xfff0c0 });
  sc.player.body.vx -= sc.player.facing * 60;
  R.j.play("block");
}
function guardPerfect(sc, at) {
  const p = sc.player;
  sc.fx.text(p.cx, p.body.y - 40, "완벽한 막기!", "#fff4a0");
  sc.fx.burst("spark", p.cx + p.facing * 12, p.cy, 18, 0xfff4a0);
  sc.cameras.main.flash(80, 255, 250, 210);
  sc.fx.stop?.(0.08);
  if (at && !at.dead) {
    at.statuses.apply({ type: "stun", chance: 1, dur: 1.2 }, 0);
    at.kind !== "boss" && (at.body.vx = p.facing * 260);
  }
  p.iframes = Math.max(p.iframes, 0.25);
}
function guardHurt(sc, player, S, C) {
  const G = sc.fr?.guard;
  if (!G || C <= 0) return C;
  const at = S?.attacker;
  const fromX = at ? at.body.x : S?.x;
  const front = fromX === void 0 ? !S?.dir || player.facing === -S.dir : Math.sign(fromX - player.cx) === player.facing || Math.abs(fromX - player.cx) < 6;
  if (!front) return C;
  guardImpact(sc, G.s.x, G.s.y);
  if (Date.now() - G.t0 < 220) {
    guardPerfect(sc, at);
    R.j.play("crit");
    return 0;
  }
  const fx = sc.fr.afx ?? {};
  fx.blockStun && at && !at.dead && at.statuses.apply({ type: "stun", chance: 1, dur: 0.8 }, 0);
  return C * (1 - Math.min(0.9, Math.max(0.6, fx.block ?? 0.6)));
}

// ── 충전 공격 (좌클릭 유지 → 놓으면 강타) ───────────
// 설명에 "충전"이 있는 무기만. 짧게 누르면 평소 공격, 0.2초 넘게 누르면 충전.
function chargeInfo(w) {
  if (!w) return null;
  const prim = w.tier === 0 ? w.id : w.primary;
  const b = IT.BASE[prim] ?? {};
  const txt = [w.desc, b.desc, b.attack, b.special, ...(w.mats ?? []).map((m) => IT.BASE[m]?.desc)].join(" ");
  if (!/충전/.test(txt)) return null;
  const arch = IT.weaponArch(prim)[0];
  const mx = txt.match(/최대(?: 충전)?(?: 일격이)? (\d+)%/) ?? txt.match(/충전[^.]*?\((\d+)%\)/) ?? txt.match(/충전 시[^.]*?\((\d+)%\)/);
  const ranged = arch === "bow" || arch === "crossbow";
  return { arch, ranged, max: mx ? Number(mx[1]) / 100 : ranged ? 2.5 : arch === "greatsword" || arch === "hammer" ? 4 : 3, full: /충전 시간 \+(\d+)%/.test(txt) ? 1.2 * (1 + Number(txt.match(/충전 시간 \+(\d+)%/)[1]) / 100) : ranged ? 0.8 : 1.1, txt, w, ember: (w.mats ?? []).includes("B01") || w.id === "B01" };
}
export function chargeInput(sc, held) {
  const fr = sc.fr, p = sc.player;
  if (!fr || !p || p.dead || sc.hud?.()?.modalOpen || fr.guard) {
    fr?.chg && chargeCancel(sc);
    return held;
  }
  const info = chargeInfo(fr.equip.weapon);
  if (!info) return held;
  const dt = Math.min(0.05, (sc.game?.loop?.delta ?? 16) / 1000);
  if (held) {
    const C = (fr.chg = fr.chg ?? { t: 0, lv: 0, info });
    C.t += dt;
    if (C.t < 0.2) return !0;
    chargeFx(sc, C);
    return !1;
  }
  if (fr.chg) {
    const C = fr.chg;
    chargeCancel(sc);
    C.t >= 0.4 && chargeRelease(sc, C);
  }
  return !1;
}
function chargeCancel(sc) {
  const C = sc.fr.chg;
  if (!C) return;
  C.g?.destroy();
  C.g2?.destroy();
  sc.fr.chg = null;
}
function chargeFx(sc, C) {
  const p = sc.player;
  const el = C.info.w.el;
  const col = el ? elColor(el) : 0xffe0a0;
  const k = Math.min(1, (C.t - 0.2) / C.info.full);
  if (!C.g) {
    C.g = sc.add.image(p.cx, p.cy, "vx_glow").setTint(col).setBlendMode(R.zt.BlendModes.ADD).setDepth(31);
    C.g2 = sc.add.image(p.cx, p.cy, "vx_ring").setTint(col).setBlendMode(R.zt.BlendModes.ADD).setDepth(31);
  }
  const hx = p.cx + p.facing * 8, hy = p.cy - 6;
  C.g.setPosition(hx, hy).setScale(0.3 + k * 0.7).setAlpha(0.4 + k * 0.4 + Math.sin(sc.time.now / 40) * 0.1);
  C.g2.setPosition(hx, hy).setScale(1.2 - ((sc.time.now / 300) % 1) * 0.9).setAlpha(0.6 * (1 - ((sc.time.now / 300) % 1)));
  if (Math.random() < 0.6) {
    const a = Math.random() * 6.28, r = 26 + Math.random() * 14;
    const s = sc.add.image(hx + Math.cos(a) * r, hy + Math.sin(a) * r, "vx_soft").setTint(col).setBlendMode(R.zt.BlendModes.ADD).setDepth(31).setScale(0.5);
    sc.tweens.add({ targets: s, x: hx, y: hy, scale: 0.1, duration: 220, onComplete: () => s.destroy() });
  }
  el && Math.random() < 0.4 && VFX.trail(sc, el, hx, hy);
  p.body.vx *= 0.85;
  const lv = k >= 1 ? 2 : k >= 0.5 ? 1 : 0;
  if (lv > C.lv) {
    C.lv = lv;
    sc.fx.burst("spark", hx, hy, lv === 2 ? 16 : 8, col);
    lv === 2 && sc.fx.text(p.cx, p.body.y - 38, "최대 충전!", "#ffd84a");
    R.j.play(lv === 2 ? "levelup" : "click", lv === 2 ? 0.5 : 0.8);
  }
}
function chargeRelease(sc, C) {
  const info = C.info, w = info.w, p = sc.player;
  const k = Math.min(1, (C.t - 0.2) / info.full);
  const mult = 1.2 + (info.max - 1.2) * k;
  const K = makeK(sc, w, { el: w.el, mult: 1 }, !1);
  K.spec = null;
  const A = SP.mkA(K);
  const d = p.facing, el = w.el;
  const t = info.txt;
  const exec = /체력 30% 이하 적에게 피해 2배/.test(t);
  const hitO = (extra = {}) => ({ kb: 260 + k * 200, stag: 0.8, heavy: 1, onDmg: exec ? (u) => u.hp / u.maxHp < 0.3 && A.hit(u, mult * 0.5, { kb: 0 }) : void 0, ...extra });
  if (info.ranged || /거대 화살|화살을 쏜다/.test(t)) {
    A.shot({ spr: "p_arrow", speed: 700 + k * 300, life: 1.2, pierce: k >= 0.5 ? 99 : 0, scale: 1.4 + k * 1.2, m: mult, glow: 1 + k * 2, trail: 1, ...hitO() });
    /볼트 5발/.test(t) && A.fan(5, 0.1, { spr: "p_arrow", speed: 700, m: mult * 0.4, scale: 1.2 });
    A.snd("shoot");
  } else if (/던져|던지/.test(t) && /충전/.test(t)) {
    const P = A.shot({ spr: "p_blade", speed: 460, life: 1.6, pierce: 99, noTerrain: 1, spin: 18, scale: 2.4, m: mult * 0.7, tick: (P, dt) => { P.tb = (P.tb ?? 0) + dt; if (P.tb > 0.45) { const a = Math.atan2(p.cy - P.y, p.cx - P.x); P.vx = Math.cos(a) * 520; P.vy = Math.sin(a) * 520; P.tb > 0.5 && P.hits.clear(); Math.hypot(p.cx - P.x, p.cy - P.y) < 14 && A.end(P); } } });
  } else if (/찌르기|꿰뚫/.test(t)) {
    const x1 = p.cx + d * (90 + k * 60);
    A.beam(p.cx + d * 10, p.cy - 4, d > 0 ? 0 : Math.PI, 90 + k * 60, { m: mult, w: 8 + k * 6, fade: 260, el, ...hitO() });
    p.body.vx = d * 260;
    sc.fx.anim("fx_thrust", p.cx + d * 30, p.cy - 4, { flip: d < 0, scale: 1.6, tint: el ? elColor(el) : void 0 });
  } else {
    const reach = (/사거리가 창만큼|길게 쓸어/.test(t) ? 110 : 64) * (1 + k * 0.35);
    sc.fx.anim("fx_heavy", p.cx + d * 22, p.cy - 6, { flip: d < 0, tint: el ? elColor(el) : 0xfff0d0, scale: 1.6 + k });
    A.slash(p.cx, p.cy - 4, reach * 0.8, d > 0 ? -2.2 : Math.PI + 2.2, d > 0 ? 1 : Math.PI - 1, el, 12 + k * 8, 320);
    const gy = A.gy(p.cx + d * reach * 0.6);
    for (const u of K.trect(p.cx, p.cx + d * reach, p.body.y - 60, p.body.y + 8)) A.hit(u, mult, hitO({ up: 140 + k * 120 }));
    sc.fx.anim("fx_smash", p.cx + d * reach * 0.6, gy - 12, { scale: 1 + k, tint: el ? elColor(el) : void 0 });
    k >= 1 && (A.ring(p.cx + d * reach * 0.6, gy - 8, reach, el ?? "none", 420), A.cam(90, 255, 240, 200));
    /마나를 모두 써서 마력 폭발/.test(t) && k >= 1 && (A.boom(p.cx + d * 60, p.cy, 80, mult * 0.6 * (1 + sc.fr.mana / 100), { el: el ?? "dark", cam: 1 }), (sc.fr.mana = 0));
    /주문 탄막/.test(t) && A.fan(1 + C.lv * 2, 0.15, { spr: "orb", speed: 380, m: mult * 0.25, scale: 1.1, homing: 2 });
    A.snd("swingHeavy");
  }
  // 그레이번의 녹은 검: 충전 공격이 잔불 줄기 3개를 남김
  if (info.ember) for (let i = 1; i <= 3; i++) {
    const x = p.cx + d * i * 32;
    A.later(i * 80, () => (A.pillar(x, { delay: 0, warn: 0, w: 7, h: 70, m: 0.4, el: "fire", fx: "flame", snd: "thud" }), A.pool(x, 18, 3, { m: 0.15, el: "fire", st: { burn: 1 } })));
  }
  p.weapons?.interrupt?.();
  sc.fx.shake(2 + k * 5);
  sc.fx.stop?.(0.04 + k * 0.06);
}

export { paintChunk, prepaint, prepaintStep, paintPreview, _wkState, BANDH } from "./terrain.js";
export { designChunk, carveCaves, TOP as TOP_ROWS, UG as UG_ROWS } from "./levels.js";
export { skyRoute, carveUnderground } from "./routes.js";

// 중간 보스로 키우기: 체력·공격·크기
export function makeMidBoss(sc, a) {
  a.maxHp = Math.round(a.maxHp * 7);
  a.hp = Math.round(a.hp * 7);
  a.atk *= 1.35;
  const k = 1.5;
  a.sprite.setScale(a.sprite.scaleX * k);
  a.body.w *= 1.35;
  a.body.h *= 1.45;
  a.heavy = 1;
}

// ── 새 적 시스템 연결 ──
FOES.register("frb1", elkharn);
FOES.register("frb6", sahar);
FOES.register("frb5", kryos);
FOES.register("frb4", ignar);
FOES.register("frb2", grauk);
FOES.register("frb3", globrak);
export const foeDef = (d) => FOES.foeDef(d);
export const foeThink = (e, dt) => FOES.think(e, dt);
export const foeGoHome = (e) => FOES.goHome(e);
// 투사체 그림 키 확인: 없으면 만들 수 있는 것(점액 sl_*)은 만들고, 그래도 없으면 기본 구슬 (2026-11-28)
const PROJ_WARNED = new Set();
export function projTex(host, key) {
  const tm = host?.ph?.textures ?? host?.textures;
  if (!tm || !key || tm.exists(key)) return key;
  if (/^sl_/.test(key) && host.fx) {
    try {
      SLIME.slimeFx(host);
    } catch {}
    if (tm.exists(key)) return key;
  }
  PROJ_WARNED.has(key) || (PROJ_WARNED.add(key), console.warn("[투사체] 없는 그림:", key));
  return tm.exists("p_orb") ? "p_orb" : key;
}
// 몬스터 눈 → 플레이어 몸 사이에 바위가 있나 (0.2초마다 한 번 계산, e._blindFor = 못 본 시간)
export function foeSees(e, p, dt) {
  e._blindFor = e._blindFor ?? 0;
  if ((e._losT = (e._losT ?? 0) - dt) > 0) return (e._los || (e._blindFor += dt), e._los ?? !0);
  e._losT = 0.2;
  const W = e.host?.world;
  let ok = !0;
  if (W?.solidAtPx) {
    const x0 = e.cx, y0 = e.body.y - e.body.h * 0.75, x1 = p.cx, y1 = p.body.y - 14;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6);
    for (let i = 1; i < n && ok; i++) W.solidAtPx(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n) && (ok = !1);
  }
  e._los = ok;
  ok ? (e._blindFor = 0) : (e._blindFor += dt);
  return ok;
}
export const foeReady = (id) => FOES.hasSpec(id);
// ── 몬스터 영역: 태어난 구역 + 층(하늘섬·땅·지하) + 집에서 가로 480px(정예 600px) ──
// 플레이어가 영역을 벗어나면 쫓기를 그만두고 집으로 돌아가며, 그동안(그리고 플레이어가 밖에 있는 동안) 체력이 차오른다
const LEASH = 480, LEASH_ELITE = 600;
function planIfReady(sc, z) {
  const o = planOpts(sc, z);
  return ZG.hasPlan(z, o.seed) ? ZG.planOf(z, o) : null;
}
function layerOfPos(sc, x, y) {
  const W = sc.world, z = ZN.zoneAtTile(W.gtx(x));
  if (!z) return null;
  const P = planIfReady(sc, z);
  return { z, lay: P ? ZG.layerAt(P, x + W.originChunk * 512 - z.c0 * 512, y) : null };
}
// 플레이어 층: 땅을 밟고 있을 때만 바꾼다 (뛰는 중에 하늘섬으로 잘못 세지 않게). 한 프레임에 한 번만 계산
function playerLayer(sc) {
  const f = sc.game.loop.frame;
  if (sc._plL?.f === f) return sc._plL.v;
  const p = sc.player;
  let v = sc._plL?.v ?? null;
  if (p.body.onGround || !v) {
    const L = layerOfPos(sc, p.x, p.body.y);
    L?.lay && (v = { z: L.z.id, lay: L.lay });
  } else {
    const z = ZN.zoneAtTile(sc.world.gtx(p.x));
    z && z.id !== v.z && (v = { z: z.id, lay: v.lay });
  }
  sc._plL = { f, v };
  return v;
}
export function inTerritory(e, p) {
  if (e.opts?.midBoss || e.opts?.summoned || e.def.ai === "golden" || !e.host?.world || !p || p.dead) return !0;
  const sc = e.host;
  if (!e._terr) {
    const L = layerOfPos(sc, e.homeX, e._hy ?? e.body.y);
    if (!L?.lay) return !0;
    e._terr = { z: L.z.id, lay: e.opts?.layer ?? L.lay };
  }
  const pl = playerLayer(sc);
  if (!pl) return !0;
  if (pl.z !== e._terr.z || pl.lay !== e._terr.lay) return !1;
  return Math.abs(p.cx - e.homeX) <= (e.isElite ? LEASH_ELITE : LEASH);
}
// 플레이어가 영역 밖일 때 매 프레임
export function leashTick(e, dt) {
  if (e.aggro) {
    e.aggro = !1;
    e.def.foe ? FOES.goHome(e) : e.state === "chase" && e.setState("return", 5);
  }
  e.hp > 0 && e.hp < e.maxHp && (e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.15 * dt));
}
// 집에서 너무 멀리 떨어져(낭떠러지에서 떨어지는 등) 돌아갈 수 없으면 지금 자리를 새 집으로
export function rehome(e) {
  e.homeX = e.cx;
  e._hy = e.body.y;
  e._terr = null;
}
export const foeAnim = (e) => FOES.anim(e);
export const foeBlocks = (e, S) => FOES.blocks(e, S);
export const foeDamage = (e, dmg, C) => FOES.damage(e, dmg, C);
export const foeDie = (e) => FOES.onDie(e);
const BOSS_RUN = { frb0: bossRun0, frb1: bossRun1, frb2: bossRun2, frb3: bossRun3, frb4: bossRun4, frb5: bossRun5, frb6: bossRun6 };
export const foeBoss = (b, name) => (BOSS_RUN[b.def.id] ? BOSS_RUN[b.def.id](b, name, R) : b.wait(0.5));
export const foeHurt = (e) => FOES.hurtFrame(e);
export const foeFrame = (id, nm, k) => FOES.frameOf(id, nm, k);
export const foeEnsure = (scene, id) => FOES.ensure(scene, id);
// 지역 몬스터 그림 미리 만들기: 그 구역(엔진 지역 ri)이 쓰는 층 띠 몬스터 전부
export const foePreloadIds = (scene, ids) => FOES.preloadRegion(scene, -1, ids);
export const foePreload = (scene, ri) => {
  const L = R.Ht[ri]?.layers;
  L && FOES.preloadRegion(scene, -1, Object.values(L).flatMap((b) => [...b.enemies.map((e) => e.id), ...b.elites]));
  FOES.preloadRegion(scene, R.Ht[ri]?.srcIdx ?? ri);
};
// 지운 옛 몬스터 id(보스가 부르는 졸개 등) → 지금 구역의 몬스터 (가벼운 것부터)
export function foeAlias(sc, id, x, y) {
  const z = sc.world ? ZN.zoneAtTile(sc.world.gtx(x ?? sc.player?.x ?? 0)) : null;
  const L = z?.reg?.layers;
  const pool = L ? Object.values(L).flatMap((b) => b.enemies).filter((e) => FOES.hasSpec(e.id)).sort((a, b) => (a.t ?? 2) - (b.t ?? 2)) : [];
  return pool[0]?.id ?? (FOES.hasSpec("gm_slime") ? "gm_slime" : null);
}

// ── 벽 끼임 풀기: 몸이 막힌 칸과 겹치면 가장 가까운 빈 자리로 옮긴다 (스킬 순간이동·밀려남 등) ──
const _blocked = (W, x, y, w, h) => {
  const T = 16, x0 = W.gtx(x - w / 2 + 1), x1 = W.gtx(x + w / 2 - 1), y0 = Math.floor((y - h + 1) / T), y1 = Math.floor((y - 1) / T);
  for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) if (W.solid(c, r)) return !0;
  return !1;
};
export function unstick(W, b) {
  if (!b || !W?.solid || !W.gtx) return;
  const w = Math.min(b.w ?? 12, 30), h = Math.min(b.h ?? 24, 40);
  if (!_blocked(W, b.x, b.y, w, h)) return void (b._stuckT = 0);
  // 잠깐 겹치는 것은 충돌 처리에 맡기고, 3프레임 넘게 끼어 있으면 꺼낸다
  if ((b._stuckT = (b._stuckT ?? 0) + 1) < 3) return;
  let best = null, bd = 1e9;
  for (let dy = 0; dy <= 112; dy += 8)
    for (let dx = 0; dx <= 96; dx += 8)
      for (const sx of dx ? [-1, 1] : [1])
        for (const sy of dy ? [-1, 1] : [1]) {
          const d = dx * dx + dy * dy * (sy < 0 ? 1 : 1.6);
          if (d >= bd) continue;
          const nx = b.x + sx * dx, ny = b.y + sy * dy;
          !_blocked(W, nx, ny, w, h) && ((best = [nx, ny]), (bd = d));
        }
  if (best) ((b.x = best[0]), (b.y = best[1]), (b.vx *= 0.3), (b._stuckT = 0));
}

// ── 갇힘 방지: 양쪽 벽이 점프 높이보다 높은 구덩이(바닥 칸들)를 찾아 3칸마다 한쪽 발판을 놓는다 ──
export function fixTraps(r, { vt, Ft, fe, ze, plat }) {
  const at = (x, y) => (x < 0 || x >= vt || y < 0 || y >= Ft ? -1 : r[y * vt + x]);
  const floor = (x, y) => { const v = at(x, y + 1); return v !== ze && v !== -1 && v !== 7; };
  const JUMP = 4; // 이보다 높은 벽은 못 넘는다고 본다 (점프 약 5칸, 여유 1칸)
  const done = new Set();
  for (let y = 1; y < Ft - 1; y++)
    for (let x = 0; x < vt; x++) {
      if (at(x, y) !== ze || !floor(x, y) || done.has(y * vt + x)) continue;
      // 이 줄의 열린 구간
      let L = x, R = x;
      while (at(L - 1, y) === ze) L--;
      while (at(R + 1, y) === ze) R++;
      for (let q = L; q <= R; q++) done.add(y * vt + q);
      if (L <= 0 || R >= vt - 1) continue; // 조각 경계: 이어지는 쪽은 열려 있다고 본다
      if (at(L - 1, y) !== fe || at(R + 1, y) !== fe) continue;
      // 구간 안 어딘가에 바닥이 꺼져 있으면(더 내려가는 길) 그 아래에서 따로 판단
      // 양쪽 벽 높이
      const wallH = (c) => { let h = 0; while (at(c, y - h) === fe) h++; return h; };
      const hL = wallH(L - 1), hR = wallH(R + 1), need = Math.min(hL, hR);
      if (need <= JUMP) continue;
      // 이미 구간 안에 발판·땅이 계단처럼 있으면 통과
      let steps = 0;
      for (let yy = y - 1; yy > y - need; yy--) for (let q = L; q <= R; q++) at(q, yy) !== ze && at(q, yy) !== 7 && steps++;
      if (steps >= Math.floor(need / 3)) continue;
      // 3칸 간격, 좌우 번갈아 2칸짜리 발판
      for (let k = 1, yy = y - 3; yy > y - need - 1; yy -= 3, k++) {
        const left = k % 2 === 1, w = Math.min(2, R - L + 1);
        for (let d = 0; d < w; d++) {
          const q = left ? L + d : R - d;
          at(q, yy) === ze && (r[yy * vt + q] = plat);
        }
      }
    }
}

// ══ 격자 구역 지도 (알비온식 탐험) ══════════════════════
export const zoned = !0;
// 세계 시드: 모든 저장에서 1로 고정 (언제 해도 같은 지도). 예전 저장의 무작위 시드도 1로 바꾼다
export const WORLD_SEED = 1;
export function worldSeed() {
  const d = sd();
  d.worldSeed !== WORLD_SEED && ((d.worldSeed = WORLD_SEED), R.it.write());
  return WORLD_SEED;
}
export const diffDist = (A) => ZN.diffDist(A);
export const zoneEdge = (S) => {
  const z = ZN.zoneAtChunk(S);
  return !!z && (z.c0 === S || z.c1 - 1 === S);
};
export const zoneFirst = (S) => ZN.isFirst(S);
export const pocketChunk = (S) => ZN.isPocket(S);
export const pocketLast = (S) => ZN.isPocket(S) && ZN.isLast(S);
export const sameZone = (a, b) => ZN.zoneAtTile(a) === ZN.zoneAtTile(b);
export const chunkSameZone = (a, b) => ZN.zoneAtChunk(a) === ZN.zoneAtChunk(b);
// 귀환 표석은 B 귀환으로 바꿨다 (2026-11-28)
export const waystoneOk = () => !1;
export const chestRoll = (S, k, tier) => ZN.chestRoll(S, k, tier);
export const zoneOfPlayer = (sc) => (sc?.world && sc.player ? ZN.zoneAtTile(sc.world.gtx(sc.player.x)) : null);
// 구역 양 끝: 위아래 전체를 막는 절벽 벽 (2칸)
export function zoneWalls(S, data) {
  const z = ZN.zoneAtChunk(S);
  if (!z || !data?.grid || z.y < 0) return;
  const cols = [];
  z.c0 === S && cols.push(0, 1);
  z.c1 - 1 === S && cols.push(30, 31);
  // 지상 구역은 땅 위 14줄까지만 절벽 (그 위는 보이지 않는 벽), 동굴은 위아래 전체
  const from = z.y === 0 ? 70 - 14 : 0;
  for (const x of cols) for (let row = from; row < R.Ft; row++) data.grid[row * 32 + x] = 1;
}
// 밟을 수 있는 평평한 칸 찾기 (없으면 그대로). 자연 지형은 칸 전체가 1px 안으로 평평한 칸(flat)을 먼저 찾는다
const flatAt = (world, x) => {
  const C = Math.floor(x / 32), d = world.gen.get(C);
  return d.flat ? d.flat[x - C * 32] === 1 : !0;
};
function flatTile(world, t) {
  for (const strict of [!0, !1])
    for (const d of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12]) {
      const x = t + d, g = world.groundRowAt(x);
      if (!(g > 0 && world.groundRowAt(x - 1) === g && world.groundRowAt(x + 1) === g)) continue;
      if (strict ? [-1, 0, 1].every((k) => flatAt(world, x + k)) : [-1, 0, 1].every((k) => world.code(x + k, g) !== 0)) return x;
    }
  return t;
}
// ▲ 문 = 하늘 루트의 가장 높은 섬(지하 구역은 동굴 맨 위층), ▼ 문 = 지하 본길의 가장 깊은 바닥
// (예전 하늘 루트용 표시 — 이제 ▲ 문 길은 zonegen이 직접 만든다)
export const peakChunk = () => !1;
// 지상 구역: 땅 모양을 새로 (평평한 칸까지의 거리에 따라 언덕 높이를 줄인다)
export function groundShape(i, S) {
  const z = ZN.zoneAtChunk(S);
  if (!z || z.y !== 0) return;
  const flats = [z.c0, z.c1 - 1];
  z.kind === "zone" && flats.push(ZN.upChunk(z));
  z.kind === "zone" && z.boss && flats.push(z.c1 - 2);
  const flatDist = (gx) => Math.min(...flats.map((c) => (gx < c * 32 ? c * 32 - gx : gx > c * 32 + 31 ? gx - (c * 32 + 31) : 0)));
  ZG.groundShape(i, S, { vt: 32, Ft: R.Ft, seed: sd().worldSeed ?? 1, flatDist });
}
// 지상 구역 보정: 떠 있는 바위 덩어리가 아래 땅·발판과 3줄 안으로 붙어 있으면(사이에 설 수 없으면) 지운다
// (지형 조각 그림끼리, 혹은 하늘 섬이 기둥 꼭대기를 덮어 길이 막히는 것을 막는다)
export function groundRepair(S, r, vt, Ft) {
  const z = ZN.zoneAtChunk(S);
  if (!z || z.y !== 0) return;
  const N = vt * Ft, seen = new Uint8Array(N);
  const solid = (v) => v === 1 || v === 4 || v === 5;
  const st = [];
  for (let x = 0; x < vt; x++) {
    const q = (Ft - 1) * vt + x;
    solid(r[q]) && !seen[q] && ((seen[q] = 1), st.push(q));
  }
  while (st.length) {
    const q = st.pop(), x = q % vt, y = (q / vt) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || nx >= vt || ny < 0 || ny >= Ft) continue;
      const n = ny * vt + nx;
      !seen[n] && solid(r[n]) && ((seen[n] = 1), st.push(n));
    }
  }
  for (let q0 = 0; q0 < N; q0++) {
    if (seen[q0] || r[q0] !== 1) continue;
    const comp = [], inC = new Set([q0]);
    st.push(q0);
    seen[q0] = 2;
    while (st.length) {
      const q = st.pop(), x = q % vt, y = (q / vt) | 0;
      comp.push(q);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || nx >= vt || ny < 0 || ny >= Ft) continue;
        const n = ny * vt + nx;
        !seen[n] && r[n] === 1 && ((seen[n] = 2), inC.add(n), st.push(n));
      }
    }
    let bad = !1;
    for (const q of comp) {
      const x = q % vt, y = (q / vt) | 0;
      if (inC.has(q + vt)) continue;
      for (let k = 1; k <= 3 && !bad; k++) {
        const n = (y + k) * vt + x;
        if (y + k >= Ft) break;
        if (r[n] !== 0 && !inC.has(n)) bad = !0;
      }
      if (bad) break;
    }
    if (bad) for (const q of comp) r[q] = 0;
  }
}
// 지상 구역의 ▲ 문 조각: 평평한 빈터 + 하늘로 오르는 섬 계단 (원래 지형·동굴 구멍과 겹치지 않게)
export const groundPeakChunk = () => !1;
export const ladderChunk = () => !1;
// 하늘·동굴 구역은 조각 전체를 새로 채우고, 지상 구역의 ▲ 문 조각엔 꼭대기까지 징검다리를 놓는다
export function zoneGen(S, r, l, s, o) {
  const z = ZN.zoneAtChunk(S);
  if (!z) return null;
  const isZone = z.kind === "zone";
  const biome = biomeOf(z);
  const out = ZG.chunk(z, S, r, l, s, { ...o, Ft: R.Ft, up: isZone ? ZN.upChunk(z) : -1, down: isZone ? ZN.downChunk(z) : -1, biome, patterns: z.y === 0 ? z.reg?.patterns : null, runSeed: ZN.runSeed() });
  out.keepHazards = z.y === 0;
  return out;
}
// 하늘 구역(던전 포함)에는 지하 동굴이 없다
export const skyZone = (S) => (ZN.zoneAtChunk(S)?.y ?? 0) < 0;
export const shaftChunk = (S) => {
  const z = ZN.zoneAtChunk(S);
  return !!z && z.kind === "zone" && S === z.c0 + 1;
};
// 출구 자리 {tile, row, py}: py는 실제 지면 높이(px) — 자연 지형은 칸 경계에 맞지 않을 수 있다
const onGround = (world, t) => ({ tile: t, row: world.groundRowAt(t), py: world.groundYAt?.(t) ?? -1 });
function exitPos(world, z, at) {
  if (at === "L") return onGround(world, z.c0 * 32 + 3);
  if (at === "R") return onGround(world, z.c1 * 32 - 4);
  // ▲▼ 문은 설계의 꼭대기·바닥 자리가 든 조각에 있다 (맵 맨 위·맨 아래로 옮겼다, 2026-11-28)
  const P = world.scene && ZG.exitsOf(z, planOpts(world.scene, z).seed);
  if (at === "U") {
    const c = P?.peak ? z.c0 + Math.floor(P.peak.x / 512) : ZN.upChunk(z), pk = world.gen.get(c).peak;
    return pk ? { tile: c * 32 + pk.x, row: pk.row, py: pk.py ?? pk.row * 16 } : onGround(world, flatTile(world, c * 32 + 16));
  }
  if (at === "D") {
    // 하늘 구역의 ▼ 문은 맨 아래 지면 (동굴이 없다)
    const c = P?.deep ? z.c0 + Math.floor(P.deep.x / 512) : ZN.downChunk(z), dp = z.y < 0 ? null : world.gen.get(c).deep;
    return dp ? { tile: c * 32 + dp.x, row: dp.row, py: dp.py ?? dp.row * 16 } : onGround(world, flatTile(world, c * 32 + 16));
  }
  return onGround(world, flatTile(world, ZN.dungeonChunk(z) * 32 + 16));
}
function arrivePos(world, z, at) {
  if (at === "L") return onGround(world, z.c0 * 32 + 5);
  if (at === "R") return onGround(world, z.c1 * 32 - 6);
  const p = exitPos(world, z, at);
  const q = onGround(world, p.tile + 1);
  // 문 옆 칸이 같은 바닥이면 그 높이, 아니면 문 높이
  return { tile: p.tile + 1, row: p.row, py: q.row === p.row && q.py > 0 ? q.py : p.py };
}
export function travel(sc, to, back) {
  if (to === ZN.HUB_ID) return void ((HUB_ARRIVE = back), sc.extract?.());
  if (sc.zoneBusy || sc.dying) return;
  const z = ZN.BY_ID[to];
  if (!z) return;
  if (ZN.isLocked(to)) return void sc.hud?.()?.toast(ZN.isSealed(to) ? "붉은 봉인에 막혔다" : "아직 갈 수 없는 지역", "#c8c8d0");
  sc.zoneBusy = 1;
  R.j.play("portal");
  ensurePlan(sc, z);
  // 로딩 화면이 다 덮인 뒤 설계를 기다려 옮기고, 보이는 띠가 다 그려질 때까지 덮어 둔다 (그동안 게임은 멈춤)
  const L = startLoad(sc, z, () => ((sc.zoneBusy = 0), arrive(sc, z)));
  L.onOpaque.push(() =>
    ensurePlan(sc, z).then(() => {
      if (!sc.world || L.dead) return;
      const at = back ?? "L";
      const p = arrivePos(sc.world, z, at);
      sc.travelTo(p.tile, at === "R" ? -1 : 1, p.row > 0 ? p.row : null, p.py > 0 ? p.py : null);
      L.stage = "paint";
      L.t0 = L.t;
    }),
  );
}
// 로딩 화면 띄우기 (sc.frLoad 동안 게임 진행을 멈추고 지형만 불러 그린다)
function startLoad(sc, z, onDone, o = {}) {
  sc.frLoad && sc.frLoad.destroy();
  const L = showLoad(sc, z, { ct: R.ct, dangerOf: ZN.dangerOf, layerName: ZN.LAYER_NAME }, o);
  L.onDone = onDone;
  sc.frLoad = L;
  return L;
}
// 로딩 중 입력 잠금 (2026-11-28): 로딩 화면이 떠 있는 동안 + 닫힌 뒤 0.3초까지 키보드·마우스를 모두 무시한다.
// 풀 때 눌려 있던 키 상태를 비워서, 로딩 중에 누른 키가 끝나자마자 실행되지 않게 한다
const LOAD_UNLOCK_DELAY = 0.3;
function setInputLock(sc, on) {
  for (const s of [sc, sc.hud?.()]) {
    const I = s?.input;
    if (!I) continue;
    I.enabled = !on;
    if (I.keyboard) (I.keyboard.enabled = !on), I.keyboard.resetKeys?.();
  }
  sc.frInputLocked = on;
  sc.pauseReq = !1;
}
export const inputLocked = (sc) => !!sc?.frInputLocked;
// 게임 장면 update 맨 앞에서 부른다. 로딩 중이면 true (나머지 진행을 건너뛴다)
export function loadGate(sc, dt) {
  const L = sc.frLoad;
  if (!L) {
    if (sc.frInputLocked && (sc.frUnlockT = (sc.frUnlockT ?? 0) - dt) <= 0) setInputLock(sc, !1);
    return !1;
  }
  // HUD 장면은 로딩 도중에 뜨므로 매 프레임 같이 잠근다
  const hud = sc.hud?.();
  (!sc.frInputLocked || (hud?.input && hud.input.enabled)) && setInputLock(sc, !0);
  sc.frUnlockT = LOAD_UNLOCK_DELAY;
  L.update(dt);
  if (L.dead) return void (sc.frLoad = null), !1;
  if (L.closing) return !1;
  const p = sc.player;
  if (p?.body) ((p.body.vx = 0), (p.body.vy = 0), (p.iframes = Math.max(p.iframes ?? 0, 0.6)));
  if (L.stage === "paint" && sc.world) {
    sc.world.update(p.x);
    prepaintStep(8);
    sc.updateCamera(1);
    sc.updateParallax();
    let pend = 0, bands = 0;
    for (const ch of sc.world.loaded?.values() ?? []) for (const B of ch.bands?.values() ?? []) (bands++, B.rt && B.rt._frJob && pend++);
    L.total = Math.max(L.total, bands);
    L.painted = bands - pend;
    const el = L.t - (L.t0 ?? 0);
    // 보이는 띠가 다 그려지고 HUD가 떴으면 끝 (아무리 늦어도 8초)
    if (((el > 0.25 && bands > 0 && pend === 0) || el > 8) && sc.hud?.()) {
      const f = L.onDone;
      L.close();
      f && f();
    }
  }
  return !0;
}
function arrive(sc, z) {
  const d = sd();
  d.seen = d.seen ?? {};
  const first = !d.seen[z.id];
  d.seen[z.id] = 1;
  if (sc.fr && sc.run) {
    sc.fr.visited ??= {};
    sc.fr.visited[z.id] || ((sc.fr.visited[z.id] = 1), (sc.run.frZones = Object.keys(sc.fr.visited).length));
  }
  R.it.write();
  sc.time.delayedCall(800, () => sc.world && prefetchNeighbors(sc, z));
  const D = ZN.dangerOf(z);
  // 지역 이름 배너는 띄우지 않는다 (2026-11-28 사용자 요청: 맵 이름 라벨 필요 없음 — 이름은 로딩 화면에서 본다)
  void D, void first;
}
// 탐험 시작: 거점의 어느 출구로 나갔느냐에 따라 그 방향 이웃 칸, 들어오는 쪽(거점을 바라보는 쪽) 출구 자리에서
//   ◀ 서문 → 서쪽 칸 오른쪽 끝 · ▶ 동문 → 동쪽 칸 왼쪽 끝 · ▲ 하늘 승강장 → 위 칸 아래 출구 · ▼ 갱도 승강기 → 아래 칸 위 출구
const HUB_DIR = { L: [-1, 0, "R"], R: [1, 0, "L"], U: [0, -1, "D"], D: [0, 1, "U"] };
let HUB_DEST = "R", HUB_ARRIVE = null;
// 거점에 들어올 때 설 자리: 돌아온 방향의 문 앞 (서쪽 구역에서 오면 서문, 위에서 오면 하늘 승강장 …), 그 밖엔 광장
export const hubArrivalX = (def) => { const k = HUB_ARRIVE; HUB_ARRIVE = null; return HUB4.ARRIVE_X[k] ?? def; };
export const setHubDest = (d) => (HUB_DEST = HUB_DIR[d] ? d : "R");
export function zoneBegin(sc) {
  ZN.setRunSeed(sc.fr?.runSeed ?? (Math.random() * 4294967295) >>> 0);
  let [dx, dy, side] = HUB_DIR[HUB_DEST] ?? HUB_DIR.R, c = ZN.cell(dx, dy);
  if (!c || c === ZN.HUB_ID || ZN.isLocked(c.id)) ([dx, dy, side] = HUB_DIR.R), (c = ZN.cell(1, 0));
  HUB_DEST = "R";
  const z0 = c;
  // 첫 화면부터 로딩 화면으로 덮는다 (설계를 기다리는 동안 빈 시작 자리가 보이거나 움직이지 않게)
  const L = startLoad(sc, z0, () => arrive(sc, z0), { instant: 1 });
  ensurePlan(sc, z0).then(() => {
    if (sc.sys?.isActive?.() === !1 || !sc.world || L.dead) return;
    const p0 = arrivePos(sc.world, z0, side);
    sc.travelTo(p0.tile, 1, p0.row > 0 ? p0.row : null, p0.py > 0 ? p0.py : null);
    L.stage = "paint";
    L.t0 = L.t;
  });
}
export const seenCount = () => Object.keys(sd().seen ?? {}).filter((k) => ZN.BY_ID[k]?.kind === "zone").length;
// 출구 물체
export function zoneObjs(evm, S, T, traits) {
  const sc = evm.s, W = sc.world;
  const z = ZN.zoneAtChunk(S.index);
  if (!z) return;
  for (const e of ZN.exitList(z)) {
    const { tile, row, py } = exitPos(W, z, e.at);
    if (Math.floor(tile / 32) !== S.index || row <= 0) continue;
    evm.objs.push(exitObj(sc, S.index, T + (tile - S.index * 32) * 16 + 8, py > 0 ? py : row * 16, z, e));
  }
  // 떠도는 정예 무리는 지웠다 (2026-11-28 사용자 요청)
}
const EXIT_LOOK = {
  L: { arrow: "◀", tex: "fr_gate" },
  R: { arrow: "▶", tex: "fr_gate" },
  U: { arrow: "▲", tex: "fr_gate_up" },
  D: { arrow: "▼", tex: "fr_gate_down" },
  DG: { arrow: "▼", tex: "fr_gate_down" },
};
function exitObj(sc, chunk, x, y, z, e) {
  const ADD = R.zt.BlendModes.ADD;
  const dst = e.to === ZN.HUB_ID ? null : ZN.BY_ID[e.to];
  const D = dst ? ZN.dangerOf(dst) : { color: 0xffe08a, css: "#ffe08a", name: "거점" };
  const L = EXIT_LOOK[e.at];
  const tex = L.tex;
  const arch = sc.add.image(x, y + 1, tex).setOrigin(0.5, 1).setDepth(5);
  const glow = sc.add.image(x, y - 18, "fr_gate_glow").setTint(D.color).setBlendMode(ADD).setDepth(4).setAlpha(0.7);
  const what = !dst ? "거점으로 귀환 (안전)" : e.at === "DG" ? "숨은 던전" : z.kind === "dungeon" ? "던전 밖으로" : dst.name;
  const prompt = `${L.arrow} ${what}${dst && z.kind !== "dungeon" ? ` · ${D.name}` : ""}`;
  const shut = dst && ZN.isLocked(dst.id);
  const tagTxt = (!dst ? "거점" : e.at === "DG" ? "숨은 던전" : e.at === "U" ? `▲ ${dst.short}` : e.at === "D" ? `▼ ${dst.short}` : dst.short) + (shut ? ` · ${ZN.lockTag(dst.id)}` : "");
  shut && (glow.setTint(0x6a6a72), arch.setTint(0x8a8a90));
  const tag = R.ct(sc, x, y - 52, tagTxt, "tiny", shut ? "#9a9aa0" : D.css, { stroke: "#140e18", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(6);
  e.at === "DG" && sc.fr && ((sc.fr.dgSeen ??= []).includes(z.id) || sc.fr.dgSeen.push(z.id));
  const o = { chunk, x, y, sprites: [arch, glow, tag], alive: !0, prompt };
  let t = Math.random() * 6, fxT = 0;
  const up = e.at === "U" ? -1 : e.at === "D" || e.at === "DG" ? 1 : 0;
  o.update = (dt) => {
    t += dt;
    glow.setAlpha(0.55 + Math.sin(t * 2.4) * 0.2).setScale(1 + Math.sin(t * 1.7) * 0.05);
    fxT -= dt;
    if (fxT <= 0) {
      fxT = 0.2;
      up < 0 ? sc.fx.burst("rise", x + rnd(-8, 8), y - 6, 1, D.color) : sc.fx.burst("glow", x + rnd(-9, 9), y - rnd(6, 36), 1, D.color);
    }
  };
  o.interact = () => {
    if (sc.boss && !sc.boss.dead) return void sc.hud?.()?.toast("보스가 길을 막고 있다", "#ff8a7a");
    travel(sc, e.to, e.back);
  };
  return o;
}
// HUD: 거리 대신 구역 이름
export function zoneHudText(hud, run) {
  const z = zoneOfPlayer(run);
  if (!z) return !1;
  const D = ZN.dangerOf(z);
  hud.distText.text !== z.name && hud.distText.setText(z.name);
  const b = `${ZN.LAYER_NAME(z.y)} · ${D.name} ${D.label}   ·   [M] 구역 지도`;
  hud.bestText.text !== b && hud.bestText.setText(b);
  return !0;
}
export function zoneProgress(hud) {
  const run = hud.run, z = zoneOfPlayer(run);
  if (!z) return !1;
  // 위 가운데 진행 막대는 숨김 (2026-11-28). 값 계산은 그대로 둔다
  for (const n of [hud.progBg, hud.progFill, hud.progSkull, hud.progText, hud.progBest]) n?.visible && n.setVisible(!1);
  const t = run.world.gtx(run.player.x) - z.c0 * 32, len = (z.c1 - z.c0) * 32;
  hud.progFill.width = (hud.progBg.width - 2) * Math.max(0, Math.min(1, t / len));
  const dead = z.boss && run.bossDefeated.has(z.c1 - 2);
  hud.progSkull.setAlpha(z.boss && !dead ? 1 : 0.2);
  const ex = ZN.exitList(z).map((e) => EXIT_LOOK[e.at].arrow).join("");
  const s = z.boss && !dead ? `구역 끝에 보스 · 출구 ${ex}` : `출구 ${ex}`;
  hud.progText.text !== s && hud.progText.setText(s);
  return !0;
}
function toggleMap(hud) {
  if (hud.frMap) {
    for (const o of hud.frMap) o.destroy();
    hud.frMap = null;
    return;
  }
  const run = hud.run;
  if (!run?.fr) return;
  hud.frMap = ZN.drawMap(hud, R, zoneOfPlayer(run), sd().seen ?? {}, { dungeons: run.fr.dgSeen ?? [] });
  R.j.play("open");
}

export const _ZN = ZN;
export const _ZG = ZG;
export const _exitPos = (world, z, at) => exitPos(world, z, at);
// 시험 도구용: 지금 쓰는 설계 캐시 (페이지에서 natgen을 따로 import하면 다른 모듈이 된다)
export const _plans = () => ZG.planCache;
export const _save = () => sd();
export const _giveGold = (n) => ((R.it.data.gold = (R.it.data.gold ?? 0) + n), R.it.write());
// 카메라가 지금 구역 밖(옆 구역)을 비추지 않게: 구역 왼쪽 끝 ~ 오른쪽 끝 - 화면 폭
// 자연 지형 나무·폐허 그림: 처음 쓸 때 한 번 그려 텍스처로 둔다
// 움직이는 장식 층에 넘길 지금 구역의 설계 (설계가 준비된 자연 지형 구역만)
// 소리 공간: 뒷벽으로 둘러싸인 곳(굴·신전·던전) 1, 땅속 0.8, 트인 곳 0 → 효과음 울림·동굴 환경음
function audioSpace(sc) {
  const z = zoneOfPlayer(sc);
  if (!z || !planReady(sc, z)) return 0;
  const P = ZG.planOf(z, planOpts(sc, z));
  if (!P) return 0;
  const px = sc.player.cx - sc.world.lx(z.c0 * 32), py = sc.player.cy;
  if ((P.walls ?? []).some((w) => px >= w.x0 && px < w.x1 && py >= w.y0 && py < w.y1)) return 1;
  const surf = P.h ? P.h[Math.max(0, Math.min(P.h.length - 1, Math.round(px / 4)))] : 1e9;
  return py > surf + 24 ? 0.8 : 0;
}
// 장치(사다리·승강기·무너지는 판…)가 있는 구역 플랜
export const devMove = DEV.devMove;
function devSrc(sc) {
  const z = zoneOfPlayer(sc);
  if (!z || !planReady(sc, z)) return null;
  const P = ZG.planOf(z, planOpts(sc, z));
  if (!P || !P.spec || !P.spec.some((r) => r.t >= 13 || r.t === 10)) return null;
  return { key: z.id + ":" + P.seed, P, ox: sc.world.lx(z.c0 * 32), gx0: z.c0 * 512 };
}
function natAnimSrc(sc) {
  const z = zoneOfPlayer(sc);
  if (!z || !planReady(sc, z)) return null;
  const P = ZG.planOf(z, planOpts(sc, z));
  if (!P || !P.props || !P.props.length) return null;
  const key = z.id + ":" + P.seed, ox = sc.world.lx(z.c0 * 32);
  if (sc._naWarm !== key) {
    sc._naWarm = key;
    const px = sc.player.cx - ox, py = sc.player.cy, seen = new Map();
    for (const p of P.props) {
      const k = [p.k, p.s, p.v, p.acc, p.sc ?? 1, p.g ?? 0, p.ext ? 1 : 0].join(":"), d = Math.abs(p.x - px) + Math.abs(p.y - py) * 0.5;
      (!seen.has(k) || seen.get(k).d > d) && seen.set(k, { p, d });
    }
    warmProps(key, [...seen.values()].sort((a, b) => a.d - b.d).map((q) => q.p), z.reg?.pal);
  }
  return { key, P, ox };
}
export function natDecorTex(scene, key) {
  if (scene.textures.exists(key)) return;
  const D = paintDeco(key);
  const cv = document.createElement("canvas");
  cv.width = D.w;
  cv.height = D.h;
  const cx = cv.getContext("2d");
  const im = cx.createImageData(D.w, D.h);
  im.data.set(D.data);
  cx.putImageData(im, 0, 0);
  scene.textures.addCanvas(key, cv);
}
export function zoneCam(sc, camX) {
  const z = zoneOfPlayer(sc);
  if (!z) return camX;
  const l = sc.world.lx(z.c0 * 32), r = sc.world.lx(z.c1 * 32) - R.ot;
  return r > l ? Math.min(r, Math.max(l, camX)) : camX;
}
// ── 구역 설계를 다른 스레드에서 (큰 구역은 몇 초 걸린다: 그동안 화면이 멈추지 않게) ──
let NW = null, NW_N = 0;
const NW_JOBS = new Map(), NW_PEND = new Map();
function natWorker() {
  if (NW !== null) return NW;
  try {
    NW = new Worker(new URL("./natworker.js", import.meta.url), { type: "module" });
    NW.onmessage = (ev) => {
      const j = NW_JOBS.get(ev.data.id);
      NW_JOBS.delete(ev.data.id);
      j && (ev.data.error ? j.reject(ev.data.error) : j.resolve(ev.data.data));
    };
    NW.onerror = () => {
      NW = !1;
      for (const j of NW_JOBS.values()) j.reject("worker");
      NW_JOBS.clear();
    };
  } catch {
    NW = !1;
  }
  return NW;
}
const planOpts = (sc, z) => ({ seed: sc.world.gen.seed, Ft: R.Ft, up: z.kind === "zone" ? ZN.upChunk(z) : -1, down: z.kind === "zone" ? ZN.downChunk(z) : -1 });
export const planReady = (sc, z) => !z || ZG.hasPlan(z, sc.world.gen.seed);
// 설계가 준비되면 풀리는 약속 (이미 있으면 바로). 작업 스레드가 없으면 그냥 풀린다(필요할 때 그 자리에서 만든다)
export function ensurePlan(sc, z) {
  if (!z || planReady(sc, z)) return Promise.resolve();
  const o = planOpts(sc, z), key = ZG.planKey(z, o.seed);
  if (NW_PEND.has(key)) return NW_PEND.get(key);
  const W = natWorker();
  if (!W) return Promise.resolve();
  const zz = { id: z.id, kind: z.kind, c0: z.c0, c1: z.c1, x: z.x, y: z.y, boss: z.boss };
  const p = new Promise((res, rej) => {
    const id = ++NW_N;
    NW_JOBS.set(id, { resolve: res, reject: rej });
    W.postMessage({ id, z: zz, o });
  })
    .then((data) => void ZG.adoptPlan(z, o.seed, data))
    .catch((e) => console.warn("zone plan worker failed", e))
    .finally(() => NW_PEND.delete(key));
  NW_PEND.set(key, p);
  return p;
}
// 이웃 구역을 미리 (갈 수 있는 출구 쪽)
function prefetchNeighbors(sc, z) {
  const zz = z.kind === "dungeon" ? ZN.zoneOfPocket(z) : z;
  // 지금 구역과 이웃 구역 몬스터 그림을 뒤에서 미리
  // 이웃 구역 몬스터 그림 + 배경 그림(로딩 화면에 바로 보이게 · 2026-11-28)을 뒤에서 미리
  const pre = (q) => (q?.reg?.id && !sc.textures.exists(`bg_${q.reg.id}_sky`) && HOOKS.bg?.(sc, q.reg), q?.reg?.layers && FOES.preloadRegion(sc, -1, Object.values(q.reg.layers).flatMap((b) => [...b.enemies.map((e) => e.id), ...b.elites])));
  pre(zz);
  for (const e of ZN.exitList(zz)) {
    const t = ZN.BY_ID[e.to];
    t && (ensurePlan(sc, t), pre(t));
  }
}
// "지형을 만드는 중" 표시 (화면이 어두워진 동안)
function loadingNote(sc, on) {
  const hud = sc.hud?.();
  if (!hud) return;
  if (on && !hud.frLoading) hud.frLoading = R.ct(hud, R.ot / 2, R.xt / 2, "지형을 만드는 중…", "body", "#f2e6c4").setOrigin(0.5).setDepth(900).setScrollFactor(0);
  else if (!on && hud.frLoading) (hud.frLoading.destroy(), (hud.frLoading = null));
}
// 설계가 준비된 뒤 f() (준비 안 됐으면 안내 글을 띄우고 기다린다)
function whenPlanned(sc, z, f) {
  if (planReady(sc, z)) return f();
  loadingNote(sc, !0);
  ensurePlan(sc, z).then(() => {
    loadingNote(sc, !1);
    sc.sys?.isActive?.() !== !1 && sc.world && f();
  });
}


// ── 운명 보드 (V키) ─────────────────────────────────
// 가운데 → 직업 사슬(T1~T2) → 계통마다 티어 사슬(T3~T6) → 장비 전문화 마디(0~100)
// 끌어서 움직이고 휠로 확대·축소. 마디에 올리면 정보, 누르면 그 마디로 이동.
export function toggleDestiny(scene) {
  if (scene.frDestiny) return void closeDestiny(scene);
  if (scene.frBag || (scene.run && (scene.run.player?.dead || scene.run.dying))) return;
  IT.bindDestiny(R.it.data);
  const D = (scene.frDestiny = { objs: [], z: 0.45, x: 0, y: 0, drag: null, hover: null });
  D.esc = () => closeDestiny(scene);
  scene.input.keyboard.on("keydown-ESC", D.esc);
  R.j.play("open");
  buildDestiny(scene);
}
function closeDestiny(scene) {
  const D = scene.frDestiny;
  if (!D) return;
  for (const o of D.objs) o.destroy();
  scene.input.keyboard.off("keydown-ESC", D.esc);
  scene.input.off("pointerdown", D.onDown);
  scene.input.off("pointermove", D.onMove);
  scene.input.off("pointerup", D.onUp);
  scene.input.off("wheel", D.onWheel);
  scene.frDestiny = null;
  R.j.play("click");
}
// 배치: 직업마다 같은 각도, 그 안에서 장비마다 같은 몫 → 계통 각도 = 장비 평균
function destinyLayout() {
  const web = IT.destinyWeb();
  const SEC = (Math.PI * 2) / web.length;
  const nodes = [], links = [];
  const P = (r, ang) => [Math.cos(ang) * r, Math.sin(ang) * r];
  const root = { kind: "root", x: 0, y: 0, r: 34 };
  nodes.push(root);
  const C1 = 190, L1 = 460, S1 = 720;
  web.forEach((C, ci) => {
    const cnt = C.lines.reduce((t, L) => t + L.items.length, 0);
    const slot = (SEC * 0.92) / cnt;
    let a = -Math.PI / 2 + ci * SEC - SEC * 0.46;
    const ca = -Math.PI / 2 + ci * SEC;
    const [cx, cy] = P(C1, ca);
    const cn = { kind: "class", C, x: cx, y: cy, r: 30, ang: ca };
    nodes.push(cn), links.push([root, cn]);
    for (const L of C.lines) {
      const a0 = a;
      a += slot * L.items.length;
      const la = (a0 + a) / 2;
      const [x, y] = P(L1, la);
      const ln = { kind: "line", C, L, x, y, r: 22, ang: la };
      nodes.push(ln), links.push([cn, ln]);
      L.items.forEach((id, k) => {
        const ia = a0 + slot * (k + 0.5);
        const [sx, sy] = P(S1 + (L.items.length > 2 ? (k % 2) * 64 : 0), ia);
        const n = { kind: "spec", C, L, id, x: sx, y: sy, r: 17, ang: ia };
        nodes.push(n), links.push([ln, n]);
      });
    }
  });
  return { nodes, links, R: S1 + 170 };
}
function buildDestiny(scene) {
  const D = scene.frDestiny;
  const { ct, ot: W, xt: H } = R;
  const DEP = 9000;
  const add = (o, d = 0) => (o.setScrollFactor?.(0), o.setDepth?.(DEP + d), D.objs.push(o), o);
  const hex = (css) => Number("0x" + css.slice(1));
  D.labels = [];
  const L = (D.L = D.L ?? destinyLayout());
  add(scene.add.rectangle(0, 0, W, H, 0x05060c, 1).setOrigin(0).setInteractive(), 0);
  const world = add(scene.add.container(W / 2, H / 2), 1);
  const g = scene.add.graphics();
  world.add(g);
  for (let i = 0; i < 700; i++) {
    const a = i * 2.39996, r = Math.sqrt(i / 700) * L.R * 1.2;
    g.fillStyle(0x9aa8e0, 0.1 + (i % 7) * 0.035).fillCircle(Math.cos(a) * r + ((i * 37) % 23) - 11, Math.sin(a) * r + ((i * 53) % 19) - 9, (i % 4) * 0.5 + 0.6);
  }
  // 직업 구역 경계 (옅은 부채꼴 선)
  const web = IT.destinyWeb(), SEC = (Math.PI * 2) / web.length;
  web.forEach((C, ci) => {
    const b = -Math.PI / 2 + ci * SEC + SEC / 2;
    g.lineStyle(1, 0x2a3054, 0.7).lineBetween(Math.cos(b) * 110, Math.sin(b) * 110, Math.cos(b) * L.R, Math.sin(b) * L.R);
  });
  const lvCol = (lv) => hex(IT.GRADE_CSS[Math.max(1, Math.min(6, 1 + Math.floor(lv / 17)))]);
  const st = (n) => {
    if (n.kind === "root") return { on: 1, prog: 0, col: 0xffe6a0 };
    if (n.kind === "class") {
      const k = `c:${n.C.id}`, lv = IT.levelOf(k);
      return { on: 1, lv, prog: IT.progOf(k), col: lvCol(lv) };
    }
    const k = n.kind === "line" ? n.L.key : `i:${n.id}`, lv = IT.levelOf(k);
    return { on: IT.fameOf(k) > 0, lv, prog: IT.progOf(k), col: lvCol(lv) };
  };
  for (const [a, b] of L.links) {
    const lit = st(a).on && st(b).on; // 양쪽이 다 열려야 금빛 (길이 끊겨 보이지 않게)
    const w = b.kind === "class" ? 7 : b.kind === "line" ? 5 : 3;
    g.lineStyle(w + 4, 0x000000, 0.5).lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(w, lit ? 0xd8a840 : 0x2c3048, 1).lineBetween(a.x, a.y, b.x, b.y);
    lit && g.lineStyle(w * 0.35, 0xfff0b0, 0.9).lineBetween(a.x, a.y, b.x, b.y);
  }
  const hexPts = (x, y, r) => Array.from({ length: 6 }, (_, i) => ({ x: x + Math.cos(Math.PI / 6 + (i * Math.PI) / 3) * r, y: y + Math.sin(Math.PI / 6 + (i * Math.PI) / 3) * r }));
  const label = (x, y, s, size, col, o = {}, minZ = 0, dy = 0) => {
    const t = add(ct(scene, 0, 0, s, size, col, { stroke: "#05060c", strokeThickness: 4, ...o }), 3);
    D.labels.push({ t, x, y, minZ, dy });
    return t;
  };
  const plate = { backgroundColor: "#05060cd8", padding: { x: 3, y: 1 }, strokeThickness: 0 };
  for (const n of L.nodes) {
    const s = st(n);
    const { x, y, r } = n;
    s.on && g.fillStyle(s.col, 0.16).fillCircle(x, y, r * 1.6);
    g.fillStyle(0x000000, 0.6).fillPoints(hexPts(x, y + 3, r + 4), !0);
    g.fillStyle(s.on ? 0x2a2214 : 0x12141e, 1).fillPoints(hexPts(x, y, r + 3), !0);
    g.lineStyle(2, s.on ? 0xe8c060 : 0x3a3e58, 1).strokePoints(hexPts(x, y, r + 3), !0);
    g.fillStyle(s.on ? s.col : 0x1e2232, 1).fillPoints(hexPts(x, y, r * 0.78), !0);
    s.on && g.fillStyle(0xffffff, 0.25).fillPoints(hexPts(x, y - r * 0.15, r * 0.42), !0);
    if (s.prog > 0 && s.prog < 1) g.lineStyle(3, 0xffd060, 1).beginPath().arc(x, y, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.prog).strokePath();
    const dark = { stroke: "#ffffff", strokeThickness: 2 };
    if (n.kind === "root") label(x, y, "운명", "body", "#140e08", { stroke: "#ffe6a0", strokeThickness: 2 }).setOrigin(0.5, 0.5);
    else {
      label(x, y, `${s.lv}`, n.kind === "class" ? "body" : "small", s.on ? "#140e08" : "#8a8ea8", s.on ? dark : {}, n.kind === "class" ? 0.3 : n.kind === "line" ? 0.45 : 0.7).setOrigin(0.5, 0.5);
      if (n.kind === "class") {
        const pa = n.ang + Math.PI / 2, px = Math.cos(pa), py = Math.sin(pa);
        label(x + px * (r + 10), y + py * (r + 10), n.C.name, "big", "#ffe6a0", plate, 0).setOrigin(px > 0.3 ? 0 : px < -0.3 ? 1 : 0.5, py > 0.3 ? 0 : py < -0.3 ? 1 : 0.5);
      } else if (n.kind === "line") label(x, y + r + 4, `${n.L.name} · T${IT.lineTier(n.L.key)}`, "small", "#d8d0f0", plate, 0.6, 4).setOrigin(0.5, 0);
      else label(x, y + r + 4, IT.BASE[n.id]?.name ?? n.id, "tiny", s.on ? "#fff4d8" : "#a8acc8", plate, 1.0, 4).setOrigin(0.5, 0);
    }
  }
  const size = Math.ceil(L.R * 2.3);
  const key = "fr_destiny_rt";
  const rt = scene.add.renderTexture(0, 0, size, size).setOrigin(0.5);
  world.remove(g);
  rt.draw(g, size / 2, size / 2);
  g.destroy();
  world.addAt(rt, 0);
  D.hl = scene.add.graphics();
  world.add(D.hl);
  const ui = (x, y, s, size, col, o = {}) => add(ct(scene, x, y, s, size, col, { stroke: "#05060c", strokeThickness: 3, ...o }), 6);
  add(scene.add.rectangle(0, 0, W, 34, 0x05060c, 0.88).setOrigin(0), 5);
  ui(14, 8, "운명 보드", "big", "#ffe6a0");
  ui(W - 14, 13, "끌어서 이동 · 휠 확대/축소 · V·Esc 닫기", "tiny", "#9a96b8").setOrigin(1, 0);
  add(scene.add.rectangle(0, H - 52, W, 52, 0x05060c, 0.9).setOrigin(0), 5);
  add(scene.add.rectangle(0, H - 52, W, 1, 0xd8a840, 0.7).setOrigin(0), 5);
  D.t1 = ui(14, H - 46, "", "body", "#ffffff");
  D.t2 = ui(14, H - 24, "", "tiny", "#c8c0e0");
  const fp = (f, nxt) => (nxt ? `명성 ${Math.floor(f)} / ${nxt}` : `명성 ${Math.floor(f)}`);
  const nextTier = (lv) => IT.TIER_LV.findIndex((x, t) => t >= 2 && lv < x);
  D.info = (n) => {
    if (!n) return (D.t1.setText("운명 보드"), D.t2.setText("직업 → 계통 → 장비 전문화 · 계통 레벨이 오르면 그 계통의 장착 티어가 열린다 · 끼고 싸울 때만 오른다"));
    if (n.kind === "root") return (D.t1.setText("운명"), D.t2.setText("높은 티어 지역의 강한 적일수록 명성을 많이 준다 · 정예 x3 · 희귀 정예 x8 · 보스 x10"));
    const k = n.kind === "class" ? `c:${n.C.id}` : n.kind === "line" ? n.L.key : `i:${n.id}`;
    const lv = IT.levelOf(k), f = IT.fameOf(k), nx = lv < IT.LV_MAX ? IT.levelNeed(lv + 1) : 0;
    const fame = nx ? `명성 ${Math.floor(f)} / ${nx}` : `명성 ${Math.floor(f)}`;
    if (n.kind === "class") return (D.t1.setText(`${n.C.name} · ${lv}레벨`), D.t2.setText(`${fame} · ${n.C.desc} · 아래 계통 전부의 명성이 모인다`));
    if (n.kind === "line") {
      const t = IT.lineTier(n.L.key), nt = nextTier(lv);
      return (D.t1.setText(`${n.C.name} › ${n.L.name} · ${lv}레벨 · T${t} 장착`), D.t2.setText(`${fame} · ${nt > 0 ? `${IT.TIER_LV[nt]}레벨에 T${nt}` : "T6까지 열림"} · 계통 위력 +${(lv * 0.2).toFixed(1)}% · 장비 ${n.L.items.length}개`));
    }
    return (D.t1.setText(`${IT.BASE[n.id]?.name ?? n.id} 전문화 · ${lv}레벨`), D.t2.setText(`${fame} · 이 장비 위력 +${(lv * 0.2).toFixed(1)}% · 같은 계통 다른 장비에도 조금씩 · ${n.C.name} › ${n.L.name}`));
  };
  D.info(null);
  const apply = () => {
    const lim = L.R * D.z;
    D.x = Math.max(-lim, Math.min(lim, D.x));
    D.y = Math.max(-lim, Math.min(lim, D.y));
    world.setPosition(W / 2 + D.x, H / 2 + D.y).setScale(D.z);
    for (const l of D.labels) {
      const sx = W / 2 + D.x + l.x * D.z, sy = H / 2 + D.y + (l.y - (l.dy ?? 0)) * D.z + (l.dy ?? 0);
      const vis = D.z >= l.minZ && sx > -80 && sx < W + 80 && sy > 30 && sy < H - 50;
      l.t.setVisible(vis);
      vis && l.t.setPosition(Math.round(sx), Math.round(sy));
    }
  };
  D.apply = apply;
  apply();
  const pick = (px, py) => {
    const wx = (px - W / 2 - D.x) / D.z, wy = (py - H / 2 - D.y) / D.z;
    let best = null, bd = 1e9;
    for (const n of L.nodes) {
      const d = Math.hypot(n.x - wx, n.y - wy);
      d < n.r + 8 && d < bd && ((bd = d), (best = n));
    }
    return best;
  };
  D.tip = add(ct(scene, 0, 0, "", "small", "#ffffff", { backgroundColor: "#141020ee", padding: { x: 5, y: 3 } }), 8).setVisible(!1);
  const tipName = (n) => (n.kind === "root" ? "운명" : n.kind === "class" ? `${n.C.name}  ${IT.levelOf(`c:${n.C.id}`)}레벨` : n.kind === "line" ? `${n.L.name}  ${IT.levelOf(n.L.key)}레벨 · T${IT.lineTier(n.L.key)}` : `${IT.BASE[n.id]?.name ?? n.id}  ${IT.specLevel(n.id)}레벨`);
  const hover = (n, px, py) => {
    n && D.tip.setPosition(Math.min(W - D.tip.width - 4, px + 12), Math.max(36, py - 22));
    if (n === D.hover) return;
    D.hover = n;
    D.hl.clear();
    n && D.hl.lineStyle(3, 0xffffff, 0.95).strokePoints(hexPts(n.x, n.y, n.r + 6), !0);
    D.tip.setVisible(!!n);
    n && (D.tip.setText(tipName(n)), D.tip.setPosition(Math.min(W - D.tip.width - 4, px + 12), Math.max(36, py - 22)));
    D.info(n);
  };
  D.onDown = (p) => (D.drag = { x: p.x, y: p.y, ox: D.x, oy: D.y, moved: 0 });
  D.onMove = (p) => {
    if (D.drag && p.isDown) {
      D.drag.moved = Math.max(D.drag.moved, Math.hypot(p.x - D.drag.x, p.y - D.drag.y));
      D.tip.setVisible(!1);
      D.x = D.drag.ox + (p.x - D.drag.x);
      D.y = D.drag.oy + (p.y - D.drag.y);
      apply();
    } else if (p.y > 34 && p.y < H - 52) hover(pick(p.x, p.y), p.x, p.y);
    else hover(null);
  };
  D.onUp = (p) => {
    const dr = D.drag;
    D.drag = null;
    if (!dr || dr.moved > 5) return;
    const n = pick(p.x, p.y);
    if (!n) return;
    R.j.play("click");
    const o = { x: D.x, y: D.y };
    scene.tweens.add({ targets: o, x: -n.x * D.z, y: -n.y * D.z, duration: 260, ease: "Cubic.easeOut", onUpdate: () => ((D.x = o.x), (D.y = o.y), apply()) });
  };
  D.onWheel = (p, _o, _dx, dy) => {
    const z0 = D.z, z1 = Math.max(0.14, Math.min(2.2, z0 * (dy > 0 ? 0.88 : 1.14)));
    const cx = p.x - W / 2, cy = p.y - H / 2;
    D.x = cx - ((cx - D.x) * z1) / z0;
    D.y = cy - ((cy - D.y) * z1) / z0;
    D.z = z1;
    apply();
  };
  scene.input.on("pointerdown", D.onDown);
  scene.input.on("pointermove", D.onMove);
  scene.input.on("pointerup", D.onUp);
  scene.input.on("wheel", D.onWheel);
}
// 일시정지 메뉴에서 쓰는 것 (2026-11-28)
export const toggleMapHud = (hud) => toggleMap(hud);
export const zoneNameOf = (sc) => zoneOfPlayer(sc)?.name ?? null;
