import { PracticePlanBuilder } from '../../../components/practice-plan-builder'

export const dynamic = 'force-dynamic'

export default function PracticePlanningPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-lime">
          Practice Planning
        </p>
        <h2 className="text-3xl font-semibold text-text-primary">AI practice plan builder</h2>
        <p className="text-text-muted">
          Generate a structured plan in two versions — a full coach plan and a player-safe plan
          that never includes private notes. Drills and templates are saved to the reusable library.
        </p>
      </div>
      <PracticePlanBuilder />
    </div>
  )
}
