// Analytics simples, com respeito à privacidade: sem cookies de terceiros,
// sem fingerprint, apenas eventos de primeira parte + UTM.

export interface AnalyticsEvent {
  // purchase_confirmed NUNCA sai do navegador: compras são contadas no servidor via webhook.
  name: 'visit_landing' | 'click_demo' | 'click_buy'
  at: string
  path: string
  utm?: Record<string, string>
  extra?: Record<string, string>
}

const KEY = 'cavaquinho-analytics-v1'

export function getUtm(): Record<string, string> {
  try {
    const q = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
      const v = q.get(k)
      if (v) utm[k] = v.slice(0, 120)
    })
    if (Object.keys(utm).length > 0) {
      try {
        sessionStorage.setItem('cavaquinho-utm', JSON.stringify(utm))
      } catch { /* ignore */ }
      return utm
    }
    const saved = sessionStorage.getItem('cavaquinho-utm')
    return saved ? (JSON.parse(saved) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function track(name: AnalyticsEvent['name'], extra?: Record<string, string>) {
  try {
    const ev: AnalyticsEvent = {
      name,
      at: new Date().toISOString(),
      path: window.location.pathname,
      utm: getUtm(),
      extra
    }
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : []
    arr.push(ev)
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-200)))
    // Envia ao servidor de forma best-effort (não bloqueia, não exibe erro)
    void fetch('/.netlify/functions/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
      keepalive: true
    }).catch(() => undefined)
  } catch {
    /* analytics nunca deve quebrar o app */
  }
}

export function readLocalEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as AnalyticsEvent[]
  } catch {
    return []
  }
}
