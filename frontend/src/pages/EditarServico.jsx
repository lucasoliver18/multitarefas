import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Select from '../components/Select'
import { useToast } from '../hooks/useToast'
import { buscarClientesPagina } from '../hooks/useClientes'
import MiniCadastroCliente from '../components/MiniCadastroCliente'
import ComboboxAsync from '../components/ComboboxAsync'
import { PRIORIDADE_OPCOES, STATUS_OPCOES } from '../utils/status'
import { dataValida } from '../utils/prazos'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function EditarServico() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    cliente: '',
    cliente_id: null,
    prioridade: 'media',
    status: 'pendente',
    prazo: '',
    tag: '',
  })
  const [mostrarCadastroCliente, setMostrarCadastroCliente] = useState(false)

  useEffect(() => {
    api.get(`/servicos/${id}`).then(res => {
      const s = res.data
      setForm({
        titulo:     s.titulo     || '',
        descricao:  s.descricao  || '',
        cliente:    s.cliente    || '',
        cliente_id: s.cliente_id || null,
        prioridade: s.prioridade || 'media',
        status:     s.status     || 'pendente',
        prazo:      s.prazo      || '',
        tag:        s.tag        || '',
      })
    })
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // O campo de prazo fica não-controlado durante a digitação (defaultValue/onBlur):
  // um <input type="date"> controlado (value + onChange) força o React a re-renderizar
  // a cada tecla, e isso reseta o estado interno dos segmentos dia/mês/ano do seletor
  // nativo do navegador, embaralhando o valor digitado. Só sincronizamos com o estado
  // do formulário quando o usuário sai do campo.
  const handlePrazoBlur = (e) => {
    if (e.target.validity.badInput) {
      setErro('Data inválida: verifique se o dia existe no mês selecionado.')
      e.target.value = form.prazo
      return
    }
    setErro('')
    setForm(prev => ({ ...prev, prazo: e.target.value }))
  }

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
    toast.sucesso('Cliente cadastrado!')
  }

  const handleSalvar = async () => {
    setErro('')
    if (!form.titulo || !form.cliente_id) {
      setErro('Título e cliente são obrigatórios! Selecione um cliente existente ou cadastre um novo.')
      return
    }
    if (form.prazo && !dataValida(form.prazo)) {
      setErro('A data informada para o prazo não é válida.')
      return
    }
    setLoading(true)
    try {
      await api.put(`/servicos/${id}`, form)
      toast.sucesso('Serviço atualizado!')
      navigate('/servicos')
    } catch (e) {
      setErro(e.response?.data?.errors?.prazo?.[0] || e.response?.data?.message || 'Erro ao atualizar serviço. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate('/servicos')} className="text-xs text-slate-300 mb-3">← Voltar</button>
        <h1 className="text-lg font-bold text-white">Editar Serviço</h1>
        <p className="text-xs text-slate-300 mt-0.5">Atualize os dados do serviço</p>
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4 mb-24">

        {erro && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200">{erro}</div>
        )}

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Título *</label>
          <input name="titulo" value={form.titulo} onChange={handleChange} className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
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
            <div className="mt-2">
              <MiniCadastroCliente
                nomeInicial={form.cliente}
                onCriado={handleClienteCriado}
                onCancelar={() => setMostrarCadastroCliente(false)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            rows={4}
            className={`${INPUT} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Prioridade</label>
          <Select name="prioridade" value={form.prioridade} onChange={handleChange} className={INPUT}>
            {PRIORIDADE_OPCOES.map(o => (
              <option key={o.val} value={o.val}>{o.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Status</label>
          <Select name="status" value={form.status} onChange={handleChange} className={INPUT}>
            {STATUS_OPCOES.map(o => (
              <option key={o.val} value={o.val}>{o.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Prazo</label>
          <input
            key={form.prazo}
            type="date"
            name="prazo"
            defaultValue={form.prazo}
            onBlur={handlePrazoBlur}
            className={INPUT}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Tag</label>
          <Select name="tag" value={form.tag} onChange={handleChange} className={INPUT}>
            <option value="">Nenhuma</option>
            <option value="informatica">Informática</option>
            <option value="pintura">Pintura</option>
            <option value="outros">Outros</option>
          </Select>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="flex-1 bg-[#2563eb] hover:bg-[#1e3a5f] text-white rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/servicos')}
            className="flex-1 border border-slate-300 text-slate-600 rounded-full py-3 text-sm font-semibold"
          >
            Cancelar
          </button>
        </div>

      </div>

      <Navbar />
    </div>
  )
}

export default EditarServico
