import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Calendar, ClipboardList, Package, Users } from 'lucide-react'

const items = [
  { titulo: 'Início',    icon: Home,           path: '/' },
  { titulo: 'Prazos',    icon: Calendar,       path: '/prazos' },
  { titulo: 'Serviços',  icon: ClipboardList,  path: '/servicos' },
  { titulo: 'Materiais', icon: Package,        path: '/materiais' },
  { titulo: 'Clientes',  icon: Users,          path: '/clientes' },
]

function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-[#1e3a5f] flex justify-around items-center py-3 px-2 z-50">
      {items.map((item) => {
        const Icone = item.icon
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-label={item.titulo}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <Icone size={20} className={isActive(item.path) ? 'text-[#3b82f6]' : 'text-slate-400'} aria-hidden="true" />
            {/* Rótulo via CSS attr() para não sofrer autocomplete do navegador */}
            <span
              data-titulo={item.titulo}
              aria-hidden="true"
              className={`nav-label text-xs font-semibold block text-center overflow-hidden whitespace-nowrap ${
                isActive(item.path) ? 'text-[#3b82f6]' : 'text-slate-400'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

export default Navbar
