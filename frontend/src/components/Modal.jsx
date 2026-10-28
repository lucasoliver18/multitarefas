import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Janela sobreposta: fecha com Esc, clique no fundo ou no X, trava a rolagem
// da página por trás e devolve o foco ao elemento que a abriu.
function Modal({ aberto, titulo, subtitulo, onFechar, largura = 'max-w-6xl', children }) {
  const painelRef = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const focoAnterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painelRef.current?.focus()

    const aoTeclar = (e) => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
      focoAnterior?.focus?.()
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return createPortal(
    <div
      className="fundo-modal fixed inset-0 z-[100] bg-slate-900/50 flex items-start justify-center p-8 overflow-y-auto"
      onMouseDown={e => { if (e.target === e.currentTarget) onFechar() }}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`entrada-suave relative w-full ${largura} bg-slate-100 rounded-2xl shadow-2xl outline-none flex flex-col max-h-[calc(100vh-4rem)]`}
      >
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-4 bg-white rounded-t-2xl border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-800 truncate">{titulo}</h2>
            {subtitulo && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitulo}</p>}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            title="Fechar (Esc)"
            className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-7 py-6 overflow-y-auto flex flex-col gap-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
