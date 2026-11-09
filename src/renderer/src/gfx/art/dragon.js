// 17시 59분 업무지시: 퇴근 1분 전에 나타나는 붉은 용. 목에 사원증을 걸고 있다.
import { TAU, hex, wrap } from "../../vendor/pixelfx/core/index.js";
import { Grid, ball, ballShade, ink, shadow, shift, ramp } from "./kit.js";

export const meta = { name: "Deadline dragon", size: [220, 170], origin: [110, 156], duration: 2, loop: true, fps: 15, options: { seed: 1, enraged: 0 } };

const SCALE = ramp(["#3a0a14", "#6f1420", "#a92a2a", "#dd5233", "#ff9048"]);
const BELLY = ramp(["#a3602a", "#d8953f", "#f6c76d", "#ffe9a8"]);
const WING = ramp(["#2b0a18", "#4d1224", "#7a1d30", "#a93444"]);
const HORN = ramp(["#6e6448", "#b5a97e", "#f2e9c8"]);
const DARK = hex("#120610"), EYE = hex("#fff37a"), FIRE = hex("#ff7a2a"), CARD = hex("#f5f7fb"), BLUE = hex("#2f7fcc"), LANYARD = hex("#3f8cff");
const O0 = hex("#0d0308"), O1 = hex("#2c0a14");
const G = new Grid(-108, -152, 216, 158);

function wing(g, side, a) {
  const flap = Math.sin(a) * 18;
  const rootX = side * 18, rootY = -74;
  const elbowX = side * 56, elbowY = -116 - flap * 0.8;
  const tipX = side * 100, tipY = -92 - flap * 1.5;
  const pts = [[rootX, rootY], [elbowX, elbowY], [tipX, tipY], [side * 88, -58 - flap * 0.8], [side * 68, -68 - flap * 0.6], [side * 52, -46 - flap * 0.4], [side * 34, -60], [rootX, -44]];
  g.poly(pts, (x, y) => {
    const u = Math.abs(x) / 100, rib = Math.sin(u * 22 + y * 0.05) > 0.8;
    return WING[rib ? 0 : Math.max(0, Math.min(3, Math.floor(2.8 - u * 2 + (side < 0 ? 0.6 : -0.3))))];
  });
  g.tube([[rootX, rootY], [elbowX, elbowY], [tipX, tipY]], (u) => 4 - u * 2.5, (u, v) => SCALE[v > 0.6 ? 1 : 3]);
  g.tube([[elbowX, elbowY], [side * 88, -58 - flap * 0.8]], 1.3, WING[3]);
  g.tube([[elbowX, elbowY], [side * 52, -46 - flap * 0.4]], 1.3, WING[3]);
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  const bob = Math.sin(a) * 4;
  const g = G;
  g.clear();
  const B = -20 + bob;
  // 꼬리
  const tail = [[-12, -22 + B + 20], [-40, -10 + B + 20], [-68, -22 + B + 20 + Math.sin(a) * 4], [-92, -14 + B + 20 + Math.sin(a + 1) * 8]];
  g.tube(tail, (u) => 12 * (1 - u) + 1.5, (u, v) => SCALE[v > 0.7 ? 1 : 2]);
  g.poly([[-92, -24 + B + 20], [-108, -12 + B + 20], [-88, -4 + B + 20]], SCALE[3]);
  wing(g, -1, a);
  wing(g, 1, a + 0.15);
  // 뒷발
  for (const s of [-1, 1]) {
    g.tube([[s * 22, -24 + B + 8], [s * 28, -6 + B + 8]], (u) => 10 - u * 4, (u, v) => SCALE[v > 0.6 ? 1 : s < 0 ? 3 : 2]);
    for (const c of [-4, 0, 4]) g.poly([[s * 28 + c - 2, -2 + B + 8], [s * 28 + c + 2, -2 + B + 8], [s * 28 + c, 3 + B + 8]], HORN[1]);
  }
  // 몸통
  g.ellipse(0, -42 + B, 34, 33, (nx, ny) => (Math.abs(nx) < 0.5 && ny > -0.5 ? BELLY[Math.max(0, Math.min(3, Math.floor(2.4 - nx * 1.3 - ny * 0.9 + (Math.floor((ny + 1) * 7) % 2 === 0 ? -0.5 : 0))))] : ballShade(SCALE, nx, ny)));
  // 앞발: 서류를 움켜쥐었다
  for (const s of [-1, 1]) {
    g.tube([[s * 28, -56 + B], [s * 40, -36 + B]], (u) => 8 - u * 3, (u, v) => SCALE[v > 0.6 ? 1 : 3]);
    ball(g, s * 41, -33 + B, 7, 6, SCALE);
  }
  // 목
  const hx = Math.sin(a * 0.5) * 6, hy = -112 + B + Math.cos(a) * 3;
  g.tube([[0, -68 + B], [Math.sin(a * 0.5) * 3, -88 + B], [hx, hy + 8]], (u) => 16 - u * 6, SCALE[2]);
  g.tube([[-6, -68 + B], [Math.sin(a * 0.5) * 3 - 5, -88 + B], [hx - 4, hy + 8]], (u) => 3.5 - u, SCALE[3]);
  g.tube([[3, -66 + B], [Math.sin(a * 0.5) * 3 + 3, -88 + B], [hx + 2, hy + 10]], (u) => 7 - u * 2.5, BELLY[2]);
  for (let i = 0; i < 5; i++) g.line(-5 + hx * 0.3, -70 + B - i * 8, 9 + hx * 0.3, -70 + B - i * 8, BELLY[0]);
  // 사원증
  g.line(-10, -74 + B, 0, -56 + B, LANYARD); g.line(10, -74 + B, 0, -56 + B, LANYARD);
  g.shade(-7, -56 + B, 7, -40 + B, () => CARD);
  g.shade(-7, -56 + B, 7, -52 + B, () => BLUE);
  g.ellipse(0, -47 + B, 3, 3, SCALE[2]);
  g.line(-4, -42 + B, 4, -42 + B, BLUE);
  // 머리
  ball(g, hx, hy, 23, 17, SCALE, 0.05);
  g.ellipse(hx, hy + 13, 15, 10, (nx, ny) => ballShade(SCALE, nx, ny, 0.05));
  g.shade(hx - 12, hy + 15, hx + 12, hy + 21, () => DARK);
  for (let i = -10; i <= 8; i += 4) g.poly([[hx + i, hy + 15], [hx + i + 3, hy + 15], [hx + i + 1.5, hy + 20]], HORN[2]);
  g.ellipse(hx - 6, hy + 8, 2, 1.5, DARK);
  g.ellipse(hx + 6, hy + 8, 2, 1.5, DARK);
  // 뿔
  for (const s of [-1, 1]) {
    g.poly([[hx + s * 12, hy - 12], [hx + s * 22, hy - 14], [hx + s * 33, hy - 40]], (x) => HORN[s * (x - hx) > 22 ? 2 : 1]);
    g.poly([[hx + s * 20, hy - 3], [hx + s * 32, hy - 5], [hx + s * 40, hy - 18]], WING[2]);
  }
  // 눈
  for (const s of [-1, 1]) {
    g.poly([[hx + s * 4, hy - 7], [hx + s * 18, hy - 11], [hx + s * 17, hy - 2], [hx + s * 7, hy - 1]], DARK);
    g.poly([[hx + s * 7, hy - 6], [hx + s * 15, hy - 8], [hx + s * 14, hy - 4], [hx + s * 8, hy - 3]], EYE);
    g.line(hx + s * 11, hy - 8, hx + s * 11, hy - 3, DARK);
  }
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  const fl = 0.75 + 0.25 * Math.sin(t * 13);
  p.glow(hx - 11, hy - 5, 12, EYE, 0.45 * fl);
  p.glow(hx + 11, hy - 5, 12, EYE, 0.45 * fl);
  p.glow(hx, hy + 19, 26, FIRE, (0.3 + 0.4 * (o.enraged || 0)) * fl);
  // 콧김·불티
  for (let i = 0; i < 8; i++) {
    const u = wrap(t * 1.2 + i / 8, 1), sx = i % 2 ? -1 : 1;
    p.dot(hx + sx * (6 + u * 8) + Math.sin(i * 5 + t * 9) * 3, hy + 22 + u * 22, u < 0.4 ? EYE : FIRE, 1 - u);
  }
}

export function drawBack(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  shadow(p, 0, 4, 58 - 4 * Math.sin(a), 5, hex("#050509"), 0.55);
}
