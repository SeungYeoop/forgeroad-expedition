import { titleScene } from "./forge/title-scene.js";
import Phaser from "phaser";
import "./style.css";
import * as FG from "./forge/glue.js";
import { AudioEngine } from "./forge/audio.js";
import { TOUCH, initTouch } from "./forge/touch.js";
import { FRBG, FRDECOR } from "./forge/bg.js";
import * as PAINT from "./forge/bgpaint.js";
import * as BGN from "./forge/bgnew.js";
import { FR_REGIONS, FR_MONSTERS, FR_ELITES, FR_BOSSES, FR_ENDLESS, ENDLESS_START, ENDLESS_LEN } from "./forge/world.js";
import { FR_WORLD, SKY_EDGE } from "./forge/zones.js";
import { installFinePhysics } from "./forge/finephys.js";

const __defProp = Object.defineProperty;
const Z = (obj, key, value) =>
  key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : (obj[key] = value);

const zt = Phaser,
  ot = 640,
  xt = 360,
  gt = 16,
  vt = 32,
  Vi = vt * gt,
  TOPR = 250,
  UGR = 222,
  Ft = 56 + TOPR + UGR,
  Oe = Ft * gt,
  OREF = (56 + TOPR) * gt,
  me = 6,
  tn = 40 * Vi,
  en = 32,
  ei = "Galmuri11",
  ii = "Galmuri9",
  Di = "Galmuri7",
  Ms = "Galmuri14",
  q = {
    text: "#2a1709",
    textDim: "#5c3d22",
    gold: "#8a4c00",
    red: "#981c10",
    green: "#1d6418",
    blue: "#183f88",
    purple: "#621a92",
    orange: "#9a4606",
  },
  // 게임 화면 위에 바로 뜨는 글자(테두리 있음)는 밝은 원래 색을 쓴다
  qLight = { "#2a1709": "#f2e6c4", "#5c3d22": "#a89d82", "#8a4c00": "#ffd84a", "#981c10": "#ff5a4a", "#1d6418": "#7be36a", "#183f88": "#6ab8ff", "#621a92": "#c58aff", "#9a4606": "#ffa040" },
  Ei = { common: "#d8d0c0", uncommon: "#7be36a", rare: "#6ab8ff", epic: "#c58aff", legendary: "#ffa040" },
  Ps = { common: "일반", uncommon: "고급", rare: "희귀", epic: "영웅", legendary: "전설" };
class ht {
  constructor(S, T) {
    Z(this, "w");
    Z(this, "h");
    Z(this, "buf");
    Z(this, "img");
    ((this.w = S), (this.h = T), (this.img = new ImageData(S, T)), (this.buf = new Uint32Array(this.img.data.buffer)));
  }
  static rgba(S, T = 255) {
    return ((T & 255) << 24) | ((S & 255) << 16) | (((S >> 8) & 255) << 8) | ((S >> 16) & 255);
  }
  px(S, T, C, E = 255) {
    if (((S = Math.round(S)), (T = Math.round(T)), S < 0 || T < 0 || S >= this.w || T >= this.h)) return;
    if (E >= 255) {
      this.buf[T * this.w + S] = ht.rgba(C, 255) >>> 0;
      return;
    }
    const R = T * this.w + S,
      h = this.buf[R],
      m = (h >>> 24) & 255;
    if (m === 0) {
      this.buf[R] = ht.rgba(C, E) >>> 0;
      return;
    }
    const t = h & 255,
      a = (h >> 8) & 255,
      v = (h >> 16) & 255,
      o = E / 255,
      n = Math.round(t * (1 - o) + ((C >> 16) & 255) * o),
      i = Math.round(a * (1 - o) + ((C >> 8) & 255) * o),
      e = Math.round(v * (1 - o) + (C & 255) * o);
    this.buf[R] = ((Math.max(m, E) << 24) | (e << 16) | (i << 8) | n) >>> 0;
  }
  get(S, T) {
    return S < 0 || T < 0 || S >= this.w || T >= this.h ? 0 : this.buf[T * this.w + S];
  }
  alphaAt(S, T) {
    return (this.get(S, T) >>> 24) & 255;
  }
  clearPx(S, T) {
    S >= 0 && T >= 0 && S < this.w && T < this.h && (this.buf[T * this.w + S] = 0);
  }
  rect(S, T, C, E, R, h = 255) {
    ((S = Math.round(S)), (T = Math.round(T)));
    for (let m = 0; m < E; m++) for (let t = 0; t < C; t++) this.px(S + t, T + m, R, h);
  }
  ellipse(S, T, C, E, R, h = 255) {
    if (C <= 0 || E <= 0) {
      this.px(S, T, R, h);
      return;
    }
    for (let m = -Math.ceil(E); m <= Math.ceil(E); m++)
      for (let t = -Math.ceil(C); t <= Math.ceil(C); t++)
        (t * t) / (C * C) + (m * m) / (E * E) <= 1 && this.px(S + t, T + m, R, h);
  }
  circle(S, T, C, E, R = 255) {
    this.ellipse(S, T, C, C, E, R);
  }
  ring(S, T, C, E, R, h = 255) {
    for (let m = -Math.ceil(C); m <= Math.ceil(C); m++)
      for (let t = -Math.ceil(C); t <= Math.ceil(C); t++) {
        const a = Math.sqrt(t * t + m * m);
        a <= C && a > C - E && this.px(S + t, T + m, R, h);
      }
  }
  line(S, T, C, E, R, h = 255) {
    ((S = Math.round(S)), (T = Math.round(T)), (C = Math.round(C)), (E = Math.round(E)));
    const m = Math.abs(C - S),
      t = -Math.abs(E - T),
      a = S < C ? 1 : -1,
      v = T < E ? 1 : -1;
    let o = m + t;
    for (let n = 0; n < 1e3 && (this.px(S, T, R, h), !(S === C && T === E)); n++) {
      const i = 2 * o;
      (i >= t && ((o += t), (S += a)), i <= m && ((o += m), (T += v)));
    }
  }
  thickLine(S, T, C, E, R, h) {
    const m = Math.max(1, Math.hypot(C - S, E - T));
    for (let t = 0; t <= m; t++) {
      const a = S + ((C - S) * t) / m,
        v = T + ((E - T) * t) / m;
      this.circle(a, v, R / 2, h);
    }
  }
  poly(S, T, C = 255) {
    let E = 1 / 0,
      R = -1 / 0;
    for (const h of S) ((E = Math.min(E, h[1])), (R = Math.max(R, h[1])));
    for (let h = Math.floor(E); h <= Math.ceil(R); h++) {
      const m = [];
      for (let t = 0; t < S.length; t++) {
        const [a, v] = S[t],
          [o, n] = S[(t + 1) % S.length];
        ((v <= h + 0.5 && n > h + 0.5) || (n <= h + 0.5 && v > h + 0.5)) &&
          m.push(a + ((h + 0.5 - v) * (o - a)) / (n - v));
      }
      m.sort((t, a) => t - a);
      for (let t = 0; t + 1 < m.length; t += 2)
        for (let a = Math.round(m[t]); a < Math.round(m[t + 1]); a++) this.px(a, h, T, C);
    }
  }
  outline(S = 1314328, T = !1) {
    const C = [];
    for (let E = 0; E < this.h; E++)
      for (let R = 0; R < this.w; R++) {
        if (this.alphaAt(R, E) > 0) continue;
        (this.alphaAt(R - 1, E) > 100 ||
          this.alphaAt(R + 1, E) > 100 ||
          this.alphaAt(R, E - 1) > 100 ||
          this.alphaAt(R, E + 1) > 100 ||
          (T &&
            (this.alphaAt(R - 1, E - 1) > 100 ||
              this.alphaAt(R + 1, E + 1) > 100 ||
              this.alphaAt(R + 1, E - 1) > 100 ||
              this.alphaAt(R - 1, E + 1) > 100))) &&
          C.push(R, E);
      }
    for (let E = 0; E < C.length; E += 2) this.px(C[E], C[E + 1], S);
  }
  rimLight(S, T = 0.35) {
    const C = this.buf.slice();
    for (let E = 1; E < this.h; E++)
      for (let R = 0; R < this.w; R++) {
        const h = C[E * this.w + R];
        if (h >>> 24 < 200) continue;
        if (!(C[(E - 1) * this.w + R] >>> 24)) {
          const t = h & 255,
            a = (h >> 8) & 255,
            v = (h >> 16) & 255,
            o = (S >> 16) & 255,
            n = (S >> 8) & 255,
            i = S & 255,
            e = Math.round(t + (o - t) * T),
            r = Math.round(a + (n - a) * T),
            l = Math.round(v + (i - v) * T);
          this.buf[E * this.w + R] = ((255 << 24) | (l << 16) | (r << 8) | e) >>> 0;
        }
      }
  }
  dither(S, T, C, E, R, h = 0.5, m = 1) {
    let t = m;
    for (let a = 0; a < E; a++)
      for (let v = 0; v < C; v++)
        ((t = (t * 1103515245 + 12345) & 2147483647), t / 2147483647 < h && this.px(S + v, T + a, R));
  }
  flipX() {
    const S = new ht(this.w, this.h);
    for (let T = 0; T < this.h; T++)
      for (let C = 0; C < this.w; C++) S.buf[T * this.w + (this.w - 1 - C)] = this.buf[T * this.w + C];
    return S;
  }
  toCanvas() {
    const S = document.createElement("canvas");
    return ((S.width = this.w), (S.height = this.h), S.getContext("2d").putImageData(this.img, 0, 0), S);
  }
  blitTo(S, T, C) {
    S.putImageData(this.img, T, C);
  }
  drawCanvas(S, T, C) {
    for (let E = 0; E < S.h; E++)
      for (let R = 0; R < S.w; R++) {
        const h = S.buf[E * S.w + R],
          m = h >>> 24;
        if (m === 0) continue;
        const t = T + R,
          a = C + E;
        t < 0 ||
          a < 0 ||
          t >= this.w ||
          a >= this.h ||
          (m === 255
            ? (this.buf[a * this.w + t] = h)
            : this.px(t, a, ((h & 255) << 16) | (((h >> 8) & 255) << 8) | ((h >> 16) & 255), m));
      }
  }
}
function st(A, S) {
  let T = (A >> 16) & 255,
    C = (A >> 8) & 255,
    E = A & 255;
  return (
    S >= 0
      ? ((T += (255 - T) * S), (C += (255 - C) * S), (E += (255 - E) * S))
      : ((T *= 1 + S), (C *= 1 + S), (E *= 1 + S)),
    (Math.round(T) << 16) | (Math.round(C) << 8) | Math.round(E)
  );
}
function Ke(A, S, T) {
  const C = ((A >> 16) & 255) * (1 - T) + ((S >> 16) & 255) * T,
    E = ((A >> 8) & 255) * (1 - T) + ((S >> 8) & 255) * T,
    R = (A & 255) * (1 - T) + (S & 255) * T;
  return (Math.round(C) << 16) | (Math.round(E) << 8) | Math.round(R);
}
const sn = 1314328;
function Et(A, S, T, C, E) {
  A.textures.exists(S) && A.textures.remove(S);
  const R = T.length,
    h = document.createElement("canvas");
  ((h.width = C * R), (h.height = E));
  const m = h.getContext("2d");
  T.forEach((a, v) => a.blitTo(m, v * C, 0));
  const t = A.textures.addCanvas(S, h);
  return (T.forEach((a, v) => t.add(v, 0, v * C, 0, C, E)), t);
}
function lt(A, S, T) {
  return (A.textures.exists(S) && A.textures.remove(S), A.textures.addCanvas(S, T.toCanvas()));
}
function Pt(A, S, T, C, E = sn) {
  const R = [];
  for (let h = 0; h < A; h++) {
    const m = new ht(S, T);
    (C(m, h), E !== null && m.outline(E), R.push(m));
  }
  return R;
}
const le = [
    {
      id: "cloth",
      name: "천 갑옷",
      rarity: "common",
      price: 0,
      weight: "light",
      desc: "가볍고 움직임이 자유롭다. 스킬 재사용이 빨라진다.",
      cons: "방어력이 매우 낮다",
      def: 3,
      defPerLevel: 1,
      resist: 0.05,
      resistPerLevel: 0.005,
      moveMult: 1.12,
      atkSpeedMult: 1,
      dashCdMult: 0.9,
      passiveDesc: "스킬 재사용 대기시간 -{v}%",
      passive: { base: 10, perLevel: 1 },
      perks: [
        { level: 5, desc: "대시 후 0.6초간 이동 속도 +20%" },
        { level: 10, desc: "스킬 위력 +12%" },
      ],
      look: { body: 8030810, trim: 13154442, dark: 4872762, shoulder: "none", helm: "hood", skirt: !0 },
    },
    {
      id: "leather",
      name: "가죽 갑옷",
      rarity: "uncommon",
      price: 220,
      weight: "light",
      desc: "대시가 빠르게 충전되고 무적 시간이 길다. 치명타 보너스.",
      cons: "물리 피해 감소가 낮다",
      def: 7,
      defPerLevel: 1.5,
      resist: 0.05,
      resistPerLevel: 0.005,
      moveMult: 1.06,
      atkSpeedMult: 1.04,
      dashCdMult: 0.7,
      passiveDesc: "치명타 확률 +{v}%",
      passive: { base: 6, perLevel: 0.5 },
      perks: [
        { level: 5, desc: "대시 무적 시간 +0.1초" },
        { level: 10, desc: "대시 직후 첫 공격 확정 치명타" },
      ],
      look: { body: 9067066, trim: 5913122, dark: 4860442, shoulder: "pad", helm: "bandana" },
    },
    {
      id: "chain",
      name: "사슬 갑옷",
      rarity: "uncommon",
      price: 380,
      weight: "medium",
      desc: "방어력과 저항이 고르게 높다. 넉백에 강하다.",
      cons: "특화된 능력이 없다",
      def: 14,
      defPerLevel: 2,
      resist: 0.12,
      resistPerLevel: 0.008,
      moveMult: 1,
      atkSpeedMult: 1,
      dashCdMult: 1,
      passiveDesc: "넉백 저항 {v}%",
      passive: { base: 40, perLevel: 3 },
      perks: [
        { level: 5, desc: "최대 체력 +8%" },
        { level: 10, desc: "모든 피해 +6%" },
      ],
      look: { body: 10133672, trim: 5922928, dark: 4870232, shoulder: "pad", helm: "cap", skirt: !0 },
    },
    {
      id: "steel",
      name: "강철 갑옷",
      rarity: "rare",
      price: 900,
      unlock: "steel_armor",
      weight: "heavy",
      desc: "높은 물리 방어력. 약한 공격에 경직되지 않는다.",
      cons: "이동 속도와 대시가 느려진다",
      def: 26,
      defPerLevel: 3,
      resist: 0.06,
      resistPerLevel: 0.005,
      moveMult: 0.9,
      atkSpeedMult: 0.96,
      dashCdMult: 1.2,
      hpMult: 1.1,
      passiveDesc: "피격 시 받는 넉백 {v}% 감소, 경직 무시",
      passive: { base: 60, perLevel: 3 },
      perks: [
        { level: 5, desc: "최대 체력 +10%" },
        { level: 10, desc: "체력 50% 이상일 때 받는 피해 -10%" },
      ],
      look: { body: 11581636, trim: 6976128, dark: 5265508, shoulder: "plate", helm: "helm" },
    },
    {
      id: "mage",
      name: "마법 갑옷",
      rarity: "epic",
      price: 1400,
      unlock: "adv_armor",
      weight: "light",
      desc: "속성 저항이 높고 스킬 위력이 크게 증가한다.",
      cons: "근접 공격에 받는 피해 +15%",
      def: 6,
      defPerLevel: 1,
      resist: 0.3,
      resistPerLevel: 0.015,
      moveMult: 1.04,
      atkSpeedMult: 1,
      dashCdMult: 0.95,
      passiveDesc: "스킬 위력 +{v}%, 재사용 대기시간 -10%",
      passive: { base: 22, perLevel: 2 },
      perks: [
        { level: 5, desc: "스킬 사용 시 1초간 받는 피해 -30%" },
        { level: 10, desc: "스킬 재사용 대기시간 추가 -10%" },
      ],
      look: { body: 3820186, trim: 13676608, dark: 2763370, shoulder: "orb", helm: "hood", glow: 8429823, skirt: !0 },
    },
    {
      id: "thorns",
      name: "가시 갑옷",
      rarity: "epic",
      price: 1300,
      unlock: "adv_armor",
      weight: "medium",
      desc: "근접 공격을 받으면 피해의 일부를 공격자에게 반사한다.",
      cons: "원거리 적에게는 효과가 없다",
      def: 15,
      defPerLevel: 2,
      resist: 0.08,
      resistPerLevel: 0.006,
      moveMult: 0.98,
      atkSpeedMult: 1,
      dashCdMult: 1,
      passiveDesc: "근접 피해 {v}% 반사 (공격력 비례 추가)",
      passive: { base: 60, perLevel: 8 },
      perks: [
        { level: 5, desc: "반사 피해가 출혈을 일으킴" },
        { level: 10, desc: "피격 시 주변에 가시 폭발" },
      ],
      look: { body: 4872762, trim: 10127962, dark: 2767394, shoulder: "spike", helm: "horned" },
    },
    {
      id: "vampire",
      name: "흡혈 갑옷",
      rarity: "epic",
      price: 1600,
      unlock: "adv_armor",
      weight: "light",
      desc: "적에게 피해를 주거나 처치하면 체력을 회복한다.",
      cons: "기본 방어력이 낮다",
      def: 6,
      defPerLevel: 1.2,
      resist: 0.08,
      resistPerLevel: 0.006,
      moveMult: 1.05,
      atkSpeedMult: 1.02,
      dashCdMult: 1,
      passiveDesc: "피해의 {v}% 흡혈, 처치 시 최대 체력 2% 회복",
      passive: { base: 3, perLevel: 0.35 },
      perks: [
        { level: 5, desc: "처치 회복량 2배" },
        { level: 10, desc: "체력 30% 이하일 때 흡혈 2배" },
      ],
      look: { body: 5904938, trim: 11575464, dark: 2755092, shoulder: "wing", helm: "none", cape: 9048096 },
    },
    {
      id: "berserker",
      name: "광전사 갑옷",
      rarity: "epic",
      price: 1500,
      unlock: "adv_armor",
      weight: "medium",
      desc: "잃은 체력에 비례하여 공격력이 증가한다.",
      cons: "받는 회복량 -25%, 생존 위험 증가",
      def: 9,
      defPerLevel: 1.5,
      resist: 0.06,
      resistPerLevel: 0.005,
      moveMult: 1.03,
      atkSpeedMult: 1.06,
      dashCdMult: 1,
      passiveDesc: "체력이 낮을수록 공격력 최대 +{v}%",
      passive: { base: 55, perLevel: 5 },
      perks: [
        { level: 5, desc: "체력 40% 이하일 때 공격 속도 +15%" },
        { level: 10, desc: "치명상을 1회 버팀 (탐험당 1회)" },
      ],
      look: { body: 9054746, trim: 3811874, dark: 4856336, shoulder: "fur", helm: "horned" },
    },
    {
      id: "guardian",
      name: "수호자 갑옷",
      rarity: "epic",
      price: 2200,
      unlock: "adv_armor",
      weight: "heavy",
      desc: "압도적인 방어력과 체력. 넉백과 경직에 면역.",
      cons: "이동, 대시, 공격 속도가 크게 느려진다",
      def: 38,
      defPerLevel: 4,
      resist: 0.15,
      resistPerLevel: 0.01,
      moveMult: 0.84,
      atkSpeedMult: 0.92,
      dashCdMult: 1.4,
      hpMult: 1.2,
      passiveDesc: "넉백, 경직 면역 / 최대 체력 +{v}%",
      passive: { base: 20, perLevel: 1.5 },
      perks: [
        { level: 5, desc: "정지 상태에서 받는 피해 -15%" },
        { level: 10, desc: "보스에게 받는 피해 -15%" },
      ],
      look: { body: 13680752, trim: 9071146, dark: 6969914, shoulder: "plate", helm: "crown", cape: 2771610 },
    },
    {
      id: "abyss",
      name: "심연 갑옷",
      rarity: "legendary",
      price: 4800,
      unlock: "abyss_armor",
      weight: "medium",
      desc: "모든 피해가 증가하고 치명타가 공허 폭발을 일으킨다.",
      cons: "받는 회복 -50%, 속성 피해 +20%",
      def: 18,
      defPerLevel: 2.5,
      resist: 0,
      resistPerLevel: 0,
      moveMult: 1.05,
      atkSpeedMult: 1.05,
      dashCdMult: 0.9,
      passiveDesc: "주는 피해 +{v}%, 치명타 시 공허 폭발",
      passive: { base: 28, perLevel: 2.5 },
      perks: [
        { level: 5, desc: "공허 폭발 범위 +50%" },
        { level: 10, desc: "처치 시 2초간 이동 속도 +25%" },
      ],
      look: {
        body: 2759226,
        trim: 10113248,
        dark: 1313312,
        shoulder: "spike",
        helm: "mask",
        glow: 11559167,
        cape: 3805264,
      },
    },
  ],
  He = Object.fromEntries(le.map((A) => [A.id, A])),
  pe = {
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 7, 8, 9],
    jump: [10],
    fall: [11],
    dash: [12],
    hurt: [16],
    death: [17, 18, 19, 20],
    cast: [21, 22],
    interact: [23],
  },
  nn = 24,
  As = [
    { dy: 0, lean: 0, bl: [-1, 0], fl: [1, 0], arm: "down", barm: "down", cape: 0 },
    { dy: 0, lean: 0, bl: [-1, 0], fl: [1, 0], arm: "down", barm: "down", cape: 1 },
    { dy: 1, lean: 0, bl: [-1, 0], fl: [1, 0], arm: "down", barm: "down", cape: 2 },
    { dy: 1, lean: 0, bl: [-1, 0], fl: [1, 0], arm: "down", barm: "down", cape: 1 },
    { dy: 0, lean: 1, bl: [-3, 0], fl: [3, 1], arm: "low", barm: "fwd", cape: 2 },
    { dy: -1, lean: 1, bl: [-2, 1], fl: [2, 0], arm: "low", barm: "fwd", cape: 3 },
    { dy: 0, lean: 1, bl: [0, 2], fl: [0, 0], arm: "down", barm: "down", cape: 2 },
    { dy: 0, lean: 1, bl: [3, 1], fl: [-3, 0], arm: "fwd", barm: "back", cape: 3 },
    { dy: -1, lean: 1, bl: [2, 0], fl: [-2, 1], arm: "fwd", barm: "back", cape: 2 },
    { dy: 0, lean: 1, bl: [0, 0], fl: [0, 2], arm: "down", barm: "down", cape: 3 },
    { dy: -1, lean: 0, bl: [-2, 2], fl: [2, 3], arm: "up", barm: "back", cape: 1 },
    { dy: 0, lean: 0, bl: [-2, 1], fl: [2, 0], arm: "reach", barm: "up", cape: 4 },
    { dy: 2, lean: 3, bl: [-5, 1], fl: [3, 2], arm: "back", barm: "back", cape: 5 },
    { dy: 0, lean: -1, bl: [-2, 0], fl: [2, 0], arm: "up", barm: "back", cape: 1 },
    { dy: 1, lean: 2, bl: [-3, 0], fl: [3, 0], arm: "fwd", barm: "back", cape: 3 },
    { dy: 1, lean: 1, bl: [-3, 0], fl: [3, 0], arm: "low", barm: "down", cape: 2 },
    { dy: 1, lean: -2, bl: [-1, 0], fl: [2, 1], arm: "back", barm: "up", cape: 4 },
    { dy: 4, lean: -1, bl: [-2, 3], fl: [2, 3], arm: "down", barm: "down", cape: 0, squash: 1 },
    { dy: 6, lean: -3, bl: [-2, 4], fl: [2, 4], arm: "down", barm: "down", cape: 0, squash: 2 },
    { dy: 0, lean: 0, bl: [0, 0], fl: [0, 0], arm: "down", barm: "down", cape: 0, lying: 1 },
    { dy: 0, lean: 0, bl: [0, 0], fl: [0, 0], arm: "down", barm: "down", cape: 0, lying: 2 },
    { dy: 0, lean: 0, bl: [-2, 0], fl: [2, 0], arm: "cast", barm: "up", cape: 2 },
    { dy: -1, lean: 1, bl: [-2, 0], fl: [3, 0], arm: "cast", barm: "up", cape: 3 },
    { dy: 0, lean: 1, bl: [-1, 0], fl: [1, 0], arm: "reach", barm: "down", cape: 1 },
  ],
  ns = As.map((A) => rn(A));
function rn(A) {
  const S = 18 + A.lean,
    T = 18 + A.dy;
  switch (A.arm) {
    case "down":
      return { x: S + 1, y: T + 6 };
    case "low":
      return { x: S + 3, y: T + 5 };
    case "fwd":
      return { x: S + 6, y: T + 1 };
    case "up":
      return { x: S + 1, y: T - 7 };
    case "back":
      return { x: S - 7, y: T + 3 };
    case "cast":
      return { x: S + 5, y: T - 4 };
    case "reach":
      return { x: S + 5, y: T + 3 };
  }
}
const wi = 1578e4,
  rs = 13146224,
  xi = 5913122,
  an = 3811874;
function as(A, S, T, C, E, R) {
  const h = (R ? 13 : 18) + S.lean,
    m = 18 + S.dy,
    t = R ? st(C, -0.3) : C,
    a = R ? st(E, -0.2) : E;
  switch (T) {
    case "down":
      (A.rect(h, m, 2, 5, t), A.rect(h, m + 5, 2, 2, a));
      break;
    case "low":
      (A.line(h, m, h + 3, m + 4, t), A.line(h + 1, m, h + 3, m + 3, t), A.rect(h + 3, m + 4, 2, 2, a));
      break;
    case "fwd":
      (A.rect(h, m, 5, 2, t), A.rect(h + 5, m, 2, 2, a));
      break;
    case "up":
      (A.rect(h, m - 5, 2, 6, t), A.rect(h, m - 7, 2, 2, a));
      break;
    case "back":
      (A.line(h, m, h - 5, m + 3, t), A.line(h, m + 1, h - 5, m + 4, t), A.rect(h - 7, m + 3, 2, 2, a));
      break;
    case "cast":
      (A.line(h, m, h + 4, m - 3, t), A.line(h, m + 1, h + 4, m - 2, t), A.rect(h + 4, m - 5, 2, 2, a));
      break;
    case "reach":
      (A.rect(h, m, 4, 2, t), A.line(h + 3, m + 1, h + 4, m + 3, t), A.rect(h + 4, m + 3, 2, 2, a));
      break;
  }
}
function os(A, S, T, C, E, R) {
  const h = 25 + Math.min(R, 4),
    m = Math.max(2, 5 - T);
  (A.rect(S, h, 3, m, C), A.rect(S, h + m, 4, 2, E));
}
function on(A, S, T, C) {
  const E = C.look;
  (A.rect(S + 1, T, 6, 8, wi),
    A.rect(S, T + 1, 8, 6, wi),
    A.rect(S + 1, T + 6, 6, 1, rs),
    A.rect(S, T, 7, 2, xi),
    A.rect(S, T, 3, 5, xi),
    A.px(S + 7, T + 1, xi),
    A.rect(S + 5, T + 3, 1, 2, 2103328),
    A.px(S + 7, T + 4, rs));
  const R = E.helm === "hood" ? E.body : E.trim;
  switch (E.helm) {
    case "hood":
      (A.rect(S - 1, T - 1, 9, 3, E.body),
        A.rect(S - 1, T, 4, 8, E.body),
        A.rect(S + 7, T, 1, 3, E.body),
        A.rect(S - 1, T + 7, 9, 1, st(E.body, -0.2)),
        A.px(S + 1, T + 1, st(E.body, 0.25)),
        A.px(S + 3, T - 1, st(E.body, 0.25)));
      break;
    case "cap":
      (A.rect(S - 1, T - 1, 9, 3, R), A.rect(S - 1, T + 1, 2, 4, R), A.rect(S, T - 1, 7, 1, st(R, 0.3)));
      break;
    case "helm":
      (A.rect(S - 1, T - 1, 10, 9, E.body),
        A.rect(S + 4, T + 3, 4, 1, 1052696),
        A.rect(S - 1, T - 1, 10, 1, st(E.body, 0.35)),
        A.rect(S + 1, T + 5, 7, 1, E.trim),
        A.rect(S + 3, T - 2, 2, 1, E.trim));
      break;
    case "horned":
      (A.rect(S - 1, T - 1, 10, 6, E.body),
        A.rect(S + 4, T + 3, 4, 1, 1052696),
        A.rect(S - 1, T - 1, 10, 1, st(E.body, 0.3)),
        A.line(S + 1, T - 1, S - 1, T - 4, 15261896),
        A.line(S + 7, T - 1, S + 9, T - 4, 15261896),
        A.px(S - 1, T - 5, 15261896),
        A.px(S + 9, T - 5, 15261896));
      break;
    case "crown":
      (A.rect(S - 1, T - 1, 10, 9, E.body),
        A.rect(S + 4, T + 3, 4, 2, 1052696),
        A.rect(S - 1, T - 1, 10, 1, st(E.body, 0.35)),
        A.rect(S, T - 3, 8, 2, 16764992),
        A.px(S, T - 4, 16764992),
        A.px(S + 4, T - 4, 16764992),
        A.px(S + 7, T - 4, 16764992),
        A.px(S + 4, T - 3, 16724032));
      break;
    case "mask":
      (A.rect(S - 1, T - 1, 10, 9, E.dark),
        A.rect(S + 4, T + 3, 3, 1, E.glow ?? 16711935),
        A.px(S + 7, T + 3, st(E.glow ?? 16711935, 0.5)),
        A.line(S, T - 1, S - 2, T - 4, E.trim),
        A.line(S + 7, T - 1, S + 9, T - 4, E.trim));
      break;
    case "bandana":
      (A.rect(S, T + 1, 8, 2, E.trim), A.rect(S - 2, T + 2, 2, 1, E.trim), A.px(S - 3, T + 3, E.trim));
      break;
  }
}
function hn(A, S, T, C) {
  const E = C.look;
  switch (E.shoulder) {
    case "pad":
      (A.rect(S, T, 4, 3, E.trim), A.rect(S, T, 4, 1, st(E.trim, 0.3)));
      break;
    case "spike":
      (A.rect(S, T, 4, 3, E.trim),
        A.px(S + 1, T - 1, 14209216),
        A.px(S + 1, T - 2, 14209216),
        A.px(S + 3, T - 1, 14209216));
      break;
    case "plate":
      (A.rect(S - 1, T - 1, 6, 4, E.body),
        A.rect(S - 1, T - 1, 6, 1, st(E.body, 0.4)),
        A.rect(S - 1, T + 2, 6, 1, E.trim));
      break;
    case "fur":
      (A.rect(S - 1, T - 1, 6, 3, 14207144),
        A.px(S - 1, T + 2, 14207144),
        A.px(S + 2, T + 2, 14207144),
        A.px(S + 4, T + 2, 12628112));
      break;
    case "orb":
      (A.circle(S + 2, T + 1, 2, E.trim), A.px(S + 2, T, E.glow ?? 16777215));
      break;
    case "wing":
      (A.poly(
        [
          [S, T + 2],
          [S + 4, T + 2],
          [S + 2, T - 4],
        ],
        E.dark,
      ),
        A.px(S + 2, T - 3, E.trim));
      break;
  }
}
function Rs(A, S, T) {
  const C = As[S],
    E = T.look,
    R = T.weight === "heavy",
    h = E.dark,
    m = R ? st(E.body, -0.25) : an,
    t = E.body,
    a = R ? E.body : wi;
  if (C.lying) {
    if (
      (E.cape !== void 0 && A.rect(10, 25, 12, 2, E.cape),
      ln(A, 20, 26, h, m),
      A.rect(12, 23, 9, 6, E.body),
      A.rect(12, 28, 9, 1, E.trim),
      A.rect(5, 23, 7, 7, wi),
      A.rect(5, 23, 3, 7, xi),
      E.helm !== "none" && E.helm !== "bandana" && A.rect(4, 22, 4, 9, E.helm === "hood" ? E.body : E.trim),
      A.px(9, 27, 2103328),
      C.lying === 2)
    )
      for (let e = 0; e < A.buf.length; e++) {
        const r = A.buf[e];
        if (r >>> 24) {
          const l = (r & 255) * 0.75,
            s = ((r >> 8) & 255) * 0.75,
            u = ((r >> 16) & 255) * 0.75;
          A.buf[e] = ((255 << 24) | (u << 16) | (s << 8) | l) >>> 0;
        }
      }
    return;
  }
  const v = C.dy,
    o = 12 + C.lean;
  if (E.cape !== void 0) {
    const i = C.cape,
      e = o;
    (A.poly(
      [
        [e + 1, 17 + v],
        [e + 4, 17 + v],
        [e + 2 - i, 28],
        [e - 2 - i, 27],
      ],
      E.cape,
    ),
      A.line(e - 2 - i, 27, e + 2 - i, 28, st(E.cape, -0.3)),
      A.line(e + 1, 18 + v, e - 1 - i, 26, st(E.cape, 0.2)));
  }
  (as(A, C, C.barm, t, a, !0), os(A, 13 + C.bl[0], C.bl[1], st(h, -0.25), st(m, -0.2), v));
  const n = 17 + v;
  if (
    (A.rect(o, n, 8, 8 - (C.squash ?? 0), E.body),
    A.rect(o, n, 1, 8, st(E.body, -0.25)),
    A.rect(o + 7, n, 1, 8, st(E.body, 0.15)),
    A.rect(o, n + 6, 8, 1, E.trim),
    A.px(o + 5, n + 6, 14729312),
    T.id === "chain")
  )
    for (let i = 0; i < 6; i++) for (let e = i % 2; e < 8; e += 2) A.px(o + e, n + i, st(E.body, -0.18));
  ((T.id === "steel" || T.id === "guardian") &&
    (A.rect(o + 3, n + 1, 2, 4, st(E.body, 0.35)), A.rect(o + 1, n, 6, 1, st(E.body, 0.3))),
    T.id === "mage" && (A.rect(o + 3, n, 2, 6, E.trim), A.px(o + 4, n + 2, E.glow ?? 16777215)),
    T.id === "thorns" && (A.px(o + 2, n + 2, 14209216), A.px(o + 5, n + 4, 14209216), A.px(o + 3, n + 1, 14209216)),
    T.id === "vampire" && (A.rect(o + 2, n, 4, 3, 14209240), A.px(o + 4, n + 3, 10489888)),
    T.id === "berserker" && (A.line(o + 1, n + 1, o + 6, n + 5, 3811874), A.px(o + 3, n + 1, 15253616)),
    T.id === "abyss" &&
      (A.rect(o + 3, n + 2, 2, 2, E.glow ?? 11559167), A.px(o + 1, n + 4, E.trim), A.px(o + 6, n + 4, E.trim)),
    T.id === "leather" && A.line(o + 1, n, o + 6, n + 5, st(E.body, -0.35)),
    T.id === "cloth" && A.rect(o + 3, n, 2, 2, E.trim),
    E.skirt && (A.rect(o - 1, n + 7, 10, 2, st(E.body, -0.15)), A.px(o + 2, n + 8, E.trim), A.px(o + 6, n + 8, E.trim)),
    os(A, 16 + C.fl[0], C.fl[1], h, m, v),
    on(A, o, 9 + v, T),
    hn(A, o + 5, n, T),
    as(A, C, C.arm, t, a, !1));
}
function ln(A, S, T, C, E) {
  (A.rect(S, T - 2, 6, 3, C), A.rect(S + 6, T - 3, 2, 4, E));
}
function un(A) {
  for (const S of le) {
    const T = Pt(nn, 32, 32, (C, E) => {
      Rs(C, E, S);
    });
    for (const C of T) S.look.glow !== void 0 && C.rimLight(S.look.glow, 0.15);
    Et(A, `player_${S.id}`, T, 32, 32);
  }
}
function Ue(A, S, T, C) {
  const E = { id: "npc", weight: "medium", look: T },
    R = Pt(4, 32, 32, (h, m) => {
      Rs(h, m, E);
    });
  Et(A, S, R, 32, 32);
}
const ce = [
    {
      id: "sword",
      name: "낡은 검",
      rarity: "common",
      price: 0,
      kind: "melee",
      flat: 0,
      desc: "균형 잡힌 기본 무기. 3연격의 마지막 일격이 강하다.",
      element: "phys",
      critBonus: 0,
      combo: [
        {
          arc: "slash",
          power: 1,
          interval: 0.34,
          windup: 0.05,
          active: 0.09,
          range: 34,
          height: 30,
          knockback: 120,
          stagger: 0.22,
        },
        {
          arc: "slash",
          power: 1,
          interval: 0.34,
          windup: 0.05,
          active: 0.09,
          range: 34,
          height: 30,
          knockback: 120,
          stagger: 0.22,
        },
        {
          arc: "heavy",
          power: 1.5,
          interval: 0.52,
          windup: 0.09,
          active: 0.1,
          range: 40,
          height: 34,
          knockback: 230,
          stagger: 0.4,
          lunge: 140,
        },
      ],
      special: { name: "빠른 연속 베기", desc: "전방을 5회 빠르게 베며 전진한다.", cooldown: 4, power: 0.9 },
      upgrade: {
        costBase: 60,
        dmgPerLevel: 0.09,
        specialPerLevel: 0.08,
        perks: [
          { level: 3, desc: "연속 베기 +2회", mods: { specialCount: 2 } },
          { level: 6, desc: "3타가 검기를 날린다", mods: { comboWave: 1 } },
          { level: 10, desc: "치명타 확률 +10%", mods: { critChance: 0.1 } },
          { level: 15, desc: "특수 공격 위력 +40%", mods: { specialPower: 0.4 } },
        ],
      },
      look: { blade: 13159636, hilt: 8014378, accent: 13934656 },
      strong: "모든 상황에 무난",
      weak: "특화된 장점 없음",
    },
    {
      id: "greatsword",
      name: "대검",
      rarity: "uncommon",
      price: 300,
      kind: "melee",
      flat: 3,
      desc: "느리지만 넓은 범위를 강하게 벤다. 적을 크게 경직시킨다.",
      element: "phys",
      critBonus: 0,
      combo: [
        {
          arc: "heavy",
          power: 2.2,
          interval: 0.8,
          windup: 0.22,
          active: 0.12,
          range: 50,
          height: 46,
          back: 10,
          knockback: 260,
          stagger: 0.6,
          shake: 2,
        },
        {
          arc: "smash",
          power: 3,
          interval: 1,
          windup: 0.28,
          active: 0.12,
          range: 54,
          height: 40,
          back: 6,
          knockback: 320,
          stagger: 0.8,
          lunge: 120,
          shake: 3,
        },
      ],
      special: {
        name: "지면 충격파",
        desc: "대검을 내려찍어 전방으로 두 갈래 충격파를 보낸다.",
        cooldown: 6,
        power: 2.4,
      },
      upgrade: {
        costBase: 80,
        dmgPerLevel: 0.1,
        specialPerLevel: 0.1,
        perks: [
          { level: 3, desc: "충격파 사거리 +40%", mods: { specialRadius: 0.4 } },
          { level: 6, desc: "타격 시 적 방어력 파괴", mods: { armorBreak: 0.35 } },
          { level: 10, desc: "특수 공격 재사용 대기시간 -25%", mods: { specialCdr: 0.25 } },
          { level: 15, desc: "모든 공격 경직 +50%", mods: { stunDur: 0.5 } },
        ],
      },
      look: { blade: 12107980, hilt: 3811914, accent: 9054762 },
      strong: "무리, 방어형 적",
      weak: "빠른 비행형 적",
    },
    {
      id: "dual",
      name: "쌍검",
      rarity: "uncommon",
      price: 320,
      kind: "melee",
      flat: 0,
      desc: "두 자루의 단검으로 매우 빠르게 연타한다. 치명타에 특화.",
      element: "phys",
      critBonus: 0.1,
      combo: [
        {
          arc: "twin",
          power: 0.55,
          interval: 0.16,
          windup: 0.02,
          active: 0.07,
          range: 28,
          height: 26,
          knockback: 50,
          stagger: 0.12,
        },
        {
          arc: "twin",
          power: 0.55,
          interval: 0.16,
          windup: 0.02,
          active: 0.07,
          range: 28,
          height: 26,
          knockback: 50,
          stagger: 0.12,
        },
        {
          arc: "twin",
          power: 0.55,
          interval: 0.16,
          windup: 0.02,
          active: 0.07,
          range: 28,
          height: 26,
          knockback: 50,
          stagger: 0.12,
        },
        {
          arc: "slash",
          power: 0.95,
          interval: 0.32,
          windup: 0.04,
          active: 0.08,
          range: 32,
          height: 30,
          knockback: 150,
          stagger: 0.25,
          lunge: 160,
        },
      ],
      special: {
        name: "연속 돌진 베기",
        desc: "무적 상태로 3회 연속 돌진하며 경로의 적을 벤다.",
        cooldown: 5,
        power: 1.3,
      },
      upgrade: {
        costBase: 70,
        dmgPerLevel: 0.085,
        specialPerLevel: 0.08,
        perks: [
          { level: 3, desc: "공격 시 25% 확률로 출혈", mods: { statusChance: 0.25 } },
          { level: 6, desc: "돌진 +2회", mods: { specialCount: 2 } },
          { level: 10, desc: "치명타 피해 +40%", mods: { critDamage: 0.4 } },
          { level: 15, desc: "공격 속도 +15%", mods: { attackSpeed: 0.15 } },
        ],
      },
      look: { blade: 14212328, hilt: 2763322, accent: 6957706 },
      strong: "단일 대상, 치명타 빌드",
      weak: "방어력 높은 적, 원거리 적",
    },
    {
      id: "spear",
      name: "창",
      rarity: "rare",
      price: 600,
      unlock: "tier2_weapons",
      kind: "melee",
      flat: 2,
      desc: "긴 사거리로 적을 꿰뚫는다. 안전한 거리에서 싸울 수 있다.",
      element: "phys",
      critBonus: 0.03,
      combo: [
        {
          arc: "thrust",
          power: 1.2,
          interval: 0.46,
          windup: 0.08,
          active: 0.1,
          range: 62,
          height: 16,
          knockback: 150,
          stagger: 0.25,
        },
        {
          arc: "thrust",
          power: 1.2,
          interval: 0.46,
          windup: 0.08,
          active: 0.1,
          range: 62,
          height: 16,
          knockback: 150,
          stagger: 0.25,
        },
        {
          arc: "slash",
          power: 1.7,
          interval: 0.7,
          windup: 0.12,
          active: 0.12,
          range: 56,
          height: 40,
          back: 20,
          knockback: 220,
          stagger: 0.35,
        },
      ],
      special: {
        name: "직선 관통 찌르기",
        desc: "먼 거리를 돌진하며 일직선상의 모든 적을 관통한다.",
        cooldown: 4.5,
        power: 3,
      },
      upgrade: {
        costBase: 110,
        dmgPerLevel: 0.09,
        specialPerLevel: 0.09,
        perks: [
          { level: 3, desc: "공격 사거리 +20%", mods: { range: 0.2 } },
          { level: 6, desc: "찌르기가 방어력을 파괴", mods: { armorBreak: 0.3 } },
          { level: 10, desc: "특수 공격 위력 +50%", mods: { specialPower: 0.5 } },
          { level: 15, desc: "치명타 확률 +12%", mods: { critChance: 0.12 } },
        ],
      },
      look: { blade: 13685980, hilt: 9067050, accent: 12595248 },
      strong: "돌진형, 근접형 적",
      weak: "근거리로 파고드는 무리",
    },
    {
      id: "bow",
      name: "활",
      rarity: "uncommon",
      price: 350,
      kind: "ranged",
      flat: 0,
      desc: "마우스 방향으로 화살을 쏜다. 원거리에서 안전하게 싸울 수 있다.",
      element: "phys",
      critBonus: 0.05,
      combo: [
        {
          arc: "shot",
          power: 1.1,
          interval: 0.5,
          windup: 0.1,
          active: 0,
          range: 0,
          height: 0,
          knockback: 90,
          stagger: 0.15,
          projectile: { sprite: "p_arrow", speed: 560, gravity: 300, life: 1.4, radius: 5 },
        },
      ],
      special: { name: "다중 화살", desc: "부채꼴로 화살 5발을 동시에 쏜다.", cooldown: 5, power: 1 },
      upgrade: {
        costBase: 70,
        dmgPerLevel: 0.09,
        specialPerLevel: 0.08,
        perks: [
          { level: 3, desc: "다중 화살 +2발", mods: { specialCount: 2 } },
          { level: 6, desc: "화살이 적 1명 관통", mods: { pierce: 1 } },
          { level: 10, desc: "치명타 피해 +35%", mods: { critDamage: 0.35 } },
          { level: 15, desc: "공격 속도 +15%", mods: { attackSpeed: 0.15 } },
        ],
      },
      look: { blade: 9067050, hilt: 5913114, accent: 14737616 },
      strong: "비행형, 원거리형 적",
      weak: "근접 무리, 방어형 적",
    },
    {
      id: "staff",
      name: "지팡이",
      rarity: "rare",
      price: 800,
      unlock: "tier2_weapons",
      kind: "magic",
      flat: 0,
      desc: "폭발하는 마력 구체를 발사한다. 스킬 위력의 50%가 공격에도 적용된다.",
      element: "fire",
      critBonus: 0,
      status: { type: "burn", chance: 0.3, dur: 3, power: 0.25 },
      combo: [
        {
          arc: "cast",
          power: 1.25,
          interval: 0.6,
          windup: 0.14,
          active: 0,
          range: 0,
          height: 0,
          knockback: 80,
          stagger: 0.2,
          projectile: { sprite: "p_orb", speed: 330, life: 1.6, radius: 7, aoe: 26, trail: 16744512 },
        },
      ],
      special: { name: "마력 폭발", desc: "커서 위치에 거대한 마력 폭발을 일으킨다.", cooldown: 6, power: 3.2 },
      upgrade: {
        costBase: 120,
        dmgPerLevel: 0.09,
        specialPerLevel: 0.1,
        perks: [
          { level: 3, desc: "화상 확률 +25%", mods: { statusChance: 0.25 } },
          { level: 6, desc: "폭발 범위 +40%", mods: { specialRadius: 0.4 } },
          { level: 10, desc: "특수 공격 재사용 대기시간 -30%", mods: { specialCdr: 0.3 } },
          { level: 15, desc: "특수 공격 위력 +50%", mods: { specialPower: 0.5 } },
        ],
      },
      look: { blade: 6965898, hilt: 4860442, accent: 16744512 },
      strong: "무리, 마법 빌드",
      weak: "빠르게 접근하는 적",
    },
    {
      id: "hammer",
      name: "전투 망치",
      rarity: "rare",
      price: 750,
      unlock: "tier2_weapons",
      kind: "melee",
      flat: 4,
      desc: "적의 방어력을 파괴하고 길게 경직시킨다. 방어형 적의 천적.",
      element: "phys",
      critBonus: 0,
      status: { type: "armorBreak", chance: 0.6, dur: 4, power: 0.5 },
      combo: [
        {
          arc: "heavy",
          power: 2.3,
          interval: 0.85,
          windup: 0.24,
          active: 0.1,
          range: 42,
          height: 40,
          knockback: 200,
          stagger: 0.75,
          shake: 2,
        },
        {
          arc: "smash",
          power: 3.4,
          interval: 1.1,
          windup: 0.3,
          active: 0.12,
          range: 46,
          height: 44,
          back: 8,
          knockback: 280,
          stagger: 1,
          shake: 4,
        },
      ],
      special: {
        name: "강력한 내려찍기",
        desc: "도약 후 내려찍어 주변을 기절시키는 충격을 일으킨다.",
        cooldown: 6,
        power: 3.5,
      },
      upgrade: {
        costBase: 110,
        dmgPerLevel: 0.1,
        specialPerLevel: 0.1,
        perks: [
          { level: 3, desc: "경직 시간 +30%", mods: { stunDur: 0.3 } },
          { level: 6, desc: "마무리 타격이 충격파 발생", mods: { comboWave: 1 } },
          { level: 10, desc: "내려찍기 범위 +60%", mods: { specialRadius: 0.6 } },
          { level: 15, desc: "방어력 파괴 효과 강화", mods: { armorBreak: 0.4 } },
        ],
      },
      look: { blade: 8026760, hilt: 5913114, accent: 11569712 },
      strong: "방어형, 대형 적, 보스",
      weak: "빠른 적, 비행형 적",
    },
    {
      id: "scythe",
      name: "낫",
      rarity: "epic",
      price: 2400,
      unlock: "rare_weapons",
      kind: "melee",
      flat: 3,
      desc: "앞뒤를 모두 베는 넓은 공격 범위. 둘러싸였을 때 강하다.",
      element: "dark",
      critBonus: 0.03,
      combo: [
        {
          arc: "spin",
          power: 1.4,
          interval: 0.6,
          windup: 0.1,
          active: 0.14,
          range: 48,
          height: 42,
          back: 40,
          knockback: 160,
          stagger: 0.3,
        },
        {
          arc: "spin",
          power: 2,
          interval: 0.8,
          windup: 0.14,
          active: 0.16,
          range: 52,
          height: 48,
          back: 46,
          knockback: 220,
          stagger: 0.4,
        },
      ],
      special: {
        name: "회전 참격",
        desc: "1.4초 동안 회전하며 주변의 모든 적을 연속으로 벤다.",
        cooldown: 7,
        power: 0.7,
      },
      upgrade: {
        costBase: 220,
        dmgPerLevel: 0.095,
        specialPerLevel: 0.1,
        perks: [
          { level: 3, desc: "적중 시 피해의 3% 흡혈", mods: { lifesteal: 0.03 } },
          { level: 6, desc: "회전 참격 지속시간 +40%", mods: { specialCount: 4 } },
          { level: 10, desc: "적중 시 중독", mods: { statusChance: 0.4 } },
          { level: 15, desc: "치명타 피해 +50%", mods: { critDamage: 0.5 } },
        ],
      },
      look: { blade: 11055304, hilt: 2759210, accent: 9059024 },
      strong: "포위 상황, 무리",
      weak: "원거리형 적",
    },
    {
      id: "crossbow",
      name: "석궁",
      rarity: "epic",
      price: 2e3,
      unlock: "rare_weapons",
      kind: "ranged",
      flat: 6,
      desc: "느리지만 강력한 볼트로 적을 관통한다.",
      element: "phys",
      critBonus: 0.08,
      combo: [
        {
          arc: "bolt",
          power: 3.2,
          interval: 1.1,
          windup: 0.08,
          active: 0,
          range: 0,
          height: 0,
          knockback: 260,
          stagger: 0.5,
          projectile: { sprite: "p_bolt", speed: 820, gravity: 60, life: 1.1, radius: 5, pierce: 2 },
        },
      ],
      special: { name: "관통 볼트", desc: "모든 적을 관통하는 거대한 볼트를 발사한다.", cooldown: 5, power: 5 },
      upgrade: {
        costBase: 200,
        dmgPerLevel: 0.1,
        specialPerLevel: 0.1,
        perks: [
          { level: 3, desc: "관통 +2", mods: { pierce: 2 } },
          { level: 6, desc: "치명타 확률 +15%", mods: { critChance: 0.15 } },
          { level: 10, desc: "공격 속도 +20%", mods: { attackSpeed: 0.2 } },
          { level: 15, desc: "특수 공격 위력 +60%", mods: { specialPower: 0.6 } },
        ],
      },
      look: { blade: 5917242, hilt: 3811866, accent: 10528944 },
      strong: "일렬로 선 적, 엘리트",
      weak: "근접 무리",
    },
    {
      id: "gauntlet",
      name: "건틀릿",
      rarity: "uncommon",
      price: 240,
      kind: "melee",
      flat: 1,
      desc: "사거리는 짧지만 가장 빠른 공격. 마지막 타격이 적을 띄워 날린다.",
      element: "phys",
      critBonus: 0.04,
      combo: [
        {
          arc: "punch",
          power: 0.5,
          interval: 0.14,
          windup: 0.02,
          active: 0.06,
          range: 22,
          height: 22,
          knockback: 40,
          stagger: 0.12,
        },
        {
          arc: "punch",
          power: 0.5,
          interval: 0.14,
          windup: 0.02,
          active: 0.06,
          range: 22,
          height: 22,
          knockback: 40,
          stagger: 0.12,
        },
        {
          arc: "punch",
          power: 0.6,
          interval: 0.16,
          windup: 0.02,
          active: 0.06,
          range: 24,
          height: 22,
          knockback: 60,
          stagger: 0.15,
        },
        {
          arc: "punch",
          power: 1.5,
          interval: 0.4,
          windup: 0.08,
          active: 0.08,
          range: 28,
          height: 30,
          knockback: 300,
          stagger: 0.5,
          lunge: 120,
          shake: 2,
        },
      ],
      special: { name: "연속 충격권", desc: "8연타 후 강력한 충격파 펀치를 날린다.", cooldown: 5, power: 0.55 },
      upgrade: {
        costBase: 55,
        dmgPerLevel: 0.085,
        specialPerLevel: 0.09,
        perks: [
          { level: 3, desc: "마무리 타격 경직 +40%", mods: { stunDur: 0.4 } },
          { level: 6, desc: "공격 속도 +10%", mods: { attackSpeed: 0.1 } },
          { level: 10, desc: "마지막 충격권 범위 +60%", mods: { specialRadius: 0.6 } },
          { level: 15, desc: "치명타 확률 +12%", mods: { critChance: 0.12 } },
        ],
      },
      look: { blade: 10133674, hilt: 6961706, accent: 13672512 },
      strong: "단일 대상, 보스",
      weak: "원거리형, 광역 공격형 적",
    },
  ],
  ae = Object.fromEntries(ce.map((A) => [A.id, A])),
  he = {};
function fn(A) {
  const { blade: S, hilt: T, accent: C } = A.look,
    E = st(S, 0.45),
    R = st(S, -0.35);
  let h;
  switch (A.id) {
    case "sword": {
      ((h = new ht(26, 9)),
        h.rect(1, 3, 5, 3, T),
        h.rect(0, 3, 1, 3, C),
        h.rect(6, 1, 2, 7, C),
        h.px(6, 1, st(C, 0.4)),
        h.rect(8, 3, 15, 3, S),
        h.rect(8, 3, 15, 1, E),
        h.rect(8, 5, 15, 1, R),
        h.px(23, 4, S),
        h.px(24, 4, E),
        h.px(15, 5, st(S, -0.5)),
        h.px(19, 3, st(S, -0.2)),
        (he[A.id] = [3 / 26, 0.5]));
      break;
    }
    case "greatsword": {
      ((h = new ht(40, 13)),
        h.rect(0, 5, 8, 3, T),
        h.rect(0, 5, 1, 3, C),
        h.rect(8, 1, 3, 11, C),
        h.rect(8, 1, 3, 1, st(C, 0.4)),
        h.poly(
          [
            [11, 3],
            [36, 4],
            [39, 6.5],
            [36, 9],
            [11, 10],
          ],
          S,
        ),
        h.rect(11, 3, 25, 1, E),
        h.rect(12, 6, 22, 1, st(S, -0.15)),
        h.rect(11, 9, 25, 1, R),
        h.rect(12, 5, 6, 3, st(C, -0.2)),
        (he[A.id] = [4 / 40, 0.5]));
      break;
    }
    case "dual": {
      ((h = new ht(18, 7)),
        h.rect(0, 2, 4, 3, T),
        h.rect(4, 0, 2, 7, C),
        h.poly(
          [
            [6, 2],
            [15, 2],
            [17, 3.5],
            [15, 5],
            [6, 5],
          ],
          S,
        ),
        h.rect(6, 2, 9, 1, E),
        h.rect(6, 4, 9, 1, R),
        (he[A.id] = [2 / 18, 0.5]));
      break;
    }
    case "spear": {
      ((h = new ht(48, 9)),
        h.rect(0, 4, 36, 2, T),
        h.rect(0, 4, 36, 1, st(T, 0.3)),
        h.rect(10, 3, 2, 4, st(T, -0.3)),
        h.rect(33, 2, 3, 6, C),
        h.poly(
          [
            [36, 1],
            [47, 4.5],
            [36, 8],
          ],
          S,
        ),
        h.line(37, 4, 46, 4, E),
        h.line(37, 6, 44, 5, R),
        h.px(34, 8, C),
        h.px(33, 9, C),
        (he[A.id] = [14 / 48, 0.55]));
      break;
    }
    case "bow": {
      h = new ht(12, 30);
      for (let m = 0; m < 30; m++) {
        const t = (m - 14.5) / 14.5,
          a = Math.round(2 + (1 - t * t) * 6);
        h.rect(a, m, 2, 1, m % 7 === 0 ? st(S, 0.3) : S);
      }
      // 활: 휜 등(배)은 앞(겨누는 쪽), 시위는 몸 쪽
      (h.line(2, 1, 2, 28, C), h.rect(7, 12, 3, 6, T), (he[A.id] = [8 / 12, 0.5]));
      break;
    }
    case "staff": {
      ((h = new ht(32, 11)),
        h.rect(0, 5, 24, 2, T),
        h.rect(0, 5, 24, 1, st(T, 0.3)),
        h.rect(22, 3, 2, 6, S),
        h.rect(24, 2, 2, 8, S),
        h.circle(28, 5, 3, C),
        h.px(27, 4, 16777215),
        h.px(28, 4, st(C, 0.6)),
        h.px(25, 1, S),
        h.px(25, 9, S),
        (he[A.id] = [8 / 32, 0.55]));
      break;
    }
    case "hammer": {
      ((h = new ht(30, 16)),
        h.rect(0, 7, 22, 3, T),
        h.rect(0, 7, 22, 1, st(T, 0.3)),
        h.rect(3, 7, 2, 3, C),
        h.rect(20, 1, 9, 14, S),
        h.rect(20, 1, 9, 2, E),
        h.rect(20, 13, 9, 2, R),
        h.rect(22, 4, 5, 8, st(S, 0.1)),
        h.rect(19, 5, 1, 6, C),
        h.rect(29, 3, 1, 10, R),
        (he[A.id] = [4 / 30, 0.53]));
      break;
    }
    case "scythe": {
      ((h = new ht(36, 24)), h.rect(0, 17, 30, 2, T), h.rect(0, 17, 30, 1, st(T, 0.3)), h.rect(28, 15, 3, 5, C));
      for (let m = 0; m < 26; m++) {
        const t = m / 25,
          a = 31 - t * 26,
          v = 16 - Math.sin(t * Math.PI * 0.9) * 13 + t * 4,
          o = Math.max(1, Math.round(4 * (1 - t)));
        (h.rect(a, v - o / 2, 2, o, S), h.px(a, v - o / 2, E));
      }
      (h.px(5, 20, C), (he[A.id] = [6 / 36, 0.75]));
      break;
    }
    case "crossbow": {
      ((h = new ht(22, 14)),
        h.rect(0, 6, 16, 3, T),
        h.rect(0, 6, 16, 1, st(T, 0.3)),
        h.rect(3, 9, 3, 4, st(T, -0.2)),
        h.line(15, 1, 18, 7, C),
        h.line(15, 13, 18, 7, C),
        h.line(16, 1, 19, 7, C),
        h.line(16, 13, 19, 7, C),
        h.line(15, 1, 8, 7, 14209216),
        h.line(15, 13, 8, 7, 14209216),
        h.rect(8, 6, 13, 1, 10528944),
        h.px(21, 6, 14739696),
        (he[A.id] = [5 / 22, 0.55]));
      break;
    }
    case "gauntlet":
    default: {
      ((h = new ht(10, 9)),
        h.rect(1, 1, 7, 7, S),
        h.rect(1, 1, 7, 2, E),
        h.rect(1, 6, 7, 1, R),
        h.rect(7, 2, 2, 5, st(S, 0.2)),
        h.px(8, 3, C),
        h.px(8, 5, C),
        h.rect(0, 2, 2, 5, T),
        (he[A.id] = [0.3, 0.5]));
      break;
    }
  }
  return (h.outline(), h);
}
function hi(A, S, T, C, E, R, h = !1) {
  return Pt(
    E,
    R,
    R,
    (m, t) => {
      const a = R / 2,
        v = R / 2,
        o = (t + 1) / E,
        n = -C / 2,
        i = -C / 2 + C * Math.min(1, o * 1.6),
        e = t < E - 1 ? 1 : 0.5,
        r = h ? [0, 0.35] : [0];
      for (const l of r)
        for (let s = n; s <= i; s += 0.02) {
          const u = (s - n) / Math.max(0.001, i - n),
            d = Math.max(1, T * Math.sin(Math.PI * Math.min(1, u)) * (1 - t * 0.12));
          for (let f = 0; f < d; f++) {
            const c = S - f - l * S * 0.3,
              p = a + Math.cos(s) * c,
              g = v + Math.sin(s) * c,
              y = f < 1 ? 16777215 : Ke(A, 16777215, 0.3 - f * 0.05);
            m.px(p, g, y, Math.round(255 * e * (f < 1 ? 1 : 0.85)));
          }
        }
    },
    null,
  );
}
function dn(A) {
  for (const S of ce) lt(A, `w_${S.id}`, fn(S));
  (Et(A, "fx_slash", hi(14213375, 22, 6, Math.PI * 1.1, 4, 52), 52, 52),
    Et(A, "fx_heavy", hi(16769200, 30, 9, Math.PI * 1.25, 4, 72), 72, 72),
    Et(A, "fx_twin", hi(14733567, 17, 4, Math.PI * 0.9, 4, 40, !0), 40, 40),
    Et(A, "fx_spin", hi(13148415, 30, 6, Math.PI * 2, 4, 72), 72, 72),
    Et(
      A,
      "fx_thrust",
      Pt(
        4,
        64,
        12,
        (S, T) => {
          const C = 30 + T * 10;
          for (let E = 0; E < C; E++) {
            const R = E / C,
              h = Math.max(1, Math.round(3 * R * (1 - T * 0.2)));
            S.rect(E, 6 - h / 2, 1, h, Ke(10535167, 16777215, R), Math.round(255 * (0.3 + 0.7 * R)));
          }
        },
        null,
      ),
      64,
      12,
    ),
    Et(
      A,
      "fx_punch",
      Pt(
        4,
        24,
        24,
        (S, T) => {
          const C = 3 + T * 3;
          S.ring(12, 12, C, 2, 16771248, 255 - T * 50);
          for (let E = 0; E < 6; E++) {
            const R = (E / 6) * Math.PI * 2 + T;
            S.line(
              12 + Math.cos(R) * C,
              12 + Math.sin(R) * C,
              12 + Math.cos(R) * (C + 3),
              12 + Math.sin(R) * (C + 3),
              16777215,
              200 - T * 40,
            );
          }
        },
        null,
      ),
      24,
      24,
    ),
    Et(
      A,
      "fx_smash",
      Pt(
        5,
        64,
        24,
        (S, T) => {
          const C = 10 + T * 6;
          for (let E = 0; E < 12; E++) {
            const R = 32 + ((E / 11) * 2 - 1) * C,
              h = Math.max(1, (6 - T) * (1 - Math.abs((E / 11) * 2 - 1)) * 2);
            S.circle(R, 22 - h, Math.max(1, 3 - T * 0.4), 14207144, 220 - T * 40);
          }
          T < 3 && S.line(32 - C, 23, 32 + C, 23, 16777215, 200);
        },
        null,
      ),
      64,
      24,
    ),
    lt(
      A,
      "p_arrow",
      (() => {
        const S = new ht(14, 5);
        return (
          S.rect(0, 2, 11, 1, 9067050),
          S.poly(
            [
              [10, 0],
              [14, 2.5],
              [10, 5],
            ],
            13685980,
          ),
          S.rect(0, 1, 3, 1, 14737616),
          S.rect(0, 3, 3, 1, 14737616),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_bolt",
      (() => {
        const S = new ht(16, 5);
        return (
          S.rect(0, 2, 12, 1, 5917242),
          S.rect(0, 1, 12, 1, 8022618),
          S.poly(
            [
              [11, 0],
              [16, 2.5],
              [11, 5],
            ],
            10528944,
          ),
          S.rect(0, 0, 2, 5, 12595248),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_bigbolt",
      (() => {
        const S = new ht(28, 9);
        return (
          S.rect(0, 3, 22, 3, 5917242),
          S.rect(0, 3, 22, 1, 9075306),
          S.poly(
            [
              [20, 0],
              [28, 4.5],
              [20, 9],
            ],
            13687008,
          ),
          S.rect(0, 1, 3, 7, 16764992),
          S.outline(),
          S
        );
      })(),
    ),
    Et(
      A,
      "p_orb",
      Pt(
        4,
        14,
        14,
        (S, T) => {
          (S.circle(7, 7, 5, 16736288, 180),
            S.circle(7, 7, 4, 16752704),
            S.circle(7, 7, 2, 16769184),
            S.px(6 + (T % 2), 5, 16777215));
          for (let C = 0; C < 3; C++) {
            const E = T * 0.8 + C * 2.1;
            S.px(7 + Math.cos(E) * 6, 7 + Math.sin(E) * 6, 16765024);
          }
        },
        null,
      ),
      14,
      14,
    ),
    lt(
      A,
      "p_rock",
      (() => {
        const S = new ht(9, 9);
        return (S.circle(4, 4, 3, 9077880), S.px(3, 3, 11578010), S.px(5, 5, 5919816), S.outline(), S);
      })(),
    ),
    lt(
      A,
      "p_bigrock",
      (() => {
        const S = new ht(18, 18);
        return (
          S.circle(9, 9, 7, 9076848),
          S.circle(7, 7, 3, 11051152),
          S.px(11, 12, 5919816),
          S.px(12, 11, 5919816),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_thorn",
      (() => {
        const S = new ht(10, 5);
        return (
          S.poly(
            [
              [0, 1],
              [10, 2.5],
              [0, 4],
            ],
            8044608,
          ),
          S.px(2, 2, 12644480),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_spore",
      (() => {
        const S = new ht(10, 10);
        return (S.circle(5, 5, 4, 10145856, 220), S.circle(4, 4, 1, 14745488), S.outline(2768912), S);
      })(),
    ),
    lt(
      A,
      "p_bomb",
      (() => {
        const S = new ht(11, 12);
        return (
          S.circle(5, 7, 4, 2763316),
          S.px(4, 5, 6974074),
          S.rect(5, 1, 1, 3, 9071168),
          S.px(6, 0, 16752672),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_fire",
      (() => {
        const S = new ht(11, 11);
        return (S.circle(5, 5, 4, 16736288), S.circle(5, 5, 2, 16764992), S.px(4, 4, 16777215), S);
      })(),
    ),
    lt(
      A,
      "p_sand",
      (() => {
        const S = new ht(11, 11);
        return (S.circle(5, 5, 4, 14200944, 200), S.circle(5, 5, 2, 15784096), S.px(7, 3, 16777215), S);
      })(),
    ),
    lt(
      A,
      "p_icicle",
      (() => {
        const S = new ht(12, 5);
        return (
          S.poly(
            [
              [0, 1],
              [12, 2.5],
              [0, 4],
            ],
            10543359,
          ),
          S.line(1, 2, 9, 2, 16777215),
          S.outline(3166320),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_snowball",
      (() => {
        const S = new ht(15, 15);
        return (S.circle(7, 7, 6, 15266047), S.circle(5, 5, 2, 16777215), S.px(9, 10, 11583704), S.outline(5267576), S);
      })(),
    ),
    lt(
      A,
      "p_ebolt",
      (() => {
        const S = new ht(14, 4);
        return (
          S.rect(0, 1, 10, 2, 4864554),
          S.poly(
            [
              [9, 0],
              [14, 2],
              [9, 4],
            ],
            11581632,
          ),
          S.rect(0, 0, 2, 4, 9449504),
          S
        );
      })(),
    ),
    lt(
      A,
      "p_ballista",
      (() => {
        const S = new ht(30, 7);
        return (
          S.rect(0, 2, 24, 3, 6965802),
          S.rect(0, 2, 24, 1, 9071178),
          S.poly(
            [
              [22, 0],
              [30, 3.5],
              [22, 7],
            ],
            12634320,
          ),
          S.rect(0, 0, 3, 7, 10496544),
          S.outline(),
          S
        );
      })(),
    ),
    Et(
      A,
      "p_void",
      Pt(
        4,
        14,
        14,
        (S, T) => {
          (S.circle(7, 7, 5, 6299808, 200), S.circle(7, 7, 3, 11559167), S.circle(7, 7, 1, 16769279));
          for (let C = 0; C < 4; C++) {
            const E = -T * 0.7 + C * 1.57;
            S.px(7 + Math.cos(E) * 6, 7 + Math.sin(E) * 6, 13668607);
          }
        },
        null,
      ),
      14,
      14,
    ),
    Et(
      A,
      "p_arcane",
      Pt(
        4,
        12,
        12,
        (S, T) => {
          const C = 3 + (T % 2);
          (S.poly(
            [
              [6, 6 - C - 1],
              [6 + C, 6],
              [6, 6 + C + 1],
              [6 - C, 6],
            ],
            8429823,
          ),
            S.poly(
              [
                [6, 4],
                [8, 6],
                [6, 8],
                [4, 6],
              ],
              14741759,
            ));
        },
        null,
      ),
      12,
      12,
    ),
    lt(
      A,
      "p_wave",
      (() => {
        const S = new ht(18, 28);
        for (let T = 0; T < 28; T++) {
          const C = Math.round(6 * Math.sin((T / 27) * Math.PI)) + 1;
          (S.rect(10 - C, T, C, 1, 15259808, 200), S.px(10, T, 16777215));
        }
        return S;
      })(),
    ),
    lt(
      A,
      "p_swordwave",
      (() => {
        const S = new ht(16, 30);
        for (let T = 0; T < 30; T++) {
          const C = (T - 14.5) / 14.5,
            E = Math.round(10 - (1 - C * C) * 6);
          (S.rect(E, T, 3, 1, 12638463, 220), S.px(E + 2, T, 16777215));
        }
        return S;
      })(),
    ),
    lt(
      A,
      "p_shadow",
      (() => {
        const S = new ht(12, 12);
        return (S.circle(6, 6, 5, 4198496, 200), S.circle(6, 6, 3, 9457872), S);
      })(),
    ),
    lt(
      A,
      "p_blade",
      (() => {
        const S = new ht(13, 13);
        return (
          S.poly(
            [
              [6.5, 0],
              [8, 5],
              [13, 6.5],
              [8, 8],
              [6.5, 13],
              [5, 8],
              [0, 6.5],
              [5, 5],
            ],
            12636384,
          ),
          S.circle(6.5, 6.5, 1.5, 16777215),
          S.outline(),
          S
        );
      })(),
    ));
}
const cn = (A) => ({
    f: A,
    idle: A < 2,
    move: A >= 2 && A < 6,
    wind: A === 6,
    atk: A === 7,
    hurt: A === 8,
    m: A >= 2 && A < 6 ? A - 2 : 0,
    b: A < 2 ? A : A >= 2 && A < 6 ? [0, 1, 0, -1][A - 2] : 0,
  }),
  ye = (A, S, T, C = 1052688, E = !0) => {
    (A.rect(S, T, 2, 2, C), E && A.px(S, T, 16777215));
  },
  ee = (A, S, T, C) => {
    (A.rect(S, T, 2, 1, C), A.px(S + 1, T, st(C, 0.6)));
  };
function Le(A, S, T, C, E, R) {
  T.forEach((h, m) => {
    const t = S.move ? Math.sin(((S.m + m * 1.5) * Math.PI) / 2) * 2 : 0;
    A.rect(h + Math.round(t), C, 2, E - (m % 2 === 0 && t > 0 ? 1 : 0), R);
  });
}
function oe(A, S, T, C, E, R, h) {
  const m = S.move ? [2, 1, -2, -1][S.m] : 0;
  (A.rect(T - 3 + m, C, 3, E, st(R, -0.2)),
    A.rect(T - 3 + m, C + E, 4, 2, st(h, -0.2)),
    A.rect(T + 1 - m, C, 3, E, R),
    A.rect(T + 1 - m, C + E, 4, 2, h));
}
const Ls = {
  slime: {
    w: 24,
    h: 18,
    draw: (A, S, T, C) => {
      const E = S.wind ? 3 : S.atk ? -3 : S.move ? [2, -2, 0, 1][S.m] : S.b,
        R = 9 + E * 0.6,
        h = 6 - E * 0.5,
        m = C - 1 - h;
      (A.ellipse(12, m, R, h, 5816384),
        A.ellipse(12, m + 1, R - 1, h - 1, 4761656),
        A.ellipse(10, m - h * 0.4, R * 0.45, h * 0.3, 9496688),
        A.px(8, m - h * 0.5, 16777215),
        ye(A, 13, m - 2),
        ye(A, 17, m - 2),
        S.hurt && A.line(13, m - 2, 14, m - 1, 1052688),
        A.rect(14, m + 2, 3, 1, 2777120));
    },
  },
  hound: {
    w: 30,
    h: 20,
    draw: (A, S, T, C) => {
      const E = S.wind ? 3 : 0,
        R = S.atk ? 3 : 0,
        h = C - 9 + E;
      (Le(A, S, [6, 9, 18, 21], C - 6, 6, 6964264),
        A.ellipse(14 + R / 2, h, 9 + R / 2, 4, 9067060),
        A.ellipse(14, h - 2, 7, 2, 11040842),
        A.line(5, h - 1, 1, h - 5 + S.b, 9067060),
        A.line(5, h, 1, h - 4 + S.b, 6964264));
      const m = 22 + R,
        t = h - 4 + E;
      (A.ellipse(m, t, 4, 3, 9067060),
        A.rect(m + 2, t, 5, 3, 9067060),
        A.rect(m + 6, t, 1, 1, 2101264),
        A.poly(
          [
            [m - 3, t - 2],
            [m - 1, t - 6],
            [m, t - 2],
          ],
          6964264,
        ),
        ee(A, m + 1, t - 1, S.wind || S.atk ? 16728096 : 16764992),
        S.atk && (A.rect(m + 2, t + 3, 5, 1, 16777215), A.rect(m + 3, t + 2, 4, 1, 10493984)));
    },
  },
  goblin: {
    w: 22,
    h: 24,
    draw: (A, S, T, C) => {
      oe(A, S, 10, C - 7, 4, 5915688, 3811866);
      const E = C - 15 + Math.max(0, S.b);
      (A.rect(6, E, 9, 8, 9071162),
        A.rect(6, E + 6, 9, 1, 5913114),
        A.ellipse(11, E - 4, 5, 4, 6987840),
        A.poly(
          [
            [5, E - 5],
            [1, E - 8],
            [7, E - 3],
          ],
          6987840,
        ),
        A.poly(
          [
            [16, E - 5],
            [21, E - 8],
            [15, E - 3],
          ],
          6987840,
        ),
        ye(A, 12, E - 5, 16769088, !1),
        A.px(13, E - 5, 1052688),
        A.rect(12, E - 2, 4, 1, 2768912),
        S.wind
          ? (A.line(14, E + 1, 17, E - 6, 6987840), A.circle(17 + (S.f % 2), E - 8, 2, 9077880))
          : S.atk
            ? A.line(14, E + 1, 20, E - 1, 6987840)
            : (A.line(14, E + 1, 16, E + 5, 6987840), A.px(16, E + 7, 9077880)));
    },
  },
  sentry: {
    w: 26,
    h: 30,
    draw: (A, S, T, C) => {
      oe(A, S, 11, C - 8, 5, 9077880, 5919816);
      const E = C - 20 + Math.max(0, S.b);
      (A.rect(7, E, 9, 12, 6972504),
        A.rect(7, E, 9, 2, 10130568),
        A.px(11, E + 4, 12630176),
        A.rect(7, E - 8, 9, 8, 9077880),
        A.rect(7, E - 8, 9, 2, 11051152),
        A.rect(12, E - 5, 4, 1, 1052688),
        A.px(14, E - 5, 16752688),
        A.rect(10, E - 10, 3, 2, 10498080));
      const R = S.atk ? 19 : S.wind ? 14 : 16,
        h = S.wind ? E - 4 : E - 1;
      (A.rect(R, h, 6, 15, 8018490),
        A.rect(R, h, 6, 1, 11040842),
        A.rect(R + 5, h, 1, 15, 5913122),
        A.rect(R + 2, h + 5, 2, 5, 13934656),
        A.rect(R + 1, h + 6, 4, 2, 13934656));
    },
  },
  sporecap: {
    w: 24,
    h: 22,
    draw: (A, S, T, C) => {
      const E = S.wind ? 2 : S.atk ? 3 : 0,
        R = !S.idle;
      if (
        (A.rect(9, C - 9, 6, 8, 14209208),
        A.rect(9, C - 9, 2, 8, 12103832),
        R && (A.rect(8 + (S.m % 2), C - 2, 3, 2, 12103832), A.rect(13 - (S.m % 2), C - 2, 3, 2, 12103832)),
        A.ellipse(12, C - 11, 10 + E, 6 + E / 2, 9058976),
        A.ellipse(12, C - 12, 8 + E, 4, 11030720),
        A.rect(3 - E, C - 10, 18 + E * 2, 2, 6957696),
        [
          [7, -14],
          [13, -16],
          [17, -12],
          [10, -11],
        ].forEach(([h, m]) => A.circle(h, C + m, 1, 15257840)),
        R && (ye(A, 11, C - 7, 1052688), ye(A, 14, C - 7, 1052688)),
        S.atk)
      )
        for (let h = 0; h < 8; h++) A.circle(3 + h * 2.5, C - 18 - (h % 3) * 2, 1, 10145856);
    },
  },
  wasp: {
    w: 22,
    h: 18,
    draw: (A, S, T, C) => {
      const E = S.f % 2 === 0,
        R = S.wind ? 3 : 0;
      (A.ellipse(7 - R / 2, 10 + R, 5, 3, 14725152),
        A.rect(4 - R / 2, 8 + R, 1, 5, 2760720),
        A.rect(7 - R / 2, 8 + R, 1, 5, 2760720),
        S.atk ? A.line(2, 12, 3, 15, 2760720) : A.line(2 - R, 12 + R, 0 + R, 14 + R * 1.5, 2760720),
        A.ellipse(13, 9, 3, 3, 3813408),
        A.ellipse(17, 8, 3, 3, 14725152),
        ye(A, 18, 7, 10493984, !1),
        A.line(19, 5, 21, 2, 2760720),
        E ? A.ellipse(12, 3, 5, 2, 13691135, 170) : A.ellipse(10, 7, 5, 2, 13691135, 170),
        A.line(12, 12, 11, 15, 2760720),
        A.line(15, 12, 15, 15, 2760720));
    },
  },
  shaman: {
    w: 22,
    h: 26,
    draw: (A, S, T, C) => {
      oe(A, S, 10, C - 6, 3, 3811866, 2759184);
      const E = C - 17 + Math.max(0, S.b);
      A.poly(
        [
          [4, E + 12],
          [7, E - 1],
          [15, E - 1],
          [18, E + 12],
        ],
        3828266,
      );
      for (let m = 0; m < 5; m++)
        A.poly(
          [
            [4 + m * 3, E + 12],
            [6 + m * 3, E + 8],
            [8 + m * 3, E + 12],
          ],
          5933626,
        );
      (A.ellipse(11, E - 3, 5, 5, 6967360),
        A.rect(8, E - 5, 7, 6, 13152384),
        A.rect(10, E - 3, 1, 2, 1052688),
        A.rect(13, E - 3, 1, 2, 1052688),
        A.rect(9, E, 5, 1, 9052192),
        A.poly(
          [
            [6, E - 6],
            [11, E - 12],
            [16, E - 6],
          ],
          5933626,
        ));
      const R = S.wind ? 17 : 16,
        h = S.wind ? E - 10 : E - 6;
      (A.line(R, C - 1, R, h, 6965802), A.circle(R, h - 2, 2 + (S.wind ? 1 : 0), S.atk || S.wind ? 11599712 : 7389248));
    },
  },
  rotbear: {
    w: 40,
    h: 30,
    draw: (A, S, T, C) => {
      const E = S.wind ? 6 : 0,
        R = S.atk ? 1 : 0;
      Le(A, S, [8, 12, 25, 29], C - 7, 7, 3811874);
      const h = C - 13 - E * 0.5;
      (A.ellipse(19, h, 13, 8 + E * 0.3, 4864554),
        A.ellipse(17, h - 3, 10, 4, 5917234),
        A.ellipse(12, h - 6, 6, 3, 4880938),
        A.ellipse(22, h - 7, 4, 2, 5937722),
        A.px(15, h - 8, 9490512));
      for (let a = 0; a < 3; a++) A.line(19 + a * 3, h + 2, 19 + a * 3, h + 6, 14209208);
      const m = 31 + R * 3,
        t = h - 4 - E + R * 6;
      (A.ellipse(m, t, 6, 5, 4864554),
        A.rect(m + 3, t, 5, 3, 5917234),
        A.ellipse(m - 3, t - 5, 2, 2, 3811874),
        ee(A, m + 1, t - 2, 12648256),
        S.wind && (A.rect(31, h - 14, 3, 8, 3811874), A.rect(31, h - 16, 4, 2, 14209208)),
        S.atk && (A.rect(34, C - 5, 5, 4, 3811874), A.rect(36, C - 2, 4, 1, 14209208)));
    },
  },
  bat: {
    w: 22,
    h: 16,
    draw: (A, S, T, C) => {
      const E = S.f % 2 === 0 || S.wind;
      (A.ellipse(11, 8, 3, 4, 4864602),
        A.poly(
          [
            [9, 4],
            [10, 1],
            [11, 4],
          ],
          4864602,
        ),
        A.poly(
          [
            [11, 4],
            [12, 1],
            [13, 4],
          ],
          4864602,
        ),
        E
          ? (A.poly(
              [
                [9, 7],
                [1, 1],
                [3, 6],
                [0, 8],
                [8, 10],
              ],
              3811914,
            ),
            A.poly(
              [
                [13, 7],
                [21, 1],
                [19, 6],
                [22, 8],
                [14, 10],
              ],
              3811914,
            ))
          : (A.poly(
              [
                [9, 7],
                [1, 13],
                [4, 11],
                [2, 15],
                [8, 10],
              ],
              3811914,
            ),
            A.poly(
              [
                [13, 7],
                [21, 13],
                [18, 11],
                [20, 15],
                [14, 10],
              ],
              3811914,
            )),
        ee(A, 10, 7, 16724016),
        A.px(13, 7, 16724016),
        S.atk && (A.px(11, 11, 16777215), A.px(12, 11, 16777215)));
    },
  },
  crawler: {
    w: 28,
    h: 18,
    draw: (A, S, T, C) => {
      const E = S.idle;
      (E || Le(A, S, [7, 11, 16, 20], C - 5, 5, 2761792),
        A.ellipse(14, C - 7, 11, 5, 3814488),
        A.ellipse(13, C - 9, 9, 3, 5130352));
      const R = 6349055;
      (A.poly(
        [
          [8, C - 10],
          [10, C - 17],
          [12, C - 10],
        ],
        R,
      ),
        A.poly(
          [
            [13, C - 11],
            [16, C - 18],
            [18, C - 10],
          ],
          st(R, -0.2),
        ),
        A.poly(
          [
            [18, C - 10],
            [21, C - 15],
            [22, C - 9],
          ],
          R,
        ),
        A.line(10, C - 16, 11, C - 12, 14745599),
        A.line(16, C - 17, 16, C - 13, 14745599),
        E ||
          (A.ellipse(25, C - 6, 3, 3, 3814488),
          ee(A, 25, C - 7, 6349055),
          S.atk && A.line(27, C - 4, 28, C - 1, 13684960)));
    },
  },
  worm: {
    w: 22,
    h: 34,
    draw: (A, S, T, C) => {
      const E = S.move ? [0, 1, 0, -1][S.m] : S.b,
        R = S.wind ? -3 : S.atk ? 4 : 0;
      for (let t = 0; t < 6; t++) {
        const a = C - 3 - t * 5,
          v = 11 + Math.round(E * (t / 5) + R * (t / 5) * (t / 5));
        (A.ellipse(v, a, 6 - t * 0.3, 3, t % 2 ? 11565706 : 12618394), A.rect(v - 5, a + 1, 10, 1, 9067114));
      }
      const h = 11 + E + R,
        m = C - 31 + (S.wind ? 2 : 0);
      (A.ellipse(h, m, 6, 4, 13671082), A.ellipse(h + 1, m, 3, S.atk ? 3 : 2, 4198432));
      for (let t = -2; t <= 3; t++) A.px(h + t, m - 2, 16777215);
      A.ellipse(11, C - 1, 9, 2, 4864554);
    },
  },
  kobold: {
    w: 20,
    h: 22,
    draw: (A, S, T, C) => {
      oe(A, S, 9, C - 6, 3, 8018490, 4864546);
      const E = C - 14 + Math.max(0, S.b);
      (A.rect(5, E, 9, 8, 10510378),
        A.rect(5, E + 6, 9, 1, 5913114),
        A.ellipse(10, E - 4, 5, 4, 12614202),
        A.rect(13, E - 3, 4, 3, 12614202),
        A.px(16, E - 3, 1052688),
        ye(A, 11, E - 5, 16769088, !1),
        A.rect(5, E - 9, 10, 3, 13676608),
        A.rect(4, E - 7, 12, 1, 10518560),
        A.rect(9, E - 11, 2, 2, 16773280),
        A.px(9, E - 12, 16752672),
        A.line(4, E + 5, 1, E + 7, 12614202),
        A.px(0, E + 8, 12614202),
        S.wind
          ? (A.line(13, E + 1, 15, E - 5, 12614202), A.circle(16, E - 7, 2, 2763316), A.px(17, E - 10, 16752672))
          : S.atk || (A.circle(15, E + 5, 2, 2763316), A.px(16, E + 2, 16752672)));
    },
  },
  scorpion: {
    w: 32,
    h: 20,
    draw: (A, S, T, C) => {
      (Le(A, S, [8, 11, 15, 18], C - 5, 5, 9069624),
        A.ellipse(14, C - 7, 9, 4, 13146200),
        A.ellipse(14, C - 8, 7, 2, 14727288));
      const E = S.atk ? 1 : 0,
        R = S.wind ? 1 : 0,
        h = E
          ? [
              [6, -7],
              [4, -11],
              [6, -15],
              [12, -17],
              [20, -15],
              [26, -11],
            ]
          : [
              [6, -7],
              [3, -10],
              [3, -14],
              [6, -17],
              [10, -18 - R * 2],
              [13, -16 - R * 2],
            ];
      h.forEach(([t, a], v) => A.circle(t, C + a, (v === h.length - 1, 2), v % 2 ? 11569224 : 13146200));
      const m = h[h.length - 1];
      (A.line(m[0], C + m[1], m[0] + 3, C + m[1] + 2, 4198416),
        A.ellipse(25, C - 8, 3, 2, 13146200),
        A.ellipse(28, C - 10, 2, 2, 11569224),
        A.px(30, C - 11, 9069624),
        A.px(30, C - 9, 9069624),
        ee(A, 22, C - 10, 2101264));
    },
  },
  raider: {
    w: 22,
    h: 28,
    draw: (A, S, T, C) => {
      const E = S.atk ? 3 : S.wind ? -2 : 0;
      oe(A, S, 10, C - 8, 5, 13150328, 6965802);
      const R = C - 18 + Math.max(0, S.b);
      (A.rect(6 + E, R, 9, 10, 6961754),
        A.rect(6 + E, R + 7, 9, 2, 14200928),
        A.ellipse(10 + E, R - 4, 4, 4, 13146216),
        A.rect(6 + E, R - 9, 9, 4, 15261904),
        A.rect(6 + E, R - 3, 9, 3, 2763322),
        A.rect(12 + E, R - 5, 2, 1, 1052688),
        A.line(5 + E, R - 7, 1 + E, R - 2, 15261904),
        S.atk
          ? (A.line(15 + E, R + 2, 21, R + 3, 14212328), A.line(15 + E, R + 3, 21, R + 4, 10528944))
          : S.wind
            ? A.line(6 + E, R + 2, 1, R - 5, 14212328)
            : (A.line(15, R + 3, 19, R - 4, 14212328), A.px(19, R - 5, 14212328)));
    },
  },
  mummy: {
    w: 20,
    h: 30,
    draw: (A, S, T, C) => {
      oe(A, S, 9, C - 8, 6, 13156512, 11051136);
      const E = C - 19 + Math.max(0, S.b);
      (A.rect(5, E, 9, 11, 13156512), A.ellipse(9, E - 4, 4, 5, 13156512));
      for (let h = 0; h < 6; h++) A.line(5, E - 6 + h * 3, 14, E - 5 + h * 3, 10130040);
      (ee(A, 9, E - 5, S.wind ? 4259792 : 3195040), A.px(12, E - 5, 3195040));
      const R = S.wind ? E - 4 : E + 2;
      if (
        (A.rect(13, R, 6, 2, 13156512),
        A.rect(13, R + 3, 5, 2, 12103824),
        A.line(16, R + 6, 15, R + 10, 10130040),
        S.wind)
      )
        for (let h = 0; h < 4; h++) A.px(15 + h, E - 9 - (h % 2), 4259792);
    },
  },
  scarab: {
    w: 14,
    h: 10,
    draw: (A, S, T, C) => {
      (Le(A, S, [3, 6, 9], C - 3, 3, 1714730),
        A.ellipse(7, C - 5, 5, 3, 2779754),
        A.line(7, C - 8, 7, C - 3, 1718842),
        A.px(5, C - 7, 8446160),
        A.rect(11, C - 5, 2, 2, 1718842),
        A.px(13, C - 6, 1718842));
    },
  },
  djinn: {
    w: 24,
    h: 28,
    draw: (A, S, T, C) => {
      const E = S.f % 2 ? 1 : -1;
      for (let m = 0; m < 8; m++) {
        const t = C - 2 - m * 1.6;
        A.ellipse(12 + Math.sin(m * 0.9 + S.f) * 2 * E, t, 1 + m * 0.5, 1, m % 2 ? 14200944 : 15255696, 220);
      }
      const R = C - 18;
      (A.ellipse(12, R, 6, 6, 14727288),
        A.ellipse(11, R - 2, 4, 3, 15784096),
        A.ellipse(12, R - 9, 4, 4, 14727288),
        ee(A, 13, R - 10, 4251840),
        A.px(11, R - 10, 4251840),
        A.rect(9, R - 13, 7, 2, 4235408),
        A.px(12, R - 15, 4251840));
      const h = S.wind ? -2 : 0;
      (A.line(7, R - 2, 3 + h, R - 6 - (S.wind ? 4 : 0), 14727288),
        A.line(17, R - 2, 21, R - 6 - (S.wind ? 4 : 0), 14727288),
        (S.wind || S.atk) && A.circle(21, R - 8, 2, 16771232));
    },
  },
  wolf: {
    w: 32,
    h: 22,
    draw: (A, S, T, C) => {
      const E = S.wind ? 3 : 0,
        R = S.atk ? 4 : 0;
      Le(A, S, [7, 10, 20, 23], C - 7, 7, 8951976);
      const h = C - 10 + E;
      (A.ellipse(15 + R / 2, h, 10 + R / 2, 5, 13161696),
        A.ellipse(15, h - 3, 8, 2, 15266047),
        A.poly(
          [
            [5, h - 2],
            [0, h - 6 + S.b],
            [1, h - 3],
            [5, h + 1],
          ],
          13161696,
        ));
      const m = 25 + R,
        t = h - 5 + E;
      (A.ellipse(m, t, 5, 4, 13161696),
        A.rect(m + 3, t, 5, 3, 14214384),
        A.px(m + 7, t, 2105392),
        A.poly(
          [
            [m - 3, t - 3],
            [m - 1, t - 8],
            [m + 1, t - 3],
          ],
          11057352,
        ),
        A.ellipse(m - 3, t + 2, 3, 3, 16777215),
        ee(A, m + 1, t - 1, 6344959),
        S.atk && (A.rect(m + 3, t + 3, 5, 1, 16777215), A.rect(m + 4, t + 2, 4, 1, 8396848)));
    },
  },
  wisp: {
    w: 20,
    h: 20,
    draw: (A, S, T, C) => {
      const E = S.wind ? 1 : 0;
      (A.poly(
        [
          [10, 3 - E],
          [15 + E, 10],
          [10, 17 + E],
          [5 - E, 10],
        ],
        8440048,
      ),
        A.poly(
          [
            [10, 6],
            [12, 10],
            [10, 14],
            [8, 10],
          ],
          14743807,
        ));
      for (let R = 0; R < 4; R++) {
        const h = S.f * 0.6 + (R * Math.PI) / 2,
          m = 10 + Math.cos(h) * 8,
          t = 10 + Math.sin(h) * 7;
        A.poly(
          [
            [m, t - 2],
            [m + 1, t],
            [m, t + 2],
            [m - 1, t],
          ],
          11593983,
        );
      }
      (A.px(11, 9, 2109520), A.px(9, 9, 2109520));
    },
  },
  yeti: {
    w: 40,
    h: 40,
    draw: (A, S, T, C) => {
      const E = S.wind ? 1 : 0;
      oe(A, S, 20, C - 9, 6, 14213352, 10531008);
      const R = C - 26 + Math.max(0, S.b);
      (A.ellipse(20, R + 6, 12, 11, 15266040), A.ellipse(19, R + 4, 9, 7, 16317695));
      for (let h = 0; h < 6; h++) A.px(11 + h * 3, R + 15, 12635352);
      (A.ellipse(22, R - 6, 7, 6, 15266040),
        A.rect(21, R - 7, 7, 6, 6324400),
        A.rect(21, R - 7, 7, 1, 8429776),
        ee(A, 25, R - 6, 1054760),
        A.rect(22, R - 3, 5, 1, 16777215),
        E
          ? (A.rect(28, R - 16, 5, 14, 15266040), A.rect(8, R - 16, 5, 14, 14213352), A.circle(30, R - 18, 3, 16777215))
          : S.atk
            ? (A.rect(29, R + 6, 6, 10, 15266040), A.rect(30, C - 3, 7, 3, 6324400))
            : (A.rect(29, R + 2, 5, 13, 15266040),
              A.rect(30, R + 14, 4, 3, 6324400),
              A.rect(7, R + 2, 4, 12, 14213352)));
    },
  },
  tortoise: {
    w: 34,
    h: 24,
    draw: (A, S, T, C) => {
      const E = S.wind;
      (E || Le(A, S, [7, 11, 21, 25], C - 5, 5, 5929104),
        A.ellipse(16, C - 9, 13, 7, 6982312),
        A.ellipse(16, C - 11, 11, 5, 9089232));
      for (let R = 0; R < 4; R++)
        A.poly(
          [
            [7 + R * 6, C - 13],
            [9 + R * 6, C - 21 + (R % 2) * 2],
            [11 + R * 6, C - 13],
          ],
          12644607,
        );
      if ((A.line(8, C - 12, 24, C - 12, 5929104), !E)) {
        const R = S.atk ? 31 : 29;
        (A.ellipse(R, C - 8, 4, 3, 5929104), ee(A, R + 1, C - 9, 8446207));
      }
    },
  },
  pikeman: {
    w: 22,
    h: 32,
    draw: (A, S, T, C) => {
      oe(A, S, 9, C - 8, 5, 4860450, 2759188);
      const E = C - 20 + Math.max(0, S.b);
      (A.rect(5, E, 9, 12, 10103330),
        A.rect(5, E, 9, 2, 11053232),
        A.rect(8, E + 3, 3, 5, 14200896),
        A.rect(5, E - 8, 9, 8, 11053232),
        A.rect(5, E - 8, 9, 2, 13684952),
        A.rect(10, E - 5, 4, 1, 1052688),
        A.rect(8, E - 11, 2, 3, 12591136));
      const R = S.atk ? 8 : S.wind ? -4 : 0;
      (A.line(0 + R, E + 4, 20 + R, E + 4, 6965802),
        A.poly(
          [
            [20 + R, E + 2],
            [24 + R, E + 4],
            [20 + R, E + 6],
          ],
          13685980,
        ),
        A.rect(14, E - 2, 6, 14, 8006178),
        A.rect(14, E - 2, 6, 1, 14200896),
        A.rect(16, E + 3, 2, 4, 14200896));
    },
  },
  xbowman: {
    w: 22,
    h: 28,
    draw: (A, S, T, C) => {
      oe(A, S, 9, C - 8, 5, 4860450, 2759188);
      const E = C - 18 + Math.max(0, S.b);
      (A.rect(5, E, 9, 10, 11024938),
        A.rect(5, E + 8, 9, 1, 3811874),
        A.rect(8, E + 2, 3, 3, 15259808),
        A.ellipse(9, E - 4, 4, 4, 14725264),
        A.rect(5, E - 9, 9, 4, 9079448),
        A.rect(4, E - 6, 11, 1, 6974072),
        A.px(11, E - 4, 1052688));
      const R = S.wind || S.atk;
      (A.rect(11, E + (R ? 0 : 3), 8, 2, 5917242),
        A.line(18, E - 3 + (R ? 0 : 3), 18, E + 5 + (R ? 0 : 3), 10123866),
        !S.atk && R && A.rect(12, E - 1, 7, 1, 11581632));
    },
  },
  ballista: {
    w: 36,
    h: 24,
    draw: (A, S, T, C) => {
      (A.circle(8, C - 5, 4, 5913122),
        A.circle(26, C - 5, 4, 5913122),
        A.px(8, C - 5, 10526880),
        A.px(26, C - 5, 10526880),
        A.rect(4, C - 11, 28, 4, 8018490),
        A.rect(4, C - 11, 28, 1, 10123866),
        A.rect(14, C - 16, 6, 6, 6965802));
      const E = S.wind ? 4 : 0;
      (A.line(28, C - 22, 31, C - 15, 9071178),
        A.line(28, C - 8, 31, C - 15, 9071178),
        A.line(29, C - 22, 32, C - 15, 6965802),
        A.line(28, C - 22, 18 - E, C - 15, 14209216),
        A.line(28, C - 8, 18 - E, C - 15, 14209216),
        S.atk ||
          (A.rect(14 - E, C - 16, 20, 2, 5913122),
          A.poly(
            [
              [33 - E, C - 17],
              [36 - E, C - 15],
              [33 - E, C - 13],
            ],
            12634320,
          )),
        A.rect(2, C - 14, 4, 4, 10496544));
    },
  },
  bomber: {
    w: 22,
    h: 28,
    draw: (A, S, T, C) => {
      oe(A, S, 9, C - 8, 5, 3811874, 2759188);
      const E = C - 18 + Math.max(0, S.b);
      (A.rect(5, E, 9, 10, 6965810),
        A.rect(6, E + 1, 7, 8, 9071178),
        A.rect(5, E + 8, 9, 1, 3811874),
        A.circle(7, E + 4, 1, 2763316),
        A.circle(11, E + 4, 1, 2763316),
        A.ellipse(9, E - 4, 4, 4, 4868690),
        A.rect(10, E - 5, 4, 2, 16748576),
        A.rect(5, E - 9, 9, 3, 10103330),
        S.wind
          ? (A.line(13, E + 1, 15, E - 7, 6965810), A.circle(16, E - 9, 2, 16736288), A.px(16, E - 12, 16769088))
          : S.atk || (A.circle(15, E + 6, 2, 16736288), A.px(15, E + 3, 16769088)));
    },
  },
  banner: {
    w: 24,
    h: 36,
    draw: (A, S, T, C) => {
      oe(A, S, 9, C - 8, 5, 4860450, 2759188);
      const E = C - 20 + Math.max(0, S.b);
      (A.rect(5, E, 9, 12, 10103330),
        A.rect(5, E, 9, 2, 14200896),
        A.rect(5, E - 8, 9, 8, 11053232),
        A.rect(10, E - 5, 4, 1, 1052688));
      const R = S.f % 2;
      (A.line(16, C - 1, 16, 1, 6965802),
        A.px(16, 0, 14200896),
        A.poly(
          [
            [17, 2],
            [23, 3 + R],
            [23, 14 + R],
            [17, 13],
          ],
          S.wind || S.atk ? 14692384 : 11545120,
        ),
        A.circle(20, 8 + R / 2, 2, 14200896),
        A.rect(13, E + 2, 3, 2, 14725264));
    },
  },
  tentacle: {
    w: 20,
    h: 40,
    draw: (A, S, T, C) => {
      if ((A.ellipse(10, C - 2, 9, 2, 2759226), A.ellipse(10, C - 2, 6, 1, 6957728), S.idle)) {
        (A.px(8, C - 3, 13656319), A.px(12, C - 3, 13656319));
        return;
      }
      const E = S.move ? 0.7 : 1,
        R = S.wind ? -5 : S.atk ? 7 : [0, 2, 0, -2][S.m],
        h = Math.round(12 * E);
      for (let a = 0; a < h; a++) {
        const v = a / 11,
          o = 10 + Math.sin(v * 2.2) * R * v,
          n = C - 3 - a * 3;
        (A.circle(o, n, Math.max(1, 4 - v * 3), 5909114), a % 2 && A.px(o + 1, n, 12615904));
      }
      const m = 10 + Math.sin(2.2) * R,
        t = C - 3 - (h - 1) * 3;
      (A.circle(m, t, 2, 8010400), A.px(m, t, 16736511));
    },
  },
  voideye: {
    w: 24,
    h: 24,
    draw: (A, S, T, C) => {
      for (let R = 0; R < 5; R++) {
        const h = Math.PI * 0.6 + R * 0.35,
          m = Math.sin(S.f + R) * 2;
        A.line(12, 12, 12 + Math.cos(h) * 11 + m, 12 + Math.sin(h) * 11, 3807834);
      }
      (A.circle(12, 11, 8, 15259888), A.circle(12, 11, 7, 16314623));
      const E = S.wind ? 0 : 2;
      (A.circle(12 + E, 11, 4, S.wind || S.atk ? 16728256 : 9449680),
        A.circle(12 + E, 11, 2, 1048592),
        A.px(11 + E, 10, 16777215),
        A.line(5, 8, 7, 9, 12599392),
        A.line(17, 15, 19, 16, 12599392));
    },
  },
  stalker: {
    w: 22,
    h: 28,
    draw: (A, S, T, C) => {
      const E = S.atk ? 3 : 0;
      for (let h = 0; h < 4; h++) A.px(4 + h * 4, C - 1 - ((S.f + h) % 3), 3807834);
      (A.poly(
        [
          [5, C - 1],
          [8 + E, C - 20],
          [15 + E, C - 20],
          [17, C - 1],
        ],
        1706538,
      ),
        A.poly(
          [
            [7, C - 5],
            [9 + E, C - 18],
            [13 + E, C - 18],
            [15, C - 5],
          ],
          2759230,
        ),
        A.ellipse(11 + E, C - 23, 4, 4, 1706538),
        ee(A, 12 + E, C - 24, 16728224),
        A.px(10 + E, C - 24, 16728224));
      const R = S.wind ? 18 : S.atk ? 20 : 16;
      for (let h = 0; h < 3; h++) A.line(R, C - 15 + h * 2, R + 4, C - 13 + h * 3, 12624096);
    },
  },
  caller: {
    w: 22,
    h: 32,
    draw: (A, S, T, C) => {
      const E = S.f % 2;
      A.poly(
        [
          [4, C - 2 - E],
          [8, C - 24],
          [14, C - 24],
          [18, C - 2 - E],
        ],
        2759226,
      );
      for (let m = 0; m < 4; m++)
        A.poly(
          [
            [4 + m * 4, C - 2 - E],
            [6 + m * 4, C - 6],
            [8 + m * 4, C - 2 - E],
          ],
          1706538,
        );
      (A.ellipse(11, C - 26, 5, 5, 2759226), A.ellipse(12, C - 25, 3, 3, 656400), ee(A, 12, C - 26, 6356944));
      const R = S.wind ? 18 : 17,
        h = S.wind ? C - 30 : C - 18;
      if ((A.line(15, C - 18, R, h, 5917290), A.circle(R, h + 3, 2, 14209216), A.px(R, h + 3, 6356944), S.wind))
        for (let m = 0; m < 5; m++) A.px(R - 4 + m * 2, h - 2 - (m % 2) * 2, 6356944);
    },
  },
  soul: {
    w: 14,
    h: 14,
    draw: (A, S, T, C) => {
      for (let E = 0; E < 5; E++) A.circle(5 - E * 1.2, 8 + Math.sin(S.f + E) * 1, 3 - E * 0.5, 6344896, 200 - E * 30);
      (A.circle(8, 7, 4, 10551280, 230), ee(A, 8, 6, 1060912), A.px(10, 6, 1060912));
    },
  },
  sentinel: {
    w: 20,
    h: 36,
    draw: (A, S, T, C) => {
      (A.rect(4, C - 6, 12, 6, 6972544),
        A.rect(4, C - 6, 12, 1, 10130608),
        A.poly(
          [
            [5, C - 6],
            [10, C - 28],
            [15, C - 6],
          ],
          5271744,
        ),
        A.poly(
          [
            [8, C - 8],
            [10, C - 24],
            [12, C - 8],
          ],
          9482495,
        ));
      const E = S.f % 2,
        R = C - 32 + E;
      (A.circle(10, R, 3 + (S.wind ? 1 : 0), S.wind || S.atk ? 14741759 : 8429823),
        A.px(10, R, 16777215),
        A.ring(10, R, 5, 1, 6324432, 160));
    },
  },
  phantom: {
    w: 24,
    h: 32,
    draw: (A, S, T, C) => {
      const R = C - 20 + Math.max(0, S.b);
      (A.poly(
        [
          [6, C - 2],
          [8, R + 8],
          [16, R + 8],
          [17, C - 2],
        ],
        5271728,
        150,
      ),
        A.rect(6, R, 10, 10, 6324416, 210),
        A.rect(6, R, 10, 2, 10535167, 210),
        A.rect(9, R + 3, 4, 4, 13689087, 210),
        A.rect(6, R - 8, 10, 8, 6324416, 210),
        A.rect(11, R - 5, 4, 1, 14743807),
        A.rect(9, R - 11, 2, 3, 10535167, 210));
      const h = S.atk ? 1 : 0,
        m = S.wind ? 1 : 0;
      h
        ? (A.line(16, R + 2, 24, R + 4, 14741759), A.line(16, R + 3, 24, R + 5, 10535167))
        : m
          ? (A.line(8, R, 2, R - 10, 14741759), A.line(9, R, 3, R - 10, 10535167))
          : (A.line(17, R + 2, 21, R - 9, 14741759), A.px(17, R + 3, 14200896));
    },
  },
  orb: {
    w: 24,
    h: 24,
    draw: (A, S, T, C) => {
      const E = S.wind ? 8 : 7;
      (A.circle(12, 12, E, 3166368), A.circle(12, 12, E - 2, 6324448), A.circle(11, 10, 2, 14741759));
      for (let R = 0; R < 8; R++) {
        const h = S.f * 0.4 + (R * Math.PI) / 4;
        A.px(12 + Math.cos(h) * 10, 12 + Math.sin(h) * 4, 10535167);
      }
      for (let R = 0; R < 6; R++) {
        const h = -S.f * 0.5 + (R * Math.PI) / 3;
        A.px(12 + Math.cos(h) * 4, 12 + Math.sin(h) * 10, 13676799);
      }
      S.atk && A.ring(12, 12, 11, 1, 16777215);
    },
  },
  gargoyle: {
    w: 28,
    h: 26,
    draw: (A, S, T, C) => {
      const E = S.idle,
        R = 8025216,
        h = 5919840;
      if (E) {
        (A.rect(6, C - 4, 16, 4, h),
          A.ellipse(14, C - 11, 7, 7, R),
          A.poly(
            [
              [7, C - 16],
              [4, C - 22],
              [10, C - 14],
            ],
            h,
          ),
          A.poly(
            [
              [21, C - 16],
              [24, C - 22],
              [18, C - 14],
            ],
            h,
          ),
          A.ellipse(18, C - 17, 4, 3, R),
          A.px(19, C - 18, 3156024),
          A.poly(
            [
              [16, C - 20],
              [17, C - 23],
              [18, C - 20],
            ],
            h,
          ));
        return;
      }
      const m = S.f % 2 === 0;
      (A.poly(
        [
          [10, 12],
          [0, m ? 2 : 18],
          [4, m ? 6 : 14],
          [2, m ? 10 : 20],
          [12, 15],
        ],
        h,
      ),
        A.ellipse(14, 14, 6, 6, R),
        A.ellipse(19, 9, 4, 3, R),
        ee(A, 20, 8, 16736288),
        A.poly(
          [
            [18, 6],
            [19, 2],
            [20, 6],
          ],
          h,
        ),
        A.rect(11, 19, 2, 4, h),
        A.rect(16, 19, 2, 4, h),
        S.atk && A.line(17, 20, 22, 24, 13684952));
    },
  },
  golden: {
    w: 22,
    h: 24,
    draw: (A, S, T, C) => {
      oe(A, S, 10, C - 7, 4, 5915688, 3811866);
      const E = C - 15 + Math.max(0, S.b);
      (A.ellipse(6, E + 2, 6, 6, 12619824),
        A.ellipse(5, E, 3, 2, 16769120),
        A.px(4, E - 4, 16777215),
        A.rect(4, E - 5, 4, 1, 9068576),
        A.rect(8, E, 8, 8, 9071162),
        A.ellipse(13, E - 4, 5, 4, 14729280),
        A.poly(
          [
            [17, E - 5],
            [21, E - 8],
            [16, E - 3],
          ],
          14729280,
        ),
        ye(A, 14, E - 5),
        A.rect(14, E - 2, 3, 1, 9068576),
        A.px(18, E - 9 + (S.f % 2), 16777215));
    },
  },
};
function vn(A) {
  for (const [S, T] of Object.entries(Ls)) {
    const C = Pt(9, T.w, T.h, (E, R) => T.draw(E, cn(R), T.w, T.h));
    Et(A, `e_${S}`, C, T.w, T.h);
  }
  for (const d of Os) {
    const T = d.sprite && Ls[d.sprite];
    if (!T) continue;
    const C = Pt(9, T.w, T.h, (E, R) => T.draw(E, cn(R), T.w, T.h));
    (frTint(C, d.tint, d.amt), Et(A, `e_${d.id}`, C, T.w, T.h));
  }
}
Object.fromEntries(Object.entries(Ls).map(([A, S]) => [A, { w: S.w, h: S.h }]));
const pn = (A) => ({
    f: A,
    idle: A < 2,
    move: A === 2 || A === 3,
    wind: A === 4,
    atk: A === 5,
    sp: A === 6,
    hurt: A === 7,
    b: A % 2,
  }),
  Fs = {
    golem: {
      w: 72,
      h: 66,
      draw: (A, S, T, C) => {
        const t = S.move ? (S.f === 2 ? 2 : -2) : 0;
        (A.rect(22 + t, C - 14, 10, 14, 5920328),
          A.rect(40 - t, C - 14, 10, 14, 9077872),
          A.rect(21 + t, C - 3, 12, 3, 5920328),
          A.rect(39 - t, C - 3, 12, 3, 5920328));
        const a = C - 40 + (S.atk ? 4 : 0) + S.b * (S.idle ? 1 : 0),
          v = S.sp ? 6 : 0;
        (A.ellipse(36 + v, a + 10, 18, 16, 9077872),
          A.ellipse(34 + v, a + 6, 14, 10, 11578004),
          A.rect(26 + v, a + 18, 20, 4, 5920328),
          A.ellipse(25 + v, a - 2, 7, 3, 5933626),
          A.px(22 + v, a - 4, 9490528),
          A.ellipse(44 + v, a + 20, 5, 2, 5933626));
        const o = S.wind || S.sp ? 16765024 : 6349055;
        (A.circle(36 + v, a + 10, 4, st(o, -0.3)),
          A.circle(36 + v, a + 10, 2, o),
          A.px(36 + v, a + 9, 16777215),
          A.rect(40 + v, a - 14, 14, 11, 9077872),
          A.rect(40 + v, a - 14, 14, 2, 11578004),
          A.rect(46 + v, a - 10, 6, 2, 1052688),
          A.rect(48 + v, a - 10, 3, 2, o),
          S.wind
            ? (A.rect(14, a - 26, 10, 26, 9077872),
              A.rect(52, a - 26, 10, 26, 9077872),
              A.rect(12, a - 32, 14, 9, 5920328),
              A.rect(50, a - 32, 14, 9, 5920328))
            : S.atk
              ? (A.rect(10, a + 14, 12, 18, 9077872),
                A.rect(54, a + 14, 12, 18, 9077872),
                A.rect(8, C - 8, 16, 8, 5920328),
                A.rect(52, C - 8, 16, 8, 5920328))
              : (A.rect(14 + v, a, 9, 24, 5920328),
                A.rect(52 + v, a, 9, 24, 9077872),
                A.rect(12 + v, a + 22, 12, 9, 5920328),
                A.rect(51 + v, a + 22, 12, 9, 9077872),
                A.rect(51 + v, a + 22, 12, 2, 11578004)),
          S.hurt && A.line(30, a + 2, 38, a + 14, 2762784));
      },
    },
    rotlord: {
      w: 72,
      h: 76,
      draw: (A, S, T, C) => {
        for (let v = 0; v < 6; v++) {
          const o = 20 + v * 6 + (S.move ? (v % 2 ? 2 : -2) : 0);
          (A.line(o, C - 10, o - 4 + v * 2, C - 1, 2760728), A.line(o + 1, C - 10, o - 3 + v * 2, C - 1, 4864554));
        }
        const t = C - 48;
        (A.poly(
          [
            [22, C - 8],
            [26, t],
            [46, t],
            [52, C - 8],
          ],
          4864554,
        ),
          A.poly(
            [
              [28, C - 10],
              [30, t + 4],
              [36, t + 4],
              [34, C - 10],
            ],
            2760728,
          ));
        for (let v = 0; v < 5; v++) A.line(28 + v * 5, t + 6, 26 + v * 5, C - 12, st(4864554, -0.2));
        (A.ellipse(42, t + 14, 3, 2, 1050632),
          A.ellipse(34, t + 14, 3, 2, 1050632),
          A.px(42, t + 14, 10551104),
          A.px(34, t + 14, 10551104),
          A.poly(
            [
              [32, t + 22],
              [44, t + 22],
              [41, t + 28 + (S.atk ? 3 : 0)],
              [35, t + 28 + (S.atk ? 3 : 0)],
            ],
            1050632,
          ));
        for (let v = 0; v < 4; v++) A.px(34 + v * 3, t + 22, 14209200);
        for (let v = 0; v < 7; v++) {
          const o = 18 + v * 7;
          (A.line(36, t + 2, o, t - 14 - (v % 2) * 6, 4864554), A.circle(o, t - 15 - (v % 2) * 6, 3, 4880938));
        }
        (A.circle(24, t - 20, 3, 11549312),
          A.circle(50, t - 22, 3, 11549312),
          A.px(24, t - 20, 16769120),
          A.px(50, t - 22, 16769120));
        const a = S.wind ? -18 : S.atk ? 8 : 0;
        if (
          (A.thickLine(24, t + 10, 8, t + 20 + a, 4, 4864554),
          A.thickLine(50, t + 10, 64, t + 20 + a, 4, 4864554),
          A.line(8, t + 20 + a, 2, t + 26 + a, 4880938),
          A.line(64, t + 20 + a, 70, t + 26 + a, 4880938),
          S.sp || S.wind)
        )
          for (let v = 0; v < 10; v++) A.px(10 + v * 6, t - 4 + ((v * 7) % 12), 10551104);
      },
    },
    devourer: {
      w: 64,
      h: 80,
      draw: (A, S, T, C) => {
        const m = S.idle ? S.b * 2 - 1 : S.move ? (S.f === 2 ? 3 : -3) : 0,
          t = S.atk ? 8 : S.wind ? -6 : 0,
          a = S.sp ? 4 : 9;
        (A.ellipse(32, C - 3, 22, 4, 3811874), A.ellipse(32, C - 4, 16, 2, 5917242));
        for (let i = 0; i < a; i++) {
          const e = i / 8,
            r = 30 + m * e + t * e * e,
            l = C - 6 - i * 7;
          (A.ellipse(r, l, 13 - e * 3, 6, i % 2 ? 9067114 : 11565706),
            A.rect(r - 12 + e * 3, l + 2, 24 - e * 6, 2, 5913162),
            i % 2 && A.px(r + 8, l - 2, 14198968));
        }
        const v = (a - 1) / 8,
          o = 30 + m * v + t * v * v + (S.atk ? 6 : 0),
          n = C - 6 - (a - 1) * 7 - 8;
        (A.ellipse(o, n, 14, 11, 11565706), A.ellipse(o + 4, n, 9, S.atk || S.wind ? 8 : 5, 2755092));
        for (let i = 0; i < 8; i++) {
          const e = (i / 8) * Math.PI * 2;
          A.px(o + 4 + Math.cos(e) * 8, n + Math.sin(e) * (S.atk ? 7 : 4), 16773344);
        }
        (A.circle(o - 8, n - 6, 2, 16752672), A.circle(o - 4, n - 9, 1, 16752672));
      },
    },
    executioner: {
      w: 72,
      h: 68,
      draw: (A, S, T, C) => {
        const t = S.move ? (S.f === 2 ? 2 : -2) : 0;
        (A.rect(24 + t, C - 12, 7, 12, 6961698), A.rect(36 - t, C - 12, 7, 12, 6961698));
        const a = C - 44 + (S.atk ? 3 : 0);
        (A.poly(
          [
            [18, C - 10],
            [22, a],
            [44, a],
            [48, C - 10],
          ],
          11037242,
        ),
          A.rect(22, a + 14, 22, 3, 14729344),
          A.rect(30, a + 2, 6, 12, 6961698),
          A.rect(24, a - 4, 18, 6, 11579576),
          A.rect(24, a - 4, 18, 1, 14737640),
          A.rect(27, a - 16, 12, 12, 3811874),
          A.rect(27, a - 18, 12, 4, 14729344),
          A.rect(33, a - 11, 5, 2, 16728096),
          A.poly(
            [
              [27, a - 18],
              [33, a - 26],
              [39, a - 18],
            ],
            6961698,
          ));
        const v = S.wind ? -2.2 : S.atk ? 0.35 : S.sp ? -0.8 : -1.2,
          o = 44,
          n = a + 6,
          i = o + Math.cos(v) * 30,
          e = n + Math.sin(v) * 30;
        A.thickLine(o - Math.cos(v) * 6, n - Math.sin(v) * 6, o, n, 3, 4864554);
        const r = -Math.sin(v),
          l = Math.cos(v);
        if (
          (A.poly(
            [
              [o, n],
              [i, e],
              [i + r * 10, e + l * 10],
              [o + r * 7, n + l * 7],
            ],
            11579576,
          ),
          A.line(o, n, i, e, 15263984),
          A.line(o + r * 7, n + l * 7, i + r * 10, e + l * 10, 6974068),
          A.thickLine(22, a + 2, 14, a + 14, 3, 11037242),
          S.sp)
        )
          for (let s = 0; s < 12; s++) A.px(4 + s * 5, 10 + ((s * 13) % 40), 14729344);
      },
    },
    frostknight: {
      w: 60,
      h: 60,
      draw: (A, S, T, C) => {
        const t = S.move ? (S.f === 2 ? 2 : -2) : 0,
          a = C - 38 + (S.atk ? 2 : 0);
        (A.poly(
          [
            [18, a + 2],
            [24, a + 2],
            [16 - t, C - 4],
            [8 - t, C - 6],
          ],
          2771594,
        ),
          A.rect(22 + t, C - 14, 6, 14, 5933744),
          A.rect(31 - t, C - 14, 6, 14, 10143976),
          A.rect(30 - t, C - 3, 8, 3, 5933744),
          A.rect(20, a, 18, 16, 10143976),
          A.rect(20, a, 18, 3, 14742783),
          A.rect(27, a + 4, 4, 8, 14742783),
          A.rect(20, a + 14, 18, 2, 5933744),
          A.rect(16, a - 2, 7, 5, 14742783),
          A.rect(35, a - 2, 7, 5, 14742783),
          A.rect(22, a - 14, 14, 13, 10143976),
          A.rect(22, a - 14, 14, 2, 14742783),
          A.rect(29, a - 9, 6, 2, 1060944),
          A.rect(31, a - 9, 3, 2, 8450303));
        for (let i = 0; i < 5; i++)
          A.poly(
            [
              [22 + i * 3, a - 14],
              [23 + i * 3, a - 20 - (i % 2) * 3],
              [25 + i * 3, a - 14],
            ],
            12644607,
          );
        const v = S.wind ? -2.4 : S.atk ? 0.2 : S.sp ? 0 : -0.9,
          o = 40,
          n = a + 8;
        if (
          (A.thickLine(o, n, o + Math.cos(v) * 26, n + Math.sin(v) * 26, 3, 12644607),
          A.line(o, n, o + Math.cos(v) * 26, n + Math.sin(v) * 26, 16777215),
          A.thickLine(
            o - Math.cos(v) * 4 - Math.sin(v) * 4,
            n - Math.sin(v) * 4 + Math.cos(v) * 4,
            o - Math.cos(v) * 4 + Math.sin(v) * 4,
            n - Math.sin(v) * 4 - Math.cos(v) * 4,
            2,
            4876954,
          ),
          S.sp)
        )
          for (let i = 0; i < 6; i++)
            A.poly(
              [
                [44 + i * 2, C - 1],
                [46 + i * 2, C - 10 - i],
                [48 + i * 2, C - 1],
              ],
              10543359,
            );
      },
    },
    warlord: {
      w: 64,
      h: 64,
      draw: (A, S, T, C) => {
        const t = S.move ? (S.f === 2 ? 2 : -2) : 0;
        (A.rect(22 + t, C - 13, 8, 13, 3811874),
          A.rect(34 - t, C - 13, 8, 13, 3811874),
          A.rect(21 + t, C - 3, 10, 3, 9079448),
          A.rect(33 - t, C - 3, 10, 3, 9079448));
        const a = C - 42;
        if (
          (A.rect(18, a, 28, 22, 10103330),
          A.rect(18, a, 28, 3, st(10103330, 0.3)),
          A.rect(30, a + 4, 4, 14, 14200896),
          A.rect(18, a + 18, 28, 3, 5904916),
          A.rect(12, a - 3, 12, 8, 9079448),
          A.rect(40, a - 3, 12, 8, 9079448),
          A.rect(12, a - 3, 12, 2, 12632264),
          A.rect(40, a - 3, 12, 2, 12632264),
          A.rect(24, a - 16, 16, 14, 9079448),
          A.rect(24, a - 16, 16, 2, 12632264),
          A.rect(32, a - 11, 7, 2, 1052688),
          A.px(36, a - 11, 16736288),
          A.poly(
            [
              [30, a - 16],
              [32, a - 26],
              [34, a - 16],
            ],
            14688288,
          ),
          A.rect(24, a - 4, 16, 2, 14200896),
          S.sp)
        )
          (A.thickLine(44, a + 4, 52, a - 10, 3, 10103330),
            A.poly(
              [
                [50, a - 12],
                [58, a - 20],
                [60, a - 14],
              ],
              15259824,
            ));
        else {
          const o = S.wind ? -2.3 : S.atk ? 0.4 : -0.6,
            n = 48,
            i = a + 8,
            e = n + Math.cos(o) * 18,
            r = i + Math.sin(o) * 18;
          (A.thickLine(n, i, e, r, 2, 4864554), A.circle(e, r, 5, 9079448), A.px(e - 1, r - 1, 12632264));
          for (let l = 0; l < 4; l++)
            A.px(e + Math.cos(l * 1.6) * 7, r + Math.sin(l * 1.6) * 7, l % 2 ? 16736288 : 16764992);
        }
        const v = (S.sp, 6);
        (A.rect(v, a + 2, 12, 26, 5904916),
          A.rect(v + 1, a + 3, 10, 24, 10103330),
          A.rect(v + 5, a + 6, 2, 16, 14200896),
          A.rect(v + 2, a + 12, 8, 2, 14200896));
      },
    },
    matriarch: {
      w: 76,
      h: 76,
      draw: (A, S, T, C) => {
        for (let t = 0; t < 10; t++) {
          const a = (t / 10) * Math.PI * 2 + S.f * 0.15;
          let v = 38,
            o = 38;
          for (let n = 0; n < 6; n++) {
            const i = 38 + Math.cos(a + Math.sin(n * 0.8 + S.f) * 0.3) * (18 + n * 3),
              e = 38 + Math.sin(a + Math.sin(n * 0.8 + S.f) * 0.3) * (18 + n * 3);
            (A.thickLine(v, o, i, e, Math.max(1, 4 - n * 0.6), n % 2 ? 4856426 : 3805264), (v = i), (o = e));
          }
        }
        (A.circle(38, 38, 18, 2755130), A.circle(38, 38, 16, 15259888), A.circle(35, 34, 10, 16446719));
        for (let t = 0; t < 6; t++) {
          const a = t * 1.1;
          A.line(38 + Math.cos(a) * 14, 38 + Math.sin(a) * 14, 38 + Math.cos(a) * 9, 38 + Math.sin(a) * 9, 12599408);
        }
        const h = S.wind || S.atk ? 16728224 : S.sp ? 4259792 : 9449680,
          m = S.atk ? 4 : 2;
        (A.circle(38 + m, 38, 8, h),
          A.circle(38 + m, 38, S.wind ? 2 : 4, 524296),
          A.px(38 + m - 2, 35, 16777215),
          A.px(38 + m - 3, 35, 16777215),
          S.hurt && A.line(28, 26, 32, 32, 6291504));
      },
    },
    king: {
      w: 56,
      h: 70,
      draw: (A, S, T, C) => {
        const t = S.b * 2;
        A.poly(
          [
            [14, C - 6 - t],
            [20, C - 46],
            [36, C - 46],
            [42, C - 6 - t],
          ],
          2767482,
        );
        for (let i = 0; i < 5; i++)
          A.poly(
            [
              [14 + i * 6, C - 6 - t],
              [17 + i * 6, C - 14 - t],
              [20 + i * 6, C - 6 - t],
            ],
            1712720,
          );
        (A.rect(26, C - 44, 4, 30, 14729280), A.rect(18, C - 48, 20, 6, 5909098), A.rect(18, C - 48, 20, 1, 14729280));
        const a = C - 60;
        (A.ellipse(28, a, 7, 8, 14736584),
          A.rect(28, a - 1, 3, 3, 1052696),
          A.rect(24, a - 1, 3, 3, 1052696),
          A.px(29, a, 8438015),
          A.px(25, a, 8438015),
          A.rect(25, a + 5, 7, 1, 1052696));
        for (let i = 0; i < 3; i++) A.px(26 + i * 2, a + 5, 14736584);
        (A.rect(20, a - 9, 16, 3, 14729280),
          [20, 25, 30, 35].forEach((i) =>
            A.poly(
              [
                [i, a - 9],
                [i + 1, a - 15],
                [i + 2, a - 9],
              ],
              14729280,
            ),
          ),
          A.px(28, a - 8, 16724032));
        const v = S.wind ? -6 : S.atk ? 4 : 0;
        A.thickLine(38, C - 42, 44 + v, C - 50 + (S.wind ? -8 : 0), 3, 2767482);
        const o = 46 + v,
          n = C - 30;
        if (
          (A.line(o, n + 26, o, n - 30 + (S.wind ? -6 : 0), 6969914),
          A.circle(o, n - 33 + (S.wind ? -6 : 0), 4, 8429823),
          A.px(o - 1, n - 34 + (S.wind ? -6 : 0), 16777215),
          S.sp)
        )
          for (let i = 0; i < 6; i++) {
            const e = i * 1.05 + S.f;
            A.circle(28 + Math.cos(e) * 22, a + 20 + Math.sin(e) * 14, 2, 8429823);
          }
      },
    },
    warden: {
      w: 72,
      h: 80,
      draw: (A, S, T, C) => {
        const t = S.b * 2,
          a = 36,
          v = 40 - t;
        (A.poly(
          [
            [a - 16, v - 8],
            [a, v - 30],
            [a + 16, v - 8],
            [a + 12, v + 22],
            [a, v + 30],
            [a - 12, v + 22],
          ],
          1060910,
        ),
          A.poly(
            [
              [a - 12, v - 6],
              [a, v - 24],
              [a + 12, v - 6],
              [a + 9, v + 18],
              [a, v + 24],
              [a - 9, v + 18],
            ],
            2124388,
          ),
          A.line(a, v - 24, a, v + 24, 4247744),
          A.line(a - 12, v - 6, a + 12, v - 6, 4247744),
          A.circle(a, v, S.wind || S.sp ? 7 : 5, 9060607),
          A.circle(a, v, 2, 16777215),
          A.poly(
            [
              [a - 6, v - 30],
              [a, v - 40],
              [a + 6, v - 30],
            ],
            4247744,
          ),
          A.rect(a - 4, v - 34, 8, 2, 1052688),
          A.rect(a + 1, v - 34, 2, 2, 9060607));
        for (let o = 0; o < 6; o++) {
          const n = (o / 6) * Math.PI * 2 + S.f * 0.25,
            i = S.atk ? 34 : 28,
            e = a + Math.cos(n) * i,
            r = v + Math.sin(n) * i * 0.8;
          A.poly(
            [
              [e, r - 5],
              [e + 3, r],
              [e, r + 5],
              [e - 3, r],
            ],
            o % 2 ? 4247744 : 8454128,
          );
        }
      },
    },
  };
function mn(A) {
  for (const [S, T] of Object.entries(Fs)) {
    const C = Pt(8, T.w, T.h, (E, R) => T.draw(E, pn(R), T.w, T.h));
    Et(A, `b_${S}`, C, T.w, T.h);
  }
  for (const d of Mi) {
    const T = d.sprite && Fs[d.sprite];
    if (!T) continue;
    const C = Pt(8, T.w, T.h, (E, R) => T.draw(E, pn(R), T.w, T.h));
    (frTint(C, d.tint, d.amt), Et(A, `b_${d.id}`, C, T.w, T.h));
  }
}
const gn = Object.fromEntries(Object.entries(Fs).map(([A, S]) => [A, { w: S.w, h: S.h }]));
function xn(A) {
  (lt(
    A,
    "px1",
    (() => {
      const C = new ht(2, 2);
      return (C.rect(0, 0, 2, 2, 16777215), C);
    })(),
  ),
    lt(
      A,
      "px3",
      (() => {
        const C = new ht(3, 3);
        return (C.rect(0, 0, 3, 3, 16777215), C);
      })(),
    ),
    lt(
      A,
      "soft",
      (() => {
        const C = new ht(8, 8);
        return (
          C.circle(4, 4, 3.5, 16777215, 90),
          C.circle(4, 4, 2.5, 16777215, 160),
          C.circle(4, 4, 1.2, 16777215),
          C
        );
      })(),
    ),
    lt(
      A,
      "spark",
      (() => {
        const C = new ht(7, 7);
        return (C.line(3, 0, 3, 6, 16777215), C.line(0, 3, 6, 3, 16777215), C.px(3, 3, 16777215), C);
      })(),
    ),
    lt(
      A,
      "leaf",
      (() => {
        const C = new ht(5, 4);
        return (C.rect(1, 0, 3, 4, 16777215), C.rect(0, 1, 5, 2, 16777215), C);
      })(),
    ),
    lt(
      A,
      "flake",
      (() => {
        const C = new ht(5, 5);
        return (
          C.px(2, 0, 16777215),
          C.px(2, 4, 16777215),
          C.px(0, 2, 16777215),
          C.px(4, 2, 16777215),
          C.rect(1, 1, 3, 3, 16777215),
          C
        );
      })(),
    ),
    lt(
      A,
      "shadow",
      (() => {
        const C = new ht(24, 6);
        return (C.ellipse(12, 3, 11, 2.5, 0, 90), C);
      })(),
    ),
    Et(
      A,
      "coin",
      Pt(
        6,
        8,
        8,
        (C, E) => {
          const R = [3.5, 2.8, 1.5, 0.6, 1.5, 2.8][E];
          (C.ellipse(4, 4, R, 3.5, 15773728),
            C.ellipse(4, 4, Math.max(0.3, R - 1), 2.5, 16769120),
            R > 1 && C.px(4 - Math.floor(R / 2), 2, 16777215));
        },
        6963216,
      ),
      8,
      8,
    ),
    Et(
      A,
      "coinbig",
      Pt(
        6,
        12,
        12,
        (C, E) => {
          const R = [5.5, 4.5, 2.5, 1, 2.5, 4.5][E];
          (C.ellipse(6, 6, R, 5.5, 15773728),
            C.ellipse(6, 6, Math.max(0.3, R - 1.5), 4, 16769120),
            R > 2 && (C.rect(5, 4, 2, 4, 13668368), C.px(6 - Math.floor(R / 2), 3, 16777215)));
        },
        6963216,
      ),
      12,
      12,
    ),
    Et(
      A,
      "explode",
      Pt(
        7,
        48,
        48,
        (C, E) => {
          const R = 6 + E * 3.5;
          (E < 5 && C.circle(24, 24, R, E < 2 ? 16777215 : 16765024, 255 - E * 35),
            E > 0 && C.ring(24, 24, R + 2, 3, E < 3 ? 16752688 : 12603424, 255 - E * 30));
          for (let h = 0; h < 8; h++) {
            const m = h * 0.785 + E * 0.1;
            C.circle(
              24 + Math.cos(m) * (R + 4),
              24 + Math.sin(m) * (R + 4),
              Math.max(0.5, 3 - E * 0.4),
              5917258,
              200 - E * 25,
            );
          }
        },
        null,
      ),
      48,
      48,
    ),
    Et(
      A,
      "hitspark",
      Pt(
        4,
        20,
        20,
        (C, E) => {
          const R = 3 + E * 2.5;
          for (let h = 0; h < 6; h++) {
            const m = h * 1.047 + 0.3;
            C.line(
              10 + Math.cos(m) * (R - 2),
              10 + Math.sin(m) * (R - 2),
              10 + Math.cos(m) * R,
              10 + Math.sin(m) * R,
              16777215,
              255 - E * 50,
            );
          }
          E < 2 && C.circle(10, 10, 3 - E, 16777215);
        },
        null,
      ),
      20,
      20,
    ),
    Et(
      A,
      "ring",
      Pt(
        6,
        64,
        64,
        (C, E) => {
          const R = 8 + E * 4.5;
          C.ring(32, 32, R, 3 - E * 0.3, 16777215, 255 - E * 38);
        },
        null,
      ),
      64,
      64,
    ),
    Et(
      A,
      "shockwave",
      Pt(
        4,
        24,
        30,
        (C, E) => {
          for (let R = 0; R < 30; R++) {
            const h = Math.max(1, Math.round(7 * Math.sin((R / 29) * Math.PI)));
            (C.rect(14 - h, R, h + 2, 1, 15784096, 220), C.px(15 + (E % 2), R, 16777215));
          }
          for (let R = 0; R < 4; R++) C.circle(6 + R * 3 - E, 27 - ((R * 5 + E * 3) % 12), 1.5, 13152392, 200);
        },
        null,
      ),
      24,
      30,
    ),
    Et(
      A,
      "iceburst",
      Pt(
        5,
        96,
        96,
        (C, E) => {
          const R = 12 + E * 8;
          (C.ring(48, 48, R, 4, 10545407, 230 - E * 40), C.ring(48, 48, R - 5, 2, 16777215, 160 - E * 30));
          for (let h = 0; h < 10; h++) {
            const m = h * 0.628,
              t = 48 + Math.cos(m) * R,
              a = 48 + Math.sin(m) * R;
            C.poly(
              [
                [t, a - 4],
                [t + 2, a],
                [t, a + 4],
                [t - 2, a],
              ],
              14743807,
              230 - E * 40,
            );
          }
        },
        null,
      ),
      96,
      96,
    ),
    Et(
      A,
      "flame",
      Pt(
        4,
        14,
        22,
        (C, E) => {
          const R = 16 + (E % 2) * 3;
          (C.poly(
            [
              [2, 21],
              [7, 21 - R],
              [12, 21],
            ],
            16732176,
          ),
            C.poly(
              [
                [4, 21],
                [7 + (E % 2 ? 1 : -1), 24 - R],
                [10, 21],
              ],
              16752672,
            ),
            C.poly(
              [
                [6, 21],
                [7, 21 - R * 0.45],
                [8, 21],
              ],
              16773280,
            ));
        },
        null,
      ),
      14,
      22,
    ),
    Et(
      A,
      "rockspike",
      Pt(4, 16, 32, (C, E) => {
        const R = [10, 24, 30, 22][E];
        (C.poly(
          [
            [2, 31],
            [8, 31 - R],
            [14, 31],
          ],
          10127984,
        ),
          C.poly(
            [
              [8, 31 - R],
              [14, 31],
              [10, 31],
            ],
            6969928,
          ),
          C.line(6, 28, 8, 32 - R, 13154456));
      }),
      16,
      32,
    ),
    Et(
      A,
      "icespike",
      Pt(4, 16, 36, (C, E) => {
        const R = [12, 28, 34, 26][E];
        (C.poly(
          [
            [3, 35],
            [8, 35 - R],
            [13, 35],
          ],
          9492735,
        ),
          C.line(7, 33, 8, 36 - R, 16777215),
          C.poly(
            [
              [8, 35 - R],
              [13, 35],
              [10, 35],
            ],
            5279936,
          ));
      }),
      16,
      36,
    ),
    Et(
      A,
      "vine",
      Pt(4, 16, 40, (C, E) => {
        const R = [10, 30, 38, 28][E];
        for (let h = 0; h < R; h++) {
          const m = 8 + Math.sin(h * 0.3) * 3;
          C.rect(m - 2, 39 - h, 4, 1, h % 5 === 0 ? 9097296 : 4885034);
        }
        C.poly(
          [
            [5, 39 - R + 4],
            [8, 39 - R - 3],
            [11, 39 - R + 4],
          ],
          6991936,
        );
      }),
      16,
      40,
    ),
    Et(
      A,
      "tentacle_up",
      Pt(4, 18, 48, (C, E) => {
        const R = [12, 34, 46, 30][E];
        for (let h = 0; h < R; h++) {
          const m = h / 46;
          C.rect(9 + Math.sin(h * 0.18) * 3 - (5 - m * 4), 47 - h, (5 - m * 4) * 2, 1, h % 4 ? 5909114 : 10115776);
        }
      }),
      18,
      48,
    ),
    lt(
      A,
      "lightning",
      (() => {
        const C = new ht(8, 8);
        return (C.rect(2, 0, 4, 8, 16775344), C.rect(3, 0, 2, 8, 16777215), C);
      })(),
    ),
    Et(
      A,
      "portalfx",
      Pt(4, 32, 48, (C, E) => {
        (C.ellipse(16, 24, 12, 21, 4247744, 120), C.ellipse(16, 24, 9, 17, 1054760));
        for (let R = 0; R < 6; R++) {
          const h = R + E * 0.5;
          C.px(16 + Math.cos(h) * 8, 24 + Math.sin(h) * 15, 8454128);
        }
      }),
      32,
      48,
    ),
    lt(
      A,
      "warn",
      (() => {
        const C = new ht(32, 6);
        for (let E = 0; E < 32; E++) for (let R = 0; R < 6; R++) ((E + R) >> 1) % 2 === 0 && C.px(E, R, 16724e3, 200);
        return (C.rect(0, 0, 32, 1, 16777215), C);
      })(),
    ),
    lt(
      A,
      "warncircle",
      (() => {
        const C = new ht(64, 64);
        return (C.ring(32, 32, 31, 2, 16724e3, 220), C.circle(32, 32, 29, 16724e3, 50), C);
      })(),
    ),
    lt(
      A,
      "beam",
      (() => {
        const C = new ht(16, 12);
        return (C.rect(0, 2, 16, 8, 13656319, 200), C.rect(0, 4, 16, 4, 16769279), C);
      })(),
    ));
  const S = (C, E, R, h) =>
    Et(
      A,
      C,
      Pt(2, 22, 18, (m, t) => {
        (m.rect(1, 8, 20, 10, E),
          m.rect(1, 8, 20, 1, st(E, 0.3)),
          m.rect(1, 12, 20, 2, R),
          m.rect(9, 11, 4, 5, R),
          m.px(10, 13, h),
          m.px(11, 13, h),
          m.rect(1, 8, 2, 10, R),
          m.rect(19, 8, 2, 10, R),
          t === 0
            ? (m.rect(1, 2, 20, 6, st(E, 0.1)),
              m.rect(1, 2, 20, 1, st(E, 0.4)),
              m.rect(1, 6, 20, 2, R),
              m.rect(9, 5, 4, 3, R))
            : (m.poly(
                [
                  [1, 8],
                  [3, 0],
                  [21, 0],
                  [21, 8],
                ],
                st(E, -0.2),
              ),
              m.rect(3, 0, 18, 1, R),
              m.rect(3, 7, 16, 2, 16769120),
              m.px(8, 6, 16777215),
              m.px(14, 6, 16777215)));
      }),
      22,
      18,
    );
  (S("chest", 9067050, 5917242, 12632256),
    S("chest_rare", 3824288, 14200896, 8446207),
    S("chest_epic", 6957706, 16764992, 16736511),
    Et(
      A,
      "altar",
      Pt(4, 28, 32, (C, E) => {
        (C.rect(4, 24, 20, 8, 8025216),
          C.rect(4, 24, 20, 2, 11051696),
          C.rect(7, 14, 14, 10, 6972528),
          C.rect(7, 14, 14, 1, 10130592),
          C.rect(2, 12, 24, 3, 9077904),
          C.px(13, 18, 16765024),
          C.px(14, 18, 16765024));
        const R = [0, 1, 2, 1][E];
        (C.circle(14, 6 - R, 3, 16769152, 230), C.circle(14, 6 - R, 5, 16765024, 70), C.px(13, 5 - R, 16777215));
      }),
      28,
      32,
    ),
    Et(
      A,
      "shrine_deal",
      Pt(4, 26, 36, (C, E) => {
        (C.rect(5, 28, 16, 8, 3809328),
          C.poly(
            [
              [7, 28],
              [9, 6],
              [17, 6],
              [19, 28],
            ],
            5909056,
          ),
          C.rect(6, 4, 14, 3, 8010320),
          C.circle(13, 16, 4, 2099216),
          C.circle(13, 16, 2, E % 2 ? 16724048 : 12591168),
          C.px(12, 15, 16752816));
        for (let R = 0; R < 3; R++) C.px(9 + R * 4, 30 + ((E + R) % 2), 10489904);
      }),
      26,
      36,
    ),
    Et(
      A,
      "spring",
      Pt(4, 40, 20, (C, E) => {
        (C.ellipse(20, 15, 18, 5, 5925498), C.ellipse(20, 14, 15, 3.5, 5292256), C.ellipse(16, 13, 5, 1, 12646655));
        for (let R = 0; R < 3; R++) C.px(10 + R * 9 + E, 10 - ((E + R) % 3), 12648432);
        (C.rect(2, 10, 4, 8, 9077880), C.rect(34, 10, 4, 8, 9077880));
      }),
      40,
      20,
    ),
    lt(
      A,
      "orevein",
      (() => {
        const C = new ht(26, 24);
        C.ellipse(13, 15, 12, 9, 5129824);
        for (const [E, R] of [
          [7, 12],
          [14, 9],
          [18, 15],
          [10, 18],
        ])
          (C.poly(
            [
              [E - 2, R + 2],
              [E, R - 4],
              [E + 2, R + 2],
            ],
            16764992,
          ),
            C.px(E, R - 2, 16777215));
        return (C.outline(), C);
      })(),
    ),
    lt(
      A,
      "icebox",
      (() => {
        const C = new ht(26, 30);
        return (
          C.rect(1, 1, 24, 29, 9490672, 200),
          C.rect(1, 1, 24, 2, 16777215),
          C.line(4, 6, 10, 20, 16777215, 200),
          C.rect(8, 10, 10, 16, 6969930, 150),
          C.circle(13, 9, 4, 14725264, 150),
          C.outline(3166320),
          C
        );
      })(),
    ),
    lt(
      A,
      "relic",
      (() => {
        const C = new ht(28, 14);
        return (
          C.ellipse(14, 10, 13, 4, 13146200),
          C.ellipse(14, 9, 11, 3, 14727288),
          C.rect(10, 2, 8, 7, 3842192),
          C.rect(12, 0, 4, 3, 16764992),
          C.px(13, 4, 16777215),
          C.outline(),
          C
        );
      })(),
    ),
    lt(
      A,
      "armory",
      (() => {
        const C = new ht(30, 30);
        (C.rect(2, 4, 26, 26, 5913122), C.rect(2, 4, 26, 2, 9071178));
        for (let E = 0; E < 4; E++) (C.line(6 + E * 6, 8, 6 + E * 6, 26, 10528944), C.px(6 + E * 6, 7, 16777215));
        return (C.rect(2, 20, 26, 2, 3811866), C.outline(), C);
      })(),
    ),
    Et(
      A,
      "riftgate",
      Pt(4, 30, 44, (C, E) => {
        (C.ellipse(15, 22, 11, 20, 6299808, 160), C.ellipse(15, 22, 8, 16, 1048600));
        for (let R = 0; R < 8; R++) {
          const h = R * 0.785 + E * 0.4;
          C.px(15 + Math.cos(h) * 9, 22 + Math.sin(h) * 18, 13668607);
        }
      }),
      30,
      44,
    ),
    Et(
      A,
      "rune",
      Pt(2, 16, 16, (C, E) => {
        (C.ring(8, 8, 7, 1, E ? 12638463 : 6324416),
          C.poly(
            [
              [8, 3],
              [12, 8],
              [8, 13],
              [4, 8],
            ],
            E ? 16777215 : 8425664,
          ));
      }),
      16,
      16,
    ),
    lt(
      A,
      "banner_elite",
      (() => {
        const C = new ht(16, 40);
        return (
          C.rect(2, 0, 2, 40, 4864554),
          C.poly(
            [
              [4, 2],
              [15, 4],
              [15, 20],
              [9, 17],
              [4, 20],
            ],
            9050650,
          ),
          C.circle(9, 10, 3, 15261904),
          C.px(8, 10, 1052688),
          C.px(10, 10, 1052688),
          C.outline(),
          C
        );
      })(),
    ),
    lt(
      A,
      "wagon",
      (() => {
        const C = new ht(48, 28);
        return (
          C.rect(4, 8, 36, 12, 8018490),
          C.rect(4, 8, 36, 2, 10123866),
          C.poly(
            [
              [4, 8],
              [10, 0],
              [34, 0],
              [40, 8],
            ],
            14207136,
          ),
          C.circle(10, 22, 5, 4864554),
          C.circle(34, 23, 5, 4864554),
          C.px(10, 22, 10132122),
          C.px(34, 23, 10132122),
          C.line(40, 16, 47, 20, 5917242),
          C.outline(),
          C
        );
      })(),
    ),
    lt(
      A,
      "record_flag",
      (() => {
        const C = new ht(14, 40);
        return (
          C.rect(1, 0, 2, 40, 14209216),
          C.poly(
            [
              [3, 1],
              [13, 5],
              [3, 10],
            ],
            16764992,
          ),
          C.px(5, 5, 16777215),
          C.outline(),
          C
        );
      })(),
    ),
    lt(
      A,
      "milestone_post",
      (() => {
        const C = new ht(12, 28);
        return (
          C.rect(5, 6, 2, 22, 6965802),
          C.rect(0, 0, 12, 8, 9071170),
          C.rect(0, 0, 12, 1, 11045466),
          C.outline(),
          C
        );
      })(),
    ),
    Et(
      A,
      "gate",
      Pt(2, 16, 96, (C, E) => {
        for (let R = 0; R < 96; R += 8)
          (C.rect(1, R, 14, 7, E ? 10113088 : 5920872), C.rect(1, R, 14, 1, E ? 12611680 : 9078944));
        for (let R = 3; R < 16; R += 5) C.rect(R, 0, 2, 96, 2762800);
      }),
      16,
      96,
    ),
    lt(
      A,
      "spikes",
      (() => {
        const C = new ht(16, 8);
        for (let E = 0; E < 4; E++)
          (C.poly(
            [
              [E * 4, 8],
              [E * 4 + 2, 0],
              [E * 4 + 4, 8],
            ],
            12632264,
          ),
            C.line(E * 4 + 2, 1, E * 4 + 2, 7, 16777215));
        return (C.outline(), C);
      })(),
    ),
    Et(
      A,
      "pool_poison",
      Pt(
        4,
        16,
        6,
        (C, E) => {
          (C.rect(0, 1, 16, 5, 5937696, 220),
            C.rect(0, 1, 16, 1, 10543168),
            C.circle((E * 4 + 3) % 16, 3, 1, 13696896));
        },
        null,
      ),
      16,
      6,
    ),
    Et(
      A,
      "pool_void",
      Pt(
        4,
        16,
        6,
        (C, E) => {
          (C.rect(0, 1, 16, 5, 3803738, 230), C.rect(0, 1, 16, 1, 11559167), C.px((E * 5 + 2) % 16, 2, 16765183));
        },
        null,
      ),
      16,
      6,
    ),
    lt(
      A,
      "quicksand",
      (() => {
        const C = new ht(16, 6);
        C.rect(0, 0, 16, 6, 11567176, 230);
        for (let E = 0; E < 16; E += 3) C.px(E, 1 + (E % 2), 14198888);
        return C;
      })(),
    ),
    lt(
      A,
      "icefloor",
      (() => {
        const C = new ht(16, 4);
        return (C.rect(0, 0, 16, 4, 12118271, 210), C.rect(0, 0, 16, 1, 16777215), C.line(2, 2, 6, 2, 16777215), C);
      })(),
    ),
    lt(
      A,
      "stalactite",
      (() => {
        const C = new ht(12, 22);
        return (
          C.poly(
            [
              [0, 0],
              [6, 22],
              [12, 0],
            ],
            6972544,
          ),
          C.line(4, 0, 6, 18, 10130608),
          C.outline(),
          C
        );
      })(),
    ),
    lt(
      A,
      "icicle",
      (() => {
        const C = new ht(10, 22);
        return (
          C.poly(
            [
              [0, 0],
              [5, 22],
              [10, 0],
            ],
            10541296,
          ),
          C.line(3, 0, 5, 18, 16777215),
          C.outline(3166320),
          C
        );
      })(),
    ),
    lt(
      A,
      "firevent",
      (() => {
        const C = new ht(16, 6);
        return (
          C.rect(1, 1, 14, 5, 3816e3),
          C.rect(3, 2, 10, 2, 1050632),
          C.px(5, 2, 16736288),
          C.px(10, 3, 16736288),
          C.outline(),
          C
        );
      })(),
    ),
    lt(
      A,
      "arrowtrap",
      (() => {
        const C = new ht(16, 16);
        return (
          C.rect(0, 0, 16, 16, 6969940),
          C.rect(0, 0, 16, 1, 10128004),
          C.rect(5, 6, 11, 4, 2101264),
          C.circle(4, 8, 2, 12595232),
          C.outline(),
          C
        );
      })(),
    ),
    Et(
      A,
      "runetrap",
      Pt(
        2,
        20,
        8,
        (C, E) => {
          (C.ellipse(10, 5, 9, 2.5, E ? 10535167 : 5271744, 220),
            C.poly(
              [
                [10, 2],
                [13, 5],
                [10, 8],
                [7, 5],
              ],
              E ? 16777215 : 9480447,
            ));
        },
        null,
      ),
      20,
      8,
    ));
  const T = (C, E, R, h, m = !0) => {
    const t = new ht(E, R);
    (h(t), m && t.outline(), lt(A, C, t));
  };
  (T(
    "d_grass",
    10,
    7,
    (C) => {
      for (let E = 0; E < 5; E++) C.line(1 + E * 2, 6, E * 2 + (E % 2 ? 2 : 0), 1 + (E % 3), 7389248);
    },
    !1,
  ),
    T("d_flower", 7, 9, (C) => {
      (C.line(3, 8, 3, 3, 4885034), C.circle(3, 2, 2, 15786080), C.px(3, 2, 14704672));
    }),
    T("d_rock", 14, 8, (C) => {
      (C.ellipse(7, 5, 6, 3.5, 9077880), C.ellipse(6, 4, 3, 1.5, 11578010));
    }),
    T("d_ruin", 16, 30, (C) => {
      (C.rect(3, 4, 10, 26, 10130568),
        C.rect(1, 0, 14, 5, 11578010),
        C.rect(3, 4, 2, 26, 8025192),
        C.line(8, 8, 10, 14, 6972504),
        C.rect(10, 0, 5, 3, 0, 0));
    }),
    T("d_tree", 34, 54, (C) => {
      (C.rect(14, 26, 6, 28, 6964264),
        C.rect(14, 26, 2, 28, 9067060),
        C.circle(17, 18, 13, 4885050),
        C.circle(9, 24, 8, 3832362),
        C.circle(25, 24, 9, 3832362),
        C.circle(14, 13, 5, 6990410));
    }),
    T("d_darktree", 30, 64, (C) => {
      (C.rect(12, 10, 7, 54, 2760728),
        C.line(15, 22, 4, 8, 2760728),
        C.line(16, 16, 27, 4, 2760728),
        C.line(14, 36, 3, 30, 2760728),
        C.circle(4, 8, 4, 1980954),
        C.circle(26, 5, 5, 1980954),
        C.circle(15, 7, 6, 2507818),
        C.px(14, 30, 10543168));
    }),
    T("d_mushroom", 12, 12, (C) => {
      (C.rect(5, 6, 3, 6, 14209208), C.ellipse(6, 5, 5, 3, 9058976), C.px(4, 4, 15257840), C.px(8, 4, 15257840));
    }),
    T("d_glowshroom", 8, 10, (C) => {
      (C.rect(3, 5, 2, 5, 12638400), C.ellipse(4, 4, 3.5, 2.5, 6348960), C.px(3, 3, 14745584));
    }),
    T("d_crystal", 14, 18, (C) => {
      (C.poly(
        [
          [2, 18],
          [4, 6],
          [7, 18],
        ],
        4243680,
      ),
        C.poly(
          [
            [6, 18],
            [9, 0],
            [12, 18],
          ],
          6349055,
        ),
        C.line(9, 3, 9, 15, 14745599));
    }),
    T("d_stalag", 12, 20, (C) => {
      (C.poly(
        [
          [0, 20],
          [6, 0],
          [12, 20],
        ],
        5129824,
      ),
        C.line(5, 4, 4, 18, 6972032));
    }),
    T("d_cactus", 16, 26, (C) => {
      (C.rect(6, 4, 4, 22, 4885050),
        C.rect(6, 4, 1, 22, 6990410),
        C.rect(1, 10, 5, 3, 4885050),
        C.rect(1, 6, 3, 6, 4885050),
        C.rect(10, 13, 5, 3, 4885050),
        C.rect(12, 9, 3, 6, 4885050),
        C.px(8, 2, 15753344));
    }),
    T("d_bones", 16, 8, (C) => {
      (C.ellipse(4, 5, 3, 2.5, 15261896),
        C.px(3, 5, 3156e3),
        C.line(7, 6, 15, 4, 15261896),
        C.line(9, 7, 14, 7, 14209208));
    }),
    T("d_pillar_sand", 14, 34, (C) => {
      (C.rect(2, 4, 10, 30, 14200952), C.rect(0, 0, 14, 5, 15255696), C.rect(2, 4, 2, 30, 12095576));
      for (let E = 10; E < 34; E += 7) C.rect(2, E, 10, 1, 12095576);
    }),
    T("d_pine", 24, 44, (C) => {
      C.rect(10, 36, 4, 8, 5914672);
      for (let E = 0; E < 4; E++) {
        const R = 11 - E * 2.3,
          h = 38 - E * 9;
        (C.poly(
          [
            [12 - R, h],
            [12, h - 12],
            [12 + R, h],
          ],
          2775626,
        ),
          C.line(12 - R, h, 12, h - 3, 16777215));
      }
    }),
    T("d_snowrock", 18, 10, (C) => {
      (C.ellipse(9, 6, 8, 4, 8951976), C.ellipse(9, 3.5, 7, 2, 16777215));
    }),
    T("d_torch", 8, 22, (C) => {
      (C.rect(3, 8, 2, 14, 4864554),
        C.rect(2, 6, 4, 3, 6972528),
        C.poly(
          [
            [2, 6],
            [4, 0],
            [6, 6],
          ],
          16744480,
        ),
        C.px(4, 3, 16773280));
    }),
    T("d_bannerpole", 14, 40, (C) => {
      (C.rect(2, 0, 2, 40, 3811874),
        C.poly(
          [
            [4, 2],
            [13, 2],
            [13, 22],
            [8, 18],
            [4, 22],
          ],
          10103330,
        ),
        C.circle(8, 9, 2, 14200896));
    }),
    T("d_barrel", 12, 14, (C) => {
      (C.rect(1, 1, 10, 13, 8018490),
        C.rect(1, 4, 10, 1, 4868690),
        C.rect(1, 10, 10, 1, 4868690),
        C.rect(1, 1, 10, 1, 10123866));
    }),
    T("d_voidcrystal", 14, 22, (C) => {
      (C.poly(
        [
          [2, 22],
          [5, 6],
          [8, 22],
        ],
        9060560,
      ),
        C.poly(
          [
            [6, 22],
            [10, 0],
            [13, 22],
          ],
          11559167,
        ),
        C.line(10, 3, 10, 18, 15782143));
    }),
    T("d_tendril", 10, 26, (C) => {
      for (let E = 0; E < 26; E++)
        C.rect(5 + Math.sin(E * 0.35) * 3 - (1 + (26 - E) / 12), E, 2 + (26 - E) / 6, 1, 3807818);
    }),
    T("d_statue", 16, 36, (C) => {
      (C.rect(2, 30, 12, 6, 10130592),
        C.rect(5, 12, 6, 18, 13156560),
        C.circle(8, 8, 4, 13156560),
        C.line(10, 14, 14, 6, 13156560),
        C.rect(5, 12, 1, 18, 11051184));
    }),
    T("d_column", 14, 44, (C) => {
      (C.rect(2, 4, 10, 36, 14209208), C.rect(0, 0, 14, 5, 15261896), C.rect(0, 40, 14, 4, 15261896));
      for (let E = 4; E < 12; E += 3) C.line(E, 6, E, 38, 12103832);
      C.rect(0, 4, 14, 1, 12623936);
    }),
    T("d_lamp_arcane", 10, 24, (C) => {
      (C.rect(4, 8, 2, 16, 5919848), C.circle(5, 5, 4, 6324432), C.circle(5, 5, 2, 13689087));
    }));
}
const Se = [
    {
      id: "shockwave",
      name: "충격파",
      price: 0,
      cooldown: 6,
      power: 2.2,
      radius: 120,
      duration: 0,
      element: "phys",
      desc: "지면을 따라 전방으로 나아가는 충격파를 일으킨다.",
      color: 14729344,
      lvl5: "충격파가 양방향으로 발사된다",
    },
    {
      id: "fireburst",
      name: "화염 폭발",
      price: 280,
      cooldown: 8,
      power: 2.7,
      radius: 46,
      duration: 0,
      element: "fire",
      status: { type: "burn", chance: 1, dur: 3.5, power: 0.3 },
      desc: "화염구를 던져 폭발시키고 화상을 입힌다.",
      color: 16738848,
      lvl5: "폭발 후 불꽃 장판이 남는다",
    },
    {
      id: "shadowdash",
      name: "그림자 돌진",
      price: 320,
      cooldown: 7,
      power: 2.2,
      radius: 150,
      duration: 0,
      element: "dark",
      desc: "무적 상태로 돌진하며 경로상의 모든 적을 관통한다.",
      color: 9064656,
      lvl5: "돌진 후 1.5초간 치명타 확률 +30%",
    },
    {
      id: "iceWave",
      name: "얼음 파동",
      price: 340,
      cooldown: 10,
      power: 1.6,
      radius: 80,
      duration: 3,
      element: "ice",
      status: { type: "chill", chance: 1, dur: 3, power: 0.5 },
      desc: "주변에 냉기를 퍼뜨려 피해를 주고 둔화시킨다.",
      color: 8442111,
      lvl5: "둔화된 적이 1초간 빙결된다",
    },
    {
      id: "heal",
      name: "응급 회복",
      price: 300,
      cooldown: 22,
      power: 0.25,
      radius: 0,
      duration: 0,
      element: "phys",
      desc: "최대 체력의 25%를 즉시 회복한다.",
      color: 7397488,
      lvl5: "회복 후 3초간 받는 피해 -25%",
    },
    {
      id: "lightning",
      name: "번개 사슬",
      price: 900,
      unlock: "tier2_skills",
      cooldown: 7,
      power: 1.8,
      radius: 180,
      duration: 0,
      element: "lightning",
      status: { type: "stun", chance: 0.5, dur: 0.6 },
      desc: "가까운 적에게 번개를 날려 최대 5명에게 연쇄된다.",
      color: 16773216,
      lvl5: "연쇄 대상 +3",
    },
    {
      id: "blades",
      name: "회전 칼날",
      price: 950,
      unlock: "tier2_skills",
      cooldown: 14,
      power: 0.7,
      radius: 38,
      duration: 6,
      element: "phys",
      desc: "주위를 도는 칼날 3개를 소환해 접촉한 적에게 지속 피해를 준다.",
      color: 12636384,
      lvl5: "칼날 +2개",
    },
    {
      id: "fissure",
      name: "지면 균열",
      price: 1e3,
      unlock: "tier2_skills",
      cooldown: 9,
      power: 2.5,
      radius: 220,
      duration: 0,
      element: "phys",
      status: { type: "stun", chance: 1, dur: 0.5 },
      desc: "지면을 따라 나아가는 균열에서 바위 가시가 솟아오른다.",
      color: 11567184,
      lvl5: "균열이 적의 방어력을 파괴한다",
    },
    {
      id: "berserk",
      name: "광전사",
      price: 1600,
      unlock: "tier3_skills",
      cooldown: 22,
      power: 0.35,
      radius: 0,
      duration: 7,
      element: "phys",
      desc: "7초 동안 공격력 +35%, 공격 속도 +25%.",
      color: 16724016,
      lvl5: "지속 중 처치 시 지속시간 +1초",
    },
    {
      id: "vampstrike",
      name: "흡혈의 일격",
      price: 1700,
      unlock: "tier3_skills",
      cooldown: 10,
      power: 3.4,
      radius: 90,
      duration: 0,
      element: "dark",
      desc: "가까운 적에게 순간이동해 강타하고 피해의 40%를 회복한다.",
      color: 13639760,
      lvl5: "회복량 +50%",
    },
  ],
  ve = Object.fromEntries(Se.map((A) => [A.id, A])),
  li = { power: 0.13, cooldown: 0.04, radius: 0.06, duration: 0.08 },
  hs = (A, S) => {
    const C = Math.max(120, A * 0.45) * Math.pow(1.5, S - 1);
    return C < 1e3 ? Math.round(C / 10) * 10 : Math.round(C / 50) * 50;
  },
  Qi = [
    {
      id: "pyro",
      name: "화염술사",
      desc: "화상 상태의 적에게 화염 폭발 피해 +50%",
      weapon: ["staff"],
      skill: ["fireburst"],
    },
    {
      id: "shatter",
      name: "분쇄",
      desc: "둔화/빙결된 적에게 중무기 피해 +35%",
      weapon: ["hammer", "greatsword"],
      skill: ["iceWave"],
    },
    {
      id: "storm",
      name: "폭풍의 지팡이",
      desc: "번개 사슬 연쇄 +3, 위력 +20%",
      weapon: ["staff"],
      skill: ["lightning"],
    },
    { id: "reaper", name: "사신", desc: "회전 칼날 +2개, 칼날이 흡혈", weapon: ["scythe"], skill: ["blades"] },
    {
      id: "quake",
      name: "대지진",
      desc: "충격파/지면 균열 크기 +40%, 경직 +50%",
      weapon: ["hammer", "greatsword"],
      skill: ["shockwave", "fissure"],
    },
    {
      id: "bloodlust",
      name: "피의 갈망",
      desc: "광전사 지속 중 흡혈 +5%",
      armor: ["berserker", "vampire"],
      skill: ["berserk"],
    },
    {
      id: "nightblade",
      name: "밤의 칼날",
      desc: "그림자 돌진 후 쌍검 특수 공격 즉시 충전",
      weapon: ["dual"],
      skill: ["shadowdash"],
    },
    {
      id: "hunter",
      name: "사냥꾼",
      desc: "대시 후 1초간 원거리 공격 피해 +30%",
      weapon: ["bow", "crossbow"],
      armor: ["cloth", "leather"],
    },
    { id: "sanguine", name: "혈족", desc: "흡혈의 일격 회복량 2배", armor: ["vampire"], skill: ["vampstrike"] },
    {
      id: "bastion",
      name: "철벽",
      desc: "응급 회복 사용 시 4초간 받는 피해 -30%",
      armor: ["guardian", "steel"],
      skill: ["heal"],
    },
    {
      id: "arcanist",
      name: "대마법사",
      desc: "스킬 적중 시 다른 스킬 재사용 대기시간 -0.5초",
      armor: ["mage"],
      weapon: ["staff"],
    },
  ];
function te(A, S, T, C, E, R) {
  const h = new ht(A, S);
  return (
    h.rect(1, 1, A - 2, S - 2, T),
    h.rect(1, 0, A - 2, 1, C),
    h.rect(1, S - 1, A - 2, 1, C),
    h.rect(0, 1, 1, S - 2, C),
    h.rect(A - 1, 1, 1, S - 2, C),
    h.rect(2, 1, A - 4, 1, E),
    h.rect(1, 2, 1, S - 4, E),
    h.rect(2, S - 2, A - 4, 1, st(T, -0.35)),
    h.rect(A - 2, 2, 1, S - 4, st(T, -0.35)),
    R !== void 0 &&
      (h.rect(3, 3, A - 6, 1, R),
      h.rect(3, S - 4, A - 6, 1, R),
      h.rect(3, 3, 1, S - 6, R),
      h.rect(A - 4, 3, 1, S - 6, R)),
    h
  );
}
function yn(A) {
  (lt(A, "ui_panel", te(24, 24, 1906723, 657420, 5917242, 3813440)),
    lt(A, "ui_panel_gold", te(24, 24, 2300952, 657420, 11569728, 6967344)),
    lt(A, "ui_inner", te(16, 16, 2761523, 1183254, 4076616)),
    lt(A, "ui_inner_sel", te(16, 16, 3813448, 14200912, 5917290)),
    lt(A, "ui_btn", te(16, 14, 5914672, 1314314, 10121296)),
    lt(A, "ui_btn_hi", te(16, 14, 8017976, 1314314, 13672544)),
    lt(A, "ui_btn_off", te(16, 14, 3420206, 1314314, 4867138)),
    lt(A, "ui_btn_green", te(16, 14, 3037744, 660490, 6332496)),
    lt(A, "ui_btn_green_hi", te(16, 14, 3832378, 660490, 9490544)),
    lt(A, "ui_slot", te(22, 22, 2301226, 657420, 4866128, 3156026)),
    lt(A, "ui_slot_sel", te(22, 22, 3024440, 16765024, 9072720)),
    lt(A, "ui_bar", te(16, 8, 1314324, 657420, 3813440)),
    lt(A, "ui_tooltip", te(12, 12, 1314842, 657420, 6969930)),
    lt(
      A,
      "icon_gold",
      (() => {
        const E = new ht(9, 9);
        return (
          E.circle(4, 4, 3.5, 15773728),
          E.circle(4, 4, 2, 16769120),
          E.px(3, 2, 16777215),
          E.outline(6963216),
          E
        );
      })(),
    ),
    lt(
      A,
      "icon_heart",
      (() => {
        const E = new ht(9, 8);
        return (
          E.circle(2.5, 2.5, 2.2, 14692416),
          E.circle(6, 2.5, 2.2, 14692416),
          E.poly(
            [
              [0, 3],
              [4.5, 8],
              [9, 3],
            ],
            14692416,
          ),
          E.px(2, 1, 16756912),
          E.outline(),
          E
        );
      })(),
    ),
    lt(
      A,
      "icon_flag",
      (() => {
        const E = new ht(8, 10);
        return (
          E.rect(0, 0, 1, 10, 14209216),
          E.poly(
            [
              [1, 0],
              [8, 2.5],
              [1, 5],
            ],
            16764992,
          ),
          E
        );
      })(),
    ),
    lt(
      A,
      "icon_skull",
      (() => {
        const E = new ht(9, 9);
        return (
          E.circle(4, 3.5, 3.5, 15261904),
          E.rect(2, 6, 5, 3, 15261904),
          E.px(3, 3, 1052688),
          E.px(5, 3, 1052688),
          E.px(3, 7, 1052688),
          E.px(5, 7, 1052688),
          E.outline(),
          E
        );
      })(),
    ),
    lt(
      A,
      "icon_crown",
      (() => {
        const E = new ht(10, 8);
        return (
          E.rect(0, 4, 10, 4, 16764992),
          E.poly(
            [
              [0, 4],
              [0, 0],
              [3, 3],
              [5, 0],
              [7, 3],
              [10, 0],
              [10, 4],
            ],
            16764992,
          ),
          E.px(5, 5, 16724032),
          E.outline(),
          E
        );
      })(),
    ),
    lt(
      A,
      "icon_lock",
      (() => {
        const E = new ht(9, 10);
        return (
          E.ring(4.5, 3.5, 3, 1, 11579576),
          E.rect(1, 4, 8, 6, 14200912),
          E.px(4, 6, 3153936),
          E.px(4, 7, 3153936),
          E.outline(),
          E
        );
      })(),
    ),
    lt(
      A,
      "icon_check",
      (() => {
        const E = new ht(9, 8);
        return (
          E.line(1, 4, 3, 6, 7397488),
          E.line(3, 6, 8, 1, 7397488),
          E.line(1, 5, 3, 7, 4235328),
          E.line(3, 7, 8, 2, 4235328),
          E
        );
      })(),
    ),
    lt(
      A,
      "ui_key",
      (() => {
        const E = te(13, 13, 15261904, 3156016, 16777215);
        return (E.rect(1, 10, 11, 2, 11051152), E);
      })(),
    ),
    lt(
      A,
      "ui_key_wide",
      (() => {
        const E = te(28, 13, 15261904, 3156016, 16777215);
        return (E.rect(1, 10, 26, 2, 11051152), E);
      })(),
    ));
  const S = (E, R) => {
    const h = new ht(12, 12);
    (R(h), h.outline(), lt(A, `icon_st_${E}`, h));
  };
  (S("maxHp", (E) => {
    (E.circle(3.5, 4, 3, 14692416),
      E.circle(8, 4, 3, 14692416),
      E.poly(
        [
          [0.5, 5],
          [6, 11],
          [11.5, 5],
        ],
        14692416,
      ),
      E.px(3, 3, 16761024));
  }),
    S("atk", (E) => {
      (E.line(1, 10, 9, 2, 13687008),
        E.line(2, 10, 10, 2, 10528944),
        E.line(2, 7, 5, 10, 12619840),
        E.px(10, 1, 16777215));
    }),
    S("def", (E) => {
      (E.poly(
        [
          [1, 1],
          [10, 1],
          [10, 6],
          [5.5, 11],
          [1, 6],
        ],
        6324400,
      ),
        E.rect(5, 2, 1, 8, 13687024),
        E.rect(2, 4, 8, 1, 13687024));
    }),
    S("moveSpeed", (E) => {
      (E.poly(
        [
          [1, 8],
          [7, 8],
          [10, 10],
          [1, 10],
        ],
        9067066,
      ),
        E.rect(2, 3, 5, 6, 9067066),
        E.line(0, 3, 0, 6, 16777215),
        E.line(9, 4, 11, 4, 16777215));
    }),
    S("attackSpeed", (E) => {
      (E.line(1, 10, 6, 1, 13687008),
        E.line(5, 10, 10, 1, 13687008),
        E.line(3, 3, 3, 3, 16769120),
        E.px(8, 7, 16769120));
    }),
    S("critChance", (E) => {
      (E.ring(6, 6, 5, 1, 16732224), E.ring(6, 6, 2.5, 1, 16732224), E.px(6, 6, 16777215));
    }),
    S("critDamage", (E) => {
      (E.poly(
        [
          [6, 0],
          [8, 4],
          [12, 5],
          [8, 7],
          [9, 12],
          [6, 9],
          [2, 11],
          [4, 7],
          [0, 5],
          [4, 4],
        ],
        16752672,
      ),
        E.px(6, 5, 16777215));
    }),
    S("skillPower", (E) => {
      (E.poly(
        [
          [6, 0],
          [11, 6],
          [6, 12],
          [1, 6],
        ],
        8413408,
      ),
        E.poly(
          [
            [6, 3],
            [8, 6],
            [6, 9],
            [4, 6],
          ],
          13680895,
        ));
    }),
    S("healEff", (E) => {
      (E.rect(4, 1, 4, 10, 6344800), E.rect(1, 4, 10, 4, 6344800), E.px(5, 2, 13696976));
    }),
    S("goldGain", (E) => {
      (E.circle(6, 6, 5, 15773728), E.circle(6, 6, 3, 16769120), E.rect(5, 3, 2, 6, 13668368));
    }));
  const T = (E, R, h) => {
    const m = new ht(20, 20);
    (m.rect(0, 0, 20, 20, st(R, -0.55)), m.rect(1, 1, 18, 18, st(R, -0.35)), h(m), lt(A, `icon_s_${E}`, m));
  };
  (T("shockwave", 14729344, (E) => {
    for (let R = 0; R < 3; R++) E.ring(4 + R * 4, 15, 4 + R * 2, 1, R === 2 ? 16777215 : 14729344);
    E.rect(1, 16, 18, 3, 9071170);
  }),
    T("fireburst", 16738848, (E) => {
      (E.circle(10, 10, 6, 16732176), E.circle(10, 10, 4, 16752672), E.circle(10, 10, 2, 16773280));
      for (let R = 0; R < 8; R++) {
        const h = R * 0.785;
        E.px(10 + Math.cos(h) * 8, 10 + Math.sin(h) * 8, 16765024);
      }
    }),
    T("shadowdash", 9064656, (E) => {
      for (let R = 0; R < 4; R++) E.rect(2 + R * 3, 8, 4, 4, 5909136 + R * 1052688);
      E.poly(
        [
          [12, 5],
          [18, 10],
          [12, 15],
        ],
        13672703,
      );
    }),
    T("iceWave", 8442111, (E) => {
      (E.poly(
        [
          [10, 2],
          [12, 8],
          [18, 10],
          [12, 12],
          [10, 18],
          [8, 12],
          [2, 10],
          [8, 8],
        ],
        10545407,
      ),
        E.circle(10, 10, 2, 16777215));
    }),
    T("heal", 7397488, (E) => {
      (E.rect(8, 3, 4, 14, 6348896),
        E.rect(3, 8, 14, 4, 6348896),
        E.rect(9, 4, 2, 12, 13696976),
        E.rect(4, 9, 12, 2, 13696976));
    }),
    T("lightning", 16773216, (E) => {
      (E.poly(
        [
          [11, 1],
          [5, 11],
          [9, 11],
          [7, 19],
          [15, 8],
          [11, 8],
          [14, 1],
        ],
        16773216,
      ),
        E.line(11, 2, 7, 10, 16777215));
    }),
    T("blades", 12636384, (E) => {
      for (let R = 0; R < 3; R++) {
        const h = R * 2.09,
          m = 10 + Math.cos(h) * 5.5,
          t = 10 + Math.sin(h) * 5.5;
        E.poly(
          [
            [m, t - 3],
            [m + 3, t],
            [m, t + 3],
            [m - 3, t],
          ],
          14741759,
        );
      }
      E.ring(10, 10, 7, 1, 8425632);
    }),
    T("fissure", 11567184, (E) => {
      (E.rect(1, 14, 18, 5, 6965802),
        E.poly(
          [
            [3, 14],
            [5, 6],
            [7, 14],
          ],
          13152392,
        ),
        E.poly(
          [
            [8, 14],
            [11, 3],
            [14, 14],
          ],
          14205080,
        ),
        E.poly(
          [
            [14, 14],
            [16, 8],
            [18, 14],
          ],
          13152392,
        ),
        E.line(1, 16, 18, 15, 2101256));
    }),
    T("berserk", 16724016, (E) => {
      (E.circle(10, 10, 6, 12591136),
        E.poly(
          [
            [5, 6],
            [8, 9],
            [5, 10],
          ],
          16769248,
        ),
        E.poly(
          [
            [15, 6],
            [12, 9],
            [15, 10],
          ],
          16769248,
        ),
        E.rect(7, 13, 6, 2, 3147784),
        E.poly(
          [
            [4, 4],
            [2, 0],
            [7, 3],
          ],
          15261896,
        ),
        E.poly(
          [
            [16, 4],
            [18, 0],
            [13, 3],
          ],
          15261896,
        ));
    }),
    T("vampstrike", 13639760, (E) => {
      (E.line(3, 17, 15, 3, 13687008),
        E.line(4, 17, 16, 3, 10528944),
        E.circle(14, 14, 3, 13639760),
        E.poly(
          [
            [14, 9],
            [16, 13],
            [12, 13],
          ],
          13639760,
        ),
        E.px(13, 13, 16752816));
    }));
  for (const E of Se) A.textures.exists(`icon_s_${E.id}`) || T(E.id, E.color, () => {});
  for (const E of le) {
    const R = new ht(20, 20),
      h = E.look;
    if (
      (R.rect(5, 6, 10, 11, h.body),
      R.rect(5, 6, 10, 2, st(h.body, 0.3)),
      R.rect(5, 14, 10, 2, h.trim),
      R.rect(5, 6, 1, 11, st(h.body, -0.3)),
      R.rect(2, 5, 4, 4, h.trim),
      R.rect(14, 5, 4, 4, h.trim),
      R.rect(8, 3, 4, 3, st(h.body, -0.2)),
      h.shoulder === "spike" &&
        (R.px(3, 3, 14737632), R.px(16, 3, 14737632), R.px(3, 4, 14737632), R.px(16, 4, 14737632)),
      h.shoulder === "plate" &&
        (R.rect(1, 4, 6, 5, h.body),
        R.rect(13, 4, 6, 5, h.body),
        R.rect(1, 4, 6, 1, st(h.body, 0.4)),
        R.rect(13, 4, 6, 1, st(h.body, 0.4))),
      h.shoulder === "fur" && (R.rect(1, 4, 6, 4, 14207144), R.rect(13, 4, 6, 4, 14207144)),
      h.glow !== void 0 && R.rect(9, 9, 2, 2, h.glow),
      h.cape !== void 0 && R.rect(5, 17, 10, 2, h.cape),
      E.id === "chain")
    )
      for (let m = 8; m < 14; m++) for (let t = 6 + (m % 2); t < 15; t += 2) R.px(t, m, st(h.body, -0.2));
    (E.id === "thorns" && (R.px(7, 10, 14737632), R.px(12, 12, 14737632), R.px(10, 8, 14737632)),
      R.outline(),
      lt(A, `icon_a_${E.id}`, R));
  }
  const C = (E, R, h) => {
    const m = new ht(10, 10);
    (m.rect(0, 0, 10, 10, st(R, -0.6)), h(m), lt(A, `icon_b_${E}`, m));
  };
  (C("atk", 16732224, (E) => {
    (E.line(1, 8, 8, 1, 16765120), E.px(8, 1, 16777215));
  }),
    C("crit", 16752672, (E) => {
      (E.ring(5, 5, 4, 1, 16760928), E.px(5, 5, 16777215));
    }),
    C("speed", 6340863, (E) => {
      (E.line(1, 3, 7, 3, 12642559), E.line(2, 6, 8, 6, 12642559));
    }),
    C("regen", 6348896, (E) => {
      (E.rect(4, 1, 2, 8, 12648384), E.rect(1, 4, 8, 2, 12648384));
    }),
    C("berserk", 16724016, (E) => {
      E.circle(5, 5, 3, 16744576);
    }),
    C("poison", 8441920, (E) => {
      (E.circle(5, 6, 3, 10543200), E.px(5, 2, 10543200));
    }),
    C("burn", 16736288, (E) => {
      E.poly(
        [
          [2, 9],
          [5, 1],
          [8, 9],
        ],
        16752704,
      );
    }),
    C("chill", 8442111, (E) => {
      (E.line(5, 1, 5, 8, 14743807), E.line(1, 5, 8, 5, 14743807));
    }),
    C("curse", 10502399, (E) => {
      (E.circle(5, 5, 3, 13668607), E.px(5, 5, 2097200));
    }),
    C("shield", 8425648, (E) => {
      E.poly(
        [
          [1, 1],
          [8, 1],
          [8, 5],
          [4.5, 9],
          [1, 5],
        ],
        12636400,
      );
    }),
    C("gold", 15773728, (E) => {
      E.circle(5, 5, 3, 16769120);
    }),
    Et(
      A,
      "dummy",
      Pt(2, 20, 32, (E, R) => {
        const h = R ? 2 : 0;
        (E.rect(9, 20, 2, 12, 6965802),
          E.rect(5, 30, 10, 2, 4864554),
          E.rect(4 + h, 9, 12, 13, 13150320),
          E.rect(4 + h, 13, 12, 1, 9071170),
          E.rect(4 + h, 18, 12, 1, 9071170),
          E.circle(10 + h, 5, 4.5, 14203008),
          E.px(8 + h, 4, 3811866),
          E.px(12 + h, 4, 3811866),
          E.rect(0 + h, 11, 20, 3, 12097632),
          E.ring(10 + h, 15, 3, 1, 12595248));
      }),
      20,
      32,
    ));
}
function Bi(A, S, T, C, E, R) {
  A.poly(
    [
      [S - 4, T + E],
      [S + C / 2, T],
      [S + C + 4, T + E],
    ],
    R,
  );
  for (let h = 0; h < E; h += 4)
    A.line(S - 4 + (h * (C / 2 + 4)) / E, T + E - h, S + C + 4 - (h * (C / 2 + 4)) / E, T + E - h, st(R, -0.2));
  A.line(S - 4, T + E, S + C / 2, T, st(R, 0.3));
}
function Xe(A, S, T, C, E, R, h = !1) {
  if ((A.rect(S, T, C, E, R), h))
    for (let m = 0; m < E; m += 6) {
      A.rect(S, T + m, C, 1, st(R, -0.25));
      for (let t = (m / 6) % 2 ? 4 : 0; t < C; t += 10) A.rect(S + t, T + m, 1, 6, st(R, -0.25));
    }
  else {
    for (let m = 0; m < C; m += 6) A.rect(S + m, T, 1, E, st(R, -0.18));
    (A.rect(S, T, 3, E, st(R, -0.3)), A.rect(S + C - 3, T, 3, E, st(R, -0.3)));
  }
}
function ui(A, S, T, C, E) {
  (A.rect(S, T, C, E, 3810328),
    A.rect(S + 1, T + 1, C - 2, E - 1, 5913124),
    A.rect(S + C / 2, T + 1, 1, E - 1, 3810328),
    A.px(S + C - 3, T + E / 2, 14200896));
}
function Qe(A, S, T, C = 16765040) {
  (A.rect(S, T, 8, 8, 2759184),
    A.rect(S + 1, T + 1, 6, 6, C),
    A.rect(S + 4, T + 1, 1, 6, 2759184),
    A.rect(S + 1, T + 4, 6, 1, 2759184));
}
function Tn(A) {
  (lt(
    A,
    "hub_forge",
    (() => {
      const S = new ht(120, 100);
      return (
        S.rect(84, 4, 12, 40, 6972528),
        S.rect(84, 4, 12, 3, 9077904),
        Xe(S, 10, 44, 92, 56, 8025216, !0),
        Bi(S, 10, 24, 92, 22, 6961706),
        S.rect(24, 64, 30, 30, 2101264),
        S.rect(26, 66, 26, 28, 12599312),
        S.rect(30, 72, 18, 22, 16744480),
        S.rect(34, 80, 10, 14, 16765024),
        S.rect(22, 62, 34, 3, 4867152),
        ui(S, 70, 70, 16, 30),
        S.rect(60, 50, 34, 10, 5913122),
        S.rect(62, 52, 30, 6, 9071170),
        S.line(68, 55, 74, 53, 10528944),
        S.line(76, 56, 86, 52, 10528944),
        S.rect(82, 51, 4, 3, 6974068),
        S.outline(),
        S
      );
    })(),
  ),
    lt(
      A,
      "hub_anvil",
      (() => {
        const S = new ht(22, 14);
        return (
          S.rect(2, 0, 18, 4, 4868692),
          S.rect(0, 0, 4, 2, 4868692),
          S.rect(2, 0, 18, 1, 8026760),
          S.rect(7, 4, 8, 5, 3816004),
          S.rect(4, 9, 14, 5, 5913122),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_armory",
      (() => {
        const S = new ht(110, 96);
        return (
          Xe(S, 8, 40, 94, 56, 10123866),
          Bi(S, 8, 18, 94, 24, 3824250),
          ui(S, 46, 66, 18, 30),
          Qe(S, 18, 56),
          Qe(S, 82, 56),
          S.poly(
            [
              [48, 40],
              [62, 40],
              [62, 52],
              [55, 60],
              [48, 52],
            ],
            6324400,
          ),
          S.rect(54, 41, 2, 16, 14209216),
          S.rect(49, 46, 12, 2, 14209216),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_armorstand",
      (() => {
        const S = new ht(20, 34);
        return (
          S.rect(9, 10, 2, 22, 5913122),
          S.rect(4, 32, 12, 2, 4864554),
          S.rect(4, 10, 12, 12, 10528952),
          S.rect(4, 10, 12, 2, 13687008),
          S.rect(1, 9, 5, 4, 8423576),
          S.rect(14, 9, 5, 4, 8423576),
          S.rect(6, 2, 8, 8, 9476776),
          S.rect(9, 5, 4, 1, 1052688),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_training",
      (() => {
        const S = new ht(120, 70);
        for (let T = 0; T < 120; T += 12) (S.rect(T + 2, 40, 4, 30, 8018490), S.rect(T + 2, 40, 4, 2, 10123866));
        (S.rect(0, 46, 120, 3, 9071170),
          S.rect(0, 58, 120, 3, 9071170),
          S.rect(14, 10, 40, 4, 5913122),
          S.rect(14, 36, 40, 4, 5913122),
          S.rect(14, 10, 3, 30, 5913122),
          S.rect(51, 10, 3, 30, 5913122));
        for (let T = 0; T < 4; T++)
          (S.line(22 + T * 8, 4, 22 + T * 8, 38, T % 2 ? 9067050 : 11581636), S.px(22 + T * 8, 3, 16777215));
        return (
          S.rect(80, 14, 30, 16, 9071170),
          S.rect(80, 14, 30, 2, 11045466),
          S.rect(94, 30, 3, 14, 5913122),
          S.line(86, 20, 104, 20, 3811866),
          S.line(86, 24, 100, 24, 3811866),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_magetower",
      (() => {
        const S = new ht(80, 150);
        (Xe(S, 16, 50, 48, 100, 6972544, !0),
          S.rect(12, 46, 56, 6, 5919856),
          S.poly(
            [
              [10, 48],
              [40, 0],
              [70, 48],
            ],
            4860538,
          ),
          S.line(10, 48, 40, 0, 8018608));
        for (let T = 0; T < 4; T++) S.px(30 + T * 6, 30 + (T % 2) * 6, 16769152);
        return (
          S.circle(40, 4, 4, 8446207),
          S.px(39, 3, 16777215),
          Qe(S, 36, 70, 11575551),
          Qe(S, 36, 100, 11575551),
          ui(S, 32, 124, 16, 26),
          S.poly(
            [
              [4, 150],
              [8, 132],
              [12, 150],
            ],
            6340832,
          ),
          S.poly(
            [
              [68, 150],
              [72, 128],
              [76, 150],
            ],
            8413408,
          ),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_wardrobe",
      (() => {
        const S = new ht(100, 90);
        return (
          Xe(S, 6, 36, 88, 54, 11045466),
          Bi(S, 6, 14, 88, 24, 8006186),
          S.rect(18, 50, 26, 40, 5913122),
          S.rect(20, 52, 22, 36, 8015920),
          S.rect(30, 52, 2, 36, 5913122),
          S.px(28, 70, 14200896),
          S.px(33, 70, 14200896),
          ui(S, 60, 62, 16, 28),
          Qe(S, 80, 50),
          S.rect(4, 30, 3, 26, 3811874),
          S.poly(
            [
              [7, 32],
              [20, 34],
              [20, 48],
              [7, 46],
            ],
            2779722,
          ),
          S.circle(13, 40, 2, 14200896),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_board",
      (() => {
        const S = new ht(56, 54);
        (S.rect(6, 24, 4, 30, 5913122),
          S.rect(46, 24, 4, 30, 5913122),
          S.rect(0, 4, 56, 32, 8018490),
          S.rect(2, 6, 52, 28, 10517072),
          S.rect(0, 4, 56, 2, 10123866),
          S.poly(
            [
              [-2, 6],
              [28, -4],
              [58, 6],
            ],
            5913130,
          ));
        const T = [
          [6, 9, 15788240],
          [20, 12, 15261896],
          [34, 8, 16314592],
          [42, 18, 14735552],
          [10, 21, 15788240],
        ];
        for (const [C, E, R] of T)
          (S.rect(C, E, 10, 11, R),
            S.px(C + 4, E, 12595248),
            S.line(C + 2, E + 4, C + 7, E + 4, 9076848),
            S.line(C + 2, E + 6, C + 6, E + 6, 9076848));
        return (S.rect(22, 25, 12, 6, 16764992), S.rect(23, 26, 10, 4, 16771200), S.outline(), S);
      })(),
    ),
    lt(
      A,
      "hub_gate",
      (() => {
        const S = new ht(96, 130);
        (Xe(S, 0, 20, 20, 110, 8025216, !0), Xe(S, 76, 20, 20, 110, 8025216, !0), S.rect(0, 10, 96, 14, 6972528));
        for (let T = 0; T < 96; T += 10) S.rect(T, 4, 6, 8, 6972528);
        (S.rect(0, 10, 96, 2, 10130592), S.rect(20, 24, 56, 106, 1709088), S.rect(22, 26, 52, 104, 2767402));
        for (let T = 24; T < 74; T += 8) S.rect(T, 26, 3, 100, 5913122);
        return (
          S.rect(22, 26, 52, 3, 3811874),
          S.rect(40, 12, 16, 10, 9071170),
          S.line(43, 17, 53, 17, 3811866),
          S.poly(
            [
              [50, 14],
              [54, 17],
              [50, 20],
            ],
            3811866,
          ),
          S.outline(),
          S
        );
      })(),
    ),
    Et(
      A,
      "hub_torch",
      Pt(4, 10, 26, (S, T) => {
        (S.rect(4, 10, 2, 16, 4864554), S.rect(2, 8, 6, 3, 6972528));
        const C = [7, 8, 6, 8][T];
        (S.poly(
          [
            [2, 9],
            [5, 9 - C],
            [8, 9],
          ],
          16740384,
        ),
          S.poly(
            [
              [3, 9],
              [5 + (T % 2 ? 1 : -1), 10 - C * 0.7],
              [7, 9],
            ],
            16760896,
          ),
          S.px(5, 7, 16773312));
      }),
      10,
      26,
    ),
    Et(
      A,
      "hub_smoke",
      Pt(
        4,
        16,
        16,
        (S, T) => {
          S.circle(8, 8, 3 + T, 9077904, 160 - T * 35);
        },
        null,
      ),
      16,
      16,
    ),
    lt(
      A,
      "hub_well",
      (() => {
        const S = new ht(32, 34);
        return (
          S.rect(2, 20, 28, 14, 9077880),
          S.rect(2, 20, 28, 2, 11578010),
          S.rect(4, 2, 3, 20, 5913122),
          S.rect(25, 2, 3, 20, 5913122),
          S.poly(
            [
              [0, 4],
              [16, -4],
              [32, 4],
            ],
            6961706,
          ),
          S.rect(14, 4, 4, 8, 8018490),
          S.outline(),
          S
        );
      })(),
    ),
    lt(
      A,
      "hub_crates",
      (() => {
        const S = new ht(30, 22);
        return (
          S.rect(0, 8, 16, 14, 9071170),
          S.rect(0, 8, 16, 2, 11045466),
          S.line(0, 8, 16, 22, 5913122),
          S.rect(14, 0, 14, 22, 8018490),
          S.rect(14, 0, 14, 2, 10123866),
          S.line(14, 0, 28, 22, 4864546),
          S.outline(),
          S
        );
      })(),
    ),
    Ue(A, "npc_smith", { body: 6965810, trim: 3811866, dark: 3816004, shoulder: "none", helm: "bandana" }),
    Ue(A, "npc_armorer", { body: 9081504, trim: 5922928, dark: 3816008, shoulder: "plate", helm: "cap" }),
    Ue(A, "npc_trainer", { body: 10107434, trim: 3811866, dark: 4860450, shoulder: "fur", helm: "none" }),
    Ue(A, "npc_mage", {
      body: 4860538,
      trim: 13676608,
      dark: 2759242,
      shoulder: "orb",
      helm: "hood",
      glow: 8429823,
      skirt: !0,
    }),
    Ue(A, "npc_quarter", {
      body: 2779722,
      trim: 14200896,
      dark: 2767402,
      shoulder: "pad",
      helm: "none",
      cape: 6957610,
    }),
    Ue(A, "npc_scribe", { body: 11575424, trim: 6965802, dark: 5917242, shoulder: "none", helm: "cap", skirt: !0 }));
}
const Rt = 16777215,
  Nt = 13158600,
  kt = 9079434,
  Sn = {
    sword: (A) => {
      (A.line(3, 12, 12, 3, Rt), A.line(4, 12, 12, 4, Nt), A.line(2, 9, 6, 13, kt), A.rect(1, 12, 2, 2, kt));
    },
    heart: (A) => {
      (A.circle(4.5, 5, 3, Rt),
        A.circle(9.5, 5, 3, Rt),
        A.poly(
          [
            [1.5, 6],
            [7, 13],
            [12.5, 6],
          ],
          Rt,
        ),
        A.px(4, 4, 16777215),
        A.rect(8, 9, 2, 1, Nt));
    },
    bolt: (A) => {
      (A.poly(
        [
          [8, 1],
          [3, 8],
          [7, 8],
          [5, 14],
          [11, 6],
          [7, 6],
          [9, 1],
        ],
        Rt,
      ),
        A.line(7, 8, 5, 13, Nt));
    },
    flame: (A) => {
      (A.poly(
        [
          [7, 1],
          [12, 8],
          [10, 13],
          [4, 13],
          [2, 8],
          [5, 5],
          [6, 8],
        ],
        Rt,
      ),
        A.poly(
          [
            [7, 7],
            [9, 10],
            [8, 13],
            [6, 13],
            [5, 10],
          ],
          Nt,
        ));
    },
    frost: (A) => {
      (A.line(7, 1, 7, 13, Rt),
        A.line(1, 7, 13, 7, Rt),
        A.line(3, 3, 11, 11, Nt),
        A.line(11, 3, 3, 11, Nt),
        A.circle(7, 7, 1.5, Rt));
    },
    poison: (A) => {
      (A.poly(
        [
          [7, 2],
          [11, 8],
          [7, 13],
          [3, 8],
        ],
        Rt,
      ),
        A.circle(7, 9, 3.5, Rt),
        A.circle(6, 9, 1, kt),
        A.circle(11.5, 3, 1.3, Nt),
        A.px(2, 4, Nt));
    },
    boot: (A) => {
      (A.rect(4, 2, 5, 8, Rt), A.rect(4, 9, 9, 4, Rt), A.rect(4, 12, 9, 1, kt), A.rect(4, 4, 5, 1, Nt));
    },
    clock: (A) => {
      (A.circle(7, 7, 5.5, Rt), A.ring(7, 7, 5.5, 1, kt), A.line(7, 7, 7, 3, kt), A.line(7, 7, 10, 8, kt));
    },
    shield: (A) => {
      (A.poly(
        [
          [2, 2],
          [12, 2],
          [12, 7],
          [7, 13],
          [2, 7],
        ],
        Rt,
      ),
        A.poly(
          [
            [7, 3],
            [11, 3],
            [11, 7],
            [7, 11.5],
          ],
          Nt,
        ));
    },
    coin: (A) => {
      (A.circle(7, 7, 5.5, Rt), A.ring(7, 7, 5.5, 1, Nt), A.rect(6, 4, 2, 6, kt));
    },
    skull: (A) => {
      (A.circle(7, 6, 5, Rt),
        A.rect(4, 9, 6, 4, Rt),
        A.rect(4, 5, 2, 2, 2105376),
        A.rect(8, 5, 2, 2, 2105376),
        A.px(7, 8, kt),
        A.px(5, 12, kt),
        A.px(7, 12, kt));
    },
    star: (A) => {
      (A.poly(
        [
          [7, 1],
          [8.8, 5.5],
          [13.5, 5.5],
          [9.6, 8.4],
          [11, 13],
          [7, 10.2],
          [3, 13],
          [4.4, 8.4],
          [0.5, 5.5],
          [5.2, 5.5],
        ],
        Rt,
      ),
        A.circle(7, 7.5, 1.2, Nt));
    },
    eye: (A) => {
      (A.ellipse(7, 7, 6, 3.5, Rt), A.circle(7, 7, 2.5, kt), A.circle(7, 7, 1, 2105376), A.px(6, 6, Rt));
    },
    wing: (A) => {
      (A.poly(
        [
          [2, 12],
          [3, 6],
          [7, 2],
          [13, 1],
          [10, 5],
          [12, 6],
          [8, 9],
          [9, 10],
          [5, 12],
        ],
        Rt,
      ),
        A.line(3, 11, 10, 4, Nt));
    },
    orb: (A) => {
      (A.circle(7, 7, 4.5, Rt), A.ring(7, 7, 6.5, 1, Nt), A.circle(5.5, 5.5, 1.3, 16777215), A.circle(8.5, 9, 1.2, kt));
    },
    fang: (A) => {
      (A.poly(
        [
          [2, 2],
          [6, 2],
          [4, 12],
        ],
        Rt,
      ),
        A.poly(
          [
            [8, 2],
            [12, 2],
            [10, 12],
          ],
          Rt,
        ),
        A.rect(1, 1, 12, 2, Nt));
    },
    crit: (A) => {
      (A.poly(
        [
          [7, 0],
          [8.5, 5.5],
          [14, 7],
          [8.5, 8.5],
          [7, 14],
          [5.5, 8.5],
          [0, 7],
          [5.5, 5.5],
        ],
        Rt,
      ),
        A.circle(7, 7, 1.5, Nt));
    },
    book: (A) => {
      (A.rect(2, 2, 10, 11, Rt), A.rect(2, 2, 2, 11, kt), A.rect(5, 5, 6, 1, Nt), A.rect(5, 8, 5, 1, Nt));
    },
    drop: (A) => {
      (A.poly(
        [
          [7, 1],
          [11.5, 8],
          [7, 13.5],
          [2.5, 8],
        ],
        Rt,
      ),
        A.circle(7, 9, 4.2, Rt),
        A.circle(5.5, 9, 1.2, 16777215),
        A.circle(8.5, 10.5, 1, Nt));
    },
    wave: (A) => {
      (A.ring(4, 7, 7, 2.5, Rt), A.rect(0, 0, 4, 14, 0, 0));
      for (let S = 0; S < 14; S++) for (let T = 0; T < 4; T++) A.clearPx(T, S);
      A.line(5, 2, 5, 12, Nt);
    },
    crown: (A) => {
      (A.poly(
        [
          [1, 12],
          [1, 4],
          [4, 8],
          [7, 2],
          [10, 8],
          [13, 4],
          [13, 12],
        ],
        Rt,
      ),
        A.rect(1, 10, 13, 2, Nt),
        A.px(7, 6, kt));
    },
    feather: (A) => {
      (A.poly(
        [
          [11, 1],
          [13, 3],
          [5, 11],
          [3, 11],
          [3, 9],
        ],
        Rt,
      ),
        A.line(2, 12, 11, 3, kt),
        A.line(1, 13, 3, 11, Nt));
    },
    moon: (A) => {
      A.circle(7, 7, 6, Rt);
      for (let S = 0; S < 14; S++) for (let T = 0; T < 14; T++) (T - 10) ** 2 + (S - 5) ** 2 < 25 && A.clearPx(T, S);
      (A.px(3, 6, Nt), A.px(5, 10, Nt));
    },
    fist: (A) => {
      (A.rect(3, 4, 9, 8, Rt),
        A.rect(3, 4, 9, 1, Nt),
        A.line(6, 4, 6, 7, kt),
        A.line(9, 4, 9, 7, kt),
        A.rect(1, 6, 3, 4, Rt),
        A.rect(4, 12, 7, 1, kt));
    },
  };
function Cn(A, S, T) {
  const R = new ht(24, 24);
  return (
    R.rect(1, 1, 22, 22, A),
    R.rect(1, 0, 22, 1, 657420),
    R.rect(1, 23, 22, 1, 657420),
    R.rect(0, 1, 1, 22, 657420),
    R.rect(23, 1, 1, 22, 657420),
    R.rect(1, 1, 22, 2, S),
    R.rect(1, 1, 2, 22, S),
    R.rect(21, 1, 2, 22, S),
    R.rect(1, 21, 22, 2, S),
    R.rect(3, 3, 18, 1, T),
    R.rect(3, 3, 1, 18, T),
    R.rect(4, 20, 16, 1, st(A, -0.3)),
    R
  );
}
function En(A) {
  for (const [T, C] of Object.entries(Sn)) {
    const E = new ht(14, 14);
    (C(E), E.outline(1314328), lt(A, `perk_${T}`, E));
  }
  const S = [
    ["common", 9076848, 2761776],
    ["rare", 4886752, 1845312],
    ["epic", 10510560, 2759744],
    ["legendary", 15765552, 3810324],
  ];
  for (const [T, C, E] of S) {
    lt(A, `ui_card_${T}`, Cn(E, C, st(C, 0.4)));
    const R = new ht(18, 18);
    (R.rect(1, 1, 16, 16, E), R.ring(9, 9, 9, 1.5, C), R.rect(0, 0, 18, 18, 0, 0));
    for (const [h, m] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [17, 0],
      [16, 0],
      [17, 1],
      [0, 17],
      [1, 17],
      [0, 16],
      [17, 17],
      [16, 17],
      [17, 16],
    ])
      R.clearPx(h, m);
    (R.rect(1, 1, 16, 1, C),
      R.rect(1, 16, 16, 1, C),
      R.rect(1, 1, 1, 16, C),
      R.rect(16, 1, 1, 16, C),
      lt(A, `perkbadge_${T}`, R));
  }
}
const Os = [
    {
      id: "slime",
      name: "초원 슬라임",
      ai: "hopper",
      hp: 22,
      atk: 7,
      def: 0,
      speed: 70,
      sight: 190,
      range: 18,
      cooldown: 1.1,
      windup: 0.35,
      recovery: 0.3,
      w: 14,
      h: 11,
      gold: 4,
    },
    {
      id: "hound",
      name: "들개",
      ai: "charger",
      hp: 26,
      atk: 9,
      def: 0,
      speed: 105,
      sight: 230,
      range: 150,
      cooldown: 2.2,
      windup: 0.5,
      recovery: 0.5,
      w: 20,
      h: 13,
      gold: 6,
    },
    {
      id: "goblin",
      name: "고블린 투석병",
      ai: "ranged",
      hp: 20,
      atk: 8,
      def: 0,
      speed: 60,
      sight: 280,
      range: 210,
      cooldown: 2,
      windup: 0.5,
      recovery: 0.4,
      w: 11,
      h: 17,
      gold: 6,
      projectile: { sprite: "p_rock", speed: 240, gravity: 520, life: 2.5, radius: 4 },
    },
    {
      id: "sentry",
      name: "폐허 파수병",
      ai: "shield",
      hp: 46,
      atk: 11,
      def: 10,
      speed: 40,
      sight: 170,
      range: 28,
      cooldown: 1.8,
      windup: 0.55,
      recovery: 0.5,
      w: 16,
      h: 23,
      gold: 10,
      heavy: 0.6,
    },
    {
      id: "sporecap",
      name: "독포자 버섯",
      ai: "ambush",
      hp: 32,
      atk: 9,
      def: 2,
      speed: 50,
      sight: 80,
      range: 44,
      cooldown: 2.4,
      windup: 0.6,
      recovery: 0.6,
      w: 16,
      h: 15,
      gold: 5,
      element: "poison",
      status: { type: "poison", chance: 1, dur: 4, power: 0.2 },
    },
    {
      id: "wasp",
      name: "독침 말벌",
      ai: "flyer",
      hp: 22,
      atk: 9,
      def: 0,
      speed: 115,
      sight: 240,
      range: 100,
      cooldown: 1.9,
      windup: 0.45,
      recovery: 0.5,
      w: 13,
      h: 11,
      gold: 5,
      flying: !0,
      element: "poison",
      status: { type: "poison", chance: 0.6, dur: 3, power: 0.15 },
    },
    {
      id: "shaman",
      name: "숲 주술사",
      ai: "support",
      hp: 28,
      atk: 8,
      def: 0,
      speed: 55,
      sight: 260,
      range: 220,
      cooldown: 2.3,
      windup: 0.5,
      recovery: 0.4,
      w: 12,
      h: 18,
      gold: 7,
      element: "poison",
      projectile: { sprite: "p_thorn", speed: 260, life: 2, radius: 4 },
    },
    {
      id: "rotbear",
      name: "썩은 곰",
      ai: "aoe",
      hp: 85,
      atk: 14,
      def: 5,
      speed: 55,
      sight: 200,
      range: 46,
      cooldown: 2.6,
      windup: 0.8,
      recovery: 0.7,
      w: 28,
      h: 22,
      gold: 11,
      heavy: 0.75,
    },
    {
      id: "bat",
      name: "동굴 박쥐",
      ai: "flyer",
      hp: 18,
      atk: 10,
      def: 0,
      speed: 150,
      sight: 260,
      range: 120,
      cooldown: 1.5,
      windup: 0.35,
      recovery: 0.45,
      w: 14,
      h: 10,
      gold: 5,
      flying: !0,
    },
    {
      id: "crawler",
      name: "수정 갑각충",
      ai: "ambush",
      hp: 40,
      atk: 12,
      def: 14,
      speed: 85,
      sight: 90,
      range: 24,
      cooldown: 1.4,
      windup: 0.4,
      recovery: 0.4,
      w: 18,
      h: 12,
      gold: 7,
      heavy: 0.4,
    },
    {
      id: "worm",
      name: "땅굴 벌레",
      ai: "burrower",
      hp: 46,
      atk: 13,
      def: 4,
      speed: 90,
      sight: 260,
      range: 30,
      cooldown: 2.4,
      windup: 0.6,
      recovery: 0.8,
      w: 16,
      h: 26,
      gold: 8,
      heavy: 0.8,
    },
    {
      id: "kobold",
      name: "코볼트 폭파병",
      ai: "lobber",
      hp: 26,
      atk: 14,
      def: 2,
      speed: 60,
      sight: 260,
      range: 220,
      cooldown: 2.6,
      windup: 0.6,
      recovery: 0.5,
      w: 12,
      h: 15,
      gold: 7,
      element: "fire",
      projectile: { sprite: "p_bomb", speed: 230, gravity: 600, life: 3, radius: 5, aoe: 32 },
    },
    {
      id: "scorpion",
      name: "사막 전갈",
      ai: "melee",
      hp: 42,
      atk: 12,
      def: 8,
      speed: 95,
      sight: 210,
      range: 28,
      cooldown: 1.3,
      windup: 0.4,
      recovery: 0.35,
      w: 22,
      h: 12,
      gold: 8,
      element: "poison",
      status: { type: "poison", chance: 0.5, dur: 3, power: 0.18 },
    },
    {
      id: "raider",
      name: "모래 약탈자",
      ai: "charger",
      hp: 40,
      atk: 14,
      def: 3,
      speed: 110,
      sight: 250,
      range: 170,
      cooldown: 2,
      windup: 0.45,
      recovery: 0.5,
      w: 13,
      h: 20,
      gold: 9,
    },
    {
      id: "mummy",
      name: "저주받은 미라",
      ai: "summoner",
      hp: 58,
      atk: 10,
      def: 6,
      speed: 35,
      sight: 240,
      range: 200,
      cooldown: 4.5,
      windup: 0.9,
      recovery: 0.6,
      w: 14,
      h: 22,
      gold: 11,
      summon: "scarab",
    },
    {
      id: "scarab",
      name: "스카라브",
      ai: "melee",
      hp: 10,
      atk: 6,
      def: 4,
      speed: 130,
      sight: 300,
      range: 14,
      cooldown: 1,
      windup: 0.25,
      recovery: 0.3,
      w: 10,
      h: 7,
      gold: 1,
    },
    {
      id: "djinn",
      name: "모래 정령",
      ai: "ranged",
      hp: 34,
      atk: 11,
      def: 0,
      speed: 70,
      sight: 280,
      range: 220,
      cooldown: 2.1,
      windup: 0.5,
      recovery: 0.4,
      w: 16,
      h: 20,
      gold: 9,
      flying: !0,
      projectile: { sprite: "p_sand", speed: 230, life: 2.2, radius: 5 },
      projCount: 3,
    },
    {
      id: "wolf",
      name: "설원 늑대",
      ai: "charger",
      hp: 42,
      atk: 13,
      def: 2,
      speed: 140,
      sight: 260,
      range: 160,
      cooldown: 1.8,
      windup: 0.4,
      recovery: 0.4,
      w: 22,
      h: 14,
      gold: 9,
      element: "ice",
    },
    {
      id: "wisp",
      name: "얼음 정령",
      ai: "ranged",
      hp: 30,
      atk: 12,
      def: 0,
      speed: 60,
      sight: 280,
      range: 230,
      cooldown: 2.2,
      windup: 0.55,
      recovery: 0.4,
      w: 14,
      h: 14,
      gold: 9,
      flying: !0,
      element: "ice",
      status: { type: "chill", chance: 1, dur: 2, power: 0.35 },
      projectile: { sprite: "p_icicle", speed: 300, life: 2, radius: 4 },
    },
    {
      id: "yeti",
      name: "설인",
      ai: "aoe",
      hp: 115,
      atk: 18,
      def: 6,
      speed: 55,
      sight: 230,
      range: 50,
      cooldown: 2.4,
      windup: 0.75,
      recovery: 0.7,
      w: 28,
      h: 30,
      gold: 14,
      heavy: 0.85,
      projectile: { sprite: "p_snowball", speed: 250, gravity: 500, life: 3, radius: 7, aoe: 24 },
    },
    {
      id: "tortoise",
      name: "빙결 거북",
      ai: "shield",
      hp: 75,
      atk: 13,
      def: 22,
      speed: 35,
      sight: 180,
      range: 30,
      cooldown: 2,
      windup: 0.6,
      recovery: 0.6,
      w: 24,
      h: 18,
      gold: 11,
      heavy: 0.9,
      element: "ice",
      status: { type: "chill", chance: 1, dur: 2, power: 0.35 },
    },
    {
      id: "pikeman",
      name: "요새 창병",
      ai: "shield",
      hp: 62,
      atk: 15,
      def: 18,
      speed: 50,
      sight: 220,
      range: 54,
      cooldown: 1.7,
      windup: 0.5,
      recovery: 0.5,
      w: 14,
      h: 24,
      gold: 11,
      heavy: 0.6,
    },
    {
      id: "xbowman",
      name: "석궁병",
      ai: "ranged",
      hp: 38,
      atk: 16,
      def: 6,
      speed: 55,
      sight: 320,
      range: 280,
      cooldown: 2.2,
      windup: 0.7,
      recovery: 0.4,
      w: 13,
      h: 22,
      gold: 10,
      projectile: { sprite: "p_ebolt", speed: 460, life: 1.6, radius: 4 },
    },
    {
      id: "ballista",
      name: "공성 발리스타",
      ai: "turret",
      hp: 75,
      atk: 24,
      def: 25,
      speed: 0,
      sight: 400,
      range: 400,
      cooldown: 3.4,
      windup: 1,
      recovery: 0.5,
      w: 30,
      h: 18,
      gold: 14,
      heavy: 1,
      projectile: { sprite: "p_ballista", speed: 520, life: 1.6, radius: 6, pierce: 9 },
    },
    {
      id: "bomber",
      name: "화염 투척병",
      ai: "lobber",
      hp: 40,
      atk: 16,
      def: 5,
      speed: 55,
      sight: 260,
      range: 230,
      cooldown: 2.6,
      windup: 0.6,
      recovery: 0.5,
      w: 13,
      h: 21,
      gold: 11,
      element: "fire",
      status: { type: "burn", chance: 1, dur: 3, power: 0.2 },
      projectile: { sprite: "p_fire", speed: 230, gravity: 560, life: 3, radius: 5, aoe: 34 },
    },
    {
      id: "banner",
      name: "군기병",
      ai: "support",
      hp: 52,
      atk: 12,
      def: 10,
      speed: 50,
      sight: 260,
      range: 180,
      cooldown: 3,
      windup: 0.6,
      recovery: 0.5,
      w: 14,
      h: 24,
      gold: 13,
    },
    {
      id: "tentacle",
      name: "심연 촉수",
      ai: "ambush",
      hp: 62,
      atk: 18,
      def: 10,
      speed: 0,
      sight: 110,
      range: 56,
      cooldown: 1.8,
      windup: 0.55,
      recovery: 0.6,
      w: 14,
      h: 34,
      gold: 13,
      element: "dark",
      heavy: 1,
    },
    {
      id: "voideye",
      name: "공허 관찰자",
      ai: "ranged",
      hp: 46,
      atk: 16,
      def: 4,
      speed: 70,
      sight: 300,
      range: 250,
      cooldown: 2.1,
      windup: 0.6,
      recovery: 0.4,
      w: 18,
      h: 18,
      gold: 13,
      flying: !0,
      element: "dark",
      projectile: { sprite: "p_void", speed: 200, life: 3, radius: 6, homing: 1.4 },
    },
    {
      id: "stalker",
      name: "그림자 추적자",
      ai: "blinker",
      hp: 52,
      atk: 19,
      def: 6,
      speed: 100,
      sight: 280,
      range: 30,
      cooldown: 2.2,
      windup: 0.45,
      recovery: 0.4,
      w: 14,
      h: 22,
      gold: 14,
      element: "dark",
    },
    {
      id: "caller",
      name: "영혼 소환사",
      ai: "summoner",
      hp: 58,
      atk: 12,
      def: 6,
      speed: 40,
      sight: 260,
      range: 220,
      cooldown: 4.2,
      windup: 0.8,
      recovery: 0.6,
      w: 14,
      h: 24,
      gold: 15,
      flying: !0,
      summon: "soul",
      element: "dark",
    },
    {
      id: "soul",
      name: "길 잃은 영혼",
      ai: "flyer",
      hp: 14,
      atk: 11,
      def: 0,
      speed: 125,
      sight: 400,
      range: 90,
      cooldown: 1.6,
      windup: 0.4,
      recovery: 0.5,
      w: 10,
      h: 10,
      gold: 1,
      flying: !0,
      element: "dark",
    },
    {
      id: "sentinel",
      name: "수정 파수꾼",
      ai: "turret",
      hp: 72,
      atk: 18,
      def: 20,
      speed: 0,
      sight: 320,
      range: 320,
      cooldown: 2.6,
      windup: 0.8,
      recovery: 0.4,
      w: 16,
      h: 28,
      gold: 15,
      heavy: 1,
      element: "arcane",
      projectile: { sprite: "p_arcane", speed: 330, life: 2, radius: 5 },
      projCount: 3,
    },
    {
      id: "phantom",
      name: "유령 기사",
      ai: "blinker",
      hp: 92,
      atk: 21,
      def: 22,
      speed: 70,
      sight: 260,
      range: 36,
      cooldown: 2,
      windup: 0.55,
      recovery: 0.5,
      w: 16,
      h: 26,
      gold: 17,
      heavy: 0.6,
      element: "arcane",
    },
    {
      id: "orb",
      name: "비전 구체",
      ai: "aoe",
      hp: 52,
      atk: 17,
      def: 8,
      speed: 60,
      sight: 240,
      range: 60,
      cooldown: 2.8,
      windup: 0.9,
      recovery: 0.6,
      w: 18,
      h: 18,
      gold: 15,
      flying: !0,
      element: "arcane",
    },
    {
      id: "gargoyle",
      name: "석상 가고일",
      ai: "ambush",
      hp: 78,
      atk: 20,
      def: 16,
      speed: 130,
      sight: 150,
      range: 120,
      cooldown: 2,
      windup: 0.5,
      recovery: 0.6,
      w: 20,
      h: 20,
      gold: 17,
      heavy: 0.5,
    },
    {
      id: "golden",
      name: "황금 고블린",
      ai: "golden",
      hp: 60,
      atk: 0,
      def: 5,
      speed: 128,
      sight: 260,
      range: 0,
      cooldown: 99,
      windup: 0,
      recovery: 0,
      w: 13,
      h: 17,
      gold: 0,
    },
  ],
  se = Object.fromEntries(Os.map((A) => [A.id, A])),
  yi = {
    frenzy: { name: "광폭화", color: 16728128 },
    regen: { name: "재생", color: 6348896 },
    blink: { name: "순간 이동", color: 11559167 },
    flame: { name: "화염", color: 16748576 },
    summon: { name: "소환", color: 4247744 },
    swift: { name: "돌진", color: 16769088 },
    armored: { name: "강철", color: 10531016 },
  },
  Ye = Object.keys(yi),
  Mi = [
    {
      id: "golem",
      name: "폐허의 수호자",
      title: "버려진 초원의 주인",
      hp: 600,
      atk: 14,
      def: 10,
      gold: 180,
      w: 40,
      h: 50,
      element: "phys",
      color: 10129520,
      patterns: ["slam", "charge", "rockThrow", "quake"],
    },
    {
      id: "rotlord",
      name: "썩어가는 숲의 군주",
      title: "어둠의 숲의 주인",
      hp: 900,
      atk: 16,
      def: 8,
      gold: 330,
      w: 44,
      h: 54,
      element: "poison",
      color: 5929530,
      patterns: ["poisonVolley", "vineEruption", "summonSpores", "sporeCloud"],
    },
    {
      id: "devourer",
      name: "심연의 포식자",
      title: "지하 동굴의 주인",
      hp: 1200,
      atk: 19,
      def: 12,
      gold: 520,
      w: 36,
      h: 60,
      element: "phys",
      color: 9067114,
      patterns: ["burrowAmbush", "lunge", "rockSpit", "tailSweep"],
    },
    {
      id: "executioner",
      name: "모래의 집행자",
      title: "황폐한 사막의 주인",
      hp: 1500,
      atk: 22,
      def: 14,
      gold: 760,
      w: 34,
      h: 52,
      element: "phys",
      color: 12619856,
      patterns: ["bladeSweep", "leapCleave", "sandstorm", "tornado"],
    },
    {
      id: "frostknight",
      name: "빙결의 기사",
      title: "얼어붙은 설원의 주인",
      hp: 1800,
      atk: 25,
      def: 18,
      gold: 1e3,
      w: 26,
      h: 44,
      element: "ice",
      color: 8437984,
      patterns: ["frostSlash", "iceSpears", "dashThrust", "iceWall"],
    },
    {
      id: "warlord",
      name: "철혈 장군 바르크",
      title: "붉은 요새의 주인",
      hp: 2200,
      atk: 28,
      def: 22,
      gold: 1400,
      w: 32,
      h: 48,
      element: "fire",
      color: 11549226,
      patterns: ["mortar", "shieldCharge", "callSoldiers", "flameSweep"],
    },
    {
      id: "matriarch",
      name: "공허의 눈",
      title: "심연 지대의 주인",
      hp: 2600,
      atk: 30,
      def: 16,
      gold: 1900,
      w: 48,
      h: 48,
      flying: !0,
      element: "dark",
      color: 6957722,
      patterns: ["laserSweep", "voidOrbs", "teleport", "tentacles"],
    },
    {
      id: "king",
      name: "망각의 왕",
      title: "잊힌 왕국의 주인",
      hp: 3e3,
      atk: 32,
      def: 20,
      gold: 2600,
      w: 30,
      h: 50,
      element: "arcane",
      color: 5271760,
      patterns: ["arcaneBarrage", "phantomSwords", "teleportSlam", "summonKnights"],
    },
    {
      id: "warden",
      name: "경계의 파수자",
      title: "끝없는 경계의 수문장",
      hp: 3400,
      atk: 34,
      def: 22,
      gold: 3500,
      w: 40,
      h: 56,
      element: "dark",
      color: 4247744,
      patterns: ["riftBeam", "voidOrbs", "iceSpears", "slam", "phantomSwords"],
    },
  ],
  ji = Object.fromEntries(Mi.map((A) => [A.id, A]));
frRegisterWorld();
function frRegisterWorld() {
  const sc = (v, f) => Math.max(0, Math.round(v * f));
  for (const m of [...FR_MONSTERS, ...FR_ELITES]) {
    const t = se[m.tpl],
      sp = se[m.sprite],
      ri = m.region,
      af = 0.55 + ri * 0.06,
      d = {
        ...t,
        id: m.id,
        name: m.name,
        sprite: m.sprite,
        tint: m.tint,
        amt: m.amt,
        hp: m.hp,
        atk: Math.max(4, Math.round(t.atk * af)),
        def: sc(t.def, 0.5 + ri * 0.05),
        gold: Math.max(2, Math.round(t.gold * (0.6 + ri * 0.08))),
        w: sp.w,
        h: sp.h,
        flying: t.flying,
        weak: m.weak,
        resist: m.resist,
        region: ri,
        frElite: !!m.scale,
        frScale: m.scale ?? 1,
        frType: m.type,
        frDrop: m.drop,
      };
    FG.foeDef(d);
    (Os.push(d), (se[d.id] = d));
  }
  for (const b of FR_BOSSES) {
    const t = ji[b.base],
      ri = b.region,
      d = {
        ...t,
        id: b.id,
        name: b.name,
        title: b.title,
        hp: b.hp,
        atk: Math.round(12 + ri * 2.2),
        def: Math.round(8 + ri * 1.3),
        gold: Math.round(200 + ri * 320),
        element: b.element,
        patterns: b.patterns,
        sprite: b.base,
        tint: b.tint,
        amt: b.amt,
        weak: b.weak,
        resist: b.resist,
        relic: b.relic,
        quote: b.quote,
        region: ri,
      };
    FG.foeDef(d);
    (Mi.push(d), (ji[d.id] = d));
  }
}
function frTint(frames, tint, amt) {
  if (tint == null || !amt) return;
  const tr = (tint >> 16) & 255,
    tg = (tint >> 8) & 255,
    tb = tint & 255;
  for (const f of frames) {
    const b = f.buf;
    for (let i = 0; i < b.length; i++) {
      const p = b[i],
        a = p >>> 24;
      if (!a) continue;
      const r = p & 255,
        g = (p >> 8) & 255,
        bl = (p >> 16) & 255,
        L = (r * 0.3 + g * 0.59 + bl * 0.11) / 255;
      if (L < 0.12) continue;
      const k = Math.min(1.2, 0.25 + L * 1.15),
        nr = Math.min(255, r * (1 - amt) + tr * k * amt),
        ng = Math.min(255, g * (1 - amt) + tg * k * amt),
        nb = Math.min(255, bl * (1 - amt) + tb * k * amt);
      b[i] = ((a << 24) | (Math.round(nb) << 16) | (Math.round(ng) << 8) | Math.round(nr)) >>> 0;
    }
  }
}
function Ge(A, S) {
  let T = (A ^ 2654435769) >>> 0;
  return (
    (T = Math.imul(T ^ (S + 2135587861), 2246822507) >>> 0),
    (T ^= T >>> 13),
    (T = Math.imul(T, 3266489909) >>> 0),
    (T ^= T >>> 16),
    T >>> 0
  );
}
function wn(A, S, T) {
  return Ge(Ge(A, S), T);
}
class Ze {
  constructor(S) {
    Z(this, "s");
    this.s = S >>> 0 || 1;
  }
  next() {
    let S = (this.s = (this.s + 1831565813) >>> 0);
    return (
      (S = Math.imul(S ^ (S >>> 15), S | 1)),
      (S ^= S + Math.imul(S ^ (S >>> 7), S | 61)),
      ((S ^ (S >>> 14)) >>> 0) / 4294967296
    );
  }
  range(S, T) {
    return S + (T - S) * this.next();
  }
  int(S, T) {
    return Math.floor(S + (T - S + 1) * this.next());
  }
  chance(S) {
    return this.next() < S;
  }
  pick(S) {
    return S[Math.floor(this.next() * S.length)];
  }
  weighted(S, T) {
    let C = 0;
    for (const R of S) C += Math.max(0, T(R));
    let E = this.next() * C;
    for (const R of S) if (((E -= Math.max(0, T(R))), E <= 0)) return R;
    return S[S.length - 1];
  }
  shuffle(S) {
    for (let T = S.length - 1; T > 0; T--) {
      const C = Math.floor(this.next() * (T + 1));
      [S[T], S[C]] = [S[C], S[T]];
    }
    return S;
  }
}
const Mn = [0, 2, 3, 5, 7, 8, 10],
  Ht = FR_WORLD,
  Ii = FR_ENDLESS,
  si = ENDLESS_START,
  Pi = ENDLESS_LEN,
  ls = new Map();
function Fe(A, S, T) {
  const C = ((A >> 16) & 255) * (1 - T) + ((S >> 16) & 255) * T,
    E = ((A >> 8) & 255) * (1 - T) + ((S >> 8) & 255) * T,
    R = (A & 255) * (1 - T) + (S & 255) * T;
  return (Math.round(C) << 16) | (Math.round(E) << 8) | Math.round(R);
}
function Ds(A) {
  const S = ls.get(A);
  if (S) return S;
  const T = new Ze(Ge(3783073365, A)),
    C = Ii[(A + Math.floor(A / Ii.length) * 3) % Ii.length],
    E = Ht.find((v) => v.id === C.theme),
    R = [];
  for (const v of C.mix) {
    const o = Ht.find((n) => n.id === v);
    for (const n of o.enemies) T.chance(0.75) && R.push({ id: n.id, w: n.w });
  }
  R.length < 4 && R.push(...Ht.find((v) => v.id === C.mix[0]).enemies);
  const h = { ...E.pal };
  if (C.tint !== void 0) {
    const v = C.tint;
    ((h.sky = [Fe(h.sky[0], v, 0.35), Fe(h.sky[1], v, 0.3)]),
      (h.far = Fe(h.far, v, 0.3)),
      (h.mid = Fe(h.mid, v, 0.3)),
      (h.near = Fe(h.near, v, 0.25)),
      (h.top = Fe(h.top, v, 0.3)),
      (h.topHi = Fe(h.topHi, v, 0.25)),
      (h.accent = v),
      (h.fog = v));
  }
  const m = {};
  for (const v of C.mix) {
    const o = Ht.find((n) => n.id === v);
    for (const [n, i] of Object.entries(o.patterns)) m[n] = (m[n] ?? 0) + i;
  }
  const t = si + A * Pi,
    a = {
      id: `endless_${A}`,
      name: C.name,
      sub: `변이의 길 · ${A + 1}구간`,
      start: t,
      end: t + Pi,
      boss: `frb${(A * 5 + 3) % 12}`,
      enemies: R,
      hazards: C.hazards,
      density: 1.7 + Math.min(0.6, A * 0.05),
      eliteChance: 0.12 + Math.min(0.15, A * 0.01),
      ceiling: E.ceiling,
      particle: C.particle,
      bg: E.bg,
      patterns: m,
      music: { root: 53 + (A % 5), scale: [0, 2, 4, 6, 8, 10], tempo: 118 + (A % 4) * 4, wave: "square", mood: 8 },
      pal: h,
      theme: E.theme ?? E.id,
      bgId: E.id,
      idx: 12 + A,
    };
  return (ls.set(A, a), a);
}
function qi(A) {
  if (A >= si) return Ds(Math.floor((A - si) / Pi));
  for (const S of Ht) if (A < S.end) return S;
  return Ht[Ht.length - 1];
}
function bs(A) {
  if (A >= si) return Ht.length + Math.floor((A - si) / Pi);
  for (let S = 0; S < Ht.length; S++) if (A < Ht[S].end) return S;
  return Ht.length - 1;
}
function je(A) {
  return A < Ht.length ? Ht[Math.max(0, A)] : FG.zoned ? Ht[Ht.length - 1] : Ds(A - Ht.length);
}
const Bs = (A) => A.theme ?? A.id,
  us = (A) => Object.values(A).reduce((S, T) => S + T, 0),
  Pn = () => [...new Set(Ht.map((A) => A.boss).filter(Boolean))],
  We = [
    { id: "first_run", name: "첫 탐험", desc: "탐험을 1회 마친다", gold: 50, check: (A) => A.runs >= 1 },
    { id: "runs_10", name: "단골 방랑자", desc: "탐험을 10회 마친다", gold: 400, check: (A) => A.runs >= 10 },
    { id: "runs_50", name: "불굴의 개척자", desc: "탐험을 50회 마친다", gold: 3e3, check: (A) => A.runs >= 50 },
    {
      id: "kills_100",
      name: "사냥 입문",
      desc: "몬스터를 누적 100마리 처치한다",
      gold: 150,
      check: (A) => A.kills >= 100,
    },
    {
      id: "kills_1000",
      name: "노련한 사냥꾼",
      desc: "몬스터를 누적 1,000마리 처치한다",
      gold: 1500,
      check: (A) => A.kills >= 1e3,
    },
    {
      id: "kills_5000",
      name: "전장의 전설",
      desc: "몬스터를 누적 5,000마리 처치한다",
      gold: 8e3,
      check: (A) => A.kills >= 5e3,
    },
    {
      id: "elite_50",
      name: "엘리트 사냥꾼",
      desc: "엘리트를 누적 50마리 처치한다",
      gold: 1200,
      check: (A) => A.eliteKills >= 50,
    },
    {
      id: "boss_first",
      name: "거인 살해자",
      desc: "보스를 처음으로 처치한다",
      gold: 300,
      check: (A) => us(A.bossKills) >= 1,
    },
    {
      id: "boss_all",
      name: "모든 경계의 정복자",
      desc: "9개 지역의 보스를 모두 한 번 이상 처치한다",
      gold: 12e3,
      check: (A) => Pn().every((S) => (A.bossKills[S] ?? 0) > 0),
    },
    {
      id: "run_kills_100",
      name: "학살자",
      desc: "한 번의 탐험에서 100마리를 처치한다",
      gold: 800,
      check: (A, S) => !!S && S.kills >= 100,
    },
    {
      id: "run_boss_3",
      name: "연전연승",
      desc: "한 번의 탐험에서 보스 3마리를 처치한다",
      gold: 2500,
      check: (A, S) => !!S && S.bosses >= 3,
    },
    {
      id: "clean_500",
      name: "스치지도 못했다",
      desc: "피해를 한 번도 입지 않고 500m에 도달한다",
      gold: 600,
      check: (A, S) => !!S && Is(S) >= 500,
    },
    {
      id: "big_hit",
      name: "일격필살",
      desc: "한 번의 공격으로 1,000 이상의 피해를 준다",
      gold: 1e3,
      check: (A, S) => !!S && (S.maxHit ?? 0) >= 1e3,
    },
    {
      id: "gold_10k",
      name: "두둑한 주머니",
      desc: "누적 골드 10,000을 획득한다",
      gold: 500,
      check: (A) => A.totalGold >= 1e4,
    },
    {
      id: "gold_100k",
      name: "경계의 부호",
      desc: "누적 골드 100,000을 획득한다",
      gold: 5e3,
      check: (A) => A.totalGold >= 1e5,
    },
    {
      id: "arsenal",
      name: "무기 수집가",
      desc: "무기 10종을 모두 보유한다",
      gold: 3e3,
      check: (A) => ce.every((S) => S.id in A.weapons),
    },
    {
      id: "wardrobe5",
      name: "옷장 정리",
      desc: "갑옷을 5종 이상 보유한다",
      gold: 800,
      check: (A) => le.filter((S) => S.id in A.armors).length >= 5,
    },
    {
      id: "smith10",
      name: "명장의 손길",
      desc: "무기 하나를 +10까지 강화한다",
      gold: 2e3,
      check: (A) => Object.values(A.weapons).some((S) => S >= 10),
    },
    {
      id: "skill5",
      name: "마법의 깨달음",
      desc: "스킬 하나를 Lv5까지 강화한다",
      gold: 800,
      check: (A) => Object.values(A.skills).some((S) => S >= 5),
    },
    {
      id: "train100",
      name: "단련의 끝",
      desc: "훈련소 능력치 합계 Lv100을 달성한다",
      gold: 4e3,
      check: (A) => us(A.training) >= 100,
    },
  ],
  zi = Object.fromEntries(We.map((A) => [A.id, A]));
function Is(A) {
  const S = A.cleanDist ?? -1;
  return S >= 0 ? S : A.distance;
}
const Gs = 4,
  An = "forgeroad_save_legacy",
  fi = "forgeroad_save",
  fs = "forgeroad_save_backup";
function Ve() {
  return {
    version: Gs,
    gold: 0,
    best: 0,
    totalGold: 0,
    runs: 0,
    playTime: 0,
    kills: 0,
    eliteKills: 0,
    bossKills: {},
    training: {},
    weapons: { sword: 0 },
    armors: { cloth: 0 },
    skills: { shockwave: 1 },
    skillSlots: 2,
    equip: { weapons: ["sword", null], armor: "cloth", skills: ["shockwave", null, null, null] },
    presets: [null, null, null],
    claimed: [],
    unlocks: [],
    titles: [],
    activeTitle: null,
    activeRun: null,
    lastSettledRun: null,
    pendingResult: null,
    recentRuns: [],
    settings: { music: 0.5, sfx: 0.7, shake: !0, damageNumbers: !0, autoPause: !0, enemyHpBars: !0 },
    tutorialDone: !1,
    achievements: [],
    fr: FG.saveDefaults(),
  };
}
function ds(A) {
  const S = Ve();
  if (!A || typeof A != "object") return S;
  const T = typeof A.version == "number" ? A.version : 1;
  if (T < 4) {
    try {
      localStorage.setItem(An, JSON.stringify(A));
    } catch {}
    return S;
  }
  if (T < 2 && Array.isArray(A.skills)) {
    const E = {};
    for (const R of A.skills) E[R] = 1;
    A.skills = E;
  }
  const C = { ...S };
  for (const E of Object.keys(S)) {
    if (A[E] === void 0 || A[E] === null) continue;
    const R = S[E],
      h = A[E];
    (typeof R == "number" && typeof h == "number" && isFinite(h)) ||
    (typeof R == "boolean" && typeof h == "boolean") ||
    (Array.isArray(R) && Array.isArray(h))
      ? (C[E] = h)
      : R && typeof R == "object" && typeof h == "object" && !Array.isArray(h)
        ? (C[E] = { ...R, ...h })
        : (R === null || (typeof R == "string" && typeof h == "string")) && (C[E] = h);
  }
  for (
    C.version = Gs,
      !C.weapons.sword && C.weapons.sword !== 0 && (C.weapons.sword = 0),
      C.armors.cloth === void 0 && (C.armors.cloth = 0),
      C.skills.shockwave === void 0 && (C.skills.shockwave = 1),
      (!Array.isArray(C.equip.weapons) || C.equip.weapons.length !== 2) && (C.equip.weapons = ["sword", null]),
      (C.equip.weapons[0] in C.weapons) || (C.equip.weapons[0] = "sword"),
      C.equip.weapons[1] && !(C.equip.weapons[1] in C.weapons) && (C.equip.weapons[1] = null),
      (C.equip.armor in C.armors) || (C.equip.armor = "cloth"),
      Array.isArray(C.equip.skills) || (C.equip.skills = ["shockwave", null, null, null]);
    C.equip.skills.length < 4;
  )
    C.equip.skills.push(null);
  return (
    (C.equip.skills = C.equip.skills.map((E) => (E && E in C.skills ? E : null))),
    (C.gold = Math.max(0, Math.floor(C.gold))),
    (C.achievements = C.achievements.filter((E) => typeof E == "string")),
    C
  );
}
class Rn {
  constructor() {
    Z(this, "data", Ve());
    Z(this, "dirty", !1);
    Z(this, "lastWrite", 0);
    Z(this, "loadError", null);
    Z(this, "lastBackup", 0);
  }
  load() {
    try {
      const S = localStorage.getItem(fi);
      S ? (this.data = ds(JSON.parse(S))) : (this.data = Ve());
    } catch {
      this.loadError = "저장 데이터를 읽을 수 없어 백업에서 복구했습니다.";
      try {
        const T = localStorage.getItem(fi);
        T && localStorage.setItem(fi + "_corrupt_" + Date.now(), T);
        const C = localStorage.getItem(fs);
        this.data = C ? ds(JSON.parse(C)) : Ve();
      } catch {
        this.data = Ve();
      }
    }
    return this.data;
  }
  touch() {
    this.dirty = !0;
  }
  tick(S) {
    this.dirty && S - this.lastWrite > 1e3 && this.write();
  }
  write() {
    try {
      const S = JSON.stringify(this.data);
      (localStorage.setItem(fi, S),
        Date.now() - this.lastBackup > 3e4 && (localStorage.setItem(fs, S), (this.lastBackup = Date.now())),
        (this.dirty = !1),
        (this.lastWrite = performance.now()));
    } catch (S) {
      console.warn("save failed", S);
    }
  }
  spend(S) {
    return S < 0 || this.data.gold < S ? !1 : ((this.data.gold -= S), this.write(), !0);
  }
  hasUnlock(S) {
    return !S || this.data.unlocks.includes(S);
  }
  beginRun() {
    const S = {
      id: `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`,
      startedAt: Date.now(),
      gold: 0,
      milestoneGold: 0,
      distance: 0,
      kills: 0,
      elites: 0,
      bosses: 0,
      bossIds: [],
      time: 0,
      prevBest: this.data.best,
      dmgDealt: 0,
      dmgTaken: 0,
      maxHit: 0,
      cleanDist: -1,
    };
    return ((this.data.activeRun = { ...S }), (this.data.pendingResult = null), this.write(), S);
  }
  checkpoint(S) {
    !this.data.activeRun ||
      this.data.activeRun.id !== S.id ||
      ((this.data.activeRun = { ...S, bossIds: [...S.bossIds] }), this.touch());
  }
  claimMilestone(S, T, C, E = [], R) {
    if (this.data.claimed.includes(T)) return !1;
    this.data.claimed.push(T);
    for (const h of E) this.data.unlocks.includes(h) || this.data.unlocks.push(h);
    return (
      R && !this.data.titles.includes(R) && (this.data.titles.push(R), (this.data.activeTitle = R)),
      (S.milestoneGold += C),
      (S.msDists = [...(S.msDists ?? []), T]),
      (this.data.activeRun = { ...S, bossIds: [...S.bossIds] }),
      this.write(),
      !0
    );
  }
  settle(S, T = !1) {
    if (this.data.lastSettledRun === S.id) return this.data.pendingResult;
    const C = this.data,
      // 포지로드: 살아서 귀환해야 골드를 가져온다. 쓰러지면 이번 탐험의 골드·거리 보상 모두 잃음
      E = T ? Math.floor(S.gold + S.milestoneGold) : 0,
      R = !FG.zoned && S.distance > S.prevBest;
    T || (C.claimed = C.claimed.filter((d) => !(S.msDists ?? []).includes(d)));
    ((C.gold += E),
      (C.totalGold += E),
      (C.best = Math.max(C.best, Math.floor(S.distance))),
      (C.runs += 1),
      (C.playTime += S.time),
      (C.kills += S.kills),
      (C.eliteKills += S.elites));
    for (const t of S.bossIds) C.bossKills[t] = (C.bossKills[t] ?? 0) + 1;
    // 도감: 종류별 처치 수
    C.codex = C.codex ?? {};
    for (const [t, n] of Object.entries(S.codex ?? {})) C.codex[t] = (C.codex[t] ?? 0) + n;
    (C.recentRuns.unshift({ dist: Math.floor(S.distance), gold: E, at: Date.now() }),
      (C.recentRuns = C.recentRuns.slice(0, 8)));
    const h = this.grantAchievements(S),
      m = {
        ...S,
        total: E,
        newRecord: R,
        abandoned: T,
        claimedNow: [],
        achievementsNow: h.ids,
        achievementGold: h.gold,
      };
    return ((C.activeRun = null), (C.lastSettledRun = S.id), (C.pendingResult = m), this.write(), m);
  }
  grantAchievements(S) {
    const T = this.data,
      C = [];
    let E = 0;
    for (const R of We) {
      if (T.achievements.includes(R.id)) continue;
      let h = !1;
      try {
        h = R.check(T, S);
      } catch {
        h = !1;
      }
      h && (T.achievements.push(R.id), C.push(R.id), (E += R.gold));
    }
    return (E > 0 && ((T.gold += E), (T.totalGold += E)), C.length && !S && this.write(), { ids: C, gold: E });
  }
  recoverInterruptedRun() {
    const S = this.data.activeRun;
    return S ? this.settle(S, !1) : null;
  }
  reset() {
    ((this.data = Ve()), this.write());
  }
}
const it = new Rn();
class Ln extends zt.Scene {
  constructor() {
    super("Boot");
  }
  async create() {
    var C;
    const S = performance.now();
    try {
      await Promise.all([ei, ii, Di, Ms].map((E) => document.fonts.load(`12px ${E}`, "가나다ABC123")));
    } catch {}
    (it.load(),
      un(this),
      dn(this),
      vn(this),
      mn(this),
      FG.bootTextures(this),
      xn(this),
      yn(this),
      Tn(this),
      En(this),
      FG.bootLate(this),
      this.makeVignette(),
      this.makeAnims(),
      console.info(`[boot] assets generated in ${(performance.now() - S).toFixed(0)}ms`),
      (C = document.getElementById("loading")) == null || C.remove());
    const T = it.recoverInterruptedRun();
    this.scene.start("Title", { recovered: T });
  }
  makeVignette() {
    const S = document.createElement("canvas");
    ((S.width = ot), (S.height = xt));
    const T = S.getContext("2d"),
      C = T.createRadialGradient(ot / 2, xt / 2, xt * 0.35, ot / 2, xt / 2, ot * 0.62);
    (C.addColorStop(0, "rgba(0,0,0,0)"),
      C.addColorStop(1, "rgba(0,0,0,0.85)"),
      (T.fillStyle = C),
      T.fillRect(0, 0, ot, xt),
      this.textures.exists("vignette") && this.textures.remove("vignette"),
      this.textures.addCanvas("vignette", S));
  }
  makeAnims() {
    const S = this.anims,
      T = (R, h, m, t, a = -1) => {
        (S.exists(R) && S.remove(R),
          S.create({ key: R, frames: m.map((v) => ({ key: h, frame: v })), frameRate: t, repeat: a }));
      };
    for (const R of le) {
      const h = `player_${R.id}`;
      (T(`pl_${R.id}_idle`, h, pe.idle, 5),
        T(`pl_${R.id}_run`, h, pe.run, 12),
        T(`pl_${R.id}_jump`, h, pe.jump, 1),
        T(`pl_${R.id}_fall`, h, pe.fall, 1),
        T(`pl_${R.id}_dash`, h, pe.dash, 1),
        T(`pl_${R.id}_hurt`, h, pe.hurt, 1),
        T(`pl_${R.id}_cast`, h, pe.cast, 8),
        T(`pl_${R.id}_interact`, h, pe.interact, 1),
        T(`pl_${R.id}_death`, h, pe.death, 5, 0));
    }
    for (const R of Os)
      (T(`e_${R.id}_idle`, `e_${R.id}`, [0, 1], 3), T(`e_${R.id}_move`, `e_${R.id}`, [2, 3, 4, 5], 8));
    for (const R of Mi) (T(`b_${R.id}_idle`, `b_${R.id}`, [0, 1], 3), T(`b_${R.id}_move`, `b_${R.id}`, [2, 3], 5));
    const C = [
      ["fx_slash", 4, 28],
      ["fx_heavy", 4, 22],
      ["fx_twin", 4, 30],
      ["fx_spin", 4, 24],
      ["fx_thrust", 4, 26],
      ["fx_punch", 4, 30],
      ["fx_smash", 5, 20],
      ["flame", 4, 14],
      ["explode", 7, 20],
      ["hitspark", 4, 30],
      ["ring", 6, 24],
      ["iceburst", 5, 16],
      ["rockspike", 4, 14],
      ["icespike", 4, 14],
      ["vine", 4, 12],
      ["tentacle_up", 4, 12],
    ];
    for (const [R, h, m] of C)
      T(
        R,
        R,
        Array.from({ length: h }, (t, a) => a),
        m,
        0,
      );
    const E = [
      ["flame_anim", "flame", 4, 12],
      ["coin_spin", "coin", 6, 12],
      ["coinbig_spin", "coinbig", 6, 10],
      ["p_orb_anim", "p_orb", 4, 14],
      ["p_void_anim", "p_void", 4, 10],
      ["p_arcane_anim", "p_arcane", 4, 12],
      ["shockwave_anim", "shockwave", 4, 14],
      ["pool_poison_anim", "pool_poison", 4, 4],
      ["pool_void_anim", "pool_void", 4, 4],
      ["altar_anim", "altar", 4, 4],
      ["shrine_deal_anim", "shrine_deal", 4, 4],
      ["spring_anim", "spring", 4, 4],
      ["riftgate_anim", "riftgate", 4, 6],
      ["hub_torch_anim", "hub_torch", 4, 8],
      ["portalfx_anim", "portalfx", 4, 8],
    ];
    for (const [R, h, m, t] of E)
      T(
        R,
        h,
        Array.from({ length: m }, (a, v) => v),
        t,
      );
    for (const R of ["npc_smith", "npc_armorer", "npc_trainer", "npc_mage", "npc_quarter", "npc_scribe"])
      T(`${R}_idle`, R, [0, 1, 2, 3], 4);
  }
}
const Tt = 640,
  qt = 360;
function Jt(A, S, T) {
  const C = new Ze(A),
    E = T.map(() => C.range(0, Math.PI * 2));
  return (R) => {
    let h = S;
    return (
      T.forEach((m, t) => {
        h += m * Math.sin((2 * Math.PI * (t + 1) * R) / Tt + E[t]);
      }),
      h
    );
  };
}
function jt(A, S, T, C) {
  for (let E = 0; E < Tt; E++) {
    const R = Math.round(S(E));
    (A.rect(E, R, 1, qt - R, T), C !== void 0 && A.px(E, R, C));
  }
}
function It(A, S, T = 80) {
  (A(S), S < T && A(S + Tt), S > Tt - T && A(S - Tt));
}
function Fn(A, S) {
  if (S.pal?.sky) return void BGN.paintSky3d(A, S.pal, Tt, qt);
  const [T, C] = S.pal.sky;
  for (let E = 0; E < qt; E++) {
    const R = Math.min(1, E / (qt * 0.85)),
      h = Ke(T, C, R);
    A.rect(0, E, Tt, 1, h);
  }
}
function di(A, S, T, C, E, R) {
  if (R === "pine") {
    A.rect(S - 1, T - C * 0.25, 3, C * 0.25, st(E, -0.2));
    for (let h = 0; h < 4; h++) {
      const m = C * 0.32 * (1 - h * 0.2),
        t = T - C * 0.2 - h * C * 0.2;
      A.poly(
        [
          [S - m, t],
          [S, t - C * 0.32],
          [S + m, t],
        ],
        E,
      );
    }
  } else
    R === "dead"
      ? (A.thickLine(S, T, S, T - C, 3, E),
        A.thickLine(S, T - C * 0.6, S - C * 0.3, T - C * 0.85, 2, E),
        A.thickLine(S, T - C * 0.7, S + C * 0.25, T - C, 2, E))
      : (A.rect(S - 2, T - C * 0.5, 4, C * 0.5, st(E, -0.25)),
        A.circle(S, T - C * 0.65, C * 0.32, E),
        A.circle(S - C * 0.2, T - C * 0.5, C * 0.22, E),
        A.circle(S + C * 0.22, T - C * 0.52, C * 0.24, E));
}
const BGX = 240, BGUP = 110;
function On(A, S) {
  const T = new ht(Tt, qt),
    C = Bs(A),
    E = A.pal,
    R = Ge(C.length * 977 + S, A.id.length + S * 31),
    h = new Ze(R),
    m = S === 0 ? E.far : S === 1 ? E.mid : E.near,
    t = st(m, 0.15);
  const pid = A.zbg ?? A.look ?? A.bgId ?? A.id;
  if (PAINT.paintable(pid) || PAINT.paintable(A.src)) {
    const T2 = new ht(Tt, qt + BGX);
    return (BGN.paintLayer3d(T2, S, E, h, BGN.THEME[pid] ? pid : BGN.THEME[A.src] ? A.src : pid), T2);
  }
  const frb = FRBG[A.bgId ?? A.id];
  if (frb) return (frb(T, S, m, t, E, h, R, { Jt, jt, It, di, st, Ke }), T);
  switch (C) {
    case "plains": {
      if (S === 0) {
        jt(T, Jt(R, 210, [18, 26, 10, 6]), m, t);
        for (let a = 0; a < Tt; a++) {
          const v = Jt(R, 210, [18, 26, 10, 6])(a);
          v < 196 && T.px(a, Math.round(v), 15792383);
        }
        for (let a = 0; a < 5; a++) {
          const v = h.int(0, Tt),
            o = h.int(40, 120);
          It((n) => {
            (T.ellipse(n, o, 26, 7, 16777215, 200), T.ellipse(n + 14, o - 5, 16, 7, 16777215, 220));
          }, v);
        }
      } else if (S === 1) {
        const a = Jt(R, 260, [12, 8, 5]);
        jt(T, a, m, t);
        for (let v = 0; v < 4; v++) {
          const o = h.int(0, Tt),
            n = h.int(0, 2);
          It((i) => {
            const e = a(o) - 2,
              r = st(m, -0.15);
            (T.rect(i, e - 34, 7, 34, r),
              T.rect(i - 1, e - 36, 9, 3, r),
              T.rect(i + 30, e - 22 + n * 4, 7, 22 - n * 4, r));
            for (let l = 0; l <= 12; l++) {
              const s = l / 12;
              if (s > 0.55 + n * 0.15) break;
              T.rect(i + 3 + s * 30, e - 34 - Math.sin(s * Math.PI) * 12, 4, 4, r);
            }
            (T.rect(i + 12, e - 4, 6, 4, r), T.rect(i + 40, e - 3, 4, 3, r));
          }, o);
        }
      } else {
        const a = Jt(R, 300, [10, 6, 4]);
        jt(T, a, m, t);
        for (let v = 0; v < 9; v++) {
          const o = h.int(0, Tt);
          It((n) => di(T, n, a(o) + 2, h.int(26, 40), st(m, -0.1), "round"), o);
        }
      }
      break;
    }
    case "forest": {
      if (S === 0) {
        for (let a = 0; a < 26; a++) {
          const v = h.int(0, Tt);
          It((o) => di(T, o, 300, h.int(110, 170), m, "pine"), v);
        }
        for (let a = 0; a < 6; a++) {
          const v = h.int(0, Tt);
          for (let o = 0; o < 260; o += 2) T.px(v + o * 0.3, o, E.fog, 25);
        }
      } else if (S === 1) {
        for (let a = 0; a < 12; a++) {
          const v = h.int(0, Tt),
            o = h.int(8, 14);
          It((n) => {
            (T.rect(n, 0, o, qt, m), T.rect(n, 0, 2, qt, t));
          }, v);
        }
        jt(T, Jt(R, 290, [8, 6]), m);
      } else {
        for (let a = 0; a < 5; a++) {
          const v = h.int(0, Tt),
            o = h.int(18, 28);
          It((n) => {
            (T.rect(n, 0, o, qt, m), T.rect(n + o - 2, 0, 2, qt, t), T.ellipse(n + o / 2, 330, o, 8, m));
          }, v);
        }
        for (let a = 0; a < 14; a++) {
          const v = h.int(0, Tt),
            o = h.int(30, 110);
          It((n) => {
            for (let i = 0; i < o; i++) T.px(n + Math.sin(i * 0.15) * 2, i, st(E.top, -0.4));
          }, v);
        }
      }
      break;
    }
    case "cave": {
      if (S === 0) {
        jt(T, Jt(R, 250, [20, 12, 8]), m, t);
        for (let a = 0; a < 18; a++) {
          const v = h.int(0, Tt),
            o = h.int(30, 100),
            n = h.int(6, 16);
          It(
            (i) =>
              T.poly(
                [
                  [i - n, 0],
                  [i, o],
                  [i + n, 0],
                ],
                m,
              ),
            v,
          );
        }
        for (let a = 0; a < 30; a++) T.px(h.int(0, Tt), h.int(40, 240), E.accent, 120);
      } else if (S === 1) {
        for (let a = 0; a < 10; a++) {
          const v = h.int(0, Tt),
            o = h.int(40, 140),
            n = h.int(8, 18);
          It((i) => {
            (T.poly(
              [
                [i - n, 0],
                [i, o],
                [i + n, 0],
              ],
              m,
            ),
              T.poly(
                [
                  [i - n, qt],
                  [i, qt - o * 0.8],
                  [i + n, qt],
                ],
                m,
              ));
          }, v);
        }
        for (let a = 0; a < 8; a++) {
          const v = h.int(0, Tt),
            o = h.int(200, 300);
          It((n) => {
            (T.poly(
              [
                [n - 3, o],
                [n, o - 10],
                [n + 3, o],
              ],
              E.accent,
              200,
            ),
              T.px(n, o - 6, 16777215));
          }, v);
        }
      } else {
        jt(T, Jt(R, 320, [10, 8, 4]), m, t);
        for (let a = 0; a < 12; a++) {
          const v = h.int(0, Tt),
            o = h.int(20, 60),
            n = h.int(5, 10);
          It(
            (i) =>
              T.poly(
                [
                  [i - n, 0],
                  [i, o],
                  [i + n, 0],
                ],
                m,
              ),
            v,
          );
        }
      }
      break;
    }
    case "desert": {
      if (S === 0) {
        (T.circle(470, 110, 28, 16773312, 230), T.circle(470, 110, 22, 16777215, 120));
        const a = Jt(R, 240, [10, 14, 4]);
        jt(T, a, m, t);
        for (const [v, o] of [
          [120, 50],
          [180, 34],
          [400, 40],
        ])
          It((n) => {
            const i = a(v) + 4;
            (T.poly(
              [
                [n - o, i],
                [n, i - o * 0.9],
                [n + o, i],
              ],
              st(m, -0.08),
            ),
              T.poly(
                [
                  [n, i - o * 0.9],
                  [n + o, i],
                  [n + o * 0.4, i],
                ],
                st(m, -0.18),
              ));
          }, v);
      } else if (S === 1) jt(T, Jt(R, 270, [14, 10, 6]), m, t);
      else {
        const a = Jt(R, 310, [8, 6, 3]);
        jt(T, a, m, t);
        for (let v = 0; v < 6; v++) {
          const o = h.int(0, Tt);
          It((n) => {
            const i = a(o) + 2;
            (T.rect(n, i - 28, 4, 28, st(m, -0.15)),
              T.rect(n - 6, i - 20, 6, 3, st(m, -0.15)),
              T.rect(n - 6, i - 26, 3, 8, st(m, -0.15)),
              T.rect(n + 4, i - 16, 6, 3, st(m, -0.15)),
              T.rect(n + 7, i - 22, 3, 8, st(m, -0.15)));
          }, o);
        }
        for (let v = 0; v < 3; v++) {
          const o = h.int(0, Tt);
          It((n) => {
            const i = a(o) + 2;
            (T.rect(n, i - 46, 10, 46, st(m, -0.05)), T.rect(n - 3, i - 50, 16, 5, st(m, -0.05)));
          }, o);
        }
      }
      break;
    }
    case "snow": {
      if (S === 0) {
        const a = Jt(R, 200, [30, 22, 10, 6]);
        jt(T, a, m, t);
        for (let v = 0; v < Tt; v++) {
          const o = Math.round(a(v));
          T.rect(v, o, 1, o < 190 ? (190 - o) * 0.55 + 3 : 2, 16054527);
        }
      } else if (S === 1) {
        const a = Jt(R, 270, [10, 6]);
        jt(T, a, m, t);
        for (let v = 0; v < 22; v++) {
          const o = h.int(0, Tt);
          It((n) => {
            const i = a(o) + 3;
            (di(T, n, i, h.int(36, 60), st(m, -0.15), "pine"), T.px(n, i - 40, 16777215));
          }, o);
        }
      } else {
        const a = Jt(R, 315, [8, 5, 3]);
        jt(T, a, 15266040, 16777215);
        for (let v = 0; v < 6; v++) {
          const o = h.int(0, Tt);
          It((n) => di(T, n, a(o) + 3, h.int(40, 60), m, "pine"), o);
        }
      }
      break;
    }
    case "fortress": {
      if (S === 0) {
        jt(T, Jt(R, 270, [10, 6]), m, t);
        for (let a = 0; a < 6; a++) {
          const v = h.int(0, Tt),
            o = h.int(90, 150),
            n = h.int(18, 30);
          It((i) => {
            T.rect(i, 270 - o, n, o, m);
            for (let e = 0; e < n; e += 6) T.rect(i + e, 266 - o, 4, 4, m);
            T.rect(i + n / 2 - 2, 290 - o, 3, 6, E.accent);
          }, v);
        }
        for (let a = 0; a < 40; a++) T.px(h.int(0, Tt), h.int(80, 260), E.accent, 120);
      } else if (S === 1) {
        T.rect(0, 240, Tt, qt - 240, m);
        for (let a = 0; a < Tt; a += 16) T.rect(a, 232, 10, 8, m);
        for (let a = 0; a < 5; a++) {
          const v = h.int(0, Tt);
          It((o) => {
            (T.rect(o, 180, 2, 60, 3811874),
              T.poly(
                [
                  [o + 2, 182],
                  [o + 20, 186],
                  [o + 18, 210],
                  [o + 2, 206],
                ],
                10103330,
              ),
              T.circle(o + 10, 196, 3, 14200896));
          }, v);
        }
      } else {
        const a = Jt(R, 320, [6, 4]);
        jt(T, a, m, t);
        for (let v = 0; v < 14; v++) {
          const o = h.int(0, Tt);
          It((n) => {
            const i = a(o);
            (T.thickLine(n, i + 4, n + 8, i - 24, 3, 3811874), T.px(n + 8, i - 25, 14209216));
          }, o);
        }
      }
      break;
    }
    case "abyss": {
      if (S === 0) {
        for (let o = 0; o < 80; o++) T.px(h.int(0, Tt), h.int(0, 250), 16777215, h.int(80, 220));
        const a = 320,
          v = 100;
        (T.ellipse(a, v, 70, 10, E.accent, 60), T.ellipse(a, v, 40, 5, 16765183, 90));
        for (let o = 0; o < 6; o++) {
          const n = h.int(0, Tt),
            i = h.int(140, 220),
            e = h.int(18, 36);
          It((r) => {
            (T.ellipse(r, i, e, 5, m),
              T.poly(
                [
                  [r - e, i],
                  [r, i + e * 0.8],
                  [r + e, i],
                ],
                m,
              ));
          }, n);
        }
      } else if (S === 1)
        for (let a = 0; a < 9; a++) {
          const v = h.int(0, Tt),
            o = h.int(80, 180);
          It((n) => {
            for (let i = 0; i < o; i++) {
              const e = 6 * (1 - i / o) + 1;
              T.rect(n + Math.sin(i * 0.05 + a) * 8 - e, qt - i, e * 2, 1, m);
            }
          }, v);
        }
      else {
        jt(T, Jt(R, 320, [10, 6, 4]), m, t);
        for (let a = 0; a < 10; a++) {
          const v = h.int(0, Tt),
            o = h.int(40, 90);
          It((n) => {
            for (let i = 0; i < o; i++) T.rect(n + Math.sin(i * 0.1 + a) * 5, 330 - i, 2 + (o - i) * 0.04, 1, m);
          }, v);
        }
      }
      break;
    }
    case "kingdom":
    default: {
      if (S === 0) {
        (T.circle(140, 80, 18, 15790335, 230), T.circle(146, 76, 15, Ke(E.sky[0], E.sky[1], 0.2), 255));
        for (let v = 0; v < 60; v++) T.px(h.int(0, Tt), h.int(0, 200), 16777215, h.int(60, 200));
        const a = 270;
        T.rect(0, a, Tt, qt - a, m);
        for (const [v, o, n] of [
          [80, 40, 90],
          [200, 70, 150],
          [330, 34, 80],
          [460, 56, 120],
          [560, 30, 70],
        ])
          It(
            (i) => {
              (T.rect(i, a - n, o, n, m),
                T.ellipse(i + o / 2, a - n, o / 2, o / 2.4, m),
                T.rect(i + o / 2 - 1, a - n - o / 2 - 12, 2, 12, m));
              for (let e = 0; e < 3; e++) T.rect(i + 6 + e * (o / 3), a - n + 20, 3, 6, E.accent, 160);
            },
            v,
            100,
          );
      } else if (S === 1) {
        T.rect(0, 290, Tt, qt - 290, m);
        for (let v = 0; v < 5; v++) {
          const o = h.int(0, Tt);
          It(
            (n) => {
              (T.rect(n, 210, 8, 80, m), T.rect(n + 40, 210, 8, 80, m));
              for (let i = 0; i <= 20; i++) {
                const e = i / 20;
                T.rect(n + 4 + e * 40, 210 - Math.sin(e * Math.PI) * 18, 3, 6, m);
              }
            },
            o,
            100,
          );
        }
        for (let v = 0; v < 3; v++) {
          const o = h.int(0, Tt),
            n = h.int(80, 150);
          It((i) => {
            (T.ellipse(i, n, 28, 6, m),
              T.poly(
                [
                  [i - 26, n],
                  [i, n + 26],
                  [i + 26, n],
                ],
                m,
              ));
          }, o);
        }
      } else {
        const a = Jt(R, 322, [6, 4]);
        jt(T, a, m, t);
        for (let v = 0; v < 6; v++) {
          const o = h.int(0, Tt);
          It((n) => {
            const i = a(o);
            (T.rect(n, i - 50, 10, 50, m), T.rect(n - 3, i - 54, 16, 5, m), T.rect(n - 3, i - 4, 16, 4, m));
          }, o);
        }
      }
      break;
    }
  }
  return T;
}
// 다음 지역 배경을 별도 스레드에서 미리 그린다 (끝나면 한 장씩 텍스처로 붙인다)
let BGW = null;
try {
  BGW = new Worker(new URL("./forge/bgworker.js", import.meta.url), { type: "module" });
} catch {}
const BG_PENDING = new Set();
function AiAsync(A, S) {
  const pid = S.zbg ?? S.look ?? S.bgId ?? S.id;
  if (!BGW || !(PAINT.paintable(pid) || PAINT.paintable(S.src))) return void Ai(A, S);
  const T = `bg_${S.id}`;
  if (A.textures.exists(T + "_sky") || BG_PENDING.has(T)) return;
  BG_PENDING.add(T);
  const id = BGN.THEME[pid] ? pid : BGN.THEME[S.src] ? S.src : pid;
  const jobs = [0, 1, 2].map((l) => ({ key: `${T}_${l}`, kind: "layer", layer: l, w: Tt, h: qt + BGX })).concat([{ key: T + "_sky", kind: "sky", w: Tt, h: qt }]);
  const got = {};
  const onMsg = (ev) => {
    const d = ev.data;
    if (!jobs.some((j) => j.key === d.key)) return;
    got[d.key] = d;
    if (Object.keys(got).length < jobs.length) return;
    BGW.removeEventListener("message", onMsg);
    // 하늘을 마지막에 붙인다 (하늘이 있으면 준비 끝으로 본다)
    jobs.forEach((j, k) =>
      setTimeout(() => {
        if (k === jobs.length - 1) BG_PENDING.delete(T);
        const g = got[j.key];
        if (!g || g.error || A.textures.exists(T + "_sky") || !A.sys?.textures) return;
        const C = new ht(g.w, g.h);
        C.buf.set(g.buf);
        lt(A, j.key, C);
      }, k * 60),
    );
  };
  BGW.addEventListener("message", onMsg);
  for (const j of jobs) BGW.postMessage({ ...j, pal: S.pal, id, seed: (Math.random() * 1e9) | 0 });
}
FG.HOOKS.bg = AiAsync;
function Ai(A, S) {
  const T = `bg_${S.id}`;
  if (A.textures.exists(T + "_sky")) return T;
  const C = new ht(Tt, qt);
  (Fn(C, S), lt(A, T + "_sky", C));
  for (const E of [0, 1, 2]) lt(A, `${T}_${E}`, On(S, E));
  return T;
}
class Dn {
  constructor() {
    Z(this, "ctx", null);
    Z(this, "master");
    Z(this, "sfxGain");
    Z(this, "musicGain");
    Z(this, "noiseBuf");
    Z(this, "last", {});
    Z(this, "sfxVol", 0.7);
    Z(this, "musicVol", 0.5);
    Z(this, "track", null);
    Z(this, "fading", []);
    Z(this, "timer", null);
    Z(this, "currentKey", "");
  }
  init() {
    if (!this.ctx)
      try {
        const S = window.AudioContext || window.webkitAudioContext;
        ((this.ctx = new S()),
          (this.master = this.ctx.createGain()),
          (this.master.gain.value = 0.9),
          this.master.connect(this.ctx.destination));
        const T = this.ctx.createDynamicsCompressor();
        ((T.threshold.value = -14),
          (T.ratio.value = 4),
          T.connect(this.master),
          (this.sfxGain = this.ctx.createGain()),
          (this.sfxGain.gain.value = this.sfxVol),
          this.sfxGain.connect(T),
          (this.musicGain = this.ctx.createGain()),
          (this.musicGain.gain.value = this.musicVol * 0.45),
          this.musicGain.connect(T));
        const C = this.ctx.sampleRate * 1;
        this.noiseBuf = this.ctx.createBuffer(1, C, this.ctx.sampleRate);
        const E = this.noiseBuf.getChannelData(0);
        for (let R = 0; R < C; R++) E[R] = Math.random() * 2 - 1;
        this.timer = window.setInterval(() => this.schedule(), 25);
      } catch {
        this.ctx = null;
      }
  }
  resume() {
    (this.init(), this.ctx && this.ctx.state === "suspended" && this.ctx.resume());
  }
  setVolumes(S, T) {
    ((this.musicVol = S),
      (this.sfxVol = T),
      this.ctx &&
        (this.sfxGain.gain.setTargetAtTime(T, this.ctx.currentTime, 0.05),
        this.musicGain.gain.setTargetAtTime(S * 0.45, this.ctx.currentTime, 0.05)));
  }
  osc(S, T, C, E, R, h = 0, m) {
    const t = this.ctx,
      a = t.currentTime + h,
      v = t.createOscillator(),
      o = t.createGain();
    ((v.type = S),
      v.frequency.setValueAtTime(T, a),
      v.frequency.exponentialRampToValueAtTime(Math.max(20, C), a + E),
      o.gain.setValueAtTime(1e-4, a),
      o.gain.exponentialRampToValueAtTime(R, a + 0.006),
      o.gain.exponentialRampToValueAtTime(1e-4, a + E),
      v.connect(o),
      o.connect(m ?? this.sfxGain),
      v.start(a),
      v.stop(a + E + 0.02));
  }
  noise(S, T, C, E, R = 1, h = 0, m = "bandpass") {
    const t = this.ctx,
      a = t.currentTime + h,
      v = t.createBufferSource();
    v.buffer = this.noiseBuf;
    const o = t.createBiquadFilter();
    ((o.type = m),
      (o.Q.value = R),
      o.frequency.setValueAtTime(C, a),
      o.frequency.exponentialRampToValueAtTime(Math.max(30, E), a + S));
    const n = t.createGain();
    (n.gain.setValueAtTime(1e-4, a),
      n.gain.exponentialRampToValueAtTime(T, a + 0.005),
      n.gain.exponentialRampToValueAtTime(1e-4, a + S),
      v.connect(o),
      o.connect(n),
      n.connect(this.sfxGain),
      v.start(a, Math.random() * 0.5),
      v.stop(a + S + 0.02));
  }
  play(S, T = 1) {
    if (!this.ctx || this.sfxVol <= 0) return;
    const C = this.ctx.currentTime,
      E = S === "coin" ? 0.035 : S === "hit" ? 0.03 : 0.025;
    if (this.last[S] && C - this.last[S] < E) return;
    this.last[S] = C;
    const R = Math.min(1.5, T),
      h = 0.94 + Math.random() * 0.12;
    switch (S) {
      case "swing":
        this.noise(0.09, 0.16 * R, 2400 * h, 900, 1.2);
        break;
      case "swingHeavy":
        (this.noise(0.18, 0.22 * R, 1200 * h, 300, 1), this.osc("sine", 120, 60, 0.15, 0.08));
        break;
      case "punch":
        (this.noise(0.05, 0.2, 1500 * h, 500, 1), this.osc("square", 180 * h, 90, 0.05, 0.06));
        break;
      case "hit":
        (this.noise(0.07, 0.28 * R, 1800 * h, 400, 0.8), this.osc("square", 220 * h, 80, 0.07, 0.07 * R));
        break;
      case "crit":
        (this.noise(0.1, 0.32, 3e3, 500, 0.7),
          this.osc("square", 520, 180, 0.12, 0.1),
          this.osc("sine", 1040, 800, 0.08, 0.06, 0.02));
        break;
      case "block":
        (this.osc("square", 900 * h, 700, 0.06, 0.08), this.osc("triangle", 1400, 1200, 0.1, 0.06));
        break;
      case "thud":
        (this.osc("sine", 110 * h, 40, 0.2, 0.25 * R), this.noise(0.15, 0.15 * R, 400, 100, 0.8, 0, "lowpass"));
        break;
      case "playerHurt":
        (this.osc("square", 300, 90, 0.18, 0.12), this.noise(0.12, 0.2, 900, 200, 0.7));
        break;
      case "jump":
        this.osc("square", 260 * h, 520, 0.08, 0.05);
        break;
      case "land":
        this.noise(0.05, 0.08, 600, 200, 0.8, 0, "lowpass");
        break;
      case "dash":
        this.noise(0.14, 0.18, 800, 3e3, 1.2);
        break;
      case "coin":
        (this.osc("square", 1320 * h, 1320, 0.05, 0.05), this.osc("square", 1760 * h, 1760, 0.08, 0.05, 0.045));
        break;
      case "coinBig":
        [0, 0.06, 0.12].forEach((m, t) =>
          this.osc("square", [1046, 1318, 1568][t], [1046, 1318, 1568][t], 0.09, 0.06, m),
        );
        break;
      case "enemyDie":
        (this.noise(0.25, 0.2, 1200, 200, 0.6), this.osc("square", 400 * h, 60, 0.22, 0.06));
        break;
      case "bossRoar":
        (this.osc("sawtooth", 90, 45, 1.1, 0.2),
          this.osc("sawtooth", 135, 60, 1, 0.12),
          this.noise(1, 0.18, 500, 120, 0.5, 0, "lowpass"));
        break;
      case "warn":
        (this.osc("square", 880, 880, 0.08, 0.06), this.osc("square", 660, 660, 0.08, 0.06, 0.1));
        break;
      case "explosion":
        (this.noise(0.45, 0.35 * R, 900, 60, 0.5, 0, "lowpass"), this.osc("sine", 90, 30, 0.35, 0.25 * R));
        break;
      case "shoot":
        (this.osc("square", 700 * h, 300, 0.07, 0.05), this.noise(0.05, 0.08, 2e3, 1e3, 1));
        break;
      case "bow":
        (this.osc("triangle", 300 * h, 900, 0.06, 0.08), this.noise(0.08, 0.1, 3e3, 1500, 2));
        break;
      case "magic":
        (this.osc("sine", 600 * h, 1200, 0.15, 0.08), this.osc("triangle", 900 * h, 1800, 0.12, 0.05, 0.03));
        break;
      case "ice":
        (this.osc("sine", 1800 * h, 2400, 0.2, 0.06), this.noise(0.3, 0.12, 5e3, 2e3, 2));
        break;
      case "lightning":
        (this.noise(0.25, 0.3, 4e3, 600, 0.6), this.osc("sawtooth", 140, 60, 0.2, 0.08));
        break;
      case "heal":
        [0, 0.07, 0.14, 0.21].forEach((m, t) =>
          this.osc("sine", [523, 659, 784, 1046][t], [523, 659, 784, 1046][t] * 1.01, 0.2, 0.06, m),
        );
        break;
      case "buff":
        [0, 0.08].forEach((m, t) => this.osc("square", [440, 660][t], [440, 660][t], 0.12, 0.05, m));
        break;
      case "click":
        this.osc("square", 900, 900, 0.03, 0.04);
        break;
      case "open":
        this.osc("triangle", 400, 800, 0.08, 0.06);
        break;
      case "close":
        this.osc("triangle", 700, 350, 0.08, 0.05);
        break;
      case "buy":
        [0, 0.05, 0.1].forEach((m, t) => this.osc("square", [784, 988, 1318][t], [784, 988, 1318][t], 0.08, 0.06, m));
        break;
      case "error":
        this.osc("square", 180, 150, 0.15, 0.07);
        break;
      case "levelup":
        [0, 0.08, 0.16, 0.24].forEach((m, t) =>
          this.osc("square", [523, 659, 784, 1046][t], [523, 659, 784, 1046][t], 0.12, 0.06, m),
        );
        break;
      case "record":
        [0, 0.1, 0.2, 0.3, 0.45].forEach((m, t) =>
          this.osc(
            "square",
            [523, 659, 784, 1046, 1318][t],
            [523, 659, 784, 1046, 1318][t],
            t === 4 ? 0.4 : 0.12,
            0.07,
            m,
          ),
        );
        break;
      case "chest":
        (this.osc("triangle", 300, 600, 0.1, 0.08),
          [0.1, 0.18].forEach((m, t) => this.osc("square", [880, 1320][t], [880, 1320][t], 0.1, 0.05, m)));
        break;
      case "death":
        (this.osc("square", 440, 110, 0.9, 0.1), this.osc("triangle", 330, 80, 1, 0.1, 0.1));
        break;
      case "portal":
        (this.osc("sine", 200, 800, 0.5, 0.08), this.osc("sine", 300, 1200, 0.5, 0.05, 0.05));
        break;
    }
  }
  playMusic(S, T) {
    if (!this.ctx || this.currentKey === S) return;
    this.currentKey = S;
    const C = this.ctx;
    if (this.track) {
      const R = this.track.gain;
      (R.gain.setTargetAtTime(1e-4, C.currentTime, 0.4),
        this.fading.push(R),
        setTimeout(() => {
          try {
            R.disconnect();
          } catch {}
          this.fading = this.fading.filter((h) => h !== R);
        }, 2500));
    }
    const E = C.createGain();
    ((E.gain.value = 1e-4),
      E.connect(this.musicGain),
      E.gain.setTargetAtTime(1, C.currentTime + 0.2, 0.5),
      (this.track = { spec: T, gain: E, step: 0, nextTime: C.currentTime + 0.3, pattern: bn(T) }));
  }
  stopMusic() {
    !this.ctx ||
      !this.track ||
      (this.track.gain.gain.setTargetAtTime(1e-4, this.ctx.currentTime, 0.3),
      (this.track = null),
      (this.currentKey = ""));
  }
  schedule() {
    if (!this.ctx || !this.track || this.ctx.state !== "running") return;
    const S = this.ctx,
      T = this.track,
      C = 60 / T.spec.tempo / 4;
    for (; T.nextTime < S.currentTime + 0.12;)
      (this.playStep(T, T.step, T.nextTime, C), (T.step = (T.step + 1) % T.pattern.length), (T.nextTime += C));
  }
  note(S, T, C, E, R, h, m = 0) {
    const t = this.ctx,
      a = t.createOscillator(),
      v = t.createGain();
    a.type = T;
    const o = 440 * Math.pow(2, (C - 69) / 12);
    (a.frequency.setValueAtTime(o, E),
      m && a.frequency.exponentialRampToValueAtTime(o * Math.pow(2, m / 12), E + R),
      v.gain.setValueAtTime(1e-4, E),
      v.gain.exponentialRampToValueAtTime(h, E + 0.01),
      v.gain.exponentialRampToValueAtTime(1e-4, E + R),
      a.connect(v),
      v.connect(S),
      a.start(E),
      a.stop(E + R + 0.05));
  }
  drum(S, T, C) {
    const E = this.ctx;
    if (T === "k") {
      const R = E.createOscillator(),
        h = E.createGain();
      (R.frequency.setValueAtTime(130, C),
        R.frequency.exponentialRampToValueAtTime(40, C + 0.12),
        h.gain.setValueAtTime(0.5, C),
        h.gain.exponentialRampToValueAtTime(1e-4, C + 0.15),
        R.connect(h),
        h.connect(S),
        R.start(C),
        R.stop(C + 0.2));
    } else {
      const R = E.createBufferSource();
      R.buffer = this.noiseBuf;
      const h = E.createBiquadFilter();
      ((h.type = T === "h" ? "highpass" : "bandpass"), (h.frequency.value = T === "h" ? 7e3 : 1800));
      const m = E.createGain(),
        t = T === "h" ? 0.04 : 0.12;
      (m.gain.setValueAtTime(T === "h" ? 0.12 : 0.22, C),
        m.gain.exponentialRampToValueAtTime(1e-4, C + t),
        R.connect(h),
        h.connect(m),
        m.connect(S),
        R.start(C, Math.random() * 0.5),
        R.stop(C + t + 0.02));
    }
  }
  playStep(S, T, C, E) {
    const R = S.pattern[T],
      h = S.gain;
    if (
      (R.bass !== null && this.note(h, "triangle", R.bass, C, E * 1.8, 0.32),
      R.lead !== null &&
        this.note(
          h,
          S.spec.wave,
          R.lead,
          C,
          E * R.leadLen,
          S.spec.wave === "sawtooth" ? 0.05 : S.spec.wave === "square" ? 0.055 : 0.11,
        ),
      R.arp !== null && this.note(h, "square", R.arp, C, E * 0.8, 0.025),
      R.pad !== null)
    )
      for (const m of R.pad) this.note(h, "sine", m, C, E * 15, 0.035);
    for (const m of R.drums) this.drum(h, m, C);
  }
}
function bn(A) {
  const S = new Ze(Ge(A.root * 31 + A.mood * 7 + (A.boss ? 999 : 0) + (A.hub ? 555 : 0), A.tempo + (A.seed ?? 0))),
    T = A.scale,
    C = (v, o = 0) => {
      const n = T.length,
        i = Math.floor(v / n),
        e = ((v % n) + n) % n;
      return A.root + T[e] + 12 * (i + o);
    },
    E = [
      [0, 5, 3, 4],
      [0, 3, 4, 0],
      [0, 5, 1, 4],
      [0, 2, 5, 4],
      [0, 6, 5, 4],
      [0, 3, 0, 4],
    ],
    R = S.pick(E).map((v) => Math.min(v, T.length - 1)),
    h = [];
  let m = S.int(2, 5);
  for (let v = 0; v < 32; v++) {
    const o = A.hub ? 0.55 : A.boss ? 0.25 : 0.4;
    if (v % 2 === 1 && S.chance(0.6)) {
      h.push(null);
      continue;
    }
    if (S.chance(o)) {
      h.push(null);
      continue;
    }
    ((m += S.pick([-2, -1, -1, 0, 1, 1, 2, 3, -3])), (m = Math.max(-1, Math.min(9, m))), h.push(m));
  }
  const t = [],
    a = A.hub ? 0 : A.boss ? 3 : A.mood === 2 || A.mood === 6 ? 1 : A.tempo > 105 ? 2 : 1;
  for (let v = 0; v < 8; v++) {
    const o = R[v % 4];
    for (let n = 0; n < 16; n++) {
      const i = v * 16 + n,
        e = { bass: null, lead: null, leadLen: 1.6, arp: null, pad: null, drums: [] };
      if (
        ((A.boss ? [0, 2, 4, 6, 8, 10, 12, 14] : A.hub ? [0, 8] : [0, 6, 8, 12]).includes(n) &&
          (e.bass = C(o, -2) + (n === 12 && !A.hub && S.chance(0.3) ? 7 : 0)),
        n === 0 && (e.pad = [C(o, 0), C(o + 2, 0), C(o + 4, 0)]),
        !A.hub && A.mood !== 2 && n % 2 === 0 && (e.arp = C(o + [0, 2, 4, 2, 7, 4, 2, 4][(n / 2) % 8], 1)),
        A.hub && n % 4 === 2 && (e.arp = C(o + [0, 2, 4, 2][(n / 4) | 0], 1)),
        v >= 2)
      ) {
        const l = h[(i - 32) % 32];
        l != null && (e.lead = C(l + (v >= 6 ? 2 : 0) + (v % 2 === 1 && n >= 12 ? -1 : 0), 1));
      }
      (a >= 1 && ((n === 0 || (a >= 2 && n === 8)) && e.drums.push("k"), n % 4 === 2 && e.drums.push("h")),
        a >= 2 && (n === 4 || n === 12) && e.drums.push("s"),
        a >= 3 && (n % 2 === 0 && e.drums.push("h"), (n === 6 || n === 10) && e.drums.push("k")),
        t.push(e));
    }
  }
  return t;
}
// 소리: 새 합성 엔진 (주소에 ?audio=old 를 붙이면 옛 소리로 비교)
const j = typeof location !== "undefined" && /[?&]audio=old/.test(location.search) ? new Dn() : new AudioEngine();
typeof window !== "undefined" && (window.__audio = j);
function ct(A, S, T, C, E = "body", R = q.text, h = {}) {
  h.stroke && qLight[R] && (R = qLight[R]);
  const m = E === "small" ? ii : E === "tiny" ? Di : E === "big" || E === "title" ? Ms : ei,
    t = E === "small" ? 10 : E === "tiny" ? 8 : E === "big" ? 15 : E === "title" ? 30 : 12;
  return A.add.text(S, T, C, { fontFamily: m, fontSize: `${t}px`, color: R, ...h });
}
function Ce(A, S, T, C, E, R = "ui_panel") {
  return A.add.nineslice(S, T, R, void 0, C, E, 6, 6, 6, 6).setOrigin(0, 0);
}
function Be(A, S, T, C, E, R, h, m = {}) {
  const t = m.style === "green" ? "ui_btn_green" : "ui_btn",
    a = A.add
      .nineslice(S, T, t, void 0, C, E, 4, 4, 4, 4)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: !0 }),
    v = ct(A, S + C / 2, T + E / 2 - 1, R, m.small ? "small" : "body", q.text).setOrigin(0.5);
  m.depth !== void 0 && (a.setDepth(m.depth), v.setDepth(m.depth + 1));
  const o = {
    bg: a,
    label: v,
    enabled: !0,
    container: [a, v],
    setLabel(n) {
      return (v.setText(n), o);
    },
    setEnabled(n) {
      return ((o.enabled = n), a.setTexture(n ? t : "ui_btn_off"), v.setColor(n ? q.text : q.textDim), o);
    },
    setVisible(n) {
      return (a.setVisible(n), v.setVisible(n), n ? a.setInteractive() : a.disableInteractive(), o);
    },
    setSelected(n) {
      return (a.setTexture(n ? t + "_hi" : t), o);
    },
    destroy() {
      (a.destroy(), v.destroy());
    },
  };
  return (
    a.on("pointerover", () => {
      o.enabled && a.setTexture(t === "ui_btn" ? "ui_btn_hi" : "ui_btn_green_hi");
    }),
    a.on("pointerout", () => {
      a.setTexture(o.enabled ? t : "ui_btn_off");
    }),
    a.on("pointerdown", (n) => {
      if (n.leftButtonDown()) {
        if (!o.enabled) {
          j.play("error");
          return;
        }
        (m.sound !== !1 && j.play("click"), h());
      }
    }),
    o
  );
}
class cs {
  constructor(S, T, C, E, R, h) {
    Z(this, "bg");
    Z(this, "fill");
    Z(this, "lag");
    Z(this, "lagV", 1);
    ((this.x = T),
      (this.y = C),
      (this.w = E),
      (this.h = R),
      (this.color = h),
      (this.bg = S.add.nineslice(T, C, "ui_bar", void 0, E, R, 3, 3, 3, 3).setOrigin(0, 0)),
      (this.lag = S.add.rectangle(T + 2, C + 2, E - 4, R - 4, 16777215, 0.8).setOrigin(0, 0)),
      (this.fill = S.add.rectangle(T + 2, C + 2, E - 4, R - 4, h).setOrigin(0, 0)));
  }
  set(S, T = 0.016) {
    ((S = Math.max(0, Math.min(1, S))),
      (this.fill.width = (this.w - 4) * S),
      this.lagV > S ? (this.lagV = Math.max(S, this.lagV - T * 0.6)) : (this.lagV = S),
      (this.lag.width = (this.w - 4) * this.lagV));
  }
  setDepth(S) {
    return (this.bg.setDepth(S), this.lag.setDepth(S + 1), this.fill.setDepth(S + 2), this);
  }
  setVisible(S) {
    return (this.bg.setVisible(S), this.lag.setVisible(S), this.fill.setVisible(S), this);
  }
  destroy() {
    (this.bg.destroy(), this.fill.destroy(), this.lag.destroy());
  }
}
function bi(A, S) {
  const T = Math.min(S / A.width, S / A.height);
  return (A.setScale(T >= 1 ? Math.floor(T) : T), A);
}
const Ut = (A, S, T) => (A < S ? S : A > T ? T : A),
  ie = (A, S, T) => A + (S - A) * T,
  Xt = (A, S, T) => (A < S ? Math.min(A + T, S) : Math.max(A - T, S));
function ge(A, S, T, C, E, R, h, m) {
  return A < E + h && A + T > E && S < R + m && S + C > R;
}
function yt(A) {
  return ((A = Math.floor(A)), A.toLocaleString("en-US"));
}
function Ns(A) {
  A = Math.floor(A);
  const S = Math.floor(A / 3600),
    T = Math.floor((A % 3600) / 60),
    C = A % 60;
  return S > 0
    ? `${S}:${String(T).padStart(2, "0")}:${String(C).padStart(2, "0")}`
    : `${T}:${String(C).padStart(2, "0")}`;
}
function _t(A, S = 0) {
  return `${(A * 100).toFixed(S)}%`;
}
const Mt = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 },
  vs = 0.3;
let Us = !1;
typeof window < "u" &&
  window.addEventListener("gamepadconnected", () => {
    Us = !0;
  });
class ri {
  constructor(S) {
    Z(this, "prev", []);
    Z(this, "cur", []);
    Z(this, "prevAxis", { x: 0, y: 0 });
    Z(this, "axis", { x: 0, y: 0 });
    Z(this, "aim", { x: 0, y: 0 });
    Z(this, "connected", !1);
    Z(this, "lastUse", -1e9);
  }
  pad() {
    if (TOUCH.gp) return TOUCH.gp;
    if (!Us || typeof navigator > "u" || !navigator.getGamepads) return null;
    try {
      for (const S of navigator.getGamepads()) if (S && S.connected) return S;
    } catch {}
    return null;
  }
  poll() {
    ((this.prev = this.cur), (this.prevAxis = { ...this.axis }));
    const S = this.pad();
    if (((this.connected = !!S), !S)) {
      ((this.cur = []), (this.axis = { x: 0, y: 0 }), (this.aim = { x: 0, y: 0 }));
      return;
    }
    this.cur = S.buttons.map((m) => m.pressed || m.value > 0.5);
    const T = (m) => S.axes[m] ?? 0;
    let C = T(0),
      E = T(1);
    (Math.abs(C) < vs && (C = 0),
      Math.abs(E) < vs && (E = 0),
      this.cur[Mt.LEFT] && (C = -1),
      this.cur[Mt.RIGHT] && (C = 1),
      this.cur[Mt.UP] && (E = -1),
      this.cur[Mt.DOWN] && (E = 1),
      (this.axis = { x: C, y: E }));
    const R = T(2),
      h = T(3);
    ((this.aim = Math.hypot(R, h) > 0.35 ? { x: R, y: h } : { x: 0, y: 0 }),
      (C || E || this.aim.x || this.aim.y || this.cur.some(Boolean)) && (this.lastUse = performance.now()));
  }
  down(S) {
    return !!this.cur[S];
  }
  justDown(S) {
    return !!this.cur[S] && !this.prev[S];
  }
  navY() {
    const S = this.axis.y > 0.6 ? 1 : this.axis.y < -0.6 ? -1 : 0,
      T = this.prevAxis.y > 0.6 ? 1 : this.prevAxis.y < -0.6 ? -1 : 0;
    return S !== T ? S : 0;
  }
  navX() {
    const S = this.axis.x > 0.6 ? 1 : this.axis.x < -0.6 ? -1 : 0,
      T = this.prevAxis.x > 0.6 ? 1 : this.prevAxis.x < -0.6 ? -1 : 0;
    return S !== T ? S : 0;
  }
  preferred(S) {
    return this.connected && this.lastUse > S;
  }
}
function Xs(A) {
  const S = { t: -1e9 },
    T = () => {
      S.t = performance.now();
    };
  return (
    A.input.on("pointermove", T),
    A.input.on("pointerdown", T),
    A.events.once("shutdown", () => {
      (A.input.off("pointermove", T), A.input.off("pointerdown", T));
    }),
    S
  );
}
class Bn extends zt.Scene {
  constructor() {
    super("Title");
    Z(this, "layers", []);
    Z(this, "recovered", null);
    Z(this, "started", !1);
    Z(this, "pad");
  }
  init(T) {
    ((this.recovered = (T == null ? void 0 : T.recovered) ?? null), (this.started = !1));
  }
  create() {
    const W = ot, H = xt;
    this.layers = [];
    this.panelOpen = null;
    this.menuSel = 0;
    this.wipeArmed = false;
    this.wipeTimer = null;
    // 새 타이틀 (2026-11-28): 거점 마을 배경 · 단조 로고 · 철판 메뉴 (forge/title2.js)
    const items = [
      { label: this.recovered ? "지난 탐험 이어보기" : "모험 시작", sub: this.recovered ? "끝나지 않은 탐험의 기록" : "갈림길 요새에서 다음 전설을 벼려라", primary: true, act: () => this.go() },
      { label: "기록 게시판", sub: "최고 기록 · 업적 · 도감", col: 0, act: () => this.openPanel(() => new (FG.panels().Board)(this, () => this.closePanel())) },
      { label: "설정", sub: "소리 · 화면 · 조작법", col: 1, act: () => this.openPanel(() => new dr(this, () => this.closePanel(), () => {})) },
      { label: "데이터 초기화", sub: "한 번 더 누르면 모든 진행이 삭제됩니다", small: true,
        act: () => {
          if (!this.wipeArmed) {
            this.wipeArmed = true;
            this.menu[3].P.set("한 번 더 눌러 초기화");
            this.wipeTimer = this.time.delayedCall(4000, () => this.cancelWipe());
            j.play("error");
            return;
          }
          it.reset();
          this.scene.restart({ recovered: null });
        } },
    ];
    const T2 = FG.buildTitle(this, {
      ground: bt,
      items,
      record: `탐험 ${it.data.runs ?? 0}회  ·  골드 ${yt(it.data.gold ?? 0)}`,
      version: "v0.2",
      onPick: (i, act) => { if (this.panelOpen || this.started) return; this.pick(i); act && this.activate(); },
    });
    this.t2 = T2;
    this.menu = items.map((m, i) => ({ ...m, P: T2.menu[i] }));
    this.subText = T2.sub;
    // 아무 키나 누르면 시작 연출 건너뛰기
    this.input.keyboard.on("keydown", () => T2.isDone() || T2.finish());
    this.input.on("pointerdown", () => T2.isDone() || T2.finish());
    this.pick(0, true);
    const key = (k, f) => this.input.keyboard.on("keydown-" + k, () => { if (!this.panelOpen && !this.started) f(); });
    const move = (d) => this.pick((this.menuSel + d + this.menu.length) % this.menu.length);
    key("UP", () => move(-1));
    key("W", () => move(-1));
    key("DOWN", () => move(1));
    key("S", () => move(1));
    key("LEFT", () => move(-1));
    key("RIGHT", () => move(1));
    key("ENTER", () => this.activate());
    key("SPACE", () => this.activate());
    this.pad = new ri(this);
    // (어둠에서 밝아지는 연출은 title2가 한다)
  }
  cancelWipe() {
    this.wipeArmed = false;
    this.wipeTimer?.remove();
    this.wipeTimer = null;
    this.menu[3].P.set(this.menu[3].label);
    this.paintMenu();
  }
  paintMenu() {
    this.menu.forEach((m, i) => m.P?.select(i === this.menuSel));
  }
  pick(i, quiet) {
    if (this.wipeArmed && i !== 3) this.cancelWipe();
    const changed = this.menuSel !== i;
    this.menuSel = i;
    this.subText.setText(this.menu[i].sub);
    this.paintMenu();
    if (!quiet && changed) j.play("click");
  }
  activate() {
    this.panelOpen || this.started || this.menu[this.menuSel].act();
  }
  openPanel(f) {
    (j.resume(), (this.panelOpen = f()));
  }
  closePanel() {
    (this.panelOpen = null);
  }
  go() {
    this.started ||
      ((this.started = !0),
      j.resume(),
      j.play("portal"),
      this.cameras.main.fadeOut(400),
      this.time.delayedCall(420, () => {
        this.recovered ? this.scene.start("Result", { result: this.recovered }) : this.scene.start("Hub");
      }));
  }
  update(time) {
    FG.titleUpdate(this);
    this.pad.poll();
    if (this.panelOpen || this.started) return;
    const direction = this.pad.navY() || this.pad.navX();
    if (direction) this.pick((this.menuSel + direction + this.menu.length) % this.menu.length);
    if (this.pad.justDown(Mt.A) || this.pad.justDown(Mt.START)) this.activate();
  }
}
const ue = {
    maxHp: 100,
    atk: 10,
    def: 0,
    moveSpeed: 150,
    attackSpeed: 1,
    critChance: 0.05,
    critDamage: 1.5,
    skillPower: 1,
    healEff: 1,
    goldGain: 1,
  },
  Vt = {
    gravity: 1500,
    jumpVel: 500,
    jumpCut: 0.45,
    maxFall: 720,
    accelGround: 1700,
    accelAir: 1150,
    decelGround: 2100,
    decelAir: 600,
    coyote: 0.1,
    jumpBuffer: 0.13,
    dashSpeed: 430,
    dashTime: 0.16,
    dashCooldown: 0.75,
    dashIframes: 0.2,
    hurtIframes: 0.75,
    hurtKnock: 170,
    bodyW: 10,
    bodyH: 22,
    minMoveMult: 0.8,
  },
  de = {
    defK: 70,
    maxReduction: 0.75,
    maxResist: 0.7,
    critCap: 0.75,
    hitstopBase: 0.04,
    hitstopCrit: 0.065,
    hitstopHeavy: 0.085,
    comboWindow: 0.45,
    pitDamage: 0.15,
  };
function ni(A) {
  A = FG.diffDist(A);
  const S = Math.max(0, A) / 1e3,
    T = Math.max(0, A - 1e4) / 1e3,
    C = A >= 1e4 ? Math.floor(T) + 1 : 0;
  return {
    hpMult: 1 + 0.42 * S + 0.045 * Math.pow(S, 1.4) + C * 0.35,
    atkMult: 1 + 0.26 * S + C * 0.2,
    defAdd: Math.floor(S * 2.2) + C * 4,
    goldMult: 1 + 0.35 * S + C * 0.3,
    eliteBonus: Math.min(0.25, S * 0.008 + C * 0.02),
    densityMult: 1 + Math.min(0.8, S * 0.03) + Math.min(0.6, C * 0.06),
    windupMult: Math.max(0.65, 1 - S * 0.012 - C * 0.025),
    speedMult: 1 + Math.min(0.35, S * 0.012 + C * 0.02),
    extraProj: Math.min(3, Math.floor(S / 7) + Math.floor(C / 2)),
    tier: C,
  };
}
const Ri = { magnetRange: 70, magnetSpeed: 420, eliteGoldMult: 6, rareEliteGoldMult: 15 };
function _i(A, S, T) {
  const C = A * Math.pow(S, T);
  return C < 100 ? Math.round(C / 5) * 5 : C < 1e3 ? Math.round(C / 10) * 10 : Math.round(C / 50) * 50;
}
const Gi = 10,
  Ni = 15,
  ps = 10,
  ms = 15,
  gs = 5,
  xs = 8,
  In = [0, 0, 500, 2200],
  ze = 0,
  fe = 1,
  _e = 2,
  Ti = 3,
  ci = 3,
  Vs = 3 + UGR,
  Gn = 28 + UGR,
  Si = 7;
function ys(A, S) {
  const T = Vt.jumpVel,
    C = Vt.gravity,
    E = ue.moveSpeed * Vt.minMoveMult,
    R = S * gt + 3,
    h = T * T - 2 * C * R;
  if (h < 0) return !1;
  const m = (T + Math.sqrt(h)) / C;
  return E * m >= A * gt + 6;
}
function ts(A) {
  return Math.floor((me + A) / vt) - 2;
}
function Nn(A) {
  return A * vt - me;
}
class Un {
  constructor(S, T, C) {
    Z(this, "cols", []);
    Z(this, "plats", []);
    Z(this, "hazards", []);
    Z(this, "noSpawn", new Set());
    Z(this, "decorHints", []);
    Z(this, "h");
    Z(this, "ceilMode");
    Z(this, "ceilH", 0);
    Z(this, "safePits", !1);
    ((this.rng = C), (this.h = S), (this.ceilMode = T), (this.ceilH = 4));
  }
  get x() {
    return this.cols.length;
  }
  get room() {
    return vt - this.cols.length;
  }
  push(S) {
    let T = 0;
    (this.ceilMode &&
      S > 0 &&
      ((this.ceilH = Math.max(2, Math.min(Ft - S - Si - TOPR, this.ceilH + this.rng.int(-1, 1)))), (T = this.ceilH + TOPR)),
      this.cols.push({ g: S, c: T }));
  }
  flat(S) {
    for (let T = 0; T < S && this.room > 0; T++) this.push(this.h);
  }
  setH(S) {
    this.h = Math.max(Vs, Math.min(Gn, S));
  }
  pit(S) {
    for (let T = 0; T < S && this.room > 0; T++)
      (this.noSpawn.add(this.x), this.cols.push({ g: this.safePits ? Math.max(1, this.h - 3) : 0, c: 0 }));
  }
  surfaceRow(S = this.h) {
    return Ft - S;
  }
  // 경사 오르막·내리막 (한 칸에 한 단씩)
  rampUp(S) {
    this.slopes = this.slopes ?? [];
    for (let T = 0; T < S && this.room > 0 && this.h + 1 <= Gn; T++) (this.slopes.push({ x: this.x, row: Ft - (this.h + 1), code: 4 }), this.push(this.h), this.setH(this.h + 1));
  }
  rampDown(S) {
    this.slopes = this.slopes ?? [];
    for (let T = 0; T < S && this.room > 0 && this.h - 1 >= Vs; T++) (this.setH(this.h - 1), this.slopes.push({ x: this.x, row: Ft - (this.h + 1), code: 5 }), this.push(this.h));
  }
}
class Xn {
  constructor(S) {
    Z(this, "meta", new Map());
    Z(this, "cache", new Map());
    this.seed = S;
  }
  getMeta(S) {
    if (S < 0) return { endH: 4 + UGR, event: null };
    let T = this.meta.get(S);
    if (T) return T;
    let C = S;
    for (; C > 0 && !FG.zoneFirst(C) && !this.meta.has(C - 1);) C--;
    for (let E = C; E <= S; E++) this.get(E);
    return this.meta.get(S);
  }
  get(S) {
    var h, m;
    const T = this.cache.get(S);
    if (T) return T;
    const C = S === 0 || FG.zoneFirst(S) ? 4 + UGR : this.getMeta(S - 1).endH,
      E = [];
    for (let t = 1; t <= 4; t++)
      E.push(S - t >= 0 ? (((h = this.meta.get(S - t)) == null ? void 0 : h.event) ?? null) : null);
    const R = this.generate(S, C, E);
    FG.zoneWalls(S, R);
    return (
      this.cache.set(S, R),
      this.meta.set(S, { endH: R.endH, event: ((m = R.event) == null ? void 0 : m.type) ?? null }),
      R
    );
  }
  isArena(S) {
    if (S < 0) return !1;
    const rg = qi(Math.max(0, Nn(S) + vt / 2));
    if (!rg.boss) return !1;
    const v = ts(rg.end);
    return S === v || S === v + 1;
  }
  // 지하·하늘 루트가 있는 조각: 처음 몇 조각과 보스 방 근처는 비운다
  tunnelAt(S) {
    return S > 2 && !this.isArena(S - 2) && !this.isArena(S - 1) && !this.isArena(S) && !this.isArena(S + 1);
  }
  midBossAt(S) {
    return S % 6 === 4 && this.tunnelAt(S - 1) && this.tunnelAt(S + 1);
  }
  trim(S, T = 12) {
    for (const C of this.cache.keys()) Math.abs(C - S) > T && this.cache.delete(C);
  }
  cacheSize() {
    return this.cache.size;
  }
  generate(S, T, C) {
    const E = new Ze(Ge(this.seed, S)),
      R = Nn(S),
      h = Math.max(0, R + vt / 2),
      m = qi(h),
      t = bs(h),
      a = ni(Math.max(0, R)),
      v = ts(m.end),
      o = !!m.boss && (S === v || S === v + 1),
      n = !o && S > 2 && !FG.peakChunk(S) && E.chance(m.ceiling),
      i = new Un(T, n, E);
    i.safePits = m.idx === 0;
    let e = null;
    if (!o && (S === 0 || FG.zoneEdge(S) || FG.groundPeakChunk(S))) {
      (i.setH(6 + UGR), i.flat(vt));
      for (let y = 0; y < vt; y++) i.noSpawn.add(y);
    } else if (o) {
      e = { boss: m.boss, part: S === v ? 0 : 1, regionIdx: t };
      const y = 6 + UGR;
      if (e.part === 0) {
        for (; i.x < 10;) (i.h > y ? i.setH(Math.max(y, i.h - 2)) : i.h < y && i.setH(Math.min(y, i.h + 2)), i.flat(2));
        (i.setH(y), i.flat(vt - i.x));
      } else (i.setH(y), i.flat(vt));
      for (let x = 0; x < vt; x++) i.noSpawn.add(x);
    } else {
      this.tplState = this.tplState ?? new Map();
      FG.designChunk(i, { rng: i.rng, region: m, dist: R, S, Ft, state: this.tplState, hazard: (nm) => this.pattern(nm, i, m, R, a.tier) });
      // 하늘 루트 (천장 있는 조각·보스 근처 제외)
      S > 2 && !n && this.tunnelAt(S) && (i.sky = FG.skyRoute(i, { S, seed: this.seed, rng: i.rng, Ft, peak: FG.peakChunk(S), ladder: FG.ladderChunk(S) }));
    }
    this.validate(i);
    const r = new Uint8Array(vt * Ft),
      l = [],
      s = [];
    for (let y = 0; y < vt; y++) {
      const x = i.cols[y] ?? { g: i.h, c: 0 };
      (l.push(x.g), s.push(x.c));
      for (let w = 0; w < Ft; w++) ((x.g > 0 && w >= Ft - x.g) || w < x.c) && (r[w * vt + y] = fe);
    }
    for (const y of i.plats)
      for (let x = 0; x < y.w; x++) {
        const w = y.x + x;
        w >= 0 &&
          w < vt &&
          y.row >= 0 &&
          y.row < Ft &&
          r[y.row * vt + w] === ze &&
          (r[y.row * vt + w] = y.crumble ? Ti : _e);
      }
    for (const y of i.blocks ?? [])
      for (let rr = 0; rr < y.h; rr++) {
        const inset = y.taper ? Math.floor(rr * y.taper) : 0;
        for (let x = inset; x < y.w - inset; x++) {
          const w = y.x + x, row = y.row + rr;
          w >= 0 && w < vt && row >= 0 && row < Ft && r[row * vt + w] !== fe && (r[row * vt + w] = 7);
        }
      }
    // 땅에 붙은 지형은 단단한 땅으로 (아래부터 이어진 칸)
    for (let x = 0; x < vt; x++)
      for (let w = Ft - 2; w >= 0; w--) r[w * vt + x] === 7 && r[(w + 1) * vt + x] === fe && (r[w * vt + x] = fe);
    // 떠 있는 지형도 보이는 그대로 단단하게 (예전엔 몸이 통과해서 벽 속에 들어갈 수 있었다)
    for (let q = 0; q < r.length; q++) r[q] === 7 && (r[q] = fe);
    for (const y of i.slopes ?? []) y.x >= 0 && y.x < vt && y.row >= 0 && y.row < Ft && r[y.row * vt + y.x] === ze && (r[y.row * vt + y.x] = y.code);
    !e && FG.groundRepair(S, r, vt, Ft);
    // 하늘·동굴 구역: 조각 전체를 새로 채운다 (지상 구역 ▲ 문 조각은 징검다리만)
    const zg = FG.zoneGen(S, r, l, s, { vt, Ft, fe, ze, plat: _e, seed: this.seed, arena: !!e });
    zg && !zg.partial && (zg.keepHazards || (i.hazards.length = 0), (i.slopes = []), (i.decorHints = []), (i.extraSpawns = []));
    // 자연 지형: 함정은 생성기가 평평한 자리(칸 경계 높이)에 직접 놓는다
    zg?.natural && (i.hazards = e ? [] : zg.hazards);
    const fine = zg?.fine ?? null, gy = zg?.gy ?? null, flat = zg?.flat ?? null;
    // 그 칸에 물건을 놓아도 되는가 (자연 지형은 칸 전체가 평평해야)
    const flatOK = (P) => !flat || (P >= 0 && P < vt && flat[P] === 1);
    const pyAt = (P) => (gy && gy[P] >= 0 ? gy[P] : (Ft - l[P]) * gt);
    zg && !e && (i.sky = { clouds: zg.clouds, chests: zg.chests, spawns: [] });
    // 지하 동굴 (설계된 조각만)
    let caveOut = { shafts: [], spawns: [], caves: [], strong: [], mid: null };
    if (!e && !(zg && !zg.partial) && this.tunnelAt(S) && !FG.skyZone(S)) {
      caveOut = { spawns: [], ...FG.carveUnderground(r, l, { S, seed: this.seed, rng: E, vt, Ft, codes: { fe, ze, plat: _e }, hasL: this.tunnelAt(S - 1), hasR: this.tunnelAt(S + 1), mid: this.midBossAt(S), regionIdx: m.idx ?? t, forceShaft: FG.shaftChunk(S), noMidShaft: FG.groundPeakChunk(S), slopeCols: new Set((i.slopes ?? []).map((y) => y.x)) }) };
      for (let y = i.hazards.length - 1; y >= 0; y--) {
        const x = i.hazards[y];
        caveOut.shafts.some(([sx, w]) => x.x + (x.w ?? 1) > sx - 1 && x.x < sx + w + 1) && i.hazards.splice(y, 1);
      }
      caveOut.spawns.length && (i.extraSpawns = [...(i.extraSpawns ?? []), ...caveOut.spawns]);
      for (const y of caveOut.slopes ?? []) r[y.row * vt + y.x] === ze && (r[y.row * vt + y.x] = y.code);
    }
    // 빠지면 못 나오는 구덩이에 발판을 놓는다
    zg || FG.fixTraps(r, { vt, Ft, fe, ze, plat: _e });
    let u = l[vt - 1];
    u <= 0 && (u = i.h);
    for (let y = i.hazards.length - 1; y >= 0; y--) {
      const x = i.hazards[y];
      if (x.x < 0 || x.x >= vt) {
        i.hazards.splice(y, 1);
        continue;
      }
      if (x.natural) continue;
      if (x.type === "stalactite") {
        s[x.x] <= 0 ? i.hazards.splice(y, 1) : (x.row = s[x.x]);
        continue;
      }
      if (x.type !== "arrowTrap") {
        if (l[x.x] <= 0) {
          i.hazards.splice(y, 1);
          continue;
        }
        ((x.row = Ft - l[x.x]), (x.w = Math.max(1, Math.min(x.w, vt - x.x))));
        for (let w = 1; w < x.w; w++)
          if (l[x.x + w] !== l[x.x]) {
            x.w = w;
            break;
          }
      }
    }
    const d = [];
    // 구역 설계가 무리·상자를 직접 놓은 구역(층별 몬스터)은 무작위 배치를 쓰지 않는다
    const planned = !!zg?.planned;
    if (!e && S > 0 && !planned) {
      const y = m.density * a.densityMult * (R < 60 ? 0.7 : 1.7) * 0.55;
      let x = Math.floor(y) + (E.chance(y - Math.floor(y)) ? 1 : 0);
      R < 30 && (x = Math.min(x, 2));
      const w = new Set();
      for (let M = 0; M < x; M++) {
        let P = E.weighted(m.enemies, (V) => V.w),
          L = se[P.id];
        let O = -1;
        for (let V = 0; V < 12; V++) {
          const W = E.int(3, vt - 3);
          if (!(i.noSpawn.has(W) || l[W] <= 0 || w.has(W)) && !i.hazards.some((k) => W >= k.x - 1 && W <= k.x + k.w)) {
            O = W;
            break;
          }
        }
        if (O < 0) continue;
        (w.add(O), w.add(O - 1), w.add(O + 1));
        const F = Ft - l[O],
          D = L.flying ? Math.max(s[O] + 2, F - E.int(4, 6)) : F,
          B = E.chance(m.eliteChance + a.eliteBonus),
          I = [];
        B && m.elites && m.elites.length && E.chance(0.6) && ((P = { id: E.pick(m.elites) }), (L = se[P.id]));
        if (B && L.ai !== "golden" && (I.push(E.pick(Ye)), E.chance(0.12 + a.tier * 0.02))) {
          let V = E.pick(Ye);
          V !== I[0] && I.push(V);
        }
        const N = I.length ? 1 : FG.packSize(L, E);
        for (let V = 0; V < N; V++) {
          const W = Math.min(vt - 1, O + V * 2);
          (l[W] <= 0 && !L.flying) ||
            d.push({
              id: `${S}:${d.length}`,
              enemy: P.id,
              x: W,
              row: L.flying ? D : Ft - l[W],
              traits: V === 0 ? I : [],
            });
        }
      }
    }
    // 황금 고블린: 구역마다 낮은 확률로 직접 배치
    // 황금 고블린은 없앴다 (사용자 요청 2026-11-20)
    if (!1 && !e && S > 2 && R >= 60 && E.chance(0.07)) {
      for (let V = 0; V < 10; V++) {
        const W = E.int(4, vt - 4);
        if (l[W] > 0 && !i.noSpawn.has(W) && !i.hazards.some((k) => W >= k.x - 1 && W <= k.x + k.w)) {
          d.push({ id: `${S}:${d.length}`, enemy: "golden", x: W, row: Ft - l[W], traits: [] });
          break;
        }
      }
    }
    // 하늘섬·동굴 층 위의 적
    if (!e && zg?.spawns)
      for (const sp of zg.spawns) {
        if (sp.enemy) {
          // 설계된 무리: 우두머리만 정예가 될 수 있다 (정예 종류는 그 층 목록에서)
          const LP = m.layers?.[sp.layer] ?? m;
          let id = sp.enemy;
          const tr = [];
          // 상자를 지키는 무리는 상자 등급대로 (1 = 정예 특성 · 2 = 정예 종 + 특성 둘), 아니면 무작위
          const forced = sp.guard != null ? sp.elite ?? 0 : -1;
          if (sp.lead && (forced > 0 || (forced < 0 && E.chance(m.eliteChance + a.eliteBonus + (sp.big ? 0.15 : 0))))) {
            LP.elites?.length && (forced === 2 || (forced < 0 && E.chance(0.6))) && (id = E.pick(LP.elites));
            tr.push(E.pick(Ye));
            if (forced === 2 || (forced < 0 && E.chance(0.12 + a.tier * 0.02))) {
              const V = E.pick(Ye);
              V !== tr[0] && tr.push(V);
            }
          }
          // 아직 그림·행동이 없는 몬스터는 건너뛴다
          if (!se[id] || !FG.foeReady(id)) continue;
          const fl = !!se[id]?.flying;
          // 특성 둘을 꼭 받아야 하면 다른 것으로
          forced === 2 && tr.length < 2 && tr.push(Ye[(Ye.indexOf(tr[0]) + 1) % Ye.length]);
          d.push({ id: `${S}:${d.length}`, enemy: id, x: sp.x, row: fl ? Math.floor(sp.fy / gt) : sp.row, py: fl ? sp.fy : sp.py, traits: tr, layer: sp.layer, camp: sp.camp, ox: sp.ox });
          continue;
        }
        const pool = m.enemies.filter((V) => !!se[V.id]?.flying === !!sp.fly);
        if (!pool.length) continue;
        const P = E.weighted(pool, (V) => V.w);
        d.push({ id: `${S}:${d.length}`, enemy: P.id, x: sp.x, row: sp.row, traits: E.chance(m.eliteChance + a.eliteBonus) ? [E.pick(Ye)] : [] });
      }
    // 지하 루트: 강한 적 (정예가 많다) + 중간 보스
    if (!e && caveOut.strong)
      for (const sp of caveOut.strong) {
        const pool = m.enemies.filter((V) => !se[V.id].flying && se[V.id].ai !== "turret");
        const P = E.chance(0.45) && m.elites?.length ? { id: E.pick(m.elites) } : E.weighted(pool.length ? pool : m.enemies, (V) => V.w);
        d.push({ id: `${S}:${d.length}`, enemy: P.id, x: sp.x, row: sp.row, traits: E.chance(0.65) ? [E.pick(Ye)] : [] });
      }
    if (!e && caveOut.mid) {
      const bossId = m.elites?.length ? E.pick(m.elites) : E.weighted(m.enemies, (V) => V.w).id;
      let t1 = E.pick(Ye), t2 = E.pick(Ye);
      t2 === t1 && (t2 = Ye[(Ye.indexOf(t1) + 1) % Ye.length]);
      d.push({ id: `${S}:${d.length}`, enemy: bossId, x: caveOut.mid.x, row: caveOut.mid.row, traits: [t1, t2], mid: 1 });
    }
    // 하늘 루트: 적은 드물게
    if (!e && i.sky)
      for (const sp of i.sky.spawns) {
        const fl = m.enemies.filter((V) => se[V.id].flying);
        fl.length && d.push({ id: `${S}:${d.length}`, enemy: E.pick(fl).id, x: sp.x, row: Math.max(2, sp.row), traits: [] });
      }
    // 직접 그린 맵 조각의 높은 층 적 배치
    if (!e && S > 0 && R >= 30 && i.extraSpawns)
      for (const sp of i.extraSpawns) {
        if (!E.chance(0.55)) continue;
        const P = E.weighted(m.enemies, (V) => V.w);
        d.push({ id: `${S}:${d.length}`, enemy: P.id, x: sp.x, row: sp.row, traits: [] });
      }
    // 예전 이벤트는 더 만들지 않는다 (2026-11-28)
    const f = null;
    const c = S >= v - 1 && S <= v + 1;
    // 추가 보물 상자
    const chests = [];
    if (!e && !c && S > 1 && !planned) {
      const want = (E.chance(0.55) ? 1 : 0) + (E.chance(0.2) ? 1 : 0);
      for (let k = 0; k < want; k++)
        for (let M = 0; M < 14; M++) {
          const P = E.int(4, vt - 5);
          if (
            l[P] > 0 &&
            l[P] === l[P + 1] &&
            l[P] === l[P - 1] &&
            flatOK(P - 1) && flatOK(P) && flatOK(P + 1) &&
            !(f && Math.abs(f.x - P) < 6) &&
            !caveOut.shafts.some(([sx, w]) => P >= sx - 1 && P <= sx + w) &&
            !chests.some((q) => Math.abs(q.x - P) < 6) &&
            !i.hazards.some((L) => P >= L.x - 2 && P <= L.x + L.w + 1)
          ) {
            const rr = E.next();
            chests.push({ x: P, row: Ft - l[P], py: pyAt(P), tier: rr < 0.06 ? 2 : rr < 0.32 ? 1 : 0 });
            break;
          }
        }
    }
    !e && i.sky && chests.push(...i.sky.chests);
    if (FG.pocketChunk(S)) {
      for (const sp of d) E.chance(0.3) && sp.traits.push(E.pick(Ye));
      // 던전 끝 보물: 평평한 칸을 찾아 (자연 지형은 칸 높이가 제각각)
      const near = (P0) => { for (const d2 of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) if (l[P0 + d2] > 0 && flatOK(P0 + d2)) return P0 + d2; return l[P0] > 0 ? P0 : -1; };
      const c1 = near(24), c2 = near(Math.min(c1 < 0 ? 20 : c1 - 4, 20));
      FG.pocketLast(S) && c1 >= 0 && chests.push({ x: c1, row: Ft - l[c1], py: pyAt(c1), tier: 2 });
      FG.pocketLast(S) && c2 >= 0 && c2 !== c1 && chests.push({ x: c2, row: Ft - l[c2], py: pyAt(c2), tier: 1 });
    }
    const p = [...i.decorHints];
    this.decorate(p, l, s, i, m, E);
    // 자연 지형: 장식은 완만한 곳에만, 실제 지면 높이(px)에 세운다
    if (gy)
      for (let k = p.length - 1; k >= 0; k--) {
        const t = p[k], a = gy[t.x - 1] ?? -1, b = gy[t.x + 1] ?? -1, c0 = gy[t.x];
        c0 < 0 || a < 0 || b < 0 || Math.abs(a - b) > 8 ? p.splice(k, 1) : (t.py = c0);
      }
    // 자연 지형: 생성기가 고른 나무·폐허 그림 (실제 지면 높이에 선다)
    zg?.trees && p.push(...zg.trees);
    const g = [];
    for (let y = 0; y < vt; y++) {
      const x = S * vt + y - me;
      x > 0 && x % 100 === 0 && l[y] > 0 && !e && g.push({ x: y, row: Ft - l[y], py: pyAt(y), dist: x });
    }
    return {
      index: S,
      region: m,
      regionIdx: t,
      ground: l,
      ceil: s,
      grid: r,
      hazards: i.hazards,
      spawns: d,
      decor: p,
      event: f,
      chests,
      ug: zg && !zg.partial ? zg.ug : caveOut.ug,
      pools: caveOut.pools,
      clouds: i.sky?.clouds,
      peak: zg?.peak ?? i.sky?.peak ?? null,
      deep: zg?.deep ?? caveOut.deep ?? null,
      arena: e,
      endH: u,
      signs: g,
      fine,
      gy,
      flat,
    };
  }
  fillPatterns(S, T, C, E) {
    const R = S.rng,
      m = C < 120,
      h = [...Object.entries(T.patterns), ["islands", m ? 1 : 4], ["terrace", 3], ["overhang", 3], ["mesa", m ? 1 : 2], ["slopehill", 6], ["ramps", 4], ["skyclimb", m ? 1 : 3]];
    let t = 0;
    for (; S.room > 0 && t++ < 40;) {
      if (S.room < 5) {
        S.flat(S.room);
        break;
      }
      const [a] = R.weighted(h, ([v, o]) =>
        m && ["gap", "platforms", "crumble", "floating", "voidpool"].includes(v) ? o * 0.3 : o,
      );
      this.pattern(a, S, T, C, E);
    }
  }
  maxGap(S) {
    return S < 300 ? 2 : S < 1500 ? 3 : 4;
  }
  pattern(S, T, C, E, R) {
    const h = T.rng,
      m = C.hazards;
    switch (S) {
      case "flat":
        T.flat(h.int(3, 7));
        break;
      case "steps": {
        const t = h.int(2, 3),
          a = T.h > 9 ? -1 : T.h < 5 || h.chance(0.5) ? 1 : -1;
        for (let v = 0; v < t; v++) (T.setH(T.h + a * h.int(1, 2)), T.flat(h.int(2, 3)));
        break;
      }
      case "hill":
      case "dunes": {
        const t = h.int(2, 3);
        (T.rampUp(t), T.flat(h.int(2, 4)), T.rampDown(t), T.flat(2));
        break;
      }
      case "slopehill": {
        // 완만한 언덕: 경사로 올라 꼭대기를 지나 내려온다
        const t = h.int(2, 4);
        (T.flat(1), T.rampUp(t), T.flat(h.int(2, 5)), h.chance(0.4) && (T.rampUp(h.int(1, 2)), T.flat(h.int(2, 3))), T.rampDown(h.int(2, 4)), T.flat(1));
        break;
      }
      case "ramps": {
        // 경사와 턱이 섞인 오르내림
        const up = T.h < 8 || (T.h < 12 && h.chance(0.6));
        for (let k = 0; k < 2; k++) (up ? T.rampUp(h.int(1, 3)) : T.rampDown(h.int(1, 3)), T.flat(h.int(1, 3)), h.chance(0.4) && T.setH(T.h + (up ? 1 : -1)), T.flat(1));
        break;
      }
      case "skyclimb": {
        // 높이 쌓인 섬 계단: 위로 올라갔다가 반대편으로 내려온다
        if (T.room < 20) {
          T.flat(T.room);
          break;
        }
        T.flat(2);
        const x0 = T.x, base = T.surfaceRow();
        T.blocks = T.blocks ?? [];
        let cx = 1, row = base;
        const n = h.int(3, 4);
        for (let k = 0; k < n; k++) {
          row = Math.max(4, row - h.int(2, 3) * (k < n - 1 ? 1 : 0));
          const w = h.int(3, 5);
          T.blocks.push({ x: x0 + cx, row, w, h: h.int(2, 4), taper: 0.7 });
          cx += w + h.int(1, 2);
        }
        T.flat(Math.min(cx + 1, T.room - 2));
        break;
      }
      case "bumps": {
        for (let t = 0; t < 4; t++) (T.setH(T.h + (t % 2 ? -1 : 1)), T.flat(2));
        T.decorHints.push({ key: "d_darktree", x: T.x - 4, row: 0 });
        break;
      }
      case "gap": {
        if (T.room < 9) {
          T.flat(T.room);
          break;
        }
        T.flat(2);
        const t = h.int(2, this.maxGap(E));
        if (E > 200 || C.idx !== 0) T.pit(t);
        else {
          const v = T.h;
          T.setH(Math.max(Vs, v - 2));
          for (let o = 0; o < t; o++) (T.noSpawn.add(T.x), T.push(T.h));
          T.setH(v);
        }
        (T.setH(T.h + h.int(-2, 1)), T.flat(3));
        break;
      }
      case "platforms":
      case "floating": {
        if (T.room < 14) {
          T.flat(T.room);
          break;
        }
        T.flat(2);
        const t = h.int(2, 3),
          a = T.surfaceRow();
        T.x - 1;
        let v = a;
        const o = T.x;
        let n = 0;
        for (let r = 0; r < t; r++) {
          const l = h.int(2, 3),
            s = h.int(2, 3),
            u = Math.max(4, Math.min(Ft - 4, v + h.int(-2, 1))),
            d = o + n + l;
          (T.plats.push({ x: d, row: u, w: s, crumble: S === "floating" && m.includes("crumble") && h.chance(0.4) }),
            (n += l + s),
            (v = u));
        }
        const i = n + 2;
        T.pit(Math.min(i, T.room - 3));
        const e = Ft - v + h.int(-1, 0);
        (T.setH(e), T.flat(3));
        break;
      }
      case "pillar": {
        T.flat(2);
        const t = T.h;
        (T.setH(T.h + h.int(2, 3)), T.flat(h.int(1, 2)), T.setH(t), T.flat(2));
        break;
      }
      case "valley": {
        T.flat(1);
        const t = T.h;
        (T.setH(T.h - h.int(2, 3)), T.flat(h.int(3, 5)), m.includes("stalactite") && T.ceilMode, T.setH(t), T.flat(2));
        break;
      }
      case "ruins": {
        T.flat(1);
        const t = T.x;
        (T.decorHints.push({
          key: (C.theme ?? C.id) === "desert" ? "d_pillar_sand" : (C.theme ?? C.id) === "kingdom" ? "d_column" : "d_ruin",
          x: t + 1,
          row: 0,
        }),
          T.flat(2),
          T.setH(T.h + 2),
          T.flat(2),
          T.setH(T.h - 2),
          T.flat(2),
          T.plats.push({ x: t + 1, row: T.surfaceRow() - 5, w: 5 }));
        break;
      }
      case "spikes": {
        if (E < 60) {
          T.flat(4);
          break;
        }
        T.flat(2);
        const t = T.x,
          a = h.int(2, 3);
        (T.flat(a), T.hazards.push({ type: "spikes", x: t, row: T.surfaceRow(), w: a }));
        for (let v = 0; v < a; v++) T.noSpawn.add(t + v);
        T.flat(2);
        break;
      }
      case "poison":
      case "voidpool":
      case "quicksand": {
        T.flat(2);
        const t = T.x,
          a = h.int(3, 4),
          v = S === "poison" ? "poison" : S === "voidpool" ? "voidPool" : "quicksand",
          o = T.h;
        (T.setH(o - 1), T.flat(a), T.setH(o), T.hazards.push({ type: v, x: t, row: Ft - (o - 1), w: a }));
        for (let n = 0; n < a; n++) T.noSpawn.add(t + n);
        T.flat(2);
        break;
      }
      case "ice": {
        const t = T.x,
          a = h.int(5, 8);
        (T.flat(a), T.hazards.push({ type: "ice", x: t, row: T.surfaceRow(), w: Math.min(a, T.x - t) }));
        break;
      }
      case "canopy": {
        const t = h.int(6, 9),
          a = T.ceilMode;
        ((T.ceilMode = !0), (T.ceilH = Math.max(2, Ft - T.h - Si - 1 - TOPR)), T.flat(t), (T.ceilMode = a));
        break;
      }
      case "ledges": {
        for (let t = 0; t < 3; t++) (T.setH(T.h + (h.chance(0.5) ? h.int(1, 3) : -h.int(1, 3))), T.flat(h.int(2, 3)));
        m.includes("stalactite") && T.ceilMode && T.hazards.push({ type: "stalactite", x: T.x - 2, row: 0, w: 1 });
        break;
      }
      case "crumble": {
        if (T.room < 10) {
          T.flat(T.room);
          break;
        }
        T.flat(2);
        const t = h.int(3, 5),
          a = T.surfaceRow();
        (T.plats.push({ x: T.x, row: a, w: t, crumble: !0 }), T.pit(t), T.flat(3));
        break;
      }
      case "battlement": {
        T.flat(2);
        const t = T.h;
        T.setH(t + 3);
        const a = T.x;
        (T.flat(h.int(4, 6)),
          T.decorHints.push({ key: "d_bannerpole", x: a + 1, row: 0 }),
          m.includes("arrowTrap") && T.hazards.push({ type: "arrowTrap", x: a, row: Ft - t - 1, w: 1 }),
          T.plats.push({ x: a - 2, row: Ft - t - 2, w: 2 }),
          T.setH(t),
          T.flat(2));
        break;
      }
      case "firetrap": {
        T.flat(2);
        const t = T.x;
        (T.flat(6),
          T.hazards.push({ type: "fireJet", x: t + 1, row: T.surfaceRow(), w: 1 }),
          T.hazards.push({ type: "fireJet", x: t + 4, row: T.surfaceRow(), w: 1 }),
          T.noSpawn.add(t + 1),
          T.noSpawn.add(t + 4));
        break;
      }
      case "runes": {
        T.flat(2);
        const t = T.x;
        (T.flat(6),
          T.hazards.push({ type: "arcaneRune", x: t + 2, row: T.surfaceRow(), w: 1 }),
          h.chance(0.5) && T.hazards.push({ type: "arcaneRune", x: t + 5, row: T.surfaceRow(), w: 1 }));
        break;
      }
      case "islands": {
        // 큰 섬들이 떠 있는 구덩이: 덩어리 섬 2~3개를 건너뛴다
        if (T.room < 18) {
          T.flat(T.room);
          break;
        }
        T.flat(2);
        const base = T.surfaceRow(), x0 = T.x, n = h.int(2, 3);
        let cx = 0, row = base;
        T.blocks = T.blocks ?? [];
        for (let k = 0; k < n; k++) {
          const gap = h.int(2, Math.min(3, this.maxGap(E) + 1)), w = h.int(4, 6), th = h.int(3, 4);
          row = Math.max(5, Math.min(Ft - 6, row + h.int(-2, 1)));
          T.blocks.push({ x: x0 + cx + gap, row, w, h: th, taper: 0.6 });
          cx += gap + w;
        }
        T.pit(Math.min(cx + 2, T.room - 3));
        T.setH(Math.max(Vs, Math.min(Gn, Ft - row + h.int(-1, 0))));
        T.flat(3);
        break;
      }
      case "terrace": {
        // 계단식 절벽: 두 번 오르고 높은 곳을 지나 뚝 떨어진다
        const t = T.h;
        T.flat(2);
        T.setH(t + h.int(2, 3));
        T.flat(h.int(3, 4));
        T.setH(T.h + h.int(1, 2));
        T.flat(h.int(4, 6));
        T.setH(t + h.int(-1, 1));
        T.flat(2);
        break;
      }
      case "overhang": {
        // 머리 위로 두꺼운 바위 턱이 떠 있는 구간
        T.flat(2);
        const x0 = T.x, w = h.int(5, 8);
        T.blocks = T.blocks ?? [];
        T.blocks.push({ x: x0 + 1, row: T.surfaceRow() - h.int(4, 5), w, h: h.int(2, 3), taper: 0.8 });
        T.flat(w + 2);
        break;
      }
      case "mesa": {
        // 구덩이 사이 우뚝 솟은 대지
        if (T.room < 12) {
          T.flat(T.room);
          break;
        }
        T.flat(2);
        const t = T.h;
        T.pit(2);
        T.setH(t + h.int(1, 2));
        T.flat(h.int(4, 6));
        T.pit(2);
        T.setH(t);
        T.flat(2);
        break;
      }
      default:
        T.flat(h.int(3, 5));
    }
    (m.includes("stalactite") &&
      T.ceilMode &&
      h.chance(0.25) &&
      T.hazards.push({ type: "stalactite", x: Math.max(1, T.x - 2), row: 0, w: 1 }),
      m.includes("spikes") &&
        S === "flat" &&
        E > 60 &&
        h.chance(0.12) &&
        T.x > 4 &&
        (T.hazards.push({ type: "spikes", x: T.x - 2, row: T.surfaceRow(), w: 1 }), T.noSpawn.add(T.x - 2)),
      m.includes("fireJet") &&
        S === "flat" &&
        h.chance(0.15) &&
        T.x > 3 &&
        T.hazards.push({ type: "fireJet", x: T.x - 2, row: T.surfaceRow(), w: 1 }),
      m.includes("arcaneRune") &&
        S === "flat" &&
        h.chance(0.15) &&
        T.x > 3 &&
        T.hazards.push({ type: "arcaneRune", x: T.x - 2, row: T.surfaceRow(), w: 1 }),
      m.includes("voidPool") &&
        S === "flat" &&
        h.chance(0.1) &&
        T.x > 3 &&
        T.hazards.push({ type: "voidPool", x: T.x - 2, row: T.surfaceRow(), w: 1 }),
      m.includes("ice") &&
        S !== "ice" &&
        h.chance(0.15) &&
        T.x > 4 &&
        T.hazards.push({ type: "ice", x: T.x - 3, row: T.surfaceRow(), w: 3 }));
  }
  validate(S) {
    const T = S.cols;
    for (; T.length < vt;) T.push({ g: S.h, c: 0 });
    ((T.length = vt), T[vt - 1].g <= 0 && (T[vt - 1].g = S.h));
    let C = -1;
    for (let E = 0; E < vt; E++) {
      const R = T[E];
      if (!(R.g <= 0)) {
        if (C >= 0) {
          const h = T[C],
            m = E - C - 1,
            t = R.g - h.g;
          if (m === 0) t > ci && (R.g = h.g + ci);
          else if (!S.plats.some((v) => v.x > C && v.x <= E) && !(S.blocks ?? []).some((v) => v.x + v.w > C && v.x <= E) && !ys(m, t))
            if (ys(m, Math.min(t, 0))) R.g = Math.min(R.g, h.g);
            else {
              const v = C + 1 + Math.floor(m / 2);
              (S.plats.push({ x: v, row: Ft - h.g, w: 1 }), (R.g = Math.min(R.g, h.g + 1)));
            }
          R.c > 0 && Ft - R.g - R.c < Si && (R.c = Math.max(0, Ft - R.g - Si));
        }
        C = E;
      }
    }
    S.plats = S.plats.filter((E) => E.x >= 0 && E.x < vt);
    for (const E of S.plats) {
      E.w = Math.min(E.w, vt - E.x);
      if (E.fixed) continue;
      const R = T[Math.min(vt - 1, Math.max(0, E.x - 1))],
        h = T[Math.min(vt - 1, E.x + E.w)],
        m = Math.min(R.g > 0 ? Ft - R.g : 99, h.g > 0 ? Ft - h.g : 99);
      m < 99 && m - E.row > ci + 1 && (E.row = m - (ci + 1));
      const t = T[Math.min(vt - 1, E.x)].c;
      t > 0 && E.row - t < 3 && (E.row = t + 3);
    }
    S.h = T[vt - 1].g;
  }
  decorate(S, T, C, E, R, h) {
    const m = R.theme ?? R.id,
      t = {
        plains: ["d_grass", "d_grass", "d_flower", "d_rock", "d_tree", "d_grass"],
        forest: ["d_mushroom", "d_glowshroom", "d_darktree", "d_grass", "d_mushroom"],
        cave: ["d_crystal", "d_stalag", "d_rock", "d_glowshroom"],
        desert: ["d_cactus", "d_bones", "d_rock", "d_pillar_sand"],
        snow: ["d_pine", "d_snowrock", "d_pine", "d_snowrock"],
        fortress: ["d_torch", "d_barrel", "d_bannerpole", "d_torch"],
        abyss: ["d_voidcrystal", "d_tendril", "d_tendril", "d_bones"],
        kingdom: ["d_statue", "d_lamp_arcane", "d_column", "d_grass"],
      },
      a = FRDECOR[R.look ?? R.bgId ?? R.id] ?? t[m] ?? t.plains;
    if (a.length)
    for (let v = 1; v < vt - 1; v++)
      T[v] <= 0 ||
        E.hazards.some((o) => v >= o.x && v < o.x + o.w) ||
        (h.chance(0.42) && S.push({ key: h.pick(a), x: v, row: Ft - T[v], flip: h.chance(0.5) }));
    for (const v of S) v.row === 0 && (v.row = Ft - Math.max(1, T[Math.max(0, Math.min(vt - 1, v.x))]));
  }
}
Ht.length;
const At = {
    top: 0,
    top2: 1,
    fill: 2,
    fill2: 3,
    deep: 4,
    topL: 5,
    topR: 6,
    sideL: 7,
    sideR: 8,
    ceil: 9,
    platL: 10,
    platM: 11,
    platR: 12,
    wall: 13,
    fill3: 14,
    crumble: 15,
  },
  Vn = 16;
function Kt(A, S, T) {
  let C = (A * 374761393 + S * 668265263 + T * 2147483647) | 0;
  return ((C = Math.imul(C ^ (C >>> 13), 1274126177)), ((C ^ (C >>> 16)) >>> 0) / 4294967296);
}
function Te(A, S, T, C, E = !1) {
  const R = T.pal,
    h = E ? Ke(R.soil, R.soilDark, 0.6) : R.soil;
  for (let m = 0; m < 16; m++)
    for (let t = 0; t < 16; t++) {
      const a = Kt(t, m, C);
      let v = h;
      (a < 0.12 ? (v = st(h, -0.15)) : a > 0.9 && (v = st(h, 0.1)), A.px(t, m, v));
    }
  switch (S) {
    case "plains":
    case "forest":
      for (let m = 0; m < 3; m++) {
        const t = Math.floor(Kt(m, 7, C) * 13),
          a = Math.floor(Kt(m, 9, C) * 13);
        (A.rect(t, a, 3, 2, R.rock), A.px(t, a, st(R.rock, 0.3)));
      }
      if (S === "forest") {
        const m = Math.floor(Kt(3, 3, C) * 12);
        A.line(0, m, 15, m + 3, st(R.soil, 0.2));
      }
      break;
    case "cave":
    case "abyss":
      for (let m = 0; m < 4; m++) {
        const t = Math.floor(Kt(m, 2, C) * 14),
          a = Math.floor(Kt(m, 5, C) * 14);
        A.rect(t, a, 2, 2, st(h, 0.12));
      }
      A.line(Math.floor(Kt(1, 1, C) * 8), 0, Math.floor(Kt(2, 1, C) * 16), 15, st(h, -0.25));
      break;
    case "desert":
      for (let m = 0; m < 16; m += 4) A.rect(0, m + (C % 2), 16, 1, st(h, -0.1));
      break;
    case "snow":
      for (let m = 0; m < 3; m++) {
        const t = Math.floor(Kt(m, 4, C) * 14),
          a = Math.floor(Kt(m, 8, C) * 14);
        (A.px(t, a, R.soilHi), A.px(t + 1, a, st(R.soilHi, 0.3)));
      }
      break;
    case "fortress":
    case "kingdom": {
      const m = st(h, -0.3),
        t = C % 2 ? 4 : 0;
      (A.rect(0, 7, 16, 1, m),
        A.rect(0, 15, 16, 1, m),
        A.rect((8 + t) % 16, 0, 1, 7, m),
        A.rect(t, 8, 1, 7, m),
        A.rect(0, 0, 16, 1, st(h, 0.12)),
        A.rect(0, 8, 16, 1, st(h, 0.12)));
      break;
    }
  }
}
function vi(A, S, T, C) {
  const E = T.pal;
  switch ((Te(A, S, T, C), S)) {
    case "plains":
    case "forest": {
      (A.rect(0, 0, 16, 4, E.top), A.rect(0, 0, 16, 1, E.topHi));
      for (let R = 0; R < 16; R++) {
        const h = Math.floor(Kt(R, 0, C) * 3);
        (A.rect(R, 4, 1, h, E.top), h > 1 && A.px(R, 4 + h, st(E.top, -0.3)));
      }
      for (let R = 1; R < 16; R += 3) Kt(R, 1, C) > 0.5 && A.px(R, 1, st(E.topHi, 0.3));
      break;
    }
    case "cave":
    case "abyss": {
      (A.rect(0, 0, 16, 3, E.top), A.rect(0, 0, 16, 1, E.topHi));
      for (let R = 0; R < 16; R++) Kt(R, 3, C) > 0.6 && A.px(R, 3, E.top);
      if (S === "abyss") for (let R = 0; R < 16; R += 5) A.px(R + (C % 3), 1, E.accent);
      break;
    }
    case "desert": {
      (A.rect(0, 0, 16, 5, E.top), A.rect(0, 0, 16, 1, E.topHi));
      for (let R = 0; R < 16; R++) A.px(R, 2 + Math.round(Math.sin((R + C) * 0.8)), st(E.top, -0.08));
      for (let R = 0; R < 16; R++) Kt(R, 5, C) > 0.4 && A.px(R, 5, E.top);
      break;
    }
    case "snow": {
      (A.rect(0, 0, 16, 6, E.top), A.rect(0, 0, 16, 1, 16777215), A.rect(0, 5, 16, 1, 14215416));
      for (let R = 0; R < 16; R++) {
        const h = Math.floor(Kt(R, 2, C) * 3);
        A.rect(R, 6, 1, h, 14740728);
      }
      A.px(Math.floor(Kt(1, 9, C) * 15), 2, 12640511);
      break;
    }
    case "fortress": {
      (A.rect(0, 0, 16, 4, E.top),
        A.rect(0, 0, 16, 1, E.topHi),
        A.rect(0, 3, 16, 1, st(E.top, -0.35)),
        A.rect(7, 0, 1, 3, st(E.top, -0.25)));
      break;
    }
    case "kingdom": {
      (A.rect(0, 0, 16, 4, E.top),
        A.rect(0, 0, 16, 1, E.topHi),
        A.rect(0, 4, 16, 1, 12623936),
        A.rect(0, 3, 16, 1, st(E.top, -0.2)),
        A.px(4, 2, st(E.top, -0.12)),
        A.px(11, 1, st(E.top, -0.12)));
      break;
    }
  }
}
function pi(A, S, T) {
  const C = T ? 0 : 15;
  for (let E = 0; E < 16; E++) A.px(C, E, st(S.pal.soil, -0.4));
  for (let E = 0; E < 16; E += 2) A.px(T ? 1 : 14, E, st(S.pal.soil, -0.2));
}
function Ui(A, S, T, C) {
  const E = T.pal,
    R =
      S === "fortress"
        ? 8018490
        : S === "kingdom"
          ? E.top
          : S === "cave" || S === "abyss"
            ? E.rock
            : S === "snow"
              ? 10537192
              : 9071170;
  (A.rect(0, 0, 16, 6, R),
    A.rect(0, 0, 16, 1, st(R, 0.35)),
    A.rect(0, 5, 16, 1, st(R, -0.4)),
    S === "snow" && A.rect(0, 0, 16, 2, 16777215),
    (S === "plains" || S === "forest" || S === "desert") && (A.px(4, 3, st(R, -0.3)), A.px(12, 2, st(R, -0.3))),
    C === 0 && (A.rect(0, 0, 1, 6, st(R, -0.4)), A.rect(2, 6, 2, 4, st(R, -0.3))),
    C === 2 && (A.rect(15, 0, 1, 6, st(R, -0.4)), A.rect(12, 6, 2, 4, st(R, -0.3))),
    S === "kingdom" && A.rect(0, 5, 16, 1, 12623936));
}
function es(A, S) {
  const T = `tiles_${S.id}`;
  if (A.textures.exists(T)) return T;
  if (FG.tiles(A, S, T)) return T;
  const C = Bs(S),
    E = [];
  for (let R = 0; R < Vn; R++) {
    const h = new ht(16, 16);
    switch (R) {
      case At.top:
        vi(h, C, S, 1);
        break;
      case At.top2:
        vi(h, C, S, 2);
        break;
      case At.fill:
        Te(h, C, S, 3);
        break;
      case At.fill2:
        (Te(h, C, S, 4),
          C === "cave" &&
            (h.poly(
              [
                [5, 12],
                [8, 3],
                [11, 12],
              ],
              S.pal.accent,
            ),
            h.line(7, 5, 8, 10, 14745599)),
          C === "abyss" && (h.line(2, 14, 13, 2, S.pal.accent), h.px(8, 8, 16777215)),
          C === "kingdom" && h.circle(8, 4, 2, 8429823),
          C === "desert" && (h.circle(10, 10, 2, 14209200), h.px(9, 9, 16777215)),
          C === "plains" && (h.rect(4, 6, 6, 4, 10130568), h.rect(4, 6, 6, 1, 12630184)));
        break;
      case At.deep:
        Te(h, C, S, 5, !0);
        break;
      case At.topL:
        (vi(h, C, S, 6), pi(h, S, !0), h.clearPx(0, 0));
        break;
      case At.topR:
        (vi(h, C, S, 7), pi(h, S, !1), h.clearPx(15, 0));
        break;
      case At.sideL:
        (Te(h, C, S, 8), pi(h, S, !0));
        break;
      case At.sideR:
        (Te(h, C, S, 9), pi(h, S, !1));
        break;
      case At.ceil:
        (Te(h, C, S, 10, !0), h.rect(0, 13, 16, 3, st(S.pal.soilDark, -0.3)));
        for (let m = 0; m < 16; m += 4)
          h.poly(
            [
              [m, 15],
              [m + 2, 15 + (m % 8, 0)],
              [m + 1, 16],
            ],
            st(S.pal.soilDark, -0.4),
          );
        if (C === "snow") for (let m = 1; m < 16; m += 5) h.line(m, 13, m, 15, 12642559);
        break;
      case At.platL:
        Ui(h, C, S, 0);
        break;
      case At.platM:
        Ui(h, C, S, 1);
        break;
      case At.platR:
        Ui(h, C, S, 2);
        break;
      case At.wall: {
        const m = Ke(S.pal.soilDark, S.pal.sky[0], 0.4);
        if ((h.rect(0, 0, 16, 16, m), C === "fortress" || C === "kingdom"))
          (h.rect(0, 7, 16, 1, st(m, -0.3)), h.rect(8, 0, 1, 7, st(m, -0.3)), h.rect(3, 8, 1, 8, st(m, -0.3)));
        else for (let t = 0; t < 6; t++) h.px(Math.floor(Kt(t, 1, 11) * 16), Math.floor(Kt(t, 2, 11) * 16), st(m, 0.1));
        break;
      }
      case At.fill3:
        Te(h, C, S, 12);
        break;
      case At.crumble: {
        (h.rect(0, 0, 16, 16, st(S.pal.rock, -0.1)),
          h.rect(0, 0, 16, 2, st(S.pal.rock, 0.3)),
          h.line(3, 2, 6, 9, st(S.pal.rock, -0.5)),
          h.line(6, 9, 4, 15, st(S.pal.rock, -0.5)),
          h.line(11, 2, 9, 8, st(S.pal.rock, -0.5)),
          h.line(9, 8, 13, 13, st(S.pal.rock, -0.5)),
          h.rect(0, 15, 16, 1, st(S.pal.rock, -0.5)));
        break;
      }
    }
    E.push(h);
  }
  return (Et(A, T, E, 16, 16), T);
}
function Je(A, S, T, C) {
  return {
    x: A,
    y: S,
    w: T,
    h: C,
    vx: 0,
    vy: 0,
    onGround: !1,
    hitWall: 0,
    groundCode: 0,
    dropThrough: 0,
    groundGtx: 0,
    groundRow: 0,
  };
}
class zn {
  constructor(S, T) {
    Z(this, "gen");
    Z(this, "originChunk", 0);
    Z(this, "loaded", new Map());
    Z(this, "rtPool", []);
    Z(this, "crumbles", new Map());
    Z(this, "gates", new Set());
    Z(this, "onLoad", () => {});
    Z(this, "onUnload", () => {});
    ((this.scene = S), (this.gen = new Xn(T)));
  }
  lx(S) {
    return (S - this.originChunk * vt) * gt;
  }
  gtx(S) {
    return Math.floor(S / gt) + this.originChunk * vt;
  }
  distAt(S) {
    return S / gt + this.originChunk * vt - me;
  }
  chunkOfLocal(S) {
    return Math.floor(this.gtx(S) / vt);
  }
  code(S, T) {
    if (T < 0 || T >= Ft) return ze;
    if (S < 0 || this.gates.has(S) || SKY_EDGE.has(S)) return fe;
    const C = this.rawCode(S, T);
    if (C === Ti) {
      const E = this.crumbles.get(`${S},${T}`);
      if (E && E.state === "gone") return ze;
    }
    return C;
  }
  rawCode(S, T) {
    const C = Math.floor(S / vt);
    return this.gen.get(C).grid[T * vt + (S - C * vt)];
  }
  solid(S, T) {
    return this.code(S, T) === fe;
  }
  standable(S, T) {
    const C = this.code(S, T);
    return C !== ze && C !== 7;
  }
  solidAtPx(S, T) {
    return this.solid(this.gtx(S), Math.floor(T / gt));
  }
  surfaceBelow(S, T) {
    for (let C = Math.max(0, T); C < Ft; C++) if (this.standable(S, C)) return C;
    return -1;
  }
  groundRowAt(S) {
    const T = Math.floor(S / vt),
      E = this.gen.get(T).ground[S - T * vt];
    return E > 0 ? Ft - E : -1;
  }
  move(S, T, C = !0) {
    if (((S.hitWall = 0), !C)) {
      ((S.x += S.vx * T), (S.y += S.vy * T));
      return;
    }
    const E = Math.max(Math.abs(S.vx * T), Math.abs(S.vy * T)),
      R = Math.max(1, Math.ceil(E / 6)),
      h = T / R;
    const wasG = S.onGround;
    S.onGround = !1;
    for (let m = 0; m < R; m++) (this.moveX(S, S.vx * h), this.moveY(S, S.vy * h), this.slopeSnap(S, wasG));
    S.dropThrough > 0 && (S.dropThrough -= T);
    S.slopeT > 0 && (S.slopeT -= T);
  }
  // 경사: 4 = 오른쪽으로 오르막, 5 = 오른쪽으로 내리막. 발 중심을 경사면에 붙인다
  slopeSnap(S, wasG) {
    if (S.vy < -1) return;
    const col = this.gtx(S.x), r0 = Math.floor((S.y - 0.01) / gt);
    for (let r = r0 - 1; r <= r0 + 1; r++) {
      const v = this.code(col, r);
      if (v !== 4 && v !== 5) continue;
      const fx = Math.max(0, Math.min(gt, S.x - this.lx(col)));
      const sy = r * gt + (v === 4 ? gt - fx : fx);
      if (S.y >= sy - (wasG || S.onGround ? 8 : 0) && S.y <= sy + gt) {
        ((S.y = sy), (S.vy = 0), (S.onGround = !0), (S.groundCode = fe), (S.groundGtx = col), (S.groundRow = r), (S.slopeT = 0.25));
        return;
      }
    }
    // 경사 끝에서 평지로 넘어갈 때 살짝 박힌 몸을 위로 올림
    const v0 = this.code(col, r0);
    if ((v0 === fe || v0 === _e) && !this.solid(col, r0 - 1) && S.y - r0 * gt <= 9 && (wasG || S.onGround) && S.slopeT > 0)
      ((S.y = r0 * gt), (S.vy = 0), (S.onGround = !0), (S.groundCode = v0), (S.groundGtx = col), (S.groundRow = r0));
  }
  moveX(S, T) {
    if (T === 0) return;
    const C = S.x + T,
      E = T > 0 ? C + S.w / 2 : C - S.w / 2,
      R = this.gtx(E),
      h = Math.floor((S.y - S.h + 0.5) / gt),
      m = Math.floor((S.y - 0.5) / gt);
    for (let t = h; t <= m; t++)
      if (this.solid(R, t)) {
        if (t === m && t * gt > S.y - 9 && !this.solid(R, t - 1) && !this.solid(R, Math.floor((t * gt - S.h + 0.5) / gt)) && (S.onGround || this.code(this.gtx(S.x), t) === 4 || this.code(this.gtx(S.x), t) === 5 || this.code(this.gtx(S.x), t - 1) === 4 || this.code(this.gtx(S.x), t - 1) === 5)) continue;
        ((S.x = T > 0 ? this.lx(R) - S.w / 2 - 0.01 : this.lx(R + 1) + S.w / 2 + 0.01),
          (S.vx = 0),
          (S.hitWall = T > 0 ? 1 : -1));
        return;
      }
    S.x = C;
    // 한 칸 턱을 넘었으면 발을 턱 위로 올린다 (안 올리면 벽 속에 박힘)
    const fr = Math.floor((S.y - 0.5) / gt);
    this.solid(R, fr) && !this.solid(R, fr - 1) && (S.y = fr * gt);
  }
  moveY(S, T) {
    if (T === 0) return;
    const C = S.y + T,
      E = this.gtx(S.x - S.w / 2 + 0.5),
      R = this.gtx(S.x + S.w / 2 - 0.5);
    if (T > 0) {
      // 발이 이미 블록 속이면 위로 빼낸다
      const fr = Math.floor((S.y - 0.5) / gt), cx = this.gtx(S.x);
      if (this.solid(cx, fr) && !this.solid(cx, fr - 1) && S.y - fr * gt < 12) {
        ((S.y = fr * gt), (S.vy = 0), (S.onGround = !0), (S.groundCode = fe), (S.groundGtx = cx), (S.groundRow = fr));
        return;
      }
      const h = Math.floor((S.y - 1e-4) / gt),
        m = Math.floor((C - 1e-4) / gt);
      for (let t = h + 1; t <= m; t++)
        for (let a = E; a <= R; a++) {
          const v = this.code(a, t);
          if (v === 4 || v === 5 || v === 7) continue;
          if (!(v === ze || ((v === _e || v === Ti || v === 6) && (S.dropThrough > 0 || S.y > t * gt + 0.5)))) {
            ((S.y = t * gt),
              (S.vy = 0),
              (S.onGround = !0),
              (S.groundCode = v),
              (S.groundGtx = a),
              (S.groundRow = t),
              v === Ti && this.touchCrumble(a, t));
            return;
          }
        }
      S.y = C;
    } else {
      const h = Math.floor((S.y - S.h) / gt),
        m = Math.floor((C - S.h) / gt);
      for (let t = h - 1; t >= m; t--)
        for (let a = E; a <= R; a++)
          if (this.solid(a, t)) {
            ((S.y = (t + 1) * gt + S.h + 0.01), (S.vy = 0));
            return;
          }
      S.y = C;
    }
  }
  ledgeAhead(S, T, C = 6) {
    const E = S.x + T * (S.w / 2 + C),
      R = this.gtx(E),
      h = Math.floor((S.y + 1) / gt);
    for (let m = 0; m < 3; m++) if (this.standable(R, h + m)) return !1;
    return !0;
  }
  wallAhead(S, T) {
    const C = this.gtx(S.x + T * (S.w / 2 + 3)),
      E = Math.floor((S.y - 2) / gt);
    return this.solid(C, E) || this.solid(C, E - 1);
  }
  lineOfSight(S, T, C, E) {
    const R = Math.hypot(C - S, E - T),
      h = Math.ceil(R / 8);
    for (let m = 1; m < h; m++) {
      const t = S + ((C - S) * m) / h,
        a = T + ((E - T) * m) / h;
      if (this.solidAtPx(t, a)) return !1;
    }
    return !0;
  }
  touchCrumble(S, T) {
    const C = `${S},${T}`;
    let E = this.crumbles.get(C);
    (E || ((E = { state: "solid", t: 0, baseY: T * gt }), this.crumbles.set(C, E)),
      E.state === "solid" && ((E.state = "shaking"), (E.t = 0.45)));
  }
  updateCrumbles(S, T) {
    for (const [C, E] of this.crumbles)
      if (E.state === "shaking")
        ((E.t -= S),
          E.sprite && (E.sprite.x = E.sprite.getData("bx") + (Math.random() - 0.5) * 2),
          E.t <= 0 &&
            ((E.state = "gone"),
            (E.t = 4),
            E.sprite &&
              ((E.sprite.x = E.sprite.getData("bx")),
              this.scene.tweens.add({ targets: E.sprite, y: E.baseY + 40, alpha: 0, duration: 400 }))));
      else if (E.state === "gone" && ((E.t -= S), E.t <= 0)) {
        const [R, h] = C.split(",").map(Number),
          m = this.lx(R),
          t = h * gt;
        (T.x + T.w / 2 > m && T.x - T.w / 2 < m + gt && T.y > t && T.y - T.h < t + gt) ||
          ((E.state = "solid"),
          E.sprite &&
            (this.scene.tweens.killTweensOf(E.sprite),
            (E.sprite.y = E.baseY),
            (E.sprite.alpha = 0),
            this.scene.tweens.add({ targets: E.sprite, alpha: 1, duration: 300 })));
      }
  }
  // 지형은 조각(가로 512px) × 띠(세로 BANDH px)로 나눠 그린다: 화면 가까운 띠만 그림판을 만든다
  // (지도가 매우 높아서 조각 하나를 통째로 그리면 그림판이 너무 크다)
  bandRange() {
    const cam = this.scene.cameras.main, BH = FG.BANDH;
    const y0 = cam.scrollY - 220, y1 = cam.scrollY + xt + 220;
    return [Math.max(0, Math.floor(y0 / BH)), Math.min(Math.ceil(Oe / BH) - 1, Math.floor(y1 / BH))];
  }
  update(S) {
    const T = this.chunkOfLocal(S);
    // 구역 밖 조각은 불러오지 않는다 (벽 너머는 비어 있다)
    for (let C = Math.max(0, T - 2); C <= T + 3; C++) this.loaded.has(C) || !FG.chunkSameZone(C, T) || this.loadChunk(C);
    for (const [C, E] of this.loaded) (C < T - 3 || C > T + 4 || !FG.chunkSameZone(C, T)) && this.unloadChunk(C, E);
    // 화면 높이 가까운 띠만
    const [b0, b1] = this.bandRange();
    for (const [C, E] of this.loaded) {
      for (let b = b0; b <= b1; b++) E.bands.has(b) || this.loadBand(C, E, b);
      for (const [b, B] of E.bands) (b < b0 - 1 || b > b1 + 1) && this.unloadBand(E, b, B);
    }
    // 곧 보일 띠(위아래 한 칸, 앞뒤 조각)를 미리 조금씩 그려 둔다
    if (FG.prepaint) {
      const pre = (C, b) => {
        if (b < 0 || b * FG.BANDH >= Oe) return;
        const d = this.gen.get(C);
        FG.prepaint(this.scene, d, C * vt, (a, v) => this.rawCode(a, v), d.region, b);
      };
      for (const [C, E] of this.loaded) for (const b of [b0 - 1, b1 + 1]) E.bands.has(b) || pre(C, b);
      for (const C of [T + 4, T - 3]) if (C >= 0 && !this.loaded.has(C) && FG.chunkSameZone(C, T)) for (let b = b0; b <= b1; b++) pre(C, b);
    }
    FG.prepaintStep && FG.prepaintStep(5);
    this.gen.trim(T, 14);
  }
  loadChunk(S) {
    const T = this.gen.get(S);
    // 옆 구역은 벽 너머라 미리 만들 필요가 없다 (구역 하나를 통째로 설계하므로 비싸다)
    FG.chunkSameZone(S, S + 1) && this.gen.get(S + 1);
    const m = { data: T, bands: new Map() };
    (this.loaded.set(S, m), this.onLoad(T));
  }
  loadBand(S, M, b) {
    const T = M.data,
      C = es(this.scene, T.region),
      BH = FG.BANDH,
      Y0 = b * BH,
      bh = Math.min(BH, Oe - Y0);
    let E = this.rtPool.pop();
    (E || (E = this.scene.add.renderTexture(0, 0, Vi, BH).setOrigin(0, 0)),
      E.setVisible(!0).setActive(!0),
      E.clear(),
      E.setPosition(this.lx(S * vt), Y0).setDepth(0));
    const R = [];
    E.beginDraw();
    for (const t of T.decor) {
      t.nat && FG.natDecorTex && FG.natDecorTex(this.scene, t.key);
      const a = this.scene.textures.get(t.key);
      if (!a || a.key === "__MISSING") continue;
      const v = a.getSourceImage(), y = (t.py ?? t.row * gt) - v.height + 1;
      y + v.height > Y0 && y < Y0 + bh && E.batchDraw(t.key, t.x * gt + 8 - v.width / 2, y - Y0);
    }
    for (const t of T.signs) {
      const y = (t.py ?? t.row * gt) - 28;
      y + 30 > Y0 && y < Y0 + bh && E.batchDraw("milestone_post", t.x * gt + 2, y - Y0);
    }
    const h = S * vt, r0 = Math.floor(Y0 / gt), r1 = Math.min(Ft, Math.ceil((Y0 + bh) / gt));
    for (let t = 0; t < vt; t++) {
      const a = h + t;
      for (let v = r0; v < r1; v++) {
        const o = T.grid[v * vt + t];
        if (o === ze) continue;
        let n;
        if ((o === fe || o === _e || o >= 4) && FG.paintChunk) continue;
        if (o >= 4) continue;
        if (o === fe) {
          const i = v > 0 && this.rawCode(a, v - 1) === fe,
            e = v < Ft - 1 ? this.rawCode(a, v + 1) === fe : !0,
            r = this.rawCode(a - 1, v) === fe || a - 1 < 0,
            l = this.rawCode(a + 1, v) === fe,
            s = Ge(a, v);
          if (!i) n = r ? (l ? (s % 3 === 0 ? At.top2 : At.top) : At.topR) : At.topL;
          else if (!e) n = At.ceil;
          else if (!r) n = At.sideL;
          else if (!l) n = At.sideR;
          else {
            let u = 0;
            for (let d = 1; d <= 4 && v - d >= 0 && this.rawCode(a, v - d) === fe; d++) u = d;
            n =
              u >= 4 ? (s % 11 === 0 ? At.fill2 : At.deep) : s % 9 === 0 ? At.fill2 : s % 3 === 0 ? At.fill3 : At.fill;
          }
        } else if (o === _e) {
          const i = this.rawCode(a - 1, v) === _e,
            e = this.rawCode(a + 1, v) === _e;
          n = i ? (e ? At.platM : At.platR) : At.platL;
        } else {
          const i = this.scene.add
            .image(this.lx(a), v * gt, C, At.crumble)
            .setOrigin(0, 0)
            .setDepth(1);
          i.setData("bx", i.x);
          const e = this.crumbles.get(`${a},${v}`) ?? { state: "solid", t: 0, baseY: v * gt };
          ((e.sprite = i), this.crumbles.set(`${a},${v}`, e), e.state === "gone" && i.setAlpha(0), R.push(i));
          continue;
        }
        E.batchDrawFrame(C, n, t * gt, v * gt - Y0);
      }
    }
    E.endDraw();
    FG.paintChunk && FG.paintChunk(this.scene, E, T, h, (a, v) => this.rawCode(a, v), T.region, b);
    for (const t of T.signs) {
      const y = (t.py ?? t.row * gt) - 27;
      if (!(y + 12 > Y0 && y < Y0 + bh)) continue;
      const a = this.scene.add.text(0, 0, `${t.dist}`, { fontFamily: Di, fontSize: "8px", color: "#3a2a1a" });
      (E.draw(a, t.x * gt + 2 + 6 - a.width / 2, y - Y0), a.destroy());
    }
    M.bands.set(b, { rt: E, crumbleSprites: R });
  }
  unloadBand(M, b, B) {
    (B.rt.setVisible(!1).setActive(!1), this.rtPool.push(B.rt));
    for (const E of B.crumbleSprites) (this.scene.tweens.killTweensOf(E), E.destroy());
    M.bands.delete(b);
  }
  // 조각을 옮긴 뒤(기준 조각이 바뀜) 띠 그림판 자리 다시 맞추기
  placeBands() {
    for (const [a, v] of this.loaded) for (const B of v.bands.values()) B.rt.x = this.lx(a * vt);
  }
  unloadChunk(S, T) {
    this.onUnload(T.data);
    for (const [b, B] of T.bands) this.unloadBand(T, b, B);
    const C = S * vt;
    for (const [E, R] of this.crumbles) {
      const h = Number(E.split(",")[0]);
      h >= C && h < C + vt && ((R.sprite = void 0), R.state !== "gone" && this.crumbles.delete(E));
    }
    this.loaded.delete(S);
  }
  maybeRebase(S) {
    if (Math.abs(S) < tn) return 0;
    const C = (S > 0 ? 1 : -1) * en;
    if (this.originChunk + C < 0) return 0;
    this.originChunk += C;
    const E = C * Vi;
    for (const [R, h] of this.loaded)
      for (const B of h.bands.values()) {
        B.rt.x = this.lx(R * vt);
        for (const m of B.crumbleSprites) ((m.x -= E), m.setData("bx", m.getData("bx") - E));
      }
    return E;
  }
  destroy() {
    for (const [S, T] of this.loaded) this.unloadChunk(S, T);
    for (const S of this.rtPool) S.destroy();
    this.rtPool = [];
  }
}
// 자연 지형: 픽셀 단위 충돌로 move·moveX·moveY·solidAtPx·ledgeAhead·wallAhead를 바꾼다 (예전 칸 지형도 그대로 처리)
installFinePhysics(zn.prototype, { gt, vt, Oe, fe, ze, plat: _e, SKY_EDGE, Ft });
class ai {
  constructor() {
    Z(this, "map", new Map());
  }
  apply(S, T, C = 0) {
    if (Math.random() > S.chance) return !1;
    const E = S.dur * (1 - C * 0.5),
      R = this.map.get(S.type),
      h = (S.power ?? 0) * T;
    return (
      R
        ? ((R.t = Math.max(R.t, E)),
          (S.type === "poison" || S.type === "bleed") && (R.stacks = Math.min(3, R.stacks + 1)),
          (R.power = Math.max(R.power, h)))
        : this.map.set(S.type, { t: E, power: h, tick: 0.5, stacks: 1 }),
      !0
    );
  }
  has(S) {
    var T;
    return (((T = this.map.get(S)) == null ? void 0 : T.t) ?? 0) > 0;
  }
  get(S) {
    return this.map.get(S);
  }
  clear(S) {
    S ? this.map.delete(S) : this.map.clear();
  }
  update(S, T) {
    for (const [C, E] of this.map)
      ((E.t -= S),
        (C === "burn" || C === "poison" || C === "bleed") &&
          ((E.tick -= S), E.tick <= 0 && ((E.tick += 0.5), T(E.power * 0.5 * E.stacks, C))),
        E.t <= 0 && this.map.delete(C));
  }
  slowMult() {
    if (this.has("freeze") || this.has("stun")) return 0;
    const S = this.map.get("chill");
    return S && S.t > 0 ? 1 - Math.min(0.7, S.power > 0 && S.power < 1 ? S.power : 0.4) : 1;
  }
}
const Yn = {
    phys: "#ffffff",
    fire: "#ff9040",
    ice: "#90e0ff",
    poison: "#a0e060",
    dark: "#d090ff",
    arcane: "#a0b8ff",
    lightning: "#fff070",
    wind: "#c8ffe0",
    earth: "#e0b878",
    light: "#fff8c0",
  },
  De = [
    {
      id: "maxHp",
      name: "최대 체력",
      desc: "생존력 증가",
      maxLevel: 30,
      fmt: "flat",
      costBase: 40,
      costGrowth: 1.2,
      tiers: [
        { upTo: 10, value: 15 },
        { upTo: 20, value: 9 },
        { upTo: 30, value: 5 },
      ],
    },
    {
      id: "atk",
      name: "공격력",
      desc: "모든 공격 피해 증가",
      maxLevel: 30,
      fmt: "flat",
      costBase: 45,
      costGrowth: 1.21,
      tiers: [
        { upTo: 10, value: 1.5 },
        { upTo: 20, value: 1 },
        { upTo: 30, value: 0.6 },
      ],
    },
    {
      id: "def",
      name: "방어력",
      desc: "받는 피해 감소 (갑옷과 합산)",
      maxLevel: 30,
      fmt: "flat",
      costBase: 40,
      costGrowth: 1.2,
      tiers: [
        { upTo: 10, value: 2 },
        { upTo: 20, value: 1.5 },
        { upTo: 30, value: 1 },
      ],
    },
    {
      id: "moveSpeed",
      name: "이동 속도",
      desc: "빠른 탐험과 회피",
      maxLevel: 10,
      fmt: "pct",
      costBase: 60,
      costGrowth: 1.3,
      tiers: [
        { upTo: 5, value: 0.03 },
        { upTo: 10, value: 0.02 },
      ],
    },
    {
      id: "attackSpeed",
      name: "공격 속도",
      desc: "연속 공격 효율 증가",
      maxLevel: 20,
      fmt: "pct",
      costBase: 60,
      costGrowth: 1.24,
      tiers: [
        { upTo: 10, value: 0.03 },
        { upTo: 20, value: 0.015 },
      ],
    },
    {
      id: "critChance",
      name: "치명타 확률",
      desc: "치명타 발생 확률",
      maxLevel: 20,
      fmt: "pct",
      costBase: 55,
      costGrowth: 1.24,
      tiers: [
        { upTo: 5, value: 0.02 },
        { upTo: 20, value: 0.01 },
      ],
    },
    {
      id: "critDamage",
      name: "치명타 피해",
      desc: "치명타 시 추가 피해",
      maxLevel: 20,
      fmt: "pct",
      costBase: 55,
      costGrowth: 1.23,
      tiers: [
        { upTo: 10, value: 0.08 },
        { upTo: 20, value: 0.05 },
      ],
    },
    {
      id: "skillPower",
      name: "스킬 위력",
      desc: "액티브 스킬 피해 증가",
      maxLevel: 20,
      fmt: "pct",
      costBase: 55,
      costGrowth: 1.23,
      tiers: [
        { upTo: 10, value: 0.06 },
        { upTo: 20, value: 0.04 },
      ],
    },
    {
      id: "healEff",
      name: "회복 효율",
      desc: "모든 회복 효과 증가",
      maxLevel: 10,
      fmt: "pct",
      costBase: 50,
      costGrowth: 1.28,
      tiers: [{ upTo: 10, value: 0.08 }],
    },
    {
      id: "goldGain",
      name: "골드 획득",
      desc: "골드 획득량 소폭 증가",
      maxLevel: 10,
      fmt: "pct",
      costBase: 80,
      costGrowth: 1.32,
      tiers: [{ upTo: 10, value: 0.04 }],
    },
  ];
Object.fromEntries(De.map((A) => [A.id, A]));
function Yi(A, S) {
  let T = 0,
    C = 0;
  for (const E of A.tiers) {
    const R = Math.max(0, Math.min(S, E.upTo) - C);
    ((T += R * E.value), (C = E.upTo));
  }
  return T;
}
const oi = [
  { dist: 250, gold: 60, desc: "첫 발걸음" },
  { dist: 500, gold: 100, desc: "골드 보너스" },
  { dist: 1e3, gold: 250, desc: "골드 보너스" },
  { dist: 1500, gold: 350, desc: "골드 보너스" },
  {
    dist: 2e3,
    gold: 500,
    desc: "골드 보너스",
  },
  { dist: 3e3, gold: 800, desc: "골드 보너스" },
  { dist: 4e3, gold: 1e3, desc: "골드 보너스" },
  { dist: 5e3, gold: 1500, desc: "골드 보너스" },
  { dist: 7500, gold: 2500, desc: "골드 보너스" },
  { dist: 1e4, gold: 5e3, title: "화로의 계승자", desc: "칭호와 대량의 골드" },
  { dist: 12e3, gold: 6e3, desc: "골드 보너스" },
  { dist: 16e3, gold: 1e4, title: "끝없는 방랑자", desc: "칭호와 대량의 골드" },
];
function zs(A) {
  const S = oi.find((T) => T.dist === A);
  if (S) return S;
  if (A > 16e3 && A % 2e3 === 0) {
    const T = (A - 16e3) / 2e3;
    return {
      dist: A,
      gold: 1e4 + T * 3e3,
      desc: `끝없는 경계 ${T}단계 돌파`,
      title: T % 5 === 0 ? `심연의 개척자 ${T / 5}` : void 0,
    };
  }
  return null;
}
function Wn(A, S) {
  const T = [];
  for (const E of oi) E.dist > A && T.length < S && T.push(E);
  let C = Math.max(18e3, Math.ceil((A + 1) / 2e3) * 2e3);
  for (; T.length < S;) {
    const E = zs(C);
    (E && C > A && T.push(E), (C += 2e3));
  }
  return T;
}
const Ys = {
  tier2_weapons: "2단계 무기",
  steel_armor: "강철 갑옷",
  tier2_skills: "2단계 스킬",
  slot4: "4번째 스킬 슬롯",
  adv_armor: "고급 갑옷",
  tier3_skills: "3단계 스킬",
  rare_weapons: "희귀 무기",
  adv_upgrade: "고급 강화",
  abyss_armor: "심연 갑옷",
};
function Hn() {
  return {
    critChance: 0,
    critDamage: 0,
    specialCount: 0,
    pierce: 0,
    range: 0,
    statusChance: 0,
    specialPower: 0,
    attackSpeed: 0,
    lifesteal: 0,
    specialRadius: 0,
    armorBreak: 0,
    comboWave: 0,
    stunDur: 0,
    specialCdr: 0,
  };
}
function Li(A, S) {
  const T = Hn(),
    C = ae[A];
  if (!C) return T;
  for (const E of C.upgrade.perks) if (S >= E.level) for (const [R, h] of Object.entries(E.mods)) T[R] += h;
  return T;
}
function kn(A, S) {
  const T = De.find((C) => C.id === S);
  return Yi(T, A.training[S] ?? 0);
}
function $n(A) {
  const S = new Set(),
    T = A.weapons.filter(Boolean),
    C = A.skills.filter(Boolean);
  for (const E of Qi)
    (E.weapon && !E.weapon.some((R) => T.includes(R))) ||
      (E.armor && !E.armor.includes(A.armor)) ||
      (E.skill && !E.skill.some((R) => C.includes(R))) ||
      S.add(E.id);
  return S;
}
function xe(A, S) {
  const T = S ?? A.equip,
    C = (p) => kn(A, p),
    E = He[T.armor] ?? He.cloth,
    R = A.armors[E.id] ?? 0,
    h = E.passive.base + E.passive.perLevel * R,
    m = R >= 5,
    t = R >= 10;
  let a = ue.maxHp + C("maxHp"),
    v = E.hpMult ?? 1;
  (E.id === "chain" && m && (v += 0.08),
    E.id === "steel" && m && (v += 0.1),
    E.id === "guardian" && (v += h / 100),
    (a = Math.round(a * v)));
  const o = ue.def + C("def") + E.def + E.defPerLevel * R,
    n = Math.min(de.maxReduction, o / (o + de.defK)),
    i = Math.min(de.maxResist, E.resist + E.resistPerLevel * R);
  let e = ue.critChance + C("critChance");
  E.id === "leather" && (e += h / 100);
  let r = ue.skillPower + C("skillPower"),
    l = 1;
  (E.id === "cloth" && ((l -= h / 100), t && (r += 0.12)),
    E.id === "mage" && ((r += h / 100), (l -= 0.1), t && (l -= 0.1)));
  let s = Vt.dashCooldown * E.dashCdMult,
    u = Vt.dashIframes;
  E.id === "leather" && ((u += 0.08), m && (u += 0.1));
  let d = 1;
  (E.id === "chain" && t && (d += 0.06), E.id === "abyss" && (d += h / 100));
  let f = 1;
  return (
    E.id === "berserker" && (f -= 0.25),
    E.id === "abyss" && (f -= 0.5),
    {
      maxHp: a,
      atk: ue.atk + C("atk"),
      def: o,
      defReduction: n,
      resist: i,
      moveSpeed: ue.moveSpeed * E.moveMult * (1 + C("moveSpeed")),
      attackSpeed: ue.attackSpeed * E.atkSpeedMult * (1 + C("attackSpeed")),
      critChance: Math.min(de.critCap, e),
      critDamage: ue.critDamage + C("critDamage"),
      skillPower: r,
      healEff: ue.healEff + C("healEff"),
      goldGain: ue.goldGain + C("goldGain"),
      dashCd: s,
      dashIframes: u,
      skillCdMult: Math.max(0.5, l),
      knockbackResist: E.id === "chain" || E.id === "steel" ? h / 100 : E.id === "guardian" ? 1 : 0,
      staggerImmune: E.id === "steel" || E.id === "guardian",
      lifesteal: E.id === "vampire" ? h / 100 : 0,
      killHealPct: E.id === "vampire" ? (m ? 0.04 : 0.02) : 0,
      thornsPct: E.id === "thorns" ? h / 100 : 0,
      berserkMax: E.id === "berserker" ? h / 100 : 0,
      dmgMult: d,
      healRecvMult: f,
      meleeTakenMult: E.id === "mage" ? 1.15 : 1,
      elemTakenMult: E.id === "abyss" ? 1.2 : 1,
      armorId: E.id,
      armorLevel: R,
      armorPerk5: m,
      armorPerk10: t,
      synergies: $n(T),
      loadout: T,
    }
  );
}
function is(A, S, T) {
  const C = ae[T],
    E = S.weapons[T] ?? 0;
  let R = (A.atk + C.flat * (1 + 0.15 * E)) * (1 + C.upgrade.dmgPerLevel * E);
  return (C.kind === "magic" && (R *= 1 + 0.5 * (A.skillPower - 1)), R * A.dmgMult);
}
function Wi(A, S, T) {
  const C = ae[T],
    E = Li(T, S.weapons[T] ?? 0),
    R = A.attackSpeed * (1 + E.attackSpeed);
  let h = 0,
    m = 0;
  for (const v of C.combo) ((h += v.power), (m += v.interval / R));
  const t = Math.min(de.critCap, A.critChance + C.critBonus + E.critChance),
    a = A.critDamage + E.critDamage;
  return (h / m) * is(A, S, T) * (1 + t * (a - 1));
}
function Fi(A, S, T) {
  const C = Math.max(1, S) - 1;
  return {
    level: Math.max(1, S),
    power: A.power * (1 + li.power * C),
    cooldown: A.cooldown * Math.max(0.55, 1 - li.cooldown * C) * (T ? T.skillCdMult : 1),
    radius: A.radius * (1 + li.radius * C),
    duration: A.duration * (1 + li.duration * C),
  };
}
const ke = {
    sword: {
      weapon: "sword",
      name: "성검",
      catalyst: "b_atk",
      need: 3,
      color: 16769152,
      desc: "검 피해 +20%. 3번 휘두를 때마다 관통하는 성광 검기를 날린다",
    },
    greatsword: {
      weapon: "greatsword",
      name: "파멸의 대검",
      catalyst: "b_critdmg",
      need: 2,
      color: 16744544,
      desc: "대검 적중 시 35% 확률로 대지가 갈라져 주변에 공격력 120% 피해",
    },
    dual: {
      weapon: "dual",
      name: "쌍월",
      catalyst: "b_aspd",
      need: 3,
      color: 12638463,
      desc: "쌍검 공격 속도 +25%, 적중 시 50% 확률로 출혈",
    },
    spear: {
      weapon: "spear",
      name: "용창",
      catalyst: "b_move",
      need: 2,
      color: 16736320,
      desc: "창 사거리 +40%. 3번 찌를 때마다 모든 적을 꿰뚫는 용의 창을 던진다",
    },
    bow: {
      weapon: "bow",
      name: "폭풍궁",
      catalyst: "b_crit",
      need: 3,
      color: 9498816,
      desc: "화살을 쏠 때마다 화살 2발 추가, 관통 +1",
    },
    staff: {
      weapon: "staff",
      name: "대마도사의 지팡이",
      catalyst: "b_skill",
      need: 2,
      color: 16748592,
      desc: "지팡이 적중 시 화상 확정, 50% 확률로 추가 폭발 (공격력 80%)",
    },
    hammer: {
      weapon: "hammer",
      name: "천둥 망치",
      catalyst: "b_hp",
      need: 3,
      color: 16773216,
      desc: "망치 적중 시 40% 확률로 번개가 4번 연쇄하고 대상을 기절시킨다",
    },
    scythe: {
      weapon: "scythe",
      name: "영혼 수확자",
      catalyst: "b_ls",
      need: 2,
      color: 11563263,
      desc: "낫 흡혈 +6%. 낫으로 처치하면 영혼을 거둬 체력 3% 회복, 열기 2중첩",
    },
    crossbow: {
      weapon: "crossbow",
      name: "공성 석궁",
      catalyst: "r_giant",
      need: 1,
      color: 16756832,
      desc: "모든 화살이 적중 시 폭발해 주변에 공격력 100% 피해",
    },
    gauntlet: {
      weapon: "gauntlet",
      name: "신의 주먹",
      catalyst: "b_armor",
      need: 2,
      color: 16769184,
      desc: "받는 피해 -10%. 4번째 주먹마다 충격파 (공격력 150%)",
    },
  },
  Kn = Object.values(ke).map((A) => ({
    id: `evo_${A.weapon}`,
    name: A.name,
    rarity: "legendary",
    max: 1,
    icon: "star",
    color: A.color,
    evo: !0,
    tag: "무기 진화",
    desc: () => A.desc,
    req: (S) => S.level >= 6 && S.weapons.includes(A.weapon) && S.stacks(A.catalyst) >= A.need,
    apply: (S) => {
      (S.evo.push(`evo_${A.weapon}`), A.weapon === "gauntlet" && (S.dmgTakenMult *= 0.9));
    },
  })),
  ss = {
    shockwave: { name: "대지의 메아리", desc: "충격파가 연달아 3번 퍼진다", color: 14729344 },
    fireburst: { name: "유성우", desc: "화염구 3개를 부채꼴로 던진다", color: 16738848 },
    shadowdash: {
      name: "그림자 분신",
      desc: "돌진 거리 +50%, 끝 지점에서 그림자가 폭발한다 (공격력 150%)",
      color: 9064656,
    },
    iceWave: { name: "절대 영도", desc: "맞은 적을 1.5초간 확정 빙결", color: 8442111 },
    heal: { name: "생명의 샘", desc: "회복 후 5초간 초당 3% 재생, 받는 피해 -30%", color: 7397488 },
    lightning: { name: "뇌신의 심판", desc: "연쇄 대상 +4, 맞은 적의 방어력 파괴", color: 16773216 },
    blades: { name: "칼날 폭풍", desc: "칼날 +3개, 지속시간 +50%", color: 12636384 },
    fissure: { name: "대지 붕괴", desc: "균열 길이 +80%, 바위 가시가 두 번 솟는다", color: 11567184 },
    berserk: { name: "피의 광란", desc: "광전사 지속 중 흡혈 +8%, 이동 속도 +20%", color: 16724016 },
    vampstrike: { name: "사냥의 연쇄", desc: "흡혈의 일격으로 처치하면 재사용 대기시간 초기화", color: 13639760 },
  },
  Zn = Object.entries(ss).map(([A, S]) => ({
    id: `sk_${A}`,
    name: S.name,
    rarity: "epic",
    max: 1,
    icon: "book",
    color: S.color,
    tag: "스킬 강화",
    desc: () => S.desc,
    req: (T) => T.skills.includes(A) && T.level >= 3,
    apply: (T) => {
      T.evo.push(`sk_${A}`);
    },
  })),
  mi = (A) => A.mods.infuse === "",
  Jn = [
    {
      id: "i_fire",
      name: "화염 부여",
      rarity: "rare",
      max: 1,
      icon: "flame",
      color: 16736288,
      tag: "원소 부여",
      req: mi,
      desc: () => "무기 공격이 화염 속성이 되고 화상 확률 +10%. 원소 반응을 일으킨다",
      apply: (A) => {
        ((A.infuse = "fire"), (A.burn += 0.1));
      },
    },
    {
      id: "i_ice",
      name: "냉기 부여",
      rarity: "rare",
      max: 1,
      icon: "frost",
      color: 8444159,
      tag: "원소 부여",
      req: mi,
      desc: () => "무기 공격이 냉기 속성이 되고 둔화 확률 +12%. 원소 반응을 일으킨다",
      apply: (A) => {
        ((A.infuse = "ice"), (A.frost += 0.12));
      },
    },
    {
      id: "i_bolt",
      name: "전격 부여",
      rarity: "rare",
      max: 1,
      icon: "bolt",
      color: 16773216,
      tag: "원소 부여",
      req: mi,
      desc: () => "무기 공격이 번개 속성이 되고 연쇄 번개 확률 +6%. 원소 반응을 일으킨다",
      apply: (A) => {
        ((A.infuse = "lightning"), (A.chain += 0.06), (A.chainJumps = Math.max(A.chainJumps, 2)));
      },
    },
    {
      id: "i_poison",
      name: "맹독 부여",
      rarity: "rare",
      max: 1,
      icon: "poison",
      color: 10543168,
      tag: "원소 부여",
      req: mi,
      desc: () => "무기 공격이 독 속성이 되고 중독 확률 +15%. 원소 반응을 일으킨다",
      apply: (A) => {
        ((A.infuse = "poison"), (A.poison += 0.15));
      },
    },
    {
      id: "i_react",
      name: "원소 공명",
      rarity: "epic",
      max: 3,
      icon: "eye",
      color: 13672703,
      tag: "원소 반응",
      req: (A) => A.mods.infuse !== "" || A.mods.burn + A.mods.frost + A.mods.poison + A.mods.chain > 0.2,
      desc: () => "원소 반응 피해 +40%, 반응 재발동 대기시간 감소",
      apply: (A) => {
        A.reactPct += 0.4;
      },
    },
  ],
  Qn = {
    sword: { a: 0.7 },
    greatsword: { a: -2.35, behind: !0, dx: -4, dy: -4 },
    dual: { a: 0.8 },
    spear: { a: -1.25 },
    bow: { a: 0 },
    staff: { a: -1.35 },
    hammer: { a: -2.2, behind: !0, dx: -2, dy: -6 },
    scythe: { a: -1.95, behind: !0, dx: -3, dy: -4 },
    crossbow: { a: 0.45 },
    gauntlet: { a: 0 },
  },
  jn = {
    dual: { type: "bleed", chance: 0, dur: 3, power: 0.3 },
    scythe: { type: "poison", chance: 0, dur: 3, power: 0.25 },
  };
class qn {
  constructor(S) {
    Z(this, "slot", 0);
    Z(this, "ids", ["sword", null]);
    Z(this, "combo", 0);
    Z(this, "comboTimer", 0);
    Z(this, "cd", 0);
    Z(this, "cur", null);
    Z(this, "sp", null);
    Z(this, "specialCd", {});
    Z(this, "ws");
    Z(this, "ws2");
    Z(this, "shots", 0);
    Z(this, "def");
    Z(this, "lvl", 0);
    Z(this, "mods");
    Z(this, "meleeSwings", 0);
    Z(this, "evoSwings", 0);
    this.p = S;
    const T = S.host.ph;
    ((this.ws = T.add.image(0, 0, "w_sword").setDepth(21)),
      (this.ws2 = T.add.image(0, 0, "w_dual").setDepth(18).setVisible(!1)),
      this.refresh());
  }
  get id() {
    return this.ids[this.slot] ?? this.ids[0];
  }
  get weapon() {
    return this.def;
  }
  get level() {
    return this.lvl;
  }
  refresh() {
    const S = this.p.stats.loadout;
    ((this.ids = [S.weapons[0], S.weapons[1]]), this.ids[this.slot] || (this.slot = 0), this.load());
  }
  load() {
    ((this.def = ae[this.id]),
      (this.lvl = it.data.weapons[this.id] ?? 0),
      (this.mods = Li(this.id, this.lvl)),
      this.ws.setTexture(`w_${this.id}`));
    const S = he[this.id] ?? [0.2, 0.5];
    (this.ws.setOrigin(S[0], S[1]),
      this.ws2
        .setTexture(this.id === "gauntlet" ? "w_gauntlet" : "w_dual")
        .setOrigin(...(he[this.id === "gauntlet" ? "gauntlet" : "dual"] ?? [0.2, 0.5])),
      this.ws2.setVisible(this.id === "dual" || this.id === "gauntlet"),
      (this.combo = 0),
      (this.cur = null));
  }
  swap(S) {
    !this.ids[S] ||
      S === this.slot ||
      this.sp ||
      ((this.slot = S),
      this.load(),
      j.play("click"),
      this.p.host.fx.burst("glow", this.p.cx, this.p.cy, 6, this.def.look.accent));
  }
  specialCooldownMax(S = this.id) {
    const T = ae[S],
      C = Li(S, it.data.weapons[S] ?? 0);
    return T.special.cooldown * (1 - C.specialCdr) * Math.max(0.35, 1 - this.p.run.specialCdr);
  }
  evolved(S = this.id) {
    return this.p.run.evo.includes(`evo_${S}`) && this.id === S;
  }
  specialReady(S = this.id) {
    return (this.specialCd[S] ?? 0) <= 0;
  }
  interrupt() {
    ((this.cur = null), (this.sp = null), (this.combo = 0));
  }
  hide() {
    (this.ws.setVisible(!1), this.ws2.setVisible(!1));
  }
  attacking() {
    return !!this.cur || !!this.sp;
  }
  locksMovement() {
    return !!this.sp && ["flurry", "dashes", "pierce", "slam", "flurry2", "groundwave"].includes(this.sp.kind);
  }
  moveMult() {
    var S;
    return ((S = this.sp) == null ? void 0 : S.kind) === "whirl"
      ? 0.6
      : this.cur
        ? this.def.kind === "ranged" || this.def.kind === "magic"
          ? 0.55
          : this.cur.step.arc === "heavy" || this.cur.step.arc === "smash"
            ? 0.25
            : 0.5
        : 1;
  }
  baseDamage() {
    const S = this.p;
    let T = is(S.stats, it.data, this.id) * S.atkMult() * (1 + S.run.weaponDmgPct);
    return (this.evolved("sword") && (T *= 1.2), S.buffVal("hunter") && this.def.kind === "ranged" && (T *= 1.3), T);
  }
  status() {
    const S = this.def.status ?? jn[this.id];
    if (S) return { ...S, chance: Math.min(1, S.chance + this.mods.statusChance) };
  }
  hitParams(S, T, C, E = "weapon") {
    const R = E === "special",
      h = R ? (1 + this.def.upgrade.specialPerLevel * this.lvl) * (1 + this.mods.specialPower) : 1;
    let m = this.status();
    return (
      this.mods.armorBreak > 0 &&
        Math.random() < this.mods.armorBreak &&
        (m = { type: "armorBreak", chance: 1, dur: 4, power: 0.5 }),
      {
        dmg: this.baseDamage() * S * h,
        element: this.p.run.infuse || this.def.element,
        knock: T.knockback,
        stagger: T.stagger * (1 + this.mods.stunDur),
        dir: C,
        source: E,
        status: m,
        critBonus: this.def.critBonus + this.mods.critChance,
        heavy: T.arc === "heavy" || T.arc === "smash",
        weaponId: this.id,
        pierceShield: this.id === "hammer" || this.id === "greatsword" || R,
      }
    );
  }
  hitRect(S, T, C, E, R, h, m = 99) {
    const t = this.p.host;
    let a = 0;
    for (const v of t.targets()) {
      if (v.dead || R.has(v) || a >= m) continue;
      const o = v.body;
      ge(S, T, C, E, o.x - o.w / 2, o.y - o.h, o.w, o.h) &&
        (R.add(v), a++, t.hitTarget(v, { ...h, dir: o.x < this.p.cx ? -1 : 1 }));
    }
    return a;
  }
  hitRadius(S, T, C, E, R) {
    const h = this.p.host;
    let m = 0;
    for (const t of h.targets()) {
      if (t.dead || (E && E.has(t))) continue;
      const a = t.body,
        v = Ut(S, a.x - a.w / 2, a.x + a.w / 2),
        o = Ut(T, a.y - a.h, a.y);
      Math.hypot(v - S, o - T) <= C && (E == null || E.add(t), m++, h.hitTarget(t, { ...R, dir: a.x < S ? -1 : 1 }));
    }
    return m;
  }
  update(S, T) {
    const C = this.p;
    ((this.cd -= S), (this.comboTimer -= S), this.comboTimer <= 0 && (this.combo = 0));
    for (const E of Object.keys(this.specialCd)) this.specialCd[E] = Math.max(0, this.specialCd[E] - S);
    if (this.sp) {
      this.updateSpecial(S, T);
      return;
    }
    if (T.special && this.specialReady() && C.dashT <= 0) {
      this.startSpecial(T);
      return;
    }
    ((T.attack || T.attackHeld) && this.cd <= 0 && C.dashT <= 0 && this.startAttack(T),
      this.cur && this.updateAttack(S));
  }
  aimAngle(S) {
    const T = this.p;
    return Math.atan2(S.aimY - (T.body.y - 14), S.aimX - T.cx);
  }
  startAttack(S) {
    const T = this.p,
      C = this.def.combo,
      E = C[this.combo % C.length],
      R = this.aimAngle(S),
      h = Math.cos(R) >= 0 ? 1 : -1;
    T.facing = h;
    const m = T.atkSpeedMult() * (1 + this.mods.attackSpeed),
      t = E.interval / m;
    if (
      ((this.cur = {
        step: E,
        t: 0,
        dir: h,
        angle: R,
        fired: !1,
        hits: new Set(),
        fxDone: !1,
        idx: this.combo,
        total: t,
      }),
      (this.cd = t),
      (this.comboTimer = t + de.comboWindow),
      (this.combo = (this.combo + 1) % C.length),
      E.lunge && T.body.onGround && (T.body.vx = h * E.lunge),
      this.evolved())
    ) {
      const a = ++this.evoSwings;
      if (
        (this.id === "sword" &&
          a % 3 === 0 &&
          T.host.projectiles.spawn(
            { sprite: "p_swordwave", speed: 420, life: 0.6, radius: 12, pierce: 99, trail: 16769152 },
            T.cx + h * 14,
            T.cy,
            h > 0 ? 0 : Math.PI,
            "player",
            { hit: this.hitParams(1.6, E, h) },
            { scale: 1.5, tint: 16771232 },
          ),
        this.id === "spear" &&
          a % 3 === 0 &&
          T.host.projectiles.spawn(
            { sprite: "p_bigbolt", speed: 640, life: 0.7, radius: 9, pierce: 99, trail: 16736320 },
            T.cx + h * 12,
            T.cy - 2,
            h > 0 ? 0 : Math.PI,
            "player",
            { hit: this.hitParams(1.4, E, h) },
            { scale: 1.3, tint: 16744544 },
          ),
        this.id === "gauntlet" && a % 4 === 0)
      ) {
        const v = T.cx + h * 18;
        (T.host.fx.anim("ring", v, T.cy, { scale: 2, tint: 16769184, blend: !0 }),
          T.host.fx.shake(3),
          j.play("thud"),
          this.hitRadius(v, T.cy, 52, null, {
            ...this.hitParams(1.5, { knockback: 300, stagger: 0.6, arc: "heavy" }, h, "weapon"),
            source: "aoe",
          }));
      }
    }
    (T.run.waveEvery > 0 &&
      this.def.kind === "melee" &&
      !E.projectile &&
      ++this.meleeSwings % T.run.waveEvery === 0 &&
      T.host.projectiles.spawn(
        { sprite: "p_swordwave", speed: 380, life: 0.55, radius: 10, pierce: 4 },
        T.cx + h * 14,
        T.cy,
        h > 0 ? 0 : Math.PI,
        "player",
        { hit: this.hitParams(1, E, h) },
        { scale: 1.1, tint: 13166847 },
      ),
      j.play(
        E.arc === "heavy" || E.arc === "smash"
          ? "swingHeavy"
          : E.arc === "punch"
            ? "punch"
            : E.projectile
              ? this.id === "staff"
                ? "magic"
                : "bow"
              : "swing",
      ));
  }
  updateAttack(S) {
    const T = this.p,
      C = this.cur,
      E = C.step,
      R = T.atkSpeedMult() * (1 + this.mods.attackSpeed);
    C.t += S * Math.max(1, R * 0.9);
    const h = E.windup,
      m = E.active;
    if (E.projectile) {
      (!C.fired && C.t >= h && ((C.fired = !0), this.fireProjectile(C, E)), C.t > h + 0.12 && (this.cur = null));
      return;
    }
    if ((C.t >= h && !C.fxDone && ((C.fxDone = !0), this.strikeFx(C)), C.t >= h && C.t <= h + m)) {
      const t = E.range * (1 + this.mods.range) * (this.evolved("spear") ? 1.4 : 1),
        a = E.back ?? 0,
        v = C.dir > 0 ? T.cx - a : T.cx - t,
        o = T.cy + (E.offsetY ?? 0),
        n = this.hitRect(v, o - E.height / 2, t + a, E.height, C.hits, this.hitParams(E.power, E, C.dir));
      (n > 0 && E.shake && T.host.fx.shake(E.shake),
        n >= 3 &&
          this.id === "greatsword" &&
          this.lvl >= 10 &&
          (this.specialCd[this.id] = Math.max(0, (this.specialCd[this.id] ?? 0) - 1)));
    }
    if (C.t > h + m + 0.08) {
      if (
        this.mods.comboWave > 0 &&
        C.idx === this.def.combo.length - 1 &&
        !C.fired &&
        ((C.fired = !0),
        this.id === "sword" &&
          T.host.projectiles.spawn(
            { sprite: "p_swordwave", speed: 360, life: 0.5, radius: 10, pierce: 3 },
            T.cx + C.dir * 14,
            T.cy,
            C.dir > 0 ? 0 : Math.PI,
            "player",
            { hit: this.hitParams(0.9, E, C.dir) },
            { scale: 1 },
          ),
        this.id === "hammer")
      )
        for (const t of [-1, 1])
          T.host.projectiles.spawn(
            { sprite: "shockwave", speed: 240, life: 0.45, radius: 10 },
            T.cx + t * 12,
            T.body.y,
            t > 0 ? 0 : Math.PI,
            "player",
            { hit: this.hitParams(1, E, t) },
            { ground: !0 },
          );
      (C.t >= C.total * 0.92 || C.t > h + m + 0.25) && (this.cur = null);
    }
  }
  fireProjectile(S, T) {
    const C = this.p,
      E = T.projectile,
      R = C.cx + Math.cos(S.angle) * 10,
      h = C.body.y - 14 + Math.sin(S.angle) * 8,
      m = this.hitParams(T.power, T, S.dir);
    this.shots++;
    let t = this.id === "bow" && this.lvl >= 10 && this.shots % 4 === 0 ? 3 : 1;
    (C.run.multishot > 0 && Math.random() < C.run.multishot && (t += 2), this.evolved("bow") && (t += 2));
    const a = this.evolved("crossbow");
    for (let v = 0; v < t; v++) {
      const o = S.angle + (v - (t - 1) / 2) * 0.12;
      C.host.projectiles.spawn(
        E,
        R,
        h,
        o,
        "player",
        { hit: m },
        {
          pierce: this.mods.pierce + (this.evolved("bow") ? 1 : 0),
          tint: this.evolved() ? ke[this.id].color : void 0,
          onDone: a
            ? (n) => {
                (C.host.fx.anim("explode", n.x, n.y, { scale: 1.4, tint: 16756832 }),
                  j.play("explosion", 0.5),
                  this.hitRadius(n.x, n.y, 40, null, { ...m, source: "aoe", noCrit: !0 }));
              }
            : void 0,
        },
      );
    }
    (this.id === "staff" && C.host.fx.burst("glow", R, h, 4, 16752704),
      this.id === "crossbow" && ((C.body.vx -= S.dir * 60), C.host.fx.shake(1)));
  }
  strikeFx(S) {
    const T = this.p,
      C = S.step,
      E = T.host.fx,
      R = C.range * (1 + this.mods.range),
      h = S.dir < 0,
      m =
        this.id === "scythe"
          ? 13672703
          : this.id === "greatsword"
            ? 16771264
            : this.id === "hammer"
              ? 16767136
              : void 0,
      t = T.cy + (C.offsetY ?? 0);
    switch (C.arc) {
      case "slash":
        E.anim("fx_slash", T.cx + S.dir * R * 0.45, t, {
          flip: h,
          scale: R / 30,
          scaleY: S.idx % 2 ? -R / 30 : R / 30,
          tint: m,
        });
        break;
      case "heavy":
        E.anim("fx_heavy", T.cx + S.dir * R * 0.35, t - 2, { flip: h, scale: R / 40, tint: m });
        break;
      case "smash":
        (E.anim("fx_heavy", T.cx + S.dir * R * 0.35, t, { flip: h, scale: R / 40, rot: S.dir * 0.5, tint: m }),
          E.anim("fx_smash", T.cx + S.dir * R * 0.6, T.body.y - 12, { flip: h }),
          E.burst("chunk", T.cx + S.dir * R * 0.6, T.body.y - 2, 8, 11049080));
        break;
      case "thrust":
        E.anim("fx_thrust", T.cx + S.dir * 4, t, {
          flip: h,
          originX: h ? 1 : 0,
          scale: R / 60,
          tint: this.def.look.accent,
        });
        break;
      case "spin":
        E.anim("fx_spin", T.cx, t, { scale: R / 34, flip: h, tint: m });
        break;
      case "twin":
        E.anim("fx_twin", T.cx + S.dir * R * 0.5, t + (S.idx % 2 ? 3 : -3), { flip: h, scale: R / 22 });
        break;
      case "punch":
        E.anim("fx_punch", T.cx + S.dir * (R - 4), t - 2, { scale: S.idx === 3 ? 1.6 : 0.9 });
        break;
    }
  }
  startSpecial(S) {
    const T = this.p,
      C = this.aimAngle(S),
      E = Math.cos(C) >= 0 ? 1 : -1;
    ((T.facing = E), (this.cur = null), (this.specialCd[this.id] = this.specialCooldownMax()));
    const R = {
        kind: "",
        t: 0,
        dur: 0,
        n: 0,
        i: 0,
        timer: 0,
        dir: E,
        angle: C,
        hits: new Set(),
        phase: 0,
        tx: S.aimX,
        ty: S.aimY,
      },
      h = this.mods.specialCount;
    switch (this.id) {
      case "sword":
        this.sp = { ...R, kind: "flurry", n: 5 + h, dur: (5 + h) * 0.08 + 0.12 };
        break;
      case "greatsword":
        ((this.sp = { ...R, kind: "groundwave", dur: 0.55 }), j.play("swingHeavy"));
        break;
      case "dual":
        this.sp = { ...R, kind: "dashes", n: 3 + h, dur: (3 + h) * 0.17 };
        break;
      case "spear":
        this.sp = { ...R, kind: "pierce", dur: 0.32 };
        break;
      case "bow": {
        const m = 5 + h,
          t = this.hitParams(this.def.special.power, this.def.combo[0], E, "special");
        for (let a = 0; a < m; a++) {
          const v = C + (a - (m - 1) / 2) * 0.09;
          T.host.projectiles.spawn(
            this.def.combo[0].projectile,
            T.cx,
            T.body.y - 14,
            v,
            "player",
            { hit: t },
            { pierce: this.mods.pierce, speedMul: 1.1 },
          );
        }
        (j.play("bow"), (T.castT = 0.2), (this.sp = null));
        return;
      }
      case "staff": {
        const m = Ut(S.aimX - T.cx, -230, 230),
          t = Ut(S.aimY - T.cy, -160, 160);
        this.sp = { ...R, kind: "blast", dur: 0.45, tx: T.cx + m, ty: T.cy + t };
        const a = 50 * (1 + this.mods.specialRadius),
          v = T.host.ph.add
            .image(this.sp.tx, this.sp.ty, "warncircle")
            .setDepth(30)
            .setScale(a / 32)
            .setTint(16748608)
            .setAlpha(0.8);
        (T.host.ph.tweens.add({
          targets: v,
          alpha: 0.2,
          duration: 120,
          yoyo: !0,
          repeat: 1,
          onComplete: () => v.destroy(),
        }),
          j.play("magic"),
          (T.castT = 0.45));
        break;
      }
      case "hammer":
        ((this.sp = { ...R, kind: "slam", dur: 1.2, phase: T.body.onGround ? 0 : 1 }),
          T.body.onGround ? (T.body.vy = -430) : (T.body.vy = 300),
          j.play("jump"));
        break;
      case "scythe":
        this.sp = { ...R, kind: "whirl", dur: 1.4 + h * 0.14 };
        break;
      case "crossbow": {
        const m = this.hitParams(this.def.special.power, { knockback: 420, stagger: 0.8, arc: "heavy" }, E, "special");
        (T.host.projectiles.spawn(
          { sprite: "p_bigbolt", speed: 760, life: 1.2, radius: 8, pierce: 99, trail: 16769152 },
          T.cx,
          T.body.y - 14,
          C,
          "player",
          { hit: m },
          {
            onDone:
              this.lvl >= 10
                ? (t) => {
                    (this.hitRadius(t.x, t.y, 48, null, { ...m, dmg: m.dmg * 0.6, source: "aoe" }),
                      T.host.fx.anim("explode", t.x, t.y, { scale: 2 }),
                      j.play("explosion"));
                  }
                : void 0,
          },
        ),
          (T.body.vx -= E * 200),
          T.host.fx.shake(3),
          j.play("shoot"),
          (T.castT = 0.25),
          (this.sp = null));
        return;
      }
      case "gauntlet":
        this.sp = { ...R, kind: "flurry2", n: 8, dur: 0.75 };
        break;
    }
  }
  overrideMovement(S) {
    const T = this.sp,
      C = this.p.body;
    if (!T) return !1;
    switch (T.kind) {
      case "flurry":
        return ((C.vx = T.dir * 70), (C.vy = Math.min(200, C.vy + 1500 * S)), !0);
      case "flurry2":
        return ((C.vx = T.dir * 25), (C.vy = Math.min(200, C.vy + 1500 * S)), !0);
      case "groundwave":
        return ((C.vx *= 0.8), (C.vy = Math.min(400, C.vy + 1500 * S)), !0);
      case "dashes": {
        const E = T.t % 0.17 < 0.13;
        return ((C.vx = E ? T.dir * 480 : 0), (C.vy = 0), !0);
      }
      case "pierce":
        return ((C.vx = T.t > 0.07 ? T.dir * 620 : 0), (C.vy = 0), !0);
      case "slam":
        return (
          T.phase === 0 ? ((C.vy += 1500 * S), C.vy > -50 && ((T.phase = 1), (C.vy = 650))) : (C.vy = 700),
          (C.vx = T.dir * 60),
          !0
        );
    }
    return !1;
  }
  updateSpecial(S, T) {
    const C = this.sp,
      E = this.p,
      R = E.host.fx;
    C.t += S;
    const h = this.def.special.power;
    switch (C.kind) {
      case "flurry": {
        if (((C.timer -= S), C.timer <= 0 && C.i < C.n)) {
          ((C.timer = 0.08), C.i++);
          const m = new Set();
          (this.hitRect(
            C.dir > 0 ? E.cx - 4 : E.cx - 44,
            E.cy - 18,
            48,
            36,
            m,
            this.hitParams(h, { knockback: 40, stagger: 0.25 }, C.dir, "special"),
          ),
            R.anim("fx_slash", E.cx + C.dir * 18, E.cy + (C.i % 2 ? -4 : 4), {
              flip: C.dir < 0,
              scaleY: C.i % 2 ? -0.9 : 0.9,
              scale: 0.9,
              tint: 12638463,
            }),
            j.play("swing"));
        }
        break;
      }
      case "flurry2": {
        if (
          ((C.timer -= S),
          C.timer <= 0 &&
            C.i < C.n &&
            ((C.timer = 0.05),
            C.i++,
            this.hitRect(
              C.dir > 0 ? E.cx : E.cx - 30,
              E.cy - 12,
              30,
              24,
              new Set(),
              this.hitParams(h, { knockback: 10, stagger: 0.2 }, C.dir, "special"),
            ),
            R.anim("fx_punch", E.cx + C.dir * (18 + Math.random() * 8), E.cy - 4 + (Math.random() - 0.5) * 12, {
              scale: 0.7,
            }),
            j.play("punch")),
          C.i >= C.n && C.phase === 0 && C.t > 0.5)
        ) {
          C.phase = 1;
          const m = 44 * (1 + this.mods.specialRadius);
          (this.hitRadius(
            E.cx + C.dir * 20,
            E.cy,
            m,
            null,
            this.hitParams(h * 4, { knockback: 380, stagger: 0.8, arc: "heavy" }, C.dir, "special"),
          ),
            R.anim("ring", E.cx + C.dir * 20, E.cy, { scale: m / 26, tint: 16769184 }),
            R.anim("fx_punch", E.cx + C.dir * 20, E.cy, { scale: 2.2 }),
            R.shake(4),
            j.play("thud"));
        }
        break;
      }
      case "groundwave": {
        (C.phase === 0 &&
          C.t > 0.28 &&
          ((C.phase = 1),
          R.anim("fx_smash", E.cx + C.dir * 22, E.body.y - 12, { flip: C.dir < 0, scale: 1.4 }),
          R.shake(4),
          j.play("thud"),
          R.burst("chunk", E.cx + C.dir * 22, E.body.y - 2, 12, 11049080),
          this.spawnWave(C.dir, h)),
          C.phase === 1 && C.t > 0.43 && ((C.phase = 2), this.spawnWave(C.dir, h * 0.8)));
        break;
      }
      case "dashes": {
        const m = Math.floor(C.t / 0.17);
        (m !== C.i && ((C.i = m), (C.hits = new Set()), j.play("dash")),
          (E.iframes = Math.max(E.iframes, 0.1)),
          this.hitRect(
            E.cx - 16,
            E.cy - 16,
            32,
            32,
            C.hits,
            this.hitParams(h, { knockback: 60, stagger: 0.3 }, C.dir, "special"),
          ),
          C.t % 0.17 < 0.02 && R.anim("fx_twin", E.cx, E.cy, { flip: C.dir < 0, scale: 1.2 }));
        break;
      }
      case "pierce": {
        ((E.iframes = Math.max(E.iframes, 0.1)),
          C.t > 0.07 &&
            (this.hitRect(
              E.cx - (C.dir > 0 ? 30 : 34),
              E.cy - 10,
              64,
              20,
              C.hits,
              this.hitParams(h, { knockback: 200, stagger: 0.5 }, C.dir, "special"),
            ),
            C.phase === 0 &&
              ((C.phase = 1),
              R.anim("fx_thrust", E.cx, E.cy, {
                flip: C.dir < 0,
                originX: C.dir < 0 ? 1 : 0,
                scale: 1.6,
                tint: 16765088,
                follow: void 0,
              }),
              j.play("dash"))));
        break;
      }
      case "blast": {
        if (C.phase === 0 && C.t > 0.35) {
          C.phase = 1;
          const m = 50 * (1 + this.mods.specialRadius),
            t =
              this.lvl >= 10
                ? { type: "chill", chance: 1, dur: 2.5, power: 0.4 }
                : { type: "burn", chance: 0.8, dur: 3, power: 0.3 };
          (this.hitRadius(C.tx, C.ty, m, null, {
            ...this.hitParams(h, { knockback: 220, stagger: 0.5 }, C.dir, "special"),
            status: t,
            source: "aoe",
          }),
            R.anim("explode", C.tx, C.ty, { scale: m / 20, tint: this.lvl >= 10 ? 10543359 : void 0 }),
            R.anim("ring", C.tx, C.ty, { scale: m / 24, tint: 16760960 }),
            R.burst("glow", C.tx, C.ty, 20, 16744512),
            R.shake(4),
            j.play("explosion"));
        }
        break;
      }
      case "slam": {
        if (C.phase === 1 && E.body.onGround) {
          C.phase = 2;
          const m = 56 * (1 + this.mods.specialRadius);
          (this.hitRadius(E.cx, E.body.y - 8, m, null, {
            ...this.hitParams(h, { knockback: 260, stagger: 1.2, arc: "smash" }, C.dir, "special"),
            knockUp: 200,
          }),
            R.anim("ring", E.cx, E.body.y - 6, { scale: m / 26, scaleY: m / 60, tint: 16769184 }),
            R.anim("fx_smash", E.cx, E.body.y - 12, { scale: m / 30 }),
            R.burst("chunk", E.cx, E.body.y - 2, 18, 11049080),
            R.shake(6),
            R.stop(0.08),
            j.play("thud", 1.4),
            (C.dur = C.t + 0.15));
        }
        break;
      }
      case "whirl": {
        ((C.timer -= S),
          C.timer <= 0 &&
            ((C.timer = 0.13),
            this.hitRadius(E.cx, E.cy, 54, null, this.hitParams(h, { knockback: 80, stagger: 0.2 }, C.dir, "special")),
            R.anim("fx_spin", E.cx, E.cy, { scale: 1.5, tint: 13672703, flip: C.i++ % 2 === 0 }),
            j.play("swing")));
        break;
      }
    }
    C.t >= C.dur && ((this.sp = null), (C.kind === "pierce" || C.kind === "dashes") && (E.body.vx = C.dir * 120));
  }
  spawnWave(S, T) {
    const C = this.p,
      E = 190 * (1 + this.mods.specialRadius);
    C.host.projectiles.spawn(
      { sprite: "shockwave", speed: 300, life: E / 300, radius: 12 },
      C.cx + S * 16,
      C.body.y,
      S > 0 ? 0 : Math.PI,
      "player",
      { hit: this.hitParams(T, { knockback: 200, stagger: 0.6, arc: "heavy" }, S, "special") },
      { ground: !0, pierce: 99, scale: 1.2 },
    );
  }
  thornBurst() {
    const S = this.p;
    (this.hitRadius(S.cx, S.cy, 40, null, {
      dmg: S.stats.atk * 1.2 * S.atkMult(),
      element: "phys",
      knock: 120,
      stagger: 0.2,
      dir: 1,
      source: "thorns",
      noCrit: !0,
    }),
      S.host.fx.anim("ring", S.cx, S.cy, { scale: 1.4, tint: 10535008 }));
  }
  poseFrame() {
    if (this.sp) {
      const C = this.sp.kind;
      return C === "blast"
        ? this.sp.t < 0.2
          ? 21
          : 22
        : C === "dashes" || C === "pierce"
          ? 12
          : C === "slam"
            ? this.sp.phase < 2
              ? 13
              : 15
            : C === "groundwave"
              ? this.sp.phase === 0
                ? 13
                : 14
              : Math.floor(this.sp.t / 0.08) % 2
                ? 14
                : 15;
    }
    if (!this.cur) return null;
    const S = this.cur,
      T = S.step;
    return T.projectile ? (S.t < T.windup ? 21 : 22) : S.t < T.windup ? 13 : S.t < T.windup + T.active ? 14 : 15;
  }
  updateVisual() {
    const S = this.p;
    if (S.dead) {
      this.hide();
      return;
    }
    const T = S.facing,
      C = this.id,
      E = Qn[C] ?? { a: 0 },
      R = Number(S.sprite.frame.name) || 0,
      h = ns[R] ?? ns[0],
      m = S.body.x + (T > 0 ? h.x - 16 : 15 - h.x),
      t = S.body.y - 32 + h.y;
    let a = E.a,
      v = m,
      o = t,
      n = !!E.behind,
      i = E.a,
      e = m - T * 4,
      r = t + 1,
      l = C === "dual" || C === "gauntlet";
    const s = S.body.x + T * 2,
      u = S.body.y - 15;
    (E.behind && !this.cur && !this.sp && ((v = S.body.x - T * 3 + T * (E.dx ?? 0)), (o = S.body.y - 16 + (E.dy ?? 0))),
      C === "gauntlet" && !this.cur && !this.sp && ((v = m), (o = t), (a = 0)));
    const d = this.cur;
    if (d) {
      const c = d.step,
        p = c.windup,
        g = c.active,
        y = Ut(d.t / Math.max(0.01, p), 0, 1),
        x = Ut((d.t - p) / Math.max(0.01, g + 0.04), 0, 1);
      switch (((n = !1), (v = s), (o = u), c.arc)) {
        case "slash":
          ((a = d.t < p ? ie(E.a, -2, y) : ie(-2, 1.3, Math.sqrt(x))),
            d.idx % 2 && (a = d.t < p ? ie(E.a, 1.6, y) : ie(1.6, -1.4, Math.sqrt(x))));
          break;
        case "heavy":
          a = d.t < p ? ie(E.a, -2.6, y) : ie(-2.6, 1.3, Math.sqrt(x));
          break;
        case "smash":
          ((a = d.t < p ? ie(-1.5, -3, y) : ie(-3, 1.45, x * x * 0.4 + x * 0.6)), (o = u - 2));
          break;
        case "thrust":
          ((a = d.idx === 2 ? (d.t < p ? -1.8 : ie(-1.8, 1, Math.sqrt(x))) : 0),
            (v = s + (d.t < p ? -5 * y : -5 + 16 * Math.sin(x * Math.PI))),
            (o = u + 1));
          break;
        case "spin":
          a = d.t < p ? ie(E.a, -3, y) : -3 + x * Math.PI * 2;
          break;
        case "twin": {
          const w = d.idx % 2 === 0,
            M = d.t < p ? -3 * y : 10 * Math.sin(x * Math.PI);
          ((a = -0.15), (v = s + (w ? M : 0)), (o = u + 1), (i = 0.25), (e = s - T * 2 + (w ? 0 : M)), (r = u + 4));
          break;
        }
        case "punch": {
          const w = d.idx % 2 === 0,
            M = d.t < p ? -2 : 12 * Math.sin(x * Math.PI) * (d.idx === 3 ? 1.3 : 1);
          ((a = d.idx === 3 ? -0.6 : 0),
            (v = s + 2 + (w || d.idx === 3 ? M : 0)),
            (o = u + (d.idx === 3 ? -2 : 1)),
            (i = 0),
            (e = s - 2 + (!w && d.idx !== 3 ? M : 0)),
            (r = u + 3));
          break;
        }
        case "shot":
        case "bolt": {
          const w = T > 0 ? d.angle : Math.PI - d.angle;
          ((a = w), (v = s + Math.cos(w) * 4), (o = u + Math.sin(w) * 4), c.arc === "bolt" && d.t > p && (v -= 3));
          break;
        }
        case "cast": {
          const w = T > 0 ? d.angle : Math.PI - d.angle;
          a = d.t < p ? ie(-1.4, -2, y) : w;
          break;
        }
      }
    } else if (this.sp) {
      ((n = !1), (v = s), (o = u));
      const c = this.sp;
      switch (c.kind) {
        case "flurry":
          a = c.i % 2 ? 1.2 : -1.5;
          break;
        case "dashes":
          ((a = 0), (i = 0.2), (e = s - 2), (r = u + 3));
          break;
        case "pierce":
          ((a = 0), (v = s + 6));
          break;
        case "groundwave":
          a = c.phase === 0 ? -2.7 : 1.45;
          break;
        case "slam":
          a = c.phase < 2 ? -2.9 : 1.5;
          break;
        case "whirl":
          a = c.t * 18;
          break;
        case "blast":
          a = -1.9;
          break;
        case "flurry2": {
          const p = 10 * Math.abs(Math.sin(c.t * 40));
          ((v = s + 2 + p), (i = 0), (e = s + 10 - p), (r = u + 3));
          break;
        }
      }
    }
    const f = (c) => (T > 0 ? c : Math.PI - c);
    if (this.evolved()) {
      const c = ke[this.id].color;
      (this.ws.setTint(c), this.ws2.setTint(c));
    } else (this.ws.clearTint(), this.ws2.clearTint());
    if (
      (this.ws
        .setVisible(!0)
        .setPosition(Math.round(v), Math.round(o))
        .setRotation(f(a))
        .setFlipY(T < 0)
        .setDepth(n ? 19 : 21),
      l)
    ) {
      const c = d || this.sp ? e : m - T * 5;
      this.ws2
        .setVisible(!0)
        .setPosition(Math.round(c), Math.round(d || this.sp ? r : t + 1))
        .setRotation(f(i))
        .setFlipY(T < 0)
        .setDepth(18);
    } else this.ws2.setVisible(!1);
    T < 0 && (d || this.sp) && ((this.ws.x = Math.round(2 * s - v)), l && (this.ws2.x = Math.round(2 * s - e)));
  }
  destroy() {
    (this.ws.destroy(), this.ws2.destroy());
  }
}
class _n {
  constructor(S) {
    Z(this, "slots", [null, null, null, null]);
    Z(this, "cds", [0, 0, 0, 0]);
    Z(this, "maxCds", [1, 1, 1, 1]);
    Z(this, "blades", []);
    Z(this, "bladeT", 0);
    Z(this, "bladeDmg", 0);
    Z(this, "zones", []);
    Z(this, "gfx");
    Z(this, "boltT", 0);
    Z(this, "dashSkill", null);
    Z(this, "arcaneReady", [!1, !1, !1, !1]);
    ((this.p = S), (this.gfx = S.host.ph.add.graphics().setDepth(45)), this.refresh());
  }
  refresh() {
    const S = this.p.stats.loadout.skills,
      T = 3;
    for (let C = 0; C < 4; C++) {
      this.slots[C] = C < T ? (S[C] ?? null) : null;
      const E = this.slots[C];
      ((this.maxCds[C] = E ? this.nums(E).cooldown : 1), (this.cds[C] = Math.min(this.cds[C], this.maxCds[C])));
    }
  }
  nums(S) {
    const T = Fi(ve[S], it.data.skills[S] ?? 1, this.p.stats);
    return { ...T, cooldown: T.cooldown * Math.max(0.4, 1 - this.p.run.skillCdr) };
  }
  level(S) {
    return it.data.skills[S] ?? 1;
  }
  dmg(S) {
    const T = this.p.stats;
    return T.atk * S.power * T.skillPower * this.p.atkMult() * T.dmgMult * (1 + this.p.run.skillDmgPct);
  }
  params(S, T, C = {}) {
    const E = ve[S];
    return {
      dmg: T,
      element: E.element,
      knock: 140,
      stagger: 0.35,
      dir: this.p.facing,
      source: "skill",
      status: E.status,
      skillId: S,
      pierceShield: !0,
      ...C,
    };
  }
  hitRadius(S, T, C, E, R) {
    let h = 0;
    for (const m of this.p.host.targets()) {
      if (m.dead || (R != null && R.has(m))) continue;
      const t = m.body,
        a = Ut(S, t.x - t.w / 2, t.x + t.w / 2),
        v = Ut(T, t.y - t.h, t.y);
      Math.hypot(a - S, v - T) <= C &&
        (R == null || R.add(m), h++, this.p.host.hitTarget(m, { ...E, dir: t.x < S ? -1 : 1 }));
    }
    return h;
  }
  cast(S, T) {
    if (FG.isFr(this.slots[S])) return FG.cast(this, S, T);
    const C = this.slots[S];
    if (!C || this.cds[S] > 0 || this.p.dead) return;
    const E = this.p,
      R = E.host,
      h = R.fx,
      m = this.nums(C),
      t = this.level(C) >= 5,
      a = E.stats.synergies;
    if (
      ((this.maxCds[S] = m.cooldown),
      (this.cds[S] = m.cooldown),
      (this.arcaneReady[S] = !0),
      (E.castT = 0.3),
      E.run.timeWarp > 0)
    )
      for (let e = 0; e < 4; e++) e !== S && (this.cds[e] = Math.max(0, this.cds[e] - E.run.timeWarp));
    const v = Math.atan2(T.aimY - E.cy, T.aimX - E.cx),
      o = Math.cos(v) >= 0 ? 1 : -1;
    (E.weapons.attacking() || (E.facing = o),
      E.stats.armorId === "mage" && E.stats.armorPerk5 && E.buff("dmgReduce", 1, 0.3, "shield", "마력 보호막"));
    let n = !1;
    const i = E.run.evo.includes(`sk_${C}`);
    switch (C) {
      case "shockwave": {
        const e = a.has("quake") ? 1.4 : 1,
          r = this.params(C, this.dmg(m), { stagger: 0.5 * (a.has("quake") ? 1.5 : 1), knock: 220 }),
          l = t ? [-1, 1] : [o],
          s = () => {
            for (const u of l)
              R.projectiles.spawn(
                { sprite: "shockwave", speed: 320, life: (m.radius / 320) * e, radius: 12 },
                E.cx + u * 10,
                E.body.y,
                u > 0 ? 0 : Math.PI,
                "player",
                { hit: r },
                { ground: !0, pierce: 99, scale: 1.3 * e },
              );
          };
        if ((s(), i))
          for (const u of [200, 400])
            R.ph.time.delayedCall(u, () => {
              E.dead || (s(), h.shake(2), j.play("thud", 0.8));
            });
        (h.anim("fx_smash", E.cx, E.body.y - 12, { scale: 1.2 }), h.shake(3), j.play("thud"));
        break;
      }
      case "fireburst": {
        const e = this.params(C, this.dmg(m), { knock: 200 });
        for (const r of i ? [-0.28, 0, 0.28] : [0])
          R.projectiles.spawn(
            { sprite: "p_orb", speed: 340, gravity: 260, life: 1.6, radius: 7, aoe: m.radius, trail: 16736288 },
            E.cx,
            E.cy - 4,
            v + r,
            "player",
            { hit: e },
            { scale: 1.4, onDone: t ? (l) => this.addZone(l.x, l.y, m.radius * 0.8, 3, this.dmg(m) * 0.15) : void 0 },
          );
        j.play("magic");
        break;
      }
      case "shadowdash": {
        ((this.dashSkill = { t: i ? 0.33 : 0.22, dir: o, hits: new Set(), dmg: this.dmg(m), boom: i }),
          (E.iframes = Math.max(E.iframes, 0.35)),
          (E.body.vy = 0),
          E.weapons.interrupt(),
          h.burst("glow", E.cx, E.cy, 10, 9064656),
          j.play("dash"),
          t && E.buff("crit", 1.5 + 0.22, 0.3, "crit", "그림자의 칼날"),
          a.has("nightblade") && (E.weapons.specialCd.dual = 0));
        break;
      }
      case "iceWave": {
        const e = this.params(C, this.dmg(m), {
            knock: 160,
            status: { type: "chill", chance: 1, dur: m.duration, power: 0.5 },
          }),
          r = new Set();
        if ((this.hitRadius(E.cx, E.cy, m.radius, e, r) > 0 && (n = !0), t || i))
          for (const l of r) l.statuses.apply({ type: "freeze", chance: 1, dur: i ? 1.5 : 1 }, 0);
        (h.anim("iceburst", E.cx, E.cy, { scale: m.radius / 40 }),
          h.burst("glow", E.cx, E.cy, 20, 10545407),
          j.play("ice"),
          h.shake(2));
        break;
      }
      case "heal": {
        (E.heal(E.maxHp * m.power),
          E.statuses.clear("poison"),
          E.statuses.clear("burn"),
          t && E.buff("dmgReduce", 3, 0.25, "shield", "회복의 가호"),
          a.has("bastion") && E.buff("dmgReduce", 4, 0.3, "shield", "철벽"),
          i && (E.buff("regen", 5, 0.03, "regen", "생명의 샘"), E.buff("dmgReduce", 5, 0.3, "shield", "생명의 샘")),
          h.burst("rise", E.cx, E.cy, 24, 8454016),
          h.anim("ring", E.cx, E.cy, { scale: 0.8, tint: 8454016 }),
          j.play("heal"));
        break;
      }
      case "lightning": {
        const e = 5 + (t ? 3 : 0) + (a.has("storm") ? 3 : 0) + (i ? 4 : 0),
          r = this.params(C, this.dmg(m) * (a.has("storm") ? 1.2 : 1), { knock: 60, stagger: 0.3 }),
          l = [{ x: E.cx, y: E.cy }],
          s = new Set();
        let u = E.cx,
          d = E.cy,
          f = m.radius;
        for (let c = 0; c < e; c++) {
          let p = null,
            g = f;
          for (const y of R.targets()) {
            if (y.dead || s.has(y)) continue;
            const x = Math.hypot(y.body.x - u, y.body.y - y.body.h / 2 - d);
            x < g && ((g = x), (p = y));
          }
          if (!p) break;
          (s.add(p),
            (u = p.body.x),
            (d = p.body.y - p.body.h / 2),
            l.push({ x: u, y: d }),
            R.hitTarget(p, { ...r, dir: p.body.x < E.cx ? -1 : 1 }),
            i && p.statuses.apply({ type: "armorBreak", chance: 1, dur: 4, power: 0.5 }, 0),
            (f = 130),
            (n = !0));
        }
        (l.length === 1 && l.push({ x: E.cx + o * 60, y: E.cy - 10 }),
          this.drawBolt(l),
          j.play("lightning"),
          h.shake(2));
        break;
      }
      case "blades": {
        this.clearBlades();
        const e = 3 + (t ? 2 : 0) + (a.has("reaper") ? 2 : 0) + (i ? 3 : 0);
        for (let r = 0; r < e; r++)
          this.blades.push({
            s: R.ph.add.image(E.cx, E.cy, "p_blade").setDepth(26),
            a: (r / e) * Math.PI * 2,
            hitCd: new Map(),
          });
        ((this.bladeT = m.duration * (i ? 1.5 : 1)), (this.bladeDmg = this.dmg(m)), j.play("buff"));
        break;
      }
      case "fissure": {
        const e = a.has("quake"),
          r = this.params(C, this.dmg(m) * (e ? 1.2 : 1), {
            knock: 80,
            knockUp: 260,
            stagger: 0.5 * (e ? 1.5 : 1),
            status: t ? { type: "armorBreak", chance: 1, dur: 4, power: 0.5 } : { type: "stun", chance: 1, dur: 0.5 },
          }),
          l = m.radius * (e ? 1.4 : 1) * (i ? 1.8 : 1);
        let s = 0,
          u = new Set();
        i &&
          R.ph.time.delayedCall(420, () => {
            E.dead || !E.sprite.active || ((s = 0), (u = new Set()), d(), h.shake(3), j.play("thud"));
          });
        const d = () => {
          if (E.dead || !E.sprite.active) return;
          const f = E.cx + o * (20 + s * 22);
          let c = E.body.y;
          for (let p = -32; p <= 48; p += 16)
            if (R.collider.solidAtPx(f, c + p + 1) && !R.collider.solidAtPx(f, c + p - 15)) {
              c = c + p;
              break;
            }
          (h.anim("rockspike", f, c - 16, { scale: e ? 1.3 : 1, depth: 24 }), h.burst("chunk", f, c, 3, 11049080));
          for (const p of R.targets())
            p.dead ||
              u.has(p) ||
              (Math.abs(p.body.x - f) < 14 + p.body.w / 2 &&
                p.body.y > c - 40 &&
                p.body.y - p.body.h < c + 4 &&
                (u.add(p), R.hitTarget(p, { ...r, dir: o })));
          (s++, 20 + s * 22 < l && R.ph.time.delayedCall(45, d));
        };
        (d(), j.play("thud"), h.shake(3));
        break;
      }
      case "berserk": {
        (E.buff("berserk", m.duration, m.power, "berserk", "광전사"),
          E.buff("berserkSpd", m.duration, 0.25, "speed", "광폭"),
          i &&
            (E.buff("berserkLs", m.duration, 0.08, "regen", "피의 광란"),
            E.buff("speed", m.duration, 0.2, "speed", "피의 광란")),
          h.burst("glow", E.cx, E.cy, 20, 16724016),
          h.anim("ring", E.cx, E.cy, { scale: 1, tint: 16728128 }),
          j.play("buff"),
          h.shake(2));
        break;
      }
      case "vampstrike": {
        let e = null,
          r = m.radius;
        for (const s of R.targets()) {
          if (s.dead || s.kind === "object") continue;
          const u = Math.hypot(s.body.x - E.cx, s.body.y - E.body.y);
          u < r && ((r = u), (e = s));
        }
        const l = 0.4 * (t ? 1.5 : 1) * (a.has("sanguine") ? 2 : 1);
        if (e) {
          const s = e.body.x > E.cx ? -1 : 1,
            u = e.body.x + s * (e.body.w / 2 + 8);
          (R.collider.solidAtPx(u, e.body.y - 8) || ((E.body.x = u), (E.body.y = Math.min(E.body.y, e.body.y))),
            (E.facing = -s));
          const d = R.hitTarget(e, this.params(C, this.dmg(m), { dir: -s, knock: 200, stagger: 0.6 }));
          (E.heal(d * l),
            i && e.dead && ((this.cds[S] = 0), h.text(E.cx, E.body.y - 34, "연쇄!", "#ff6080")),
            h.anim("fx_heavy", e.body.x, e.body.y - e.body.h / 2, { flip: s > 0, tint: 16728160 }),
            (n = !0));
        } else
          (this.hitRadius(E.cx + o * 24, E.cy, 26, this.params(C, this.dmg(m))),
            h.anim("fx_heavy", E.cx + o * 20, E.cy, { flip: o < 0, tint: 16728160 }));
        ((E.iframes = Math.max(E.iframes, 0.25)), h.burst("glow", E.cx, E.cy, 10, 13639760), j.play("crit"));
        break;
      }
    }
    n && this.onSkillHit(C);
  }
  onSkillHit(S) {
    if (!S || !this.p.stats.synergies.has("arcanist")) return;
    const T = this.slots.indexOf(S);
    if (!(T < 0 || !this.arcaneReady[T])) {
      this.arcaneReady[T] = !1;
      for (let C = 0; C < 4; C++) C !== T && (this.cds[C] = Math.max(0, this.cds[C] - 0.5));
    }
  }
  addZone(S, T, C, E, R) {
    const h = this.p.host.collider;
    let m = T;
    if (h.solidAtPx(S, T)) {
      for (let a = 0; a < 8 && h.solidAtPx(S, m - 1); a++) m -= 8;
      m = Math.floor(m / 16) * 16 + 16;
    } else {
      for (let a = 0; a < 12 && !h.solidAtPx(S, m + 1); a++) m += 8;
      m = Math.floor((m + 1) / 16) * 16;
    }
    T = m;
    const t = [];
    for (let a = -2; a <= 2; a++)
      t.push(
        this.p.host.ph.add
          .sprite(S + a * (C / 2.5), T + 2, "flame")
          .setOrigin(0.5, 1)
          .setDepth(23)
          .play("flame_anim"),
      );
    this.zones.push({ x: S, y: T, r: C, t: E, tick: 0, dmg: R, s: t });
  }
  drawBolt(S) {
    const T = this.gfx;
    T.clear();
    for (let C = 0; C < 2; C++) {
      (T.lineStyle(C ? 1 : 3, C ? 16777215 : 16773216, 1), T.beginPath(), T.moveTo(S[0].x, S[0].y));
      for (let E = 1; E < S.length; E++) {
        const R = S[E - 1],
          h = S[E];
        for (let m = 1; m <= 4; m++) {
          const t = m / 4;
          T.lineTo(
            R.x + (h.x - R.x) * t + (m < 4 ? (Math.random() - 0.5) * 12 : 0),
            R.y + (h.y - R.y) * t + (m < 4 ? (Math.random() - 0.5) * 12 : 0),
          );
        }
      }
      T.strokePath();
    }
    for (const C of S.slice(1)) this.p.host.fx.anim("hitspark", C.x, C.y, { tint: 16773216, scale: 1.4 });
    this.boltT = 0.16;
  }
  update(S) {
    const T = this.p,
      C = T.host;
    for (let E = 0; E < 4; E++) this.cds[E] = Math.max(0, this.cds[E] - S);
    if (
      (this.boltT > 0 &&
        ((this.boltT -= S), this.gfx.setAlpha(Math.max(0, this.boltT / 0.16)), this.boltT <= 0 && this.gfx.clear()),
      this.dashSkill)
    ) {
      const E = this.dashSkill;
      ((E.t -= S), (T.body.vx = E.dir * 680), (T.body.vy = 0), (T.facing = E.dir));
      for (const R of C.targets()) {
        if (R.dead || E.hits.has(R)) continue;
        const h = R.body;
        Math.abs(h.x - T.cx) < h.w / 2 + 14 &&
          T.cy > h.y - h.h - 10 &&
          T.cy < h.y + 10 &&
          (E.hits.add(R),
          C.hitTarget(R, this.params("shadowdash", E.dmg, { dir: E.dir, knock: 100 })),
          C.fx.anim("fx_slash", h.x, h.y - h.h / 2, { tint: 11567359, flip: E.dir < 0 }));
      }
      (C.fx.burst("glow", T.cx, T.cy, 2, 9064656),
        E.t <= 0 &&
          ((this.dashSkill = null),
          (T.body.vx = E.dir * 150),
          E.boom &&
            (C.fx.anim("explode", T.cx, T.cy, { scale: 2, tint: 10510591, blend: !0 }),
            C.fx.shake(3),
            j.play("explosion", 0.8),
            this.hitRadius(T.cx, T.cy, 50, this.params("shadowdash", E.dmg * 1.5, { knock: 240, source: "aoe" })))));
    }
    if (this.bladeT > 0) {
      this.bladeT -= S;
      const E = T.stats.synergies.has("reaper"),
        R = 38;
      for (const h of this.blades) {
        h.a += S * 5.5;
        const m = T.cx + Math.cos(h.a) * R,
          t = T.cy + Math.sin(h.a) * R * 0.8;
        h.s.setPosition(m, t).setRotation(h.a * 3);
        for (const [a, v] of h.hitCd) v - S <= 0 ? h.hitCd.delete(a) : h.hitCd.set(a, v - S);
        for (const a of C.targets()) {
          if (a.dead || h.hitCd.has(a)) continue;
          const v = a.body;
          if (m > v.x - v.w / 2 - 5 && m < v.x + v.w / 2 + 5 && t > v.y - v.h - 5 && t < v.y + 5) {
            h.hitCd.set(a, 0.4);
            const o = C.hitTarget(
              a,
              this.params("blades", this.bladeDmg, { knock: 60, stagger: 0.15, dir: v.x < T.cx ? -1 : 1 }),
            );
            E && T.heal(o * 0.05, !1);
          }
        }
      }
      this.bladeT <= 0 && this.clearBlades();
    }
    for (let E = this.zones.length - 1; E >= 0; E--) {
      const R = this.zones[E];
      if (
        ((R.t -= S),
        (R.tick -= S),
        R.tick <= 0 &&
          ((R.tick = 0.4),
          this.hitRadius(
            R.x,
            R.y - 8,
            R.r,
            this.params("fireburst", R.dmg, { knock: 0, stagger: 0, noCrit: !0, source: "aoe" }),
          )),
        R.t <= 0)
      ) {
        for (const h of R.s) h.destroy();
        this.zones.splice(E, 1);
      }
    }
  }
  clearBlades() {
    for (const S of this.blades) S.s.destroy();
    ((this.blades = []), (this.bladeT = 0));
  }
  clearEffects() {
    this.clearBlades();
    for (const S of this.zones) for (const T of S.s) T.destroy();
    ((this.zones = []), (this.dashSkill = null), this.gfx.clear());
  }
  shift(S) {
    for (const T of this.zones) {
      T.x -= S;
      for (const C of T.s) C.x -= S;
    }
  }
  destroy() {
    (this.clearEffects(), this.gfx.destroy());
  }
}
const tr = () => ({
  atkPct: 0,
  weaponDmgPct: 0,
  atkSpdPct: 0,
  moveSpdPct: 0,
  critAdd: 0,
  critDmgAdd: 0,
  maxHpPct: 0,
  dmgTakenMult: 1,
  skillCdr: 0,
  skillDmgPct: 0,
  specialCdr: 0,
  lifesteal: 0,
  regen: 0,
  healMult: 0,
  dashCdr: 0,
  dashIframes: 0,
  extraJumps: 0,
  goldMult: 0,
  xpMult: 0,
  luck: 0,
  chain: 0,
  chainJumps: 0,
  burn: 0,
  frost: 0,
  poison: 0,
  bleed: 0,
  smite: 0,
  executePct: 0,
  bigDmgPct: 0,
  frostBonus: 0,
  airDmg: 0,
  rageMax: 0,
  killExplode: 0,
  killHeal: 0,
  frenzyMax: 0,
  critHeal: 0,
  dashNova: 0,
  orbs: 0,
  waveEvery: 0,
  multishot: 0,
  revives: 0,
  streakMult: 1,
  timeWarp: 0,
  evo: [],
  infuse: "",
  reactPct: 0,
  lethalUsed: !1,
});
class Ws {
  constructor(S, T, C, E) {
    Z(this, "body");
    Z(this, "sprite");
    Z(this, "shadow");
    Z(this, "hp");
    Z(this, "facing", 1);
    Z(this, "dead", !1);
    Z(this, "iframes", 0);
    Z(this, "hurtT", 0);
    Z(this, "coyote", 0);
    Z(this, "jumpBuf", 0);
    Z(this, "jumpCutDone", !1);
    Z(this, "dashT", 0);
    Z(this, "dashCd", 0);
    Z(this, "dashDir", 1);
    Z(this, "dashFollowT", 0);
    Z(this, "castT", 0);
    Z(this, "stunT", 0);
    Z(this, "statuses", new ai());
    Z(this, "buffs", new Map());
    Z(this, "run", tr());
    Z(this, "weapons");
    Z(this, "skills");
    Z(this, "surface", { ice: !1, quicksand: !1 });
    Z(this, "afterimages", []);
    Z(this, "aiT", 0);
    Z(this, "wasGround", !1);
    Z(this, "stepT", 0);
    Z(this, "idleT", 0);
    Z(this, "regenAcc", 0);
    Z(this, "lastHitT", 0);
    Z(this, "airJumps", 1);
    Z(this, "frenzyStacks", 0);
    Z(this, "frenzyT", 0);
    ((this.host = S), (this.stats = T));
    const R = S.ph;
    ((this.body = Je(C, E, Vt.bodyW, Vt.bodyH)),
      (this.shadow = R.add.image(C, E, "shadow").setDepth(19).setAlpha(0.6).setScale(0.6, 1)),
      (this.sprite = R.add.sprite(C, E, `player_${T.armorId}`, 0).setOrigin(0.5, 1).setDepth(20)),
      (this.hp = this.maxHp),
      (this.weapons = new qn(this)),
      (this.skills = new _n(this)));
    for (let h = 0; h < 6; h++)
      this.afterimages.push(R.add.image(0, 0, `player_${T.armorId}`, 12).setOrigin(0.5, 1).setDepth(19).setVisible(!1));
  }
  get maxHp() {
    return Math.max(1, Math.round(this.stats.maxHp * Math.max(0.2, 1 + this.run.maxHpPct)));
  }
  get x() {
    return this.body.x;
  }
  get y() {
    return this.body.y;
  }
  get cx() {
    return this.body.x;
  }
  get cy() {
    return this.body.y - this.body.h / 2;
  }
  applyStats(S) {
    const T = this.hp / this.maxHp;
    ((this.stats = S),
      (this.hp = Math.max(1, Math.round(this.maxHp * T))),
      this.sprite.setTexture(`player_${S.armorId}`, 0));
    for (const C of this.afterimages) C.setTexture(`player_${S.armorId}`, 12);
    (this.weapons.refresh(), this.skills.refresh());
  }
  buff(S, T, C, E, R) {
    const h = this.buffs.get(S);
    h
      ? ((h.t = Math.max(h.t, T)), (h.max = Math.max(h.max, T)), (h.value = Math.max(h.value, C)))
      : this.buffs.set(S, { id: S, t: T, max: T, value: C, icon: E, name: R });
  }
  buffVal(S) {
    const T = this.buffs.get(S);
    return T && T.t > 0 ? T.value : 0;
  }
  addFrenzy() {
    const S = Math.max(this.run.frenzyMax, this.run.evo.includes("evo_scythe") ? 6 : 0);
    S <= 0 || ((this.frenzyStacks = Math.min(S, this.frenzyStacks + 1)), (this.frenzyT = 4));
  }
  atkMult() {
    let S = 1 + this.run.atkPct + this.buffVal("atk") + this.buffVal("berserk") + this.frenzyStacks * 0.03;
    const T = this.stats.berserkMax + this.run.rageMax;
    if (T > 0) {
      const C = 1 - this.hp / this.maxHp;
      S += T * Ut(C / 0.8, 0, 1);
    }
    return S;
  }
  atkSpeedMult() {
    let S = this.stats.attackSpeed * (1 + this.buffVal("berserkSpd") + this.run.atkSpdPct);
    return (
      this.run.evo.includes("evo_dual") && this.weapons.id === "dual" && (S *= 1.25),
      this.stats.armorId === "berserker" && this.stats.armorPerk5 && this.hp / this.maxHp < 0.4 && (S *= 1.15),
      this.statuses.has("chill") && (S *= 0.8),
      S
    );
  }
  critChance(S = 0) {
    let T = this.stats.critChance + this.run.critAdd + this.buffVal("crit") + S;
    return Math.min(de.critCap, T);
  }
  moveSpeed() {
    let S = this.stats.moveSpeed * (1 + this.buffVal("speed") + this.run.moveSpdPct);
    return (
      this.stats.armorId === "cloth" && this.stats.armorPerk5 && this.dashFollowT < 0.6 && (S *= 1.2),
      (S *= this.statuses.slowMult() || 0),
      (S *= this.castSlow ?? 1),
      this.surface.quicksand && (S *= 0.5),
      S
    );
  }
  heal(S, T = !0) {
    if (this.dead) return 0;
    const C = Math.max(0, Math.round(S * this.stats.healEff * this.stats.healRecvMult * (1 + this.run.healMult))),
      E = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + C);
    const R = this.hp - E;
    return (T && R > 0 && this.host.fx.number(this.cx, this.body.y - 30, `+${R}`, "#7be36a"), R);
  }
  hurt(S) {
    if (this.dead || this.iframes > 0) return;
    const T = this.stats;
    let C = S.dmg;
    if (
      (S.element === "phys" ? (C *= 1 - T.defReduction) : (C *= (1 - T.resist) * T.elemTakenMult),
      S.melee && (C *= T.meleeTakenMult),
      T.armorId === "steel" && T.armorPerk10 && this.hp > this.maxHp * 0.5 && (C *= 0.9),
      T.armorId === "guardian" && T.armorPerk5 && Math.abs(this.body.vx) < 15 && (C *= 0.85),
      T.armorId === "guardian" && T.armorPerk10 && S.boss && (C *= 0.85),
      (C *= 1 - this.buffVal("dmgReduce")),
      (C *= this.run.dmgTakenMult),
      (C = FG.hurtMod(this, S, C)),
      (C = Math.max(1, Math.round(C))),
      S.melee && T.thornsPct > 0 && S.attacker && !S.attacker.dead)
    ) {
      const R = C * T.thornsPct + T.atk * 0.5 * this.atkMult();
      (this.host.hitTarget(S.attacker, {
        dmg: R,
        element: "phys",
        knock: 60,
        stagger: 0.15,
        dir: S.attacker.body.x < this.cx ? -1 : 1,
        source: "thorns",
        noCrit: !0,
        status: T.armorPerk5 ? { type: "bleed", chance: 1, dur: 3, power: 0.3 } : void 0,
      }),
        T.armorPerk10 && this.weapons.thornBurst());
    }
    if (
      ((this.hp -= C),
      (this.lastHitT = 0),
      this.host.fx.number(this.cx, this.body.y - 30, `-${C}`, "#ff5a4a", C > this.maxHp * 0.15),
      this.host.fx.burst("spark", this.cx, this.cy, 8, 16736336),
      this.host.fx.shake(C > this.maxHp * 0.15 ? 4 : 2),
      this.host.fx.stop(0.05),
      j.play("playerHurt"),
      S.status && this.statuses.apply(S.status, S.dmg, T.resist),
      this.hp <= 0 && this.run.revives > 0)
    ) {
      (this.run.revives--,
        (this.hp = Math.round(this.maxHp * 0.4)),
        (this.iframes = 2),
        this.statuses.clear(),
        this.host.fx.text(this.cx, this.body.y - 40, "부활!", "#ffd84a"),
        this.host.fx.burst("rise", this.cx, this.cy, 30, 16765024),
        this.host.fx.anim("ring", this.cx, this.cy, { scale: 2, tint: 16765024 }),
        j.play("levelup"));
      return;
    }
    if (this.hp <= 0 && T.armorId === "berserker" && T.armorPerk10 && !this.run.lethalUsed) {
      ((this.run.lethalUsed = !0),
        (this.hp = 1),
        (this.iframes = 1.5),
        this.host.fx.text(this.cx, this.body.y - 40, "불굴!", "#ff5a4a"));
      return;
    }
    if (this.hp <= 0) {
      ((this.hp = 0), this.die());
      return;
    }
    this.iframes = Vt.hurtIframes;
    const E = 1 - T.knockbackResist;
    ((!T.staggerImmune || S.dmg > this.maxHp * 0.2) &&
      ((this.body.vx = S.dir * Vt.hurtKnock * E * (S.knock > 0 ? 1 : 0.4)),
      (this.body.vy = -170 * Math.max(0.3, E)),
      (this.hurtT = 0.22 * Math.max(0.3, E)),
      this.weapons.interrupt()),
      this.sprite.setTintFill(16777215),
      this.host.ph.time.delayedCall(70, () => this.sprite.clearTint()));
  }
  die() {
    this.dead ||
      ((this.dead = !0),
      (this.body.vx = 0),
      this.weapons.hide(),
      this.skills.clearEffects(),
      j.play("death"),
      this.sprite.play(`pl_${this.stats.armorId}_death`, !0));
  }
  update(S, T) {
    var m, t;
    const C = this.body;
    ((this.iframes = Math.max(0, this.iframes - S)),
      (this.hurtT = Math.max(0, this.hurtT - S)),
      (this.dashCd = Math.max(0, this.dashCd - S)),
      (this.castT = Math.max(0, this.castT - S)),
      (this.stunT = Math.max(0, this.stunT - S)),
      (this.dashFollowT += S),
      (this.lastHitT += S),
      this.frenzyT > 0 && ((this.frenzyT -= S), this.frenzyT <= 0 && (this.frenzyStacks = 0)));
    for (const [a, v] of this.buffs) ((v.t -= S), v.t <= 0 && this.buffs.delete(a));
    if (
      (this.statuses.update(S, (a, v) => {
        if (this.dead) return;
        const o = Math.max(1, Math.round(a * (1 - this.stats.resist * 0.5)));
        ((this.hp -= o),
          this.host.fx.number(this.cx, this.body.y - 28, `-${o}`, v === "burn" ? "#ff9040" : "#a0e060"),
          this.hp <= 0 && ((this.hp = 0), this.die()));
      }),
      this.dead)
    ) {
      ((C.vy = Math.min(Vt.maxFall, C.vy + Vt.gravity * S)),
        (C.vx = Xt(C.vx, 0, 600 * S)),
        this.host.collider.move(C, S),
        this.syncSprite());
      return;
    }
    const E = this.statuses.has("stun") || this.statuses.has("freeze") || this.stunT > 0,
      R = this.hurtT <= 0 && !E && this.dashT <= 0 && !this.weapons.locksMovement();
    let h = 0;
    if (
      (R && (T.left && (h -= 1), T.right && (h += 1)),
      T.jump ? (this.jumpBuf = Vt.jumpBuffer) : (this.jumpBuf = Math.max(0, this.jumpBuf - S)),
      C.onGround
        ? ((this.coyote = Vt.coyote), (this.airJumps = 1 + this.run.extraJumps))
        : (this.coyote = Math.max(0, this.coyote - S)),
      T.dash &&
        this.dashCd <= 0 &&
        !E &&
        this.hurtT <= 0 &&
        !this.weapons.locksMovement() &&
        ((this.dashT = Vt.dashTime),
        (this.dashDir = h !== 0 ? h : this.facing),
        (this.facing = this.dashDir),
        (this.dashCd = this.stats.dashCd * Math.max(0.35, 1 - this.run.dashCdr)),
        (this.iframes = Math.max(this.iframes, this.stats.dashIframes + this.run.dashIframes)),
        (t = (m = this.host).onPlayerDash) == null || t.call(m),
        (this.dashFollowT = 0),
        this.weapons.interrupt(),
        j.play("dash"),
        this.host.fx.burst("dust", C.x, C.y, 4, 14209216),
        this.stats.armorId === "leather" &&
          this.stats.armorPerk10 &&
          this.buff("critNext", 1.2, 1, "crit", "확정 치명타"),
        this.stats.synergies.has("hunter") && this.buff("hunter", 1, 0.3, "atk", "사냥꾼")),
      this.dashT > 0)
    )
      ((this.dashT -= S),
        (C.vx = this.dashDir * Vt.dashSpeed),
        (C.vy = 0),
        (this.aiT -= S),
        this.aiT <= 0 && ((this.aiT = 0.03), this.spawnAfterimage()),
        this.dashT <= 0 && (C.vx = this.dashDir * this.moveSpeed() * 0.8));
    else if (!this.weapons.overrideMovement(S)) {
      const a = this.moveSpeed() * this.weapons.moveMult(),
        v = (this.surface.ice || C.groundSpec === 4) && C.onGround;
      if (h !== 0) {
        const o = C.onGround ? (v ? 320 : Vt.accelGround) : Vt.accelAir;
        ((C.vx = Xt(C.vx, h * a, o * S)), this.weapons.attacking() || (this.facing = h));
      } else if (this.hurtT <= 0) {
        const o = C.onGround ? (v ? 120 : Vt.decelGround) : Vt.decelAir;
        C.vx = Xt(C.vx, 0, o * S);
      }
      (R && this.jumpBuf > 0 && (C.onGround || this.coyote > 0)
        ? T.down && C.onGround && (C.groundCode === 2 || C.groundCode === 3 || C.groundCode === 20)
          ? ((C.dropThrough = 0.25), (C.y += 2), (this.jumpBuf = 0))
          : ((C.vy = -500 * (this.surface.quicksand ? 0.75 : 1) * (C.onGround && C.groundCode === 20 ? 1.25 : 1)),
            (this.jumpBuf = 0),
            (this.coyote = 0),
            (this.jumpCutDone = !1),
            j.play("jump"),
            this.host.fx.burst("dust", C.x, C.y, 3, 14209216))
        : R &&
          T.jump &&
          !C.onGround &&
          this.coyote <= 0 &&
          this.airJumps > 0 &&
          (this.airJumps--,
          (C.vy = -500 * 0.88),
          (this.jumpBuf = 0),
          (this.jumpCutDone = !1),
          j.play("jump", 1.25),
          this.host.fx.anim("ring", C.x, C.y - 2, { scale: 0.7, scaleY: 0.3, tint: 13691135 }),
          this.host.fx.burst("glow", C.x, C.y, 5, 13691135)),
        // 점프는 누르는 길이와 상관없이 항상 최대 높이 (키를 일찍 떼도 끊지 않는다)

        (C.vy = Math.min(Vt.maxFall, C.vy + Vt.gravity * S * (C.vy > 0 ? 1.15 : 1))));
      // 물: 천천히 가라앉고, 점프 키로 헤엄쳐 오른다 (걷는 속도도 느리다)
      if (C.inWater) {
        C.vy > 90 && (C.vy = 90);
        T.jump && C.vy > -240 && (C.vy = -240);
        const ms = a * 0.6;
        C.vx = Math.max(-ms, Math.min(ms, C.vx));
        this.airJumps = Math.max(this.airJumps, 1);
      }
      // 장치: 사다리·밧줄·덩굴 매달리기 · 짚라인 · 바람 기둥 · 물살 (forge/devices.js)
      FG.devMove && FG.devMove(this, C, T, S, a, h);
    }
    if (!E && this.hurtT <= 0) {
      (T.swap >= 0 && this.weapons.swap(T.swap), this.weapons.update(S, T));
      for (let a = 0; a < 4; a++) T.skills[a] && this.skills.cast(a, T);
    } else this.weapons.update(S, { ...T, attack: !1, attackHeld: !1, special: !1 });
    (this.skills.update(S),
      this.host.collider.move(C, S),
      C.onGround && !this.wasGround && (j.play("land"), C.vy >= 0 && this.host.fx.burst("dust", C.x, C.y, 3, 14209216)),
      (this.wasGround = C.onGround),
      C.onGround &&
        Math.abs(C.vx) > 40 &&
        ((this.stepT -= S),
        this.stepT <= 0 && ((this.stepT = 0.28), this.host.fx.burst("dust", C.x - this.facing * 4, C.y, 1, 13156528))),
      (this.idleT = Math.abs(C.vx) < 5 && C.onGround ? this.idleT + S : 0),
      this.syncSprite());
  }
  spawnAfterimage() {
    const S = this.afterimages.find((T) => !T.visible);
    S &&
      (S.setPosition(this.body.x, this.body.y)
        .setFrame(this.sprite.frame.name)
        .setFlipX(this.facing < 0)
        .setVisible(!0)
        .setAlpha(0.5)
        .setTint(8429823),
      this.host.ph.tweens.add({ targets: S, alpha: 0, duration: 220, onComplete: () => S.setVisible(!1) }));
  }
  syncSprite() {
    var m;
    const S = this.body,
      T = this.sprite;
    if (
      (T.setPosition(Math.round(S.x), Math.round(S.y)),
      T.setFlipX(this.facing < 0),
      this.shadow.setPosition(S.x, S.y).setVisible(S.onGround),
      this.iframes > 0 && this.dashT <= 0 && !this.dead
        ? T.setAlpha(Math.floor(this.iframes * 20) % 2 ? 0.5 : 1)
        : T.setAlpha(1),
      this.dead)
    )
      return;
    const C = this.stats.armorId;
    let E;
    const R = this.weapons.poseFrame();
    if (this.hurtT > 0) E = "hurt";
    else if (this.dashT > 0) E = "dash";
    else if (R !== null) {
      (T.anims.stop(), T.setFrame(R), this.weapons.updateVisual());
      return;
    } else
      this.castT > 0
        ? (E = "cast")
        : S.onGround
          ? Math.abs(S.vx) > 12
            ? (E = "run")
            : (E = "idle")
          : (E = S.vy < 0 ? "jump" : "fall");
    const h = `pl_${C}_${E}`;
    ((((m = T.anims.currentAnim) == null ? void 0 : m.key) !== h || !T.anims.isPlaying) && T.play(h, !0),
      E === "run" ? (T.anims.timeScale = Ut(Math.abs(S.vx) / 150, 0.6, 1.6)) : (T.anims.timeScale = 1),
      this.weapons.updateVisual());
  }
  shift(S) {
    ((this.body.x -= S), (this.sprite.x -= S), (this.shadow.x -= S), this.skills.shift(S), this.weapons.updateVisual());
  }
  destroy() {
    (this.sprite.destroy(), this.shadow.destroy(), this.weapons.destroy(), this.skills.destroy());
    for (const S of this.afterimages) S.destroy();
  }
}
class Hs {
  constructor(S) {
    Z(this, "nums", []);
    Z(this, "sprites", []);
    Z(this, "emitters", {});
    Z(this, "hitstop", 0);
    this.scene = S;
    for (let C = 0; C < 48; C++) {
      const E = S.add
        .text(0, 0, "", { fontFamily: ei, fontSize: "12px", color: "#ffffff", stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(60)
        .setVisible(!1);
      this.nums.push({ t: E, life: 0, vy: 0, vx: 0, active: !1 });
    }
    for (let C = 0; C < 64; C++) {
      const E = S.add.sprite(0, 0, "hitspark").setVisible(!1).setDepth(40);
      (E.on("animationcomplete", () => {
        E.setVisible(!1);
        const R = this.sprites.find((h) => h.s === E);
        R && (R.active = !1);
      }),
        this.sprites.push({ s: E, active: !1, vx: 0, vy: 0 }));
    }
    const T = (C, E, R, h = 35) => {
      const m = S.add.particles(0, 0, E, { emitting: !1, ...R });
      (m.setDepth(h), (this.emitters[C] = m));
    };
    (T("spark", "px1", {
      speed: { min: 60, max: 200 },
      lifespan: { min: 200, max: 420 },
      scale: { start: 1.5, end: 0 },
      gravityY: 300,
      maxAliveParticles: 220,
    }),
      T("chunk", "px3", {
        speed: { min: 50, max: 180 },
        angle: { min: 200, max: 340 },
        lifespan: { min: 400, max: 800 },
        gravityY: 700,
        scale: { start: 1, end: 0.4 },
        maxAliveParticles: 160,
      }),
      T(
        "dust",
        "soft",
        {
          speed: { min: 10, max: 50 },
          angle: { min: 180, max: 360 },
          lifespan: { min: 300, max: 600 },
          alpha: { start: 0.7, end: 0 },
          scale: { start: 1, end: 2 },
          maxAliveParticles: 120,
        },
        15,
      ),
      T("glow", "soft", {
        speed: { min: 20, max: 90 },
        lifespan: { min: 300, max: 700 },
        alpha: { start: 1, end: 0 },
        scale: { start: 1.2, end: 0 },
        blendMode: "ADD",
        maxAliveParticles: 220,
      }),
      T("rise", "px1", {
        speedY: { min: -70, max: -20 },
        speedX: { min: -20, max: 20 },
        lifespan: { min: 400, max: 900 },
        alpha: { start: 1, end: 0 },
        maxAliveParticles: 160,
      }));
  }
  number(S, T, C, E = "#ffffff", R = !1) {
    if (!it.data.settings.damageNumbers && E !== "#ffd84a" && E !== "#7be36a") return;
    let h = this.nums.find((m) => !m.active);
    (h || (h = this.nums.reduce((m, t) => (m.life < t.life ? m : t))),
      (h.active = !0),
      (h.life = R ? 0.9 : 0.7),
      (h.vy = R ? -70 : -55),
      (h.vx = (Math.random() - 0.5) * 30),
      h.t
        .setText(C)
        .setColor(E)
        .setPosition(S + (Math.random() - 0.5) * 8, T)
        .setVisible(!0)
        .setAlpha(1)
        .setFontFamily(R ? ei : ii)
        .setFontSize(R ? 14 : 11)
        .setScale(R ? 1.3 : 1));
  }
  text(S, T, C, E = "#ffffff") {
    let R = this.nums.find((h) => !h.active) ?? this.nums[0];
    ((R.active = !0),
      (R.life = 1.2),
      (R.vy = -30),
      (R.vx = 0),
      R.t
        .setText(C)
        .setColor(E)
        .setPosition(S, T)
        .setVisible(!0)
        .setAlpha(1)
        .setFontFamily(ei)
        .setFontSize(12)
        .setScale(1));
  }
  burst(S, T, C, E, R = 16777215) {
    const h = this.emitters[S];
    h && (h.setParticleTint(R), h.explode(E, T, C));
  }
  anim(S, T, C, E = {}) {
    let R = this.sprites.find((m) => !m.active);
    (R || (R = this.sprites[0]), (R.active = !0), (R.follow = E.follow), (R.vx = E.vx ?? 0), (R.vy = E.vy ?? 0));
    const h = R.s;
    return (
      h
        .setPosition(T, C)
        .setVisible(!0)
        .setFlipX(!!E.flip)
        .setRotation(E.rot ?? 0)
        .setScale(E.scale ?? 1, E.scaleY ?? E.scale ?? 1)
        .setDepth(E.depth ?? 40)
        .setAlpha(E.alpha ?? 1)
        .setOrigin(E.originX ?? 0.5, 0.5)
        .setBlendMode(E.blend ? zt.BlendModes.ADD : zt.BlendModes.NORMAL),
      E.tint !== void 0 ? h.setTint(E.tint) : h.clearTint(),
      h.play(S, !0),
      h
    );
  }
  update(S) {
    for (const T of this.nums)
      T.active &&
        ((T.life -= S),
        (T.t.y += T.vy * S),
        (T.t.x += T.vx * S),
        (T.vy += 60 * S),
        T.t.scale > 1 && T.t.setScale(Math.max(1, T.t.scale - S * 2)),
        T.life < 0.25 && T.t.setAlpha(Math.max(0, T.life / 0.25)),
        T.life <= 0 && ((T.active = !1), T.t.setVisible(!1)));
    for (const T of this.sprites)
      T.active &&
        (T.follow
          ? T.s.setPosition(T.follow.x, T.follow.y)
          : (T.vx || T.vy) && ((T.s.x += T.vx * S), (T.s.y += T.vy * S)));
  }
  shift(S) {
    for (const T of this.nums) T.active && (T.t.x -= S);
    for (const T of this.sprites) T.active && (T.s.x -= S);
    for (const T of Object.values(this.emitters))
      T.forEachAlive((C) => {
        C.x -= S;
      }, this);
  }
  shake(S, T = 120) {
    it.data.settings.shake && this.scene.cameras.main.shake(T, S * 0.0025, !1);
  }
  stop(S) {
    this.hitstop = Math.max(this.hitstop, S);
  }
}
class ks {
  constructor(S) {
    Z(this, "list", []);
    this.host = S;
  }
  get() {
    let S = this.list.find((T) => !T.active);
    return (
      S ||
        (this.list.length >= 160
          ? ((S = this.list[0]), (S.active = !1))
          : ((S = {
              active: !1,
              sprite: this.host.ph.add.sprite(0, 0, "p_rock").setDepth(25),
              x: 0,
              y: 0,
              vx: 0,
              vy: 0,
              g: 0,
              life: 0,
              radius: 4,
              pierce: 0,
              owner: "enemy",
              aoe: 0,
              homing: 0,
              spin: !1,
              ignoreTerrain: !1,
              ground: !1,
              hitSet: new Set(),
              trail: 0,
              trailT: 0,
              rotate: !0,
              bounceExplode: !1,
            }),
            this.list.push(S))),
      S
    );
  }
  spawn(S, T, C, E, R, h, m = {}) {
    const t = this.get(),
      a = S.speed * (m.speedMul ?? 1);
    ((t.active = !0),
      (t.x = T),
      (t.y = C),
      (t.vx = m.vx ?? Math.cos(E) * a),
      (t.vy = m.vy ?? Math.sin(E) * a),
      (t.g = S.gravity ?? 0),
      (t.life = S.life),
      (t.radius = S.radius),
      (t.pierce = (S.pierce ?? 0) + (m.pierce ?? 0)),
      (t.owner = R),
      (t.hit = h.hit),
      (t.ehit = h.ehit),
      (t.aoe = S.aoe ?? 0),
      (t.homing = S.homing ?? 0),
      (t.spin = !!S.spin),
      (t.ignoreTerrain = !!S.ignoreTerrain),
      (t.ground = !!m.ground),
      t.hitSet.clear(),
      (t.trail = S.trail ?? 0),
      (t.trailT = 0),
      (t.onDone = m.onDone),
      (t.rotate = !t.ground && !S.spin),
      (t.bounceExplode = !1));
    // 그림이 아직 없는 투사체(점액 덩이 등)는 만들어 두고, 끝내 없으면 기본 구슬로 (없는 그림 = 초록 상자로 보이던 문제)
    S.sprite = FG.projTex(this.host, S.sprite);
    const v = this.host.ph.textures.get(S.sprite);
    return (
      t.sprite
        .setTexture(S.sprite, 0)
        .setVisible(!0)
        .setActive(!0)
        .setPosition(T, C)
        .setScale(m.scale ?? 1)
        .setAlpha(1)
        .setFlipX(!1),
      m.tint !== void 0 ? t.sprite.setTint(m.tint) : t.sprite.clearTint(),
      v.frameTotal > 2 ? t.sprite.play(S.sprite + "_anim", !0) : t.sprite.stop(),
      t.ground
        ? (t.sprite.setRotation(0), t.sprite.setFlipX(t.vx < 0), t.sprite.setOrigin(0.5, 1))
        : t.sprite.setOrigin(0.5, 0.5),
      t
    );
  }
  kill(S) {
    var T;
    S.active &&
      ((S.active = !1),
      S.sprite.setVisible(!1).setActive(!1),
      S.aoe > 0 && this.explode(S),
      (T = S.onDone) == null || T.call(S, S));
  }
  explode(S) {
    var C;
    const T = this.host;
    if (
      (T.fx.anim("explode", S.x, S.y, {
        scale: S.aoe / 22,
        tint: S.owner === "enemy" && ((C = S.ehit) == null ? void 0 : C.element) === "fire" ? 16752736 : void 0,
      }),
      T.fx.shake(1.5),
      S.owner === "player" && S.hit)
    )
      for (const E of T.targets()) {
        if (E.dead || S.hitSet.has(E)) continue;
        const R = E.body.x,
          h = E.body.y - E.body.h / 2;
        Math.hypot(R - S.x, h - S.y) < S.aoe + Math.max(E.body.w, E.body.h) / 2 &&
          T.hitTarget(E, { ...S.hit, dir: R < S.x ? -1 : 1, source: "aoe" });
      }
    else if (S.ehit) {
      const E = T.player,
        R = E.body.x,
        h = E.body.y - E.body.h / 2;
      Math.hypot(R - S.x, h - S.y) < S.aoe + 8 &&
        T.hurtPlayer({ ...S.ehit, dir: R < S.x ? -1 : 1, srcX: S.x, melee: !1 });
    }
  }
  update(S) {
    const T = this.host,
      C = T.player;
    for (const E of this.list)
      if (E.active) {
        if (((E.life -= S), E.life <= 0)) {
          this.kill(E);
          continue;
        }
        if (E.homing > 0) {
          let R = 0,
            h = 0,
            m = !1;
          if (E.owner === "enemy") ((R = C.body.x), (h = C.body.y - 11), (m = !0));
          else {
            let t = 220;
            for (const a of T.targets()) {
              if (a.dead) continue;
              const v = Math.hypot(a.body.x - E.x, a.body.y - a.body.h / 2 - E.y);
              v < t && ((t = v), (R = a.body.x), (h = a.body.y - a.body.h / 2), (m = !0));
            }
          }
          if (m) {
            const t = Math.hypot(E.vx, E.vy),
              a = Math.atan2(E.vy, E.vx);
            let o = Math.atan2(h - E.y, R - E.x) - a;
            for (; o > Math.PI;) o -= Math.PI * 2;
            for (; o < -Math.PI;) o += Math.PI * 2;
            const n = a + Math.max(-E.homing * S, Math.min(E.homing * S, o));
            ((E.vx = Math.cos(n) * t), (E.vy = Math.sin(n) * t));
          }
        }
        if (((E.vy += E.g * S), (E.x += E.vx * S), (E.y += E.vy * S), E.ground)) {
          const R = T.collider;
          if (R.solidAtPx(E.x, E.y - 4))
            if (!R.solidAtPx(E.x, E.y - 20)) E.y -= 16;
            else {
              this.kill(E);
              continue;
            }
          else if (!R.solidAtPx(E.x, E.y + 4))
            if (R.solidAtPx(E.x, E.y + 20)) E.y += 16;
            else {
              this.kill(E);
              continue;
            }
        } else if (!E.ignoreTerrain && T.collider.solidAtPx(E.x, E.y)) {
          (T.fx.burst("dust", E.x, E.y, 3, 12628128), this.kill(E));
          continue;
        }
        if (
          (E.sprite.setPosition(E.x, E.y),
          E.spin ? (E.sprite.rotation += S * 16) : E.rotate && E.sprite.setRotation(Math.atan2(E.vy, E.vx)),
          E.trail && ((E.trailT -= S), E.trailT <= 0 && ((E.trailT = 0.03), T.fx.burst("glow", E.x, E.y, 1, E.trail))),
          E.owner === "player" && E.hit)
        ) {
          const R = E.ground ? 12 : E.radius;
          for (const h of T.targets()) {
            if (h.dead || E.hitSet.has(h)) continue;
            const m = h.body,
              t = E.ground ? E.y - 28 : E.y - R;
            if (ge(E.x - R, t, R * 2, E.ground ? 28 : R * 2, m.x - m.w / 2, m.y - m.h, m.w, m.h)) {
              if (E.aoe > 0 && E.pierce <= 0) {
                this.kill(E);
                break;
              }
              if ((E.hitSet.add(h), T.hitTarget(h, { ...E.hit, dir: E.vx >= 0 ? 1 : -1 }), E.pierce <= 0)) {
                this.kill(E);
                break;
              }
              E.pierce--;
            }
          }
        } else if (E.owner === "enemy" && E.ehit) {
          const R = C.body;
          if (
            !C.dead &&
            ge(E.x - E.radius, E.y - E.radius, E.radius * 2, E.radius * 2, R.x - R.w / 2, R.y - R.h, R.w, R.h) &&
            C.iframes <= 0
          ) {
            if (E.aoe > 0) {
              this.kill(E);
              continue;
            }
            if ((T.hurtPlayer({ ...E.ehit, dir: E.vx >= 0 ? 1 : -1, srcX: E.x }), E.pierce <= 0)) {
              this.kill(E);
              continue;
            }
            E.pierce--;
          }
        }
      }
  }
  shift(S) {
    for (const T of this.list) T.active && ((T.x -= S), (T.sprite.x -= S));
  }
  clearEnemy() {
    for (const S of this.list) S.active && S.owner === "enemy" && ((S.aoe = 0), this.kill(S));
  }
  clearAll() {
    for (const S of this.list) S.active && ((S.aoe = 0), (S.onDone = void 0), this.kill(S));
  }
}
const Hi = () => ({
    left: !1,
    right: !1,
    down: !1,
    jump: !1,
    jumpHeld: !1,
    dash: !1,
    attack: !1,
    attackHeld: !1,
    special: !1,
    skills: [!1, !1, !1, !1],
    swap: -1,
    interact: !1,
    aimX: 0,
    aimY: 0,
  }),
  Ts = (A) => `${Math.round(A * 100)}%`,
  qe = (A) => (A ? "켜짐" : "꺼짐"),
  Ss = (A) => (A >= 1 ? 0 : Math.round((A + 0.25) * 100) / 100);
function $s(A) {
  const S = it.data.settings;
  let T = A.scale.isFullscreen;
  return [
    {
      label: () => `배경음: ${Ts(S.music)}`,
      apply: () => {
        ((S.music = Ss(S.music)), j.setVolumes(S.music, S.sfx), it.touch());
      },
    },
    {
      label: () => `효과음: ${Ts(S.sfx)}`,
      apply: () => {
        ((S.sfx = Ss(S.sfx)), j.setVolumes(S.music, S.sfx), it.touch(), j.play("coin"));
      },
    },
    {
      label: () => `화면 흔들림: ${qe(S.shake)}`,
      apply: () => {
        ((S.shake = !S.shake), it.touch());
      },
    },
    {
      label: () => `피해 숫자: ${qe(S.damageNumbers)}`,
      apply: () => {
        ((S.damageNumbers = !S.damageNumbers), it.touch());
      },
    },
    {
      label: () => `적 체력 바: ${qe(S.enemyHpBars)}`,
      apply: () => {
        ((S.enemyHpBars = !S.enemyHpBars), it.touch());
      },
    },
    {
      label: () => `창 전환 시 자동 일시정지: ${qe(S.autoPause)}`,
      apply: () => {
        ((S.autoPause = !S.autoPause), it.touch());
      },
    },
    {
      label: () => `전체 화면: ${qe(T)}`,
      apply: () => {
        try {
          (A.scale.toggleFullscreen(), (T = !T));
        } catch {}
      },
    },
  ];
}
const Oi = [
    "키보드: A/D 이동 · Space 점프(2단 가능) · S+Space 발판 내려가기 · Shift 대시",
    "좌클릭 공격 · 우클릭 특수 · Q/E/R/F 스킬 · 1/2 무기 · E 상호작용 · Esc 메뉴",
  ],
  ki = { common: "#d8d0c0", rare: "#6ab8ff", epic: "#c58aff", legendary: "#ffa040" },
  Ks = { common: "일반", rare: "희귀", epic: "영웅", legendary: "전설" },
  er = (A) => A.weaponKinds.includes("melee"),
  ir = (A) => A.weaponKinds.some((S) => S === "ranged" || S === "magic"),
  Xi = (A) => A.skills.length > 0,
  sr = [
    {
      id: "b_atk",
      name: "예리한 칼날",
      rarity: "common",
      max: 10,
      icon: "sword",
      color: 16738896,
      desc: () => "공격력 +10%",
      apply: (A) => {
        A.atkPct += 0.1;
      },
    },
    {
      id: "b_aspd",
      name: "신속",
      rarity: "common",
      max: 6,
      icon: "clock",
      color: 16765024,
      desc: () => "공격 속도 +8%",
      apply: (A) => {
        A.atkSpdPct += 0.08;
      },
    },
    {
      id: "b_move",
      name: "경쾌한 발걸음",
      rarity: "common",
      max: 5,
      icon: "boot",
      color: 8446112,
      desc: () => "이동 속도 +7%",
      apply: (A) => {
        A.moveSpdPct += 0.07;
      },
    },
    {
      id: "b_hp",
      name: "강인함",
      rarity: "common",
      max: 8,
      icon: "heart",
      color: 16732256,
      desc: () => "최대 체력 +12%",
      apply: (A) => {
        A.maxHpPct += 0.12;
      },
    },
    {
      id: "b_crit",
      name: "정밀",
      rarity: "common",
      max: 8,
      icon: "crit",
      color: 16769120,
      desc: () => "치명타 확률 +4%",
      apply: (A) => {
        A.critAdd += 0.04;
      },
    },
    {
      id: "b_critdmg",
      name: "잔혹",
      rarity: "common",
      max: 6,
      icon: "fang",
      color: 16744512,
      desc: () => "치명타 피해 +20%",
      apply: (A) => {
        A.critDmgAdd += 0.2;
      },
    },
    {
      id: "b_cdr",
      name: "집중",
      rarity: "common",
      max: 5,
      icon: "book",
      color: 8429823,
      req: Xi,
      desc: () => "스킬 재사용 대기시간 -7%",
      apply: (A) => {
        A.skillCdr += 0.07;
      },
    },
    {
      id: "b_skill",
      name: "마력 증폭",
      rarity: "common",
      max: 6,
      icon: "star",
      color: 10518783,
      req: Xi,
      desc: () => "스킬 피해 +15%",
      apply: (A) => {
        A.skillDmgPct += 0.15;
      },
    },
    {
      id: "b_ls",
      name: "피의 굶주림",
      rarity: "common",
      max: 5,
      icon: "drop",
      color: 13639744,
      desc: () => "흡혈 +2% (준 피해의 일부를 회복)",
      apply: (A) => {
        A.lifesteal += 0.02;
      },
    },
    {
      id: "b_regen",
      name: "재생",
      rarity: "common",
      max: 5,
      icon: "heart",
      color: 6348896,
      desc: () => "초당 최대 체력의 0.4% 재생",
      apply: (A) => {
        A.regen += 0.004;
      },
    },
    {
      id: "b_gold",
      name: "탐욕",
      rarity: "common",
      max: 5,
      icon: "coin",
      color: 16764992,
      desc: () => "골드 획득 +10%",
      apply: (A) => {
        A.goldMult += 0.1;
      },
    },
    {
      id: "b_xp",
      name: "수련",
      rarity: "common",
      max: 4,
      icon: "book",
      color: 7393535,
      desc: () => "경험치 획득 +15%",
      apply: (A) => {
        A.xpMult += 0.15;
      },
    },
    {
      id: "b_dash",
      name: "바람걸음",
      rarity: "common",
      max: 4,
      icon: "wing",
      color: 10543359,
      desc: () => "대시 재사용 대기시간 -12%",
      apply: (A) => {
        A.dashCdr += 0.12;
      },
    },
    {
      id: "b_armor",
      name: "단단한 피부",
      rarity: "common",
      max: 5,
      icon: "shield",
      color: 11581640,
      desc: () => "받는 피해 -6%",
      apply: (A) => {
        A.dmgTakenMult *= 0.94;
      },
    },
    {
      id: "b_special",
      name: "숙련",
      rarity: "common",
      max: 4,
      icon: "fist",
      color: 16752736,
      desc: () => "무기 특수 공격 재사용 대기시간 -10%",
      apply: (A) => {
        A.specialCdr += 0.1;
      },
    },
    {
      id: "r_chain",
      name: "연쇄 번개",
      rarity: "rare",
      max: 4,
      icon: "bolt",
      color: 16773216,
      desc: (A) => `무기 적중 시 ${A === 1 ? 10 : 7}% 확률로 번개가 주변 적에게 연쇄 (공격력 70%)`,
      apply: (A, S) => {
        ((A.chain += S === 1 ? 0.1 : 0.07), (A.chainJumps = Math.max(A.chainJumps, 2) + (S > 1 ? 1 : 0)));
      },
    },
    {
      id: "r_burn",
      name: "점화",
      rarity: "rare",
      max: 3,
      icon: "flame",
      color: 16740384,
      desc: () => "무기 적중 시 15% 확률로 화상",
      apply: (A) => {
        A.burn += 0.15;
      },
    },
    {
      id: "r_frost",
      name: "서리 손길",
      rarity: "rare",
      max: 3,
      icon: "frost",
      color: 9494783,
      desc: () => "무기 적중 시 15% 확률로 둔화. 둔화된 적에게 피해 +10%",
      apply: (A) => {
        ((A.frost += 0.15), (A.frostBonus += 0.1));
      },
    },
    {
      id: "r_poison",
      name: "맹독",
      rarity: "rare",
      max: 3,
      icon: "poison",
      color: 10543168,
      desc: () => "무기 적중 시 20% 확률로 중독 (최대 3중첩)",
      apply: (A) => {
        A.poison += 0.2;
      },
    },
    {
      id: "r_bleed",
      name: "찢어발기기",
      rarity: "rare",
      max: 3,
      icon: "fang",
      color: 16728128,
      desc: () => "무기 적중 시 20% 확률로 출혈 (최대 3중첩)",
      apply: (A) => {
        A.bleed += 0.2;
      },
    },
    {
      id: "r_explode",
      name: "시체 폭발",
      rarity: "rare",
      max: 3,
      icon: "skull",
      color: 16748608,
      desc: () => "적 처치 시 폭발해 주변에 공격력 70% 피해",
      apply: (A) => {
        A.killExplode += 0.7;
      },
    },
    {
      id: "r_frenzy",
      name: "살육의 열기",
      rarity: "rare",
      max: 3,
      icon: "flame",
      color: 16724016,
      desc: (A) => `처치할 때마다 4초간 공격력 +3% (최대 ${A * 8}중첩)`,
      apply: (A) => {
        A.frenzyMax += 8;
      },
    },
    {
      id: "r_jump",
      name: "이단 도약",
      rarity: "rare",
      max: 2,
      icon: "feather",
      color: 14741759,
      desc: () => "공중에서 한 번 더 점프",
      apply: (A) => {
        A.extraJumps += 1;
      },
    },
    {
      id: "r_execute",
      name: "처형인",
      rarity: "rare",
      max: 3,
      icon: "skull",
      color: 12599360,
      desc: () => "체력 30% 이하인 적에게 피해 +25%",
      apply: (A) => {
        A.executePct += 0.25;
      },
    },
    {
      id: "r_giant",
      name: "거인 사냥꾼",
      rarity: "rare",
      max: 4,
      icon: "crown",
      color: 16760896,
      desc: () => "보스와 엘리트에게 피해 +15%",
      apply: (A) => {
        A.bigDmgPct += 0.15;
      },
    },
    {
      id: "r_critheal",
      name: "치명적 회복",
      rarity: "rare",
      max: 3,
      icon: "crit",
      color: 8454016,
      desc: () => "치명타 적중 시 최대 체력의 0.6% 회복",
      apply: (A) => {
        A.critHeal += 0.006;
      },
    },
    {
      id: "r_killheal",
      name: "포식",
      rarity: "rare",
      max: 3,
      icon: "drop",
      color: 14696544,
      desc: () => "적 처치 시 최대 체력의 1.5% 회복",
      apply: (A) => {
        A.killHeal += 0.015;
      },
    },
    {
      id: "r_air",
      name: "공중 지배",
      rarity: "rare",
      max: 3,
      icon: "wing",
      color: 8438015,
      desc: () => "공중에 있을 때 주는 피해 +18%",
      apply: (A) => {
        A.airDmg += 0.18;
      },
    },
    {
      id: "e_nova",
      name: "질풍 대시",
      rarity: "epic",
      max: 2,
      icon: "wave",
      color: 8442111,
      desc: (A) => `대시하면 주변에 충격파 (공격력 ${A * 150}%)`,
      apply: (A) => {
        A.dashNova += 1.5;
      },
    },
    {
      id: "e_orbs",
      name: "수호 구체",
      rarity: "epic",
      max: 4,
      icon: "orb",
      color: 6349055,
      desc: (A) => `주위를 도는 구체 ${A}개가 닿은 적에게 피해 (공격력 50%)`,
      apply: (A) => {
        A.orbs += 1;
      },
    },
    {
      id: "e_wave",
      name: "검기",
      rarity: "epic",
      max: 2,
      icon: "wave",
      color: 12640511,
      req: er,
      desc: (A) => `근접 공격 ${A === 1 ? 4 : 3}번마다 관통하는 검기 발사`,
      apply: (A, S) => {
        A.waveEvery = S === 1 ? 4 : 3;
      },
    },
    {
      id: "e_multi",
      name: "탄막",
      rarity: "epic",
      max: 3,
      icon: "star",
      color: 16769184,
      req: ir,
      desc: () => "원거리·마법 기본 공격이 25% 확률로 투사체 2개 추가",
      apply: (A) => {
        A.multishot += 0.25;
      },
    },
    {
      id: "e_last",
      name: "불굴",
      rarity: "epic",
      max: 1,
      icon: "shield",
      color: 16765024,
      desc: () => "치명적인 피해를 받으면 1회 체력 40%로 버팀",
      apply: (A) => {
        A.revives += 1;
      },
    },
    {
      id: "e_rage",
      name: "광기",
      rarity: "epic",
      max: 2,
      icon: "skull",
      color: 16719904,
      desc: () => "잃은 체력에 비례해 공격력 최대 +35%",
      apply: (A) => {
        A.rageMax += 0.35;
      },
    },
    {
      id: "l_warp",
      name: "시간 왜곡",
      rarity: "legendary",
      max: 1,
      icon: "clock",
      color: 12624127,
      req: Xi,
      desc: () => "스킬을 쓰면 다른 스킬의 재사용 대기시간 -1.5초",
      apply: (A) => {
        A.timeWarp += 1.5;
      },
    },
    {
      id: "l_smite",
      name: "천벌",
      rarity: "legendary",
      max: 1,
      icon: "bolt",
      color: 16775328,
      desc: () => "치명타 시 30% 확률로 하늘에서 벼락 (공격력 200%)",
      apply: (A) => {
        A.smite += 0.3;
      },
    },
    {
      id: "l_pact",
      name: "피의 계약",
      rarity: "legendary",
      max: 1,
      icon: "drop",
      color: 10485792,
      desc: () => "흡혈 +7%, 공격력 +20%, 최대 체력 -15%",
      apply: (A) => {
        ((A.lifesteal += 0.07), (A.atkPct += 0.2), (A.maxHpPct -= 0.15));
      },
    },
  ],
  ti = [...sr, ...Jn, ...Zn, ...Kn],
  Ci = [
    {
      id: "x_heart",
      name: "용의 심장",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "heart",
      color: 16728128,
      desc: () => "최대 체력 +30%, 받는 회복 +25%",
      apply: (A) => {
        ((A.maxHpPct += 0.3), (A.healMult += 0.25));
      },
    },
    {
      id: "x_horn",
      name: "광전사의 뿔",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "fang",
      color: 16732208,
      desc: () => "공격력 +25%, 받는 피해 +10%",
      apply: (A) => {
        ((A.atkPct += 0.25), (A.dmgTakenMult *= 1.1));
      },
    },
    {
      id: "x_cloak",
      name: "그림자 망토",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "moon",
      color: 8413376,
      desc: () => "대시 무적 +0.15초, 대시 재사용 -20%",
      apply: (A) => {
        ((A.dashIframes += 0.15), (A.dashCdr += 0.2));
      },
    },
    {
      id: "x_idol",
      name: "황금 우상",
      rarity: "rare",
      max: 1,
      relic: !0,
      icon: "coin",
      color: 16764992,
      desc: () => "골드 획득 +35%",
      apply: (A) => {
        A.goldMult += 0.35;
      },
    },
    {
      id: "x_stone",
      name: "현자의 돌",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "star",
      color: 10551248,
      desc: () => "스킬 재사용 -20%, 스킬 피해 +20%",
      apply: (A) => {
        ((A.skillCdr += 0.2), (A.skillDmgPct += 0.2));
      },
    },
    {
      id: "x_storm",
      name: "폭풍의 눈",
      rarity: "legendary",
      max: 1,
      relic: !0,
      icon: "eye",
      color: 16773216,
      desc: () => "연쇄 번개 확률 +15%, 연쇄 대상 +2",
      apply: (A) => {
        ((A.chain += 0.15), (A.chainJumps = Math.max(A.chainJumps, 2) + 2));
      },
    },
    {
      id: "x_fang",
      name: "흡혈귀의 송곳니",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "drop",
      color: 12587056,
      desc: () => "흡혈 +5%, 처치 시 최대 체력 2% 회복",
      apply: (A) => {
        ((A.lifesteal += 0.05), (A.killHeal += 0.02));
      },
    },
    {
      id: "x_crown",
      name: "서리 왕관",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "crown",
      color: 9494783,
      desc: () => "무기 적중 시 25% 둔화, 둔화된 적에게 피해 +25%",
      apply: (A) => {
        ((A.frost += 0.25), (A.frostBonus += 0.25));
      },
    },
    {
      id: "x_phoenix",
      name: "불사조 깃털",
      rarity: "legendary",
      max: 1,
      relic: !0,
      icon: "feather",
      color: 16748592,
      desc: () => "쓰러지면 1회 체력 40%로 부활",
      apply: (A) => {
        A.revives += 1;
      },
    },
    {
      id: "x_moon",
      name: "쌍둥이 달",
      rarity: "rare",
      max: 1,
      relic: !0,
      icon: "moon",
      color: 13687039,
      desc: () => "공중 점프 +1, 공중에서 피해 +15%",
      apply: (A) => {
        ((A.extraJumps += 1), (A.airDmg += 0.15));
      },
    },
    {
      id: "x_skull",
      name: "저주받은 해골",
      rarity: "legendary",
      max: 1,
      relic: !0,
      icon: "skull",
      color: 8453984,
      desc: () => "공격력 +45%, 최대 체력 -25%",
      apply: (A) => {
        ((A.atkPct += 0.45), (A.maxHpPct -= 0.25));
      },
    },
    {
      id: "x_coin",
      name: "행운의 동전",
      rarity: "rare",
      max: 1,
      relic: !0,
      icon: "coin",
      color: 14729312,
      desc: () => "각성 카드 등급이 높게 나올 확률 증가, 리롤 +2",
      apply: (A) => {
        A.luck += 1;
      },
    },
    {
      id: "x_seal",
      name: "학살자의 인장",
      rarity: "rare",
      max: 1,
      relic: !0,
      icon: "crown",
      color: 16736352,
      desc: () => "연속 처치 보너스 2배",
      apply: (A) => {
        A.streakMult *= 2;
      },
    },
    {
      id: "x_crystal",
      name: "수정 구체",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "orb",
      color: 8454143,
      desc: () => "수호 구체 +2",
      apply: (A) => {
        A.orbs += 2;
      },
    },
    {
      id: "x_gauntlet",
      name: "거인의 장갑",
      rarity: "rare",
      max: 1,
      relic: !0,
      icon: "fist",
      color: 13672560,
      desc: () => "보스·엘리트 피해 +25%",
      apply: (A) => {
        A.bigDmgPct += 0.25;
      },
    },
    {
      id: "x_glass",
      name: "시간의 모래시계",
      rarity: "rare",
      max: 1,
      relic: !0,
      icon: "clock",
      color: 14733472,
      desc: () => "무기 특수 공격 재사용 -30%",
      apply: (A) => {
        A.specialCdr += 0.3;
      },
    },
    {
      id: "x_volcano",
      name: "화산의 핵",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "flame",
      color: 16736272,
      desc: () => "화상 확률 +30%, 처치 시 폭발 (공격력 100%)",
      apply: (A) => {
        ((A.burn += 0.3), (A.killExplode += 1));
      },
    },
    {
      id: "x_wings",
      name: "천공의 날개",
      rarity: "epic",
      max: 1,
      relic: !0,
      icon: "wing",
      color: 16777215,
      desc: () => "이동 속도 +15%, 대시 시 충격파 (공격력 120%)",
      apply: (A) => {
        ((A.moveSpdPct += 0.15), (A.dashNova += 1.2));
      },
    },
  ],
  Ee = Object.fromEntries([...ti, ...Ci].map((A) => [A.id, A])),
  Zs = {
    steam: { name: "증기 폭발", desc: "화상 + 냉기: 넓은 범위 화염 폭발", text: "#e8f4ff", color: 15267071 },
    overload: { name: "과부하", desc: "화상 + 번개: 강하게 밀쳐내는 폭발", text: "#ffb040", color: 16756800 },
    superconduct: {
      name: "초전도",
      desc: "냉기 + 번개: 방어력 파괴와 추가 번개 피해",
      text: "#a0c0ff",
      color: 10535167,
    },
    corrode: { name: "부식", desc: "중독 + 화염: 남은 독을 터뜨리고 주변에 퍼뜨림", text: "#c0ff60", color: 10551104 },
    shatter: { name: "쇄빙", desc: "빙결 + 강타: 얼음을 깨뜨려 큰 추가 피해", text: "#c0f0ff", color: 12644607 },
    hemorrhage: {
      name: "혈폭",
      desc: "출혈 3중첩 + 치명타: 피를 터뜨려 큰 피해와 회복",
      text: "#ff5050",
      color: 16724032,
    },
  };
function nr(A) {
  const S = A.statuses;
  return {
    burn: S.has("burn"),
    chill: S.has("chill"),
    freeze: S.has("freeze"),
    poison: S.has("poison"),
    bleed: S.has("bleed") ? S.get("bleed").stacks : 0,
  };
}
function rr(A, S, T, C) {
  const E = A.statuses,
    R = S.element === "fire" || (!T.burn && E.has("burn")),
    h = S.element === "ice" || (!T.chill && E.has("chill")) || (!T.freeze && E.has("freeze")),
    m = S.element === "lightning",
    t = T.chill || T.freeze;
  return (T.burn && h) || (t && R)
    ? "steam"
    : T.burn && m
      ? "overload"
      : t && m
        ? "superconduct"
        : T.poison && R
          ? "corrode"
          : T.freeze && S.heavy
            ? "shatter"
            : T.bleed >= 3 && C
              ? "hemorrhage"
              : null;
}
const Ot = 16,
  Wt = 14,
  ne = ot - 32,
  Qt = 326;
function $i(A, S) {
  return _i(ae[A].upgrade.costBase, 1.3, S);
}
function Ki(A, S) {
  return _i(Math.max(60, He[A].price * 0.25), 1.3, S);
}
function Zi(A, S) {
  const T = De.find((C) => C.id === A);
  return _i(T.costBase, T.costGrowth, S);
}
const Ie = () => it.hasUnlock("adv_upgrade"),
  $e = (A) => {
    if (!A) return "";
    const S = oi.find((T) => {
      var C;
      return (C = T.unlocks) == null ? void 0 : C.includes(A);
    });
    return S ? `${yt(S.dist)}m 최초 도달 시 해금` : "해금 필요";
  };
class Ne {
  constructor(S, T, C) {
    Z(this, "objs", []);
    Z(this, "frame", []);
    Z(this, "sel", 0);
    Z(this, "closed", !1);
    Z(this, "keyHandler");
    Z(this, "goldText");
    ((this.scene = S), (this.title = T), (this.onClose = C));
    const F = FG.panelFrame(this, S, T);
    ((this.goldText = F.goldText),
      this.frame.push(...F.objs),
      (this.keyHandler = (a) => {
        this.closed ||
          (a.key === "Escape"
            ? this.close()
            : a.key === "Tab"
              ? (a.preventDefault && a.preventDefault(), this.facs && this.facIdx >= 0 && this.switchTo(this.facs[(this.facIdx + (a.shiftKey ? this.facs.length - 1 : 1)) % this.facs.length]))
              : a.key === "w" || a.key === "W" || a.key === "ArrowUp"
                ? ((this.sel = Math.max(0, this.sel - (this.cols ?? 1))), j.play("click"), this.render())
                : a.key === "s" || a.key === "S" || a.key === "ArrowDown"
                  ? ((this.sel = Math.min(this.count() - 1, this.sel + (this.cols ?? 1))), j.play("click"), this.render())
                  : this.cols && (a.key === "a" || a.key === "A" || a.key === "ArrowLeft")
                    ? ((this.sel = Math.max(0, this.sel - 1)), j.play("click"), this.render())
                    : this.cols && (a.key === "d" || a.key === "D" || a.key === "ArrowRight")
                      ? ((this.sel = Math.min(this.count() - 1, this.sel + 1)), j.play("click"), this.render())
                      : a.key === "Enter" && this.primary());
      }),
      S.input.keyboard.on("keydown", this.keyHandler),
      j.play("open"));
  }
  nav(S) {
    const T = this.count();
    T <= 1 || ((this.sel = (this.sel + S + T) % T), j.play("click"), this.render());
  }
  confirm() {
    this.closed || this.primary();
  }
  secondary() {}
  count() {
    return 1;
  }
  primary() {}
  render() {
    for (const S of this.objs) (this.scene.tweens.killTweensOf(S), S.destroy());
    ((this.objs = []), this.goldText.setText(yt(it.data.gold)), this.build());
  }
  close() {
    if (!this.closed) {
      ((this.closed = !0), this.scene.input.keyboard.off("keydown", this.keyHandler));
      for (const S of [...this.objs, ...this.frame]) (this.scene.tweens.killTweensOf(S), S.destroy());
      ((this.objs = []), (this.frame = []), j.play("close"), this.onClose());
    }
  }
  t(S, T, C, E = "body", R = q.text, h = {}) {
    const m = ct(this.scene, S, T, C, E, R, h).setScrollFactor(0).setDepth(203);
    return (this.objs.push(m), m);
  }
  img(S, T, C, E) {
    const R = this.scene.add.image(S, T, C, E).setScrollFactor(0).setDepth(203);
    return (this.objs.push(R), R);
  }
  box(S, T, C, E, R = "ui_inner") {
    const h = this.scene.add
      .nineslice(S, T, R, void 0, C, E, 4, 4, 4, 4)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(202);
    return (this.objs.push(h), h);
  }
  btn(S, T, C, E, R, h, m = {}) {
    const t = Be(this.scene, S, T, C, E, R, h, { style: m.style, small: m.small ?? !0, depth: 210 });
    return (
      t.bg.setScrollFactor(0),
      t.label.setScrollFactor(0),
      m.enabled === !1 && t.setEnabled(!1),
      this.objs.push(...t.container),
      t
    );
  }
  listItem(S, T, C, E, R, h, m, t, a, v) {
    const o = Ot + 10,
      n = 196;
    this.box(o, T, n, 25, this.sel === S ? "ui_inner_sel" : "ui_inner")
      .setInteractive({ useHandCursor: !0 })
      .on("pointerdown", () => {
        ((this.sel = S), j.play("click"), a(), this.render());
      });
    const r = this.img(o + 13, T + 12, C, v);
    (bi(r, 20),
      t === "locked" && r.setTint(4210752),
      this.t(o + 28, T + 2, E, "small", t === "locked" ? q.textDim : h),
      this.t(o + 28, T + 13, R, "tiny", m),
      t === "equipped" && this.img(o + n - 10, T + 12, "icon_check"),
      t === "locked" && this.img(o + n - 10, T + 12, "icon_lock"));
  }
  wrap(S, T) {
    return { wordWrap: { width: T, useAdvancedWrap: !0 } };
  }
}
class ar extends Ne {
  constructor(S, T) {
    (super(S, "대장간 · 무기", T),
      (this.sel = Math.max(
        0,
        ce.findIndex((C) => C.id === it.data.equip.weapons[0]),
      )),
      this.render());
  }
  count() {
    return ce.length;
  }
  primary() {
    const S = ce[this.sel];
    S.id in it.data.weapons ? this.upgrade(S.id) : this.buy(S.id);
  }
  secondary() {
    const S = ce[this.sel];
    S.id in it.data.weapons && it.data.equip.weapons[0] !== S.id && this.equip(S.id, 0);
  }
  buy(S) {
    const T = ae[S];
    if (!(!it.hasUnlock(T.unlock) || S in it.data.weapons)) {
      if (!it.spend(T.price)) {
        j.play("error");
        return;
      }
      ((it.data.weapons[S] = 0), it.write(), j.play("buy"), this.render());
    }
  }
  upgrade(S) {
    const T = it.data.weapons[S] ?? 0,
      C = Ie() ? Ni : Gi;
    if (!(T >= C)) {
      if (!it.spend($i(S, T))) {
        j.play("error");
        return;
      }
      ((it.data.weapons[S] = T + 1), it.write(), j.play("levelup"), this.render());
    }
  }
  equip(S, T) {
    const C = it.data.equip.weapons;
    (T === 1 && C[0] === S && (C[0] = C[1] ?? "sword"),
      T === 0 && C[1] === S && (C[1] = C[0]),
      (C[T] = S),
      C[0] === C[1] && (C[1] = null),
      it.write(),
      j.play("buy"),
      this.render());
  }
  build() {
    var g;
    const S = it.data;
    ce.forEach((y, x) => {
      const w = y.id in S.weapons,
        M = !w && !it.hasUnlock(y.unlock),
        P = S.equip.weapons.includes(y.id),
        L = M
          ? $e(y.unlock)
          : w
            ? `강화 +${S.weapons[y.id]}${P ? (S.equip.weapons[0] === y.id ? " · 주무기" : " · 보조") : ""}`
            : `${yt(y.price)} 골드`;
      this.listItem(
        x,
        Wt + 30 + x * 27,
        `w_${y.id}`,
        y.name,
        L,
        Ei[y.rarity],
        w ? q.textDim : M ? q.red : q.gold,
        M ? "locked" : P ? "equipped" : w ? "owned" : "buy",
        () => {},
      );
    });
    const T = ce[this.sel],
      C = Ot + 216,
      E = Wt + 30,
      R = ne - 226;
    this.box(C, E, R, Qt - 40);
    const h = S.weapons[T.id] ?? 0,
      m = T.id in S.weapons,
      t = this.img(C + 30, E + 26, `w_${T.id}`);
    (bi(t, 44),
      t.setRotation(-0.6),
      this.t(C + 60, E + 6, T.name, "big", Ei[T.rarity]),
      this.t(
        C + 60,
        E + 24,
        `${Ps[T.rarity]} · ${T.kind === "melee" ? "근접" : T.kind === "ranged" ? "원거리" : "마법"}${m ? ` · 강화 +${h}` : ""}`,
        "tiny",
        q.textDim,
      ),
      this.t(C + 8, E + 52, T.desc, "small", q.text, this.wrap(T.desc, R - 16)));
    const a = xe(S),
      v = { ...S, weapons: { ...S.weapons, [T.id]: h } },
      o = Wi(a, v, T.id),
      n = S.equip.weapons[0],
      i = Wi(a, S, n),
      e = o - i,
      r = is(a, v, T.id),
      l = Li(T.id, h);
    let s = E + 80;
    const u = (y, x, w = q.text) => {
      (this.t(C + 10, s, y, "small", q.textDim), this.t(C + 110, s, x, "small", w), (s += 13));
    };
    (u(
      "예상 DPS",
      `${o.toFixed(1)}${T.id !== n ? `  (${e >= 0 ? "+" : ""}${e.toFixed(1)} vs 주무기)` : "  (장착 중)"}`,
      T.id === n ? q.text : e >= 0 ? q.green : q.red,
    ),
      u(
        "기본 타격 피해",
        `${Math.round(r * T.combo[0].power)} ~ ${Math.round(r * Math.max(...T.combo.map((y) => y.power)))}  (${T.combo.length}연격)`,
      ));
    const d = Math.min(...T.combo.map((y) => y.interval));
    (u(
      "공격 간격 / 사거리",
      `${d.toFixed(2)}초 / ${T.combo[0].projectile ? "원거리" : `${Math.round(Math.max(...T.combo.map((y) => y.range)) * (1 + l.range))}px`}`,
    ),
      u(
        "치명타 보너스",
        `+${_t(T.critBonus + l.critChance)}${T.status ? ` · ${T.status.type === "burn" ? "화상" : T.status.type === "armorBreak" ? "방어 파괴" : T.status.type}` : ""}`,
      ),
      this.t(
        C + 10,
        s + 2,
        `특수 공격 [우클릭] ${T.special.name} · 재사용 ${(T.special.cooldown * (1 - l.specialCdr)).toFixed(1)}초`,
        "small",
        q.orange,
      ),
      (s += 15),
      this.t(C + 10, s, T.special.desc, "tiny", q.text),
      (s += 13),
      this.t(C + 10, s, `유리: ${T.strong}   불리: ${T.weak}`, "tiny", q.blue),
      (s += 11));
    const f = ke[T.id];
    f &&
      (this.t(
        C + 10,
        s,
        `탐험 중 진화 「${f.name}」: ${((g = Ee[f.catalyst]) == null ? void 0 : g.name) ?? f.catalyst} 각성 ${f.need}회 + Lv6`,
        "tiny",
        q.gold,
      ),
      (s += 13));
    for (const y of T.upgrade.perks) {
      const x = h >= y.level,
        w = y.level <= (Ie() ? Ni : Gi);
      (this.t(
        C + 10,
        s,
        `${x ? "✔" : "·"} +${y.level}  ${y.desc}${w ? "" : " (고급 강화 필요)"}`,
        "tiny",
        x ? q.green : q.textDim,
      ),
        (s += 11));
    }
    const c = E + Qt - 66,
      p = Ie() ? Ni : Gi;
    if (!m)
      it.hasUnlock(T.unlock)
        ? this.btn(C + 8, c, 170, 22, `구매 · ${yt(T.price)} 골드`, () => this.buy(T.id), {
            style: "green",
            enabled: S.gold >= T.price,
          })
        : this.btn(C + 8, c, 170, 22, `잠김 · ${$e(T.unlock)}`, () => {}, { enabled: !1 });
    else {
      const y = $i(T.id, h);
      (h >= p
        ? this.btn(C + 8, c, 130, 22, "최대 강화", () => {}, { enabled: !1 })
        : this.btn(C + 8, c, 130, 22, `강화 +${h + 1} · ${yt(y)}G`, () => this.upgrade(T.id), {
            style: "green",
            enabled: S.gold >= y,
          }),
        this.btn(
          C + 144,
          c,
          80,
          22,
          S.equip.weapons[0] === T.id ? "주무기 ✓" : "주무기 장착",
          () => this.equip(T.id, 0),
          { enabled: S.equip.weapons[0] !== T.id },
        ),
        this.btn(C + 230, c, 80, 22, S.equip.weapons[1] === T.id ? "보조 ✓" : "보조 장착", () => this.equip(T.id, 1), {
          enabled: S.equip.weapons[1] !== T.id,
        }));
    }
  }
}
class or extends Ne {
  constructor(T, C) {
    super(T, "방어구 제작소 · 갑옷", C);
    Z(this, "preview");
    ((this.sel = Math.max(
      0,
      le.findIndex((E) => E.id === it.data.equip.armor),
    )),
      this.render());
  }
  count() {
    return le.length;
  }
  primary() {
    const T = le[this.sel];
    T.id in it.data.armors ? this.upgrade(T.id) : this.buy(T.id);
  }
  secondary() {
    const T = le[this.sel];
    T.id in it.data.armors &&
      it.data.equip.armor !== T.id &&
      ((it.data.equip.armor = T.id), it.write(), j.play("buy"), this.render());
  }
  buy(T) {
    const C = He[T];
    if (!(!it.hasUnlock(C.unlock) || T in it.data.armors)) {
      if (!it.spend(C.price)) {
        j.play("error");
        return;
      }
      ((it.data.armors[T] = 0), it.write(), j.play("buy"), this.render());
    }
  }
  upgrade(T) {
    const C = it.data.armors[T] ?? 0,
      E = Ie() ? ms : ps;
    if (!(C >= E)) {
      if (!it.spend(Ki(T, C))) {
        j.play("error");
        return;
      }
      ((it.data.armors[T] = C + 1), it.write(), j.play("levelup"), this.render());
    }
  }
  render() {
    var T;
    ((T = this.preview) == null || T.destroy(), super.render());
  }
  close() {
    var T;
    ((T = this.preview) == null || T.destroy(), super.close());
  }
  build() {
    const T = it.data;
    le.forEach((u, d) => {
      const f = u.id in T.armors,
        c = !f && !it.hasUnlock(u.unlock),
        p = T.equip.armor === u.id,
        g = c ? $e(u.unlock) : f ? `강화 +${T.armors[u.id]}${p ? " · 장착 중" : ""}` : `${yt(u.price)} 골드`;
      this.listItem(
        d,
        Wt + 30 + d * 27,
        `icon_a_${u.id}`,
        u.name,
        g,
        Ei[u.rarity],
        f ? q.textDim : c ? q.red : q.gold,
        c ? "locked" : p ? "equipped" : f ? "owned" : "buy",
        () => {},
      );
    });
    const C = le[this.sel],
      E = Ot + 216,
      R = Wt + 30,
      h = ne - 226;
    this.box(E, R, h, Qt - 40);
    const m = T.armors[C.id] ?? 0,
      t = C.id in T.armors;
    (this.box(E + 6, R + 6, 54, 62, "ui_inner_sel"),
      (this.preview = this.scene.add
        .sprite(E + 33, R + 62, `player_${C.id}`, 0)
        .setOrigin(0.5, 1)
        .setScale(1.6)
        .setScrollFactor(0)
        .setDepth(204)
        .play(`pl_${C.id}_idle`)),
      this.t(E + 68, R + 6, C.name, "big", Ei[C.rarity]),
      this.t(
        E + 68,
        R + 24,
        `${Ps[C.rarity]} · ${C.weight === "light" ? "경갑" : C.weight === "medium" ? "중갑" : "중장갑"}${t ? ` · 강화 +${m}` : ""}`,
        "tiny",
        q.textDim,
      ),
      this.t(E + 68, R + 36, C.desc, "tiny", q.text, this.wrap(C.desc, h - 76)),
      this.t(E + 68, R + 58, `단점: ${C.cons}`, "tiny", q.red, this.wrap(C.cons, h - 76)));
    const a = { ...T.equip, armor: C.id },
      v = { ...T, armors: { ...T.armors, [C.id]: m } },
      o = xe(v, a),
      n = xe(T);
    let i = R + 78;
    const e = (u, d, f, c) => {
      (this.t(E + 10, i, u, "small", q.textDim),
        this.t(E + 110, i, d, "small", q.text),
        C.id !== T.equip.armor &&
          f !== 0 &&
          c !== null &&
          this.t(
            E + 200,
            i,
            `${f > 0 ? "▲" : "▼"} ${Math.abs(f) < 1 ? _t(Math.abs(f), 1) : yt(Math.abs(f))}`,
            "small",
            c ? q.green : q.red,
          ),
        (i += 13));
    };
    (e("최대 체력", yt(o.maxHp), o.maxHp - n.maxHp, o.maxHp >= n.maxHp),
      e(
        "물리 방어력",
        `${Math.round(o.def)} (피해 -${_t(o.defReduction)})`,
        o.defReduction - n.defReduction,
        o.defReduction >= n.defReduction,
      ),
      e("속성 저항", _t(o.resist), o.resist - n.resist, o.resist >= n.resist),
      e("이동 속도", `${Math.round(o.moveSpeed)}`, Math.round(o.moveSpeed - n.moveSpeed), o.moveSpeed >= n.moveSpeed),
      e("공격 속도", `x${o.attackSpeed.toFixed(2)}`, o.attackSpeed - n.attackSpeed, o.attackSpeed >= n.attackSpeed),
      e("대시 재사용", `${o.dashCd.toFixed(2)}초`, o.dashCd - n.dashCd, o.dashCd <= n.dashCd));
    const r = C.passive.base + C.passive.perLevel * m;
    (this.t(
      E + 10,
      i + 2,
      `고유 효과: ${C.passiveDesc.replace("{v}", String(Math.round(r * 10) / 10))}`,
      "small",
      q.orange,
      this.wrap("", h - 20),
    ),
      (i += 30));
    for (const u of C.perks) {
      const d = m >= u.level;
      (this.t(E + 10, i, `${d ? "✔" : "·"} +${u.level}  ${u.desc}`, "tiny", d ? q.green : q.textDim), (i += 11));
    }
    const l = R + Qt - 66,
      s = Ie() ? ms : ps;
    if (!t)
      it.hasUnlock(C.unlock)
        ? this.btn(E + 8, l, 170, 22, `구매 · ${yt(C.price)} 골드`, () => this.buy(C.id), {
            style: "green",
            enabled: T.gold >= C.price,
          })
        : this.btn(E + 8, l, 190, 22, `잠김 · ${$e(C.unlock)}`, () => {}, { enabled: !1 });
    else {
      const u = Ki(C.id, m);
      (m >= s
        ? this.btn(E + 8, l, 130, 22, "최대 강화", () => {}, { enabled: !1 })
        : this.btn(E + 8, l, 130, 22, `강화 +${m + 1} · ${yt(u)}G`, () => this.upgrade(C.id), {
            style: "green",
            enabled: T.gold >= u,
          }),
        this.btn(
          E + 144,
          l,
          100,
          22,
          T.equip.armor === C.id ? "장착 중 ✓" : "장착",
          () => {
            ((T.equip.armor = C.id), it.write(), j.play("buy"), this.render());
          },
          { enabled: T.equip.armor !== C.id },
        ));
    }
  }
}
class hr extends Ne {
  constructor(S, T) {
    (super(S, "훈련소 · 영구 능력치", T), this.render());
  }
  count() {
    return De.length;
  }
  primary() {
    this.train(De[this.sel].id);
  }
  train(S) {
    const T = De.find((E) => E.id === S),
      C = it.data.training[S] ?? 0;
    if (!(C >= T.maxLevel)) {
      if (!it.spend(Zi(S, C))) {
        j.play("error");
        return;
      }
      ((it.data.training[S] = C + 1), it.write(), j.play("levelup"), this.render());
    }
  }
  build() {
    const S = it.data,
      T = (C, E) => (C.fmt === "pct" ? `+${_t(E, E < 0.1 ? 1 : 0)}` : `+${Math.round(E * 10) / 10}`);
    (De.forEach((C, E) => {
      const R = Wt + 32 + E * 27,
        h = S.training[C.id] ?? 0,
        m = Yi(C, h),
        t = Yi(C, h + 1),
        a = this.sel === E;
      (this.box(Ot + 10, R, ne - 20, 25, a ? "ui_inner_sel" : "ui_inner")
        .setInteractive()
        .on("pointerdown", () => {
          ((this.sel = E), this.render());
        }),
        this.img(Ot + 24, R + 12, `icon_st_${C.id}`),
        this.t(Ot + 36, R + 2, C.name, "small", q.text),
        this.t(Ot + 36, R + 13, C.desc, "tiny", q.textDim));
      const o = Math.min(6, 150 / C.maxLevel);
      for (let e = 0; e < C.maxLevel; e++) {
        const r = this.scene.add
          .rectangle(Ot + 150 + e * o, R + 9, o - 1, 7, e < h ? 14200912 : 3813440)
          .setOrigin(0)
          .setScrollFactor(0)
          .setDepth(203);
        this.objs.push(r);
      }
      this.t(Ot + 150, R + 16, `Lv ${h}/${C.maxLevel}`, "tiny", q.textDim);
      const n = h >= C.maxLevel;
      (this.t(Ot + 320, R + 7, n ? `${T(C, m)} (최대)` : `${T(C, m)}  →  `, "small", q.text),
        n || this.t(Ot + 320 + 72, R + 7, T(C, t), "small", q.green));
      const i = Zi(C.id, h);
      this.btn(
        Ot + ne - 110,
        R + 2,
        96,
        21,
        n ? "최대" : `${yt(i)}G`,
        () => {
          ((this.sel = E), this.train(C.id));
        },
        { style: "green", enabled: !n && S.gold >= i },
      );
    }),
      this.t(
        Ot + 12,
        Wt + Qt - 14,
        "강화 단계가 올라갈수록 효율이 감소합니다. 방어력은 갑옷과 합산되며 피해 감소는 최대 75%입니다.",
        "tiny",
        q.textDim,
      ));
  }
}
class lr extends Ne {
  constructor(S, T) {
    (super(S, "마법 연구소 · 스킬", T), this.render());
  }
  count() {
    return Se.length;
  }
  primary() {
    const S = Se[this.sel];
    S.id in it.data.skills ? this.upgrade(S.id) : this.buy(S.id);
  }
  secondary() {
    const S = Se[this.sel],
      T = it.data;
    if (!(S.id in T.skills) || T.equip.skills.slice(0, T.skillSlots).includes(S.id)) return;
    let C = T.equip.skills.findIndex((E, R) => !E && R < T.skillSlots);
    (C < 0 && (C = 0), this.equip(S.id, C));
  }
  buy(S) {
    const T = ve[S];
    if (!(!it.hasUnlock(T.unlock) || S in it.data.skills)) {
      if (!it.spend(T.price)) {
        j.play("error");
        return;
      }
      ((it.data.skills[S] = 1), it.write(), j.play("buy"), this.render());
    }
  }
  upgrade(S) {
    const T = it.data.skills[S] ?? 1,
      C = Ie() ? xs : gs;
    if (!(T >= C)) {
      if (!it.spend(hs(ve[S].price, T))) {
        j.play("error");
        return;
      }
      ((it.data.skills[S] = T + 1), it.write(), j.play("levelup"), this.render());
    }
  }
  equip(S, T) {
    const C = it.data.equip.skills,
      E = C.indexOf(S);
    (E >= 0 && (C[E] = C[T]), (C[T] = S), it.write(), j.play("buy"), this.render());
  }
  build() {
    const S = it.data;
    Se.forEach((d, f) => {
      const c = d.id in S.skills,
        p = !c && !it.hasUnlock(d.unlock),
        g = S.equip.skills.indexOf(d.id),
        y = p
          ? $e(d.unlock)
          : c
            ? `Lv ${S.skills[d.id]}${g >= 0 && g < S.skillSlots ? ` · [${"QERF"[g]}]` : ""}`
            : `${yt(d.price)} 골드`;
      this.listItem(
        f,
        Wt + 30 + f * 27,
        `icon_s_${d.id}`,
        d.name,
        y,
        q.text,
        c ? q.textDim : p ? q.red : q.gold,
        p ? "locked" : g >= 0 && g < S.skillSlots ? "equipped" : c ? "owned" : "buy",
        () => {},
      );
    });
    const T = Se[this.sel],
      C = Ot + 216,
      E = Wt + 30,
      R = ne - 226;
    this.box(C, E, R, Qt - 40);
    const h = S.skills[T.id] ?? 1,
      m = T.id in S.skills;
    (this.img(C + 24, E + 24, `icon_s_${T.id}`).setScale(2),
      this.t(C + 50, E + 8, T.name, "big", q.text),
      this.t(C + 50, E + 26, m ? `레벨 ${h}` : "미습득", "tiny", q.textDim),
      this.t(C + 10, E + 50, T.desc, "small", q.text, this.wrap(T.desc, R - 20)));
    const a = xe(S),
      v = Fi(T, h, a),
      o = Fi(T, h + 1, a);
    let n = E + 78;
    const i = (d, f, c) => {
      (this.t(C + 10, n, d, "small", q.textDim),
        this.t(C + 110, n, f, "small", q.text),
        c && m && this.t(C + 200, n, `→ ${c}`, "small", q.green),
        (n += 13));
    };
    (T.id === "heal"
      ? i("회복량", `최대 체력의 ${_t(v.power * a.healEff)}`, _t(o.power * a.healEff))
      : T.id === "berserk"
        ? i("공격력 증가", `+${_t(v.power)}`, `+${_t(o.power)}`)
        : i(
            "위력",
            `공격력의 ${_t(v.power * a.skillPower)} (${Math.round(a.atk * v.power * a.skillPower)})`,
            _t(o.power * a.skillPower),
          ),
      i("재사용 대기", `${v.cooldown.toFixed(1)}초`, `${o.cooldown.toFixed(1)}초`),
      T.radius > 0 && i("범위", `${Math.round(v.radius)}`, `${Math.round(o.radius)}`),
      T.duration > 0 && i("지속시간", `${v.duration.toFixed(1)}초`, `${o.duration.toFixed(1)}초`),
      this.t(C + 10, n + 2, `Lv5 고유 효과: ${T.lvl5}`, "small", h >= 5 ? q.green : q.orange),
      (n += 18));
    const e = ss[T.id];
    e && (this.t(C + 10, n, `탐험 중 강화 「${e.name}」: ${e.desc}`, "tiny", q.gold), (n += 11));
    const r = Qi.filter((d) => {
      var f;
      return (f = d.skill) == null ? void 0 : f.includes(T.id);
    });
    for (const d of r) (this.t(C + 10, n, `시너지 「${d.name}」 ${d.desc}`, "tiny", q.purple), (n += 11));
    const l = E + Qt - 92;
    this.t(C + 10, l - 2, "스킬 슬롯", "tiny", q.textDim);
    for (let d = 0; d < 4; d++) {
      const f = d < S.skillSlots,
        c = S.equip.skills[d],
        p = C + 10 + d * 60;
      if (f) {
        const g = this.btn(
          p,
          l + 10,
          54,
          22,
          `${"QERF"[d]}: ${c ? ve[c].name.slice(0, 3) : "-"}`,
          () => {
            m && this.equip(T.id, d);
          },
          { enabled: m },
        );
        c === T.id && g.setSelected(!0);
      } else {
        const g = In[d],
          y = d === 3 && !it.hasUnlock("slot4"),
          x = d === S.skillSlots && !y;
        this.btn(
          p,
          l + 10,
          54,
          22,
          y ? "2000m" : `🔓${yt(g)}`,
          () => {
            if (x) {
              if (!it.spend(g)) {
                j.play("error");
                return;
              }
              ((S.skillSlots = d + 1), it.write(), j.play("buy"), this.render());
            }
          },
          { enabled: x && S.gold >= g },
        );
      }
    }
    const s = Ie() ? xs : gs,
      u = E + Qt - 66 + 14;
    if (!m)
      it.hasUnlock(T.unlock)
        ? this.btn(C + 8, u, 170, 22, `습득 · ${yt(T.price)} 골드`, () => this.buy(T.id), {
            style: "green",
            enabled: S.gold >= T.price,
          })
        : this.btn(C + 8, u, 190, 22, `잠김 · ${$e(T.unlock)}`, () => {}, { enabled: !1 });
    else {
      const d = hs(T.price, h);
      h >= s
        ? this.btn(C + 8, u, 130, 22, "최대 레벨", () => {}, { enabled: !1 })
        : this.btn(C + 8, u, 150, 22, `강화 Lv${h + 1} · ${yt(d)}G`, () => this.upgrade(T.id), {
            style: "green",
            enabled: S.gold >= d,
          });
    }
  }
}
class ur extends Ne {
  constructor(S, T) {
    (super(S, "장비 관리소 · 빌드", T), this.render());
  }
  cycle(S, T, C) {
    const E = S.indexOf(T);
    return S[(E + C + S.length) % S.length];
  }
  build() {
    var u, d;
    const S = it.data,
      T = S.equip,
      C = xe(S),
      E = Ot + 10,
      R = Wt + 32;
    (this.box(E, R, 290, Qt - 42), this.t(E + 8, R + 4, "현재 조합", "small", q.gold));
    const h = ce.filter((f) => f.id in S.weapons).map((f) => f.id),
      m = le.filter((f) => f.id in S.armors).map((f) => f.id),
      t = Se.filter((f) => f.id in S.skills).map((f) => f.id);
    let a = R + 20;
    const v = (f, c, p, g, y, x = 0) => {
      if ((this.t(E + 8, a + 5, f, "tiny", q.textDim), this.box(E + 52, a, 24, 22, "ui_inner_sel"), c)) {
        const w = this.img(E + 64, a + 11, c);
        (bi(w, 18), w.setRotation(x));
      }
      (this.t(E + 82, a + 5, p, "small", q.text),
        this.btn(E + 226, a + 1, 24, 20, "◀", () => {
          (g(), it.write(), this.render());
        }),
        this.btn(E + 254, a + 1, 24, 20, "▶", () => {
          (y(), it.write(), this.render());
        }),
        (a += 25));
    };
    v(
      "주무기 [1]",
      `w_${T.weapons[0]}`,
      ae[T.weapons[0]].name,
      () => {
        T.weapons[0] = this.cycle(
          h.filter((f) => f !== T.weapons[1]),
          T.weapons[0],
          -1,
        );
      },
      () => {
        T.weapons[0] = this.cycle(
          h.filter((f) => f !== T.weapons[1]),
          T.weapons[0],
          1,
        );
      },
      -0.6,
    );
    const o = [null, ...h.filter((f) => f !== T.weapons[0])];
    (v(
      "보조 [2]",
      T.weapons[1] ? `w_${T.weapons[1]}` : "",
      T.weapons[1] ? ae[T.weapons[1]].name : "(없음)",
      () => {
        T.weapons[1] = this.cycle(o, T.weapons[1], -1);
      },
      () => {
        T.weapons[1] = this.cycle(o, T.weapons[1], 1);
      },
      -0.6,
    ),
      v(
        "갑옷",
        `icon_a_${T.armor}`,
        He[T.armor].name,
        () => {
          T.armor = this.cycle(m, T.armor, -1);
        },
        () => {
          T.armor = this.cycle(m, T.armor, 1);
        },
      ));
    for (let f = 0; f < 4; f++) {
      if (f >= S.skillSlots) {
        (this.t(E + 8, a + 5, `스킬 [${"QERF"[f]}]`, "tiny", q.textDim),
          this.t(E + 82, a + 5, "잠긴 슬롯 (마법 연구소)", "small", q.textDim),
          (a += 25));
        continue;
      }
      const c = [null, ...t.filter((g) => !T.skills.includes(g) || T.skills[f] === g)],
        p = T.skills[f];
      v(
        `스킬 [${"QERF"[f]}]`,
        p ? `icon_s_${p}` : "",
        p ? `${ve[p].name} Lv${S.skills[p]}` : "(없음)",
        () => {
          T.skills[f] = this.cycle(c, p, -1);
        },
        () => {
          T.skills[f] = this.cycle(c, p, 1);
        },
      );
    }
    ((a += 4), this.t(E + 8, a, "장착 프리셋", "small", q.gold), (a += 15));
    for (let f = 0; f < 3; f++) {
      const c = S.presets[f];
      (this.t(
        E + 8,
        a + 5,
        c
          ? `${f + 1}. ${((u = ae[c.weapons[0]]) == null ? void 0 : u.name) ?? "?"} · ${((d = He[c.armor]) == null ? void 0 : d.name) ?? "?"}`
          : `${f + 1}. (비어 있음)`,
        "tiny",
        c ? q.text : q.textDim,
      ),
        this.btn(E + 180, a + 1, 44, 19, "저장", () => {
          ((S.presets[f] = { name: `프리셋 ${f + 1}`, weapons: [...T.weapons], armor: T.armor, skills: [...T.skills] }),
            it.write(),
            j.play("buy"),
            this.render());
        }),
        this.btn(
          E + 230,
          a + 1,
          48,
          19,
          "불러오기",
          () => {
            if (!c) return;
            const p = (g, y) => !g || g in y;
            if (!p(c.weapons[0], S.weapons) || !p(c.weapons[1], S.weapons) || !p(c.armor, S.armors)) {
              j.play("error");
              return;
            }
            ((T.weapons = [...c.weapons]),
              (T.armor = c.armor),
              (T.skills = c.skills.map((g) => (g && g in S.skills ? g : null))),
              it.write(),
              j.play("buy"),
              this.render());
          },
          { enabled: !!c },
        ),
        (a += 22));
    }
    const n = Ot + 308,
      i = ne - 318;
    (this.box(n, R, i, Qt - 42), this.t(n + 8, R + 4, "빌드 능력치", "small", q.gold));
    let e = R + 20;
    const r = (f, c, p = q.text) => {
      (this.t(n + 10, e, f, "tiny", q.textDim), this.t(n + 110, e, c, "tiny", p), (e += 11));
    };
    (r("최대 체력", yt(C.maxHp)),
      r("공격력", `${C.atk.toFixed(1)}${C.dmgMult !== 1 ? ` (피해 x${C.dmgMult.toFixed(2)})` : ""}`),
      r("방어력", `${Math.round(C.def)} (물리 피해 -${_t(C.defReduction)})`),
      r("속성 저항", _t(C.resist)),
      r("이동 속도", `${Math.round(C.moveSpeed)} (${_t(C.moveSpeed / 150)})`),
      r("공격 속도", `x${C.attackSpeed.toFixed(2)}`),
      r("치명타", `${_t(C.critChance)} · 피해 x${C.critDamage.toFixed(2)}`),
      r("스킬 위력 / 쿨감", `x${C.skillPower.toFixed(2)} / -${_t(1 - C.skillCdMult)}`),
      r("대시 재사용", `${C.dashCd.toFixed(2)}초 (무적 ${C.dashIframes.toFixed(2)}초)`),
      r("회복 효율 / 골드", `x${(C.healEff * C.healRecvMult).toFixed(2)} / x${C.goldGain.toFixed(2)}`),
      (e += 3));
    for (const f of T.weapons) f && r(`${ae[f].name} DPS`, Wi(C, S, f).toFixed(1), q.orange);
    const l = T.skills
      .filter(Boolean)
      .slice(0, S.skillSlots)
      .reduce((f, c) => {
        const p = Fi(ve[c], S.skills[c] ?? 1, C);
        return f + (ve[c].id === "heal" || ve[c].id === "berserk" ? 0 : (C.atk * p.power * C.skillPower) / p.cooldown);
      }, 0);
    (r("스킬 초당 피해", l.toFixed(1), q.purple),
      (e += 4),
      this.t(n + 8, e, "활성 시너지", "small", q.gold),
      (e += 14));
    const s = Qi.filter((f) => C.synergies.has(f.id));
    s.length || (this.t(n + 10, e, "없음 - 무기·갑옷·스킬 조합으로 시너지를 발동하세요", "tiny", q.textDim), (e += 11));
    for (const f of s)
      (this.t(n + 10, e, `「${f.name}」 ${f.desc}`, "tiny", q.purple, this.wrap("", i - 20)), (e += 11));
  }
}
class fr extends Ne {
  constructor(T, C) {
    super(T, "기록 게시판", C);
    Z(this, "tab", 0);
    this.render();
  }
  primary() {
    ((this.tab = (this.tab + 1) % 3), this.render());
  }
  build() {
    const T = it.data,
      C = We.filter((i) => T.achievements.includes(i.id)).length;
    if (
      (this.btn(
        Ot + 120,
        Wt + 6,
        60,
        18,
        "기록",
        () => {
          ((this.tab = 0), this.render());
        },
        { style: this.tab === 0 ? "green" : "normal" },
      ),
      this.btn(
        Ot + 184,
        Wt + 6,
        96,
        18,
        `업적 ${C}/${We.length}`,
        () => {
          ((this.tab = 1), this.render());
        },
        { style: this.tab === 1 ? "green" : "normal" },
      ),
      this.btn(
        Ot + 284,
        Wt + 6,
        96,
        18,
        "전투 도감",
        () => {
          ((this.tab = 2), this.render());
        },
        { style: this.tab === 2 ? "green" : "normal" },
      ),
      this.tab === 1)
    ) {
      this.buildAchievements();
      return;
    }
    if (this.tab === 2) {
      this.buildCodex();
      return;
    }
    const E = Ot + 10,
      R = Wt + 32;
    this.box(E, R, 280, Qt - 42);
    let h = R + 6;
    const m = (i, e, r = q.text) => {
      (this.t(E + 10, h, i, "small", q.textDim), this.t(E + 140, h, e, "small", r), (h += 14));
    };
    (this.t(E + 10, h, "최고 도달 거리", "small", q.gold),
      (h += 14),
      this.t(E + 10, h, `${yt(T.best)}m`, "title", q.gold),
      (h += 38),
      m("총 탐험 횟수", `${T.runs}회`),
      m("누적 획득 골드", yt(T.totalGold), q.gold),
      m("몬스터 처치", yt(T.kills)),
      m("엘리트 처치", yt(T.eliteKills)),
      m("누적 플레이 시간", Ns(T.playTime)),
      T.activeTitle && m("칭호", `「${T.activeTitle}」`, q.orange),
      (h += 4),
      this.t(E + 10, h, "보스 처치 기록", "small", q.gold),
      (h += 14),
      Mi.forEach((i, e) => {
        var l;
        const r = T.bossKills[i.id] ?? 0;
        ((l = Ht[e]) == null || l.name,
          this.t(
            E + 10 + (e % 2) * 135,
            h + Math.floor(e / 2) * 11,
            `${r > 0 ? i.name : "???"} ${r > 0 ? `x${r}` : ""}`,
            "tiny",
            r > 0 ? q.text : q.textDim,
          ));
      }),
      (h += Math.ceil(Mi.length / 2) * 11 + 6),
      this.t(E + 10, h, "최근 탐험", "small", q.gold),
      (h += 13));
    for (const i of T.recentRuns.slice(0, 4))
      (this.t(E + 10, h, `${yt(i.dist)}m  ·  +${yt(i.gold)}G`, "tiny", q.text), (h += 10));
    const t = Ot + 298,
      a = ne - 308;
    (this.box(t, R, a, Qt - 42), this.t(t + 8, R + 4, "거리별 최초 도달 보상", "small", q.gold));
    let v = R + 20;
    const o = [...oi, ...Wn(Math.max(16e3, T.best), 2)];
    for (const i of o) {
      const e = T.claimed.includes(i.dist);
      this.t(t + 10, v, `${e ? "✔" : "·"} ${yt(i.dist)}m`, "tiny", e ? q.green : q.text);
      const r = (i.unlocks ?? []).map((l) => Ys[l]).join(", ");
      (this.t(
        t + 70,
        v,
        `+${yt(i.gold)}G${r ? ` · ${r}` : ""}${i.title ? ` · 「${i.title}」` : ""}`,
        "tiny",
        e ? q.textDim : q.gold,
      ),
        (v += 11));
    }
    ((v += 5),
      this.t(t + 8, v, "지역", "small", q.gold),
      (v += 13),
      [...Ht.map((i) => ({ name: i.name, start: i.start })), { name: "재련의 회랑", start: 1e4 }].forEach((i, e) => {
        const r = T.best >= i.start;
        this.t(
          t + 10 + (e % 2) * 140,
          v + Math.floor(e / 2) * 10,
          `${r ? i.name : "???"} ${yt(i.start)}m~`,
          "tiny",
          r ? q.text : q.textDim,
        );
      }));
  }
  buildCodex() {
    var t, a;
    const T = Wt + 32,
      C = (ne - 30) / 2,
      E = Ot + 10,
      R = E + C + 10;
    (this.box(E, T, C, Qt - 42), this.box(R, T, C, Qt - 42));
    let h = T + 6;
    (this.t(E + 8, h, "원소 반응", "small", q.gold),
      (h += 14),
      this.t(E + 8, h, "상태 이상이 걸린 적에게 다른 원소로 공격하면 발동합니다.", "tiny", q.textDim),
      (h += 13));
    for (const v of Object.values(Zs))
      (this.t(E + 8, h, v.name, "small", v.text),
        this.t(E + 70, h + 1, v.desc, "tiny", q.text, this.wrap("", C - 80)),
        (h += 22));
    ((h += 2),
      this.t(
        E + 8,
        h,
        "원소는 원소 부여 각성, 지팡이, 스킬, 발동 효과로 얻습니다.",
        "tiny",
        q.textDim,
        this.wrap("", C - 16),
      ));
    let m = T + 6;
    (this.t(R + 8, m, "무기 진화 (탐험 중, Lv6 이상)", "small", q.gold), (m += 15));
    for (const v of Object.values(ke)) {
      const o = v.weapon in it.data.weapons;
      (this.t(R + 8, m, `${o ? ae[v.weapon].name : "???"} → ${v.name}`, "tiny", o ? q.text : q.textDim),
        this.t(
          R + C - 8,
          m,
          `${((t = Ee[v.catalyst]) == null ? void 0 : t.name) ?? "?"} x${v.need}`,
          "tiny",
          q.orange,
        ).setOrigin(1, 0),
        (m += 11));
    }
    ((m += 6), this.t(R + 8, m, "스킬 강화 (장착 스킬, Lv3 이상)", "small", q.gold), (m += 15));
    for (const [v, o] of Object.entries(ss))
      (this.t(
        R + 8,
        m,
        `${((a = ve[v]) == null ? void 0 : a.name) ?? v} → ${o.name}`,
        "tiny",
        it.data.skills[v] ? q.text : q.textDim,
      ),
        (m += 11));
  }
  buildAchievements() {
    const T = it.data,
      C = Wt + 32,
      E = (ne - 30) / 2,
      R = 28,
      h = Math.ceil(We.length / 2);
    We.forEach((m, t) => {
      const a = T.achievements.includes(m.id),
        v = Ot + 10 + Math.floor(t / h) * (E + 10),
        o = C + (t % h) * R;
      (this.box(v, o, E, R - 3, a ? "ui_inner_sel" : "ui_inner"),
        a ? this.img(v + 10, o + 12, "icon_check") : this.img(v + 10, o + 12, "icon_lock").setAlpha(0.6),
        this.t(v + 22, o + 2, m.name, "small", a ? q.gold : q.text),
        this.t(v + 22, o + 14, m.desc, "tiny", q.textDim),
        this.t(v + E - 6, o + 3, `+${yt(m.gold)}G`, "tiny", a ? q.textDim : q.gold).setOrigin(1, 0));
    });
  }
}
class dr extends Ne {
  constructor(T, C, E) {
    super(T, "설정", C);
    Z(this, "rows", $s(this.scene));
    ((this.onTitle = E), this.render());
  }
  count() {
    return this.rows.length + 1;
  }
  primary() {
    this.sel < this.rows.length ? (this.rows[this.sel].apply(), this.render()) : (this.close(), this.onTitle());
  }
  build() {
    const T = Ot + 10,
      C = Wt + 32,
      E = 280;
    (this.box(T, C, E + 16, Qt - 42),
      this.rows.forEach((a, v) => {
        const o = this.btn(T + 8, C + 8 + v * 26, E, 22, a.label(), () => {
          ((this.sel = v), a.apply(), this.render());
        });
        this.sel === v && o.setSelected(!0);
      }));
    const R = this.rows.length,
      h = this.btn(T + 8, C + 16 + R * 26, E, 22, "타이틀 화면으로", () => {
        ((this.sel = R), this.primary());
      });
    this.sel === R && h.setSelected(!0);
    const m = Ot + 318,
      t = ne - 328;
    (this.box(m, C, t, Qt - 42),
      this.t(m + 8, C + 4, "조작법", "small", q.gold),
      Oi.forEach((a, v) => this.t(m + 8, C + 22 + v * 30, a, "tiny", q.text, this.wrap(a, t - 16))),
      this.t(
        m + 8,
        C + 22 + Oi.length * 30 + 4,
        "",
        "tiny",
        q.textDim,
        this.wrap("", t - 16),
      ));
  }
}
const bt = 252,
  be = 2720;
class cr {
  move(S, T) {
    ((S.x += S.vx * T),
      (S.y += S.vy * T),
      (S.onGround = !1),
      (S.hitWall = 0),
      S.y >= bt && ((S.y = bt), (S.vy = 0), (S.onGround = !0), (S.groundCode = 1)),
      S.x < 20 && ((S.x = 20), (S.vx = 0), (S.hitWall = -1)),
      S.x > be - 20 && ((S.x = be - 20), (S.vx = 0), (S.hitWall = 1)));
  }
  solidAtPx(S, T) {
    return T >= bt || S < 16 || S > be - 16;
  }
}
class vr {
  constructor(S, T) {
    Z(this, "kind", "object");
    Z(this, "dead", !1);
    Z(this, "statuses", new ai());
    Z(this, "hp", 1e9);
    Z(this, "maxHp", 1e9);
    Z(this, "body");
    Z(this, "sprite");
    Z(this, "total", 0);
    Z(this, "window", []);
    ((this.body = Je(T, bt, 16, 28)),
      (this.sprite = S.add
        .sprite(T, bt + 1, "dummy", 0)
        .setOrigin(0.5, 1)
        .setDepth(8)));
  }
  defense() {
    return 0;
  }
  receive(S, T, C) {
    return (
      this.sprite.setFrame(1),
      this.sprite.scene.time.delayedCall(90, () => this.sprite.setFrame(0)),
      this.window.push({ t: this.sprite.scene.time.now, d: S }),
      S
    );
  }
  dps(S) {
    return ((this.window = this.window.filter((T) => S - T.t < 3e3)), this.window.reduce((T, C) => T + C.d, 0) / 3);
  }
}
class pr extends zt.Scene {
  constructor() {
    super("Hub");
    Z(this, "isHub", !0);
    Z(this, "fx");
    Z(this, "collider", new cr());
    Z(this, "player");
    Z(this, "projectiles");
    Z(this, "dummy");
    Z(this, "facilities", []);
    Z(this, "keys");
    Z(this, "inp", Hi());
    Z(this, "panelOpen", null);
    Z(this, "prompt");
    Z(this, "promptBg");
    Z(this, "goldText");
    Z(this, "bestText");
    Z(this, "dpsText");
    Z(this, "bg", []);
    Z(this, "leaving", !1);
    Z(this, "near", null);
    Z(this, "rmbHeld", !1);
    Z(this, "pad");
    Z(this, "mouseT", { t: -1e9 });
    Z(this, "closedAt", -1e9);
    Z(this, "toastY", 0);
  }
  get ph() {
    return this;
  }
  create() {
    var n;
    ((this.leaving = !1),
      (this.panelOpen = null),
      (this.bg = []),
      (this.closedAt = -1e9),
      (this.toastY = 0),
      (this.pad = new ri(this)),
      (this.mouseT = Xs(this)));
    // 새 거점: 불씨 마을
    const H2 = FG.buildHub(this, bt);
    ((this.h2 = H2), (this.fx = new Hs(this)), (this.projectiles = new ks(this)));
    const dz = H2.facilities.find((f) => f.dummyX);
    this.dummy = new vr(this, dz ? dz.dummyX : 760);
    const P = () => FG.panels(),
      cl = () => this.onPanelClose(),
      OPEN = {
        forge: () => new (P().FrShop)(this, cl, ["weapon"], "대장간 · 무기"),
        armory: () => new (P().FrShop)(this, cl, ["armor"], "방어구 상점 · 방어구"),
        training: () => new (P().Training)(this, cl),
        destiny: () => (FG.toggleDestiny(this), null),
        dojo: () => new (P().FrShop)(this, cl, ["skill"], "기술 도장 · 스킬"),
        lab: () => new (P().FrShop)(this, cl, ["magic"], "마법 연구소 · 마법"),
        // 창고: 알비온식 창고 (왼쪽 창고 · 오른쪽 가방, 2026-11-28)
        wardrobe: () => (FG.openStashHub(this), null),
        board: () => new (P().Board)(this, cl),
        exit: () => (this.startRun(), null),
        // 갈림길 요새: 네 갈래 출구 (그 방향 이웃 구역에서 탐험 시작)
        exitL: () => (FG.setHubDest("L"), this.startRun(), null),
        exitR: () => (FG.setHubDest("R"), this.startRun(), null),
        exitU: () => (FG.setHubDest("U"), this.startRun(), null),
        exitD: () => (FG.setHubDest("D"), this.startRun(), null),
      };
    this.facilities = H2.facilities.map((f) => ({ ...f, open: OPEN[f.id] }));
    this.input.keyboard.on("keydown-V", () => this.panelOpen || FG.toggleDestiny(this));
    // 거점에서도 가방 (2026-11-28)
    this.input.keyboard.addCapture("TAB");
    this.input.keyboard.on("keydown-TAB", () => FG.toggleBagHub(this));
    const t = (i, e, r) => null;
    const a = FG.hubStats(this);
    ((this.player = new Ws(this, a, FG.hubArrivalX(1420), bt)),
      (this.player.facing = -1),
      // 왼쪽 위 돈·기록 라벨은 쓰지 않는다 (2026-11-28 · 돈은 가방[Tab]에서)
      Ce(this, 4, 4, 150, 34, "ui_hud_gold").setScrollFactor(0).setDepth(100).setVisible(!1),
      this.add.image(16, 15, "icon_gold").setScrollFactor(0).setDepth(101).setVisible(!1),
      (this.goldText = ct(this, 26, 8, "", "body", "#ffd84a").setScrollFactor(0).setDepth(101).setVisible(!1)),
      this.add.image(16, 29, "icon_flag").setScrollFactor(0).setDepth(101).setVisible(!1),
      (this.bestText = ct(this, 26, 23, "", "tiny", "#f2e6c4").setScrollFactor(0).setDepth(101).setVisible(!1)),
      (this.dpsText = ct(this, this.dummy.body.x ?? 760, bt - 52, "", "tiny", q.orange, { stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(9)),
      (this.promptBg = this.add
        .nineslice(0, 0, "ui_hud_panel", void 0, 80, 18, 6, 6, 6, 6)
        .setOrigin(0.5)
        .setDepth(50)
        .setVisible(!1)),
      (this.prompt = ct(this, 0, 0, "", "small", "#f2e6c4").setOrigin(0.5).setDepth(51).setVisible(!1)));
    const v = ct(this, ot - 6, 6, "", "tiny", q.textDim, {
      stroke: "#140e18",
      strokeThickness: 3,
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);
    (it.data.runs > 3 && v.setAlpha(0.5),
      it.loadError &&
        (ct(this, ot / 2, 50, it.loadError, "small", q.red)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(100),
        (it.loadError = null)),
      it.data.tutorialDone || this.tutorial());
    const o = zt.Input.Keyboard.KeyCodes;
    ((this.keys = this.input.keyboard.addKeys({
      A: o.A,
      D: o.D,
      LEFT: o.LEFT,
      RIGHT: o.RIGHT,
      SPACE: o.SPACE,
      W: o.W,
      SHIFT: o.SHIFT,
      E: o.E,
      ONE: o.ONE,
      TWO: o.TWO,
      Q: o.Q,
      R: o.R,
      F: o.F,
      ESC: o.ESC,
    })),
      this.time.delayedCall(700, () => this.checkAchievements()),
      (n = this.input.mouse) == null || n.disableContextMenu(),
      this.cameras.main.setBounds(0, 0, be, xt),
      this.cameras.main.startFollow(this.player.sprite, !0, 0.12, 0.12, 0, 60),
      this.cameras.main.fadeIn(500),
      j.setVolumes(it.data.settings.music, it.data.settings.sfx),
      j.playMusic("hub", { root: 62, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 92, wave: "triangle", mood: 9, hub: !0 }),
      (window.__hub = this));
  }
  tutorial() {
    // 안내판: 글자에 맞춘 크기 · 시설 이름표 아래 (2026-11-28 · 글자가 판 밖으로 넘치던 문제)
    const T = [
        "네 갈래 출구 중 하나로 탐험을 떠나라.",
        "살아 돌아오면 전리품은 내 것, 쓰러지면 들고 간 것을 모두 잃는다.",
        "[Tab] 가방   [M] 지도   [V] 운명 보드   [B] 귀환",
      ],
      E = ct(this, ot / 2, 92, T.join(`
`), "small", q.text, { align: "center", lineSpacing: 2 })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(151),
      C = Ce(this, Math.round(ot / 2 - E.width / 2 - 14), 86, Math.round(E.width + 28), Math.round(E.height + 12))
        .setScrollFactor(0)
        .setDepth(150);
    (this.time.delayedCall(9e3, () => {
      this.tweens.add({
        targets: [C, E],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          (C.destroy(), E.destroy());
        },
      });
    }),
      (it.data.tutorialDone = !0),
      it.write());
  }
  targets() {
    return [this.dummy];
  }
  hitTarget(T, C) {
    const E = this.player;
    let R = C.dmg,
      h = !1;
    return (
      !C.noCrit &&
        Math.random() < E.critChance(C.critBonus ?? 0) &&
        ((h = !0), (R *= E.stats.critDamage + (C.weaponId ? E.weapons.mods.critDamage : 0))),
      (R = Math.max(1, Math.round(R))),
      T.receive(R, h, C),
      this.fx.number(T.body.x, T.body.y - T.body.h - 4, h ? `${R}!` : `${R}`, h ? "#ffd84a" : "#ffffff", h),
      this.fx.anim("hitspark", T.body.x, T.body.y - 14, { scale: h ? 1.5 : 1 }),
      j.play(h ? "crit" : "hit"),
      C.source === "weapon" && this.fx.stop(0.03),
      R
    );
  }
  hurtPlayer(T) {}
  enemyDamageScale() {
    return 1;
  }
  openSettings() {
    (j.play("click"),
      (this.player.body.vx = 0),
      (this.panelOpen = new dr(
        this,
        () => this.onPanelClose(),
        () => {
          ((this.leaving = !0),
            this.cameras.main.fadeOut(400),
            this.time.delayedCall(420, () => this.scene.start("Title", { recovered: null })));
        },
      )));
  }
  checkAchievements() {
    it.grantAchievements().ids.forEach((C, E) => {
      const R = zi[C];
      this.time.delayedCall(E * 600, () => this.hubToast(`업적 달성: ${R.name}  +${yt(R.gold)}G`));
    });
  }
  hubToast(T) {
    const C = 48 + (this.toastY++ % 4) * 16,
      E = ct(this, ot / 2, C, T, "small", q.green, { stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(160)
        .setAlpha(0);
    (j.play("levelup"),
      this.tweens.add({
        targets: E,
        alpha: 1,
        duration: 250,
        hold: 2600,
        yoyo: !0,
        onComplete: () => {
          (E.destroy(), (this.toastY = Math.max(0, this.toastY - 1)));
        },
      }));
  }
  onPanelClose() {
    ((this.panelOpen = null),
      (this.closedAt = this.time.now),
      this.checkAchievements(),
      this.player.applyStats(FG.hubStats(this)),
      (this.player.hp = this.player.maxHp));
  }
  startRun() {
    this.leaving ||
      ((this.leaving = !0),
      j.play("portal"),
      this.cameras.main.fadeOut(600, 0, 0, 0),
      this.time.delayedCall(650, () => this.scene.start("Run")));
  }
  update(T, C) {
    const E = Math.min(0.05, C / 1e3);
    it.tick(performance.now());
    const R = this.keys,
      h = this.input.activePointer,
      m = zt.Input.Keyboard.JustDown,
      t = this.inp,
      a = !!this.panelOpen || this.leaving,
      bg = FG.hubBagOpen(this);
    ((t.left = !a && (R.A.isDown || R.LEFT.isDown)),
      (t.right = !a && (R.D.isDown || R.RIGHT.isDown)),
      (t.jump = !a && (m(R.SPACE) || m(R.W))),
      (t.jumpHeld = R.SPACE.isDown || R.W.isDown),
      (t.dash = !a && m(R.SHIFT)));
    const v = h.positionToCamera(this.cameras.main);
    ((t.aimX = v.x),
      (t.aimY = v.y),
      (t.attackHeld = !a && !bg && ((h.leftButtonDown() && h.y > 40) || TOUCH.attack)),
      (t.special = !a && !bg && h.rightButtonDown() && !this.rmbHeld),
      (this.rmbHeld = h.rightButtonDown()),
      (t.swap = m(R.ONE) ? 0 : m(R.TWO) ? 1 : -1),
      (t.skills = [!a && !bg && m(R.Q), !1, !a && !bg && m(R.R), !a && !bg && m(R.F)]));
    let o = !bg && m(R.E);
    let n = m(R.ESC);
    bg && n && (FG.closeBagHub(this), (n = !1));
    const
      i = this.pad;
    if ((i.poll(), i.connected)) {
      const l = this.panelOpen;
      if (l) {
        const s = i.navY();
        (s && l.nav(s),
          i.justDown(Mt.A)
            ? l.confirm()
            : i.justDown(Mt.X)
              ? l.secondary()
              : (i.justDown(Mt.B) || i.justDown(Mt.START)) && l.close());
      } else if (
        !a &&
        (t.left || (t.left = i.axis.x < -0.35),
        t.right || (t.right = i.axis.x > 0.35),
        t.jump || (t.jump = i.justDown(Mt.A)),
        t.jumpHeld || (t.jumpHeld = i.down(Mt.A)),
        t.dash || (t.dash = i.justDown(Mt.B)),
        t.attackHeld || (t.attackHeld = i.down(Mt.X)),
        t.special || (t.special = i.justDown(Mt.Y)),
        i.justDown(Mt.UP) && (t.swap = this.player.weapons.slot === 0 ? 1 : 0),
        i.justDown(Mt.LB) && (t.skills[0] = !0),
        i.justDown(Mt.LT) && (t.skills[2] = !0),
        i.justDown(Mt.RT) && (t.skills[3] = !0),
        i.justDown(Mt.RB) && (o = !0),
        i.justDown(Mt.START) && this.openSettings(),
        i.preferred(this.mouseT.t))
      ) {
        const s = this.player,
          u = s.body.y - 14;
        if (i.aim.x || i.aim.y) ((t.aimX = s.cx + i.aim.x * 120), (t.aimY = u + i.aim.y * 120));
        else {
          const d = t.left ? -1 : t.right ? 1 : s.facing;
          ((t.aimX = s.cx + d * 120), (t.aimY = u));
        }
      }
    }
    (n && !this.panelOpen && !this.leaving && this.time.now - this.closedAt > 150 && this.openSettings(),
      (this.near = null));
    for (const l of this.facilities) Math.abs(l.x - this.player.x) < 58 && (this.near = l);
    if (
      (o &&
        !a &&
        (this.near
          ? (j.play("click"), (this.player.body.vx = 0), (this.panelOpen = this.near.open()))
          : (t.skills[1] = !0)),
      this.player.update(E, t),
      this.projectiles.update(E),
      this.fx.update(E),
      this.fx.hitstop > 0 && (this.fx.hitstop -= E),
      this.near && !a)
    ) {
      const l = this.near.id === "exit" ? "[E] 탐험 시작 (0m부터)" : this.near.exit ? `[E] ${this.near.name} 으로 출발` : `[E] ${this.near.name}`;
      (this.prompt
        .setText(l)
        .setPosition(this.near.x, bt - 64)
        .setVisible(!0),
        this.promptBg
          .setSize(this.prompt.width + 12, 16)
          .setPosition(this.near.x, bt - 64)
          .setVisible(!0));
    } else (this.prompt.setVisible(!1), this.promptBg.setVisible(!1));
    (this.goldText.setText(yt(it.data.gold)), this.bestText.setText(FG.zoned ? `밟아 본 구역 ${FG.seenCount()} / 48` : `최고 기록 ${yt(it.data.best)}m`));
    const e = this.dummy.dps(this.time.now);
    this.dpsText.setText(e > 0 ? `초당 피해 ${e.toFixed(1)}` : "");
    FG.hubParallax(this, this.h2);
  }
}
class mr {
  constructor(S, T, C, E) {
    Z(this, "coins", []);
    ((this.scene = S), (this.collider = T), (this.onCollect = C), (this.onHeart = E));
  }
  dropHeart(S, T) {
    const C = this.spawnCoin(S, T, 0, 0.6);
    C && ((C.heart = !0), C.s.stop(), C.s.setTexture("icon_heart"), (C.life = 25));
  }
  drop(S, T, C, E = 1) {
    C = Math.max(1, Math.round(C));
    const R = [];
    let h = C;
    const m = 18,
      t = Math.max(5, Math.ceil(C / m));
    for (; h > 0 && R.length < m;) {
      const a = h > t * 2 ? t : h >= 5 && R.length > 6 ? Math.min(h, t) : Math.min(h, Math.max(1, Math.ceil(C / 10)));
      (R.push(a), (h -= a));
    }
    h > 0 && (R[R.length - 1] += h);
    for (const a of R) this.spawnCoin(S, T, a, E);
  }
  spawnCoin(S, T, C, E) {
    let R = this.coins.find((m) => !m.active);
    (R ||
      (this.coins.length > 220
        ? ((R = this.coins.find((m) => !m.heart) ?? this.coins[0]), this.collect(R))
        : ((R = {
            active: !1,
            s: this.scene.add.sprite(0, 0, "coin").setDepth(22),
            body: Je(0, 0, 6, 6),
            value: 0,
            life: 0,
            delay: 0,
            magnet: !1,
            heart: !1,
          }),
          this.coins.push(R))),
      (R.active = !0),
      (R.value = C),
      (R.life = 60),
      (R.delay = 0.35),
      (R.magnet = !1),
      (R.heart = !1),
      (R.body.x = S),
      (R.body.y = T),
      (R.body.vx = (Math.random() - 0.5) * 160 * E),
      (R.body.vy = -120 - Math.random() * 160));
    const h = C >= 10;
    return (
      R.s
        .setTexture(h ? "coinbig" : "coin")
        .setVisible(!0)
        .setActive(!0)
        .setPosition(S, T),
      R.s.play(h ? "coinbig_spin" : "coin_spin", !0),
      R.s.anims.setProgress(Math.random()),
      R
    );
  }
  collect(S) {
    var T;
    if (((S.active = !1), S.s.setVisible(!1).setActive(!1), S.heart)) {
      (T = this.onHeart) == null || T.call(this, S.body.x, S.body.y);
      return;
    }
    this.onCollect(S.value, S.body.x, S.body.y);
  }
  update(S, T, C, E = 1) {
    let R = 0;
    for (const h of this.coins) {
      if (!h.active) continue;
      ((h.life -= S), (h.delay -= S));
      const m = T - h.body.x,
        t = C - 10 - (h.body.y - 3),
        a = Math.hypot(m, t);
      if ((h.delay <= 0 && a < Ri.magnetRange * E && (h.magnet = !0), h.magnet)) {
        const v = Ri.magnetSpeed;
        if (((h.body.x += (m / Math.max(1, a)) * v * S), (h.body.y += (t / Math.max(1, a)) * v * S), a < 10)) {
          const o = h.heart;
          (this.collect(h), !o && R++ < 2 && j.play(h.value >= 10 ? "coinBig" : "coin"));
          continue;
        }
      } else {
        h.body.vy = Math.min(500, h.body.vy + 900 * S);
        const v = !h.body.onGround;
        if (
          (this.collider.move(h.body, S),
          h.body.onGround &&
            ((h.body.vx *= v ? 0.5 : Math.max(0, 1 - 8 * S)), v && Math.abs(h.body.vy) < 1 && (h.body.vy = 0)),
          h.body.y > Oe + 60)
        ) {
          ((h.active = !1), h.s.setVisible(!1));
          continue;
        }
      }
      if (h.life <= 0) {
        ((h.active = !1), h.s.setVisible(!1));
        continue;
      }
      (h.s.setPosition(h.body.x, h.body.y - 3), h.life < 5 && h.s.setAlpha(Math.floor(h.life * 6) % 2 ? 1 : 0.4));
    }
  }
  shift(S) {
    for (const T of this.coins) T.active && ((T.body.x -= S), (T.s.x -= S));
  }
  collectAllNear(S, T) {
    for (const C of this.coins) C.active && Math.abs(C.body.x - S) < T && (C.magnet = !0);
  }
  clear() {
    for (const S of this.coins) ((S.active = !1), S.s.setVisible(!1));
  }
}
class gr {
  constructor(S, T, C, E, R, h, m) {
    Z(this, "kind", "object");
    Z(this, "dead", !1);
    Z(this, "statuses", new ai());
    Z(this, "body");
    ((this.hp = R), (this.maxHp = h), (this.onHit = m), (this.body = Je(S, T, C, E)));
  }
  defense() {
    return 0;
  }
  receive(S, T, C) {
    return this.dead ? 0 : (this.onHit(S), S);
  }
}
class xr {
  constructor(S) {
    Z(this, "objs", []);
    Z(this, "hittables", []);
    Z(this, "state", new Map());
    Z(this, "nearest", null);
    this.s = S;
  }
  st(S) {
    let T = this.state.get(S);
    return (T || ((T = {}), this.state.set(S, T)), T);
  }
  onChunkLoad(S) {
    const T = this.s.world.lx(S.index * vt);
    for (const C of S.hazards) this.makeHazard(S, C, T);
    for (const sg of S.signs ?? []) {
      if (sg.dist % 200 !== 100 || !FG.waystoneOk(S.index)) continue;
      // 표지판 옆에서 실제로 밟을 수 있는 칸 (갱도 구멍 위는 피한다)
      const col = this.s.collider, y = sg.py ?? sg.row * gt;
      const ok = (px) => col.solidAtPx(px, y + 4) && col.solidAtPx(px - 6, y + 4) && col.solidAtPx(px + 6, y + 4) && !col.solidAtPx(px, y - 8);
      const px = [-22, 30, -40, 48, 8].map((d) => T + sg.x * gt + d).find(ok);
      px != null && this.objs.push(FG.waystone(this, S.index, px, y));
    }
    FG.zoneObjs(this, S, T, Ye);
    (S.chests ?? []).forEach((c, k) => {
      const tr = FG.chestRoll(S.index, k, c.tier);
      if (tr == null) return;
      const o = this.chest(`${S.index}:c${k}`, T + c.x * gt + 8, c.py ?? c.row * gt, tr, void 0, { camp: c.camp });
      ((o.chunk = S.index), this.objs.push(o));
    });
  }
  onChunkUnload(S) {
    for (const T of this.objs) T.chunk === S.index && this.kill(T);
    ((this.objs = this.objs.filter((T) => T.alive)),
      (this.hittables = this.hittables.filter((T) => !T.dead && T.chunk !== S.index)));
  }
  kill(S) {
    S.alive = !1;
    for (const T of S.sprites) T.destroy();
  }
  makeHazard(S, T, C) {
    const E = this.s,
      R = E.add,
      h = C + T.x * gt,
      m = T.py ?? T.row * gt,
      t = T.w * gt,
      a = { chunk: S.index, x: h, y: m, sprites: [], alive: !0, kind: T.type },
      v = E.player,
      o = (i, e, r, l) => ge(i, e, r, l, v.body.x - 4, v.body.y - 6, 8, 6),
      n = () => 9 * E.diffAtPlayer().atkMult;
    switch (T.type) {
      case "spikes": {
        for (let i = 0; i < T.w; i++)
          a.sprites.push(
            R.image(h + i * gt, m, "spikes")
              .setOrigin(0, 1)
              .setDepth(5),
          );
        a.update = () => {
          if (!v.dead && v.iframes <= 0 && o(h + 2, m - 7, t - 4, 7)) {
            const i = v.cx < h + t / 2 ? -1 : 1;
            (E.hurtPlayer({ dmg: n(), element: "phys", knock: 1, dir: i, melee: !1, srcX: h + t / 2 }),
              (v.body.vy = -340),
              (v.body.vx = i * (140 + t * 4)),
              (v.hurtT = Math.max(v.hurtT, 0.35)));
          }
        };
        break;
      }
      case "poison":
      case "voidPool": {
        const i = T.type === "poison" ? "pool_poison" : "pool_void";
        for (let r = 0; r < T.w; r++)
          a.sprites.push(
            R.sprite(h + r * gt, m + 1, i)
              .setOrigin(0, 1)
              .setDepth(5)
              .play(i + "_anim"),
          );
        let e = 0;
        a.update = (r) => {
          ((e -= r),
            !v.dead &&
              o(h, m - 6, t, 6) &&
              (T.type === "poison"
                ? v.statuses.apply({ type: "poison", chance: 1, dur: 3, power: 0.25 }, n())
                : (v.statuses.apply({ type: "chill", chance: 1, dur: 1, power: 0.4 }, 0),
                  e <= 0 &&
                    ((e = 0.5),
                    E.hurtPlayer({ dmg: n() * 0.6, element: "dark", knock: 0, dir: 0, melee: !1, srcX: h }))),
              Math.random() < r * 10 &&
                E.fx.burst("rise", v.cx, v.body.y, 1, T.type === "poison" ? 10543168 : 12607743)));
        };
        break;
      }
      case "quicksand":
      case "ice": {
        const i = T.type === "ice" ? "icefloor" : "quicksand";
        for (let e = 0; e < T.w; e++)
          a.sprites.push(
            R.image(h + e * gt, m, i)
              .setOrigin(0, T.type === "ice" ? 0 : 0.3)
              .setDepth(4),
          );
        a.update = () => {
          const e = !v.dead && ge(h, m - 3, t, 6, v.body.x - 3, v.body.y - 1, 6, 2);
          T.type === "ice" ? e && (E.surfaceFlags.ice = !0) : e && (E.surfaceFlags.quicksand = !0);
        };
        break;
      }
      case "stalactite": {
        const i = S.region.id === "snow" || S.region.theme === "snow" ? "icicle" : "stalactite",
          e = R.image(h + 8, m, i)
            .setOrigin(0.5, 0)
            .setDepth(5);
        a.sprites.push(e);
        let r = 0,
          l = 0;
        a.update = (s) => {
          (r === 0 && !v.dead && Math.abs(v.cx - (h + 8)) < 22 && v.body.y > m && ((r = 1), (l = 0.55), j.play("warn")),
            r === 1 &&
              ((l -= s),
              (e.x = h + 8 + (Math.random() - 0.5) * 2),
              l <= 0 &&
                ((r = 2),
                e.setVisible(!1),
                E.projectiles.spawn(
                  { sprite: i, speed: 0, gravity: 900, life: 2, radius: 6 },
                  h + 8,
                  m + 10,
                  Math.PI / 2,
                  "enemy",
                  {
                    ehit: {
                      dmg: n() * 1.5,
                      element: i === "icicle" ? "ice" : "phys",
                      knock: 1,
                      dir: 1,
                      melee: !1,
                      srcX: h,
                    },
                  },
                  { vx: 0, vy: 60 },
                ))));
        };
        break;
      }
      case "fireJet": {
        a.sprites.push(R.image(h, m, "firevent").setOrigin(0, 1).setDepth(5));
        const i = [0, 1, 2].map((r) =>
          R.sprite(h + 8, m - 4 - r * 14, "flame")
            .setOrigin(0.5, 1)
            .setDepth(26)
            .setVisible(!1)
            .play("flame_anim"),
        );
        a.sprites.push(...i);
        let e = (T.x * 0.37) % 3;
        a.update = (r) => {
          e += r;
          const l = e % 3.2,
            s = l > 1.8 && l < 2.4,
            u = l >= 2.4;
          (s && Math.random() < r * 20 && E.fx.burst("spark", h + 8, m - 4, 1, 16744480),
            i.forEach((d, f) => d.setVisible(u).setScale(u ? 1.2 : 1, u ? 1.3 - f * 0.1 : 1)),
            u &&
              !v.dead &&
              ge(h + 2, m - 48, 12, 48, v.body.x - 5, v.body.y - 22, 10, 22) &&
              E.hurtPlayer({
                dmg: n(),
                element: "fire",
                status: { type: "burn", chance: 1, dur: 2.5, power: 0.25 },
                knock: 1,
                dir: v.cx < h + 8 ? -1 : 1,
                melee: !1,
                srcX: h + 8,
              }));
        };
        break;
      }
      case "arrowTrap": {
        const i = R.image(h - gt, m - gt * 2, "arrowtrap")
          .setOrigin(0, 0)
          .setDepth(5)
          .setFlipX(!0);
        a.sprites.push(i);
        let e = 1 + Math.random();
        a.update = (r) => {
          e -= r;
          const l = v.cx - h;
          e <= 0 &&
            !v.dead &&
            l < 0 &&
            l > -280 &&
            Math.abs(v.cy - (m - 24)) < 60 &&
            ((e = 2.6),
            i.setTint(16736320),
            E.time.delayedCall(350, () => {
              (i.clearTint(),
                E.projectiles.spawn(
                  { sprite: "p_ebolt", speed: 380, life: 1.5, radius: 4 },
                  h - gt,
                  m - 24,
                  Math.PI,
                  "enemy",
                  { ehit: { dmg: n(), element: "phys", knock: 1, dir: -1, melee: !1, srcX: h } },
                ),
                j.play("shoot"));
            }));
        };
        break;
      }
      case "arcaneRune": {
        const i = R.sprite(h + 8, m, "runetrap", 0)
          .setOrigin(0.5, 1)
          .setDepth(5);
        a.sprites.push(i);
        let e = 0,
          r = 0,
          l = 0;
        a.update = (s) => {
          ((l -= s),
            e === 0 && l <= 0 && o(h - 2, m - 8, 20, 8) && ((e = 1), (r = 0.65), i.setFrame(1), j.play("warn")),
            e === 1 &&
              ((r -= s),
              i.setAlpha(Math.floor(r * 16) % 2 ? 1 : 0.5),
              r <= 0 &&
                ((e = 0),
                (l = 2.5),
                i.setFrame(0).setAlpha(1),
                E.fx.anim("ring", h + 8, m - 8, { scale: 1.3, tint: 8429823 }),
                E.fx.burst("glow", h + 8, m - 8, 12, 8429823),
                j.play("magic"),
                !v.dead &&
                  Math.hypot(v.cx - (h + 8), v.cy - (m - 10)) < 34 &&
                  E.hurtPlayer({
                    dmg: n() * 1.4,
                    element: "arcane",
                    knock: 1,
                    dir: v.cx < h + 8 ? -1 : 1,
                    melee: !1,
                    srcX: h + 8,
                  }))));
        };
        break;
      }
      default:
        return;
    }
    this.objs.push(a);
  }
  // 보물 상자: 그림·잠금·여는 연출·보상은 glue.js chestObj (4단계: 0 나무 · 1 철 · 2 황금 · 3 전설)
  chest(S, T, C, E, R, o = {}) {
    const v = FG.chestObj(this.s, this, this.st(S), T, C, E, R, o);
    return ((v.chunk = S), v);
  }
  randomBlessing(S, T, C = !1) {
    var t;
    const E = this.s,
      R = E.player,
      h = C
        ? [
            () => (R.buff("atk", 45, 0.15, "atk", "보물의 힘"), "공격력 +15% (45초)"),
            () => (R.buff("speed", 45, 0.2, "speed", "보물의 바람"), "이동 속도 +20% (45초)"),
            () => (R.heal(R.maxHp * 0.2), "체력 회복"),
          ]
        : [
            () => ((R.run.atkPct += 0.15), "분노의 축복: 공격력 +15% (탐험 동안)"),
            () => (R.buff("crit", 60, 0.15, "crit", "정밀의 축복"), "정밀의 축복: 치명타 +15% (60초)"),
            () => (R.heal(R.maxHp * 0.35), "생명의 축복: 체력 35% 회복"),
            () => (R.buff("speed", 60, 0.25, "speed", "바람의 축복"), "바람의 축복: 이동 속도 +25% (60초)"),
            () => ((R.run.goldMult += 0.12), "황금의 축복: 골드 획득 +12% (탐험 동안)"),
            () => (R.buff("regen", 40, 0.015, "regen", "재생의 축복"), "재생의 축복: 40초간 체력 재생"),
          ],
      m = h[Math.floor(Math.random() * h.length)]();
    (j.play("buff"), E.fx.text(S, T, m, "#ffd84a"), (t = E.hud()) == null || t.toast(m, "#ffd84a"));
  }
  // 예전 이벤트(보물 수레·매복·습격·정예 사냥터·제단·거래·균열·방랑 상인·황금 고블린·회복의 샘·무기고·유물·광맥·얼어붙은 모험가·룬 금고·상자 함정)는
  // 모두 지웠다 (2026-11-28 사용자 요청). 상자는 chests 목록으로 따로 놓인다
  update(S) {
    var E;
    const T = this.s.player;
    this.nearest = null;
    let C = 30;
    for (const R of this.objs)
      if (R.alive && ((E = R.update) == null || E.call(R, S), R.prompt && R.interact)) {
        const h = Math.abs(R.x - T.cx) + Math.abs(R.y - T.body.y) * 0.5;
        h < C && ((C = h), (this.nearest = R));
      }
  }
  interact() {
    var S;
    return (S = this.nearest) != null && S.interact ? (this.nearest.interact(), !0) : !1;
  }
  rebuild(S) {
    this.clear();
    for (const T of S) this.onChunkLoad(T);
  }
  clear() {
    for (const S of this.objs) this.kill(S);
    ((this.objs = []), (this.hittables = []));
  }
}
class Cs {
  constructor(S, T, C, E, R, h = {}) {
    Z(this, "kind", "enemy");
    Z(this, "def");
    Z(this, "body");
    Z(this, "sprite");
    Z(this, "label");
    Z(this, "hp");
    Z(this, "maxHp");
    Z(this, "atk");
    Z(this, "baseDef");
    Z(this, "speed");
    Z(this, "windup");
    Z(this, "cooldown");
    Z(this, "statuses", new ai());
    Z(this, "state", "idle");
    Z(this, "st", 0);
    Z(this, "cd", 0);
    Z(this, "facing", -1);
    Z(this, "homeX");
    Z(this, "dead", !1);
    Z(this, "removed", !1);
    Z(this, "traits");
    Z(this, "isElite");
    Z(this, "rare");
    Z(this, "stunT", 0);
    Z(this, "flashT", 0);
    Z(this, "sinceHit", 99);
    Z(this, "aggro", !1);
    Z(this, "heavy");
    Z(this, "diff");
    Z(this, "summons", []);
    Z(this, "buffT", 0);
    Z(this, "hitDone", !1);
    Z(this, "contactDone", !1);
    Z(this, "aux", 0);
    Z(this, "aux2", 0);
    Z(this, "tx", 0);
    Z(this, "ty", 0);
    Z(this, "traitT", {});
    Z(this, "dashT", 0);
    Z(this, "hoverPh", Math.random() * 6);
    Z(this, "warn");
    Z(this, "life", 0);
    Z(this, "opts");
    Z(this, "hpBg");
    Z(this, "hpFg");
    var o, n;
    ((this.host = S),
      (this.def = se[T]),
      (this.opts = h),
      (this.traits = h.traits ?? []),
      (this.isElite = this.traits.length > 0),
      (this.rare = this.traits.length > 1),
      (this.diff = ni(R)));
    const m = this.def,
      t = this.diff,
      a = this.isElite ? (this.rare ? 4 : 2.6) : 1;
    // 하드 밸런스: 적 하나하나가 강하다 (체력 x2.6 · 공격 x1.6, 대신 수는 적게)
    ((this.maxHp = Math.round(m.hp * t.hpMult * a * (h.summoned ? 0.7 : 1) * 2.9)),
      (this.hp = Math.max(1, Math.round(this.maxHp * (h.hpRatio ?? 1)))),
      (this.atk = m.atk * t.atkMult * (this.isElite ? 1.35 : 1) * 1.8),
      (this.baseDef = m.def + t.defAdd + (this.traits.includes("armored") ? 30 : 0)),
      (this.speed = m.speed * t.speedMult * (this.traits.includes("frenzy") ? 1.4 : 1)),
      (this.windup = m.windup * t.windupMult * (this.traits.includes("frenzy") ? 0.85 : 1)),
      (this.cooldown = m.cooldown * (this.traits.includes("frenzy") ? 0.7 : 1)),
      (this.heavy = this.traits.includes("armored") ? 1 : (m.heavy ?? 0)));
    const v = (this.isElite ? 1.25 : 1) * (m.frScale ?? 1);
    if (
      ((this.body = Je(C, E, m.w * v, m.h * v)),
      (this.homeX = C),
      (this._hy = E),
      (FG.foeEnsure(S, T), (this.sprite = S.add.sprite(C, E, `e_${T}`, 0).setOrigin(0.5, 1).setDepth(10).setScale(v))),
      (this.cd = 0.5 + Math.random() * this.cooldown),
      m.ai === "ambush" && (this.state = "hidden"),
      m.ai === "burrower" && ((this.state = "burrowed"), this.sprite.setVisible(!1)),
      this.isElite)
    ) {
      const i = yi[this.traits[0]];
      const e = `${this.traits.map((r) => yi[r].name).join("·")} ${m.name}`;
      (this.label = void 0), !1 && S.add
        .text(C, E, e, {
          fontFamily: Di,
          fontSize: "8px",
          color: this.rare ? "#ffa040" : "#ffd84a",
          stroke: "#140e18",
          strokeThickness: 3,
        })
        .setOrigin(0.5, 1)
        .setDepth(11);
    }
    if (m.ai === "golden") {

      ((this.state = "flee"), (this.aux = 16));
    }
    for (const i of this.traits) this.traitT[i] = 2 + Math.random() * 3;
  }
  get cx() {
    return this.body.x;
  }
  get cy() {
    return this.body.y - this.body.h / 2;
  }
  defense() {
    return this.baseDef * (this.statuses.has("armorBreak") ? 0.5 : 1);
  }
  invulnerable() {
    return (
      this.state === "burrowed" || (this.def.ai === "blinker" && this.state === "windup" && this.st > this.windup * 0.4)
    );
  }
  hpRatio() {
    return this.hp / this.maxHp;
  }
  blocks(S) {
    if (this.def.foe) return FG.foeBlocks(this, S);
    return this.def.ai !== "shield" ||
      this.stunT > 0 ||
      S.pierceShield ||
      this.statuses.has("armorBreak") ||
      this.state === "attack"
      ? !1
      : S.dir === -this.facing;
  }
  receive(S, T, C) {
    if (this.dead) return 0;
    this.def.foe && (S = FG.foeDamage(this, S, C));
    this._stoneUntil > this.host.time.now && ((S *= 0.5), this.host.fx.burst("chunk", this.cx, this.cy, 3, 9073770));
    ((S = Math.max(1, Math.round(S))),
      (this.hp -= S),
      (this.sinceHit = 0),
      (this.aggro = !0),
      (this.flashT = 0.07),
      this.sprite.setTintFill(16777215),
      this.state === "hidden" && this.reveal());
    const E = 1 - this.heavy;
    if (
      (C.knock > 0 &&
        E > 0 &&
        ((this.body.vx = C.dir * C.knock * E * 0.8), C.knockUp && !this.def.flying && (this.body.vy = -C.knockUp * E)),
      C.stagger > 0 && this.def.ai !== "golden")
    ) {
      // 버티기 게이지: 충격이 쌓여 넘칠 때만 경직 (가벼운 공격은 스킬을 끊지 못한다)
      const now = this.host.time.now, guard = (this._poiseUntil ?? 0) > now;
      const R = C.stagger * (1 - this.heavy * 0.6) * (this.isElite ? 0.6 : 1);
      const cap = (this.isElite ? (this.rare ? 3.2 : 2.4) : 1.1) * (this.traits.includes("armored") ? 1.6 : 1) * (1 + this.heavy);
      this._poiseDmg = (this._poiseDmg ?? 0) + (guard ? R * 0.25 : R);
      if (R > 0.05 && this._poiseDmg >= cap) {
        this._poiseDmg = 0;
        this.stunT = Math.max(this.stunT, Math.max(0.35, R));
        this._poiseUntil = now + 1600;
        this.host.fx?.burst?.("glow", this.cx, this.cy - 6, 6, 16777215);
        this.state === "windup" && (this.setState("recover", 0.2), this.clearWarn());
      }
    }
    return (this.hp <= 0 && this.die(), S);
  }
  reveal() {
    ((this.state = "reveal"),
      (this.st = 0.35),
      (this.body.vy = -160),
      j.play("warn"),
      this.host.fx.burst("dust", this.cx, this.body.y, 6, 11575440));
  }
  die() {
    var T, C, E;
    if (this.dead) return;
    this.def.foe && FG.foeDie(this);
    ((this.dead = !0), this.clearWarn(), this.host.onEnemyKilled(this), j.play("enemyDie"));
    const S = this.host.fx;
    (S.burst("chunk", this.cx, this.cy, this.isElite ? 20 : 10, 16777215),
      S.burst("glow", this.cx, this.cy, 8, this.isElite ? yi[this.traits[0]].color : 16769216),
      this.sprite.setTintFill(16777215),
      (T = this.hpBg) == null || T.setVisible(!1),
      (C = this.hpFg) == null || C.setVisible(!1),
      this.host.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scaleX: this.sprite.scaleX * 1.3,
        scaleY: this.sprite.scaleY * 0.3,
        duration: 260,
        onComplete: () => this.remove(),
      }),
      (E = this.label) == null || E.destroy(),
      (this.label = void 0));
  }
  remove() {
    var S, T, C;
    this.removed ||
      ((this.removed = !0),
      (this.dead = !0),
      this.clearWarn(),
      this.sprite.destroy(),
      (S = this.label) == null || S.destroy(),
      (T = this.hpBg) == null || T.destroy(),
      (C = this.hpFg) == null || C.destroy(),
      (this.hpBg = this.hpFg = void 0));
  }
  setState(S, T = 0) {
    ((this.state = S), (this.st = T), (this.hitDone = !1), (this.contactDone = !1));
  }
  clearWarn() {
    this.warn && (this.warn.destroy(), (this.warn = void 0));
  }
  // 공격 범위 빨간 표시는 쓰지 않는다 (2026-11-28 사용자 요청) — 몬스터의 준비 동작으로 읽는다
  showWarn(S, T, C, E = "warn", R) {
    this.clearWarn();
  }
  hit(S, T, C, E, R = 1) {
    let h = E ?? this.def.status;
    this.traits.includes("flame") && (h = { type: "burn", chance: 1, dur: 3, power: 0.25 });
    const m = this.host.player;
    this.host.hurtPlayer({
      dmg: this.atk * S * (this.buffT > 0 ? 1.3 : 1),
      element: C ?? this.def.element ?? "phys",
      status: h,
      knock: R,
      dir: m.cx < this.cx ? -1 : 1,
      melee: T,
      srcX: this.cx,
      attacker: this,
    });
  }
  playerInRect(S, T, C, E) {
    const R = this.host.player.body;
    return !this.host.player.dead && ge(S, T, C, E, R.x - R.w / 2, R.y - R.h, R.w, R.h);
  }
  contact(S) {
    if (this.contactDone) return;
    const T = this.body;
    this.playerInRect(T.x - T.w / 2 - 2, T.y - T.h, T.w + 4, T.h) && ((this.contactDone = !0), this.hit(S, !0));
  }
  fire(S = 0, T = 1, C = 0.18) {
    const E = this.def,
      R = this.host.player,
      h = E.projectile,
      m = this.cx + this.facing * (this.body.w / 2),
      t = this.cy - 4,
      a = R.cx,
      v = R.cy;
    let o = Math.atan2(v - t, a - m),
      n,
      i;
    if (h.gravity) {
      const r = a - m,
        l = Ut(Math.abs(r) / h.speed, 0.45, 1.4);
      ((n = r / l), (i = (v - t - 0.5 * h.gravity * l * l) / l));
    }
    const e = T + (T > 1 || Math.random() < 0.5 ? this.diff.extraProj : 0);
    for (let r = 0; r < e; r++) {
      const l = (r - (e - 1) / 2) * C + S,
        s = {
          ehit: {
            dmg: this.atk * (this.buffT > 0 ? 1.3 : 1),
            element: E.element ?? "phys",
            status: this.traits.includes("flame") ? { type: "burn", chance: 1, dur: 3, power: 0.25 } : E.status,
            knock: 1,
            dir: this.facing,
            melee: !1,
            srcX: this.cx,
            attacker: this,
          },
        };
      n !== void 0
        ? this.host.projectiles.spawn(h, m, t, 0, "enemy", s, { vx: n * (1 + l * 0.5), vy: i - Math.abs(l) * 40 })
        : this.host.projectiles.spawn(h, m, t, o + l, "enemy", s);
    }
    j.play("shoot");
  }
  update(S) {
    var r;
    if (this.dead) return;
    this.life += S;
    const T = this.host,
      C = T.player,
      E = this.def,
      R = this.body;
    if (
      (this.statuses.update(S, (l, s) => {
        if (this.dead) return;
        const u = Math.max(1, Math.round(l));
        ((this.hp -= u),
          T.fx.number(this.cx, R.y - R.h - 4, `${u}`, s === "burn" ? "#ff9040" : s === "bleed" ? "#ff5a5a" : "#a0e060"),
          this.hp <= 0 && this.die());
      }),
      this.dead)
    )
      return;
    ((this.cd -= S),
      (this.st -= S),
      (this.sinceHit += S),
      (this.buffT -= S),
      this.flashT > 0 &&
        ((this.flashT -= S),
        this.flashT <= 0 && (this.sprite.clearTint(), this.buffT > 0 && this.sprite.setTint(16748688))));
    const h = this.statuses.has("freeze") || this.statuses.has("stun"),
      m = this.statuses.slowMult(),
      t = C.cx - this.cx,
      a = C.body.y - R.y,
      v = Math.hypot(t, a),
      // 자기 영역(태어난 구역·층·둘레)을 벗어난 플레이어는 보지도 쫓지도 않는다
      inT = FG.inTerritory(this, C),
      // 시야선: 벽 너머의 플레이어는 새로 알아채지 못한다. 싸우다 4초 넘게 못 보면 놓친다 (맞으면 시야와 상관없이 알아챈다)
      los = FG.foeSees(this, C, S),
      o = inT && !C.dead && v < E.sight * (this.aggro ? 1.6 : 1) && Math.abs(a) < 140 && (los || (this.aggro && this._blindFor < 4));
    this.aggro && !los && this.sinceHit > 4 && this._blindFor >= 4 && !this.opts?.midBoss && !this.opts?.summoned && ((this.aggro = !1), this.def.foe ? FG.foeGoHome(this) : this.state === "chase" && this.setState("return", 5));
    if (
      (inT || FG.leashTick(this, S),
      o && this.state !== "hidden" && this.state !== "burrowed" && (this.aggro = !0),
      this.isElite && this.aggro && !h && this.updateTraits(S, v),
      (this._poiseDmg = Math.max(0, (this._poiseDmg ?? 0) - S * 0.5)),
      this.stunT > 0 || h)
    ) {
      ((this.stunT -= S),
        (R.vx = Xt(R.vx, 0, 500 * S)),
        E.flying ? (R.vy = Xt(R.vy, 0, 400 * S)) : (R.vy = Math.min(600, R.vy + 1500 * S)),
        T.world.move(R, S, !E.flying),
        this.sprite.setFrame(E.foe ? FG.foeHurt(this) : 8),
        h && this.statuses.has("freeze") && this.sprite.setTint(10543359),
        this.sync());
      return;
    }
    this.statuses.has("freeze") === !1 && this.flashT <= 0 && this.buffT <= 0 && this.sprite.clearTint();
    const n = this.speed * m,
      i = () => {
        Math.abs(t) > 2 && (this.facing = t > 0 ? 1 : -1);
      };
    let e = "idle";
    if (E.foe) e = FG.foeThink(this, S);
    else switch (this.state) {
      case "hidden": {
        ((R.vx = 0), !C.dead && v < E.sight && Math.abs(a) < 80 && this.reveal(), (e = 0));
        break;
      }
      case "reveal": {
        ((e = 2), this.st <= 0 && (this.setState("chase"), (this.aggro = !0), (this.cd = Math.min(this.cd, 0.4))));
        break;
      }
      case "idle":
      case "patrol": {
        if (this.aggro) {
          this.setState("chase");
          break;
        }
        if (this.state === "idle")
          ((R.vx = Xt(R.vx, 0, 400 * S)),
            this.st <= 0 &&
              (this.setState("patrol", 1 + Math.random() * 2), (this.aux = Math.random() < 0.5 ? -1 : 1)));
        else {
          if (E.ai !== "turret" && E.speed > 0) {
            const l = this.homeX + this.aux * 40,
              s = Math.sign(l - R.x);
            (!E.flying && (T.world.ledgeAhead(R, s) || T.world.wallAhead(R, s)) && (this.aux *= -1),
              (R.vx = s * n * 0.4),
              (this.facing = s || this.facing),
              (e = "move"));
          }
          this.st <= 0 && this.setState("idle", 1 + Math.random() * 2);
        }
        E.flying && this.hover(S, this.homeX, R.y, 0.3);
        break;
      }
      case "return": {
        const l = Math.sign(this.homeX - R.x);
        ((R.vx = l * n * 0.7),
          (this.facing = l || 1),
          (e = "move"),
          (Math.abs(this.homeX - R.x) < 12 || this.st <= 0) && ((this.aggro = !1), this.setState("idle", 1)),
          o && v < E.sight * 0.7 && this.setState("chase"));
        break;
      }
      case "flee": {
        if (v > 320 && this.sinceHit > 3) {
          // 플레이어가 멀면 제자리에서 기다린다 (보기 전에 사라지지 않도록)
          ((R.vx = Xt(R.vx, 0, 900 * S)), (e = "idle"));
          break;
        }
        this.aux -= S;
        const l = t > 0 ? -1 : 1,
          s = v < 220 ? l : 1;
        if (
          ((R.vx = Xt(R.vx, s * n, 900 * S)),
          (this.facing = s),
          (e = "move"),
          R.onGround && (T.world.wallAhead(R, s) || T.world.ledgeAhead(R, s)) && (R.vy = -420),
          Math.random() < S * 0.3 && T.fx.burst("glow", this.cx, this.cy, 2, 16764992),
          this.aux <= 0)
        ) {
          (T.fx.burst("glow", this.cx, this.cy, 16, 16764992),
            T.fx.text(this.cx, R.y - 30, "황금 고블린이 도망쳤다...", "#ffd84a"),
            (this.dead = !0),
            this.remove());
          return;
        }
        break;
      }
      case "chase": {
        if (!this.aggro) {
          Math.abs(R.x - this.homeX) > 24 ? this.setState("return", 5) : this.setState("idle", 1);
          break;
        }
        if (Math.abs(R.x - this.homeX) > 520 && v > 160) {
          this.setState("return", 4);
          break;
        }
        if (!o && v > E.sight * 2) {
          this.setState("return", 4);
          break;
        }
        e = this.chase(S, t, a, v, n, i);
        break;
      }
      case "windup": {
        ((e = 6),
          (R.vx = Xt(R.vx, 0, 600 * S)),
          E.ai !== "charger" && E.ai !== "turret" && E.ai !== "blinker" && i(),
          Math.floor(this.st * 12) % 2 === 0 ? this.sprite.setTint(16740464) : this.sprite.clearTint(),
          E.flying && E.ai !== "flyer" && this.hover(S, R.x, R.y, 0.1),
          E.ai === "blinker" && this.sprite.setAlpha(Ut(this.st / this.windup, 0.15, 1)),
          this.st <= 0 && (this.sprite.clearTint(), this.sprite.setAlpha(1), this.beginAttack(t, a, v)));
        break;
      }
      case "attack": {
        ((e = 7), this.updateAttack(S, t, a, v, n));
        break;
      }
      case "recover": {
        ((e = this.def.ai === "burrower" ? 2 : "idle"),
          (R.vx = Xt(R.vx, 0, 500 * S)),
          E.flying && this.hover(S, C.cx - this.facing * 40, C.body.y - 70, 0.6),
          this.st <= 0 && this.setState(E.ai === "burrower" ? "burrowed" : "chase"));
        break;
      }
      case "burrowed": {
        (this.sprite.setVisible(!1),
          (R.vx = Xt(R.vx, Math.sign(t) * n * 1.3, 600 * S)),
          Math.random() < S * 12 && T.fx.burst("dust", this.cx, R.y, 1, 10520688),
          o &&
            Math.abs(t) < 14 &&
            this.cd <= 0 &&
            ((R.vx = 0), this.setState("windup", 0.65), this.showWarn(this.cx, R.y, 40), j.play("warn")),
          !o && Math.abs(R.x - this.homeX) > 400 && (R.vx = Math.sign(this.homeX - R.x) * n));
        break;
      }
      case "surfaced": {
        (this.sprite.setVisible(!0),
          (e = "idle"),
          i(),
          this.st <= 0
            ? (this.setState("burrowed"), (this.cd = this.cooldown), T.fx.burst("dust", this.cx, R.y, 8, 10520688))
            : v < 34 && this.cd <= 0 && !this.hitDone && ((this.hitDone = !0), (this.cd = 1), this.hit(0.7, !0)));
        break;
      }
    }
    if (T.world.solidAtPx(R.x, R.y - R.h / 2)) {
      // 벽 속에 끼었으면 가장 가까운 빈 곳으로
      const W = T.world;
      let done = !1;
      for (let k = 1; k <= 6 && !done; k++)
        for (const [dx, dy] of [[0, -k], [-k, 0], [k, 0], [0, k]]) {
          const nx = R.x + dx * gt, ny = R.y + dy * gt;
          if (!W.solidAtPx(nx, ny - R.h / 2) && !W.solidAtPx(nx, ny - 2) && !W.solidAtPx(nx, ny - R.h + 2)) {
            ((R.x = nx), (R.y = Math.floor(ny / gt) * gt), (R.vy = 0), (done = !0));
            break;
          }
        }
    }
    if (E.flying || (this.state === "burrowed" && !1))
      (T.world.move(R, S, !1), T.world.solidAtPx(R.x, R.y - 2) && (R.y -= 60 * S));
    else if ((this.dashT <= 0 && (R.vy = Math.min(650, R.vy + 1500 * S)), T.world.move(R, S), R.y > Oe + 60)) {
      ((this.dead = !0), this.remove());
      return;
    }
    if ((this.dashT > 0 && ((this.dashT -= S), this.contact(0.8)), E.foe)) FG.foeAnim(this);
    else if (e === "idle" || e === "move") {
      const l = `e_${E.id}_${e}`;
      (((r = this.sprite.anims.currentAnim) == null ? void 0 : r.key) !== l || !this.sprite.anims.isPlaying) &&
        this.sprite.play(l, !0);
    } else (this.sprite.anims.stop(), this.sprite.setFrame(e));
    this.sync();
  }
  sync() {
    const S = this.body;
    this.sprite.setPosition(Math.round(S.x), Math.round(S.y)).setFlipX(this.facing < 0);
    const T = Math.round(S.y - this.sprite.displayHeight),
      C =
        it.data.settings.enemyHpBars &&
        !this.dead &&
        this.hp < this.maxHp &&
        this.sprite.visible &&
        this.state !== "hidden" &&
        this.state !== "burrowed" &&
        this.def.ai !== "golden";
    if (C) {
      const E = Math.round(Ut(S.w + 6, 14, 34));
      this.hpBg ||
        ((this.hpBg = this.host.add.rectangle(0, 0, E, 3, 1314328, 0.85).setOrigin(0, 0).setDepth(11)),
        (this.hpFg = this.host.add
          .rectangle(0, 0, E - 2, 1, this.isElite ? 16756800 : 14696512)
          .setOrigin(0, 0)
          .setDepth(11)));
      const R = Math.round(S.x - E / 2),
        h = T - 4;
      (this.hpBg.setPosition(R, h).setVisible(!0),
        this.hpFg.setPosition(R + 1, h + 1).setVisible(!0),
        (this.hpFg.width = Math.max(0, ((E - 2) * this.hp) / this.maxHp)));
    } else this.hpBg && (this.hpBg.setVisible(!1), this.hpFg.setVisible(!1));
    this.label && this.label.setPosition(Math.round(S.x), T - (C ? 5 : 2));
  }
  hover(S, T, C, E) {
    const R = this.body;
    this.hoverPh += S * 3;
    const h = C + Math.sin(this.hoverPh) * 6;
    ((R.vx = Xt(R.vx, Ut((T - R.x) * 2, -this.speed, this.speed), 400 * S)),
      (R.vy = Xt(R.vy, Ut((h - R.y) * 3, -this.speed, this.speed), 500 * S)));
  }
  chase(S, T, C, E, R, h) {
    const m = this.host,
      t = this.def,
      a = this.body,
      v = Math.sign(T) || 1,
      o = (i) => {
        const e = Math.sign(i);
        return e !== 0 && !t.flying && m.world.ledgeAhead(a, e) && Math.abs(C) < 40
          ? ((a.vx = Xt(a.vx, 0, 600 * S)), !1)
          : (e !== 0 && !t.flying && a.onGround && m.world.wallAhead(a, e) && (a.vy = -380),
            (a.vx = Xt(a.vx, i, 700 * S)),
            i !== 0);
      },
      n = this.cd <= 0;
    switch (t.ai) {
      case "melee":
      case "shield":
        return (
          h(),
          Math.abs(T) < t.range + a.w / 2 && Math.abs(C) < 30
            ? ((a.vx = Xt(a.vx, 0, 600 * S)), n && this.startWindup(), "idle")
            : o(v * R * (t.ai === "shield" ? 0.8 : 1))
              ? "move"
              : "idle"
        );
      case "hopper": {
        if ((h(), a.onGround)) {
          if (((a.vx = Xt(a.vx, 0, 500 * S)), n && E < 120)) return (this.startWindup(), 6);
          ((this.aux -= S), this.aux <= 0 && ((this.aux = 0.7 + Math.random() * 0.4), (a.vy = -220), (a.vx = v * R)));
        }
        return a.onGround ? "idle" : "move";
      }
      case "charger": {
        if ((h(), n && Math.abs(T) < t.range && Math.abs(C) < 30)) return ((a.vx = 0), this.startWindup(), 6);
        const i = Math.abs(T) > t.range * 0.6 ? v * R : Math.abs(T) < 60 ? -v * R * 0.6 : 0;
        return o(i) ? "move" : "idle";
      }
      case "ranged":
      case "summoner":
      case "lobber": {
        h();
        const i = t.range * 0.7;
        let e = 0;
        (Math.abs(T) > t.range ? (e = v * R) : Math.abs(T) < i * 0.55 && (e = -v * R * 0.8),
          t.flying ? this.hover(S, this.cx + e * 0.5, m.player.body.y - 60, 1) : o(e));
        const r = m.world.lineOfSight(this.cx, this.cy - 4, m.player.cx, m.player.cy);
        if (n && E < t.range * 1.05 && r)
          if (t.ai === "summoner") {
            if (((this.summons = this.summons.filter((l) => !l.dead)), this.summons.length < 3))
              return (this.startWindup(), 6);
            this.cd = 1;
          } else return (this.startWindup(), 6);
        return e !== 0 ? "move" : "idle";
      }
      case "flyer":
        return (
          h(),
          this.hover(S, m.player.cx - v * 45 + Math.sin(this.hoverPh * 0.5) * 20, m.player.body.y - 55, 1),
          n && E < t.range + 40 && this.startWindup(),
          "move"
        );
      case "support": {
        if ((h(), n)) {
          const e = m.enemies.find(
            (r) =>
              r !== this &&
              !r.dead &&
              Math.abs(r.cx - this.cx) < 180 &&
              (t.id === "banner" ? r.buffT <= 0 && r.aggro : r.hp < r.maxHp * 0.75),
          );
          if (e || (t.id === "shaman" && E < t.range)) return ((this.aux2 = e ? 1 : 0), this.startWindup(), 6);
        }
        let i = 0;
        return (Math.abs(T) < 120 ? (i = -v * R) : Math.abs(T) > t.range && (i = v * R), o(i) ? "move" : "idle");
      }
      case "aoe":
        return (
          h(),
          t.flying && this.hover(S, m.player.cx - v * 30, m.player.body.y - 40, 1),
          n && Math.abs(T) < t.range + a.w / 2 && Math.abs(C) < 50
            ? ((a.vx = 0), (this.aux2 = 0), this.startWindup(), 6)
            : t.projectile && n && Math.abs(T) > 120 && Math.abs(T) < 240
              ? ((this.aux2 = 1), this.startWindup(), 6)
              : t.flying || o(v * R)
                ? "move"
                : "idle"
        );
      case "ambush":
        return (
          h(),
          t.id === "tentacle"
            ? ((a.vx = 0), n && Math.abs(T) < t.range + 6 && Math.abs(C) < 50 && this.startWindup(), 2)
            : t.id === "gargoyle"
              ? (this.hover(S, m.player.cx - v * 40, m.player.body.y - 60, 1),
                n && E < t.range + 30 && this.startWindup(),
                "move")
              : Math.abs(T) < t.range + a.w / 2 && Math.abs(C) < 30
                ? ((a.vx = 0), n && this.startWindup(), "idle")
                : o(v * R)
                  ? "move"
                  : "idle"
        );
      case "turret":
        return (
          h(),
          (a.vx = 0),
          n && E < t.range && m.world.lineOfSight(this.cx, this.cy - 4, m.player.cx, m.player.cy) && this.startWindup(),
          "idle"
        );
      case "blinker":
        return (h(), n && E < t.sight ? (this.startWindup(), 6) : o(v * R * 0.8) ? "move" : "idle");
      case "burrower":
        return 2;
    }
    return "idle";
  }
  startWindup() {
    var R;
    const S = this.def,
      T = this.body,
      C = this.host;
    let E = this.windup;
    (this.setState("windup", E),
      S.ai === "aoe" && this.aux2 === 0
        ? (S.flying
            ? this.showWarn(this.cx, this.cy, 128, "warncircle", 128)
            : this.showWarn(this.cx, T.y, S.range * 2 + T.w + 30),
          j.play("warn"))
        : S.ai === "turret" && S.id === "ballista"
          ? ((this.tx = this.facing),
            this.showWarn(this.cx + this.facing * 200, this.cy - 2, 400, "beam", 2),
            (R = this.warn) == null || R.setTint(16724e3))
          : S.ai === "ambush" && S.id === "sporecap"
            ? this.showWarn(this.cx, this.cy, S.range * 2, "warncircle", S.range * 2)
            : S.ai === "charger" && C.fx.text(this.cx, T.y - T.h - 10, "!", "#ff5a4a"),
      S.ai === "blinker" && (j.play("portal"), C.fx.burst("glow", this.cx, this.cy, 8, 8405184)));
  }
  beginAttack(S, T, C) {
    const E = this.def,
      R = this.body,
      h = this.host,
      m = h.player;
    switch ((this.clearWarn(), (this.cd = this.cooldown * (0.85 + Math.random() * 0.3)), E.ai)) {
      case "melee":
      case "shield":
        (this.setState("attack", 0.22),
          (R.vx = this.facing * this.speed * (E.ai === "shield" ? 1.5 : 2.4)),
          j.play("swing"));
        break;
      case "hopper":
        (this.setState("attack", 1.2), (R.vy = -340), (R.vx = Ut(S * 1.8, -220, 220)), j.play("jump"));
        break;
      case "charger":
        (this.setState("attack", 0.55), j.play("dash"));
        break;
      case "ranged":
      case "lobber":
      case "turret":
        (this.setState("attack", E.id === "sentinel" ? 0.5 : 0.15),
          (this.aux = 0),
          (this.aux2 = 0),
          E.id !== "sentinel" && this.fire(0, E.projCount ?? 1),
          E.id === "ballista" && ((R.vx = -this.facing * 20), h.fx.shake(2)));
        break;
      case "flyer":
      case "ambush":
        if (E.ai === "flyer" || E.id === "gargoyle") {
          this.setState("attack", 0.5);
          const t = Math.atan2(m.cy - this.cy, m.cx - this.cx);
          ((R.vx = Math.cos(t) * this.speed * 2.6), (R.vy = Math.sin(t) * this.speed * 2.6), j.play("dash"));
        } else
          E.id === "sporecap"
            ? (this.setState("attack", 0.3),
              h.fx.burst("glow", this.cx, this.cy, 24, 10145856),
              h.fx.anim("ring", this.cx, this.cy, { scale: E.range / 26, tint: 10145856 }),
              C < E.range + 6 && this.hit(1, !1, "poison"),
              j.play("explosion", 0.5))
            : E.id === "tentacle"
              ? (this.setState("attack", 0.3),
                h.fx.anim("tentacle_up", this.cx + this.facing * 28, R.y - 24, { flip: this.facing < 0 }),
                h.fx.shake(2),
                j.play("thud"))
              : (this.setState("attack", 0.25), (R.vx = this.facing * this.speed * 2), j.play("swing"));
        break;
      case "summoner": {
        this.setState("attack", 0.4);
        const t = E.summon ?? "slime";
        for (const a of [-24, 24]) {
          const v = h.spawnEnemy(t, this.cx + a, E.flying ? this.cy : R.y, { summoned: !0, noGold: !0 });
          v && (this.summons.push(v), (v.aggro = !0), h.fx.burst("glow", v.cx, v.cy, 10, 4259792));
        }
        j.play("magic");
        break;
      }
      case "support": {
        if ((this.setState("attack", 0.3), E.id === "shaman"))
          if (this.aux2 === 1) {
            for (const t of h.enemies)
              if (!t.dead && Math.abs(t.cx - this.cx) < 180 && t.hp < t.maxHp) {
                const a = Math.round(t.maxHp * 0.3);
                ((t.hp = Math.min(t.maxHp, t.hp + a)),
                  h.fx.number(t.cx, t.cy - 14, `+${a}`, "#7be36a"),
                  h.fx.burst("rise", t.cx, t.cy, 10, 8454016));
              }
            j.play("heal");
          } else this.fire(0, 1);
        else {
          for (const t of h.enemies)
            !t.dead &&
              Math.abs(t.cx - this.cx) < 180 &&
              ((t.buffT = 6), t.sprite.setTint(16748688), h.fx.burst("rise", t.cx, t.cy, 6, 16732240));
          (h.fx.anim("ring", this.cx, this.cy, { scale: 3, tint: 16728128 }),
            j.play("buff"),
            C < 40 && this.hit(0.8, !0));
        }
        break;
      }
      case "aoe": {
        if (this.aux2 === 1 && E.projectile) {
          (this.setState("attack", 0.2), this.fire(0, 1));
          break;
        }
        if ((this.setState("attack", 0.3), E.flying))
          (h.fx.anim("ring", this.cx, this.cy, { scale: 2.4, tint: 8429823 }),
            h.fx.burst("glow", this.cx, this.cy, 16, 8429823),
            C < 64 && this.hit(1, !1, "arcane"),
            j.play("magic"));
        else {
          const t = E.range + R.w / 2 + 14;
          (Math.abs(S) < t && Math.abs(T) < 40 && this.hit(1.2, !0),
            h.fx.anim("fx_smash", this.cx + this.facing * 16, R.y - 12, { scale: 1.6 }),
            h.fx.burst("chunk", this.cx, R.y - 2, 14, 11049080),
            h.fx.shake(4),
            j.play("thud", 1.2));
          for (const a of [-1, 1])
            h.projectiles.spawn(
              { sprite: "shockwave", speed: 200, life: 0.7, radius: 8 },
              this.cx + a * 18,
              R.y,
              a > 0 ? 0 : Math.PI,
              "enemy",
              { ehit: { dmg: this.atk * 0.7, element: "phys", knock: 1, dir: a, melee: !1, srcX: this.cx } },
              { ground: !0, pierce: 0, tint: 13676688 },
            );
        }
        break;
      }
      case "burrower": {
        (this.setState("surfaced", 1.6),
          this.sprite.setVisible(!0),
          h.fx.burst("chunk", this.cx, R.y - 2, 16, 10520688),
          h.fx.shake(3),
          j.play("thud"),
          Math.abs(m.cx - this.cx) < 26 && Math.abs(m.body.y - R.y) < 40 && this.hit(1.2, !0, void 0, void 0, 1),
          (m.body.vy = Math.min(m.body.vy, Math.abs(m.cx - this.cx) < 26 ? -260 : m.body.vy)));
        break;
      }
      case "blinker": {
        const t = -m.facing;
        let a = m.cx + t * 34;
        ((h.world.solidAtPx(a, m.body.y - 8) || h.world.ledgeAhead({ ...R, x: a }, 0, 0)) && (a = m.cx - t * 34),
          h.fx.burst("glow", this.cx, this.cy, 10, 8405184),
          (R.x = a),
          (R.y = m.body.y),
          (R.vx = 0),
          (this.facing = m.cx > a ? 1 : -1),
          h.fx.burst("glow", this.cx, this.cy, 10, 8405184),
          this.sprite.setAlpha(1),
          this.setState("attack", 0.42),
          (this.aux = 0.24),
          j.play("portal"));
        break;
      }
      default:
        this.setState("recover", 0.4);
    }
  }
  updateAttack(S, T, C, E, R) {
    const h = this.def,
      m = this.body,
      t = this.host;
    switch (h.ai) {
      case "melee":
      case "shield": {
        m.vx = Xt(m.vx, 0, 900 * S);
        const a = h.range + 6;
        (!this.hitDone &&
          this.playerInRect(this.facing > 0 ? this.cx : this.cx - a - m.w / 2, m.y - m.h, a + m.w / 2, m.h) &&
          ((this.hitDone = !0), this.hit(1, !0)),
          this.st <= 0 && this.setState("recover", h.recovery));
        break;
      }
      case "hopper":
        (this.contact(1), ((m.onGround && this.st < 1) || this.st <= 0) && this.setState("recover", h.recovery));
        break;
      case "charger": {
        ((m.vx = this.facing * this.speed * 3.2 * this.statuses.slowMult()),
          this.contact(1),
          Math.random() < S * 20 && t.fx.burst("dust", this.cx - this.facing * 6, m.y, 1, 12628128),
          (this.st <= 0 || m.hitWall || t.world.ledgeAhead(m, this.facing, 2)) &&
            ((m.vx = 0), this.setState("recover", h.recovery + (m.hitWall ? 0.4 : 0))));
        break;
      }
      case "ranged":
      case "lobber":
      case "turret": {
        (h.id === "sentinel" &&
          ((this.aux -= S), this.aux <= 0 && this.aux2 < 3 && ((this.aux = 0.15), this.aux2++, this.fire(0, 1))),
          this.st <= 0 && this.setState("recover", h.recovery));
        break;
      }
      case "flyer":
      case "ambush": {
        if (h.ai === "flyer" || h.id === "gargoyle")
          (this.contact(1), (this.st <= 0 || this.contactDone) && this.setState("recover", h.recovery));
        else if (h.id === "tentacle") {
          if (!this.hitDone && this.st < 0.22) {
            this.hitDone = !0;
            const a = h.range;
            this.playerInRect(this.facing > 0 ? this.cx : this.cx - a, m.y - 44, a, 44) && this.hit(1, !0);
          }
          this.st <= 0 && this.setState("recover", h.recovery);
        } else {
          m.vx = Xt(m.vx, 0, 600 * S);
          const a = h.range + 4;
          (!this.hitDone &&
            this.playerInRect(this.facing > 0 ? this.cx : this.cx - a - m.w / 2, m.y - m.h, a + m.w / 2, m.h) &&
            ((this.hitDone = !0), this.hit(1, !0)),
            this.st <= 0 && this.setState("recover", h.recovery));
        }
        break;
      }
      case "blinker": {
        if (((this.aux -= S), this.aux <= 0 && !this.hitDone)) {
          this.hitDone = !0;
          const a = h.range + 8;
          (t.fx.anim("fx_slash", this.cx + this.facing * 16, this.cy, {
            flip: this.facing < 0,
            tint: h.id === "phantom" ? 10535167 : 16736448,
          }),
            this.playerInRect(this.facing > 0 ? this.cx : this.cx - a, m.y - m.h - 4, a, m.h + 8) && this.hit(1, !0),
            j.play("swing"));
        }
        this.st <= 0 && this.setState("recover", h.recovery);
        break;
      }
      default:
        this.st <= 0 && this.setState("recover", h.recovery);
    }
  }
  updateTraits(S, T) {
    const C = this.host,
      E = this.body;
    for (const R of this.traits)
      switch (((this.traitT[R] -= S), R)) {
        case "regen":
          this.sinceHit > 2 &&
            this.hp < this.maxHp &&
            ((this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.04 * S)),
            Math.random() < S * 4 && C.fx.burst("rise", this.cx, this.cy, 1, 6348896));
          break;
        case "flame":
          Math.random() < S * 8 && C.fx.burst("glow", this.cx + (Math.random() - 0.5) * E.w, this.cy, 1, 16744480);
          break;
        case "blink":
          if (this.traitT[R] <= 0 && T < 260 && this.state === "chase") {
            this.traitT[R] = 6;
            const h = C.player,
              m = h.cx + (Math.random() < 0.5 ? -1 : 1) * 46;
            !C.world.solidAtPx(m, h.body.y - 8) &&
              !C.world.ledgeAhead({ ...E, x: m, y: h.body.y }, 0, 0) &&
              (C.fx.burst("glow", this.cx, this.cy, 10, 11559167),
              (E.x = m),
              (E.y = h.body.y),
              C.fx.burst("glow", this.cx, this.cy, 10, 11559167),
              j.play("portal"));
          }
          break;
        case "summon":
          if (
            this.traitT[R] <= 0 &&
            T < 300 &&
            ((this.traitT[R] = 8), (this.summons = this.summons.filter((h) => !h.dead)), this.summons.length < 3)
          ) {
            const h = C.currentRegion()
                .enemies.map((t) => t.id)
                .filter((t) => se[t].ai !== "turret" && se[t].ai !== "summoner"),
              m = h[Math.floor(Math.random() * h.length)] ?? "slime";
            for (const t of [-30, 30]) {
              const a = C.spawnEnemy(m, this.cx + t, se[m].flying ? this.cy - 20 : E.y, { summoned: !0, noGold: !0 });
              a && ((a.aggro = !0), this.summons.push(a), C.fx.burst("glow", a.cx, a.cy, 8, 4247744));
            }
            j.play("magic");
          }
          break;
        case "swift":
          this.traitT[R] <= 0 &&
            T < 220 &&
            this.state === "chase" &&
            !this.def.flying &&
            ((this.traitT[R] = 4),
            (this.dashT = 0.32),
            (this.contactDone = !1),
            (E.vx = Math.sign(C.player.cx - this.cx) * 380),
            j.play("dash"));
          break;
      }
  }
  shift(S) {
    ((this.body.x -= S),
      (this.homeX -= S),
      (this.sprite.x -= S),
      this.label && (this.label.x -= S),
      this.warn && (this.warn.x -= S),
      this.hpBg && ((this.hpBg.x -= S), (this.hpFg.x -= S)));
  }
}
class yr {
  constructor(S, T, C, E, R, h, m) {
    Z(this, "kind", "boss");
    Z(this, "def");
    Z(this, "body");
    Z(this, "sprite");
    Z(this, "statuses", new ai());
    Z(this, "hp");
    Z(this, "maxHp");
    Z(this, "atk");
    Z(this, "baseDef");
    Z(this, "phase", 1);
    Z(this, "dead", !1);
    Z(this, "facing", -1);
    Z(this, "busy", !1);
    Z(this, "idleT", 1.4);
    Z(this, "poise", 0);
    Z(this, "staggerT", 0);
    Z(this, "flashT", 0);
    Z(this, "hidden", !1);
    Z(this, "shieldFront", !1);
    Z(this, "tier");
    Z(this, "waiters", []);
    Z(this, "lastPattern", "");
    Z(this, "holdFrame", null);
    Z(this, "temp", []);
    Z(this, "minions", []);
    Z(this, "wind", 0);
    Z(this, "speedMul", 1);
    ((this.host = S), (this.groundY = E), (this.arenaL = R), (this.arenaR = h), (this.def = ji[T]));
    const t = ni(m);
    this.tier = t.tier;
    const a = FG.diffDist(m) / 1e3;
    ((this.maxHp = Math.round(this.def.hp * (1 + 0.22 * a) * (1 + t.tier * 0.3))),
      (this.hp = this.maxHp),
      (this.atk = this.def.atk * t.atkMult * 0.9),
      (this.baseDef = this.def.def + t.defAdd),
      (this.body = Je(C, this.def.flying ? E - 80 : E, this.def.w, this.def.h)),
      gn[T],
      (FG.foeEnsure(S, T), (this.sprite = S.add.sprite(C, this.body.y, `b_${T}`, 0).setOrigin(0.5, 1).setDepth(12))),
      (this.speedMul = 1 + t.tier * 0.04));
  }
  get cx() {
    return this.body.x;
  }
  get cy() {
    return this.body.y - this.body.h / 2;
  }
  defense() {
    return this.baseDef * (this.statuses.has("armorBreak") ? 0.5 : 1);
  }
  invulnerable() {
    return this.hidden || this.host.bossIntro;
  }
  blocks(S) {
    return this.shieldFront && !S.pierceShield && S.dir === -this.facing;
  }
  receive(S, T, C) {
    return this.dead
      ? 0
      : ((S = Math.max(1, Math.round(S))),
        (this.hp -= S),
        (this.flashT = 0.06),
        this.sprite.setTintFill(16777215),
        (this.poise += C.stagger * (C.heavy ? 1.6 : 1) + (S / this.maxHp) * 2),
        this.poise > 4 &&
          this.staggerT <= 0 &&
          ((this.poise = 0),
          (this.staggerT = 0.9),
          this.host.fx.text(this.cx, this.body.y - this.body.h - 10, "경직!", "#ffd84a")),
        this.phase === 1 && this.hp < this.maxHp * 0.5 && this.enterPhase2(),
        this.hp <= 0 && ((this.hp = 0), this.die()),
        S);
  }
  enterPhase2() {
    ((this.phase = 2),
      (this.speedMul *= 1.2),
      j.play("bossRoar"),
      this.host.fx.shake(6, 500),
      this.host.cameras.main.flash(250, 255, 80, 60),
      this.host.fx.text(this.cx, this.body.y - this.body.h - 16, "분노!", "#ff5a4a"),
      this.def.foe || this.sprite.setTint(16756896));
  }
  die() {
    if (this.dead) return;
    ((this.dead = !0), (this.waiters = []), this.cleanupTemp());
    for (const E of this.minions) !E.dead && "die" in E && E.die();
    this.host.onBossKilled(this);
    const S = this.host.fx;
    j.play("explosion", 1.5);
    let T = 0;
    const C = () => {
      if (T++ > 6) {
        (this.host.tweens.add({
          targets: this.sprite,
          alpha: 0,
          duration: 600,
          onComplete: () => this.sprite.destroy(),
        }),
          S.burst("glow", this.cx, this.cy, 40, this.def.color));
        return;
      }
      (S.anim("explode", this.cx + (Math.random() - 0.5) * this.body.w, this.cy + (Math.random() - 0.5) * this.body.h, {
        scale: 1.2,
      }),
        j.play("explosion"),
        this.host.time.delayedCall(140, C));
    };
    (this.sprite.setTintFill(16777215), C());
  }
  wait(S) {
    return new Promise((T) => this.waiters.push({ t: S / this.speedMul, res: T }));
  }
  faceP() {
    this.facing = this.host.player.cx > this.cx ? 1 : -1;
  }
  frame(S) {
    this.holdFrame = S;
  }
  pl() {
    return this.host.player;
  }
  dmg(S, T, C, E, R = 1) {
    const h = this.pl();
    this.host.hurtPlayer({
      dmg: this.atk * S,
      element: C ?? this.def.element,
      status: E,
      knock: R,
      dir: h.cx < this.cx ? -1 : 1,
      melee: T,
      srcX: this.cx,
      boss: !0,
      attacker: this,
    });
  }
  hitRect(S, T, C, E, R, h, m) {
    const t = this.pl().body;
    return !this.pl().dead && ge(S, T, C, E, t.x - t.w / 2, t.y - t.h, t.w, t.h) ? (this.dmg(R, !0, h, m), !0) : !1;
  }
  hitCircle(S, T, C, E, R, h) {
    const m = this.pl(),
      t = Ut(S, m.body.x - 5, m.body.x + 5),
      a = Ut(T, m.body.y - 22, m.body.y);
    return !m.dead && Math.hypot(t - S, a - T) < C ? (this.dmg(E, !1, R, h), !0) : !1;
  }
  // 공격 범위 빨간 표시는 쓰지 않는다 (2026-11-28 사용자 요청) — 몬스터의 준비 동작으로 읽는다
  warnBar(S, T, C, E = this.groundY) {
    j.play("warn");
  }
  warnCircle(S, T, C, E) {}
  warnLine(S, T, C, E, R, h = 16724e3) {}
  shoot(S, T, C, E, R, h, m, t = {}) {
    this.host.projectiles.spawn(
      S,
      T,
      C,
      E,
      "enemy",
      {
        ehit: {
          dmg: this.atk * R,
          element: h ?? this.def.element,
          status: m,
          knock: 1,
          dir: Math.cos(E) >= 0 ? 1 : -1,
          melee: !1,
          srcX: T,
          boss: !0,
        },
      },
      t,
    );
  }
  wave(S, T, C = 240, E = 13676688, R = 1.6) {
    this.shoot(
      { sprite: "shockwave", speed: C, life: R, radius: 9 },
      this.cx + S * (this.body.w / 2),
      this.groundY,
      S > 0 ? 0 : Math.PI,
      T,
      "phys",
      void 0,
      { ground: !0, tint: E, scale: 1.2 },
    );
  }
  ballistic(S, T, C, E, R, h, m) {
    const t = this.cx,
      a = this.body.y - this.body.h * 0.7,
      v = S.gravity ?? 500,
      o = (T - t) / E,
      n = (C - a - 0.5 * v * E * E) / E;
    this.shoot({ ...S, gravity: v }, t, a, 0, R, h, m, { vx: o, vy: n });
  }
  async walkTo(S, T, C) {
    let E = 0;
    for (; E < C && Math.abs(this.body.x - S) > 8 && !this.dead;)
      ((this.body.vx = Math.sign(S - this.body.x) * T * this.speedMul),
        (this.facing = this.body.vx > 0 ? 1 : -1),
        await this.wait(0.05),
        (E += 0.05));
    this.body.vx = 0;
  }
  clampX(S, T = 30) {
    return Ut(S, this.arenaL + T, this.arenaR - T);
  }
  cleanupTemp() {
    for (const S of this.temp) S.destroy();
    ((this.temp = []), (this.wind = 0));
  }
  async summon(S, T, C) {
    this.minions = this.minions.filter((E) => !E.dead);
    for (let E = 0; E < T && this.minions.length < C; E++) {
      const R = this.clampX(this.cx + (E % 2 ? 1 : -1) * (60 + E * 30)),
        h = this.host.spawnEnemy(S, R, this.groundY - (S === "soul" || S === "wasp" ? 60 : 0), {
          summoned: !0,
          noGold: !0,
        });
      (h && ((h.aggro = !0), this.minions.push(h), this.host.fx.burst("glow", h.cx, h.cy, 14, this.def.color)),
        await this.wait(0.15));
    }
  }
  async run(S) {
    if (this.def.foe) return FG.foeBoss(this, S);
    const T = this.host,
      C = T.fx,
      E = this.pl(),
      R = this.body,
      h = this.phase === 2;
    switch ((this.faceP(), S)) {
      case "slam": {
        (this.frame(4),
          this.warnBar(this.cx + this.facing * 40, 130, 0.75),
          await this.wait(0.75),
          this.frame(5),
          C.shake(6),
          j.play("thud", 1.5),
          C.burst("chunk", this.cx + this.facing * 40, this.groundY - 2, 20, 11049080),
          C.anim("fx_smash", this.cx + this.facing * 40, this.groundY - 12, { scale: 2 }),
          this.hitRect(this.cx + (this.facing > 0 ? -10 : -110), this.groundY - 50, 120, 50, 1.4),
          this.wave(-1, 0.8),
          this.wave(1, 0.8),
          h && (await this.wait(0.35), this.wave(-1, 0.8, 300), this.wave(1, 0.8, 300)),
          await this.wait(0.6));
        break;
      }
      case "charge": {
        (this.frame(6),
          C.text(this.cx, R.y - R.h - 10, "!", "#ff5a4a"),
          this.warnBar(
            this.facing > 0 ? (this.cx + this.arenaR) / 2 : (this.cx + this.arenaL) / 2,
            Math.abs((this.facing > 0 ? this.arenaR : this.arenaL) - this.cx),
            0.7,
          ),
          await this.wait(0.7));
        let m = 0,
          t = !1;
        for (
          j.play("dash");
          m < 1.5 &&
          !this.dead &&
          ((R.vx = this.facing * 340 * this.speedMul),
          !t && this.hitRect(R.x - R.w / 2, R.y - R.h, R.w, R.h, 1.3) && (t = !0),
          Math.random() < 0.4 && C.burst("dust", this.cx - this.facing * 20, this.groundY, 2, 11575440),
          !(
            (this.facing > 0 && R.x > this.arenaR - R.w / 2 - 4) ||
            (this.facing < 0 && R.x < this.arenaL + R.w / 2 + 4)
          ));
        )
          (await this.wait(0.03), (m += 0.03));
        ((R.vx = 0), C.shake(7), j.play("thud", 1.5), (this.staggerT = 0.9), this.frame(7));
        const a = h ? 5 : 3;
        for (let v = 0; v < a; v++) {
          const o = this.clampX(v === 0 ? E.cx : this.arenaL + Math.random() * (this.arenaR - this.arenaL));
          (this.warnBar(o, 30, 0.8),
            T.time.delayedCall(800 / this.speedMul, () => {
              this.dead ||
                this.shoot(
                  { sprite: "p_bigrock", speed: 0, gravity: 900, life: 2, radius: 9 },
                  o,
                  10,
                  Math.PI / 2,
                  0.8,
                  "phys",
                  void 0,
                  { vx: 0, vy: 100 },
                );
            }));
        }
        await this.wait(1.1);
        break;
      }
      case "rockThrow": {
        (this.frame(4), await this.wait(0.55), this.frame(5));
        const m = h ? 5 : 3;
        for (let t = 0; t < m; t++) {
          const a = this.clampX(E.cx + (t - (m - 1) / 2) * 50);
          this.ballistic(
            { sprite: "p_bigrock", speed: 0, life: 3, radius: 9, gravity: 700 },
            a,
            this.groundY - 6,
            0.9 + t * 0.05,
            0.9,
          );
        }
        (j.play("swingHeavy"), await this.wait(0.9));
        break;
      }
      case "quake": {
        for (let m = 0; m < (h ? 3 : 2); m++) {
          for (
            this.faceP(),
              this.frame(4),
              await this.wait(0.35),
              this.frame(2),
              R.vy = -480,
              R.vx = Ut((E.cx - this.cx) * 1.1, -260, 260),
              this.warnBar(this.clampX(E.cx), 90, 0.6),
              await this.wait(0.15);
            !R.onGround && !this.dead;
          )
            await this.wait(0.03);
          ((R.vx = 0),
            this.frame(5),
            C.shake(6),
            j.play("thud", 1.4),
            C.anim("ring", this.cx, this.groundY - 6, { scale: 2.6, scaleY: 0.7, tint: 16769184 }),
            this.hitRect(this.cx - 60, this.groundY - 30, 120, 30, 1.1),
            this.wave(-1, 0.7),
            this.wave(1, 0.7),
            await this.wait(0.35));
        }
        await this.wait(0.5);
        break;
      }
      case "poisonVolley": {
        (this.frame(4), await this.wait(0.6), this.frame(5));
        const m = h ? 8 : 6;
        for (let t = 0; t < m; t++) {
          const a = this.clampX(
            this.arenaL + 30 + ((this.arenaR - this.arenaL - 60) * t) / (m - 1) + (Math.random() - 0.5) * 30,
          );
          this.ballistic(
            { sprite: "p_spore", speed: 0, life: 3, radius: 6, gravity: 500, aoe: 22 },
            a,
            this.groundY - 4,
            1.1,
            0.7,
            "poison",
            { type: "poison", chance: 1, dur: 4, power: 0.15 },
          );
        }
        (j.play("magic"), await this.wait(1.2));
        break;
      }
      case "vineEruption": {
        this.frame(6);
        const m = h ? 5 : 3;
        for (let t = 0; t < m; t++) {
          const a = this.clampX(E.cx + (t === 0 ? 0 : (Math.random() - 0.5) * 120));
          (this.warnBar(a, 34, 0.7),
            await this.wait(0.3),
            T.time.delayedCall(400 / this.speedMul, () => {
              this.dead ||
                (C.anim("vine", a, this.groundY - 20, { scale: 1.2 }),
                j.play("thud", 0.6),
                this.hitRect(a - 14, this.groundY - 48, 28, 48, 1, "poison", {
                  type: "poison",
                  chance: 0.6,
                  dur: 3,
                  power: 0.15,
                }));
            }));
        }
        await this.wait(0.9);
        break;
      }
      case "summonSpores": {
        (this.frame(6), await this.wait(0.5), await this.summon(h ? "wasp" : "sporecap", 2, 3));
        for (const m of this.minions)
          m instanceof Object && "state" in m && m.state === "hidden" && (m.state = "chase");
        await this.wait(0.8);
        break;
      }
      case "sporeCloud": {
        if (
          (this.frame(4),
          this.warnCircle(this.cx, this.cy, 80, 0.8),
          await this.wait(0.8),
          this.frame(5),
          C.burst("glow", this.cx, this.cy, 40, 10145856),
          C.anim("ring", this.cx, this.cy, { scale: 3, tint: 10145856 }),
          this.hitCircle(this.cx, this.cy, 80, 1, "poison", { type: "poison", chance: 1, dur: 5, power: 0.18 }),
          h)
        )
          for (let m = 0; m < 4; m++)
            this.shoot(
              { sprite: "p_spore", speed: 70, life: 4, radius: 6, homing: 0.8 },
              this.cx,
              this.cy - 20,
              -Math.PI / 2 + (m - 1.5) * 0.6,
              0.6,
              "poison",
              { type: "poison", chance: 1, dur: 3, power: 0.12 },
            );
        await this.wait(0.8);
        break;
      }
      case "burrowAmbush": {
        for (let m = 0; m < (h ? 2 : 1); m++) {
          (this.frame(6),
            C.burst("chunk", this.cx, this.groundY - 2, 14, 10520688),
            j.play("thud"),
            (this.hidden = !0),
            this.sprite.setVisible(!1));
          for (let a = 0; a < 1; a += 0.05)
            ((R.x = Xt(R.x, E.cx, 360 * 0.05)),
              C.burst("dust", this.cx, this.groundY, 2, 10520688),
              await this.wait(0.05));
          const t = this.clampX(E.cx);
          (this.warnBar(t, 54, 0.6),
            await this.wait(0.6),
            (R.x = t),
            (this.hidden = !1),
            this.sprite.setVisible(!0),
            this.frame(5),
            C.shake(6),
            j.play("thud", 1.5),
            C.burst("chunk", t, this.groundY - 2, 24, 10520688),
            this.hitRect(t - 26, this.groundY - 110, 52, 110, 1.4) && (E.body.vy = -380),
            await this.wait(0.7));
        }
        break;
      }
      case "lunge": {
        (this.frame(4),
          this.warnBar(this.cx + this.facing * 90, 170, 0.6),
          await this.wait(0.6),
          this.frame(5),
          j.play("dash"));
        for (let m = 0; m < 0.4; m += 0.03)
          ((R.vx = this.facing * 420),
            this.hitRect(R.x - R.w / 2 - 10, R.y - R.h, R.w + 20, R.h, 1.2),
            await this.wait(0.03));
        ((R.vx = 0), await this.wait(0.6));
        break;
      }
      case "rockSpit": {
        (this.frame(4), await this.wait(0.5), this.frame(5));
        const m = h ? 5 : 3,
          t = Math.atan2(E.cy - (this.body.y - this.body.h + 10), E.cx - this.cx);
        for (let a = 0; a < m; a++)
          this.shoot(
            { sprite: "p_rock", speed: 260, gravity: 300, life: 3, radius: 5 },
            this.cx,
            this.body.y - this.body.h + 10,
            t + (a - (m - 1) / 2) * 0.18,
            0.7,
          );
        (j.play("shoot"), await this.wait(0.7));
        break;
      }
      case "tailSweep": {
        (this.frame(6),
          this.warnBar(this.cx, 300, 0.75),
          await this.wait(0.75),
          this.frame(5),
          j.play("swingHeavy"),
          C.shake(4),
          C.anim("fx_heavy", this.cx, this.groundY - 10, { scale: 3, scaleY: 0.5 }),
          this.hitRect(this.cx - 150, this.groundY - 18, 300, 18, 1.1),
          await this.wait(0.7));
        break;
      }
      case "bladeSweep": {
        (this.frame(4),
          this.warnBar(this.cx + this.facing * 60, 150, 0.7),
          await this.wait(0.7),
          this.frame(5),
          j.play("swingHeavy"),
          C.shake(5),
          C.anim("fx_heavy", this.cx + this.facing * 50, this.groundY - 18, {
            flip: this.facing < 0,
            scale: 2.4,
            scaleY: 1,
          }),
          this.hitRect(this.cx + (this.facing > 0 ? -10 : -140), this.groundY - 28, 150, 28, 1.5),
          h &&
            (await this.wait(0.3),
            this.faceP(),
            this.frame(4),
            this.warnBar(this.cx + this.facing * 60, 150, 0.45),
            await this.wait(0.45),
            this.frame(5),
            j.play("swingHeavy"),
            C.anim("fx_heavy", this.cx + this.facing * 50, this.groundY - 18, { flip: this.facing < 0, scale: 2.4 }),
            this.hitRect(this.cx + (this.facing > 0 ? -10 : -140), this.groundY - 28, 150, 28, 1.5)),
          await this.wait(0.6));
        break;
      }
      case "leapCleave": {
        const m = this.clampX(E.cx);
        for (
          this.frame(4),
            this.warnCircle(m, this.groundY - 10, 50, 0.9),
            await this.wait(0.3),
            this.frame(2),
            R.vy = -520,
            R.vx = (m - this.cx) / 0.66,
            await this.wait(0.2);
          !R.onGround && !this.dead;
        )
          await this.wait(0.03);
        ((R.vx = 0),
          this.frame(5),
          C.shake(7),
          j.play("thud", 1.5),
          C.anim("fx_smash", this.cx, this.groundY - 12, { scale: 2.2 }),
          C.burst("chunk", this.cx, this.groundY - 2, 18, 13676672),
          this.hitCircle(this.cx, this.groundY - 10, 52, 1.5),
          this.wave(-1, 0.8, 260, 14729344),
          this.wave(1, 0.8, 260, 14729344),
          await this.wait(0.8));
        break;
      }
      case "sandstorm": {
        this.frame(6);
        const m = Math.random() < 0.5 ? -1 : 1;
        (T.fx.text((this.arenaL + this.arenaR) / 2, this.groundY - 120, "모래폭풍!", "#ffd84a"),
          T.weatherOverlay(14200944, 0.35, 3.6),
          (this.wind = m * 70));
        for (let t = 0; t < 3.4; t += 0.25) {
          const a = this.groundY - 10 - Math.floor(Math.random() * 3) * 22;
          (this.shoot(
            { sprite: "p_sand", speed: 260, life: 3, radius: 5, ignoreTerrain: !0 },
            m > 0 ? this.arenaL + 4 : this.arenaR - 4,
            a,
            m > 0 ? 0 : Math.PI,
            0.5,
          ),
            await this.wait(0.25));
        }
        ((this.wind = 0), await this.wait(0.3));
        break;
      }
      case "tornado": {
        (this.frame(6), await this.wait(0.5), this.frame(5));
        const m = h ? 3 : 2;
        for (let t = 0; t < m; t++)
          this.shoot(
            { sprite: "p_sand", speed: 90, life: 4.5, radius: 12, homing: 0.9, ignoreTerrain: !0 },
            this.cx + (t - 1) * 30,
            this.groundY - 14,
            this.facing > 0 ? 0 : Math.PI,
            0.7,
            "phys",
            void 0,
            { scale: 2.6 },
          );
        (j.play("magic"), await this.wait(1));
        break;
      }
      case "frostSlash": {
        (this.frame(4), await this.wait(0.5));
        const m = this.clampX(E.cx - this.facing * 30);
        (this.warnLine(this.cx, this.cy, m, this.cy, 0.25, 8442111), await this.wait(0.25), j.play("dash"));
        for (let t = 0; t < 0.3 && Math.abs(R.x - m) > 10; t += 0.02)
          ((R.vx = Math.sign(m - R.x) * 600), await this.wait(0.02));
        ((R.vx = 0),
          this.faceP(),
          this.frame(5),
          j.play("swingHeavy"),
          C.anim("fx_heavy", this.cx + this.facing * 24, this.cy, {
            flip: this.facing < 0,
            tint: 10543359,
            scale: 1.4,
          }),
          this.hitRect(this.cx + (this.facing > 0 ? 0 : -60), this.cy - 30, 60, 60, 1.3, "ice", {
            type: "chill",
            chance: 1,
            dur: 2,
            power: 0.4,
          }),
          this.shoot(
            { sprite: "p_icicle", speed: 300, life: 1.6, radius: 6 },
            this.cx,
            this.groundY - 10,
            this.facing > 0 ? 0 : Math.PI,
            0.7,
            "ice",
            { type: "chill", chance: 1, dur: 2, power: 0.4 },
            { scale: 2 },
          ),
          await this.wait(0.6));
        break;
      }
      case "iceSpears": {
        this.frame(6);
        const m = h ? 8 : 5,
          t = [this.clampX(E.cx)];
        for (let a = 1; a < m; a++)
          t.push(this.clampX(this.arenaL + 20 + Math.random() * (this.arenaR - this.arenaL - 40)));
        for (const a of t) this.warnBar(a, 26, 0.85);
        await this.wait(0.85);
        for (const a of t)
          (C.anim("icespike", a, this.groundY - 18, {}),
            this.hitRect(a - 10, this.groundY - 36, 20, 36, 1.1, "ice", {
              type: "chill",
              chance: 1,
              dur: 2,
              power: 0.4,
            }));
        (j.play("ice"), C.shake(3), await this.wait(0.6));
        break;
      }
      case "dashThrust": {
        for (let m = 0; m < (h ? 3 : 2); m++) {
          (this.faceP(), this.frame(4));
          const t = this.facing > 0 ? this.arenaR - 30 : this.arenaL + 30;
          (this.warnLine(this.cx, this.cy, t, this.cy, 0.45, 8442111),
            await this.wait(0.45),
            this.frame(6),
            j.play("dash"));
          for (let a = 0; a < 0.6 && Math.abs(R.x - t) > 12; a += 0.02)
            ((R.vx = this.facing * 640),
              this.hitRect(R.x - 16, this.cy - 12, 32, 24, 1.1, "ice"),
              C.burst("glow", this.cx, this.cy, 1, 10543359),
              await this.wait(0.02));
          ((R.vx = 0), await this.wait(0.3));
        }
        await this.wait(0.4);
        break;
      }
      case "iceWall": {
        (this.frame(6), await this.wait(0.4));
        for (let m = 0; m < 3; m++) {
          const t = h && m === 1,
            a = E.cx > this.cx ? 1 : -1;
          (t
            ? this.shoot(
                { sprite: "p_icicle", speed: 260, life: 3, radius: 6, ignoreTerrain: !0 },
                this.cx,
                this.groundY - 34,
                a > 0 ? 0 : Math.PI,
                0.8,
                "ice",
                void 0,
                { scale: 2.4 },
              )
            : this.wave(a, 0.8, 250, 10543359, 2.4),
            j.play("ice"),
            await this.wait(0.7));
        }
        break;
      }
      case "mortar": {
        (this.frame(4), await this.wait(0.4));
        const m = h ? 6 : 4;
        for (let t = 0; t < m; t++) {
          const a = this.clampX(t === 0 ? E.cx : this.arenaL + 30 + Math.random() * (this.arenaR - this.arenaL - 60));
          (this.warnBar(a, 40, 1.1),
            this.ballistic(
              { sprite: "p_fire", speed: 0, life: 3, radius: 6, gravity: 650, aoe: 30 },
              a,
              this.groundY - 4,
              1.1,
              0.9,
              "fire",
              { type: "burn", chance: 1, dur: 3, power: 0.2 },
            ),
            await this.wait(0.12));
        }
        (this.frame(5), j.play("explosion", 0.6), await this.wait(1));
        break;
      }
      case "shieldCharge": {
        (this.frame(4),
          (this.shieldFront = !0),
          C.text(this.cx, R.y - R.h - 10, "!", "#ff5a4a"),
          await this.wait(0.7),
          j.play("dash"));
        let m = !1;
        for (
          let t = 0;
          t < 1.3 &&
          ((R.vx = this.facing * 320 * this.speedMul),
          !m &&
            this.hitRect(R.x - R.w / 2 - 4, R.y - R.h, R.w + 8, R.h, 1.2) &&
            ((m = !0), (E.body.vx = this.facing * 400)),
          !(
            (this.facing > 0 && R.x > this.arenaR - R.w / 2 - 4) ||
            (this.facing < 0 && R.x < this.arenaL + R.w / 2 + 4)
          ));
          t += 0.03
        )
          await this.wait(0.03);
        ((R.vx = 0), (this.shieldFront = !1), C.shake(4), await this.wait(0.6));
        break;
      }
      case "callSoldiers": {
        (this.frame(6),
          j.play("bossRoar"),
          await this.wait(0.6),
          await this.summon(Math.random() < 0.5 ? "pikeman" : "xbowman", 2, 3),
          await this.wait(0.6));
        break;
      }
      case "flameSweep": {
        (this.frame(4), this.warnBar(this.cx + this.facing * 90, 160, 0.7), await this.wait(0.7), this.frame(5));
        for (let m = 0; m < 1.2; m += 0.1) {
          for (let t = 1; t <= 5; t++)
            Math.random() < 0.6 &&
              C.anim("flame", this.cx + this.facing * (t * 30), this.groundY - 11, { scale: 1.2, depth: 30 });
          (this.hitRect(this.cx + (this.facing > 0 ? 10 : -170), this.groundY - 26, 160, 26, 0.45, "fire", {
            type: "burn",
            chance: 1,
            dur: 3,
            power: 0.2,
          }),
            j.play("explosion", 0.3),
            await this.wait(0.1));
        }
        await this.wait(0.5);
        break;
      }
      case "laserSweep": {
        const m = E.cx > (this.arenaL + this.arenaR) / 2,
          t = m ? this.arenaL + 20 : this.arenaR - 20,
          a = m ? this.arenaR - 20 : this.arenaL + 20;
        (this.frame(4),
          this.warnLine(this.cx, this.cy, t, this.groundY - 4, 0.8, 16728256),
          this.warnBar((t + a) / 2, Math.abs(a - t), 0.8),
          await this.wait(0.8),
          this.frame(5),
          j.play("magic"));
        const v = T.add.image(this.cx, this.cy, "beam").setOrigin(0, 0.5).setDepth(28).setTint(16736511);
        this.temp.push(v);
        for (let o = 0; o <= 1.6; o += 0.03) {
          const n = t + (a - t) * (o / 1.6),
            i = Math.hypot(n - this.cx, this.groundY - this.cy);
          (v
            .setPosition(this.cx, this.cy)
            .setRotation(Math.atan2(this.groundY - 4 - this.cy, n - this.cx))
            .setDisplaySize(i, 10),
            C.burst("glow", n, this.groundY - 4, 2, 16736511),
            this.hitRect(n - 10, this.groundY - 20, 20, 20, 1.2, "dark"),
            await this.wait(0.03));
        }
        (v.destroy(), await this.wait(0.5));
        break;
      }
      case "voidOrbs": {
        (this.frame(6), await this.wait(0.5));
        const m = h ? 10 : 6;
        for (let t = 0; t < m; t++)
          this.shoot(
            { sprite: "p_void", speed: 110, life: 4, radius: 6, homing: 1.1, ignoreTerrain: !0 },
            this.cx,
            this.cy,
            (t / m) * Math.PI * 2,
            0.6,
            "dark",
          );
        (j.play("magic"), await this.wait(1.2));
        break;
      }
      case "teleport": {
        (this.frame(6),
          T.tweens.add({ targets: this.sprite, alpha: 0, duration: 300 }),
          await this.wait(0.35),
          (this.hidden = !0));
        const m = this.clampX(E.cx > (this.arenaL + this.arenaR) / 2 ? this.arenaL + 80 : this.arenaR - 80, 60);
        ((R.x = m), (R.y = this.groundY - 70 - Math.random() * 40));
        const t = this.clampX(E.cx);
        (this.warnBar(t, 30, 0.7),
          await this.wait(0.3),
          (this.hidden = !1),
          T.tweens.add({ targets: this.sprite, alpha: 1, duration: 300 }),
          await this.wait(0.4),
          C.anim("tentacle_up", t, this.groundY - 24, { scale: 1.2 }),
          this.hitRect(t - 12, this.groundY - 48, 24, 48, 1.1, "dark"),
          j.play("thud"),
          await this.wait(0.5));
        break;
      }
      case "tentacles": {
        this.frame(4);
        const m = h ? 5 : 3;
        for (let t = 0; t < m; t++) {
          const a = this.clampX(E.cx + (t - (m - 1) / 2) * 60);
          (this.warnBar(a, 30, 0.8),
            T.time.delayedCall(800 / this.speedMul + t * 120, () => {
              this.dead ||
                (C.anim("tentacle_up", a, this.groundY - 24, { scale: 1.2 }),
                this.hitRect(a - 12, this.groundY - 48, 24, 48, 1, "dark"),
                j.play("thud", 0.6));
            }));
        }
        await this.wait(1.4);
        break;
      }
      case "arcaneBarrage": {
        for (let m = 0; m < (h ? 4 : 3); m++) {
          (this.frame(4), await this.wait(0.35), this.frame(5));
          const t = Math.atan2(E.cy - this.cy, E.cx - this.cx);
          for (let a = -1; a <= 1; a++)
            this.shoot(
              { sprite: "p_arcane", speed: 280, life: 2.5, radius: 5, ignoreTerrain: !0 },
              this.cx,
              this.cy - 10,
              t + a * 0.22,
              0.6,
              "arcane",
            );
          j.play("magic");
        }
        await this.wait(0.6);
        break;
      }
      case "phantomSwords": {
        this.frame(6);
        const m = h ? 7 : 5,
          t = [this.clampX(E.cx)];
        for (let a = 1; a < m; a++) t.push(this.clampX(E.cx + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * 44));
        for (const a of t) this.warnBar(a, 18, 0.9);
        await this.wait(0.9);
        for (const a of t)
          this.shoot(
            { sprite: "p_bolt", speed: 520, life: 1.2, radius: 6, ignoreTerrain: !1 },
            a,
            this.groundY - 200,
            Math.PI / 2,
            0.9,
            "arcane",
            void 0,
            { tint: 10535167, scale: 1.6 },
          );
        (j.play("swing"), await this.wait(0.8));
        break;
      }
      case "teleportSlam": {
        (this.frame(6),
          T.tweens.add({ targets: this.sprite, alpha: 0, duration: 250 }),
          await this.wait(0.3),
          (this.hidden = !0));
        const m = this.clampX(E.cx);
        ((R.x = m),
          (R.y = this.groundY - 130),
          this.warnCircle(m, this.groundY - 10, 46, 0.8),
          await this.wait(0.4),
          (this.hidden = !1),
          T.tweens.add({ targets: this.sprite, alpha: 1, duration: 150 }),
          await this.wait(0.4),
          (R.y = this.groundY),
          this.frame(5),
          C.shake(6),
          j.play("thud", 1.4),
          C.anim("ring", this.cx, this.groundY - 8, { scale: 2.4, scaleY: 0.8, tint: 8429823 }),
          this.hitCircle(this.cx, this.groundY - 10, 46, 1.4, "arcane"),
          this.wave(-1, 0.7, 240, 8429823),
          this.wave(1, 0.7, 240, 8429823),
          await this.wait(0.7));
        break;
      }
      case "summonKnights": {
        (this.frame(6), await this.wait(0.6), await this.summon("phantom", h ? 2 : 1, 2), await this.wait(0.6));
        break;
      }
      case "riftBeam": {
        const m = Math.random() < 0.5,
          t = m ? this.groundY - 30 : this.groundY - 8;
        (this.frame(4),
          this.warnLine(this.arenaL, t, this.arenaR, t, 0.9, 4259792),
          T.fx.text((this.arenaL + this.arenaR) / 2, t - 16, m ? "땅에 붙어라!" : "뛰어라!", "#80fff0"),
          await this.wait(0.9),
          this.frame(5),
          j.play("magic"));
        const a = T.add
          .image(this.arenaL, t, "beam")
          .setOrigin(0, 0.5)
          .setDepth(28)
          .setTint(4259792)
          .setDisplaySize(this.arenaR - this.arenaL, m ? 18 : 10);
        this.temp.push(a);
        for (let v = 0; v < 0.5; v += 0.05)
          (m
            ? E.body.onGround || this.hitRect(this.arenaL, t - 9, this.arenaR - this.arenaL, 18, 1.1, "dark")
            : this.hitRect(this.arenaL, t - 5, this.arenaR - this.arenaL, 10, 1.1, "dark"),
            await this.wait(0.05));
        (a.destroy(), await this.wait(0.5));
        break;
      }
      default:
        await this.wait(0.5);
    }
    this.frame(null);
  }
  update(S) {
    var R;
    if (this.dead) return;
    const T = this.body,
      C = this.host;
    for (let h = this.waiters.length - 1; h >= 0; h--) {
      const m = this.waiters[h];
      ((m.t -= this.staggerT > 0 ? 0 : S), m.t <= 0 && (this.waiters.splice(h, 1), m.res()));
    }
    if (
      (this.statuses.update(S, (h) => {
        const m = Math.max(1, Math.round(h));
        ((this.hp -= m),
          C.fx.number(this.cx, this.body.y - this.body.h, `${m}`, "#ff9040"),
          this.phase === 1 && this.hp > 0 && this.hp < this.maxHp * 0.5 && this.enterPhase2(),
          this.hp <= 0 && ((this.hp = 0), this.die()));
      }),
      this.dead)
    )
      return;
    if (
      (this.flashT > 0 &&
        ((this.flashT -= S),
        this.flashT <= 0 && (this.sprite.clearTint(), this.phase === 2 && !this.def.foe && this.sprite.setTint(16756896))),
      this.staggerT > 0 && ((this.staggerT -= S), (T.vx = Xt(T.vx, 0, 800 * S))),
      !this.busy && !C.bossIntro && this.staggerT <= 0)
    ) {
      if (((this.idleT -= S), this.idleT > 0 && !this.def.flying)) {
        const h = C.player.cx - this.cx;
        Math.abs(h) > 90
          ? ((T.vx = Xt(T.vx, Math.sign(h) * 70 * this.speedMul, 300 * S)), (this.facing = h > 0 ? 1 : -1))
          : (T.vx = Xt(T.vx, 0, 400 * S));
      }
      if (this.idleT <= 0) {
        const h = this.def.patterns.filter((t) => t !== this.lastPattern || this.def.patterns.length < 2),
          m = h[Math.floor(Math.random() * h.length)];
        ((this.lastPattern = m),
          (this.busy = !0),
          this.run(m).then(() => {
            ((this.busy = !1), (this.idleT = (this.phase === 2 ? 0.7 : 1.1) / this.speedMul), (this.holdFrame = null));
          }));
      }
    }
    if (this.def.flying) {
      if (!this.busy || this.lastPattern !== "teleport") {
        const h = this.groundY - 90 + Math.sin(this.host.time.now / 500) * 10;
        ((T.vy = Xt(T.vy, (h - T.y) * 2, 300 * S)),
          this.busy || (T.vx = Xt(T.vx, Ut((C.player.cx - this.cx) * 0.6, -60, 60), 200 * S)));
      }
      C.world.move(T, S, !1);
    } else ((T.vy = Math.min(800, T.vy + 1500 * S)), C.world.move(T, S));
    ((T.x = Ut(T.x, this.arenaL + T.w / 2, this.arenaR - T.w / 2)),
      this.wind !== 0 && !C.player.dead && (C.player.body.vx += this.wind * S * 4));
    const E = this.sprite;
    if ((E.setPosition(Math.round(T.x), Math.round(T.y)).setFlipX(this.facing < 0), this.staggerT > 0))
      (E.anims.stop(), E.setFrame(this.def.foe ? FG.foeFrame(this.def.id, "stagger") : 7));
    else if (this.holdFrame !== null) (E.anims.stop(), E.setFrame(this.holdFrame));
    else {
      const h = Math.abs(T.vx) > 10 ? `b_${this.def.id}_move` : `b_${this.def.id}_idle`;
      (((R = E.anims.currentAnim) == null ? void 0 : R.key) !== h || !E.anims.isPlaying) && E.play(h, !0);
    }
    if (!this.hidden && !C.player.dead && C.player.iframes <= 0) {
      const h = C.player.body;
      ge(T.x - T.w / 2 + 6, T.y - T.h + 6, T.w - 12, T.h - 6, h.x - h.w / 2, h.y - h.h, h.w, h.h) && this.dmg(0.5, !0);
    }
  }
  shift(S) {
    ((this.body.x -= S), (this.sprite.x -= S), (this.arenaL -= S), (this.arenaR -= S));
    for (const T of this.temp) T.x !== void 0 && (T.x -= S);
  }
  destroy() {
    ((this.dead = !0), (this.waiters = []), this.cleanupTemp(), this.sprite.destroy());
  }
}
const Tr = { common: 62, rare: 27, epic: 9, legendary: 2 };
function Ji(A) {
  return Math.round(10 + 6 * A + 1.2 * Math.pow(A, 1.55));
}
class Sr {
  constructor(S, T) {
    Z(this, "level", 1);
    Z(this, "xp", 0);
    Z(this, "pending", 0);
    Z(this, "rerolls", 1);
    Z(this, "owned", new Map());
    Z(this, "relics", []);
    Z(this, "order", []);
    Z(this, "streak", 0);
    Z(this, "streakT", 0);
    Z(this, "bestStreak", 0);
    ((this.mods = S), (this.ctx = T));
  }
  stacks(S) {
    return this.owned.get(S) ?? 0;
  }
  addXp(S) {
    this.xp += S * (1 + this.mods.xpMult);
    let T = 0;
    for (; this.xp >= Ji(this.level);) ((this.xp -= Ji(this.level)), this.level++, this.pending++, T++);
    return T;
  }
  onKill() {
    return (
      (this.streak = this.streakT > 0 ? this.streak + 1 : 1),
      (this.streakT = 3.5),
      (this.bestStreak = Math.max(this.bestStreak, this.streak)),
      1 + Math.min(0.5, Math.floor(this.streak / 10) * 0.1) * this.mods.streakMult
    );
  }
  update(S) {
    this.streakT > 0 && ((this.streakT -= S), this.streakT <= 0 && (this.streak = 0));
  }
  fullCtx() {
    return { ...this.ctx(), mods: this.mods, level: this.level, stacks: (S) => this.stacks(S) };
  }
  available(S) {
    const T = this.fullCtx();
    return S.filter((C) => this.stacks(C.id) < C.max && (!C.req || C.req(T)));
  }
  draw(S, T, C) {
    const E = this.available(S),
      R = this.mods.luck,
      h = this.level,
      m = (v) => {
        let o = Tr[v.rarity];
        if (C) v.rarity === "legendary" && (o *= 1 + R * 0.5);
        else {
          if (v.rarity === "legendary" && h < 6 && !v.evo) return 0;
          (v.rarity === "epic" && h < 3 && (o *= 0.3),
            v.rarity !== "common" && (o *= 1 + Math.min(1.2, h * 0.03) + R * 0.6));
        }
        return (this.stacks(v.id) > 0 && (o *= 1.35), o);
      },
      t = [],
      a = E.slice();
    for (; t.length < T && a.length;) {
      const v = a.reduce((e, r) => e + m(r), 0);
      if (v <= 0) break;
      let o = Math.random() * v,
        n = 0;
      for (; n < a.length && ((o -= m(a[n])), !(o <= 0)); n++);
      const i = a.splice(Math.min(n, a.length - 1), 1)[0];
      t.push({ def: i, stack: this.stacks(i.id) + 1 });
    }
    return t;
  }
  offerLevel() {
    const S = this.draw(ti, 3, !1),
      T = this.available(ti).filter((C) => C.evo && !S.some((E) => E.def.id === C.id));
    if (T.length && Math.random() < 0.7) {
      const C = T[Math.floor(Math.random() * T.length)];
      S.some((E) => E.def.evo) || (S[S.length > 0 ? Math.floor(Math.random() * S.length) : 0] = { def: C, stack: 1 });
    }
    return S.length === 0 ? this.draw(Ci, 1, !0) : S;
  }
  offerRelics(S = 3) {
    const T = this.draw(Ci, S, !0);
    return T.length ? T : this.draw(ti, S, !1);
  }
  offerShop() {
    return [...this.draw(ti, 2, !1), ...this.draw(Ci, 1, !0)];
  }
  acquire(S) {
    const T = Ee[S];
    if (!T) return;
    const C = this.stacks(S) + 1;
    C > T.max ||
      (this.owned.set(S, C),
      C === 1 && this.order.push(S),
      T.relic && this.relics.push(S),
      T.apply(this.mods, C),
      S === "x_coin" && (this.rerolls += 2));
  }
}
class Cr {
  constructor(S) {
    Z(this, "orbs", []);
    Z(this, "orbHitCd", new Map());
    Z(this, "gfx");
    Z(this, "boltT", 0);
    Z(this, "orbAngle", 0);
    ((this.s = S), (this.gfx = S.add.graphics().setDepth(46)));
  }
  get pl() {
    return this.s.player;
  }
  atk() {
    return this.pl.stats.atk * this.pl.atkMult() * this.pl.stats.dmgMult;
  }
  params(S, T, C = {}) {
    return { dmg: S, element: T, knock: 60, stagger: 0.15, dir: 1, source: "proc", noCrit: !0, pierceShield: !0, ...C };
  }
  aoe(S, T, C, E, R, h = {}) {
    for (const m of this.s.targets()) {
      if (m.dead) continue;
      const t = m.body,
        a = Ut(S, t.x - t.w / 2, t.x + t.w / 2),
        v = Ut(T, t.y - t.h, t.y);
      Math.hypot(a - S, v - T) <= C && this.s.hitTarget(m, this.params(E, R, { ...h, dir: t.x < S ? -1 : 1 }));
    }
  }
  chainLightning(S, T) {
    const C = this.atk() * 0.7,
      E = new Set([S]),
      R = [{ x: S.body.x, y: S.body.y - S.body.h / 2 }];
    let h = S;
    for (let m = 0; m < T; m++) {
      let t = null,
        a = 130;
      for (const v of this.s.targets()) {
        if (v.dead || E.has(v)) continue;
        const o = Math.hypot(v.body.x - h.body.x, v.body.y - h.body.y);
        o < a && ((a = o), (t = v));
      }
      if (!t) break;
      (E.add(t),
        (h = t),
        R.push({ x: t.body.x, y: t.body.y - t.body.h / 2 }),
        this.s.hitTarget(t, this.params(C, "lightning", { status: { type: "stun", chance: 0.25, dur: 0.3 } })));
    }
    R.length > 1 && (this.bolt(R), j.play("lightning", 0.6));
  }
  smite(S) {
    const T = S.body.x,
      C = S.body.y - S.body.h / 2;
    (this.bolt([
      { x: T + (Math.random() - 0.5) * 20, y: C - 220 },
      { x: T, y: C },
    ]),
      this.s.fx.anim("explode", T, C, { scale: 1.2, tint: 16775328, blend: !0 }),
      this.s.fx.shake(2),
      j.play("lightning"),
      this.aoe(T, C, 30, this.atk() * 2, "lightning", { stagger: 0.4 }));
  }
  explode(S, T, C) {
    (this.s.fx.anim("explode", S, T, { scale: 1.3, tint: 16752736 }),
      this.s.fx.burst("glow", S, T, 10, 16744512),
      j.play("explosion", 0.6),
      this.aoe(S, T, 42, this.atk() * C, "fire", { knock: 160 }));
  }
  dashNova(S) {
    const T = this.pl;
    (this.s.fx.anim("ring", T.cx, T.cy, { scale: 2.2, tint: 9492735, blend: !0 }),
      this.s.fx.burst("glow", T.cx, T.cy, 14, 9492735),
      j.play("thud", 0.8),
      this.aoe(T.cx, T.cy, 52, this.atk() * S, "arcane", { knock: 240, stagger: 0.4 }));
  }
  bolt(S) {
    const T = this.gfx;
    T.clear().setAlpha(1);
    for (let C = 0; C < 2; C++) {
      (T.lineStyle(C ? 1 : 3, C ? 16777215 : 16773216, 1), T.beginPath(), T.moveTo(S[0].x, S[0].y));
      for (let E = 1; E < S.length; E++) {
        const R = S[E - 1],
          h = S[E];
        for (let m = 1; m <= 4; m++) {
          const t = m / 4,
            a = m < 4 ? 10 : 0;
          T.lineTo(
            R.x + (h.x - R.x) * t + (Math.random() - 0.5) * a,
            R.y + (h.y - R.y) * t + (Math.random() - 0.5) * a,
          );
        }
      }
      T.strokePath();
    }
    for (const C of S.slice(1)) this.s.fx.anim("hitspark", C.x, C.y, { tint: 16773216, scale: 1.3 });
    this.boltT = 0.18;
  }
  update(S) {
    const T = this.pl,
      C = T.run;
    this.boltT > 0 &&
      ((this.boltT -= S), this.gfx.setAlpha(Math.max(0, this.boltT / 0.18)), this.boltT <= 0 && this.gfx.clear());
    const E = T.dead ? 0 : Math.min(8, C.orbs);
    for (; this.orbs.length < E;)
      this.orbs.push({
        s: this.s.add
          .sprite(T.cx, T.cy, "p_orb")
          .play("p_orb_anim")
          .setTint(8450303)
          .setScale(0.8)
          .setDepth(26)
          .setBlendMode(zt.BlendModes.ADD),
        a: 0,
      });
    for (; this.orbs.length > E;) this.orbs.pop().s.destroy();
    if (!this.orbs.length) return;
    this.orbAngle += S * 3.2;
    for (const [h, m] of this.orbHitCd) m - S <= 0 ? this.orbHitCd.delete(h) : this.orbHitCd.set(h, m - S);
    const R = this.atk() * 0.5;
    this.orbs.forEach((h, m) => {
      h.a = this.orbAngle + (m / this.orbs.length) * Math.PI * 2;
      const t = T.cx + Math.cos(h.a) * 34,
        a = T.cy + Math.sin(h.a) * 26;
      h.s.setPosition(t, a);
      for (const v of this.s.targets()) {
        if (v.dead || this.orbHitCd.has(v)) continue;
        const o = v.body;
        t > o.x - o.w / 2 - 6 &&
          t < o.x + o.w / 2 + 6 &&
          a > o.y - o.h - 6 &&
          a < o.y + 6 &&
          (this.orbHitCd.set(v, 0.45),
          this.s.hitTarget(v, this.params(R, "arcane", { knock: 90, dir: o.x < T.cx ? -1 : 1 })));
      }
    });
  }
  shift(S) {
    for (const T of this.orbs) T.s.x -= S;
  }
  destroy() {
    for (const S of this.orbs) S.s.destroy();
    ((this.orbs = []), this.gfx.destroy());
  }
}
const gi = 12,
  Es = 19;
class Er extends zt.Scene {
  constructor() {
    super("Run");
    Z(this, "isHub", !1);
    Z(this, "world");
    Z(this, "player");
    Z(this, "fx");
    Z(this, "projectiles");
    Z(this, "gold");
    Z(this, "evm");
    Z(this, "collider");
    Z(this, "enemies", []);
    Z(this, "boss", null);
    Z(this, "bossIntro", !1);
    Z(this, "run");
    Z(this, "killed", new Set());
    Z(this, "enemyHp", new Map());
    Z(this, "bossDefeated", new Set());
    Z(this, "surfaceFlags", { ice: !1, quicksand: !1 });
    Z(this, "maxDist", 0);
    Z(this, "regionIdx", -1);
    Z(this, "bg", null);
    Z(this, "oldBg", null);
    Z(this, "ambient", null);
    Z(this, "vignette");
    Z(this, "weather");
    Z(this, "keys");
    Z(this, "inp", Hi());
    Z(this, "camLook", 0);
    Z(this, "camX", 0);
    Z(this, "camY", 0);
    Z(this, "checkpointT", 0);
    Z(this, "dying", !1);
    Z(this, "nextMs", null);
    Z(this, "recordShown", !1);
    Z(this, "recordFlag");
    Z(this, "prompt");
    Z(this, "promptKey");
    Z(this, "gateSprites", new Map());
    Z(this, "arenaLock", null);
    Z(this, "seed", 0);
    Z(this, "pauseReq", !1);
    Z(this, "nextBgPreload", -1);
    Z(this, "timeScale", 1);
    Z(this, "diffCache", ni(0));
    Z(this, "abandoned", !1);
    Z(this, "build");
    Z(this, "effects");
    Z(this, "levelDelay", 0);
    Z(this, "relicQueue", 0);
    Z(this, "reactCd", new WeakMap());
    Z(this, "lastHitWeapon");
    Z(this, "pad");
    Z(this, "mouseT", { t: -1e9 });
    Z(this, "mouseLock", !1);
    Z(this, "promptKeyText");
  }
  get ph() {
    return this;
  }
  evo(T) {
    return this.player.run.evo.includes(`evo_${T}`) && this.player.weapons.id === T;
  }
  create() {
    var a;
    ((this.enemies = []),
      (this.boss = null),
      (this.bossIntro = !1),
      this.killed.clear(),
      this.enemyHp.clear(),
      this.bossDefeated.clear(),
      (this.dying = !1),
      (this.maxDist = 0),
      (this.regionIdx = -1),
      (this.recordShown = !1),
      this.gateSprites.clear(),
      (this.arenaLock = null),
      (this.bg = null),
      (this.oldBg = null),
      (this.ambient = null),
      (this.timeScale = 1),
      (this.promptKeyText = void 0),
      (this.nextBgPreload = -1),
      (this.checkpointT = 0),
      (this.camLook = 0),
      (this.pauseReq = !1),
      (this._rmbHeld = !1),
      (this.abandoned = !1),
      (this.cleaned = !1),
      (this.mouseLock = !1),
      (this.pad = new ri(this)),
      (this.mouseT = Xs(this)));
    const T = () => {
        it.data.settings.autoPause && this.scene.isActive() && !this.dying && (this.pauseReq = !0);
      },
      C = () => {
        ((this.mouseLock = !0), this.pad.poll());
      };
    (this.game.events.on(zt.Core.Events.BLUR, T),
      this.game.events.on(zt.Core.Events.HIDDEN, T),
      this.events.on("resume", C),
      this.events.once("shutdown", () => {
        (this.game.events.off(zt.Core.Events.BLUR, T),
          this.game.events.off(zt.Core.Events.HIDDEN, T),
          this.events.off("resume", C));
      }),
      (this.run = it.beginRun()),
      // 지형은 저장 파일마다 고정 (탐험마다 바뀌지 않는다)
      (this.seed = FG.worldSeed()),
      this.cameras.main.setBackgroundColor("#0b0a10"),
      (this.world = new zn(this, this.seed)),
      (this.collider = this.world),
      (this.fx = new Hs(this)),
      (this.projectiles = new ks(this)));
    FG.startRun(this);
    const E = FG.stats(this),
      R = this.world.lx(me) + 8,
      h = (Ft - 6 - UGR) * gt;
    ((this.player = new Ws(this, E, R, h)),
      (this.build = new Sr(this.player.run, () => ({
        weaponKinds: this.player.stats.loadout.weapons
          .filter((v) => !!v)
          .map((v) => {
            var o;
            return ((o = ae[v]) == null ? void 0 : o.kind) ?? "melee";
          }),
        weapons: this.player.stats.loadout.weapons.filter((v) => !!v),
        skills: this.player.skills.slots.filter((v) => !!v),
      }))),
      FG.hookBuild(this),
      (this.effects = new Cr(this)),
      (this.levelDelay = 0),
      (this.relicQueue = 0),
      (this.gold = new mr(
        this,
        this.world,
        (v) => this.addGold(v),
        () => {
          (this.player.heal(this.player.maxHp * 0.12),
            j.play("heal"),
            this.fx.burst("rise", this.player.cx, this.player.cy, 8, 8454016));
        },
      )),
      (this.evm = new xr(this)),
      (this.world.onLoad = (v) => this.onChunkLoad(v)),
      (this.world.onUnload = (v) => this.onChunkUnload(v)),
      (this.vignette = this.add
        .image(ot / 2, xt / 2, "vignette")
        .setScrollFactor(0)
        .setDepth(80)
        .setAlpha(0)),
      (this.weather = this.add
        .rectangle(ot / 2, xt / 2, ot, xt, 16777215, 0)
        .setScrollFactor(0)
        .setDepth(79)),
      (this.recordFlag = this.add.image(0, 0, "record_flag").setOrigin(0.5, 1).setDepth(6).setVisible(!1)),
      (this.prompt = this.add
        .text(0, 0, "", { fontFamily: ii, fontSize: "10px", color: "#f2e6c4", stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0, 0.5)
        .setDepth(70)
        .setVisible(!1)),
      (this.promptKey = this.add.image(0, 0, "ui_key").setDepth(70).setVisible(!1)),
      this.add.text(0, 0, "E", {}).setVisible(!1));
    const m = zt.Input.Keyboard.KeyCodes;
    ((this.keys = this.input.keyboard.addKeys({
      A: m.A,
      D: m.D,
      W: m.W,
      S: m.S,
      LEFT: m.LEFT,
      RIGHT: m.RIGHT,
      UP: m.UP,
      DOWN: m.DOWN,
      SPACE: m.SPACE,
      SHIFT: m.SHIFT,
      Q: m.Q,
      E: m.E,
      R: m.R,
      F: m.F,
      ONE: m.ONE,
      TWO: m.TWO,
      ESC: m.ESC,
    })),
      (a = this.input.mouse) == null || a.disableContextMenu(),
      this.input.keyboard.on("keydown-ESC", () => {
        // 가방이 열려 있으면 ESC는 가방만 닫는다
        FG.bagBlocks(this) ? FG.closeBagOf(this) : (this.pauseReq = !0);
      }),
      FG.zoneBegin(this),
      this.world.update(this.player.x),
      this.updateRegion(!0),
      this.computeNextMilestone(),
      !FG.zoned && this.run.prevBest > 0 && this.placeRecordFlag());
    const t = this.cameras.main;
    ((this.camX = Math.max(this.world.lx(0), this.player.x - ot / 2 + 60)),
      (this.camY = Ut(this.player.body.y - xt * 0.62, 0, Oe - xt)),
      t.setScroll(this.camX, this.camY),
      t.fadeIn(400),
      this.scene.launch("Hud"),
      !1 &&
        this.time.delayedCall(2600, () => {
          var v;
          return (v = this.hud()) == null
            ? void 0
            : v.banner(
                "조작법",
                "A/D 이동 · Space 점프(2단 가능) · ↓ 막기(방패) · Shift 대시 · 좌클릭 공격 · 우클릭 특수 · Q/E 스킬 · R 마법 · Tab 가방·융합 · B 운명 보드 · Esc 일시정지",
                "#80c0ff",
              );
        }),
      this.evm.update(0),
      j.setVolumes(it.data.settings.music, it.data.settings.sfx),
      (window.__run = this));
  }
  hud() {
    const T = this.scene.get("Hud");
    return T && T.scene.isActive() ? T : null;
  }
  currentRegion() {
    return je(Math.max(0, this.regionIdx));
  }
  get dist() {
    return Math.max(0, this.world.distAt(this.player.x));
  }
  diffAtPlayer() {
    return this.diffCache;
  }
  enemyDamageScale() {
    return this.diffCache.atkMult;
  }
  onChunkLoad(T) {
    const C = this.world.lx(T.index * vt),
      E = T.index * vt - me;
    for (const R of T.spawns) {
      if (this.killed.has(R.id)) continue;
      // 자연 지형은 생성기가 서 있을 자리를 검사해 두었다 (칸 격자는 근사라 쓰지 않는다)
      if (!se[R.enemy]?.flying && !T.fine) {
        const gx0 = T.index * vt + R.x;
        let room = !0;
        for (let k = 1; k <= 3; k++) this.world.solid(gx0, R.row - k) && (room = !1);
        if (!room || !this.world.standable(gx0, R.row)) continue;
      }
      const h = se[R.enemy],
        m = C + R.x * gt + 8 + (R.ox ?? 0),
        t = R.py != null ? R.py - 1 : R.row * gt,
        a = new Cs(this, R.enemy, m, (h.flying, t), Math.max(0, E + R.x), {
          spawnId: R.id,
          traits: R.traits,
          homeChunk: T.index,
          hpRatio: this.enemyHp.get(R.id),
          midBoss: R.mid,
          layer: R.layer,
          camp: R.camp,
        });
      R.mid && FG.makeMidBoss(this, a);
      this.enemies.push(a);
    }
    (T.arena && this.setupArena(T), this.evm.onChunkLoad(T));
  }
  onChunkUnload(T) {
    for (const C of this.enemies)
      C.dead ||
        C.opts.homeChunk !== T.index ||
        (C.opts.spawnId && this.enemyHp.set(C.opts.spawnId, C.hp / C.maxHp), C.remove());
    ((this.enemies = this.enemies.filter((C) => !C.removed)), this.evm.onChunkUnload(T));
    for (const [C, E] of this.gateSprites) Math.floor(C / vt) === T.index && (E.destroy(), this.gateSprites.delete(C));
  }
  arenaInfo(T) {
    const C = T.arena.part === 0 ? T.index : T.index - 1;
    return { a0: C, leftGate: C * vt + gi, rightGate: (C + 1) * vt + Es, trigger: C * vt + gi + 3 };
  }
  setupArena(T) {
    const C = this.arenaInfo(T);
    this.bossDefeated.has(C.a0) ||
      (T.arena.part === 1 && (this.world.gates.add(C.rightGate), this.makeGate(C.rightGate, !0)));
  }
  makeGate(T, C) {
    if (this.gateSprites.has(T)) return;
    const R = this.world.groundRowAt(T) * gt,
      h = this.add
        .sprite(this.world.lx(T), C ? R : R - 96, "gate", 0)
        .setOrigin(0, 1)
        .setDepth(7);
    (h.setData("gy", R), this.gateSprites.set(T, h));
  }
  checkArenaTrigger() {
    var i;
    if (this.boss || this.dying) return;
    const T = this.world.chunkOfLocal(this.player.x),
      C = this.world.gen.get(T);
    if (!C.arena) return;
    const E = this.arenaInfo(C);
    if (this.bossDefeated.has(E.a0) || this.world.gtx(this.player.x) < E.trigger) return;
    (this.world.gates.add(E.leftGate), this.makeGate(E.leftGate, !1));
    const h = this.gateSprites.get(E.leftGate);
    (this.tweens.add({ targets: h, y: h.getData("gy"), duration: 300, ease: "Bounce" }), this.fx.shake(3));
    const m = this.world.lx(E.leftGate + 1),
      t = this.world.lx(E.rightGate),
      a = this.world.groundRowAt(E.trigger) * gt,
      v = C.arena.boss;
    ((this.boss = new yr(this, v, t - 80, a, m, t, this.dist)),
      (this.boss.arenaChunk = E.a0),
      (this.arenaLock = { l: m, r: t }),
      (this.bossIntro = !0));
    for (const e of this.enemies) !e.dead && e.cx > m - 20 && e.cx < t + 20 && e.remove();
    this.enemies = this.enemies.filter((e) => !e.removed);
    const o = ji[v];
    j.play("bossRoar");
    const n = this.currentRegion();
    (j.playMusic(`boss_${v}`, { ...n.music, tempo: n.music.tempo + 24, boss: !0, wave: "sawtooth", seed: 7, region: n.src ?? n.id }),
      (i = this.hud()) == null || i.bossIntro(o.name, o.title),
      this.time.delayedCall(1700, () => {
        this.bossIntro = !1;
      }));
  }
  onBossKilled(T) {
    var m;
    FG.onBossKilled(this, T);
    const C = T.arenaChunk;
    this.bossDefeated.add(C);
    const E = C * vt + gi,
      R = (C + 1) * vt + Es;
    (this.world.gates.delete(E), this.world.gates.delete(R));
    for (const t of [E, R]) {
      const a = this.gateSprites.get(t);
      a && this.tweens.add({ targets: a, y: a.getData("gy") - 96, duration: 900, ease: "Sine.easeIn" });
    }
    (this.run.bosses++,
      this.run.bossIds.push(T.def.id),
      this.dropGold(T.cx, T.cy, T.def.gold * (1 + T.tier * 0.3), !0),
      (this.arenaLock = null),
      this.projectiles.clearEnemy(),
      (m = this.hud()) == null || m.banner("보스 처치!", `${T.def.name} 격파 · 체력 30% 회복 · 유물 획득`, "#ffd84a"),
      this.queueRelic(2.2),
      this.player.heal(this.player.maxHp * 0.3),
      j.play("record"),
      this.fx.stop(0.25),
      this.cameras.main.flash(300, 255, 240, 200));
    const h = this.currentRegion();
    (this.time.delayedCall(2500, () => {
      this.dying || j.playMusic(`region_${h.id}`, { ...h.music, region: h.look ?? h.src ?? h.id });
    }),
      this.time.delayedCall(1500, () => {
        var t;
        ((t = this.boss) == null || t.destroy(), (this.boss = null));
      }),
      it.checkpoint(this.run));
  }
  freeOldRegionTextures(T) {
    const C = new Set([T - 1, T, T + 1].filter((E) => E >= 0).map((E) => je(E).id));
    for (const E of this.world.loaded.values()) C.add(E.data.region.id);
    (this.bg && C.add(this.bg.region.id), this.oldBg && C.add(this.oldBg.region.id));
    // 아직 화면의 무언가가 쓰는 텍스처는 지우지 않는다 (지우면 다음 렌더에서 멈춘다)
    const used = new Set(), walk = (L) => { for (const o of L) (o.texture && used.add(o.texture.key), o.list && walk(o.list)); };
    for (const sc of this.game.scene.scenes) sc.sys.displayList && walk(sc.sys.displayList.list);
    for (let E = Math.max(0, T - 4); E < T - 1; E++) {
      const R = je(E).id;
      if (!C.has(R))
        for (const h of [`bg_${R}_sky`, `bg_${R}_0`, `bg_${R}_1`, `bg_${R}_2`, `tiles_${R}`])
          this.textures.exists(h) && !used.has(h) && this.textures.remove(h);
    }
  }
  updateRegion(T = !1) {
    var n, i;
    const C = this.dist,
      E = bs(C),
      R = je(E + 1);
    FG.foePreload(this, E), FG.foePreload(this, E + 1);
    if (
      (this.nextBgPreload !== E + 1 && R.start - C < 150 && ((this.nextBgPreload = E + 1), AiAsync(this, R), es(this, R)),
      E === this.regionIdx && !T)
    )
      return;
    ((this.regionIdx = E), this.freeOldRegionTextures(E));
    const h = je(E),
      // 빠진 층 그림(미리 그리기가 덜 끝났거나 지워짐)은 이 자리에서 그려 붙인다 — 빈 텍스처(초록 격자) 방지. 쓰는 중인 하늘은 건드리지 않는다
      m = ((k) => ([0, 1, 2].forEach((r) => this.textures.exists(`${k}_${r}`) || lt(this, `${k}_${r}`, On(h, r))), k))(Ai(this, h)),
      t = this.add
        .image(ot / 2, xt / 2, m + "_sky")
        .setScrollFactor(0)
        .setDepth(-100)
        .setAlpha(T ? 1 : 0),
      v = [0.1, 0.25, 0.45].map((e, r) =>
        this.add
          .tileSprite(ot / 2, xt / 2, ot, this.textures.get(`${m}_${r}`).getSourceImage().height, `${m}_${r}`)
          .setOrigin(0.5, xt / 2 / this.textures.get(`${m}_${r}`).getSourceImage().height)
          .setScrollFactor(0)
          .setDepth(-99 + r)
          .setAlpha(T ? 1 : 0)
          .setData("f", e),
      );
    if (
      (this.oldBg && (this.oldBg.layers.forEach((e) => e.destroy()), this.oldBg.sky.destroy()),
      (this.oldBg = this.bg),
      (this.bg = { layers: v, sky: t, region: h }),
      T)
    )
      this.time.delayedCall(300, () => {
        var e;
        return FG.zoned || (e = this.hud()) == null ? void 0 : e.regionBanner(h.name, h.sub);
      });
    else {
      if ((this.tweens.add({ targets: [t, ...v], alpha: 1, duration: 1500 }), this.oldBg)) {
        const e = this.oldBg;
        this.tweens.add({
          targets: [e.sky, ...e.layers],
          alpha: 0,
          duration: 1500,
          onComplete: () => {
            (e.layers.forEach((r) => r.destroy()), e.sky.destroy(), this.oldBg === e && (this.oldBg = null));
          },
        });
      }
      (FG.zoned || (n = this.hud()) == null || n.regionBanner(h.name, h.sub), FG.zoned || this.cameras.main.flash(400, 255, 255, 255, !1));
    }
    (this.boss || j.playMusic(`region_${h.id}`, { ...h.music, region: h.look ?? h.src ?? h.id }),
      (i = this.ambient) == null || i.destroy(),
      (this.ambient = this.makeAmbient(h)),
      FG.regionFx(this, h));
    const o = h.theme ?? h.id;
    this.tweens.add({
      targets: this.vignette,
      alpha: o === "cave" || o === "abyss" ? 0.85 : o === "forest" ? 0.55 : 0.25,
      duration: 1200,
    });
  }
  makeAmbient(T) {
    const C = T.pal,
      E = {
        pollen: {
          x: { min: 0, max: ot },
          y: { min: 0, max: xt },
          speedX: { min: -10, max: 10 },
          speedY: { min: -8, max: 4 },
          lifespan: 4e3,
          frequency: 160,
          alpha: { start: 0.8, end: 0 },
          tint: C.accent,
        },
        spores: {
          x: { min: 0, max: ot },
          y: xt + 4,
          speedY: { min: -30, max: -10 },
          speedX: { min: -10, max: 10 },
          lifespan: 6e3,
          frequency: 120,
          alpha: { start: 0.9, end: 0 },
          tint: C.accent,
          blendMode: "ADD",
        },
        drips: {
          x: { min: 0, max: ot },
          y: -4,
          speedY: { min: 120, max: 200 },
          lifespan: 2500,
          frequency: 180,
          alpha: { start: 0.7, end: 0.3 },
          tint: 8438015,
        },
        sand: {
          x: -6,
          y: { min: 0, max: xt },
          speedX: { min: 180, max: 320 },
          speedY: { min: -10, max: 20 },
          lifespan: 3e3,
          frequency: 40,
          alpha: { start: 0.6, end: 0 },
          tint: 15255696,
        },
        snow: {
          x: { min: -100, max: ot },
          y: -6,
          speedX: { min: 10, max: 60 },
          speedY: { min: 30, max: 70 },
          lifespan: 8e3,
          frequency: 50,
          alpha: { start: 0.9, end: 0.6 },
          tint: 16777215,
        },
        embers: {
          x: { min: 0, max: ot },
          y: xt + 4,
          speedY: { min: -60, max: -20 },
          speedX: { min: -20, max: 20 },
          lifespan: 5e3,
          frequency: 90,
          alpha: { start: 1, end: 0 },
          tint: 16744496,
          blendMode: "ADD",
        },
        motes: {
          x: { min: 0, max: ot },
          y: { min: 0, max: xt },
          speedX: { min: -12, max: 12 },
          speedY: { min: -12, max: 12 },
          lifespan: 5e3,
          frequency: 110,
          alpha: { start: 0, end: 0.9 },
          tint: C.accent,
          blendMode: "ADD",
        },
        sparkles: {
          x: { min: 0, max: ot },
          y: { min: 0, max: xt },
          speedY: { min: -6, max: 6 },
          lifespan: 2e3,
          frequency: 90,
          alpha: { start: 1, end: 0 },
          scale: { start: 1.5, end: 0 },
          tint: C.accent,
          blendMode: "ADD",
        },
        ash: {
          x: { min: -100, max: ot },
          y: -6,
          speedX: { min: 8, max: 40 },
          speedY: { min: 16, max: 42 },
          lifespan: 9e3,
          frequency: 40,
          alpha: { start: 0.85, end: 0.35 },
          tint: 12105912,
        },
        fireflies: {
          x: { min: 0, max: ot },
          y: { min: 40, max: xt },
          speedX: { min: -14, max: 14 },
          speedY: { min: -14, max: 8 },
          lifespan: 4e3,
          frequency: 130,
          alpha: { start: 0, end: 1 },
          tint: C.accent,
          blendMode: "ADD",
        },
        glass: {
          x: -6,
          y: { min: 0, max: xt },
          speedX: { min: 160, max: 300 },
          speedY: { min: -10, max: 20 },
          lifespan: 3e3,
          frequency: 55,
          alpha: { start: 0.9, end: 0 },
          tint: 12646655,
          blendMode: "ADD",
        },
        sparks: {
          x: { min: 0, max: ot },
          y: { min: 0, max: xt },
          speedX: { min: -50, max: 50 },
          speedY: { min: -50, max: 50 },
          lifespan: 500,
          frequency: 60,
          alpha: { start: 1, end: 0 },
          scale: { start: 1.4, end: 0 },
          tint: C.accent,
          blendMode: "ADD",
        },
        clouds: {
          x: ot + 30,
          y: { min: 0, max: xt * 0.8 },
          speedX: { min: -60, max: -25 },
          lifespan: 2e4,
          frequency: 900,
          alpha: { start: 0.1, end: 0.1 },
          scale: { start: 10, end: 12 },
          tint: 16774120,
        },
      },
      R = E[T.particle] ?? E.pollen,
      h =
        T.particle === "snow" || T.particle === "ash"
          ? "flake"
          : T.particle === "sparkles" || T.particle === "sparks" || T.particle === "glass"
            ? "spark"
            : T.particle === "pollen"
              ? "px1"
              : T.particle === "spores" || T.particle === "motes" || T.particle === "embers" || T.particle === "fireflies" || T.particle === "clouds"
                ? "soft"
                : "px1",
      m = this.add.particles(0, 0, h, {
        ...R,
        maxAliveParticles: 120,
        scale: R.scale ?? (h === "soft" ? { start: 0.6, end: 0.2 } : 1),
      });
    return (m.setScrollFactor(0).setDepth(T.particle === "sand" || T.particle === "snow" || T.particle === "ash" || T.particle === "glass" ? 50 : -50), m);
  }
  weatherOverlay(T, C, E) {
    (this.weather.setFillStyle(T, 1).setAlpha(0),
      this.tweens.add({ targets: this.weather, alpha: C, duration: 400, yoyo: !0, hold: E * 1e3 - 800 }));
  }
  targets() {
    const T = [];
    for (const C of this.enemies) !C.dead && !C.invulnerable() && T.push(C);
    this.boss && !this.boss.dead && !this.boss.invulnerable() && T.push(this.boss);
    for (const C of this.evm.hittables) C.dead || T.push(C);
    return T;
  }
  hitTarget(T, C) {
    var r, l;
    if (T.dead || ((r = T.invulnerable) != null && r.call(T))) return 0;
    const E = this.player,
      R = E.stats;
    if (T.kind === "object") return T.receive(C.dmg, !1, C);
    const h = nr(T);
    C.source !== "dot" && C.source !== "proc" && (this.lastHitWeapon = C.weaponId);
    let m = C.dmg,
      t = !1;
    if (!C.noCrit) {
      let s = E.critChance(C.critBonus ?? 0);
      (C.weaponId === "crossbow" && E.weapons.level >= 6 && T.hp / T.maxHp > 0.7 && (s += 0.15),
        E.buffVal("critNext") > 0 && ((s = 1), E.buffs.delete("critNext")),
        Math.random() < s &&
          ((t = !0), (m *= R.critDamage + (C.weaponId ? E.weapons.mods.critDamage : 0) + E.run.critDmgAdd)));
    }
    (C.skillId === "fireburst" && R.synergies.has("pyro") && T.statuses.has("burn") && (m *= 1.5),
      R.synergies.has("shatter") &&
        (C.weaponId === "hammer" || C.weaponId === "greatsword") &&
        (T.statuses.has("chill") || T.statuses.has("freeze")) &&
        (m *= 1.35));
    const a = E.run;
    (a.executePct > 0 && T.hp / T.maxHp < 0.3 && (m *= 1 + a.executePct),
      a.bigDmgPct > 0 && (T.kind === "boss" || T.isElite) && (m *= 1 + a.bigDmgPct),
      a.frostBonus > 0 && (T.statuses.has("chill") || T.statuses.has("freeze")) && (m *= 1 + a.frostBonus),
      a.airDmg > 0 && !E.body.onGround && (m *= 1 + a.airDmg));
    const v = C.frTrue ? 0 : Math.max(0, T.defense());
    m *= 100 / (100 + v);
    m *= FG.dmgTakenMult(T);
    T.def && C.element && (T.def.weak === C.element ? (m *= 1.3) : T.def.resist === C.element && (m *= 0.7));
    let o = !1;
    ((l = T.blocks) != null && l.call(T, C) && ((m *= 0.15), (o = !0)), (m = Math.max(1, Math.round(m))));
    const n = T.receive(m, t, { ...C, knock: o ? C.knock * 0.2 : C.knock, stagger: o ? 0 : C.stagger });
    ((this.run.dmgDealt = (this.run.dmgDealt ?? 0) + n),
      n > (this.run.maxHit ?? 0) && (this.run.maxHit = n),
      C.status && !o && T.statuses.apply(C.status, C.dmg),
      !o && FG.onHit(this, T, C, n),
      !o && (C.source === "weapon" || C.source === "special") && this.procs(T, C),
      t &&
        C.source !== "proc" &&
        (a.critHeal > 0 && E.heal(E.maxHp * a.critHeal, !1),
        a.smite > 0 && Math.random() < a.smite && this.effects.smite(T)),
      !o && !C.noReact && C.source !== "dot" && this.react(T, C, h, t, n));
    const i = o ? "#a0a0a0" : t ? "#ffd84a" : (Yn[C.element] ?? "#ffffff");
    if (
      (this.fx.number(T.body.x, T.body.y - T.body.h - 2, o ? `${n}` : t ? `${n}!` : `${n}`, i, t),
      o
        ? (j.play("block"),
          this.fx.burst("spark", T.body.x - (C.dir * T.body.w) / 2, T.body.y - T.body.h / 2, 6, 13687039))
        : (j.play(t ? "crit" : "hit", C.heavy ? 1.3 : 1),
          this.fx.anim("hitspark", T.body.x - C.dir * 3, T.body.y - T.body.h / 2, {
            scale: t ? 1.6 : 1,
            tint: t ? 16769120 : void 0,
          }),
          this.fx.burst("spark", T.body.x, T.body.y - T.body.h / 2, t ? 10 : 5, t ? 16769120 : 16777215)),
      (C.source === "weapon" || C.source === "special") &&
        this.fx.stop(t ? de.hitstopCrit : C.heavy ? de.hitstopHeavy : de.hitstopBase),
      C.shake && this.fx.shake(C.shake),
      t && R.armorId === "abyss")
    ) {
      const s = 34 * (R.armorPerk5 ? 1.5 : 1);
      this.fx.anim("ring", T.body.x, T.body.y - T.body.h / 2, { scale: s / 26, tint: 11559167 });
      for (const u of this.targets())
        u !== T &&
          Math.hypot(u.body.x - T.body.x, u.body.y - T.body.y) < s &&
          (u.receive(Math.round(n * 0.4), !1, { ...C, knock: 50, stagger: 0.1 }),
          this.fx.number(u.body.x, u.body.y - u.body.h, `${Math.round(n * 0.4)}`, "#d090ff"));
    }
    let e =
      R.lifesteal + a.lifesteal + (E.weapons.mods.lifesteal && C.weaponId === "scythe" ? E.weapons.mods.lifesteal : 0);
    return (
      C.weaponId === "scythe" && this.evo("scythe") && (e += 0.06),
      (e += E.buffVal("berserkLs")),
      R.armorId === "vampire" && R.armorPerk10 && E.hp < E.maxHp * 0.3 && (e *= 2),
      R.synergies.has("bloodlust") && E.buffVal("berserk") > 0 && (e += 0.05),
      e > 0 && C.source !== "dot" && E.heal(n * e, !1),
      C.skillId && E.skills.onSkillHit(C.skillId),
      n
    );
  }
  procs(T, C) {
    const E = this.player.run,
      R = (a) => a > 0 && Math.random() < a;
    (R(E.burn) && T.statuses.apply({ type: "burn", chance: 1, dur: 3, power: 0.25 }, C.dmg),
      R(E.frost) && T.statuses.apply({ type: "chill", chance: 1, dur: 2, power: 0.4 }, 0),
      R(E.poison) && T.statuses.apply({ type: "poison", chance: 1, dur: 3.5, power: 0.2 }, C.dmg),
      R(E.bleed) && T.statuses.apply({ type: "bleed", chance: 1, dur: 3, power: 0.22 }, C.dmg),
      R(E.chain) && this.effects.chainLightning(T, Math.max(2, E.chainJumps)));
    const h = C.weaponId;
    if (!h || !this.evo(h)) return;
    const m = this.player,
      t = m.stats.atk * m.atkMult() * m.stats.dmgMult;
    if (
      (h === "greatsword" &&
        R(0.35) &&
        (this.fx.anim("fx_smash", T.body.x, T.body.y - 12, { scale: 1.6, tint: 16744544 }),
        this.fx.burst("chunk", T.body.x, T.body.y - 2, 12, 11049080),
        this.fx.shake(3),
        this.effects.aoe(T.body.x, T.body.y - 8, 56, t * 1.2, "phys", { knock: 220, knockUp: 160, stagger: 0.5 })),
      h === "dual" && R(0.5) && T.statuses.apply({ type: "bleed", chance: 1, dur: 3, power: 0.22 }, C.dmg),
      h === "staff" && (T.statuses.apply({ type: "burn", chance: 1, dur: 3, power: 0.3 }, C.dmg), R(0.5)))
    ) {
      const a = T.body.x,
        v = T.body.y - T.body.h / 2;
      (this.fx.anim("explode", a, v, { scale: 1.4, tint: 16752704 }),
        this.effects.aoe(a, v, 44, t * 0.8, "fire", { knock: 140 }));
    }
    h === "hammer" &&
      R(0.4) &&
      (this.effects.chainLightning(T, 4), T.statuses.apply({ type: "stun", chance: 1, dur: 0.4 }, 0));
  }
  react(T, C, E, R, h) {
    const m = this.time.now,
      t = this.player.run,
      a = 900 / (1 + t.reactPct * 0.5);
    if (m - (this.reactCd.get(T) ?? -1e9) < a) return;
    const v = rr(T, C, E, R);
    if (!v) return;
    (this.reactCd.set(T, m), (this.run.reactions = (this.run.reactions ?? 0) + 1));
    const o = Zs[v],
      n = this.player,
      i = n.stats.atk * n.atkMult() * n.stats.dmgMult * (1 + t.reactPct),
      e = T.body.x,
      r = T.body.y - T.body.h / 2;
    (this.fx.text(e, T.body.y - T.body.h - 16, `${o.name}!`, o.text), this.fx.burst("glow", e, r, 16, o.color));
    const l = { noReact: !0 };
    switch (v) {
      case "steam":
        (T.statuses.clear("burn"),
          T.statuses.clear("chill"),
          this.fx.anim("explode", e, r, { scale: 2, tint: 15267071 }),
          this.fx.burst("dust", e, r, 14, 16777215),
          j.play("explosion", 0.8),
          this.effects.aoe(e, r, 52, i * 1.6, "fire", { ...l, knock: 220, stagger: 0.4 }));
        break;
      case "overload":
        (T.statuses.clear("burn"),
          this.fx.anim("explode", e, r, { scale: 1.8, tint: 16756800, blend: !0 }),
          this.fx.shake(3),
          j.play("explosion"),
          this.effects.aoe(e, r, 46, i * 1.5, "fire", { ...l, knock: 320, knockUp: 180, stagger: 0.5 }));
        break;
      case "superconduct":
        (T.statuses.apply({ type: "armorBreak", chance: 1, dur: 5, power: 0.5 }, 0),
          this.fx.anim("iceburst", e, r, { scale: 0.8, tint: 10535167 }),
          j.play("lightning", 0.7),
          this.hitTarget(T, {
            dmg: i * 1,
            element: "lightning",
            knock: 60,
            stagger: 0.3,
            dir: C.dir,
            source: "proc",
            noCrit: !0,
            pierceShield: !0,
            ...l,
          }));
        break;
      case "corrode": {
        const s = T.statuses.get("poison"),
          u = s ? s.power * s.stacks * Math.max(0, s.t) * 2 : 0;
        (T.statuses.clear("poison"),
          this.fx.anim("explode", e, r, { scale: 1.5, tint: 10551104 }),
          j.play("explosion", 0.6));
        for (const d of this.targets())
          d.dead ||
            d === T ||
            Math.hypot(d.body.x - e, d.body.y - T.body.y) > 60 ||
            d.statuses.apply({ type: "poison", chance: 1, dur: 3.5, power: 0.25 }, i);
        this.effects.aoe(e, r, 40, i * 0.8 + u, "poison", { ...l, knock: 80 });
        break;
      }
      case "shatter":
        (T.statuses.clear("freeze"),
          this.fx.anim("iceburst", e, r, { scale: 1.4 }),
          this.fx.burst("chunk", e, r, 14, 12644607),
          j.play("ice"),
          this.fx.shake(3),
          this.hitTarget(T, {
            dmg: Math.max(h, i) * 0.9,
            element: "ice",
            knock: 200,
            stagger: 0.6,
            dir: C.dir,
            source: "proc",
            noCrit: !0,
            pierceShield: !0,
            ...l,
          }));
        break;
      case "hemorrhage":
        (T.statuses.clear("bleed"),
          this.fx.burst("spark", e, r, 20, 16724032),
          this.fx.anim("fx_heavy", e, r, { tint: 16724032, scale: 1.3 }),
          j.play("crit"),
          n.heal(n.maxHp * 0.02, !1),
          this.hitTarget(T, {
            dmg: i * 2.2,
            element: "phys",
            knock: 120,
            stagger: 0.4,
            dir: C.dir,
            source: "proc",
            noCrit: !0,
            pierceShield: !0,
            ...l,
          }));
        break;
    }
  }
  onPlayerDash() {
    const T = this.player.run.dashNova;
    T > 0 && this.effects.dashNova(T);
  }
  gainXp(T) {
    var E;
    if (this.build.addXp(T) > 0) {
      const R = this.player;
      ((E = this.hud()) == null || E.levelUpFx(this.build.level),
        j.play("levelup"),
        R.heal(R.maxHp * 0.08, !1),
        this.fx.burst("rise", R.cx, R.cy, 18, 8442111),
        this.fx.anim("ring", R.cx, R.cy, { scale: 1.4, tint: 8442111, blend: !0 }),
        (this.levelDelay = Math.max(this.levelDelay, 0.35)));
    }
  }
  takePerk(T) {
    var m;
    const C = this.player,
      E = Ee[T];
    if (!E) return;
    const R = C.maxHp;
    this.build.acquire(T);
    const h = C.maxHp;
    (h > R && (C.hp += h - R),
      (C.hp = Math.min(C.hp, C.maxHp)),
      C.skills.refresh(),
      E.id.startsWith("fro_") || (m = this.hud()) == null || m.toast(`${E.relic ? "유물" : "각성"} 획득: ${E.name}`, ki[E.rarity]),
      this.fx.burst("glow", C.cx, C.cy, 16, E.color));
  }
  queueRelic(T = 0.6) {
    (this.relicQueue++, (this.levelDelay = Math.max(this.levelDelay, T)));
  }
  tryOpenChoices(T) {
    if (this.levelDelay > 0) {
      this.levelDelay -= T;
      return;
    }
    const C = this.hud();
    if (!(!C || this.bossIntro || this.player.dead || this.dying)) {
      if (this.relicQueue > 0) {
        const E = this.build.offerRelics(3);
        if (!E.length) {
          this.relicQueue = 0;
          return;
        }
        C.cards("보스 전리품", "하나를 골라 가방에 넣습니다", E, (R) => {
          (this.takePerk(R), (this.levelDelay = 0.3));
        }) && this.relicQueue--;
        return;
      }
      if (this.build.pending > 0 && this.fr) {
        const n = this.build.pending;
        this.build.pending = 0;
        FG.levelPoints(this, n);
        return;
      }
      if (this.build.pending > 0) {
        const E = this.build.offerLevel();
        if (!E.length) {
          this.build.pending = 0;
          return;
        }
        const R = this.build.level - this.build.pending + 1;
        C.cards(
          `레벨 ${R}`,
          `아이템을 하나 고르세요  ·  다시 뽑기 ${this.build.rerolls}회 남음`,
          E,
          (h) => {
            (this.build.pending--, this.takePerk(h), (this.levelDelay = 0.25));
          },
          () => (this.build.rerolls <= 0 ? null : (this.build.rerolls--, this.build.offerLevel())),
        );
      }
    }
  }
  openShop(T) {
    const C = this.hud();
    if (!C) return;
    const E = this.dist / 1e3,
      R = { common: 70, rare: 120, epic: 200, legendary: 320 };
    T.stock ||
      (T.stock = this.build
        .offerShop()
        .map((v) => ({
          id: v.def.id,
          price: Math.round(((v.def.relic ? 240 : R[v.def.rarity]) * (1 + E * 0.35)) / 5) * 5,
        })));
    const h = () => Math.floor(this.run.gold),
      m = [];
    for (const v of T.stock) {
      if (v.sold) continue;
      const o = Ee[v.id];
      if (!o) continue;
      const n = this.build.stacks(v.id),
        i = n >= o.max;
      m.push({
        label: `${o.name}  ·  ${yt(v.price)}G`,
        desc: `${Ks[o.rarity]} ${o.relic ? "유물" : "각성"} — ${i ? "이미 최대" : o.desc(n + 1)}`,
        icon: `perk_${o.icon}`,
        tint: o.color,
        enabled: !i && h() >= v.price,
        cb: () => {
          ((this.run.gold -= v.price), (v.sold = !0), this.takePerk(v.id), j.play("buy"));
        },
      });
    }
    const t = Math.round((45 * (1 + E * 0.3)) / 5) * 5,
      a = this.player;
    (m.push({
      label: `치유의 물약  ·  ${yt(t)}G`,
      desc: T.healUsed ? "품절" : "체력 50% 회복, 상태 이상 해제",
      icon: "icon_heart",
      enabled: !T.healUsed && a.hp < a.maxHp && h() >= t,
      cb: () => {
        ((this.run.gold -= t), (T.healUsed = !0), a.heal(a.maxHp * 0.5), a.statuses.clear(), j.play("heal"));
      },
    }),
      m.push({ label: "그냥 지나간다", desc: "", cb: () => {} }),
      C.choice("방랑 상인", `탐험 골드 ${yt(h())}G  ·  쓴 골드는 정산되지 않습니다`, m));
  }
  hurtPlayer(T) {
    if (this.dying) return;
    const C = this.player.hp;
    (this.player.hurt(T), this.recordDamageTaken(C - this.player.hp));
  }
  recordDamageTaken(T) {
    T <= 0 ||
      ((this.run.dmgTaken = (this.run.dmgTaken ?? 0) + T),
      (this.run.cleanDist ?? -1) < 0 && (this.run.cleanDist = Math.floor(this.maxDist)));
  }
  spawnEnemy(T, C, E, R) {
    if (this.enemies.length > 60) return null;
    // 지운 옛 몬스터(보스가 부르는 졸개 등)는 지금 구역의 몬스터로 바꿔 부른다
    (se[T] && FG.foeReady(T)) || (T = FG.foeAlias(this, T, C, E));
    if (!T || !se[T]) return null;
    const h = new Cs(this, T, C, E, this.dist, R);
    return (this.enemies.push(h), h);
  }
  onEnemyKilled(T) {
    var t;
    FG.onKill(this, T);
    T.opts.spawnId && this.killed.add(T.opts.spawnId);
    const C = T.opts.summoned ? 1 : this.build.onKill(),
      E =
        T.def.ai === "golden"
          ? 40
          : (3 + T.def.hp / 12) * (T.isElite ? (T.rare ? 6 : 3) : 1) * (T.opts.summoned ? 0.3 : 1);
    this.gainXp(E * C);
    const R = this.player.run;
    if (
      (R.killHeal > 0 && this.player.heal(this.player.maxHp * R.killHeal, !1),
      this.lastHitWeapon === "scythe" &&
        this.evo("scythe") &&
        (this.player.heal(this.player.maxHp * 0.03, !1),
        this.player.addFrenzy(),
        this.player.addFrenzy(),
        this.fx.burst("rise", T.cx, T.cy, 10, 11563263)),
      R.killExplode > 0)
    ) {
      const a = T.cx,
        v = T.cy;
      this.time.delayedCall(70, () => {
        this.dying || this.effects.explode(a, v, R.killExplode);
      });
    }
    (this.player.addFrenzy(), T.opts.summoned || (this.run.kills++, T.isElite && this.run.elites++, ((this.run.codex = this.run.codex ?? {})[T.def.id] = (this.run.codex[T.def.id] ?? 0) + 1)));
    const h = this.player.stats;
    if (
      (h.killHealPct > 0 && this.player.heal(this.player.maxHp * h.killHealPct, !1),
      h.armorId === "abyss" && h.armorPerk10 && this.player.buff("speed", 2, 0.25, "speed", "심연의 질주"),
      this.player.buffVal("berserk") > 0 && (it.data.skills.berserk ?? 1) >= 5)
    ) {
      const a = this.player.buffs.get("berserk");
      a && (a.t += 1);
    }
    let m = Math.max(T.def.gold, 0.13 * T.def.hp + 0.4 * T.def.atk);
    (T.def.ai === "golden" &&
      ((m = 60 + this.dist / 25),
      (t = this.hud()) == null || t.toast("황금 고블린 처치! 대량의 골드!", "#ffd84a"),
      j.play("coinBig")),
      T.isElite && (m *= T.rare ? Ri.rareEliteGoldMult : Ri.eliteGoldMult),
      (m *= C),
      T.opts.noGold || this.dropGold(T.cx, T.cy, m * (0.85 + Math.random() * 0.3)),
      !T.opts.summoned && Math.random() < (T.isElite ? 0.3 : 0.04) && this.gold.dropHeart(T.cx, T.cy));
  }
  dropGold(T, C, E, R = !1) {
    const h = E * this.diffCache.goldMult * 0.3;
    this.gold.drop(T, C, h, R ? 1.6 : 1);
  }
  addGold(T) {
    var R;
    const C = this.player.stats,
      E = T * C.goldGain * (1 + this.player.run.goldMult);
    ((this.run.gold += E), (R = this.hud()) == null || R.goldPulse());
  }
  surfaceYAt(T) {
    return this.world.groundYAt(this.world.gtx(T));
  }
  computeNextMilestone() {
    const T = new Set(it.data.claimed);
    this.nextMs = null;
    for (const C of oi)
      if (!T.has(C.dist)) {
        this.nextMs = C;
        return;
      }
    for (let C = 18e3; C < 1e7; C += 2e3)
      if (!T.has(C)) {
        this.nextMs = zs(C);
        return;
      }
  }
  nextMilestone() {
    return this.nextMs;
  }
  checkRecords() {
    if (FG.zoned) return;
    var C, E;
    const T = this.maxDist;
    for (; this.nextMs && T >= this.nextMs.dist;) {
      const R = this.nextMs;
      if (it.claimMilestone(this.run, R.dist, R.gold, R.unlocks ?? [], R.title)) {
        const h = (R.unlocks ?? []).map((m) => Ys[m] ?? m).join(", ");
        ((C = this.hud()) == null ||
          C.banner(
            `${yt(R.dist)}m 최초 도달!`,
            `기록 보상 +${yt(R.gold)} 골드 (귀환 시 정산)${h ? ` · 해금: ${h}` : ""}${R.title ? ` · 칭호 「${R.title}」` : ""}`,
            "#7be36a",
          ),
          j.play("levelup"));
      }
      this.computeNextMilestone();
    }
    !this.recordShown &&
      this.run.prevBest > 0 &&
      T > this.run.prevBest &&
      ((this.recordShown = !0),
      (E = this.hud()) == null || E.newRecord(),
      j.play("record"),
      this.cameras.main.flash(250, 255, 230, 120),
      this.fx.burst("glow", this.player.cx, this.player.cy, 30, 16764992));
  }
  placeRecordFlag() {
    const T = me + Math.floor(this.run.prevBest),
      C = this.world.lx(T) + 8,
      E = this.world.groundRowAt(T);
    (this.recordFlag.setPosition(C, E > 0 ? E * gt : Oe).setVisible(!0), this.recordFlag.setData("gx", T));
  }
  readInput() {
    const T = this.keys,
      C = this.input.activePointer,
      E = this.cameras.main,
      R = zt.Input.Keyboard.JustDown,
      h = this.inp;
    ((h.left = T.A.isDown || T.LEFT.isDown),
      (h.right = T.D.isDown || T.RIGHT.isDown),
      (h.down = T.S.isDown),
      (h.up = T.W.isDown || (T.UP ? T.UP.isDown : !1)),
      (h.jump = R(T.SPACE) || R(T.W)),
      (h.jumpHeld = T.SPACE.isDown || T.W.isDown),
      (h.dash = R(T.SHIFT)));
    const m = C.positionToCamera(E);
    ((h.aimX = m.x), (h.aimY = m.y));
    let t = C.leftButtonDown() || TOUCH.attack,
      a = C.rightButtonDown();
    (this.mouseLock && (!t && !a && (this.mouseLock = !1), (t = !1), (a = !1)),
      (h.attackHeld = FG.chargeInput(this, t)),
      (h.attack = !1),
      (h.special = a && !this._rmbHeld),
      (this._rmbHeld = a),
      (h.swap = R(T.ONE) ? 0 : R(T.TWO) ? 1 : -1));
    const G = FG.guard(this, T.DOWN.isDown || (T.S.isDown && !T.SPACE.isDown), R(T.DOWN));
    G && ((h.attackHeld = !1), (h.special = !1), (h.dash = !1));
    let v = R(T.E);
    ((h.interact = !1), (h.skills = [R(T.Q), !1, R(T.R), R(T.F)]));
    // 가방이 열려 있으면 걷기·점프만 (알비온식: 게임은 멈추지 않는다)
    FG.bagBlocks(this) && ((h.attackHeld = !1), (h.special = !1), (h.skills = [!1, !1, !1, !1]), (v = !1));
    const o = this.pad;
    if (
      (o.poll(),
      o.connected &&
        (h.left || (h.left = o.axis.x < -0.35),
        h.right || (h.right = o.axis.x > 0.35),
        h.down || (h.down = o.axis.y > 0.6),
        h.up || (h.up = o.axis.y < -0.6),
        h.jump || (h.jump = o.justDown(Mt.A)),
        h.jumpHeld || (h.jumpHeld = o.down(Mt.A)),
        h.dash || (h.dash = o.justDown(Mt.B)),
        h.attackHeld || (h.attackHeld = o.down(Mt.X)),
        h.special || (h.special = o.justDown(Mt.Y)),
        o.justDown(Mt.UP) && (h.swap = this.player.weapons.slot === 0 ? 1 : 0),
        o.justDown(Mt.LB) && (h.skills[0] = !0),
        o.justDown(Mt.LT) && (h.skills[2] = !0),
        o.justDown(Mt.RT) && (h.skills[3] = !0),
        o.justDown(Mt.RB) && (v = !0),
        o.justDown(Mt.START) && (this.pauseReq = !0),
        o.preferred(this.mouseT.t)))
    ) {
      const n = this.player,
        i = n.body.y - 14;
      if (o.aim.x || o.aim.y) ((h.aimX = n.cx + o.aim.x * 120), (h.aimY = i + o.aim.y * 120));
      else {
        const e = h.left ? -1 : h.right ? 1 : n.facing;
        ((h.aimX = n.cx + e * 120), (h.aimY = i));
      }
    }
    v && (this.evm.nearest ? (h.interact = !0) : (h.skills[1] = !0));
  }
  update(T, C) {
    var a, v, o;
    if (this.cleaned) return;
    // 로딩 중(입력 잠금)에는 일시정지를 열지 않는다 — Alt+Tab 자동 일시정지가 잠긴 로딩 화면 뒤에 열려 게임이 멈추던 문제
    if (this.pauseReq && (this.frLoad || this.frInputLocked)) this.pauseReq = !1;
    if (this.pauseReq && ((this.pauseReq = !1), !this.dying)) {
      (a = this.hud()) == null || a.openPause();
      return;
    }
    let E = Math.min(0.05, C / 1e3) * this.timeScale;
    // 구역을 불러오는 동안: 로딩 화면만 움직이고 게임은 멈춘다
    if (FG.loadGate(this, Math.min(0.05, C / 1e3))) return;
    if (
      (it.tick(performance.now()),
      this.readInput(),
      this.inp.interact && (this.evm.interact(), j.play("click")),
      this.fx.hitstop > 0)
    ) {
      ((this.fx.hitstop -= E), this.fx.update(E * 0.3));
      return;
    }
    ((this.run.time += E), (this.diffCache = ni(this.dist)));
    const R = this.player;
    ((R.surface.ice = this.surfaceFlags.ice),
      (R.surface.quicksand = this.surfaceFlags.quicksand),
      (this.surfaceFlags.ice = !1),
      (this.surfaceFlags.quicksand = !1));
    const h = R.buffVal("regen");
    if (h > 0 && ((R.regenAcc += R.maxHp * h * E), R.regenAcc >= 1)) {
      const n = Math.floor(R.regenAcc);
      ((R.regenAcc -= n), R.heal(n, !1));
    }
    (R.update(E, this.dying ? Hi() : this.inp),
      FG.unstick(this.world, R.body),
      !R.dead && R.body.y > Oe + 40 && this.pitFall(),
      this.world.update(R.x),
      this.world.updateCrumbles(E, R.body));
    const m = this.world.maybeRebase(R.x);
    m !== 0 && this.rebase(m);
    for (const n of this.enemies)
      n.dead ||
        (Math.abs(n.cx - R.x) > 760 && !n.aggro) ||
        (n.update(E), n.dead || FG.unstick(this.world, n.body), n.opts.homeChunk === void 0 && !n.dead && Math.abs(n.cx - R.x) > 1100 && n.remove());
    if (
      (this.enemies.length > 0 && Math.random() < 0.1 && (this.enemies = this.enemies.filter((n) => !n.removed)),
      (v = this.boss) == null || v.update(E),
      this.projectiles.update(E),
      this.gold.update(E, R.cx, R.body.y),
      this.evm.update(E),
      this.fx.update(E),
      this.build.update(E),
      this.effects.update(E),
      FG.update(this, E),
      R.run.regen > 0 && !R.dead && ((R.regenAcc += R.maxHp * R.run.regen * E), R.regenAcc >= 1))
    ) {
      const n = Math.floor(R.regenAcc);
      ((R.regenAcc -= n), R.heal(n, !1));
    }
    if ((this.tryOpenChoices(E), FG.maybeRest(this), !R.dead)) {
      const n = this.dist;
      (n > this.maxDist && ((this.maxDist = n), (this.run.distance = Math.floor(n)), this.checkRecords()),
        this.updateRegion(),
        this.checkArenaTrigger());
    }
    const t = this.evm.nearest;
    (t && !R.dead
      ? (this.prompt
          .setText(t.prompt ?? "")
          .setPosition(t.x - this.prompt.width / 2 + 8, t.y - 46)
          .setVisible(!0),
        this.promptKey.setPosition(this.prompt.x - 9, t.y - 46).setVisible(!0),
        this.promptKeyText ||
          (this.promptKeyText = this.add
            .text(0, 0, "E", { fontFamily: ii, fontSize: "10px", color: "#302830" })
            .setOrigin(0.5)
            .setDepth(71)),
        this.promptKeyText.setPosition(this.promptKey.x, this.promptKey.y - 1).setVisible(!0))
      : (this.prompt.setVisible(!1),
        this.promptKey.setVisible(!1),
        (o = this.promptKeyText) == null || o.setVisible(!1)),
      this.updateCamera(E),
      this.updateParallax(),
      (this.checkpointT -= E),
      this.checkpointT <= 0 &&
        ((this.checkpointT = 3),
        (this.run.distance = Math.floor(this.maxDist)),
        this.snapBuild(),
        it.checkpoint(this.run)),
      R.dead && !this.dying && this.beginDeath());
  }
  snapBuild() {
    ((this.run.level = this.build.level),
      (this.run.relics = [...this.build.relics]),
      (this.run.perks = this.build.order.length),
      (this.run.bestStreak = this.build.bestStreak),
      (this.run.evolved = this.player.run.evo.filter((T) => T.startsWith("evo_"))),
      FG.snapFound(this));
  }
  pitFall() {
    var R;
    const T = this.player,
      C = Math.round(T.maxHp * de.pitDamage);
    if (((T.hp -= C), this.recordDamageTaken(C), this.fx.shake(4), j.play("playerHurt"), T.hp <= 0)) {
      ((T.hp = 0), T.die(), (T.body.y = Oe + 30), (T.body.vy = 0));
      return;
    }
    let E = this.world.gtx(T.x);
    for (let h = 0; h < 64; h++) {
      const m = this.world.groundRowAt(E - h),
        t = [1, 2, 3, 4].every((a) => this.world.groundRowAt(E - h - a) === m);
      if (m > 0 && t && !this.world.gates.has(E - h) && FG.sameZone(E, E - h)) {
        E = E - h - 2;
        const gy0 = this.world.groundYAt(E);
        T.body.y = (gy0 >= 0 ? gy0 : m * gt) - 1;
        break;
      }
    }
    ((T.body.x = this.world.lx(E) + 8),
      (T.body.vx = 0),
      (T.body.vy = 0),
      (T.iframes = 1.2),
      this.fx.number(T.cx, T.body.y - 30, `-${C}`, "#ff5a4a", !0),
      (R = this.hud()) == null || R.toast("추락! 체력이 감소했다", "#ff5a4a"),
      (this.camX = T.x - ot / 2));
  }
  rebase(T) {
    var C;
    this.player.shift(T);
    for (const E of this.enemies) E.shift(T);
    ((C = this.boss) == null || C.shift(T), this.projectiles.shift(T), this.gold.shift(T), this.fx.shift(T));
    for (const E of this.gateSprites.values()) E.x -= T;
    ((this.recordFlag.x -= T),
      this.effects.shift(T),
      FG.shift(this, T),
      this.arenaLock && ((this.arenaLock.l -= T), (this.arenaLock.r -= T)),
      (this.camX -= T),
      (this.cameras.main.scrollX -= T),
      this.evm.rebuild([...this.world.loaded.values()].map((E) => E.data)));
  }
  updateCamera(T) {
    const C = this.cameras.main,
      E = this.player;
    this.camLook = ie(this.camLook, E.facing * 56 + E.body.vx * 0.15, Math.min(1, T * 2.2));
    let R = E.x + this.camLook - ot / 2,
      h = E.body.y - xt * 0.62;
    (this.arenaLock && (R = (this.arenaLock.l + this.arenaLock.r) / 2 - ot / 2), (h = Ut(h, 0, Oe - xt)));
    const m = this.arenaLock ? 4 : 7;
    ((this.camX = ie(this.camX, R, Math.min(1, T * m))), (this.camY = ie(this.camY, h, Math.min(1, T * 4))));
    const t = this.world.lx(0);
    ((this.camX = FG.zoneCam(this, Math.max(t, this.camX))), C.setScroll(Math.round(this.camX), Math.round(this.camY)));
  }
  updateParallax() {
    const T = this.cameras.main,
      C = T.scrollX + this.world.originChunk * vt * gt;
    FG.parallax(this, C);
    for (const E of [this.bg, this.oldBg])
      if (E)
        for (const R of E.layers) {
          const h = R.getData("f");
          // 새로 지은 구역(zbg): 지도 자체 높이 기준 — 맨 아래에선 땅 띠가 보이고, 위로 오를수록 가까운 층부터 천천히 내려간다
          const zb = E.region?.zbg, up = zb ? Ut(1 - (T.scrollY + xt / 2) / (E.region.zbgRef ?? 8448), 0, 1) : 0;
          ((R.tilePositionX = (C * h) % 640), (R.tilePositionY = 0), R.setY(zb ? xt / 2 - BGUP + 40 + up * (50 + h * 420) : xt / 2 - BGUP + Math.min(xt * 1.6, (OREF - xt - T.scrollY) * (0.2 + h * 0.95))));
        }
  }
  beginDeath() {
    var T;
    ((this.dying = !0),
      (this.timeScale = 0.35),
      this.cameras.main.zoomTo(1.25, 900),
      (T = this.hud()) == null || T.deathFade(this.abandoned),
      j.stopMusic(),
      this.time.delayedCall(1400, () => {
        ((this.timeScale = 1), (this.run.distance = Math.floor(this.maxDist)), this.snapBuild());
        FG.settleLoot(this, this.abandoned);
        const C = it.settle(this.run, this.abandoned);
        (this.cameras.main.fadeOut(500, 0, 0, 0),
          this.time.delayedCall(550, () => {
            (this.cleanup(), this.scene.stop("Hud"), this.scene.start("Result", { result: C }));
          }));
      }));
  }
  abandon() {
    this.dying || ((this.abandoned = !0), (this.player.hp = 0), this.player.die());
  }
  // 살아서 거점으로 돌아간다: 들고 있는 것 전부 창고로
  extract() {
    this.dying || this.player.dead || ((this.abandoned = !0), (this.player.iframes = 99), this.beginDeath());
  }
  cleanup() {
    var T, C;
    this.cleaned = !0;
    (this.projectiles.clearAll(), this.gold.clear(), this.evm.clear());
    for (const E of this.enemies) E.remove();
    ((this.enemies = []),
      (T = this.boss) == null || T.destroy(),
      (this.boss = null),
      this.effects.destroy(),
      this.player.destroy(),
      this.world.destroy(),
      (C = this.ambient) == null || C.destroy(),
      (window.__run = null));
  }
  // 구역 이동: 타일 x로 순간이동 (그 구역 안의 조각만 새로 만든다)
  travelTo(tx, face = 1, row = null, py = null) {
    const C = this.player,
      R = Math.floor(tx / vt);
    for (const e of this.enemies) e.remove();
    ((this.enemies = []), this.boss && (this.boss.destroy(), (this.boss = null)), (this.arenaLock = null), (this.bossIntro = !1), this.projectiles.clearAll());
    for (let a = R; a <= R + 2; a++) this.world.gen.getMeta(a);
    const h = Math.max(0, R - 4),
      m = (h - this.world.originChunk) * vt * gt;
    this.world.originChunk = h;
    this.world.placeBands();
    this.rebase(m);
    const t = row ?? this.world.groundRowAt(tx),
      gy0 = py ?? (row == null ? this.world.groundYAt(tx) : -1);
    ((C.body.x = this.world.lx(tx) + 8),
      (C.body.y = (gy0 > 0 ? gy0 : (t > 0 ? t : Ft - 6 - UGR) * gt) - 1),
      (C.body.vy = 0),
      (C.body.vx = 0),
      (C.facing = face),
      (this.camX = C.x - ot / 2),
      (this.cameras.main.scrollX = this.camX),
      this.world.update(C.x),
      this.regionIdx >= 0 && this.updateRegion());
  }
  debugTeleport(T) {
    const C = this.player,
      E = me + Math.floor(T),
      R = Math.floor(E / vt);
    for (let a = 0; a <= R + 2; a++) this.world.gen.getMeta(a);
    const h = Math.max(0, R - 4),
      m = (h - this.world.originChunk) * vt * gt;
    this.world.originChunk = h;
    this.world.placeBands();
    this.rebase(m);
    const t = this.world.groundRowAt(E),
      gy0 = this.world.groundYAt(E);
    ((C.body.x = this.world.lx(E) + 8),
      (C.body.y = (gy0 > 0 ? gy0 : (t > 0 ? t : Ft - 6) * gt) - 1),
      (C.body.vy = 0),
      (this.camX = C.x - ot / 2),
      this.world.update(C.x),
      (this.maxDist = Math.max(this.maxDist, T - 1)));
  }
  debugArenaStart(T) {
    return ts(T) * vt + gi + 3 - me;
  }
}
class wr extends zt.Scene {
  constructor() {
    super("Hud");
    Z(this, "run");
    Z(this, "hpBar");
    Z(this, "hpText");
    Z(this, "distText");
    Z(this, "bestText");
    Z(this, "goldText");
    Z(this, "goldIcon");
    Z(this, "killText");
    Z(this, "buffIcons", []);
    Z(this, "wSlots", []);
    Z(this, "armorIcon");
    Z(this, "sSlots", []);
    Z(this, "bossBar");
    Z(this, "bossName");
    Z(this, "bossMark");
    Z(this, "toasts", []);
    Z(this, "modal", []);
    Z(this, "modalOpen", !1);
    Z(this, "lastW", ["", ""]);
    Z(this, "lastSkills", "");
    Z(this, "goldScale", 1);
    Z(this, "progBg");
    Z(this, "progFill");
    Z(this, "progBest");
    Z(this, "progSkull");
    Z(this, "progText");
    Z(this, "modalBtns", []);
    Z(this, "modalSel", -1);
    Z(this, "pad");
    Z(this, "xpBar");
    Z(this, "xpBg");
    Z(this, "lvText");
    Z(this, "streakText");
    Z(this, "relicIcons", []);
    Z(this, "relicSig", "");
    Z(this, "lastLevel", 1);
    Z(this, "cardMode", null);
    Z(this, "choiceCancel", null);
    Z(this, "bannerQueue", []);
    Z(this, "bannerBusy", !1);
  }
  create() {
    ((this.run = this.scene.get("Run")),
      (this.modalBtns = []),
      (this.modalSel = -1),
      (this.pad = new ri(this)),
      (this.relicIcons = []),
      (this.relicSig = ""),
      (this.lastLevel = 1),
      (this.cardMode = null),
      (this.toasts = []),
      (this.modal = []),
      (this.modalOpen = !1),
      (this.lastW = ["", ""]),
      (this.lastSkills = ""),
      (this.buffIcons = []),
      (this.wSlots = []),
      (this.sSlots = []),
      (this.bannerQueue = []),
      (this.bannerBusy = !1),
      Ce(this, 4, 4, 168, 22),
      this.add.image(14, 15, "icon_heart"),
      (this.hpBar = new cs(this, 22, 9, 146, 12, 14170682)),
      (this.hpText = ct(this, 95, 14, "", "tiny", "#ffffff", { stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(5)),
      (this.distText = ct(this, ot / 2, 4, "0m", "big", q.text, { stroke: "#140e18", strokeThickness: 4 }).setOrigin(
        0.5,
        0,
      )),
      (this.bestText = ct(this, ot / 2, 23, "", "tiny", q.textDim, { stroke: "#140e18", strokeThickness: 3 }).setOrigin(
        0.5,
        0,
      )),
      (this.goldIcon = this.add.image(ot - 12, 13, "icon_gold")),
      (this.goldText = ct(this, ot - 20, 7, "0", "body", q.gold, { stroke: "#140e18", strokeThickness: 3 }).setOrigin(
        1,
        0,
      )),
      (this.killText = ct(this, ot - 8, 24, "", "tiny", q.textDim, { stroke: "#140e18", strokeThickness: 3 }).setOrigin(
        1,
        0,
      )));
    for (let h = 0; h < 2; h++) {
      const m = 8 + h * 28,
        t = xt - 30,
        a = this.add.image(m + 11, t + 11, "ui_slot"),
        v = this.add.image(m + 11, t + 11, "w_sword"),
        o = this.add.rectangle(m + 1, t + 1, 20, 20, 0, 0.6).setOrigin(0, 0),
        n = ct(this, m + 2, t - 2, String(h + 1), "tiny", q.text, { stroke: "#140e18", strokeThickness: 3 }),
        i = this.add
          .image(m + 19, t + 3, "perk_star")
          .setScale(0.55)
          .setTint(16767050)
          .setVisible(!1);
      this.wSlots.push({ bg: a, icon: v, cd: o, key: n, star: i });
    }
    (this.add.image(70, xt - 19, "ui_slot"),
      (this.armorIcon = this.add.image(70, xt - 19, "icon_a_cloth")),
      ct(this, 8, xt - 42, "우클릭: 특수", "tiny", q.textDim, { stroke: "#140e18", strokeThickness: 3 }));
    const T = ["Q", "E", "R", "F"];
    for (let h = 0; h < 4; h++) {
      const m = ot / 2 - 54 + h * 28,
        t = xt - 30,
        a = this.add.image(m + 11, t + 11, "ui_slot"),
        v = this.add.image(m + 11, t + 11, "icon_s_shockwave"),
        o = this.add.rectangle(m + 1, t + 1, 20, 20, 0, 0.65).setOrigin(0, 0),
        n = ct(this, m + 11, t + 11, "", "tiny", "#ffffff", { stroke: "#140e18", strokeThickness: 3 }).setOrigin(0.5),
        i = ct(this, m + 2, t - 2, T[h], "tiny", q.text, { stroke: "#140e18", strokeThickness: 3 }),
        e = this.add.image(m + 11, t + 11, "icon_lock").setVisible(!1);
      this.sSlots.push({ bg: a, icon: v, cd: o, cdText: n, key: i, lock: e });
    }
    ((this.bossName = ct(this, ot / 2, 40, "", "small", "#ffb0a0", { stroke: "#140e18", strokeThickness: 3 })
      .setOrigin(0.5, 0)
      .setVisible(!1)),
      (this.bossBar = new cs(this, ot / 2 - 150, 53, 300, 9, 12595248).setVisible(!1)),
      (this.bossMark = this.add
        .rectangle(ot / 2, 54, 1, 7, 16777215, 0.7)
        .setOrigin(0.5, 0)
        .setVisible(!1)));
    const C = 150,
      E = ot / 2 - C / 2,
      R = 36;
    ((this.progBg = this.add.rectangle(E, R, C, 4, 1314328, 0.75).setOrigin(0).setStrokeStyle(1, 5917242)),
      (this.progFill = this.add.rectangle(E + 1, R + 1, 0, 2, 15253616).setOrigin(0)),
      (this.progBest = this.add
        .rectangle(E, R - 1, 1, 6, 16767050)
        .setOrigin(0.5, 0)
        .setVisible(!1)),
      (this.progSkull = this.add.image(E + C + 7, R + 2, "icon_skull")),
      (this.progText = ct(this, ot / 2, R + 6, "", "tiny", q.textDim, {
        stroke: "#140e18",
        strokeThickness: 3,
      }).setOrigin(0.5, 0)),
      (this.xpBg = this.add.rectangle(4, 27, 168, 5, 1314328, 0.85).setOrigin(0).setStrokeStyle(1, 3813440)),
      (this.xpBar = this.add.rectangle(5, 28, 0, 3, 7000319).setOrigin(0)),
      (this.lvText = ct(this, 176, 22, "Lv 1", "small", "#9fe0ff", { stroke: "#140e18", strokeThickness: 3 })),
      (this.streakText = ct(this, 8, 98, "", "small", q.orange, { stroke: "#140e18", strokeThickness: 3 }).setAlpha(0)),
      FG.hudCreate(this),
      this.input.keyboard.on("keydown-ESC", () => this.cancelModal()),
      this.input.keyboard.on("keydown", (h) => {
        if (!this.modalOpen) return;
        const m = h.key;
        if (this.cardMode) {
          const t = this.cardMode;
          if (m >= "1" && m <= "3") {
            const a = Number(m) - 1;
            a < t.offers.length && this.pickCard(a);
          } else
            m === "a" || m === "A" || m === "ArrowLeft"
              ? this.moveCard(-1)
              : m === "d" || m === "D" || m === "ArrowRight"
                ? this.moveCard(1)
                : m === "Enter" && t.sel >= 0
                  ? this.pickCard(t.sel)
                  : (m === "r" || m === "R") && this.rerollCards();
          return;
        }
        m === "w" || m === "W" || m === "ArrowUp" || m === "a" || m === "A" || m === "ArrowLeft"
          ? this.moveSel(-1)
          : m === "s" || m === "S" || m === "ArrowDown" || m === "d" || m === "D" || m === "ArrowRight"
            ? this.moveSel(1)
            : m === "Enter" && this.activateSel();
      }));
  }
  cancelModal() {
    var T;
    if (FG.bagOpen(this)) return FG.closeBagHud(this);
    if (!(!this.modalOpen || this.cardMode)) {
      if (this._pauseOpen) {
        this.closeModal(!0);
        return;
      }
      (T = this.choiceCancel) == null || T.call(this);
    }
  }
  moveSel(T) {
    const C = this.modalBtns.length;
    C &&
      ((this.modalSel = this.modalSel < 0 ? 0 : Math.max(0, Math.min(C - 1, this.modalSel + T))),
      this.modalBtns.forEach((E, R) => E.b.setSelected(R === this.modalSel)),
      j.play("click"));
  }
  activateSel() {
    const T = this.modalBtns[this.modalSel];
    !T || !T.b.enabled || (j.play("click"), T.fn());
  }
  addModalBtn(T, C) {
    this.modalBtns.push({ b: T, fn: C });
  }
  // 오른쪽 위 글자 알림은 쓰지 않는다 (2026-11-28 사용자 요청) — 대신 플레이어 머리 위에 짧게 떴다 사라진다 (획득·가방 가득·레벨 포인트 같은 피드백)
  toast(T, C = q.text) {
    const sc = this.run, p = sc?.player;
    if (!p || !sc.fx) return;
    const now = this.time.now;
    this._toastN = now - (this._toastAt ?? -1e9) < 700 ? (this._toastN ?? 0) + 1 : 0;
    this._toastAt = now;
    sc.fx.text(p.cx, p.body.y - 44 - (this._toastN % 4) * 11, T, C);
  }
  goldPulse() {
    this.goldScale = 1.35;
  }
  regionBanner(T, C) {
    const E = ct(this, ot / 2, 92, T, "title", q.text, { stroke: "#140e18", strokeThickness: 6 })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(40),
      R = ct(this, ot / 2, 118, C, "small", q.textDim, { stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(40),
      h = this.add
        .rectangle(ot / 2, 106, 220, 1, 15260072)
        .setOrigin(0.5)
        .setDepth(40)
        .setScale(0, 1);
    (this.tweens.add({
      targets: [E, R],
      alpha: 1,
      duration: 600,
      hold: 2200,
      yoyo: !0,
      onComplete: () => {
        (E.destroy(), R.destroy());
      },
    }),
      this.tweens.add({ targets: h, scaleX: 1, duration: 800, hold: 2e3, yoyo: !0, onComplete: () => h.destroy() }));
  }
  banner(T, C, E) {
    (this.bannerQueue.push({ title: T, sub: C, color: E }), this.bannerBusy || this.nextBanner());
  }
  nextBanner() {
    const T = this.bannerQueue.shift();
    if (!T) {
      this.bannerBusy = !1;
      return;
    }
    this.bannerBusy = !0;
    const C = 152,
      E = this.add
        .rectangle(ot / 2, C, ot, 38, 0, 0.5)
        .setDepth(39)
        .setAlpha(0),
      R = ct(this, ot / 2, C - 8, T.title, "big", T.color, { stroke: "#140e18", strokeThickness: 4 })
        .setOrigin(0.5)
        .setDepth(40)
        .setAlpha(0),
      h = ct(this, ot / 2, C + 9, T.sub, "small", q.text, { stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(40)
        .setAlpha(0);
    this.tweens.add({
      targets: [E, R, h],
      alpha: 1,
      duration: 250,
      hold: 2300,
      yoyo: !0,
      onComplete: () => {
        (E.destroy(), R.destroy(), h.destroy(), this.nextBanner());
      },
    });
  }
  newRecord() {
    const T = ct(this, ot / 2, 64, "신기록!", "title", q.gold, { stroke: "#3a2008", strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(41)
      .setScale(2.2)
      .setAlpha(0);
    (this.tweens.add({ targets: T, scale: 1, alpha: 1, duration: 350, ease: "Back.easeOut" }),
      this.tweens.add({ targets: T, alpha: 0, y: 50, duration: 600, delay: 2e3, onComplete: () => T.destroy() }));
  }
  bossIntro(T, C) {
    const E = this.add.rectangle(ot / 2, -20, ot, 40, 0).setDepth(45),
      R = this.add.rectangle(ot / 2, xt + 20, ot, 40, 0).setDepth(45);
    (this.tweens.add({ targets: E, y: 20, duration: 300, hold: 1300, yoyo: !0, onComplete: () => E.destroy() }),
      this.tweens.add({ targets: R, y: xt - 20, duration: 300, hold: 1300, yoyo: !0, onComplete: () => R.destroy() }));
    const h = ct(this, ot / 2, xt / 2 - 30, C, "small", "#ffb0a0", { stroke: "#140e18", strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(46)
        .setAlpha(0),
      m = ct(this, ot / 2, xt / 2 - 10, T, "title", "#ff6a5a", { stroke: "#140e18", strokeThickness: 6 })
        .setOrigin(0.5)
        .setDepth(46)
        .setAlpha(0)
        .setScale(1.4);
    this.tweens.add({
      targets: [h, m],
      alpha: 1,
      scale: 1,
      duration: 400,
      hold: 1e3,
      yoyo: !0,
      onComplete: () => {
        (h.destroy(), m.destroy());
      },
    });
  }
  deathFade(T = !1) {
    const C = ct(this, ot / 2, xt / 2, T ? "거점으로 귀환한다..." : "쓰러졌다...", "title", T ? q.gold : "#ff6a5a", {
      stroke: "#140e18",
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({ targets: C, alpha: 1, duration: 700 });
  }
  openModal() {
    ((this.modalOpen = !0), this.scene.pause("Run"), j.play("open"));
  }
  cards(T, C, E, R, h) {
    if (this.modalOpen || E.length === 0) return !1;
    (this.openModal(), j.play("levelup"));
    const m = this.add.rectangle(0, 0, ot, xt, 328714, 0.72).setOrigin(0).setDepth(90).setInteractive(),
      t = ct(this, ot / 2, 40, T, "title", q.gold, { stroke: "#2a1408", strokeThickness: 6 })
        .setOrigin(0.5)
        .setDepth(92)
        .setScale(1.3)
        .setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: "Back.easeOut" });
    const a = ct(this, ot / 2, 64, C, "small", q.textDim, { stroke: "#140e18", strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(92);
    return (
      this.modal.push(m, t, a),
      (this.cardMode = { offers: E, pick: R, reroll: h, sel: -1, objs: [], cards: [], intro: !0, lockUntil: this.time.now + 2e3 }),
      this.cardIntro(),
      this.buildCards(),
      !0
    );
  }
  // 선택 창 등장 연출: 2초 동안 빛이 퍼지고 카드가 한 장씩 뒤집혀 나온다. 그동안은 고를 수 없다
  cardIntro() {
    const T = this.cardMode,
      ADD = zt.BlendModes.ADD,
      cx = ot / 2,
      cy = 180,
      push = (o) => (this.modal.push(o), o);
    const g = push(this.add.image(cx, cy, "vx_glow").setBlendMode(ADD).setTint(16767088).setDepth(91).setScale(0.2).setAlpha(0.9));
    this.tweens.add({ targets: g, scale: 9, alpha: 0.18, duration: 900, ease: "Cubic.easeOut" });
    for (let i = 0; i < 10; i++) {
      const r = push(this.add.rectangle(cx, cy, 3, 260, 16773296, 0.22).setBlendMode(ADD).setDepth(91).setOrigin(0.5, 1).setRotation((i / 10) * Math.PI * 2).setScale(1, 0));
      this.tweens.add({ targets: r, scaleY: 1, alpha: 0.06, duration: 700, delay: i * 30, ease: "Cubic.easeOut" });
      this.tweens.add({ targets: r, rotation: r.rotation + 0.6, duration: 6e3, repeat: -1 });
    }
    const bw = 180,
      bg = push(this.add.rectangle(cx - bw / 2, 76, bw, 3, 1314328, 0.9).setOrigin(0, 0.5).setDepth(93)),
      bar = push(this.add.rectangle(cx - bw / 2, 76, 0, 3, 16767050).setOrigin(0, 0.5).setDepth(94));
    this.tweens.add({
      targets: bar,
      width: bw,
      duration: 2e3,
      onComplete: () => {
        if (this.cardMode !== T) return;
        (bg.setVisible(!1), bar.setVisible(!1), (T.intro = !1), j.play("open"));
        for (const c of T.cards)
          (this.tweens.killTweensOf(c), c.setPosition(c.getData("fx"), c.getData("fy")).setScale(1).setAlpha(1));
        for (const o of T.objs) o !== void 0 && o.alpha === 0 && !T.cards.includes(o) && o.setAlpha?.(1);
        for (const c of T.cards) {
          const f = this.add.nineslice(c.x, c.y, "ui_card_legendary", void 0, c.width, c.height, 6, 6, 6, 6).setBlendMode(ADD).setDepth(95).setAlpha(0.8);
          (this.modal.push(f), this.tweens.add({ targets: f, alpha: 0, scaleX: 1.12, scaleY: 1.08, duration: 380, onComplete: () => f.destroy() }));
        }
      },
    });
  }
  buildCards() {
    const T = this.cardMode;
    for (const v of T.objs) v.destroy();
    ((T.objs = []), (T.cards = []));
    const C = T.offers.length,
      E = 156,
      R = 196,
      h = 14,
      m = (ot - (C * E + (C - 1) * h)) / 2,
      t = 82;
    if (
      (T.offers.forEach((v, o) => {
        var y;
        const n = v.def,
          i = m + o * (E + h),
          e = this.add
            .nineslice(i + E / 2, t + R / 2 + 16, `ui_card_${n.rarity}`, void 0, E, R, 6, 6, 6, 6)
            .setDepth(92)
            .setAlpha(0)
            .setInteractive({ useHandCursor: !0 });
        const D0 = T.intro ? 350 + o * 380 : o * 70;
        e.setData("fx", i + E / 2).setData("fy", t + R / 2);
        T.intro
          ? (e.setPosition(ot / 2, t + R / 2).setScale(0, 1),
            this.tweens.add({ targets: e, x: i + E / 2, scaleX: 1, alpha: 1, duration: 420, delay: D0, ease: "Back.easeOut",
              onStart: () => j.play("click"),
              onComplete: () => this.cardMode === T && this.run?.fx && (this.cameras.main.shake(60, 0.002)) }))
          : this.tweens.add({ targets: e, y: t + R / 2, alpha: 1, duration: 220, delay: D0, ease: "Cubic.easeOut" });
        (0,
          e.on("pointerover", () => this.selectCard(o)),
          e.on("pointerdown", (x) => {
            x.leftButtonDown() && this.pickCard(o);
          }));
        const r = [],
          l = i + E / 2,
          s = this.add
            .image(l, t + 34, `perkbadge_${n.rarity}`)
            .setScale(2.4)
            .setDepth(93),
          u = this.add
            .image(l, t + 34, n.iconKey ?? `perk_${n.icon}`)
            .setScale(n.iconKey ? 1.7 : 2.4)
            .setTint(n.iconKey ? 16777215 : n.color)
            .setDepth(94),
          band = this.add.rectangle(l, t + 72, E - 12, 22, 0x2a1a10).setDepth(93),
          d = ct(this, l, t + 64, n.name, "big", ki[n.rarity], { stroke: "#140e18", strokeThickness: 3 })
            .setOrigin(0.5, 0)
            .setDepth(94),
          f = `${Ks[n.rarity]} ${n.tag ?? (n.relic ? "유물" : "각성")}${n.max > 1 ? `  ·  ${v.stack}/${n.max}` : ""}`;
        if (n.evo) {
          const x = this.add
            .nineslice(i + E / 2, t + R / 2, "ui_card_legendary", void 0, E + 8, R + 8, 6, 6, 6, 6)
            .setDepth(91)
            .setAlpha(0.2)
            .setBlendMode(zt.BlendModes.ADD);
          (this.tweens.add({ targets: x, alpha: 0.65, duration: 500, yoyo: !0, repeat: -1 }),
            T.objs.push(x),
            r.push(ct(this, i + 10, t + 8, "진화", "tiny", "#ffd84a").setDepth(94)));
        }
        const c = ct(this, l, t + 84, f, "tiny", q.textDim)
            .setOrigin(0.5, 0)
            .setDepth(94),
          p = ct(this, l, t + 102, n.desc(v.stack), "small", q.text, {
            align: "center",
            wordWrap: { width: E - 20, useAdvancedWrap: !0 },
          })
            .setOrigin(0.5, 0)
            .setDepth(94),
          g = ct(this, l, t + R - 18, `[${o + 1}]`, "small", q.textDim)
            .setOrigin(0.5, 0)
            .setDepth(94);
        (v.stack > 1 &&
          r.push(
            ct(this, i + E - 10, t + 8, "강화", "tiny", q.green)
              .setOrigin(1, 0)
              .setDepth(94),
          ),
          r.push(band, s, u, d, c, p, g));
        for (const x of r)
          ((y = x.setAlpha) == null || y.call(x, 0),
            this.tweens.add({ targets: x, alpha: 1, duration: 200, delay: T.intro ? D0 + 300 : 120 + o * 70 }));
        (T.cards.push(e), T.objs.push(e, ...r));
      }),
      T.reroll)
    ) {
      const v = Be(this, ot / 2 - 70, t + 206, 140, 20, "다시 뽑기 [R]", () => this.rerollCards(), {
        depth: 93,
        small: !0,
      });
      T.objs.push(...v.container);
    }
    const a = ct(
      this,
      ot / 2,
      xt - 14,
      "",
      "tiny",
      q.textDim,
    )
      .setOrigin(0.5)
      .setDepth(93);
    T.objs.push(a);
    for (const v of T.objs) this.modal.push(v);
  }
  selectCard(T) {
    const C = this.cardMode;
    !C ||
      T === C.sel ||
      ((C.sel = T),
      C.cards.forEach((E, R) => {
        // 등장 연출 중에는 날아오는 움직임을 끊지 않는다
        C.intro || (this.tweens.killTweensOf(E), E.setAlpha(1), E.setScale(R === T ? 1.05 : 1));
        E.setTint(R === T ? 16777215 : 13154456);
      }),
      j.play("click"));
  }
  moveCard(T) {
    const C = this.cardMode;
    if (!C) return;
    const E = C.offers.length;
    this.selectCard(C.sel < 0 ? (T > 0 ? 0 : E - 1) : Math.max(0, Math.min(E - 1, C.sel + T)));
  }
  pickCard(T) {
    const C = this.cardMode;
    if (!C || this.time.now < (C.lockUntil ?? 0)) return;
    const E = C.offers[T];
    E && ((this.cardMode = null), this.closeModal(!0), C.pick(E.def.id), j.play("buff"));
  }
  rerollCards() {
    const T = this.cardMode;
    if (!T || !T.reroll || this.time.now < (T.lockUntil ?? 0)) return;
    const C = T.reroll();
    if (!C || !C.length) {
      j.play("error");
      return;
    }
    ((T.offers = C),
      (T.sel = -1),
      (this.modal = this.modal.filter((E) => !T.objs.includes(E))),
      this.buildCards(),
      j.play("portal"));
  }
  levelUpFx(T) {
    const C = ct(this, 176, 22, `Lv ${T}!`, "small", "#ffffff", { stroke: "#2060a0", strokeThickness: 3 }).setDepth(30);
    (this.tweens.add({ targets: C, y: 6, alpha: 0, duration: 900, onComplete: () => C.destroy() }),
      this.tweens.add({ targets: this.xpBar, alpha: 0.2, duration: 80, yoyo: !0, repeat: 3 }));
  }
  closeModal(T = !0) {
    // 일시정지 흐림 풀기
    try {
      this._pauseBlur && (this.run?.cameras?.main?.postFX?.remove(this._pauseBlur), (this._pauseBlur = null));
    } catch (e) {}
    for (const C of this.modal) C.destroy();
    ((this.modal = []),
      (this.modalOpen = !1),
      (this._pauseOpen = !1),
      (this.modalBtns = []),
      (this.modalSel = -1),
      (this.cardMode = null),
      (this.choiceCancel = null),
      T && this.scene.resume("Run"),
      j.play("close"));
  }
  choice(T, C, E) {
    if (this.modalOpen) return;
    this.openModal();
    const main = E.slice(0, -1),
      cancel = E[E.length - 1],
      n = Math.max(1, main.length),
      gap = 8,
      cw = Math.min(138, Math.floor((ot - 60 - gap * (n - 1)) / n)),
      ch = 150,
      PW = Math.max(300, n * cw + (n - 1) * gap + 40),
      PH = ch + 110,
      px = (ot - PW) / 2,
      py = (xt - PH) / 2,
      bg = this.add.rectangle(0, 0, ot, xt, 0x08060c, 0.66).setOrigin(0).setDepth(90).setInteractive(),
      sheet = Ce(this, px, py, PW, PH, "ui_panel_gold").setDepth(91),
      title = ct(this, ot / 2, py + 10, T, "big", q.text).setOrigin(0.5, 0).setDepth(92),
      sub = ct(this, ot / 2, py + 30, C, "tiny", q.textDim).setOrigin(0.5, 0).setDepth(92),
      rule = this.add.rectangle(px + 16, py + 44, PW - 32, 1, 0x7a5434).setOrigin(0).setDepth(92);
    this.modal.push(bg, sheet, title, sub, rule);
    this.choiceCancel = () => (this.closeModal(!0), cancel.cb());
    const x0 = (ot - (n * cw + (n - 1) * gap)) / 2,
      y0 = py + 52;
    main.forEach((e, r) => {
      const off = e.enabled === !1,
        x = x0 + r * (cw + gap),
        fire = () => {
          if (off) return void j.play("error");
          (this.closeModal(!0), e.cb());
        },
        card = this.add
          .nineslice(x, y0, "ui_inner", void 0, cw, ch, 4, 4, 4, 4)
          .setOrigin(0)
          .setDepth(92)
          .setInteractive({ useHandCursor: !0 }),
        glow = this.add.rectangle(x + cw / 2, y0 + ch / 2, cw - 2, ch - 2).setStrokeStyle(2, 0xc88a20).setDepth(93).setVisible(!1),
        medal = this.add.image(x + cw / 2, y0 + 34, "ui_medal").setDepth(93).setScale(0.9),
        objs = [card, glow, medal];
      if (e.icon) {
        const ic = this.add.image(x + cw / 2, y0 + 34, e.icon).setDepth(94).setScale(2);
        (e.tint !== void 0 && ic.setTint(e.tint), objs.push(ic));
      }
      const lab = ct(this, x + cw / 2, y0 + 66, e.label, "small", off ? q.textDim : q.text, { align: "center", wordWrap: { width: cw - 12, useAdvancedWrap: !0 } }).setOrigin(0.5, 0).setDepth(94),
        des = ct(this, x + cw / 2, y0 + 70 + lab.height, e.desc ?? "", "tiny", q.textDim, { align: "center", wordWrap: { width: cw - 14, useAdvancedWrap: !0 } }).setOrigin(0.5, 0).setDepth(94);
      objs.push(lab, des);
      for (const o of objs) o.setData("y0", o.y);
      off && (card.setTint(0xb0a090), medal.setTint(0x8a7a6a));
      const btn = {
        enabled: !off,
        container: objs,
        setSelected: (v) => {
          glow.setVisible(v);
          card.setTexture(v ? "ui_inner_sel" : "ui_inner");
          for (const o of objs) o.y = o.getData("y0") - (v ? 4 : 0);
        },
      };
      card.on("pointerover", () => {
        const k = this.modalBtns.findIndex((m) => m.b === btn);
        ((this.modalSel = k), this.modalBtns.forEach((m, i) => m.b.setSelected(i === k)));
      });
      card.on("pointerdown", fire);
      (this.modal.push(...objs), this.addModalBtn(btn, fire));
    });
    const cb = Be(this, ot / 2 - 70, py + PH - 32, 140, 20, cancel.label + "  [Esc]", () => this.choiceCancel(), { depth: 92, small: !0 });
    (this.modal.push(...cb.container), this.addModalBtn(cb, () => this.choiceCancel()));
    this.modalSel = 0;
    this.modalBtns[0] && this.modalBtns[0].b.setSelected(!0);
  }
  // 일시정지 (2026-11-28 다듬기 4-5): 뒤 화면을 흐리게 · 가운데 철 테두리 패널 · 리본 제목 · 지역 이름 · 계속/지도/운명 보드/설정
  openPause(view = "main") {
    if (this.modalOpen && !this._pauseOpen) return;
    this._pauseOpen ? this.clearPauseUI() : (this.openModal(), (this._pauseOpen = !0));
    const UK = FG.UK, W = ot, H = xt, PW = 250, PH = 236, px = (W - PW) / 2, py = (H - PH) / 2 + 8;
    try {
      const cam = this.run?.cameras?.main;
      cam?.postFX && !this._pauseBlur && (this._pauseBlur = cam.postFX.addBlur(1, 2, 2, 1.2));
    } catch (e) {}
    const add = (o) => (this.modal.push(o), o);
    add(this.add.rectangle(0, 0, W, H, 0x08060a, 0.55).setOrigin(0).setDepth(90).setInteractive());
    add(UK.vignette(this, 0.7, 90.5));
    add(UK.frame(this, px, py, PW, PH, { depth: 91 }));
    const rb = UK.ribbon(this, W / 2, py - 14, 150, view === "settings" ? "설정" : "일시정지", { depth: 93, font: "big", h: 28 });
    rb.objs.forEach(add);
    const z = FG.zoneNameOf?.(this.run);
    view === "main" && z && add(ct(this, W / 2, py + 24, z, "small", "#e8d4b0", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(92));
    const L = view === "settings"
      ? [...$s(this).map((e) => ({ label: e.label, fn: (P) => (e.apply(), P.set(e.label())) })), { label: () => "◀  돌아가기", fn: () => this.openPause("main") }]
      : [
          { label: () => "계속하기", primary: !0, fn: () => this.closeModal(!0) },
          { label: () => "지도  [M]", fn: () => (this.closeModal(!0), FG.toggleMapHud?.(this)) },
          { label: () => "운명 보드  [V]", fn: () => (this.closeModal(!0), FG.toggleDestiny(this)) },
          { label: () => "설정", fn: () => this.openPause("settings") },
        ];
    const top = view === "settings" ? py + 22 : py + 52, bh = view === "settings" ? 24 : 34, bw = PW - 40;
    L.forEach((e, r) => {
      const P = UK.plate(this, px + 20, top + r * bh, bw, bh - 6, e.label(), () => e.fn(P), { primary: e.primary, small: view === "settings", depth: 92, font: e.primary ? "big" : view === "settings" ? "tiny" : "body" });
      P.objs.forEach(add);
      this.addModalBtn({ enabled: !0, setSelected: (v) => P.select(v) }, () => e.fn(P));
    });
    add(ct(this, W / 2, py + PH - 18, "ESC 닫기  ·  ↑↓ 선택  ·  Enter 확인", "tiny", "#b8a888", { stroke: "#140a04", strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(92));
    this.modalSel = 0;
    this.modalBtns[0]?.b.setSelected(!0);
  }
  clearPauseUI() {
    for (const C of this.modal) C.destroy();
    ((this.modal = []), (this.modalBtns = []), (this.modalSel = -1));
  }
  buildListPanel() {
    const T = this.run.build,
      B = this.pauseBox;
    if (!T || !B) return;
    const C = B.x,
      E = B.y,
      R = B.w,
      t = B.h,
      a = this.add.nineslice(C, E, "ui_inner", void 0, R, t, 4, 4, 4, 4).setOrigin(0).setDepth(91),
      v = ct(this, C + 10, E + 6, `이번 탐험  ·  Lv ${T.level}`, "small", q.text).setDepth(92),
      o = ct(this, C + R - 10, E + 7, `최고 연속 ${T.bestStreak}`, "tiny", q.textDim).setOrigin(1, 0).setDepth(92),
      h = T.order,
      cols = 2,
      cw = (R - 20) / cols,
      rows = Math.floor((t - 34) / 15),
      m = Math.min(h.length, rows * cols);
    (this.modal.push(a, v, o, this.add.rectangle(C + 8, E + 22, R - 16, 1, 0x9a7448).setOrigin(0).setDepth(92)),
      h.length || this.modal.push(ct(this, C + 10, E + 30, "아직 각성이 없습니다", "tiny", q.textDim).setDepth(92)),
      h.slice(0, m).forEach((n, i) => {
        const e = Ee[n];
        if (!e) return;
        const x = C + 10 + Math.floor(i / rows) * cw,
          r = E + 28 + (i % rows) * 15,
          s = T.stacks(n);
        this.modal.push(
          this.add.image(x + 6, r + 5, `perkbadge_${e.rarity}`).setScale(0.8).setDepth(92),
          this.add.image(x + 6, r + 5, `perk_${e.icon}`).setTint(e.color).setScale(0.75).setDepth(93),
          ct(this, x + 16, r, `${e.name}${s > 1 ? ` x${s}` : ""}`, "tiny", q.text).setDepth(92),
        );
      }),
      h.length > m && this.modal.push(ct(this, C + R - 10, E + t - 14, `외 ${h.length - m}개`, "tiny", q.textDim).setOrigin(1, 0).setDepth(92)));
  }
  updateBuildWidgets(T) {
    const C = this.run.build;
    if (!C) return;
    const E = Ji(C.level),
      R = (this.frXpMax ?? 166) * Math.min(1, C.xp / E);
    if (
      ((this.xpBar.width += (R - this.xpBar.width) * Math.min(1, T * 12)),
      C.level !== this.lastLevel && ((this.lastLevel = C.level), (this.xpBar.width = 0)),
      this.lvText.setText(`Lv ${C.level}${C.pending > 0 ? " ▲" : ""}`),
      C.streak >= 3)
    ) {
      const m = Math.round(Math.min(0.5, Math.floor(C.streak / 10) * 0.1) * this.run.player.run.streakMult * 100);
      (this.streakText
        .setText(`${C.streak} 연속 처치${m > 0 ? `  보상 +${m}%` : ""}`)
        .setAlpha(Math.min(1, C.streakT * 1.5)),
        this.streakText.setColor(C.streak >= 30 ? "#ff5a4a" : C.streak >= 10 ? q.orange : q.text));
    } else this.streakText.setAlpha(0);
    const h = C.relics.join(",");
    if (h !== this.relicSig) {
      this.relicSig = h;
      for (const m of this.relicIcons) m.destroy();
      ((this.relicIcons = []),
        C.relics.forEach((m, t) => {
          const a = Ee[m];
          if (!a) return;
          const v = 14 + (t % 12) * 17,
            o = 12 + Math.floor(t / 12) * 17;
          this.relicIcons.push(
            this.add.image(v, o, `perkbadge_${a.rarity}`).setScale(0.85),
            this.add.image(v, o, `perk_${a.icon}`).setTint(a.color).setScale(0.8),
          );
        }));
    }
  }
  updateProgress(T, C, E) {
    if (!E && FG.zoneProgress(this)) return;
    const R = qi(T),
      h = !E;
    for (const n of [this.progBg, this.progFill, this.progSkull, this.progText]) n.setVisible(h);
    if (!h) {
      this.progBest.setVisible(!1);
      return;
    }
    const m = Math.max(1, R.end - R.start),
      t = Math.max(0, Math.min(1, (T - R.start) / m));
    this.progFill.width = (this.progBg.width - 2) * t;
    const a = (C - R.start) / m;
    this.progBest.setVisible(a > 0 && a < 1).setX(this.progBg.x + this.progBg.width * a);
    const v = this.run.bossDefeated.has(ts(R.end));
    this.progSkull.setAlpha(v ? 0.35 : 1);
    const o = Math.max(0, Math.ceil(R.end - T));
    this.progText.setText(v ? `다음 지역까지 ${yt(o)}m` : `보스까지 약 ${yt(Math.max(0, o - 40))}m`);
  }
  update(T, C) {
    const E = C / 1e3,
      R = this.run;
    if (!R || !R.player) return;
    FG.hudUpdate(this);
    if ((this.pad.poll(), this.modalOpen && this.cardMode)) {
      const s = this.pad.navX();
      (s && this.moveCard(s),
        this.pad.justDown(Mt.A) && this.cardMode.sel >= 0
          ? this.pickCard(this.cardMode.sel)
          : this.pad.justDown(Mt.Y) && this.rerollCards());
    } else if (this.modalOpen) {
      const s = this.pad.navY() || this.pad.navX();
      (s && this.moveSel(s),
        this.pad.justDown(Mt.A) && this.activateSel(),
        (this.pad.justDown(Mt.B) || this.pad.justDown(Mt.START)) && this.cancelModal());
    }
    const h = R.player;
    (this.hpBar.set(h.hp / h.maxHp, E), this.hpText.setText(`${Math.ceil(h.hp)} / ${h.maxHp}`));
    const m = Math.floor(R.dist);
    FG.zoneHudText(this, R) || this.distText.setText(`${yt(m)}m`);
    const t = Math.max(R.run.prevBest, Math.floor(R.maxDist)),
      a = R.nextMilestone();
    (FG.zoned || this.bestText.setText(`최고 ${yt(t)}m${a ? `   ·   다음 기록 ${yt(a.dist)}m (+${yt(a.gold)}G)` : ""}`),
      ((t) => this.bestText.style.color !== t && this.bestText.setColor(t))(R.maxDist > R.run.prevBest && R.run.prevBest > 0 ? q.gold : q.textDim),
      this.goldText.setText(yt(R.run.gold + R.run.milestoneGold)),
      (this.goldScale = Math.max(1, this.goldScale - E * 2)),
      this.goldText.setScale(this.goldScale),
      this.goldIcon.setScale(this.goldScale),
      this.killText.setText(`처치 ${R.run.kills}  ·  ${R.currentRegion().name}`));
    const v = h.weapons;
    for (let s = 0; s < 2; s++) {
      const u = v.ids[s],
        d = this.wSlots[s];
      if (
        (u !== this.lastW[s] &&
          ((this.lastW[s] = u ?? ""),
          u ? (d.icon.setTexture(`w_${u}`).setVisible(!0).setRotation(-0.785), bi(d.icon, 26)) : d.icon.setVisible(!1)),
        d.bg.setTexture(v.slot === s && u ? "ui_slot_sel" : "ui_slot"),
        d.key.setAlpha(u ? 1 : 0.3),
        d.star.setVisible(!!u && h.run.evo.includes(`evo_${u}`)),
        u)
      ) {
        const f = v.specialCooldownMax(u),
          c = f > 0 ? (v.specialCd[u] ?? 0) / f : 0;
        d.cd.setVisible(c > 0).setSize(20, 20 * c);
      } else d.cd.setVisible(!1);
    }
    this.armorIcon.setTexture(`icon_a_${h.stats.armorId}`);
    const o = h.skills,
      n = o.slots.join(",") + it.data.skillSlots;
    (n !== this.lastSkills &&
      ((this.lastSkills = n),
      o.slots.forEach((s, u) => {
        const d = this.sSlots[u],
          f = u >= it.data.skillSlots;
        (d.lock.setVisible(f),
          d.icon.setVisible(!!s && !f),
          s && d.icon.setTexture(`icon_s_${s}`),
          d.bg.setAlpha(f ? 0.5 : 1));
      })),
      o.slots.forEach((s, u) => {
        const d = this.sSlots[u];
        if (!s) {
          (d.cd.setVisible(!1), d.cdText.setText(""));
          return;
        }
        const f = o.cds[u] / Math.max(0.01, o.maxCds[u]);
        (d.cd.setVisible(f > 0).setSize(20, 20 * f),
          d.cdText.setText(o.cds[u] > 0 ? (o.cds[u] >= 1 ? String(Math.ceil(o.cds[u])) : o.cds[u].toFixed(1)) : ""));
      }));
    const i = [];
    for (const s of h.buffs.values())
      s.icon && s.t < 9999
        ? i.push({ icon: `icon_b_${s.icon}`, f: s.t / s.max })
        : s.icon && i.push({ icon: `icon_b_${s.icon}`, f: 1 });
    for (const [s, u] of h.statuses.map)
      ["burn", "poison", "chill"].includes(s) && i.push({ icon: `icon_b_${s}`, f: Math.min(1, u.t / 4) });
    for (h.run.atkPct > 0 && i.push({ icon: "icon_b_atk", f: 1 }); this.buffIcons.length < i.length;) {
      const s = this.buffIcons.length;
      this.buffIcons.push({
        img: this.add.image(12 + s * 13, 84, "icon_b_atk"),
        bar: this.add.rectangle(7 + s * 13, 90, 10, 2, 16777215).setOrigin(0, 0),
      });
    }
    this.buffIcons.forEach((s, u) => {
      const d = i[u];
      (s.img.setVisible(!!d),
        s.bar.setVisible(!!d),
        d && (s.img.setTexture(d.icon), (s.bar.width = 10 * Math.max(0, d.f))));
    });
    const e = R.boss,
      r = !!e && !e.dead;
    (this.bossName.setVisible(r),
      this.bossBar.setVisible(r),
      this.bossMark.setVisible(r),
      this.updateProgress(m, R.run.prevBest, r),
      e &&
        r &&
        (this.bossName.setText(`${e.def.name}${e.phase === 2 ? "  · 분노" : ""}`),
        this.bossBar.set(e.hp / e.maxHp, E)));
    let l = 36;
    for (let s = this.toasts.length - 1; s >= 0; s--) {
      const u = this.toasts[s];
      ((u.life -= E), u.life <= 0 && (u.t.destroy(), this.toasts.splice(s, 1)));
    }
    for (const s of this.toasts) (s.t.setY(l), s.t.setAlpha(Math.min(1, s.life * 2)), (l += 13));
    this.updateBuildWidgets(E);
  }
}
const Mr = (A) => (A.length === 0 ? "없음" : A.length <= 2 ? A.join(", ") : `${A.length}종`);
class Pr extends zt.Scene {
  constructor() {
    super("Result");
    Z(this, "result");
    Z(this, "leaving", !1);
    Z(this, "pad");
  }
  init(T) {
    ((this.result = T.result ?? it.data.pendingResult),
      (this.leaving = !1),
      (this.frPicked = !1),
      (this.frPicking = !1));
  }
  create() {
    const T = this.result;
    if ((this.cameras.main.setBackgroundColor("#0b0a10"), !T)) {
      this.scene.start("Hub");
      return;
    }
    j.playMusic("result", { root: 57, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 70, wave: "triangle", mood: 10, hub: !0 });
    // 쓰러졌으면 알비온식 사망 화면 (탐험 일지 대신 · 2026-11-28)
    if (!T.abandoned && FG.deathScreen(this, T)) return;
    const C = (T.achievementsNow ?? []).filter((l) => zi[l]),
      W = ot,
      H = xt,
      reg = qi(T.distance);
    // 쓰러진 지역의 풍경을 깔고 어둡게 덮는다
    try {
      const key = Ai(this, reg);
      (this.add.image(W / 2, H / 2, key + "_sky"), [0, 1, 2].forEach((m) => this.add.tileSprite(W / 2, H / 2, W, H, `${key}_${m}`).setTilePosition(T.distance * [0.2, 0.5, 1][m], 0)));
    } catch (l) {}
    this.add.rectangle(0, 0, W, H, 0x08060c, 0.62).setOrigin(0);
    const px = 18, py = 12, PW = W - 36, PH = H - 24;
    Ce(this, px, py, PW, PH, "ui_panel_gold");
    (ct(this, px + 18, py + 10, T.abandoned ? "탐험 일지 · 귀환" : "탐험 일지 · 전사", "big", q.text),
      ct(this, px + PW - 18, py + 14, `${it.data.runs ?? 0}번째 탐험`, "small", q.textDim).setOrigin(1, 0),
      this.add.rectangle(px + 14, py + 32, PW - 28, 1, 0x7a5434).setOrigin(0));
    // ── 왼쪽: 도달 거리 ──
    const LX = px + 14, LY = py + 40, LW = 220, LH = PH - 52;
    this.add.nineslice(LX, LY, "ui_parch_dark", void 0, LW, LH, 6, 6, 6, 6).setOrigin(0);
    const lc = LX + LW / 2;
    (ct(this, lc, LY + 10, T.frZoneName ?? reg.name, "body", q.text).setOrigin(0.5, 0),
      ct(this, lc, LY + 26, T.abandoned ? "에서 무사히 귀환했다" : "에서 쓰러졌다", "tiny", q.textDim).setOrigin(0.5, 0));
    const dist = ct(this, lc, LY + 44, "0m", "title", q.text).setOrigin(0.5, 0);
    FG.zoned ? dist.setText(`구역 ${T.frZones ?? 1}곳`) : this.tweens.addCounter({ from: 0, to: T.distance, duration: 1200, ease: "Cubic.easeOut", onUpdate: (l) => dist.setText(`${yt(l.getValue())}m`) });
    // 지역 진행 막대
    // 격자 지도에서는 거리 막대·거리 기록을 보이지 않는다
    if (!FG.zoned) {
    const regs = Ht.map((r) => r.start).concat([1e4]),
      ri0 = Math.max(0, regs.filter((x) => x <= T.distance).length - 1),
      bx = LX + 16, by = LY + 92, bw = LW - 32;
    this.add.rectangle(bx, by, bw, 6, 0x4a2e18).setOrigin(0);
    const fill = this.add.rectangle(bx, by, 1, 6, 0xd8a020).setOrigin(0);
    const nextStart = regs[ri0 + 1] ?? T.distance,
      pct = Math.min(1, (T.distance - regs[ri0]) / Math.max(1, nextStart - regs[ri0]));
    this.tweens.add({ targets: fill, width: Math.max(1, bw * pct), duration: 1200, ease: "Cubic.easeOut" });
    (ct(this, bx, by + 9, `${yt(regs[ri0])}m`, "tiny", q.textDim),
      ct(this, bx + bw, by + 9, Ht[ri0 + 1] ? `${Ht[ri0 + 1].name} ${yt(nextStart)}m` : "끝없는 길", "tiny", q.textDim).setOrigin(1, 0));
    (ct(this, lc, LY + 122, `최고 기록  ${yt(Math.max(it.data.best, T.distance))}m`, "small", T.newRecord ? q.gold : q.text).setOrigin(0.5, 0),
      T.newRecord && ct(this, lc, LY + 136, `이전 ${yt(T.prevBest)}m`, "tiny", q.textDim).setOrigin(0.5, 0));
    }
    if (T.newRecord) {
      const st = this.add.container(LX + LW - 34, LY + 70).setRotation(-0.25).setScale(3).setAlpha(0);
      (st.add(this.add.circle(0, 0, 22, 0xa8261a, 0.9)), st.add(this.add.circle(0, 0, 18).setStrokeStyle(1, 0xffd0a0)), st.add(ct(this, 0, 0, "신기록", "small", "#fff0d0").setOrigin(0.5)));
      this.tweens.add({ targets: st, scale: 1, alpha: 1, duration: 260, delay: 1250, ease: "Back.easeOut", onStart: () => (j.play("record"), this.cameras.main.shake(120, 0.004)) });
    }
    // 칩
    const chip = (x, y, label, val) => {
      this.add.nineslice(x, y, "ui_inner", void 0, 62, 34, 4, 4, 4, 4).setOrigin(0);
      (ct(this, x + 31, y + 4, label, "tiny", q.textDim).setOrigin(0.5, 0), ct(this, x + 31, y + 16, val, "small", q.text).setOrigin(0.5, 0));
    };
    (chip(LX + 10, LY + 160, "레벨", `Lv ${T.level ?? 1}`), chip(LX + 79, LY + 160, "유물", `${(T.relics ?? []).length}개`), chip(LX + 148, LY + 160, "연속", `${T.bestStreak ?? 0}`));
    if (C.length) {
      const l = C.map((u) => zi[u].name).join(", "),
        sx = ct(this, lc, LY + 202, `업적 달성! ${l}\n(+${yt(T.achievementGold ?? 0)}G 지급)`, "tiny", q.green, { align: "center", wordWrap: { width: LW - 20, useAdvancedWrap: !0 } }).setOrigin(0.5, 0).setAlpha(0);
      this.tweens.add({ targets: sx, alpha: 1, delay: 2200, onStart: () => j.play("levelup") });
    }
    // ── 오른쪽: 기록 장부 ──
    const RX = LX + LW + 12, RW = px + PW - 14 - RX;
    let v = LY + 2, n = 250;
    const sec = (name) => {
      (ct(this, RX + 4, v, name, "small", q.gold), this.add.rectangle(RX + 4, v + 14, RW - 8, 1, 0x9a7448).setOrigin(0), (v += 18));
    };
    const row = (l, val, col = q.text) => {
      const f = ct(this, RX + 10, v, l, "small", q.textDim).setAlpha(0),
        c = ct(this, RX + RW - 8, v, val, "small", col).setOrigin(1, 0).setAlpha(0);
      (this.tweens.add({ targets: [f, c], alpha: 1, x: "+=0", duration: 200, delay: (n += 90) }), (v += 14));
    };
    sec("전투");
    (row("일반 몬스터 처치", `${T.kills - T.elites}`),
      row("엘리트 처치", `${T.elites}`, q.orange),
      row("보스 처치", T.bosses > 0 ? `${T.bosses}  (${T.bossIds.map((l) => (ji[l] ? ji[l].name : "")).join(", ")})` : "0", q.red),
      row("준 피해 / 최대 일격", `${yt(T.dmgDealt ?? 0)} / ${yt(T.maxHit ?? 0)}`, q.orange),
      FG.zoned ? row("받은 피해", `${yt(T.dmgTaken ?? 0)}`) : row("받은 피해 / 무피격 거리", `${yt(T.dmgTaken ?? 0)} / ${yt(Is(T))}m`),
      row("원소 반응 · 무기 진화", `${T.reactions ?? 0}회 · ${Mr((T.evolved ?? []).map((l) => (ke[l.slice(4)] ? ke[l.slice(4)].name : null)).filter((l) => !!l))}`, q.purple),
      (v += 4));
    sec("탐험");
    (row("탐험 시간", Ns(T.time)), (v += 4));
    // 정산
    const gy = Math.max(v + 4, py + PH - 92);
    this.add.nineslice(RX, gy, "ui_inner", void 0, RW, 72, 4, 4, 4, 4).setOrigin(0);
    const g1 = ct(this, RX + 10, gy + 6, "획득 골드", "small", q.textDim),
      g1v = ct(this, RX + 170, gy + 6, yt(T.gold), "small", q.gold).setOrigin(1, 0),
      g2 = ct(this, RX + 10, gy + 20, FG.zoned ? "가져온 재료" : "기록 경신 보상", "small", q.textDim),
      g2v = ct(this, RX + 170, gy + 20, FG.zoned ? `${T.frLoot?.safe ? Object.values(T.frLoot.mats ?? {}).reduce((a, b) => a + b, 0) : 0}개` : `+${yt(T.milestoneGold)}`, "small", q.green).setOrigin(1, 0);
    this.add.rectangle(RX + 10, gy + 36, 160, 1, 0x9a7448).setOrigin(0);
    const tl = ct(this, RX + 10, gy + 42, "총 정산", "body", q.text),
      tv = ct(this, RX + 170, gy + 38, "0", "big", q.gold).setOrigin(1, 0);
    for (const o of [g1, g1v, g2, g2v, tl, tv]) (o.setAlpha(0), this.tweens.add({ targets: o, alpha: 1, delay: n + 100 }));
    (this.add.image(RX + 184, gy + 47, "icon_gold").setScale(1.4),
      this.tweens.addCounter({ from: 0, to: T.total, duration: 900, delay: (n += 200), onUpdate: (l) => tv.setText(yt(l.getValue())), onComplete: () => j.play("coinBig") }),
      ct(this, RX + RW - 10, gy + 6, `보유 골드 ${yt(it.data.gold)}`, "tiny", q.textDim).setOrigin(1, 0),
      Be(this, RX + RW - 150, gy + 40, 140, 24, "거점으로 귀환  ▶", () => this.leave(), { style: "green" }),
      this.input.keyboard.on("keydown-ENTER", () => this.leave()),
      this.input.keyboard.on("keydown-SPACE", () => this.leave()),
      (this.pad = new ri(this)),
      this.pad.poll(),
      this.cameras.main.fadeIn(400));
  }
  update() {
    this.pad && (this.pad.poll(), (this.pad.justDown(Mt.A) || this.pad.justDown(Mt.START)) && this.leave());
  }
  leave() {
    if (this.leaving || this.frPicking) return;
    if (!this.frPicked && FG.resultPick(this, this.result, () => ((this.frPicked = !0), this.leave()))) return;
    this.leaving ||
      ((this.leaving = !0),
      (it.data.pendingResult = null),
      it.write(),
      this.cameras.main.fadeOut(400),
      this.time.delayedCall(420, () => this.scene.start("Hub")));
  }
}
window.__FG = FG;
FG.bind({ OREF, Ft, TOPR, UGR, Oe, Os, Mi, frTint, As, Et, it, ae, He, ve, Ee, xe, lt, fn, ht, ct, Ce, Be, q, j, ot, xt, Ne, yt, zt, de, ce, le, Ot, Wt, ne, Qt, De, Zi, Yi, _t, We, oi, Wn, Zs, ss, Ns, Ys, Ht, ke });
const Ar = new zt.Game({
  type: zt.AUTO,
  parent: "game",
  width: ot,
  height: xt,
  backgroundColor: "#0b0a10",
  pixelArt: !0,
  roundPixels: !0,
  fps: { target: 60, smoothStep: !0 },
  scale: { mode: zt.Scale.FIT, autoCenter: zt.Scale.CENTER_BOTH },
  input: { mouse: { preventDefaultWheel: !0 } },
  scene: [Ln, Bn, pr, Er, wr, Pr],
});
window.addEventListener("beforeunload", () => it.write());
document.addEventListener("visibilitychange", () => {
  document.hidden && it.write();
});
window.__game = Ar;
initTouch({ resume: () => j.resume() });
window.__save = it;
window.__computeStats = xe;
window.__econ = { trainCost: Zi, weaponUpCost: $i, armorUpCost: Ki };
window.__perks = Ee;
