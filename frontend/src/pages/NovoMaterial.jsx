import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import MaterialForm from '../components/MaterialForm'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'
import { erroMaterial, payloadMaterial } from '../utils/materiais'

function NovoMaterial() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    nome: '',
    marca: '',
    marca_id: null,
    descricao: '',
    tags: [],
    unidade_medida: 'un',
    preco_unitario: '',
    quantidade_estoque: '',
    quantidade_minima: '',
  })
  const [salvando, setSalvando] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const salvar = async () => {
    const erro = erroMaterial(form)
    if (erro) {
      toast.erro(erro)
      return
    }
    setSalvando(true)
    try {
      await api.post('/materiais', payloadMaterial(form))
      toast.sucesso('Material cadastrado')
      navigate('/materiais')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar material.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <MaterialForm
      titulo="Novo Material"
      form={form}
      onChange={handleChange}
      onChangeTags={tags => setForm(prev => ({ ...prev, tags }))}
      onChangeCampos={campos => setForm(prev => ({ ...prev, ...campos }))}
      salvando={salvando}
      onSalvar={salvar}
      botaoLabel="Salvar Material"
    />
  )
}

export default NovoMaterial
