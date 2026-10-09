import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/Layout'
import { RequireAuth } from './Dashboard'
import { loadLocalProgress, planPercent, daysStudied, nextActivity, fetchServerProgress, emptyProgress, type ProgressState } from '../lib/progress'
import { PLAN_META } from '../lib/plan'

export default function Progresso() {
  return (
    <RequireAuth render={(s) => <ProgInner email={s.email} />} />
  )
}

function ProgInner({ email }: { email: string }) {
  const [p, setP] = useState<ProgressState>(() => loadLocalProgress())
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    fetchServerProgress()
      .then((sp) => sp && setP(sp))
      .catch(() => setOffline(true))
  }, [])

  const pct = planPercent(p)
  const days = daysStudied(p)
  const next = nextActivity(p)

  return (
    <Page email={email} app>
      <h1 className="text-2xl font-black">Minha evolução</h1>
      {offline && <p className="card mt-2 border-gold/40 text-sm text-gold-light">Offline — mostrando dados locais.</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div className="card"><p className="text-3xl font-black text-emerald-400">{p.completedDays.length}/7</p><p className="text-xs text-white/60">aulas concluídas</p></div>
        <div className="card"><p className="text-3xl font-black text-emerald-400">{p.sessions.filter((s) => s.kind === 'trainer').length}</p><p className="text-xs text-white/60">exercícios</p></div>
        <div className="card"><p className="text-3xl font-black text-emerald-400">{days}</p><p className="text-xs text-white/60">dias estudados</p></div>
        <div className="card"><p className="text-3xl font-black text-gold-light">{pct}%</p><p className="text-xs text-white/60">plano concluído</p></div>
      </div>

      <div className="card mt-3">
        <p className="font-black">Plano de 7 dias</p>
        <div className="mt-2 space-y-1.5">
          {PLAN_META.map((d) => {
            const done = p.completedDays.includes(d.day)
            return (
              <Link key={d.day} to="/app/plano" className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                <span>Dia {d.day} — {d.title}</span>
                <span className={done ? 'text-emerald-400' : 'text-white/40'}>{done ? '✓' : '○'}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="card mt-3">
        <p className="font-black">Histórico de prática</p>
        {p.sessions.length === 0 ? (
          <p className="mt-1 text-sm text-white/60">Nenhuma sessão ainda. Faça um treino para ver aqui.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {p.sessions.slice(0, 20).map((s) => (
              <li key={s.id} className="flex justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                <span>
                  {s.kind === 'trainer' ? `Treino ${s.chordA}↔${s.chordB} · ${s.swaps} trocas` : s.kind === 'lesson' ? `Aula dia ${s.day}` : 'Metrônomo'}
                </span>
                <span className="shrink-0 text-white/50">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to={next.href} className="btn-primary mt-3 w-full">Próxima atividade: {next.label}</Link>
    </Page>
  )
}
