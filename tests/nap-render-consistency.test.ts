import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ownedRenderFiles = {
  contact: resolve(process.cwd(), 'src', 'app', '(user)', 'lien-he', 'page.tsx'),
  footer: resolve(process.cwd(), 'src', 'components', 'layout', 'Footer.tsx'),
  landing: resolve(process.cwd(), 'src', 'components', 'local', 'LocalLandingPage.tsx'),
}

const source = Object.fromEntries(
  Object.entries(ownedRenderFiles).map(([name, file]) => [name, readFileSync(file, 'utf8')]),
)

test('mọi điểm hiển thị NAP dùng BRAND thay vì bản sao hardcode', () => {
  for (const [name, contents] of Object.entries(source)) {
    assert.match(contents, /BRAND\.name/, `${name} chưa dùng tên thương hiệu chung`)
    assert.match(contents, /BRAND\.formattedAddress/, `${name} chưa dùng địa chỉ hiển thị chung`)
    assert.doesNotMatch(contents, /0947 192 590|0947192590|cskh@mushroomie\.io\.vn/, `${name} còn hardcode phone/email`)
  }

  assert.match(source.contact, /BRAND\.phoneDisplay/)
  assert.match(source.contact, /email=\{BRAND\.email\}/)
  assert.match(source.footer, /BRAND\.phoneDisplay/)
  assert.match(source.footer, /email=\{BRAND\.email\}/)
  assert.match(source.landing, /BRAND\.phoneDisplay/)
})

test('contact và Footer dùng map/social canonical từ BRAND', () => {
  assert.match(source.contact, /<iframe/)
  assert.match(source.contact, /src=\{BRAND\.mapEmbedUrl\}/)
  assert.match(source.contact, /loading="lazy"/)
  assert.match(source.contact, /href=\{BRAND\.directionsUrl\}/)
  assert.match(source.contact, /BRAND\.nearbyLandmarks\.map/)
  assert.match(source.landing, /href=\{BRAND\.directionsUrl\}/)
  assert.match(source.landing, /BRAND\.nearbyLandmarks\.map/)
  assert.doesNotMatch(source.contact, /10\.9955388|106\.8820431/)

  for (const platform of ['facebook', 'instagram', 'tiktok', 'shopee']) {
    assert.match(source.contact, new RegExp(`BRAND\\.socials\\.${platform}`))
    assert.match(source.footer, new RegExp(`BRAND\\.socials\\.${platform}`))
  }

  assert.doesNotMatch(source.footer, /https:\/\/www\.tiktok\.com\/@mushr00mie(?:["'])/)
})

test('landing page không hứa mọi sản phẩm đều hỗ trợ cá nhân hóa', () => {
  assert.doesNotMatch(source.landing, /Tất cả sản phẩm đều[\s\S]*có thể <strong>cá nhân hóa<\/strong>/)
  assert.match(source.landing, /Nhiều mẫu hỗ trợ <strong>cá nhân hóa<\/strong>/)
})
