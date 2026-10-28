import { useState } from 'react'

// useState persistido em localStorage. `valorUrl` (ex.: parâmetro de um link)
// tem prioridade sobre o valor salvo. Com `ignorarSalvo`, começa do padrão
// (ou do valorUrl) mesmo havendo valor salvo — usado quando se chega por um
// link que define os filtros. Com `chave` nula, funciona como um useState
// comum (sem salvar nada).
export function useEstadoPersistido(chave, valorPadrao, valorUrl, { ignorarSalvo = false } = {}) {
  const [valor, setValor] = useState(() => {
    if (valorUrl !== undefined && valorUrl !== null && valorUrl !== '') return valorUrl
    if (!chave || ignorarSalvo) return valorPadrao
    try {
      const salvo = localStorage.getItem(chave)
      if (salvo !== null) return JSON.parse(salvo)
    } catch {
      // localStorage indisponível (ex: modo privado)
    }
    return valorPadrao
  })

  const atualizar = (novoValor) => {
    setValor(prev => {
      const resolvido = typeof novoValor === 'function' ? novoValor(prev) : novoValor
      if (chave) {
        try {
          localStorage.setItem(chave, JSON.stringify(resolvido))
        } catch {
          // localStorage indisponível
        }
      }
      return resolvido
    })
  }

  return [valor, atualizar]
}
