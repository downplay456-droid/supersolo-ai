import { createClient } from '@/utils/supabase/server';
import { ComparisonSearchParams, PriceComparisonRecord, ComparisonResult } from './types/price-comparison';

// 模块级缓存
const mockComparisonResults = new Map<string, { record: PriceComparisonRecord; results: ComparisonResult[] }>();
const userComparisonHistory = new Map<string, PriceComparisonRecord[]>();

// 模拟第三方供货平台API查询（实际对接时替换成真实API）
async function mockPlatformSearch(
  platform: string,
  keyword: string,
  weight?: number
): Promise<Partial<ComparisonResult>[]> {
  // 模拟返回3-5个匹配结果
  const mockPrices = [
    Math.floor(Math.random() * 50) + 10,
    Math.floor(Math.random() * 50) + 10,
    Math.floor(Math.random() * 50) + 10,
    Math.floor(Math.random() * 50) + 10
  ];

  return mockPrices.map((price, index) => ({
    supplier_name: `${platform}供应商${index + 1}`,
    product_title: `${keyword} - ${platform}货源${index + 1}`,
    product_url: `https://example.com/product/${Math.random().toString(36).substring(2, 10)}`,
    product_image: `https://picsum.photos/200/200?random=${Math.random()}`,
    min_order_quantity: Math.floor(Math.random() * 10) + 1,
    unit_price: price,
    shipping_cost: Math.floor(Math.random() * 20) + 5,
    total_cost: price + (Math.floor(Math.random() * 20) + 5),
    delivery_days: Math.floor(Math.random() * 15) + 3,
    supplier_rating: Number((Math.random() * 2 + 3).toFixed(2)),
    sales_volume: Math.floor(Math.random() * 10000) + 100,
    similarity_score: Math.random() * 0.4 + 0.6, // 0.6-1.0的相似度
    has_free_shipping: Math.random() > 0.7,
    has_warehouse: Math.random() > 0.8
  }));
}

// 启动比价任务
export async function createComparisonTask(
  userId: string,
  params: ComparisonSearchParams
): Promise<{ record: PriceComparisonRecord; error?: string }> {
  // 临时演示版本：同步返回mock结果，确保100%成功
  const mockRecord: PriceComparisonRecord = {
    id: Math.random().toString(36).substring(2, 10),
    user_id: userId,
    product_id: params.product_id || params.product_title,
    product_title: params.product_title,
    product_image: params.product_image,
    search_keyword: params.product_title,
    status: 'completed', // 直接标记为完成
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 预生成mock比价结果，包含价格异常数据用于演示
  const basePrice = 29.99; // 默认基准价，或者可以从产品标题中提取价格信息
  const mockResults: ComparisonResult[] = [
    // 正常价格
    {
      id: '1',
      record_id: mockRecord.id,
      platform_id: '1',
      supplier_name: '1688诚信供应商A',
      product_title: `${params.product_title} - 原厂正品`,
      product_url: 'https://1688.com/example1',
      product_image: params.product_image || `https://picsum.photos/seed/${params.product_id}/200/200`,
      min_order_quantity: 10,
      unit_price: basePrice * 0.3, // 合理的采购价
      currency: 'CNY',
      shipping_cost: basePrice * 0.1,
      total_cost: basePrice * 0.4,
      delivery_days: 7,
      supplier_rating: 4.8,
      sales_volume: 5000,
      similarity_score: 0.95,
      has_free_shipping: true,
      has_warehouse: true,
      platform: { id: '1', name: '1688', logo_url: '', base_url: 'https://www.1688.com', is_active: true, sort_order: 1 },
      created_at: new Date().toISOString()
    },
    // 价格异常低（用于演示价格异常提醒）
    {
      id: '2',
      record_id: mockRecord.id,
      platform_id: '2',
      supplier_name: '阿里国际站供应商B',
      product_title: `${params.product_title} - 促销清仓款`,
      product_url: 'https://alibaba.com/example2',
      product_image: `https://picsum.photos/seed/${params.product_id}2/200/200`,
      min_order_quantity: 100,
      unit_price: basePrice * 0.1, // 明显低于市场价，异常低价
      currency: 'CNY',
      shipping_cost: basePrice * 0.2,
      total_cost: basePrice * 0.3,
      delivery_days: 20,
      supplier_rating: 3.2,
      sales_volume: 500,
      similarity_score: 0.65,
      has_free_shipping: false,
      has_warehouse: false,
      platform: { id: '2', name: '阿里国际站', logo_url: '', base_url: 'https://www.alibaba.com', is_active: true, sort_order: 2 },
      created_at: new Date().toISOString()
    },
    // 正常价格
    {
      id: '3',
      record_id: mockRecord.id,
      platform_id: '3',
      supplier_name: '拼多多跨境供应商C',
      product_title: `${params.product_title} - 跨境专供版`,
      product_url: 'https://kuajing.pinduoduo.com/example3',
      product_image: `https://picsum.photos/seed/${params.product_id}3/200/200`,
      min_order_quantity: 5,
      unit_price: basePrice * 0.32,
      currency: 'CNY',
      shipping_cost: basePrice * 0.08,
      total_cost: basePrice * 0.4,
      delivery_days: 5,
      supplier_rating: 4.9,
      sales_volume: 8000,
      similarity_score: 0.92,
      has_free_shipping: true,
      has_warehouse: true,
      platform: { id: '3', name: '拼多多跨境', logo_url: '', base_url: 'https://www.pddglobal.com', is_active: true, sort_order: 3 },
      created_at: new Date().toISOString()
    },
    // 价格异常高（用于演示价格异常提醒）
    {
      id: '4',
      record_id: mockRecord.id,
      platform_id: '4',
      supplier_name: '速卖通供应商D',
      product_title: `${params.product_title} - 高端定制版`,
      product_url: 'https://aliexpress.com/example4',
      product_image: `https://picsum.photos/seed/${params.product_id}4/200/200`,
      min_order_quantity: 2,
      unit_price: basePrice * 0.8, // 明显高于市场价，异常高价
      currency: 'CNY',
      shipping_cost: basePrice * 0.05,
      total_cost: basePrice * 0.85,
      delivery_days: 3,
      supplier_rating: 4.7,
      sales_volume: 2000,
      similarity_score: 0.88,
      has_free_shipping: true,
      has_warehouse: true,
      platform: { id: '4', name: '速卖通', logo_url: '', base_url: 'https://www.aliexpress.com', is_active: true, sort_order: 4 },
      created_at: new Date().toISOString()
    }
  ];

  // 存储到模块级缓存
  mockComparisonResults.set(mockRecord.id, {
    record: mockRecord,
    results: mockResults
  });

  // 同时保存到用户比价历史
  if (!userComparisonHistory.has(userId)) {
    userComparisonHistory.set(userId, []);
  }
  const userHistory = userComparisonHistory.get(userId)!;
  userHistory.unshift(mockRecord);
  // 最多保留20条历史
  if (userHistory.length > 20) {
    userComparisonHistory.set(userId, userHistory.slice(0, 20));
  }

  return { record: mockRecord };
}

// 执行比价搜索
async function runComparisonSearch(
  recordId: string,
  params: ComparisonSearchParams
): Promise<void> {
  const supabase = createClient();

  try {
    // 获取启用的供货平台
    const { data: platforms } = await supabase
      .from('supply_platforms')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!platforms || platforms.length === 0) {
      throw new Error('没有可用的供货平台');
    }

    const allResults: Partial<ComparisonResult>[] = [];

    // 并行查询所有平台
    const searchPromises = platforms.map(async (platform) => {
      try {
        const results = await mockPlatformSearch(
          platform.name,
          params.product_title,
          params.weight
        );

        results.forEach(result => {
          allResults.push({
            ...result,
            platform_id: platform.id,
            record_id: recordId
          });
        });
      } catch (error) {
        console.error(`查询${platform.name}失败:`, error);
      }
    });

    await Promise.all(searchPromises);

    // 按总成本排序
    allResults.sort((a, b) => (a.total_cost || 0) - (b.total_cost || 0));

    // 保存结果到数据库
    if (allResults.length > 0) {
      await supabase
        .from('comparison_results')
        .insert(allResults);

      // 更新记录状态为完成
      await supabase
        .from('price_comparison_records')
        .update({ status: 'completed' })
        .eq('id', recordId);
    } else {
      throw new Error('没有找到匹配的货源');
    }

  } catch (error) {
    console.error('比价搜索失败:', error);
    // 更新记录状态为失败
    await supabase
      .from('price_comparison_records')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '比价搜索失败'
      })
      .eq('id', recordId);
  }
}

// 查询比价结果
export async function getComparisonResults(
  recordId: string
): Promise<{ record?: PriceComparisonRecord; results?: ComparisonResult[]; error?: string }> {
  // 优先从mock数据中读取
  const cached = mockComparisonResults.get(recordId);
  if (cached) {
    return cached;
  }

  const supabase = createClient();

  try {
    // 查询记录状态
    const { data: record, error: recordError } = await supabase
      .from('price_comparison_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (recordError) throw recordError;

    if (record.status === 'completed') {
      // 查询结果
      const { data: results, error: resultsError } = await supabase
        .from('comparison_results')
        .select('*, platform:supply_platforms(*)')
        .eq('record_id', recordId)
        .order('total_cost', { ascending: true })
        .order('similarity_score', { ascending: false });

      if (resultsError) throw resultsError;

      return { record, results };
    }

    return { record };
  } catch (error) {
    console.error('查询比价结果失败:', error);
    return { error: error instanceof Error ? error.message : '查询比价结果失败' };
  }
}

// 获取用户比价历史
export async function getUserComparisonHistory(
  userId: string,
  limit: number = 20
): Promise<{ records: PriceComparisonRecord[]; error?: string }> {
  // 优先从mock数据中读取
  const userHistory = userComparisonHistory.get(userId);
  if (userHistory) {
    const records = userHistory.slice(0, limit);
    return { records };
  }

  const supabase = createClient();

  try {
    const { data: records, error } = await supabase
      .from('price_comparison_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { records: records || [] };
  } catch (error) {
    console.error('获取比价历史失败:', error);
    return { records: [], error: error instanceof Error ? error.message : '获取比价历史失败' };
  }
}
