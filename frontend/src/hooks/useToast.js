import { useContext, useMemo } from 'react'
import { ToastContext } from '../contexts/ToastContext'

export function useToast() {
  const { add } = useContext(ToastContext)
  // Mesma referência entre renders, para poder ser usado em dependências de efeitos.
  return useMemo(() => ({
    sucesso:   (msg) => add('sucesso', msg),
    erro:      (msg) => add('erro', msg),
    alerta:    (msg) => add('alerta', msg),
    // `opcoes`: { rotuloConfirmar, acaoExtra: { label, onClick } } — a ação
    // extra vira um terceiro botão (ex.: "Finalizar e marcar como pago").
    confirmar: (msg, onConfirm, onCancel, opcoes = {}) => add('confirmar', msg, { onConfirm, onCancel, ...opcoes }),
  }), [add])
}
