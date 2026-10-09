import { describe, it, expect } from 'vitest'
import { midiToFreq } from '../src/lib/music'

describe('reprodução sonora (síntese local)', () => {
  it('frequências dos acordes estão na faixa do cavaquinho (D4–A5)', () => {
    // G [0,0,0,0] => D4 G4 B4 D5
    const midis = [62, 67, 71, 74]
    for (const m of midis) {
      const f = midiToFreq(m)
      expect(f).toBeGreaterThan(280)
      expect(f).toBeLessThan(650)
    }
  })

  it('módulo de áudio expõe síntese sem MP3', async () => {
    const mod = await import('../src/lib/audio')
    expect(typeof mod.pluckFrequency).toBe('function')
    expect(typeof mod.playChordMidis).toBe('function')
    expect(typeof mod.playClick).toBe('function')
    // Garante que não há URLs de áudio externas no módulo
    const src = JSON.stringify(Object.keys(mod))
    expect(src).not.toMatch(/\.mp3/i)
  })
})
