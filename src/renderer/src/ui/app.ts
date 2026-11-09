// 화면 흐름과 입력. 타이틀 → 첫 무기 → 라운드 ↔ 쉬는 시간 → 결과.
import type { Boot, Profile, Settings } from '@shared/types'
import { INSTAGRAM_URL, MORE_APPS_URL, SCALES } from '@shared/types'
import { audio, type Sfx } from '../audio'
import { autoPick, autoShop, autoStamp, autoUlt } from '../game/autoplay'
import { clockText, DAYS, DEPTS, ENDLESS_DAY, ENEMIES, H, ITEM, MAX_RANK, MODE_ORDER, MODES, PERKS, perkPrice, RANKS, RAR_COLOR, RAR_NAME, ROUNDS, SLOTS, STEP_MIN, W, waveFor, WEAPON, type Dept, type ModeId } from '../game/defs'
import { DT, Sim, type GameEvent, type SimSave } from '../game/sim'
import { icon, ITEM_ICON } from '../gfx/sprites'
import { View } from '../gfx/view'

export type Mode = 'title' | 'perks' | 'settings' | 'pick' | 'wave' | 'shop' | 'pause' | 'result'

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector(sel) as T

export class App {
  settings: Settings
  profile: Profile
  scales: number[]
  platform: string
  view: View
  sim: Sim | null = null
  mode: Mode = 'title'
  savedRun: SimSave | null
  private chosenDay = 0
  private chosenMode: ModeId = 'normal'
  /** 저장된 판을 지우고 새로 출근할지 묻는 중 */
  private askNew = false
  private ui = $('#ui')
  private accum = 0
  private lastNow = 0
  private visible = true
  private focused = true
  private disguised = false
  private autoTimer = 0
  private pointer: { x: number; y: number; down: boolean } = { x: 0, y: 0, down: false }
  private returnMode: Mode = 'title'
  private lastResult: { salary: number; win: boolean } | null = null
  /** 시험에서 프레임 시간 측정 */
  frameMs: number[] = []

  private hud: {
    clock: HTMLElement; hpFill: HTMLElement; hp: HTMLElement; hpText: HTMLElement; coin: HTMLElement; stamp: HTMLElement; stampFill: HTMLElement; ult: HTMLElement; ultFill: HTMLElement; ultText: HTMLElement;
    boss: HTMLElement; bossFill: HTMLElement; bossName: HTMLElement; round: HTMLElement
  } | null = null

  constructor(boot: Boot) {
    this.settings = boot.settings
    this.profile = boot.profile
    this.scales = boot.scales
    this.platform = boot.platform
    this.savedRun = validRun(boot.run)
    this.view = new View($('#game') as HTMLCanvasElement)
    this.chosenDay = Math.min(this.profile.unlocked.normal, 4)
    this.applySettings()
    this.bindInput()
  }

  start(): void {
    this.renderUi()
    requestAnimationFrame((t) => this.frame(t))
  }

  // ───────── 설정 ─────────

  private applySettings(): void {
    const s = this.settings
    document.documentElement.style.setProperty('--s', String(this.scales.includes(s.scale) ? s.scale : this.scales[this.scales.length - 1]))
    this.view.transparent = s.transparent
    audio.set(s.sound, s.volume, s.music)
  }

  async patch(p: Partial<Settings>): Promise<void> {
    this.settings = await window.desk.setSettings(p)
    this.applySettings()
    if (this.mode === 'settings') this.renderUi()
  }

  // ───────── 입력 ─────────

  private bindInput(): void {
    const canvas = $('#game') as HTMLCanvasElement
    const pos = (e: PointerEvent): { x: number; y: number } => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (this.disguised) return
      this.pointer = { ...pos(e), down: true }
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (this.pointer.down) this.pointer = { ...pos(e), down: true }
    })
    canvas.addEventListener('pointerup', () => (this.pointer.down = false))
    canvas.addEventListener('pointercancel', () => (this.pointer.down = false))

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      if (this.disguised) {
        if (e.key === 'Escape') this.toggleDisguise()
        return
      }
      if (this.askNew) {
        if (e.key === 'Escape') this.action('cancelNew', '')
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        this.useUlt()
      } else if (e.key === 'Escape' && (this.mode === 'perks' || this.mode === 'settings')) {
        this.action('back', '')
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.mode === 'wave' || this.mode === 'shop') this.setPause()
        else if (this.mode === 'pause') this.resume()
      } else if (e.key === '1' || e.key === '2' || e.key === '3') {
        if (this.mode === 'wave') void this.patch({ speed: Number(e.key) }).then(() => this.renderUi())
      } else if (e.key === 'm' || e.key === 'M') {
        void this.patch({ sound: !this.settings.sound })
      }
    })

    this.ui.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')
      if (!el || (el as HTMLButtonElement).disabled) return
      this.action(el.dataset.a!, el.dataset.v ?? '')
    })
    this.ui.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement
      if (el.dataset.input === 'volume') void this.patch({ volume: Number(el.value) / 100 })
    })

    window.desk.onBossKey(() => this.toggleDisguise())
    window.desk.onVisibility((v) => {
      this.visible = v
      if (v) this.lastNow = 0
      else if (this.mode === 'wave') this.setPause()
    })
    window.desk.onBlur((f) => {
      this.focused = f
      if (!f && this.settings.pauseOnBlur && this.mode === 'wave') this.setPause()
    })
  }

  private setPause(): void {
    if (this.mode !== 'wave' && this.mode !== 'shop') return
    this.returnMode = this.mode
    this.mode = 'pause'
    audio.playMusic('none')
    this.renderUi()
  }

  private resume(): void {
    this.mode = this.returnMode
    this.lastNow = 0
    this.updateMusic()
    this.renderUi()
  }

  private updateMusic(): void {
    if (this.sim && this.mode === 'wave' && this.sim.wave().boss) audio.playMusic('boss')
    else if (this.sim && (this.mode === 'wave' || this.mode === 'shop' || this.mode === 'pick')) audio.playMusic('work')
    else audio.playMusic('none')
  }

  toggleDisguise(): void {
    this.disguised = !this.disguised
    const old = document.getElementById('sheet')
    if (old) old.remove()
    if (this.disguised) {
      if (this.mode === 'wave') this.setPause()
      document.body.appendChild(buildFakeSheet())
    }
  }

  private useUlt(): void {
    if (this.sim && this.mode === 'wave') this.sim.ult()
  }

  private sfx(s: Sfx): void {
    audio.sfx(s)
  }

  // ───────── 게임 흐름 ─────────

  private modeOpen(m: ModeId): boolean {
    const u = this.profile.unlocked
    if (m === 'hard') return u.normal >= 5
    if (m === 'hell') return u.hard >= 5
    return true
  }

  private dayOpen(d: number, m: ModeId): boolean {
    const u = this.profile.unlocked
    if (d === ENDLESS_DAY) return MODE_ORDER.some((x) => u[x] >= 5)
    return d <= Math.min(4, u[m])
  }

  startRun(day: number, mode: ModeId = this.chosenMode): void {
    this.askNew = false
    this.view.bakeRemaining()
    const meta = { perks: { ...this.profile.perks } }
    this.sim = new Sim({ day, mode, meta, seed: (Date.now() ^ (Math.random() * 1e9)) & 0x7fffffff })
    this.view.reset()
    window.desk.saveRun(null)
    this.savedRun = null
    this.mode = 'pick'
    this.autoTimer = 0.9
    this.updateMusic()
    this.renderUi()
  }

  resumeRun(): void {
    const s = this.savedRun
    if (!s) return
    this.askNew = false
    this.view.bakeRemaining()
    this.sim = new Sim({ day: s.day, mode: s.mode, meta: s.meta, seed: s.seed, save: s })
    this.view.reset()
    this.mode = 'shop'
    this.autoTimer = 2
    this.updateMusic()
    this.renderUi()
  }

  private finishRun(win: boolean): void {
    const sim = this.sim!
    const salary = sim.salary()
    const p = this.profile
    p.salary += salary
    p.runs++
    p.totalKills += sim.kills
    p.bestRound = Math.max(p.bestRound, sim.round + (win ? 1 : 0))
    if (sim.day.endless) p.endlessBest = Math.max(p.endlessBest, sim.round + 1)
    if (win) {
      p.wins++
      p.unlocked[sim.mode.id] = Math.max(p.unlocked[sim.mode.id], Math.min(5, sim.day.id + 1))
    }
    window.desk.saveProfile(p)
    window.desk.saveRun(null)
    this.savedRun = null
    this.lastResult = { salary, win }
    this.mode = 'result'
    audio.playMusic('none')
    this.renderUi()
  }

  private enterShop(): void {
    this.mode = 'shop'
    this.autoTimer = 2
    window.desk.saveRun(this.sim!.serialize())
    this.updateMusic()
    this.renderUi()
  }

  private action(a: string, v: string): void {
    const sim = this.sim
    switch (a) {
      case 'day':
        this.chosenDay = Number(v)
        this.sfx('click')
        this.renderUi()
        return
      case 'mode':
        this.chosenMode = v as ModeId
        if (!this.dayOpen(this.chosenDay, this.chosenMode)) this.chosenDay = Math.min(4, this.profile.unlocked[this.chosenMode])
        this.sfx('click')
        this.renderUi()
        return
      case 'start':
        // 저장된 판이 있으면 지우기 전에 묻는다
        if (this.savedRun) {
          this.sfx('click')
          this.askNew = true
          this.renderUi()
          return
        }
        this.sfx('round')
        this.startRun(this.chosenDay, this.chosenMode)
        return
      case 'confirmNew':
        this.sfx('round')
        this.startRun(this.chosenDay, this.chosenMode)
        return
      case 'cancelNew':
        this.sfx('click')
        this.askNew = false
        this.renderUi()
        return
      case 'continue':
        this.sfx('round')
        this.resumeRun()
        return
      case 'goto':
        this.sfx('click')
        this.returnMode = this.mode === 'pause' ? this.returnMode : this.mode
        this.mode = v as Mode
        this.renderUi()
        return
      case 'back': {
        this.sfx('click')
        this.mode = this.sim && (this.returnMode === 'wave' || this.returnMode === 'shop') ? 'pause' : 'title'
        this.renderUi()
        return
      }
      case 'perk': {
        const def = PERKS.find((p) => p.id === v)!
        const lv = this.profile.perks[v] ?? 0
        const price = perkPrice(def.price, lv)
        if (lv >= def.max || this.profile.salary < price) return this.sfx('deny')
        this.profile.salary -= price
        this.profile.perks[v] = lv + 1
        window.desk.saveProfile(this.profile)
        this.sfx('promote')
        this.renderUi()
        return
      }
      case 'pickw':
        if (sim && sim.phase === 'pick') {
          sim.pickStarter(v)
          this.beginWave()
        }
        return
      case 'buy':
        if (sim?.buy(Number(v))) this.renderUi()
        else this.sfx('deny')
        return
      case 'reroll':
        if (sim?.reroll()) {
          this.sfx('reroll')
          this.renderUi()
        } else this.sfx('deny')
        return
      case 'sell':
        if (sim?.sell(Number(v))) {
          this.sfx('buy')
          this.renderUi()
        } else this.sfx('deny')
        return
      case 'next':
        if (sim) {
          sim.backToWork()
          this.beginWave()
        }
        return
      case 'pause':
        this.sfx('click')
        this.setPause()
        return
      case 'resume':
        this.sfx('click')
        this.resume()
        return
      case 'giveup':
        this.sfx('click')
        this.sim!.hp = 0
        this.sim!.phase = 'lose'
        this.finishRun(false)
        return
      case 'tohome':
        // 이어하기로 남기고 나간다 (쉬는 시간에 저장된 곳부터)
        this.sim = null
        window.desk.boot().then((b) => {
          this.savedRun = validRun(b.run)
          this.mode = 'title'
          this.renderUi()
        })
        audio.playMusic('none')
        return
      case 'home':
        this.sfx('click')
        this.sim = null
        this.mode = 'title'
        this.renderUi()
        return
      case 'again':
        this.sfx('round')
        this.startRun(this.sim!.day.id, this.sim!.mode.id)
        return
      case 'speed':
        void this.patch({ speed: (this.settings.speed % 3) + 1 }).then(() => this.renderUi())
        return
      case 'auto':
        void this.patch({ auto: !this.settings.auto }).then(() => this.renderUi())
        return
      case 'ult':
        this.useUlt()
        return
      case 'set': {
        const [k, val] = v.split(':')
        const patch: Partial<Settings> = {}
        if (k === 'scale') patch.scale = Number(val)
        if (k === 'corner') patch.corner = val as Settings['corner']
        if (k === 'bossMode') patch.bossMode = val as Settings['bossMode']
        if (k === 'bool') {
          const key = val as 'alwaysOnTop' | 'transparent' | 'sound' | 'music' | 'pauseOnBlur' | 'auto'
          patch[key] = !this.settings[key]
        }
        this.sfx('click')
        void this.patch(patch)
        return
      }
      case 'hide':
        window.desk.hide()
        return
      case 'quit':
        window.desk.quit()
        return
      case 'url':
        window.desk.openUrl(v === 'insta' ? INSTAGRAM_URL : MORE_APPS_URL)
        return
    }
  }

  beginWave(): void {
    this.mode = 'wave'
    this.lastNow = 0
    this.accum = 0
    this.updateMusic()
    this.renderUi()
    if (this.sim!.round === 0 && this.profile.runs === 0) this.toast('화면을 눌러 결재 도장 쾅!', 'Space 사직서 · 1·2·3 배속')
  }

  toast(text: string, sub = '', boss = false): void {
    const el = document.createElement('div')
    el.className = boss ? 'toast boss' : 'toast'
    el.innerHTML = `${text}${sub ? `<small>${sub}</small>` : ''}`
    this.ui.appendChild(el)
    setTimeout(() => el.remove(), 2200)
  }

  // ───────── 프레임 ─────────

  private frame(now: number): void {
    requestAnimationFrame((t) => this.frame(t))
    if (!this.visible) return
    const t0 = performance.now()
    const dt = this.lastNow ? Math.min(0.1, (now - this.lastNow) / 1000) : 1 / 60
    this.lastNow = now
    this.step(dt)
    this.frameMs.push(performance.now() - t0)
    if (this.frameMs.length > 600) this.frameMs.shift()
  }

  step(dt: number): void {
    // 위장 화면이 떠 있는 동안에는 아무것도 진행하지 않는다
    if (this.disguised) return
    const sim = this.sim
    if (sim && this.mode === 'wave') {
      this.accum += dt * this.settings.speed
      let n = 0
      while (this.accum >= DT && n++ < 12) {
        this.accum -= DT
        if (this.settings.auto) {
          autoStamp(sim)
          autoUlt(sim)
        } else if (this.pointer.down) sim.stamp(this.pointer.x, this.pointer.y)
        sim.tick()
        if (sim.phase !== 'wave') break
      }
      if (this.accum > 0.5) this.accum = 0
    }
    if (sim && (this.mode === 'pick' || this.mode === 'shop') && this.settings.auto) {
      this.autoTimer -= dt
      if (this.autoTimer <= 0) {
        if (this.mode === 'pick') {
          autoPick(sim)
          this.beginWave()
        } else {
          autoShop(sim)
          sim.backToWork()
          this.beginWave()
        }
      }
    }
    if (sim) this.handleEvents(sim)
    const dtv = this.mode === 'pause' ? 0 : dt * (this.mode === 'wave' ? this.settings.speed : 1)
    this.view.update(dtv, sim ?? IDLE)
    if (sim) this.view.consume(sim)
    this.view.render(sim, { idle: this.mode === 'title' || this.mode === 'perks' || this.mode === 'settings' })
    this.paintOverlay()
    if (this.mode === 'wave') this.paintHud()
    if (sim && this.mode === 'wave') {
      if (sim.phase === 'shop') this.enterShop()
      else if (sim.phase === 'win') this.finishRun(true)
      else if (sim.phase === 'lose') this.finishRun(false)
    }
  }

  private handleEvents(sim: Sim): void {
    for (const ev of sim.events) this.eventSound(ev)
  }

  private eventSound(ev: GameEvent): void {
    switch (ev.t) {
      case 'shoot': return this.sfx('shoot')
      case 'bolt': return this.sfx('zap')
      case 'splash':
      case 'firework':
      case 'kamikaze': return this.sfx('boom')
      case 'smite': return this.sfx('boom')
      case 'nova': return this.sfx('freeze')
      case 'cone': return this.sfx('fire')
      case 'kill': return this.sfx('kill')
      case 'towerHit': return this.sfx('hurt')
      case 'stamp': return this.sfx('stamp')
      case 'ult': return this.sfx('ult')
      case 'heal': return this.sfx('heal')
      case 'roundEnd': return this.sfx('round')
      case 'win': return this.sfx('win')
      case 'lose': return this.sfx('lose')
      case 'buy': return this.sfx(ev.kind === 'promote' ? 'promote' : 'buy')
      case 'bossSpawn':
        this.sfx('boss')
        this.toast(ENEMIES[ev.e].name, '시계가 멈췄다!', true)
        return
      case 'roundStart':
        if (!waveFor(this.sim!.day.id, ev.round).boss) this.toast(clockText(9 * 60 + STEP_MIN * ev.round), this.sim!.day.endless ? `${ev.round + 1} 라운드` : `${ev.round + 1} / ${ROUNDS}`)
        return
      default:
    }
  }

  private paintOverlay(): void {
    const v = this.view
    ;($('#flash') as HTMLElement).style.opacity = v.flash > 0.01 ? String(Math.min(0.9, v.flash)) : '0'
    ;($('#hurt') as HTMLElement).style.opacity = v.hurt > 0.01 ? String(v.hurt * 0.75) : '0'
    const canvas = $('#game') as HTMLElement
    canvas.style.transform = v.shake[0] || v.shake[1] ? `translate(${v.shake[0]}px,${v.shake[1]}px)` : ''
  }

  private paintHud(): void {
    const sim = this.sim!
    const h = this.hud
    if (!h) return
    const min = sim.clockMinutes()
    h.clock.textContent = clockText(min)
    h.clock.classList.toggle('stop', !!sim.bossAlive)
    const ratio = Math.max(0, sim.hp) / sim.stats.maxHp
    h.hpFill.style.width = `${Math.round(ratio * 100)}%`
    h.hp.classList.toggle('low', ratio < 0.3)
    h.hpText.textContent = `멘탈 ${Math.ceil(Math.max(0, sim.hp))}/${sim.stats.maxHp}`
    h.coin.textContent = String(sim.coins)
    const st = 1 - sim.stampCd / sim.stampMax()
    h.stampFill.style.width = `${Math.round(st * 100)}%`
    h.stamp.classList.toggle('ready', sim.stampCd <= 0)
    h.ultFill.style.width = `${Math.round(sim.ultCharge)}%`
    h.ult.classList.toggle('ready', sim.ultReady())
    h.ultText.textContent = sim.ultReady() ? '사직서 제출! [Space]' : `사직서 ${Math.floor(sim.ultCharge)}%`
    const boss = sim.bossAlive
    h.boss.classList.toggle('hidden', !boss)
    if (boss) {
      h.bossName.textContent = boss.def.name
      h.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`
    }
  }

  // ───────── 화면 조각 ─────────

  renderUi(): void {
    this.hud = null
    const render: Record<Mode, () => string> = {
      title: () => this.htmlTitle(),
      perks: () => this.htmlPerks(),
      settings: () => this.htmlSettings(),
      pick: () => this.htmlPick(),
      wave: () => this.htmlWave(),
      shop: () => this.htmlShop(),
      pause: () => this.htmlPause(),
      result: () => this.htmlResult()
    }
    this.ui.innerHTML = render[this.mode]()
    if (this.mode === 'wave') {
      this.hud = {
        clock: $('.clock'), hp: $('.hp'), hpFill: $('.hp i'), hpText: $('.hp span'), coin: $('.coin b'), stamp: $('.skill.stamp'), stampFill: $('.skill.stamp i'), ult: $('.skill.ult'), ultFill: $('.skill.ult i'),
        ultText: $('.skill.ult span'), boss: $('.bossbar'), bossFill: $('.bossbar .bar i'), bossName: $('.bossbar .name'), round: $('.round-label')
      }
    }
  }

  private htmlTitle(): string {
    const p = this.profile
    const d = DAYS[this.chosenDay]
    return `<div class="title drag">
      <div class="left">
        <div class="logo">칼퇴<em>디펜스</em></div>
        <div class="tag">18시 정각에 퇴근할 수 있을까?</div>
        <div class="modes">${MODE_ORDER.map((m) => `<button class="nodrag ${m === this.chosenMode ? 'on' : ''}" style="--mc:${MODES[m].color}" data-a="mode" data-v="${m}" ${this.modeOpen(m) ? '' : 'disabled'}>${this.modeOpen(m) ? MODES[m].name : '잠김'}</button>`).join('')}</div>
        <div class="days">${DAYS.map((x) => {
          const open = this.dayOpen(x.id, this.chosenMode)
          return `<button class="nodrag ${x.id === this.chosenDay ? 'on' : ''}" data-a="day" data-v="${x.id}" ${open ? '' : 'disabled'}>${open ? x.short : '×'}</button>`
        }).join('')}</div>
        <div class="daydesc">${d.name} · ${d.desc}<br><span style="color:${MODES[this.chosenMode].color}">${MODES[this.chosenMode].name}</span> · ${MODES[this.chosenMode].desc}${d.endless && p.endlessBest ? ` · 최고 ${p.endlessBest}라운드` : ''}</div>
        <div class="menu nodrag">
          ${this.savedRun ? `<button class="btn primary" data-a="continue">이어서 출근 (${MODES[this.savedRun.mode].name} ${DAYS[this.savedRun.day].short} ${clockText(9 * 60 + STEP_MIN * this.savedRun.round)})</button>` : ''}
          <button class="btn ${this.savedRun ? '' : 'primary'}" data-a="start">출근하기</button>
          <button class="btn" data-a="goto" data-v="perks">사내 복지</button>
          <button class="btn" data-a="goto" data-v="settings">설정</button>
          <button class="btn" data-a="quit">끝내기</button>
        </div>
      </div>
      <div class="salary"><img src="${icon('coin').url}">월급 ${p.salary.toLocaleString()} <button class="btn small nodrag" data-a="hide" title="창 숨기기" style="margin-left:6px">_</button></div>
      <div class="foot nodrag">퇴근 성공 ${p.wins}회 · 최고 ${p.bestRound}라운드<br><button data-a="url" data-v="insta">인스타그램</button> · <button data-a="url" data-v="apps">다른 앱</button></div>
    </div>${this.askNew && this.savedRun ? this.htmlAskNew() : ''}`
  }

  private htmlAskNew(): string {
    const s = this.savedRun!
    return `<div class="shade drag"><div class="center nodrag">
      <h2>저장된 판이 있어요</h2>
      <p class="asknew">${MODES[s.mode].name} ${DAYS[s.day].name} ${clockText(9 * 60 + STEP_MIN * s.round)} · 수당 ${s.coins}<br>새로 출근하면 이 판은 지워져요.<br>월급·사내 복지·열린 요일은 그대로예요.</p>
      <button class="btn primary wide" data-a="continue">이어서 출근</button>
      <button class="btn wide" data-a="confirmNew">이 판 지우고 새로 출근</button>
      <button class="btn wide" data-a="cancelNew">취소</button>
    </div></div>`
  }

  private htmlPerks(): string {
    const p = this.profile
    return `<div class="shade drag"><div class="sheet-panel panel">
      <h2>사내 복지 <span style="font:11px 'Galmuri11';color:var(--gold)">월급 ${p.salary.toLocaleString()}</span></h2>
      <div class="rows compact">${PERKS.map((x) => {
        const lv = p.perks[x.id] ?? 0
        const maxed = lv >= x.max
        const price = perkPrice(x.price, lv)
        return `<div class="row"><span class="nm">${x.name}</span><span class="ds">${x.desc}</span><span class="lv">${lv}/${x.max}</span><button class="btn small" data-a="perk" data-v="${x.id}" ${maxed || p.salary < price ? 'disabled' : ''}>${maxed ? '완료' : price}</button></div>`
      }).join('')}</div>
      <div style="text-align:right"><button class="btn" data-a="back">돌아가기</button></div>
    </div></div>`
  }

  private htmlSettings(): string {
    const s = this.settings
    const seg = (key: string, options: [string, string][], cur: string): string => `<span class="seg">${options.map(([v, label]) => `<button class="btn small ${v === cur ? 'on' : ''}" data-a="set" data-v="${key}:${v}">${label}</button>`).join('')}</span>`
    const toggle = (key: keyof Settings): string => `<button class="btn small ${s[key] ? 'on' : ''}" data-a="set" data-v="bool:${key}" style="${s[key] ? 'background:#c8332e' : ''}">${s[key] ? '켜짐' : '꺼짐'}</button>`
    const scaleOpts = SCALES.filter((v) => this.scales.includes(v)).map((v): [string, string] => [String(v), `${Math.round(480 * v)}×${Math.round(300 * v)}`])
    const row = (name: string, ctl: string, desc = ''): string => `<div class="row"><span class="nm">${name}</span><span class="ds">${desc}</span>${ctl}</div>`
    return `<div class="shade drag"><div class="sheet-panel panel">
      <h2>설정</h2>
      <div class="rows">
        ${row('창 크기', seg('scale', scaleOpts, String(s.scale)))}
        ${row('자리', seg('corner', [['tl', '↖'], ['tr', '↗'], ['bl', '↙'], ['br', '↘']], s.corner), '화면 구석')}
        ${row('항상 위', toggle('alwaysOnTop'))}
        ${row('바닥 없애기', toggle('transparent'), '바탕화면 위에서 싸워요')}
        ${row('소리', toggle('sound'), '')}
        ${row('배경음', toggle('music'), '')}
        ${row('음량', `<input type="range" min="0" max="100" value="${Math.round(s.volume * 100)}" data-input="volume">`)}
        ${row('자동 근무', toggle('auto'), '쇼핑과 도장을 대신해요')}
        ${row('팀장 등장 키', seg('bossMode', [['sheet', '표 화면'], ['hide', '숨기기']], s.bossMode), `${this.bossKeyLabel()} · ${s.bossMode === 'sheet' ? '위장 화면으로' : '창을 숨겨요'}`)}
      </div>
      <div style="text-align:right"><button class="btn" data-a="back">돌아가기</button></div>
    </div></div>`
  }

  private weaponCard(id: string, footer: string, attrs: string, off = false): string {
    const w = WEAPON[id]
    const dept = DEPTS[w.dept]
    return `<div class="card ${off ? 'off' : ''}" style="--c:${RAR_COLOR[w.rar]}" ${attrs}>
      <div class="top"><img src="${icon(id).url}"><div><div class="tt">${w.name}</div><div class="rar">${RAR_NAME[w.rar]}</div></div></div>
      <span class="chip" style="--dc:${dept.color};align-self:flex-start">${dept.name}</span>
      <div class="desc">${w.desc}</div>
      <div class="sub">${weaponStat(w)}</div>
      ${footer}
    </div>`
  }

  private htmlPick(): string {
    const sim = this.sim!
    return `<div class="shade drag"><div class="pick nodrag">
      <h2>${sim.mode.name} ${sim.day.name} 09:00 · 오늘의 첫 장비</h2>
      <p>하나를 골라 출근하세요</p>
      <div class="cards">${sim.starters.map((id) => this.weaponCard(id, '', `data-a="pickw" data-v="${id}"`)).join('')}</div>
    </div></div>`
  }

  private htmlWave(): string {
    const sim = this.sim!
    const s = this.settings
    return `<div class="hud drag">
      <div class="clock">${clockText(sim.clockMinutes())}</div>
      <div class="dayname">${sim.mode.name} ${sim.day.short}</div>
      <div class="hp"><i></i><span></span></div>
      <div class="coin"><img src="${icon('coin').url}"><b>${sim.coins}</b></div>
      <div class="round-label">${sim.day.endless ? `${sim.round + 1}R` : `${sim.round + 1}/${ROUNDS}`}</div>
      <div class="spacer"></div>
      <button class="btn small" data-a="auto" style="${s.auto ? 'background:#c8332e' : ''}">자동</button>
      <button class="btn small" data-a="speed">x${s.speed}</button>
      <button class="btn small" data-a="pause">Ⅱ</button>
      <button class="btn small" data-a="hide" title="창 숨기기">_</button>
    </div>
    <div class="bossbar hidden"><div class="name"></div><div class="bar"><i></i></div></div>
    <div class="skills">
      <div class="skill stamp"><i></i><span>결재 도장</span></div>
      <button class="skill ult" data-a="ult"><i></i><span></span></button>
    </div>`
  }

  private htmlShop(): string {
    const sim = this.sim!
    const counts = sim.deptCounts()
    const offers = sim.offers.map((o, i) => {
      const buyable = sim.canBuy(i)
      const short = !o.sold && sim.coins < o.price
      const price = `<div class="price ${short ? 'no' : ''}"><span>${o.sold ? '구매 완료' : `${o.price} 수당`}</span></div>`
      if (o.kind === 'weapon') {
        const own = sim.weapons.find((w) => w.id === o.id)
        const footer = (own && own.rank < MAX_RANK && !o.sold ? `<div class="promote">승진 ${RANKS[own.rank]} → ${RANKS[own.rank + 1]}</div>` : '') + price
        return this.weaponCard(o.id, footer, `data-a="buy" data-v="${i}"`, !buyable).replace('class="card', `class="card${o.sold ? ' sold' : ''}`)
      }
      const it = ITEM[o.id]
      return `<div class="card ${buyable ? '' : 'off'} ${o.sold ? 'sold' : ''}" style="--c:${RAR_COLOR[it.rar]}" data-a="buy" data-v="${i}">
        <div class="top"><img src="${icon(ITEM_ICON[o.id] ?? 'paper').url}"><div><div class="tt">${it.name}</div><div class="rar">${RAR_NAME[it.rar]} · 복지</div></div></div>
        <div class="desc">${it.desc}</div>
        <div class="sub">보유 ${sim.items[o.id] ?? 0}</div>
        ${price}
      </div>`
    })
    const slots: string[] = []
    for (let i = 0; i < SLOTS; i++) {
      const w = sim.weapons[i]
      if (!w) {
        slots.push(`<div class="slot empty"></div>`)
        continue
      }
      const def = WEAPON[w.id]
      slots.push(`<div class="slot" title="${def.name}">
        <img src="${icon(w.id).url}">
        <span class="nm">${def.name.split(' ')[0]}</span>
        <span class="rk ${w.rank === MAX_RANK ? 'top' : ''}">${RANKS[w.rank]}</span>
        ${sim.canSell(i) ? `<div class="sell" data-a="sell" data-v="${i}">판매<br>+${sim.sellValue(i)}</div>` : ''}
      </div>`)
    }
    const syn = (Object.keys(DEPTS) as Dept[])
      .filter((d) => counts[d] > 0)
      .map((d) => {
        const D = DEPTS[d]
        const tier = [...D.tiers].reverse().find((t) => counts[d] >= t.n)
        return `<span class="syn ${tier ? '' : 'dim'}" style="--dc:${D.color}" title="${D.tiers.map((t) => `${t.n}: ${t.desc}`).join(' / ')}">${D.name} ${counts[d]}${tier ? ` · ${tier.desc}` : ''}</span>`
      })
    const rp = sim.rerollPrice()
    return `<div class="shop drag">
      <div class="head">
        <h2>${clockText(sim.roundStart())} ${sim.lunch ? '점심시간' : '쉬는 시간'}</h2>
        <span class="sub">${sim.lunch ? '멘탈 40% 회복 · 전부 20% 할인' : `${sim.day.endless ? `${sim.round + 1}R` : `${sim.round + 1}/${ROUNDS}`} · 다음 ${sim.wave().boss ? `<b style="color:#ff7a6a">${ENEMIES[sim.wave().boss!].name}</b>` : '업무'}`}</span>
        <span class="spacer" style="flex:1"></span>
        <span style="color:var(--green)">멘탈 ${Math.ceil(sim.hp)}/${sim.stats.maxHp}</span>
        <span class="coin"><img src="${icon('coin').url}"><b>${sim.coins}</b></span>
      </div>
      <div class="cards nodrag">${offers.join('')}</div>
      <div class="status">${syn.join('') || '<span>같은 부서 장비를 모으면 시너지가 켜져요</span>'}</div>
      <div class="bottom nodrag">
        <div class="slots">${slots.join('')}</div>
        <div class="actions">
          <button class="btn" data-a="reroll" ${sim.coins < rp ? 'disabled' : ''}>새로고침 ${rp === 0 ? '무료' : rp}</button>
          <button class="btn primary" data-a="next">업무 복귀 ▶</button>
        </div>
      </div>
    </div>`
  }

  private bossKeyLabel(): string {
    return this.platform === 'darwin' ? '⌃⌥D' : 'Ctrl+Alt+D'
  }

  private htmlPause(): string {
    return `<div class="shade drag"><div class="center nodrag">
      <h2>잠깐 자리 비움</h2>
      <button class="btn primary" data-a="resume">계속하기</button>
      <button class="btn" data-a="hide">창 숨기기</button>
      <button class="btn" data-a="goto" data-v="settings">설정</button>
      <button class="btn" data-a="tohome">타이틀로 (저장된 쉬는 시간부터 이어하기)</button>
      <button class="btn" data-a="giveup">조퇴하기 (포기)</button>
    </div></div>`
  }

  private htmlResult(): string {
    const sim = this.sim!
    const r = this.lastResult!
    const top = [...sim.weapons].sort((a, b) => b.dealt - a.dealt)[0]
    const nextDay = r.win && sim.day.id < 4 ? DAYS[sim.day.id + 1] : null
    const nextMode = r.win && sim.day.id === 4 ? (sim.mode.id === 'normal' ? MODES.hard : sim.mode.id === 'hard' ? MODES.hell : null) : null
    return `<div class="shade drag"><div class="center nodrag">
      <div class="payslip">
        <h3>급 여 명 세 서</h3>
        <div class="big ${r.win ? 'win' : 'lose'}">${r.win ? '칼퇴 성공!' : sim.day.endless ? '야근 끝 · 기절' : '멘탈 붕괴 · 야근 확정'}</div>
        <div class="msg">${sim.mode.name} · ${r.win ? (sim.day.id === 4 ? '이번 주도 살아남았다. 주말이다!' : `${sim.day.name} 18:00 정각 퇴근`) : `${sim.day.name} ${clockText(sim.clockMinutes())}에 쓰러짐`}</div>
        <table>
          <tr><td>처리한 업무</td><td>${sim.kills.toLocaleString()} 건</td></tr>
          <tr><td>번 수당</td><td>${sim.earned.toLocaleString()}</td></tr>
          <tr><td>도달</td><td>${sim.day.endless ? `${sim.round + 1} 라운드` : `${Math.min(sim.round + 1, ROUNDS)} / ${ROUNDS}`}</td></tr>
          <tr class="total"><td>실수령 월급</td><td>${r.salary.toLocaleString()}</td></tr>
        </table>
        ${top ? `<div class="bestw">오늘의 사원: ${WEAPON[top.id].name} (${RANKS[top.rank]}) · ${Math.round(top.dealt).toLocaleString()} 피해</div>` : ''}
        ${nextDay ? `<div class="bestw" style="color:#2f8a4a">${nextDay.name} 출근이 열렸어요</div>` : ''}
        ${nextMode ? `<div class="bestw" style="color:#2f8a4a">${nextMode.name} 모드가 열렸어요</div>` : ''}
        ${r.win && sim.day.id === 4 ? `<div class="bestw" style="color:#2f8a4a">무한 야근이 열렸어요</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn primary" data-a="again" style="width:120px">다시 출근</button><button class="btn" data-a="home" style="width:120px">타이틀로</button></div>
    </div></div>`
  }
}

/** view.update 에 넘길 빈 시뮬레이션 (타이틀 화면) */
const IDLE = { events: [], projectiles: [], zones: [], enemyShots: [], shake: 0 } as unknown as Sim

/** 예전 형식의 이어하기는 쓰지 않는다 (라운드 수가 달라졌다) */
function validRun(run: unknown): SimSave | null {
  const s = run as SimSave | null
  return s && s.v === 2 ? s : null
}

function weaponStat(w: (typeof WEAPON)[string]): string {
  if (w.kind === 'heal') return `${w.cd}초마다 회복`
  return `피해 ${w.dmg} · ${(1 / w.cd).toFixed(1)}회/초 · 사거리 ${w.range}`
}

function buildFakeSheet(): HTMLElement {
  const el = document.createElement('div')
  el.id = 'sheet'
  const cols = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
  const heads = ['품목', '담당', '1분기', '2분기', '3분기', '합계', '비고']
  const items = ['소모품비', '여비교통비', '회의비', '통신비', '인쇄비', '수수료', '복리후생비', '차량유지비', '교육훈련비', '도서구입비', '임차료', '보험료', '광고선전비', '접대비', '수선비', '운반비', '잡비', '소계']
  const who = ['총무', '영업', '기획', '재무']
  let seed = 7
  const n = (): number => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 900 + 100
  const rows = items.map((it, i) => {
    const a = n() * 13
    const b = n() * 11
    const c = n() * 12
    return `<tr><th>${i + 2}</th><td class="t">${it}</td><td class="t">${who[i % 4]}</td><td>${a.toLocaleString()}</td><td>${b.toLocaleString()}</td><td>${c.toLocaleString()}</td><td>${(a + b + c).toLocaleString()}</td><td class="t"></td></tr>`
  })
  el.innerHTML = `<div class="ribbon"><b>2026_4분기_부서운영비_정리(최종)(수정).xlsx</b><span>파일</span><span>홈</span><span>삽입</span><span>수식</span><span>데이터</span></div>
    <div class="formula">fx &nbsp; =SUM(C2:E2)</div>
    <div class="wrap"><table><tr>${cols.map((c, i) => `<th ${i === 0 ? 'style="width:26px"' : ''}>${c}</th>`).join('')}</tr>
    <tr><th>1</th>${heads.map((h) => `<td class="t"><b>${h}</b></td>`).join('')}</tr>${rows.join('')}</table></div>`
  return el
}

