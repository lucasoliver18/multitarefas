import { useState } from 'react'
import api from '../services/api'
import { apenasDigitos, mascararCpf, mascararCnpj } from '../utils/mascaras'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-xs font-semibold text-slate-700 mb-1 block'

function MiniCadastroCliente({ nomeInicial, onCriado, onCancelar }) {
  const [form, setForm] = useState({ nome: nomeInicial || '', tipo_pessoa: 'fisica', cpf: '', cnpj: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })
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
      const res = await api.post('/clientes', {
        nome: form.nome,
        tipo_pessoa: form.tipo_pessoa,
        cpf: form.tipo_pessoa === 'fisica' ? form.cpf : null,
        cnpj: form.tipo_pessoa === 'juridica' ? form.cnpj : null,
      })
      onCriado({ id: res.data.id, nome: res.data.nome })
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao cadastrar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
      <p className="text-xs font-semibold text-slate-600">Cadastrar novo cliente</p>

      {erro && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-200">{erro}</div>
      )}

      <div>
        <label className={LABEL}>Nome *</label>
        <input name="nome" value={form.nome} onChange={handleChange} className={INPUT} placeholder="Ex: João Silva" />
      </div>

      <div>
        <label className={LABEL}>Tipo de cadastro *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo_pessoa: 'fisica' })}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg border ${form.tipo_pessoa === 'fisica' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            Pessoa Física
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo_pessoa: 'juridica' })}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg border ${form.tipo_pessoa === 'juridica' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            Pessoa Jurídica
          </button>
        </div>
      </div>

      {form.tipo_pessoa === 'fisica' ? (
        <div>
          <label className={LABEL}>CPF *</label>
          <input name="cpf" value={form.cpf} onChange={handleCpfChange}
            inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
            className={INPUT} />
        </div>
      ) : (
        <div>
          <label className={LABEL}>CNPJ *</label>
          <input name="cnpj" value={form.cnpj} onChange={handleCnpjChange}
            inputMode="numeric" placeholder="00.000.000/0000-00" maxLength={18}
            className={INPUT} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex-1 text-xs bg-[#2563eb] text-white py-2.5 rounded-xl font-semibold disabled:opacity-60"
        >
          {salvando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 text-xs bg-slate-100 text-slate-600 py-2.5 rounded-xl font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default MiniCadastroCliente
