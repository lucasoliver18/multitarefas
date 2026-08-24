import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'
import { useClientes } from '../hooks/useClientes'
import { usePaginacao } from '../hooks/usePaginacao'
import Paginacao from '../components/Paginacao'
import BarraSelecao from '../components/BarraSelecao'
import { useSelecaoMultipla } from '../hooks/useSelecaoMultipla'
import { excluirEmMassa } from '../utils/exclusaoEmMassa'
import { TAG_LABEL, badgeStatus, labelStatus } from '../utils/status'

function Clientes() {
  const navigate = useNavigate()
  const toast = useToast()
  const { clientes, carregando, buscar, deletar, transferirServicos } = useClientes()
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [servicosCliente, setServicosCliente] = useState({})
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [transferindoCliente, setTransferindoCliente] = useState(null)
  const [novoClienteId, setNovoClienteId] = useState('')
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()

  const handleDeletar = async (id) => {
    setConfirmandoId(null)
    if (expandido === id) setExpandido(null)
    try {
      await deletar(id)
      toast.sucesso('Cliente removido!')
    } catch (err) {
      const count = err.response?.status === 422 ? err.response?.data?.servicos_count : null
      if (count) {
        setTransferindoCliente({ id, count })
      } else {
        toast.erro('Erro ao remover cliente.')
      }
    }
  }

  const handleTransferirEExcluir = async (id) => {
    try {
      await transferirServicos(id, novoClienteId)
      await deletar(id)
      await buscar()
      toast.sucesso('Serviços transferidos e cliente removido!')
    } catch {
      toast.erro('Erro ao transferir/excluir cliente.')
    } finally {
      setTransferindoCliente(null)
      setNovoClienteId('')
    }
  }

  const expandirCliente = async (id) => {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    if (!servicosCliente[id]) {
      const res = await api.get(`/clientes/${id}`)
      setServicosCliente(prev => ({ ...prev, [id]: res.data.servicos || [] }))
    }
  }

  const handleExcluirSelecionados = () => {
    toast.confirmar(`Excluir ${quantidade} cliente(s) selecionado(s)?`, async () => {
      const { sucesso, falhas } = await excluirEmMassa([...selecionados], deletar)
      cancelar()
      await buscar()
      if (falhas.length === 0) toast.sucesso(`${sucesso} cliente(s) excluído(s) com sucesso!`)
      else if (sucesso === 0) toast.erro(`Nenhum cliente excluído: todos os ${falhas.length} possuem serviços vinculados.`)
      else toast.alerta(`${sucesso} excluído(s), ${falhas.length} não puderam ser excluídos por terem serviços vinculados.`)
    })
  }

  const clientesFiltrados = useMemo(() =>
    clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [clientes, busca]
  )

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(clientesFiltrados)

  const totalLabel = (n) => n === 0 ? 'nenhum serviço' : n === 1 ? '1 serviço' : `${n} serviços`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Clientes</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {carregando ? 'Carregando...' : clientes.length === 0 ? 'Nenhum cliente' : clientes.length === 1 ? '1 cliente' : `${clientes.length} clientes`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={alternarModo}
              className="bg-white/10 text-white text-xs px-3 py-2 rounded-full font-semibold"
            >
              {selecaoAtiva ? 'Cancelar' : 'Selecionar'}
            </button>
            <button
              onClick={() => navigate('/clientes/novo')}
              className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
            >
              + Novo
            </button>
          </div>
        </div>

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

        {clientesFiltrados.length > 0 && (
          <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
            mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} />
        )}

        {itensPagina.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              className="p-4 cursor-pointer"
              onClick={() => selecaoAtiva ? alternarItem(c.id) : expandirCliente(c.id)}
            >
              <div className="flex justify-between items-start">
                {selecaoAtiva && (
                  <input
                    type="checkbox"
                    checked={selecionados.has(c.id)}
                    onChange={() => alternarItem(c.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-5 h-5 accent-blue-600 shrink-0 mr-3 mt-0.5"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{c.nome}</p>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                      {c.tipo_pessoa === 'juridica' ? 'PJ' : 'PF'}
                    </span>
                  </div>
                  {c.cpf && <p className="text-xs text-slate-500 mt-0.5">CPF: {c.cpf}</p>}
                  {c.cnpj && <p className="text-xs text-slate-500 mt-0.5">CNPJ: {c.cnpj}</p>}
                  {c.telefone && <p className="text-xs text-slate-500 mt-0.5">📞 {c.telefone}</p>}
                  {c.email && <p className="text-xs text-slate-500 mt-0.5">✉️ {c.email}</p>}
                  <p className="text-xs text-slate-400 mt-1">{totalLabel(c.servicos_count)}</p>
                </div>
                {!selecaoAtiva && (
                  <span className="text-slate-300 text-sm ml-2">{expandido === c.id ? '▲' : '▼'}</span>
                )}
              </div>

              {!selecaoAtiva && (transferindoCliente?.id === c.id ? (
                <div className="mt-3 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                  <p className="text-xs text-slate-500 mb-2">
                    Este cliente tem {transferindoCliente.count} serviço{transferindoCliente.count !== 1 ? 's' : ''} vinculado{transferindoCliente.count !== 1 ? 's' : ''}.
                    Escolha outro cliente para transferir os serviços antes de excluir:
                  </p>
                  {clientes.filter(o => o.id !== c.id).length === 0 ? (
                    <p className="text-xs text-amber-600 mb-2">Cadastre outro cliente antes de excluir este.</p>
                  ) : (
                    <select
                      value={novoClienteId}
                      onChange={e => setNovoClienteId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600 mb-2"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clientes.filter(o => o.id !== c.id).map(o => (
                        <option key={o.id} value={o.id}>{o.nome}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransferirEExcluir(c.id)}
                      disabled={!novoClienteId}
                      className="flex-1 text-xs bg-[#dc2626] text-white py-2 rounded-xl font-semibold disabled:opacity-40"
                    >
                      Transferir e excluir
                    </button>
                    <button
                      onClick={() => { setTransferindoCliente(null); setNovoClienteId('') }}
                      className="flex-1 text-xs bg-slate-100 text-slate-600 py-2 rounded-xl font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : confirmandoId === c.id ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2 text-center">Remover este cliente?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleDeletar(c.id) }}
                      className="flex-1 text-xs bg-[#dc2626] text-white py-2 rounded-xl font-semibold"
                    >
                      Sim, remover
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmandoId(null) }}
                      className="flex-1 text-xs bg-slate-100 text-slate-600 py-2 rounded-xl font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/clientes/editar/${c.id}`) }}
                    className="text-xs bg-[#2563eb] text-white px-3 py-1.5 rounded-full font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmandoId(c.id) }}
                    className="text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-full font-semibold"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>

            {!selecaoAtiva && expandido === c.id && (
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
                          {labelStatus(s.status)}
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

      {selecaoAtiva ? (
        <BarraSelecao quantidade={quantidade} onExcluir={handleExcluirSelecionados} onCancelar={cancelar} />
      ) : (
        <Navbar />
      )}
    </div>
  )
}

export default Clientes
