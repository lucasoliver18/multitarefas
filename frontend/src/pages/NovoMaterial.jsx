import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import MaterialForm from '../components/MaterialForm'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

function NovoMaterial() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    nome: '',
    marca: '',
    descricao: '',
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
    if (!form.nome || !form.preco_unitario) {
      toast.erro('Preencha nome e preço unitário.')
      return
    }
    setSalvando(true)
    try {
      await api.post('/materiais', {
        ...form,
        quantidade_estoque: form.quantidade_estoque === '' ? 0 : form.quantidade_estoque,
        quantidade_minima: form.quantidade_minima === '' ? null : form.quantidade_minima,
      })
      toast.sucesso('Material adicionado ao estoque!')
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
      salvando={salvando}
      onSalvar={salvar}
      botaoLabel="Salvar Material"
    />
  )
}

export default NovoMaterial
