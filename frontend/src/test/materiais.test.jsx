import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Materiais from '../pages/Materiais'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const MATERIAIS = [
  { id: 1, nome: 'Tinta Branca', marca: 'Suvinil', tags: ['pintura'], unidade_medida: 'L', preco_unitario: '25.00', quantidade_estoque: '10', quantidade_minima: '2' },
  { id: 2, nome: 'Cabo UTP', marca: 'Furukawa', tags: ['informatica'], unidade_medida: 'm', preco_unitario: '3.50', quantidade_estoque: '0', quantidade_minima: null },
  { id: 3, nome: 'Pregos 18mm', marca: null, tags: [], unidade_medida: 'un', preco_unitario: '5.00', quantidade_estoque: '3', quantidade_minima: '5' },
]

const montar = (url = '/materiais') => render(
  <MemoryRouter initialEntries={[url]}>
    <ToastProvider><Materiais /></ToastProvider>
  </MemoryRouter>
)

const visiveis = () => MATERIAIS.map(m => m.nome).filter(n => screen.queryByText(n))

describe('tela de Materiais', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset(); api.delete.mockReset(); api.patch.mockReset()
    api.get.mockResolvedValue({ data: MATERIAIS })
  })

  it('mostra o resumo de estoque e busca pelo nome ou pela marca', async () => {
    montar()
    await screen.findByText('Tinta Branca')
    expect(screen.getByText('1 baixo')).toBeInTheDocument()
    expect(screen.getByText('1 zerado')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Buscar material pelo nome ou marca...'), { target: { value: ' suvinil ' } })
    expect(visiveis()).toEqual(['Tinta Branca'])
  })

  it('"Situação do estoque" fica no painel, aceita as duas opções e conta como filtro', async () => {
    montar()
    await screen.findByText('Tinta Branca')
    expect(screen.queryByRole('button', { name: 'Fora de estoque' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }))

    fireEvent.click(screen.getAllByRole('combobox')[0])
    fireEvent.click(screen.getByRole('option', { name: 'Fora de estoque' }))
    expect(visiveis()).toEqual(['Cabo UTP'])
    expect(screen.getByRole('button', { name: 'Filtros (1)' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('option', { name: 'Estoque baixo' }))
    expect(visiveis()).toEqual(['Cabo UTP', 'Pregos 18mm'])

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(visiveis()).toHaveLength(3)
  })

  it('filtra por tag (inclusive "Sem tag") e por faixa de preço', async () => {
    montar()
    await screen.findByText('Tinta Branca')
    fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }))

    fireEvent.click(screen.getAllByRole('combobox')[1])
    fireEvent.click(screen.getByRole('option', { name: 'Sem tag' }))
    fireEvent.click(screen.getByRole('option', { name: 'Pintura' }))
    fireEvent.keyDown(screen.getAllByRole('combobox')[1], { key: 'Escape' })
    expect(visiveis()).toEqual(['Tinta Branca', 'Pregos 18mm'])

    fireEvent.change(screen.getByText('Preço mín. (R$)').nextSibling, { target: { value: '10' } })
    expect(visiveis()).toEqual(['Tinta Branca'])

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(visiveis()).toHaveLength(3)
  })

  it('link da tela inicial (?foraEstoque=1) já abre filtrado', async () => {
    localStorage.setItem('materiais:busca', JSON.stringify('tinta'))
    montar('/materiais?foraEstoque=1')
    await screen.findByText('Cabo UTP')
    // A busca salva é ignorada: o link mostra todos os que estão sem estoque.
    expect(visiveis()).toEqual(['Cabo UTP'])
    // O painel já abre, mostrando o filtro aplicado.
    expect(screen.getByRole('button', { name: 'Filtros (1)' })).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('Fora de estoque')
  })

  it('exclui um material depois de confirmar', async () => {
    api.delete.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Tinta Branca')

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    const confirmacao = screen.getByRole('button', { name: 'Cancelar' }).parentElement
    fireEvent.click(within(confirmacao).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/materiais/1'))
    expect(screen.queryByText('Tinta Branca')).not.toBeInTheDocument()
    expect(await screen.findByText('Material removido')).toBeInTheDocument()
  })
})
