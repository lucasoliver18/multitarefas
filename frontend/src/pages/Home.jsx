import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, UserPlus, PackagePlus, AlertTriangle, CalendarClock, CircleDollarSign, Receipt,
  ClipboardList, PackageX, PackageMinus, CheckCircle2, Wallet, Handshake,
  NotebookPen, FilePlus2, FileCheck2, ClipboardCheck, ChevronRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import Button from '../components/Button'
import ModalOrcamentosPendentes from '../components/ModalOrcamentosPendentes'
import { Pagina, CabecalhoPagina, Carregando } from '../components/Pagina'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'
import { formatarPreco } from '../utils/orcamentos'
import { corFundoPrioridade, TAG_LABEL } from '../utils/status'
import { plural } from '../utils/texto'

const PERIODOS = [
  { val: '7d', label: '7 dias' },
  { val: '1m', label: '1 mês' },
  { val: '6m', label: '6 meses' },
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function Cartao({ titulo, acao, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

function Indicador({ icone, rotulo, valor, detalhe, cor, onClick }) {
  const Icone = icone
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 text-left transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.99] min-w-0"
    >
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
        <Icone size={22} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-slate-500">{rotulo}</span>
        <span className="block text-2xl font-bold text-slate-800 leading-tight truncate">{valor}</span>
        {detalhe && <span className="block text-xs text-slate-400 mt-0.5 truncate">{detalhe}</span>}
      </span>
    </button>
  )
}

// Pendências que pedem ação. Só aparecem as que têm quantidade > 0; cada uma
// abre a tela já filtrada.
function itensAtencao(a) {
  return [
    { qtd: a.atrasados, texto: plural(a.atrasados, 'serviço atrasado', 'serviços atrasados'),
      icone: AlertTriangle, cor: 'text-red-600 bg-red-50', link: '/servicos?vencidos=1' },
    { qtd: a.vencem_hoje_amanha, texto: plural(a.vencem_hoje_amanha, 'prazo vence hoje ou amanhã', 'prazos vencem hoje ou amanhã'),
      icone: CalendarClock, cor: 'text-orange-600 bg-orange-50', link: '/prazos' },
    { qtd: a.finalizados_nao_pagos, texto: plural(a.finalizados_nao_pagos, 'serviço finalizado sem pagamento', 'serviços finalizados sem pagamento'),
      icone: CircleDollarSign, cor: 'text-orange-600 bg-orange-50', link: '/servicos?status=finalizado&pago=0' },
    { qtd: a.em_andamento_sem_orcamento_aprovado, texto: plural(a.em_andamento_sem_orcamento_aprovado, 'serviço em andamento sem orçamento aprovado', 'serviços em andamento sem orçamento aprovado'),
      icone: ClipboardList, cor: 'text-blue-600 bg-blue-50', link: '/servicos?status=em_andamento&orcamento=sem_aprovado' },
    { qtd: a.orcamentos_pendentes, texto: plural(a.orcamentos_pendentes, 'orçamento aguardando aprovação', 'orçamentos aguardando aprovação'),
      icone: Receipt, cor: 'text-blue-600 bg-blue-50', abrirModal: true },
    { qtd: a.materiais_zerados, texto: plural(a.materiais_zerados, 'material sem estoque', 'materiais sem estoque'),
      icone: PackageX, cor: 'text-red-600 bg-red-50', link: '/materiais?foraEstoque=1' },
    { qtd: a.materiais_baixos, texto: plural(a.materiais_baixos, 'material com estoque baixo', 'materiais com estoque baixo'),
      icone: PackageMinus, cor: 'text-orange-600 bg-orange-50', link: '/materiais?estoqueBaixo=1' },
  ].filter(i => i.qtd > 0)
}

const ATIVIDADE = {
  servico_criado:     { icone: Plus,           cor: 'text-blue-600 bg-blue-50',    rotulo: 'Serviço criado' },
  servico_finalizado: { icone: ClipboardCheck, cor: 'text-green-700 bg-green-50',  rotulo: 'Serviço finalizado' },
  orcamento_criado:   { icone: FilePlus2,      cor: 'text-indigo-600 bg-indigo-50', rotulo: 'Orçamento criado' },
  orcamento_aprovado: { icone: FileCheck2,     cor: 'text-green-700 bg-green-50',  rotulo: 'Orçamento aprovado' },
  anotacao:           { icone: NotebookPen,    cor: 'text-amber-700 bg-amber-50',  rotulo: 'Anotação' },
}

function quando(iso) {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function Variacao({ atual, anterior }) {
  if (anterior === 0 && atual === 0) return <span className="text-xs text-slate-400">igual ao período anterior</span>
  const diff = atual - anterior
  if (diff === 0) return <span className="text-xs text-slate-400">igual ao período anterior</span>
  const Seta = diff > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`text-xs font-semibold inline-flex items-center gap-0.5 ${diff > 0 ? 'text-green-700' : 'text-red-600'}`}>
      <Seta size={14} />
      {diff > 0 ? '+' : ''}{diff} vs. período anterior
    </span>
  )
}

function Metrica({ rotulo, valor, detalhe, className = '' }) {
  return (
    <div className={`bg-slate-50 rounded-xl p-4 min-w-0 ${className}`}>
      <p className="text-sm text-slate-500">{rotulo}</p>
      <p className="text-xl font-bold text-slate-800 mt-0.5 truncate">{valor}</p>
      {detalhe && <div className="mt-0.5">{detalhe}</div>}
    </div>
  )
}

// Barras horizontais (uma série só: quantidade de serviços criados por tag).
// Uma cor, valor escrito ao lado de cada barra e dica ao passar o mouse.
function BarrasPorTag({ porTag }) {
  const linhas = [
    { chave: 'informatica', rotulo: TAG_LABEL.informatica },
    { chave: 'pintura', rotulo: TAG_LABEL.pintura },
    { chave: 'outros', rotulo: TAG_LABEL.outros },
    { chave: 'sem_tag', rotulo: 'Sem tag' },
  ].map(l => ({ ...l, valor: porTag[l.chave] || 0 }))
  const maximo = Math.max(1, ...linhas.map(l => l.valor))
  const total = linhas.reduce((acc, l) => acc + l.valor, 0)

  if (total === 0) return <p className="text-sm text-slate-400 py-6 text-center">Nenhum serviço criado no período.</p>

  return (
    <div className="flex flex-col gap-2.5" role="table" aria-label="Serviços criados por tag">
      {linhas.map(l => (
        <div key={l.chave} role="row" className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 group"
          title={`${l.rotulo}: ${plural(l.valor, 'serviço', 'serviços')} (${Math.round(l.valor / total * 100)}%)`}>
          <span role="rowheader" className="text-sm text-slate-600 truncate">{l.rotulo}</span>
          <span className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <span
              className="block h-full rounded-full bg-[#2563eb] transition-[width] duration-300 group-hover:bg-[#1e3a5f]"
              style={{ width: `${(l.valor / maximo) * 100}%`, minWidth: l.valor > 0 ? '0.5rem' : 0 }}
            />
          </span>
          <span role="cell" className="text-sm font-semibold text-slate-700 text-right tabular-nums">{l.valor}</span>
        </div>
      ))}
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const primeiroNome = user?.name?.split(' ')[0] || ''
  const [periodo, setPeriodo] = useEstadoPersistido('inicio:periodo', '1m')
  const { dados, erro } = useDashboard(periodo)
  const [modalPendentesAberto, setModalPendentesAberto] = useState(false)
  // Estável: o Modal registra o Esc com base nesta função.
  const fecharModalPendentes = useCallback(() => setModalPendentesAberto(false), [])

  const cabecalho = (
    <CabecalhoPagina
      titulo={`Olá, ${primeiroNome}!`}
      subtitulo={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      acoes={
        <>
          <Button variant="secondary" onClick={() => navigate('/clientes/novo')} className="text-sm font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2">
            <UserPlus size={16} />
            Novo cliente
          </Button>
          <Button variant="secondary" onClick={() => navigate('/materiais/novo')} className="text-sm font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2">
            <PackagePlus size={16} />
            Novo material
          </Button>
          <Button onClick={() => navigate('/novo')} className="text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
            <Plus size={16} />
            Novo serviço
          </Button>
        </>
      }
    />
  )

  if (!dados) {
    return (
      <Pagina>
        {cabecalho}
        {erro
          ? <p className="text-center text-sm text-slate-400 py-16">Não foi possível carregar o resumo.</p>
          : <Carregando texto="Carregando resumo..." />}
      </Pagina>
    )
  }

  const { atencao, financeiro, agenda, previsao_estoque: previsao, desempenho, atividade } = dados
  const pendencias = itensAtencao(atencao)

  return (
    <Pagina>
      {cabecalho}

      <div className="grid grid-cols-3 gap-4">
        <Indicador icone={Wallet} rotulo="A receber" valor={formatarPreco(financeiro.a_receber)}
          detalhe={financeiro.a_receber_qtd ? `${plural(financeiro.a_receber_qtd, 'serviço finalizado', 'serviços finalizados')} sem pagamento` : 'Nada pendente'}
          cor="bg-green-100 text-green-700" onClick={() => navigate('/servicos?status=finalizado&pago=0')} />
        <Indicador icone={Handshake} rotulo="Em negociação" valor={formatarPreco(financeiro.em_negociacao)}
          detalhe={plural(financeiro.em_negociacao_qtd, 'orçamento pendente', 'orçamentos pendentes')}
          cor="bg-blue-100 text-blue-700" onClick={() => setModalPendentesAberto(true)} />
        <Indicador icone={AlertTriangle} rotulo="Atrasados" valor={atencao.atrasados}
          detalhe={atencao.atrasados ? 'Prazo vencido e não finalizado' : 'Nenhum atraso'}
          cor="bg-red-100 text-red-700" onClick={() => navigate('/servicos?vencidos=1')} />
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        <Cartao titulo="Precisa de atenção">
          {pendencias.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 size={32} className="text-green-600" />
              <p className="text-sm font-semibold text-slate-700">Tudo em dia</p>
              <p className="text-sm text-slate-400">Nenhuma pendência no momento.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {pendencias.map(p => {
                const Icone = p.icone
                return (
                  <button
                    key={p.texto}
                    onClick={() => p.abrirModal ? setModalPendentesAberto(true) : navigate(p.link)}
                    className="flex items-center gap-3 px-2 py-2.5 -mx-2 rounded-xl text-left transition-colors hover:bg-slate-50 group"
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${p.cor}`}>
                      <Icone size={18} />
                    </span>
                    <span className="flex-1 text-sm text-slate-700">{p.texto}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                )
              })}
            </div>
          )}
        </Cartao>

        <div className="flex flex-col gap-6">
          <Cartao
            titulo="Próximos 7 dias"
            acao={<button onClick={() => navigate('/prazos')} className="text-sm text-[#2563eb] font-semibold hover:text-[#1e3a5f] transition-colors">Ver calendário →</button>}
          >
            <div className="grid grid-cols-7 gap-2">
              {agenda.map((dia, i) => {
                const data = new Date(dia.data + 'T00:00:00')
                const total = dia.alta + dia.media + dia.baixa
                return (
                  <button
                    key={dia.data}
                    onClick={() => navigate(`/prazos?data=${dia.data}`)}
                    title={total ? `${plural(total, 'serviço', 'serviços')} com prazo neste dia` : 'Nenhum prazo'}
                    className={`rounded-xl border p-2 flex flex-col items-center gap-1.5 min-h-24 transition-colors hover:bg-slate-50 ${i === 0 ? 'border-[#2563eb] bg-blue-50/50' : 'border-slate-200'}`}
                  >
                    <span className="text-xs font-semibold text-slate-500 uppercase">{i === 0 ? 'Hoje' : DIAS_SEMANA[data.getDay()]}</span>
                    <span className="text-sm font-bold text-slate-800">{data.getDate()}</span>
                    <span className="flex flex-wrap justify-center gap-1">
                      {['alta', 'media', 'baixa'].filter(p => dia[p] > 0).map(p => (
                        <span key={p} className={`min-w-5 h-5 px-1 rounded-full text-[0.7rem] font-bold text-white flex items-center justify-center ${corFundoPrioridade(p)}`}>
                          {dia[p]}
                        </span>
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </Cartao>

          <Cartao titulo="Previsão de falta de estoque">
            {previsao.length === 0 ? (
              <p className="text-sm text-slate-400">O estoque cobre todos os orçamentos pendentes.</p>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-3">Faltaria material se os orçamentos pendentes fossem aprovados:</p>
                <div className="flex flex-col divide-y divide-slate-100">
                  {previsao.map(m => (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/materiais/editar/${m.id}`)}
                      className="flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{m.nome}</span>
                      <span className="text-sm text-slate-500">
                        {m.estoque.toLocaleString('pt-BR')} de {m.necessario.toLocaleString('pt-BR')} {m.unidade}
                      </span>
                      <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                        faltam {(m.necessario - m.estoque).toLocaleString('pt-BR')}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Cartao>
        </div>
      </div>

      <Cartao
        titulo="Desempenho"
        acao={
          <div className="flex items-center gap-1.5">
            {PERIODOS.map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setPeriodo(val)}
                className={`text-sm px-3.5 py-1.5 rounded-lg font-semibold transition-all active:scale-95 ${
                  periodo === val ? 'bg-[#1e3a5f] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
          {/* Linha 1: orçamentos (2 métricas); linha 2: serviços (3 métricas). */}
          <div className="grid grid-cols-6 gap-3">
            <Metrica className="col-span-3" rotulo="Orçamentos aprovados" valor={formatarPreco(desempenho.aprovado)}
              detalhe={<span className="text-xs text-slate-400">{plural(desempenho.aprovado_qtd, 'orçamento', 'orçamentos')}</span>} />
            <Metrica className="col-span-3" rotulo="Taxa de aprovação" valor={desempenho.taxa_aprovacao != null ? `${desempenho.taxa_aprovacao}%` : '—'}
              detalhe={<span className="text-xs text-slate-400">dos orçamentos decididos</span>} />
            <Metrica className="col-span-2" rotulo="Serviços criados" valor={desempenho.criados} />
            <Metrica className="col-span-2" rotulo="Serviços finalizados" valor={desempenho.finalizados}
              detalhe={<Variacao atual={desempenho.finalizados} anterior={desempenho.finalizados_anterior} />} />
            <Metrica className="col-span-2" rotulo="Tempo médio de conclusão"
              valor={desempenho.tempo_medio_conclusao_dias != null ? plural(desempenho.tempo_medio_conclusao_dias.toLocaleString('pt-BR'), 'dia', 'dias') : '—'}
              detalhe={<span className="text-xs text-slate-400">da criação à finalização</span>} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Serviços criados por tag</p>
            <BarrasPorTag porTag={desempenho.por_tag} />
          </div>
        </div>
      </Cartao>

      <Cartao titulo="Atividade recente">
        {atividade.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma atividade ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6">
            {atividade.map((ev, i) => {
              const tipo = ATIVIDADE[ev.tipo] || ATIVIDADE.servico_criado
              const Icone = tipo.icone
              return (
                <button
                  key={`${ev.tipo}-${ev.servico_id}-${i}`}
                  onClick={() => navigate(ev.tipo === 'anotacao' ? `/servicos/${ev.servico_id}/anotacoes`
                    : ev.tipo.startsWith('orcamento') ? `/orcamentos/${ev.servico_id}` : `/editar/${ev.servico_id}`)}
                  className="flex items-center gap-3 py-2.5 text-left border-b border-slate-100 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors min-w-0"
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tipo.cor}`}>
                    <Icone size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs text-slate-400">{tipo.rotulo}</span>
                    <span className="block text-sm text-slate-700 truncate">{ev.texto}</span>
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">{quando(ev.data)}</span>
                </button>
              )
            })}
          </div>
        )}
      </Cartao>
      <ModalOrcamentosPendentes aberto={modalPendentesAberto} onFechar={fecharModalPendentes} />
    </Pagina>
  )
}

export default Home
