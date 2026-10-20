import { Navigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

function Login() {
  const { user, entrarComGoogle } = useAuth()
  const toast = useToast()

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">MultiTarefas</h1>
        <p className="text-sm text-slate-300 mt-1">Entre para continuar</p>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-xs flex flex-col items-center gap-4">
        <GoogleLogin
          onSuccess={cred => entrarComGoogle(cred.credential)}
          onError={() => toast.erro('Não foi possível entrar com o Google. Tente novamente.')}
          locale="pt_BR"
        />
      </div>
    </div>
  )
}

export default Login
