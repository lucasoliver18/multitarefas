import { useCallback, useState } from 'react'
import { X, Info } from 'lucide-react'
import Button from './Button'
import ComboboxAsync from './ComboboxAsync'
import { Pagina, CabecalhoPagina } from './Pagina'
import { useToast } from '../hooks/useToast'
import { buscarMateriaisPagina } from '../hooks/useMateriais'
import { materiaisComEstoqueInsuficiente } from '../utils/materiais'
import { sanitizarNumero } from '../utils/numeros'
import { TAG_LABEL } from '../utils/status'
import { TIPOS_MARGEM, MARGEM_MAX, formatarPreco, calcularValorFinal, descreverMargem } from '../utils/orcamentos'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-sm font-semibold text-slate-700 mb-1.5'

// Formulário compartilhado por Novo e Editar Orçamento. Os materiais
// oferecidos na busca são só os da tag do serviço; serviço sem tag mostra todos.
function OrcamentoForm({ titulo, servico, form, setForm, itens, setItens, salvando, onSalvar, botaoLabel, onVoltar, acoesExtras }) {
  const toast = useToast()
  const [buscaMaterial, setBuscaMaterial] = useState('')
  const tag = servico?.tag || null

  const buscarPagina = useCallback((busca, pagina) => buscarMateriaisPagina(busca, pagina, tag), [tag])

  const adicionarMaterial = (material) => {
    if (itens.find(i => i.id === material.id)) {
      toast.alerta('Material já adicionado.')
      return
    }
    setItens([...itens, {
      id: material.id,
      nome: material.nome,
      unidade_medida: material.unidade_medida,
      preco_unitario: material.preco_unitario,
      quantidade_estoque: material.quantidade_estoque,
      quantidade: '1',
    }])
  }

  const atualizarQuantidade = (id, quantidade) =>
    setItens(itens.map(i => i.id === id ? { ...i, quantidade } : i))

  const removerItem = (id) => setItens(itens.filter(i => i.id !== id))

  const valorMateriais = itens.reduce((acc, i) => acc + parseFloat(i.preco_unitario) * parseFloat(i.quantidade || 0), 0)
  const tipoMargem = form.tipo_margem || 'percentual'
  const valorFinal = calcularValorFinal(valorMateriais, form.margem_lucro, tipoMargem)

  // Trocar o tipo zera a margem: 10% e R$ 10,00 não são equivalentes.
  const mudarTipoMargem = (tipo) => {
    if (tipo === tipoMargem) return
    setForm({ ...form, tipo_margem: tipo, margem_lucro: '0' })
  }

  const salvar = () => {
    if (!form.titulo.trim()) { toast.erro('Informe o título.'); return }
    if (itens.some(i => !(parseFloat(i.quantidade) > 0))) {
      toast.erro('Quantidade deve ser maior que zero.')
      return
    }
    if (parseFloat(form.margem_lucro || 0) > MARGEM_MAX[tipoMargem]) {
      toast.erro(tipoMargem === 'valor'
        ? 'Margem máxima: R$ 99.999.999,99.'
        : 'Margem máxima: 999,99%.')
      return
    }

    const insuficientes = materiaisComEstoqueInsuficiente(itens)
    if (insuficientes.length > 0) {
      toast.confirmar(
        `Estoque insuficiente para: ${insuficientes.map(i => i.nome).join(', ')}. Salvar mesmo assim?`,
        onSalvar
      )
      return
    }

    onSalvar()
  }

  return (
    <Pagina largura="max-w-6xl">
      <CabecalhoPagina
        titulo={titulo}
        subtitulo={servico?.titulo}
        voltar={{ label: 'Orçamentos', onClick: onVoltar }}
      />

      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5">
            <div className="flex flex-col">
              <label className={LABEL}>Título *</label>
              <input
                name="titulo"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Orçamento Opção A"
                maxLength={255}
                className={INPUT}
              />
            </div>

            <div className="flex flex-col">
              <label className={LABEL}>Descrição</label>
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes do orçamento..."
                rows={3}
                maxLength={5000}
                className={`${INPUT} resize-none`}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Materiais</h2>
              <span className="text-sm text-slate-500">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</span>
            </div>

            <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              {tag
                ? <span>Mostrando apenas materiais com a tag <strong>{TAG_LABEL[tag] || tag}</strong>, a mesma do serviço.</span>
                : <span>Este serviço não tem tag, então todos os materiais estão disponíveis.</span>}
            </div>

            <ComboboxAsync
              key={tag || 'todos'}
              valor={buscaMaterial}
              onChangeTexto={setBuscaMaterial}
              onSelecionar={m => { adicionarMaterial(m); setBuscaMaterial('') }}
              buscarPagina={buscarPagina}
              minCaracteres={0}
              renderItem={m => (
                <>
                  <span>{m.nome}{m.marca ? <span className="text-slate-400"> · {m.marca}</span> : null}</span>
                  <span className="text-xs text-slate-400">
                    {formatarPreco(parseFloat(m.preco_unitario))} · estoque: {parseFloat(m.quantidade_estoque)} {m.unidade_medida}
                  </span>
                </>
              )}
              placeholder="Clique ou digite para buscar um material..."
              className={INPUT}
            />

            {itens.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                Nenhum material adicionado.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_8rem_9rem_8rem_2.5rem] gap-3 px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span>Material</span>
                  <span>Preço unit.</span>
                  <span>Quantidade</span>
                  <span className="text-right">Subtotal</span>
                  <span />
                </div>
                {itens.map(item => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_8rem_9rem_8rem_2.5rem] gap-3 px-4 py-2.5 items-center border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.nome}</p>
                    <span className="text-sm text-slate-600">{formatarPreco(parseFloat(item.preco_unitario))}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text" inputMode="decimal"
                        value={item.quantidade}
                        onChange={(e) => atualizarQuantidade(item.id, sanitizarNumero(e.target.value, 3))}
                        aria-label={`Quantidade de ${item.nome}`}
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-blue-600"
                      />
                      <span className="text-sm text-slate-400">{item.unidade_medida}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 text-right">
                      {formatarPreco(parseFloat(item.preco_unitario) * parseFloat(item.quantidade || 0))}
                    </span>
                    <button
                      onClick={() => removerItem(item.id)}
                      aria-label={`Remover ${item.nome}`}
                      title="Remover"
                      className="p-1.5 text-red-400 rounded-lg hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all justify-self-end"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky top-8 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-slate-800">Resumo</h2>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="margem_lucro" className="text-sm font-semibold text-slate-700">Margem de lucro</label>
              <div className="inline-flex bg-slate-100 rounded-lg p-0.5 gap-0.5" role="group" aria-label="Tipo de margem">
                {TIPOS_MARGEM.map(t => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => mudarTipoMargem(t.val)}
                    aria-pressed={tipoMargem === t.val}
                    title={t.val === 'valor' ? 'Margem em dinheiro (R$)' : 'Margem em porcentagem (%)'}
                    className={`text-sm font-semibold px-3 py-1 rounded-md transition-all active:scale-95 ${
                      tipoMargem === t.val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                {tipoMargem === 'valor' ? 'R$' : '%'}
              </span>
              <input
                id="margem_lucro"
                name="margem_lucro"
                type="text"
                inputMode="decimal"
                value={form.margem_lucro}
                onChange={e => setForm({ ...form, margem_lucro: sanitizarNumero(e.target.value, 2) })}
                className={`${INPUT} pl-11`}
              />
            </div>
            {tipoMargem === 'valor' && valorMateriais > 0 && parseFloat(form.margem_lucro) > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">
                Equivale a {((parseFloat(form.margem_lucro) / valorMateriais) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% sobre o custo.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Custo dos materiais</span>
              <span className="font-semibold text-slate-800">{formatarPreco(valorMateriais)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Margem ({descreverMargem(form.margem_lucro, tipoMargem)})</span>
              <span className="font-semibold text-slate-800">{formatarPreco(valorFinal - valorMateriais)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-2xl font-bold text-[#2563eb]">{formatarPreco(valorFinal)}</span>
            </div>
          </div>

          <Button onClick={salvar} disabled={salvando} className="text-sm font-semibold py-3 rounded-xl">
            {salvando ? 'Salvando...' : botaoLabel}
          </Button>

          {acoesExtras}
        </div>
      </div>
    </Pagina>
  )
}

export default OrcamentoForm
