'use client'

import { motion } from 'framer-motion'
import { CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wand2, FileUp, TrendingUp } from 'lucide-react'

const actions = [
  {
    icon: Wand2,
    label: 'Generate Copy',
    color: 'from-[#c6ff00] to-[#a3e635]',
    textColor: 'text-black',
    description: 'AI powered copywriting'
  },
  {
    icon: FileUp,
    label: 'Bulk Import',
    color: 'from-[#8b5cf6] to-[#7c3aed]',
    textColor: 'text-white',
    description: 'Upload CSV product list'
  },
  {
    icon: TrendingUp,
    label: 'Trending Now',
    color: 'from-[#ec4899] to-[#db2777]',
    textColor: 'text-white',
    description: 'Discover hot products'
  }
]

export default function QuickActionCard() {
  return (
    <CardContent className="p-0">
      <div className="p-6 space-y-3">
        {actions.map((action, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              delay: idx * 0.1
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
              <action.icon className={`w-5 h-5 stroke-[1.5px] ${action.textColor}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${action.textColor.replace('text-', 'text-')}`}>
                {action.label}
              </p>
              <p className="text-xs text-white/50">
                {action.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </CardContent>
  )
}
