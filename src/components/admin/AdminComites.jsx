import { useState, useRef, useEffect } from 'react'
import { useComites, useComiteDetalhe } from '../../hooks/useComites'
import { useCidades } from '../../hooks/useCidades'
import { supabase } from '../../lib/supabase'
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR, toWhatsAppUrl } from '../../utils/phone'

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

const FORM_VAZIO = {
  nome: '', cidade: '', estado: 'SP',
  responsavel_nome: '', responsavel_telefone: '', whatsapp_link: '', ativo: true,
}

function FormComite({ onSalvar, onCancelar }) {
  const [form, setForm] = useState(FORM_VAZIO)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [cidadeSelecionada, setCidadeSelecionadaLocal] = useState(false)
  const cidadeRef = useRef(null)

  const { cidadeBusca, setCidadeBusca, cidadesFiltradas, cidadeErro, setCidadeErro, setCidadeSelecionada, cidades } =
    useCidades(form.estado)

  useEffect(() => {
    const handler = (e) => {
      if (cidadeRef.current && !cidadeRef.current.contains(e.target))
        setMostrarSugestoes(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Ao trocar estado, limpa cidade
  function handleEstado(e) {
    setForm(f => ({ ...f, estado: e.target.value, cidade: '' }))
    setCidadeBusca('')
    setCidadeSelecionadaLocal(false)
    setCidadeErro('')
  }

  function handleCidadeChange(e) {
    const val = e.target.value
    setCidadeBusca(val)
    setForm(f => ({ ...f, cidade: val }))
    setCidadeSelecionadaLocal(false)
    setMostrarSugestoes(true)
    if (val) setCidadeErro('')
  }

  function selecionarCidade(nome) {
    setCidadeSelecionada(nome)
    setForm(f => ({ ...f, cidade: nome }))
    setCidadeSelecionadaLocal(true)
    setMostrarSugestoes(false)
  }

  function validarCidade() {
    if (!form.cidade) return true // opcional
    if (!cidadeSelecionada) {
      // verifica se bate exatamente com alguma cidade da lista
      const existe = cidades.some(c => c.nome.toLowerCase() === form.cidade.toLowerCase())
      if (!existe) {
        setCidadeErro('Selecione uma cidade da lista.')
        return false
      }
    }
    return true
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  function handleTelefoneResponsavel(e) {
    setForm(f => ({ ...f, responsavel_telefone: formatPhoneBR(e.target.value) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome) { setErro('Nome é obrigatório.'); return }
    if (!validarCidade()) return
    setSaving(true)
    const err = await onSalvar(form)
    setSaving(false)
    if (err) setErro(err)
    else onCancelar()
  }

  return (
    <div className="adm-chart-card">
      <h3>Novo comitê</h3>
      <form className="adm-agenda-form" onSubmit={handleSubmit}>

        <div className="adm-field">
          <label>Nome do comitê *</label>
          <input className="adm-input" value={form.nome} onChange={set('nome')} required placeholder="Ex: Comitê Vila Madalena" />
        </div>

        <div className="adm-agenda-row">
          <div className="adm-field" ref={cidadeRef} style={{ position: 'relative' }}>
            <label>Cidade</label>
            <input
              className="adm-input"
              value={cidadeBusca}
              onChange={handleCidadeChange}
              onFocus={() => cidadeBusca.length >= 2 && setMostrarSugestoes(true)}
              placeholder="Digite para buscar…"
              autoComplete="off"
            />
            {mostrarSugestoes && cidadesFiltradas.length > 0 && (
              <div className="cidade-sugestoes" style={{ top: '100%', zIndex: 100 }}>
                {cidadesFiltradas.map((c, i) => (
                  <div
                    key={c.nome || i}
                    className="cidade-item"
                    onMouseDown={() => selecionarCidade(c.nome)}
                  >
                    {c.nome}
                  </div>
                ))}
              </div>
            )}
            {cidadeErro && <p className="adm-error" style={{ marginTop: 4 }}>{cidadeErro}</p>}
          </div>
          <div className="adm-field">
            <label>Estado</label>
            <select className="adm-input" value={form.estado} onChange={handleEstado}>
              {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>

        <div className="adm-field">
          <label>Responsável</label>
          <input className="adm-input" value={form.responsavel_nome} onChange={set('responsavel_nome')} placeholder="Nome completo" />
        </div>

        <div className="adm-field">
          <label>Telefone do responsável</label>
          <input className="adm-input" value={form.responsavel_telefone} onChange={handleTelefoneResponsavel} placeholder="(11) 99999-9999" />
        </div>

        <div className="adm-field">
          <label>Link do grupo WhatsApp</label>
          <input className="adm-input" type="url" value={form.whatsapp_link} onChange={set('whatsapp_link')} placeholder="https://chat.whatsapp.com/…" />
        </div>

        <label className="adm-check-label">
          <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
          Comitê ativo
        </label>

        {erro && <p className="adm-error">{erro}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Criar comitê'}
          </button>
          <button className="adm-btn adm-btn-outline" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function AddMembro({ onAdicionar }) {
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [leadEncontrado, setLeadEncontrado] = useState(null) // null | false | object
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function buscarLead() {
    const num = normalizePhoneBR(telefone)
    if (!isValidPhoneBR(num)) { setErro('Telefone inválido.'); return }
    setErro('')
    setBuscando(true)
    const { data } = await supabase
      .from('leads')
      .select('nome, email, telefone')
      .eq('telefone', num)
      .maybeSingle()
    setBuscando(false)
    if (data) {
      setLeadEncontrado(data)
      setNome(data.nome)
      setEmail(data.email ?? '')
    } else {
      setLeadEncontrado(false)
    }
  }

  async function handleAdicionar(e) {
    e.preventDefault()
    if (!nome) { setErro('Nome é obrigatório.'); return }
    setSaving(true)
    const err = await onAdicionar({ nome, telefone: normalizePhoneBR(telefone), email })
    setSaving(false)
    if (err) { setErro(err); return }
    setTelefone(''); setNome(''); setEmail('')
    setLeadEncontrado(null)
  }

  return (
    <form className="adm-add-membro" onSubmit={handleAdicionar}>
      <div className="adm-add-membro-busca">
        <input
          className="adm-input"
          placeholder="Telefone (com DDD)"
          value={telefone}
          onChange={e => { setTelefone(formatPhoneBR(e.target.value)); setLeadEncontrado(null); setNome(''); setEmail('') }}
        />
        <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={buscarLead} disabled={buscando}>
          {buscando ? '…' : 'Buscar'}
        </button>
      </div>

      {leadEncontrado === false && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Não encontrado nos leads — preencha manualmente.</p>
      )}
      {leadEncontrado && (
        <p style={{ fontSize: 13, color: 'var(--purple-light)' }}>✓ Lead encontrado: {leadEncontrado.nome}</p>
      )}

      {leadEncontrado !== null && (
        <>
          <div className="adm-agenda-row">
            <input className="adm-input" placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} required />
            <input className="adm-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="adm-btn adm-btn-primary adm-btn-sm" type="submit" disabled={saving}>
              {saving ? 'Adicionando…' : '+ Adicionar'}
            </button>
          </div>
        </>
      )}

      {erro && <p className="adm-error">{erro}</p>}
    </form>
  )
}

function ComiteDetalhe({ id, onBack, onRefetch, onExcluir }) {
  const { comite, membros, loading, adicionarMembro, removerMembro, definirResponsavel } = useComiteDetalhe(id)
  const [toggling, setToggling] = useState(false)
  const [removendo, setRemovendo] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [definindoResponsavelId, setDefinindoResponsavelId] = useState(null)

  function isResponsavel(membro) {
    const telResponsavel = normalizePhoneBR(comite?.responsavel_telefone)
    const telMembro = normalizePhoneBR(membro?.telefone)

    if (telResponsavel && telMembro) {
      return telResponsavel === telMembro
    }

    const nomeResponsavel = String(comite?.responsavel_nome || '').trim().toLowerCase()
    const nomeMembro = String(membro?.nome || '').trim().toLowerCase()
    return !!nomeResponsavel && !!nomeMembro && nomeResponsavel === nomeMembro
  }

  async function toggleAtivo() {
    setToggling(true)
    await supabase.from('comites').update({ ativo: !comite.ativo }).eq('id', id)
    setToggling(false)
    onRefetch()
  }

  async function handleRemover(membroId) {
    setRemovendo(membroId)
    await removerMembro(membroId)
    setRemovendo(null)
  }

  async function handleDefinirResponsavel(membro) {
    setDefinindoResponsavelId(membro.id)
    const erro = await definirResponsavel({ nome: membro.nome, telefone: membro.telefone })
    setDefinindoResponsavelId(null)

    if (erro) {
      window.alert(`Não foi possível atualizar o responsável: ${erro}`)
    }
  }

  async function handleExcluirComite() {
    if (!comite) return

    const confirmou = window.confirm(`Excluir o comitê "${comite.nome}"? Essa ação remove o comitê do banco, apaga os membros persistidos e desvincula os leads associados.`)
    if (!confirmou) return

    setExcluindo(true)
    const erro = await onExcluir(id)
    setExcluindo(false)

    if (erro) {
      window.alert(`Não foi possível excluir o comitê: ${erro}`)
      return
    }

    onBack()
  }

  if (loading) return <div className="adm-loading">Carregando…</div>
  if (!comite) return null

  return (
    <div className="adm-comite-detalhe">
      <button className="adm-btn adm-btn-outline" onClick={onBack}>← Voltar</button>

      <div className="adm-comite-header">
        <div>
          <h2 className="adm-section-title">{comite.nome}</h2>
          <p className="adm-sub">{comite.cidade}{comite.estado ? ` — ${comite.estado}` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`adm-btn ${comite.ativo ? 'adm-btn-outline' : 'adm-btn-primary'}`}
            onClick={toggleAtivo}
            disabled={toggling || excluindo}
          >
            {comite.ativo ? 'Desativar' : 'Reativar'}
          </button>
          <button className="adm-btn-danger" onClick={handleExcluirComite} disabled={excluindo || toggling}>
            {excluindo ? 'Excluindo…' : 'Excluir comitê'}
          </button>
        </div>
      </div>

      <div className="adm-comite-info">
        <div><b>Responsável:</b> {comite.responsavel_nome ?? '—'}</div>
        <div><b>Telefone:</b> {comite.responsavel_telefone ?? '—'}</div>
        {comite.whatsapp_link && (
          <div>
            <b>WhatsApp:</b>{' '}
            <a href={comite.whatsapp_link} target="_blank" rel="noopener noreferrer" className="adm-link">
              Abrir grupo
            </a>
          </div>
        )}
        <div><b>Status:</b> {comite.ativo ? '✓ Ativo' : '✗ Inativo'}</div>
        <div><b>Criado em:</b> {new Date(comite.created_at).toLocaleDateString('pt-BR')}</div>
      </div>

      <h3 className="adm-sub-title">Membros ({membros.length})</h3>

      <AddMembro onAdicionar={adicionarMembro} />

      {membros.length > 0 && (
        <div className="adm-table-wrap" style={{ marginTop: 12 }}>
          <table className="adm-table">
            <thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Origem</th><th>Responsável</th><th></th></tr></thead>
            <tbody>
              {membros.map(m => (
                <tr key={m.id} className={isResponsavel(m) ? 'adm-tr-responsavel' : ''}>
                  <td>{m.nome}</td>
                  <td>
                    {m.telefone
                      ? <a href={toWhatsAppUrl(m.telefone)} target="_blank" rel="noopener noreferrer" className="adm-link">{formatPhoneBR(m.telefone)}</a>
                      : '—'}
                  </td>
                  <td>{m.email ?? '—'}</td>
                  <td>
                    <span className="adm-badge adm-badge--origem">
                      {m.origem_membro === 'lead' ? 'lead' : 'membro'}
                    </span>
                  </td>
                  <td>
                    {isResponsavel(m)
                      ? <span className="adm-badge adm-badge--ativo">Atual</span>
                      : (
                        <button
                          className="adm-btn adm-btn-sm adm-btn-outline"
                          onClick={() => handleDefinirResponsavel(m)}
                          disabled={definindoResponsavelId === m.id}
                        >
                          {definindoResponsavelId === m.id ? 'Definindo…' : 'Definir'}
                        </button>
                      )}
                  </td>
                  <td>
                    {m.origem_membro === 'membros_comite' ? (
                      <button className="adm-btn-danger" onClick={() => handleRemover(m.id)} disabled={removendo === m.id}>
                        {removendo === m.id ? '…' : '×'}
                      </button>
                    ) : (
                      <span style={{ color: '#6b5a80', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminComites() {
  const [search, setSearch] = useState('')
  const [apenasAtivos, setApenasAtivos] = useState(false)
  const [detalheId, setDetalheId] = useState(null)
  const [criando, setCriando] = useState(false)
  const [excluindoId, setExcluindoId] = useState(null)
  const { comites, loading, error, refetch, criar, remover } = useComites({ search, apenasAtivos })

  async function handleExcluirComite(id, nome) {
    const confirmou = window.confirm(`Excluir o comitê "${nome}"? Essa ação remove o comitê do banco, apaga os membros persistidos e desvincula os leads associados.`)
    if (!confirmou) return

    setExcluindoId(id)
    const erro = await remover(id)
    setExcluindoId(null)

    if (erro) {
      window.alert(`Não foi possível excluir o comitê: ${erro}`)
    }
  }

  if (detalheId) {
    return (
      <ComiteDetalhe
        id={detalheId}
        onBack={() => { setDetalheId(null); refetch() }}
        onRefetch={refetch}
        onExcluir={remover}
      />
    )
  }

  if (criando) {
    return <FormComite onSalvar={criar} onCancelar={() => setCriando(false)} />
  }

  return (
    <div className="adm-comites">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Comitês</h2>
        <button className="adm-btn adm-btn-primary" title="Criar um novo comitê manualmente" onClick={() => setCriando(true)}>
          + Novo comitê
        </button>
      </div>
      <p className="adm-section-desc">Grupos de base organizados por cidade. Clique em <strong>Ver →</strong> para abrir o detalhe, adicionar membros e ativar ou desativar o comitê. Comitês criados aqui também aparecem na página pública de comitês do site.</p>

      <div className="adm-filters">
        <input
          className="adm-input"
          placeholder="Buscar por nome ou cidade…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="adm-check-label">
          <input
            type="checkbox"
            checked={apenasAtivos}
            onChange={e => setApenasAtivos(e.target.checked)}
          />
          Apenas ativos
        </label>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <div className="adm-loading">Carregando…</div>
      ) : comites.length === 0 ? (
        <div className="adm-empty">Nenhum comitê encontrado.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade / Estado</th>
                <th>Responsável</th>
                <th>Membros</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {comites.map(c => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{[c.cidade, c.estado].filter(Boolean).join(' / ')}</td>
                  <td>{c.responsavel_nome ?? '—'}</td>
                  <td>{c.membros_comite?.[0]?.count ?? 0}</td>
                  <td>
                    <span className={`adm-badge adm-badge--${c.ativo ? 'ativo' : 'inativo'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="adm-btn adm-btn-sm" onClick={() => setDetalheId(c.id)}>
                        Ver →
                      </button>
                      <button className="adm-btn-danger" onClick={() => handleExcluirComite(c.id, c.nome)} disabled={excluindoId === c.id}>
                        {excluindoId === c.id ? '…' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="adm-count">{comites.length} comitê{comites.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default AdminComites
