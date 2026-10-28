import { useState, useRef, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { sanitizarNumero } from '../utils/numeros'

// Espera o usuário parar de clicar por esse tempo antes de salvar (e então
// avisar "Estoque atualizado"), para não disparar um PATCH/aviso a cada clique.
// Ajuste aqui se a espera parecer longa ou curta demais.
const ESPERA_SALVAR_ESTOQUE_MS = 1000

function EstoqueEditor({ quantidade, unidade, onAlterar }) {
  const [valor, setValor] = useState(quantidade)
  const [quantidadeAnterior, setQuantidadeAnterior] = useState(quantidade)
  const [editando, setEditando] = useState(false)
  const [textoEditando, setTextoEditando] = useState('')
  const timeoutRef = useRef(null)
  const pendenteRef = useRef(null)
  const onAlterarRef = useRef(onAlterar)

  useEffect(() => { onAlterarRef.current = onAlterar })

  // Sincroniza com mudanças externas (ex.: reversão após falha na API) fora de uma edição.
  if (quantidade !== quantidadeAnterior) {
    setQuantidadeAnterior(quantidade)
    if (!editando) setValor(quantidade)
  }

  const enviarPendente = () => {
    clearTimeout(timeoutRef.current)
    const pendente = pendenteRef.current
    pendenteRef.current = null
    if (pendente !== null) onAlterarRef.current(pendente)
  }

  // Ao sair da tela antes do fim da espera, salva na hora o que ficou pendente.
  useEffect(() => () => enviarPendente(), [])

  const agendarEnvio = (novoValor) => {
    clearTimeout(timeoutRef.current)
    // Voltou ao valor salvo (ex.: +1 e depois -1): nada a enviar nem avisar.
    if (novoValor === quantidade) {
      pendenteRef.current = null
      return
    }
    pendenteRef.current = novoValor
    timeoutRef.current = setTimeout(enviarPendente, ESPERA_SALVAR_ESTOQUE_MS)
  }

  const alterar = (delta) => {
    const novo = Math.max(0, parseFloat((valor + delta).toFixed(3)))
    setValor(novo)
    agendarEnvio(novo)
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
        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-90 transition-all disabled:opacity-40 disabled:active:scale-100 shrink-0"
      >
        <Minus size={14} />
      </button>

      {editando ? (
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          value={textoEditando}
          onChange={e => setTextoEditando(sanitizarNumero(e.target.value, 3))}
          onBlur={confirmarEdicao}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
          onClick={e => e.stopPropagation()}
          className="w-20 text-center text-sm font-semibold border border-blue-300 rounded-lg py-0.5 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={iniciarEdicao}
          className="min-w-[4.5rem] text-center text-sm font-semibold text-slate-800 hover:underline hover:text-blue-700 active:scale-95 transition-all"
        >
          {valor} {unidade}
        </button>
      )}

      <button
        type="button"
        onClick={() => alterar(1)}
        aria-label="Aumentar estoque"
        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-90 transition-all shrink-0"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

export default EstoqueEditor
