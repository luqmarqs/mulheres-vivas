function Hero({ onShare }) {
  return (
    <header className="hero">
      <img src="/capa.webp" alt="Logo Mulheres Vivas" className="hero-logo" />

      <div className="container hero-content">
        <p className="hero-subtitle">
          Assine nosso abaixo-assinado para que seja decretado estado de emergência
          pública devido ao crescimento do feminicídio e da violência doméstica em São Paulo.
        </p>

        <div className="hero-actions">
          <a
            href="#assinar"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('assinar')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Assinar
          </a>

          <button className="btn btn-whatsapp" onClick={onShare}>
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>
    </header>
  )
}

export default Hero
