import { and, desc, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { subscriptions } from '../../db/schema'
import { requireUser } from '../../utils/session'
import { PLAN_LABELS, scheduleFor } from '../../utils/subscriptions'

// The member's subscription plus the dates the portal is built around.
export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const db = useDb()
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)

  if (!sub) return { subscription: null }

  const schedule = scheduleFor(sub.skipNextShipment)
  return {
    subscription: {
      id: sub.id,
      plan: sub.plan,
      planLabel: PLAN_LABELS[sub.plan] ?? sub.plan,
      status: sub.status,
      skipNextShipment: sub.skipNextShipment,
      startedAt: sub.startedAt,
      cancelledAt: sub.cancelledAt,
    },
    ...schedule,
  }
})
