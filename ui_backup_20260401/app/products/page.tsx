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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0c]">
      {/* 侧边栏 - 工业风格 */}
      <aside className="w-64 bg-card border-r border-border hidden md:block">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-display font-bold tracking-tighter text-primary">SUPERSOLO</h2>
        </div>

        <nav className="p-0 mt-2">
          <a href="/dashboard" className="flex items-center gap-3 px-6 py-4 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border-l-4 border-transparent">
            <Home className="h-5 w-5" />
            <span>DASHBOARD</span>
          </a>
          <a href="/products" className="flex items-center gap-3 px-6 py-4 bg-secondary text-foreground border-l-4 border-primary font-medium">
            <Package className="h-5 w-5" />
            <span>PRODUCTS</span>
          </a>
          <a href="/settings" className="flex items-center gap-3 px-6 py-4 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border-l-4 border-transparent">
            <Settings className="h-5 w-5" />
            <span>SETTINGS</span>
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border">
          <div className="p-4 bg-secondary flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center font-mono font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">ADMIN</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-display font-bold md:hidden text-primary">SUPERSOLO</h1>
          <div className="hidden md:block">
            <h1 className="text-lg font-display font-bold">HOT PRODUCTS FOR {selectedCountry?.name?.toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground font-mono">DISCOVER HIGH-POTENTIAL TRENDING PRODUCTS</p>
          </div>
          <CountrySelector />
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* 筛选栏 - 工业风格 */}
            <div className="flex flex-wrap gap-4 mb-6 items-center justify-between border-b border-border pb-4">
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-display font-medium hover:bg-primary/90 transition-colors border-2 border-primary">
                  ALL CATEGORIES
                </button>
                <button className="px-4 py-2 bg-card border-2 border-border text-sm font-display hover:border-primary/50 hover:bg-secondary transition-colors">
                  ELECTRONICS
                </button>
                <button className="px-4 py-2 bg-card border-2 border-border text-sm font-display hover:border-primary/50 hover:bg-secondary transition-colors">
                  HOME
                </button>
                <button className="px-4 py-2 bg-card border-2 border-border text-sm font-display hover:border-primary/50 hover:bg-secondary transition-colors">
                  FASHION
                </button>
                <button className="px-4 py-2 bg-card border-2 border-border text-sm font-display hover:border-primary/50 hover:bg-secondary transition-colors">
                  BEAUTY
                </button>
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                SHOWING {products.length} TRENDING PRODUCTS
              </div>
            </div>

            {/* 商品网格 - 工业风格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="relative">
                    <img
                      src={product.main_image_url}
                      alt={product.title}
                      className="w-full aspect-square object-cover bg-secondary"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMWExYTFmIi8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2Ni41NjkgMTIwIDE4MCAxMDYuNTY5IDE4MCA5MEMxODAgNzMuNDMxNSAxNjYuNTY5IDYwIDE1MCA2MEMxMzMuNDMxIDYwIDEyMCA3My40MzE1IDEyMCA5MEMxMjAgMTA2LjU2OSAxMzMuNDMxIDEyMCAxNTAgMTIwWiIgZmlsbD0iIzNhM2EzZiIvPgo8cGF0aCBkPSJNMjEwIDE4MEMyMTAgMTYzLjQzMSAxOTYuNTY5IDE1MCAxODAgMTUwSDEyMEMxMDMuNDMxIDE1MCA5MCAxNjMuNDMxIDkwIDE4MFYyMTBIMjEwVjE4MFoiIGZpbGw9IiMzYTNhM2YiLz4KPHRleHQgeD0iMTUwIiB5PSIyNjAiIGZvbnQtZmFtaWx5PSJJbnRlciIgc3R5bGU9ImZvbnQtc2l6ZTogMTRweDsgdGV4dC1hbmNob3I6IG1pZGRsZTsiIGZpbGw9IiM5Y2EzYWIiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K'
                      }}
                    />
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-3 right-3 p-2 bg-card border border-border hover:bg-secondary transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.includes(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                    <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono font-bold">
                      {product.potential_score}% POTENTIAL
                    </div>
                  </div>
                  <CardContent className="p-4 border-t border-border">
                    <h3 className="text-sm font-medium line-clamp-2 mb-3 h-10">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-lg font-mono font-bold">{selectedCountry?.currency_symbol}{product.current_price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-mono font-medium text-green-400">+{product.sales_growth_rate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground font-mono">{product.source_platform}</span>
                      <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground font-mono">{product.category}</span>
                    </div>
                    <div>
                      <Button
                        onClick={() => generateProductCopy(product)}
                        disabled={generatingProductId === product.id}
                        className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs h-8 font-display"
                      >
                        {generatingProductId === product.id ? (
                          <><div className="animate-spin h-3 w-3 border-b-2 border-primary mr-2" />GENERATING...</>
                        ) : (
                          <><Copy className="w-3 h-3 mr-2" />GENERATE MARKETING COPY</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
