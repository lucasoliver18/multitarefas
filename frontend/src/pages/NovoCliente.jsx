import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function NovoCliente() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', observacoes: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const salvar = async () => {
    setErro('')
    if (!form.nome) { setErro('O nome do cliente é obrigatório.'); return }
    setSalvando(true)
    try {
      await api.post('/clientes', form)
      navigate('/clientes')
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      <div className="px-6 pt-10 pb-4">
        <button onClick={() => navigate('/clientes')} className="text-xs text-gray-400 mb-4">← Voltar</button>
        <h1 className="text-lg font-bold text-gray-800">Novo Cliente</h1>
      </div>

      <div className="px-6 flex flex-col gap-4 mb-24">
        {erro && (
          <div className="bg-red-50 text-red-500 text-xs px-4 py-3 rounded-xl border border-red-200">{erro}</div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Nome *</label>
          <input name="nome" value={form.nome} onChange={handleChange}
            placeholder="Ex: João Silva"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Telefone</label>
          <input name="telefone" value={form.telefone} onChange={handleChange}
            placeholder="Ex: (11) 99999-0000"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">E-mail</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="Ex: joao@email.com"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
            placeholder="Informações relevantes sobre o cliente..."
            rows={3}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
        </div>

        <button onClick={salvar} disabled={salvando}
          className="bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl mt-2 disabled:opacity-60">
          {salvando ? 'Salvando...' : 'Salvar Cliente'}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default NovoCliente
