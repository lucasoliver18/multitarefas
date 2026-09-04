import { ChevronDown } from 'lucide-react'

/**
 * Wrapper fino sobre <select> nativo: remove a seta do navegador (que fica
 * colada no texto/borda em vários SOs) e desenha uma seta consistente com o
 * resto dos ícones do sistema.
 */
function Select({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`appearance-none pr-9 ${className}`}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  )
}

export default Select
