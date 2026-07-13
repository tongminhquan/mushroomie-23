import HomeHeroLanding from './HomeHeroLanding'
import HomeCustomCTA from './HomeCustomCTA'
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
import HomeMiniGameCTA from './HomeMiniGameCTA'
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
      <HomeCategoryShowcase categories={categories} />
      <HomeFeaturedProducts products={products} />
      <HomeCustomCTA />
      <HomeBrandStory products={products} />
      <HomeVisionMissionGoals />
      <HomeCoreValues />
      <HomeCustomProcess products={products} />
      <HomeHandmadeBehindScenes products={products} />
      <HomeMiniGameCTA />
      <HomeTrust reviews={reviews} />
      <HomeLatestPosts posts={posts} />
      <HomeFinalCTA />
    </>
  )
}

