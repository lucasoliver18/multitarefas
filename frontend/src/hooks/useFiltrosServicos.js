import { useMemo } from 'react'
import { useEstadoPersistido } from './useEstadoPersistido'
import { hojeISO, estaVencido } from '../utils/prazos'

// Estado dos filtros de serviços, compartilhado pela tela de Serviços e pelos
// modais de serviços. Com `prefixo`, os filtros são lembrados entre
// navegações (localStorage); sem ele, valem só enquanto a tela/modal estiver
// aberto. `valoresIniciais` vem de links ou de padrões do modal.
export function useFiltrosServicos({ prefixo = null, valoresIniciais = {} } = {}) {
  const chave = (nome) => (prefixo ? `${prefixo}:${nome}` : null)
  // Chegou por um link com filtros (ex.: da tela inicial): os demais filtros
  // salvos são ignorados, para não esconderem o que o link quer mostrar.
  const opcoes = { ignorarSalvo: Object.values(valoresIniciais).some(Boolean) }

  const [busca, setBusca] = useEstadoPersistido(chave('busca'), '', valoresIniciais.busca, opcoes)
  const [status, setStatus] = useEstadoPersistido(chave('filtroStatus'), '', valoresIniciais.status, opcoes)
  const [prioridade, setPrioridade] = useEstadoPersistido(chave('filtroPrioridade'), '', undefined, opcoes)
  const [tag, setTag] = useEstadoPersistido(chave('filtroTag'), '', undefined, opcoes)
  const [prazoDe, setPrazoDe] = useEstadoPersistido(chave('filtroPrazoDe'), '', valoresIniciais.prazoDe, opcoes)
  const [prazoAte, setPrazoAte] = useEstadoPersistido(chave('filtroPrazoAte'), '', valoresIniciais.prazoAte, opcoes)
  const [situacaoPrazo, setSituacaoPrazo] = useEstadoPersistido(chave('filtroSituacaoPrazo'), '', valoresIniciais.situacaoPrazo, opcoes)
  const [pago, setPago] = useEstadoPersistido(chave('filtroPago'), '', valoresIniciais.pago, opcoes)
  const [orcamento, setOrcamento] = useEstadoPersistido(chave('filtroOrcamento'), '', valoresIniciais.orcamento, opcoes)

  const valores = { status, prioridade, tag, prazoDe, prazoAte, situacaoPrazo, pago, orcamento }
  const setters = {
    status: setStatus, prioridade: setPrioridade, tag: setTag, prazoDe: setPrazoDe,
    prazoAte: setPrazoAte, situacaoPrazo: setSituacaoPrazo, pago: setPago, orcamento: setOrcamento,
  }

  const quantidadeAtiva = Object.values(valores).filter(Boolean).length
  // Muda sempre que um filtro (não a busca) muda; usado para resetar paginação/"carregar mais".
  const chaveFiltros = JSON.stringify(valores)

  const limpar = () => Object.values(setters).forEach(set => set(''))

  return { busca, setBusca, valores, setters, quantidadeAtiva, chaveFiltros, limpar }
}

// Aplica os filtros (estado de useFiltrosServicos) a uma lista de serviços.
export function useServicosFiltrados(servicos, filtros) {
  const { busca } = filtros
  const { status, prioridade, tag, prazoDe, prazoAte, situacaoPrazo, pago, orcamento } = filtros.valores
  const hojeStr = hojeISO()

  return useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return servicos.filter(s => {
      if (termo && !s.titulo.toLowerCase().includes(termo) && !(s.cliente || '').toLowerCase().includes(termo)) return false
      if (situacaoPrazo === 'atrasado' && !estaVencido(s, hojeStr)) return false
      if (situacaoPrazo === 'no_prazo' && estaVencido(s, hojeStr)) return false
      if (status && s.status !== status) return false
      if (prioridade && s.prioridade !== prioridade) return false
      if (tag && s.tag !== tag) return false
      if (pago && String(Number(!!s.pago)) !== pago) return false
      if (orcamento === 'com' && !s.tem_orcamento) return false
      if (orcamento === 'sem' && s.tem_orcamento) return false
      if (orcamento === 'sem_aprovado' && s.tem_orcamento_aprovado) return false
      if (orcamento === 'pendente' && !s.tem_orcamento_pendente) return false
      if (prazoDe || prazoAte) {
        if (!s.prazo) return false
        if (prazoDe && s.prazo < prazoDe) return false
        if (prazoAte && s.prazo > prazoAte) return false
      }
      return true
    })
  }, [servicos, busca, situacaoPrazo, hojeStr, status, prioridade, tag, pago, orcamento, prazoDe, prazoAte])
}
