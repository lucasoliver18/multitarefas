import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Servicos from '../pages/Servicos'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

// Guarda o onDragEnd do quadro para simular o arraste (o jsdom não arrasta).
let soltar = null
vi.mock('@dnd-kit/core', async (original) => {
  const real = await original()
  const { createElement } = await import('react')
  return { ...real, DndContext: (props) => { soltar = props.onDragEnd; return createElement(real.DndContext, props) } }
})

const servico = (id, titulo, extra) => ({
  id, titulo, cliente: 'Luciano', cliente_id: 1, prioridade: 'media', status: 'em_andamento',
  pago: false, prazo: null, tag: null, tem_orcamento: true, tem_orcamento_aprovado: true, ...extra,
})

const montar = (servicos) => {
  api.get.mockResolvedValue({ data: servicos })
  return render(<MemoryRouter initialEntries={['/servicos']}><ToastProvider><Servicos /></ToastProvider></MemoryRouter>)
}
const arrastar = (id, coluna) => act(() => soltar({ active: { id }, over: { id: coluna } }))

// Arrastar no quadro segue a mesma regra do menu de status e da edição.
describe('arrastar serviço no quadro', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset(); api.patch.mockReset()
    api.patch.mockResolvedValue({ data: {} })
  })

  it('para Finalizado sem pagar: pergunta antes e não muda nada até confirmar', async () => {
    montar([servico(1, 'Troca de tela')])
    await screen.findByText('Troca de tela')

    arrastar(1, 'finalizado')
    expect(await screen.findByText('Serviço ainda não está marcado como pago. Finalizar mesmo assim?')).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar e marcar como pago' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/servicos/1', { status: 'finalizado', pago: true }))
  })

  it('sem orçamento aprovado e sem pagar: um aviso só, com os dois motivos', async () => {
    montar([servico(1, 'Troca de tela', { tem_orcamento_aprovado: false })])
    await screen.findByText('Troca de tela')

    arrastar(1, 'finalizado')
    expect(await screen.findByText('Serviço sem orçamento aprovado e ainda não marcado como pago. Finalizar mesmo assim?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Só finalizar' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/servicos/1', { status: 'finalizado' }))
  })

  it('cancelar deixa o serviço onde estava', async () => {
    montar([servico(1, 'Troca de tela')])
    await screen.findByText('Troca de tela')

    arrastar(1, 'finalizado')
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByText(/Finalizar mesmo assim/)).not.toBeInTheDocument())
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('não deixa voltar o status (Finalizado → Pendente)', async () => {
    montar([servico(1, 'Troca de tela', { status: 'finalizado', pago: true })])
    await screen.findByText('Troca de tela')

    arrastar(1, 'pendente')
    expect(await screen.findByText('Não é possível retroceder o status de um serviço')).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
  })
})
