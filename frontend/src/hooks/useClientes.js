import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async () => {
    // Só a primeira carga mostra "Carregando..."; recargas atualizam em silêncio.
    try {
      const res = await api.get('/clientes')
      setClientes(Array.isArray(res.data) ? res.data : [])
    } catch {
      // Mantém a lista atual se uma recarga falhar.
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

// Separada do hook para buscar sob demanda sem disparar o fetch completo de useClientes().
export async function buscarClientesPagina(busca, pagina) {
  const res = await api.get('/clientes', { params: { busca, por_pagina: 20, page: pagina } })
  return {
    itens: res.data.data ?? [],
    temMais: (res.data.meta?.current_page ?? 1) < (res.data.meta?.last_page ?? 1),
  }
}
