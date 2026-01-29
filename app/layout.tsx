import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Cardápio Digital — Caraguá Digital',
  description: 'Template otimizado para conversão com gatilhos neurais e captura de leads.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="container">
          <header className="header">
            <div className="brand">Caraguá Digital</div>
            <nav>
              <a href="#features">Recursos</a>
              {' '}•{' '}
              <a href="#testimonials">Depoimentos</a>
            </nav>
          </header>

          {children}

          <footer className="footer">© {new Date().getFullYear()} Caraguá Digital • Licença MIT</footer>
        </div>
      </body>
    </html>
  )
}
