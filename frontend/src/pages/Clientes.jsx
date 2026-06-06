import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const TAG_LABEL = { informatica: 'Informática', pintura: 'Pintura', outros: 'Outros' }

const badgeStatus = (s) => ({
  finalizado:   'bg-[#dcfce7] text-[#166534]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  pendente:     'bg-[#fef9c3] text-[#854d0e]',
}[s] || 'bg-[#fef9c3] text-[#854d0e]')

const labelStatus = {
  finalizado: '✔ Finalizado',
  em_andamento: '🔄 Em andamento',
  pendente: '⏳ Pendente',
}

function Clientes() {
  const navigate = useNavigate()
  const toast = useToast()
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

  const deletarCliente = (id) => {
    toast.confirmar('Deseja remover este cliente?', async () => {
      try {
        await api.delete(`/clientes/${id}`)
        buscarClientes()
        if (expandido === id) setExpandido(null)
        toast.sucesso('Cliente removido!')
      } catch {
        toast.erro('Erro ao remover cliente.')
      }
    })
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
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 pt-10 pb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Clientes</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {carregando ? 'Carregando...' : clientes.length === 0 ? 'Nenhum cliente' : clientes.length === 1 ? '1 cliente' : `${clientes.length} clientes`}
            </p>
          </div>
          <button
            onClick={() => navigate('/clientes/novo')}
            className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
          >
            + Novo
          </button>
        </div>

        {/* Busca */}
        <div className="mt-4 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
          <span className="text-slate-300 text-sm">🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 text-xs text-white placeholder-slate-400 outline-none bg-transparent"
            placeholder="Buscar cliente pelo nome..."
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-slate-400 text-xs">✕</button>
          )}
        </div>
      </div>

      <div className="px-6 pt-4 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-slate-400 text-sm mt-10">Carregando clientes...</div>
        )}
        {!carregando && clientesFiltrados.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda!'}
          </div>
        )}

        {clientesFiltrados.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Card principal */}
            <div className="p-4 cursor-pointer" onClick={() => expandirCliente(c.id)}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{c.nome}</p>
                  {c.telefone && <p className="text-xs text-slate-500 mt-0.5">📞 {c.telefone}</p>}
                  {c.email && <p className="text-xs text-slate-500 mt-0.5">✉️ {c.email}</p>}
                  <p className="text-xs text-slate-400 mt-1">{totalLabel(c.servicos_count)}</p>
                </div>
                <span className="text-slate-300 text-sm ml-2">{expandido === c.id ? '▲' : '▼'}</span>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/clientes/editar/${c.id}`) }}
                  className="text-xs bg-[#2563eb] text-white px-3 py-1.5 rounded-full font-semibold"
                >
                  Editar
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deletarCliente(c.id) }}
                  className="text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-full font-semibold"
                >
                  Excluir
                </button>
              </div>
            </div>

            {/* Serviços expandidos */}
            {expandido === c.id && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500 mb-1">Serviços prestados</p>
                {!servicosCliente[c.id] ? (
                  <p className="text-xs text-slate-400">Carregando...</p>
                ) : servicosCliente[c.id].length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum serviço registrado para este cliente.</p>
                ) : (
                  servicosCliente[c.id].map(s => (
                    <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-semibold text-slate-700 flex-1 truncate">{s.titulo}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStatus(s.status)}`}>
                          {labelStatus[s.status]}
                        </span>
                      </div>
                      {s.prazo && (
                        <p className="text-xs text-slate-400 mt-1">
                          Prazo: {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {s.tag && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                          {TAG_LABEL[s.tag] || s.tag}
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
