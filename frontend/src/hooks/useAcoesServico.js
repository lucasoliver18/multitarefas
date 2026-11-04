import { useState } from 'react'
import { useToast } from './useToast'
import { mensagemErro } from '../utils/erros'
import { labelStatus } from '../utils/status'

// Ações rápidas sobre um serviço (mudar status, pago, prazo, excluir) com as
// confirmações e avisos padrão. Recebe as funções de useServicos(); sem
// `mudarPrazo`, o prazo aparece só como texto (não abre o calendário).
export function useAcoesServico({ deletar, mudarStatus, mudarPago, mudarPrazo, buscar }) {
  const toast = useToast()
  const [menuStatus, setMenuStatus] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)

  const handleDeletar = async (id, { devolverEstoque = false } = {}) => {
    setConfirmandoId(null)
    try {
      await deletar(id, { devolverEstoque })
      toast.sucesso(devolverEstoque ? 'Serviço excluído e estoque devolvido' : 'Serviço excluído')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao excluir serviço'))
    }
  }

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      await mudarStatus(id, novoStatus)
      toast.sucesso('Status atualizado')
    } catch (e) {
      buscar()
      toast.erro(mensagemErro(e, 'Erro ao atualizar status'))
    }
  }

  const confirmarMudarStatus = (s, novoStatus) => {
    setMenuStatus(null)
    const exigeOrcamento = (novoStatus === 'em_andamento' || novoStatus === 'finalizado') && !s.tem_orcamento_aprovado
    const mensagem = exigeOrcamento
      ? `Serviço sem orçamento aprovado. Mudar para "${labelStatus(novoStatus)}" mesmo assim?`
      : `Mudar status para "${labelStatus(novoStatus)}"?`
    toast.confirmar(mensagem, () => handleMudarStatus(s.id, novoStatus))
  }

  const handleMudarPago = async (id, novoPago) => {
    try {
      await mudarPago(id, novoPago)
      toast.sucesso(novoPago ? 'Marcado como pago' : 'Marcado como não pago')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao atualizar pagamento'))
    }
  }

  // Retorna se salvou, para o calendário decidir se fecha.
  const handleMudarPrazo = async (id, novoPrazo) => {
    try {
      await mudarPrazo(id, novoPrazo)
      toast.sucesso(novoPrazo ? 'Prazo atualizado' : 'Prazo removido')
      return true
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao atualizar prazo'))
      return false
    }
  }

  return {
    menuStatus, setMenuStatus,
    confirmandoId, setConfirmandoId,
    handleDeletar, confirmarMudarStatus, handleMudarPago,
    handleMudarPrazo: mudarPrazo ? handleMudarPrazo : undefined,
  }
}
