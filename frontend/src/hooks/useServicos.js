import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useServicos() {
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get('/servicos')
      setServicos(Array.isArray(res.data) ? res.data : [])
    } catch {
      setServicos([])
    } finally {
      setCarregando(false)
    }
  }, [])

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

  return { servicos, carregando, buscar, deletar, mudarStatus }
}
