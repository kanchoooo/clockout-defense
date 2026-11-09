// 요일별 보스 그림 10종. pixelfx critters 와 같은 방식으로 코드로 그린다.
import { TAU, hex, wrap, clamp } from "../../vendor/pixelfx/core/index.js";
import { Grid, ball, ballShade, ink, shadow, shift, ramp } from "./kit.js";

const mod = (meta, draw, sh) => ({
  meta: { name: meta.name, size: meta.size, origin: meta.origin, duration: meta.duration ?? 2, loop: true, fps: 15, options: { seed: 1 } },
  draw,
  drawBack(p, t, o) {
    shadow(p, 0, 2, sh[0], sh[1], hex("#050509"), 0.55);
  },
});
const phase = (t, D, o) => (shift(t, D, o.seed) / D) * TAU;
const DARK = hex("#100c16"), WHITE_ = hex("#fbf6e6"), RED = hex("#e2413a"), YEL = hex("#ffd23c"), O0 = hex("#0b0910"), O1 = hex("#1d1a2a");

// ── 콜센터 박쥐왕: 헤드셋을 쓴 거대 박쥐
const FUR = ramp(["#140d24", "#27183f", "#41265f", "#643a84", "#9260ae"]);
const WEB = ramp(["#2a0f2e", "#48193f", "#6d2752", "#983a66"]);
const METAL = ramp(["#23283a", "#4a5468", "#9aa6ba", "#e6ecf5"]);
const GB = new Grid(-114, -152, 228, 172);
export const batlord = mod({ name: "Call-center bat lord", size: [240, 184], origin: [120, 158] }, (p, t, o) => {
  const a = phase(t, 2, o), g = GB, Y = -14 + Math.sin(a) * 4, flap = Math.sin(a * 2) * 20;
  g.clear();
  for (const s of [-1, 1]) {
    const pts = [[s * 16, -68 + Y], [s * 54, -106 - flap + Y], [s * 110, -74 - flap * 1.4 + Y], [s * 88, -44 - flap + Y], [s * 70, -56 - flap * 0.7 + Y], [s * 48, -32 - flap * 0.4 + Y], [s * 32, -46 + Y], [s * 16, -34 + Y]];
    g.poly(pts, (x, y) => WEB[Math.max(0, Math.min(3, Math.floor(2.7 - (Math.abs(x) / 110) * 1.8 + (s < 0 ? 0.5 : -0.4) + (Math.sin(x * 0.2 + y * 0.03) > 0.88 ? -1.4 : 0))))]);
    g.tube([[s * 16, -68 + Y], [s * 54, -106 - flap + Y], [s * 110, -74 - flap * 1.4 + Y]], (u) => 4 - u * 2.6, FUR[3]);
    g.tube([[s * 54, -106 - flap + Y], [s * 88, -44 - flap + Y]], 1.2, FUR[2]);
    g.tube([[s * 54, -106 - flap + Y], [s * 48, -32 - flap * 0.4 + Y]], 1.2, FUR[2]);
    g.tube([[s * 10, -24 + Y], [s * 14, -6 + Y]], 4, FUR[1]);
    for (const c of [-3, 3]) g.poly([[s * 14 + c - 2, -4 + Y], [s * 14 + c + 2, -4 + Y], [s * 14 + c, 3 + Y]], METAL[2]);
  }
  ball(g, 0, -48 + Y, 25, 31, FUR);
  ball(g, 0, -42 + Y, 13, 19, ramp(["#4a3060", "#6f4a84", "#9a70a8", "#c6a0c8"]));
  for (const s of [-1, 1]) {
    g.poly([[s * 7, -98 + Y], [s * 24, -96 + Y], [s * 25, -128 + Y]], FUR[s < 0 ? 3 : 2]);
    g.poly([[s * 12, -98 + Y], [s * 21, -97 + Y], [s * 22, -118 + Y]], WEB[3]);
  }
  ball(g, 0, -84 + Y, 23, 20, FUR, 0.06);
  for (const s of [-1, 1]) {
    g.ellipse(s * 9, -88 + Y, 6, 5, RED);
    g.ellipse(s * 8, -88 + Y, 2.2, 3.5, DARK);
    g.line(s * 3, -96 + Y, s * 16, -93 + Y, DARK);
    g.poly([[s * 3, -72 + Y], [s * 8, -72 + Y], [s * 5, -63 + Y]], WHITE_);
  }
  g.shade(-9, -76 + Y, 9, -71 + Y, () => DARK);
  // 헤드셋
  g.tube([[-24, -86 + Y], [-20, -104 + Y], [0, -111 + Y], [20, -104 + Y], [24, -86 + Y]], 2.2, METAL[1]);
  for (const s of [-1, 1]) ball(g, s * 25, -84 + Y, 7, 9, METAL);
  g.tube([[-25, -78 + Y], [-22, -66 + Y], [-10, -62 + Y]], 1.4, METAL[2]);
  ball(g, -9, -62 + Y, 3.4, 3, METAL);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  p.glow(-9, -88 + Y, 10, RED, 0.5);
  p.glow(9, -88 + Y, 10, RED, 0.5);
}, [52, 4]);

// ── 월요병 대왕 슬라임: 왕관 쓴 초록 산
const SL = ramp(["#0d3626", "#19603a", "#2a9045", "#50c455", "#9bea7a", "#dcffae"]);
const GK = new Grid(-92, -152, 184, 162);
export const kingslime = mod({ name: "Monday king slime", size: [200, 170], origin: [100, 150] }, (p, t, o) => {
  const a = phase(t, 2, o), g = GK, s = 1 + Math.sin(a) * 0.07, W_ = 78 * s, H_ = 104 / s;
  g.clear();
  g.shade(-90, -H_ - 2, 90, 4, (x, y, out) => {
    const u = x / W_;
    if (Math.abs(u) > 1) return 0;
    const top = -H_ * Math.pow(1 - u * u, 0.62);
    const drip = y > -2 ? 2 + 3 * Math.sin(x * 0.3 + a) : 0;
    if (y < top || (y > 0 && y > drip)) return 0;
    out.a = 0.97;
    return ballShade(SL, u * 0.92, clamp((y + H_ * 0.5) / (H_ * 0.56), -1, 1) * 0.92);
  });
  // 몸속에 갇힌 서류와 시계
  for (const [bx, by, r] of [[-38, -26, 0.3], [34, -20, -0.25], [12, -44, 0.1]]) {
    g.poly([[bx - 9 + r * 6, by - 7], [bx + 9 + r * 6, by - 7 + r * 8], [bx + 9 - r * 6, by + 7 + r * 8], [bx - 9 - r * 6, by + 7]], hex("#c8e8b8"));
    g.line(bx - 5, by - 2, bx + 6, by - 2, SL[2]); g.line(bx - 5, by + 2, bx + 4, by + 2, SL[2]);
  }
  g.ellipse(-16, -10, 6, 6, hex("#b8e8a0")); g.line(-16, -10, -16, -15, SL[1]); g.line(-16, -10, -12, -8, SL[1]);
  // 피곤한 얼굴
  const fy = -66 / s;
  for (const side of [-1, 1]) {
    g.ellipse(side * 24, fy, 13, 12, WHITE_);
    g.ellipse(side * 23, fy + 3, 5, 6, DARK);
    g.shade(side * 24 - 14, fy - 13, side * 24 + 14, fy - 3, () => SL[2]);
    g.line(side * 24 - 14, fy - 3, side * 24 + 14, fy - 3, SL[0]);
    g.line(side * 24 - 12, fy + 12, side * 24 + 12, fy + 12, SL[1]);
    g.line(side * 24 - 9, fy + 14, side * 24 + 9, fy + 14, SL[1]);
  }
  for (let x = -18; x <= 18; x++) g.set(x, fy + 26 + Math.round(Math.sin(x * 0.55 + a) * 1.5), SL[0]);
  // 왕관
  const cy = -H_ + 4;
  g.poly([[-26, cy], [26, cy], [34, cy - 30], [14, cy - 14], [0, cy - 36], [-14, cy - 14], [-34, cy - 30]], (x) => (x < -6 ? hex("#ffe27a") : x > 14 ? hex("#b0741a") : hex("#e9ae2e")));
  g.ellipse(0, cy - 9, 4, 4, RED);
  ink(g, O0, hex("#0f2e1e"));
  g.draw(p, 1, 0, 0);
  p.glow(0, -50, 72, SL[3], 0.16);
}, [78, 6]);

// ── 잼 걸린 복합기
const STEEL = ramp(["#3a3f52", "#6a7188", "#a0a8bc", "#d6dcea", "#f2f5fa"]);
const GP = new Grid(-74, -130, 148, 140);
export const printer = mod({ name: "Jammed copier", size: [160, 150], origin: [80, 134], duration: 1.6 }, (p, t, o) => {
  const a = phase(t, 1.6, o), g = GP, bob = Math.round(Math.abs(Math.sin(a * 2)) * 2), lid = Math.max(0, Math.sin(a)) * 10;
  g.clear();
  for (const s of [-1, 1]) ball(g, s * 38, -6, 9, 9, ramp(["#14161f", "#2c3040", "#555b70"]));
  g.shade(-48, -96 + bob, 48, -10 + bob, (x, y) => {
    const u = x / 48;
    let l = 0.66 - u * 0.34;
    if (y > -26 + bob) l -= 0.18;
    if (Math.floor(y) === -60 + bob || Math.floor(y) === -40 + bob) l -= 0.3;
    return STEEL[clamp(Math.floor(l * 5), 0, 4)];
  });
  // 덮개가 덜컹거린다
  g.poly([[-50, -96 + bob], [50, -96 + bob], [48, -106 + bob - lid], [-46, -106 + bob - lid]], (x) => STEEL[x < 0 ? 4 : 3]);
  g.shade(-44, -98 + bob, 44, -96 + bob, () => hex("#7fdcff"));
  // 분노한 눈
  for (const s of [-1, 1]) {
    g.shade(s * 22 - 11, -86 + bob, s * 22 + 11, -72 + bob, () => hex("#14161f"));
    g.shade(s * 22 - 6, -82 + bob, s * 22 + 6, -75 + bob, () => (wrap(t * 3, 1) < 0.5 ? RED : hex("#ff8a5a")));
    g.line(s * 8, -83 + bob, s * 36, -91 + bob, DARK);
  }
  // 조작판
  g.shade(-40, -56 + bob, 40, -44 + bob, () => hex("#22283a"));
  for (let i = 0; i < 6; i++) g.shade(-36 + i * 8, -53 + bob, -32 + i * 8, -49 + bob, () => (wrap(t * 2 + i * 0.3, 1) < 0.4 ? RED : hex("#47c27a")));
  g.shade(14, -54 + bob, 36, -46 + bob, () => hex("#ffe27a"));
  // 걸린 종이: 입에서 구겨져 나온다
  const L = 20 + Math.sin(a * 2) * 6;
  g.shade(-24, -38 + bob, 24, -38 + bob + L, (x, y) => {
    const v = y - (-38 + bob);
    if (Math.abs(x + Math.sin(v * 0.4 + a) * 4) > 22) return 0;
    return Math.floor(v) % 5 === 4 ? hex("#8c8778") : (x + v) % 11 < 1 ? hex("#c7c0ab") : WHITE_;
  });
  g.shade(-28, -40 + bob, 28, -36 + bob, () => DARK);
  // 팔처럼 튀어나온 용지함
  g.shade(-70, -46 + bob, -48, -40 + bob, () => STEEL[2]);
  g.shade(48, -46 + bob, 70, -40 + bob, () => STEEL[1]);
  g.shade(-68, -52 + bob, -52, -46 + bob, () => WHITE_);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  for (const s of [-1, 1]) p.glow(s * 22, -78 + bob, 12, RED, 0.45);
}, [56, 5]);

// ── 엉킨 랜선 거미
const SP_B = ramp(["#10131e", "#222838", "#3a4258", "#5c6680"]);
const CAB = ["#3fa0ff", "#ffd23c", "#ff8a2a", "#c58bff"].map(hex);
const GS = new Grid(-104, -110, 208, 120);
export const spider = mod({ name: "Tangled LAN spider", size: [220, 130], origin: [110, 116], duration: 1.4 }, (p, t, o) => {
  const a = phase(t, 1.4, o), g = GS, bob = Math.sin(a * 2) * 2;
  g.clear();
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const lift = Math.max(0, Math.sin(a + i * 1.57 + (s > 0 ? Math.PI : 0))) * 12;
    const hip = [s * 14, -46 + i * 7 + bob], knee = [s * (46 + i * 11), -84 + i * 13 - lift * 0.6], foot = [s * (66 + i * 12), -4 - lift];
    g.tube([hip, knee, foot], 2.6, CAB[i]);
    g.shade(foot[0] - 3, foot[1] - 3, foot[0] + 3, foot[1] + 3, () => hex("#dbe6ee"));
  }
  ball(g, 0, -60 + bob, 34, 30, SP_B, 0.04);
  for (let i = 0; i < 9; i++) {
    const on = wrap(t * 2 + i * 0.37, 1) < 0.5;
    g.ellipse(-20 + (i % 3) * 20, -76 + Math.floor(i / 3) * 12 + bob, 2, 2, on ? hex("#47e27a") : hex("#1c4a2c"));
  }
  ball(g, 0, -34 + bob, 21, 17, SP_B, 0.1);
  for (const [x, y, r] of [[-9, -38, 4], [9, -38, 4], [-16, -32, 2.4], [16, -32, 2.4], [-4, -29, 2], [4, -29, 2]]) g.ellipse(x, y + bob, r, r, RED);
  g.poly([[-9, -22 + bob], [-3, -22 + bob], [-7, -11 + bob]], WHITE_);
  g.poly([[3, -22 + bob], [9, -22 + bob], [7, -11 + bob]], WHITE_);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  p.glow(0, -36 + bob, 26, RED, 0.25);
}, [76, 4]);

// ── 야근 대왕 유령
const PH = ramp(["#2a3560", "#4b5e96", "#7a93c8", "#adc3ea", "#dbe7ff", "#ffffff"]);
const GH = new Grid(-74, -136, 148, 146);
export const phantom = mod({ name: "Overtime phantom", size: [160, 160], origin: [80, 142], duration: 2.4 }, (p, t, o) => {
  const a = phase(t, 2.4, o), g = GH, Y = -18 + Math.sin(a) * 5;
  g.clear();
  const R = 44, top = 112;
  const hw = (h) => (h > top - R ? Math.sqrt(Math.max(0, R * R - (h - (top - R)) ** 2)) : R + (1 - h / (top - R)) * 12);
  g.shade(-62, Y - top - 2, 62, Y + 12, (x, y, out) => {
    const h = Y - y, hemY = 3 + 4 * Math.sin(x * 0.22 + a * 2);
    if (h < -hemY) return 0;
    const w = hw(Math.max(0, h));
    if (Math.abs(x) > w) return 0;
    out.a = 0.92;
    return ballShade(PH, x / (w + 2), clamp(-(h - top * 0.55) / (top * 0.6), -1, 1) * 0.9, 0.08);
  });
  // 팔과 커피
  for (const s of [-1, 1]) g.tube([[s * 46, Y - 62], [s * 62, Y - 46 + Math.sin(a + s) * 4]], 7, PH[s < 0 ? 4 : 2]);
  g.shade(55, Y - 58 + Math.sin(a + 1) * 4, 69, Y - 42 + Math.sin(a + 1) * 4, () => WHITE_);
  g.shade(55, Y - 58 + Math.sin(a + 1) * 4, 69, Y - 54 + Math.sin(a + 1) * 4, () => hex("#70431f"));
  // 다크서클 눈
  for (const s of [-1, 1]) {
    g.ellipse(s * 16, Y - 82, 11, 14, hex("#232a55"));
    g.ellipse(s * 16, Y - 80, 6, 8, DARK);
    g.set(s * 14, Y - 85, WHITE_); g.set(s * 13, Y - 85, WHITE_);
  }
  g.ellipse(0, Y - 56, 9, 12, hex("#232a55"));
  // 풀어헤친 넥타이와 사원증
  g.poly([[-5, Y - 40], [5, Y - 40], [9, Y - 12], [1, Y - 2], [-8, Y - 12]], (x) => (x > 2 ? hex("#8e1f2a") : hex("#c8332e")));
  g.shade(18, Y - 34, 34, Y - 14, () => hex("#f5f7fb"));
  g.shade(18, Y - 34, 34, Y - 30, () => hex("#2f7fcc"));
  g.ellipse(26, Y - 23, 3, 3, PH[1]);
  ink(g, hex("#141a38"), hex("#1f2850"));
  g.draw(p, 1, 0, 0);
  p.glow(0, Y - 60, 66, PH[3], 0.28);
}, [50, 5]);

// ── 캐비닛 미믹
const CB = ramp(["#222b2c", "#3f5052", "#667c7c", "#94aaa8", "#c8d8d4"]);
const GM = new Grid(-58, -128, 116, 136);
export const mimic = mod({ name: "Cabinet mimic", size: [130, 150], origin: [65, 134], duration: 1.2 }, (p, t, o) => {
  const a = phase(t, 1.2, o), g = GM, bob = Math.round(Math.abs(Math.sin(a)) * 4), open = 12 + Math.max(0, Math.sin(a * 2)) * 12;
  g.clear();
  for (const s of [-1, 1]) {
    g.tube([[s * 20, -14 + bob], [s * 28 + Math.sin(a) * s * 6, 0]], 5, CB[0]);
    g.shade(s * 28 - 8, -3, s * 28 + 8, 0, () => hex("#14181a"));
  }
  g.shade(-38, -96 + bob, 38, -8 + bob, (x, y) => {
    const v = (y - (-96 + bob)) % 30, l = 0.62 - (x / 38) * 0.32 + (v < 1 ? -0.3 : v > 28.5 ? -0.2 : 0);
    return CB[clamp(Math.floor(l * 5), 0, 4)];
  });
  for (const yy of [-66, -36]) {
    g.shade(-14, yy + 10 + bob, 14, yy + 15 + bob, () => CB[0]);
    g.shade(-10, yy + 11 + bob, 10, yy + 13 + bob, () => CB[3]);
    g.shade(-24, yy + 2 + bob, -6, yy + 8 + bob, () => WHITE_);
    g.line(-22, yy + 5 + bob, -9, yy + 5 + bob, hex("#8c8778"));
  }
  // 윗서랍이 입이 된다
  const my = -96 + bob;
  g.shade(-36, my - open - 8, 36, my, (x, y) => (y < my - open ? CB[x < 0 ? 4 : 2] : hex("#1b0d13")));
  g.ellipse(0, my - 5, 18, 5, RED);
  for (let i = -5; i <= 5; i++) {
    const x = i * 7;
    g.poly([[x - 3.5, my - open], [x + 3.5, my - open], [x, my - open + 9]], WHITE_);
    g.poly([[x - 3.5, my], [x + 3.5, my], [x, my - 8]], WHITE_);
  }
  for (const s of [-1, 1]) {
    g.ellipse(s * 15, my - open - 16, 7, 7, YEL);
    g.ellipse(s * 15, my - open - 15, 2.5, 5, DARK);
    g.line(s * 5, my - open - 21, s * 25, my - open - 26, DARK);
  }
  g.poly([[-38, my - 2], [-52, my - 18], [-40, my - 22]], WHITE_);
  g.poly([[38, my - 4], [54, my - 12], [42, my - 26]], hex("#d8d0b8"));
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  for (const s of [-1, 1]) p.glow(s * 15, my - open - 16, 12, YEL, 0.4);
}, [46, 5]);

// ── 내부감사의 눈
const LID = ramp(["#2a1438", "#4a2260", "#73368c", "#a158b8"]);
const GA = new Grid(-84, -142, 168, 152);
export const auditor = mod({ name: "Audit eye", size: [180, 160], origin: [90, 144], duration: 2.6 }, (p, t, o) => {
  const a = phase(t, 2.6, o), g = GA, Y = -28 + Math.sin(a) * 5, cy = Y - 68;
  g.clear();
  for (let i = 0; i < 6; i++) {
    const x0 = -30 + i * 12, sway = Math.sin(a * 1.5 + i * 1.1);
    g.tube([[x0, cy + 34], [x0 * 1.4 + sway * 8, cy + 62], [x0 * 1.8 - sway * 12, cy + 92]], (u) => 6.5 - u * 5, LID[i % 2 ? 2 : 1]);
  }
  g.ellipse(0, cy, 46, 46, (nx, ny) => ballShade(ramp(["#a39a85", "#d0c7ad", "#f2ebd6", "#fffaf0"]), nx, ny, 0.12));
  for (let i = 0; i < 9; i++) {
    const v = (i / 9) * TAU + 0.3;
    let x = Math.cos(v) * 44, y = cy + Math.sin(v) * 44;
    for (let s = 0; s < 20; s++) { g.set(x, y, hex("#d9534a")); x += (-x / 44) * 1 + Math.sin(s + i) * 0.6; y += ((cy - y) / 44) * 1 + Math.cos(s * 1.3 + i) * 0.6; }
  }
  const lx = Math.sin(a) * 9, ly = Math.cos(a * 0.7) * 5;
  g.ellipse(lx, cy + ly, 24, 24, (nx, ny) => { const d = Math.hypot(nx, ny); return d > 0.82 ? hex("#7a3b10") : d > 0.5 ? hex("#e9ae2e") : hex("#ffe27a"); });
  g.ellipse(lx, cy + ly, 11, 13, DARK);
  g.ellipse(lx - 6, cy + ly - 8, 4, 4, WHITE_);
  // 치켜뜬 윗눈꺼풀
  g.shade(-50, cy - 50, 50, cy + 2, (x, y) => {
    if (x * x + (y - cy) * (y - cy) > 49 * 49) return 0;
    if (y > cy - 20 - x * 0.28) return 0;
    return LID[clamp(Math.floor(2.4 - (x / 50) * 1.3 + (y + 40 - cy) * -0.02), 0, 3)];
  });
  // 돋보기
  const mx = 64, my = cy + 24 + Math.sin(a * 2) * 3;
  g.tube([[30, cy + 36], [mx - 8, my + 14]], 4, LID[2]);
  g.ellipse(mx, my, 15, 15, hex("#c48412"));
  g.ellipse(mx, my, 11, 11, hex("#bfeeff"));
  g.line(mx - 6, my - 2, mx + 1, my - 7, WHITE_);
  ink(g, O0, hex("#1e1028"));
  g.draw(p, 1, 0, 0);
  p.glow(lx, cy + ly, 30, YEL, 0.22);
}, [44, 5]);

// ── 결재선 히드라: 머리 셋이 차례로 결재를 요구한다
const HY = ramp(["#0b2e33", "#154f52", "#22796f", "#3fae8a", "#86dca8"]);
const HY2 = ramp(["#3e2c05", "#7a5a12", "#b58a22", "#e6c04a", "#fff0a0"]);
const GY = new Grid(-108, -158, 216, 168);
export const hydra = mod({ name: "Approval hydra", size: [230, 180], origin: [115, 162] }, (p, t, o) => {
  const a = phase(t, 2, o), g = GY;
  g.clear();
  g.tube([[-26, -18], [-58, -8], [-92, -18 + Math.sin(a) * 6]], (u) => 16 * (1 - u) + 2, HY[2]);
  for (const s of [-1, 1]) {
    g.tube([[s * 26, -22], [s * 32, -4]], 10, HY[1]);
    for (const c of [-4, 0, 4]) g.poly([[s * 32 + c - 2, -2], [s * 32 + c + 2, -2], [s * 32 + c, 4]], hex("#e8e0c0"));
  }
  ball(g, 0, -40, 44, 34, HY);
  g.ellipse(0, -30, 26, 22, (nx, ny) => HY2[clamp(Math.floor(2.5 - nx - ny + (Math.floor((ny + 1) * 5) % 2 ? -0.6 : 0)), 0, 4)]);
  const heads = [[-58, -108, 0], [58, -108, 2.1], [0, -134, 4.2]];
  for (const [hx0, hy0, ph] of heads) {
    const hx = hx0 + Math.sin(a + ph) * 8, hy = hy0 + Math.cos(a * 1 + ph) * 6, side = Math.sign(hx0);
    g.tube([[hx0 * 0.3, -60], [hx0 * 0.75, -82 + Math.sin(a + ph) * 3], [hx, hy + 8]], (u) => 11 - u * 4, HY[2]);
    g.tube([[hx0 * 0.3 - 3, -58], [hx0 * 0.75 - 3, -80], [hx - 3, hy + 10]], 2.2, HY[3]);
    ball(g, hx, hy, 18, 14, HY, 0.05);
    g.ellipse(hx + side * 3, hy + 10, 12, 7, (nx, ny) => ballShade(HY, nx, ny));
    g.shade(hx - 9 + side * 3, hy + 12, hx + 9 + side * 3, hy + 16, () => DARK);
    for (let i = -7; i <= 6; i += 4) g.poly([[hx + side * 3 + i, hy + 12], [hx + side * 3 + i + 3, hy + 12], [hx + side * 3 + i + 1.5, hy + 16]], WHITE_);
    for (const e of [-1, 1]) {
      g.poly([[hx + e * 3, hy - 5], [hx + e * 14, hy - 8], [hx + e * 13, hy], [hx + e * 5, hy + 1]], YEL);
      g.line(hx + e * 8, hy - 7, hx + e * 8, hy, DARK);
      g.poly([[hx + e * 9, hy - 11], [hx + e * 16, hy - 12], [hx + e * 22, hy - 28]], hex("#e8e0c0"));
    }
    // 머리마다 빨간 도장
    g.ellipse(hx, hy - 11, 3.4, 3.4, RED);
  }
  ink(g, O0, hex("#0c2224"));
  g.draw(p, 1, 0, 0);
  for (const [hx0, hy0, ph] of heads) p.glow(hx0 + Math.sin(a + ph) * 8, hy0 + Math.cos(a + ph) * 6, 18, YEL, 0.2);
}, [60, 5]);

// ── 희망퇴직 사신
const RB = ramp(["#08080e", "#14141f", "#242433", "#3a3a4e", "#5a5a72"]);
const GR = new Grid(-82, -150, 164, 160);
export const reaper = mod({ name: "Layoff reaper", size: [180, 170], origin: [90, 154], duration: 2.8 }, (p, t, o) => {
  const a = phase(t, 2.8, o), g = GR, Y = -18 + Math.sin(a) * 4;
  g.clear();
  g.shade(-36, Y - 88, 36, Y + 14, (x, y) => {
    const k = (y - (Y - 88)) / 102, hw = 16 + k * 24 + Math.sin(k * 8 + a * 2) * 2;
    if (Math.abs(x) > hw) return 0;
    if (y > Y + 10 + Math.sin(x * 0.7 + a) * 5) return 0;
    return RB[clamp(Math.floor((0.56 - (x / hw) * 0.4 + Math.sin(x * 0.5 + a * 0.5) * 0.15) * 5), 0, 4)];
  });
  // 후드와 해골
  g.ellipse(0, Y - 100, 23, 25, (nx, ny) => ballShade(RB, nx, ny, 0.1));
  g.ellipse(1, Y - 96, 14, 17, hex("#050508"));
  g.ellipse(1, Y - 98, 10, 10, (nx, ny) => ballShade(ramp(["#928a72", "#cfc6a8", "#fbf5e1"]), nx, ny, 0.1));
  g.ellipse(-3, Y - 99, 2.8, 3.2, DARK); g.ellipse(5, Y - 99, 2.8, 3.2, DARK);
  for (let i = -4; i <= 6; i += 2) g.line(i, Y - 92, i, Y - 89, DARK);
  // 큰 낫
  const sw = Math.sin(a) * 3, hx = 46 + sw;
  g.line(hx - 8, Y + 8, hx + 12, Y - 120, hex("#3c2413"));
  g.line(hx - 7, Y + 8, hx + 13, Y - 120, hex("#6f4522"));
  g.poly([[hx + 12, Y - 124], [hx - 60, Y - 138], [hx - 74, Y - 118], [hx - 44, Y - 124], [hx + 8, Y - 112]], (x, y) => (y < Y - 128 ? hex("#eef3fb") : hex("#8a94ae")));
  g.tube([[18, Y - 70], [hx - 2, Y - 62]], 4.5, RB[3]);
  ball(g, hx - 1, Y - 62, 5, 5, ramp(["#928a72", "#fbf5e1"]));
  // 왼손의 봉투
  g.tube([[-18, Y - 70], [-44, Y - 54]], 4.5, RB[3]);
  const ey = Y - 56 + Math.sin(a * 2) * 3;
  g.shade(-68, ey - 9, -42, ey + 9, () => WHITE_);
  g.line(-68, ey - 9, -55, ey, hex("#a9a18c")); g.line(-42, ey - 9, -55, ey, hex("#a9a18c"));
  g.ellipse(-55, ey + 2, 3.4, 3.4, RED);
  ink(g, O0, hex("#26263a"));
  g.draw(p, 1, 0, 0);
  p.glow(-3, Y - 99, 9, hex("#7df0ff"), 0.6);
  p.glow(5, Y - 99, 9, hex("#7df0ff"), 0.6);
  p.glow(hx - 34, Y - 128, 26, hex("#9fc4ff"), 0.2);
}, [40, 4]);

// ── 알람시계 골렘
const BODY = ramp(["#4a0e16", "#86202a", "#c83a3a", "#ef6a58"]);
const BELL = ramp(["#6e4310", "#b0741a", "#e9ae2e", "#ffe27a"]);
const GL = new Grid(-74, -140, 148, 148);
export const alarm = mod({ name: "Alarm golem", size: [160, 160], origin: [80, 146], duration: 0.8 }, (p, t, o) => {
  const a = phase(t, 0.8, o), g = GL, shake = Math.sin(a * 6) * 1.6, bob = Math.round(Math.abs(Math.sin(a)) * 3);
  g.clear();
  for (const s of [-1, 1]) {
    g.tube([[s * 18, -22 + bob], [s * 24 + Math.sin(a) * s * 6, -3]], 7, hex("#2c3040"));
    g.shade(s * 24 - 10, -4, s * 24 + 10, 0, () => hex("#14161f"));
    g.tube([[s * 40, -66 + bob], [s * 58, -48 + bob + Math.sin(a + s) * 6]], 6, BODY[1]);
    ball(g, s * 60, -44 + bob + Math.sin(a + s) * 6, 10, 9, BODY);
  }
  ball(g, 0 + shake, -66 + bob, 44, 44, BODY, 0.05);
  g.ellipse(shake, -66 + bob, 34, 34, WHITE_);
  for (let i = 0; i < 12; i++) {
    const v = (i / 12) * TAU;
    g.line(shake + Math.sin(v) * 27, -66 + bob - Math.cos(v) * 27, shake + Math.sin(v) * 31, -66 + bob - Math.cos(v) * 31, i % 3 ? hex("#a9a18c") : DARK);
  }
  // 성난 얼굴
  for (const s of [-1, 1]) {
    g.ellipse(shake + s * 12, -72 + bob, 6, 6, DARK);
    g.ellipse(shake + s * 12, -72 + bob, 2.4, 2.4, RED);
    g.line(shake + s * 3, -80 + bob, shake + s * 21, -86 + bob, DARK);
  }
  g.shade(shake - 15, -56 + bob, shake + 15, -46 + bob, () => DARK);
  for (let i = -13; i <= 12; i += 5) g.shade(shake + i, -56 + bob, shake + i + 3, -50 + bob, () => WHITE_);
  // 종과 망치
  for (const s of [-1, 1]) {
    ball(g, s * 25 + shake * s, -114 + bob, 16, 15, BELL, 0.04);
    g.line(s * 18, -102 + bob, s * 12, -98 + bob, BELL[0]);
  }
  const hit = Math.sin(a * 8) * 7;
  g.line(0, -112 + bob, hit, -128 + bob, hex("#4a5468"));
  g.ellipse(hit, -130 + bob, 5, 5, hex("#9aa6ba"));
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  for (let i = 0; i < 6; i++) {
    const u = wrap(t * 2 + i / 6, 1), v = -2.2 + i * 0.86;
    p.dot(Math.cos(v) * (46 + u * 28), -112 + bob + Math.sin(v) * (16 + u * 26), YEL, 1 - u);
  }
}, [48, 5]);
