function BarraSelecao({ quantidade, onExcluir, onCancelar }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--app-max-width)] bg-[#1e3a5f] flex items-center justify-between py-3 px-4 z-50">
      <span className="text-white text-sm font-semibold">
        {quantidade} selecionado{quantidade !== 1 ? 's' : ''}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onCancelar}
          className="text-xs bg-white/10 text-white px-3 py-2 rounded-full font-semibold transition-all hover:bg-white/20 active:scale-[0.96]"
        >
          Cancelar
        </button>
        <button
          onClick={onExcluir}
          disabled={quantidade === 0}
          className="text-xs bg-[#dc2626] text-white px-3 py-2 rounded-full font-semibold transition-all hover:bg-red-700 active:scale-[0.96] disabled:opacity-40 disabled:active:scale-100"
        >
          Excluir selecionados
        </button>
      </div>
    </div>
  )
}

export default BarraSelecao
