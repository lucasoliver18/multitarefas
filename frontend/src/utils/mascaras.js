export function apenasDigitos(valor) {
  return (valor || '').replace(/\D/g, '')
}

export function mascararTelefone(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11)

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

export function mascararCnpj(valor) {
  return apenasDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})\.(\d{3})(\d)/, '.$1.$2/$3')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
