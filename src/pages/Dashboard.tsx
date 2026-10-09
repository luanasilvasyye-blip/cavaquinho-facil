import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Dumbbell, Timer, TrendingUp, Volume2, ArrowRight, Package, History } from 'lucide-react'
import { Page } from '../components/Layout'
import { getSession, type SessionInfo } from '../lib/auth'
import { loadLocalProgress, planPercent, nextActivity, fetchServerProgress, type ProgressState, emptyProgress } from '../lib/progress'
import { PLAN_META } from '../lib/plan'

export function useSession() {
  const [session, setSession] = useState<SessionInfo | null | undefined>(undefined)
  useEffect(() => {
    getSession().then(setSession)
  }, [])
  return session
}

export function RequireAuth({ children, render }: { children?: React.ReactNode; render?: (s: SessionInfo) => React.ReactNode }) {
  const session = useSession()
  if (session === undefined) {
    return (
      <Page>
        <div className="card mx-auto mt-10 max-w-sm text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-emerald-400" />
          <p className="mt-3 text-sm text-white/70">Verificando acesso…</p>
        </div>
      </Page>
    )
  }
  if (session === null) {
    return (
      <Page>
        <div className="card mx-auto mt-10 max-w-sm text-center">
          <p className="text-lg font-black">Acesso restrito a alunos</p>
          <p className="mt-1 text-sm text-white/70">Entre com o e-mail da compra e o código da transação, ou teste a demonstração grátis.</p>
          <div className="mt-4 grid gap-2">
            <Link to="/acessar" className="btn-primary w-full">Entrar como aluno</Link>
            <Link to="/demo" className="btn-ghost w-full">Testar demo grátis</Link>
          </div>
        </div>
      </Page>
    )
  }
  return <>{render ? render(session) : children}</>
}

export default function Dashboard() {
  return (
    <RequireAuth
      render={(s) => <DashInner email={s.email} />}
    />
  )
}

const QUICK = [
  { to: '/app/acordes', icon: Volume2, tint: 'bg-emerald-500/15 text-emerald-400', t: 'Acordes', d: '12 com som real' },
  { to: '/app/treinador', icon: Dumbbell, tint: 'bg-gold/15 text-gold-light', t: 'Treinar', d: 'Trocas + tempo' },
  { to: '/app/plano', icon: BookOpen, tint: 'bg-emerald-500/15 text-emerald-400', t: 'Estudos', d: 'Plano de 7 dias' },
  { to: '/app/kit', icon: Package, tint: 'bg-gold/15 text-gold-light', t: 'Meu Kit', d: '3 PDFs' },
  { to: '/app/metronomo', icon: Timer, tint: 'bg-emerald-500/15 text-emerald-400', t: 'Tempo', d: '40–220 BPM' },
  { to: '/app/progresso', icon: TrendingUp, tint: 'bg-white/10 text-white', t: 'Evolução', d: 'Seu histórico' }
]

function DashInner({ email }: { email: string }) {
  const [server, setServer] = useState<ProgressState | null>(null)
  const local = loadLocalProgress()
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetchServerProgress()
      .then((p) => {
        if (p) setServer(p)
        else setServer(local)
      })
      .catch(() => {
        setLoadError(true)
        setServer(local)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const p = server ?? emptyProgress()
  const pct = planPercent(p)
  const next = nextActivity(p)
  const nextDayIdx = Math.min(p.completedDays.length, 6)
  const recent = p.sessions.slice(0, 4)

  if (!server) {
    return (
      <Page email={email} app>
        <div className="skeleton h-5 w-48" />
        <div className="skeleton mt-2 h-8 w-64" />
        <div className="card mt-4"><div className="skeleton h-20 w-full" /><div className="skeleton mt-3 h-12 w-full" /></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-[72px]" />)}
        </div>
      </Page>
    )
  }

  return (
    <Page email={email} app>
      <div className="flex flex-wrap items-center gap-2">
        <p className="page-enter-1 text-sm text-white/60">Olá! Bora praticar hoje?</p>
        <span className="badge border-emerald-400/40 bg-emerald-500/10 text-emerald-300">● Acesso ativo</span>
      </div>
      <h1 className="page-enter-1 text-2xl font-black sm:text-3xl">Seu painel de estudos</h1>
      {loadError && <p className="card mt-3 border-gold/40 text-sm text-gold-light">Sem conexão com o servidor — mostrando dados locais temporários.</p>}

      {/* Progresso geral + continuar */}
      <div className="card page-enter-2 mt-4 overflow-hidden border-emerald-500/25">
        <div className="flex items-center gap-4">
          <div className="relative grid h-20 w-20 shrink-0 place-items-center">
            <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#10d97e" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 213.6} 213.6`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="text-lg font-black tabular-nums">{pct}%</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-white/55">Progresso geral</p>
            <p className="mt-0.5 text-sm text-white/75">{p.completedDays.length}/7 aulas · {p.sessions.length} sessões</p>
            <Link to={next.href} className="btn-primary mt-2 w-full !min-h-[48px] !text-base">
              {next.label} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Acesso rápido */}
      <h2 className="page-enter-3 mt-6 text-sm font-black uppercase tracking-widest text-white/55">Acesso rápido</h2>
      <div className="page-enter-3 mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK.map((q) => {
          const Icon = q.icon
          return (
            <Link key={q.to} to={q.to} className="card card-interactive flex items-center gap-3 !p-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${q.tint}`}><Icon size={20} /></span>
              <span><span className="block text-sm font-black">{q.t}</span><span className="block text-[11px] text-white/55">{q.d}</span></span>
            </Link>
          )
        })}
      </div>

      {/* Próxima aula + plano */}
      <div className="page-enter-4 mt-4 grid gap-3 sm:grid-cols-2">
        <div className="card border-gold/30">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-light">Próxima aula</p>
          <p className="mt-1 font-black">Dia {PLAN_META[nextDayIdx].day} — {PLAN_META[nextDayIdx].title}</p>
          <p className="mt-0.5 text-xs text-white/60">{PLAN_META[nextDayIdx].goal}</p>
          <Link to="/app/plano" className="btn-gold mt-3 w-full !min-h-[48px] !text-base">Abrir jornada</Link>
        </div>
        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest text-white/55">Plano de 7 dias</p>
          <div className="mt-3 flex items-center justify-between gap-1.5">
            {PLAN_META.map((d) => {
              const done = p.completedDays.includes(d.day)
              return (
                <Link
                  key={d.day}
                  to="/app/plano"
                  aria-label={`Dia ${d.day}${done ? ' concluído' : ''}`}
                  className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black transition ${
                    done ? 'bg-emerald-500 text-ink-950 shadow-glow' : 'bg-white/[0.07] text-white/50 hover:bg-white/10'
                  }`}
                >
                  {done ? '✓' : d.day}
                </Link>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-white/55">Toque em um dia para estudar.</p>
        </div>
      </div>

      {/* Histórico + materiais */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="card">
          <p className="flex items-center gap-2 font-black"><History size={17} className="text-emerald-400" /> Prática recente</p>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-white/55">Nenhuma sessão ainda. Faça um treino para ver aqui.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {recent.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
                  <span className="truncate">{s.kind === 'trainer' ? `Treino ${s.chordA}↔${s.chordB} · ${s.swaps}` : s.kind === 'lesson' ? 'Aula concluída' : 'Metrônomo'}</span>
                  <span className="shrink-0 text-white/45">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/progresso" className="mt-2 inline-block text-sm font-semibold text-emerald-300 underline">Ver evolução completa</Link>
        </div>
        <div className="card border-gold/30 bg-gradient-to-b from-gold/[0.08] to-ink-900">
          <p className="flex items-center gap-2 font-black"><Package size={17} className="text-gold-light" /> Materiais complementares</p>
          <p className="mt-1 text-sm text-white/65">Guia do Iniciante, 10 Acordes Ilustrados e Planner de Estudos em PDF.</p>
          <Link to="/app/kit" className="btn-gold mt-3 w-full !min-h-[48px] !text-base">Abrir Meu Kit</Link>
        </div>
      </div>
    </Page>
  )
}
