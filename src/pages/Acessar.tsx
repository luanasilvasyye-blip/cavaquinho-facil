import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { KeyRound, Mail, Music2, ShieldCheck } from 'lucide-react'
import { Page } from '../components/Layout'
import { login } from '../lib/auth'

export default function Acessar() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) {
      setError('Informe o e-mail usado na compra.')
      return
    }
    if (code.trim().length < 4) {
      setError('Informe o código da transação do comprovante Hotmart.')
      return
    }
    setLoading(true)
    const r = await login(email.trim().toLowerCase(), code.trim())
    setLoading(false)
    if (r.ok) nav('/app')
    else setError(r.error || 'Não foi possível entrar. Confira os dados.')
  }

  return (
    <Page>
      <div className="page-enter mx-auto max-w-md py-6">
        <div className="text-center">
          <span className="inline-grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-ink-950 shadow-glow">
            <Music2 size={32} strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 text-2xl font-black">Acessar meu aplicativo</h1>
          <p className="mt-1 text-sm text-white/70">
            Entre com o <strong>e-mail da compra</strong> e o <strong>código da transação</strong> do comprovante Hotmart.
          </p>
        </div>

        <form onSubmit={submit} className="card page-enter-1 mt-5 space-y-4 border-emerald-500/20">
          <div>
            <label className="label" htmlFor="email"><Mail size={14} className="mr-1 inline" /> E-mail da compra</label>
            <input id="email" className="input" type="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="code"><KeyRound size={14} className="mr-1 inline" /> Código da transação</label>
            <input id="code" className="input" type="text" autoComplete="off" placeholder="Ex.: HP1234567890" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? 'Verificando…' : 'Entrar no aplicativo'}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-white/50">
            <ShieldCheck size={14} /> Verificação segura no servidor, sem senha para decorar.
          </p>
        </form>

        <div className="card page-enter-2 mt-3 text-sm">
          <p className="font-bold">Onde encontro o código da transação?</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-white/70">
            <li>Abra o e-mail de comprovante da Hotmart (“Sua compra foi aprovada”).</li>
            <li>Procure por “Código da transação”, “Transaction” ou “ID da compra”.</li>
            <li>Digite exatamente como aparece (letras e números).</li>
            <li>Se o pagamento acabou de aprovar, aguarde alguns minutos e tente de novo.</li>
          </ol>
          <p className="mt-3 text-white/70">
            Ainda não tem acesso?{' '}
            <a href="https://cavaquinho-facil.lovable.app/" target="_blank" rel="noreferrer" className="font-semibold text-emerald-300 underline">
              Ver a página oficial
            </a>
            {' · '}
            <Link to="/demo" className="font-semibold text-emerald-300 underline">Testar demo grátis</Link>
          </p>
        </div>
      </div>
    </Page>
  )
}
