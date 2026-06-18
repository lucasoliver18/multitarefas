import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

function Materiais() {
  const navigate = useNavigate()
  const toast = useToast()
  const [materiais, setMateriais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [confirmandoId, setConfirmandoId] = useState(null)

  useEffect(() => {
    buscarMateriais()
  }, [])

  const buscarMateriais = async () => {
    setCarregando(true)
    try {
      const res = await api.get('/materiais')
      setMateriais(Array.isArray(res.data) ? res.data : [])
    } catch {
      setMateriais([])
    } finally {
      setCarregando(false)
    }
  }

  const deletarMaterial = async (id) => {
    setConfirmandoId(null)
    setMateriais(prev => prev.filter(m => m.id !== id))
    try {
      await api.delete(`/materiais/${id}`)
      toast.sucesso('Material removido do estoque!')
    } catch {
      buscarMateriais()
      toast.erro('Erro ao remover material.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Materiais</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {carregando ? 'Carregando...' : materiais.length === 0 ? 'Estoque vazio' : materiais.length === 1 ? '1 item no estoque' : `${materiais.length} itens no estoque`}
          </p>
        </div>
        <button
          onClick={() => navigate('/materiais/novo')}
          className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
        >
          + Novo
        </button>
      </div>

      {/* Lista */}
      <div className="px-6 pt-4 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-slate-400 text-sm mt-10">Carregando materiais...</div>
        )}
        {!carregando && materiais.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Nenhum material cadastrado ainda!
          </div>
        )}
        {materiais.map(m => (
          <div key={m.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">{m.nome}</p>
            {m.descricao && (
              <p className="text-xs text-slate-500 mt-1">{m.descricao}</p>
            )}
            <div className="flex gap-3 mt-2">
              <span className="text-xs text-slate-500">
                Estoque:{' '}
                <span className={`font-semibold ${parseFloat(m.quantidade_estoque) <= 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  {parseFloat(m.quantidade_estoque)} {m.unidade_medida}
                </span>
              </span>
              <span className="text-xs text-slate-500">
                Preço: <span className="font-semibold text-slate-800">R$ {parseFloat(m.preco_unitario).toFixed(2)}</span>
              </span>
            </div>

            {confirmandoId === m.id ? (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 text-center">Remover este material?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => deletarMaterial(m.id)}
                    className="flex-1 text-xs bg-[#dc2626] text-white py-2 rounded-xl font-semibold"
                  >
                    Sim, remover
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
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => navigate(`/materiais/editar/${m.id}`)}
                  className="text-xs bg-[#2563eb] text-white px-3 py-1.5 rounded-full font-semibold"
                >
                  Editar
                </button>
                <button
                  onClick={() => setConfirmandoId(m.id)}
                  className="text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-full font-semibold"
                >
                  Remover
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

export default Materiais
