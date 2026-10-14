import { desc, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { subscriptions } from '../../db/schema'
import { requireUser } from '../../utils/session'
import { scheduleFor } from '../../utils/subscriptions'

// Skip (or un-skip) the upcoming box. Only allowed before the cutoff — after that
// the box is packed, so honouring it here would be a promise we can't keep.
export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const body = await readBody(event)
  const skip = Boolean(body?.skip)

  const db = useDb()
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)

  if (!sub) throw createError({ statusCode: 404, statusMessage: 'No subscription found' })
  if (sub.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This subscription is not active.' })
  }

  // Check against the schedule the member is currently looking at.
  if (!scheduleFor(sub.skipNextShipment).canChangeNextBox) {
    throw createError({
      statusCode: 409,
      statusMessage: 'The cutoff for your next box has passed, so it is already on its way.',
    })
  }

  await db
    .update(subscriptions)
    .set({ skipNextShipment: skip, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id))

  return { ok: true, skipNextShipment: skip, ...scheduleFor(skip) }
})
