import { Suspense, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { precarregarPaginas } from '../paginas'
import Layout from './Layout'

function RotaProtegida() {
  const { user, carregando } = useAuth()

  useEffect(() => {
    if (user) precarregarPaginas()
  }, [user])

  if (carregando) {
    return <div className="min-h-screen bg-slate-100" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </Layout>
  )
}

export default RotaProtegida
