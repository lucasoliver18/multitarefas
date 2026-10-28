import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../services/api'
import Button from '../components/Button'
import { Pagina, CabecalhoPagina, Carregando, Vazio } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { usePaginacao } from '../hooks/usePaginacao'
import Paginacao from '../components/Paginacao'
import { mensagemErro } from '../utils/erros'
import { TAG_LABEL } from '../utils/status'
import { formatarPreco, calcularValorFinal, descreverMargem } from '../utils/orcamentos'

const badgeOrcStatus = (s) => ({
  aprovado:  'bg-[#dcfce7] text-[#166534]',
  reprovado: 'bg-[#fee2e2] text-[#991b1b]',
  pendente:  'bg-[#fef9c3] text-[#854d0e]',
}[s] || 'bg-[#fef9c3] text-[#854d0e]')

const labelStatus = { pendente: 'Pendente', aprovado: 'Aprovado', reprovado: 'Reprovado' }

// Texto da confirmação de cada ação. Excluir um aprovado avisa que ele está
// aprovado e que o estoque debitado volta.
const CONFIRMACOES = {
  aprovar: () => 'Aprovar? O estoque será debitado.',
  reprovar: () => 'Reprovar este orçamento?',
  excluir: (o) => o.status === 'aprovado'
    ? 'Orçamento aprovado. Excluir mesmo assim? O estoque será devolvido.'
    : 'Excluir este orçamento?',
}
const iconeOrcStatus = { pendente: Clock, aprovado: CheckCircle2, reprovado: XCircle }

function Orcamentos() {
  const { servicoId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [orcamentos, setOrcamentos] = useState([])
  const [servico, setServico] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [confirmando, setConfirmando] = useState(null)
  const { pagina, setPagina, tamanhoPagina, mudarTamanhoPagina, totalPaginas, itensPagina } = usePaginacao(orcamentos)

  useEffect(() => {
    Promise.all([
      api.get(`/servicos/${servicoId}/orcamentos`),
      api.get(`/servicos/${servicoId}`),
    ]).then(([resOrc, resSrv]) => {
      setOrcamentos(resOrc.data)
      setServico(resSrv.data)
    }).catch(e => {
      toast.erro(mensagemErro(e, 'Erro ao carregar orçamentos.'))
      navigate('/servicos')
    }).finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicoId])

  const recarregarOrcamentos = async () => {
    const res = await api.get(`/servicos/${servicoId}/orcamentos`)
    setOrcamentos(res.data)
  }

  const reprovar = async (id) => {
    setConfirmando(null)
    try {
      await api.patch(`/orcamentos/${id}/reprovar`)
      await recarregarOrcamentos()
      toast.sucesso('Orçamento reprovado')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao reprovar orçamento.'))
    }
  }

  const perguntarEmAndamento = () => {
    if (!servico || servico.status !== 'pendente') return
    toast.confirmar('Orçamento aprovado. Mudar serviço para "Em andamento"?', async () => {
      try {
        const res = await api.patch(`/servicos/${servicoId}`, { status: 'em_andamento' })
        setServico(res.data)
        toast.sucesso('Serviço em andamento')
      } catch (e) {
        toast.erro(mensagemErro(e, 'Erro ao atualizar status.'))
      }
    })
  }

  const aprovar = async (id) => {
    setConfirmando(null)
    try {
      await api.patch(`/orcamentos/${id}/aprovar`)
      await recarregarOrcamentos()
      toast.sucesso('Orçamento aprovado')
      perguntarEmAndamento()
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao aprovar orçamento.'))
    }
  }

  const excluir = async (id) => {
    setConfirmando(null)
    try {
      await api.delete(`/orcamentos/${id}`)
      await recarregarOrcamentos()
      toast.sucesso('Orçamento excluído')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao excluir orçamento.'))
    }
  }

  if (carregando) return <Carregando />

  const subtitulo = servico
    ? [servico.titulo, servico.cliente, servico.tag ? `Tag: ${TAG_LABEL[servico.tag] || servico.tag}` : null].filter(Boolean).join(' · ')
    : null

  return (
    <Pagina largura="max-w-6xl">
      <CabecalhoPagina
        titulo="Orçamentos"
        subtitulo={subtitulo}
        voltar={{ label: 'Serviços', onClick: () => navigate('/servicos') }}
        acoes={
          <Button onClick={() => navigate(`/orcamentos/${servicoId}/novo`)} className="text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
            <Plus size={16} />
            Novo orçamento
          </Button>
        }
      />

      {orcamentos.length === 0 && <Vazio>Nenhum orçamento cadastrado para este serviço.</Vazio>}

      {orcamentos.length > 0 && (
        <Paginacao pagina={pagina} setPagina={setPagina} tamanhoPagina={tamanhoPagina}
          mudarTamanhoPagina={mudarTamanhoPagina} totalPaginas={totalPaginas} total={orcamentos.length} />
      )}

      <div className="grid grid-cols-2 gap-5">
        {itensPagina.map(o => {
          const valorMateriais = (o.materiais || []).reduce((acc, m) =>
            acc + parseFloat(m.pivot.quantidade) * parseFloat(m.pivot.preco_unitario_snapshot), 0)
          const valorFinal = calcularValorFinal(valorMateriais, o.margem_lucro, o.tipo_margem)
          const IconeStatus = iconeOrcStatus[o.status] || Clock

          return (
            <div key={o.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-800">{o.titulo}</p>
                  {o.descricao && <p className="text-sm text-slate-500 mt-1">{o.descricao}</p>}
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeOrcStatus(o.status)}`}>
                  <IconeStatus size={13} />
                  {labelStatus[o.status]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-slate-500">Materiais</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatarPreco(valorMateriais)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Margem</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{descreverMargem(o.margem_lucro, o.tipo_margem)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-base font-bold text-[#2563eb] mt-0.5">{formatarPreco(valorFinal)}</p>
                </div>
              </div>

              {(o.materiais || []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {o.materiais.map(m => (
                    <span key={m.id} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">
                      {m.nome} × {parseFloat(m.pivot.quantidade)} {m.unidade_medida}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-4">
                {confirmando?.id === o.id ? (
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <p className={`text-sm flex-1 ${confirmando.acao === 'excluir' && o.status === 'aprovado' ? 'text-red-700 font-medium' : 'text-slate-600'}`}>
                      {CONFIRMACOES[confirmando.acao](o)}
                    </p>
                    <Button
                      variant={confirmando.acao === 'aprovar' ? 'success' : 'danger'}
                      onClick={() => ({ aprovar, reprovar, excluir })[confirmando.acao](o.id)}
                      className="text-sm px-3 py-1.5 rounded-lg font-semibold"
                    >
                      {{ aprovar: 'Sim, aprovar', reprovar: 'Sim, reprovar', excluir: 'Sim, excluir' }[confirmando.acao]}
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmando(null)} className="text-sm px-3 py-1.5 rounded-lg font-semibold">
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    {o.status === 'pendente' && (
                      <Button variant="success" onClick={() => setConfirmando({ id: o.id, acao: 'aprovar' })} className="text-sm px-4 py-1.5 rounded-lg font-semibold">
                        Aprovar
                      </Button>
                    )}
                    {o.status !== 'reprovado' && (
                      <Button variant="danger" onClick={() => setConfirmando({ id: o.id, acao: 'reprovar' })} className="text-sm px-4 py-1.5 rounded-lg font-semibold">
                        Reprovar
                      </Button>
                    )}
                    <Button onClick={() => navigate(`/orcamentos/${servicoId}/editar/${o.id}`)} className="text-sm px-4 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5">
                      <Pencil size={14} />
                      Editar
                    </Button>
                    <button
                      onClick={() => setConfirmando({ id: o.id, acao: 'excluir' })}
                      aria-label="Excluir orçamento"
                      title="Excluir"
                      className="p-2 text-red-400 rounded-lg transition-all hover:text-red-600 hover:bg-red-50 active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Pagina>
  )
}

export default Orcamentos
