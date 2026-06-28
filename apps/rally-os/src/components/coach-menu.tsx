'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Avatar } from '@rally/ui'

type CoachMenuProps = {
  name: string
  email: string | null
}

export function CoachMenu({ name, email }: CoachMenuProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2">
      <Avatar name={name} />
      <div className="hidden text-right md:block">
        <p className="text-sm font-medium text-text-primary">{name}</p>
        <p className="text-xs text-text-muted">{email ?? 'Coach'}</p>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        aria-label="Sign out"
        title="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-text-muted transition hover:border-accent-purple/40 hover:bg-surface hover:text-text-primary"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
