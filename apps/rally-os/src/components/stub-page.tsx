import Link from 'next/link'
import { Card } from '@rally/ui'

type StubPageProps = {
  title: string
  description?: string
  /** Existing pages that cover parts of this module today. */
  related?: { title: string; href: string }[]
}

export function StubPage({ title, description, related }: StubPageProps) {
  return (
    <Card className="space-y-4 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-lime">
          Planned Module
        </p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary">{title}</h1>
      </div>
      <p className="max-w-prose text-text-muted">
        {description ?? 'This module is on the roadmap and not yet available.'}
      </p>
      {related && related.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-primary">Available today</p>
          <ul className="space-y-1">
            {related.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-accent-lime underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
