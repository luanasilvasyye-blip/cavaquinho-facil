import { useEffect, useState } from 'react'
import { Check, Lock, ChevronDown } from 'lucide-react'
import { Page } from '../components/Layout'
import { PLAN_META, type StudyDay } from '../lib/plan'
import { fetchLessons } from '../lib/lessons'
import { getChord } from '../lib/music'
import { ChordDiagram } from '../components/ChordDiagram'
import { RequireAuth } from './Dashboard'
import { loadLocalProgress, completeDay, saveDayServer, fetchServerProgress, planPercent, type ProgressState } from '../lib/progress'

export default function Plano() {
  return (
    <RequireAuth render={(s) => <PlanoInner email={s.email} />} />
  )
}

function PlanoInner({ email }: { email: string }) {
  const [p, setP] = useState<ProgressState>(() => loadLocalProgress())
  const [open, setOpen] = useState<number>(1)
  const [saving, setSaving] = useState<number | null>(null)
  const [lessons, setLessons] = useState<StudyDay[] | null>(null)
  const [lessonsError, setLessonsError] = useState<string | null>(null)

  useEffect(() => {
    fetchServerProgress().then((sp) => sp && setP(sp)).catch(() => undefined)
    // Conteúdo das aulas vem do servidor (exige sessão); metadados já estão na tela.
    fetchLessons()
      .then(setLessons)
      .catch((e: Error) => setLessonsError(e.message))
  }, [])

  const toggle = async (day: number) => {
    const already = p.completedDays.includes(day)
    if (already) return
    setSaving(day)
    const next = completeDay(p, day)
    setP(next)
    try {
      await saveDayServer(day)
    } catch {
      /* offline: mantém local */
    }
    setSaving(null)
  }

  const pct = planPercent(p)

  return (
    <Page email={email} app>
      <h1 className="text-2xl font-black">Jornada de 7 dias</h1>
      <p className="text-sm text-white/65">{p.completedDays.length}/7 dias concluídos · {pct}% da jornada.</p>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      {lessonsError && (
        <p className="card mt-3 border-gold/40 text-sm text-gold-light">
          Não foi possível carregar o conteúdo das aulas ({lessonsError}). Os títulos continuam visíveis; tente de novo com internet.
        </p>
      )}

      {/* Linha do tempo */}
      <div className="mt-5 space-y-0">
        {PLAN_META.map((m, idx) => {
          const done = p.completedDays.includes(m.day)
          const isOpen = open === m.day
          const full = lessons?.find((d) => d.day === m.day)
          const isNext = !done && PLAN_META.slice(0, idx).every((d) => p.completedDays.includes(d.day))
          return (
            <div key={m.day} className="relative flex gap-3 pb-4 last:pb-0">
              {/* trilho */}
              {idx < PLAN_META.length - 1 && (
                <span className={`absolute left-[22px] top-12 h-[calc(100%-3rem)] w-0.5 rounded ${done ? 'bg-emerald-500/60' : 'bg-white/10'}`} />
              )}
              <span
                className={`z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black transition ${
                  done
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-ink-950 shadow-glow'
                    : isNext
                      ? 'border-2 border-emerald-400 bg-emerald-500/10 text-emerald-300'
                      : 'border border-white/15 bg-ink-800 text-white/45'
                }`}
              >
                {done ? <Check size={18} strokeWidth={3} /> : m.day}
              </span>
              <div className={`card flex-1 !p-4 ${done ? 'border-emerald-500/35' : ''} ${isOpen ? 'border-emerald-500/25' : ''}`}>
                <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(isOpen ? 0 : m.day)} aria-expanded={isOpen}>
                  <span className="flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-white/50">
                      Dia {m.day} · ~{m.minutes} min {isNext && !done ? '· próximo' : ''}
                    </span>
                    <span className="block text-base font-black">{m.title}</span>
                    <span className="block text-xs text-white/60">{m.goal}</span>
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-white/50 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="page-enter mt-4 space-y-4 border-t border-white/[0.07] pt-4">
                    {!lessons && !lessonsError && (
                      <p className="flex items-center gap-2 text-sm text-white/60">
                        <Lock size={14} /> Carregando aula protegida…
                      </p>
                    )}
                    {full?.steps.map((s, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.03] p-3">
                        <p className="font-bold text-gold-light">{s.title} <span className="text-xs font-semibold text-white/50">· {s.minutes} min</span></p>
                        {s.body.map((par, j) => (
                          <p key={j} className="mt-1.5 text-sm leading-relaxed text-white/80">{par}</p>
                        ))}
                        {s.chordIds && (
                          <div className="mt-2 grid gap-2">
                            {s.chordIds.map((id) => (
                              <ChordDiagram key={id} chord={getChord(id)} />
                            ))}
                          </div>
                        )}
                        <p className="mt-2 rounded-xl bg-emerald-500/10 p-3 text-sm"><strong>Exercício:</strong> {s.exercise}</p>
                      </div>
                    ))}
                    <button
                      className="btn-primary w-full"
                      disabled={done || saving === m.day}
                      onClick={() => toggle(m.day)}
                    >
                      {done ? 'Dia concluído ✓' : saving === m.day ? 'Salvando…' : `Concluir Dia ${m.day}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Page>
  )
}
