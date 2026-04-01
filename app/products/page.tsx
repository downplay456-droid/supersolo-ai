'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Package, Settings, User, TrendingUp, DollarSign, Star, Heart, Copy } from 'lucide-react'
import CountrySelector from '@/components/CountrySelector'
import { useCountry } from '@/lib/country-context'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { selectedCountry } = useCountry()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null)

  const [products, setProducts] = useState<any[]>([])

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

  // Fetch products when user or selected country changes
  useEffect(() => {
    if (!user || !selectedCountry) return

    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products?country=${selectedCountry.code}`)
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
  }, [user, selectedCountry])

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
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
            {/* 筛选栏 - Strong Bold风格 */}
            <div className="flex flex-wrap gap-4 mb-8 items-center justify-between border-b-2 border-black pb-4">
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-3 bg-red-600 text-white font-bold text-base hover:bg-red-700 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  ALL CATEGORIES
                </button>
                <button className="px-6 py-3 bg-white border-2 border-black text-base font-bold hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                  ELECTRONICS
                </button>
                <button className="px-6 py-3 bg-white border-2 border-black text-base font-bold hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                  HOME
                </button>
                <button className="px-6 py-3 bg-white border-2 border-black text-base font-bold hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                  FASHION
                </button>
                <button className="px-6 py-3 bg-white border-2 border-black text-base font-bold hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                  BEAUTY
                </button>
              </div>
              <div className="text-lg font-mono font-bold text-gray-600">
                SHOWING {products.length} TRENDING PRODUCTS
              </div>
            </div>

            {/* 商品网格 - Strong Bold风格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="border-2 border-black overflow-hidden group hover:border-red-600 hover:shadow-[8px_8px_0px_0px_#ff0000] transition-all bg-white">
                  <div className="relative">
                    <img
                      src={product.main_image_url}
                      alt={product.title}
                      className="w-full aspect-square object-cover bg-white"
                      onError={(e) => {
                        // 图片加载失败时使用与设计风格统一的文字占位符
                        const imgElement = e.target as HTMLImageElement;
                        const parent = imgElement.parentElement;
                        if (parent) {
                          // 创建风格统一的占位符
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-full aspect-square bg-gray-50 flex flex-col items-center justify-center p-4 border-b-2 border-black';
                          placeholder.innerHTML = `
                            <div class="font-display font-heavy text-3xl text-black text-center leading-tight">
                              ${product.title.split(' ').slice(0, 3).join(' ')}
                            </div>
                            <div class="mt-4 px-4 py-2 bg-red-600 text-white font-bold text-sm">
                              PRODUCT IMAGE
                            </div>
                          `;
                          parent.replaceChild(placeholder, imgElement);
                        }
                      }}
                    />
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(product.id) ? 'fill-red-600 text-red-600' : 'text-black'
                        }`}
                      />
                    </button>
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 text-white text-sm font-mono font-bold border-2 border-black">
                      {product.potential_score}% POTENTIAL
                    </div>
                  </div>
                  <div className="p-5 border-t-2 border-black">
                    <h3 className="text-lg font-bold line-clamp-2 mb-4 h-12">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-5 h-5 text-red-600" />
                        <span className="text-2xl font-mono font-heavy">{selectedCountry?.currency_symbol}{product.current_price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-5 h-5 text-green-700" />
                        <span className="text-lg font-mono font-bold text-green-700">+{product.sales_growth_rate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600 font-bold">{product.source_platform}</span>
                      <span className="text-sm px-3 py-1 bg-gray-100 text-black font-bold border border-black">{product.category}</span>
                    </div>
                    <div>
                      <Button
                        onClick={() => generateProductCopy(product)}
                        disabled={generatingProductId === product.id}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold text-base h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        {generatingProductId === product.id ? (
                          <><div className="animate-spin h-4 w-4 border-b-2 border-white mr-2" />GENERATING...</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-2" />GENERATE MARKETING COPY</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
