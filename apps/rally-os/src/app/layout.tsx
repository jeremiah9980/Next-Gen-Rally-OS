import type { Metadata } from 'next'
import { Providers } from '../components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rally OS Team Portal',
  description: 'Team Portal dashboard shell for Rally OS',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions inject attributes on <body> before hydration. */}
      <body className="bg-background text-text-primary" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
