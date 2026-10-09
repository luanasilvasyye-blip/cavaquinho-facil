// POST /.netlify/functions/analytics — medição simples de primeira parte.
// Persiste visitas, cliques em demo e cliques no checkout (sem PII).
// Compras confirmadas NÃO são aceitas aqui: vão para webhook_events/purchases via webhook.
// Sem isso, qualquer navegador poderia inventar vendas.
import { json, parseBody, sb } from './_shared.js'

const ALLOWED = new Set(['visit_landing', 'click_demo', 'click_buy'])
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

function cleanStr(v, max = 120) {
  return String(v ?? '').slice(0, max)
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' })
  const body = parseBody(event)
  if (!ALLOWED.has(body.name)) return json(400, { error: 'Evento inválido.' })
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {}
  const row = {
    name: body.name,
    path: cleanStr(body.path, 120) || null,
    utm_source: cleanStr(utm.utm_source) || null,
    utm_medium: cleanStr(utm.utm_medium) || null,
    utm_campaign: cleanStr(utm.utm_campaign) || null,
    utm_content: cleanStr(utm.utm_content) || null,
    utm_term: cleanStr(utm.utm_term) || null,
    extra: body.extra && typeof body.extra === 'object' ? body.extra : {}
  }
  try {
    const r = await sb.insert('analytics_events', [row])
    if (!r.ok) return json(503, { error: 'Falha temporária.' })
    return json(200, { ok: true })
  } catch {
    return json(503, { error: 'Falha temporária.' })
  }
}
