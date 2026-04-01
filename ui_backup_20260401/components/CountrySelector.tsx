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
        className="flex items-center gap-2 px-4 py-2 bg-[#121214] border border-[#2a2a2e] rounded-lg hover:border-[#3a3a3f] transition-all group"
      >
        <Globe className="w-4 h-4 text-[#c6ff00]" />
        <span className="text-sm font-medium">{selectedCountry.name} ({selectedCountry.code})</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#121214] border border-[#2a2a2e] rounded-lg shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wider">
              Select Target Market
            </div>
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => {
                  setSelectedCountry(country)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#1a1a1f] transition-colors ${
                  selectedCountry.id === country.id ? 'bg-[#1a1a1f]' : ''
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{country.name}</span>
                  <span className="text-xs text-gray-400">
                    {country.currency_symbol} {country.currency} • {country.language_code.toUpperCase()}
                  </span>
                </div>
                {selectedCountry.id === country.id && (
                  <Check className="w-4 h-4 text-[#c6ff00]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
