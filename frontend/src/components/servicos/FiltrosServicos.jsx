import Select from '../Select'
import PainelFiltros from '../PainelFiltros'
import { STATUS_OPCOES, PRIORIDADE_OPCOES, TAG_OPCOES, PAGO_OPCOES } from '../../utils/status'

const SELECT = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600'
const LABEL = 'text-xs font-semibold text-slate-600 mb-1 block'

// Painel com os filtros de serviços. `filtros` vem de useFiltrosServicos();
// `ocultar` esconde campos que não fazem sentido no contexto (ex.: o status
// no modal de uma coluna do quadro, que já é de um status só).
function FiltrosServicos({ filtros, ocultar = [] }) {
  const { valores, setters, quantidadeAtiva, limpar } = filtros

  const campo = (nome, label, opcoes, rotuloTodos = 'Todos') => !ocultar.includes(nome) && (
    <div>
      <label className={LABEL}>{label}</label>
      <Select value={valores[nome]} onChange={e => setters[nome](e.target.value)} className={SELECT}>
        <option value="">{rotuloTodos}</option>
        {opcoes.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </Select>
    </div>
  )

  return (
    <PainelFiltros quantidadeAtiva={quantidadeAtiva} onLimpar={limpar}>
      <div className="grid grid-cols-4 gap-4">
        {campo('status', 'Status', STATUS_OPCOES)}
        {campo('prioridade', 'Prioridade', PRIORIDADE_OPCOES, 'Todas')}
        {campo('tag', 'Tag', TAG_OPCOES, 'Todas')}
        {campo('situacaoPrazo', 'Situação do prazo', [
          { val: 'no_prazo', label: 'Dentro do prazo' },
          { val: 'atrasado', label: 'Atrasado' },
        ])}
        <div>
          <label className={LABEL}>Prazo de</label>
          <input type="date" value={valores.prazoDe} onChange={e => setters.prazoDe(e.target.value)} className={SELECT} />
        </div>
        <div>
          <label className={LABEL}>Prazo até</label>
          <input type="date" value={valores.prazoAte} onChange={e => setters.prazoAte(e.target.value)} className={SELECT} />
        </div>
        {campo('pago', 'Pagamento', PAGO_OPCOES)}
        {campo('orcamento', 'Orçamento', [
          { val: 'com', label: 'Com orçamento' },
          { val: 'sem', label: 'Sem orçamento' },
          { val: 'sem_aprovado', label: 'Sem orçamento aprovado' },
          { val: 'pendente', label: 'Com orçamento pendente' },
        ])}
      </div>
    </PainelFiltros>
  )
}

export default FiltrosServicos
