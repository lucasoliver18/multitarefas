import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Servicos from '../pages/Servicos'
import { cpfValido } from '../utils/mascaras'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const servico = (id, titulo, extra) => ({
  id, titulo, cliente: 'Luciano', cliente_id: 1, prioridade: 'media', status: 'em_andamento',
  pago: false, prazo: '2026-12-01', tag: null, tem_orcamento: true, tem_orcamento_aprovado: false, ...extra,
})
const SERVICOS = [
  servico(1, 'Com aprovado', { tem_orcamento_aprovado: true }),
  servico(2, 'Sem aprovado'),
]

const montar = () => render(
  <MemoryRouter initialEntries={['/servicos']}>
    <ToastProvider>
      <Routes>
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/editar/:id" element={<p>Editando serviço</p>} />
      </Routes>
    </ToastProvider>
  </MemoryRouter>
)

// Abre a confirmação de exclusão do cartão e confirma.
const excluirCartao = (titulo) => {
  const cartao = screen.getByText(titulo).closest('div.rounded-xl')
  fireEvent.click(within(cartao).getByRole('button', { name: 'Excluir' }))
  fireEvent.click(within(screen.getByRole('button', { name: 'Cancelar' }).parentElement).getByRole('button', { name: 'Excluir' }))
}

describe('excluir serviço com orçamento aprovado', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-04T12:00:00'))
    api.get.mockReset(); api.delete.mockReset()
    api.get.mockResolvedValue({ data: SERVICOS })
    api.delete.mockResolvedValue({ data: {} })
  })
  afterEach(() => vi.useRealTimers())

  it('sem orçamento aprovado exclui direto, sem perguntar do estoque', async () => {
    montar()
    await screen.findByText('Sem aprovado')
    excluirCartao('Sem aprovado')

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/servicos/2'))
    expect(screen.queryByRole('dialog', { name: 'Devolver ao estoque?' })).not.toBeInTheDocument()
  })

  it('pergunta e devolve o estoque quando escolhido, sem abrir a edição', async () => {
    montar()
    await screen.findByText('Com aprovado')
    excluirCartao('Com aprovado')

    const pergunta = screen.getByRole('dialog', { name: 'Devolver ao estoque?' })
    expect(api.delete).not.toHaveBeenCalled()
    fireEvent.click(within(pergunta).getByRole('button', { name: 'Devolver ao estoque' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/servicos/1', { params: { devolver_estoque: 1 } }))
    expect(await screen.findByText('Serviço excluído e estoque devolvido')).toBeInTheDocument()
    expect(screen.queryByText('Editando serviço')).not.toBeInTheDocument()
  })

  it('"Manter descontado" exclui sem devolver; "Cancelar" desiste da exclusão', async () => {
    montar()
    await screen.findByText('Com aprovado')

    excluirCartao('Com aprovado')
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Devolver ao estoque?' })).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Devolver ao estoque?' })).not.toBeInTheDocument()
    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.getByText('Com aprovado')).toBeInTheDocument()

    excluirCartao('Com aprovado')
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Devolver ao estoque?' })).getByRole('button', { name: 'Manter descontado' }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/servicos/1'))
    expect(await screen.findByText('Serviço excluído')).toBeInTheDocument()
  })

  it('exclusão em massa pergunta uma vez só e aplica a todos', async () => {
    montar()
    await screen.findByText('Com aprovado')
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar' }))
    fireEvent.click(screen.getByText('Com aprovado'))
    fireEvent.click(screen.getByText('Sem aprovado'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir selecionados' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    const pergunta = await screen.findByRole('dialog', { name: 'Devolver ao estoque?' })
    expect(pergunta).toHaveTextContent('1 dos serviços selecionados tem orçamento aprovado')
    fireEvent.click(within(pergunta).getByRole('button', { name: 'Devolver ao estoque' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('2 serviços excluídos e estoque devolvido')).toBeInTheDocument()
  })
})

describe('validação de CPF na tela', () => {
  it('confere os dígitos verificadores, como o servidor', () => {
    expect(cpfValido('123.576.159-23')).toBe(true)
    expect(cpfValido('52998224725')).toBe(true)
    expect(cpfValido('123.576.159-24')).toBe(false)
    expect(cpfValido('111.111.111-11')).toBe(false)
    expect(cpfValido('123.576.159')).toBe(false)
    expect(cpfValido('')).toBe(false)
  })
})
