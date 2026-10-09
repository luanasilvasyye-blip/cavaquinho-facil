// POST /.netlify/functions/auth-login — acesso do comprador (e-mail + código da transação).
// Sessão assinada em cookie HttpOnly/Secure/SameSite. Com rate limit.
import { env, json, parseBody, clientIp, hmacHex, sb, signSession, sessionCookie, getHeader } from './_shared.js'

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 5

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' })
  const body = parseBody(event)
  const email = String(body.email ?? '').toLowerCase().trim()
  const code = String(body.transactionCode ?? body.code ?? '').trim()
  const ip = clientIp(event)

  if (!email.includes('@') || code.length < 4) {
    return json(400, { error: 'Informe o e-mail da compra e o código da transação.' })
  }

  // Rate limit: falhas recentes por e-mail ou IP.
  try {
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    const attempts = await sb.select('login_attempts', {
      select: 'email,ip,success,created_at',
      filters: [{ col: 'created_at', op: 'gte', val: since }],
      order: 'created_at.desc',
      limit: 100
    })
    if (attempts.ok && Array.isArray(attempts.data)) {
      const failsEmail = attempts.data.filter((a) => a.email?.toLowerCase() === email && !a.success).length
      const failsIp = attempts.data.filter((a) => a.ip === ip && !a.success).length
      if (failsEmail >= MAX_FAILS || failsIp >= MAX_FAILS * 2) {
        return json(429, { error: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.' })
      }
    }
  } catch {
    /* sem rate limit se banco indisponível — segue para erro de config abaixo */
  }

  const txSecret = env('TRANSACTION_HMAC_SECRET')
  const sessSecret = env('SESSION_SECRET')
  if (!txSecret || !sessSecret) return json(500, { error: 'Login indisponível (servidor não configurado).' })

  const txHash = hmacHex(txSecret, code)
  let purchase = null
  try {
    // Filtra por hash exato no servidor; e-mail comparado de forma exata (case-insensitive).
    const sel = await sb.select('purchases', {
      select: 'id,email,status',
      filters: [{ col: 'transaction_hash', op: 'eq', val: txHash }],
      limit: 5
    })
    if (sel.ok && Array.isArray(sel.data)) {
      purchase = sel.data.find((p) => String(p.email).toLowerCase() === email && p.status === 'approved') ?? null
    }
  } catch {
    return json(500, { error: 'Falha ao verificar compra. Tente de novo.' })
  }

  const success = !!purchase
  try {
    await sb.insert('login_attempts', [{ email, ip, success }])
  } catch {
    /* best-effort */
  }

  if (!purchase) {
    // Mensagem genérica para não vazar quais e-mails compraram.
    return json(401, { error: 'Compra não encontrada. Confira o e-mail e o código da transação do comprovante.' })
  }

  const token = signSession({ email: purchase.email.toLowerCase(), pid: purchase.id, exp: Date.now() + 30 * 24 * 3600 * 1000 }, sessSecret)
  return json(
    200,
    { ok: true },
    { 'Set-Cookie': sessionCookie(token) }
  )
}
