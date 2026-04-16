import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Prazos from './pages/Prazos'
import NovoServico from './pages/NovoServico'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prazos" element={<Prazos />} />
        <Route path="/novo" element={<NovoServico />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App