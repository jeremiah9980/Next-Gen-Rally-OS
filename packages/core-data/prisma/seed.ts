import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Demo coach credentials — override via env when seeding a real environment.
const COACH_EMAIL = (process.env.SEED_COACH_EMAIL ?? 'coach@example.com').toLowerCase()
const COACH_PASSWORD = process.env.SEED_COACH_PASSWORD ?? 'password123'
const COACH_NAME = process.env.SEED_COACH_NAME ?? 'Demo Coach'

// Fixed ids keep the seed idempotent (safe to run repeatedly).
const ORG_ID = 'seed-demo-org'
const TEAM_ID = 'seed-demo-team'
const SEASON_ID = 'seed-demo-season'

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: { name: 'Demo Organization' },
    create: { id: ORG_ID, name: 'Demo Organization', slug: 'demo-org' },
  })

  const passwordHash = await hash(COACH_PASSWORD, 10)
  const coach = await prisma.user.upsert({
    where: { email: COACH_EMAIL },
    update: { passwordHash, organizationId: organization.id, role: 'COACH', name: COACH_NAME },
    create: {
      email: COACH_EMAIL,
      name: COACH_NAME,
      passwordHash,
      role: 'COACH',
      organizationId: organization.id,
    },
  })

  await prisma.team.upsert({
    where: { id: TEAM_ID },
    update: { name: 'Demo Team', organizationId: organization.id },
    create: { id: TEAM_ID, name: 'Demo Team', organizationId: organization.id },
  })

  await prisma.teamSeason.upsert({
    where: { id: SEASON_ID },
    update: { teamId: TEAM_ID, isActive: true },
    create: {
      id: SEASON_ID,
      teamId: TEAM_ID,
      isActive: true,
      team_name: 'Demo Team',
      season: '2026 Spring',
      age_group: '12U',
      organization: organization.name,
      head_coach: COACH_NAME,
    },
  })

  console.log('Seed complete.')
  console.log(`  Organization: ${organization.name} (${organization.slug})`)
  console.log(`  Coach login:  ${coach.email} / ${COACH_PASSWORD}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
