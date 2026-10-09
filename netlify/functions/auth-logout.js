// POST /.netlify/functions/auth-logout
import { json, sessionCookie } from './_shared.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido' })
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie('', { clear: true }) })
}
