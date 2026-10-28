import { useEffect, useRef } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { useComboboxAssincrono } from '../hooks/useComboboxAssincrono'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

// `buscarPagina(query, pagina)` deve retornar `{ itens, temMais }`.
function ComboboxAsync({
  valor,
  onChangeTexto,
  onSelecionar,
  buscarPagina,
  renderItem,
  itemKey = item => item.id,
  placeholder,
  className = INPUT,
  minCaracteres = 1,
  acaoExtra,
  // Botão opcional ao lado de cada item, ex.: { icone: Trash2, label: 'Excluir', onClick: item => ... }
  acaoItem,
}) {
  const {
    query, setQuery,
    itens, carregando, carregandoMais, temMais,
    aberto, setAberto,
    carregarMais,
  } = useComboboxAssincrono({ buscarPagina, minCaracteres })

  const sentinelaRef = useRef(null)

  useEffect(() => {
    const alvo = sentinelaRef.current
    if (!alvo || !aberto) return
    const observer = new IntersectionObserver(
      entradas => { if (entradas[0].isIntersecting) carregarMais() },
      { threshold: 1 }
    )
    observer.observe(alvo)
    return () => observer.disconnect()
  }, [aberto, carregarMais])

  const mostrarLista = aberto && (itens.length > 0 || carregando || query.trim().length >= minCaracteres)

  return (
    <div className="relative">
      <input
        value={valor}
        onChange={e => {
          onChangeTexto(e.target.value)
          setQuery(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />

      {mostrarLista && (
        <div className="absolute z-10 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden max-h-64 overflow-y-auto">
          {itens.map(item => (
            <div key={itemKey(item)} className="flex items-stretch border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
              <button
                type="button"
                onMouseDown={() => onSelecionar(item)}
                className="flex-1 min-w-0 text-left px-4 py-2.5 text-sm text-slate-700 active:bg-slate-100 transition-colors flex justify-between items-center gap-3"
              >
                {renderItem(item)}
              </button>
              {acaoItem && (
                <button
                  type="button"
                  // preventDefault mantém o foco no campo (a lista não fecha antes da ação).
                  onMouseDown={e => { e.preventDefault(); acaoItem.onClick(item) }}
                  aria-label={`${acaoItem.label}: ${acaoItem.descrever?.(item) ?? ''}`}
                  title={acaoItem.label}
                  className="px-3 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                >
                  <acaoItem.icone size={16} />
                </button>
              )}
            </div>
          ))}

          {(carregando || carregandoMais) && (
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Carregando...
            </div>
          )}

          {!carregando && itens.length === 0 && query.trim().length >= minCaracteres && !acaoExtra && (
            <div className="px-4 py-2.5 text-xs text-slate-400 text-center">Nenhum resultado.</div>
          )}

          {temMais && !carregandoMais && <div ref={sentinelaRef} className="h-px" />}

          {acaoExtra && !carregando && query.trim().length >= minCaracteres && (
            <button
              type="button"
              onMouseDown={acaoExtra.onClick}
              className="w-full text-left px-4 py-2.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center gap-2"
            >
              {acaoExtra.icone ? <acaoExtra.icone size={14} /> : <UserPlus size={14} />}
              {acaoExtra.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ComboboxAsync
