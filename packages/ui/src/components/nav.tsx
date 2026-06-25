'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '../lib/cn'

type NavItem = {
  title: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

type NavProps = {
  items: readonly NavItem[]
}

function isItemActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/' || pathname === '/dashboard'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Nav({ items }: NavProps) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-screen w-20 flex-col border-r border-border bg-[#090915] md:w-72">
      <div className="border-b border-border px-4 py-6 md:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent-lime md:text-left">
          Rally OS
        </p>
        <p className="mt-2 hidden text-sm text-text-muted md:block">Team Portal</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 md:px-4">
        {items.map((item) => {
          const Icon = item.icon
          const active = isItemActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-text-muted transition hover:border-accent-purple/40 hover:bg-surface hover:text-text-primary md:justify-start',
                active &&
                  'border-accent-lime/40 bg-accent-lime/10 text-accent-lime shadow-[0_0_0_1px_rgba(163,230,53,0.15)]',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden text-sm font-medium md:block">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
