import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import api, { definirTokenAuth } from '../services/api'
import { useToast } from '../hooks/useToast'
import { mensagemErro } from '../utils/erros'

const CHAVE_TOKEN = 'auth_token'

export function AuthProvider({ children }) {
  const toast = useToast()
  const [user, setUser] = useState(null)
  const [carregando, setCarregando] = useState(() => Boolean(localStorage.getItem(CHAVE_TOKEN)))

  const sair = useCallback(() => {
    localStorage.removeItem(CHAVE_TOKEN)
    definirTokenAuth(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(CHAVE_TOKEN)

    if (token) {
      definirTokenAuth(token)
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => sair())
        .finally(() => setCarregando(false))
    }
  }, [sair])

  useEffect(() => {
    window.addEventListener('auth:unauthorized', sair)
    return () => window.removeEventListener('auth:unauthorized', sair)
  }, [sair])

  const entrar = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem(CHAVE_TOKEN, res.data.token)
      definirTokenAuth(res.data.token)
      setUser(res.data.user)
    } catch (e) {
      toast.erro(mensagemErro(e, 'Erro ao entrar.'))
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* token já pode estar inválido */ }
    sair()
  }

  return (
    <AuthContext.Provider value={{ user, carregando, entrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
