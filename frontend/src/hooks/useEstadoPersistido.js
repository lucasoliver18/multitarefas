import { useState } from 'react'

/**
 * Estado que se comporta como useState, mas persiste em localStorage sob
 * `chave` — usado para o sistema lembrar a última visualização/filtro do
 * usuário em cada tela (kanban x lista, lista x grade, filtros ativos, etc.)
 * e não forçar o usuário a reconfigurar tudo toda vez que volta à tela.
 *
 * `valorUrl`, quando presente (ex: um parâmetro lido da URL de um link
 * profundo como `/servicos?status=em_andamento`), tem prioridade sobre o
 * valor salvo — uma navegação explícita não deve ser ofuscada pelo último
 * estado lembrado.
 */
export function useEstadoPersistido(chave, valorPadrao, valorUrl) {
  const [valor, setValor] = useState(() => {
    if (valorUrl !== undefined && valorUrl !== null && valorUrl !== '') return valorUrl
    try {
      const salvo = localStorage.getItem(chave)
      if (salvo !== null) return JSON.parse(salvo)
    } catch {
      // localStorage indisponível (ex: modo privado) — segue sem persistir
    }
    return valorPadrao
  })

  const atualizar = (novoValor) => {
    setValor(prev => {
      const resolvido = typeof novoValor === 'function' ? novoValor(prev) : novoValor
      try {
        localStorage.setItem(chave, JSON.stringify(resolvido))
      } catch {
        // localStorage indisponível — segue sem persistir
      }
      return resolvido
    })
  }

  return [valor, atualizar]
}
