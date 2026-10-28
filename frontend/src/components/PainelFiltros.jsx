import { useState } from 'react'
import { SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react'

function PainelFiltros({ quantidadeAtiva, onLimpar, children }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <button
          onClick={() => setAberto(a => !a)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <SlidersHorizontal size={16} />
          Filtros{quantidadeAtiva > 0 ? ` (${quantidadeAtiva})` : ''}
          {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {quantidadeAtiva > 0 && (
          <button
            onClick={onLimpar}
            className="text-sm text-blue-600 font-semibold hover:text-blue-800 active:scale-95 transition-all"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {aberto && (
        <div className="px-5 pb-5 pt-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  )
}

export default PainelFiltros
