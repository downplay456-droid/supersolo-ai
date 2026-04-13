export interface LogisticsChannel {
  id: string
  name: string
  type: 'postal' | 'special_line' | 'express' | 'warehouse'
  company_name: string
  logo_url?: string
  is_active: boolean
  sort_order: number
}

export interface LogisticsQuote {
  id: string
  channel_id: string
  country_id: string
  min_weight: number
  max_weight: number
  base_price: number
  price_per_kg: number
  currency: string
  transit_days_min: number
  transit_days_max: number
  loss_rate: number
  has_tracking: boolean
  tracking_type: 'none' | 'partial' | 'full'
  insurance_available: boolean
  insurance_rate: number
  is_recommended: boolean
  notes?: string
  is_active: boolean
  channel?: LogisticsChannel
}

export interface LogisticsQuoteResult {
  quote: LogisticsQuote
  total_price: number
  total_price_cny: number
  transit_days_display: string
  loss_rate_display: string
  tracking_label: string
  insurance_price?: number
}

export interface LogisticsQueryParams {
  countryId: string
  weight: number
  length?: number
  width?: number
  height?: number
  declaredValue?: number
  sortBy?: 'price' | 'speed' | 'recommended'
}
