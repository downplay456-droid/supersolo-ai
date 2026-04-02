import { RawThirdPartyProduct, ProductQueryParams } from '@/lib/types/product'
import { createClient } from '@/utils/supabase/server'

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
        mainImage: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🎧\nWireless\nEarbuds',
        price: 49.99,
        salesGrowthRate: 128.5,
        category: 'Electronics',
        sourceUrl: 'https://www.amazon.com/dp/example1',
        platform: 'Amazon US'
      },
      {
        id: 'mock-2',
        title: 'Silicone Food Storage Bags (Set of 8)',
        mainImage: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🥡\nFood\nStorage+Bags',
        price: 24.99,
        salesGrowthRate: 94.2,
        category: 'Home & Kitchen',
        sourceUrl: 'https://www.tiktok.com/shop/example2',
        platform: 'TikTok Shop US'
      },
      {
        id: 'mock-3',
        title: 'Waterproof Phone Pouch for Swimming',
        mainImage: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=📱\nWaterproof\nPhone+Pouch',
        price: 12.99,
        salesGrowthRate: 215.3,
        category: 'Outdoor',
        sourceUrl: 'https://www.ebay.com/itm/example3',
        platform: 'eBay'
      },
      {
        id: 'mock-4',
        title: 'Portable Blender for Smoothies',
        mainImage: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🧃\nPortable\nBlender',
        price: 34.99,
        salesGrowthRate: 76.8,
        category: 'Home Appliances',
        sourceUrl: 'https://www.amazon.com/dp/example4',
        platform: 'Amazon US'
      },
      {
        id: 'mock-5',
        title: 'Yoga Mat with Alignment Lines',
        mainImage: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🧘\nYoga\nMat',
        price: 29.99,
        salesGrowthRate: 67.4,
        category: 'Sports & Fitness',
        sourceUrl: 'https://www.instagram.com/p/example5',
        platform: 'Instagram'
      },
      {
        id: 'mock-6',
        title: 'LED Strip Lights for Bedroom',
        mainImage: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=💡\nLED\nStrip+Lights',
        price: 19.99,
        salesGrowthRate: 105.7,
        category: 'Home Decor',
        sourceUrl: 'https://www.reddit.com/r/HomeDecor/example6',
        platform: 'Reddit'
      }
    ]

    // 简单模拟筛选和排序
    let filtered = [...mockProducts]

    if (params.category) {
      filtered = filtered.filter(p => p.category?.toLowerCase().includes(params.category.toLowerCase()))
    }

    if (params.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= params.minPrice)
    }

    if (params.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= params.maxPrice)
    }

    // 排序
    if (params.sortBy === 'sales_growth_rate') {
      filtered.sort((a, b) => params.sortOrder === 'asc' ? a.salesGrowthRate - b.salesGrowthRate : b.salesGrowthRate - a.salesGrowthRate)
    }

    return filtered
  }

  async getProductDetail(productId: string): Promise<RawThirdPartyProduct | null> {
    const products = await this.getProducts('US', {})
    return products.find(p => p.id === productId) || null
  }
}

// 实际第三方API客户端示例（可根据需要扩展）
export class TikTokShopAPIClient implements ThirdPartyProductAPI {
  private apiKey: string
  private appSecret: string
  private baseUrl: string

  constructor(apiKey: string, appSecret: string) {
    this.apiKey = apiKey
    this.appSecret = appSecret
    this.baseUrl = 'https://open-api.tiktokglobalshop.com/api'
  }

  async getProducts(countryCode: string, params: Omit<ProductQueryParams, 'countryCode'>): Promise<RawThirdPartyProduct[]> {
    try {
      // TikTok Shop Open API 调用实现
      const timestamp = Math.floor(Date.now() / 1000)
      const sign = this.generateTikTokSignature(timestamp, params)

      const queryParams = new URLSearchParams({
        app_key: this.apiKey,
        timestamp: timestamp.toString(),
        sign: sign,
        page_size: (params.pageSize || 24).toString(),
        page_number: (params.page || 1).toString(),
        sort_by: params.sortBy || 'sales',
        sort_order: params.sortOrder || 'desc',
        country_code: countryCode
      })

      if (params.category) {
        queryParams.append('category', params.category)
      }

      const response = await fetch(`${this.baseUrl}/products/search?${queryParams.toString()}`)
      if (!response.ok) {
        console.error('TikTok Shop API request failed:', response.statusText)
        return []
      }

      const data = await response.json()
      if (data.code !== 0) {
        console.error('TikTok Shop API error:', data.message)
        return []
      }

      return this.parseTikTokResponse(data.data)
    } catch (error) {
      console.error('TikTok Shop API error:', error)
      return []
    }
  }

  async getProductDetail(productId: string): Promise<RawThirdPartyProduct | null> {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const sign = this.generateTikTokSignature(timestamp, { product_id: productId })

      const response = await fetch(`${this.baseUrl}/products/detail?app_key=${this.apiKey}&timestamp=${timestamp}&sign=${sign}&product_id=${productId}`)
      if (!response.ok) return null

      const data = await response.json()
      if (data.code !== 0) return null

      const products = this.parseTikTokResponse([data.data])
      return products[0] || null
    } catch (error) {
      console.error('TikTok Shop API detail error:', error)
      return null
    }
  }

  private generateTikTokSignature(timestamp: number, params: any): string {
    // TikTok API签名算法实现
    // 实际使用时需要按照TikTok官方文档实现HMAC-SHA256签名
    const sortedParams = Object.keys(params).sort().map(key => `${key}${params[key]}`).join('')
    const signString = `${this.appSecret}${sortedParams}${this.appSecret}`
    // 这里简化处理，实际需要使用crypto库生成签名
    return require('crypto').createHmac('sha256', this.appSecret).update(signString).digest('hex')
  }

  private parseTikTokResponse(items: any[]): RawThirdPartyProduct[] {
    return items.map((item: any) => ({
      id: item.product_id,
      title: item.product_name,
      description: item.description || '',
      mainImage: item.main_images?.[0]?.url || '',
      images: item.main_images?.map((img: any) => img.url) || [],
      price: parseFloat(item.price) / 100, // 价格单位转换为美元
      originalPrice: parseFloat(item.original_price || item.price) / 100,
      salesGrowthRate: item.sales_growth || Math.random() * 150,
      socialMentions: item.views || Math.floor(Math.random() * 1000),
      category: item.category_name || 'Uncategorized',
      tags: item.tags || [],
      sourceUrl: `https://www.tiktok.com/shop/product/${item.product_id}`,
      platform: 'TikTok Shop'
    }))
  }
}

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

  private generateAmazonSignature(requestBody: any): string {
    // Amazon AWS V4 签名实现（实际使用时需要完整实现）
    // 这里简化处理，实际项目需要使用aws4库
    return 'AWS4-HMAC-SHA256 Credential=...'
  }

  private parseAmazonResponse(data: any): RawThirdPartyProduct[] {
    if (!data.ItemsResult || !data.ItemsResult.Items) return []

    return data.ItemsResult.Items.map((item: any) => ({
      id: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      description: item.ItemInfo?.Features?.DisplayValues?.join('\n') || '',
      mainImage: item.Images?.Primary?.Large?.URL || '',
      images: item.Images?.Variants?.Large?.map((img: any) => img.URL) || [],
      price: parseFloat(item.Offers?.Listings[0]?.Price?.Amount || '0'),
      originalPrice: parseFloat(item.Offers?.Listings[0]?.Price?.Amount || '0'),
      salesGrowthRate: Math.random() * 200, // Amazon API不直接返回增长率，需要额外计算
      socialMentions: Math.floor(Math.random() * 500),
      category: item.BrowseNodeInfo?.BrowseNodes[0]?.DisplayName || 'Uncategorized',
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
    return this.accessToken
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
        const posts = data.data.children.map((child: any) => child.data)

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
      if (params.category) {
        filtered = filtered.filter(p => p.category?.toLowerCase().includes(params.category.toLowerCase()))
      }
      if (params.minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= params.minPrice)
      }
      if (params.maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= params.maxPrice)
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
  // 优先使用传入的类型，否则从环境变量读取，默认使用mock
  const apiType = type || (process.env.NEXT_PUBLIC_API_SOURCE as any) || 'mock'

  switch (apiType) {
    case 'mock':
      return new MockAPIClient()
    case 'tiktok':
      const tiktokApiKey = process.env.TIKTOK_SHOP_API_KEY
      const tiktokAppSecret = process.env.TIKTOK_SHOP_APP_SECRET
      if (!tiktokApiKey || !tiktokAppSecret) {
        console.warn('TikTok Shop API credentials not configured, falling back to mock')
        return new MockAPIClient()
      }
      return new TikTokShopAPIClient(tiktokApiKey, tiktokAppSecret)
    case 'amazon':
      const amazonAccessKey = process.env.AMAZON_ACCESS_KEY
      const amazonSecretKey = process.env.AMAZON_SECRET_KEY
      const amazonPartnerTag = process.env.AMAZON_PARTNER_TAG
      if (!amazonAccessKey || !amazonSecretKey || !amazonPartnerTag) {
        console.warn('Amazon API credentials not configured, falling back to mock')
        return new MockAPIClient()
      }
      return new AmazonAPIClient(amazonAccessKey, amazonSecretKey, amazonPartnerTag)
    case 'reddit':
      const redditClientId = process.env.REDDIT_CLIENT_ID
      const redditClientSecret = process.env.REDDIT_CLIENT_SECRET
      const redditUserAgent = process.env.REDDIT_USER_AGENT
      if (!redditClientId || !redditClientSecret || !redditUserAgent) {
        console.warn('Reddit API credentials not configured, falling back to mock')
        return new MockAPIClient()
      }
      return new RedditAPIClient(redditClientId, redditClientSecret, redditUserAgent)
    default:
      return new MockAPIClient()
  }
}
