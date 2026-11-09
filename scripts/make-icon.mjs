// 앱 아이콘(build/icon.png 1024)·트레이 아이콘(build/tray.png)을 게임 그림으로 만든다. 사용법: npm run icon
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve('src/renderer/src')
const load = (p) => import(pathToFileURL(`${root}/${p}`).href)
const core = await load('vendor/pixelfx/core/index.js')
const keep = await load('gfx/art/keep.js')

const table = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const b = Buffer.concat([Buffer.from(t), d]); const e = Buffer.alloc(4); e.writeUInt32BE(crc(b)); return Buffer.concat([l, b, e]) }
function png(w, h, px) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) Buffer.from(px.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

// 170×170 도트 판에 시계탑을 그린다
const S = 170
const fx = core.createFx(keep, { x: S / 2, y: 156, minutes: 17 * 60 + 59, damage: 0 })
fx.update(0.4)
const fr = core.createFrame(S, S)
core.clearFrame(fr)
fx.draw(fr)
const SKY_TOP = [255, 142, 84], SKY_BOT = [108, 62, 148]
const bg = new Uint32Array(S * S)
for (let y = 0; y < S; y++) {
  const t = Math.round((y / S) * 9) / 9
  const c = SKY_TOP.map((v, i) => Math.round(v + (SKY_BOT[i] - v) * t))
  for (let x = 0; x < S; x++) bg[y * S + x] = ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0
}
const img = new Uint8ClampedArray(S * S * 4)
core.composite(fr, img, bg)
const K = 6
const OUT = 1024
const OFF = Math.floor((OUT - S * K) / 2)
const R = 180 // macOS 아이콘 둥근 모서리
const big = new Uint8Array(OUT * OUT * 4)
for (let y = 0; y < OUT; y++) {
  for (let x = 0; x < OUT; x++) {
    const inX = Math.min(x, OUT - 1 - x), inY = Math.min(y, OUT - 1 - y)
    const cornerOut = inX < R && inY < R && Math.hypot(R - inX, R - inY) > R
    if (cornerOut) continue
    const sx = Math.max(0, Math.min(S - 1, Math.floor((x - OFF) / K)))
    const sy = Math.max(0, Math.min(S - 1, Math.floor((y - OFF) / K)))
    const i = (sy * S + sx) * 4, o = (y * OUT + x) * 4
    big[o] = img[i]; big[o + 1] = img[i + 1]; big[o + 2] = img[i + 2]; big[o + 3] = 255
  }
}
writeFileSync('build/icon.png', png(OUT, OUT, big))

// 메뉴 막대용 작은 시계
const T = ['................', '......####......', '....##....##....', '...#...#....#...', '..#....#.....#..', '..#....#.....#..', '.#.....#......#.', '.#.....####...#.', '.#............#.', '.#............#.', '..#..........#..', '..#..........#..', '...#........#...', '....##....##....', '......####......', '................']
const tray = new Uint8Array(32 * 32 * 4)
for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
  if (T[y >> 1][x >> 1] !== '#') continue
  const o = (y * 32 + x) * 4
  tray[o] = 255; tray[o + 1] = 210; tray[o + 2] = 60; tray[o + 3] = 255
}
writeFileSync('build/tray.png', png(32, 32, tray))
console.log('build/icon.png · build/tray.png')
