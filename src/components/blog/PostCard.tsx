import Link from 'next/link'
import { ArrowUpRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import SafeImage from '@/components/ui/SafeImage'
import { resolveImageUrlForRender } from '@/lib/server-image'

interface PostCardProps {
  post: {
    id: number
    title: string
    slug: string
    excerpt?: string | null
    featured_image?: string | null
    published_at?: Date | string | null
    category?: { name: string; slug: string } | null
  }
}

export default async function PostCard({ post }: PostCardProps) {
  const featuredImageSrc = await resolveImageUrlForRender(post.featured_image, 'post')

  return (
    <Link href={`/tin-tuc/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[24px] border-[1.5px] border-warm-border bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-hover">
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
          <SafeImage
            src={featuredImageSrc}
            alt={post.title}
            fill
            imageKind="post"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {post.category && (
            <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-primary shadow-sm">
              {post.category.name}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 font-heading text-xl leading-snug text-text transition-colors group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mb-4 mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-500">
              {post.excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between border-t border-warm-border pt-4">
            {post.published_at ? (
              <span
                className="flex items-center gap-1.5 text-xs text-neutral-500"
                suppressHydrationWarning
              >
                <Calendar size={13} />
                {formatDate(post.published_at)}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-primary">
              Xem bài
              <ArrowUpRight
                size={17}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
