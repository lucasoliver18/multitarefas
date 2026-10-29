import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFiltrosServicos, useServicosFiltrados } from '../hooks/useFiltrosServicos'

const servicos = [
  { id: 1, titulo: 'A', cliente: '', tag: 'informatica', status: 'pendente', prioridade: 'alta', tem_orcamento: false },
  { id: 2, titulo: 'B', cliente: '', tag: 'pintura', status: 'em_andamento', prioridade: 'media', tem_orcamento: true, tem_orcamento_pendente: true },
  { id: 3, titulo: 'C', cliente: '', tag: 'outros', status: 'finalizado', prioridade: 'baixa', tem_orcamento: true, tem_orcamento_aprovado: true },
]

const usar = (valoresIniciais) => renderHook(() => {
  const filtros = useFiltrosServicos({ prefixo: 'teste', valoresIniciais })
  return { filtros, filtrados: useServicosFiltrados(servicos, filtros) }
})

describe('filtro de tag de serviços com várias opções', () => {
  beforeEach(() => localStorage.clear())

  it('começa com todas e filtra só pelas tags marcadas', () => {
    const { result } = usar()
    expect(result.current.filtros.valores.tag).toEqual([])
    expect(result.current.filtrados).toHaveLength(3)

    act(() => result.current.filtros.setters.tag(['informatica', 'outros']))
    expect(result.current.filtrados.map(s => s.id)).toEqual([1, 3])
    expect(result.current.filtros.quantidadeAtiva).toBe(1)
  })

  it('"Limpar filtros" volta para todas', () => {
    const { result } = usar()
    act(() => result.current.filtros.setters.tag(['pintura']))
    act(() => result.current.filtros.limpar())
    expect(result.current.filtros.valores.tag).toEqual([])
    expect(result.current.filtros.quantidadeAtiva).toBe(0)
    expect(result.current.filtrados).toHaveLength(3)
  })

  it('status, prioridade e orçamento também aceitam várias opções', () => {
    const { result } = usar()
    act(() => result.current.filtros.setters.status(['pendente', 'finalizado']))
    expect(result.current.filtrados.map(s => s.id)).toEqual([1, 3])

    act(() => result.current.filtros.setters.prioridade(['alta', 'media']))
    expect(result.current.filtrados.map(s => s.id)).toEqual([1])

    act(() => { result.current.filtros.limpar() })
    // Orçamento: entra quem atende a qualquer uma das situações marcadas.
    act(() => result.current.filtros.setters.orcamento(['sem', 'pendente']))
    expect(result.current.filtrados.map(s => s.id)).toEqual([1, 2])
    expect(result.current.filtros.quantidadeAtiva).toBe(1)
  })

  it('links com um valor só (ex.: da tela inicial) viram uma lista', () => {
    const { result } = usar({ status: 'em_andamento', orcamento: 'pendente' })
    expect(result.current.filtros.valores.status).toEqual(['em_andamento'])
    expect(result.current.filtros.valores.orcamento).toEqual(['pendente'])
    expect(result.current.filtrados.map(s => s.id)).toEqual([2])
  })
})
