import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePixKey, validatePixKey, PIX_PATTERNS } from '@/lib/domains/core/pix'
import { mapMercadoPagoStatus } from '@/lib/domains/core/payment-status'

// ═══════════════════════════════════════════════════════════════
// PIX — normalização
// ═══════════════════════════════════════════════════════════════

test('normalizePixKey remove pontos e traços de CPF', () => {
  assert.equal(normalizePixKey('123.456.789-00'), '12345678900')
})

test('normalizePixKey remove formatação de CNPJ', () => {
  assert.equal(normalizePixKey('12.345.678/0001-00'), '12345678000100')
})

test('normalizePixKey preserva email intacto', () => {
  assert.equal(normalizePixKey('joao@email.com'), 'joao@email.com')
})

test('normalizePixKey lowercases UUID', () => {
  const uuid = 'A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D'
  assert.equal(normalizePixKey(uuid), uuid.toLowerCase())
})

test('normalizePixKey limpa telefone com espaços (preserva +)', () => {
  assert.equal(normalizePixKey('+55 (12) 99999-8888'), '+5512999998888')
})

test('normalizePixKey trim spaces', () => {
  assert.equal(normalizePixKey('  12345678900  '), '12345678900')
})

// ═══════════════════════════════════════════════════════════════
// PIX — validação
// ═══════════════════════════════════════════════════════════════

test('validatePixKey aceita CPF válido', () => {
  const result = validatePixKey('12345678900')
  assert.equal(result.valid, true)
  assert.equal(result.type, 'cpf')
})

test('validatePixKey aceita CNPJ válido', () => {
  const result = validatePixKey('12345678000100')
  assert.equal(result.valid, true)
  assert.equal(result.type, 'cnpj')
})

test('validatePixKey aceita email', () => {
  const result = validatePixKey('pix@empresa.com')
  assert.equal(result.valid, true)
  assert.equal(result.type, 'email')
})

test('validatePixKey aceita telefone com +55', () => {
  const result = validatePixKey('+5512999998888')
  assert.equal(result.valid, true)
  assert.equal(result.type, 'telefone')
})

test('validatePixKey aceita chave aleatória UUID v4', () => {
  const result = validatePixKey('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
  assert.equal(result.valid, true)
  assert.equal(result.type, 'chave_aleatoria')
})

test('validatePixKey rejeita string inválida', () => {
  const result = validatePixKey('abc123')
  assert.equal(result.valid, false)
  assert.equal(result.type, 'desconhecido')
})

test('validatePixKey rejeita CPF com menos dígitos', () => {
  const result = validatePixKey('1234567890')
  assert.equal(result.valid, false)
})

test('validatePixKey aplica normalização antes de validar', () => {
  const result = validatePixKey('123.456.789-00')
  assert.equal(result.valid, true)
  assert.equal(result.type, 'cpf')
})

test('PIX_PATTERNS cobre 5 tipos', () => {
  assert.equal(PIX_PATTERNS.length, 5)
})

// ═══════════════════════════════════════════════════════════════
// mapMercadoPagoStatus
// ═══════════════════════════════════════════════════════════════

test('approved → ativo', () => {
  const result = mapMercadoPagoStatus('approved')
  assert.equal(result.paymentStatus, 'approved')
  assert.equal(result.orderStatus, 'completed')
  assert.equal(result.restaurantPaymentStatus, 'ativo')
})

test('pending → aguardando', () => {
  const result = mapMercadoPagoStatus('pending')
  assert.equal(result.paymentStatus, 'pending')
  assert.equal(result.orderStatus, 'processing')
  assert.equal(result.restaurantPaymentStatus, 'aguardando')
})

test('in_process → aguardando', () => {
  const result = mapMercadoPagoStatus('in_process')
  assert.equal(result.paymentStatus, 'pending')
  assert.equal(result.restaurantPaymentStatus, 'aguardando')
})

test('authorized → aguardando', () => {
  const result = mapMercadoPagoStatus('authorized')
  assert.equal(result.paymentStatus, 'pending')
})

test('rejected → cancelado', () => {
  const result = mapMercadoPagoStatus('rejected')
  assert.equal(result.paymentStatus, 'rejected')
  assert.equal(result.orderStatus, 'cancelled')
  assert.equal(result.restaurantPaymentStatus, 'cancelado')
})

test('string desconhecida → cancelado (fallback seguro)', () => {
  const result = mapMercadoPagoStatus('weird_status')
  assert.equal(result.paymentStatus, 'rejected')
  assert.equal(result.restaurantPaymentStatus, 'cancelado')
})

test('null → cancelado (fallback seguro)', () => {
  const result = mapMercadoPagoStatus(null)
  assert.equal(result.paymentStatus, 'rejected')
})

test('undefined → cancelado (fallback seguro)', () => {
  const result = mapMercadoPagoStatus(undefined)
  assert.equal(result.paymentStatus, 'rejected')
})
