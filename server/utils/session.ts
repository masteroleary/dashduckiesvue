import { createError, type H3Event } from 'h3'

export interface SessionUser {
  id: string
  email: string | null
  phone: string | null
  name?: string | null
  isAdmin: boolean
  isMember: boolean
}

// Throws 401 if no authenticated user is attached by server/middleware/auth.ts.
export function requireUser(event: H3Event): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  return user
}

export function requireAdmin(event: H3Event): SessionUser {
  const user = requireUser(event)
  if (!user.isAdmin) throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  return user
}
