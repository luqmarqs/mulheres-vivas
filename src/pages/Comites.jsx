import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useComites } from '../hooks/useComites'

function Comites() {
  const [search, setSearch] = useState('')
  const { comites, loading, error } = useComites({ search, apenasAtivos: true })

  return (
    <div className="comites-page">
      <header className="comites-header">
        <Link to="/" className="comites-back">← Voltar</Link>
        <img src="/logo.png" alt="Bancada Feminista do PSOL" className="comites-logo" />
        <h1>Comitês <span>Mulheres Vivas</span></h1>
        <p>Encontre um comitê na sua cidade e some forças ao movimento.</p>

        <div className="comites-search-wrap">
          <input
            className="comites-search"
            placeholder="Buscar por cidade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="container comites-content">
        {error && <p className="comites-error">{error}</p>}

        {loading ? (
          <div className="comites-loading">Carregando comitês…</div>
        ) : comites.length === 0 ? (
          <div className="comites-empty">
            <p>Nenhum comitê encontrado{search ? ` em "${search}"` : ''}.</p>
            <Link to="/#assinar" className="btn btn-primary">Criar um comitê</Link>
          </div>
        ) : (
          <div className="comites-grid">
            {comites.map(c => (
              <div key={c.id} className="comite-card">
                <div className="comite-card-cidade">{c.cidade}{c.estado ? ` — ${c.estado}` : ''}</div>
                <h3 className="comite-card-nome">{c.nome}</h3>
                {c.responsavel_nome && (
                  <p className="comite-card-resp">Coordenação: {c.responsavel_nome}</p>
                )}
                {c.whatsapp_link ? (
                  <a
                    href={c.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp comite-card-btn"
                  >
                    Entrar no comitê
                  </a>
                ) : (
                  <span className="comite-card-sem-link">Link em breve</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="comites-cta">
          <p>Não encontrou sua cidade?</p>
          <Link to="/" className="btn btn-primary">
            Organizar um comitê
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Comites
