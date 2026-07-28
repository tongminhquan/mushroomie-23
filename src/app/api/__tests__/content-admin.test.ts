import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PROTECTED_SUPER_ADMIN_EMAIL } from '@/lib/constants'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  postFindFirst: vi.fn(),
  logAdminAction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/admin-logger', () => ({ logAdminAction: mocks.logAdminAction }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    post: { findFirst: mocks.postFindFirst },
  },
}))

import { PATCH as updateRole } from '@/app/api/users/[id]/role/route'
import { POST as validateSlug } from '@/app/api/posts/validate-slug/route'

function request(body: unknown) {
  return new NextRequest('https://mushroomie.test/api/test', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('content and administrative security routes', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ user: { id: '1', role: 'super_admin' } })
  })

  it('allows only super admins to change roles', async () => {
    mocks.auth.mockResolvedValue({ user: { id: '2', role: 'admin' } })
    const response = await updateRole(request({ role: 'viewer' }), { params: Promise.resolve({ id: '7' }) })
    expect(response.status).toBe(401)
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  it('prevents self-demotion and demotion of the protected root super admin', async () => {
    expect((await updateRole(request({ role: 'admin' }), { params: Promise.resolve({ id: '1' }) })).status).toBe(400)

    mocks.userFindUnique.mockResolvedValue({ id: 7, email: PROTECTED_SUPER_ADMIN_EMAIL, role: 'super_admin' })
    const protectedResponse = await updateRole(request({ role: 'user' }), { params: Promise.resolve({ id: '7' }) })
    expect(protectedResponse.status).toBe(403)
    expect(mocks.userUpdate).not.toHaveBeenCalled()
    expect(mocks.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ details: expect.objectContaining({ reason: expect.stringContaining('SECURITY') }) }))
  })

  it('updates a valid target role and logs the administrative action', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 7, email: 'staff@example.com', role: 'user' })
    mocks.userUpdate.mockResolvedValue({ id: 7, email: 'staff@example.com', role: 'viewer' })
    const response = await updateRole(request({ role: 'viewer' }), { params: Promise.resolve({ id: '7' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, role: 'viewer' })
    expect(mocks.userUpdate).toHaveBeenCalledWith({ where: { id: 7 }, data: { role: 'viewer' } })
  })

  it('requires admin role and a non-empty slug', async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: '7', role: 'user' } })
    expect((await validateSlug(request({ slug: 'post' }))).status).toBe(401)
    expect((await validateSlug(request({ slug: '' }))).status).toBe(400)
  })

  it('suggests the first available numbered slug and supports excludeId', async () => {
    mocks.postFindFirst
      .mockResolvedValueOnce({ id: 1, slug: 'handmade' })
      .mockResolvedValueOnce({ id: 2, slug: 'handmade-2' })
      .mockResolvedValueOnce(null)

    const response = await validateSlug(request({ slug: 'handmade', excludeId: 9 }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ available: false, suggestion: 'handmade-3' })
    expect(mocks.postFindFirst).toHaveBeenNthCalledWith(1, { where: { slug: 'handmade', id: { not: 9 } } })
  })
})
