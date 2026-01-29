import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Cardápio Digital — Caraguá Digital',
  description: 'Template otimizado para conversão com gatilhos neurais e captura de leads.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon-32.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="container">
          <header className="header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <img src="/assets/logo.svg" alt="Caraguá Digital" className="logo" />
              <div className="brand">Caraguá Digital</div>
            </div>
            <nav>
              <a href="#features">Recursos</a>
              {' '}•{' '}
              <a href="#testimonials">Depoimentos</a>
            </nav>
          </header>

          {children}

          <footer className="footer">© {new Date().getFullYear()} Caraguá Digital • Licença por assinatura</footer>
        </div>
      </body>
    </html>
  )
}
