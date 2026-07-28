import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: BASE_URL,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 py-3 text-sm text-neutral-500"
      >
        <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Home size={14} />
          <span>Trang chủ</span>
        </Link>
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-neutral-400" />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="m-underline hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-primary">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
