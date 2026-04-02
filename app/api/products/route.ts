import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/product-service'
import { ProductQueryParams } from '@/lib/types/product'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // 解析查询参数
    const sortBy = searchParams.get('sortBy')
    const validSortBy: Array<'potential_score' | 'sales_growth_rate' | 'current_price' | 'crawled_at'> = ['potential_score', 'sales_growth_rate', 'current_price', 'crawled_at']

    const params: ProductQueryParams = {
      countryCode: searchParams.get('country') || 'US',
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minPotentialScore: searchParams.get('minPotentialScore') ? Number(searchParams.get('minPotentialScore')) : undefined,
      sortBy: sortBy && validSortBy.includes(sortBy as any) ? sortBy as any : 'potential_score',
      sortOrder: searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 24
    }

    // 调用产品服务获取数据
    const result = await getProducts(params)

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
