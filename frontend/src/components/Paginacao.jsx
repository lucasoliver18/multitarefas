const TAMANHOS = [10, 50, 100]

function Paginacao({ pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Por página:</span>
        <select
          value={tamanhoPagina}
          onChange={e => mudarTamanhoPagina(Number(e.target.value))}
          className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600"
        >
          {TAMANHOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
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
