import { useNavigate, useLocation } from 'react-router-dom'

const items = [
  { titulo: 'Início',    icon: '🏠', path: '/' },
  { titulo: 'Prazos',   icon: '📅', path: '/prazos' },
  { titulo: 'Serviços', icon: '📋', path: '/servicos' },
  { titulo: 'Materiais',icon: '📦', path: '/materiais' },
  { titulo: 'Clientes', icon: '👥', path: '/clientes' },
]

function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-[#1e3a5f] flex justify-around items-center py-3 px-2 z-50">
      {items.map(({ titulo, icon, path }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          aria-label={titulo}
          className="flex flex-col items-center gap-1 flex-1 min-w-0"
        >
          <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
          {/* Label via CSS attr() — imune a autocomplete do browser */}
          <span
            data-titulo={titulo}
            aria-hidden="true"
            className={`nav-label text-xs font-semibold block text-center overflow-hidden whitespace-nowrap ${
              isActive(path) ? 'text-[#3b82f6]' : 'text-slate-400'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default Navbar
