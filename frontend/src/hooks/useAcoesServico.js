import { useState } from 'react'
import { useToast } from './useToast'
import { mensagemErro } from '../utils/erros'
import { labelStatus } from '../utils/status'

// Ações rápidas sobre um serviço (mudar status, pago, excluir) com as
// confirmações e avisos padrão. Recebe as funções de useServicos().
export function useAcoesServico({ deletar, mudarStatus, mudarPago, buscar }) {
  const toast = useToast()
  const [menuStatus, setMenuStatus] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)

  const handleDeletar = async (id) => {
    setConfirmandoId(null)
    try {
      await deletar(id)
      toast.sucesso('Serviço excluído')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao excluir serviço.'))
    }
  }

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      await mudarStatus(id, novoStatus)
      toast.sucesso('Status atualizado')
    } catch (e) {
      buscar()
      toast.erro(mensagemErro(e, 'Erro ao atualizar status.'))
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
      toast.erro(mensagemErro(e, 'Erro ao atualizar pagamento.'))
    }
  }

  return {
    menuStatus, setMenuStatus,
    confirmandoId, setConfirmandoId,
    handleDeletar, confirmarMudarStatus, handleMudarPago,
  }
}
