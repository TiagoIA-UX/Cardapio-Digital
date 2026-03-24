#!/usr/bin/env -S tsx --tsconfig tsconfig.scripts.json
/**
 * generate-product-images-dalle.ts
 *
 * Gera imagens via DALL-E 3 (OpenAI) para cada produto listado em
 * scripts/products-to-generate.csv (gerado por fetch-products-without-images.ts).
 *
 * As imagens são salvas em:  public/products/<slug>.png
 *
 * Uso:
 *   npm run gen:products:dalle
 *   npm run gen:products:dalle -- --dry-run       # sem gerar
 *   npm run gen:products:dalle -- --start=50      # retoma do produto 50
 *   npm run gen:products:dalle -- --limit=10      # gera só 10
 *   $env:OPENAI_API_KEY="sk-..."; npm run gen:products:dalle  # Windows PowerShell
 *   OPENAI_API_KEY=sk-... npm run gen:products:dalle          # Mac/Linux
 *
 * Custo estimado: ~$0.04/imagem (DALL-E 3 standard 1024×1024)
 * Throttle padrão: 5 imgs/min (tier 1) → delay de 13 s entre chamadas
 *
 * Progresso gravado em: scripts/.product-dalle-progress.json
 * (Permite retomar de onde parou sem regerar imagens já feitas)
 */

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import process from 'node:process'

// ─────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────
const ROOT = process.cwd()
const CSV_PATH = path.join(ROOT, 'scripts', 'products-to-generate.csv')
const OUTPUT_DIR = path.join(ROOT, 'public', 'products')
const PROGRESS_FILE = path.join(ROOT, 'scripts', '.product-dalle-progress.json')
const DELAY_MS = 13_000 // ~4.6 imgs/min — abaixo do limite de 5/min no tier 1

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

const DRY_RUN = getFlag('dry-run')

const startRaw = getArgValue('start')
const START_FROM = startRaw !== undefined ? parseInt(startRaw, 10) : 0
if (startRaw !== undefined && (Number.isNaN(START_FROM) || START_FROM < 0)) {
  console.error('❌ --start deve ser um número inteiro não-negativo.')
  process.exit(1)
}

const limitRaw = getArgValue('limit')
const LIMIT = limitRaw !== undefined ? parseInt(limitRaw, 10) : 0
if (limitRaw !== undefined && (Number.isNaN(LIMIT) || LIMIT < 0)) {
  console.error('❌ --limit deve ser um número inteiro não-negativo.')
  process.exit(1)
}

const API_KEY = process.env.OPENAI_API_KEY

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface ProductEntry {
  id: string
  nome: string
  tipo: string
  categoria: string
  slug: string
  filename: string
  prompt: string
}

// ─────────────────────────────────────────────────────────────────
// CSV parser (robust, handles quoted fields)
// ─────────────────────────────────────────────────────────────────
function parseCSV(content: string): ProductEntry[] {
  const lines = content.trim().split('\n')
  const header = splitCSVLine(lines[0])

  return lines.slice(1).map((line) => {
    const cols = splitCSVLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return {
      id: row['id'] ?? '',
      nome: row['nome'] ?? '',
      tipo: row['tipo'] ?? '',
      categoria: row['categoria'] ?? '',
      slug: row['slug'] ?? '',
      filename: row['filename'] ?? '',
      prompt: row['prompt'] ?? '',
    }
  })
}

function splitCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      cols.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur)
  return cols
}

// ─────────────────────────────────────────────────────────────────
// HTTP helpers (no external dependency)
// ─────────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (e) => {
        fs.unlink(dest, (unlinkErr) => {
          if (unlinkErr) console.warn('Aviso: falha ao limpar arquivo parcial:', unlinkErr.message)
        })
        reject(e)
      })
  })
}

function callOpenAI(prompt: string): Promise<string> {
  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'url',
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString()
        })
        res.on('end', () => {
          try {
            const json = JSON.parse(data) as {
              data?: Array<{ url: string }>
              error?: { message: string }
            }
            if (json.error) return reject(new Error(json.error.message))
            if (!json.data?.[0]?.url) return reject(new Error('Resposta inesperada da API'))
            resolve(json.data[0].url)
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ Arquivo não encontrado:', CSV_PATH)
    console.error('   Execute primeiro: npm run gen:products:fetch')
    process.exit(1)
  }

  if (!API_KEY && !DRY_RUN) {
    console.error('❌ OPENAI_API_KEY não definida.')
    console.error('   Windows: $env:OPENAI_API_KEY="sk-..."; npm run gen:products:dalle')
    console.error('   Mac/Linux: OPENAI_API_KEY=sk-... npm run gen:products:dalle')
    console.error('   Ou use --dry-run para visualizar prompts sem gerar')
    process.exit(1)
  }

  const allProducts = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'))

  let products = allProducts.slice(START_FROM)
  if (LIMIT > 0) products = products.slice(0, LIMIT)

  console.log(`📋 Total no CSV: ${allProducts.length} produtos`)
  if (START_FROM > 0) console.log(`   Retomando a partir do produto #${START_FROM}`)
  if (LIMIT > 0) console.log(`   Limitando a ${LIMIT} produtos`)
  console.log(`   A processar: ${products.length} produtos`)
  console.log(`   Destino: ${OUTPUT_DIR}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — primeiros 10 prompts ---')
    products.slice(0, 10).forEach((p, i) => {
      console.log(`\n[${i + 1 + START_FROM}] ${p.nome} (${p.tipo})`)
      console.log(`   arquivo: public/products/${p.filename}`)
      console.log(`   prompt:  ${p.prompt.slice(0, 160)}...`)
    })
    const cost = (products.length * 0.04).toFixed(2)
    const mins = Math.ceil((products.length * DELAY_MS) / 60_000)
    console.log(`\n💰 Custo estimado: ~$${cost} USD`)
    console.log(`⏱  Tempo estimado: ~${mins} min`)
    return
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Progress tracking (allows resume)
  const progress: Record<string, boolean> = fs.existsSync(PROGRESS_FILE)
    ? (JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) as Record<string, boolean>)
    : {}

  let generated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const dest = path.join(OUTPUT_DIR, p.filename)

    // Skip if already generated (file exists or in progress log)
    if (progress[p.filename] || fs.existsSync(dest)) {
      skipped++
      continue
    }

    process.stdout.write(
      `[${i + 1 + START_FROM}/${allProducts.length}] ${p.nome} ... `,
    )

    try {
      const imgUrl = await callOpenAI(p.prompt)
      await downloadImage(imgUrl, dest)

      progress[p.filename] = true
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))

      generated++
      console.log('✓')
    } catch (err) {
      errors++
      console.log(`✗ ${(err as Error).message}`)
    }

    // Rate-limit: wait between requests (except after the last one)
    if (i < products.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  console.log('\n✅ Concluído!')
  console.log(`   Geradas:  ${generated}`)
  console.log(`   Puladas:  ${skipped} (já existiam)`)
  console.log(`   Erros:    ${errors}`)
  console.log(`\n📁 Imagens salvas em: ${OUTPUT_DIR}`)
  console.log('\n📌 Próximo passo: fazer upload para R2 e atualizar o banco:')
  console.log('   npm run gen:products:upload')
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
