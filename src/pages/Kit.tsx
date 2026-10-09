import { useState } from 'react'
import { FileText, Download, Lock, BookOpen, LayoutGrid, CalendarCheck } from 'lucide-react'
import { Page } from '../components/Layout'
import { KIT_MATERIALS, requestKitUrl } from '../lib/kit'
import { RequireAuth } from './Dashboard'

const COVERS = [
  { icon: BookOpen, gradient: 'from-emerald-400 to-emerald-700' },
  { icon: LayoutGrid, gradient: 'from-gold-light to-gold-dark' },
  { icon: CalendarCheck, gradient: 'from-emerald-300 to-teal-700' }
]

export default function Kit() {
  return (
    <RequireAuth render={(s) => <KitInner email={s.email} />} />
  )
}

function KitInner({ email }: { email: string }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const download = async (id: string) => {
    setError(null)
    setLoading(id)
    try {
      const { url } = await requestKitUrl(id)
      // Abre a URL assinada (curta duração) em nova aba: funciona no celular e no computador.
      window.open(url, '_blank', 'noopener')
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao gerar o download.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Page email={email} app>
      <h1 className="text-2xl font-black">Meu Kit</h1>
      <p className="mt-1 text-sm text-white/65">
        Incluído na sua compra, sem cobrança adicional. Baixe para estudar no celular ou no computador, sem precisar imprimir.
      </p>
      {error && <p role="alert" className="card mt-3 border-red-500/40 bg-red-500/10 text-sm text-red-300">{error}</p>}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {KIT_MATERIALS.map((m, i) => {
          const cover = COVERS[i % COVERS.length]
          const Icon = cover.icon
          return (
            <div key={m.id} className="card card-interactive overflow-hidden" data-testid={`kit-${m.id}`}>
              {/* Capa */}
              <div className={`-m-5 mb-4 flex items-center gap-4 bg-gradient-to-br p-5 ${cover.gradient}`}>
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-black/30 text-white shadow-card">
                  <Icon size={30} />
                </span>
                <div className="text-ink-950">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">Cavaquinho Fácil</p>
                  <p className="text-xl font-black leading-tight text-white drop-shadow">{m.title}</p>
                  <p className="text-xs font-bold text-white/85">PDF · {m.pages} páginas</p>
                </div>
              </div>
              <p className="text-sm text-white/70">{m.description}</p>
              <button
                className="btn-primary mt-3 w-full !min-h-[52px] !text-base"
                disabled={loading === m.id}
                onClick={() => download(m.id)}
              >
                {loading === m.id ? (
                  <><FileText size={18} className="animate-pulse" /> Gerando link…</>
                ) : (
                  <><Download size={18} /> Baixar PDF</>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
        <Lock size={13} /> Links temporários e pessoais. O acesso é verificado a cada download.
      </p>
    </Page>
  )
}
