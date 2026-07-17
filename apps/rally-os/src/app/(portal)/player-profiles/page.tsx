import { StubPage } from '../../../components/stub-page'

export default function PlayerProfilesPage() {
  return (
    <StubPage
      title="Player Profiles"
      description="Rich per-player pages combining roster data, GameChanger stat history, development focuses, and coach notes. Roster and stat data are already collected — this page will bring them together per athlete."
      related={[
        { title: 'Roster', href: '/roster' },
        { title: 'Player Development', href: '/player-development' },
        { title: 'GameChanger', href: '/gamechanger' },
      ]}
    />
  )
}
