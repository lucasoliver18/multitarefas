import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '../components/Button'
import CampoData from '../components/CampoData'
import ModalServicosDia from '../components/servicos/ModalServicosDia'
import {
  StatusAcao, TagBadge, PagoBadge, OrcamentoBadge, AtalhosServico, ConfirmacaoServico, FecharMenuStatus,
} from '../components/servicos/ItensServico'
import { Pagina, CabecalhoPagina } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { useServicos } from '../hooks/useServicos'
import { useAcoesServico } from '../hooks/useAcoesServico'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'
import {
  TAG_LABEL,
  STATUS_OPCOES,
  PRIORIDADE_OPCOES,
  PESO_PRIORIDADE,
  borderPrioridade,
  corFundoPrioridade,
} from '../utils/status'
import { hojeISO, estaVencido, dataValida } from '../utils/prazos'
import { plural } from '../utils/texto'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TAGS_FIXAS = ['informatica', 'pintura', 'outros']
const LIMITE_VENCIDOS = 4
// A lista do dia mostra no máximo 4 serviços; o restante fica no modal "Ver mais".
const LIMITE_POR_DIA = 4
// Cada dia mostra bolinhas coloridas com a quantidade de serviços: uma por
// prioridade (serviços em aberto) e uma cinza para os finalizados. Os nomes
// ficam no painel ao lado, ao selecionar o dia.
const INDICADORES = [
  { chave: 'alta',       rotulos: ['serviço de prioridade alta', 'serviços de prioridade alta'],   cor: corFundoPrioridade('alta') },
  { chave: 'media',      rotulos: ['serviço de prioridade média', 'serviços de prioridade média'], cor: corFundoPrioridade('media') },
  { chave: 'baixa',      rotulos: ['serviço de prioridade baixa', 'serviços de prioridade baixa'], cor: corFundoPrioridade('baixa') },
  { chave: 'finalizado', rotulos: ['serviço finalizado', 'serviços finalizados'],                 cor: 'bg-slate-400' },
]

const indicadoresDoDia = (servicosDoDia) => {
  const contagem = {}
  servicosDoDia.forEach(s => {
    const chave = s.status === 'finalizado' ? 'finalizado' : (s.prioridade || 'media')
    contagem[chave] = (contagem[chave] || 0) + 1
  })
  return INDICADORES
    .filter(ind => contagem[ind.chave])
    .map(ind => ({ ...ind, quantidade: contagem[ind.chave] }))
}

function Prazos() {
  const navigate = useNavigate()
  const toast = useToast()
  const hoje = new Date()
  const hojeStr = hojeISO()

  // ?data=AAAA-MM-DD (ex.: vindo da agenda da tela inicial) abre o calendário
  // já nesse dia, sem filtros salvos que possam esconder os serviços dele.
  const [searchParams] = useSearchParams()
  const dataLink = dataValida(searchParams.get('data') || '') ? searchParams.get('data') : null
  const [anoLink, mesLink, diaLink] = dataLink ? dataLink.split('-').map(Number) : []
  const opcoes = { ignorarSalvo: !!dataLink }

  const { servicos, mudarStatus: mudarStatusHook, deletar, mudarPago, buscar } = useServicos()
  const [ano, setAno] = useState(anoLink ?? hoje.getFullYear())
  const [mes, setMes] = useState(dataLink ? mesLink - 1 : hoje.getMonth())
  const [diaSelecionado, setDiaSelecionado] = useState(diaLink ?? hoje.getDate())
  const [filtroTags, setFiltroTags] = useEstadoPersistido('prazos:filtroTags', [], undefined, opcoes)
  // Prioridade e status aceitam várias opções ao mesmo tempo, como as tags.
  // (Chaves novas: as antigas guardavam um valor só.)
  const [filtroPrioridades, setFiltroPrioridades] = useEstadoPersistido('prazos:filtroPrioridades', [], undefined, opcoes)
  const [filtroStatus, setFiltroStatus] = useEstadoPersistido('prazos:filtroStatusLista', [], undefined, opcoes)
  const [modalDiaAberto, setModalDiaAberto] = useState(false)
  const fecharModalDia = useCallback(() => setModalDiaAberto(false), [])

  // Mesmas ações (status, pago, excluir) e peças das visualizações de Serviços.
  const acoes = useAcoesServico({ deletar, mudarStatus: mudarStatusHook, mudarPago, buscar })
  const ctx = { navigate, hojeStr, selecaoAtiva: false, ...acoes }

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      if (filtroTags.length > 0 && !filtroTags.includes(s.tag)) return false
      if (filtroPrioridades.length > 0 && !filtroPrioridades.includes(s.prioridade)) return false
      if (filtroStatus.length > 0 && !filtroStatus.includes(s.status)) return false
      return true
    })
  }, [servicos, filtroTags, filtroPrioridades, filtroStatus])

  // Usa a lista sem filtros: o aviso deve mostrar todos os prazos vencidos.
  const vencidos = useMemo(() =>
    servicos
      .filter(s => estaVencido(s, hojeStr))
      .sort((a, b) => {
        const prioA = PESO_PRIORIDADE[a.prioridade] ?? 1
        const prioB = PESO_PRIORIDADE[b.prioridade] ?? 1
        if (prioA !== prioB) return prioA - prioB
        return a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0
      }),
    [servicos, hojeStr]
  )

  const semPrazo = useMemo(() =>
    servicosFiltrados.filter(s => !s.prazo && s.status !== 'finalizado'),
    [servicosFiltrados]
  )

  const dataStr = (d) => `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const servicosPorData = useMemo(() => {
    const mapa = {}
    servicosFiltrados.forEach(s => {
      if (!s.prazo) return
      ;(mapa[s.prazo] ??= []).push(s)
    })
    Object.values(mapa).forEach(lista => lista.sort((a, b) => (PESO_PRIORIDADE[a.prioridade] ?? 1) - (PESO_PRIORIDADE[b.prioridade] ?? 1)))
    return mapa
  }, [servicosFiltrados])

  const servicosDiaSelecionado = diaSelecionado ? (servicosPorData[dataStr(diaSelecionado)] || []) : []

  // Sempre 6 semanas (42 células) para o calendário ter a mesma altura em todos os meses.
  const semanas = useMemo(() => {
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()
    const diasMesAnterior = new Date(ano, mes, 0).getDate()
    const primeiroDia = new Date(ano, mes, 1).getDay()

    const celulas = []
    for (let i = primeiroDia - 1; i >= 0; i--) {
      celulas.push({ dia: diasMesAnterior - i, mesAtual: false })
    }
    for (let dia = 1; dia <= diasNoMes; dia++) {
      celulas.push({ dia, mesAtual: true })
    }
    let diaProximo = 1
    while (celulas.length < 42) {
      celulas.push({ dia: diaProximo++, mesAtual: false })
    }

    const resultado = []
    for (let i = 0; i < 42; i += 7) {
      resultado.push(celulas.slice(i, i + 7))
    }
    return resultado
  }, [ano, mes])

  const mesAnterior = () => {
    setMes(m => { if (m === 0) { setAno(a => a - 1); return 11 } return m - 1 })
    setDiaSelecionado(null)
  }

  const proximoMes = () => {
    setMes(m => { if (m === 11) { setAno(a => a + 1); return 0 } return m + 1 })
    setDiaSelecionado(null)
  }

  const irParaHoje = () => {
    setAno(hoje.getFullYear())
    setMes(hoje.getMonth())
    setDiaSelecionado(hoje.getDate())
    setDataEspecifica('')
  }

  // "Data específica": leva o calendário direto ao mês da data e seleciona o
  // dia, sem precisar passar mês a mês. O campo só emite datas completas e válidas.
  const [dataEspecifica, setDataEspecifica] = useState('')

  const irParaData = (e) => {
    const valor = e.target.value
    setDataEspecifica(valor)
    if (!valor) return
    const [a, m, d] = valor.split('-').map(Number)
    setAno(a)
    setMes(m - 1)
    setDiaSelecionado(d)
  }

  const toggleTag = (tag) =>
    setFiltroTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const alternarNaLista = (setLista) => (valor) =>
    setLista(prev => prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor])
  const togglePrioridade = alternarNaLista(setFiltroPrioridades)
  const toggleStatus = alternarNaLista(setFiltroStatus)
  const limparFiltros = () => { setFiltroTags([]); setFiltroPrioridades([]); setFiltroStatus([]) }
  const temFiltroAtivo = filtroTags.length > 0 || filtroPrioridades.length > 0 || filtroStatus.length > 0

  const chip = (ativo) =>
    `text-sm px-3 py-1 rounded-lg font-medium transition-all active:scale-95 ${ativo ? 'bg-[#2563eb] text-white hover:bg-[#1e3a5f]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`

  // Função de renderização (e não componente criado dentro da tela), para o
  // React não remontar os cartões a cada atualização.
  const renderCardServico = (s) => (
    <div
      key={s.id}
      onClick={() => navigate(`/editar/${s.id}`)}
      className={`bg-white rounded-xl p-4 border border-slate-200 border-l-4 ${borderPrioridade(s.prioridade)} cursor-pointer transition-shadow hover:shadow-md`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{s.titulo}</p>
          <p className="text-sm text-slate-500 truncate">{s.cliente}</p>
        </div>
        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <StatusAcao s={s} ctx={ctx} className="px-2 py-0.5" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <TagBadge s={s} />
        <PagoBadge s={s} ctx={ctx} />
        <OrcamentoBadge s={s} />
      </div>

      <div className="flex items-center justify-end mt-2.5 pt-2.5 border-t border-slate-100 min-h-[2.75rem]" onClick={e => e.stopPropagation()}>
        {acoes.confirmandoId === s.id
          ? <ConfirmacaoServico s={s} ctx={ctx} />
          : <AtalhosServico s={s} ctx={ctx} />}
      </div>
    </div>
  )

  return (
    <Pagina largura="max-w-[1600px]">
      <CabecalhoPagina
        titulo="Prazos"
        subtitulo="Calendário de serviços"
        acoes={
          <Button onClick={() => navigate(diaSelecionado ? `/novo?prazo=${dataStr(diaSelecionado)}` : '/novo')} className="text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
            <Plus size={16} />
            Novo serviço
          </Button>
        }
      />

      <FecharMenuStatus ctx={ctx} />

      <div className="flex items-center gap-6 flex-wrap bg-white border border-slate-200 rounded-2xl px-5 py-3">
        <div className="flex gap-1.5 items-center">
          <span className="text-sm text-slate-500 mr-1">Tipo:</span>
          {TAGS_FIXAS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} className={chip(filtroTags.includes(tag))}>
              {TAG_LABEL[tag] || tag}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 items-center">
          <span className="text-sm text-slate-500 mr-1">Prioridade:</span>
          {PRIORIDADE_OPCOES.map(({ val, label }) => (
            <button key={val} onClick={() => togglePrioridade(val)}
              className={`${chip(filtroPrioridades.includes(val))} inline-flex items-center gap-1.5`}>
              <span className={`w-2 h-2 rounded-full ${corFundoPrioridade(val)}`} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 items-center">
          <span className="text-sm text-slate-500 mr-1">Status:</span>
          {STATUS_OPCOES.map(({ val, label }) => (
            <button key={val} onClick={() => toggleStatus(val)} className={chip(filtroStatus.includes(val))}>
              {label}
            </button>
          ))}
        </div>

        {temFiltroAtivo && (
          <button onClick={limparFiltros} className="text-sm text-red-500 font-semibold ml-auto hover:text-red-700 active:scale-95 transition-all">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p translate="no" className="text-lg font-bold text-slate-800">
              {MESES[mes]} {ano}
            </p>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 mr-3">
                <span className="text-sm text-slate-500 whitespace-nowrap">Data específica:</span>
                <div className="w-40">
                  <CampoData
                    value={dataEspecifica}
                    onChange={irParaData}
                    onInvalida={() => toast.erro('Data inválida.')}
                    aria-label="Ir para uma data específica"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <button onClick={irParaHoje} className="text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all mr-2">
                Hoje
              </button>
              <button onClick={mesAnterior} aria-label="Mês anterior" className="p-2 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all rounded-lg">
                <ChevronLeft size={18} />
              </button>
              <button onClick={proximoMes} aria-label="Próximo mês" className="p-2 text-slate-500 hover:bg-slate-100 active:scale-90 transition-all rounded-lg">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200">
            {DIAS_SEMANA.map(d => (
              <div
                key={d}
                data-dia={d}
                translate="no"
                className="cal-header text-center text-xs text-slate-500 font-semibold uppercase tracking-wide pb-2"
              />
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-slate-100">
            {semanas.flat().map(({ dia, mesAtual }, idx) => {
              if (!mesAtual) {
                return (
                  <div key={idx} className="min-h-28 border-r border-b border-slate-100 bg-slate-50/60 p-1.5">
                    <span className="text-xs text-slate-300 px-1">{dia}</span>
                  </div>
                )
              }

              const servsDia = servicosPorData[dataStr(dia)] || []
              const isSelected = dia === diaSelecionado
              const isHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate()

              return (
                <button
                  key={idx}
                  onClick={() => setDiaSelecionado(dia)}
                  className={`min-h-28 border-r border-b border-slate-100 p-1.5 text-left flex flex-col gap-1 transition-colors ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-[#2563eb]' : 'hover:bg-slate-50'}`}
                >
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                    isHoje ? 'bg-[#2563eb] text-white font-bold' : 'text-slate-700 font-medium'
                  }`}>
                    {dia}
                  </span>
                  {servsDia.length > 0 && (
                    <span className="flex flex-wrap gap-1 mt-auto">
                      {indicadoresDoDia(servsDia).map(ind => (
                        <span
                          key={ind.chave}
                          title={plural(ind.quantidade, ...ind.rotulos)}
                          className={`min-w-6 h-6 px-1.5 rounded-full text-xs font-bold text-white flex items-center justify-center ${ind.cor}`}
                        >
                          {ind.quantidade}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-5 mt-4 text-xs text-slate-500">
            {[
              { cor: corFundoPrioridade('alta'), label: 'Alta' },
              { cor: corFundoPrioridade('media'), label: 'Média' },
              { cor: corFundoPrioridade('baixa'), label: 'Baixa' },
              { cor: 'bg-slate-400', label: 'Finalizado' },
            ].map(l => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${l.cor}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {vencidos.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-red-700 mb-3 inline-flex items-center gap-1.5">
                <AlertTriangle size={16} />
                {vencidos.length} prazo{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-col gap-2.5">
                {vencidos.slice(0, LIMITE_VENCIDOS).map(s => (
                  <div key={s.id} className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800 truncate">{s.titulo}</p>
                      <p className="text-xs text-red-500">
                        Venceu em {new Date(s.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/editar/${s.id}`)}
                      className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold shrink-0 hover:bg-red-700 active:scale-95 transition-all"
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
              {vencidos.length > LIMITE_VENCIDOS && (
                <button
                  onClick={() => navigate('/servicos?vencidos=1')}
                  className="text-sm text-red-700 font-semibold underline mt-3 hover:text-red-900 active:scale-95 transition-all"
                >
                  Ver todos os {vencidos.length} prazos vencidos
                </button>
              )}
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-slate-800 mb-3">
              {diaSelecionado ? `${diaSelecionado} de ${MESES[mes]}` : 'Selecione um dia'}
              {diaSelecionado && (
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({servicosDiaSelecionado.length === 0 ? 'nenhum' : servicosDiaSelecionado.length === 1 ? '1 serviço' : `${servicosDiaSelecionado.length} serviços`})
                </span>
              )}
            </h2>

            {diaSelecionado && servicosDiaSelecionado.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                Nenhum serviço com prazo neste dia.
              </div>
            )}
            {servicosDiaSelecionado.length > 0 && (
              <div className="flex flex-col gap-2">
                {servicosDiaSelecionado.slice(0, LIMITE_POR_DIA).map(s => renderCardServico(s))}
                {servicosDiaSelecionado.length > LIMITE_POR_DIA && (
                  <button
                    onClick={() => setModalDiaAberto(true)}
                    className="text-sm text-blue-600 font-semibold text-center py-2 bg-white/70 border border-dashed border-blue-200 rounded-xl hover:bg-white active:scale-[0.98] transition-all"
                  >
                    Ver mais ({servicosDiaSelecionado.length - LIMITE_POR_DIA})
                  </button>
                )}
              </div>
            )}
          </div>

          {semPrazo.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-3">
                Sem prazo definido
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({semPrazo.length} serviço{semPrazo.length > 1 ? 's' : ''})
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {semPrazo.map(s => (
                  <div key={s.id} className={`bg-white rounded-xl p-4 border border-slate-200 border-l-4 ${borderPrioridade(s.prioridade)} flex items-center gap-3`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.titulo}</p>
                      <p className="text-sm text-slate-500 truncate">{s.cliente}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/editar/${s.id}`)}
                      className="text-sm text-[#2563eb] font-semibold shrink-0 hover:text-[#1e3a5f] active:scale-95 transition-all"
                    >
                      Definir prazo →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalServicosDia
        aberto={modalDiaAberto && !!diaSelecionado}
        titulo={diaSelecionado ? `Serviços de ${diaSelecionado} de ${MESES[mes]} de ${ano}` : ''}
        servicos={servicosDiaSelecionado}
        deletar={deletar}
        mudarStatus={mudarStatusHook}
        mudarPago={mudarPago}
        buscar={buscar}
        onFechar={fecharModalDia}
      />
    </Pagina>
  )
}

export default Prazos
