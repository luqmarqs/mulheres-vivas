import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminLeads from '../components/admin/AdminLeads'
import AdminComites from '../components/admin/AdminComites'
import AdminUsuarios from '../components/admin/AdminUsuarios'
import AdminPropostasComite from '../components/admin/AdminPropostasComite'
import AdminPropostasAgenda from '../components/admin/AdminPropostasAgenda'
import AdminAgendas from '../components/admin/AdminAgendas'

const TABS = [
  { id: 'dashboard',         label: 'Dashboard' },
  { id: 'leads',             label: 'Leads' },
  { id: 'comites',           label: 'Comitês' },
  { id: 'propostas_comite',  label: 'Prop. Comitê' },
  { id: 'propostas_agenda',  label: 'Prop. Agenda' },
  { id: 'agendas',           label: 'Agendas' },
  { id: 'usuarios',          label: 'Admins' },
]

function Admin() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const avatarUrl = user?.user_metadata?.avatar_url
  const nomeUsuario = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Usuaria'
  const inicialUsuario = (nomeUsuario || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className="adm-root">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <img src="/logo.png" alt="Bancada Feminista" />
          <span>Admin</span>
          <div className="adm-sidebar-user" aria-label={`Sessao ativa de ${nomeUsuario}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={nomeUsuario} className="adm-user-avatar" />
            ) : (
              <div className="adm-user-avatar adm-user-avatar-fallback">{inicialUsuario}</div>
            )}
          </div>
          <button className="adm-btn adm-btn-outline adm-btn-sm adm-logout-mobile" onClick={logout}>
            Sair
          </button>
        </div>

        <nav className="adm-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`adm-nav-item ${tab === t.id ? 'adm-nav-item--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <p className="adm-user-email">{user?.email}</p>
          <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-user-chip" aria-label={`Sessao ativa de ${nomeUsuario}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={nomeUsuario} className="adm-user-avatar" />
          ) : (
            <div className="adm-user-avatar adm-user-avatar-fallback">{inicialUsuario}</div>
          )}

          <div className="adm-user-chip-meta">
            <strong>{nomeUsuario}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'leads' && <AdminLeads />}
        {tab === 'comites' && <AdminComites />}
        {tab === 'propostas_comite' && <AdminPropostasComite />}
        {tab === 'propostas_agenda' && <AdminPropostasAgenda />}
        {tab === 'agendas' && <AdminAgendas />}
        {tab === 'usuarios' && <AdminUsuarios />}
      </main>
    </div>
  )
}

export default Admin
