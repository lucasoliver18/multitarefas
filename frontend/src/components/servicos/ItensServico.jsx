import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { User, Calendar, NotebookPen, Receipt, Pencil, Trash2 } from 'lucide-react'
import StatusBadge from '../StatusBadge'
import ConfirmacaoCartao from '../ConfirmacaoCartao'
import PerguntaEstoque from './PerguntaEstoque'
import Calendario from '../Calendario'
import { useFlutuante } from '../../hooks/useFlutuante'
import { estaVencido, hojeISO, isoParaBr } from '../../utils/prazos'
import {
  borderPrioridade,
  fundoPrioridade,
  STATUS_ICONE,
  TAG_LABEL,
  ICONE_PAGO,
  badgePago,
  labelPago,
  labelPrioridade,
  corTextoPrioridade,
  statusSeguintes,
} from '../../utils/status'

// Peças das listagens de serviço (quadro, lista e cartões). Ficam no nível do
// módulo, e não dentro da tela, para o React não desmontar e remontar tudo a
// cada atualização (era isso que fazia a tela "piscar").
//
// `ctx` reúne o que vem da tela: navigate, hojeStr, selecaoAtiva, selecionados,
// alternarItem, menuStatus, setMenuStatus, confirmarMudarStatus,
// handleMudarPago, handleMudarPrazo, confirmandoId, setConfirmandoId, handleDeletar.

const formatarData = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')

const COLUNAS_LISTA = 'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_7rem_8rem_8.5rem_8.5rem_9.5rem] items-center gap-4'
// Sem a coluna de prazo: usado quando todos os serviços são do mesmo dia.
const COLUNAS_LISTA_SEM_PRAZO = 'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_7rem_8.5rem_8.5rem_9.5rem] items-center gap-4'

export function PagoBadge({ s, ctx }) {
  if (ctx.selecaoAtiva) {
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgePago(s.pago)}`}>{labelPago(s.pago)}</span>
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); ctx.handleMudarPago(s.id, !s.pago) }}
      title={s.pago ? 'Marcar como não pago' : 'Marcar como pago'}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-all hover:brightness-95 active:scale-95 ${badgePago(s.pago)}`}
    >
      <ICONE_PAGO size={12} />
      {labelPago(s.pago)}
    </button>
  )
}

export function OrcamentoBadge({ s }) {
  if (s.tem_orcamento) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      Sem orçamento
    </span>
  )
}

export function TagBadge({ s }) {
  if (!s.tag) return null
  return (
    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
      {TAG_LABEL[s.tag] || s.tag}
    </span>
  )
}

// Selo de status que, quando o serviço ainda pode avançar, abre um menu com
// os próximos status. O menu abre num portal (useFlutuante) para não ser
// cortado por contêineres com rolagem, como o corpo dos modais.
export function StatusAcao({ s, ctx, className }) {
  const proximos = statusSeguintes(s.status)
  if (ctx.selecaoAtiva || proximos.length === 0) {
    return <StatusBadge status={s.status} className={className} />
  }
  return <StatusComMenu s={s} ctx={ctx} proximos={proximos} className={className} />
}

function StatusComMenu({ s, ctx, proximos, className }) {
  const aberto = ctx.menuStatus === s.id
  // Sem onFechar: o clique fora é tratado por FecharMenuStatus, que também
  // impede que esse clique chegue à linha de baixo (e abra a edição).
  const { ancoraRef, flutuanteRef, estilo } = useFlutuante({
    aberto,
    altura: proximos.length * 44 + 8,
    largura: 190,
    alinhamento: 'direita',
  })
  return (
    <span ref={ancoraRef} className="inline-flex">
      <StatusBadge
        status={s.status}
        as="button"
        title="Alterar status"
        className={className}
        onClick={() => ctx.setMenuStatus(prev => prev === s.id ? null : s.id)}
      />
      {aberto && createPortal(
        <div
          ref={flutuanteRef}
          style={estilo}
          // O portal continua dentro da árvore do React: sem isso, o clique
          // chegaria à linha/cartão (que abre a edição ou inicia o arraste).
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className="fixed z-[110] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
        >
          {proximos.map(o => {
            const Icone = STATUS_ICONE[o.val]
            return (
              <button
                key={o.val}
                onClick={() => ctx.confirmarMudarStatus(s, o.val)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-2"
              >
                <Icone size={14} />
                {o.label}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </span>
  )
}

// Prazo clicável: abre o calendário do sistema para escolher uma nova data e
// confirmar, sem passar pela tela de edição. `children` é o prazo como cada
// visualização o mostra; em volta vai a moldura de botão secundário do sistema
// (borda, fundo no hover), para deixar claro que dá para alterar.
// Em modo de seleção (ou sem handleMudarPrazo), é só texto.
export function PrazoAcao({ s, ctx, className = '', children }) {
  const [aberto, setAberto] = useState(false)
  const [escolhido, setEscolhido] = useState('')
  const [cursor, setCursor] = useState(hojeISO())
  const [modo, setModo] = useState('dias')
  const [salvando, setSalvando] = useState(false)
  // Sem onFechar: o clique fora cai na camada invisível abaixo, que fecha sem
  // deixar o clique chegar à linha/cartão (que abriria a edição).
  const { ancoraRef, flutuanteRef, estilo } = useFlutuante({ aberto, altura: 470, largura: 304 })

  const fechar = () => { if (!salvando) setAberto(false) }

  // Esc fecha só o calendário (captura: antes do Esc de um modal em volta).
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setAberto(false) } }
    document.addEventListener('keydown', aoTeclar, true)
    return () => document.removeEventListener('keydown', aoTeclar, true)
  }, [aberto])

  if (ctx.selecaoAtiva || !ctx.handleMudarPrazo) return <span className={className}>{children}</span>

  const abrir = () => {
    setEscolhido(s.prazo || '')
    setCursor(s.prazo || hojeISO())
    setModo('dias')
    setAberto(true)
  }

  const confirmar = async () => {
    setSalvando(true)
    const ok = await ctx.handleMudarPrazo(s.id, escolhido)
    setSalvando(false)
    if (ok) setAberto(false)
  }

  const mudou = escolhido !== (s.prazo || '')

  return (
    <span ref={ancoraRef} className="inline-flex max-w-full">
      <button
        type="button"
        title="Alterar prazo"
        onClick={e => { e.stopPropagation(); if (aberto) fechar(); else abrir() }}
        onPointerDown={e => e.stopPropagation()}
        className={`${className} inline-flex items-center whitespace-nowrap px-2 py-1 rounded-lg border bg-white text-left cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 ${aberto ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}
      >
        {children}
      </button>
      {aberto && createPortal(
        // O portal continua dentro da árvore do React: sem o stopPropagation,
        // o clique chegaria à linha/cartão (que abre a edição ou inicia o arraste).
        <div onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <div className="fixed inset-0 z-[105]" onClick={fechar} />
          <div
            ref={flutuanteRef}
            role="dialog"
            aria-label="Alterar prazo"
            style={estilo}
            className="fixed z-[110] bg-white border border-slate-200 rounded-xl shadow-lg p-3 overflow-y-auto select-none"
          >
            <Calendario
              valor={escolhido}
              cursor={cursor}
              setCursor={setCursor}
              modo={modo}
              setModo={setModo}
              onEscolher={iso => { setEscolhido(iso); setCursor(iso) }}
            />
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEscolhido('')}
                disabled={!escolhido}
                className="px-2 py-1 rounded-lg text-sm font-semibold text-slate-500 whitespace-nowrap shrink-0 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Sem prazo
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={fechar}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmar}
                  disabled={!mudou || salvando}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1e3a5f] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {salvando ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2 tabular-nums">
              {escolhido ? `Novo prazo: ${isoParaBr(escolhido)}` : 'O serviço ficará sem prazo'}
            </p>
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}

// Camada invisível que fecha o menu de status ao clicar fora dele.
export function FecharMenuStatus({ ctx }) {
  if (!ctx.menuStatus) return null
  return <div className="fixed inset-0 z-10" onClick={() => ctx.setMenuStatus(null)} />
}

function Checkbox({ s, ctx, className = 'w-4 h-4' }) {
  return (
    <input
      type="checkbox"
      checked={ctx.selecionados?.has(s.id) ?? false}
      onChange={() => ctx.alternarItem(s.id)}
      onClick={e => e.stopPropagation()}
      className={`${className} accent-blue-600 shrink-0`}
    />
  )
}

function BotaoIcone({ onClick, label, cor, children }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-lg transition-all active:scale-90 ${cor}`}
    >
      {children}
    </button>
  )
}

// Mesmas ações em todas as visualizações (quadro, lista, detalhado e modais):
// editar, anotações, orçamentos e excluir. A exclusão pede confirmação
// (ConfirmacaoServico), aberta por quem desenha o serviço.
export function AtalhosServico({ s, ctx, tamanho = 15 }) {
  return (
    <>
      <BotaoIcone onClick={() => ctx.navigate(`/editar/${s.id}`)} label="Editar" cor="text-[#2563eb] hover:bg-blue-50">
        <Pencil size={tamanho} />
      </BotaoIcone>
      <BotaoIcone onClick={() => ctx.navigate(`/servicos/${s.id}/anotacoes`)} label="Anotações" cor="text-amber-700 hover:bg-amber-50">
        <NotebookPen size={tamanho} />
      </BotaoIcone>
      <BotaoIcone onClick={() => ctx.navigate(`/orcamentos/${s.id}`)} label="Orçamentos" cor="text-indigo-600 hover:bg-indigo-50">
        <Receipt size={tamanho} />
      </BotaoIcone>
      <BotaoIcone
        onClick={() => ctx.setConfirmandoId(s.id)}
        label="Excluir"
        cor={`text-red-500 hover:bg-red-50 ${ctx.confirmandoId === s.id ? 'bg-red-50' : ''}`}
      >
        <Trash2 size={tamanho} />
      </BotaoIcone>
    </>
  )
}

// Serviço com orçamento aprovado: antes de excluir, pergunta se o estoque
// descontado volta (PerguntaEstoque).
export function ConfirmacaoServico({ s, ctx }) {
  const [perguntando, setPerguntando] = useState(false)
  return (
    <>
      <ConfirmacaoCartao
        mensagem="Excluir este serviço?"
        onConfirmar={() => s.tem_orcamento_aprovado ? setPerguntando(true) : ctx.handleDeletar(s.id)}
        onCancelar={() => ctx.setConfirmandoId(null)}
      />
      {/* O modal é um portal, mas os eventos sobem pela árvore do React: sem
          isso, o clique chegaria ao cartão (abre a edição ou inicia o arraste). */}
      <span className="contents" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
        <PerguntaEstoque
          aberto={perguntando}
          onEscolher={devolverEstoque => { setPerguntando(false); ctx.handleDeletar(s.id, { devolverEstoque }) }}
          onCancelar={() => { setPerguntando(false); ctx.setConfirmandoId(null) }}
        />
      </span>
    </>
  )
}

// Prazo com o mesmo aviso de atraso no quadro e no detalhado.
const textoPrazo = (s, vencido) =>
  !s.prazo ? 'Sem prazo' : vencido ? `Atrasado · ${formatarData(s.prazo)}` : formatarData(s.prazo)

export function ServicoCardKanban({ s, ctx }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: s.id,
    disabled: ctx.selecaoAtiva,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined
  const vencido = estaVencido(s, ctx.hojeStr)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!ctx.selecaoAtiva ? attributes : {})}
      {...(!ctx.selecaoAtiva ? listeners : {})}
      onClick={() => ctx.selecaoAtiva ? ctx.alternarItem(s.id) : ctx.navigate(`/editar/${s.id}`)}
      className={`bg-white rounded-xl p-3.5 border border-slate-200 border-l-4 ${borderPrioridade(s.prioridade)} shadow-sm cursor-pointer min-w-0 touch-none transition-shadow hover:shadow-md ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        {ctx.selecaoAtiva && <Checkbox s={s} ctx={ctx} className="w-4 h-4 mt-0.5" />}
        <p className="text-sm font-semibold text-slate-800 leading-snug flex-1 break-words">{s.titulo}</p>
        {!ctx.selecaoAtiva && (
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <StatusAcao s={s} ctx={ctx} className="px-2 py-0.5" />
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mt-1 truncate">{s.cliente}</p>
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <TagBadge s={s} />
        {!ctx.selecaoAtiva && <PagoBadge s={s} ctx={ctx} />}
        {!ctx.selecaoAtiva && <OrcamentoBadge s={s} />}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-slate-100 min-h-[2.75rem]">
        {!ctx.selecaoAtiva && ctx.confirmandoId === s.id ? (
          // onPointerDown: clicar nos botões não deve iniciar o arraste do cartão.
          <div className="w-full" onPointerDown={e => e.stopPropagation()}>
            <ConfirmacaoServico s={s} ctx={ctx} />
          </div>
        ) : (
          <>
            <PrazoAcao
              s={s}
              ctx={ctx}
              className={`text-xs inline-flex items-center gap-1 ${vencido ? 'text-red-600 font-semibold' : s.prazo ? 'text-slate-500' : 'text-slate-400'}`}
            >
              {s.prazo && <Calendar size={13} className="shrink-0" />}
              {textoPrazo(s, vencido)}
            </PrazoAcao>
            {!ctx.selecaoAtiva && (
              <div className="flex items-center" onClick={e => e.stopPropagation()}>
                <AtalhosServico s={s} ctx={ctx} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function ColunaKanban({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`min-w-0 flex flex-col gap-3 rounded-2xl p-3 transition-colors ${isOver ? 'bg-blue-100/70' : 'bg-slate-200/50'}`}>
      {children}
    </div>
  )
}

// `semPrazo` esconde a coluna de prazo (ex.: lista de um dia só, em Prazos).
export function CabecalhoListaServicos({ semPrazo = false }) {
  return (
    <div className={`${semPrazo ? COLUNAS_LISTA_SEM_PRAZO : COLUNAS_LISTA} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 rounded-t-2xl`}>
      <span>Serviço</span>
      <span>Tag</span>
      <span>Prioridade</span>
      {!semPrazo && <span>Prazo</span>}
      <span>Pagamento</span>
      <span>Ações</span>
      <span>Status</span>
    </div>
  )
}

// Lista em formato de tabela: uma linha por serviço, colunas alinhadas.
export function ServicoLinha({ s, ctx, semPrazo = false }) {
  const vencido = s.prazo && estaVencido(s, ctx.hojeStr)
  return (
    <div>
    <div
      onClick={() => ctx.selecaoAtiva ? ctx.alternarItem(s.id) : ctx.navigate(`/editar/${s.id}`)}
      className={`${semPrazo ? COLUNAS_LISTA_SEM_PRAZO : COLUNAS_LISTA} relative px-5 py-3 bg-white cursor-pointer transition-colors hover:bg-slate-50`}
    >
      {/* Barra de prioridade com respiro em cima e embaixo: uma borda lateral
          contínua emendava com as linhas vizinhas de mesma prioridade. */}
      <span aria-hidden="true" className={`absolute left-1.5 top-3 bottom-3 w-1 rounded-full ${fundoPrioridade(s.prioridade)}`} />
      <div className="flex items-center gap-3 min-w-0">
        {ctx.selecaoAtiva && <Checkbox s={s} ctx={ctx} />}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{s.titulo}</p>
          <p className="text-sm text-slate-500 truncate">{s.cliente}</p>
        </div>
      </div>
      <div><TagBadge s={s} /></div>
      <span className={`text-sm font-medium ${corTextoPrioridade(s.prioridade)}`}>{labelPrioridade(s.prioridade)}</span>
      {!semPrazo && (
        <div>
          <PrazoAcao s={s} ctx={ctx} className={`text-sm ${vencido ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
            {s.prazo ? formatarData(s.prazo) : '—'}
          </PrazoAcao>
          {vencido && <span className="block text-xs font-semibold text-red-600 mt-0.5">Atrasado</span>}
        </div>
      )}
      <div className="flex flex-col items-start gap-1">
        <PagoBadge s={s} ctx={ctx} />
        {!ctx.selecaoAtiva && <OrcamentoBadge s={s} />}
      </div>
      <div className="flex items-center">
        {!ctx.selecaoAtiva && <AtalhosServico s={s} ctx={ctx} tamanho={16} />}
      </div>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <StatusAcao s={s} ctx={ctx} />
      </div>
    </div>
    {!ctx.selecaoAtiva && ctx.confirmandoId === s.id && (
      <div className="px-5 pb-3 bg-white">
        <div className="pt-3 border-t border-slate-100">
          <ConfirmacaoServico s={s} ctx={ctx} />
        </div>
      </div>
    )}
    </div>
  )
}

export function ServicoCardDetalhado({ s, ctx }) {
  const vencido = s.prazo && estaVencido(s, ctx.hojeStr)
  return (
    <div
      onClick={() => ctx.selecaoAtiva ? ctx.alternarItem(s.id) : ctx.navigate(`/editar/${s.id}`)}
      className={`bg-white rounded-2xl p-5 border border-slate-200 border-l-4 ${borderPrioridade(s.prioridade)} shadow-sm flex flex-col cursor-pointer transition-shadow hover:shadow-md`}
    >
      <div className="flex justify-between items-start gap-3">
        {ctx.selecaoAtiva && <Checkbox s={s} ctx={ctx} className="w-5 h-5 mt-0.5" />}
        <p className="text-base font-semibold text-slate-800 flex-1 leading-snug">{s.titulo}</p>
        {!ctx.selecaoAtiva && (
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <StatusAcao s={s} ctx={ctx} />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-sm text-slate-600 inline-flex items-center gap-1.5"><User size={14} />{s.cliente}</p>
        <div>
          <PrazoAcao s={s} ctx={ctx} className={`text-sm inline-flex items-center gap-1.5 ${vencido ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
            <Calendar size={14} className="shrink-0" />
            {textoPrazo(s, vencido)}
          </PrazoAcao>
        </div>
        {s.descricao && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{s.descricao}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <TagBadge s={s} />
          {!ctx.selecaoAtiva && <PagoBadge s={s} ctx={ctx} />}
          {!ctx.selecaoAtiva && <OrcamentoBadge s={s} />}
        </div>
      </div>

      {!ctx.selecaoAtiva && (
        <div className="mt-auto pt-4" onClick={e => e.stopPropagation()}>
          {ctx.confirmandoId === s.id ? (
            <div className="pt-3 border-t border-slate-100">
              <ConfirmacaoServico s={s} ctx={ctx} />
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end min-h-[2.75rem]">
              <AtalhosServico s={s} ctx={ctx} tamanho={16} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
