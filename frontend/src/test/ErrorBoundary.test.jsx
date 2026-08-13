import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/ErrorBoundary'

const ComponenteQueLanca = () => {
  throw new Error('Erro de teste')
}

const ComponenteNormal = () => <p>Conteúdo normal</p>

describe('ErrorBoundary', () => {
  it('renderiza os filhos quando não há erro', () => {
    render(
      <ErrorBoundary>
        <ComponenteNormal />
      </ErrorBoundary>
    )
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument()
  })

  it('exibe tela de erro quando filho lança exceção', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ComponenteQueLanca />
      </ErrorBoundary>
    )

    expect(screen.getByText('Algo deu errado.')).toBeInTheDocument()
    expect(screen.getByText('Recarregue a página para continuar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
