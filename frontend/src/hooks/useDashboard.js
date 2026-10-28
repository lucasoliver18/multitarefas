import { useEffect, useState } from 'react'
import api from '../services/api'

// Resumo da tela inicial (calculado no servidor). Ao trocar o período, mantém
// os números atuais na tela até chegarem os novos, sem voltar a "Carregando...".
// Respostas de um período já trocado são descartadas.
export function useDashboard(periodo) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true
    api.get('/dashboard', { params: { periodo } })
      .then(res => { if (ativo) { setDados(res.data); setErro(false) } })
      .catch(() => { if (ativo) setErro(true) })
    return () => { ativo = false }
  }, [periodo])

  return { dados, erro }
}
