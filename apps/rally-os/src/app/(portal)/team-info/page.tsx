import { Card } from '@rally/ui'
import { saveTeamInfo } from '../../../actions/team-info'
import { TeamInfoForm } from '../../../components/team-info-form'
import { getActiveTeamSeason } from '../../../lib/portal-data'

export const dynamic = 'force-dynamic'

type TeamInfoPageProps = {
  searchParams?: {
    status?: string
  }
}

export default async function TeamInfoPage({ searchParams }: TeamInfoPageProps) {
  const teamSeason = await getActiveTeamSeason()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          Team Info
        </p>
        <h2 className="text-3xl font-semibold text-text-primary">Edit active TeamSeason details</h2>
      </div>
      {searchParams?.status === 'saved' ? (
        <p className="text-sm text-accent-lime">Team info saved successfully.</p>
      ) : null}
      {searchParams?.status === 'error' ? (
        <p className="text-sm text-red-300">Unable to save team info. Check the form and try again.</p>
      ) : null}
      {teamSeason ? (
        <TeamInfoForm teamSeason={teamSeason} action={saveTeamInfo} />
      ) : (
        <Card>
          <p className="text-text-muted">No active TeamSeason is available yet.</p>
        </Card>
      )}
    </div>
  )
}
