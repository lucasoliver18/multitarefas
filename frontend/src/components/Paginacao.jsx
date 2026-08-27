import { useState, useEffect } from 'react'

const SUGESTOES = [10, 20, 50, 100]

function Paginacao({ pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas }) {
  const [valorInput, setValorInput] = useState(String(tamanhoPagina))

  useEffect(() => {
    setValorInput(String(tamanhoPagina))
  }, [tamanhoPagina])

  const confirmarValor = () => {
    const numero = parseInt(valorInput, 10)
    if (Number.isInteger(numero) && numero > 0) {
      if (numero !== tamanhoPagina) mudarTamanhoPagina(numero)
    } else {
      setValorInput(String(tamanhoPagina))
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Por página:</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          list="paginacao-sugestoes"
          value={valorInput}
          onChange={e => { if (/^\d*$/.test(e.target.value)) setValorInput(e.target.value) }}
          onBlur={confirmarValor}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-16 text-center"
        />
        <datalist id="paginacao-sugestoes">
          {SUGESTOES.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPagina(p => Math.max(1, p - 1))}
          disabled={pagina <= 1}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40"
        >
          ← Anterior
        </button>
        <span className="text-xs text-slate-500 whitespace-nowrap">Página {pagina} de {totalPaginas}</span>
        <button
          onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
          disabled={pagina >= totalPaginas}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

export default Paginacao
