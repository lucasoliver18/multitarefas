import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'
import { useClientes } from '../hooks/useClientes'
import MiniCadastroCliente from '../components/MiniCadastroCliente'
import { PRIORIDADE_OPCOES } from '../utils/status'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function EditarServico() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const { clientes, buscar } = useClientes()
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
  const [sugestoes, setSugestoes] = useState([])
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

  const handleClienteChange = (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, cliente: val, cliente_id: null }))
    setMostrarCadastroCliente(false)
    if (val.trim().length >= 1) {
      const filtrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(val.toLowerCase())
      )
      setSugestoes(filtrados.slice(0, 5))
    } else {
      setSugestoes([])
    }
  }

  const selecionarCliente = (cliente) => {
    setForm(prev => ({ ...prev, cliente: cliente.nome, cliente_id: cliente.id }))
    setSugestoes([])
    setMostrarCadastroCliente(false)
  }

  const handleClienteCriado = (novoCliente) => {
    setForm(prev => ({ ...prev, cliente: novoCliente.nome, cliente_id: novoCliente.id }))
    setMostrarCadastroCliente(false)
    setSugestoes([])
    buscar()
    toast.sucesso('Cliente cadastrado!')
  }

  const handleSalvar = async () => {
    setErro('')
    if (!form.titulo || !form.cliente_id) {
      setErro('Título e cliente são obrigatórios! Selecione um cliente existente ou cadastre um novo.')
      return
    }
    setLoading(true)
    try {
      await api.put(`/servicos/${id}`, form)
      toast.sucesso('Serviço atualizado!')
      navigate('/servicos')
    } catch {
      setErro('Erro ao atualizar serviço. Tente novamente.')
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
          <div className="relative">
            <input
              name="cliente"
              value={form.cliente}
              onChange={handleClienteChange}
              onBlur={() => setTimeout(() => setSugestoes([]), 150)}
              className={INPUT}
              autoComplete="off"
            />
            {!mostrarCadastroCliente && (sugestoes.length > 0 || (form.cliente.trim().length >= 1 && !form.cliente_id)) && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                {sugestoes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selecionarCliente(c)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                  >
                    <span>{c.nome}</span>
                    {c.telefone && <span className="text-xs text-slate-400">{c.telefone}</span>}
                  </button>
                ))}
                {form.cliente.trim().length >= 1 && !form.cliente_id && (
                  <button
                    type="button"
                    onMouseDown={() => setMostrarCadastroCliente(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 font-semibold hover:bg-blue-50"
                  >
                    + Cadastrar "{form.cliente}" como novo cliente
                  </button>
                )}
              </div>
            )}
          </div>
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
          <select name="prioridade" value={form.prioridade} onChange={handleChange} className={INPUT}>
            {PRIORIDADE_OPCOES.map(o => (
              <option key={o.val} value={o.val}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={INPUT}>
            <option value="pendente">⏳ Pendente</option>
            <option value="em_andamento">🔄 Em andamento</option>
            <option value="finalizado">✔ Finalizado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Prazo</label>
          <input type="date" name="prazo" value={form.prazo} onChange={handleChange} className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Tag</label>
          <select name="tag" value={form.tag} onChange={handleChange} className={INPUT}>
            <option value="">Nenhuma</option>
            <option value="informatica">Informática</option>
            <option value="pintura">Pintura</option>
            <option value="outros">Outros</option>
          </select>
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
