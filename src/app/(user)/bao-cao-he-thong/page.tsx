import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Layers3,
  LockKeyhole,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import styles from './report.module.css'

export const metadata: Metadata = {
  title: 'Báo cáo kiến trúc và hệ thống website',
  description:
    'Báo cáo tổng quan kiến trúc, công nghệ và các phân hệ của website thương mại điện tử Mushroomie.',
  alternates: {
    canonical: 'https://mushroomie.io.vn/bao-cao-he-thong',
  },
  robots: { index: false, follow: false },
}

const reportStats = [
  {
    value: '78',
    label: 'page route',
    note: '78 page route: 77 route nghiệp vụ và 1 route báo cáo',
  },
  {
    value: '73',
    label: 'API route',
    note: '73 API route: Backend nghiệp vụ trong Next.js App Router',
  },
  {
    value: '29',
    label: 'Prisma model',
    note: '29 Prisma model: Dữ liệu thương mại, nội dung và vận hành',
  },
  {
    value: '100+',
    label: 'tệp kiểm thử',
    note: 'Unit, integration, security và source contract',
  },
] as const

const tableOfContents = [
  ['tong-quan', '01', 'Tổng quan đề tài'],
  ['kien-truc', '02', 'Kiến trúc tổng thể'],
  ['cong-nghe', '03', 'Công nghệ sử dụng'],
  ['cau-truc-ma-nguon', '04', 'Cấu trúc mã nguồn'],
  ['phan-he', '05', 'Các phân hệ website'],
  ['luong-nghiep-vu', '06', 'Luồng nghiệp vụ chính'],
  ['co-so-du-lieu', '07', 'Cơ sở dữ liệu'],
  ['bao-mat', '08', 'Bảo mật hệ thống'],
  ['hieu-suat-seo', '09', 'Hiệu suất, SEO và analytics'],
  ['van-hanh', '10', 'Production và CI/CD'],
  ['thuyet-trinh', '11', 'Dàn ý bảo vệ đề tài'],
  ['phan-bien', '12', 'Câu hỏi phản biện'],
] as const

const technologyGroups = [
  {
    layer: 'Frontend',
    technologies: 'Next.js 16.2.11, React 19.2.4, TypeScript, Tailwind CSS 4',
    role: 'Server rendering, component UI, responsive và theme sáng/tối.',
  },
  {
    layer: 'Backend',
    technologies: 'Next.js Route Handlers, Zod, bcryptjs',
    role: 'API, validation, logic nghiệp vụ và kiểm tra dữ liệu phía máy chủ.',
  },
  {
    layer: 'Dữ liệu',
    technologies: 'MySQL, Prisma 5.22',
    role: 'Lưu trữ dữ liệu quan hệ, transaction và truy vấn có kiểu.',
  },
  {
    layer: 'Xác thực',
    technologies: 'NextAuth 5, Google OAuth, Credentials, JWT',
    role: 'Đăng nhập, session và phân quyền user/viewer/admin/super_admin.',
  },
  {
    layer: 'Thanh toán',
    technologies: 'VietQR + Casso, VietQR + SePay, PayOS',
    role: 'Tạo QR, nhận webhook, đối soát và cập nhật trạng thái đơn.',
  },
  {
    layer: 'Media',
    technologies: 'Sharp, WebP, UUID',
    role: 'Xác minh định dạng, resize, nén, xóa metadata và lưu ảnh an toàn.',
  },
  {
    layer: 'Trạng thái & biểu đồ',
    technologies: 'Zustand, Recharts',
    role: 'Giỏ hàng phía client và trực quan hóa số liệu quản trị.',
  },
  {
    layer: 'Vận hành',
    technologies: 'Cloudflare, Nginx, PM2, GitHub Actions',
    role: 'CDN, reverse proxy, process manager và kiểm tra chất lượng tự động.',
  },
] as const

const projectTree = `mushroomie/
├── src/
│   ├── app/
│   │   ├── (user)/          # Các trang khách hàng
│   │   ├── admin/           # Hệ thống quản trị
│   │   └── api/             # 73 backend API route
│   ├── components/          # Component giao diện dùng chung
│   ├── lib/                 # Auth, payment, email, media, SEO
│   ├── store/               # Zustand cart và voucher
│   └── hooks/               # React hooks dùng chung
├── prisma/
│   ├── schema.prisma        # 29 model MySQL
│   ├── migrations/          # Lịch sử migration
│   └── seed.*               # Dữ liệu khởi tạo
├── public/
│   ├── uploads/             # Media tồn tại độc lập với build
│   └── brand/               # Logo và tài sản thương hiệu
├── scripts/                 # Deploy, backup, media, SEO, performance
├── tests/                   # Unit và integration tests
├── video/                   # Dự án video giới thiệu tách khỏi web runtime
├── next.config.ts           # Next.js, ảnh, cache, CSP, headers
└── ecosystem.config.js      # PM2 standalone production`

const systemModules = [
  {
    number: '01',
    title: 'Trang chủ và thương hiệu',
    summary:
      'Hero, danh mục, sản phẩm nổi bật, sản phẩm custom, câu chuyện thương hiệu, giá trị handmade, đánh giá, bài viết và CTA.',
    detail: 'Ưu tiên hình ảnh thật, mobile-first và không tải admin/game bundle vào homepage.',
  },
  {
    number: '02',
    title: 'Sản phẩm và danh mục',
    summary:
      'Danh sách, chi tiết, tìm kiếm, lọc, slug SEO, album ảnh, tùy chọn, giá khuyến mãi và tồn kho.',
    detail: 'Product card duy trì tỷ lệ ảnh 3:4 và dữ liệu giá được xác minh lại khi đặt hàng.',
  },
  {
    number: '03',
    title: 'Giỏ hàng',
    summary:
      'Thêm, xóa, thay đổi số lượng, lưu lựa chọn sản phẩm và chuyển sang checkout bằng Zustand persisted store.',
    detail: 'Giỏ hàng client phục vụ trải nghiệm; server vẫn là nguồn dữ liệu đáng tin cậy cuối cùng.',
  },
  {
    number: '04',
    title: 'Đơn hàng và tồn kho',
    summary:
      'Tạo đơn bằng transaction, tính lại giá, phí giao hàng, gói quà, voucher và trừ kho có điều kiện.',
    detail: 'Có lịch sử trạng thái, reservation inventory và kiểm tra quyền truy cập từng đơn.',
  },
  {
    number: '05',
    title: 'Thanh toán tự động',
    summary:
      'Provider abstraction hỗ trợ VietQR + Casso, VietQR + SePay và PayOS; provider được chọn bằng cấu hình môi trường.',
    detail: 'Webhook có chữ ký, idempotency, audit log, đối chiếu mã đơn, số tiền và tài khoản nhận.',
  },
  {
    number: '06',
    title: 'Voucher và ưu đãi',
    summary:
      'Voucher chung hoặc gắn với tài khoản, điều kiện đơn tối thiểu, thời hạn, lượt dùng và lịch sử đổi điểm.',
    detail: 'Server kiểm tra quyền sở hữu, trạng thái, thời hạn và tự tính lại giá trị giảm.',
  },
  {
    number: '07',
    title: 'Tài khoản và phân quyền',
    summary:
      'Đăng ký OTP, mật khẩu, Google OAuth, quên mật khẩu, hồ sơ, đơn hàng và kho voucher cá nhân.',
    detail: 'Các vai trò user, viewer, admin và super_admin được kiểm tra ở backend API.',
  },
  {
    number: '08',
    title: 'Mini game và tích điểm',
    summary:
      'Tetris, Block Blast, bảng xếp hạng, điểm người dùng, đổi điểm và phát voucher theo mốc.',
    detail: 'Token HMAC, thời gian chơi, score ceiling, rate limit và token hash chống replay.',
  },
  {
    number: '09',
    title: 'Quản trị',
    summary:
      'Dashboard, sản phẩm, đơn hàng, thanh toán, voucher, bài viết, banner, media, review, contact và settings.',
    detail: 'Viewer chỉ đọc; mutation yêu cầu admin/super_admin; thao tác nhạy cảm có AdminLog.',
  },
  {
    number: '10',
    title: 'CMS và xuất bản',
    summary:
      'Bài nháp, autosave, revision, restore, lịch xuất bản, tag, import Excel/CSV và tích hợp WordPress.',
    detail: 'Hỗ trợ SEO title, canonical, robots, schema, Open Graph, từ khóa và thời gian đọc.',
  },
  {
    number: '11',
    title: 'Media và upload',
    summary:
      'Kiểm tra JPEG/PNG/WebP/AVIF, xác minh format thật, resize, auto-rotate, strip metadata và chuyển WebP.',
    detail: 'Tên UUID, giới hạn dung lượng/pixel và URL công khai chuẩn /uploads/<uuid>.webp.',
  },
  {
    number: '12',
    title: 'Đánh giá và chăm sóc sau mua',
    summary:
      'Review liên kết đơn hàng, token đánh giá, kiểm tra quyền sở hữu, chống đánh giá lặp và email nhắc đánh giá.',
    detail: 'Quản trị viên có luồng kiểm duyệt; email được ghi lịch sử trong EmailLog.',
  },
  {
    number: '13',
    title: 'Liên hệ và email',
    summary:
      'Lưu yêu cầu liên hệ, quản lý trạng thái xử lý và gửi email nghiệp vụ bằng Nodemailer/SMTP.',
    detail: 'Email xác nhận đơn, thanh toán và yêu cầu đánh giá được gửi sau khi transaction thành công.',
  },
  {
    number: '14',
    title: 'SEO và nội dung địa phương',
    summary:
      'Metadata, sitemap, robots, canonical, JSON-LD và các landing page địa phương cho Đồng Nai, Biên Hòa, TP.HCM.',
    detail: 'Product, Merchant, Article, LocalBusiness, Website và Breadcrumb schema được hỗ trợ.',
  },
  {
    number: '15',
    title: 'Analytics và marketing',
    summary:
      'Google Tag Manager, GA4 Ecommerce, Google Ads Conversion và Microsoft Clarity.',
    detail: 'Script được trì hoãn để bảo vệ LCP; purchase dùng transaction ID để giảm ghi nhận trùng.',
  },
  {
    number: '16',
    title: 'Vận hành và kiểm thử',
    summary:
      'Health endpoint, PM2 logs, CI, unit/integration tests, build standalone, cache static và rollback release.',
    detail: 'Production không dùng Docker; Nginx proxy tới Node.js trên 127.0.0.1:3001.',
  },
] as const

const orderFlow = [
  ['01', 'Nhận yêu cầu', 'Validate payload và xác thực tài khoản.'],
  ['02', 'Đọc dữ liệu thật', 'Lấy sản phẩm, giá và tồn kho từ MySQL.'],
  ['03', 'Tính lại đơn', 'Tính subtotal, phí giao hàng, gói quà và voucher ở server.'],
  ['04', 'Transaction', 'Trừ tồn kho có điều kiện, tạo Order, OrderItem và lịch sử trạng thái.'],
  ['05', 'Khởi tạo thanh toán', 'COD chuyển sang xử lý; online tạo Payment chờ thanh toán.'],
] as const

const paymentFlow = [
  ['01', 'Website tạo QR', 'Số tiền và nội dung chuyển khoản gắn với mã đơn.'],
  ['02', 'Khách chuyển khoản', 'Giao dịch phát sinh tại ngân hàng.'],
  ['03', 'Provider gửi webhook', 'Casso, SePay hoặc PayOS thông báo giao dịch.'],
  ['04', 'Server đối soát', 'Kiểm tra chữ ký, transaction ID, mã đơn, số tiền và tài khoản nhận.'],
  ['05', 'Cập nhật nguyên tử', 'Payment → PAID, Order → PROCESSING và ghi audit event.'],
  ['06', 'Thông báo khách hàng', 'Polling nhận trạng thái mới và email được gửi sau commit.'],
] as const

const databaseGroups = [
  {
    title: 'Người dùng & xác thực',
    models: ['User', 'Otp', 'UserPoint', 'RateLimitBucket'],
    purpose: 'Tài khoản, OTP, role, điểm và giới hạn nghiệp vụ.',
  },
  {
    title: 'Sản phẩm & giỏ hàng',
    models: ['Category', 'Product', 'ProductImage', 'ProductOption', 'Cart', 'CartItem'],
    purpose: 'Catalog, media, tùy chọn và giỏ hàng.',
  },
  {
    title: 'Đơn hàng & thanh toán',
    models: ['Order', 'OrderItem', 'OrderStatusHistory', 'Payment', 'PaymentWebhookEvent', 'EmailLog'],
    purpose: 'Đơn hàng, lịch sử, giao dịch, webhook và email.',
  },
  {
    title: 'Voucher & trò chơi',
    models: ['Voucher', 'UserVoucher', 'VoucherRedemptionLog', 'GameScore'],
    purpose: 'Ưu đãi, sở hữu voucher, đổi điểm và leaderboard.',
  },
  {
    title: 'Nội dung',
    models: ['Post', 'PostRevision', 'PostTag', 'PostTagMap'],
    purpose: 'CMS, revision, tag và quan hệ bài viết.',
  },
  {
    title: 'Tương tác & vận hành',
    models: ['Contact', 'Review', 'Banner', 'AdminLog', 'Setting'],
    purpose: 'Liên hệ, đánh giá, banner, audit và cấu hình động.',
  },
] as const

const securityControls = [
  {
    title: 'Không tin dữ liệu client',
    text: 'Giá, tổng tiền, voucher, phí giao hàng và trạng thái thanh toán đều được tính hoặc xác minh lại trên server.',
  },
  {
    title: 'Phân quyền nhiều lớp',
    text: 'UI chỉ là lớp trải nghiệm; API tiếp tục kiểm tra user, viewer, admin và super_admin.',
  },
  {
    title: 'Webhook có thể kiểm toán',
    text: 'Chữ ký, idempotency, transaction và PaymentWebhookEvent ngăn xử lý trùng hoặc xác nhận nhầm.',
  },
  {
    title: 'Upload được chuẩn hóa',
    text: 'MIME và format thật được kiểm tra; ảnh bị giới hạn, strip metadata, chuyển WebP và đặt tên UUID.',
  },
  {
    title: 'Security headers',
    text: 'CSP, HSTS, X-Frame-Options, nosniff, Referrer Policy và Permissions Policy được cấu hình toàn cục.',
  },
  {
    title: 'Secret ngoài mã nguồn',
    text: '.env, khóa OAuth, SMTP, webhook và database credential không được commit hoặc render ra client.',
  },
] as const

const performanceItems = [
  'Server Components mặc định; Client Component chỉ dùng cho phần cần tương tác.',
  'Ảnh LCP được ưu tiên; ảnh dưới fold lazy-load; WebP/AVIF và sizes được cấu hình.',
  'Product card giữ aspect-ratio 3:4 để hạn chế layout shift.',
  'GTM, GA4, Ads và Clarity tải trễ để bảo vệ Core Web Vitals.',
  'Nginx phục vụ /_next/static và /uploads trực tiếp với cache dài.',
  'Cloudflare cung cấp CDN, HTTPS và cache tại edge.',
  'PM2 giới hạn bộ nhớ, tự restart và lưu trạng thái process.',
  'Animation ưu tiên transform/opacity và hỗ trợ prefers-reduced-motion.',
] as const

const seoItems = [
  'Metadata, canonical, robots.txt và sitemap XML.',
  'Product, Merchant listing, ItemList và Breadcrumb schema.',
  'Article/BlogPosting, LocalBusiness và Website schema.',
  'Open Graph, Twitter Card và ảnh chia sẻ xã hội.',
  'Noindex cho admin, API, tài khoản, giỏ hàng và thanh toán.',
  'Landing page địa phương và nội dung danh mục có canonical kiểm soát.',
] as const

const presentationOutline = [
  ['Mở đầu', 'Mushroomie là hệ thống thương mại điện tử B2C cho phụ kiện handmade cá nhân hóa, không phải website tĩnh.'],
  ['Kiến trúc', 'Giải thích modular monolith: frontend, API và nghiệp vụ chung một codebase nhưng chia module độc lập.'],
  ['Nghiệp vụ', 'Đi qua chuỗi sản phẩm → giỏ hàng → đơn hàng → thanh toán → chăm sóc sau mua.'],
  ['Điểm kỹ thuật', 'Nhấn mạnh server-side pricing, payment idempotency, role-based access và chống gian lận game.'],
  ['Vận hành', 'Trình bày Cloudflare, Nginx, PM2, MySQL, GitHub Actions và rollback release.'],
  ['Kết luận', 'Nêu giá trị thực tế, khả năng mở rộng và lộ trình Redis/object storage/queue khi quy mô tăng.'],
] as const

const councilQuestions = [
  {
    question: 'Tại sao chọn Next.js thay vì React SPA?',
    answer:
      'Next.js cung cấp Server Components, server rendering, metadata, tối ưu ảnh và backend Route Handlers trong cùng dự án; phù hợp website thương mại điện tử cần SEO và hiệu suất.',
  },
  {
    question: 'Tại sao chưa tách microservice?',
    answer:
      'Quy mô hiện tại phù hợp modular monolith: chi phí vận hành thấp nhưng module vẫn có ranh giới rõ. Khi tải tăng có thể tách payment, email và media mà không viết lại toàn bộ.',
  },
  {
    question: 'Người dùng sửa giá trong DevTools thì sao?',
    answer:
      'Frontend chỉ hiển thị. Khi tạo đơn, server đọc lại sản phẩm, giá, phí giao hàng, voucher và tồn kho từ database rồi mới commit transaction.',
  },
  {
    question: 'Làm sao biết khách đã chuyển khoản?',
    answer:
      'Provider gửi webhook. Server kiểm tra chữ ký, mã đơn, số tiền, tài khoản nhận và idempotency trước khi chuyển Payment sang PAID và Order sang PROCESSING.',
  },
  {
    question: 'Mini game có bị sửa điểm không?',
    answer:
      'Mỗi lượt chơi có token HMAC; server kiểm tra người chơi, loại game, thời gian, mức điểm hợp lý, rate limit và token đã dùng trước khi ghi điểm.',
  },
  {
    question: 'Nếu deploy lỗi thì xử lý thế nào?',
    answer:
      'Release trước được giữ lại. Sau build, hệ thống kiểm tra health, route, PM2 log và MIME static; nếu lỗi có thể đổi lại release trước rồi restart PM2.',
  },
] as const

function SectionHeading({
  number,
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  number: string
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionMarker} aria-hidden>
        <Icon size={20} />
        <span>{number}</span>
      </div>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
        <p className={styles.sectionLead}>{description}</p>
      </div>
    </div>
  )
}

function FlowList({
  title,
  steps,
}: {
  title: string
  steps: ReadonlyArray<readonly [string, string, string]>
}) {
  return (
    <div className={styles.flowPanel}>
      <h3>{title}</h3>
      <ol className={styles.flowList}>
        {steps.map(([number, stepTitle, description]) => (
          <li key={`${title}-${number}`}>
            <span className={styles.flowNumber}>{number}</span>
            <div>
              <strong>{stepTitle}</strong>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function SystemReportPage() {
  return (
    <article className={styles.report}>
      <section className={styles.hero} aria-labelledby="report-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.documentCode}>ĐỒ ÁN THƯƠNG MẠI ĐIỆN TỬ · 2026</p>
            <h1 id="report-title">Báo cáo hệ thống Mushroomie</h1>
            <p className={styles.heroLead}>
              Toàn bộ kiến trúc, công nghệ và các phân hệ đang vận hành website thương mại điện tử
              phụ kiện handmade cá nhân hóa.
            </p>
            <div className={styles.heroActions} data-report-chrome>
              <Link href="#muc-luc" className={styles.primaryAction}>
                Xem cấu trúc báo cáo <ArrowUpRight size={18} aria-hidden />
              </Link>
              <Link href="/" className={styles.secondaryAction}>
                Trở về cửa hàng
              </Link>
            </div>
            <p className={styles.printHint}>Mẹo trình bày: dùng Ctrl/Cmd + P để lưu báo cáo thành PDF.</p>
          </div>

          <aside className={styles.heroBrief} aria-label="Thông tin đề tài">
            <span className={styles.briefLabel}>Project brief</span>
            <dl>
              <div>
                <dt>Mô hình</dt>
                <dd>B2C E-commerce</dd>
              </div>
              <div>
                <dt>Kiến trúc</dt>
                <dd>Modular monolith</dd>
              </div>
              <div>
                <dt>Production</dt>
                <dd>mushroomie.io.vn</dd>
              </div>
              <div>
                <dt>Thông điệp</dt>
                <dd>Làm bằng tay, trao bằng tim</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className={styles.contentShell}>
        <section className={styles.stats} aria-label="Quy mô hệ thống">
          {reportStats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <p>{stat.note}</p>
            </div>
          ))}
        </section>

        <nav id="muc-luc" className={styles.contents} aria-label="Mục lục báo cáo">
          <div className={styles.contentsIntro}>
            <p className={styles.eyebrow}>Mục lục</p>
            <h2>Một hệ thống, mười hai góc nhìn</h2>
            <p>
              Đi từ mục tiêu kinh doanh đến kiến trúc, dữ liệu, bảo mật và quy trình vận hành
              production.
            </p>
          </div>
          <ol>
            {tableOfContents.map(([id, number, label]) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span>{number}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="tong-quan" className={styles.reportSection}>
          <SectionHeading
            number="01"
            eyebrow="Bối cảnh đề tài"
            title="Mushroomie giải quyết bài toán gì?"
            description="Một trải nghiệm bán hàng hoàn chỉnh cho phụ kiện handmade và quà tặng cá nhân hóa, từ khám phá sản phẩm đến chăm sóc sau mua."
            icon={Sparkles}
          />
          <div className={styles.overviewGrid}>
            <div className={styles.statementCard}>
              <p className={styles.cardLabel}>Sản phẩm</p>
              <h3>Những món nhỏ mang dấu ấn riêng</h3>
              <p>
                Vòng tay, charm, móc khóa, vòng cổ, dây chuyền, hộp quà và phụ kiện custom được
                trình bày bằng hình ảnh thật, câu chuyện thương hiệu và nội dung SEO phù hợp.
              </p>
            </div>
            <div className={styles.statementCard}>
              <p className={styles.cardLabel}>Khách hàng</p>
              <h3>Gen Z, mobile-first và đề cao cảm xúc</h3>
              <p>
                Website kết hợp mua sắm, cá nhân hóa, voucher và mini game để tạo trải nghiệm vừa
                thương mại vừa có tính tương tác, nhưng không làm nặng trang chủ.
              </p>
            </div>
            <div className={styles.statementCard}>
              <p className={styles.cardLabel}>Giá trị kỹ thuật</p>
              <h3>Không dừng ở một landing page</h3>
              <p>
                Hệ thống có tài khoản, phân quyền, tồn kho, đơn hàng, webhook thanh toán, CMS,
                media pipeline, analytics, kiểm thử và hạ tầng production thực tế.
              </p>
            </div>
          </div>
        </section>

        <section id="kien-truc" className={styles.reportSection}>
          <SectionHeading
            number="02"
            eyebrow="System architecture"
            title="Kiến trúc modular monolith full-stack"
            description="Frontend, backend API và nghiệp vụ nằm trong một dự án Next.js, nhưng được tách thành các module có trách nhiệm rõ ràng."
            icon={Network}
          />

          <div className={styles.architecture} aria-label="Sơ đồ kiến trúc production Mushroomie">
            <div className={styles.architectureLane}>
              <div className={styles.archNode}>
                <span>01</span>
                <strong>Người dùng</strong>
                <small>Desktop · Mobile</small>
              </div>
              <i aria-hidden>→</i>
              <div className={styles.archNode}>
                <span>02</span>
                <strong>Cloudflare</strong>
                <small>DNS · CDN · SSL</small>
              </div>
              <i aria-hidden>→</i>
              <div className={styles.archNode}>
                <span>03</span>
                <strong>Nginx</strong>
                <small>Proxy · Static · MIME</small>
              </div>
              <i aria-hidden>→</i>
              <div className={`${styles.archNode} ${styles.archNodePrimary}`}>
                <span>04</span>
                <strong>Next.js + PM2</strong>
                <small>127.0.0.1:3001</small>
              </div>
              <i aria-hidden>→</i>
              <div className={styles.archNode}>
                <span>05</span>
                <strong>Prisma</strong>
                <small>ORM · Transaction</small>
              </div>
              <i aria-hidden>→</i>
              <div className={styles.archNode}>
                <span>06</span>
                <strong>MySQL</strong>
                <small>29 data models</small>
              </div>
            </div>

            <div className={styles.integrationRow}>
              <div>
                <span>Thanh toán</span>
                <strong>Casso · SePay · PayOS</strong>
              </div>
              <div>
                <span>Thông báo</span>
                <strong>SMTP · Nodemailer</strong>
              </div>
              <div>
                <span>Marketing</span>
                <strong>GA4 · GTM · Ads · Clarity</strong>
              </div>
              <div>
                <span>Nội dung</span>
                <strong>CMS nội bộ · WordPress</strong>
              </div>
            </div>
          </div>

          <div className={styles.architectureNotes}>
            <div>
              <h3>Vì sao chưa dùng microservice?</h3>
              <p>
                Quy mô hiện tại chưa cần chi phí vận hành nhiều service độc lập. Modular monolith
                giúp triển khai nhanh, transaction dữ liệu rõ và vẫn cho phép tách payment, email
                hoặc media khi lượng truy cập tăng.
              </p>
            </div>
            <div>
              <h3>Ranh giới client và server</h3>
              <p>
                Server Components dùng cho nội dung và truy vấn. Client Components chỉ dùng khi
                cần state, event hoặc browser API; dữ liệu nhạy cảm và logic quyết định luôn nằm
                phía server.
              </p>
            </div>
          </div>
        </section>

        <section id="cong-nghe" className={styles.reportSection}>
          <SectionHeading
            number="03"
            eyebrow="Technology stack"
            title="Công nghệ và vai trò trong hệ thống"
            description="Mỗi công nghệ được chọn để giải quyết một lớp trách nhiệm cụ thể, không đưa thư viện nặng vào website nếu chức năng hiện có đã đáp ứng."
            icon={Layers3}
          />
          <div className={styles.tableWrap}>
            <table>
              <caption>Các lớp công nghệ cốt lõi của Mushroomie</caption>
              <thead>
                <tr>
                  <th scope="col">Lớp</th>
                  <th scope="col">Công nghệ</th>
                  <th scope="col">Vai trò</th>
                </tr>
              </thead>
              <tbody>
                {technologyGroups.map((group) => (
                  <tr key={group.layer}>
                    <th scope="row">{group.layer}</th>
                    <td>{group.technologies}</td>
                    <td>{group.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="cau-truc-ma-nguon" className={styles.reportSection}>
          <SectionHeading
            number="04"
            eyebrow="Repository map"
            title="Cấu trúc mã nguồn"
            description="File-system routing của Next.js kết hợp các thư mục nghiệp vụ, dữ liệu, kiểm thử và vận hành trong cùng repository."
            icon={FileText}
          />
          <div className={styles.codeLayout}>
            <pre aria-label="Cây thư mục dự án Mushroomie">
              <code>{projectTree}</code>
            </pre>
            <div className={styles.codeNotes}>
              <div>
                <strong>src/app</strong>
                <p>Trang, layout và API route. Route group không làm thay đổi URL công khai.</p>
              </div>
              <div>
                <strong>src/lib</strong>
                <p>Auth, payment provider, pricing, inventory, email, media, SEO và security.</p>
              </div>
              <div>
                <strong>prisma</strong>
                <p>Schema MySQL, migration và seed; transaction nằm ở tầng dịch vụ/API.</p>
              </div>
              <div>
                <strong>video</strong>
                <p>Dự án video giới thiệu độc lập, không được import vào runtime website.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="phan-he" className={styles.reportSection}>
          <SectionHeading
            number="05"
            eyebrow="Functional systems"
            title="Mười sáu phân hệ chính"
            description="Chuỗi chức năng bao phủ toàn bộ vòng đời khách hàng: tiếp cận, mua hàng, thanh toán, giữ chân và quản trị vận hành."
            icon={BookOpen}
          />
          <div className={styles.moduleGrid}>
            {systemModules.map((module) => (
              <div key={module.number} className={styles.moduleCard}>
                <span className={styles.moduleNumber}>{module.number}</span>
                <h3>{module.title}</h3>
                <p>{module.summary}</p>
                <small>{module.detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="luong-nghiep-vu" className={styles.reportSection}>
          <SectionHeading
            number="06"
            eyebrow="Critical flows"
            title="Luồng đặt hàng và thanh toán"
            description="Hai luồng có rủi ro cao nhất được kiểm soát bằng server-side validation, database transaction, webhook verification và audit log."
            icon={CheckCircle2}
          />
          <div className={styles.flowGrid}>
            <FlowList title="A. Tạo đơn hàng" steps={orderFlow} />
            <FlowList title="B. Xác nhận chuyển khoản" steps={paymentFlow} />
          </div>
          <aside className={styles.callout}>
            <ShieldCheck size={24} aria-hidden />
            <div>
              <strong>Nguyên tắc quan trọng</strong>
              <p>
                Trình duyệt không có quyền tự quyết định giá, discount hoặc trạng thái PAID. Mọi
                thay đổi tài chính phải được server kiểm tra và ghi bằng transaction có thể kiểm
                toán.
              </p>
            </div>
          </aside>
        </section>

        <section id="co-so-du-lieu" className={styles.reportSection}>
          <SectionHeading
            number="07"
            eyebrow="Data model"
            title="Cơ sở dữ liệu MySQL qua Prisma"
            description="29 Prisma model được nhóm theo miền nghiệp vụ để duy trì quan hệ dữ liệu và tính toàn vẹn của đơn hàng, thanh toán và nội dung."
            icon={Database}
          />
          <div className={styles.databaseGrid}>
            {databaseGroups.map((group) => (
              <div key={group.title} className={styles.databaseCard}>
                <h3>{group.title}</h3>
                <p>{group.purpose}</p>
                <ul aria-label={`Models thuộc nhóm ${group.title}`}>
                  {group.models.map((model) => (
                    <li key={model}>{model}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="bao-mat" className={styles.reportSection}>
          <SectionHeading
            number="08"
            eyebrow="Security by design"
            title="Các lớp bảo mật chính"
            description="Bảo mật được đặt trong logic nghiệp vụ, API, hạ tầng HTTP và pipeline media thay vì chỉ dựa vào việc ẩn giao diện."
            icon={LockKeyhole}
          />
          <div className={styles.securityGrid}>
            {securityControls.map((control, index) => (
              <div key={control.title} className={styles.securityCard}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{control.title}</h3>
                <p>{control.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="hieu-suat-seo" className={styles.reportSection}>
          <SectionHeading
            number="09"
            eyebrow="Discoverability & speed"
            title="Hiệu suất, SEO và đo lường"
            description="Mushroomie cân bằng khả năng tìm kiếm, hình ảnh sản phẩm và tracking marketing với mục tiêu giữ trải nghiệm mobile nhanh và ổn định."
            icon={Sparkles}
          />
          <div className={styles.dualChecklist}>
            <div>
              <h3>Hiệu suất và Core Web Vitals</h3>
              <ul>
                {performanceItems.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={17} aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>SEO kỹ thuật và content</h3>
              <ul>
                {seoItems.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={17} aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.analyticsStrip}>
                <span>GTM</span>
                <span>GA4</span>
                <span>Google Ads</span>
                <span>Clarity</span>
              </div>
            </div>
          </div>
        </section>

        <section id="van-hanh" className={styles.reportSection}>
          <SectionHeading
            number="10"
            eyebrow="Production operations"
            title="Triển khai, kiểm thử và rollback"
            description="Production chạy standalone trên VPS, được bảo vệ bởi Cloudflare/Nginx và quản lý process bằng PM2; không sử dụng Docker."
            icon={Server}
          />
          <div className={styles.opsGrid}>
            <div className={styles.opsCard}>
              <p className={styles.cardLabel}>Runtime</p>
              <dl>
                <div><dt>Domain</dt><dd>mushroomie.io.vn</dd></div>
                <div><dt>VPS hiện hành</dt><dd>103.77.242.153</dd></div>
                <div><dt>Project</dt><dd>/var/www/mushroomie</dd></div>
                <div><dt>Process</dt><dd>mushroomie_pm2</dd></div>
                <div><dt>Origin app</dt><dd>127.0.0.1:3001</dd></div>
              </dl>
            </div>
            <div className={styles.opsCard}>
              <p className={styles.cardLabel}>CI quality gates</p>
              <ol>
                <li><span>01</span> npm ci</li>
                <li><span>02</span> prisma generate</li>
                <li><span>03</span> typecheck và lint</li>
                <li><span>04</span> unit/integration tests</li>
                <li><span>05</span> Next.js production build</li>
                <li><span>06</span> health, routes và MIME verification</li>
              </ol>
            </div>
            <div className={styles.opsCard}>
              <p className={styles.cardLabel}>Dữ liệu cần bảo toàn</p>
              <ul>
                <li>.env và secret production</li>
                <li>public/uploads</li>
                <li>database và migration</li>
                <li>backups</li>
                <li>release trước để rollback</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="thuyet-trinh" className={styles.reportSection}>
          <SectionHeading
            number="11"
            eyebrow="Presentation guide"
            title="Dàn ý bảo vệ đề tài trong 5–7 phút"
            description="Một nhịp trình bày ngắn, đi từ giá trị kinh doanh đến bằng chứng kỹ thuật và khả năng mở rộng."
            icon={BookOpen}
          />
          <ol className={styles.presentationList}>
            {presentationOutline.map(([title, text], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <blockquote className={styles.closingStatement}>
            “Mushroomie không chỉ hiển thị và bán sản phẩm. Hệ thống quản lý toàn bộ hành trình từ
            khám phá, đặt hàng, thanh toán, chăm sóc sau mua đến quản trị và phân tích dữ liệu.”
          </blockquote>
        </section>

        <section id="phan-bien" className={styles.reportSection}>
          <SectionHeading
            number="12"
            eyebrow="Council Q&A"
            title="Câu hỏi phản biện thường gặp"
            description="Các câu trả lời tập trung vào quyết định kiến trúc và cơ chế bảo đảm tính đúng đắn của hệ thống."
            icon={ShieldCheck}
          />
          <div className={styles.faqList}>
            {councilQuestions.map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalSection}>
          <div>
            <p className={styles.eyebrow}>Kết luận</p>
            <h2>Một nền tảng có nghiệp vụ thật và khả năng phát triển tiếp</h2>
            <p>
              Bước tiếp theo có thể là Redis cho cache/rate limit phân tán, object storage cho
              media, queue cho email/webhook và hệ thống giám sát lỗi chuyên dụng khi quy mô tăng.
            </p>
          </div>
          <Link href="/san-pham" className={styles.primaryAction} data-report-chrome>
            Trải nghiệm website <ArrowUpRight size={18} aria-hidden />
          </Link>
        </section>
      </div>
    </article>
  )
}
