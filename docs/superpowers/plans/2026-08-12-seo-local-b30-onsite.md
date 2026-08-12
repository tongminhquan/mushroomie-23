# SEO Local B30 On-site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến đặc tả B30 thành registry 30 truy vấn/23 owner URL có type, bổ sung đúng bảy secondary intent, củng cố internal-link cluster, metadata và tín hiệu sitemap mà không tạo doorway page hoặc làm nặng public bundle.

**Architecture:** Tạo một registry thuần dữ liệu, không phụ thuộc React/Prisma/GSC, làm nguồn sự thật cho query ownership. Nội dung và metadata vẫn sống trong `local-seo.ts`; một module link-graph thuần server tạo area-hub link và vòng cluster theo khu vực để mọi owner có ít nhất ba nguồn liên kết nội bộ với anchor đa dạng. Sitemap dùng `lastModified` mới để reconciliation hiện hữu reset đúng 23 URL, không thêm migration hoặc hàng đợi SEO thứ hai.

**Tech Stack:** TypeScript, Next.js 16.2.11 App Router/Server Components, React server rendering, Node test runner qua `tsx --test`, Vitest cho boundary tests, Prisma hiện hữu chỉ ở sitemap runtime.

## Global Constraints

- Giữ đúng 30 truy vấn, 23 owner URL, 23 primary và 7 secondary trong đặc tả đã duyệt.
- Không tạo thêm route/doorway page cho bảy secondary query.
- Xưởng thật ở Trảng Dài, Đồng Nai; TP.HCM chỉ là khu vực giao online, không được mô tả là location/cửa hàng.
- Mỗi query có đúng một canonical owner; không đưa primary query của owner khác vào title/H1.
- Mỗi owner nhận ít nhất ba incoming contextual links; exact-match anchor không vượt 40% trong tập link do B30 tạo.
- Không thêm `use client`, dependency, schema/migration, admin/GSC/worker import vào public graph.
- Metadata phải có canonical tuyệt đối, meta description tham chiếu 140–165 ký tự và JSON-LD từ NAP thật.
- Thay đổi material phải cập nhật local sitemap `lastModified` thành `2026-08-12T00:00:00.000Z`.
- Không dùng Indexing API; sitemap reconciliation và URL Inspection hiện hữu là đường indexation duy nhất.
- Product card vẫn giữ tỷ lệ 3:4; auth/payment/upload/voucher/order không nằm trong phạm vi thay đổi.

---

## File Structure

- Create `src/lib/local-seo-b30.ts`: registry thuần dữ liệu và helper tra cứu B30.
- Create `src/lib/local-seo-link-graph.ts`: tính contextual links và area-hub members, không chứa UI.
- Modify `src/lib/local-seo.ts`: gắn content-section ID, bảy secondary section, metadata và lastmod.
- Modify `src/components/local/LocalLandingPage.tsx`: render cluster/hub links từ helper server-only.
- Modify `src/components/home/landing/HomeLocalAreas.tsx`: hiển thị bốn area hub và bốn featured owner, không render 23 card.
- Modify `src/app/(user)/lien-he/page.tsx`: dùng hub/featured links có anchor khác homepage.
- Modify `src/app/sitemap.ts`: không đổi thuật toán; chỉ được hưởng lastmod từ `local-seo.ts`.
- Create `tests/local-seo-b30-registry.test.ts`: khóa mapping, owner, section và local truth.
- Create `tests/local-seo-b30-content.test.ts`: khóa visible secondary content và metadata.
- Create `tests/local-seo-b30-link-graph.test.ts`: khóa inbound count, cluster truth và anchor diversity.
- Modify `tests/local-seo.test.ts`, `tests/local-area-content.test.ts`, `tests/priority-local-link-sources.test.ts`, `tests/sitemap-post-inclusion.test.ts`: cập nhật contract liên quan mà không nới gate cũ.
- Modify `tests/seo-discovery-performance-boundaries.test.ts`: chứng minh B30 không kéo private/admin/GSC code vào public graph.

### Task 1: Canonical B30 registry

**Files:**
- Create: `src/lib/local-seo-b30.ts`
- Create: `tests/local-seo-b30-registry.test.ts`

**Interfaces:**
- Consumes: không phụ thuộc module dự án khác.
- Produces: `LOCAL_B30_TARGETS`, `LOCAL_B30_CONTENT_SECTION_IDS`, `getLocalB30Target()`, `getLocalB30TargetsByOwner()`, `LOCAL_B30_OWNER_SLUGS`.

- [ ] **Step 1: Write the failing registry contract**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  LOCAL_B30_OWNER_SLUGS,
  LOCAL_B30_TARGETS,
  getLocalB30TargetsByOwner,
} from '../src/lib/local-seo-b30'
import { PUBLISHED_LOCAL_SLUGS, getLocalPage } from '../src/lib/local-seo'

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

test('B30 has exactly 30 unique queries, 23 primary owners and 7 secondary queries', () => {
  assert.equal(LOCAL_B30_TARGETS.length, 30)
  assert.deepEqual(LOCAL_B30_TARGETS.map((target) => target.id), Array.from({ length: 30 }, (_, i) => i + 1))
  assert.equal(new Set(LOCAL_B30_TARGETS.map((target) => normalize(target.query))).size, 30)
  assert.equal(LOCAL_B30_TARGETS.filter((target) => target.role === 'primary').length, 23)
  assert.equal(LOCAL_B30_TARGETS.filter((target) => target.role === 'secondary').length, 7)
  assert.equal(LOCAL_B30_OWNER_SLUGS.length, 23)
})

test('every target owns one published canonical route', () => {
  const published = new Set<string>(PUBLISHED_LOCAL_SLUGS)
  for (const target of LOCAL_B30_TARGETS) {
    assert.equal(target.ownerHref, `/${target.ownerSlug}`)
    assert.ok(published.has(target.ownerSlug))
    assert.ok(existsSync(resolve('src', 'app', '(user)', target.ownerSlug, 'page.tsx')))
    assert.ok(getLocalPage(target.ownerSlug))
  }
})

test('only secondary targets name a visible content section', () => {
  for (const target of LOCAL_B30_TARGETS) {
    if (target.role === 'secondary') assert.ok(target.contentSectionId)
    else assert.equal(target.contentSectionId, undefined)
    assert.ok(getLocalB30TargetsByOwner(target.ownerSlug).includes(target))
  }
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/local-seo-b30-registry.test.ts`

Expected: FAIL with `Cannot find module '../src/lib/local-seo-b30'`.

- [ ] **Step 3: Implement the complete typed registry**

```ts
export type LocalB30Area = 'Đồng Nai' | 'Biên Hòa' | 'Trảng Dài' | 'TP.HCM'
export type LocalB30Role = 'primary' | 'secondary'
export type LocalB30Intent = 'commercial' | 'transactional' | 'local-navigation'

export const LOCAL_B30_CONTENT_SECTION_IDS = [
  'bracelet-made-to-order-dong-nai',
  'bracelet-name-dong-nai',
  'keychain-custom-dong-nai',
  'birthday-gift-dong-nai',
  'lover-gift-dong-nai',
  'bracelet-charm-dong-nai',
  'bracelet-shop-dong-nai',
] as const

export type LocalB30ContentSectionId = typeof LOCAL_B30_CONTENT_SECTION_IDS[number]

export interface LocalB30Target {
  id: number
  query: string
  ownerSlug: string
  ownerHref: `/${string}`
  role: LocalB30Role
  area: LocalB30Area
  intent: LocalB30Intent
  contentSectionId?: LocalB30ContentSectionId
}

export const LOCAL_B30_TARGETS = [
  { id: 1, query: 'phụ kiện handmade Đồng Nai', ownerSlug: 'phu-kien-handmade-dong-nai', ownerHref: '/phu-kien-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 2, query: 'shop phụ kiện handmade Đồng Nai', ownerSlug: 'shop-phu-kien-handmade-dong-nai', ownerHref: '/shop-phu-kien-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'local-navigation' },
  { id: 3, query: 'phụ kiện handmade Biên Hòa', ownerSlug: 'phu-kien-handmade-bien-hoa', ownerHref: '/phu-kien-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 4, query: 'phụ kiện handmade TP.HCM', ownerSlug: 'phu-kien-handmade-tphcm', ownerHref: '/phu-kien-handmade-tphcm', role: 'primary', area: 'TP.HCM', intent: 'commercial' },
  { id: 5, query: 'vòng tay handmade Đồng Nai', ownerSlug: 'vong-tay-handmade-dong-nai', ownerHref: '/vong-tay-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 6, query: 'vòng tay custom Đồng Nai', ownerSlug: 'vong-tay-custom-dong-nai', ownerHref: '/vong-tay-custom-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 7, query: 'vòng tay custom Biên Hòa', ownerSlug: 'vong-tay-custom-bien-hoa', ownerHref: '/vong-tay-custom-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'transactional' },
  { id: 8, query: 'móc khóa handmade Đồng Nai', ownerSlug: 'moc-khoa-handmade-dong-nai', ownerHref: '/moc-khoa-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 9, query: 'móc khóa handmade theo yêu cầu Đồng Nai', ownerSlug: 'moc-khoa-handmade-theo-yeu-cau-dong-nai', ownerHref: '/moc-khoa-handmade-theo-yeu-cau-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 10, query: 'quà tặng handmade Đồng Nai', ownerSlug: 'qua-tang-handmade-dong-nai', ownerHref: '/qua-tang-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 11, query: 'quà tặng cá nhân hóa Đồng Nai', ownerSlug: 'qua-tang-ca-nhan-hoa-dong-nai', ownerHref: '/qua-tang-ca-nhan-hoa-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 12, query: 'phụ kiện handmade Trảng Dài', ownerSlug: 'phu-kien-handmade-trang-dai', ownerHref: '/phu-kien-handmade-trang-dai', role: 'primary', area: 'Trảng Dài', intent: 'commercial' },
  { id: 13, query: 'vòng tay handmade Trảng Dài', ownerSlug: 'vong-tay-handmade-trang-dai', ownerHref: '/vong-tay-handmade-trang-dai', role: 'primary', area: 'Trảng Dài', intent: 'commercial' },
  { id: 14, query: 'shop phụ kiện handmade Biên Hòa', ownerSlug: 'shop-phu-kien-handmade-bien-hoa', ownerHref: '/shop-phu-kien-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'local-navigation' },
  { id: 15, query: 'vòng tay handmade Biên Hòa', ownerSlug: 'vong-tay-handmade-bien-hoa', ownerHref: '/vong-tay-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 16, query: 'móc khóa handmade Biên Hòa', ownerSlug: 'moc-khoa-handmade-bien-hoa', ownerHref: '/moc-khoa-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 17, query: 'quà tặng handmade Biên Hòa', ownerSlug: 'qua-tang-handmade-bien-hoa', ownerHref: '/qua-tang-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 18, query: 'vòng tay custom TP.HCM', ownerSlug: 'vong-tay-custom-tphcm', ownerHref: '/vong-tay-custom-tphcm', role: 'primary', area: 'TP.HCM', intent: 'transactional' },
  { id: 19, query: 'móc khóa handmade TP.HCM', ownerSlug: 'moc-khoa-handmade-tphcm', ownerHref: '/moc-khoa-handmade-tphcm', role: 'primary', area: 'TP.HCM', intent: 'commercial' },
  { id: 20, query: 'quà tặng handmade TP.HCM', ownerSlug: 'qua-tang-handmade-tphcm', ownerHref: '/qua-tang-handmade-tphcm', role: 'primary', area: 'TP.HCM', intent: 'commercial' },
  { id: 21, query: 'vòng tay cặp đôi Đồng Nai', ownerSlug: 'vong-tay-cap-doi-dong-nai', ownerHref: '/vong-tay-cap-doi-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 22, query: 'charm handmade Đồng Nai', ownerSlug: 'charm-handmade-dong-nai', ownerHref: '/charm-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 23, query: 'dây chuyền handmade Đồng Nai', ownerSlug: 'day-chuyen-handmade-dong-nai', ownerHref: '/day-chuyen-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 24, query: 'vòng tay theo yêu cầu Đồng Nai', ownerSlug: 'vong-tay-custom-dong-nai', ownerHref: '/vong-tay-custom-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'transactional', contentSectionId: 'bracelet-made-to-order-dong-nai' },
  { id: 25, query: 'vòng tay handmade theo tên Đồng Nai', ownerSlug: 'vong-tay-custom-dong-nai', ownerHref: '/vong-tay-custom-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'transactional', contentSectionId: 'bracelet-name-dong-nai' },
  { id: 26, query: 'móc khóa custom Đồng Nai', ownerSlug: 'moc-khoa-handmade-theo-yeu-cau-dong-nai', ownerHref: '/moc-khoa-handmade-theo-yeu-cau-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'transactional', contentSectionId: 'keychain-custom-dong-nai' },
  { id: 27, query: 'quà sinh nhật handmade Đồng Nai', ownerSlug: 'qua-tang-handmade-dong-nai', ownerHref: '/qua-tang-handmade-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'commercial', contentSectionId: 'birthday-gift-dong-nai' },
  { id: 28, query: 'quà handmade cho người yêu Đồng Nai', ownerSlug: 'qua-tang-ca-nhan-hoa-dong-nai', ownerHref: '/qua-tang-ca-nhan-hoa-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'commercial', contentSectionId: 'lover-gift-dong-nai' },
  { id: 29, query: 'charm vòng tay Đồng Nai', ownerSlug: 'charm-handmade-dong-nai', ownerHref: '/charm-handmade-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'commercial', contentSectionId: 'bracelet-charm-dong-nai' },
  { id: 30, query: 'shop vòng tay handmade Đồng Nai', ownerSlug: 'vong-tay-handmade-dong-nai', ownerHref: '/vong-tay-handmade-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'local-navigation', contentSectionId: 'bracelet-shop-dong-nai' },
] as const satisfies readonly LocalB30Target[]

export const LOCAL_B30_OWNER_SLUGS = Object.freeze([
  ...new Set(LOCAL_B30_TARGETS.map((target) => target.ownerSlug)),
])

export function getLocalB30Target(query: string): LocalB30Target | undefined {
  const normalized = query.normalize('NFC').trim().toLocaleLowerCase('vi')
  return LOCAL_B30_TARGETS.find((target) => (
    target.query.normalize('NFC').trim().toLocaleLowerCase('vi') === normalized
  ))
}

export function getLocalB30TargetsByOwner(ownerSlug: string): readonly LocalB30Target[] {
  return LOCAL_B30_TARGETS.filter((target) => target.ownerSlug === ownerSlug)
}
```

- [ ] **Step 4: Run focused and baseline tests**

Run:

```bash
npx tsx --test tests/local-seo-b30-registry.test.ts tests/local-seo.test.ts tests/priority-local-keywords.test.ts
```

Expected: all tests PASS; registry reports 30/23/7 exactly.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/local-seo-b30.ts tests/local-seo-b30-registry.test.ts
git diff --cached --check
git commit -m "feat(seo): define canonical local B30 registry"
```

### Task 2: Seven visible secondary-intent sections

**Files:**
- Modify: `src/lib/local-seo.ts:96-125,289-339,403-473,691-710`
- Modify: `src/components/local/LocalLandingPage.tsx:156-169`
- Create: `tests/local-seo-b30-content.test.ts`

**Interfaces:**
- Consumes: `LocalB30ContentSectionId`, `LOCAL_B30_TARGETS` from Task 1.
- Produces: `LocalIntentSection.id` and one visible section for every secondary target.

- [ ] **Step 1: Write failing content-to-registry tests**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import LocalLandingPage from '../src/components/local/LocalLandingPage'
import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'
import { getLocalPage } from '../src/lib/local-seo'

const normalize = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi')

test('every secondary query owns one visible, stable content section', () => {
  for (const target of LOCAL_B30_TARGETS.filter((item) => item.role === 'secondary')) {
    const page = getLocalPage(target.ownerSlug)
    assert.ok(page)
    const section = page.intentSections?.find((item) => item.id === target.contentSectionId)
    assert.ok(section, `${target.query} thiếu section ${target.contentSectionId}`)
    assert.ok(normalize(`${section.title} ${section.body}`).includes(normalize(target.query)))
    const html = normalize(renderToStaticMarkup(createElement(LocalLandingPage, { page })))
    assert.ok(html.includes(normalize(target.query)))
  }
})

test('secondary queries do not become title or H1 owners', () => {
  for (const target of LOCAL_B30_TARGETS.filter((item) => item.role === 'secondary')) {
    const page = getLocalPage(target.ownerSlug)!
    assert.ok(!normalize(page.seoTitle).includes(normalize(target.query)))
    assert.ok(!normalize(page.h1).includes(normalize(target.query)))
  }
})
```

- [ ] **Step 2: Run the content tests and verify RED**

Run: `npx tsx --test tests/local-seo-b30-content.test.ts`

Expected: FAIL because `LocalIntentSection` has no `id` and six owners do not expose all seven mapped sections.

- [ ] **Step 3: Add typed IDs and the exact visible copy**

Add a type-only import and extend the interface:

```ts
import type { LocalB30ContentSectionId } from '@/lib/local-seo-b30'

export interface LocalIntentSection {
  id?: LocalB30ContentSectionId
  title: string
  body: string
}
```

Add these exact section objects to the six owner entries; retain useful existing sections after them:

```ts
const B30_SECONDARY_SECTIONS = {
  'vong-tay-custom-dong-nai': [
    {
      id: 'bracelet-made-to-order-dong-nai',
      title: 'Vòng tay theo yêu cầu Đồng Nai: từ ý tưởng đến mẫu đã chốt',
      body: 'Khi đặt vòng tay theo yêu cầu Đồng Nai, bạn gửi số đo cổ tay, màu chủ đạo, loại hạt, charm và dịp sử dụng. Mushroomie đối chiếu vật liệu đang có, tư vấn cách phối rồi xác nhận mẫu, chi phí và thời gian trước khi làm. Quy trình này giúp yêu cầu cá nhân hóa rõ ràng, tránh hứa vật liệu hoặc lịch giao chưa được kiểm tra.',
    },
    {
      id: 'bracelet-name-dong-nai',
      title: 'Vòng tay handmade theo tên Đồng Nai cần chuẩn bị gì?',
      body: 'Với vòng tay handmade theo tên Đồng Nai, bạn cần kiểm tra chính tả tên hoặc chữ cái, chọn bảng màu, size và biểu tượng đi kèm. Tên dài có thể cần đổi bố cục hoặc dùng chữ viết tắt để vòng vẫn cân đối. Vì đây là sản phẩm cá nhân hóa, Mushroomie sẽ gửi lại nội dung đã nhận để hai bên chốt chính xác trước khi xâu hạt và hoàn thiện.',
    },
  ],
  'moc-khoa-handmade-theo-yeu-cau-dong-nai': [
    {
      id: 'keychain-custom-dong-nai',
      title: 'Móc khóa custom Đồng Nai theo tên, màu và công dụng',
      body: 'Đặt móc khóa custom Đồng Nai nên bắt đầu từ nơi bạn muốn gắn: chìa khóa, balo hay túi xách. Từ đó Mushroomie tư vấn kích thước, kiểu khoen, độ dài, màu hạt, charm và tên phù hợp. Đơn nhóm cần ghi rõ số lượng, phần thiết kế chung và chi tiết riêng từng người; vật liệu, giá và ngày nhận đều được xác nhận trước khi làm.',
    },
  ],
  'qua-tang-handmade-dong-nai': [
    {
      id: 'birthday-gift-dong-nai',
      title: 'Chọn quà sinh nhật handmade Đồng Nai theo người nhận',
      body: 'Một món quà sinh nhật handmade Đồng Nai nên bắt đầu từ phong cách, màu yêu thích, sở thích và độ tuổi của người nhận. Bạn có thể chọn vòng tay, móc khóa hoặc set charm rồi thêm chữ cái, thiệp và cách gói phù hợp. Hãy gửi ngày cần nhận và ngân sách ngay từ đầu để Mushroomie kiểm tra thời gian làm thủ công, vật liệu và phương án giao thực tế.',
    },
  ],
  'qua-tang-ca-nhan-hoa-dong-nai': [
    {
      id: 'lover-gift-dong-nai',
      title: 'Quà handmade cho người yêu Đồng Nai mang dấu ấn riêng',
      body: 'Khi chọn quà handmade cho người yêu Đồng Nai, một chi tiết gắn với câu chuyện chung thường ý nghĩa hơn việc thêm thật nhiều charm. Bạn có thể dùng màu kỷ niệm, chữ cái, ngày đặc biệt hoặc biểu tượng hai người cùng hiểu. Mushroomie tư vấn cách đưa chi tiết đó vào vòng tay, móc khóa hay set quà và chốt nội dung thiệp trước khi hoàn thiện.',
    },
  ],
  'charm-handmade-dong-nai': [
    {
      id: 'bracelet-charm-dong-nai',
      title: 'Charm vòng tay Đồng Nai: chọn đúng khoen và cách phối',
      body: 'Khi tìm charm vòng tay Đồng Nai, bạn nên gửi ảnh vòng hiện có và kích thước điểm gắn để kiểm tra độ tương thích. Charm quá nặng hoặc khoen không đúng cỡ có thể làm vòng mất cân đối. Mushroomie tư vấn chủ đề, màu, số lượng charm và khoảng cách phối; bạn có thể mua charm rời khi phù hợp hoặc đặt phối lại thành một set hoàn chỉnh.',
    },
  ],
  'vong-tay-handmade-dong-nai': [
    {
      id: 'bracelet-shop-dong-nai',
      title: 'Shop vòng tay handmade Đồng Nai: xem mẫu và đặt đúng size',
      body: 'Nếu bạn tìm shop vòng tay handmade Đồng Nai, Mushroomie có mẫu hạt, charm, vòng đôi và nhận phối theo gu tại xưởng Trảng Dài. Bạn có thể xem mẫu trên website, gửi số đo cổ tay và nhắn màu mong muốn để được tư vấn. Việc hẹn nhận trực tiếp chỉ được chốt sau khi đơn đã hoàn thiện; khách ở xa vẫn có thể đặt online và giao hàng.',
    },
  ],
} as const
```

Do not create this object as a second runtime source. Copy each array into the matching `LocalPage.intentSections`; the code block is the exact copy contract.

Use a stable rendering key:

```tsx
<article key={section.id ?? section.title}>
```

- [ ] **Step 4: Run focused content and anti-doorway tests**

Run:

```bash
npx tsx --test tests/local-seo-b30-content.test.ts tests/local-area-content.test.ts tests/local-seo.test.ts
```

Expected: all PASS; pairwise 5-gram overlap remains `<= 0.35`; TP.HCM storefront assertions remain green.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/lib/local-seo.ts src/components/local/LocalLandingPage.tsx tests/local-seo-b30-content.test.ts
git diff --cached --check
git commit -m "feat(seo): cover seven B30 secondary intents"
```

### Task 3: Balanced local link graph and area hubs

**Files:**
- Create: `src/lib/local-seo-link-graph.ts`
- Modify: `src/components/local/LocalLandingPage.tsx:22-29,252-276`
- Modify: `src/components/home/landing/HomeLocalAreas.tsx:10-24`
- Modify: `src/app/(user)/lien-he/page.tsx:11-15,264-284`
- Create: `tests/local-seo-b30-link-graph.test.ts`
- Modify: `tests/priority-local-link-sources.test.ts`

**Interfaces:**
- Consumes: `PUBLISHED_LOCAL_PAGES`, `LocalPage`.
- Produces: `getLocalDiscoveryLinks(sourceSlug)`, `getLocalHubForPage(sourceSlug)`, `getLocalHubMemberLinks(hubSlug)`, `LOCAL_AREA_HUBS`.

- [ ] **Step 1: Write failing graph invariants**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { PUBLISHED_LOCAL_PAGES } from '../src/lib/local-seo'
import {
  LOCAL_AREA_HUBS,
  getLocalDiscoveryLinks,
  getLocalHubForPage,
  getLocalHubMemberLinks,
} from '../src/lib/local-seo-link-graph'
import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

test('every owner receives at least three distinct contextual landing links', () => {
  const incoming = new Map(PUBLISHED_LOCAL_PAGES.map((page) => [page.slug, new Set<string>()]))
  for (const source of PUBLISHED_LOCAL_PAGES) {
    for (const link of getLocalDiscoveryLinks(source.slug)) {
      incoming.get(link.slug)?.add(source.slug)
    }
  }
  for (const [slug, sources] of incoming) {
    assert.ok(sources.size >= 3, `${slug} chỉ có ${sources.size} nguồn contextual`)
  }
})

test('every non-hub owner links back to its truthful area hub', () => {
  for (const source of PUBLISHED_LOCAL_PAGES) {
    const hub = getLocalHubForPage(source.slug)
    assert.ok(hub)
    if (source.slug !== hub.slug) {
      assert.ok(getLocalDiscoveryLinks(source.slug).some((link) => link.slug === hub.slug))
    }
  }
})

test('exact-match anchors stay at or below 40 percent per owner', () => {
  for (const target of LOCAL_B30_TARGETS.filter((item) => item.role === 'primary')) {
    const labels = PUBLISHED_LOCAL_PAGES.flatMap((source) => (
      [...getLocalDiscoveryLinks(source.slug), ...getLocalHubMemberLinks(source.slug)]
        .filter((link) => link.slug === target.ownerSlug)
        .map((link) => link.label)
    ))
    assert.ok(labels.length >= 3)
    const exact = labels.filter((label) => normalize(label) === normalize(target.query)).length
    assert.ok(exact / labels.length <= 0.4, `${target.query}: ${exact}/${labels.length}`)
  }
})

test('hubs expose every member in their truthful service cluster', () => {
  assert.deepEqual(LOCAL_AREA_HUBS.map((hub) => hub.slug), [
    'phu-kien-handmade-dong-nai',
    'phu-kien-handmade-trang-dai',
    'phu-kien-handmade-bien-hoa',
    'phu-kien-handmade-tphcm',
  ])
  for (const hub of LOCAL_AREA_HUBS) {
    assert.ok(getLocalHubMembers(hub.slug).every((page) => page.slug !== hub.slug))
  }
})

test('TP.HCM discovery links only describe online delivery pages', () => {
  const hcm = PUBLISHED_LOCAL_PAGES.filter((page) => page.area === 'TP.HCM')
  assert.ok(hcm.every((page) => page.onlineOnly === true))
})
```

- [ ] **Step 2: Run graph test and verify RED**

Run: `npx tsx --test tests/local-seo-b30-link-graph.test.ts`

Expected: FAIL because the module does not exist; current hardcoded graph also has seven owners with zero inbound links.

- [ ] **Step 3: Implement the pure graph**

```ts
import {
  PUBLISHED_LOCAL_PAGES,
  type LocalArea,
  type LocalPage,
} from '@/lib/local-seo'

export const LOCAL_AREA_HUBS = [
  { slug: 'phu-kien-handmade-dong-nai', label: 'Phụ kiện handmade Đồng Nai', area: 'Đồng Nai' },
  { slug: 'phu-kien-handmade-trang-dai', label: 'Phụ kiện handmade Trảng Dài', area: 'Trảng Dài' },
  { slug: 'phu-kien-handmade-bien-hoa', label: 'Phụ kiện handmade Biên Hòa', area: 'Biên Hòa' },
  { slug: 'phu-kien-handmade-tphcm', label: 'Phụ kiện handmade giao TP.HCM', area: 'TP.HCM' },
] as const satisfies readonly { slug: string; label: string; area: LocalArea }[]

function clusterKey(page: LocalPage): string {
  return page.area === 'Trảng Dài' ? 'Đồng Nai' : page.area
}

export interface LocalDiscoveryLink {
  slug: string
  href: `/${string}`
  label: string
}

function uniquePages(pages: readonly LocalPage[]): LocalPage[] {
  const seen = new Set<string>()
  return pages.filter((page) => !seen.has(page.slug) && Boolean(seen.add(page.slug)))
}

export function getLocalHubForPage(sourceSlug: string) {
  const source = PUBLISHED_LOCAL_PAGES.find((page) => page.slug === sourceSlug)
  if (!source) return undefined
  const area = source.area === 'Trảng Dài' ? 'Trảng Dài' : source.area
  return LOCAL_AREA_HUBS.find((hub) => hub.area === area)
}

function productLabel(page: LocalPage): string {
  if (page.group === 'vong-tay') return 'vòng tay handmade'
  if (page.group === 'moc-khoa') return 'móc khóa và charm'
  if (page.group === 'qua-tang') return 'quà tặng handmade'
  return 'phụ kiện handmade'
}

function linkLabel(source: LocalPage, target: LocalPage, cluster: readonly LocalPage[]): string {
  const sourceIndex = cluster.findIndex((page) => page.slug === source.slug)
  const targetIndex = cluster.findIndex((page) => page.slug === target.slug)
  const forwardDistance = sourceIndex >= 0 && targetIndex >= 0
    ? (targetIndex - sourceIndex + cluster.length) % cluster.length
    : -1
  if (forwardDistance === 3) return target.crumb
  if (forwardDistance % 2 === 0) return `Xem ${productLabel(target)} Mushroomie phục vụ ${target.area}`
  return `Khám phá ${target.serviceType.toLocaleLowerCase('vi')} tại ${target.area}`
}

export function getLocalDiscoveryLinks(sourceSlug: string): LocalDiscoveryLink[] {
  const source = PUBLISHED_LOCAL_PAGES.find((page) => page.slug === sourceSlug)
  if (!source) return []
  const cluster = PUBLISHED_LOCAL_PAGES.filter((page) => clusterKey(page) === clusterKey(source))
  const sourceIndex = cluster.findIndex((page) => page.slug === source.slug)
  const ring = [1, 2, 3]
    .map((offset) => cluster[(sourceIndex + offset) % cluster.length])
    .filter((page): page is LocalPage => Boolean(page) && page.slug !== source.slug)
  const hub = getLocalHubForPage(sourceSlug)
  const hubPage = hub
    ? PUBLISHED_LOCAL_PAGES.find((page) => page.slug === hub.slug)
    : undefined
  return uniquePages([...(hubPage ? [hubPage] : []), ...ring])
    .filter((page) => page.slug !== source.slug)
    .slice(0, 6)
    .map((page) => ({
      slug: page.slug,
      href: `/${page.slug}`,
      label: linkLabel(source, page, cluster),
    }))
}

function getLocalHubMembers(hubSlug: string): LocalPage[] {
  const hub = LOCAL_AREA_HUBS.find((item) => item.slug === hubSlug)
  if (!hub) return []
  return PUBLISHED_LOCAL_PAGES.filter((page) => {
    if (page.slug === hub.slug) return false
    if (hub.area === 'Đồng Nai') return page.area === 'Đồng Nai'
    return page.area === hub.area
  })
}

export function getLocalHubMemberLinks(hubSlug: string): LocalDiscoveryLink[] {
  return getLocalHubMembers(hubSlug).map((page) => ({
    slug: page.slug,
    href: `/${page.slug}`,
    label: `Xem ${productLabel(page)} Mushroomie dành cho ${page.area}`,
  }))
}
```

- [ ] **Step 4: Wire the graph into server-rendered UI**

In `LocalLandingPage`, replace `getRelatedPages(page.slug)` with `getLocalDiscoveryLinks(page.slug)` and render `link.label`. On hub pages, render the already-labelled compact list from `getLocalHubMemberLinks(page.slug)` after the area note and use `prefetch={false}` to avoid eager route prefetches. Do not replace those labels with `r.crumb`; the exported helper deliberately keeps hub-directory anchors non-exact so the 40% gate remains true.

In `HomeLocalAreas`, render the four `LOCAL_AREA_HUBS` first and the existing four featured cards second. The final order must be:

```ts
[
  '/phu-kien-handmade-dong-nai',
  '/phu-kien-handmade-trang-dai',
  '/phu-kien-handmade-bien-hoa',
  '/phu-kien-handmade-tphcm',
  '/vong-tay-handmade-dong-nai',
  '/vong-tay-custom-bien-hoa',
  '/moc-khoa-handmade-dong-nai',
  '/qua-tang-handmade-dong-nai',
]
```

In contact, use the same four hubs plus the four featured links, but preserve different anchor copy (`Khám phá…`, `Đặt…`, `Xem…`) and `min-h-11` tap targets. Keep Footer free of the 23-link directory.

- [ ] **Step 5: Verify graph, SSR markup and legacy source contracts**

Run:

```bash
npx tsx --test tests/local-seo-b30-link-graph.test.ts tests/priority-local-link-sources.test.ts tests/local-seo.test.ts
```

Expected: all PASS; every owner has at least three distinct landing sources; homepage/contact render eight bounded links; footer still renders none of the local directory links.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/lib/local-seo-link-graph.ts src/components/local/LocalLandingPage.tsx src/components/home/landing/HomeLocalAreas.tsx "src/app/(user)/lien-he/page.tsx" tests/local-seo-b30-link-graph.test.ts tests/priority-local-link-sources.test.ts
git diff --cached --check
git commit -m "feat(seo): balance B30 local discovery links"
```

### Task 4: Metadata and material-change timestamps

**Files:**
- Modify: `src/lib/local-seo.ts:164-175,202-732`
- Modify: `tests/local-seo.test.ts`
- Modify: `tests/local-seo-b30-content.test.ts`
- Modify: `tests/priority-local-keywords.test.ts:34-58`

**Interfaces:**
- Consumes: `LOCAL_B30_TARGETS`, existing `LocalPage` records.
- Produces: 23 descriptions in range and one deterministic material-change timestamp.

- [ ] **Step 1: Add failing metadata and timestamp gates**

```ts
test('all 23 owners have useful metadata in the reference range', () => {
  for (const page of PUBLISHED_LOCAL_PAGES) {
    const primary = LOCAL_B30_TARGETS.find((target) => (
      target.role === 'primary' && target.ownerSlug === page.slug
    ))
    assert.ok(primary)
    assert.ok(page.seoTitle.toLocaleLowerCase('vi').includes(primary.query.toLocaleLowerCase('vi')))
    assert.ok(page.seoTitle.length >= 50 && page.seoTitle.length <= 60)
    assert.ok(page.metaDescription.length >= 140, `${page.slug}: ${page.metaDescription.length}`)
    assert.ok(page.metaDescription.length <= 165, `${page.slug}: ${page.metaDescription.length}`)
    assert.ok(page.metaDescription.includes('Mushroomie'))
  }
})

test('all B30 owner lastmod values reflect the material release', () => {
  for (const slug of LOCAL_B30_OWNER_SLUGS) {
    assert.equal(getLocalSeoLastModified(slug).toISOString(), '2026-08-12T00:00:00.000Z')
  }
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/local-seo-b30-content.test.ts tests/local-seo.test.ts`

Expected: FAIL because 18 descriptions are outside 140–165 and existing lastmods are July dates.

- [ ] **Step 3: Apply the exact metadata copy**

Keep the four currently valid descriptions for `vong-tay-handmade-dong-nai`, `vong-tay-custom-bien-hoa`, `moc-khoa-handmade-dong-nai`, `qua-tang-handmade-dong-nai`. Replace the other descriptions with these exact strings (the first row also supersedes its old 136-character value):

```ts
const B30_META_COPY = {
  'phu-kien-handmade-dong-nai': 'Khám phá phụ kiện handmade Mushroomie tại Đồng Nai: vòng tay, móc khóa, charm và quà tặng custom theo màu sắc, kiểu dáng, cá tính riêng. Xem mẫu.',
  'shop-phu-kien-handmade-dong-nai': 'Mushroomie là shop phụ kiện handmade tại Đồng Nai, chuyên vòng tay custom, móc khóa, charm và hộp quà cá nhân hóa; đặt online, tư vấn theo gu.',
  'phu-kien-handmade-bien-hoa': 'Mushroomie phục vụ phụ kiện handmade tại Biên Hòa: vòng tay, móc khóa, charm và set quà phối thủ công theo sở thích, giao thuận tiện từ Trảng Dài.',
  'phu-kien-handmade-tphcm': 'Mushroomie nhận đặt phụ kiện handmade giao TP.HCM: vòng tay custom, móc khóa, charm và set quà nhỏ xinh; tư vấn, chốt mẫu online trước khi làm.',
  'vong-tay-custom-dong-nai': 'Mushroomie nhận làm vòng tay custom tại Đồng Nai: chọn màu, charm, size, kiểu dáng và tên theo sở thích; được tư vấn, chốt mẫu trước khi làm.',
  'moc-khoa-handmade-theo-yeu-cau-dong-nai': 'Đặt móc khóa handmade theo yêu cầu tại Đồng Nai cùng Mushroomie: chọn màu, charm, tên và kiểu khoen; được tư vấn, chốt mẫu trước khi làm. Xem mẫu.',
  'qua-tang-ca-nhan-hoa-dong-nai': 'Đặt quà tặng cá nhân hóa tại Đồng Nai cùng Mushroomie: chọn vòng tay, móc khóa, màu, charm, thiệp và cách gói theo người nhận, dịp tặng. Xem gợi ý.',
  'phu-kien-handmade-trang-dai': 'Mushroomie làm phụ kiện handmade tại Trảng Dài, Đồng Nai: vòng tay, móc khóa, charm và quà custom; thuận tiện đặt online hoặc hẹn nhận. Xem mẫu gần bạn.',
  'vong-tay-handmade-trang-dai': 'Vòng tay handmade Mushroomie tại Trảng Dài, Đồng Nai: phối hạt và charm thủ công, chọn màu, đo size, chốt mẫu rồi hẹn giao hoặc nhận. Xem cách đo size.',
  'shop-phu-kien-handmade-bien-hoa': 'Mushroomie là shop phụ kiện handmade phục vụ Biên Hòa: vòng tay custom, móc khóa, charm và quà cá nhân hóa; đặt online từ xưởng Trảng Dài. Xem mẫu.',
  'vong-tay-handmade-bien-hoa': 'Vòng tay handmade Mushroomie phục vụ Biên Hòa: phối hạt và charm thủ công, chọn màu, đo size, chốt mẫu rồi giao thuận tiện từ Trảng Dài. Xem mẫu.',
  'moc-khoa-handmade-bien-hoa': 'Móc khóa handmade Mushroomie phục vụ Biên Hòa: phối hạt, charm, tên và kiểu khoen cho balo, túi hoặc quà nhóm; chốt mẫu trước khi làm. Xem mẫu custom.',
  'qua-tang-handmade-bien-hoa': 'Quà tặng handmade Mushroomie phục vụ Biên Hòa: vòng tay, móc khóa, charm và hộp quà custom theo người nhận, dịp tặng; giao từ Trảng Dài. Xem gợi ý quà.',
  'vong-tay-custom-tphcm': 'Mushroomie nhận làm vòng tay custom giao TP.HCM: chọn màu, charm, size, tên và kiểu phối theo sở thích; đặt online, chốt mẫu trước khi làm. Xem mẫu.',
  'moc-khoa-handmade-tphcm': 'Móc khóa handmade Mushroomie giao TP.HCM: phối hạt, charm, tên và kiểu khoen cho balo, túi hoặc làm quà; đặt online, chốt mẫu trước khi làm.',
  'qua-tang-handmade-tphcm': 'Quà tặng handmade Mushroomie giao TP.HCM: vòng tay, móc khóa, charm, thiệp và hộp quà custom theo dịp, người nhận; đặt online tiện lợi. Xem gợi ý quà.',
  'vong-tay-cap-doi-dong-nai': 'Mushroomie làm vòng tay cặp đôi và bạn thân tại Đồng Nai: đo size, phối màu, charm và tên riêng; chốt set trước khi làm để lưu giữ kỷ niệm. Xem mẫu set đôi.',
  'charm-handmade-dong-nai': 'Charm handmade Mushroomie tại Đồng Nai: chọn mẫu cute để phối vòng tay, móc khóa hoặc trang trí; mua charm rời hay đặt phối set theo gu riêng.',
  'day-chuyen-handmade-dong-nai': 'Dây chuyền và vòng cổ handmade Mushroomie tại Đồng Nai: phối hạt, charm thủ công; chọn màu, độ dài và kiểu dáng rồi chốt mẫu trước khi làm. Xem mẫu.',
} as const
```

Do not retain `B30_META_COPY` as a second runtime registry. Copy each string into the matching `LocalPage.metaDescription`, then let the length test guard it.

Also replace the one punctuation-broken primary title with the exact 51-character title below so the complete primary query is contiguous:

```ts
seoTitle: 'Móc Khóa Handmade Theo Yêu Cầu Đồng Nai – Làm Riêng',
```

- [ ] **Step 4: Replace lastmod overrides with the material-release date**

```ts
export const LOCAL_SEO_LAST_MODIFIED = new Date('2026-08-12T00:00:00.000Z')

export function getLocalSeoLastModified(_slug: string): Date {
  return LOCAL_SEO_LAST_MODIFIED
}
```

Remove the stale July override map. This is valid because Task 2/3/4 change rendered content or links on all 23 pages.

In `tests/priority-local-keywords.test.ts`, replace the old `2026-07-28T00:00:00.000Z` expectation with `2026-08-12T00:00:00.000Z`; do not remove the assertion.

- [ ] **Step 5: Run metadata, sitemap and legacy tests**

Run:

```bash
npx tsx --test tests/local-seo-b30-content.test.ts tests/local-seo.test.ts tests/priority-local-keywords.test.ts tests/sitemap-post-inclusion.test.ts
```

Expected: all PASS; 23 local URLs expose `2026-08-12` in sitemap data; no post/product sitemap behavior changes.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/lib/local-seo.ts tests/local-seo.test.ts tests/local-seo-b30-content.test.ts tests/priority-local-keywords.test.ts
git diff --cached --check
git commit -m "feat(seo): refresh B30 metadata and lastmod"
```

### Task 5: Public-bundle and source-contract hardening

**Files:**
- Modify: `tests/seo-discovery-performance-boundaries.test.ts`
- Modify: `tests/priority-local-keywords.test.ts`

**Interfaces:**
- Consumes: all Task 1–4 modules.
- Produces: regression proof that public B30 code remains data/server-only and the legacy featured-four UI contract remains intentional.

- [ ] **Step 1: Add explicit B30 import-boundary assertions**

The existing scanner already discovers every public App Router entry recursively. Add a narrower registry-specific assertion so the two canonical B30 data modules cannot silently acquire client, database, admin, worker, or Google SDK dependencies:

```ts
const B30_DATA_ENTRIES = [
  'src/lib/local-seo-b30.ts',
  'src/lib/local-seo-link-graph.ts',
]

const FORBIDDEN_B30_IMPORTS = [
  'google-auth-library',
  '@/lib/seo-discovery/google-gsc-client',
  '@/lib/seo-discovery/worker',
  '@/lib/seo-discovery/admin-api',
  '@/lib/prisma',
  '@/components/admin',
]
```

Assert every reachable import from the two entries excludes every forbidden module. Assert both files omit `'use client'` and remain pure data modules. Keep the existing all-public-entry scan unchanged; it already covers `LocalLandingPage`, `HomeLocalAreas`, and every other public route/layout.

- [ ] **Step 2: Verify the characterization boundary and scanner sensitivity**

Run: `npx tsx --test tests/seo-discovery-performance-boundaries.test.ts`

Expected: PASS after Tasks 1–4 because this is a test-only characterization gate, not new production behavior. Prove the gate is meaningful with an isolated test fixture or parser assertion that contains a forbidden static/dynamic import and is rejected; do not edit a tracked production module merely to manufacture a RED state.

- [ ] **Step 3: Update the legacy featured-four contract without expanding it to 30 cards**

Keep `PRIORITY_LOCAL_KEYWORD_OWNERS` at four featured commercial owners. Change tests to state that it is a UI subset of the canonical B30 registry:

```ts
for (const featured of PRIORITY_LOCAL_KEYWORD_OWNERS) {
  const canonical = LOCAL_B30_TARGETS.find((target) => target.query === featured.keyword)
  assert.ok(canonical)
  assert.equal(canonical.ownerHref, featured.href)
}
assert.equal(PRIORITY_LOCAL_KEYWORD_OWNERS.length, 4)
```

- [ ] **Step 4: Run all on-site focused tests**

Run:

```bash
npx tsx --test tests/local-seo.test.ts tests/local-area-content.test.ts tests/local-seo-b30-registry.test.ts tests/local-seo-b30-content.test.ts tests/local-seo-b30-link-graph.test.ts tests/priority-local-keywords.test.ts tests/priority-local-link-sources.test.ts tests/seo-discovery-performance-boundaries.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add tests/seo-discovery-performance-boundaries.test.ts tests/priority-local-keywords.test.ts
git diff --cached --check
git commit -m "test(seo): guard B30 public bundle boundaries"
```

### Task 6: Full verification and release candidate

**Files:**
- No source changes unless a gate exposes a verified defect.
- Append evidence to: `docs/superpowers/plans/2026-08-12-seo-local-b30-onsite.md` only if the execution workflow records checkmarks/results in-plan.

**Interfaces:**
- Consumes: Task 1–5 commit sequence.
- Produces: a deployable on-site B30 release candidate; not a claim of rank success.

- [ ] **Step 1: Install and regenerate deterministically**

Run:

```bash
npm ci --legacy-peer-deps
npx prisma generate
```

Expected: exit 0; `npm audit --omit=dev` remains 0 vulnerabilities.

- [ ] **Step 2: Run all tests sequentially**

Run:

```bash
npm test
npm run typecheck
npx eslint src/lib/local-seo-b30.ts src/lib/local-seo-link-graph.ts src/lib/local-seo.ts src/components/local/LocalLandingPage.tsx src/components/home/landing/HomeLocalAreas.tsx "src/app/(user)/lien-he/page.tsx" tests/local-seo-b30-registry.test.ts tests/local-seo-b30-content.test.ts tests/local-seo-b30-link-graph.test.ts
```

Expected: all tests/typecheck pass; scoped ESLint has 0 errors and 0 new warnings.

- [ ] **Step 3: Build without a real database**

Run with a process-only unreachable loopback URL, never write it to `.env`:

```powershell
$env:DATABASE_URL='mysql://offline:offline@127.0.0.1:9/mushroomie'; npm run build; Remove-Item Env:DATABASE_URL
```

Expected: Next 16.2.11 compilation/type/static generation succeeds; expected caught Prisma fallback messages are documented, no real DB mutation occurs.

- [ ] **Step 4: Verify generated public behavior locally**

Start the production build and inspect `/`, `/lien-he`, all 23 owner routes and `/sitemap.xml`. Verify:

```text
23/23 HTTP 200
23/23 one H1
23/23 self canonical
23/23 meta description 140–165
23/23 valid LocalBusiness + Service + BreadcrumbList + FAQPage JSON-LD
23/23 sitemap lastModified = 2026-08-12
0 TP.HCM storefront/location claims
0 broken CSS/JS/image request
```

- [ ] **Step 5: Chrome and Lighthouse regression gate**

Use the dedicated Chrome DevTools MCP profile if callable. Check 1440, 1366, 390 and 360 widths; inspect console, failed network requests and horizontal overflow. Run the repository Lighthouse matrix with identical before/after device/network/CPU settings and require no median regression in Performance, LCP, CLS, INP/TBT, JS or CSS. If MCP is unavailable, report the limitation and do not claim browser verification.

- [ ] **Step 6: Freeze the release candidate**

Run:

```bash
git diff --check
git status --short
git log --oneline --decorate -8
```

Expected: clean worktree; five scoped implementation commits after the approved design commits. Do not push or deploy until the user authorizes the release workflow.
