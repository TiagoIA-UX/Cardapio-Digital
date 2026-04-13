import { getInstallationTokenForRepo } from './lib/github-app-auth.mjs'

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

function parseRepo(repoArg) {
  const repo = repoArg || process.env.GITHUB_TARGET_REPO || process.env.GITHUB_REPOSITORY
  if (!repo || !repo.includes('/')) {
    throw new Error('Informe o repositorio com --repo owner/nome ou GITHUB_TARGET_REPO.')
  }
  const [owner, name] = repo.split('/')
  return { owner, name }
}

async function main() {
  const repoArg = argValue('--repo')
  const installArg = argValue('--installation-id')
  const printToken = process.argv.includes('--print-token')
  const { owner, name } = parseRepo(repoArg)

  const result = await getInstallationTokenForRepo(owner, name, installArg)

  const output = {
    repository: `${owner}/${name}`,
    installationId: result.installationId,
    expiresAt: result.expiresAt,
  }

  if (printToken) output.token = result.token

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
