import type { Post } from '@prisma/client'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BulkImportRow, ParseResult } from '@/lib/bulk-import'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  requireAdmin: vi.fn(),
  logAdminAction: vi.fn(),
  optimizeUploadImage: vi.fn(),
  parseBulkImportFile: vi.fn(),
  postFindMany: vi.fn(),
  postCreate: vi.fn(),
  postUpdate: vi.fn(),
  postTagUpsert: vi.fn(),
  postTagMapUpsert: vi.fn(),
  transaction: vi.fn(),
  recordAndRevalidatePublication: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
  requireAdmin: mocks.requireAdmin,
}))

vi.mock('@/lib/admin-logger', () => ({
  logAdminAction: mocks.logAdminAction,
}))

vi.mock('@/lib/image-processing', () => ({
  optimizeUploadImage: mocks.optimizeUploadImage,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: mocks.postFindMany,
      create: mocks.postCreate,
      update: mocks.postUpdate,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/bulk-import', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/bulk-import')>()
  return {
    ...actual,
    parseBulkImportFile: mocks.parseBulkImportFile,
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock('@/lib/seo-discovery/publication', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/seo-discovery/publication')>()
  return {
    ...actual,
    recordAndRevalidatePublication: mocks.recordAndRevalidatePublication,
  }
})

import { POST as bulkImportPosts } from '@/app/api/posts/bulk-import/route'
import { POST as bulkPosts } from '@/app/api/posts/bulk/route'

const PUBLICATION_STATE_SELECT = {
  status: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  featured_image: true,
  featured_image_alt: true,
  featured_image_caption: true,
  featured_image_description: true,
  category_id: true,
  seo_title: true,
  meta_description: true,
  focus_keyword: true,
  published_at: true,
  og_title: true,
  og_description: true,
  og_image: true,
  twitter_title: true,
  twitter_description: true,
  twitter_image: true,
  canonical_url: true,
  robots_index: true,
  robots_follow: true,
  schema_type: true,
  secondary_keywords: true,
  reading_time: true,
  word_count: true,
} as const

const transactionClient = {
  post: {
    create: mocks.postCreate,
    update: mocks.postUpdate,
  },
  postTag: {
    upsert: mocks.postTagUpsert,
  },
  postTagMap: {
    upsert: mocks.postTagMapUpsert,
  },
}

const initialDate = new Date('2026-08-01T02:00:00.000Z')
const savedDate = new Date('2026-08-10T03:00:00.000Z')

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: 41,
    title: 'BÃ i viáº¿t cÅ©',
    slug: 'bai-viet-cu',
    excerpt: 'MÃ´ táº£ cÅ©',
    content: '<p>Ná»™i dung cÅ©</p>',
    featured_image: '/uploads/old.webp',
    featured_image_alt: 'Alt cÅ©',
    featured_image_caption: null,
    featured_image_description: null,
    status: 'published',
    category_id: 3,
    seo_title: 'SEO cÅ©',
    meta_description: 'Meta cÅ©',
    focus_keyword: 'tá»« khÃ³a cÅ©',
    author_id: 7,
    published_at: initialDate,
    created_at: initialDate,
    updated_at: initialDate,
    og_title: 'OG cÅ©',
    og_description: 'OG description cÅ©',
    og_image: '/uploads/old-og.webp',
    twitter_title: 'Twitter cÅ©',
    twitter_description: 'Twitter description cÅ©',
    twitter_image: '/uploads/old-twitter.webp',
    canonical_url: 'https://mushroomie.io.vn/tin-tuc/bai-viet-cu',
    robots_index: true,
    robots_follow: true,
    schema_type: 'BlogPosting',
    secondary_keywords: 'tá»« khÃ³a phá»¥ cÅ©',
    reading_time: 2,
    word_count: 300,
    deleted_at: null,
    status_before_trash: null,
    ...overrides,
  }
}

function importRow(overrides: Partial<BulkImportRow> = {}): BulkImportRow {
  return {
    index: 1,
    title: 'BÃ i import',
    content: '<p>Ná»™i dung import</p>',
    ma_bai: '',
    featured_image_url: '',
    category: '',
    tags: [],
    status: 'published',
    publish_date: null,
    slug: 'bai-viet-cu',
    meta_description: 'Meta import',
    seo_title: 'SEO import',
    focus_keyword: 'tá»« khÃ³a import',
    secondary_keywords: 'tá»« khÃ³a phá»¥ import',
    canonical_url: '',
    robots_index: true,
    robots_follow: true,
    featured_image_alt: '',
    warnings: [],
    featuredImageFile: null,
    contentImageFiles: [],
    ...overrides,
  }
}

function parseResult(row: BulkImportRow): ParseResult {
  return {
    rows: [row],
    errors: [],
    unmatchedImages: [],
  }
}

function bulkImportRequest(): NextRequest {
  const form = new FormData()
  form.set('mode', 'commit')
  form.set('file', new File(['ignored'], 'posts.csv', { type: 'text/csv' }))

  return new NextRequest('https://mushroomie.test/api/posts/bulk-import', {
    method: 'POST',
    body: form,
  })
}

function bulkPublishRequest(): NextRequest {
  return new NextRequest('https://mushroomie.test/api/posts/bulk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'publish', ids: [41, 42] }),
  })
}

let sequence: string[]

beforeEach(() => {
  vi.resetAllMocks()
  sequence = []

  mocks.auth.mockResolvedValue({ user: { id: '7', role: 'admin' } })
  mocks.requireAdmin.mockResolvedValue({ user: { id: '7', role: 'admin' } })
  mocks.postTagUpsert.mockResolvedValue({ id: 19, name: 'Charm', slug: 'charm' })
  mocks.postTagMapUpsert.mockResolvedValue({ post_id: 41, tag_id: 19 })
  mocks.transaction.mockImplementation(async (
    operation: (client: typeof transactionClient) => Promise<unknown>,
  ) => {
    const result = await operation(transactionClient)
    sequence.push('commit')
    return result
  })
  mocks.logAdminAction.mockImplementation(async () => {
    sequence.push('log')
  })
  mocks.recordAndRevalidatePublication.mockImplementation(async () => {
    sequence.push('publication')
    return { recorded: true }
  })
})

async function executeImport({
  row = importRow(),
  existing,
  saved,
}: {
  row?: BulkImportRow
  existing?: Post
  saved: Post
}) {
  mocks.parseBulkImportFile.mockResolvedValue(parseResult(row))
  mocks.postFindMany.mockResolvedValue(existing ? [existing] : [])
  if (existing) {
    mocks.postUpdate.mockResolvedValue(saved)
  } else {
    mocks.postCreate.mockResolvedValue(saved)
  }

  return bulkImportPosts(bulkImportRequest())
}

describe('bulk post import publication runtime', () => {
  it('records a newly committed published row as created using the saved row', async () => {
    const saved = post({
      id: 52,
      slug: 'slug-tra-ve-tu-db',
      title: 'BÃ i má»›i Ä‘Ã£ lÆ°u',
      updated_at: savedDate,
    })

    const response = await executeImport({
      row: importRow({ slug: 'slug-tu-request' }),
      saved,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      results: [{ action: 'created', slug: saved.slug }],
      summary: { created: 1, updated: 0, failed: 0 },
    })
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'post',
      sourceId: saved.id,
      url: 'https://mushroomie.io.vn/tin-tuc/slug-tra-ve-tu-db',
      contentUpdatedAt: saved.updated_at,
      reason: 'created',
    })
    expect(sequence).toEqual(['commit', 'log', 'publication'])
  })

  it('loads the exact old publication state required by the shared predicate', async () => {
    const existing = post({ status: 'draft' })
    const saved = post({ status: 'published', updated_at: savedDate })

    const response = await executeImport({ existing, saved })

    expect(response.status).toBe(200)
    expect(mocks.postFindMany).toHaveBeenCalledWith({
      where: { slug: { in: ['bai-viet-cu'] } },
      select: PUBLICATION_STATE_SELECT,
    })
  })

  it('records a non-public to published transition with the published reason', async () => {
    const existing = post({ status: 'draft' })
    const saved = post({ status: 'published', updated_at: savedDate })

    await executeImport({ existing, saved })

    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'published' }),
    )
  })

  it('records an existing published row only when a retained field materially changes', async () => {
    const existing = post()
    const saved = post({
      title: 'BÃ i viáº¿t Ä‘Ã£ sá»­a',
      slug: 'slug-db-sau-khi-luu',
      updated_at: savedDate,
    })

    await executeImport({ existing, saved })

    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'post',
      sourceId: saved.id,
      url: 'https://mushroomie.io.vn/tin-tuc/slug-db-sau-khi-luu',
      contentUpdatedAt: saved.updated_at,
      reason: 'updated',
    })
  })

  it('does not record an unchanged published row even when updated_at changes', async () => {
    const existing = post()
    const saved = post({ updated_at: savedDate })

    await executeImport({ existing, saved })

    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
    expect(sequence).toEqual(['commit', 'log'])
  })

  it('does not record a saved non-public row', async () => {
    const existing = post()
    const saved = post({ status: 'draft', updated_at: savedDate })

    await executeImport({
      row: importRow({ status: 'draft' }),
      existing,
      saved,
    })

    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
  })

  it('does not record or report success when tag work rejects the row transaction', async () => {
    const existing = post({ status: 'draft' })
    const saved = post({ status: 'published', updated_at: savedDate })
    mocks.postTagUpsert.mockRejectedValue(new Error('tag transaction failure'))

    const response = await executeImport({
      row: importRow({ tags: ['Charm'] }),
      existing,
      saved,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      results: [{ action: 'error', message: 'tag transaction failure' }],
      summary: { created: 0, updated: 0, failed: 1 },
    })
    expect(mocks.postTagMapUpsert).not.toHaveBeenCalled()
    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
    expect(sequence).toEqual(['log'])
  })
})

describe('bulk post publication runtime', () => {
  it('drains only the committed returned-row event once before a partial failure response', async () => {
    const firstSaved = post({
      id: 41,
      slug: 'row-da-commit',
      updated_at: savedDate,
    })
    mocks.postFindMany.mockResolvedValue([
      { id: 41, status: 'draft', status_before_trash: null, published_at: null },
      { id: 42, status: 'draft', status_before_trash: null, published_at: null },
    ])
    mocks.postUpdate
      .mockResolvedValueOnce(firstSaved)
      .mockRejectedValueOnce(new Error('second update failed'))

    const response = await bulkPosts(bulkPublishRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Server error' })
    expect(mocks.logAdminAction).not.toHaveBeenCalled()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'post',
      sourceId: firstSaved.id,
      url: 'https://mushroomie.io.vn/tin-tuc/row-da-commit',
      contentUpdatedAt: firstSaved.updated_at,
      reason: 'published',
    })
    expect(sequence).toEqual(['publication'])
  })
})
