import fs from 'node:fs'
import path from 'node:path'

const outputPath = path.resolve('public', 'GUIA_EXECUCAO_LOCAL.pdf')

const blocks = [
  { type: 'title', text: 'Guia rapido para rodar o Cardapio Digital localmente' },
  {
    type: 'body',
    text: 'Este guia foi preparado para Windows e para uso local do projeto principal que esta na raiz do repositorio.',
  },
  { type: 'heading', text: '1. O que voce precisa' },
  { type: 'bullet', text: 'Node.js 20 ou superior' },
  { type: 'bullet', text: 'npm 10 ou superior' },
  { type: 'bullet', text: 'Docker Desktop se quiser abrir em Dev Container' },
  {
    type: 'bullet',
    text: 'Acesso ao Supabase e, se for testar pagamento, ao Mercado Pago Developers',
  },
  { type: 'heading', text: '2. Rodando sem Docker' },
  {
    type: 'bullet',
    text: 'Abra um terminal na pasta raiz do projeto: C:/Users/omago/01CardapioDigital',
  },
  { type: 'bullet', text: 'Instale as dependencias com: npm install' },
  { type: 'bullet', text: 'Se ainda nao existir .env.local, gere com: npm run setup:local' },
  {
    type: 'bullet',
    text: 'Como alternativa, copie .env.example para .env.local e preencha as variaveis do Supabase.',
  },
  {
    type: 'bullet',
    text: 'Para pagamentos de teste, mantenha MERCADO_PAGO_ENV=sandbox e NEXT_PUBLIC_MERCADO_PAGO_ENV=sandbox.',
  },
  { type: 'bullet', text: 'Valide o ambiente com: npm run doctor' },
  { type: 'bullet', text: 'Suba o servidor local com: npm run dev' },
  { type: 'bullet', text: 'Abra o navegador em: http://localhost:3000' },
  { type: 'heading', text: '3. Rodando com Docker e Dev Container' },
  { type: 'bullet', text: 'Confirme que o Docker Desktop esta aberto e com o backend ativo.' },
  { type: 'bullet', text: 'No VS Code, use o comando Dev Containers: Reopen in Container.' },
  { type: 'bullet', text: 'Quando o container abrir, rode: npm install' },
  { type: 'bullet', text: 'Depois rode: npm run dev' },
  {
    type: 'bullet',
    text: 'Se a porta 3000 for encaminhada, abra http://localhost:3000 no navegador.',
  },
  { type: 'heading', text: '4. Scripts importantes do projeto' },
  { type: 'bullet', text: 'npm run dev -> sobe o projeto em modo desenvolvimento' },
  { type: 'bullet', text: 'npm run dev:https -> sobe com HTTPS local' },
  { type: 'bullet', text: 'npm run doctor -> verifica variaveis e ambiente' },
  { type: 'bullet', text: 'npm run lint -> valida o codigo com ESLint' },
  { type: 'bullet', text: 'npm run audit:full -> roda build, lint e testes' },
  { type: 'heading', text: '5. Primeiros testes apos subir o sistema' },
  { type: 'bullet', text: 'Acesse a home em http://localhost:3000' },
  { type: 'bullet', text: 'Teste o login em /login' },
  { type: 'bullet', text: 'Se necessario, crie o restaurante no painel' },
  { type: 'bullet', text: 'Cadastre produtos e confira o cardapio publico' },
  { type: 'heading', text: '6. Problemas comuns' },
  {
    type: 'bullet',
    text: 'Se localhost nao abrir, confirme que o terminal mostra que o Next.js iniciou sem erro.',
  },
  {
    type: 'bullet',
    text: 'Se o Docker falhar, verifique se o servico com.docker.service esta em execucao.',
  },
  {
    type: 'bullet',
    text: 'Se o login Google voltar para uma URL com code, revise as variaveis do Supabase e o redirect configurado.',
  },
  { type: 'bullet', text: 'Se houver erro de ambiente, rode novamente: npm run doctor' },
  { type: 'heading', text: 'Resumo rapido' },
  {
    type: 'body',
    text: 'Fluxo minimo: npm install, configurar .env.local, npm run doctor, npm run dev e abrir http://localhost:3000.',
  },
]

const pageWidth = 595
const pageHeight = 842
const marginLeft = 52
const marginTop = 58
const marginBottom = 52
const usableWidth = pageWidth - marginLeft * 2

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function maxCharsFor(fontSize) {
  return Math.max(20, Math.floor(usableWidth / (fontSize * 0.54)))
}

function wrapText(text, fontSize) {
  const words = text.split(/\s+/)
  const maxChars = maxCharsFor(fontSize)
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (candidate.length <= maxChars) {
      currentLine = candidate
      continue
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

function lineHeightFor(type, fontSize) {
  if (type === 'title') return fontSize + 10
  if (type === 'heading') return fontSize + 8
  return fontSize + 5
}

function fontSizeFor(type) {
  if (type === 'title') return 20
  if (type === 'heading') return 14
  return 11
}

function normalizeBlock(block) {
  const fontSize = fontSizeFor(block.type)
  const text = block.type === 'bullet' ? `- ${block.text}` : block.text
  const lines = wrapText(text, fontSize)

  return {
    ...block,
    fontSize,
    lines,
    lineHeight: lineHeightFor(block.type, fontSize),
    marginAfter: block.type === 'title' ? 10 : block.type === 'heading' ? 6 : 3,
  }
}

const normalizedBlocks = blocks.map(normalizeBlock)

const pages = []
let currentPage = []
let currentY = pageHeight - marginTop

for (const block of normalizedBlocks) {
  const requiredHeight = block.lines.length * block.lineHeight + block.marginAfter
  if (currentY - requiredHeight < marginBottom) {
    pages.push(currentPage)
    currentPage = []
    currentY = pageHeight - marginTop
  }

  currentPage.push(block)
  currentY -= requiredHeight
}

if (currentPage.length > 0) {
  pages.push(currentPage)
}

function buildContentStream(pageBlocks) {
  let y = pageHeight - marginTop
  const commands = ['BT', '/F1 11 Tf', '0 g']

  for (const block of pageBlocks) {
    commands.push(`/F1 ${block.fontSize} Tf`)

    for (const line of block.lines) {
      commands.push(`1 0 0 1 ${marginLeft} ${y} Tm (${escapePdfText(line)}) Tj`)
      y -= block.lineHeight
    }

    y -= block.marginAfter
  }

  commands.push('ET')
  return commands.join('\n')
}

const objects = []

function addObject(content) {
  objects.push(content)
  return objects.length
}

const catalogId = addObject('')
const pagesId = addObject('')
const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

const pageObjectIds = []

for (const pageBlocks of pages) {
  const stream = buildContentStream(pageBlocks)
  const streamLength = Buffer.byteLength(stream, 'latin1')
  const contentId = addObject(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`)
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
  )
  pageObjectIds.push(pageId)
}

objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
objects[pagesId - 1] =
  `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`

let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
const offsets = [0]

for (let index = 0; index < objects.length; index += 1) {
  offsets.push(Buffer.byteLength(pdf, 'latin1'))
  pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`
}

const xrefOffset = Buffer.byteLength(pdf, 'latin1')
pdf += `xref\n0 ${objects.length + 1}\n`
pdf += '0000000000 65535 f \n'

for (let index = 1; index < offsets.length; index += 1) {
  pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
}

pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

fs.writeFileSync(outputPath, Buffer.from(pdf, 'latin1'))
console.log(`PDF gerado em: ${outputPath}`)
