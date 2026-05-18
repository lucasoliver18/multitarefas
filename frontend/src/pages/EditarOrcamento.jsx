import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function EditarOrcamento() {
  const { servicoId, id } = useParams()
  const navigate = useNavigate()
  const [todosMateriaisList, setTodosMateriaisList] = useState([])
  const [form, setForm] = useState({ titulo: '', descricao: '', margem_lucro: '0' })
  const [itens, setItens] = useState([])
  const [statusAtual, setStatusAtual] = useState('pendente')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/materiais'),
      api.get(`/orcamentos/${id}`),
    ]).then(([resMat, resOrc]) => {
      setTodosMateriaisList(resMat.data)
      const o = resOrc.data
      setForm({ titulo: o.titulo, descricao: o.descricao || '', margem_lucro: o.margem_lucro })
      setStatusAtual(o.status)
      setItens((o.materiais || []).map(m => ({
        id: m.id,
        nome: m.nome,
        unidade_medida: m.unidade_medida,
        preco_unitario: m.pivot.preco_unitario_snapshot,
        quantidade: String(m.pivot.quantidade),
      })))
    }).finally(() => setCarregando(false))
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const adicionarMaterial = (materialId) => {
    if (!materialId || itens.find(i => i.id === Number(materialId))) return
    const material = todosMateriaisList.find(m => m.id === Number(materialId))
    if (material) {
      setItens([...itens, { id: material.id, nome: material.nome, unidade_medida: material.unidade_medida, preco_unitario: material.preco_unitario, quantidade: '1' }])
    }
  }

  const atualizarQuantidade = (id, quantidade) => {
    setItens(itens.map(i => i.id === id ? { ...i, quantidade } : i))
  }

  const removerItem = (id) => setItens(itens.filter(i => i.id !== id))

  const valorMateriais = itens.reduce((acc, i) => acc + parseFloat(i.preco_unitario) * parseFloat(i.quantidade || 0), 0)
  const valorFinal = valorMateriais * (1 + parseFloat(form.margem_lucro || 0) / 100)

  const salvar = async () => {
    setErro('')
    if (!form.titulo) { setErro('Informe o título do orçamento.'); return }
    setSalvando(true)
    try {
      await api.put(`/orcamentos/${id}`, {
        titulo: form.titulo,
        descricao: form.descricao,
        margem_lucro: parseFloat(form.margem_lucro),
        materiais: itens.map(i => ({ id: i.id, quantidade: parseFloat(i.quantidade) })),
      })
      navigate(`/orcamentos/${servicoId}`)
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao salvar orçamento.')
    } finally {
      setSalvando(false)
    }
  }

  const aprovar = async () => {
    if (!confirm('Deseja aprovar este orçamento? O estoque será deduzido.')) return
    try {
      await api.patch(`/orcamentos/${id}/aprovar`)
      navigate(`/orcamentos/${servicoId}`)
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao aprovar orçamento.')
    }
  }

  const reprovar = async () => {
    if (!confirm('Deseja reprovar este orçamento?')) return
    try {
      await api.patch(`/orcamentos/${id}/reprovar`)
      navigate(`/orcamentos/${servicoId}`)
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao reprovar orçamento.')
    }
  }

  if (carregando) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-sm mx-auto">

      <div className="px-6 pt-10 pb-4">
        <button onClick={() => navigate(`/orcamentos/${servicoId}`)} className="text-xs text-gray-400 mb-2">← Voltar</button>
        <h1 className="text-lg font-bold text-gray-800">Editar Orçamento</h1>
      </div>

      <div className="px-6 flex flex-col gap-4 mb-24">
        {erro && (
          <div className="bg-red-50 text-red-500 text-xs px-4 py-3 rounded-xl border border-red-200">{erro}</div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Título *</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            rows={2}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-600">Materiais</label>
          <select
            onChange={(e) => { adicionarMaterial(e.target.value); e.target.value = '' }}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none text-gray-500"
            defaultValue=""
          >
            <option value="" disabled>Adicionar material...</option>
            {todosMateriaisList.map(m => (
              <option key={m.id} value={m.id}>
                {m.nome} (estoque: {parseFloat(m.quantidade_estoque)} {m.unidade_medida})
              </option>
            ))}
          </select>

          {itens.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {itens.map(item => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700">{item.nome}</p>
                    <p className="text-xs text-gray-400">R$ {parseFloat(item.preco_unitario).toFixed(2)} / {item.unidade_medida}</p>
                  </div>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.quantidade}
                    onChange={(e) => atualizarQuantidade(item.id, e.target.value)}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center outline-none"
                  />
                  <span className="text-xs text-gray-400">{item.unidade_medida}</span>
                  <button onClick={() => removerItem(item.id)} className="text-red-400 text-xs font-bold ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Margem de Lucro (%)</label>
          <input
            name="margem_lucro"
            type="number"
            min="0"
            step="0.5"
            value={form.margem_lucro}
            onChange={handleChange}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-gray-600">Custo materiais: <span className="font-semibold text-gray-800">R$ {valorMateriais.toFixed(2)}</span></p>
          <p className="text-xs text-gray-600 mt-1">Margem ({form.margem_lucro}%): <span className="font-semibold text-gray-800">R$ {(valorFinal - valorMateriais).toFixed(2)}</span></p>
          <p className="text-sm font-bold text-blue-600 mt-2">Total: R$ {valorFinal.toFixed(2)}</p>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>

        {/* Ações de status */}
        <div className="flex gap-3">
          {statusAtual !== 'aprovado' && (
            <button
              onClick={aprovar}
              className="flex-1 bg-green-500 text-white text-sm font-semibold py-3 rounded-xl"
            >
              ✔ Aprovar
            </button>
          )}
          {statusAtual !== 'reprovado' && (
            <button
              onClick={reprovar}
              className="flex-1 bg-red-500 text-white text-sm font-semibold py-3 rounded-xl"
            >
              ✘ Reprovar
            </button>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  )
}

export default EditarOrcamento
