// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerRefresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: routerRefresh }) }))
vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    default: (props: Record<string, unknown>) => {
      const { fill, ...imageProps } = props
      void fill
      return React.createElement('img', { ...imageProps, alt: String(imageProps.alt ?? '') })
    },
  }
})

import { AvatarUpload } from '@/components/account/AvatarUpload'

describe('AvatarUpload', () => {
  beforeEach(() => {
    routerRefresh.mockClear()
  })

  it('uploads an avatar purpose, saves only the returned local URL, and refreshes account data', async () => {
    const avatar = '/uploads/550e8400-e29b-41d4-a716-446655440000.webp'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ url: avatar }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, avatar }) })
    vi.stubGlobal('fetch', fetchMock)
    const { container } = render(<AvatarUpload initialAvatar={null} userName="Nguyễn An" />)
    const file = new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' })

    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const firstBody = fetchMock.mock.calls[0][1].body as FormData
    expect(fetchMock.mock.calls[0][0]).toBe('/api/upload')
    expect(firstBody.get('purpose')).toBe('avatar')
    expect(firstBody.get('file')).toBe(file)
    expect(fetchMock.mock.calls[1]).toEqual([
      '/api/user/update-avatar',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ avatar }) }),
    ])
    expect(await screen.findByRole('img', { name: 'Nguyễn An' })).toHaveAttribute('src', avatar)
    expect(routerRefresh).toHaveBeenCalledOnce()
  })
})
