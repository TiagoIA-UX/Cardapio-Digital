#!/usr/bin/env tsx
/**
 * fetch-products-without-images.ts
 *
 * Lê do banco Supabase todos os produtos sem imagem (ou com placeholder)
 * e gera dois arquivos de saída:
 *
 *   scripts/products-to-generate.csv  — CSV para uso em DALL-E, Midjourney, etc.
 *   scripts/products-to-generate.json — JSON para uso programático
 *
 * Uso:
 *   npx tsx scripts/fetch-products-without-images.ts
 *   npx tsx scripts/fetch-products-without-images.ts --all        # inclui todos (mesmo com imagem)
 *   npx tsx scripts/fetch-products-without-images.ts --dry-run    # mostra apenas a contagem
 *   npx tsx scripts/fetch-products-without-images.ts --tenant=<uuid>  # filtra por restaurante
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
// Prompt builder — estilo Zairyx
// ─────────────────────────────────────────────────────────────────
const TIPO_CONTEXT: Record<string, string> = {
  pizza: 'artisan pizza, italian-style, topped with fresh ingredients',
  bebida: 'refreshing drink, condensation effect, styled glass or bottle',
  sobremesa: 'elegant dessert plating, sweet treat',
  combo: 'complete meal combo, assorted dishes',
  simples: 'restaurant dish',
}

const CATEGORY_HINTS: Record<string, string> = {
  // common Brazilian restaurant categories (normalized)
  entrada: 'appetizer starter, small bites',
  prato: 'main course, full plate',
  'prato principal': 'main course, full plate',
  lanche: 'sandwich, burger, snack',
  bebida: 'drink, beverage',
  sobremesa: 'dessert, sweet',
  pizza: 'artisan pizza',
  massa: 'pasta, italian',
  salada: 'fresh salad',
  frango: 'grilled chicken',
  carne: 'beef, meat dish',
  peixe: 'fish seafood',
  sushi: 'japanese sushi',
  acai: 'acai bowl, brazilian superfood',
  sorvete: 'ice cream, gelato',
  cafe: 'coffee, espresso',
  suco: 'fresh juice',
  combo: 'combo meal, bundle',
}

function normalizeTerm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getCategoryHint(catNome: string | null): string {
  if (!catNome) return ''
  const normalized = normalizeTerm(catNome)
  for (const [key, hint] of Object.entries(CATEGORY_HINTS)) {
    if (normalized.includes(key)) return ', ' + hint
  }
  return ''
}

function buildPrompt(product: {
  nome: string
  descricao: string | null
  tipo: string
  categoria_nome: string | null
}): string {
  const tipoCtx = TIPO_CONTEXT[product.tipo] ?? 'restaurant food item'
  const catHint = getCategoryHint(product.categoria_nome)
  const desc = product.descricao ? `, ${product.descricao.slice(0, 120)}` : ''

  return (
    `Professional food photography of "${product.nome}"${desc}, ` +
    `${tipoCtx}${catHint}, ` +
    `overhead flat lay or 45-degree angle shot, white marble or neutral background, ` +
    `natural soft lighting, high resolution 1024x1024, appetizing, commercial menu quality, ` +
    `no text, no watermark, no people, square composition`
  )
}

// ─────────────────────────────────────────────────────────────────
// Slug builder (for filename — products table has no slug column)
// ─────────────────────────────────────────────────────────────────
function toSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// ─────────────────────────────────────────────────────────────────
// CSV serializer
// ─────────────────────────────────────────────────────────────────
function csvQuote(s: unknown): string {
  return '"' + String(s ?? '').replace(/"/g, '""') + '"'
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Extracts category name from the Supabase join result.
 * Supabase returns foreign-key relations as either an object { nome } or
 * an array [{ nome }] depending on whether it's a to-one or to-many join.
 */
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
  // derived
  slug: string
  filename: string
  prompt: string
}

async function main() {
  ensureEnv()

  const args = process.argv.slice(2)
  const DRY_RUN = args.includes('--dry-run')
  const ALL = args.includes('--all')
  const tenantArg = args.find((a) => a.startsWith('--tenant='))
  const TENANT_FILTER = tenantArg ? tenantArg.split('=')[1] : null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  console.log('🔍 Buscando produtos no Supabase...')

  // Query products with category name via join
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

  // Normalize rows
  const allProducts: ProductRow[] = (data as Record<string, unknown>[]).map((row) => {
    const catNome = extractCategoryName(row.categories)

    const nome = String(row.nome ?? '')
    const slug = toSlug(nome)
    const tipo = String(row.tipo ?? 'simples')
    const descricao = row.descricao != null ? String(row.descricao) : null
    const imagem_url = row.imagem_url != null ? String(row.imagem_url) : null

    return {
      id: String(row.id),
      tenant_id: String(row.tenant_id),
      nome,
      descricao,
      imagem_url,
      tipo,
      categoria_nome: catNome,
      slug,
      filename: slug + '.png',
      prompt: buildPrompt({ nome, descricao, tipo, categoria_nome: catNome }),
    }
  })

  // Filter: products without image or with placeholder
  const needsImage = ALL
    ? allProducts
    : allProducts.filter((p) => {
        if (!p.imagem_url || p.imagem_url.trim() === '') return true
        const url = p.imagem_url.toLowerCase()
        return (
          url.includes('placeholder') ||
          url.endsWith('/placeholder.png') ||
          url.endsWith('/placeholder.jpg') ||
          url.endsWith('/placeholder.svg') ||
          url === 'placeholder'
        )
      })

  console.log(`✅ Total de produtos no banco: ${allProducts.length}`)
  console.log(`📋 Produtos sem imagem (ou com placeholder): ${needsImage.length}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — primeiros 5 exemplos ---')
    needsImage.slice(0, 5).forEach((p, i) => {
      console.log(`\n[${i + 1}] ${p.nome} (${p.tipo})`)
      console.log(`    categoria: ${p.categoria_nome ?? 'sem categoria'}`)
      console.log(`    arquivo:   public/products/${p.filename}`)
      console.log(`    prompt:    ${p.prompt.slice(0, 120)}...`)
    })
    console.log('\n(use sem --dry-run para salvar os arquivos de saída)')
    return
  }

  if (needsImage.length === 0) {
    console.log('🎉 Todos os produtos já têm imagem! Nada a gerar.')
    return
  }

  const ROOT = process.cwd()
  const CSV_PATH = path.join(ROOT, 'scripts', 'products-to-generate.csv')
  const JSON_PATH = path.join(ROOT, 'scripts', 'products-to-generate.json')

  // Write CSV
  const CSV_HEADER = 'id,tenant_id,nome,tipo,categoria,slug,filename,imagem_url_atual,prompt\n'
  const csvRows = needsImage
    .map((p) =>
      [
        csvQuote(p.id),
        csvQuote(p.tenant_id),
        csvQuote(p.nome),
        csvQuote(p.tipo),
        csvQuote(p.categoria_nome ?? ''),
        csvQuote(p.slug),
        csvQuote(p.filename),
        csvQuote(p.imagem_url ?? ''),
        csvQuote(p.prompt),
      ].join(','),
    )
    .join('\n')
  fs.writeFileSync(CSV_PATH, CSV_HEADER + csvRows, 'utf-8')

  // Write JSON
  const jsonOutput = needsImage.map((p) => ({
    id: p.id,
    tenant_id: p.tenant_id,
    nome: p.nome,
    tipo: p.tipo,
    categoria: p.categoria_nome ?? null,
    slug: p.slug,
    filename: p.filename,
    imagem_url_atual: p.imagem_url ?? null,
    prompt: p.prompt,
  }))
  fs.writeFileSync(JSON_PATH, JSON.stringify(jsonOutput, null, 2), 'utf-8')

  console.log(`\n📄 Arquivos gerados:`)
  console.log(`   ${CSV_PATH}`)
  console.log(`   ${JSON_PATH}`)
  console.log(`\n📊 Estatísticas por tipo:`)
  const byTipo = needsImage.reduce<Record<string, number>>((acc, p) => {
    acc[p.tipo] = (acc[p.tipo] ?? 0) + 1
    return acc
  }, {})
  for (const [tipo, count] of Object.entries(byTipo)) {
    console.log(`   ${tipo.padEnd(12)}: ${count}`)
  }

  console.log('\n📌 Próximos passos:')
  console.log('   1. Gerar imagens via DALL-E:')
  console.log(
    '      OPENAI_API_KEY=sk-... npx tsx scripts/generate-product-images-dalle.ts',
  )
  console.log('   2. Fazer upload para R2 e atualizar DB:')
  console.log('      npx tsx scripts/upload-product-images-to-r2.ts')
  console.log('\n   Veja docs/GERAR_IMAGENS_PRODUTOS.md para instruções completas.')
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
