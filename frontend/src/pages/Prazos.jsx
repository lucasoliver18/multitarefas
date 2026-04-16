import { useNavigate } from 'react-router-dom'

function Prazos() {
  const navigate = useNavigate()
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const semanas = [
    [null, 1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30, null, null, null, null],
  ]

  const comServico = [16, 21, 24, 26]
  const diaSelecionado = 20

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-lg font-bold text-gray-800">Gerencie seus prazos</h1>
        <div className="mt-3 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            className="flex-1 text-xs text-gray-400 outline-none bg-transparent"
            placeholder="Busque por serviços específicos..."
          />
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-3">
          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">#pintura</span>
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">#tecnologia</span>
        </div>
      </div>

      {/* Calendário */}
      <div className="px-6 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          {/* Navegação mês */}
          <div className="flex items-center justify-between mb-3">
            <button className="text-gray-500 text-sm">‹</button>
            <div className="flex gap-2">
              <select className="text-sm font-semibold text-gray-700 outline-none">
                <option>Março</option>
              </select>
              <select className="text-sm font-semibold text-gray-700 outline-none">
                <option>2025</option>
              </select>
            </div>
            <button className="text-gray-500 text-sm">›</button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {dias.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Dias do mês */}
          {semanas.map((semana, i) => (
            <div key={i} className="grid grid-cols-7">
              {semana.map((dia, j) => (
                <div key={j} className="flex flex-col items-center py-1">
                  {dia ? (
                    <>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs
                        ${dia === diaSelecionado ? 'bg-blue-500 text-white font-bold' : 'text-gray-700'}`}>
                        {dia}
                      </div>
                      {comServico.includes(dia) && (
                        <div className="flex gap-0.5 mt-0.5">
                          <div className="w-1 h-1 rounded-full bg-green-400" />
                          <div className="w-1 h-1 rounded-full bg-orange-400" />
                        </div>
                      )}
                    </>
                  ) : <div className="w-7 h-7" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Serviços do dia */}
      <div className="px-6 mb-24">
        <h2 className="text-sm font-bold text-gray-800 mb-3">20 de Março de 2026</h2>
        <div className="flex flex-col gap-2">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-700 font-medium">Arrumar microondas de Camila</p>
            <p className="text-xs text-green-500 font-semibold mt-1">✔ Finalizado</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-700 font-medium">Entregar apartamento para Luís</p>
            <p className="text-xs text-orange-500 font-semibold mt-1">⏳ Pendente</p>
          </div>
        </div>
      </div>

    {/* Barra de navegação */}
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around items-center py-3 px-6">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-gray-400">Início</span>
        </button>
        <button onClick={() => navigate('/prazos')} className="flex flex-col items-center gap-1">
            <span className="text-xl">📅</span>
            <span className="text-xs text-blue-500 font-semibold">Prazos</span>
        </button>
        <button onClick={() => navigate('/servicos')} className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Serviços</span>
        </button>
        <button onClick={() => navigate('/novo')} className="flex flex-col items-center gap-1">
            <span className="text-xl">➕</span>
            <span className="text-xs text-gray-400">Novo</span>
        </button>
    </div>
</div>
  )
}

export default Prazos