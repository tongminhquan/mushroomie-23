const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const TRANSIENT_RETRY_CAP_MS = DAY_MS

export const INSPECTION_DELAYS_MS = [
  DAY_MS,
  3 * DAY_MS,
  7 * DAY_MS,
] as const

export interface ComputeNextAttemptInput {
  kind: 'inspection' | 'transient'
  attemptCount: number
  now: Date
  random: () => number
}

export interface ComputeNextInspectionAttemptInput {
  contentUpdatedAt: Date
  lastInspectedAt: Date | null
  now: Date
}

function boundedAttemptCount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

function boundedRandom(random: () => number): number {
  const sample = random()
  if (!Number.isFinite(sample)) return 0.5
  return Math.min(1, Math.max(0, sample))
}

export function computeNextAttempt({
  kind,
  attemptCount,
  now,
  random,
}: ComputeNextAttemptInput): Date {
  const normalizedAttemptCount = boundedAttemptCount(attemptCount)

  if (kind === 'inspection') {
    if (normalizedAttemptCount === 0) {
      return new Date(now.getTime())
    }

    const delayIndex = Math.min(
      normalizedAttemptCount - 1,
      INSPECTION_DELAYS_MS.length - 1,
    )
    return new Date(now.getTime() + INSPECTION_DELAYS_MS[delayIndex])
  }

  const exponentialDelay = MINUTE_MS * (2 ** Math.max(0, normalizedAttemptCount - 1))
  const baseDelay = Math.min(TRANSIENT_RETRY_CAP_MS, exponentialDelay)
  const jitterMultiplier = 0.75 + (boundedRandom(random) * 0.5)
  const delay = Math.min(
    TRANSIENT_RETRY_CAP_MS,
    Math.round(baseDelay * jitterMultiplier),
  )

  return new Date(now.getTime() + delay)
}

export function computeNextInspectionAttempt({
  contentUpdatedAt,
  lastInspectedAt,
  now,
}: ComputeNextInspectionAttemptInput): Date {
  const nowTime = now.getTime()
  const contentUpdatedTime = contentUpdatedAt.getTime()
  if (
    lastInspectedAt === null
    || lastInspectedAt.getTime() < contentUpdatedTime
  ) {
    return new Date(nowTime)
  }

  for (const delay of INSPECTION_DELAYS_MS) {
    const milestone = contentUpdatedTime + delay
    if (milestone > nowTime) return new Date(milestone)
  }

  return new Date(nowTime + INSPECTION_DELAYS_MS.at(-1)!)
}
