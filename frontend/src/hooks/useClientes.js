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

  return { clientes, carregando, buscar, deletar }
}
