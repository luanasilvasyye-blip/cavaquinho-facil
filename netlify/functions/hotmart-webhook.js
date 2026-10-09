// POST /.netlify/functions/hotmart-webhook — Hotmart webhook v2.0.0
// Regras:
// - Nunca 200 se o banco falhar ao registrar/atualizar uma compra (retorna 5xx p/ retry).
// - Idempotência garantida pelo banco (unique webhook_events[transaction_hash, event]).
// - Compra só é liberada com pagamento confirmado (APPROVED sempre; COMPLETE exige prova).
// - Reembolso/chargeback/cancelamento revogam; evento fora de ordem não reativa acesso.
// - Auditoria de eventos sem compra envolvida é best-effort (não força retry).
import { env, json, parseBody, getHeader, timingSafeEqualStr, hmacHex, sb, extractHotmartFields, isPaidComplete, APPROVED_EVENTS, REVOKING_EVENTS } from './_shared.js'

/** Falha de banco que exige nova tentativa da Hotmart. */
function dbRetry() {
  return json(502, { error: 'Falha temporária ao registrar. A Hotmart tentará entregar de novo.' })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' })

  // Mocks (testes/dev) NUNCA liberam acesso em produção.
  const body = parseBody(event)
  const isMock = body?._mock === true || String(getHeader(event, 'x-mock') ?? '').toLowerCase() === 'true'
  if (isMock && env('ALLOW_MOCK_WEBHOOK') !== 'true') {
    return json(403, { error: 'Mocks desativados neste ambiente.' })
  }

  const expectedHottok = env('HOTMART_HOTTOK')
  const expectedProduct = env('HOTMART_PRODUCT_ID')
  if (!expectedHottok || !expectedProduct) {
    return json(500, { error: 'Webhook não configurado no servidor.' })
  }

  const gotHottok = getHeader(event, 'x-hotmart-hottok') ?? getHeader(event, 'hottok') ?? ''
  if (!timingSafeEqualStr(String(gotHottok), expectedHottok)) {
    await bestEffortAudit({ event: 'INVALID_HOTTOK', detail: { reason: 'hottok inválido' } })
    return json(401, { error: 'Assinatura inválida.' })
  }

  const f = extractHotmartFields(body)
  if (!f.event) return json(400, { error: 'Evento ausente.' })
  if (f.productId !== expectedProduct) {
    await bestEffortAudit({ event: 'IGNORED_OTHER_PRODUCT', hotmart_product_id: f.productId, detail: { event: f.event } })
    return json(200, { ok: true, ignored: 'outro produto' })
  }

  const txSecret = env('TRANSACTION_HMAC_SECRET')
  if (!txSecret) return json(500, { error: 'Servidor sem segredo de transação.' })
  if (!f.transaction) return json(400, { error: 'Transação ausente.' })
  const txHash = hmacHex(txSecret, f.transaction.trim())

  // Idempotência (atalho rápido). Se a LEITURA falhar, não afirme nada: 5xx p/ retry.
  let existing = null
  try {
    existing = await sb.select('webhook_events', {
      select: 'id',
      filters: [
        { col: 'event', op: 'eq', val: f.event },
        { col: 'transaction_hash', op: 'eq', val: txHash }
      ],
      limit: 1
    })
  } catch {
    return dbRetry()
  }
  if (!existing.ok) return dbRetry()
  if (Array.isArray(existing.data) && existing.data.length > 0) {
    return json(200, { ok: true, deduped: true })
  }

  if (APPROVED_EVENTS.has(f.event)) {
    // Sem confirmação de pagamento, não libera — mas não é falha de banco (200 p/ não retentar à toa).
    if (f.event === 'PURCHASE_COMPLETE' && !isPaidComplete(body, f)) {
      await bestEffortAudit({ event: f.event, hotmart_product_id: f.productId, transaction_hash: txHash, detail: { reason: 'complete sem pagamento confirmado', status: f.status } })
      return json(200, { ok: true, ignored: 'complete não pago' })
    }
    if (!f.email || !f.email.includes('@')) {
      await bestEffortAudit({ event: f.event, hotmart_product_id: f.productId, transaction_hash: txHash, detail: { reason: 'e-mail ausente' } })
      return json(400, { error: 'E-mail do comprador ausente.' })
    }
    // Fora de ordem: se já existe revogação para esta transação, NÃO reativa o acesso.
    let prior = null
    try {
      prior = await sb.select('webhook_events', {
        select: 'event',
        filters: [{ col: 'transaction_hash', op: 'eq', val: txHash }],
        limit: 20
      })
    } catch {
      return dbRetry()
    }
    if (!prior.ok) return dbRetry()
    const priorEvents = new Set((Array.isArray(prior.data) ? prior.data : []).map((r) => r.event))
    if ([...priorEvents].some((e) => REVOKING_EVENTS.has(e))) {
      await bestEffortAudit({ event: f.event, hotmart_product_id: f.productId, transaction_hash: txHash, detail: { ignored: 'fora de ordem: revogação anterior prevalece' } })
      return json(200, { ok: true, ignored: 'out-of-order' })
    }
    // Upsert idempotente por transaction_hash (unique no banco). Falha aqui = 5xx.
    let up = null
    try {
      up = await sb.upsert(
        'purchases',
        [{ email: f.email, transaction_hash: txHash, hotmart_product_id: f.productId, status: 'approved', approved_at: new Date().toISOString(), revoked_at: null }],
        'transaction_hash'
      )
    } catch {
      return dbRetry()
    }
    if (!up.ok) return dbRetry()
    let purchaseId = Array.isArray(up.data) && up.data[0]?.id ? up.data[0].id : null
    if (!purchaseId) {
      let sel = null
      try {
        sel = await sb.select('purchases', { select: 'id,status', filters: [{ col: 'transaction_hash', op: 'eq', val: txHash }], limit: 1 })
      } catch {
        return dbRetry()
      }
      if (!sel.ok) return dbRetry()
      purchaseId = sel.data?.[0]?.id ?? null
      if (!purchaseId) return dbRetry() // upsert disse ok mas nada encontrado: não afirme sucesso
      // Reativa recompra/estorno revertido somente se ainda aprovável.
      if (sel.data[0].status !== 'approved') {
        let upd = null
        try {
          upd = await sb.update('purchases', { status: 'approved', revoked_at: null, email: f.email }, [{ col: 'id', op: 'eq', val: purchaseId }])
        } catch {
          return dbRetry()
        }
        if (!upd.ok) return dbRetry()
      }
    }
    // Auditoria: com unique(tx,event) no banco, 409 aqui significa corrida duplicada.
    const audit = await insertAudit({ event: f.event, hotmart_product_id: f.productId, transaction_hash: txHash, purchase_id: purchaseId, detail: { purchase: 'approved' } })
    if (audit === 'duplicate') return json(200, { ok: true, deduped: true })
    return json(200, { ok: true })
  }

  if (REVOKING_EVENTS.has(f.event)) {
    // Precisa ler a compra: falha de leitura = 5xx (não afirme revogação).
    let sel = null
    try {
      sel = await sb.select('purchases', { select: 'id', filters: [{ col: 'transaction_hash', op: 'eq', val: txHash }], limit: 1 })
    } catch {
      return dbRetry()
    }
    if (!sel.ok) return dbRetry()
    const purchaseId = sel.data?.[0]?.id ?? null
    const status = f.event === 'PURCHASE_REFUNDED' ? 'refunded' : f.event === 'PURCHASE_CHARGEBACK' ? 'charged_back' : 'cancelled'
    if (purchaseId) {
      let upd = null
      try {
        upd = await sb.update('purchases', { status, revoked_at: new Date().toISOString() }, [{ col: 'id', op: 'eq', val: purchaseId }])
      } catch {
        return dbRetry()
      }
      if (!upd.ok) return dbRetry() // não afirme revogação se o banco falhou
    }
    // Revogação de transação desconhecida ainda é registrada (protege contra approve fora de ordem).
    const audit = await insertAudit({ event: f.event, hotmart_product_id: f.productId, transaction_hash: txHash, purchase_id: purchaseId, detail: { purchase: status } })
    if (audit === 'duplicate') return json(200, { ok: true, deduped: true })
    if (audit === 'failed' && !purchaseId) return dbRetry() // nada foi registrado: peça retry
    return json(200, { ok: true, revoked: !!purchaseId })
  }

  await bestEffortAudit({ event: f.event, hotmart_product_id: f.productId, transaction_hash: txHash, detail: { ignored: 'evento desconhecido' } })
  return json(200, { ok: true, ignored: 'evento desconhecido' })
}

/** Auditoria que nunca mascara o resultado da compra (best-effort). */
async function bestEffortAudit(row) {
  try {
    await sb.insert('webhook_events', [
      {
        event: row.event ?? 'UNKNOWN',
        hotmart_product_id: row.hotmart_product_id ?? null,
        transaction_hash: row.transaction_hash ?? null,
        purchase_id: row.purchase_id ?? null,
        status: 'received',
        detail: row.detail ?? {}
      }
    ])
  } catch {
    /* auditoria não pode quebrar o fluxo */
  }
}

/** Auditoria com resultado: 'ok' | 'duplicate' (409/unique) | 'failed'. */
async function insertAudit(row) {
  try {
    const r = await sb.insert('webhook_events', [
      {
        event: row.event ?? 'UNKNOWN',
        hotmart_product_id: row.hotmart_product_id ?? null,
        transaction_hash: row.transaction_hash ?? null,
        purchase_id: row.purchase_id ?? null,
        status: 'received',
        detail: row.detail ?? {}
      }
    ])
    if (r.ok) return 'ok'
    if (r.status === 409) return 'duplicate'
    // PostgREST pode devolver 400 em violação de unique dependendo da versão; detecta pela mensagem.
    const msg = JSON.stringify(r.data ?? '').toLowerCase()
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already exists')) return 'duplicate'
    return 'failed'
  } catch {
    return 'failed'
  }
}
