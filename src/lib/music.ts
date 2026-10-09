// Teoria musical verificada para cavaquinho brasileiro.
// Afinação: Ré - Sol - Si - Ré (D4 G4 B4 D5)
// Ordem física: corda 4 (grave) -> corda 1 (aguda).
// strings[0] = corda 4 = D4, strings[3] = corda 1 = D5.

export const TUNING_NAMES = ['D4', 'G4', 'B4', 'D5'] as const
export const TUNING_MIDI = [62, 67, 71, 74] as const // D4, G4, B4, D5
export const STRING_LABELS = ['4ª Ré', '3ª Sol', '2ª Si', '1ª Ré'] as const

export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

// Nomes amigáveis em pt-BR (sustenidos)
const PT_NAMES: Record<string, string> = {
  'C': 'Dó',
  'C#': 'Dó#',
  'D': 'Ré',
  'D#': 'Ré#',
  'E': 'Mi',
  'F': 'Fá',
  'F#': 'Fá#',
  'G': 'Sol',
  'G#': 'Sol#',
  'A': 'Lá',
  'A#': 'Lá#',
  'B': 'Si'
}

export function midiToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}

export function midiToNoteName(midi: number): string {
  return NOTE_NAMES_SHARP[midiToPitchClass(midi)]
}

export function midiToPtName(midi: number): string {
  return PT_NAMES[midiToNoteName(midi)]
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function fretToMidi(stringIndex: number, fret: number): number {
  if (stringIndex < 0 || stringIndex > 3) throw new Error('stringIndex inválido')
  if (!Number.isInteger(fret) || fret < 0 || fret > 15) throw new Error('fret inválido')
  return TUNING_MIDI[stringIndex] + fret
}

export interface ChordDefinition {
  id: string
  name: string
  short: string
  /** frets[0]=corda4 ... frets[3]=corda1 */
  frets: [number, number, number, number]
  /** fingers[0]=corda4 ... 0=corda solta */
  fingers: [number, number, number, number]
  /** pitch classes esperadas (0-11) */
  pitchClasses: number[]
  description: string
  level: 'iniciante' | 'fácil'
}

// 12 acordes verificados. Cada voicing contém APENAS tons do acorde.
// Verificação automatizada em tests/chords.test.ts
export const CHORDS: ChordDefinition[] = [
  {
    id: 'G',
    name: 'Sol maior',
    short: 'G',
    frets: [0, 0, 0, 0],
    fingers: [0, 0, 0, 0],
    pitchClasses: [7, 11, 2],
    description: 'Todas as cordas soltas. Ré–Sol–Si–Ré forma Sol maior.',
    level: 'iniciante'
  },
  {
    id: 'G7',
    name: 'Sol com sétima',
    short: 'G7',
    frets: [0, 0, 0, 3],
    fingers: [0, 0, 0, 3],
    pitchClasses: [7, 11, 2, 5],
    description: 'Igual ao Sol, com Fá na 1ª corda. Som de samba clássico.',
    level: 'iniciante'
  },
  {
    id: 'C',
    name: 'Dó maior',
    short: 'C',
    frets: [2, 0, 1, 2],
    fingers: [2, 0, 1, 3],
    pitchClasses: [0, 4, 7],
    description: 'Mi–Sol–Dó–Mi. Base de muitas progressões.',
    level: 'iniciante'
  },
  {
    id: 'D',
    name: 'Ré maior',
    short: 'D',
    frets: [0, 2, 3, 4],
    fingers: [0, 1, 2, 3],
    pitchClasses: [2, 6, 9],
    description: 'Ré–Lá–Ré–Fá#. Tônica do cavaquinho.',
    level: 'iniciante'
  },
  {
    id: 'Dm',
    name: 'Ré menor',
    short: 'Dm',
    frets: [0, 2, 3, 3],
    fingers: [0, 1, 2, 3],
    pitchClasses: [2, 5, 9],
    description: 'Ré–Lá–Ré–Fá. Compare com Ré maior: 1 casa de diferença.',
    level: 'iniciante'
  },
  {
    id: 'D7',
    name: 'Ré com sétima',
    short: 'D7',
    frets: [0, 2, 1, 4],
    fingers: [0, 2, 1, 3],
    pitchClasses: [2, 6, 9, 0],
    description: 'Ré–Lá–Dó–Fá#. Dominante que resolve em Sol.',
    level: 'fácil'
  },
  {
    id: 'E',
    name: 'Mi maior',
    short: 'E',
    frets: [2, 1, 0, 2],
    fingers: [3, 1, 0, 2],
    pitchClasses: [4, 8, 11],
    description: 'Mi–Sol#–Si–Mi. Essencial no pagode em Mi.',
    level: 'iniciante'
  },
  {
    id: 'Em',
    name: 'Mi menor',
    short: 'Em',
    frets: [2, 0, 0, 2],
    fingers: [2, 0, 0, 3],
    pitchClasses: [4, 7, 11],
    description: 'Mi–Sol–Si–Mi. Compare com Mi maior.',
    level: 'iniciante'
  },
  {
    id: 'F',
    name: 'Fá maior',
    short: 'F',
    frets: [3, 2, 1, 3],
    fingers: [3, 2, 1, 4],
    pitchClasses: [5, 9, 0],
    description: 'Fá–Lá–Dó–Fá. Exige as 4 cordas presas.',
    level: 'fácil'
  },
  {
    id: 'A',
    name: 'Lá maior',
    short: 'A',
    frets: [2, 2, 2, 2],
    fingers: [1, 1, 1, 1],
    pitchClasses: [9, 1, 4],
    description: 'Pestana na casa 2. Mi–Lá–Dó#–Mi.',
    level: 'fácil'
  },
  {
    id: 'Am',
    name: 'Lá menor',
    short: 'Am',
    frets: [2, 2, 1, 2],
    fingers: [3, 2, 1, 4],
    pitchClasses: [9, 0, 4],
    description: 'Mi–Lá–Dó–Mi. Compare com Lá maior.',
    level: 'iniciante'
  },
  {
    id: 'A7',
    name: 'Lá com sétima',
    short: 'A7',
    frets: [2, 2, 2, 5],
    fingers: [1, 2, 3, 4],
    pitchClasses: [9, 1, 4, 7],
    description: 'Mi–Lá–Dó#–Sol. Dominante que resolve em Ré.',
    level: 'fácil'
  }
]

export function getChord(id: string): ChordDefinition {
  const c = CHORDS.find((x) => x.id === id)
  if (!c) throw new Error(`Acorde desconhecido: ${id}`)
  return c
}

/** Notas (nome + midi + freq) produzidas por um acorde. */
export function chordNotes(chord: ChordDefinition): { stringIndex: number; fret: number; midi: number; name: string; pt: string; freq: number }[] {
  return chord.frets.map((fret, stringIndex) => {
    const midi = fretToMidi(stringIndex, fret)
    return {
      stringIndex,
      fret,
      midi,
      name: midiToNoteName(midi),
      pt: midiToPtName(midi),
      freq: midiToFreq(midi)
    }
  })
}

/** Valida que todas as notas do acorde pertencem ao conjunto harmônico. */
export function validateChordTones(chord: ChordDefinition): { ok: boolean; badNotes: string[] } {
  const notes = chordNotes(chord)
  const allowed = new Set(chord.pitchClasses)
  const bad = notes.filter((n) => !allowed.has(midiToPitchClass(n.midi)))
  return { ok: bad.length === 0, badNotes: bad.map((n) => `${STRING_LABELS[n.stringIndex]} casa ${n.fret} = ${n.name}`) }
}

/** Valida que todos os tons do acorde aparecem ao menos uma vez (triades/7ª). */
export function validateChordCompleteness(chord: ChordDefinition): { ok: boolean; missing: number[] } {
  const pcs = new Set(chordNotes(chord).map((n) => midiToPitchClass(n.midi)))
  const missing = chord.pitchClasses.filter((pc) => !pcs.has(pc))
  return { ok: missing.length === 0, missing }
}
