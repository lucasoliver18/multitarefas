import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import ClienteForm from '../components/ClienteForm'
import { FORM_CLIENTE_VAZIO, payloadCliente } from '../utils/clientes'
import { Carregando } from '../components/Pagina'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

function EditarCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(FORM_CLIENTE_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get(`/clientes/${id}`)
      .then(res => {
        const c = res.data
        setForm({
          nome:        c.nome        || '',
          tipo_pessoa: c.tipo_pessoa || 'fisica',
          cpf:         c.cpf         || '',
          cnpj:        c.cnpj        || '',
          telefone:    c.telefone    || '',
          email:       c.email       || '',
          observacoes: c.observacoes || '',
        })
        setCarregando(false)
      })
      .catch(e => {
        toast.erro(mensagemErro(e, 'Erro ao carregar cliente.'))
        navigate('/clientes')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const salvar = async () => {
    setSalvando(true)
    try {
      await api.put(`/clientes/${id}`, payloadCliente(form))
      toast.sucesso('Cliente atualizado')
      navigate('/clientes')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar cliente.'))
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Carregando />

  return (
    <ClienteForm
      titulo="Editar cliente"
      form={form}
      setForm={setForm}
      salvando={salvando}
      onSalvar={salvar}
      botaoLabel="Salvar alterações"
      onVoltar={() => navigate('/clientes')}
    />
  )
}

export default EditarCliente
