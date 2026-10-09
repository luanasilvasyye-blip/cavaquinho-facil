import { PLAN_META, PLAN_TOTAL_DAYS } from './plan'

export interface PracticeRecord {
  id: string
  date: string // ISO
  kind: 'trainer' | 'lesson' | 'metronome'
  chordA?: string
  chordB?: string
  swaps?: number
  minutes?: number
  day?: number
}

export interface ProgressState {
  completedDays: number[] // 1..7
  sessions: PracticeRecord[]
  createdAt: string
}

const DEMO_KEY = 'cavaquinho-demo-progress-v1'

export function emptyProgress(): ProgressState {
  return { completedDays: [], sessions: [], createdAt: new Date().toISOString() }
}

export function loadLocalProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (!raw) return emptyProgress()
    const p = JSON.parse(raw) as ProgressState
    if (!Array.isArray(p.completedDays) || !Array.isArray(p.sessions)) return emptyProgress()
    return p
  } catch {
    return emptyProgress()
  }
}

export function saveLocalProgress(p: ProgressState) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(p))
  } catch {
    /* storage indisponível */
  }
}

export function completeDay(p: ProgressState, day: number): ProgressState {
  if (!Number.isInteger(day) || day < 1 || day > PLAN_TOTAL_DAYS) throw new Error('Dia inválido')
  if (p.completedDays.includes(day)) return p
  const next = { ...p, completedDays: [...p.completedDays, day].sort((a, b) => a - b) }
  saveLocalProgress(next)
  return next
}

export function addSession(p: ProgressState, r: Omit<PracticeRecord, 'id' | 'date'>): ProgressState {
  const rec: PracticeRecord = {
    ...r,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString()
  }
  const next = { ...p, sessions: [rec, ...p.sessions].slice(0, 200) }
  saveLocalProgress(next)
  return next
}

export function planPercent(p: ProgressState): number {
  return Math.round((p.completedDays.length / PLAN_TOTAL_DAYS) * 100)
}

export function daysStudied(p: ProgressState): number {
  const set = new Set(p.sessions.map((s) => s.date.slice(0, 10)))
  // dias com aula concluída também contam
  p.completedDays.forEach((_, i) => set.add(`day-${i}`))
  return set.size
}

export function nextActivity(p: ProgressState): { label: string; href: string } {
  const nextDay = PLAN_META.map((d) => d.day).find((d) => !p.completedDays.includes(d))
  if (nextDay) return { label: `Continuar no Dia ${nextDay} do plano`, href: '/app/plano' }
  const last = p.sessions[0]
  if (!last) return { label: 'Explorar a biblioteca de acordes', href: '/app/acordes' }
  if (last.kind === 'trainer') return { label: 'Praticar ritmo no metrônomo', href: '/app/metronomo' }
  return { label: 'Fazer mais um treino de trocas', href: '/app/treinador' }
}

// ---- Persistência do aluno (via Netlify Functions, sessão em cookie) ----

export async function fetchServerProgress(): Promise<ProgressState | null> {
  const res = await fetch('/.netlify/functions/progress', { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error('Falha ao carregar progresso')
  const data = await res.json()
  return {
    completedDays: data.completedDays ?? [],
    sessions: data.sessions ?? [],
    createdAt: data.createdAt ?? new Date().toISOString()
  }
}

export async function saveDayServer(day: number): Promise<void> {
  const res = await fetch('/.netlify/functions/progress', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete-day', day })
  })
  if (res.status === 401) throw new Error('Sessão expirada. Acesse novamente.')
  if (!res.ok) throw new Error('Falha ao salvar dia')
}

export async function saveSessionServer(r: Omit<PracticeRecord, 'id' | 'date'>): Promise<void> {
  const res = await fetch('/.netlify/functions/practice', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(r)
  })
  if (res.status === 401) throw new Error('Sessão expirada. Acesse novamente.')
  if (!res.ok) throw new Error('Falha ao salvar sessão')
}
