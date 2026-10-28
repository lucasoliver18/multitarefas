import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import ClienteForm from '../components/ClienteForm'
import { FORM_CLIENTE_VAZIO, payloadCliente } from '../utils/clientes'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

function NovoCliente() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(FORM_CLIENTE_VAZIO)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    setSalvando(true)
    try {
      await api.post('/clientes', payloadCliente(form))
      toast.sucesso('Cliente cadastrado')
      navigate('/clientes')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar cliente.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ClienteForm
      titulo="Novo cliente"
      form={form}
      setForm={setForm}
      salvando={salvando}
      onSalvar={salvar}
      botaoLabel="Salvar cliente"
      onVoltar={() => navigate('/clientes')}
    />
  )
}

export default NovoCliente
