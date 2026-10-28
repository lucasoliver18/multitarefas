import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus } from 'lucide-react'
import Button from './Button'
import Select from './Select'
import ComboboxAsync from './ComboboxAsync'
import { Pagina, CabecalhoPagina } from './Pagina'
import { UNIDADES as unidades } from '../utils/materiais'
import { useToast } from '../hooks/useToast'
import { buscarMarcasPagina, criarMarca, excluirMarca } from '../hooks/useMarcas'
import { sanitizarNumero } from '../utils/numeros'
import { mensagemErro } from '../utils/erros'
import { TAG_OPCOES } from '../utils/status'
import { plural } from '../utils/texto'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-sm font-semibold text-slate-700 mb-1.5'

function SeletorTags({ valor, onChange }) {
  const alternar = (tag) =>
    onChange(valor.includes(tag) ? valor.filter(t => t !== tag) : [...valor, tag])

  return (
    <div className="flex flex-wrap gap-2">
      {TAG_OPCOES.map(({ val, label }) => {
        const marcada = valor.includes(val)
        return (
          <button
            key={val}
            type="button"
            onClick={() => alternar(val)}
            aria-pressed={marcada}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all active:scale-95 ${
              marcada
                ? 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e3a5f]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// Marca vem de um cadastro próprio (como clientes): ao digitar, busca as
// marcas existentes; se não houver, oferece cadastrar. Cada marca da lista tem
// uma lixeira para excluir duplicadas (ex.: "Genérico" e "Genérica").
function CampoMarca({ marca, marcaId, onChange }) {
  const toast = useToast()
  // Trocar a chave recria o campo, descartando a lista antiga após excluir.
  const [versao, setVersao] = useState(0)

  const cadastrar = async () => {
    try {
      const nova = await criarMarca(marca)
      onChange({ marca: nova.nome, marca_id: nova.id })
      toast.sucesso('Marca cadastrada')
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao cadastrar marca.'))
    }
  }

  const excluir = (m) => {
    const mensagem = m.materiais_count > 0
      ? `"${m.nome}" está em ${plural(m.materiais_count, 'material', 'materiais')}. Excluir mesmo assim? ${m.materiais_count === 1 ? 'Ele ficará' : 'Eles ficarão'} sem marca.`
      : `Excluir a marca "${m.nome}"?`
    toast.confirmar(mensagem, async () => {
      try {
        await excluirMarca(m.id)
        if (marcaId === m.id) onChange({ marca: '', marca_id: null })
        setVersao(v => v + 1)
        toast.sucesso('Marca excluída')
      } catch (e) {
        toast.erro(mensagemErro(e, 'Erro ao excluir marca.'))
      }
    })
  }

  return (
    <ComboboxAsync
      key={versao}
      valor={marca}
      onChangeTexto={texto => onChange({ marca: texto, marca_id: null })}
      onSelecionar={m => onChange({ marca: m.nome, marca_id: m.id })}
      buscarPagina={buscarMarcasPagina}
      renderItem={m => (
        <>
          <span className="truncate">{m.nome}</span>
          <span className="text-xs text-slate-400 shrink-0">{plural(m.materiais_count, 'material', 'materiais')}</span>
        </>
      )}
      acaoItem={{ icone: Trash2, label: 'Excluir marca', descrever: m => m.nome, onClick: excluir }}
      acaoExtra={marcaId || !marca.trim() ? null : {
        icone: Plus,
        label: `Cadastrar "${marca.trim()}" como nova marca`,
        onClick: cadastrar,
      }}
      className={INPUT}
    />
  )
}

function MaterialForm({ titulo, form, onChange, onChangeCampos, onChangeTags, salvando, onSalvar, botaoLabel }) {
  const navigate = useNavigate()

  const handleNumero = (decimais) => (e) => {
    e.target.value = sanitizarNumero(e.target.value, decimais)
    onChange(e)
  }

  return (
    <Pagina largura="max-w-4xl">
      <CabecalhoPagina
        titulo={titulo}
        voltar={{ label: 'Materiais', onClick: () => navigate('/materiais') }}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="flex flex-col">
          <label className={LABEL}>Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={onChange}
            maxLength={255}
            className={INPUT}
          />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Marca</label>
          <CampoMarca marca={form.marca} marcaId={form.marca_id} onChange={onChangeCampos} />
        </div>

        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Tags</label>
          <SeletorTags valor={form.tags} onChange={onChangeTags} />
        </div>

        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={onChange}
            rows={3}
            maxLength={5000}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Preço unitário (R$) *</label>
          <input
            name="preco_unitario"
            type="text"
            inputMode="decimal"
            value={form.preco_unitario}
            onChange={handleNumero(2)}
            placeholder="0,00"
            className={INPUT}
          />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Unidade *</label>
          <Select name="unidade_medida" value={form.unidade_medida} onChange={onChange} className={INPUT}>
            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Quantidade em estoque</label>
          <input
            name="quantidade_estoque"
            type="text"
            inputMode="decimal"
            value={form.quantidade_estoque}
            onChange={handleNumero(3)}
            placeholder="0"
            className={INPUT}
          />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Estoque mínimo</label>
          <input
            name="quantidade_minima"
            type="text"
            inputMode="decimal"
            value={form.quantidade_minima}
            onChange={handleNumero(3)}
            className={INPUT}
          />
        </div>

        <div className="col-span-2 flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate('/materiais')} className="text-sm font-semibold px-6 py-2.5 rounded-xl">
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={salvando} className="text-sm font-semibold px-6 py-2.5 rounded-xl">
            {salvando ? 'Salvando...' : botaoLabel}
          </Button>
        </div>
      </div>
    </Pagina>
  )
}

export default MaterialForm
