import { getInstallationTokenForRepo } from './lib/github-app-auth.mjs'

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

function parseRepo(repoArg) {
  const repo = repoArg || process.env.GITHUB_TARGET_REPO || process.env.GITHUB_REPOSITORY
  if (!repo || !repo.includes('/')) {
    throw new Error('Informe --repo owner/nome ou GITHUB_TARGET_REPO.')
  }
  const [owner, name] = repo.split('/')
  return { owner, name }
}

async function main() {
  const username = argValue('--github-user')
  if (!username) {
    throw new Error('Informe --github-user usuario')
  }

  const permission = argValue('--permission') || 'pull'
  const installArg = argValue('--installation-id')
  const apply = process.argv.includes('--apply')

  const { owner, name } = parseRepo(argValue('--repo'))
  const { token, installationId } = await getInstallationTokenForRepo(owner, name, installArg)

  const endpoint = `https://api.github.com/repos/${owner}/${name}/collaborators/${username}`
  const body = { permission }

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          dryRun: true,
          repository: `${owner}/${name}`,
          installationId,
          endpoint,
          body,
          next: 'execute com --apply para enviar o convite real',
        },
        null,
        2
      )}\n`
    )
    return
  }

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'zairyx-github-app-tooling',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const raw = await response.text().catch(() => '')

  if (![201, 204].includes(response.status)) {
    throw new Error(`Falha ao convidar colaborador (${response.status}): ${raw}`)
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        success: true,
        repository: `${owner}/${name}`,
        installationId,
        githubUser: username,
        permission,
        statusCode: response.status,
      },
      null,
      2
    )}\n`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
