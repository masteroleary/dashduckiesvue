import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '../db'
import { users } from '../db/schema'

// Public contact info: the admin's display name + photo (for the Contact page).
export default defineEventHandler(async () => {
  const db = useDb()
  const [admin] = await db
    .select({
      nameFirst: users.nameFirst,
      nameLast: users.nameLast,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .where(and(eq(users.isAdmin, true), isNull(users.deletedAt)))
    .limit(1)

  const name = admin
    ? [admin.nameFirst, admin.nameLast].filter(Boolean).join(' ').trim() || null
    : null
  return {
    name,
    profileImageUrl: admin?.profileImageUrl ?? null,
    email: process.env.SENDGRID_FROM_EMAIL || 'info@dashduckies.com',
  }
})
