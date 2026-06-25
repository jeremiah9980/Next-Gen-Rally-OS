export default function PortalLoading() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-3xl border border-border bg-surface" />
      <div className="h-10 w-48 animate-pulse rounded-full border border-border bg-surface" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-3xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  )
}
