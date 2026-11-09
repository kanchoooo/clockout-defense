// 결재판 기사: 갑옷을 입고 결재판을 방패처럼 든 졸병.
import { TAU, hex } from "../../vendor/pixelfx/core/index.js";
import { Grid, ball, ink, shadow, shift, ramp } from "./kit.js";

export const meta = { name: "Clipboard knight", size: [64, 64], origin: [32, 56], duration: 1.2, loop: true, fps: 15, options: { seed: 1 } };

const ARMOR1 = ramp(["#2b3047", "#47506e", "#6d7a9a", "#a2afca", "#dfe6f3"]);
const CLOTH1 = ramp(["#3a1420", "#6e2332", "#a83a42"]);
const ARMOR2 = ramp(["#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe9a0"]);
const CLOTH2 = ramp(["#101a3a", "#1f3370", "#3a5cb0"]);
const BOARD = ramp(["#3c2413", "#6f4522", "#9c6a37"]);
const PAPER = hex("#f4eedc"), LINE = hex("#8c8778"), CLIP = hex("#c9cfdb"), RED = hex("#e2413a");
const O0 = hex("#0e0d1b"), O1 = hex("#20223a");
const G = new Grid(-22, -44, 44, 50);

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  const bob = Math.round(Math.abs(Math.sin(a)) * 1.4), step = Math.sin(a) * 3;
  const g = G, ARMOR = o.alt ? ARMOR2 : ARMOR1, CLOTH = o.alt ? CLOTH2 : CLOTH1;
  g.clear();
  // 다리
  g.shade(-6 - step, -11, -2 - step, 0, () => ARMOR[1]);
  g.shade(2 + step, -11, 6 + step, 0, () => ARMOR[2]);
  g.shade(-7 - step, -2, -1 - step, 0, () => ARMOR[0]);
  g.shade(1 + step, -2, 7 + step, 0, () => ARMOR[0]);
  // 몸·망토
  g.poly([[-9, -26 + bob], [9, -26 + bob], [11, -9 + bob], [-11, -9 + bob]], (x, y) => CLOTH[x < -3 ? 2 : x > 5 ? 0 : 1]);
  ball(g, 0, -20 + bob, 9, 9, ARMOR);
  // 머리 (투구)
  ball(g, 0, -33 + bob, 8, 8.5, ARMOR, 0.08);
  g.shade(-6, -34 + bob, 6, -31 + bob, (x) => hex("#141424"));
  g.set(-3, -33 + bob, RED); g.set(-2, -33 + bob, RED); g.set(3, -33 + bob, RED); g.set(4, -33 + bob, RED);
  for (let i = 0; i < 6; i++) g.set(-1 + (i % 2), -42 + bob + i, CLOTH[2]);
  // 결재판 방패
  const sy = -27 + bob;
  g.shade(5, sy, 20, sy + 20, (x, y) => BOARD[x > 18 || y > sy + 18 ? 0 : x < 7 ? 2 : 1]);
  g.shade(7, sy + 2, 18, sy + 18, () => PAPER);
  for (let i = 0; i < 4; i++) g.line(9, sy + 6 + i * 3, 16 - (i % 2) * 2, sy + 6 + i * 3, LINE);
  g.shade(10, sy - 2, 15, sy + 1, () => CLIP);
  // 빨간 도장
  g.ellipse(14.5, sy + 14, 2.6, 2.6, RED);
  g.ellipse(14.5, sy + 14, 1.2, 1.2, PAPER);
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
}

export function drawBack(p) {
  shadow(p, 0, 0, 13, 2, hex("#07070f"), 0.5);
}
