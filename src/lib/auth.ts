export const CHECKOUT_URL = (import.meta.env.VITE_HOTMART_CHECKOUT_URL as string | undefined)?.trim() || ''

export function isCheckoutConfigured(): boolean {
  return CHECKOUT_URL.length > 8 && /^https?:\/\//.test(CHECKOUT_URL)
}

export interface SessionInfo {
  email: string
  purchaseId: string
  expiresAt: string
}

export async function getSession(): Promise<SessionInfo | null> {
  try {
    const res = await fetch('/.netlify/functions/auth-session', { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.email) return null
    return data as SessionInfo
  } catch {
    return null
  }
}

export async function login(email: string, transactionCode: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/.netlify/functions/auth-login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, transactionCode })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: (data as any)?.error || 'Falha no acesso. Tente novamente.' }
  return { ok: true }
}

export async function logout(): Promise<void> {
  await fetch('/.netlify/functions/auth-logout', { method: 'POST', credentials: 'include' }).catch(() => undefined)
}
