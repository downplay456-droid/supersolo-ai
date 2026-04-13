import { createClient } from '@/utils/supabase/server';
import { ComparisonSearchParams, PriceComparisonRecord, ComparisonResult } from './types/price-comparison';

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
    supplier_rating: (Math.random() * 2 + 3).toFixed(2) as any,
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
  const supabase = createClient();

  try {
    // 创建比价记录
    const { data: record, error } = await supabase
      .from('price_comparison_records')
      .insert({
        user_id: userId,
        product_id: params.product_id,
        product_title: params.product_title,
        product_image: params.product_image,
        search_keyword: params.product_title,
        status: 'searching'
      })
      .select()
      .single();

    if (error) throw error;

    // 异步执行比价搜索（实际生产中可以用edge function处理）
    setTimeout(async () => {
      await runComparisonSearch(record.id, params);
    }, 3000);

    return { record };
  } catch (error) {
    console.error('创建比价任务失败:', error);
    return {
      record: {} as PriceComparisonRecord,
      error: error instanceof Error ? error.message : '创建比价任务失败'
    };
  }
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
