import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'

import {
  inspectImageForRender,
  resolveResponsiveArticleImagesForRender,
} from '../src/lib/server-image'

async function withUpload<T>(
  contents: Buffer | string,
  callback: (src: string, uploadRoot: string) => Promise<T>,
) {
  const filename = `test-article-media-${randomUUID()}.webp`
  const uploadRoot = await mkdtemp(path.join(os.tmpdir(), 'mushroomie-article-media-'))
  const filePath = path.join(uploadRoot, filename)
  await writeFile(filePath, contents)

  try {
    return await callback(`/uploads/${filename}`, uploadRoot)
  } finally {
    await rm(uploadRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  }
}

test('inspectImageForRender reports natural upload dimensions', async () => {
  const image = await sharp({
    create: { width: 360, height: 240, channels: 3, background: '#e41d1d' },
  }).webp().toBuffer()

  await withUpload(image, async (src, uploadRoot) => {
    const result = await inspectImageForRender(src, 'post', { uploadRoot })

    assert.equal(result.exists, true)
    assert.equal(result.width, 360)
    assert.equal(result.height, 240)
  })
})

test('responsive article resolver keeps article metadata and emits upload srcset', async () => {
  const image = await sharp({
    create: { width: 640, height: 480, channels: 3, background: '#ffd6d6' },
  }).webp().toBuffer()

  await withUpload(image, async (src, uploadRoot) => {
    const html = `<img src="${src}" alt="Vòng tay custom" title="Mẫu mới" class="rounded" width="960" height="960">`
    const result = await resolveResponsiveArticleImagesForRender(html, 'post', { uploadRoot })

    assert.match(result, new RegExp(`src="${src}"`))
    assert.match(result, /srcset="[^"]*\/_next\/image[^"]*"/)
    assert.match(result, /sizes="\(max-width: 767px\) calc\(100vw - 2\.5rem\), 480px"/)
    assert.match(result, /width="640"/)
    assert.match(result, /height="480"/)
    assert.match(result, /alt="Vòng tay custom"/)
    assert.match(result, /title="Mẫu mới"/)
    assert.match(result, /class="rounded"/)
    assert.match(result, /loading="lazy"/)
    assert.match(result, /decoding="async"/)
  })
})

test('responsive article resolver removes incorrect dimensions when metadata is unavailable', async () => {
  const html = '<img src="https://example.com/article.webp" alt="Ảnh tham khảo" width="960" height="960" loading="lazy" decoding="async">'
  const result = await resolveResponsiveArticleImagesForRender(html, 'post')

  assert.doesNotMatch(result, /\bwidth=/)
  assert.doesNotMatch(result, /\bheight=/)
  assert.doesNotMatch(result, /\bsrcset=/)
  assert.match(result, /loading="lazy"/)
  assert.match(result, /decoding="async"/)
})
