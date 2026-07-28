import { describe, expect, it } from 'vitest'
import { isSafeAvatarPath } from '@/lib/avatar'

describe('avatar path validation', () => {
  it('accepts only local WebP files inside the public uploads URL space', () => {
    expect(isSafeAvatarPath('/uploads/550e8400-e29b-41d4-a716-446655440000.webp')).toBe(true)

    for (const unsafe of [
      'https://evil.example/avatar.webp',
      '/uploads/../secret.webp',
      '/uploads/avatar.png',
      '/public/uploads/avatar.webp',
      '/uploads/subdirectory/avatar.webp',
      '',
      null,
    ]) {
      expect(isSafeAvatarPath(unsafe)).toBe(false)
    }
  })
})
