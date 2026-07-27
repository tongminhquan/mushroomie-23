import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const ROOT = path.resolve(__dirname, '..')
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

const CSS = read('src/app/globals.css')

test('reduced motion is tiered, not a blanket kill switch', () => {
  const block = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'))

  // Tầng 1: chuyển động trôi nổi phải bị bỏ hẳn.
  assert.match(block, /\.m-float[\s\S]*?animation:\s*none/)
  // Tầng 2: hover nâng lên phải mất phần dịch chuyển nhưng giữ transition màu.
  assert.match(block, /\.m-lift:hover[\s\S]*?transform:\s*none/)
  // Tầng 3: fade và vòng focus phải sống sót.
  assert.match(block, /:focus-visible/)
})

test('reduced-motion durations use 0.01ms, never 0s', () => {
  // 0s làm mất sự kiện transitionend/animationend mà JS có thể đang chờ.
  const block = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(block, /animation-duration:\s*0\.01ms/)
  assert.match(block, /transition-duration:\s*0\.01ms/)
  assert.doesNotMatch(block, /(animation|transition)-duration:\s*0s/)
})

test('motion utilities only animate compositor-friendly properties', () => {
  // Animate width/height/top/left/box-shadow buộc trình duyệt tính lại layout mỗi
  // khung hình. Chỉ transform và opacity chạy trên compositor.
  const forbidden = /transition:[^;]*\b(width|height|top|left|right|bottom|margin|padding|box-shadow)\b/g
  const utilities = CSS.slice(CSS.indexOf('Hệ thống motion'), CSS.indexOf('========== Animations =========='))

  const hits = utilities.match(forbidden) ?? []
  assert.deepEqual(hits, [], 'utility motion animate thuộc tính gây reflow')
})

test('scroll reveal never hides content without JavaScript', () => {
  // Trạng thái ẩn chỉ tồn tại qua thuộc tính do JS gắn. Nếu CSS tĩnh tự đặt opacity:0
  // thì JS lỗi sẽ làm nội dung biến mất vĩnh viễn — và crawler cũng không thấy gì.
  assert.match(CSS, /\[data-m-reveal='hidden'\]/)
  assert.doesNotMatch(CSS, /\.m-reveal\s*\{[^}]*opacity:\s*0/)

  const reveal = read('src/components/ui/ScrollReveal.tsx')
  assert.match(reveal, /data-m-reveal/)
  // Phần tử đã trong khung nhìn lúc tải phải hiện ngay, không ẩn rồi trượt lên.
  assert.match(reveal, /getBoundingClientRect/)
})

test('GSAP is dynamically imported so only the homepage pays for it', () => {
  const hero = read('src/components/home/landing/HeroProofMotion.tsx')

  assert.match(hero, /await import\('gsap'\)/, 'GSAP phải được nạp động')
  assert.doesNotMatch(hero, /^import .*from 'gsap'/m, 'GSAP không được import tĩnh')
  // gsap.matchMedia tự hoàn tác khi người dùng đổi thiết lập giữa chừng.
  assert.match(hero, /gsap\.matchMedia\(\)/)
  assert.match(hero, /prefers-reduced-motion: reduce/)
})

test('no other module imports GSAP statically', () => {
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.tsx?$/.test(entry.name)) {
        const src = fs.readFileSync(full, 'utf8')
        if (/^import\s[^;]*from\s+'gsap/m.test(src)) offenders.push(path.relative(ROOT, full))
      }
    }
  }
  walk(path.join(ROOT, 'src'))

  assert.deepEqual(offenders, [], 'import GSAP tĩnh sẽ kéo ~23KB vào bundle của mọi trang')
})

test('the LCP area is excluded from scroll reveal', () => {
  const home = read('src/components/home/landing/HomeLanding.tsx')
  const heroLine = home.split('\n').find((line) => line.includes('<HomeHeroLanding'))
  assert.ok(heroLine && !heroLine.includes('data-reveal'), 'hero bị gắn data-reveal → hỏng LCP')

  const local = read('src/components/local/LocalLandingPage.tsx')
  const firstSection = local.indexOf('<section className="brand-container mt-4"')
  assert.ok(firstSection > -1, 'không tìm thấy hero của trang địa phương')
  assert.ok(
    !local.slice(firstSection, firstSection + 120).includes('data-reveal'),
    'hero trang địa phương bị gắn data-reveal',
  )
})
