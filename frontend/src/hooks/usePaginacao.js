import { useMemo, useState } from 'react'
import { useEstadoPersistido } from './useEstadoPersistido'

// Chave única compartilhada por todas as telas com paginação: a preferência
// de "quantos itens por página" é do usuário, não da tela — se ele prefere
// ver 50 por vez, isso vale em Serviços, Materiais, Clientes e Orçamentos.
const CHAVE_TAMANHO = 'paginacao:tamanhoPagina'

export function usePaginacao(itens, tamanhoInicial = 10) {
  const [pagina, setPagina] = useState(1)
  const [tamanhoPagina, setTamanhoPaginaPersistido] = useEstadoPersistido(CHAVE_TAMANHO, tamanhoInicial)
  const [totalPaginasAnterior, setTotalPaginasAnterior] = useState(1)

  const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanhoPagina))

  if (totalPaginas !== totalPaginasAnterior) {
    setTotalPaginasAnterior(totalPaginas)
    if (pagina > totalPaginas) setPagina(1)
  }

  const itensPagina = useMemo(() => {
    const inicio = (pagina - 1) * tamanhoPagina
    return itens.slice(inicio, inicio + tamanhoPagina)
  }, [itens, pagina, tamanhoPagina])

  const mudarTamanhoPagina = (novoTamanho) => {
    setTamanhoPaginaPersistido(novoTamanho)
    setPagina(1)
  }

  return { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina }
}
