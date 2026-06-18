import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const badgeOrcStatus = (s) => ({
  aprovado:  'bg-[#dcfce7] text-[#166534]',
  reprovado: 'bg-[#fee2e2] text-[#991b1b]',
  pendente:  'bg-[#fef9c3] text-[#854d0e]',
}[s] || 'bg-[#fef9c3] text-[#854d0e]')

const labelStatus = { pendente: '⏳ Pendente', aprovado: '✔ Aprovado', reprovado: '✘ Reprovado' }

function Orcamentos() {
  const { servicoId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [orcamentos, setOrcamentos] = useState([])
  const [servico, setServico] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [confirmando, setConfirmando] = useState(null) // { id, acao }

  useEffect(() => {
    Promise.all([
      api.get(`/servicos/${servicoId}/orcamentos`),
      api.get(`/servicos/${servicoId}`),
    ]).then(([resOrc, resSrv]) => {
      setOrcamentos(resOrc.data)
      setServico(resSrv.data)
    }).finally(() => setCarregando(false))
  }, [servicoId])

  const reprovar = async (id) => {
    setConfirmando(null)
    try {
      const res = await api.patch(`/orcamentos/${id}/reprovar`)
      setOrcamentos(prev => prev.map(o => o.id === id ? res.data : o))
      toast.sucesso('Orçamento reprovado.')
    } catch (e) {
      toast.erro(e.response?.data?.message || 'Erro ao reprovar orçamento.')
    }
  }

  const aprovar = async (id) => {
    setConfirmando(null)
    try {
      const res = await api.patch(`/orcamentos/${id}/aprovar`)
      setOrcamentos(prev => prev.map(o => o.id === id ? res.data : o))
      toast.sucesso('Orçamento aprovado!')
    } catch (e) {
      toast.erro(e.response?.data?.message || 'Erro ao aprovar orçamento.')
    }
  }

  if (carregando) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate('/servicos')} className="text-xs text-slate-300 mb-3">← Serviços</button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Orçamentos</h1>
            {servico && <p className="text-xs text-slate-300 mt-0.5">{servico.titulo}</p>}
          </div>
          <button
            onClick={() => navigate(`/orcamentos/${servicoId}/novo`)}
            className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
          >
            + Novo
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3 mb-24">
        {orcamentos.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Nenhum orçamento cadastrado para este serviço.
          </div>
        )}

        {orcamentos.map(o => {
          const valorMateriais = (o.materiais || []).reduce((acc, m) =>
            acc + parseFloat(m.pivot.quantidade) * parseFloat(m.pivot.preco_unitario_snapshot), 0)
          const valorFinal = valorMateriais * (1 + parseFloat(o.margem_lucro) / 100)

          return (
            <div key={o.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{o.titulo}</p>
                  {o.descricao && <p className="text-xs text-slate-500 mt-1">{o.descricao}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeOrcStatus(o.status)}`}>
                  {labelStatus[o.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1">
                <p className="text-xs text-slate-500">
                  Materiais: <span className="font-semibold text-slate-800">R$ {valorMateriais.toFixed(2)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Margem: <span className="font-semibold text-slate-800">{o.margem_lucro}%</span>
                </p>
                <p className="text-xs text-slate-700 font-bold">
                  Total: R$ {valorFinal.toFixed(2)}
                </p>
              </div>

              {(o.materiais || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.materiais.map(m => (
                    <span key={m.id} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                      {m.nome} × {parseFloat(m.pivot.quantidade)} {m.unidade_medida}
                    </span>
                  ))}
                </div>
              )}

              {confirmando?.id === o.id ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2 text-center">
                    {confirmando.acao === 'aprovar' ? 'Aprovar este orçamento?' : 'Reprovar este orçamento?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmando.acao === 'aprovar' ? aprovar(o.id) : reprovar(o.id)}
                      className={`flex-1 text-xs text-white py-2 rounded-xl font-semibold ${confirmando.acao === 'aprovar' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`}
                    >
                      {confirmando.acao === 'aprovar' ? 'Sim, aprovar' : 'Sim, reprovar'}
                    </button>
                    <button
                      onClick={() => setConfirmando(null)}
                      className="flex-1 text-xs bg-slate-100 text-slate-600 py-2 rounded-xl font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-2 mt-3 flex-wrap">
                  {o.status !== 'aprovado' && (
                    <button
                      onClick={() => setConfirmando({ id: o.id, acao: 'aprovar' })}
                      className="text-xs bg-[#16a34a] text-white px-3 py-1.5 rounded-full font-semibold"
                    >
                      Aprovar
                    </button>
                  )}
                  {o.status !== 'reprovado' && (
                    <button
                      onClick={() => setConfirmando({ id: o.id, acao: 'reprovar' })}
                      className="text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-full font-semibold"
                    >
                      Reprovar
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/orcamentos/${servicoId}/editar/${o.id}`)}
                    className="text-xs bg-[#2563eb] text-white px-3 py-1.5 rounded-full font-semibold"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Navbar />
    </div>
  )
}

export default Orcamentos
