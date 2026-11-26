// 지형 픽셀 계산 전용 작업 스레드 (칸 지형은 terrain.js pixSteps, 자연 지형은 terrfine.js pixFine)
import { pixSteps } from "./terrain.js";
import { pixFine, cropBand } from "./terrfine.js";
import { paintProp } from "./natprops.js";
import { finishRGBA } from "./paintfx.js";

self.onmessage = (ev) => {
  // 쉴 때 받은 소품 그림 미리 그리기 (캐시만 채운다)
  if (ev.data.warm) {
    const pal = ev.data.pal;
    for (const p of ev.data.warm) {
      try {
        paintProp(p.k, p.s, p.v, p.acc != null ? { ...pal, acc: p.acc } : pal, p.sc ?? 1, p.g ?? 0, p.ext ? { h: p.s, w: p.v } : null);
      } catch (e) {}
    }
    self.postMessage({ warmDone: 1 });
    return;
  }
  const { id, codes, CW, ROWS, margin, base, ch, region, fine, bandTop, bandH } = ev.data;
  try {
    let g;
    if (fine) g = pixFine(ch, base, region, fine);
    else {
      const raw = (wc, r) => {
        const c = Math.max(0, Math.min(CW - 1, wc - base + margin));
        return codes[r * CW + c];
      };
      g = pixSteps({ grid: { length: ch.n }, ug: ch.ug, clouds: ch.clouds, pools: ch.pools }, base, raw, region);
    }
    let s;
    do s = g.next(); while (!s.done);
    // 띠 부분만 (자연 지형은 위아래 여유 줄, 칸 지형은 전체에서 띠)
    const { img, front, wall } = fine ? cropBand(s.value, fine.cropTop, fine.cropH) : cropBand(s.value, bandTop ?? 0, bandH ?? s.value.img.height);
    // 거점 화풍 마무리 붓질 (본 그림 · 뒷벽). 세계 x로 붓 얼룩을 맞춰 조각 이음매가 없게
    finishRGBA(img.data, img.width, img.height, { ox: base * 16, oy: (fine ? fine.y0 ?? 0 : 0) + (fine ? fine.cropTop : bandTop ?? 0), clump: 0.28, mute: 0.16, tex: 0.06, lim: 70 });
    finishRGBA(wall, img.width, img.height, { ox: base * 16, clump: 0.2, mute: 0.18, tex: 0.05, lim: 70 });
    self.postMessage({ id, h: img.height, img: img.data.buffer, front: front.buffer, wall: wall.buffer }, [img.data.buffer, front.buffer, wall.buffer]);
  } catch (e) {
    self.postMessage({ id, error: String(e) });
  }
};
