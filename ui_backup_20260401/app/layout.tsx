import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { CountryProvider } from '@/lib/country-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'SuperSolo AI',
  description: 'Cross-border e-commerce AI automation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-foreground min-h-screen">
        <CountryProvider>
          {children}
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#121214',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
            },
            success: {
              style: {
                borderLeft: '4px solid #c6ff00',
              },
            },
            error: {
              style: {
                borderLeft: '4px solid #ef4444',
              },
            },
          }}
        />
        </CountryProvider>
      </body>
    </html>
  )
}
