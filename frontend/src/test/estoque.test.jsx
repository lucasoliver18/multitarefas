import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import EstoqueEditor from '../components/EstoqueEditor'

describe('editor de estoque (- / +)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('só salva 1 segundo depois do último clique, com o valor final', () => {
    const onAlterar = vi.fn()
    render(<EstoqueEditor quantidade={14} unidade="un" onAlterar={onAlterar} />)

    fireEvent.click(screen.getByLabelText('Aumentar estoque'))
    act(() => vi.advanceTimersByTime(700))
    fireEvent.click(screen.getByLabelText('Aumentar estoque'))
    act(() => vi.advanceTimersByTime(900))
    expect(onAlterar).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(100))
    expect(onAlterar).toHaveBeenCalledTimes(1)
    expect(onAlterar).toHaveBeenCalledWith(16)
  })

  it('não salva nem avisa se voltar ao valor original', () => {
    const onAlterar = vi.fn()
    render(<EstoqueEditor quantidade={14} unidade="un" onAlterar={onAlterar} />)

    fireEvent.click(screen.getByLabelText('Aumentar estoque'))
    fireEvent.click(screen.getByLabelText('Diminuir estoque'))
    act(() => vi.advanceTimersByTime(3000))

    expect(onAlterar).not.toHaveBeenCalled()
  })

  it('ao sair da tela antes da espera, salva na hora o ajuste pendente', () => {
    const onAlterar = vi.fn()
    const { unmount } = render(<EstoqueEditor quantidade={14} unidade="un" onAlterar={onAlterar} />)

    fireEvent.click(screen.getByLabelText('Diminuir estoque'))
    unmount()

    expect(onAlterar).toHaveBeenCalledWith(13)
  })
})
