import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useToast } from '../hooks/useToast'
import { apenasDigitos, mascararTelefone, mascararCpf, mascararCnpj } from '../utils/mascaras'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1'

function EditarCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({ nome: '', tipo_pessoa: 'fisica', cpf: '', cnpj: '', telefone: '', email: '', observacoes: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get(`/clientes/${id}`)
      .then(res => {
        const c = res.data
        setForm({
          nome:        c.nome        || '',
          tipo_pessoa: c.tipo_pessoa || 'fisica',
          cpf:         c.cpf         || '',
          cnpj:        c.cnpj        || '',
          telefone:    c.telefone    || '',
          email:       c.email       || '',
          observacoes: c.observacoes || '',
        })
      })
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handleTelefoneChange = e => setForm({ ...form, telefone: mascararTelefone(e.target.value) })
  const handleCpfChange = e => setForm({ ...form, cpf: mascararCpf(e.target.value) })
  const handleCnpjChange = e => setForm({ ...form, cnpj: mascararCnpj(e.target.value) })

  const salvar = async () => {
    setErro('')
    if (!form.nome) { setErro('O nome do cliente é obrigatório.'); return }
    if (form.tipo_pessoa === 'fisica' && apenasDigitos(form.cpf).length !== 11) {
      setErro('Informe um CPF válido.'); return
    }
    if (form.tipo_pessoa === 'juridica' && apenasDigitos(form.cnpj).length !== 14) {
      setErro('Informe um CNPJ válido.'); return
    }

    setSalvando(true)
    try {
      await api.put(`/clientes/${id}`, {
        ...form,
        cpf: form.tipo_pessoa === 'fisica' ? form.cpf : null,
        cnpj: form.tipo_pessoa === 'juridica' ? form.cnpj : null,
      })
      toast.sucesso('Alterações salvas!')
      navigate('/clientes')
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="page-header bg-[#1e3a5f] px-6 pb-5">
        <button onClick={() => navigate('/clientes')} className="text-xs text-slate-300 mb-3">← Voltar</button>
        <h1 className="text-lg font-bold text-white">Editar Cliente</h1>
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
          <label className={LABEL}>Tipo de cadastro *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo_pessoa: 'fisica' })}
              className={`flex-1 text-sm font-semibold py-3 rounded-xl border ${form.tipo_pessoa === 'fisica' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo_pessoa: 'juridica' })}
              className={`flex-1 text-sm font-semibold py-3 rounded-xl border ${form.tipo_pessoa === 'juridica' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>

        {form.tipo_pessoa === 'fisica' ? (
          <div className="flex flex-col gap-1">
            <label className={LABEL}>CPF *</label>
            <input name="cpf" value={form.cpf} onChange={handleCpfChange}
              inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
              className={INPUT} />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className={LABEL}>CNPJ *</label>
            <input name="cnpj" value={form.cnpj} onChange={handleCnpjChange}
              inputMode="numeric" placeholder="00.000.000/0000-00" maxLength={18}
              className={INPUT} />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Telefone</label>
          <input name="telefone" value={form.telefone} onChange={handleTelefoneChange}
            type="tel" inputMode="numeric" placeholder="(11) 99999-0000" maxLength={15}
            className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>E-mail</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="Ex: joao@email.com"
            className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={LABEL}>Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
            rows={3}
            className={`${INPUT} resize-none`} />
        </div>

        <button onClick={salvar} disabled={salvando}
          className="bg-[#2563eb] hover:bg-[#1e3a5f] text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors">
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default EditarCliente
