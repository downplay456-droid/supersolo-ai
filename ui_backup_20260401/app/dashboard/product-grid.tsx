'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Sparkles, Plus } from 'lucide-react'

interface Product {
  id: string
  original_title: string
  price: number
  ai_generated_copy: string | null
  created_at: string
}

interface ProductGridProps {
  products: Product[]
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      delay: i * 0.05
    }
  })
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border border-dashed border-white/10 rounded-xl p-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
          <Plus className="w-8 h-8 text-white/40 stroke-[1.5px]" />
        </div>
        <h3 className="text-lg font-medium mb-2 tracking-[-0.02em]">No products yet</h3>
        <p className="text-white/50 max-w-md mx-auto text-sm">
          Generate your first product copy above to see it appear here
        </p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, idx) => (
        <motion.div
          key={product.id}
          custom={idx}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          whileHover={{ 
            y: -4,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
        >
          <Card className="h-full bg-[#121214]/80 backdrop-blur-md border-white/10 hover:border-white/20 transition-all duration-300 group overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium tracking-[-0.02em] line-clamp-1">
                  {product.original_title}
                </CardTitle>
                <div className="flex items-center gap-1 text-[#c6ff00] font-mono font-bold">
                  <DollarSign className="w-4 h-4 stroke-[1.5px]" />
                  <span>{product.price}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {product.ai_generated_copy ? (
                <div className="space-y-2 text-sm text-white/80">
                  {product.ai_generated_copy.split('\n').map((line, i) => (
                    <p key={i} className="line-clamp-2 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 min-w-[14px] text-[#8b5cf6] mt-0.5 stroke-[1.5px]" />
                      <span>{line.replace(/^[•\-*]\s*/, '')}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-white/40 border-t border-white/5 pt-3">
              {new Date(product.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
