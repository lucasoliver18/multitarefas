import { ChevronLeft, ChevronRight } from 'lucide-react'
import { hojeISO, paraIso, somarDias, somarMeses, isoParaBr } from '../utils/prazos'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const BOTAO_NAV = 'p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-90 transition-all'

// Grade do calendário do sistema (navegação de mês, dias e escolha de mês),
// sem estado próprio: quem usa guarda o `cursor` (data em foco) e o `modo`
// ('dias' ou 'meses'). Usado pelo CampoData e pela edição rápida de prazo.
function Calendario({ valor, cursor, setCursor, modo, setModo, onEscolher, min = '1900-01-01', max = '2999-12-31' }) {
  const noIntervalo = (iso) => iso >= min && iso <= max
  const limitar = (iso) => (iso < min ? min : iso > max ? max : iso)

  const [anoCursor, mesCursor] = cursor.split('-').map(Number)
  const primeiroDia = new Date(anoCursor, mesCursor - 1, 1)
  const inicioGrade = paraIso(new Date(anoCursor, mesCursor - 1, 1 - primeiroDia.getDay()))
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicioGrade, i))
  const hoje = hojeISO()

  return (
    <>
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
                  onClick={() => noIntervalo(iso) && onEscolher(iso)}
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
    </>
  )
}

export default Calendario
