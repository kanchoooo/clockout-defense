// 무기·카드 아이콘 도트. 시계탑 둘레의 포대와 쉬는 시간 카드에 같이 쓴다.
const PAL: Record<string, string> = {
  k: '#14131f', w: '#f6f1e2', g: '#a9adbd', d: '#5b6079', s: '#d8dde8', r: '#e2413a', R: '#8e1f2a', o: '#ff8a2a', y: '#ffd23c', Y: '#c48412',
  b: '#7a4a24', B: '#3f2412', c: '#7fdcff', C: '#2f7fcc', l: '#3fa0ff', p: '#b58cff', P: '#54308c', n: '#7cc048', N: '#2f6a2a', h: '#fff0a8', m: '#ff7fb0', t: '#3a2a1e'
}

const S: Record<string, string[]> = {
  stapler: [
    '............', '..kkkkkkkk..', '.kssssssssk.', 'kgggggggggsk', 'kdddddddggsk', '.kkkkkkkdgsk', '.....kkkkgsk', '.krrrrrrrkgk', 'krrrrrrrrrkk', 'kRRRRRRRRRk.', '.kkkkkkkkk..', '............'
  ],
  card: [
    '............', '............', '.kkkkkkkkkk.', 'kwwwwwwwwwwk', 'kwCCwwggggwk', 'kwCCwwwwwwwk', 'kwwwwwggggwk', 'kwggwwwwwwwk', 'kwwwwwwwwwwk', '.kkkkkkkkkk.', '............', '............'
  ],
  copier: [
    '....kkkkkk..', '...kwwwwwk..', '.kkkwwwwwkkk', 'kgggggggggsk', 'kgsssssssgsk', 'kgggggygrgdk', 'kdddddddddk.', 'kdkkkkkkkdk.', 'kdkwwwwwkdk.', 'kdkkkkkkkdk.', 'kddddddddk..', '.kkkkkkkk...'
  ],
  quick: [
    '.........kk.', '.......kkrrk', '.....kkwwrrk', '...kkwwwwkk.', '..kgwwwwk...', '.kkgwCwk....', 'krkgwwk.....', 'krrkgk......', '.kkrkk......', 'oyokk.......', 'yo..........', '............'
  ],
  jet: [
    '............', '...kkkkk....', '..kbbbbbk...', '.kbwwwwbkkkk', 'kbbbbbbbbbok', 'kbBBBBBBbbyk', 'kbBttttBbbok', 'kbBBBBBBbkkk', '.kbbbbbbk...', '..kkkkkk....', '...kBk......', '..kkkkk.....'
  ],
  bomb: [
    '.......y.o..', '.....kk.y...', '....kbbk....', '...kkbbkk...', '..kwwwwwwk..', '.kwwrrrrwwk.', '.kwwyyyywwk.', '.kwwrrrrwwk.', '.kwwwwwwwwk.', '..kggggggk..', '...kkkkkk...', '............'
  ],
  fireworks: [
    '.y...r...y..', '...y.h.p....', 'r...yhy...o.', '.p.hyyyh.r..', '...yhkhy....', '.y..kRk..y..', '....kRk.....', '...krRRk....', '...krRRk....', '...krRRk....', '...kkkkk....', '............'
  ],
  aircon: [
    '.kkkkkkkkkk.', 'kwwwwwwwwwwk', 'kwssssssswwk', 'kwssssssswck', 'kgggggggggwk', 'kdkdkdkdkdgk', '.kkkkkkkkkk.', '..c..c..c...', '.c..c..c....', '..c..c..c...', '.c..c..c....', '............'
  ],
  lance: [
    '.........kk.', '.......kkck', '.....kkcwck.', '....kcwwck..', '...kcwck....', '..kcwck.....', '.kkck.......', 'kCkk........', 'kCk.........', '.k..........', '............', '............'
  ],
  multitap: [
    '.y........y.', '..y.kkkk.y..', '...kyyyyk...', '.kkkkkkkkkk.', 'kwwwwwwwwwwk', 'kwkkwkkwkkwk', 'kwkkwkkwkkwk', 'kwwwwwrrwwwk', '.kkkkkkkkkk.', '....kk......', '...kddk.....', '....kkkkkkk.'
  ],
  coil: [
    '...kkkkkk...', '..kggggggk..', '.kgyyyyyygk.', '.kggggggggk.', '..kkkkkkkk..', '....koyk....', '....kyok....', '....koyk....', '....kyok....', '...kdddk....', '..kdddddk...', '..kkkkkkk...'
  ],
  mold: [
    '...nn.......', '..nNNn...n..', '.nNnnNn.nNn.', '.nNnnNnnNnNn', '..nNNnnNnnNn', '...nn..nNNn.', '.......nn...', '.kkkkkkkkkk.', 'kggggggggggk', 'kdNdNdNdddgk', '.kkkkkkkkkk.', '............'
  ],
  overtime: [
    '....kkkk....', '..kkPPPPkk..', '.kPPkkkkPPk.', '.kPkpppkkPk.', 'kPkpkkkpkkPk', 'kPkpkkkkpkPk', 'kPkkpkkkpkPk', 'kPkkkpppkkPk', '.kPkkkkkPPk.', '.kkPPPPPPk..', '...kkkkkk...', '............'
  ],
  annual: [
    '............', '.kkkkkkkkkk.', 'kwwwwwwwwwwk', 'kwggggggggwk', 'kwwwwwwwwwwk', 'kwggggggwwwk', 'kwwwwwwwwwwk', 'kwwwwwrrrrwk', 'kwwwwrwwwrwk', 'kwwwwwrrrrwk', '.kkkkkkkkkk.', '............'
  ],
  wellness: [
    '............', '..kkk..kkk..', '.kmmmkkmmmk.', 'kmwmmmmmmmmk', 'kmmmmmmmmmmk', 'kmmmmwwmmmmk', '.kmmmwwmmmk.', '..kmmmmmmk..', '...kmmmmk...', '....kmmk....', '.....kk.....', '............'
  ],
  // ── 복지 카드 공용 아이콘
  cup: [
    '....c.c.....', '...c.c......', '.kkkkkkkk...', '.kwwwwwwkkk.', '.kbbbbbbk.k.', '.kwwwwwwk.k.', '.kwwwwwwkkk.', '.kwwwwwwk...', '..kwwwwk....', '..kkkkkk....', '............', '............'
  ],
  paper: [
    '..kkkkkkk...', '..kwwwwwkk..', '..kwgggwwwk.', '..kwwwwwwwk.', '..kwgggggwk.', '..kwwwwwwwk.', '..kwgggggwk.', '..kwwwwwwwk.', '..kwgggwwwk.', '..kwwwwwwwk.', '..kkkkkkkkk.', '............'
  ],
  coin: [
    '............', '...kkkkkk...', '..kyyyyyyk..', '.kyhhyyyyYk.', '.kyhYYYYyYk.', '.kyyYyyyyYk.', '.kyyYYYYyYk.', '.kyyyyyYyYk.', '..kYYYYYYk..', '...kkkkkk...', '............', '............'
  ],
  plug: [
    '...kk..kk...', '...kg..kg...', '..kkkkkkkk..', '..kddddddk..', '..kdddyddk..', '...kddddk...', '....kddk....', '.....kk.....', '.....kyk....', '....kyk.....', '.....kk.....', '............'
  ],
  stamp: [
    '....kkkk....', '...kbbbbk...', '...kbbbbk...', '....kbbk....', '....kbbk....', '...kkbbkk...', '.kkbbbbbbkk.', 'kbbbbbbbbbbk', 'kRRRRRRRRRRk', '.kkkkkkkkkk.', '...r..r.....', '.r.....r....'
  ],
  clock: [
    '...kkkkkk...', '.kkwwwwwwkk.', '.kwwwkwwwwk.', 'kwwwwkwwwwwk', 'kwwwwkwwwwwk', 'kwwwwkkkkwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', '.kwwwwwwwwk.', '.kkwwwwwwkk.', '...kkkkkk...', '............'
  ]
}

/** 복지 카드 → 공용 아이콘 */
export const ITEM_ICON: Record<string, string> = {
  americano: 'cup', extrashot: 'cup', energy: 'plug', grade_b: 'paper', grade_a: 'paper', grade_s: 'paper', incentive: 'coin', dual: 'clock', keyboard: 'plug', highlight: 'paper', checkup: 'wellness', gym: 'wellness',
  walk: 'wellness', overpay: 'coin', savings: 'coin', corpcard: 'card', tonic: 'cup', stamp: 'stamp', ink: 'stamp', draft: 'paper', wallet: 'card', needle: 'stapler', flask: 'cup', fan: 'aircon', powerstrip: 'multitap',
  nightsnack: 'cup', blast: 'bomb'
}

export interface Icon {
  w: number
  h: number
  /** ABGR, 0 은 빈칸 */
  px: Uint32Array
  url: string
}

function abgr(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0
}

const cache = new Map<string, Icon>()

export function icon(id: string): Icon {
  const hit = cache.get(id)
  if (hit) return hit
  const rows = S[id] ?? S.paper
  const h = rows.length
  const w = rows[0].length
  const px = new Uint32Array(w * h)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x]
      if (!ch || ch === '.') continue
      px[y * w + x] = abgr(PAL[ch])
      ctx.fillStyle = PAL[ch]
      ctx.fillRect(x, y, 1, 1)
    }
  }
  const out = { w, h, px, url: canvas.toDataURL() }
  cache.set(id, out)
  return out
}

export const SPRITE_IDS = Object.keys(S)
