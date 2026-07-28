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

test('batch reveal never hides what the user can already see', () => {
  // data-batch-reveal có mặt trên trang form admin (sửa sản phẩm, sửa bài). Đặt
  // opacity:0 lên ô nhập liệu đang hiển thị là lỗi nghiêm trọng — và nếu ScrollTrigger
  // hỏng thì cả form trắng xoá.
  const motion = read('src/components/ui/ScrollMotion.tsx')

  const batchIndex = motion.indexOf('data-batch-reveal')
  const setIndex = motion.indexOf('gsap.set(batchTargets')
  const guardIndex = motion.indexOf('getBoundingClientRect', batchIndex)

  assert.ok(guardIndex > -1, 'batch reveal thiếu guard khung nhìn')
  assert.ok(guardIndex < setIndex, 'guard phải chạy TRƯỚC khi đặt opacity 0')
})

test('public motion runtime is mounted exactly once, in the layout', () => {
  // Trước đây ScrollReveal/ScrollMotion gắn thủ công theo từng trang nên đa số trang
  // public không có runtime — thêm data-reveal vào cũng không chạy. Gắn ở layout là
  // lời giải, nhưng gắn THÊM ở trang con sẽ tạo instance ScrollTrigger thứ hai trên
  // cùng phần tử (chạy hai animation chồng nhau, và một ctx.revert() không dọn hết).
  const layout = read('src/app/(user)/layout.tsx')
  assert.match(layout, /<ScrollReveal \/>/)
  assert.match(layout, /<ScrollMotion \/>/)

  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        // Admin có vùng cuộn riêng nên phải tự mount kèm scroller — không tính.
        if (full.endsWith(path.join('app', 'admin'))) continue
        walk(full)
      } else if (/\.tsx$/.test(entry.name)) {
        const rel = path.relative(ROOT, full)
        if (rel.endsWith(path.join('app', '(user)', 'layout.tsx'))) continue
        if (rel.includes(path.join('components', 'ui', 'Scroll'))) continue
        if (/<Scroll(Reveal|Motion)[\s/>]/.test(fs.readFileSync(full, 'utf8'))) offenders.push(rel)
      }
    }
  }
  walk(path.join(ROOT, 'src'))

  assert.deepEqual(offenders, [], 'mount trùng runtime chuyển động ngoài layout public')
})

test('the pulsing glow never animates box-shadow', () => {
  // Bản gốc bên site tham chiếu animate box-shadow — buộc vẽ lại mỗi khung hình. Quầng
  // sáng ở đây phải là lớp ::before có box-shadow tĩnh, chỉ opacity/transform chạy.
  const glow = CSS.slice(CSS.indexOf('.m-pulse-glow'), CSS.indexOf('.m-modal'))
  assert.match(glow, /animation:\s*m-pulse-glow/)
  assert.doesNotMatch(glow, /transition:[^;]*box-shadow/)

  const keyframes = CSS.slice(CSS.indexOf('@keyframes m-pulse-glow'))
  const body = keyframes.slice(0, keyframes.indexOf('}\n}') + 3)
  assert.doesNotMatch(body, /box-shadow/, 'box-shadow không được nằm trong keyframes')
})

test('every new motion pattern declares its reduced-motion tier', () => {
  const block = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)', CSS.indexOf('Giảm chuyển động')))

  // Bỏ sót ở đây là lỗi âm thầm: hiệu ứng vẫn chạy với người đã báo là chuyển động
  // làm họ chóng mặt, và không có gì báo động.
  for (const pattern of ['.m-cart-bounce', '.m-badge-pop', '.m-pulse-glow', '.m-slogan-shimmer', '.m-modal', '.m-pop-in']) {
    assert.ok(block.includes(pattern), `${pattern} chưa khai báo tầng giảm chuyển động`)
  }
})

test('modal entrance classes exist in CSS, unlike the tailwindcss-animate ones they replaced', () => {
  // `animate-in fade-in zoom-in` từng được dùng ở 4 hộp thoại, nhưng dự án không cài
  // tailwindcss-animate và cũng không tự định nghĩa — class chết, không chạy gì cả.
  assert.match(CSS, /@keyframes m-pop-in/)
  assert.match(CSS, /\.m-pop-in\s*\{/)

  const walk = (dir: string, hits: string[] = []): string[] => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full, hits)
      else if (/\.tsx$/.test(entry.name) && /className="[^"]*\banimate-in\b/.test(fs.readFileSync(full, 'utf8'))) {
        hits.push(path.relative(ROOT, full))
      }
    }
    return hits
  }

  assert.deepEqual(walk(path.join(ROOT, 'src')), [], 'class animate-in không tồn tại trong dự án này')
})

test('admin scroll motion targets the admin scroll container', () => {
  const layout = read('src/app/admin/layout.tsx')
  // Admin cuộn trong <main overflow-auto>, không phải window. Thiếu scroller thì
  // ScrollTrigger bám viewport và im lặng không chạy — không lỗi, không cảnh báo.
  assert.match(layout, /<ScrollMotion scroller="#main-content"/)
  assert.match(layout, /id="main-content"/)

  const motion = read('src/components/ui/ScrollMotion.tsx')
  assert.match(motion, /\.\.\.\(scroller \? \{ scroller \} : \{\}\)/)
})

test('admin motion matches public intensity but caps table stagger', () => {
  // Cắt đúng khối admin: sau nó là khối reduced-motion toàn cục, trong đó có nhắc
  // .m-parallax — lấy tràn sang sẽ làm phép kiểm "admin không có parallax" báo sai.
  const adminStart = CSS.indexOf('Motion cho trang admin')
  const adminEnd = CSS.indexOf('@media (prefers-reduced-motion: reduce)', adminStart)
  const admin = CSS.slice(adminStart, adminEnd > -1 ? adminEnd : undefined)

  assert.match(admin, /@keyframes m-row-in/)

  // Cùng token thời lượng với public — đây là điều "mạnh như public" nghĩa là.
  assert.match(
    admin,
    /animation: m-row-in var\(--m-duration-base\)/,
    'hàng admin không dùng chung token thời lượng với public',
  )

  // Trần stagger vẫn phải giữ dù cường độ tăng: bảng đơn hàng có thể hàng trăm dòng,
  // so le hết thì dòng cuối chờ vài giây mới đọc được.
  assert.match(admin, /nth-child\(n \+ 12\)/)
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

test('drawers stay mounted long enough to animate closed', () => {
  // `if (!isOpen) return null` gỡ panel ngay lập tức — không còn gì để animate. Đó là
  // lý do giỏ hàng trước đây bật/tắt cụt lủn.
  const hook = read('src/hooks/useDrawerTransition.ts')
  assert.match(hook, /setTimeout\(\(\) => setMounted\(false\), durationMs\)/)

  // Phải render một khung hình ở trạng thái đóng trước khi lật sang mở, nếu không
  // trình duyệt không có gì để nội suy và panel hiện tức thì.
  assert.match(hook, /requestAnimationFrame/)
  const rafCount = (hook.match(/requestAnimationFrame/g) ?? []).length
  assert.ok(rafCount >= 2, 'cần rAF lồng nhau để chắc chắn kiểu dáng ban đầu đã áp')

  for (const file of ['src/components/cart/CartDrawer.tsx', 'src/components/layout/Header.tsx']) {
    const src = read(file)
    assert.match(src, /useDrawerTransition/, `${file} chưa dùng hook`)
    assert.match(src, /data-drawer-state=/, `${file} thiếu thuộc tính trạng thái`)
  }
})

test('no parent unmounts a drawer the moment it closes', () => {
  // Lỗi đã xảy ra thật: DeferredPublicWidgets render `{cartOpen && <CartDrawer />}`,
  // gỡ panel khỏi DOM ngay khi cartOpen thành false. useDrawerTransition bên trong giữ
  // DOM đúng 280ms, nhưng component cha cắt trước — nên giỏ hàng đóng phụt, không trượt.
  // Bộ test cũ không bắt được vì chỉ soi hook và chính component drawer.
  const widgets = read('src/components/layout/DeferredPublicWidgets.tsx')

  assert.doesNotMatch(
    widgets,
    /\{\s*cartOpen\s*&&\s*<CartDrawer/,
    'gắn CartDrawer trực tiếp vào cartOpen sẽ vô hiệu hoá hiệu ứng đóng',
  )
  // Đã cần tới thì giữ lại trong DOM, để hook tự quyết định lúc gỡ.
  assert.match(widgets, /cartNeeded/)
})

test('a drawer that mounts already-open still starts closed', () => {
  // CartDrawer nạp động nên lần render đầu tiên của nó đã có isOpen = true. Khởi tạo
  // thẳng ở 'open' thì khung hình đầu vẽ luôn ở vị trí cuối — không còn gì để nội suy.
  const hook = read('src/hooks/useDrawerTransition.ts')
  assert.match(hook, /useState<DrawerState>\(isOpen \? 'entering' : 'exiting'\)/)
  assert.doesNotMatch(hook, /useState<DrawerState>\(isOpen \? 'open'/)
})

test('drawers exit faster than they enter', () => {
  // Quy ước micro-interaction: vào thong thả (ease-out), ra dứt khoát (ease-in).
  // Panel nán lại khi đóng làm giao diện có cảm giác chậm.
  const drawer = CSS.slice(CSS.indexOf('Drawer / panel trượt'))
  const exiting = drawer.match(/\.m-drawer\[data-drawer-state='exiting'\]\s*\{[^}]*transition-duration:\s*(\d+)ms/)

  assert.ok(exiting, 'không đọc được thời lượng đóng')
  assert.ok(Number(exiting[1]) < 260, 'đóng phải nhanh hơn mở (260ms)')
})

test('drawer motion is dropped under reduced motion', () => {
  // Panel trượt cả chiều rộng màn hình là chuyển động Tầng 1.
  const block = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(block, /\.m-drawer[\s\S]*?transform:\s*none/)

  // Hook cũng phải bỏ phần trì hoãn, nếu không panel còn treo lại 280ms vô ích.
  const hook = read('src/hooks/useDrawerTransition.ts')
  assert.match(hook, /if \(reduced\)/)
})
