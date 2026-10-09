import { describe, it, expect } from 'vitest'
import {
  TUNING_MIDI,
  TUNING_NAMES,
  CHORDS,
  chordNotes,
  validateChordTones,
  validateChordCompleteness,
  fretToMidi,
  midiToNoteName,
  midiToFreq,
  midiToPitchClass,
  getChord
} from '../src/lib/music'

describe('afinação brasileira Ré–Sol–Si–Ré', () => {
  it('tem 4 cordas D4 G4 B4 D5', () => {
    expect([...TUNING_NAMES]).toEqual(['D4', 'G4', 'B4', 'D5'])
    expect([...TUNING_MIDI]).toEqual([62, 67, 71, 74])
  })

  it('converte traste em MIDI corretamente', () => {
    expect(fretToMidi(0, 0)).toBe(62) // 4ª solta = D4
    expect(fretToMidi(1, 0)).toBe(67) // 3ª solta = G4
    expect(fretToMidi(2, 0)).toBe(71) // 2ª solta = B4
    expect(fretToMidi(3, 0)).toBe(74) // 1ª solta = D5
    expect(midiToNoteName(fretToMidi(2, 1))).toBe('C') // Si + 1 = Dó
    expect(midiToNoteName(fretToMidi(0, 2))).toBe('E') // Ré + 2 = Mi
  })

  it('rejeita trastes inválidos', () => {
    expect(() => fretToMidi(0, -1)).toThrow()
    expect(() => fretToMidi(5, 0)).toThrow()
  })

  it('frequências seguem A440', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5)
    expect(midiToFreq(62)).toBeCloseTo(293.66, 1) // D4
  })
})

describe('biblioteca de acordes', () => {
  it('tem pelo menos 10 acordes', () => {
    expect(CHORDS.length).toBeGreaterThanOrEqual(10)
  })

  it('todos os diagramas usam apenas tons do acorde', () => {
    for (const c of CHORDS) {
      const v = validateChordTones(c)
      expect(v.ok, `${c.id}: ${v.badNotes.join('; ')}`).toBe(true)
    }
  })

  it('todos os acordes estão completos (nenhum tom faltando)', () => {
    for (const c of CHORDS) {
      const v = validateChordCompleteness(c)
      expect(v.ok, `${c.id} faltando pcs ${v.missing}`).toBe(true)
    }
  })

  it('voicings conhecidos estão corretos', () => {
    expect(getChord('G').frets).toEqual([0, 0, 0, 0])
    expect(getChord('G7').frets).toEqual([0, 0, 0, 3])
    expect(getChord('C').frets).toEqual([2, 0, 1, 2])
    // Sol aberto = D G B D
    const gNotes = chordNotes(getChord('G')).map((n) => n.name)
    expect(gNotes).toEqual(['D', 'G', 'B', 'D'])
    // Dó = E G C E
    const cNotes = chordNotes(getChord('C')).map((n) => n.name)
    expect(cNotes).toEqual(['E', 'G', 'C', 'E'])
  })

  it('Ré e Ré menor diferem em 1 casa (par pedagógico)', () => {
    const d = getChord('D')
    const dm = getChord('Dm')
    expect(d.frets.slice(0, 3)).toEqual(dm.frets.slice(0, 3))
    expect(d.frets[3]).toBe(4)
    expect(dm.frets[3]).toBe(3)
  })

  it('dedos são válidos (0–4) e casam com casas', () => {
    for (const c of CHORDS) {
      c.fingers.forEach((f, i) => {
        expect(f).toBeGreaterThanOrEqual(0)
        expect(f).toBeLessThanOrEqual(4)
        if (c.frets[i] === 0) expect(f).toBe(0)
        else expect(f).toBeGreaterThan(0)
      })
    }
  })

  it('pitch class de cada nota confere com o diagrama', () => {
    for (const c of CHORDS) {
      const notes = chordNotes(c)
      expect(notes).toHaveLength(4)
      notes.forEach((n, i) => {
        expect(n.midi).toBe(TUNING_MIDI[i] + c.frets[i])
        expect(midiToPitchClass(n.midi)).toBe(midiToPitchClass(TUNING_MIDI[i] + c.frets[i]))
      })
    }
  })
})
