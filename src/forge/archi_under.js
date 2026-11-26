import { GSKY } from "./archi_groundsky.js";
// 지하 지역 설정 (각진 갱도·방 생성기 angular.js): 지역마다 지구 이름 · 재질 · 방 짜임 · 소품이 다르다
//   지구 칸: 입구 줄 위 (서 · 가운데 · 동) / 입구 줄 / 입구 줄 밑 (서 · 가운데 · 동)
import { angular } from "./angular.js";
import { SIG, SHAPE } from "./archi_sig.js";
import { mossbark } from "./archi_mossbark.js";
import { glassdune } from "./archi_glassdune.js";
import { blackmarsh } from "./archi_blackmarsh.js";

const EN = 600;
const T = {
  mine: ["collapse", "pillars", "bunks", "pit", "vault", "steps", "workshop", "ell"],
  fort: ["pillars", "balcony", "vault", "bunks", "shrine", "tower", "cage", "split"],
  water: ["cistern", "pit", "balcony", "vault", "cistern", "steps", "split"],
  crystal: ["ore", "steps", "vault", "ore", "collapse", "tower", "ell"],
  work: ["workshop", "pillars", "vault", "balcony", "steps", "cistern", "split"],
  temple: ["shrine", "library", "pillars", "vault", "balcony", "split", "tower"],
  lair: ["collapse", "pit", "ore", "vault", "steps", "cage", "ell"],
  root: ["ell", "pit", "steps", "vault", "collapse", "balcony", "cistern"],
  crypt: ["vault", "shrine", "cage", "pillars", "library", "split", "pit"],
};
// d(이름, 재질, 짜임, 소품 셋)
const d = (n, m, t, props) => ({ n, m, t: T[t], props });
// 지구 고르기: 7칸 [위 서, 위 가운데, 위 동, 대로, 밑 서, 밑 가운데, 밑 동]
const grid = (L, en = EN) => (x, f) => (f === en ? L[3] : f < en ? L[x < 340 ? 0 : x < 680 ? 1 : 2] : L[x < 340 ? 4 : x < 680 ? 5 : 6]);

const CAVES = {
  // ── 파랑 ──
  g0_1: { seed: 0x1e0a5, peak: [512], deep: [512], L: [
    d("옛 갱도", "wood", "mine", ["p_rubble", "p_cart", "p_chain"]), d("갱구 마을", "wood", "work", ["p_lamp", "p_crates", "p_anvil"]), d("코볼트 요새", "brick", "fort", ["p_banner", "p_rack", "p_brazier"]),
    d("광차 대로", "wood", "work", ["p_cart", "p_lamp", "p_crates"]),
    d("수몰 갱", "wood", "water", ["p_wheel", "p_crates", "p_chain"]), d("용광로 지구", "brick", "work", ["p_brazier", "p_anvil", "p_drill"]), d("결정 굴", "rock", "crystal", ["p_crystal", "p_ore", "p_crystal"])] },
  g1_1: { seed: 0xd5e11, peak: [600], deep: [420], L: [
    d("종유석 회랑", "rock", "crystal", ["p_stalag", "p_crystal", "p_boulder"]), d("수몰 사원 윗층", "brick", "temple", ["p_statue", "p_candles", "p_urn"]), d("석회 계단굴", "rock", "water", ["p_stalag", "p_fern", "p_urn"]),
    d("호숫가 길", "rock", "water", ["p_lamp", "p_stalag", "p_urn"]),
    d("잠긴 수로", "brick", "water", ["p_urn", "p_chain", "p_font"]), d("수몰 사원 밑층", "brick", "temple", ["p_sarcoph", "p_statue", "p_candles"]), d("뱀장어 굴", "rock", "lair", ["p_bones", "p_crystal", "p_stalag"])] },
  gm1_1: { seed: 0x2a07, peak: [470], deep: [640], L: [
    d("곧은뿌리 방", "wood", "root", ["p_roots", "p_shroom", "p_urn"]), d("뿌리 저장고", "wood", "work", ["p_crates", "p_shroom", "p_log"]), d("뿌리 매듭 굴", "wood", "root", ["p_roots", "p_nest", "p_web"]),
    d("뿌리 다리", "wood", "root", ["p_log", "p_shroom", "p_roots"]),
    d("포자 늪굴", "wood", "water", ["p_shroom", "p_fern", "p_nest"]), d("뿌리 심장", "wood", "temple", ["p_altar", "p_roots", "p_shroom"]), d("고목 무덤", "brick", "crypt", ["p_sarcoph", "p_skulls", "p_candles"])] },
  // ── 노랑 동굴 ──
  g0_2: { seed: 0x5d0e, peak: [512], deep: [512], L: [
    d("벼랑 도시 윗동네", "brick", "fort", ["p_lamp", "p_urn", "p_chain"]), d("그림자 시장", "wood", "work", ["p_crates", "p_lamp", "p_rack"]), d("파수꾼 망루", "brick", "fort", ["p_brazier", "p_rack", "p_banner"]),
    d("돌다리 길", "brick", "fort", ["p_lamp", "p_chain", "p_cage"]),
    d("그림자 감옥", "brick", "crypt", ["p_cage", "p_chain", "p_bones"]), d("무너진 성당", "brick", "temple", ["p_altar", "p_candles", "p_statue"]), d("발광 균열", "rock", "crystal", ["p_crystal", "p_ore", "p_crystal"])] },
  g1_2: { seed: 0x2c879, peak: [150], deep: [512], L: [
    d("발굴 야영지", "wood", "work", ["p_yurt", "p_crates", "p_lamp"]), d("등뼈 굴", "rock", "lair", ["p_bones", "p_skulls", "p_rubble"]), d("머리뼈 동굴", "brick", "temple", ["p_skulls", "p_candles", "p_altar"]),
    d("화석 대로", "wood", "mine", ["p_bones", "p_cart", "p_lamp"]),
    d("갈비뼈 공동", "rock", "lair", ["p_bones", "p_ore", "p_skulls"]), d("도굴꾼 은신처", "wood", "mine", ["p_crates", "p_rack", "p_urn"]), d("타르 늪굴", "rock", "water", ["p_bones", "p_skulls", "p_urn"])] },
  gm1_2: { seed: 0x5b1d, peak: [760], deep: [530], L: [
    d("고치 방", "wood", "lair", ["p_web", "p_nest", "p_bones"]), d("거미줄 회랑", "rock", "lair", ["p_web", "p_cage", "p_bones"]), d("빛 구멍 굴", "rock", "crystal", ["p_moss", "p_crystal", "p_web"]),
    d("줄 친 굴", "rock", "lair", ["p_web", "p_bones", "p_skulls"]),
    d("알 무덤", "rock", "crypt", ["p_hive", "p_bones", "p_web"]), d("여왕의 방", "brick", "temple", ["p_nest", "p_skulls", "p_altar"]), d("독 웅덩이", "rock", "water", ["p_shroom", "p_web", "p_bones"])] },
  g2_2: { seed: 0x2c879, peak: [380], deep: [512], L: [
    d("결정 기둥 정원", "rock", "crystal", ["p_crystal", "p_crystal", "p_ore"]), d("거울 미궁 윗층", "brick", "split" in T ? "fort" : "fort", ["p_crystal", "p_lamp", "p_statue"]), d("거울 방", "brick", "temple", ["p_crystal", "p_candles", "p_statue"]),
    d("유리 대로", "rock", "crystal", ["p_crystal", "p_lamp", "p_ore"]),
    d("프리즘 홀", "brick", "temple", ["p_crystal", "p_altar", "p_font"]), d("거울 미궁 밑층", "brick", "fort", ["p_crystal", "p_statue", "p_urn"]), d("빛의 우물", "rock", "crystal", ["p_crystal", "p_font", "p_crystal"])] },
  gm2_2: { seed: 0x3157, peak: [462], deep: [475], boss: 896, L: [
    d("안개 숲굴", "rock", "root", ["p_dead", "p_fern", "p_bones"]), d("달빛 틈", "rock", "temple", ["p_moss", "p_flowers", "p_altar"]), d("사슴뿔 아치", "rock", "lair", ["p_bones", "p_dead", "p_skulls"]),
    d("안개 길", "rock", "root", ["p_dead", "p_fern", "p_lamp"]),
    d("사슴 뼈 무덤", "brick", "crypt", ["p_sarcoph", "p_skulls", "p_candles"]), d("뿔 사당", "brick", "temple", ["p_altar", "p_candles", "p_bones"]), d("안개 호숫가", "rock", "water", ["p_dead", "p_moss", "p_fern"])] },
  g2_1: { seed: 0x6a51, peak: [520], deep: [520], L: [
    d("유리 공방", "brick", "work", ["p_anvil", "p_crystal", "p_shelf"]), d("별 유리 천문대", "brick", "temple", ["p_lectern", "p_crystal", "p_candles"]), d("유리 정원", "rock", "crystal", ["p_crystal", "p_flowers", "p_crystal"]),
    d("유리 대로", "rock", "mine", ["p_crystal", "p_cart", "p_lamp"]),
    d("모래 언덕굴", "rock", "steps" in T ? "mine" : "mine", ["p_urn", "p_bones", "p_crystal"]), d("거꾸로 선 모래시계", "brick", "temple", ["p_sarcoph", "p_crystal", "p_urn"]), d("무너진 상단 야영지", "wood", "work", ["p_yurt", "p_crates", "p_rack"])] },
  gm2_1: { seed: 0x7a17, peak: [520], deep: [520], L: [
    d("반딧불 물계단", "wood", "water", ["p_fern", "p_shroom", "p_flowers"]), d("가운데 뿌리 기둥", "wood", "root", ["p_roots", "p_nest", "p_hive"]), d("동쪽 뿌리 기둥", "wood", "root", ["p_roots", "p_shroom", "p_urn"]),
    d("수상 마을", "wood", "work", ["p_crates", "p_lamp", "p_rack"]),
    d("가라앉은 신전 서", "brick", "temple", ["p_statue", "p_urn", "p_altar"]), d("가라앉은 신전 동", "brick", "water", ["p_sarcoph", "p_urn", "p_font"]), d("검은 웅덩이 굴", "rock", "water", ["p_roots", "p_shroom", "p_fern"])] },
};

const make = (id) => (K) => {
  const C = CAVES[id];
  angular(K, { ...C, ...(SHAPE[id] ?? {}), sig: SIG[id], y0: 14, y1: 1036, en: EN, towers: 3, pick: grid(C.L) });
};
export const UNDER_CAVES = Object.fromEntries(Object.keys(CAVES).map((id) => [id, make(id)]));

// ── 지상 구역 땅속 (하늘 부분은 그 지역 설계 그대로) ──
const GROUND = {
  gm1_0: { f: mossbark, seed: 0x3b0a, deep: [516], topX: [150, 860], L: [
    d("이끼 묘지", "brick", "crypt", ["p_skulls", "p_sarcoph", "p_candles"]), d("개울 지하 수로", "rock", "water", ["p_fern", "p_shroom", "p_nest"]), d("버섯 사슴 굴", "wood", "root", ["p_shroom", "p_bones", "p_fern"]),
    null, d("가라앉은 샘", "rock", "water", ["p_font", "p_crystal", "p_fern"]), d("지하 늪", "wood", "water", ["p_roots", "p_shroom", "p_log"]), d("뿌리 둥지", "wood", "root", ["p_nest", "p_bones", "p_roots"])] },
  g2_0: { f: glassdune, seed: 0x4798b, deep: [512], topX: [260, 760], L: [
    d("모래 벌레 굴 서", "rock", "lair", ["p_bones", "p_urn", "p_crystal"]), d("묻힌 유리 신전", "brick", "temple", ["p_statue", "p_altar", "p_crystal"]), d("모래 벌레 굴 동", "rock", "lair", ["p_bones", "p_skulls", "p_ore"]),
    null, d("알 방 지구", "rock", "lair", ["p_bones", "p_urn", "p_font"]), d("모래 샘", "rock", "water", ["p_crystal", "p_urn", "p_font"]), d("개미귀신 굴", "rock", "mine", ["p_bones", "p_rubble", "p_crystal"])] },
  gm2_0: { f: blackmarsh, seed: 0xb1af, deep: [460], topX: [100, 640], L: [
    d("가라앉은 마을 윗층", "wood", "work", ["p_crates", "p_lamp", "p_shelf"]), d("두꺼비 알 웅덩이", "rock", "water", ["p_hive", "p_fern", "p_shroom"]), d("거머리 굴", "rock", "lair", ["p_skulls", "p_bones", "p_shroom"]),
    null, d("가라앉은 마을 밑층", "wood", "water", ["p_cage", "p_urn", "p_roots"]), d("진흙 샘", "rock", "water", ["p_roots", "p_shroom", "p_moss"]), d("늪 사당", "brick", "crypt", ["p_altar", "p_candles", "p_skulls"])] },
};
const makeG = (id) => {
  const C = GROUND[id];
  const fn = (K, o) => {
    if (o.stage !== "under") return GSKY[id] ? GSKY[id](K, o) : C.f(K, o);
    angular(K, { seed: C.seed, y0: 676, y1: 1036, en: null, deep: C.deep, towers: 2, top: o.surfRow, topX: C.topX, pick: (x, f) => C.L[f < 860 ? (x < 340 ? 0 : x < 680 ? 1 : 2) : x < 340 ? 4 : x < 680 ? 5 : 6] });
  };
  return fn;
};
export const UNDER_GROUND = Object.fromEntries(Object.keys(GROUND).map((id) => [id, makeG(id)]));
