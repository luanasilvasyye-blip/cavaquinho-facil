import { describe, it, expect } from 'vitest'
import { createTrainer, nextSwitch, currentChordId, nextChordId, remainingSec, isFinished, progressRatio } from '../src/lib/trainer'

describe('treinador de trocas', () => {
  it('cria exercício com dois acordes diferentes', () => {
    const t = createTrainer('G', 'C', 60)
    expect(currentChordId(t)).toBe('G')
    expect(nextChordId(t)).toBe('C')
    expect(remainingSec(t)).toBe(60)
  })

  it('rejeita acordes iguais ou vazios', () => {
    expect(() => createTrainer('G', 'G', 60)).toThrow()
    expect(() => createTrainer('', 'C', 60)).toThrow()
  })

  it('limita duração a 10–600s', () => {
    expect(createTrainer('G', 'C', 5).durationSec).toBe(10)
    expect(createTrainer('G', 'C', 9999).durationSec).toBe(600)
  })

  it('alterna acordes a cada chamada', () => {
    let t = createTrainer('G', 'C', 60)
    t = nextSwitch(t)
    expect(currentChordId(t)).toBe('C')
    expect(nextChordId(t)).toBe('G')
    expect(t.switchesShown).toBe(1)
    t = nextSwitch(t)
    expect(currentChordId(t)).toBe('G')
  })

  it('termina no tempo e calcula progresso', () => {
    let t = createTrainer('G', 'C', 30)
    expect(isFinished(t)).toBe(false)
    t = { ...t, elapsedSec: 30 }
    expect(isFinished(t)).toBe(true)
    expect(remainingSec(t)).toBe(0)
    expect(progressRatio(t)).toBe(1)
  })
})
