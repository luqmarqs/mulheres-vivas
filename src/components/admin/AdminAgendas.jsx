import { useEffect, useRef, useState } from 'react'
import { useAgendasAdmin } from '../../hooks/useAgendas'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''

if (MAPS_KEY) {
  setOptions({ key: MAPS_KEY, v: 'weekly' })
}

const FORM_VAZIO = {
  titulo: '',
  data: '',
  hora: '',
  local_nome: '',
  local_endereco: '',
  local_maps_url: '',
  local_place_id: '',
  descricao: '',
  imagem_url: '',
  publicado: false,
}

function buildGoogleMapsUrl(localNome, localEndereco) {
  const query = [localNome, localEndereco].filter(Boolean).join(', ').trim()
  if (!query) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function LocalInput({ form, setForm, localNomeRef, localEnderecoRef }) {
  const autocompleteServiceRef = useRef(null)
  const fetchTimeoutRef = useRef(null)
  const [mapsDisponivel, setMapsDisponivel] = useState(false)
  const [query, setQuery] = useState(form.local_nome ?? '')
  const [sugestoes, setSugestoes] = useState([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  useEffect(() => {
    if (!localNomeRef.current || !localEnderecoRef.current) return

    localNomeRef.current.value = form.local_nome ?? ''
    localEnderecoRef.current.value = form.local_endereco ?? ''
    setQuery(form.local_nome ?? '')
  }, [form.local_nome, form.local_endereco, localNomeRef, localEnderecoRef])

  useEffect(() => {
    if (!MAPS_KEY) return

    importLibrary('places').then(() => {
      if (autocompleteServiceRef.current) return

      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
      setMapsDisponivel(true)
    }).catch(() => {})

    return () => {
      if (fetchTimeoutRef.current) window.clearTimeout(fetchTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!mapsDisponivel || !autocompleteServiceRef.current) return

    const termo = query.trim()

    if (fetchTimeoutRef.current) window.clearTimeout(fetchTimeoutRef.current)

    if (termo.length < 2) {
      setSugestoes([])
      return
    }

    fetchTimeoutRef.current = window.setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: termo,
          componentRestrictions: { country: 'br' },
          language: 'pt-BR',
        },
        (predictions, status) => {
          const ok = window.google?.maps?.places?.PlacesServiceStatus?.OK
          const zero = window.google?.maps?.places?.PlacesServiceStatus?.ZERO_RESULTS

          if (status === ok) {
            setSugestoes(predictions ?? [])
            return
          }

          if (status === zero) {
            setSugestoes([])
            return
          }

          setSugestoes([])
        }
      )
    }, 180)

    return () => {
      if (fetchTimeoutRef.current) window.clearTimeout(fetchTimeoutRef.current)
    }
  }, [query, mapsDisponivel])

  function handleSelecionarSugestao(prediction) {
    const nomeLocal = prediction.structured_formatting?.main_text || prediction.description || ''
    const endereco = prediction.structured_formatting?.secondary_text || ''
    const mapsUrl = buildGoogleMapsUrl(nomeLocal, endereco || prediction.description)

    setQuery(prediction.description || nomeLocal)
    setMostrarSugestoes(false)
    setSugestoes([])

    if (localNomeRef.current) localNomeRef.current.value = prediction.description || nomeLocal
    if (localEnderecoRef.current) localEnderecoRef.current.value = endereco

    setForm(f => ({
      ...f,
      local_nome: nomeLocal,
      local_endereco: endereco,
      local_maps_url: mapsUrl,
      local_place_id: prediction.place_id ?? '',
    }))
  }

  function handleChangeNome(e) {
    const valor = e.target.value
    setQuery(valor)
    setMostrarSugestoes(true)
    setForm(f => ({
      ...f,
      local_nome: valor,
      local_maps_url: '',
      local_place_id: '',
    }))
  }

  function handleChangeEndereco(e) {
    const valor = e.target.value
    setForm(f => ({
      ...f,
      local_endereco: valor,
      local_maps_url: '',
      local_place_id: '',
    }))
  }

  function handleBlur() {
    window.setTimeout(() => setMostrarSugestoes(false), 120)
  }

  function handleFocus() {
    if (sugestoes.length > 0) setMostrarSugestoes(true)
  }

  return (
    <div className="adm-field adm-local-field">
      <label>Local</label>
      <input
        ref={localNomeRef}
        className="adm-input"
        autoComplete="off"
        defaultValue={form.local_nome ?? ''}
        placeholder={mapsDisponivel ? 'Buscar local no Google Maps…' : 'Nome do local'}
        onChange={handleChangeNome}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />

      {mostrarSugestoes && sugestoes.length > 0 && (
        <div className="adm-autocomplete-list">
          {sugestoes.map(prediction => (
            <button
              key={prediction.place_id}
              type="button"
              className="adm-autocomplete-item"
              onMouseDown={() => handleSelecionarSugestao(prediction)}
            >
              <strong>{prediction.structured_formatting?.main_text || prediction.description}</strong>
              {prediction.structured_formatting?.secondary_text && (
                <span>{prediction.structured_formatting.secondary_text}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <input
        ref={localEnderecoRef}
        className="adm-input"
        style={{ marginTop: 6 }}
        placeholder="Endereço (opcional)"
        defaultValue={form.local_endereco ?? ''}
        onChange={handleChangeEndereco}
      />
      <p className="adm-sub" style={{ marginTop: 4 }}>
        {mapsDisponivel ? 'Autocomplete do Google ativo.' : 'O link do Google Maps sera gerado automaticamente ao salvar.'}
      </p>
      {form.local_maps_url && (
        <a href={form.local_maps_url} target="_blank" rel="noopener noreferrer" className="adm-link" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          ✓ Ver no Maps →
        </a>
      )}
    </div>
  )
}

function FormAgenda({ inicial, onSalvar, onCancelar }) {
  const [form, setForm] = useState(inicial ?? FORM_VAZIO)
  const [imagemFile, setImagemFile] = useState(null)
  const [preview, setPreview] = useState(inicial?.imagem_url ?? null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const localNomeRef = useRef(null)
  const localEnderecoRef = useRef(null)

  function handleImagem(e) {
    const file = e.target.files[0]
    if (!file) return
    setImagemFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titulo || !form.data) { setErro('Título e data são obrigatórios.'); return }

    const formFinal = {
      ...form,
      local_nome: localNomeRef.current?.value?.trim() ?? form.local_nome,
      local_endereco: localEnderecoRef.current?.value?.trim() ?? form.local_endereco,
    }

    setSaving(true)
    const err = await onSalvar(formFinal, imagemFile, inicial?.id ?? null)
    setSaving(false)
    if (err) setErro(err)
    else onCancelar()
  }

  return (
    <div className="adm-chart-card">
      <h3>{inicial ? 'Editar agenda' : 'Nova agenda'}</h3>
      <form className="adm-agenda-form" onSubmit={handleSubmit}>

        <div className="adm-field">
          <label>Título *</label>
          <input className="adm-input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
        </div>

        <div className="adm-agenda-row">
          <div className="adm-field">
            <label>Data *</label>
            <input className="adm-input" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
          </div>
          <div className="adm-field">
            <label>Hora</label>
            <input className="adm-input" type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
          </div>
        </div>

        <LocalInput form={form} setForm={setForm} localNomeRef={localNomeRef} localEnderecoRef={localEnderecoRef} />

        <div className="adm-field">
          <label>Descrição</label>
          <textarea className="adm-input adm-textarea" rows={3} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do evento…" />
        </div>

        <div className="adm-field">
          <label>Imagem</label>
          {preview && <img src={preview} alt="preview" className="adm-agenda-preview" />}
          <input type="file" accept="image/*" onChange={handleImagem} className="adm-file-input" />
        </div>

        <label className="adm-check-label" style={{ marginTop: 4 }}>
          <input type="checkbox" checked={form.publicado} onChange={e => setForm(f => ({ ...f, publicado: e.target.checked }))} />
          Publicar no site
        </label>

        {erro && <p className="adm-error">{erro}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="adm-btn adm-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          <button className="adm-btn adm-btn-outline" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminAgendas() {
  const [search, setSearch] = useState('')
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [removendo, setRemovendo] = useState(null)

  const { agendas, loading, error, togglePublicado, remover, salvar } = useAgendasAdmin({ search })

  async function handleRemover(agenda) {
    if (!confirm(`Remover "${agenda.titulo}"?`)) return
    setRemovendo(agenda.id)
    await remover(agenda.id, agenda.imagem_url)
    setRemovendo(null)
  }

  function formatarData(dataStr) {
    const [ano, mes, dia] = dataStr.split('-')
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (criando) return (
    <FormAgenda
      onSalvar={salvar}
      onCancelar={() => setCriando(false)}
    />
  )

  if (editando) return (
    <FormAgenda
      inicial={editando}
      onSalvar={salvar}
      onCancelar={() => setEditando(null)}
    />
  )

  return (
    <div>
      <div className="adm-section-header">
        <h2 className="adm-section-title">Agendas</h2>
        <button className="adm-btn adm-btn-primary" title="Criar um novo evento de agenda" onClick={() => setCriando(true)}>
          + Nova agenda
        </button>
      </div>
      <p className="adm-section-desc">Eventos que aparecem na seção <em>Agenda da Bancada</em> na página inicial — somente os marcados como <strong>Publicado</strong> e com data nos próximos 7 dias ficam visíveis. Clique no badge de status para publicar ou despublicar rapidamente. Use o Google Maps no campo Local para gerar um link direto para o mapa.</p>

      <div className="adm-filters">
        <input className="adm-input" placeholder="Buscar pelo título…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {error && <p className="adm-error">{error}</p>}

      {!MAPS_KEY && (
        <p className="adm-error" style={{ marginBottom: 12 }}>
          ⚠️ VITE_GOOGLE_MAPS_KEY não configurado — autocomplete de local desativado.
        </p>
      )}

      {loading ? (
        <div className="adm-loading">Carregando…</div>
      ) : agendas.length === 0 ? (
        <div className="adm-empty">Nenhuma agenda criada ainda.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Título</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Local</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {agendas.map(a => (
                <tr key={a.id}>
                  <td>
                    {a.imagem_url
                      ? <img src={a.imagem_url} alt={a.titulo} className="adm-agenda-thumb" />
                      : <span style={{ color: '#6b5a80', fontSize: 12 }}>—</span>}
                  </td>
                  <td>{a.titulo}</td>
                  <td>{formatarData(a.data)}</td>
                  <td>{a.hora ? a.hora.slice(0, 5) : '—'}</td>
                  <td>
                    {a.local_maps_url
                      ? <a href={a.local_maps_url} target="_blank" rel="noopener noreferrer" className="adm-link">{a.local_nome}</a>
                      : (a.local_nome ?? '—')}
                  </td>
                  <td>
                    <button
                      className={`adm-badge adm-badge--${a.publicado ? 'ativo' : 'inativo'}`}
                      style={{ border: 'none', cursor: 'pointer', background: 'inherit' }}
                      onClick={() => togglePublicado(a.id, a.publicado)}
                      title="Clique para alternar"
                    >
                      {a.publicado ? 'Publicado' : 'Rascunho'}
                    </button>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => setEditando(a)}>Editar</button>
                    <button className="adm-btn-danger" onClick={() => handleRemover(a)} disabled={removendo === a.id}>
                      {removendo === a.id ? '…' : '×'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="adm-count">{agendas.length} agenda{agendas.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default AdminAgendas
