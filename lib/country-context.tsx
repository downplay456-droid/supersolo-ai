'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Country {
  id: string
  code: string
  name: string
  currency: string
  currency_symbol: string
  language_code: string
  logistics_days_min: number
  logistics_days_max: number
  popular_categories: string[]
}

interface CountryContextType {
  selectedCountry: Country | null
  setSelectedCountry: (country: Country) => void
  countries: Country[]
  isLoading: boolean
}

const CountryContext = createContext<CountryContextType | undefined>(undefined)

// 预设的国家数据，后续可从API获取
const defaultCountries: Country[] = [
  {
    id: '1',
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currency_symbol: '$',
    language_code: 'en',
    logistics_days_min: 7,
    logistics_days_max: 15,
    popular_categories: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty']
  },
  {
    id: '2',
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currency_symbol: '$',
    language_code: 'en',
    logistics_days_min: 10,
    logistics_days_max: 20,
    popular_categories: ['Outdoor', 'Home', 'Electronics', 'Pet Supplies']
  },
  {
    id: '3',
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    currency_symbol: '¥',
    language_code: 'ja',
    logistics_days_min: 5,
    logistics_days_max: 12,
    popular_categories: ['Anime Merch', 'Electronics', 'Cosmetics', 'Home Goods']
  },
  {
    id: '4',
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currency_symbol: '£',
    language_code: 'en',
    logistics_days_min: 7,
    logistics_days_max: 14,
    popular_categories: ['Fashion', 'Home & Garden', 'Electronics', 'Beauty']
  },
  {
    id: '5',
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currency_symbol: '€',
    language_code: 'de',
    logistics_days_min: 7,
    logistics_days_max: 14,
    popular_categories: ['Automotive', 'Home', 'Electronics', 'Sports']
  }
]

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [countries, setCountries] = useState<Country[]>(defaultCountries)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从localStorage读取上次选择的国家
    const savedCountry = localStorage.getItem('selectedCountry')
    if (savedCountry) {
      setSelectedCountry(JSON.parse(savedCountry))
    } else {
      // 默认选择美国
      setSelectedCountry(defaultCountries[0])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      localStorage.setItem('selectedCountry', JSON.stringify(selectedCountry))
    }
  }, [selectedCountry])

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry, countries, isLoading }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry() {
  const context = useContext(CountryContext)
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider')
  }
  return context
}
