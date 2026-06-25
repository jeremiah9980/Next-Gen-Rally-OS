'use server'

import { prisma } from '@rally/core-data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const standardsSchema = z.object({
  teamSeasonId: z.string().min(1),
  team_standards: z.string().trim().optional(),
  development_goals: z.string().trim().optional(),
  communication_expectations: z.string().trim().optional(),
})

export async function saveStandards(formData: FormData) {
  const parsed = standardsSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    team_standards: formData.get('team_standards') ?? '',
    development_goals: formData.get('development_goals') ?? '',
    communication_expectations: formData.get('communication_expectations') ?? '',
  })

  if (!parsed.success) {
    redirect('/standards?status=error')
  }

  try {
    await prisma.teamSeason.update({
      where: { id: parsed.data.teamSeasonId },
      data: {
        team_standards: parsed.data.team_standards || null,
        development_goals: parsed.data.development_goals || null,
        communication_expectations: parsed.data.communication_expectations || null,
      },
    })
  } catch {
    redirect('/standards?status=error')
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/standards')
  redirect('/standards?status=saved')
}
