'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface ProductFormProps {
  userId: string
}

export default function ProductForm({ userId }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [productTitle, setProductTitle] = useState('')
  const [price, setPrice] = useState('')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productTitle || !price) return

    setLoading(true)
    setStatus('generating')
    try {
      // 1. 调用DeepSeek API生成营销文案
      const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k)
      const copyResponse = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle,
          keywords: keywordsList.length > 0 ? keywordsList : ['high quality', 'durable', 'affordable']
        })
      })

      if (!copyResponse.ok) throw new Error('Failed to generate copy')
      const { generatedCopy } = await copyResponse.json()

      // 2. 保存产品到数据库
      const { error } = await supabase
        .from('trending_products')
        .insert({
          user_id: userId,
          original_title: productTitle,
          price: parseFloat(price),
          ai_generated_copy: generatedCopy,
          target_market: 'global'
        })

      if (error) throw error

      // 3. 刷新页面显示新产品
      setStatus('success')
      router.refresh()
      setProductTitle('')
      setPrice('')
      setKeywords('')
      toast.success('🎉 Marketing copy generated and saved successfully!')

      // 3秒后重置状态
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      console.error('Error creating product:', err)
      setStatus('error')
      toast.error(err.message || '❌ Failed to generate product, please try again')
      // 5秒后重置错误状态
      setTimeout(() => setStatus('idle'), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="product-title" className="text-black font-bold text-lg uppercase tracking-wide">产品名称</Label>
          <Input
            id="product-title"
            placeholder="例如：Wireless Bluetooth Headphones"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            required
            disabled={loading}
            className="border-2 border-black h-14 px-4 text-black text-lg font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price" className="text-black font-bold text-lg uppercase tracking-wide">售价 (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="29.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
            className="border-2 border-black h-14 px-4 text-black text-lg font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords" className="text-black font-bold text-lg uppercase tracking-wide">关键词 (逗号分隔，可选)</Label>
        <Input
          id="keywords"
          placeholder="例如：noise cancelling, long battery life, waterproof"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={loading}
          className="border-2 border-black h-14 px-4 text-black text-lg font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-0"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg h-14 px-8 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="mr-3 h-5 w-5" />
              生成营销文案
            </>
          )}
        </Button>

        {/* 状态指示灯 */}
        {status === 'generating' && (
          <div className="flex items-center gap-2 text-blue-700 font-bold text-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>正在生成文案...</span>
          </div>
        )}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span>生成成功！</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-700 font-bold text-lg">
            <AlertCircle className="h-5 w-5" />
            <span>生成失败，请重试</span>
          </div>
        )}
      </div>
    </form>
  )
}
