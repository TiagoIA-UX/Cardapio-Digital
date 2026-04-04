"use client"

import { ExternalLink, Globe, MapPin } from "lucide-react"
import { DEMO_ADDRESS } from "@/lib/template-demo"

export function DemoLocation() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-6">
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xl ring-1 ring-black/5">
        {/* Cabeçalho */}
        <div className="bg-muted/40 flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary h-4 w-4" />
            <span className="text-foreground text-sm font-semibold">Localização</span>
          </div>
          <a
            href={DEMO_ADDRESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir no Maps
          </a>
        </div>

        {/* Card animado */}
        <a
          href={DEMO_ADDRESS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-48 w-full flex-col items-center justify-center gap-3 overflow-hidden transition-all hover:brightness-95"
          aria-label="Ver localização no Google Maps"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #e8f4ea 0%, #d4ecd4 20%, #c8e6c9 35%, #b2dfdb 55%, #a5d6d9 70%, #90caf9 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(#4a9e60 1px, transparent 1px), linear-gradient(90deg, #4a9e60 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 right-0 left-0 h-0.5 bg-white/60" />
            <div className="absolute top-2/3 right-0 left-0 h-px bg-white/40" />
            <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white/60" />
            <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/40" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/60">
                <Globe className="h-7 w-7 text-blue-600" />
              </div>
            </div>
            <div className="-mt-4 translate-x-5 -translate-y-2">
              <MapPin className="h-5 w-5 fill-red-500 text-red-600 drop-shadow" />
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md transition-shadow group-hover:shadow-lg">
              <ExternalLink className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">
                Ver localização no Google Maps
              </span>
            </div>
            <p className="text-xs font-medium text-gray-600 drop-shadow-sm">
              Clique para abrir no mapa
            </p>
          </div>
        </a>

        {/* Rodapé */}
        <div className="border-border bg-card/80 flex items-center gap-2 border-t px-4 py-3 backdrop-blur-sm">
          <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
          <p className="text-muted-foreground text-sm">{DEMO_ADDRESS.full}</p>
        </div>
      </div>
    </section>
  )
}
