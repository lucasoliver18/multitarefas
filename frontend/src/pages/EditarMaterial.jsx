import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import MaterialForm from '../components/MaterialForm'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'
import { erroMaterial, payloadMaterial } from '../utils/materiais'

function EditarMaterial() {
  const { id } = useParams()
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
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(false)

  useEffect(() => {
    api.get(`/materiais/${id}`)
      .then(res => {
        const m = res.data
        setForm({
          nome:               m.nome,
          marca:              m.marca || '',
          marca_id:           m.marca_id || null,
          descricao:          m.descricao || '',
          tags:               m.tags || [],
          unidade_medida:     m.unidade_medida,
          preco_unitario:     m.preco_unitario,
          quantidade_estoque: m.quantidade_estoque,
          quantidade_minima:  m.quantidade_minima ?? '',
        })
      })
      .catch(() => setErroCarregamento(true))
      .finally(() => setCarregando(false))
  }, [id])

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
      await api.put(`/materiais/${id}`, payloadMaterial(form))
      toast.sucesso('Material atualizado')
      navigate('/materiais')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao salvar material.'))
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="py-24 flex items-center justify-center text-slate-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-slate-500 text-sm text-center">Material não encontrado ou erro ao carregar.</p>
        <button
          onClick={() => navigate('/materiais')}
          className="text-sm bg-[#2563eb] text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:bg-[#1e3a5f] active:scale-[0.96]"
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
      onChangeTags={tags => setForm(prev => ({ ...prev, tags }))}
      onChangeCampos={campos => setForm(prev => ({ ...prev, ...campos }))}
      salvando={salvando}
      onSalvar={salvar}
      botaoLabel="Salvar Alterações"
    />
  )
}

export default EditarMaterial
