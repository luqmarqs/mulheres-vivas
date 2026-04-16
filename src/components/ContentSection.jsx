import MapaFeminicidio from './MapaFeminicidio'
import AgendasSection from './AgendasSection'

const cards = [
  {
    icon: '✍️',
    title: 'Assine o abaixo-assinado',
    body: 'Exigimos que o governador declare estado de emergência pública diante do crescimento alarmante do feminicídio em São Paulo. Cada assinatura é uma voz que não pode ser ignorada.',
  },
  {
    icon: '🚌',
    title: 'Jornada contra o feminicídio',
    body: 'A Bancada Feminista do PSOL percorre o estado de São Paulo em uma caravana de mobilização. De cidade em cidade, construímos atividades, rodas de conversa e atos públicos para enfrentar a violência contra a mulher onde ela acontece.',
  },
  {
    icon: '📣',
    title: 'Convide a Bancada',
    body: 'Quer receber a Bancada Feminista no seu evento, escola ou comunidade? Faça o convite e nossa equipe avalia a agenda.',
  },
]

function ContentSection() {
  return (
    <>
    <section className="content-section">
      <div className="container">
        <div className="content-header">
          <span className="content-tag">A Campanha</span>
          <h2>
            Por que <span>Mulheres Vivas</span>?
          </h2>
        </div>

        <div className="content-text-block">
          <p>
            O feminicídio e a violência doméstica seguem crescendo em São Paulo. Mulheres
            são assassinadas todos os dias por simplesmente serem mulheres. Esse cenário
            não é inevitável — é resultado de omissão e descaso do poder público.
          </p>
          <p>
            A <strong>Bancada Feminista do PSOL</strong> — covereadoras, codeputadas e
            ativistas eleitas para colocar as pautas das mulheres no centro da política —
            lança a campanha <strong>Mulheres Vivas</strong>: um movimento de pressão
            popular com abaixo-assinado, presença direta nas comunidades e uma caravana
            que percorre o estado exigindo respostas concretas do poder público.
          </p>
          <p>
            A <strong>Jornada contra o Feminicídio</strong> leva a Bancada Feminista de
            cidade em cidade pelo interior e pela Grande São Paulo. Em cada parada,
            construímos atividades de mobilização, rodas de conversa com mulheres locais
            e atos públicos de denúncia — porque enfrentar a violência contra a mulher
            exige presença onde ela acontece. Assine, participe e convide — cada ação conta.
          </p>
        </div>

        <div className="content-grid">
          {cards.map((card) => (
            <div className="content-card" key={card.title}>
              <div className="content-card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mc-section-header">
          <span className="content-tag">Dados reais · SP 2026</span>
          <h3>A realidade em números</h3>
          <p>
            Registros oficiais de feminicídio no estado de São Paulo em 2026.
            Clique em um município para ver os casos detalhados.
          </p>
        </div>

        <MapaFeminicidio />
      </div>
    </section>

    <AgendasSection />
    </>
  )
}

export default ContentSection
