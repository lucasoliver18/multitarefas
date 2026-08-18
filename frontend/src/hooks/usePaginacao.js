import { useMemo, useState } from 'react'

export function usePaginacao(itens, tamanhoInicial = 10) {
  const [pagina, setPagina] = useState(1)
  const [tamanhoPagina, setTamanhoPagina] = useState(tamanhoInicial)
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
    setTamanhoPagina(novoTamanho)
    setPagina(1)
  }

  return { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina }
}
