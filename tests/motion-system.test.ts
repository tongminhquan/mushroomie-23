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

test('parallax is fully removed under reduced motion, not just weakened', () => {
  // Parallax gợi cảm giác chiều sâu + tự di chuyển — tác nhân gây chóng mặt mạnh nhất.
  // Phải bỏ hẳn ở cả hai lớp: CSS cho phần khai báo, JS cho phần GSAP điều khiển.
  const block = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(block, /\.m-parallax/)

  const motion = read('src/components/ui/ScrollMotion.tsx')
  // Phải thoát sớm, không được dựng ScrollTrigger rồi đặt biên độ 0.
  assert.match(
    motion,
    /prefers-reduced-motion: reduce[^\n]*matches\)\s*return/,
    'ScrollMotion vẫn khởi tạo ScrollTrigger khi người dùng bật giảm chuyển động',
  )
  // Việc kiểm tra phải nằm TRƯỚC khi nạp GSAP — nếu không vẫn tốn 34KB vô ích.
  assert.ok(
    motion.indexOf('prefers-reduced-motion') < motion.indexOf("import('gsap')"),
    'kiểm tra giảm chuyển động phải chạy trước khi nạp GSAP',
  )
})

test('ScrollTrigger cleans up and refreshes after images load', () => {
  const motion = read('src/components/ui/ScrollMotion.tsx')
  assert.match(motion, /gsap\.context\(/, 'thiếu gsap.context → ScrollTrigger rò rỉ khi unmount')
  assert.match(motion, /ctx\.revert\(\)/)
  // Ảnh tải xong làm đổi chiều cao trang; resize thì GSAP tự lo, ảnh thì không.
  assert.match(motion, /ScrollTrigger\.refresh\(\)/)
  assert.doesNotMatch(motion, /markers:\s*true/, 'markers dev còn sót lại trong production')
})

test('page transition uses template.tsx and ships no JS', () => {
  const template = read('src/app/template.tsx')
  assert.doesNotMatch(template, /'use client'/, 'template thành client component → tốn JS mọi trang')
  assert.match(template, /m-page-enter/)
  // template remount mỗi lần điều hướng; layout thì không, nên hiệu ứng sẽ chỉ chạy một lần.
  assert.match(CSS, /@keyframes m-page-enter/)
})

test('admin motion is functional and shorter than public motion', () => {
  // Cắt đúng khối admin: sau nó là khối reduced-motion toàn cục, trong đó có nhắc
  // .m-parallax — lấy tràn sang sẽ làm phép kiểm "admin không có parallax" báo sai.
  const adminStart = CSS.indexOf('Motion cho trang admin')
  const adminEnd = CSS.indexOf('@media (prefers-reduced-motion: reduce)', adminStart)
  const admin = CSS.slice(adminStart, adminEnd > -1 ? adminEnd : undefined)

  // Hàng bảng chỉ mờ dần + dịch nhẹ; không có parallax hay hiệu ứng trang trí.
  assert.match(admin, /@keyframes m-row-in/)
  assert.doesNotMatch(admin, /parallax|scale\(1\.\d/)

  // So le phải có trần — bảng 100 dòng mà so le hết thì hàng cuối chờ hàng giây.
  assert.match(admin, /nth-child\(n \+ 12\)/)

  const rowIn = admin.match(/\.m-admin-rows > tr \{\s*animation: m-row-in (\d+)ms/)
  assert.ok(rowIn, 'không đọc được thời lượng hàng admin')
  assert.ok(Number(rowIn[1]) <= 200, 'motion admin quá chậm cho thao tác lặp lại hàng ngày')
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
