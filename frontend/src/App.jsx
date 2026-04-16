import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Prazos from './pages/Prazos'
import NovoServico from './pages/NovoServico'
import Servicos from './pages/Servicos'
import EditarServico from './pages/EditarServico'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prazos" element={<Prazos />} />
        <Route path="/novo" element={<NovoServico />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/editar/:id" element={<EditarServico />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App