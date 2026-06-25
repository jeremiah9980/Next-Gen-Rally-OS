import { cn } from '../lib/cn'

type AvatarProps = {
  name: string
  className?: string
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || '--'
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full border border-accent-purple/40 bg-background text-sm font-semibold text-accent-lime',
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
