import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem { label: string; href?: string }

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-neutral-500 py-3">
      <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home size={14} /><span>Trang chủ</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-neutral-400" />
          {item.href && index < items.length - 1 ? (
            <Link href={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
          ) : (
            <span className="text-primary font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
