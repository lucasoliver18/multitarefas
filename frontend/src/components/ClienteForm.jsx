import Button from './Button'
import { Pagina, CabecalhoPagina } from './Pagina'
import { useToast } from '../hooks/useToast'
import { apenasDigitos, mascararTelefone, mascararCpf, mascararCnpj, cnpjValido } from '../utils/mascaras'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-sm font-semibold text-slate-700 mb-1.5'

function BotaoTipo({ ativo, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-sm font-semibold py-2.5 rounded-xl border transition-all active:scale-[0.97] ${ativo ? 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e3a5f]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  )
}

function ClienteForm({ titulo, form, setForm, salvando, onSalvar, botaoLabel, onVoltar }) {
  const toast = useToast()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handleTelefoneChange = e => setForm({ ...form, telefone: mascararTelefone(e.target.value) })
  const handleCpfChange = e => setForm({ ...form, cpf: mascararCpf(e.target.value) })
  const handleCnpjChange = e => setForm({ ...form, cnpj: mascararCnpj(e.target.value) })

  const salvar = () => {
    if (!form.nome.trim()) { toast.erro('Informe o nome.'); return }
    if (form.tipo_pessoa === 'fisica' && apenasDigitos(form.cpf).length !== 11) {
      toast.erro('CPF inválido.'); return
    }
    if (form.tipo_pessoa === 'juridica' && !cnpjValido(form.cnpj)) {
      toast.erro('CNPJ inválido.'); return
    }
    const digitosTelefone = apenasDigitos(form.telefone).length
    if (digitosTelefone > 0 && digitosTelefone < 10) {
      toast.erro('Telefone incompleto.'); return
    }
    onSalvar()
  }

  return (
    <Pagina largura="max-w-4xl">
      <CabecalhoPagina titulo={titulo} voltar={{ label: 'Clientes', onClick: onVoltar }} />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Nome *</label>
          <input name="nome" value={form.nome} onChange={handleChange}
            maxLength={255}
            className={INPUT} />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>Tipo de cadastro *</label>
          <div className="flex gap-2">
            <BotaoTipo ativo={form.tipo_pessoa === 'fisica'} label="Pessoa Física" onClick={() => setForm({ ...form, tipo_pessoa: 'fisica' })} />
            <BotaoTipo ativo={form.tipo_pessoa === 'juridica'} label="Pessoa Jurídica" onClick={() => setForm({ ...form, tipo_pessoa: 'juridica' })} />
          </div>
        </div>

        {form.tipo_pessoa === 'fisica' ? (
          <div className="flex flex-col">
            <label className={LABEL}>CPF *</label>
            <input name="cpf" value={form.cpf} onChange={handleCpfChange}
              inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
              className={INPUT} />
          </div>
        ) : (
          <div className="flex flex-col">
            <label className={LABEL}>CNPJ *</label>
            <input name="cnpj" value={form.cnpj} onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00" maxLength={18} autoComplete="off" spellCheck={false}
              className={`${INPUT} uppercase`} />
          </div>
        )}

        <div className="flex flex-col">
          <label className={LABEL}>Telefone</label>
          <input name="telefone" value={form.telefone} onChange={handleTelefoneChange}
            type="tel" inputMode="numeric" maxLength={15}
            className={INPUT} />
        </div>

        <div className="flex flex-col">
          <label className={LABEL}>E-mail</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            maxLength={255}
            className={INPUT} />
        </div>

        <div className="flex flex-col col-span-2">
          <label className={LABEL}>Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
            rows={3} maxLength={5000}
            className={`${INPUT} resize-none`} />
        </div>

        <div className="col-span-2 flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onVoltar} className="text-sm font-semibold px-6 py-2.5 rounded-xl">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando} className="text-sm font-semibold px-6 py-2.5 rounded-xl">
            {salvando ? 'Salvando...' : botaoLabel}
          </Button>
        </div>
      </div>
    </Pagina>
  )
}

export default ClienteForm
