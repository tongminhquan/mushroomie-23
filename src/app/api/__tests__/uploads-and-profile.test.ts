import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  auth: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  optimizeUploadImage: vi.fn(),
  normalizeUploadPurpose: vi.fn(),
  isLimited: vi.fn(),
  getLimitResponse: vi.fn(),
  userUpdate: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: mocks.requireAdmin, requireAuth: mocks.requireAuth, auth: mocks.auth }))
vi.mock('fs/promises', () => ({ readdir: mocks.readdir, stat: mocks.stat, unlink: mocks.unlink }))
vi.mock('fs', () => ({ default: { existsSync: mocks.existsSync, mkdirSync: mocks.mkdirSync } }))
vi.mock('@/lib/image-processing', () => ({
  normalizeUploadPurpose: mocks.normalizeUploadPurpose,
  optimizeUploadImage: mocks.optimizeUploadImage,
}))
vi.mock('@/lib/rate-limit', () => ({
  rateLimiter: { isLimited: mocks.isLimited, getLimitResponse: mocks.getLimitResponse },
}))
vi.mock('@/lib/prisma', () => ({ prisma: { user: { update: mocks.userUpdate } } }))

import { DELETE as deleteUpload, GET as listUploads, POST as uploadImage } from '@/app/api/upload/route'
import { POST as processUpload } from '@/app/api/upload/process/route'
import { PUT as updateAvatar } from '@/app/api/user/update-avatar/route'
import { PUT as updateProfile } from '@/app/api/user/update-profile/route'

describe('upload and profile routes', () => {
  beforeEach(() => {
    mocks.requireAdmin.mockResolvedValue({ user: { id: '1', role: 'admin' } })
    mocks.requireAuth.mockResolvedValue({ user: { id: '1', role: 'admin' } })
    mocks.auth.mockResolvedValue({ user: { id: '7', email: 'buyer@example.com' } })
    mocks.isLimited.mockReturnValue(false)
    mocks.getLimitResponse.mockReturnValue(new Response(null, { status: 429 }))
    mocks.existsSync.mockReturnValue(true)
    mocks.normalizeUploadPurpose.mockReturnValue('product')
  })

  it('protects media listing, upload, and delete operations with admin authentication', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('UNAUTHORIZED'))
    mocks.requireAuth.mockRejectedValue(new Error('UNAUTHORIZED'))

    expect((await listUploads()).status).toBe(401)
    expect((await uploadImage(new Request('https://mushroomie.test/api/upload', { method: 'POST' }))).status).toBe(401)
    expect((await deleteUpload(new Request('https://mushroomie.test/api/upload?filename=item.webp', { method: 'DELETE' }))).status).toBe(401)
    expect((await processUpload(new Request('https://mushroomie.test/api/upload/process', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    }))).status).toBe(401)
    expect(mocks.readdir).not.toHaveBeenCalled()
    expect(mocks.unlink).not.toHaveBeenCalled()
  })

  it('lists only WebP uploads sorted newest first', async () => {
    mocks.readdir.mockResolvedValue(['old.webp', 'ignore.png', 'new.WEBP'])
    mocks.stat
      .mockResolvedValueOnce({ mtimeMs: 10, size: 100, mtime: new Date('2026-01-01') })
      .mockResolvedValueOnce({ mtimeMs: 20, size: 200, mtime: new Date('2026-02-01') })

    const response = await listUploads()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      expect.objectContaining({ filename: 'new.WEBP', id: 20 }),
      expect.objectContaining({ filename: 'old.webp', id: 10 }),
    ])
  })

  it('validates upload presence and returns the optimized upload contract', async () => {
    const noFile = await uploadImage(new Request('https://mushroomie.test/api/upload', {
      method: 'POST', body: new FormData(),
    }))
    expect(noFile.status).toBe(400)

    const data = new FormData()
    data.set('purpose', 'product')
    data.set('file', new File([new Uint8Array([1, 2, 3])], 'item.png', { type: 'image/png' }))
    mocks.optimizeUploadImage.mockResolvedValue({ id: 1, url: '/uploads/id.webp', filename: 'id.webp', size: 3, created_at: '2026-07-19' })

    const response = await uploadImage(new Request('https://mushroomie.test/api/upload', { method: 'POST', body: data }))
    expect(response.status).toBe(200)
    expect(mocks.optimizeUploadImage).toHaveBeenCalledWith(expect.objectContaining({ declaredMime: 'image/png', purpose: 'product' }))
  })

  it('allows a regular user to upload only an avatar image', async () => {
    mocks.requireAuth.mockResolvedValue({ user: { id: '7', role: 'user' } })
    const avatarData = new FormData()
    avatarData.set('purpose', 'avatar')
    avatarData.set('file', new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' }))
    mocks.normalizeUploadPurpose.mockReturnValueOnce('avatar')
    mocks.optimizeUploadImage.mockResolvedValue({ id: 1, url: '/uploads/id.webp', filename: 'id.webp', size: 3, created_at: '2026-07-19' })

    const avatarResponse = await uploadImage(new Request('https://mushroomie.test/api/upload', { method: 'POST', body: avatarData }))
    expect(avatarResponse.status).toBe(200)
    expect(mocks.optimizeUploadImage).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'avatar' }))

    const productData = new FormData()
    productData.set('purpose', 'product')
    productData.set('file', new File([new Uint8Array([1])], 'product.png', { type: 'image/png' }))
    mocks.normalizeUploadPurpose.mockReturnValueOnce('product')
    mocks.optimizeUploadImage.mockClear()

    const productResponse = await uploadImage(new Request('https://mushroomie.test/api/upload', { method: 'POST', body: productData }))
    expect(productResponse.status).toBe(403)
    expect(mocks.optimizeUploadImage).not.toHaveBeenCalled()
  })

  it('blocks traversal filenames before touching the filesystem', async () => {
    const response = await deleteUpload(new Request('https://mushroomie.test/api/upload?filename=..%2Fsecret', { method: 'DELETE' }))
    expect(response.status).toBe(400)
    expect(mocks.unlink).not.toHaveBeenCalled()
  })

  it('requires profile authentication and validates fields before update', async () => {
    mocks.auth.mockResolvedValueOnce(null)
    expect((await updateProfile(new NextRequest('https://mushroomie.test/api/user/update-profile', {
      method: 'PUT', body: JSON.stringify({}), headers: { 'content-type': 'application/json' },
    }))).status).toBe(401)

    expect((await updateProfile(new NextRequest('https://mushroomie.test/api/user/update-profile', {
      method: 'PUT', body: JSON.stringify({ name: 'A', phone: '1', address: 'x' }), headers: { 'content-type': 'application/json' },
    }))).status).toBe(400)
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  it('updates only validated profile fields for the session email', async () => {
    mocks.userUpdate.mockResolvedValue({ name: 'Nguyễn An', phone: '0901234567', address: '123 Đường Nấm' })
    const response = await updateProfile(new NextRequest('https://mushroomie.test/api/user/update-profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Nguyễn An', phone: '0901234567', address: '123 Đường Nấm', avatar: '/uploads/avatar.webp' }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      data: { name: 'Nguyễn An', phone: '0901234567', address: '123 Đường Nấm', avatar: '/uploads/avatar.webp' },
    })
  })

  it('rejects unsafe avatar paths through the general profile update route', async () => {
    const profile = { name: 'Nguyễn An', phone: '0901234567', address: '123 Đường Nấm' }

    for (const avatar of ['https://evil.example/avatar.webp', '/uploads/../secret.webp', '/uploads/avatar.png']) {
      const response = await updateProfile(new NextRequest('https://mushroomie.test/api/user/update-profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...profile, avatar }),
      }))
      expect(response.status).toBe(400)
    }

    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  it('accepts only local WebP upload paths when saving an avatar', async () => {
    for (const avatar of ['https://evil.example/avatar.webp', '/uploads/../secret.webp', '/uploads/avatar.png']) {
      const response = await updateAvatar(new NextRequest('https://mushroomie.test/api/user/update-avatar', {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ avatar }),
      }))
      expect(response.status).toBe(400)
    }
    expect(mocks.userUpdate).not.toHaveBeenCalled()

    const avatar = '/uploads/550e8400-e29b-41d4-a716-446655440000.webp'
    mocks.userUpdate.mockResolvedValue({ avatar })
    const response = await updateAvatar(new NextRequest('https://mushroomie.test/api/user/update-avatar', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ avatar }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      data: { avatar },
    })
  })
})
