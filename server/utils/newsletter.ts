import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../db'
import { emailSubscriptions, users } from '../db/schema'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateDiscountCode(): string {
  return `WELCOME10-${Math.floor(100000 + Math.random() * 900000)}`
}

// Subscribe an email (or reactivate) and return its discount code.
export async function subscribeEmail(email: string): Promise<string> {
  const db = useDb()
  const [existing] = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.email, email))
    .limit(1)
  if (existing) {
    if (!existing.isActive) {
      await db
        .update(emailSubscriptions)
        .set({ isActive: true, subscribedAt: new Date() })
        .where(eq(emailSubscriptions.id, existing.id))
    }
    return existing.discountCode || 'WELCOME10'
  }
  const discountCode = generateDiscountCode()
  await db.insert(emailSubscriptions).values({ email, discountCode, isActive: true })
  return discountCode
}

// Ensure a member user exists for this email (name_first = local part). Returns the user.
export async function ensureMemberFromEmail(email: string) {
  const db = useDb()
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(users)
    .values({ email, nameFirst: email.split('@')[0], isMember: true })
    .returning()
  return created
}
