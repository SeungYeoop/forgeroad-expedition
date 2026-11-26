// 마무리 붓질 (거점 화풍을 모든 구역 배경·지형에) — DOM 없이 픽셀 버퍼만 만진다(작업 스레드에서도 돈다)
//   버퍼 형식: Uint32 = A<<24 | B<<16 | G<<8 | R (엔진 ht · ImageData 같은 순서)
//   · 엉김: 같은 재질의 명암 경계를 2px 뭉치로 엉기게 (곧은 띠 · 바둑판 디더링 → 손으로 찍은 점 덩어리)
//   · 누르기: 채도를 살짝 눌러 흙빛 쪽으로, 빛은 조금 따뜻하게
//   · 얼룩: 2px · 8px 붓 얼룩으로 평평한 면에 결
const hash = (a, b, c = 0) => {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const DIRS = [[2, 0], [-2, 0], [0, 2], [0, -2]];
const near = (u, v, lim) => Math.abs((u & 255) - (v & 255)) + Math.abs(((u >> 8) & 255) - ((v >> 8) & 255)) + Math.abs(((u >> 16) & 255) - ((v >> 16) & 255)) < lim;
const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

// o: { clump(엉김 확률) · mute(채도 누름) · warm(따뜻하게) · tex(얼룩 세기) · ox, oy(세계 좌표 어긋남 — 조각 사이 이음매 없게) · lim(같은 재질로 볼 색 차) }
export function finishBuf(buf, w, h, o = {}) {
  const clump = o.clump ?? 0.3, mute = o.mute ?? 0.12, warm = o.warm ?? 0.025, tex = o.tex ?? 0.05, ox = o.ox ?? 0, oy = o.oy ?? 0, lim = o.lim ?? 80;
  const src = clump || o.despeck ? buf.slice() : buf;
  for (let y = 0; y < h; y++) {
    const Y = y + oy, by = Y >> 1;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = src[i];
      const a = v >>> 24;
      if (!a) continue;
      const X = x + ox, bx = X >> 1;
      if (clump && hash(bx, by, 11) < clump) {
        // 2×2 덩어리 단위로 옆 덩어리의 같은 자리 색을 가져온다 (1px 점이 생기지 않게)
        const d = DIRS[(hash(bx, by, 12) * 4) | 0], xx = x + d[0], yy = y + d[1];
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) {
          const u = src[yy * w + xx];
          if (u >>> 24 === a && u !== v && near(u, v, lim)) v = u;
        }
      }
      let R = v & 255, G = (v >> 8) & 255, B = (v >> 16) & 255;
      if (mute) { const l = R * 0.3 + G * 0.59 + B * 0.11; R += (l - R) * mute; G += (l - G) * mute; B += (l - B) * mute; }
      if (warm) { R *= 1 + warm; B *= 1 - warm * 1.6; }
      if (tex) { const k = 1 + (hash(bx, by, 13) - 0.5) * tex + (hash(X >> 3, Y >> 3, 14) - 0.5) * tex * 0.7; R *= k; G *= k; B *= k; }
      // 고립된 1px 점 정리: 위아래·좌우 이웃이 모두 같은 색이면 그 색으로 (점박이 소금·후추 없애기)
      if (o.despeck && x > 0 && y > 0 && x < w - 1 && y < h - 1) {
        const l = src[i - 1], r = src[i + 1], u = src[i - w], dn = src[i + w];
        if (l === r && u === dn && l === u && l !== v && l >>> 24 === a) { R = l & 255; G = (l >> 8) & 255; B = (l >> 16) & 255; if (mute) { const lm = R * 0.3 + G * 0.59 + B * 0.11; R += (lm - R) * mute; G += (lm - G) * mute; B += (lm - B) * mute; } }
      }
      buf[i] = ((a << 24) | (cl(B) << 16) | (cl(G) << 8) | cl(R)) >>> 0;
    }
  }
}
// ImageData 꼴(Uint8ClampedArray RGBA)
export const finishRGBA = (data, w, h, o) => finishBuf(new Uint32Array(data.buffer, data.byteOffset, (data.byteLength / 4) | 0), w, h, o);
