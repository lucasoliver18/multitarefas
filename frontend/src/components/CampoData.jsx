import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays } from 'lucide-react'
import Calendario from './Calendario'
import { useFlutuante } from '../hooks/useFlutuante'
import { dataValida, hojeISO, isoParaBr, somarDias, somarMeses } from '../utils/prazos'

const mascarar = (texto) => {
  const n = texto.replace(/\D/g, '').slice(0, 8)
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/')
}

// Campo de data no padrão do sistema: digitação com máscara dd/mm/aaaa e
// calendário próprio (o nativo muda conforme o navegador/SO). Trabalha com
// datas ISO (aaaa-mm-dd) e chama onChange com `{ target: { name, value } }`
// só quando a data está completa e válida (ou vazia, ao limpar).
// `onInvalida` é chamado ao sair do campo com uma data inválida/incompleta.
// Em formulários, `manterInvalida` deixa o texto errado no campo (com borda e
// aviso em vermelho) em vez de voltar à data anterior, e `onValidade(bool)`
// avisa a cada mudança se o texto atual é uma data aceitável, para o
// formulário não salvar enquanto estiver errado.
function CampoData({
  name, value, onChange, onInvalida, onValidade, manterInvalida = false,
  min = '1900-01-01', max = '2999-12-31',
  className = '', placeholder = 'dd/mm/aaaa', disabled, ...props
}) {
  const valor = value || ''
  const [texto, setTexto] = useState(isoParaBr(valor))
  const [valorVisto, setValorVisto] = useState(valor)
  const [aberto, setAberto] = useState(false)
  const [modo, setModo] = useState('dias')
  const [cursor, setCursor] = useState(valor || hojeISO())
  const [erro, setErro] = useState(false)
  const calendarioId = useId()

  // Valor alterado por fora (ex.: "Limpar filtros"): atualiza o texto exibido.
  if (valor !== valorVisto) {
    setValorVisto(valor)
    setTexto(isoParaBr(valor))
  }

  const fechar = () => { setAberto(false); setModo('dias') }
  const { ancoraRef, flutuanteRef, estilo } = useFlutuante({ aberto, onFechar: fechar, altura: 380, largura: 304 })

  const noIntervalo = (iso) => iso >= min && iso <= max
  const limitar = (iso) => (iso < min ? min : iso > max ? max : iso)
  const textoValido = (t) => {
    if (!t) return true
    const iso = t.split('/').reverse().join('-')
    return t.length === 10 && dataValida(iso) && noIntervalo(iso)
  }
  const marcarValido = () => { setErro(false); onValidade?.(true) }

  const emitir = (iso) => {
    if (iso !== valor) onChange?.({ target: { name, value: iso } })
  }

  const escolher = (iso) => {
    if (!noIntervalo(iso)) return
    setTexto(isoParaBr(iso))
    setCursor(iso)
    emitir(iso)
    marcarValido()
    fechar()
  }

  const abrir = () => {
    if (disabled || aberto) return
    setCursor(limitar(valor || hojeISO()))
    setModo('dias')
    setAberto(true)
  }

  const aoDigitar = (e) => {
    const novo = mascarar(e.target.value)
    setTexto(novo)
    if (textoValido(novo)) marcarValido()
    else onValidade?.(false)
    if (!novo) return emitir('')
    if (novo.length < 10) return
    const iso = novo.split('/').reverse().join('-')
    if (dataValida(iso) && noIntervalo(iso)) {
      setCursor(iso)
      emitir(iso)
    }
  }

  const aoSair = () => {
    fechar()
    if (textoValido(texto)) return
    onInvalida?.()
    if (manterInvalida) {
      setErro(true)
    } else {
      setTexto(isoParaBr(valor))
      onValidade?.(true)
    }
  }

  const aoTeclar = (e) => {
    if (!aberto) {
      if (e.key === 'ArrowDown' || (e.key === 'Enter' && e.altKey)) { e.preventDefault(); abrir() }
      return
    }
    const mover = (iso) => { e.preventDefault(); setCursor(limitar(iso)); setModo('dias') }
    switch (e.key) {
      case 'ArrowLeft': return mover(somarDias(cursor, -1))
      case 'ArrowRight': return mover(somarDias(cursor, 1))
      case 'ArrowUp': return mover(somarDias(cursor, -7))
      case 'ArrowDown': return mover(somarDias(cursor, 7))
      case 'PageUp': return mover(somarMeses(cursor, e.shiftKey ? -12 : -1))
      case 'PageDown': return mover(somarMeses(cursor, e.shiftKey ? 12 : 1))
      case 'Enter': e.preventDefault(); return escolher(cursor)
      // stopPropagation: Esc fecha só o calendário, não o modal em volta.
      case 'Escape': e.preventDefault(); e.stopPropagation(); return fechar()
    }
  }

  const hoje = hojeISO()

  // Botões do calendário: preventDefault no mousedown mantém o foco no campo
  // (senão o blur fecharia o calendário antes do clique).
  const semRoubarFoco = { onMouseDown: e => e.preventDefault() }

  return (
    <div>
    <div ref={ancoraRef} className="relative">
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={aberto ? calendarioId : undefined}
        name={name}
        value={texto}
        placeholder={placeholder}
        disabled={disabled}
        onChange={aoDigitar}
        onClick={abrir}
        onBlur={aoSair}
        onKeyDown={aoTeclar}
        aria-invalid={erro || undefined}
        className={`${className} pr-10 tabular-nums ${erro ? 'border-red-400! focus:ring-red-100!' : ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Abrir calendário"
        disabled={disabled}
        {...semRoubarFoco}
        onClick={() => {
          if (aberto) return fechar()
          ancoraRef.current?.querySelector('input')?.focus()
          abrir()
        }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:pointer-events-none"
      >
        <CalendarDays size={16} />
      </button>

      {aberto && createPortal(
        <div
          ref={flutuanteRef}
          id={calendarioId}
          role="dialog"
          aria-label="Calendário"
          style={estilo}
          {...semRoubarFoco}
          className="fixed z-[110] bg-white border border-slate-200 rounded-xl shadow-lg p-3 overflow-y-auto select-none"
        >
          <Calendario
            valor={valor}
            cursor={cursor}
            setCursor={setCursor}
            modo={modo}
            setModo={setModo}
            min={min}
            max={max}
            onEscolher={escolher}
          />

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setTexto(''); emitir(''); marcarValido(); fechar() }}
              className="px-2 py-1 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              disabled={!noIntervalo(hoje)}
              onClick={() => escolher(hoje)}
              className="px-2 py-1 rounded-lg text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors disabled:opacity-40"
            >
              Hoje
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
    {erro && <p className="text-xs text-red-600 mt-1">Data inválida. Corrija ou apague para salvar.</p>}
    </div>
  )
}

export default CampoData
