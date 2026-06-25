import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'border-transparent bg-accent-lime text-background hover:bg-accent-lime/90 disabled:bg-accent-lime/50',
  secondary:
    'border-accent-purple/60 bg-transparent text-text-primary hover:border-accent-purple hover:bg-accent-purple/10',
  ghost: 'border-transparent bg-transparent text-text-muted hover:bg-surface hover:text-text-primary',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
