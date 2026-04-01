import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Package, Settings, User } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#0a0a0c]">
      {/* 侧边栏 */}
      <aside className="w-64 bg-[#121214] border-r border-white/5 hidden md:block">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">SuperSolo AI</h2>
        </div>

        <nav className="p-4 space-y-1 mt-2">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </a>
          <a href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
            <Package className="h-5 w-5" />
            <span>Products</span>
          </a>
          <a href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 text-white">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </a>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-[#121214]/80 border-b border-white/5 flex items-center justify-between px-6">
          <h1 className="text-xl font-bold md:hidden text-white">SuperSolo AI</h1>
          <div className="hidden md:block">
            <span className="text-sm text-white/70">Manage your account and preferences</span>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#121214] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Email</p>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">User ID</p>
                    <p className="text-white/80 font-mono text-xs">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">Created At</p>
                    <p className="text-white/80">{new Date(user.created_at || '').toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#121214] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60">
                    Custom AI generation preferences, language settings, and notification options are coming soon.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
