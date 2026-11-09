// 주간보고 리치: 끝없이 늘어지는 보고서 두루마리를 든 해골 마법사.
import { TAU, hex, wrap } from "../../vendor/pixelfx/core/index.js";
import { Grid, ball, ballShade, ink, shadow, shift, ramp } from "./kit.js";

export const meta = { name: "Report lich", size: [140, 150], origin: [70, 138], duration: 3, loop: true, fps: 15, options: { seed: 1, shield: 0 } };

const ROBE1 = ramp(["#150d2c", "#2a1a54", "#452a82", "#6a43b4", "#9c74e0"]);
const ROBE2 = ramp(["#06202c", "#0c4257", "#176f86", "#2aa5b4", "#74e0dc"]);
const BONE = ramp(["#5a5242", "#928a72", "#cfc6a8", "#fbf5e1"]);
const GOLD = ramp(["#6e4310", "#c48412", "#ffe066"]);
const PAPER = hex("#f5eedb"), PAPER2 = hex("#b9b099"), LINE = hex("#7f7a6c"), DARK = hex("#0b0812"), EYE = hex("#7df0ff"), FLAME = hex("#a770ff");
const O0 = hex("#07050f"), O1 = hex("#1a1233");
const G = new Grid(-54, -128, 108, 134);

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  const hover = Math.sin(a) * 3;
  const g = G, ROBE = o.alt ? ROBE2 : ROBE1;
  g.clear();
  const Y = -20 + hover;
  // 로브 자락 — 아래로 갈수록 찢어져 흩어진다
  g.shade(-34, -80 + Y, 34, 18 + Y, (x, y, out) => {
    const k = (y - (-80 + Y)) / 98;
    const hw = 13 + k * 22 + Math.sin(k * 7 + a * 2) * 2;
    if (Math.abs(x) > hw) return 0;
    const tear = 15 + Y + Math.sin(x * 0.8 + a) * 4;
    if (y > tear) return 0;
    if (k > 0.75 && Math.floor(x / 3) % 2 === 0 && y > tear - 8) out.a = 0.9;
    const u = x / hw, fold = Math.sin(x * 0.55 + a * 0.5) * 0.14;
    return ROBE[Math.max(0, Math.min(4, Math.floor((0.55 - u * 0.4 + fold) * 5)))];
  });
  // 어깨 장식
  ball(g, -19, -76 + Y, 11, 8, GOLD);
  ball(g, 19, -76 + Y, 11, 8, GOLD);
  // 해골
  ball(g, 0, -93 + Y, 15, 14.5, BONE, 0.1);
  g.shade(-10, -88 + Y, 10, -80 + Y, (x, y) => BONE[Math.abs(x) > 7 ? 1 : 2]);
  g.ellipse(-6, -95 + Y, 4.6, 5, DARK);
  g.ellipse(6, -95 + Y, 4.6, 5, DARK);
  g.poly([[-2, -88 + Y], [2, -88 + Y], [0, -92 + Y]], DARK);
  for (let i = -8; i <= 8; i += 3) g.line(i, -85 + Y, i, -80 + Y, DARK);
  // 왕관: 결재선
  g.poly([[-12, -107 + Y], [12, -107 + Y], [15, -120 + Y], [8, -112 + Y], [0, -122 + Y], [-8, -112 + Y], [-15, -120 + Y]], (x) => GOLD[x < -2 ? 2 : x > 6 ? 0 : 1]);
  // 끝없는 보고서: 손에서 아래로 늘어져 펄럭이는 두루마리
  const hx = -40, hy = -62 + Y;
  g.tube([[-20, -70 + Y], [hx, hy]], 4, (u, v) => ROBE[v > 0.6 ? 1 : 3]);
  for (let i = 0; i < 64; i++) {
    const y = hy + i, wob = Math.sin(i * 0.2 - a * 2) * (1.5 + i * 0.09);
    for (let j = -6; j <= 6; j++) {
      const c = Math.abs(j) === 6 ? PAPER2 : i % 5 === 0 && Math.abs(j) < 5 ? LINE : PAPER;
      g.set(hx + wob + j, y, c);
    }
  }
  g.shade(hx - 8, hy - 3, hx + 8, hy + 3, (x) => (x < hx ? PAPER : PAPER2));
  ball(g, hx, hy, 5, 5, BONE);
  // 지팡이
  const sx = 40, sy = -92 + Y;
  g.line(sx, sy, sx + 2, 8 + Y, hex("#3c2413"));
  g.line(sx + 1, sy, sx + 3, 8 + Y, hex("#6f4522"));
  g.tube([[20, -70 + Y], [sx, -60 + Y]], 4, (u, v) => ROBE[v > 0.6 ? 1 : 3]);
  ball(g, sx, -60 + Y, 5, 5, BONE);
  g.ellipse(sx + 1, sy - 2, 7, 7, (nx, ny) => ballShade(ROBE, nx, ny, 0.25));
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  // 빛나는 눈과 불꽃
  const fl = 0.7 + 0.3 * Math.sin(t * 11);
  p.dot(-6, -96 + Y, EYE); p.dot(6, -96 + Y, EYE); p.dot(-5, -96 + Y, EYE); p.dot(5, -96 + Y, EYE);
  p.glow(-6, -96 + Y, 9, EYE, 0.5 * fl);
  p.glow(6, -96 + Y, 9, EYE, 0.5 * fl);
  p.glow(sx + 1, sy - 2, 22, FLAME, 0.55 * fl);
  p.glow(0, -50 + Y, 56, ROBE[3], 0.16);
  if (o.alt) p.rect(-14, -105 + Y, 28, 2, hex("#7df0ff"), 0.9);
  for (let i = 0; i < 6; i++) {
    const u = wrap(t * 0.8 + i / 6, 1), r = 42 + 6 * Math.sin(i * 2.1);
    p.dot(Math.cos(a * 1.4 + i) * r, -50 + Y - u * 40 + Math.sin(i * 3) * 18, FLAME, 1 - u);
  }
  if (o.shield > 0) {
    p.ring(0, -56 + Y, 50, 2, EYE, 0.8 * o.shield);
    p.glowRing(0, -56 + Y, 50, 12, EYE, 0.3 * o.shield);
  }
}

export function drawBack(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  shadow(p, 0, 2, 36 - 2 * Math.sin(a), 4, hex("#050509"), 0.5);
}
