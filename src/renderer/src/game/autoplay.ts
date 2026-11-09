// 자동 근무: 쉬는 시간의 쇼핑과 결재 도장을 대신한다. 설정의 「자동 근무」와 밸런스 시험이 같이 쓴다.
import { DEPTS, ITEM, MAX_RANK, SLOTS, WEAPON, type Dept } from './defs'
import type { Sim } from './sim'

const ITEM_VALUE: Record<string, number> = {
  grade_b: 6, grade_a: 11, grade_s: 20, incentive: 34, americano: 6, extrashot: 11, energy: 18, keyboard: 5, highlight: 7, dual: 7, checkup: 5, gym: 8, walk: 5, overpay: 7, savings: 6, corpcard: 4, stamp: 2,
  ink: 2, draft: 3, wallet: 3, needle: 4, flask: 3, fan: 3, powerstrip: 3, nightsnack: 3, blast: 4, tonic: 0
}

function score(sim: Sim, i: number): number {
  const o = sim.offers[i]
  if (!o || o.sold) return -1
  if (o.kind === 'item') {
    const low = sim.hp / sim.stats.maxHp
    if (o.id === 'tonic') return low < 0.55 ? 40 : 0
    if (o.id === 'checkup') return low < 0.5 ? 16 : ITEM_VALUE.checkup
    return ((ITEM_VALUE[o.id] ?? 2) * (ITEM[o.id].rar + 1)) / 2
  }
  const def = WEAPON[o.id]
  const own = sim.weapons.find((w) => w.id === o.id)
  const counts = sim.deptCounts()
  const synergy = (d: Dept): number => (DEPTS[d].tiers.some((t) => t.n === counts[d] + 1) ? 8 : 0)
  if (own) return own.rank < MAX_RANK ? 30 + own.rank * 6 : -1
  if (sim.weapons.length >= SLOTS) return -1
  return 20 + def.rar * 6 + synergy(def.dept) + (def.kind === 'heal' ? -14 : 0)
}

export function autoPick(sim: Sim): void {
  const order = ['stapler', 'multitap', 'lance', 'card', 'bomb', 'copier', 'coil', 'jet', 'mold', 'aircon']
  const id = order.find((x) => sim.starters.includes(x)) ?? sim.starters[0]
  sim.pickStarter(id)
}

/** 쉬는 시간: 살 만한 것을 사고, 돈이 넉넉하면 새로고침한다 */
export function autoShop(sim: Sim): void {
  for (let pass = 0; pass < 8; pass++) {
    let bought = true
    while (bought) {
      bought = false
      const ranked = sim.offers.map((_, i) => i).sort((a, b) => score(sim, b) - score(sim, a))
      for (const i of ranked) {
        if (score(sim, i) >= 4 && sim.canBuy(i)) {
          sim.buy(i)
          bought = true
          break
        }
      }
    }
    if (sim.rerollPrice() === 0 || sim.coins >= sim.rerollPrice() + 22) sim.reroll()
    else break
  }
}

let lastStampAt = -1
/** 적이 가장 몰린 곳에 도장을 찍는다 */
export function autoStamp(sim: Sim): void {
  if (sim.stampCd > 0 || sim.phase !== 'wave' || sim.time === lastStampAt) return
  let best: { x: number; y: number } | null = null
  let bestN = 0
  for (let i = 0; i < sim.enemies.length; i += Math.max(1, Math.floor(sim.enemies.length / 24))) {
    const e = sim.enemies[i]
    let n = 0
    for (const o of sim.enemies) if (Math.hypot(o.x - e.x, o.y - e.y) < 36) n++
    if (n > bestN) (bestN = n), (best = { x: e.x, y: e.y })
  }
  if (best) sim.stamp(best.x, best.y)
  lastStampAt = sim.time
}

export function autoUlt(sim: Sim): void {
  if (!sim.ultReady()) return
  if (sim.bossAlive || sim.enemies.length > 26) sim.ult()
}
