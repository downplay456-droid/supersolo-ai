'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Globe, MapPin, Percent, Save } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

interface Country {
  id: string
  code: string
  name: string
  currency: string
  currency_symbol: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])

  // 用户设置
  const [settings, setSettings] = useState({
    default_country_id: '',
    shipping_address: '',
    shipping_postal_code: '',
    shipping_city: '',
    shipping_country: '',
    platform_fee_rate: '15',
    default_profit_margin: '30'
  })

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

  // 加载国家列表和用户设置
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        // 加载国家列表
        const { data: countriesData } = await supabase
          .from('countries')
          .select('id, code, name, currency, currency_symbol')
          .eq('is_active', true)
          .order('sort_order')

        if (countriesData) {
          setCountries(countriesData)
        }

        // 加载用户设置（这里可以后续扩展user_settings表，现在先使用默认值）
        // 后续可以添加user_settings表存储用户个性化配置
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An error occurred'
        toast.error(`❌ ${message}`)
      }
    }

    loadData()
  }, [user, supabase])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // 这里可以保存到user_settings表，目前先模拟保存
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 保存到localStorage临时存储
      localStorage.setItem('user_settings', JSON.stringify(settings))

      toast.success('✅ Settings saved successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(`❌ ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
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
      <Sidebar activeItem="settings" userEmail={user.email || ''} />

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
                    <p className="text-gray-800 font-mono font-bold text-sm break-all">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase text-gray-600 mb-1">注册时间</p>
                    <p className="text-gray-800 font-bold">{new Date(user.created_at || '').toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* 默认市场设置 */}
              <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white">
                <div className="border-b-2 border-black bg-gray-100 p-4 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-red-600" />
                  <h2 className="font-display font-bold text-2xl">DEFAULT MARKET</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_country" className="font-bold">默认目标国家</Label>
                    <Select
                      value={settings.default_country_id}
                      onValueChange={(value) => handleInputChange('default_country_id', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-black rounded-none font-bold">
                        <SelectValue placeholder="选择默认国家" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black rounded-none">
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id} className="font-bold">
                            {country.name} ({country.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">进入选品页面时默认显示该国家的商品</p>
                  </div>
                </div>
              </div>

              {/* 物流地址设置 */}
              <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white">
                <div className="border-b-2 border-black bg-gray-100 p-4 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <h2 className="font-display font-bold text-2xl">SHIPPING ADDRESS</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_address" className="font-bold">详细地址</Label>
                    <Input
                      id="shipping_address"
                      value={settings.shipping_address}
                      onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                      className="h-12 border-2 border-black rounded-none font-bold"
                      placeholder="输入您的发货地址"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_city" className="font-bold">城市</Label>
                      <Input
                        id="shipping_city"
                        value={settings.shipping_city}
                        onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                        className="h-12 border-2 border-black rounded-none font-bold"
                        placeholder="城市"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_postal_code" className="font-bold">邮政编码</Label>
                      <Input
                        id="shipping_postal_code"
                        value={settings.shipping_postal_code}
                        onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                        className="h-12 border-2 border-black rounded-none font-bold"
                        placeholder="邮编"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_country" className="font-bold">国家</Label>
                    <Input
                      id="shipping_country"
                      value={settings.shipping_country}
                      onChange={(e) => handleInputChange('shipping_country', e.target.value)}
                      className="h-12 border-2 border-black rounded-none font-bold"
                      placeholder="发货国家"
                    />
                  </div>
                </div>
              </div>

              {/* 选品偏好设置 */}
              <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white">
                <div className="border-b-2 border-black bg-gray-100 p-4 flex items-center gap-2">
                  <Percent className="h-6 w-6 text-green-600" />
                  <h2 className="font-display font-bold text-2xl">PRODUCT PREFERENCES</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform_fee_rate" className="font-bold">默认平台费率 (%)</Label>
                    <Input
                      id="platform_fee_rate"
                      type="number"
                      value={settings.platform_fee_rate}
                      onChange={(e) => handleInputChange('platform_fee_rate', e.target.value)}
                      className="h-12 border-2 border-black rounded-none font-bold"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500">利润计算器默认使用的平台费率</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_profit_margin" className="font-bold">期望最低利润率 (%)</Label>
                    <Input
                      id="default_profit_margin"
                      type="number"
                      value={settings.default_profit_margin}
                      onChange={(e) => handleInputChange('default_profit_margin', e.target.value)}
                      className="h-12 border-2 border-black rounded-none font-bold"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500">选品推荐时优先展示不低于此利润率的商品</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="h-14 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                {saving ? (
                  <><div className="animate-spin h-5 w-5 border-b-2 border-white mr-2" />SAVING...</>
                ) : (
                  <><Save className="h-5 w-5 mr-2" />SAVE SETTINGS</>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
