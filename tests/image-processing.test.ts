import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { MAX_WEB_IMAGE_BYTES, optimizeUploadImage } from '../src/lib/image-processing'

test('uploaded images are converted to WebP below the 500 KB hard limit', async () => {
  const width = 1200
  const height = 1200
  const source = await sharp(randomBytes(width * height * 3), {
    raw: { width, height, channels: 3 },
  }).png().toBuffer()
  const uploadDir = await mkdtemp(path.join(os.tmpdir(), 'mushroomie-image-'))

  try {
    const result = await optimizeUploadImage({
      buffer: source,
      declaredMime: 'image/png',
      purpose: 'product',
      uploadDir,
    })
    const output = await readFile(path.join(uploadDir, result.filename))
    const metadata = await sharp(output).metadata()

    assert.equal(metadata.format, 'webp')
    assert.ok(output.length <= MAX_WEB_IMAGE_BYTES)
    assert.ok((metadata.width || 0) <= 1200)
  } finally {
    await rm(uploadDir, { recursive: true, force: true })
  }
})
