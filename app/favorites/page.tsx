'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Home, Package, Settings, Heart, Tag, Filter, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CountrySelector from '@/components/CountrySelector'
import ProductCard from '@/components/ProductCard'
import { useCountry } from '@/lib/country-context'
import { Product } from '@/lib/types/product'
import toast from 'react-hot-toast'

interface FavoriteProduct extends Product {
  favorite_id: string
  status: string
  notes?: string
  profit_estimate?: number
  created_at: string
}

export default function FavoritesPage() {
  const supabase = createClient()
  const router = useRouter()
  const { selectedCountry } = useCountry()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
        let query = supabase
          .from('user_product_favorites')
          .select(`
            id,
            status,
            notes,
            profit_estimate,
            created_at,
            product:products(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) throw error

        const formattedFavorites: FavoriteProduct[] = data.map((item: any) => ({
          ...item.product,
          favorite_id: item.id,
          status: item.status,
          notes: item.notes,
          profit_estimate: item.profit_estimate,
          created_at: item.created_at
        }))

        setFavorites(formattedFavorites)
      } catch (error: any) {
        toast.error(`❌ ${error.message}`)
      }
    }

    fetchFavorites()
  }, [user, supabase, statusFilter])

  const toggleFavorite = async (productId: string) => {
    try {
      // 从收藏中删除
      const { error } = await supabase
        .from('user_product_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error

      setFavorites(prev => prev.filter(fav => fav.id !== productId))
      toast.success('✅ Removed from favorites')
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
            <Tag className="w-3 h-3 mr-1" />
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

  // 状态选项
  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending_comparison', label: '待比价' },
    { value: 'pending_copywriting', label: '待生成文案' },
    { value: 'pending_shipping', label: '待发货' },
    { value: 'listed', label: '已上架' }
  ]

  // 状态文本映射
  const statusTextMap: Record<string, string> = {
    'pending_comparison': '待比价',
    'pending_copywriting': '待生成文案',
    'pending_shipping': '待发货',
    'listed': '已上架'
  }

  // 状态颜色映射
  const statusColorMap: Record<string, string> = {
    'pending_comparison': 'bg-yellow-100 text-yellow-800 border-yellow-400',
    'pending_copywriting': 'bg-blue-100 text-blue-800 border-blue-400',
    'pending_shipping': 'bg-purple-100 text-purple-800 border-purple-400',
    'listed': 'bg-green-100 text-green-800 border-green-400'
  }

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
          <a href="/products" className="flex items-center gap-3 px-6 py-4 hover:bg-gray-100 text-black font-bold text-lg transition-colors">
            <Package className="h-6 w-6" />
            <span>PRODUCTS</span>
          </a>
          <a href="/favorites" className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white font-extrabold text-lg border-l-8 border-black">
            <Heart className="h-6 w-6 fill-white" />
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
            <h1 className="text-2xl font-display font-heavy">MY PRODUCT LIBRARY</h1>
            <p className="text-sm text-gray-600 font-bold">MANAGE YOUR FAVORITE PRODUCTS</p>
          </div>
          <div className="border-2 border-black">
            <CountrySelector />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* 筛选栏 */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? 'default' : 'secondary'}
                    onClick={() => setStatusFilter(option.value)}
                    className={`whitespace-nowrap border-2 border-black font-bold ${
                      statusFilter === option.value
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="text-lg font-mono font-bold text-gray-600">
                {favorites.length} PRODUCTS IN LIBRARY
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="border-4 border-dashed border-gray-300 p-12 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-2xl font-bold mb-2">Your library is empty</h3>
                <p className="text-gray-600 mb-6">Start adding products from the Products page to build your library</p>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                  onClick={() => router.push('/products')}
                >
                  BROWSE TRENDING PRODUCTS
                </Button>
              </div>
            ) : (
              /* 商品网格 - 使用ProductCard组件 */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {favorites.map((product) => (
                  <div key={product.favorite_id} className="relative">
                    {/* 状态标签 */}
                    <div className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-bold border ${statusColorMap[product.status]}`}>
                      {statusTextMap[product.status]}
                    </div>

                    <ProductCard
                      product={product}
                      isFavorite={true}
                      isGenerating={generatingProductId === product.id}
                      currencySymbol={selectedCountry?.currency_symbol || '$'}
                      onToggleFavorite={toggleFavorite}
                      onGenerateCopy={generateProductCopy}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
