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

// Só orçamento com materiais mexe no estoque (aprovar debita; reprovar e
// excluir um aprovado devolvem).
export const usaMateriais = (o) => !o.sem_materiais && (o.materiais || []).length > 0

// Textos das confirmações, iguais na lista de orçamentos e na edição.
// `outroAprovado`: o serviço já tem outro orçamento aprovado, que será reprovado.
export function mensagemAprovar(o, outroAprovado = false) {
  const base = usaMateriais(o) ? 'Aprovar? O estoque será debitado.' : 'Aprovar este orçamento?'
  return outroAprovado ? `${base} O orçamento aprovado atual será reprovado` : base.replace(/\.$/, '')
}

export function mensagemReprovar(o) {
  return o.status === 'aprovado' && usaMateriais(o)
    ? 'Reprovar? O estoque será devolvido'
    : 'Reprovar este orçamento?'
}

export function mensagemExcluir(o) {
  if (o.status !== 'aprovado') return 'Excluir este orçamento?'
  return usaMateriais(o)
    ? 'Orçamento aprovado. Excluir mesmo assim? O estoque será devolvido'
    : 'Orçamento aprovado. Excluir mesmo assim?'
}

// Materiais do orçamento que foram excluídos do cadastro. Enquanto houver
// algum, o orçamento não pode ser aprovado (regra do servidor).
export const materiaisExcluidos = (o) => (o?.materiais || []).filter(m => m.excluido).map(m => m.nome)

// Mesmo texto do servidor (OrcamentoController::mensagemMaterialExcluido).
export function mensagemMaterialExcluido(nomes) {
  return nomes.length === 1
    ? `Não é possível aprovar: o material "${nomes[0]}" foi excluído do cadastro. Edite o orçamento e remova-o.`
    : `Não é possível aprovar: os materiais ${nomes.map(n => `"${n}"`).join(', ')} foram excluídos do cadastro. Edite o orçamento e remova-os.`
}
