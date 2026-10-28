import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import api from '../services/api'
import Modal from './Modal'
import Paginacao from './Paginacao'
import { CampoBusca, Carregando, Vazio } from './Pagina'
import { usePaginacao } from '../hooks/usePaginacao'
import { formatarPreco, descreverMargem } from '../utils/orcamentos'
import { plural } from '../utils/texto'
import { TAG_LABEL } from '../utils/status'

const COLUNAS = 'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_7rem_8.5rem_8rem_1.5rem] items-center gap-4'

const diasEsperando = (iso) => {
  const inicio = new Date(iso); inicio.setHours(0, 0, 0, 0)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((hoje - inicio) / 86400000))
}

const textoEspera = (dias) => dias === 0 ? 'Hoje' : `Há ${plural(dias, 'dia', 'dias')}`

// Orçamentos aguardando aprovação ou reprovação, do que espera há mais tempo
// ao mais novo. Clicar leva à tela de orçamentos do serviço, onde se decide.
function ConteudoPendentes({ onEscolher }) {
  const [orcamentos, setOrcamentos] = useState(null)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let ativo = true
    api.get('/orcamentos', { params: { status: 'pendente' } })
      .then(res => { if (ativo) setOrcamentos(Array.isArray(res.data) ? res.data : []) })
      .catch(() => { if (ativo) setErro(true) })
    return () => { ativo = false }
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return orcamentos || []
    return (orcamentos || []).filter(o =>
      [o.titulo, o.servico?.titulo, o.servico?.cliente].some(t => (t || '').toLowerCase().includes(termo)))
  }, [orcamentos, busca])

  const total = useMemo(() => filtrados.reduce((acc, o) => acc + (parseFloat(o.valor_final) || 0), 0), [filtrados])
  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(filtrados)

  if (erro) return <Vazio>Erro ao carregar orçamentos.</Vazio>
  if (!orcamentos) return <Carregando texto="Carregando orçamentos..." />
  if (orcamentos.length === 0) return <Vazio>Nenhum orçamento aguardando aprovação.</Vazio>

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por orçamento, serviço ou cliente..." />
        <p className="text-sm text-slate-500 shrink-0">
          Total em negociação: <span className="font-semibold text-slate-800">{formatarPreco(total)}</span>
        </p>
      </div>

      {filtrados.length === 0 ? (
        <Vazio>Nenhum orçamento encontrado para esta busca.</Vazio>
      ) : (
        <>
          <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
            mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} total={filtrados.length} />
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div className={`${COLUNAS} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50`}>
              <span>Orçamento</span>
              <span>Serviço</span>
              <span>Tag</span>
              <span>Aguardando</span>
              <span className="text-right">Valor</span>
              <span />
            </div>
            {itensPagina.map(o => {
              const dias = diasEsperando(o.created_at)
              return (
                <button
                  key={o.id}
                  onClick={() => onEscolher(o)}
                  className={`${COLUNAS} w-full px-5 py-3 text-left transition-colors hover:bg-slate-50 group`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{o.titulo}</p>
                    <p className="text-xs text-slate-400 truncate">Margem {descreverMargem(o.margem_lucro, o.tipo_margem)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 truncate">{o.servico?.titulo}</p>
                    <p className="text-sm text-slate-500 truncate">{o.servico?.cliente}</p>
                  </div>
                  <div>
                    {o.servico?.tag
                      ? <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{TAG_LABEL[o.servico.tag] || o.servico.tag}</span>
                      : <span className="text-sm text-slate-400">—</span>}
                  </div>
                  <span className={`text-sm ${dias >= 7 ? 'text-orange-600 font-semibold' : 'text-slate-600'}`}>{textoEspera(dias)}</span>
                  <span className="text-sm font-semibold text-slate-800 text-right">{formatarPreco(parseFloat(o.valor_final) || 0)}</span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors justify-self-end" />
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

function ModalOrcamentosPendentes({ aberto, onFechar }) {
  const navigate = useNavigate()
  return (
    <Modal
      aberto={aberto}
      titulo="Orçamentos em negociação"
      subtitulo="Clique em um orçamento para aprovar ou reprovar"
      onFechar={onFechar}
    >
      {aberto && <ConteudoPendentes onEscolher={o => navigate(`/orcamentos/${o.servico_id}`)} />}
    </Modal>
  )
}

export default ModalOrcamentosPendentes
