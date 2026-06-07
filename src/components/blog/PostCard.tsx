import Link from 'next/link'
import { ArrowUpRight, Calendar } from 'lucide-react'
import { formatDate, getPublicImageUrl } from '@/lib/utils'
import SafeImage from '@/components/ui/SafeImage'

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

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/tin-tuc/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-neutral-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-pink hover:shadow-hover">
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {post.featured_image ? (
            <SafeImage src={getPublicImageUrl(post.featured_image)} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-pink font-heading text-5xl text-primary/30">M</div>
          )}
          {post.category && (
            <span className="absolute left-3 top-3 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">{post.category.name}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 font-heading text-lg leading-snug text-text transition-colors group-hover:text-primary">{post.title}</h3>
          {post.excerpt && <p className="text-neutral-500 text-sm leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>}
          <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
            {post.published_at ? <span className="flex items-center gap-1.5 text-xs text-neutral-400" suppressHydrationWarning><Calendar size={13} />{formatDate(post.published_at)}</span> : <span />}
            <ArrowUpRight size={17} className="text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
    </Link>
  )
}
