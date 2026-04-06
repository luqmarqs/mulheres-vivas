import MapaFeminicidio from './MapaFeminicidio'

const cards = [
  {
    icon: '🚨',
    title: 'Estado de emergência',
    body: 'Exigimos que o poder público declare estado de emergência pública em São Paulo diante do crescimento alarmante do feminicídio e da violência doméstica.',
  },
  {
    icon: '📊',
    title: 'Dados que são vidas',
    body: 'São Paulo registra centenas de feminicídios por ano e os números seguem crescendo. Cada estatística é uma mulher, uma família, uma comunidade destruída.',
  },
  {
    icon: '✊',
    title: 'Bancada Feminista',
    body: 'Somos vereadoras, codeputadas e ativistas eleitas pelo PSOL para colocar as pautas das mulheres no centro da política. Nossa luta é dentro e fora das instituições.',
  },
  {
    icon: '📢',
    title: 'Pressão popular',
    body: 'Cada assinatura é uma voz. Quanto mais pessoas assinarem, maior a pressão sobre o poder público para agir. A indiferença também mata.',
  },
]

function ContentSection() {
  return (
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
            A Bancada Feminista do PSOL lança a campanha <strong>Mulheres Vivas</strong> e
            exige que o governador de São Paulo declare estado de emergência pública.
            Assine o abaixo-assinado e some sua voz a essa luta.
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
  )
}

export default ContentSection
