import { Suspense } from 'react'
import { HomeHeader } from '@/components/home-header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/home/HeroSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'
import { ProductSection } from '@/components/home/ProductSection'
import { TemplatesSection } from '@/components/home/TemplatesSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { CTASection } from '@/components/home/CTASection'
import SecaoConversao from '@/components/sections/SecaoConversao'

export default function Home() {
  return (
    <>
      <main className="bg-background text-foreground min-h-screen">
        <Suspense fallback={null}>
          <HomeHeader />
        </Suspense>

        <HeroSection />
        <BenefitsSection />
        <ProductSection />
        <TemplatesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecaoConversao />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
