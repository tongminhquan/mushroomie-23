import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { createGameToken, hashGameToken, isScoreReasonable, verifyGameToken } from '../src/lib/game-server'
import { isPrivateHost } from '../src/lib/wordpress-auto-poster'

const secret = 'test-secret-that-is-at-least-32-characters'

test('game token is bound to user and game', () => {
  const token = createGameToken(42, 'tetris', secret)
  assert.equal(verifyGameToken(token, 42, 'tetris', secret).ok, true)
  assert.equal(verifyGameToken(token, 41, 'tetris', secret).ok, false)
  assert.equal(verifyGameToken(token, 42, 'block-blast', secret).ok, false)
})

test('game token rejects tampering and expiry', () => {
  const token = createGameToken(42, 'tetris', secret)
  assert.equal(verifyGameToken(`${token}0`, 42, 'tetris', secret).ok, false)

  const payload = `42:tetris:${Date.now() - 3 * 60 * 60 * 1000}:${crypto.randomUUID()}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  assert.equal(verifyGameToken(`${payload}.${signature}`, 42, 'tetris', secret).ok, false)
})

test('game token hash is stable and scores have server-side limits', () => {
  const token = createGameToken(42, 'tetris', secret)
  assert.equal(hashGameToken(token), hashGameToken(token))
  assert.equal(isScoreReasonable('tetris', 1_000_001, 60_000), false)
  assert.equal(isScoreReasonable('tetris', 1000, 1000), false)
  assert.equal(isScoreReasonable('tetris', 1000, 10_000), true)
})

test('WordPress destination filter blocks private and reserved networks', () => {
  for (const host of [
    'localhost',
    '127.0.0.1',
    '10.0.0.1',
    '100.64.0.1',
    '169.254.1.1',
    '172.16.0.1',
    '192.168.1.1',
    '198.18.0.1',
    '203.0.113.1',
    '::1',
    'fc00::1',
    '::ffff:127.0.0.1',
  ]) {
    assert.equal(isPrivateHost(host), true, host)
  }
  assert.equal(isPrivateHost('8.8.8.8'), false)
})
