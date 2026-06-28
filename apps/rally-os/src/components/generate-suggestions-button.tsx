'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@rally/ui'
import { generatePlayerSuggestions } from '../actions/practice-planning'

export function GenerateSuggestionsButton() {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const res = await generatePlayerSuggestions()
      if (res.ok) {
        setMessage(`Added ${res.created} advisory development focus item(s).`)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleClick} disabled={pending}>
        {pending ? 'Analyzing players…' : 'Generate development suggestions'}
      </Button>
      {message ? <p className="text-sm text-accent-lime">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
