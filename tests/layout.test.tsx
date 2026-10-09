import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChordDiagram } from '../src/components/ChordDiagram'
import { getChord } from '../src/lib/music'

describe('layout mobile e diagrama', () => {
  it('renderiza diagrama com botões grandes (alvos >= 48px via classes)', () => {
    render(
      <MemoryRouter>
        <ChordDiagram chord={getChord('G')} />
      </MemoryRouter>
    )
    const ouvir = screen.getByRole('button', { name: /ouvir acorde/i })
    expect(ouvir).toBeDefined()
    expect(ouvir.className).toMatch(/min-h-\[52px\]/)
    expect(screen.getByTestId('chord-G')).toBeDefined()
  })

  it('mostra notas e dedos do acorde', () => {
    render(
      <MemoryRouter>
        <ChordDiagram chord={getChord('C')} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Dó maior/)).toBeDefined()
  })
})
