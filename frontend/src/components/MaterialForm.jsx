import { useMemo } from 'react'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'
import { UNIDADES as unidades } from '../utils/materiais'
import { useMateriais } from '../hooks/useMateriais'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function MaterialForm({ titulo, form, onChange, erro, salvando, onSalvar, botaoLabel }) {
  const navigate = useNavigate()
  const { materiais } = useMateriais()

  const marcasCadastradas = useMemo(() =>
    [...new Set(materiais.map(m => m.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [materiais]
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate('/materiais')} className="text-xs text-slate-300 mb-3">
          ← Voltar
        </button>
        <h1 className="text-lg font-bold text-white">{titulo}</h1>
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4 mb-24">
        {erro && (
          <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-200">
            {erro}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={onChange}
            placeholder="Ex: Tinta Acrílica Branca"
            className={INPUT}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Marca</label>
          <input
            name="marca"
            value={form.marca}
            onChange={onChange}
            placeholder="Ex: Suvinil"
            list="marcas-cadastradas"
            className={INPUT}
            autoComplete="off"
          />
          <datalist id="marcas-cadastradas">
            {marcasCadastradas.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={onChange}
            placeholder="Detalhes do material..."
            rows={3}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className={LABEL}>Unidade *</label>
            <select name="unidade_medida" value={form.unidade_medida} onChange={onChange} className={INPUT}>
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className={LABEL}>Qtd. Estoque</label>
            <input
              name="quantidade_estoque"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              value={form.quantidade_estoque}
              onChange={onChange}
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
            onChange={onChange}
            placeholder="0,00"
            className={INPUT}
          />
        </div>

        <button
          onClick={onSalvar}
          disabled={salvando}
          className="bg-[#2563eb] hover:bg-[#1e3a5f] text-white text-sm font-semibold py-3 rounded-xl mt-2 disabled:opacity-60 transition-colors"
        >
          {salvando ? 'Salvando...' : botaoLabel}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default MaterialForm
