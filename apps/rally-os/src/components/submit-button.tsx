'use client'

import { Button } from '@rally/ui'
import { useFormStatus } from 'react-dom'

type SubmitButtonProps = {
  children: React.ReactNode
}

export function SubmitButton({ children }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button disabled={pending} type="submit">
      {pending ? 'Saving…' : children}
    </Button>
  )
}
