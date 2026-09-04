import { useState } from 'react'

/**
 * Alterna e persiste (localStorage) uma preferência simples de visualização,
 * como o modo lista/detalhado de uma tela.
 */
export function usePreferenciaVisualizacao(chave, valorPadrao) {
  const [modo, setModo] = useState(() => localStorage.getItem(chave) || valorPadrao)

  const definirModo = (novoModo) => {
    setModo(novoModo)
    localStorage.setItem(chave, novoModo)
  }

  return [modo, definirModo]
}
