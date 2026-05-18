import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

const corStatus = {
  pendente: 'text-orange-500',
  aprovado: 'text-green-500',
  reprovado: 'text-red-500',
}

const labelStatus = {
  pendente: '⏳ Pendente',
  aprovado: '✔ Aprovado',
  reprovado: '✘ Reprovado',
}

function Orcamentos() {
  const { servicoId } = useParams()
  const navigate = useNavigate()
  const [orcamentos, setOrcamentos] = useState([])
  const [servico, setServico] = useState(null)
  const [carregando, setCarregando] = useState(true)

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
    if (!confirm('Deseja reprovar este orçamento?')) return
    try {
      const res = await api.patch(`/orcamentos/${id}/reprovar`)
      setOrcamentos(prev => prev.map(o => o.id === id ? res.data : o))
    } catch (e) {
      alert(e.response?.data?.message || 'Erro ao reprovar orçamento.')
    }
  }

  const aprovar = async (id) => {
    if (!confirm('Deseja aprovar este orçamento?')) return
    try {
      const res = await api.patch(`/orcamentos/${id}/aprovar`)
      setOrcamentos(prev => prev.map(o => o.id === id ? res.data : o))
    } catch (e) {
      alert(e.response?.data?.message || 'Erro ao aprovar orçamento.')
    }
  }

  if (carregando) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      <div className="px-6 pt-10 pb-4">
        <button onClick={() => navigate('/servicos')} className="text-xs text-gray-400 mb-2">← Serviços</button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Orçamentos</h1>
            {servico && <p className="text-xs text-gray-500 mt-1">{servico.titulo}</p>}
          </div>
          <button
            onClick={() => navigate(`/orcamentos/${servicoId}/novo`)}
            className="bg-blue-500 text-white text-xs px-4 py-2 rounded-full font-semibold"
          >
            + Novo
          </button>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-3 mb-24">
        {orcamentos.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Nenhum orçamento cadastrado para este serviço.
          </div>
        )}

        {orcamentos.map(o => {
          const valorMateriais = (o.materiais || []).reduce((acc, m) => {
            return acc + parseFloat(m.pivot.quantidade) * parseFloat(m.pivot.preco_unitario_snapshot)
          }, 0)
          const valorFinal = valorMateriais * (1 + parseFloat(o.margem_lucro) / 100)

          return (
            <div key={o.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{o.titulo}</p>
                  {o.descricao && <p className="text-xs text-gray-500 mt-1">{o.descricao}</p>}
                </div>
                <span className={`text-xs font-semibold ${corStatus[o.status]}`}>
                  {labelStatus[o.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1">
                <p className="text-xs text-gray-500">
                  Materiais: <span className="font-semibold text-gray-800">R$ {valorMateriais.toFixed(2)}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Margem: <span className="font-semibold text-gray-800">{o.margem_lucro}%</span>
                </p>
                <p className="text-xs text-gray-700 font-bold">
                  Total: R$ {valorFinal.toFixed(2)}
                </p>
              </div>

              {(o.materiais || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.materiais.map(m => (
                    <span key={m.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {m.nome} × {parseFloat(m.pivot.quantidade)} {m.unidade_medida}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3">
                {o.status !== 'aprovado' && (
                  <button
                    onClick={() => aprovar(o.id)}
                    className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-semibold"
                  >
                    Aprovar
                  </button>
                )}
                {o.status !== 'reprovado' && (
                  <button
                    onClick={() => reprovar(o.id)}
                    className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-semibold"
                  >
                    Reprovar
                  </button>
                )}
                <button
                  onClick={() => navigate(`/orcamentos/${servicoId}/editar/${o.id}`)}
                  className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-semibold"
                >
                  Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Navbar />
    </div>
  )
}

export default Orcamentos
