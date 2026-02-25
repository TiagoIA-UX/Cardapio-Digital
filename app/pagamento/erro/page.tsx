"use client"

import Link from "next/link"
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react"

const WHATSAPP_NUMBER = "5512996887993"
const WHATSAPP_MESSAGE = encodeURIComponent("Olá! Tive um problema no pagamento do Cardápio Digital. Pode me ajudar?")
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

export default function PagamentoErroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background dark:from-red-950/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de erro */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 mb-4">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pagamento não aprovado
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Não se preocupe, você pode tentar novamente
        </p>

        {/* Card de motivos */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 text-left">
          <h2 className="font-semibold text-foreground mb-4">
            Possíveis motivos:
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Cartão sem limite disponível</li>
            <li>• Dados do cartão incorretos</li>
            <li>• Transação não autorizada pelo banco</li>
            <li>• PIX expirado (válido por 30 minutos)</li>
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90"
          >
            <RefreshCw className="h-5 w-5" />
            Tentar novamente
          </Link>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl border border-border bg-card text-foreground font-semibold transition-all hover:bg-secondary"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com suporte
          </a>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
