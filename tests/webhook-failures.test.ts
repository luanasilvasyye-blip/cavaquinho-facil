import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Cobre as falhas exigidas:
// - banco fora do ar => webhook NUNCA responde 200 afirmando compra
// - COMPLETE sem prova de pagamento não libera
// - evento fora de ordem (revogação antes da aprovação) não reativa
// - duplicado via 409 vira deduped

import { handler as webhook } from '../netlify/functions/hotmart-webhook.js'

const OLD_ENV = { ...process.env }

function setEnv() {
  process.env.HOTMART_HOTTOK = 'tok123'
  process.env.HOTMART_PRODUCT_ID = '111'
  process.env.TRANSACTION_HMAC_SECRET = 'txsecret'
  process.env.SUPABASE_URL = 'https://xyz.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv'
  process.env.ALLOW_MOCK_WEBHOOK = 'true'
}

beforeEach(() => {
  setEnv()
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...OLD_ENV }
  setEnv()
})

function postEvent(body: any) {
  return { httpMethod: 'POST', headers: { 'x-hotmart-hottok': 'tok123' }, body: JSON.stringify(body), isBase64Encoded: false }
}

const approvedBody = (tx: string, email = 'aluno@teste.com') => ({
  event: 'PURCHASE_APPROVED',
  data: { product: { id: '111' }, purchase: { transaction: tx }, buyer: { email } }
})

describe('webhook com Supabase indisponível', () => {
  it('compra aprovada com fetch rejeitado => 5xx, nunca 200', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('supabase down')
    })
    const res = await webhook(postEvent(approvedBody('HP-DOWN-1')) as any)
    expect(res.statusCode).toBeGreaterThanOrEqual(500)
    expect(res.statusCode).not.toBe(200)
  })

  it('compra aprovada com select 500 => 5xx, nunca 200', async () => {
    vi.stubGlobal('fetch', async () => new Response('db error', { status: 500 }))
    const res = await webhook(postEvent(approvedBody('HP-DOWN-2')) as any)
    expect(res.statusCode).toBeGreaterThanOrEqual(500)
    expect(res.statusCode).not.toBe(200)
  })

  it('upsert da compra falhando => 5xx, nunca 200', async () => {
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      const u = String(url)
      const m = init?.method ?? 'GET'
      if (m === 'GET' && u.includes('webhook_events')) return new Response('[]', { status: 200 })
      if (m === 'POST' && u.includes('/purchases')) return new Response('upsert failed', { status: 500 })
      return new Response('[]', { status: 200 })
    })
    const res = await webhook(postEvent(approvedBody('HP-DOWN-3')) as any)
    expect(res.statusCode).toBeGreaterThanOrEqual(500)
    expect(JSON.parse(res.body).ok).not.toBe(true)
  })

  it('reembolso com banco fora => 5xx, nunca 200 afirmando revogação', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('down')
    })
    const res = await webhook(
      postEvent({ event: 'PURCHASE_REFUNDED', data: { product: { id: '111' }, purchase: { transaction: 'HP-DOWN-4' }, buyer: { email: 'a@b.c' } } }) as any
    )
    expect(res.statusCode).toBeGreaterThanOrEqual(500)
    expect(res.statusCode).not.toBe(200)
  })
})

describe('sem confirmação de pagamento não libera', () => {
  it('PURCHASE_COMPLETE sem status => 200 ignored e SEM insert em purchases', async () => {
    const posts: string[] = []
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      const u = String(url)
      const m = init?.method ?? 'GET'
      if (m === 'POST') posts.push(u)
      return new Response('[]', { status: 200 })
    })
    const res = await webhook(
      postEvent({ event: 'PURCHASE_COMPLETE', data: { product: { id: '111' }, purchase: { transaction: 'HP-NOPAY' }, buyer: { email: 'a@b.c' } } }) as any
    )
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).ignored).toBe('complete não pago')
    expect(posts.some((u) => u.includes('/purchases'))).toBe(false)
  })

  it('PURCHASE_COMPLETE com approvedDate libera (sinal alternativo)', async () => {
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      const u = String(url)
      const m = init?.method ?? 'GET'
      if (m === 'GET' && u.includes('webhook_events')) return new Response('[]', { status: 200 })
      if (m === 'POST' && u.includes('/purchases')) return new Response(JSON.stringify([{ id: 'p1' }]), { status: 201 })
      return new Response('[]', { status: 200 })
    })
    const res = await webhook(
      postEvent({
        event: 'PURCHASE_COMPLETE',
        data: { product: { id: '111' }, purchase: { transaction: 'HP-PAY2', approvedDate: '2026-01-01' }, buyer: { email: 'a@b.c' } }
      }) as any
    )
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).ok).toBe(true)
  })
})

describe('eventos fora de ordem', () => {
  it('aprovação após revogação registrada NÃO reativa (out-of-order)', async () => {
    const posts: string[] = []
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      const u = String(url)
      const m = init?.method ?? 'GET'
      if (m === 'GET' && u.includes('webhook_events')) {
        // dedup check (event+tx) vazio, mas histórico contém revogação
        if (u.includes('PURCHASE_APPROVED')) return new Response('[]', { status: 200 })
        return new Response(JSON.stringify([{ event: 'PURCHASE_REFUNDED' }]), { status: 200 })
      }
      if (m === 'POST') posts.push(u)
      return new Response('[]', { status: 200 })
    })
    const res = await webhook(postEvent(approvedBody('HP-OOO-1')) as any)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).ignored).toBe('out-of-order')
    expect(posts.some((u) => u.includes('/purchases'))).toBe(false)
  })

  it('corrida duplicada (audit 409) => deduped', async () => {
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      const u = String(url)
      const m = init?.method ?? 'GET'
      if (m === 'GET') return new Response('[]', { status: 200 })
      if (m === 'POST' && u.includes('/purchases')) return new Response(JSON.stringify([{ id: 'p1' }]), { status: 201 })
      if (m === 'POST' && u.includes('webhook_events')) return new Response('duplicate key', { status: 409 })
      return new Response('[]', { status: 200 })
    })
    const res = await webhook(postEvent(approvedBody('HP-RACE-1')) as any)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).deduped).toBe(true)
  })
})
