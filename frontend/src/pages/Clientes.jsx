import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, Phone, Mail, List, LayoutGrid, Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../services/api'
import StatusBadge from '../components/StatusBadge'
import ComboboxAsync from '../components/ComboboxAsync'
import Select from '../components/Select'
import Button from '../components/Button'
import ConfirmacaoCartao from '../components/ConfirmacaoCartao'
import PainelFiltros from '../components/PainelFiltros'
import ModalServicosCliente from '../components/ModalServicosCliente'
import { Pagina, CabecalhoPagina, CampoBusca, AlternadorVisualizacao, Carregando, Vazio } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { useClientes, buscarClientesPagina } from '../hooks/useClientes'
import { usePaginacao } from '../hooks/usePaginacao'
import Paginacao from '../components/Paginacao'
import BarraSelecao from '../components/BarraSelecao'
import { useSelecaoMultipla } from '../hooks/useSelecaoMultipla'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'
import { excluirEmMassa } from '../utils/exclusaoEmMassa'
import { mensagemErro } from '../utils/erros'
import { TAG_LABEL } from '../utils/status'
import { plural } from '../utils/texto'

const SELECT = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600'
const LABEL = 'text-xs font-semibold text-slate-600 mb-1 block'
// Ao expandir um cliente, mostra só os mais recentes; o resto fica no modal.
const LIMITE_SERVICOS = 4

// Colunas da visualização em lista. Larguras fixas (sem "auto"): cada linha é
// uma grade própria, e uma coluna automática desalinharia as linhas entre si.
const COLUNAS_LISTA = 'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.6fr)_8rem_6rem] items-center gap-4'

const VISUALIZACOES = [
  { val: 'lista', label: 'Lista', icone: List },
  { val: 'grade', label: 'Grade', icone: LayoutGrid },
]

const totalLabel = (n) => n === 0 ? 'Nenhum serviço' : n === 1 ? '1 serviço' : `${n} serviços`

function Clientes() {
  const navigate = useNavigate()
  const toast = useToast()
  const { clientes, carregando, buscar, deletar, transferirServicos } = useClientes()
  const [busca, setBusca] = useEstadoPersistido('clientes:busca', '')
  const [visualizacao, setVisualizacao] = useEstadoPersistido('clientes:visualizacao', 'lista')
  const [expandido, setExpandido] = useState(null)
  const [servicosCliente, setServicosCliente] = useState({})
  const [clienteModal, setClienteModal] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [transferindoCliente, setTransferindoCliente] = useState(null)
  const [novoClienteId, setNovoClienteId] = useState('')
  const [novoClienteTexto, setNovoClienteTexto] = useState('')
  const [filtroTipoPessoa, setFiltroTipoPessoa] = useEstadoPersistido('clientes:filtroTipoPessoa', '')
  const [filtroServicos, setFiltroServicos] = useEstadoPersistido('clientes:filtroServicos', '')
  const { ativo: selecaoAtiva, selecionados, alternarModo, alternarItem, cancelar, quantidade } = useSelecaoMultipla()

  const quantidadeFiltrosAtivos = [filtroTipoPessoa, filtroServicos].filter(Boolean).length

  const limparFiltros = () => {
    setFiltroTipoPessoa('')
    setFiltroServicos('')
  }

  const carregarServicosCliente = useCallback(async (id) => {
    const res = await api.get('/servicos', { params: { cliente_id: id } })
    setServicosCliente(prev => ({ ...prev, [id]: Array.isArray(res.data) ? res.data : [] }))
  }, [])

  const handleDeletar = async (id) => {
    setConfirmandoId(null)
    if (expandido === id) setExpandido(null)
    try {
      await deletar(id)
      toast.sucesso('Cliente removido')
    } catch (err) {
      const count = err.response?.status === 422 ? err.response?.data?.servicos_count : null
      if (count) {
        setTransferindoCliente({ id, count })
      } else {
        toast.erro(mensagemErro(err, 'Erro ao remover cliente.'))
      }
    }
  }

  const cancelarTransferencia = () => {
    setTransferindoCliente(null)
    setNovoClienteId('')
    setNovoClienteTexto('')
  }

  const handleTransferirEExcluir = async (id) => {
    try {
      await transferirServicos(id, novoClienteId)
      await deletar(id)
      await buscar()
      setServicosCliente({})
      toast.sucesso('Serviços transferidos e cliente removido')
    } catch (e) {
      await buscar()
      toast.erro(mensagemErro(e, 'Erro ao transferir serviços.'))
    } finally {
      cancelarTransferencia()
    }
  }

  const expandirCliente = async (id) => {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    if (!servicosCliente[id]) {
      try {
        await carregarServicosCliente(id)
      } catch (e) {
        setExpandido(null)
        toast.erro(mensagemErro(e, 'Erro ao carregar serviços.'))
      }
    }
  }

  // Ao fechar o modal, atualiza em silêncio a prévia do cliente (status,
  // pagamento ou exclusões feitos no modal) e a contagem da listagem.
  const fecharModal = useCallback(() => {
    const id = clienteModal?.id
    setClienteModal(null)
    if (id) {
      carregarServicosCliente(id).catch(() => {})
      buscar()
    }
  }, [clienteModal, carregarServicosCliente, buscar])

  const handleExcluirSelecionados = () => {
    toast.confirmar(`Excluir ${plural(quantidade, 'cliente', 'clientes')}?`, async () => {
      const { sucesso, falhas } = await excluirEmMassa([...selecionados], deletar)
      cancelar()
      await buscar()
      if (falhas.length === 0) toast.sucesso(plural(sucesso, 'cliente excluído', 'clientes excluídos'))
      else if (sucesso === 0) toast.erro('Nenhum excluído: todos têm serviços vinculados.')
      else toast.alerta(`${plural(sucesso, 'excluído', 'excluídos')}; ${falhas.length} com serviços vinculados.`)
    })
  }

  const clientesFiltrados = useMemo(() =>
    clientes.filter(c => {
      if (!c.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroTipoPessoa && c.tipo_pessoa !== filtroTipoPessoa) return false
      if (filtroServicos === 'com' && !(c.servicos_count > 0)) return false
      if (filtroServicos === 'sem' && !(c.servicos_count === 0)) return false
      return true
    }),
    [clientes, busca, filtroTipoPessoa, filtroServicos]
  )

  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(clientesFiltrados)

  const subtitulo = carregando ? 'Carregando...'
    : clientes.length === 0 ? 'Nenhum cliente'
    : clientes.length === 1 ? '1 cliente'
    : `${clientes.length} clientes`

  // Os blocos abaixo são funções de renderização (e não componentes criados
  // dentro da tela), para o React não remontá-los a cada atualização.

  const renderTransferencia = (c) => {
    const outros = clientes.filter(o => o.id !== c.id)
    return (
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-slate-600">
          Este cliente tem {transferindoCliente.count} serviço{transferindoCliente.count !== 1 ? 's' : ''} vinculado{transferindoCliente.count !== 1 ? 's' : ''}.
          Escolha outro cliente para transferir os serviços antes de excluir:
        </p>
        {outros.length === 0 ? (
          <p className="text-sm text-amber-600">Cadastre outro cliente antes de excluir este.</p>
        ) : (
          <div className="max-w-md">
            <ComboboxAsync
              valor={novoClienteTexto}
              onChangeTexto={texto => { setNovoClienteTexto(texto); setNovoClienteId('') }}
              onSelecionar={o => { setNovoClienteTexto(o.nome); setNovoClienteId(o.id) }}
              buscarPagina={(termo, pag) => buscarClientesPagina(termo, pag)
                .then(r => ({ ...r, itens: r.itens.filter(o => o.id !== c.id) }))}
              renderItem={o => <span>{o.nome}</span>}
              placeholder="Buscar cliente..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => handleTransferirEExcluir(c.id)} disabled={!novoClienteId}
            className="text-sm px-4 py-2 rounded-lg font-semibold">
            Transferir e excluir
          </Button>
          <Button variant="ghost" onClick={cancelarTransferencia} className="text-sm px-4 py-2 rounded-lg font-semibold">
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // A confirmação de exclusão não fica aqui: na lista ela abre numa faixa
  // abaixo da linha e na grade, no rodapé do cartão (ConfirmacaoCartao).
  const renderAcoes = (c) => {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => navigate(`/clientes/editar/${c.id}`)}
          aria-label="Editar" title="Editar"
          className="p-2 rounded-lg text-[#2563eb] hover:bg-blue-50 active:scale-90 transition-all"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => setConfirmandoId(c.id)}
          aria-label="Excluir" title="Excluir"
          className={`p-2 rounded-lg text-red-500 hover:bg-red-50 active:scale-90 transition-all ${confirmandoId === c.id ? 'bg-red-50' : ''}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    )
  }

  const renderServicosDoCliente = (c, colunas = 'grid-cols-2') => {
    const lista = servicosCliente[c.id]
    return (
      <div className="entrada-suave border-t border-slate-100 bg-slate-50 px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Serviços prestados{lista?.length > LIMITE_SERVICOS ? ` · ${LIMITE_SERVICOS} mais recentes de ${lista.length}` : ''}
          </p>
        </div>
        {!lista ? (
          <p className="aparecer-com-atraso text-sm text-slate-400">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum serviço registrado para este cliente.</p>
        ) : (
          <>
            <div className={`grid ${colunas} gap-2`}>
              {lista.slice(0, LIMITE_SERVICOS).map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/editar/${s.id}`)}
                  className="bg-white rounded-xl px-4 py-3 border border-slate-200 text-left transition-colors hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-semibold text-slate-700 flex-1 truncate">{s.titulo}</p>
                    <StatusBadge status={s.status} className="px-2 py-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {s.prazo && (
                      <span className="text-xs text-slate-500">
                        Prazo: {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {s.tag && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {TAG_LABEL[s.tag] || s.tag}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {lista.length > LIMITE_SERVICOS && (
              <button
                onClick={() => setClienteModal({ id: c.id, nome: c.nome })}
                className="self-center mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] bg-white border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 active:scale-[0.97] transition-all"
              >
                Ver todos os {lista.length} serviços
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  const renderCheckbox = (c) => (
    <input
      type="checkbox"
      checked={selecionados.has(c.id)}
      onChange={() => alternarItem(c.id)}
      onClick={e => e.stopPropagation()}
      className="w-4 h-4 accent-blue-600 shrink-0"
    />
  )

  const renderDocumento = (c) => (
    <span className="text-sm text-slate-600">
      {c.cpf ? `CPF: ${c.cpf}` : c.cnpj ? `CNPJ: ${c.cnpj}` : '—'}
    </span>
  )

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Clientes"
        subtitulo={subtitulo}
        acoes={
          <>
            <Button variant="secondary" onClick={alternarModo} className="text-sm font-semibold px-4 py-2.5 rounded-xl">
              {selecaoAtiva ? 'Cancelar seleção' : 'Selecionar'}
            </Button>
            <Button onClick={() => navigate('/clientes/novo')} className="text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
              <Plus size={16} />
              Novo cliente
            </Button>
          </>
        }
      />

      {carregando && <Carregando texto="Carregando clientes..." />}

      {!carregando && clientes.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4">
            <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar cliente pelo nome..." />
            <AlternadorVisualizacao opcoes={VISUALIZACOES} valor={visualizacao} onChange={setVisualizacao} />
          </div>

          <PainelFiltros quantidadeAtiva={quantidadeFiltrosAtivos} onLimpar={limparFiltros}>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={LABEL}>Tipo de pessoa</label>
                <Select value={filtroTipoPessoa} onChange={e => setFiltroTipoPessoa(e.target.value)} className={SELECT}>
                  <option value="">Todos</option>
                  <option value="fisica">Pessoa Física</option>
                  <option value="juridica">Pessoa Jurídica</option>
                </Select>
              </div>
              <div>
                <label className={LABEL}>Serviços vinculados</label>
                <Select value={filtroServicos} onChange={e => setFiltroServicos(e.target.value)} className={SELECT}>
                  <option value="">Todos</option>
                  <option value="com">Com serviços</option>
                  <option value="sem">Sem serviços</option>
                </Select>
              </div>
            </div>
          </PainelFiltros>
        </>
      )}

      {!carregando && clientesFiltrados.length === 0 && (
        <Vazio>
          {busca || quantidadeFiltrosAtivos > 0 ? 'Nenhum cliente encontrado para estes critérios.' : 'Nenhum cliente cadastrado ainda!'}
        </Vazio>
      )}

      {clientesFiltrados.length > 0 && (
        <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
          mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} total={clientesFiltrados.length} />
      )}

      {clientesFiltrados.length > 0 && visualizacao === 'lista' && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div className={`${COLUNAS_LISTA} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50`}>
            <span>Cliente</span>
            <span>Documento</span>
            <span>Contato</span>
            <span>Serviços</span>
            <span>Ações</span>
          </div>
          {itensPagina.map(c => (
            <div key={c.id}>
              <div
                onClick={() => selecaoAtiva ? alternarItem(c.id) : expandirCliente(c.id)}
                className={`${COLUNAS_LISTA} px-5 py-3 cursor-pointer transition-colors hover:bg-slate-50`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {selecaoAtiva && renderCheckbox(c)}
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.nome}</p>
                  <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                    {c.tipo_pessoa === 'juridica' ? 'PJ' : 'PF'}
                  </span>
                </div>
                {renderDocumento(c)}
                <div className="flex flex-col min-w-0">
                  {c.telefone && <span className="text-sm text-slate-600 inline-flex items-center gap-1.5"><Phone size={13} />{c.telefone}</span>}
                  {c.email && <span className="text-sm text-slate-600 inline-flex items-center gap-1.5 truncate"><Mail size={13} className="shrink-0" /><span className="truncate">{c.email}</span></span>}
                  {!c.telefone && !c.email && <span className="text-sm text-slate-400">Sem contato</span>}
                </div>
                {/* A seta indica que a linha abre os serviços do cliente (o clique é na linha toda). */}
                <span className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                  {totalLabel(c.servicos_count)}
                  {!selecaoAtiva && (
                    <span className="text-slate-400 shrink-0" aria-hidden="true">
                      {expandido === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  )}
                </span>
                <div>{!selecaoAtiva && transferindoCliente?.id !== c.id && renderAcoes(c)}</div>
              </div>
              {!selecaoAtiva && confirmandoId === c.id && (
                <div className="px-5 pb-3">
                  <div className="pt-3 border-t border-slate-100">
                    <ConfirmacaoCartao
                      mensagem="Excluir este cliente?"
                      onConfirmar={() => handleDeletar(c.id)}
                      onCancelar={() => setConfirmandoId(null)}
                    />
                  </div>
                </div>
              )}
              {!selecaoAtiva && transferindoCliente?.id === c.id && (
                <div className="px-5 pb-4">{renderTransferencia(c)}</div>
              )}
              {!selecaoAtiva && expandido === c.id && renderServicosDoCliente(c)}
            </div>
          ))}
        </div>
      )}

      {clientesFiltrados.length > 0 && visualizacao === 'grade' && (
        <div className="grid grid-cols-3 2xl:grid-cols-4 gap-5 items-start">
          {itensPagina.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
              <div
                className="p-5 cursor-pointer transition-colors hover:bg-slate-50"
                onClick={() => selecaoAtiva ? alternarItem(c.id) : expandirCliente(c.id)}
              >
                <div className="flex items-start gap-3">
                  {selecaoAtiva && renderCheckbox(c)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-slate-800 truncate">{c.nome}</p>
                      <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                        {c.tipo_pessoa === 'juridica' ? 'PJ' : 'PF'}
                      </span>
                    </div>
                    <div className="mt-1">{renderDocumento(c)}</div>
                    {/* Linhas sempre presentes para todos os cartões terem a mesma altura. */}
                    <p className={`text-sm mt-1 flex items-center gap-1.5 ${c.telefone ? 'text-slate-600' : 'text-slate-300'}`}>
                      <Phone size={13} className="shrink-0" />{c.telefone || 'Sem telefone'}
                    </p>
                    <p className={`text-sm mt-0.5 flex items-center gap-1.5 truncate ${c.email ? 'text-slate-600' : 'text-slate-300'}`}>
                      <Mail size={13} className="shrink-0" /><span className="truncate">{c.email || 'Sem e-mail'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 min-h-[3.25rem]">
                  {!selecaoAtiva && confirmandoId === c.id ? (
                    <ConfirmacaoCartao
                      mensagem="Excluir este cliente?"
                      onConfirmar={() => handleDeletar(c.id)}
                      onCancelar={() => setConfirmandoId(null)}
                    />
                  ) : (
                    <>
                      <span className="text-sm text-slate-500">{totalLabel(c.servicos_count)}</span>
                      {!selecaoAtiva && transferindoCliente?.id !== c.id && renderAcoes(c)}
                    </>
                  )}
                </div>
                {!selecaoAtiva && transferindoCliente?.id === c.id && renderTransferencia(c)}
              </div>
              {!selecaoAtiva && expandido === c.id && renderServicosDoCliente(c, 'grid-cols-1')}
            </div>
          ))}
        </div>
      )}

      {selecaoAtiva && (
        <>
          <div className="h-16" />
          <BarraSelecao quantidade={quantidade} onExcluir={handleExcluirSelecionados} onCancelar={cancelar} />
        </>
      )}

      <ModalServicosCliente cliente={clienteModal} onFechar={fecharModal} />
    </Pagina>
  )
}

export default Clientes
