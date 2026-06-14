import { eq } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { userOwnsDuck } from '../../utils/member'
import { useDb } from '../../db'
import { ducks } from '../../db/schema'

// Soft-delete a duck you discovered first (sets deleted_at; keeps history).
export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = getRouterParam(event, 'id') as string

  if (!(await userOwnsDuck(user.id, id))) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only delete ducks that you discovered first.',
    })
  }

  const db = useDb()
  await db.update(ducks).set({ deletedAt: new Date() }).where(eq(ducks.id, id))
  return { ok: true }
})
