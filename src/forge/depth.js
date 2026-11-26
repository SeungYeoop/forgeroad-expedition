// 지형 입체감 + 지하 어둠
// 1) 지형 뒤에 같은 그림을 화면 중심(소실점) 쪽으로 조금씩 작게 겹쳐 그려, 블록이 앞으로 튀어나온 것처럼 보이게 한다
// 2) 카메라가 지하로 내려가면 배경을 어두운 굴로 덮고, 플레이어 주변만 밝게 남긴다
import { undergroundState, CAVE_STYLES } from "./underground.js";
import * as G3 from "./bg3d.js";
import { caveBack } from "./bgzones.js";
const mixc = (a, b, t) => { const g = (k) => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); return (g(16) << 16) | (g(8) << 8) | g(0); };
let R = null;
export function bindDepth(r) {
  R = r;
}
const LAYERS = [
  { k: 0.014, tint: 0x9a8a9c, d: -0.3 },
  { k: 0.028, tint: 0x786a80, d: -0.32 },
  { k: 0.042, tint: 0x5c5066, d: -0.34 },
  { k: 0.056, tint: 0x443a50, d: -0.36 },
  { k: 0.07, tint: 0x2e2638, d: -0.38 },
];
const WALL_K = LAYERS[LAYERS.length - 1].k;
const shade = (color, factor) => (Math.round((color >> 16 & 255) * factor) << 16) | (Math.round((color >> 8 & 255) * factor) << 8) | Math.round((color & 255) * factor);
function lightTex(sc) {
  if (sc.textures.exists("dp_light")) return "dp_light";
  const s = 256, c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(s / 2, s / 2, s * 0.08, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.45, "rgba(0,0,0,0.25)");
  g.addColorStop(1, "rgba(0,0,0,1)");
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  sc.textures.addCanvas("dp_light", c);
  return "dp_light";
}
// 지하 덮개 (거점 화풍): 동굴 구역 배경과 같은 붓 — 입술진 천장·바닥, 돌기둥, 종유석·석순, 겹 사이 안개
//   세로로도 이어 붙으므로(위·아래 끝은 어둠) 520px 한 장을 반복한다
function caveTex(sc) {
  if (sc.textures.exists("dp_cave")) return "dp_cave";
  const CB = G3.buffer(640, 520, !0);
  caveBack(CB, 0x3c343a, 777, { warm: 0xd8c4a4, n: 2, ceil: 150, floor: 360 });
  sc.textures.addCanvas("dp_cave", CB.toCanvas());
  return "dp_cave";
}
function dayTex(sc) {
  if (sc.textures.exists("dp_day")) return;
  // 높은 하늘 (거점 화풍): 옅은 하늘색 → 따뜻한 아래, 왼쪽 위 큰 해 번짐, 높이장 뭉게구름
  const DB = G3.buffer(640, 360, !0);
  for (let y = 0; y < 360; y++) {
    const t = y / 359, col = t < 0.55 ? mixc(0x5c9ad8, 0x9ccaea, t / 0.55) : mixc(0x9ccaea, 0xf2e8d4, (t - 0.55) / 0.45);
    for (let x0 = 0; x0 < 640; x0++) DB.put(x0, y, col);
  }
  for (let y = 0; y < 360; y++) for (let x0 = 0; x0 < 640; x0++) { const d = Math.hypot(x0 - 120, (y - 70) * 1.1) / 300; d < 1 && DB.put(x0, y, 0xfff2d0, Math.round(200 * (1 - d) ** 2.2)); }
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 0.618 + 0.2) % 1) * 640, cy = 60 + ((i * 0.41) % 1) * 190, s = 0.9 + ((i * 0.53) % 1) * 1.2;
    for (const ox of [-640, 0, 640]) G3.cloud(DB, cx + ox, cy, s, 0xfff6e6, 0x9cb4cc, 240, 700 + i);
  }
  sc.textures.addCanvas("dp_day", DB.toCanvas());
  // 뭉게구름 띠 (거점 화풍): 높이장 구름을 겹겹이 — 위는 햇빛 받은 크림색, 아래는 하늘빛 그늘로 풀린다
  const w = 640, h = 120, CB = G3.buffer(w, h, !0);
  for (let i = 0; i < 16; i++) {
    const cx = ((i * 0.618) % 1) * w, cy = 52 + (i % 3) * 14 + ((i * 37) % 11), s = 0.75 + ((i * 53) % 10) / 14;
    for (const ox of [-w, 0, w]) G3.cloud(CB, cx + ox, cy, s, 0xf6efe0, 0x9ab0c8, 255, 300 + i);
  }
  for (let y = 84; y < h; y++) for (let x = 0; x < w; x++) CB.put(x, y, y > 100 ? 0xc8d4e0 : 0xe6e8e8, Math.round(255 * Math.min(1, (y - 84) / 20)));
  const k = CB.toCanvas();
  sc.textures.addCanvas("dp_cloud", k);
}
function ensure(sc) {
  if (sc._dp && sc._dp.scene === sc && sc._dp.alive) return sc._dp;
  const W = R.ot, Hh = R.xt;
  const D = { scene: sc, alive: !0, backs: new Map(), walls: new Map() };
  D.cave = sc.add.tileSprite(W / 2, Hh / 2, W, Hh, caveTex(sc)).setScrollFactor(0).setDepth(-90).setAlpha(0);
  dayTex(sc);
  D.day = sc.add.image(W / 2, Hh / 2, "dp_day").setScrollFactor(0).setDepth(-89.6).setDisplaySize(W, Hh).setAlpha(0);
  D.cloud = sc.add.tileSprite(W / 2, Hh - 60, W, 120, "dp_cloud").setScrollFactor(0).setDepth(-89.5).setAlpha(0);
  D.light = sc.add.image(W / 2, Hh / 2, lightTex(sc)).setScrollFactor(0).setDepth(40).setScale(4.2, 3.4).setAlpha(0);
  // 빛 이미지 바깥(가장자리)을 같은 어둠으로 채운다: 시야가 좁아질 때 네모난 경계가 보이지 않게
  D.edge = [0, 1, 2, 3].map(() => sc.add.rectangle(0, 0, 1, 1, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(40).setAlpha(0));
  D.glow = sc.add.image(0, 0, "vx_glow").setBlendMode(R.zt.BlendModes.ADD).setTint(0xffb070).setDepth(9).setScale(3).setAlpha(0);
  sc.events.once("shutdown", () => (D.alive = !1));
  sc._dp = D;
  return D;
}
export function update(sc) {
  if (!R || !sc.world || !sc.player) return;
  const D = ensure(sc);
  const cam = sc.cameras.main, W = R.ot, Hh = R.xt;
  const vx = cam.scrollX + W / 2, vy = cam.scrollY + Hh / 2;
  const { amount: deep, biome } = undergroundState(sc);
  const caveStyle = CAVE_STYLES[biome] ?? CAVE_STYLES.drip;
  // 1) 지형 돌출
  const live = new Set();
  // 뒷벽 깊이 (뒷벽 소품의 빛무리·창 빛줄기도 같은 깊이로 옮긴다: natanim)
  const ws = 1 - WALL_K * (1 + deep * 0.65);
  D.wp = { vx, vy, s: ws };
  // 조각마다 여러 띠(세로로 나눈 그림판)
  const rts = [];
  for (const ch of sc.world.loaded.values()) for (const B of ch.bands?.values() ?? []) rts.push(B.rt);
  for (const rt of rts) {
    const key = sc._frTerr?.get(rt)?.keyF;
    if (!rt || !rt.visible || !key) continue;
    live.add(rt);
    const wallKey = sc._frTerr.get(rt).keyW;
    let wall = D.walls.get(rt);
    if (!wall) {
      wall = sc.add.image(0, 0, wallKey).setOrigin(0).setDepth(-1);
      D.walls.set(rt, wall);
    }
    if (wall.texture.key !== wallKey) wall.setTexture(wallKey);
    // 뒷벽은 입체 겹의 가장 뒤 층과 같은 깊이에 둔다 (앞면과 같이 움직이면 튀어나온 바위보다 앞에 붙어 보인다)
    wall.setVisible(true).setPosition(vx + (rt.x - vx) * ws, vy + (rt.y - vy) * ws).setScale(ws).setTint(deep > 0 ? shade(0xffffff, 1 - deep * 0.12) : 0xffffff);
    let bs = D.backs.get(rt);
    if (!bs) {
      bs = LAYERS.map((L) => sc.add.image(0, 0, key).setOrigin(0, 0).setTint(L.tint).setDepth(L.d));
      D.backs.set(rt, bs);
    }
    bs[0].texture.key !== key && bs.forEach((b) => b.setTexture(key));
    LAYERS.forEach((L, i) => {
      const s = 1 - L.k * (1 + deep * 0.65), b = bs[i];
      b.setTint(deep > 0 ? shade(caveStyle.tint, 1 - i * 0.14) : L.tint);
      b.setVisible(!0).setPosition(vx + (rt.x - vx) * s, vy + (rt.y - vy) * s).setScale(s);
    });
  }
  for (const [rt, bs] of D.backs) if (!live.has(rt)) for (const b of bs) b.setVisible(!1);
  for (const [rt, wall] of D.walls) if (!live.has(rt)) wall.setVisible(false);
  // 2) 지하 어둠: 화면 가운데가 옛 지면보다 얼마나 아래인지
  // 전용 배경(zbg)이 있는 구역은 공용 동굴·낮 하늘 덮개를 쓰지 않는다 (배경 층이 그 역할)
  const zb = !!sc.bg?.region?.zbg;
  D.cave.setAlpha(zb ? 0 : deep).setTilePosition(cam.scrollX * 0.3, cam.scrollY * 0.3);
  // 높은 하늘: 밝은 낮 하늘과 구름이 서서히 나타난다
  // 하늘 구역은 높이와 상관없이 밝은 하늘과 구름
  const alt = zb ? 0 : sc._frSkyZone ? 1 : Math.max(0, Math.min(1, (R.OREF - 520 - vy) / 260));
  D.day.setAlpha(alt);
  D.cloud.setAlpha(alt).setTilePosition(cam.scrollX * 0.15, 0);
  const p = sc.player;
  // 시야 축소 (안개탄·저주): 플레이어 주변만 남기고 어둡게
  sc._blindT = Math.max(0, (sc._blindT ?? 0) - sc.game.loop.delta / 1000);
  const bl = Math.min(1, sc._blindT * 2);
  const la = Math.max(deep * 0.28, bl * 0.88), lsx = 4.2 - bl * 2.3, lsy = 3.4 - bl * 1.9, lx = p.cx - cam.scrollX, ly = p.cy - cam.scrollY;
  D.light.setAlpha(la).setScale(lsx, lsy).setPosition(lx, ly);
  if (D.edge) {
    const hw = 128 * lsx, hh = 128 * lsy, l = lx - hw, r = lx + hw, t = ly - hh, b2 = ly + hh, SW = cam.width + 4, SH = cam.height + 4;
    const rs = [[-2, -2, SW, t + 2], [-2, b2, SW, SH - b2], [-2, t, l + 2, b2 - t], [r, t, SW - r, b2 - t]];
    D.edge.forEach((e, i) => { const [x, y, w, h] = rs[i]; e.setVisible(la > 0.01 && w > 0 && h > 0).setPosition(x, y).setSize(Math.max(1, w), Math.max(1, h)).setAlpha(la); });
  }
  D.glow.setTint(caveStyle.glow).setAlpha(deep * 0.3).setPosition(p.cx, p.cy);
}
