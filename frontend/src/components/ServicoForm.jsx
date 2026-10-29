import { useState } from 'react'
import Button from './Button'
import Select from './Select'
import CampoData from './CampoData'
import ComboboxAsync from './ComboboxAsync'
import MiniCadastroCliente from './MiniCadastroCliente'
import { Pagina, CabecalhoPagina } from './Pagina'
import { useToast } from '../hooks/useToast'
import { buscarClientesPagina } from '../hooks/useClientes'
import { dataValida } from '../utils/prazos'
import { PRIORIDADE_OPCOES, STATUS_OPCOES, TAG_OPCOES, statusSeguintes } from '../utils/status'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-sm font-semibold text-slate-700 mb-1.5'

// Formulário compartilhado por Novo e Editar Serviço. `statusOriginal` só é
// passado na edição: o status não pode retroceder, então só aparecem o atual
// e os seguintes.
function ServicoForm({ titulo, subtitulo, form, setForm, statusOriginal, salvando, onSalvar, onCancelar, voltar }) {
  const toast = useToast()
  const [mostrarCadastroCliente, setMostrarCadastroCliente] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleClienteTexto = (val) => {
    setForm(prev => ({ ...prev, cliente: val, cliente_id: null }))
    setMostrarCadastroCliente(false)
  }

  const selecionarCliente = (cliente) => {
    setForm(prev => ({ ...prev, cliente: cliente.nome, cliente_id: cliente.id }))
    setMostrarCadastroCliente(false)
  }

  const handleClienteCriado = (novoCliente) => {
    setForm(prev => ({ ...prev, cliente: novoCliente.nome, cliente_id: novoCliente.id }))
    setMostrarCadastroCliente(false)
    toast.sucesso('Cliente cadastrado')
  }

  const salvar = () => {
    if (!form.titulo.trim() || !form.cliente_id) {
      toast.erro('Informe título e cliente.')
      return
    }
    if (form.prazo && !dataValida(form.prazo)) {
      toast.erro('Prazo inválido.')
      return
    }
    onSalvar()
  }

  const opcoesStatus = statusOriginal
    ? STATUS_OPCOES.filter(o => o.val === statusOriginal || statusSeguintes(statusOriginal).some(s => s.val === o.val))
    : null

  return (
    <Pagina largura="max-w-4xl">
      <CabecalhoPagina titulo={titulo} subtitulo={subtitulo} voltar={voltar} />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Título *</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            className={INPUT}
            maxLength={255}
          />
        </div>

        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Cliente *</label>
          {!mostrarCadastroCliente && (
            <ComboboxAsync
              valor={form.cliente}
              onChangeTexto={handleClienteTexto}
              onSelecionar={selecionarCliente}
              buscarPagina={buscarClientesPagina}
              renderItem={c => (
                <>
                  <span>{c.nome}</span>
                  {c.telefone && <span className="text-xs text-slate-400">{c.telefone}</span>}
                </>
              )}
              className={INPUT}
              acaoExtra={form.cliente_id ? null : {
                label: `+ Cadastrar "${form.cliente}" como novo cliente`,
                onClick: () => setMostrarCadastroCliente(true),
              }}
            />
          )}
          {mostrarCadastroCliente && (
            <MiniCadastroCliente
              nomeInicial={form.cliente}
              onCriado={handleClienteCriado}
              onCancelar={() => setMostrarCadastroCliente(false)}
            />
          )}
        </div>

        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            rows={4}
            maxLength={5000}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Tag</label>
          <Select name="tag" value={form.tag} onChange={handleChange} className={INPUT}>
            <option value="">Nenhuma</option>
            {TAG_OPCOES.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </Select>
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Prioridade</label>
          <Select name="prioridade" value={form.prioridade} onChange={handleChange} className={INPUT}>
            {PRIORIDADE_OPCOES.map(o => (
              <option key={o.val} value={o.val}>{o.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Prazo</label>
          <CampoData
            name="prazo"
            value={form.prazo}
            onChange={handleChange}
            onInvalida={() => toast.erro('Data inválida.')}
            className={INPUT}
          />
        </div>

        {opcoesStatus && (
          <div className="flex flex-col">
            <label className={LABEL}>Status</label>
            <Select name="status" value={form.status} onChange={handleChange} className={INPUT}>
              {opcoesStatus.map(o => (
                <option key={o.val} value={o.val}>{o.label}</option>
              ))}
            </Select>
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer select-none col-span-2">
          <input
            type="checkbox"
            checked={form.pago}
            onChange={e => setForm(prev => ({ ...prev, pago: e.target.checked }))}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm font-semibold text-slate-700">Serviço já pago pelo cliente</span>
        </label>

        <div className="col-span-2 flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onCancelar} className="text-sm font-semibold px-6 py-2.5 rounded-xl">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando} className="text-sm font-semibold px-6 py-2.5 rounded-xl">
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Pagina>
  )
}

export default ServicoForm
