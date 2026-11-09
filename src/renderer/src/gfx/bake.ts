// 몬스터 애니메이션을 시작할 때 한 번 프레임으로 구워 둔다. 매 프레임 다시 계산하지 않아서 수십 마리가 나와도 가볍다.
import { clearFrame, createFrame, createFx } from '@/vendor/pixelfx/core/index.js'
import * as wisp from '@/vendor/pixelfx/fx/critters/wisp.js'
import * as bat from '@/vendor/pixelfx/fx/critters/bat.js'
import * as frog from '@/vendor/pixelfx/fx/critters/frog.js'
import * as slime from '@/vendor/pixelfx/fx/critters/slime.js'
import * as ghost from '@/vendor/pixelfx/fx/critters/ghost.js'
import * as snake from '@/vendor/pixelfx/fx/critters/snake.js'
import * as eyeball from '@/vendor/pixelfx/fx/critters/eyeball.js'
import * as skull from '@/vendor/pixelfx/fx/critters/flying-skull.js'
import * as jelly from '@/vendor/pixelfx/fx/critters/jellyfish.js'
import * as butterfly from '@/vendor/pixelfx/fx/critters/butterfly.js'
import * as bird from '@/vendor/pixelfx/fx/critters/bird.js'
import * as bosses from './art/bosses.js'
import * as units from './art/units.js'
import * as knight from './art/knight.js'
import * as golem from './art/golem.js'
import * as ogre from './art/ogre.js'
import * as lich from './art/lich.js'
import * as dragon from './art/dragon.js'
import type { SpriteId } from '@/game/defs'

export interface BakedFrame {
  x0: number
  y0: number
  w: number
  h: number
  c: Uint32Array
  l: Uint32Array
}

export interface Baked {
  frames: BakedFrame[]
  fps: number
}

type Mod = { meta: { size: number[]; origin: number[]; duration: number; loop?: boolean } }

/** 빛이 이보다 약한 칸은 잘라서 버린다 (번짐이 넓어도 그릴 칸 수를 줄임) */
const LIGHT_CUT = 20

function bakeOne(mod: Mod, opts: Record<string, unknown>, fps: number): Baked {
  const [w, h] = mod.meta.size
  const [ox, oy] = mod.meta.origin
  const n = Math.max(1, Math.round(mod.meta.duration * fps))
  const fx = createFx(mod, { x: ox, y: oy, ...opts })
  const frame = createFrame(w, h)
  const frames: BakedFrame[] = []
  // 시뮬레이션형이 자리 잡도록 한 바퀴 먼저 돌린다
  fx.update(mod.meta.duration)
  for (let f = 0; f < n; f++) {
    fx.update(1 / fps)
    clearFrame(frame)
    fx.draw(frame)
    let x0 = w
    let y0 = h
    let x1 = -1
    let y1 = -1
    for (let i = 0; i < w * h; i++) {
      const lit = frame.light[i] & 0xffffff
      const on = frame.color[i] >>> 24 > 0 || (lit & 255) > LIGHT_CUT || ((lit >> 8) & 255) > LIGHT_CUT || ((lit >> 16) & 255) > LIGHT_CUT
      if (!on) continue
      const x = i % w
      const y = (i - x) / w
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
    if (x1 < x0) {
      frames.push({ x0: 0, y0: 0, w: 0, h: 0, c: new Uint32Array(0), l: new Uint32Array(0) })
      continue
    }
    const cw = x1 - x0 + 1
    const ch = y1 - y0 + 1
    const c = new Uint32Array(cw * ch)
    const l = new Uint32Array(cw * ch)
    for (let y = 0; y < ch; y++) {
      const from = (y + y0) * w + x0
      c.set(frame.color.subarray(from, from + cw), y * cw)
      l.set(frame.light.subarray(from, from + cw), y * cw)
    }
    frames.push({ x0: x0 - ox, y0: y0 - oy, w: cw, h: ch, c, l })
  }
  return { frames, fps }
}

const RECIPES: Record<SpriteId, [Mod, Record<string, unknown>]> = {
  wisp: [wisp, { hover: 14, light: 0.55 }],
  bat: [bat, { light: 0.5 }],
  frog: [frog, { light: 0.4 }],
  slime: [slime, { hop: 12, light: 0.32 }],
  ghost: [ghost, { hover: 8, light: 0.3 }],
  snake: [snake, { light: 0.4 }],
  eyeball: [eyeball, { hover: 16, light: 0.35 }],
  skull: [skull, { hover: 14, floor: false, light: 0.4 }],
  jelly: [jelly, { light: 0.35 }],
  knight: [knight, {}],
  golem: [golem, { light: 0.7 }],
  mailRed: [wisp, { hover: 14, light: 0.55, palette: ['#2a0610', '#5a0f1c', '#a01f28', '#dd3a35', '#ff7a55', '#ffc48a', '#fff0d8'] }],
  butterfly: [butterfly, { light: 0.4, palette: ['#1a1436', '#3a2a70', '#5e45a8', '#8a6ad8', '#b896ee', '#dcc6ff', '#ffffff'] }],
  bird: [bird, { light: 0.3, palette: ['#20242e', '#3a4150', '#5e6778', '#8a93a4', '#b8c0cc', '#dfe4ec', '#ffffff'] }],
  plane: [units.plane, {}],
  chair: [units.chair, {}],
  phone: [units.phone, {}],
  slimeBlue: [slime, { hop: 12, light: 0.32, palette: ['#0a1838', '#123068', '#1c5aa0', '#2f8ad0', '#62c0ec', '#a6e6ff', '#ecfbff'] }],
  frogGold: [frog, { light: 0.4, palette: ['#3a2406', '#6e4410', '#a8701a', '#dca22a', '#f6cc50', '#ffe88c', '#fffbd8'] }],
  ghostRed: [ghost, { hover: 8, light: 0.3, palette: ['#2a0a14', '#5a1626', '#8e2a3a', '#c24a52', '#e88078', '#ffc0ac', '#fff0e8'] }],
  skullBlue: [skull, { hover: 14, floor: false, light: 0.4, palette: ['#050b24', '#0c2058', '#163c94', '#2466cc', '#3f96ec', '#74c4f8', '#a8e4ff', '#dcf6ff', '#ffffff'] }],
  copybot: [units.copybot, {}],
  pc: [units.pc, {}],
  knightGold: [knight, { alt: 1 }],
  golemRed: [golem, { alt: 1, light: 0.7 }],
  ogre: [ogre, {}],
  batlord: [bosses.batlord, {}],
  kingslime: [bosses.kingslime, {}],
  printer: [bosses.printer, {}],
  spider: [bosses.spider, {}],
  vclich: [lich, { alt: 1, light: 0.8 }],
  mimic: [bosses.mimic, {}],
  lich: [lich, { light: 0.8 }],
  phantom: [bosses.phantom, {}],
  auditor: [bosses.auditor, {}],
  partyogre: [ogre, { alt: 1 }],
  hydra: [bosses.hydra, {}],
  reaper: [bosses.reaper, {}],
  alarm: [bosses.alarm, {}],
  dragon: [dragon, {}]
}

export const SPRITE_LIST = Object.keys(RECIPES) as SpriteId[]

/** 그림 하나를 굽는다. 큰 보스가 있어 한 번에 다 하면 수 초 멈추므로 View 가 나눠서 부른다 */
export function bakeSprite(id: SpriteId): Baked {
  const [mod, opts] = RECIPES[id]
  return bakeOne(mod, opts, 15)
}

/** 구운 프레임이 차지하는 메모리 (시험용, MB) */
export function bakedMb(all: Record<string, Baked>): number {
  let n = 0
  for (const b of Object.values(all)) for (const f of b.frames) n += f.c.byteLength + f.l.byteLength
  return Math.round(n / 1048576)
}
