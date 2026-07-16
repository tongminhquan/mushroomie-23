import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/seo-assets'

test('ảnh social mặc định tồn tại với kích thước metadata chính xác', async () => {
  const metadata = await sharp(join(process.cwd(), 'public', DEFAULT_SOCIAL_IMAGE.path)).metadata()

  assert.equal(metadata.width, DEFAULT_SOCIAL_IMAGE.width)
  assert.equal(metadata.height, DEFAULT_SOCIAL_IMAGE.height)
  assert.equal(metadata.format, 'webp')
})
