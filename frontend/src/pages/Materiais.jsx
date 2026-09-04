import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Select from '../components/Select'
import { useToast } from '../hooks/useToast'
import { useMateriais } from '../hooks/useMateriais'
import { usePaginacao } from '../hooks/usePaginacao'
import Paginacao from '../components/Paginacao'
import PainelFiltros from '../components/PainelFiltros'
import BarraSelecao from '../components/BarraSelecao'
import { useSelecaoMultipla } from '../hooks/useSelecaoMultipla'
import { excluirEmMassa } from '../utils/exclusaoEmMassa'
import { UNIDADES } from '../utils/materiais'

const SELECT = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600'
const LABEL = 'text-xs font-semibold text-slate-600 mb-1 block'

function Materiais() {
  const navigate = useNavigate()
  const toast = useToast()
  const { materiais, carregando, deletar } = useMateriais()
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [busca, setBusca] = useState('')
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()

  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroPrecoMin, setFiltroPrecoMin] = useState('')
  const [filtroPrecoMax, setFiltroPrecoMax] = useState('')
  const [filtroQtdMin, setFiltroQtdMin] = useState('')
  const [filtroQtdMax, setFiltroQtdMax] = useState('')
  const [filtroForaEstoque, setFiltroForaEstoque] = useState(false)

  const quantidadeFiltrosAtivos = [filtroUnidade, filtroPrecoMin, filtroPrecoMax, filtroQtdMin, filtroQtdMax]
    .filter(Boolean).length

  const limparFiltros = () => {
    setFiltroUnidade('')
    setFiltroPrecoMin('')
    setFiltroPrecoMax('')
    setFiltroQtdMin('')
    setFiltroQtdMax('')
    setFiltroForaEstoque(false)
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

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter(m => {
      if (busca.trim() && !m.nome.toLowerCase().includes(busca.toLowerCase()) && !(m.marca || '').toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroUnidade && m.unidade_medida !== filtroUnidade) return false
      const preco = parseFloat(m.preco_unitario)
      if (filtroPrecoMin && preco < parseFloat(filtroPrecoMin)) return false
      if (filtroPrecoMax && preco > parseFloat(filtroPrecoMax)) return false
      const qtd = parseFloat(m.quantidade_estoque)
      if (filtroForaEstoque && qtd > 0) return false
      if (filtroQtdMin && qtd < parseFloat(filtroQtdMin)) return false
      if (filtroQtdMax && qtd > parseFloat(filtroQtdMax)) return false
      return true
    })
  }, [materiais, busca, filtroUnidade, filtroPrecoMin, filtroPrecoMax, filtroQtdMin, filtroQtdMax, filtroForaEstoque])

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(materiaisFiltrados)

  const subtitulo = () => {
    if (carregando) return 'Carregando...'
    if (materiais.length === 0) return 'Estoque vazio'
    const total = materiais.length === 1 ? '1 item' : `${materiais.length} itens`
    return zerados > 0 ? `${total} • ${zerados} zerado${zerados > 1 ? 's' : ''}` : total
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Materiais</h1>
          <p className={`text-xs mt-0.5 ${zerados > 0 && !carregando ? 'text-red-300' : 'text-slate-300'}`}>
            {subtitulo()}
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
            onClick={() => navigate('/materiais/novo')}
            className="bg-[#2563eb] text-white text-xs px-4 py-2 rounded-full font-semibold"
          >
            + Novo
          </button>
        </div>
      </div>

      {!carregando && materiais.length > 0 && (
        <div className="px-6 pt-4 flex flex-col gap-3">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar material..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={() => setFiltroForaEstoque(v => !v)}
            className={`self-start text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              filtroForaEstoque ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Fora de estoque
          </button>
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
                <input type="number" min="0" step="0.01" value={filtroPrecoMin}
                  onChange={e => setFiltroPrecoMin(e.target.value)} className={SELECT} />
              </div>
              <div>
                <label className={LABEL}>Preço máx. (R$)</label>
                <input type="number" min="0" step="0.01" value={filtroPrecoMax}
                  onChange={e => setFiltroPrecoMax(e.target.value)} className={SELECT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Qtd. mín.</label>
                <input type="number" min="0" step="0.001" value={filtroQtdMin}
                  onChange={e => setFiltroQtdMin(e.target.value)} className={SELECT} />
              </div>
              <div>
                <label className={LABEL}>Qtd. máx.</label>
                <input type="number" min="0" step="0.001" value={filtroQtdMax}
                  onChange={e => setFiltroQtdMax(e.target.value)} className={SELECT} />
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

        {itensPagina.map(m => (
          <div
            key={m.id}
            onClick={() => selecaoAtiva && alternarItem(m.id)}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
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
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{m.nome}</p>
                {m.marca && <p className="text-xs text-slate-400 mt-0.5">{m.marca}</p>}
              </div>
            </div>
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

            {!selecaoAtiva && (confirmandoId === m.id ? (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 text-center">Remover este material?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeletar(m.id)}
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
            ))}
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

export default Materiais
