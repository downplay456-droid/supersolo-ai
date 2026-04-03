'use client'

import { useState } from 'react'
import { X, Calculator, DollarSign, Percent, Truck, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Product } from '@/lib/types/product'

interface ProfitCalculatorProps {
  product: Product
  currencySymbol: string
}

export default function ProfitCalculator({ product, currencySymbol }: ProfitCalculatorProps) {
  // 默认配置，可根据用户设置修改
  const [costs, setCosts] = useState({
    purchaseCost: (product.current_price * 0.3).toFixed(2), // 默认采购成本为售价的30%
    shippingCost: (product.current_price * 0.15).toFixed(2), // 默认运费为售价的15%
    platformFeeRate: '15', // 默认平台费率15%
    otherCosts: '0' // 其他成本
  })

  // 计算利润
  const sellingPrice = product.current_price
  const purchaseCost = parseFloat(costs.purchaseCost) || 0
  const shippingCost = parseFloat(costs.shippingCost) || 0
  const platformFeeRate = parseFloat(costs.platformFeeRate) || 0
  const otherCosts = parseFloat(costs.otherCosts) || 0

  const platformFee = sellingPrice * (platformFeeRate / 100)
  const totalCost = purchaseCost + shippingCost + platformFee + otherCosts
  const profit = sellingPrice - totalCost
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0

  const handleInputChange = (field: keyof typeof costs, value: string) => {
    // 只允许数字和小数点
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCosts(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="w-full mt-2 bg-[#c6ff00] hover:bg-[#b3e600] text-black font-bold text-base h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Calculator className="w-4 h-4 mr-2" />
          CALCULATE PROFIT
        </Button>
      </DialogTrigger>
      <DialogContent className="border-4 border-black bg-white max-w-md p-0 rounded-none shadow-[12px_12px_0px_0px_#000]">
        <DialogHeader className="bg-red-600 text-white p-6 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-display font-heavy text-white flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              PROFIT CALCULATOR
            </DialogTitle>
          </div>
          <p className="text-white/80 font-bold text-sm mt-1">
            Calculate estimated profit for this product
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* 产品信息 */}
          <div className="p-4 bg-gray-50 border-2 border-black">
            <h4 className="font-bold text-lg mb-2">{product.title}</h4>
            <div className="flex items-center gap-1 text-xl font-mono font-heavy text-red-600">
              <DollarSign className="w-5 h-5" />
              Selling Price: {currencySymbol}{sellingPrice.toFixed(2)}
            </div>
          </div>

          {/* 成本输入 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b-2 border-black pb-2">COST INPUTS</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-sm">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Purchase Cost (Supplier Price)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold">¥</span>
                <Input
                  type="text"
                  value={costs.purchaseCost}
                  onChange={(e) => handleInputChange('purchaseCost', e.target.value)}
                  className="pl-8 h-12 border-2 border-black font-mono font-bold text-lg rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-sm">
                <Truck className="w-4 h-4 text-green-600" />
                Shipping Cost (To Customer)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold">{currencySymbol}</span>
                <Input
                  type="text"
                  value={costs.shippingCost}
                  onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                  className="pl-8 h-12 border-2 border-black font-mono font-bold text-lg rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-sm">
                <Percent className="w-4 h-4 text-purple-600" />
                Platform Fee Rate (%)
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold">%</span>
                <Input
                  type="text"
                  value={costs.platformFeeRate}
                  onChange={(e) => handleInputChange('platformFeeRate', e.target.value)}
                  className="pr-8 h-12 border-2 border-black font-mono font-bold text-lg rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-sm">
                <Plus className="w-4 h-4 text-orange-600" />
                Other Costs (Advertising, etc.)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold">{currencySymbol}</span>
                <Input
                  type="text"
                  value={costs.otherCosts}
                  onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                  className="pl-8 h-12 border-2 border-black font-mono font-bold text-lg rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* 计算结果 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b-2 border-black pb-2">CALCULATION RESULTS</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-100 border-2 border-black">
                <p className="text-xs font-bold text-gray-600 mb-1">PLATFORM FEE</p>
                <p className="font-mono font-bold text-lg">{currencySymbol}{platformFee.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-100 border-2 border-black">
                <p className="text-xs font-bold text-gray-600 mb-1">TOTAL COST</p>
                <p className="font-mono font-bold text-lg">{currencySymbol}{totalCost.toFixed(2)}</p>
              </div>
            </div>

            <div className={`p-4 border-4 ${profit > 0 ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg flex items-center gap-1">
                  <TrendingUp className="w-5 h-5" />
                  ESTIMATED PROFIT
                </span>
                <span className={`font-mono font-heavy text-2xl ${profit > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {profit > 0 ? '+' : ''}{currencySymbol}{profit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-600">PROFIT MARGIN</span>
                <span className={`font-mono font-bold ${profitMargin > 20 ? 'text-green-700' : profitMargin > 10 ? 'text-orange-600' : 'text-red-700'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 利润等级提示 */}
            <div className="text-sm">
              {profitMargin > 30 && (
                <p className="text-green-700 font-bold">✅ Excellent profit margin, highly recommended!</p>
              )}
              {profitMargin > 20 && profitMargin <= 30 && (
                <p className="text-green-600 font-bold">✅ Good profit margin, worth considering.</p>
              )}
              {profitMargin > 10 && profitMargin <= 20 && (
                <p className="text-orange-600 font-bold">⚠️ Moderate profit margin, evaluate carefully.</p>
              )}
              {profitMargin <= 10 && (
                <p className="text-red-600 font-bold">❌ Low profit margin, not recommended.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
