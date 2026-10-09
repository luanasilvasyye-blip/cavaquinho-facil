import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Kit de Apoio: autorização, allowlist fixa, expiração curta, sem bypass.
// Os downloads só saem com sessão de aluno + compra ativa.

import { handler as kit, KIT_FILES } from '../netlify/functions/kit-download.js'
import { signSession } from '../netlify/functions/_shared.js'
import { KIT_MATERIALS } from '../src/lib/kit'

const OLD_ENV = { ...process.env }

function setEnv() {
  process.env.SUPABASE_URL = 'https://xyz.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv-key'
  process.env.SESSION_SECRET = 'sess-secret'
  process.env.KIT_BUCKET = 'kit-pdfs'
  process.env.KIT_URL_EXPIRY_SECONDS = '120'
}

beforeEach(() => {
  setEnv()
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...OLD_ENV }
  setEnv()
})

function tokenFor(pid = 'purchase-1') {
  return signSession({ email: 'a@b.c', pid, exp: Date.now() + 60000 }, 'sess-secret')
}

function getEvent(file: string, token?: string) {
  return {
    httpMethod: 'GET',
    headers: token ? { cookie: `session=${encodeURIComponent(token)}` } : {},
    queryStringParameters: { file },
    body: null,
    isBase64Encoded: false
  }
}

/** Supabase mock: purchase aprovada + Storage sign OK. */
function mockApproved(signOk = true) {
  const calls: { url: string; method: string; body: any }[] = []
  const seen: string[] = []
  vi.stubGlobal('fetch', async (url: any, init: any) => {
    const u = String(url)
    const m = init?.method ?? 'GET'
    seen.push(`${m} ${u}`)
    if (u.includes('/rest/v1/purchases')) {
      return new Response(JSON.stringify([{ id: 'purchase-1', status: 'approved' }]), { status: 200 })
    }
    if (u.includes('/storage/v1/object/sign/')) {
      if (!signOk) return new Response('x', { status: 500 })
      const body = JSON.parse(init.body)
      calls.push({ url: u, method: m, body })
      return new Response(JSON.stringify({ signedURL: '/object/sign/kit-pdfs/guia-de-inicio.pdf?token=abc' }), { status: 200 })
    }
    return new Response('[]', { status: 200 })
  })
  return { seen, calls }
}

describe('allowlist fixa de materiais', () => {
  it('servidor expõe exatamente os 3 PDFs do kit', () => {
    expect(Object.keys(KIT_FILES).sort()).toEqual(['acordes-ilustrados', 'guia-de-inicio', 'planner-de-estudos'])
  })

  it('cliente exibe os mesmos IDs, títulos e páginas (14/4/4)', () => {
    expect(KIT_MATERIALS.map((m) => m.id).sort()).toEqual(Object.keys(KIT_FILES).sort())
    expect(KIT_MATERIALS.find((m) => m.id === 'guia-de-inicio')?.pages).toBe(14)
    expect(KIT_MATERIALS.find((m) => m.id === 'acordes-ilustrados')?.pages).toBe(4)
    expect(KIT_MATERIALS.find((m) => m.id === 'planner-de-estudos')?.pages).toBe(4)
  })

  it('nomes arbitrários e path traversal são rejeitados (400)', async () => {
    mockApproved()
    for (const evil of ['../../etc/passwd', 'guia-de-inicio.pdf', '', 'outro-arquivo', 'GUIA-DE-INICIO']) {
      const res = await kit(getEvent(evil, tokenFor()) as any)
      expect(res.statusCode, evil).toBe(400)
    }
  })

  it('não existe bypass de teste em produção (sem _mock nesta função)', async () => {
    const path = await import('node:path')
    const fs = await import('node:fs')
    const src = fs.readFileSync(path.join(process.cwd(), 'netlify', 'functions', 'kit-download.js'), 'utf8')
    expect(src).not.toMatch(/_mock|ALLOW_MOCK/)
  })
})

describe('autorização do download', () => {
  it('sem sessão => 401 (demo não baixa)', async () => {
    mockApproved()
    const res = await kit(getEvent('guia-de-inicio') as any)
    expect(res.statusCode).toBe(401)
  })

  it('sessão inválida => 401', async () => {
    mockApproved()
    const res = await kit(getEvent('guia-de-inicio', 'invalido') as any)
    expect(res.statusCode).toBe(401)
  })

  it('compra revogada => 401', async () => {
    vi.stubGlobal('fetch', async (url: any) => {
      if (String(url).includes('/rest/v1/purchases')) {
        return new Response(JSON.stringify([{ id: 'purchase-1', status: 'refunded' }]), { status: 200 })
      }
      return new Response('[]', { status: 200 })
    })
    const res = await kit(getEvent('guia-de-inicio', tokenFor()) as any)
    expect(res.statusCode).toBe(401)
  })

  it('banco fora na checagem => 503, nunca 200', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('down')
    })
    const res = await kit(getEvent('guia-de-inicio', tokenFor()) as any)
    expect(res.statusCode).toBe(503)
  })
})

describe('URL assinada de curta duração', () => {
  it('aluno ativo recebe URL completa com expiração curta', async () => {
    const { calls } = mockApproved()
    const res = await kit(getEvent('guia-de-inicio', tokenFor()) as any)
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.url).toMatch(/^https:\/\/xyz\.supabase\.co\/storage\/v1\/object\/sign\//)
    expect(data.expiresIn).toBe(120)
    expect(calls[0].body.expiresIn).toBe(120)
    // service_role nunca vaza na resposta
    expect(JSON.stringify(data)).not.toMatch(/srv-key/)
  })

  it('falha no Storage => 503, nunca 200 sem URL', async () => {
    mockApproved(false)
    const res = await kit(getEvent('guia-de-inicio', tokenFor()) as any)
    expect(res.statusCode).toBe(503)
  })
})
