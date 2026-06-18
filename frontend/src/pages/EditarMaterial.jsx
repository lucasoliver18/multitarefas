import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'

const unidades = ['un', 'kg', 'g', 'L', 'mL', 'm', 'm²', 'm³', 'cx', 'pç', 'rolo']
const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

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
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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
      setErro(e.response?.data?.message || 'Erro ao salvar material.')
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
        <button onClick={() => navigate('/materiais')} className="text-xs text-slate-300 mb-3">← Voltar</button>
        <h1 className="text-lg font-bold text-white">Editar Material</h1>
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
          <label className={LABEL}>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            rows={3}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className={LABEL}>Unidade *</label>
            <select name="unidade_medida" value={form.unidade_medida} onChange={handleChange} className={INPUT}>
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className={LABEL}>Qtd. Estoque *</label>
            <input
              name="quantidade_estoque"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              value={form.quantidade_estoque}
              onChange={handleChange}
              placeholder="0"
              className={INPUT}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Preço Unitário (R$) *</label>
          <input
            name="preco_unitario"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.preco_unitario}
            onChange={handleChange}
            className={INPUT}
          />
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-[#2563eb] hover:bg-[#1e3a5f] text-white text-sm font-semibold py-3 rounded-xl mt-2 disabled:opacity-60 transition-colors"
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default EditarMaterial
