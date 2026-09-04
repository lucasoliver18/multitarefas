import { useCallback, useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 300

/**
 * Hook headless para um combobox com busca server-side e paginação incremental
 * (infinite scroll). `buscarPagina(query, pagina)` deve retornar `{ itens, temMais }`.
 */
export function useComboboxAssincrono({ buscarPagina, minCaracteres = 1 }) {
  const [query, setQuery] = useState('')
  const [itens, setItens] = useState([])
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [aberto, setAberto] = useState(false)

  const debounceRef = useRef(null)
  const requisicaoAtual = useRef(0)

  const executarBusca = useCallback((termo, paginaAlvo) => {
    const idRequisicao = ++requisicaoAtual.current
    const setLoadingFlag = paginaAlvo === 1 ? setCarregando : setCarregandoMais
    setLoadingFlag(true)

    buscarPagina(termo, paginaAlvo)
      .then(({ itens: novosItens, temMais: proximaTemMais }) => {
        if (idRequisicao !== requisicaoAtual.current) return
        setItens(prev => (paginaAlvo === 1 ? novosItens : [...prev, ...novosItens]))
        setTemMais(proximaTemMais)
        setPagina(paginaAlvo)
      })
      .finally(() => {
        if (idRequisicao !== requisicaoAtual.current) return
        setLoadingFlag(false)
      })
  }, [buscarPagina])

  useEffect(() => {
    if (query.trim().length < minCaracteres) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => executarBusca(query, 1), DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
  }, [query, minCaracteres, executarBusca])

  const alterarQuery = useCallback((novoValor) => {
    setQuery(novoValor)
    if (novoValor.trim().length < minCaracteres) {
      requisicaoAtual.current++
      setItens([])
      setTemMais(false)
      setCarregando(false)
    }
  }, [minCaracteres])

  const carregarMais = useCallback(() => {
    if (carregando || carregandoMais || !temMais) return
    executarBusca(query, pagina + 1)
  }, [carregando, carregandoMais, temMais, query, pagina, executarBusca])

  const reset = useCallback(() => {
    requisicaoAtual.current++
    setQuery('')
    setItens([])
    setPagina(1)
    setTemMais(false)
    setAberto(false)
  }, [])

  return {
    query, setQuery: alterarQuery,
    itens,
    carregando, carregandoMais, temMais,
    aberto, setAberto,
    carregarMais,
    reset,
  }
}
