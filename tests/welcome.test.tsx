import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Welcome from '../src/pages/Welcome'
import { BottomNav } from '../src/components/Layout'
import { AcordesInner } from '../src/pages/Acordes'

describe('boas-vindas (sem vendas)', () => {
  it('tem botões para /acessar e /demo, sem preço ou oferta', () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /acessar meu aplicativo/i }).getAttribute('href')).toBe('/acessar')
    expect(screen.getByRole('link', { name: /experimentar demonstração/i }).getAttribute('href')).toBe('/demo')
    expect(screen.queryByText(/19,90/)).toBeNull()
    expect(screen.queryByText(/depoimento/i)).toBeNull()
    expect(screen.queryByText(/quero meu acesso/i)).toBeNull()
  })
})

describe('navegação mobile', () => {
  it('menu inferior tem Início, Acordes, Treinar, Estudos e Meu Kit', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <BottomNav />
      </MemoryRouter>
    )
    for (const label of ['Início', 'Acordes', 'Treinar', 'Estudos', 'Meu Kit']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeDefined()
    }
    expect(screen.queryByRole('link', { name: /evolução/i })).toBeNull()
  })
})

describe('seletor de acordes', () => {
  it('filtra o diagrama pelo chip selecionado', () => {
    render(<AcordesInner onPractice={() => undefined} />)
    expect(screen.getByTestId('chord-G')).toBeDefined()
    expect(screen.getByTestId('chord-C')).toBeDefined()
    fireEvent.click(screen.getByRole('tab', { name: 'C' }))
    expect(screen.queryByTestId('chord-G')).toBeNull()
    expect(screen.getByTestId('chord-C')).toBeDefined()
  })
})
