import { useNavigate } from 'react-router-dom'

function NovoServico() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-lg font-bold text-gray-800">O que temos para fazer</h1>
      </div>

      {/* Formulário */}
      <div className="px-6 flex flex-col gap-5 mb-24">

        {/* Campo de texto */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Descreva o serviço:</p>
          <textarea
            className="w-full bg-white border border-blue-300 rounded-xl p-4 text-xs text-gray-500 outline-none shadow-sm resize-none h-36"
            placeholder="Dica: Descreva com o maior número de detalhes e informações possível..."
          />
        </div>

        {/* Pontos identificados */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Pontos identificados:</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✅</span>
              <span className="text-xs text-gray-600">Prazo máximo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✅</span>
              <span className="text-xs text-gray-600">Cliente a ser atendido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✅</span>
              <span className="text-xs text-gray-600">Tipo do serviço</span>
            </div>
          </div>
        </div>

        {/* Pontos não identificados */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Pontos não identificados:</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">⚠️</span>
              <span className="text-xs text-gray-600">Grau de prioridade</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-500">⚠️</span>
              <span className="text-xs text-gray-600">Materiais necessários</span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 mt-2">
          <button className="flex-1 border border-blue-400 text-blue-500 rounded-full py-2 text-sm font-semibold">
            Salvar
          </button>
          <button className="flex-1 border border-orange-400 text-orange-500 rounded-full py-2 text-sm font-semibold">
            Descartar
          </button>
        </div>

        {/* Input IA */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            className="flex-1 text-xs text-gray-400 outline-none bg-transparent"
            placeholder="Está com dúvidas? Nos pergunte!"
          />
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
          <span className="text-xs text-gray-400">Prazos</span>
        </button>
        <button onClick={() => navigate('/servicos')} className="flex flex-col items-center gap-1">
          <span className="text-xl">📋</span>
          <span className="text-xs text-gray-400">Serviços</span>
        </button>
        <button onClick={() => navigate('/novo')} className="flex flex-col items-center gap-1">
          <span className="text-xl">➕</span>
          <span className="text-xs text-blue-500 font-semibold">Novo</span>
        </button>
      </div>

    </div>
  )
}

export default NovoServico