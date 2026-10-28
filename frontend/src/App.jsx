import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ToastNotification'
import { AuthProvider } from './components/AuthProvider'
import RotaProtegida from './components/RotaProtegida'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Home from './pages/Home'
import { paginas } from './paginas'

const {
  Prazos, NovoServico, Servicos, EditarServico,
  Materiais, NovoMaterial, EditarMaterial,
  Orcamentos, NovoOrcamento, EditarOrcamento,
  Clientes, NovoCliente, EditarCliente, Anotacoes,
} = paginas

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            {/* As telas internas têm seu próprio Suspense dentro do layout (RotaProtegida),
                então o menu lateral nunca some durante o carregamento de uma tela. */}
            <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
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
    </ErrorBoundary>
  )
}

export default App
