import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Caraguá Digital | Sites que Chamam Cliente no WhatsApp',
  description: 'Criamos sites simples e rápidos para negócios locais em Caraguatatuba e Litoral Norte. Seu cliente clica e chama direto no WhatsApp.',
  generator: 'v0.app',
  keywords: ['site caraguatatuba', 'site litoral norte', 'site whatsapp', 'site negócio local', 'web design caraguá'],
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
