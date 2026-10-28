import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, ClipboardList, Package, Users, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const ITENS = [
  { titulo: 'Início',    icon: Home,          path: '/',          fim: true },
  { titulo: 'Prazos',    icon: Calendar,      path: '/prazos' },
  { titulo: 'Serviços',  icon: ClipboardList, path: '/servicos' },
  { titulo: 'Materiais', icon: Package,       path: '/materiais' },
  { titulo: 'Clientes',  icon: Users,         path: '/clientes' },
]

// Telas de edição/orçamento/anotações ficam "dentro" de Serviços no menu.
const ROTAS_DE_SERVICO = ['/novo', '/editar/', '/orcamentos/']

function Layout({ children }) {
  const { user, logout } = useAuth()
  const nome = user?.name || ''

  const { pathname } = useLocation()

  const ativo = (item, isActive) => {
    if (isActive) return true
    if (item.path !== '/servicos') return false
    return ROTAS_DE_SERVICO.some(r => pathname.startsWith(r))
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-[#1e3a5f] text-white flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="px-6 pt-7 pb-6">
          <p className="text-xl font-bold tracking-tight">MultiTarefas</p>
          <p className="text-xs text-slate-300 mt-0.5">INFOOSEG</p>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-1">
          {ITENS.map(item => {
            const Icone = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.fim}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    ativo(item, isActive) ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icone size={18} aria-hidden="true" />
                {/* Rótulo via CSS attr() para não sofrer autocomplete/tradução do navegador */}
                <span data-titulo={item.titulo} aria-hidden="true" className="nav-label" />
                <span className="sr-only">{item.titulo}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center font-bold text-sm shrink-0">
            {nome.charAt(0).toUpperCase() || '?'}
          </div>
          <p className="flex-1 min-w-0 text-sm font-semibold truncate">{nome}</p>
          <button
            onClick={logout}
            aria-label="Sair"
            title="Sair"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 ml-64 bg-slate-100 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default Layout
