import { useMemo } from 'react'
import { PESO_PRIORIDADE } from '../utils/status'

const PESO_STATUS = { em_andamento: 0, pendente: 1, finalizado: 2 }

// Ordem: prioridade, depois status, depois prazo mais próximo (sem prazo por último).
export function useServicosOrdenados(servicos) {
  return useMemo(() => [...servicos].sort((a, b) => {
    const prioA = PESO_PRIORIDADE[a.prioridade] ?? 1
    const prioB = PESO_PRIORIDADE[b.prioridade] ?? 1
    if (prioA !== prioB) return prioA - prioB
    const pesoA = PESO_STATUS[a.status] ?? 1
    const pesoB = PESO_STATUS[b.status] ?? 1
    if (pesoA !== pesoB) return pesoA - pesoB
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0
  }), [servicos])
}
