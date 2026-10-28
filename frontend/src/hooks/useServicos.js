import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

// `params` são filtros aplicados no servidor (ex.: { cliente_id }, { status,
// prazo_de, prazo_ate }); valores vazios são ignorados.
export function useServicos({ params } = {}) {
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)

  const paramsLimpos = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const chaveParams = JSON.stringify(paramsLimpos)

  // Só a primeira carga mostra "Carregando...": as recargas depois de uma
  // ação atualizam a lista em silêncio, sem trocá-la por um aviso (o "piscar").
  const buscar = useCallback(async () => {
    const filtros = JSON.parse(chaveParams)
    try {
      const res = await api.get('/servicos', { params: Object.keys(filtros).length ? filtros : undefined })
      setServicos(Array.isArray(res.data) ? res.data : [])
    } catch {
      // Mantém a lista atual se uma recarga falhar.
    } finally {
      setCarregando(false)
    }
  }, [chaveParams])

  useEffect(() => { buscar() }, [buscar])

  const deletar = useCallback(async (id) => {
    setServicos(prev => prev.filter(s => s.id !== id))
    try {
      await api.delete(`/servicos/${id}`)
    } catch (err) {
      await buscar()
      throw err
    }
  }, [buscar])

  const mudarStatus = useCallback(async (id, novoStatus) => {
    await api.patch(`/servicos/${id}`, { status: novoStatus })
    setServicos(prev => prev.map(s => s.id === id ? { ...s, status: novoStatus } : s))
  }, [])

  const mudarPago = useCallback(async (id, novoPago) => {
    await api.patch(`/servicos/${id}`, { pago: novoPago })
    setServicos(prev => prev.map(s => s.id === id ? { ...s, pago: novoPago } : s))
  }, [])

  return { servicos, carregando, buscar, deletar, mudarStatus, mudarPago }
}
