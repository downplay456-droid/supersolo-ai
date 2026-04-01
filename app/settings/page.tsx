import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Package, Settings, User } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
          <a href="/settings" className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white font-extrabold text-lg border-l-8 border-black">
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
            <span className="text-lg font-bold text-gray-600">Manage your account and preferences</span>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="border-l-8 border-red-600 pl-6 py-2 mb-8">
              <h1 className="font-display font-heavy text-4xl tracking-tight leading-none">ACCOUNT SETTINGS</h1>
              <p className="text-gray-600 mt-2 font-mono font-bold text-lg">
                管理您的账户信息和系统偏好设置
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 账户信息卡片 */}
              <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white">
                <div className="border-b-2 border-black bg-gray-100 p-4">
                  <h2 className="font-display font-bold text-2xl">ACCOUNT INFORMATION</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-sm font-bold uppercase text-gray-600 mb-1">邮箱地址</p>
                    <p className="text-xl font-bold">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase text-gray-600 mb-1">用户ID</p>
                    <p className="text-gray-800 font-mono font-bold text-sm">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase text-gray-600 mb-1">注册时间</p>
                    <p className="text-gray-800 font-bold">{new Date(user.created_at || '').toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* 偏好设置卡片 */}
              <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white">
                <div className="border-b-2 border-black bg-gray-100 p-4">
                  <h2 className="font-display font-bold text-2xl">PREFERENCES</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 font-medium text-lg">
                    自定义AI生成偏好、语言设置和通知选项即将上线，敬请期待。
                  </p>
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-400 bg-gray-50">
                    <p className="text-center text-gray-500 font-bold">COMING SOON</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
