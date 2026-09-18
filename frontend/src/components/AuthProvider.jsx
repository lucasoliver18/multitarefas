import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import api, { definirTokenAuth } from '../services/api'

const CHAVE_TOKEN = 'auth_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [carregando, setCarregando] = useState(() => Boolean(localStorage.getItem(CHAVE_TOKEN)))
  const [erro, setErro] = useState('')

  const sair = useCallback(() => {
    localStorage.removeItem(CHAVE_TOKEN)
    definirTokenAuth(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(CHAVE_TOKEN)
    if (!token) return

    definirTokenAuth(token)
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => sair())
      .finally(() => setCarregando(false))
  }, [sair])

  useEffect(() => {
    window.addEventListener('auth:unauthorized', sair)
    return () => window.removeEventListener('auth:unauthorized', sair)
  }, [sair])

  const entrarComGoogle = async (credential) => {
    setErro('')
    try {
      const res = await api.post('/auth/google', { credential })
      localStorage.setItem(CHAVE_TOKEN, res.data.token)
      definirTokenAuth(res.data.token)
      setUser(res.data.user)
    } catch (e) {
      setErro(e.response?.data?.errors?.credential?.[0] || e.response?.data?.message || 'Erro ao entrar com o Google.')
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* token já pode estar inválido */ }
    sair()
  }

  return (
    <AuthContext.Provider value={{ user, carregando, erro, entrarComGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
