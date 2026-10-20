import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from './components/ToastNotification'
import { AuthProvider } from './components/AuthProvider'
import RotaProtegida from './components/RotaProtegida'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Home from './pages/Home'

// Páginas carregadas sob demanda (code-splitting por rota): reduz o bundle
// inicial que o navegador precisa baixar e compilar no primeiro acesso.
const Prazos = lazy(() => import('./pages/Prazos'))
const NovoServico = lazy(() => import('./pages/NovoServico'))
const Servicos = lazy(() => import('./pages/Servicos'))
const EditarServico = lazy(() => import('./pages/EditarServico'))
const Materiais = lazy(() => import('./pages/Materiais'))
const NovoMaterial = lazy(() => import('./pages/NovoMaterial'))
const EditarMaterial = lazy(() => import('./pages/EditarMaterial'))
const Orcamentos = lazy(() => import('./pages/Orcamentos'))
const NovoOrcamento = lazy(() => import('./pages/NovoOrcamento'))
const EditarOrcamento = lazy(() => import('./pages/EditarOrcamento'))
const Clientes = lazy(() => import('./pages/Clientes'))
const NovoCliente = lazy(() => import('./pages/NovoCliente'))
const EditarCliente = lazy(() => import('./pages/EditarCliente'))
const Anotacoes = lazy(() => import('./pages/Anotacoes'))

const CarregandoPagina = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
    Carregando...
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<CarregandoPagina />}>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route element={<RotaProtegida />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/prazos" element={<Prazos />} />
                    <Route path="/servicos" element={<Servicos />} />
                    <Route path="/novo" element={<NovoServico />} />
                    <Route path="/editar/:id" element={<EditarServico />} />

                    <Route path="/materiais" element={<Materiais />} />
                    <Route path="/materiais/novo" element={<NovoMaterial />} />
                    <Route path="/materiais/editar/:id" element={<EditarMaterial />} />

                    <Route path="/orcamentos/:servicoId" element={<Orcamentos />} />
                    <Route path="/orcamentos/:servicoId/novo" element={<NovoOrcamento />} />
                    <Route path="/orcamentos/:servicoId/editar/:id" element={<EditarOrcamento />} />

                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clientes/novo" element={<NovoCliente />} />
                    <Route path="/clientes/editar/:id" element={<EditarCliente />} />

                    <Route path="/servicos/:id/anotacoes" element={<Anotacoes />} />
                  </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  )
}

export default App
