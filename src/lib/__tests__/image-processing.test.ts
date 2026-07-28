import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import { normalizeUploadPurpose, optimizeUploadImage } from '@/lib/image-processing'

const temporaryDirectories: string[] = []

async function createTemporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mushroomie-image-test-'))
  temporaryDirectories.push(directory)
  return directory
}

describe('safe upload image processing', () => {
  afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
  })

  it.each([
    ['banner', 'banner'],
    ['product', 'product'],
    ['blog', 'post'],
    ['CATEGORY', 'category'],
    ['user', 'avatar'],
    ['media', 'media'],
    ['unknown', 'default'],
    [null, 'default'],
  ] as const)('normalizes upload purpose %s', (input, expected) => {
    expect(normalizeUploadPurpose(input)).toBe(expected)
  })

  it('converts an allowed image to stripped WebP with a random public filename and bounded width', async () => {
    const uploadDir = await createTemporaryDirectory()
    const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#e41d1d' } }).png().toBuffer()

    const result = await optimizeUploadImage({ buffer, declaredMime: 'image/png', purpose: 'category', uploadDir })
    const output = await readFile(path.join(uploadDir, result.filename))
    const metadata = await sharp(output).metadata()

    expect(result.url).toMatch(/^\/uploads\/[0-9a-f-]+\.webp$/)
    expect(result.filename).toMatch(/^[0-9a-f-]+\.webp$/)
    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(512)
    expect(metadata.height).toBe(384)
  })

  it('applies a safe crop before resize without enlarging the result', async () => {
    const uploadDir = await createTemporaryDirectory()
    const buffer = await sharp({ create: { width: 100, height: 80, channels: 3, background: '#fff7f2' } }).jpeg().toBuffer()

    const result = await optimizeUploadImage({
      buffer,
      declaredMime: 'image/jpeg',
      purpose: 'product',
      uploadDir,
      cropData: { x: 10.4, y: 5.4, width: 40.2, height: 30.2 },
    })

    expect(result.width).toBe(40)
    expect(result.height).toBe(30)
  })

  it.each([
    [Buffer.alloc(0), 'image/png', /empty/],
    [Buffer.from('not-an-image'), 'image/png', /signature/],
    [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'text/html', /MIME/],
  ])('rejects unsafe upload input', async (buffer, declaredMime, error) => {
    const uploadDir = await createTemporaryDirectory()
    await expect(optimizeUploadImage({ buffer, declaredMime, purpose: 'default', uploadDir })).rejects.toThrow(error)
  })

  it('rejects payloads above the 25 MB limit before decoding', async () => {
    const uploadDir = await createTemporaryDirectory()
    await expect(optimizeUploadImage({
      buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
      declaredMime: 'image/png',
      purpose: 'default',
      uploadDir,
    })).rejects.toThrow(/25 MB/)
  })
})
