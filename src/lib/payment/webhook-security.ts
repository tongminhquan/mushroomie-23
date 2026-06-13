const SENSITIVE_KEYS = /signature|secret|token|authorization|account(number)?|bank(sub)?acc/i

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
