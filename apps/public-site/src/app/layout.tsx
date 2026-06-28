import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Team Site',
  description: 'Published team site powered by Rally-OS',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
