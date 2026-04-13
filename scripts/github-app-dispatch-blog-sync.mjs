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
  const { owner, name } = parseRepo(argValue('--repo'))
  const installArg = argValue('--installation-id')
  const eventType = argValue('--event') || 'blog_sync_request'
  const apply = process.argv.includes('--apply')

  const payload = {
    blogRepository: argValue('--blog-repo') || 'TiagoIA-UX/zairyx-blog',
    branch: argValue('--branch') || 'main',
    pathPrefix: argValue('--path-prefix') || 'content/blog',
    actor: argValue('--actor') || 'github-app',
  }

  const { token, installationId } = await getInstallationTokenForRepo(owner, name, installArg)
  const endpoint = `https://api.github.com/repos/${owner}/${name}/dispatches`

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          dryRun: true,
          repository: `${owner}/${name}`,
          installationId,
          endpoint,
          eventType,
          clientPayload: payload,
          next: 'execute com --apply para disparar o repository_dispatch real',
        },
        null,
        2
      )}\n`
    )
    return
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'zairyx-github-app-tooling',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: payload,
    }),
  })

  const raw = await response.text().catch(() => '')
  if (response.status !== 204) {
    throw new Error(`Falha no dispatch (${response.status}): ${raw}`)
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        success: true,
        repository: `${owner}/${name}`,
        installationId,
        eventType,
        clientPayload: payload,
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
