import { useState } from 'react'

const LS_KEY = 'mulheres_vivas_config'

function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function AdminConfiguracoes() {
  const [config, setConfig] = useState(getConfig)
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    localStorage.setItem(LS_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="adm-config">
      <h2 className="adm-section-title">Configurações</h2>

      <form className="adm-config-form" onSubmit={handleSave}>
        <div className="adm-field">
          <label>Texto padrão de boas-vindas no WhatsApp</label>
          <textarea
            className="adm-input adm-textarea"
            rows={4}
            value={config.whatsappBoasVindas ?? ''}
            onChange={e => setConfig({ ...config, whatsappBoasVindas: e.target.value })}
            placeholder="Ex: Olá! Bem-vinda ao comitê Mulheres Vivas da sua cidade! 💜"
          />
        </div>

        <div className="adm-field">
          <label>Link padrão do WhatsApp da campanha</label>
          <input
            className="adm-input"
            type="url"
            value={config.whatsappLink ?? ''}
            onChange={e => setConfig({ ...config, whatsappLink: e.target.value })}
            placeholder="https://chat.whatsapp.com/..."
          />
        </div>

        <div className="adm-field">
          <label>Email de contato da campanha</label>
          <input
            className="adm-input"
            type="email"
            value={config.emailContato ?? ''}
            onChange={e => setConfig({ ...config, emailContato: e.target.value })}
            placeholder="campanha@bancadafeministapsol.com.br"
          />
        </div>

        <button className="adm-btn adm-btn-primary" type="submit">
          {saved ? '✓ Salvo!' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}

export default AdminConfiguracoes
