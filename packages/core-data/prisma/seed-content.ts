import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'

/**
 * Seeds the predefined coaching content package (Elite Softball 4-Year
 * Mastermind): a global drill library (120 drills, 10U → 13U/14U) and 48
 * two-hour practice-plan templates. Global content has teamSeasonId = null,
 * so every organization sees it alongside its own drills and templates.
 *
 * Idempotent via fixed `mm-*` ids — safe to re-run after content updates.
 */
const prisma = new PrismaClient()

const CONTENT_DIR = join(__dirname, '..', 'content')
const LIBRARY_ID = 'mm-library'

type ContentDrill = {
  id: string
  name: string
  category: string
  durationMinutes: number
  description: string
  instructions: string
  equipment: string
  focusTags: string[]
}

type ContentPlan = {
  id: string
  name: string
  stage: string
  description: string
  blocks: { time: string; block: string; detail: string }[]
}

async function main() {
  const drills: ContentDrill[] = JSON.parse(
    readFileSync(join(CONTENT_DIR, 'mastermind-drills.json'), 'utf8'),
  )
  const plans: ContentPlan[] = JSON.parse(
    readFileSync(join(CONTENT_DIR, 'mastermind-practice-plans.json'), 'utf8'),
  )

  await prisma.drillLibrary.upsert({
    where: { id: LIBRARY_ID },
    update: { name: 'Elite Softball 4-Year Mastermind' },
    create: { id: LIBRARY_ID, name: 'Elite Softball 4-Year Mastermind', teamSeasonId: null },
  })

  for (const drill of drills) {
    const data = {
      drillLibraryId: LIBRARY_ID,
      name: drill.name,
      category: drill.category,
      durationMinutes: drill.durationMinutes,
      description: drill.description,
      instructions: drill.instructions,
      equipment: drill.equipment,
      focusTags: drill.focusTags,
      source: 'package',
    }
    await prisma.drill.upsert({ where: { id: drill.id }, update: data, create: { id: drill.id, ...data } })
  }
  console.log(`Seeded ${drills.length} drills into the Mastermind library.`)

  for (const plan of plans) {
    const data = {
      teamSeasonId: null,
      name: plan.name,
      description: plan.description,
      blocks: plan.blocks,
      source: 'package',
    }
    await prisma.practiceTemplate.upsert({
      where: { id: plan.id },
      update: data,
      create: { id: plan.id, ...data },
    })
  }
  console.log(`Seeded ${plans.length} practice-plan templates (10U foundation → 13U/14U transition).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
