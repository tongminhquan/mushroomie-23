const SENSITIVE_KEYS = /signature|secret|token|authorization|account(number)?|bank(sub)?acc/i
const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'x-api-key',
  'api-key',
  'x-webhook-secret',
  'x-casso-signature',
  'x-sepay-signature',
  'cookie',
  'payos-signature',
])

export function redactWebhookPayload(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]'
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactWebhookPayload(item, depth + 1))
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 500) return `${value.slice(0, 500)}...[truncated]`
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.test(key) ? '[redacted]' : redactWebhookPayload(item, depth + 1),
    ]),
  )
}

export function sanitizeWebhookHeaders(headers: Headers) {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value
  })
  return result
}

export function extractOrderCodes(content: string, prefix: string): string[] {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = content.toUpperCase().match(new RegExp(`${escapedPrefix}[\\-\\s]*[A-Z0-9]+`, 'g')) || []

  return [...new Set(matches.map((match) => {
    const cleanMatch = match.replace(/[\-\s]/g, '')
    return `${prefix.toUpperCase()}-${cleanMatch.slice(prefix.length)}`
  }))]
}
