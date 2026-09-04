import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get('/clientes')
      setClientes(Array.isArray(res.data) ? res.data : [])
    } catch {
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar() }, [buscar])

  const deletar = useCallback(async (id) => {
    setClientes(prev => prev.filter(c => c.id !== id))
    try {
      await api.delete(`/clientes/${id}`)
    } catch (err) {
      await buscar()
      throw err
    }
  }, [buscar])

  const transferirServicos = useCallback(async (clienteId, novoClienteId) => {
    await api.patch(`/clientes/${clienteId}/transferir-servicos`, { novo_cliente_id: novoClienteId })
  }, [])

  return { clientes, carregando, buscar, deletar, transferirServicos }
}

/**
 * Busca paginada/filtrada de clientes, para uso em combobox assíncrono
 * (ComboboxAsync). Função independente do hook para não disparar o fetch
 * completo de useClientes() quando só se precisa buscar sob demanda.
 */
export async function buscarClientesPagina(busca, pagina) {
  const res = await api.get('/clientes', { params: { busca, por_pagina: 20, page: pagina } })
  return {
    itens: res.data.data ?? [],
    temMais: (res.data.meta?.current_page ?? 1) < (res.data.meta?.last_page ?? 1),
  }
}
