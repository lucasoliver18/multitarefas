import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import OrcamentoForm from '../components/OrcamentoForm'
import { Carregando } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

function NovoOrcamento() {
  const { servicoId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [servico, setServico] = useState(null)
  const [form, setForm] = useState({ titulo: '', descricao: '', margem_lucro: '0', tipo_margem: 'percentual' })
  const [itens, setItens] = useState([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api.get(`/servicos/${servicoId}`)
      .then(res => setServico(res.data))
      .catch(e => {
        toast.erro(mensagemErro(e, 'Erro ao carregar serviço.'))
        navigate('/servicos')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicoId])

  const criarOrcamento = async () => {
    setSalvando(true)
    try {
      await api.post('/orcamentos', {
        servico_id: Number(servicoId),
        titulo: form.titulo,
        descricao: form.descricao,
        margem_lucro: parseFloat(form.margem_lucro || 0),
        tipo_margem: form.tipo_margem,
        materiais: itens.map(i => ({ id: i.id, quantidade: parseFloat(i.quantidade) })),
      })
      toast.sucesso('Orçamento criado')
      navigate(`/orcamentos/${servicoId}`)
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar orçamento.'))
    } finally {
      setSalvando(false)
    }
  }

  if (!servico) return <Carregando />

  return (
    <OrcamentoForm
      titulo="Novo orçamento"
      servico={servico}
      form={form}
      setForm={setForm}
      itens={itens}
      setItens={setItens}
      salvando={salvando}
      onSalvar={criarOrcamento}
      botaoLabel="Salvar orçamento"
      onVoltar={() => navigate(`/orcamentos/${servicoId}`)}
    />
  )
}

export default NovoOrcamento
