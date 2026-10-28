// Usado em vez de type="number", que aceita 'e' (notação científica) e não limita casas decimais.
export function sanitizarNumero(valor, decimais = 4) {
  let v = String(valor ?? '').replace(',', '.').replace(/[^0-9.]/g, '')

  const partes = v.split('.')
  if (partes.length > 2) v = partes[0] + '.' + partes.slice(1).join('')

  const [inteiro, decimal] = v.split('.')
  return decimal !== undefined ? `${inteiro}.${decimal.slice(0, decimais)}` : v
}
