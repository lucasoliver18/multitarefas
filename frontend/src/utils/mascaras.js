export function apenasDigitos(valor) {
  return (valor || '').replace(/\D/g, '')
}

export function mascararTelefone(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11)

  // Sem dígitos o campo fica vazio, para dar para apagar o telefone inteiro.
  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return digitos.replace(/^(\d*)/, '($1')
  if (digitos.length <= 6) return digitos.replace(/^(\d{2})(\d*)/, '($1) $2')
  if (digitos.length <= 10) return digitos.replace(/^(\d{2})(\d{4})(\d*)/, '($1) $2-$3')
  return digitos.replace(/^(\d{2})(\d{5})(\d*)/, '($1) $2-$3')
}

export function mascararCpf(valor) {
  return apenasDigitos(valor)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

// CNPJ alfanumérico (IN RFB nº 2.229/2024): os 12 primeiros caracteres
// aceitam letras (A-Z, sempre maiúsculas) e números; os 2 últimos, que são
// os dígitos verificadores, só aceitam números.
export function caracteresCnpj(valor) {
  const resultado = []
  for (const c of String(valor || '').toUpperCase()) {
    if (resultado.length >= 14) break
    const permitido = resultado.length < 12 ? /[A-Z0-9]/ : /[0-9]/
    if (permitido.test(c)) resultado.push(c)
  }
  return resultado.join('')
}

export function mascararCnpj(valor) {
  const c = caracteresCnpj(valor)
  const separadores = { 2: '.', 5: '.', 8: '/', 12: '-' }
  let mascarado = ''
  for (let i = 0; i < c.length; i++) {
    if (separadores[i]) mascarado += separadores[i]
    mascarado += c[i]
  }
  return mascarado
}

// Mesmo cálculo do backend (App\Rules\CnpjValido): módulo 11 com cada
// caractere valendo seu código ASCII menos 48 ('0'..'9' = 0..9, 'A' = 17...).
export function cnpjValido(valor) {
  const cnpj = String(valor || '').toUpperCase().replace(/[./\-\s]/g, '')
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false

  const calcularDigito = (base, pesos) => {
    const soma = pesos.reduce((acc, peso, i) => acc + (base.charCodeAt(i) - 48) * peso, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const d1 = calcularDigito(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calcularDigito(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return Number(cnpj[12]) === d1 && Number(cnpj[13]) === d2
}
