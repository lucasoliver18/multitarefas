import { useState, useRef, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { sanitizarNumero } from '../utils/numeros'

const DEBOUNCE_MS = 450

/**
 * Editor rápido de estoque: botões -/+ (passo de 1) e clique no valor para
 * digitar a quantidade exata. As chamadas à API são debounced para não
 * disparar um PATCH a cada clique quando o usuário clica várias vezes seguidas.
 */
function EstoqueEditor({ quantidade, unidade, onAlterar }) {
  const [valor, setValor] = useState(quantidade)
  const [quantidadeAnterior, setQuantidadeAnterior] = useState(quantidade)
  const [editando, setEditando] = useState(false)
  const [textoEditando, setTextoEditando] = useState('')
  const timeoutRef = useRef(null)

  // Ajusta o valor exibido durante a renderização quando a quantidade muda
  // por fora (ex.: reversão após falha na API) e não há edição em curso.
  if (quantidade !== quantidadeAnterior) {
    setQuantidadeAnterior(quantidade)
    if (!editando) setValor(quantidade)
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const agendarEnvio = (novoValor) => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onAlterar(novoValor), DEBOUNCE_MS)
  }

  const alterar = (delta) => {
    setValor(prev => {
      const novo = Math.max(0, parseFloat((prev + delta).toFixed(3)))
      agendarEnvio(novo)
      return novo
    })
  }

  const iniciarEdicao = (e) => {
    e.stopPropagation()
    setTextoEditando(String(valor))
    setEditando(true)
  }

  const confirmarEdicao = () => {
    setEditando(false)
    const novo = Math.max(0, parseFloat(textoEditando.replace(',', '.')) || 0)
    setValor(novo)
    agendarEnvio(novo)
  }

  return (
    <div className="inline-flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => alterar(-1)}
        disabled={valor <= 0}
        aria-label="Diminuir estoque"
        className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-90 transition-all disabled:opacity-40 disabled:active:scale-100 shrink-0"
      >
        <Minus size={12} />
      </button>

      {editando ? (
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          value={textoEditando}
          onChange={e => setTextoEditando(sanitizarNumero(e.target.value, 4))}
          onBlur={confirmarEdicao}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
          onClick={e => e.stopPropagation()}
          className="w-16 text-center text-xs font-semibold border border-blue-300 rounded-lg py-0.5 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={iniciarEdicao}
          className="min-w-[3.5rem] text-center text-xs font-semibold text-slate-800 hover:underline hover:text-blue-700 active:scale-95 transition-all"
        >
          {valor} {unidade}
        </button>
      )}

      <button
        type="button"
        onClick={() => alterar(1)}
        aria-label="Aumentar estoque"
        className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-90 transition-all shrink-0"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}

export default EstoqueEditor
