import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { List, LayoutList, Kanban, AlertTriangle, Plus } from 'lucide-react'
import Button from '../components/Button'
import { Pagina, CabecalhoPagina, CampoBusca, AlternadorVisualizacao, Carregando, Vazio } from '../components/Pagina'
import FiltrosServicos from '../components/servicos/FiltrosServicos'
import ModalServicos from '../components/servicos/ModalServicos'
import {
  ServicoCardKanban, ColunaKanban, ServicoLinha, CabecalhoListaServicos, ServicoCardDetalhado, FecharMenuStatus,
} from '../components/servicos/ItensServico'
import { useToast } from '../hooks/useToast'
import { useServicos } from '../hooks/useServicos'
import { useFiltrosServicos, useServicosFiltrados } from '../hooks/useFiltrosServicos'
import { useAcoesServico } from '../hooks/useAcoesServico'
import { usePaginacao } from '../hooks/usePaginacao'
import { useServicosOrdenados } from '../hooks/useServicosOrdenados'
import Paginacao from '../components/Paginacao'
import BarraSelecao from '../components/BarraSelecao'
import { useSelecaoMultipla } from '../hooks/useSelecaoMultipla'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'
import { excluirEmMassa } from '../utils/exclusaoEmMassa'
import { hojeISO } from '../utils/prazos'
import { mensagemErro } from '../utils/erros'
import { STATUS_ICONE, STATUS_OPCOES, labelStatus } from '../utils/status'
import { plural } from '../utils/texto'

// Cada coluna do quadro mostra no máximo 3 serviços; o restante fica no modal
// "Ver mais", que por padrão busca só prazos do próximo mês (não carrega a
// base inteira de uma vez).
const LIMITE_POR_COLUNA = 3

const periodoPadraoModal = () => {
  const hoje = new Date()
  const fim = new Date(hoje)
  fim.setMonth(fim.getMonth() + 1)
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { prazoDe: iso(hoje), prazoAte: iso(fim) }
}

const VISUALIZACOES = [
  { val: 'kanban', label: 'Quadro', icone: Kanban },
  { val: 'lista', label: 'Lista', icone: List },
  { val: 'detalhado', label: 'Detalhado', icone: LayoutList },
]

function Servicos() {
  const navigate = useNavigate()
  const toast = useToast()
  const { servicos, carregando, buscar, deletar, mudarStatus, mudarPago } = useServicos()
  const acoes = useAcoesServico({ deletar, mudarStatus, mudarPago, buscar })
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()
  const [searchParams, setSearchParams] = useSearchParams()
  const hojeStr = hojeISO()

  const [visualizacao, setVisualizacao] = useEstadoPersistido('servicos:visualizacao', 'kanban')
  const filtros = useFiltrosServicos({
    prefixo: 'servicos',
    valoresIniciais: {
      busca: searchParams.get('busca'),
      status: searchParams.get('status'),
      situacaoPrazo: searchParams.get('vencidos') === '1' ? 'atrasado' : undefined,
      pago: searchParams.get('pago'),
      orcamento: searchParams.get('orcamento'),
    },
  })
  const filtrados = useServicosFiltrados(servicos, filtros)
  const [colunaModal, setColunaModal] = useState(null)

  // Ao fechar o modal, recarrega em silêncio (status/pagamento podem ter mudado nele).
  const fecharModal = useCallback(() => {
    setColunaModal(null)
    buscar()
  }, [buscar])

  const servicosOrdenados = useServicosOrdenados(filtrados)

  const servicosPorStatus = useMemo(() => {
    const grupos = { pendente: [], em_andamento: [], finalizado: [] }
    servicosOrdenados.forEach(s => { (grupos[s.status] ?? grupos.pendente).push(s) })
    return grupos
  }, [servicosOrdenados])

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(servicosOrdenados)

  // Arrastar entre colunas salva o status direto, sem confirmação.
  const sensoresArraste = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return
    const servico = servicos.find(s => s.id === active.id)
    const novoStatus = over.id
    if (!servico || servico.status === novoStatus) return

    try {
      await mudarStatus(servico.id, novoStatus)
      const exigeOrcamento = (novoStatus === 'em_andamento' || novoStatus === 'finalizado') && !servico.tem_orcamento_aprovado
      if (exigeOrcamento) {
        toast.alerta('Status atualizado. Serviço sem orçamento aprovado.')
      } else {
        toast.sucesso('Status atualizado')
      }
    } catch (e) {
      buscar()
      toast.erro(mensagemErro(e, 'Erro ao atualizar status.'))
    }
  }

  const handleExcluirSelecionados = () => {
    toast.confirmar(`Excluir ${plural(quantidade, 'serviço', 'serviços')}?`, async () => {
      const { sucesso, falhas } = await excluirEmMassa([...selecionados], deletar)
      cancelar()
      if (falhas.length === 0) toast.sucesso(plural(sucesso, 'serviço excluído', 'serviços excluídos'))
      else if (sucesso === 0) toast.erro('Nenhum serviço excluído.')
      else toast.alerta(`${plural(sucesso, 'excluído', 'excluídos')}; ${falhas.length} com erro.`)
    })
  }

  const ctx = { navigate, hojeStr, selecaoAtiva, selecionados, alternarItem, ...acoes }

  const subtitulo = carregando ? 'Carregando...'
    : servicos.length === 0 ? 'Nenhum serviço'
    : servicos.length === 1 ? '1 serviço'
    : `${servicos.length} serviços`

  return (
    <Pagina largura="max-w-[1600px]">
      <CabecalhoPagina
        titulo="Serviços"
        subtitulo={subtitulo}
        acoes={
          <>
            <Button variant="secondary" onClick={alternarModo} className="text-sm font-semibold px-4 py-2.5 rounded-xl">
              {selecaoAtiva ? 'Cancelar seleção' : 'Selecionar'}
            </Button>
            <Button onClick={() => navigate('/novo')} className="text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
              <Plus size={16} />
              Novo serviço
            </Button>
          </>
        }
      />

      <FecharMenuStatus ctx={ctx} />

      {carregando && <Carregando texto="Carregando serviços..." />}
      {!carregando && servicos.length === 0 && <Vazio>Nenhum serviço cadastrado ainda!</Vazio>}

      {!carregando && servicos.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4">
            <CampoBusca valor={filtros.busca} onChange={filtros.setBusca} placeholder="Buscar serviço pelo título ou cliente..." />
            <AlternadorVisualizacao opcoes={VISUALIZACOES} valor={visualizacao} onChange={setVisualizacao} />
          </div>

          {filtros.valores.situacaoPrazo === 'atrasado' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-red-700 inline-flex items-center gap-2">
                <AlertTriangle size={16} />
                Mostrando apenas serviços em atraso
              </span>
              <button
                onClick={() => { filtros.setters.situacaoPrazo(''); setSearchParams({}) }}
                className="text-sm text-red-700 underline font-medium shrink-0 hover:text-red-900 active:scale-95 transition-all"
              >
                Ver todos os serviços
              </button>
            </div>
          )}

          <FiltrosServicos filtros={filtros} />

          {filtrados.length === 0 && <Vazio>Nenhum serviço encontrado para estes filtros.</Vazio>}

          {visualizacao === 'kanban' && filtrados.length > 0 && (
            <DndContext sensors={sensoresArraste} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-3 gap-5 items-start">
                {STATUS_OPCOES.map(coluna => {
                  const todosItens = servicosPorStatus[coluna.val] || []
                  const itens = todosItens.slice(0, LIMITE_POR_COLUNA)
                  const restantes = todosItens.length - itens.length
                  const IconeColuna = STATUS_ICONE[coluna.val]
                  return (
                    <ColunaKanban key={coluna.val} id={coluna.val}>
                      <div className="flex items-center justify-between px-1">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                          <IconeColuna size={16} className="text-slate-500 shrink-0" />
                          {coluna.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 bg-white rounded-full px-2.5 py-0.5">{todosItens.length}</span>
                      </div>
                      {itens.length === 0 ? (
                        <div className="text-center text-sm text-slate-400 py-10 border-2 border-dashed border-slate-300/70 rounded-xl">
                          Nenhum serviço
                        </div>
                      ) : itens.map(s => <ServicoCardKanban key={s.id} s={s} ctx={ctx} />)}
                      {restantes > 0 && (
                        <button
                          onClick={() => setColunaModal(coluna.val)}
                          className="text-sm text-blue-600 font-semibold text-center py-2 bg-white/70 border border-dashed border-blue-200 rounded-xl hover:bg-white active:scale-[0.98] transition-all"
                        >
                          Ver mais ({restantes})
                        </button>
                      )}
                    </ColunaKanban>
                  )
                })}
              </div>
            </DndContext>
          )}

          {visualizacao !== 'kanban' && filtrados.length > 0 && (
            <>
              <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
                mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} total={filtrados.length} />

              {visualizacao === 'lista' ? (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  <CabecalhoListaServicos />
                  {itensPagina.map(s => <ServicoLinha key={s.id} s={s} ctx={ctx} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 2xl:grid-cols-3 gap-5">
                  {itensPagina.map(s => <ServicoCardDetalhado key={s.id} s={s} ctx={ctx} />)}
                </div>
              )}
            </>
          )}
        </>
      )}

      <ModalServicos
        aberto={!!colunaModal}
        chave={colunaModal}
        titulo={colunaModal ? `Serviços: ${labelStatus(colunaModal)}` : ''}
        subtitulo="Clique em um serviço para editá-lo"
        parametros={{ status: colunaModal }}
        filtrosIniciais={periodoPadraoModal()}
        ocultarFiltros={['status']}
        onFechar={fecharModal}
      />

      {selecaoAtiva && (
        <>
          <div className="h-16" />
          <BarraSelecao quantidade={quantidade} onExcluir={handleExcluirSelecionados} onCancelar={cancelar} />
        </>
      )}
    </Pagina>
  )
}

export default Servicos
