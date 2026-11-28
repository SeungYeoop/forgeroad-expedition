// 아이템 아이콘 (24x24 픽셀). 종류마다 바탕판 색이 다르고, 아이템마다 그림이 다르다.
import * as IT from "./items.js";
import { PAL } from "./vfx.js";

export const KIND_COL = { weapon: 0xe8743a, skill: 0x3aa0ff, magic: 0xb060ff, armor: 0x4ac46a, rune: 0xf0c040 };
export const KIND_CSS = { weapon: "#ff9a5a", skill: "#6ab8ff", magic: "#c890ff", armor: "#7ae09a", rune: "#ffd860" };
const shade = (c, f) => {
  const g = (s) => Math.max(0, Math.min(255, Math.round(((c >> s) & 255) * f)));
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
const MET = [0x4a5060, 0x8a94a8, 0xc8d2e2, 0xffffff];
const WOOD = [0x3a2010, 0x6a4022, 0x9a6438];
const GOLD = [0x7a4a08, 0xc89428, 0xffe080];
const LEA = [0x3a2414, 0x6a4628, 0x9a6a40];

let B = null; // 현재 버퍼
function plate(kind) {
  const c = KIND_COL[kind];
  const d0 = shade(c, 0.16), d1 = shade(c, 0.26), d2 = shade(c, 0.36);
  B.rect(1, 1, 22, 22, d0);
  for (let y = 1; y < 23; y++) B.rect(1, y, 22, 1, y < 12 ? d2 : y < 18 ? d1 : d0, 255);
  B.rect(1, 0, 22, 1, shade(c, 0.6));
  B.rect(1, 23, 22, 1, shade(c, 0.5));
  B.rect(0, 1, 1, 22, shade(c, 0.6));
  B.rect(23, 1, 1, 22, shade(c, 0.5));
  B.rect(2, 1, 20, 1, shade(c, 0.85), 120);
  // 모서리 표식
  B.poly([[1, 1], [6, 1], [1, 6]], c);
  B.px(2, 2, 0xffffff);
}
const L = (x0, y0, x1, y1, c, w = 1) => (w <= 1 ? B.line(x0, y0, x1, y1, c) : B.thickLine(x0, y0, x1, y1, w, c));
function blade(x0, y0, x1, y1, w, R = MET) {
  L(x0, y0, x1, y1, R[0], w + 1);
  L(x0, y0, x1, y1, R[1], w);
  L(x0, y0 - 1, x1 - 1, y1, R[2], 1);
  B.px(x1, y1, R[3]);
}
function glow(x, y, r, c) {
  B.circle(x, y, r * 1.8, c, 50);
  B.circle(x, y, r * 1.2, c, 110);
  B.circle(x, y, r, c, 230);
  B.circle(x - r * 0.3, y - r * 0.3, Math.max(1, r * 0.4), 0xffffff, 230);
}
const ring = (x, y, r, w, c) => B.ring(x, y, r, w, c);

// ── 무기 ──
const WD = {
  W01() { blade(7, 17, 19, 5, 2); L(4, 14, 10, 20, GOLD[1], 2); L(3, 21, 6, 18, LEA[1], 2); B.px(2, 22, GOLD[2]); },
  W02() { blade(8, 16, 20, 4, 4); L(4, 12, 12, 20, GOLD[1], 2); L(3, 21, 7, 17, LEA[1], 2); B.circle(2.5, 21.5, 1.5, GOLD[2]); },
  W03() { blade(5, 18, 13, 9, 1.5); blade(19, 18, 11, 9, 1.5, MET); L(3, 16, 7, 20, GOLD[1]); L(21, 16, 17, 20, GOLD[1]); },
  W04() { L(8, 16, 21, 3, MET[2]); L(9, 16, 21, 4, MET[1]); ring(7, 17, 3, 1, GOLD[1]); L(3, 21, 6, 18, LEA[1], 2); },
  W05() { L(3, 21, 16, 8, WOOD[1], 2); L(3, 20, 15, 8, WOOD[2]); B.poly([[15, 9], [21, 3], [17, 11]], MET[1]); B.poly([[16, 8], [21, 3], [18, 8]], MET[2]); L(13, 10, 16, 13, GOLD[1]); },
  W06() { L(5, 21, 15, 7, WOOD[1], 2); B.poly([[12, 4], [20, 6], [21, 12], [16, 13], [14, 9]], MET[1]); B.poly([[13, 5], [19, 7], [20, 11]], MET[2]); L(20, 6, 21, 12, MET[3]); },
  W07() { L(5, 21, 13, 10, WOOD[1], 2); B.poly([[10, 5], [17, 2], [21, 9], [14, 12]], MET[0]); B.poly([[11, 5], [17, 3], [20, 8], [14, 11]], MET[1]); L(12, 5, 17, 3, MET[2]); },
  W08() { L(4, 21, 15, 4, WOOD[1], 2); for (let a = 0; a < 1.6; a += 0.05) B.circle(15 + Math.cos(-1.9 + a) * 9 + 5, 4 + Math.sin(-1.9 + a) * 9 + 8, a < 1.3 ? 1.4 : 0.8, a < 0.6 ? MET[2] : MET[1]); },
  W09() { L(3, 21, 7, 17, LEA[1], 2); for (let i = 0; i < 40; i++) { const u = i / 40; B.px(7 + u * 13, 17 - u * 12 + Math.sin(u * 9) * 3, i % 2 ? LEA[2] : LEA[1]); } },
  W10() { B.poly([[6, 9], [16, 8], [18, 12], [17, 18], [7, 18]], MET[1]); for (let i = 0; i < 4; i++) B.rect(7 + i * 2.5, 8, 2, 4, MET[2]); B.rect(6, 18, 11, 3, LEA[1]); L(7, 13, 16, 13, MET[0]); },
  W11() { for (let a = -1.2; a <= 1.2; a += 0.04) B.circle(8 + Math.cos(a) * 3, 12 + Math.sin(a) * 9, 1, WOOD[2]); L(9, 3, 9, 21, 0xe0e0e0); L(4, 12, 21, 12, WOOD[1]); B.poly([[19, 10], [22, 12], [19, 14]], MET[2]); B.poly([[4, 10], [6, 12], [4, 14]], 0xe0e0f0); },
  W12() { L(4, 13, 20, 13, WOOD[1], 3); L(12, 5, 12, 21, WOOD[2], 2); L(12, 5, 20, 12, 0xd0d0d0); L(12, 21, 20, 14, 0xd0d0d0); L(14, 11, 21, 11, MET[2]); B.rect(4, 14, 4, 5, WOOD[0]); },
  W13() { ring(12, 12, 7, 2, MET[1]); ring(12, 12, 7, 1, MET[2]); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B.poly([[12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7], [12 + Math.cos(a + 0.4) * 11, 12 + Math.sin(a + 0.4) * 11], [12 + Math.cos(a + 0.6) * 7, 12 + Math.sin(a + 0.6) * 7]], MET[2]); } },
  W14() { L(5, 21, 16, 8, WOOD[1], 2); L(5, 20, 15, 8, WOOD[2]); glow(17, 6, 3, 0x9a7aff); },
  W15() { B.rect(5, 5, 14, 16, 0x5a2a6a); B.rect(6, 6, 12, 14, 0x7a3a8a); B.rect(18, 6, 2, 14, 0xf0e8d0); ring(12, 13, 3.5, 1, GOLD[2]); B.px(12, 13, 0xffffff); B.rect(5, 5, 14, 1, GOLD[1]); },
  W16() { for (let a = 0; a < 1.8; a += 0.06) B.circle(14 + Math.cos(-1.6 + a) * 6, 10 + Math.sin(-1.6 + a) * 6, 1, MET[2]); L(8, 16, 14, 10, WOOD[1], 2); for (let i = 0; i < 4; i++) ring(6 - i * 1, 18 + i * 1.5, 1.2, 1, MET[1]); },
  B01() { blade(8, 16, 20, 4, 4, [0x5a1a08, 0xc04010, 0xff9a40, 0xffffff]); for (let i = 0; i < 6; i++) B.px(10 + i * 2, 14 - i * 2 - 2, 0xffe080); L(4, 12, 12, 20, 0x3a2a2a, 2); L(3, 21, 7, 17, LEA[1], 2); },
  B10() { for (let a = -1.2; a <= 1.2; a += 0.04) B.circle(8 + Math.cos(a) * 3, 12 + Math.sin(a) * 9, 1, 0x4ac0a0); L(9, 3, 9, 21, 0xe0fff0); L(4, 12, 21, 12, 0x2a8a70); for (let i = 0; i < 3; i++) B.poly([[4 + i * 2, 12], [3 + i * 2, 8], [6 + i * 2, 12]], 0xc0fff0); },
};

// ── 스킬 (흰 문양) ──
const SW = 0xf0f8ff, SC = 0x8ad0ff;
const SD = {
  S01() { for (let a = 0; a < 4.8; a += 0.08) B.circle(12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, a > 4 ? 1.5 : 1, a > 4 ? SW : SC); B.poly([[19, 9], [21, 14], [16, 12]], SW); blade(9, 15, 15, 9, 1.2); },
  S02() { L(3, 12, 17, 12, SW, 2); B.poly([[16, 7], [22, 12], [16, 17]], SW); for (let i = 0; i < 3; i++) L(3, 7 + i * 5, 8 - i, 7 + i * 5, SC); },
  S03() { blade(12, 3, 12, 15, 2); L(9, 5, 15, 5, GOLD[1], 2); for (let i = -2; i <= 2; i++) L(12, 18, 12 + i * 4, 21 - Math.abs(i), SC); B.rect(4, 20, 16, 1, SW); },
  S04() { for (let a = -0.3; a < 1.8; a += 0.06) B.circle(12 + Math.cos(Math.PI + a) * 8, 16 + Math.sin(Math.PI + a) * 9, 1.4 - a * 0.4, a < 0.8 ? SW : SC); B.poly([[15, 5], [19, 3], [18, 8]], SW); },
  S05() { B.circle(12, 12, 8, SW); B.circle(15, 10, 7, shade(KIND_COL.skill, 0.3)); B.px(6, 9, SC); },
  S06() { for (let i = 0; i < 3; i++) (L(3, 7 + i * 5, 17, 7 + i * 5, i === 1 ? SW : SC), B.poly([[17, 5 + i * 5], [21, 7 + i * 5], [17, 9 + i * 5]], SW)); },
  S07() { B.circle(15, 7, 2.5, 0x302040); B.poly([[12, 10], [18, 10], [17, 19], [13, 19]], 0x302040); for (let i = 0; i < 4; i++) B.px(4 + i * 2, 14, SC); ring(15, 13, 8, 1, 0x9a6aff); },
  S08() { B.rect(3, 13, 12, 3, 0x2a2a3a); B.rect(3, 13, 12, 1, 0x4a4a6a); L(14, 14, 22, 14, SW); L(14, 13, 22, 9, SC); B.rect(14, 12, 2, 5, GOLD[1]); },
  S09() { B.poly([[6, 5], [18, 5], [18, 12], [12, 19], [6, 12]], 0x4a6a9a); B.poly([[7, 6], [17, 6], [17, 12], [12, 17], [7, 12]], 0x7aa0d0); for (let i = 0; i < 4; i++) L(19, 4 + i * 2, 22, 2 + i * 3, SW); },
  S10() { for (let i = 0; i < 8; i++) B.px(4 + i * 2, 18 - Math.sin((i / 7) * Math.PI) * 12, SC); blade(14, 12, 21, 18, 1.5); },
  S11() { for (let i = 0; i < 5; i++) ring(5 + i * 3, 18 - i * 2, 1.4, 1, MET[1]); for (let a = 0; a < 3.5; a += 0.1) B.px(18 + Math.cos(a) * 3, 7 + Math.sin(a) * 3, MET[2]); L(18, 4, 20, 8, MET[2]); },
  S12() { B.circle(7, 12, 3, SW); for (let k = 1; k <= 3; k++) for (let a = -0.8; a <= 0.8; a += 0.1) B.px(8 + Math.cos(a) * k * 4, 12 + Math.sin(a) * k * 4, k === 1 ? SW : SC); },
  S13() { ring(12, 12, 7, 1, SW); ring(12, 12, 3, 1, SC); L(12, 2, 12, 7, SW); L(12, 17, 12, 22, SW); L(2, 12, 7, 12, SW); L(17, 12, 22, 12, SW); B.px(12, 12, 0xff6060); },
  S14() { B.poly([[9, 3], [15, 3], [15, 11], [9, 11]], SW); B.rect(9, 11, 6, 3, SC); L(12, 15, 7, 21, SC); L(12, 15, 17, 21, SC); L(12, 15, 12, 22, SW); B.rect(3, 21, 18, 1, 0x806040); },
  S15() { for (const a of [-0.5, 0, 0.5]) blade(6, 18, 6 + Math.cos(-0.8 + a) * 13, 18 + Math.sin(-0.8 + a) * 13, 1); },
  S16() { B.poly([[8, 12], [14, 10], [16, 14], [10, 16]], LEA[2]); for (let a = 0; a < 5; a += 0.15) B.px(12 + Math.cos(a) * (3 + a * 1.4), 12 + Math.sin(a) * (3 + a * 1.4), SC); },
  S17() { for (let i = 0; i < 3; i++) { const c = [0x3a5a8a, 0x5a8ac0, SW][i]; B.circle(8 + i * 4, 7, 2, c); B.rect(7 + i * 4, 9, 3, 8, c); } L(4, 20, 20, 4, SC); },
  S18() { ring(10, 12, 3, 1, SC); ring(16, 12, 3, 1, SC); L(2, 12, 20, 12, SW, 2); B.poly([[19, 9], [23, 12], [19, 15]], SW); },
  S19() { for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + 0 + i * 0.32 + Math.PI / 2 - 0.0; L(5, 12, 5 + Math.cos(i * 0.32) * 15, 12 + Math.sin(i * 0.32) * 15, i ? SC : SW); } },
  S20() { B.rect(4, 15, 16, 3, MET[1]); for (let i = 0; i < 5; i++) (B.poly([[5 + i * 3, 15], [6.5 + i * 3, 10], [8 + i * 3, 15]], MET[2]), B.poly([[5 + i * 3, 18], [6.5 + i * 3, 21], [8 + i * 3, 18]], MET[0])); },
  S21() { B.circle(9, 12, 5, SC); B.poly([[13, 8], [21, 12], [13, 16]], SW); for (let i = 0; i < 4; i++) L(16, 12, 16 + Math.cos(i * 1.6) * 6, 12 + Math.sin(i * 1.6) * 6, 0xffe080); },
  S22() { B.circle(12, 10, 6, 0xe8e0d0); B.rect(9, 14, 6, 4, 0xe8e0d0); B.rect(9, 9, 2, 2, 0x200808); B.rect(13, 9, 2, 2, 0x200808); L(3, 21, 21, 3, 0xff4040, 1); },
  S23() { for (let i = 0; i < 6; i++) { const a = i * 0.55; L(12 - Math.cos(a) * 9, 12 - Math.sin(a) * 9, 12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9, i % 2 ? SC : SW); } },
  S24() { blade(7, 17, 15, 9, 1.5); for (let a = 0; a < 3.6; a += 0.12) B.px(15 + Math.cos(a) * 5, 12 + Math.sin(a) * 6, SC); B.poly([[9, 5], [12, 4], [10, 7]], SW); },
  B08() { ring(12, 12, 6, 2, GOLD[1]); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; B.rect(12 + Math.cos(a) * 8 - 1.5, 12 + Math.sin(a) * 8 - 1.5, 3, 3, GOLD[2]); } B.circle(12, 12, 2, GOLD[0]); },
};

// ── 마법 ──
function orbBack(el) {
  const p = PAL[el] ?? PAL.none;
  B.circle(12, 12, 10, p[3], 120);
  B.circle(12, 12, 8, p[3], 160);
}
const MD = {
  M01(p) { for (let i = 0; i < 6; i++) B.circle(6 + i * 1.6, 18 - i * 1.6, 1 + i * 0.4, i < 3 ? p[3] : p[2], 200); glow(16, 8, 4, p[2]); },
  M02(p) { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; B.poly([[12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7 + 2], [12 + Math.cos(a) * 7 - 1.5, 12 + Math.sin(a) * 7], [12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7 - 3], [12 + Math.cos(a) * 7 + 1.5, 12 + Math.sin(a) * 7]], i % 2 ? p[1] : p[2]); } B.circle(12, 12, 2, p[0]); },
  M03(p) { B.poly([[4, 12], [20, 4], [22, 12], [20, 20]], p[3]); B.poly([[5, 12], [18, 7], [19, 12], [18, 17]], p[2]); B.poly([[6, 12], [14, 9], [15, 12], [14, 15]], p[1]); },
  M04(p) { for (let i = 0; i < 7; i++) B.circle(4 + i * 1.5, 4 + i * 1.5, 0.8 + i * 0.3, p[2], 120 + i * 15); B.circle(16, 16, 5, 0x5a3a2a); B.circle(15, 15, 3.5, 0x8a5a3a); B.ring(16, 16, 5.5, 1, p[1]); },
  M05(p) { B.poly([[4, 20], [17, 5], [21, 3], [19, 7]], p[1]); B.line(5, 19, 20, 4, p[0]); B.poly([[3, 21], [6, 17], [7, 20]], p[2]); },
  M06(p) { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; L(12 + Math.cos(a) * 3, 12 + Math.sin(a) * 3, 12 + Math.cos(a) * (i % 2 ? 7 : 10), 12 + Math.sin(a) * (i % 2 ? 7 : 10), i % 2 ? p[2] : p[1]); } B.circle(12, 12, 2, p[0]); },
  M07(p) { B.poly([[7, 21], [8, 8], [12, 3], [16, 8], [17, 21]], p[2]); B.poly([[10, 21], [10, 9], [12, 6], [14, 9], [14, 21]], p[1]); B.line(12, 6, 12, 20, p[0]); },
  M08(p) { glow(12, 12, 4, p[2]); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; L(12, 12, 12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9, p[1]); B.px(12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9, p[0]); } },
  M09(p) { const pts = [[3, 20], [10, 13], [8, 11], [16, 6], [14, 9], [21, 3]]; for (let i = 0; i + 1 < pts.length; i++) (L(...pts[i], ...pts[i + 1], p[2], 2), L(...pts[i], ...pts[i + 1], p[0])); },
  M10(p) { for (const [x, y, r] of [[7, 6, 4], [12, 5, 5], [17, 6, 4]]) B.circle(x, y, r, 0x4a4060); L(12, 9, 9, 15, p[2], 2); L(9, 15, 14, 15, p[2], 2); L(14, 15, 11, 22, p[2], 2); L(12, 9, 11, 22, p[0]); },
  M11(p) { const pts = [[4, 6], [12, 10], [7, 16], [19, 18]]; for (let i = 0; i + 1 < pts.length; i++) L(...pts[i], ...pts[i + 1], p[2], 2); for (const q of pts) B.circle(q[0], q[1], 2, p[0]); },
  M12(p) { glow(12, 12, 5, p[2]); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; L(12 + Math.cos(a) * 5, 12 + Math.sin(a) * 5, 12 + Math.cos(a + 0.3) * 10, 12 + Math.sin(a + 0.3) * 10, p[1]); } },
  M13(p) { for (const dy of [-4, 4]) for (let a = -1.2; a <= 1.2; a += 0.05) B.circle(8 + Math.cos(a) * 8, 12 + dy + Math.sin(a) * 5, 1.2 * Math.cos(a), a > -0.6 && a < 0.6 ? p[1] : p[2]); },
  M14(p) { for (let k = 0; k < 7; k++) B.ellipse(12 + Math.sin(k) * 1.5, 5 + k * 2.4, 2 + (6 - k) * 1.1, 1.3, k % 2 ? p[1] : p[2]); },
  M15(p) { for (let i = 0; i < 4; i++) { for (let a = 0; a < 3; a += 0.1) B.px(4 + a * 5, 6 + i * 4 + Math.sin(a * 2) * 1.5, i % 2 ? p[2] : p[1]); } },
  M16(p) { for (let i = 0; i < 3; i++) (L(6 + i * 6, 20, 6 + i * 6, 6, p[2]), B.poly([[3 + i * 6, 9], [6 + i * 6, 4], [9 + i * 6, 9]], p[1])); },
  M17(p) { B.poly([[5, 12], [9, 5], [17, 5], [20, 12], [16, 19], [8, 19]], 0x6a4a30); B.poly([[7, 11], [10, 7], [16, 7], [18, 11], [14, 15], [9, 15]], 0x9a7050); L(10, 9, 14, 13, 0x4a3020); },
  M18(p) { for (let i = 0; i < 4; i++) (B.poly([[3 + i * 5, 21], [5.5 + i * 5, 21 - 6 - i * 3], [8 + i * 5, 21]], 0x7a5a3a), B.line(5.5 + i * 5, 21 - 6 - i * 3, 5.5 + i * 5, 20, 0xb08a60)); },
  M19(p) { B.rect(2, 13, 20, 9, 0x6a4a30); L(4, 13, 9, 17, 0x2a1a10); L(9, 17, 7, 22, 0x2a1a10); L(9, 17, 15, 15, 0x2a1a10); L(15, 15, 19, 21, 0x2a1a10); for (let i = 0; i < 4; i++) B.rect(4 + i * 5, 9 - (i % 2) * 2, 2, 2, 0xb08a60); },
  M20(p) { B.rect(8, 12, 9, 10, 0x6a5040); for (let i = 0; i < 4; i++) B.rect(7 + i * 2.5, 4 + Math.abs(i - 1.5) * 1.5, 2, 9, 0x9a7860); B.rect(16, 11, 4, 3, 0x9a7860); },
  M21(p) { for (let i = 0; i < 3; i++) (L(3, 8 + i * 4, 19, 6 + i * 4, p[1]), B.px(19, 6 + i * 4, p[0])); B.circle(20, 20, 2, p[2]); },
  M22(p) { for (const [x, y, r] of [[8, 11, 5], [14, 9, 6], [16, 14, 5], [10, 15, 4]]) B.circle(x, y, r, p[2], 200); for (let i = 0; i < 3; i++) B.rect(8 + i * 4, 18 + (i % 2), 1, 3, p[1]); },
  M23(p) { B.circle(12, 10, 6, 0xb0b890); B.rect(9, 9, 2, 2, 0x203010); B.rect(13, 9, 2, 2, 0x203010); B.rect(10, 15, 4, 3, 0xb0b890); for (let i = 0; i < 3; i++) B.rect(9 + i * 3, 17, 1, 3 + i, p[2]); },
  M24(p) { B.ellipse(12, 17, 10, 4, p[3]); B.ellipse(12, 16, 8, 3, p[2]); for (const [x, y] of [[8, 14], [14, 13], [17, 15]]) B.ring(x, y, 1.5, 1, p[0]); },
  M25(p) { B.poly([[4, 20], [17, 5], [21, 3], [19, 7]], p[1]); B.line(5, 19, 20, 4, 0xffffff); for (let i = 0; i < 4; i++) B.px(6 + i * 4, 10 + (i % 2) * 8, p[0]); },
  M26(p) { B.rect(10, 4, 4, 16, p[1]); B.rect(4, 10, 16, 4, p[1]); B.rect(11, 5, 2, 14, 0xffffff); B.rect(5, 11, 14, 2, 0xffffff); },
  M27(p) { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; L(12, 12, 12 + Math.cos(a) * (i % 2 ? 6 : 10), 12 + Math.sin(a) * (i % 2 ? 6 : 10), p[1], i % 2 ? 1 : 2); } B.circle(12, 12, 3, 0xffffff); },
  M28(p) { for (let i = 0; i < 3; i++) (B.rect(5 + i * 6, 2, 3, 18, p[2]), B.rect(6 + i * 6, 2, 1, 18, 0xffffff)); B.ellipse(12, 21, 9, 2, p[1]); },
  M29(p) { glow(12, 12, 6, p[2]); B.ellipse(12, 12, 4, 2.2, 0x100418); B.circle(12, 12, 1.4, 0xff60a0); },
  M30(p) { B.circle(8, 8, 4, 0xd0c8e0); B.rect(6, 7, 1, 2, 0x200830); B.rect(9, 7, 1, 2, 0x200830); for (let i = 0; i < 5; i++) B.circle(10 + i * 2, 11 + i * 2, 1.2, p[1]); B.poly([[15, 16], [18, 14], [21, 16], [18, 21]], 0xff4060); },
  M31(p) { ring(12, 12, 8, 1, p[1]); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2, b2 = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2; L(12 + Math.cos(a) * 7, 12 + Math.sin(a) * 7, 12 + Math.cos(b2) * 7, 12 + Math.sin(b2) * 7, p[2]); } },
  M32(p) { for (let a = 0; a < 9; a += 0.1) B.px(12 + Math.cos(a) * a * 1.1, 12 + Math.sin(a) * a * 1.1, a > 5 ? p[2] : p[1]); B.circle(12, 12, 3, 0x000000); B.ring(12, 12, 3.5, 1, p[0]); },
  B04(p) { B.circle(12, 14, 7, 0x6a5030); B.rect(9, 5, 6, 4, 0x6a5030); B.rect(9, 6, 6, 1, 0xc0a060); for (let i = 0; i < 3; i++) B.circle(8 + i * 4, 14, 1.5, p[1]); },
  B05(p) { B.poly([[12, 20], [4, 11], [7, 5], [12, 8], [17, 5], [20, 11]], 0xb02010); B.poly([[12, 17], [6, 11], [8, 7], [12, 10], [16, 7], [18, 11]], p[2]); glow(12, 11, 2, p[1]); },
};

// ── 방어구 ──
function vest(c, trim) {
  B.poly([[6, 5], [10, 4], [12, 7], [14, 4], [18, 5], [19, 10], [17, 11], [17, 20], [7, 20], [7, 11], [5, 10]], shade(c, 0.6));
  B.poly([[7, 6], [10, 5], [12, 8], [14, 5], [17, 6], [18, 9], [16, 10], [16, 19], [8, 19], [8, 10], [6, 9]], c);
  trim && (B.rect(11, 8, 2, 11, trim), B.rect(8, 15, 8, 1, trim));
}
function robe(c, trim) {
  B.poly([[8, 4], [16, 4], [18, 10], [20, 21], [4, 21], [6, 10]], shade(c, 0.6));
  B.poly([[9, 5], [15, 5], [17, 10], [19, 20], [5, 20], [7, 10]], c);
  trim && (B.rect(11, 5, 2, 15, trim), B.rect(5, 19, 14, 1, trim));
  B.circle(12, 5, 2, shade(c, 0.5));
}
function cloak(c, lining) {
  B.poly([[9, 3], [15, 3], [20, 21], [4, 21]], shade(c, 0.6));
  B.poly([[10, 4], [14, 4], [19, 20], [5, 20]], c);
  B.poly([[11, 6], [13, 6], [14, 20], [10, 20]], lining);
  B.rect(9, 4, 6, 2, GOLD[1]);
}
function shield(c, rim, kind) {
  if (kind === "round") (B.circle(12, 12, 9, rim), B.circle(12, 12, 7.5, c), B.circle(12, 12, 2, rim));
  else if (kind === "tall") (B.rect(5, 2, 14, 20, rim), B.rect(6, 3, 12, 18, c), B.rect(11, 3, 2, 18, rim));
  else (B.poly([[4, 4], [20, 4], [20, 12], [12, 21], [4, 12]], rim), B.poly([[6, 6], [18, 6], [18, 12], [12, 19], [6, 12]], c));
}
const AD = {
  A01() { vest(0x8a5a32, 0x5a3a20); },
  A02() { vest(0x8a92a0); for (let y = 7; y < 19; y += 2) for (let x = 8 + (y % 4 ? 1 : 0); x < 17; x += 2) B.px(x, y, 0x5a6270); },
  A03() { vest(0xc0c8d8, GOLD[1]); B.rect(8, 7, 3, 4, 0xffffff, 140); },
  A04() { robe(0x3a5aa0, 0xc0d0ff); },
  A05() { robe(0x6a2a9a, GOLD[2]); B.px(12, 12, 0xffffff); },
  A06() { cloak(0x7a5a3a, 0x4a3a2a); },
  A07() { cloak(0x2a1a3a, 0x6a3aaa); },
  A08() { shield(0x8a5a2a, 0x5a3a1a, "round"); L(5, 12, 19, 12, 0x5a3a1a); },
  A09() { shield(0x6a5a4a, 0x3a3030, "round"); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; B.poly([[12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8], [12 + Math.cos(a + 0.2) * 11, 12 + Math.sin(a + 0.2) * 11], [12 + Math.cos(a + 0.4) * 8, 12 + Math.sin(a + 0.4) * 8]], MET[2]); } },
  A10() { shield(0x8a92a8, 0x4a5060, "tall"); },
  A11() { shield(0xd0f0ff, GOLD[1], "round"); L(8, 9, 11, 6, 0xffffff); L(8, 12, 14, 6, 0xffffff); },
  A12() { vest(0x3a8a80); for (let y = 8; y < 19; y += 3) for (let x = 8; x < 17; x += 3) B.ellipse(x + (y % 2), y, 1.5, 1, 0x6ac0b0); },
  A13() { vest(0x4a4038); for (let i = 0; i < 4; i++) B.rect(8, 9 + i * 3, 8, 1, 0xe8e0c8); B.rect(11, 8, 2, 11, 0xe8e0c8); },
  A14() { vest(0xe8e0d0); B.rect(7, 13, 10, 2, 0x2a2a2a); B.poly([[10, 6], [12, 10], [14, 6]], 0xc8c0b0); },
  A15() { vest(0x4a6a8a, 0x8a6a3a); B.circle(12, 4, 3, 0xe0b030); B.circle(12, 3, 1, 0xffffff); },
  A16() { vest(0xe8e8e8); for (let i = 0; i < 9; i++) B.circle(7 + (i % 3) * 5, 8 + Math.floor(i / 3) * 5, 1.5, 0xffffff); B.rect(6, 5, 12, 3, 0xd0c8b8); },
  A17() { robe(0xf0f0f8, GOLD[1]); B.rect(10, 9, 4, 1, GOLD[2]); },
  A18() { vest(0x6a4a2a); B.rect(8, 11, 8, 9, 0xd8c8a8); B.circle(12, 15, 2, 0x60ff90); B.rect(11, 12, 2, 2, 0x60ff90); },
  A19() { cloak(0x4a8ac0, 0xe0f0ff); for (let i = 0; i < 5; i++) B.poly([[6 + i * 3, 20], [7 + i * 3, 14], [9 + i * 3, 20]], 0xffffff); },
  A20() { B.poly([[3, 6], [21, 6], [20, 21], [4, 21]], 0x5a5a50); B.poly([[5, 8], [19, 8], [18, 19], [6, 19]], 0x8a8a78); B.circle(12, 13, 2.5, 0x60e0ff); B.rect(3, 4, 6, 5, 0x6a6a5a); B.rect(15, 4, 6, 5, 0x6a6a5a); },
  B03() { vest(0x5a4a5a); for (let i = 0; i < 4; i++) B.poly([[8 + i * 3, 18], [9.5 + i * 3, 10], [11 + i * 3, 18]], 0x60e0d0); },
  B06() { vest(0x6ac0e8, 0xffffff); for (let y = 8; y < 19; y += 3) for (let x = 8; x < 17; x += 3) B.ellipse(x, y, 1.5, 1, 0xd8f8ff); },
  B11() { B.poly([[4, 18], [4, 8], [8, 12], [12, 5], [16, 12], [20, 8], [20, 18]], 0x2a1a3a); B.poly([[5, 17], [5, 10], [8, 13], [12, 7], [16, 13], [19, 10], [19, 17]], 0x5a3a7a); for (const x of [5, 12, 19]) B.circle(x, x === 12 ? 6 : 9, 1.5, 0xb070ff); },
};

// ── 각인 (석판 + 문양) ──
const GG = 0xffe28a;
const GLYPH = {
  G01() { L(12, 18, 12, 11, GG); L(12, 11, 7, 6, GG); L(12, 11, 17, 6, GG); L(12, 11, 12, 5, GG); },
  G02() { L(5, 12, 19, 12, GG); B.poly([[17, 9], [20, 12], [17, 15]], GG); ring(11, 12, 3, 1, GG); },
  G03() { L(6, 6, 11, 11, GG); L(11, 11, 8, 14, GG); L(8, 14, 18, 18, GG); },
  G04() { B.poly([[12, 5], [16, 13], [12, 18], [8, 13]], 0xff5060); B.px(11, 11, 0xffffff); },
  G05() { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; L(12, 12, 12 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, GG); } },
  G06() { ring(12, 12, 6, 1, GG); ring(12, 12, 2, 1, GG); B.px(12, 12, GG); },
  G07() { L(12, 18, 12, 6, GG); B.poly([[8, 9], [12, 5], [16, 9]], GG); L(7, 18, 17, 18, GG); },
  G08() { for (let i = 0; i < 3; i++) (L(6 + i * 4, 7, 10 + i * 4, 12, GG), L(10 + i * 4, 12, 6 + i * 4, 17, GG)); },
  G09() { L(5, 17, 12, 8, GG); L(12, 8, 19, 17, GG); B.rect(4, 18, 16, 1, GG); },
  G10() { ring(12, 12, 3, 1, GG); ring(12, 12, 6, 1, GG); },
  G11() { L(8, 6, 17, 17, GG); B.poly([[13, 5], [19, 7], [17, 11]], GG); },
  G12() { B.poly([[12, 5], [14, 10], [19, 11], [15, 14], [16, 19], [12, 16], [8, 19], [9, 14], [5, 11], [10, 10]], GG); },
  G13() { L(6, 12, 17, 12, GG); B.poly([[15, 8], [19, 12], [15, 16]], GG); L(6, 8, 6, 16, GG); },
  G14() { for (let i = 0; i < 3; i++) B.poly([[7 + i * 4, 8 + i * 2], [9 + i * 4, 12 + i * 2], [7 + i * 4, 14 + i * 2], [5 + i * 4, 12 + i * 2]], 0xff5060); },
  G15() { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; B.poly([[12 + Math.cos(a) * 5, 12 + Math.sin(a) * 5 - 2], [13 + Math.cos(a) * 5, 12 + Math.sin(a) * 5], [12 + Math.cos(a) * 5, 12 + Math.sin(a) * 5 + 2], [11 + Math.cos(a) * 5, 12 + Math.sin(a) * 5]], GG); } },
  G16() { for (let a = 0; a < 9; a += 0.2) B.px(12 + Math.cos(a) * (7 - a * 0.7), 12 + Math.sin(a) * (7 - a * 0.7), 0x80c0ff); },
  G17() { B.poly([[12, 5], [16, 12], [14, 18], [10, 18], [8, 12]], 0xff7030); B.poly([[12, 9], [14, 13], [12, 17], [10, 13]], GG); },
  G18() { for (let i = 0; i < 4; i++) B.rect(6 + i * 3, 18 - i * 3, 2, i * 3 + 1, GG); },
  G19() { for (let i = 0; i < 3; i++) B.circle(8 + i * 4, 12, 3, GG, 80 + i * 70); },
  G20() { for (let a = 0.5; a < 5.5; a += 0.1) B.px(12 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, GG); B.poly([[16, 7], [19, 9], [16, 11]], GG); },
  G21() { B.poly([[7, 6], [17, 6], [17, 12], [12, 18], [7, 12]], GG); B.poly([[9, 8], [15, 8], [15, 12], [12, 16], [9, 12]], 0x5a4a30); },
  G22() { for (let i = 0; i < 4; i++) B.poly([[5 + i * 4, 18], [7 + i * 4, 8], [9 + i * 4, 18]], GG); },
  G23() { B.circle(12, 12, 6, GG); B.circle(12, 12, 4.5, 0xc89428); B.rect(11, 9, 2, 6, GG); },
  G24() { for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0]]) B.circle(12 + dx, 11 + dy, 2.5, 0x60e070); L(12, 13, 13, 19, 0x60e070); },
  G25() { B.circle(12, 9, 4, 0xc0f0ff, 200); B.poly([[8, 10], [16, 10], [14, 19], [12, 16], [10, 19]], 0xc0f0ff, 180); },
  G26() { for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.7; L(12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, 12 + Math.cos(a) * 3, 12 + Math.sin(a) * 3, GG); } B.circle(12, 12, 2, GG); },
  G27() { B.poly([[7, 5], [17, 5], [12, 12]], GG); B.poly([[7, 19], [17, 19], [12, 12]], GG); B.rect(6, 4, 12, 1, GG); B.rect(6, 19, 12, 1, GG); },
  G28() { B.poly([[12, 18], [5, 10], [8, 6], [12, 9], [16, 6], [19, 10]], 0xff5060); L(12, 9, 11, 13, 0x2a0a10); L(11, 13, 13, 16, 0x2a0a10); },
  G29() { for (let k = 1; k <= 3; k++) for (let a = -0.9; a <= 0.9; a += 0.1) (B.px(12 + Math.cos(a) * k * 3, 12 + Math.sin(a) * k * 3, GG), B.px(12 - Math.cos(a) * k * 3, 12 + Math.sin(a) * k * 3, GG)); },
  G30() { B.ellipse(12, 12, 7, 4, GG); B.circle(12, 12, 2.5, 0x3a2a10); B.px(12, 12, 0xffffff); },
  B02() { L(8, 18, 10, 6, 0xe0f0f0, 2); L(14, 18, 16, 6, 0xe0f0f0, 2); L(9, 10, 6, 7, 0xe0f0f0); L(15, 10, 18, 7, 0xe0f0f0); },
  B07() { B.poly([[12, 18], [5, 10], [8, 6], [12, 9], [16, 6], [19, 10]], 0xe0b060); for (let i = 0; i < 4; i++) B.px(8 + i * 3, 11, 0xfff0c0); },
  B09() { B.poly([[12, 4], [19, 12], [12, 20], [5, 12]], 0xffffff); for (let i = 0; i < 6; i++) B.line(12, 12, [5, 19, 12, 12, 8, 16][i], [12, 12, 4, 20, 7, 17][i], [0xff6060, 0xffd060, 0x60ff90, 0x60c0ff, 0xb060ff, 0xff60c0][i]); },
  B12() { glow(12, 12, 4, 0xff9030); B.poly([[12, 4], [15, 10], [12, 9], [9, 10]], 0xffe080); },
};
function runeStone(id) {
  B.poly([[6, 3], [18, 3], [20, 6], [20, 20], [17, 22], [7, 22], [4, 20], [4, 6]], 0x3a3530);
  B.poly([[7, 4], [17, 4], [19, 7], [19, 19], [16, 21], [8, 21], [5, 19], [5, 7]], id.startsWith("B") ? 0x4a3a5a : 0x5a5248);
  B.line(7, 4, 17, 4, 0x8a8070);
  (GLYPH[id] ?? GLYPH.G06)();
}

// ── 생성 ──
export function bootIcons(scene, ht, lt) {
  for (const id of Object.keys(IT.BASE)) {
    const b = IT.BASE[id];
    // fi_: 색 바탕판 있는 아이콘 · fa_: 바탕 없는 아이콘 (알비온식 칸, 2026-11-28)
    for (const bare of [0, 1]) {
      B = new ht(24, 24);
      bare || plate(b.kind);
      try {
        if (b.kind === "weapon") (WD[id] ?? WD.W01)();
        else if (b.kind === "skill") (SD[id] ?? SD.S01)();
        else if (b.kind === "magic") {
          const el = b.el ?? "none";
          orbBack(el);
          (MD[id] ?? MD.M01)(PAL[el] ?? PAL.none);
        } else if (b.kind === "armor") (AD[id] ?? AD.A01)();
        else runeStone(id);
      } catch (e) {}
      B.outline(0x0c0810);
      lt(scene, `${bare ? "fa" : "fi"}_${id}`, B);
    }
  }
}
// 바탕 없는 융합 아이콘 (알비온식 칸): 주재료 + 보조재료 작은 원 + 속성 점 (희귀도는 칸 배지로)
export function composeBare(scene, key, it, elColor) {
  const tex = scene.textures;
  if (tex.exists(key)) return key;
  const prim = it.tier === 0 ? it.id : it.primary;
  const sec = it.tier === 0 ? null : it.secondary;
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = !1;
  const draw = (k, x, y, s) => tex.exists(k) && g.drawImage(tex.get(k).getSourceImage(), 0, 0, 24, 24, x, y, 24 * s, 24 * s);
  draw(`fa_${prim}`, 0, 0, 1);
  if (sec && sec !== prim) {
    g.fillStyle = "rgba(10,10,14,0.9)";
    g.beginPath();
    g.arc(18, 8, 6, 0, Math.PI * 2);
    g.fill();
    draw(`fa_${sec}`, 12.5, 2.5, 0.46);
  }
  if (it.el && it.tier > 0) {
    g.fillStyle = "#" + elColor(it.el).toString(16).padStart(6, "0");
    g.fillRect(2, 20, 3, 3);
    g.fillStyle = "#0c0810";
    g.fillRect(2, 23, 3, 1);
  }
  tex.addCanvas(key, c);
  return key;
}
// 융합 아이템: 주재료 아이콘 + 보조재료 작은 아이콘 + 등급 테두리
const TIER_COL = ["", "#5aa8ff", "#c070ff", "#ffc840"];
export function composeIcon(scene, key, it, elColor, size = 24) {
  const tex = scene.textures;
  if (tex.exists(key)) return key;
  const prim = it.tier === 0 ? it.id : it.primary;
  const sec = it.tier === 0 ? null : it.secondary;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = !1;
  g.scale(size / 24, size / 24);
  const draw = (k, x, y, s) => {
    if (!tex.exists(k)) return;
    const src = tex.get(k).getSourceImage();
    g.drawImage(src, 0, 0, 24, 24, x, y, 24 * s, 24 * s);
  };
  draw(`fi_${prim}`, 0, 0, 1);
  if (sec && sec !== prim) {
    g.fillStyle = "rgba(10,6,14,0.85)";
    g.beginPath();
    g.arc(17, 17, 7, 0, Math.PI * 2);
    g.fill();
    draw(`fi_${sec}`, 11, 11, 0.5);
  }
  if (it.tier > 0) {
    g.strokeStyle = TIER_COL[it.tier];
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, 23, 23);
  }
  if (it.el && it.tier > 0) {
    g.fillStyle = "#" + elColor(it.el).toString(16).padStart(6, "0");
    g.fillRect(19, 1, 4, 4);
    g.strokeStyle = "#0c0810";
    g.strokeRect(18.5, 0.5, 5, 5);
  }
  tex.addCanvas(key, c);
  return key;
}
