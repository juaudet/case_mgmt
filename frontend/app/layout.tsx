import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'SIEM Case Manager',
  description: 'AI-Powered Security Incident Response Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0F1923] text-slate-200 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
