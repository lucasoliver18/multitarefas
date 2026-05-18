import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function Servicos() {
  const navigate = useNavigate()
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarServicos()
  }, [])

  const buscarServicos = async () => {
    setCarregando(true)
    try {
      const res = await api.get('/servicos')
      setServicos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setServicos([])
    } finally {
      setCarregando(false)
    }
  }

  const deletarServico = async (id) => {
    if (confirm('Deseja deletar este serviço?')) {
      await api.delete(`/servicos/${id}`)
      buscarServicos()
    }
  }

  const corPrioridade = (p) => {
    if (p === 'alta') return 'text-red-500'
    if (p === 'media') return 'text-orange-500'
    return 'text-green-500'
  }

  const corStatus = (s) => {
    if (s === 'finalizado') return 'text-green-500'
    if (s === 'em_andamento') return 'text-blue-500'
    return 'text-orange-500'
  }

  const labelStatus = (s) => {
    if (s === 'finalizado') return '✔ Finalizado'
    if (s === 'em_andamento') return '🔄 Em andamento'
    return '⏳ Pendente'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Serviços</h1>
          <p className="text-xs text-gray-400 mt-1">
            {carregando ? 'Carregando...' : servicos.length === 0 ? 'Nenhum serviço cadastrado' : servicos.length === 1 ? '1 serviço cadastrado' : `${servicos.length} serviços cadastrados`}
          </p>
        </div>
        <button
          onClick={() => navigate('/novo')}
          className="bg-blue-500 text-white text-xs px-4 py-2 rounded-full font-semibold"
        >
          + Novo
        </button>
      </div>

      {/* Lista */}
      <div className="px-6 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-gray-400 text-sm mt-10">Carregando serviços...</div>
        )}
        {!carregando && servicos.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Nenhum serviço cadastrado ainda!
          </div>
        )}
        {servicos.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-semibold text-gray-800">{s.titulo}</p>
                <p className="text-xs text-gray-500 mt-1">Cliente: {s.cliente}</p>
                {s.prazo && (
                  <p className="text-xs text-gray-500">
                    Prazo: {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
                {s.tag && (
                  <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full mt-1">
                    #{s.tag}
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold shrink-0 ${corPrioridade(s.prioridade)}`}>
                {s.prioridade === 'alta' ? '🔺 Alta' : s.prioridade === 'media' ? '🔸 Média' : '🔻 Baixa'}
              </span>
            </div>

            <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
              <span className={`text-xs font-semibold ${corStatus(s.status)}`}>
                {labelStatus(s.status)}
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`/orcamentos/${s.id}`)}
                  className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-semibold"
                >
                  Orçamentos
                </button>
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
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}

export default Servicos
