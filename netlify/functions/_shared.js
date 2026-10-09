// Helpers compartilhados das Netlify Functions (Node 18+, ESM).
// Sem dependências externas: Supabase via REST (fetch) + node:crypto.
import crypto from 'node:crypto'

export function env(name, fallback = '') {
  return (process.env[name] ?? fallback).toString()
}

export function json(statusCode, obj, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(obj)
  }
}

export function parseBody(event) {
  if (!event.body) return {}
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function getHeader(event, name) {
  const h = event.headers || {}
  const lower = name.toLowerCase()
  for (const k of Object.keys(h)) {
    if (k.toLowerCase() === lower) return h[k]
  }
  return undefined
}

export function getCookie(event, name) {
  const header = getHeader(event, 'cookie') || ''
  const parts = header.split(';').map((s) => s.trim())
  for (const p of parts) {
    const i = p.indexOf('=')
    if (i > 0 && p.slice(0, i).trim() === name) return decodeURIComponent(p.slice(i + 1))
  }
  return undefined
}

export function hmacHex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex')
}

export function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a ?? '', 'utf8')
  const bb = Buffer.from(b ?? '', 'utf8')
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export function b64urlEncode(s) {
  return Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlDecode(s) {
  let t = s.replace(/-/g, '+').replace(/_/g, '/')
  while (t.length % 4) t += '='
  return Buffer.from(t, 'base64').toString('utf8')
}

export function signSession(payload, secret) {
  const body = b64urlEncode(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return `${body}.${sig}`
}

export function verifySession(token, secret) {
  if (!token || typeof token !== 'string') return null
  const i = token.lastIndexOf('.')
  if (i <= 0) return null
  const body = token.slice(0, i)
  const sig = token.slice(i + 1)
  const expect = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (!timingSafeEqualStr(expect, sig)) return null
  try {
    const p = JSON.parse(b64urlDecode(body))
    if (!p.email || !p.pid || !p.exp) return null
    if (Date.now() > p.exp) return null
    return p
  } catch {
    return null
  }
}

export function sessionCookie(token, { clear = false } = {}) {
  const secure = env('NETLIFY', '') === 'true' || (env('URL', '').startsWith('https') ?? false) || process.env.NODE_ENV === 'production'
  const parts = [`session=${clear ? '' : encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (secure) parts.push('Secure')
  parts.push(`Max-Age=${clear ? 0 : 60 * 60 * 24 * 30}`)
  return parts.join('; ')
}

export function clientIp(event) {
  return (
    getHeader(event, 'x-nf-client-connection-ip') ||
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'client-ip') ||
    'unknown'
  )
}

// ---- Supabase REST mínimo ----

function sbBase() {
  const url = env('SUPABASE_URL').replace(/\/$/, '')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  return { url, key }
}

async function sbFetch(path, { method = 'GET', body, prefer } = {}) {
  const { url, key } = sbBase()
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

export const sb = {
  async select(table, { select = '*', filters = [], order, limit } = {}) {
    const q = new URLSearchParams()
    q.set('select', select)
    for (const f of filters) q.append(f.col, `${f.op}.${f.val}`)
    if (order) q.set('order', order)
    if (limit) q.set('limit', String(limit))
    return sbFetch(`${table}?${q.toString()}`)
  },
  async insert(table, rows, { ignoreDuplicates = false } = {}) {
    // ignoreDuplicates: usa resolução do PostgREST para não falhar em corrida
    // (ex.: dois deliveries simultâneos do mesmo evento).
    return sbFetch(table, {
      method: 'POST',
      body: rows,
      prefer: ignoreDuplicates ? 'return=representation,resolution=ignore-duplicates' : 'return=representation'
    })
  },
  async upsert(table, rows, onConflict) {
    // PostgREST exige on_conflict como parâmetro de consulta (não no header Prefer).
    // Ex.: POST /rest/v1/study_progress?on_conflict=purchase_id,day
    const qs = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : ''
    return sbFetch(`${table}${qs}`, {
      method: 'POST',
      body: rows,
      prefer: 'return=representation,resolution=merge-duplicates'
    })
  },
  async update(table, patch, filters) {
    const q = new URLSearchParams()
    for (const f of filters) q.append(f.col, `${f.op}.${f.val}`)
    return sbFetch(`${table}?${q.toString()}`, { method: 'PATCH', body: patch, prefer: 'return=representation' })
  }
}

// ---- Hotmart webhook v2: extração defensiva ----

export const APPROVED_EVENTS = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'])
export const REVOKING_EVENTS = new Set(['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED', 'PURCHASE_CANCELLED'])

export function extractHotmartFields(body) {
  // Suporta variações de payload da Hotmart v2.
  const data = body?.data ?? body ?? {}
  const product = data.product ?? data.Product ?? body.product ?? {}
  const purchase = data.purchase ?? data.Purchase ?? body.purchase ?? {}
  const buyer = data.buyer ?? data.Buyer ?? body.buyer ?? {}
  const subscription = data.subscription ?? {}
  const payment = purchase.payment ?? data.payment ?? {}

  const event = body.event ?? body.type ?? body.Event ?? data.event ?? ''
  const productId =
    product.id?.toString?.() ?? product.product_id?.toString?.() ?? data.product_id?.toString?.() ?? body.product_id?.toString?.() ?? ''
  const transaction =
    purchase.transaction?.toString?.() ?? purchase.transaction_id?.toString?.() ?? data.transaction?.toString?.() ?? body.transaction?.toString?.() ?? subscription.transaction?.toString?.() ?? ''
  const email = (buyer.email ?? buyer.Email ?? data.email ?? body.email ?? '').toString().toLowerCase().trim()
  const status = (purchase.status ?? data.status ?? '').toString()
  // Sinais extras de pagamento confirmado (Hotmart varia o formato).
  const approvedDate = purchase.approvedDate ?? purchase.approved_date ?? data.approvedDate ?? data.approved_date ?? null
  const paymentStatus = (payment.status ?? purchase.payment_status ?? '').toString()
  return { event: String(event), productId: String(productId), transaction: String(transaction), email, status, approvedDate, paymentStatus }
}

const PAID_STATUSES = new Set(['APPROVED', 'APROVADA', 'APROVADO', 'COMPLETE', 'COMPLETED', 'COMPLETA', 'COMPLETO', 'PAID', 'PAGO', 'PAGA', 'PAYMENT_APPROVED'])

export function isPaidComplete(body, fields) {
  // PURCHASE_COMPLETE só libera com confirmação explícita de pagamento.
  // Sem sinal de pagamento, NÃO libera (retorna false) — evita liberar sem cobrança.
  if (fields.event !== 'PURCHASE_COMPLETE') return true
  const data = body?.data ?? body ?? {}
  const purchase = data.purchase ?? {}
  const payment = purchase.payment ?? data.payment ?? {}
  const candidates = [
    purchase.status,
    purchase.payment_status,
    payment.status,
    data.status,
    fields.status,
    fields.paymentStatus
  ]
    .map((s) => `${s ?? ''}`.toUpperCase().trim())
    .filter(Boolean)
  if (candidates.some((s) => PAID_STATUSES.has(s))) return true
  // Data de aprovação é um sinal positivo alternativo.
  if (fields.approvedDate ?? purchase.approvedDate ?? purchase.approved_date ?? data.approvedDate) return true
  if (purchase.is_paid === true || data.is_paid === true || payment.approved === true) return true
  return false
}
