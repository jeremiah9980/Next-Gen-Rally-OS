'use server'

import { prisma } from '@rally/core-data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const teamInfoSchema = z.object({
  teamSeasonId: z.string().min(1),
  team_name: z.string().trim().min(1),
  season: z.string().trim().min(1),
  age_group: z.string().trim().min(1),
  organization: z.string().trim().optional(),
  head_coach: z.string().trim().optional(),
  assistant_coaches: z.string().trim().optional(),
  practice_location: z.string().trim().optional(),
  primary_game_location: z.string().trim().optional(),
})

export async function saveTeamInfo(formData: FormData) {
  const parsed = teamInfoSchema.safeParse({
    teamSeasonId: formData.get('teamSeasonId'),
    team_name: formData.get('team_name'),
    season: formData.get('season'),
    age_group: formData.get('age_group'),
    organization: formData.get('organization') ?? '',
    head_coach: formData.get('head_coach') ?? '',
    assistant_coaches: formData.get('assistant_coaches') ?? '',
    practice_location: formData.get('practice_location') ?? '',
    primary_game_location: formData.get('primary_game_location') ?? '',
  })

  if (!parsed.success) {
    redirect('/team-info?status=error')
  }

  try {
    await prisma.teamSeason.update({
      where: { id: parsed.data.teamSeasonId },
      data: {
        team_name: parsed.data.team_name,
        season: parsed.data.season,
        age_group: parsed.data.age_group,
        organization: parsed.data.organization || null,
        head_coach: parsed.data.head_coach || null,
        assistant_coaches: parsed.data.assistant_coaches || null,
        practice_location: parsed.data.practice_location || null,
        primary_game_location: parsed.data.primary_game_location || null,
      },
    })
  } catch {
    redirect('/team-info?status=error')
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/team-info')
  redirect('/team-info?status=saved')
}
