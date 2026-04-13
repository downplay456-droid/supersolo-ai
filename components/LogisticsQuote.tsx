'use client'

import { useState, useEffect } from 'react'
import { Truck, Clock, Shield, Search, DollarSign, Star, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Product } from '@/lib/types/product'
import { LogisticsQuoteResult } from '@/lib/types/logistics'
import toast from 'react-hot-toast'
import { useCountry } from '@/lib/country-context'

// 获取物流渠道类型标签
function getChannelTypeLabel(type: string): string {
  switch (type) {
    case 'postal': return '邮政小包'
    case 'special_line': return '专线物流'
    case 'express': return '商业快递'
    case 'warehouse': return '海外仓'
    default: return type
  }
}

// 获取渠道类型颜色
function getChannelTypeColor(type: string): string {
  switch (type) {
    case 'postal': return 'bg-blue-100 text-blue-800'
    case 'special_line': return 'bg-green-100 text-green-800'
    case 'express': return 'bg-red-100 text-red-800'
    case 'warehouse': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

interface LogisticsQuoteProps {
  product: Product
  currencySymbol: string
}

export default function LogisticsQuote({ product, currencySymbol }: LogisticsQuoteProps) {
  const { selectedCountry } = useCountry()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState<LogisticsQuoteResult[]>([])
  const [sortBy, setSortBy] = useState<'recommended' | 'price' | 'speed'>('recommended')
  const [weight, setWeight] = useState(product.weight?.toString() || '0.5')
  const [declaredValue, setDeclaredValue] = useState(product.current_price.toString())
  const [error, setError] = useState<string | null>(null)

  // 获取物流报价
  const fetchQuotes = async (sort: typeof sortBy) => {
    if (!selectedCountry) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('countryId', selectedCountry.id)
      params.append('weight', weight || '0.5')
      params.append('sortBy', sort)
      if (declaredValue) params.append('declaredValue', declaredValue)

      const response = await fetch(`/api/logistics?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch logistics quotes')
        setQuotes([])
      } else {
        setQuotes(data.data)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  // 打开弹窗时自动获取报价
  useEffect(() => {
    if (isOpen && selectedCountry) {
      fetchQuotes(sortBy)
    }
  }, [isOpen])

  // 切换排序时重新获取
  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort)
    fetchQuotes(newSort)
  }

  // 搜索时重新获取
  const handleSearch = () => {
    fetchQuotes(sortBy)
  }

  // 选择物流方案
  const handleSelectQuote = (quote: LogisticsQuoteResult) => {
    toast.success(
      <div className="space-y-1">
        <p className="font-bold">✅ Selected: {quote.quote.channel?.name}</p>
        <p className="text-xs text-white/70">
          Price: ¥{quote.total_price.toFixed(2)} | Transit: {quote.transit_days_display}
        </p>
      </div>,
      { duration: 3000 }
    )
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-white hover:bg-gray-100 text-black font-bold text-base h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Truck className="w-4 h-4 mr-2" />
          CHECK LOGISTICS
        </Button>
      </DialogTrigger>
      <DialogContent className="border-4 border-black bg-white max-w-3xl p-0 rounded-none shadow-[12px_12px_0px_0px_#000] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-red-600 text-white p-6 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-display font-heavy text-white flex items-center gap-2">
              <Truck className="w-6 h-6" />
              LOGISTICS QUOTES
            </DialogTitle>
          </div>
          <p className="text-white/80 font-bold text-sm mt-1">
            Compare shipping options and find the best logistics solution
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 产品信息 */}
            <div className="p-4 bg-gray-50 border-2 border-black">
              <h4 className="font-bold text-lg mb-2">{product.title}</h4>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  Price: {currencySymbol}{product.current_price.toFixed(2)}
                </span>
                {product.weight && (
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Weight: {product.weight}kg
                  </span>
                )}
              </div>
            </div>

            {/* 参数输入 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b-2 border-black pb-2">SHIPPING PARAMETERS</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-bold text-sm">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Weight (kg)
                  </label>
                  <Input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-12 border-2 border-black font-mono font-bold text-lg rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-red-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-bold text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Declared Value ({currencySymbol})
                  </label>
                  <Input
                    type="text"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    className="h-12 border-2 border-black font-mono font-bold text-lg rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-red-600"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-bold h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  {loading ? (
                    <><div className="animate-spin h-4 w-4 border-b-2 border-white mr-2" />SEARCHING...</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" />SEARCH QUOTES</>
                  )}
                </Button>
              </div>
            </div>

            {/* 排序选项 */}
            {quotes.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSortChange('recommended')}
                  className={`flex-1 py-3 px-4 font-bold text-sm border-2 transition-all ${
                    sortBy === 'recommended'
                      ? 'bg-red-600 text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4 inline mr-1" />
                  RECOMMENDED
                </button>
                <button
                  onClick={() => handleSortChange('price')}
                  className={`flex-1 py-3 px-4 font-bold text-sm border-2 transition-all ${
                    sortBy === 'price'
                      ? 'bg-red-600 text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  LOWEST PRICE
                </button>
                <button
                  onClick={() => handleSortChange('speed')}
                  className={`flex-1 py-3 px-4 font-bold text-sm border-2 transition-all ${
                    sortBy === 'speed'
                      ? 'bg-red-600 text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  FASTEST SPEED
                </button>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-600">
                <p className="text-red-700 font-bold">⚠️ {error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Try adjusting the weight or check back later for updated quotes.
                </p>
              </div>
            )}

            {/* Loading 状态 */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border-2 border-black bg-gray-50 animate-pulse">
                    <div className="h-6 bg-gray-200 mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 mb-2 w-1/2"></div>
                    <div className="h-4 bg-gray-200 w-1/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* 物流报价列表 */}
            {!loading && quotes.length > 0 && (
              <div className="space-y-4">
                {quotes.map((result, index) => (
                  <div
                    key={result.quote.id}
                    className={`relative p-5 border-2 transition-all ${
                      result.quote.is_recommended
                        ? 'border-red-600 bg-red-50 shadow-[4px_4px_0px_0px_#ff0000]'
                        : 'border-black bg-white hover:border-red-600'
                    }`}
                  >
                    {/* 推荐标签 */}
                    {result.quote.is_recommended && (
                      <div className="absolute -top-3 -left-2 px-3 py-1 bg-red-600 text-white text-xs font-bold border-2 border-black z-10">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        RECOMMENDED
                      </div>
                    )}

                    {/* 头部：渠道名称 + 价格 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-display font-heavy text-lg border-2 border-black">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{result.quote.channel?.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 font-bold border border-black ${getChannelTypeColor(result.quote.channel?.type || '')}`}>
                              {getChannelTypeLabel(result.quote.channel?.type || '')}
                            </span>
                            <span className="text-xs font-bold text-gray-600">
                              {result.quote.channel?.company_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-mono font-heavy text-red-600">
                          ¥{result.total_price.toFixed(2)}
                        </div>
                        <div className="text-xs font-bold text-gray-600">
                          CNY (incl. insurance)
                        </div>
                      </div>
                    </div>

                    {/* 详情网格 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-white border-2 border-black">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-gray-600">TRANSIT TIME</span>
                        </div>
                        <p className="font-mono font-bold text-lg">{result.transit_days_display}</p>
                      </div>

                      <div className="p-3 bg-white border-2 border-black">
                        <div className="flex items-center gap-1 mb-1">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-bold text-gray-600">LOSS RATE</span>
                        </div>
                        <p className="font-mono font-bold text-lg">{result.loss_rate_display}</p>
                      </div>

                      <div className="p-3 bg-white border-2 border-black">
                        <div className="flex items-center gap-1 mb-1">
                          <Truck className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-gray-600">TRACKING</span>
                        </div>
                        <p className="font-mono font-bold text-lg">{result.tracking_label}</p>
                      </div>
                    </div>

                    {/* 备注 */}
                    {result.quote.notes && (
                      <div className="p-3 bg-gray-100 border-2 border-black mb-3">
                        <p className="text-sm font-bold">📝 {result.quote.notes}</p>
                      </div>
                    )}

                    {/* 保险信息 */}
                    {result.insurance_price && result.insurance_price > 0 && (
                      <div className="text-xs font-bold text-gray-600 mb-3">
                        Insurance: ¥{result.insurance_price.toFixed(2)} (rate: {(result.quote.insurance_rate * 100).toFixed(2)}%)
                      </div>
                    )}

                    {/* 选择按钮 */}
                    <Button
                      onClick={() => handleSelectQuote(result)}
                      className={`w-full font-bold h-12 border-2 transition-all ${
                        result.quote.is_recommended
                          ? 'bg-red-600 hover:bg-red-700 text-white border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                          : 'bg-black hover:bg-gray-800 text-white border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                      }`}
                    >
                      SELECT THIS OPTION
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 无数据状态 */}
            {!loading && !error && quotes.length === 0 && (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="font-bold text-lg text-gray-600">NO LOGISTICS QUOTES FOUND</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting the weight or select a different country
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
