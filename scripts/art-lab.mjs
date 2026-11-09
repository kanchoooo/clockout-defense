// 그림 확인: 게임 전용 그림을 시간 순서로 한 장에 그려 PNG 로 저장한다. 사용법: node scripts/art-lab.mjs 출력.png
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve('src/renderer/src')
const load = (p) => import(pathToFileURL(`${root}/${p}`).href)
const core = await load('vendor/pixelfx/core/index.js')
const out = process.argv[2] ?? 'art-lab.png'
const LIST = [
  ['gfx/art/keep.js', [{ minutes: 9 * 60 + 15 }, { minutes: 14 * 60 + 40, damage: 0.8 }, { minutes: 17 * 60 + 59 }]],
  ['gfx/art/knight.js', [{}]],
  ['gfx/art/golem.js', [{}]],
  ['gfx/art/ogre.js', [{}]],
  ['gfx/art/lich.js', [{}, { shield: 1 }]],
  ['gfx/art/dragon.js', [{}, { enraged: 1 }]]
]
const rows = []
for (const [path, variants] of LIST) {
  const mod = await load(path)
  for (const v of variants) rows.push({ mod, v, name: path.split('/').pop() })
}
const SCALE = 2
const COLS = 4
const cw = Math.max(...rows.map((r) => r.mod.meta.size[0])) * SCALE
const ch = (r) => r.mod.meta.size[1] * SCALE
const W = cw * COLS
const H = rows.reduce((a, r) => a + ch(r) + 4, 0)
const px = new Uint8Array(W * H * 4)
for (let i = 0; i < W * H; i++) (px[i * 4] = 62), (px[i * 4 + 1] = 74), (px[i * 4 + 2] = 92), (px[i * 4 + 3] = 255)
let y0 = 0
for (const r of rows) {
  const [mw, mh] = r.mod.meta.size
  const [ox, oy] = r.mod.meta.origin
  const fx = core.createFx(r.mod, { x: ox, y: oy, ...r.v })
  const dur = r.mod.meta.duration
  for (let c = 0; c < COLS; c++) {
    fx.update(dur / COLS)
    const fr = core.createFrame(mw, mh)
    core.clearFrame(fr)
    fx.draw(fr)
    const img = new Uint8ClampedArray(mw * mh * 4)
    core.composite(fr, img, (255 << 24) | (92 << 16) | (74 << 8) | 62)
    for (let y = 0; y < mh * SCALE; y++)
      for (let x = 0; x < mw * SCALE; x++) {
        const s = (Math.floor(y / SCALE) * mw + Math.floor(x / SCALE)) * 4
        const d = ((y0 + y) * W + c * cw + x) * 4
        px[d] = img[s]; px[d + 1] = img[s + 1]; px[d + 2] = img[s + 2]; px[d + 3] = 255
      }
  }
  y0 += ch(r) + 4
}
const table = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const b = Buffer.concat([Buffer.from(t), d]); const e = Buffer.alloc(4); e.writeUInt32BE(crc(b)); return Buffer.concat([l, b, e]) }
const raw = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) Buffer.from(px.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1)
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
console.log(`${W}x${H} → ${out}`)
