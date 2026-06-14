import { eq } from 'drizzle-orm'
import { requireUser } from '../../utils/session'
import { useDb } from '../../db'
import { users } from '../../db/schema'
import { accountDto } from '../../utils/account'

export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })
  return accountDto(user)
})
