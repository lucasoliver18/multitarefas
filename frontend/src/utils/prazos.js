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

// Aritmética de datas ISO (aaaa-mm-dd), usada pelo calendário do sistema.
export const paraIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const deIso = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d) }
export const somarDias = (iso, n) => { const d = deIso(iso); d.setDate(d.getDate() + n); return paraIso(d) }
// Mantém o dia, limitado ao último dia do mês de destino (31/01 + 1 mês = 28/02).
export const somarMeses = (iso, n) => {
  const d = deIso(iso)
  const alvo = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  alvo.setDate(Math.min(d.getDate(), ultimo))
  return paraIso(alvo)
}

export const isoParaBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
