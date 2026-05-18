import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
