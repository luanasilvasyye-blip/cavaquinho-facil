import { useState } from 'react'
import { Volume2, Dumbbell } from 'lucide-react'
import { type ChordDefinition, chordNotes, STRING_LABELS } from '../lib/music'
import { playChordMidis } from '../lib/audio'

// Diagrama interativo em formato de braço: 4 cordas (4ª→1ª) x casas.
// Áudio real via Web Audio API; posições verificadas nota por nota.
export function ChordDiagram({ chord, onPractice }: { chord: ChordDefinition; onPractice?: (id: string) => void }) {
  const [playing, setPlaying] = useState(false)
  const notes = chordNotes(chord)
  const maxFret = Math.max(4, ...chord.frets)
  const frets = Array.from({ length: maxFret }, (_, i) => i + 1)

  const play = () => {
    try {
      setPlaying(true)
      playChordMidis(notes.map((n) => n.midi))
      window.setTimeout(() => setPlaying(false), 900)
    } catch {
      setPlaying(false)
      alert('Áudio indisponível neste navegador. Tente Chrome ou Edge no celular.')
    }
  }

  return (
    <div className="card card-interactive" data-testid={`chord-${chord.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark text-xl font-black text-ink-950 shadow-card">
            {chord.short}
          </span>
          <div>
            <h3 className="text-lg font-black leading-tight">{chord.name}</h3>
            <p className="text-xs text-white/55">{chord.description}</p>
          </div>
        </div>
        <span className="badge shrink-0">{chord.level}</span>
      </div>

      {/* Braço do cavaquinho */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-950/60 p-3">
        <div className="min-w-[300px]">
          {/* Pestana (casa 0) */}
          <div className="grid grid-cols-[64px_repeat(4,1fr)] items-center gap-1 text-center">
            <span className="text-[10px] font-bold uppercase text-white/40">corda</span>
            {notes.map((n) => (
              <span key={n.stringIndex} className="text-[10px] font-bold uppercase text-gold-light/90">
                {STRING_LABELS[n.stringIndex]}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-[64px_repeat(4,1fr)] items-center gap-1">
            <span className="text-[11px] font-bold text-white/50">solta</span>
            {notes.map((n) => (
              <span key={n.stringIndex} className="flex justify-center py-0.5">
                {n.fret === 0 ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-emerald-400 text-xs font-black text-emerald-300">○</span>
                ) : (
                  <span className="h-6 w-6 rounded-full bg-white/[0.04]" />
                )}
              </span>
            ))}
          </div>
          <div className="mt-1 h-1 rounded-full bg-gold/50" title="Pestana" />
          {frets.map((fret) => (
            <div key={fret} className="grid grid-cols-[64px_repeat(4,1fr)] items-center gap-1 border-b border-white/5 last:border-0">
              <span className="py-1 text-[11px] font-bold tabular-nums text-white/50">{fret}ª</span>
              {notes.map((n) => (
                <span key={n.stringIndex} className="relative flex justify-center border-l border-white/[0.07] py-1 first:border-l-0">
                  {n.fret === fret ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-ink-950 shadow-glow">
                      {chord.fingers[n.stringIndex] || '•'}
                    </span>
                  ) : (
                    <span className="h-7 w-7" />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Notas resultantes */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {notes.map((n) => (
          <div key={n.stringIndex} className="rounded-lg bg-white/[0.04] px-1 py-1.5 text-center">
            <p className="text-sm font-black text-emerald-300">{n.name}</p>
            <p className="text-[10px] text-white/50">{n.pt} · {n.fret === 0 ? 'solta' : `c.${n.fret}`}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn-primary !min-h-[52px] !text-base" onClick={play} disabled={playing} aria-label={`Ouvir acorde ${chord.short}`}>
          <Volume2 size={19} /> {playing ? 'Tocando…' : 'Ouvir acorde'}
        </button>
        {onPractice ? (
          <button className="btn-gold !min-h-[52px] !text-base" onClick={() => onPractice(chord.id)} aria-label={`Praticar ${chord.short}`}>
            <Dumbbell size={19} /> Treinar troca
          </button>
        ) : (
          <a className="btn-gold !min-h-[52px] !text-base" href="/app/treinador">
            <Dumbbell size={19} /> Treinar troca
          </a>
        )}
      </div>
    </div>
  )
}
