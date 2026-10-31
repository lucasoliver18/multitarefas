import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, List, LayoutGrid, Plus, Pencil, Trash2, Tag } from 'lucide-react'
import Select from '../components/Select'
import Button from '../components/Button'
import ConfirmacaoCartao from '../components/ConfirmacaoCartao'
import EstoqueEditor from '../components/EstoqueEditor'
import { Pagina, CabecalhoPagina, CampoBusca, AlternadorVisualizacao, Carregando, Vazio } from '../components/Pagina'
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
import { mensagemErro } from '../utils/erros'
import { TAG_LABEL, TAG_OPCOES } from '../utils/status'
import { plural } from '../utils/texto'

const SELECT = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600'
const LABEL = 'text-xs font-semibold text-slate-600 mb-1 block'

const VISUALIZACOES = [
  { val: 'lista', label: 'Lista', icone: List },
  { val: 'grade', label: 'Grade', icone: LayoutGrid },
]

const COLUNAS_LISTA = 'grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_11rem_8rem_8rem] items-center gap-4'

const formatarPreco = (v) => parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function TagsMaterial({ tags }) {
  if (!tags?.length) return <span className="text-xs text-slate-400">Sem tag</span>
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t => (
        <span key={t} className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{TAG_LABEL[t] || t}</span>
      ))}
    </div>
  )
}

function AvisoEstoque({ m }) {
  if (parseFloat(m.quantidade_estoque) <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <AlertTriangle size={12} />
        Fora de estoque
      </span>
    )
  }
  if (estaComEstoqueBaixo(m)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
        <AlertTriangle size={12} />
        Estoque baixo
      </span>
    )
  }
  return null
}

function Materiais() {
  const navigate = useNavigate()
  const toast = useToast()
  const { materiais, carregando, deletar, atualizarEstoque } = useMateriais()
  const [confirmandoId, setConfirmandoId] = useState(null)
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()
  const [searchParams, setSearchParams] = useSearchParams()

  // Links da tela inicial (?foraEstoque=1 / ?estoqueBaixo=1) ligam o filtro e
  // ignoram os demais filtros salvos, para não esconderem o que o link mostra.
  const viaLink = searchParams.get('foraEstoque') === '1' || searchParams.get('estoqueBaixo') === '1'
  const opcoes = { ignorarSalvo: viaLink }

  const [busca, setBusca] = useEstadoPersistido('materiais:busca', '', undefined, opcoes)
  const [visualizacao, setVisualizacao] = useEstadoPersistido('materiais:visualizacao', 'lista')
  const [filtroUnidades, setFiltroUnidades] = useEstadoPersistido('materiais:filtroUnidades', [], undefined, opcoes)
  const [filtroTags, setFiltroTags] = useEstadoPersistido('materiais:filtroTags', [], undefined, opcoes)
  const [filtroPrecoMin, setFiltroPrecoMin] = useEstadoPersistido('materiais:filtroPrecoMin', '', undefined, opcoes)
  const [filtroPrecoMax, setFiltroPrecoMax] = useEstadoPersistido('materiais:filtroPrecoMax', '', undefined, opcoes)
  const [filtroQtdMin, setFiltroQtdMin] = useEstadoPersistido('materiais:filtroQtdMin', '', undefined, opcoes)
  const [filtroQtdMax, setFiltroQtdMax] = useEstadoPersistido('materiais:filtroQtdMax', '', undefined, opcoes)
  const [filtroForaEstoque, setFiltroForaEstoque] = useEstadoPersistido(
    'materiais:filtroForaEstoque', false, searchParams.get('foraEstoque') === '1' ? true : undefined, opcoes
  )
  const [filtroEstoqueBaixo, setFiltroEstoqueBaixo] = useEstadoPersistido(
    'materiais:filtroEstoqueBaixo', false, searchParams.get('estoqueBaixo') === '1' ? true : undefined, opcoes
  )

  const quantidadeFiltrosAtivos = [filtroUnidades.length > 0, filtroTags.length > 0, filtroPrecoMin, filtroPrecoMax, filtroQtdMin, filtroQtdMax]
    .filter(Boolean).length

  const limparFiltros = () => {
    setFiltroUnidades([])
    setFiltroTags([])
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
      toast.sucesso('Material removido')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao remover material.'))
    }
  }

  const handleAlterarEstoque = async (id, novaQuantidade) => {
    try {
      await atualizarEstoque(id, novaQuantidade)
      toast.sucesso('Estoque atualizado')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao atualizar estoque.'))
    }
  }

  const handleExcluirSelecionados = () => {
    toast.confirmar(`Remover ${plural(quantidade, 'material', 'materiais')}?`, async () => {
      const { sucesso, falhas } = await excluirEmMassa([...selecionados], deletar)
      cancelar()
      if (falhas.length === 0) toast.sucesso(plural(sucesso, 'material removido', 'materiais removidos'))
      else if (sucesso === 0) toast.erro('Nenhum material removido.')
      else toast.alerta(`${plural(sucesso, 'removido', 'removidos')}; ${falhas.length} com erro.`)
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
      if (filtroUnidades.length > 0 && !filtroUnidades.includes(m.unidade_medida)) return false
      // Várias tags: o material entra se tiver alguma delas ("sem" = sem nenhuma tag).
      if (filtroTags.length > 0) {
        const tags = m.tags || []
        const combina = (filtroTags.includes('sem') && tags.length === 0) || tags.some(t => filtroTags.includes(t))
        if (!combina) return false
      }
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
  }, [materiais, busca, filtroUnidades, filtroTags, filtroPrecoMin, filtroPrecoMax, filtroQtdMin, filtroQtdMax, filtroForaEstoque, filtroEstoqueBaixo])

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(materiaisFiltrados)

  // Total no cinza padrão dos subtítulos; estoque baixo em laranja e zerado
  // em vermelho (mesma paleta de alerta usada no resto do sistema).
  const subtitulo = () => {
    if (carregando) return 'Carregando...'
    if (materiais.length === 0) return 'Estoque vazio'
    return (
      <>
        {materiais.length === 1 ? '1 item' : `${materiais.length} itens`}
        {baixos > 0 && (
          <> • <span className="text-orange-600 font-medium">{baixos} baix{baixos > 1 ? 'os' : 'o'}</span></>
        )}
        {zerados > 0 && (
          <> • <span className="text-red-600 font-medium">{zerados} zerado{zerados > 1 ? 's' : ''}</span></>
        )}
      </>
    )
  }

  // Funções de renderização (e não componentes criados dentro da tela), para o
  // React não remontar os itens a cada atualização.
  const renderCheckbox = (m) => (
    <input
      type="checkbox"
      checked={selecionados.has(m.id)}
      onChange={() => alternarItem(m.id)}
      onClick={e => e.stopPropagation()}
      className="w-4 h-4 accent-blue-600 shrink-0"
    />
  )

  // A confirmação de exclusão não fica aqui: na lista ela abre numa faixa
  // abaixo da linha e na grade, no rodapé do cartão (ConfirmacaoCartao).
  const renderAcoes = (m) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(`/materiais/editar/${m.id}`)}
          aria-label="Editar"
          title="Editar"
          className="p-2 rounded-lg text-[#2563eb] hover:bg-blue-50 active:scale-90 transition-all"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => setConfirmandoId(m.id)}
          aria-label="Excluir"
          title="Excluir"
          className={`p-2 rounded-lg text-red-500 hover:bg-red-50 active:scale-90 transition-all ${confirmandoId === m.id ? 'bg-red-50' : ''}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
  )

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Materiais"
        subtitulo={subtitulo()}
        acoes={
          <>
            <Button variant="secondary" onClick={alternarModo} className="text-sm font-semibold px-4 py-2.5 rounded-xl">
              {selecaoAtiva ? 'Cancelar seleção' : 'Selecionar'}
            </Button>
            <Button onClick={() => navigate('/materiais/novo')} className="text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
              <Plus size={16} />
              Novo material
            </Button>
          </>
        }
      />

      {carregando && <Carregando texto="Carregando materiais..." />}
      {!carregando && materiais.length === 0 && <Vazio>Nenhum material cadastrado ainda!</Vazio>}

      {!carregando && materiais.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar material pelo nome ou marca..." />
              <button
                onClick={() => { setFiltroForaEstoque(v => !v); setSearchParams({}) }}
                className={`text-sm px-3.5 py-2 rounded-xl font-semibold transition-all active:scale-95 shrink-0 ${
                  filtroForaEstoque ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Fora de estoque
              </button>
              <button
                onClick={() => { setFiltroEstoqueBaixo(v => !v); setSearchParams({}) }}
                className={`text-sm px-3.5 py-2 rounded-xl font-semibold transition-all active:scale-95 shrink-0 ${
                  filtroEstoqueBaixo ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Estoque baixo
              </button>
            </div>
            <AlternadorVisualizacao opcoes={VISUALIZACOES} valor={visualizacao} onChange={setVisualizacao} />
          </div>

          <PainelFiltros quantidadeAtiva={quantidadeFiltrosAtivos} onLimpar={limparFiltros}>
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className={LABEL}>Tag</label>
                <Select multiple value={filtroTags} onChange={e => setFiltroTags(e.target.value)} className={SELECT}>
                  <option value="">Todas</option>
                  {TAG_OPCOES.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  <option value="sem">Sem tag</option>
                </Select>
              </div>
              <div>
                <label className={LABEL}>Unidade</label>
                <Select multiple value={filtroUnidades} onChange={e => setFiltroUnidades(e.target.value)} className={SELECT}>
                  <option value="">Todas</option>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </Select>
              </div>
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
              <div>
                <label className={LABEL}>Qtd. mín.</label>
                <input type="text" inputMode="decimal" value={filtroQtdMin}
                  onChange={e => setFiltroQtdMin(sanitizarNumero(e.target.value, 3))} className={SELECT} />
              </div>
              <div>
                <label className={LABEL}>Qtd. máx.</label>
                <input type="text" inputMode="decimal" value={filtroQtdMax}
                  onChange={e => setFiltroQtdMax(sanitizarNumero(e.target.value, 3))} className={SELECT} />
              </div>
            </div>
          </PainelFiltros>

          {materiaisFiltrados.length === 0 && <Vazio>Nenhum material encontrado para estes critérios.</Vazio>}

          {materiaisFiltrados.length > 0 && (
            <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
              mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} total={materiaisFiltrados.length} />
          )}

          {materiaisFiltrados.length > 0 && visualizacao === 'lista' && (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              <div className={`${COLUNAS_LISTA} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50`}>
                <span>Material</span>
                <span>Tags</span>
                <span>Situação</span>
                <span>Estoque</span>
                <span>Preço</span>
                <span>Ações</span>
              </div>
              {itensPagina.map(m => (
                <div key={m.id}>
                <div
                  onClick={() => selecaoAtiva && alternarItem(m.id)}
                  className={`${COLUNAS_LISTA} px-5 py-3 transition-colors hover:bg-slate-50 ${selecaoAtiva ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {selecaoAtiva && renderCheckbox(m)}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{m.nome}</p>
                      <p className="text-sm text-slate-500 truncate">{[m.marca, m.descricao].filter(Boolean).join(' · ') || '—'}</p>
                    </div>
                  </div>
                  <TagsMaterial tags={m.tags} />
                  <div><AvisoEstoque m={m} /></div>
                  <div onClick={e => e.stopPropagation()}>
                    <EstoqueEditor
                      quantidade={parseFloat(m.quantidade_estoque)}
                      unidade={m.unidade_medida}
                      onAlterar={novaQuantidade => handleAlterarEstoque(m.id, novaQuantidade)}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{formatarPreco(m.preco_unitario)}</span>
                  <div onClick={e => e.stopPropagation()}>
                    {!selecaoAtiva && renderAcoes(m)}
                  </div>
                </div>
                {!selecaoAtiva && confirmandoId === m.id && (
                  <div className="px-5 pb-3">
                    <div className="pt-3 border-t border-slate-100">
                      <ConfirmacaoCartao
                        mensagem="Excluir este material?"
                        onConfirmar={() => handleDeletar(m.id)}
                        onCancelar={() => setConfirmandoId(null)}
                      />
                    </div>
                  </div>
                )}
                </div>
              ))}
            </div>
          )}

          {materiaisFiltrados.length > 0 && visualizacao === 'grade' && (
            <div className="grid grid-cols-3 2xl:grid-cols-4 gap-5">
              {itensPagina.map(m => (
                <div
                  key={m.id}
                  onClick={() => selecaoAtiva && alternarItem(m.id)}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 min-w-0 ${selecaoAtiva ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {selecaoAtiva && renderCheckbox(m)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-slate-800 truncate">{m.nome}</p>
                        <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">{m.unidade_medida}</span>
                      </div>
                      <p className={`text-sm mt-1 truncate ${m.marca ? 'text-slate-600' : 'text-slate-300'}`}>{m.marca ? `Marca: ${m.marca}` : 'Sem marca'}</p>
                    </div>
                    <span className="text-base font-bold text-slate-800 shrink-0">{formatarPreco(m.preco_unitario)}</span>
                  </div>
                  {/* Áreas com altura fixa (mesmo vazias), para o campo de estoque
                      ficar sempre na mesma posição em todos os cartões. */}
                  <p className={`text-sm line-clamp-2 h-[2.75rem] ${m.descricao ? 'text-slate-600' : 'text-slate-300'}`}>
                    {m.descricao || 'Sem descrição'}
                  </p>
                  <div className="flex items-start justify-between gap-2 min-h-6">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <Tag size={13} className={`shrink-0 mt-[0.2rem] ${m.tags?.length ? 'text-slate-600' : 'text-slate-300'}`} />
                      <TagsMaterial tags={m.tags} />
                    </div>
                    <div className="shrink-0"><AvisoEstoque m={m} /></div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100 min-h-14">
                    {!selecaoAtiva && confirmandoId === m.id ? (
                      <ConfirmacaoCartao
                        mensagem="Excluir este material?"
                        onConfirmar={() => handleDeletar(m.id)}
                        onCancelar={() => setConfirmandoId(null)}
                      />
                    ) : (<>
                    <div onClick={e => e.stopPropagation()}>
                      <EstoqueEditor
                        quantidade={parseFloat(m.quantidade_estoque)}
                        unidade={m.unidade_medida}
                        onAlterar={novaQuantidade => handleAlterarEstoque(m.id, novaQuantidade)}
                      />
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      {!selecaoAtiva && renderAcoes(m)}
                    </div>
                    </>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selecaoAtiva && (
        <>
          <div className="h-16" />
          <BarraSelecao quantidade={quantidade} onExcluir={handleExcluirSelecionados} onCancelar={cancelar} />
        </>
      )}
    </Pagina>
  )
}

export default Materiais
