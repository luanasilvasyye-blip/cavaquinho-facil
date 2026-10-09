import { describe, it, expect } from 'vitest'
import { MetronomeEngine, beatsPerBar, clampBpm } from '../src/lib/metronome'

describe('metrônomo', () => {
  it('limita BPM a 40–220', () => {
    expect(clampBpm(20)).toBe(40)
    expect(clampBpm(300)).toBe(220)
    expect(clampBpm(120)).toBe(120)
    expect(clampBpm(NaN)).toBe(80)
  })

  it('compassos têm batidas corretas', () => {
    expect(beatsPerBar('2/4')).toBe(2)
    expect(beatsPerBar('3/4')).toBe(3)
    expect(beatsPerBar('4/4')).toBe(4)
  })

  it('agenda batidas com tempo exato (sem drift de setInterval)', () => {
    const s = MetronomeEngine.computeSchedule(100, 60, '4/4', 4)
    expect(s.map((b) => b.time)).toEqual([100, 101, 102, 103])
    expect(s[0].accent).toBe(true)
    expect(s[1].accent).toBe(false)
  })

  it('120 BPM = 0.5s por batida e acento no 1', () => {
    const s = MetronomeEngine.computeSchedule(0, 120, '3/4', 6)
    expect(s[0].time).toBeCloseTo(0)
    expect(s[1].time).toBeCloseTo(0.5)
    expect(s[3].beatInBar).toBe(0)
    expect(s[3].accent).toBe(true)
    expect(s[4].accent).toBe(false)
  })

  it('2/4 alterna acento a cada 2 batidas', () => {
    const s = MetronomeEngine.computeSchedule(0, 100, '2/4', 4)
    expect(s.map((b) => b.accent)).toEqual([true, false, true, false])
  })
})
