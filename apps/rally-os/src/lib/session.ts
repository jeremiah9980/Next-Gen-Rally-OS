import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from './auth'

/** The signed-in coach, or null when there is no session. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

/** The signed-in coach's organization id, or null. */
export async function getCurrentOrganizationId() {
  const user = await getCurrentUser()
  return user?.organizationId ?? null
}

/** Require a signed-in coach; redirect to /login when absent. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
