export interface SupplyPlatform {
  id: string;
  name: '1688' | '阿里国际站' | '拼多多跨境' | '速卖通';
  logo_url?: string;
  base_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface ComparisonResult {
  id: string;
  record_id: string;
  platform_id: string;
  supplier_name: string;
  product_title: string;
  product_url: string;
  product_image?: string;
  min_order_quantity: number;
  unit_price: number;
  currency: string;
  shipping_cost: number;
  total_cost: number;
  delivery_days?: number;
  supplier_rating?: number;
  sales_volume?: number;
  similarity_score: number;
  has_free_shipping: boolean;
  has_warehouse: boolean;
  product_specs?: Record<string, any>;
  platform?: SupplyPlatform;
  created_at: string;
}

export interface PriceComparisonRecord {
  id: string;
  product_id: string;
  user_id: string;
  product_title: string;
  product_image?: string;
  search_keyword?: string;
  status: 'pending' | 'searching' | 'completed' | 'failed';
  error_message?: string;
  results?: ComparisonResult[];
  created_at: string;
  updated_at: string;
}

export interface ComparisonSearchParams {
  product_title: string;
  product_image?: string;
  product_id?: string;
  weight?: number;
  target_country?: string;
  platforms?: string[];
  min_price?: number;
  max_price?: number;
}

export interface ComparisonSearchResponse {
  success: boolean;
  data?: {
    record: PriceComparisonRecord;
    results: ComparisonResult[];
  };
  error?: string;
}
