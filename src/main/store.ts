import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, SCALES, type Corner, type Profile, type Settings } from '@shared/types'

/** userData 안의 settings.json · profile.json · run.json 을 다루는 아주 작은 저장소 */
export class Store {
  private settingsFile = join(app.getPath('userData'), 'settings.json')
  private profileFile = join(app.getPath('userData'), 'profile.json')
  private runFile = join(app.getPath('userData'), 'run.json')
  private timer: NodeJS.Timeout | null = null
  settings: Settings
  profile: Profile

  constructor() {
    this.settings = sanitize({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(this.settingsFile, {}) })
    this.profile = sanitizeProfile({ ...DEFAULT_PROFILE, ...read<Partial<Profile>>(this.profileFile, {}) })
  }

  setSettings(patch: Partial<Settings>): void {
    this.settings = sanitize({ ...this.settings, ...patch })
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      writeAtomic(this.settingsFile, JSON.stringify(this.settings, null, 2))
    }, 300)
  }

  setProfile(p: Profile): void {
    this.profile = sanitizeProfile(p)
    writeAtomic(this.profileFile, JSON.stringify(this.profile, null, 2))
  }

  loadRun(): unknown | null {
    return read<unknown | null>(this.runFile, null)
  }

  saveRun(run: unknown | null): void {
    if (run === null) {
      try {
        if (existsSync(this.runFile)) unlinkSync(this.runFile)
      } catch (err) {
        console.error('[store] 이어하기 지우기 실패', err)
      }
      return
    }
    writeAtomic(this.runFile, JSON.stringify(run))
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
      writeAtomic(this.settingsFile, JSON.stringify(this.settings, null, 2))
    }
  }
}

function read<T>(file: string, fallback: T): T {
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch (err) {
    console.error('[store] 읽기 실패, 처음부터', file, err)
  }
  return fallback
}

function writeAtomic(file: string, text: string): void {
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file + '.tmp', text)
    renameSync(file + '.tmp', file)
  } catch (err) {
    console.error('[store] 저장 실패', err)
  }
}

function sanitize(s: Settings): Settings {
  const d = DEFAULT_SETTINGS
  const corners: Corner[] = ['br', 'bl', 'tr', 'tl']
  return {
    scale: SCALES.includes(s.scale) ? s.scale : d.scale,
    corner: corners.includes(s.corner) ? s.corner : d.corner,
    alwaysOnTop: !!s.alwaysOnTop,
    transparent: !!s.transparent,
    sound: !!s.sound,
    music: !!s.music,
    volume: Math.max(0, Math.min(1, Number(s.volume) || 0)),
    speed: [1, 2, 3].includes(s.speed) ? s.speed : d.speed,
    auto: !!s.auto,
    bossMode: s.bossMode === 'hide' ? 'hide' : 'sheet',
    pauseOnBlur: !!s.pauseOnBlur
  }
}

/** 예전 저장(숫자 하나)은 노말 진행도로 옮긴다 */
function unlockedOf(v: unknown): Profile['unlocked'] {
  const clamp = (x: unknown): number => Math.max(0, Math.min(5, Math.floor(Number(x) || 0)))
  if (typeof v === 'number') return { easy: 0, normal: clamp(v), hard: 0, hell: 0 }
  const o = (v ?? {}) as Record<string, unknown>
  return { easy: clamp(o.easy), normal: clamp(o.normal), hard: clamp(o.hard), hell: clamp(o.hell) }
}

function sanitizeProfile(p: Profile): Profile {
  const n = (v: unknown): number => Math.max(0, Math.floor(Number(v) || 0))
  return {
    salary: n(p.salary),
    perks: Object.fromEntries(Object.entries(p.perks ?? {}).map(([k, v]) => [k, n(v)])),
    unlocked: unlockedOf(p.unlocked as unknown),
    runs: n(p.runs),
    wins: n(p.wins),
    bestRound: n(p.bestRound),
    totalKills: n(p.totalKills),
    endlessBest: n(p.endlessBest)
  }
}
