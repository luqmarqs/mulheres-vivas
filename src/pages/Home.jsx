import { useState } from 'react'
import Hero from '../components/Hero'
import ContentSection from '../components/ContentSection'
import FormSection from '../components/FormSection'
import Footer from '../components/Footer'
import PrivacyModal from '../components/modal/PrivacyModal'

function Home() {
  const [showPrivacy, setShowPrivacy] = useState(false)

  const shareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(
      'Junte-se ao movimento Mulheres Vivas! Assine e faça parte dessa luta!'
    )
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank')
  }

  return (
    <div>
      <Hero onShare={shareWhatsApp} />

      <ContentSection />

      <FormSection
        onOpenPrivacy={() => setShowPrivacy(true)}
        onShare={shareWhatsApp}
      />

      {showPrivacy && (
        <PrivacyModal onClose={() => setShowPrivacy(false)} />
      )}

      <Footer onOpenPrivacy={() => setShowPrivacy(true)} />
    </div>
  )
}

export default Home
