// pixelfx 이펙트 모음 + 게임 전용 짧은 이펙트(번개선·냉기 고리·결재 도장·사직서 폭풍).
import { hex, rng, bolt, clamp, TAU, WHITE, burst, fly } from '@/vendor/pixelfx/core/index.js'
import * as arrow from '@/vendor/pixelfx/fx/projectiles/arrow.js'
import * as energyDisc from '@/vendor/pixelfx/fx/projectiles/energy-disc.js'
import * as laserBolt from '@/vendor/pixelfx/fx/projectiles/laser-bolt.js'
import * as plasmaShot from '@/vendor/pixelfx/fx/projectiles/plasma-shot.js'
import * as rocket from '@/vendor/pixelfx/fx/projectiles/rocket.js'
import * as iceLance from '@/vendor/pixelfx/fx/ice/ice-lance.js'
import * as snowflakeBurst from '@/vendor/pixelfx/fx/ice/snowflake-burst.js'
import * as fireball from '@/vendor/pixelfx/fx/fire/fireball.js'
import * as flamethrower from '@/vendor/pixelfx/fx/fire/flamethrower.js'
import * as voidOrb from '@/vendor/pixelfx/fx/shadow/void-orb.js'
import * as darkExplosion from '@/vendor/pixelfx/fx/shadow/dark-explosion.js'
import * as poisonCloud from '@/vendor/pixelfx/fx/nature/poison-cloud.js'
import * as sporeBurst from '@/vendor/pixelfx/fx/nature/spore-burst.js'
import * as smite from '@/vendor/pixelfx/fx/holy/smite.js'
import * as healAoe from '@/vendor/pixelfx/fx/holy/heal-aoe.js'
import * as featherBurst from '@/vendor/pixelfx/fx/holy/feather-burst.js'
import * as zapHit from '@/vendor/pixelfx/fx/lightning/zap-hit.js'
import * as lightningStrike from '@/vendor/pixelfx/fx/lightning/lightning-strike.js'
import * as hitSpark from '@/vendor/pixelfx/fx/impacts/hit-spark.js'
import * as bluntHit from '@/vendor/pixelfx/fx/impacts/blunt-hit.js'
import * as critHit from '@/vendor/pixelfx/fx/impacts/crit-hit.js'
import * as smallExplosion from '@/vendor/pixelfx/fx/explosions/small-explosion.js'
import * as plasmaExplosion from '@/vendor/pixelfx/fx/explosions/plasma-explosion.js'
import * as fireworkBurst from '@/vendor/pixelfx/fx/explosions/firework-burst.js'
import * as bigExplosion from '@/vendor/pixelfx/fx/explosions/big-explosion.js'
import * as poof from '@/vendor/pixelfx/fx/spawn/poof.js'
import * as spawnPortal from '@/vendor/pixelfx/fx/spawn/spawn-portal.js'
import * as shatterDeath from '@/vendor/pixelfx/fx/spawn/shatter-death.js'
import * as confetti from '@/vendor/pixelfx/fx/ui/confetti.js'
import * as levelUp from '@/vendor/pixelfx/fx/ui/level-up.js'
import * as collectBurst from '@/vendor/pixelfx/fx/pickups/collect-burst.js'

export const FX = {
  arrow, energyDisc, laserBolt, plasmaShot, rocket, iceLance, snowflakeBurst, fireball, flamethrower, voidOrb, darkExplosion, poisonCloud, sporeBurst, smite, healAoe, featherBurst, zapHit, lightningStrike,
  hitSpark, bluntHit, critHit, smallExplosion, plasmaExplosion, fireworkBurst, bigExplosion, poof, spawnPortal, shatterDeath, confetti, levelUp, collectBurst
}

/** 커피색 불 */
export const COFFEE = ['#1a0d08', '#3d2013', '#70401f', '#a8642c', '#e09a42', '#ffd08a', '#fff0cf']
export const ICE_PAL = ['#0c1430', '#162c5c', '#1f4f94', '#2f7fcc', '#58b4ec', '#9bdcff', '#d8f4ff', '#ffffff']
export const PAPER_PAL = ['#3a3a48', '#6d6d7d', '#a9a9b6', '#d8d8df', '#f2f2f6', '#ffffff']
export const CARD_PAL = ['#2a1c08', '#6e4310', '#c48412', '#f0b424', '#ffe066', '#fff6c4', '#ffffff']
export const EYE_PAL = ['#0d1a0c', '#173a14', '#265e18', '#3f8a1e', '#6cb82a', '#a8e04a', '#e0ff8a']
export const LICH_PAL = ['#140a26', '#2b1252', '#481c88', '#6b2cc0', '#9a48ec', '#c684ff', '#ecc8ff', '#ffffff']

// ───────── 번개선: 두 점 사이를 지그재그로 잇는다 ─────────
export const boltFx = {
  meta: { name: 'bolt', size: [480, 300], origin: [0, 0], duration: 0.2, loop: false, fps: 30, options: { pts: [] as [number, number][], color: '#7cc8ff', seed: 1 } },
  draw(p: any, t: number, o: { pts: [number, number][]; color: string; seed: number }): void {
    const k = clamp(1 - t / 0.2)
    const r = rng(o.seed, Math.floor(t * 40))
    const C = hex(o.color)
    for (let i = 1; i < o.pts.length; i++) {
      const [x0, y0] = o.pts[i - 1]
      const [x1, y1] = o.pts[i]
      const path = bolt(r, x0, y0, x1, y1, { jag: 0.2, depth: 4 })
      p.polyline(path, k > 0.5 ? WHITE : C, 1)
      for (let j = 0; j < path.length - 1; j += 2) p.glow(path[j][0], path[j][1], 9, C, 0.5 * k)
    }
  }
}

// ───────── 에어컨: 퍼져 나가는 찬 고리 ─────────
export const coldRing = {
  meta: { name: 'cold ring', size: [320, 240], origin: [0, 0], duration: 0.6, loop: false, fps: 30, options: { r: 90, seed: 1 } },
  draw(p: any, t: number, o: { r: number; seed: number }): void {
    const q = clamp(t / 0.6)
    const R = o.r * (1 - Math.pow(1 - q, 2.5))
    const k = 1 - q
    const C = hex('#9bdcff')
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * TAU
      p.dot(Math.cos(a) * R, Math.sin(a) * R * 0.7, C, 0.9 * k)
      p.dot(Math.cos(a) * (R - 2), Math.sin(a) * (R - 2) * 0.7, WHITE, 0.7 * k)
    }
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU
      p.glow(Math.cos(a) * R, Math.sin(a) * R * 0.7, 10, C, 0.2 * k)
      if (i % 3 === 0) p.dot(Math.cos(a + 0.1) * R * 0.86, Math.sin(a + 0.1) * R * 0.6, WHITE, k)
    }
  }
}

// ───────── 결재 도장: 쾅! 찍히고 잠깐 남았다 사라진다 ─────────
export interface Mask {
  w: number
  h: number
  data: Uint8Array
}

export function textMask(text: string, font: string): Mask {
  const c = document.createElement('canvas')
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.font = font
  const m = g.measureText(text)
  c.width = Math.ceil(m.width) + 2
  c.height = 16
  g.font = font
  g.textBaseline = 'top'
  g.fillStyle = '#fff'
  g.fillText(text, 1, 2)
  const img = g.getImageData(0, 0, c.width, c.height).data
  const data = new Uint8Array(c.width * c.height)
  for (let i = 0; i < data.length; i++) data[i] = img[i * 4 + 3] > 110 ? 1 : 0
  return { w: c.width, h: c.height, data }
}

let stampMask: Mask | null = null
export function prepareMasks(): void {
  stampMask = textMask('반려', "11px 'Galmuri11'")
}

export const stampFx = {
  meta: { name: 'stamp', size: [120, 120], origin: [0, 0], duration: 0.7, loop: false, fps: 30, options: { r: 36, angle: -0.2 } },
  draw(p: any, t: number, o: { r: number }): void {
    const RED = hex('#ec3a35')
    const slam = clamp(t / 0.07)
    const fade = t < 0.4 ? 1 : clamp(1 - (t - 0.4) / 0.3)
    const R = o.r * (1.5 - slam * 0.5)
    p.ring(0, 0, R, 2, RED, fade)
    p.ring(0, 0, R - 5, 1, RED, fade)
    if (t < 0.12) p.glowRing(0, 0, R, 16, RED, 0.6 * (1 - t / 0.12))
    if (stampMask) {
      const k = 2
      for (let my = 0; my < stampMask.h; my++)
        for (let mx = 0; mx < stampMask.w; mx++)
          if (stampMask.data[my * stampMask.w + mx]) p.rect((mx - stampMask.w / 2) * k, (my - stampMask.h / 2) * k, k, k, RED, fade)
    }
  }
}

// ───────── 사직서: 화면 가득 종이가 흩날린다 ─────────
export const paperStorm = {
  meta: { name: 'paper storm', size: [480, 300], origin: [0, 0], duration: 1.6, loop: false, fps: 30, options: { seed: 1 } },
  draw(p: any, t: number, o: { seed: number }): void {
    const paper = hex('#f6f1e2')
    const line = hex('#8c8778')
    burst(90, o.seed, (r: any) => {
      const a = r.range(0, TAU)
      const sp = r.range(80, 420)
      const [x, y] = fly(0, -40, Math.cos(a) * sp, Math.sin(a) * sp - 60, t, 180, 1.1)
      const k = clamp((1.6 - t) * 2)
      const flip = Math.sin(t * r.range(8, 18) + r.range(0, 6)) > 0
      const w = flip ? 7 : 3
      p.rect(x - w / 2, y - 4, w, 9, paper, k)
      if (flip) p.rect(x - 2, y - 1, 4, 1, line, k)
    })
  }
}
