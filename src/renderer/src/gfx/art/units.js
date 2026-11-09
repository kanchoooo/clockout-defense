// 새 일반 유닛 그림: 종이비행기·사무의자·내선전화·복사 로봇·블루스크린 PC.
import { TAU, hex, wrap } from "../../vendor/pixelfx/core/index.js";
import { Grid, ink, shadow, shift, ramp } from "./kit.js";

const mod = (meta, draw, sh) => ({
  meta: { name: meta.name, size: meta.size, origin: meta.origin, duration: meta.duration ?? 1.2, loop: true, fps: 15, options: { seed: 1 } },
  draw,
  drawBack(p) {
    shadow(p, 0, 1, sh, 2, hex("#07070f"), 0.45);
  },
});
const ph = (t, D, o) => (shift(t, D, o.seed) / D) * TAU;
const DARK = hex("#100c16"), WHITE_ = hex("#fbf6e6"), RED = hex("#e2413a"), O0 = hex("#0e0d1b"), O1 = hex("#20223a");

const GP = new Grid(-24, -28, 48, 34);
export const plane = mod({ name: "Paper plane", size: [64, 48], origin: [32, 36], duration: 0.6 }, (p, t, o) => {
  const a = ph(t, 0.6, o), g = GP, Y = -12 + Math.sin(a) * 2;
  g.clear();
  g.poly([[18, Y - 2], [-16, Y - 12], [-8, Y + 1]], hex("#ffffff"));
  g.poly([[18, Y - 2], [-8, Y + 1], [-14, Y + 8]], hex("#c7cbd8"));
  g.poly([[18, Y - 2], [-8, Y + 1], [-6, Y + 3]], hex("#8a8fa3"));
  g.set(-2, Y - 6, RED); g.set(-1, Y - 6, RED); g.set(-2, Y - 5, RED); g.set(-1, Y - 5, RED);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
}, 7);

const FAB = ramp(["#101a33", "#20335e", "#35558f", "#5c80bd"]);
const GC = new Grid(-22, -46, 44, 50);
export const chair = mod({ name: "Runaway chair", size: [64, 64], origin: [32, 54], duration: 0.6 }, (p, t, o) => {
  const a = ph(t, 0.6, o), g = GC, tilt = Math.sin(a) * 1.2;
  g.clear();
  for (const s of [-1, 0, 1]) {
    g.line(0, -10, s * 15, -3, hex("#3a4258"));
    g.ellipse(s * 15, -2, 3, 3, hex("#14161f"));
    g.set(s * 15 + Math.round(Math.cos(a * 2) * 1.5), -2 + Math.round(Math.sin(a * 2) * 1.5), hex("#9aa6ba"));
  }
  g.shade(-2, -16, 2, -9, () => hex("#6e7a90"));
  g.shade(-15, -21, 15, -15, (x) => FAB[x < -5 ? 3 : x > 7 ? 1 : 2]);
  g.shade(-13 + tilt, -44, 13 + tilt, -22, (x, y) => (Math.abs(x - tilt) > 11.5 && (y < -42 || y > -24) ? 0 : FAB[x - tilt < -5 ? 3 : x - tilt > 6 ? 1 : 2]));
  for (const s of [-1, 1]) {
    g.shade(s * 5 - 3 + tilt, -37, s * 5 + 3 + tilt, -32, () => RED);
    g.line(s * 1 + tilt, -38, s * 9 + tilt, -41, DARK);
  }
  g.shade(-6 + tilt, -28, 6 + tilt, -26, () => DARK);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
}, 14);

const PB = ramp(["#5a1218", "#9c2228", "#d6443e", "#f47a64"]);
const GH = new Grid(-20, -38, 40, 44);
export const phone = mod({ name: "Ringing phone", size: [60, 60], origin: [30, 50], duration: 0.5 }, (p, t, o) => {
  const a = ph(t, 0.5, o), g = GH, ring = Math.sin(a * 3) * 2.2;
  g.clear();
  for (const s of [-1, 1]) g.shade(s * 8 - 3, -5, s * 8 + 3, 0, () => hex("#20223a"));
  g.poly([[-15, -4], [15, -4], [11, -22], [-11, -22]], (x) => PB[x < -4 ? 3 : x > 6 ? 1 : 2]);
  g.ellipse(0, -13, 7, 7, WHITE_);
  for (let i = 0; i < 8; i++) { const v = (i / 8) * TAU; g.set(Math.cos(v) * 4.6, -13 + Math.sin(v) * 4.6, DARK); }
  g.tube([[-15 + ring, -26], [ring, -29], [15 + ring, -26]], 3.2, PB[3]);
  g.shade(-18 + ring, -28, -11 + ring, -22, () => PB[1]);
  g.shade(11 + ring, -28, 18 + ring, -22, () => PB[1]);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  const u = wrap(t * 3, 1);
  for (const s of [-1, 1]) p.ring(s * 22, -30, 3 + u * 6, 1, hex("#ffd23c"), 1 - u);
}, 12);

const ST = ramp(["#3a3f52", "#6a7188", "#a0a8bc", "#d6dcea"]);
const GB = new Grid(-22, -40, 44, 46);
export const copybot = mod({ name: "Copy bot", size: [64, 60], origin: [32, 50], duration: 0.9 }, (p, t, o) => {
  const a = ph(t, 0.9, o), g = GB, step = Math.sin(a) * 3, bob = Math.round(Math.abs(Math.sin(a)) * 1.4);
  g.clear();
  g.shade(-11 - step, -9, -6 - step, 0, () => ST[0]);
  g.shade(6 + step, -9, 11 + step, 0, () => ST[0]);
  g.shade(-18, -32 + bob, 18, -8 + bob, (x, y) => ST[y > -13 + bob ? 0 : x < -7 ? 3 : x > 9 ? 1 : 2]);
  g.shade(-19, -36 + bob, 19, -32 + bob, () => ST[3]);
  g.shade(-12, -28 + bob, 12, -20 + bob, () => hex("#14161f"));
  for (const s of [-1, 1]) g.shade(s * 6 - 3, -26 + bob, s * 6 + 3, -22 + bob, () => (wrap(t * 2, 1) < 0.85 ? hex("#7fdcff") : hex("#14161f")));
  const L = 3 + wrap(t * 1.1, 1) * 8;
  g.shade(-8, -13 + bob, 8, -13 + bob + L, (x, y) => ((y | 0) % 3 === 0 ? hex("#8c8778") : WHITE_));
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
}, 15);

const BE = ramp(["#6b6350", "#a39a80", "#cfc6a8", "#ece4cc"]);
const GC2 = new Grid(-24, -46, 48, 52);
export const pc = mod({ name: "BSOD PC", size: [64, 68], origin: [32, 58], duration: 1.1 }, (p, t, o) => {
  const a = ph(t, 1.1, o), g = GC2, step = Math.sin(a) * 3, bob = Math.round(Math.abs(Math.sin(a)) * 1.6);
  g.clear();
  g.shade(-10 - step, -8, -5 - step, 0, () => BE[0]);
  g.shade(5 + step, -8, 10 + step, 0, () => BE[0]);
  g.shade(-14, -12 + bob, 14, -7 + bob, (x) => BE[x < 0 ? 2 : 1]);
  g.shade(-20, -44 + bob, 20, -12 + bob, (x) => BE[x < -10 ? 3 : x > 12 ? 1 : 2]);
  g.shade(-16, -40 + bob, 16, -17 + bob, () => hex("#1f55c8"));
  // 슬픈 얼굴과 오류 글자
  for (const s of [-1, 1]) g.shade(s * 6 - 1, -36 + bob, s * 6 + 1, -33 + bob, () => WHITE_);
  for (let x = -6; x <= 6; x++) g.set(x, -27 + bob - Math.round((1 - (x * x) / 36) * 3), WHITE_);
  g.line(-12, -21 + bob, 8, -21 + bob, hex("#a8c4ff"));
  g.line(-12, -19 + bob, 2, -19 + bob, hex("#a8c4ff"));
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  p.glow(0, -28 + bob, 18, hex("#3f7fff"), 0.3);
}, 15);
