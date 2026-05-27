'use client'

import { useState, useRef } from 'react'
import { Heart, Copy, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product } from '@/lib/types/product'
import toast from 'react-hot-toast'
import ProfitCalculator, { ProfitCalculatorRef } from './ProfitCalculator'
import PriceComparisonModal from './PriceComparisonModal'

interface ProductCardProps {
  product: Product
  isFavorite: boolean
  isGenerating: boolean
  currencySymbol: string
  onToggleFavorite: (productId: string) => void
  onGenerateCopy: (product: Product) => void
}

export default function ProductCard({
  product,
  isFavorite,
  isGenerating,
  currencySymbol,
  onToggleFavorite,
  onGenerateCopy
}: ProductCardProps) {
  const profitCalculatorRef = useRef<ProfitCalculatorRef>(null)

  // 保存成本数据到选品库
  const handleSaveCostData = (costData: Record<string, unknown>) => {
    // 这里可以调用父组件的保存方法，或者直接更新选品库数据
    toast.success('成本数据已保存到选品库')
  }

  return (
    <div className="border-2 border-black overflow-hidden group hover:border-red-600 hover:shadow-[8px_8px_0px_0px_#ff0000] transition-all bg-white">
      <div className="relative">
        <img
          src={product.main_image_url}
          alt={product.title}
          className="w-full aspect-square object-cover bg-white"
          onError={(e) => {
            // 图片加载失败时使用与设计风格统一的文字占位符
            const imgElement = e.target as HTMLImageElement;
            const parent = imgElement.parentElement;
            if (parent) {
              // 创建风格统一的占位符
              const placeholder = document.createElement('div');
              placeholder.className = 'w-full aspect-square bg-gray-50 flex flex-col items-center justify-center p-4 border-b-2 border-black';
              placeholder.innerHTML = `
                <div class="font-display font-heavy text-3xl text-black text-center leading-tight">
                  ${product.title.split(' ').slice(0, 3).join(' ')}
                </div>
                <div class="mt-4 px-4 py-2 bg-red-600 text-white font-bold text-sm">
                  PRODUCT IMAGE
                </div>
              `;
              parent.replaceChild(placeholder, imgElement);
            }
          }}
        />
        <button
          onClick={() => onToggleFavorite(product.id)}
          className="absolute top-4 right-4 p-2 bg-white border-2 border-black hover:bg-gray-100 transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-red-600 text-red-600' : 'text-black'
            }`}
          />
        </button>
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 text-white text-sm font-mono font-bold border-2 border-black">
          {product.potential_score}% POTENTIAL
        </div>
      </div>
      <div className="p-5 border-t-2 border-black">
        <h3 className="text-lg font-bold line-clamp-2 mb-4 h-12">
          {product.title}
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-mono font-heavy">{currencySymbol}{product.current_price}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-5 h-5 text-green-700" />
            <span className="text-lg font-mono font-bold text-green-700">+{product.sales_growth_rate}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 font-bold">{product.source_platform}</span>
          {product.category && (
            <span className="text-sm px-3 py-1 bg-gray-100 text-black font-bold border border-black">{product.category}</span>
          )}
        </div>
        <div className="space-y-2">
          <Button
            onClick={() => onGenerateCopy(product)}
            disabled={isGenerating}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold text-base h-12 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {isGenerating ? (
              <><div className="animate-spin h-4 w-4 border-b-2 border-white mr-2" />GENERATING...</>
            ) : (
              <><Copy className="w-4 h-4 mr-2" />GENERATE MARKETING COPY</>
            )}
          </Button>

          <ProfitCalculator
            ref={profitCalculatorRef}
            product={product}
            currencySymbol={currencySymbol}
            onSaveToFavorites={handleSaveCostData}
          />

          <PriceComparisonModal
            product={product}
            currencySymbol={currencySymbol}
            onSelectSupplier={(purchaseCost: number, shippingCost: number) => {
              profitCalculatorRef.current?.open(purchaseCost, shippingCost)
            }}
          />
        </div>
      </div>
    </div>
  )
}
