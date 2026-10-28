export const hojeISO = () => {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

export const estaVencido = (servico, hojeStr = hojeISO()) =>
  Boolean(servico.prazo && servico.status !== 'finalizado' && servico.prazo < hojeStr)

// Rejeita datas inexistentes como 31/09, que o Date nativo "rola" para o mês seguinte.
export const dataValida = (str) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (!match) return false
  const [, anoStr, mesStr, diaStr] = match
  const ano = Number(anoStr), mes = Number(mesStr), dia = Number(diaStr)
  const d = new Date(ano, mes - 1, dia)
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
}
