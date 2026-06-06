import Link from 'next/link'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import { formatDate, getPublicImageUrl } from '@/lib/utils'

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
    <Link href={`/tin-tuc/${post.slug}`} className="group block">
      <article className="bg-white rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(64,64,64,0.12)] hover:shadow-[0_8px_30px_rgba(228,29,29,0.18)] transition-all duration-300 hover:-translate-y-1 h-full">
        <div className="relative h-48 overflow-hidden bg-neutral-50">
          {post.featured_image ? (
            <Image src={getPublicImageUrl(post.featured_image)} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-light to-accent-mint flex items-center justify-center"><span className="text-4xl">🍄</span></div>
          )}
          {post.category && (
            <span className="absolute top-3 left-3 gradient-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{post.category.name}</span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-bold text-neutral-900 text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
          {post.excerpt && <p className="text-neutral-500 text-sm leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>}
          {post.published_at && (
            <div className="flex items-center gap-1 text-xs text-neutral-400" suppressHydrationWarning>
              <Calendar size={12} />
              {formatDate(post.published_at)}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
