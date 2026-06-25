import { Card } from '@rally/ui'

type StubPageProps = {
  title: string
}

export function StubPage({ title }: StubPageProps) {
  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      <p className="mt-2 text-text-muted">Coming soon.</p>
    </Card>
  )
}
