// 시계탑 요새. 시계 바늘이 게임 시각을 가리키고, 멘탈이 깎이면 금이 가고 연기가 난다.
import { clamp, rand, TAU, hex, WHITE } from "../../vendor/pixelfx/core/index.js";
import { Grid, ramp, ink } from "./kit.js";

export const meta = {
  name: "Clock keep",
  size: [120, 150],
  origin: [60, 138],
  duration: 2.4,
  loop: true,
  fps: 15,
  options: { minutes: 540, damage: 0 },
};

const STONE = ramp(["#232338", "#33344e", "#474a68", "#606485", "#7e83a3", "#a3a8c2"]);
const SLATE = ramp(["#182040", "#243464", "#31508e", "#4470b4", "#6c9ad6"]);
const GOLD = ramp(["#6e4310", "#b0741a", "#e9ae2e", "#ffe27a"]);
const WOOD = ramp(["#2a170e", "#4b2a16", "#70431f", "#96602e"]);
const OUT0 = hex("#0d0d1c"), OUT1 = hex("#181a30");
const FACE = hex("#f6edd2"), FACE2 = hex("#d8caa6"), HAND = hex("#2b2233"), RED = hex("#e2413a");
const GLOW = hex("#ffbb5c"), WIN = hex("#ffd67a"), WIN2 = hex("#ff9d3d");
const FLAG = ramp(["#7a1a26", "#c02f3a", "#ee5a55"]);

const G = new Grid(-44, -140, 88, 146);

// 원통형 벽돌: x 위치로 명암, 줄눈은 층마다 어긋난다
function bricks(g, x0, y0, x1, y1, seed) {
  const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2;
  g.shade(x0, y0, x1, y1, (x, y) => {
    const u = (x - cx) / hw;
    const row = Math.floor((y - y0) / 5);
    const off = row % 2 ? 0 : 4;
    const mortar = ((Math.floor(y - y0) % 5) === 4) || ((Math.floor(x + off) % 8) === 0);
    let l = 0.62 - u * 0.42 - u * u * 0.18;
    l += (rand(Math.floor((x + off) / 8), row, seed) - 0.5) * 0.14;
    if (mortar) l -= 0.2;
    return STONE[clamp(Math.floor(l * STONE.length), 0, STONE.length - 1)];
  });
}

function drawCracks(g, k) {
  const n = Math.floor(k * 9);
  const dark = hex("#14121f");
  for (let i = 0; i < n; i++) {
    let x = -15 + rand(i, 3) * 30, y = -22 - rand(i, 5) * 40;
    const len = 4 + rand(i, 9) * 8;
    for (let s = 0; s < len; s++) {
      g.set(x, y, dark);
      x += rand(i, s, 1) < 0.5 ? -1 : 1;
      y += 1;
    }
  }
}

let builtKey = "";

function build(o) {
  const g = G;
  g.clear();
  // 받침 돌계단
  g.shade(-34, -9, 34, 2, (x, y) => {
    const nx = x / 34, ny = (y + 4) / 6.5;
    if (nx * nx + ny * ny > 1) return 0;
    return STONE[clamp(Math.floor((0.55 - nx * 0.35 + (ny > 0.3 ? -0.25 : 0.08)) * STONE.length), 0, 5)];
  });
  g.shade(-27, -14, 27, -3, (x, y) => {
    const nx = x / 27, ny = (y + 8) / 6;
    if (nx * nx + ny * ny > 1) return 0;
    return STONE[clamp(Math.floor((0.62 - nx * 0.35 + (ny > 0.25 ? -0.25 : 0.1)) * STONE.length), 0, 5)];
  });
  // 몸통
  bricks(g, -17, -74, 17, -8, 3);
  // 문: 아치 + 따뜻한 빛
  g.shade(-7, -26, 7, -7, (x, y) => {
    const top = -19, r = 7;
    if (y < top && (x * x) / (r * r) + ((y - top) * (y - top)) / (r * r) > 1) return 0;
    return WOOD[clamp(Math.floor(2.2 - x * 0.12 + (Math.floor(x + 7) % 4 === 0 ? -1 : 0)), 0, 3)];
  });
  g.line(-8, -7, -8, -19, STONE[1]); g.line(8, -7, 8, -19, STONE[1]);
  g.set(4, -15, GOLD[3]); g.set(4, -14, GOLD[2]);
  // 창문
  for (const [wx, wy] of [[-9, -46], [9, -46], [0, -60]]) {
    g.shade(wx - 3, wy - 5, wx + 3, wy + 4, (x, y) => {
      const dx = x - wx;
      if (y < wy - 2 && dx * dx + (y - (wy - 2)) * (y - (wy - 2)) > 11) return 0;
      if (Math.abs(dx) >= 2.9 || y > wy + 3.6) return STONE[0];
      return y > wy + 0.5 ? WIN2 : WIN;
    });
    g.line(wx, wy - 4, wx, wy + 3, STONE[0]);
  }
  // 시계 칸
  g.shade(-23, -105, 23, -70, (x, y) => {
    const u = x / 23;
    const band = y > -74 || y < -102;
    let l = 0.66 - u * 0.4 - u * u * 0.16;
    if (band) l += 0.16;
    if (x > 21.5 || x < -21.5) l -= 0.1;
    return STONE[clamp(Math.floor(l * STONE.length), 0, 5)];
  });
  g.shade(-25, -107, 25, -103, (x, y) => STONE[clamp(Math.floor((0.8 - (x / 25) * 0.4 + (y > -104 ? -0.3 : 0)) * 6), 0, 5)]);
  g.shade(-25, -72, 25, -69, (x, y) => STONE[clamp(Math.floor((0.72 - (x / 25) * 0.4 + (y > -70 ? -0.3 : 0)) * 6), 0, 5)]);
  // 시계판
  const cy = -87, R = 15;
  g.ellipse(0, cy, R + 2, R + 2, (nx, ny) => GOLD[clamp(Math.floor(2 - nx * 1.2 - ny * 1.4), 0, 3)]);
  g.ellipse(0, cy, R, R, (nx, ny) => (nx + ny > 0.9 ? FACE2 : FACE));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, big = i % 3 === 0;
    for (let d = R - (big ? 4 : 2.5); d <= R - 1; d += 0.5) g.set(Math.sin(a) * d, cy - Math.cos(a) * d, big ? HAND : FACE2 === 0 ? HAND : hex("#8a7d6a"));
  }
  const mins = o.minutes;
  const ma = ((mins % 60) / 60) * TAU, ha = ((mins % 720) / 720) * TAU;
  const closing = mins >= 17 * 60 + 30;
  g.line(0, cy, Math.sin(ha) * 7.5, cy - Math.cos(ha) * 7.5, HAND);
  g.line(1, cy, 1 + Math.sin(ha) * 7.5, cy - Math.cos(ha) * 7.5, HAND);
  g.line(0, cy, Math.sin(ma) * 12, cy - Math.cos(ma) * 12, closing ? RED : HAND);
  g.ellipse(0.5, cy + 0.5, 1.6, 1.6, GOLD[2]);
  // 지붕
  g.poly([[-27, -106], [27, -106], [0, -134]], (x, y) => {
    const u = x / 27;
    const row = Math.floor((y + 134) / 4);
    let l = 0.58 - u * 0.5 + (((Math.floor(x + (row % 2 ? 2 : 0)) % 4) === 0) ? -0.12 : 0) + ((Math.floor(y + 134) % 4) === 3 ? -0.14 : 0);
    return SLATE[clamp(Math.floor(l * SLATE.length), 0, 4)];
  });
  g.shade(-1, -139, 1, -131, () => GOLD[2]);
  g.set(-1, -139, GOLD[3]);
  if (o.damage > 0.2) drawCracks(g, o.damage);
  ink(g, OUT0, OUT1);
}

export function draw(p, t, o) {
  // 시계탑 몸은 시각(분)이나 금 간 정도가 바뀔 때만 다시 그린다
  const key = Math.floor(o.minutes) + "|" + Math.floor(o.damage * 9);
  if (key !== builtKey) {
    build(o);
    builtKey = key;
  }
  G.draw(p, 1, 0, 0);
  // 깃발
  for (let i = 0; i < 12; i++) {
    const wave = Math.sin(t * 7 - i * 0.7) * (1 + i * 0.12);
    const top = -139 + Math.round(wave);
    for (let j = 0; j < 7 - Math.floor(i / 3); j++) p.dot(2 + i, top + j, FLAG[j === 0 ? 2 : i % 3 === 0 ? 0 : 1]);
  }
  const flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 4.3);
  const cy = -87;
  const closing = o.minutes >= 17 * 60 + 30;
  // 빛
  p.glow(0, -46, 26, GLOW, 0.17 * flick);
  p.glow(0, -14, 20, GLOW, 0.2 * flick);
  p.glow(0, cy, 34, hex("#fff2c0"), 0.12);
  if (closing) p.glow(0, cy, 22, RED, 0.2 + 0.14 * Math.sin(t * 8));
}
