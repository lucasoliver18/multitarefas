import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import NovoOrcamento from '../pages/NovoOrcamento'
import EditarOrcamento from '../pages/EditarOrcamento'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() } }))
import api from '../services/api'

const SERVICO = { id: 9, titulo: 'Pintura da sala', cliente: 'Luciano', tag: 'pintura', status: 'pendente' }
const TINTA = { id: 5, nome: 'Tinta Branca', marca: 'Suvinil', unidade_medida: 'L', preco_unitario: '50.00', quantidade_estoque: '1' }

const montar = (url) => render(
  <MemoryRouter initialEntries={[url]}>
    <ToastProvider>
      <Routes>
        <Route path="/orcamentos/:servicoId/novo" element={<NovoOrcamento />} />
        <Route path="/orcamentos/:servicoId/editar/:id" element={<EditarOrcamento />} />
        <Route path="/orcamentos/:servicoId" element={<p>Lista de orçamentos</p>} />
      </Routes>
    </ToastProvider>
  </MemoryRouter>
)
const campo = (nome) => document.querySelector(`[name="${nome}"]`)

describe('novo orçamento', () => {
  beforeEach(() => {
    api.get.mockReset(); api.post.mockReset()
    api.get.mockImplementation((url, { params } = {}) => {
      if (url === '/materiais') return Promise.resolve({ data: { data: [TINTA], meta: { current_page: 1, last_page: 1 }, _params: params } })
      return Promise.resolve({ data: SERVICO })
    })
  })

  it('busca só materiais da tag do serviço, calcula o total e avisa se falta estoque', async () => {
    api.post.mockResolvedValue({ data: {} })
    montar('/orcamentos/9/novo')
    expect(await screen.findByText(/a mesma do serviço/)).toBeInTheDocument()

    fireEvent.change(campo('titulo'), { target: { value: 'Opção A' } })
    fireEvent.focus(screen.getByPlaceholderText('Clique ou digite para buscar um material...'))
    fireEvent.mouseDown(await screen.findByRole('button', { name: /Tinta Branca/ }))
    expect(api.get).toHaveBeenCalledWith('/materiais', { params: expect.objectContaining({ tag: 'pintura' }) })

    fireEvent.change(screen.getByLabelText('Quantidade de Tinta Branca'), { target: { value: '2' } })
    fireEvent.change(campo('margem_lucro'), { target: { value: '10' } })
    // 2 × 50 = 100 + 10% = 110
    expect(screen.getByText('Total').nextSibling).toHaveTextContent(/R\$\s110,00/)

    // Estoque 1, pedido 2: pergunta antes de salvar.
    fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }))
    expect(await screen.findByText('Estoque insuficiente para: Tinta Branca. Salvar mesmo assim?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Lista de orçamentos')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/orcamentos', {
      servico_id: 9, titulo: 'Opção A', descricao: '', margem_lucro: 10, tipo_margem: 'percentual',
      materiais: [{ id: 5, quantidade: 2 }],
    })
  })

  it('descrição limitada a 500 caracteres com contador', async () => {
    montar('/orcamentos/9/novo')
    await screen.findByText(/a mesma do serviço/)
    fireEvent.change(campo('descricao'), { target: { value: 'd'.repeat(700) } })
    expect(campo('descricao')).toHaveValue('d'.repeat(500))
    expect(screen.getByText('500/500')).toBeInTheDocument()
  })

  it('não salva sem título nem com quantidade zero', async () => {
    montar('/orcamentos/9/novo')
    await screen.findByText(/a mesma do serviço/)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }))
    expect(await screen.findByText('Informe o título')).toBeInTheDocument()

    fireEvent.change(campo('titulo'), { target: { value: 'Opção A' } })
    fireEvent.focus(screen.getByPlaceholderText('Clique ou digite para buscar um material...'))
    fireEvent.mouseDown(await screen.findByRole('button', { name: /Tinta Branca/ }))
    fireEvent.change(screen.getByLabelText('Quantidade de Tinta Branca'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }))
    expect(await screen.findByText('Quantidade deve ser maior que zero')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('editar orçamento aprovado', () => {
  it('não acusa falta de estoque pelo que o próprio orçamento já debitou', async () => {
    api.get.mockReset(); api.put.mockReset()
    api.put.mockResolvedValue({ data: {} })
    api.get.mockImplementation(url => {
      // Sobrou 1 em estoque; o orçamento aprovado usa 3 (já debitadas).
      if (url === '/materiais') return Promise.resolve({ data: [TINTA] })
      if (url.startsWith('/orcamentos/')) return Promise.resolve({ data: {
        id: 2, titulo: 'Aprovado', descricao: '', margem_lucro: '0', tipo_margem: 'percentual', status: 'aprovado',
        materiais: [{ id: 5, nome: 'Tinta Branca', unidade_medida: 'L', pivot: { quantidade: '3', preco_unitario_snapshot: '50' } }],
      } })
      return Promise.resolve({ data: SERVICO })
    })
    montar('/orcamentos/9/editar/2')

    await waitFor(() => expect(campo('titulo')).toHaveValue('Aprovado'))
    fireEvent.change(campo('titulo'), { target: { value: 'Aprovado (revisado)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Lista de orçamentos')).toBeInTheDocument()
    expect(screen.queryByText(/Estoque insuficiente/)).not.toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/orcamentos/2', expect.objectContaining({ titulo: 'Aprovado (revisado)', materiais: [{ id: 5, quantidade: 3 }] }))
  })
})
