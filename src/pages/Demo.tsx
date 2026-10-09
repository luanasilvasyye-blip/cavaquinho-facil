import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Lock, TrendingUp } from 'lucide-react'
import { Page } from '../components/Layout'
import { ChordDiagram } from '../components/ChordDiagram'
import { getChord } from '../lib/music'
import { createTrainer, nextSwitch, currentChordId, nextChordId, remainingSec } from '../lib/trainer'
import { loadLocalProgress, planPercent } from '../lib/progress'
import { BuyButton } from '../components/BuyButton'
import { track } from '../lib/analytics'

const DEMO_CHORDS = ['G', 'C']

export default function Demo() {
  const nav = useNavigate()
  const [trainer, setTrainer] = useState(() => createTrainer('G', 'C', 30))
  const [running, setRunning] = useState(false)
  const [swaps, setSwaps] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const progress = loadLocalProgress()

  useEffect(() => {
    track('click_demo')
  }, [])

  useEffect(() => {
    if (!running) return
    if (trainer.elapsedSec >= trainer.durationSec) {
      setRunning(false)
      return
    }
    const t = window.setTimeout(() => {
      setTrainer((s) => {
        const advanced = nextSwitch({ ...s, elapsedSec: s.elapsedSec + 2 })
        return { ...advanced, elapsedSec: s.elapsedSec + 2 }
      })
    }, 2000)
    return () => clearTimeout(t)
  }, [running, trainer.elapsedSec, trainer.durationSec])

  return (
    <Page>
      <h1 className="text-2xl font-black">Demonstração grátis</h1>
      <p className="mt-1 text-sm text-white/70">
        Teste 2 acordes com som real, 1 exercício limitado de 30 segundos e uma prévia do painel. O acesso completo libera {12} acordes, plano de 7 dias, metrônomo e progresso salvo.
      </p>

      <div className="mt-4 grid gap-3">
        {DEMO_CHORDS.map((id) => (
          <ChordDiagram key={id} chord={getChord(id)} onPractice={() => nav('/demo')} />
        ))}
      </div>

      <section className="card mt-4">
        <h2 className="flex items-center gap-2 text-lg font-black"><Play size={18} /> Exercício limitado: Sol ↔ Dó (30s)</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border-2 border-emerald-500 bg-emerald-500/10 p-4">
            <p className="text-[11px] font-bold uppercase text-white/60">Agora</p>
            <p className="text-3xl font-black text-emerald-400">{currentChordId(trainer)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase text-white/60">Próximo</p>
            <p className="text-3xl font-black text-white/70">{nextChordId(trainer)}</p>
          </div>
        </div>
        <p className="mt-2 text-center text-sm">Tempo restante: <strong>{remainingSec(trainer)}s</strong></p>
        {!running && trainer.elapsedSec === 0 && (
          <button className="btn-primary mt-3 w-full" onClick={() => { setTrainer(createTrainer('G', 'C', 30)); setRunning(true); setDone(null) }}>
            Iniciar exercício demo
          </button>
        )}
        {running && <button className="btn-ghost mt-3 w-full" onClick={() => setRunning(false)}>Pausar</button>}
        {!running && trainer.elapsedSec > 0 && (
          <div className="mt-3">
            <label className="label">Quantas trocas você conseguiu?</label>
            <div className="flex gap-2">
              <input className="input" inputMode="numeric" placeholder="Ex.: 8" value={swaps} onChange={(e) => setSwaps(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              <button
                className="btn-gold shrink-0"
                onClick={() => {
                  setDone(swaps || '0')
                  // Demonstração NÃO afirma avaliação musical: apenas registra o número informado pelo aluno.
                }}
              >
                Registrar
              </button>
            </div>
            {done !== null && (
              <p className="mt-2 text-sm text-emerald-300">
                Registrado: {done} trocas (número informado por você — o app não avaliou seu áudio).
              </p>
            )}
            <button className="btn-ghost mt-2 w-full" onClick={() => { setTrainer(createTrainer('G', 'C', 30)); setSwaps(''); setDone(null) }}>
              Repetir demo
            </button>
          </div>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-white/55"><Lock size={13} /> Na versão completa você escolhe qualquer par de acordes e qualquer duração.</p>
      </section>

      <section className="card mt-4">
        <h2 className="flex items-center gap-2 text-lg font-black"><TrendingUp size={18} /> Prévia do painel</h2>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/5 p-3"><p className="text-2xl font-black">{progress.completedDays.length}</p><p className="text-[11px] text-white/60">aulas (demo)</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-2xl font-black">{planPercent(progress)}%</p><p className="text-[11px] text-white/60">plano (demo)</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-2xl font-black">{progress.sessions.length}</p><p className="text-[11px] text-white/60">sessões (demo)</p></div>
        </div>
        <p className="mt-2 text-xs text-white/55">Demonstração usa dados temporários no seu aparelho. Alunos salvan progresso na conta.</p>
      </section>

      <div className="card mt-4 border-gold/40 text-center">
        <p className="font-black">Gostou? Libere tudo agora.</p>
        <p className="mb-3 text-sm text-white/70">12 acordes · treinador livre · plano de 7 dias · metrônomo · progresso salvo</p>
        <BuyButton large />
        <Link to="/acessar" className="mt-2 inline-block text-sm text-emerald-300 underline">Já comprei — quero entrar</Link>
      </div>
    </Page>
  )
}
