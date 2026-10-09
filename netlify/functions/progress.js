// GET/POST /.netlify/functions/progress — dias concluídos (protegido por sessão).
// Erros de banco retornam 5xx (nunca 200 com dados vazios mascarando falha).
// Upsert usa a chave composta (purchase_id, day) — idempotente.
import { env, json, parseBody, getCookie, verifySession, sb } from './_shared.js'

/** Distingue sem-acesso (401) de falha de banco (503). */
async function purchaseFromSession(event) {
  const token = getCookie(event, 'session')
  const sess = verifySession(token, env('SESSION_SECRET') || 'missing')
  if (!sess) return { purchase: null, dbError: false }
  let sel = null
  try {
    sel = await sb.select('purchases', {
      select: 'id,email,status',
      filters: [{ col: 'id', op: 'eq', val: sess.pid }],
      limit: 1
    })
  } catch {
    return { purchase: null, dbError: true }
  }
  if (!sel.ok) return { purchase: null, dbError: true }
  const row = sel.data?.[0]
  if (!row || row.status !== 'approved') return { purchase: null, dbError: false }
  return { purchase: row, dbError: false }
}

export const handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const { purchase, dbError } = await purchaseFromSession(event)
    if (dbError) return json(503, { error: 'Falha temporária. Tente de novo.' })
    if (!purchase) return json(401, { error: 'Sem acesso.' })
    let days = null
    let sess = null
    try {
      days = await sb.select('study_progress', {
        select: 'day,completed_at',
        filters: [{ col: 'purchase_id', op: 'eq', val: purchase.id }],
        order: 'day.asc',
        limit: 10
      })
      sess = await sb.select('practice_sessions', {
        select: 'id,kind,chord_a,chord_b,swaps,minutes,created_at',
        filters: [{ col: 'purchase_id', op: 'eq', val: purchase.id }],
        order: 'created_at.desc',
        limit: 50
      })
    } catch {
      return json(503, { error: 'Falha temporária. Tente de novo.' })
    }
    if (!days.ok || !sess.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
    return json(200, {
      completedDays: (Array.isArray(days.data) ? days.data.map((d) => d.day) : []),
      sessions: (Array.isArray(sess.data)
        ? sess.data.map((s) => ({ id: s.id, kind: s.kind, chordA: s.chord_a, chordB: s.chord_b, swaps: s.swaps, minutes: s.minutes, date: s.created_at }))
        : []),
      createdAt: new Date().toISOString()
    })
  }

  if (event.httpMethod === 'POST') {
    const { purchase, dbError } = await purchaseFromSession(event)
    if (dbError) return json(503, { error: 'Falha temporária. Tente de novo.' })
    if (!purchase) return json(401, { error: 'Sem acesso.' })
    const body = parseBody(event)
    const day = parseInt(body.day, 10)
    if (!Number.isInteger(day) || day < 1 || day > 7) return json(400, { error: 'Dia inválido (1–7).' })
    let up = null
    try {
      // Chave composta (purchase_id, day): reenvios não duplicam.
      up = await sb.upsert('study_progress', [{ purchase_id: purchase.id, day }], 'purchase_id,day')
    } catch {
      return json(503, { error: 'Falha temporária. Tente de novo.' })
    }
    if (!up.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
    // Log secundário: se falhar, o dia já foi salvo — informa sucesso parcial honesto.
    let lessonLogged = true
    try {
      const ins = await sb.insert('practice_sessions', [{ purchase_id: purchase.id, kind: 'lesson', minutes: 20 }])
      lessonLogged = !!ins.ok
    } catch {
      lessonLogged = false
    }
    return json(200, { ok: true, lessonLogged })
  }

  return json(405, { error: 'Método não permitido' })
}
