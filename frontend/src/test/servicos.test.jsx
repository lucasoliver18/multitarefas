import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import Servicos from '../pages/Servicos'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '../services/api'

const HOJE = '2026-11-04'
const servico = (id, titulo, extra) => ({
  id, titulo, cliente: 'Luciano', cliente_id: 1, prioridade: 'media', status: 'pendente',
  pago: false, prazo: null, tag: null, tem_orcamento: false, ...extra,
})
const SERVICOS = [
  servico(1, 'Sem prazo aberto'),
  servico(2, 'Atrasado', { prazo: '2026-10-01' }),
  servico(3, 'No prazo', { prazo: '2026-12-01', status: 'em_andamento' }),
  servico(4, 'Finalizado sem prazo', { status: 'finalizado' }),
]
const TITULOS = SERVICOS.map(s => s.titulo)

const montar = (url = '/servicos') => render(
  <MemoryRouter initialEntries={[url]}>
    <ToastProvider><Servicos /></ToastProvider>
  </MemoryRouter>
)
const visiveis = () => TITULOS.filter(t => screen.queryByText(t))

describe('tela de Serviços', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${HOJE}T12:00:00`))
    api.get.mockReset(); api.delete.mockReset(); api.patch.mockReset()
    api.get.mockResolvedValue({ data: SERVICOS })
  })
  afterEach(() => vi.useRealTimers())

  it('mostra os serviços nas colunas do quadro', async () => {
    montar()
    await screen.findByText('Atrasado')
    expect(visiveis()).toEqual(TITULOS)
    expect(screen.getByText('Atrasado · 01/10/2026')).toBeInTheDocument()
  })

  it('link "sem prazo" (Prazos → Ver mais) mostra só os abertos sem prazo, com aviso', async () => {
    montar('/servicos?semprazo=1')
    await screen.findByText('Sem prazo aberto')
    expect(screen.getByText('Mostrando apenas serviços sem prazo definido')).toBeInTheDocument()
    expect(visiveis()).toEqual(['Sem prazo aberto'])

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos os serviços' }))
    expect(visiveis()).toEqual(TITULOS)
    expect(screen.queryByText('Mostrando apenas serviços sem prazo definido')).not.toBeInTheDocument()
  })

  it('link de vencidos mostra só os atrasados', async () => {
    montar('/servicos?vencidos=1')
    await screen.findByText('Atrasado')
    expect(screen.getByText('Mostrando apenas serviços em atraso')).toBeInTheDocument()
    expect(visiveis()).toEqual(['Atrasado'])
  })

  it('busca pelo título ou pelo cliente', async () => {
    montar()
    await screen.findByText('Atrasado')
    fireEvent.change(screen.getByPlaceholderText('Buscar serviço pelo título ou cliente...'), { target: { value: ' prazo ' } })
    expect(visiveis()).toEqual(['Sem prazo aberto', 'No prazo', 'Finalizado sem prazo'])
  })

  it('a visualização escolhida fica lembrada', async () => {
    const { unmount } = montar()
    await screen.findByText('Atrasado')
    fireEvent.click(screen.getByRole('button', { name: /Lista/ }))
    expect(screen.getByText('Serviço', { selector: 'span' })).toBeInTheDocument()
    unmount()

    montar()
    await screen.findByText('No prazo')
    expect(screen.getByText('Serviço', { selector: 'span' })).toBeInTheDocument()
  })

  it('exclui vários serviços selecionados depois de confirmar', async () => {
    api.delete.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Atrasado')

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar' }))
    fireEvent.click(screen.getByText('Atrasado'))
    fireEvent.click(screen.getByText('No prazo'))
    expect(screen.getByText('2 selecionados')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir selecionados' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledTimes(2))
    expect(api.delete).toHaveBeenCalledWith('/servicos/2')
    expect(api.delete).toHaveBeenCalledWith('/servicos/3')
    expect(await screen.findByText('2 serviços excluídos')).toBeInTheDocument()
    expect(visiveis()).toEqual(['Sem prazo aberto', 'Finalizado sem prazo'])
  })
})
