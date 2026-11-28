// 픽셀 단위 지형 충돌 — 자연 지형(4px 밀도장)과 예전 칸 지형을 함께 다룬다.
//
// 몸 모양: 위는 넓고 발은 좁다.
//   위 상자 [x-hw, x+hw] × [y-h, y-corner)   발 [x-fw, x+fw] × [y-corner, y)
// - 경사면에서는 발 가운데가 땅에 닿아 서 있다 (모서리 하나로 떠 있지 않다)
// - 1px 옆으로 갈 때 2px까지 오른다 (약 63°까지 걸어서 오른다), 한 블록(8px) 턱은 저절로 올라선다
// - 더 가파르면 벽이다 (뛰어서 오른다). 턱 모서리에 어깨가 걸리면 옆으로 미끄러져 떨어진다
// - 내리막에서는 땅에 붙어 내려간다 (발이 떠서 통통 튀지 않게)
export const CLIMB = 2, LIP = 8; // 8px 블록 한 칸 턱은 저절로 올라선다

export function installFinePhysics(proto, K) {
  const { gt, vt, Oe, fe, ze, plat, SKY_EDGE } = K;
  const CPX = vt * gt;

  // 전역 픽셀 (gx, py)가 바위인가
  proto.fsolid = function (gx, py) {
    if (py < 0 || py >= Oe) return false;
    // 움직이는 장치 (무너지는 발판·금 간 벽·승강기 발판): 전역 픽셀 사각형
    const DY = this.dyn;
    if (DY && DY.length) for (let i = 0; i < DY.length; i++) { const r = DY[i]; if (r.on && gx >= r.x0 && gx < r.x1 && py >= r.y0 && py < r.y1) return true; }
    const tx = Math.floor(gx / gt);
    if (tx < 0 || this.gates.has(tx) || SKY_EDGE.has(tx)) return true;
    const C = Math.floor(tx / vt);
    const d = this.gen.get(C);
    const f = d.fine;
    if (f) return f.F.v(f.x0 + (gx - C * CPX) + 0.5, py + 0.5) > 0;
    const row = Math.floor(py / gt);
    const v = this.code(tx, row);
    if (v === fe) return true;
    if (v === 4 || v === 5) {
      const fx = gx - tx * gt, fy = py - row * gt;
      return v === 4 ? fy >= gt - 1 - fx : fy >= fx;
    }
    return false;
  };
  // 자연 지형의 특수 블럭 (구역 좌표 사각형): 1 나무판 2 구름 3 물 4 얼음 5 튕김 버섯
  proto.fspec = function (gx, py) {
    const tx = Math.floor(gx / gt);
    if (tx < 0) return 0;
    const C = Math.floor(tx / vt), f = this.gen.get(C).fine;
    if (!f || !f.spec || !f.spec.length) return 0;
    const zx = f.x0 + (gx - C * CPX);
    for (const r of f.spec) if (zx >= r.x0 && zx < r.x1 && py >= r.y0 && py < r.y1) return r.t;
    return 0;
  };
  // 한쪽만 막는 발판 (예전 칸 지형의 나무판·무너지는 판 / 자연 지형의 나무판·구름): 윗줄
  proto.fplat = function (gx, py) {
    if (py < 0 || py >= Oe) return 0;
    const tx = Math.floor(gx / gt);
    if (tx < 0) return 0;
    const C = Math.floor(tx / vt);
    const f = this.gen.get(C).fine;
    if (f) {
      if (!f.spec) return 0;
      const zx = f.x0 + (gx - C * CPX);
      for (const r of f.spec) if (r.t <= 2 && py === r.y0 && zx >= r.x0 && zx < r.x1) return r.t === 2 ? 20 : plat;
      return 0;
    }
    if (py % gt) return 0;
    const v = this.code(tx, py / gt);
    return v === plat || v === 3 || v === 6 ? v : 0;
  };
  // 몸 자리의 장치: 가운데가 든 매달림·바람·물살 칸, 머리 근처를 지나는 짚라인 (구역 좌표)
  proto.devAt = function (S) {
    const gx = Math.floor(S.x + this.originChunk * CPX), tx = Math.floor(gx / gt);
    const out = { sp: 0, wind: null, cur: 0, zip: null, zx: 0, swing: null };
    if (tx < 0) return out;
    const C = Math.floor(tx / vt), f = this.gen.get(C)?.fine;
    if (!f || !f.spec || !f.spec.length) return out;
    const zx = f.x0 + (gx - C * CPX), h = S.h ?? 22, cy = S.y - h / 2, top = S.y - h;
    out.zx = zx;
    for (const r of f.spec) {
      if (r.t === 9) {
        if (r.ax == null) continue;
        const lo = Math.min(r.ax, r.bx), hi = Math.max(r.ax, r.bx);
        if (zx < lo || zx > hi) continue;
        const ly = hi > lo ? r.ay + ((r.by - r.ay) * (zx - r.ax)) / (r.bx - r.ax) : r.ay;
        top >= ly - 8 && top <= ly + 16 && (out.zip = r);
        continue;
      }
      if (r.t === 22) {
        // 덩굴 그네: 늘어진 줄 (ax, ay ~ ay+len) 옆 12px 안에 손이 닿으면
        Math.abs(zx - r.ax) < 12 && top >= r.ay - 4 && top <= r.ay + r.len + 6 && (out.swing = r);
        continue;
      }
      if (zx < r.x0 || zx >= r.x1 || cy < r.y0 || cy >= r.y1) continue;
      if (r.t === 6 || r.t === 7 || r.t === 8) r.nc || (out.sp = r.t); // nc: 그림만 있는 막다른 사다리·밧줄 (2026-11-28)
      else if (r.t === 10) out.wind = r;
      else if (r.t === 11 || r.t === 12) out.cur = r.t === 11 ? -1 : 1;
    }
    return out;
  };
  proto.solidAtPx = function (x, y) {
    return this.fsolid(Math.floor(x) + this.originChunk * CPX, Math.floor(y));
  };
  const shp = (b) => {
    let s = b._sh;
    if (!s || s.w !== b.w || s.h !== b.h) {
      const hw = b.w / 2;
      const fw = Math.max(1, Math.min(7, Math.round(b.w * 0.25), hw - 1));
      const corner = Math.max(3, Math.min(Math.max(3, b.h * 0.5), (hw - fw) * CLIMB + 2));
      s = b._sh = { w: b.w, h: b.h, hw, fw, corner };
    }
    return s;
  };
  // 몸이 (x, y)에 있을 때 지형과 겹치는가
  proto.overlapAt = function (b, x, y) {
    const s = shp(b), g = this.originChunk * CPX;
    const L = Math.floor(x - s.hw + 0.001) + g, Rr = Math.floor(x + s.hw - 0.001) + g;
    const yt = Math.floor(y - b.h + 0.001), yc = Math.floor(y - s.corner - 0.001), yb = Math.floor(y - 0.001);
    // 위 상자: 양옆 4px마다 + 윗변
    for (let yy = yt; yy < yc; yy += 4) if (this.fsolid(L, yy) || this.fsolid(Rr, yy)) return true;
    if (this.fsolid(L, yc) || this.fsolid(Rr, yc)) return true;
    for (let xx = L + 3; xx < Rr; xx += 4) if (this.fsolid(xx, yt)) return true;
    // 발
    const fl = Math.floor(x - s.fw + 0.001) + g, fr = Math.floor(x + s.fw - 0.001) + g;
    for (let yy = yc + 1; yy < yb; yy += 3) if (this.fsolid(fl, yy) || this.fsolid(fr, yy)) return true;
    for (let xx = fl; xx <= fr; xx += 2) if (this.fsolid(xx, yb)) return true;
    return this.fsolid(fr, yb);
  };
  // 발 아래 바로 한 줄이 땅인가 (서 있음)
  proto.footOn = function (b, x, y) {
    const s = shp(b), g = this.originChunk * CPX, yy = Math.floor(y + 0.001);
    const fl = Math.floor(x - s.fw + 0.001) + g, fr = Math.floor(x + s.fw - 0.001) + g;
    for (let xx = fl; xx <= fr; xx += 2) if (this.fsolid(xx, yy)) return true;
    return this.fsolid(fr, yy);
  };
  // 겹친 몸을 빼낸다 (생성 위치·문 닫힘 등)
  proto.unstick = function (b) {
    if (!this.overlapAt(b, b.x, b.y)) return;
    for (let k = 1; k <= 18; k++) if (!this.overlapAt(b, b.x, b.y - k)) return void (b.y -= k);
    for (let k = 1; k <= 12; k++)
      for (const d of [-1, 1]) if (!this.overlapAt(b, b.x + d * k, b.y)) return void (b.x += d * k);
    for (let k = 19; k <= 64; k += 1) if (!this.overlapAt(b, b.x, b.y - k)) return void (b.y -= k);
  };

  proto.move = function (S, T, C = !0) {
    S.hitWall = 0;
    if (!C) {
      S.x += S.vx * T;
      S.y += S.vy * T;
      return;
    }
    this.unstick(S);
    const E = Math.max(Math.abs(S.vx * T), Math.abs(S.vy * T)),
      R = Math.max(1, Math.ceil(E / 4)),
      h = T / R;
    S._g = S.onGround;
    S.onGround = !1;
    // 물 속인가 (몸 가운데)
    const wsp = this.fspec(Math.floor(S.x + this.originChunk * CPX), Math.floor(S.y - (S.h ?? 16) / 2));
    S.inWater = wsp === 3 || wsp === 11 || wsp === 12;
    for (let m = 0; m < R; m++) {
      this.moveX(S, S.vx * h);
      this.moveY(S, S.vy * h);
      // 내리막: 땅에 붙어 내려간다
      if (S._g && !S.onGround && S.vy >= 0) {
        const down = Math.ceil(Math.abs(S.vx * h) * CLIMB) + 2;
        for (let k = 0; k <= down; k++) {
          if (this.footOn(S, S.x, Math.floor(S.y) + k) && !this.overlapAt(S, S.x, Math.floor(S.y) + k)) {
            S.y = Math.floor(S.y) + k;
            this.land(S, S.x, S.y);
            break;
          }
          if (this.overlapAt(S, S.x, Math.floor(S.y) + k + 1)) break;
        }
      }
      S._g = S.onGround || S._g;
    }
    S.dropThrough > 0 && (S.dropThrough -= T);
  };
  proto.land = function (S, x, y, code = fe) {
    const gx = Math.floor(x + this.originChunk * CPX);
    const sp = code === fe ? this.fspec(gx, Math.floor(y) + 1) : 0;
    // 튕김 버섯: 떨어지며 닿으면 높이 튕겨 오른다
    if (sp === 5 && S.vy > 160) {
      S.vy = -Math.max(700, S.vy * 0.95);
      S.bounced = 0.3;
      return;
    }
    S.groundSpec = sp;
    S.onGround = !0;
    S.vy > 0 && (S.vy = 0);
    S.groundCode = code;
    S.groundGtx = Math.floor((x + this.originChunk * CPX) / gt);
    S.groundRow = Math.floor(y / gt);
  };
  proto.moveX = function (S, T) {
    if (T === 0) return;
    let rem = T;
    const dir = T > 0 ? 1 : -1;
    while (rem !== 0) {
      const st = dir > 0 ? Math.min(1, rem) : Math.max(-1, rem);
      const nx = S.x + st;
      if (!this.overlapAt(S, nx, S.y)) {
        S.x = nx;
        rem -= st;
        continue;
      }
      // 오르막·턱
      let ok = !1;
      const maxUp = Math.max(1, Math.ceil(Math.abs(st) * CLIMB));
      const lim = S._g || S.onGround ? LIP : maxUp;
      for (let k = 1; k <= lim; k++) {
        if (this.overlapAt(S, nx, S.y - k)) continue;
        // 짧은 턱이 아니라 계속 가파르게 오르는 면이면 벽이다
        if (k > maxUp && this.overlapAt(S, nx + dir * 3, S.y - k - 2)) break;
        S.x = nx;
        S.y -= k;
        ok = !0;
        break;
      }
      if (!ok) {
        S.vx = 0;
        S.hitWall = dir;
        return;
      }
      rem -= st;
    }
  };
  proto.moveY = function (S, T) {
    if (T === 0) return;
    if (T > 0) {
      let rem = T;
      while (rem > 0) {
        const st = Math.min(1, rem);
        const ny = S.y + st;
        // 한쪽만 막는 발판 (예전 칸 지형)
        if (S.dropThrough <= 0 && Math.floor(ny) > Math.floor(S.y - 0.001) && this.platUnder(S, Math.floor(ny))) {
          S.y = Math.floor(ny);
          const v = this.fplat(Math.floor(S.x + this.originChunk * CPX), S.y);
          this.land(S, S.x, S.y, v || plat);
          v === 3 && this.touchCrumble(Math.floor((S.x + this.originChunk * CPX) / gt), S.y / gt);
          return;
        }
        if (!this.overlapAt(S, S.x, ny)) {
          S.y = ny;
          rem -= st;
          continue;
        }
        const yl = Math.floor(ny - 0.001);
        if (this.footOn(S, S.x, yl) || this.footOn(S, S.x, Math.floor(S.y))) {
          !this.overlapAt(S, S.x, yl) && (S.y = Math.max(S.y, yl));
          this.land(S, S.x, S.y);
          return;
        }
        // 어깨가 모서리에 걸렸다: 걸린 반대쪽으로 미끄러진다
        const s = shp(S), g = this.originChunk * CPX, yc = Math.floor(ny - s.corner);
        const left = this.fsolid(Math.floor(S.x - s.hw) + g, yc) || this.fsolid(Math.floor(S.x - s.hw) + g, yc + 2);
        const d = left ? 1 : -1;
        if (!this.overlapAt(S, S.x + d, ny)) {
          S.x += d;
          S.y = ny;
          rem -= st;
          continue;
        }
        if (!this.overlapAt(S, S.x + d * 2, ny)) {
          S.x += d * 2;
          S.y = ny;
          rem -= st;
          continue;
        }
        this.land(S, S.x, S.y);
        return;
      }
    } else {
      let rem = T;
      while (rem < 0) {
        const st = Math.max(-1, rem);
        const ny = S.y + st;
        if (this.overlapAt(S, S.x, ny)) {
          S.vy = 0;
          return;
        }
        S.y = ny;
        rem -= st;
      }
    }
  };
  proto.platUnder = function (S, y) {
    const s = shp(S), g = this.originChunk * CPX;
    for (const xx of [S.x - s.fw, S.x, S.x + s.fw]) if (this.fplat(Math.floor(xx) + g, y)) return !0;
    return !1;
  };
  // 앞이 낭떠러지인가 (발 앞쪽 아래 48px 안에 땅이 없다)
  proto.ledgeAhead = function (S, T, C = 6) {
    const s = shp(S), g = this.originChunk * CPX;
    const px = Math.floor(S.x + T * (s.hw + C)) + g, y0 = Math.floor(S.y);
    for (let dy = -2; dy <= 48; dy += 2) if (this.fsolid(px, y0 + dy)) return !1;
    return !0;
  };
  // 앞이 벽인가 (걸어서 못 오를 만큼 가파르게 솟았다)
  proto.wallAhead = function (S, T) {
    const s = shp(S), g = this.originChunk * CPX;
    const px = Math.floor(S.x + T * (s.hw + 3)) + g;
    const hgt = Math.round((s.hw + 3 - s.fw) * CLIMB) + LIP;
    const y0 = Math.floor(S.y);
    return this.fsolid(px, y0 - hgt) || this.fsolid(px, y0 - hgt - 8);
  };
  // 그 칸 가운데 주 지면 높이 (px). 없으면 -1
  proto.groundYAt = function (tx) {
    const C = Math.floor(tx / vt), d = this.gen.get(C);
    if (d.gy) return d.gy[tx - C * vt];
    const g = d.ground[tx - C * vt];
    return g > 0 ? (K.Ft - g) * gt : -1;
  };
}
