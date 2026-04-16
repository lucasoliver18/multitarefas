import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Servicos() {
  const navigate = useNavigate()
  const [servicos, setServicos] = useState([])

  useEffect(() => {
    buscarServicos()
  }, [])

  const buscarServicos = async () => {
    const res = await api.get('/servicos')
    setServicos(res.data)
  }

  const deletarServico = async (id) => {
    if (confirm('Deseja deletar este serviço?')) {
      await api.delete(`/servicos/${id}`)
      buscarServicos()
    }
  }

  const corPrioridade = (prioridade) => {
    if (prioridade === 'alta') return 'text-red-500'
    if (prioridade === 'media') return 'text-orange-500'
    return 'text-green-500'
  }

  const corStatus = (status) => {
    if (status === 'finalizado') return 'text-green-500'
    if (status === 'em_andamento') return 'text-blue-500'
    return 'text-orange-500'
  }

  const labelStatus = (status) => {
    if (status === 'finalizado') return '✔ Finalizado'
    if (status === 'em_andamento') return '🔄 Em andamento'
    return '⏳ Pendente'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-lg font-bold text-gray-800">Serviços</h1>
        <p className="text-xs text-gray-400 mt-1">{servicos.length} serviço(s) cadastrado(s)</p>
      </div>

      {/* Lista de serviços */}
      <div className="px-6 flex flex-col gap-3 mb-24">
        {servicos.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Nenhum serviço cadastrado ainda!
          </div>
        )}
        {servicos.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{s.titulo}</p>
                <p className="text-xs text-gray-500 mt-1">Cliente: {s.cliente}</p>
                {s.prazo && (
                  <p className="text-xs text-gray-500">Prazo: {new Date(s.prazo).toLocaleDateString('pt-BR')}</p>
                )}
                {s.tag && (
                  <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full mt-1">{s.tag}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-semibold ${corPrioridade(s.prioridade)}`}>
                  {s.prioridade === 'alta' ? '🔺 Alta' : s.prioridade === 'media' ? '🔺 Média' : '🔻 Baixa'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <span className={`text-xs font-semibold ${corStatus(s.status)}`}>
                {labelStatus(s.status)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/editar/${s.id}`)}
                  className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-semibold"
                >
                  Editar
                </button>
                <button
                  onClick={() => deletarServico(s.id)}
                  className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-semibold"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        ))}
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
          <span className="text-xs text-blue-500 font-semibold">Serviços</span>
        </button>
        <button onClick={() => navigate('/novo')} className="flex flex-col items-center gap-1">
          <span className="text-xl">➕</span>
          <span className="text-xs text-gray-400">Novo</span>
        </button>
      </div>

    </div>
  )
}

export default Servicos