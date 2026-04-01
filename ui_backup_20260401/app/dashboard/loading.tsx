import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Home, Package, Settings, User, Sparkles } from 'lucide-react'

export default function DashboardLoading() {
  // 骨架屏占位卡片
  const SkeletonCard = () => (
    <Card className="bg-[#121214] border-white/5 animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-3/4">
            <div className="h-5 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-1/3" />
          </div>
          <div className="h-6 bg-white/10 rounded-full w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-11/12" />
        <div className="h-4 bg-white/10 rounded w-4/5" />
      </CardContent>
      <div className="p-6 pt-0">
        <div className="h-3 bg-white/10 rounded w-1/4" />
      </div>
    </Card>
  )

  return (
    <div className="flex min-h-screen bg-[#0a0a0c]">
      {/* 侧边栏骨架 */}
      <aside className="w-64 bg-[#121214] border-r border-white/5 hidden md:block">
        <div className="p-6 border-b border-white/5">
          <div className="h-7 bg-white/10 rounded w-3/4 animate-pulse" />
        </div>

        <nav className="p-4 space-y-3 mt-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="flex-1 h-4 bg-white/10 rounded" />
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏骨架 */}
        <header className="h-16 bg-[#121214]/80 border-b border-white/5 flex items-center justify-between px-6">
          <div className="h-7 bg-white/10 rounded w-32 animate-pulse md:hidden" />
          <div className="h-4 bg-white/10 rounded w-48 animate-pulse hidden md:block" />
        </header>

        {/* 内容区域骨架 */}
        <main className="flex-1 p-6 space-y-8">
          {/* 标题区域骨架 */}
          <div className="space-y-2">
            <div className="h-8 bg-white/10 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse" />
          </div>

          {/* 生成器卡片骨架 */}
          <Card className="bg-[#121214] border-white/5 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-10 bg-white/10 rounded w-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-10 bg-white/10 rounded w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-10 bg-white/10 rounded w-full" />
              </div>
              <div className="h-10 bg-white/10 rounded w-40" />
            </CardContent>
          </Card>

          {/* 产品列表骨架 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 bg-white/10 rounded w-32 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
