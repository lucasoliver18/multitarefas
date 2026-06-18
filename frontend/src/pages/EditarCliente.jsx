import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function EditarCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', observacoes: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get(`/clientes/${id}`)
      .then(res => {
        const c = res.data
        setForm({
          nome:        c.nome        || '',
          telefone:    c.telefone    || '',
          email:       c.email       || '',
          observacoes: c.observacoes || '',
        })
      })
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const salvar = async () => {
    setErro('')
    if (!form.nome) { setErro('O nome do cliente é obrigatório.'); return }
    setSalvando(true)
    try {
      await api.put(`/clientes/${id}`, form)
      toast.sucesso('Alterações salvas!')
      navigate('/clientes')
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate('/clientes')} className="text-xs text-slate-300 mb-3">← Voltar</button>
        <h1 className="text-lg font-bold text-white">Editar Cliente</h1>
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4 mb-24">
        {erro && (
          <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200">{erro}</div>
        )}

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Nome *</label>
          <input name="nome" value={form.nome} onChange={handleChange} className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Telefone</label>
          <input name="telefone" value={form.telefone} onChange={handleChange}
            placeholder="Ex: (11) 99999-0000"
            className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>E-mail</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="Ex: joao@email.com"
            className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
            rows={3}
            className={`${INPUT} resize-none`} />
        </div>

        <button onClick={salvar} disabled={salvando}
          className="bg-[#2563eb] hover:bg-[#1e3a5f] text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors">
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default EditarCliente
