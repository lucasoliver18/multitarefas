import { STATUS_ICONE, badgeStatus, labelStatus } from '../utils/status'

function StatusBadge({ status, as, className = 'px-3 py-1.5', ...props }) {
  const Tag = as || 'span'
  const Icone = STATUS_ICONE[status] || STATUS_ICONE.pendente
  // Só clicável quando usado como <button> (ver callers com as="button") — nesse
  // caso precisa do mesmo feedback de clicabilidade dos demais botões do sistema.
  const interativo = as === 'button' ? 'cursor-pointer transition-all hover:brightness-95 active:scale-95' : ''
  return (
    <Tag
      className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full shrink-0 ${badgeStatus(status)} ${interativo} ${className}`}
      {...props}
    >
      <Icone size={12} />
      {labelStatus(status)}
    </Tag>
  )
}

export default StatusBadge
