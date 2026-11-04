import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Clientes from '../pages/Clientes'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const CLIENTES = [
  { id: 1, nome: 'Ana Lima', tipo_pessoa: 'fisica', cpf: '123.576.159-23', servicos_count: 2 },
  { id: 2, nome: 'Bruno Ltda', tipo_pessoa: 'juridica', cnpj: '54.742.524/0001-87', servicos_count: 0 },
  { id: 3, nome: 'Carla Souza', tipo_pessoa: 'fisica', cpf: '199.486.060-00', servicos_count: 0 },
]

const montar = () => render(
  <MemoryRouter>
    <ToastProvider><Clientes /></ToastProvider>
  </MemoryRouter>
)

// Escolhe uma opção num dos Select do painel de filtros (pela ordem na tela).
const escolher = (indice, opcao) => {
  fireEvent.click(screen.getAllByRole('combobox')[indice])
  fireEvent.click(screen.getByRole('option', { name: opcao }))
}

describe('tela de Clientes', () => {
  beforeEach(() => {
    localStorage.clear()
    api.get.mockReset(); api.patch.mockReset(); api.delete.mockReset()
    api.get.mockImplementation((url, { params } = {}) => {
      // Busca paginada do campo de transferência.
      if (params?.por_pagina) {
        const termo = (params.busca || '').toLowerCase()
        return Promise.resolve({ data: { data: CLIENTES.filter(c => c.nome.toLowerCase().includes(termo)), meta: { current_page: 1, last_page: 1 } } })
      }
      return Promise.resolve({ data: CLIENTES })
    })
  })

  it('busca pelo nome, ignorando maiúsculas e espaços nas pontas', async () => {
    montar()
    await screen.findByText('Ana Lima')

    fireEvent.change(screen.getByPlaceholderText('Buscar cliente pelo nome...'), { target: { value: '  ana ' } })
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Ltda')).not.toBeInTheDocument()
  })

  it('filtra por tipo de pessoa e por serviços vinculados, e limpa os filtros', async () => {
    montar()
    await screen.findByText('Ana Lima')
    fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }))

    escolher(0, 'Pessoa Física')
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Carla Souza')).toBeInTheDocument()
    expect(screen.queryByText('Bruno Ltda')).not.toBeInTheDocument()

    escolher(1, 'Sem serviços')
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
    expect(screen.getByText('Carla Souza')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtros (2)' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    for (const nome of ['Ana Lima', 'Bruno Ltda', 'Carla Souza']) expect(screen.getByText(nome)).toBeInTheDocument()
  })

  it('cliente com serviços: pede outro cliente, transfere e só então exclui', async () => {
    api.delete
      .mockRejectedValueOnce({ response: { status: 422, data: { servicos_count: 2, message: 'Cliente com 2 serviços vinculados.' } } })
      .mockResolvedValueOnce({ data: {} })
    api.patch.mockResolvedValue({ data: { transferidos: 2 } })
    montar()
    await screen.findByText('Ana Lima')

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0])
    const confirmacao = screen.getByRole('button', { name: 'Cancelar' }).parentElement
    fireEvent.click(within(confirmacao).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText(/Este cliente tem 2 serviços vinculados/)).toBeInTheDocument()
    const transferir = screen.getByRole('button', { name: 'Transferir e excluir' })
    expect(transferir).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Buscar cliente...'), { target: { value: 'Bru' } })
    fireEvent.mouseDown(await screen.findByRole('button', { name: 'Bruno Ltda' }))
    await waitFor(() => expect(transferir).toBeEnabled())

    fireEvent.click(transferir)
    await waitFor(() => expect(api.delete).toHaveBeenCalledTimes(2))
    expect(api.patch).toHaveBeenCalledWith('/clientes/1/transferir-servicos', { novo_cliente_id: 2 })
    expect(await screen.findByText('Serviços transferidos e cliente removido')).toBeInTheDocument()
  })
})
