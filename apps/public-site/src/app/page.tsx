import { prisma } from '@rally/core-data'
import { defaultSiteConfig } from '@rally/config'
import { buildPublishedProjection } from '@rally/projection'
import { SiteRenderer } from '@rally/site-template'

export const dynamic = 'force-dynamic'

function EmptyState({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-lime">Rally-OS</p>
        <p className="text-text-muted">{message}</p>
      </div>
    </main>
  )
}

export default async function PublicSitePage() {
  let org: Awaited<ReturnType<typeof loadOrg>> = null
  try {
    org = await loadOrg()
  } catch {
    return <EmptyState message="This team site has not been published yet." />
  }
  if (!org) return <EmptyState message="No published team site found." />

  const season = org.teams.flatMap((t) => t.seasons)[0]
  if (!season) return <EmptyState message="No active season to display yet." />

  const config = defaultSiteConfig({
    organization: { name: org.name, slug: org.slug },
    team: { name: season.team_name, season: season.season, age_group: season.age_group },
  })

  const projection = await buildPublishedProjection(org.id, config)
  if (!projection) return <EmptyState message="No active season to display yet." />

  return <SiteRenderer config={config} projection={projection} />
}

function loadOrg() {
  // The public site is provisioned per team; default to the org named by
  // PUBLIC_SITE_ORG_SLUG, else the first organization.
  const slug = process.env.PUBLIC_SITE_ORG_SLUG
  return prisma.organization.findFirst({
    where: slug ? { slug } : undefined,
    orderBy: { createdAt: 'asc' },
    include: {
      teams: {
        include: {
          seasons: { where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 1 },
        },
      },
    },
  })
}
