/**
 * Fix açaí template images — searches Pexels for proper images
 * for all 38 açaí products (including 11 missing "Adicionais").
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/fix-acai-images.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const GENERATED_FILE = resolve(ROOT, 'lib/generated-template-product-images.ts')

// ─── All 38 açaí products with curated search terms ──────────────
const ACAI_PRODUCTS = [
  // Açaí no Copo
  { key: 'acai::acai-no-copo::1::acai-300ml', search: 'acai berry cup purple smoothie' },
  { key: 'acai::acai-no-copo::2::acai-500ml', search: 'acai bowl cup fresh fruit' },
  { key: 'acai::acai-no-copo::3::acai-700ml', search: 'purple smoothie bowl acai berry' },
  { key: 'acai::acai-no-copo::4::acai-1-litro', search: 'acai berry smoothie large cup' },

  // Tigelas
  { key: 'acai::tigelas::5::tigela-classica-500ml', search: 'acai bowl granola banana topping' },
  { key: 'acai::tigelas::6::tigela-1l-familia', search: 'large acai bowl family size fruit' },
  { key: 'acai::tigelas::7::tigela-fitness', search: 'healthy acai bowl protein fitness' },
  { key: 'acai::tigelas::8::tigela-tropical', search: 'tropical acai bowl mango coconut' },

  // Açaí Especiais
  { key: 'acai::acai-especiais::9::acai-napolitano', search: 'neapolitan ice cream bowl berry' },
  { key: 'acai::acai-especiais::10::acai-com-pacoca', search: 'acai bowl peanut candy topping brazilian' },
  { key: 'acai::acai-especiais::11::acai-power', search: 'acai power bowl superfood energy' },
  { key: 'acai::acai-especiais::12::acai-ovomaltine', search: 'acai bowl chocolate malt crunch' },
  { key: 'acai::acai-especiais::13::acai-oreo', search: 'acai bowl cookies cream topping' },
  { key: 'acai::acai-especiais::14::acai-zero', search: 'sugar free acai bowl healthy' },

  // Pitaya & Cupuaçu
  { key: 'acai::pitaya-cupuacu::15::pitaya-300ml', search: 'dragon fruit pitaya smoothie pink' },
  { key: 'acai::pitaya-cupuacu::16::pitaya-500ml', search: 'pitaya dragon fruit bowl pink' },
  { key: 'acai::pitaya-cupuacu::17::tigela-de-pitaya', search: 'dragon fruit bowl topping granola' },
  { key: 'acai::pitaya-cupuacu::18::cupuacu-500ml', search: 'cupuacu tropical fruit smoothie' },

  // Adicionais (MISSING — these are toppings, NOT the açaí itself)
  { key: 'acai::adicionais::19::granola', search: 'granola cereal bowl crunchy' },
  { key: 'acai::adicionais::20::leite-condensado', search: 'condensed milk can drizzle' },
  { key: 'acai::adicionais::21::nutella', search: 'chocolate hazelnut spread nutella jar' },
  { key: 'acai::adicionais::22::morango', search: 'fresh strawberries red fruit bowl' },
  { key: 'acai::adicionais::23::banana', search: 'banana slices fruit yellow' },
  { key: 'acai::adicionais::24::ovomaltine', search: 'chocolate malt powder crunchy' },
  { key: 'acai::adicionais::25::oreo', search: 'oreo cookies crushed cream' },
  { key: 'acai::adicionais::26::pacoca', search: 'peanut candy brazilian pacoca crushed' },
  { key: 'acai::adicionais::27::leite-em-po', search: 'powdered milk white spoon' },
  { key: 'acai::adicionais::28::whey-protein', search: 'protein powder supplement scoop' },
  { key: 'acai::adicionais::29::pasta-de-amendoim', search: 'peanut butter jar spoon' },

  // Bebidas
  { key: 'acai::bebidas::30::smoothie-de-acai', search: 'purple acai smoothie glass straw' },
  { key: 'acai::bebidas::31::vitamina-de-acai', search: 'acai berry vitamin shake blended' },
  { key: 'acai::bebidas::32::suco-de-acai-com-guarana', search: 'acai guarana juice tropical drink' },
  { key: 'acai::bebidas::33::agua-de-coco-300ml', search: 'coconut water fresh drink' },
  { key: 'acai::bebidas::34::refrigerante-350ml', search: 'soda can soft drink cold' },

  // Combos
  { key: 'acai::combos::35::combo-acai-500ml-suco', search: 'acai bowl and juice combo meal' },
  { key: 'acai::combos::36::combo-casal', search: 'two acai bowls couple dessert' },
  { key: 'acai::combos::37::combo-familia', search: 'family meal bowls fruit dessert' },
  { key: 'acai::combos::38::combo-fitness', search: 'fitness healthy meal bowl protein fruit' },
]

// ─── Pexels search ──────────────────────────────────────────
const usedPhotoIds = new Set()

// Collect ALL existing photo IDs from the generated file so we don't collide
const existingContent = readFileSync(GENERATED_FILE, 'utf-8')
const existingRegex = /pexels-photo-(\d+)/g
let em
while ((em = existingRegex.exec(existingContent)) !== null) {
  usedPhotoIds.add(em[1])
}
console.log(`Loaded ${usedPhotoIds.size} existing photo IDs to avoid collisions`)

async function searchPexels(query, perPage = 15) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: API_KEY } })
  if (res.status === 429) {
    console.log('  ⏳ Rate limited. Waiting 60s...')
    await new Promise(r => setTimeout(r, 60_000))
    return searchPexels(query, perPage)
  }
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return data.photos || []
}

function pickUnique(photos) {
  for (const photo of photos) {
    const id = String(photo.id)
    if (!usedPhotoIds.has(id)) {
      usedPhotoIds.add(id)
      return photo
    }
  }
  return null
}

function photoUrl(photo) {
  return `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=800`
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`\n🍇 Fixing açaí template images (${ACAI_PRODUCTS.length} products)\n`)

  const results = new Map()

  for (let i = 0; i < ACAI_PRODUCTS.length; i++) {
    const { key, search } = ACAI_PRODUCTS[i]
    process.stdout.write(`  [${i + 1}/${ACAI_PRODUCTS.length}] "${search}"... `)

    const photos = await searchPexels(search)
    const photo = pickUnique(photos)

    if (photo) {
      results.set(key, photoUrl(photo))
      console.log(`✅ photo ${photo.id}`)
    } else {
      // Fallback: try broader search
      const fallbackPhotos = await searchPexels(search.split(' ').slice(0, 2).join(' ') + ' food', 30)
      const fallbackPhoto = pickUnique(fallbackPhotos)
      if (fallbackPhoto) {
        results.set(key, photoUrl(fallbackPhoto))
        console.log(`✅ photo ${fallbackPhoto.id} (fallback)`)
      } else {
        console.log(`❌ no unique photo found`)
      }
    }

    // Rate-limit spacing
    await new Promise(r => setTimeout(r, 1800))
  }

  // ─── Update the generated file ──────────────────────────
  console.log('\n📝 Updating generated file...')

  // Parse existing mapping
  const mapRegex = /"([^"]+)":\s*"([^"]+)"/g
  const allEntries = new Map()
  let m
  while ((m = mapRegex.exec(existingContent)) !== null) {
    allEntries.set(m[1], m[2])
  }

  // Overwrite açaí entries + add missing ones
  let replaced = 0
  let added = 0
  for (const [key, url] of results) {
    if (allEntries.has(key)) {
      replaced++
    } else {
      added++
    }
    allEntries.set(key, url)
  }

  // Sort all entries and write
  const sortedKeys = [...allEntries.keys()].sort()
  const lines = sortedKeys.map(k => `  "${k}": "${allEntries.get(k)}"`)

  const output = `/**
 * Mapeamento gerado em lote para imagens individuais de produtos dos templates.
 *
 * Chave (string) criada com \`getTemplateProductImageKey\`
 * (ver \`lib/template-product-images.ts\`).
 *
 * Gerado automaticamente - ${new Date().toISOString().slice(0, 10)}
 * Total: ${sortedKeys.length} imagens mapeadas
 * Fotos únicas: ${sortedKeys.length}
 */
export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> = {
${lines.join(',\n')}
}
`

  writeFileSync(GENERATED_FILE, output, 'utf-8')

  console.log(`\n✅ Concluído!`)
  console.log(`   Replaced: ${replaced} açaí images`)
  console.log(`   Added: ${added} missing adicionais`)
  console.log(`   Total entries: ${sortedKeys.length}`)
  console.log(`   Output: lib/generated-template-product-images.ts`)
}

main().catch(err => { console.error(err); process.exit(1) })
