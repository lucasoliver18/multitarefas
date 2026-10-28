import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PRESETS = [10, 25, 50]

const BOTAO = 'text-sm px-3 py-1.5 rounded-lg font-semibold transition-all active:scale-95'
const BOTAO_ATIVO = 'bg-[#2563eb] text-white'
const BOTAO_INATIVO = 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'

function Paginacao({ pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, total }) {
  const [valorInput, setValorInput] = useState(String(tamanhoPagina))
  const [modoCustom, setModoCustom] = useState(!PRESETS.includes(tamanhoPagina))
  const [tamanhoAnterior, setTamanhoAnterior] = useState(tamanhoPagina)

  // Sincroniza com mudanças externas do tamanho (ajuste durante o render, sem efeito).
  if (tamanhoPagina !== tamanhoAnterior) {
    setTamanhoAnterior(tamanhoPagina)
    setValorInput(String(tamanhoPagina))
    if (!PRESETS.includes(tamanhoPagina)) setModoCustom(true)
  }

  const confirmarValor = () => {
    const numero = parseInt(valorInput, 10)
    if (Number.isInteger(numero) && numero > 0 && numero <= 500) {
      if (numero !== tamanhoPagina) mudarTamanhoPagina(numero)
    } else {
      setValorInput(String(tamanhoPagina))
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-slate-500 mr-1">Por página:</span>
        {PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => { setModoCustom(false); mudarTamanhoPagina(preset) }}
            className={`${BOTAO} ${!modoCustom && tamanhoPagina === preset ? BOTAO_ATIVO : BOTAO_INATIVO}`}
          >
            {preset}
          </button>
        ))}
        <button
          onClick={() => setModoCustom(v => !v)}
          className={`${BOTAO} ${modoCustom ? BOTAO_ATIVO : BOTAO_INATIVO}`}
        >
          Outro
        </button>
        {modoCustom && (
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={valorInput}
            onChange={e => { if (/^\d*$/.test(e.target.value)) setValorInput(e.target.value) }}
            onBlur={confirmarValor}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-20 text-center"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        {total != null && <span className="text-sm text-slate-400">{total} registro{total !== 1 ? 's' : ''}</span>}
        <button
          onClick={() => setPagina(p => Math.max(1, p - 1))}
          disabled={pagina <= 1}
          aria-label="Página anterior"
          className={`${BOTAO} ${BOTAO_INATIVO} inline-flex items-center gap-1 disabled:opacity-40 disabled:active:scale-100`}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        <span className="text-sm text-slate-600 whitespace-nowrap">Página {pagina} de {totalPaginas}</span>
        <button
          onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
          disabled={pagina >= totalPaginas}
          aria-label="Próxima página"
          className={`${BOTAO} ${BOTAO_INATIVO} inline-flex items-center gap-1 disabled:opacity-40 disabled:active:scale-100`}
        >
          Próxima
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Paginacao
