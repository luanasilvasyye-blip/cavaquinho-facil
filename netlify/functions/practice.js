// GET/POST /.netlify/functions/practice — sessões do treinador (protegido).
// Erros de banco retornam 5xx; inserção é verificada antes de informar sucesso.
import { env, json, parseBody, getCookie, verifySession, sb } from './_shared.js'

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
  const { purchase, dbError } = await purchaseFromSession(event)
  if (dbError) return json(503, { error: 'Falha temporária. Tente de novo.' })
  if (!purchase) return json(401, { error: 'Sem acesso.' })

  if (event.httpMethod === 'GET') {
    let r = null
    try {
      r = await sb.select('practice_sessions', {
        select: 'id,kind,chord_a,chord_b,swaps,minutes,created_at',
        filters: [{ col: 'purchase_id', op: 'eq', val: purchase.id }],
        order: 'created_at.desc',
        limit: 50
      })
    } catch {
      return json(503, { error: 'Falha temporária. Tente de novo.' })
    }
    if (!r.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
    return json(200, { sessions: r.data.map((s) => ({ id: s.id, kind: s.kind, chordA: s.chord_a, chordB: s.chord_b, swaps: s.swaps, minutes: s.minutes, date: s.created_at })) })
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody(event)
    const kind = ['trainer', 'lesson', 'metronome'].includes(body.kind) ? body.kind : 'trainer'
    const swaps = body.swaps === undefined || body.swaps === null ? null : parseInt(body.swaps, 10)
    const minutes = body.minutes === undefined || body.minutes === null ? null : parseInt(body.minutes, 10)
    if (swaps !== null && (!Number.isInteger(swaps) || swaps < 0 || swaps > 500)) return json(400, { error: 'Trocas inválidas (0–500).' })
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 600)) return json(400, { error: 'Minutos inválidos.' })
    const chordA = body.chordA ? String(body.chordA).slice(0, 8) : null
    const chordB = body.chordB ? String(body.chordB).slice(0, 8) : null
    let ins = null
    try {
      ins = await sb.insert('practice_sessions', [{ purchase_id: purchase.id, kind, chord_a: chordA, chord_b: chordB, swaps, minutes }])
    } catch {
      return json(503, { error: 'Falha temporária. Tente de novo.' })
    }
    if (!ins.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
    return json(200, { ok: true })
  }

  return json(405, { error: 'Método não permitido' })
}
