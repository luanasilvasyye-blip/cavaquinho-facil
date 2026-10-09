import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Contrato Supabase + honestidade das respostas:
// - upsert usa on_conflict na query (chave composta purchase_id,day)
// - GET nunca devolve 200 com lista vazia mascarando falha
// - POST verifica o insert antes de dizer ok
// - lessons exige sessão; analytics rejeita purchase_confirmed do navegador

import { handler as progress } from '../netlify/functions/progress.js'
import { handler as practice } from '../netlify/functions/practice.js'
import { handler as lessons } from '../netlify/functions/lessons.js'
import { handler as analytics } from '../netlify/functions/analytics.js'
import { handler as report } from '../netlify/functions/analytics-report.js'
import { signSession } from '../netlify/functions/_shared.js'

const OLD_ENV = { ...process.env }

function setEnv() {
  process.env.SUPABASE_URL = 'https://xyz.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv'
  process.env.SESSION_SECRET = 'sess-secret'
  process.env.ADMIN_RESTORE_KEY = 'adminkey'
}

beforeEach(() => {
  setEnv()
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...OLD_ENV }
  setEnv()
})

function sessionCookie() {
  const token = signSession({ email: 'a@b.c', pid: 'purchase-1', exp: Date.now() + 60000 }, 'sess-secret')
  return { cookie: `session=${encodeURIComponent(token)}` }
}

function authedEvent(method: string, body?: any) {
  return {
    httpMethod: method,
    headers: { cookie: sessionCookie().cookie },
    queryStringParameters: {},
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false
  }
}

/** Mock padrão: sessão válida (purchase approved), resto configurável. */
function mockSupabase(overrides: { purchasesSelect?: any; upsert?: any; insert?: any; selectAll?: any } = {}) {
  const urls: string[] = []
  vi.stubGlobal('fetch', async (url: any, init: any) => {
    const u = String(url)
    urls.push(`${init?.method ?? 'GET'} ${u}`)
    const m = init?.method ?? 'GET'
    if (u.includes('/purchases') && m === 'GET') {
      if (overrides.purchasesSelect === 'fail') return new Response('x', { status: 500 })
      return new Response(JSON.stringify([{ id: 'purchase-1', email: 'a@b.c', status: 'approved' }]), { status: 200 })
    }
    if (u.includes('/study_progress') && m === 'POST') {
      if (overrides.upsert === 'fail') return new Response('x', { status: 500 })
      return new Response(JSON.stringify([{ purchase_id: 'purchase-1', day: 1 }]), { status: 201 })
    }
    if (u.includes('/practice_sessions') && m === 'POST') {
      if (overrides.insert === 'fail') return new Response('x', { status: 500 })
      return new Response(JSON.stringify([{ id: 's1' }]), { status: 201 })
    }
    if (m === 'GET') {
      if (overrides.selectAll === 'fail') return new Response('x', { status: 500 })
      return new Response('[]', { status: 200 })
    }
    return new Response('[]', { status: 200 })
  })
  return urls
}

describe('upsert usa chave composta', () => {
  it('progress POST envia on_conflict=purchase_id,day na URL', async () => {
    const urls = mockSupabase()
    const res = await progress(authedEvent('POST', { day: 1 }) as any)
    expect(res.statusCode).toBe(200)
    const upsertCall = urls.find((u) => u.includes('study_progress') && u.startsWith('POST'))
    expect(upsertCall).toBeDefined()
    expect(upsertCall!).toMatch(/on_conflict=purchase_id(%2C|,)day/)
  })
})

describe('respostas honestas do progresso/prática', () => {
  it('progress GET com banco falho => 503 (não 200 vazio)', async () => {
    mockSupabase({ selectAll: 'fail' })
    const res = await progress(authedEvent('GET') as any)
    expect(res.statusCode).toBe(503)
  })

  it('progress POST com upsert falho => 503 (não 200)', async () => {
    mockSupabase({ upsert: 'fail' })
    const res = await progress(authedEvent('POST', { day: 2 }) as any)
    expect(res.statusCode).toBe(503)
  })

  it('practice POST com insert falho => 503 (não 200)', async () => {
    mockSupabase({ insert: 'fail' })
    const res = await practice(authedEvent('POST', { kind: 'trainer', chordA: 'G', chordB: 'C', swaps: 5 }) as any)
    expect(res.statusCode).toBe(503)
  })

  it('practice GET com banco falho => 503 (não 200 vazio)', async () => {
    mockSupabase({ selectAll: 'fail' })
    const res = await practice(authedEvent('GET') as any)
    expect(res.statusCode).toBe(503)
  })

  it('sessão válida mas banco fora na checagem => 503 (não 401)', async () => {
    mockSupabase({ purchasesSelect: 'fail' })
    const res = await progress(authedEvent('GET') as any)
    expect(res.statusCode).toBe(503)
  })
})

describe('lessons (aulas no servidor)', () => {
  it('sem sessão => 401', async () => {
    const res = await lessons({ httpMethod: 'GET', headers: {}, body: null, isBase64Encoded: false } as any)
    expect(res.statusCode).toBe(401)
  })

  it('com sessão válida => 200 com 7 dias', async () => {
    mockSupabase()
    const res = await lessons(authedEvent('GET') as any)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).days).toHaveLength(7)
  })

  it('bundle público não contém corpos de aula', async () => {
    const mod = await import('../src/lib/plan')
    expect(mod.PLAN_META).toHaveLength(7)
    const asText = JSON.stringify((mod as any).PLAN_META)
    expect(asText).not.toMatch(/tum-tum/i)
    expect((mod as any).STUDY_PLAN).toBeUndefined()
    expect(Object.keys((mod as any).PLAN_META[0]).sort()).toEqual(['day', 'goal', 'minutes', 'title'])
  })
})

describe('analytics', () => {
  it('click_buy válido persiste (insert chamado) => 200', async () => {
    const urls: string[] = []
    vi.stubGlobal('fetch', async (url: any, init: any) => {
      urls.push(`${init?.method} ${url}`)
      return new Response(JSON.stringify([{ id: 'e1' }]), { status: 201 })
    })
    const res = await analytics(
      { httpMethod: 'POST', headers: {}, body: JSON.stringify({ name: 'click_buy', path: '/', utm: { utm_campaign: 'cavaquinho-10' } }), isBase64Encoded: false } as any
    )
    expect(res.statusCode).toBe(200)
    expect(urls.some((u) => u.includes('analytics_events'))).toBe(true)
  })

  it('purchase_confirmed do navegador é rejeitado (anti-fraude)', async () => {
    const res = await analytics(
      { httpMethod: 'POST', headers: {}, body: JSON.stringify({ name: 'purchase_confirmed' }), isBase64Encoded: false } as any
    )
    expect(res.statusCode).toBe(400)
  })

  it('banco fora => 503 (não 200 falso)', async () => {
    vi.stubGlobal('fetch', async () => new Response('x', { status: 500 }))
    const res = await analytics(
      { httpMethod: 'POST', headers: {}, body: JSON.stringify({ name: 'click_demo' }), isBase64Encoded: false } as any
    )
    expect(res.statusCode).toBe(503)
  })

  it('relatório exige adminKey e agrega sem PII', async () => {
    vi.stubGlobal('fetch', async (url: any) => {
      const u = String(url)
      if (u.includes('analytics_events')) {
        return new Response(
          JSON.stringify([
            { name: 'visit_landing', utm_source: 'meta', utm_campaign: 'cavaquinho-10' },
            { name: 'click_buy', utm_source: 'meta', utm_campaign: 'cavaquinho-10' }
          ]),
          { status: 200 }
        )
      }
      if (u.includes('/purchases')) return new Response(JSON.stringify([{ id: 'p1' }]), { status: 200 })
      return new Response(JSON.stringify([{ event: 'PURCHASE_APPROVED' }]), { status: 200 })
    })
    const noAuth = await report({ httpMethod: 'GET', headers: {}, queryStringParameters: { adminKey: 'errada' }, body: null, isBase64Encoded: false } as any)
    expect(noAuth.statusCode).toBe(401)
    const ok = await report({ httpMethod: 'GET', headers: {}, queryStringParameters: { adminKey: 'adminkey' }, body: null, isBase64Encoded: false } as any)
    expect(ok.statusCode).toBe(200)
    const data = JSON.parse(ok.body)
    expect(data.visits).toBe(1)
    expect(data.buyClicks).toBe(1)
    expect(data.confirmedPurchases).toBe(1)
    expect(JSON.stringify(data)).not.toMatch(/aluno@teste/)
  })
})
