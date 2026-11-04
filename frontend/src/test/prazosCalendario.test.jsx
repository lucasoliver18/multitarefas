import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Prazos from '../pages/Prazos'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const HOJE = '2026-11-04'
const servico = (id, extra) => ({
  id, titulo: `Serviço ${id}`, cliente: 'Luciano', cliente_id: 1, prioridade: 'media',
  status: 'pendente', pago: false, prazo: null, tag: 'outros', tem_orcamento: false, ...extra,
})

function LocalAtual() {
  const { pathname, search } = useLocation()
  return <p data-testid="local">{pathname + search}</p>
}

const montar = (url = '/prazos') => render(
  <MemoryRouter initialEntries={[url]}>
    <ToastProvider>
      <Routes>
        <Route path="/prazos" element={<Prazos />} />
        <Route path="/servicos" element={<LocalAtual />} />
      </Routes>
    </ToastProvider>
  </MemoryRouter>
)

describe('calendário de Prazos', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${HOJE}T12:00:00`))
    api.get.mockReset()
    api.get.mockResolvedValue({ data: [servico(1, { prazo: '2026-12-15', titulo: 'Entrega dezembro' })] })
  })
  afterEach(() => vi.useRealTimers())

  it('abre no mês atual, navega entre meses e "Hoje" volta para hoje', async () => {
    montar()
    expect(await screen.findByText('Novembro 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /4 de Novembro/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByText('Dezembro 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByText('Outubro 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.getByText('Novembro 2026')).toBeInTheDocument()
  })

  it('"Data específica" leva ao mês e seleciona o dia com os serviços dele', async () => {
    montar()
    await screen.findByText('Novembro 2026')

    fireEvent.change(screen.getByLabelText('Ir para uma data específica'), { target: { value: '15122026' } })
    expect(screen.getByText('Dezembro 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /15 de Dezembro/ })).toBeInTheDocument()
    expect(screen.getAllByText('Entrega dezembro').length).toBeGreaterThan(0)
  })

  it('mostra até 4 prazos vencidos e "Ver todos" leva a Serviços filtrado', async () => {
    api.get.mockResolvedValue({ data: Array.from({ length: 5 }, (_, i) => servico(i + 1, { prazo: `2026-10-0${i + 1}` })) })
    montar()

    expect(await screen.findByText('5 prazos vencidos')).toBeInTheDocument()
    expect(screen.getAllByText(/Venceu em/)).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos os 5 prazos vencidos' }))
    expect(screen.getByTestId('local')).toHaveTextContent('/servicos?vencidos=1')
  })

  it('finalizado com prazo passado não conta como vencido', async () => {
    api.get.mockResolvedValue({ data: [servico(1, { prazo: '2026-10-01', status: 'finalizado' })] })
    montar()
    await screen.findByText('Novembro 2026')
    expect(screen.queryByText(/prazo.? vencido/)).not.toBeInTheDocument()
  })
})
