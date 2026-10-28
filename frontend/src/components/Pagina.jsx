import { ArrowLeft, Search, X } from 'lucide-react'

// Estrutura padrão das telas: conteúdo centralizado com largura máxima,
// para não esticar demais em monitores grandes.
export function Pagina({ largura = 'max-w-7xl', children }) {
  return (
    <div className={`entrada-suave mx-auto w-full ${largura} px-10 py-8 flex flex-col gap-6`}>
      {children}
    </div>
  )
}

export function CabecalhoPagina({ titulo, subtitulo, subtituloClassName = 'text-slate-500', voltar, acoes }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0">
        {voltar && (
          <button
            onClick={voltar.onClick}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium mb-2 hover:text-slate-800 active:scale-95 transition-all"
          >
            <ArrowLeft size={15} />
            {voltar.label}
          </button>
        )}
        <h1 className="text-2xl font-bold text-slate-800 truncate">{titulo}</h1>
        {subtitulo && <p className={`text-sm mt-1 truncate ${subtituloClassName}`}>{subtitulo}</p>}
      </div>
      {acoes && <div className="flex items-center gap-3 shrink-0">{acoes}</div>}
    </div>
  )
}

export function CampoBusca({ valor, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full max-w-md focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
      <Search size={16} className="text-slate-400 shrink-0" />
      <input
        value={valor}
        onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
        placeholder={placeholder}
      />
      {valor && (
        <button onClick={() => onChange('')} aria-label="Limpar busca" className="text-slate-400 hover:text-slate-700 active:scale-90 transition-all">
          <X size={15} />
        </button>
      )}
    </div>
  )
}

// Grupo de botões para alternar a visualização (Lista/Grade/Quadro...).
export function AlternadorVisualizacao({ opcoes, valor, onChange }) {
  return (
    <div className="inline-flex bg-slate-200/70 rounded-xl p-1 gap-1">
      {opcoes.map(({ val, label, icone }) => {
        const Icone = icone
        return (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
            valor === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
          }`}
        >
          <Icone size={15} />
          {label}
        </button>
        )
      })}
    </div>
  )
}

export function Carregando({ texto = 'Carregando...' }) {
  return <div className="aparecer-com-atraso text-center text-slate-400 text-sm py-16">{texto}</div>
}

export function Vazio({ children }) {
  return (
    <div className="text-center text-slate-400 text-sm py-16 bg-white rounded-2xl border border-dashed border-slate-200">
      {children}
    </div>
  )
}
