import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-accent-lime/30 bg-accent-lime/10 px-3 py-1 text-sm font-semibold text-accent-lime',
        className,
      )}
      {...props}
    />
  )
}
