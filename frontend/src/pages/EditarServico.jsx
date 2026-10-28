import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import ServicoForm from '../components/ServicoForm'
import { FORM_SERVICO_VAZIO } from '../utils/servicos'
import { Carregando } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

function EditarServico() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const [form, setForm] = useState(FORM_SERVICO_VAZIO)
  const [statusOriginal, setStatusOriginal] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api.get(`/servicos/${id}`)
      .then(res => {
        const s = res.data
        setStatusOriginal(s.status || 'pendente')
        setForm({
          titulo:     s.titulo     || '',
          descricao:  s.descricao  || '',
          cliente:    s.cliente    || '',
          cliente_id: s.cliente_id || null,
          prioridade: s.prioridade || 'media',
          status:     s.status     || 'pendente',
          pago:       !!s.pago,
          prazo:      s.prazo      || '',
          tag:        s.tag        || '',
        })
      })
      .catch(e => {
        toast.erro(mensagemErro(e, 'Erro ao carregar serviço.'))
        navigate('/servicos')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const salvar = async () => {
    setSalvando(true)
    try {
      await api.put(`/servicos/${id}`, form)
      toast.sucesso('Serviço atualizado')
      navigate('/servicos')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar serviço.'))
    } finally {
      setSalvando(false)
    }
  }

  if (!statusOriginal) return <Carregando />

  return (
    <ServicoForm
      titulo="Editar serviço"
      subtitulo="Atualize os dados do serviço"
      form={form}
      setForm={setForm}
      statusOriginal={statusOriginal}
      salvando={salvando}
      onSalvar={salvar}
      onCancelar={() => navigate('/servicos')}
      voltar={{ label: 'Serviços', onClick: () => navigate('/servicos') }}
    />
  )
}

export default EditarServico
