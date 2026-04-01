'use client'

import React, { useState } from 'react'
import { useCountry } from '@/lib/country-context'
import { ChevronDown, Globe, Check } from 'lucide-react'

export default function CountrySelector() {
  const { selectedCountry, setSelectedCountry, countries } = useCountry()
  const [isOpen, setIsOpen] = useState(false)

  if (!selectedCountry) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all"
      >
        <Globe className="w-5 h-5 text-white" />
        <span className="font-medium">{selectedCountry.name} ({selectedCountry.code})</span>
        <ChevronDown className={`w-5 h-5 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] z-50 py-0 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 bg-black text-white text-sm font-bold uppercase tracking-wider border-b-2 border-black">
              选择目标市场
            </div>
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => {
                  setSelectedCountry(country)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors text-left border-b border-gray-200 last:border-b-0 ${
                  selectedCountry.id === country.id ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-base font-bold">{country.name}</span>
                  <span className="text-sm text-gray-600 font-medium">
                    {country.currency_symbol} {country.currency} • {country.language_code.toUpperCase()}
                  </span>
                </div>
                {selectedCountry.id === country.id && (
                  <Check className="w-5 h-5 text-red-600 font-bold" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
