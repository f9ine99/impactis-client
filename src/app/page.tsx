import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Hero from '@/components/sections/Hero'
import SocialProof from '@/components/sections/SocialProof'
import Features from '@/components/sections/Features'
import HowItWorks from '@/components/sections/HowItWorks'
import Roles from '@/components/sections/Roles'
import PricingSection from '@/components/sections/PricingSection'
import FAQSection from '@/components/sections/FAQSection'
import CTASection from '@/components/sections/CTASection'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Roles />
      <PricingSection />
      <SocialProof />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
