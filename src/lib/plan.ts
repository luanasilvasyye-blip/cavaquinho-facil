// Metadados públicos do plano (títulos/metas). Os TEXTOS das aulas são exclusivos
// de alunos e vêm do servidor (GET /.netlify/functions/lessons) após login.
// Este arquivo NÃO contém corpos de aula, exercícios nem passos — de propósito,
// para que o bundle público não entregue o conteúdo pago antes da autenticação.

export interface LessonStep {
  title: string
  body: string[]
  chordIds?: string[]
  exercise: string
  minutes: number
}

export interface StudyDay {
  day: number
  title: string
  goal: string
  minutes: number
  steps: LessonStep[]
}

export interface PlanMeta {
  day: number
  title: string
  goal: string
  minutes: number
}

export const PLAN_TOTAL_DAYS = 7

export const PLAN_META: PlanMeta[] = [
  { day: 1, title: 'Conhecendo o cavaquinho', goal: 'Identificar as partes, afinar em Ré–Sol–Si–Ré e produzir o primeiro som limpo.', minutes: 20 },
  { day: 2, title: 'Primeiros acordes', goal: 'Formar Sol, Sol7 e Dó com som limpo.', minutes: 25 },
  { day: 3, title: 'Posição correta das mãos', goal: 'Eliminar sons abafados com ajuste fino de dedos e palheta.', minutes: 20 },
  { day: 4, title: 'Troca entre acordes', goal: 'Trocar de acorde sem perder o pulso, usando o Treinador.', minutes: 25 },
  { day: 5, title: 'Ritmo e batidas', goal: 'Manter tempo estável e tocar o levada básica do samba em andamento lento.', minutes: 25 },
  { day: 6, title: 'Progressões simples', goal: 'Tocar duas progressões completas de 2 acordes com virada.', minutes: 25 },
  { day: 7, title: 'Prática final', goal: 'Juntar tudo em uma prática de 20 minutos e planejar a próxima semana.', minutes: 30 }
]

export function totalPlanMinutes(): number {
  return PLAN_META.reduce((a, d) => a + d.minutes, 0)
}
