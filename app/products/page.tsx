'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Home, Package, Settings, Copy, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CountrySelector from '@/components/CountrySelector'
import ProductCard from '@/components/ProductCard'
import ProductFilters from '@/components/ProductFilters'
import { useCountry } from '@/lib/country-context'
import { Product } from '@/lib/types/product'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { selectedCountry } = useCountry()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    category?: string
    minPrice?: number
    maxPrice?: number
    sortBy: string
    sortOrder: string
  }>({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'potential_score',
    sortOrder: 'desc'
  })

  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  // Fetch user favorites
  useEffect(() => {
    if (!user) return

    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('user_product_favorites')
          .select('product_id')
          .eq('user_id', user.id)

        if (error) throw error

        const favoriteIds = data.map(item => item.product_id)
        setFavorites(favoriteIds)
      } catch (error: any) {
        console.error('Failed to fetch favorites:', error)
      }
    }

    fetchFavorites()
  }, [user, supabase])

  // Fetch products when user, selected country or filters change
  useEffect(() => {
    if (!user || !selectedCountry) return

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams()
        params.append('country', selectedCountry.code)
        if (filters.category) params.append('category', filters.category)
        if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString())
        if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString())
        params.append('sortBy', filters.sortBy)
        params.append('sortOrder', filters.sortOrder)

        const response = await fetch(`/api/products?${params.toString()}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data.data)
      } catch (error: any) {
        toast.error(`❌ ${error.message}`)
      }
    }

    fetchProducts()
  }, [user, selectedCountry, filters])

  const toggleFavorite = async (productId: string) => {
    try {
      // 检查是否是mock数据
      if (productId.startsWith('mock-')) {
        toast(
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>收藏功能在Mock数据模式下不可用，请配置真实数据源后使用</span>
          </div>,
          { duration: 4000, style: { background: '#3b82f6', color: 'white', fontWeight: 'bold' } }
        )
        return
      }

      const isFavorited = favorites.includes(productId)

      if (isFavorited) {
        // 取消收藏
        const { error } = await supabase
          .from('user_product_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)

        if (error) throw error

        setFavorites(prev => prev.filter(id => id !== productId))
        toast.success('✅ Removed from your library')
      } else {
        // 添加收藏
        const { error } = await supabase
          .from('user_product_favorites')
          .insert({
            user_id: user.id,
            product_id: productId,
            status: 'pending_comparison'
          })

        if (error) throw error

        setFavorites(prev => [...prev, productId])
        toast.success('✅ Added to your library')
      }
    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
    }
  }

  const generateProductCopy = async (product: any) => {
    setGeneratingProductId(product.id)
    try {
      // Extract keywords from title and category
      const keywords = [
        product.category,
        ...product.title.split(' ').filter(word => word.length > 3)
      ].slice(0, 5) // Take top 5 relevant keywords

      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productTitle: product.title,
          keywords: keywords
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate marketing copy')
      }

      const data = await response.json()

      // Show success toast with copy option
      toast.success(
        <div className="space-y-2">
          <p className="font-medium">✅ Marketing copy generated!</p>
          <p className="text-xs text-white/70 whitespace-pre-line">{data.generatedCopy}</p>
          <Button
            size="sm"
            className="w-full mt-2 bg-[#c6ff00] text-black hover:bg-[#b3e600]"
            onClick={() => {
              navigator.clipboard.writeText(data.generatedCopy)
              toast.success('Copied to clipboard!', { duration: 2000 })
            }}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy to Clipboard
          </Button>
        </div>,
        { duration: 10000 }
      )
    } catch (error: any) {
      toast.error(`❌ ${error.message}`)
    } finally {
      setGeneratingProductId(null)
    }
  }

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-black font-bold text-2xl">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* 固定左侧侧边栏 - Strong Bold风格 */}
      <aside className="w-64 bg-white border-r-2 border-black hidden md:block relative min-h-screen">
        <div className="p-6 border-b-2 border-black">
          <h2 className="text-3xl font-display font-heavy tracking-tighter">
            <span className="text-black">SUPER</span><span className="text-red-600">SOLO</span>
          </h2>
        </div>

        <nav className="p-0 mt-4 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 px-6 py-4 hover:bg-gray-100 text-black font-bold text-lg transition-colors">
            <Home className="h-6 w-6" />
            <span>DASHBOARD</span>
          </a>
          <a href="/products" className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white font-extrabold text-lg border-l-8 border-black">
            <Package className="h-6 w-6" />
            <span>PRODUCTS</span>
          </a>
          <a href="/favorites" className="flex items-center gap-3 px-6 py-4 hover:bg-gray-100 text-black font-bold text-lg transition-colors">
            <Heart className="h-6 w-6" />
            <span>MY LIBRARY</span>
          </a>
          <a href="/settings" className="flex items-center gap-3 px-6 py-4 hover:bg-gray-100 text-black font-bold text-lg transition-colors">
            <Settings className="h-6 w-6" />
            <span>SETTINGS</span>
          </a>
        </nav>

        <div className="sticky bottom-0 left-0 right-0 border-t-2 border-black bg-white">
          <div className="p-4 bg-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center font-mono font-heavy text-xl">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold truncate">{user.email}</p>
              <p className="text-xs text-gray-600 font-bold uppercase">SELLER ACCOUNT</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white border-b-2 border-black flex items-center justify-between px-6">
          <h1 className="text-2xl font-display font-heavy md:hidden">
            <span className="text-black">SUPER</span><span className="text-red-600">SOLO</span>
          </h1>
          <div className="hidden md:block">
            <h1 className="text-2xl font-display font-heavy">HOT PRODUCTS FOR {selectedCountry?.name?.toUpperCase()}</h1>
            <p className="text-sm text-gray-600 font-bold">DISCOVER HIGH-POTENTIAL TRENDING PRODUCTS</p>
          </div>
          <div className="border-2 border-black">
            <CountrySelector />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* 筛选组件 */}
            <ProductFilters
              onFilterChange={setFilters}
              categories={categories}
            />

            {/* 结果统计 */}
            <div className="text-lg font-mono font-bold text-gray-600 mb-8">
              SHOWING {products.length} TRENDING PRODUCTS
            </div>

            {/* 商品网格 - 使用ProductCard组件 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  isGenerating={generatingProductId === product.id}
                  currencySymbol={selectedCountry?.currency_symbol || '$'}
                  onToggleFavorite={toggleFavorite}
                  onGenerateCopy={generateProductCopy}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
