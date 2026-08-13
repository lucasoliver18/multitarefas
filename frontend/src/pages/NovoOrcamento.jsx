import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'
import { useMateriais } from '../hooks/useMateriais'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function NovoOrcamento() {
  const { servicoId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { materiais } = useMateriais()
  const [servico, setServico] = useState(null)
  const [form, setForm] = useState({ titulo: '', descricao: '', margem_lucro: '0' })
  const [itens, setItens] = useState([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api.get(`/servicos/${servicoId}`).then(res => setServico(res.data))
  }, [servicoId])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const adicionarMaterial = (materialId) => {
    if (!materialId || itens.find(i => i.id === Number(materialId))) return
    const material = materiais.find(m => m.id === Number(materialId))
    if (material) {
      setItens([...itens, { id: material.id, nome: material.nome, unidade_medida: material.unidade_medida, preco_unitario: material.preco_unitario, quantidade: '1' }])
    }
  }

  const atualizarQuantidade = (id, quantidade) =>
    setItens(itens.map(i => i.id === id ? { ...i, quantidade } : i))

  const removerItem = (id) => setItens(itens.filter(i => i.id !== id))

  const valorMateriais = itens.reduce((acc, i) => acc + parseFloat(i.preco_unitario) * parseFloat(i.quantidade || 0), 0)
  const valorFinal = valorMateriais * (1 + parseFloat(form.margem_lucro || 0) / 100)

  const salvar = async () => {
    setErro('')
    if (!form.titulo) { setErro('Informe o título do orçamento.'); return }
    setSalvando(true)
    try {
      await api.post('/orcamentos', {
        servico_id: Number(servicoId),
        titulo: form.titulo,
        descricao: form.descricao,
        margem_lucro: parseFloat(form.margem_lucro),
        materiais: itens.map(i => ({ id: i.id, quantidade: parseFloat(i.quantidade) })),
      })
      toast.sucesso('Orçamento criado com sucesso!')
      navigate(`/orcamentos/${servicoId}`)
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao salvar orçamento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate(`/orcamentos/${servicoId}`)} className="text-xs text-slate-300 mb-3">← Voltar</button>
        <h1 className="text-lg font-bold text-white">Novo Orçamento</h1>
        {servico && <p className="text-xs text-slate-300 mt-0.5">{servico.titulo}</p>}
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4 mb-24">
        {erro && (
          <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200">{erro}</div>
        )}

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Título *</label>
          <input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ex: Orçamento Opção A" className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Detalhes do orçamento..."
            rows={2}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={LABEL}>Materiais</label>
          <select
            onChange={(e) => { adicionarMaterial(e.target.value); e.target.value = '' }}
            className={INPUT + ' text-slate-500'}
            defaultValue=""
          >
            <option value="" disabled>Selecionar material...</option>
            {materiais.map(m => (
              <option key={m.id} value={m.id}>
                {m.nome} (estoque: {parseFloat(m.quantidade_estoque)} {m.unidade_medida})
              </option>
            ))}
          </select>

          {itens.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {itens.map(item => (
                <div key={item.id} className="bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700">{item.nome}</p>
                    <p className="text-xs text-slate-400">R$ {parseFloat(item.preco_unitario).toFixed(2)} / {item.unidade_medida}</p>
                  </div>
                  <input
                    type="number" inputMode="decimal" min="0.001" step="0.001"
                    value={item.quantidade}
                    onChange={(e) => atualizarQuantidade(item.id, e.target.value)}
                    className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-blue-600"
                  />
                  <span className="text-xs text-slate-400">{item.unidade_medida}</span>
                  <button onClick={() => removerItem(item.id)} className="text-red-400 text-xs font-bold ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Margem de Lucro (%)</label>
          <input name="margem_lucro" type="number" inputMode="decimal" min="0" step="0.5" value={form.margem_lucro} onChange={handleChange} className={INPUT} />
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-slate-600">Custo materiais: <span className="font-semibold text-slate-800">R$ {valorMateriais.toFixed(2)}</span></p>
          <p className="text-xs text-slate-600 mt-1">Margem ({form.margem_lucro}%): <span className="font-semibold text-slate-800">R$ {(valorFinal - valorMateriais).toFixed(2)}</span></p>
          <p className="text-sm font-bold text-[#2563eb] mt-2">Total: R$ {valorFinal.toFixed(2)}</p>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-[#2563eb] hover:bg-[#1e3a5f] text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors"
        >
          {salvando ? 'Salvando...' : 'Salvar Orçamento'}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default NovoOrcamento
