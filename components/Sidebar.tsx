'use client'

import { Home, Package, Settings, Heart } from 'lucide-react'

export type SidebarActiveItem = 'dashboard' | 'products' | 'favorites' | 'settings'

interface NavItem {
  id: SidebarActiveItem
  label: string
  href: string
  icon: typeof Home
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'DASHBOARD', href: '/dashboard', icon: Home },
  { id: 'products', label: 'PRODUCTS', href: '/products', icon: Package },
  { id: 'favorites', label: 'MY LIBRARY', href: '/favorites', icon: Heart },
  { id: 'settings', label: 'SETTINGS', href: '/settings', icon: Settings },
]

interface SidebarProps {
  activeItem: SidebarActiveItem
  userEmail: string
}

export default function Sidebar({ activeItem, userEmail }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r-2 border-black hidden md:block relative min-h-screen">
      <div className="p-6 border-b-2 border-black">
        <h2 className="text-3xl font-display font-heavy tracking-tighter">
          <span className="text-black">SUPER</span><span className="text-red-600">SOLO</span>
        </h2>
      </div>

      <nav className="p-0 mt-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeItem
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-4 text-lg transition-colors ${
                isActive
                  ? 'bg-red-600 text-white font-extrabold border-l-8 border-black'
                  : 'hover:bg-gray-100 text-black font-bold'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'fill-white' : ''}`} />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="sticky bottom-0 left-0 right-0 border-t-2 border-black bg-white">
        <div className="p-4 bg-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center font-mono font-heavy text-xl">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-bold truncate">{userEmail}</p>
            <p className="text-xs text-gray-600 font-bold uppercase">SELLER ACCOUNT</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
