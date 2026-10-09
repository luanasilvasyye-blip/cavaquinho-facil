import { describe, it, expect, beforeEach } from 'vitest'
import { emptyProgress, completeDay, addSession, planPercent, daysStudied, nextActivity } from '../src/lib/progress'

function memStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => {
      m.set(k, v)
    },
    removeItem: (k: string) => {
      m.delete(k)
    },
    clear: () => m.clear()
  }
}

beforeEach(() => {
  // @ts-ignore
  global.localStorage = memStorage() as any
})

describe('progresso do aluno', () => {
  it('conclui dias sem duplicar', () => {
    let p = emptyProgress()
    p = completeDay(p, 1)
    p = completeDay(p, 1)
    expect(p.completedDays).toEqual([1])
    expect(planPercent(p)).toBe(Math.round(100 / 7))
  })

  it('rejeita dia inválido', () => {
    expect(() => completeDay(emptyProgress(), 9)).toThrow()
  })

  it('persiste sessões e conta dias estudados', () => {
    let p = emptyProgress()
    p = addSession(p, { kind: 'trainer', chordA: 'G', chordB: 'C', swaps: 12, minutes: 1 })
    expect(p.sessions).toHaveLength(1)
    expect(p.sessions[0].swaps).toBe(12)
    expect(daysStudied(p)).toBeGreaterThanOrEqual(1)
  })

  it('sugere próxima atividade', () => {
    let p = emptyProgress()
    expect(nextActivity(p).href).toBe('/app/plano')
    for (let d = 1; d <= 7; d++) p = completeDay({ ...p, sessions: p.sessions }, d)
    expect(planPercent(p)).toBe(100)
    expect(nextActivity(p).href).toBeDefined()
  })

  it('porcentagem do plano vai a 100% com 7 dias', () => {
    let p = emptyProgress()
    for (let d = 1; d <= 7; d++) p = { ...p, completedDays: [...p.completedDays, d] }
    expect(planPercent(p)).toBe(100)
  })
})
