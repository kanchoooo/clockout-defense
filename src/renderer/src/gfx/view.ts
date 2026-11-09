// 장면 그리기. Sim 이 내보낸 사건을 pixelfx 이펙트로 바꾸고, 전부를 480×300 프레임 하나에 합성한다.
import { clearFrame, composite, createFrame, createFx, hex, painterFor } from '@/vendor/pixelfx/core/index.js'
import { ENEMIES, H, MAX_RANK, ROUNDS, TOWER, W, WEAPON, type SpriteId } from '@/game/defs'
import { Sim, type GameEvent } from '@/game/sim'
import * as keepMod from './art/keep.js'
import { bakedMb, bakeSprite, SPRITE_LIST, type Baked } from './bake'
import { boltFx, CARD_PAL, coldRing, COFFEE, EYE_PAL, FX, ICE_PAL, LICH_PAL, PAPER_PAL, paperStorm, prepareMasks, stampFx } from './effects'
import { buildGround } from './ground'
import { icon, type Icon } from './sprites'

type Live = ReturnType<typeof createFx>

interface Running {
  fx: Live
  speed: number
}

interface Number_ {
  x: number
  y: number
  t: number
  text: string
  color: number
  big: boolean
}

interface CoinFly {
  x0: number
  y0: number
  t: number
  d: number
}

const MAX_FX = 90
const MAX_NUMBERS = 42
const MAX_COINS = 40
/** 수당 숫자가 있는 화면 위치 */
const COIN_TARGET = { x: 196, y: 10 }

const WHITE_MIX = [255, 255, 255]
const ICE_MIX = [120, 210, 255]
const FIRE_MIX = [255, 130, 40]
const POISON_MIX = [120, 255, 90]

export class View {
  readonly frame = createFrame(W, H)
  readonly img = new ImageData(W, H)
  private out32 = new Uint32Array(this.img.data.buffer)
  private ctx: CanvasRenderingContext2D
  private baked = {} as Record<SpriteId, Baked>
  private bakeQueue = [...SPRITE_LIST]
  private bakeTick = 0
  private ground: Uint32Array | null = null
  private groundRound = -1
  transparent = false

  private keep: Live
  private running: Running[] = []
  private proj = new Map<number, { fx: Live; life: number; arc: boolean; dy: number }>()
  private zone = new Map<number, Live>()
  private shots = new Map<number, Live>()
  private cones = new Map<number, { fx: Live; seen: number }>()
  private numbers: Number_[] = []
  private coins: CoinFly[] = []
  private clock = 0
  private seed = 1
  private hitBudget = 0
  private critBudget = 0
  private poofBudget = 0
  private zapBudget = 0

  /** 화면 전체 흰 번쩍임 (DOM 쪽에서 쓴다) */
  flash = 0
  /** 빨간 피격 테두리 */
  hurt = 0
  shake: [number, number] = [0, 0]

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = W
    canvas.height = H
    this.ctx = canvas.getContext('2d', { alpha: true })!
    prepareMasks()
    this.keep = createFx(keepMod, { x: TOWER.x, y: TOWER.y, minutes: 540, damage: 0 })
  }

  private spawn(mod: unknown, opts: Record<string, unknown>, speed = 1, prio = false): void {
    if (!prio && this.running.length >= MAX_FX) return
    this.running.push({ fx: createFx(mod, { seed: (this.seed = (this.seed * 7 + 3) % 9973), ...opts }), speed })
  }

  /** 게임을 시작하기 전에 남은 그림을 전부 굽는다 */
  bakeRemaining(): void {
    while (this.bakeQueue.length) {
      const id = this.bakeQueue.shift()!
      this.baked[id] = bakeSprite(id)
    }
  }

  /** 타이틀이 떠 있는 동안 몇 프레임에 하나씩 미리 굽는다 */
  private bakeSome(): void {
    if (!this.bakeQueue.length || ++this.bakeTick % 3) return
    const id = this.bakeQueue.shift()!
    this.baked[id] = bakeSprite(id)
  }

  /** 라운드 사이에 이어지면 안 되는 것을 비운다 */
  reset(): void {
    this.running = []
    this.proj.clear()
    this.zone.clear()
    this.shots.clear()
    this.cones.clear()
    this.numbers = []
    this.coins = []
    this.flash = 0
    this.hurt = 0
  }

  private number(x: number, y: number, dmg: number, color: number, big = false): void {
    if (this.numbers.length >= MAX_NUMBERS) return
    const text = dmg >= 1000 ? `${(dmg / 1000).toFixed(1)}K` : `${Math.max(1, Math.round(dmg))}`
    this.numbers.push({ x: x + (this.seed % 9) - 4, y, t: 0, text, color, big })
  }

  private onEvent(ev: GameEvent): void {
    switch (ev.t) {
      case 'hit': {
        const color = ev.crit ? hex('#ffd23c') : hex('#ffffff')
        this.number(ev.x, ev.y - 6, ev.dmg, color, ev.crit)
        if (ev.w.startsWith('_')) return
        if (ev.crit && this.critBudget >= 1) {
          this.critBudget -= 1
          this.spawn(FX.critHit, { x: ev.x, y: ev.y, light: 0.6 }, 1.5)
        } else if (this.hitBudget >= 1) {
          this.hitBudget -= 1
          const zap = ev.w === 'multitap' || ev.w === 'coil'
          if (zap && this.zapBudget >= 1) {
            this.zapBudget -= 1
            this.spawn(FX.zapHit, { x: ev.x, y: ev.y, light: 0.7 }, 1.8)
          } else this.spawn(FX.hitSpark, { x: ev.x, y: ev.y, flip: this.seed % 2 === 0, light: 0.8 }, 1.3)
        }
        return
      }
      case 'miss':
        if (this.numbers.length < MAX_NUMBERS) this.numbers.push({ x: ev.x, y: ev.y, t: 0, text: 'MISS', color: hex('#9aa6ba'), big: false })
        return
      case 'dot':
        this.number(ev.x, ev.y - 10, ev.dmg, ev.kind === 'burn' ? hex('#ff9a4a') : hex('#a8e04a'))
        return
      case 'kill': {
        if (this.coins.length < MAX_COINS) this.coins.push({ x0: ev.x, y0: ev.y - 6, t: 0, d: 0.45 + (this.seed % 5) * 0.03 })
        if (ENEMIES[ev.e].boss) {
          this.spawn(FX.bigExplosion, { x: ev.x, y: ev.y, light: 0.8 }, 1.8, true)
          this.spawn(FX.confetti, { x: ev.x, y: ev.y }, 1, true)
          this.flash = Math.max(this.flash, 0.5)
          return
        }
        if (ev.e === 'golem' || ev.e === 'knight' || ev.e === 'golemRed' || ev.e === 'knightGold' || ev.e === 'pc' || ev.e === 'copybot') {
          this.spawn(FX.shatterDeath, { x: ev.x, y: ev.y, light: 0.5 }, 2.2)
          return
        }
        if (this.poofBudget >= 1) {
          this.poofBudget -= 1
          if (ev.e === 'slime' || ev.e === 'slimeBlue' || ev.e === 'jelly') this.spawn(FX.sporeBurst, { x: ev.x, y: ev.y, light: 0.5 }, 2.4)
          else this.spawn(FX.poof, { x: ev.x, y: ev.y, light: 0.5 }, 2.6)
        }
        return
      }
      case 'towerHit':
        this.hurt = Math.max(this.hurt, Math.min(1, 0.3 + ev.dmg * 0.04))
        this.number(TOWER.x, TOWER.y - 60, ev.dmg, hex('#ff5a50'), true)
        return
      case 'kamikaze':
        this.spawn(FX.smallExplosion, { x: ev.x, y: ev.y, size: 0.4, light: 0.6 }, 2.8)
        return
      case 'bolt':
        this.spawn(boltFx, { pts: ev.pts, color: ev.w === 'coil' ? '#ffe066' : '#7cc8ff' }, 1, true)
        return
      case 'nova':
        this.spawn(coldRing, { x: ev.x, y: ev.y, r: ev.r }, 1, true)
        for (let i = 0; i < 2; i++) {
          const a = (this.seed + i * 131) * 0.37
          this.spawn(FX.snowflakeBurst, { x: ev.x + Math.cos(a) * ev.r * 0.6, y: ev.y + Math.sin(a) * ev.r * 0.4, count: 5, light: 0.6 }, 2.2)
        }
        return
      case 'cone': {
        const a = Math.atan2(ev.ay - ev.y, ev.ax - ev.x)
        const c = this.cones.get(ev.w)
        if (c) {
          c.seen = this.clock
          c.fx.options.x = ev.x
          c.fx.options.y = ev.y
          c.fx.options.angle = a
        } else this.cones.set(ev.w, { seen: this.clock, fx: createFx(FX.flamethrower, { x: ev.x, y: ev.y, angle: a, reach: 96, speed: 280, light: 0.75 }) })
        return
      }
      case 'smite':
        this.spawn(FX.smite, { x: ev.x, y: ev.y, light: 0.8 }, 1.7, true)
        return
      case 'firework':
        this.spawn(FX.fireworkBurst, { x: ev.x, y: ev.y + 40, light: 0.55 }, 2.7, true)
        return
      case 'splash':
        if (ev.w === 'quick') this.spawn(FX.plasmaExplosion, { x: ev.x, y: ev.y, light: 0.6, palette: ['#3a0a14', '#8c1d1c', '#f2701f', '#ffae35', '#ffe27a', '#fff8d6', '#ffffff'] }, 1.8, true)
        else this.spawn(FX.smallExplosion, { x: ev.x, y: ev.y, size: 0.45, light: 0.6 }, 2.6, true)
        return
      case 'stamp':
        this.spawn(stampFx, { x: ev.x, y: ev.y, r: ev.r }, 1, true)
        this.spawn(FX.bluntHit, { x: ev.x, y: ev.y + 10, light: 0.5 }, 1.8)
        return
      case 'ult':
        this.flash = 1
        this.spawn(paperStorm, { x: TOWER.x, y: TOWER.y }, 1, true)
        this.spawn(FX.plasmaExplosion, { x: TOWER.x, y: TOWER.y - 40, palette: PAPER_PAL }, 1.2, true)
        this.spawn(FX.confetti, { x: TOWER.x, y: TOWER.y + 20 }, 1, true)
        return
      case 'heal':
        this.spawn(FX.healAoe, { x: TOWER.x, y: TOWER.y + 4, light: 0.6 }, 1.8)
        if (this.numbers.length < MAX_NUMBERS) this.numbers.push({ x: TOWER.x, y: TOWER.y - 66, t: 0, text: `+${ev.n}`, color: hex('#7ee88a'), big: true })
        return
      case 'bossSpawn':
        this.flash = Math.max(this.flash, 0.4)
        return
      case 'bossSkill':
        if (ev.skill === 'summon') this.spawn(FX.spawnPortal, { x: ev.x, y: ev.y, light: 0.6 }, 2.2, true)
        if (ev.skill === 'shield') this.spawn(FX.featherBurst, { x: ev.x, y: ev.y, light: 0.6 }, 1.8)
        if (ev.skill === 'heal') this.spawn(FX.collectBurst, { x: ev.x, y: ev.y, light: 0.4 }, 2)
        if (ev.skill === 'blink') this.spawn(FX.poof, { x: ev.x, y: ev.y, light: 0.5 }, 2.2, true)
        if (ev.skill === 'charge') this.spawn(FX.bluntHit, { x: ev.x, y: ev.y, light: 0.5 }, 1.8, true)
        if (ev.skill === 'seal') this.spawn(FX.critHit, { x: TOWER.x, y: TOWER.y - 40, light: 0.6 }, 1.5, true)
        if (ev.skill === 'jam' && ev.slot !== undefined) {
          const m = Sim.mount(ev.slot)
          this.spawn(FX.zapHit, { x: m.x, y: m.y - 8, light: 0.7 }, 1.8, true)
          if (this.numbers.length < MAX_NUMBERS) this.numbers.push({ x: m.x, y: m.y - 22, t: 0, text: 'JAM', color: hex('#ff9a4a'), big: false })
        }
        return
      case 'steal':
        if (this.numbers.length < MAX_NUMBERS) this.numbers.push({ x: ev.x, y: ev.y - 12, t: 0, text: `-${ev.n}`, color: hex('#ffd23c'), big: true })
        return
      case 'roundStart':
      case 'buy':
      case 'shoot':
      case 'spawnAt':
      case 'roundEnd':
      case 'lose':
        return
      case 'win':
        for (let i = 0; i < 5; i++) this.spawn(FX.fireworkBurst, { x: 70 + i * 85, y: 150 + (i % 2) * 40 }, 1, true)
        this.spawn(FX.confetti, { x: TOWER.x, y: 200 }, 0.8, true)
        this.spawn(FX.levelUp, { x: TOWER.x, y: TOWER.y }, 1, true)
        return
    }
  }

  private syncProjectiles(sim: Sim): void {
    const alive = new Set<number>()
    for (const p of sim.projectiles) {
      alive.add(p.id)
      let v = this.proj.get(p.id)
      if (!v) {
        const a = Math.atan2(p.vy, p.vx)
        const base = { x: p.x, y: p.y, angle: a, light: 0.7 }
        const kind = WEAPON[p.w].kind
        let fx: Live
        let dy = 0
        switch (p.w) {
          case 'stapler': fx = createFx(FX.arrow, { ...base, light: 0.6 }); break
          case 'card': fx = createFx(FX.energyDisc, { ...base, size: 5, teeth: 6, speed: 90, palette: CARD_PAL }); break
          case 'copier': fx = createFx(FX.laserBolt, { ...base, length: 14, palette: PAPER_PAL }); break
          case 'quick': fx = createFx(FX.rocket, { ...base, speed: 22, light: 0.6 }); break
          case 'bomb': fx = createFx(FX.fireball, { ...base, radius: 4, speed: 34, palette: COFFEE, angle: 0 }); break
          case 'lance': fx = createFx(FX.iceLance, { ...base, length: 22, palette: ICE_PAL }); break
          case 'overtime': fx = createFx(FX.voidOrb, { ...base, angle: 0, light: 0.6 }); dy = 58; break
          default: fx = createFx(FX.plasmaShot, { ...base, size: 4, speed: 60 })
        }
        v = { fx, life: p.life, arc: kind === 'splash', dy }
        this.proj.set(p.id, v)
      }
      const u = v.arc ? 1 - p.life / v.life : 0
      v.fx.options.x = p.x
      v.fx.options.y = p.y + v.dy - (v.arc ? Math.sin(Math.PI * u) * 42 : 0)
      if (p.w !== 'bomb' && p.w !== 'overtime') v.fx.options.angle = Math.atan2(p.vy, p.vx)
    }
    for (const id of this.proj.keys()) if (!alive.has(id)) this.proj.delete(id)

    const zones = new Set<number>()
    for (const z of sim.zones) {
      zones.add(z.id)
      if (!this.zone.has(z.id)) this.zone.set(z.id, createFx(FX.poisonCloud, { x: z.x, y: z.y + z.r * 0.3, spread: z.r / 118, light: 0.55, seed: z.id % 97 }))
    }
    for (const [id, fx] of this.zone) if (!zones.has(id)) (fx.stop(), this.running.push({ fx, speed: 1 }), this.zone.delete(id))

    const shots = new Set<number>()
    for (const s of sim.enemyShots) {
      shots.add(s.id)
      let fx = this.shots.get(s.id)
      if (!fx) {
        const a = Math.atan2(s.vy, s.vx)
        fx = s.kind === 'dragon'
          ? createFx(FX.fireball, { x: s.x, y: s.y, angle: a, radius: 5, speed: 40, light: 0.7 })
          : createFx(FX.plasmaShot, { x: s.x, y: s.y, angle: a, size: 3, speed: 50, palette: s.kind === 'eye' ? EYE_PAL : LICH_PAL, light: 0.7 })
        this.shots.set(s.id, fx)
      }
      fx.options.x = s.x
      fx.options.y = s.y
    }
    for (const id of this.shots.keys()) if (!shots.has(id)) this.shots.delete(id)
  }

  /** 렌더 전 시간 진행 */
  update(dt: number, sim: Sim): void {
    this.clock += dt
    this.hitBudget = Math.min(6, this.hitBudget + dt * 18)
    this.critBudget = Math.min(2, this.critBudget + dt * 3)
    this.poofBudget = Math.min(6, this.poofBudget + dt * 12)
    this.zapBudget = Math.min(2, this.zapBudget + dt * 4)
    for (const ev of sim.events) this.onEvent(ev)
    this.syncProjectiles(sim)
    for (const r of this.running) r.fx.update(dt * r.speed)
    this.running = this.running.filter((r) => !r.fx.done())
    for (const v of this.proj.values()) v.fx.update(dt)
    for (const fx of this.zone.values()) fx.update(dt)
    for (const fx of this.shots.values()) fx.update(dt)
    for (const [slot, c] of this.cones) {
      if (this.clock - c.seen > 0.28) {
        c.fx.stop()
        this.running.push({ fx: c.fx, speed: 1 })
        this.cones.delete(slot)
      } else c.fx.update(dt)
    }
    for (const n of this.numbers) n.t += dt
    this.numbers = this.numbers.filter((n) => n.t < 0.75)
    for (const c of this.coins) c.t += dt
    this.coins = this.coins.filter((c) => c.t < c.d)
    this.flash = Math.max(0, this.flash - dt * 3)
    this.hurt = Math.max(0, this.hurt - dt * 2.2)
    this.keep.update(dt)
    const s = sim.shake
    this.shake = s > 0 ? [Math.round(Math.sin(this.clock * 73) * s * 7), Math.round(Math.cos(this.clock * 61) * s * 7)] : [0, 0]
  }

  // ───────── 합성 ─────────

  private blit(b: Baked | undefined, x: number, y: number, t: number, flip: boolean, mixTo: number[] | null, mixK: number, phased: boolean, seed: number): void {
    if (!b || !b.frames.length) return
    const idx = Math.floor((t + seed * 0.13) * b.fps) % b.frames.length
    const f = b.frames[idx]
    if (!f.w) return
    const left = Math.round(x + (flip ? -(f.x0 + f.w) : f.x0))
    const top = Math.round(y + f.y0)
    const C = this.frame.color
    const L = this.frame.light
    for (let row = 0; row < f.h; row++) {
      const sy = top + row
      if (sy < 0 || sy >= H) continue
      for (let col = 0; col < f.w; col++) {
        const sx = left + col
        if (sx < 0 || sx >= W) continue
        const from = row * f.w + (flip ? f.w - 1 - col : col)
        const i = sy * W + sx
        let c = f.c[from]
        if (c >>> 24 > 0 && !(phased && (sx + sy) % 2 === 0)) {
          if (mixTo) {
            const r = (c & 255) * (1 - mixK) + mixTo[0] * mixK
            const g = ((c >>> 8) & 255) * (1 - mixK) + mixTo[1] * mixK
            const bl = ((c >>> 16) & 255) * (1 - mixK) + mixTo[2] * mixK
            c = ((c & 0xff000000) | (Math.round(bl) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0
          }
          if (c >>> 24 === 255 || C[i] >>> 24 === 0) C[i] = c
        }
        const l = f.l[from]
        if (l & 0xffffff) {
          const d = L[i]
          const r = Math.min(255, (d & 255) + (l & 255))
          const g = Math.min(255, ((d >>> 8) & 255) + ((l >>> 8) & 255))
          const bl = Math.min(255, ((d >>> 16) & 255) + ((l >>> 16) & 255))
          L[i] = (0xff000000 | (bl << 16) | (g << 8) | r) >>> 0
        }
      }
    }
  }

  private blitIcon(ic: Icon, x: number, y: number): void {
    const C = this.frame.color
    const left = Math.round(x)
    const top = Math.round(y)
    for (let row = 0; row < ic.h; row++) {
      for (let col = 0; col < ic.w; col++) {
        const c = ic.px[row * ic.w + col]
        const sx = left + col
        const sy = top + row
        if (c && sx >= 0 && sy >= 0 && sx < W && sy < H) C[sy * W + sx] = c
      }
    }
  }

  private drawMount(sim: Sim, slot: number): void {
    const w = sim.weapons[slot]
    const m = Sim.mount(slot)
    const ic = icon(w.id)
    const p = painterFor(this.frame)
    p.place(0, 0, false, 0)
    p.rect(m.x - 8, m.y - 1, 16, 7, hex('#1c1d30'))
    p.rect(m.x - 7, m.y - 2, 14, 6, hex('#5c6a8a'))
    this.blitIcon(ic, m.x - ic.w / 2, m.y - ic.h - 1)
    for (let r = 0; r <= w.rank; r++) p.rect(m.x - 6 + r * 2 + (r > 0 ? r : 0), m.y + 1, 2, 2, r === MAX_RANK ? hex('#ffd23c') : hex('#7fdcff'))
  }

  render(sim: Sim | null, opts: { idle?: boolean } = {}): void {
    this.bakeSome()
    const groundAt = sim ? Math.min(sim.round, ROUNDS - 1) : 0
    if (!this.transparent && sim && groundAt !== this.groundRound) {
      this.ground = buildGround(groundAt)
      this.groundRound = groundAt
    }
    if (!this.transparent && (!this.ground || (!sim && this.groundRound !== 0))) {
      this.ground = buildGround(0)
      this.groundRound = 0
    }
    const frame = this.frame
    clearFrame(frame)
    // 뒤쪽 이펙트
    for (const fx of this.zone.values()) fx.draw(frame, 'back')
    for (const r of this.running) r.fx.draw(frame, 'back')

    this.keep.options.minutes = sim ? sim.clockMinutes() : 540
    this.keep.options.damage = sim ? 1 - sim.hp / sim.stats.maxHp : 0

    // y 순서로 세운다
    const items: { y: number; draw: () => void }[] = []
    items.push({ y: TOWER.y, draw: () => this.keep.draw(frame) })
    if (sim && !opts.idle) {
      sim.weapons.forEach((_, slot) => {
        const m = Sim.mount(slot)
        items.push({ y: m.y + 0.5, draw: () => this.drawMount(sim, slot) })
      })
      for (const e of sim.enemies) {
        if (e.dead) continue
        items.push({
          y: e.y,
          draw: () => {
            const flip = e.face < 0
            let mix: number[] | null = null
            let k = 0
            if (e.flash > 0) (mix = WHITE_MIX), (k = Math.min(e.def.boss ? 0.28 : 0.8, e.flash))
            else if (e.freezeT > 0) (mix = ICE_MIX), (k = 0.62)
            else if (e.burnT > 0) (mix = FIRE_MIX), (k = 0.14 + 0.1 * Math.sin(e.age * 18))
            else if (e.poisonT > 0) (mix = POISON_MIX), (k = 0.22)
            else if (e.slowT > 0) (mix = ICE_MIX), (k = 0.25)
            this.blit(this.baked[e.def.id], e.x, e.y, e.age, flip, mix, k, e.phased, e.seed)
            if (e.shield > 0) {
              const p = painterFor(frame)
              p.place(0, 0, false, 0)
              p.ring(e.x, e.y - e.def.r * 2, e.def.r * 2, 2, hex('#7df0ff'), 0.85)
              p.glowRing(e.x, e.y - e.def.r * 2, e.def.r * 2, 12, hex('#7df0ff'), 0.3)
            }
            if (!e.def.boss && e.hp < e.maxHp && e.def.hp > 12) {
              const p = painterFor(frame)
              p.place(0, 0, false, 0)
              const bw = 14
              const bx = Math.round(e.x - bw / 2)
              const by = Math.round(e.y + 3)
              p.rect(bx, by, bw, 2, hex('#1c1422'))
              p.rect(bx, by, Math.max(1, Math.round((bw * e.hp) / e.maxHp)), 2, hex('#ff5a50'))
            }
          }
        })
      }
    }
    items.sort((a, b) => a.y - b.y)
    for (const it of items) it.draw()

    // 앞쪽 이펙트 · 투사체
    for (const fx of this.zone.values()) fx.draw(frame, 'front')
    for (const r of this.running) r.fx.draw(frame, 'front')
    for (const c of this.cones.values()) c.fx.draw(frame)
    for (const v of this.proj.values()) v.fx.draw(frame)
    for (const fx of this.shots.values()) fx.draw(frame)

    // 데미지 숫자 · 날아가는 동전
    const p = painterFor(frame)
    p.place(0, 0, false, 0)
    for (const n of this.numbers) {
      const k = n.t / 0.75
      const y = n.y - 16 * Math.sqrt(k) * (n.big ? 1.3 : 1)
      p.text(n.text, n.x, y, n.color, { align: 'center', font: n.big ? 'big' : 'mini', outline: hex('#14111f'), a: k > 0.7 ? (1 - k) / 0.3 : 1 })
    }
    for (const c of this.coins) {
      const u = c.t / c.d
      const e = u * u
      const x = c.x0 + (COIN_TARGET.x - c.x0) * e
      const y = c.y0 + (COIN_TARGET.y - c.y0) * e - Math.sin(u * Math.PI) * 18
      p.rect(x - 2, y - 2, 4, 4, hex('#c48412'))
      p.rect(x - 1, y - 2, 2, 3, hex('#ffe066'))
      p.glow(x, y, 6, hex('#ffd23c'), 0.3)
    }
    if (this.transparent || !this.ground) composite(frame, this.img.data, null as never, 1)
    else this.compositeOver(this.ground)
    this.ctx.clearRect(0, 0, W, H)
    this.ctx.putImageData(this.img, 0, 0)
  }

  /** 불투명 바닥 위 합성: 대부분인 빈 칸·완전 불투명 칸을 바로 복사해 pixelfx composite 보다 빠르다 */
  private compositeOver(bg: Uint32Array): void {
    const C = this.frame.color
    const L = this.frame.light
    const out = this.out32
    for (let i = 0; i < C.length; i++) {
      const c = C[i]
      const l = L[i] & 0xffffff
      if (!l) {
        if (c === 0) {
          out[i] = bg[i]
          continue
        }
        if (c >>> 24 === 255) {
          out[i] = c
          continue
        }
      }
      const a = c >>> 24
      const k = bg[i]
      const f = a / 255
      let r = (c & 255) * f + (k & 255) * (1 - f)
      let g = ((c >>> 8) & 255) * f + ((k >>> 8) & 255) * (1 - f)
      let b = ((c >>> 16) & 255) * f + ((k >>> 16) & 255) * (1 - f)
      if (l) {
        r = Math.min(255, r + (l & 255))
        g = Math.min(255, g + ((l >>> 8) & 255))
        b = Math.min(255, b + ((l >>> 16) & 255))
      }
      out[i] = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0
    }
  }

  /** 시뮬레이션 사건을 다 쓴 뒤 호출 */
  consume(sim: Sim): void {
    sim.events.length = 0
  }

  bakedSize(): number {
    return bakedMb(this.baked)
  }

  /** 시험·성능 측정용 */
  stats(): { fx: number; proj: number } {
    return { fx: this.running.length, proj: this.proj.size }
  }
}
