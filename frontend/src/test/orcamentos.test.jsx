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
    // Proposta B já está aprovada: aprovar a A avisa que a B será reprovada.
    expect(screen.getByText('Aprovar? O estoque será debitado. O orçamento aprovado atual será reprovado')).toBeInTheDocument()
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

  it('reprovado pode ser aprovado; sem materiais mostra o indicativo em vez de R$ 0,00', async () => {
    const lista = [
      { id: 3, titulo: 'Proposta C', status: 'reprovado', margem_lucro: '10', tipo_margem: 'percentual', sem_materiais: false, materiais: [material(5, 'Tinta', '1', '50')] },
      { id: 4, titulo: 'Só mão de obra', status: 'aprovado', margem_lucro: '350', tipo_margem: 'valor', sem_materiais: true, materiais: [] },
    ]
    api.get.mockImplementation(url => Promise.resolve({
      data: url.endsWith('/orcamentos') ? lista : { id: 9, titulo: 'Pintura', cliente: 'Luciano', status: 'em_andamento', tag: 'pintura' },
    }))
    api.patch.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Proposta C')

    const semMat = card('Só mão de obra')
    expect(semMat).toHaveTextContent('Não utiliza')
    expect(semMat).toHaveTextContent('Orçamento sem materiais')
    expect(semMat).toHaveTextContent('Valor do serviço')
    expect(semMat).not.toHaveTextContent(/R\$\s0,00/)
    expect(semMat).toHaveTextContent(/R\$\s350,00/)

    // Reprovado tem "Aprovar" (e não "Reprovar"); aprovado tem só "Reprovar".
    expect(screen.getAllByRole('button', { name: 'Aprovar' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Reprovar' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, aprovar' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/orcamentos/3/aprovar'))
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

  it('material excluído aparece destacado e "Aprovar" explica o bloqueio sem chamar o servidor', async () => {
    const lista = [{
      id: 7, titulo: 'Com excluído', status: 'pendente', margem_lucro: '0', tipo_margem: 'percentual', sem_materiais: false,
      materiais: [{ ...material(5, 'Tinta Azul', '2', '50'), excluido: true }, { ...material(6, 'Rolo', '1', '30'), excluido: false }],
    }]
    api.get.mockImplementation(url => Promise.resolve({
      data: url.endsWith('/orcamentos') ? lista : { id: 9, titulo: 'Pintura', cliente: 'Luciano', status: 'pendente', tag: 'pintura' },
    }))
    montar()
    await screen.findByText('Com excluído')

    expect(card('Com excluído')).toHaveTextContent('Tinta Azul × 2 un (excluído)')
    expect(card('Com excluído')).not.toHaveTextContent('Rolo × 1 un (excluído)')

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    expect(await screen.findByText('Não é possível aprovar: o material "Tinta Azul" foi excluído do cadastro. Edite o orçamento e remova-o')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sim, aprovar' })).not.toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
  })
})
