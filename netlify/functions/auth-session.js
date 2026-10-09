// GET /.netlify/functions/auth-session — valida cookie de sessão.
import { env, json, getCookie, verifySession, sb } from './_shared.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método não permitido' })
  const token = getCookie(event, 'session')
  const sess = verifySession(token, env('SESSION_SECRET') || 'missing')
  if (!sess) return json(401, { error: 'Sem sessão.' })
  // Confere se a compra continua aprovada (revogada após reembolso/chargeback).
  try {
    const sel = await sb.select('purchases', {
      select: 'id,email,status',
      filters: [{ col: 'id', op: 'eq', val: sess.pid }],
      limit: 1
    })
    const row = sel.ok && sel.data?.[0]
    if (!row || row.status !== 'approved') return json(401, { error: 'Acesso revogado.' })
    return json(200, { email: row.email, purchaseId: row.id, expiresAt: new Date(sess.exp).toISOString() })
  } catch {
    return json(500, { error: 'Falha ao validar sessão.' })
  }
}
