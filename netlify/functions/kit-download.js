// GET /.netlify/functions/kit-download?file=<id> — PDFs pagos do Kit de Apoio.
// Valida a sessão, confirma compra ativa e devolve URL assinada de curta duração.
// - Bucket privado no Supabase Storage (nunca public/ ou dist/).
// - service_role fica só no servidor; o navegador recebe apenas a URL temporária.
// - Lista fixa de IDs: nomes arbitrários de arquivo são rejeitados (400).
// - Sem sessão/compra ativa: 401. Banco fora: 503 (nunca 200 falso).
// - Sem bypass de teste: não existe caminho mock nesta função.
import { env, json, getCookie, verifySession, sb } from './_shared.js'

export const KIT_BUCKET_DEFAULT = 'kit-pdfs'

// IDs públicos fixos -> objetos privados no bucket. Nada fora desta lista é servido.
export const KIT_FILES = {
  'guia-de-inicio': { object: 'guia-de-inicio.pdf', title: 'Guia de Início' },
  'acordes-ilustrados': { object: 'acordes-ilustrados.pdf', title: '10 Acordes Ilustrados' },
  'planner-de-estudos': { object: 'planner-de-estudos.pdf', title: 'Planner de Estudos' }
}

function expirySeconds() {
  const raw = parseInt(env('KIT_URL_EXPIRY_SECONDS', '120'), 10)
  if (!Number.isFinite(raw)) return 120
  return Math.min(600, Math.max(60, raw))
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método não permitido' })

  const params = event.queryStringParameters || {}
  const fileId = String(params.file ?? '').trim()
  if (!fileId || !Object.prototype.hasOwnProperty.call(KIT_FILES, fileId)) {
    return json(400, { error: 'Material inválido.' })
  }

  // Sessão + compra ativa (mesma regra das demais rotas protegidas).
  const token = getCookie(event, 'session')
  const sess = verifySession(token, env('SESSION_SECRET') || 'missing')
  if (!sess) return json(401, { error: 'Sem acesso. Entre como aluno.' })
  let sel = null
  try {
    sel = await sb.select('purchases', {
      select: 'id,status',
      filters: [{ col: 'id', op: 'eq', val: sess.pid }],
      limit: 1
    })
  } catch {
    return json(503, { error: 'Falha temporária. Tente de novo.' })
  }
  if (!sel.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
  const row = sel.data?.[0]
  if (!row || row.status !== 'approved') return json(401, { error: 'Sem acesso. Entre como aluno.' })

  // URL assinada de curta duração via Storage API (service_role, só servidor).
  const supabaseUrl = env('SUPABASE_URL').replace(/\/$/, '')
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Downloads indisponíveis no servidor.' })
  const bucket = env('KIT_BUCKET', KIT_BUCKET_DEFAULT) || KIT_BUCKET_DEFAULT
  const object = KIT_FILES[fileId].object
  const expiresIn = expirySeconds()
  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(object)}`,
      {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn })
      }
    )
    if (!res.ok) return json(503, { error: 'Falha temporária. Tente de novo.' })
    const data = await res.json().catch(() => null)
    if (!data?.signedURL) return json(503, { error: 'Falha temporária. Tente de novo.' })
    return json(200, { url: `${supabaseUrl}/storage/v1${data.signedURL}`, expiresIn })
  } catch {
    return json(503, { error: 'Falha temporária. Tente de novo.' })
  }
}
