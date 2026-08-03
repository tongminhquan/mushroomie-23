import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import PostCard from '@/components/blog/PostCard'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomePost } from './types'

export default function HomeLatestPosts({ posts }: { posts: HomePost[] }) {
  if (posts.length === 0) return null

  return (
    <section className="bg-theme-section py-16 text-theme-primary md:py-24">
      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Góc handmade"
          title="Chuyện nhỏ, mẹo hay và cảm hứng phối đồ"
          description="Theo dõi những câu chuyện phía sau sản phẩm, cách chọn charm và các ý tưởng quà tặng có dấu ấn riêng."
        />
        <div data-batch-reveal className="grid gap-5 md:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-8">
          <Link
            href="/tin-tuc"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-primary px-6 text-sm font-extrabold text-theme-accent hover:bg-primary hover:text-white"
          >
            Xem tất cả bài viết <ArrowRight size={17} />
          </Link>
        </div>
      </BrandContainer>
    </section>
  )
}
