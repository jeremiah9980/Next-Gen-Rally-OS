import { cn } from '../lib/cn'

type StatTileProps = {
  label: string
  value: string
  className?: string
}

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-background px-4 py-3', className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  )
}
