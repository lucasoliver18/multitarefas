import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFlutuante } from '../hooks/useFlutuante'
import { dataValida, hojeISO } from '../utils/prazos'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const paraIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const deIso = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d) }
const somarDias = (iso, n) => { const d = deIso(iso); d.setDate(d.getDate() + n); return paraIso(d) }
// Mantém o dia, limitado ao último dia do mês de destino (31/01 + 1 mês = 28/02).
const somarMeses = (iso, n) => {
  const d = deIso(iso)
  const alvo = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  alvo.setDate(Math.min(d.getDate(), ultimo))
  return paraIso(alvo)
}

const isoParaBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
const mascarar = (texto) => {
  const n = texto.replace(/\D/g, '').slice(0, 8)
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/')
}

// Campo de data no padrão do sistema: digitação com máscara dd/mm/aaaa e
// calendário próprio (o nativo muda conforme o navegador/SO). Trabalha com
// datas ISO (aaaa-mm-dd) e chama onChange com `{ target: { name, value } }`
// só quando a data está completa e válida (ou vazia, ao limpar).
// `onInvalida` é chamado ao sair do campo com uma data inválida/incompleta.
function CampoData({
  name, value, onChange, onInvalida,
  min = '1900-01-01', max = '2999-12-31',
  className = '', placeholder = 'dd/mm/aaaa', disabled, ...props
}) {
  const valor = value || ''
  const [texto, setTexto] = useState(isoParaBr(valor))
  const [valorVisto, setValorVisto] = useState(valor)
  const [aberto, setAberto] = useState(false)
  const [modo, setModo] = useState('dias')
  const [cursor, setCursor] = useState(valor || hojeISO())
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

  const emitir = (iso) => {
    if (iso !== valor) onChange?.({ target: { name, value: iso } })
  }

  const escolher = (iso) => {
    if (!noIntervalo(iso)) return
    setTexto(isoParaBr(iso))
    setCursor(iso)
    emitir(iso)
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
    const iso = texto.split('/').reverse().join('-')
    if (texto && !(texto.length === 10 && dataValida(iso) && noIntervalo(iso))) {
      onInvalida?.()
      setTexto(isoParaBr(valor))
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

  const [anoCursor, mesCursor] = cursor.split('-').map(Number)
  const primeiroDia = new Date(anoCursor, mesCursor - 1, 1)
  const inicioGrade = paraIso(new Date(anoCursor, mesCursor - 1, 1 - primeiroDia.getDay()))
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicioGrade, i))
  const hoje = hojeISO()

  // Botões do calendário: preventDefault no mousedown mantém o foco no campo
  // (senão o blur fecharia o calendário antes do clique).
  const semRoubarFoco = { onMouseDown: e => e.preventDefault() }
  const BOTAO_NAV = 'p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-90 transition-all'

  return (
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
        className={`${className} pr-10 tabular-nums`}
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
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label={modo === 'dias' ? 'Mês anterior' : 'Ano anterior'}
              onClick={() => setCursor(c => limitar(somarMeses(c, modo === 'dias' ? -1 : -12)))}
              className={BOTAO_NAV}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setModo(m => (m === 'dias' ? 'meses' : 'dias'))}
              title={modo === 'dias' ? 'Escolher mês e ano' : 'Voltar aos dias'}
              translate="no"
              className="px-2 py-1 rounded-lg text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              {modo === 'dias' ? `${MESES[mesCursor - 1]} ${anoCursor}` : anoCursor}
            </button>
            <button
              type="button"
              aria-label={modo === 'dias' ? 'Próximo mês' : 'Próximo ano'}
              onClick={() => setCursor(c => limitar(somarMeses(c, modo === 'dias' ? 1 : 12)))}
              className={BOTAO_NAV}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {modo === 'dias' ? (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map(d => (
                  <span key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {dias.map(iso => {
                  const doMes = Number(iso.slice(5, 7)) === mesCursor
                  const selecionado = iso === valor
                  const desabilitado = !noIntervalo(iso)
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={desabilitado}
                      aria-label={isoParaBr(iso)}
                      aria-pressed={selecionado}
                      onClick={() => escolher(iso)}
                      onMouseEnter={() => doMes && setCursor(iso)}
                      className={`h-9 rounded-lg text-sm tabular-nums transition-colors disabled:text-slate-200 disabled:cursor-not-allowed ${
                        selecionado ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700'
                          : iso === hoje ? 'text-blue-600 font-bold ring-1 ring-inset ring-blue-200 hover:bg-blue-50'
                          : doMes ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-50'
                      } ${iso === cursor && !selecionado ? 'bg-slate-100' : ''}`}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {MESES.map((nome, i) => {
                const atual = i === mesCursor - 1
                return (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => { setCursor(c => limitar(somarMeses(c, i - (mesCursor - 1)))); setModo('dias') }}
                    className={`py-2.5 rounded-lg text-sm transition-colors ${
                      atual ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {nome.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setTexto(''); emitir(''); fechar() }}
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
  )
}

export default CampoData
