import { createSign } from 'node:crypto'
import { loadLocalEnv } from './load-env.mjs'

loadLocalEnv()

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function decodePrivateKeyFromEnv() {
  const base64 = process.env.GITHUB_APP_PRIVATE_KEY_BASE64?.trim()
  if (base64) {
    return Buffer.from(base64, 'base64').toString('utf8')
  }

  const raw = process.env.GITHUB_APP_PRIVATE_KEY?.trim()
  if (raw) {
    return raw.replace(/\\n/g, '\n')
  }

  throw new Error('Defina GITHUB_APP_PRIVATE_KEY ou GITHUB_APP_PRIVATE_KEY_BASE64 no ambiente.')
}

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`)
  return value
}

export function createAppJwt() {
  const appId = requiredEnv('GITHUB_APP_ID')
  const privateKey = decodePrivateKeyFromEnv()
  const now = Math.floor(Date.now() / 1000)

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    })
  )

  const unsigned = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()

  const signature = signer
    .sign(privateKey)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${unsigned}.${signature}`
}

async function githubFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'zairyx-github-app-tooling',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${body}`)
  }

  return response
}

export async function resolveInstallationId(owner, repo) {
  const appJwt = createAppJwt()
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/installation`, {
    headers: {
      Authorization: `Bearer ${appJwt}`,
    },
  })

  const data = await response.json()
  if (!data?.id) throw new Error('Nao foi possivel resolver installation id para o repositorio.')
  return Number(data.id)
}

export async function createInstallationToken(installationId) {
  const appJwt = createAppJwt()
  const response = await githubFetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
      },
    }
  )

  const data = await response.json()
  if (!data?.token) throw new Error('GitHub nao retornou token de instalacao.')
  return {
    token: data.token,
    expiresAt: data.expires_at,
  }
}

export async function getInstallationTokenForRepo(owner, repo, overrideInstallationId) {
  const installationId = overrideInstallationId
    ? Number(overrideInstallationId)
    : await resolveInstallationId(owner, repo)

  if (!Number.isFinite(installationId)) {
    throw new Error('installation id invalido.')
  }

  const { token, expiresAt } = await createInstallationToken(installationId)
  return {
    installationId,
    token,
    expiresAt,
  }
}
