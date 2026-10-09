import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Square, RotateCcw } from 'lucide-react'
import { Page } from '../components/Layout'
import { CHORDS, getChord } from '../lib/music'
import { createTrainer, nextSwitch, currentChordId, nextChordId, remainingSec, isFinished, type TrainerState } from '../lib/trainer'
import { addSession, loadLocalProgress, saveSessionServer } from '../lib/progress'
import { RequireAuth } from './Dashboard'
import { ChordDiagram } from '../components/ChordDiagram'

export default function Treinador() {
  return (
    <RequireAuth
      render={(s) => <TrainerInner email={s.email} />}
    />
  )
}

function TrainerInner({ email }: { email: string }) {
  const [params] = useSearchParams()
  const pre = params.get('chord')
  const [chordA, setChordA] = useState('G')
  const [chordB, setChordB] = useState(pre && pre !== 'G' ? pre : 'C')
  const [duration, setDuration] = useState(60)
  const [t, setT] = useState<TrainerState>(() => createTrainer('G', 'C', 60))
  const [running, setRunning] = useState(false)
  const [swaps, setSwaps] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState(() => loadLocalProgress().sessions.filter((x) => x.kind === 'trainer').slice(0, 10))

  const finished = isFinished(t)

  useEffect(() => {
    if (!running || finished) {
      if (finished) setRunning(false)
      return
    }
    const timer = window.setTimeout(() => {
      setT((s) => {
        const stepped = nextSwitch(s)
        return { ...stepped, elapsedSec: s.elapsedSec + 2 }
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [running, finished, t.elapsedSec])

  const start = () => {
    try {
      setError(null)
      setSaved(null)
      setSwaps('')
      setT(createTrainer(chordA, chordB, duration))
      setRunning(true)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const save = async () => {
    const n = parseInt(swaps || '0', 10)
    if (!Number.isFinite(n) || n < 0 || n > 500) {
      setError('Informe um número de trocas de 0 a 500.')
      return
    }
    setError(null)
    // Local (demo/offline)
    const p = addSession(loadLocalProgress(), { kind: 'trainer', chordA: t.chordA, chordB: t.chordB, swaps: n, minutes: Math.round(t.durationSec / 60) })
    setHistory(p.sessions.filter((x) => x.kind === 'trainer').slice(0, 10))
    try {
      await saveSessionServer({ kind: 'trainer', chordA: t.chordA, chordB: t.chordB, swaps: n, minutes: Math.round(t.durationSec / 60) })
      setSaved(`Salvo: ${n} trocas de ${t.chordA} ↔ ${t.chordB}. (Número informado por você — sem avaliação automática de áudio.)`)
    } catch {
      setSaved(`Salvo localmente: ${n} trocas. Sem conexão — sincronize depois.`)
    }
  }

  const chordAC = useMemo(() => getChord(t.chordA), [t.chordA])
  const chordBC = useMemo(() => getChord(t.chordB), [t.chordB])
  const doneRatio = Math.min(1, t.elapsedSec / t.durationSec)
  const ring = 2 * Math.PI * 30

  return (
    <Page email={email} app>
      <h1 className="text-2xl font-black">Treinador de trocas</h1>
      <p className="text-sm text-white/65">Escolha 2 acordes, defina o tempo e acompanhe a alternância. No fim, registre quantas trocas conseguiu.</p>

      <div className="card mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Acorde 1</label>
          <select className="input" value={chordA} onChange={(e) => setChordA(e.target.value)} disabled={running}>
            {CHORDS.map((c) => <option key={c.id} value={c.id}>{c.short} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Acorde 2</label>
          <select className="input" value={chordB} onChange={(e) => setChordB(e.target.value)} disabled={running}>
            {CHORDS.map((c) => <option key={c.id} value={c.id}>{c.short} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duração (segundos)</label>
          <select className="input" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} disabled={running}>
            {[30, 60, 90, 120, 180, 300].map((d) => <option key={d} value={d}>{d}s</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="card mt-3 border-red-500/40 bg-red-500/10 text-sm text-red-300">{error}</p>}

      {/* Palco do exercício */}
      <div className="card mt-3 border-emerald-500/25 text-center">
        <div className="flex items-center justify-center gap-5">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center">
            <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
              <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="30" fill="none" stroke={finished ? '#d4af37' : '#10d97e'} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${doneRatio * ring} ${ring}`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-xl font-black tabular-nums">{remainingSec(t)}s</span>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            <div key={currentChordId(t)} className="page-enter rounded-2xl border-2 border-emerald-400 bg-emerald-500/10 p-4 shadow-glow">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Agora</p>
              <p className="text-4xl font-black text-emerald-300">{currentChordId(t)}</p>
              <p className="truncate text-xs text-white/60">{t.currentIndex === 0 ? chordAC.name : chordBC.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Próximo</p>
              <p className="text-4xl font-black text-white/75">{nextChordId(t)}</p>
              <p className="truncate text-xs text-white/60">{t.currentIndex === 0 ? chordBC.name : chordAC.name}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-1000" style={{ width: `${doneRatio * 100}%` }} />
        </div>
        <p className="mt-2 text-center text-sm text-white/70">
          {running ? `Praticando… troca a cada 2s` : finished ? 'Exercício concluído! Registre suas trocas abaixo.' : `Pronto: ${t.chordA} ↔ ${t.chordB} por ${t.durationSec}s`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {!running ? (
            <button className="btn-primary col-span-2" onClick={start}><Play size={18} /> {finished || t.elapsedSec > 0 ? 'Recomeçar' : 'Iniciar cronômetro'}</button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => setRunning(false)}><Square size={16} /> Pausar</button>
              <button className="btn-ghost" onClick={start}><RotateCcw size={16} /> Reiniciar</button>
            </>
          )}
        </div>
      </div>

      {(finished || (!running && t.elapsedSec > 0)) && (
        <div className="card mt-3 border-gold/30">
          <p className="font-black text-gold-light">Resultado da sessão</p>
          <label className="label mt-2">Quantas trocas completas você conseguiu?</label>
          <div className="flex gap-2">
            <input className="input" inputMode="numeric" value={swaps} onChange={(e) => setSwaps(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex.: 15" />
            <button className="btn-gold shrink-0" onClick={save}>Salvar</button>
          </div>
          {saved && <p className="mt-2 text-sm text-emerald-300">{saved}</p>}
        </div>
      )}

      <div className="mt-3 grid gap-3">
        <ChordDiagram chord={chordAC} />
        <ChordDiagram chord={chordBC} />
      </div>

      <div className="card mt-3">
        <p className="font-black">Histórico de exercícios</p>
        {history.length === 0 ? <p className="mt-1 text-sm text-white/60">Nenhum exercício registrado ainda.</p> : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                <span className="font-bold">{h.chordA} ↔ {h.chordB}</span>
                <span className="text-white/60">{h.swaps} trocas · {new Date(h.date).toLocaleDateString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  )
}
