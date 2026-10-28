import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import { useToast } from '../hooks/useToast'
import ModalServicosCliente from '../components/ModalServicosCliente'
import ModalServicos from '../components/servicos/ModalServicos'

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
import api from '../services/api'

describe('avisos não fazem a tela renderizar de novo', () => {
  it('mostrar um toast não re-renderiza quem usa useToast', () => {
    let renders = 0
    function Tela() {
      renders++
      const toast = useToast()
      return <button onClick={() => toast.sucesso('Salvo!')}>avisar</button>
    }

    render(<ToastProvider><Tela /></ToastProvider>)
    const antes = renders
    act(() => { fireEvent.click(screen.getByText('avisar')) })

    expect(screen.getByText('Salvo!')).toBeInTheDocument()
    expect(renders).toBe(antes)
  })
})

const servico = (id, extra = {}) => ({
  id, titulo: `Serviço ${id}`, cliente: 'Maria', cliente_id: 7, prioridade: 'media',
  status: 'pendente', pago: false, prazo: null, tag: null, tem_orcamento: true, ...extra,
})

describe('modal de serviços do cliente', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.get.mockResolvedValue({
      data: [
        ...Array.from({ length: 12 }, (_, i) => servico(i + 1)),
        servico(13, { status: 'finalizado', titulo: 'Pintura finalizada' }),
      ],
    })
    localStorage.clear()
  })

  const abrir = () => render(
    <MemoryRouter>
      <ToastProvider>
        <ModalServicosCliente cliente={{ id: 7, nome: 'Maria' }} onFechar={() => {}} />
      </ToastProvider>
    </MemoryRouter>
  )

  it('busca só os serviços do cliente e pagina a lista', async () => {
    abrir()
    await screen.findByText('Serviço 1')

    expect(api.get).toHaveBeenCalledWith('/servicos', { params: { cliente_id: 7 } })
    expect(screen.getByText('Serviços de Maria')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(screen.getByText('13 registros')).toBeInTheDocument()
  })

  it('modal do quadro busca só o status da coluna e o período informado', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <ModalServicos
            aberto
            chave="pendente"
            titulo="Serviços: Pendente"
            parametros={{ status: 'pendente' }}
            filtrosIniciais={{ prazoDe: '2026-10-26', prazoAte: '2026-11-26' }}
            ocultarFiltros={['status']}
            onFechar={() => {}}
          />
        </ToastProvider>
      </MemoryRouter>
    )
    await screen.findByText(/Prazos de 26\/10\/2026 até 26\/11\/2026/)

    expect(api.get).toHaveBeenCalledWith('/servicos', {
      params: { status: 'pendente', prazo_de: '2026-10-26', prazo_ate: '2026-11-26' },
    })
  })

  it('aplica os mesmos filtros da tela de serviços', async () => {
    abrir()
    await screen.findByText('Serviço 1')

    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'finalizado' } })

    await waitFor(() => expect(screen.getByText('1 registro')).toBeInTheDocument())
    expect(screen.getByText('Pintura finalizada')).toBeInTheDocument()
    expect(screen.queryByText('Serviço 1')).not.toBeInTheDocument()
  })
})
