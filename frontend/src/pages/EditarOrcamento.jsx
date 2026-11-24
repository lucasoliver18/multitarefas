import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, XCircle } from 'lucide-react'
import api from '../services/api'
import Button from '../components/Button'
import OrcamentoForm from '../components/OrcamentoForm'
import { Carregando } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'
import { mensagemAprovar, mensagemReprovar, materiaisExcluidos, mensagemMaterialExcluido } from '../utils/orcamentos'

function EditarOrcamento() {
  const { servicoId, id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [servico, setServico] = useState(null)
  const [form, setForm] = useState({ titulo: '', descricao: '', margem_lucro: '0', tipo_margem: 'percentual', sem_materiais: false })
  const [itens, setItens] = useState([])
  const [statusAtual, setStatusAtual] = useState('pendente')
  // Versão salva: aprovar/reprovar agem sobre ela (não sobre edições não salvas).
  const [salvo, setSalvo] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/materiais'),
      api.get(`/orcamentos/${id}`),
      api.get(`/servicos/${servicoId}`),
    ]).then(([resMat, resOrc, resSrv]) => {
      const o = resOrc.data
      setServico(resSrv.data)
      setForm({
        titulo: o.titulo,
        descricao: o.descricao || '',
        margem_lucro: String(parseFloat(o.margem_lucro)),
        tipo_margem: o.tipo_margem || 'percentual',
        sem_materiais: !!o.sem_materiais,
      })
      setStatusAtual(o.status)
      setSalvo(o)
      setItens((o.materiais || []).map(m => {
        const estoque = resMat.data.find(mat => mat.id === m.id)?.quantidade_estoque
        // Aprovado já debitou a própria quantidade: para o aviso de estoque,
        // o disponível para este orçamento é o que sobrou + o que ele já usa.
        const disponivel = estoque != null && o.status === 'aprovado'
          ? parseFloat(estoque) + parseFloat(m.pivot.quantidade)
          : estoque
        return {
          id: m.id,
          nome: m.nome,
          unidade_medida: m.unidade_medida,
          preco_unitario: m.pivot.preco_unitario_snapshot,
          quantidade_estoque: disponivel,
          quantidade: String(parseFloat(m.pivot.quantidade)),
          // Excluído do cadastro: só pode manter, diminuir ou remover.
          excluido: !!m.excluido,
          quantidade_original: parseFloat(m.pivot.quantidade),
        }
      }))
    }).catch(e => {
      toast.erro(mensagemErro(e, 'Erro ao carregar orçamento'))
      navigate(`/orcamentos/${servicoId}`)
    }).finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, servicoId])

  const atualizarOrcamento = async () => {
    setSalvando(true)
    try {
      await api.put(`/orcamentos/${id}`, {
        titulo: form.titulo,
        descricao: form.descricao,
        margem_lucro: parseFloat(form.margem_lucro || 0),
        tipo_margem: form.sem_materiais ? 'valor' : form.tipo_margem,
        sem_materiais: !!form.sem_materiais,
        materiais: form.sem_materiais ? [] : itens.map(i => ({ id: i.id, quantidade: parseFloat(i.quantidade) })),
      })
      toast.sucesso('Orçamento atualizado')
      navigate(`/orcamentos/${servicoId}`)
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar orçamento'))
    } finally {
      setSalvando(false)
    }
  }

  const aprovar = () => {
    const excluidos = materiaisExcluidos(salvo)
    if (excluidos.length > 0) {
      // Já removido na tela, mas ainda não salvo: o servidor aprova o que está salvo.
      const removidosSemSalvar = !itens.some(i => i.excluido)
      toast.erro(removidosSemSalvar
        ? 'Salve as alterações antes de aprovar: o material excluído ainda está no orçamento salvo'
        : mensagemMaterialExcluido(excluidos))
      return
    }
    // O serviço tem aprovado e não é este: aprovar este reprova aquele.
    const outroAprovado = !!servico?.tem_orcamento_aprovado && statusAtual !== 'aprovado'
    toast.confirmar(mensagemAprovar(salvo, outroAprovado), async () => {
      try {
        await api.patch(`/orcamentos/${id}/aprovar`)
        toast.sucesso('Orçamento aprovado')
        navigate(`/orcamentos/${servicoId}`)
      } catch (e) {
        toast.erro(mensagemErro(e, 'Erro ao aprovar orçamento'))
      }
    })
  }

  const reprovar = () => {
    toast.confirmar(mensagemReprovar(salvo), async () => {
      try {
        await api.patch(`/orcamentos/${id}/reprovar`)
        toast.sucesso('Orçamento reprovado')
        navigate(`/orcamentos/${servicoId}`)
      } catch (e) {
        toast.erro(mensagemErro(e, 'Erro ao reprovar orçamento'))
      }
    })
  }

  if (carregando || !servico) return <Carregando />

  return (
    <OrcamentoForm
      titulo="Editar orçamento"
      servico={servico}
      form={form}
      setForm={setForm}
      itens={itens}
      setItens={setItens}
      salvando={salvando}
      onSalvar={atualizarOrcamento}
      botaoLabel="Salvar alterações"
      onVoltar={() => navigate(`/orcamentos/${servicoId}`)}
      aprovado={statusAtual === 'aprovado'}
      acoesExtras={(
        <div className="flex gap-3">
          {statusAtual !== 'aprovado' && (
            <Button
              variant="success"
              onClick={aprovar}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              Aprovar
            </Button>
          )}
          {statusAtual !== 'reprovado' && (
            <Button
              variant="danger"
              onClick={reprovar}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5"
            >
              <XCircle size={16} />
              Reprovar
            </Button>
          )}
        </div>
      )}
    />
  )
}

export default EditarOrcamento
