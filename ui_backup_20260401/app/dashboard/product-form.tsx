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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-title" className="text-gray-300">Product Title</Label>
          <Input
            id="product-title"
            placeholder="e.g. Wireless Bluetooth Headphones"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            required
            disabled={loading}
            className="bg-[#1a1a2e] border-[#2a2a3a] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price" className="text-gray-300">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="29.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
            className="bg-[#1a1a2e] border-[#2a2a3a] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords" className="text-gray-300">Keywords (comma separated, optional)</Label>
        <Input
          id="keywords"
          placeholder="e.g. noise cancelling, long battery life, waterproof"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={loading}
          className="bg-[#1a1a2e] border-[#2a2a3a] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Marketing Copy
            </>
          )}
        </Button>

        {/* 状态指示灯 */}
        {status === 'generating' && (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating copy...</span>
          </div>
        )}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-[#c6ff00]">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Generated successfully!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Generation failed</span>
          </div>
        )}
      </div>
    </form>
  )
}
