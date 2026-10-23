import { useState, useEffect } from 'react'

// Opções padrão de "itens por página": cobre a maioria dos casos sem o
// usuário precisar pensar num número — quem quiser outra quantidade digita
// no campo "Outro".
const PRESETS = [10, 25, 50]

function Paginacao({ pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas }) {
  const [valorInput, setValorInput] = useState(String(tamanhoPagina))
  const [modoCustom, setModoCustom] = useState(!PRESETS.includes(tamanhoPagina))

  useEffect(() => {
    setValorInput(String(tamanhoPagina))
    setModoCustom(prev => prev || !PRESETS.includes(tamanhoPagina))
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
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-500">Por página:</span>
        {PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => { setModoCustom(false); mudarTamanhoPagina(preset) }}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all active:scale-95 ${
              !modoCustom && tamanhoPagina === preset
                ? 'bg-[#2563eb] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {preset}
          </button>
        ))}
        <button
          onClick={() => setModoCustom(v => !v)}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all active:scale-95 ${
            modoCustom
              ? 'bg-[#2563eb] text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Outro
        </button>
        {modoCustom && (
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={valorInput}
            onChange={e => { if (/^\d*$/.test(e.target.value)) setValorInput(e.target.value) }}
            onBlur={confirmarValor}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-600 w-16 text-center"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setPagina(p => Math.max(1, p - 1))}
          disabled={pagina <= 1}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          ← Anterior
        </button>
        <span className="text-xs text-slate-500 whitespace-nowrap">Página {pagina} de {totalPaginas}</span>
        <button
          onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
          disabled={pagina >= totalPaginas}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

export default Paginacao
