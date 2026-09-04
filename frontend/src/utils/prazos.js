export const hojeISO = () => {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

export const estaVencido = (servico, hojeStr = hojeISO()) =>
  Boolean(servico.prazo && servico.status !== 'finalizado' && servico.prazo < hojeStr)

/**
 * Confere se uma string "YYYY-MM-DD" é uma data de calendário real (rejeita
 * coisas como 31/09, que o construtor nativo de Date "rola" para o dia
 * seguinte do mês em vez de recusar).
 */
export const dataValida = (str) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (!match) return false
  const [, anoStr, mesStr, diaStr] = match
  const ano = Number(anoStr), mes = Number(mesStr), dia = Number(diaStr)
  const d = new Date(ano, mes - 1, dia)
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
}
