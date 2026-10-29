import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Prazos from '../pages/Prazos'

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
import api from '../services/api'

const DIA = '2026-10-30'
const servico = (id) => ({
  id, titulo: `TESTE ${id}`, cliente: 'Luciano', cliente_id: 1, prioridade: 'alta',
  status: 'pendente', pago: false, prazo: DIA, tag: 'outros', tem_orcamento: false,
})

const abrir = (quantidade) => {
  api.get.mockResolvedValue({ data: Array.from({ length: quantidade }, (_, i) => servico(i + 1)) })
  render(
    <MemoryRouter initialEntries={[`/prazos?data=${DIA}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/prazos" element={<Prazos />} />
          <Route path="/editar/:id" element={<p>Editando serviço</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  )
}

describe('serviços do dia na tela de Prazos', () => {
  beforeEach(() => api.get.mockReset())

  it('mostra até 4 serviços sem "Ver mais"', async () => {
    abrir(4)
    expect(await screen.findByText('TESTE 4')).toBeInTheDocument()
    expect(screen.queryByText(/Ver mais/)).not.toBeInTheDocument()
  })

  it('limita a 4 e abre o modal com todos os serviços do dia', async () => {
    abrir(6)
    await screen.findByText('TESTE 1')
    expect(screen.queryByText('TESTE 5')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais (2)' }))

    const modal = screen.getByRole('dialog', { name: 'Serviços de 30 de Outubro de 2026' })
    expect(within(modal).getByText('6 serviços · Clique em um serviço para editá-lo')).toBeInTheDocument()
    for (let i = 1; i <= 6; i++) expect(within(modal).getByText(`TESTE ${i}`)).toBeInTheDocument()
    // Todos são do mesmo dia: a coluna de prazo não aparece.
    expect(within(modal).queryByText('Prazo')).not.toBeInTheDocument()
    expect(within(modal).queryByText('30/10/2026')).not.toBeInTheDocument()

    fireEvent.click(within(modal).getByText('TESTE 6'))
    expect(screen.getByText('Editando serviço')).toBeInTheDocument()
  })

  it('o menu de status do modal abre fora da área com rolagem e não abre a edição', async () => {
    abrir(6)
    await screen.findByText('TESTE 1')
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais (2)' }))
    const modal = screen.getByRole('dialog', { name: 'Serviços de 30 de Outubro de 2026' })

    fireEvent.click(within(modal).getAllByTitle('Alterar status')[0])
    // O último: a tela também tem o filtro "Em andamento"; o menu fica no fim do body.
    const opcao = screen.getAllByRole('button', { name: 'Em andamento' }).at(-1)
    // Renderizado no body (portal), fora do corpo do modal que rola e cortava o menu.
    expect(modal).not.toContainElement(opcao)

    fireEvent.click(opcao)
    expect(screen.queryByText('Editando serviço')).not.toBeInTheDocument()
    expect(await screen.findByText(/Mudar .*para "Em andamento"/)).toBeInTheDocument()
  })
})
