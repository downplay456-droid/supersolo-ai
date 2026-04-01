import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock product data - this will be replaced with real crawler/third-party API data later
const mockProducts = [
  {
    id: '1',
    title: 'Wireless Earbuds with Noise Cancelling',
    main_image_url: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🎧\nWireless\nEarbuds',
    current_price: 49.99,
    sales_growth_rate: 128.5,
    potential_score: 92,
    source_platform: 'Amazon US',
    category: 'Electronics'
  },
  {
    id: '2',
    title: 'Silicone Food Storage Bags (Set of 8)',
    main_image_url: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🥡\nFood\nStorage+Bags',
    current_price: 24.99,
    sales_growth_rate: 94.2,
    potential_score: 87,
    source_platform: 'TikTok US',
    category: 'Home & Kitchen'
  },
  {
    id: '3',
    title: 'Waterproof Phone Pouch for Swimming',
    main_image_url: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=📱\nWaterproof\nPhone+Pouch',
    current_price: 12.99,
    sales_growth_rate: 215.3,
    potential_score: 95,
    source_platform: 'eBay US',
    category: 'Outdoor'
  },
  {
    id: '4',
    title: 'Portable Blender for Smoothies',
    main_image_url: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🧃\nPortable\nBlender',
    current_price: 34.99,
    sales_growth_rate: 76.8,
    potential_score: 83,
    source_platform: 'Amazon US',
    category: 'Home Appliances'
  },
  {
    id: '5',
    title: 'Yoga Mat with Alignment Lines',
    main_image_url: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=🧘\nYoga\nMat',
    current_price: 29.99,
    sales_growth_rate: 67.4,
    potential_score: 81,
    source_platform: 'Instagram US',
    category: 'Sports & Fitness'
  },
  {
    id: '6',
    title: 'LED Strip Lights for Bedroom',
    main_image_url: 'https://placehold.co/300x300/1a1a1f/c6ff00?text=💡\nLED\nStrip+Lights',
    current_price: 19.99,
    sales_growth_rate: 105.7,
    potential_score: 89,
    source_platform: 'Reddit r/HomeDecor',
    category: 'Home Decor'
  }
]

export async function GET(request: Request) {
  try {
    // In the future:
    // 1. Get country code from query params: const { searchParams } = new URL(request.url)
    // 2. const countryCode = searchParams.get('country')
    // 3. Fetch real product data from crawler API or third-party service based on country
    // 4. Process and normalize the data

    // For now return mock data
    return NextResponse.json({
      success: true,
      data: mockProducts,
      total: mockProducts.length
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
