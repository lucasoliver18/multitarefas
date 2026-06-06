import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function EditarServico() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    cliente: '',
    prioridade: 'media',
    status: 'pendente',
    prazo: '',
    tag: '',
  })

  useEffect(() => {
    api.get(`/servicos/${id}`).then(res => {
      const s = res.data
      setForm({
        titulo:     s.titulo     || '',
        descricao:  s.descricao  || '',
        cliente:    s.cliente    || '',
        prioridade: s.prioridade || 'media',
        status:     s.status     || 'pendente',
        prazo:      s.prazo      || '',
        tag:        s.tag        || '',
      })
    })
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSalvar = async () => {
    setErro('')
    if (!form.titulo || !form.cliente) {
      setErro('Título e cliente são obrigatórios!')
      return
    }
    setLoading(true)
    try {
      await api.put(`/servicos/${id}`, form)
      toast.sucesso('Serviço atualizado!')
      navigate('/servicos')
    } catch {
      setErro('Erro ao atualizar serviço. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 pt-10 pb-5">
        <h1 className="text-lg font-bold text-white">Editar Serviço</h1>
        <p className="text-xs text-slate-300 mt-0.5">Atualize os dados do serviço</p>
      </div>

      {/* Formulário */}
      <div className="px-6 pt-5 flex flex-col gap-4 mb-24">

        {erro && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200">
            {erro}
          </div>
        )}

        <div>
          <p className={LABEL}>Título *</p>
          <input name="titulo" value={form.titulo} onChange={handleChange} className={INPUT} />
        </div>

        <div>
          <p className={LABEL}>Cliente *</p>
          <input name="cliente" value={form.cliente} onChange={handleChange} className={INPUT} />
        </div>

        <div>
          <p className={LABEL}>Descrição</p>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            className={`${INPUT} resize-none h-28`}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <p className={LABEL}>Prioridade</p>
            <select name="prioridade" value={form.prioridade} onChange={handleChange} className={INPUT}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <div className="flex-1">
            <p className={LABEL}>Status</p>
            <select name="status" value={form.status} onChange={handleChange} className={INPUT}>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <p className={LABEL}>Prazo</p>
            <input type="date" name="prazo" value={form.prazo} onChange={handleChange} className={INPUT} />
          </div>
          <div className="flex-1">
            <p className={LABEL}>Tag</p>
            <select name="tag" value={form.tag} onChange={handleChange} className={INPUT}>
              <option value="">Nenhuma</option>
              <option value="informatica">Informática</option>
              <option value="pintura">Pintura</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="flex-1 bg-[#2563eb] hover:bg-[#1e3a5f] text-white rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/servicos')}
            className="flex-1 border border-slate-300 text-slate-600 rounded-full py-3 text-sm font-semibold"
          >
            Cancelar
          </button>
        </div>

      </div>

      <Navbar />
    </div>
  )
}

export default EditarServico
