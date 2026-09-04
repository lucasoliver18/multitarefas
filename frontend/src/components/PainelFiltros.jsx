import { useState } from 'react'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'

function PainelFiltros({ quantidadeAtiva, onLimpar, children }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-700"
      >
        <span className="inline-flex items-center gap-1.5">
          <Search size={14} />
          Filtros{quantidadeAtiva > 0 ? ` (${quantidadeAtiva})` : ''}
        </span>
        {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {aberto && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex flex-col gap-3">
          {children}
          {quantidadeAtiva > 0 && (
            <button
              onClick={onLimpar}
              className="self-start text-xs text-blue-600 font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PainelFiltros
