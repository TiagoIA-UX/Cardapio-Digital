import React, { useState } from 'react'
import HeroSection from '../components/hero-section'
import Features from '../components/templates-grid'
import Testimonials from '../components/testimonials-section'
import CTASection from '../components/cta-section'

export default function Home() {
  return (
    <main>
      <HeroSection />
      <Features />
      <Testimonials />
      <CTASection />
    </main>
  )
}
