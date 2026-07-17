import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rally-OS Org Builder',
  description: 'Concept → operations site builder for Rally-OS',
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
