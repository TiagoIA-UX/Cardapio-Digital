'use client'

import Link from 'next/link'
import { ChevronDown, Menu, Store, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/templates', label: 'Templates' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '/precos', label: 'Preços' },
] as const

const RECURSOS_LINKS = [
  { href: '/demo', label: 'Ver demonstração', desc: 'Teste o cardápio ao vivo' },
  { href: '/templates', label: 'Modelos prontos', desc: 'Escolha seu template ideal' },
  { href: '/status', label: 'Status da plataforma', desc: 'Uptime e monitoramento' },
] as const

export function HomeHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [recursosOpen, setRecursosOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const hasAffiliateRef = !!searchParams.get('ref')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getSession()
      .then(
        ({
          data: { session },
        }: {
          data: { session: import('@supabase/supabase-js').Session | null }
        }) => {
          setIsLoggedIn(!!session)
        }
      )
  }, [])

  // Scroll spy para seções âncora
  useEffect(() => {
    const sectionIds = ['beneficios', 'como-funciona']
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  return (
    <header className="border-border/80 bg-background/95 sticky top-0 z-50 border-b">
      <div className="container-premium flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="text-foreground block text-sm font-semibold tracking-[0.18em] uppercase">
              Zairyx
            </span>
            <span className="block text-base font-semibold">Canais Digitais</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const anchor = link.href.startsWith('#') ? link.href.slice(1) : null
            const isActive = anchor ? activeSection === anchor : false
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground border-b-2 border-orange-500 pb-0.5'
                    : 'text-foreground/90 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Recursos dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setRecursosOpen(true)}
            onMouseLeave={() => setRecursosOpen(false)}
          >
            <button
              type="button"
              className="text-foreground/90 hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
            >
              Recursos
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${recursosOpen ? 'rotate-180' : ''}`} />
            </button>
            {recursosOpen && (
              <div className="border-border bg-card absolute top-full left-1/2 z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border p-2 shadow-lg">
                {RECURSOS_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:bg-secondary block rounded-lg px-3 py-2.5 transition-colors"
                    onClick={() => setRecursosOpen(false)}
                  >
                    <span className="text-foreground block text-sm font-medium">{item.label}</span>
                    <span className="text-muted-foreground block text-xs">{item.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <Link
              href="/painel"
              className="text-foreground hover:text-foreground inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              Painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-foreground hover:text-foreground inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/templates"
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Ver modelos
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isLoggedIn ? (
            <Link
              href="/painel"
              className="border-border bg-card text-foreground inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Painel
            </Link>
          ) : (
            <Link
              href="/login"
              className="border-border bg-card text-foreground inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/templates"
            className="bg-foreground text-background inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
          >
            Modelos
          </Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-controls="home-mobile-menu"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="border-border bg-card inline-flex h-10 w-10 items-center justify-center rounded-full border"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {hasAffiliateRef && (
        <div className="border-border/80 border-t bg-amber-50/90">
          <div className="container-premium py-3 text-sm text-amber-900">
            {isLoggedIn
              ? 'Este link de afiliado apenas registra a indicação. Você já está logado nesta sessão. Para testar com outra conta, saia primeiro ou use uma janela anônima.'
              : 'Indicação registrada neste navegador. Para continuar o cadastro, clique em Entrar e faça login com a conta que vai usar no software.'}
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div id="home-mobile-menu" className="border-border border-t lg:hidden">
          <div className="container-premium flex flex-col gap-3 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-foreground hover:text-foreground rounded-2xl px-1 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {isLoggedIn ? (
                <Link
                  href="/painel"
                  onClick={closeMenu}
                  className="border-border bg-card text-foreground inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium"
                >
                  Painel
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="border-border bg-card text-foreground inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium"
                >
                  Entrar
                </Link>
              )}
              <Link
                href="/templates"
                onClick={closeMenu}
                className="bg-foreground text-background inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Ver modelos
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
