import { useNavigate } from 'react-router-dom'

function Home() {
const navigate = useNavigate()  
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300" />
          <div>
            <h1 className="text-base font-bold text-gray-800">Olá, Luciano!</h1>
            <p className="text-xs text-gray-500">Pronto para mais um dia?</p>
          </div>
        </div>

        {/* Busca */}
        <div className="mt-4 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            className="flex-1 text-xs text-gray-400 outline-none bg-transparent"
            placeholder="Quais os serviços que estão pendentes..."
          />
        </div>
      </div>

      {/* Próximos Prazos */}
      <div className="px-6 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Próximos Prazos</h2>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Revisão de Sistema de Segurança - Solus</p>
              <p className="text-xs text-gray-500 mt-1">Em <span className="text-red-500 font-semibold">1 dia</span></p>
              <div className="flex items-center gap-1 mt-3">
                <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                <div className="flex-1 h-0.5 bg-gray-200" />
                <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                <div className="flex-1 h-0.5 bg-gray-200" />
                <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                <div className="flex-1 h-0.5 bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-red-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">1 dia</p>
            </div>
            <div className="ml-4 w-16 h-16 rounded-full border-2 border-red-400 flex flex-col items-center justify-center shrink-0">
              <span className="text-red-500 font-bold text-xl leading-none">1</span>
              <span className="text-red-500 text-xs leading-none">dia</span>
              <span className="text-red-500 text-xs leading-none">restante</span>
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-3">Clique para ver mais detalhes</p>
        </div>
      </div>

      {/* Serviços em andamento */}
      <div className="px-6 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Serviços em andamento</h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-700 font-medium leading-tight">Pintura de apartamento para Eunice</p>
            <p className="text-xs text-red-500 mt-2 font-semibold">🔺 Alta</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-700 font-medium leading-tight">Arrumar notebook de Alessandra</p>
            <p className="text-xs text-green-500 mt-2 font-semibold">🔻 Baixa</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-700 font-medium leading-tight">Providenciar novas luzes para Liv</p>
            <p className="text-xs text-orange-500 mt-2 font-semibold">🔺 Média</p>
          </div>
        </div>
        <p className="text-xs text-blue-500 mt-2">Ver mais</p>
      </div>

      {/* Input IA */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            className="flex-1 text-xs text-gray-400 outline-none bg-transparent"
            placeholder="Deixe me te ajudar a se organizar..."
          />
        </div>
      </div>

    {/* Barra de navegação */}
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around items-center py-3 px-6">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-blue-500 font-semibold">Início</span>
        </button>
        <button onClick={() => navigate('/prazos')} className="flex flex-col items-center gap-1">
            <span className="text-xl">📅</span>
            <span className="text-xs text-gray-400">Prazos</span>
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

export default Home