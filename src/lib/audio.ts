// Síntese local de cordas dedilhadas via Web Audio API.
// Sem MP3, sem rede, sem IA. Karplus-Strong simplificado + fallback oscilador.

import { midiToFreq } from './music'

let sharedCtx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) throw new Error('Web Audio API não suportada neste navegador.')
  sharedCtx = new AC()
  return sharedCtx
}

export function closeAudioContext() {
  try {
    sharedCtx?.close()
  } catch {
    /* ignore */
  }
  sharedCtx = null
}

/** Gera som de corda dedilhada (pluck) via buffer sintetizado. */
export function pluckFrequency(ctx: AudioContext, freq: number, when: number, duration = 1.4, gainValue = 0.22): void {
  const sampleRate = ctx.sampleRate
  const len = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(1, len, sampleRate)
  const data = buffer.getChannelData(0)
  // Karplus-Strong: ruído filtrado com decaimento.
  const period = Math.max(2, Math.round(sampleRate / freq))
  const delay = new Float32Array(period)
  for (let i = 0; i < period; i++) delay[i] = Math.random() * 2 - 1
  let idx = 0
  const decay = 0.996
  for (let i = 0; i < len; i++) {
    const cur = delay[idx]
    const next = delay[(idx + 1) % period]
    const v = decay * 0.5 * (cur + next)
    delay[idx] = v
    // Envelope exponencial para soar natural
    const t = i / sampleRate
    data[i] = v * Math.exp(-2.2 * t)
    idx = (idx + 1) % period
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = gainValue
  // Leve brilho: filtro passa-baixas acompanha a frequência
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = Math.min(8000, freq * 6)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start(when)
  src.stop(when + duration)
}

/** Toca um acorde com leve arpejo (strum). Retorna tempos agendados. */
export function playChordMidis(midis: number[], opts: { strumDelay?: number; duration?: number; gain?: number } = {}): number[] {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  const { strumDelay = 0.035, duration = 1.6, gain = 0.22 } = opts
  const t0 = ctx.currentTime + 0.02
  const times: number[] = []
  midis.forEach((m, i) => {
    const freq = midiToFreq(m)
    const when = t0 + i * strumDelay
    pluckFrequency(ctx, freq, when, duration, gain)
    times.push(when)
  })
  return times
}

/** Toca clique de metrônomo. Acento = frequência mais alta. */
export function playClick(when: number, accent: boolean): void {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = accent ? 1760 : 1174.66
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.32, when + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.09)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + 0.12)
}
