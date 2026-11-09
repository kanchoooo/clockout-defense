// 메인 프로세스와 화면이 함께 쓰는 형식

export type Corner = 'br' | 'bl' | 'tr' | 'tl'

export interface Settings {
  /** 화면 배율: 1 → 480×300 */
  scale: number
  corner: Corner
  alwaysOnTop: boolean
  /** 바닥 없이 바탕화면 위에서 싸우기 */
  transparent: boolean
  sound: boolean
  music: boolean
  volume: number
  speed: number
  /** 자동 근무: 쇼핑·도장을 대신 */
  auto: boolean
  /** 들켰을 때: 창 숨기기 / 표 계산 화면으로 위장 */
  bossMode: 'hide' | 'sheet'
  /** 창에서 포커스가 나가면 일시정지 */
  pauseOnBlur: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  scale: 1.5,
  corner: 'br',
  alwaysOnTop: true,
  transparent: false,
  sound: true,
  music: true,
  volume: 0.35,
  speed: 1,
  auto: false,
  bossMode: 'sheet',
  pauseOnBlur: false
}

export const SCALES = [1, 1.5, 2, 3]

export type ModeKey = 'easy' | 'normal' | 'hard' | 'hell'

export interface Profile {
  salary: number
  perks: Record<string, number>
  /** 난이도별로 깬 요일 수 (0 이면 월요일만, 5 면 금요일까지 클리어) */
  unlocked: Record<ModeKey, number>
  runs: number
  wins: number
  bestRound: number
  totalKills: number
  /** 무한 야근 최고 라운드 */
  endlessBest: number
}

export const DEFAULT_PROFILE: Profile = { salary: 0, perks: {}, unlocked: { easy: 0, normal: 0, hard: 0, hell: 0 }, runs: 0, wins: 0, bestRound: 0, totalKills: 0, endlessBest: 0 }

export interface Boot {
  settings: Settings
  profile: Profile
  /** 쉬는 시간에 저장한 이어하기 (Sim 저장 형식) */
  run: unknown | null
  platform: string
  version: string
  /** 사용 가능한 배율 (화면 크기에 맞는 것만) */
  scales: number[]
  /** 시험용 자동 조작 */
  script: string | null
}

export const BOSS_KEY = 'Control+Alt+D'
export const INSTAGRAM_URL = 'https://www.instagram.com/easyticket.co.kr/'
export const MORE_APPS_URL = 'https://easyticket.co.kr/apps/'
