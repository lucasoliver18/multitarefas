import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePaginacao } from '../hooks/usePaginacao'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'

const itens = (n) => Array.from({ length: n }, (_, i) => i + 1)

describe('paginação', () => {
  beforeEach(() => localStorage.clear())

  it('divide em páginas e volta à primeira quando a lista filtrada encolhe', () => {
    const { result, rerender } = renderHook(({ lista }) => usePaginacao(lista), { initialProps: { lista: itens(25) } })
    expect(result.current.totalPaginas).toBe(3)
    expect(result.current.itensPagina).toEqual(itens(10))

    act(() => result.current.setPagina(3))
    expect(result.current.itensPagina).toEqual([21, 22, 23, 24, 25])

    // Um filtro deixou só 4 itens: a página 3 não existe mais.
    rerender({ lista: itens(4) })
    expect(result.current.pagina).toBe(1)
    expect(result.current.itensPagina).toEqual(itens(4))
  })

  it('itens por página valem para todas as telas e são lembrados', () => {
    const { result } = renderHook(() => usePaginacao(itens(30)))
    act(() => result.current.setPagina(2))
    act(() => result.current.mudarTamanhoPagina(20))
    expect(result.current.pagina).toBe(1)
    expect(result.current.totalPaginas).toBe(2)

    const outraTela = renderHook(() => usePaginacao(itens(30)))
    expect(outraTela.result.current.tamanhoPagina).toBe(20)
  })
})

describe('estado lembrado entre navegações', () => {
  beforeEach(() => localStorage.clear())

  it('guarda o valor e o recupera na próxima visita', () => {
    const primeira = renderHook(() => useEstadoPersistido('teste:filtro', []))
    act(() => primeira.result.current[1](['pintura']))
    expect(renderHook(() => useEstadoPersistido('teste:filtro', [])).result.current[0]).toEqual(['pintura'])
  })

  it('valor vindo de link tem prioridade; com ignorarSalvo usa o padrão', () => {
    localStorage.setItem('teste:filtro', JSON.stringify('salvo'))
    expect(renderHook(() => useEstadoPersistido('teste:filtro', '', 'do-link')).result.current[0]).toBe('do-link')
    expect(renderHook(() => useEstadoPersistido('teste:filtro', 'padrao', undefined, { ignorarSalvo: true })).result.current[0]).toBe('padrao')
  })

  it('valor salvo corrompido não quebra a tela', () => {
    localStorage.setItem('teste:filtro', '{quebrado')
    expect(renderHook(() => useEstadoPersistido('teste:filtro', 'padrao')).result.current[0]).toBe('padrao')
  })
})
