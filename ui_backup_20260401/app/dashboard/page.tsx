import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Home, Package, Settings, User, Sparkles, CheckCircle2, Clock } from 'lucide-react'
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
    <div className="flex min-h-screen bg-[#0a0a0c]">
      {/* 固定左侧侧边栏 - 硬朗工业风格 */}
      <aside className="w-64 bg-card border-r border-border hidden md:block">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-display font-bold tracking-tighter text-primary">SUPERSOLO</h2>
        </div>

        <nav className="p-0 mt-2">
          <a href="/dashboard" className="flex items-center gap-3 px-6 py-4 bg-secondary text-foreground border-l-4 border-primary font-medium">
            <Home className="h-5 w-5" />
            <span>DASHBOARD</span>
          </a>
          <a href="/products" className="flex items-center gap-3 px-6 py-4 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border-l-4 border-transparent">
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
        {/* 顶部导航栏 */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-display font-bold md:hidden text-primary">SUPERSOLO</h1>
          <div className="hidden md:block">
            <span className="text-sm text-muted-foreground">WELCOME BACK, {user.email?.split('@')[0].toUpperCase()}</span>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 p-6 space-y-8">
          {/* 标题区域 */}
          <div className="border-l-4 border-primary pl-4 py-1">
            <h1 className="text-3xl font-display font-bold tracking-tight">PRODUCT DASHBOARD</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">GENERATE HIGH-CONVERTING PRODUCT COPY FOR CROSS-BORDER STORES</p>
          </div>

          {/* AI产品生成器卡片 */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border bg-secondary/50">
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                AI PRODUCT COPY GENERATOR
              </CardTitle>
              <CardDescription className="text-muted-foreground font-mono text-xs">
                ENTER PRODUCT TITLE TO GENERATE PROFESSIONAL MARKETING COPY IN SECONDS
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ProductForm userId={user.id} />
            </CardContent>
          </Card>

          {/* 产品列表 */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
              <h2 className="text-2xl font-display font-bold">YOUR PRODUCTS</h2>
              <span className="text-sm font-mono text-muted-foreground">{products?.length || 0} ITEMS</span>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <CardTitle className="text-base font-medium">{product.original_title}</CardTitle>
                          <div className="text-primary font-mono font-bold mt-1">${product.price}</div>
                        </div>
                        {/* 状态标签 - 工业风格 */}
                        {product.ai_generated_copy ? (
                          <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 text-xs font-mono border border-green-400/30">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>COMPLETED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 text-xs font-mono border border-yellow-400/30">
                            <Clock className="h-3 w-3 animate-pulse" />
                            <span>PENDING</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="py-4">
                      {product.ai_generated_copy ? (
                        <div className="text-sm text-muted-foreground space-y-2 font-sans">
                          {product.ai_generated_copy.split('\n').map((line: string, idx: number) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic font-mono">GENERATING COPY...</p>
                      )}
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground border-t border-border pt-2 font-mono">
                      ADDED {new Date(product.created_at).toLocaleDateString()}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              // 空状态
              <Card className="bg-card border-border text-center py-12">
                <CardContent>
                  <div className="max-w-md mx-auto border border-dashed border-border p-8">
                    <h3 className="text-lg font-display font-medium mb-2">START BY ADDING YOUR FIRST PRODUCT</h3>
                    <p className="text-muted-foreground font-mono text-sm">
                      ENTER A PRODUCT TITLE ABOVE AND LET AI GENERATE HIGH-CONVERTING MARKETING COPY
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
