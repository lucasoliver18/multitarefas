import { createContext, useContext, useState, useCallback, useRef } from 'react'

export const ToastContext = createContext(null)

const STYLES = {
  sucesso:   { bg: 'bg-[#16a34a]', icon: '✓' },
  erro:      { bg: 'bg-[#dc2626]', icon: '✕' },
  alerta:    { bg: 'bg-[#ca8a04]', icon: '!' },
  confirmar: { bg: 'bg-[#1e3a5f]', icon: '?' },
}

function ToastItem({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.alerta

  return (
    <div className={`${s.bg} text-white rounded-2xl px-4 py-3 shadow-xl flex items-start gap-3 ${toast.leaving ? 'toast-leave' : 'toast-enter'}`}>
      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {s.icon}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

      {toast.type === 'confirmar' ? (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => { toast.onConfirm?.(); onRemove(toast.id) }}
            className="text-xs bg-white text-[#1e3a5f] font-bold px-3 py-1 rounded-full whitespace-nowrap"
          >
            Confirmar
          </button>
          <button
            onClick={() => { toast.onCancel?.(); onRemove(toast.id) }}
            className="text-xs bg-white/20 text-white font-semibold px-3 py-1 rounded-full whitespace-nowrap"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => onRemove(toast.id)}
          className="text-white/60 hover:text-white shrink-0 text-xl leading-none mt-0.5"
        >
          ×
        </button>
      )}
    </div>
  )
}

function ToastDisplay({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
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
      setTimeout(() => remove(id), 3000)
    }
  }, [remove])

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <ToastDisplay toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

export default ToastDisplay
