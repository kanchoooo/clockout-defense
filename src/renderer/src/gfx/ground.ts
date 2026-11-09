// 바닥: 사무실 카펫 + 시계탑 둘레 + 책상·화분. 시간에 따라 아침→정오→노을→저녁으로 빛이 변한다.
import { fbm, hex, mix, rand, scale, clearFrame, createFrame, painterFor } from '@/vendor/pixelfx/core/index.js'
import { Grid, ball, ink, ramp } from './art/kit.js'
import { H, ROUNDS, TOWER, W } from '@/game/defs'

const CARPET_A = hex('#39465f')
const CARPET_B = hex('#35415a')
const SPECK = hex('#46567a')
const RING = hex('#4d5a78')
const RING2 = hex('#5c6a8a')
const SEAM = hex('#2d384e')

const STEEL = ramp(['#20263a', '#3a4258', '#5a6480', '#8a94ae'])
const DESK = ramp(['#3a2414', '#5e3b1f', '#86592f', '#a97840'])
const SCREEN = hex('#7fc8ff')
const SCREEN2 = hex('#3a78b8')
const PAPER = hex('#efe8d4')
const LEAF = ramp(['#17401f', '#2a6a30', '#4a9a3e', '#82c850'])
const POT = ramp(['#6a2f1e', '#a24a2c', '#d6743f'])

function drawDesk(frame: unknown, x: number, y: number, flip: boolean): void {
  const g = new Grid(-26, -30, 54, 36)
  g.shade(-24, -12, 24, -6, (_x: number, yy: number) => DESK[yy < -9 ? 3 : 2])
  g.shade(-24, -6, 24, -3, () => DESK[1])
  g.shade(-22, -3, -18, 2, () => DESK[0])
  g.shade(18, -3, 22, 2, () => DESK[0])
  // 모니터
  g.shade(-14, -28, 8, -14, () => STEEL[1])
  g.shade(-12, -26, 6, -16, (xx: number, yy: number) => ((Math.floor(yy) & 3) === 0 ? SCREEN2 : xx < -4 ? SCREEN : SCREEN2))
  g.shade(-5, -14, -1, -11, () => STEEL[0])
  // 서류
  g.shade(12, -14, 21, -11, (_x: number, yy: number) => ((Math.floor(yy) & 1) === 0 ? PAPER : hex('#b9b099')))
  g.shade(-22, -13, -17, -10, () => hex('#e2413a'))
  ink(g, hex('#10101c'), hex('#1b1d30'))
  const p = painterFor(frame)
  p.place(x, y, flip, 0)
  g.draw(p, 1, 0, 0)
}

function drawPlant(frame: unknown, x: number, y: number, seed: number): void {
  const g = new Grid(-14, -32, 28, 36)
  g.poly([[-7, -10], [7, -10], [5, 0], [-5, 0]], (xx: number) => POT[xx < -2 ? 2 : xx > 3 ? 0 : 1])
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.42 + (rand(seed, i) - 0.5) * 0.2
    const L = 14 + rand(seed, i, 2) * 8
    g.tube([[0, -10], [Math.cos(a) * L * 0.6, -10 + Math.sin(a) * L * 0.7], [Math.cos(a) * L, -10 + Math.sin(a) * L + 4]], (u: number) => 3.4 - u * 2.4, LEAF[i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1])
  }
  ball(g, 0, -13, 5, 4, LEAF)
  ink(g, hex('#0c1712'), hex('#14241a'))
  const p = painterFor(frame)
  p.place(x, y, false, 0)
  g.draw(p, 1, 0, 0)
}

/** 라운드별 조명: [밝기 곱, 색 [r,g,b], 얼마나 섞을지] */
function light(round: number): { k: number; tint: number; mix: number; sun: number; sunX: number } {
  const u = Math.min(1, round / (ROUNDS - 1))
  if (u < 0.3) return { k: 1 + u * 0.3, tint: hex('#fff1d0'), mix: 0.05, sun: 0.1, sunX: -80 + u * 200 }
  if (u < 0.65) return { k: 1.1, tint: hex('#ffffff'), mix: 0, sun: 0.12, sunX: 20 + (u - 0.3) * 240 }
  if (u < 0.9) return { k: 1.04 - (u - 0.65) * 0.5, tint: hex('#ffb070'), mix: 0.1 + (u - 0.65) * 0.8, sun: 0.17, sunX: 110 + (u - 0.65) * 260 }
  return { k: 0.78, tint: hex('#5a4a9a'), mix: 0.3, sun: 0.05, sunX: 200 }
}

export function buildGround(round: number): Uint32Array {
  const out = new Uint32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tile = (Math.floor(x / 24) + Math.floor(y / 24)) % 2 === 0
      let c: number = tile ? CARPET_A : CARPET_B
      if (x % 24 === 0 || y % 24 === 0) c = SEAM
      else if (rand(x, y, 3) < 0.05) c = SPECK
      const n = fbm(x * 0.03, y * 0.03, 8, 3)
      if (n > 0.6) c = scale(c, 1.06)
      out[y * W + x] = c
    }
  }
  // 시계탑 둘레의 닳은 자리
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - TOWER.x, (y - TOWER.y) * 1.4)
      if (d < 56) out[y * W + x] = d > 53 ? RING2 : (x + y) % 4 === 0 ? RING2 : RING
    }
  }
  // 소품
  const frame = createFrame(W, H)
  clearFrame(frame)
  drawDesk(frame, 40, 74, false)
  drawDesk(frame, 440, 74, true)
  drawDesk(frame, 46, 280, false)
  drawDesk(frame, 434, 280, true)
  drawPlant(frame, 124, 58, 1)
  drawPlant(frame, 356, 58, 2)
  drawPlant(frame, 20, 170, 3)
  drawPlant(frame, 460, 170, 4)
  for (let i = 0; i < W * H; i++) if (frame.color[i] >>> 24 >= 200) out[i] = frame.color[i]
  // 떨어진 서류 몇 장
  for (let i = 0; i < 22; i++) {
    const px = Math.floor(rand(i, 9) * W)
    const py = Math.floor(30 + rand(i, 11) * (H - 40))
    if (Math.hypot(px - TOWER.x, py - TOWER.y) < 60) continue
    for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) if (px + x < W && py + y < H) out[(py + y) * W + px + x] = y === 2 || y === 0 ? hex('#a9a18c') : PAPER
  }
  // 창으로 들어오는 빛과 시간대 색
  const L = light(round)
  const white = hex('#fff6d8')
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = out[y * W + x]
      c = scale(c, L.k)
      if (L.mix > 0) c = mix(c, L.tint, L.mix)
      const u = x + y * 0.8 - L.sunX
      if (((u % 150) + 150) % 150 < 56) c = mix(c, white, L.sun)
      out[y * W + x] = c
    }
  }
  return out
}
