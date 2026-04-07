import { useAgendasSemana } from '../hooks/useAgendas'
import { formatarData } from '../utils/date'

function toCalendarStamp(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const sec = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}T${hh}${min}${sec}`
}

function montarDatasEvento(agenda) {
  const [ano, mes, dia] = agenda.data.split('-').map(Number)
  const [hora, minuto] = (agenda.hora || '19:00').split(':').map(Number)

  const inicio = new Date(ano, mes - 1, dia, hora || 0, minuto || 0, 0)
  const fim = new Date(inicio.getTime() + 2 * 60 * 60 * 1000)

  return { inicio, fim }
}

function buildGoogleCalendarUrl(agenda) {
  const { inicio, fim } = montarDatasEvento(agenda)
  const texto = agenda.titulo
  const detalhes = [
    agenda.descricao,
    agenda.local_maps_url ? `Mapa: ${agenda.local_maps_url}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')
  const local = [agenda.local_nome, agenda.local_endereco].filter(Boolean).join(' - ')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: texto,
    dates: `${toCalendarStamp(inicio)}/${toCalendarStamp(fim)}`,
    details: detalhes,
    location: local,
    ctz: 'America/Sao_Paulo',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildWhatsAppConvite(agenda) {
  const dataExtenso = formatarData(agenda.data)
  const hora = agenda.hora ? ` as ${agenda.hora.slice(0, 5)}` : ''
  const local = [agenda.local_nome, agenda.local_endereco].filter(Boolean).join(' - ')

  const mensagem = [
    `Oi! Te convido para o evento "${agenda.titulo}".`,
    `Vai ser ${dataExtenso}${hora}.`,
    local ? `Local: ${local}.` : null,
    agenda.local_maps_url ? `Mapa: ${agenda.local_maps_url}` : null,
    'Vamos juntas nessa mobilizacao!',
  ]
    .filter(Boolean)
    .join('\n')

  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`
}

function AgendaCard({ agenda }) {
  const calendarUrl = buildGoogleCalendarUrl(agenda)
  const whatsappUrl = buildWhatsAppConvite(agenda)

  return (
    <div className="agenda-card">
      {agenda.imagem_url && (
        <div className="agenda-card-img">
          <img src={agenda.imagem_url} alt={agenda.titulo} />
        </div>
      )}
      <div className="agenda-card-body">
        <div className="agenda-card-meta">
          <span className="agenda-card-data">
            📅 {formatarData(agenda.data)}
          </span>
          {agenda.hora && (
            <span className="agenda-card-hora">🕐 {agenda.hora.slice(0, 5)}</span>
          )}
        </div>

        <h3 className="agenda-card-titulo">{agenda.titulo}</h3>

        {agenda.descricao && (
          <p className="agenda-card-desc">{agenda.descricao}</p>
        )}

        {agenda.local_nome && (
          <div className="agenda-card-local">
            {agenda.local_maps_url ? (
              <a
                href={agenda.local_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="agenda-card-local-link"
              >
                📍 {agenda.local_nome}
                {agenda.local_endereco && ` — ${agenda.local_endereco}`}
              </a>
            ) : (
              <span>📍 {agenda.local_nome}{agenda.local_endereco && ` — ${agenda.local_endereco}`}</span>
            )}
          </div>
        )}

        <div className="agenda-card-actions">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="agenda-card-action agenda-card-action-calendar"
          >
            Adicionar na minha agenda
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="agenda-card-action agenda-card-action-whatsapp"
          >
            Compartilhar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

function AgendasSection() {
  const { agendas, loading } = useAgendasSemana()

  if (loading || agendas.length === 0) return null

  return (
    <section className="agendas-section">
      <div className="container">
        <div className="content-header">
          <span className="content-tag">Esta semana</span>
          <h2>Agenda <span>da Bancada</span></h2>
          <p className="agendas-mobile-hint" aria-hidden="true">Deslize para ver mais →</p>
        </div>

        <div className="agendas-grid">
          {agendas.map(a => (
            <AgendaCard key={a.id} agenda={a} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default AgendasSection
