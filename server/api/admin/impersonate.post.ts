import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { users } from '../../db/schema'
import { requireAdmin } from '../../utils/session'
import { issueToken, publicUser } from '../../utils/userAuth'
import { ADMIN_COOKIE, AUTH_COOKIE, sessionCookieOptions } from '../../utils/jwt'

// Admin-only: start impersonating a member. The admin's current session token
// is stashed in dd_admin_session so it can be restored later, and a freshly
// issued token for the target user becomes the active dd_session. Everything
// downstream (middleware, requireUser, etc.) reads dd_session, so the rest of
// the app sees the impersonated user with no further changes.
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const body = await readBody(event)
  const userId = String(body?.userId || '').trim()
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  if (userId === admin.id) {
    throw createError({ statusCode: 400, statusMessage: 'You are already signed in as this user' })
  }

  const adminToken = getCookie(event, AUTH_COOKIE)
  if (!adminToken) throw createError({ statusCode: 401, statusMessage: 'No active admin session' })

  const db = useDb()
  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Preserve the original admin token across nested impersonation so a single
  // "return to admin" always lands back on the real admin account.
  const stashedAdminToken = getCookie(event, ADMIN_COOKIE) || adminToken
  setCookie(event, ADMIN_COOKIE, stashedAdminToken, sessionCookieOptions())

  const token = await issueToken(target)
  setCookie(event, AUTH_COOKIE, token, sessionCookieOptions())

  return { ok: true, user: publicUser(target) }
})
