import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function NovoServico() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    cliente: '',
    prioridade: 'media',
    status: 'pendente',
    prazo: '',
    tag: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

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
      await api.post('/servicos', form)
      toast.sucesso('Serviço criado com sucesso!')
      navigate('/')
    } catch {
      setErro('Erro ao salvar serviço. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 pt-10 pb-5">
        <h1 className="text-lg font-bold text-white">Novo Serviço</h1>
        <p className="text-xs text-slate-300 mt-0.5">Preencha os dados do serviço</p>
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
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            className={INPUT}
            placeholder="Ex: Pintura de apartamento"
          />
        </div>

        <div>
          <p className={LABEL}>Cliente *</p>
          <input
            name="cliente"
            value={form.cliente}
            onChange={handleChange}
            className={INPUT}
            placeholder="Ex: Eunice"
          />
        </div>

        <div>
          <p className={LABEL}>Descrição</p>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            className={`${INPUT} resize-none h-28`}
            placeholder="Descreva com o maior número de detalhes possível..."
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
            <p className={LABEL}>Prazo</p>
            <input
              type="date"
              name="prazo"
              value={form.prazo}
              onChange={handleChange}
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <p className={LABEL}>Tag</p>
          <select name="tag" value={form.tag} onChange={handleChange} className={INPUT}>
            <option value="">Selecionar...</option>
            <option value="informatica">Informática</option>
            <option value="pintura">Pintura</option>
            <option value="outros">Outros</option>
          </select>
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
            onClick={() => navigate('/')}
            className="flex-1 border border-slate-300 text-slate-600 rounded-full py-3 text-sm font-semibold"
          >
            Descartar
          </button>
        </div>

      </div>

      <Navbar />
    </div>
  )
}

export default NovoServico
