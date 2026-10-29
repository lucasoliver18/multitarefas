import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, ClipboardList, Package, Users, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useEstadoPersistido } from '../hooks/useEstadoPersistido'

const ITENS = [
  { titulo: 'Início',    icon: Home,          path: '/',          fim: true },
  { titulo: 'Prazos',    icon: Calendar,      path: '/prazos' },
  { titulo: 'Serviços',  icon: ClipboardList, path: '/servicos' },
  { titulo: 'Materiais', icon: Package,       path: '/materiais' },
  { titulo: 'Clientes',  icon: Users,         path: '/clientes' },
]

// Telas de edição/orçamento/anotações ficam "dentro" de Serviços no menu.
const ROTAS_DE_SERVICO = ['/novo', '/editar/', '/orcamentos/']

// Largura do menu aberto/recolhido. Fica na variável CSS --largura-menu, que
// o conteúdo e os elementos fixos (ex.: BarraSelecao) usam para acompanhar o
// menu com a mesma transição.
const LARGURA_ABERTO = '16rem'
const LARGURA_RECOLHIDO = '4.5rem'
const TRANSICAO = 'duration-200 ease-out'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const nome = user?.name || ''

  const { pathname } = useLocation()
  const [recolhido, setRecolhido] = useEstadoPersistido('layout:menuRecolhido', false)
  // Rótulos somem/aparecem junto com a largura, sem quebrar linha no meio da animação.
  const rotulo = `whitespace-nowrap overflow-hidden transition-[opacity,max-width] ${TRANSICAO} ${
    recolhido ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[12rem]'
  }`

  const ativo = (item, isActive) => {
    if (isActive) return true
    if (item.path !== '/servicos') return false
    return ROTAS_DE_SERVICO.some(r => pathname.startsWith(r))
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ '--largura-menu': recolhido ? LARGURA_RECOLHIDO : LARGURA_ABERTO }}
    >
      <aside className={`w-[var(--largura-menu)] shrink-0 bg-[#1e3a5f] text-white flex flex-col fixed inset-y-0 left-0 z-40 overflow-hidden select-none transition-[width] ${TRANSICAO}`}>
        <div className={`flex items-start pt-7 pb-6 ${recolhido ? 'px-3 justify-center' : 'pl-6 pr-3 justify-between'}`}>
          <div className={rotulo}>
            <p className="text-xl font-bold tracking-tight">MultiTarefas</p>
            <p className="text-xs text-slate-300 mt-0.5">INFOOSEG</p>
          </div>
          <button
            onClick={() => setRecolhido(r => !r)}
            aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!recolhido}
            title={recolhido ? 'Expandir menu' : 'Recolher menu'}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0"
          >
            {recolhido ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-1">
          {ITENS.map(item => {
            const Icone = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.fim}
                // Recolhido, o nome aparece ao passar o mouse.
                title={recolhido ? item.titulo : undefined}
                className={({ isActive }) =>
                  `flex items-center ${recolhido ? 'justify-center gap-0' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    ativo(item, isActive) ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icone size={18} aria-hidden="true" className="shrink-0" />
                {/* Rótulo via CSS attr() para não sofrer autocomplete/tradução do navegador */}
                <span data-titulo={item.titulo} aria-hidden="true" className={`nav-label ${rotulo}`} />
                <span className="sr-only">{item.titulo}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className={`py-4 border-t border-white/10 flex items-center ${recolhido ? 'flex-col gap-2 px-3' : 'gap-3 px-4'}`}>
          <div
            title={recolhido ? nome : undefined}
            className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center font-bold text-sm shrink-0"
          >
            {nome.charAt(0).toUpperCase() || '?'}
          </div>
          {!recolhido && <p className="flex-1 min-w-0 text-sm font-semibold truncate">{nome}</p>}
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

      <main className={`flex-1 min-w-0 ml-[var(--largura-menu)] bg-slate-100 min-h-screen transition-[margin] ${TRANSICAO}`}>
        {children}
      </main>
    </div>
  )
}

export default Layout
