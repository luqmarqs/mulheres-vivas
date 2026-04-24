import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../hooks/useAdmins'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const [adminCheck, setAdminCheck] = useState('loading') // 'loading' | 'ok' | 'denied'

  useEffect(() => {
    if (loading) return

    if (!session) {
      setAdminCheck('denied')
      return
    }

    let cancelled = false
    isAdmin(session.user.email).then(ok => {
      if (!cancelled) setAdminCheck(ok ? 'ok' : 'denied')
    })
    return () => { cancelled = true }
  }, [session, loading])

  if (loading || adminCheck === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#07050f', color: '#c4b8d8' }}>
        Verificando acesso…
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />

  if (adminCheck === 'denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#07050f', color: '#c4b8d8', gap: 16 }}>
        <p style={{ fontSize: 18, color: '#ff6b6b' }}>Acesso negado.</p>
        <p style={{ fontSize: 14 }}>O e-mail <b style={{ color: '#fff' }}>{session.user.email}</b> não tem permissão de admin.</p>
        <a href="/admin/login" style={{ color: '#9b5fd4', fontSize: 13 }}>Voltar ao login</a>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
