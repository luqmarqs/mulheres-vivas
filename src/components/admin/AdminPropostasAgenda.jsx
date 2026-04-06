import { useState } from 'react'
import { usePropostasAgenda } from '../../hooks/usePropostas'

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'recusado', label: 'Recusados' },
]

function StatusBadge({ status }) {
  return <span className={`adm-badge adm-badge--proposta-${status}`}>{status}</span>
}

function AcaoModal({ item, onSave, onClose }) {
  const [status, setStatus] = useState(item.status)
  const [observacao, setObservacao] = useState(item.observacao ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, status, observacao)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Avaliar convite</h2>
        <p><b>Nome:</b> {item.nome}</p>
        <p><b>Cidade:</b> {item.cidade}{item.uf ? ` — ${item.uf}` : ''}</p>
        <p><b>Contato:</b> <a href={`https://wa.me/55${item.telefone}`} target="_blank" rel="noopener noreferrer" className="adm-link">{item.telefone}</a></p>
        {item.email && <p><b>Email:</b> {item.email}</p>}
        {item.mensagem && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>MENSAGEM</p>
            <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{item.mensagem}</p>
          </div>
        )}

        <div className="adm-field" style={{ marginTop: 16 }}>
          <label>Status</label>
          <select className="adm-input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="recusado">Recusado</option>
          </select>
        </div>

        <div className="adm-field" style={{ marginTop: 12 }}>
          <label>Observação interna</label>
          <textarea
            className="adm-input adm-textarea"
            rows={3}
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Data confirmada, nome do evento, contato responsável…"
          />
        </div>

        <button className="adm-btn adm-btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function AdminPropostasAgenda() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [removendo, setRemovendo] = useState(null)

  const { items, loading, error, atualizarStatus, remover } = usePropostasAgenda({ search, status })

  async function handleRemover(id) {
    if (!confirm('Remover este convite?')) return
    setRemovendo(id)
    await remover(id)
    setRemovendo(null)
  }

  return (
    <div>
      <h2 className="adm-section-title">Propostas de Agenda</h2>
      <p className="adm-sub" style={{ marginBottom: 20 }}>
        Convites para a Bancada Feminista visitar cidades e eventos.
      </p>

      <div className="adm-filters">
        <input className="adm-input" placeholder="Buscar nome ou cidade…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="adm-input" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <div className="adm-loading">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="adm-empty">Nenhum convite encontrado.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Cidade / UF</th>
                <th>Mensagem</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>
                    <a href={`https://wa.me/55${item.telefone}`} target="_blank" rel="noopener noreferrer" className="adm-link">
                      {item.telefone}
                    </a>
                  </td>
                  <td>{[item.cidade, item.uf].filter(Boolean).join(' / ') || '—'}</td>
                  <td style={{ maxWidth: 220 }}>
                    {item.mensagem
                      ? <span title={item.mensagem} style={{ cursor: 'help' }}>{item.mensagem.slice(0, 60)}{item.mensagem.length > 60 ? '…' : ''}</span>
                      : '—'}
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setModal(item)}>Avaliar</button>
                    <button className="adm-btn-danger" onClick={() => handleRemover(item.id)} disabled={removendo === item.id}>
                      {removendo === item.id ? '…' : '×'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="adm-count">{items.length} convite{items.length !== 1 ? 's' : ''}</p>

      {modal && (
        <AcaoModal
          item={modal}
          onSave={atualizarStatus}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default AdminPropostasAgenda
