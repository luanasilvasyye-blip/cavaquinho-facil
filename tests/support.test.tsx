import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Suporte } from '../src/pages/Legal'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('suporte configurável', () => {
  it('sem e-mail configurado não inventa contato', () => {
    render(
      <MemoryRouter>
        <Suporte email="" />
      </MemoryRouter>
    )
    expect(screen.getByText(/ainda não configurado/i)).toBeDefined()
    expect(screen.queryByRole('link', { name: /@/ })).toBeNull()
  })

  it('com e-mail configurado exibe mailto', () => {
    render(
      <MemoryRouter>
        <Suporte email="suporte@exemplo.com" />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /suporte@exemplo\.com/ })
    expect(link.getAttribute('href')).toBe('mailto:suporte@exemplo.com')
  })
})
