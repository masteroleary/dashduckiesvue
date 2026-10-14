import { and, eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { subscriptions, users } from '../../../db/schema'
import { requireAdmin } from '../../../utils/session'

// Admin-created, because there is no checkout yet — subscriptions are arranged by
// hand, which is what the public pages tell people.
const PLANS = ['monthly', 'six_month', 'twelve_month'] as const

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const userId = String(body?.userId || '').trim()
  const plan = String(body?.plan || 'monthly')

  if (!userId) throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  if (!PLANS.includes(plan as (typeof PLANS)[number])) {
    throw createError({ statusCode: 400, statusMessage: `plan must be one of: ${PLANS.join(', ')}` })
  }

  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'That member already has an active subscription.' })
  }

  const [created] = await db
    .insert(subscriptions)
    .values({ userId, plan: plan as (typeof PLANS)[number] })
    .returning()
  return { ok: true, subscription: created }
})
