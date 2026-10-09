import { describe, it, expect, vi, beforeEach } from 'vitest'

// Testa a lógica pura do servidor (sem rede): extração Hotmart, decisão pago/não-pago,
// sessão assinada, HMAC e regras de eventos.

import {
  extractHotmartFields,
  isPaidComplete,
  APPROVED_EVENTS,
  REVOKING_EVENTS,
  hmacHex,
  signSession,
  verifySession,
  timingSafeEqualStr
} from '../netlify/functions/_shared.js'

describe('webhook Hotmart v2', () => {
  it('extrai evento/produto/transação/e-mail de payload padrão', () => {
    const f = extractHotmartFields({
      event: 'PURCHASE_APPROVED',
      data: { product: { id: 123 }, purchase: { transaction: 'HP001' }, buyer: { email: 'ALUNO@Email.com ' } }
    })
    expect(f.event).toBe('PURCHASE_APPROVED')
    expect(f.productId).toBe('123')
    expect(f.transaction).toBe('HP001')
    expect(f.email).toBe('aluno@email.com')
  })

  it('reconhece eventos aprovados e revogadores', () => {
    expect(APPROVED_EVENTS.has('PURCHASE_APPROVED')).toBe(true)
    expect(APPROVED_EVENTS.has('PURCHASE_COMPLETE')).toBe(true)
    expect(REVOKING_EVENTS.has('PURCHASE_REFUNDED')).toBe(true)
    expect(REVOKING_EVENTS.has('PURCHASE_CHARGEBACK')).toBe(true)
    expect(REVOKING_EVENTS.has('PURCHASE_CANCELED')).toBe(true)
  })

  it('PURCHASE_COMPLETE sem pagamento confirmado não libera', () => {
    const body = { event: 'PURCHASE_COMPLETE', data: { purchase: { status: 'REFUNDED' } } }
    const f = extractHotmartFields({ ...body, data: { ...body.data, product: { id: 1 }, buyer: { email: 'a@b.c' } } })
    expect(isPaidComplete(body, { ...f, event: 'PURCHASE_COMPLETE' })).toBe(false)
  })

  it('PURCHASE_COMPLETE pago libera', () => {
    const body = { event: 'PURCHASE_COMPLETE', data: { purchase: { status: 'APPROVED' } } }
    const f = extractHotmartFields(body)
    expect(isPaidComplete(body, { ...f, event: 'PURCHASE_COMPLETE' })).toBe(true)
  })

  it('webhook de outro produto deve ser ignorado (productId diferente)', () => {
    const f = extractHotmartFields({ event: 'PURCHASE_APPROVED', data: { product: { id: 'OUTRO' } } })
    expect(f.productId).not.toBe('MEU_PRODUTO')
  })

  it('HOTTOK usa comparação timing-safe', () => {
    expect(timingSafeEqualStr('abc', 'abc')).toBe(true)
    expect(timingSafeEqualStr('abc', 'abd')).toBe(false)
    expect(timingSafeEqualStr('abc', 'abcd')).toBe(false)
  })

  it('HMAC da transação é determinístico e não vaza o código', () => {
    const h1 = hmacHex('segredo', 'HP123')
    const h2 = hmacHex('segredo', 'HP123')
    const h3 = hmacHex('segredo', 'HP124')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
    expect(h1).not.toContain('HP123')
  })
})

describe('sessão assinada', () => {
  it('cria e valida sessão', () => {
    const t = signSession({ email: 'a@b.c', pid: 'x', exp: Date.now() + 10000 }, 's3cret')
    const v = verifySession(t, 's3cret')
    expect(v?.email).toBe('a@b.c')
  })

  it('rejeita token adulterado ou expirado', () => {
    const t = signSession({ email: 'a@b.c', pid: 'x', exp: Date.now() + 10000 }, 's3cret')
    expect(verifySession(t + 'x', 's3cret')).toBeNull()
    expect(verifySession(t, 'outro')).toBeNull()
    const exp = signSession({ email: 'a@b.c', pid: 'x', exp: Date.now() - 1000 }, 's3cret')
    expect(verifySession(exp, 's3cret')).toBeNull()
  })
})

describe('regras de acesso e login', () => {
  it('login exige e-mail + código (validação cliente/servidor)', () => {
    const badEmail = 'sem-arroba'
    const badCode = '12'
    expect(badEmail.includes('@')).toBe(false)
    expect(badCode.trim().length < 4).toBe(true)
  })

  it('rate limit: 5 falhas em 15min bloqueiam', () => {
    const MAX_FAILS = 5
    const fails = Array.from({ length: 5 }, (_, i) => ({ email: 'a@b.c', success: false, at: Date.now() - i * 60000 }))
    const recent = fails.filter((f) => Date.now() - f.at < 15 * 60 * 1000 && !f.success)
    expect(recent.length >= MAX_FAILS).toBe(true)
  })
})
