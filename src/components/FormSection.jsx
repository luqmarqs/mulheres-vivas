import { useState, useRef, useEffect } from 'react'
import { useCidades } from '../hooks/useCidades'

function FormSection({ onOpenPrivacy, onShare }) {
  const [form, setForm] = useState({
    nome: '',
    nascimento: '',
    whatsapp: '',
    email: '',
    cidade: '',
    uf: '',
    novidades: true,
  })

  const [telefoneErro, setTelefoneErro] = useState('')
  const [emailErro, setEmailErro] = useState('')
  const [openUF, setOpenUF] = useState(false)
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  const {
    cidadeBusca,
    setCidadeBusca,
    cidadesFiltradas,
    cidadeErro,
    setCidadeSelecionada,
    ufs,
  } = useCidades(form.uf)

  const cidadeRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cidadeRef.current && !cidadeRef.current.contains(event.target)) {
        setMostrarSugestoes(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // -------- FORMAT --------
  const formatPhone = (value) => {
    value = value.replace(/\D/g, '').slice(0, 11)

    if (value.length <= 2) return value
    if (value.length <= 6) return `(${value.slice(0, 2)}) ${value.slice(2)}`
    if (value.length <= 10)
      return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`

    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
  }

  const validarTelefoneBR = (telefone) => {
    const numero = telefone.replace(/\D/g, '')
    return numero.length === 10 || numero.length === 11
  }

  const validarEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // -------- SUBMIT --------
  const handleSubmit = async (e) => {
    e.preventDefault()

    const telefoneLimpo = form.whatsapp.replace(/\D/g, '')

    const formData = new URLSearchParams()

    formData.append('entry.516963060', form.nome)
    formData.append('entry.158333150', form.email)
    formData.append('entry.1217429993', telefoneLimpo)
    formData.append('entry.354346249', form.uf)
    formData.append('entry.2106457480', form.cidade)
    formData.append('entry.1930059923', form.nascimento)
    formData.append('entry.2081854144', form.novidades ? 'Sim' : 'Não')

    await fetch(
      'https://docs.google.com/forms/d/e/1FAIpQLSdk_dABKsKyq7nPdmDkc_zo_9YEr-C7FvZCLIosWgnDqSBotA/formResponse',
      {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      }
    )

    alert('Assinatura realizada com sucesso!')

    setForm({
      nome: '',
      nascimento: '',
      whatsapp: '',
      email: '',
      cidade: '',
      uf: '',
      novidades: true,
    })
  }

  return (
    <section id="assinar" className="form-section">
      <div className="container">
        <div className="form-section-header">
          <span className="content-tag">Participe</span>
          <h2>Junte-se a esse movimento</h2>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />

            <div className="input-group">
              <label className="label-with-icon">📅 Data de nascimento</label>
              <input
                type="date"
                value={form.nascimento}
                onChange={(e) => setForm({ ...form, nascimento: e.target.value })}
                required
              />
            </div>

            <input
              placeholder="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => {
                const masked = formatPhone(e.target.value)
                setForm({ ...form, whatsapp: masked })

                if (!validarTelefoneBR(masked)) {
                  setTelefoneErro('Telefone inválido')
                } else {
                  setTelefoneErro('')
                }
              }}
              required
            />

            {telefoneErro && <p className="erro">{telefoneErro}</p>}

            <input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => {
                const value = e.target.value
                setForm({ ...form, email: value })

                if (!validarEmail(value)) {
                  setEmailErro('E-mail inválido')
                } else {
                  setEmailErro('')
                }
              }}
              required
            />

            {emailErro && <p className="erro">{emailErro}</p>}

            {/* UF CUSTOM */}
            <div className="custom-select">
              <div className="select-box" onClick={() => setOpenUF(!openUF)}>
                {form.uf || <span style={{ color: '#6b5a80' }}>UF</span>}
              </div>

              {openUF && (
                <div className="options">
                  {ufs.map((uf) => (
                    <div
                      key={uf.sigla}
                      onMouseDown={() => {
                        setForm({ ...form, uf: uf.sigla })
                        setOpenUF(false)
                      }}
                    >
                      {uf.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CIDADE */}
            <div className="cidade-field" ref={cidadeRef}>
              <input
                placeholder="Selecione um município"
                value={cidadeBusca}
                autoComplete="off"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const value = e.target.value
                  setCidadeBusca(value)
                  setForm({ ...form, cidade: value })
                  setMostrarSugestoes(true)
                }}
                required
              />

              {mostrarSugestoes && cidadesFiltradas.length > 0 && (
                <div className="cidade-sugestoes" onClick={(e) => e.stopPropagation()}>
                  {cidadesFiltradas.map((cidade, index) => (
                    <div
                      key={cidade.nome || index}
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

            <label className="newsletter">
              <input
                type="checkbox"
                checked={form.novidades}
                onChange={(e) => setForm({ ...form, novidades: e.target.checked })}
              />
              Aceito receber novidades do movimento Mulheres Vivas
            </label>

            <div className="form-footer">
              <p className="privacy-text">
                Ao enviar o formulário, você confirma que está de acordo com nossa{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onOpenPrivacy()
                  }}
                >
                  política de privacidade
                </a>
              </p>
            </div>

            <button type="submit">ASSINAR</button>

            <button type="button" onClick={onShare}>
              Compartilhar no WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default FormSection
