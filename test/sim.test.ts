// 게임 규칙 시험 + 자동 플레이 밸런스 측정. BAL=1 이면 요일별 판수를 늘려 승률표만 낸다.
import { ALL_BOSSES, ALL_UNITS, BOSS_ROUNDS, DAYS, ENDLESS_DAY, ENEMIES, MAX_RANK, MODE_ORDER, MODES, ROUNDS, SLOTS, waveFor, WEAPON, WEAPONS, ITEMS, PERKS, type ModeId } from '@/game/defs'
import { autoPick, autoShop, autoStamp, autoUlt } from '@/game/autoplay'
import { Sim, type Meta } from '@/game/sim'

let failed = 0
function check(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failed++
}

const noMeta: Meta = { perks: {} }
const fullMeta: Meta = { perks: Object.fromEntries(PERKS.map((p) => [p.id, p.max])) }

function finite(sim: Sim): boolean {
  return (
    Number.isFinite(sim.hp) && Number.isFinite(sim.coins) &&
    sim.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.hp)) &&
    sim.projectiles.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  )
}

interface Result { win: boolean; round: number; secs: number; ok: boolean; maxEnemies: number; hp: number; kills: number; salary: number; stuck: boolean; maxRoundSecs: number }

function play(day: number, seed: number, meta: Meta, withStamp = true, mode: ModeId = 'normal'): Result {
  const sim = new Sim({ day, mode, meta, seed })
  autoPick(sim)
  let steps = 0
  let ok = true
  let maxEnemies = 0
  let maxRoundSecs = 0
  const LIMIT = 60 * 60 * 40
  while ((sim.phase === 'wave' || sim.phase === 'shop') && steps < LIMIT) {
    if (sim.phase === 'shop') {
      autoShop(sim)
      sim.backToWork()
      continue
    }
    if (withStamp) {
      autoStamp(sim)
      autoUlt(sim)
    }
    sim.tick()
    sim.events.length = 0
    steps++
    maxEnemies = Math.max(maxEnemies, sim.enemies.length)
    maxRoundSecs = Math.max(maxRoundSecs, sim.roundTime)
    if (steps % 120 === 0 && !finite(sim)) ok = false
  }
  return { win: sim.phase === 'win', round: sim.round, secs: steps / 60, ok, maxEnemies, hp: sim.hp, kills: sim.kills, salary: sim.salary(), stuck: steps >= LIMIT, maxRoundSecs }
}

function winTable(meta: Meta, label: string, games: number, mode: ModeId = 'normal'): number[] {
  const rates: number[] = []
  console.log(`\n── ${MODES[mode].name} · ${label} (${games}판씩)`)
  for (const d of DAYS) {
    if (d.endless) continue
    const res = Array.from({ length: games }, (_, i) => play(d.id, 1000 + i * 7, meta, true, mode))
    const wins = res.filter((r) => r.win).length
    const avgRound = res.reduce((a, r) => a + r.round, 0) / games
    const avgMin = res.reduce((a, r) => a + r.secs, 0) / games / 60
    const maxE = Math.max(...res.map((r) => r.maxEnemies))
    rates.push(wins / games)
    console.log(`${d.name}: 승률 ${String(Math.round((wins / games) * 100)).padStart(3)}% · 평균 도달 ${avgRound.toFixed(1)}라운드 · 전투 ${avgMin.toFixed(1)}분 · 최다 적 ${maxE}`)
  }
  return rates
}

if (process.env.BAL === '1') {
  const n = Number(process.env.N ?? 30)
  const half: Meta = { perks: Object.fromEntries(PERKS.map((p) => [p.id, Math.ceil(p.max / 2)])) }
  // ONLY=normal,hard 처럼 난이도를 고르고, META=none,half,full 로 복지 단계를 고른다
  const modes = (process.env.ONLY?.split(',') as ModeId[] | undefined) ?? MODE_ORDER
  const metas = process.env.META?.split(',') ?? ['none', 'half', 'full']
  for (const m of modes) {
    if (metas.includes('none')) winTable(noMeta, '복지 없음', n, m)
    if (metas.includes('half')) winTable(half, '복지 절반', n, m)
    if (metas.includes('full')) winTable(fullMeta, '복지 전부', n, m)
  }
  process.exit(0)
}

// ───────── 데이터 ─────────
check('하루 27라운드', ROUNDS === 27)
check('보스 15종·유닛 25종 이상', ALL_BOSSES.length === 15 && ALL_UNITS.length >= 25, `보스 ${ALL_BOSSES.length} · 유닛 ${ALL_UNITS.length}`)
check('요일마다 보스 3종, 겹치지 않음', new Set(DAYS.filter((d) => !d.endless).flatMap((d) => d.bosses)).size === 15)
for (const d of DAYS) {
  if (d.endless) continue
  check(`${d.name} 보스는 11:59·14:59·17:59`, BOSS_ROUNDS.every((r, i) => waveFor(d.id, r).boss === d.bosses[i]))
  const seen = new Set<string>()
  for (let r = 0; r < ROUNDS; r++) for (const [u] of waveFor(d.id, r).mix) seen.add(u)
  const missing = d.roster.filter(([u]) => !seen.has(u)).map(([u]) => u)
  check(`${d.name} 명단의 유닛이 모두 등장`, missing.length === 0, missing.join())
}
check('모든 웨이브에 적이 있음', DAYS.every((d) => Array.from({ length: 27 }, (_, r) => waveFor(d.id, r)).every((w) => w.mix.length > 0 && w.mix.every(([, n]) => n >= 1))))
check('요일마다 구성이 다름', JSON.stringify(waveFor(0, 12)) !== JSON.stringify(waveFor(3, 12)))
check('무기 15종·복지 카드 20종 이상', WEAPONS.length === 15 && ITEMS.length >= 20)

// ───────── 쇼핑 규칙 ─────────
{
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 5 })
  check('시작 무기 후보 3개, 서로 다름', new Set(s.starters).size === 3)
  check('시작 후보에 회복 전용 무기 없음', s.starters.every((id) => WEAPON[id].kind !== 'heal'))
  const first = s.starters[0]
  s.pickStarter('없는무기')
  check('후보가 아닌 무기는 못 고른다', s.weapons.length === 0)
  s.pickStarter(first)
  check('첫 무기를 고르면 1라운드 시작', s.phase === 'wave' && s.weapons.length === 1)

  s.phase = 'shop'
  s.coins = 500
  s.offers = [{ kind: 'weapon', id: first, price: 5, sold: false }]
  s.buy(0)
  check('같은 무기를 사면 승진', s.weapons.length === 1 && s.weapons[0].rank === 1)
  check('팔린 카드는 다시 못 산다', !s.canBuy(0))

  s.weapons = []
  for (let i = 0; i < SLOTS; i++) s.weapons.push({ id: WEAPONS[i].id, rank: MAX_RANK, cd: 0, aim: null, dealt: 0 })
  s.offers = [
    { kind: 'weapon', id: WEAPONS[SLOTS].id, price: 1, sold: false },
    { kind: 'weapon', id: WEAPONS[0].id, price: 1, sold: false }
  ]
  check('칸이 꽉 차면 새 무기를 못 산다', !s.canBuy(0))
  check('이사는 더 승진 못 한다', !s.canBuy(1))
  const c0 = s.coins
  const value = s.sellValue(0)
  check('팔면 돈이 돌아온다', s.sell(0) && s.coins === c0 + value && value > 0)

  s.weapons = [{ id: 'wellness', rank: 0, cd: 0, aim: null, dealt: 0 }, { id: 'stapler', rank: 0, cd: 0, aim: null, dealt: 0 }]
  check('마지막 공격 무기는 못 판다', !s.canSell(1) && s.canSell(0))
}

// ───────── 시너지 ─────────
{
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 6 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 0, aim: null, dealt: 0 }]
  s.recalc()
  const a = s.stats.atk
  s.weapons.push({ id: 'card', rank: 0, cd: 0, aim: null, dealt: 0 })
  s.recalc()
  check('총무팀 2개면 공격 속도 +12%', Math.abs(s.stats.atk - a - 0.12) < 1e-9)
  s.weapons.push({ id: 'copier', rank: 0, cd: 0, aim: null, dealt: 0 }, { id: 'quick', rank: 0, cd: 0, aim: null, dealt: 0 })
  s.recalc()
  check('4개면 높은 단계만 적용', Math.abs(s.stats.atk - a - 0.3) < 1e-9 && s.stats.pierce === 1)
}

// ───────── 무기 전 종이 실제로 피해를 준다 ─────────
for (const w of WEAPONS) {
  if (w.kind === 'heal') continue
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 7 })
  s.weapons = [{ id: w.id, rank: 0, cd: 0, aim: null, dealt: 0 }]
  s.recalc()
  s.startRound()
  s.spawnQueue = []
  const e = s.spawn('golem', { x: 240 + 60, y: 172 })
  e.hp = e.maxHp = 100000
  e.speed = 0
  for (let i = 0; i < 60 * 8; i++) {
    s.tick()
    s.events.length = 0
  }
  check(`${w.name} 이(가) 8초 안에 피해를 줌`, e.hp < e.maxHp, `${Math.round(e.maxHp - e.hp)}`)
}

// ───────── 상호작용 ─────────
{
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 8 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 99, aim: null, dealt: 0 }]
  s.recalc()
  s.startRound()
  s.spawnQueue = []
  s.roundSecs = 9999
  const e = s.spawn('golem', { x: 100, y: 100 })
  const hp0 = e.hp
  check('결재 도장이 적에게 맞음', s.stamp(100, 100) && e.hp < hp0)
  check('도장은 재사용 대기', !s.stamp(100, 100))
  s.ultCharge = 100
  const hp1 = e.hp
  check('사직서 발동', s.ult() && e.hp < hp1 && s.ultCharge === 0)
  check('충전 전에는 사직서 못 씀', !s.ult())
}
{
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 9 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 99, aim: null, dealt: 0 }]
  s.recalc()
  s.startRound()
  s.spawnQueue = []
  s.roundSecs = 9999
  const e = s.spawn('ghost', { x: 100, y: 100 })
  e.age = 2.6
  e.phased = true
  const hp = e.hp
  ;(s as unknown as { hurt: (a: unknown, b: number, c: boolean, d: string) => void }).hurt(e, 10, false, 'stapler')
  check('투명해진 유령은 안 맞는다', e.hp === hp && s.events.some((v) => v.t === 'miss'))
}
{
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 10 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 99, aim: null, dealt: 0 }]
  s.recalc()
  s.startRound()
  s.spawnQueue = []
  const e = s.spawn('slime', { x: 100, y: 100 })
  e.hp = 1
  ;(s as unknown as { hurt: (a: unknown, b: number, c: boolean, d: string) => void }).hurt(e, 10, false, 'stapler')
  check('슬라임이 죽으면 메일 2통이 나온다', s.enemies.filter((x) => x.def.id === 'wisp').length === 2)
}

// ───────── 보스·시계 ─────────
{
  const s = new Sim({ day: 0, mode: 'normal', meta: noMeta, seed: 11 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 99, aim: null, dealt: 0 }]
  s.recalc()
  s.round = BOSS_ROUNDS[0]
  s.startRound()
  s.spawnQueue = []
  for (let i = 0; i < 60 * 12; i++) {
    s.hp = s.stats.maxHp
    s.tick()
    s.events.length = 0
  }
  check('보스가 나온다', !!s.bossAlive)
  check('보스 라운드 시계는 11:59 에 멈춘다', Math.floor(s.clockMinutes()) === 11 * 60 + 59, `${s.clockMinutes()}`)
}
// 보스 15종 + 유닛 전부: 잠깐 돌려서 이상이 없는지
for (const id of ALL_BOSSES) {
  const s = new Sim({ day: 4, mode: 'hell', meta: noMeta, seed: 13 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 99, aim: null, dealt: 0 }, { id: 'coil', rank: 0, cd: 99, aim: null, dealt: 0 }]
  s.recalc()
  s.startRound()
  s.spawnQueue = []
  s.roundSecs = 9999
  const e = s.spawn(id)
  s.bossAlive = e
  const skillEvents = new Set<string>()
  for (let i = 0; i < 60 * 40; i++) {
    s.hp = s.stats.maxHp
    s.tick()
    for (const v of s.events) if (v.t === 'bossSkill' && v.e === id) skillEvents.add(v.skill)
    s.events.length = 0
  }
  const want = new Set((ENEMIES[id].skills ?? []).map((k) => k.k === 'seal' ? 'seal' : k.k))
  const missing = [...want].filter((k) => !skillEvents.has(k))
  check(`${ENEMIES[id].name}: 스킬 사용·좌표 정상`, finite(s) && missing.length === 0 && e.x > -60 && e.x < 540, missing.join())
}
{
  const s = new Sim({ day: 3, mode: 'normal', meta: noMeta, seed: 14 })
  s.weapons = [{ id: 'stapler', rank: 0, cd: 99, aim: null, dealt: 0 }]
  s.recalc()
  s.coins = 50
  s.round = 10
  s.startRound()
  s.spawnQueue = []
  s.roundSecs = 9999
  const b = s.spawn('bird', { x: 260, y: 172 })
  for (let i = 0; i < 120 && !b.fleeing; i++) { s.tick(); s.events.length = 0 }
  check('비둘기가 수당을 훔쳐 달아남', b.fleeing && s.coins < 50, `남은 수당 ${s.coins}`)
  for (let i = 0; i < 400 && !b.dead; i++) { s.tick(); s.events.length = 0 }
  check('달아난 비둘기는 처치로 안 친다', b.dead && s.kills === 0)
  const p = s.spawn('phone', { x: 100, y: 100 })
  const k = s.spawn('knight', { x: 110, y: 100 })
  p.skillCd = 0
  for (let i = 0; i < 5; i++) { s.tick(); s.events.length = 0 }
  check('전화기가 주변을 재촉', k.hasteT > 0)
  const c = s.spawn('copybot', { x: 400, y: 100 })
  c.skillCd = 0
  const n0 = s.enemies.length
  for (let i = 0; i < 5; i++) { s.tick(); s.events.length = 0 }
  check('복사 로봇이 메일을 찍어 냄', s.enemies.length > n0)
  s.weapons[0].cd = 0
  const pcx = s.spawn('pc', { x: 300, y: 100 })
  pcx.hp = 1
  ;(s as unknown as { hurt: (a: unknown, b: number, c: boolean, d: string) => void }).hurt(pcx, 10, false, 'stapler')
  check('블루스크린 PC가 죽으면 장비가 멈춤', s.weapons[0].cd >= 1.2)
}

// ───────── 난이도·무한 야근 ─────────
{
  const hp = (m: ModeId): number => {
    const s = new Sim({ day: 0, mode: m, meta: noMeta, seed: 15 })
    s.startRound()
    return s.spawn('golem', { x: 10, y: 10 }).maxHp
  }
  check('난이도마다 적 체력이 다름', hp('easy') < hp('normal') && hp('normal') < hp('hard') && hp('hard') < hp('hell'))
  const s = new Sim({ day: ENDLESS_DAY, mode: 'normal', meta: fullMeta, seed: 16 })
  autoPick(s)
  let g = 0
  while (s.phase === 'wave' || s.phase === 'shop') {
    if (s.phase === 'shop') { autoShop(s); s.backToWork(); continue }
    autoStamp(s); autoUlt(s); s.tick(); s.events.length = 0
    if (++g > 60 * 60 * 90) break
  }
  check('무한 야근은 18시를 넘어 계속됨', s.round > ROUNDS || s.phase === 'lose', `${s.round + 1}라운드`)
  check('무한 야근은 승리 없이 끝남', s.phase === 'lose')
  check('무한 야근도 월급 지급', s.salary() > 0, `${s.salary()}`)
}

// ───────── 저장 ─────────
{
  const s = new Sim({ day: 2, mode: 'normal', meta: noMeta, seed: 12 })
  autoPick(s)
  while (s.phase === 'wave') {
    autoStamp(s)
    s.tick()
    s.events.length = 0
  }
  if (s.phase === 'shop') {
    const save = JSON.parse(JSON.stringify(s.serialize()))
    const r = new Sim({ day: save.day, mode: save.mode, meta: save.meta, seed: save.seed, save })
    check('쉬는 시간 저장·복원', r.phase === 'shop' && r.round === s.round && r.coins === s.coins && r.hp === s.hp && r.weapons.length === s.weapons.length && r.offers.length === s.offers.length)
    autoShop(s)
    autoShop(r)
    check('복원 뒤 같은 입력이면 같은 결과', s.coins === r.coins && s.weapons.map((w) => w.id).join() === r.weapons.map((w) => w.id).join())
  } else check('쉬는 시간 저장·복원', false, '1라운드도 못 넘김')
}

// ───────── 결정성 · 온전함 ─────────
{
  const a = play(1, 42, noMeta)
  const b = play(1, 42, noMeta)
  check('같은 시드면 같은 결과', a.kills === b.kills && a.round === b.round && a.hp === b.hp)
  const many = Array.from({ length: 30 }, (_, i) => play(i % 5, 500 + i, noMeta))
  check('30판 동안 NaN 없음', many.every((r) => r.ok))
  check('30판 모두 끝남', many.every((r) => !r.stuck))
}

const rates = winTable(noMeta, '복지 없음', 20)
check('월요일은 자동 근무로도 깰 수 있다', rates[0] >= 0.5, `${Math.round(rates[0] * 100)}%`)
check('금요일은 복지 없이는 어렵다', rates[4] <= 0.4, `${Math.round(rates[4] * 100)}%`)

console.log(failed ? `\n실패 ${failed}건` : '\n모두 통과')
process.exit(failed ? 1 : 0)
