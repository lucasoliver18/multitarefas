import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useMateriais() {
  const [materiais, setMateriais] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get('/materiais')
      setMateriais(Array.isArray(res.data) ? res.data : [])
    } catch {
      setMateriais([])
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

  return { materiais, carregando, buscar, deletar }
}

/**
 * Busca paginada/filtrada de materiais, para uso em combobox assíncrono
 * (ComboboxAsync), sem disparar o fetch completo de useMateriais().
 */
export async function buscarMateriaisPagina(busca, pagina) {
  const res = await api.get('/materiais', { params: { busca, por_pagina: 20, page: pagina } })
  return {
    itens: res.data.data ?? [],
    temMais: (res.data.meta?.current_page ?? 1) < (res.data.meta?.last_page ?? 1),
  }
}
