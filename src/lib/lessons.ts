import type { StudyDay } from './plan'

/** Busca o conteúdo das aulas no servidor (exige sessão de aluno). */
export async function fetchLessons(): Promise<StudyDay[]> {
  const res = await fetch('/.netlify/functions/lessons', { credentials: 'include' })
  if (res.status === 401) throw new Error('Sem acesso. Entre como aluno.')
  if (!res.ok) throw new Error('Falha ao carregar aulas. Tente de novo.')
  const data = await res.json()
  if (!Array.isArray(data.days)) throw new Error('Resposta inválida do servidor.')
  return data.days as StudyDay[]
}
