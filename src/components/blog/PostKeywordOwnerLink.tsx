import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getSupportingPostOwner } from '@/lib/seo-phase-4'

export default function PostKeywordOwnerLink({
  slug,
  focusKeyword,
}: {
  slug: string
  focusKeyword?: string | null
}) {
  const owner = getSupportingPostOwner({ slug, focusKeyword })
  if (!owner) return null

  return (
    <aside
      className="mt-10 border-y border-warm-border py-6"
      aria-labelledby="post-keyword-owner-title"
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
        Khám phá thêm
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h2 id="post-keyword-owner-title" className="font-heading text-xl text-neutral-900">
            {owner.label}
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">{owner.description}</p>
        </div>
        <Link
          href={owner.href}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 font-bold text-primary transition-colors hover:text-primary-dark"
        >
          Xem bộ sưu tập
          <ArrowUpRight size={17} aria-hidden />
        </Link>
      </div>
    </aside>
  )
}
