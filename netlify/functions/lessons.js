// GET /.netlify/functions/lessons — conteúdo das aulas, SOMENTE para alunos autenticados.
// O bundle público contém apenas metadados (títulos/metas); os textos das aulas
// vêm desta função após validação da sessão no servidor.
import { env, json, getCookie, verifySession, sb } from './_shared.js'
import { STUDY_PLAN } from './_plan-data.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método não permitido' })
  const token = getCookie(event, 'session')
  const sess = verifySession(token, env('SESSION_SECRET') || 'missing')
  if (!sess) return json(401, { error: 'Sem acesso.' })
  let sel = null
  try {
    sel = await sb.select('purchases', {
      select: 'id,status',
      filters: [{ col: 'id', op: 'eq', val: sess.pid }],
      limit: 1
    })
  } catch {
    return json(503, { error: 'Falha temporária. Tente de novo.' })
  }
  if (!sel.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
  const row = sel.data?.[0]
  if (!row || row.status !== 'approved') return json(401, { error: 'Sem acesso.' })
  return json(200, { days: STUDY_PLAN })
}
