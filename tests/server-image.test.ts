import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5'

import {
  inspectImageForRender,
  resolveResponsiveArticleImagesForRender,
} from '../src/lib/server-image'

const uploadRoot = path.join(process.cwd(), 'public', 'uploads')
const uploadSrc = '/uploads/0468a5e4-e424-4c40-8a4e-0ad5b77f8b92.webp'

function collectImageAttributes(html: string) {
  const fragment = parseFragment(html)
  const images: Array<Record<string, string>> = []

  function visit(node: DefaultTreeAdapterTypes.ParentNode) {
    for (const child of node.childNodes) {
      if (!('tagName' in child)) continue
      if (child.tagName === 'img') {
        images.push(Object.fromEntries(child.attrs.map((attribute) => [attribute.name, attribute.value])))
      }
      visit(child)
    }
  }

  visit(fragment)
  return images
}

test('inspectImageForRender reports natural upload dimensions', async () => {
  const result = await inspectImageForRender(uploadSrc, 'post', { uploadRoot })

  assert.equal(result.exists, true)
  assert.equal(result.width, 1920)
  assert.equal(result.height, 1080)
})

test('responsive article resolver keeps article metadata and emits upload srcset', async () => {
  const src = uploadSrc
  {
    const html = `<img src="${src}" alt="Vòng tay custom" title="Mẫu mới" class="rounded" width="960" height="960">`
    const result = await resolveResponsiveArticleImagesForRender(html, 'post', { uploadRoot })
    const [attributes] = collectImageAttributes(result)
    const responsiveWidths = (attributes.srcset || '')
      .split(',')
      .map((candidate) => Number(candidate.match(/[?&]w=(\d+)/)?.[1] || 0))
      .filter(Boolean)

    assert.equal(attributes.src, src)
    assert.match(attributes.srcset, /\/_next\/image/)
    assert.equal(attributes.sizes, '(max-width: 767px) calc(100vw - 2.5rem), 480px')
    assert.ok(responsiveWidths.some((width) => width <= 640))
    assert.equal(attributes.width, '1920')
    assert.equal(attributes.height, '1080')
    assert.equal(attributes.alt, 'Vòng tay custom')
    assert.equal(attributes.title, 'Mẫu mới')
    assert.equal(attributes.class, 'rounded')
    assert.equal(attributes.loading, 'lazy')
    assert.equal(attributes.decoding, 'async')
  }
})

test('responsive article resolver structurally handles quoted greater-than signs and fake src text', async () => {
  const src = uploadSrc
  {
    const html = [
      `<img alt="1 > 0" src="${src}" title="comparison">`,
      `<img alt='label with fake src="/uploads/fake.webp"' src="${src}" class="real-image">`,
    ].join('')
    const result = await resolveResponsiveArticleImagesForRender(html, 'post', { uploadRoot })
    const images = collectImageAttributes(result)

    assert.equal(images.length, 2)
    assert.equal(images[0].alt, '1 > 0')
    assert.equal(images[0].src, src)
    assert.equal(images[0].title, 'comparison')
    assert.equal(images[1].alt, 'label with fake src="/uploads/fake.webp"')
    assert.equal(images[1].src, src)
    assert.equal(images[1].class, 'real-image')
  }
})

test('responsive article resolver removes incorrect dimensions when metadata is unavailable', async () => {
  const html = '<img src="https://example.com/article.webp" alt="vong tay handmade - phu kien handmade ca nhan hoa Mushroomie" width="960" height="960" loading="lazy" decoding="async">'
  const result = await resolveResponsiveArticleImagesForRender(html, 'post')

  const [attributes] = collectImageAttributes(result)

  assert.equal(attributes.alt, 'vong tay handmade trong bộ ảnh sản phẩm Mushroomie')
  assert.equal(attributes.width, undefined)
  assert.equal(attributes.height, undefined)
  assert.equal(attributes.srcset, undefined)
  assert.equal(attributes.loading, 'lazy')
  assert.equal(attributes.decoding, 'async')
})

test('responsive article resolver replaces generated keyword-stuffed alt copy', async () => {
  const html = `<img src="${uploadSrc}" alt="vong tay handmade - phu kien handmade ca nhan hoa Mushroomie">`
  const result = await resolveResponsiveArticleImagesForRender(html, 'post', { uploadRoot })
  const [attributes] = collectImageAttributes(result)

  assert.equal(attributes.alt, 'vong tay handmade trong bộ ảnh sản phẩm Mushroomie')
})
