import { useState } from 'react'
import { usePropostasAgenda } from '../../hooks/usePropostas'
import { supabase } from '../../lib/supabase'
import { formatPhoneBR, toWhatsAppUrl } from '../../utils/phone'

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'recusado', label: 'Recusados' },
]

function StatusBadge({ status }) {
  return <span className={`adm-badge adm-badge--proposta-${status}`}>{status}</span>
}

function buildGoogleMapsUrl(localNome, localEndereco) {
  const query = [localNome, localEndereco].filter(Boolean).join(', ').trim()
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function AcaoModal({ item, onSave, onClose, onCriarAgenda }) {
  const [status, setStatus] = useState(item.status)
  const [observacao, setObservacao] = useState(item.observacao ?? '')
  const [saving, setSaving] = useState(false)
  const [creatingAgenda, setCreatingAgenda] = useState(false)
  const [agendaErro, setAgendaErro] = useState('')
  const [agendaImagemFile, setAgendaImagemFile] = useState(null)
  const [agendaImagemPreview, setAgendaImagemPreview] = useState('')
  const [agendaForm, setAgendaForm] = useState({
    titulo: item.cidade ? `Agenda em ${item.cidade}` : `Agenda com ${item.nome}`,
    data: '',
    hora: '',
    local_nome: '',
    local_endereco: item.cidade || '',
    descricao: item.mensagem || '',
    publicado: true,
  })

  function handleAgendaImagem(e) {
    const file = e.target.files?.[0]
    if (!file) {
      setAgendaImagemFile(null)
      setAgendaImagemPreview('')
      return
    }

    setAgendaImagemFile(file)
    setAgendaImagemPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, status, observacao)
    setSaving(false)
    onClose()
  }

  async function handleCriarAgenda() {
    if (!agendaForm.titulo || !agendaForm.data) {
      setAgendaErro('Título e data são obrigatórios para criar a agenda.')
      return
    }

    setAgendaErro('')
    setCreatingAgenda(true)
    const erro = await onCriarAgenda(item, agendaForm, agendaImagemFile, observacao)
    setCreatingAgenda(false)

    if (erro) {
      setAgendaErro(erro)
      return
    }

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Avaliar convite</h2>
        <p><b>Nome:</b> {item.nome}</p>
        <p><b>Cidade:</b> {item.cidade}{item.uf ? ` — ${item.uf}` : ''}</p>
        <p><b>Contato:</b> <a href={toWhatsAppUrl(item.telefone)} target="_blank" rel="noopener noreferrer" className="adm-link">{formatPhoneBR(item.telefone)}</a></p>
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

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Criar agenda a partir da proposta</h3>

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Título *</label>
            <input
              className="adm-input"
              value={agendaForm.titulo}
              onChange={e => setAgendaForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Título da agenda"
            />
          </div>

          <div className="adm-agenda-row" style={{ marginTop: 8 }}>
            <div className="adm-field">
              <label>Data *</label>
              <input
                className="adm-input"
                type="date"
                value={agendaForm.data}
                onChange={e => setAgendaForm(f => ({ ...f, data: e.target.value }))}
              />
            </div>
            <div className="adm-field">
              <label>Hora</label>
              <input
                className="adm-input"
                type="time"
                value={agendaForm.hora}
                onChange={e => setAgendaForm(f => ({ ...f, hora: e.target.value }))}
              />
            </div>
          </div>

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Local</label>
            <input
              className="adm-input"
              value={agendaForm.local_nome}
              onChange={e => setAgendaForm(f => ({ ...f, local_nome: e.target.value }))}
              placeholder="Nome do local"
            />
            <input
              className="adm-input"
              style={{ marginTop: 6 }}
              value={agendaForm.local_endereco}
              onChange={e => setAgendaForm(f => ({ ...f, local_endereco: e.target.value }))}
              placeholder="Endereço (opcional)"
            />
          </div>

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Descrição</label>
            <textarea
              className="adm-input adm-textarea"
              rows={3}
              value={agendaForm.descricao}
              onChange={e => setAgendaForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Detalhes do evento…"
            />
          </div>

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Imagem</label>
            {agendaImagemPreview && <img src={agendaImagemPreview} alt="preview" className="adm-agenda-preview" />}
            <input type="file" accept="image/*" onChange={handleAgendaImagem} className="adm-file-input" />
          </div>

          <label className="adm-check-label" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={agendaForm.publicado}
              onChange={e => setAgendaForm(f => ({ ...f, publicado: e.target.checked }))}
            />
            Publicar no site ao criar
          </label>

          {agendaErro && <p className="adm-error" style={{ marginTop: 8 }}>{agendaErro}</p>}

          <button className="adm-btn adm-btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={handleCriarAgenda} disabled={creatingAgenda || saving}>
            {creatingAgenda ? 'Criando agenda…' : 'Criar agenda'}
          </button>
        </div>
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

  async function handleCriarAgenda(item, agendaForm, imagemFile, observacaoAtual) {
    let imagemUrl = null

    if (imagemFile) {
      const ext = imagemFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('agendas')
        .upload(path, imagemFile, { upsert: true })

      if (uploadError) return uploadError.message

      const { data: urlData } = supabase.storage.from('agendas').getPublicUrl(path)
      imagemUrl = urlData?.publicUrl ?? null
    }

    const payload = {
      titulo: agendaForm.titulo,
      data: agendaForm.data,
      hora: agendaForm.hora || null,
      local_nome: agendaForm.local_nome || null,
      local_endereco: agendaForm.local_endereco || null,
      local_maps_url: buildGoogleMapsUrl(agendaForm.local_nome, agendaForm.local_endereco),
      local_place_id: null,
      descricao: agendaForm.descricao || null,
      imagem_url: imagemUrl,
      publicado: agendaForm.publicado ?? true,
    }

    const { data: agendaCriada, error: agendaError } = await supabase
      .from('agendas')
      .insert(payload)
      .select('id')
      .single()

    if (agendaError) return agendaError.message

    const observacaoFinal = [
      observacaoAtual,
      `Agenda criada pelo admin (id: ${agendaCriada?.id}).`,
    ].filter(Boolean).join(' ')

    const statusError = await atualizarStatus(item.id, 'confirmado', observacaoFinal)
    return statusError
  }

  async function handleRemover(id) {
    if (!confirm('Remover este convite?')) return
    setRemovendo(id)
    await remover(id)
    setRemovendo(null)
  }

  return (
    <div>
      <h2 className="adm-section-title">Propostas de Agenda</h2>
      <p className="adm-section-desc">Convites enviados por pessoas que querem receber a Bancada em um evento, escola ou comunidade. Clique em <strong>Ver / Responder</strong> para avaliar, confirmar ou recusar o pedido e registrar uma observação. O contato também fica em Leads.</p>

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
                    <a href={toWhatsAppUrl(item.telefone)} target="_blank" rel="noopener noreferrer" className="adm-link">
                      {formatPhoneBR(item.telefone)}
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
          onCriarAgenda={handleCriarAgenda}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default AdminPropostasAgenda
