import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const TEMPLATE_NAME = 'github-app-blog-integration'
const TEMPLATE_DIR = path.join(ROOT, 'templates', TEMPLATE_NAME)

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

function resolveOutputDir() {
  const requested = argValue('--output')
  const relative = requested || path.join('private', `${TEMPLATE_NAME}-export`)
  return path.resolve(ROOT, relative)
}

async function ensureExists(dir) {
  try {
    await mkdir(dir, { recursive: true })
    return true
  } catch {
    return false
  }
}

async function copyTemplateFiles(outputDir) {
  await cp(TEMPLATE_DIR, path.join(outputDir, 'template'), { recursive: true, force: true })
}

async function copyRuntimeScripts(outputDir) {
  const scriptsDir = path.join(outputDir, 'scripts')
  const libDir = path.join(scriptsDir, 'lib')
  await ensureExists(libDir)

  const files = [
    ['scripts/github-app-token.mjs', path.join(scriptsDir, 'github-app-token.mjs')],
    ['scripts/github-app-grant-repo-access.mjs', path.join(scriptsDir, 'github-app-grant-repo-access.mjs')],
    ['scripts/github-app-dispatch-blog-sync.mjs', path.join(scriptsDir, 'github-app-dispatch-blog-sync.mjs')],
    ['scripts/github-app-create-mp-checkout.mjs', path.join(scriptsDir, 'github-app-create-mp-checkout.mjs')],
    ['scripts/lib/github-app-auth.mjs', path.join(libDir, 'github-app-auth.mjs')],
    ['scripts/lib/load-env.mjs', path.join(libDir, 'load-env.mjs')],
  ]

  for (const [sourceRelative, target] of files) {
    const source = path.join(ROOT, sourceRelative)
    await cp(source, target, { force: true })
  }
}

async function writeQuickstart(outputDir) {
  const quickstartPath = path.join(outputDir, 'QUICKSTART.md')
  const content = `# Quickstart - ${TEMPLATE_NAME}\n\n## 1) Copie os arquivos para o repo destino\n\n- pasta \`template/workflows\` para \`.github/workflows\`\n- arquivo \`template/.env.github-app.example\` para referencia local\n- pasta \`scripts\` para o repo destino\n\n## 2) Adicione scripts npm\n\nCopie o bloco de \`template/package-scripts.snippet.json\` para o \`package.json\` do projeto destino.\n\n## 3) Configure variaveis no ambiente\n\n- \`GITHUB_APP_ID\`\n- \`GITHUB_APP_PRIVATE_KEY\` (ou \`GITHUB_APP_PRIVATE_KEY_BASE64\`)\n\n## 4) Teste em dry-run\n\n\`npm run github:app:dispatch:blog -- --repo owner/app-repo --blog-repo owner/blog-repo\`\n\n## 5) Execute real\n\n\`npm run github:app:dispatch:blog -- --repo owner/app-repo --blog-repo owner/blog-repo --apply\`\n\nSempre valide em dry-run antes de \`--apply\`.\n`

  await writeFile(quickstartPath, content, 'utf8')
}

async function main() {
  const outputDir = resolveOutputDir()
  await ensureExists(outputDir)

  await copyTemplateFiles(outputDir)
  await copyRuntimeScripts(outputDir)
  await writeQuickstart(outputDir)

  const report = {
    success: true,
    template: TEMPLATE_NAME,
    outputDir,
    exportedAt: new Date().toISOString(),
    includes: [
      'template/workflows/blog-sync-receiver.yml',
      'template/.env.github-app.example',
      'template/package-scripts.snippet.json',
      'scripts/github-app-token.mjs',
      'scripts/github-app-grant-repo-access.mjs',
      'scripts/github-app-dispatch-blog-sync.mjs',
      'scripts/github-app-create-mp-checkout.mjs',
      'scripts/lib/github-app-auth.mjs',
      'scripts/lib/load-env.mjs',
      'QUICKSTART.md',
    ],
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
