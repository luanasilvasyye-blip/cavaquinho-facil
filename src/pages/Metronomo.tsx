import { useEffect, useRef, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { Page } from '../components/Layout'
import { MetronomeEngine, beatsPerBar, clampBpm, type TimeSignature } from '../lib/metronome'
import { getAudioContext, playClick } from '../lib/audio'
import { RequireAuth } from './Dashboard'

export default function Metronomo() {
  return (
    <RequireAuth render={(s) => <MetroInner email={s.email} />} />
  )
}

function MetroInner({ email }: { email: string }) {
  const [bpm, setBpm] = useState(80)
  const [sig, setSig] = useState<TimeSignature>('2/4')
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(-1)
  const engine = useRef<MetronomeEngine | null>(null)

  useEffect(() => {
    const eng = new MetronomeEngine(getAudioContext)
    eng.onAudioBeat = (b) => {
      try {
        playClick(b.time, b.accent)
      } catch { /* ignore */ }
    }
    eng.onVisualBeat = (beatInBar) => setBeat(beatInBar)
    engine.current = eng
    return () => eng.stop()
  }, [])

  useEffect(() => {
    engine.current?.setBpm(bpm)
  }, [bpm])

  useEffect(() => {
    engine.current?.setSignature(sig)
    setBeat(-1)
  }, [sig])

  const toggle = () => {
    if (running) {
      engine.current?.stop()
      setRunning(false)
      setBeat(-1)
    } else {
      try {
        engine.current?.start(bpm, sig)
        setRunning(true)
      } catch {
        alert('Áudio indisponível neste navegador.')
      }
    }
  }

  const perBar = beatsPerBar(sig)

  return (
    <Page email={email} app>
      <h1 className="text-2xl font-black">Metrônomo</h1>
      <p className="text-sm text-white/65">Agendamento preciso via Web Audio API. A primeira batida é mais aguda.</p>

      <div className="card mt-4 border-emerald-500/25 text-center">
        <div className="flex items-center justify-center gap-3">
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-xl font-black transition active:scale-90"
            onClick={() => setBpm((b) => clampBpm(b - 5))}
            aria-label="Diminuir 5 BPM"
          >
            −
          </button>
          <p className="min-w-[150px] text-6xl font-black tabular-nums tracking-tight">
            {clampBpm(bpm)} <span className="text-lg font-bold text-emerald-400">BPM</span>
          </p>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-xl font-black transition active:scale-90"
            onClick={() => setBpm((b) => clampBpm(b + 5))}
            aria-label="Aumentar 5 BPM"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={40}
          max={220}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          className="mt-4 w-full accent-emerald-500"
          aria-label="BPM"
        />
        <div className="mt-2 flex justify-between text-xs text-white/50"><span>40 lento</span><span>220 rápido</span></div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {([60, 70, 80, 90, 100, 120] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBpm(b)}
              className={`chip !py-1.5 !text-xs ${bpm === b ? 'chip-active' : ''}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-3">
        <p className="label">Compasso</p>
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-ink-950/60 p-1">
          {(['2/4', '3/4', '4/4'] as TimeSignature[]).map((s) => (
            <button
              key={s}
              onClick={() => setSig(s)}
              aria-pressed={sig === s}
              className={`rounded-xl px-4 py-3 font-black transition ${
                sig === s ? 'bg-emerald-500 text-ink-950 shadow-glow' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-3" role="status" aria-label="Batidas">
          {Array.from({ length: perBar }).map((_, i) => {
            const active = beat === i
            const isAccent = i === 0
            return (
              <div
                key={i}
                className={`beat-dot grid h-16 w-16 place-items-center rounded-full border-2 text-xl font-black sm:h-[72px] sm:w-[72px] ${
                  active
                    ? isAccent
                      ? 'border-gold-light bg-gradient-to-br from-gold-light to-gold-dark text-ink-950 shadow-glow beat-active'
                      : 'border-emerald-300 bg-gradient-to-br from-emerald-400 to-emerald-600 text-ink-950 shadow-glow beat-active'
                    : running
                      ? 'border-white/20 bg-white/[0.07] text-white/60'
                      : 'border-white/12 bg-white/[0.04] text-white/35'
                }`}
              >
                {i + 1}
              </div>
            )
          })}
        </div>
        <div className="mx-auto mt-3 flex max-w-[240px] justify-center gap-1">
          {Array.from({ length: perBar }).map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${beat === i ? 'bg-emerald-400' : 'bg-white/10'}`} />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-white/55">
          {running ? `Tocando ${sig} a ${bpm} BPM — tempo ${beat + 1 >= 1 ? beat + 1 : '…'} acende no tempo exato` : 'Toque iniciar e acompanhe as batidas'}
        </p>
        <button className="btn-primary mt-3 w-full" onClick={toggle}>
          {running ? <><Square size={18} /> Parar</> : <><Play size={18} /> Iniciar metrônomo</>}
        </button>
      </div>

      <div className="card mt-3 text-sm text-white/70">
        <p className="font-bold text-white">Como estudar samba (iniciante)</p>
        <p className="mt-1">Comece no 2/4 a 60–70 BPM tocando Sol. Quando acertar 2 minutos sem errar, suba 5 BPM. O samba de roda costuma passar de 90 BPM — chegue lá aos poucos.</p>
      </div>
    </Page>
  )
}
