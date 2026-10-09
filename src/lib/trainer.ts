// Lógica pura do treinador de troca de acordes (testável sem DOM).

export interface TrainerState {
  chordA: string
  chordB: string
  durationSec: number
  elapsedSec: number
  running: boolean
  /** índice 0=A, 1=B — qual está soando/agora */
  currentIndex: number
  switchesShown: number
}

export function createTrainer(chordA: string, chordB: string, durationSec: number): TrainerState {
  if (!chordA || !chordB) throw new Error('Selecione dois acordes')
  if (chordA === chordB) throw new Error('Selecione dois acordes diferentes')
  const d = Math.max(10, Math.min(600, Math.round(durationSec)))
  return { chordA, chordB, durationSec: d, elapsedSec: 0, running: false, currentIndex: 0, switchesShown: 0 }
}

/** Alterna o acorde atual (chamado a cada intervalo). */
export function nextSwitch(s: TrainerState): TrainerState {
  const currentIndex = s.currentIndex === 0 ? 1 : 0
  return { ...s, currentIndex, switchesShown: s.switchesShown + 1, elapsedSec: s.elapsedSec }
}

export function currentChordId(s: TrainerState): string {
  return s.currentIndex === 0 ? s.chordA : s.chordB
}

export function nextChordId(s: TrainerState): string {
  return s.currentIndex === 0 ? s.chordB : s.chordA
}

export function remainingSec(s: TrainerState): number {
  return Math.max(0, s.durationSec - s.elapsedSec)
}

export function isFinished(s: TrainerState): boolean {
  return s.elapsedSec >= s.durationSec
}

export function progressRatio(s: TrainerState): number {
  if (s.durationSec <= 0) return 0
  return Math.min(1, s.elapsedSec / s.durationSec)
}
