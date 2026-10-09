import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { ChordDiagram } from '../components/ChordDiagram'
import { CHORDS } from '../lib/music'
import { RequireAuth } from './Dashboard'

export default function Acordes() {
  const nav = useNavigate()
  return (
    <RequireAuth
      render={(s) => (
        <Page email={s.email} app>
          <AcordesInner onPractice={(id) => nav(`/app/treinador?chord=${id}`)} />
        </Page>
      )}
    />
  )
}

export function AcordesInner({ onPractice }: { onPractice: (id: string) => void }) {
  const [filter, setFilter] = useState<string>('all')
  const list = filter === 'all' ? CHORDS : CHORDS.filter((c) => c.id === filter)
  return (
    <>
      <h1 className="text-2xl font-black">Acordes interativos</h1>
      <p className="mt-1 text-sm text-white/65">
        Afinação Ré–Sol–Si–Ré (D4 G4 B4 D5). Escolha um acorde, confira o diagrama e ouça o som real.
      </p>
      <div className="sticky top-[65px] z-10 -mx-4 mt-4 overflow-x-auto bg-ink-950/90 px-4 py-2 backdrop-blur" role="tablist" aria-label="Selecionar acorde">
        <div className="flex gap-1.5">
          <button
            role="tab"
            aria-selected={filter === 'all'}
            className={`chip ${filter === 'all' ? 'chip-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          {CHORDS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={filter === c.id}
              className={`chip ${filter === c.id ? 'chip-active' : ''}`}
              onClick={() => setFilter(c.id)}
            >
              {c.short}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {list.map((c) => (
          <ChordDiagram key={c.id} chord={c} onPractice={onPractice} />
        ))}
      </div>
    </>
  )
}
