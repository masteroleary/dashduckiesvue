import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../db'
import { emailSubscriptions, users } from '../../db/schema'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateDiscountCode(): string {
  return `WELCOME10-${Math.floor(100000 + Math.random() * 900000)}`
}

// Port of EmailSubscriptionService: subscribe + discount code, and (per the
// kept legacy behavior) auto-create a member User for the email if none exists.
async function ensureUserExists(db: ReturnType<typeof useDb>, email: string) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1)
  if (!existing) {
    await db.insert(users).values({
      email,
      nameFirst: email.split('@')[0],
      isMember: true,
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()

  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const db = useDb()
  const [existing] = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.email, email))
    .limit(1)

  let discountCode: string
  if (existing) {
    if (!existing.isActive) {
      await db
        .update(emailSubscriptions)
        .set({ isActive: true, subscribedAt: new Date() })
        .where(eq(emailSubscriptions.id, existing.id))
    }
    discountCode = existing.discountCode || 'WELCOME10'
  } else {
    discountCode = generateDiscountCode()
    await db.insert(emailSubscriptions).values({ email, discountCode, isActive: true })
  }

  await ensureUserExists(db, email)

  return {
    success: true,
    message: 'Thank you for subscribing! Check your email for the discount code.',
    discountCode,
  }
})
