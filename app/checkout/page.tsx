"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Store, ShoppingBag } from "lucide-react"

/**
 * PÁGINA DEPRECADA
 * 
 * Esta página de checkout de restaurante foi desativada.
 * O sistema agora usa um modelo diferente:
 * - A jornada pública oficial começa em /templates ou /ofertas
 * - O checkout oficial de compra acontece em /comprar/[template]
 * 
 * Esta página existe apenas para evitar erros 404 e loops de redirect.
 */
export default function CheckoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect após 5 segundos
    const timer = setTimeout(() => {
      router.push('/templates')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <Store className="h-8 w-8 text-orange-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Página Atualizada
        </h1>
        
        <p className="text-gray-600 mb-6">
          O checkout antigo foi removido. Agora a jornada pública oficial começa pela escolha do
          template e segue para a compra por template.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/templates"
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Escolher template
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/ofertas"
            className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Ver ofertas
          </Link>
        </div>
        
        <p className="text-sm text-gray-400 mt-6">
          Redirecionando em 5 segundos...
        </p>
      </div>
    </div>
  )
}
