import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function Materiais() {
  const navigate = useNavigate()
  const [materiais, setMateriais] = useState([])
  const [carregando, setCarregando] = useState(true)

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
    if (confirm('Deseja remover este material do estoque?')) {
      await api.delete(`/materiais/${id}`)
      buscarMateriais()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      <div className="px-6 pt-10 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Materiais</h1>
          <p className="text-xs text-gray-400 mt-1">
            {carregando ? 'Carregando...' : materiais.length === 0 ? 'Nenhum material no estoque' : materiais.length === 1 ? '1 material no estoque' : `${materiais.length} materiais no estoque`}
          </p>
        </div>
        <button
          onClick={() => navigate('/materiais/novo')}
          className="bg-blue-500 text-white text-xs px-4 py-2 rounded-full font-semibold"
        >
          + Novo
        </button>
      </div>

      <div className="px-6 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-gray-400 text-sm mt-10">Carregando materiais...</div>
        )}
        {!carregando && materiais.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Nenhum material cadastrado ainda!
          </div>
        )}
        {materiais.map(m => (
          <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">{m.nome}</p>
            {m.descricao && (
              <p className="text-xs text-gray-500 mt-1">{m.descricao}</p>
            )}
            <div className="flex gap-3 mt-2">
              <span className="text-xs text-gray-500">
                Estoque:{' '}
                <span className={`font-semibold ${parseFloat(m.quantidade_estoque) <= 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {parseFloat(m.quantidade_estoque)} {m.unidade_medida}
                </span>
              </span>
              <span className="text-xs text-gray-500">
                Preço: <span className="font-semibold text-gray-800">R$ {parseFloat(m.preco_unitario).toFixed(2)}</span>
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => navigate(`/materiais/editar/${m.id}`)}
                className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => deletarMaterial(m.id)}
                className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-semibold"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}

export default Materiais
