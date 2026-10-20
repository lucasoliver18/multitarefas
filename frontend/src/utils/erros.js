// Extrai uma mensagem de erro legível de uma resposta de erro do axios/Laravel.
// Erros de validação (422) trazem um objeto `errors` com todos os campos que
// falharam; usamos todas as mensagens (não só a do primeiro campo) para o
// usuário entender exatamente o que precisa corrigir.
export function mensagemErro(e, fallback = 'Ocorreu um erro inesperado. Tente novamente.') {
  const data = e?.response?.data
  if (data?.errors) {
    const todas = Object.values(data.errors).flat()
    if (todas.length) return todas.join(' ')
  }
  return data?.message || fallback
}
