import { Wizard } from '../components/wizard'

export const dynamic = 'force-dynamic'

export default function OrgBuilderPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 md:px-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-lime">Rally-OS</p>
        <h1 className="text-3xl font-semibold text-text-primary">Org Builder</h1>
        <p className="text-text-muted">
          Concept → public team-site → operations. Edit the SiteConfig, preview the enabled modules,
          provision the TeamSeason, then publish the public site from the published projection.
        </p>
      </div>
      <Wizard />
    </main>
  )
}
