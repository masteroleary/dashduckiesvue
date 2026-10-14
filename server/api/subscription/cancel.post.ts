import { desc, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { subscriptions } from '../../db/schema'
import { requireUser } from '../../utils/session'
import { scheduleFor } from '../../utils/subscriptions'

// Cancel. Allowed at any time, but if the cutoff has passed the upcoming box is
// already packed and still ships — so say that rather than implying otherwise.
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
  if (sub.status === 'cancelled') return { ok: true, alreadyCancelled: true }

  const schedule = scheduleFor(sub.skipNextShipment)
  await db
    .update(subscriptions)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id))

  return {
    ok: true,
    // True when one more box is already committed and will still arrive.
    finalBoxStillShips: !schedule.canChangeNextBox && !sub.skipNextShipment,
    finalBoxDate: schedule.nextShipDate,
  }
})
