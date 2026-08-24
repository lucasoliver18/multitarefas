import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'
import { useServicos } from '../hooks/useServicos'
import { usePaginacao } from '../hooks/usePaginacao'
import Paginacao from '../components/Paginacao'
import PainelFiltros from '../components/PainelFiltros'
import BarraSelecao from '../components/BarraSelecao'
import { useSelecaoMultipla } from '../hooks/useSelecaoMultipla'
import { excluirEmMassa } from '../utils/exclusaoEmMassa'
import {
  badgeStatus,
  labelStatus,
  borderPrioridade,
  labelPrioridade,
  corTextoPrioridade,
  TAG_LABEL,
  STATUS_OPCOES,
  PRIORIDADE_OPCOES,
  TAG_OPCOES,
} from '../utils/status'

const SELECT = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600'
const LABEL = 'text-xs font-semibold text-slate-600 mb-1 block'

function Servicos() {
  const navigate = useNavigate()
  const toast = useToast()
  const { servicos, carregando, buscar, deletar, mudarStatus } = useServicos()
  const [menuStatus, setMenuStatus] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState('')
  const [filtroTag, setFiltroTag] = useState('')
  const [filtroPrazoDe, setFiltroPrazoDe] = useState('')
  const [filtroPrazoAte, setFiltroPrazoAte] = useState('')

  const quantidadeFiltrosAtivos = [filtroStatus, filtroPrioridade, filtroTag, filtroPrazoDe, filtroPrazoAte]
    .filter(Boolean).length

  const limparFiltros = () => {
    setFiltroStatus('')
    setFiltroPrioridade('')
    setFiltroTag('')
    setFiltroPrazoDe('')
    setFiltroPrazoAte('')
  }

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      if (filtroStatus && s.status !== filtroStatus) return false
      if (filtroPrioridade && s.prioridade !== filtroPrioridade) return false
      if (filtroTag && s.tag !== filtroTag) return false
      if ((filtroPrazoDe || filtroPrazoAte) ) {
        if (!s.prazo) return false
        if (filtroPrazoDe && s.prazo < filtroPrazoDe) return false
        if (filtroPrazoAte && s.prazo > filtroPrazoAte) return false
      }
      return true
    })
  }, [servicos, filtroStatus, filtroPrioridade, filtroTag, filtroPrazoDe, filtroPrazoAte])

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(servicosFiltrados)

  const handleDeletar = async (id) => {
    setConfirmandoId(null)
    try {
      await deletar(id)
      toast.sucesso('Serviço excluído com sucesso!')
    } catch {
      toast.erro('Erro ao excluir serviço.')
    }
  }

  const handleMudarStatus = async (id, novoStatus) => {
    setMenuStatus(null)
    try {
      await mudarStatus(id, novoStatus)
      toast.sucesso('Status atualizado!')
    } catch {
      buscar()
      toast.erro('Erro ao atualizar status.')
    }
  }

  const handleExcluirSelecionados = () => {
    toast.confirmar(`Excluir ${quantidade} serviço(s) selecionado(s)?`, async () => {
      const { sucesso, falhas } = await excluirEmMassa([...selecionados], deletar)
      cancelar()
      if (falhas.length === 0) toast.sucesso(`${sucesso} serviço(s) excluído(s) com sucesso!`)
      else if (sucesso === 0) toast.erro(`Nenhum serviço excluído (${falhas.length} falharam).`)
      else toast.alerta(`${sucesso} excluído(s), ${falhas.length} não puderam ser excluídos.`)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Serviços</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {carregando ? 'Carregando...' : servicos.length === 0 ? 'Nenhum serviço' : servicos.length === 1 ? '1 serviço' : `${servicos.length} serviços`}
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
            onClick={() => navigate('/novo')}
            className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
          >
            + Novo
          </button>
        </div>
      </div>

      {menuStatus && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuStatus(null)} />
      )}

      <div className="px-6 pt-4 flex flex-col gap-5 mb-24">
        {carregando && (
          <div className="text-center text-slate-400 text-sm mt-10">Carregando serviços...</div>
        )}
        {!carregando && servicos.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Nenhum serviço cadastrado ainda!
          </div>
        )}

        {!carregando && servicos.length > 0 && (
          <PainelFiltros quantidadeAtiva={quantidadeFiltrosAtivos} onLimpar={limparFiltros}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Status</label>
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={SELECT}>
                  <option value="">Todos</option>
                  {STATUS_OPCOES.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Prioridade</label>
                <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} className={SELECT}>
                  <option value="">Todas</option>
                  {PRIORIDADE_OPCOES.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Tag</label>
              <select value={filtroTag} onChange={e => setFiltroTag(e.target.value)} className={SELECT}>
                <option value="">Todas</option>
                {TAG_OPCOES.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Prazo de</label>
                <input type="date" value={filtroPrazoDe} onChange={e => setFiltroPrazoDe(e.target.value)} className={SELECT} />
              </div>
              <div>
                <label className={LABEL}>Prazo até</label>
                <input type="date" value={filtroPrazoAte} onChange={e => setFiltroPrazoAte(e.target.value)} className={SELECT} />
              </div>
            </div>
          </PainelFiltros>
        )}

        {!carregando && servicos.length > 0 && servicosFiltrados.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-6">
            Nenhum serviço encontrado para estes filtros.
          </div>
        )}

        {servicosFiltrados.length > 0 && (
          <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
            mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} />
        )}

        {itensPagina.map(s => (
          <div
            key={s.id}
            onClick={() => selecaoAtiva && alternarItem(s.id)}
            className={`bg-white rounded-2xl p-4 border border-slate-100 border-l-4 ${borderPrioridade(s.prioridade)} shadow-sm`}
          >
            <div className="flex justify-between items-start gap-2">
              {selecaoAtiva && (
                <input
                  type="checkbox"
                  checked={selecionados.has(s.id)}
                  onChange={() => alternarItem(s.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-5 h-5 accent-blue-600 shrink-0 mt-0.5"
                />
              )}
              <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{s.titulo}</p>
              {!selecaoAtiva && (
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
                          onClick={() => handleMudarStatus(s.id, o.val)}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 block"
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-0.5">
              <p className="text-xs text-slate-500">👤 {s.cliente}</p>
              {s.prazo && (
                <p className="text-xs text-slate-500">
                  🗓️ {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium ${corTextoPrioridade(s.prioridade)}`}>
                  {labelPrioridade(s.prioridade)}
                </span>
                {s.tag && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {TAG_LABEL[s.tag] || s.tag}
                  </span>
                )}
              </div>
            </div>

            {!selecaoAtiva && (
              <>
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
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
                  <button
                    onClick={() => navigate(`/orcamentos/${s.id}`)}
                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 py-2 rounded-xl font-semibold"
                  >
                    🧾 Orçamentos
                  </button>
                </div>

                {confirmandoId === s.id ? (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2 text-center">Excluir este serviço?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeletar(s.id)}
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
                  <div className="mt-2 flex justify-end px-1">
                    <button
                      onClick={() => setConfirmandoId(s.id)}
                      className="text-xs text-red-400 font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </>
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

export default Servicos
