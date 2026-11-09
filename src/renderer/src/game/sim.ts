// 게임 규칙 전부. 화면·소리를 모른다 — 일어난 일은 events 로 내보내고, view 가 그것을 그린다.
// 고정 시간 간격(1/60초)으로만 움직이고 난수도 시드를 쓰므로, 같은 입력이면 항상 같은 결과가 나온다.
import {
  atRank, DAYS, DEPTS, ENEMIES, H, hpScale, isLunch, ITEM, ITEMS, MAX_RANK, MODES, PERKS, RANK_CD, RANK_DMG, rarityWeights, ROUNDS, SLOTS, STEP_MIN, TOWER, TOWER_R, W, waveFor, WEAPON, WEAPONS,
  ZERO_STATS, type BossSkill, type Dept, type EnemyDef, type ItemDef, type ModeId, type Rarity, type ShotKind, type SpriteId, type Stats, type WeaponDef
} from './defs'

export const DT = 1 / 60
const CELL = 36
const MAX_ENEMIES = 240

export class Rng {
  constructor(public s: number) {}
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next()
  }
  int(n: number): number {
    return Math.floor(this.next() * n)
  }
  pick<T>(list: readonly T[]): T {
    return list[this.int(list.length)]
  }
  chance(p: number): boolean {
    return this.next() < p
  }
}

export interface Enemy {
  id: number
  def: EnemyDef
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  dmg: number
  age: number
  atkCd: number
  slowT: number
  slowK: number
  freezeT: number
  burnT: number
  burnDps: number
  poisonT: number
  poisonDps: number
  dotCd: number
  stunT: number
  flash: number
  face: number
  phased: boolean
  shield: number
  skillCd: number
  /** 보스 스킬별 남은 대기 */
  skillT: number[]
  hasteT: number
  /** 의자·미믹의 돌진 남은 시간 */
  dashT: number
  /** 수당을 훔쳐 달아나는 중 */
  fleeing: boolean
  seed: number
  dead: boolean
}

export interface Weapon {
  id: string
  rank: number
  cd: number
  /** 분사기처럼 계속 쏘는 무기가 지금 쏘는 곳 */
  aim: { x: number; y: number } | null
  /** 무기별 준 피해 합계 (결과 화면용) */
  dealt: number
}

export interface Projectile {
  id: number
  w: string
  rank: number
  x: number
  y: number
  vx: number
  vy: number
  dmg: number
  crit: boolean
  life: number
  pierce: number
  bounces: number
  splash: number
  burn: number
  freeze: number
  homing: number
  /** 도달점이 정해진 포물선 투사체 */
  tx: number | null
  ty: number
  hit: Set<number>
  tick: Map<number, number>
}

export interface Zone {
  id: number
  w: string
  x: number
  y: number
  r: number
  dps: number
  t: number
  life: number
  cd: number
}

export interface EnemyShot {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  dmg: number
  life: number
  kind: ShotKind
}

export type GameEvent =
  | { t: 'hit'; x: number; y: number; w: string; crit: boolean; dmg: number }
  | { t: 'miss'; x: number; y: number }
  | { t: 'kill'; x: number; y: number; e: SpriteId; coin: number; w: string }
  | { t: 'dot'; x: number; y: number; dmg: number; kind: 'burn' | 'poison' }
  | { t: 'towerHit'; dmg: number; x: number; y: number }
  | { t: 'bolt'; pts: [number, number][]; w: string }
  | { t: 'nova'; x: number; y: number; r: number; w: string }
  | { t: 'cone'; w: number; x: number; y: number; ax: number; ay: number }
  | { t: 'smite'; x: number; y: number; r: number }
  | { t: 'firework'; x: number; y: number; r: number }
  | { t: 'splash'; x: number; y: number; r: number; w: string }
  | { t: 'shoot'; w: string; slot: number }
  | { t: 'stamp'; x: number; y: number; r: number; hits: number }
  | { t: 'ult' }
  | { t: 'heal'; n: number }
  | { t: 'bossSpawn'; e: SpriteId }
  | { t: 'bossSkill'; e: SpriteId; x: number; y: number; skill: string; slot?: number }
  | { t: 'kamikaze'; x: number; y: number }
  | { t: 'steal'; x: number; y: number; n: number }
  | { t: 'spawnAt'; x: number; y: number; e: SpriteId }
  | { t: 'roundStart'; round: number }
  | { t: 'roundEnd'; round: number; pay: number; interest: number }
  | { t: 'buy'; kind: 'weapon' | 'promote' | 'item' }
  | { t: 'win' }
  | { t: 'lose' }

export type Phase = 'pick' | 'wave' | 'shop' | 'win' | 'lose'

export type Offer =
  | { kind: 'weapon'; id: string; price: number; sold: boolean }
  | { kind: 'item'; id: string; price: number; sold: boolean }

export interface Meta {
  perks: Record<string, number>
}

interface SpawnEntry {
  at: number
  e: SpriteId
}

export interface SimSave {
  v: 2
  day: number
  mode: ModeId
  seed: number
  rng: number
  round: number
  coins: number
  hp: number
  weapons: { id: string; rank: number; dealt: number }[]
  items: Record<string, number>
  offers: Offer[]
  rerollCount: number
  freeRerolls: number
  ultCharge: number
  kills: number
  earned: number
  lunch: boolean
  meta: Meta
}

export class Sim {
  phase: Phase = 'pick'
  readonly day: (typeof DAYS)[number]
  readonly mode: (typeof MODES)[ModeId]
  readonly rng: Rng
  readonly seed: number
  meta: Meta

  round = 0
  coins = 0
  hp = 100
  weapons: Weapon[] = []
  items: Record<string, number> = {}
  stats: Stats = { ...ZERO_STATS }

  enemies: Enemy[] = []
  projectiles: Projectile[] = []
  zones: Zone[] = []
  enemyShots: EnemyShot[] = []
  events: GameEvent[] = []

  starters: string[] = []
  offers: Offer[] = []
  rerollCount = 0
  freeRerolls = 0
  lunch = false

  time = 0
  roundTime = 0
  roundSecs = 0
  spawnQueue: SpawnEntry[] = []
  bossAlive: Enemy | null = null
  bossSpawned = false

  stampCd = 0
  ultCharge = 0
  kills = 0
  earned = 0
  dealtTotal = 0
  shake = 0

  private nextId = 1
  private grid = new Map<number, Enemy[]>()

  constructor(opts: { day: number; mode: ModeId; meta: Meta; seed: number; save?: SimSave }) {
    this.day = DAYS[opts.day]
    this.mode = MODES[opts.mode]
    this.seed = opts.seed
    this.rng = new Rng(opts.seed)
    this.meta = opts.meta
    if (opts.save) {
      this.restore(opts.save)
      return
    }
    this.recalc()
    this.hp = this.stats.maxHp
    this.coins = 10 + this.stats.startCoin
    // 첫 무기는 일반·우수 중에서 셋을 보여 준다. 회복만 하는 무기는 뺀다.
    const pool = WEAPONS.filter((w) => w.rar <= 2 && w.kind !== 'heal').map((w) => w.id)
    while (this.starters.length < 3) {
      const id = this.rng.pick(pool)
      if (!this.starters.includes(id)) this.starters.push(id)
    }
  }

  // ───────── 능력치 ─────────

  deptCounts(): Record<Dept, number> {
    const c: Record<Dept, number> = { admin: 0, pantry: 0, hvac: 0, it: 0, night: 0, hr: 0 }
    for (const w of this.weapons) c[WEAPON[w.id].dept]++
    return c
  }

  recalc(): void {
    const s: Stats = { ...ZERO_STATS }
    const add = (p: Partial<Stats>, n = 1): void => {
      for (const k of Object.keys(p) as (keyof Stats)[]) s[k] += (p[k] as number) * n
    }
    for (const perk of PERKS) add(perk.stats, this.meta.perks[perk.id] ?? 0)
    for (const [id, n] of Object.entries(this.items)) if (ITEM[id].stats) add(ITEM[id].stats!, n)
    const counts = this.deptCounts()
    for (const d of Object.keys(DEPTS) as Dept[]) {
      // 도달한 가장 높은 단계 하나만 적용한다
      let best: Partial<Stats> | null = null
      for (const tier of DEPTS[d].tiers) if (counts[d] >= tier.n) best = tier.stats
      if (best) add(best)
    }
    s.armor = Math.min(0.6, s.armor)
    s.crit = Math.min(0.8, s.crit)
    s.stampCd = Math.min(0.6, s.stampCd)
    s.maxHp = Math.max(30, s.maxHp)
    this.stats = s
    this.hp = Math.min(this.hp, s.maxHp)
  }

  // ───────── 흐름 ─────────

  pickStarter(id: string): void {
    if (this.phase !== 'pick' || !this.starters.includes(id)) return
    this.weapons.push({ id, rank: 0, cd: 0, aim: null, dealt: 0 })
    this.recalc()
    this.startRound()
  }

  startRound(): void {
    this.phase = 'wave'
    this.roundTime = 0
    this.enemies = []
    this.projectiles = []
    this.zones = []
    this.enemyShots = []
    this.bossAlive = null
    this.bossSpawned = false
    this.lunch = false
    const wave = this.wave()
    this.roundSecs = wave.secs
    this.spawnQueue = []
    for (const [e, n] of wave.mix) {
      const count = Math.max(1, Math.round(n * this.ramped(this.day.count * this.mode.count)))
      for (let i = 0; i < count; i++) this.spawnQueue.push({ at: this.rng.range(0.4, wave.secs), e })
    }
    this.spawnQueue.sort((a, b) => a.at - b.at)
    for (const w of this.weapons) (w.cd = this.rng.range(0, 0.3)), (w.aim = null)
    this.stampCd = 0
    this.events.push({ t: 'roundStart', round: this.round })
  }

  /** 요일·난이도 배수는 초반엔 조금만 걸리고 12라운드쯤 전부 걸린다 (금요일 첫 판이 바로 끝나지 않게) */
  private ramped(k: number): number {
    if (k <= 1) return k
    return 1 + (k - 1) * Math.min(1, 0.3 + (0.7 * this.round) / 12)
  }

  wave(): ReturnType<typeof waveFor> {
    return waveFor(this.day.id, this.round)
  }

  /** 이번 라운드가 시작되는 시각 (분) */
  roundStart(): number {
    return 9 * 60 + STEP_MIN * this.round
  }

  /** 지금 시계가 가리키는 분 (보스가 살아 있으면 멈춘다) */
  clockMinutes(): number {
    const start = this.roundStart()
    if (this.phase !== 'wave') return start
    if (this.wave().boss) {
      // 보스 라운드는 정각 1분 전에서 시계가 멈춘다
      return start + (STEP_MIN - 1) * Math.min(1, this.roundTime / 10)
    }
    return start + STEP_MIN * Math.min(1, this.roundTime / this.roundSecs)
  }

  private endRound(): void {
    this.projectiles = []
    this.zones = []
    this.enemyShots = []
    if (!this.day.endless && this.round >= ROUNDS - 1) {
      this.phase = 'win'
      this.events.push({ t: 'win' })
      return
    }
    const pay = 8 + this.round
    const interest = Math.min(4 + this.stats.interest, Math.floor(this.coins / 6))
    this.coins += pay + interest
    this.earned += pay + interest
    this.heal(this.stats.regen)
    this.events.push({ t: 'roundEnd', round: this.round, pay, interest })
    this.round++
    this.phase = 'shop'
    this.lunch = !this.day.endless && isLunch(this.round)
    if (this.lunch) this.heal(this.stats.maxHp * 0.4)
    this.rerollCount = 0
    this.freeRerolls = this.stats.freeRerolls + (this.lunch ? 1 : 0)
    this.rollOffers()
  }

  private lose(): void {
    this.phase = 'lose'
    this.events.push({ t: 'lose' })
  }

  heal(n: number): void {
    if (n <= 0) return
    const before = this.hp
    this.hp = Math.min(this.stats.maxHp, this.hp + n)
    if (this.hp - before >= 1) this.events.push({ t: 'heal', n: Math.round(this.hp - before) })
  }

  // ───────── 쉬는 시간 ─────────

  private priceOf(base: number): number {
    const k = (1 + this.round * 0.055) * (this.lunch ? 0.8 : 1)
    return Math.max(1, Math.round(base * k))
  }

  /** 승진(재구매) 가격 */
  promotePrice(id: string, rank: number): number {
    return this.priceOf(WEAPON[id].price * (1 + rank * 0.9))
  }

  private rollRarity(): Rarity {
    const w = rarityWeights(this.round)
    let x = this.rng.range(0, w[0] + w[1] + w[2] + w[3])
    for (let i = 0; i < 4; i++) {
      x -= w[i]
      if (x <= 0) return (i + 1) as Rarity
    }
    return 1
  }

  private itemsOf(r: Rarity): ItemDef[] {
    return ITEMS.filter((i) => i.rar === r && (this.items[i.id] ?? 0) < (i.max ?? 5))
  }

  private weaponUsable(w: WeaponDef): boolean {
    const own = this.weapons.find((x) => x.id === w.id)
    if (own) return own.rank < MAX_RANK
    return this.weapons.length < SLOTS
  }

  rollOffers(): void {
    const out: Offer[] = []
    const seen = new Set<string>()
    let guard = 0
    while (out.length < 4 && guard++ < 200) {
      const rar = this.rollRarity()
      // 무기 칸이 남았거나 승진시킬 무기가 있으면 무기가 더 자주 나온다
      const wantWeapon = this.rng.chance(this.weapons.length < SLOTS ? 0.58 : 0.36)
      if (wantWeapon) {
        const pool = WEAPONS.filter((w) => w.rar <= Math.max(rar, 1) && w.rar >= rar - 1 && this.weaponUsable(w) && !seen.has(w.id))
        if (!pool.length) continue
        // 이미 가진 부서·무기에 살짝 가중치를 줘서 시너지가 맞춰지게 한다
        const counts = this.deptCounts()
        const weighted = pool.flatMap((w) => {
          const own = this.weapons.some((x) => x.id === w.id)
          const n = 1 + (own ? 2 : 0) + (counts[w.dept] > 0 ? 1 : 0)
          return Array<WeaponDef>(n).fill(w)
        })
        const w = this.rng.pick(weighted)
        seen.add(w.id)
        const own = this.weapons.find((x) => x.id === w.id)
        out.push({ kind: 'weapon', id: w.id, price: own ? this.promotePrice(w.id, own.rank + 1) : this.priceOf(w.price), sold: false })
      } else {
        const pool = this.itemsOf(rar).filter((i) => !seen.has(i.id))
        if (!pool.length) continue
        const i = this.rng.pick(pool)
        seen.add(i.id)
        out.push({ kind: 'item', id: i.id, price: this.priceOf(i.price), sold: false })
      }
    }
    this.offers = out
  }

  rerollPrice(): number {
    if (this.freeRerolls > 0) return 0
    return 2 + Math.floor(this.round / 4) + this.rerollCount
  }

  reroll(): boolean {
    if (this.phase !== 'shop') return false
    const p = this.rerollPrice()
    if (this.coins < p) return false
    this.coins -= p
    if (this.freeRerolls > 0) this.freeRerolls--
    else this.rerollCount++
    this.rollOffers()
    return true
  }

  canBuy(i: number): boolean {
    const o = this.offers[i]
    if (!o || o.sold || this.coins < o.price || this.phase !== 'shop') return false
    if (o.kind === 'weapon') return this.weaponUsable(WEAPON[o.id])
    return true
  }

  buy(i: number): boolean {
    if (!this.canBuy(i)) return false
    const o = this.offers[i]
    this.coins -= o.price
    o.sold = true
    if (o.kind === 'weapon') {
      const own = this.weapons.find((w) => w.id === o.id)
      if (own) own.rank++
      else this.weapons.push({ id: o.id, rank: 0, cd: 0, aim: null, dealt: 0 })
      this.events.push({ t: 'buy', kind: own ? 'promote' : 'weapon' })
      // 같은 무기가 또 진열되어 있으면 가격을 새 직급에 맞춘다
      for (const other of this.offers) {
        if (other !== o && other.kind === 'weapon' && other.id === o.id && !other.sold) {
          const w = this.weapons.find((x) => x.id === o.id)!
          other.price = this.promotePrice(o.id, w.rank + 1)
        }
      }
    } else {
      const def = ITEM[o.id]
      this.items[o.id] = (this.items[o.id] ?? 0) + 1
      if (def.coins) this.coins += def.coins
      this.events.push({ t: 'buy', kind: 'item' })
      this.recalc()
      if (def.heal) this.heal(def.heal)
    }
    this.recalc()
    return true
  }

  sellValue(slot: number): number {
    const w = this.weapons[slot]
    if (!w) return 0
    let paid = WEAPON[w.id].price
    for (let r = 1; r <= w.rank; r++) paid += WEAPON[w.id].price * (1 + r * 0.9)
    return Math.floor(paid * 0.5)
  }

  canSell(slot: number): boolean {
    const w = this.weapons[slot]
    if (!w || this.phase !== 'shop') return false
    // 공격 무기는 최소 하나 남아 있어야 한다
    return this.weapons.some((x, i) => i !== slot && WEAPON[x.id].kind !== 'heal')
  }

  sell(slot: number): boolean {
    if (!this.canSell(slot)) return false
    this.coins += this.sellValue(slot)
    this.weapons.splice(slot, 1)
    this.recalc()
    return true
  }

  backToWork(): void {
    if (this.phase === 'shop') this.startRound()
  }

  // ───────── 플레이어 조작 ─────────

  stampMax(): number {
    return 1.1 * (1 - this.stats.stampCd)
  }

  stampPower(): number {
    return (12 + this.round * 5) * (1 + this.stats.stampDmg) * (1 + this.stats.dmg)
  }

  stamp(x: number, y: number): boolean {
    if (this.phase !== 'wave' || this.stampCd > 0) return false
    this.stampCd = this.stampMax()
    const R = 36
    const dmg = this.stampPower()
    let hits = 0
    for (const e of this.enemies) {
      if (e.dead) continue
      if (Math.hypot(e.x - x, e.y - y) <= R + e.def.r) {
        this.hurt(e, dmg, false, '_stamp')
        e.stunT = Math.max(e.stunT, 0.25)
        hits++
      }
    }
    this.events.push({ t: 'stamp', x, y, r: R, hits })
    return true
  }

  ultReady(): boolean {
    return this.ultCharge >= 100
  }

  ult(): boolean {
    if (this.phase !== 'wave' || !this.ultReady()) return false
    this.ultCharge = 0
    this.events.push({ t: 'ult' })
    this.shake = Math.max(this.shake, 0.6)
    const power = 90 * hpScale(this.round) * this.day.hp * (1 + this.stats.dmg)
    for (const e of [...this.enemies]) {
      if (e.dead) continue
      const dmg = e.def.boss ? e.maxHp * 0.14 : power
      this.hurt(e, dmg, false, '_ult')
    }
    this.enemyShots = []
    return true
  }

  // ───────── 시간 흐름 ─────────

  tick(): void {
    if (this.phase !== 'wave') return
    this.time += DT
    this.roundTime += DT
    this.stampCd = Math.max(0, this.stampCd - DT)
    this.shake = Math.max(0, this.shake - DT * 2)
    this.spawnTick()
    this.buildGrid()
    this.enemyTick()
    this.buildGrid()
    this.weaponTick()
    this.projectileTick()
    this.zoneTick()
    this.enemyShotTick()
    this.enemies = this.enemies.filter((e) => !e.dead)
    if (this.hp <= 0) {
      this.lose()
      return
    }
    const waveDone = this.spawnQueue.length === 0 && this.roundTime >= this.roundSecs
    if (waveDone && this.enemies.length === 0) this.endRound()
  }

  private spawnTick(): void {
    const wave = this.wave()
    if (wave.boss && !this.bossSpawned && this.roundTime >= 1.2) {
      this.bossSpawned = true
      this.bossAlive = this.spawn(wave.boss)
      this.events.push({ t: 'bossSpawn', e: wave.boss })
    }
    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.roundTime) {
      if (this.enemies.length >= MAX_ENEMIES) {
        this.spawnQueue[0].at += 0.5
        this.spawnQueue.sort((a, b) => a.at - b.at)
        break
      }
      this.spawn(this.spawnQueue.shift()!.e)
    }
  }

  private edgePoint(boss = false): { x: number; y: number } {
    // 보스는 온몸이 보이도록 좌우에서 화면 중간 높이로 들어온다
    if (boss) return { x: this.rng.chance(0.5) ? -40 : W + 40, y: this.rng.range(190, 250) }
    const side = this.rng.int(4)
    const m = 18
    if (side === 0) return { x: this.rng.range(0, W), y: 12 }
    if (side === 1) return { x: this.rng.range(0, W), y: H + m }
    if (side === 2) return { x: -m, y: this.rng.range(30, H) }
    return { x: W + m, y: this.rng.range(30, H) }
  }

  spawn(id: SpriteId, at?: { x: number; y: number }): Enemy {
    const def = ENEMIES[id]
    const p = at ?? this.edgePoint(def.boss)
    const dayHp = this.ramped(this.day.hp * this.mode.hp)
    // 무한 야근의 보스는 라운드가 갈수록 커진다
    const scale = def.boss ? dayHp * (this.day.endless ? 0.6 + this.round * 0.09 : 1) : hpScale(this.round) * dayHp
    const hp = def.hp * scale
    const e: Enemy = {
      id: this.nextId++, def, x: p.x, y: p.y, hp, maxHp: hp,
      speed: def.speed * this.rng.range(0.92, 1.08),
      dmg: def.dmg * this.ramped(this.day.dmg * this.mode.dmg) * (1 + this.round * 0.04),
      age: 0, atkCd: 0.3, slowT: 0, slowK: 0, freezeT: 0, burnT: 0, burnDps: 0, poisonT: 0, poisonDps: 0, dotCd: 0,
      stunT: 0, flash: 0, face: p.x < TOWER.x ? 1 : -1, phased: false, shield: 0, skillCd: this.rng.range(1, 3), skillT: (def.skills ?? []).map((s) => s.cd * this.rng.range(0.5, 0.9)), hasteT: 0, dashT: 0, fleeing: false,
      seed: this.rng.int(1000), dead: false
    }
    this.enemies.push(e)
    return e
  }

  private key(x: number, y: number): number {
    return Math.floor(x / CELL) * 4096 + Math.floor(y / CELL) + 2048 * 4096
  }

  private buildGrid(): void {
    this.grid.clear()
    for (const e of this.enemies) {
      if (e.dead) continue
      const k = this.key(e.x, e.y)
      const b = this.grid.get(k)
      if (b) b.push(e)
      else this.grid.set(k, [e])
    }
  }

  private near(x: number, y: number, r: number, fn: (e: Enemy) => void): void {
    const n = Math.ceil(r / CELL)
    const cx = Math.floor(x / CELL)
    const cy = Math.floor(y / CELL)
    for (let i = cx - n; i <= cx + n; i++) {
      for (let j = cy - n; j <= cy + n; j++) {
        const b = this.grid.get(i * 4096 + j + 2048 * 4096)
        if (b) for (const e of b) if (!e.dead) fn(e)
      }
    }
  }

  private enemyTick(): void {
    for (const e of this.enemies) {
      if (e.dead) continue
      e.age += DT
      e.flash = Math.max(0, e.flash - DT * 6)
      this.dotTick(e)
      if (e.dead) continue
      if (e.freezeT > 0) e.freezeT -= DT
      if (e.stunT > 0) e.stunT -= DT
      if (e.slowT > 0) e.slowT -= DT
      if (e.shield > 0) e.shield -= DT
      if (e.hasteT > 0) e.hasteT -= DT
      if (e.def.ai === 'phase') e.phased = (e.age + e.seed * 0.01) % 3.4 > 2.5
      if (e.def.boss) this.bossBrain(e)
      if (e.freezeT > 0 || e.stunT > 0) continue
      const dx = TOWER.x - e.x
      const dy = TOWER.y - e.y
      const dist = Math.hypot(dx, dy) || 1
      const reach = TOWER_R + e.def.r * 0.8
      let stopAt = reach
      if (e.def.ai === 'ranged') stopAt = Math.max(reach, 118 - e.age * 3.2)
      if (e.def.stand) stopAt = e.def.stand
      let sp = e.speed * (e.slowT > 0 ? 1 - e.slowK : 1)
      if (e.hasteT > 0) sp *= 1.45
      if (e.dashT > 0) {
        e.dashT -= DT
        sp *= 5
        stopAt = reach
      }
      // 수당을 훔친 비둘기는 화면 밖으로 달아난다
      if (e.fleeing) {
        const a = Math.atan2(e.y - TOWER.y, e.x - TOWER.x)
        e.x += Math.cos(a) * sp * 1.3 * DT
        e.y += Math.sin(a) * sp * 1.3 * DT
        e.face = Math.cos(a) > 0 ? 1 : -1
        if (e.x < -30 || e.x > W + 30 || e.y < -30 || e.y > H + 30) e.dead = true
        continue
      }
      // 라운드 시간이 지나면 남은 적이 재촉을 받는다 (라운드가 끝나지 않는 일 방지)
      const over = this.roundTime - this.roundSecs
      if (over > 8 && !e.def.boss) sp *= 1 + Math.min(2, (over - 8) * 0.2)
      // 보스는 화면 안으로 빠르게 들어온다
      if (e.def.boss && (e.x < 70 || e.x > W - 70)) sp *= 5
      if (dist > stopAt) {
        let ux = dx / dist
        let uy = dy / dist
        if (e.def.ai === 'weave') {
          const w = Math.sin(e.age * 5 + e.seed) * 0.8
          ;[ux, uy] = [ux - uy * w, uy + ux * w]
        } else if (e.def.ai === 'zig') {
          const w = Math.sign(Math.sin(e.age * 3.2 + e.seed)) * 0.75
          ;[ux, uy] = [ux - uy * w, uy + ux * w]
        } else if (e.def.ai === 'hop') {
          sp *= (e.age + e.seed * 0.01) % 1 < 0.42 ? 2.5 : 0.05
        } else if (e.def.ai === 'charge' && e.dashT <= 0) {
          // 멈춰서 노려보다가 훅 달려든다
          sp *= (e.age + e.seed * 0.01) % 2.2 < 0.55 ? 4.2 : 0.35
        }
        e.x += ux * sp * DT
        e.y += uy * sp * DT
        if (ux > 0.1) e.face = 1
        else if (ux < -0.1) e.face = -1
      }
      if (!e.def.flying || e.def.boss) this.separate(e)
      e.atkCd -= DT
      if (dist <= reach + 2) {
        if (e.def.ai === 'kamikaze') {
          this.damageTower(e.dmg, e.x, e.y)
          this.events.push({ t: 'kamikaze', x: e.x, y: e.y })
          e.dead = true
          continue
        }
        if (e.def.ai === 'thief') {
          const n = Math.min(this.coins, 1 + Math.floor(this.round / 5))
          this.coins -= n
          e.fleeing = true
          this.events.push({ t: 'steal', x: e.x, y: e.y, n })
          continue
        }
        if (e.atkCd <= 0) {
          e.atkCd = e.def.boss ? 1.6 : 1.1
          this.damageTower(e.dmg, e.x, e.y)
        }
      } else if (e.def.ai === 'ranged' && dist <= stopAt + 4 && e.atkCd <= 0) {
        e.atkCd = 2
        this.enemyShoot(e, 'eye', 150)
      } else if (e.def.ai === 'healer') {
        e.skillCd -= DT
        if (e.skillCd <= 0) {
          e.skillCd = 2.2
          this.near(e.x, e.y, 60, (o) => {
            if (o !== e && !o.def.boss && Math.hypot(o.x - e.x, o.y - e.y) <= 60) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.16)
          })
          this.events.push({ t: 'bossSkill', e: 'jelly', x: e.x, y: e.y, skill: 'heal' })
        }
      }
      if (e.def.ai === 'buffer' || e.def.ai === 'summoner') this.supportTick(e)
    }
  }

  private separate(e: Enemy): void {
    const R = e.def.r * 0.9
    this.near(e.x, e.y, R + 12, (o) => {
      if (o === e || o.def.flying) return
      const dx = e.x - o.x
      const dy = e.y - o.y
      const d = Math.hypot(dx, dy)
      const min = R + o.def.r * 0.9
      if (d > 0 && d < min) {
        const push = (min - d) * 0.25 * (o.def.boss ? 1.6 : 1)
        e.x += (dx / d) * push
        e.y += (dy / d) * push
      }
    })
  }

  private dotTick(e: Enemy): void {
    if (e.burnT > 0) e.burnT -= DT
    if (e.poisonT > 0) e.poisonT -= DT
    e.dotCd -= DT
    if (e.dotCd > 0) return
    e.dotCd = 0.25
    if (e.burnT > 0 && e.burnDps > 0) {
      const d = e.burnDps * 0.25
      this.applyDamage(e, d, '_burn')
      this.events.push({ t: 'dot', x: e.x, y: e.y, dmg: d, kind: 'burn' })
    }
    if (!e.dead && e.poisonT > 0 && e.poisonDps > 0) {
      const d = e.poisonDps * 0.25
      this.applyDamage(e, d, '_poison')
      this.events.push({ t: 'dot', x: e.x, y: e.y, dmg: d, kind: 'poison' })
    }
  }

  /** 전화기는 주변을 재촉하고, 복사 로봇은 메일을 찍어 낸다 */
  private supportTick(e: Enemy): void {
    e.skillCd -= DT
    if (e.skillCd > 0) return
    if (e.def.ai === 'buffer') {
      e.skillCd = 2.2
      this.near(e.x, e.y, 70, (o) => {
        if (o !== e && !o.def.boss && Math.hypot(o.x - e.x, o.y - e.y) <= 70) o.hasteT = Math.max(o.hasteT, 1.6)
      })
      this.events.push({ t: 'bossSkill', e: e.def.id, x: e.x, y: e.y, skill: 'ring' })
    } else {
      e.skillCd = 3.4
      if (this.enemies.length < MAX_ENEMIES - 30) this.spawn('wisp', { x: e.x + this.rng.range(-12, 12), y: e.y + this.rng.range(-8, 8) })
      this.events.push({ t: 'bossSkill', e: e.def.id, x: e.x, y: e.y, skill: 'print' })
    }
  }

  private bossBrain(e: Enemy): void {
    const skills = e.def.skills ?? []
    const enraged = e.hp / e.maxHp < 0.3
    skills.forEach((s, i) => {
      e.skillT[i] -= DT * (enraged ? 1.55 : 1)
      if (e.skillT[i] > 0) return
      e.skillT[i] = s.cd
      this.useSkill(e, s)
    })
  }

  private useSkill(e: Enemy, s: BossSkill): void {
    const say = (skill: string, slot?: number): void => void this.events.push({ t: 'bossSkill', e: e.def.id, x: e.x, y: e.y, skill, slot })
    switch (s.k) {
      case 'summon':
        say('summon')
        if (this.enemies.length >= MAX_ENEMIES - 20) return
        for (let i = 0; i < s.n; i++) this.spawn(s.unit, { x: e.x + this.rng.range(-40, 40), y: e.y + this.rng.range(-26, 26) })
        return
      case 'volley':
        say('volley')
        // 발수가 많아도 한 번의 일제 사격 총량은 같게 나눈다
        for (let i = 0; i < s.n; i++) this.enemyShoot(e, s.shot, 125, (i - (s.n - 1) / 2) * s.spread, 0.5 / s.n)
        return
      case 'shield':
        e.shield = s.t
        say('shield')
        return
      case 'charge':
        e.dashT = 0.6
        say('charge')
        return
      case 'heal':
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * s.pct)
        say('heal')
        return
      case 'blink': {
        // 탑 둘레 다른 곳으로 순간이동
        const a = this.rng.range(0, Math.PI * 2)
        const d = e.def.stand ?? 90
        say('blink')
        e.x = Math.max(50, Math.min(W - 50, TOWER.x + Math.cos(a) * d * 1.5))
        e.y = Math.max(120, Math.min(H - 16, TOWER.y + Math.sin(a) * d))
        e.face = e.x < TOWER.x ? 1 : -1
        say('blink')
        return
      }
      case 'jam': {
        if (!this.weapons.length) return
        const slot = this.rng.int(this.weapons.length)
        this.weapons[slot].cd = Math.max(this.weapons[slot].cd, 2.4)
        say('jam', slot)
        return
      }
      case 'seal':
        this.stampCd = Math.max(this.stampCd, 3)
        say('seal')
        return
    }
  }

  private enemyShoot(e: Enemy, kind: ShotKind, speed: number, spread = 0, dmgK = 1): void {
    const a = Math.atan2(TOWER.y - e.y, TOWER.x - e.x) + spread
    this.enemyShots.push({ id: this.nextId++, x: e.x, y: e.y - 8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: e.dmg * dmgK, life: 3, kind })
  }

  private enemyShotTick(): void {
    for (const s of this.enemyShots) {
      s.x += s.vx * DT
      s.y += s.vy * DT
      s.life -= DT
      if (Math.hypot(s.x - TOWER.x, s.y - TOWER.y) < TOWER_R) {
        s.life = 0
        this.damageTower(s.dmg, s.x, s.y)
      }
    }
    this.enemyShots = this.enemyShots.filter((s) => s.life > 0)
  }

  private damageTower(d: number, x: number, y: number): void {
    const dmg = d * (1 - this.stats.armor)
    this.hp -= dmg
    this.shake = Math.max(this.shake, Math.min(0.35, 0.08 + dmg * 0.012))
    this.events.push({ t: 'towerHit', dmg, x, y })
  }

  // ───────── 무기 ─────────

  private nearest(x: number, y: number, range: number, exclude?: Set<number>): Enemy | null {
    let best: Enemy | null = null
    let bd = Infinity
    for (const e of this.enemies) {
      if (e.dead || (exclude && exclude.has(e.id))) continue
      const d = Math.hypot(e.x - x, e.y - y)
      if (d <= range + e.def.r && d < bd) (best = e), (bd = d)
    }
    return best
  }

  private rollCrit(base: number): { dmg: number; crit: boolean } {
    const crit = this.rng.chance(this.stats.crit)
    return { dmg: base * (crit ? 1 + this.stats.critDmg : 1), crit }
  }

  /** 슬롯별 무기가 달린 자리 (시계탑 둘레) */
  static mount(slot: number): { x: number; y: number } {
    const M = [
      [-34, 10], [34, 10], [-24, 24], [24, 24], [-40, -8], [40, -8]
    ]
    const p = M[slot] ?? M[0]
    return { x: TOWER.x + p[0], y: TOWER.y + p[1] }
  }

  private weaponTick(): void {
    this.weapons.forEach((w, slot) => this.fireWeapon(w, slot))
  }

  private fireWeapon(w: Weapon, slot: number): void {
    const def = WEAPON[w.id]
    const r = w.rank
    w.cd -= DT * (1 + this.stats.atk)
    const m = Sim.mount(slot)
    const range = def.range * (1 + this.stats.range)
    if (w.cd > 0) return
    const base = def.dmg * RANK_DMG[r] * (1 + this.stats.dmg)
    const cd = def.cd * RANK_CD[r]
    switch (def.kind) {
      case 'heal': {
        w.cd = cd
        if (this.hp < this.stats.maxHp) this.heal(atRank(def.heal, r))
        return
      }
      case 'shot':
      case 'pierce':
      case 'bounce':
      case 'splash':
      case 'homing': {
        const t = this.nearest(TOWER.x, TOWER.y, range)
        if (!t) return
        w.cd = cd
        this.launch(def, r, m.x, m.y, Math.atan2(t.y - m.y, t.x - m.x), base, t)
        this.events.push({ t: 'shoot', w: w.id, slot })
        return
      }
      case 'spread': {
        const t = this.nearest(TOWER.x, TOWER.y, range)
        if (!t) return
        w.cd = cd
        const n = atRank(def.count, r)
        const a0 = Math.atan2(t.y - m.y, t.x - m.x)
        for (let i = 0; i < n; i++) this.launch(def, r, m.x, m.y, a0 + (i - (n - 1) / 2) * 0.17, base, null)
        this.events.push({ t: 'shoot', w: w.id, slot })
        return
      }
      case 'orb': {
        const t = this.nearest(TOWER.x, TOWER.y, range)
        if (!t) return
        w.cd = cd
        this.launch(def, r, m.x, m.y, Math.atan2(t.y - m.y, t.x - m.x), base, null)
        this.events.push({ t: 'shoot', w: w.id, slot })
        return
      }
      case 'cone': {
        const t = this.nearest(m.x, m.y, range)
        if (!t) {
          w.aim = null
          return
        }
        w.cd = cd
        w.aim = { x: t.x, y: t.y }
        const a0 = Math.atan2(t.y - m.y, t.x - m.x)
        this.near(m.x, m.y, range + 20, (e) => {
          const d = Math.hypot(e.x - m.x, e.y - m.y)
          if (d > range + e.def.r) return
          let da = Math.atan2(e.y - m.y, e.x - m.x) - a0
          while (da > Math.PI) da -= Math.PI * 2
          while (da < -Math.PI) da += Math.PI * 2
          if (Math.abs(da) > 0.42) return
          const c = this.rollCrit(base)
          this.hurt(e, c.dmg, c.crit, w.id)
          this.applyBurn(e, def.burn ?? 0, r)
        })
        this.events.push({ t: 'cone', w: slot, x: m.x, y: m.y, ax: t.x, ay: t.y })
        return
      }
      case 'nova': {
        const hit: Enemy[] = []
        for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - TOWER.x, e.y - TOWER.y) <= range + e.def.r) hit.push(e)
        if (!hit.length) return
        w.cd = cd
        for (const e of hit) {
          const c = this.rollCrit(base)
          this.hurt(e, c.dmg, c.crit, w.id)
          this.applySlow(e, (def.slow ?? 0) + this.stats.slow, def.dur ?? 2)
        }
        this.events.push({ t: 'nova', x: TOWER.x, y: TOWER.y, r: range, w: w.id })
        return
      }
      case 'chain': {
        const first = this.nearest(TOWER.x, TOWER.y, range)
        if (!first) return
        w.cd = cd
        const n = atRank(def.chains, r) + this.stats.chain
        const seen = new Set<number>()
        const pts: [number, number][] = [[m.x, m.y]]
        let cur: Enemy | null = first
        let dmg = base
        for (let i = 0; i < n && cur; i++) {
          seen.add(cur.id)
          pts.push([cur.x, cur.y - 6])
          const c = this.rollCrit(dmg)
          const at: Enemy = cur
          this.hurt(at, c.dmg, c.crit, w.id)
          dmg *= 0.86
          cur = this.nearest(at.x, at.y, 74, seen)
        }
        this.events.push({ t: 'bolt', pts, w: w.id })
        return
      }
      case 'aura': {
        const all = this.enemies.filter((e) => !e.dead && Math.hypot(e.x - TOWER.x, e.y - TOWER.y) <= range + e.def.r)
        if (!all.length) return
        w.cd = cd
        all.sort((a, b) => Math.hypot(a.x - TOWER.x, a.y - TOWER.y) - Math.hypot(b.x - TOWER.x, b.y - TOWER.y))
        for (const e of all.slice(0, atRank(def.count, r) + this.stats.chain)) {
          const c = this.rollCrit(base)
          this.events.push({ t: 'bolt', pts: [[TOWER.x, TOWER.y - 34], [e.x, e.y - 6]], w: w.id })
          this.hurt(e, c.dmg, c.crit, w.id)
        }
        return
      }
      case 'cloud': {
        const t = this.nearest(TOWER.x, TOWER.y, range)
        if (!t) return
        w.cd = cd
        const radius = atRank(def.splash, r) * (1 + this.stats.splash)
        this.zones.push({ id: this.nextId++, w: w.id, x: t.x, y: t.y, r: radius, dps: base * (1 + this.stats.dark), t: 0, life: def.dur ?? 4, cd: 0 })
        this.events.push({ t: 'shoot', w: w.id, slot })
        return
      }
      case 'smite': {
        let best: Enemy | null = null
        for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - TOWER.x, e.y - TOWER.y) <= range + e.def.r && (!best || e.hp > best.hp)) best = e
        if (!best) return
        w.cd = cd
        const radius = atRank(def.splash, r) * (1 + this.stats.splash)
        const c = this.rollCrit(base)
        this.hurt(best, c.dmg, c.crit, w.id)
        const bx = best.x
        const by = best.y
        for (const e of this.enemies) if (!e.dead && e !== best && Math.hypot(e.x - bx, e.y - by) <= radius + e.def.r) this.hurt(e, c.dmg * 0.4, c.crit, w.id)
        this.events.push({ t: 'smite', x: bx, y: by, r: radius })
        return
      }
      case 'firework': {
        const alive = this.enemies.filter((e) => !e.dead && Math.hypot(e.x - TOWER.x, e.y - TOWER.y) <= range + e.def.r)
        if (!alive.length) return
        w.cd = cd
        const radius = atRank(def.splash, r) * (1 + this.stats.splash)
        const n = atRank(def.count, r)
        for (let i = 0; i < n; i++) {
          const t = this.rng.pick(alive)
          this.explode(t.x, t.y, radius, base, w.id, def.burn ?? 0, r)
          this.events.push({ t: 'firework', x: t.x, y: t.y, r: radius })
        }
        return
      }
    }
  }

  private launch(def: WeaponDef, r: number, x: number, y: number, a: number, dmg: number, target: Enemy | null): void {
    const speed = def.speed ?? 300
    const c = this.rollCrit(dmg)
    const p: Projectile = {
      id: this.nextId++, w: def.id, rank: r, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: c.dmg, crit: c.crit,
      life: def.kind === 'orb' ? (def.dur ?? 4) : 1.6, pierce: 0, bounces: 0, splash: 0, burn: def.burn ?? 0, freeze: def.freeze ?? 0, homing: 0,
      tx: null, ty: 0, hit: new Set(), tick: new Map()
    }
    if (def.kind === 'bounce') p.bounces = atRank(def.bounces, r) + this.stats.bounce
    if (def.kind === 'pierce') p.pierce = atRank(def.pierce, r) + this.stats.pierce
    if (def.kind === 'shot' || def.kind === 'spread') p.pierce = this.stats.pierce
    if (def.kind === 'splash' || def.kind === 'homing' || def.kind === 'orb') p.splash = atRank(def.splash, r) * (1 + this.stats.splash)
    if (def.kind === 'homing' && target) {
      p.homing = target.id
      p.life = 3
    }
    if (def.kind === 'splash' && target) {
      p.tx = target.x
      p.ty = target.y
      const d = Math.hypot(target.x - x, target.y - y)
      p.life = d / speed
    }
    this.projectiles.push(p)
  }

  private projectileTick(): void {
    for (const p of this.projectiles) {
      if (p.homing) {
        const t = this.enemies.find((e) => e.id === p.homing && !e.dead) ?? this.nearest(p.x, p.y, 220)
        if (t) {
          p.homing = t.id
          const speed = Math.hypot(p.vx, p.vy)
          const want = Math.atan2(t.y - p.y, t.x - p.x)
          const cur = Math.atan2(p.vy, p.vx)
          let da = want - cur
          while (da > Math.PI) da -= Math.PI * 2
          while (da < -Math.PI) da += Math.PI * 2
          const a = cur + Math.max(-6 * DT, Math.min(6 * DT, da))
          p.vx = Math.cos(a) * speed
          p.vy = Math.sin(a) * speed
        }
      }
      p.x += p.vx * DT
      p.y += p.vy * DT
      p.life -= DT
      if (p.tx !== null) {
        // 커피 폭탄: 도착하면 터진다
        if (p.life <= 0) this.explode(p.x, p.y, p.splash, p.dmg, p.w, p.burn, p.rank)
        continue
      }
      if (WEAPON[p.w].kind === 'orb') {
        this.near(p.x, p.y, p.splash + 16, (e) => {
          if (Math.hypot(e.x - p.x, e.y - p.y) > p.splash + e.def.r) return
          const last = p.tick.get(e.id) ?? -9
          if (this.time - last < 0.35) return
          p.tick.set(e.id, this.time)
          this.hurt(e, p.dmg * (1 + this.stats.dark), p.crit, p.w)
        })
        continue
      }
      let spent = false
      this.near(p.x, p.y, 20, (e) => {
        if (spent || p.hit.has(e.id)) return
        if (Math.hypot(e.x - p.x, e.y - p.y) > e.def.r + 3) return
        p.hit.add(e.id)
        if (WEAPON[p.w].kind === 'homing') {
          this.explode(p.x, p.y, p.splash, p.dmg, p.w, 0, p.rank)
          p.life = 0
          spent = true
          return
        }
        this.hurt(e, p.dmg, p.crit, p.w)
        if (p.freeze && this.rng.chance(p.freeze)) e.freezeT = Math.max(e.freezeT, 0.9)
        if (p.bounces > 0) {
          p.bounces--
          const next = this.nearest(e.x, e.y, 110, p.hit)
          if (next) {
            const a = Math.atan2(next.y - p.y, next.x - p.x)
            const sp = Math.hypot(p.vx, p.vy)
            p.vx = Math.cos(a) * sp
            p.vy = Math.sin(a) * sp
            p.life = Math.max(p.life, 0.7)
            p.dmg *= 0.9
            spent = true
            return
          }
          p.life = 0
          spent = true
          return
        }
        if (p.pierce > 0) {
          p.pierce--
          return
        }
        p.life = 0
        spent = true
      })
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0 && p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40)
  }

  private zoneTick(): void {
    for (const z of this.zones) {
      z.t += DT
      z.cd -= DT
      if (z.cd > 0) continue
      z.cd = 0.25
      this.near(z.x, z.y, z.r + 16, (e) => {
        if (Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.def.r) return
        e.poisonT = Math.max(e.poisonT, 1)
        e.poisonDps = Math.max(e.poisonDps, z.dps)
      })
    }
    this.zones = this.zones.filter((z) => z.t < z.life)
  }

  private explode(x: number, y: number, r: number, dmg: number, w: string, burn: number, rank: number): void {
    this.events.push({ t: 'splash', x, y, r, w })
    for (const e of this.enemies) {
      if (e.dead || Math.hypot(e.x - x, e.y - y) > r + e.def.r) continue
      this.hurt(e, dmg, false, w)
      if (burn) this.applyBurn(e, burn, rank)
    }
  }

  private applyBurn(e: Enemy, dps: number, rank: number): void {
    if (dps <= 0) return
    e.burnT = 2.4
    e.burnDps = Math.max(e.burnDps, dps * RANK_DMG[rank] * (1 + this.stats.burn) * (1 + this.stats.dmg))
  }

  private applySlow(e: Enemy, k: number, t: number): void {
    e.slowT = Math.max(e.slowT, t)
    e.slowK = Math.min(0.8, Math.max(e.slowK, k))
  }

  private hurt(e: Enemy, dmg: number, crit: boolean, w: string): void {
    if (e.dead) return
    if (e.phased) {
      this.events.push({ t: 'miss', x: e.x, y: e.y - 10 })
      return
    }
    let d = dmg
    if (e.def.armor) d *= 1 - e.def.armor
    if (e.shield > 0) d *= 0.15
    if (e.freezeT > 0) d *= 1 + this.stats.freezeAmp
    e.flash = 1
    this.events.push({ t: 'hit', x: e.x, y: e.y - 6, w, crit, dmg: d })
    this.applyDamage(e, d, w)
  }

  private applyDamage(e: Enemy, d: number, w: string): void {
    if (e.dead) return
    e.hp -= d
    this.dealtTotal += d
    const owner = this.weapons.find((x) => x.id === w)
    if (owner) owner.dealt += d
    if (e.hp <= 0) this.kill(e, w)
  }

  private kill(e: Enemy, w: string): void {
    e.dead = true
    this.kills++
    const coin = Math.max(1, Math.round(e.def.coin * 0.6 * (1 + this.stats.coin) * (1 + this.round * 0.04)))
    this.coins += coin
    this.earned += coin
    this.ultCharge = Math.min(100, this.ultCharge + (e.def.boss ? 30 : 0.8) * (1 + this.stats.ult))
    if (this.stats.killHeal) this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.killHeal)
    this.events.push({ t: 'kill', x: e.x, y: e.y, e: e.def.id, coin, w })
    if (e.def.split) for (let i = 0; i < 2; i++) this.spawn(e.def.split, { x: e.x + this.rng.range(-10, 10), y: e.y + this.rng.range(-8, 8) })
    if (e.def.jamOnDeath && this.weapons.length) {
      const slot = this.rng.int(this.weapons.length)
      this.weapons[slot].cd = Math.max(this.weapons[slot].cd, 1.2)
      this.events.push({ t: 'bossSkill', e: e.def.id, x: e.x, y: e.y, skill: 'jam', slot })
    }
    if (this.bossAlive === e) this.bossAlive = null
  }

  /** 결과 화면에 줄 월급 */
  salary(): number {
    const k = this.mode.salary
    if (this.day.endless) return Math.round((this.day.salary * this.round + this.kills * 0.1) * k)
    const base = this.day.salary
    if (this.phase === 'win') return Math.round((base + this.kills * 0.1) * k)
    return Math.round((base * 0.5 * (this.round / ROUNDS) + this.kills * 0.05) * k)
  }

  // ───────── 저장 (쉬는 시간에만) ─────────

  serialize(): SimSave {
    return {
      v: 2, day: this.day.id, mode: this.mode.id, seed: this.seed, rng: this.rng.s, round: this.round, coins: this.coins, hp: this.hp,
      weapons: this.weapons.map((w) => ({ id: w.id, rank: w.rank, dealt: w.dealt })), items: { ...this.items },
      offers: this.offers.map((o) => ({ ...o })), rerollCount: this.rerollCount, freeRerolls: this.freeRerolls, ultCharge: this.ultCharge,
      kills: this.kills, earned: this.earned, lunch: this.lunch, meta: this.meta
    }
  }

  private restore(s: SimSave): void {
    this.rng.s = s.rng
    this.round = s.round
    this.coins = s.coins
    this.weapons = s.weapons.map((w) => ({ id: w.id, rank: w.rank, cd: 0, aim: null, dealt: w.dealt }))
    this.items = { ...s.items }
    this.offers = s.offers.map((o) => ({ ...o }))
    this.rerollCount = s.rerollCount
    this.freeRerolls = s.freeRerolls
    this.ultCharge = s.ultCharge
    this.kills = s.kills
    this.earned = s.earned
    this.lunch = s.lunch
    this.meta = s.meta
    this.phase = 'shop'
    this.recalc()
    this.hp = Math.min(this.stats.maxHp, s.hp)
  }
}
