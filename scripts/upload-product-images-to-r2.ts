#!/usr/bin/env -S tsx --tsconfig tsconfig.scripts.json
/**
 * upload-product-images-to-r2.ts
 *
 * Faz upload das imagens geradas em public/products/ para o Cloudflare R2
 * (pasta "pratos") e atualiza o campo imagem_url na tabela products do Supabase.
 *
 * Regras de segurança:
 *   - Nunca sobrescreve imagem já existente no produto (a menos que --force seja usado)
 *   - Só processa produtos que constem em scripts/products-to-generate.json
 *   - Só faz upload se o arquivo .png existir localmente em public/products/
 *
 * Uso:
 *   npm run gen:products:upload
 *   npm run gen:products:upload -- --dry-run    # sem gravar nada
 *   npm run gen:products:upload -- --force      # re-upload mesmo com imagem
 *   npm run gen:products:upload -- --limit=10   # só os primeiros 10
 *
 * Requer (em .env.local ou .env.production):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_URL',
  ]
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
// R2 config
// ─────────────────────────────────────────────────────────────────
const R2_PRODUCTS_PREFIX = 'pratos/products'

// ─────────────────────────────────────────────────────────────────
// MIME detection from file header
// ─────────────────────────────────────────────────────────────────
function detectMimeType(filePath: string): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  const buf = Buffer.alloc(12)
  const fd = fs.openSync(filePath, 'r')
  fs.readSync(fd, buf, 0, 12, 0)
  fs.closeSync(fd)

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return 'image/webp'

  return null
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
interface ProductEntry {
  id: string
  tenant_id: string
  nome: string
  slug: string
  filename: string
  imagem_url_atual: string | null
}

async function main() {
  ensureEnv()

  const DRY_RUN = getFlag('dry-run')
  const FORCE = getFlag('force')
  const limitRaw = getArgValue('limit')
  const LIMIT = limitRaw !== undefined ? parseInt(limitRaw, 10) : 0
  if (limitRaw !== undefined && (Number.isNaN(LIMIT) || LIMIT < 0)) {
    console.error('❌ --limit deve ser um número inteiro não-negativo.')
    process.exit(1)
  }

  const ROOT = process.cwd()
  const JSON_PATH = path.join(ROOT, 'scripts', 'products-to-generate.json')
  const OUTPUT_DIR = path.join(ROOT, 'public', 'products')

  if (!fs.existsSync(JSON_PATH)) {
    console.error('❌ Arquivo não encontrado:', JSON_PATH)
    console.error('   Execute primeiro: npm run gen:products:fetch')
    process.exit(1)
  }

  const products: ProductEntry[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) as ProductEntry[]

  // Build R2 client
  const accountId = process.env.R2_ACCOUNT_ID!.trim()
  const bucketName = (process.env.R2_BUCKET_NAME ?? 'cardapio-digital').trim()
  const publicUrl = process.env.R2_PUBLIC_URL!.trim().replace(/\/$/, '')

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  })

  // Build Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  let candidates = products.filter((p) => {
    // Skip if product already has a real image and --force not set
    if (!FORCE && p.imagem_url_atual) {
      const url = p.imagem_url_atual.toLowerCase()
      const isPlaceholder =
        url.includes('placeholder') ||
        url.endsWith('/placeholder.png') ||
        url.endsWith('/placeholder.jpg') ||
        url.endsWith('/placeholder.svg') ||
        url.trim() === ''
      if (!isPlaceholder) return false
    }
    // Only process if local image file exists
    const localPath = path.join(OUTPUT_DIR, p.filename)
    return fs.existsSync(localPath)
  })

  if (LIMIT > 0) candidates = candidates.slice(0, LIMIT)

  console.log(`📦 Produtos no JSON: ${products.length}`)
  console.log(`📁 Com imagem local em public/products/: ${candidates.length}`)
  if (DRY_RUN) console.log('   (modo --dry-run: nenhuma alteração será feita)')

  if (candidates.length === 0) {
    console.log(
      '\nℹ️  Nenhuma imagem para fazer upload. Gere as imagens primeiro:',
    )
    console.log('   npm run gen:products:dalle')
    return
  }

  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i]
    const localPath = path.join(OUTPUT_DIR, p.filename)
    const r2Key = `${R2_PRODUCTS_PREFIX}/${p.filename}`

    process.stdout.write(`[${i + 1}/${candidates.length}] ${p.nome} ... `)

    if (DRY_RUN) {
      console.log(`→ R2: ${r2Key} (dry-run)`)
      skipped++
      continue
    }

    try {
      const fileBuffer = fs.readFileSync(localPath)
      const mimeType = detectMimeType(localPath) ?? 'image/png'

      // Upload to R2
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )

      const r2Url = `${publicUrl}/${r2Key}`

      // Update Supabase
      const { error: updateError } = await supabase
        .from('products')
        .update({ imagem_url: r2Url })
        .eq('id', p.id)

      if (updateError) {
        console.log(`✗ DB update: ${updateError.message}`)
        errors++
        continue
      }

      uploaded++
      console.log(`✓ → ${r2Url}`)
    } catch (err) {
      errors++
      console.log(`✗ ${(err as Error).message}`)
    }
  }

  console.log('\n✅ Concluído!')
  console.log(`   Uploads:   ${uploaded}`)
  console.log(`   Pulados:   ${skipped}`)
  console.log(`   Erros:     ${errors}`)

  if (uploaded > 0) {
    console.log('\n🎉 Banco de dados atualizado com as novas imagens.')
    console.log('   Verifique no painel admin → Cardápio → Produtos.')
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
