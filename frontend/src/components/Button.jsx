// Botão padrão do sistema: cada variante só define cor, o tamanho/raio/fonte
// fica a cargo de quem usa via className (evita conflito de utilitários do
// Tailwind quando dois definem a mesma propriedade). O feedback de "isto é
// clicável" (active:scale + transição) é sempre o mesmo em qualquer variante.
const VARIANTES = {
  primary:   'bg-[#2563eb] hover:bg-[#1e3a5f] text-white',
  secondary: 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50',
  danger:    'bg-[#dc2626] hover:bg-red-700 text-white',
  success:   'bg-[#16a34a] hover:bg-green-700 text-white',
  ghost:     'bg-slate-100 text-slate-600 hover:bg-slate-200',
}

function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      {...props}
      className={`transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100 ${VARIANTES[variant] || VARIANTES.primary} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
