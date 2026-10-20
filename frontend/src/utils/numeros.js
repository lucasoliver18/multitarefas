// Sanitiza entrada de campos numéricos digitados como texto: remove qualquer
// caractere que não seja dígito ou separador decimal e limita a quantidade de
// casas decimais. Usado no onChange de inputs type="text" inputMode="decimal"
// em vez de type="number", que no navegador aceita letra ('e' de notação
// científica) e não limita casas decimais.
export function sanitizarNumero(valor, decimais = 4) {
  let v = String(valor ?? '').replace(',', '.').replace(/[^0-9.]/g, '')

  const partes = v.split('.')
  if (partes.length > 2) v = partes[0] + '.' + partes.slice(1).join('')

  const [inteiro, decimal] = v.split('.')
  return decimal !== undefined ? `${inteiro}.${decimal.slice(0, decimais)}` : v
}
