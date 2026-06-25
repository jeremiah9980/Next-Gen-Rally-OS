'use client'

import { Button, Card } from '@rally/ui'
import type { TeamSeasonFormData } from '../lib/portal-data'
import { SubmitButton } from './submit-button'

type TeamInfoFormProps = {
  teamSeason: TeamSeasonFormData
  action: (formData: FormData) => void | Promise<void>
}

const inputClassName =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-lime'

export function TeamInfoForm({ teamSeason, action }: TeamInfoFormProps) {
  return (
    <form action={action}>
      <input type="hidden" name="teamSeasonId" value={teamSeason.id} />
      <Card className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-text-muted">
            <span>Team Name</span>
            <input className={inputClassName} defaultValue={teamSeason.team_name} name="team_name" />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            <span>Season</span>
            <input className={inputClassName} defaultValue={teamSeason.season} name="season" />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            <span>Age Group</span>
            <input className={inputClassName} defaultValue={teamSeason.age_group} name="age_group" />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            <span>Organization</span>
            <input
              className={inputClassName}
              defaultValue={teamSeason.organization ?? ''}
              name="organization"
            />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            <span>Head Coach</span>
            <input
              className={inputClassName}
              defaultValue={teamSeason.head_coach ?? ''}
              name="head_coach"
            />
          </label>
          <label className="space-y-2 text-sm text-text-muted">
            <span>Practice Location</span>
            <input
              className={inputClassName}
              defaultValue={teamSeason.practice_location ?? ''}
              name="practice_location"
            />
          </label>
          <label className="space-y-2 text-sm text-text-muted md:col-span-2">
            <span>Assistant Coaches</span>
            <textarea
              className={`${inputClassName} min-h-24`}
              defaultValue={teamSeason.assistant_coaches ?? ''}
              name="assistant_coaches"
            />
          </label>
          <label className="space-y-2 text-sm text-text-muted md:col-span-2">
            <span>Primary Game Location</span>
            <input
              className={inputClassName}
              defaultValue={teamSeason.primary_game_location ?? ''}
              name="primary_game_location"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost">
            Review
          </Button>
          <SubmitButton>Save Team Info</SubmitButton>
        </div>
      </Card>
    </form>
  )
}
