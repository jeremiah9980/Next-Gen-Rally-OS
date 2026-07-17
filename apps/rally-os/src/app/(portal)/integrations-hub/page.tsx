import { StubPage } from '../../../components/stub-page'

export default function IntegrationsHubPage() {
  return (
    <StubPage
      title="Integrations Hub"
      description="A single pane for connecting and monitoring external data sources — NCS polling status, GameChanger sync health, and future providers. Until it ships, each integration is managed on its own page."
      related={[
        { title: 'NCS Roster Dashboard', href: '/ncs-roster-dashboard' },
        { title: 'NCS Tournament Tracker', href: '/ncs-tournament-tracker' },
        { title: 'GameChanger', href: '/gamechanger' },
      ]}
    />
  )
}
