import { PESO_STATUS, labelStatus } from './status'

export const FORM_SERVICO_VAZIO = {
  titulo: '',
  descricao: '',
  cliente: '',
  cliente_id: null,
  prioridade: 'media',
  status: 'pendente',
  pago: false,
  prazo: '',
  tag: '',
}

export const ROTULO_FINALIZAR_E_PAGAR = 'Finalizar e marcar como pago'
export const ROTULO_SO_FINALIZAR = 'Só finalizar'
export const MENSAGEM_RETROCEDER = 'Não é possível retroceder o status de um serviço'

// O status só avança (Pendente → Em andamento → Finalizado).
export const retrocedeStatus = (statusAtual, novoStatus) =>
  (PESO_STATUS[novoStatus] ?? 0) < (PESO_STATUS[statusAtual] ?? 0)

// Regra única de confirmação ao mudar o status, usada por todas as formas de
// mudar (menu de status, arrastar no quadro, modais, Prazos e Editar Serviço):
// - Em andamento ou Finalizado sem orçamento aprovado → avisa;
// - Finalizado sem estar pago → avisa e oferece "Finalizar e marcar como pago".
// `temAlerta` diz se há algo a avisar (o formulário só pergunta nesse caso).
export function avisoMudancaStatus({ novoStatus, pago, temOrcamentoAprovado }) {
  const semOrcamento = (novoStatus === 'em_andamento' || novoStatus === 'finalizado') && !temOrcamentoAprovado
  const naoPago = novoStatus === 'finalizado' && !pago
  const rotulo = labelStatus(novoStatus)

  let mensagem
  if (naoPago && semOrcamento) mensagem = 'Serviço sem orçamento aprovado e ainda não marcado como pago. Finalizar mesmo assim?'
  else if (naoPago) mensagem = 'Serviço ainda não está marcado como pago. Finalizar mesmo assim?'
  else if (semOrcamento) mensagem = `Serviço sem orçamento aprovado. Mudar para "${rotulo}" mesmo assim?`
  else mensagem = `Mudar status para "${rotulo}"?`

  return { mensagem, temAlerta: naoPago || semOrcamento, oferecerPagar: naoPago }
}

// Mensagem de sucesso: ao finalizar, deixa claro se o pagamento foi marcado
// junto ou se continua pendente ("Só finalizar" nunca mexe no pagamento).
export function mensagemStatusAtualizado(novoStatus, pago, extras = {}) {
  if (novoStatus !== 'finalizado') return 'Status atualizado'
  if (extras.pago) return 'Serviço finalizado e marcado como pago'
  return pago ? 'Serviço finalizado' : 'Serviço finalizado. O pagamento continua pendente'
}

// Mostra a confirmação. `confirmar(extras)` recebe `{ pago: true }` quando o
// usuário escolhe "Finalizar e marcar como pago".
export function perguntarMudancaStatus(toast, aviso, confirmar) {
  toast.confirmar(aviso.mensagem, () => confirmar({}), undefined, aviso.oferecerPagar ? {
    rotuloConfirmar: ROTULO_SO_FINALIZAR,
    acaoExtra: { label: ROTULO_FINALIZAR_E_PAGAR, onClick: () => confirmar({ pago: true }) },
  } : {})
}
