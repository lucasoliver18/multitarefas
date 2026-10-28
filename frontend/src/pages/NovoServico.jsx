import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import ServicoForm from '../components/ServicoForm'
import { FORM_SERVICO_VAZIO } from '../utils/servicos'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'
import { dataValida } from '../utils/prazos'

function NovoServico() {
  const navigate = useNavigate()
  const toast = useToast()
  // ?prazo=AAAA-MM-DD (vindo do dia selecionado em Prazos) já preenche o prazo.
  const [searchParams] = useSearchParams()
  const prazoLink = dataValida(searchParams.get('prazo') || '') ? searchParams.get('prazo') : ''
  const [form, setForm] = useState({ ...FORM_SERVICO_VAZIO, prazo: prazoLink })
  const [salvando, setSalvando] = useState(false)
  const voltarPara = prazoLink ? `/prazos?data=${prazoLink}` : '/servicos'

  const salvar = async () => {
    setSalvando(true)
    try {
      await api.post('/servicos', form)
      toast.sucesso('Serviço criado')
      navigate(prazoLink && form.prazo ? `/prazos?data=${form.prazo}` : voltarPara)
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar serviço.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ServicoForm
      titulo="Novo serviço"
      subtitulo="Preencha os dados do serviço"
      form={form}
      setForm={setForm}
      salvando={salvando}
      onSalvar={salvar}
      onCancelar={() => navigate(voltarPara)}
      voltar={{ label: prazoLink ? 'Prazos' : 'Serviços', onClick: () => navigate(voltarPara) }}
    />
  )
}

export default NovoServico
