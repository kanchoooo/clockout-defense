// 서류더미 골렘: 쌓인 서류철이 팔다리를 달고 걸어온다.
import { TAU, hex, rand } from "../../vendor/pixelfx/core/index.js";
import { Grid, ink, shadow, shift, ramp } from "./kit.js";

export const meta = { name: "Paper golem", size: [96, 96], origin: [48, 86], duration: 1.8, loop: true, fps: 15, options: { seed: 1 } };

const PAPER1 = ramp(["#7c7566", "#b0a78f", "#dcd2b8", "#f8f1dc"]);
const FOLDER1 = ramp(["#4a3112", "#8a5e20", "#c99436", "#ecc265"]);
const PAPER2 = ramp(["#3a3440", "#625a68", "#8e8590", "#b8aeb6"]);
const FOLDER2 = ramp(["#3a0a14", "#7a1a24", "#b93034", "#e8584c"]);
const TABS = ["#e2413a", "#39a0e8", "#47c27a", "#f0b424"].map(hex);
const EYE = hex("#ff3a30"), EYE2 = hex("#ffd0a0"), DARK = hex("#17141f");
const O0 = hex("#110d15"), O1 = hex("#2c261f");
const G = new Grid(-34, -74, 68, 80);

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed), a = (t / meta.duration) * TAU;
  const bob = Math.round(Math.abs(Math.sin(a)) * 2), step = Math.sin(a) * 5;
  const g = G, PAPER = o.alt ? PAPER2 : PAPER1, FOLDER = o.alt ? FOLDER2 : FOLDER1;
  g.clear();
  // 다리: 서류 묶음
  g.shade(-14 - step, -14, -4 - step, 0, (x, y) => PAPER[(Math.floor(y) & 1) === 0 ? 1 : 0]);
  g.shade(4 + step, -14, 14 + step, 0, (x, y) => PAPER[(Math.floor(y) & 1) === 0 ? 2 : 1]);
  // 몸: 층층이 어긋난 서류철
  const layers = 11;
  for (let i = 0; i < layers; i++) {
    const y = -14 - i * 4.2 + bob, off = Math.round(Math.sin(i * 1.7 + a * 0.5) * 2.4 + (rand(i, 3) - 0.5) * 3);
    const hw = 19 - Math.abs(i - 5) * 0.5, isFolder = i % 3 === 1;
    g.shade(-hw + off, y - 4, hw + off, y, (x, yy) => {
      const edge = yy > y - 1;
      const u = (x - off) / hw;
      if (isFolder) return FOLDER[edge ? 0 : u < -0.4 ? 3 : u > 0.5 ? 1 : 2];
      return PAPER[edge ? 0 : u < -0.3 ? 3 : u > 0.6 ? 1 : 2];
    });
    if (isFolder) g.shade(hw + off - 7, y - 6, hw + off - 2, y - 4, () => TABS[i % 4]);
  }
  // 얼굴: 찡그린 눈과 쪽지 입
  const fy = -40 + bob;
  g.shade(-13, fy - 3, -3, fy + 4, () => DARK);
  g.shade(3, fy - 3, 13, fy + 4, () => DARK);
  g.shade(-10, fy - 1, -6, fy + 2, () => EYE);
  g.shade(6, fy - 1, 10, fy + 2, () => EYE);
  g.set(-9, fy - 1, EYE2); g.set(7, fy - 1, EYE2);
  g.line(-13, fy - 5, -3, fy - 2, DARK); g.line(13, fy - 5, 3, fy - 2, DARK);
  g.shade(-7, fy + 8, 7, fy + 12, () => DARK);
  for (let i = -5; i <= 5; i += 3) g.shade(i, fy + 8, i + 1, fy + 10, () => PAPER[3]);
  // 팔: 말아 쥔 서류 뭉치
  for (const s of [-1, 1]) {
    const sw = Math.sin(a + (s > 0 ? Math.PI : 0)) * 4;
    g.tube([[s * 19, -44 + bob], [s * 26, -34 + bob + sw], [s * 27, -22 + bob + sw]], (u) => 4.2 - u, (u, v) => PAPER[v > 0.7 ? 0 : s < 0 ? 3 : 2]);
    g.ellipse(s * 27, -18 + bob + sw, 5.5, 5, (nx, ny) => PAPER[nx + ny > 0.5 ? 1 : 3]);
  }
  ink(g, O0, O1);
  g.draw(p, 1, 0, 0);
  p.glow(-8, fy, 7, EYE, 0.3);
  p.glow(8, fy, 7, EYE, 0.3);
}

export function drawBack(p) {
  shadow(p, 0, 0, 24, 3, hex("#07070f"), 0.55);
}
