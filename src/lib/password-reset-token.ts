import { createHash, randomBytes } from 'node:crypto'

const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/

export function createPasswordResetToken() {
  return randomBytes(32).toString('hex')
}

export function isValidPasswordResetToken(value: unknown): value is string {
  return typeof value === 'string' && RESET_TOKEN_PATTERN.test(value)
}

export function hashPasswordResetToken(token: string) {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`
}

export function getPasswordResetLookupTokens(token: string) {
  if (!isValidPasswordResetToken(token)) return []

  // Keep the raw candidate temporarily so links issued before this hardening
  // change remain usable until their one-hour expiry.
  return [hashPasswordResetToken(token), token]
}
