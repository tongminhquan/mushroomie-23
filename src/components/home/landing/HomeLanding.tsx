import AnimateOnScroll from '@/components/ui/AnimateOnScroll'
import HomeHeroLanding from './HomeHeroLanding'
import HomeBrandStory from './HomeBrandStory'
import HomeVisionMissionGoals from './HomeVisionMissionGoals'
import HomeCoreValues from './HomeCoreValues'
import HomeCategoryShowcase from './HomeCategoryShowcase'
import HomeFeaturedProducts from './HomeFeaturedProducts'
import HomeCustomProcess from './HomeCustomProcess'
import HomeHandmadeBehindScenes from './HomeHandmadeBehindScenes'
import HomeLatestPosts from './HomeLatestPosts'
import HomeTrust from './HomeTrust'
import HomeFinalCTA from './HomeFinalCTA'
import type {
  HomeBanner,
  HomeCategory,
  HomePost,
  HomeProduct,
  HomeReview,
} from './types'

export default function HomeLanding({
  banners,
  products,
  categories,
  posts,
  reviews,
}: {
  banners: HomeBanner[]
  products: HomeProduct[]
  categories: HomeCategory[]
  posts: HomePost[]
  reviews: HomeReview[]
}) {
  return (
    <>
      <HomeHeroLanding banners={banners} />
      <AnimateOnScroll duration={500}>
        <HomeBrandStory products={products} />
      </AnimateOnScroll>
      <HomeVisionMissionGoals />
      <AnimateOnScroll duration={500}>
        <HomeCoreValues />
      </AnimateOnScroll>
      <HomeCategoryShowcase categories={categories} />
      <HomeFeaturedProducts products={products} />
      <AnimateOnScroll duration={500}>
        <HomeCustomProcess products={products} />
      </AnimateOnScroll>
      <HomeHandmadeBehindScenes products={products} />
      <HomeLatestPosts posts={posts} />
      <AnimateOnScroll duration={500}>
        <HomeTrust reviews={reviews} />
      </AnimateOnScroll>
      <HomeFinalCTA />
    </>
  )
}
