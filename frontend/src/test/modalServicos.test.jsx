import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import ModalServicos from '../components/servicos/ModalServicos'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const servico = (id) => ({
  id, titulo: `Serviço ${id}`, cliente: 'Luciano', prioridade: 'media', status: 'finalizado',
  pago: true, prazo: '2026-09-01', tag: 'outros', tem_orcamento: true,
})

describe('modal "Ver mais" do quadro', () => {
  it('limpar os filtros mantém o painel na tela e busca sem o período', async () => {
    // Com período: nada; sem período: a lista toda.
    api.get.mockImplementation((_, { params } = {}) =>
      Promise.resolve({ data: params?.prazo_de ? [] : Array.from({ length: 12 }, (_, i) => servico(i + 1)) }))

    render(
      <MemoryRouter>
        <ToastProvider>
          <ModalServicos aberto titulo="Serviços: Finalizado" parametros={{ status: 'finalizado' }}
            filtrosIniciais={{ prazoDe: '2026-11-04', prazoAte: '2026-12-04' }} ocultarFiltros={['status']} onFechar={() => {}} />
        </ToastProvider>
      </MemoryRouter>
    )
    const modal = await screen.findByRole('dialog', { name: 'Serviços: Finalizado' })
    expect(await within(modal).findByText('Nenhum serviço encontrado para estes filtros.')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /Filtros \(2\)/ })).toBeInTheDocument()

    fireEvent.click(within(modal).getByRole('button', { name: 'Limpar filtros' }))

    expect(await within(modal).findByText('Serviço 1')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^Filtros$/ })).toBeInTheDocument()
    expect(within(modal).queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
    expect(api.get).toHaveBeenLastCalledWith('/servicos', { params: { status: 'finalizado' } })
  })
})
