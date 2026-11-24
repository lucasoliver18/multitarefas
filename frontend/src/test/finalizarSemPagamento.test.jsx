import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '../components/ToastNotification'
import { useAcoesServico } from '../hooks/useAcoesServico'
import EditarServico from '../pages/EditarServico'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
import api from '../services/api'

// Finalizar um serviço não pago pergunta antes, com a opção de já marcar como pago.

function BotaoFinalizar({ servico, mudarStatus }) {
  const acoes = useAcoesServico({ deletar: vi.fn(), mudarStatus, mudarPago: vi.fn(), buscar: vi.fn() })
  return <button onClick={() => acoes.confirmarMudarStatus(servico, 'finalizado')}>Finalizar</button>
}

const montarAcao = (servico, mudarStatus) => render(
  <ToastProvider><BotaoFinalizar servico={servico} mudarStatus={mudarStatus} /></ToastProvider>
)

describe('mudança rápida para Finalizado', () => {
  const base = { id: 9, status: 'em_andamento', tem_orcamento_aprovado: true }

  it('não pago: avisa e "Só finalizar" finaliza sem mexer no pagamento', async () => {
    const mudarStatus = vi.fn().mockResolvedValue()
    montarAcao({ ...base, pago: false }, mudarStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }))
    expect(screen.getByText('Serviço ainda não está marcado como pago. Finalizar mesmo assim?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Só finalizar' }))

    await waitFor(() => expect(mudarStatus).toHaveBeenCalledWith(9, 'finalizado', {}))
    expect(await screen.findByText('Status atualizado')).toBeInTheDocument()
  })

  it('"Finalizar e marcar como pago" faz as duas coisas na mesma requisição', async () => {
    const mudarStatus = vi.fn().mockResolvedValue()
    montarAcao({ ...base, pago: false }, mudarStatus)

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar e marcar como pago' }))

    await waitFor(() => expect(mudarStatus).toHaveBeenCalledWith(9, 'finalizado', { pago: true }))
    expect(await screen.findByText('Serviço finalizado e marcado como pago')).toBeInTheDocument()
  })

  it('sem orçamento aprovado e não pago: um aviso só, citando os dois', () => {
    montarAcao({ ...base, pago: false, tem_orcamento_aprovado: false }, vi.fn())
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }))
    expect(screen.getByText('Serviço sem orçamento aprovado e ainda não marcado como pago. Finalizar mesmo assim?')).toBeInTheDocument()
  })

  it('já pago: confirmação normal, sem falar de pagamento', () => {
    montarAcao({ ...base, pago: true }, vi.fn())
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }))
    expect(screen.getByText('Mudar status para "Finalizado"?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finalizar e marcar como pago' })).not.toBeInTheDocument()
  })
})

describe('Editar Serviço salvando como Finalizado', () => {
  const SERVICO = { id: 9, titulo: 'Troca de tela', cliente: 'Luciano', cliente_id: 3, prioridade: 'media', status: 'em_andamento', pago: false, prazo: '', tag: '', tem_orcamento_aprovado: true }

  const montarEdicao = (servico = SERVICO) => {
    api.get.mockResolvedValue({ data: servico })
    return render(
      <MemoryRouter initialEntries={['/editar/9']}>
        <ToastProvider>
          <Routes>
            <Route path="/editar/:id" element={<EditarServico />} />
            <Route path="/servicos" element={<p>Lista de serviços</p>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    )
  }
  // O campo de status é o Select do sistema: um botão (combobox) com o rótulo atual.
  const campoStatus = (rotulo) => screen.findAllByRole('combobox').then(cs => {
    const c = cs.find(b => b.textContent.includes(rotulo))
    if (!c) throw new Error(`Status "${rotulo}" não encontrado`)
    return c
  })
  const escolherFinalizado = async () => {
    fireEvent.click(await waitFor(() => campoStatus('Em andamento')))
    fireEvent.click(screen.getByRole('option', { name: 'Finalizado' }))
  }

  beforeEach(() => { api.get.mockReset(); api.put.mockReset(); api.put.mockResolvedValue({ data: {} }) })

  it('não pago: pergunta; "Finalizar e marcar como pago" salva com pago', async () => {
    montarEdicao()
    await escolherFinalizado()
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))

    expect(await screen.findByText('Serviço ainda não está marcado como pago. Finalizar mesmo assim?')).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar e marcar como pago' }))

    expect(await screen.findByText('Lista de serviços')).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/servicos/9', expect.objectContaining({ status: 'finalizado', pago: true }))
  })

  it('"Só finalizar" salva sem marcar como pago', async () => {
    montarEdicao()
    await escolherFinalizado()
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Só finalizar' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/servicos/9', expect.objectContaining({ status: 'finalizado', pago: false })))
  })

  it('sem orçamento aprovado: o aviso cita orçamento e pagamento, como nas outras telas', async () => {
    montarEdicao({ ...SERVICO, tem_orcamento_aprovado: false })
    await escolherFinalizado()
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))
    expect(await screen.findByText('Serviço sem orçamento aprovado e ainda não marcado como pago. Finalizar mesmo assim?')).toBeInTheDocument()
  })

  it('pago e com orçamento: finaliza sem perguntar', async () => {
    montarEdicao({ ...SERVICO, pago: true })
    await escolherFinalizado()
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))
    expect(await screen.findByText('Lista de serviços')).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/servicos/9', expect.objectContaining({ status: 'finalizado' }))
  })

  it('editar um serviço que já estava finalizado não pergunta de novo', async () => {
    montarEdicao({ ...SERVICO, status: 'finalizado' })
    await waitFor(() => campoStatus('Finalizado'))
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }))

    expect(await screen.findByText('Lista de serviços')).toBeInTheDocument()
    expect(screen.queryByText(/ainda não está marcado como pago/)).not.toBeInTheDocument()
  })
})
