import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

process.env.AUTH_SECRET ||= 'vitest-only-auth-secret-at-least-32-characters'
process.env.NEXTAUTH_SECRET ||= process.env.AUTH_SECRET
process.env.NEXT_PUBLIC_APP_URL ||= 'https://mushroomie.io.vn'
process.env.NEXT_PUBLIC_SITE_URL ||= 'https://mushroomie.io.vn'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
