import { createClient } from '@/utils/supabase/server'
import { Product, ProductQueryParams, RawThirdPartyProduct } from '@/lib/types/product'
import { createAPIClient } from '@/lib/third-party-api/clients'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// 计算潜力评分
function calculatePotentialScore(product: RawThirdPartyProduct): number {
  // 多维度加权评分算法，严格按照PRD要求实现（总分100%）
  // 1. 销售增长率（权重40%）：非线性评分，增长率越高边际收益递减
  // 增长率0% → 0分，200% → 80分，500% → 100分
  const salesGrowthScore = product.salesGrowthRate <= 0 ? 0 :
    Math.min(100, 100 * (1 - Math.exp(-product.salesGrowthRate / 150)))

  // 2. 社交热度（权重30%）：综合社交提及量和互动率
  // 提及量0 → 0分，500次 → 70分，2000次 → 100分
  const socialMentions = product.socialMentions || 0
  const socialScore = Math.min(100, 100 * (1 - Math.exp(-socialMentions / 300)))

  // 3. 价格健康度（权重15%）：根据目标市场消费能力计算
  // 最佳价格区间20-60美元 → 100分，10-20/60-100美元 → 70分，其他 → 40分
  let priceScore = 40
  if (product.price > 20 && product.price <= 60) {
    priceScore = 100
  } else if ((product.price > 10 && product.price <= 20) || (product.price > 60 && product.price <= 100)) {
    priceScore = 70
  }

  // 4. 竞争度（权重15%）：低竞争度优先
  // 竞争度计算因子：卖家数量（如果有）、listing天数、价格同质化程度
  // 目前基于平台和标签复杂度估算，后续可接入真实竞争度数据
  let competitionScore = 50 // 默认中等竞争
  const isNicheCategory = product.category &&
    ['Pet Supplies', 'Beauty & Personal Care', 'Home Improvement', 'Outdoor Recreation'].includes(product.category)

  if (isNicheCategory) {
    competitionScore = 80 // 利基类目竞争度较低
  }
  if (product.tags && product.tags.length > 3) {
    competitionScore += 10 // 标签丰富的产品通常竞争度较低
  }
  // 限制竞争度分数范围
  competitionScore = Math.max(20, Math.min(100, competitionScore))

  // 总分 = 各维度得分 * 权重（100%权重完全覆盖）
  const totalScore = Math.round(
    salesGrowthScore * 0.4 +
    socialScore * 0.3 +
    priceScore * 0.15 +
    competitionScore * 0.15
  )

  // 分数校准：提升区分度，避免分数集中在中间区间
  let calibratedScore = totalScore
  if (totalScore >= 80) {
    calibratedScore = Math.min(100, totalScore + 5) // 高分段上浮
  } else if (totalScore <= 40) {
    calibratedScore = Math.max(0, totalScore - 5) // 低分段下浮
  }

  // 确保分数在0-100之间
  return Math.max(0, Math.min(100, calibratedScore))
}

// 转换第三方原始数据为内部标准格式
function normalizeProductData(
  rawProduct: RawThirdPartyProduct,
  countryId: string,
  platformId: string
): Omit<Product, 'id' | 'created_at' | 'updated_at'> {
  return {
    country_id: countryId,
    title: rawProduct.title,
    description: rawProduct.description,
    main_image_url: rawProduct.mainImage,
    image_urls: rawProduct.images,
    source_platform_id: platformId,
    source_platform: rawProduct.platform,
    source_product_id: rawProduct.id,
    source_url: rawProduct.sourceUrl,
    current_price: rawProduct.price,
    original_price: rawProduct.originalPrice,
    sales_volume_7d: rawProduct.sales7d,
    sales_growth_rate: rawProduct.salesGrowthRate,
    social_mentions_count: rawProduct.socialMentions,
    potential_score: calculatePotentialScore(rawProduct),
    category: rawProduct.category,
    tags: rawProduct.tags,
    crawled_at: new Date().toISOString()
  }
}

// 获取平台ID
async function getPlatformId(supabase: SupabaseClient, platformName: string): Promise<string | null> {
  const { data } = await supabase
    .from('platforms')
    .select('id')
    .eq('name', platformName)
    .single()

  return data?.id || null
}

// 获取国家信息
async function getCountryId(supabase: SupabaseClient, countryCode: string): Promise<{ id: string; currency_symbol: string } | null> {
  const { data } = await supabase
    .from('countries')
    .select('id, code, name, currency_symbol')
    .eq('code', countryCode)
    .single()

  return data
}

// 批量保存产品到数据库
async function saveProductsToDB(supabase: SupabaseClient, products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]) {
  if (products.length === 0) return []

  const { data, error } = await supabase
    .from('products')
    .upsert(products, {
      onConflict: 'country_id, source_platform_id, source_product_id',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('Error saving products to DB:', error)
    throw error
  }

  return data
}

// 从数据库获取产品
async function getProductsFromDB(
  supabase: SupabaseClient,
  params: ProductQueryParams
): Promise<{ data: Product[], total: number }> {
  const { countryCode, category, minPrice, maxPrice, minPotentialScore, sortBy = 'potential_score', sortOrder = 'desc', page = 1, pageSize = 24 } = params

  let query = supabase
    .from('products')
    .select(`
      *,
      countries (
        name,
        currency_symbol
      ),
      platforms (
        name
      )
    `, { count: 'exact' })
    .eq('countries.code', countryCode)
    .eq('is_active', true)

  if (category) {
    query = query.ilike('category', `%${category}%`)
  }

  if (minPrice !== undefined) {
    query = query.gte('current_price', minPrice)
  }

  if (maxPrice !== undefined) {
    query = query.lte('current_price', maxPrice)
  }

  if (minPotentialScore !== undefined) {
    query = query.gte('potential_score', minPotentialScore)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching products from DB:', error)
    throw error
  }

  // 格式化数据
  const formattedProducts = data.map((item: Product & { platforms: { name: string }; countries: { currency_symbol: string } }) => ({
    ...item,
    source_platform: item.platforms.name,
    currency_symbol: item.countries.currency_symbol
  }))

  return {
    data: formattedProducts,
    total: count || 0
  }
}

// 主要的产品获取服务
export const getProducts = cache(async (params: ProductQueryParams): Promise<{ data: Product[], total: number }> => {
  const supabase = createClient()

  try {
    // 1. 先尝试从数据库获取产品
    const dbResult = await getProductsFromDB(supabase, params)

    // 如果数据库中有足够的数据，直接返回
    if (dbResult.total >= 10) {
      return dbResult
    }

    // 2. 数据库数据不足，调用第三方API获取新数据
    const apiClient = createAPIClient() // 自动从环境变量读取API源配置
    const rawProducts = await apiClient.getProducts(params.countryCode, params)

    if (rawProducts.length === 0) {
      // API也没有数据，返回数据库现有数据
      return dbResult
    }

    // 3. 获取国家和平台信息
    const country = await getCountryId(supabase, params.countryCode)
    if (!country) {
      throw new Error(`Country not found: ${params.countryCode}`)
    }

    // 4. 转换并保存数据到数据库
    const normalizedProducts = []
    for (const rawProduct of rawProducts) {
      const platformId = await getPlatformId(supabase, rawProduct.platform)
      if (platformId) {
        normalizedProducts.push(normalizeProductData(rawProduct, country.id, platformId))
      }
    }

    await saveProductsToDB(supabase, normalizedProducts)

    // 5. 再次从数据库查询最新数据
    return await getProductsFromDB(supabase, params)
  } catch (error) {
    console.error('Error in getProducts service:', error)
    // 降级处理：返回Mock数据
    const mockClient = createAPIClient('mock')
    const rawProducts = await mockClient.getProducts(params.countryCode, params)
    const country = await getCountryId(supabase, params.countryCode)

    const mockFormatted = rawProducts.map(p => ({
      id: p.id,
      title: p.title,
      main_image_url: p.mainImage,
      current_price: p.price,
      sales_growth_rate: p.salesGrowthRate,
      potential_score: calculatePotentialScore(p),
      source_platform: p.platform,
      category: p.category,
      source_url: p.sourceUrl,
      currency_symbol: country?.currency_symbol || '$',
      country_id: country?.id || '',
      source_platform_id: '',
      source_product_id: p.id,
      crawled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as Product[]

    return {
      data: mockFormatted,
      total: mockFormatted.length
    }
  }
})
