import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../components/Layout'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Lucas' }, logout: vi.fn() }),
}))

const montar = () => render(
  <MemoryRouter><Layout><p>Conteúdo</p></Layout></MemoryRouter>
)
const largura = () => screen.getByText('Conteúdo').closest('[style]').style.getPropertyValue('--largura-menu')

describe('menu lateral recolhível', () => {
  beforeEach(() => localStorage.clear())

  it('recolhe e expande, mantendo os itens acessíveis', () => {
    montar()
    expect(largura()).toBe('16rem')
    expect(screen.getByText('Lucas')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }))
    expect(largura()).toBe('4.5rem')
    expect(screen.queryByText('Lucas')).not.toBeInTheDocument()
    // Recolhido, o nome do item aparece ao passar o mouse.
    expect(screen.getByRole('link', { name: 'Prazos' })).toHaveAttribute('title', 'Prazos')

    fireEvent.click(screen.getByRole('button', { name: 'Expandir menu' }))
    expect(largura()).toBe('16rem')
  })

  it('lembra a preferência entre as visitas', () => {
    const { unmount } = montar()
    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }))
    unmount()

    montar()
    expect(largura()).toBe('4.5rem')
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
  })
})
