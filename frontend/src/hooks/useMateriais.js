import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useMateriais() {
  const [materiais, setMateriais] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async () => {
    // Só a primeira carga mostra "Carregando..."; recargas atualizam em silêncio.
    try {
      const res = await api.get('/materiais')
      setMateriais(Array.isArray(res.data) ? res.data : [])
    } catch {
      // Mantém a lista atual se uma recarga falhar.
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar() }, [buscar])

  const deletar = useCallback(async (id) => {
    setMateriais(prev => prev.filter(m => m.id !== id))
    try {
      await api.delete(`/materiais/${id}`)
    } catch (err) {
      await buscar()
      throw err
    }
  }, [buscar])

  const atualizarEstoque = useCallback(async (id, novaQuantidade) => {
    const valor = Math.max(0, novaQuantidade)
    setMateriais(prev => prev.map(m => m.id === id ? { ...m, quantidade_estoque: valor } : m))
    try {
      await api.patch(`/materiais/${id}`, { quantidade_estoque: valor })
    } catch (err) {
      await buscar()
      throw err
    }
  }, [buscar])

  return { materiais, carregando, buscar, deletar, atualizarEstoque }
}

// Separada do hook para buscar sob demanda sem disparar o fetch completo de useMateriais().
// `tag` limita aos materiais daquela tag (ex.: só os de Pintura num serviço de Pintura).
export async function buscarMateriaisPagina(busca, pagina, tag) {
  const res = await api.get('/materiais', { params: { busca, tag: tag || undefined, por_pagina: 20, page: pagina } })
  return {
    itens: res.data.data ?? [],
    temMais: (res.data.meta?.current_page ?? 1) < (res.data.meta?.last_page ?? 1),
  }
}
