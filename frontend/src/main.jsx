import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { lerModoSalvo, aplicarModo } from './utils/viewMode'

aplicarModo(lerModoSalvo())

createRoot(document.getElementById('root')).render(<App />)
