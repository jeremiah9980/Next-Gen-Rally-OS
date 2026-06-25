import { Card } from '@rally/ui'
import { saveStandards } from '../../../actions/standards'
import { StandardsForm } from '../../../components/standards-form'
import { getActiveTeamSeason } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

type StandardsPageProps = {
  searchParams?: {
    status?: string
  }
}

export default async function StandardsPage({ searchParams }: StandardsPageProps) {
  const teamSeason = await getActiveTeamSeason()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          Standards
        </p>
        <h2 className="text-3xl font-semibold text-text-primary">
          Update team standards and goals
        </h2>
      </div>
      {searchParams?.status === 'saved' ? (
        <p className="text-sm text-accent-lime">Standards saved successfully.</p>
      ) : null}
      {searchParams?.status === 'error' ? (
        <p className="text-sm text-red-300">
          Unable to save standards. Check the form and try again.
        </p>
      ) : null}
      {teamSeason ? (
        <StandardsForm teamSeason={teamSeason} action={saveStandards} />
      ) : (
        <Card>
          <p className="text-text-muted">No active TeamSeason is available yet.</p>
        </Card>
      )}
    </div>
  )
}
