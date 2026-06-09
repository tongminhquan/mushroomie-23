export interface HomeProduct {
  id: number
  name: string
  slug: string
  price: number
  sale_price?: number | null
  featured_image?: string | null
  is_customizable?: boolean
  stock?: number
  category?: { name: string; slug: string } | null
  images?: { image_url: string }[]
}

export interface HomePost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  published_at: Date | string | null
  category: { name: string; slug: string } | null
}

export interface HomeReview {
  id: number
  rating: number
  content: string
  name: string
}

export interface HomeCategory {
  id: number
  name: string
  slug: string
  image_url: string | null
  icon: string | null
}

export interface HomeBanner {
  id: number
  image_url: string
  title: string | null
  subtitle: string | null
  description: string | null
  button_text: string | null
  button_link: string | null
  secondary_button_text: string | null
  secondary_button_link: string | null
  link: string | null
  text_position: string
  text_size: string
  brightness: number
  sort_order: number
  status: string
}
