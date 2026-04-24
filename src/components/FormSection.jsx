import { useState, useRef, useEffect } from 'react'
import { useCidades } from '../hooks/useCidades'
import { insertLead } from '../hooks/useLeads'
import { insertPropostaAgenda } from '../hooks/usePropostas'
import { supabaseConfigurado } from '../lib/supabase'
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR } from '../utils/phone'

const TABS = [
  { id: 'assinar',  label: '✊ Abaixo-assinado' },
  { id: 'convidar', label: '📣 Convidar a Bancada Feminista' },
]

const EMPTY_FORM = {
  nome: '', nascimento: '', telefone: '', email: '',
  cidade: '', uf: '', novidades: true,
  mensagem: '', honeypot: '',
}

function CamposBase({ form, setForm, telefoneErro, setTelefoneErro, emailErro, setEmailErro, ufs, cidadeBusca, setCidadeBusca, cidadesFiltradas, cidadeErro, setCidadeSelecionada, cidadeRef, mostrarSugestoes, setMostrarSugestoes }) {
  const validarEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const [openUF, setOpenUF] = useState(false)

  return (
    <>
      <input
        placeholder="Nome completo"
        value={form.nome}
        onChange={e => setForm({ ...form, nome: e.target.value })}
        required
      />

      <input
        placeholder="WhatsApp (com DDD)"
        value={form.telefone}
        onChange={e => {
          const masked = formatPhoneBR(e.target.value)
          setForm({ ...form, telefone: masked })
          setTelefoneErro(isValidPhoneBR(masked) ? '' : 'Telefone inválido')
        }}
        required
      />
      {telefoneErro && <p className="erro">{telefoneErro}</p>}

      <input
        type="email"
        placeholder="E-mail"
        value={form.email}
        onChange={e => {
          setForm({ ...form, email: e.target.value })
          setEmailErro(e.target.value && !validarEmail(e.target.value) ? 'E-mail inválido' : '')
        }}
      />
      {emailErro && <p className="erro">{emailErro}</p>}

      <div className="custom-select">
        <div className="select-box" onClick={() => setOpenUF(o => !o)}>
          {form.uf || <span style={{ color: '#6b5a80' }}>Estado (UF)</span>}
        </div>
        {openUF && (
          <div className="options">
            {ufs.map(uf => (
              <div key={uf.sigla} onMouseDown={() => { setForm({ ...form, uf: uf.sigla }); setOpenUF(false) }}>
                {uf.nome}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cidade-field" ref={cidadeRef}>
        <input
          placeholder="Município"
          value={cidadeBusca}
          autoComplete="off"
          onClick={e => e.stopPropagation()}
          onChange={e => {
            setCidadeBusca(e.target.value)
            setForm({ ...form, cidade: e.target.value })
            setMostrarSugestoes(true)
          }}
        />
        {mostrarSugestoes && cidadesFiltradas.length > 0 && (
          <div className="cidade-sugestoes" onClick={e => e.stopPropagation()}>
            {cidadesFiltradas.map((cidade, i) => (
              <div
                key={cidade.nome || i}
                className="cidade-item"
                onMouseDown={() => {
                  setForm({ ...form, cidade: cidade.nome })
                  setCidadeBusca(cidade.nome)
                  setCidadeSelecionada(cidade.nome)
                  setMostrarSugestoes(false)
                }}
              >
                {cidade.nome}
              </div>
            ))}
          </div>
        )}
      </div>
      {cidadeErro && <p className="erro">{cidadeErro}</p>}
    </>
  )
}

function FormSucesso({ tab, onReset, onShare }) {
  const msgs = {
    assinar:  { titulo: 'Assinatura registrada!', corpo: 'Obrigada por assinar. Juntas somos mais fortes!' },
    convidar: { titulo: 'Convite enviado!', corpo: 'Recebemos seu pedido. Avaliaremos a agenda e entraremos em contato.' },
  }
  const { titulo, corpo } = msgs[tab]
  return (
    <div className="form-sucesso">
      <div className="form-sucesso-icon">💜</div>
      <h2>{titulo}</h2>
      <p>{corpo}</p>
      <button className="btn btn-primary" onClick={onReset}>Nova resposta</button>
      <button className="btn btn-whatsapp" onClick={onShare}>Compartilhar no WhatsApp</button>
    </div>
  )
}

function FormSection({ onOpenPrivacy, onShare }) {
  const [activeTab, setActiveTab] = useState('assinar')
  const [form, setForm] = useState(EMPTY_FORM)
  const [telefoneErro, setTelefoneErro] = useState('')
  const [emailErro, setEmailErro] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [startedAt, setStartedAt] = useState(Date.now())
  const [submitLocked, setSubmitLocked] = useState(false)

  const { cidadeBusca, setCidadeBusca, cidadesFiltradas, cidadeErro, setCidadeSelecionada, ufs } = useCidades(form.uf)
  const cidadeRef = useRef(null)
  const lastSubmitTimeRef = useRef(0)
  const hasInteractedRef = useRef(false)

  useEffect(() => {
    const handler = e => { if (cidadeRef.current && !cidadeRef.current.contains(e.target)) setMostrarSugestoes(false) }
    document.addEventListener('mousedown', handler)
    
    const interactionHandler = () => { hasInteractedRef.current = true }
    window.addEventListener('mousemove', interactionHandler, { once: true })
    window.addEventListener('keydown', interactionHandler, { once: true })
    window.addEventListener('touchstart', interactionHandler, { once: true })
    window.addEventListener('click', interactionHandler, { once: true })

    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('mousemove', interactionHandler)
      window.removeEventListener('keydown', interactionHandler)
      window.removeEventListener('touchstart', interactionHandler)
      window.removeEventListener('click', interactionHandler)
    }
  }, [])

  useEffect(() => {
    setStartedAt(Date.now())
  }, [activeTab])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setForm(EMPTY_FORM)
    setCidadeBusca('')
    setTelefoneErro('')
    setEmailErro('')
    setErro('')
    setSucesso(false)
  }

  const validarTelefone = (t) => isValidPhoneBR(t)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (form.honeypot) {
      return
    }

    if (!hasInteractedRef.current) {
      setErro('Comportamento suspeito detectado. Por favor, interaja com a página e tente novamente.')
      return
    }

    const sessionKey = 'form_submissions_count'
    const submissionsCount = parseInt(sessionStorage.getItem(sessionKey) || '0', 10)
    if (submissionsCount >= 5) {
      setErro('Limite de envios atingido para esta sessão. Tente novamente mais tarde.')
      return
    }

    if (submitLocked) {
      setErro('Aguarde antes de enviar novamente.')
      return
    }

    const now = Date.now()
    const minDelay = 2500
    const recentSubmitLimit = 3000

    if (now - startedAt < minDelay) {
      setErro('Aguarde alguns segundos antes de enviar o formulário.')
      return
    }

    if (now - lastSubmitTimeRef.current < recentSubmitLimit) {
      setErro('Aguarde um pouco antes de reenviar.')
      return
    }

    lastSubmitTimeRef.current = now
    setSubmitLocked(true)
    setLoading(true)
    sessionStorage.setItem('form_submissions_count', submissionsCount + 1)

    if (!supabaseConfigurado) { setLoading(false); setSucesso(true); window.setTimeout(() => setSubmitLocked(false), 6000); return }

    let result
    if (activeTab === 'convidar') {
      result = await insertPropostaAgenda(form)
    } else {
      result = await insertLead({
        nome: form.nome,
        telefone: normalizePhoneBR(form.telefone),
        email: form.email || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        nascimento: form.nascimento || null,
        intencao: 'participar',
        novidades: form.novidades,
      })
    }

    setLoading(false)
    if (result.error) { setErro(result.error); return }
    setSucesso(true)
  }

  const camposBase = (
    <CamposBase
      form={form} setForm={setForm}
      telefoneErro={telefoneErro} setTelefoneErro={setTelefoneErro}
      emailErro={emailErro} setEmailErro={setEmailErro}
      ufs={ufs}
      cidadeBusca={cidadeBusca} setCidadeBusca={setCidadeBusca}
      cidadesFiltradas={cidadesFiltradas} cidadeErro={cidadeErro}
      setCidadeSelecionada={setCidadeSelecionada}
      cidadeRef={cidadeRef}
      mostrarSugestoes={mostrarSugestoes} setMostrarSugestoes={setMostrarSugestoes}
    />
  )

  return (
    <section id="assinar" className="form-section">
      <div className="container">
        <div className="form-section-header">
          <span className="content-tag">Participe</span>
          <h2>Como você quer se envolver?</h2>
        </div>

        <div className="form-card">
          {/* SELETOR */}
          <div className="form-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                className={`form-tab ${activeTab === t.id ? 'form-tab--active' : ''}`}
                onClick={() => handleTabChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {sucesso ? (
            <FormSucesso tab={activeTab} onReset={() => { setSucesso(false); setForm(EMPTY_FORM); setCidadeBusca('') }} onShare={onShare} />
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  autoComplete="off"
                  tabIndex="-1"
                  value={form.honeypot}
                  onChange={e => setForm({ ...form, honeypot: e.target.value })}
                />
              </div>
              {activeTab === 'assinar' && (
                <>
                  {camposBase}
                  <label className="newsletter">
                    <input type="checkbox" checked={form.novidades} onChange={e => setForm({ ...form, novidades: e.target.checked })} />
                    Aceito receber novidades da Bancada Feminista
                  </label>
                </>
              )}

              {activeTab === 'convidar' && (
                <>
                  {camposBase}
                  <textarea
                    className="form-textarea"
                    placeholder="Conte um pouco sobre o evento ou espaço que você quer que a Bancada Feminista visite…"
                    rows={4}
                    value={form.mensagem}
                    onChange={e => setForm({ ...form, mensagem: e.target.value })}
                  />
                  <label className="newsletter">
                    <input type="checkbox" checked={form.novidades} onChange={e => setForm({ ...form, novidades: e.target.checked })} />
                    Aceito receber novidades da Bancada Feminista
                  </label>
                </>
              )}

              {erro && <p className="erro">{erro}</p>}

              <div className="form-footer">
                <p className="privacy-text">
                  Ao enviar, você concorda com nossa{' '}
                  <a href="#" onClick={e => { e.preventDefault(); onOpenPrivacy() }}>política de privacidade</a>.
                </p>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Enviando…' : activeTab === 'assinar' ? 'ASSINAR' : 'ENVIAR CONVITE'}
              </button>
              <button type="button" onClick={onShare}>Compartilhar no WhatsApp</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default FormSection
