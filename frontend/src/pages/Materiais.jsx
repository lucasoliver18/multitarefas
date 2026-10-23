import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Search, X, List, LayoutGrid } from 'lucide-react'
import Navbar from '../components/Navbar'
import Select from '../components/Select'
import EstoqueEditor from '../components/EstoqueEditor'
import { useToast } from '../hooks/useToast'
import { useMateriais } from '../hooks/useMateriais'
import { usePaginacao } from '../hooks/usePaginacao'
import Paginacao from '../components/Paginacao'
import PainelFiltros from '../components/PainelFiltros'
import BarraSelecao from '../components/BarraSelecao'
import { useSelecaoMultipla } from '../hooks/useSelecaoMultipla'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'
import { excluirEmMassa } from '../utils/exclusaoEmMassa'
import { UNIDADES, estaComEstoqueBaixo } from '../utils/materiais'
import { sanitizarNumero } from '../utils/numeros'

const SELECT = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600'
const LABEL = 'text-xs font-semibold text-slate-600 mb-1 block'

function Materiais() {
  const navigate = useNavigate()
  const toast = useToast()
  const { materiais, carregando, deletar, atualizarEstoque } = useMateriais()
  const [confirmandoId, setConfirmandoId] = useState(null)
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()
  const [searchParams, setSearchParams] = useSearchParams()

  // Visualização e filtros ficam salvos entre visitas à tela.
  const [busca, setBusca] = useEstadoPersistido('materiais:busca', '')
  const [visualizacao, setVisualizacao] = useEstadoPersistido('materiais:visualizacao', 'lista')
  const [filtroUnidade, setFiltroUnidade] = useEstadoPersistido('materiais:filtroUnidade', '')
  const [filtroPrecoMin, setFiltroPrecoMin] = useEstadoPersistido('materiais:filtroPrecoMin', '')
  const [filtroPrecoMax, setFiltroPrecoMax] = useEstadoPersistido('materiais:filtroPrecoMax', '')
  const [filtroQtdMin, setFiltroQtdMin] = useEstadoPersistido('materiais:filtroQtdMin', '')
  const [filtroQtdMax, setFiltroQtdMax] = useEstadoPersistido('materiais:filtroQtdMax', '')
  const [filtroForaEstoque, setFiltroForaEstoque] = useEstadoPersistido('materiais:filtroForaEstoque', false)
  const [filtroEstoqueBaixo, setFiltroEstoqueBaixo] = useEstadoPersistido(
    'materiais:filtroEstoqueBaixo', false, searchParams.get('estoqueBaixo') === '1' ? true : undefined
  )

  const quantidadeFiltrosAtivos = [filtroUnidade, filtroPrecoMin, filtroPrecoMax, filtroQtdMin, filtroQtdMax]
    .filter(Boolean).length

  const limparFiltros = () => {
    setFiltroUnidade('')
    setFiltroPrecoMin('')
    setFiltroPrecoMax('')
    setFiltroQtdMin('')
    setFiltroQtdMax('')
    setFiltroForaEstoque(false)
    setFiltroEstoqueBaixo(false)
  }

  const handleDeletar = async (id) => {
    setConfirmandoId(null)
    try {
      await deletar(id)
      toast.sucesso('Material removido do estoque!')
    } catch {
      toast.erro('Erro ao remover material.')
    }
  }

  const handleAlterarEstoque = async (id, novaQuantidade) => {
    try {
      await atualizarEstoque(id, novaQuantidade)
    } catch {
      toast.erro('Erro ao atualizar estoque.')
    }
  }

  const handleExcluirSelecionados = () => {
    toast.confirmar(`Remover ${quantidade} material(is) selecionado(s) do estoque?`, async () => {
      const { sucesso, falhas } = await excluirEmMassa([...selecionados], deletar)
      cancelar()
      if (falhas.length === 0) toast.sucesso(`${sucesso} material(is) removido(s) com sucesso!`)
      else if (sucesso === 0) toast.erro(`Nenhum material removido (${falhas.length} falharam).`)
      else toast.alerta(`${sucesso} removido(s), ${falhas.length} não puderam ser removidos.`)
    })
  }

  const zerados = useMemo(
    () => materiais.filter(m => parseFloat(m.quantidade_estoque) <= 0).length,
    [materiais]
  )

  const baixos = useMemo(
    () => materiais.filter(estaComEstoqueBaixo).length,
    [materiais]
  )

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter(m => {
      if (busca.trim() && !m.nome.toLowerCase().includes(busca.toLowerCase()) && !(m.marca || '').toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroUnidade && m.unidade_medida !== filtroUnidade) return false
      const preco = parseFloat(m.preco_unitario)
      if (filtroPrecoMin && preco < parseFloat(filtroPrecoMin)) return false
      if (filtroPrecoMax && preco > parseFloat(filtroPrecoMax)) return false
      const qtd = parseFloat(m.quantidade_estoque)
      if (filtroForaEstoque && qtd > 0) return false
      if (filtroEstoqueBaixo && !estaComEstoqueBaixo(m)) return false
      if (filtroQtdMin && qtd < parseFloat(filtroQtdMin)) return false
      if (filtroQtdMax && qtd > parseFloat(filtroQtdMax)) return false
      return true
    })
  }, [materiais, busca, filtroUnidade, filtroPrecoMin, filtroPrecoMax, filtroQtdMin, filtroQtdMax, filtroForaEstoque, filtroEstoqueBaixo])

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(materiaisFiltrados)

  const subtitulo = () => {
    if (carregando) return 'Carregando...'
    if (materiais.length === 0) return 'Estoque vazio'
    const total = materiais.length === 1 ? '1 item' : `${materiais.length} itens`
    const avisos = [
      zerados > 0 ? `${zerados} zerado${zerados > 1 ? 's' : ''}` : null,
      baixos > 0 ? `${baixos} baix${baixos > 1 ? 'os' : 'o'}` : null,
    ].filter(Boolean)
    return avisos.length > 0 ? `${total} • ${avisos.join(' • ')}` : total
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Materiais</h1>
            <p className={`text-xs mt-0.5 ${(zerados > 0 || baixos > 0) && !carregando ? 'text-red-300' : 'text-slate-300'}`}>
              {subtitulo()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={alternarModo}
              className="bg-white/10 text-white text-xs px-3 py-2 rounded-full font-semibold transition-all hover:bg-white/20 active:scale-[0.96]"
            >
              {selecaoAtiva ? 'Cancelar' : 'Selecionar'}
            </button>
            <button
              onClick={() => navigate('/materiais/novo')}
              className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold transition-all hover:bg-[#1e3a5f] active:scale-[0.96]"
            >
              + Novo
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
          <Search size={16} className="text-slate-300" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 text-xs text-white placeholder-slate-400 outline-none bg-transparent"
            placeholder="Buscar material pelo nome ou marca..."
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-slate-400 hover:text-white active:scale-90 transition-all">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!carregando && materiais.length > 0 && (
        <div className="px-6 pt-4 flex flex-col gap-3">
          <div className="flex justify-end">
            <div className="inline-flex bg-slate-200/70 rounded-full p-1 gap-1">
              <button
                onClick={() => setVisualizacao('lista')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  visualizacao === 'lista' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
              >
                <List size={13} />
                Lista
              </button>
              <button
                onClick={() => setVisualizacao('grade')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  visualizacao === 'grade' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
              >
                <LayoutGrid size={13} />
                Grade
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroForaEstoque(v => !v)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all active:scale-95 ${
                filtroForaEstoque ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Fora de estoque
            </button>
            <button
              onClick={() => { setFiltroEstoqueBaixo(v => !v); setSearchParams({}) }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all active:scale-95 ${
                filtroEstoqueBaixo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Estoque baixo
            </button>
          </div>
          <PainelFiltros quantidadeAtiva={quantidadeFiltrosAtivos} onLimpar={limparFiltros}>
            <div>
              <label className={LABEL}>Unidade</label>
              <Select value={filtroUnidade} onChange={e => setFiltroUnidade(e.target.value)} className={SELECT}>
                <option value="">Todas</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Preço mín. (R$)</label>
                <input type="text" inputMode="decimal" value={filtroPrecoMin}
                  onChange={e => setFiltroPrecoMin(sanitizarNumero(e.target.value, 2))} className={SELECT} />
              </div>
              <div>
                <label className={LABEL}>Preço máx. (R$)</label>
                <input type="text" inputMode="decimal" value={filtroPrecoMax}
                  onChange={e => setFiltroPrecoMax(sanitizarNumero(e.target.value, 2))} className={SELECT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Qtd. mín.</label>
                <input type="text" inputMode="decimal" value={filtroQtdMin}
                  onChange={e => setFiltroQtdMin(sanitizarNumero(e.target.value, 4))} className={SELECT} />
              </div>
              <div>
                <label className={LABEL}>Qtd. máx.</label>
                <input type="text" inputMode="decimal" value={filtroQtdMax}
                  onChange={e => setFiltroQtdMax(sanitizarNumero(e.target.value, 4))} className={SELECT} />
              </div>
            </div>
          </PainelFiltros>
        </div>
      )}

      <div className="px-6 pt-3 flex flex-col gap-3 mb-24">
        {carregando && (
          <div className="text-center text-slate-400 text-sm mt-10">Carregando materiais...</div>
        )}
        {!carregando && materiais.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            Nenhum material cadastrado ainda!
          </div>
        )}
        {!carregando && materiais.length > 0 && materiaisFiltrados.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-6">
            Nenhum material encontrado para estes critérios.
          </div>
        )}
        {materiaisFiltrados.length > 0 && (
          <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
            mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} />
        )}

        <div className={visualizacao === 'grade' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
          {itensPagina.map(m => {
            const grade = visualizacao === 'grade'
            return (
            <div
              key={m.id}
              onClick={() => selecaoAtiva && alternarItem(m.id)}
              className={`bg-white rounded-2xl border border-slate-100 shadow-sm min-w-0 ${grade ? 'p-3' : 'p-4'}`}
            >
              <div className="flex items-start gap-2">
                {selecaoAtiva && (
                  <input
                    type="checkbox"
                    checked={selecionados.has(m.id)}
                    onChange={() => alternarItem(m.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-5 h-5 accent-blue-600 shrink-0 mt-0.5"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-slate-800 truncate ${grade ? 'text-xs' : 'text-sm'}`}>{m.nome}</p>
                  {m.marca && <p className="text-xs text-slate-400 mt-0.5 truncate">{m.marca}</p>}
                </div>
              </div>
              {m.descricao && !grade && (
                <p className="text-xs text-slate-500 mt-1">{m.descricao}</p>
              )}
              <div className={grade ? 'flex flex-col gap-1.5 mt-2 items-start' : 'flex gap-3 mt-2 flex-wrap items-center'}>
                <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                  Estoque:
                  <EstoqueEditor
                    quantidade={parseFloat(m.quantidade_estoque)}
                    unidade={m.unidade_medida}
                    onAlterar={novaQuantidade => handleAlterarEstoque(m.id, novaQuantidade)}
                  />
                </span>
                <span className="text-xs text-slate-500">
                  Preço: <span className="font-semibold text-slate-800">R$ {parseFloat(m.preco_unitario).toFixed(2)}</span>
                </span>
                {parseFloat(m.quantidade_estoque) <= 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={11} />
                    Fora de estoque
                  </span>
                ) : estaComEstoqueBaixo(m) && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={11} />
                    Estoque baixo
                  </span>
                )}
              </div>

              {!selecaoAtiva && (confirmandoId === m.id ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2 text-center">Remover este material?</p>
                  <div className={grade ? 'flex flex-col gap-2' : 'flex gap-2'}>
                    <button
                      onClick={() => handleDeletar(m.id)}
                      className="flex-1 text-xs bg-[#dc2626] text-white py-2 rounded-xl font-semibold transition-all hover:bg-red-700 active:scale-[0.96]"
                    >
                      Sim, remover
                    </button>
                    <button
                      onClick={() => setConfirmandoId(null)}
                      className="flex-1 text-xs bg-slate-100 text-slate-600 py-2 rounded-xl font-semibold transition-all hover:bg-slate-200 active:scale-[0.96]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`mt-3 ${grade ? 'flex flex-col gap-2' : 'flex justify-end gap-2'}`}>
                  <button
                    onClick={() => navigate(`/materiais/editar/${m.id}`)}
                    className={`text-xs bg-[#2563eb] text-white px-3 py-1.5 rounded-full font-semibold transition-all hover:bg-[#1e3a5f] active:scale-[0.96] ${grade ? 'w-full' : ''}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmandoId(m.id)}
                    className={`text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-full font-semibold transition-all hover:bg-red-700 active:scale-[0.96] ${grade ? 'w-full' : ''}`}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )})}
        </div>
      </div>

      {selecaoAtiva ? (
        <BarraSelecao quantidade={quantidade} onExcluir={handleExcluirSelecionados} onCancelar={cancelar} />
      ) : (
        <Navbar />
      )}
    </div>
  )
}

export default Materiais
