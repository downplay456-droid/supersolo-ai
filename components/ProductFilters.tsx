'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProductFiltersProps {
  onFilterChange: (filters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    sortBy: string
    sortOrder: string
  }) => void
  categories: string[]
}

export default function ProductFilters({ onFilterChange, categories }: ProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('potential_score')
  const [sortOrder, setSortOrder] = useState<string>('desc')

  const handleApplyFilters = () => {
    onFilterChange({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      sortOrder
    })
  }

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('potential_score')
    setSortOrder('desc')
    onFilterChange({
      sortBy: 'potential_score',
      sortOrder: 'desc'
    })
  }

  return (
    <div className="border-2 border-black bg-white p-6 mb-8">
      <h3 className="text-xl font-bold mb-4">FILTERS & SORTING</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* 分类筛选 */}
        <div>
          <label className="block text-sm font-bold mb-2">CATEGORY</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="border-2 border-black rounded-none h-12">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL CATEGORIES</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 价格区间 */}
        <div>
          <label className="block text-sm font-bold mb-2">PRICE RANGE</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="border-2 border-black rounded-none h-12"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="border-2 border-black rounded-none h-12"
            />
          </div>
        </div>

        {/* 排序字段 */}
        <div>
          <label className="block text-sm font-bold mb-2">SORT BY</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-2 border-black rounded-none h-12">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="potential_score">Potential Score</SelectItem>
              <SelectItem value="sales_growth_rate">Sales Growth</SelectItem>
              <SelectItem value="current_price">Price</SelectItem>
              <SelectItem value="crawled_at">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 排序方向 */}
        <div>
          <label className="block text-sm font-bold mb-2">SORT ORDER</label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="border-2 border-black rounded-none h-12">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleApplyFilters}
          className="bg-red-600 text-white font-bold hover:bg-red-700 border-2 border-black shadow-[2px_2px_0px_0px_#000] h-12"
        >
          APPLY FILTERS
        </Button>
        <Button
          onClick={handleResetFilters}
          className="bg-white text-black font-bold hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_#000] h-12"
        >
          RESET
        </Button>
      </div>
    </div>
  )
}
