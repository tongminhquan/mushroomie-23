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
      <div className="home-deferred-section"><HomeFeaturedProducts products={products} /></div>
      <div className="home-deferred-section"><HomeCustomCTA /></div>
      <div className="home-deferred-section"><HomeBrandStory products={products} /></div>
      <div className="home-deferred-section"><HomeVisionMissionGoals /></div>
      <div className="home-deferred-section"><HomeCoreValues /></div>
      <div className="home-deferred-section"><HomeCustomProcess products={products} /></div>
      <div className="home-deferred-section"><HomeHandmadeBehindScenes products={products} /></div>
      <div className="home-deferred-section"><HomeMiniGameCTA /></div>
      <div className="home-deferred-section"><HomeTrust reviews={reviews} /></div>
      <div className="home-deferred-section"><HomeLatestPosts posts={posts} /></div>
      <div className="home-deferred-section"><HomeFinalCTA /></div>
    </>
  )
}

