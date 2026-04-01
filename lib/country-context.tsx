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
  error: string | null
}

const CountryContext = createContext<CountryContextType | undefined>(undefined)

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取国家列表
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/countries')
        if (!response.ok) {
          throw new Error('Failed to fetch countries')
        }
        const data = await response.json()
        setCountries(data)

        // 从localStorage读取上次选择的国家
        const savedCountry = localStorage.getItem('selectedCountry')
        if (savedCountry) {
          const parsedCountry = JSON.parse(savedCountry)
          // 验证保存的国家是否还在列表中
          const countryExists = data.some((c: Country) => c.id === parsedCountry.id)
          if (countryExists) {
            setSelectedCountry(parsedCountry)
          } else {
            // 如果保存的国家不存在，默认选择第一个
            setSelectedCountry(data[0])
          }
        } else {
          // 默认选择第一个国家
          setSelectedCountry(data[0])
        }
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error fetching countries:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountries()
  }, [])

  // 持久化选择的国家到localStorage
  useEffect(() => {
    if (selectedCountry) {
      localStorage.setItem('selectedCountry', JSON.stringify(selectedCountry))
    }
  }, [selectedCountry])

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry, countries, isLoading, error }}>
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

// 便捷hooks：获取当前选中国家的常用属性
export function useCurrentCountry() {
  const { selectedCountry } = useCountry()
  if (!selectedCountry) {
    throw new Error('useCurrentCountry must be used when a country is selected')
  }
  return selectedCountry
}
