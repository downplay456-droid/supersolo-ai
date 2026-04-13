import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { LogisticsChannel, LogisticsQuote, LogisticsQuoteResult, LogisticsQueryParams } from '@/lib/types/logistics'

export const dynamic = 'force-dynamic'

// 计算物流费用
function calculateLogisticsPrice(
  quote: LogisticsQuote,
  weight: number,
  declaredValue?: number
): LogisticsQuoteResult {
  const totalPrice = quote.base_price + (weight - quote.min_weight) * quote.price_per_kg

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

// 获取物流渠道类型标签
function getChannelTypeLabel(type: string): string {
  switch (type) {
    case 'postal': return '邮政小包'
    case 'special_line': return '专线物流'
    case 'express': return '商业快递'
    case 'warehouse': return '海外仓'
    default: return type
  }
}

// 获取物流报价数据
async function getLogisticsQuotes(params: LogisticsQueryParams): Promise<{ data: LogisticsQuoteResult[], error?: string }> {
  const supabase = createClient()

  try {
    const { countryId, weight, declaredValue } = params

    if (!countryId) {
      return { data: [], error: 'Missing country ID' }
    }

    if (!weight || weight <= 0) {
      return { data: [], error: 'Invalid weight' }
    }

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

    const sortBy = params.sortBy || 'recommended'
    const sortedResults = results.sort((a, b) => {
      if (sortBy === 'price') {
        return a.total_price - b.total_price
      } else if (sortBy === 'speed') {
        return a.quote.transit_days_min - b.quote.transit_days_min
      } else {
        if (a.quote.is_recommended && !b.quote.is_recommended) return -1
        if (!a.quote.is_recommended && b.quote.is_recommended) return 1
        return a.total_price - b.total_price
      }
    })

    return { data: sortedResults }
  } catch (error) {
    console.error('Error in getLogisticsQuotes:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const params: LogisticsQueryParams = {
      countryId: searchParams.get('countryId') || '',
      weight: searchParams.get('weight') ? Number(searchParams.get('weight')) : 0,
      length: searchParams.get('length') ? Number(searchParams.get('length')) : undefined,
      width: searchParams.get('width') ? Number(searchParams.get('width')) : undefined,
      height: searchParams.get('height') ? Number(searchParams.get('height')) : undefined,
      declaredValue: searchParams.get('declaredValue') ? Number(searchParams.get('declaredValue')) : undefined,
      sortBy: (searchParams.get('sortBy') as 'price' | 'speed' | 'recommended') || 'recommended'
    }

    if (!params.countryId) {
      return NextResponse.json(
        { success: false, error: 'Missing countryId parameter' },
        { status: 400 }
      )
    }

    if (!params.weight || params.weight <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid weight parameter' },
        { status: 400 }
      )
    }

    const result = await getLogisticsQuotes(params)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, data: [] },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error: any) {
    console.error('Error fetching logistics quotes:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch logistics quotes' },
      { status: 500 }
    )
  }
}
