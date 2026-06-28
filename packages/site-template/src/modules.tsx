import { Badge, Card, StatTile } from '@rally/ui'
import type { PublishedProjection } from './projection'

type P = { projection: PublishedProjection }

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-lime">{eyebrow}</p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function HomeModule({ projection }: P) {
  const home = projection.home
  return (
    <Section eyebrow={projection.organization.name} title={projection.team.name}>
      <Card className="space-y-3">
        <p className="text-lg font-semibold text-accent-lime">
          {home?.tagline ?? `${projection.team.season} • ${projection.team.age_group}`}
        </p>
        {home?.intro ? <p className="text-text-muted">{home.intro}</p> : null}
      </Card>
    </Section>
  )
}

export function TeamInfoModule({ projection }: P) {
  const info = projection.team_info
  if (!info) return null
  const rows = [
    ['Head Coach', info.head_coach],
    ['Practice Location', info.practice_location],
    ['Primary Game Location', info.primary_game_location],
  ].filter(([, v]) => Boolean(v))
  return (
    <Section eyebrow="Team Info" title="About the team">
      <Card className="grid gap-3 md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
            <p className="text-text-primary">{value}</p>
          </div>
        ))}
      </Card>
    </Section>
  )
}

export function StandardsModule({ projection }: P) {
  const s = projection.standards
  if (!s) return null
  const items = [
    ['Team Standards', s.team_standards],
    ['Development Goals', s.development_goals],
    ['Communication', s.communication_expectations],
  ].filter(([, v]) => Boolean(v))
  return (
    <Section eyebrow="Standards" title="What we stand for">
      <div className="grid gap-3 md:grid-cols-3">
        {items.map(([label, value]) => (
          <Card key={label} className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-lime">{label}</p>
            <p className="text-sm text-text-muted">{value}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function CoachModule({ projection }: P) {
  const coach = projection.coach
  if (!coach) return null
  return (
    <Section eyebrow="Coaching Staff" title="Meet the coaches">
      {coach.philosophy ? (
        <Card>
          <p className="text-text-muted">{coach.philosophy}</p>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {coach.staff.map((member) => (
          <Card key={member.name} className="space-y-1">
            <p className="font-semibold text-text-primary">{member.name}</p>
            <p className="text-sm text-text-muted">{member.role}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function RosterModule({ projection }: P) {
  const roster = projection.roster
  if (!roster) return null
  return (
    <Section eyebrow="Roster" title="The lineup">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roster.players.map((p) => (
          <Card key={`${p.name}-${p.jerseyNumber ?? ''}`} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text-primary">{p.name}</p>
              {p.position ? <p className="text-sm text-text-muted">{p.position}</p> : null}
            </div>
            {p.jerseyNumber ? <Badge>#{p.jerseyNumber}</Badge> : null}
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function PlayerProfilesModule({ projection }: P) {
  const profiles = projection.player_profiles
  if (!profiles) return null
  return (
    <Section eyebrow="Player Profiles" title="Get to know the athletes">
      <div className="grid gap-3 md:grid-cols-2">
        {profiles.profiles.map((p) => (
          <Card key={p.name} className="space-y-2">
            <p className="font-semibold text-text-primary">{p.name}</p>
            {p.bio ? <p className="text-sm text-text-muted">{p.bio}</p> : null}
            {p.highlights && p.highlights.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-text-muted">
                {p.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function ScheduleModule({ projection }: P) {
  const schedule = projection.schedule
  if (!schedule) return null
  return (
    <Section eyebrow="Schedule" title="Upcoming & results">
      <div className="space-y-2">
        {schedule.games.map((g, i) => (
          <Card key={i} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-text-primary">vs {g.opponent}</p>
              <p className="text-sm text-text-muted">
                {g.date}
                {g.time ? ` • ${g.time}` : ''}
                {g.location ? ` • ${g.location}` : ''}
              </p>
            </div>
            {g.result ? <Badge>{g.result}</Badge> : null}
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function TournamentsModule({ projection }: P) {
  const t = projection.tournaments
  if (!t) return null
  return (
    <Section eyebrow="Tournaments" title="Where we play">
      <div className="grid gap-3 md:grid-cols-2">
        {t.events.map((e, i) => (
          <Card key={i} className="space-y-1">
            <p className="font-semibold text-text-primary">{e.name}</p>
            <p className="text-sm text-text-muted">
              {e.location ?? 'Location TBD'}
              {e.startDate ? ` • ${e.startDate}${e.endDate ? `–${e.endDate}` : ''}` : ''}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function PracticePlansModule({ projection }: P) {
  const plans = projection.practice_plans
  if (!plans) return null
  return (
    <Section eyebrow="Practice Plans" title="What to expect at practice">
      <div className="space-y-3">
        {plans.plans.map((plan, i) => (
          <Card key={i} className="space-y-3">
            <p className="text-sm text-text-muted">
              {plan.practice_time ?? ''}
              {plan.practice_location ? ` • ${plan.practice_location}` : ''}
            </p>
            {plan.team_focus ? (
              <p className="font-semibold text-accent-lime">Focus: {plan.team_focus}</p>
            ) : null}
            {plan.practice_blocks && plan.practice_blocks.length > 0 ? (
              <ul className="space-y-1 text-sm text-text-muted">
                {plan.practice_blocks.map((b, j) => (
                  <li key={j}>
                    <span className="font-semibold text-text-primary">{b.time}</span> — {b.activity}
                  </li>
                ))}
              </ul>
            ) : null}
            {plan.equipment_to_bring && plan.equipment_to_bring.length > 0 ? (
              <p className="text-sm text-text-muted">
                Bring: {plan.equipment_to_bring.join(', ')}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function PlayerDevelopmentModule({ projection }: P) {
  const dev = projection.player_development
  if (!dev) return null
  return (
    <Section eyebrow="Player Development" title="How we grow">
      <div className="grid gap-3 md:grid-cols-2">
        {dev.focuses.map((f, i) => (
          <Card key={i} className="space-y-1">
            <p className="font-semibold text-text-primary">{f.title}</p>
            {f.detail ? <p className="text-sm text-text-muted">{f.detail}</p> : null}
          </Card>
        ))}
      </div>
    </Section>
  )
}

export function GameChangerStatsModule({ projection }: P) {
  const gc = projection.gamechanger_stats
  if (!gc) return null
  return (
    <Section eyebrow="GameChanger" title="Stats & clips">
      <div className="space-y-2">
        {gc.rows.map((r, i) => (
          <Card key={i} className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-text-primary">{r.name}</p>
            <div className="grid grid-cols-4 gap-2">
              <StatTile label="AVG" value={r.avg} />
              <StatTile label="AB" value={r.ab} />
              <StatTile label="RBI" value={r.rbi} />
              <StatTile label="HR" value={r.hr} />
            </div>
          </Card>
        ))}
        {gc.clips && gc.clips.length > 0 ? (
          <Card className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-lime">Clips</p>
            <ul className="list-inside list-disc text-sm text-accent-purple">
              {gc.clips.map((c, i) => (
                <li key={i}>
                  <a href={c.url} className="hover:underline">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </Section>
  )
}

export function SocialMediaHubModule({ projection }: P) {
  const social = projection.social_media_hub
  if (!social) return null
  return (
    <Section eyebrow="Social" title="Follow along">
      <div className="flex flex-wrap gap-3">
        {social.links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            className="rounded-full border border-accent-purple/50 px-4 py-2 text-sm text-text-primary transition hover:bg-accent-purple/10"
          >
            {l.label}
          </a>
        ))}
      </div>
    </Section>
  )
}

export function FundraisingModule({ projection }: P) {
  const fund = projection.fundraising
  if (!fund) return null
  return (
    <Section eyebrow="Fundraising" title="Support the team">
      <div className="grid gap-3 md:grid-cols-2">
        {fund.campaigns.map((c, i) => (
          <Card key={i} className="space-y-2">
            <p className="font-semibold text-text-primary">{c.title}</p>
            {c.goal ? <p className="text-sm text-accent-lime">Goal: {c.goal}</p> : null}
            {c.url ? (
              <a href={c.url} className="text-sm text-accent-purple hover:underline">
                Contribute →
              </a>
            ) : null}
          </Card>
        ))}
      </div>
    </Section>
  )
}
