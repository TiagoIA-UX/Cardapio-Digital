import test from 'node:test'
import assert from 'node:assert/strict'
import { GET } from '@/app/api/subscription/cancel/route'

test('subscription cancel route rejeita GET com 405', async () => {
  const response = await GET()
  const body = await response.json()

  assert.equal(response.status, 405)
  assert.equal(body.error, 'Método não permitido')
})
