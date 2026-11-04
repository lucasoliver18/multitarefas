import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Orcamentos from '../pages/Orcamentos'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const material = (id, nome, quantidade, preco) => ({ id, nome, unidade_medida: 'un', pivot: { quantidade, preco_unitario_snapshot: preco } })
const ORCAMENTOS = [
  { id: 1, titulo: 'Proposta A', status: 'pendente', margem_lucro: '10', tipo_margem: 'percentual', materiais: [material(5, 'Tinta', '2', '50')] },
  { id: 2, titulo: 'Proposta B', status: 'aprovado', margem_lucro: '20', tipo_margem: 'valor', materiais: [material(6, 'Rolo', '1', '30')] },
]

const montar = () => render(
  <MemoryRouter initialEntries={['/orcamentos/9']}>
    <ToastProvider>
      <Routes><Route path="/orcamentos/:servicoId" element={<Orcamentos />} /></Routes>
    </ToastProvider>
  </MemoryRouter>
)

// Card de um orçamento, a partir do título.
const card = (titulo) => screen.getByText(titulo).closest('div.rounded-2xl')

describe('tela de Orçamentos do serviço', () => {
  beforeEach(() => {
    api.get.mockReset(); api.patch.mockReset(); api.delete.mockReset()
    api.get.mockImplementation(url => Promise.resolve({
      data: url.endsWith('/orcamentos') ? ORCAMENTOS : { id: 9, titulo: 'Pintura', cliente: 'Luciano', status: 'pendente', tag: 'pintura' },
    }))
  })

  it('calcula o total com margem em % e em R$', async () => {
    montar()
    await screen.findByText('Proposta A')
    // 2 × 50 = 100 + 10% = 110
    expect(card('Proposta A')).toHaveTextContent(/R\$\s110,00/)
    expect(card('Proposta A')).toHaveTextContent('Tinta × 2 un')
    // 1 × 30 = 30 + R$ 20 = 50
    expect(card('Proposta B')).toHaveTextContent(/R\$\s50,00/)
  })

  it('aprovar pede confirmação, aprova e oferece pôr o serviço em andamento', async () => {
    api.patch.mockImplementation(url => Promise.resolve({ data: url.startsWith('/servicos') ? { id: 9, status: 'em_andamento' } : {} }))
    montar()
    await screen.findByText('Proposta A')

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    expect(screen.getByText('Aprovar? O estoque será debitado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, aprovar' }))

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/orcamentos/1/aprovar'))
    expect(await screen.findByText('Orçamento aprovado. Mudar serviço para "Em andamento"?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/servicos/9', { status: 'em_andamento' }))
  })

  it('mostra o motivo quando falta estoque para aprovar', async () => {
    api.patch.mockRejectedValue({ response: { status: 422, data: { message: 'Estoque insuficiente para: Tinta.' } } })
    montar()
    await screen.findByText('Proposta A')

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, aprovar' }))
    expect(await screen.findByText('Estoque insuficiente para: Tinta')).toBeInTheDocument()
  })

  it('excluir um aprovado avisa que o estoque volta', async () => {
    api.delete.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Proposta B')

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir orçamento' })[1])
    expect(screen.getByText('Orçamento aprovado. Excluir mesmo assim? O estoque será devolvido')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/orcamentos/2'))
  })
})
