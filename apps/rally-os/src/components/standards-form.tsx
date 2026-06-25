'use client'

import { Card } from '@rally/ui'
import type { TeamSeasonFormData } from '../lib/portal-data'
import { SubmitButton } from './submit-button'

type StandardsFormProps = {
  teamSeason: TeamSeasonFormData
  action: (formData: FormData) => void | Promise<void>
}

const textareaClassName =
  'min-h-40 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-lime'

export function StandardsForm({ teamSeason, action }: StandardsFormProps) {
  return (
    <form action={action}>
      <input type="hidden" name="teamSeasonId" value={teamSeason.id} />
      <Card className="space-y-6">
        <label className="space-y-2 text-sm text-text-muted">
          <span>Team Standards</span>
          <textarea
            className={textareaClassName}
            defaultValue={teamSeason.team_standards ?? ''}
            name="team_standards"
          />
        </label>
        <label className="space-y-2 text-sm text-text-muted">
          <span>Development Goals</span>
          <textarea
            className={textareaClassName}
            defaultValue={teamSeason.development_goals ?? ''}
            name="development_goals"
          />
        </label>
        <label className="space-y-2 text-sm text-text-muted">
          <span>Communication Expectations</span>
          <textarea
            className={textareaClassName}
            defaultValue={teamSeason.communication_expectations ?? ''}
            name="communication_expectations"
          />
        </label>
        <div className="flex justify-end">
          <SubmitButton>Save Standards</SubmitButton>
        </div>
      </Card>
    </form>
  )
}
