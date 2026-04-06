import { useState } from 'react'
import { useAdmins } from '../../hooks/useAdmins'
import { useAuth } from '../../hooks/useAuth'

function AdminUsuarios() {
  const { admins, loading, error, adicionarAdmin, removerAdmin } = useAdmins()
  const { user } = useAuth()

  const [novoEmail, setNovoEmail] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [formErro, setFormErro] = useState('')
  const [formSucesso, setFormSucesso] = useState('')
  const [removendo, setRemovendo] = useState(null)

  async function handleAdicionar(e) {
    e.preventDefault()
    setFormErro('')
    setFormSucesso('')

    if (!novoEmail.includes('@')) {
      setFormErro('E-mail inválido.')
      return
    }

    setAdicionando(true)
    const err = await adicionarAdmin(novoEmail, novoNome)
    setAdicionando(false)

    if (err) {
      setFormErro(err.includes('unique') ? 'Este e-mail já é admin.' : err)
    } else {
      setFormSucesso(`${novoEmail} adicionado com sucesso.`)
      setNovoEmail('')
      setNovoNome('')
    }
  }

  async function handleRemover(id) {
    if (!confirm('Remover este admin?')) return
    setRemovendo(id)
    const err = await removerAdmin(id, user?.email)
    setRemovendo(null)
    if (err) alert(err)
  }

  return (
    <div className="adm-usuarios">
      <h2 className="adm-section-title">Admins</h2>
      <p className="adm-section-desc">Controle de acesso ao painel. Apenas e-mails cadastrados aqui podem entrar — o login é feito com Google. Para adicionar alguém, informe o e-mail da conta Google dela. Não é possível remover o próprio usuário nem o último admin da lista.</p>

      {/* ADICIONAR */}
      <div className="adm-chart-card" style={{ marginBottom: 28 }}>
        <h3>Adicionar admin</h3>
        <form className="adm-add-form" onSubmit={handleAdicionar}>
          <input
            className="adm-input"
            type="email"
            placeholder="E-mail Google"
            value={novoEmail}
            onChange={e => setNovoEmail(e.target.value)}
            required
          />
          <input
            className="adm-input"
            type="text"
            placeholder="Nome (opcional)"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
          />
          <button className="adm-btn adm-btn-primary" type="submit" disabled={adicionando}>
            {adicionando ? 'Adicionando…' : '+ Adicionar'}
          </button>
        </form>
        {formErro && <p className="adm-error" style={{ marginTop: 10 }}>{formErro}</p>}
        {formSucesso && <p style={{ color: '#25d366', fontSize: 13, marginTop: 10 }}>✓ {formSucesso}</p>}
      </div>

      {/* LISTA */}
      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <div className="adm-loading">Carregando…</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Nome</th>
                <th>Adicionado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td>
                    {a.email}
                    {a.email === user?.email && (
                      <span className="adm-badge adm-badge--ativo" style={{ marginLeft: 8 }}>você</span>
                    )}
                  </td>
                  <td>{a.nome ?? '—'}</td>
                  <td>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button
                      className="adm-btn-danger"
                      onClick={() => handleRemover(a.id)}
                      disabled={removendo === a.id || a.email === user?.email}
                      title={a.email === user?.email ? 'Você não pode remover a si mesmo' : 'Remover admin'}
                    >
                      {removendo === a.id ? '…' : '×'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="adm-admins-aviso">
        <p>⚠️ O primeiro admin deve ser inserido manualmente via SQL no Supabase:</p>
        <pre>{`INSERT INTO admins (email, nome)\nVALUES ('seu@email.com', 'Seu Nome');`}</pre>
      </div>
    </div>
  )
}

export default AdminUsuarios
