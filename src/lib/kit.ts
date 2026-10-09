// Metadados públicos do Kit de Apoio (títulos e descrições para exibir).
// Os PDFs em si ficam em bucket privado e saem só via URL assinada
// (GET /.netlify/functions/kit-download?file=<id>, com sessão de aluno).

export interface KitMaterial {
  id: 'guia-de-inicio' | 'acordes-ilustrados' | 'planner-de-estudos'
  title: string
  description: string
  pages: number
}

export const KIT_MATERIALS: KitMaterial[] = [
  {
    id: 'guia-de-inicio',
    title: 'Guia de Início',
    description: 'Por onde começar: partes do cavaquinho, afinação Ré–Sol–Si–Ré, postura e primeiros sons.',
    pages: 14
  },
  {
    id: 'acordes-ilustrados',
    title: '10 Acordes Ilustrados',
    description: 'Diagramas de referência dos acordes essenciais para acompanhar samba e pagode.',
    pages: 4
  },
  {
    id: 'planner-de-estudos',
    title: 'Planner de Estudos',
    description: 'Organize sua semana de prática e acompanhe o plano de 7 dias no papel.',
    pages: 4
  }
]

/** Pede ao servidor uma URL temporária de download (exige login de aluno). */
export async function requestKitUrl(id: string): Promise<{ url: string; expiresIn: number }> {
  const res = await fetch(`/.netlify/functions/kit-download?file=${encodeURIComponent(id)}`, { credentials: 'include' })
  if (res.status === 401) throw new Error('Sem acesso. Entre como aluno para baixar o kit.')
  if (!res.ok) throw new Error('Falha ao gerar o download. Tente de novo.')
  const data = await res.json()
  if (!data?.url) throw new Error('Resposta inválida do servidor.')
  return data
}
