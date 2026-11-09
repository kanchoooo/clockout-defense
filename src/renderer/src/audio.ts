// 효과음·배경음: 파일 없이 WebAudio 로 그 자리에서 합성한다 (8비트 느낌).
export type Sfx = 'shoot' | 'zap' | 'boom' | 'hit' | 'kill' | 'hurt' | 'stamp' | 'buy' | 'promote' | 'reroll' | 'click' | 'deny' | 'ult' | 'boss' | 'round' | 'win' | 'lose' | 'heal' | 'freeze' | 'fire'

const NOTE = (n: number): number => 440 * Math.pow(2, (n - 69) / 12)

// 직접 지은 8마디 반복: [베이스 음, 아르페지오 3음]
const WORK: [number, number[]][] = [
  [45, [69, 72, 76]], [45, [69, 72, 76]], [41, [65, 69, 72]], [41, [65, 69, 72]],
  [48, [67, 72, 76]], [48, [67, 72, 76]], [43, [67, 71, 74]], [43, [67, 71, 74]]
]
const BOSS: [number, number[]][] = [
  [40, [64, 67, 71]], [40, [64, 67, 71]], [41, [65, 68, 72]], [40, [64, 67, 71]],
  [38, [62, 65, 69]], [40, [64, 67, 71]], [41, [65, 68, 72]], [47, [63, 66, 71]]
]

export class Audio_ {
  private ac: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private last = new Map<string, number>()
  enabled = true
  volume = 0.35
  music = true

  private track: 'none' | 'work' | 'boss' = 'none'
  private nextAt = 0
  private step = 0
  private timer: number | null = null

  private ctx(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.ac) {
      this.ac = new AudioContext()
      this.master = this.ac.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ac.destination)
      this.musicBus = this.ac.createGain()
      this.musicBus.gain.value = 0.34
      this.musicBus.connect(this.master)
    }
    if (this.ac.state === 'suspended') void this.ac.resume()
    return this.ac
  }

  set(on: boolean, vol: number, music: boolean): void {
    this.enabled = on
    this.volume = vol
    this.music = music
    if (this.master) this.master.gain.value = on ? vol : 0
    if (this.musicBus) this.musicBus.gain.value = music ? 0.34 : 0
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, gain: number, delay = 0, bus?: GainNode | null): void {
    const a = this.ctx()
    if (!a || !this.master) return
    const t = a.currentTime + delay
    this.toneAt(type, f0, f1, dur, gain, t, bus ?? this.master)
  }

  private toneAt(type: OscillatorType, f0: number, f1: number, dur: number, gain: number, t: number, bus: GainNode): void {
    const a = this.ac!
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(bus)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  private noise(dur: number, gain: number, freq: number, type: BiquadFilterType = 'lowpass', delay = 0): void {
    const a = this.ctx()
    if (!a || !this.master) return
    if (!this.noiseBuf) {
      this.noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    const t = a.currentTime + delay
    const s = a.createBufferSource()
    s.buffer = this.noiseBuf
    const f = a.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(freq, t)
    f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.25), t + dur)
    const g = a.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f).connect(g).connect(this.master)
    s.start(t)
    s.stop(t + dur + 0.02)
  }

  /** 같은 소리가 겹쳐 시끄러워지지 않게 최소 간격을 둔다 */
  private gap(key: string, ms: number): boolean {
    const now = performance.now()
    if (now - (this.last.get(key) ?? 0) < ms) return false
    this.last.set(key, now)
    return true
  }

  sfx(s: Sfx): void {
    if (!this.enabled) return
    switch (s) {
      case 'shoot': if (this.gap(s, 70)) this.tone('square', 880, 340, 0.06, 0.05); break
      case 'zap': if (this.gap(s, 90)) { this.tone('sawtooth', 1400, 300, 0.09, 0.05); this.noise(0.06, 0.05, 5000, 'highpass') } break
      case 'boom': if (this.gap(s, 90)) { this.noise(0.28, 0.2, 900); this.tone('triangle', 150, 40, 0.26, 0.2) } break
      case 'hit': if (this.gap(s, 60)) this.noise(0.04, 0.05, 2400, 'bandpass'); break
      case 'kill': if (this.gap(s, 55)) this.tone('square', 520, 180, 0.08, 0.05); break
      case 'hurt': if (this.gap(s, 120)) { this.tone('sawtooth', 200, 70, 0.18, 0.16); this.noise(0.1, 0.09, 700) } break
      case 'stamp': this.noise(0.1, 0.26, 500); this.tone('square', 120, 50, 0.13, 0.22); break
      case 'buy': this.tone('square', 660, 660, 0.06, 0.09); this.tone('square', 990, 990, 0.1, 0.09, 0.06); break
      case 'promote': [660, 830, 990, 1320].forEach((f, i) => this.tone('square', f, f, 0.09, 0.09, i * 0.06)); break
      case 'reroll': this.tone('triangle', 330, 660, 0.12, 0.13); break
      case 'click': this.tone('square', 760, 700, 0.03, 0.06); break
      case 'deny': this.tone('square', 170, 120, 0.13, 0.1); break
      case 'freeze': if (this.gap(s, 200)) { this.noise(0.22, 0.08, 6000, 'highpass'); this.tone('sine', 1500, 700, 0.2, 0.06) } break
      case 'fire': if (this.gap(s, 180)) this.noise(0.16, 0.05, 1200); break
      case 'heal': if (this.gap(s, 200)) [523, 659, 784].forEach((f, i) => this.tone('triangle', f, f, 0.14, 0.08, i * 0.05)); break
      case 'ult':
        this.noise(0.9, 0.3, 3000)
        ;[196, 247, 294, 392, 494, 587, 784].forEach((f, i) => this.tone('square', f, f * 1.02, 0.14, 0.12, i * 0.05))
        break
      case 'boss':
        for (let i = 0; i < 3; i++) this.tone('sawtooth', 220, 180, 0.3, 0.14, i * 0.4)
        break
      case 'round': [523, 784].forEach((f, i) => this.tone('square', f, f, 0.09, 0.08, i * 0.09)); break
      case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.16, 0.11, i * 0.12)); break
      case 'lose': [392, 370, 349, 262].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.3, 0.13, i * 0.22)); break
    }
  }

  playMusic(track: 'none' | 'work' | 'boss'): void {
    if (track === this.track) return
    this.track = track
    if (track === 'none') {
      if (this.timer !== null) clearInterval(this.timer)
      this.timer = null
      return
    }
    const a = this.ctx()
    if (!a) return
    this.step = 0
    this.nextAt = a.currentTime + 0.05
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 120)
  }

  private schedule(): void {
    const a = this.ac
    if (!a || !this.musicBus || !this.enabled || !this.music || this.track === 'none') return
    const beat = this.track === 'boss' ? 60 / 150 / 2 : 60 / 112 / 2
    const song = this.track === 'boss' ? BOSS : WORK
    if (this.nextAt < a.currentTime) this.nextAt = a.currentTime + 0.02
    while (this.nextAt < a.currentTime + 0.3) {
      const bar = Math.floor(this.step / 4) % song.length
      const beatInBar = this.step % 4
      const [bass, arp] = song[bar]
      if (beatInBar % 2 === 0) this.toneAt('triangle', NOTE(bass), NOTE(bass), beat * 1.6, 0.3, this.nextAt, this.musicBus)
      const n = arp[this.step % arp.length] + (this.step % 8 >= 6 ? 12 : 0)
      this.toneAt('square', NOTE(n), NOTE(n), beat * 0.8, 0.07, this.nextAt, this.musicBus)
      this.nextAt += beat
      this.step++
    }
  }
}

export const audio = new Audio_()
