import { RawThirdPartyProduct, ProductQueryParams } from '@/lib/types/product'
import { createClient } from '@/utils/supabase/server'

interface AmazonItem {
  ASIN: string
  ItemInfo?: {
    Title?: { DisplayValue?: string }
    Features?: { DisplayValues?: string[] }
  }
  Images?: {
    Primary?: { Large?: { URL: string } }
    Variants?: { Large?: Array<{ URL: string }> }
  }
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: string }
    }>
  }
  BrowseNodeInfo?: {
    BrowseNodes?: Array<{ DisplayName?: string }>
  }
}

// 抽象第三方API接口
interface ThirdPartyProductAPI {
  getProducts(countryCode: string, params: Omit<ProductQueryParams, 'countryCode'>): Promise<RawThirdPartyProduct[]>
  getProductDetail(productId: string): Promise<RawThirdPartyProduct | null>
}

// Mock API 客户端 - 用于开发和降级场景
export class MockAPIClient implements ThirdPartyProductAPI {
  async getProducts(countryCode: string, params: Omit<ProductQueryParams, 'countryCode'>): Promise<RawThirdPartyProduct[]> {
    // 返回模拟数据，实际场景下替换为真实API调用
    const mockProducts: RawThirdPartyProduct[] = [
      {
        id: 'mock-1',
        title: 'Wireless Earbuds with Noise Cancelling',
        mainImage: 'https://picsum.photos/seed/airpodspro/300/300',
        price: 49.99,
        salesGrowthRate: 128.5,
        category: 'Electronics',
        sourceUrl: 'https://www.amazon.com/dp/example1',
        platform: 'Amazon US'
      },
      {
        id: 'mock-2',
        title: 'Silicone Food Storage Bags (Set of 8)',
        mainImage: 'https://picsum.photos/seed/siliconebags/300/300',
        price: 24.99,
        salesGrowthRate: 94.2,
        category: 'Home & Kitchen',
        sourceUrl: 'https://www.tiktok.com/shop/example2',
        platform: 'TikTok Shop US'
      },
      {
        id: 'mock-3',
        title: 'Waterproof Phone Pouch for Swimming',
        mainImage: 'https://picsum.photos/seed/waterproofcase/300/300',
        price: 12.99,
        salesGrowthRate: 215.3,
        category: 'Outdoor',
        sourceUrl: 'https://www.ebay.com/itm/example3',
        platform: 'eBay'
      },
      {
        id: 'mock-4',
        title: 'Portable Blender for Smoothies',
        mainImage: 'https://picsum.photos/seed/smoothieblender/300/300',
        price: 34.99,
        salesGrowthRate: 76.8,
        category: 'Home Appliances',
        sourceUrl: 'https://www.amazon.com/dp/example4',
        platform: 'Amazon US'
      },
      {
        id: 'mock-5',
        title: 'Yoga Mat with Alignment Lines',
        mainImage: 'https://picsum.photos/seed/yogafitness/300/300',
        price: 29.99,
        salesGrowthRate: 67.4,
        category: 'Sports & Fitness',
        sourceUrl: 'https://www.instagram.com/p/example5',
        platform: 'Instagram'
      },
      {
        id: 'mock-6',
        title: 'LED Strip Lights for Bedroom',
        mainImage: 'https://picsum.photos/seed/ledstriplight/300/300',
        price: 19.99,
        salesGrowthRate: 105.7,
        category: 'Home Decor',
        sourceUrl: 'https://www.reddit.com/r/HomeDecor/example6',
        platform: 'Reddit'
      },
      {
        id: 'mock-7',
        title: 'Smart Watch with Heart Rate Monitor',
        mainImage: 'https://picsum.photos/seed/applewatch/300/300',
        price: 89.99,
        salesGrowthRate: 156.7,
        category: 'Electronics',
        sourceUrl: 'https://www.amazon.com/dp/example7',
        platform: 'Amazon US'
      },
      {
        id: 'mock-8',
        title: 'Silicone Air Fryer Liners (100 Pack)',
        mainImage: 'https://picsum.photos/seed/airfryerliner/300/300',
        price: 15.99,
        salesGrowthRate: 89.3,
        category: 'Home & Kitchen',
        sourceUrl: 'https://www.tiktok.com/shop/example8',
        platform: 'TikTok Shop US'
      }
    ]

    // 简单模拟筛选和排序
    let filtered = [...mockProducts]

    const { category, minPrice, maxPrice, sortBy, sortOrder, pageSize } = params;

    if (category) {
      filtered = filtered.filter(p => p.category?.toLowerCase().includes(category.toLowerCase()))
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= minPrice)
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= maxPrice)
    }

    // 排序
    if (sortBy === 'sales_growth_rate') {
      filtered.sort((a, b) => sortOrder === 'asc' ? a.salesGrowthRate - b.salesGrowthRate : b.salesGrowthRate - a.salesGrowthRate)
    }

    return filtered
  }

  async getProductDetail(productId: string): Promise<RawThirdPartyProduct | null> {
    const mockProducts = await this.getProducts('US', { sortBy: 'potential_score', sortOrder: 'desc' });
    return mockProducts.find(p => p.id === productId) || null;
  }
}

// Amazon API 客户端 - 用于亚马逊商品数据采集
export class AmazonAPIClient implements ThirdPartyProductAPI {
  private accessKey: string
  private secretKey: string
  private partnerTag: string
  private baseUrl: string

  constructor(accessKey: string, secretKey: string, partnerTag: string) {
    this.accessKey = accessKey
    this.secretKey = secretKey
    this.partnerTag = partnerTag
    this.baseUrl = 'https://webservices.amazon.com/paapi5/searchitems'
  }

  async getProducts(countryCode: string, params: Omit<ProductQueryParams, 'countryCode'>): Promise<RawThirdPartyProduct[]> {
    try {
      // Amazon PAAPI 5.0 调用实现
      const requestBody = {
        PartnerTag: this.partnerTag,
        PartnerType: 'Associates',
        Keywords: params.category || 'trending',
        ItemCount: params.pageSize || 24,
        ItemPage: params.page || 1,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'Offers.Listings.Price',
          'Offers.Listings.SavingPercent',
          'BrowseNodeInfo.BrowseNodes'
        ]
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
          'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
          'Authorization': this.generateAmazonSignature(requestBody)
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        console.error('Amazon API request failed:', response.statusText)
        return []
      }

      const data = await response.json()
      return this.parseAmazonResponse(data)
    } catch (error) {
      console.error('Amazon API error:', error)
      return []
    }
  }

  async getProductDetail(productId: string): Promise<RawThirdPartyProduct | null> {
    try {
      // 实现商品详情查询
      const requestBody = {
        PartnerTag: this.partnerTag,
        PartnerType: 'Associates',
        ItemIds: [productId],
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'Offers.Listings.Price',
          'BrowseNodeInfo.BrowseNodes'
        ]
      }

      const response = await fetch('https://webservices.amazon.com/paapi5/getitems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
          'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
          'Authorization': this.generateAmazonSignature(requestBody)
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) return null
      const data = await response.json()
      const products = this.parseAmazonResponse(data)
      return products[0] || null
    } catch (error) {
      console.error('Amazon API detail error:', error)
      return null
    }
  }

  private generateAmazonSignature(requestBody: Record<string, unknown>): string {
    // Amazon AWS V4 签名实现（实际使用时需要完整实现）
    // 这里简化处理，实际项目需要使用aws4库
    return 'AWS4-HMAC-SHA256 Credential=...'
  }

  private parseAmazonResponse(data: { ItemsResult?: { Items?: AmazonItem[] } }): RawThirdPartyProduct[] {
    if (!data.ItemsResult?.Items) return []

    return data.ItemsResult.Items.map((item: AmazonItem) => ({
      id: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      description: item.ItemInfo?.Features?.DisplayValues?.join('\n') || '',
      mainImage: item.Images?.Primary?.Large?.URL || '',
      images: item.Images?.Variants?.Large?.map(img => img.URL) || [],
      price: parseFloat(item.Offers?.Listings?.[0]?.Price?.Amount || '0'),
      originalPrice: parseFloat(item.Offers?.Listings?.[0]?.Price?.Amount || '0'),
      salesGrowthRate: Math.random() * 200, // Amazon API不直接返回增长率，需要额外计算
      socialMentions: Math.floor(Math.random() * 500),
      category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || 'Uncategorized',
      tags: [],
      sourceUrl: `https://www.amazon.com/dp/${item.ASIN}`,
      platform: 'Amazon'
    }))
  }
}

// Reddit API 客户端 - 用于社区热门选品数据采集
export class RedditAPIClient implements ThirdPartyProductAPI {
  private clientId: string
  private clientSecret: string
  private userAgent: string
  private accessToken: string | null = null

  constructor(clientId: string, clientSecret: string, userAgent: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.userAgent = userAgent
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.userAgent
      },
      body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    this.accessToken = data.access_token
    // 1小时后过期
    setTimeout(() => { this.accessToken = null }, 3600 * 1000)
    return this.accessToken!
  }

  async getProducts(countryCode: string, params: Omit<ProductQueryParams, 'countryCode'>): Promise<RawThirdPartyProduct[]> {
    try {
      const accessToken = await this.getAccessToken()
      const subreddits = ['r/AmazonFinds', 'r/DealOfTheDay', 'r/ShutUpAndTakeMyMoney', 'r/GiftIdeas']
      const products: RawThirdPartyProduct[] = []

      for (const subreddit of subreddits) {
        const response = await fetch(`https://oauth.reddit.com/${subreddit}/hot?limit=20`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': this.userAgent
          }
        })

        const data = await response.json()
        interface RedditPost {
          id: string
          title: string
          url: string
          selftext?: string
          thumbnail?: string
          upvote_ratio: number
          num_comments: number
        }
        const posts: RedditPost[] = data.data.children.map((child: { data: RedditPost }) => child.data)

        // 提取帖子中的产品信息
        for (const post of posts) {
          // 简单规则：标题包含价格、链接到Amazon等电商平台
          if (post.title.match(/\$\d+/) && (post.url.includes('amazon.com') || post.url.includes('amzn.to'))) {
            products.push({
              id: post.id,
              title: post.title.replace(/\$(\d+(\.\d+)?)/g, '').trim(),
              description: post.selftext || '',
              mainImage: post.thumbnail || `https://placehold.co/300x300/1a1a1f/c6ff00?text=REDDIT\nPRODUCT`,
              price: parseFloat(post.title.match(/\$(\d+(\.\d+)?)/)?.[1] || '0'),
              salesGrowthRate: post.upvote_ratio * 100 + Math.random() * 50,
              socialMentions: post.num_comments,
              category: subreddit.replace('r/', ''),
              sourceUrl: post.url,
              platform: 'Reddit'
            })
          }
        }
      }

      // 应用筛选
      let filtered = products
      const { category, minPrice, maxPrice } = params
      if (category) {
        filtered = filtered.filter(p => p.category?.toLowerCase().includes(category.toLowerCase()))
      }
      if (minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= minPrice)
      }
      if (maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= maxPrice)
      }

      // 按热度排序
      filtered.sort((a, b) => (b.salesGrowthRate || 0) - (a.salesGrowthRate || 0))
      return filtered.slice(0, params.pageSize || 24)
    } catch (error) {
      console.error('Reddit API error:', error)
      return []
    }
  }

  async getProductDetail(productId: string): Promise<RawThirdPartyProduct | null> {
    // 实现商品详情查询
    return null
  }
}

// API客户端工厂
export function createAPIClient(type?: 'mock' | 'tiktok' | 'amazon' | 'reddit'): ThirdPartyProductAPI {
  // 临时演示：强制使用mock数据源，确保不依赖外部API
  return new MockAPIClient()

  // 原逻辑保留（如需启用真实API，取消下方注释）
  // const apiType = type || (process.env.NEXT_PUBLIC_API_SOURCE as string) || 'mock'

  // switch (apiType) {
  //   case 'mock':
  //     return new MockAPIClient()
  //   case 'tiktok':
  //     const tiktokApiKey = process.env.TIKTOK_SHOP_API_KEY
  //     const tiktokAppSecret = process.env.TIKTOK_SHOP_APP_SECRET
  //     if (!tiktokApiKey || !tiktokAppSecret) {
  //       console.warn('TikTok Shop API credentials not configured, falling back to mock')
  //       return new MockAPIClient()
  //     }
  //     return new TikTokShopAPIClient(tiktokApiKey, tiktokAppSecret)
  //   case 'amazon':
  //     const amazonAccessKey = process.env.AMAZON_ACCESS_KEY
  //     const amazonSecretKey = process.env.AMAZON_SECRET_KEY
  //     const amazonPartnerTag = process.env.AMAZON_PARTNER_TAG
  //     if (!amazonAccessKey || !amazonSecretKey || !amazonPartnerTag) {
  //       console.warn('Amazon API credentials not configured, falling back to mock')
  //       return new MockAPIClient()
  //     }
  //     return new AmazonAPIClient(amazonAccessKey, amazonSecretKey, amazonPartnerTag)
  //   case 'reddit':
  //     const redditClientId = process.env.REDDIT_CLIENT_ID
  //     const redditClientSecret = process.env.REDDIT_CLIENT_SECRET
  //     const redditUserAgent = process.env.REDDIT_USER_AGENT
  //     if (!redditClientId || !redditClientSecret || !redditUserAgent) {
  //       console.warn('Reddit API credentials not configured, falling back to mock')
  //       return new MockAPIClient()
  //     }
  //     return new RedditAPIClient(redditClientId, redditClientSecret, redditUserAgent)
  //   default:
  //     return new MockAPIClient()
  // }
}
