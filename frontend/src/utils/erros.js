const ERRO_GENERICO = 'Erro inesperado. Tente novamente.'
const ERRO_CONEXAO = 'Sem conexão com o servidor.'

// Monta a mensagem para o usuário a partir de um erro da API. Só repassa o
// texto do backend em erros de regra/validação (4xx), que são mensagens
// pensadas para o usuário; falhas internas (5xx) e de rede viram mensagens
// genéricas, sem nenhum detalhe técnico.
export function mensagemErro(e, fallback = ERRO_GENERICO) {
  if (!e?.response) return e?.request ? ERRO_CONEXAO : fallback

  const { status, data } = e.response
  if (status >= 500) return ERRO_GENERICO

  if (data?.errors && typeof data.errors === 'object') {
    const todas = Object.values(data.errors).flat().filter(m => typeof m === 'string')
    if (todas.length) return todas.join(' ')
  }

  return typeof data?.message === 'string' && data.message ? data.message : fallback
}
