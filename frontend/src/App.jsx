import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from './components/ToastNotification'
import { AuthProvider } from './components/AuthProvider'
import RotaProtegida from './components/RotaProtegida'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Home from './pages/Home'
import Prazos from './pages/Prazos'
import NovoServico from './pages/NovoServico'
import Servicos from './pages/Servicos'
import EditarServico from './pages/EditarServico'
import Materiais from './pages/Materiais'
import NovoMaterial from './pages/NovoMaterial'
import EditarMaterial from './pages/EditarMaterial'
import Orcamentos from './pages/Orcamentos'
import NovoOrcamento from './pages/NovoOrcamento'
import EditarOrcamento from './pages/EditarOrcamento'
import Clientes from './pages/Clientes'
import NovoCliente from './pages/NovoCliente'
import EditarCliente from './pages/EditarCliente'
import Anotacoes from './pages/Anotacoes'

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
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
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  )
}

export default App
