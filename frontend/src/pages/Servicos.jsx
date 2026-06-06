import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const TAG_LABEL = { informatica: 'Informática', pintura: 'Pintura', outros: 'Outros' }

const borderPrioridade = (p) => {
  if (p === 'alta')  return 'border-l-[#dc2626]'
  if (p === 'media') return 'border-l-[#ca8a04]'
  return 'border-l-[#16a34a]'
}

const badgeStatus = (s) => {
  if (s === 'finalizado')   return 'bg-[#dcfce7] text-[#166534]'
  if (s === 'em_andamento') return 'bg-[#dbeafe] text-[#1e40af]'
  return 'bg-[#fef9c3] text-[#854d0e]'
}

const labelStatus = (s) => {
  if (s === 'finalizado')   return '✔ Finalizado'
  if (s === 'em_andamento') return '🔄 Em andamento'
  return '⏳ Pendente'
}

function Servicos() {
  const navigate = useNavigate()
  const toast = useToast()
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
    } catch {
      setServicos([])
    } finally {
      setCarregando(false)
    }
  }

  const deletarServico = (id) => {
    toast.confirmar('Deseja excluir este serviço?', async () => {
      try {
        await api.delete(`/servicos/${id}`)
        buscarServicos()
        toast.sucesso('Serviço excluído com sucesso!')
      } catch {
        toast.erro('Erro ao excluir serviço.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 pt-10 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Serviços</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {carregando ? 'Carregando...' : servicos.length === 0 ? 'Nenhum serviço' : servicos.length === 1 ? '1 serviço' : `${servicos.length} serviços`}
          </p>
        </div>
        <button
          onClick={() => navigate('/novo')}
          className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
        >
          + Novo
        </button>
      </div>

      {/* Lista */}
      <div className="px-6 pt-4 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-slate-400 text-sm mt-10">Carregando serviços...</div>
        )}
        {!carregando && servicos.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Nenhum serviço cadastrado ainda!
          </div>
        )}

        {servicos.map(s => (
          <div
            key={s.id}
            className={`bg-white rounded-2xl p-4 border border-slate-100 border-l-4 ${borderPrioridade(s.prioridade)} shadow-sm`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-semibold text-slate-800">{s.titulo}</p>
                <p className="text-xs text-slate-500 mt-1">Cliente: {s.cliente}</p>
                {s.prazo && (
                  <p className="text-xs text-slate-500">
                    Prazo: {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
                {s.tag && (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                    {TAG_LABEL[s.tag] || s.tag}
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStatus(s.status)}`}>
                {labelStatus(s.status)}
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-3 flex-wrap">
              <button
                onClick={() => navigate(`/orcamentos/${s.id}`)}
                className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-semibold"
              >
                Orçamentos
              </button>
              <button
                onClick={() => navigate(`/editar/${s.id}`)}
                className="text-xs bg-[#2563eb] text-white px-3 py-1.5 rounded-full font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => deletarServico(s.id)}
                className="text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-full font-semibold"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}

export default Servicos
