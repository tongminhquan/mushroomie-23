export function getAuthErrorStatus(error: unknown): 401 | 403 | null {
  if (!(error instanceof Error)) return null
  if (error.message === 'UNAUTHORIZED') return 401
  if (error.message === 'FORBIDDEN') return 403
  return null
}
