import { eq } from 'drizzle-orm'
import { useDb } from '../db'
import { users } from '../db/schema'

// On server startup, ensure the configured ADMIN_ACCOUNT_EMAIL user exists and
// is flagged as admin + member (replaces the old DbInitializer admin seeding).
export default defineNitroPlugin(async () => {
  const email = process.env.ADMIN_ACCOUNT_EMAIL?.trim().toLowerCase()
  if (!email) return
  try {
    const db = useDb()
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      if (!existing.isAdmin || !existing.isMember) {
        await db.update(users).set({ isAdmin: true, isMember: true }).where(eq(users.id, existing.id))
      }
    } else {
      await db.insert(users).values({ email, isAdmin: true, isMember: true, nameFirst: 'Admin' })
    }
    console.log(`[admin-init] ensured admin user ${email}`)
  } catch (e: any) {
    console.error('[admin-init] failed:', e?.message || e)
  }
})
