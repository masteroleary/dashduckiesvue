import { desc, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { subscriptions } from '../../db/schema'
import { requireUser } from '../../utils/session'
import { scheduleFor } from '../../utils/subscriptions'

// Restart a cancelled subscription, so changing your mind doesn't need an email.
export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const db = useDb()
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)

  if (!sub) throw createError({ statusCode: 404, statusMessage: 'No subscription found' })
  if (sub.status === 'active') return { ok: true, alreadyActive: true }

  await db
    .update(subscriptions)
    .set({ status: 'active', cancelledAt: null, skipNextShipment: false, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id))

  return { ok: true, ...scheduleFor(false) }
})
