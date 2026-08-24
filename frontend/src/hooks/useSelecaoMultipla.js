import { useState } from 'react'

export function useSelecaoMultipla() {
  const [ativo, setAtivo] = useState(false)
  const [selecionados, setSelecionados] = useState(new Set())

  const alternarModo = () => {
    setAtivo(a => !a)
    setSelecionados(new Set())
  }

  const alternarItem = (id) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const cancelar = () => {
    setAtivo(false)
    setSelecionados(new Set())
  }

  return { ativo, selecionados, alternarModo, alternarItem, cancelar, quantidade: selecionados.size }
}
