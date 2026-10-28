// A margem de lucro pode ser em porcentagem sobre o custo ou em valor fixo (R$).
export const TIPOS_MARGEM = [
  { val: 'percentual', label: '%' },
  { val: 'valor', label: 'R$' },
]

// Mesmos tetos do backend (LimitesBanco).
export const MARGEM_MAX = { percentual: 999.99, valor: 99999999.99 }

export const formatarPreco = (v) =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function calcularValorFinal(custo, margem, tipo) {
  const m = parseFloat(margem) || 0
  return tipo === 'valor' ? custo + m : custo * (1 + m / 100)
}

export function descreverMargem(margem, tipo) {
  const m = parseFloat(margem) || 0
  return tipo === 'valor' ? formatarPreco(m) : `${m.toLocaleString('pt-BR')}%`
}
