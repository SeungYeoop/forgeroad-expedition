// 새 지역 몬스터 그림 도구 (그래스메어 손그림 방식 그대로: 부위마다 모양 → 6단 입체 명암 → 겹침 선 → 부위 색 외곽선)
//   board(W, H, k): 설계 좌표 W×H로 그리고 k배 크기의 픽셀 칸에 직접 찍는다 (발바닥 = 맨 아래 줄)
//   C.part(모양, 색 묶음, { shine 반짝 · flat 납작 · sep 겹침 선 · lv 밝기 })  · C.over(x, y, 색) 칠한 칸에만 · C.selout() 바깥 외곽선
import { board, ellR, capF, polyF, U, minus, pol, lerp, ik } from "./pgob.js";
import { flash } from "./pgm2.js";
export { board, ellR, capF, polyF, U, minus, pol, lerp, ik, flash };

export const T2 = Math.PI * 2;
export const L = (a, b, t) => a + (b - a) * t;
export const mixc = (a, b, t) => {
  const g = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (g(16) << 16) | (g(8) << 8) | g(0);
};
// 7단 색 묶음 [0 외곽 · 1 그늘 · 2 어둠 · 3 중간 · 4 기본 · 5 밝음 · 6 반짝]: 그늘은 푸르게, 빛은 누렇게
export function ramp(c, o = {}) {
  // 거점 팔레트: 원색을 흙빛 쪽으로 살짝 누르고(o.raw면 그대로), 그늘은 차갑게 · 빛은 따뜻하게
  if (!o.raw) { const l = ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11, gr = (Math.round(l) << 16) | (Math.round(l) << 8) | Math.round(l); c = mixc(mixc(c, gr, 0.14), 0x6e5e48, 0.1); }
  const cool = o.cool ?? 0x1e2236, warm = o.warm ?? 0xfff0c8;
  return [mixc(c, 0x08060c, 0.84), mixc(c, cool, 0.66), mixc(c, cool, 0.46), mixc(c, cool, 0.22), c, mixc(c, warm, o.hi ?? 0.3), mixc(c, 0xfffbea, o.sh ?? 0.62)];
}
// 먼 쪽(뒤 다리·뒤 날개): 한 단 어둡고 반짝 없음
export const rampF = (c, o) => {
  const R = ramp(mixc(c, 0x0c1020, 0.36), o);
  return [R[0], R[1], R[1], R[2], R[3], R[4], R[4]];
};
// 빛나는 것(눈·불씨·수정): 어둠 쪽도 밝게
export const rampGlow = (c) => [mixc(c, 0x100808, 0.7), mixc(c, 0x100808, 0.45), mixc(c, 0x100808, 0.25), c, mixc(c, 0xffffff, 0.25), mixc(c, 0xffffff, 0.55), 0xffffff];
export const dots = (C, pts, c) => pts.forEach(([x, y]) => C.over(x, y, c));
export const strokes = (C, list, c) =>
  list.forEach(([x0, y0, x1, y1]) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (let k = 0; k <= n; k++) C.over(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c);
  });
export const rot = (o, a) => (q) => {
  const c = Math.cos(a), s = Math.sin(a), dx = q[0] - o[0], dy = q[1] - o[1];
  return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c];
};
// 눈: 어두운 테 + 눈동자 색 + 빛 한 점 (glow면 빛나는 눈)
export function eye(C, x, y, col = 0xffd040, o = {}) {
  if (o.closed) return void strokes(C, [[x - 1, y, x + 1, y]], o.lid ?? 0x140c10);
  o.big && C.over(x - 1, y, o.rim ?? 0x140c10).over(x + 1, y, o.rim ?? 0x140c10);
  C.over(x, y, col);
  o.big && C.over(x, y - 1, col);
  C.over(x + (o.dir ?? 1) * (o.big ? 1 : 0.6), y - (o.big ? 1 : 0), o.glint ?? 0xffffff);
}
// 반투명 날개 (곤충·요정): f(x, y) 안쪽. dark 0~1 · back = 뒤 날개(몸 뒤에만)
export function glass(C, f, dark = 0, back = !1, tint = 0xd8e8f2) {
  for (let y = 0; y < C.H; y++)
    for (let x = 0; x < C.W; x++) {
      if (!f(x + 0.5, y + 0.5)) continue;
      const i = y * C.W + x, edge = !f(x - 0.5, y + 0.5) || !f(x + 0.5, y - 0.5) || !f(x + 1.5, y + 0.5) || !f(x + 0.5, y + 1.5);
      if (back && C.d[i] >= 0) continue;
      if (edge) C.d[i] = mixc(0x2e3a46, 0x10141a, dark);
      else if (C.d[i] >= 0) C.d[i] = mixc(C.d[i], tint, 0.5 - dark * 0.5);
      else C.d[i] = (x + y) & 1 ? -1 : mixc(tint, 0x5a6a78, dark);
    }
}
// 다리 한 짝 (엉덩이 → 무릎 → 발): bend 1 = 무릎이 앞 · -1 = 뒤. 발 모양 foot(C, 발끝 점)
export function limb(C, hip, foot, l1, l2, bend, w0, w1, R, o = {}) {
  const K = ik(hip, foot, l1, l2, bend);
  C.part(U(capF(hip, K, w0, (w0 + w1) / 2), capF(K, foot, (w0 + w1) / 2, w1)), R, { shine: o.shine ?? 1, lv: o.lv ?? 0 });
  return K;
}
// 걷기 위상 → 네 다리 [x 이동, 들림]
export function gait4(f, n, A = 4, lift = 2.5) {
  const ph = (f / n) * T2, s = Math.sin(ph), c = Math.cos(ph);
  return { fn: [A * s, lift * Math.max(0, c)], ff: [A * Math.sin(ph + 0.6), lift * Math.max(0, Math.cos(ph + 0.6))], bn: [-A * s, lift * Math.max(0, -c)], bf: [-A * Math.sin(ph + 0.6), lift * Math.max(0, -Math.cos(ph + 0.6))], bob: -Math.abs(c) * 1 + 0.4 };
}
// 두 다리 걷기 [x 이동, 들림]
export function gait2(f, n, A = 3, lift = 2) {
  const ph = (f / n) * T2, s = Math.sin(ph), c = Math.cos(ph);
  return { n: [A * s, lift * Math.max(0, c)], f: [-A * s, lift * Math.max(0, -c)], bob: -Math.abs(s) * 0.8 + 0.4, sw: s };
}
// 날갯짓 위상 (-1 내림 ~ 1 올림)
export const flapOf = (f, n) => Math.cos((f / n) * T2);
// 스펙 만들기: fw·fh = 그림 크기 · w·h = 몸 판정 · anims {이름: [장수, fps, 반복]} · pose(이름, k, n) → 자세 · frame(자세) → 그림판
export function spec(fw, fh, w, h, anims, pose, frame, o = {}) {
  return { fw, fh, w, h, anims, ...o, px(nm, f, n) { return frame(pose(nm, f, n, f / Math.max(1, n - 1))); } };
}
// 맞음 번쩍 + 외곽선 마무리
export const done = (C, p) => (C.selout(), p.hurt ? flash(C) : C);
// 흔한 색
export const INK = 0x140c10, WHITE = 0xf4f0e4, BLACKEYE = 0x100c10;
