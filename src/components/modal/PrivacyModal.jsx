import { useEffect } from 'react'

function PrivacyModal({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Política de Privacidade</h2>

        <p>
          A campanha <strong>Mulheres Vivas</strong> é uma iniciativa da <strong>Bancada Feminista do PSOL</strong> para
          exigir a declaração de estado de emergência pública em São Paulo diante do
          crescimento do feminicídio e da violência doméstica.
        </p>

        <p>
          <strong>Responsável pelo tratamento dos dados:</strong> Bancada Feminista do PSOL —
          mandatos coletivos de vereadoras e codeputadas estaduais comprometidos com os
          direitos das mulheres.
        </p>

        <p>
          <strong>Dados coletados:</strong> nome completo, data de nascimento, número de
          WhatsApp, e-mail, cidade e estado. A marcação de interesse em receber novidades
          é opcional.
        </p>

        <p>
          <strong>Finalidade:</strong> os dados são usados exclusivamente para registrar sua
          assinatura, contabilizar o apoio à campanha, enviar atualizações sobre a pauta
          (caso autorizado) e embasar demandas ao poder público com dados de mobilização popular.
        </p>

        <p>
          <strong>Compartilhamento:</strong> as informações não serão vendidas nem
          compartilhadas com terceiros para fins comerciais. Poderão ser utilizadas pela
          Bancada Feminista do PSOL e por pessoas candidatas ou mandatos vinculados ao
          movimento para comunicação política, mobilização e ações relacionadas à pauta
          dos direitos das mulheres.
        </p>

        <p>
          <strong>Segurança:</strong> os dados são armazenados em formulário protegido e
          acessados apenas pelas equipes da Bancada Feminista responsáveis pela campanha.
        </p>

        <p>
          <strong>Seus direitos (LGPD — Lei nº 13.709/2018):</strong> você pode, a qualquer
          momento, solicitar acesso, correção ou exclusão dos seus dados entrando em contato
          pelo Instagram{' '}
          <a
            href="https://www.instagram.com/bancadafeministapsol/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @bancadafeministapsol
          </a>.
        </p>

        <p>
          Ao assinar, você declara estar de acordo com estes termos e confirma que as
          informações fornecidas são verdadeiras.
        </p>
      </div>
    </div>
  )
}

export default PrivacyModal
