import { StubPage } from '../../../components/stub-page'

export default function CoachPage() {
  return (
    <StubPage
      title="Coach"
      description="Coaching staff bios, certifications, and philosophy — the content behind the public site's Coach module. Coach names are captured on Team Info today."
      related={[{ title: 'Team Info', href: '/team-info' }]}
    />
  )
}
