function BarraSelecao({ quantidade, onExcluir, onCancelar }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-[#1e3a5f] flex items-center justify-between py-3 px-4 z-50">
      <span className="text-white text-sm font-semibold">
        {quantidade} selecionado{quantidade !== 1 ? 's' : ''}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onCancelar}
          className="text-xs bg-white/10 text-white px-3 py-2 rounded-full font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={onExcluir}
          disabled={quantidade === 0}
          className="text-xs bg-[#dc2626] text-white px-3 py-2 rounded-full font-semibold disabled:opacity-40"
        >
          Excluir selecionados
        </button>
      </div>
    </div>
  )
}

export default BarraSelecao
