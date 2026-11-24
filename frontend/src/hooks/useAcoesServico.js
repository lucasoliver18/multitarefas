import { useState } from 'react'
import { useToast } from './useToast'
import { mensagemErro } from '../utils/erros'
import { avisoMudancaStatus, perguntarMudancaStatus, retrocedeStatus, MENSAGEM_RETROCEDER } from '../utils/servicos'

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

  const handleMudarStatus = async (id, novoStatus, extras = {}) => {
    try {
      await mudarStatus(id, novoStatus, extras)
      toast.sucesso(extras.pago ? 'Serviço finalizado e marcado como pago' : 'Status atualizado')
    } catch (e) {
      buscar()
      toast.erro(mensagemErro(e, 'Erro ao atualizar status'))
    }
  }

  // Toda mudança de status (menu, arrastar no quadro, modais, Prazos) passa
  // por aqui: mesma regra e mesma confirmação em todas as telas.
  const confirmarMudarStatus = (s, novoStatus) => {
    setMenuStatus(null)
    if (!s || s.status === novoStatus) return
    if (retrocedeStatus(s.status, novoStatus)) {
      toast.erro(MENSAGEM_RETROCEDER)
      return
    }
    const aviso = avisoMudancaStatus({ novoStatus, pago: s.pago, temOrcamentoAprovado: s.tem_orcamento_aprovado })
    perguntarMudancaStatus(toast, aviso, extras => handleMudarStatus(s.id, novoStatus, extras))
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
