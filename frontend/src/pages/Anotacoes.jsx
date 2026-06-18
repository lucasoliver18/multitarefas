import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

function Anotacoes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [servico, setServico] = useState(null)
  const [anotacoes, setAnotacoes] = useState([])
  const [novaAnotacao, setNovaAnotacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/servicos/${id}`),
      api.get(`/servicos/${id}/anotacoes`),
    ]).then(([resServico, resAnotacoes]) => {
      setServico(resServico.data)
      setAnotacoes(Array.isArray(resAnotacoes.data) ? resAnotacoes.data : [])
    }).catch(() => {
      toast.erro('Erro ao carregar anotações.')
    }).finally(() => setCarregando(false))
  }, [id])

  const salvarAnotacao = async () => {
    if (!novaAnotacao.trim()) return
    setSalvando(true)
    try {
      const res = await api.post(`/servicos/${id}/anotacoes`, { conteudo: novaAnotacao.trim() })
      setAnotacoes(prev => [res.data, ...prev])
      setNovaAnotacao('')
      toast.sucesso('Anotação salva!')
    } catch {
      toast.erro('Erro ao salvar anotação.')
    } finally {
      setSalvando(false)
    }
  }

  const deletarAnotacao = (anotacaoId) => {
    toast.confirmar('Remover esta anotação?', async () => {
      try {
        await api.delete(`/anotacoes/${anotacaoId}`)
        setAnotacoes(prev => prev.filter(a => a.id !== anotacaoId))
        toast.sucesso('Anotação removida.')
      } catch {
        toast.erro('Erro ao remover anotação.')
      }
    })
  }

  const formatarData = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (carregando) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate(-1)} className="text-xs text-slate-300 mb-3 block">← Voltar</button>
        <h1 className="text-lg font-bold text-white">Anotações</h1>
        {servico && (
          <p className="text-xs text-slate-300 mt-0.5 truncate">{servico.titulo}</p>
        )}
      </div>

      {/* Nova anotação */}
      <div className="px-6 pt-5 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-600 mb-2">Nova anotação</p>
          <textarea
            value={novaAnotacao}
            onChange={e => setNovaAnotacao(e.target.value)}
            placeholder="Escreva sua anotação aqui..."
            rows={4}
            className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={salvarAnotacao}
            disabled={salvando || !novaAnotacao.trim()}
            className="mt-3 w-full bg-[#2563eb] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : '+ Salvar anotação'}
          </button>
        </div>
      </div>

      {/* Lista de anotações */}
      <div className="px-6 flex flex-col gap-3">
        {anotacoes.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8 bg-white rounded-2xl border border-slate-100">
            Nenhuma anotação ainda.<br />
            <span className="text-xs">Adicione a primeira acima!</span>
          </div>
        ) : (
          anotacoes.map(a => (
            <div key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-xs text-slate-400">{formatarData(a.created_at)}</span>
                <button
                  onClick={() => deletarAnotacao(a.id)}
                  className="text-xs text-red-400 font-semibold shrink-0"
                >
                  Remover
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{a.conteudo}</p>
            </div>
          ))
        )}
      </div>

      <Navbar />
    </div>
  )
}

export default Anotacoes
