import { Clock, RefreshCw, CheckCircle2, CircleDollarSign } from 'lucide-react'

export const TAG_LABEL = {
  informatica: 'Informática',
  pintura: 'Pintura',
  outros: 'Outros',
}

export const STATUS_OPCOES = [
  { val: 'pendente',     label: 'Pendente' },
  { val: 'em_andamento', label: 'Em andamento' },
  { val: 'finalizado',   label: 'Finalizado' },
]

export const STATUS_ICONE = {
  pendente:     Clock,
  em_andamento: RefreshCw,
  finalizado:   CheckCircle2,
}

// Esteira de status: um serviço só avança, nunca retrocede.
export const PESO_STATUS = { pendente: 0, em_andamento: 1, finalizado: 2 }

export const statusSeguintes = (statusAtual) =>
  STATUS_OPCOES.filter(o => (PESO_STATUS[o.val] ?? 0) > (PESO_STATUS[statusAtual] ?? -1))

export const PRIORIDADE_OPCOES = [
  { val: 'alta',  label: 'Alta' },
  { val: 'media', label: 'Média' },
  { val: 'baixa', label: 'Baixa' },
]

export const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 }

export const TAG_OPCOES = Object.entries(TAG_LABEL).map(([val, label]) => ({ val, label }))

export const badgeStatus = (s) => ({
  finalizado:   'bg-[#dcfce7] text-[#166534]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  pendente:     'bg-[#fef9c3] text-[#854d0e]',
}[s] || 'bg-[#fef9c3] text-[#854d0e]')

export const labelStatus = (s) => ({
  finalizado:   'Finalizado',
  em_andamento: 'Em andamento',
  pendente:     'Pendente',
}[s] || 'Pendente')

export const borderPrioridade = (p) => {
  if (p === 'alta')  return 'border-l-[#dc2626]'
  if (p === 'media') return 'border-l-[#ca8a04]'
  return 'border-l-[#16a34a]'
}

// Mesmas cores de borderPrioridade, para marcadores com fundo (ex.: a barra
// de prioridade das linhas da lista de serviços).
export const fundoPrioridade = (p) => {
  if (p === 'alta')  return 'bg-[#dc2626]'
  if (p === 'media') return 'bg-[#ca8a04]'
  return 'bg-[#16a34a]'
}

export const labelPrioridade = (p) =>
  p === 'alta' ? 'Alta' : p === 'media' ? 'Média' : 'Baixa'

export const corTextoPrioridade = (p) =>
  p === 'alta' ? 'text-red-500' : p === 'media' ? 'text-amber-500' : 'text-green-600'

export const corFundoPrioridade = (p) =>
  p === 'alta' ? 'bg-red-500' : p === 'media' ? 'bg-orange-400' : 'bg-green-400'

export const PAGO_OPCOES = [
  { val: '1', label: 'Pago' },
  { val: '0', label: 'Não pago' },
]

export const ICONE_PAGO = CircleDollarSign

export const badgePago = (pago) =>
  pago ? 'bg-[#dcfce7] text-[#166534]' : 'bg-slate-100 text-slate-500'

export const labelPago = (pago) => pago ? 'Pago' : 'Não pago'
