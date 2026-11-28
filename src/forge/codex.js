// 도감: 가죽 장정 책 한 권. 왼쪽 쪽 = 지역 · 분류 · 목록, 오른쪽 쪽 = 표본 그림(움직임) + 기록
// 분류: 지형(구조) · 몬스터(일반·정예) · 보스 · 전리품
import REGIONS from "./regions.json";
import ITEMS from "./items.json";
import * as PAPER from "./paper.js";
import { FR_REGIONS, FR_MONSTERS, FR_ELITES, FR_BOSSES } from "./world.js";
import { paintPreview } from "./terrain.js";
import { SPECS, preloadRegion, ensure as ensureFoe } from "./foes/core.js";
import { EL as EL_KO } from "./items.js";
import { BESTIARY } from "./bestiary.js";

export const HOOKS = {};

// ── 이름표 ──
const CATS = ["지형", "몬스터", "보스", "전리품"];
const PAT_KO = {
  flat: ["평지", "넓고 고른 땅. 마음 놓고 칼을 휘두를 수 있는 몇 안 되는 곳."],
  steps: ["계단", "한 칸씩 오르내리는 턱. 높은 쪽을 잡으면 싸움이 쉬워진다."],
  hill: ["언덕", "완만하게 솟은 땅. 꼭대기에서 내려다보면 적이 먼저 보인다."],
  gap: ["낭떠러지", "발밑이 뚫린 틈. 떨어지면 아래층 길로 이어진다."],
  platforms: ["발판", "허공에 걸린 나무 발판. 아래에서 뛰어올라 탈 수 있다."],
  pillar: ["기둥", "길을 가로막고 선 돌기둥. 뛰어넘거나 돌아가야 한다."],
  ruins: ["폐허", "무너진 담과 벽. 높이가 들쭉날쭉해 숨을 곳이 많다."],
  crumble: ["무너지는 발판", "밟으면 금이 가 곧 떨어진다. 오래 서 있지 말 것."],
  spikes: ["가시 함정", "구덩이 바닥에 박힌 가시. 떨어지면 크게 다친다."],
  bumps: ["둔덕", "울퉁불퉁한 땅. 돌진하는 적이 자주 걸려 넘어진다."],
  poison: ["독 웅덩이", "썩은 물이 고인 구덩이. 서 있으면 독이 오른다."],
  ledges: ["절벽 턱", "높은 턱에서 아래로 뚝 떨어지는 길. 되돌아오기 어렵다."],
  valley: ["골짜기", "움푹 꺼진 땅. 적이 양쪽에서 내려온다."],
  battlement: ["성벽", "톱니 모양 흉벽이 있는 성벽. 위에서는 화살이 날아온다."],
  firetrap: ["화염 분사구", "바닥 틈에서 주기적으로 불길이 솟는다. 박자를 보고 지나갈 것."],
  ice: ["빙판", "미끄러운 얼음 바닥. 멈추려 해도 몇 걸음 더 미끄러진다."],
  dunes: ["모래 언덕", "바람이 쌓은 물결 모양 언덕. 걸음이 무겁다."],
  quicksand: ["유사", "발을 붙잡아 끌어당기는 모래. 계속 뛰어야 빠져나온다."],
  runes: ["마법 룬", "바닥에 새겨진 룬. 밟으면 비전 폭발이 일어난다."],
  floating: ["떠 있는 섬", "허공에 뜬 바위섬. 단단하니 위에 올라서도 된다."],
  voidpool: ["공허 웅덩이", "빛을 삼키는 웅덩이. 닿으면 정신이 빠져나간다."],
};
const HAZ_KO = { crumble: "무너지는 발판", spikes: "가시", poison: "독 웅덩이", stalactite: "종유석 낙하", quicksand: "유사", fireJet: "화염 분사", arrowTrap: "화살 함정", ice: "빙판", arcaneRune: "비전 룬", voidPool: "공허 웅덩이" };
const ANIM_KO = {
  idle: "대기", move: "이동", wind: "준비", atk: "공격", atk2: "연타", rec: "회복", hurt: "피격", throw: "던지기", slam: "내려찍기", grab: "움켜쥐기",
  cast: "시전", shoot: "사격", draw: "시위", fire: "발사", aim: "조준", spit: "뱉기", s1: "베기 1", s2: "베기 2", s3: "베기 3", smoke: "연막",
  bind: "속박", swim: "잠행", rise: "솟구침", bite: "물기", chest: "의태", open: "정체", snipe: "저격", punch: "주먹", disperse: "흩어짐",
  form: "재결집", tsunami: "해일", claw: "할퀴기", sting: "독침", slide: "미끄러짐", blink: "순간이동", scoop: "눈 퍼기", hang: "매달림",
  fly: "비행", drop: "급강하", roll: "구르기", swell: "부풀기", hide: "숨기", spin: "회전", breath: "숨결", raise: "들어올림",
  barrier: "방벽", plant: "꽂기", flag: "군기", stagger: "경직", roar: "포효", dash: "돌진", cut1: "베기", cut2: "올려베기", stomp: "발구르기",
  hot: "과열", swap: "자세 전환", sidle: "방패 자세", smove: "방패 전진", block: "막기", counter: "반격", thrust: "찌르기", dive: "급강하",
  rear: "몸 젖힘", wing: "날갯짓", tail: "꼬리", emerge: "출현", submerge: "잠수", pounce: "덮치기", inhale: "들이마심", exhale: "내뿜기",
  shard: "결정", fin: "잠행", tongue: "혀", burp: "트림", jump: "도약", land: "착지", summon: "소환", latch: "흡착", pulse: "파동",
  inject: "주사", pile: "더미", rise2: "일어섬", tele: "순간이동", lower: "뿔 숙임", charge: "돌진", combo: "연격", plunge: "내리꽂기", spit2: "뱉기",
};
const KIND_KO = { weapon: "무기", armor: "방어구", skill: "스킬", magic: "마법" };
const RAR_CSS = { common: "#4a3a2a", rare: "#1d4f9a", epic: "#6a2a9a", legendary: "#9a5a00" };

// ── 지형 표본 격자 (32칸 × 10줄) ──
const ROWS = 10;
function patGrid(name, ceiling) {
  const g = new Array(32 * ROWS).fill(0);
  const set = (x, y, v = 1) => x >= 0 && x < 32 && y >= 0 && y < ROWS && (g[y * 32 + x] = v);
  const col = (x, top) => { for (let y = top; y < ROWS; y++) set(x, y); };
  const H = (x) => {
    switch (name) {
      case "steps": return x < 8 ? 7 : x < 11 ? 6 : x < 14 ? 5 : x < 18 ? 4 : x < 21 ? 5 : x < 24 ? 6 : 7;
      case "hill": return x < 6 || x > 26 ? 7 : 7 - Math.round(3 * Math.sin(((x - 6) / 20) * Math.PI));
      case "gap": return x >= 13 && x <= 18 ? 99 : 7;
      case "platforms": return 8;
      case "crumble": return x >= 11 && x <= 21 ? 99 : 7;
      case "spikes": case "poison": case "quicksand": case "voidpool": return x >= 13 && x <= 18 ? 8 : 7;
      case "bumps": return 7 - ([5, 6, 12, 13, 19, 25, 26].includes(x) ? 1 : 0);
      case "ledges": return x < 13 ? 4 : 7;
      case "valley": return x >= 10 && x <= 22 ? 9 : 7;
      case "dunes": return 7 - Math.round(1.4 + 1.4 * Math.sin(x * 0.42));
      case "floating": return 8;
      default: return 7;
    }
  };
  for (let x = 0; x < 32; x++) H(x) < 99 && col(x, H(x));
  if (name === "platforms") for (const [a, b, y] of [[5, 9, 5], [13, 18, 3], [22, 26, 5]]) for (let x = a; x <= b; x++) set(x, y, 2);
  if (name === "crumble") for (let x = 12; x <= 20; x++) set(x, 6, 2);
  if (name === "pillar") for (let x = 14; x <= 16; x++) for (let y = 2; y < 7; y++) set(x, y);
  if (name === "ruins") for (const [a, b, t] of [[7, 8, 4], [11, 12, 5], [17, 19, 3], [24, 24, 5]]) for (let x = a; x <= b; x++) for (let y = t; y < 7; y++) (x !== 18 || y > 4) && set(x, y);
  if (name === "battlement") for (let x = 10; x <= 21; x++) { for (let y = 4; y < 7; y++) set(x, y); x % 2 === 0 && set(x, 3); }
  if (name === "floating") for (let x = 12; x <= 19; x++) for (let y = 3; y <= 4; y++) (y === 3 || (x > 12 && x < 19)) && set(x, y);
  if (ceiling >= 0.5) for (let x = 0; x < 32; x++) { set(x, 0); (x % 5 !== 2) && set(x, 1); }
  return g;
}
// 함정 표시 (그림 위에 덧그림)
const HAZ_DRAW = {
  spikes: (G, x, y, w) => { G.fillStyle(0xd8d0c8); for (let i = 0; i < w; i += 5) G.fillTriangle(x + i, y, x + i + 2.5, y - 6, x + i + 5, y); },
  poison: (G, x, y, w) => { G.fillStyle(0x7ad040, 0.85).fillRect(x, y - 5, w, 5); G.fillStyle(0xc8ff80).fillRect(x + 3, y - 5, 4, 1).fillRect(x + w - 9, y - 4, 3, 1); },
  quicksand: (G, x, y, w) => { G.fillStyle(0xd8a860, 0.95).fillRect(x, y - 5, w, 5); G.fillStyle(0x9a7040).fillRect(x + w / 2 - 2, y - 3, 4, 1); },
  voidpool: (G, x, y, w) => { G.fillStyle(0x3a1a6a, 0.95).fillRect(x, y - 5, w, 5); G.fillStyle(0xc0a0ff).fillRect(x + 4, y - 5, 2, 1).fillRect(x + w - 8, y - 4, 2, 1); },
  firetrap: (G, x, y, w) => { for (const fx of [x + w * 0.3, x + w * 0.7]) { G.fillStyle(0x4a2a1a).fillRect(fx - 3, y - 2, 6, 2); G.fillStyle(0xff8a30).fillTriangle(fx - 3, y - 2, fx, y - 16, fx + 3, y - 2); G.fillStyle(0xffe080).fillTriangle(fx - 1.5, y - 2, fx, y - 9, fx + 1.5, y - 2); } },
  ice: (G, x, y, w) => { G.fillStyle(0xb8ecff, 0.75).fillRect(x, y - 2, w, 2); G.fillStyle(0xffffff).fillRect(x + 6, y - 2, 6, 1).fillRect(x + w - 20, y - 2, 4, 1); },
  runes: (G, x, y, w) => { for (const fx of [x + w * 0.25, x + w * 0.5, x + w * 0.75]) { G.lineStyle(1, 0xc8a0ff).strokeCircle(fx, y - 2, 4); G.fillStyle(0xe8d0ff).fillRect(fx - 1, y - 3, 2, 2); } },
};

export function drawCodex(P, K) {
  const { A, note, pin, R, q, j, SAVE, describe, itemIcon, mkItem, X0, Y0, X1, Y1 } = K;
  const sc = P.scene, T = SAVE.data;
  const S = (P.cx = P.cx ?? { ri: Math.max(0, FR_REGIONS.findIndex((r, i) => (FR_REGIONS[i + 1]?.start ?? 1e9) > (T.best ?? 0))), cat: 1, sel: 0, pat: null, anim: null, item: null });
  const ri = S.ri, REG = FR_REGIONS[ri], DOC = REGIONS[ri];
  const kills = (id) => (id.startsWith("frb") ? T.bossKills?.[id] : T.codex?.[id]) ?? 0;
  const tx = (x, y, s, st = "small", col = q.text, o = {}) => P.t(x, y, s, st, col, o).setDepth(206);
  const wrapW = (w) => ({ wordWrap: { width: w, useAdvancedWrap: !0 } });
  const click = (o, fn) => (o.setInteractive({ useHandCursor: !0 }).on("pointerdown", () => (j.play("click"), fn(), P.render())), o);
  const rect = (x, y, w, h, col, a = 1, d = 204) => A(P, sc.add.rectangle(x, y, w, h, col, a).setOrigin(0), d);
  const frameBox = (x, y, w, h, d = 205) => (A(P, sc.add.rectangle(x - 1, y - 1, w + 2, h + 2).setStrokeStyle(2, 0x3a2414).setOrigin(0), d), A(P, sc.add.rectangle(x - 3, y - 3, w + 6, h + 6).setStrokeStyle(1, 0x8a6a40, 0.8).setOrigin(0), d));
  const stamp = (x, y, txt = "미조사", col = 0xa02818, css = "#a02818") => {
    A(P, sc.add.circle(x, y, 13).setStrokeStyle(2, col, 0.8), 209).setRotation(-0.25);
    tx(x, y - 5, txt, "tiny", css).setOrigin(0.5, 0).setRotation(-0.25).setDepth(210);
  };
  P._anims = [];
  P._pend = [];

  // ── 가죽 표지 + 두 쪽 ──
  const BX = X0 + 4, BY = Y0 + 2, BW = X1 - X0 - 8, BH = Y1 - Y0 - 4;
  // 알비온식 창 안에서는 가죽 표지 없이 안쪽 판 두 장 (2026-11-28)
  const PW = Math.floor((BW - 30) / 2), PH = BH - 14, LX = BX + 10, RX = LX + PW + 10, PY = BY + 7;
  if (K.alb) (K.inset(LX - 6, PY - 4, PW + 6, PH + 8, 70), K.inset(RX, PY - 4, PW + 6, PH + 8, 71));
  else {
  A(P, sc.add.image(BX, BY, PAPER.woodKey(sc, BW, BH, { base: 0x5a2a1a, dark: 0x2a1008, hi: 0x8a4a2a, plank: 40 })).setOrigin(0), 202);
  A(P, sc.add.rectangle(BX + 3, BY + 3, BW - 6, BH - 6).setStrokeStyle(1, 0xc8a050, 0.6).setOrigin(0), 203);
  A(P, sc.add.image(LX + PW / 2, PY + PH / 2, PAPER.noteKey(sc, PW, PH, 70)), 203);
  A(P, sc.add.image(RX + PW / 2, PY + PH / 2, PAPER.noteKey(sc, PW, PH, 71)), 203);
  // 가운데 접힌 자국 (책등 그늘)
  rect(LX + PW - 6, PY, 6, PH, 0x3a2010, 0.18, 204);
  rect(RX, PY, 6, PH, 0x3a2010, 0.18, 204);
  rect(LX + PW, PY - 2, 10, PH + 4, 0x2a1008, 1, 203);
  }

  // ── 왼쪽 쪽: 지역 책갈피 ──
  const n = FR_REGIONS.length, cw = Math.floor((PW - 16) / n);
  FR_REGIONS.forEach((r, i) => {
    const x = LX + 8 + i * cw, on = i === ri, seen = (T.best ?? 0) >= r.start;
    const pal = r.pal;
    const b = rect(x, PY + 5, cw - 2, on ? 15 : 12, on ? pal.accent : pal.near, 1, 205);
    click(b, () => Object.assign(S, { ri: i, sel: 0, pat: null, anim: null, item: null, lp: 0 }));
    tx(x + (cw - 2) / 2, PY + 6, String(i + 1), "tiny", on ? "#1a0e06" : seen ? "#f2e6c4" : "#a89d82").setOrigin(0.5, 0);
  });
  // 제목
  const reached = (T.best ?? 0) >= REG.start;
  tx(LX + 10, PY + 24, `지역 ${ri + 1}`, "tiny", q.textDim);
  const ttl = tx(LX + 38, PY + 21, REG.name, "big", q.text);
  K.alb || tx(LX + PW - 10, PY + 24, `${REG.start}m ~ ${REG.end}m`, "tiny", q.textDim).setOrigin(1, 0);
  reached || stamp(LX + 38 + ttl.width + 18, PY + 29, "미답");
  // 분류 쪽지
  CATS.forEach((c, i) => {
    const x = LX + 8 + i * ((PW - 16) / 4), w = (PW - 16) / 4 - 4, on = i === S.cat;
    const nt = A(P, sc.add.image(x + w / 2, PY + 70, PAPER.noteKey(sc, w, 16, 80 + i)), 205);
    on || nt.setTint(0xc8b490);
    click(nt, () => Object.assign(S, { cat: i, sel: 0, anim: null }));
    tx(x + w / 2, PY + 64, c, "small", on ? q.text : q.textDim).setOrigin(0.5, 0).setDepth(207);
    on && pin(P, x + 6, PY + 64, 0xc83a2a);
  });
  rect(LX + 10, PY + 82, PW - 20, 1, 0x7a5434, 0.7, 205);
  const CY = PY + 88; // 왼쪽 내용 시작

  // ── 표본 그림: 지역 배경 + 그 지역 땅 위에 선 몬스터(움직임) ──
  const ground = () => paintPreview(sc, `cx_flat_${REG.id}`, patGrid("flat", 0), REG);
  const bgKey = `bg_${REG.id}`;
  !sc.textures.exists(bgKey + "_sky") && HOOKS.bg?.(sc, REG);
  preloadRegion(sc, ri);
  function scenery(x, y, w, h, groundH = 18) {
    // 하늘: 지역 색 그라데이션 → 배경 그림이 준비되면 덮는다
    const top = REG.pal.sky[0], bot = REG.pal.sky[1];
    const G = A(P, sc.add.graphics(), 204);
    G.fillGradientStyle(top, top, bot, bot, 1).fillRect(x, y, w, h);
    const bgs = [];
    const putBg = () => {
      if (!sc.textures.exists(bgKey + "_sky") || bgs.length) return;
      const sky = sc.textures.get(bgKey + "_sky").getSourceImage();
      bgs.push(A(P, sc.add.image(x, y, bgKey + "_sky").setOrigin(0).setDisplaySize(w, h), 204));
      for (const l of [0, 1, 2]) {
        const k = `${bgKey}_${l}`;
        if (!sc.textures.exists(k)) continue;
        const im = sc.textures.get(k).getSourceImage();
        const s = w / im.width, vh = (h / w) * im.width, cropTop = Math.max(0, Math.min(im.height - vh, 120 + l * 10));
        const o = A(P, sc.add.image(x, y - cropTop * s, k).setOrigin(0).setScale(s), 204);
        o.setCrop(0, cropTop, im.width, vh);
        bgs.push(o);
      }
    };
    putBg();
    // 땅: 지역 재질 그대로 그린 평지 한 줄
    if (groundH > 0) {
      const gk = ground(), gs = (w + 8) / 512;
      const gi = A(P, sc.add.image(x - 4, y + h - groundH - 7 * 16 * gs + 4, gk).setOrigin(0).setScale(gs), 205);
      gi.setCrop(0, 7 * 16 - 6, 512, Math.max(1, (groundH - 3) / gs));
    }
    frameBox(x, y, w, h);
    return { putBg, gy: y + h - groundH + 4 };
  }
  function specimen(x, y, w, h, id, o = {}) {
    const sv = scenery(x, y, w, h, o.groundH ?? 18);
    const spec = SPECS[id];
    const isFoe = !!spec?.model;
    const key = (spec?.boss || id.startsWith("frb") ? "b_" : "e_") + id;
    const spr = A(P, sc.add.sprite(x + w / 2, sv.gy, "__DEFAULT").setOrigin(0.5, 1).setVisible(!1), 206);
    const wait = tx(x + w / 2, y + h / 2 - 6, "그리는 중…", "tiny", "#f2e6c4", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(0.5);
    const st = { spr, id, spec, key, isFoe, ready: !1, names: [], cur: null, t: 0, frames: [], fps: 6, loop: !0, hold: 0, order: 0, mode: null, sv, box: [x, y, w, h], wait, cb: o.onReady };
    P._anims.push(st);
    tryReady(st);
    return st;
  }
  function tryReady(st) {
    st.sv.putBg();
    if (st.ready) return;
    const { spec, key, isFoe } = st;
    if (isFoe ? !spec._fi || !sc.textures.exists(key) : !sc.textures.exists(key)) return;
    st.ready = !0;
    st.wait.setVisible(!1);
    const tex = sc.textures.get(key), f0 = tex.get(0);
    const fw = f0.width, fh = f0.height, [x, y, w, h] = st.box;
    let s = Math.min((h - 14) / fh, (w - 10) / fw);
    s = s >= 2 ? 2 : s >= 1 ? 1 : Math.max(0.35, Math.round(s * 10) / 10);
    st.spr.setTexture(key, 0).setScale(s).setVisible(!0);
    // 움직임 목록
    if (isFoe) st.names = Object.keys(spec.anims).filter((nm) => spec._fi[nm]?.length);
    else st.names = ["idle", "move"].filter((nm) => sc.anims.exists(`${key}_${nm}`));
    st.names.length || (st.names = ["idle"]);
    play(st, st.mode && st.names.includes(st.mode) ? st.mode : st.names[0]);
    st.cb?.(st);
  }
  function play(st, nm) {
    st.cur = nm;
    st.t = 0;
    st.hold = 0;
    if (st.isFoe) {
      const a = st.spec.anims[nm];
      st.frames = st.spec._fi[nm] ?? [0];
      st.fps = a?.[1] ?? 6;
      st.loop = a?.[2] ?? !0;
    } else {
      const an = sc.anims.get(`${st.key}_${nm}`);
      st.frames = an ? an.frames.map((f) => f.textureFrame) : [0];
      st.fps = an?.frameRate ?? 6;
      st.loop = !0;
    }
    st.label?.setText(`${ANIM_KO[nm] ?? nm}`);
  }
  // 움직임 고르는 단추 (전체 = 차례로 자동 재생)
  function animChips(st, x, y, w) {
    const draw = () => {
      st.chips?.forEach((c) => c.destroy());
      st.chips = [];
      const list = ["전체", ...st.names];
      let cx = x, cy = y;
      for (const nm of list) {
        const lab = nm === "전체" ? "▶ 전체" : ANIM_KO[nm] ?? nm;
        const on = (nm === "전체" && !S.anim) || nm === S.anim;
        const t = P.t(0, 0, lab, "tiny", on ? "#f2e6c4" : q.text).setDepth(208);
        const bw = t.width + 8;
        cx + bw > x + w && ((cx = x), (cy += 13));
        const bg = A(P, sc.add.rectangle(cx, cy, bw, 11, on ? 0x5a3418 : 0xe8d4a8, 1).setOrigin(0).setStrokeStyle(1, 0x5a3418, 0.8), 207);
        t.setPosition(cx + 4, cy + 1);
        bg.setInteractive({ useHandCursor: !0 }).on("pointerdown", () => {
          j.play("click");
          S.anim = nm === "전체" ? null : nm;
          st.mode = S.anim;
          play(st, S.anim ?? st.names[0]);
          st.order = 0;
          draw();
        });
        st.chips.push(bg, t);
        cx += bw + 3;
      }
    };
    st.drawChips = draw;
    st.ready ? draw() : (st.cb = () => draw());
  }
  // 한 타이머로 모든 표본을 움직인다
  P._timer = sc.time.addEvent({
    delay: 1000 / 30, loop: !0,
    callback: () => {
      // 아직 그려지지 않았던 초상이 준비되면 쪽을 다시 그린다
      if (P._pend.length && (P._pt = (P._pt ?? 0) + 1) % 15 === 0 && P._pend.some((id) => SPECS[id]?._fi && sc.textures.exists("e_" + id))) return void P.render();
      for (const st of P._anims) {
        if (!st.ready) { tryReady(st); continue; }
        if (!st.spr.active) continue;
        st.t += 1 / 30;
        const n = st.frames.length, k = Math.floor(st.t * st.fps);
        let f;
        if (st.loop) f = st.frames[k % n];
        else {
          f = st.frames[Math.min(n - 1, k)];
          k >= n && (st.hold += 1 / 30);
        }
        st.spr.setFrame(f ?? 0);
        // 전체 보기: 반복 동작은 두 바퀴, 한 번 동작은 끝나고 잠깐 멈춘 뒤 다음으로
        if (!st.mode && st.names.length > 1) {
          const dur = st.loop ? Math.max(1.4, (2 * n) / st.fps) : n / st.fps + 0.5;
          if (st.t >= dur) ((st.order = (st.order + 1) % st.names.length), play(st, st.names[st.order]));
        } else if (!st.loop && st.hold > 0.6) ((st.t = 0), (st.hold = 0));
      }
    },
  });

  // ══ 분류별 ══
  const W = PW - 20, RXc = RX + 10;
  if (S.cat === 0) {
    // ── 지형: 왼쪽 = 풍경화 + 지역 정보, 오른쪽 = 지형 구조 표본 ──
    const sv = scenery(LX + 10, CY, W, 108, 0);
    P._anims.push({ ready: !1, sv, spec: {}, key: "__none__", isFoe: !1, wait: { setVisible() {} }, box: [] });
    let y = CY + 116;
    const row = (k, v, col = q.text) => {
      tx(LX + 12, y, k, "tiny", q.textDim);
      const t = tx(LX + 64, y, v, "tiny", col, wrapW(W - 56));
      y += Math.max(12, t.height + 3);
    };
    row("원소", DOC.element);
    row("지형 특징", DOC.gimmick);
    row("위험 요소", REG.hazards.map((h) => HAZ_KO[h] ?? h).join(" · "));
    row("하늘", REG.ceiling >= 0.5 ? "막힌 동굴 천장" : REG.ceiling > 0.15 ? "낮게 드리운 천장과 처마" : "탁 트인 하늘");
    row("빛깔", DOC.colors ?? "-");
    // 오른쪽
    const pats = Object.entries(REG.patterns).sort((a, b) => b[1] - a[1]);
    const cur = S.pat && REG.patterns[S.pat] ? S.pat : (pats.find(([p]) => p !== "flat") ?? pats[0])[0];
    tx(RXc, PY + 8, "지형 구조", "big", q.text);
    tx(RX + PW - 10, PY + 12, "실제 지역 재질로 그린 단면", "tiny", q.textDim).setOrigin(1, 0);
    const px = RXc, py = PY + 30, pw = W, ph = Math.round(pw * (ROWS * 16) / 512);
    const sv2 = scenery(px, py, pw, ph, 0);
    P._anims.push({ ready: !1, sv: sv2, spec: {}, key: "__none__", isFoe: !1, wait: { setVisible() {} }, box: [] });
    const k = paintPreview(sc, `cx_${cur}_${REG.id}_${REG.ceiling >= 0.5 ? 1 : 0}`, patGrid(cur, REG.ceiling), REG);
    A(P, sc.add.image(px, py, k).setOrigin(0).setScale(pw / 512), 205);
    const hz = HAZ_DRAW[cur];
    if (hz) {
      const G = A(P, sc.add.graphics(), 206), s = pw / 512;
      cur === "ice" || cur === "runes" || cur === "firetrap" ? hz(G, px + 9 * 16 * s, py + 7 * 16 * s, 14 * 16 * s) : hz(G, px + 13 * 16 * s, py + 8 * 16 * s, 6 * 16 * s);
    }
    frameBox(px, py, pw, ph);
    tx(px, py + ph + 5, `${PAT_KO[cur]?.[0] ?? cur}`, "small", q.text);
    tx(px, py + ph + 18, PAT_KO[cur]?.[1] ?? "", "tiny", q.textDim, wrapW(pw));
    // 출현 비율
    let yy = py + ph + 44;
    const tot = pats.reduce((a, [, v]) => a + v, 0);
    tx(px, yy, "이 지역에서 만나는 지형 (출현 비율)", "tiny", q.textDim);
    yy += 12;
    pats.forEach(([p, v], i) => {
      const x = px + (i % 2) * (pw / 2), y2 = yy + Math.floor(i / 2) * 13, on = p === cur;
      const hit = rect(x, y2 - 1, pw / 2 - 6, 12, on ? 0x5a3418 : 0x000000, on ? 0.15 : 0.001, 205);
      click(hit, () => (S.pat = p));
      tx(x + 2, y2, PAT_KO[p]?.[0] ?? p, "tiny", on ? q.red : q.text);
      rect(x + 62, y2 + 3, ((pw / 2 - 74) * v) / pats[0][1], 5, REG.pal.accent, 0.9, 206);
      tx(x + pw / 2 - 8, y2, `${Math.round((v / tot) * 100)}%`, "tiny", q.textDim).setOrigin(1, 0);
    });
  } else if (S.cat === 1) {
    // ── 몬스터: 파랑 지역 한 곳의 12종 (일반 9 + 정예 3). 쪽 번호 = bestiary.js page ──
    const list = [...FR_MONSTERS.filter((m) => m.page === ri), ...FR_ELITES.filter((m) => m.page === ri)];
    const many = list.length > 8, cols = many ? 6 : 4, cwid = Math.floor(W / cols), chgt = many ? 62 : 84;
    list.forEach((m, i) => {
      const x = LX + 10 + (i % cols) * cwid, y = CY + Math.floor(i / cols) * (chgt + 4), on = i === S.sel;
      const elite = FR_ELITES.includes(m);
      const card = rect(x + 1, y, cwid - 4, chgt, on ? 0xfff2cc : 0xe8d4a8, 1, 205).setStrokeStyle(on ? 2 : 1, on ? 0xa02818 : 0x7a5434);
      click(card, () => Object.assign(S, { sel: i, anim: null }));
      // 초상: 첫 동작의 첫 장
      const spec = SPECS[m.id], key = "e_" + m.id, ok = spec?.model ? spec._fi && sc.textures.exists(key) : sc.textures.exists(key);
      const bx = x + 4, by = y + 4, bw = cwid - 12, bh = many ? 34 : 50;
      const tp = REG.pal.sky[0], bt = REG.pal.sky[1];
      A(P, sc.add.graphics(), 206).fillGradientStyle(tp, tp, bt, bt, 1).fillRect(bx, by, bw, bh);
      if (ok) {
        const f = sc.textures.get(key).get(0), s = Math.min(1.2, (bh - 2) / f.height * 1.25, (bw - 2) / f.width * 1.25);
        const im = A(P, sc.add.image(bx + bw / 2, by + bh + 2, key, 0).setOrigin(0.5, 1).setScale(s), 207);
        kills(m.id) || im.setTint(0x6a5a4a);
        im.setCrop(0, 0, f.width, Math.min(f.height, (bh + 2) / s));
      } else (tx(bx + bw / 2, by + bh / 2 - 5, "?", "big", q.textDim).setOrigin(0.5, 0), P._pend.push(m.id));
      A(P, sc.add.rectangle(bx, by, bw, bh).setStrokeStyle(1, 0x3a2414).setOrigin(0), 207);
      elite && (rect(x + 1, y, 22, 10, 0xa02818, 1, 208), tx(x + 4, y, "정예", "tiny", "#f2e6c4").setDepth(209));
      tx(x + cwid / 2 - 1, y + bh + 7, m.name, "tiny", q.text, { ...wrapW(cwid - 8), align: "center" }).setOrigin(0.5, 0);
      kills(m.id) && tx(bx + bw - 2, by + bh - 10, `×${kills(m.id)}`, "tiny", "#f2e6c4", { stroke: "#140a04", strokeThickness: 3 }).setOrigin(1, 0).setDepth(208);
    });
    // 오른쪽: 표본
    const m = list[Math.min(S.sel, list.length - 1)];
    if (m) {
      const elite = FR_ELITES.includes(m);
      const doc = null;
      const st = specimen(RXc, PY + 8, W, 130, m.id);
      kills(m.id) || stamp(RXc + W - 18, PY + 26);
      let y = PY + 150;
      tx(RXc, y, m.name, "big", q.text);
      tx(RX + PW - 10, y + 4, elite ? "정예" : doc?.type ?? m.type ?? "", "tiny", elite ? q.red : q.textDim).setOrigin(1, 0);
      y += 19;
      const stat = (k, v, col) => (tx(RXc, y, k, "tiny", q.textDim), tx(RXc + 34, y, v, "tiny", col ?? q.text));
      stat("체력", `${doc?.hp ?? m.hp}`);
      doc?.weak && (tx(RXc + 80, y, "약점", "tiny", q.textDim), tx(RXc + 104, y, doc.weak, "tiny", q.green));
      doc?.resist && (tx(RXc + 150, y, "내성", "tiny", q.textDim), tx(RXc + 174, y, doc.resist, "tiny", q.red));
      doc?.count > 1 && tx(RXc + 80, y, `출현 ${doc.count}마리`, "tiny", q.textDim);
      y += 14;
      tx(RXc, y, "행동 기록", "tiny", q.textDim);
      const pt = tx(RXc, y + 11, doc?.pattern ?? m.pattern ?? "", "tiny", q.text, wrapW(W));
      y += 14 + pt.height;
      if (doc?.tip) {
        tx(RXc, y, "공략", "tiny", q.orange);
        const t = tx(RXc + 28, y, doc.tip, "tiny", q.text, wrapW(W - 28));
        y += t.height + 3;
      }
      y < PY + PH - 12 && (tx(RXc, y, "전리품", "tiny", q.textDim), tx(RXc + 40, y, doc?.drop ?? m.drop ?? "-", "tiny", q.gold, wrapW(W - 40)));
    }
  } else if (S.cat === 2) {
    // ── 보스 ──
    const b = FR_BOSSES[ri];
    const st = specimen(LX + 10, CY, W, 138, b.id, { groundH: 16 });
    kills(b.id) || stamp(LX + W - 8, CY + 18, "미토벌");
    let y = CY + 145;
    tx(LX + 10, y, b.name, "big", q.text);
    y += 17;
    tx(LX + 10, y, `「${b.title}」`, "tiny", q.orange);
    tx(LX + PW - 10, y, kills(b.id) ? `토벌 ${kills(b.id)}회` : "", "tiny", q.green).setOrigin(1, 0);
    // 오른쪽: 기록
    const bd = DOC.boss;
    tx(RXc, PY + 8, "토벌 기록", "big", q.text);
    let r = PY + 30;
    tx(RXc, r, "체력", "tiny", q.textDim), tx(RXc + 30, r, `${bd.hp}`, "tiny", q.text);
    tx(RXc + 80, r, "약점", "tiny", q.textDim), tx(RXc + 104, r, bd.weak, "tiny", q.green);
    tx(RXc + 150, r, "내성", "tiny", q.textDim), tx(RXc + 174, r, bd.resist, "tiny", q.red);
    r += 14;
    tx(RXc, r, "무대", "tiny", q.textDim);
    const sg = tx(RXc + 30, r, bd.stage, "tiny", q.text, wrapW(W - 30));
    r += sg.height + 6;
    bd.phases.forEach((ph, i) => {
      const bh = 12 + ph.patterns.length * 10;
      rect(RXc, r, W, bh, i ? 0x8a2a1a : 0x5a3418, 0.1, 205).setStrokeStyle(1, i ? 0xa02818 : 0x7a5434, 0.6);
      tx(RXc + 4, r + 2, `${i + 1}단계 · 체력 ${ph.range}`, "tiny", i ? q.red : q.text);
      ph.patterns.forEach((p, k) => tx(RXc + 10, r + 12 + k * 10, `· ${p}`, "tiny", q.text));
      r += bh + 3;
    });
    // 유물
    const relic = bd.relic && mkItem(bd.relic);
    if (relic && r < PY + PH - 30) {
      tx(RXc, r, "토벌 전리품 (유물)", "tiny", q.textDim);
      r += 11;
      const ic = A(P, sc.add.image(RXc + 12, r + 12, itemIcon(sc, relic)).setScale(1), 206);
      kills(b.id) || ic.setTint(0x6a5a4a);
      tx(RXc + 28, r + 2, relic.name, "small", q.gold);
      const raw = ITEMS.find((x) => x.id === bd.relic);
      tx(RXc + 28, r + 14, raw?.desc ?? "", "tiny", q.text, wrapW(W - 30));
    }
  } else {
    // ── 전리품: 이 지역에서 나오는 장비·스킬·마법·유물 ──
    const items = ITEMS.filter((x) => x.region === ri);
    const groups = [["weapon", "무기"], ["armor", "방어구"], ["skill", "스킬"], ["magic", "마법"]];
    // 줄 단위로 배치한 뒤 쪽을 나눈다 (쪽 아래로 넘치지 않게, ◀ ▶ 로 넘김)
    const sz = 22, per = Math.floor(W / (sz + 4)), lines = [], flat = [];
    for (const [kd, ko] of groups) {
      const L = items.filter((x) => x.kind === kd && !x.relic);
      if (!L.length) continue;
      lines.push({ h: 12, head: ko, col: q.textDim });
      for (let i = 0; i < L.length; i += per) lines.push({ h: sz + 4, row: L.slice(i, i + per) });
    }
    const relics = items.filter((x) => x.relic);
    if (relics.length) {
      lines.push({ h: 12, head: "유물 (보스)", col: q.orange });
      for (let i = 0; i < relics.length; i += per) lines.push({ h: sz + 4, row: relics.slice(i, i + per), relic: 1 });
    }
    for (const ln of lines) ln.row && flat.push(...ln.row.map((r) => r.id));
    const avail = PY + PH - 20 - CY, pages = [[]];
    let acc = 0;
    for (const ln of lines) {
      if (acc + ln.h > avail && pages[pages.length - 1].length) (pages.push([]), (acc = 0));
      // 머리글만 쪽 끝에 남지 않게
      pages[pages.length - 1].push(ln);
      acc += ln.h;
    }
    const pg = Math.min(S.lp ?? 0, pages.length - 1);
    let y = CY;
    for (const ln of pages[pg]) {
      if (ln.head) tx(LX + 10, y, ln.head, "tiny", ln.col);
      else
        ln.row.forEach((raw, i) => {
          const it = mkItem(raw.id);
          if (!it) return;
          const x = LX + 10 + i * (sz + 4), on = S.item === raw.id || (!S.item && raw.id === flat[0]);
          const bg = rect(x, y, sz, sz, on ? 0xfff2cc : ln.relic ? 0x8a5a10 : 0x3a2414, on ? 1 : ln.relic ? 0.25 : 0.2, 205).setStrokeStyle(on ? 2 : 1, on ? 0xa02818 : ln.relic ? 0xc89a40 : 0x7a5434);
          click(bg, () => (S.item = raw.id));
          A(P, sc.add.image(x + sz / 2, y + sz / 2, itemIcon(sc, it)).setScale((0.9 * sz) / 24), 206);
        });
      y += ln.h;
    }
    if (pages.length > 1) {
      const ny = PY + PH - 16;
      const prev = rect(LX + 10, ny, 18, 12, 0x5a3418, pg > 0 ? 1 : 0.3, 206);
      const next = rect(LX + PW - 28, ny, 18, 12, 0x5a3418, pg < pages.length - 1 ? 1 : 0.3, 206);
      pg > 0 && click(prev, () => (S.lp = pg - 1));
      pg < pages.length - 1 && click(next, () => (S.lp = pg + 1));
      tx(LX + 19, ny + 1, "◀", "tiny", "#f2e6c4").setOrigin(0.5, 0).setDepth(207);
      tx(LX + PW - 19, ny + 1, "▶", "tiny", "#f2e6c4").setOrigin(0.5, 0).setDepth(207);
      tx(LX + PW / 2, ny + 1, `${pg + 1} / ${pages.length}쪽 · 전리품 ${flat.length}종`, "tiny", q.textDim).setOrigin(0.5, 0);
    }
    let descEnd = PY + 70;
    const cur = S.item ?? flat[0];
    const raw = ITEMS.find((x) => x.id === cur), it = cur && mkItem(cur);
    if (it) {
      tx(RXc, PY + 8, "전리품 기록", "big", q.text);
      A(P, sc.add.rectangle(RXc, PY + 30, 34, 34, 0x3a2414, 0.25).setOrigin(0).setStrokeStyle(1, 0x7a5434), 205);
      A(P, sc.add.image(RXc + 17, PY + 47, itemIcon(sc, it)).setScale(1.3), 206);
      tx(RXc + 42, PY + 30, it.name, "small", raw?.relic ? q.gold : q.text);
      tx(RXc + 42, PY + 44, `${KIND_KO[raw?.kind] ?? ""}${raw?.relic ? " · 유물" : ""}${raw?.boss ? ` · ${raw.boss}` : ""}`, "tiny", q.textDim, wrapW(W - 44));
      try { descEnd = describe(P, it, RXc, PY + 70, W); } catch (e) { descEnd = PY + 70 + tx(RXc, PY + 70, raw?.desc ?? "", "tiny", q.text, wrapW(W)).height; }
    }
    // 몬스터 전리품 표 (오른쪽 아래)
    const drops = [...FR_MONSTERS, ...FR_ELITES].filter((m) => m.page === ri).slice(0, 8);
    const bottom = PY + PH - 8, fit = Math.floor((bottom - (descEnd + 18)) / 11);
    let r = Math.max(descEnd + 8, bottom - 11 - Math.min(fit, drops.length) * 11);
    fit >= 2 && (rect(RXc, r - 4, W, 1, 0x7a5434, 0.6, 205), tx(RXc, r, "몬스터가 떨어뜨리는 것", "tiny", q.textDim));
    r += 11;
    drops.slice(0, Math.max(0, fit)).forEach((d, i) => {
      const name = d.name;
      tx(RXc, r, name, "tiny", q.text);
      tx(RX + PW - 10, r, d.drop ?? "-", "tiny", q.gold).setOrigin(1, 0);
      r += 11;
    });
  }
}
export function stopCodex(P) {
  P._timer?.remove();
  P._timer = null;
  P._anims = [];
}

// ══════════ 새 도감 (2026-11-28): 지금 세계 기준 ══════════
//   왼쪽 = 7×7 세계 지도(구역 고르기) + 구역 정보 · 가운데 = 층 띠 3줄 × 4종 + 지역 보스 · 오른쪽 = 움직이는 표본 + 기록
//   자료: zones.js(구역·고리·층·보스 자리) · bestiary.js(구역별 12종) · world.js(보스) · regions.json(보스 단계)
const BAND_KO = { ground: "지표", sky: "하늘섬", under: "땅속", low: "아래 섬 줄", mid: "가운데", high: "위 섬 줄", top: "윗층", bot: "아랫층" };
const BAND_ORDER = ["sky", "high", "top", "ground", "mid", "under", "low", "bot"];
const RING_C = [null, [0x4a90ff, "파랑", "위험 낮음"], [0xffc83a, "노랑", "위험"], [0xff4a3a, "빨강", "매우 위험 · 봉인"]];
export function drawZoneCodex(P, K) {
  const { A, R, j, SAVE, X0, Y0, X1, Y1, H } = K; // H: 알비온 그리기 도우미 (secHead, at, bold, dt, inset, colHead)
  const sc = P.scene, T = SAVE.data;
  const ZN = K.ZN, seen = K.seen ?? {};
  const kills = (id) => (id.startsWith("frb") ? T.bossKills?.[id] : T.codex?.[id]) ?? 0;
  const zones = ZN.ZONES.filter((z) => z.kind === "zone");
  const bestZones = zones.filter((z) => BESTIARY[z.id]);
  const S = (P.cz = P.cz ?? { zid: (bestZones.find((z) => seen[z.id]) ?? bestZones[0]).id, sel: null, anim: null });
  const Z = ZN.BY_ID[S.zid], B = BESTIARY[S.zid], reg = Z.reg;
  const click = (o, fn) => (o.setInteractive({ useHandCursor: !0 }).on("pointerdown", () => (j.play("click"), fn(), P.render())), o);
  const rect = (x, y, w, h, col, a = 1, d = 204) => A(P, sc.add.rectangle(x, y, w, h, col, a).setOrigin(0), d);
  P._anims = [];
  P._pend = [];
  // 몬스터 목록 (층 띠 순서: 위 → 아래)
  const bands = B ? Object.keys(B.bands).sort((a, b) => BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b)) : [];
  const roster = bands.flatMap((bd) => B.bands[bd].map((m) => ({ ...m, band: bd })));
  const bossId = Z.boss ? reg?.boss : null, boss = bossId ? FR_BOSSES.find((b) => b.id === bossId) : null;
  preloadRegion(sc, 0, [...roster.map((m) => m.id), ...(bossId ? [bossId] : [])]);
  S.sel = S.sel && (roster.some((m) => m.id === S.sel) || S.sel === bossId) ? S.sel : roster[0]?.id ?? bossId;
  S.bossId = bossId;
  // 보스 그림은 미리 만들기(일꾼)에서 빠지는 일이 있어 이 구역 보스 하나만 바로 만든다
  if (bossId && SPECS[bossId]?.model && !SPECS[bossId]._fi) try { ensureFoe(sc, bossId); } catch (e) {}

  // ── 왼쪽: 세계 지도 ──
  const LW = 168, lx = X0, ly = Y0 + 2;
  const found = bestZones.filter((z) => roster && seen[z.id]).length;
  H.secHead(lx, ly, LW, "세계 지도", `밟은 땅 ${found} / ${bestZones.length}`);
  const CS = 21, gx = lx + Math.floor((LW - 7 * CS) / 2), gy = ly + 26;
  H.dt(gx + (7 * CS) / 2, ly + 15, "▲ 하늘", "tiny", ALB_LABEL).setOrigin(0.5, 0);
  for (let yy = -3; yy <= 3; yy++)
    for (let xx = -3; xx <= 3; xx++) {
      const x = gx + (xx + 3) * CS, y = gy + (yy + 3) * CS;
      const z = ZN.cell(xx, yy);
      if (z === ZN.HUB_ID) {
        rect(x, y, CS - 1, CS - 1, 0x3a302a, 1, 204);
        A(P, sc.add.image(x + CS / 2, y + CS / 2, "icon_flag"), 205);
        continue;
      }
      if (!z) continue;
      const [col] = RING_C[z.ring], isSeen = !!seen[z.id], has = !!BESTIARY[z.id], on = z.id === S.zid;
      const c = rect(x, y, CS - 1, CS - 1, col, has ? (isSeen ? 0.85 : 0.4) : 0.18, 204);
      has || rect(x + 3, y + CS / 2 - 1, CS - 7, 1, 0x3a2414, 0.5, 205);
      z.boss && A(P, sc.add.circle(x + CS - 5, y + 4, 2, 0xa01818).setStrokeStyle(1, 0xfff0d0, 0.8), 206);
      isSeen && rect(x + 2, y + CS - 5, 3, 3, 0xffffff, 0.9, 206);
      on && A(P, sc.add.rectangle(x - 1, y - 1, CS + 1, CS + 1).setOrigin(0).setStrokeStyle(2, 0x2a1408), 207);
      click(c, () => Object.assign(S, { zid: z.id, sel: null, anim: null }));
    }
  H.dt(gx + (7 * CS) / 2, gy + 7 * CS + 1, "▼ 땅속", "tiny", ALB_LABEL).setOrigin(0.5, 0);
  // 구역 정보
  let iy = gy + 7 * CS + 14;
  const [rc, rn, rl] = RING_C[Z.ring];
  A(P, sc.add.rectangle(lx + 2, iy + 3, 8, 8, rc).setOrigin(0).setStrokeStyle(1, 0x2a1a10), 206);
  H.bold(lx + 14, iy, Z.name, "small");
  iy += 15;
  const known = roster.filter((m) => kills(m.id) > 0).length;
  const info = [
    ["층", ZN.LAYER_NAME(Z.y)],
    ["위험", `${rn} 고리 · ${rl}`],
    ["세기 단계", `${Z.lvl + 1} / 12  (드롭 T${Math.min(6, Z.lvl + 1)} 중심)`],
    ["지역 보스", boss ? (kills(bossId) || seen[Z.id] ? boss.name : "???") : "없음"],
    ["발견한 몬스터", B ? `${known} / ${roster.length}` : "-"],
  ];
  info.forEach(([a, b], k) => {
    const y = iy + k * 12;
    k % 2 || rect(lx, y, LW, 12, 0x5a3a22, 0.07, 203.5);
    H.at(lx + 4, y + 2, a, "tiny", ALB_LABEL);
    H.bold(lx + LW - 4, y + 2, b, "tiny").setOrigin(1, 0);
  });

  // ── 가운데: 층 띠별 몬스터 카드 ──
  const mx = X0 + LW + 8, MW = 206, CW = 47, CH = 40;
  const card = (x, y, m, isBoss) => {
    const id = m.id, n = kills(id), on = S.sel === id;
    // 칸: 철 테 + 짙은 청회색 + 구역 하늘색 아래 그림자
    rect(x, y, CW, CH, on ? 0xc8a050 : 0x25262a, 1, 205);
    rect(x + 1, y + 1, CW - 2, CH - 2, on ? 0xf0d488 : 0x6a6b6e, 1, 205);
    const top = reg?.pal?.sky?.[0] ?? 0x34393f, bot = reg?.pal?.sky?.[1] ?? 0x383f45;
    A(P, sc.add.graphics(), 205.5).fillGradientStyle(top, top, bot, bot, 1).fillRect(x + 2, y + 2, CW - 4, CH - 4);
    rect(x + 2, y + CH - 8, CW - 4, 6, 0x2a2018, 0.55, 205.6);
    const spec = SPECS[id], key = (isBoss ? "b_" : "e_") + id;
    const ok = spec?.model ? spec._fi && sc.textures.exists(key) : sc.textures.exists(key);
    if (ok) {
      const f = sc.textures.get(key).get(0), s = Math.min(1, (CH - 4) / f.height * 1.15, (CW - 4) / f.width * 1.15);
      const im = A(P, sc.add.image(x + CW / 2, y + CH - 2, key, 0).setOrigin(0.5, 1).setScale(s), 206);
      im.setCrop(0, Math.max(0, f.height - (CH - 4) / s), f.width, (CH - 4) / s);
      n || im.setTint(0x1a1410).setAlpha(0.85);
    } else (H.at(x + CW / 2, y + CH / 2 - 5, "…", "small", "#f2e6c4").setOrigin(0.5, 0), P._pend.push(id));
    m.e && (rect(x + 1, y + 1, 19, 9, 0xa02818, 1, 207), H.dt(x + 3, y + 1, "정예", "tiny", "#f8e8d0").setDepth(208));
    n && H.dt(x + CW - 3, y + CH - 11, `×${n}`, "tiny", "#ffffff").setOrigin(1, 0).setDepth(208);
    const hit = rect(x, y, CW, CH, 0, 0.001, 209);
    click(hit, () => Object.assign(S, { sel: id, anim: null }));
  };
  if (!B) {
    H.secHead(mx, ly, MW, "봉인된 땅");
    H.inset(mx, ly + 18, MW, 120, 31);
    H.at(mx + 10, ly + 28, `${Z.name}`, "small", "#4a2b16");
    H.at(mx + 10, ly + 46, "빨강 고리는 아직 봉인되어 있다.\n들어갈 수 없으니 기록도 없다.\n\n파랑·노랑 구역을 골라 보자.", "tiny", ALB_LABEL, { lineSpacing: 3 });
  } else {
    bands.forEach((bd, k) => {
      const y = ly + k * (CH + 34), L = B.bands[bd];
      H.secHead(mx, y, MW, BAND_KO[bd] ?? bd, `${L.filter((m) => kills(m.id) > 0).length} / ${L.length} 발견`);
      L.forEach((m, i) => {
        const x = mx + i * (CW + 6) + 1;
        card(x, y + 16, { ...m, band: bd });
        H.at(x + CW / 2, y + 16 + CH + 2, kills(m.id) ? cutName(m.name, 6) : "???", "tiny", kills(m.id) ? "#4a2b16" : ALB_LABEL).setOrigin(0.5, 0);
      });
    });
    // 지역 보스
    const by = ly + 3 * (CH + 34);
    H.secHead(mx, by, MW, "지역 보스", boss ? (kills(bossId) ? `토벌 ×${kills(bossId)}` : "미토벌") : "");
    if (boss) {
      card(mx + 1, by + 16, { id: bossId }, 1);
      H.bold(mx + CW + 8, by + 18, kills(bossId) || seen[Z.id] ? boss.name : "???", "small");
      H.at(mx + CW + 8, by + 32, kills(bossId) ? `「${boss.title}」` : "이 구역 깊은 곳에 산다", "tiny", ALB_LABEL);
      H.at(mx + CW + 8, by + 44, `체력 ${boss.hp}`, "tiny", "#4a2b16");
    } else H.at(mx + 4, by + 20, "이 구역에는 지역 보스가 없다.\n지도의 붉은 점이 보스가 사는 구역.", "tiny", ALB_LABEL, { lineSpacing: 2 });
  }

  // ── 오른쪽: 표본 + 기록 ──
  const rx = mx + MW + 8, RW = X1 - rx, ry = ly;
  const isBoss = S.sel && S.sel === bossId;
  const m = isBoss ? null : roster.find((x) => x.id === S.sel);
  if (!S.sel || (!m && !isBoss)) return startTimer();
  const n = kills(S.sel);
  const PH = 96;
  const st = specimen(rx, ry, RW, PH, S.sel, isBoss);
  n || stamp(rx + RW - 16, ry + 16, isBoss ? "미토벌" : "미조사");
  let y = ry + PH + 5;
  const name = isBoss ? boss.name : m.name;
  H.bold(rx, y, n || (isBoss && seen[Z.id]) ? name : "???", "body", n ? "#4a2b16" : "#76563f");
  H.at(X1, y + 3, isBoss ? "지역 보스" : m.e ? "정예" : m.type, "tiny", isBoss || m.e ? "#8a1a0e" : ALB_LABEL).setOrigin(1, 0);
  y += 16;
  const rows = isBoss
    ? [["체력", `${boss.hp}`], ["약점", EL_KO[boss.weak]?.ko ?? boss.weak ?? "-"], ["내성", EL_KO[boss.resist]?.ko ?? boss.resist ?? "-"], ["토벌", n ? `${n}회` : "아직"]]
    : [["체력", n ? `${m.hp}` : "?"], ["무리", `${m.pack[0]}${m.pack[1] > m.pack[0] ? `~${m.pack[1]}` : ""}마리`], ["사는 곳", `${Z.name} · ${BAND_KO[m.band] ?? m.band}`], ["처치", n ? `${n}마리` : "아직"]];
  rows.forEach(([a, b], k) => {
    const yy = y + k * 12;
    k % 2 || rect(rx, yy, RW, 12, 0x5a3a22, 0.07, 203.5);
    H.at(rx + 4, yy + 2, a, "tiny", ALB_LABEL);
    H.bold(rx + RW - 4, yy + 2, b, "tiny").setOrigin(1, 0);
  });
  y += rows.length * 12 + 4;
  H.at(rx, y, isBoss ? "싸움 기록" : "행동 기록", "tiny", ALB_LABEL);
  y += 11;
  let txt;
  if (isBoss) {
    const bd = REGIONS[boss.region]?.boss;
    txt = n && bd ? bd.phases.map((ph, i) => `${i + 1}단계(${ph.range}) ${ph.patterns.slice(0, 2).join(" · ")}`).join("\n") : "토벌하면 단계별 행동이 기록된다.";
  } else txt = n ? m.pattern : "한 번 처치하면 행동이 기록된다.";
  const pt = H.at(rx, y, txt, "tiny", n ? "#5a3c24" : ALB_LABEL, { wordWrap: { width: RW, useAdvancedWrap: !0 }, lineSpacing: 1 });
  y += pt.height + 4;
  // 움직임 고르기 (처치한 몬스터만)
  n && animChips(st, rx, Math.max(y, Y1 - 26), RW);
  startTimer();

  // ── 표본 그리기 (구역 하늘 + 땅 + 움직이는 몬스터) ──
  function specimen(x, y, w, h, id, boss) {
    const top = reg?.pal?.sky?.[0] ?? 0x3a5a8a, bot = reg?.pal?.sky?.[1] ?? 0xc8d8e8;
    A(P, sc.add.graphics(), 204).fillGradientStyle(top, top, bot, bot, 1).fillRect(x, y, w, h);
    const gH = 16;
    try {
      const gk = paintPreview(sc, `cz_flat_${Z.id}`, flatGrid(), reg), gs = (w + 8) / 512;
      const gi = A(P, sc.add.image(x - 4, y + h - gH - 7 * 16 * gs + 4, gk).setOrigin(0).setScale(gs), 205);
      gi.setCrop(0, 7 * 16 - 6, 512, Math.max(1, (gH - 3) / gs));
    } catch (e) {
      rect(x, y + h - gH, w, gH, reg?.pal?.top ?? 0x5a7a3a, 1, 205);
    }
    A(P, sc.add.rectangle(x - 1, y - 1, w + 2, h + 2).setStrokeStyle(2, 0x25262a).setOrigin(0), 207);
    A(P, sc.add.rectangle(x - 2, y - 2, w + 4, h + 4).setStrokeStyle(1, 0x8a8c90, 0.8).setOrigin(0), 207);
    const spec = SPECS[id], isFoe = !!spec?.model, key = (boss ? "b_" : "e_") + id;
    const spr = A(P, sc.add.sprite(x + w / 2, y + h - gH + 4, "__DEFAULT").setOrigin(0.5, 1).setVisible(!1), 206);
    const wait = H.dt(x + w / 2, y + h / 2 - 6, "그리는 중…", "tiny", "#f2e6c4").setOrigin(0.5, 0);
    const s0 = { spr, id, spec, key, isFoe, ready: !1, names: [], cur: null, t: 0, frames: [], fps: 6, loop: !0, hold: 0, order: 0, mode: S.anim, box: [x, y, w, h], wait, dark: !kills(id) };
    P._anims.push(s0);
    tryReady(s0);
    return s0;
  }
  function tryReady(s0) {
    if (s0.ready) return;
    const { spec, key, isFoe } = s0;
    if (isFoe ? !spec._fi || !sc.textures.exists(key) : !sc.textures.exists(key)) return;
    s0.ready = !0;
    s0.wait.setVisible(!1);
    const f0 = sc.textures.get(key).get(0), [, , w, h] = s0.box;
    let s = Math.min((h - 14) / f0.height, (w - 10) / f0.width);
    s = s >= 2 ? 2 : s >= 1 ? 1 : Math.max(0.35, Math.round(s * 10) / 10);
    s0.spr.setTexture(key, 0).setScale(s).setVisible(!0);
    s0.dark && s0.spr.setTint(0x1a1410);
    s0.names = isFoe ? Object.keys(spec.anims).filter((nm) => spec._fi[nm]?.length) : ["idle", "move"].filter((nm) => sc.anims.exists(`${key}_${nm}`));
    s0.names.length || (s0.names = ["idle"]);
    play(s0, s0.mode && s0.names.includes(s0.mode) ? s0.mode : s0.names[0]);
    s0.cb?.(s0);
  }
  function play(s0, nm) {
    s0.cur = nm;
    s0.t = 0;
    s0.hold = 0;
    if (s0.isFoe) {
      const a = s0.spec.anims[nm];
      s0.frames = s0.spec._fi[nm] ?? [0];
      s0.fps = a?.[1] ?? 6;
      s0.loop = a?.[2] ?? !0;
    } else {
      const an = sc.anims.get(`${s0.key}_${nm}`);
      s0.frames = an ? an.frames.map((f) => f.textureFrame) : [0];
      s0.fps = an?.frameRate ?? 6;
      s0.loop = !0;
    }
  }
  function animChips(s0, x, y, w) {
    const draw = () => {
      s0.chips?.forEach((c) => c.destroy());
      s0.chips = [];
      let cx = x, cy = y;
      for (const nm of ["전체", ...s0.names]) {
        const lab = nm === "전체" ? "▶ 전체" : ANIM_KO[nm] ?? nm, on = (nm === "전체" && !S.anim) || nm === S.anim;
        const t = P.t(0, 0, lab, "tiny", on ? "#f6e4c8" : "#4a2b16").setDepth(208);
        const bw = t.width + 8;
        if (cx + bw > x + w) ((cx = x), (cy += 12));
        if (cy > Y1 - 10) (t.destroy());
        else {
          const bg = A(P, sc.add.rectangle(cx, cy, bw, 11, on ? 0x3a302a : 0xe0c49c, 1).setOrigin(0).setStrokeStyle(1, 0x3a302a, 0.8), 207);
          t.setPosition(cx + 4, cy + 1);
          bg.setInteractive({ useHandCursor: !0 }).on("pointerdown", () => {
            j.play("click");
            S.anim = nm === "전체" ? null : nm;
            s0.mode = S.anim;
            play(s0, S.anim ?? s0.names[0]);
            s0.order = 0;
            draw();
          });
          s0.chips.push(bg, t);
        }
        cx += bw + 3;
      }
    };
    s0.ready ? draw() : (s0.cb = () => draw());
  }
  function stamp(x, y, txt) {
    A(P, sc.add.circle(x, y, 13).setStrokeStyle(2, 0xa02818, 0.8), 209).setRotation(-0.25);
    H.at(x, y - 5, txt, "tiny", "#a02818").setOrigin(0.5, 0).setRotation(-0.25).setDepth(210);
  }
  function startTimer() {
    P._timer = sc.time.addEvent({
      delay: 1000 / 30, loop: !0,
      callback: () => {
        if (P._pend.length && (P._pt = (P._pt ?? 0) + 1) % 15 === 0 && P._pend.some((id) => SPECS[id]?._fi && (sc.textures.exists("e_" + id) || sc.textures.exists("b_" + id)))) return void P.render();
        for (const s0 of P._anims) {
          if (!s0.ready) { tryReady(s0); continue; }
          if (!s0.spr.active) continue;
          s0.t += 1 / 30;
          const n2 = s0.frames.length, k = Math.floor(s0.t * s0.fps);
          let f;
          if (s0.loop) f = s0.frames[k % n2];
          else ((f = s0.frames[Math.min(n2 - 1, k)]), k >= n2 && (s0.hold += 1 / 30));
          s0.spr.setFrame(f ?? 0);
          if (!s0.mode && s0.names.length > 1) {
            const dur = s0.loop ? Math.max(1.4, (2 * n2) / s0.fps) : n2 / s0.fps + 0.5;
            s0.t >= dur && ((s0.order = (s0.order + 1) % s0.names.length), play(s0, s0.names[s0.order]));
          } else if (!s0.loop && s0.hold > 0.6) ((s0.t = 0), (s0.hold = 0));
        }
      },
    });
  }
}
const ALB_LABEL = "#76563f";
const cutName = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const flatGrid = () => patGrid("flat", 0);
