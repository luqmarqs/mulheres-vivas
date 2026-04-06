import { FaInstagram } from 'react-icons/fa'

function Footer({ onOpenPrivacy }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <img src="/logo.png" alt="Bancada Feminista do PSOL" className="footer-logo" />

        <p className="footer-tagline">
          Um movimento pela vida, pela dignidade e pelos direitos das mulheres brasileiras.
        </p>

        <div className="footer-socials">
          <a
            href="https://www.instagram.com/bancadafeministapsol/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            <FaInstagram size={18} />
            @bancadafeministapsol
          </a>
        </div>

        <div className="footer-divider" />

        <div className="footer-links">
          <a onClick={onOpenPrivacy}>Política de Privacidade</a>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} Mulheres Vivas — Todos os direitos reservados
        </p>
      </div>
    </footer>
  )
}

export default Footer
