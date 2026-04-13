import { createClient } from '@/utils/supabase/server'
import { LogisticsChannel, LogisticsQuote, LogisticsQuoteResult, LogisticsQueryParams } from '@/lib/types/logistics'
import { cache } from 'react'

// 计算物流费用
function calculateLogisticsPrice(
  quote: LogisticsQuote,
  weight: number,
  declaredValue?: number
): LogisticsQuoteResult {
  // 基础价格 + 续重费用
  const totalPrice = quote.base_price + (weight - quote.min_weight) * quote.price_per_kg

  // 保险费用（如果支持保险且声明了价值）
  let insurancePrice: number | undefined
  if (quote.insurance_available && declaredValue && declaredValue > 0) {
    insurancePrice = declaredValue * quote.insurance_rate
  }

  const totalWithInsurance = totalPrice + (insurancePrice || 0)

  return {
    quote,
    total_price: Math.round(totalWithInsurance * 100) / 100,
    total_price_cny: Math.round(totalPrice * 100) / 100,
    transit_days_display: `${quote.transit_days_min}-${quote.transit_days_max}天`,
    loss_rate_display: `${(quote.loss_rate * 100).toFixed(2)}%`,
    tracking_label:
      quote.tracking_type === 'full'
        ? '全程追踪'
        : quote.tracking_type === 'partial'
        ? '部分追踪'
        : '无追踪',
    insurance_price: insurancePrice ? Math.round(insurancePrice * 100) / 100 : undefined
  }
}

// 获取物流报价数据
const getLogisticsQuotes = cache(async (params: LogisticsQueryParams): Promise<{ data: LogisticsQuoteResult[], error?: string }> => {
  const supabase = createClient()

  try {
    const { countryId, weight, declaredValue } = params

    if (!countryId) {
      return { data: [], error: 'Missing country ID' }
    }

    if (!weight || weight <= 0) {
      return { data: [], error: 'Invalid weight' }
    }

    // 查询符合条件的物流报价
    let query = supabase
      .from('logistics_quotes')
      .select(`
        *,
        logistics_channels (
          id,
          name,
          type,
          company_name,
          logo_url,
          sort_order
        )
      `)
      .eq('country_id', countryId)
      .eq('is_active', true)
      .lte('min_weight', weight)
      .gte('max_weight', weight)
      .order('is_recommended', { ascending: false })
      .order('base_price', { ascending: true })

    const { data: quotes, error } = await query

    if (error) {
      console.error('Error fetching logistics quotes:', error)
      return { data: [], error: error.message }
    }

    if (!quotes || quotes.length === 0) {
      return { data: [], error: 'No logistics quotes found for this weight range' }
    }

    // 格式化数据并计算价格
    const results = quotes.map((quote) => {
      const typedQuote: LogisticsQuote = {
        id: quote.id,
        channel_id: quote.channel_id,
        country_id: quote.country_id,
        min_weight: quote.min_weight,
        max_weight: quote.max_weight,
        base_price: quote.base_price,
        price_per_kg: quote.price_per_kg,
        currency: quote.currency,
        transit_days_min: quote.transit_days_min,
        transit_days_max: quote.transit_days_max,
        loss_rate: quote.loss_rate,
        has_tracking: quote.has_tracking,
        tracking_type: quote.tracking_type,
        insurance_available: quote.insurance_available,
        insurance_rate: quote.insurance_rate,
        is_recommended: quote.is_recommended,
        notes: quote.notes,
        is_active: quote.is_active,
        channel: quote.logistics_channels
      }

      return calculateLogisticsPrice(typedQuote, weight, declaredValue)
    })

    // 根据排序方式排序
    const sortBy = params.sortBy || 'recommended'
    const sortedResults = results.sort((a, b) => {
      if (sortBy === 'price') {
        return a.total_price - b.total_price
      } else if (sortBy === 'speed') {
        return a.quote.transit_days_min - b.quote.transit_days_min
      } else {
        // recommended 排序
        if (a.quote.is_recommended && !b.quote.is_recommended) return -1
        if (!a.quote.is_recommended && b.quote.is_recommended) return 1
        return a.total_price - b.total_price
      }
    })

    return { data: sortedResults }
  } catch (error) {
    console.error('Error in getLogisticsQuotes service:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 获取物流渠道类型标签
export function getChannelTypeLabel(type: string): string {
  switch (type) {
    case 'postal':
      return '邮政小包'
    case 'special_line':
      return '专线物流'
    case 'express':
      return '商业快递'
    case 'warehouse':
      return '海外仓'
    default:
      return type
  }
}

// 获取渠道类型颜色
export function getChannelTypeColor(type: string): string {
  switch (type) {
    case 'postal':
      return 'bg-blue-100 text-blue-800'
    case 'special_line':
      return 'bg-green-100 text-green-800'
    case 'express':
      return 'bg-red-100 text-red-800'
    case 'warehouse':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export { getLogisticsQuotes }
