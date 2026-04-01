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
    <html lang="en">
      <body className="font-sans bg-background text-foreground min-h-screen antialiased">
        <CountryProvider>
          {children}
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              borderRadius: '0px',
              fontWeight: '600'
            },
            success: {
              style: {
                borderLeft: '6px solid #ff0000',
              },
            },
            error: {
              style: {
                borderLeft: '6px solid #ff0000',
              },
            },
          }}
        />
        </CountryProvider>
      </body>
    </html>
  )
}
