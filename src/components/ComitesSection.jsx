import { Link } from 'react-router-dom'
import { useComites } from '../hooks/useComites'

function ComitesSection() {
  const { comites, loading } = useComites({ apenasAtivos: true })

  const preview = comites.slice(0, 3)

  return (
    <section className="comites-section">
      <div className="container">
        <div className="content-header">
          <span className="content-tag">Mobilização</span>
          <h2>Comitês <span>Mulheres Vivas</span></h2>
          <p className="comites-section-sub">
            A campanha se organiza em comitês locais por todo o estado.
            Encontre o da sua cidade ou crie um novo.
          </p>
        </div>

        <div className="comites-section-grid">
          {loading ? (
            <p className="comites-section-empty">Carregando comitês…</p>
          ) : preview.length === 0 ? (
            <p className="comites-section-empty">Nenhum comitê ativo ainda. Seja a primeira!</p>
          ) : (
            preview.map(c => (
              <div key={c.id} className="comites-section-card">
                <div className="comites-section-card-cidade">{c.cidade}{c.estado ? ` — ${c.estado}` : ''}</div>
                <div className="comites-section-card-nome">{c.nome}</div>
                {c.whatsapp_link ? (
                  <a
                    href={c.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="comites-section-card-link"
                  >
                    Entrar no comitê →
                  </a>
                ) : (
                  <span className="comites-section-card-em-breve">Link em breve</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="comites-section-actions">
          <Link to="/comites" className="btn btn-primary">
            Ver todos os comitês
          </Link>
          <a
            href="#assinar"
            className="btn btn-outline-purple"
            onClick={e => {
              e.preventDefault()
              document.getElementById('assinar')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Quero organizar um comitê
          </a>
        </div>
      </div>
    </section>
  )
}

export default ComitesSection
