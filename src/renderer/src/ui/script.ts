// 시험용 자동 조작 (PD_SCRIPT=tour). 화면을 차례로 띄워 저장하고, 후반부 프레임 시간을 잰다.
import { WEAPONS } from '../game/defs'
import { autoPick, autoShop } from '../game/autoplay'
import type { App } from './app'

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function strongBuild(app: App, n = 6): void {
  const sim = app.sim!
  sim.weapons = WEAPONS.filter((w) => w.kind !== 'heal').slice(0, 15).filter((_, i) => i % 2 === 0).slice(0, n).map((w) => ({ id: w.id, rank: 2, cd: 0, aim: null, dealt: 0 }))
  sim.items = { grade_s: 4, extrashot: 3 }
  sim.recalc()
  sim.hp = sim.stats.maxHp
}

async function jump(app: App, round: number): Promise<void> {
  const sim = app.sim!
  sim.round = round
  sim.phase = 'shop'
  sim.backToWork()
  app.view.reset()
  app.beginWave()
}

/** 실제 클릭·키 입력으로 처음부터 끝까지 지나가 본다 */
async function flow(app: App): Promise<void> {
  const d = window.desk
  let failed = 0
  const check = (name: string, ok: boolean, detail = ''): void => {
    d.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
    if (!ok) failed++
  }
  const q = (s: string): HTMLElement | null => document.querySelector<HTMLElement>(s)
  const click = async (s: string): Promise<boolean> => {
    const el = q(s)
    if (!el) return false
    el.click()
    await wait(60)
    return true
  }
  const key = (init: KeyboardEventInit): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
  }
  const toShop = async (): Promise<void> => {
    const s = app.sim!
    let g = 0
    while (s.phase === 'wave' && g++ < 60 * 200) {
      s.hp = s.stats.maxHp
      s.spawnQueue.length = 0
      s.roundTime = s.roundSecs + 1
      s.enemies.forEach((e) => (e.dead = true))
      s.enemies.length = 0
      s.tick()
    }
    await wait(120)
  }
  await wait(600)
  check('타이틀에서 시작', app.mode === 'title' && !!q('[data-a=start]'))
  check('잠긴 요일은 못 누름', (q('[data-a=day][data-v="1"]') as HTMLButtonElement).disabled)
  await click('[data-a=start]')
  check('출근하기 → 첫 무기 고르기', app.mode === 'pick' && document.querySelectorAll('[data-a=pickw]').length === 3)
  await click('[data-a=pickw]')
  const sim = app.sim!
  check('무기를 고르면 라운드 시작', app.mode === 'wave' && sim.weapons.length === 1)

  const canvas = q('#game')!
  const r = canvas.getBoundingClientRect()
  const down = new PointerEvent('pointerdown', { clientX: r.left + r.width * 0.7, clientY: r.top + r.height * 0.6, pointerId: 1, bubbles: true })
  canvas.setPointerCapture = () => {}
  canvas.dispatchEvent(down)
  await wait(120)
  canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }))
  check('화면을 누르면 결재 도장', sim.stampCd > 0, `대기 ${sim.stampCd.toFixed(2)}초`)

  sim.ultCharge = 100
  key({ code: 'Space', key: ' ' })
  await wait(60)
  check('Space 로 사직서', sim.ultCharge === 0)

  key({ key: 'p' })
  await wait(60)
  check('P 로 일시정지', app.mode === 'pause')
  const before = sim.roundTime
  await wait(300)
  check('일시정지 중 시간 멈춤', sim.roundTime === before)
  await click('[data-a=resume]')
  check('계속하기', app.mode === 'wave')

  const speed0 = app.settings.speed
  await click('[data-a=speed]')
  await wait(120)
  check('배속 버튼', app.settings.speed === (speed0 % 3) + 1, `x${app.settings.speed}`)
  await d.setSettings({ speed: 1 })
  app.settings.speed = 1

  await toShop()
  check('라운드가 끝나면 쉬는 시간', app.mode === 'shop' && sim.round === 1)
  check('쉬는 시간에 이어하기 저장', !!(await d.boot()).run)
  sim.coins = 500
  app.renderUi()
  const c0 = sim.coins
  await click('.card[data-a=buy]')
  check('카드를 누르면 구매', sim.coins < c0 && sim.offers[0].sold)
  const offers0 = JSON.stringify(sim.offers)
  await click('[data-a=reroll]')
  check('새로고침', JSON.stringify(sim.offers) !== offers0)
  if (sim.weapons.length < 2) sim.weapons.push({ id: sim.weapons[0].id === 'stapler' ? 'coil' : 'stapler', rank: 0, cd: 0, aim: null, dealt: 0 })
  app.renderUi()
  const w0 = sim.weapons.length
  await click('.slot .sell')
  check('무기 판매', sim.weapons.length === w0 - 1)

  key({ key: 'Escape' })
  await wait(60)
  check('쉬는 시간에도 일시정지', app.mode === 'pause')
  await click('[data-a=goto][data-v=settings]')
  check('일시정지 → 설정', app.mode === 'settings')
  const tr0 = app.settings.transparent
  await click('[data-a=set][data-v="bool:transparent"]')
  await wait(100)
  check('바닥 없애기 전환', app.settings.transparent === !tr0 && app.view.transparent === !tr0)
  await click('[data-a=set][data-v="bool:transparent"]')
  await wait(100)
  await click('[data-a=back]')
  check('설정 → 일시정지로', app.mode === 'pause')
  await click('[data-a=resume]')
  check('쉬는 시간으로 복귀', app.mode === 'shop')

  app.toggleDisguise()
  await wait(60)
  check('위장 화면 표시', !!q('#sheet'))
  sim.backToWork()
  app.beginWave()
  const rt = sim.roundTime
  await wait(250)
  check('위장 중에는 게임이 안 흐름', sim.roundTime === rt)
  app.toggleDisguise()
  await wait(60)
  check('위장 해제', !q('#sheet'))

  await toShop()
  await click('[data-a=next]')
  check('업무 복귀', app.mode === 'wave')

  sim.hp = 0
  await wait(200)
  check('멘탈 0 이면 결과 화면', app.mode === 'result' && !!q('.payslip .lose'))
  check('월급 지급', app.profile.salary > 0, `${app.profile.salary}`)
  check('끝나면 이어하기 삭제', (await d.boot()).run === null)
  await click('[data-a=home]')
  check('타이틀로', app.mode === 'title')

  app.profile.salary = 1000
  await click('[data-a=goto][data-v=perks]')
  check('복지 화면', app.mode === 'perks')
  await click('[data-a=perk][data-v=career]')
  check('복지 구매', app.profile.perks.career === 1 && app.profile.salary < 1000)
  await wait(100)
  check('복지 저장', (await d.boot()).profile.perks.career === 1)
  await click('[data-a=back]')

  // 이어하기
  await click('[data-a=start]')
  await click('[data-a=pickw]')
  await toShop()
  const round = app.sim!.round
  key({ key: 'p' })
  await wait(60)
  await click('[data-a=tohome]')
  await wait(150)
  check('타이틀에 이어서 출근 버튼', !!q('[data-a=continue]'))
  await click('[data-a=start]')
  check('출근하기를 누르면 확인 창', !!q('[data-a=confirmNew]') && app.mode === 'title' && !app.sim)
  check('확인 창에서는 저장이 그대로', !!(await d.boot()).run)
  await d.shot('confirm-new')
  await click('[data-a=cancelNew]')
  check('취소하면 창이 닫히고 저장 유지', !q('[data-a=confirmNew]') && !!(await d.boot()).run)
  await click('[data-a=start]')
  key({ key: 'Escape' })
  await wait(60)
  check('Esc 로도 취소', !q('[data-a=confirmNew]') && !!(await d.boot()).run)
  await click('[data-a=continue]')
  check('이어서 출근 복원', app.mode === 'shop' && app.sim!.round === round)
  check('복지가 다음 판에 반영', app.sim!.stats.dmg >= 0.05)

  // 승리 → 다음 요일
  const s2 = app.sim!
  s2.backToWork()
  app.beginWave()
  s2.round = 26
  s2.spawnQueue.length = 0
  s2.roundSecs = 0
  s2.bossSpawned = true
  await wait(200)
  check('18시 넘기면 칼퇴 성공', app.mode === 'result' && !!q('.payslip .win'))
  check('다음 요일 열림', app.profile.unlocked.normal === 1)
  await click('[data-a=home]')
  check('화요일 버튼이 열림', !(q('[data-a=day][data-v="1"]') as HTMLButtonElement).disabled)

  // 확인 후 새로 출근하면 그때 지워진다
  await click('[data-a=start]')
  await click('[data-a=pickw]')
  await toShop()
  key({ key: 'p' })
  await wait(60)
  await click('[data-a=tohome]')
  await wait(150)
  await click('[data-a=start]')
  check('저장이 있으면 다시 확인 창', !!q('[data-a=confirmNew]'))
  await click('[data-a=confirmNew]')
  await wait(100)
  check('지우고 새로 출근', app.mode === 'pick' && (await d.boot()).run === null)

  d.log(failed ? `흐름 시험 실패 ${failed}건` : '흐름 시험 모두 통과')
  d.scriptDone()
}

export async function runScript(app: App, name: string): Promise<void> {
  const d = window.desk
  if (name === 'flow') return flow(app)
  if (name === 'bosses') {
    await wait(600)
    for (const m of ['normal', 'hell'] as const) {
      app.startRun(4, m)
      await wait(100)
      autoPick(app.sim!)
      strongBuild(app)
      await jump(app, 26)
      await wait(3500)
      await d.shot(`boss-${m}`)
      d.log(`${m}: 보스 ${app.sim!.bossAlive?.def.name} 체력 ${Math.round(app.sim!.bossAlive?.maxHp ?? 0)}`)
    }
    app.sim = null
    app.mode = 'title'
    app.renderUi()
    d.scriptDone()
    return
  }
  if (name === 'desk') {
    // 실제 창 확인: 위치·항상 위·단축키·트레이·투명
    await wait(1200)
    d.log('창: ' + JSON.stringify(await d.info()))
    await d.shot('real-title')
    app.startRun(0)
    await wait(200)
    autoPick(app.sim!)
    app.beginWave()
    await wait(2500)
    await d.shot('real-wave')
    await app.patch({ transparent: true })
    await wait(600)
    const c = document.querySelector('#game') as HTMLCanvasElement
    const px = c.getContext('2d')!.getImageData(460, 150, 1, 1).data
    const tower = c.getContext('2d')!.getImageData(240, 120, 1, 1).data
    d.log(`투명 모드 알파: 빈 곳 ${px[3]} · 시계탑 ${tower[3]} · 창 배경 ${getComputedStyle(document.body).backgroundColor}`)
    await d.shot('real-transparent')
    await app.patch({ transparent: false })
    d.scriptDone()
    return
  }
  if (name !== 'tour') return
  await wait(900)
  await d.shot('01-title')
  app.mode = 'perks'
  app.renderUi()
  await wait(200)
  await d.shot('02-perks')
  app.mode = 'settings'
  app.renderUi()
  await wait(200)
  await d.shot('03-settings')
  app.mode = 'title'
  app.renderUi()

  app.startRun(0)
  await wait(300)
  await d.shot('04-pick')
  const sim = app.sim!
  autoPick(sim)
  app.beginWave()
  await wait(5000)
  await d.shot('05-wave1')

  // 첫 라운드 끝까지 빠르게
  let guard = 0
  while (sim.phase === 'wave' && guard++ < 60 * 90) {
    sim.stampCd = 0
    sim.tick()
    sim.events.length = 0
  }
  await wait(200)
  await d.shot('06-shop-before')
  autoShop(sim)
  app.renderUi()
  await wait(200)
  await d.shot('07-shop-after')

  strongBuild(app)
  await jump(app, 8)
  await wait(4500)
  await d.shot('08-boss-ogre')
  await wait(2500)
  await d.shot('09-boss-ogre2')

  await jump(app, 17)
  strongBuild(app)
  await wait(5000)
  await d.shot('10-boss-lich')

  await jump(app, 25)
  strongBuild(app, 6)
  sim.items.grade_s = 2
  sim.recalc()
  sim.spawnQueue.forEach((s) => (s.at = 0.2 + s.at * 0.35))
  app.frameMs.length = 0
  await wait(7000)
  await d.shot('11-late-wave')
  const ms = [...app.frameMs].sort((a, b) => a - b)
  d.log(`프레임 처리: 평균 ${(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(2)}ms · 95% ${ms[Math.floor(ms.length * 0.95)].toFixed(2)}ms · 최대 ${ms[ms.length - 1].toFixed(2)}ms (${ms.length}프레임) · 이펙트 ${app.view.stats().fx} · 적 ${sim.enemies.length}`)

  await jump(app, 26)
  strongBuild(app)
  await wait(5000)
  await d.shot('12-boss-dragon')
  sim.ultCharge = 100
  sim.ult()
  await wait(250)
  await d.shot('13-ult')

  app.settings.transparent = true
  app.view.transparent = true
  await wait(500)
  await d.shot('14-transparent')
  app.settings.transparent = false
  app.view.transparent = false

  app.toggleDisguise()
  await wait(200)
  await d.shot('15-disguise')
  app.toggleDisguise()

  sim.phase = 'win'
  sim.events.push({ t: 'win' })
  sim.kills = 1234
  ;(app as unknown as { mode: string }).mode = 'wave'
  await wait(1200)
  await d.shot('16-result-win')
  d.scriptDone()
}
