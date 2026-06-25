'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@rally/ui'
import { updateNcsChangeReview } from '../../../actions/ncs-change-review'

type Props = {
  reviewId: string
}

export function ReviewActionForm({ reviewId }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAction(action: 'accept' | 'ignore') {
    startTransition(async () => {
      setError(null)
      const formData = new FormData()
      formData.append('reviewId', reviewId)
      formData.append('action', action)

      const result = await updateNcsChangeReview(formData)
      if (!result.success) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleAction('accept')} disabled={isPending}>
          {isPending ? 'Saving…' : 'Accept'}
        </Button>
        <Button variant="ghost" onClick={() => handleAction('ignore')} disabled={isPending}>
          Ignore
        </Button>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
