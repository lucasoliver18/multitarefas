import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'

const INPUT = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const LABEL = 'text-sm font-semibold text-slate-700 mb-1.5'

function Login() {
  const { user, entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const enviar = async e => {
    e.preventDefault()
    setEntrando(true)
    await entrar(email, senha)
    setEntrando(false)
  }

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">MultiTarefas</h1>
        <p className="text-sm text-slate-300 mt-1">Entre para continuar</p>
      </div>

      <form onSubmit={enviar} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col">
          <label htmlFor="email" className={LABEL}>E-mail</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            autoComplete="username" required autoFocus className={INPUT} />
        </div>

        <div className="flex flex-col">
          <label htmlFor="senha" className={LABEL}>Senha</label>
          <input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)}
            autoComplete="current-password" required className={INPUT} />
        </div>

        <Button type="submit" disabled={entrando} className="text-sm font-semibold py-3 rounded-xl mt-1">
          {entrando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}

export default Login
