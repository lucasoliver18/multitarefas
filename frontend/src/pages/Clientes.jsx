import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

const corStatus = { finalizado: 'text-green-500', em_andamento: 'text-blue-500', pendente: 'text-orange-500' }
const labelStatus = { finalizado: '✔ Finalizado', em_andamento: '🔄 Em andamento', pendente: '⏳ Pendente' }

function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [servicosCliente, setServicosCliente] = useState({})

  useEffect(() => {
    buscarClientes()
  }, [])

  const buscarClientes = async () => {
    setCarregando(true)
    try {
      const res = await api.get('/clientes')
      setClientes(Array.isArray(res.data) ? res.data : [])
    } catch {
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }

  const deletarCliente = async (id) => {
    if (!confirm('Deseja remover este cliente?')) return
    await api.delete(`/clientes/${id}`)
    buscarClientes()
    if (expandido === id) setExpandido(null)
  }

  const expandirCliente = async (id) => {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    if (!servicosCliente[id]) {
      const res = await api.get(`/clientes/${id}`)
      setServicosCliente(prev => ({ ...prev, [id]: res.data.servicos || [] }))
    }
  }

  const clientesFiltrados = useMemo(() =>
    clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [clientes, busca]
  )

  const totalLabel = (n) => n === 0 ? 'nenhum serviço' : n === 1 ? '1 serviço' : `${n} serviços`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      <div className="px-6 pt-10 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Clientes</h1>
            <p className="text-xs text-gray-400 mt-1">
              {carregando ? 'Carregando...' : clientes.length === 0 ? 'Nenhum cliente cadastrado' : clientes.length === 1 ? '1 cliente' : `${clientes.length} clientes`}
            </p>
          </div>
          <button
            onClick={() => navigate('/clientes/novo')}
            className="bg-blue-500 text-white text-xs px-4 py-2 rounded-full font-semibold"
          >
            + Novo
          </button>
        </div>

        {/* Busca */}
        <div className="mt-4 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 text-xs text-gray-600 outline-none bg-transparent"
            placeholder="Buscar cliente pelo nome..."
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-gray-300 text-xs">✕</button>
          )}
        </div>
      </div>

      <div className="px-6 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-gray-400 text-sm mt-10">Carregando clientes...</div>
        )}
        {!carregando && clientesFiltrados.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            {busca ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda!'}
          </div>
        )}

        {clientesFiltrados.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Card principal */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => expandirCliente(c.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{c.nome}</p>
                  {c.telefone && (
                    <p className="text-xs text-gray-500 mt-0.5">📞 {c.telefone}</p>
                  )}
                  {c.email && (
                    <p className="text-xs text-gray-500 mt-0.5">✉️ {c.email}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{totalLabel(c.servicos_count)}</p>
                </div>
                <span className="text-gray-300 text-sm ml-2">{expandido === c.id ? '▲' : '▼'}</span>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/clientes/editar/${c.id}`) }}
                  className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-semibold"
                >
                  Editar
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deletarCliente(c.id) }}
                  className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-semibold"
                >
                  Excluir
                </button>
              </div>
            </div>

            {/* Serviços expandidos */}
            {expandido === c.id && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 mb-1">Serviços prestados</p>
                {!servicosCliente[c.id] ? (
                  <p className="text-xs text-gray-400">Carregando...</p>
                ) : servicosCliente[c.id].length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum serviço registrado para este cliente.</p>
                ) : (
                  servicosCliente[c.id].map(s => (
                    <div key={s.id} className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-semibold text-gray-700 flex-1 truncate">{s.titulo}</p>
                        <span className={`text-xs font-semibold shrink-0 ${corStatus[s.status]}`}>
                          {labelStatus[s.status]}
                        </span>
                      </div>
                      {s.prazo && (
                        <p className="text-xs text-gray-400 mt-1">
                          Prazo: {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {s.tag && (
                        <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full mt-1">
                          #{s.tag}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}

export default Clientes
