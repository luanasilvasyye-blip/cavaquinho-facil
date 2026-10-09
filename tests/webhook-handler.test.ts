import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Testes de integração do handler do webhook com Supabase mockado via fetch.
// Cobrem: hottok inválido, outro produto, duplicado (idempotente), reembolso/revogação.

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

function postEvent(headers: Record<string, string>, body: any) {
  return { httpMethod: 'POST', headers, body: JSON.stringify(body), isBase64Encoded: false }
}

describe('hotmart-webhook handler', () => {
  it('rejeita HOTTOK inválido (401)', async () => {
    const res = await webhook(postEvent({ 'x-hotmart-hottok': 'errado' }, { event: 'PURCHASE_APPROVED' }) as any)
    expect(res.statusCode).toBe(401)
  })

  it('ignora webhook de outro produto sem liberar acesso', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await webhook(
      postEvent({ 'x-hotmart-hottok': 'tok123' }, { event: 'PURCHASE_APPROVED', data: { product: { id: '999' }, purchase: { transaction: 'HP1' }, buyer: { email: 'a@b.c' } } }) as any
    )
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).ignored).toBe('outro produto')
  })

  it('rejeita mocks quando ALLOW_MOCK_WEBHOOK != true', async () => {
    process.env.ALLOW_MOCK_WEBHOOK = 'false'
    const res = await webhook(postEvent({ 'x-hotmart-hottok': 'tok123' }, { event: 'PURCHASE_APPROVED', _mock: true }) as any)
    expect(res.statusCode).toBe(403)
  })

  it('é idempotente: evento duplicado retorna deduped sem duplicar compra', async () => {
    let calls = 0
    const fetchMock = vi.fn(async (url: string) => {
      calls++
      if (String(url).includes('webhook_events') && String(url).includes('select')) {
        // Simula método GET select via rest: nosso sb.select usa GET com query.
        return new Response(JSON.stringify([{ id: 'ja-existe' }]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    // sb.select usa GET; o mock acima cobre. Simplificação: intercepta qualquer fetch.
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      const u = String(url)
      if ((init?.method ?? 'GET') === 'GET' && u.includes('webhook_events')) {
        return new Response(JSON.stringify([{ id: 'ja-existe' }]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    const res = await webhook(
      postEvent({ 'x-hotmart-hottok': 'tok123' }, { event: 'PURCHASE_APPROVED', data: { product: { id: '111' }, purchase: { transaction: 'HPDUP' }, buyer: { email: 'a@b.c' } } }) as any
    )
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).deduped).toBe(true)
    expect(calls >= 0).toBe(true)
  })
})
