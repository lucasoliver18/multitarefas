import { useState, useCallback, useRef, useMemo } from 'react'
import { ToastContext } from '../contexts/ToastContext'

// Tempo na tela dos avisos comuns. Os de confirmação ("confirmar") não somem
// sozinhos: esperam o usuário escolher.
const DURACAO_AVISO_MS = 4000
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react'


const STYLES = {
  sucesso:   { bg: 'bg-[#16a34a]', Icone: Check },
  erro:      { bg: 'bg-[#dc2626]', Icone: X },
  alerta:    { bg: 'bg-[#ca8a04]', Icone: AlertTriangle },
  confirmar: { bg: 'bg-[#1e3a5f]', Icone: HelpCircle },
}

function ToastItem({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.alerta

  return (
    <div className={`${s.bg} text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 ${toast.leaving ? 'toast-leave' : 'toast-enter'}`}>
      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <s.Icone size={14} />
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

      {toast.type === 'confirmar' ? (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => { toast.onConfirm?.(); onRemove(toast.id) }}
            className="text-xs bg-white text-[#1e3a5f] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all hover:bg-slate-100 active:scale-95"
          >
            Confirmar
          </button>
          <button
            onClick={() => { toast.onCancel?.(); onRemove(toast.id) }}
            className="text-xs bg-white/20 text-white font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-all hover:bg-white/30 active:scale-95"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => onRemove(toast.id)}
          className="text-white/60 hover:text-white active:scale-90 transition-all shrink-0"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

function ToastDisplay({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 w-[26rem] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const remove = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  const add = useCallback((type, message, extras = {}) => {
    const id = ++nextId.current
    setToasts(prev => [...prev, { id, type, message, leaving: false, ...extras }])
    if (type !== 'confirmar') {
      setTimeout(() => remove(id), DURACAO_AVISO_MS)
    }
  }, [remove])

  // Valor estável: sem isso, cada aviso criava um objeto novo e fazia todas as
  // telas (que usam useToast) renderizarem de novo, dando a impressão de "piscar".
  const valor = useMemo(() => ({ add, remove }), [add, remove])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <ToastDisplay toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

export default ToastDisplay
