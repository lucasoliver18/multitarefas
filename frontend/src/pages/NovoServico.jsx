import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function NovoServico() {
  const navigate = useNavigate()
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
      navigate('/')
    } catch (err) {
      setErro('Erro ao salvar serviço. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-lg font-bold text-gray-800">O que temos para fazer</h1>
      </div>

      {/* Formulário */}
      <div className="px-6 flex flex-col gap-4 mb-24">

        {erro && (
          <div className="bg-red-100 text-red-600 text-xs p-3 rounded-xl">
            {erro}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Título:</p>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none shadow-sm"
            placeholder="Ex: Pintura de apartamento"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Cliente:</p>
          <input
            name="cliente"
            value={form.cliente}
            onChange={handleChange}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none shadow-sm"
            placeholder="Ex: Eunice"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Descrição:</p>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            className="w-full bg-white border border-blue-300 rounded-xl p-4 text-xs outline-none shadow-sm resize-none h-28"
            placeholder="Dica: Descreva com o maior número de detalhes possível..."
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-1">Prioridade:</p>
            <select
              name="prioridade"
              value={form.prioridade}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none shadow-sm"
            >
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-1">Prazo:</p>
            <input
              type="date"
              name="prazo"
              value={form.prazo}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none shadow-sm"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Tag:</p>
          <input
            name="tag"
            value={form.tag}
            onChange={handleChange}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none shadow-sm"
            placeholder="Ex: #pintura"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="flex-1 bg-blue-500 text-white rounded-full py-2 text-sm font-semibold"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 border border-orange-400 text-orange-500 rounded-full py-2 text-sm font-semibold"
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