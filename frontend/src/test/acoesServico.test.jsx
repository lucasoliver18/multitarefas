import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { ServicoCardKanban, ServicoLinha, ServicoCardDetalhado } from '../components/servicos/ItensServico'

const servico = {
  id: 9, titulo: 'Troca de tela', cliente: 'Luciano', prioridade: 'alta', status: 'pendente',
  pago: false, prazo: '2020-01-10', tag: 'outros', tem_orcamento: false,
}

const novoCtx = (extra = {}) => ({
  navigate: vi.fn(), hojeStr: '2026-10-30', selecaoAtiva: false,
  menuStatus: null, setMenuStatus: vi.fn(), confirmarMudarStatus: vi.fn(), handleMudarPago: vi.fn(),
  confirmandoId: null, setConfirmandoId: vi.fn(), handleDeletar: vi.fn(),
  ...extra,
})

const VISUALIZACOES = {
  quadro: ctx => <DndContext><ServicoCardKanban s={servico} ctx={ctx} /></DndContext>,
  lista: ctx => <ServicoLinha s={servico} ctx={ctx} />,
  detalhado: ctx => <ServicoCardDetalhado s={servico} ctx={ctx} />,
}

describe.each(Object.entries(VISUALIZACOES))('ações do serviço na visualização %s', (_, montar) => {
  it('oferece editar, anotações, orçamentos e excluir', () => {
    const ctx = novoCtx()
    render(montar(ctx))
    for (const acao of ['Editar', 'Anotações', 'Orçamentos', 'Excluir']) {
      expect(screen.getAllByRole('button', { name: new RegExp(`^${acao}`) }).length).toBeGreaterThan(0)
    }

    fireEvent.click(screen.getAllByRole('button', { name: /^Excluir/ })[0])
    expect(ctx.setConfirmandoId).toHaveBeenCalledWith(9)
    // Clicar numa ação não abre a edição por baixo.
    expect(ctx.navigate).not.toHaveBeenCalled()
  })

  it('confirma a exclusão sem abrir a edição', () => {
    const ctx = novoCtx({ confirmandoId: 9 })
    render(montar(ctx))
    expect(screen.getAllByText(/Excluir/).length).toBeGreaterThan(0)

    const confirmacao = screen.getByRole('button', { name: 'Cancelar' }).parentElement
    fireEvent.click(within(confirmacao).getByRole('button', { name: 'Excluir' }))
    expect(ctx.handleDeletar).toHaveBeenCalledWith(9)
    expect(ctx.navigate).not.toHaveBeenCalled()
  })

  it('clicar no serviço abre a edição e o atraso aparece', () => {
    const ctx = novoCtx()
    render(montar(ctx))
    fireEvent.click(screen.getByText('Troca de tela'))
    expect(ctx.navigate).toHaveBeenCalledWith('/editar/9')
    expect(screen.getByText(/Atrasado/)).toBeInTheDocument()
  })

  it('altera o prazo pelo calendário, só ao confirmar, sem abrir a edição', async () => {
    const handleMudarPrazo = vi.fn().mockResolvedValue(true)
    const ctx = novoCtx({ handleMudarPrazo })
    render(montar(ctx))

    fireEvent.click(screen.getByTitle('Alterar prazo'))
    const calendario = screen.getByRole('dialog', { name: 'Alterar prazo' })
    fireEvent.click(within(calendario).getByRole('button', { name: '15/01/2020' }))
    expect(handleMudarPrazo).not.toHaveBeenCalled()

    fireEvent.click(within(calendario).getByRole('button', { name: 'Confirmar' }))
    expect(handleMudarPrazo).toHaveBeenCalledWith(9, '2020-01-15')
    await screen.findByText('Troca de tela')
    expect(ctx.navigate).not.toHaveBeenCalled()
  })

  it('em modo de seleção o prazo é só texto', () => {
    render(montar(novoCtx({ selecaoAtiva: true, handleMudarPrazo: vi.fn() })))
    expect(screen.queryByTitle('Alterar prazo')).not.toBeInTheDocument()
  })
})
