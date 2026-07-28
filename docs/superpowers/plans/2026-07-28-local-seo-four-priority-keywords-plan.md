# Four Priority Local SEO Keywords Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tập trung tín hiệu on-page và internal link của bốn từ khóa local ưu tiên về đúng bốn owner URL mà không tạo thêm doorway page.

**Architecture:** Tạo một owner map thuần TypeScript làm nguồn chân lý cho từ khóa, URL và anchor theo từng vị trí. Trang chủ, liên hệ và footer lấy liên kết từ owner map; danh mục tiếp tục dùng cấu hình `catalog-seo.ts` đã có và được kiểm thử chéo. Landing page, schema và sitemap hiện tại được giữ nguyên trừ khi test chứng minh có sai lệch.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, Node test runner qua `tsx --test`.

## Global Constraints

- Chỉ tối ưu bốn từ khóa: `vòng tay handmade Đồng Nai`, `vòng tay custom Biên Hòa`, `móc khóa handmade Đồng Nai`, `quà tặng handmade Đồng Nai`.
- Không tạo thêm landing page, backlink tự động, review giả, rating giả hoặc địa chỉ giả.
- NAP tiếp tục lấy từ `BRAND` trong `src/lib/local-seo.ts`.
- Không thay đổi auth, checkout, payment, order, voucher hoặc dữ liệu sản phẩm.
- Không dùng `noindex`, redirect hoặc canonical chéo để che cannibalization.
- Không thêm dependency.
- Internal link phải tự nhiên, có biến thể anchor và render server-side.
- ProductCard giữ tỷ lệ ảnh 3:4 nếu xuất hiện trong phạm vi thay đổi.
- Top 5 là mục tiêu đo lường sau 2-8 tuần, không phải cam kết kỹ thuật.

---

## File Structure

- Create `src/lib/priority-local-keywords.ts`: nguồn chân lý cho bốn từ khóa, owner URL và anchor theo ngữ cảnh.
- Create `tests/priority-local-keywords.test.ts`: kiểm tra uniqueness, route xuất bản, metadata, schema URL và helper link.
- Create `tests/priority-local-link-sources.test.ts`: kiểm tra ba nguồn UI bắt buộc dùng owner map chung.
- Modify `src/components/home/landing/HomeLocalAreas.tsx`: thay card non-priority bằng đủ bốn owner ưu tiên.
- Modify `src/app/(user)/lien-he/page.tsx`: hiển thị hub Đồng Nai và đủ bốn owner ưu tiên.
- Modify `src/components/layout/Footer.tsx`: hiển thị hub Đồng Nai và đủ bốn owner ưu tiên từ cùng helper.
- Create `docs/seo-phase-6/local-keyword-owner-baseline-2026-07-28.md`: lưu thứ hạng và URL Google đang chọn trước triển khai.

### Task 1: Tạo owner map và khóa bằng test

**Files:**
- Create: `src/lib/priority-local-keywords.ts`
- Create: `tests/priority-local-keywords.test.ts`
- Reference: `src/lib/local-seo.ts:137-174`
- Reference: `src/lib/local-seo.ts:202-737`

**Interfaces:**
- Produces: `PRIORITY_LOCAL_KEYWORD_OWNERS: readonly PriorityLocalKeywordOwner[]`
- Produces: `getPriorityLocalHomeCards(): PriorityLocalHomeCard[]`
- Produces: `getPriorityLocalLinks(source: 'contact' | 'footer'): PriorityLocalLink[]`
- Consumes: `PUBLISHED_LOCAL_SLUGS`, `getLocalPage`, `getLocalSeoLastModified`, `localServiceSchema`

- [ ] **Step 1: Cài dependency cho worktree**

Run:

```bash
npm ci
npx prisma generate
```

Expected: cả hai lệnh exit code 0; `npx tsx` và Prisma client sẵn sàng cho các bước kiểm thử.

- [ ] **Step 2: Viết test thất bại cho owner map**

Create `tests/priority-local-keywords.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PRIORITY_LOCAL_KEYWORD_OWNERS,
  getPriorityLocalHomeCards,
  getPriorityLocalLinks,
} from '../src/lib/priority-local-keywords'
import {
  PUBLISHED_LOCAL_SLUGS,
  getLocalPage,
  getLocalSeoLastModified,
  localServiceSchema,
} from '../src/lib/local-seo'

const EXPECTED_OWNERS = new Map([
  ['vòng tay handmade Đồng Nai', '/vong-tay-handmade-dong-nai'],
  ['vòng tay custom Biên Hòa', '/vong-tay-custom-bien-hoa'],
  ['móc khóa handmade Đồng Nai', '/moc-khoa-handmade-dong-nai'],
  ['quà tặng handmade Đồng Nai', '/qua-tang-handmade-dong-nai'],
])

test('mỗi từ khóa local ưu tiên chỉ có một owner URL', () => {
  const actualOwners = new Map(
    PRIORITY_LOCAL_KEYWORD_OWNERS.map((owner) => [owner.keyword, owner.href]),
  )

  assert.deepEqual(actualOwners, EXPECTED_OWNERS)
  assert.equal(new Set(actualOwners.keys()).size, 4)
  assert.equal(new Set(actualOwners.values()).size, 4)
})

test('mọi owner URL đều là landing đã xuất bản và tự mô tả đúng ý định', () => {
  const published = new Set<string>(PUBLISHED_LOCAL_SLUGS)

  for (const owner of PRIORITY_LOCAL_KEYWORD_OWNERS) {
    assert.ok(published.has(owner.slug), `${owner.slug} chưa được xuất bản`)
    assert.ok(
      existsSync(resolve(process.cwd(), 'src', 'app', '(user)', owner.slug, 'page.tsx')),
      `${owner.slug} thiếu route`,
    )

    const page = getLocalPage(owner.slug)
    assert.ok(page, `${owner.slug} thiếu cấu hình local SEO`)
    assert.ok(
      page.seoTitle.toLocaleLowerCase('vi').includes(owner.keyword.toLocaleLowerCase('vi')),
      `${owner.slug} có title lệch từ khóa owner`,
    )
    assert.equal(localServiceSchema(page).url, `https://mushroomie.io.vn${owner.href}`)
    assert.equal(getLocalSeoLastModified(owner.slug).toISOString(), '2026-07-28T00:00:00.000Z')

    const routeSource = readFileSync(
      resolve(process.cwd(), 'src', 'app', '(user)', owner.slug, 'page.tsx'),
      'utf8',
    )
    assert.match(routeSource, /alternates:\s*\{\s*canonical:\s*url\s*\}/)
  }
})

test('helper cung cấp đủ bốn owner với anchor khác nhau theo ngữ cảnh', () => {
  const homeCards = getPriorityLocalHomeCards()
  const contactLinks = getPriorityLocalLinks('contact')
  const footerLinks = getPriorityLocalLinks('footer')

  assert.equal(homeCards.length, 4)
  assert.equal(contactLinks.length, 4)
  assert.equal(footerLinks.length, 4)
  assert.deepEqual(
    new Set(homeCards.map((link) => link.href)),
    new Set(EXPECTED_OWNERS.values()),
  )
  assert.deepEqual(
    new Set(contactLinks.map((link) => link.href)),
    new Set(EXPECTED_OWNERS.values()),
  )
  assert.deepEqual(
    new Set(footerLinks.map((link) => link.href)),
    new Set(EXPECTED_OWNERS.values()),
  )

  for (const owner of PRIORITY_LOCAL_KEYWORD_OWNERS) {
    assert.notEqual(owner.home.label, owner.contactLabel)
    assert.notEqual(owner.contactLabel, owner.footerLabel)
  }
})
```

- [ ] **Step 3: Chạy test để xác nhận thất bại**

Run:

```bash
npx tsx --test tests/priority-local-keywords.test.ts
```

Expected: FAIL với `Cannot find module '../src/lib/priority-local-keywords'`.

- [ ] **Step 4: Tạo owner map tối thiểu**

Create `src/lib/priority-local-keywords.ts`:

```ts
export type PriorityLocalLinkSource = 'contact' | 'footer'

export interface PriorityLocalLink {
  href: `/${string}`
  label: string
}

export interface PriorityLocalHomeCard extends PriorityLocalLink {
  emoji: string
  description: string
}

export interface PriorityLocalKeywordOwner {
  keyword: string
  slug: string
  href: `/${string}`
  home: Omit<PriorityLocalHomeCard, 'href'>
  contactLabel: string
  footerLabel: string
}

export const PRIORITY_LOCAL_KEYWORD_OWNERS = [
  {
    keyword: 'vòng tay handmade Đồng Nai',
    slug: 'vong-tay-handmade-dong-nai',
    href: '/vong-tay-handmade-dong-nai',
    home: {
      emoji: '🧵',
      label: 'Vòng tay làm thủ công tại Đồng Nai',
      description: 'Mẫu hạt cườm, charm và vòng đôi có thể chọn theo size',
    },
    contactLabel: 'Xem vòng tay handmade tại Đồng Nai',
    footerLabel: 'Vòng tay handmade Đồng Nai',
  },
  {
    keyword: 'vòng tay custom Biên Hòa',
    slug: 'vong-tay-custom-bien-hoa',
    href: '/vong-tay-custom-bien-hoa',
    home: {
      emoji: '🪄',
      label: 'Vòng tay custom gần Biên Hòa',
      description: 'Đặt theo tên, màu và charm mang dấu ấn riêng',
    },
    contactLabel: 'Đặt vòng tay custom gần Biên Hòa',
    footerLabel: 'Vòng tay custom Biên Hòa',
  },
  {
    keyword: 'móc khóa handmade Đồng Nai',
    slug: 'moc-khoa-handmade-dong-nai',
    href: '/moc-khoa-handmade-dong-nai',
    home: {
      emoji: '🔑',
      label: 'Móc khóa thủ công tại Đồng Nai',
      description: 'Điểm nhấn cho túi, balo và quà tặng nhóm',
    },
    contactLabel: 'Chọn móc khóa handmade tại Đồng Nai',
    footerLabel: 'Móc khóa handmade Đồng Nai',
  },
  {
    keyword: 'quà tặng handmade Đồng Nai',
    slug: 'qua-tang-handmade-dong-nai',
    href: '/qua-tang-handmade-dong-nai',
    home: {
      emoji: '🎁',
      label: 'Quà handmade gửi tại Đồng Nai',
      description: 'Phụ kiện cá nhân hóa, gói quà và thiệp viết tay',
    },
    contactLabel: 'Gợi ý quà handmade giao tại Đồng Nai',
    footerLabel: 'Quà tặng handmade Đồng Nai',
  },
] as const satisfies readonly PriorityLocalKeywordOwner[]

export function getPriorityLocalHomeCards(): PriorityLocalHomeCard[] {
  return PRIORITY_LOCAL_KEYWORD_OWNERS.map((owner) => ({
    href: owner.href,
    label: owner.home.label,
    emoji: owner.home.emoji,
    description: owner.home.description,
  }))
}

export function getPriorityLocalLinks(source: PriorityLocalLinkSource): PriorityLocalLink[] {
  return PRIORITY_LOCAL_KEYWORD_OWNERS.map((owner) => ({
    href: owner.href,
    label: source === 'contact' ? owner.contactLabel : owner.footerLabel,
  }))
}
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run:

```bash
npx tsx --test tests/priority-local-keywords.test.ts tests/local-seo.test.ts
```

Expected: tất cả test PASS.

- [ ] **Step 6: Commit owner map**

```bash
git add src/lib/priority-local-keywords.ts tests/priority-local-keywords.test.ts
git commit -m "seo: define priority local keyword owners"
```

### Task 2: Đồng bộ internal link trên trang chủ, liên hệ và footer

**Files:**
- Modify: `src/components/home/landing/HomeLocalAreas.tsx:1-16`
- Modify: `src/app/(user)/lien-he/page.tsx:1-19`
- Modify: `src/components/layout/Footer.tsx:1-60`
- Create: `tests/priority-local-link-sources.test.ts`

**Interfaces:**
- Consumes: `getPriorityLocalHomeCards()`
- Consumes: `getPriorityLocalLinks('contact' | 'footer')`
- Produces: ba nguồn internal link render đủ bốn owner URL.

- [ ] **Step 1: Viết test thất bại cho ba nguồn internal link**

Create `tests/priority-local-link-sources.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

test('trang chủ dùng owner map chung cho bốn card local ưu tiên', () => {
  const source = readSource('src/components/home/landing/HomeLocalAreas.tsx')
  assert.match(source, /getPriorityLocalHomeCards/)
  assert.doesNotMatch(source, /href:\s*['"]\/vong-tay-custom-dong-nai['"]/)
})

test('trang liên hệ dùng owner map chung thay vì danh sách owner viết tay', () => {
  const source = readSource('src/app/(user)/lien-he/page.tsx')
  assert.match(source, /getPriorityLocalLinks\('contact'\)/)
})

test('footer dùng owner map chung cho nhóm liên kết local', () => {
  const source = readSource('src/components/layout/Footer.tsx')
  assert.match(source, /getPriorityLocalLinks\('footer'\)/)
  assert.match(source, /priorityLocalLinks\.map/)
})
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run:

```bash
npx tsx --test tests/priority-local-link-sources.test.ts
```

Expected: ba test FAIL vì các component chưa dùng helper.

- [ ] **Step 3: Nối trang chủ với owner map**

Modify đầu `src/components/home/landing/HomeLocalAreas.tsx`:

```tsx
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { getPriorityLocalHomeCards } from '@/lib/priority-local-keywords'

const AREAS = [
  {
    href: '/phu-kien-handmade-dong-nai',
    emoji: '🧶',
    label: 'Phụ kiện handmade Đồng Nai',
    description: 'Vòng tay, móc khóa, charm và quà tặng custom',
  },
  ...getPriorityLocalHomeCards(),
  {
    href: '/phu-kien-handmade-bien-hoa',
    emoji: '📍',
    label: 'Phụ kiện handmade gần Biên Hòa',
    description: 'Tư vấn từ xưởng Trảng Dài và giao hàng linh hoạt',
  },
]
```

Trong JSX, đổi `a.desc` thành `a.description`. Kết quả là sáu card: một hub Đồng Nai, bốn owner ưu tiên và một hub Biên Hòa.

- [ ] **Step 4: Nối trang liên hệ với owner map**

Modify phần import và `LOCAL_LINKS` trong `src/app/(user)/lien-he/page.tsx`:

```tsx
import { BRAND } from '@/lib/local-seo'
import { getPriorityLocalLinks } from '@/lib/priority-local-keywords'

const LOCAL_LINKS = [
  { href: '/phu-kien-handmade-dong-nai', label: 'Khám phá phụ kiện handmade tại Đồng Nai' },
  ...getPriorityLocalLinks('contact'),
]
```

Giữ nguyên JSX `LOCAL_LINKS.map` hiện tại.

- [ ] **Step 5: Nối footer với owner map**

Modify đầu `src/components/layout/Footer.tsx`:

```tsx
import { BRAND } from '@/lib/local-seo'
import { getPriorityLocalLinks } from '@/lib/priority-local-keywords'

const priorityLocalLinks = getPriorityLocalLinks('footer')
```

Thay hai `<li>` local viết tay bằng:

```tsx
<li>
  <Link href="/phu-kien-handmade-dong-nai" className="hover:text-white">
    Phụ kiện handmade Đồng Nai
  </Link>
</li>
{priorityLocalLinks.map((link) => (
  <li key={link.href}>
    <Link href={link.href} className="hover:text-white">
      {link.label}
    </Link>
  </li>
))}
```

- [ ] **Step 6: Chạy test liên quan**

Run:

```bash
npx tsx --test tests/priority-local-keywords.test.ts tests/priority-local-link-sources.test.ts tests/local-seo.test.ts tests/catalog-seo.test.ts
```

Expected: tất cả test PASS.

- [ ] **Step 7: Chạy typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit code 0, không có TypeScript error.

- [ ] **Step 8: Commit internal links**

```bash
git add src/components/home/landing/HomeLocalAreas.tsx "src/app/(user)/lien-he/page.tsx" src/components/layout/Footer.tsx tests/priority-local-link-sources.test.ts
git commit -m "seo: consolidate priority local internal links"
```

### Task 3: Lưu baseline và kiểm tra chống cannibalization

**Files:**
- Create: `docs/seo-phase-6/local-keyword-owner-baseline-2026-07-28.md`
- Verify: `src/app/(user)/page.tsx`
- Verify: `src/app/(user)/lien-he/layout.tsx`
- Verify: `src/app/(user)/tin-tuc/page.tsx`

**Interfaces:**
- Consumes: bốn owner URL từ Task 1.
- Produces: baseline có ngày, vị trí quan sát, URL Google chọn và tiêu chí đo lại.

- [ ] **Step 1: Ghi baseline trước triển khai**

Create `docs/seo-phase-6/local-keyword-owner-baseline-2026-07-28.md`:

```markdown
# Baseline owner URL cho 4 từ khóa Local SEO

Ngày ghi nhận: 28/07/2026

| Từ khóa | Vị trí quan sát | URL Google đang chọn | Owner URL |
| --- | ---: | --- | --- |
| vòng tay handmade Đồng Nai | 2 | `/lien-he` | `/vong-tay-handmade-dong-nai` |
| vòng tay custom Biên Hòa | 3 | `/` | `/vong-tay-custom-bien-hoa` |
| móc khóa handmade Đồng Nai | >20, chưa phát hiện | Chưa có | `/moc-khoa-handmade-dong-nai` |
| quà tặng handmade Đồng Nai | 5 | `/tin-tuc` | `/qua-tang-handmade-dong-nai` |

## Cách đánh giá lại

- Đo cùng vị trí địa lý, ngôn ngữ và trạng thái đăng nhập tương đương.
- Ghi cả vị trí và URL Google chọn; owner URL đúng quan trọng hơn một lần dao động thứ hạng.
- Đối chiếu Search Console theo truy vấn và trang trong cửa sổ 28 ngày.
- Đánh giá lần đầu sau 14 ngày và tiếp tục theo dõi đến 8 tuần.
- Không coi một ảnh chụp SERP đơn lẻ là vị trí trung bình chính thức.
```

- [ ] **Step 2: Xác nhận ba trang cạnh tranh không tự nhận owner keyword**

Run:

```bash
git grep -n -I -e "vòng tay handmade Đồng Nai" -e "vòng tay custom Biên Hòa" -e "móc khóa handmade Đồng Nai" -e "quà tặng handmade Đồng Nai" -- "src/app/(user)/page.tsx" "src/app/(user)/lien-he/layout.tsx" "src/app/(user)/tin-tuc/page.tsx"
```

Expected: không có title, canonical hoặc H1 exact-match tự nhận bốn truy vấn. Nếu chỉ có anchor dẫn về owner URL thì giữ nguyên.

- [ ] **Step 3: Commit baseline**

```bash
git add docs/seo-phase-6/local-keyword-owner-baseline-2026-07-28.md
git commit -m "docs: record priority local SEO baseline"
```

### Task 4: Kiểm thử toàn bộ và kiểm tra giao diện

**Files:**
- Verify only: toàn bộ thay đổi từ Task 1-3.

**Interfaces:**
- Consumes: owner map và ba nguồn internal link.
- Produces: bằng chứng test, build và UI sạch.

- [ ] **Step 1: Cài dependency sạch và tạo Prisma client**

Run:

```bash
npm ci
npx prisma generate
```

Expected: cả hai lệnh exit code 0.

- [ ] **Step 2: Đọc hướng dẫn Next.js 16 liên quan trước khi xác nhận metadata**

Run:

```powershell
Get-ChildItem node_modules/next/dist/docs -Recurse -File |
  Where-Object { $_.FullName -match 'metadata|sitemap|robots' } |
  Select-Object -ExpandProperty FullName
```

Expected: xác định tài liệu metadata/sitemap/robots của Next.js 16. Không thay API metadata nếu triển khai hiện tại vẫn đúng tài liệu.

- [ ] **Step 3: Chạy toàn bộ test**

Run:

```bash
npm test
```

Expected: tất cả test PASS.

- [ ] **Step 4: Chạy typecheck và build**

Run:

```bash
npm run typecheck
npm run build
```

Expected: cả hai lệnh exit code 0; không dùng `ignoreBuildErrors`.

- [ ] **Step 5: Chạy local server để kiểm tra UI**

Run:

```bash
npm run dev
```

Expected: server sẵn sàng trên một port trống.

- [ ] **Step 6: Kiểm tra bằng browser**

Kiểm tra `/`, `/lien-he` và bốn owner URL ở 1440px, 390px, 360px:

- Không cuộn ngang.
- Card local không vỡ dòng hoặc chồng lấn.
- Tap target tối thiểu 44px.
- Không broken image.
- Bốn owner URL xuất hiện đúng trong trang chủ, liên hệ và footer.
- Console không có lỗi nghiêm trọng.

- [ ] **Step 7: Kiểm tra diff cuối**

Run:

```bash
git diff --check
git status --short
git log --oneline -4
```

Expected: không có whitespace error; chỉ có file trong kế hoạch; ba commit triển khai đứng sau commit spec/plan.

### Task 5: Đồng bộ GitHub, deploy và gửi lại URL

**Files:**
- No source edits expected.

**Interfaces:**
- Consumes: branch đã test sạch.
- Produces: `origin/main` và production cùng commit.

- [ ] **Step 1: Đồng bộ với main mới nhất**

Run:

```bash
git fetch origin
git rebase origin/main
npm run typecheck
npm run build
```

Expected: rebase sạch; typecheck và build vẫn PASS. Nếu `origin/main` thay đổi file cùng phạm vi, dừng và review conflict theo hành vi thay vì chọn một phía.

- [ ] **Step 2: Push feature branch**

Run:

```bash
git push -u origin codex/local-seo-top5
```

Expected: push thành công.

- [ ] **Step 3: Fast-forward main**

Run:

```bash
git push origin HEAD:main
```

Expected: push fast-forward thành công. Nếu bị non-fast-forward, quay lại Step 1; không force push.

- [ ] **Step 4: Xác minh SSH và trạng thái server**

Run từ Windows:

```powershell
ssh -i "$env:USERPROFILE\.ssh\mushroomie_deploy" -o BatchMode=yes -o ConnectTimeout=10 codex@103.77.242.153 "hostname && whoami"
ssh -i "$env:USERPROFILE\.ssh\mushroomie_deploy" codex@103.77.242.153 "sudo -n bash -lc 'cd /var/www/mushroomie && git status --short --branch && git rev-parse HEAD'"
```

Expected: host `Mushroomie`, user `codex`; server repo không có thay đổi cản trở deploy.

- [ ] **Step 5: Deploy bằng quy trình standalone**

Run:

```powershell
ssh -i "$env:USERPROFILE\.ssh\mushroomie_deploy" codex@103.77.242.153 "sudo -n bash -lc 'cd /var/www/mushroomie && git pull --ff-only origin main && bash deploy.sh'"
```

Expected: deploy thành công và PM2 process `mushroomie_pm2` online.

- [ ] **Step 6: Kiểm tra production**

Run cho từng owner URL:

```powershell
curl.exe -sS -I https://mushroomie.io.vn/vong-tay-handmade-dong-nai
curl.exe -sS -I https://mushroomie.io.vn/vong-tay-custom-bien-hoa
curl.exe -sS -I https://mushroomie.io.vn/moc-khoa-handmade-dong-nai
curl.exe -sS -I https://mushroomie.io.vn/qua-tang-handmade-dong-nai
curl.exe -sS https://mushroomie.io.vn/sitemap.xml
curl.exe -sS https://mushroomie.io.vn/robots.txt
```

Expected:

- Bốn URL trả 200.
- Không có `X-Robots-Tag: noindex`.
- HTML có self-canonical.
- Sitemap có đủ bốn URL với lastmod hợp lệ.
- Robots không chặn bốn URL.

Kiểm tra PM2:

```powershell
ssh -i "$env:USERPROFILE\.ssh\mushroomie_deploy" codex@103.77.242.153 "sudo -n pm2 status mushroomie_pm2 && sudo -n pm2 logs mushroomie_pm2 --lines 100 --nostream"
```

Expected: process online, không có runtime error mới.

- [ ] **Step 7: Gửi lại Search Console**

Trong Search Console của `sc-domain:mushroomie.io.vn`:

1. Gửi lại `https://mushroomie.io.vn/sitemap.xml`.
2. Kiểm tra URL và yêu cầu lập chỉ mục lần lượt cho bốn owner URL.
3. Lưu ngày yêu cầu vào baseline.

Expected: Search Console chấp nhận yêu cầu. Không lặp gửi nhiều lần trong cùng ngày.

- [ ] **Step 8: Lập lịch đo lại**

Đo lại sau 14 ngày, rồi hằng tuần đến 8 tuần. Ghi:

- vị trí quan sát,
- URL Google chọn,
- GSC clicks,
- GSC impressions,
- CTR,
- average position.

Ưu tiên xác nhận Google chuyển sang owner URL trước khi đánh giá mục tiêu Top 5.
