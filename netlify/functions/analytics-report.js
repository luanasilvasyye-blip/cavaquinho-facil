// GET /.netlify/functions/analytics-report?adminKey=... — relatório simples do teste Meta Ads.
// Exige ADMIN_RESTORE_KEY (nunca exponha). Retorna agregados, sem PII (sem e-mails).
// Uso:
//   curl "https://SEU-SITE.netlify.app/.netlify/functions/analytics-report?adminKey=SUA_CHAVE"
// Resposta: { visits, demoClicks, buyClicks, confirmedPurchases, byCampaign: [...] }
import { env, json, sb, timingSafeEqualStr } from './_shared.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método não permitido' })
  const adminKey = env('ADMIN_RESTORE_KEY')
  if (!adminKey) return json(500, { error: 'Relatório não configurado.' })
  const params = event.queryStringParameters || {}
  const got = String(params.adminKey ?? params.key ?? '')
  if (!timingSafeEqualStr(got, adminKey)) return json(401, { error: 'Não autorizado.' })

  try {
    const [analytics, purchases, webhooks] = await Promise.all([
      sb.select('analytics_events', { select: 'name,utm_source,utm_medium,utm_campaign', limit: 1000 }),
      sb.select('purchases', { select: 'id', limit: 1000 }),
      sb.select('webhook_events', { select: 'event', filters: [], limit: 1000 })
    ])
    if (!analytics.ok || !purchases.ok || !webhooks.ok) {
      return json(503, { error: 'Falha temporária. Tente de novo.' })
    }
    const rows = Array.isArray(analytics.data) ? analytics.data : []
    const count = (n) => rows.filter((r) => r.name === n).length
    const byCampaignMap = new Map()
    for (const r of rows) {
      const key = `${r.utm_source ?? '—'} / ${r.utm_campaign ?? '—'}`
      if (!byCampaignMap.has(key)) byCampaignMap.set(key, { source: r.utm_source ?? null, campaign: r.utm_campaign ?? null, visits: 0, demoClicks: 0, buyClicks: 0 })
      const agg = byCampaignMap.get(key)
      if (r.name === 'visit_landing') agg.visits += 1
      else if (r.name === 'click_demo') agg.demoClicks += 1
      else if (r.name === 'click_buy') agg.buyClicks += 1
    }
    const webhookRows = Array.isArray(webhooks.data) ? webhooks.data : []
    const approvedEvents = webhookRows.filter((w) => w.event === 'PURCHASE_APPROVED' || w.event === 'PURCHASE_COMPLETE').length
    return json(200, {
      visits: count('visit_landing'),
      demoClicks: count('click_demo'),
      buyClicks: count('click_buy'),
      // Compras confirmadas: fonte oficial é purchases (webhook); approvedEvents é auditoria.
      confirmedPurchases: Array.isArray(purchases.data) ? purchases.data.length : 0,
      approvedWebhookEvents: approvedEvents,
      byCampaign: [...byCampaignMap.values()],
      note: 'Compras confirmadas vêm do webhook (purchases), não do navegador.'
    })
  } catch {
    return json(503, { error: 'Falha temporária. Tente de novo.' })
  }
}
