// 구역 설계도: 손으로 정한 배치(구간·섬·동굴 방·던전 방과 역할). 모양 세부(바위 가장자리·종유석·벽돌)는 생성기가 그린다
// 좌표: px (구역 왼쪽 위 기준). 지표 기준 높이 y=4800. 1칸(블록)=8px
// 역할(role): rest 쉼터(적 없음) · arena 전투(적 더) · treasure 보물(상자) · vista 전망 · sanctum 성소 · trap 함정

// 동굴 방 한 줄: [id, x0, x1, 바닥 y, 높이, 종류, 바닥, 역할, 덧붙임(peak·deep·entry)]
function cvR(rows) { return rows.map(([id, x0, x1, fy, h, kind, floor, role, ex]) => ({ id, x0, x1, fy, h, kind, floor, role, ...(ex ?? {}) })); }
const _cvR0 = (rows) => rows.map(([id, x0, x1, fy, h, kind, floor, role, ex]) => ({ id, x0, x1, fy, h, kind, floor, role, ...(ex ?? {}) }));


// 탑 속 계단 굴: 탑 [x0, x1] 바닥 문(Fb, 들어오는 쪽 inSide)에서 꼭대기(top)까지 좌우 방을 번갈아 비탈 굴로 잇는다 (한 칸 가로 450 · 높이 ≤ 380)
//   outSide를 주면 맨 위 방에 그쪽 옆문(F = outF), 아니면 마지막 굴이 탑 윗면으로 나온다
function towerInner(x0, x1, Fb, top, inSide, outSide = null, outF = null, branch = 0, kind = "ruin") {
  const L = [x0 + 30, x0 + 300], Rr = [x1 - 300, x1 - 30], halls = [], pass = [];
  const end = outSide ? outF : top + 250;
  const n = Math.max(1, Math.ceil((Fb - end) / 380));
  const dy = (Fb - end) / n;
  let side = inSide === "W" ? 0 : 1, F = Fb;
  for (let k = 0; k <= n; k++) {
    const [a, c] = side ? Rr : L;
    halls.push({ x0: a, x1: c, F: Math.round(F), h: 190, role: k === 0 ? "rest" : k % 3 === 2 ? "treasure" : "arena" });
    if (k < n) {
      const nF = Math.round(F - dy);
      side ? pass.push([Rr[0], Math.round(F), L[1], nF]) : pass.push([L[1], Math.round(F), Rr[0], nF]);
      F = nF;
      side ^= 1;
    }
  }
  const last = halls[halls.length - 1];
  if (!outSide) pass.push(side ? [last.x0, last.F, last.x0 - 450, top] : [last.x1, last.F, last.x1 + 450, top]);
  const mouths = [{ side: inSide, x: inSide === "W" ? halls[0].x0 : halls[0].x1, F: Fb }];
  outSide && mouths.push({ side: outSide, x: outSide === "W" ? last.x0 : last.x1, F: last.F });
  // 가지 문: branch 층마다 그 방의 바깥 벽에 옆문 (바로 붙은 가지 섬으로 걸어 나간다)
  const doors = [];
  for (let k = 2; branch && k < halls.length - 1; k += branch) {
    const h = halls[k], sd = h.x0 < (x0 + x1) / 2 ? "W" : "E";
    mouths.push({ side: sd, x: sd === "W" ? h.x0 : h.x1, F: h.F });
    doors.push({ side: sd, F: h.F });
  }
  // 들어오는 문을 맨 뒤로 (같은 쪽 가지 문에 이름이 덮이지 않게)
  mouths.push(mouths.shift());
  return { kind, halls, pass, mouths, doors };
}

export const BLUEPRINTS = {
  // ── g1_0 「재의 들판」: 1번 지역 첫 지상 구역. 난이도 낮음 ──
  // ▲ 문 x≈4352 y≈1200 (거대 하늘섬 평평한 윗면), ▼ 문 x≈3330 (서쪽 동굴 맨 아래 심연 동굴)
  // 땅속: 서쪽 절반 자연 동굴, 동쪽 절반 고대 유적 던전 (층마다 무너진 벽으로 이어진다)
  g1_0: {
    // 지표 구간 (높이는 위로 +px)
    surface: [
      { kind: "flat", a: 0, b: 700 }, // 입구 들판: 안전한 시작
      { kind: "hills", a: 700, b: 1900, bumps: [{ c: 1060, h: 130, w: 280 }, { c: 1560, h: 210, w: 320 }], role: "arena" }, // 낮은 구릉: 단 점프 익히기
      { kind: "valley", a: 1900, b: 2900, c: 2400, d: 190, w: 430, p: 0.36, pond: 180 }, // 재 골짜기: 연못(헤엄)
      { kind: "mountain", a: 2950, b: 5800, c: 4330, h: 600, wl: 1380, wr: 1470, top: 0.12, shoulder: { side: 1, at: 0.5, amt: 0.14 } }, // 재의 산: 이정표·하늘 출발점
      { kind: "mesa", a: 5800, b: 7300, c: 6560, h: 220, w: 640, p: 0.58, role: "arena" }, // 고원: 첫 전투 무대
      { kind: "flat", a: 7300, b: 8192 }, // 출구 들판
    ],
    // 지표 함정 (평평한 자리)
    pads: [],
    // 지표 보물: 산 서쪽 중턱 작은 굴 (막다른 곳에 상자)
    spots: [{ xa: 4960, xb: 5160, role: "treasure" }, { xa: 6300, xb: 6900, role: "arena" }, { xa: 1000, xb: 1700, role: "arena" }],
    // 지표 굴 입구 (→ 입구 동굴): 골짜기 서쪽 비탈 (연못 옆)
    mouths: [{ x: 2140, to: "C1" }],
    // 하늘: 거대 섬 셋(▲ 섬 · 서쪽 거대 섬 · 동쪽 거대 섬) + 큰 섬들. 산 모양 없이 윗면은 평평하거나 큰 턱
    //   큰 섬은 옆 굴 입구로 들어가 섬 속 동굴을 지나 꼭대기로 나온다 (거대 섬은 낮은 쪽 꼭대기 → 턱 벽 굴 입구 → 높은 쪽 꼭대기)
    //   서쪽 길: 산 정상 → A1 → W1(거대: 낮은 쪽 속 동굴·샘 → 턱 벽 입구 → 높은 쪽 속 동굴, 보물) → W3(속 폐허, 보물실) → W4(속 기둥 동굴) → W5 → ▲ 섬 서쪽 입구
    //   동쪽 길: 산 동쪽 어깨 → E1 → E2(거대: 낮은 쪽 속 동굴·샘 → 턱 벽 입구 → 높은 쪽 기둥 동굴) → E4(속 동굴·샘, 보물) → E5(속 동굴) → E6 → ▲ 섬 동쪽 입구
    //   ▲ 섬 속 신전: 양쪽 옆 입구 → 방 → 계단 → 방 → 계단 → 평평한 윗면의 ▲ 문 (서쪽 성소에 큰 상자)
    //     지하 묘실 (신전 아래): 서쪽 회랑 바닥 계단 ↔ 묘실 회랑 → 보물실, 동쪽 경비실 바닥 구멍으로 떨어져도 들어온다
    //   높은 하늘: ▲ 섬 서쪽 끝 → W6 보물섬 → W7 전망섬 · ▲ 섬 동쪽 끝 → E7 보물섬
    //   "id>" / "id<" = 동쪽 / 서쪽 옆 굴 입구, "id^" = 턱 섬의 높은 쪽, "g:x" = 땅 x 자리 평지
    //   섬 속: halls 방 [x0, x1, 바닥 F, 높이 h] (kind pool 샘 · pillar 뒤 기둥) · pass 계단 굴 [xa, fa, xb, fb] · mouths 옆 입구 (edge = 입구가 뚫린 벽 x)
    sky: {
      peakY: 1200,
      gate: {
        cx: 4350, w: 2800, sh: 760, tS: 1500, belly: 0.7, flat: true,
        inner: {
          kind: "ruin",
          halls: [
            { x0: 3000, x1: 3300, F: 1840, h: 200, type: "colonnade", role: "arena" }, // 서쪽 회랑
            { x0: 3600, x1: 3940, F: 1520, h: 230, type: "sanctum" }, // 성소 (큰 상자)
            { x0: 5400, x1: 5700, F: 1830, h: 200, role: "arena" }, // 동쪽 경비실
            { x0: 4760, x1: 5060, F: 1520, h: 210, type: "colonnade", role: "rest" }, // 동쪽 회랑
            { x0: 3600, x1: 4200, F: 2300, h: 220, type: "colonnade", role: "arena", trap: [3860, 3940] }, // 지하 묘실 회랑 (가운데 가시)
            { x0: 3900, x1: 4900, F: 2024, h: 190, role: "rest" }, // 중층 홀 (묘실 계단 중간에서 가로 굴)
            { x0: 4400, x1: 5560, F: 2360, h: 280, type: "vault", role: "treasure" }, // 지하 묘실 보물실
          ],
          pass: [[3300, 1840, 3600, 1520, 150], [3940, 1520, 4260, 1200, 150], [5400, 1830, 5060, 1520, 150], [4760, 1520, 4440, 1200, 150], [4200, 2300, 4400, 2360, 150], [3600, 2300, 3120, 1840, 150], [3300, 2024, 3900, 2024, 150]],
          // 동쪽 경비실 바닥 구멍 → 보물실 (한쪽 길, 나올 때는 서쪽 계단)
          drops: [[5440, 5480, 1830, 2080]],
          mouths: [{ side: "W", x: 3000, F: 1840 }, { side: "E", x: 5700, F: 1830 }],
        },
      },
      isles: [
        { id: "A1", cx: 3700, top: 3992, w: 520, t: 220, role: "rest" }, // 산 위 쉼터: ▲ 섬 밑이 올려다보인다
        { id: "M", cx: 3650, top: 3400, w: 700, t: 260, shape: "lumpy", role: "vista" }, // 가운데 전망 섬: ▲ 섬 배와 양쪽 길이 다 보인다
        // 서쪽 거대 섬: 높은 쪽(서) 2860 · 낮은 쪽(동) 3440
        { id: "W1", cx: 1590, top: 3440, w: 2820, t: 700, shape: "block", form: "keel", role: "rest", step: { at: 0.468, dy: 580, hi: "L" },
          inner: { halls: [{ x0: 2480, x1: 2900, F: 3880, h: 220, role: "arena" }, { x0: 1960, x1: 2180, F: 3700, h: 200, kind: "pool", role: "rest" },
              { x0: 1000, x1: 1300, F: 3332, h: 210, role: "arena" }, { x0: 560, x1: 760, F: 3132, h: 190, role: "treasure" }],
            pass: [[2480, 3880, 2180, 3700], [1960, 3700, 1640, 3440], [1000, 3332, 760, 3132], [560, 3132, 320, 2860]],
            mouths: [{ side: "E", x: 1300, F: 3332, edge: 1500 }, { side: "E", x: 2900, F: 3880 }] } },
        { id: "W3", cx: 2240, top: 2250, w: 1200, t: 700, shape: "block", form: "tiers", role: "rest",
          inner: { kind: "ruin", halls: [{ x0: 1720, x1: 2040, F: 2792, h: 200, type: "colonnade", role: "arena" }, { x0: 2300, x1: 2480, F: 2532, h: 180, type: "vault", role: "treasure" }],
            pass: [[2040, 2792, 2300, 2532], [2480, 2532, 2760, 2250]], mouths: [{ side: "W", x: 1720, F: 2792 }] } },
        { id: "W4", cx: 870, top: 1700, w: 1140, t: 660, shape: "block", form: "cone", role: "arena",
          inner: { halls: [{ x0: 1060, x1: 1380, F: 2142, h: 200, role: "rest" }, { x0: 640, x1: 820, F: 1942, h: 180, kind: "pillar", role: "arena" }],
            pass: [[1060, 2142, 820, 1942], [640, 1942, 400, 1700]], mouths: [{ side: "E", x: 1380, F: 2142 }] } },
        { id: "W5", cx: 2225, top: 1800, w: 950, t: 260, shape: "slab", role: "arena" }, // ▲ 섬 앞 들판 섬
        { id: "W6", cx: 2300, top: 1250, w: 700, t: 320, shape: "lumpy", role: "treasure" }, // 높은 하늘 보물섬
        { id: "W7", cx: 1130, top: 1180, w: 700, t: 300, shape: "spire", role: "vista" }, // 가장 높은 서쪽 전망섬
        // 동쪽 거대 섬: 낮은 쪽(서) 3700 · 높은 쪽(동) 3200
        { id: "E1", cx: 5560, top: 4304, w: 380, t: 140, shape: "slab", role: "rest" },
        { id: "E2", cx: 7030, top: 3700, w: 2120, t: 600, shape: "block", form: "roots", role: "arena", step: { at: 0.547, dy: 500, hi: "R" },
          inner: { halls: [{ x0: 6060, x1: 6400, F: 4080, h: 210, role: "arena" }, { x0: 6640, x1: 6800, F: 3880, h: 190, kind: "pool", role: "rest" },
              { x0: 7280, x1: 7580, F: 3592, h: 220, kind: "pillar", role: "arena" }],
            pass: [[6400, 4080, 6640, 3880], [6800, 3880, 7000, 3700], [7580, 3592, 7940, 3200]],
            mouths: [{ side: "W", x: 7280, F: 3592, edge: 7130 }, { side: "W", x: 6060, F: 4080 }] } },
        { id: "E4", cx: 6400, top: 2560, w: 1000, t: 640, shape: "block", form: "bowl", role: "arena",
          inner: { halls: [{ x0: 6560, x1: 6850, F: 3052, h: 220, kind: "pool", role: "rest" }, { x0: 6180, x1: 6320, F: 2812, h: 190, role: "treasure" }],
            pass: [[6560, 3052, 6320, 2812], [6180, 2812, 5960, 2560]], mouths: [{ side: "E", x: 6850, F: 3052 }] } },
        { id: "E5", cx: 7550, top: 2050, w: 900, t: 620, shape: "block", form: "cone", role: "rest", step: { at: 0.4, dy: 72, hi: "L" },
          inner: { halls: [{ x0: 7180, x1: 7480, F: 2452, h: 220, role: "arena" }],
            pass: [[7480, 2452, 7860, 2050]], mouths: [{ side: "W", x: 7180, F: 2452 }] } },
        { id: "E6", cx: 6330, top: 1840, w: 900, t: 300, shape: "slab", role: "arena", step: { at: 0.6, dy: 72, hi: "R" } }, // ▲ 섬 앞 턱 섬
        { id: "E7", cx: 6220, top: 1150, w: 680, t: 300, shape: "lumpy", role: "treasure" }, // 높은 하늘 보물섬 (동, ▲ 섬 동쪽 끝에서)
        // 갈래 섬 (땅 가까이)
        { id: "CV", cx: 4870, top: 3904, w: 340, t: 150, role: "treasure", shape: "spire" }, // 산 정상에서 오르는 보물섬
        { id: "XT", cx: 7969, top: 4504, w: 190, t: 120, role: "treasure", shape: "spire" }, // 출구 들판 위 작은 보물 바위
      ],
      // 이을 길 (아래 → 위)
      links: [
        ["g:4250", "A1"], ["A1", "W1>"], ["W1^", "W3<"], ["W3", "W4>"], ["W4", "W5"], ["W5", "G<"],
        ["g:5040", "E1"], ["E1", "E2<"], ["E2^", "E4>"], ["E4", "E5<"], ["E5^", "E6^"], ["E6", "G>"],
        ["G", "W6"], ["G", "E7"], ["W6", "W7"], ["g:4250", "CV"], ["W1", "M"], ["g:7520", "XT"],
      ],
    },
    // 서쪽 자연 동굴 (x 0~4100): 방 [x0, x1, 바닥 y, 높이] + 종류·역할
    // 바위층 사이 동굴 띠 다섯. 띠마다 방 3~4개가 높낮이를 바꿔 가며 이어지고, 위아래는 던전(탑 방)·협곡·떨어지는 구멍으로 오간다
    //   띠 안에서는 이웃 방 일부만 가로로 잇고, 나머지는 위아래 띠로 돌아가게 한다 (미로)
    //   띠1: 서쪽 동굴 · 입구 동굴 · 덩굴 회랑 · 산 밑 큰 공동 (→ 던전 1층)
    //   띠2: 뿌리 굴 · 박쥐 둥지 · 갈림 굴 · 협곡 옆 굴 (→ 협곡) + 이끼 굴 · 박쥐 동굴 (→ 던전 2·3층)
    //   띠3: 지하 호수 · 전투 홀 · 고드름 굴 (→ 던전 5층)
    //   띠4: 버섯 굴 · 메아리 홀 · 낮은 굴 · 탑 밑 굴 (→ 던전 6층 탑 밑)
    //   띠5: 깊은 동굴 · 수정 동굴 · ▼ 심연 동굴 (→ 던전 8층) + 던전 옆 쉼터 (→ 던전 7층)
    //   협곡: 산 밑 큰 공동(C3) 바닥 구멍 → 이끼 굴(C13) → 박쥐 동굴(C8). 두 층 사이만
    caves: [
      { id: "C1", x0: 1240, x1: 1780, fy: 5160, h: 220, kind: "hall", floor: "flat", role: "rest" }, // 입구 동굴
      { id: "C4", x0: 150, x1: 880, fy: 5264, h: 240, kind: "pillared", floor: "flat", role: "arena" }, // 서쪽 동굴
      { id: "C2", x0: 2230, x1: 2950, fy: 5440, h: 230, kind: "tiered", floor: "steps", role: "arena" }, // 덩굴 회랑
      { id: "C3", x0: 3060, x1: 4060, fy: 5472, h: 470, kind: "grand", floor: "flat", role: "vista" }, // 산 밑 큰 공동 (바닥 구멍 → 동쪽 협곡)
      { id: "C13", x0: 3460, x1: 4060, fy: 5856, h: 200, kind: "small", floor: "flat", role: "rest" }, // 이끼 굴 (→ 던전 보물실 1)
      { id: "C8", x0: 3460, x1: 4060, fy: 6240, h: 230, kind: "hall", floor: "steps", role: "arena" }, // 박쥐 동굴 (→ 던전 함정 복도)
      { id: "C5", x0: 250, x1: 1500, fy: 6650, h: 330, kind: "lake", floor: "basin", role: "treasure" }, // 지하 호수 (물 건너 상자)
      { id: "C7", x0: 2260, x1: 3000, fy: 6880, h: 300, kind: "pillared", floor: "mound", role: "arena" }, // 전투 홀
      { id: "C12", x0: 3460, x1: 4060, fy: 7008, h: 240, kind: "tiered", floor: "steps", role: "treasure" }, // 고드름 굴 (→ 던전 보물실 3)
      { id: "C9", x0: 300, x1: 1500, fy: 7760, h: 260, kind: "hall", floor: "steps", role: "arena" }, // 깊은 동굴
      // 띠2 (서쪽 → 협곡)
      { id: "N1", x0: 250, x1: 700, fy: 5950, h: 210, kind: "small", floor: "flat", role: "treasure" }, // 뿌리 굴 (막다른 곳 상자)
      { id: "N2", x0: 950, x1: 1500, fy: 5850, h: 240, kind: "hall", floor: "mound", role: "arena" }, // 박쥐 둥지
      { id: "N3", x0: 1750, x1: 2300, fy: 6000, h: 250, kind: "tiered", floor: "steps", role: "rest" }, // 갈림 굴
      { id: "N4", x0: 2550, x1: 3050, fy: 6150, h: 220, kind: "hall", floor: "flat", role: "arena" }, // 협곡 옆 굴
      // 띠4 (서쪽 → 던전 탑 E 밑)
      { id: "P1", x0: 300, x1: 850, fy: 7250, h: 200, kind: "small", floor: "flat", role: "treasure" }, // 버섯 굴 (막다른 곳 상자)
      { id: "P2", x0: 1100, x1: 1700, fy: 7200, h: 230, kind: "hall", floor: "mound", role: "arena" }, // 메아리 홀
      { id: "P3", x0: 1950, x1: 2550, fy: 7300, h: 210, kind: "hall", floor: "steps", role: "rest" }, // 낮은 굴
      { id: "P4", x0: 2800, x1: 3350, fy: 7392, h: 220, kind: "tiered", floor: "steps", role: "arena" }, // 탑 밑 굴
      { id: "C14", x0: 3460, x1: 4060, fy: 7776, h: 230, kind: "hall", floor: "flat", role: "rest" }, // 던전 옆 쉼터 (→ 던전 보물실 5)
      { id: "C11", x0: 1900, x1: 2500, fy: 8100, h: 240, kind: "small", floor: "flat", role: "treasure", ceil: "dome" }, // 수정 동굴
      { id: "C10", x0: 2900, x1: 3720, fy: 8240, h: 260, kind: "hall", floor: "flat", role: "rest", deep: 1 }, // ▼ 심연 동굴
    ],
    shafts: [{ x: 3240, top: 5472, bot: 6240, w: 200 }],
    // 띠마다 서쪽 무리와 동쪽 무리로 나눠 가로로는 끊고, 서쪽 무리는 바닥 구멍으로 아래 띠에 떨어진다 (지표 입구 → ▼ 동굴까지 내려가는 길)
    //   올라올 때는 동쪽 던전 탑이나 협곡으로
    links: [
      ["C4", "C1"], ["C2", "C3"], ["N1", "N2"], ["N3", "N4"], ["C5", "C7"], ["C7", "C12"], ["P1", "P2"], ["P3", "P4"], ["C9", "C11"], ["C11", "C10"],
      ["C3", "R00"], ["C13", "R10"], ["C8", "R20"], ["C12", "TE"], ["P4", "TE_d"], ["C14", "R60"], ["C10", "R71"],
    ],
    // 떨어지는 구멍 [위 방, 아래 방]
    //   셋째 값 = 구멍을 못 뚫을 때 대신 이을 옆길 (구멍으로만 드나드는 무리가 막히지 않게)
    drops: [["C1", "N2", ["N2", "N3"]], ["N1", "C5", ["N2", "N3"]], ["C5", "P2", ["P2", "P3"]], ["P1", "C9", ["P2", "P3"]], ["N4", "C7", ["N2", "N3"]], ["P3", "C11"]],
    // 동쪽 던전 (고대 유적): 격자 칸 512×384px, 6열 × 8층. 방은 직사각형, 길은 수평 문과 탑 방만
    //   내려가는 길: 정문 탑 → 1층 회랑 → 탑 A → 2층 투기장 → 탑 B → 3층 → 탑 C → 4층 → 탑 D → 5층 → 탑 E → 6층 → 탑 F → 7층 → 탑 G → 성소
    //   탑은 열을 바꿔 가며 놓아 층마다 가로로 지나가게 하고, 탑마다 발판 짜임이 다르다
    //   서쪽 벽 동굴 길 (cave): 1·2·3·5·7·8층 — 동굴 쪽에서만 들어가는 보물실도 있다
    dungeon: {
      x0: 4224,
      y0: 5120,
      cols: 6,
      stories: 8,
      gate: { door: 7250, col: 5 },
      // 탑: 열, 윗층 s (s·s+1 두 층), 윗층 문 쪽(up)·아랫층 문 쪽(down), 발판 짜임
      towers: [
        { id: "TA", col: 2, s: 0, up: "WE", down: "WE", pat: "zig" },
        { id: "TB", col: 5, s: 1, up: "W", down: "W", pat: "float" },
        { id: "TC", col: 1, s: 2, up: "WE", down: "WE", pat: "ring" },
        { id: "TD", col: 4, s: 3, up: "WE", down: "WE", pat: "pillar" },
        { id: "TE", col: 0, s: 4, up: "WE", down: "WE", pat: "zig", cave: "both" },
        { id: "TF", col: 3, s: 5, up: "WE", down: "WE", pat: "float" },
        { id: "TG", col: 5, s: 6, up: "W", down: "W", pat: "ring" },
      ],
      // 방: [열 시작, 열 끝, 층] 종류·역할. 같은 층 이웃 방은 문으로 잇는다. cave: 서쪽 벽에 동굴로 난 길
      rooms: [
        { id: "R00", c0: 0, c1: 1, s: 0, type: "guard", role: "arena", cave: 1 }, // 경비실 (산 밑 큰 공동과 이어짐)
        { id: "R01", c0: 3, c1: 4, s: 0, type: "colonnade", role: "arena" }, // 입구 회랑: 첫 전투
        { id: "R10", c0: 0, c1: 1, s: 1, type: "vault", role: "treasure", cave: 1 }, // 보물실 1 (이끼 굴 ↔ 탑 TA 아래층)
        { id: "R11", c0: 3, c1: 4, s: 1, type: "arena", role: "arena" }, // 투기장 1
        { id: "R20", c0: 0, c1: 0, s: 2, type: "trap", role: "trap", cave: 1 }, // 함정 복도 (동굴로)
        { id: "R21", c0: 2, c1: 3, s: 2, type: "colonnade", role: "arena" }, // 경비 회랑
        { id: "R22", c0: 4, c1: 4, s: 2, type: "guard", role: "arena" }, // 초소
        { id: "R30", c0: 0, c1: 0, s: 3, type: "shrine", role: "rest" }, // 쉼터 1
        { id: "R31", c0: 2, c1: 3, s: 3, type: "arena", role: "arena" }, // 투기장 2
        { id: "R32", c0: 5, c1: 5, s: 3, type: "vault", role: "treasure" }, // 보물실 2
        { id: "R41", c0: 1, c1: 2, s: 4, type: "trap", role: "trap" }, // 감옥 복도 (가시)
        { id: "R43", c0: 3, c1: 3, s: 4, type: "guard", role: "arena" }, // 간수실
        { id: "R42", c0: 5, c1: 5, s: 4, type: "shrine", role: "rest" }, // 쉼터 2
        { id: "R51", c0: 1, c1: 2, s: 5, type: "arena", role: "arena" }, // 투기장 3
        { id: "R52", c0: 4, c1: 5, s: 5, type: "vault", role: "treasure" }, // 보물 창고 (받침대 셋)
        { id: "R60", c0: 0, c1: 0, s: 6, type: "vault", role: "treasure", cave: 1 }, // 보물실 3 (동굴과 이어짐)
        { id: "R61", c0: 1, c1: 2, s: 6, type: "shrine", role: "rest" }, // 쉼터 3 (성소 앞)
        { id: "R62", c0: 4, c1: 4, s: 6, type: "guard", role: "arena" }, // 성소 문지기
        { id: "R71", c0: 0, c1: 1, s: 7, type: "vault", role: "treasure", cave: 1 }, // 성소 뒤 보물실 (▼ 동굴로)
        { id: "R70", c0: 2, c1: 4, s: 7, type: "sanctum", role: "arena" }, // 성소: 마지막 전투 + 큰 상자
      ],
    },
  },
};

// ── 설계도 변형 도구: 높이 옮기기 · 좌우 뒤집기 (그래스메어 하늘 설계를 하늘 구역으로 옮길 때) ──
const WZ = 8192;
const mapInner = (I, fx, fy) => I && {
  ...I,
  halls: (I.halls ?? []).map((h) => ({ ...h, ...xs(fx, h.x0, h.x1), F: fy(h.F), trap: h.trap ? sortX(fx(h.trap[0]), fx(h.trap[1])) : undefined })),
  pass: (I.pass ?? []).map(([xa, fa, xb, fb, w]) => [fx(xa), fy(fa), fx(xb), fy(fb), w].filter((v) => v !== undefined)),
  drops: (I.drops ?? []).map(([x0, x1, y0, y1]) => [...sortX(fx(x0), fx(x1)), fy(y0), fy(y1)]),
  mouths: (I.mouths ?? []).map((m) => ({ ...m, x: fx(m.x), F: fy(m.F), edge: m.edge != null ? fx(m.edge) : undefined, side: fx(0) > fx(1) ? (m.side === "W" ? "E" : "W") : m.side })),
};
const sortX = (a, b) => (a < b ? [a, b] : [b, a]);
const xs = (fx, x0, x1) => { const [a, b] = sortX(fx(x0), fx(x1)); return { x0: a, x1: b }; };
// 하늘 설계도 S를 (dx 뒤집기 여부 flip, 높이 dy)로 옮긴다
export function moveSky(S, { flip = false, dy = 0, W = WZ } = {}) {
  const fx = flip ? (x) => W - x : (x) => x, fy = (y) => y + dy;
  const swapId = (k) => {
    if (k.startsWith("g:")) return "g:" + fx(Number(k.slice(2)));
    if (k.startsWith("G:")) return "G:" + fx(Number(k.slice(2)));
    if (!flip) return k;
    return k.endsWith(">") ? k.slice(0, -1) + "<" : k.endsWith("<") ? k.slice(0, -1) + ">" : k;
  };
  return {
    ...S,
    peakY: fy(S.peakY),
    gate: S.gate && { ...S.gate, cx: fx(S.gate.cx), inner: mapInner(S.gate.inner, fx, fy) },
    isles: S.isles.map((q) => ({
      ...q, cx: fx(q.cx), top: fy(q.top),
      step: q.step && flip ? { ...q.step, at: 1 - q.step.at, hi: q.step.hi === "L" ? "R" : "L" } : q.step,
      inner: mapInner(q.inner, fx, fy),
    })),
    links: S.links.map(([a, b, n]) => [swapId(a), swapId(b), n].filter((v) => v !== undefined)),
  };
}
// 섬 몇 개만 바꾸기 (id → 덮어쓸 값, null이면 지움)
export function editSky(S, patch = {}, links = null) {
  const isles = S.isles.filter((q) => patch[q.id] !== null).map((q) => (patch[q.id] ? { ...q, ...patch[q.id] } : q));
  for (const [id, q] of Object.entries(patch)) q && !S.isles.some((p) => p.id === id) && isles.push({ id, ...q });
  return { ...S, isles, links: links ?? S.links };
}

// ── g1_m1 「스톤브리지 · 공중 도시」 손 설계: 하늘에 걸린 벽돌 도시 ──
//   벽돌 대로 셋(길이 3600~4900)이 층층이 걸리고, 대로 끝마다 벽돌 탑 — 탑 속 계단 굴(좌우 방을 번갈아)을 올라 꼭대기에서 다음 대로로
//   맨 위는 성채(▲): 옥좌실 · 성벽 회랑. 기초 땅(구름 길)은 맨 아래 8000
{
  // 탑 셋: 두 층마다 옆벽 문 → 매달린 벽돌 집 (보물·전투). 탑 층마다 좌우로 매달린 집이 막다른 방·보물방
  const TW1 = towerInner(5900, 6950, 7650, 5800, "W", null, null, 1), TW2 = towerInner(700, 1750, 5800, 4000, "E", null, null, 1), TW3 = towerInner(5900, 6950, 4000, 2300, "W", null, null, 1);
  const houses = (T, x0, x1, tag) => T.doors.map((d, k) => ({ id: `${tag}${k}`, cx: d.side === "W" ? x0 - 60 - 280 : x1 + 60 + 280, top: d.F, w: 560, t: 200, shape: "slab", role: k % 2 ? "arena" : "treasure", mat: "brick" }));
  const H1 = houses(TW1, 5900, 6950, "H1_"), H2 = houses(TW2, 700, 1750, "H2_"), H3 = houses(TW3, 5900, 6950, "H3_");
  BLUEPRINTS.g1_m1 = {
    skyBase: 8000,
    flatWalk: 1,
    sky: {
      peakY: 2000,
      gate: {
        cx: 4050, w: 3100, sh: 400, tS: 900, belly: 0.5, flat: true,
        inner: {
          kind: "ruin",
          halls: [
            { x0: 2700, x1: 3300, F: 2550, h: 220, type: "colonnade", role: "arena" }, // 서쪽 성벽 회랑
            { x0: 3700, x1: 4500, F: 2500, h: 240, type: "sanctum" }, // 옥좌실 (큰 상자)
            { x0: 4800, x1: 5400, F: 2550, h: 220, type: "colonnade", role: "arena" }, // 동쪽 성벽 회랑
          ],
          pass: [[3300, 2550, 3700, 2500, 150], [4500, 2500, 4800, 2550, 150], [3700, 2500, 3250, 2000, 150], [4500, 2500, 4950, 2000, 150]],
          mouths: [],
        },
      },
      isles: [
        { id: "S1", cx: 3150, top: 7650, w: 4900, t: 130, shape: "slab", role: "arena", mat: "brick" }, // 아래 대로
        { id: "T1", cx: 6425, top: 5800, w: 1050, t: 2100, shape: "block", form: "cone", role: "rest", mat: "brick", inner: TW1 }, // 동쪽 탑
        { id: "S2", cx: 3810, top: 5800, w: 3580, t: 130, shape: "slab", role: "arena", mat: "brick" }, // 가운데 대로
        { id: "T2", cx: 1225, top: 4000, w: 1050, t: 2050, shape: "block", form: "cone", role: "rest", mat: "brick", inner: TW2 }, // 서쪽 탑
        { id: "S3", cx: 3810, top: 4000, w: 3580, t: 130, shape: "slab", role: "arena", mat: "brick" }, // 위 대로
        { id: "T3", cx: 6425, top: 2300, w: 1050, t: 1950, shape: "block", form: "cone", role: "rest", mat: "brick", inner: TW3 }, // 성채 앞 탑
        ...H1, ...H2, ...H3,
        { id: "X1", cx: 7650, top: 7650, w: 500, t: 160, shape: "spire", role: "treasure", mat: "brick" }, // 동쪽 끝 보물 망루
      ],
      links: [
        ["g:300", "S1"], ["S1", "T1<"], ["T1", "S2"], ["S2", "T2>"], ["T2", "S3"], ["S3", "T3<"], ["T3", "G"], ["g:7000", "X1"],
      ],
    },
  };
}


// ── g0_m1 「그린스텝 · 떠 있는 산」 손 설계: 하늘에 산 하나가 통째로 떠 있다 (기초 땅은 맨 아래 8000 구름 섬 길) ──
//   양쪽 산기슭의 작은 풀섬 다섯 단을 올라 산 끝자락에 닿고, 층층이 깎인 풀 비탈을 걸어 정상(▲)까지. 보물은 산기슭 바깥 섬
BLUEPRINTS.g0_m1 = {
  skyBase: 8000,
  flatWalk: 1,
  sky: {
    // 떠 있는 산: 폭 5000 · 높이 1600의 계단밭 비탈, 밑은 뾰족하게 매달린 바위
    peakY: 4600,
    gate: {
      cx: 4150, w: 5000, sh: 1600, tS: 1500, belly: 0.8,
    },
    isles: [
      // 서쪽 산기슭: 구름 길에서 산 끝자락까지 다섯 단
      { id: "F1", cx: 1100, top: 7650, w: 600, t: 150, shape: "lumpy", role: "rest" },
      { id: "F2", cx: 225, top: 7300, w: 350, t: 150, shape: "lumpy", role: "arena" },
      { id: "F3", cx: 1100, top: 6950, w: 600, t: 150, shape: "lumpy", role: "arena" },
      { id: "F4", cx: 225, top: 6600, w: 350, t: 150, shape: "lumpy", role: "treasure" },
      { id: "F5", cx: 1025, top: 6250, w: 450, t: 150, shape: "lumpy", role: "arena" },
      // 동쪽 산기슭
      { id: "E1", cx: 7150, top: 7650, w: 600, t: 150, shape: "lumpy", role: "rest" },
      { id: "E2", cx: 8000, top: 7300, w: 300, t: 150, shape: "lumpy", role: "arena" },
      { id: "E3", cx: 7150, top: 6950, w: 600, t: 150, shape: "lumpy", role: "arena" },
      { id: "E4", cx: 8000, top: 6600, w: 300, t: 150, shape: "lumpy", role: "treasure" },
      { id: "E5", cx: 7225, top: 6250, w: 450, t: 150, shape: "lumpy", role: "arena" },
      // 산 밑 그늘 길: 매달린 산 배 아래로 서쪽 기슭과 동쪽 기슭을 잇는 숨은 섬 넷 (보물·둥지)
      { id: "U1", cx: 2700, top: 7600, w: 600, t: 150, shape: "lumpy", role: "arena" },
      { id: "U2", cx: 3700, top: 7250, w: 600, t: 150, shape: "lumpy", role: "treasure" },
      { id: "U3", cx: 4700, top: 7600, w: 600, t: 150, shape: "lumpy", role: "arena" },
      { id: "U4", cx: 5700, top: 7620, w: 600, t: 150, shape: "lumpy", role: "treasure" },
    ],
    links: [
      ["g:1800", "F1"], ["F1", "F2"], ["F2", "F3"], ["F3", "F4"], ["F4", "F5"], ["F5", "G"],
      ["g:6450", "E1"], ["E1", "E2"], ["E2", "E3"], ["E3", "E4"], ["E4", "E5"], ["E5", "G"],
      ["g:2000", "U1"], ["U1", "U2"], ["U2", "U3"], ["U3", "U4"],
    ],
  },
};




// ── gm1_m1 「리프크라운 · 세계수」 손 설계: 기초 땅에서 하늘 끝까지 서 있는 거대한 나무 한 그루 ──
//   줄기(나무) 속 계단 굴 열두 칸을 올라 꼭대기 ▲. 세 층마다 줄기 옆벽 문 → 바로 붙은 잎 가지(전투·보물), 꼭대기 둘레엔 수관 잎
{
  const TRUNK = towerInner(3575, 4675, 7650, 3000, "W", null, null, 3, "cave");
  const br = TRUNK.doors.map((d, k) => ({ id: `BR${k}`, cx: d.side === "W" ? 3575 - 60 - 450 : 4675 + 60 + 450, top: d.F, w: 900, t: 220, shape: "lumpy", role: k % 2 ? "treasure" : "arena", mat: "leaf" }));
  BLUEPRINTS.gm1_m1 = {
    skyBase: 8000,
    flatWalk: 1,
    sky: {
      peakY: 3000,
      gate: { cx: 4125, w: 1100, sh: 200, tS: 4900, belly: 0.2, flat: true, mat: "wood", inner: TRUNK }, // 줄기 = ▲ 섬
      isles: [
        { id: "R0", cx: 2350, top: 7650, w: 900, t: 200, shape: "lumpy", role: "rest", mat: "leaf" }, // 뿌리 쪽 잎 (입구)
        ...br,
        { id: "V1", cx: 1200, top: 7650, w: 400, t: 160, shape: "lumpy", role: "arena", mat: "leaf" }, // 덩굴 잎
        { id: "V2", cx: 2000, top: 7300, w: 400, t: 160, shape: "lumpy", role: "rest", mat: "leaf" },
        { id: "SB1", cx: 6700, top: 5500, w: 800, t: 180, shape: "lumpy", role: "treasure", mat: "leaf" },
        { id: "SB2", cx: 1850, top: 4450, w: 700, t: 180, shape: "lumpy", role: "treasure", mat: "leaf" },
        { id: "SB3", cx: 6625, top: 3400, w: 750, t: 180, shape: "lumpy", role: "vista", mat: "leaf" },
        { id: "C1", cx: 2700, top: 2850, w: 1100, t: 260, shape: "lumpy", role: "vista", mat: "leaf" }, // 수관 서쪽 잎
        { id: "C2", cx: 5550, top: 2850, w: 1100, t: 260, shape: "lumpy", role: "treasure", mat: "leaf" }, // 수관 동쪽 잎
      ],
      links: [
        ["g:1500", "R0"], ["R0", "G<"], ["G", "C1"], ["G", "C2"],
        ["g:600", "V1"], ["V1", "V2"], ["V2", "BR0"], // 줄기 바깥 덩굴 길 (첫 가지로)
        ["BR1", "SB1"], ["BR2", "SB2"], ["BR3", "SB3"], // 가지 끝 작은 가지 (보물)
      ],
    },
  };
}

// ── gm1_0 「모스바크 · 이끼 거목 숲」 손 설계 (지상): 그래스메어와 다른 땅·하늘·땅속 ──
//   지표: 숲 입구 → 이끼 둔덕 둘 → 깊은 개울 협곡(물) → 쓰러진 거목 언덕 → 출구 숲. 협곡 위로 ▲ 거목 정상이 떠 있다
//   하늘: 거목 수관 섬(잎) 다섯이 협곡 양쪽에서 정상 굴로 / 정상 위 보물 잎 둘
//   땅속: 8열 3층 이끼 무덤(낮고 넓은 지하 묘지) — 서쪽 둔덕 사이 정문 탑으로 들어간다. 동쪽: 개울 굴 · 버섯 사슴 굴 · 썩은 통나무 굴, 서쪽 무덤 끝 굴, 맨 아래 지하 늪과 ▼
BLUEPRINTS.gm1_0 = {
  surface: [
    { kind: "flat", a: 0, b: 800 }, // 숲 입구
    { kind: "hills", a: 800, b: 2300, bumps: [{ c: 1850, h: 240, w: 300 }], role: "arena" }, // 거목 아래 + 이끼 둔덕
    { kind: "hills", a: 2300, b: 3900, bumps: [{ c: 3500, h: 200, w: 300 }] }, // 그루터기 터 + 고사리 언덕
    { kind: "valley", a: 3900, b: 5600, c: 4750, d: 420, w: 700, p: 0.25, pond: 260 }, // 개울 협곡
    { kind: "mountain", a: 5600, b: 7000, c: 6300, h: 380, wl: 600, wr: 700, top: 0.3 }, // 쓰러진 거목 언덕
    { kind: "flat", a: 7000, b: 8192 }, // 출구 숲
  ],
  pads: [],
  // 지표 구조물 (손으로 자리·크기): 입구 버섯 → 속 빈 거목 → 그루터기 방 → 협곡 위 쓰러진 거목 다리(위·속·아래 세 길) → 출구 거목
  feats: [
    { kind: "shroom", x: 380, H: 200, cw: 220, side: -1, bed: 260 }, // 숲 입구 큰 버섯 (튕김 버섯 계단)
    { kind: "tree", x: 840, H: 520, cw: 420, tw: 96, side: -1, hollow: 1, bed: 440 }, // 속 빈 거목: 줄기 속 발판 → 수관 위
    { kind: "stump", x: 2650, w: 320, H: 176, side: -1, bed: 400 }, // 그루터기 방 (서쪽 구멍, 안쪽 버섯 선반)
    { kind: "bridge", x: 4750, y: 4800, x0: 3980, x1: 5520, holes: [0.3, 0.72], drops: [0.5], dropX: [4210, 5290] }, // 쓰러진 거목 다리
    { kind: "tree", x: 7784, H: 480, cw: 360, tw: 96, side: -1, hollow: 1, bed: 480 }, // 출구 거목
  ],
  spots: [{ xa: 900, xb: 2200, role: "arena" }, { xa: 6000, xb: 6600, role: "arena" }, { xa: 4500, xb: 5000, role: "treasure" }],
  mouths: [{ x: 6900, to: "E1" }],
  noClimb: 1,
  caves: cvR([
    ["E1", 7500, 8050, 5300, 280, "hall", "flat", "rest"], // 이끼 굴 입구
    ["E2", 5900, 6900, 5650, 340, "lake", "basin", "rest"], // 개울 굴
    ["E3", 5800, 7000, 6400, 360, "pillared", "mound", "arena"], // 버섯 사슴 굴
    ["E4", 7500, 8100, 6100, 300, "small", "flat", "treasure"], // 사슴 뿔 보물굴
    ["E5", 5800, 6900, 7150, 340, "hall", "steps", "arena"], // 썩은 통나무 굴
    ["E6", 7400, 8100, 7500, 320, "hall", "mound", "arena"], // 뿌리 엉킨 굴
    ["E7", 7300, 8100, 8150, 340, "hall", "flat", "rest"], // 바닥 굴
    ["E8", 4800, 6300, 8000, 400, "lake", "basin", "vista"], // 지하 늪
    ["W1", 100, 600, 6300, 280, "small", "flat", "treasure"], // 무덤 끝 보물굴
    ["W2", 100, 650, 6900, 300, "hall", "flat", "arena"], // 무덤 뒷굴
    ["W3", 100, 900, 7600, 300, "hall", "mound", "arena"], // 이끼 바닥 굴
    ["S1", 250, 1050, 8250, 280, "lake", "basin", "rest"], // 가라앉은 샘 (늪 서쪽 밑)
    // 가라앉은 묘지 늪: 무덤 밑 두 줄 회랑 — 윗줄에서 구멍 셋으로 아랫줄에 떨어지고, 아랫줄은 다시 갈라져 ▼ 심연으로
    ["A1", 1400, 1900, 7250, 260, "pillared", "mound", "arena"], // 뿌리 기둥 회랑
    ["A2", 2350, 2850, 7250, 260, "hall", "steps", "arena"], // 무너진 관 무더기
    ["A3", 3300, 3800, 7250, 260, "pillared", "flat", "arena"], // 이끼 석관 회랑
    ["A4", 4250, 4650, 7250, 240, "small", "flat", "treasure"], // 늪 끝 껴묻거리 굴
    ["B1", 1600, 2200, 7800, 260, "lake", "basin", "rest"], // 검은 물웅덩이
    ["B2", 2650, 3250, 7800, 260, "hall", "mound", "arena"], // 늪 한가운데
    ["B3", 3600, 4150, 7800, 260, "small", "flat", "treasure"], // 빠진 관 보물굴
    ["DP", 2900, 3800, 8250, 280, "hall", "flat", "rest", { deep: 1 }], // ▼ 심연
  ]),
  dungeon: {
    x0: 1024, y0: 5600, cols: 8, stories: 3, wall: "rock", step: 6, stairs: 1,
    gate: { col: 0, door: 1500, down: "E" },
    towers: [
      { id: "T1", col: 3, s: 0, up: "WE", down: "WE" },
      { id: "T2", col: 6, s: 1, up: "WE", down: "WE" },
    ],
    rooms: [
      { id: "R01", c0: 1, c1: 2, s: 0, type: "colonnade", role: "arena" }, // 무덤 입구 회랑
      { id: "R04", c0: 4, c1: 5, s: 0, type: "arena", role: "arena" }, // 무덤 지기 홀
      { id: "R06", c0: 6, c1: 7, s: 0, type: "vault", role: "treasure", cave: "E" }, // 껴묻거리 방 (개울 굴로)
      { id: "R10", c0: 0, c1: 2, s: 1, type: "trap", role: "trap", cave: 1 }, // 가시 덩굴 묘도
      { id: "R14", c0: 4, c1: 5, s: 1, type: "shrine", role: "rest" }, // 이끼 샘
      { id: "R17", c0: 7, c1: 7, s: 1, type: "guard", role: "arena", cave: "E" }, // 동쪽 문지기
      { id: "R20", c0: 0, c1: 1, s: 2, type: "vault", role: "treasure", cave: 1 }, // 서쪽 껴묻거리 방
      { id: "R22", c0: 2, c1: 5, s: 2, type: "sanctum", role: "arena" }, // 이끼 왕의 무덤 (성소)
      { id: "R27", c0: 7, c1: 7, s: 2, type: "guard", role: "arena", cave: "E" }, // 깊은 문지기
    ],
  },
  links: [
    ["E2", "E1"], ["R06", "E2"], ["R17", "E3"], ["E3", "E4"], ["R27", "E5"], ["E5", "E6"],
    ["W1", "R10"], ["W2", "R20"], ["DP", "E8"], ["E8", "E7"],
    ["W3", "A1"], ["A1", "A2"], ["A2", "A3"], ["A3", "A4"], ["S1", "B1"], ["B1", "B2"], ["B2", "B3"],
  ],
  drops: [["E6", "E7"], ["W2", "W3"], ["W3", "S1"], ["A1", "B1"], ["A2", "B2"], ["A3", "B3"], ["B2", "DP"]],
  sky: {
    peakY: 2400,
    gate: {
      cx: 4350, w: 2400, sh: 600, tS: 1200, belly: 0.6, flat: true,
      inner: {
        halls: [
          { x0: 3200, x1: 3650, F: 3400, h: 210, role: "arena" }, // 서쪽 수관 굴
          { x0: 5050, x1: 5500, F: 3400, h: 210, role: "arena" }, // 동쪽 수관 굴
          { x0: 3950, x1: 4750, F: 3050, h: 230, type: "sanctum" }, // 거목 정상 속 둥지 (큰 상자)
        ],
        pass: [[3650, 3400, 3950, 3050, 150], [4750, 3050, 5050, 3400, 150], [3950, 3050, 3300, 2400, 150], [4750, 3050, 5400, 2400, 150]],
        mouths: [{ side: "W", x: 3200, F: 3400 }, { side: "E", x: 5500, F: 3400 }],
      },
    },
    isles: [
      { id: "W1", cx: 2650, top: 4210, w: 700, t: 260, shape: "lumpy", role: "rest", mat: "leaf" }, // 서쪽 낮은 수관
      { id: "W2", cx: 1600, top: 3860, w: 600, t: 240, shape: "lumpy", role: "arena", mat: "leaf" },
      { id: "W3", cx: 2600, top: 3510, w: 600, t: 240, shape: "lumpy", role: "arena", mat: "leaf" },
      { id: "K1", cx: 7150, top: 4040, w: 700, t: 260, shape: "lumpy", role: "arena", mat: "leaf" }, // 동쪽 낮은 수관
      { id: "K2", cx: 6200, top: 3720, w: 500, t: 240, shape: "lumpy", role: "rest", mat: "leaf" },
      { id: "T2", cx: 2150, top: 2250, w: 700, t: 260, shape: "lumpy", role: "treasure", mat: "leaf" }, // 정상 서쪽 보물 잎
      { id: "T3", cx: 6550, top: 2250, w: 700, t: 260, shape: "lumpy", role: "treasure", mat: "leaf" }, // 정상 동쪽 보물 잎
    ],
    links: [
      ["g:1850", "W1"], ["W1", "W2"], ["W2", "W3"], ["W3", "G<"],
      ["g:6300", "K1"], ["K1", "K2"], ["K2", "G>"],
      ["G", "T2"], ["G", "T3"],
    ],
  },
};

// ── 동굴 구역 셋 (y=1 줄): 같은 동굴 생성기에 지역마다 다른 짜임과 소품 (natgen.js CAVE_STYLE) ──
//   g1_1 드립스톤: 종유석 대공동 · 지하 호수 · 높은 천장 / g0_1 아이언베인: 옛 갱도 · 나무 판자 벽과 횃불 · 광맥 수정
//   gm1_1 루트홀로우: 둥근 굴방 · 뿌리 기둥 · 늘어진 뿌리와 빛 버섯
// 동굴 방 한 줄: [id, x0, x1, 바닥 y, 높이, 종류, 바닥, 역할, 덧붙임(peak·deep·entry)]

// ── g1_1 「드립스톤 · 수몰 사원」 손 설계: 자연 동굴이 주인공 ──
//   가운데에 물에 잠긴 석회 사원(5열 7층). 사원 정문 탑 꼭대기 = ▲ 하늘 구멍, 사원 서쪽 벽에서 동굴 갈래 다섯이 뻗는다
//   서쪽 위: 천장을 덮은 종유석 대공동 / 서쪽 가운데: 박쥐 둥지·석회 다락·물웅덩이(입구 길) / 서쪽 아래: 지하 호수 → 검은 물가
//   동쪽: 메아리 굴 · 동쪽 입구 · 협곡 어귀 → 중턱 → 바닥(폭포처럼 구멍 셋) / 바닥: 심연 입구(▼) 와 바닥 보물굴
//   위아래는 사원 탑과 떨어지는 구멍으로, 동굴은 비탈 굴로만 (사다리·세로 갱도 없음)
BLUEPRINTS.g1_1 = {
  cave: { style: "drip" },
  caves: cvR([
    // 꼭대기
    ["T0", 80, 440, 2500, 240, "small", "flat", "treasure"], // 천장 보물굴
    ["GR", 600, 2900, 2600, 620, "grand", "basin", "vista"], // 종유석 대공동
    ["PK", 4272, 5100, 2880, 300, "hall", "flat", "rest", { peak: 1 }], // ▲ 하늘 구멍 (사원 정문 탑 꼭대기)
    ["T1", 5600, 6900, 2500, 340, "tiered", "steps", "arena"], // 고드름 회랑
    ["T2", 7400, 8050, 2100, 260, "small", "flat", "treasure"], // 얼음 틈
    // 서쪽 갈래
    ["W1a", 2500, 3300, 3700, 340, "tiered", "steps", "arena"], // 물방울 회랑
    ["W1b", 900, 2000, 3400, 340, "hall", "mound", "arena"], // 박쥐 둥지
    ["W2a", 2700, 3350, 4250, 300, "hall", "flat", "rest"], // 흐름돌 계단참
    ["W2b", 1000, 2200, 4150, 340, "pillared", "flat", "arena"], // 석회 다락
    ["W3a", 2700, 3350, 4800, 300, "hall", "steps", "arena"], // 첫 갈림굴
    ["W3m", 1300, 2200, 4850, 300, "lake", "basin", "rest"], // 석회 물웅덩이
    ["EL", 64, 800, 4800, 300, "hall", "flat", "rest", { entry: "L" }],
    ["W4a", 2400, 3350, 5350, 380, "pillared", "mound", "arena"], // 흰 기둥 홀
    ["W4b", 500, 1800, 5500, 340, "hall", "flat", "arena"], // 젖은 굴
    ["W5a", 1700, 3300, 6050, 440, "lake", "basin", "treasure"], // 지하 호수 (물 건너 보물)
    ["W5b", 200, 1200, 6350, 320, "hall", "steps", "rest"], // 검은 물가
    // 바닥
    ["B1", 150, 1300, 7000, 340, "tiered", "steps", "arena"], // 가라앉은 계단
    ["B2", 1760, 2500, 7400, 320, "hall", "mound", "arena"], // 갑충 굴
    ["DP", 3150, 4400, 7950, 380, "hall", "flat", "rest", { deep: 1 }], // ▼ 심연 입구
    ["B3", 4900, 5800, 7900, 280, "small", "flat", "treasure"], // 바닥 보물굴
    ["B4", 6300, 7400, 7500, 360, "hall", "flat", "arena"], // 협곡 바닥
    // 동쪽
    ["E2", 6950, 7900, 3300, 340, "hall", "steps", "rest"], // 메아리 굴
    ["ER", 6950, 8100, 4800, 340, "hall", "mound", "rest", { entry: "R" }],
    ["E3", 6950, 8050, 6000, 380, "tiered", "steps", "arena"], // 협곡 어귀
    ["E4", 6950, 8050, 6700, 340, "hall", "flat", "arena"], // 협곡 중턱
  ]),
  // 수몰 사원: 5열 7층 (x 3840~6400, y 3200~5888). 정문 탑(VG)은 ▲ 방 높이에서 1층으로, 서쪽 벽엔 대공동으로 난 문
  dungeon: {
    x0: 3840, y0: 3200, cols: 5, stories: 7, wall: "brick", step: 6, stairs: 1,
    gate: { col: 0, row: 2880, door: 4272, up: "WE", down: "E", cave: "up" },
    towers: [
      { id: "TA", col: 2, s: 0, up: "WE", down: "WE", pat: "zig" },
      { id: "TB", col: 4, s: 1, up: "W", down: "W", pat: "float" },
      { id: "TC", col: 0, s: 2, up: "WE", down: "WE", pat: "ring", cave: "both" },
      { id: "TD", col: 3, s: 3, up: "WE", down: "WE", pat: "pillar" },
      { id: "TE", col: 1, s: 4, up: "WE", down: "WE", pat: "zig" },
      { id: "TF", col: 4, s: 5, up: "W", down: "W", pat: "float", caveE: "down" },
    ],
    rooms: [
      { id: "R01", c0: 1, c1: 1, s: 0, type: "guard", role: "arena" }, // 물에 잠긴 문간
      { id: "R03", c0: 3, c1: 4, s: 0, type: "colonnade", role: "arena", cave: "E" }, // 위 회랑 (메아리 굴로)
      { id: "R10", c0: 0, c1: 1, s: 1, type: "vault", role: "treasure", cave: 1 }, // 보물실 (물방울 회랑으로)
      { id: "R13", c0: 3, c1: 3, s: 1, type: "shrine", role: "rest" }, // 샘 쉼터
      { id: "R21", c0: 1, c1: 2, s: 2, type: "arena", role: "arena" }, // 투기장
      { id: "R23", c0: 3, c1: 3, s: 2, type: "guard", role: "arena" }, // 초소
      { id: "R31", c0: 1, c1: 2, s: 3, type: "trap", role: "trap" }, // 물 고인 함정 복도
      { id: "R34", c0: 4, c1: 4, s: 3, type: "vault", role: "treasure", cave: "E" }, // 동쪽 보물실 (동쪽 입구로)
      { id: "R40", c0: 0, c1: 0, s: 4, type: "guard", role: "arena", cave: 1 }, // 서쪽 초소 (흰 기둥 홀로)
      { id: "R42", c0: 2, c1: 2, s: 4, type: "shrine", role: "rest" }, // 샘 쉼터 2
      { id: "R44", c0: 4, c1: 4, s: 4, type: "colonnade", role: "arena" }, // 아래 회랑
      { id: "R50", c0: 0, c1: 0, s: 5, type: "vault", role: "treasure" }, // 깊은 보물실
      { id: "R52", c0: 2, c1: 3, s: 5, type: "arena", role: "arena" }, // 투기장 2
      { id: "R60", c0: 0, c1: 3, s: 6, type: "sanctum", role: "arena", cave: 1 }, // 성소 (지하 호수로)
    ],
  },
  links: [
    ["T0", "GR"], ["GR", "VG"], ["PK", "T1"], ["T1", "T2"],
    ["W1b", "W1a"], ["W1a", "R10"], ["W2b", "W2a"], ["W2a", "TC"],
    ["EL", "W3m"], ["W3m", "W3a"], ["W3a", "TC_d"], ["W4b", "W4a"], ["W4a", "R40"],
    ["W5b", "W5a"], ["W5a", "R60"], ["B1", "B2"], ["B2", "DP"], ["DP", "B3"], ["B3", "B4"],
    ["R03", "E2"], ["R34", "ER"], ["TF", "E3"],
  ],
  // 떨어지는 구멍: 대공동 → 박쥐 둥지 → 석회 다락 → 물웅덩이 / 젖은 굴 → 검은 물가 → 가라앉은 계단 / 협곡 폭포 둘
  drops: [["GR", "W1b"], ["W1b", "W2b"], ["W2b", "W3m"], ["W4b", "W5b"], ["W5b", "B1"], ["E3", "E4"], ["E4", "B4"]],
};
// ── g0_1 「아이언베인 · 광산 요새」 손 설계: 던전이 주인공 ──
//   가운데를 7열 9층 옛 광산 요새가 차지한다 (승강 탑 아홉, 나무 판자 벽). 층마다 긴 갱도 회랑 · 광석 창고 · 선로 함정 · 광부 쉼터
//   ▲는 요새 꼭대기 정문 탑 위 환기구, 동굴은 요새 바깥 껍데기에 붙은 광맥굴뿐 (서쪽 채굴장 · 수정 광맥 · 지하수 갱 / 동쪽 선광장 · 광차 창고)
//   ▼는 맨 아래 무너진 갱 → 깊은 광맥 대공동 → 심연 입구
BLUEPRINTS.g0_1 = {
  cave: { style: "mine" },
  caves: cvR([
    ["T", 900, 2050, 2650, 300, "hall", "flat", "treasure"], // 높은 광맥 (정문 탑 서쪽 문)
    ["PK", 4272, 5300, 2752, 300, "hall", "flat", "rest", { peak: 1 }], // ▲ 환기구
    ["E0", 5800, 6800, 2500, 300, "tiered", "steps", "arena"], // 환기 갱
    ["E0b", 7300, 8000, 2200, 260, "small", "flat", "treasure"], // 막힌 환기 갱 끝
    ["W0", 400, 1900, 3300, 420, "grand", "steps", "vista"], // 버려진 채굴장
    ["E1", 6450, 7700, 3300, 380, "pillared", "flat", "arena"], // 선광장
    ["W1b", 200, 900, 4000, 320, "hall", "mound", "treasure"], // 수정 광맥굴
    ["W1", 1300, 1950, 4300, 260, "small", "flat", "rest"], // 광부 쉼터
    ["E3", 6400, 7600, 4300, 300, "hall", "mound", "arena"], // 버력 더미 굴
    ["EL", 64, 900, 4800, 300, "hall", "flat", "rest", { entry: "L" }],
    ["WM", 1250, 1900, 4900, 280, "hall", "flat", "arena"], // 옛 갱도 입구
    ["ER", 7000, 8100, 4800, 300, "hall", "flat", "rest", { entry: "R" }],
    ["E5", 6450, 7500, 5500, 320, "hall", "flat", "treasure"], // 광차 창고
    ["W6b", 100, 650, 5650, 280, "small", "flat", "treasure"], // 물에 잠긴 굴 끝
    ["W6", 1000, 1900, 5900, 320, "lake", "basin", "rest"], // 지하수 갱
    ["W8", 1200, 1950, 6700, 320, "hall", "steps", "arena"], // 무너진 갱
    ["E8", 6400, 7300, 6700, 340, "hall", "flat", "arena"], // 용광로 뒤 갱
    ["W9", 800, 2400, 7450, 400, "grand", "basin", "vista"], // 깊은 광맥 대공동
    ["E10", 6300, 7800, 7650, 380, "pillared", "flat", "arena"], // 무너진 지주 홀
    ["DP", 3150, 4300, 7900, 360, "hall", "flat", "rest", { deep: 1 }], // ▼ 심연 입구
    ["E9", 4900, 5900, 8000, 300, "hall", "flat", "treasure"], // 바닥 광석 더미
  ]),
  // 광산 요새: 7열 9층 (x 2304~5888, y 3072~6528). 정문 탑(가운데 열)이 ▲ 환기구로, 양쪽 벽 동굴 문 열
  dungeon: {
    x0: 2304, y0: 3072, cols: 7, stories: 9, wall: "wood", step: 6, stairs: 1,
    gate: { col: 3, row: 2752, door: 4272, up: "WE", down: "WE", cave: "up" },
    towers: [
      { id: "TA", col: 1, s: 0, up: "WE", down: "WE" },
      { id: "TB", col: 5, s: 1, up: "WE", down: "WE" },
      { id: "TC", col: 3, s: 2, up: "WE", down: "WE" },
      { id: "TD", col: 0, s: 3, up: "WE", down: "WE", cave: "both" },
      { id: "TE", col: 6, s: 3, up: "WE", down: "WE", caveE: "both" },
      { id: "TF", col: 2, s: 4, up: "WE", down: "WE" },
      { id: "TG", col: 4, s: 5, up: "WE", down: "WE" },
      { id: "TH", col: 1, s: 6, up: "WE", down: "WE" },
      { id: "TI", col: 5, s: 7, up: "WE", down: "WE" },
    ],
    rooms: [
      { id: "R00", c0: 0, c1: 0, s: 0, type: "vault", role: "treasure", cave: 1 }, // 꼭대기 광석 창고
      { id: "R02", c0: 2, c1: 2, s: 0, type: "guard", role: "arena" }, // 정문 경비실
      { id: "R04", c0: 4, c1: 6, s: 0, type: "colonnade", role: "arena", cave: "E" }, // 1층 갱도 회랑
      { id: "R10", c0: 0, c1: 0, s: 1, type: "guard", role: "arena" }, // 십장 초소
      { id: "R12", c0: 2, c1: 4, s: 1, type: "arena", role: "arena" }, // 광부 숙소 (싸움터)
      { id: "R16", c0: 6, c1: 6, s: 1, type: "vault", role: "treasure" }, // 공구 창고
      { id: "R20", c0: 0, c1: 2, s: 2, type: "colonnade", role: "arena" }, // 2층 갱도 회랑
      { id: "R24", c0: 4, c1: 4, s: 2, type: "shrine", role: "rest" }, // 광부 쉼터
      { id: "R26", c0: 6, c1: 6, s: 2, type: "guard", role: "arena" }, // 동쪽 초소
      { id: "R31", c0: 1, c1: 2, s: 3, type: "trap", role: "trap" }, // 선로 함정 복도
      { id: "R34", c0: 4, c1: 5, s: 3, type: "guard", role: "arena" }, // 화약고 경비
      { id: "R41", c0: 1, c1: 1, s: 4, type: "vault", role: "treasure" }, // 화약고
      { id: "R43", c0: 3, c1: 5, s: 4, type: "arena", role: "arena" }, // 제련 홀
      { id: "R50", c0: 0, c1: 1, s: 5, type: "colonnade", role: "arena" }, // 5층 갱도 회랑
      { id: "R53", c0: 3, c1: 3, s: 5, type: "shrine", role: "rest" }, // 물 쉼터
      { id: "R55", c0: 5, c1: 6, s: 5, type: "guard", role: "arena", cave: "E" }, // 광차 출입구
      { id: "R60", c0: 0, c1: 0, s: 6, type: "vault", role: "treasure", cave: 1 }, // 지하수 쪽 창고
      { id: "R62", c0: 2, c1: 3, s: 6, type: "trap", role: "trap" }, // 무너지는 복도
      { id: "R65", c0: 5, c1: 6, s: 6, type: "vault", role: "treasure" }, // 금고
      { id: "R70", c0: 0, c1: 0, s: 7, type: "guard", role: "arena" }, // 깊은 초소
      { id: "R72", c0: 2, c1: 4, s: 7, type: "arena", role: "arena" }, // 용광로 홀
      { id: "R76", c0: 6, c1: 6, s: 7, type: "shrine", role: "rest" }, // 깊은 쉼터
      { id: "R80", c0: 0, c1: 4, s: 8, type: "sanctum", role: "arena", cave: 1 }, // 십장의 금고 (성소)
      { id: "R86", c0: 6, c1: 6, s: 8, type: "vault", role: "treasure", cave: "E" }, // 바닥 창고
    ],
  },
  links: [
    ["T", "VG"], ["PK", "E0"], ["E0", "E0b"], ["W0", "R00"], ["R04", "E1"],
    ["W1b", "W1"], ["W1", "TD"], ["EL", "WM"], ["WM", "TD_d"], ["TE", "E3"], ["TE_d", "ER"], ["R55", "E5"],
    ["W6b", "W6"], ["W6", "R60"], ["W8", "R80"], ["W9", "DP"], ["DP", "E9"], ["R86", "E8"], ["E9", "E10"],
  ],
  drops: [["W8", "W9"], ["E8", "E10"]],
};

// ── gm1_1 「루트홀로우 · 뿌리 속」 손 설계: 세로로 박힌 고목 줄기가 주인공 ──
//   가운데에 3열 10층 고목 줄기(나무껍질 성채): 탑이 좌우로 엇갈리며 꼭대기 ▲ 에서 바닥까지 내려가고, 가운데 열엔 방이 한 칸씩
//   줄기의 탑마다 뿌리 굴이 양옆 아래로 뻗는다 (빛 버섯 숲 · 뿌리 웅덩이 · 독 포자 굴). 맨 아래엔 거대한 뿌리 심장 공동, 그 서쪽에 ▼
BLUEPRINTS.gm1_1 = {
  cave: { style: "root" },
  caves: cvR([
    ["A0b", 300, 1300, 2100, 280, "hall", "mound", "treasure"], // 말라붙은 뿌리굴
    ["A0", 1800, 3000, 2300, 320, "hall", "mound", "arena"], // 뿌리 꼭대기 굴
    ["PK", 4016, 4900, 2400, 300, "hall", "flat", "rest", { peak: 1 }], // ▲ 줄기 꼭대기 옹이 구멍
    ["E0", 5500, 6800, 2200, 300, "hall", "mound", "arena"], // 윗뿌리 회랑
    ["E0b", 7300, 8050, 1900, 260, "small", "flat", "treasure"], // 새 둥지 굴
    ["W2b", 600, 1700, 3000, 340, "hall", "mound", "arena"], // 굼벵이 굴
    ["W2", 2300, 3100, 3400, 340, "hall", "mound", "arena"], // 껍질 틈 굴
    ["E1", 5600, 6900, 3300, 360, "hall", "mound", "arena"], // 노움 굴
    ["E1b", 7400, 8050, 3000, 280, "small", "flat", "treasure"], // 노움 보물굴
    ["W3", 2400, 3150, 3900, 300, "hall", "flat", "rest"], // 뿌리 쉼터
    ["W3b", 400, 1900, 4000, 420, "pillared", "mound", "rest"], // 빛 버섯 숲
    ["E3", 5600, 7000, 4250, 380, "lake", "basin", "rest"], // 뿌리 웅덩이
    ["EL", 64, 900, 4800, 300, "hall", "flat", "rest", { entry: "L" }],
    ["WE", 1500, 2700, 4950, 340, "hall", "mound", "arena"], // 뿌리 입구 굴
    ["EM", 5600, 6300, 4900, 300, "hall", "flat", "arena"], // 동쪽 뿌리목
    ["ER", 6800, 8100, 4800, 320, "hall", "flat", "rest", { entry: "R" }],
    ["W6", 2500, 3150, 5450, 320, "lake", "basin", "rest"], // 뿌리 물웅덩이
    ["W6b", 700, 2000, 5700, 380, "hall", "mound", "arena"], // 버섯 사슴 굴
    ["E7", 5600, 7200, 5700, 380, "pillared", "mound", "arena"], // 독 포자 굴
    ["E7b", 7600, 8050, 5400, 260, "small", "flat", "treasure"], // 포자 주머니 굴
    ["W8", 2400, 3150, 6250, 320, "hall", "steps", "arena"], // 썩은 뿌리 굴
    ["W8b", 600, 1900, 6600, 360, "pillared", "mound", "arena"], // 망령 굴
    ["E9", 5500, 6400, 6650, 300, "hall", "flat", "arena"], // 뿌리 끝 굴
    ["W9", 500, 2000, 7550, 380, "hall", "mound", "treasure"], // 잔뿌리 굴
    ["DP", 2500, 3500, 7950, 360, "hall", "flat", "rest", { deep: 1 }], // ▼ 뿌리 밑 구멍
    ["HEART", 3900, 6200, 7800, 600, "grand", "mound", "vista"], // 뿌리 심장 공동
  ]),
  // 고목 줄기: 3열 10층 (x 3584~5120, y 2560~6400). 탑이 왼쪽·오른쪽 끝 열을 번갈아 두 층씩, 가운데 열은 방
  dungeon: {
    x0: 3584, y0: 2560, cols: 3, stories: 10, wall: "wood", mat: "wood", step: 6, stairs: 1,
    gate: { col: 0, row: 2400, door: 4016, up: "WE", down: "E", cave: "up" },
    towers: [
      { id: "T1", col: 2, s: 0, up: "W", down: "W", caveE: "both" },
      { id: "T2", col: 0, s: 1, up: "E", down: "E", cave: "both" },
      { id: "T3", col: 2, s: 2, up: "W", down: "W", caveE: "both" },
      { id: "T4", col: 0, s: 3, up: "E", down: "E", cave: "both" },
      { id: "T5", col: 2, s: 4, up: "W", down: "W", caveE: "both" },
      { id: "T6", col: 0, s: 5, up: "E", down: "E", cave: "both" },
      { id: "T7", col: 2, s: 6, up: "W", down: "W", caveE: "both" },
      { id: "T8", col: 0, s: 7, up: "E", down: "E", cave: "both" },
      { id: "T9", col: 2, s: 8, up: "W", down: "W", caveE: "both" },
    ],
    rooms: [
      { id: "M0", c0: 1, c1: 1, s: 0, type: "guard", role: "arena" }, // 옹이 문간
      { id: "M1", c0: 1, c1: 1, s: 1, type: "shrine", role: "rest" }, // 수액 샘
      { id: "M2", c0: 1, c1: 1, s: 2, type: "vault", role: "treasure" }, // 도토리 창고
      { id: "M3", c0: 1, c1: 1, s: 3, type: "guard", role: "arena" }, // 뿌리 초소
      { id: "M4", c0: 1, c1: 1, s: 4, type: "trap", role: "trap" }, // 가시 덩굴 복도
      { id: "M5", c0: 1, c1: 1, s: 5, type: "arena", role: "arena" }, // 나이테 홀
      { id: "M6", c0: 1, c1: 1, s: 6, type: "shrine", role: "rest" }, // 수액 샘 2
      { id: "M7", c0: 1, c1: 1, s: 7, type: "vault", role: "treasure" }, // 씨앗 창고
      { id: "M8", c0: 1, c1: 1, s: 8, type: "guard", role: "arena" }, // 뿌리 문지기
      { id: "M9", c0: 0, c1: 1, s: 9, type: "sanctum", role: "arena" }, // 줄기 밑동 성소
    ],
  },
  links: [
    ["A0b", "A0"], ["A0", "VG"], ["PK", "E0"], ["E0", "E0b"],
    ["W2b", "W2"], ["W2", "T2"], ["T1_d", "E1"], ["E1", "E1b"],
    ["W3b", "W3"], ["W3", "T2_d"], ["T3_d", "E3"],
    ["EL", "WE"], ["WE", "T6"], ["T5_d", "EM"], ["EM", "ER"],
    ["W6b", "W6"], ["W6", "T6_d"], ["T7_d", "E7"], ["E7", "E7b"],
    ["W8b", "W8"], ["W8", "T8_d"], ["T9_d", "E9"],
    ["W9", "DP"], ["DP", "HEART"],
  ],
  drops: [["A0b", "W2b"], ["W2b", "W3b"], ["W6b", "W8b"], ["W8b", "W9"], ["E9", "HEART"], ["E1", "E3"]],
};

// ── 노랑 하늘 구역 (지역 설계 코드가 지도 전체를 짓는다): 섬 길 = 맨 아래 줄 1000 ──
for (const id of ["g0_m2", "g1_m2", "g2_m1", "gm2_m1", "gm1_m2", "gm2_m2", "g2_m2"]) BLUEPRINTS[id] = { skyBase: 8000 };
// 노랑 동굴 구역 (지역 설계 코드가 지도 전체를 짓는다): 소품 배치만 켠다
for (const id of ["g0_2", "g1_2", "gm1_2", "g2_1", "gm2_1", "g2_2", "gm2_2"]) BLUEPRINTS[id] = {};

// ── gm2_0 「검은 늪지」 (노랑 · 보스) 지표: 검은 웅덩이 → 둔덕 → 큰 늪(쓰러진 고목 다리) → 썩은 언덕 → 보스 늪(평평) ──
BLUEPRINTS.gm2_0 = {
  surface: [
    { kind: "flat", a: 0, b: 600 },
    { kind: "valley", a: 600, b: 1900, c: 1250, d: 240, w: 480, p: 0.3, pond: 200 },
    { kind: "hills", a: 1900, b: 3300, bumps: [{ c: 2300, h: 150, w: 260 }, { c: 2900, h: 210, w: 280 }], role: "arena" },
    { kind: "valley", a: 3300, b: 4900, c: 4100, d: 340, w: 640, p: 0.25, pond: 280 },
    { kind: "hills", a: 4900, b: 6600, bumps: [{ c: 5500, h: 240, w: 320 }, { c: 6150, h: 130, w: 220 }] },
    { kind: "flat", a: 6600, b: 8192 },
  ],
  pads: [],
  feats: [
    { kind: "stump", x: 2900, w: 300, H: 160, side: 1, bed: 380 },
    { kind: "bridge", x: 4100, y: 4800, x0: 3380, x1: 4820, holes: [0.42], drops: [0.6], dropX: [3700, 4500] },
    { kind: "shroom", x: 5500, H: 180, cw: 200, side: 1, bed: 240 },
  ],
  spots: [{ xa: 1950, xb: 3200, role: "arena" }, { xa: 5000, xb: 6500, role: "arena" }, { xa: 3900, xb: 4300, role: "treasure" }],
};

// ── g2_0 「유리 모래톱」 (노랑 · 보스) 지표: 사구 → 유리 웅덩이 → 바람 고원 → 개미귀신 사구 → 보스 모래밭(평평) ──
BLUEPRINTS.g2_0 = {
  surface: [
    { kind: "flat", a: 0, b: 500 },
    { kind: "hills", a: 500, b: 1800, bumps: [{ c: 820, h: 120, w: 240 }, { c: 1300, h: 190, w: 300 }], role: "arena" },
    { kind: "valley", a: 1800, b: 3000, c: 2400, d: 220, w: 460, p: 0.35, pond: 220 },
    { kind: "mesa", a: 3000, b: 4800, c: 3900, h: 260, w: 700, p: 0.6, role: "arena" },
    { kind: "hills", a: 4800, b: 6700, bumps: [{ c: 5400, h: 150, w: 280 }, { c: 6100, h: 210, w: 300 }] },
    { kind: "flat", a: 6700, b: 8192 },
  ],
  pads: [],
  feats: [],
  spots: [{ xa: 600, xb: 1700, role: "arena" }, { xa: 3300, xb: 4500, role: "arena" }, { xa: 2300, xb: 2500, role: "treasure" }],
};
