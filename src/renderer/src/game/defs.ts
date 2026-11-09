// 게임 데이터: 부서·무기·복지 카드·적·라운드·요일. 숫자를 고칠 곳은 여기뿐이다.

export const W = 480
export const H = 300
export const TOWER = { x: 240, y: 172 }
export const TOWER_R = 26
/** 하루의 라운드 수 (09:00~18:00, 20분 단위) */
export const ROUNDS = 27
export const STEP_MIN = 20
export const LUNCH_ROUND = 9
/** 11:59 · 14:59 · 17:59 */
export const BOSS_ROUNDS = [8, 17, 26]
export const SLOTS = 6

export type Dept = 'admin' | 'pantry' | 'hvac' | 'it' | 'night' | 'hr'
export type Rarity = 1 | 2 | 3 | 4

/** 직급 — 같은 무기를 또 사면 승진한다 */
export const RANKS = ['사원', '대리', '과장', '차장', '부장', '이사'] as const
export const MAX_RANK = RANKS.length - 1
export const RANK_DMG = [1, 1.65, 2.6, 4.1, 6.2, 9.2]
export const RANK_CD = [1, 0.93, 0.86, 0.78, 0.72, 0.66]

export interface Stats {
  dmg: number
  atk: number
  range: number
  crit: number
  critDmg: number
  coin: number
  maxHp: number
  armor: number
  regen: number
  burn: number
  slow: number
  chain: number
  pierce: number
  bounce: number
  splash: number
  dark: number
  stampDmg: number
  stampCd: number
  ult: number
  interest: number
  freezeAmp: number
  killHeal: number
  freeRerolls: number
  startCoin: number
}

export const ZERO_STATS: Stats = {
  dmg: 0, atk: 0, range: 0, crit: 0.05, critDmg: 0.6, coin: 0, maxHp: 100, armor: 0, regen: 0, burn: 0, slow: 0,
  chain: 0, pierce: 0, bounce: 0, splash: 0, dark: 0, stampDmg: 0, stampCd: 0, ult: 0, interest: 0, freezeAmp: 0,
  killHeal: 0, freeRerolls: 0, startCoin: 0
}

export const DEPTS: Record<Dept, { name: string; icon: string; color: string; tiers: { n: number; desc: string; stats: Partial<Stats> }[] }> = {
  admin: {
    name: '총무팀', icon: '📎', color: '#d8c9a8',
    tiers: [
      { n: 2, desc: '공격 속도 +12%', stats: { atk: 0.12 } },
      { n: 4, desc: '공격 속도 +30%, 관통 +1', stats: { atk: 0.3, pierce: 1 } }
    ]
  },
  pantry: {
    name: '탕비실', icon: '☕', color: '#ff9a4a',
    tiers: [
      { n: 2, desc: '화상 피해 +40%', stats: { burn: 0.4 } },
      { n: 3, desc: '화상 +100%, 폭발 범위 +25%', stats: { burn: 1, splash: 0.25 } }
    ]
  },
  hvac: {
    name: '시설팀', icon: '❄', color: '#7fdcff',
    tiers: [
      { n: 2, desc: '둔화 +15%, 얼린 적이 받는 피해 +30%', stats: { slow: 0.15, freezeAmp: 0.3 } }
    ]
  },
  it: {
    name: '전산팀', icon: '⚡', color: '#ffe066',
    tiers: [
      { n: 2, desc: '연쇄 +1, 치명타 +8%', stats: { chain: 1, crit: 0.08 } }
    ]
  },
  night: {
    name: '야근조', icon: '🌙', color: '#b58cff',
    tiers: [
      { n: 2, desc: '독·어둠 피해 +45%, 처치 시 멘탈 조금 회복', stats: { dark: 0.45, killHeal: 0.12 } }
    ]
  },
  hr: {
    name: '인사팀', icon: '✨', color: '#ffe9a8',
    tiers: [
      { n: 2, desc: '모든 피해 +15%, 라운드 회복 +5', stats: { dmg: 0.15, regen: 5 } }
    ]
  }
}

export type WeaponKind = 'shot' | 'bounce' | 'spread' | 'cone' | 'splash' | 'nova' | 'pierce' | 'chain' | 'aura' | 'cloud' | 'orb' | 'smite' | 'firework' | 'homing' | 'heal'

type PerRank = number | [number, number, number, number]
/** 직급별 값. 표는 4단계까지이고 그 위는 마지막 증가폭으로 늘린다 */
export const atRank = (v: PerRank | undefined, rank: number): number => {
  if (v === undefined) return 0
  if (typeof v === 'number') return v
  return rank <= 3 ? v[rank] : v[3] + (v[3] - v[2]) * (rank - 3)
}

export interface WeaponDef {
  id: string
  name: string
  desc: string
  dept: Dept
  rar: Rarity
  price: number
  kind: WeaponKind
  dmg: number
  cd: number
  range: number
  speed?: number
  count?: PerRank
  bounces?: PerRank
  pierce?: PerRank
  splash?: PerRank
  chains?: PerRank
  burn?: number
  slow?: number
  freeze?: number
  dur?: number
  heal?: PerRank
}

export const WEAPONS: WeaponDef[] = [
  // ── 총무팀: 깔끔한 단일 사격
  { id: 'stapler', name: '스테이플러 석궁', desc: '가까운 업무에 철침을 박는다', dept: 'admin', rar: 1, price: 10, kind: 'shot', dmg: 8, cd: 0.5, range: 170, speed: 360 },
  { id: 'card', name: '명함 표창', desc: '명함을 돌리듯 적 사이를 튕긴다', dept: 'admin', rar: 2, price: 18, kind: 'bounce', dmg: 9, cd: 0.95, range: 170, speed: 300, bounces: [2, 3, 4, 6] },
  { id: 'copier', name: '복사기 산탄포', desc: '똑같은 서류를 부채꼴로 뿌린다', dept: 'admin', rar: 2, price: 20, kind: 'spread', dmg: 6, cd: 1.05, range: 130, speed: 320, count: [4, 5, 6, 8] },
  { id: 'quick', name: '퀵서비스 미사일', desc: '주소를 끝까지 찾아가 터진다', dept: 'admin', rar: 3, price: 34, kind: 'homing', dmg: 34, cd: 1.7, range: 240, speed: 170, splash: [26, 30, 34, 42] },
  // ── 탕비실: 화상과 폭발
  { id: 'jet', name: '뜨아 분사기', desc: '뜨거운 커피를 앞으로 뿜는다', dept: 'pantry', rar: 2, price: 20, kind: 'cone', dmg: 5, cd: 0.2, range: 96, burn: 8 },
  { id: 'bomb', name: '커피 폭탄', desc: '믹스커피를 던져 터뜨린다', dept: 'pantry', rar: 1, price: 12, kind: 'splash', dmg: 13, cd: 1.3, range: 175, speed: 210, splash: [26, 28, 32, 38], burn: 3 },
  { id: 'fireworks', name: '회식 폭죽', desc: '무리 한가운데서 3차까지 터진다', dept: 'pantry', rar: 3, price: 36, kind: 'firework', dmg: 26, cd: 2.2, range: 260, splash: [34, 36, 40, 46], count: [1, 2, 2, 3], burn: 5 },
  // ── 시설팀: 둔화
  { id: 'aircon', name: '에어컨 18도', desc: '주변을 얼려 느리게 만든다', dept: 'hvac', rar: 2, price: 18, kind: 'nova', dmg: 8, cd: 2.4, range: 92, slow: 0.45, dur: 2.2 },
  { id: 'lance', name: '아아 창', desc: '얼음 창이 줄줄이 꿰뚫고 얼린다', dept: 'hvac', rar: 2, price: 22, kind: 'pierce', dmg: 17, cd: 1.15, range: 220, speed: 400, pierce: [3, 4, 5, 7], freeze: 0.22 },
  // ── 전산팀: 연쇄 전기
  { id: 'multitap', name: '문어발 멀티탭', desc: '전기가 적을 타고 옮겨 간다', dept: 'it', rar: 2, price: 22, kind: 'chain', dmg: 11, cd: 0.95, range: 150, chains: [3, 4, 5, 7] },
  { id: 'coil', name: '정전기 코일', desc: '가까운 적 여럿을 동시에 지진다', dept: 'it', rar: 1, price: 12, kind: 'aura', dmg: 6, cd: 0.8, range: 88, count: [3, 4, 5, 7] },
  // ── 야근조: 독과 어둠
  { id: 'mold', name: '탕비실 곰팡이', desc: '독구름을 깔아 오래 괴롭힌다', dept: 'night', rar: 2, price: 20, kind: 'cloud', dmg: 9, cd: 2.5, range: 200, splash: [32, 36, 40, 48], dur: 4 },
  { id: 'overtime', name: '야근의 구체', desc: '느린 어둠이 모든 걸 빨아들이며 지나간다', dept: 'night', rar: 3, price: 36, kind: 'orb', dmg: 13, cd: 3.1, range: 240, speed: 62, splash: [22, 24, 28, 34], dur: 4.2 },
  // ── 인사팀: 빛
  { id: 'annual', name: '연차 결재', desc: '가장 센 적에게 하늘의 승인이 떨어진다', dept: 'hr', rar: 3, price: 38, kind: 'smite', dmg: 80, cd: 2.8, range: 300, splash: [20, 24, 28, 34] },
  { id: 'wellness', name: '사내 상담실', desc: '주기적으로 멘탈을 회복한다', dept: 'hr', rar: 2, price: 22, kind: 'heal', dmg: 0, cd: 5, range: 0, heal: [4, 6, 9, 14] }
]
export const WEAPON = Object.fromEntries(WEAPONS.map((w) => [w.id, w])) as Record<string, WeaponDef>

export interface ItemDef {
  id: string
  name: string
  desc: string
  rar: Rarity
  price: number
  stats?: Partial<Stats>
  /** 사자마자 받는 것 */
  coins?: number
  heal?: number
  /** 여러 번 살 수 있는 횟수 (기본 5) */
  max?: number
}

export const ITEMS: ItemDef[] = [
  { id: 'americano', name: '아메리카노', desc: '공격 속도 +8%', rar: 1, price: 8, stats: { atk: 0.08 } },
  { id: 'extrashot', name: '샷 추가', desc: '공격 속도 +16%', rar: 2, price: 16, stats: { atk: 0.16 } },
  { id: 'energy', name: '에너지 드링크', desc: '공격 속도 +30%, 최대 멘탈 -10', rar: 3, price: 28, stats: { atk: 0.3, maxHp: -10 } },
  { id: 'grade_b', name: '인사고과 B', desc: '피해 +8%', rar: 1, price: 9, stats: { dmg: 0.08 } },
  { id: 'grade_a', name: '인사고과 A', desc: '피해 +16%', rar: 2, price: 18, stats: { dmg: 0.16 } },
  { id: 'grade_s', name: '인사고과 S', desc: '피해 +32%', rar: 3, price: 32, stats: { dmg: 0.32 } },
  { id: 'incentive', name: '특별 성과급', desc: '피해 +60%', rar: 4, price: 58, stats: { dmg: 0.6 }, max: 2 },
  { id: 'dual', name: '듀얼 모니터', desc: '사거리 +12%', rar: 2, price: 14, stats: { range: 0.12 }, max: 3 },
  { id: 'keyboard', name: '기계식 키보드', desc: '치명타 +7%', rar: 1, price: 10, stats: { crit: 0.07 } },
  { id: 'highlight', name: '형광펜', desc: '치명타 피해 +35%', rar: 2, price: 16, stats: { critDmg: 0.35 } },
  { id: 'checkup', name: '건강검진', desc: '최대 멘탈 +20', rar: 1, price: 8, stats: { maxHp: 20 }, heal: 20 },
  { id: 'gym', name: '사내 헬스장', desc: '받는 피해 -8%', rar: 2, price: 16, stats: { armor: 0.08 }, max: 4 },
  { id: 'walk', name: '점심 산책', desc: '라운드마다 멘탈 +5', rar: 1, price: 10, stats: { regen: 5 } },
  { id: 'overpay', name: '야근 수당', desc: '처치 수당 +20%', rar: 2, price: 14, stats: { coin: 0.2 }, max: 3 },
  { id: 'savings', name: '적금 통장', desc: '이자 상한 +4', rar: 2, price: 14, stats: { interest: 4 }, max: 3 },
  { id: 'corpcard', name: '법인카드', desc: '바로 수당 24 받기', rar: 1, price: 12, coins: 24, max: 99 },
  { id: 'tonic', name: '쌍화탕', desc: '바로 멘탈 40 회복', rar: 1, price: 9, heal: 40, max: 99 },
  { id: 'stamp', name: '도장 장인', desc: '결재 도장 피해 +40%', rar: 1, price: 10, stats: { stampDmg: 0.4 } },
  { id: 'ink', name: '인주 리필', desc: '결재 도장 대기 -12%', rar: 2, price: 14, stats: { stampCd: 0.12 }, max: 4 },
  { id: 'draft', name: '사직서 초안', desc: '사직서 충전 +30%', rar: 2, price: 14, stats: { ult: 0.3 }, max: 3 },
  { id: 'wallet', name: '명함 지갑', desc: '튕김 +1', rar: 2, price: 16, stats: { bounce: 1 }, max: 3 },
  { id: 'needle', name: '굵은 철침', desc: '관통 +1', rar: 2, price: 16, stats: { pierce: 1 }, max: 3 },
  { id: 'flask', name: '보온병', desc: '화상 피해 +30%', rar: 1, price: 10, stats: { burn: 0.3 } },
  { id: 'fan', name: '서큘레이터', desc: '둔화 +10%, 얼린 적이 받는 피해 +20%', rar: 2, price: 16, stats: { slow: 0.1, freezeAmp: 0.2 }, max: 3 },
  { id: 'powerstrip', name: '연장선', desc: '연쇄 +1', rar: 2, price: 16, stats: { chain: 1 }, max: 3 },
  { id: 'nightsnack', name: '야식 쿠폰', desc: '독·어둠 피해 +30%', rar: 1, price: 10, stats: { dark: 0.3 } },
  { id: 'blast', name: '폭발 보험', desc: '폭발·구름 범위 +15%', rar: 2, price: 16, stats: { splash: 0.15 }, max: 3 }
]
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<string, ItemDef>

export type SpriteId =
  | 'wisp' | 'bat' | 'frog' | 'slime' | 'ghost' | 'snake' | 'eyeball' | 'skull' | 'jelly' | 'knight' | 'golem'
  | 'mailRed' | 'butterfly' | 'bird' | 'plane' | 'chair' | 'phone' | 'slimeBlue' | 'frogGold' | 'ghostRed' | 'skullBlue' | 'copybot' | 'pc' | 'knightGold' | 'golemRed'
  | 'ogre' | 'batlord' | 'kingslime' | 'printer' | 'spider' | 'vclich' | 'mimic' | 'lich' | 'phantom' | 'auditor' | 'partyogre' | 'hydra' | 'reaper' | 'alarm' | 'dragon'

export type ShotKind = 'eye' | 'lich' | 'dragon'

export type BossSkill =
  | { k: 'summon'; unit: SpriteId; n: number; cd: number }
  | { k: 'volley'; n: number; spread: number; cd: number; shot: ShotKind }
  | { k: 'shield'; t: number; cd: number }
  | { k: 'charge'; cd: number }
  | { k: 'jam'; cd: number }
  | { k: 'heal'; pct: number; cd: number }
  | { k: 'blink'; cd: number }
  | { k: 'seal'; cd: number }

export interface EnemyDef {
  id: SpriteId
  name: string
  hp: number
  speed: number
  dmg: number
  coin: number
  r: number
  /** 웨이브 예산에서 한 마리가 차지하는 값 */
  cost?: number
  flying?: boolean
  ai?: 'weave' | 'hop' | 'zig' | 'ranged' | 'kamikaze' | 'healer' | 'phase' | 'thief' | 'charge' | 'buffer' | 'summoner'
  armor?: number
  /** 죽으면 나오는 것 */
  split?: SpriteId
  /** 죽을 때 장비 하나를 잠깐 멈춘다 */
  jamOnDeath?: boolean
  boss?: boolean
  /** 보스가 멈춰 서는 거리 (기본: 탑에 붙음) */
  stand?: number
  skills?: BossSkill[]
}

const NOON = 2800
const MID = 11000
const LAST = 40000

export const ENEMIES: Record<SpriteId, EnemyDef> = {
  // ── 일반 유닛
  wisp: { id: 'wisp', name: '안 읽은 메일', hp: 5, speed: 44, dmg: 2, coin: 1, r: 7, cost: 1, flying: true },
  mailRed: { id: 'mailRed', name: '긴급 메일', hp: 7, speed: 68, dmg: 3, coin: 1, r: 7, cost: 1.4, flying: true },
  bat: { id: 'bat', name: '민원 전화', hp: 8, speed: 62, dmg: 2, coin: 1, r: 8, cost: 1.2, flying: true, ai: 'weave' },
  butterfly: { id: 'butterfly', name: '월요병 나비', hp: 9, speed: 42, dmg: 2, coin: 1, r: 8, cost: 1.2, flying: true, ai: 'weave' },
  plane: { id: 'plane', name: '결재 종이비행기', hp: 6, speed: 112, dmg: 4, coin: 1, r: 6, cost: 2.6, flying: true, ai: 'kamikaze' },
  bird: { id: 'bird', name: '찌라시 비둘기', hp: 16, speed: 80, dmg: 0, coin: 3, r: 8, cost: 2, flying: true, ai: 'thief' },
  frog: { id: 'frog', name: '출장 개구리', hp: 14, speed: 36, dmg: 3, coin: 1, r: 9, cost: 1.5, ai: 'hop' },
  frogGold: { id: 'frogGold', name: '해외출장 개구리', hp: 36, speed: 42, dmg: 6, coin: 4, r: 10, cost: 3.4, ai: 'hop' },
  slime: { id: 'slime', name: '회의 슬라임', hp: 30, speed: 22, dmg: 4, coin: 2, r: 12, cost: 3, split: 'wisp' },
  slimeBlue: { id: 'slimeBlue', name: '연장 회의 슬라임', hp: 60, speed: 20, dmg: 5, coin: 3, r: 13, cost: 6, split: 'slime' },
  ghost: { id: 'ghost', name: '야근 유령', hp: 20, speed: 32, dmg: 4, coin: 2, r: 10, cost: 2.4, flying: true, ai: 'phase' },
  ghostRed: { id: 'ghostRed', name: '주말 출근 유령', hp: 36, speed: 38, dmg: 6, coin: 3, r: 10, cost: 3.6, flying: true, ai: 'phase' },
  snake: { id: 'snake', name: '사내 정치', hp: 16, speed: 58, dmg: 3, coin: 2, r: 10, cost: 2, ai: 'zig' },
  eyeball: { id: 'eyeball', name: '눈치', hp: 24, speed: 28, dmg: 3, coin: 2, r: 10, cost: 2.6, flying: true, ai: 'ranged' },
  skull: { id: 'skull', name: '번아웃', hp: 14, speed: 76, dmg: 9, coin: 2, r: 9, cost: 7, flying: true, ai: 'kamikaze' },
  skullBlue: { id: 'skullBlue', name: '만성 과로', hp: 36, speed: 70, dmg: 15, coin: 3, r: 9, cost: 12, flying: true, ai: 'kamikaze', armor: 0.25 },
  jelly: { id: 'jelly', name: '보고 라인', hp: 34, speed: 26, dmg: 3, coin: 3, r: 11, cost: 4, flying: true, ai: 'healer' },
  chair: { id: 'chair', name: '폭주 사무의자', hp: 34, speed: 28, dmg: 6, coin: 3, r: 12, cost: 3.4, ai: 'charge' },
  phone: { id: 'phone', name: '울리는 내선전화', hp: 26, speed: 22, dmg: 3, coin: 3, r: 10, cost: 3.6, ai: 'buffer' },
  copybot: { id: 'copybot', name: '복사 로봇', hp: 44, speed: 18, dmg: 4, coin: 4, r: 11, cost: 5, ai: 'summoner' },
  pc: { id: 'pc', name: '블루스크린 PC', hp: 50, speed: 18, dmg: 7, coin: 4, r: 12, cost: 5, armor: 0.3, jamOnDeath: true },
  knight: { id: 'knight', name: '결재판 기사', hp: 62, speed: 22, dmg: 7, coin: 4, r: 13, cost: 5, armor: 0.45 },
  knightGold: { id: 'knightGold', name: '임원 경호 기사', hp: 120, speed: 21, dmg: 11, coin: 6, r: 13, cost: 9, armor: 0.6 },
  golem: { id: 'golem', name: '서류더미 골렘', hp: 150, speed: 15, dmg: 12, coin: 7, r: 18, cost: 10 },
  golemRed: { id: 'golemRed', name: '산더미 야근 골렘', hp: 320, speed: 14, dmg: 18, coin: 10, r: 18, cost: 18, armor: 0.15 },

  // ── 월요일 보스
  ogre: { id: 'ogre', name: '긴급회의 오우거', hp: NOON, speed: 13, dmg: 18, coin: 40, r: 26, boss: true, skills: [{ k: 'summon', unit: 'slime', n: 3, cd: 6 }] },
  batlord: { id: 'batlord', name: '콜센터 박쥐왕', hp: MID, speed: 20, dmg: 12, coin: 70, r: 28, boss: true, flying: true, stand: 96, skills: [{ k: 'summon', unit: 'bat', n: 6, cd: 5 }, { k: 'volley', n: 3, spread: 0.24, cd: 3, shot: 'eye' }] },
  kingslime: { id: 'kingslime', name: '월요병 대왕 슬라임', hp: LAST, speed: 10, dmg: 24, coin: 150, r: 36, boss: true, split: 'slimeBlue', skills: [{ k: 'summon', unit: 'slime', n: 4, cd: 5 }, { k: 'heal', pct: 0.03, cd: 10 }] },
  // ── 화요일 보스
  printer: { id: 'printer', name: '잼 걸린 복합기', hp: NOON, speed: 12, dmg: 16, coin: 40, r: 28, boss: true, stand: 76, skills: [{ k: 'jam', cd: 7 }, { k: 'summon', unit: 'plane', n: 6, cd: 5 }] },
  spider: { id: 'spider', name: '엉킨 랜선 거미', hp: MID, speed: 24, dmg: 14, coin: 70, r: 30, boss: true, skills: [{ k: 'blink', cd: 8 }, { k: 'summon', unit: 'snake', n: 4, cd: 6 }] },
  vclich: { id: 'vclich', name: '화상회의 리치', hp: LAST, speed: 16, dmg: 16, coin: 150, r: 24, boss: true, flying: true, stand: 112, skills: [{ k: 'volley', n: 3, spread: 0.2, cd: 2.4, shot: 'lich' }, { k: 'shield', t: 2.4, cd: 11 }, { k: 'blink', cd: 9 }, { k: 'summon', unit: 'phone', n: 2, cd: 8 }] },
  // ── 수요일 보스
  mimic: { id: 'mimic', name: '캐비닛 미믹', hp: NOON, speed: 16, dmg: 20, coin: 40, r: 26, boss: true, skills: [{ k: 'charge', cd: 6 }, { k: 'summon', unit: 'copybot', n: 1, cd: 7 }] },
  lich: { id: 'lich', name: '주간보고 리치', hp: MID, speed: 16, dmg: 14, coin: 70, r: 24, boss: true, flying: true, stand: 112, skills: [{ k: 'volley', n: 3, spread: 0.22, cd: 2.6, shot: 'lich' }, { k: 'shield', t: 2.6, cd: 10 }, { k: 'summon', unit: 'knight', n: 3, cd: 10 }] },
  phantom: { id: 'phantom', name: '야근 대왕 유령', hp: LAST, speed: 16, dmg: 22, coin: 150, r: 30, boss: true, flying: true, stand: 64, ai: 'phase', skills: [{ k: 'blink', cd: 6 }, { k: 'volley', n: 5, spread: 0.2, cd: 3.2, shot: 'lich' }, { k: 'summon', unit: 'ghostRed', n: 3, cd: 7 }] },
  // ── 목요일 보스
  auditor: { id: 'auditor', name: '내부감사의 눈', hp: NOON, speed: 16, dmg: 12, coin: 40, r: 30, boss: true, flying: true, stand: 122, skills: [{ k: 'volley', n: 5, spread: 0.16, cd: 3, shot: 'eye' }, { k: 'seal', cd: 9 }, { k: 'summon', unit: 'eyeball', n: 2, cd: 7 }] },
  partyogre: { id: 'partyogre', name: '회식 3차 오우거', hp: MID, speed: 15, dmg: 22, coin: 70, r: 26, boss: true, skills: [{ k: 'charge', cd: 5 }, { k: 'summon', unit: 'skull', n: 3, cd: 6 }] },
  hydra: { id: 'hydra', name: '결재선 히드라', hp: LAST, speed: 11, dmg: 26, coin: 150, r: 36, boss: true, stand: 86, skills: [{ k: 'volley', n: 3, spread: 0.5, cd: 2.6, shot: 'dragon' }, { k: 'heal', pct: 0.03, cd: 8 }, { k: 'summon', unit: 'knightGold', n: 2, cd: 9 }] },
  // ── 금요일 보스
  reaper: { id: 'reaper', name: '희망퇴직 사신', hp: NOON, speed: 24, dmg: 20, coin: 40, r: 26, boss: true, flying: true, stand: 100, skills: [{ k: 'blink', cd: 5 }, { k: 'seal', cd: 8 }, { k: 'volley', n: 3, spread: 0.3, cd: 2.4, shot: 'lich' }, { k: 'summon', unit: 'skull', n: 2, cd: 7 }] },
  alarm: { id: 'alarm', name: '알람시계 골렘', hp: MID, speed: 13, dmg: 26, coin: 70, r: 32, boss: true, skills: [{ k: 'jam', cd: 6 }, { k: 'charge', cd: 7 }, { k: 'summon', unit: 'chair', n: 4, cd: 5 }, { k: 'shield', t: 2, cd: 12 }] },
  dragon: { id: 'dragon', name: '17시 59분 업무지시', hp: LAST, speed: 14, dmg: 26, coin: 150, r: 34, boss: true, flying: true, stand: 104, skills: [{ k: 'volley', n: 5, spread: 0.16, cd: 2.6, shot: 'dragon' }, { k: 'summon', unit: 'skullBlue', n: 3, cd: 9 }, { k: 'summon', unit: 'knightGold', n: 1, cd: 10 }, { k: 'jam', cd: 12 }] }
}

export const ALL_BOSSES = (Object.values(ENEMIES) as EnemyDef[]).filter((e) => e.boss).map((e) => e.id)
export const ALL_UNITS = (Object.values(ENEMIES) as EnemyDef[]).filter((e) => !e.boss).map((e) => e.id)

export interface WaveDef {
  /** [종류, 마리 수] */
  mix: [SpriteId, number][]
  secs: number
  boss?: SpriteId
}

export type ModeId = 'easy' | 'normal' | 'hard' | 'hell'
export const MODE_ORDER: ModeId[] = ['easy', 'normal', 'hard', 'hell']

export const MODES: Record<ModeId, { id: ModeId; name: string; desc: string; color: string; hp: number; dmg: number; count: number; salary: number }> = {
  easy: { id: 'easy', name: '이지', desc: '인턴 체험. 적이 약하고 월급도 적어요.', color: '#7ee88a', hp: 0.68, dmg: 0.65, count: 0.85, salary: 0.7 },
  normal: { id: 'normal', name: '노말', desc: '평범한 직장 생활.', color: '#7fdcff', hp: 1, dmg: 1, count: 1, salary: 1 },
  hard: { id: 'hard', name: '하드', desc: '노말 금요일을 깨면 열려요.', color: '#ffb340', hp: 1.65, dmg: 1.3, count: 1.15, salary: 1.7 },
  hell: { id: 'hell', name: '헬', desc: '하드 금요일을 깨면 열려요.', color: '#ff5a50', hp: 2.8, dmg: 1.7, count: 1.3, salary: 2.8 }
}

export interface DayDef {
  id: number
  name: string
  short: string
  desc: string
  hp: number
  dmg: number
  count: number
  salary: number
  bosses: [SpriteId, SpriteId, SpriteId]
  /** [유닛, 처음 나오는 라운드] */
  roster: [SpriteId, number][]
  endless?: boolean
}

export const ENDLESS_DAY = 5

export const DAYS: DayDef[] = [
  { id: 0, name: '월요일', short: '월', desc: '월요병 주의. 메일과 회의가 쏟아진다.', hp: 1.2, dmg: 1, count: 1, salary: 100, bosses: ['ogre', 'batlord', 'kingslime'], roster: [['wisp', 0], ['bat', 1], ['frog', 3], ['butterfly', 4], ['slime', 5], ['mailRed', 7], ['plane', 12], ['snake', 16], ['ghost', 18], ['knight', 20]] },
  { id: 1, name: '화요일', short: '화', desc: '전화와 결재가 날아다니는 날.', hp: 1.42, dmg: 1.1, count: 1.1, salary: 160, bosses: ['printer', 'spider', 'vclich'], roster: [['wisp', 0], ['plane', 1], ['bat', 2], ['phone', 4], ['frog', 5], ['snake', 7], ['slime', 10], ['mailRed', 12], ['knight', 15], ['eyeball', 18], ['golem', 22]] },
  { id: 2, name: '수요일', short: '수', desc: '주간보고가 겹치고 야근이 시작된다.', hp: 1.65, dmg: 1.2, count: 1.2, salary: 240, bosses: ['mimic', 'lich', 'phantom'], roster: [['wisp', 0], ['bat', 1], ['ghost', 2], ['slime', 4], ['copybot', 6], ['eyeball', 8], ['slimeBlue', 11], ['knight', 13], ['jelly', 16], ['ghostRed', 19], ['golem', 22]] },
  { id: 3, name: '목요일', short: '목', desc: '감사와 회식. 다들 예민하다.', hp: 1.85, dmg: 1.3, count: 1.25, salary: 340, bosses: ['auditor', 'partyogre', 'hydra'], roster: [['bat', 0], ['snake', 1], ['chair', 3], ['bird', 5], ['skull', 6], ['ghost', 8], ['pc', 10], ['knight', 12], ['eyeball', 15], ['jelly', 17], ['golem', 20], ['skullBlue', 22]] },
  { id: 4, name: '금요일', short: '금', desc: '불금을 지키는 마지막 전투.', hp: 2.15, dmg: 1.4, count: 1.3, salary: 500, bosses: ['reaper', 'alarm', 'dragon'], roster: [['wisp', 0], ['frog', 0], ['frogGold', 3], ['chair', 4], ['skull', 6], ['pc', 8], ['knight', 10], ['ghostRed', 11], ['skullBlue', 13], ['knightGold', 15], ['golem', 17], ['jelly', 18], ['golemRed', 21]] },
  { id: 5, name: '무한 야근', short: '∞', desc: '퇴근은 없다. 어디까지 버틸까?', hp: 1.5, dmg: 1.2, count: 1.2, salary: 60, bosses: ['ogre', 'batlord', 'kingslime'], roster: ALL_UNITS.map((u, i) => [u, Math.floor(i * 1.1)] as [SpriteId, number]), endless: true }
]

/** 적 수 배수 — 화면에 몰려오는 맛 */
export const SWARM = 2

function hash(a: number, b: number, c: number): number {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const waveCache = new Map<number, WaveDef>()

/** 요일·라운드별 웨이브. 요일 명단에서 정해진 규칙으로 뽑으므로 같은 요일은 항상 같은 구성이다 */
export function waveFor(day: number, round: number): WaveDef {
  const key = day * 1000 + round
  const hit = waveCache.get(key)
  if (hit) return hit
  const D = DAYS[day]
  const isBoss = D.endless ? (round + 1) % 9 === 0 : BOSS_ROUNDS.includes(round)
  const p = Math.min(1.35, round / (ROUNDS - 1))
  const budget = (15 + 150 * Math.pow(p, 1.2)) * SWARM * (isBoss ? 0.45 : 1)
  const avail = D.roster.filter(([, from]) => from <= round).map(([u]) => u)
  // 새로 등장한 유닛을 꼭 넣고, 나머지는 라운드마다 다르게 섞는다
  const fresh = D.roster.filter(([, from]) => from === round).map(([u]) => u)
  const pool = [...avail].sort((a, b) => hash(day, round, a.length * 31 + a.charCodeAt(0) + a.charCodeAt(a.length - 1) * 7) - hash(day, round, b.length * 31 + b.charCodeAt(0) + b.charCodeAt(b.length - 1) * 7))
  const types = Math.min(avail.length, 2 + Math.floor(p * 3))
  const picked = [...new Set([...fresh, ...pool])].slice(0, types)
  const mix: [SpriteId, number][] = picked.map((u) => [u, Math.max(1, Math.round(budget / picked.length / (ENEMIES[u].cost ?? 1)))])
  let boss: SpriteId | undefined
  if (isBoss) {
    if (D.endless) boss = ALL_BOSSES[Math.floor(round / 9) % ALL_BOSSES.length]
    else boss = D.bosses[BOSS_ROUNDS.indexOf(round)]
  }
  const wave: WaveDef = { mix, secs: isBoss ? 24 : 20 + 15 * Math.min(1, p), boss }
  waveCache.set(key, wave)
  return wave
}

export const isLunch = (round: number): boolean => round === LUNCH_ROUND

export interface PerkDef {
  id: string
  name: string
  desc: string
  max: number
  price: number
  stats: Partial<Stats>
}

export const PERKS: PerkDef[] = [
  { id: 'cafeteria', name: '사내식당', desc: '최대 멘탈 +10', max: 10, price: 60, stats: { maxHp: 10 } },
  { id: 'salary', name: '초봉 협상', desc: '시작 수당 +6', max: 8, price: 70, stats: { startCoin: 6 } },
  { id: 'career', name: '경력 인정', desc: '피해 +5%', max: 12, price: 90, stats: { dmg: 0.05 } },
  { id: 'overtime', name: '주 52시간', desc: '공격 속도 +3%', max: 10, price: 90, stats: { atk: 0.03 } },
  { id: 'refresh', name: '리프레시 휴가', desc: '라운드 회복 +2', max: 8, price: 60, stats: { regen: 2 } },
  { id: 'chairgood', name: '인체공학 의자', desc: '받는 피해 -2%', max: 8, price: 110, stats: { armor: 0.02 } },
  { id: 'senior', name: '근속 수당', desc: '처치 수당 +6%', max: 8, price: 80, stats: { coin: 0.06 } },
  { id: 'stock', name: '우리사주', desc: '이자 상한 +2', max: 5, price: 110, stats: { interest: 2 } },
  { id: 'reroll', name: '업무 재배정', desc: '쉬는 시간마다 무료 새로고침 +1', max: 3, price: 200, stats: { freeRerolls: 1 } },
  { id: 'stampmaster', name: '전자결재', desc: '결재 도장 피해 +20%', max: 8, price: 50, stats: { stampDmg: 0.2 } }
]

export const perkPrice = (base: number, lv: number): number => Math.round(base * Math.pow(1.32, lv))

export const RAR_NAME: Record<Rarity, string> = { 1: '일반', 2: '우수', 3: '희귀', 4: '전설' }
export const RAR_COLOR: Record<Rarity, string> = { 1: '#c9c4d6', 2: '#6fc3ff', 3: '#c58bff', 4: '#ffb340' }

/** 라운드(0부터)에 따른 등급 확률 [일반, 우수, 희귀, 전설] */
export function rarityWeights(round: number): [number, number, number, number] {
  const r = Math.min(1, round / (ROUNDS - 1))
  return [Math.max(10, 70 - 62 * r), 26 + 16 * r, 4 + 30 * r, r < 0.3 ? 0 : 14 * r]
}

/** 라운드(0부터)에 따른 적 체력 배수 */
export const hpScale = (r: number): number => 1 + 0.16 * r + 0.042 * r * r

export const clockText = (min: number): string => {
  const h = Math.floor(min / 60) % 24
  const m = Math.floor(min % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
