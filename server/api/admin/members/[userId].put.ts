import { and, eq, isNull, ne } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/session'
import { useDb } from '../../../db'
import { users } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const userId = getRouterParam(event, 'userId') as string
  const body = await readBody(event)
  if (userId === admin.id && body?.isAdmin === false) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot remove your own admin role' })
  }
  const db = useDb()

  const set: Record<string, unknown> = {}
  if (body?.email !== undefined) {
    const email = String(body.email).trim().toLowerCase() || null
    if (email) {
      const [taken] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, userId), isNull(users.deletedAt)))
        .limit(1)
      if (taken) throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
    }
    set.email = email
  }
  if (body?.phoneNumber !== undefined) set.phoneNumber = String(body.phoneNumber).trim() || null
  if (body?.isMember !== undefined) set.isMember = Boolean(body.isMember)
  if (body?.isAdmin !== undefined) set.isAdmin = Boolean(body.isAdmin)

  if (Object.keys(set).length) {
    await db.update(users).set(set).where(eq(users.id, userId))
  }
  return { message: 'User updated successfully' }
})
