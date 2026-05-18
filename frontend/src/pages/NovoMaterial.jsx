import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

const unidades = ['un', 'kg', 'g', 'L', 'mL', 'm', 'm²', 'm³', 'cx', 'pç', 'rolo']

function NovoMaterial() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    unidade_medida: 'un',
    preco_unitario: '',
    quantidade_estoque: '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const salvar = async () => {
    setErro('')
    if (!form.nome || !form.preco_unitario || !form.quantidade_estoque) {
      setErro('Preencha nome, preço unitário e quantidade em estoque.')
      return
    }
    setSalvando(true)
    try {
      await api.post('/materiais', form)
      navigate('/materiais')
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao salvar material.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      <div className="px-6 pt-10 pb-4">
        <button onClick={() => navigate('/materiais')} className="text-xs text-gray-400 mb-4">← Voltar</button>
        <h1 className="text-lg font-bold text-gray-800">Novo Material</h1>
      </div>

      <div className="px-6 flex flex-col gap-4 mb-24">
        {erro && (
          <div className="bg-red-50 text-red-500 text-xs px-4 py-3 rounded-xl border border-red-200">
            {erro}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Ex: Tinta Acrílica Branca"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Detalhes do material..."
            rows={3}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-gray-600">Unidade *</label>
            <select
              name="unidade_medida"
              value={form.unidade_medida}
              onChange={handleChange}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
            >
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-gray-600">Qtd. Estoque *</label>
            <input
              name="quantidade_estoque"
              type="number"
              min="0"
              step="0.001"
              value={form.quantidade_estoque}
              onChange={handleChange}
              placeholder="0"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Preço Unitário (R$) *</label>
          <input
            name="preco_unitario"
            type="number"
            min="0"
            step="0.01"
            value={form.preco_unitario}
            onChange={handleChange}
            placeholder="0,00"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl mt-2 disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar Material'}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default NovoMaterial
