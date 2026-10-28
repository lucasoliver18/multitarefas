import { ChevronDown } from 'lucide-react'

// Substitui a seta nativa do <select>, que fica colada no texto em vários SOs.
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
