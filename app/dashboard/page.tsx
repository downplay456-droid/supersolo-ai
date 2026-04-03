import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Home, Package, Settings, User, Sparkles, CheckCircle2, Clock, Heart } from 'lucide-react'
import ProductForm from './product-form'

// 稳定的服务端组件，无额外依赖
export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 获取当前用户的产品数据，和trending_products表结构完全对齐
  const { data: products } = await supabase
    .from('trending_products')
    .select('id, original_title, price, ai_generated_copy, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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
          <a href="/dashboard" className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white font-extrabold text-lg border-l-8 border-black">
            <Home className="h-6 w-6" />
            <span>DASHBOARD</span>
          </a>
          <a href="/products" className="flex items-center gap-3 px-6 py-4 hover:bg-gray-100 text-black font-bold text-lg transition-colors">
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
            <span className="text-lg font-extrabold text-gray-600">WELCOME BACK, <span className="text-red-600">{user.email?.split('@')[0].toUpperCase()}</span></span>
          </div>
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 border-2 border-black">
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 p-6 space-y-8">
          {/* 标题区域 */}
          <div className="border-l-8 border-red-600 pl-6 py-2">
            <h1 className="font-display font-heavy text-5xl tracking-tight leading-none">PRODUCT DASHBOARD</h1>
            <p className="text-gray-600 mt-2 font-mono font-bold text-lg">
              全链路跨境选品自动化工具 · 一键挖掘全球爆款
            </p>
          </div>

          {/* 关键数据指标卡 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] bg-white">
              <div className="text-sm font-bold uppercase text-gray-600">总选品数</div>
              <div className="font-display font-heavy text-4xl text-black mt-1">{products?.length || 0}</div>
            </div>
            <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] bg-white">
              <div className="text-sm font-bold uppercase text-gray-600">平均利润率</div>
              <div className="font-display font-heavy text-4xl text-red-600 mt-1">42%</div>
            </div>
            <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] bg-white">
              <div className="text-sm font-bold uppercase text-gray-600">爆款命中率</div>
              <div className="font-display font-heavy text-4xl text-black mt-1">98%</div>
            </div>
            <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] bg-white">
              <div className="text-sm font-bold uppercase text-gray-600">今日新增</div>
              <div className="font-display font-heavy text-4xl text-red-600 mt-1">12</div>
            </div>
          </div>

          {/* AI产品生成器卡片 */}
          <div className="border-2 border-black shadow-[8px_8px_0px_0px_#000] bg-white">
            <div className="border-b-2 border-black bg-gray-100 p-4">
              <h2 className="flex items-center gap-2 font-display font-bold text-2xl">
                <Sparkles className="h-6 w-6 text-red-600" />
                AI PRODUCT COPY GENERATOR
              </h2>
              <p className="text-gray-600 font-mono font-bold text-sm mt-1">
                输入产品标题，一键生成高转化率跨境营销文案
              </p>
            </div>
            <div className="p-6">
              <ProductForm userId={user.id} />
            </div>
          </div>

          {/* 产品列表 */}
          <div>
            <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-3">
              <h2 className="font-display font-heavy text-3xl">YOUR PRODUCTS</h2>
              <span className="text-lg font-mono font-bold text-gray-600">{products?.length || 0} ITEMS</span>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="border-2 border-black hover:border-red-600 hover:shadow-[8px_8px_0px_0px_#ff0000] transition-all bg-white">
                    <div className="p-4 border-b-2 border-black">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          <h3 className="text-lg font-bold">{product.original_title}</h3>
                          <div className="text-red-600 font-mono font-heavy text-2xl mt-1">${product.price}</div>
                        </div>
                        {/* 状态标签 */}
                        {product.ai_generated_copy ? (
                          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 text-xs font-bold border-2 border-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>COMPLETED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-bold border-2 border-yellow-600">
                            <Clock className="h-3 w-3 animate-pulse" />
                            <span>PENDING</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {product.ai_generated_copy ? (
                        <div className="text-sm text-gray-700 space-y-2 font-medium">
                          {product.ai_generated_copy.split('\n').map((line: string, idx: number) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic font-mono font-bold">GENERATING COPY...</p>
                      )}
                    </div>
                    <div className="p-3 text-xs text-gray-600 border-t-2 border-black font-mono font-bold">
                      ADDED {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 空状态
              <div className="border-2 border-black text-center py-16 bg-white">
                <div className="max-w-md mx-auto border-2 border-dashed border-gray-400 p-8">
                  <h3 className="text-2xl font-display font-bold mb-3">START BY ADDING YOUR FIRST PRODUCT</h3>
                  <p className="text-gray-600 font-mono font-bold text-base">
                    输入产品标题，让AI为您生成高转化率营销文案
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
