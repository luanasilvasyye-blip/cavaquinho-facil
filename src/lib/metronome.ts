// Agendador preciso do metrônomo (lookahead), não apenas setInterval para áudio.

export type TimeSignature = '2/4' | '3/4' | '4/4'

export function beatsPerBar(sig: TimeSignature): number {
  if (sig === '2/4') return 2
  if (sig === '3/4') return 3
  return 4
}

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return 80
  return Math.min(220, Math.max(40, Math.round(bpm)))
}

export interface ScheduledBeat {
  beatIndex: number // global
  beatInBar: number // 0-based
  time: number // audio clock
  accent: boolean
}

/**
 * Metrônomo com scheduler lookahead.
 * Uso: const m = new MetronomeEngine((beat, time) => playClick(time, beat.accent)); m.start(100, '4/4')
 * O callback de áudio agenda o som; o callback visual é chamado via onBeatVisual próximo ao tempo.
 */
export class MetronomeEngine {
  private ctx: AudioContext | null = null
  private timer: number | null = null
  private nextNoteTime = 0
  private currentBeat = 0
  bpm = 80
  signature: TimeSignature = '4/4'

  onAudioBeat: ((beat: ScheduledBeat) => void) | null = null
  onVisualBeat: ((beatInBar: number, beatIndex: number) => void) | null = null

  private lookahead = 25 // ms
  private scheduleAheadTime = 0.12 // s

  constructor(private getContext: () => AudioContext) {}

  get isRunning(): boolean {
    return this.timer !== null
  }

  start(bpm: number, sig: TimeSignature) {
    this.stop()
    this.bpm = clampBpm(bpm)
    this.signature = sig
    this.ctx = this.getContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.currentBeat = 0
    this.nextNoteTime = this.ctx.currentTime + 0.06
    this.timer = window.setInterval(() => this.scheduler(), this.lookahead)
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  setBpm(bpm: number) {
    this.bpm = clampBpm(bpm)
  }

  setSignature(sig: TimeSignature) {
    this.signature = sig
  }

  /** Puro e testável: calcula sequência de beats a partir de um tempo inicial. */
  static computeSchedule(startTime: number, bpm: number, sig: TimeSignature, count: number): ScheduledBeat[] {
    const b = clampBpm(bpm)
    const perBar = beatsPerBar(sig)
    const secPerBeat = 60 / b
    const out: ScheduledBeat[] = []
    for (let i = 0; i < count; i++) {
      const beatInBar = i % perBar
      out.push({
        beatIndex: i,
        beatInBar,
        time: startTime + i * secPerBeat,
        accent: beatInBar === 0
      })
    }
    return out
  }

  private scheduler() {
    if (!this.ctx) return
    const secPerBeat = 60 / this.bpm
    const perBar = beatsPerBar(this.signature)
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      const beatInBar = this.currentBeat % perBar
      const beat: ScheduledBeat = {
        beatIndex: this.currentBeat,
        beatInBar,
        time: this.nextNoteTime,
        accent: beatInBar === 0
      }
      this.onAudioBeat?.(beat)
      // Visual: dispara com delay até o tempo do áudio
      const delayMs = Math.max(0, (beat.time - this.ctx.currentTime) * 1000)
      const bi = this.currentBeat
      window.setTimeout(() => this.onVisualBeat?.(beatInBar, bi), delayMs)
      this.nextNoteTime += secPerBeat
      this.currentBeat += 1
    }
  }
}
