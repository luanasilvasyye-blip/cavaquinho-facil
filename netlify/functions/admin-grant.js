// POST /.netlify/functions/admin-grant — liberação manual (quando o webhook falha).
// Exige ADMIN_RESTORE_KEY. Procedimento: conferir venda no painel Hotmart e chamar com e-mail + transação.
import { env, json, parseBody, hmacHex, sb, timingSafeEqualStr } from './_shared.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' })
  const adminKey = env('ADMIN_RESTORE_KEY')
  if (!adminKey) return json(500, { error: 'Restauração manual não configurada.' })
  const body = parseBody(event)
  if (!timingSafeEqualStr(String(body.adminKey ?? ''), adminKey)) {
    return json(401, { error: 'Chave administrativa inválida.' })
  }
  const email = String(body.email ?? '').toLowerCase().trim()
  const code = String(body.transactionCode ?? '').trim()
  const productId = env('HOTMART_PRODUCT_ID')
  const txSecret = env('TRANSACTION_HMAC_SECRET')
  if (!email.includes('@') || code.length < 4) return json(400, { error: 'E-mail e transação obrigatórios.' })
  if (!productId || !txSecret) return json(500, { error: 'Servidor não configurado.' })

  const txHash = hmacHex(txSecret, code)
  let up = null
  try {
    up = await sb.upsert('purchases', [
      { email, transaction_hash: txHash, hotmart_product_id: productId, status: 'approved', approved_at: new Date().toISOString(), revoked_at: null }
    ], 'transaction_hash')
  } catch {
    return json(503, { error: 'Falha temporária. Tente de novo.' })
  }
  if (!up.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
  try {
    const purchaseId = up.ok && up.data?.[0]?.id ? up.data[0].id : null
    await sb.insert('webhook_events', [
      { event: 'ADMIN_GRANT', hotmart_product_id: productId, transaction_hash: txHash, purchase_id: purchaseId, status: 'received', detail: { manual: true } }
    ])
    return json(200, { ok: true })
  } catch {
    return json(200, { ok: true, auditLogged: false })
  }
}
