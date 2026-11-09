// 긴급회의 오우거: 넥타이 맨 초록 거인. 회의 안건 몽둥이를 들고 있다.
import { TAU, hex } from "../../vendor/pixelfx/core/index.js";
import { Grid, ball, ballShade, ink, shadow, shift, ramp } from "./kit.js";

export const meta = { name: "Meeting ogre", size: [190, 140], origin: [90, 128], duration: 2, loop: true, fps: 15, options: { seed: 1 } };

const SKIN1 = ramp(["#1e3a23", "#2f5e30", "#4a8a3c", "#74b84c", "#a9dd6d"]);
const SKIN2 = ramp(["#4a0f1c", "#86202e", "#c23c42", "#ea6f60", "#ffae90"]);
const HAT = ["#ffd23c", "#39a0e8", "#e2413a"].map(hex);
const SHIRT = ramp(["#58617e", "#8791ad", "#bcc6da", "#eef2f8"]);
const TIE = ramp(["#6e1420", "#b5242e", "#ec4b45"]);
const PANTS = ramp(["#171a2e", "#262c4a", "#3a4468"]);
const CLUB = ramp(["#2e1a0d", "#5a3519", "#8a5828", "#b98a48"]);
const TUSK = hex("#fff6dc"), DARK = hex("#10131c"), EYE = hex("#ffd23c"), RED = hex("#e2413a"), METAL = hex("#c9cfdb");
const O0 = hex("#0b0f12"), O1 = hex("#172519");
const G = new Grid(-66, -116, 160, 122);

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  const bob = Math.round(Math.abs(Math.sin(a)) * 3), step = Math.sin(a) * 8, swing = Math.sin(a) * 0.3;
  const g = G, SKIN = o.alt ? SKIN2 : SKIN1;
  g.clear();
  // 다리
  g.shade(-24 - step, -24, -6 - step, -2, (x) => PANTS[x > -14 - step ? 0 : 1]);
  g.shade(6 + step, -24, 24 + step, -2, (x) => PANTS[x > 18 + step ? 0 : 2]);
  g.shade(-27 - step, -6, -4 - step, 0, () => hex("#3b2413"));
  g.shade(4 + step, -6, 27 + step, 0, () => hex("#4f3019"));
  // 뒷팔
  g.tube([[-33, -68 + bob], [-44, -48 + bob], [-41, -30 + bob]], (u) => 10 - u * 2, (u, v) => SKIN[v > 0.7 ? 1 : 2]);
  ball(g, -41, -27 + bob, 10, 9, SKIN);
  // 몸통: 터질 듯한 와이셔츠
  g.ellipse(0, -48 + bob, 36, 31, (nx, ny) => ballShade(SHIRT, nx, ny));
  for (const [bx, by] of [[0, -62], [0, -50], [0, -38]]) g.ellipse(bx + 1, by + bob, 1.4, 1.4, DARK);
  g.shade(-34, -26 + bob, 34, -20 + bob, (x, y) => PANTS[Math.abs(x) < 5 ? 2 : 1]);
  g.shade(-5, -26 + bob, 5, -21 + bob, () => METAL);
  // 머리
  ball(g, 0, -81 + bob, 25, 21, SKIN, 0.04);
  ball(g, -24, -85 + bob, 6, 8, SKIN);
  ball(g, 24, -85 + bob, 6, 8, SKIN);
  // 눈
  g.shade(-15, -90 + bob, -5, -83 + bob, () => DARK);
  g.shade(5, -90 + bob, 15, -83 + bob, () => DARK);
  g.shade(-12, -88 + bob, -8, -85 + bob, () => EYE);
  g.shade(8, -88 + bob, 12, -85 + bob, () => EYE);
  g.line(-18, -94 + bob, -4, -89 + bob, DARK); g.line(-18, -95 + bob, -4, -90 + bob, DARK);
  g.line(18, -94 + bob, 4, -89 + bob, DARK); g.line(18, -95 + bob, 4, -90 + bob, DARK);
  // 입·엄니
  g.shade(-14, -76 + bob, 14, -70 + bob, () => hex("#1a2a1d"));
  g.poly([[-12, -72 + bob], [-7, -72 + bob], [-9.5, -83 + bob]], TUSK);
  g.poly([[7, -72 + bob], [12, -72 + bob], [9.5, -83 + bob]], TUSK);
  // 넥타이
  g.poly([[-6, -63 + bob], [6, -63 + bob], [4, -57 + bob], [-4, -57 + bob]], TIE[2]);
  g.poly([[-4, -58 + bob], [4, -58 + bob], [8, -30 + bob], [0, -22 + bob], [-8, -30 + bob]], (x) => TIE[x > 2 ? 0 : 1]);
  // 앞팔과 몽둥이(안건)
  const hx = 45 + swing * 14, hy = -36 + bob - swing * 20;
  const tipX = hx + 16 + swing * 12, tipY = hy - 42 - swing * 10;
  g.tube([[hx, hy], [tipX, tipY]], (u) => 3.5 + u * 7, (u, v) => CLUB[v > 0.7 ? 0 : u > 0.6 ? 3 : 2]);
  g.ellipse(tipX, tipY, 12, 12, (nx, ny) => ballShade(CLUB, nx, ny));
  for (let i = 0; i < 6; i++) g.set(tipX + Math.cos((i * TAU) / 6) * 9, tipY + Math.sin((i * TAU) / 6) * 9, METAL);
  g.tube([[33, -68 + bob], [46, -54 + bob], [hx, hy]], (u) => 11 - u * 2, (u, v) => SKIN[v > 0.7 ? 1 : 3]);
  ball(g, hx, hy, 11, 10, SKIN, 0.05);
  // 회식 3차: 고깔모자
  if (o.alt) g.poly([[-13, -100 + bob], [13, -100 + bob], [2, -115 + bob]], (x, y) => HAT[Math.abs(Math.floor(x / 5 + y / 7)) % 3]);
  // 몽둥이의 긴급 딱지
  g.shade(tipX - 7, tipY - 3, tipX + 7, tipY + 3, () => RED);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  p.glow(-10, -86 + bob, 9, EYE, 0.32);
  p.glow(10, -86 + bob, 9, EYE, 0.32);
}

export function drawBack(p) {
  shadow(p, 0, 0, 42, 4, hex("#050509"), 0.6);
}
