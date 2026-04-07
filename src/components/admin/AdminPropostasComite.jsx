import { useEffect, useState } from 'react'
import { usePropostasComite } from '../../hooks/usePropostas'
import { supabase } from '../../lib/supabase'
import { formatPhoneBR, normalizePhoneBR, toWhatsAppUrl } from '../../utils/phone'

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'recusado', label: 'Recusados' },
]

function StatusBadge({ status }) {
  return <span className={`adm-badge adm-badge--proposta-${status}`}>{status}</span>
}

function AcaoModal({ item, onSave, onClose, onCriarComite, onAdicionarComiteExistente }) {
  const [status, setStatus] = useState(item.status)
  const [observacao, setObservacao] = useState(item.observacao ?? '')
  const [saving, setSaving] = useState(false)
  const [comites, setComites] = useState([])
  const [comiteId, setComiteId] = useState('')
  const [carregandoComites, setCarregandoComites] = useState(true)
  const [acaoLoading, setAcaoLoading] = useState('')
  const [acaoErro, setAcaoErro] = useState('')

  useEffect(() => {
    let mounted = true

    async function fetchComites() {
      setCarregandoComites(true)
      const { data, error } = await supabase
        .from('comites')
        .select('id, nome, cidade, estado, ativo')
        .order('nome', { ascending: true })

      if (mounted) {
        if (error) setAcaoErro(error.message)
        else setComites(data ?? [])
        setCarregandoComites(false)
      }
    }

    fetchComites()
    return () => { mounted = false }
  }, [])

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, status, observacao)
    setSaving(false)
    onClose()
  }

  async function handleCriarComite() {
    setAcaoErro('')
    setAcaoLoading('criar')
    const erro = await onCriarComite(item, observacao)
    setAcaoLoading('')

    if (erro) {
      setAcaoErro(erro)
      return
    }

    onClose()
  }

  async function handleAdicionarComiteExistente() {
    if (!comiteId) {
      setAcaoErro('Selecione um comitê para vincular.')
      return
    }

    setAcaoErro('')
    setAcaoLoading('adicionar')
    const erro = await onAdicionarComiteExistente(item, comiteId, observacao)
    setAcaoLoading('')

    if (erro) {
      setAcaoErro(erro)
      return
    }

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Atualizar proposta</h2>
        <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>Use uma das ações abaixo para decidir o destino desta proposta.</p>
        <p><b>Nome:</b> {item.nome}</p>
        <p><b>Cidade:</b> {item.cidade}{item.uf ? ` — ${item.uf}` : ''}</p>
        {item.whatsapp_link && <p><b>WhatsApp:</b> <a href={item.whatsapp_link} target="_blank" rel="noopener noreferrer" className="adm-link">Abrir grupo</a></p>}

        <div className="adm-field" style={{ marginTop: 16 }}>
          <label>Status</label>
          <select className="adm-input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
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
            placeholder="Notas internas sobre esta proposta…"
          />
        </div>

        <button className="adm-btn adm-btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Ações da avaliação</h3>

          <button
            className="adm-btn adm-btn-primary"
            style={{ width: '100%' }}
            onClick={handleCriarComite}
            disabled={acaoLoading === 'criar' || acaoLoading === 'adicionar'}
          >
            {acaoLoading === 'criar' ? 'Criando…' : 'Criar comitê'}
          </button>

          <div className="adm-field" style={{ marginTop: 10 }}>
            <label>Adicionar a comitê existente</label>
            <select
              className="adm-input"
              value={comiteId}
              onChange={e => setComiteId(e.target.value)}
              disabled={carregandoComites || acaoLoading === 'criar' || acaoLoading === 'adicionar'}
            >
              <option value="">Selecione um comitê</option>
              {comites.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.cidade ? ` — ${c.cidade}` : ''}{c.estado ? `/${c.estado}` : ''}{c.ativo ? '' : ' (inativo)'}
                </option>
              ))}
            </select>
          </div>

          <button
            className="adm-btn adm-btn-outline"
            style={{ width: '100%' }}
            onClick={handleAdicionarComiteExistente}
            disabled={carregandoComites || acaoLoading === 'criar' || acaoLoading === 'adicionar'}
          >
            {acaoLoading === 'adicionar' ? 'Adicionando…' : 'Adicionar ao comitê existente'}
          </button>

          {acaoErro && <p className="adm-error" style={{ marginTop: 10 }}>{acaoErro}</p>}
        </div>
      </div>
    </div>
  )
}

function AdminPropostasComite() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [removendo, setRemovendo] = useState(null)

  const { items, loading, error, atualizarStatus, remover } = usePropostasComite({ search, status })

  async function upsertLeadAndMembro({ proposta, comiteId }) {
    const telefone = normalizePhoneBR(proposta.telefone)
    if (!telefone || (telefone.length !== 10 && telefone.length !== 11)) {
      return 'Telefone da proposta inválido para vincular responsável.'
    }

    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('telefone', telefone)
      .limit(1)

    let leadId = leads?.[0]?.id

    if (leadId) {
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({ comite_id: comiteId, intencao: 'organizar' })
        .eq('id', leadId)

      if (updateLeadError) return updateLeadError.message
    } else {
      const { data: novoLead, error: insertLeadError } = await supabase
        .from('leads')
        .insert({
          nome: proposta.nome,
          telefone,
          email: proposta.email || null,
          cidade: proposta.cidade || null,
          uf: proposta.uf || null,
          comite_id: comiteId,
          intencao: 'organizar',
          novidades: true,
          origem: 'form_comite',
        })
        .select('id')
        .single()

      if (insertLeadError) return insertLeadError.message
      leadId = novoLead?.id
    }

    const { data: membroExistente, error: checkMembroError } = await supabase
      .from('membros_comite')
      .select('id')
      .eq('comite_id', comiteId)
      .eq('telefone', telefone)
      .limit(1)

    if (checkMembroError) return checkMembroError.message

    if (!membroExistente || membroExistente.length === 0) {
      const { error: insertMembroError } = await supabase.from('membros_comite').insert({
        comite_id: comiteId,
        nome: proposta.nome,
        telefone,
        email: proposta.email || null,
        papel: 'coordenadora',
      })

      if (insertMembroError) return insertMembroError.message
    }

    return null
  }

  async function handleCriarComite(proposta, observacao) {
    const telefone = normalizePhoneBR(proposta.telefone)
    if (!telefone || (telefone.length !== 10 && telefone.length !== 11)) {
      return 'Telefone da proposta inválido para criar comitê.'
    }

    const nomeComite = proposta.cidade
      ? `Comitê Mulheres Vivas — ${proposta.cidade}`
      : `Comitê Mulheres Vivas — ${proposta.nome}`

    const { data: comite, error: createComiteError } = await supabase
      .from('comites')
      .insert({
        nome: nomeComite,
        cidade: proposta.cidade || null,
        estado: proposta.uf || null,
        responsavel_nome: proposta.nome || null,
        responsavel_telefone: telefone,
        whatsapp_link: null,
        ativo: true,
      })
      .select('id')
      .single()

    if (createComiteError) return createComiteError.message

    const errVinculo = await upsertLeadAndMembro({ proposta, comiteId: comite.id })
    if (errVinculo) return errVinculo

    const errStatus = await atualizarStatus(
      proposta.id,
      'aprovado',
      observacao || 'Aprovada e comitê criado no admin.'
    )

    return errStatus
  }

  async function handleAdicionarComiteExistente(proposta, comiteId, observacao) {
    const errVinculo = await upsertLeadAndMembro({ proposta, comiteId })
    if (errVinculo) return errVinculo

    const errStatus = await atualizarStatus(
      proposta.id,
      'aprovado',
      observacao || 'Aprovada e vinculada a comitê existente no admin.'
    )

    return errStatus
  }

  async function handleRemover(id) {
    if (!confirm('Remover esta proposta?')) return
    setRemovendo(id)
    await remover(id)
    setRemovendo(null)
  }

  return (
    <div>
      <h2 className="adm-section-title">Propostas de Comitê</h2>
      <p className="adm-section-desc">Solicitações enviadas por pessoas que querem organizar um comitê na cidade delas. Em <strong>Avaliar</strong>, você pode: criar um novo comitê com os dados da proposta como responsável, ou adicionar a proposta em um comitê já existente.</p>

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
        <div className="adm-empty">Nenhuma proposta encontrada.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Cidade / UF</th>
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
                  <td>{item.email ?? '—'}</td>
                  <td>{[item.cidade, item.uf].filter(Boolean).join(' / ') || '—'}</td>
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

      <p className="adm-count">{items.length} proposta{items.length !== 1 ? 's' : ''}</p>

      {modal && (
        <AcaoModal
          item={modal}
          onSave={atualizarStatus}
          onCriarComite={handleCriarComite}
          onAdicionarComiteExistente={handleAdicionarComiteExistente}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default AdminPropostasComite
