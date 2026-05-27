import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/product-service'
import { ProductQueryParams } from '@/lib/types/product'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // 解析查询参数
    const rawSortBy = searchParams.get('sortBy')
    const validSortBy: NonNullable<ProductQueryParams['sortBy']>[] = ['potential_score', 'sales_growth_rate', 'current_price', 'crawled_at']
    const sortBy: NonNullable<ProductQueryParams['sortBy']> = rawSortBy && validSortBy.includes(rawSortBy as NonNullable<ProductQueryParams['sortBy']>) ? rawSortBy as NonNullable<ProductQueryParams['sortBy']> : 'potential_score'

    const params: ProductQueryParams = {
      countryCode: searchParams.get('country') || 'US',
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minPotentialScore: searchParams.get('minPotentialScore') ? Number(searchParams.get('minPotentialScore')) : undefined,
      sortBy,
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
  } catch (error: unknown) {
    console.error('Error fetching products:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch products'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
