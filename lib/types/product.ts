export interface Product {
  id: string
  country_id: string
  title: string
  description?: string
  main_image_url: string
  image_urls?: string[]
  source_platform_id: string
  source_platform: string
  source_product_id: string
  source_url: string
  current_price: number
  original_price?: number
  sales_volume_7d?: number
  sales_growth_rate: number
  social_mentions_count?: number
  potential_score: number
  category?: string
  tags?: string[]
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  seller_count?: number
  listing_days?: number
  crawled_at: string
  created_at: string
  updated_at: string
  currency_symbol?: string
}

export interface ProductQueryParams {
  countryCode: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minPotentialScore?: number
  sortBy?: 'potential_score' | 'sales_growth_rate' | 'current_price' | 'crawled_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface RawThirdPartyProduct {
  id: string
  title: string
  description?: string
  mainImage: string
  images?: string[]
  price: number
  originalPrice?: number
  sales7d?: number
  salesGrowthRate: number
  socialMentions?: number
  category?: string
  tags?: string[]
  sourceUrl: string
  platform: string
}
