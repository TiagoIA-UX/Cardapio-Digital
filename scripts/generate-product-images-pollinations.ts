#!/usr/bin/env tsx
/**
 * generate-product-images-pollinations.ts
 *
 * Gera URLs de imagem via Pollinations.ai (GRATUITO, sem API key) para cada
 * produto sem imagem, e atualiza imediatamente o campo imagem_url no Supabase.
 *
 * Diferença vs. DALL-E:
 *   - GRATUITO — sem custo por imagem
 *   - Sem download local — URL dinâmica (imagem gerada sob demanda pelo Pollinations)
 *   - Mais rápido — sem throttle, processa lotes em paralelo
 *   - Qualidade inferior ao DALL-E 3, porém excelente para catálogos
 *
 * Uso:
 *   npx tsx scripts/generate-product-images-pollinations.ts
 *   npx tsx scripts/generate-product-images-pollinations.ts --dry-run
 *   npx tsx scripts/generate-product-images-pollinations.ts --tenant=<uuid>
 *   npx tsx scripts/generate-product-images-pollinations.ts --limit=20
 *   npx tsx scripts/generate-product-images-pollinations.ts --concurrency=5
 *   npx tsx scripts/generate-product-images-pollinations.ts --force   # sobrescreve existentes
 *
 * Requer (em .env.local ou .env.production):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────
// Env loader
// ─────────────────────────────────────────────────────────────────
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    const raw = line.slice(sep + 1).trim()
    const value = raw
      .replace(/^["']|["']$/g, '')
      .replace(/\\r\\n$/g, '')
      .replace(/\\n$/g, '')
      .replace(/\r$/, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function ensureEnv() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env.production'))
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente ausentes:', missing.join(', '))
    console.error('   Configure em .env.local — veja docs/GERAR_IMAGENS_PRODUTOS.md')
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────────
// Arg parsing
// ─────────────────────────────────────────────────────────────────
function getFlag(name: string) {
  return process.argv.includes(`--${name}`)
}
function getArgValue(name: string): string | undefined {
  const withEq = process.argv.find((v) => v.startsWith(`--${name}=`))
  if (withEq) return withEq.split('=').slice(1).join('=')
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0) return process.argv[idx + 1]
  return undefined
}

// ─────────────────────────────────────────────────────────────────
// Prompt builder (same hybrid strategy as generate-images-pollinations.js)
// ─────────────────────────────────────────────────────────────────
const FOOD_BASE =
  'restaurant menu photography, appetizing, realistic plating, commercial food styling, high resolution, no text, no watermark, no people'

const PACKSHOT_BASE =
  'isolated product packshot, centered composition, clean white studio background, soft shadow, realistic packaging, e-commerce photography, commercial lighting, high resolution, no text overlay, no watermark, no people'

// Brand-name terms → always packshot (real product exists, don't invent food visuals)
const BRAND_TERMS = [
  /coca[\s-]?cola/,
  /guarana\s*ant/,
  /\bbrahma\b/,
  /heineken/,
  /budweiser/,
  /stella\s*artois/,
  /corona\s*(extra|cero)?/,
  /spaten/,
  /eisenbahn/,
  /red\s*bull/,
  /monster\s*energy/,
  /\btnt\s*(energy)?/,
  /del\s*valle/,
  /kero\s*coco/,
  /fuze\s*tea/,
  /\bninho\b/,
  /parmalat/,
  /danone/,
  /tirolez/,
  /catupiry/,
  /smirnoff/,
  /jack\s*daniel/,
  /johnnie\s*walker/,
  /absolut/,
  /bacardi/,
  /\boreo\b/,
  /bauducco/,
  /\blays\b/,
  /doritos/,
  /cheetos/,
  /lacta/,
  /royal\s*canin/,
  /pedigree/,
]

// Category patterns that imply packaged goods
const PACKAGED_CAT = [
  /bebidas?/,
  /refrigerantes?/,
  /energeticos?/,
  /mercearia/,
  /higiene/,
  /limpeza/,
  /congelados?/,
  /biscoitos?/,
  /snacks?/,
  /racao/,
]

// Category patterns that imply prepared food
const PREPARED_CAT = [
  /pratos?/,
  /porcoes?/,
  /pizzas?/,
  /hamburgueres?/,
  /hot\s*dogs?/,
  /sobremesas?/,
  /cafes?/,
  /salgados?/,
  /sanduiches?/,
  /doces?/,
  /acai/,
  /petiscos?/,
  /entradas?/,
  /massas?/,
  /grelhados?/,
]

function normLower(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasTerm(text: string, patterns: RegExp[]) {
  return patterns.some((p) => p.test(text))
}

type PromptMeta = {
  prompt: string
  strategy: 'packshot' | 'food'
  reason: string
}

function buildPollinationsPrompt(
  nome: string,
  tipo: string,
  categoriaNome: string | null,
): PromptMeta {
  const nL = normLower(nome)
  const cL = normLower(categoriaNome ?? '')
  const tipoL = normLower(tipo)

  // Branded packaged products → packshot
  if (hasTerm(nL, BRAND_TERMS)) {
    return {
      prompt: `${nome}, exact product matching the Brazilian item name, packaged consumer good, ${PACKSHOT_BASE}`,
      strategy: 'packshot',
      reason: 'brand detected',
    }
  }

  // Packaged category → packshot
  if (hasTerm(cL, PACKAGED_CAT)) {
    return {
      prompt: `${nome}, exact product matching the Brazilian item name, packaged consumer good, ${PACKSHOT_BASE}`,
      strategy: 'packshot',
      reason: 'packaged category',
    }
  }

  // Drinks (type)
  if (tipoL === 'bebida') {
    return {
      prompt: `${nome}, refreshing ${nome.toLowerCase()} drink, condensation effect, styled glass or bottle, bar or cafe counter, ${FOOD_BASE}`,
      strategy: 'food',
      reason: 'type=bebida',
    }
  }

  // Dessert (type)
  if (tipoL === 'sobremesa') {
    return {
      prompt: `${nome}, plated dessert matching the product exactly, elegant garnish, soft natural light, side angle, ${FOOD_BASE}`,
      strategy: 'food',
      reason: 'type=sobremesa',
    }
  }

  // Pizza (type)
  if (tipoL === 'pizza') {
    return {
      prompt: `${nome}, whole artisan pizza matching this flavor name, golden crust, melted cheese, overhead food photography, rustic wooden table, ${FOOD_BASE}`,
      strategy: 'food',
      reason: 'type=pizza',
    }
  }

  // Prepared food category → food photography
  if (hasTerm(cL, PREPARED_CAT)) {
    return {
      prompt: `${nome}, professional food photography of this Brazilian restaurant dish, appetizing plating, natural lighting, top-down or 45-degree angle, white plate, ${FOOD_BASE}`,
      strategy: 'food',
      reason: 'prepared category',
    }
  }

  // Generic fallback → food photography
  return {
    prompt: `${nome}, professional commercial food photography, restaurant menu style, Brazilian cuisine, appetizing, white or neutral background, overhead or 45-degree angle, ${FOOD_BASE}`,
    strategy: 'food',
    reason: 'generic fallback',
  }
}

// ─────────────────────────────────────────────────────────────────
// Pollinations URL config
// ─────────────────────────────────────────────────────────────────
const POLLINATIONS_WIDTH = 800
const POLLINATIONS_HEIGHT = 800
const POLLINATIONS_MODEL = 'flux'

function buildPollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt)
  return (
    `https://image.pollinations.ai/prompt/${encoded}` +
    `?width=${POLLINATIONS_WIDTH}&height=${POLLINATIONS_HEIGHT}&seed=${seed}` +
    `&nologo=true&model=${POLLINATIONS_MODEL}&enhance=true&safe=true`
  )
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function extractCategoryName(categories: unknown): string | null {
  if (!categories) return null
  if (Array.isArray(categories)) {
    const first = categories[0] as Record<string, unknown> | undefined
    return first ? (first.nome as string | null) ?? null : null
  }
  if (typeof categories === 'object') {
    return ((categories as Record<string, unknown>).nome as string | null) ?? null
  }
  return null
}

async function asyncPool<T, R>(
  limit: number,
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const current = nextIndex++
      if (current >= items.length) break
      try {
        results[current] = await fn(items[current], current)
      } catch (err) {
        // Store the error as undefined and let the caller handle it via results
        results[current] = undefined as unknown as R
        throw err
      }
    }
  }

  await Promise.allSettled(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

async function checkPollinationsAvailable(): Promise<void> {
  const probe =
    'https://image.pollinations.ai/prompt/food?width=32&height=32&seed=1&nologo=true&model=flux&safe=true'
  const res = await fetch(probe)
  if (!res.ok) {
    throw new Error(
      `Pollinations.ai indisponível (HTTP ${res.status}). Tente novamente em alguns minutos.`,
    )
  }
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
interface ProductRow {
  id: string
  tenant_id: string
  nome: string
  descricao: string | null
  imagem_url: string | null
  tipo: string
  categoria_nome: string | null
}

async function main() {
  ensureEnv()

  const DRY_RUN = getFlag('dry-run')
  const FORCE = getFlag('force')
  const tenantRaw = getArgValue('tenant') ?? null
  const TENANT_FILTER = tenantRaw && tenantRaw.trim() !== '' ? tenantRaw.trim() : null

  const limitRaw = getArgValue('limit')
  const LIMIT = limitRaw !== undefined ? parseInt(limitRaw, 10) : 0
  if (limitRaw !== undefined && (Number.isNaN(LIMIT) || LIMIT < 0)) {
    console.error('❌ --limit deve ser um número inteiro não-negativo.')
    process.exit(1)
  }

  const concurrencyRaw = getArgValue('concurrency')
  const CONCURRENCY = concurrencyRaw !== undefined ? parseInt(concurrencyRaw, 10) : 3
  if (concurrencyRaw !== undefined && (Number.isNaN(CONCURRENCY) || CONCURRENCY < 1)) {
    console.error('❌ --concurrency deve ser um número inteiro positivo (ex: --concurrency=5).')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  console.log('🔍 Buscando produtos no Supabase...')

  let query = supabase
    .from('products')
    .select('id, tenant_id, nome, descricao, imagem_url, tipo, categories(nome)')
    .order('nome')

  if (TENANT_FILTER) {
    query = query.eq('tenant_id', TENANT_FILTER)
    console.log('   Filtrando por tenant:', TENANT_FILTER)
  }

  const { data, error } = await query
  if (error) {
    console.error('❌ Erro ao consultar Supabase:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  Nenhum produto encontrado.')
    return
  }

  // Normalize and filter products
  const allRows = (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    nome: String(row.nome ?? ''),
    descricao: row.descricao != null ? String(row.descricao) : null,
    imagem_url: row.imagem_url != null ? String(row.imagem_url) : null,
    tipo: String(row.tipo ?? 'simples'),
    categoria_nome: extractCategoryName(row.categories),
  })) as ProductRow[]

  const needsImage: ProductRow[] = FORCE
    ? allRows
    : allRows.filter((p) => {
        if (!p.imagem_url || p.imagem_url.trim() === '') return true
        const url = p.imagem_url.toLowerCase()
        return (
          url.includes('placeholder') ||
          url.endsWith('/placeholder.png') ||
          url.endsWith('/placeholder.jpg') ||
          url.endsWith('/placeholder.svg')
        )
      })

  let candidates = needsImage
  if (LIMIT > 0) candidates = candidates.slice(0, LIMIT)

  console.log(`✅ Total de produtos: ${allRows.length}`)
  console.log(`📋 Sem imagem (ou com placeholder): ${needsImage.length}`)
  if (LIMIT > 0) console.log(`   Limitando a ${LIMIT}`)
  console.log(`   A processar: ${candidates.length} produtos`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — primeiros 10 exemplos ---')
    candidates.slice(0, 10).forEach((p, i) => {
      const meta = buildPollinationsPrompt(p.nome, p.tipo, p.categoria_nome)
      const url = buildPollinationsUrl(meta.prompt, i + 1)
      console.log(`\n[${i + 1}] ${p.nome} (${p.tipo})`)
      console.log(`   categoria:  ${p.categoria_nome ?? 'sem categoria'}`)
      console.log(`   estratégia: ${meta.strategy} (${meta.reason})`)
      console.log(`   url:        ${url.slice(0, 120)}...`)
    })
    console.log('\n(use sem --dry-run para atualizar o banco)')
    return
  }

  if (candidates.length === 0) {
    console.log('\n🎉 Todos os produtos já têm imagem! Nada a gerar.')
    return
  }

  console.log('\n🔌 Verificando disponibilidade do Pollinations.ai...')
  try {
    await checkPollinationsAvailable()
    console.log('   ✓ Disponível')
  } catch (err) {
    console.error('❌', (err as Error).message)
    process.exit(1)
  }

  console.log(
    `\n⚙️  Processando ${candidates.length} produtos (concorrência: ${CONCURRENCY})...\n`,
  )

  let updated = 0
  let errors = 0

  // Use a stable seed offset so same product always gets same image on re-run
  const SEED_OFFSET = 4242

  await asyncPool(CONCURRENCY, candidates, async (p, i) => {
    const seed = SEED_OFFSET + i
    const meta = buildPollinationsPrompt(p.nome, p.tipo, p.categoria_nome)
    const imgUrl = buildPollinationsUrl(meta.prompt, seed)

    const { error: updateError } = await supabase
      .from('products')
      .update({ imagem_url: imgUrl })
      .eq('id', p.id)

    if (updateError) {
      errors++
      console.log(`[${i + 1}/${candidates.length}] ✗ ${p.nome}: ${updateError.message}`)
    } else {
      updated++
      process.stdout.write(
        `[${i + 1}/${candidates.length}] ✓ ${p.nome.slice(0, 40).padEnd(42)} → ${meta.strategy}\n`,
      )
    }
  })

  console.log('\n✅ Concluído!')
  console.log(`   Atualizados: ${updated}`)
  console.log(`   Erros:       ${errors}`)
  console.log('\n📊 Por estratégia:')
  const strategySummary = candidates.reduce<Record<string, number>>((acc, p) => {
    const { strategy } = buildPollinationsPrompt(p.nome, p.tipo, p.categoria_nome)
    acc[strategy] = (acc[strategy] ?? 0) + 1
    return acc
  }, {})
  for (const [s, count] of Object.entries(strategySummary)) {
    console.log(`   ${s.padEnd(10)}: ${count}`)
  }

  console.log('\n🌐 As URLs são dinâmicas (geradas pelo Pollinations sob demanda).')
  console.log('   O banco já está atualizado — veja no painel admin → Cardápio → Produtos.')
  if (errors > 0) {
    console.log(`\n⚠️  ${errors} erros. Tente novamente para reprocessar apenas os que falharam.`)
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
