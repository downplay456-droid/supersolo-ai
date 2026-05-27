'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Command } from 'cmdk'
import { Search, Sparkles, Globe, Package, Settings, User, ChevronRight, Moon, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface TrendingProduct {
  id: string
  original_title: string
  price: number
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<TrendingProduct[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // 全局快捷键监听
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open])

  // 加载产品数据用于搜索
  useEffect(() => {
    if (open) {
      const fetchProducts = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('trending_products')
          .select('id, original_title, price')
          .eq('user_id', user.id)
          .limit(20)

        setProducts(data as TrendingProduct[] || [])
      }
      fetchProducts()
    }
  }, [open, supabase])

  // 执行命令后关闭面板
  const runCommand = useCallback((callback: () => void) => {
    return () => {
      setOpen(false)
      callback()
    }
  }, [])

  // 过滤产品搜索结果
  const filteredProducts = products.filter(product => 
    product.original_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />
          
          {/* 命令面板 */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              className="w-full max-w-xl"
            >
              <Command.Dialog
                open={open}
                onOpenChange={setOpen}
                className="bg-[#121214] border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.1)] overflow-hidden"
              >
                {/* 搜索输入框 */}
                <div className="flex items-center gap-3 px-4 border-b border-white/10">
                  <Search className="w-5 h-5 text-white/40 stroke-[1.5px]" />
                  <Command.Input
                    placeholder="Search commands, products, settings..."
                    className="w-full h-14 bg-transparent outline-none text-lg text-white placeholder:text-white/40 font-sans"
                    onValueChange={setSearchQuery}
                  />
                  <kbd className="px-2 py-1 rounded bg-white/5 text-xs text-white/50 font-mono">
                    Esc
                  </kbd>
                </div>

                <Command.List className="p-2 max-h-[60vh] overflow-y-auto">
                  <Command.Empty className="py-6 text-center text-sm text-white/50">
                    No results found.
                  </Command.Empty>

                  {/* Quick Actions 分组 */}
                  <Command.Group heading="Quick Actions" className="px-2 py-1">
                    <div className="text-xs font-mono text-white/50 uppercase tracking-wider px-2 py-2">
                      ⚡️ Quick Actions
                    </div>
                    <Command.Item
                      onSelect={runCommand(() => router.push('/scrape'))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                    >
                      <Globe className="w-4.5 h-4.5 text-[#8b5cf6] stroke-[1.5px]" />
                      <div className="flex-1">
                        <p className="text-sm">Scrape New URL</p>
                        <p className="text-xs text-white/50">Crawl product data from e-commerce platforms</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Command.Item>

                    <Command.Item
                      onSelect={runCommand(() => router.push('/generator'))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-[#c6ff00] stroke-[1.5px]" />
                      <div className="flex-1">
                        <p className="text-sm">Generate Market Copy</p>
                        <p className="text-xs text-white/50">AI powered localized marketing copy generation</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Command.Item>

                    <Command.Item
                      onSelect={runCommand(() => {
                        // 打开产品生成模态框或跳转
                        const event = new CustomEvent('open-generator')
                        window.dispatchEvent(event)
                      })}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                    >
                      <Plus className="w-4.5 h-4.5 text-[#c6ff00] stroke-[1.5px]" />
                      <div className="flex-1">
                        <p className="text-sm">Add New Product</p>
                        <p className="text-xs text-white/50">Manually create a new product entry</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Command.Item>
                  </Command.Group>

                  {/* Products 分组 */}
                  {filteredProducts.length > 0 && (
                    <Command.Group heading="Products" className="px-2 py-1">
                      <div className="text-xs font-mono text-white/50 uppercase tracking-wider px-2 py-2">
                        📦 Products
                      </div>
                      {filteredProducts.map((product) => (
                        <Command.Item
                          key={product.id}
                          onSelect={runCommand(() => router.push(`/products/${product.id}`))}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                        >
                          <Package className="w-4.5 h-4.5 text-[#8b5cf6] stroke-[1.5px]" />
                          <div className="flex-1">
                            <p className="text-sm line-clamp-1">{product.original_title}</p>
                            <p className="text-xs text-white/50 font-mono">${product.price}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* System 分组 */}
                  <Command.Group heading="System" className="px-2 py-1">
                    <div className="text-xs font-mono text-white/50 uppercase tracking-wider px-2 py-2">
                      ⚙️ System
                    </div>
                    <Command.Item
                      onSelect={runCommand(() => {
                        // 主题切换预留接口
                        document.documentElement.classList.toggle('dark')
                      })}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                    >
                      <Moon className="w-4.5 h-4.5 text-[#8b5cf6] stroke-[1.5px]" />
                      <div className="flex-1">
                        <p className="text-sm">Toggle Dark/Light Mode</p>
                        <p className="text-xs text-white/50">Switch between theme presets</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Command.Item>

                    <Command.Item
                      onSelect={runCommand(() => router.push('/settings'))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                    >
                      <Settings className="w-4.5 h-4.5 text-white/70 stroke-[1.5px]" />
                      <div className="flex-1">
                        <p className="text-sm">Account Settings</p>
                        <p className="text-xs text-white/50">Manage your profile and preferences</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Command.Item>

                    <Command.Item
                      onSelect={runCommand(async () => {
                        await supabase.auth.signOut()
                        router.push('/login')
                      })}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-white/5 aria-selected:border-l-2 aria-selected:border-[#c6ff00] transition-all"
                    >
                      <User className="w-4.5 h-4.5 text-white/70 stroke-[1.5px]" />
                      <div className="flex-1">
                        <p className="text-sm">Sign Out</p>
                        <p className="text-xs text-white/50">Log out of your account</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command.Dialog>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
