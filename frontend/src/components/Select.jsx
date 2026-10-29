import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { useFlutuante } from '../hooks/useFlutuante'

const normalizar = texto => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Lista suspensa no visual do sistema (a nativa do <select> muda conforme o
// navegador/SO). Mantém a interface do <select>: recebe <option> como filhos e
// chama onChange com `{ target: { name, value } }`.
// Com `multiple`, `value` é um array e a lista fica aberta para marcar várias
// opções; a opção de valor "" (ex.: "Todas") significa nenhuma marcada.
function Select({ name, value, onChange, className = '', children, disabled, multiple, ...props }) {
  const opcoes = Children.toArray(children)
    .filter(filho => isValidElement(filho) && filho.type === 'option')
    .map(({ props: p }) => ({ valor: String(p.value ?? p.children), rotulo: p.children, desabilitada: !!p.disabled }))

  const marcados = multiple ? (Array.isArray(value) ? value.map(String) : []) : null
  const estaMarcada = (opcao) => (multiple
    ? (opcao.valor === '' ? marcados.length === 0 : marcados.includes(opcao.valor))
    : opcao.valor === String(value ?? ''))
  const indiceSelecionado = opcoes.findIndex(estaMarcada)

  const rotuloBotao = multiple && marcados.length > 0
    ? opcoes.filter(o => o.valor !== '' && marcados.includes(o.valor)).map(o => o.rotulo).join(', ')
    : (opcoes[indiceSelecionado] ?? opcoes[0])?.rotulo

  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const { ancoraRef, flutuanteRef, estilo } = useFlutuante({ aberto, onFechar: () => setAberto(false), altura: 256 })
  const botaoRef = useRef(null)
  const itensRef = useRef([])
  const listaId = useId()

  const abrir = () => {
    if (disabled) return
    setAtivo(Math.max(indiceSelecionado, 0))
    setAberto(true)
  }

  const escolher = (indice) => {
    const opcao = opcoes[indice]
    if (!opcao || opcao.desabilitada) return
    if (multiple) {
      const novo = opcao.valor === '' ? []
        : marcados.includes(opcao.valor) ? marcados.filter(v => v !== opcao.valor)
        : opcoes.filter(o => o.valor !== '' && (o.valor === opcao.valor || marcados.includes(o.valor))).map(o => o.valor)
      onChange?.({ target: { name, value: novo } })
      return
    }
    setAberto(false)
    botaoRef.current?.focus()
    if (opcao.valor !== String(value ?? '')) onChange?.({ target: { name, value: opcao.valor } })
  }

  useEffect(() => {
    if (aberto) itensRef.current[ativo]?.scrollIntoView?.({ block: 'nearest' })
  }, [aberto, ativo])

  const mover = (de, passo) => {
    for (let i = de + passo; i >= 0 && i < opcoes.length; i += passo) {
      if (!opcoes[i].desabilitada) return i
    }
    return de
  }

  const aoTeclar = (e) => {
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abrir() }
      return
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setAtivo(i => mover(i, 1)); break
      case 'ArrowUp': e.preventDefault(); setAtivo(i => mover(i, -1)); break
      case 'Home': e.preventDefault(); setAtivo(mover(-1, 1)); break
      case 'End': e.preventDefault(); setAtivo(mover(opcoes.length, -1)); break
      case 'Enter':
      case ' ': e.preventDefault(); escolher(ativo); break
      // stopPropagation: Esc fecha só a lista, não o modal em volta.
      case 'Escape': e.preventDefault(); e.stopPropagation(); setAberto(false); break
      case 'Tab': setAberto(false); break
      default:
        // Digitar uma letra pula para a próxima opção que começa com ela.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const letra = normalizar(e.key)
          const ordem = [...opcoes.keys()].map(k => (ativo + 1 + k) % opcoes.length)
          const achou = ordem.find(i => !opcoes[i].desabilitada && normalizar(opcoes[i].rotulo).startsWith(letra))
          if (achou !== undefined) setAtivo(achou)
        }
    }
  }

  return (
    <div ref={ancoraRef} className="relative">
      <button
        {...props}
        ref={botaoRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-activedescendant={aberto && ativo >= 0 ? `${listaId}-${ativo}` : undefined}
        disabled={disabled}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={aoTeclar}
        className={`${className} pr-9 text-left truncate cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {rotuloBotao ?? ' '}
      </button>
      <ChevronDown
        size={16}
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
      />

      {aberto && createPortal(
        <ul
          ref={flutuanteRef}
          id={listaId}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          style={estilo}
          className="fixed z-[110] bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto py-1"
        >
          {opcoes.map((opcao, i) => {
            const marcada = estaMarcada(opcao)
            return (
              <li
                key={opcao.valor}
                id={`${listaId}-${i}`}
                ref={el => { itensRef.current[i] = el }}
                role="option"
                aria-selected={marcada}
                aria-disabled={opcao.desabilitada || undefined}
                // preventDefault mantém o foco no botão enquanto a lista está aberta.
                onMouseDown={e => e.preventDefault()}
                onClick={() => escolher(i)}
                onMouseEnter={() => !opcao.desabilitada && setAtivo(i)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                  opcao.desabilitada ? 'text-slate-300 cursor-not-allowed'
                    : marcada ? 'text-blue-700 font-semibold cursor-pointer'
                    : 'text-slate-700 cursor-pointer'
                } ${i === ativo ? (marcada ? 'bg-blue-50' : 'bg-slate-50') : ''}`}
              >
                {multiple && (
                  <span className={`order-first flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
                    marcada ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {marcada && <Check size={12} strokeWidth={3} />}
                  </span>
                )}
                <span className="truncate flex-1">{opcao.rotulo}</span>
                {!multiple && marcada && <Check size={16} className="shrink-0 text-blue-600" />}
              </li>
            )
          })}
        </ul>,
        document.body
      )}
    </div>
  )
}

export default Select
