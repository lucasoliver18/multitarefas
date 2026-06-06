import { useContext } from 'react'
import { ToastContext } from '../components/ToastNotification'

export function useToast() {
  const { add } = useContext(ToastContext)
  return {
    sucesso:   (msg) => add('sucesso', msg),
    erro:      (msg) => add('erro', msg),
    alerta:    (msg) => add('alerta', msg),
    confirmar: (msg, onConfirm, onCancel) => add('confirmar', msg, { onConfirm, onCancel }),
  }
}
