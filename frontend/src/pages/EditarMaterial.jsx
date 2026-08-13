import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import MaterialForm from '../components/MaterialForm'
import { useToast } from '../hooks/useToast'

function EditarMaterial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    unidade_medida: 'un',
    preco_unitario: '',
    quantidade_estoque: '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(false)

  useEffect(() => {
    api.get(`/materiais/${id}`)
      .then(res => {
        const m = res.data
        setForm({
          nome:               m.nome,
          descricao:          m.descricao || '',
          unidade_medida:     m.unidade_medida,
          preco_unitario:     m.preco_unitario,
          quantidade_estoque: m.quantidade_estoque,
        })
      })
      .catch(() => setErroCarregamento(true))
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const salvar = async () => {
    setErro('')
    if (!form.nome || !form.preco_unitario) {
      setErro('Preencha nome e preço unitário.')
      return
    }
    setSalvando(true)
    try {
      await api.put(`/materiais/${id}`, {
        ...form,
        quantidade_estoque: form.quantidade_estoque === '' ? 0 : form.quantidade_estoque,
      })
      toast.sucesso('Material atualizado com sucesso!')
      navigate('/materiais')
    } catch (e) {
      const erros = e.response?.data?.errors
      setErro(erros ? Object.values(erros).flat()[0] : 'Erro ao salvar material.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-slate-500 text-sm text-center">Material não encontrado ou erro ao carregar.</p>
        <button
          onClick={() => navigate('/materiais')}
          className="text-xs bg-[#2563eb] text-white px-4 py-2 rounded-full font-semibold"
        >
          Voltar aos materiais
        </button>
      </div>
    )
  }

  return (
    <MaterialForm
      titulo="Editar Material"
      form={form}
      onChange={handleChange}
      erro={erro}
      salvando={salvando}
      onSalvar={salvar}
      botaoLabel="Salvar Alterações"
    />
  )
}

export default EditarMaterial
