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

const STATUS_OPCOES = [
  { val: 'pendente',     label: '⏳ Pendente' },
  { val: 'em_andamento', label: '🔄 Em andamento' },
  { val: 'finalizado',   label: '✔ Finalizado' },
]

function Servicos() {
  const navigate = useNavigate()
  const toast = useToast()
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [menuStatus, setMenuStatus] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)

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

  const deletarServico = async (id) => {
    setConfirmandoId(null)
    setServicos(prev => prev.filter(s => s.id !== id))
    try {
      await api.delete(`/servicos/${id}`)
      toast.sucesso('Serviço excluído com sucesso!')
    } catch {
      buscarServicos()
      toast.erro('Erro ao excluir serviço.')
    }
  }

  const mudarStatus = async (id, novoStatus) => {
    setMenuStatus(null)
    try {
      await api.patch(`/servicos/${id}`, { status: novoStatus })
      setServicos(prev => prev.map(s => s.id === id ? { ...s, status: novoStatus } : s))
      toast.sucesso('Status atualizado!')
    } catch {
      toast.erro('Erro ao atualizar status.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-5 flex justify-between items-center">
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

      {/* Backdrop para fechar menu */}
      {menuStatus && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuStatus(null)} />
      )}

      {/* Lista */}
      <div className="px-6 pt-4 flex flex-col gap-5 mb-24">
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
            {/* Título + Status */}
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{s.titulo}</p>
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuStatus(prev => prev === s.id ? null : s.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full ${badgeStatus(s.status)}`}
                >
                  {labelStatus(s.status)}
                </button>
                {menuStatus === s.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20 min-w-[150px] overflow-hidden">
                    {STATUS_OPCOES.filter(o => o.val !== s.status).map(o => (
                      <button
                        key={o.val}
                        onClick={() => mudarStatus(s.id, o.val)}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 block"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="mt-2 flex flex-col gap-0.5">
              <p className="text-xs text-slate-500">👤 {s.cliente}</p>
              {s.prazo && (
                <p className="text-xs text-slate-500">
                  🗓️ {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium ${
                  s.prioridade === 'alta' ? 'text-red-500' :
                  s.prioridade === 'media' ? 'text-amber-500' : 'text-green-600'
                }`}>
                  {s.prioridade === 'alta' ? '🔴 Alta' : s.prioridade === 'media' ? '🟠 Média' : '🟢 Baixa'}
                </span>
                {s.tag && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {TAG_LABEL[s.tag] || s.tag}
                  </span>
                )}
              </div>
            </div>

            {/* Ações primárias */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/editar/${s.id}`)}
                className="text-xs bg-[#2563eb] text-white py-2 rounded-xl font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => navigate(`/servicos/${s.id}/anotacoes`)}
                className="text-xs bg-amber-50 text-amber-700 border border-amber-100 py-2 rounded-xl font-semibold"
              >
                📝 Anotações
              </button>
            </div>

            {/* Ações secundárias / Confirmação de exclusão */}
            {confirmandoId === s.id ? (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 text-center">Excluir este serviço?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => deletarServico(s.id)}
                    className="flex-1 text-xs bg-[#dc2626] text-white py-2 rounded-xl font-semibold"
                  >
                    Sim, excluir
                  </button>
                  <button
                    onClick={() => setConfirmandoId(null)}
                    className="flex-1 text-xs bg-slate-100 text-slate-600 py-2 rounded-xl font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex justify-between px-1">
                <button
                  onClick={() => navigate(`/orcamentos/${s.id}`)}
                  className="text-xs text-slate-400 font-medium"
                >
                  Orçamentos →
                </button>
                <button
                  onClick={() => setConfirmandoId(s.id)}
                  className="text-xs text-red-400 font-medium"
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}

export default Servicos
