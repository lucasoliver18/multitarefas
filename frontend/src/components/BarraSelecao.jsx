// Barra flutuante na base da área de conteúdo (à direita do menu lateral).
function BarraSelecao({ quantidade, onExcluir, onCancelar }) {
  return (
    <div className="fixed bottom-6 left-[calc(var(--largura-menu,16rem)+2.5rem)] right-10 z-50 transition-[left] duration-200 ease-out flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-[#1e3a5f] rounded-2xl shadow-2xl flex items-center gap-6 py-3 pl-6 pr-3">
        <span className="text-white text-sm font-semibold">
          {quantidade} selecionado{quantidade !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="text-sm bg-white/10 text-white px-4 py-2 rounded-xl font-semibold transition-all hover:bg-white/20 active:scale-[0.96]"
          >
            Cancelar
          </button>
          <button
            onClick={onExcluir}
            disabled={quantidade === 0}
            className="text-sm bg-[#dc2626] text-white px-4 py-2 rounded-xl font-semibold transition-all hover:bg-red-700 active:scale-[0.96] disabled:opacity-40 disabled:active:scale-100"
          >
            Excluir selecionados
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarraSelecao
