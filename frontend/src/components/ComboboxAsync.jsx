import { useEffect, useRef } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { useComboboxAssincrono } from '../hooks/useComboboxAssincrono'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

/**
 * Combobox reutilizável com busca server-side (debounced) e carregamento
 * incremental sob demanda (scroll infinito). `buscarPagina(query, pagina)`
 * deve chamar a API e retornar `{ itens, temMais }`.
 *
 * Não usa windowing (react-virtual) — a lista renderizada por página é
 * pequena o bastante para não precisar. Se algum uso futuro acumular
 * centenas de itens em tela, plugar windowing aqui sem mudar a API pública.
 */
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
            <button
              key={itemKey(item)}
              type="button"
              onMouseDown={() => onSelecionar(item)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
            >
              {renderItem(item)}
            </button>
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
              className="w-full text-left px-4 py-2.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 flex items-center gap-2"
            >
              <UserPlus size={14} />
              {acaoExtra.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ComboboxAsync
